@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo   Trae CN IDE - 数据迁移到 D 盘
echo ============================================
echo.
echo 这将把以下目录从 C 盘迁移到 D:\TraeCN-Data\：
echo   - C:\Users\Administrator\.trae-cn
echo   - C:\Users\Administrator\AppData\Roaming\Trae CN
echo.

set /p CONFIRM="确认迁移？(Y/N): "
if /i not "!CONFIRM!"=="Y" (
    echo 已取消
    pause
    exit /b
)

:: ====== 配置 ======
set TARGET_BASE=D:\TraeCN-Data
set OLD_TRAECN=%USERPROFILE%\.trae-cn
set OLD_ROAMING=%APPDATA%\Trae CN
set NEW_TRAECN=%TARGET_BASE%\.trae-cn
set NEW_ROAMING=%TARGET_BASE%\Roaming\Trae CN

:: ====== 1. 创建目标目录 ======
echo [1/4] 在 D 盘创建数据目录...
if not exist "%TARGET_BASE%" mkdir "%TARGET_BASE%"

:: ====== 2. 关闭 Trae ======
echo [2/4] 尝试关闭 Trae CN（如果运行中）...
taskkill /f /im "Trae CN.exe" >nul 2>nul
taskkill /f /im "Trae CN" >nul 2>nul
timeout /t 3 /nobreak >nul

:: ====== 3. 迁移 .trae-cn ======
echo [3/4] 迁移用户数据...
if exist "%OLD_TRAECN%" (
    echo   正在复制 .trae-cn 到 D 盘...
    robocopy "%OLD_TRAECN%" "%NEW_TRAECN%" /E /COPY:DAT /R:1 /W:1 /NFL /NDL /NJH /NJS >nul
    if !ERRORLEVEL! lss 8 (
        echo   删除原目录...
        rmdir /s /q "%OLD_TRAECN%" 2>nul
        echo   创建符号链接...
        mklink /J "%OLD_TRAECN%" "%NEW_TRAECN%" >nul
        echo   [OK] .trae-cn 已迁移
    ) else (
        echo   [WARN] 复制可能不完整，请检查
    )
) else (
    echo   [SKIP] .trae-cn 不存在
)

:: ====== 4. 迁移 AppData\Roaming\Trae CN ======
if exist "%OLD_ROAMING%" (
    echo   正在复制 Trae CN(Roaming) 到 D 盘...
    robocopy "%OLD_ROAMING%" "%NEW_ROAMING%" /E /COPY:DAT /R:1 /W:1 /NFL /NDL /NJH /NJS >nul
    if !ERRORLEVEL! lss 8 (
        echo   删除原目录...
        rmdir /s /q "%OLD_ROAMING%" 2>nul
        echo   创建符号链接...
        mklink /J "%OLD_ROAMING%" "%NEW_ROAMING%" >nul
        echo   [OK] AppData\Roaming\Trae CN 已迁移
    ) else (
        echo   [WARN] 复制可能不完整，请检查
    )
) else (
    echo   [SKIP] AppData\Roaming\Trae CN 不存在
)

echo.
echo ============================================
echo   迁移完成！
echo.
echo   原路径已通过符号链接指向:
echo     D:\TraeCN-Data\
echo.
echo   释放 C 盘空间: 请检查迁移后大小
echo   现在可以启动 Trae CN 使用了
echo ============================================
pause
