@echo off
echo ========================================
echo Python yfinance Data Service
echo ========================================
echo.
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting service on port 5001...
python server.py

