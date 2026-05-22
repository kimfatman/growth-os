"""API 路由"""
from __future__ import annotations

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import RedirectResponse

from xhs_agent.core.errors import AuthError, ConfigError, LLMFallbackExhausted, RateLimitError
from xhs_agent.skills.style.banned_words import check_content
from xhs_agent.workflows.engine import WorkflowEngine
from .schemas import (
    ApiResponse,
    CreateNoteRequest,
    FullPipelineRequest,
    SafetyCheckRequest,
    TopicResearchRequest,
)

router = APIRouter(prefix="/api")


def register_root_routes(app: FastAPI):
    @app.get("/")
    async def root():
        return RedirectResponse(url="/docs")

    @app.get("/favicon.ico")
    async def favicon():
        return RedirectResponse(url="/docs")


_engine: WorkflowEngine | None = None


def _get_engine() -> WorkflowEngine:
    global _engine
    if _engine is None:
        _engine = WorkflowEngine()
    return _engine


@router.get("/health")
async def health():
    return {"status": "ok", "service": "xhs-agent"}


@router.post("/topics/research", response_model=ApiResponse)
async def api_topic_research(req: TopicResearchRequest):
    try:
        engine = _get_engine()
        result = await engine.topic_research(niche=req.niche, count=req.count)
        return ApiResponse(data=result)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except RateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except ConfigError as exc:
        raise HTTPException(status_code=500, detail=f"Config error: {exc}")
    except LLMFallbackExhausted as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/notes/create", response_model=ApiResponse)
async def api_create_note(req: CreateNoteRequest):
    try:
        engine = _get_engine()
        result = await engine.create_note(
            topic=req.topic,
            audience=req.target_audience,
            style=req.style,
        )
        return ApiResponse(data={
            "title": result.get("final_title", ""),
            "content": result.get("final_content", ""),
            "tags": result.get("tags", []),
            "safety": result.get("safety_result", {}),
        })
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except RateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except ConfigError as exc:
        raise HTTPException(status_code=500, detail=f"Config error: {exc}")
    except LLMFallbackExhausted as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/pipeline/full", response_model=ApiResponse)
async def api_full_pipeline(req: FullPipelineRequest):
    try:
        engine = _get_engine()
        result = await engine.full_pipeline(
            niche=req.niche,
            audience=req.target_audience,
            style=req.style,
        )
        return ApiResponse(data=result)
    except AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except RateLimitError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except ConfigError as exc:
        raise HTTPException(status_code=500, detail=f"Config error: {exc}")
    except LLMFallbackExhausted as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/content/check", response_model=ApiResponse)
async def api_check_content(req: SafetyCheckRequest):
    result = check_content(req.text)
    return ApiResponse(data={
        "is_safe": result.is_safe,
        "banned": result.banned,
        "risky": result.risky,
        "score": result.score,
    })
