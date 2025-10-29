const yahooFinanceService = require("../../services/yahooFinance");
const volatilityCalculator = require("../../services/volatilityCalculator");

// GET /api/stock/:symbol?start=YYYY-MM-DD&end=YYYY-MM-DD&method=garch
module.exports = async (req, res) => {
  try {
    const { symbol } = req.query; // Vercel dynamic route param is in query
    const { start, end, method = "garch" } = req.query;

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

    const dataWithSymbol = historicalData.map((d) => ({ ...d, symbol }));
    const volatilityAnalysis = volatilityCalculator.analyzeVolatility(
      dataWithSymbol,
      method
    );

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        startDate: historicalData[0].date,
        endDate: historicalData[historicalData.length - 1].date,
        dataPoints: historicalData.length,
        volatilityAnalysis,
      },
    });
  } catch (error) {
    console.error("Error in /api/stock/[symbol]", error);
    res.status(500).json({ error: "Failed to fetch stock data", message: error.message });
  }
};


