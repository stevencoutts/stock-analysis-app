const { fetchHistoricalData } = require('./stockData');

/**
 * Analyze a stock based on historical data
 * @param {Object} stock - Stock object
 * @param {String} analysisType - Type of analysis (technical, fundamental, sentiment, custom)
 * @param {String} timeframe - Timeframe for analysis (1d, 1w, 1m, 3m, 6m, 1y, 5y)
 * @returns {Object} Analysis results
 */
exports.analyzeStock = async (stock, analysisType, timeframe) => {
  try {
    // Fetch historical data for the stock
    const historicalData = await fetchHistoricalData(stock.symbol, timeframe);
    
    let results = {};
    let buySignal = false;
    let sellSignal = false;
    let signalStrength = null;
    let targetPrice = null;
    let stopLoss = null;
    
    switch (analysisType) {
      case 'technical':
        const technicalAnalysis = performTechnicalAnalysis(historicalData);
        results = technicalAnalysis.results;
        buySignal = technicalAnalysis.buySignal;
        sellSignal = technicalAnalysis.sellSignal;
        signalStrength = technicalAnalysis.signalStrength;
        targetPrice = technicalAnalysis.targetPrice;
        stopLoss = technicalAnalysis.stopLoss;
        break;
        
      case 'fundamental':
        // In a real app, you would perform fundamental analysis
        results = {
          message: 'Fundamental analysis is a placeholder in this demo'
        };
        break;
        
      case 'sentiment':
        // In a real app, you would analyze sentiment data
        results = {
          message: 'Sentiment analysis is a placeholder in this demo'
        };
        break;
        
      case 'custom':
        // In a real app, you would apply custom analysis criteria
        results = {
          message: 'Custom analysis is a placeholder in this demo'
        };
        break;
        
      default:
        throw new Error('Invalid analysis type');
    }
    
    return {
      results,
      buySignal,
      sellSignal,
      signalStrength,
      targetPrice,
      stopLoss
    };
  } catch (error) {
    console.error(`Error analyzing stock ${stock.symbol}:`, error);
    throw new Error('Failed to analyze stock');
  }
};

/**
 * Perform technical analysis on historical stock data
 * @param {Array} historicalData - Array of historical price data
 * @returns {Object} Technical analysis results
 */
function performTechnicalAnalysis(historicalData) {
  // Calculate various technical indicators
  const sma20 = calculateSMA(historicalData, 20);
  const sma50 = calculateSMA(historicalData, 50);
  const sma200 = calculateSMA(historicalData, 200);
  
  const rsi = calculateRSI(historicalData, 14);
  const macd = calculateMACD(historicalData);
  
  // Get latest price
  const latestPrice = historicalData[historicalData.length - 1].close;
  
  // Determine buy/sell signals based on indicators
  let buySignal = false;
  let sellSignal = false;
  let signalStrength = null;
  
  // Simple moving average crossover strategy
  const sma20Latest = sma20[sma20.length - 1];
  const sma50Latest = sma50[sma50.length - 1];
  const sma200Latest = sma200[sma200.length - 1];
  
  const rsiLatest = rsi[rsi.length - 1];
  const macdLatest = macd.macdLine[macd.macdLine.length - 1];
  const signalLatest = macd.signalLine[macd.signalLine.length - 1];
  const histogramLatest = macd.histogram[macd.histogram.length - 1];
  
  // Simple buy/sell signals
  // Buy: Price > SMA200, SMA20 > SMA50, RSI < 70, MACD > Signal Line
  // Sell: Price < SMA200, SMA20 < SMA50, RSI > 30, MACD < Signal Line
  
  if (latestPrice > sma200Latest && sma20Latest > sma50Latest && rsiLatest < 70 && macdLatest > signalLatest) {
    buySignal = true;
    sellSignal = false;
    
    // Determine signal strength
    if (rsiLatest > 50 && rsiLatest < 60 && histogramLatest > 0.5) {
      signalStrength = 'strong';
    } else if (rsiLatest >= 60 && rsiLatest < 70) {
      signalStrength = 'moderate';
    } else {
      signalStrength = 'weak';
    }
  } else if (latestPrice < sma200Latest && sma20Latest < sma50Latest && rsiLatest > 30 && macdLatest < signalLatest) {
    buySignal = false;
    sellSignal = true;
    
    // Determine signal strength
    if (rsiLatest < 50 && rsiLatest > 40 && histogramLatest < -0.5) {
      signalStrength = 'strong';
    } else if (rsiLatest <= 40 && rsiLatest > 30) {
      signalStrength = 'moderate';
    } else {
      signalStrength = 'weak';
    }
  }
  
  // Calculate target price and stop loss (simplified for demo)
  const targetPrice = buySignal ? latestPrice * 1.1 : null; // 10% profit target
  const stopLoss = buySignal ? latestPrice * 0.95 : null;   // 5% stop loss
  
  return {
    results: {
      sma: {
        sma20: sma20Latest,
        sma50: sma50Latest,
        sma200: sma200Latest
      },
      rsi: rsiLatest,
      macd: {
        macdLine: macdLatest,
        signalLine: signalLatest,
        histogram: histogramLatest
      },
      price: latestPrice
    },
    buySignal,
    sellSignal,
    signalStrength,
    targetPrice: targetPrice ? roundToTwo(targetPrice) : null,
    stopLoss: stopLoss ? roundToTwo(stopLoss) : null
  };
}

// Technical indicator calculations
function calculateSMA(data, period) {
  const sma = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      sma.push(roundToTwo(sum / period));
    }
  }
  
  return sma;
}

function calculateRSI(data, period) {
  const rsi = [];
  let gains = 0;
  let losses = 0;
  
  // First, calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Calculate RSI for the initial period
  let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
  let rsiValue = 100 - (100 / (1 + rs));
  rsi.push(roundToTwo(rsiValue));
  
  // Calculate RSI for the rest of the data
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    let currentGain = 0;
    let currentLoss = 0;
    
    if (change >= 0) {
      currentGain = change;
    } else {
      currentLoss = Math.abs(change);
    }
    
    // Use Wilder's smoothing method
    avgGain = ((avgGain * (period - 1)) + currentGain) / period;
    avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
    
    rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
    rsiValue = 100 - (100 / (1 + rs));
    rsi.push(roundToTwo(rsiValue));
  }
  
  // Pad the beginning with nulls to match the data length
  const padding = data.length - rsi.length;
  return Array(padding).fill(null).concat(rsi);
}

function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  // Calculate EMA for fast period
  const fastEMA = calculateEMA(data, fastPeriod);
  
  // Calculate EMA for slow period
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line
  const macdLine = fastEMA.map((fast, i) => {
    if (fast === null || slowEMA[i] === null) return null;
    return roundToTwo(fast - slowEMA[i]);
  });
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMAFromValues(macdLine, signalPeriod);
  
  // Calculate histogram (MACD line - signal line)
  const histogram = macdLine.map((macd, i) => {
    if (macd === null || signalLine[i] === null) return null;
    return roundToTwo(macd - signalLine[i]);
  });
  
  return {
    macdLine,
    signalLine,
    histogram
  };
}

function calculateEMA(data, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first EMA value
  let smaTotal = 0;
  for (let i = 0; i < period; i++) {
    smaTotal += data[i].close;
  }
  
  let firstEMA = smaTotal / period;
  ema.push(firstEMA);
  
  // Calculate EMA values
  for (let i = 1; i < data.length - period + 1; i++) {
    const currentPrice = data[i + period - 1].close;
    const currentEMA = (currentPrice - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(roundToTwo(currentEMA));
  }
  
  // Pad the beginning with nulls to match the data length
  const padding = data.length - ema.length;
  return Array(padding).fill(null).concat(ema);
}

function calculateEMAFromValues(values, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // Filter out null values for initial calculation
  const validValues = values.filter(value => value !== null);
  
  // If not enough valid values, return all nulls
  if (validValues.length < period) {
    return Array(values.length).fill(null);
  }
  
  // Start with SMA for the first EMA value
  let smaTotal = 0;
  let startIndex = values.findIndex(value => value !== null);
  
  for (let i = startIndex; i < startIndex + period; i++) {
    smaTotal += values[i];
  }
  
  let firstEMA = smaTotal / period;
  ema.push(firstEMA);
  
  // Calculate EMA values
  for (let i = startIndex + period; i < values.length; i++) {
    if (values[i] === null) {
      ema.push(null);
    } else {
      const currentEMA = (values[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(roundToTwo(currentEMA));
    }
  }
  
  // Pad the beginning with nulls to match the data length
  return Array(startIndex + period).fill(null).concat(ema);
}

function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
} 