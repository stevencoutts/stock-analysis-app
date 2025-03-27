const axios = require('axios');

/**
 * Fetch stock data from external API
 * Note: In a real application, you'd use a proper API with an API key
 * For this example, we'll simulate fetching data
 */
exports.fetchStockData = async (symbol) => {
  try {
    // In a real app, you would make an API call like this:
    // const response = await axios.get(`https://api.example.com/stocks/${symbol}?apikey=${process.env.STOCK_API_KEY}`);
    // return response.data;
    
    // For this example, we'll return mock data
    return {
      symbol: symbol.toUpperCase(),
      name: getMockCompanyName(symbol),
      exchange: 'NASDAQ',
      sector: 'Technology',
      industry: 'Software',
      price: getRandomPrice(),
      priceChange: getRandomChange(),
      percentChange: getRandomPercentChange(),
      volume: getRandomVolume(),
      marketCap: getRandomMarketCap()
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    throw new Error('Failed to fetch stock data');
  }
};

/**
 * Fetch historical stock data
 */
exports.fetchHistoricalData = async (symbol, timeframe = '1y') => {
  try {
    // In a real app, you would make an API call
    // For this example, we'll generate mock historical data
    const days = timeframeTodays(timeframe);
    const today = new Date();
    
    const data = [];
    let basePrice = getRandomPrice();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Add some random variation to price
      basePrice = basePrice * (1 + (Math.random() * 0.06 - 0.03));
      
      data.push({
        date: date.toISOString().split('T')[0],
        open: roundToTwo(basePrice * (1 + (Math.random() * 0.02 - 0.01))),
        high: roundToTwo(basePrice * (1 + (Math.random() * 0.03))),
        low: roundToTwo(basePrice * (1 - (Math.random() * 0.03))),
        close: roundToTwo(basePrice),
        volume: Math.floor(Math.random() * 10000000) + 500000
      });
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw new Error('Failed to fetch historical data');
  }
};

// Helper functions for mock data
function getRandomPrice() {
  return roundToTwo(Math.random() * 1000 + 10);
}

function getRandomChange() {
  return roundToTwo((Math.random() * 20) - 10);
}

function getRandomPercentChange() {
  return roundToTwo((Math.random() * 10) - 5);
}

function getRandomVolume() {
  return Math.floor(Math.random() * 10000000) + 100000;
}

function getRandomMarketCap() {
  return Math.floor(Math.random() * 1000000000000) + 1000000000;
}

function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function timeframeTodays(timeframe) {
  switch(timeframe) {
    case '1d': return 1;
    case '1w': return 7;
    case '1m': return 30;
    case '3m': return 90;
    case '6m': return 180;
    case '1y': return 365;
    case '5y': return 1825;
    default: return 365;
  }
}

function getMockCompanyName(symbol) {
  const mockCompanies = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'AMZN': 'Amazon.com Inc.',
    'GOOGL': 'Alphabet Inc.',
    'META': 'Meta Platforms Inc.',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corporation',
    'JPM': 'JPMorgan Chase & Co.',
    'V': 'Visa Inc.',
    'JNJ': 'Johnson & Johnson'
  };
  
  return mockCompanies[symbol.toUpperCase()] || `${symbol.toUpperCase()} Corporation`;
} 