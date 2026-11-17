#!/usr/bin/env bash
# 启动（已安装过）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/docker"
if docker compose version >/dev/null 2>&1; then
  docker compose up -d
else
  docker start dataask-app dataask-web >/dev/null 2>&1 || echo "还没安装，先跑 bash install.sh"
fi
echo "→ http://localhost:8080/home/"