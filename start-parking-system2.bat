@echo off
title Parking System Starter

:: Mengatur warna console
color 0A

echo ====================================
echo    Parking System Service Starter
echo ====================================
echo.

:: Cek apakah Node.js terinstall
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js tidak ditemukan!
    echo Pastikan Node.js sudah terinstall
    pause
    exit /b 1
)

echo Memulai layanan sistem parkir...
echo.

:: Mulai Server
echo Starting Server...
cd /d "%~dp0server"
start "Parking Server" cmd /c "npm start"
timeout /t 5

:: Mulai Admin
echo Starting Admin Dashboard...
cd /d "%~dp0admin"
start "Admin Dashboard" cmd /c "npm start"
timeout /t 5

:: Mulai Gate In
echo Starting Gate In...
cd /d "%~dp0gate-in"
start "Gate In" cmd /c "npm start"
timeout /t 5

:: Mulai Gate Out
echo Starting Gate Out...
cd /d "%~dp0gate-out"
start "Gate Out" cmd /c "npm start"
timeout /t 5

echo.
echo ====================================
echo Semua layanan telah dimulai!
echo.
echo Server API: http://localhost:5000
echo Admin Dashboard: http://localhost:3002
echo Gate In: http://localhost:3000
echo Gate Out: http://localhost:3001
echo ====================================
echo.
echo Tekan tombol apapun untuk menutup window ini...
echo (Aplikasi akan tetap berjalan di background)
pause >nul 