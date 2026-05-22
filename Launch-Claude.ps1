$host.UI.RawUI.WindowTitle = "Claude Code - DeepSeek"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Claude Code Yi Jian Qi Dong (DeepSeek)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start CC Switch proxy
$ccProc = Get-Process "cc-switch" -ErrorAction SilentlyContinue
if (-not $ccProc) {
    Write-Host "[*] Starting CC Switch proxy..." -ForegroundColor Yellow
    Start-Process "C:\Users\Administrator\AppData\Local\Programs\CC Switch\cc-switch.exe"
    Write-Host "[+] Waiting for proxy..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
} else {
    Write-Host "[+] CC Switch is running" -ForegroundColor Green
}

# 2. Wait for proxy port
do {
    $portCheck = netstat -an 2>$null | Select-String "127.0.0.1:15721" | Select-String "LISTENING"
    if (-not $portCheck) {
        Write-Host "[*] Waiting for proxy port 15721..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
} while (-not $portCheck)
Write-Host "[+] Proxy ready (127.0.0.1:15721)" -ForegroundColor Green

# 3. Start Claude Code
Write-Host ""
Write-Host "[+] Starting Claude Code..." -ForegroundColor Green
Write-Host "[*] Type /exit to quit" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:15721"
$env:ANTHROPIC_AUTH_TOKEN = "PROXY_MANAGED"
Set-Location D:\app\123
claude

Write-Host "[-] Claude Code exited" -ForegroundColor Red
Read-Host "Press Enter to close"