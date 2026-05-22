"""排版 + 安全检测 Skill"""
from __future__ import annotations

from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from xhs_agent.skills.base import BaseSkill
from .banned_words import SafetyResult, auto_fix, check_content


EMOJI_FORMAT_PROMPT = """你是小红书排版专家。对内容进行 emoji 排版优化。

规则：
- 每个段落开头加 1 个相关 emoji
- 重点内容用 emoji 标记（✅ 📌 💡 ⭐）
- 列表项用 emoji 做序号
- 分隔线用：✨ ———— ✨
- 不要过度使用 emoji（每段最多 2 个）
- 保持原文内容和语义不变，只加排版

直接返回排版后的内容，不要加任何解释。"""


class StyleSkill(BaseSkill):
    """排版 + 违禁词检测 Skill.

    功能：
    1. 违禁词检测 + 自动修复
    2. AI emoji 排版优化
    """

    async def execute(self, state: dict[str, Any]) -> dict[str, Any]:
        """执行排版 + 安全检测."""
        title = state.get("final_title", state.get("selected_title", ""))
        content = state.get("final_content", state.get("draft_content", ""))

        # Step 1: 违禁词检测
        title_check = check_content(title)
        content_check = check_content(content)

        # 合并结果
        all_banned = title_check.banned + content_check.banned
        all_risky = list(set(title_check.risky + content_check.risky))
        combined = SafetyResult(
            is_safe=len(all_banned) == 0,
            banned=all_banned,
            risky=all_risky,
            score=min(title_check.score, content_check.score),
        )

        # Step 2: 自动修复违禁词
        if not combined.is_safe:
            title = auto_fix(title, title_check)
            content = auto_fix(content, content_check)
            self.log.info(
                "Fixed %d banned words (score: %.2f → rechecking)",
                len(all_banned), combined.score,
            )
            # 重新检测
            recheck = check_content(title + "\n" + content)
            combined = recheck

        # Step 3: AI 排版优化
        formatted = await self._format_content(content)

        return {
            **state,
            "final_title": title,
            "final_content": formatted,
            "safety_result": {
                "is_safe": combined.is_safe,
                "banned": combined.banned,
                "risky": combined.risky,
                "score": combined.score,
            },
            "status": "styled",
        }

    async def _format_content(self, content: str) -> str:
        """AI emoji 排版."""
        try:
            formatted = await self._call_llm("style_formatting", [
                SystemMessage(content=EMOJI_FORMAT_PROMPT),
                HumanMessage(content=content),
            ])
            return formatted
        except Exception as exc:
            self.log.warning("AI formatting failed, using original: %s", exc)
            return content
