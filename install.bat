@echo off
setlocal enabledelayedexpansion

echo Parking Management System Installation Script
echo ==========================================
echo.

:: Check if script is running as Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: This script requires Administrator privileges.
    echo Please right-click on the script and select "Run as administrator".
    pause
    exit /b 1
)

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

:: Check arguments
if "%1"=="" (
    echo Select installation type:
    echo 1. Admin System
    echo 2. Entry Gate
    echo 3. Exit Gate
    echo.

    set /p INSTALL_TYPE="Enter number (1-3): "
) else (
    set INSTALL_TYPE=%1
)

echo.
echo Selected installation type: !INSTALL_TYPE!
echo.

:: Repository URL
set REPO_URL=https://github.com/idiarso/ParkingTsReact.git

:: Clone repository if not exists
if not exist "parking-system" (
    echo Cloning repository...
    git clone %REPO_URL% parking-system
    if %errorlevel% neq 0 (
        echo Failed to clone repository!
        pause
        exit /b 1
    )
)

cd parking-system

:: Set up configuration
if "%INSTALL_TYPE%"=="1" (
    echo Setting up Admin System...
    
    :: Check if PostgreSQL is installed
    psql --version > nul 2>&1
    if %errorlevel% neq 0 (
        echo PostgreSQL is not installed! Please install PostgreSQL first.
        echo Download from: https://www.postgresql.org/
        pause
        exit /b 1
    )
    
    :: Get IP configurations
    echo.
    echo Enter Server Configuration:
    echo --------------------------
    set /p SERVER_IP="Server IP Address [default: localhost]: "
    if "!SERVER_IP!"=="" set SERVER_IP=localhost
    
    set /p DB_USERNAME="Database Username [default: postgres]: "
    if "!DB_USERNAME!"=="" set DB_USERNAME=postgres
    
    set /p DB_PASSWORD="Database Password [default: postgres]: "
    if "!DB_PASSWORD!"=="" set DB_PASSWORD=postgres
    
    set /p DB_NAME="Database Name [default: parking_system]: "
    if "!DB_NAME!"=="" set DB_NAME=parking_system
    
    :: Server setup
    cd server
    echo Setting up server...
    
    if exist .env.example (
        copy .env.example .env
    ) else (
        echo Creating .env file...
        echo PORT=5000 > .env
        echo NODE_ENV=production >> .env
        echo WEBSOCKET_PORT=8080 >> .env
        echo DB_HOST=localhost >> .env
        echo DB_PORT=5432 >> .env
        echo DB_USERNAME=!DB_USERNAME! >> .env
        echo DB_PASSWORD=!DB_PASSWORD! >> .env
        echo DB_NAME=!DB_NAME! >> .env
    )
    
    echo Installing server dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install server dependencies!
        pause
        exit /b 1
    )
    
    :: Run database migrations
    echo Setting up database...
    echo This may prompt for the PostgreSQL password.
    
    :: Check if database exists
    psql -U !DB_USERNAME! -c "SELECT 1 FROM pg_database WHERE datname='!DB_NAME!'" | findstr "1" > nul
    if %errorlevel% neq 0 (
        echo Creating database !DB_NAME!...
        psql -U !DB_USERNAME! -c "CREATE DATABASE !DB_NAME!;"
    )
    
    call npm run migrate
    if %errorlevel% neq 0 (
        echo Failed to run database migrations!
        echo Continuing anyway, you may need to set up the database manually.
    )
    cd ..
    
    :: Admin application setup
    cd admin
    echo Setting up admin application...
    
    if exist .env.example (
        copy .env.example .env
    ) else (
        echo Creating .env file...
        echo REACT_APP_API_URL=http://!SERVER_IP!:5000 > .env
        echo REACT_APP_WEBSOCKET_URL=ws://!SERVER_IP!:8080 >> .env
    )
    
    echo Installing admin dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install admin dependencies!
        pause
        exit /b 1
    )
    
    :: Build admin app
    echo Building admin application...
    call npm run build
    if %errorlevel% neq 0 (
        echo Warning: Failed to build admin application. You can build it later.
    )
    
    cd ..
    
    :: Install PM2 for service management
    echo Installing PM2 for service management...
    call npm install -g pm2
    if %errorlevel% neq 0 (
        echo Warning: Failed to install PM2. Services will not be set up automatically.
    ) else (
        echo Setting up services...
        call pm2 start server/dist/index.js --name "parking-server"
        call pm2 save
        call pm2 startup
    )
)

:: Install Entry Gate
if "%INSTALL_TYPE%"=="2" (
    echo Installing Entry Gate System...
    
    :: Get IP configurations
    echo.
    echo Enter Gate-In Configuration:
    echo --------------------------
    set /p SERVER_IP="Server IP Address: "
    if "!SERVER_IP!"=="" (
        echo Error: Server IP address is required!
        pause
        exit /b 1
    )
    
    set /p CAMERA_TYPE="Camera Type (webcam/ip) [default: webcam]: "
    if "!CAMERA_TYPE!"=="" set CAMERA_TYPE=webcam
    
    if "!CAMERA_TYPE!"=="ip" (
        set /p CAMERA_IP="Camera IP Address: "
        set /p CAMERA_USERNAME="Camera Username [default: admin]: "
        if "!CAMERA_USERNAME!"=="" set CAMERA_USERNAME=admin
        
        set /p CAMERA_PASSWORD="Camera Password [default: admin]: "
        if "!CAMERA_PASSWORD!"=="" set CAMERA_PASSWORD=admin
    )
    
    cd gate-in
    
    if exist .env.example (
        copy .env.example .env
    ) else (
        echo Creating .env file...
        echo REACT_APP_API_URL=http://!SERVER_IP!:5000 > .env
        echo REACT_APP_WEBSOCKET_URL=ws://!SERVER_IP!:8080 >> .env
        echo REACT_APP_CAMERA_TYPE=!CAMERA_TYPE! >> .env
        
        if "!CAMERA_TYPE!"=="ip" (
            echo REACT_APP_CAMERA_IP=!CAMERA_IP! >> .env
            echo REACT_APP_CAMERA_USERNAME=!CAMERA_USERNAME! >> .env
            echo REACT_APP_CAMERA_PASSWORD=!CAMERA_PASSWORD! >> .env
        )
    )
    
    echo Installing gate-in dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install entry gate dependencies!
        pause
        exit /b 1
    )
    
    :: Build gate-in app
    echo Building gate-in application...
    call npm run build
    if %errorlevel% neq 0 (
        echo Warning: Failed to build gate-in application. You can build it later.
    )
    
    cd ..
)

:: Install Exit Gate
if "%INSTALL_TYPE%"=="3" (
    echo Installing Exit Gate System...
    
    :: Get IP configurations
    echo.
    echo Enter Gate-Out Configuration:
    echo ---------------------------
    set /p SERVER_IP="Server IP Address: "
    if "!SERVER_IP!"=="" (
        echo Error: Server IP address is required!
        pause
        exit /b 1
    )
    
    set /p PRINTER_NAME="Thermal Printer Name [default: POS58]: "
    if "!PRINTER_NAME!"=="" set PRINTER_NAME=POS58
    
    cd gate-out
    
    if exist .env.example (
        copy .env.example .env
    ) else (
        echo Creating .env file...
        echo REACT_APP_API_URL=http://!SERVER_IP!:5000 > .env
        echo REACT_APP_WEBSOCKET_URL=ws://!SERVER_IP!:8080 >> .env
        echo REACT_APP_PRINTER_NAME=!PRINTER_NAME! >> .env
    )
    
    echo Installing gate-out dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo Failed to install exit gate dependencies!
        pause
        exit /b 1
    )
    
    :: Build gate-out app
    echo Building gate-out application...
    call npm run build
    if %errorlevel% neq 0 (
        echo Warning: Failed to build gate-out application. You can build it later.
    )
    
    cd ..
)

:: Create a startup shortcut
echo Creating startup shortcut...
if "%INSTALL_TYPE%"=="1" (
    echo @echo off > start-admin.bat
    echo cd /d %cd%\admin >> start-admin.bat
    echo start http://localhost:3000 >> start-admin.bat
    echo npm run start >> start-admin.bat
    
    echo @echo off > start-server.bat
    echo cd /d %cd%\server >> start-server.bat
    echo npm run start >> start-server.bat
    
    echo Created start-admin.bat and start-server.bat in %cd%
) else if "%INSTALL_TYPE%"=="2" (
    echo @echo off > start-gate-in.bat
    echo cd /d %cd%\gate-in >> start-gate-in.bat
    echo start http://localhost:3001 >> start-gate-in.bat
    echo serve -s build -l 3001 >> start-gate-in.bat
    
    echo Created start-gate-in.bat in %cd%
) else if "%INSTALL_TYPE%"=="3" (
    echo @echo off > start-gate-out.bat
    echo cd /d %cd%\gate-out >> start-gate-out.bat
    echo start http://localhost:3002 >> start-gate-out.bat
    echo serve -s build -l 3002 >> start-gate-out.bat
    
    echo Created start-gate-out.bat in %cd%
)

echo.
echo Installation completed successfully!
echo.
echo Next steps:
echo -----------
if "%INSTALL_TYPE%"=="1" (
    echo 1. Start the server: run start-server.bat
    echo 2. In a new window, start the admin application: run start-admin.bat
    echo 3. Access the admin interface at http://localhost:3000
) else if "%INSTALL_TYPE%"=="2" (
    echo 1. Install serve globally: npm install -g serve
    echo 2. Start the gate-in application: run start-gate-in.bat
    echo 3. Access the gate-in interface at http://localhost:3001
) else if "%INSTALL_TYPE%"=="3" (
    echo 1. Install serve globally: npm install -g serve
    echo 2. Start the gate-out application: run start-gate-out.bat
    echo 3. Access the gate-out interface at http://localhost:3002
)
echo.

echo For detailed configuration and troubleshooting, see installation-guide.md
echo.

pause 