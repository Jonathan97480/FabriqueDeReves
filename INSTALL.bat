@echo off
echo ========================================
echo Plume & Reve - Installation Script
echo ========================================
echo.

echo [1/4] Verifying Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed
echo.

echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully
echo.

echo [3/4] Creating placeholder assets directory structure...
if not exist "src\assets\images\backgrounds" mkdir "src\assets\images\backgrounds"
if not exist "src\assets\images\heroes" mkdir "src\assets\images\heroes"
if not exist "src\assets\images\items" mkdir "src\assets\images\items"
if not exist "src\assets\images\effects" mkdir "src\assets\images\effects"
if not exist "src\assets\images\icons" mkdir "src\assets\images\icons"
if not exist "src\assets\animations" mkdir "src\assets\animations"
if not exist "src\assets\models" mkdir "src\assets\models"
echo Asset directories created
echo.

echo [4/4] Starting Expo development server...
echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo The app will now start with placeholder assets.
echo You can replace them with real assets later.
echo.
echo Press Ctrl+C to stop the server
echo.
call npm start
