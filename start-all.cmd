@echo off
echo ================================================
echo Stock Volatility App - Starting All Services
echo ================================================
echo.
echo This will open 3 terminal windows:
echo 1. Python Data Service (port 5001)
echo 2. Node.js Backend API (port 5000)
echo 3. React Frontend (port 3000)
echo.
pause

REM Start Python service
echo Starting Python Data Service...
start "Python Data Service" cmd /k "cd backend\python-data-service && pip install -r requirements.txt && python server.py"

REM Wait a bit for Python service to start
timeout /t 5 /nobreak

REM Start Node backend
echo Starting Node.js Backend...
start "Node.js Backend" cmd /k "cd backend && npm start"

REM Wait a bit for backend to start
timeout /t 3 /nobreak

REM Start React frontend
echo Starting React Frontend...
start "React Frontend" cmd /k "cd frontend && npm start"

echo.
echo ================================================
echo All services are starting!
echo ================================================
echo.
echo Python Service: http://localhost:5001
echo Backend API: http://localhost:5000
echo Frontend App: http://localhost:3000
echo.
echo Keep all windows open while using the app!
echo ================================================

