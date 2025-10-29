# Stock Volatility App - Complete Setup Guide

## Overview

This application analyzes stock volatility using GARCH models with two deployment options:
1. **Real-time mode**: Fetch data directly from Yahoo Finance API when users request
2. **Cron mode** (Recommended for daily snapshots): Python collector stores data at 4pm and 6:45pm EST in Supabase

## Prerequisites

- Node.js (v14 or higher)
- Python 3.7+ (for data collector)
- Supabase account (free tier available) - only needed for cron mode

## Quick Start (Real-time Mode)

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend will run on http://localhost:5000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will run on http://localhost:3000

### 3. Test the Application

1. Open http://localhost:3000 in your browser
2. Search for a stock (e.g., "AAPL", "Tesla")
3. Select a date range
4. Click "Analyze Volatility"

## Advanced Setup (Cron Mode with Supabase)

For daily snapshots at 4pm and 6:45pm EST to compare intraday volatility changes:

### 1. Set Up Supabase

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to the SQL Editor and run the schema:

```sql
-- Copy from database/schema.sql
CREATE TABLE stock_snapshots (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  snapshot_time VARCHAR(20) NOT NULL,
  snapshot_date DATE NOT NULL,
  price_data JSONB NOT NULL,
  volatility_metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, snapshot_date, snapshot_time)
);

CREATE INDEX idx_symbol_date ON stock_snapshots(symbol, snapshot_date DESC);
```

4. Get your credentials:
   - Go to Project Settings → API
   - Copy `Project URL` and `anon public` key

### 2. Configure Data Collector

```bash
cd data-collector

# Create .env file
cat > .env << EOF
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
STOCK_SYMBOLS=AAPL,GOOGL,MSFT,AMZN,TSLA
TIMEZONE=America/New_York
EOF

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Test Manual Data Collection

```bash
# Test market close collection
python collector.py --time=close

# Test after-hours collection
python collector.py --time=afterhours
```

### 4. Set Up Automated Collection

#### On Linux/Mac:

```bash
chmod +x cron_setup.sh
./cron_setup.sh
```

#### On Windows:

1. Open Task Scheduler
2. Create two tasks:

**Task 1: Market Close (4:00 PM EST)**
- Name: Stock Data - Market Close
- Trigger: Daily at 4:00 PM, Monday-Friday
- Action: `python C:\stock-volatility-app\data-collector\collector.py --time=close`

**Task 2: After Hours (6:45 PM EST)**
- Name: Stock Data - After Hours
- Trigger: Daily at 6:45 PM, Monday-Friday
- Action: `python C:\stock-volatility-app\data-collector\collector.py --time=afterhours`

### 5. Modify Backend to Use Supabase (Optional)

If you want the web app to query Supabase for comparison data:

```bash
cd backend
npm install @supabase/supabase-js
```

Add to `backend/.env`:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

## Application Features

### Real-time Analysis
- Search and select up to 5 stocks
- Choose date range (1 month to 5 years)
- Three volatility models:
  - **GARCH(1,1)**: Industry-standard model
  - **EWMA**: Exponentially weighted moving average
  - **Rolling**: Simple rolling window

### Visualizations
- Interactive price charts with zoom/pan
- Volatility time series
- Multi-stock comparison overlay
- Key metrics dashboard

### Metrics Displayed
- Current annualized volatility
- Mean return (annualized)
- Standard deviation
- Volatility range (min/max)
- GARCH parameters (ω, α, β)

## API Endpoints

### Backend API (http://localhost:5000/api)

```
GET  /api/stock/:symbol?start=YYYY-MM-DD&end=YYYY-MM-DD&method=garch
POST /api/volatility
     Body: { symbols: ['AAPL', 'GOOGL'], start, end, method }
GET  /api/search/:query
GET  /api/quote/:symbol
GET  /health
```

## Environment Variables

### Backend (.env)
```
PORT=5000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Data Collector (.env)
```
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
STOCK_SYMBOLS=AAPL,GOOGL,MSFT,AMZN,TSLA
TIMEZONE=America/New_York
```

## Troubleshooting

### Backend fails to start
- Ensure port 5000 is not in use
- Check Node.js version: `node --version` (should be 14+)
- Try: `cd backend && npm install --force`

### Frontend can't connect to backend
- Verify backend is running on http://localhost:5000
- Check CORS is enabled in backend
- Clear browser cache

### Yahoo Finance API errors
- Some symbols might not have data for the selected date range
- Try a different date range or symbol
- Yahoo Finance may have rate limits

### Python collector errors
- Verify Supabase credentials are correct
- Check internet connection
- Ensure Python packages are installed: `pip list`

### Cron jobs not running
- Check cron logs: `tail -f data-collector/logs/*.log`
- Verify timezone settings
- Test manual run first

## Production Deployment

### Frontend (Vercel/Netlify)
1. Update `REACT_APP_API_URL` to your backend URL
2. Build: `npm run build`
3. Deploy the `build` folder

### Backend (Heroku/Railway/DigitalOcean)
1. Set environment variables
2. Deploy from `backend` directory

### Data Collector (Any server with cron)
1. Set up Python environment
2. Configure .env file
3. Set up cron jobs or Task Scheduler

## Performance Tips

1. **Limit date ranges**: Smaller ranges = faster calculations
2. **Use EWMA for speed**: GARCH is more accurate but slower
3. **Cache results**: Consider adding Redis for frequently requested stocks
4. **Rate limiting**: Yahoo Finance may throttle excessive requests

## License

ISC

## Support

For issues, please check the logs:
- Backend: Console output
- Frontend: Browser console (F12)
- Collector: `data-collector/logs/`

