# 🔴 XHS-Agent — 小红书多智能体运营系统

> 基于 LangGraph 的小红书智能运营系统，Skill 模块化架构，支持多 LLM Provider 自动 fallback。

## ✨ 特性

- **Skill 模块化** — 每个能力独立封装，可插拔、可复用
- **多 Agent 协作** — 选题→内容→排版→安全→发布，全链路自动化
- **多 LLM Provider** — 自动 fallback，永不宕机
- **违禁词引擎** — 小红书敏感词检测 + 自动替换
- **CDP 发布** — 通过 Chrome DevTools Protocol 控制浏览器自动发布
- **生产级工程** — 重试退避、原子写入、结构化日志、异常体系

## 🏗️ 架构

```
src/xhs_agent/
├── core/         # 配置、LLM管理、日志、异常
├── platform/     # 小红书 API 客户端 + Cookie 管理
├── skills/       # Skill 模块系统
│   ├── content/  # 内容生成（LangGraph 工作流）
│   ├── topic/    # 选题调研（热门+竞品+AI推荐）
│   ├── style/    # 排版优化 + 违禁词检测
│   ├── publish/  # CDP 自动发布
│   ├── analytics/# 数据分析（开发中）
│   └── customer/ # 智能客服（开发中）
├── workflows/    # 工作流引擎
└── api/          # FastAPI HTTP 接口
```

## 🚀 快速开始

```bash
# 克隆
git clone https://github.com/xiaona-ai/xhs-agent.git
cd xhs-agent

# 安装依赖
pip install langgraph langchain-core langchain-openai fastapi uvicorn httpx pyyaml

# 配置
cp config/providers.yaml.example config/providers.yaml
# 编辑 providers.yaml 填入你的 LLM API key

# 启动
PYTHONPATH=src python -m xhs_agent.app
```

## 📡 API

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/topics/research` | POST | 选题调研 |
| `/api/notes/create` | POST | 生成笔记 |
| `/api/pipeline/full` | POST | 完整管线 |
| `/api/content/check` | POST | 违禁词检测 |

## 🧩 Skill 系统

每个 Skill 是独立模块：

```python
from xhs_agent.skills.base import BaseSkill

class MySkill(BaseSkill):
    async def execute(self, state: dict) -> dict:
        # 你的逻辑
        result = await self._call_llm("task_name", messages)
        return {**state, "output": result}
```

## 🔍 违禁词检测

```python
from xhs_agent.skills.style.banned_words import check_content, auto_fix

result = check_content("这个神器太无敌了，加微信了解")
# SafetyResult(is_safe=False, banned=[...], score=0.4)

fixed = auto_fix("这个神器太无敌了，加微信了解", result)
# "这个好物太超强了，看主页了解"
```

## 📋 技术栈

- **LangGraph** — 多 Agent 状态机编排
- **LangChain** — LLM 抽象层
- **FastAPI** — HTTP API
- **httpx** — 异步 HTTP 客户端
- **websockets** — CDP 通信

## 🤝 贡献

欢迎 PR 和 Issue！特别欢迎：
- 新 Skill 贡献
- 违禁词库补充
- 更多 LLM Provider 适配

## 📄 License

MIT

---

> Built with ❤️ by [xiaona-ai](https://github.com/xiaona-ai)
