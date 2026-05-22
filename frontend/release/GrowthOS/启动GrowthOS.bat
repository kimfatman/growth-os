@echo off
cd /d "%~dp0app"
start "" "%~dp0electron.exe" . --no-stdio-init
exit
