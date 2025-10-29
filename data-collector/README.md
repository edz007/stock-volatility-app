# Stock Data Collector

Python service that fetches stock data from Yahoo Finance and stores snapshots in Supabase at scheduled times (4:00 PM and 6:45 PM EST).

## Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in this directory:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Stock symbols to track (comma-separated)
STOCK_SYMBOLS=AAPL,GOOGL,MSFT,AMZN,TSLA

# Timezone
TIMEZONE=America/New_York
```

### 3. Set Up Supabase Database

Create the `stock_snapshots` table in your Supabase project:

```sql
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

## Usage

### Manual Run

```bash
# Collect market close data (4 PM)
python collector.py --time=close

# Collect after-hours data (6:45 PM)
python collector.py --time=afterhours
```

### Automated Collection (Cron Jobs)

#### Linux/Mac:

```bash
chmod +x cron_setup.sh
./cron_setup.sh
```

#### Windows (Task Scheduler):

1. Open Task Scheduler
2. Create two tasks:

**Task 1: Market Close (4:00 PM EST)**
- Trigger: Daily at 4:00 PM, Monday-Friday
- Action: `python C:\path\to\collector.py --time=close`

**Task 2: After Hours (6:45 PM EST)**
- Trigger: Daily at 6:45 PM, Monday-Friday
- Action: `python C:\path\to\collector.py --time=afterhours`

## Data Structure

Each snapshot stores:

```json
{
  "symbol": "AAPL",
  "snapshot_time": "market_close",
  "snapshot_date": "2025-10-28",
  "price_data": [
    {
      "date": "2025-10-28",
      "open": 150.00,
      "high": 152.50,
      "low": 149.00,
      "close": 151.00,
      "volume": 50000000,
      "adjClose": 151.00
    }
  ],
  "volatility_metrics": {
    "mean_return": 0.001,
    "std_dev": 0.02,
    "annualized_volatility": 0.317,
    "current_price": 151.00
  }
}
```

## Monitoring

Logs are saved to the `logs/` directory with filenames like `close_20251028.log`.

View recent logs:
```bash
tail -f logs/close_*.log
tail -f logs/afterhours_*.log
```

