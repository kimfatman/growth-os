"""核心异常体系"""


class XHSAgentError(Exception):
    """Base exception for xhs-agent."""


class ConfigError(XHSAgentError):
    """Configuration error."""


class PlatformError(XHSAgentError):
    """小红书平台交互错误."""


class AuthError(PlatformError):
    """认证/Cookie 失效."""


class RateLimitError(PlatformError):
    """限流错误."""


class PublishError(PlatformError):
    """发布失败."""


class SkillError(XHSAgentError):
    """Skill 执行错误."""


class WorkflowError(XHSAgentError):
    """工作流执行错误."""


class LLMError(XHSAgentError):
    """LLM 调用错误."""


class LLMFallbackExhausted(LLMError):
    """所有 Provider 都失败."""
