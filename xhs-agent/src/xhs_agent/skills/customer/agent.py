"""评论/私信自动回复 Skill"""
from __future__ import annotations

import random
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from xhs_agent.skills.base import BaseSkill

REPLY_PROMPT = """你正在运营一个小红书账号（领域：{niche}）。
用户对你的笔记发表了评论或发送了私信。

用户消息：{message}

回复原则：
- 真诚、热情、像真人一样回复
- 如果问问题，给出有价值的具体回答
- 如果夸赞，礼貌感谢
- 如果有质疑，理性解释不抬杠
- 不要硬推销，可以自然引导关注
- 30字以内，口语化
直接返回回复内容，不要加任何前缀。"""


class CustomerSkill(BaseSkill):
    """客户互动 Skill — 自动回复评论和私信."""

    async def execute(self, state: dict[str, Any]) -> dict[str, Any]:
        messages = state.get("messages", [])
        niche = state.get("niche", self.settings.niche)
        replies = []

        for msg in messages:
            content = msg.get("content", "").strip()
            if not content:
                continue
            try:
                reply = await self._call_llm("customer_service", [
                    SystemMessage(content=REPLY_PROMPT.format(niche=niche, message=content)),
                    HumanMessage(content="请回复这条消息。"),
                ])
            except Exception as exc:
                self.log.warning("LLM reply failed for message, using fallback: %s", exc)
                reply = self._fallback_reply(content)

            replies.append({
                "original_message": msg,
                "reply": reply[:100],
                "replied_at": None,
            })

        return {
            **state,
            "replies": replies,
            "replied_count": len(replies),
            "status": "completed",
        }

    @staticmethod
    def _fallback_reply(message: str) -> str:
        fallbacks = [
            "谢谢你的评论！有疑问欢迎继续交流哦～",
            "感谢支持！希望内容对你有帮助 💪",
            "好问题！我会专门出一期详细讲这个～",
            "谢谢提醒，我会注意的！",
            "感谢你认真看完～觉得有用的话点个赞吧 ❤️",
        ]
        message_lower = message.lower()
        if any(w in message_lower for w in ["怎么", "如何", "教程", "步骤"]):
            return "我后面会出详细教程，先关注不迷路哦～"
        if any(w in message_lower for w in ["谢谢", "感谢", "有用", "收藏"]):
            return "不客气！能帮到你就好～觉得有用记得关注哦 🥰"
        if any(w in message_lower for w in ["假的", "骗人", "广告", "推广"]):
            return "这是真实体验分享，每个人感受可能不一样哈～"
        return random.choice(fallbacks)
