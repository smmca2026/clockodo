@echo off
:: Batch file to fix 502 Bad Gateway by routing to the active server
echo ===================================================
echo   FIXING CLOCKODO 502 BAD GATEWAY ERROR
echo ===================================================
echo.

findstr /v "clockodo.digipl.us" C:\Windows\System32\drivers\etc\hosts > "%TEMP%\hosts_clean.txt" 2>nul
echo 62.171.172.97 clockodo.digipl.us >> "%TEMP%\hosts_clean.txt"
copy /y "%TEMP%\hosts_clean.txt" C:\Windows\System32\drivers\etc\hosts >nul
del "%TEMP%\hosts_clean.txt" 2>nul

ipconfig /flushdns >nul

echo [OK] Done! Clockodo is now pointing to Active Server (62.171.172.97).
echo.
echo Launching Clockodo in browser...
start https://clockodo.digipl.us
timeout /t 3 >nul
