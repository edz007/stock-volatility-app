import yfinance as yf


def handler(req, res):
    # CORS headers
    res.set_header("Access-Control-Allow-Origin", "*")
    res.set_header("Access-Control-Allow-Methods", "GET,OPTIONS")
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    if req.method == "OPTIONS":
        return res.status(200).send("")

    symbol = req.query.get("symbol")
    if not symbol:
        return res.status(400).json({"error": "Symbol is required"})

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
        return res.status(200).json({"success": True, "data": data})
    except Exception as e:
        return res.status(500).json({"error": str(e)})


