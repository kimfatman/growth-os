@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set PROJECT_DIR=%~dp0
set WRAPPER_DIR=%PROJECT_DIR%gradle\wrapper
set WRAPPER_JAR=%WRAPPER_DIR%\gradle-wrapper.jar
set WRAPPER_PROPS=%WRAPPER_DIR%\gradle-wrapper.properties

echo ============================================
echo   AList v3.6.0 Android 项目初始化
echo ============================================
echo.

:: Step 1: Check Java
echo [1/4] 检查 Java 环境...
java -version 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 未找到 Java！请安装 JDK 17+
    echo         下载地址: https://adoptium.net/
    pause
    exit /b 1
)
echo [OK] Java 已安装
echo.

:: Step 2: Check Android SDK
echo [2/4] 检查 Android SDK 环境...
if "%ANDROID_HOME%"=="" (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
        echo [OK] 发现 Android SDK: !ANDROID_HOME!
    ) else if exist "C:\Users\%USERNAME%\AppData\Local\Android\Sdk" (
        set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
        echo [OK] 发现 Android SDK: !ANDROID_HOME!
    ) else (
        echo [WARN] 未检测到 Android SDK
        echo        请安装 Android Studio 或设置 ANDROID_HOME 环境变量
    )
) else (
    echo [OK] ANDROID_HOME 已设置: %ANDROID_HOME%
)
echo.

:: Step 3: Download Gradle Wrapper
echo [3/4] 检查 Gradle Wrapper...
if not exist "%WRAPPER_JAR%" (
    echo [INFO] 正在下载 Gradle Wrapper JAR...
    powershell -Command "& {param($u,$o) [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile($u,$o)}" -u "https://raw.githubusercontent.com/gradle/gradle/v8.2.0/gradle/wrapper/gradle-wrapper.jar" -o "%WRAPPER_JAR%"
    if !ERRORLEVEL! neq 0 (
        echo [WARN] 在线下载失败，尝试备用方案...
        :: 备用方案: 通过 gradle 命令生成 wrapper
        where gradle >nul 2>nul
        if !ERRORLEVEL! equ 0 (
            echo [INFO] 使用系统 Gradle 生成 wrapper...
            cd /d "%PROJECT_DIR%"
            gradle wrapper --gradle-version 8.2
        ) else (
            echo [ERROR] 无法获取 Gradle Wrapper！
            echo         请手动从以下地址下载:
            echo         https://services.gradle.org/distributions/gradle-8.2-bin.zip
            echo         并解压到任意目录后运行:
            echo         gradle wrapper --gradle-version 8.2
            pause
            exit /b 1
        )
    ) else (
        echo [OK] Gradle Wrapper JAR 已下载
    )
) else (
    echo [OK] Gradle Wrapper 已存在
)
echo.

:: Step 4: Generate Keystore
echo [4/4] 检查 Release 签名密钥...
set KEYSTORE_FILE=%PROJECT_DIR%app\alist.jks
if not exist "%KEYSTORE_FILE%" (
    echo [INFO] 正在生成签名密钥 (keystore)...
    keytool -genkey -v -keystore "%KEYSTORE_FILE%" ^
        -alias alist -keyalg RSA -keysize 2048 -validity 36500 ^
        -storepass alist123 -keypass alist123 ^
        -dname "CN=AList, OU=AList, O=AList, L=Beijing, S=Beijing, C=CN"
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] 生成密钥失败！
        pause
        exit /b 1
    )
    echo [OK] 密钥已生成: %KEYSTORE_FILE%
) else (
    echo [OK] 签名密钥已存在
)

echo.
echo ============================================
echo   初始化完成！
echo.
echo   可用命令:
echo     build_debug.bat     - 构建 Debug APK（快速）
echo     build.bat           - 构建 Release APK（含签名）
echo     或在 Android Studio 中打开本项目
echo ============================================
pause
