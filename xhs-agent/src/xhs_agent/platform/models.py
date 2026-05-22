"""小红书平台数据模型"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class NoteType(str, Enum):
    IMAGE_TEXT = "image_text"
    VIDEO = "video"


class PublishStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"       # 待发布（在队列中）
    PUBLISHING = "publishing" # 正在发布
    PUBLISHED = "published"   # 已发布
    FAILED = "failed"         # 发布失败
    REJECTED = "rejected"     # 审核不通过


@dataclass
class Note:
    """小红书笔记."""
    title: str
    content: str
    images: list[str] = field(default_factory=list)     # 图片路径/URL
    tags: list[str] = field(default_factory=list)       # 话题标签
    note_type: NoteType = NoteType.IMAGE_TEXT
    publish_status: PublishStatus = PublishStatus.DRAFT
    note_id: Optional[str] = None                        # 平台返回的笔记 ID
    safety_score: float = 1.0
    created_at: datetime = field(default_factory=_utcnow)
    published_at: Optional[datetime] = None
    metrics: Optional[NoteMetrics] = None


@dataclass
class NoteMetrics:
    """笔记数据指标."""
    views: int = 0
    likes: int = 0
    collects: int = 0
    comments: int = 0
    shares: int = 0


@dataclass
class TopicSuggestion:
    """选题建议."""
    title: str
    target_audience: str = ""
    differentiation: str = ""   # 差异化角度
    estimated_heat: str = "中"  # 高/中/低
    source: str = ""            # 来源（热门/竞品/AI推荐）
    reference_notes: list[str] = field(default_factory=list)


@dataclass
class CompetitorNote:
    """竞品笔记."""
    title: str
    note_id: str = ""
    author: str = ""
    likes: int = 0
    collects: int = 0
    comments: int = 0
    note_type: NoteType = NoteType.IMAGE_TEXT
    tags: list[str] = field(default_factory=list)


@dataclass
class CustomerMessage:
    """客户消息."""
    sender_id: str
    content: str
    message_type: str = "text"  # text/image/order
    timestamp: datetime = field(default_factory=_utcnow)
    replied: bool = False
    reply_content: Optional[str] = None


@dataclass
class Order:
    """订单."""
    order_id: str
    product_name: str
    buyer_id: str
    amount: float
    status: str = "pending"  # pending/paid/shipped/completed/refunded
    created_at: datetime = field(default_factory=_utcnow)
    notes: str = ""


# 为了避免前向引用问题，这里用字符串注解
# Note 里的 NoteMetrics 需要放在 NoteMetrics 定义之后
# 但 dataclass 不支持这种前向引用，所以用 __post_init__ 或移动顺序
# 上面已经把 NoteMetrics 放在 Note 前面了，但 type hint 会报错
# 修复方案：使用 Optional["NoteMetrics"] 并加上 from __future__ import annotations
