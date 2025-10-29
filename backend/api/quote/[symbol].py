import json
import os
import yfinance as yf
import requests
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse


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
            parts = parsed.path.strip("/").split("/")
            symbol = parts[-1] if parts else None
            if not symbol:
                return self._write_json(400, {"error": "Symbol is required"})

            try:
                q = yf.Ticker(symbol).info
                data = {
                    "symbol": q.get("symbol", symbol.upper()),
                    "name": q.get("longName", q.get("shortName", symbol)),
                    "price": q.get("currentPrice", q.get("regularMarketPrice", 0)),
                    "change": q.get("regularMarketChange", 0),
                    "changePercent": q.get("regularMarketChangePercent", 0),
                    "volume": q.get("volume", 0),
                    "marketCap": q.get("marketCap", 0),
                    "fiftyTwoWeekHigh": q.get("fiftyTwoWeekHigh", 0),
                    "fiftyTwoWeekLow": q.get("fiftyTwoWeekLow", 0),
                }
                return self._write_json(200, {"success": True, "data": data})
            except Exception as e:
                # Fallback to Finnhub if available (handles Yahoo rate limits 429)
                api_key = os.getenv("FINNHUB_API_KEY")
                if not api_key:
                    return self._write_json(500, {"error": str(e)})
                try:
                    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={api_key}"
                    r = requests.get(url, timeout=10)
                    r.raise_for_status()
                    d = r.json()
                    if d and "c" in d:
                        data = {
                            "symbol": symbol.upper(),
                            "name": symbol.upper(),
                            "price": d.get("c", 0),
                            "change": d.get("d", 0),
                            "changePercent": d.get("dp", 0),
                            "volume": d.get("v", 0),
                            "marketCap": None,
                            "fiftyTwoWeekHigh": d.get("h", 0),
                            "fiftyTwoWeekLow": d.get("l", 0),
                        }
                        return self._write_json(200, {"success": True, "data": data})
                    return self._write_json(502, {"error": "Finnhub quote unavailable"})
                except Exception as fe:
                    return self._write_json(500, {"error": str(fe)})
        except Exception as e:
            return self._write_json(500, {"error": str(e)})
