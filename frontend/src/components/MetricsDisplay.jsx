import React from 'react';
import '../styles/MetricsDisplay.css';
import ProbabilityBrackets from './ProbabilityBrackets';

const MetricsDisplay = ({ data }) => {
  if (!data || !data.volatilityAnalysis) {
    return null;
  }

  const { symbol, volatilityAnalysis } = data;
  const { statistics, method, parameters, diagnostics } = volatilityAnalysis;

  const formatPercent = (value) => {
    return (value * 100).toFixed(2) + '%';
  };

  const formatNumber = (value, decimals = 2) => {
    return value.toFixed(decimals);
  };

  const formatPValue = (p) => {
    if (p === null || p === undefined || isNaN(p)) return '-';
    if (p < 1e-6) return '<1e-6';
    return p.toFixed(6);
  };

  const formatScientific = (value, decimals = 4) => {
    if (Math.abs(value) < 0.0001 || Math.abs(value) > 1000000) {
      return value.toExponential(decimals);
    }
    return value.toFixed(decimals);
  };

  return (
    <div className="metrics-display">
      <div className="metrics-header">
        <h3>{symbol}</h3>
        <span className="method-badge">{method.toUpperCase()}</span>
      </div>

      <div className="metrics-grid">
        {/* Current Volatility */}
        <div className="metric-card highlight">
          <div className="metric-label">Current Volatility</div>
          <div className="metric-value large">
            {formatPercent(statistics.currentVolatility)}
          </div>
          <div className="metric-sublabel">Annualized</div>
        </div>

        {/* Mean Return */}
        <div className="metric-card">
          <div className="metric-label">Mean Return</div>
          <div className="metric-value">
            {formatPercent(statistics.annualizedReturn)}
          </div>
          <div className="metric-sublabel">Annualized</div>
        </div>

        {/* Standard Deviation */}
        <div className="metric-card">
          <div className="metric-label">Std Deviation</div>
          <div className="metric-value">
            {formatPercent(statistics.stdDevReturn)}
          </div>
          <div className="metric-sublabel">Daily</div>
        </div>

        {/* Volatility Range */}
        <div className="metric-card">
          <div className="metric-label">Volatility Range</div>
          <div className="metric-value small">
            {formatPercent(statistics.minVolatility)} - {formatPercent(statistics.maxVolatility)}
          </div>
          <div className="metric-sublabel">Min - Max</div>
        </div>
      </div>

      {/* GARCH Parameters */}
      {method === 'garch' && parameters && (
        <div className="garch-parameters">
          <h4>GARCH(1,1) Parameters</h4>
          <div className="parameters-grid">
            <div className="parameter-item">
              <span className="param-label">ω (omega):</span>
              <span className="param-value">{formatScientific(parameters.omega, 4)}</span>
            </div>
            <div className="parameter-item">
              <span className="param-label">α (alpha):</span>
              <span className="param-value">{formatNumber(parameters.alpha, 4)}</span>
            </div>
            <div className="parameter-item">
              <span className="param-label">β (beta):</span>
              <span className="param-value">{formatNumber(parameters.beta, 4)}</span>
            </div>
            <div className="parameter-item">
              <span className="param-label">Persistence:</span>
              <span className="param-value">{formatNumber(parameters.alpha + parameters.beta, 4)}</span>
            </div>
          </div>
        </div>
      )}

      {/* GARCH Model Diagnostics */}
      {method === 'garch' && diagnostics && (
        <div className="garch-diagnostics">
          <h4>Model Diagnostics</h4>
          
          <div className="diagnostics-table">
            <table>
              <thead>
                <tr>
                  <th>Coefficient</th>
                  <th>Value</th>
                  <th>Std Error</th>
                  <th>t-statistic</th>
                  <th>p-value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ω (omega)</td>
                  <td>{formatScientific(diagnostics.coefficients.omega.value, 4)}</td>
                  <td>{formatScientific(diagnostics.coefficients.omega.stdError, 4)}</td>
                  <td>{formatNumber(diagnostics.coefficients.omega.tStat, 3)}</td>
                  <td>{formatPValue(diagnostics.coefficients.omega.pValue)}</td>
                </tr>
                <tr>
                  <td>α (alpha)</td>
                  <td>{formatNumber(diagnostics.coefficients.alpha.value, 4)}</td>
                  <td>{formatNumber(diagnostics.coefficients.alpha.stdError, 4)}</td>
                  <td>{formatNumber(diagnostics.coefficients.alpha.tStat, 3)}</td>
                  <td>{formatPValue(diagnostics.coefficients.alpha.pValue)}</td>
                </tr>
                <tr>
                  <td>β (beta)</td>
                  <td>{formatNumber(diagnostics.coefficients.beta.value, 4)}</td>
                  <td>{formatNumber(diagnostics.coefficients.beta.stdError, 4)}</td>
                  <td>{formatNumber(diagnostics.coefficients.beta.tStat, 3)}</td>
                  <td>{formatPValue(diagnostics.coefficients.beta.pValue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="model-fit">
            <div className="fit-metric">
              <span>Log-Likelihood:</span>
              <strong>{formatNumber(diagnostics.logLikelihood, 2)}</strong>
            </div>
            <div className="fit-metric">
              <span>AIC:</span>
              <strong>{formatNumber(diagnostics.aic, 2)}</strong>
            </div>
            <div className="fit-metric">
              <span>BIC:</span>
              <strong>{formatNumber(diagnostics.bic, 2)}</strong>
            </div>
            <div className="fit-metric">
              <span>Observations:</span>
              <strong>{diagnostics.nobs}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Data Info */}
      <div className="data-info">
        <span>Data Points: {volatilityAnalysis.dataPoints}</span>
        <span>Period: {statistics.annualizedReturn > 0 ? '📈' : '📉'}</span>
      </div>

      {/* Probability Brackets */}
      <ProbabilityBrackets data={data} />
    </div>
  );
};

export default MetricsDisplay;

