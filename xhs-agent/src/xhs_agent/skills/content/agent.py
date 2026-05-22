"""内容生成 Skill — LangGraph 工作流实现"""
from __future__ import annotations

import json
import re
from typing import Any, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph

from xhs_agent.core.config import Settings
from xhs_agent.core.llm import LLMManager
from xhs_agent.skills.base import BaseSkill
from . import prompts


class ContentState(TypedDict):
    topic: str
    target_audience: str
    style: str
    style_desc: str
    draft_content: str
    draft_titles: list[str]
    selected_title: str
    tags: list[str]
    safety_result: dict[str, Any]
    final_title: str
    final_content: str
    status: str
    error: str


class ContentSkill(BaseSkill):
    async def execute(self, state: dict[str, Any]) -> dict[str, Any]:
        graph = self._build_graph()
        initial: ContentState = {
            "topic": state.get("topic", ""),
            "target_audience": state.get("target_audience", "年轻人/职场人"),
            "style": state.get("style", "种草分享"),
            "style_desc": prompts.STYLE_MAP.get(
                state.get("style", "种草分享"),
                "分享实用内容",
            ),
            "draft_content": "",
            "draft_titles": [],
            "selected_title": "",
            "tags": [],
            "safety_result": {},
            "final_title": "",
            "final_content": "",
            "status": "init",
            "error": "",
        }
        result = await graph.ainvoke(initial)
        return result

    def _build_graph(self) -> StateGraph:
        graph = StateGraph(ContentState)

        graph.add_node("generate_draft", self._generate_draft)
        graph.add_node("extract_tags", self._extract_tags)
        graph.add_node("generate_titles", self._generate_titles)
        graph.add_node("select_title", self._select_title)
        graph.add_node("finalize", self._finalize)

        graph.set_entry_point("generate_draft")
        graph.add_edge("generate_draft", "extract_tags")
        graph.add_edge("extract_tags", "generate_titles")
        graph.add_edge("generate_titles", "select_title")
        graph.add_edge("select_title", "finalize")
        graph.add_edge("finalize", END)

        return graph.compile()

    async def _generate_draft(self, state: ContentState) -> dict:
        prompt = prompts.GENERATE_CONTENT.format(
            topic=state["topic"],
            audience=state["target_audience"],
            style=f"{state['style']}（{state['style_desc']}）",
        )
        content = await self._call_llm("content_generation", [
            SystemMessage(content=prompts.CONTENT_SYSTEM),
            HumanMessage(content=prompt),
        ])
        return {"draft_content": content, "status": "draft_generated"}

    async def _extract_tags(self, state: ContentState) -> dict:
        text = state["draft_content"]
        tags = re.findall(r"#([^#\s]+)#", text)
        clean_lines = []
        for line in text.split("\n"):
            stripped = line.strip()
            if stripped and stripped.startswith("#") and stripped.endswith("#"):
                continue
            clean_lines.append(line)
        if not tags:
            tags = [state["topic"].replace(" ", ""), "小红书", "干货分享"]
        return {
            "tags": tags[:8],
            "draft_content": "\n".join(clean_lines).strip(),
            "status": "tags_extracted",
        }

    async def _generate_titles(self, state: ContentState) -> dict:
        summary = state["draft_content"][:500]
        prompt = prompts.GENERATE_TITLES.format(content_summary=summary)

        raw = await self._call_llm("content_generation", [
            SystemMessage(content=prompts.TITLE_SYSTEM),
            HumanMessage(content=prompt),
        ])

        titles: list[str] = []
        match = re.search(r"\[.*?\]", raw, re.DOTALL)
        if match:
            try:
                titles = json.loads(match.group())
            except (json.JSONDecodeError, TypeError):
                pass

        if not titles:
            for line in raw.split("\n"):
                line = line.strip().lstrip("0123456789.、)）- ")
                if line and len(line) >= 5:
                    titles.append(line)

        return {"draft_titles": titles[:5], "status": "titles_generated"}

    async def _select_title(self, state: ContentState) -> dict:
        titles = state["draft_titles"]
        selected = titles[0] if titles else state["topic"]
        return {"selected_title": selected, "status": "title_selected"}

    async def _finalize(self, state: ContentState) -> dict:
        return {
            "final_title": state["selected_title"],
            "final_content": state["draft_content"],
            "status": "completed",
        }
