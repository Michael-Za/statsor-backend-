@echo off
echo Starting StatSor Services...
echo.

echo 1. Starting AI Assistant (Python chatbot)...
start "AI Assistant" cmd /k "cd chatbot && python app.py"
timeout /t 5 /nobreak >nul

echo 2. Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 5 /nobreak >nul

echo 3. Starting Frontend Development Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo All services started!
echo.
echo Frontend: http://localhost:3006
echo Backend: http://localhost:3001
echo AI Assistant: http://localhost:5000
echo.
echo Press any key to exit...
pause >nul