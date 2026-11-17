#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/docker"
if docker compose version >/dev/null 2>&1; then docker compose down; else docker stop dataask-app dataask-web; fi