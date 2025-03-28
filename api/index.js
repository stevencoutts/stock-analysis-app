const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Cache for market data
let marketDataCache = {
  data: null,
  lastUpdated: null
};

// Add mock fallback data
const mockMarketData = {
  'AAPL': { price: '178.72', change: '+1.23%', volume: '52436800' },
  'TSLA': { price: '246.53', change: '-0.89%', volume: '31550200' },
  'BRK.B': { price: '362.14', change: '+0.54%', volume: '3421600' },
  'SCT.L': { price: '1456.00', change: '+0.76%', volume: '124300' }
};

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Stock Analysis API is running' });
});

// Add a test route
app.get('/test', (req, res) => {
  res.json({ message: 'API test endpoint working' });
});

// Market Overview endpoint with better error handling
app.get('/api/market-overview', async (req, res) => {
  try {
    const now = new Date();
    // Return cached data if it's less than 5 minutes old
    if (marketDataCache.data && marketDataCache.lastUpdated && 
        (now - marketDataCache.lastUpdated) < 300000) {
      return res.json({
        data: marketDataCache.data,
        lastUpdated: marketDataCache.lastUpdated
      });
    }

    const symbols = ['AAPL', 'TSLA', 'BRK.B', 'SCT.L']; // Try London Stock Exchange format
    
    // Try to fetch real data
    try {
      const marketData = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const response = await axios.get(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
              { timeout: 5000 } // Add timeout
            );
            
            if (response.data['Global Quote'] && Object.keys(response.data['Global Quote']).length > 0) {
              const quote = response.data['Global Quote'];
              return {
                symbol,
                price: parseFloat(quote['05. price']).toFixed(2),
                change: quote['10. change percent'],
                volume: quote['06. volume'],
                realData: true
              };
            }
            throw new Error(`No data available for ${symbol}`);
          } catch (error) {
            console.log(`Error fetching data for ${symbol}, using mock data: ${error.message}`);
            // Return mock data if API fails
            return {
              symbol,
              price: mockMarketData[symbol].price,
              change: mockMarketData[symbol].change,
              volume: mockMarketData[symbol].volume,
              realData: false
            };
          }
        })
      );

      marketDataCache = {
        data: marketData,
        lastUpdated: now
      };

      res.json({
        data: marketData,
        lastUpdated: now,
        partialMock: marketData.some(item => !item.realData)
      });
    } catch (fetchError) {
      console.error('Error fetching all market data:', fetchError);
      
      // Use all mock data if everything fails
      const fallbackData = symbols.map(symbol => ({
        symbol,
        price: mockMarketData[symbol].price,
        change: mockMarketData[symbol].change,
        volume: mockMarketData[symbol].volume,
        realData: false
      }));
      
      res.json({
        data: fallbackData,
        lastUpdated: now,
        allMock: true
      });
    }
  } catch (error) {
    console.error('Error in market overview endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Similar approach for stock performance endpoint
app.get('/api/stock-performance/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Generate mock stock data if real API fails
    const generateMockStockData = () => {
      const days = 30;
      const today = new Date();
      const startPrice = {
        'AAPL': 170,
        'TSLA': 240,
        'BRK.B': 360,
        'SCT.L': 1450
      }[symbol] || 100;
      
      const labels = [];
      const prices = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        labels.push(date.toISOString().split('T')[0]);
        
        // Create slightly random price movements
        const changePercent = (Math.random() * 2 - 1) * 0.02; // -1% to +1%
        const newPrice = i === days - 1 ? 
          startPrice : 
          prices[prices.length - 1] * (1 + changePercent);
        
        prices.push(parseFloat(newPrice.toFixed(2)));
      }
      
      return {
        labels,
        datasets: [{
          label: `${symbol} Stock Price (Mock Data)`,
          data: prices,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true
        }]
      };
    };
    
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
        { timeout: 5000 }
      );

      if (response.data['Time Series (Daily)']) {
        const timeSeriesData = response.data['Time Series (Daily)'];
        const formattedData = Object.entries(timeSeriesData)
          .slice(0, 30)
          .reverse()
          .map(([date, values]) => ({
            date,
            price: parseFloat(values['4. close'])
          }));

        const chartData = {
          labels: formattedData.map(item => item.date),
          datasets: [{
            label: `${symbol} Stock Price`,
            data: formattedData.map(item => item.price),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true
          }]
        };

        res.json(chartData);
      } else {
        throw new Error('No time series data available');
      }
    } catch (apiError) {
      console.log(`Failed to get real data for ${symbol}, using mock data:`, apiError.message);
      res.json(generateMockStockData());
    }
  } catch (error) {
    console.error(`Error in stock performance endpoint:`, error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 