$host.UI.RawUI.WindowTitle = "XHS-Agent - XiaoHongShu AI Agent (Unattended)"

Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  XHS-Agent XiaoHongShu AI Agent" -ForegroundColor Magenta
Write-Host "  Full Autonomous Mode - Unattended" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

$venvPython = "D:\app\123\xhs-agent\.venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "[ERROR] Virtual environment not found!" -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$env:PYTHONPATH = "D:\app\123\xhs-agent\src"
$env:DEEPSEEK_API_KEY = "sk-7020090d5f5a44c8a5f49c8fe0a4d996"
$env:XHS_AGENT_DEEPSEEK_KEY = "sk-7020090d5f5a44c8a5f49c8fe0a4d996"
$env:OPENAI_API_KEY = "sk-7020090d5f5a44c8a5f49c8fe0a4d996"
$env:XHS_COOKIE_PATH = "D:\app\123\xhs-agent\config\cookie.json"
Set-Location D:\app\123\xhs-agent

Write-Host "[+] Starting XHS-Agent API server..." -ForegroundColor Green
Write-Host "[*] API: http://127.0.0.1:8100" -ForegroundColor Gray
Write-Host "[*] Docs: http://127.0.0.1:8100/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DAILY SCHEDULE (auto)" -ForegroundColor Cyan
Write-Host "  08:00  Publish pipeline (topic -> content -> cover)" -ForegroundColor Gray
Write-Host "  10:00  Auto-reply comments" -ForegroundColor Gray
Write-Host "  14:00  Auto-reply comments" -ForegroundColor Gray
Write-Host "  18:00  Auto-reply comments" -ForegroundColor Gray
Write-Host "  21:00  Auto-reply comments" -ForegroundColor Gray
Write-Host "  Mon 9  Weekly report generation" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "[*] Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

& $venvPython -m uvicorn xhs_agent.app:app --host 127.0.0.1 --port 8100

Write-Host "[-] XHS-Agent stopped" -ForegroundColor Red
Read-Host "Press Enter to close"
