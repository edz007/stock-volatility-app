#!/usr/bin/env python3
"""
Simple Flask API to fetch stock data using yfinance
This works around Yahoo Finance authentication issues
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import logging
import os

# Disable yfinance caching to avoid SQLite issues on Railway
os.environ['YF_CACHE_DISABLE'] = '1'
# Prevent yfinance from trying to use cache
os.environ['YFINANCE_CACHE_DIR'] = '/tmp'
os.environ['YFINANCE_NO_CACHE'] = '1'

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Monkey patch to disable cache module if it still tries to load
try:
    import sys
    # Replace cache module with a dummy before yfinance imports it
    class DummyCache:
        pass
    sys.modules['yfinance.cache'] = DummyCache()
except:
    pass


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'OK', 'service': 'yfinance-data-service'})


@app.route('/historical/<symbol>', methods=['GET'])
def get_historical(symbol):
    """Get historical stock data"""
    try:
        # Get query parameters
        start_date = request.args.get('start')
        end_date = request.args.get('end')
        
        # Set defaults if not provided
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        if not start_date:
            start_date = (datetime.now() - timedelta(days=180)).strftime('%Y-%m-%d')
        
        logger.info(f"Fetching {symbol} from {start_date} to {end_date}")
        
        # Fetch data using yfinance - handle SQLite cache errors gracefully
        # Convert dates to datetime objects
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        
        df = None
        try:
            # Try with Ticker first (normal method)
            ticker = yf.Ticker(symbol)
            df = ticker.history(start=start_dt, end=end_dt, interval='1d')
        except Exception as ticker_error:
            if 'SQLite' in str(ticker_error) or 'driver' in str(ticker_error).lower():
                # SQLite error - use download function as fallback
                logger.warning(f"Ticker cache error for {symbol}, using download function: {str(ticker_error)}")
                try:
                    # Use download function which bypasses some cache
                    df_download = yf.download(symbol, start=start_dt, end=end_dt, interval='1d', progress=False, show_errors=False)
                    # Flatten MultiIndex columns if present
                    if isinstance(df_download.columns, pd.MultiIndex):
                        df_download.columns = df_download.columns.droplevel(1)
                    df = df_download
                except Exception as download_error:
                    logger.error(f"Download function also failed for {symbol}: {str(download_error)}")
                    raise ticker_error  # Raise original error
            else:
                raise ticker_error
        
        if df is None or df.empty:
            return jsonify({'error': f'No data found for {symbol}'}), 404
        
        # Convert to list of dictionaries
        data = []
        for date, row in df.iterrows():
            data.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume']),
                'adjClose': float(row['Adj Close'] if 'Adj Close' in row else row['Close'])
            })
        
        logger.info(f"✓ Retrieved {len(data)} data points for {symbol}")
        
        return jsonify({
            'success': True,
            'symbol': symbol.upper(),
            'data': data
        })
        
    except Exception as e:
        logger.error(f"Error fetching {symbol}: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/search/<query>', methods=['GET'])
def search_symbols(query):
    """Search for stock symbols"""
    try:
        # yfinance doesn't have a direct search, but we can try to get info
        # For now, return a simple match if it's a valid ticker
        try:
            ticker = yf.Ticker(query.upper())
            info = ticker.info
        except Exception as ticker_error:
            if 'SQLite' in str(ticker_error) or 'driver' in str(ticker_error).lower():
                # SQLite error - try download to verify symbol exists
                logger.warning(f"Ticker cache error for search {query}, using download to verify")
                try:
                    test_data = yf.download(query.upper(), period='5d', progress=False, show_errors=False)
                    if test_data.empty:
                        return jsonify({'success': True, 'data': []})
                    # Flatten MultiIndex columns if present
                    if isinstance(test_data.columns, pd.MultiIndex):
                        test_data.columns = test_data.columns.droplevel(1)
                    # Build minimal info from download
                    info = {
                        'symbol': query.upper(),
                        'longName': query.upper(),
                        'shortName': query.upper(),
                        'exchange': 'N/A'
                    }
                except:
                    return jsonify({'success': True, 'data': []})
            else:
                raise ticker_error
        
        if 'symbol' in info:
            results = [{
                'symbol': info.get('symbol', query.upper()),
                'name': info.get('longName', info.get('shortName', query.upper())),
                'exchange': info.get('exchange', 'N/A'),
                'type': 'EQUITY'
            }]
            return jsonify({'success': True, 'data': results})
        else:
            return jsonify({'success': True, 'data': []})
            
    except Exception as e:
        logger.error(f"Error searching for {query}: {str(e)}")
        # Return empty results instead of error for search
        return jsonify({'success': True, 'data': []})


@app.route('/quote/<symbol>', methods=['GET'])
def get_quote(symbol):
    """Get current quote for a symbol"""
    try:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
        except Exception as ticker_error:
            if 'SQLite' in str(ticker_error) or 'driver' in str(ticker_error).lower():
                # Retry with download to get quote data
                logger.warning(f"Ticker cache error for quote {symbol}, using alternative method")
                # Use download to get recent data and extract quote info
                recent = yf.download(symbol, period='1d', progress=False, show_errors=False)
                if recent.empty:
                    raise Exception(f"No data available for {symbol}")
                # Flatten MultiIndex columns if present
                if isinstance(recent.columns, pd.MultiIndex):
                    recent.columns = recent.columns.droplevel(1)
                # Build minimal quote from download data
                last_row = recent.iloc[-1]
                info = {
                    'symbol': symbol.upper(),
                    'currentPrice': float(last_row['Close']),
                    'regularMarketPrice': float(last_row['Close']),
                    'regularMarketChange': 0,
                    'regularMarketChangePercent': 0,
                    'volume': int(last_row['Volume']) if 'Volume' in last_row else 0,
                    'marketCap': 0,
                    'fiftyTwoWeekHigh': float(recent['High'].max()),
                    'fiftyTwoWeekLow': float(recent['Low'].min()),
                    'longName': symbol.upper(),
                    'shortName': symbol.upper()
                }
            else:
                raise ticker_error
        
        quote = {
            'symbol': info.get('symbol', symbol.upper()),
            'name': info.get('longName', info.get('shortName', symbol)),
            'price': info.get('currentPrice', info.get('regularMarketPrice', 0)),
            'change': info.get('regularMarketChange', 0),
            'changePercent': info.get('regularMarketChangePercent', 0),
            'volume': info.get('volume', 0),
            'marketCap': info.get('marketCap', 0),
            'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', 0),
            'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', 0)
        }
        
        return jsonify({'success': True, 'data': quote})
        
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f'🐍 Starting Python yfinance Data Service on port {port}')
    print(f'📊 API: http://localhost:{port}')
    print(f'❤️  Health: http://localhost:{port}/health\n')
    app.run(host='0.0.0.0', port=port, debug=False)

