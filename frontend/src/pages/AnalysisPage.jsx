import React, { useState } from 'react';
import StockSearch from '../components/StockSearch';
import DateRangePicker from '../components/DateRangePicker';
import VolatilityChart from '../components/VolatilityChart';
import StockComparison from '../components/StockComparison';
import MetricsDisplay from '../components/MetricsDisplay';
import api from '../services/api';

function AnalysisPage() {
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [stocksData, setStocksData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [volatilityMethod, setVolatilityMethod] = useState('garch');

  const handleStockSelect = (symbols) => {
    setSelectedSymbols(symbols);
  };

  const handleDateChange = (range) => {
    setDateRange(range);
  };

  const fetchStockData = async () => {
    if (selectedSymbols.length === 0) {
      setError('Please select at least one stock');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const symbols = selectedSymbols.map(s => s.symbol);
      
      if (symbols.length === 1) {
        // Single stock - use GET endpoint
        const response = await api.getStockData(
          symbols[0],
          dateRange.start,
          dateRange.end,
          volatilityMethod
        );
        setStocksData([response.data]);
      } else {
        // Multiple stocks - use POST endpoint
        const response = await api.calculateVolatility(
          symbols,
          dateRange.start,
          dateRange.end,
          volatilityMethod
        );
        
        // Filter successful results
        const successfulData = response.data
          .filter(item => item.success)
          .map(item => ({
            symbol: item.symbol,
            volatilityAnalysis: item.volatilityAnalysis
          }));
        
        if (successfulData.length === 0) {
          setError('Failed to fetch data for all selected stocks');
        } else if (successfulData.length < symbols.length) {
          setError(`Warning: Could not fetch data for some stocks`);
        }
        
        setStocksData(successfulData);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch stock data');
      setStocksData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = (method) => {
    setVolatilityMethod(method);
    if (stocksData.length > 0) {
      // Refetch with new method if data already loaded
      setTimeout(fetchStockData, 100);
    }
  };

  return (
    <>
      <main className="app-main">
        <div className="controls-section">
          <div className="control-group">
            <h2>Select Stocks</h2>
            <StockSearch onStockSelect={handleStockSelect} maxSelections={5} />
          </div>

          <div className="control-group">
            <h2>Date Range</h2>
            <DateRangePicker onDateChange={handleDateChange} defaultRange="6m" />
          </div>

          <div className="control-group">
            <h2>Volatility Model</h2>
            <div className="method-selector">
              <button
                className={volatilityMethod === 'garch' ? 'active' : ''}
                onClick={() => handleMethodChange('garch')}
              >
                GARCH
              </button>
              <button
                className={volatilityMethod === 'ewma' ? 'active' : ''}
                onClick={() => handleMethodChange('ewma')}
              >
                EWMA
              </button>
              <button
                className={volatilityMethod === 'rolling' ? 'active' : ''}
                onClick={() => handleMethodChange('rolling')}
              >
                Rolling
              </button>
            </div>
          </div>

          <button 
            className="analyze-button" 
            onClick={fetchStockData}
            disabled={loading || selectedSymbols.length === 0}
          >
            {loading ? 'Loading...' : 'Analyze Volatility'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>

        {stocksData.length > 0 && (
          <div className="results-section">
            {/* Single Stock View */}
            {stocksData.length === 1 && (
              <>
                <MetricsDisplay data={stocksData[0]} />
                <VolatilityChart data={stocksData[0]} />
              </>
            )}

            {/* Multi-Stock Comparison */}
            {stocksData.length > 1 && (
              <>
                <StockComparison stocksData={stocksData} />
                
                <div className="individual-metrics">
                  {stocksData.map((stock) => (
                    <MetricsDisplay key={stock.symbol} data={stock} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!loading && stocksData.length === 0 && !error && (
          <div className="empty-state">
            <h3>Get Started</h3>
            <p>Select one or more stocks and a date range to analyze volatility patterns.</p>
            <ul>
              <li>📈 Compare up to 5 stocks simultaneously</li>
              <li>📊 Multiple volatility models (GARCH, EWMA, Rolling)</li>
              <li>📅 Flexible date ranges from 1 month to 5 years</li>
              <li>🔍 Interactive charts with zoom and pan</li>
            </ul>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Data powered by Yahoo Finance | Volatility calculated using GARCH models</p>
      </footer>
    </>
  );
}

export default AnalysisPage;

