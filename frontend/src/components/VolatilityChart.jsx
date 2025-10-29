import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush
} from 'recharts';
import '../styles/VolatilityChart.css';

const VolatilityChart = ({ data, showVolatility = true, showPrice = true }) => {
  const [viewMode, setViewMode] = useState('both'); // 'both', 'price', 'volatility'

  if (!data || !data.volatilityAnalysis || !data.volatilityAnalysis.timeSeries) {
    return (
      <div className="chart-placeholder">
        <p>No data available. Please select a stock and date range.</p>
      </div>
    );
  }

  const { symbol, volatilityAnalysis } = data;
  const chartData = volatilityAnalysis.timeSeries;

  // Format tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Price') 
                ? `$${entry.value.toFixed(2)}`
                : `${(entry.value * 100).toFixed(2)}%`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Determine what to show
  const shouldShowPrice = showPrice && (viewMode === 'both' || viewMode === 'price');
  const shouldShowVolatility = showVolatility && (viewMode === 'both' || viewMode === 'volatility');

  return (
    <div className="volatility-chart-container">
      <div className="chart-header">
        <h3>{symbol} - {volatilityAnalysis.method.toUpperCase()} Analysis</h3>
        
        <div className="chart-controls">
          <button
            className={viewMode === 'both' ? 'active' : ''}
            onClick={() => setViewMode('both')}
          >
            Both
          </button>
          <button
            className={viewMode === 'price' ? 'active' : ''}
            onClick={() => setViewMode('price')}
          >
            Price Only
          </button>
          <button
            className={viewMode === 'volatility' ? 'active' : ''}
            onClick={() => setViewMode('volatility')}
          >
            Volatility Only
          </button>
        </div>
      </div>

      {shouldShowPrice && (
        <div className="chart-section">
          <h4>Price History</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
                label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
                name="Price"
              />
              <Brush dataKey="date" height={30} stroke="#2563eb" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {shouldShowVolatility && (
        <div className="chart-section">
          <h4>Volatility (Annualized)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
                label={{ value: 'Volatility', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="annualizedVolatility" 
                stroke="#dc2626" 
                strokeWidth={2}
                dot={false}
                name="Annualized Volatility"
              />
              <Brush dataKey="date" height={30} stroke="#dc2626" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default VolatilityChart;

