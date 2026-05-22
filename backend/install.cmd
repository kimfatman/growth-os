@echo off
cd /d "D:\app\123\backend"
call npm install --save better-sqlite3@^11.6.0 2>nul
echo Done
