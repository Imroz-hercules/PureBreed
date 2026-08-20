@echo off
title Install PureBreed Auto-Start
set "ROOT=C:\Users\ASM\Desktop\purebreed\PureBreed"
set "BAT=%ROOT%\start-purebreed.bat"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT=%STARTUP%\PureBreed Start.lnk"

if not exist "%BAT%" (
  echo ERROR: start-purebreed.bat not found at:
  echo   %BAT%
  echo.
  echo Copy this project to that folder first, then run this again.
  pause
  exit /b 1
)

powershell -NoProfile -Command ^
  "$s = (New-Object -ComObject WScript.Shell).CreateShortcut('%SHORTCUT%');" ^
  "$s.TargetPath = '%BAT%';" ^
  "$s.WorkingDirectory = '%ROOT%';" ^
  "$s.WindowStyle = 7;" ^
  "$s.Description = 'Start PureBreed frontend and backend after login';" ^
  "$s.Save()"

echo.
echo Done. PureBreed will start automatically after you log in.
echo Shortcut:
echo   %SHORTCUT%
echo.
echo To remove auto-start later, delete that shortcut from the Startup folder.
echo.
pause
