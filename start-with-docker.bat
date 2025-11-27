@echo off
echo Starting StatSor Services with Docker...
echo.

echo 1. Building and starting all services...
docker-compose up --build -d

echo.
echo 2. Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo Services started successfully!
echo.
echo Frontend: http://localhost:3006
echo Backend API: http://localhost:3001
echo AI Assistant Backend: http://localhost:5000
echo.
echo To stop services, run: docker-compose down
echo.
pause