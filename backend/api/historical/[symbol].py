import json
import os
import logging
import yfinance as yf
import requests
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Suppress yfinance cache warnings
yf_logger = logging.getLogger('yfinance')
yf_logger.setLevel(logging.WARNING)


class handler(BaseHTTPRequestHandler):
    def _write_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            qs = parse_qs(parsed.query)
            parts = parsed.path.strip("/").split("/")
            # Expect .../api/historical/<symbol>
            symbol = parts[-1] if parts else None

            if not symbol:
                return self._write_json(400, {"error": "Symbol is required"})

            start = (qs.get("start", [None])[0])
            end = (qs.get("end", [None])[0])

            # Defaults
            today = datetime.utcnow().date()
            if not end:
                end_date = today
            else:
                try:
                    end_date = datetime.strptime(end, "%Y-%m-%d").date()
                except Exception:
                    return self._write_json(400, {"error": "Invalid end date format. Use YYYY-MM-DD"})

            if not start:
                start_date = today - timedelta(days=180)
            else:
                try:
                    start_date = datetime.strptime(start, "%Y-%m-%d").date()
                except Exception:
                    return self._write_json(400, {"error": "Invalid start date format. Use YYYY-MM-DD"})

            # Clamp future end dates and ensure start < end
            if end_date > today:
                end_date = today
            if start_date >= end_date:
                start_date = max(end_date - timedelta(days=7), today - timedelta(days=365))

            # 1) Primary: Try yfinance first
            print(f"[Historical] Trying yfinance first for {symbol}")
            yf_start = start_date.strftime("%Y-%m-%d")
            yf_end = (end_date + timedelta(days=1)).strftime("%Y-%m-%d")  # yfinance end is exclusive
            
            # Configure yfinance cache to use writable /tmp location
            tmp_cache = "/tmp/py-yfinance"
            try:
                os.makedirs(tmp_cache, exist_ok=True)
                # Set cache locations before creating Ticker to avoid read-only filesystem errors
                if hasattr(yf, "set_tz_cache_location"):
                    yf.set_tz_cache_location(tmp_cache)
                if hasattr(yf, "set_cookie_cache_location"):
                    yf.set_cookie_cache_location(tmp_cache)
                print(f"[Historical] yfinance cache configured to {tmp_cache}")
            except Exception as cache_err:
                print(f"[Historical] Warning: Could not configure yfinance cache: {cache_err}")

            try:
                # Disable yfinance cache by setting env vars (works before Ticker creation)
                os.environ["YFINANCE_CACHE_DIR"] = tmp_cache
                os.environ["YFINANCE_NO_CACHE"] = "1"
                
                # Create ticker - cache warnings will be suppressed since we set cache location
                ticker = yf.Ticker(symbol)
                # Set User-Agent only if session exists
                if ticker.session is not None:
                    ticker.session.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                
                df = ticker.history(start=yf_start, end=yf_end, interval="1d")
                if not df.empty and len(df) > 0:
                    print(f"[Historical] yfinance successful: {len(df)} data points")
                    data = []
                    for idx, row in df.iterrows():
                        data.append({
                            "date": idx.strftime("%Y-%m-%d"),
                            "open": float(row["Open"]),
                            "high": float(row["High"]),
                            "low": float(row["Low"]),
                            "close": float(row["Close"]),
                            "volume": int(row["Volume"] or 0),
                            "adjClose": float(row["Close"]),
                        })
                    return self._write_json(200, {"success": True, "data": data})
                else:
                    print(f"[Historical] yfinance returned empty DataFrame, falling back to Finnhub")
            except Exception as ye:
                print(f"[Historical] yfinance failed: {str(ye)}, falling back to Finnhub")

            # Fallback: Try Finnhub if yfinance failed or returned empty
            api_key = os.getenv("FINNHUB_API_KEY")
            if api_key:
                try:
                    print(f"[Historical] Trying Finnhub as fallback for {symbol}")
                    # Convert date objects to datetime for timestamp()
                    start_dt = datetime.combine(start_date, datetime.min.time())
                    end_dt = datetime.combine(end_date, datetime.min.time())
                    from_ts = int(start_dt.timestamp())
                    to_ts = int(end_dt.timestamp())
                    url = f"https://finnhub.io/api/v1/stock/candle?symbol={symbol}&resolution=D&from={from_ts}&to={to_ts}&token={api_key}"
                    r = requests.get(url, timeout=20)
                    if r.status_code == 403:
                        print(f"[Historical] Finnhub 403 Forbidden - check API key validity and free tier limits")
                    else:
                        r.raise_for_status()
                        d = r.json()
                        if d and d.get("s") == "ok" and "t" in d:
                            data = []
                            for i, t in enumerate(d["t"]):
                                data.append({
                                    "date": datetime.fromtimestamp(t).strftime("%Y-%m-%d"),
                                    "open": float(d["o"][i]),
                                    "high": float(d["h"][i]),
                                    "low": float(d["l"][i]),
                                    "close": float(d["c"][i]),
                                    "volume": int(d["v"][i] if i < len(d["v"]) else 0),
                                    "adjClose": float(d["c"][i]),
                                })
                            print(f"[Historical] Finnhub successful: {len(data)} data points")
                            return self._write_json(200, {"success": True, "data": data})
                except Exception as fe:
                    print(f"[Historical] Finnhub also failed: {str(fe)}")

            return self._write_json(200, {"success": True, "data": []})
        except Exception as e:
            return self._write_json(500, {"error": str(e)})


