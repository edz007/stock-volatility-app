import json
import yfinance as yf
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
            query = parts[-1] if parts else None
            if not query:
                return self._write_json(400, {"error": "Query is required"})

            # yfinance has limited search; attempt to get info for the provided symbol
            info = yf.Ticker(query.upper()).info
            if "symbol" in info:
                results = [{
                    "symbol": info.get("symbol", query.upper()),
                    "name": info.get("longName", info.get("shortName", query.upper())),
                    "exchange": info.get("exchange", "N/A"),
                    "type": "EQUITY",
                }]
                return self._write_json(200, {"success": True, "data": results})
            return self._write_json(200, {"success": True, "data": []})
        except Exception:
            return self._write_json(200, {"success": True, "data": []})


