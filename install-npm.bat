@echo off
echo ========================================
echo   File Encryptor - One-Click Setup
echo ========================================
echo.

REM Check Node.js
echo [1/5] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed
    echo Please visit https://nodejs.org to install
    pause
    exit /b 1
)
echo OK: Node.js is installed
node --version

REM Install dependencies using npm
echo.
echo [2/5] Installing project dependencies...
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Dependency installation failed
    echo Trying with yarn as fallback...
    where yarn >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Neither npm nor yarn is available
        pause
        exit /b 1
    )
    yarn install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Dependency installation failed
        pause
        exit /b 1
    )
)
echo OK: Dependencies installed

REM Create environment file
echo.
echo [3/5] Setting up environment variables...
if not exist .env.local (
    echo Creating .env.local file...
    copy .env.example .env.local >nul
    echo OK: Environment file created
    echo INFO: Please edit .env.local to configure Supabase if needed
) else (
    echo OK: Environment file already exists
)

REM Start development server
echo.
echo [4/5] Starting development server...
echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Access URL: http://localhost:5000
echo.
echo Tips:
echo    - Press Ctrl+C to stop the server
echo    - The server will auto-reload on code changes
echo.
echo Starting server...
echo.

npm run dev

pause
