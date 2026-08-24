@echo off
REM Optional shortcut only — clients do NOT need this file.
REM Bookmark https://SERVER_IP:5180 instead.
title PureBreed LAN
setlocal EnableExtensions

set "SERVER_IP=%~1"
if "%SERVER_IP%"=="" set "SERVER_IP=192.168.1.3"

set "URL=https://%SERVER_IP%:5180/"

echo.
echo Open this on any PC (no download needed):
echo   %URL%
echo.
echo First time: Advanced → Continue past the certificate warning.
echo Then Export Save As works in normal Edge/Chrome.
echo.
echo Do NOT use http:// — browser blocks Save As.
echo.

start "" "%URL%"
exit /b 0
