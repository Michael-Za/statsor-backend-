@echo off
echo Committing and pushing changes to GitHub...
echo.

REM Navigate to project directory
cd /d "c:\Users\JOE\Downloads\teamplaymate-16-master"

REM Check if Git is installed
"C:\Program Files\Git\bin\git.exe" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Git is not installed or not in PATH.
    echo Please download and install Git from https://git-scm.com/downloads
    pause
    exit /b 1
)

REM Check if this is a git repository
"C:\Program Files\Git\bin\git.exe" status >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: This directory is not a Git repository.
    echo Please run init-and-push-fixed.bat first to initialize the repository.
    pause
    exit /b 1
)

echo Git repository detected. Proceeding with commit and push...
echo.

REM Add all files
echo Adding all files...
"C:\Program Files\Git\bin\git.exe" add .

REM Check if there are changes to commit
"C:\Program Files\Git\bin\git.exe" diff --cached --quiet
if %errorlevel% neq 0 (
    REM Make commit with timestamp
    echo Making commit...
    "C:\Program Files\Git\bin\git.exe" commit -m "Fix Google OAuth redirect URI and email configuration issues"
    
    REM Ask user for GitHub repository URL
    set /p github_url="Enter your GitHub repository URL (e.g., https://github.com/username/repo.git): "
    
    REM Set the remote origin
    echo Setting remote origin to %github_url%...
    "C:\Program Files\Git\bin\git.exe" remote set-url origin %github_url%
    
    REM Push to origin main
    echo Pushing to GitHub...
    "C:\Program Files\Git\bin\git.exe" push -u origin main
    
    echo.
    echo Changes successfully pushed to GitHub!
) else (
    echo No changes to commit.
    
    REM Ask user if they want to push anyway
    set /p push_anyway="No changes to commit. Do you want to push anyway? (y/n): "
    if /i "%push_anyway%"=="y" (
        set /p github_url="Enter your GitHub repository URL (e.g., https://github.com/username/repo.git): "
        
        REM Set the remote origin
        echo Setting remote origin to %github_url%...
        "C:\Program Files\Git\bin\git.exe" remote set-url origin %github_url%
        
        REM Push to origin main
        echo Pushing to GitHub...
        "C:\Program Files\Git\bin\git.exe" push -u origin main
        
        echo.
        echo Repository pushed to GitHub!
    )
)

echo.
pause