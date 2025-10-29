import React from 'react';
import '../styles/ProbabilityBrackets.css';

const ProbabilityBrackets = ({ data }) => {
  if (!data || !data.volatilityAnalysis) return null;
  const { method, probabilities } = data.volatilityAnalysis;
  if (method !== 'garch' || !probabilities || probabilities.length === 0) return null;

  const totalShown = probabilities.reduce((s, b) => s + (b.probability || 0), 0);

  const formatPct = (p) => `${(p * 100).toFixed(2)}%`;

  return (
    <div className="prob-brackets">
      <h4>Price Change Probabilities (t-distribution)</h4>
      <div className="prob-table">
        <div className="prob-row prob-header">
          <div>Bracket</div>
          <div>Probability</div>
          <div className="bar-col">Likelihood</div>
        </div>
        {probabilities.map((b, idx) => (
          <div className="prob-row" key={idx}>
            <div className="label">{b.label}</div>
            <div className="value">{formatPct(b.probability)}</div>
            <div className="bar-col">
              <div className="bar-track">
                <div
                  className={`bar ${b.color || ''}`}
                  style={{ width: `${Math.min(100, (b.probability || 0) * 100)}%` }}
                />
                <span className="bar-text">{formatPct(b.probability)}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="prob-row prob-footer">
          <div>Total (shown)</div>
          <div>{formatPct(totalShown)}</div>
          <div className="hint">Excludes tails beyond ±10%</div>
        </div>
      </div>
    </div>
  );
};

export default ProbabilityBrackets;


