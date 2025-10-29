# 🚀 Manual Start Instructions

## ⚠️ Current Status
Your **Node.js backend** is already running on port 5000. You need to:
1. **Stop it first** (Ctrl+C in its terminal)
2. **Start the Python service** first (port 5001)
3. **Restart the Node.js backend** 

---

## 📋 Step-by-Step:

### Step 1: Stop Current Backend Server
**In your current terminal where the server is running:**
1. Press `Ctrl + C` to stop it
2. Keep this terminal open

### Step 2: Start Python Data Service
**Open a NEW PowerShell terminal** and run:
```powershell
cd C:\stock-volatility-app\backend\python-data-service
python -m pip install flask flask-cors yfinance pandas
python server.py
```

**Wait for:**
```
🐍 Starting Python yfinance Data Service on port 5001
```

**Keep this window open!**

### Step 3: Restart Node.js Backend
**In your original terminal** (after stopping with Ctrl+C):
```powershell
cd C:\stock-volatility-app\backend
npm start
```

**Wait for:**
```
🚀 Stock Volatility API Server running on port 5000
```

### Step 4: Use the App
Go to your browser at **http://localhost:3000** and try searching for "AAPL"

---

## ✅ You Should Have 3 Terminals Running:
1. **Python Service** (port 5001) - Fetches stock data via yfinance
2. **Node.js Backend** (port 5000) - Your API server  
3. **React Frontend** (port 3000) - Your web app

Keep all 3 open while using the app!

---

## 💡 Why This Approach?

Yahoo Finance's Node.js library (`yahoo-finance2`) was giving "Unauthorized" errors. The Python `yfinance` library is more reliable and doesn't have these authentication issues.

