"""封面图生成 Skill — 通过 AI 生成小红书封面"""
from __future__ import annotations

import json
import os
import tempfile
from typing import Any

from xhs_agent.core.logger import log
from xhs_agent.skills.base import BaseSkill

COVER_PROMPT = """你是一个小红书封面设计师。为以下笔记生成封面方案：

标题：{title}
关键词：{tags}
风格：{style}

请描述封面设计，包含：
1. 背景色建议（色号）
2. 主标题文字（15字以内）
3. 装饰元素（emoji/线条/贴纸）
4. 整体构图（文字位置、比例）

返回 JSON：
{{
  "background": "背景颜色描述",
  "title_text": "封面标题",
  "decoration": ["元素1", "元素2"],
  "layout": "文字居中/上方/左对齐"
}}"""


class CoverSkill(BaseSkill):
    """封面图 Skill — AI 生成封面方案（需配合图片生成 API 或手动制作）."""

    async def execute(self, state: dict[str, Any]) -> dict[str, Any]:
        title = state.get("final_title", state.get("selected_title", ""))
        tags = state.get("tags", [])
        style = state.get("style", "种草分享")

        if not title:
            return {**state, "status": "cover_failed", "error": "Missing title"}

        try:
            raw = await self._call_llm("content_generation", [
                {"role": "system", "content": "你是一位小红书封面设计师"},
                {"role": "user", "content": COVER_PROMPT.format(
                    title=title, tags=", ".join(tags[:3]), style=style
                )},
            ])

            cover_data = self._parse_cover(raw, title)

            cover_dir = os.path.join(self.settings.data_dir or tempfile.gettempdir(), "covers")
            os.makedirs(cover_dir, exist_ok=True)
            log.info("Cover design ready: %s/", cover_dir)

        except Exception as exc:
            self.log.warning("Cover generation failed: %s", exc)
            cover_data = self._default_cover(title)

        return {
            **state,
            "cover": cover_data,
            "status": "cover_ready",
        }

    def _parse_cover(self, raw: str, fallback_title: str) -> dict:
        import re
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
                return {
                    "background": data.get("background", "#FFFFFF"),
                    "title_text": data.get("title_text", fallback_title[:15]),
                    "decoration": data.get("decoration", []),
                    "layout": data.get("layout", "居中"),
                    "raw_spec": data,
                }
            except (json.JSONDecodeError, TypeError):
                pass
        return self._default_cover(fallback_title)

    @staticmethod
    def _default_cover(title: str) -> dict:
        return {
            "background": "渐变粉 #FF6B6B → #FFB6C1",
            "title_text": title[:12],
            "decoration": ["✨", "🌟", "⬇️"],
            "layout": "文字居中，大号粗体白色字体",
        }
