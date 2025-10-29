import React from 'react';
import { Link } from 'react-router-dom';
import './ModelsGuide.css';

function ModelsGuide() {
  return (
    <div className="models-guide">
      <div className="guide-header">
        <h1>📚 Understanding Volatility Models</h1>
        <p>Learn how different models calculate stock volatility</p>
        <Link to="/" className="back-button">← Back to Analysis</Link>
      </div>

      <div className="guide-content">
        
        {/* GARCH Section */}
        <section id="garch" className="model-section">
          <div className="model-header">
            <h2>GARCH (1,1)</h2>
            <span className="model-badge">Most Accurate</span>
          </div>
          
          <div className="formula-box">
            <h3>Formula:</h3>
            <code className="formula">σ²ₜ = ω + α·ε²ₜ₋₁ + β·σ²ₜ₋₁</code>
          </div>

          <div className="model-explanation">
            <h3>What is GARCH?</h3>
            <p>
              GARCH (Generalized Autoregressive Conditional Heteroskedasticity) is an advanced model 
              that captures <strong>volatility clustering</strong> - the tendency for calm periods to 
              follow calm periods, and stormy periods to follow stormy periods.
            </p>

            <div className="key-features">
              <h4>Key Features:</h4>
              <ul>
                <li>📊 Today's volatility depends on yesterday's shock (ε²ₜ₋₁) and yesterday's volatility (σ²ₜ₋₁)</li>
                <li>⚖️ Weighs both the magnitude of price changes and their persistence</li>
                <li>🎯 Most accurate for capturing real-world market behavior</li>
                <li>🔄 Smooths out noise for better forecasting</li>
              </ul>
            </div>

            <div className="when-to-use">
              <h4>When to Use:</h4>
              <ul>
                <li>✅ For professional analysis and risk management</li>
                <li>✅ When you need the most accurate volatility estimates</li>
                <li>✅ For compliance and regulatory reporting</li>
                <li>✅ Academic research and detailed analysis</li>
              </ul>
            </div>

            <div className="infographic">
              <svg width="100%" height="200" viewBox="0 0 500 200">
                {/* Volatility line showing clustering effect */}
                <defs>
                  <linearGradient id="garchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                
                {/* Background */}
                <rect width="500" height="200" fill="#F8FAFC"/>
                
                {/* Grid lines */}
                <line x1="50" y1="20" x2="50" y2="180" stroke="#E2E8F0" strokeWidth="1"/>
                <line x1="50" y1="180" x2="450" y2="180" stroke="#E2E8F0" strokeWidth="1"/>
                <line x1="450" y1="20" x2="450" y2="180" stroke="#E2E8F0" strokeWidth="1"/>
                <line x1="50" y1="20" x2="450" y2="20" stroke="#E2E8F0" strokeWidth="1"/>
                
                {/* Volatility bands with clustering */}
                <polygon points="50,180 50,50 150,50 150,180" fill="url(#garchGradient)"/>
                <polygon points="150,180 150,120 250,120 250,180" fill="url(#garchGradient)"/>
                <polygon points="250,180 250,50 350,50 350,180" fill="url(#garchGradient)"/>
                <polygon points="350,180 350,120 450,120 450,180" fill="url(#garchGradient)"/>
                
                {/* Labels */}
                <text x="250" y="195" fontSize="12" fill="#64748B" textAnchor="middle">Time</text>
                <text x="30" y="100" fontSize="12" fill="#64748B" textAnchor="middle">Volatility</text>
                
                {/* Title */}
                <text x="250" y="15" fontSize="14" fontWeight="bold" fill="#1E293B" textAnchor="middle">GARCH: Volatility Clustering</text>
              </svg>
            </div>
          </div>
        </section>

        {/* EWMA Section */}
        <section id="ewma" className="model-section">
          <div className="model-header">
            <h2>EWMA (Exponentially Weighted Moving Average)</h2>
            <span className="model-badge badge-yellow">Fast & Stable</span>
          </div>
          
          <div className="formula-box">
            <h3>Formula:</h3>
            <code className="formula">σ²ₜ = (1-λ)·r²ₜ₋₁ + λ·σ²ₜ₋₁</code>
          </div>

          <div className="model-explanation">
            <h3>What is EWMA?</h3>
            <p>
              EWMA uses exponential smoothing to give more weight to recent price movements 
              while gradually forgetting older ones. It's the industry standard for risk metrics 
              like <strong>Value at Risk (VaR)</strong>.
            </p>

            <div className="key-features">
              <h4>Key Features:</h4>
              <ul>
                <li>⚡ Fast calculation - simpler than GARCH</li>
                <li>📈 Assigns higher importance to recent volatility (λ ≈ 0.94 for daily data)</li>
                <li>🎯 Used by JPMorgan RiskMetrics methodology</li>
                <li>💪 More robust and less sensitive to outliers</li>
              </ul>
            </div>

            <div className="when-to-use">
              <h4>When to Use:</h4>
              <ul>
                <li>✅ When you need fast, reliable estimates</li>
                <li>✅ For real-time trading systems</li>
                <li>✅ Risk management (VaR calculations)</li>
                <li>✅ Good baseline for comparing other models</li>
              </ul>
            </div>

            <div className="infographic">
              <svg width="100%" height="200" viewBox="0 0 500 200">
                <defs>
                  <linearGradient id="ewmaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                
                <rect width="500" height="200" fill="#F8FAFC"/>
                
                {/* Smooth exponential decay showing in color intensity */}
                <circle cx="100" cy="100" r="40" fill="#10B981" opacity="0.8"/>
                <circle cx="150" cy="100" r="35" fill="#10B981" opacity="0.6"/>
                <circle cx="200" cy="100" r="30" fill="#10B981" opacity="0.4"/>
                <circle cx="250" cy="100" r="25" fill="#10B981" opacity="0.3"/>
                <circle cx="300" cy="100" r="20" fill="#10B981" opacity="0.2"/>
                
                {/* Exponential decay curve */}
                <path d="M 80,60 Q 150,80 220,100 Q 280,110 400,120" 
                      stroke="#10B981" 
                      strokeWidth="3" 
                      fill="none"
                      strokeDasharray="5,5"/>
                
                <text x="250" y="195" fontSize="12" fill="#64748B" textAnchor="middle">Time</text>
                <text x="30" y="100" fontSize="12" fill="#64748B" textAnchor="middle">Weight</text>
                <text x="250" y="15" fontSize="14" fontWeight="bold" fill="#1E293B" textAnchor="middle">EWMA: Exponential Decay</text>
              </svg>
            </div>
          </div>
        </section>

        {/* Rolling Window Section */}
        <section id="rolling" className="model-section">
          <div className="model-header">
            <h2>Rolling Window</h2>
            <span className="model-badge badge-green">Simple</span>
          </div>
          
          <div className="formula-box">
            <h3>Formula:</h3>
            <code className="formula">σₜ = √(1/N · Σ(rᵢ - ṝ)²)</code>
            <p className="formula-note">Where N is the window size (typically 20 days)</p>
          </div>

          <div className="model-explanation">
            <h3>What is Rolling Window?</h3>
            <p>
              The simplest approach: calculate the standard deviation over the last N days. 
              No complex math, just a straightforward moving average of squared returns.
            </p>

            <div className="key-features">
              <h4>Key Features:</h4>
              <ul>
                <li>🎓 Easiest to understand and explain</li>
                <li>📊 Equal weight to all days in the window</li>
                <li>⚖️ Reacts instantly when new data enters the window</li>
                <li>🔧 Good for quick sanity checks</li>
              </ul>
            </div>

            <div className="when-to-use">
              <h4>When to Use:</h4>
              <ul>
                <li>✅ For educational purposes and learning</li>
                <li>✅ Quick estimates and initial analysis</li>
                <li>✅ When you need a simple, transparent metric</li>
                <li>✅ Comparing against more advanced models</li>
              </ul>
            </div>

            <div className="infographic">
              <svg width="100%" height="200" viewBox="0 0 500 200">
                <defs>
                  <linearGradient id="rollingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                
                <rect width="500" height="200" fill="#F8FAFC"/>
                
                {/* Equal-sized windows */}
                <rect x="50" y="30" width="100" height="150" fill="url(#rollingGradient)" stroke="#8B5CF6" strokeWidth="2"/>
                <rect x="150" y="30" width="100" height="150" fill="url(#rollingGradient)" stroke="#8B5CF6" strokeWidth="2"/>
                <rect x="250" y="30" width="100" height="150" fill="url(#rollingGradient)" stroke="#8B5CF6" strokeWidth="2"/>
                <rect x="350" y="30" width="100" height="150" fill="url(#rollingGradient)" stroke="#8B5CF6" strokeWidth="2"/>
                
                {/* Labels for windows */}
                <text x="100" y="110" fontSize="12" fill="#8B5CF6" textAnchor="middle" fontWeight="bold">Window 1</text>
                <text x="200" y="110" fontSize="12" fill="#8B5CF6" textAnchor="middle" fontWeight="bold">Window 2</text>
                <text x="300" y="110" fontSize="12" fill="#8B5CF6" textAnchor="middle" fontWeight="bold">Window 3</text>
                <text x="400" y="110" fontSize="12" fill="#8B5CF6" textAnchor="middle" fontWeight="bold">Window 4</text>
                
                {/* Arrows showing progression */}
                <path d="M 150,110 L 145,115 M 150,110 L 145,105" stroke="#64748B" strokeWidth="2" fill="none"/>
                <path d="M 250,110 L 245,115 M 250,110 L 245,105" stroke="#64748B" strokeWidth="2" fill="none"/>
                <path d="M 350,110 L 345,115 M 350,110 L 345,105" stroke="#64748B" strokeWidth="2" fill="none"/>
                
                <text x="250" y="195" fontSize="12" fill="#64748B" textAnchor="middle">Time</text>
                <text x="250" y="15" fontSize="14" fontWeight="bold" fill="#1E293B" textAnchor="middle">Rolling: Equal-Sized Windows</text>
              </svg>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="comparison-section">
          <h2>Quick Comparison</h2>
          <div className="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>GARCH (1,1)</th>
                  <th>EWMA</th>
                  <th>Rolling Window</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Complexity</strong></td>
                  <td>High</td>
                  <td>Medium</td>
                  <td>Low</td>
                </tr>
                <tr>
                  <td><strong>Speed</strong></td>
                  <td>Slow</td>
                  <td>Fast</td>
                  <td>Very Fast</td>
                </tr>
                <tr>
                  <td><strong>Accuracy</strong></td>
                  <td>Highest</td>
                  <td>High</td>
                  <td>Good</td>
                </tr>
                <tr>
                  <td><strong>Memory Usage</strong></td>
                  <td>Medium</td>
                  <td>Low</td>
                  <td>Low</td>
                </tr>
                <tr>
                  <td><strong>Ideal For</strong></td>
                  <td>Professional analysis</td>
                  <td>Risk management</td>
                  <td>Quick checks</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Try It Section */}
        <section className="try-it-section">
          <h2>Ready to Analyze?</h2>
          <p>Now that you understand the models, try comparing them on real stocks!</p>
          <Link to="/" className="cta-button">Go to Analysis →</Link>
        </section>

      </div>
    </div>
  );
}

export default ModelsGuide;

