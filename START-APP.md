# 🚀 Quick Start Instructions

## ✅ The Easy Way (Recommended)

Just **double-click** this file:
```
start-all.cmd
```

It will open 3 terminal windows for:
1. **Python Data Service** (port 5001) - Fetches stock data using yfinance
2. **Node.js Backend** (port 5001) - API server
3. **React Frontend** (port 3000) - Web interface

Your browser will automatically open at http://localhost:3000

---

## 📝 Manual Start (If you prefer)

### Terminal 1: Start Python Data Service
```bash
cd backend/python-data-service
pip install -r requirements.txt
python server.py
```

Wait for: `🐍 Starting Python yfinance Data Service on port 5001`

### Terminal 2: Start Node.js Backend
```bash
cd backend
npm start
```

Wait for: `🚀 Stock Volatility API Server running on port 5000`

### Terminal 3: Start React Frontend
```bash
cd frontend
npm start
```

Browser opens automatically at http://localhost:3000

---

## ❓ Troubleshooting

### "Port already in use" error

**Kill processes on ports:**
```powershell
# Find process on port 5000
netstat -ano | findstr :5000
# Kill it (replace PID with actual number)
taskkill /PID <PID> /F

# Find process on port 5001
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

### "Python not found"

Install Python from https://python.org (Python 3.8+)

### "pip not found"

Python should come with pip. Try:
```bash
python -m pip install -r requirements.txt
```

---

## 🎯 Using the App

1. Search for a stock (e.g., "AAPL", "TSLA", "GOOGL")
2. Select it from the dropdown
3. Choose a date range (default: 6 months)
4. Click "Analyze Volatility"
5. View the charts and metrics!

**Compare stocks:** Add multiple stocks before clicking "Analyze Volatility"

**Change model:** Select GARCH, EWMA, or Rolling volatility

---

## 🛑 Stopping the App

Close all 3 terminal windows, or press `Ctrl+C` in each one.

---

## 💡 Why Python Service?

Yahoo Finance was blocking the Node.js library with "Unauthorized" errors. The Python `yfinance` library is more reliable and actively maintained. This hybrid approach gives you the best of both worlds!

