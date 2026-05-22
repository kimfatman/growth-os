"""全自动调度引擎 — APScheduler + 全链路无人值守管线"""
from __future__ import annotations

import asyncio
import json
import os
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from xhs_agent.core.config import Settings, load_settings
from xhs_agent.core.logger import log
from xhs_agent.skills.content.agent import ContentSkill
from xhs_agent.skills.customer.agent import CustomerSkill
from xhs_agent.skills.publish.agent import PublishSkill
from xhs_agent.skills.publish.cover import CoverSkill
from xhs_agent.skills.style.agent import StyleSkill
from xhs_agent.skills.topic.agent import TopicSkill
from xhs_agent.skills.analytics.agent import AnalyticsSkill
from xhs_agent.workflows.engine import WorkflowEngine


class AutonomousOrchestrator:
    """全链路无人值守自动化调度器.

    每日任务管线:
        08:00  选题调研 → AI生成 → 排版→ 封面 → 定时发布
        10:00  检查评论 → 自动回复
        14:00  检查新评论 → 自动回复
        18:00  检查新评论 → 自动回复
        每周一 09:00  运营数据复盘报告
    """

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or load_settings()
        self.engine = WorkflowEngine(self.settings)
        self.scheduler = AsyncIOScheduler()
        self._state_file = Path(self.settings.data_dir or "data") / "autonomous_state.json"
        self._state_file.parent.mkdir(parents=True, exist_ok=True)
        self._state: dict[str, Any] = self._load_state()
        self._running = False

    def _load_state(self) -> dict:
        if self._state_file.exists():
            try:
                return json.loads(self._state_file.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                pass
        return {"published_titles": [], "publish_count": 0, "comment_count": 0, "reply_count": 0}

    def _save_state(self) -> None:
        try:
            self._state_file.write_text(json.dumps(self._state, ensure_ascii=False, indent=2), encoding="utf-8")
        except OSError as exc:
            log.warning("Failed to save state: %s", exc)

    async def daily_publish_pipeline(self) -> dict:
        """每日自动发布管线：选题 → 内容 → 排版 → 封面 → 发布."""
        log.info("=== [AUTO] Starting daily publish pipeline ===")
        niche = self.settings.niche

        result = await self.engine.full_pipeline(niche=niche)
        if result.get("status") == "failed":
            log.error("[AUTO] Pipeline failed: %s", result.get("error"))
            return result

        cover_skill = CoverSkill(settings=self.settings, llm_manager=self.engine.llm)
        cover_result = await cover_skill.execute(result)
        result.update(cover_result)

        publish_skill = PublishSkill(settings=self.settings, llm_manager=self.engine.llm)
        publish_result = await publish_skill.execute(result)
        result.update(publish_result)

        title = result.get("final_title", result.get("selected_title", ""))
        self._state.setdefault("published_titles", []).append(title)
        self._state["publish_count"] = len(self._state["published_titles"])
        self._save_state()

        log.info("=== [AUTO] Daily publish pipeline complete: '%s' ===", title[:40])
        return result

    async def auto_reply_pipeline(self) -> dict:
        """自动回复管线：检查新评论 → AI 回复."""
        from xhs_agent.platform.auth import CookieManager
        from xhs_agent.platform.client import XHSClient

        log.info("=== [AUTO] Starting auto-reply pipeline ===")
        try:
            auth = CookieManager(self.settings.cookie_path)
            client = XHSClient(auth)

            notes = self._state.get("published_titles", [])
            if not notes:
                log.info("[AUTO] No published notes to check comments for")
                return {"status": "skipped", "reason": "no published notes"}

            messages = []
            for note_title in notes[-3:]:
                try:
                    comments = await client.get_comments(note_title)
                    items = comments.get("data", {}).get("comments", [])
                    for c in items:
                        messages.append({
                            "content": c.get("content", ""),
                            "user_name": c.get("user_info", {}).get("nickname", "用户"),
                            "note_title": note_title,
                        })
                except Exception as exc:
                    log.warning("[AUTO] Failed to fetch comments for '%s': %s", note_title, exc)

            if not messages:
                log.info("[AUTO] No new comments to reply")
                return {"status": "skipped", "reason": "no new comments"}

            customer_skill = CustomerSkill(settings=self.settings, llm_manager=self.engine.llm)
            reply_result = await customer_skill.execute({
                "messages": messages,
                "niche": self.settings.niche,
            })

            self._state["comment_count"] = self._state.get("comment_count", 0) + len(messages)
            self._state["reply_count"] = self._state.get("reply_count", 0) + reply_result.get("replied_count", 0)
            self._save_state()

            await client.close()
            log.info("[AUTO] Replied to %d messages", reply_result.get("replied_count", 0))
            return reply_result

        except Exception as exc:
            log.error("[AUTO] Auto-reply pipeline failed: %s", exc)
            return {"status": "failed", "error": str(exc)}

    async def weekly_report_pipeline(self) -> dict:
        """每周复盘报告."""
        log.info("=== [AUTO] Starting weekly report pipeline ===")
        try:
            analytics = AnalyticsSkill(settings=self.settings, llm_manager=self.engine.llm)
            result = await analytics.execute({
                "niche": self.settings.niche,
                "publish_count": self._state.get("publish_count", 0),
                "comment_count": self._state.get("comment_count", 0),
                "reply_count": self._state.get("reply_count", 0),
                "published_titles": self._state.get("published_titles", []),
            })

            report = result.get("weekly_report", {})
            report_dir = Path(self.settings.data_dir or "data") / "reports"
            report_dir.mkdir(parents=True, exist_ok=True)
            report_file = report_dir / f"weekly_report_{datetime.now().strftime('%Y%m%d')}.md"
            report_file.write_text(report.get("content", ""), encoding="utf-8")

            log.info("[AUTO] Weekly report saved to %s", report_file)
            return result

        except Exception as exc:
            log.error("[AUTO] Weekly report failed: %s", exc)
            return {"status": "failed", "error": str(exc)}

    def _avoid_bad_minutes(self, base_minute: int) -> int:
        rc = self.settings.risk_control
        if not hasattr(rc, "anti_detection"):
            return base_minute
        ad = rc.anti_detection
        bad = ad.publish_minute_avoid
        if base_minute in bad:
            candidates = [m for m in range(0, 59) if m not in bad]
            return random.choice(candidates)
        return base_minute

    def start(self) -> None:
        """注册所有定时任务并启动调度器."""
        if self._running:
            log.warning("[AUTO] Scheduler already running")
            return

        rc = self.settings.risk_control
        daily_count = rc.daily_publish_count

        publish_hours = [8]
        if daily_count >= 2:
            publish_hours.append(14)
        if daily_count >= 3:
            publish_hours.append(20)

        for hour in publish_hours:
            base_min = random.randint(3, 12)
            final_min = self._avoid_bad_minutes(base_min)
            self.scheduler.add_job(
                self._wrap_async(self.daily_publish_pipeline),
                CronTrigger(hour=hour, minute=final_min),
                id=f"daily_publish_{hour}",
                replace_existing=True,
                misfire_grace_time=600,
            )
            log.info("[AUTO] Registered daily publish at %02d:%02d (anti-detection)", hour, final_min)

        ad = rc.anti_detection if hasattr(rc, "anti_detection") else None
        reply_hours = [10, 14, 18, 21]
        random.shuffle(reply_hours)
        for hour in reply_hours:
            base_min = random.randint(5, 25)
            final_min = self._avoid_bad_minutes(base_min)
            self.scheduler.add_job(
                self._wrap_async(self.auto_reply_pipeline),
                CronTrigger(hour=hour, minute=final_min),
                id=f"auto_reply_{hour}",
                replace_existing=True,
                misfire_grace_time=600,
            )
            log.info("[AUTO] Registered auto-reply check at %02d:%02d", hour, final_min)

        self.scheduler.add_job(
            self._wrap_async(self.weekly_report_pipeline),
            CronTrigger(day_of_week="mon", hour=9, minute=random.randint(5, 20)),
            id="weekly_report",
            replace_existing=True,
            misfire_grace_time=600,
        )
        log.info("[AUTO] Registered weekly report on Monday 09:%02d", final_min if 'final_min' in dir() else 0)

        self.scheduler.start()
        self._running = True
        log.info("=== [AUTO] Autonomous scheduler started ===")

    def stop(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
        self._running = False
        log.info("[AUTO] Scheduler stopped")

    def _wrap_async(self, coro_fn):
        """包装异步函数供 APScheduler 调用."""
        async def wrapper():
            try:
                await coro_fn()
            except Exception as exc:
                log.error("[AUTO] Scheduled task failed: %s", exc)
        return wrapper
