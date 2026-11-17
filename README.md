# DataAsk

中文的、可自托管的**语义层数据分析台**：用自然语言提问 → AI 按语义模型生成 SQL → Trino 联邦查询 → 返回表格。

> 前端七个独立 Vue 3 工程，经单端口网关聚合；后端基于 [wren-console](wren-console/)（FastAPI + Wren + Trino），本仓库在其上补齐了业务管理、人工制品、讨论串持久化与分享、视图、组织、API Key、调用日志、AI 配置等能力。

## 特性

- **语义层建模**：模型 / 列描述 / 关系 / 指标（Cube）/ 视图，全部落盘为 YAML，可 diff、可手改
- **受治理的问答**：MDL 注入 → LLM 生成 SQL → `dry_run` 校验 → Trino 执行，失败分阶段报错
- **多库联邦**：MySQL / PostgreSQL / SQL Server，可跨主机；每个数据源注册为 Trino catalog
- **知识与记忆**：`knowledge/rules/*.md` 业务规则、`knowledge/sql/*.md` 问答记忆，文件树可视化增删改
- **讨论串**：多轮对话持久化、结果存为人工制品、生成公开只读链接并 iframe 内嵌
- **接入**：MCP 网关（`list_projects` / `get_project_schema` / `ask`）+ API Key + 调用日志
- **管理**：业务启停、组织成员、用户与角色、活动日志、系统参数、AI 接口配置（云端 key 或本地 Ollama）

## 架构

```
浏览器 ──▶ 网关 5200 ──▶ 七个前端工程（5280-5286）
                │
                └──▶ /api ──▶ 后端 8000 ──▶ Wren 0.17.1 ──▶ Trino 8888 ──▶ 各数据库
                                        └──▶ MCP 网关 9300(HTTP)/9301(SSE)
```

| 目录 | 说明 |
|---|---|
| `shared-ui/` | 公共组件：登录壳、导航、HTTP 客户端、toast、业务切换器 |
| `vue-frontend/` | 首页、讨论串、人工制品库、公开内嵌页 |
| `vue-modeling/` | 建模：模型、关系、指标、视图、编译 |
| `vue-knowledge/` | 知识库文件树 |
| `vue-api/` | MCP 接入、AI 设置、API Key、调用历史 |
| `vue-settings-*/` | 项目 / 组织 / 用户设置 |
| `gateway/` | 单端口网关（开发环境用） |
| `wren-console/backend/` | 后端源码（FastAPI + Wren + Trino 管理） |
| `docker/` | Dockerfile、compose、nginx |
| `docs/` | 需求文档、实现对照 |

## 快速开始（Docker）

```bash
cp .env.example docker/.env      # 改 ADMIN_PASSWORD
docker compose -f docker/docker-compose.yml up -d --build
```

打开 <http://localhost:8080/home/>，默认 `admin / admin123`。

详细步骤（含接自己的数据库、MCP 配置、排障）见 [使用说明.md](使用说明.md) 与 [docker/README.md](docker/README.md)。

## 本地开发

```bash
npm install
npm run dev -w vue-frontend     # 各工程单独起，端口见 gateway/server.mjs
node gateway/server.mjs         # 5200 聚合入口
```

后端见 [wren-console/README.md](wren-console/README.md)。

## 文档

- [需求文档 v2（含未实现模块的详细设计）](docs/DataAsk-需求文档-v2.md)
- [实现对照（已做 / 未做）](docs/DataAsk-实现对照.md)

## 已知限制

数据安全只实现「数据源」，行级/列级/会话属性尚无后端权限模型；评测、图表、仪表盘、Git Sync 未实现。详见实现对照第 6 节。

## License

MIT（上游 `wren-console` 同为 MIT）。
