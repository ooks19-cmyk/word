@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo [FC STAR CARD] 난이도 조절 대시보드 서버를 시작합니다...
where python >nul 2>&1
if %errorlevel%==0 (
    python difficulty_dashboard_server.py --open
) else (
    py -3 difficulty_dashboard_server.py --open
)
pause
