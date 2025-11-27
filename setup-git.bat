@echo off
echo Setting up Git repository for Statsor platform...
echo.

REM Navigate to project directory
cd /d "c:\Users\JOE\Downloads\mm"

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Git is not installed or not in PATH.
    echo Please download and install Git from https://git-scm.com/downloads
    echo After installation, please run this script again.
    pause
    exit /b 1
)

echo Git is installed. Setting up repository...
echo.

REM Initialize Git repository
echo Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo Error initializing Git repository.
    pause
    exit /b 1
)

REM Configure Git user (you may want to change these)
echo Configuring Git user...
git config --global user.name "Statsor Developer"
git config --global user.email "developer@statsor.com"

REM Add all files
echo Adding files to repository...
git add .

REM Make initial commit
echo Making initial commit...
git commit -m "Initial commit: Statsor football management platform with fixed API integrations"

REM Add remote origin
echo Adding remote origin...
git remote add origin https://github.com/Michael-ctrl-eng/teamplaymate-16.git

echo.
echo Git repository setup complete!
echo.
echo To push to GitHub, run:
echo   git push -u origin main
echo.
echo If you get authentication errors, you'll need to set up a Personal Access Token on GitHub.
echo.
pause