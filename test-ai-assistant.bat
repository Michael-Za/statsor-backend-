@echo off
echo Testing AI Assistant connection...
echo.

echo Testing health endpoint:
curl -X GET http://localhost:5000/health
echo.
echo.

echo Testing chat endpoint:
curl -X POST http://localhost:5000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Hello, what can you help me with?\", \"context\": {}}"
echo.
echo.

echo Test completed.
pause