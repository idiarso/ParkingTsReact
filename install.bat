@echo off
setlocal enabledelayedexpansion

echo Parking Management System Installation Script
echo ==========================================
echo.

:: Check if Node.js is installed
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed! Please install Node.js LTS version first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check if Git is installed
git --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Git is not installed! Please install Git first.
    echo Download from: https://git-scm.com/
    pause
    exit /b 1
)

:: Check if PostgreSQL is installed
psql --version > nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL is not installed! Please install PostgreSQL first.
    echo Download from: https://www.postgresql.org/
    pause
    exit /b 1
)

echo Select installation type:
echo 1. Admin System
echo 2. Entry Gate
echo 3. Exit Gate
echo.

set /p INSTALL_TYPE="Enter number (1-3): "

:: Clone repository if not exists
if not exist "parking-system" (
    echo Cloning repository...
    git clone https://github.com/your-repo/parking-system.git
    if %errorlevel% neq 0 (
        echo Failed to clone repository!
        pause
        exit /b 1
    )
)

cd parking-system

:: Install server dependencies for admin installation
if "%INSTALL_TYPE%"=="1" (
    echo Installing Admin System...
    
    :: Server setup
    cd server
    echo Setting up server...
    copy .env.example .env
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install server dependencies!
        pause
        exit /b 1
    )
    
    :: Run database migrations
    call npm run migrate
    if %errorlevel% neq 0 (
        echo Failed to run database migrations!
        pause
        exit /b 1
    )
    cd ..
    
    :: Admin application setup
    cd admin
    echo Setting up admin application...
    copy .env.example .env
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install admin dependencies!
        pause
        exit /b 1
    )
    cd ..
)

:: Install Entry Gate
if "%INSTALL_TYPE%"=="2" (
    echo Installing Entry Gate System...
    cd gate-in
    copy .env.example .env
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install entry gate dependencies!
        pause
        exit /b 1
    )
    cd ..
)

:: Install Exit Gate
if "%INSTALL_TYPE%"=="3" (
    echo Installing Exit Gate System...
    cd gate-out
    copy .env.example .env
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install exit gate dependencies!
        pause
        exit /b 1
    )
    cd ..
)

echo.
echo Installation completed successfully!
echo.
echo Next steps:
echo 1. Configure the .env file with your settings
if "%INSTALL_TYPE%"=="1" (
    echo 2. Start the server: cd server ^&^& npm run dev
    echo 3. Start the admin application: cd admin ^&^& npm run dev
) else if "%INSTALL_TYPE%"=="2" (
    echo 2. Configure hardware devices
    echo 3. Start the entry gate application: cd gate-in ^&^& npm run dev
) else if "%INSTALL_TYPE%"=="3" (
    echo 2. Configure hardware devices
    echo 3. Start the exit gate application: cd gate-out ^&^& npm run dev
)
echo.

pause 