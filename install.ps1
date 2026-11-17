# DataAsk 一键安装（Windows PowerShell）
# 用法：在 DataAsk 目录里右键 →「使用 PowerShell 运行」，或：
#   powershell -ExecutionPolicy Bypass -File .\install.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$docker = Join-Path $root 'docker'

Write-Host ''
Write-Host '=== DataAsk 安装 ===' -ForegroundColor Cyan
Write-Host "安装目录：$root"
Write-Host ''

# 1) Docker
Write-Host '[1/3] 检查 Docker ...' -ForegroundColor Yellow
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
  Write-Host '  没有找到 docker。' -ForegroundColor Red
  Write-Host '  请先安装 Docker Desktop：https://www.docker.com/products/docker-desktop/'
  Write-Host '  安装后重启终端，再运行本脚本。'
  exit 1
}
try {
  docker info --format '{{.ServerVersion}}' | Out-Null
} catch {
  Write-Host '  Docker 已安装但没启动，请打开 Docker Desktop 等它变绿。' -ForegroundColor Red
  exit 1
}
Write-Host ('  OK  ' + (docker --version)) -ForegroundColor Green

# 2) 配置
Write-Host '[2/3] 准备配置 ...' -ForegroundColor Yellow
$envFile = Join-Path $docker '.env'
if (-not (Test-Path $envFile)) {
  $password = 'admin123'
  @(
    "# 管理员账号（首次启动写入用户表）",
    "ADMIN_USER=admin",
    "ADMIN_PASSWORD=$password",
    "",
    "# MCP 网关调用后端用的 Key；留空则用上面的账号密码登录",
    "WC_API_KEY="
  ) | Set-Content -Path $envFile -Encoding utf8
  Write-Host "  已生成 docker/.env，管理员密码：$password" -ForegroundColor Green
} else {
  Write-Host '  docker/.env 已存在，沿用。' -ForegroundColor Green
}

# 3) 构建并启动
Write-Host '[3/3] 构建并启动（第一次 10-20 分钟，会下载 Trino 等依赖）...' -ForegroundColor Yellow
Push-Location $docker
try {
  docker compose up -d --build
} finally {
  Pop-Location
}

Write-Host ''
Write-Host '=== 安装完成 ===' -ForegroundColor Cyan
Write-Host '  打开浏览器： http://localhost:8080/home/'
Write-Host '  默认账号：   admin / admin123（见 docker/.env）'
Write-Host ''
Write-Host '  首次启动后端约需 1-2 分钟，页面打不开就等一会儿再刷新。'
Write-Host '  以后启动：双击 start.ps1（或 docker compose -f docker/docker-compose.yml up -d）'
Write-Host ''
