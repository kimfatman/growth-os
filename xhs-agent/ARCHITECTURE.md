# XHS-Agent 架构设计 v2
> OpenClaw 级别的工程标准

## 设计原则

1. **Skill 模块化** — 每个能力是独立 Skill，可插拔、可复用
2. **工作流引擎** — 基于 LangGraph 的状态机，支持条件分支、并行、重试
3. **Provider 抽象** — 多 LLM Provider + 自动 fallback
4. **平台接口层** — 小红书 API 的完整封装，Cookie 管理、签名、反爬
5. **持久化状态** — 所有状态可序列化，支持断点续跑
6. **可观测性** — 结构化日志、指标收集、错误追踪
7. **配置驱动** — YAML 配置，不硬编码

## 目录结构

```
xhs-agent/
├── README.md
├── pyproject.toml
├── config/
│   ├── settings.yaml          # 主配置
│   ├── providers.yaml         # LLM Provider 配置
│   ├── banned_words.yaml      # 违禁词库（可热更新）
│   └── schedules.yaml         # 定时任务配置
├── src/
│   └── xhs_agent/
│       ├── __init__.py
│       ├── app.py             # FastAPI 应用入口
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py      # 配置加载器
│       │   ├── llm.py         # LLM Provider 管理（fallback, routing）
│       │   ├── state.py       # 全局状态管理
│       │   ├── logger.py      # 结构化日志
│       │   └── errors.py      # 异常体系
│       ├── platform/
│       │   ├── __init__.py
│       │   ├── client.py      # 小红书 API 客户端（完整封装）
│       │   ├── auth.py        # Cookie 管理、刷新、签名
│       │   ├── merchant.py    # 千帆商家 API
│       │   ├── publisher.py   # 笔记发布（CDP 控制 Chromium）
│       │   └── models.py      # 平台数据模型（Note, Comment, Order...）
│       ├── skills/
│       │   ├── __init__.py
│       │   ├── base.py        # Skill 基类
│       │   ├── topic/         # 选题 Skill
│       │   │   ├── SKILL.yaml
│       │   │   ├── agent.py
│       │   │   └── prompts.py
│       │   ├── content/       # 内容生成 Skill
│       │   │   ├── SKILL.yaml
│       │   │   ├── agent.py
│       │   │   ├── prompts.py
│       │   │   └── templates/ # 内容模板
│       │   ├── style/         # 排版 Skill
│       │   │   ├── SKILL.yaml
│       │   │   ├── agent.py
│       │   │   └── banned_words.py
│       │   ├── publish/       # 发布 Skill
│       │   │   ├── SKILL.yaml
│       │   │   ├── agent.py
│       │   │   └── scheduler.py
│       │   ├── analytics/     # 数据分析 Skill
│       │   │   ├── SKILL.yaml
│       │   │   └── agent.py
│       │   └── customer/      # 智能客服 Skill
│       │       ├── SKILL.yaml
│       │       ├── agent.py
│       │       └── faq.yaml
│       ├── workflows/
│       │   ├── __init__.py
│       │   ├── engine.py      # 工作流引擎（LangGraph wrapper）
│       │   ├── daily_ops.py   # 日常运营工作流
│       │   ├── publish.py     # 发布工作流
│       │   └── customer.py    # 客服工作流
│       └── api/
│           ├── __init__.py
│           ├── routes.py      # API 路由
│           └── schemas.py     # 请求/响应模型
├── tests/
│   ├── conftest.py
│   ├── test_skills/
│   ├── test_platform/
│   └── test_workflows/
└── scripts/
    ├── setup.sh               # 环境初始化
    └── deploy.sh              # 部署脚本
```

## Skill 系统设计

每个 Skill 是一个独立模块，包含：
- `SKILL.yaml` — 元数据（名称、描述、依赖、触发条件）
- `agent.py` — Agent 逻辑（LangGraph 节点）
- `prompts.py` — Prompt 模板
- 可选的模板、配置、脚本

### Skill 基类

```python
class BaseSkill(ABC):
    name: str
    description: str
    
    @abstractmethod
    async def execute(self, state: dict) -> dict:
        """执行 Skill 核心逻辑"""
    
    def get_tools(self) -> list:
        """返回该 Skill 提供的工具"""
    
    def get_graph_nodes(self) -> dict:
        """返回该 Skill 的 LangGraph 节点"""
```

## 工作流引擎

基于 LangGraph，但封装了：
- **工作流注册** — YAML 定义工作流，动态加载
- **状态持久化** — 支持 SQLite/Redis 后端
- **错误恢复** — 自动重试 + 断点续跑
- **并行执行** — 多个 Skill 可并行运行
- **条件路由** — 根据状态动态选择下一步

## Provider 管理

```yaml
# providers.yaml
providers:
  primary:
    name: wcgio
    base_url: https://520.wcgio.com/v1
    models:
      fast: deepseek-chat
      quality: gpt-5.2
      creative: grok-4.1-fast
  fallback:
    name: huan666
    base_url: https://ai.huan666.de/v1
    models:
      fast: deepseek-v3.2
      quality: claude-sonnet-4-6

task_routing:
  topic_research: fast
  content_generation: quality
  style_formatting: fast
  customer_service: fast
  data_analysis: fast
```

## 发布流程（CDP）

```
Publisher Agent
  ↓
CDP WebSocket → Chromium (localhost:9222)
  ↓
小红书 Web 端发布页面
  ↓
自动填写标题、正文、上传图片、选择话题
  ↓
点击发布 → 验证成功 → 记录笔记 ID
```
