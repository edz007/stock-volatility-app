import yfinance as yf
from datetime import datetime, timedelta


def handler(req, res):
    # CORS headers
    res.set_header("Access-Control-Allow-Origin", "*")
    res.set_header("Access-Control-Allow-Methods", "GET,OPTIONS")
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    if req.method == "OPTIONS":
        return res.status(200).send("")

    symbol = req.query.get("symbol")
    start = req.query.get("start")
    end = req.query.get("end")

    if not symbol:
        return res.status(400).json({"error": "Symbol is required"})

    try:
        if not end:
            end = datetime.utcnow().strftime("%Y-%m-%d")
        if not start:
            start = (datetime.utcnow() - timedelta(days=180)).strftime("%Y-%m-%d")

        df = yf.Ticker(symbol).history(start=start, end=end, interval="1d")
        if df.empty:
            return res.status(404).json({"error": f"No data for {symbol}"})

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

        return res.status(200).json({"success": True, "data": data})
    except Exception as e:
        return res.status(500).json({"error": str(e)})


