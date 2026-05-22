# 财税甩单平台 (Tax Agent Platform)

财税行业高效协作平台 — 让财税公司之间可以互相甩单、接单、内部派单，并支持客户直接下单。

## 技术栈

### 后端
- **Node.js** + **Express** - RESTful API 服务
- **MongoDB** + **Mongoose** - 数据存储
- **JWT** - 用户认证
- **bcryptjs** - 密码加密

### 前端
- **微信小程序原生开发** - WXML / WXSS / JavaScript
- CSS 变量主题系统（浅色/深色模式）
- SaaS 风格 UI 设计

## 项目结构

```
xs-agent/
├── server/                    # 后端服务
│   ├── app.js                # 入口文件
│   ├── config/               # 配置文件
│   │   └── index.js
│   ├── models/               # 数据模型
│   │   ├── User.js           # 用户模型
│   │   ├── Company.js        # 公司模型
│   │   ├── Order.js          # 订单模型
│   │   ├── Task.js           # 任务模型
│   │   └── Review.js         # 评价模型
│   ├── controllers/          # 控制器
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   ├── taskController.js
│   │   ├── companyController.js
│   │   ├── reviewController.js
│   │   └── matchController.js
│   ├── routes/               # 路由
│   │   ├── auth.js
│   │   ├── orders.js
│   │   ├── tasks.js
│   │   ├── companies.js
│   │   ├── reviews.js
│   │   └── match.js
│   ├── middleware/           # 中间件
│   │   └── auth.js           # JWT认证 + 角色权限
│   └── package.json
│
└── client/                   # 微信小程序
    ├── app.json
    ├── app.js
    ├── app.wxss              # 全局样式（含主题变量）
    ├── sitemap.json
    ├── utils/
    │   └── request.js        # HTTP 请求封装
    ├── images/               # TabBar 图标
    └── pages/
        ├── login/            # 登录注册
        ├── home/             # 接单大厅（首页）
        ├── publish/          # 发布订单
        ├── order/            # 我的订单 + 订单详情
        ├── my/               # 个人中心
        └── company/          # 公司管理 + 内部派单
```

## 数据库模型

| 模型 | 说明 | 关键字段 |
|------|------|---------|
| User | 用户 | name, phone, password, role, tags, city, businessTypes |
| Company | 公司 | name, license, city, rating, members |
| Order | 订单 | title, description, price, industry, city, status, publisherId, receiverId |
| Task | 内部任务 | orderId, assigneeId, assignerId, title, status |
| Review | 评价 | orderId, fromUser, toUser, score, content |

## API 接口

### 用户模块
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/profile` - 获取个人信息
- `PUT /api/auth/profile` - 更新个人信息

### 订单模块
- `POST /api/orders` - 发布订单
- `GET /api/orders` - 获取订单列表（支持筛选/搜索）
- `GET /api/orders/my` - 获取我的订单
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders/:id/accept` - 接单
- `POST /api/orders/:id/status` - 更新订单状态

### 任务模块
- `POST /api/tasks` - 创建内部任务
- `GET /api/tasks` - 获取任务列表
- `GET /api/tasks/company` - 获取公司任务
- `POST /api/tasks/:id/status` - 更新任务状态

### 公司模块
- `POST /api/companies` - 创建公司
- `GET /api/companies/my` - 获取我的公司
- `GET /api/companies/:id` - 获取公司详情
- `POST /api/companies/members` - 添加成员
- `DELETE /api/companies/members/:userId` - 移除成员

### 匹配模块
- `GET /api/match/orders` - 智能匹配推荐订单
- `GET /api/match/users/:orderId` - 推荐接单人选

### 评价模块
- `POST /api/reviews` - 创建评价
- `GET /api/reviews/user/:userId` - 获取用户评价

## 匹配算法

基于评分系统的智能推荐：

| 匹配维度 | 分值 | 说明 |
|---------|------|------|
| 标签匹配 | +3/个 | 用户标签与订单标签重合 |
| 业务类型 | +5 | 用户业务类型与订单行业一致 |
| 同城匹配 | +2 | 用户与订单在同一城市 |
| 发布方同城 | +1 | 用户与发布方在同一城市 |
| 评分加成 | 0-5 | 用户历史评分 |

## 权限系统

| 角色 | 权限说明 |
|------|---------|
| admin | 全部权限 |
| company_admin | 管理公司、成员、派单 |
| staff | 执行任务 |
| user | 普通用户（发布/接单） |

## 订单状态流转

```
pending → accepted → processing → completed
    ↓                              ↑
    +---------- cancelled ---------+
```

## 快速启动

### 前置要求
- Node.js >= 16
- MongoDB >= 6.0
- 微信开发者工具

### 启动后端

```bash
cd server
npm install
npm run dev
```

### 启动微信小程序

1. 用微信开发者工具打开 `client` 目录
2. 修改 `utils/request.js` 中的 `BASE_URL` 为实际后端地址
3. 编译运行

### 环境变量

在 `server/.env` 中配置：

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/tax-agent
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

## UI 设计风格

- **极简 SaaS 风格** - 灵感来自 Notion / Linear / Stripe
- **卡片化布局** - 圆角卡片 + 微阴影
- **大留白** - 呼吸感排版
- **双主题** - 浅色/深色模式自适应
- **高级感配色** - 克制的主色 + 层次分明的灰色体系
- **柔和动效** - 过渡动画自然流畅
