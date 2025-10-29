# Testing Guide

## Manual Testing Checklist

### Backend Tests

#### 1. Start Backend
```bash
cd backend
node server.js
```

Expected output:
```
🚀 Stock Volatility API Server running on port 5000
📊 API Docs: http://localhost:5000
❤️  Health check: http://localhost:5000/health
```

#### 2. Test Health Endpoint
```bash
curl http://localhost:5000/health
```

Expected: `{"status":"OK","timestamp":"..."}`

#### 3. Test Stock Data Endpoint
```bash
curl "http://localhost:5000/api/stock/AAPL?method=garch"
```

Expected: JSON with volatility analysis

#### 4. Test Search Endpoint
```bash
curl "http://localhost:5000/api/search/apple"
```

Expected: Array of stock symbols matching "apple"

#### 5. Test Multiple Stocks
```bash
curl -X POST http://localhost:5000/api/volatility \
  -H "Content-Type: application/json" \
  -d '{"symbols":["AAPL","GOOGL"],"method":"garch"}'
```

Expected: Array with volatility data for both stocks

### Frontend Tests

#### 1. Start Frontend
```bash
cd frontend
npm start
```

Browser should open at http://localhost:3000

#### 2. Test Stock Search
- Type "AAPL" in search box
- Wait for autocomplete results
- Click on a result
- Stock chip should appear below

Expected: Stock chip shows "AAPL Apple Inc."

#### 3. Test Date Range Selection
- Click each preset button (1M, 3M, 6M, 1Y, 2Y, 5Y)
- Try custom dates
- Verify dates update

Expected: Date inputs reflect selected range

#### 4. Test Single Stock Analysis
- Select "AAPL"
- Keep default 6 Months range
- Click "Analyze Volatility"
- Wait for data to load

Expected:
- Metrics card with current volatility
- Price chart
- Volatility chart
- GARCH parameters

#### 5. Test Multiple Stock Comparison
- Add 3-5 stocks (AAPL, GOOGL, MSFT)
- Click "Analyze Volatility"

Expected:
- Comparison chart with all stocks
- Summary table
- Individual metrics for each stock

#### 6. Test Volatility Methods
- Select a stock
- Click "GARCH" button
- Analyze
- Click "EWMA" button
- Analyze
- Click "Rolling" button
- Analyze

Expected: Different volatility values/patterns for each method

#### 7. Test Chart Interactions
- Hover over chart points (tooltip appears)
- Click and drag to zoom
- Use brush at bottom to pan
- Toggle between "Both", "Price Only", "Volatility Only"

Expected: Charts respond to interactions

#### 8. Test Error Handling
- Enter invalid symbol "ZZZZZZ"
- Click analyze

Expected: Error message displayed

### Data Collector Tests (Optional)

#### 1. Setup Environment
```bash
cd data-collector
pip install -r requirements.txt
```

Create `.env`:
```
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
STOCK_SYMBOLS=AAPL,GOOGL
```

#### 2. Test Collection
```bash
python collector.py --time=close
```

Expected:
```
Stock Data Collection - MARKET_CLOSE
Processing AAPL...
✓ Stored AAPL market_close snapshot
Processing GOOGL...
✓ Stored GOOGL market_close snapshot
Success: 2 | Failed: 0
```

#### 3. Verify in Supabase
- Go to Supabase dashboard
- Open Table Editor
- Check `stock_snapshots` table

Expected: New rows with today's date

## Automated Testing (Future Enhancement)

### Backend Tests
```javascript
// Example: tests/api.test.js
const request = require('supertest');
const app = require('../server');

describe('Stock API', () => {
  test('GET /health returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });

  test('GET /api/stock/:symbol returns data', async () => {
    const response = await request(app).get('/api/stock/AAPL');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Frontend Tests
```javascript
// Example: src/App.test.js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Stock Volatility Analysis/i);
  expect(headerElement).toBeInTheDocument();
});
```

## Performance Testing

### Load Test Backend
```bash
# Using Apache Bench (if installed)
ab -n 100 -c 10 http://localhost:5000/api/stock/AAPL
```

### Expected Performance
- Single stock analysis: < 2 seconds
- Multiple stocks (5): < 5 seconds
- Search: < 500ms

## Known Issues & Limitations

1. **Yahoo Finance Rate Limits**: May fail with too many requests
2. **Large Date Ranges**: 5+ years may take longer to load
3. **After-hours Data**: Some stocks lack after-hours data
4. **Symbol Search**: Some valid symbols may not appear in search

## Troubleshooting

### Backend Issues
- **Port in use**: Change PORT in backend
- **Module not found**: Run `npm install` in backend
- **Yahoo Finance timeout**: Try again or use shorter date range

### Frontend Issues
- **Blank page**: Check browser console (F12)
- **CORS errors**: Ensure backend is running
- **Charts not rendering**: Verify Recharts is installed

### Data Collector Issues
- **Import errors**: Check Python version and packages
- **Supabase errors**: Verify credentials
- **No data collected**: Check internet connection

## Success Criteria

✅ Backend starts without errors  
✅ Health endpoint returns OK  
✅ Frontend loads and displays UI  
✅ Search returns stock symbols  
✅ Single stock analysis completes  
✅ Charts render with data  
✅ Multiple stock comparison works  
✅ All three volatility methods work  
✅ Date range changes work  
✅ Responsive on mobile (if testing mobile)

## Reporting Issues

If tests fail, collect:
1. Error messages from console
2. Backend logs
3. Browser console (F12)
4. Steps to reproduce
5. Operating system and versions

