@echo off
title PDF Voice Reader - Build Windows EXE
color 0A

echo ===================================================
echo     PDF Voice Reader - Windows EXE Builder
echo ===================================================
echo.

cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Building production bundle and packaging Windows .exe application...
echo.

call npm.cmd run build:exe

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo [SUCCESS] Windows EXE built successfully!
    echo Location: release\PDF Voice Reader-win32-x64\PDF Voice Reader.exe
    echo ===================================================
    echo.
    echo Opening release directory...
    explorer "release\PDF Voice Reader-win32-x64"
) else (
    echo.
    echo [ERROR] Build failed! Please check the output above.
)

pause
