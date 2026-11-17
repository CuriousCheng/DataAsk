$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $root 'docker')
docker compose down