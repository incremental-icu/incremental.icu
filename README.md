# Incremental.icu

<p align="left">
  <a href="https://github.com/inrenping/incremental.icu/stargazers"><img src="https://img.shields.io/github/stars/inrenping/incremental.icu?style=flat&label=Stars&labelColor=1F2937&color=2563EB" alt="Stargazers"></a>
  <a href="https://github.com/inrenping/incremental.icu/network/members"><img src="https://img.shields.io/github/forks/inrenping/incremental.icu?style=flat&label=Forks&labelColor=1F2937&color=7C3AED" alt="Forks"></a>
  <a href="https://github.com/inrenping/incremental.icu/issues"><img src="https://img.shields.io/github/issues/inrenping/incremental.icu?style=flat&label=Issues&labelColor=1F2937&color=D97706" alt="Issues"></a>
</p>

**[incremental.icu](https://incremental.icu)** 是一款专为运动爱好者打造的跨平台数据同步工具。它能够连接佳明（Garmin）与高驰（Coros）平台，通过调用官方提供的 API 同步数据，协助用户高效管理运动记录，特别适合同时使用多设备记录运动状态的用户。

创建这个工具的初衷，是为了解决佳明海内外版本数据不同步导致 Strava 和微信运动等数据国内平台只能二选一的问题。后来使用了高驰训练平台感觉不错，于是增加了高驰的平台支持。

---

## ✨ 主要功能

- **一键同步**：设定两个平台，手动拉取最新 10 条数据，进行差量同步。
- **手动同步**：在数据列表中找到对应的数据记录，手动推送到指定平台。
- **定时同步**：设定定时任务，自动执行同步。

## 🌐 支持平台

| 平台 | 支持状态 | 交互格式 |
| :--- | :---: | :--- |
| 佳明 (Garmin) 国内版 | ✅ 已支持 | `.FIT` |
| 佳明 (Garmin) 国际版 | ✅ 已支持 | `.FIT` |
| 高驰 (Coros) | ✅ 已支持 | `.FIT` |

## 🚀 线上版本

访问 **[incremental.icu](https://incremental.icu)** 即可直接注册并开始管理您的运动数据。

---

## 🛠 开发者指南

如果您希望参与开发或自行部署本项目，请参考以下技术细节。

### 技术栈

- **前端框架**: [Next.js (App Router)](https://nextjs.org/)
- **后端服务**: [FastAPI (Python)](https://fastapi.tiangolo.com/) 提供接口
- **UI 组件库**: [shadcn/ui](https://ui.shadcn.com/) & [Alpine.js](https://alpinejs.dev/)
- **数据库**: [Neon (Serverless Postgres)](https://neon.tech/)
- **邮件服务**: [Resend](https://resend.com/)
- **图标库**: [Tabler Icons](https://tabler-icons.io/)
- **garth**: 一个模拟佳明客户端的 python 包，目前版本 0.5.17 更高版本支持佳明国内版有问题。

### 部署与 CI/CD

1. **代码规范**: 前端部署之前记得先跑一下 `npm run lint`。
2. **前端部署**: 托管于 [Vercel](https://vercel.com/)。
    - *注意*: 后端接口地址需要配置在 `/vercel.json` 中。
3. **自动化工作流**:
    - **CI/CD**: 前端通过 Vercel 自动部署，后端通过 [GitHub Actions](https://github.com/features/actions)。
    - **定时任务**: 使用 GitHub Actions 处理定时同步任务。

### 监控与分析

- **网站状态监测**: [Better Stack](https://betterstack.com/)
- **网站流量分析**: [Google Analytics](https://analytics.google.com/)

### 参考资源与授权

- **登录逻辑参考**:  [running_page](https://github.com/yihong0618/running_page) (前端佳明高驰登录逻辑参考，但因为前端登录的有效性会掉，目前已经不采用前端登录的方式)
- **佳明高驰数据同步参考**: [garmin-sync-coros](https://github.com/XiaoSiHwang/garmin-sync-coros)
- **身份验证**: 支持 Google 和 GitHub 原生的 OAuth 单点登录。

## 🤖 MCP 接口对接

本项目提供基于 [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) 的标准接口，允许 AI 助手（如 ChatGPT Desktop、Claude Desktop 等）直接查询用户的运动数据，实现"让 AI 帮你查跑步记录和心率数据"的能力。

- **服务地址**: `https://incremental.icu/mcp`（`streamable-http` 传输协议）
- **鉴权方式**: 支持两种
  1. **JWT Bearer**: 复用主站签发的 JWT，请求头携带 `Authorization: Bearer <JWT>`（JWT 与主站共享 `SECRET_KEY`，HS256 签名）
  2. **OAuth 2.1**: Authorization Code + PKCE，支持客户端自动发现授权服务器（`/.well-known/oauth-protected-resource`）

### 可用 Tools

| Tool | 描述 |
| --- | --- |
| `get_latest_run` | 获取当前用户最近一次跑步记录（距离、时长、心率、配速、爬升等） |
| `get_run_history` | 分页查询历史跑步记录，支持日期范围过滤 |
| `get_heart_rate_history` | 获取最近 N 天或指定日期范围的每日心率汇总 |
| `get_daily_heart_rate` | 获取指定日期的当天心率汇总与采样明细 |
| `query_user_profile` | 获取当前登录用户的基本信息（用户名、邮箱、会员状态、时区等） |
| `say_hello` | 示例工具，用于验证连接是否正常 |

### 客户端接入示例

ChatGPT Desktop / Claude Desktop 等支持 MCP 的客户端，可通过 `streamable-http` 桥接配置：

```json
{
  "mcpServers": {
    "incremental": {
      "command": "npx",
      "args": [
        "-y", "@tollbit/mcp-streamable-http-shim",
        "--url", "https://incremental.icu/mcp",
        "-H", "Authorization: Bearer <YOUR_JWT>"
      ]
    }
  }
}
```

> 支持 OAuth 的客户端可省略 `-H` 参数，首次调用时会自动发起 OAuth 授权流程。

MCP 服务由独立仓库 [incremental-mcp](https://github.com/inrenping/incremental-mcp) 实现，部署于 Linux 服务器，与主站共享同一 PostgreSQL 数据库。

## 📈 项目管理

本项目使用 [GitHub Projects](https://github.com/users/inrenping/projects/1) 进行进度管理与任务追踪。
