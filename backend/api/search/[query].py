import yfinance as yf


def handler(req, res):
    # CORS headers
    res.set_header("Access-Control-Allow-Origin", "*")
    res.set_header("Access-Control-Allow-Methods", "GET,OPTIONS")
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    if req.method == "OPTIONS":
        return res.status(200).send("")

    query = req.query.get("query")
    if not query:
        return res.status(400).json({"error": "Query is required"})

    try:
        # yfinance has limited search; attempt to get info for the provided symbol
        t = yf.Ticker(query.upper())
        info = t.info
        if "symbol" in info:
            results = [{
                "symbol": info.get("symbol", query.upper()),
                "name": info.get("longName", info.get("shortName", query.upper())),
                "exchange": info.get("exchange", "N/A"),
                "type": "EQUITY",
            }]
            return res.status(200).json({"success": True, "data": results})
        return res.status(200).json({"success": True, "data": []})
    except Exception:
        # Return empty results on error for search
        return res.status(200).json({"success": True, "data": []})


