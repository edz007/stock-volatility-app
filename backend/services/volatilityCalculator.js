const math = require('mathjs');
const probabilityCalculator = require('./probabilityCalculator');

/**
 * Calculate log returns from price data
 * @param {Array} prices - Array of closing prices
 * @returns {Array} Array of log returns
 */
function calculateLogReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const logReturn = Math.log(prices[i] / prices[i - 1]);
    returns.push(logReturn);
  }
  return returns;
}

/**
 * Calculate simple returns from price data
 * @param {Array} prices - Array of closing prices
 * @returns {Array} Array of simple returns
 */
function calculateSimpleReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const simpleReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(simpleReturn);
  }
  return returns;
}

/**
 * Calculate mean of an array
 * @param {Array} data - Array of numbers
 * @returns {number} Mean value
 */
function calculateMean(data) {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

/**
 * Calculate standard deviation
 * @param {Array} data - Array of numbers
 * @param {number} mean - Mean value (optional)
 * @returns {number} Standard deviation
 */
function calculateStdDev(data, mean = null) {
  if (data.length === 0) return 0;
  const avg = mean !== null ? mean : calculateMean(data);
  const squaredDiffs = data.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * Calculate log-likelihood for GARCH model
 * @param {Array} returns - Array of returns
 * @param {Array} volatilities - Array of conditional variances
 * @returns {number} Log-likelihood value
 */
function calculateLogLikelihood(returns, volatilities) {
  let logLikelihood = 0;
  const n = Math.min(returns.length, volatilities.length);
  
  for (let i = 0; i < n; i++) {
    const variance = volatilities[i].variance;
    if (variance > 0) {
      // Log-likelihood: -0.5 * [log(2π) + log(σ²_t) + ε²_t/σ²_t]
      const term = Math.log(2 * Math.PI) + Math.log(variance) + (Math.pow(returns[i], 2) / variance);
      logLikelihood -= 0.5 * term;
    }
  }
  
  return logLikelihood;
}

/**
 * Estimate GARCH(1,1) parameters using simplified method
 * GARCH(1,1): σ²(t) = ω + α*ε²(t-1) + β*σ²(t-1)
 * This is a simplified estimation - for production use, consider Maximum Likelihood Estimation
 * 
 * @param {Array} returns - Array of returns
 * @returns {Object} GARCH parameters {omega, alpha, beta} with diagnostics
 */
function estimateGARCHParameters(returns) {
  // Newey-West HAC on a linear proxy of the variance equation:
  // r_t^2 = ω + α r_{t-1}^2 + β v_{t-1} + u_t
  // where v_{t-1} is EWMA variance proxy (λ=0.94).
  const nobs = returns.length;
  if (nobs < 30) {
    // Fallback: keep previous simplified defaults for tiny samples
    const variance = Math.pow(calculateStdDev(returns), 2);
    const omegaValue = 0.000001 * variance;
    const alphaValue = 0.1;
    const betaValue = 0.85;
    const volatilities = calculateGARCHVolatility(returns, { omega: omegaValue, alpha: alphaValue, beta: betaValue });
    const logLikelihood = calculateLogLikelihood(returns, volatilities);
    const k = 3; const aic = 2 * k - 2 * logLikelihood; const bic = k * Math.log(nobs) - 2 * logLikelihood;
    return {
      omega: omegaValue,
      alpha: alphaValue,
      beta: betaValue,
      unconditionalVariance: variance,
      diagnostics: {
        coefficients: {
          omega: { value: omegaValue, stdError: Math.abs(omegaValue) * 0.2, tStat: 0, pValue: 1 },
          alpha: { value: alphaValue, stdError: 0.2 * alphaValue, tStat: 0, pValue: 1 },
          beta:  { value: betaValue, stdError: 0.2 * betaValue,  tStat: 0, pValue: 1 }
        },
        logLikelihood, aic, bic, nobs
      }
    };
  }

  // Build design matrix X and target y
  const y = [];
  const x1 = []; // r_{t-1}^2
  const x2 = []; // ewma variance proxy v_{t-1}
  const lambda = 0.94;
  // compute EWMA variance sequence aligned to t-1
  let vPrev = Math.pow(calculateStdDev(returns), 2);
  for (let i = 0; i < nobs; i++) {
    const r2 = Math.pow(returns[i], 2);
    vPrev = lambda * vPrev + (1 - lambda) * r2; // v_t
    if (i > 0) {
      y.push(r2);
      x1.push(Math.pow(returns[i - 1], 2));
      x2.push(vPrev); // use current v as proxy for v_{t-1} (one-step lead ok for proxy)
    }
  }
  const T = y.length; // nobs-1
  const X = []; // rows of [1, x1, x2]
  for (let i = 0; i < T; i++) X.push([1, x1[i], x2[i]]);

  // OLS coefficients
  const Xt = math.transpose(X);
  const XtX = math.multiply(Xt, X);
  const XtY = math.multiply(Xt, y);
  const XtXInv = math.inv(XtX);
  const betaHat = math.multiply(XtXInv, XtY); // [omega, alpha, beta]

  const omegaValue = Math.max(0, betaHat[0]);
  const alphaValue = Math.max(0, betaHat[1]);
  const betaValue  = Math.max(0, betaHat[2]);

  // Residuals
  const residuals = [];
  for (let i = 0; i < T; i++) {
    const yhat = betaHat[0] + betaHat[1] * x1[i] + betaHat[2] * x2[i];
    residuals.push(y[i] - yhat);
  }

  // Newey-West HAC covariance
  const maxLag = Math.max(1, Math.floor(4 * Math.pow(T / 100, 2 / 9))); // Andrews rule-of-thumb
  const S = hacCovariance(X, residuals, maxLag);
  const varBeta = math.multiply(XtXInv, math.multiply(S, XtXInv));
  const seOmega = Math.sqrt(varBeta[0][0]);
  const seAlpha = Math.sqrt(varBeta[1][1]);
  const seBeta  = Math.sqrt(varBeta[2][2]);

  const tOmega = omegaValue / (seOmega || 1e-12);
  const tAlpha = alphaValue / (seAlpha || 1e-12);
  const tBeta  = betaValue  / (seBeta  || 1e-12);

  const volatilities = calculateGARCHVolatility(returns, { omega: omegaValue, alpha: alphaValue, beta: betaValue });
  const logLikelihood = calculateLogLikelihood(returns, volatilities);
  
  // Calculate p-values (two-tailed t-test, df = nobs - 3)
  const df = Math.max(nobs - 3, 1);
  const pValueOmega = Math.max(0, Math.min(1, 2 * (1 - probabilityCalculator.calculateTCDF(Math.abs(tOmega), df))));
  const pValueAlpha = Math.max(0, Math.min(1, 2 * (1 - probabilityCalculator.calculateTCDF(Math.abs(tAlpha), df))));
  const pValueBeta = Math.max(0, Math.min(1, 2 * (1 - probabilityCalculator.calculateTCDF(Math.abs(tBeta), df))));
  
  // Calculate AIC and BIC
  const k = 3; // number of parameters (omega, alpha, beta)
  const aic = 2 * k - 2 * logLikelihood;
  const bic = k * Math.log(nobs) - 2 * logLikelihood;
  
  const variance = Math.pow(calculateStdDev(returns), 2);
  return {
    omega: omegaValue,
    alpha: alphaValue,
    beta: betaValue,
    unconditionalVariance: variance,
    diagnostics: {
      coefficients: {
        omega: {
          value: omegaValue,
          stdError: seOmega,
          tStat: tOmega,
          pValue: pValueOmega
        },
        alpha: {
          value: alphaValue,
          stdError: seAlpha,
          tStat: tAlpha,
          pValue: pValueAlpha
        },
        beta: {
          value: betaValue,
          stdError: seBeta,
          tStat: tBeta,
          pValue: pValueBeta
        }
      },
      logLikelihood: logLikelihood,
      aic: aic,
      bic: bic,
      nobs: nobs
    }
  };
}

/**
 * Calculate cumulative distribution function (CDF) of standard normal distribution
 * Using approximation formula
 * @param {number} x - Standardized value
 * @returns {number} CDF value between 0 and 1
 */
function calculateNormalCDF(x) {
  // Abramowitz and Stegun approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

/**
 * Newey-West HAC covariance of OLS estimator
 * @param {Array<Array<number>>} X - design matrix rows
 * @param {Array<number>} e - residuals
 * @param {number} L - max lag
 * @returns {Array<Array<number>>} S matrix
 */
function hacCovariance(X, e, L) {
  const T = e.length;
  const k = X[0].length;
  const Xt = math.transpose(X);
  // Base: sum_t e_t^2 x_t x_t'
  let S = math.zeros(k, k);
  for (let t = 0; t < T; t++) {
    const xt = math.matrix([X[t]]); // 1 x k
    const xtT = math.transpose(xt); // k x 1
    const add = math.multiply(xtT, math.multiply(e[t] * e[t], xt));
    S = math.add(S, add);
  }
  // Add weighted autocovariances
  for (let l = 1; l <= L; l++) {
    const w = 1 - l / (L + 1);
    let Gamma = math.zeros(k, k);
    for (let t = l; t < T; t++) {
      const xt = math.matrix([X[t]]);      // 1 x k
      const xtl = math.matrix([X[t - l]]); // 1 x k
      const add = math.multiply(math.transpose(xt), math.multiply(e[t] * e[t - l], xtl)); // k x k
      Gamma = math.add(Gamma, add);
    }
    const term = math.add(Gamma, math.transpose(Gamma));
    S = math.add(S, math.multiply(w, term));
  }
  return S;
}

/**
 * Calculate GARCH volatility series
 * @param {Array} returns - Array of returns
 * @param {Object} params - GARCH parameters {omega, alpha, beta}
 * @returns {Array} Array of conditional variances (volatility squared)
 */
function calculateGARCHVolatility(returns, params) {
  const { omega, alpha, beta } = params;
  const volatilities = [];
  
  // Initialize with unconditional variance
  const unconditionalVar = omega / (1 - alpha - beta);
  let prevVariance = unconditionalVar;
  
  for (let i = 0; i < returns.length; i++) {
    // GARCH(1,1): σ²(t) = ω + α*ε²(t-1) + β*σ²(t-1)
    const squaredReturn = i > 0 ? Math.pow(returns[i - 1], 2) : unconditionalVar;
    const variance = omega + alpha * squaredReturn + beta * prevVariance;
    
    volatilities.push({
      variance: variance,
      volatility: Math.sqrt(variance),
      // Annualized volatility (assuming 252 trading days)
      annualizedVolatility: Math.sqrt(variance * 252)
    });
    
    prevVariance = variance;
  }
  
  return volatilities;
}

/**
 * Calculate exponentially weighted moving average (EWMA) volatility
 * Alternative to GARCH that's simpler but still effective
 * @param {Array} returns - Array of returns
 * @param {number} lambda - Decay factor (typically 0.94)
 * @returns {Array} Array of EWMA volatilities
 */
function calculateEWMAVolatility(returns, lambda = 0.94) {
  const volatilities = [];
  
  // Initialize with sample variance
  const initialVariance = Math.pow(calculateStdDev(returns), 2);
  let prevVariance = initialVariance;
  
  for (let i = 0; i < returns.length; i++) {
    const squaredReturn = Math.pow(returns[i], 2);
    // EWMA: σ²(t) = λ*σ²(t-1) + (1-λ)*ε²(t)
    const variance = lambda * prevVariance + (1 - lambda) * squaredReturn;
    
    volatilities.push({
      variance: variance,
      volatility: Math.sqrt(variance),
      annualizedVolatility: Math.sqrt(variance * 252)
    });
    
    prevVariance = variance;
  }
  
  return volatilities;
}

/**
 * Calculate rolling window volatility
 * @param {Array} returns - Array of returns
 * @param {number} window - Window size in days
 * @returns {Array} Array of rolling volatilities
 */
function calculateRollingVolatility(returns, window = 20) {
  const volatilities = [];
  
  for (let i = 0; i < returns.length; i++) {
    if (i < window - 1) {
      // Not enough data yet, use what we have
      const subset = returns.slice(0, i + 1);
      const stdDev = calculateStdDev(subset);
      volatilities.push({
        volatility: stdDev,
        annualizedVolatility: stdDev * Math.sqrt(252)
      });
    } else {
      const subset = returns.slice(i - window + 1, i + 1);
      const stdDev = calculateStdDev(subset);
      volatilities.push({
        volatility: stdDev,
        annualizedVolatility: stdDev * Math.sqrt(252)
      });
    }
  }
  
  return volatilities;
}

/**
 * Main function to calculate volatility with multiple methods
 * @param {Array} historicalData - Array of historical price data with dates
 * @param {string} method - Volatility calculation method ('garch', 'ewma', 'rolling')
 * @returns {Object} Volatility analysis results
 */
function analyzeVolatility(historicalData, method = 'garch') {
  // Extract closing prices
  const prices = historicalData.map(d => d.close);
  const dates = historicalData.map(d => d.date);
  
  // Calculate returns
  const returns = calculateLogReturns(prices);
  const simpleReturns = calculateSimpleReturns(prices);
  
  // Calculate basic statistics
  const meanReturn = calculateMean(returns);
  const stdDevReturn = calculateStdDev(returns, meanReturn);
  const annualizedReturn = meanReturn * 252;
  const annualizedVolatility = stdDevReturn * Math.sqrt(252);
  
  let volatilityData = [];
  let parameters = null;
  
  // Calculate volatility based on method
  switch (method.toLowerCase()) {
    case 'garch':
      parameters = estimateGARCHParameters(returns);
      volatilityData = calculateGARCHVolatility(returns, parameters);
      break;
    case 'ewma':
      volatilityData = calculateEWMAVolatility(returns);
      break;
    case 'rolling':
      volatilityData = calculateRollingVolatility(returns, 20);
      break;
    default:
      parameters = estimateGARCHParameters(returns);
      volatilityData = calculateGARCHVolatility(returns, parameters);
  }
  
  // Combine with dates (skip first date since we lose one observation for returns)
  const volatilityTimeSeries = volatilityData.map((vol, i) => ({
    date: dates[i + 1],
    price: prices[i + 1],
    return: returns[i],
    ...vol
  }));
  
  // Calculate current volatility (last value)
  const currentVolatility = volatilityData[volatilityData.length - 1];

  // Probability brackets using daily (not annualized) volatility
  let probabilityBrackets = null;
  try {
    if (currentVolatility && typeof currentVolatility.volatility === 'number') {
      probabilityBrackets = probabilityCalculator.calculatePriceChangeProbabilities(
        currentVolatility.volatility, // daily sigma
        meanReturn,                   // daily mean
        returns
      );
    }
  } catch (e) {
    // keep API resilient; omit probabilities on failure
    probabilityBrackets = null;
  }
  
  return {
    symbol: historicalData[0]?.symbol || 'UNKNOWN',
    method: method,
    statistics: {
      meanReturn: meanReturn,
      stdDevReturn: stdDevReturn,
      annualizedReturn: annualizedReturn,
      annualizedVolatility: annualizedVolatility,
      currentVolatility: currentVolatility.annualizedVolatility,
      minVolatility: Math.min(...volatilityData.map(v => v.annualizedVolatility)),
      maxVolatility: Math.max(...volatilityData.map(v => v.annualizedVolatility))
    },
    parameters: parameters,
    diagnostics: parameters?.diagnostics || null,
    timeSeries: volatilityTimeSeries,
    probabilities: probabilityBrackets,
    dataPoints: volatilityTimeSeries.length
  };
}

module.exports = {
  calculateLogReturns,
  calculateSimpleReturns,
  calculateMean,
  calculateStdDev,
  estimateGARCHParameters,
  calculateGARCHVolatility,
  calculateEWMAVolatility,
  calculateRollingVolatility,
  analyzeVolatility
};

