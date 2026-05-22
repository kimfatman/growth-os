$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "$PSScriptRoot\electron.exe"
$psi.Arguments = "$PSScriptRoot\app"
$psi.UseShellExecute = $true
[System.Diagnostics.Process]::Start($psi) | Out-Null