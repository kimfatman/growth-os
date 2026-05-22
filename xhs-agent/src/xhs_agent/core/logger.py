"""结构化日志"""
import logging
import sys
from typing import Optional


def setup_logger(
    name: str = "xhs_agent",
    level: int = logging.INFO,
    fmt: Optional[str] = None,
) -> logging.Logger:
    """创建结构化日志器."""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(level)
    logger.propagate = False  # 防止日志重复
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter(
        fmt or "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))
    logger.addHandler(handler)
    return logger


log = setup_logger()
