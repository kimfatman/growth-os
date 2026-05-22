"""小红书 Web API 客户端 — 生产级封装"""
from __future__ import annotations

import asyncio
import platform
import random
from typing import Any, Literal, Optional

import httpx

from xhs_agent.core.errors import AuthError, PlatformError, RateLimitError
from xhs_agent.core.logger import log
from .auth import CookieManager

_ALLOWED_METHODS = ("GET", "POST")
_RETRYABLE_STATUS = (429, 500, 502, 503, 504)
_MAX_RETRIES = 3
_BASE_BACKOFF = 1.0

_WINDOWS_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
)
_LINUX_UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
)


def _get_ua() -> str:
    return _WINDOWS_UA if platform.system() == "Windows" else _LINUX_UA


class XHSClient:
    BASE_URL = "https://edith.xiaohongshu.com"

    def __init__(self, cookie_manager: CookieManager) -> None:
        self._auth = cookie_manager
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={
                    "User-Agent": _get_ua(),
                    "Origin": "https://www.xiaohongshu.com",
                    "Referer": "https://www.xiaohongshu.com/",
                },
                timeout=30.0,
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _request(self, method: Literal["GET", "POST"], path: str, *, params: Optional[dict] = None, json_body: Optional[dict] = None, retries: int = _MAX_RETRIES) -> dict[str, Any]:
        if method not in _ALLOWED_METHODS:
            raise PlatformError(f"Unsupported HTTP method: {method}")

        url = f"{self.BASE_URL}{path}"
        last_exc: Optional[Exception] = None

        for attempt in range(retries + 1):
            try:
                client = await self._get_client()
                cookies = self._auth.cookies
                if method == "GET":
                    resp = await client.get(url, params=params, cookies=cookies)
                elif method == "POST":
                    resp = await client.post(url, json=json_body, params=params, cookies=cookies)
            except httpx.TimeoutException as exc:
                last_exc = PlatformError(f"Request timeout: {url}")
                if attempt < retries:
                    await self._backoff(attempt)
                    continue
                raise last_exc from exc
            except httpx.HTTPError as exc:
                last_exc = PlatformError(f"HTTP error: {exc}")
                if attempt < retries:
                    await self._backoff(attempt)
                    continue
                raise last_exc from exc

            if resp.status_code == 401:
                raise AuthError("Cookie expired or invalid")
            if resp.status_code == 429:
                if attempt < retries:
                    log.warning("Rate limited (attempt %d/%d), backing off", attempt + 1, retries + 1)
                    await self._backoff(attempt, multiplier=3.0)
                    continue
                raise RateLimitError("Rate limited by XHS after retries")
            if resp.status_code in _RETRYABLE_STATUS and attempt < retries:
                log.warning("HTTP %d (attempt %d/%d), retrying", resp.status_code, attempt + 1, retries + 1)
                await self._backoff(attempt)
                continue
            if resp.status_code >= 400:
                raise PlatformError(f"HTTP {resp.status_code}: {resp.text[:200]}")

            try:
                data = resp.json()
            except (json.JSONDecodeError, ValueError) as exc:
                raise PlatformError(
                    f"Invalid JSON from {method} {path} (HTTP {resp.status_code}): {resp.text[:100]}"
                ) from exc

            if not data.get("success", True):
                code = data.get("code", "unknown")
                msg = data.get("msg", data.get("message", "unknown error"))
                if code in (-1, "NEED_LOGIN", "AUTH_FAILED"):
                    raise AuthError(f"Auth failed: {msg}")
                raise PlatformError(f"API error [{code}]: {msg}")

            return data

        raise last_exc or PlatformError(f"Request failed after {retries + 1} attempts")

    @staticmethod
    async def _backoff(attempt: int, multiplier: float = 1.0) -> None:
        delay = _BASE_BACKOFF * (2 ** attempt) * multiplier
        jitter = random.uniform(0, delay * 0.3)
        await asyncio.sleep(delay + jitter)

    async def get_user_info(self) -> dict:
        return await self._request("GET", "/api/sns/web/v1/user/selfinfo")

    async def search_notes(self, keyword: str, page: int = 1, sort: str = "general", page_size: int = 20) -> dict:
        return await self._request("GET", "/api/sns/web/v1/search/notes", params={
            "keyword": keyword, "page": page, "sort": sort, "page_size": page_size,
        })

    async def get_note(self, note_id: str) -> dict:
        return await self._request("POST", "/api/sns/web/v1/feed", json_body={
            "source_note_id": note_id,
        })

    async def get_hot_topics(self) -> dict:
        return await self._request("GET", "/api/sns/web/v1/search/hot", params={
            "source": "search_box",
        })

    async def get_user_notes(self, user_id: str, cursor: str = "") -> dict:
        return await self._request("GET", "/api/sns/web/v1/user_posted", params={
            "user_id": user_id, "cursor": cursor, "num": 30,
        })

    async def get_comments(self, note_id: str, cursor: str = "") -> dict:
        return await self._request("GET", "/api/sns/web/v2/comment/page", params={
            "note_id": note_id, "cursor": cursor, "top_comment_id": "",
            "image_formats": "jpg,webp,avif",
        })

    async def get_notifications(self) -> dict:
        return await self._request("GET", "/api/sns/web/v1/you/notifications")
