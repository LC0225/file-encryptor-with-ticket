@echo off
echo ========================================
echo   File Encryptor - Start Server
echo ========================================
echo.

REM Change to project directory
cd /d D:\file-encryptor-with-ticket-main

echo Current directory: %CD%
echo.

echo Starting development server...
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
