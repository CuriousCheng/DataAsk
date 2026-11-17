# DataAsk 产品需求文档 v2.0（完整版 · 含未实现）

| 项 | 内容 |
|---|---|
| 版本 | v2.0（在 v1.0 基础上补全未实现模块的详细设计） |
| 日期 | 2026-11-17 |
| 依据 | ①WrenAI 官方 README（OSS / 商业边界、MDL、memory、MCP、GenBI）②`需求文档.docx` v1.0（129 截图）③`wren-console` 后端源码 ④当前实现实测 |
| 状态标记 | ✅ 已实现　◐ 部分　✗ 未实现（本文档给出设计） |

---

## 0. 本版变更

v1.0 只覆盖"已建成的东西 + 缺口清单"。v2.0 把**未实现的部分也写成可开发的需求**：每个 ✗ 模块都给出目的、界面、数据模型、接口草案、验收标准，开发可以直接照着做。

---

## 1. 产品定位

**一句话**：把分散在多个数据库里的表，变成一个能用中文直接问、且答案受语义层约束的分析台。

**目标用户**

| 角色 | 场景 | 关键诉求 |
|---|---|---|
| 业务分析者 | 临时取数、看趋势 | 不会 SQL 也能问；答案可信 |
| 数据工程 | 建语义模型、维护口径 | 建模可视化；口径只定义一次 |
| 平台/管理员 | 接数据源、控制权限 | 能接多库；能管人、管权限 |
| 外部 Agent | Claude/Cursor 代答 | MCP 接入；返回结构化结果 |

**与官方 WrenAI 的关系**

| 官方能力 | 定位 | 我们的取舍 |
|---|---|---|
| MDL 语义层 | OSS | 全量实现（模型/列/关系/指标/视图） |
| 受治理 text-to-SQL | OSS | 实现（MDL→LLM→dry_run→执行） |
| MCP Server | OSS | 实现（三工具，双传输） |
| Knowledge / Memory | OSS | 实现（文件 + 向量召回 + 索引） |
| 22+ 数据源 | OSS | 只做 MySQL / PostgreSQL / SQL Server（经 Trino） |
| CLI / Agent SDK / GenBI 仪表盘 | OSS | 不做 |
| RLS / CLS / 审计 | 商业 | **规划中**（见 5.10） |
| 计费 / 点数 / Git Sync | 商业 | 不做 |

---

## 2. 架构

```
浏览器 ──▶ 网关 5200 ──▶ 七个独立前端工程（5280-5286）
                │
                └──▶ /api ──▶ 后端 8000（FastAPI）
                                   ├──▶ Wren 0.17.1（MDL 语义层）
                                   ├──▶ Trino 8888（联邦，按数据源分 catalog）
                                   └──▶ MCP 网关 9300(HTTP)/9301(SSE)
```

**多主机数据源**：数据源的 `host/port` 直接写进 Trino catalog 的 `connection-url`，保存后重启 Trino 生效。可达性由 Trino 所在主机决定。

---

## 3. 角色与权限矩阵

账号角色（全局）：

| 动作 | admin | editor | viewer |
|---|:--:|:--:|:--:|
| 数据源增删改 | ✅ | ❌ | ❌ |
| 业务创建/删除 | ✅ | ✅ | ❌ |
| 建模（模型/关系/指标/视图/编译） | ✅ | ✅ | ❌ |
| 知识文件读写 | ✅ | ✅ | ❌ |
| 提问 | ✅ | ✅ | ✅ |
| 查看 SQL | ✅ | ✅ | 由系统设置决定 |
| 用户/组织/密钥/日志 | ✅ | ❌ | ❌ |
| AI 配置 / 系统参数 | ✅ | ❌ | ❌ |

组织角色（`owner/admin/member`）与账号角色独立，目前只用于成员展示，**尚未参与鉴权**（规划见 5.9）。

---

## 4. 功能地图

| 模块 | 子功能 | 状态 |
|---|---|---|
| 认证 | 登录、跨工程共享、API Key、改密码 | ✅ |
| 业务 | 列表、新建、启停、删除、顶栏切换 | ✅ |
| 讨论串 | 创建、多轮、SQL 折叠、表格、重命名、删除 | ✅ |
| 讨论串 | 图表渲染、澄清卡片、重新生成 | ✗ |
| 人工制品 | 保存、列表、搜索、日期筛选、详情、删除 | ✅ |
| 问答 | MDL 注入、召回、dry_run、执行、日志 | ✅ |
| 指标查询 | 按 cube 选度量/维度查询 | ✅ |
| 建模 | 模型/列/关系/指标/视图/编译/删除 | ✅ |
| 建模 | 单表数据预览、AI 助理（生成语义/关联） | ✗ |
| 知识 | 文件树、增删文件夹、模板新建、编辑保存 | ✅ |
| 知识 | Markdown 预览、行号、发布状态、上传 zip | ✗ |
| 数据源 | 列表、新建、测试、删除、跨主机 | ✅ |
| 数据安全 | 数据源页签 | ✅ |
| 数据安全 | 行级/列级/会话属性 | ✗ |
| API | MCP 接入、密钥、调用历史 | ✅ |
| API | MCP 客户端鉴权 | ✗ |
| AI | 协议/地址/模型/Key/测试/切换 | ✅ |
| 组织 | 组织 CRUD、成员、用户、活动日志、系统设置 | ✅ |
| 内嵌 | 分享 token、公开只读页、iframe | ✅ |
| 内嵌 | 会话属性策略、域名白名单 | ✗ |
| 评测 | 评测集、运行、判分、报告 | ✗ |
| 图表/仪表盘 | 图表产物、看板、分享 | ✗ |
| 智能体功能 | 技能、记忆管理 | ✗ |
| 追踪 | 讨论串追踪埋点与报表 | ✗ |

---

## 5. 详细需求

> 约定：`P0` 必须有、`P1` 应该有、`P2` 可延后。

### 5.1 认证与会话

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-101 | 用户名密码登录，HMAC token 7 天有效 | P0 | ✅ |
| FR-102 | 登录态跨七个工程共享（cookie `dataask_token`） | P0 | ✅ |
| FR-103 | 支持 `X-API-Key` 调用全部业务接口 | P1 | ✅ |
| FR-104 | 修改自己的密码（原密码校验） | P1 | ✅ |
| FR-105 | 登录失败次数限制与锁定 | P2 | ✗ |

**FR-105 设计**：`config/login_attempts.json` 记 `{username: {count, last_ts}}`；5 次失败锁 10 分钟；接口返回 429 + 剩余时间。

### 5.2 业务（项目）

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-110 | 业务列表（数据源、模型数、创建时间） | P0 | ✅ |
| FR-111 | 新建业务（名称 + 数据源） | P0 | ✅ |
| FR-112 | 启动/停止业务（MCP 进程） | P1 | ✅ |
| FR-113 | 删除业务（二次确认，删目录 + 清 profile） | P0 | ✅ |
| FR-114 | 顶栏切换当前业务（写 localStorage，七个页面跟随） | P0 | ✅ |
| FR-115 | 业务级配置：显示名、AI 回应语言、时区、描述 | P1 | ✗ |

**FR-115 设计**
- 存储：业务目录下 `settings.json`（`{display_name, ai_language, timezone, description}`）；缺省回退目录名。
- 界面：项目设置 → 常规；语言 9 项、时区下拉带搜索。
- 接口：`GET/PUT /api/projects/{n}/settings`。
- 生效：语言写进提问 prompt（`请用{language}回答`）；时区写进 MDL 的 session property 与日期展示。
- 验收：改语言后同一问题的回答语言随之变化。

### 5.3 讨论串与问答

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-120 | 提问创建讨论串并持久化，标题取问题前 40 字 | P0 | ✅ |
| FR-121 | 串内多轮追问，消息按时间顺序 | P0 | ✅ |
| FR-122 | 每条回答展示 SQL（折叠）+ 结果表格（≤200 行） | P0 | ✅ |
| FR-123 | 失败区分阶段（llm / dry_run / run_sql） | P0 | ✅ |
| FR-124 | 回答可保存为人工制品 | P1 | ✅ |
| FR-125 | viewer 不可见 SQL（系统设置开关） | P1 | ✅ |
| FR-126 | **图表渲染**：回答可切换表格/柱状/折线/饼图 | P1 | ✗ |
| FR-127 | **重新生成**：对同一问题重跑一次，保留历史 | P2 | ✗ |
| FR-128 | **澄清卡片**：问题歧义时反问（选项式） | P2 | ✗ |

**FR-126 图表设计**
- 判型：`row_count ≤ 200` 且列数 ≤ 8；若存在数值列 + 维度列 → 默认柱状图。
- 前端用 ECharts，图表配置纯前端生成（不打后端）。
- 用户可切换：表格 / 柱状 / 折线 / 饼图；选择记在消息上（`chart_type`）。
- 人工制品保存时带上 `chart_type`，详情页同样渲染。
- 验收：问"各品牌销量"→ 默认柱状图，X 轴品牌、Y 轴销量。

**FR-127 重新生成设计**
- 接口：`POST /api/threads/{id}/regenerate {message_at}` → 重跑该问题，新回答追加为一条消息并标记 `replaces`。
- 前端在该回答下显示"重新生成"按钮；旧回答保留但折叠。

### 5.4 人工制品

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-130 | 从讨论串沉淀（记录问题、SQL、结果、来源串） | P1 | ✅ |
| FR-131 | 列表卡片（标题、问题、行数、时间） | P1 | ✅ |
| FR-132 | 关键词搜索 + 日期区间筛选 | P1 | ✅ |
| FR-133 | 详情弹窗（SQL + 表格 + 删除） | P1 | ✅ |
| FR-134 | 图表型人工制品 | P2 | ✗ |

### 5.5 建模

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-140 | 模型树 + 画布节点 + 关系连线 | P0 | ✅ |
| FR-141 | 加入表（数据源→schema→表 → 生成模型） | P0 | ✅ |
| FR-142 | 列别名/描述编辑保存 | P0 | ✅ |
| FR-143 | 模型描述/别名编辑 | P1 | ✅ |
| FR-144 | 删除模型（联动清理关系） | P1 | ✅ |
| FR-145 | 关系增删改（基数、条件） | P0 | ✅ |
| FR-146 | 指标（Cube）编辑器（度量/维度/时间维度） | P1 | ✅ |
| FR-147 | 视图（View）编辑器（SELECT/WITH + 说明） | P1 | ✅ |
| FR-148 | 编译（返回模型数与视图数） | P0 | ✅ |
| FR-149 | **单表数据预览**（前 100 行） | P1 | ✗ |
| FR-150 | **AI 助理**：根据表名/样例生成列描述与关系建议 | P2 | ✗ |

**FR-149 设计**
- 接口：`POST /api/projects/{n}/preview {model, limit=100}` → 通过 Wren 执行 `SELECT * FROM <model> LIMIT 100`。
- 界面：建模抽屉"预览数据"，表格展示，标明截断。
- 验收：预览行数 ≤100，列名与模型一致。

**FR-150 设计**
- 接口：`POST /api/projects/{n}/suggest {kind: "description"|"relationships"}`，后端把列名/样例喂给已配置模型，返回结构化 JSON（不是直接落盘）。
- 界面：AI 助理弹层列出建议，逐条"采纳/忽略"；采纳才写 `metadata.yml`。
- 硬要求：**AI 只建议不落盘**（防止幻觉污染语义层）。

### 5.6 知识

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-160 | 文件树（yaml/md），文件夹折叠 | P0 | ✅ |
| FR-161 | 新建文件（规则/指标/术语/SQL配对 模板） | P1 | ✅ |
| FR-162 | 新建/删除文件夹（含子文件） | P1 | ✅ |
| FR-163 | 重命名、删除文件 | P2 | ✅ |
| FR-164 | 编辑保存 | P0 | ✅ |
| FR-165 | 建记忆索引 | P1 | ✅ |
| FR-166 | **Markdown 预览 + 行号 + 状态栏** | P2 | ✗ |
| FR-167 | **发布状态**（已发布 / 未发布 / 待更新） | P2 | ✗ |
| FR-168 | **上传文件/zip 到知识库** | P2 | ✗ |

**FR-166 设计**：预览用 markdown-it；源码视图带行号；状态栏显示 `markdown · N 行`；缺 frontmatter 时提示"给 AI 的摘要"。

**FR-167 设计**：知识文件内容哈希与上次发布比对 → `已发布 / 尚未更新`；状态存 `knowledge/.published.json`。

**FR-168 设计**：`POST /api/projects/{n}/upload`（multipart），限制 `.md/.yml/.zip`，解压后落到 `knowledge/`，文件名做安全清洗。

### 5.7 数据源

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-170 | 数据源列表（类型/地址/库/账号/catalog/上次测试） | P0 | ✅ |
| FR-171 | 新建 + 测试连接 | P0 | ✅ |
| FR-172 | 删除（同步移除 catalog） | P1 | ✅ |
| FR-173 | 跨主机连接 | P0 | ✅ |
| FR-174 | 数据源级只读/可写标记 | P2 | ✗ |
| FR-175 | 更多数据源类型（Snowflake/BigQuery/ClickHouse…） | P2 | ✗ |

**FR-174 设计**：数据源加 `readonly` 字段，写进 Trino catalog（`connector` 层不支持时在 Wren 侧拒绝非 SELECT）。

### 5.8 API / MCP / AI

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-180 | MCP 三工具（list_projects / get_project_schema / ask） | P0 | ✅ |
| FR-181 | 双传输（9300 HTTP / 9301 SSE） | P1 | ✅ |
| FR-182 | 页面展示 MCP 地址与客户端配置 | P1 | ✅ |
| FR-183 | API Key 增删查（明文只显示一次，存 sha256） | P1 | ✅ |
| FR-184 | 调用历史（含筛选、清空） | P1 | ✅ |
| FR-185 | AI 配置（协议/地址/模型/Key）+ 测试取模型列表 | P0 | ✅ |
| FR-186 | 首页显示真实模型并可切换 | P1 | ✅ |
| FR-187 | **MCP 网关客户端鉴权** | P1 | ✗ |
| FR-188 | **按 Key 限流/配额** | P2 | ✗ |

**FR-187 设计**：网关校验 `Authorization: Bearer <api-key>`，命中 `apikeys` 表才放行；未配置 key 时退回"仅内网"模式并在页面提示。

**FR-188 设计**：`apikeys` 加 `quota_per_day`，网关按天计数（内存 + 落盘），超限返 429。

### 5.9 组织与用户

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-190 | 组织 CRUD（名称、标识、成员数） | P1 | ✅ |
| FR-191 | 成员增删改（owner/admin/member） | P1 | ✅ |
| FR-192 | 用户管理（新建、改角色、重置密码、删除） | P0 | ✅ |
| FR-193 | 活动日志（网页/API 两个页签） | P1 | ✅ |
| FR-194 | 系统设置（池大小、并发、空闲回收、viewer 可见 SQL） | P1 | ✅ |
| FR-195 | 危险区域（删除组织） | P2 | ✅ |
| FR-196 | **组织角色参与鉴权**（成员只能看本组织业务） | P1 | ✗ |
| FR-197 | **退出组织** | P2 | ✗ |
| FR-198 | **业务按组织隔离** | P1 | ✗ |

**FR-196/198 设计**：`projects.json` 增加 `org` 字段；查询业务列表时按 `user → orgs.members` 过滤；用户可属于多个组织时取当前顶栏选中的组织。

### 5.10 数据安全（RLS / CLS / 会话属性）

> 原需求文档 4.7，目前只有"数据源"页签，其余三块未实现。这是**最大的功能缺口**。

#### FR-200 会话属性（Session Attribute）

| 项 | 设计 |
|---|---|
| 目的 | 把"当前用户是谁/什么部门/什么等级"变成可在策略里引用的变量 |
| 数据 | `config/attributes.json`：`{items:[{id,name,type:"String\|Number\|Boolean",description}]}` |
| 分配 | `attribute_values.json`：`{user: {attr_id: value}}`、`{group: {attr_id: value}}` |
| 接口 | `GET/POST/PATCH/DELETE /api/attributes`；`POST /api/attributes/{id}/assign {user\|group, value}` |
| 界面 | 数据安全 → 会话属性：三个页签（管理属性 / 分配给用户 / 分配给群组） |
| 验收 | 新建 `dept=String`，分配给用户 admin=销售，提问时后端能读到 |

#### FR-201 行级安全性（RLS）

| 项 | 设计 |
|---|---|
| 目的 | 同一模型，不同人只看自己该看的行 |
| 数据 | `policies_row.json`：`{id,name,model,condition,attributes:[attr_id],created_at}`；`condition` 形如 `sales_orders.region = @dept` |
| 生效方式 | 提问生成 SQL 后，后端把策略条件包一层：`SELECT * FROM (<sql>) t WHERE <condition 替换 @var>`；dry_run 前注入 |
| 接口 | `GET/POST/PATCH/DELETE /api/projects/{n}/rls` |
| 界面 | 数据安全 → 行级安全性：列表 + 「添加策略」抽屉（策略名、应用对象=模型、会话属性、条件、预览） |
| 校验 | 条件里出现的 `@属性` 必须已定义；模型必须存在 |
| 验收 | 配 `region = @dept`，admin(dept=销售) 查询只返回销售行；换 dept=财务 结果不同 |

#### FR-202 列级安全性（CLS）

| 项 | 设计 |
|---|---|
| 目的 | 隐藏敏感列，或要求满足条件才可见 |
| 数据 | `policies_col.json`：`{id,name,model,columns:[],attribute,operator:"=\|>\|>=\|<\|<=\|!=",required:bool,default_value,compare_value}` |
| 生效方式 | 生成 SQL 后按策略**移除列**（改 `SELECT` 列表）；required=false 且条件不满足时用默认值替换 |
| 接口 | `GET/POST/PATCH/DELETE /api/projects/{n}/cls` |
| 界面 | 数据安全 → 列级安全性：列表 + 「将策略应用于列」抽屉（模型、列多选、访问规则） |
| 验收 | 对 `employees.salary` 配规则后，viewer 查询结果不含该列 |

#### FR-203 策略预览

输入模型 + 会话属性取值，展示"最终执行 SQL 会变成什么"。调用 `POST /api/security/preview {model, attributes}` 返回改写后的 SQL。**这是验收 RLS/CLS 是否写对的关键工具**。

### 5.11 评测

> 官方叫 golden eval；需求文档里是"评测（即将推出）"。

#### FR-210 评测集

| 项 | 设计 |
|---|---|
| 数据 | `evalsets.json`：`{id,project,name,items:[{question,expected_sql?,expected_rows?,tags[]}]}`、`eval_runs.json` |
| 接口 | 评测集 CRUD；`POST /api/projects/{n}/evals/{set}/run` |
| 界面 | 项目设置 → 评测：评测集列表、条目编辑器、运行按钮 |

#### FR-211 运行与判分

| 项 | 设计 |
|---|---|
| 执行 | 逐条跑 `/api/ask`，记录：生成 SQL、是否成功、耗时 |
| 判分 | ①有 `expected_sql` → 结构化比对（忽略大小写/别名，用 sqlglot 归一）；②有 `expected_rows` → 结果集等价；③都没有 → 只记成功率 |
| 输出 | 每条结果 + 汇总（通过率、平均耗时、失败原因分布） |
| 存储 | `eval_runs.json`：`{id,set,started_at,finished_at,total,passed,items:[...]}` |
| 验收 | 10 条问题跑完，给出 7/10 通过，能看到哪 3 条失败及原因 |

### 5.12 图表与仪表盘

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-220 | 单条回答的图表渲染（见 FR-126） | P1 | ✗ |
| FR-221 | 把图表钉到仪表盘 | P2 | ✗ |
| FR-222 | 仪表盘分享链接（只读） | P2 | ✗ |

**FR-221 设计**：`dashboards.json`：`{id,name,charts:[{artifact_id,x,y,w,h}]}`；前端用 grid 布局；分享复用内嵌 token 机制。

### 5.13 智能体功能（技能 / 记忆）

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-230 | 技能列表与上传（zip，含 SKILL.md） | P2 | ✗ |
| FR-231 | 记忆条目管理（查看、删除、按项目过滤） | P2 | ✗ |
| FR-232 | 记忆检索测试（输入问题看召回） | P2 | ✗ |

**FR-230 设计**：`skills/` 目录，上传 zip → 校验「只有一个顶层目录 + 含 SKILL.md」→ 解压；`GET /api/skills` 列目录。
**FR-231 设计**：记忆即 `knowledge/sql/*.md`，页面用文件接口渲染；删除 = 删文件。**实际上是知识页的一个视图**，不必新表。

### 5.14 讨论串追踪

| 编号 | 需求 | 优先级 | 状态 |
|---|---|---|---|
| FR-240 | 记录每次问答的反馈（有用/没用 + 备注） | P2 | ✗ |
| FR-241 | 追踪类型筛选（回答 / 图表 / 智能体） | P2 | ✗ |
| FR-242 | 按用户/时间聚合报表 | P2 | ✗ |

**FR-240 设计**：`traces.json`：`{id,thread,message_at,type,rating,note,user,ts}`；接口 `POST /api/traces`。

---

## 6. 非功能需求

| 编号 | 类别 | 要求 | 现状 |
|---|---|---|---|
| NFR-01 | 性能 | 单次提问 ≤ 30s（依赖外部模型） | 实测 14s |
| NFR-02 | 性能 | 列表接口 ≤ 500ms | ✅ |
| NFR-03 | 容量 | 日志 500 条、人工制品 200 行/件 | ✅ |
| NFR-04 | 安全 | 密码 PBKDF2、token HMAC、密码/Key 加密、API Key 只存摘要 | ✅ |
| NFR-05 | 安全 | 文件接口白名单后缀 + 防路径穿越 | ✅ |
| NFR-06 | 安全 | MCP 网关不暴露公网 | 部署约束（FR-187 待做） |
| NFR-07 | 可用性 | 后端重启必须带 `config/.env`（MASTER_KEY） | 已固化 |
| NFR-08 | 部署 | Docker 一键起（两镜像）+ 双击安装脚本 | ✅ 已验证 |
| NFR-09 | 兼容 | Chrome/Edge 最近两版 | ✅ |
| NFR-10 | 可维护 | 七工程独立构建、网关只转发 | ✅ |

---

## 7. 数据模型（含未实现部分）

| 文件 | 状态 | 结构要点 |
|---|---|---|
| `config/users.json` | ✅ | `{id,name,role,password_hash,created_at}` |
| `config/config.json` | ✅ | 运行参数 + `ai{}` |
| `config/datasources.json` | ✅ | 连接信息（密码加密） |
| `config/projects.json` | ✅ | 业务注册表（**待加 `org` 字段**） |
| `config/apikeys.json` | ✅ | `prefix/hash/last_used`（**待加 `quota`**） |
| `config/logs.json` | ✅ | 调用日志（500 条） |
| `config/orgs.json` | ✅ | 组织 + `members[]` |
| `config/threads.json` | ✅ | `messages[]` + `share_token` |
| `config/artifacts.json` | ✅ | 结果快照 |
| `config/attributes.json` | ✗ | 会话属性定义 |
| `config/attribute_values.json` | ✗ | 属性值分配（用户/组） |
| `projects/<n>/rls.json` | ✗ | 行级策略 |
| `projects/<n>/cls.json` | ✗ | 列级策略 |
| `projects/<n>/evalsets.json` / `eval_runs.json` | ✗ | 评测集与运行 |
| `projects/<n>/traces.json` | ✗ | 反馈追踪 |
| `projects/<n>/dashboards.json` | ✗ | 仪表盘布局 |
| `projects/<n>/settings.json` | ✗ | 显示名/语言/时区/描述 |
| `models/<m>/metadata.yml` | ✅ | 列、描述、主键 |
| `relationships.yml` | ✅ | 关系 |
| `cubes/<c>/metadata.yml` | ✅ | 指标 |
| `views/<v>/{metadata.yml,sql.yml}` | ✅ | 视图 |
| `knowledge/{rules,sql}/*.md` | ✅ | 知识 / 记忆 |

---

## 8. 接口清单

**已实现**（详见 `DataAsk-实现对照.md` 第 5 节）：认证、业务、建模、文件、问答、讨论串、人工制品、密钥、日志、组织、用户、AI、视图、MCP。

**待实现（按本文档设计）**

```
GET/PUT  /api/projects/{n}/settings                 FR-115
POST     /api/projects/{n}/preview                  FR-149
POST     /api/projects/{n}/suggest                  FR-150
POST     /api/projects/{n}/upload                   FR-167
GET/POST/PATCH/DELETE /api/attributes               FR-200
POST     /api/attributes/{id}/assign                FR-200
GET/POST/PATCH/DELETE /api/projects/{n}/rls         FR-201
GET/POST/PATCH/DELETE /api/projects/{n}/cls         FR-202
POST     /api/security/preview                      FR-203
GET/POST/PATCH/DELETE /api/projects/{n}/evals       FR-210
POST     /api/projects/{n}/evals/{set}/run          FR-211
GET      /api/projects/{n}/eval-runs/{id}           FR-211
GET/POST/DELETE /api/projects/{n}/dashboards        FR-221
GET/POST /api/skills                                FR-230
POST     /api/traces                                FR-240
```

---

## 9. 验收用例（完整版）

| 编号 | 场景 | 期望 |
|---|---|---|
| AC-01 | admin 登录 → 切七个页面 | 不重复登录 |
| AC-02 | 首页提问「各车型的销量」 | 返回 SQL + 8 行 |
| AC-03 | 同串追问 | 第二轮追加 |
| AC-04 | 回答保存人工制品 → 打开库 | 卡片存在、可查看 |
| AC-05 | 知识页建/删文件夹、建/改文件 | 树上同步 |
| AC-06 | 建模加入表 → 编译 | 模型数 +1 |
| AC-07 | 指标选 brand 查询 | 按品牌聚合 |
| AC-08 | 视图新建 → 编译 | views 数 +1 |
| AC-09 | 数据源新建（错密码）测试 | 返回失败原因 |
| AC-10 | AI 设置测试连接 | 列出模型 |
| AC-11 | 新建 API Key → 调 `/api/projects` | 200 |
| AC-12 | 内嵌分享 → 无痕打开 | 免登录可读 |
| AC-13 | viewer + 关闭可见 SQL | 回答无 SQL |
| AC-14 | 系统设置改池大小 → 保存 | `/api/config` 变化 |
| AC-15 | Docker 安装脚本跑完 | 8080 可打开、登录成功 |
| AC-16* | 配 RLS 后换属性值查询 | 行集不同（未实现） |
| AC-17* | 跑评测集 10 条 | 输出通过率与失败原因（未实现） |
| AC-18* | 回答切图表 | 柱状图渲染（未实现） |

---

## 10. 迭代计划

| 期 | 内容 | 预估 |
|---|---|---|
| 第 1 期 | FR-149 数据预览、FR-115 项目常规、FR-126 图表 | 3–4 天 |
| 第 2 期 | FR-200/201/202/203 数据安全三件套（后端 + 前端） | 5–7 天 |
| 第 3 期 | FR-210/211 评测 | 3–5 天 |
| 第 4 期 | FR-187 网关鉴权、FR-196 组织鉴权、FR-168 上传 | 3 天 |
| 第 5 期 | FR-221 仪表盘、FR-240 追踪、FR-150 AI 助理 | 5 天 |

---

## 11. 明确不做

计费/点数/试用、Git Sync、Vercel 部署、Agent SDK、CLI、22+ 数据源、多租户 SaaS、VPC/air-gapped 部署。

---

*本文件是开发依据：已实现项标注为验收基准，未实现项给出了目的、数据、接口与验收，可直接排期开发。*
