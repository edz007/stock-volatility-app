const yahooFinanceService = require("../services/yahooFinance");
const volatilityCalculator = require("../services/volatilityCalculator");

// POST /api/volatility  { symbols: [], start, end, method }
module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { symbols, start, end, method = "garch" } = req.body || {};

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: "Symbols array is required" });
    }
    if (symbols.length > 5) {
      return res.status(400).json({ error: "Maximum 5 symbols allowed" });
    }

    const endDate = end ? new Date(end) : new Date();
    const startDate = start
      ? new Date(start)
      : new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);

    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const historicalData = await yahooFinanceService.getHistoricalData(
            symbol,
            startDate,
            endDate
          );
          const dataWithSymbol = historicalData.map((d) => ({ ...d, symbol }));
          const volatilityAnalysis = volatilityCalculator.analyzeVolatility(
            dataWithSymbol,
            method
          );
          return { symbol: symbol.toUpperCase(), success: true, volatilityAnalysis };
        } catch (error) {
          return { symbol: symbol.toUpperCase(), success: false, error: error.message };
        }
      })
    );

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error in /api/volatility", error);
    res.status(500).json({ error: "Failed to calculate volatility", message: error.message });
  }
};


