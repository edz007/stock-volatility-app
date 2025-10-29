const axios = require('axios');

// Python yfinance service URL
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

/**
 * Fetch historical stock data from Python yfinance service
 * @param {string} symbol - Stock symbol (e.g., 'AAPL')
 * @param {Date} startDate - Start date for historical data
 * @param {Date} endDate - End date for historical data
 * @returns {Promise<Array>} Array of historical price data
 */
async function getHistoricalData(symbol, startDate, endDate) {
  try {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    console.log(`Fetching data for ${symbol} from ${start} to ${end} via Python service`);

    const response = await axios.get(
      `${PYTHON_SERVICE_URL}/historical/${symbol}`,
      {
        params: { start, end },
        timeout: 30000  // 30 second timeout
      }
    );
    
    if (!response.data || !response.data.success || !response.data.data) {
      throw new Error('No data returned from Python service');
    }

    console.log(`✓ Received ${response.data.data.length} data points for ${symbol}`);

    return response.data.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Python data service is not running. Please start it on port 5001');
    }
    console.error(`Error fetching data for ${symbol}:`, error.message);
    throw new Error(`Failed to fetch data for ${symbol}: ${error.message}`);
  }
}

/**
 * Search for stock symbols
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching stock symbols and names
 */
async function searchSymbols(query) {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/search/${query}`, {
      timeout: 10000
    });
    
    if (!response.data || !response.data.success) {
      return [];
    }

    return response.data.data || [];
  } catch (error) {
    console.error(`Error searching for ${query}:`, error.message);
    // Return empty array instead of throwing for search
    return [];
  }
}

/**
 * Get current quote for a stock using Python yfinance service
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} Current quote data
 */
async function getQuote(symbol) {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/quote/${symbol}`, {
      timeout: 10000
    });
    
    if (!response.data || !response.data.success) {
      throw new Error('No quote data returned');
    }
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error.message);
    throw new Error(`Failed to fetch quote for ${symbol}: ${error.message}`);
  }
}

module.exports = {
  getHistoricalData,
  searchSymbols,
  getQuote
};
