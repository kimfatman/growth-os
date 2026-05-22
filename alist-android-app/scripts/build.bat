@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set PROJECT_DIR=%~dp0..
set APK_DIR=%PROJECT_DIR%\app\build\outputs\apk\release
set OUTPUT_DIR=%PROJECT_DIR%\output
set KEYSTORE_DIR=%PROJECT_DIR%\app
set KEYSTORE_FILE=%KEYSTORE_DIR%\alist.jks

echo ============================================
echo   AList v3.6.0 Android APK Build Script
echo ============================================
echo.

if not exist "%KEYSTORE_FILE%" (
    echo [INFO] 未检测到 keystore，正在生成签名密钥...
    if "%JAVA_HOME%"=="" (
        set KEYTOOL_PATH=keytool
    ) else (
        set KEYTOOL_PATH="%JAVA_HOME%\bin\keytool"
    )
    %KEYTOOL_PATH% -genkey -v -keystore "%KEYSTORE_FILE%" ^
        -alias alist -keyalg RSA -keysize 2048 -validity 36500 ^
        -storepass alist123 -keypass alist123 ^
        -dname "CN=AList, OU=AList, O=AList, L=Beijing, S=Beijing, C=CN"
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] 生成 keystore 失败！
        exit /b 1
    )
    echo [OK] Keystore 已生成: %KEYSTORE_FILE%
)

echo [INFO] 正在构建 Release APK (arm64-v8a) ...
cd /d "%PROJECT_DIR%"
call gradlew assembleRelease --no-daemon --stacktrace

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gradle 构建失败！
    exit /b 1
)

echo [INFO] 构建完成，正在定位 APK ...
for /r "%APK_DIR%" %%i in (*.apk) do (
    set "APK_PATH=%%i"
)

if not defined APK_PATH (
    echo [ERROR] 未找到生成的 APK 文件！
    exit /b 1
)

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

set SIGNED_APK=%OUTPUT_DIR%\alist-v3.6.0-arm64-v8a-signed.apk
set UNSIGNED_APK=%APK_DIR%\app-release-unsigned.apk

echo [INFO] 对齐并签名 APK ...

if "%ANDROID_HOME%"=="" (
    if exist "%ANDROID_SDK_ROOT%" (
        set ANDROID_HOME=%ANDROID_SDK_ROOT%
    )
)

if not "%ANDROID_HOME%"=="" (
    set BUILD_TOOLS=%ANDROID_HOME%\build-tools
    for /f "delims=" %%d in ('dir /b /o-d "%BUILD_TOOLS%" 2^>nul') do (
        set "ZIPALIGN=%BUILD_TOOLS%\%%d\zipalign"
        set "APKSIGNER=%BUILD_TOOLS%\%%d\apksigner"
        goto :foundTools
    )
)

:foundTools

if defined ZIPALIGN (
    echo [INFO] 使用 Android SDK 签名...
    "%ZIPALIGN%" -v -p 4 "%APK_PATH%" "%SIGNED_APK%.unaligned" 2>nul
    if exist "%SIGNED_APK%.unaligned" (
        "%APKSIGNER%" sign --ks "%KEYSTORE_FILE%" --ks-pass pass:alist123 ^
            --ks-key-alias alist --key-pass pass:alist123 ^
            --out "%SIGNED_APK%" "%SIGNED_APK%.unaligned"
        del "%SIGNED_APK%.unaligned"
        echo [OK] APK 已签名: %SIGNED_APK%
    )
) else (
    echo [WARN] 未找到 Android SDK build-tools
    echo [WARN] 将使用 Gradle 构建的已有签名 APK
    copy /Y "%APK_PATH%" "%OUTPUT_DIR%\"
    echo [OK] APK: %OUTPUT_DIR%\app-release-unsigned.apk
)

echo [INFO] 清理临时文件...
cd /d "%PROJECT_DIR%"
call gradlew clean --no-daemon 2>nul

echo.
echo ============================================
echo   构建完成！
echo.
echo   输出文件:
if exist "%SIGNED_APK%" (
echo     %SIGNED_APK%
)
if exist "%OUTPUT_DIR%\app-release-unsigned.apk" (
echo     %OUTPUT_DIR%\app-release-unsigned.apk
)
echo ============================================
pause
