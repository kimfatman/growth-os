@echo off
setlocal
echo ========================================
echo   Claude GUI - Build Script
echo ========================================
echo.

:: Step 1: Install dependencies
echo [1/3] Installing Python dependencies...
pip install -r "%~dp0requirements.txt" --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Dependency installation failed.
    pause & exit /b 1
)
echo [OK] Dependencies installed.

:: Step 2: Clean old artifacts
echo [2/3] Cleaning old build artifacts...
if exist "%~dp0build" rmdir /s /q "%~dp0build"
if exist "%~dp0dist"  rmdir /s /q "%~dp0dist"
if exist "%~dp0*.spec" del /q "%~dp0*.spec"
echo [OK] Clean complete.

:: Step 3: Build with PyInstaller
echo [3/3] Building executable (this may take 1-3 minutes)...
pyinstaller ^
    --onefile ^
    --windowed ^
    --name="ClaudeGUI" ^
    --hidden-import=PySide6.QtNetwork ^
    --hidden-import=markdown ^
    --hidden-import=markdown.extensions.codehilite ^
    --hidden-import=markdown.extensions.fenced_code ^
    --hidden-import=markdown.extensions.tables ^
    --hidden-import=pygments.lexers ^
    --hidden-import=pygments.formatters ^
    --collect-all=anthropic ^
    --clean ^
    "%~dp0main.py"

if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] PyInstaller build failed.
    echo Check for missing hidden imports above.
    pause & exit /b 1
)

echo.
echo ========================================
echo   Build Successful!
echo   Output: %~dp0dist\ClaudeGUI.exe
echo ========================================
pause
endlocal
