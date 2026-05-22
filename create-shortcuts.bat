@echo off

REM Try multiple possible desktop locations
set DESKTOP=
if exist "%USERPROFILE%\Desktop" set DESKTOP=%USERPROFILE%\Desktop
if exist "%USERPROFILE%\OneDrive\Desktop" set DESKTOP=%USERPROFILE%\OneDrive\Desktop
if exist "%USERPROFILE%\OneDrive\桌面" set DESKTOP=%USERPROFILE%\OneDrive\桌面
if exist "C:\Users\Public\Desktop" set DESKTOP=C:\Users\Public\Desktop
if "%DESKTOP%"=="" (
    echo Cannot find Desktop folder.
    echo Please manually copy these files to Desktop:
    echo   1. start-all.bat
    echo   2. start-quick.bat
    pause
    exit /b 1
)

copy "%~dp0start-all.bat" "%DESKTOP%\Growth OS一键启动.bat" >nul
copy "%~dp0start-quick.bat" "%DESKTOP%\Growth OS快速启动.bat" >nul

echo.
echo Done! Shortcuts created on Desktop.
echo.
pause
