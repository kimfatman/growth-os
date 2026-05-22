@echo off
cd /d "%~dp0"
title Growth OS - 快速启动

echo.
echo ╔══════════════════════════════════════════╗
echo ║     Growth OS - 快速启动                ║
echo ╚══════════════════════════════════════════╝
echo.

echo 启动后端服务...
start "Growth OS Backend" cmd /k "title Growth OS Backend && cd /d "%~dp0backend" && echo [后端] http://localhost:3001 && node src/index.js"
timeout /t 3 /nobreak >nul

echo 启动前端服务...
start "Growth OS Frontend" cmd /k "title Growth OS Frontend && cd /d "%~dp0frontend" && echo [前端] http://localhost:5173 && npm run dev"

echo.
echo ╔══════════════════════════════════════════╗
echo ║  后端: http://localhost:3001             ║
echo ║  前端: http://localhost:5173             ║
echo ║  演示: demo@growthos.com / 123456        ║
echo ║                                          ║
echo ║  新开的两个 CMD 窗口请勿关闭              ║
echo ╚══════════════════════════════════════════╝
echo.
pause
