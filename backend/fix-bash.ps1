# Create /dev/null for Git Bash if missing
$null = New-Item -ItemType File -Force -Path "$env:USERPROFILE\.claude\devnull" -ErrorAction SilentlyContinue
Write-Host "Attempted workaround"
