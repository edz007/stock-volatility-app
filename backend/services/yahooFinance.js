const axios = require('axios');
const yf = require('yahoo-finance2').default;

// Priority order: Finnhub (if API key present) → Python yfinance service → yahoo-finance2
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || '';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';

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

async function fetchFinnhubDaily(symbol, startDate, endDate) {
  if (!FINNHUB_API_KEY) throw new Error('FINNHUB_API_KEY not set');
  const from = Math.floor(new Date(startDate).getTime() / 1000);
  const to = Math.floor(new Date(endDate).getTime() / 1000);
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
  const { data } = await axios.get(url, { timeout: 20000 });
  if (!data || (data.s !== 'ok' && data.s !== 'no_data')) {
    throw new Error(`Finnhub candle error: ${data && data.s}`);
  }
  if (data.s === 'no_data') return [];
  const results = (data.t || []).map((t, i) => ({
    date: new Date(t * 1000).toISOString().slice(0, 10),
    open: Number(data.o[i]),
    high: Number(data.h[i]),
    low: Number(data.l[i]),
    close: Number(data.c[i]),
    volume: Number(data.v[i] || 0),
    adjClose: Number(data.c[i])
  }));
  return results;
}

async function fetchFinnhubQuote(symbol) {
  if (!FINNHUB_API_KEY) throw new Error('FINNHUB_API_KEY not set');
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
  const { data } = await axios.get(url, { timeout: 10000 });
  if (!data || typeof data.c === 'undefined') throw new Error('Finnhub quote error');
  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    volume: data.v,
    marketCap: undefined,
    fiftyTwoWeekHigh: data.h,
    fiftyTwoWeekLow: data.l
  };
}

async function fetchFinnhubSearch(query) {
  if (!FINNHUB_API_KEY) throw new Error('FINNHUB_API_KEY not set');
  const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`;
  const { data } = await axios.get(url, { timeout: 10000 });
  const results = (data.result || []).map(r => ({
    symbol: r.symbol,
    name: r.description || r.symbol,
    exchange: r.exchange || 'N/A',
    type: r.type || 'EQUITY'
  }));
  return results;
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

  // 1) Primary: Try Finnhub first if API key is present
  if (FINNHUB_API_KEY) {
    try {
      console.log(`Fetching data for ${symbol} via Finnhub`);
      const finnhubData = await fetchFinnhubDaily(symbol, start, end);
      if (finnhubData.length > 0) {
        console.log(`✓ Received ${finnhubData.length} data points for ${symbol} (Finnhub)`);
        return finnhubData;
      }
    } catch (e) {
      console.warn('Finnhub failed, falling back:', e && e.message ? e.message : e);
    }
  }

  // 2) Fallback: Try Python service if configured
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

  // 3) Final fallback: yahoo-finance2
  console.log(`Fetching data for ${symbol} via yahoo-finance2`);
  try {
    const results = await yf.historical(symbol, { period1: start, period2: end, interval: '1d' });
    const mapped = mapHistorical(results);
    console.log(`✓ Received ${mapped.length} data points for ${symbol} (yf2)`);
    if (mapped.length > 0) return mapped;
  } catch (e) {
    console.warn('yf.historical failed:', e && e.message ? e.message : e);
  }

  throw new Error(`No historical data available for ${symbol}`);
}

/**
 * Search for stock symbols
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching stock symbols and names
 */
async function searchSymbols(query) {
  // 1) Primary: Try Finnhub first if API key is present
  if (FINNHUB_API_KEY) {
    try {
      return await fetchFinnhubSearch(query);
    } catch (e) {
      console.warn('Finnhub search failed, falling back:', e && e.message ? e.message : e);
    }
  }

  // 2) Fallback: Try Python service if configured
  if (PYTHON_SERVICE_URL) {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/search/${query}`, { timeout: 10000 });
      if (response.data && response.data.success) return response.data.data || [];
    } catch (error) {
      console.warn('Python search failed, falling back to yahoo-finance2');
    }
  }

  // 3) Final fallback: yahoo-finance2
  try {
    const res = await yf.search(query);
    const yfResults = (res.quotes || []).map(q => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      exchange: q.exchange || 'N/A',
      type: q.quoteType || 'EQUITY'
    }));
    if (yfResults.length > 0) return yfResults;
  } catch (e) {
    console.warn('yf.search failed');
  }

  return [];
}

/**
 * Get current quote for a stock using Python yfinance service
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Current quote data
 */
async function getQuote(symbol) {
  // 1) Primary: Try Finnhub first if API key is present
  if (FINNHUB_API_KEY) {
    try {
      return await fetchFinnhubQuote(symbol);
    } catch (e) {
      console.warn('Finnhub quote failed, falling back:', e && e.message ? e.message : e);
    }
  }

  // 2) Fallback: Try Python service if configured
  if (PYTHON_SERVICE_URL) {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/quote/${symbol}`, { timeout: 10000 });
      if (response.data && response.data.success) return response.data.data;
    } catch (error) {
      console.warn('Python quote failed, falling back to yahoo-finance2');
    }
  }

  // 3) Final fallback: yahoo-finance2
  try {
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
  } catch (e) {
    console.warn('yf.quote failed');
  }

  throw new Error(`No quote available for ${symbol}`);
}

module.exports = {
  getHistoricalData,
  searchSymbols,
  getQuote
};
