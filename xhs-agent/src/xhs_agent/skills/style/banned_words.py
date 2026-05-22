"""违禁词库 + 检测引擎 — 小红书全量词库版"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class SafetyResult:
    """安全检测结果."""
    is_safe: bool
    banned: list[dict] = field(default_factory=list)
    risky: list[str] = field(default_factory=list)
    score: float = 1.0
    fixed_text: Optional[str] = None


BANNED_WORDS: dict[str, list[str]] = {
    "absolute": [
        "最好", "最佳", "最优", "第一", "唯一", "必须", "绝对", "100%",
        "全网最低", "史上最强", "独一无二", "无敌", "万能", "神器",
        "顶级", "极致", "最全", "最火", "最热", "最牛", "最值",
        "超值", "超好用", "超厉害", "超推荐", "强烈推荐",
        "首选", "必选", "必买", "必备", "必看", "必收藏",
        "百分百", "毫无疑问", "毋庸置疑", "没有之一", "完胜",
        "秒杀", "碾压", "吊打", "秒懂", "一次见效", "立刻见效",
    ],
    "medical": [
        "治疗", "治愈", "药效", "疗效", "处方", "根治", "特效药",
        "包治百病", "无副作用", "FDA认证", "医学证明", "临床验证",
        "医生推荐", "医院专用", "药监局认证", "药用", "疗效显著",
        "三天见效", "七天见效", "告别", "远离疾病", "健康管理",
        "排毒", " detox", "祛湿", "散寒", "活血化瘀",
        "抗炎", "消炎", "止痛", "抗菌", "提高免疫力",
    ],
    "false_claim": [
        "日赚万元", "躺赚", "零风险", "稳赚不赔", "保本保息",
        "限时免费", "最后一天", "仅剩最后", "暴富", "财富自由",
        "月入过万", "日入过千", "被动收入", "财务自由",
        "内部渠道", "内部名额", "内部优惠", "限时抢购",
        "错过等一年", "仅限今天", "手慢无", "限量发售",
        "没有风险", "百分百成功", "保证收益",
    ],
    "traffic_diversion": [
        "加微信", "加V", "私聊", "留联系方式", "详情咨询",
        "点击链接", "关注有礼", "扫码添加", "私信我",
        "主页有方式", "看主页", "主页第一条",
        "加群", "拉群", "进群", "扫码进群",
        "dd", "滴滴", "丝我", "撕我", "踢我",
        "点我头像", "看我置顶", "看个签",
    ],
    "competition": [
        "抄袭", "盗图", "盗文", "搬运", "恶意举报",
        "刷量", "刷赞", "刷粉", "买粉", "数据造假",
        "水军", "黑粉", "引战", "拉踩", "对比拉踩",
    ],
    "transaction": [
        "出售", "转让", "代购", "代发", "批发", "零售",
        "价格面议", "私聊报价", "低价出", "白菜价",
        "转卖", "二手", "闲置转让", "便宜出",
    ],
    "political": [
        "涉政", "敏感话题", "领导人姓名不当使用",
        "国家机密", "内部文件", "未公开信息",
    ],
    "sexual": [
        "有色内容", "低俗", "露骨", "性暗示",
        "成人内容", "色情",
    ],
}

RISK_WORDS = [
    "赚钱", "副业", "割韭菜", "内部价", "渠道价",
    "代购", "A货", "高仿", "同款平替",
    "变现", "搞钱", "开源", "兼职",
    "价格", "多少钱", "怎么买", "在哪买",
    "效果", "有用吗", "真的吗",
    "测评", "对比", "推荐",
    "避雷", "踩雷", "拔草",
    "你们", "大家", "姐妹",
]

_REPLACEMENT_MAP: dict[str, str] = {
    "最好": "很不错",
    "最佳": "很棒的",
    "最优": "很优的",
    "第一": "很厉害的",
    "唯一": "少见的",
    "必须": "建议",
    "绝对": "真的",
    "100%": "很大程度上",
    "全网最低": "很划算",
    "史上最强": "真的很强",
    "独一无二": "很少见",
    "无敌": "很强",
    "万能": "很实用",
    "神器": "好物",
    "顶级": "很棒的",
    "极致": "很极致",
    "首选": "很推荐",
    "必买": "值得买",
    "必备": "建议备着",
    "必看": "值得看",
    "必收藏": "建议收藏",
    "百分百": "很大程度上",
    "毫无疑问": "可以说",
    "没有之一": "很难得",
    "完胜": "表现更好",
    "秒杀": "很给力",
    "碾压": "明显更好",
    "加微信": "看主页",
    "私聊": "评论区",
    "私信我": "评论区见",
    "看主页": "评论区",
    "加群": "关注我",
    "滴滴": "评论区",
    "丝我": "评论区见",
    "撕我": "评论区见",
}

REPLACEMENTS: dict[str, list[str]] = {
    word: [replacement] for word, replacement in _REPLACEMENT_MAP.items()
}


def check_content(text: str) -> SafetyResult:
    banned_found: list[dict] = []
    risky_found: list[str] = []

    for category, words in BANNED_WORDS.items():
        for word in words:
            if word in text:
                banned_found.append({"word": word, "category": category})

    for word in RISK_WORDS:
        if word in text:
            risky_found.append(word)

    is_safe = len(banned_found) == 0
    score = max(0.0, min(1.0, 1.0 - len(banned_found) * 0.15 - len(risky_found) * 0.03))

    return SafetyResult(
        is_safe=is_safe,
        banned=banned_found,
        risky=risky_found,
        score=round(score, 2),
    )


def auto_fix(text: str, result: SafetyResult) -> str:
    fixed = text
    for item in result.banned:
        word = item["word"]
        replacements = REPLACEMENTS.get(word)
        if replacements:
            fixed = fixed.replace(word, replacements[0])
        else:
            fixed = fixed.replace(word, "xxx")
    return fixed
