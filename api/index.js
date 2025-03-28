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

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Stock Analysis API is running' });
});

// Add a test route
app.get('/test', (req, res) => {
  res.json({ message: 'API test endpoint working' });
});

// Market Overview endpoint
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

    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN'];
    const marketData = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const response = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          
          if (!response.data['Global Quote'] || Object.keys(response.data['Global Quote']).length === 0) {
            throw new Error(`No data available for ${symbol}`);
          }

          const quote = response.data['Global Quote'];
          return {
            symbol,
            price: parseFloat(quote['05. price']).toFixed(2),
            change: quote['10. change percent'],
            volume: quote['06. volume'],
            lastTradeTime: quote['07. latest trading day']
          };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          return {
            symbol,
            error: 'Data temporarily unavailable'
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
      lastUpdated: now
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    // If we have cached data, return it with a warning
    if (marketDataCache.data) {
      res.json({
        data: marketDataCache.data,
        lastUpdated: marketDataCache.lastUpdated,
        warning: 'Using cached data due to API error'
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch market data' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 