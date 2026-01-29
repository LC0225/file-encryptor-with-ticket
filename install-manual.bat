@echo off
echo ========================================
echo   File Encryptor - Manual Setup Guide
echo ========================================
echo.

echo Step 1: Check Node.js
echo ---------------------
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed
    echo Please visit https://nodejs.org to install Node.js 18 or later
    pause
    exit /b 1
)
node --version
echo.
echo OK: Node.js is installed
echo.

echo Step 2: Install Dependencies
echo ----------------------------
echo Choose your package manager:
echo   [1] npm (recommended - no extra installation needed)
echo   [2] yarn (requires yarn to be installed)
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo Installing with npm...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
) else if "%choice%"=="2" (
    echo Installing with yarn...
    where yarn >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Yarn not found. Installing yarn globally...
        call npm install -g yarn
        if %ERRORLEVEL% NEQ 0 (
            echo ERROR: Failed to install yarn
            pause
            exit /b 1
        )
        echo Please CLOSE this window and REOPEN it to use yarn
        echo Then run this script again
        pause
        exit /b 0
    )
    call yarn install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: yarn install failed
        pause
        exit /b 1
    )
) else (
    echo Invalid choice. Please run this script again.
    pause
    exit /b 1
)

echo.
echo OK: Dependencies installed
echo.

echo Step 3: Create Environment File
echo ------------------------------
if not exist .env.local (
    echo Creating .env.local file...
    copy .env.example .env.local >nul
    echo OK: Environment file created
    echo NOTE: Edit .env.local to configure Supabase if you want cloud sync
) else (
    echo OK: Environment file already exists
)
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Close this window
echo   2. Open a new Command Prompt in this folder
echo   3. Run one of these commands:
echo      - npm run dev    (if you chose npm)
echo      - yarn dev       (if you chose yarn)
echo.
echo Then visit: http://localhost:5000
echo.

pause
