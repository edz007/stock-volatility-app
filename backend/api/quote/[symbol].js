const yahooFinanceService = require("../../services/yahooFinance");

// GET /api/quote/:symbol
module.exports = async (req, res) => {
  try {
    const { symbol } = req.query; // dynamic segment
    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required" });
    }

    const quote = await yahooFinanceService.getQuote(symbol);
    res.json({ success: true, data: quote });
  } catch (error) {
    console.error("Error in /api/quote/[symbol]", error);
    res.status(500).json({ error: "Failed to fetch quote", message: error.message });
  }
};


