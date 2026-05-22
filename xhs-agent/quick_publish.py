"""快速发布测试 — 打开页面后请手动点击「上传图文」"""
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
os.environ["XHS_COOKIE_PATH"] = os.path.join(os.path.dirname(__file__), "config", "cookie.json")

from xhs_agent.core.config import load_settings
from xhs_agent.core.llm import LLMManager
from xhs_agent.skills.content.agent import ContentSkill
from xhs_agent.skills.style.agent import StyleSkill
from xhs_agent.skills.publish.agent import PublishSkill
from xhs_agent.skills.publish.cover import CoverSkill
from xhs_agent.skills.topic.agent import TopicSkill

async def main():
    cfg = load_settings()
    llm = LLMManager(cfg)

    print("=" * 60)
    print("  江之都审计 · 一键发布")
    print("  Chrome已打开后请手动点击「上传图文」")
    print("  Agent会等待30秒并自动填写")
    print("=" * 60)

    print("\n1/3 选题调研...")
    topic_skill = TopicSkill(cfg, llm)
    r = await topic_skill.execute({"niche": cfg.niche, "count": 4})
    sug = r.get("topic_suggestions", [])
    for i, s in enumerate(sug, 1):
        print(f"  [{i}] {s['title']}")
    selected = sug[0]["title"] if sug else cfg.niche
    print(f"  → {selected}")

    print("\n2/3 AI生成+排版+封面...")
    content_skill = ContentSkill(cfg, llm)
    r2 = await content_skill.execute({
        "topic": selected, "target_audience": "武汉中小企业老板、财务负责人", "style": "痛点干货",
    })
    style_skill = StyleSkill(cfg, llm)
    r3 = await style_skill.execute(r2)
    cover_skill = CoverSkill(cfg, llm)
    r4 = await cover_skill.execute(r3)
    print(f"  标题: {r4.get('final_title','')}")
    print(f"  安全评分: {r4.get('safety_result',{}).get('score','N/A')}")
    print(f"  封面: {r4.get('cover',{}).get('title_text','')}")

    print("\n3/3 发布（等待30秒，请到Chrome点「上传图文」）...")
    publish_skill = PublishSkill(cfg, llm, cdp_url="http://localhost:9222")
    r5 = await publish_skill.execute(r4)
    status = r5.get("publish_status", "")
    print(f"\n  状态: {status}")
    if status == "form_filled":
        print("  ✅ 标题和正文已自动填入！去Chrome检查后点发布吧")
    elif status == "awaiting_type_select":
        print("  ⏳ 未检测到编辑器，请手动在Chrome中点击「上传图文」")
    else:
        print(f"  {r5.get('status', '')}")

if __name__ == "__main__":
    asyncio.run(main())
