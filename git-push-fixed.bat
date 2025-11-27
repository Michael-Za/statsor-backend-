@echo off
echo Pushing code to GitHub with fixed commits...
echo.

cd /d "c:\Users\JOE\Downloads\mm"

echo Setting user config...
"C:\Program Files\Git\bin\git.exe" config --global user.name "Statsor Developer"
"C:\Program Files\Git\bin\git.exe" config --global user.email "developer@statsor.com"

echo Adding all files...
"C:\Program Files\Git\bin\git.exe" add .

echo Amending the last commit with current changes...
"C:\Program Files\Git\bin\git.exe" commit --amend -m "Initial commit: Statsor football management platform with fixed API integrations"

echo Creating and switching to main branch...
"C:\Program Files\Git\bin\git.exe" checkout -b main 2>nul || "C:\Program Files\Git\bin\git.exe" checkout main

echo Pushing to GitHub (force push to overwrite remote)...
"C:\Program Files\Git\bin\git.exe" push -u origin main --force

echo.
echo Done!
pause