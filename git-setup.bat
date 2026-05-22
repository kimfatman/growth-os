@echo off
cd /d "%~dp0"
echo ========================================
echo   Initializing Git Repository
echo ========================================
echo.

REM Init git
git init
if %errorlevel% neq 0 (
    echo Git not found! Please install Git from https://git-scm.com
    pause
    exit /b 1
)

echo Adding all files...
git add .

echo Creating initial commit...
git commit -m "Initial commit: Growth OS - AI Sales Growth System

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express + JSON Storage
- Auth: JWT + bcryptjs
- Features: CRM, Pipeline, AI Center, Content, Gamification"

echo.
echo ========================================
echo  Git repo initialized!
echo ========================================
echo.
echo  Next steps:
echo  1. Create a repo on GitHub:
echo     https://github.com/new
echo.
echo  2. Run these commands (replace YOUR_USER/YOUR_REPO):
echo.
echo     git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
echo     git branch -M main
echo     git push -u origin main
echo.
echo ========================================
pause
