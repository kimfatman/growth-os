"""Cookie 管理 + 签名"""
from __future__ import annotations

import json
import os
import tempfile
import time
from pathlib import Path
from typing import Optional

from xhs_agent.core.errors import AuthError
from xhs_agent.core.logger import log


class CookieManager:
    def __init__(self, cookie_path: str) -> None:
        self._path = Path(cookie_path)
        self._cookies: dict[str, str] = {}
        self._loaded_at: float = 0
        self._max_age: float = 3600 * 24

    @property
    def cookies(self) -> dict[str, str]:
        if not self._cookies:
            self.load()
        return self._cookies

    def load(self) -> dict[str, str]:
        if not self._path.exists():
            raise AuthError(f"Cookie file not found: {self._path}")
        try:
            raw = json.loads(self._path.read_text(encoding="utf-8"))
            if not isinstance(raw, list):
                raise AuthError(f"Cookie file must be a JSON array, got {type(raw).__name__}")
            cookie_map: dict[str, str] = {}
            for i, entry in enumerate(raw):
                if not isinstance(entry, dict):
                    log.warning("Cookie entry %d is not a dict, skipping", i)
                    continue
                name = entry.get("name")
                value = entry.get("value")
                if not name or value is None:
                    log.warning("Cookie entry %d missing 'name' or 'value', skipping", i)
                    continue
                if name in cookie_map:
                    log.warning("Duplicate cookie name '%s', overwriting", name)
                cookie_map[name] = value
            self._cookies = cookie_map
            self._loaded_at = time.time()
            log.info("Loaded %d cookies from %s", len(self._cookies), self._path)
            return self._cookies
        except json.JSONDecodeError as exc:
            raise AuthError(f"Invalid cookie file (JSON parse error): {exc}") from exc

    def is_expired(self) -> bool:
        if not self._loaded_at:
            return True
        return (time.time() - self._loaded_at) > self._max_age

    def save(self, cookies: list[dict]) -> None:
        content = json.dumps(cookies, ensure_ascii=False, indent=2)
        tmp = self._path.with_suffix(".tmp")
        try:
            tmp.write_text(content, encoding="utf-8")
            tmp.replace(self._path)
        except OSError:
            tmp.unlink(missing_ok=True)
            raise
        self._cookies = {c["name"]: c["value"] for c in cookies if "name" in c and "value" in c}
        self._loaded_at = time.time()
        log.info("Saved %d cookies to %s", len(self._cookies), self._path)

    def get(self, name: str, default: str = "") -> str:
        return self.cookies.get(name, default)
