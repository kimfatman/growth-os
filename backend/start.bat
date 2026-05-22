@echo off
cd /d "%~dp0"
echo === Installing dependencies ===
call npm install
if %errorlevel% neq 0 (
  echo Install failed!
  pause
  exit /b %errorlevel%
)
echo.
echo === Seeding demo data ===
call npm run seed
echo.
echo === Starting Growth OS Backend ===
echo Server will start at http://localhost:3001
echo.
npm start
pause
