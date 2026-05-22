"""LLM Provider 管理 — 多 Provider + 自动 Fallback"""
from __future__ import annotations

import asyncio
import hashlib
import json
from typing import Any, Optional

from langchain_core.language_models import BaseChatModel
from langchain_openai import ChatOpenAI

from .config import ProviderConfig, Settings
from .errors import LLMError, LLMFallbackExhausted
from .logger import log

_NON_RETRYABLE = (KeyboardInterrupt, SystemExit, asyncio.CancelledError, GeneratorExit)


class LLMManager:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._cache: dict[str, ChatOpenAI] = {}
        self._provider_timeout = float(settings.risk_control.max_retries_on_fail * 30) if hasattr(settings, 'risk_control') else 90.0

    def get(self, task: str, *, temperature: float = 0.7, **kwargs: Any) -> BaseChatModel:
        provider, model = self._settings.resolve_model(task)
        return self._build(provider, model, temperature, **kwargs)

    def get_by_provider(self, provider_name: str, model: str, *, temperature: float = 0.7, **kwargs: Any) -> BaseChatModel:
        provider = self._find_provider(provider_name)
        return self._build(provider, model, temperature, **kwargs)

    async def invoke_with_fallback(self, messages: list, task: str = "content_generation", **kwargs: Any) -> str:
        errors: list[tuple[str, Exception]] = []

        primary, model = self._settings.resolve_model(task)
        providers_to_try = [primary] + self._settings.fallback_providers()

        for provider in providers_to_try:
            tier = getattr(self._settings.task_routing, task, "fast")
            model_name = provider.models.get(tier) or (next(iter(provider.models.values())) if provider.models else model)
            try:
                llm = self._build(provider, model_name, **kwargs)
                resp = await asyncio.wait_for(
                    llm.ainvoke(messages),
                    timeout=self._provider_timeout
                )
                return resp.content
            except _NON_RETRYABLE:
                raise
            except asyncio.TimeoutError:
                log.warning("LLM timeout [%s/%s]: %.0fs exceeded", provider.name, model_name, self._provider_timeout)
                errors.append((f"{provider.name}/{model_name}", TimeoutError(f"timed out after {self._provider_timeout}s")))
            except Exception as exc:
                log.warning("LLM call failed [%s/%s]: %s", provider.name, model_name, exc)
                errors.append((f"{provider.name}/{model_name}", exc))

        raise LLMFallbackExhausted(
            f"All providers failed: {[(n, str(e)[:80]) for n, e in errors]}"
        )

    def _find_provider(self, name: str) -> ProviderConfig:
        for p in self._settings.providers:
            if p.name == name:
                return p
        raise LLMError(f"Unknown provider: {name}")

    def _build(self, provider: ProviderConfig, model: str, temperature: float = 0.7, **kwargs: Any) -> ChatOpenAI:
        filtered_kwargs = {k: v for k, v in kwargs.items() if k != "temperature"}
        hash_input = json.dumps({"model": model, "temp": temperature, "base": provider.base_url, **filtered_kwargs}, sort_keys=True, default=str)
        cache_key = hashlib.md5(hash_input.encode()).hexdigest()[:12]

        if cache_key not in self._cache:
            self._cache[cache_key] = ChatOpenAI(
                model=model,
                base_url=provider.base_url,
                api_key=provider.api_key,
                temperature=temperature,
                max_retries=2,
                request_timeout=60,
                **filtered_kwargs,
            )
        return self._cache[cache_key]
