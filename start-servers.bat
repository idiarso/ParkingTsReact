@echo off
echo Setting up and starting the Parking Management System...

:: Check if directories exist
if not exist "server" (
    echo Error: server directory not found!
    pause
    exit /b 1
)

if not exist "admin" (
    echo Error: admin directory not found!
    pause
    exit /b 1
)

if not exist "gate-in" (
    echo Error: gate-in directory not found!
    pause
    exit /b 1
)

if not exist "gate-out" (
    echo Error: gate-out directory not found!
    pause
    exit /b 1
)

:: Install dependencies for each component
echo Installing dependencies for all components...

:: Server
echo Installing Server dependencies...
cd server
if errorlevel 1 (
    echo Error: Failed to change to server directory!
    pause
    exit /b 1
)
npm install
npm install pdfkit @types/pdfkit xlsx @types/xlsx qrcode @types/qrcode jsbarcode @types/jsbarcode canvas @types/canvas archiver @types/archiver
cd ..

:: Admin Dashboard
echo Installing Admin Dashboard dependencies...
cd admin
if errorlevel 1 (
    echo Error: Failed to change to admin directory!
    pause
    exit /b 1
)
npm install
cd ..

:: Entry Gate
echo Installing Entry Gate dependencies...
cd gate-in
if errorlevel 1 (
    echo Error: Failed to change to gate-in directory!
    pause
    exit /b 1
)
npm install
cd ..

:: Exit Gate
echo Installing Exit Gate dependencies...
cd gate-out
if errorlevel 1 (
    echo Error: Failed to change to gate-out directory!
    pause
    exit /b 1
)
npm install
cd ..

:: Initialize database
echo Initializing database...
cd server
npm run typeorm migration:run
npm run seed:rates
cd ..

:: Start all servers
echo Starting all servers...

:: Start Server
start "Server" cmd /k "cd server && npm run dev"

:: Start Admin Dashboard
start "Admin Dashboard" cmd /k "cd admin && npm start"

:: Start Entry Gate
start "Entry Gate" cmd /k "cd gate-in && npm start"

:: Start Exit Gate
start "Exit Gate" cmd /k "cd gate-out && npm start"

echo All servers have been started!
echo.
echo Note: Make sure PostgreSQL is running and the database is properly configured
echo in the .env file before starting the servers.
pause 