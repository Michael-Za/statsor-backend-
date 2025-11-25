@echo off
echo Pushing environment variable fixes to GitHub...
echo.

cd /d "c:\Users\JOE\Downloads\last ver"

echo Setting user config...
"C:\Program Files\Git\bin\git.exe" config --global user.name "Statsor Developer"
"C:\Program Files\Git\bin\git.exe" config --global user.email "developer@statsor.com"

echo Adding all fixed files...
"C:\Program Files\Git\bin\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\bin\git.exe" commit -m "Fix environment variable alignment and TypeScript errors

- Align Vercel and Railway environment variables
- Update API URLs to point to Railway backend consistently  
- Fix domain configuration to use statsor.com (without www)
- Resolve TypeScript compilation errors in api.ts
- Add proper APIEndpoints interface typing
- Fix CORS configuration for production domain
- Update vite.config.ts and vercel.json for correct URLs
- Remove unused imports and handleAPIError function

This fixes the production authentication issues and API connectivity problems."

echo Pushing to GitHub...
"C:\Program Files\Git\bin\git.exe" push

echo.
echo Done! Environment variable fixes have been pushed to GitHub.
pause