"""发布 Skill — 通过 CDP 控制 Chromium 发布笔记到小红书 Web 端"""
from __future__ import annotations

import asyncio
import base64
import json
import math
import os
import random
import tempfile
from typing import Any, Optional

import websockets

from xhs_agent.core.errors import PublishError
from xhs_agent.core.logger import log
from xhs_agent.platform.models import Note, PublishStatus
from xhs_agent.skills.base import BaseSkill

_ESCAPE_TRANSLATOR = str.maketrans({
    "\\": "\\\\",
    "'": "\\'",
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t",
})


def _js_str(s: str) -> str:
    return s.translate(_ESCAPE_TRANSLATOR)


def _human_delay(min_s: float = 0.3, max_s: float = 1.8) -> float:
    return random.uniform(min_s, max_s)


def _bezier_path(x1: float, y1: float, x2: float, y2: float, steps: int = 8) -> list[tuple[float, float]]:
    cx = (x1 + x2) / 2 + random.uniform(-30, 30)
    cy = (y1 + y2) / 2 + random.uniform(-30, 30)
    points = []
    for i in range(steps + 1):
        t = i / steps
        mt = 1 - t
        x = mt * mt * x1 + 2 * mt * t * cx + t * t * x2
        y = mt * mt * y1 + 2 * mt * t * cy + t * t * y2
        points.append((round(x, 1), round(y, 1)))
    return points


class CDPController:
    def __init__(self, cdp_url: str = "http://localhost:9222") -> None:
        self._cdp_url = cdp_url
        self._ws: Optional[Any] = None
        self._msg_id = 0
        self._viewport = {"width": 1440, "height": 900}

    async def _get_tab(self, url_contains: str = "") -> dict:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{self._cdp_url}/json")
            tabs = resp.json()

        if url_contains:
            for tab in tabs:
                if url_contains in tab.get("url", ""):
                    return tab

        for tab in tabs:
            if tab.get("type") == "page":
                return tab

        raise PublishError("No available browser tab - ensure Chrome is running with --remote-debugging-port=9222")

    async def connect(self, url_contains: str = "") -> None:
        tab = await self._get_tab(url_contains)
        ws_url = tab["webSocketDebuggerUrl"]
        self._ws = await websockets.connect(ws_url, max_size=2**22)
        await self.send("Page.enable")
        result = await self.send("Runtime.evaluate", {"expression": "({w: window.innerWidth, h: window.innerHeight})"})
        dims = result.get("result", {}).get("result", {}).get("value", {})
        if dims:
            self._viewport = dims
        log.info("CDP connected to: %s (viewport: %s)", tab.get("url", "unknown"), self._viewport)

    async def close(self) -> None:
        if self._ws:
            await self._ws.close()

    async def send(self, method: str, params: Optional[dict] = None) -> dict:
        if not self._ws:
            raise PublishError("CDP not connected")
        self._msg_id += 1
        msg_id = self._msg_id
        msg = {"id": msg_id, "method": method, "params": params or {}}
        await self._ws.send(json.dumps(msg))
        while True:
            try:
                resp = json.loads(await self._ws.recv())
            except (json.JSONDecodeError, websockets.ConnectionClosed) as exc:
                raise PublishError(f"CDP communication error: {exc}") from exc
            if resp.get("id") == msg_id:
                break
        if "error" in resp:
            raise PublishError(f"CDP error: {resp['error']}")
        return resp

    async def simulate_human_scroll(self, distance: Optional[int] = None) -> None:
        w = self._viewport.get("width", 1440)
        h = self._viewport.get("height", 900)
        if w < 200 or h < 200:
            log.warning("Viewport too small (%dx%d), skipping scroll", w, h)
            return
        target = distance or random.randint(int(h * 0.6), int(h * 2.5))
        steps = random.randint(5, 12)
        step_size = target / steps
        for i in range(steps):
            delta = int(step_size * random.uniform(0.6, 1.4))
            sx = max(100, min(w - 100, random.randint(100, max(200, w - 100))))
            sy = max(100, min(h - 100, random.randint(100, max(200, h - 100))))
            await self.send("Input.synthesizeScrollGesture", {
                "x": sx, "y": sy,
                "xDistance": 0, "yDistance": -delta,
                "speed": random.randint(400, 1200),
            })
            await asyncio.sleep(random.uniform(0.08, 0.35))
        await asyncio.sleep(random.uniform(0.5, 1.5))

    async def simulate_mouse_move(self, start_x: float, start_y: float, end_x: float, end_y: float) -> None:
        points = _bezier_path(start_x, start_y, end_x, end_y)
        for px, py in points:
            await self.send("Input.dispatchMouseEvent", {
                "type": "mouseMoved",
                "x": px,
                "y": py,
                "modifiers": 0,
            })
            await asyncio.sleep(random.uniform(0.005, 0.025))

    async def simulate_mouse_click(self, x: float, y: float) -> None:
        jitter_x = random.uniform(-3, 3)
        jitter_y = random.uniform(-3, 3)
        target_x, target_y = x + jitter_x, y + jitter_y
        await self.simulate_mouse_move(
            random.uniform(0, self._viewport.get("width", 1440)),
            random.uniform(0, self._viewport.get("height", 900)),
            target_x, target_y
        )
        await asyncio.sleep(random.uniform(0.1, 0.3))
        await self.send("Input.dispatchMouseEvent", {
            "type": "mousePressed", "x": target_x, "y": target_y,
            "button": "left", "clickCount": 1, "modifiers": 0,
        })
        await asyncio.sleep(random.uniform(0.02, 0.08))
        await self.send("Input.dispatchMouseEvent", {
            "type": "mouseReleased", "x": target_x, "y": target_y,
            "button": "left", "clickCount": 1, "modifiers": 0,
        })
        await asyncio.sleep(_human_delay(0.2, 0.6))

    async def human_type(self, text: str) -> None:
        for char in text:
            delay = random.uniform(0.05, 0.25)
            if char in " ，。！？；：、":
                delay = random.uniform(0.2, 0.5)
            elif char in "\n":
                delay = random.uniform(0.3, 0.8)
            await self.send("Input.insertText", {"text": char})
            await asyncio.sleep(delay)

    async def navigate(self, url: str) -> None:
        await self.send("Page.navigate", {"url": url})
        await asyncio.sleep(random.uniform(2, 4))
        for _ in range(10):
            result = await self.send("Runtime.evaluate", {
                "expression": "document.readyState"
            })
            state = result.get("result", {}).get("result", {}).get("value", "")
            if state == "complete":
                break
            await asyncio.sleep(0.5)
        dims = await self.send("Runtime.evaluate", {
            "expression": "({w: window.innerWidth, h: window.innerHeight})"
        })
        dim_val = dims.get("result", {}).get("result", {}).get("value", {})
        if dim_val and dim_val.get("w", 0) > 100:
            self._viewport = dim_val
        try:
            await self.simulate_human_scroll(random.randint(50, 200))
        except PublishError:
            pass
        await asyncio.sleep(_human_delay(0.3, 1.0))

    async def wait_for_selector(self, selector: str, timeout: float = 10.0) -> bool:
        js = f"""
        (function() {{
            const start = Date.now();
            return new Promise((resolve) => {{
                const check = () => {{
                    const el = document.querySelector('{selector}');
                    if (el) return resolve(true);
                    if (Date.now() - start > {int(timeout*1000)}) return resolve(false);
                    setTimeout(check, 200);
                }};
                check();
            }});
        }})()
        """
        resp = await self.send("Runtime.evaluate", {
            "expression": js,
            "awaitPromise": True,
            "timeout": int(timeout * 1000),
        })
        return resp.get("result", {}).get("result", {}).get("value", False)

    async def evaluate(self, expression: str) -> Any:
        resp = await self.send("Runtime.evaluate", {"expression": expression})
        result = resp.get("result", {}).get("result", {})
        return result.get("value")

    async def screenshot(self, path: Optional[str] = None) -> str:
        resp = await self.send("Page.captureScreenshot", {"format": "png", "quality": 60})
        data = resp.get("result", {}).get("data", "")
        if data and path:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "wb") as f:
                f.write(base64.b64decode(data))
        return data

    async def set_input_value(self, selector: str, value: str) -> bool:
        await self.simulate_mouse_click(
            random.randint(200, 600),
            random.randint(200, 500)
        )
        await self.send("DOM.querySelector", {"selector": selector})
        await self.send("Runtime.evaluate", {"expression": f"document.querySelector('{selector}').focus()"})
        await asyncio.sleep(_human_delay(0.2, 0.5))
        await self.send("Runtime.evaluate", {
            "expression": f"document.querySelector('{selector}').value = ''"
        })
        await asyncio.sleep(random.uniform(0.05, 0.15))
        await self.human_type(value)
        await self.send("Runtime.evaluate", {
            "expression": f"""
            (function() {{
                const el = document.querySelector('{selector}');
                el.dispatchEvent(new Event('input', {{bubbles: true}}));
                el.dispatchEvent(new Event('change', {{bubbles: true}}));
                return true;
            }})()
            """
        })
        await asyncio.sleep(_human_delay(0.3, 0.8))
        return True

    async def set_textarea_value(self, selector: str, value: str) -> bool:
        await self.simulate_mouse_click(
            random.randint(200, 600),
            random.randint(400, 700)
        )
        await self.send("Runtime.evaluate", {"expression": f"document.querySelector('{selector}').focus()"})
        await asyncio.sleep(_human_delay(0.3, 0.6))
        await self.send("Runtime.evaluate", {
            "expression": f"document.querySelector('{selector}').value = ''"
        })
        await asyncio.sleep(random.uniform(0.05, 0.15))
        await self.human_type(value)
        await self.send("Runtime.evaluate", {
            "expression": f"""
            (function() {{
                const el = document.querySelector('{selector}');
                el.dispatchEvent(new Event('input', {{bubbles: true}}));
                el.dispatchEvent(new Event('change', {{bubbles: true}}));
                return true;
            }})()
            """
        })
        await asyncio.sleep(_human_delay(0.3, 0.8))
        return True

    async def click(self, selector: str) -> bool:
        js_pos = f"""
        (function() {{
            const el = document.querySelector('{selector}');
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return {{x: rect.left + rect.width/2, y: rect.top + rect.height/2}};
        }})()
        """
        resp = await self.send("Runtime.evaluate", {"expression": js_pos})
        pos = resp.get("result", {}).get("result", {}).get("value")
        if not pos:
            return False
        await self.simulate_mouse_click(float(pos["x"]), float(pos["y"]))
        await asyncio.sleep(_human_delay(0.3, 0.8))
        return True


class PublishSkill(BaseSkill):
    def __init__(self, *args: Any, cdp_url: str = "http://localhost:9222", **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._cdp_url = cdp_url

    async def execute(self, state: dict[str, Any]) -> dict[str, Any]:
        title = state.get("final_title", "")
        content = state.get("final_content", "")

        if not title or not content:
            return {**state, "status": "publish_failed", "error": "Missing title or content"}

        safety = state.get("safety_result", {})
        if not safety.get("is_safe", True) and safety.get("score", 1.0) < 0.5:
            return {**state, "status": "publish_rejected", "error": "Safety score too low"}

        await asyncio.sleep(random.uniform(2, 8))

        cdp = CDPController(self._cdp_url)
        try:
            await cdp.connect()
            await cdp.navigate("https://creator.xiaohongshu.com/publish/publish")
            await asyncio.sleep(4)

            cur = await cdp.evaluate("window.location.href")
            log.info("Publish URL: %s", cur)
            if cur and "login" in str(cur).lower():
                return {**state, "status": "publish_failed", "error": "Not logged in"}

            editor_count = 0
            for attempt in range(15):
                r = await cdp.evaluate("document.querySelectorAll('[contenteditable]').length")
                if r is not None:
                    editor_count = int(r) if str(r).isdigit() else 0
                if editor_count > 0:
                    log.info("Editor found after %.1fs (attempt %d)", attempt * 2 + 4, attempt + 1)
                    break
                await asyncio.sleep(2)
                log.info("Waiting for editor... (attempt %d/15, editors: %d)", attempt + 1, editor_count)

            if editor_count > 0:
                await asyncio.sleep(1)
                title_json = json.dumps(title, ensure_ascii=False)
                content_json = json.dumps(content, ensure_ascii=False)
                fill_result = await cdp.evaluate(f"""
                (function() {{
                    var els = document.querySelectorAll('[contenteditable]');
                    var titleDone = false;
                    var contentDone = false;
                    for (var i = 0; i < els.length; i++) {{
                        var el = els[i];
                        var w = el.offsetWidth;
                        var h = el.offsetHeight;
                        if (!titleDone && w > 100 && h > 15 && h < 60) {{
                            el.focus();
                            el.textContent = '';
                            el.textContent = {title_json};
                            el.dispatchEvent(new Event('input', {{bubbles: true}}));
                            el.dispatchEvent(new Event('change', {{bubbles: true}}));
                            titleDone = true;
                            continue;
                        }}
                        if (!contentDone && w > 100 && h > 30) {{
                            el.focus();
                            el.textContent = '';
                            el.textContent = {content_json};
                            el.dispatchEvent(new Event('input', {{bubbles: true}}));
                            el.dispatchEvent(new Event('change', {{bubbles: true}}));
                            contentDone = true;
                        }}
                    }}
                    return JSON.stringify({{title: titleDone, content: contentDone}});
                }})()
                """)
                log.info("Fill result: %s", fill_result)
            else:
                log.warning("No editors appeared after 30s - please click '上传图文' manually in Chrome")

            await cdp.screenshot(tempfile.gettempdir() + "/xhs_publish_final.png")
            log.info("Publish done (editors: %d)", editor_count)
            return {**state, "publish_status": "form_filled" if editor_count > 0 else "awaiting_type_select", "status": "published"}

        except PublishError:
            raise
        except Exception as exc:
            log.error("Publish failed: %s", exc)
            return {**state, "status": "publish_failed", "error": str(exc)}
        finally:
            await cdp.close()
