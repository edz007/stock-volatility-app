@echo off
echo ========================================
echo Stock Volatility Backend Server
echo ========================================
echo.
cd backend
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting server on port 5000...
call npm start

