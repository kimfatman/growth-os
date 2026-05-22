"""XHS-Agent 应用入口 — FastAPI + 无人值守自动化"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

from xhs_agent.api.routes import register_root_routes, router
from xhs_agent.core.config import load_settings
from xhs_agent.core.logger import log
from xhs_agent.core.scheduler import AutonomousOrchestrator

_orchestrator: AutonomousOrchestrator | None = None


def get_orchestrator() -> AutonomousOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AutonomousOrchestrator()
    return _orchestrator


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("XHS-Agent starting")
    settings = load_settings()
    log.info("Niche: %s | Daily publish: %d | Schedule: %s",
             settings.niche, settings.risk_control.daily_publish_count,
             "enabled" if settings.risk_control.daily_publish_count > 0 else "manual-only")

    orch = get_orchestrator()
    orch.start()
    log.info("Autonomous scheduler started — system running unattended")

    yield

    orch.stop()
    log.info("XHS-Agent shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="XHS-Agent",
        description="小红书多智能体运营系统 - 全链路无人值守自动化",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.include_router(router)
    register_root_routes(app)
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("XHS_AGENT_PORT", "8100"))
    host = os.environ.get("XHS_AGENT_HOST", "127.0.0.1")
    try:
        uvicorn.run("xhs_agent.app:app", host=host, port=port, reload=False)
    except OSError as exc:
        log.error("Port %d is in use, try: set XHS_AGENT_PORT=<other_port>", port, exc_info=exc)
        raise SystemExit(1) from exc
