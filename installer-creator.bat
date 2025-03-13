@echo off
setlocal enabledelayedexpansion

echo Parking System Installer Creator
echo ===============================
echo.
echo This script will create installation packages for different components of the Parking System.
echo.

:: Check dependencies
where 7z >nul 2>&1
if %errorlevel% neq 0 (
    echo 7-Zip is required but not found. Please install 7-Zip first.
    echo Download from: https://www.7-zip.org/
    pause
    exit /b 1
)

:: Create directories for output
if not exist "installers" mkdir installers
if not exist "temp" mkdir temp

:: Copy install.bat to temp
copy install.bat temp\install.bat

:: Check which components to package
echo Which components do you want to package?
echo 1. All components (Admin, Gate-In, Gate-Out, Server)
echo 2. Admin System only
echo 3. Gate-In System only
echo 4. Gate-Out System only
echo.
set /p PACKAGE_TYPE="Enter number (1-4): "

echo.
echo Creating installation packages...
echo.

:: Create README file for installation
echo # Parking System Installation Guide > temp\README.txt
echo. >> temp\README.txt
echo This package contains installation files for the Parking System. >> temp\README.txt
echo. >> temp\README.txt
echo ## Prerequisites >> temp\README.txt
echo. >> temp\README.txt
echo - Node.js 14 or higher >> temp\README.txt
echo - Git >> temp\README.txt
echo - PostgreSQL 12 or higher (for server/admin system) >> temp\README.txt
echo. >> temp\README.txt
echo ## Installation >> temp\README.txt
echo. >> temp\README.txt
echo 1. Extract all files to a folder >> temp\README.txt
echo 2. Run install.bat and follow the instructions >> temp\README.txt
echo. >> temp\README.txt

if "%PACKAGE_TYPE%"=="1" (
    echo Creating complete system package...
    
    :: Create batch files for each component
    echo @echo off > temp\install-admin.bat
    echo echo Installing Admin System... >> temp\install-admin.bat
    echo call install.bat 1 >> temp\install-admin.bat
    
    echo @echo off > temp\install-gate-in.bat
    echo echo Installing Gate-In System... >> temp\install-gate-in.bat
    echo call install.bat 2 >> temp\install-gate-in.bat
    
    echo @echo off > temp\install-gate-out.bat
    echo echo Installing Gate-Out System... >> temp\install-gate-out.bat
    echo call install.bat 3 >> temp\install-gate-out.bat
    
    :: Package everything
    7z a -tzip "installers\parking-system-complete.zip" .\temp\*
    
    :: Individual packages
    echo Creating individual packages...
    7z a -tzip "installers\parking-system-admin.zip" .\temp\install.bat .\temp\README.txt .\temp\install-admin.bat 
    7z a -tzip "installers\parking-system-gate-in.zip" .\temp\install.bat .\temp\README.txt .\temp\install-gate-in.bat
    7z a -tzip "installers\parking-system-gate-out.zip" .\temp\install.bat .\temp\README.txt .\temp\install-gate-out.bat
    
) else if "%PACKAGE_TYPE%"=="2" (
    echo Creating Admin System package...
    
    echo @echo off > temp\install-admin.bat
    echo echo Installing Admin System... >> temp\install-admin.bat
    echo call install.bat 1 >> temp\install-admin.bat
    
    7z a -tzip "installers\parking-system-admin.zip" .\temp\install.bat .\temp\README.txt .\temp\install-admin.bat
    
) else if "%PACKAGE_TYPE%"=="3" (
    echo Creating Gate-In System package...
    
    echo @echo off > temp\install-gate-in.bat
    echo echo Installing Gate-In System... >> temp\install-gate-in.bat
    echo call install.bat 2 >> temp\install-gate-in.bat
    
    7z a -tzip "installers\parking-system-gate-in.zip" .\temp\install.bat .\temp\README.txt .\temp\install-gate-in.bat
    
) else if "%PACKAGE_TYPE%"=="4" (
    echo Creating Gate-Out System package...
    
    echo @echo off > temp\install-gate-out.bat
    echo echo Installing Gate-Out System... >> temp\install-gate-out.bat
    echo call install.bat 3 >> temp\install-gate-out.bat
    
    7z a -tzip "installers\parking-system-gate-out.zip" .\temp\install.bat .\temp\README.txt .\temp\install-gate-out.bat
)

:: Clean up temp directory
rmdir /s /q temp

echo.
echo Installation packages have been created in the "installers" directory.
echo.
echo You can distribute these packages to the appropriate computers:
echo - Admin System (with Server): For the main management computer
echo - Gate-In System: For the entrance gate computer
echo - Gate-Out System: For the exit gate computer
echo.

pause 