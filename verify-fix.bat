@echo off
echo ================================================
echo StatSor AI Assistant - Fix Verification
echo ================================================
echo.

echo Checking if services are running...
echo.

echo 1. Checking Docker containers...
docker-compose ps
echo.

echo 2. Testing service connectivity...
node test-ai-connection.js
echo.

echo 3. Checking if required files exist...
if exist "src\components\AIAssistantSection.tsx" (
    echo ✅ AIAssistantSection.tsx exists
) else (
    echo ❌ AIAssistantSection.tsx not found
)

if exist "src\services\aiChatService.ts" (
    echo ✅ aiChatService.ts exists
) else (
    echo ❌ aiChatService.ts not found
)

if exist "AI_ASSISTANT_STARTUP_GUIDE.md" (
    echo ✅ AI_ASSISTANT_STARTUP_GUIDE.md exists
) else (
    echo ❌ AI_ASSISTANT_STARTUP_GUIDE.md not found
)

if exist "IMPLEMENT_ALL_FIXES.bat" (
    echo ✅ IMPLEMENT_ALL_FIXES.bat exists
) else (
    echo ❌ IMPLEMENT_ALL_FIXES.bat not found
)

echo.
echo ================================================
echo VERIFICATION COMPLETE
echo ================================================
echo.
echo To implement all fixes, run: IMPLEMENT_ALL_FIXES.bat
echo To test AI connection, run: npm run test:ai-connection
echo.
pause