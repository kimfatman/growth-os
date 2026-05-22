@echo off
cd /d "%~dp0"
title Growth OS - 一键启动
color 0B

echo.
echo ╔══════════════════════════════════════════════╗
echo ║        Growth OS - 一键启动                  ║
echo ║        AI 销售增长系统                       ║
echo ╚══════════════════════════════════════════════╝
echo.

REM ── 检查 Node.js ──────────────────────────────────
where node >%TEMP%\nodechk.tmp 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未安装 Node.js
    echo 请先下载安装: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js 已安装
echo.

REM ── 安装后端 ──────────────────────────────────────
echo ====== [1] 后端 ======
cd /d "%~dp0backend"

if exist node_modules (
    echo 依赖已存在，跳过安装
) else (
    echo 安装后端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 后端依赖安装失败
        pause
        exit /b 1
    )
)

echo 填充演示数据...
call npm run seed
echo.

REM ── 安装前端 ──────────────────────────────────────
echo ====== [2] 前端 ======
cd /d "%~dp0frontend"

if exist node_modules (
    echo 依赖已存在，跳过安装
) else (
    echo 安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
)
echo.

REM ── 启动服务 ──────────────────────────────────────
echo ====== [3] 启动服务 ======

cd /d "%~dp0backend"
start "Growth OS Backend" cmd /k "title Growth OS Backend && echo [后端] http://localhost:3001 && node src/index.js"

cd /d "%~dp0frontend"
start "Growth OS Frontend" cmd /k "title Growth OS Frontend && echo [前端] http://localhost:5173 && npm run dev"

cd /d "%~dp0"

echo.
echo ╔══════════════════════════════════════════════╗
echo ║  启动完成！                                  ║
echo ║                                              ║
echo ║  后端 API:  http://localhost:3001             ║
echo ║  前端页面:  http://localhost:5173             ║
echo ║  演示账号: demo@growthos.com / 123456        ║
echo ║                                              ║
echo ║  新开的两个 CMD 窗口请勿关闭                  ║
echo ╚══════════════════════════════════════════════╝
echo.
pause
