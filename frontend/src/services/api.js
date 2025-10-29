import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * API service for stock data and volatility analysis
 */
class StockAPI {
  /**
   * Get stock data with volatility analysis
   * @param {string} symbol - Stock symbol
   * @param {string} start - Start date (YYYY-MM-DD)
   * @param {string} end - End date (YYYY-MM-DD)
   * @param {string} method - Volatility method (garch, ewma, rolling)
   */
  async getStockData(symbol, start = null, end = null, method = 'garch') {
    try {
      const params = { method };
      if (start) params.start = start;
      if (end) params.end = end;

      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Calculate volatility for multiple stocks
   * @param {Array} symbols - Array of stock symbols
   * @param {string} start - Start date
   * @param {string} end - End date
   * @param {string} method - Volatility method
   */
  async calculateVolatility(symbols, start = null, end = null, method = 'garch') {
    try {
      const response = await axios.post(`${API_BASE_URL}/volatility`, {
        symbols,
        start,
        end,
        method
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating volatility:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Search for stock symbols
   * @param {string} query - Search query
   */
  async searchSymbols(query) {
    try {
      const response = await axios.get(`${API_BASE_URL}/search/${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching symbols:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get current quote for a stock
   * @param {string} symbol - Stock symbol
   */
  async getQuote(symbol) {
    try {
      const response = await axios.get(`${API_BASE_URL}/quote/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      return new Error(error.response.data.message || error.response.data.error || 'Server error');
    } else if (error.request) {
      // No response received
      return new Error('No response from server. Please check if the backend is running.');
    } else {
      // Other errors
      return new Error(error.message || 'Unknown error occurred');
    }
  }
}

export default new StockAPI();

