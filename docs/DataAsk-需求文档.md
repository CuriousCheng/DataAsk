# DataAsk 需求文档（v1.0）

| 项 | 内容 |
|---|---|
| 产品名 | DataAsk（内部代号，对外不出现 WrenAI 品牌） |
| 版本 | v1.0 |
| 编写日期 | 2026-11-17 |
| 编写方式 | 逆向补写：依据已完成的软件 demo + 原始《需求文档 v1.0（129 截图）》+ WrenAI 官方 OSS 说明，补一份可执行的开发依据 |
| 状态说明 | 每条需求标注 `已实现 / 部分实现 / 未实现`，并给出验收标准 |

---

## 1. 引言

### 1.1 目的
把多个数据库里的表，变成「可以用中文直接问」的业务语义层。使用者不必会写 SQL，提问后由 AI 按语义模型生成 SQL，经 Trino 联邦执行，返回表格结果；同时把建模、知识、接入、组织管理放在同一个控制台里。

### 1.2 范围
本版本覆盖：单机部署的 Web 控制台、语义层建模、问答、知识管理、MCP 接入、API 密钥与调用日志、组织与账号、AI 接口配置、讨论串公开内嵌。

**不覆盖**：评测、行级/列级安全策略（RLS/CLS）、讨论串追踪埋点、图表与仪表盘、计费与点数、Git Sync、多租户隔离。

### 1.3 术语

| 术语 | 定义 |
|---|---|
| 业务 / 项目（Project） | 一个 Wren 项目目录，含模型、关系、指标、视图、知识文件 |
| 模型（Model） | 一张物理表在语义层的映射，含列、列别名/描述、主键 |
| 关系（Relationship） | 两个模型之间的 JOIN 定义：名称、两端模型、基数、条件 |
| 指标（Cube） | 预定义的度量/维度集合，提问时可按口径直接查询 |
| 视图（View） | 一条命名 SQL（`SELECT`/`WITH`），落盘为 `views/<名>/{metadata.yml,sql.yml}` |
| 知识（Knowledge） | `knowledge/rules/*.md` 业务规则、`knowledge/sql/*.md` 问答记忆 |
| 讨论串（Thread） | 一次提问 + 回答的持久化记录，可多轮追加 |
| 人工制品（Artifact） | 从讨论串某次回答沉淀下来的结果，跨会话集中查看 |
| 数据源（Datasource） | 一个数据库连接，注册为 Trino 的 catalog |
| 会话属性（Session Attribute） | 供安全策略引用的变量（如当前用户部门） |

### 1.4 参考
- `wrenai-ref/README.md`（WrenAI 开源说明）
- `wren-like/docs/需求文档.docx`（原始 UI 需求，129 截图）
- `wren-console/README.md`（后端能力与部署）

---

## 2. 产品概述

### 2.1 四层结构

```
数据源（MySQL / PostgreSQL / SQL Server，可分布在多台主机）
   ↓  注册为 Trino catalog
模型层（表 → 模型 → 关系 → 指标 → 视图）
   ↓  Wren MDL 语义层
语义与知识（列别名/描述、业务规则、问答记忆）
   ↓
问答（首页提问 → 讨论串 → SQL + 表格；或按指标口径查询）
```

### 2.2 核心对象
系统以**讨论串（Thread）**与**人工制品（Artifact）**为核心：每次提问产生一条讨论串，串内可多轮追问；串里成功的回答可沉淀为人工制品，跨会话在「人工制品库」集中查看。

### 2.3 角色

| 角色 | 权限 |
|---|---|
| admin | 数据源、账号、组织、AI 配置、全部业务操作 |
| editor | 建模、知识、提问、生成密钥以外的业务操作 |
| viewer | 只读提问；是否可见 SQL 由系统设置决定 |

组织内另有组织角色：`owner / admin / member`，与账号角色相互独立。

---

## 3. 总体架构

### 3.1 部署形态（单机）

| 组件 | 端口 | 说明 |
|---|---|---|
| 网关 | 5200 | 七个前端工程的统一入口，按路径前缀转发（含 WebSocket） |
| 首页 / 建模 / 知识 / API / 三个设置 | 5280–5286 | 七个独立 Vue 工程，代码不合并 |
| 后端 | 8000 | FastAPI，业务与配置 API |
| Trino | 8888 | 联邦查询；每个数据源一个 catalog |
| MCP 网关 | 9300 / 9301 | Streamable HTTP / SSE，供 Claude、Cursor、Cline |
| Wren | 0.17.1 | 语义层（MDL）与查询执行 |

### 3.2 网关路由

```
/home/*                  → 5280
/modeling/*              → 5284
/knowledge/*             → 5285
/api-management/*        → 5286
/settings/project/*      → 5281
/settings/organization/* → 5282
/settings/*              → 5283
```

未匹配路径返回 404 并提示可用前缀。

### 3.3 多主机数据源（关键能力）

- 数据源记录 `host / port / database / user / password / type`。
- 保存时写入 Trino catalog：`connection-url=jdbc:<scheme>://<host>:<port>[/<database>]`，随后**重启 Trino** 使其生效（最多等待 150 秒）。
- MySQL：一个数据源覆盖该主机上所有库（每个库是一个 schema）。
- PostgreSQL / SQL Server：一个数据源只能一个库，多库需建多个数据源。
- **可达性要求**：由 Trino 所在主机访问目标 `host:port`，不是浏览器访问。

---

## 4. 功能需求

> 优先级：P0 必须；P1 应有；P2 可延后。状态：✅ 已实现 / ◐ 部分 / ✗ 未实现

### 4.1 认证与会话

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-001 | 用户名 + 密码登录，成功后签发 token（HMAC，7 天） | P0 | ✅ | 正确凭据返回 token 与用户信息；错误返回 401 |
| FR-002 | 登录态跨七个工程共享，不重复登录 | P0 | ✅ | 在任一页面登录后，切换其它页面无需再次登录 |
| FR-003 | 未登录访问任意业务页统一显示登录页 | P0 | ✅ | 清空 token 后刷新任意页出现登录表单 |
| FR-004 | 退出登录清除本地凭证 | P1 | ✅ | 退出后回到登录页 |
| FR-005 | 支持 `X-API-Key` 头调用 API（供 MCP/脚本） | P1 | ✅ | 带合法 key 返回 200；无效返回 401 |

### 4.2 首页与业务切换

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-010 | 首页左栏显示当前业务、人工制品入口、讨论串列表 | P0 | ✅ | 显示真实业务名与真实讨论串 |
| FR-011 | 顶栏可切换业务（下拉列出全部业务及模型数） | P0 | ✅ | 切换后刷新，建模/知识/首页数据同步变化 |
| FR-012 | 顶栏可新建业务（名称 + 数据源） | P1 | ✅ | 创建后出现在列表并可切换 |
| FR-013 | 首页空态提供示例问题 | P2 | ✅ | 三张示例卡，标注「示例问题」 |
| FR-014 | 首页提供「按指标口径查询」入口 | P1 | ✅ | 可选指标/度量/维度，返回 SQL 与结果 |
| FR-015 | 顶部提供 Console（原版控制台 8000）与 Trino（8888）新标签入口 | P2 | ✅ | 新标签打开，不影响当前页 |

### 4.3 讨论串（Thread）

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-020 | 提问创建讨论串并持久化（标题取问题前 40 字） | P0 | ✅ | 刷新后讨论串仍在，左栏可见 |
| FR-021 | 串内可继续追问，消息按顺序追加 | P0 | ✅ | 同一串内多轮问答按时间顺序渲染 |
| FR-022 | 每条回答展示 SQL（可折叠）与结果表格（最多 200 行） | P0 | ✅ | 表格列与行数与后端返回一致 |
| FR-023 | 失败回答展示阶段与错误信息 | P0 | ✅ | 提示包含 llm / dry_run / run_sql 阶段 |
| FR-024 | 讨论串可重命名、删除 | P1 | ✅ | 操作后列表即时更新 |
| FR-025 | 回答可「保存为人工制品」 | P1 | ✅ | 保存后出现在人工制品库 |
| FR-026 | 回答以图表呈现 | P2 | ✗ | 未实现（后端无图表产物） |
| FR-027 | 助手澄清卡片（Ask User Question） | P2 | ✗ | 未实现 |
| FR-028 | viewer 角色在系统设置关闭时不可见 SQL | P1 | ✅ | viewer 登录后回答里无 SQL 块 |

### 4.4 人工制品库（Artifact）

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-030 | 列出人工制品（卡片：标题、问题、行数、时间） | P1 | ✅ | 与后端 `/api/artifacts` 一致 |
| FR-031 | 支持关键词搜索 | P1 | ✅ | 输入关键词后列表过滤 |
| FR-032 | 支持日期区间筛选 | P2 | ✅ | 选择区间后只显示区间内条目 |
| FR-033 | 详情展示问题、SQL、结果表格（最多 100 行） | P1 | ✅ | 打开弹窗内容完整 |
| FR-034 | 可删除人工制品 | P1 | ✅ | 删除后列表移除 |
| FR-035 | 空态文案「尚未有任何人工制品——请在讨论串中创建…」 | P2 | ✅ | 无数据时显示该文案 |

### 4.5 建模（Modeling）

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-040 | 左树列出模型，画布显示模型节点与关系连线 | P0 | ✅ | 节点数 = 业务模型数 |
| FR-041 | 加入表：选择数据源 → schema → 表 → 生成模型 | P0 | ✅ | 加入后模型出现在画布，生成 `models/<名>/metadata.yml` |
| FR-042 | 编辑列别名/描述并保存 | P0 | ✅ | 保存后重新加载仍存在 |
| FR-043 | 编辑模型描述/别名 | P1 | ✅ | 同上 |
| FR-044 | 删除模型（同时清理相关关系） | P1 | ✅ | 删除后模型与连线消失 |
| FR-045 | 关系编辑：查看、改基数、删除、保存 | P0 | ✅ | 保存后 `relationships.yml` 变化 |
| FR-046 | 指标（Cube）编辑器：列表、新建、度量/维度/时间维度、删除 | P1 | ✅ | 保存后 `/cubes` 可见；编译通过 |
| FR-047 | 视图（View）编辑器：列表、新建、编辑 SQL、删除 | P1 | ✅ | 保存后 `views/<名>/{metadata.yml,sql.yml}` 生成；编译显示 views 数量增加 |
| FR-048 | 编译：调用后端编译，返回模型/视图数量 | P0 | ✅ | 成功提示包含 `Built: N models, M views` |
| FR-049 | 单表数据预览（100 行） | P2 | ✗ | 后端无单表查询接口 |
| FR-050 | 建模 AI 助理（生成语义/关联建议） | P2 | ✗ | 未实现 |

### 4.6 知识（Knowledge）

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-060 | 左侧文件树展示业务目录下的 yaml/md 文件，文件夹可折叠 | P0 | ✅ | 与 `GET /files` 一致，隐藏 `.wren`/`target` |
| FR-061 | 新建文件（4 种模板：业务规则/指标/术语/记忆-SQL 配对） | P1 | ✅ | 创建后出现在树中，内容为模板 |
| FR-062 | 新建文件夹 | P1 | ✅ | 创建后树中出现空文件夹 |
| FR-063 | 删除文件 / 删除文件夹（含子文件） | P1 | ✅ | 删除后树中消失 |
| FR-064 | 重命名文件（读→写新路径→删旧） | P2 | ✅ | 重命名后内容保留 |
| FR-065 | 编辑并保存文件（yaml/md） | P0 | ✅ | 保存后重新打开内容一致 |
| FR-066 | 建记忆索引 | P1 | ✅ | 调用 `/index` 返回 200 并提示结果 |
| FR-067 | Markdown 预览、行号、发布状态、文件上传 | P2 | ✗ | 未实现 |

### 4.7 问答（Ask）

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-070 | 自然语言 → SQL：注入 MDL、召回相似问答、调用 LLM | P0 | ✅ | 返回可执行 SQL |
| FR-071 | SQL 先 dry_run 校验再执行 | P0 | ✅ | 语法/表名错误在 dry_run 阶段被拦截 |
| FR-072 | 返回结构化结果（columns/rows/row_count） | P0 | ✅ | 前端直接渲染 |
| FR-073 | 记录调用日志（用户、业务、问题、结果、耗时、SQL） | P1 | ✅ | `/api/logs` 可查 |
| FR-074 | 按指标口径查询（cube） | P1 | ✅ | 选度量+维度返回聚合结果 |
| FR-075 | 提问失败时给出可读原因 | P0 | ✅ | 区分 LLM/校验/执行三类 |

### 4.8 API 接入

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-080 | MCP 网关提供 `list_projects`、`get_project_schema`、`ask` | P0 | ✅ | MCP 客户端 `tools/call` 返回真实业务列表 |
| FR-081 | 页面展示 MCP 地址（SSE 9301 / HTTP 9300）与客户端配置 JSON | P1 | ✅ | 可一键复制 |
| FR-082 | API 密钥管理：列表、新建（明文仅显示一次）、删除 | P1 | ✅ | 新建后可用 `X-API-Key` 调用 |
| FR-083 | 调用历史：时间、用户、业务、问题、结果、耗时，可筛失败、可清空 | P1 | ✅ | 与 `/api/logs` 一致 |
| FR-084 | MCP 网关客户端鉴权 | P2 | ✗ | 当前网关不校验客户端，仅限可信内网 |

### 4.9 AI 配置

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-090 | 支持 OpenAI 兼容与 Anthropic 两种协议 | P0 | ✅ | 两种协议均可保存并问答成功 |
| FR-091 | 可配置 Base URL、模型、API Key；Key 加密存储，接口只返回是否已存 | P0 | ✅ | 再次打开页面 Key 显示「已保存，留空表示不修改」 |
| FR-092 | 测试连接：调用 `/models` 返回可用模型列表，可点选填入 | P1 | ✅ | 测试成功列出模型 chips |
| FR-093 | 首页对话框显示当前真实模型与「本地/云端」标识 | P1 | ✅ | 显示形如 `deepseek-v4.1-flash · 云端 · anthropic` |
| FR-094 | 首页可直接切换模型并写回后端 | P2 | ✅ | 选择后 `/api/ai` 的 model 变化 |
| FR-095 | 支持本地模型（Ollama：`http://localhost:11434/v1`，key 留空） | P1 | ✅ | 配置后测试可列出本地模型 |

### 4.10 数据连接（Datasource）

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-100 | 列出数据源（名称、类型、主机端口、库、账号、catalog、上次测试） | P0 | ✅ | 与 `/api/datasources` 一致 |
| FR-101 | 新建数据源（名称/类型/主机/端口/库/账号/密码）并测试连接 | P0 | ✅ | 测试返回版本号；保存后注册 catalog |
| FR-102 | 删除数据源（同时移除 catalog） | P1 | ✅ | 删除后列表与 catalog 均消失 |
| FR-103 | 支持跨主机数据库（host 写入 catalog URL） | P0 | ✅ | 填非本机 IP 时 catalog 指向该 IP；Trino 需可达 |
| FR-104 | 数据源按组织隔离 | P2 | ✗ | 当前全局共享，无组织维度 |

### 4.11 设置-项目

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-110 | 业务管理：列表（数据源/模型数/创建时间）、启动/停止/切换/删除 | P0 | ✅ | 操作后列表刷新 |
| FR-111 | 内嵌讨论串：选讨论串 → 生成公开链接 → iframe 代码 → 预览 | P1 | ✅ | 公开页免登录可读，取消分享后失效 |
| FR-112 | 项目常规（名称、AI 回应语言、时区、描述）持久化 | P1 | ✗ | 当前为静态表单 |
| FR-113 | 项目危险区域（删除项目） | P2 | ◐ | 删除能力在「业务管理」中提供 |

### 4.12 设置-组织

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-120 | 组织常规：名称可改、标识可复制、成员数 | P1 | ✅ | 改名后刷新仍在 |
| FR-121 | 成员管理：加成员（选用户 + 组织角色）、改角色、移除 | P1 | ✅ | 组织成员列表更新 |
| FR-122 | 用户管理：新建用户、改账号角色、重置密码、删除 | P0 | ✅ | 新用户可登录 |
| FR-123 | 活动日志：网页活动 / API 活动两个页签 | P1 | ✅ | 与 `/api/logs` 一致，按 via 区分 |
| FR-124 | 组织 API 密钥（只读视图 + 跳转管理页） | P2 | ✅ | 列表与 `/api/keys` 一致 |
| FR-125 | 组织 MCP：展示真实网关地址与配置 | P2 | ✅ | 地址可复制 |
| FR-126 | 系统设置：项目池大小、提问并发、空闲回收、viewer 是否可见 SQL | P1 | ✅ | 保存后 `/api/config` 生效 |
| FR-127 | 危险区域：删除组织（二次确认） | P2 | ✅ | 删除后组织列表为空 |
| FR-128 | 退出组织 | P2 | ✗ | 后端无接口 |

### 4.13 设置-用户与智能体功能

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-130 | 个人资料显示真实用户名与角色 | P1 | ✅ | 与 `/api/me` 一致 |
| FR-131 | 修改密码（原密码 + 新密码 + 确认） | P1 | ✅ | 改后可用新密码登录 |
| FR-132 | 技能管理（上传 zip，含 SKILL.md） | P2 | ✗ | 后端无接口 |
| FR-133 | 记忆管理 | P2 | ✗ | 后端无接口 |

### 4.14 数据安全

顶栏「数据安全」→ `/settings/project/data-security`，一页四页签：

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-140 | 数据源页签：列出/新建/测试/删除数据源（即 4.10 的数据连接） | P0 | ✅ | 与 `/api/datasources` 一致；顶栏一次点击可达 |
| FR-141 | 行级安全性页签（策略：名称、应用对象、会话属性、条件 `@prop`、预览） | P2 | ✗ | 页面留位，明示后端无权限模型 |
| FR-142 | 列级安全性页签（模型/列、会话属性、6 种运算符、必填/可选、默认值） | P2 | ✗ | 页面留位 |
| FR-143 | 会话属性页签（管理属性 / 分配给用户 / 分配给群组） | P2 | ✗ | 页面留位 |

> 说明：数据源与访问控制合并在「数据安全」下，是因为顶栏 5 个入口固定，原「数据安全」页原先为空。
> 项目设置里仍保留「数据连接」入口，指向同一组件（FR-100~104）。
> 行级/列级/会话属性需要后端权限模型与 SQL 条件注入，本期不实现，页面不做假数据。

### 4.15 公开内嵌页

| 编号 | 需求 | 优先级 | 状态 | 验收标准 |
|---|---|---|---|---|
| FR-150 | 通过 token 免登录查看讨论串（只读、不含提问框） | P1 | ✅ | 无 cookie 打开链接可见问答与表格 |
| FR-151 | 取消分享后链接立即失效 | P1 | ✅ | 取消后返回「链接无效」 |
| FR-152 | 页面自适应 iframe（宽度撑满、表格可滚动） | P2 | ✅ | 720×640 iframe 内正常显示 |

---

## 5. 非功能需求

| 编号 | 类别 | 要求 | 状态 |
|---|---|---|---|
| NFR-01 | 性能 | 单次提问端到端 ≤ 30s（依赖外部模型） | 实测 14s 左右 |
| NFR-02 | 性能 | 列表类接口 ≤ 500ms（本地） | ✅ |
| NFR-03 | 容量 | 调用日志保留最近 500 条；人工制品每件最多 200 行 | ✅ |
| NFR-04 | 安全 | 密码 PBKDF2；token HMAC；数据源密码与 AI Key 加密存储 | ✅ |
| NFR-05 | 安全 | API Key 仅存 sha256 摘要，明文只显示一次 | ✅ |
| NFR-06 | 安全 | 文件接口限制后缀（yml/yaml/md/txt/json）且防路径穿越 | ✅ |
| NFR-07 | 安全 | MCP 网关不对外暴露公网（无客户端鉴权） | 需部署约束 |
| NFR-08 | 可用性 | 后端重启必须加载 `config/.env`（MASTER_KEY），否则数据源接口 500 | 已固化到重启脚本 |
| NFR-09 | 兼容 | Chrome / Edge 最近两个大版本 | ✅ |
| NFR-10 | 可维护 | 七个前端工程独立构建、独立部署，网关仅做转发 | ✅ |

---

## 6. 数据模型（文件存储）

所有状态为 JSON/YAML 文件，无数据库。

| 文件 | 结构要点 |
|---|---|
| `config/users.json` | `{items:[{id,name,role,password_hash,created_at}]}` |
| `config/config.json` | `{pool_size, ask_concurrency, viewer_can_see_sql, idle_stop_minutes, ai:{protocol,base_url,model,api_key_enc}}` |
| `config/datasources.json` | `{items:[{id,name,type,host,port,database,user,password_enc,catalog,last_test}]}` |
| `config/projects.json` | `{items:{<名>:{datasource,catalog,created_at,created_by}}}` |
| `config/apikeys.json` | `{items:[{id,name,role,prefix,hash,created_at,last_used}]}` |
| `config/logs.json` | `{items:[{id,ts,user,via,project,question,ok,stage,ms,sql,thread}]}` |
| `config/orgs.json` | `{items:[{id,name,code,created_at,created_by,members:[{user,role}]}]}` |
| `config/threads.json` | `{items:[{id,project,title,created_at,updated_at,created_by,share_token?,messages:[{role,content/sql/data/ok/error/at}]}]}` |
| `config/artifacts.json` | `{items:[{id,thread_id,project,title,question,sql,columns,rows,row_count,created_at,created_by}]}` |
| `work/<业务>/models/<名>/metadata.yml` | `name / properties / table_reference / columns[] / primary_key` |
| `work/<业务>/relationships.yml` | `relationships:[{name,models[],join_type,condition}]` |
| `work/<业务>/cubes/<名>/metadata.yml` | `name / base_object / measures[] / dimensions[] / time_dimensions[]` |
| `work/<业务>/views/<名>/{metadata.yml,sql.yml}` | `metadata.yml: name/properties`；`sql.yml: statement` |
| `work/<业务>/knowledge/rules/*.md` | Markdown，可带 frontmatter `type/name/apply_when` |
| `work/<业务>/knowledge/sql/*.md` | 问答记忆，frontmatter `type: sql_pair / question` |

---

## 7. 接口清单（后端）

见 `docs/DataAsk-实现对照.md` 第 5 节，按模块列出全部路由与新增标记。

---

## 8. 页面清单与路由

| 路由 | 页面 | 数据 |
|---|---|---|
| `/home/` | 首页 | 真实 |
| `/home/<threadId>` | 讨论串 | 真实 |
| `/home/artifacts` | 人工制品库 | 真实 |
| `/home/embed/<token>` | 公开只读页 | 真实（免登录） |
| `/modeling/` | 建模 | 真实 |
| `/knowledge/file-explorer` | 知识 | 真实 |
| `/api-management/mcp` | MCP 接入 | 真实地址 |
| `/api-management/ai` | AI 设置 | 真实 |
| `/api-management/keys` | API 密钥 | 真实 |
| `/api-management/history` | 调用历史 | 真实 |
| `/settings/project/businesses` | 业务管理 | 真实 |
| `/settings/project/data-connection` | 数据连接（同一组件） | 真实 |
| `/settings/project/data-security` | 数据安全（数据源/行级/列级/会话属性） | 数据源真实，其余留位 |
| `/settings/project/embed-threads` | 内嵌讨论串 | 真实 |
| `/settings/project/general` | 项目常规 | 静态 |
| `/settings/project/danger-zone` | 项目危险区域 | 静态 |
| `/settings/organization/general` | 组织常规 | 真实 |
| `/settings/organization/members` | 成员 | 真实 |
| `/settings/organization/users` | 用户 | 真实 |
| `/settings/organization/activity-log` | 活动日志 | 真实 |
| `/settings/organization/api-keys` | 组织密钥 | 真实（只读） |
| `/settings/organization/mcp` | 组织 MCP | 真实地址 |
| `/settings/organization/system` | 系统设置 | 真实 |
| `/settings/organization/danger-zone` | 组织危险区域 | 真实 |
| `/settings/user/profile` | 个人资料 / 改密码 | 真实 |
| `/settings/agent/skills` | 技能 | 静态 |
| `/settings/agent/memories` | 记忆 | 静态 |
| `/settings/user/danger-zone` | 用户危险区域 | 静态 |

---

## 9. 验收用例（冒烟）

| 编号 | 步骤 | 期望 |
|---|---|---|
| AC-01 | admin/admin123 登录 → 打开任意页面 | 不需要二次登录 |
| AC-02 | 首页选「汽车销售分析」→ 问「各车型的销量是多少？」 | 返回 SQL + 8 行表格 |
| AC-03 | 同串追问「销量最高的车型是哪个？」 | 串内出现第二轮问答 |
| AC-04 | 回答下点「保存为人工制品」→ 打开 `/home/artifacts` | 出现该卡片，可打开查看 |
| AC-05 | 知识页新建文件夹 `knowledge/_t` → 删除 | 树上出现后消失 |
| AC-06 | 知识页新建 `knowledge/rules/x.md` → 编辑保存 → 重开 | 内容一致 |
| AC-07 | 建模页「+ 新建」加入表 → 编译 | 模型数 +1，编译成功 |
| AC-08 | 建模页打开「指标」→ 选 sales_model → 查询 brand 维度 | 返回按品牌聚合结果 |
| AC-09 | 建模页「视图」→ 新建视图 → 编译 | 编译输出的 views 数 +1 |
| AC-10 | 项目设置 → 数据连接 → 新建数据源（错误密码）→ 测试 | 返回失败原因 |
| AC-11 | API → AI 设置 → 测试连接 | 列出模型 chips |
| AC-12 | API → 密钥 → 新建 | 显示一次明文；可用于 `X-API-Key` |
| AC-13 | API → 历史记录 | 出现刚才提问的记录 |
| AC-14 | 组织设置 → 活动日志 → 切 API 活动 | 有 key 调用时出现在该页签 |
| AC-15 | 内嵌讨论串 → 生成链接 → 无痕窗口打开 | 免登录可见问答 |
| AC-16 | 系统设置改「viewer 可见 SQL」为关 → viewer 登录提问 | 回答中无 SQL |

---

## 10. 范围外（本期明确不做）

评测（评测集/运行记录/判分）、行级与列级安全、会话属性、讨论串追踪埋点、图表与仪表盘、点数与计费、Git Sync、Agent SDK、CLI、多租户隔离、技能与记忆（智能体功能）。

---

## 11. 后续迭代建议（按依赖排序）

1. **数据预览**：加 `POST /api/projects/{n}/preview`，建模抽屉接上。
2. **项目常规**：项目名/描述写入 `wren_project.yml`，语言/时区写入项目 `settings.json`。
3. **缺口补全**：首页顶栏组织名接 `/api/orgs`。
4. **数据安全**：先做会话属性（数据模型最简），再做列级，最后行级（需 SQL 重写）。
5. **评测**：定义 `evalset(json)` + 运行记录，复用 `/api/ask` 判 SQL 是否等价。
6. **图表**：回答返回 `chart` 建议（ECharts option JSON），前端加渲染器。

---

*本文档为开发依据：每一条需求都有编号、优先级、验收标准与当前状态；状态以代码与实测为准。*
