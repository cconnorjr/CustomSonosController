@echo off
setlocal enabledelayedexpansion
set "ROOT=%~dp0"

echo ============================================
echo  Sonos Controller - First Time Setup
echo ============================================
echo.

:: ----------------------------------------------------
:: Check Python exists and is >= 3.11
:: ----------------------------------------------------
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found in PATH.
    echo Please install Python 3.11 or later from https://python.org
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set "PY_VER=%%v"
echo Found Python %PY_VER%

:: Parse major.minor from version string (e.g. 3.12.1 -> 3 and 12)
for /f "tokens=1,2 delims=." %%a in ("%PY_VER%") do (
    set "PY_MAJOR=%%a"
    set "PY_MINOR=%%b"
)
if !PY_MAJOR! lss 3 (
    echo ERROR: Python 3.11 or later is required. Found %PY_VER%.
    pause
    exit /b 1
)
if !PY_MAJOR! equ 3 if !PY_MINOR! lss 11 (
    echo ERROR: Python 3.11 or later is required. Found %PY_VER%.
    pause
    exit /b 1
)

:: ----------------------------------------------------
:: Check Node
:: ----------------------------------------------------
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found in PATH.
    echo Please install Node.js 18 or later from https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f %%v in ('node --version') do set "NODE_VER=%%v"
echo Found Node.js %NODE_VER%
echo.

:: ----------------------------------------------------
:: Python virtual environment
:: ----------------------------------------------------
if not exist "%ROOT%backend\.venv\Scripts\uvicorn.exe" (
    echo [1/3] Creating Python virtual environment...
    python -m venv "%ROOT%backend\.venv"
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo       Installing Python dependencies...
    "%ROOT%backend\.venv\Scripts\pip" install -e "%ROOT%backend" --quiet
    if errorlevel 1 (
        echo ERROR: Failed to install Python dependencies.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Python environment already set up, skipping.
)

:: Verify key packages are importable
"%ROOT%backend\.venv\Scripts\python.exe" -c "import soco; import fastapi; import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo WARNING: Virtual environment appears incomplete. Reinstalling...
    "%ROOT%backend\.venv\Scripts\pip" install -e "%ROOT%backend" --quiet
    if errorlevel 1 (
        echo ERROR: Failed to install Python dependencies.
        pause
        exit /b 1
    )
)

:: ----------------------------------------------------
:: Frontend
:: ----------------------------------------------------
if not exist "%ROOT%frontend" (
    echo ERROR: frontend directory not found at %ROOT%frontend
    pause
    exit /b 1
)
echo [2/3] Installing frontend dependencies...
cd /d "%ROOT%frontend"
call npm install --silent
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies.
    pause
    exit /b 1
)

:: ----------------------------------------------------
:: Desktop (Electron)
:: ----------------------------------------------------
if not exist "%ROOT%desktop" (
    echo ERROR: desktop directory not found at %ROOT%desktop
    pause
    exit /b 1
)
echo [3/3] Installing desktop dependencies...
cd /d "%ROOT%desktop"
call npm install --silent
if errorlevel 1 (
    echo ERROR: Failed to install desktop dependencies.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Setup complete!
echo  Run launch.bat to start Sonos Controller.
echo ============================================
echo.
pause
