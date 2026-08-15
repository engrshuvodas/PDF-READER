@echo off
title PDF Voice Reader
color 0B

echo ===================================================
echo           PDF Voice Reader - Launcher
echo ===================================================
echo.

cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing packages...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully.
    echo.
)

:: Start Vite Dev Server and open browser
echo [INFO] Starting development server at http://localhost:3000/ ...
echo.

start "" "http://localhost:3000/"
call npm.cmd run dev

pause
