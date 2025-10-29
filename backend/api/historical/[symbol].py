import json
import yfinance as yf
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

            if not end:
                end = datetime.utcnow().strftime("%Y-%m-%d")
            if not start:
                start = (datetime.utcnow() - timedelta(days=180)).strftime("%Y-%m-%d")

            df = yf.Ticker(symbol).history(start=start, end=end, interval="1d")
            if df.empty:
                return self._write_json(404, {"error": f"No data for {symbol}"})

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
        except Exception as e:
            return self._write_json(500, {"error": str(e)})


