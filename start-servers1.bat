@echo off
echo Starting all servers...

:: Start Admin Server
start "Admin Server" cmd /k "cd server && npm run dev"

:: Start GetIn Server
start "GetIn Server" cmd /k "cd server/src/routes/getin && npm run dev"

:: Start GetOut Server
start "GetOut Server" cmd /k "cd server/src/routes/getout && npm run dev"

echo All servers have been started!
pause 