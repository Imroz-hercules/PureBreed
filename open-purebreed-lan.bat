@echo off
:: Opens PureBreed with Save As export enabled on LAN.
:: Prefer: http://purebreed.localhost:5180  (after setup-purebreed-lan.bat)
:: Fallback: Chrome/Edge with security flag for raw IP.
title PureBreed LAN
setlocal EnableExtensions

set "SERVER_IP=%~1"
if "%SERVER_IP%"=="" set "SERVER_IP=192.168.1.3"

set "LOCAL_URL=http://purebreed.localhost:5180/"
set "IP_URL=http://%SERVER_IP%:5180/"

:: Prefer *.localhost (secure context over HTTP)
ping -n 1 purebreed.localhost >nul 2>&1
if not errorlevel 1 (
  echo Opening %LOCAL_URL%
  start "" "%LOCAL_URL%"
  exit /b 0
)

echo purebreed.localhost not set. Run setup-purebreed-lan.bat as Administrator first.
echo Opening Chrome/Edge with LAN Save As enabled for %IP_URL% ...

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

set "FLAG=--unsafely-treat-insecure-origin-as-secure=%IP_URL:~0,-1%"
set "DATA=%LOCALAPPDATA%\PureBreedBrowser"

if exist "%CHROME%" (
  start "" "%CHROME%" %FLAG% --user-data-dir="%DATA%\chrome" "%IP_URL%"
  exit /b 0
)
if exist "%EDGE%" (
  start "" "%EDGE%" %FLAG% --user-data-dir="%DATA%\edge" "%IP_URL%"
  exit /b 0
)

echo Chrome/Edge not found. Opening default browser (Save As may go to Downloads).
start "" "%IP_URL%"
pause
