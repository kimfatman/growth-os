@echo off
REM Growth OS - 一键推送到 GitHub
REM 使用方法：打开 Git Bash 或 PowerShell，运行此脚本
REM 确保已安装 Git (https://git-scm.com)

echo ============================================
echo  Growth OS - 推送到 GitHub
echo ============================================

cd /d "%~dp0.."

echo.
echo [1/5] 初始化 Git 仓库...
if not exist ".git" (
    git init
    echo  Git 仓库已初始化
) else (
    echo  Git 仓库已存在
)

echo.
echo [2/5] 添加远程仓库...
git remote remove origin 2>nul
git remote add origin https://github.com/kimfatman/growth-os.git
echo  远程仓库已添加

echo.
echo [3/5] 添加所有文件到暂存区...
git add -A
echo  文件已添加

echo.
echo [4/5] 创建提交...
git commit -m "Initial commit: Growth OS AI销售增长系统"

echo.
echo [5/5] 推送到 GitHub...
git branch -M main
git push -u origin main --force

echo.
echo ============================================
echo  完成！
echo  仓库地址: https://github.com/kimfatman/growth-os
echo  GitHub Actions 将自动构建 APK
echo  查看进度: https://github.com/kimfatman/growth-os/actions
echo ============================================

pause
