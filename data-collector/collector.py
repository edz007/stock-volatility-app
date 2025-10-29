#!/usr/bin/env python3
"""
Stock Data Collector with Supabase Integration
Fetches stock data from Yahoo Finance and stores in Supabase
Run with: python collector.py --time=close|afterhours
"""

import argparse
import os
import sys
from datetime import datetime, timedelta
import pytz
import yfinance as yf
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Supabase setup
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
STOCK_SYMBOLS = os.getenv('STOCK_SYMBOLS', 'AAPL,GOOGL,MSFT').split(',')
TIMEZONE = os.getenv('TIMEZONE', 'America/New_York')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_historical_data(symbol, days_back=180):
    """
    Fetch historical data for a stock symbol
    
    Args:
        symbol: Stock ticker symbol
        days_back: Number of days of historical data to fetch
    
    Returns:
        List of dictionaries with OHLCV data
    """
    try:
        stock = yf.Ticker(symbol)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Fetch historical data
        hist = stock.history(start=start_date, end=end_date)
        
        if hist.empty:
            print(f"Warning: No data found for {symbol}")
            return []
        
        # Convert to list of dictionaries
        data = []
        for date, row in hist.iterrows():
            data.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume']),
                'adjClose': float(row['Close'])
            })
        
        return data
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return []


def calculate_simple_volatility(price_data):
    """
    Calculate simple volatility metrics
    
    Args:
        price_data: List of price dictionaries
    
    Returns:
        Dictionary with volatility metrics
    """
    if len(price_data) < 2:
        return {}
    
    # Calculate returns
    returns = []
    for i in range(1, len(price_data)):
        ret = (price_data[i]['close'] - price_data[i-1]['close']) / price_data[i-1]['close']
        returns.append(ret)
    
    # Calculate statistics
    mean_return = sum(returns) / len(returns) if returns else 0
    variance = sum((r - mean_return) ** 2 for r in returns) / len(returns) if returns else 0
    std_dev = variance ** 0.5
    
    # Annualized metrics (252 trading days)
    annualized_volatility = std_dev * (252 ** 0.5)
    annualized_return = mean_return * 252
    
    return {
        'mean_return': mean_return,
        'std_dev': std_dev,
        'annualized_volatility': annualized_volatility,
        'annualized_return': annualized_return,
        'current_price': price_data[-1]['close'],
        'min_price': min(d['close'] for d in price_data),
        'max_price': max(d['close'] for d in price_data),
        'data_points': len(price_data)
    }


def store_snapshot(symbol, snapshot_time, price_data, volatility_metrics):
    """
    Store stock snapshot in Supabase
    
    Args:
        symbol: Stock ticker symbol
        snapshot_time: 'market_close' or 'after_hours'
        price_data: Historical price data
        volatility_metrics: Calculated volatility metrics
    """
    try:
        est_tz = pytz.timezone(TIMEZONE)
        snapshot_date = datetime.now(est_tz).date().isoformat()
        
        # Prepare data for insertion
        data = {
            'symbol': symbol.upper(),
            'snapshot_time': snapshot_time,
            'snapshot_date': snapshot_date,
            'price_data': price_data,
            'volatility_metrics': volatility_metrics
        }
        
        # Upsert (update if exists, insert if not)
        result = supabase.table('stock_snapshots').upsert(
            data,
            on_conflict='symbol,snapshot_date,snapshot_time'
        ).execute()
        
        print(f"✓ Stored {symbol} {snapshot_time} snapshot for {snapshot_date}")
        return True
    except Exception as e:
        print(f"✗ Error storing {symbol} snapshot: {e}")
        return False


def collect_data(snapshot_time):
    """
    Main function to collect and store stock data
    
    Args:
        snapshot_time: 'market_close' or 'after_hours'
    """
    print(f"\n{'='*60}")
    print(f"Stock Data Collection - {snapshot_time.upper()}")
    print(f"Timestamp: {datetime.now(pytz.timezone(TIMEZONE)).strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print(f"{'='*60}\n")
    
    success_count = 0
    fail_count = 0
    
    for symbol in STOCK_SYMBOLS:
        symbol = symbol.strip()
        print(f"Processing {symbol}...")
        
        # Fetch historical data
        price_data = get_historical_data(symbol, days_back=180)
        
        if not price_data:
            print(f"✗ Skipping {symbol} - no data available")
            fail_count += 1
            continue
        
        # Calculate volatility
        volatility_metrics = calculate_simple_volatility(price_data)
        
        # Store in Supabase
        if store_snapshot(symbol, snapshot_time, price_data, volatility_metrics):
            success_count += 1
        else:
            fail_count += 1
    
    print(f"\n{'='*60}")
    print(f"Collection Complete")
    print(f"Success: {success_count} | Failed: {fail_count}")
    print(f"{'='*60}\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Collect stock data and store in Supabase')
    parser.add_argument(
        '--time',
        choices=['close', 'afterhours'],
        required=True,
        help='Snapshot time: close (4pm) or afterhours (6:45pm)'
    )
    
    args = parser.parse_args()
    
    # Map argument to snapshot_time value
    snapshot_time = 'market_close' if args.time == 'close' else 'after_hours'
    
    collect_data(snapshot_time)


if __name__ == '__main__':
    main()

