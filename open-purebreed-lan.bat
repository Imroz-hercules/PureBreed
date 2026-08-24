@echo off
REM PureBreed LAN opener — Export Save As works like localhost
REM Usage: open-purebreed-lan.bat
REM        open-purebreed-lan.bat 192.168.1.10
REM
REM Do NOT use http://purebreed.localhost — browsers force that to THIS PC (127.0.0.1).
REM Do NOT type the LAN IP in a normal Edge/Chrome window — Save As stays blocked.
title PureBreed LAN
setlocal EnableExtensions

set "SERVER_IP=%~1"
if "%SERVER_IP%"=="" set "SERVER_IP=192.168.1.3"

set "ORIGIN=http://%SERVER_IP%:5180"
set "URL=%ORIGIN%/"
set "DATA=%LOCALAPPDATA%\PureBreedBrowser"

echo.
echo ========================================
echo  PureBreed LAN — Save As enabled
echo  %URL%
echo ========================================
echo.
echo IMPORTANT:
echo  1) Close PureBreed tabs in NORMAL Edge/Chrome first.
echo  2) Use ONLY the browser window this script opens.
echo  3) Yellow banner gone = Save As is ready.
echo  4) Never use purebreed.localhost on another PC.
echo.

set "EDGE="
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)
if not defined EDGE if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
)

set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
)
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
)

REM Call the .exe directly (no "start") so flags are not dropped.
REM Separate --user-data-dir forces a new process so the security flag applies.
if defined EDGE (
  echo Starting Edge with Save As enabled...
  echo Leave this window open while you use PureBreed.
  echo.
  "%EDGE%" --user-data-dir="%DATA%\edge" --no-first-run --no-default-browser-check --unsafely-treat-insecure-origin-as-secure=%ORIGIN% "%URL%"
  exit /b 0
)

if defined CHROME (
  echo Starting Chrome with Save As enabled...
  echo Leave this window open while you use PureBreed.
  echo.
  "%CHROME%" --user-data-dir="%DATA%\chrome" --no-first-run --no-default-browser-check --unsafely-treat-insecure-origin-as-secure=%ORIGIN% "%URL%"
  exit /b 0
)

echo ERROR: Google Chrome or Microsoft Edge was not found.
echo Install one of them, then run this file again.
pause
exit /b 1
