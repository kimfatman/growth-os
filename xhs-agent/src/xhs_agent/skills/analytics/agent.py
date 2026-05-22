"""每周运营数据复盘报告 Skill"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from xhs_agent.skills.base import BaseSkill

REPORT_PROMPT = """你是小红书运营数据分析师。基于以下运营数据生成周报：

运营领域：{niche}
数据周期：{date_range}

本周发布笔记：{publish_count} 篇
本周收到评论：{comment_count} 条
本周回复评论：{reply_count} 条

笔记标题列表：
{titles}

生成周报要求：
1. 总体运营概况（100字）
2. 本周亮点（3点，每点20字）
3. 待改进项（3点，每点20字）
4. 下周计划（3条建议）
5. 一句话总结

用 markdown 格式输出，简洁明了。"""


class AnalyticsSkill(BaseSkill):
    """数据复盘 Skill — 每周生成运营报告."""

    async def execute(self, state: dict[str, Any]) -> dict[str, Any]:
        week_end = datetime.now(timezone.utc)
        week_start = week_end.replace(hour=0, minute=0, second=0, microsecond=0)
        date_range = f"{week_start.strftime('%m/%d')}-{week_end.strftime('%m/%d')}"

        publish_count = state.get("publish_count", 0)
        comment_count = state.get("comment_count", 0)
        reply_count = state.get("reply_count", 0)
        titles_list = state.get("published_titles", [])
        titles_str = "\n".join(f"- {t}" for t in titles_list[-10:]) if titles_list else "（无）"

        try:
            report = await self._call_llm("data_analysis", [
                SystemMessage(content=REPORT_PROMPT.format(
                    niche=state.get("niche", self.settings.niche),
                    date_range=date_range,
                    publish_count=publish_count,
                    comment_count=comment_count,
                    reply_count=reply_count,
                    titles=titles_str,
                )),
                HumanMessage(content="请生成周报。"),
            ])
        except Exception as exc:
            self.log.warning("LLM report generation failed, using template: %s", exc)
            report = self._template_report(
                date_range, publish_count, comment_count, reply_count, titles_list
            )

        return {
            **state,
            "weekly_report": {
                "date_range": date_range,
                "generated_at": week_end.isoformat(),
                "content": report,
                "summary": {
                    "published": publish_count,
                    "comments": comment_count,
                    "replies": reply_count,
                },
            },
            "status": "completed",
        }

    @staticmethod
    def _template_report(date_range, pub_count, com_count, rep_count, titles):
        lines = [f"# 小红书运营周报 ({date_range})", "",
                 "## 数据概览",
                 f"- 发布笔记：{pub_count} 篇",
                 f"- 收到评论：{com_count} 条",
                 f"- 回复评论：{rep_count} 条",
                 f"- 回复率：{f'{rep_count/com_count*100:.0f}%' if com_count else 'N/A'}",
                 ""]
        if titles:
            lines += ["## 本周发布内容", ""]
            lines += [f"- {t}" for t in titles[-10:]]
        lines += ["", "## 总结",
                   "运营稳定进行中，持续优化内容质量和互动率。",
                   "",
                   "---",
                   f"*自动生成于 {datetime.now().strftime('%Y-%m-%d %H:%M')}*"]
        return "\n".join(lines)
