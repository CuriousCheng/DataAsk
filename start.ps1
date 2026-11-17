# 启动（已安装过）
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root 'docker')
docker compose up -d
Write-Host "→ http://localhost:8080/home/"