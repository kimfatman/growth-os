"""选题调研 Skill"""
from __future__ import annotations

import json
import re
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from xhs_agent.core.config import Settings
from xhs_agent.core.llm import LLMManager
from xhs_agent.platform.auth import CookieManager
from xhs_agent.platform.client import XHSClient
from xhs_agent.platform.models import CompetitorNote, TopicSuggestion
from xhs_agent.skills.base import BaseSkill


TOPIC_SYSTEM = """你是财税审计领域的专业选题策划师，服务于「江之都审计」（武汉本地20年财税审计机构）。

选题方向原则：
1. 优先推荐与武汉本地企业财税痛点相关的选题
2. 关注高新认定、汇算清缴、审计合规等高频需求
3. 选题要对企业老板有实际价值，能解决真实问题
4. 兼顾4类内容：痛点干货、服务拆解、老板避坑、品牌温度
5. 每个选题要能自然植入江之都的专业服务能力

返回格式（严格 JSON 数组）：
[
  {
    "title": "标题方向",
    "target_audience": "目标受众",
    "differentiation": "差异化角度",
    "estimated_heat": "高/中/低"
  }
]"""


class TopicSkill(BaseSkill):
    def __init__(self, settings: Settings, llm_manager: LLMManager, **kwargs: Any) -> None:
        super().__init__(settings, llm_manager, **kwargs)
        self._xhs: XHSClient | None = None

    def _get_xhs(self) -> XHSClient:
        if self._xhs is None:
            auth = CookieManager(self.settings.cookie_path)
            self._xhs = XHSClient(auth)
        return self._xhs

    async def execute(self, state: dict[str, Any]) -> dict[str, Any]:
        niche = state.get("niche", self.settings.niche)
        count = state.get("count", 5)

        hot_topics = await self._fetch_hot_topics()
        competitors = await self._analyze_competitors(niche)
        suggestions = await self._generate_suggestions(niche, hot_topics, competitors, count)

        if self._xhs:
            await self._xhs.close()

        return {
            **state,
            "hot_topics": hot_topics,
            "competitor_notes": [
                {"title": c.title, "likes": c.likes, "note_id": c.note_id}
                for c in competitors
            ],
            "topic_suggestions": [
                {"title": s.title, "target_audience": s.target_audience,
                 "differentiation": s.differentiation, "estimated_heat": s.estimated_heat}
                for s in suggestions
            ],
            "status": "completed",
        }

    async def _fetch_hot_topics(self) -> list[dict]:
        try:
            xhs = self._get_xhs()
            data = await xhs.get_hot_topics()
            items = data.get("data", {}).get("items", [])
            return [{"title": it.get("title", it.get("name", ""))} for it in items[:15]]
        except Exception as exc:
            self.log.warning("Failed to fetch hot topics: %s", exc)
            return []

    async def _analyze_competitors(self, niche: str, limit: int = 10) -> list[CompetitorNote]:
        try:
            xhs = self._get_xhs()
            data = await xhs.search_notes(niche, sort="popularity_descending")
            items = data.get("data", {}).get("items", [])[:limit]
            results: list[CompetitorNote] = []
            for item in items:
                card = item.get("note_card", {})
                interact = card.get("interact_info", {})
                results.append(CompetitorNote(
                    title=card.get("display_title", ""),
                    note_id=item.get("id", ""),
                    likes=int(interact.get("liked_count", "0")),
                    note_type=card.get("type", "image_text"),
                    tags=[t.get("name", "") for t in card.get("tag_list", [])],
                ))
            return results
        except Exception as exc:
            self.log.warning("Failed to analyze competitors: %s", exc)
            return []

    async def _generate_suggestions(self, niche: str, hot_topics: list[dict], competitors: list[CompetitorNote], count: int) -> list[TopicSuggestion]:
        context_parts = [f"细分领域：{niche}"]

        if hot_topics:
            topics_str = "\n".join(f"- {t['title']}" for t in hot_topics[:10])
            context_parts.append(f"当前热门话题：\n{topics_str}")

        if competitors:
            notes_str = "\n".join(f"- 「{c.title}」点赞:{c.likes}" for c in competitors[:10])
            context_parts.append(f"竞品爆款笔记：\n{notes_str}")

        prompt = "\n\n".join(context_parts)
        prompt += f"\n\n请推荐 {count} 个选题。"

        raw = await self._call_llm("topic_research", [
            SystemMessage(content=TOPIC_SYSTEM),
            HumanMessage(content=prompt),
        ])

        suggestions: list[TopicSuggestion] = []
        match = re.search(r"\[.*?\]", raw, re.DOTALL)
        if match:
            try:
                items = json.loads(match.group())
                for item in items:
                    if isinstance(item, dict):
                        suggestions.append(TopicSuggestion(
                            title=item.get("title", ""),
                            target_audience=item.get("target_audience", ""),
                            differentiation=item.get("differentiation", ""),
                            estimated_heat=item.get("estimated_heat", "中"),
                            source="ai",
                        ))
            except (json.JSONDecodeError, TypeError):
                self.log.warning("Failed to parse topic suggestions JSON")

        if not suggestions:
            suggestions.append(TopicSuggestion(title=niche, source="fallback"))

        return suggestions[:count]
