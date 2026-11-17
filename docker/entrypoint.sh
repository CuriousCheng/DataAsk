#!/usr/bin/env bash
# 容器启动：Trino → 后端 → 两个 MCP 网关
set -euo pipefail

DATA_DIR="${DATA_DIR:-/data/config}"
PROJECTS_DIR="${PROJECTS_DIR:-/data/work}"
mkdir -p "$DATA_DIR" "$PROJECTS_DIR"

# 首次启动生成 .env（MASTER_KEY 必须固定，否则数据源密码解不开）
if [ ! -f "$DATA_DIR/.env" ]; then
  echo "MASTER_KEY=$(python -c 'import secrets;print(secrets.token_urlsafe(32))')" > "$DATA_DIR/.env"
  echo "[init] 已生成 $DATA_DIR/.env"
fi
set -a; . "$DATA_DIR/.env"; set +a

# 管理员密码（默认 admin123，首次启动写进用户表由后端 bootstrap 处理）
export ADMIN_USER="${ADMIN_USER:-admin}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

echo "[1/3] 启动 Trino ..."
"$TRINO_LAUNCHER" start >/tmp/trino-start.log 2>&1 || true
for i in $(seq 1 90); do
  if (exec 3<>/dev/tcp/127.0.0.1/8888) 2>/dev/null; then echo "      Trino 就绪"; break; fi
  sleep 1
done

echo "[2/3] 启动后端 ..."
cd /app
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir /app >/tmp/backend.log 2>&1 &
BACKEND_PID=$!
for i in $(seq 1 60); do
  if (exec 3<>/dev/tcp/127.0.0.1/8000) 2>/dev/null; then echo "      后端就绪"; break; fi
  sleep 1
done

echo "[3/3] 启动 MCP 网关 9300 / 9301 ..."
if [ -n "${WC_API_KEY:-}" ]; then export WC_API_KEY; fi
GATEWAY_TRANSPORT=streamable-http GATEWAY_PORT=9300 \
  python -m app.gateway >/tmp/gateway-9300.log 2>&1 &
GATEWAY_TRANSPORT=sse GATEWAY_PORT=9301 \
  python -m app.gateway >/tmp/gateway-9301.log 2>&1 &

echo "---------------------------------------------"
echo " DataAsk 后端   http://localhost:8000"
echo " Trino UI       http://localhost:8888"
echo " MCP 网关       http://localhost:9300/mcp  /  http://localhost:9301/sse"
echo "---------------------------------------------"

wait "$BACKEND_PID"
