-- Supabase Database Schema for Stock Volatility App
-- Run this in your Supabase SQL Editor

-- Drop table if exists (careful in production!)
-- DROP TABLE IF EXISTS stock_snapshots;

-- Create stock_snapshots table
CREATE TABLE IF NOT EXISTS stock_snapshots (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  snapshot_time VARCHAR(20) NOT NULL CHECK (snapshot_time IN ('market_close', 'after_hours')),
  snapshot_date DATE NOT NULL,
  price_data JSONB NOT NULL,
  volatility_metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_snapshot UNIQUE(symbol, snapshot_date, snapshot_time)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_symbol_date ON stock_snapshots(symbol, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshot_date ON stock_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshot_time ON stock_snapshots(snapshot_time);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_stock_snapshots_updated_at
    BEFORE UPDATE ON stock_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional, for multi-user scenarios)
-- ALTER TABLE stock_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access (adjust as needed)
-- CREATE POLICY "Allow public read access" ON stock_snapshots
--     FOR SELECT USING (true);

-- Create policy to allow insert/update from service role
-- CREATE POLICY "Allow service role insert" ON stock_snapshots
--     FOR INSERT WITH CHECK (true);

-- Sample query to verify data
-- SELECT 
--   symbol, 
--   snapshot_date, 
--   snapshot_time,
--   volatility_metrics->>'annualized_volatility' as volatility,
--   created_at
-- FROM stock_snapshots
-- ORDER BY snapshot_date DESC, symbol
-- LIMIT 10;

-- Query to compare 4pm vs 6:45pm for a specific stock and date
-- SELECT 
--   symbol,
--   snapshot_date,
--   snapshot_time,
--   volatility_metrics->>'current_price' as price,
--   volatility_metrics->>'annualized_volatility' as volatility
-- FROM stock_snapshots
-- WHERE symbol = 'AAPL' AND snapshot_date = '2025-10-28'
-- ORDER BY snapshot_time;

