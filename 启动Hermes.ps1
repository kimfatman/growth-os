$host.UI.RawUI.WindowTitle = "Hermes Agent - DeepSeek"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Hermes Agent Yi Jian Qi Dong (DeepSeek)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 设置环境变量
$env:HERMES_HOME = "D:\app\123\.hermes"
$env:ANTHROPIC_API_KEY = "sk-7020090d5f5a44c8a5f49c8fe0a4d996"
$env:ANTHROPIC_BASE_URL = "https://api.deepseek.com/anthropic"
$env:HERMES_DEFAULT_MODEL = "deepseek-chat"
Set-Location D:\app\123\hermes-agent

Write-Host "[+] Starting Hermes Agent..." -ForegroundColor Green
Write-Host "[*] Type /exit to quit" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 运行 Hermes
& ".\venv\Scripts\python.exe" -m hermes_cli.main

Write-Host "[-] Hermes Agent exited" -ForegroundColor Red
Read-Host "Press Enter to close"
