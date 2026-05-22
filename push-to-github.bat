@echo off
cd /d "%~dp0"
set TOKEN=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
set REPO=growth-os

echo ========================================
echo  Creating GitHub Repo + Pushing Code
echo ========================================
echo.

if not exist .git (
    git init
)

git remote remove origin 2>nul

echo [1/4] Creating repository on GitHub...
curl -s -X POST https://api.github.com/user/repos ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"%REPO%\",\"private\":false,\"description\":\"Growth OS - AI Sales Growth System\"}" > %TEMP%\gh_out.txt

findstr "clone_url" %TEMP%\gh_out.txt >nul
if errorlevel 1 (
    type %TEMP%\gh_out.txt
    echo.
    echo Repository may already exist. Continuing...
    rem Get clone URL from existing repo
    curl -s https://api.github.com/repos/%%USERNAME%%/%REPO% -H "Authorization: Bearer %TOKEN%" > %TEMP%\gh_out.txt
)

echo [2/4] Adding files to git...
git add .

echo [3/4] Committing...
git commit -m "Initial commit: Growth OS" 2>nul

echo [4/4] Pushing to GitHub...
git remote add origin https://oauth2:%TOKEN%@github.com/%REPO%.git 2>nul
if errorlevel 1 (
    rem Try with full username
    for /f %%u in ('curl -s -H "Authorization: Bearer %TOKEN%" https://api.github.com/user ^| findstr /i "login"') do (
        set line=%%u
    )
    set remote_url=https://oauth2:%TOKEN%@github.com/%REPO%.git
)
git branch -M main
git push -u origin main

if errorlevel 1 (
    echo.
    echo Push failed. Trying alternative method...
    rem Use git credential helper with token
    git remote set-url origin https://github.com/%REPO%.git
    echo %TOKEN% | git push -u origin main 2>nul
)

echo.
echo ========================================
echo  Done! Check your GitHub:
echo  https://github.com/%REPO%
echo ========================================
pause
