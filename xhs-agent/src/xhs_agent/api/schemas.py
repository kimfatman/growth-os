"""FastAPI 请求/响应模型"""
from __future__ import annotations

from pydantic import BaseModel, Field


class CreateNoteRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200, description="笔记主题")
    target_audience: str = Field("年轻人/职场人", description="目标受众")
    style: str = Field("种草分享", description="内容风格: 种草分享/测评对比/教程攻略/避坑指南/经验分享")


class TopicResearchRequest(BaseModel):
    niche: str = Field(..., min_length=1, max_length=100, description="细分领域")
    count: int = Field(5, ge=1, le=20, description="推荐选题数量")


class FullPipelineRequest(BaseModel):
    niche: str = Field(..., min_length=1, max_length=100, description="细分领域")
    target_audience: str = Field("年轻人/职场人", description="目标受众")
    style: str = Field("种草分享", description="内容风格")


class SafetyCheckRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="待检测文本")


class NoteResponse(BaseModel):
    title: str
    content: str
    tags: list[str] = []
    safety_score: float = 1.0
    risky_words: list[str] = []


class ApiResponse(BaseModel):
    success: bool = True
    data: dict | list | None = None
    error: str | None = None
