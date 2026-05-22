$token = "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"
$repo = "growth-os"
$dir = "D:\app\123"

Write-Host "========================================"
Write-Host "  Fixing Git + Pushing to GitHub"
Write-Host "========================================"
Write-Host ""

# Step 1: Find git location and fix /dev/null
Write-Host "[1/5] Finding Git..."
$gitPath = (Get-Command git).Source
Write-Host "  Git is at: $gitPath"

# Create /dev/null if missing (MSYS workaround)
$msysDir = [System.IO.Path]::GetDirectoryName($gitPath)
$devNullPath = "$msysDir\..\..\dev\null"
if (Test-Path "$msysDir\..\..\dev") {
    $devNullPath = Resolve-Path "$msysDir\..\..\dev"
    $devNullPath = "$devNullPath\null"
    if (-not (Test-Path $devNullPath)) {
        New-Item -ItemType File -Path $devNullPath -Force | Out-Null
        Write-Host "  Created: $devNullPath"
    }
}

# Also try common MSYS paths
$msysPaths = @(
    "C:\Program Files\Git\dev\null",
    "C:\Program Files (x86)\Git\dev\null",
    "$env:ProgramFiles\Git\dev\null",
    "${env:ProgramFiles(x86)}\Git\dev\null"
)
foreach ($p in $msysPaths) {
    $parent = [System.IO.Path]::GetDirectoryName($p)
    if (Test-Path $parent -PathType Container) {
        if (-not (Test-Path $p)) {
            New-Item -ItemType File -Path $p -Force | Out-Null
            Write-Host "  Created: $p"
        }
    }
}

# Step 2: Init git
Push-Location $dir

Write-Host "[2/5] Initializing git..."
git init 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Git init failed. Trying with HOME env..."
    $env:HOME = $env:USERPROFILE
    git init 2>&1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "  Still failing. Let's fix /dev/null in MSYS..."
    $msysRoots = @(
        "$env:PROGRAMFILES\Git",
        "${env:ProgramFiles(x86)}\Git"
    )
    foreach ($root in $msysRoots) {
        if (Test-Path $root) {
            $devDir = "$root\dev"
            if (-not (Test-Path $devDir)) {
                New-Item -ItemType Directory -Path $devDir -Force | Out-Null
            }
            $nullFile = "$devDir\null"
            if (-not (Test-Path $nullFile)) {
                New-Item -ItemType File -Path $nullFile -Force | Out-Null
                Write-Host "  Created: $nullFile"
            }
        }
    }
    git init 2>&1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Git still has /dev/null issue."
    Write-Host "Try reinstalling Git from: https://git-scm.com/download/win"
    Write-Host "(Use default options, make sure 'Git from the command line' is selected)"
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 3: Add and commit
Write-Host "[3/5] Adding files..."
git add .
git commit -m "Initial commit: Growth OS - AI Sales Growth System" 2>&1

# Step 4: Get GitHub username
Write-Host "[4/5] Getting GitHub info..."
try {
    $userResp = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers @{
        "Authorization" = "Bearer $token"
    }
    $username = $userResp.login
    Write-Host "  GitHub user: $username"
} catch {
    Write-Host "  Trying curl.exe..."
    $tempFile = "$env:TEMP\gh_user.json"
    curl.exe -s -H "Authorization: Bearer $token" https://api.github.com/user -o $tempFile
    $username = (Get-Content $tempFile -Raw | ConvertFrom-Json).login
    Write-Host "  GitHub user: $username"
}

# Step 5: Create repo and push
Write-Host "[5/5] Pushing to GitHub..."
try {
    $body = @{name=$repo; private=$false; description="Growth OS - AI Sales Growth System"} | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $body | Out-Null
} catch {}

git remote remove origin 2>&1
$remoteUrl = "https://oauth2:$token@github.com/$username/$repo.git"
git remote add origin $remoteUrl 2>&1
git branch -M main 2>&1
git -c http.sslVerify=false push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================"
    Write-Host "  SUCCESS!"
    Write-Host "  https://github.com/$username/$repo"
    Write-Host "========================================"
} else {
    Write-Host ""
    Write-Host "Push failed. Last attempt with different auth method..."
    git remote set-url origin "https://github.com/$username/$repo.git"
    git -c http.extraheader="AUTHORIZATION: bearer $token" -c http.sslVerify=false push -u origin main 2>&1
}

Pop-Location
Write-Host ""
Read-Host "Press Enter to exit"
