@echo off
REM Resend Email Service Test Script for Windows

cd /d "%~dp0"

if "%1"=="" (
    echo.
    echo 📧 Resend Email Service Test
    echo.
    echo Usage:
    echo   test-email.bat status                    - Check email service status
    echo   test-email.bat test your@email.com       - Send test email
    echo   test-email.bat welcome your@email.com    - Send welcome email
    echo.
    node test-email-service.js status
) else (
    node test-email-service.js %*
)
