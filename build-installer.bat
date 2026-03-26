@echo off
setlocal
set "ROOT=%~dp0"

echo ============================================
echo  Sonos Controller - Build Windows Installer
echo ============================================
echo.

:: ----------------------------------------------------
:: Pre-flight checks
:: ----------------------------------------------------
if not exist "%ROOT%backend\.venv\Scripts\uvicorn.exe" (
    echo ERROR: Python virtual environment not found.
    echo Please run install.bat first.
    echo.
    pause
    exit /b 1
)

if not exist "%ROOT%desktop\node_modules\.bin\electron-builder.cmd" (
    echo ERROR: Desktop dependencies not installed.
    echo Please run install.bat first.
    echo.
    pause
    exit /b 1
)

:: ----------------------------------------------------
:: Build the React frontend
:: ----------------------------------------------------
echo [1/2] Building frontend...
cd /d "%ROOT%frontend"
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed.
    pause
    exit /b 1
)
echo       Done.

:: ----------------------------------------------------
:: Package with electron-builder
:: ----------------------------------------------------
echo [2/2] Packaging installer (this takes a few minutes)...
cd /d "%ROOT%desktop"
call npm run dist
if errorlevel 1 (
    echo ERROR: Installer build failed.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Installer ready:
echo  desktop\dist\Sonos Controller Setup*.exe
echo ============================================
echo.
pause
