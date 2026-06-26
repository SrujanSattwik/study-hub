@echo off
echo ========================================
echo   StudyHub Authentication Server
echo ========================================
echo.

echo [1/3] Testing database connection...
node test-auth-db.js

echo.
echo [2/3] Installing dependencies (if needed)...
call npm install express cors bcrypt uuid --silent

echo.
echo [3/3] Starting authentication server...
echo.
echo Server will run on: http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node auth-server.js
