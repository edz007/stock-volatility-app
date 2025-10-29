import json
import os
import yfinance as yf
import requests
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs


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

            # 1) Primary: Try Finnhub first if API key is present
            api_key = os.getenv("FINNHUB_API_KEY")
            if api_key:
                try:
                    from_ts = int(start_date.timestamp())
                    to_ts = int(end_date.timestamp())
                    url = f"https://finnhub.io/api/v1/stock/candle?symbol={symbol}&resolution=D&from={from_ts}&to={to_ts}&token={api_key}"
                    r = requests.get(url, timeout=20)
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
                        return self._write_json(200, {"success": True, "data": data})
                except Exception as fe:
                    pass  # Fall through to yfinance fallback

            # 2) Fallback: Try yfinance if Finnhub failed or no API key
            yf_start = start_date.strftime("%Y-%m-%d")
            yf_end = (end_date + timedelta(days=1)).strftime("%Y-%m-%d")  # yfinance end is exclusive
            
            tmp_cache = "/tmp/py-yfinance"
            try:
                os.makedirs(tmp_cache, exist_ok=True)
                if hasattr(yf, "set_tz_cache_location"):
                    yf.set_tz_cache_location(tmp_cache)
                if hasattr(yf, "set_cookie_cache_location"):
                    yf.set_cookie_cache_location(tmp_cache)
            except Exception:
                pass

            try:
                df = yf.Ticker(symbol).history(start=yf_start, end=yf_end, interval="1d")
                if not df.empty:
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
            except Exception as ye:
                pass

            return self._write_json(200, {"success": True, "data": []})
        except Exception as e:
            return self._write_json(500, {"error": str(e)})


