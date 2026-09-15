@echo off
title MySQL 8.0 Permanent Repair Tool
echo ======================================================
echo   Fixing MySQL 8.0 Data Dictionary & Auto-Start
echo ======================================================
echo.
echo [Step 1/4] Stopping any existing service...
net stop MySQL80 >nul 2>&1

echo [Step 2/4] Clearing uninitialized files...
del /q /s /f "C:\ProgramData\MySQL\MySQL Server 8.0\Data\*" >nul 2>&1
for /d %%p in ("C:\ProgramData\MySQL\MySQL Server 8.0\Data\*") do rmdir /s /q "%%p" >nul 2>&1

echo [Step 3/4] Initializing fresh MySQL System Data Dictionary...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --initialize-insecure --datadir="C:\ProgramData\MySQL\MySQL Server 8.0\Data" --console

echo [Step 4/4] Starting MySQL80 Service & Setting Password...
net start MySQL80
timeout /t 2 >nul
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'Digi@2024'; CREATE DATABASE IF NOT EXISTS clockodo_db; FLUSH PRIVILEGES;"

echo.
echo ======================================================
echo   SUCCESS! MySQL is now Permanently RUNNING on Port 3306!
echo ======================================================
pause