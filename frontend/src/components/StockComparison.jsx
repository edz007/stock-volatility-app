import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import '../styles/StockComparison.css';

const StockComparison = ({ stocksData }) => {
  const [comparisonMode, setComparisonMode] = useState('volatility'); // 'volatility' or 'price'

  if (!stocksData || stocksData.length === 0) {
    return (
      <div className="comparison-placeholder">
        <p>Add multiple stocks to compare their volatility.</p>
      </div>
    );
  }

  // Colors for different stocks
  const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];

  // Prepare comparison data
  const getComparisonData = () => {
    if (stocksData.length === 0) return [];

    // Find common dates across all stocks
    const allDates = new Set();
    stocksData.forEach(stock => {
      if (stock.volatilityAnalysis && stock.volatilityAnalysis.timeSeries) {
        stock.volatilityAnalysis.timeSeries.forEach(item => {
          allDates.add(item.date);
        });
      }
    });

    const sortedDates = Array.from(allDates).sort();

    // Create comparison data structure
    return sortedDates.map(date => {
      const dataPoint = { date };
      
      stocksData.forEach((stock, index) => {
        if (stock.volatilityAnalysis && stock.volatilityAnalysis.timeSeries) {
          const stockData = stock.volatilityAnalysis.timeSeries.find(item => item.date === date);
          if (stockData) {
            if (comparisonMode === 'volatility') {
              dataPoint[stock.symbol] = stockData.annualizedVolatility;
            } else {
              dataPoint[stock.symbol] = stockData.price;
            }
          }
        }
      });

      return dataPoint;
    });
  };

  const comparisonData = getComparisonData();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="comparison-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {comparisonMode === 'volatility'
                ? `${(entry.value * 100).toFixed(2)}%`
                : `$${entry.value.toFixed(2)}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get volatility summary
  const getVolatilitySummary = () => {
    return stocksData.map(stock => {
      if (!stock.volatilityAnalysis) return null;
      
      const stats = stock.volatilityAnalysis.statistics;
      return {
        symbol: stock.symbol,
        currentVolatility: stats.currentVolatility,
        meanReturn: stats.annualizedReturn,
        minVolatility: stats.minVolatility,
        maxVolatility: stats.maxVolatility
      };
    }).filter(Boolean);
  };

  const summary = getVolatilitySummary();

  return (
    <div className="stock-comparison-container">
      <div className="comparison-header">
        <h3>Multi-Stock Comparison</h3>
        
        <div className="comparison-controls">
          <button
            className={comparisonMode === 'volatility' ? 'active' : ''}
            onClick={() => setComparisonMode('volatility')}
          >
            Volatility
          </button>
          <button
            className={comparisonMode === 'price' ? 'active' : ''}
            onClick={() => setComparisonMode('price')}
          >
            Price
          </button>
        </div>
      </div>

      <div className="comparison-chart">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ 
                value: comparisonMode === 'volatility' ? 'Volatility' : 'Price ($)', 
                angle: -90, 
                position: 'insideLeft' 
              }}
              tickFormatter={comparisonMode === 'volatility' 
                ? (value) => `${(value * 100).toFixed(0)}%`
                : undefined
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {stocksData.map((stock, index) => (
              <Line
                key={stock.symbol}
                type="monotone"
                dataKey={stock.symbol}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                name={stock.symbol}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {comparisonMode === 'volatility' && summary.length > 0 && (
        <div className="comparison-summary">
          <h4>Volatility Summary</h4>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Current Vol.</th>
                <th>Mean Return</th>
                <th>Vol. Range</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item, index) => (
                <tr key={item.symbol}>
                  <td>
                    <span 
                      className="symbol-indicator" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    {item.symbol}
                  </td>
                  <td>{(item.currentVolatility * 100).toFixed(2)}%</td>
                  <td className={item.meanReturn >= 0 ? 'positive' : 'negative'}>
                    {(item.meanReturn * 100).toFixed(2)}%
                  </td>
                  <td>
                    {(item.minVolatility * 100).toFixed(2)}% - {(item.maxVolatility * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockComparison;

