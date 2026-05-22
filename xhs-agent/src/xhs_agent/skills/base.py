"""Skill 基类 — 所有 Skill 的公共接口"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import yaml

from xhs_agent.core.config import Settings
from xhs_agent.core.llm import LLMManager
from xhs_agent.core.logger import log


@dataclass
class SkillMeta:
    """Skill 元数据（从 SKILL.yaml 加载）."""
    name: str
    description: str
    version: str = "0.1.0"
    depends_on: list[str] = field(default_factory=list)
    triggers: list[str] = field(default_factory=list)  # 触发关键词


class BaseSkill(ABC):
    """所有 Skill 的基类.

    子类只需实现 ``execute`` 方法。框架负责：
    - 加载 SKILL.yaml 元数据
    - 注入 LLMManager 和 Settings
    - 统一错误处理和日志
    """

    def __init__(
        self,
        settings: Settings,
        llm_manager: LLMManager,
        meta: Optional[SkillMeta] = None,
    ) -> None:
        self.settings = settings
        self.llm = llm_manager
        self.meta = meta or self._load_meta()
        self.log = log.getChild(self.meta.name)

    # ------------------------------------------------------------------ #
    #  abstract                                                            #
    # ------------------------------------------------------------------ #

    @abstractmethod
    async def execute(self, state: dict[str, Any]) -> dict[str, Any]:
        """执行 Skill 核心逻辑.

        Args:
            state: 工作流状态（包含输入和前序 Skill 的输出）

        Returns:
            更新后的状态字典
        """

    # ------------------------------------------------------------------ #
    #  optional overrides                                                  #
    # ------------------------------------------------------------------ #

    def validate_input(self, state: dict[str, Any]) -> None:
        """校验输入状态。抛出异常即表示不合法。"""

    def get_tools(self) -> list:
        """返回该 Skill 对外暴露的工具（供其他 Agent 调用）."""
        return []

    # ------------------------------------------------------------------ #
    #  helpers                                                             #
    # ------------------------------------------------------------------ #

    def _load_meta(self) -> SkillMeta:
        """从具体子类所在目录的 SKILL.yaml 加载元数据."""
        import inspect
        # 使用具体子类的模块路径，而非 base.py 的路径
        cls_file = inspect.getfile(self.__class__)
        skill_dir = Path(cls_file).parent
        yaml_path = skill_dir / "SKILL.yaml"
        if yaml_path.exists():
            raw = yaml.safe_load(yaml_path.read_text(encoding="utf-8")) or {}
            return SkillMeta(
                name=raw.get("name", self.__class__.__name__),
                description=raw.get("description", ""),
                version=raw.get("version", "0.1.0"),
                depends_on=raw.get("depends_on", []),
                triggers=raw.get("triggers", []),
            )
        return SkillMeta(
            name=self.__class__.__name__,
            description="(no SKILL.yaml)",
        )

    async def _call_llm(self, task: str, messages: list) -> str:
        """调用 LLM 的便捷方法（带 fallback）."""
        return await self.llm.invoke_with_fallback(messages, task=task)
