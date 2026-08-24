@echo off
:: Optional helper — prefer open-purebreed-lan.bat instead.
:: Note: purebreed.localhost does NOT work on other PCs (browsers force it to 127.0.0.1).
title PureBreed LAN note
echo.
echo Do NOT use:  http://purebreed.localhost:5180
echo Browsers always send *.localhost to THIS PC (127.0.0.1), not the server.
echo.
echo Use instead (double-click):
echo   open-purebreed-lan.bat
echo.
echo That opens Chrome/Edge at http://192.168.1.3:5180 with Save As enabled.
echo.
pause
