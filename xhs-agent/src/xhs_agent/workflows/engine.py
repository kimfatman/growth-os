"""工作流引擎 — 串联多个 Skill 的完整运营流程"""
from __future__ import annotations

from typing import Any

from langgraph.graph import END, StateGraph

from xhs_agent.core.config import Settings, load_settings
from xhs_agent.core.llm import LLMManager
from xhs_agent.core.logger import log
from xhs_agent.skills.content.agent import ContentSkill
from xhs_agent.skills.style.agent import StyleSkill
from xhs_agent.skills.topic.agent import TopicSkill


class WorkflowEngine:
    """工作流引擎.

    提供预定义的工作流，也支持自定义 Skill 组合。
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or load_settings()
        self.llm = LLMManager(self.settings)

    def _skill(self, cls: type, **kwargs: Any) -> Any:
        return cls(settings=self.settings, llm_manager=self.llm, **kwargs)

    async def topic_research(self, niche: str, count: int = 5) -> dict:
        """选题调研工作流."""
        skill = self._skill(TopicSkill)
        return await skill.execute({"niche": niche, "count": count})

    async def create_note(
        self,
        topic: str,
        audience: str = "年轻人/职场人",
        style: str = "种草分享",
    ) -> dict:
        """内容生成 + 排版 + 安全检测工作流."""
        # Step 1: 生成内容
        content_skill = self._skill(ContentSkill)
        state = await content_skill.execute({
            "topic": topic,
            "target_audience": audience,
            "style": style,
        })

        # Step 2: 排版 + 安全检测
        style_skill = self._skill(StyleSkill)
        state = await style_skill.execute(state)

        return state

    async def full_pipeline(
        self,
        niche: str,
        audience: str = "年轻人/职场人",
        style: str = "种草分享",
    ) -> dict:
        """完整管线：选题→内容→排版→准备发布."""
        # 1. 选题
        log.info("Step 1: Topic research for '%s'", niche)
        topic_result = await self.topic_research(niche)

        suggestions = topic_result.get("topic_suggestions", [])
        if not suggestions:
            return {"status": "failed", "error": "No topics found"}

        selected = suggestions[0]
        topic_title = selected.get("title", niche)
        log.info("Step 2: Selected topic: %s", topic_title)

        # 2. 生成 + 排版
        note_result = await self.create_note(
            topic=topic_title,
            audience=selected.get("target_audience", audience),
            style=style,
        )

        log.info(
            "Pipeline complete: '%s' (safety: %.2f)",
            note_result.get("final_title", "")[:30],
            note_result.get("safety_result", {}).get("score", 0),
        )

        return {
            "topic_research": {
                "suggestions": suggestions,
                "selected": selected,
            },
            **note_result,
        }
