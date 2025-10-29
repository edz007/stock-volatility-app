const yahooFinanceService = require("../../services/yahooFinance");

// GET /api/historical/:symbol?start=YYYY-MM-DD&end=YYYY-MM-DD
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { symbol } = req.query; // Vercel dynamic route param is in query
    const { start, end } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required" });
    }

    const endDate = end ? new Date(end) : new Date();
    const startDate = start
      ? new Date(start)
      : new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);

    const historicalData = await yahooFinanceService.getHistoricalData(
      symbol,
      startDate,
      endDate
    );

    if (!historicalData || historicalData.length === 0) {
      return res
        .status(404)
        .json({ error: `No data found for symbol ${symbol}` });
    }

    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      data: historicalData
    });
  } catch (error) {
    console.error("Error in /api/historical/[symbol]", error);
    const message = (error && error.message) ? error.message : String(error);
    res.status(500).json({ error: "Failed to fetch historical data", message });
  }
};

