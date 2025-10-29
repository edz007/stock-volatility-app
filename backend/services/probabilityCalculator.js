/**
 * Probability Calculator for Stock Price Changes
 * Uses t-distribution to estimate probabilities of price movements
 */

/**
 * Calculate probability that a value falls between min and max using t-distribution
 * @param {number} min - Lower bound
 * @param {number} max - Upper bound
 * @param {number} mean - Mean value
 * @param {number} stdDev - Standard deviation
 * @param {number} df - Degrees of freedom
 * @returns {number} Probability (0 to 1)
 */
function calculateTProbBetween(min, max, mean, stdDev, df) {
  if (stdDev <= 0) return 0;
  
  // Standardize the bounds
  const tMin = (min - mean) / stdDev;
  const tMax = (max - mean) / stdDev;
  
  // Calculate probabilities using t-distribution CDF
  const probMax = calculateTCDF(tMax, df);
  const probMin = calculateTCDF(tMin, df);
  
  return Math.max(0, Math.min(1, probMax - probMin));
}

/**
 * Calculate cumulative distribution function (CDF) of t-distribution
 * Uses approximation formula
 * @param {number} x - Standardized value
 * @param {number} df - Degrees of freedom
 * @returns {number} CDF value between 0 and 1
 */
function calculateTCDF(x, df) {
  if (df <= 0) return calculateNormalCDF(x); // Fallback to normal
  
  // For large degrees of freedom (>30), approximate with normal
  if (df > 30) {
    return calculateNormalCDF(x);
  }
  
  // Approximation for small df using normal with adjustment
  const t = x / Math.sqrt(df + x * x);
  const beta = calculateBetaIncomplete(0.5, df / 2, t * t);
  
  if (x < 0) {
    return 0.5 * beta;
  } else {
    return 1 - 0.5 * beta;
  }
}

/**
 * Calculate incomplete beta function (approximation)
 * Used for t-distribution CDF
 */
function calculateBetaIncomplete(a, b, x) {
  // Simple approximation using series expansion
  if (x === 0) return 0;
  if (x === 1) return 1;
  
  // Continued fraction approximation
  let bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  
  if (x < (a + 1) / (a + b + 2)) {
    return bt * betaContinuedFraction(a, b, x) / a;
  } else {
    return 1 - bt * betaContinuedFraction(b, a, 1 - x) / b;
  }
}

/**
 * Beta continued fraction
 */
function betaContinuedFraction(a, b, x) {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  
  let c = 1;
  let d = 1 - qab * x / qap;
  
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let Environmental = d;
  
  for (let m = 1; m <= 100; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    Environmental *= d * c;
    
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    Environmental *= del;
    
    if (Math.abs(del - 1) < 1e-7) break;
  }
  
  return Environmental;
}

/**
 * Log gamma function (Stirling's approximation)
 */
function logGamma(z) {
  if (z < 12) {
    return Math.log(Math.abs(gamma(z)));
  }
  
  const c = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5
  ];
  
  let ser = 1.000000000190015;
  let xx = z;
  let y = xx;
  let tmp = xx + 5.5;
  tmp -= (xx + 0.5) * Math.log(tmp);
  
  for (let j = 0; j <= 5; j++) {
    ser += c[j] / ++y;
  }
  
  return -tmp + Math.log(2.5066282746310005 * ser / xx);
}

/**
 * Gamma function (simple approximation)
 */
function gamma(z) {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  
  z -= 1;
  let x = 0.99999999999980993;
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }
  
  const t = z + p.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Calculate cumulative distribution function (CDF) of standard normal distribution
 * Using Abramowitz and Stegun approximation
 * @param {number} x - Standardized value
 * @returns {number} CDF voucher between 0 and 1
 */
function calculateNormalCDF(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

/**
 * Calculate price change probabilities for standard brackets
 * @param {number} dailyVolatility - Daily volatility (not annualized)
 * @param {number} meanReturn - Mean return
 * @param {Array} returns - Array of historical returns
 * @returns {Array} Array of probability brackets
 */
function calculatePriceChangeProbabilities(dailyVolatility, meanReturn, returns) {
  const df = Math.max(returns.length - 1, 30); // Degrees of freedom
  
  const brackets = [
    { label: 'Above +10%', min: 0.10, max: Infinity, color: 'green' },
    { label: '+5% to +10%', min: 0.05, max: 0.10, color: 'green' },
    { label: '+2% to +5%', min: 0.02, max: 0.05, color: 'green' },
    { label: '0% to +2%', min: 0, max: 0.02, color: 'green' },
    { label: '-2% to 0%', min: -0.02, max: 0, color: 'orange' },
    { label: '-5% to -2%', min: -0.05, max: -0.02, color: 'orange' },
    { label: '-10% to -5%', min: -0.10, max: -0.05, color: 'red' },
    { label: 'Below -10%', min: -Infinity, max: -0.10, color: 'red' }
  ];
  
  const probabilities = brackets.map(bracket => {
    let probability = 0;
    
    if (bracket.max === Infinity) {
      probability = 1 - calculateTCDF((bracket.min - meanReturn) / dailyVolatility, df);
    } else if (bracket.min === -Infinity) {
      probability = calculateTCDF((bracket.max - meanReturn) / dailyVolatility, df);
    } else {
      probability = calculateTProbBetween(
        bracket.min,
        bracket.max,
        meanReturn,
        dailyVolatility,
        df
      );
    }
    
    return {
      ...bracket,
      probability: probability,
      probabilityPercent: probability * 100
    };
  });
  
  return probabilities;
}

module.exports = {
  calculatePriceChangeProbabilities,
  calculateTProbBetween,
  calculateTCDF
};

