const yahooFinanceService = require("../../services/yahooFinance");

// GET /api/search/:query
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  try {
    const { query } = req.query; // dynamic segment
    if (!query || query.length < 1) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const results = await yahooFinanceService.searchSymbols(query);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error in /api/search/[query]", error);
    res.status(500).json({ error: "Failed to search symbols", message: error.message });
  }
};


