# Quick Start Guide

## Get Running in 5 Minutes

### Step 1: Start Backend (Terminal 1)
```bash
cd backend
npm install
npm start
```

Wait for: `🚀 Stock Volatility API Server running on port 5000`

### Step 2: Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm start
```

Browser will open automatically at http://localhost:3000

### Step 3: Try It Out

1. **Search for a stock**: Type "AAPL" or "Tesla"
2. **Select stock**: Click on the search result
3. **Choose date range**: Click "6 Months" (default)
4. **Analyze**: Click "Analyze Volatility"

### What You'll See

- 📊 Interactive price chart
- 📈 Volatility over time
- 📉 Key metrics (current volatility, returns, etc.)
- 🔢 GARCH model parameters

### Compare Multiple Stocks

1. Search and add up to 5 stocks
2. Selected stocks appear as chips below search
3. Click "Analyze Volatility"
4. View side-by-side comparison charts

### Change Volatility Model

Try different models to see how results vary:
- **GARCH**: Most accurate, industry standard
- **EWMA**: Fast, smooth results
- **Rolling**: Simple moving window

## Common Issues

**Backend won't start?**
- Make sure port 5000 is free
- Try: `npm install --force`

**Frontend can't load data?**
- Check backend is running
- Verify http://localhost:5000/health shows OK

**No data for stock?**
- Try a different date range
- Some stocks have limited historical data

## Next Steps

- Read [SETUP-GUIDE.md](./SETUP-GUIDE.md) for Supabase integration
- Check [README.md](./README.md) for full documentation
- Set up daily data collection (see data-collector/README.md)

## Need Help?

1. Check backend logs in Terminal 1
2. Check browser console (F12) for frontend errors
3. Verify Yahoo Finance is accessible

