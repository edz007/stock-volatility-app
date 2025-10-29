const express = require('express');
const router = express.Router();
const yahooFinanceService = require('../services/yahooFinance');
const volatilityCalculator = require('../services/volatilityCalculator');

/**
 * GET /api/stock/:symbol
 * Get historical stock data and calculate volatility
 * Query params: start, end, method (garch, ewma, rolling)
 */
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { start, end, method = 'garch' } = req.query;

    // Validate inputs
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Set default date range (last 6 months if not provided)
    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Fetch historical data
    const historicalData = await yahooFinanceService.getHistoricalData(symbol, startDate, endDate);

    if (!historicalData || historicalData.length === 0) {
      return res.status(404).json({ error: `No data found for symbol ${symbol}` });
    }

    // Add symbol to data for volatility calculation
    const dataWithSymbol = historicalData.map(d => ({ ...d, symbol }));

    // Calculate volatility
    const volatilityAnalysis = volatilityCalculator.analyzeVolatility(dataWithSymbol, method);

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        startDate: historicalData[0].date,
        endDate: historicalData[historicalData.length - 1].date,
        dataPoints: historicalData.length,
        volatilityAnalysis
      }
    });
  } catch (error) {
    console.error('Error in /api/stock/:symbol:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stock data', 
      message: error.message 
    });
  }
});

/**
 * POST /api/volatility
 * Calculate volatility for multiple stocks
 * Body: { symbols: ['AAPL', 'GOOGL'], start, end, method }
 */
router.post('/volatility', async (req, res) => {
  try {
    const { symbols, start, end, method = 'garch' } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }

    if (symbols.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 symbols allowed' });
    }

    // Set default date range
    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Fetch and analyze all symbols
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const historicalData = await yahooFinanceService.getHistoricalData(symbol, startDate, endDate);
          const dataWithSymbol = historicalData.map(d => ({ ...d, symbol }));
          const volatilityAnalysis = volatilityCalculator.analyzeVolatility(dataWithSymbol, method);
          
          return {
            symbol: symbol.toUpperCase(),
            success: true,
            volatilityAnalysis
          };
        } catch (error) {
          return {
            symbol: symbol.toUpperCase(),
            success: false,
            error: error.message
          };
        }
      })
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in /api/volatility:', error);
    res.status(500).json({ 
      error: 'Failed to calculate volatility', 
      message: error.message 
    });
  }
});

/**
 * GET /api/search/:query
 * Search for stock symbols
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    if (!query || query.length < 1) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await yahooFinanceService.searchSymbols(query);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in /api/search:', error);
    res.status(500).json({ 
      error: 'Failed to search symbols', 
      message: error.message 
    });
  }
});

/**
 * GET /api/quote/:symbol
 * Get current quote for a stock
 */
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const quote = await yahooFinanceService.getQuote(symbol);

    res.json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Error in /api/quote:', error);
    res.status(500).json({ 
      error: 'Failed to fetch quote', 
      message: error.message 
    });
  }
});

module.exports = router;

