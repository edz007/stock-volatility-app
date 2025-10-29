#!/usr/bin/env python3
"""
Simple Flask API to fetch stock data using yfinance
This works around Yahoo Finance authentication issues
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
from datetime import datetime, timedelta
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
        
        # Fetch data using yfinance
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date, end=end_date, interval='1d')
        
        if df.empty:
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
                'adjClose': float(row['Close'])  # yfinance already returns adjusted close
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
        ticker = yf.Ticker(query.upper())
        info = ticker.info
        
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
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
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
    print('🐍 Starting Python yfinance Data Service on port 5001')
    print('📊 API: http://localhost:5001')
    print('❤️  Health: http://localhost:5001/health\n')
    app.run(host='0.0.0.0', port=5001, debug=False)

