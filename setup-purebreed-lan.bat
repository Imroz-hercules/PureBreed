@echo off
:: Run ONCE on each PC that opens PureBreed over the LAN (Right-click → Run as administrator).
:: Makes http://purebreed.localhost:5180 work like localhost → Export Save As works.
title PureBreed LAN hosts setup
setlocal EnableExtensions

set "SERVER_IP=%~1"
if "%SERVER_IP%"=="" set "SERVER_IP=192.168.1.3"

set "HOSTS=%SystemRoot%\System32\drivers\etc\hosts"
set "MARKER=purebreed.localhost"

net session >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERROR: Run this file as Administrator.
  echo Right-click → Run as administrator
  echo.
  pause
  exit /b 1
)

findstr /i /c:"%MARKER%" "%HOSTS%" >nul 2>&1
if not errorlevel 1 (
  echo.
  echo Hosts already has purebreed.localhost — updating IP to %SERVER_IP% ...
  findstr /v /i /c:"%MARKER%" "%HOSTS%" > "%TEMP%\hosts.purebreed"
  move /y "%TEMP%\hosts.purebreed" "%HOSTS%" >nul
)

echo %SERVER_IP%    purebreed.localhost>> "%HOSTS%"
echo.
echo Done.
echo   %SERVER_IP%    purebreed.localhost
echo.
echo On this PC open:
echo   http://purebreed.localhost:5180
echo.
echo Export Save As will work the same as localhost.
echo.
pause
