#!/usr/bin/env bash
# DataAsk 一键安装（Linux / macOS）
# 用法：bash install.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$ROOT/docker"

echo
echo "=== DataAsk 安装 ==="
echo "安装目录：$ROOT"
echo

# ── 1. Docker ──
echo "[1/3] 检查 Docker ..."
if ! command -v docker >/dev/null 2>&1; then
  echo "  ✗ 没有 docker。先装："
  echo "    Ubuntu/Debian: sudo apt install docker.io docker-compose-v2"
  echo "    macOS:         安装 Docker Desktop"
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "  ✗ Docker 没启动或当前用户没权限。"
  echo "    试试: sudo systemctl start docker  或把用户加进 docker 组"
  exit 1
fi
echo "  ✓ $(docker --version)"

HAS_COMPOSE=1
if ! docker compose version >/dev/null 2>&1; then
  HAS_COMPOSE=0
  echo "  ! 没装 compose 插件，将改用 docker run 方式启动"
fi

# ── 2. 配置 ──
echo "[2/3] 准备配置 ..."
ENV_FILE="$DOCKER_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF'
# 管理员账号（首次启动写入用户表）
ADMIN_USER=admin
ADMIN_PASSWORD=admin123

# MCP 网关调用后端用的 Key；留空则用上面的账号密码登录
WC_API_KEY=
EOF
  echo "  ✓ 已生成 docker/.env（密码 admin123，可自行修改）"
else
  echo "  ✓ docker/.env 已存在，沿用"
fi
set -a; . "$ENV_FILE"; set +a

# ── 3. 构建并启动 ──
echo "[3/3] 构建并启动（第一次 10-20 分钟，要下载 Trino 等依赖）..."
cd "$DOCKER_DIR"

if [ "$HAS_COMPOSE" = "1" ]; then
  docker compose up -d --build
else
  echo "  → 用 docker run 启动"
  docker network create dataask >/dev/null 2>&1 || true
  docker build -f Dockerfile.app -t dataask-app:latest "$ROOT"
  docker build -f Dockerfile.web -t dataask-web:latest "$ROOT"
  docker rm -f dataask-app dataask-web >/dev/null 2>&1 || true
  docker run -d --name dataask-app --network dataask --network-alias app \
    -e "ADMIN_USER=${ADMIN_USER:-admin}" -e "ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}" \
    -e "WC_API_KEY=${WC_API_KEY:-}" \
    -v dataask-data:/data dataask-app:latest >/dev/null
  docker run -d --name dataask-web --network dataask -p 8080:80 dataask-web:latest >/dev/null
fi

echo
echo "=== 安装完成 ==="
echo "  打开浏览器： http://localhost:8080/home/"
echo "  默认账号：   ${ADMIN_USER:-admin} / ${ADMIN_PASSWORD:-admin123}"
echo
echo "  首次启动后端约需 1-2 分钟，页面打不开就等一会儿再刷新。"
echo "  以后启动：bash start.sh"
echo
