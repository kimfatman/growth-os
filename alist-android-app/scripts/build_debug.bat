@echo off
chcp 65001 >nul
setlocal

set PROJECT_DIR=%~dp0..
set OUTPUT_DIR=%PROJECT_DIR%\output

echo ============================================
echo   AList v3.6.0 - Debug APK 快速构建
echo ============================================
echo.

cd /d "%PROJECT_DIR%"

echo [INFO] 构建 Debug APK ...
call gradlew assembleDebug --no-daemon --stacktrace

if %ERRORLEVEL% neq 0 (
    echo [ERROR] 构建失败！
    pause
    exit /b 1
)

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

set APK_PATH=
for /r "%PROJECT_DIR%\app\build\outputs\apk" %%i in (*.apk) do (
    set "APK_PATH=%%i"
)

if defined APK_PATH (
    copy /Y "!APK_PATH!" "%OUTPUT_DIR%\"
    echo.
    echo [OK] APK 已复制到:
    echo     %OUTPUT_DIR%\%~nx!APK_PATH!
) else (
    echo [WARN] 未找到 APK 文件！
)

echo.
echo [INFO] 注意: Debug APK 使用 Android 默认 debug 密钥签名
echo [INFO] 如需发布，请运行 build.bat 构建 Release 版本
echo.
pause
