@echo off
title PureBreed Auto Start
cd /d "%~dp0"

echo Starting PureBreed Backend (port 5002)...
start "PureBreed Backend" cmd /k "cd /d "%~dp0NFM-backend" && call venv\Scripts\activate.bat && python app.py"

timeout /t 5 /nobreak >nul

echo Starting PureBreed Frontend (port 5180)...
start "PureBreed Frontend" cmd /k "cd /d "%~dp0NFM-Frontend" && npm run dev"

echo.
echo Backend:  http://localhost:5002
echo Frontend: http://localhost:5180
exit
