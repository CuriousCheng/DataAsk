# DataAsk Docker 部署

两个镜像，一条命令：

| 镜像 | 内容 | 端口 |
|---|---|---|
| `dataask-app` | Trino 476 + Wren 0.17.1 + FastAPI 后端 + MCP 网关 | 8000 / 8888 / 9300 / 9301 |
| `dataask-web` | 七个 Vue 工程构建产物 + nginx（含 `/api` 反代） | 80 → 映射 8080 |

## 用法

```bash
cd docker
cp .env.example .env          # 改 ADMIN_PASSWORD
docker compose up -d --build
```

打开 <http://localhost:8080/home/>，默认账号 `admin / admin123`（`.env` 里可改）。

首次启动会自动：
1. 生成 `/data/config/.env`（含 `MASTER_KEY`，**不要删**，删了数据源密码解不开）
2. 启动 Trino、后端、两个 MCP 网关
3. 后端 bootstrap 出管理员账号

## 数据持久化

| 卷 | 内容 |
|---|---|
| `dataask-data` | `/data/config`（账号、数据源、业务注册表、讨论串、日志、密钥）+ `/data/work`（业务目录：模型、关系、指标、知识） |

备份：

```bash
docker run --rm -v dataask-data:/data -v "$PWD":/backup alpine \
  tar -czf /backup/dataask-backup.tgz -C /data .
```

## 接自己的数据库

登录 → 顶栏「数据安全」→ **数据源** → 新建数据源：

| 字段 | 说明 |
|---|---|
| 类型 | MySQL / MariaDB、PostgreSQL、SQL Server |
| 主机 | **容器要能访问到的地址**（不是浏览器能访问）。同一台机器跑库，用 `host.docker.internal`（Mac/Win）或宿主机内网 IP |
| 端口 | 3306 / 5432 / 1433 |
| 库名 | PostgreSQL / SQL Server 必填；MySQL 可留空（覆盖整台服务器所有库） |
| 账号 / 密码 | 该库的只读账号即可 |

保存后会写 Trino catalog 并**重启 Trino**，约 30–90 秒后建模里就能看到表。

> 容器内 `127.0.0.1` 指容器自己，所以连宿主机数据库要写宿主机 IP 或 `host.docker.internal`。

## MCP 接入

| 客户端 | 地址 |
|---|---|
| Cline / VSCode | `http://<主机>:9301/sse` |
| Cursor / Claude Desktop | `http://<主机>:9300/mcp` |

网关**不做客户端鉴权**，只放可信网络。它调用后端用 `WC_API_KEY`（`.env`），留空则用管理员账号密码。

## 端口对照

| 端口 | 用途 | 是否必须暴露 |
|---|---|---|
| 8080 | 网页入口（nginx） | 是 |
| 8000 | 后端 API | 调试用，可关 |
| 8888 | Trino UI | 可选 |
| 9300 / 9301 | MCP | 用 MCP 才需要 |

## 目录结构

```
docker/
├── Dockerfile.app     Trino + JDK25 + wren + 后端
├── Dockerfile.web     node 构建七工程 → nginx
├── entrypoint.sh      容器启动顺序：Trino → 后端 → MCP 网关
├── nginx.conf         七个前缀静态托管 + /api 反代
├── trino-etc/         Trino 三件套配置（node/jvm/config）
├── docker-compose.yml
└── .env.example
```

构建上下文是仓库根目录（`.dockerignore` 已排除 `node_modules`、`dist`、`wren-like` 等）。

## 排障

| 现象 | 排查 |
|---|---|
| 打开 8080 空白 | `docker compose logs web`；确认 `web` 依赖的 `app` 已启动 |
| 登录返回 500 | `docker compose logs app \| tail -50`，多为 `MASTER_KEY` 缺失 |
| 数据源测试失败 | 从容器测连通：`docker compose exec app bash -c "</dev/tcp/主机/端口"` |
| 建模看不到表 | Trino 还在重启，等 30–90 秒；`docker compose logs app \| grep Trino` |
| 端口冲突 | 改 `docker-compose.yml` 左侧端口 |

## 关于 JDK（重要）

Trino 476 需要 Java 24+，但 Debian/Ubuntu 的 JDK 包里 `conf` 是指向 `/etc/java-*-openjdk` 的软链接，
直接 `cp -a` 会拷成死链，容器里 Trino 会报：

```
NoSuchFileException: /opt/java/conf/security/java.security
```

正确做法（在构建机上执行，把 JDK 放进构建上下文）：

```bash
mkdir -p docker/jdk
cp -rL /usr/lib/jvm/java-25-openjdk-amd64/. docker/jdk/     # -L 解引用软链接
```

然后 `docker build -f docker/Dockerfile.app ...` 即可。

> `docker/jdk/` 体积约 330MB，不要提交到 git（已在 `.gitignore` 建议里排除）。
> 如果构建机没有 JDK 25，可装 Temurin 25 或用 `apt install openjdk-25-jdk`（Ubuntu 24.04+）。