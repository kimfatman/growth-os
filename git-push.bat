@echo off
cd /d "%~dp0"
set TOKEN=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

git init
git add .
git commit -m "Initial commit: Growth OS" 2>nul

git remote remove origin 2>nul
git remote add origin https://oauth2:%TOKEN%@github.com/growth-os.git

git branch -M main
git push -u origin main

echo.
echo Done! Press any key...
pause
