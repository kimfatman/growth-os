$token = "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"
$repo = "growth-os"
$dir = "D:\app\123"

Write-Host "========================================"
Write-Host "  Pushing Growth OS to GitHub"
Write-Host "========================================"
Write-Host ""

# Fix git /dev/null issue
$env:MSYS_ENV_VAR = "1"
$env:GIT_DISCOVERY_ACROSS_FILESYSTEM = "1"

Push-Location $dir

# Step 1: Init git
Write-Host "[1/5] Initializing git..."
git init 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Git init failed. Trying workaround..."
    # Try with MSYS=winsymlinks:nativestrict
    $env:MSYS = "winsymlinks:nativestrict"
    git init 2>&1
}

# Step 2: Add files (excluding node_modules etc)
Write-Host "[2/5] Adding files..."
git add . 2>&1

# Step 3: Commit
Write-Host "[3/5] Committing..."
git commit -m "Initial commit: Growth OS - AI Sales Growth System" 2>&1

# Step 4: Get GitHub username via API
Write-Host "[4/5] Getting GitHub username..."
try {
    $userResp = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers @{
        "Authorization" = "Bearer $token"
    }
    $username = $userResp.login
    Write-Host "  Username: $username"
} catch {
    Write-Host "  Error getting username: $_"

    # Try with curl.exe
    try {
        $tempFile = [System.IO.Path]::GetTempFileName()
        curl.exe -s -H "Authorization: Bearer $token" https://api.github.com/user -o $tempFile 2>&1
        $json = Get-Content $tempFile -Raw | ConvertFrom-Json
        $username = $json.login
        Remove-Item $tempFile
        Write-Host "  Username (curl): $username"
    } catch {
        Write-Host "  Could not determine username."
        $username = Read-Host "  Please enter your GitHub username"
    }
}

# Step 5: Create repo (if doesn't exist) and push
Write-Host "[5/5] Pushing to GitHub..."
try {
    $body = @{name=$repo; private=$false; description="Growth OS - AI Sales Growth System"} | ConvertTo-Json
    Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body $body 2>&1 | Out-Null
    Write-Host "  Repository created!"
} catch {
    Write-Host "  Repo may already exist, continuing..."
}

git remote remove origin 2>&1
git remote add origin "https://oauth2:$token@github.com/$username/$repo.git" 2>&1
git branch -M main 2>&1
git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================"
    Write-Host "  SUCCESS!"
    Write-Host "  https://github.com/$username/$repo"
    Write-Host "========================================"
} else {
    Write-Host ""
    Write-Host "Push failed. Trying credential-less method..."
    # Push using token in header
    git remote set-url origin "https://github.com/$username/$repo.git" 2>&1
    git -c http.extraheader="AUTHORIZATION: bearer $token" push -u origin main 2>&1
}

Pop-Location
Write-Host ""
Read-Host "Press Enter to exit"
