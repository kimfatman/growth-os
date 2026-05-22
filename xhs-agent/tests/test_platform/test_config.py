"""配置加载测试"""
import sys
sys.path.insert(0, "src")

from xhs_agent.core.config import load_settings, ConfigError, ProviderConfig
import pytest


def test_load_settings():
    settings = load_settings()
    assert len(settings.providers) == 3
    assert settings.niche == "AI工具"
    assert settings.primary_provider().name == "wcgio"


def test_provider_validation():
    with pytest.raises(ConfigError):
        ProviderConfig(name="", base_url="http://x", api_key_env="X", models={}).validate()

    with pytest.raises(ConfigError):
        ProviderConfig(name="test", base_url="http://x", api_key_env="X", models={}).validate()


def test_resolve_model():
    settings = load_settings()
    provider, model = settings.resolve_model("content_generation")
    assert model == "gpt-5.2"
    assert provider.name == "wcgio"

    provider, model = settings.resolve_model("topic_research")
    assert model == "deepseek-chat"


def test_fallback_providers():
    settings = load_settings()
    fallbacks = settings.fallback_providers()
    assert len(fallbacks) == 2
    assert fallbacks[0].name == "huan666"
