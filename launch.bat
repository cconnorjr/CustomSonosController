@echo off
setlocal enabledelayedexpansion
set "ROOT=%~dp0"

:: ----------------------------------------------------
:: Pre-flight checks
:: ----------------------------------------------------
if not exist "%ROOT%backend\.venv\Scripts\uvicorn.exe" (
    echo ERROR: Setup has not been run.
    echo Please run install.bat first.
    echo.
    pause
    exit /b 1
)

if not exist "%ROOT%desktop\node_modules\.bin\electron.cmd" (
    echo ERROR: Desktop dependencies not installed.
    echo Please run install.bat first.
    echo.
    pause
    exit /b 1
)

:: ----------------------------------------------------
:: Build the frontend if missing or source is newer
:: ----------------------------------------------------
set "NEEDS_BUILD=0"

if not exist "%ROOT%frontend\dist\index.html" (
    set "NEEDS_BUILD=1"
) else (
    :: Check if any source file is newer than the build output
    for /f %%F in ('dir /b /s /o-d "%ROOT%frontend\src\*" 2^>nul') do (
        for /f %%D in ('dir /b /o-d "%ROOT%frontend\dist\index.html" 2^>nul') do (
            set "NEWEST_SRC=%%~tF"
            set "BUILD_TIME=%%~tD"
        )
        goto :compare
    )
)

:compare
if defined NEWEST_SRC if defined BUILD_TIME (
    if "!NEWEST_SRC!" gtr "!BUILD_TIME!" set "NEEDS_BUILD=1"
)

if "%NEEDS_BUILD%"=="1" (
    echo Building frontend...
    cd /d "%ROOT%frontend"
    call npm run build
    if errorlevel 1 (
        echo ERROR: Frontend build failed.
        pause
        exit /b 1
    )
)

:: ----------------------------------------------------
:: Launch (Electron starts the backend automatically)
:: ----------------------------------------------------
cd /d "%ROOT%desktop"
npm start
