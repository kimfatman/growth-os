"""违禁词检测测试"""
import sys
sys.path.insert(0, "src")

from xhs_agent.skills.style.banned_words import check_content, auto_fix, SafetyResult


def test_clean_text():
    result = check_content("这是一篇很好的分享")
    assert result.is_safe is True
    assert result.score == 1.0
    assert result.banned == []


def test_banned_absolute():
    result = check_content("这个神器是最好的")
    assert result.is_safe is False
    assert len(result.banned) == 2  # 神器 + 最好
    assert any(b["word"] == "神器" for b in result.banned)
    assert any(b["word"] == "最好" for b in result.banned)


def test_banned_traffic():
    result = check_content("加微信了解详情")
    assert result.is_safe is False
    assert result.banned[0]["category"] == "traffic_diversion"


def test_risky_words():
    result = check_content("这个副业可以赚钱")
    assert result.is_safe is True  # risky ≠ banned
    assert len(result.risky) == 2
    assert result.score < 1.0


def test_auto_fix():
    result = check_content("这个神器太无敌了")
    fixed = auto_fix("这个神器太无敌了", result)
    assert "神器" not in fixed
    assert "无敌" not in fixed
    assert "好物" in fixed
    assert "超强" in fixed


def test_score_degradation():
    """多个违禁词应该大幅降低分数"""
    result = check_content("最好的神器，加微信了解，日赚万元")
    assert result.score <= 0.2
    assert len(result.banned) >= 4


def test_empty_text():
    result = check_content("")
    assert result.is_safe is True
    assert result.score == 1.0
