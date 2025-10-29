import json
import os
import logging
import yfinance as yf
import requests
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse

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
            parts = parsed.path.strip("/").split("/")
            query = parts[-1] if parts else None
            if not query:
                return self._write_json(400, {"error": "Query is required"})

            # 1) Primary: Try Finnhub first if API key is present
            api_key = os.getenv("FINNHUB_API_KEY")
            if api_key:
                try:
                    url = f"https://finnhub.io/api/v1/search?q={query}&token={api_key}"
                    r = requests.get(url, timeout=10)
                    r.raise_for_status()
                    d = r.json()
                    if d and "result" in d:
                        results = []
                        for r in d["result"]:
                            results.append({
                                "symbol": r.get("symbol", query.upper()),
                                "name": r.get("description", r.get("symbol", query.upper())),
                                "exchange": r.get("exchange", "N/A"),
                                "type": r.get("type", "EQUITY"),
                            })
                        return self._write_json(200, {"success": True, "data": results})
                except Exception:
                    pass  # Fall through to yfinance fallback

            # 2) Fallback: Try yfinance if Finnhub failed or no API key
            try:
                # Configure cache location to suppress warnings
                tmp_cache = "/tmp/py-yfinance"
                try:
                    os.makedirs(tmp_cache, exist_ok=True)
                    os.environ["YFINANCE_CACHE_DIR"] = tmp_cache
                    if hasattr(yf, "set_tz_cache_location"):
                        yf.set_tz_cache_location(tmp_cache)
                    if hasattr(yf, "set_cookie_cache_location"):
                        yf.set_cookie_cache_location(tmp_cache)
                except Exception:
                    pass
                
                # yfinance has limited search; attempt to get info for the provided symbol
                ticker = yf.Ticker(query.upper())
                # Set User-Agent only if session exists
                if ticker.session is not None:
                    ticker.session.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                info = ticker.info
                if "symbol" in info:
                    results = [{
                        "symbol": info.get("symbol", query.upper()),
                        "name": info.get("longName", info.get("shortName", query.upper())),
                        "exchange": info.get("exchange", "N/A"),
                        "type": "EQUITY",
                    }]
                    return self._write_json(200, {"success": True, "data": results})
            except Exception:
                pass

            return self._write_json(200, {"success": True, "data": []})
        except Exception:
            return self._write_json(200, {"success": True, "data": []})


