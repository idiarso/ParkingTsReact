@echo off
title Parking System Stopper

:: Mengatur warna console
color 0C

echo ====================================
echo    Parking System Service Stopper
echo ====================================
echo.

:: Menghentikan semua proses Node.js
echo Menghentikan semua layanan...
taskkill /F /IM node.exe >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo Semua layanan berhasil dihentikan!
) else (
    echo Tidak ada layanan yang perlu dihentikan
)

echo.
echo ====================================
echo Tekan tombol apapun untuk keluar...
pause >nul 