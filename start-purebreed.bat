@echo off
title PureBreed Auto Start
set "ROOT=C:\Users\ASM\Desktop\purebreed\PureBreed"

if not exist "%ROOT%\NFM-backend\app.py" (
  echo ERROR: Project not found at:
  echo   %ROOT%
  echo.
  pause
  exit /b 1
)

cd /d "%ROOT%"

echo Starting PureBreed Backend (port 5002)...
start "PureBreed Backend" cmd /k "cd /d "%ROOT%\NFM-backend" && call venv\Scripts\activate.bat && py -3.10 app.py"

timeout /t 5 /nobreak >nul

echo Starting PureBreed Frontend (port 5180)...
start "PureBreed Frontend" cmd /k "cd /d "%ROOT%\NFM-Frontend" && npm run dev"

echo.
echo Backend:  http://localhost:5002
echo Frontend: https://localhost:5180
echo Network:  https://YOUR-PC-IP:5180  (accept certificate warning once)
echo           Save As export works on HTTPS / localhost only
exit
