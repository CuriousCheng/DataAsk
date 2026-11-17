# DataAsk 实现对照文档（逆写需求）

> 版本：2026-11-17
> 依据：①`wrenai-ref/README.md`（WrenAI 官方开源仓库说明）②`wren-like/docs/需求文档.docx`（v1.0，129 张截图）③`wren-console` 后端源码与实测接口 ④本仓库当前代码与实际运行结果
> 口径：**只写能验证的东西**。页面写了“未接”，就是代码里确实没有 `/api/` 调用；接口写了“实测”，就是当前虚拟机返回过 200。

---

## 1. 系统架构（实际跑起来的形态）

```
                    ┌──────────────────────────────────────────┐
 浏览器  ───────────▶│  网关 5200（gateway/server.mjs）          │
                    │  /home/*                  → 5280          │
                    │  /modeling/*              → 5284          │
                    │  /knowledge/*             → 5285          │
                    │  /api-management/*        → 5286          │
                    │  /settings/project/*      → 5281          │
                    │  /settings/organization/* → 5282          │
                    │  /settings/*              → 5283          │
                    └───────────────┬──────────────────────────┘
                                    │ 七个独立 Vue 工程（代码不合）
                                    ▼
                    ┌──────────────────────────────────────────┐
                    │ wren-console 后端 8000（FastAPI）         │
                    │  + 本次新增的 8 类接口                    │
                    └───────┬──────────────────┬───────────────┘
                            │                  │
                       Wren 0.17.1        MCP 网关 9300/9301
                       （语义层 MDL）      （给 Claude/Cursor/Cline）
                            │
                       Trino 8888（联邦）
                            │
        MySQL（销售/财务/人力）  +  PostgreSQL（仓储/维修/配件）
```

**七个前端工程**（npm workspaces 统一依赖，各自 vite 独立端口）：

| 工程 | 端口 | 网关前缀 | 职责 |
|---|---|---|---|
| vue-frontend | 5280 | `/home/` | 首页、讨论串、人工制品库、公开内嵌页 |
| vue-modeling | 5284 | `/modeling/` | 建模：模型、关系、指标、视图、编译 |
| vue-knowledge | 5285 | `/knowledge/` | 知识库文件树（yaml/md 增删改） |
| vue-api | 5286 | `/api-management/` | MCP 接入、AI 设置、API 密钥、调用历史 |
| vue-settings-project | 5281 | `/settings/project/` | 项目设置 |
| vue-settings-org | 5282 | `/settings/organization/` | 组织设置 |
| vue-settings-user | 5283 | `/settings/` | 用户 / 智能体功能设置 |
| shared-ui | — | — | 登录壳、导航、http、toast、业务切换器 |

**统一登录**：`dataask_token` cookie（`path=/`，7 天）+ localStorage 兜底；跨端口不重复登录；401 统一拦截。

---

## 2. WrenAI 官方能力对照

官方 README 把能力分成 **开源（Apache-2.0）** 与 **商业（Cloud / Enterprise Plus）** 两层，这里逐条对照我们的实现。

### 2.1 开源部分（README 明确属于 OSS）

| 官方能力 | 官方描述要点 | 我们的实现 | 状态 |
|---|---|---|---|
| **MDL 语义层** | models / columns / relationships / views / cubes，YAML 存仓库 | 模型、列、关系、视图、指标全部落盘为文件，且有图形编辑器 | ✅ 完整 |
| **受治理的 text-to-SQL** | 问题 → 按 MDL 规划 → dry-plan 校验 → 执行 | `/api/ask`：MDL 注入 prompt → LLM 出 SQL → `dry_run` → `run_sql` | ✅ 完整 |
| **MCP Server** | 给 Claude Code / Cursor / Cline 等 agent 用 | 网关 9300(HTTP)/9301(SSE)，三个工具 `list_projects`/`get_project_schema`/`ask` | ✅ 可用（实测 tools/call 通） |
| **Knowledge（instructions.md）** | 业务规则、术语、SQL 配对 | `knowledge/rules/*.md`、`knowledge/sql/*.md`，文件树可增删改，带 4 种模板 | ✅ 完整 |
| **Memory（LanceDB 混合检索）** | 历史问答向量召回 | 后端有 `recall_queries` / `store_query`，建索引接口 `POST /index` | ✅ 接口在，前端有「建记忆索引」按钮 |
| **多数据源连接（22+）** | BigQuery/Snowflake/ClickHouse/Redshift/Databricks/DuckDB… | 后端只实现 **mysql / postgresql / sqlserver**（经 Trino catalog） | ⚠️ 部分（3 种） |
| **CLI（wren query / ask / skills）** | 命令行工作流 | 未接，也没有终端 UI | ❌ 未做 |
| **Agent SDK（wren-langchain / wren-pydantic）** | Python SDK | 未接 | ❌ 未做 |
| **GenBI 仪表盘（浏览器端 wasm 应用）** | agent 生成可分享 dashboard | 未做；后端也没有图表产物接口 | ❌ 未做 |

### 2.2 商业部分（README 明确列为商业）

| 商业能力 | 我们的实现 | 说明 |
|---|---|---|
| 行级/列级安全（RLS/CLS）与用户组访问控制 | ❌ 未做 | 后端无权限模型；原「访问控制」页已按评估删除 |
| GenBI UI / 仪表盘 / 嵌入 / API（商业版形态） | ⚠️ 部分 | 我们做了“讨论串公开内嵌”（自研 token），不是商业版的仪表盘嵌入 |
| Scenario AI harnesses（GenBI Apps、Agentic Mode、AI 辅助上下文） | ❌ 未做 | 「智能体模式」「强度」等假 UI 已从对话框删除 |
| 高级安全与审计、SLA、VPC/air-gapped 部署 | ❌ 未做 | 单机部署 |
| Git Sync（`git push` 即发布） | ❌ 未做 | |

---

## 3. 原需求文档（v1.0，129 截图）逐章对照

### 3.1 全局

| 原需求 | 实现 | 状态 |
|---|---|---|
| 顶部导航 5 项：首页/建模/知识/API/数据安全 | 七工程共用顶栏，5 项都在 | ⚠️ 「数据安全」点击只弹“还没做” |
| 中右：组织名 ⌄ / 项目名 ⌄ | 组织名为静态文案；项目名为**真实业务切换器**（列 `/api/projects`、可切换/新建） | ⚠️ 组织名未接 |
| 右：智能体模式、点数、试用、礼物、头像 AH | 只保留头像（显示真实用户名首字母） | ❌ 点数/计费/试用未做（商业能力） |
| 头像菜单：登录身份、当前组织+ID、路线图、退出登录 | 有登录身份与组织信息，退出登录在顶栏 | ⚠️ 路线图未做 |
| URL 规范 `/settings/<分组>/<页面>` | 已统一 | ✅ |
| 颜色/尺寸/圆角规范 | 已按取样实现（nav 56px、左栏 310px、设置左栏 232px） | ✅ |

### 3.2 首页（4.1）

| 原需求 | 实现 | 状态 |
|---|---|---|
| 左栏 310px + 主区空态 + 底部固定输入区 | 一致 | ✅ |
| 示例问题三张卡（HR 假问题） | 换成通用示例（数据概览/分布/趋势），并标注“示例问题” | ✅ 改造 |
| 组织下拉 / 新建组织弹窗 | 后端有 `/api/orgs`，组织设置页可建；首页顶栏下拉未接 | ⚠️ 部分 |
| 项目下拉（搜索、+新项目、三个项目） | **真实项目列表**（无搜索，项目数=真实） | ✅ 真实化 |
| 新建项目两步（类型选择 + 名称/语言/时区） | 只有“名称 + 数据源”一步 | ⚠️ 简化 |
| 试用到期升级弹窗 | 未做（商业） | ❌ |

### 3.3 讨论串详情（4.2）

| 原需求 | 实现 | 状态 |
|---|---|---|
| 左栏讨论串列表 + 主区消息流 + 底部输入 | 一致，列表来自 `/api/threads` | ✅ |
| 讨论串本地存储 | **改为后端持久化**（`data/threads.json`），跨设备可见 | ✅ 增强 |
| 澄清卡片（Ask User Question）静态组件 | 未做 | ❌ |
| 回答里的表格 | 真实表格渲染（最多 200 行） | ✅ |
| 回答里的**图表** | 未做；后端也不产图表 | ❌ |
| 「查看生成的 SQL」折叠 | 有 | ✅ |
| 追问追加到同一串 | 有（`POST /threads/{id}/ask`） | ✅ 增强 |
| 「保存为人工制品」 | 有 | ✅ 增强 |
| 更多菜单（重命名/删除/移动） | 重命名、删除有；“移动文件夹”已删（后端无文件夹概念） | ⚠️ 部分 |

### 3.4 人工制品库（4.3）

| 原需求 | 实现 | 状态 |
|---|---|---|
| 标题「人工制品库」 | 有 | ✅ |
| 筛选条件 + 日期区间（双月日历） | 有日期区间 | ✅ |
| 搜索框 + 搜索按钮 | 有（`/api/artifacts?q=`） | ✅ |
| 空态文案「尚未有任何人工制品——请在讨论串中创建…」 | 一致 | ✅ |
| 卡片列表 + 详情 | 卡片 + 弹窗（SQL、表格、删除） | ✅ 增强 |
| 后端 | 本次新增 `/api/artifacts` CRUD | ✅ 新增 |

### 3.5 建模（4.4）

| 原需求 | 实现 | 状态 |
|---|---|---|
| 左树模型列表 + 画布节点 + 关系连线 | 一致（真实数据） | ✅ |
| 加入表（数据源 → schema → 表） | 有（`POST /models`） | ✅ |
| 列别名/描述编辑 | 有（`PUT /models/{m}/json`） | ✅ |
| 关系编辑（类型、删除、保存） | 有（`PUT /relationships/json`） | ✅ |
| 指标（cubes）图形编辑器 | 本次新增：列表/新建/度量/维度/时间维度/删除 | ✅ 新增 |
| 视图（views）编辑器 | 本次新增：侧栏视图列表 + 新建/编辑 SQL（后端新增 CRUD） | ✅ 新增 |
| 编译 | 有（`POST /build`） | ✅ |
| 视图数量、模型计数 | 真实 | ✅ |
| 数据预览（100 行） | 按钮在，后端无单表预览接口 → 显示“暂不显示数据” | ⚠️ 未接 |
| 建模 AI 助理（生成语义/生成关联） | 弹层里两个按钮只提示“还没接后端” | ❌ |

### 3.6 知识（4.5）

| 原需求 | 实现 | 状态 |
|---|---|---|
| 左树文件夹可折叠、显示文件数 | 有，且**新增/删除文件夹**（后端新接口） | ✅ 增强 |
| 顶部工具：＋新增知识、上传 | 新增知识（4 模板）有；**上传**未做 | ⚠️ 部分 |
| 新增知识弹窗四选一卡片 | 有（指标/术语表/SQL 配对/行为指引） | ✅ |
| 文件头：路径 + 已发布标签 + 预览/源码切换 | 只有源码编辑（预览未做） | ⚠️ 部分 |
| Markdown 预览 + 缺 frontmatter 提示 | 未做 | ❌ |
| 源码带行号 | 未做（纯 textarea） | ❌ |
| 状态栏（markdown · 24 行） | 未做 | ❌ |
| 文件图标菜单（模板/空白/询问智能体） | 模板有；询问智能体无 | ⚠️ 部分 |
| 发布/更新状态 | 未做（后端无发布流） | ❌ |
| 建记忆索引 | 本次新增按钮（`POST /index`） | ✅ 新增 |

### 3.7 API（4.6）

| 原需求 | 实现 | 状态 |
|---|---|---|
| 二级菜单 4 项：历史记录、密钥、计费、参考文档 | 5 项：MCP 接入、AI 设置、历史记录、密钥、参考文档（**计费已删**） | ✅ 调整 |
| API 历史记录表 | 真实（`/api/logs`：时间/用户/业务/问题/结果/耗时） | ✅ 真实化 |
| API 密钥管理 | 真实（`/api/keys` 建/删/列表，明文只显示一次） | ✅ 真实化 |
| MCP 接入 | 真实地址 + Cline/Cursor JSON + 三工具说明 | ✅ 增强 |
| AI 设置 | 协议/BaseURL/模型/Key + 测试连接 + 模型 chips（**本次从组织设置挪到 API**） | ✅ 新增 |

### 3.8 数据安全

| 原需求 | 实现 | 状态 |
|---|---|---|
| 数据安全页（列级/行级策略、策略预览） | 顶栏有入口，点击提示“还没做” | ❌ |

### 3.9 设置

**项目设置**（原 7 项 → 现 5 项）

| 原页面 | 实现 | 状态 |
|---|---|---|
| 常规（项目 ID/名称/AI 语言/时区/描述） | 仍是静态表单，未接后端 | ⚠️ 未接 |
| 业务管理 | 本次新增：真实项目列表 + 启停 + 切换 + 删除 + 新建 | ✅ 新增 |
| 访问控制（三档权限） | 已删除（后端无权限模型） | ❌ 砍掉 |
| 数据连接 | 真实（列表/新建/测试/删除，自动注册 Trino catalog） | ✅ 真实化 |
| 讨论串追踪 | 已删除（后端无埋点） | ❌ 砍掉 |
| 内嵌讨论串 | 本次重做：选讨论串 → 生成 token → 公开只读页 + iframe 代码 | ✅ 新增 |
| 评测（即将推出） | 已删除 | ❌ |
| 危险区域 | 静态（项目删除在“业务管理”里） | ⚠️ |

**组织设置**（原 6 项 → 现 8 项）

| 原页面 | 实现 | 状态 |
|---|---|---|
| 常规（组织名/ID） | 真实（`/api/orgs`，可改名、复制标识） | ✅ 真实化 |
| 成员 | 真实（组织成员 + 组织角色 owner/admin/member + 增删改） | ✅ 真实化 |
| 用户 | 本次新增：真实账号 CRUD + 改角色 + 重置密码 | ✅ 新增 |
| 活动日志 | 真实（`/api/logs`，网页/API 两个 tab） | ✅ 真实化 |
| API 密钥（组织） | 只读真实列表 + 跳转 API 页管理 | ✅ 真实化 |
| MCP（组织） | 真实网关地址 + 说明 | ✅ 真实化 |
| AI 设置 | 已移出到 API 页 | ➡️ 迁移 |
| 系统设置 | 本次新增：`/api/config`（池大小、并发、空闲回收、viewer 可见 SQL） | ✅ 新增 |
| 危险区域 | 真实：删除组织（二次确认）；退出组织标注后端无接口 | ✅ 真实化 |

**智能体功能 / 用户设置**

| 原页面 | 实现 | 状态 |
|---|---|---|
| 技能（上传 zip，含 SKILL.md） | 页面在，**0 个接口调用** | ❌ 静态 |
| 记忆 | 页面在，**0 个接口调用** | ❌ 静态 |
| 个人资料 | 真实用户名/角色（`/api/me`），邮箱后端无字段 | ⚠️ 部分 |
| 修改密码 | 真实（`PUT /api/me/password`） | ✅ 真实化 |
| 危险区域 | 静态 | ❌ |

---

## 4. 我们额外做的（原产品 / wren-console 都没有）

以下能力是**本次为对接真实后端新增**的，原需求文档和 wren-console 前端都没有：

| 能力 | 后端 | 前端 | 说明 |
|---|---|---|---|
| 文件夹创建/删除 | `POST /projects/{n}/mkdir`、`DELETE /projects/{n}/folder` | 知识页 | 原版只能填完整路径，建不了空文件夹 |
| 文件列表含目录 | `GET /files` 返回 `dirs` | 知识页 | |
| 视图 CRUD | `GET/POST/PUT/DELETE /projects/{n}/views*` | 建模侧栏 | 落盘 `views/<名>/metadata.yml` + `sql.yml` |
| 讨论串持久化 | `/api/threads` 全套 + 串内提问 | 首页 | 原版 `/api/ask` 一问一答，不存历史 |
| 讨论串公开分享 | `/api/threads/{id}/share`、`/api/public/threads/{token}` | 内嵌页 + 公开只读页 | iframe 嵌入 |
| 人工制品 | `/api/artifacts` CRUD | 人工制品库 | 从讨论串沉淀结果 |
| API Key | `/api/keys` CRUD + `X-API-Key` 全局鉴权 | API 页 / 组织页 | key 只存 sha256 |
| 调用日志 | `/api/logs`（`/api/ask` 与串内提问都记） | API 历史 / 活动日志 | 保留 500 条 |
| 组织 | `/api/orgs` + 成员增删改 | 组织设置 | 组织与账号两层 |
| 业务管理页 | 复用 `/api/projects` + `/start` `/stop` | 项目设置 | |
| 业务切换器 | 复用 `/api/projects` | 七个页面顶栏 | 写 localStorage，切换即刷新 |
| AI 设置页 | 复用 `/api/ai`、`/api/ai/test`、`/test-saved` | API 页 | 云端 key / 本地 Ollama 同一套 |

---

## 5. 后端接口清单（当前实际存在，实测过）

```
认证/配置
  POST /api/login                 POST /api/me/password
  GET  /api/me                    GET/PUT /api/config
  GET/PUT /api/ai                 POST /api/ai/test, /api/ai/test-saved

数据源
  GET/POST /api/datasources       DELETE /api/datasources/{id}
  POST /api/datasources/test      POST /api/datasources/{id}/test
  GET  /api/datasources/{id}/schemas | /tables?schema_name= | /columns

业务（项目）
  GET/POST /api/projects          DELETE /api/projects/{n}
  POST /api/projects/{n}/start | /stop | /build | /index | /remember
  GET  /api/projects/{n}/status | /schema | /memory | /tables

建模
  GET/POST /api/projects/{n}/models          DELETE /models/{m}
  GET/PUT  /api/projects/{n}/models/{m}      GET/PUT .../{m}/json
  GET/PUT  /api/projects/{n}/relationships   GET/PUT .../relationships/json
  GET/POST /api/projects/{n}/cubes           GET/PUT/DELETE .../cubes/{c}(/json)
  GET/POST /api/projects/{n}/views           GET/PUT/DELETE .../views/{v}(/json)   ← 新增

文件
  GET  /api/projects/{n}/files               GET/PUT/DELETE /api/projects/{n}/file
  POST /api/projects/{n}/mkdir               ← 新增
  DELETE /api/projects/{n}/folder            ← 新增

问答
  POST /api/ask
  GET  /api/projects/{n}/cubes  |  POST /api/projects/{n}/cube（指标查询）

讨论串
  GET/POST /api/threads           GET/PATCH/DELETE /api/threads/{id}
  POST /api/threads/{id}/ask      POST/DELETE /api/threads/{id}/share   ← 新增
  GET  /api/public/threads/{token}（无鉴权）                              ← 新增

人工制品
  GET/POST /api/artifacts         GET/DELETE /api/artifacts/{id}          ← 新增

密钥与日志
  GET/POST /api/keys              DELETE /api/keys/{id}                   ← 新增
  GET/DELETE /api/logs             ← 新增

组织与用户
  GET/POST /api/orgs              PATCH/DELETE /api/orgs/{id}             ← 新增
  POST /api/orgs/{id}/members     PATCH/DELETE .../members/{user}         ← 新增
  GET/POST /api/users             DELETE /api/users/{name}
  PUT /api/users/{name}/role | /password
```

MCP 网关工具：`list_projects`、`get_project_schema`、`ask(question, project)`。

---

## 6. 未做清单（按原因分类）

### 6.1 后端完全没有，需先设计接口

| 功能 | 缺什么 | 若要做的前置 |
|---|---|---|
| 评测页 | 评测集（问题 + 期望 SQL/结果）、运行记录、判定逻辑 | 定 schema 与判分规则 |
| 访问控制（RLS/CLS） | 权限模型、策略存储、SQL 重写注入 | 设计策略 DSL |
| 讨论串追踪 | 埋点表、追踪类型、反馈者 | 加 `/api/traces` |
| 图表 / 仪表盘 | 图表产物存储、渲染组件、分享 | 定产物格式（建议 ECharts option JSON） |
| 技能 / 记忆（智能体功能） | 技能包上传解析、记忆条目 CRUD | 加 `/api/skills`、`/api/memories` |
| 数据安全页 | 同上 RLS | |
| 知识文件上传 | 上传接口（zip/文件） | 加 `/api/upload` |
| 建模 AI 助理（生成语义/关联） | LLM 生成结构化建议的接口 | 复用 `/api/ai` + 结构化输出 |
| 数据预览（单表 100 行） | 单表查询接口 | 加 `/api/projects/{n}/preview` |

### 6.2 属于官方商业版，我们主动不做

点数/计费/试用升级、GenBI 仪表盘、Git Sync、VPC/air-gapped、Agent SDK。

### 6.3 能低成本补，但还没排期

| 项 | 做法 |
|---|---|
| 项目设置 → 常规 | 接 `/api/projects`（名称/描述可写文件 `wren_project.yml`） |
| 组织名接首页顶栏下拉 | 复用 `/api/orgs` |
| 知识页 Markdown 预览 / 行号 / 状态栏 | 纯前端 |
| 讨论串“更多”菜单的移动文件夹 | 需先给讨论串加 folder 字段 |
| 组织危险区域「退出组织」 | 后端加 `DELETE /api/orgs/{id}/members/{self}` |

---

## 7. 与 wren-console 原版前端对照

| 原版页面 | 新前端 | 差异 |
|---|---|---|
| AskView（提问 + 指标查询） | 首页 + `/home/artifacts` | 新增多轮讨论串、人工制品、公开内嵌；指标查询改成首页弹窗 |
| ProjectsView（业务列表） | 项目设置 → 业务管理 | 功能对齐，多了“切到此业务” |
| BusinessView（表/关系/指标/文件/编译/索引） | 建模页 + 知识页 | 拆成两个应用；新增视图编辑器 |
| ModelEditor | 建模 → 元数据弹窗 | 对齐 |
| RelationshipEditor | 建模 → 关系弹窗 | 对齐 |
| CubeEditor | 建模 → 指标弹窗 | 对齐（含度量/维度/时间维度） |
| SourcesView（数据源） | 项目设置 → 数据连接 | 对齐 |
| SettingsView（AI + 系统参数） | API → AI 设置；组织设置 → 系统设置 | 拆开 |
| UsersView（用户） | 组织设置 → 用户 | 对齐 |
| — | 组织设置全套 | **新增**（原版只有用户，无组织） |
| — | API 密钥 / 调用历史 / 人工制品 | **新增** |

---

## 8. 已知问题 / 技术债

1. **数据预览未接**：建模抽屉里“预览数据”显示占位说明（后端无单表查询接口）。
2. **项目设置 → 常规**仍是静态表单（项目名/语言/时区不落盘）。
3. **智能体功能（技能/记忆）** 两个页面是纯静态 UI。
4. **顶栏组织名** 是静态文案“示例科技有限公司”，实际组织数据在组织设置里。
5. **讨论串只渲染成功回答的表格**，没有图表；多轮对话按顺序渲染，未做“重新生成/分支”。
6. **MCP 网关无客户端鉴权**（后端调用用 `WC_API_KEY`），只能放可信内网。
7. **重启后端必须带 env**：手动重启要 `set -a; . config/.env`，否则 `MASTER_KEY` 丢失导致 `/api/datasources` 500（曾踩过）。
8. **测试数据残留**：`汽车销售分析` 下有一个测试视图 `big_orders`、一条讨论串 `t1`、一个人工制品 `art1`；可删。
9. **文件锁定**：dev server 运行时改写源码偶发 `EIO`，需要先停对应端口。
10. **`/home/artifacts`** 路径在顶层路由里，直接访问 `/artifacts` 会被网关 404（需带 `/home` 前缀）。

---

## 9. 页面清单（当前可访问）

| 路径 | 页面 | 数据来源 |
|---|---|---|
| `/home/` | 首页 | 真实 |
| `/home/<threadId>` | 讨论串 | 真实 |
| `/home/artifacts` | 人工制品库 | 真实 |
| `/home/embed/<token>` | 公开只读内嵌页 | 真实（无鉴权） |
| `/modeling/` | 建模 | 真实 |
| `/knowledge/file-explorer` | 知识 | 真实 |
| `/api-management/mcp` | MCP 接入 | 静态文案 + 真实地址 |
| `/api-management/ai` | AI 设置 | 真实 |
| `/api-management/keys` | API 密钥 | 真实 |
| `/api-management/history` | 调用历史 | 真实 |
| `/settings/project/general` | 项目常规 | 静态 |
| `/settings/project/businesses` | 业务管理 | 真实 |
| `/settings/project/data-connection` | 数据连接 | 真实 |
| `/settings/project/embed-threads` | 内嵌讨论串 | 真实 |
| `/settings/project/danger-zone` | 项目危险区域 | 静态 |
| `/settings/organization/general` | 组织常规 | 真实 |
| `/settings/organization/members` | 成员 | 真实 |
| `/settings/organization/users` | 用户 | 真实 |
| `/settings/organization/activity-log` | 活动日志 | 真实 |
| `/settings/organization/api-keys` | 组织密钥（只读） | 真实 |
| `/settings/organization/mcp` | 组织 MCP | 静态地址 + 真实组织名 |
| `/settings/organization/system` | 系统设置 | 真实 |
| `/settings/organization/danger-zone` | 组织危险区域 | 真实（删除组织） |
| `/settings/user/profile` | 个人资料 / 改密码 | 真实 |
| `/settings/agent/skills` | 技能 | 静态 |
| `/settings/agent/memories` | 记忆 | 静态 |
| `/settings/user/danger-zone` | 用户危险区域 | 静态 |

---

## 10. 启动方式

```powershell
powershell -ExecutionPolicy Bypass -File D:\Work\ZZZ\start-all.ps1   # 起网关 + 七工程
powershell -ExecutionPolicy Bypass -File D:\Work\ZZZ\stop-all.ps1    # 停
# 访问 http://localhost:5200/home/
```

虚拟机侧：

```bash
cd ~/Projects/project-wren-trino && ./start.sh     # 后端 + Trino
bash /tmp/restart_backend.sh                       # 只重启后端（带 env）
bash /tmp/restart_gateway.sh                       # 只重启 MCP 网关（带 WC_API_KEY）
```

---

*本文档由代码与运行结果反推，未包含任何未实现的“设计设想”。*
