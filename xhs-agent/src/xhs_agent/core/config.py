"""配置管理 — YAML 驱动，支持环境变量覆盖"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import yaml

from .errors import ConfigError

_CONFIG_DIR: Path | None = None


def _get_config_dir() -> Path:
    global _CONFIG_DIR
    if _CONFIG_DIR is None:
        override = os.environ.get("XHS_AGENT_CONFIG_DIR")
        if override:
            _CONFIG_DIR = Path(override)
        else:
            _CONFIG_DIR = Path(__file__).resolve().parent.parent.parent.parent / "config"
    return _CONFIG_DIR


def set_config_dir(path: str | Path) -> None:
    global _CONFIG_DIR
    _CONFIG_DIR = Path(path)


@dataclass
class ProviderConfig:
    name: str
    base_url: str
    api_key_env: str
    models: dict[str, str] = field(default_factory=dict)

    @property
    def api_key(self) -> str:
        key = os.environ.get(self.api_key_env, "")
        if not key:
            raise ConfigError(f"Missing env var: {self.api_key_env}")
        return key

    def validate(self) -> None:
        if not self.name:
            raise ConfigError("Provider name is required")
        if not self.base_url:
            raise ConfigError(f"Provider {self.name}: base_url is required")
        if not self.models:
            raise ConfigError(f"Provider {self.name}: at least one model is required")


@dataclass
class TaskRouting:
    topic_research: str = "fast"
    content_generation: str = "quality"
    style_formatting: str = "fast"
    banned_word_check: str = "fast"
    customer_service: str = "fast"
    data_analysis: str = "fast"


@dataclass
class ScheduleConfig:
    topic_monitor_hours: int = 6
    daily_publish_count: int = 1
    publish_interval_minutes: int = 10


@dataclass
class AntiDetectionConfig:
    enabled: bool = True
    min_operation_delay: int = 2
    max_operation_delay: int = 8
    daily_max_api_calls: int = 50
    daily_max_publish: int = 1
    daily_max_replies: int = 30
    reply_min_interval: int = 3
    reply_max_interval: int = 12
    publish_minute_avoid: tuple = (0, 30)
    human_like_typing: bool = True
    random_scroll: bool = True
    mouse_trajectory: bool = True


@dataclass
class RiskControl:
    daily_publish_count: int = 1
    publish_interval_min: int = 5
    publish_interval_max: int = 15
    auto_reply_comments: bool = False
    banned_word_check: str = "full"
    content_safety_threshold: float = 0.6
    max_retries_on_fail: int = 3
    anti_detection: AntiDetectionConfig = field(default_factory=AntiDetectionConfig)


@dataclass
class Settings:
    providers: list[ProviderConfig] = field(default_factory=list)
    task_routing: TaskRouting = field(default_factory=TaskRouting)
    schedule: ScheduleConfig = field(default_factory=ScheduleConfig)
    risk_control: RiskControl = field(default_factory=RiskControl)
    cookie_path: str = ""
    niche: str = "AI工具"
    data_dir: str = ""
    debug: bool = False

    def primary_provider(self) -> ProviderConfig:
        if not self.providers:
            raise ConfigError("No providers configured")
        return self.providers[0]

    def fallback_providers(self) -> list[ProviderConfig]:
        return self.providers[1:] if len(self.providers) > 1 else self.providers[:0]

    def resolve_model(self, task: str) -> tuple[ProviderConfig, str]:
        tier = getattr(self.task_routing, task, "fast")
        for p in self.providers:
            if tier in p.models:
                return p, p.models[tier]
        p = self.primary_provider()
        if not p.models:
            raise ConfigError(f"Provider {p.name} has no models configured")
        return p, p.models.get("fast", next(iter(p.models.values())))


def load_settings(config_dir: Optional[Path] = None) -> Settings:
    config_dir = config_dir or _get_config_dir()

    providers_file = config_dir / "providers.yaml"
    providers: list[ProviderConfig] = []
    if providers_file.exists():
        try:
            raw = yaml.safe_load(providers_file.read_text(encoding="utf-8")) or {}
        except yaml.YAMLError as exc:
            raise ConfigError(f"Invalid YAML in {providers_file}: {exc}") from exc
        for i, entry in enumerate(raw.get("providers", [])):
            if not isinstance(entry, dict):
                raise ConfigError(f"providers[{i}]: expected dict, got {type(entry).__name__}")
            pc = ProviderConfig(
                name=entry.get("name", ""),
                base_url=entry.get("base_url", ""),
                api_key_env=entry.get("api_key_env", f"XHS_AGENT_{entry.get('name', '').upper()}_KEY"),
                models=entry.get("models", {}),
            )
            pc.validate()
            providers.append(pc)

    settings_file = config_dir / "settings.yaml"
    raw_settings: dict[str, Any] = {}
    if settings_file.exists():
        try:
            raw_settings = yaml.safe_load(settings_file.read_text(encoding="utf-8")) or {}
        except yaml.YAMLError as exc:
            raise ConfigError(f"Invalid YAML in {settings_file}: {exc}") from exc

    routing_raw = raw_settings.get("task_routing", {})
    schedule_raw = raw_settings.get("schedule", {})
    risk_raw = raw_settings.get("risk_control", {})

    ad_raw = risk_raw.pop("anti_detection", {}) if isinstance(risk_raw, dict) else {}
    anti_detection = AntiDetectionConfig(**{k: v for k, v in ad_raw.items()
                                              if hasattr(AntiDetectionConfig, k)})

    return Settings(
        providers=providers,
        task_routing=TaskRouting(**{k: v for k, v in routing_raw.items()
                                    if hasattr(TaskRouting, k)}),
        schedule=ScheduleConfig(**{k: v for k, v in schedule_raw.items()
                                    if hasattr(ScheduleConfig, k)}),
        risk_control=RiskControl(anti_detection=anti_detection, **{k: v for k, v in risk_raw.items()
                                     if hasattr(RiskControl, k) and k != "anti_detection"}),
        cookie_path=os.environ.get(
            "XHS_COOKIE_PATH",
            raw_settings.get("cookie_path", ""),
        ),
        niche=raw_settings.get("niche", "AI工具"),
        data_dir=raw_settings.get("data_dir", str(config_dir.parent / "data")),
        debug=raw_settings.get("debug", False),
    )
