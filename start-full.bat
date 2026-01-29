@echo off
echo ========================================
echo   File Encryptor - Complete Start
echo ========================================
echo.

REM Change to project directory
cd /d D:\file-encryptor-with-ticket-main

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Cannot find project directory
    echo Expected path: D:\file-encryptor-with-ticket-main
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

REM Check if package.json exists
if not exist package.json (
    echo ERROR: package.json not found
    echo Please ensure you are in the correct project directory
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo Node modules not found. Installing dependencies...
    echo.
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
    echo Dependencies installed successfully!
) else (
    echo Dependencies already installed.
)

echo.
echo ========================================
echo   Starting Development Server
echo ========================================
echo.

REM Start the development server
npm run dev

REM Keep window open if server stops
echo.
echo ========================================
echo   Server stopped
echo ========================================
echo.
echo Press any key to close this window...
pause > nul
