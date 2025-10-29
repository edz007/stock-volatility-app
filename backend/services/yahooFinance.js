const axios = require('axios');
const yf = require('yahoo-finance2').default;

// Optional Python yfinance service URL. If not set, we'll use yahoo-finance2 directly.
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || '';

function mapHistorical(data) {
  return (data || []).map(d => ({
    date: (d.date || d.end || d.start || new Date()).toISOString().slice(0, 10),
    open: Number(d.open),
    high: Number(d.high),
    low: Number(d.low),
    close: Number(d.close),
    volume: Number(d.volume || 0),
    adjClose: Number(d.adjClose ?? d.close)
  }));
}

/**
 * Fetch historical stock data from Python yfinance service
 * @param {string} symbol - Stock symbol (e.g., 'AAPL')
 * @param {Date} startDate - Start date for historical data
 * @param {Date} endDate - End date for historical data
 * @returns {Promise<Array>} Array of historical price data
 */
async function getHistoricalData(symbol, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 1) Try Python service only if configured
  if (PYTHON_SERVICE_URL) {
    try {
      console.log(`Fetching data for ${symbol} via Python service`);
      const response = await axios.get(`${PYTHON_SERVICE_URL}/historical/${symbol}`,
        { params: { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) }, timeout: 30000 }
      );
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log(`✓ Received ${response.data.data.length} data points for ${symbol} (Python)`);
        return response.data.data;
      }
    } catch (error) {
      console.warn('Python service unavailable, falling back to yahoo-finance2:', error.message);
    }
  }

  // 2) Fallback to yahoo-finance2
  console.log(`Fetching data for ${symbol} via yahoo-finance2`);
  const results = await yf.historical(symbol, { period1: start, period2: end, interval: '1d' });
  const mapped = mapHistorical(results);
  console.log(`✓ Received ${mapped.length} data points for ${symbol} (yf2)`);
  return mapped;
}

/**
 * Search for stock symbols
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching stock symbols and names
 */
async function searchSymbols(query) {
  if (PYTHON_SERVICE_URL) {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/search/${query}`, { timeout: 10000 });
      if (response.data && response.data.success) return response.data.data || [];
    } catch (error) {
      console.warn('Python search failed, falling back to yahoo-finance2');
    }
  }

  const res = await yf.search(query);
  return (res.quotes || []).map(q => ({
    symbol: q.symbol,
    name: q.shortname || q.longname || q.symbol,
    exchange: q.exchange || 'N/A',
    type: q.quoteType || 'EQUITY'
  }));
}

/**
 * Get current quote for a stock using Python yfinance service
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Current quote data
 */
async function getQuote(symbol) {
  if (PYTHON_SERVICE_URL) {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/quote/${symbol}`, { timeout: 10000 });
      if (response.data && response.data.success) return response.data.data;
    } catch (error) {
      console.warn('Python quote failed, falling back to yahoo-finance2');
    }
  }

  const q = await yf.quote(symbol);
  return {
    symbol: q.symbol,
    name: q.shortName || q.longName || q.symbol,
    price: q.regularMarketPrice,
    change: q.regularMarketChange,
    changePercent: q.regularMarketChangePercent,
    volume: q.regularMarketVolume,
    marketCap: q.marketCap,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow
  };
}

module.exports = {
  getHistoricalData,
  searchSymbols,
  getQuote
};
