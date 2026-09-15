@echo off
title Clockodo App Launcher
echo ======================================================
echo   Launching DigiPlus Clockodo App (Backend + Frontend)
echo ======================================================
start "Clockodo Backend" cmd /k "cd /d C:\Users\ELCOT\Desktop\Clockodo\backend && node src/server.js"
start "Clockodo Frontend" cmd /k "cd /d C:\Users\ELCOT\Desktop\Clockodo\frontend && npm run dev"
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
timeout /t 3 >nul
start http://localhost:5173