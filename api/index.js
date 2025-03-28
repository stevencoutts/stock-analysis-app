const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Log API key configuration
console.log('Alpha Vantage API Key configuration:');
console.log('- API key set:', !!ALPHA_VANTAGE_API_KEY);
console.log('- API key first 4 chars:', ALPHA_VANTAGE_API_KEY ? ALPHA_VANTAGE_API_KEY.substring(0, 4) : 'NONE');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Helper function to read cached data
const readCachedData = (filename) => {
  try {
    const filePath = path.join(dataDir, filename);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    }
  } catch (err) {
    console.error(`Error reading cached data (${filename}):`, err);
  }
  return null;
};

// Helper function to write cached data
const writeCachedData = (filename, data) => {
  try {
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data));
  } catch (err) {
    console.error(`Error writing cached data (${filename}):`, err);
  }
};

// Check if market is open (simplified - just checks weekday and time)
const isMarketOpen = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  
  // Market closed on weekends (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) return false;
  
  // Simple check for market hours (9:30 AM - 4:00 PM EST)
  // Note: This is a simplified check and doesn't account for holidays
  return (hour >= 9 && hour < 16);
};

// Mock data for fallback
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

// Market Overview endpoint
app.get('/api/market-overview', async (req, res) => {
  try {
    const symbols = ['AAPL', 'TSLA', 'BRK.B', 'SCT.L'];
    const now = new Date();
    const cachedData = readCachedData('market-overview.json');
    const forceRefresh = req.query.refresh === 'true';
    
    // Use cached data if it exists and is recent enough
    if (cachedData && !forceRefresh) {
      const lastUpdated = new Date(cachedData.lastUpdated);
      const cacheAge = now - lastUpdated;
      
      // Different cache TTLs based on market state:
      // - 5 minutes if market is open
      // - 3 hours if market is closed
      // - 24 hours on weekends
      const maxCacheAge = isMarketOpen() ? 300000 : 
                         (now.getDay() === 0 || now.getDay() === 6) ? 86400000 : 10800000;
      
      if (cacheAge < maxCacheAge) {
        return res.json(cachedData);
      }
    }
    
    // If we need to refresh data
    const marketData = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          // Check if we have recent individual stock data cached
          const stockCacheFile = `stock-${symbol}.json`;
          const stockCache = readCachedData(stockCacheFile);
          
          if (stockCache && !forceRefresh) {
            const lastUpdated = new Date(stockCache.lastUpdated);
            const stockCacheAge = now - lastUpdated;
            const maxStockCacheAge = isMarketOpen() ? 300000 : 10800000;
            
            if (stockCacheAge < maxStockCacheAge) {
              return {
                symbol,
                ...stockCache.data,
                cachedData: true
              };
            }
          }
          
          // Fetch fresh data if needed
          const response = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
            { timeout: 5000 }
          );
          
          if (response.data['Global Quote'] && Object.keys(response.data['Global Quote']).length > 0) {
            const quote = response.data['Global Quote'];
            const stockData = {
              price: parseFloat(quote['05. price']).toFixed(2),
              change: quote['10. change percent'],
              volume: quote['06. volume'],
              realData: true
            };
            
            // Cache individual stock data
            writeCachedData(stockCacheFile, {
              data: stockData,
              lastUpdated: now
            });
            
            return {
              symbol,
              ...stockData
            };
          }
          throw new Error(`No data available for ${symbol}`);
        } catch (error) {
          console.log(`Error fetching data for ${symbol}, using cached or mock data: ${error.message}`);
          
          // Try to use previously cached data even if it's old
          const stockCacheFile = `stock-${symbol}.json`;
          const oldCache = readCachedData(stockCacheFile);
          
          if (oldCache) {
            return {
              symbol,
              ...oldCache.data,
              cachedData: true,
              staleData: true
            };
          }
          
          // Fall back to mock data if no cached data exists
          return {
            symbol,
            price: mockMarketData[symbol].price,
            change: mockMarketData[symbol].change,
            volume: mockMarketData[symbol].volume,
            realData: false,
            mockData: true
          };
        }
      })
    );
    
    const responseData = {
      data: marketData,
      lastUpdated: now,
      marketOpen: isMarketOpen(),
      cachingEnabled: true
    };
    
    // Cache the full response
    writeCachedData('market-overview.json', responseData);
    
    res.json(responseData);
  } catch (error) {
    console.error('Error in market overview endpoint:', error);
    
    // Try to return cached data even if it's old
    const cachedData = readCachedData('market-overview.json');
    if (cachedData) {
      return res.json({
        ...cachedData,
        error: 'Using stale cached data due to an error',
        errorMessage: error.message
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Stock Performance endpoint 
app.get('/api/stock-performance/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const forceRefresh = req.query.refresh === 'true';
    const now = new Date();
    const cacheFilename = `performance-${symbol}.json`;
    const cachedData = readCachedData(cacheFilename);
    
    // Use cached data if available and recent enough
    if (cachedData && !forceRefresh) {
      const lastUpdated = new Date(cachedData.lastUpdated);
      const cacheAge = now - lastUpdated;
      
      // Cache TTLs: 10min if market open, 12h if closed, 24h on weekends
      const maxCacheAge = isMarketOpen() ? 600000 : 
                         (now.getDay() === 0 || now.getDay() === 6) ? 86400000 : 43200000;
      
      if (cacheAge < maxCacheAge) {
        return res.json(cachedData.data);
      }
    }
    
    // Fetch fresh data from API
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
        
        // Cache the data
        writeCachedData(cacheFilename, {
          data: chartData,
          lastUpdated: now
        });

        res.json(chartData);
      } else {
        throw new Error('No time series data available');
      }
    } catch (apiError) {
      console.log(`Failed to get real data for ${symbol}, using cached or mock data:`, apiError.message);
      
      // Try to use cached data even if it's old
      if (cachedData) {
        return res.json({
          ...cachedData.data,
          note: 'Using cached data due to API error'
        });
      }
      
      // Generate mock data as last resort
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
      
      const mockData = generateMockStockData();
      
      // Cache the mock data
      writeCachedData(cacheFilename, {
        data: mockData,
        lastUpdated: now,
        isMock: true
      });
      
      res.json(mockData);
    }
  } catch (error) {
    console.error(`Error in stock performance endpoint:`, error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// Add this diagnostic endpoint to your API
app.get('/api/diagnosis', async (req, res) => {
  try {
    const symbols = ['AAPL', 'TSLA', 'BRK.B', 'SCT.L'];
    const results = {};
    
    // Helper function to check API response
    const checkApiResponse = async (symbol) => {
      try {
        console.log(`Testing API call for ${symbol} at ${new Date().toISOString()}`);
        
        const response = await axios.get(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`,
          { timeout: 5000 }
        );
        
        // Check for rate limit indicators
        if (response.data.Note && response.data.Note.includes('call frequency')) {
          console.error('API RATE LIMIT DETECTED:', response.data.Note);
          return {
            success: false,
            error: 'RATE_LIMIT',
            message: response.data.Note
          };
        }
        
        // Check for information messages
        if (response.data.Information) {
          console.warn('API INFORMATION:', response.data.Information);
          return {
            success: false,
            error: 'INFO_MESSAGE',
            message: response.data.Information
          };
        }
        
        // Check if we got actual stock data
        if (response.data['Global Quote'] && Object.keys(response.data['Global Quote']).length > 0) {
          return {
            success: true,
            data: response.data['Global Quote']
          };
        }
        
        console.error('API returned unexpected format:', response.data);
        return {
          success: false,
          error: 'UNKNOWN_FORMAT',
          message: 'API returned unexpected data format'
        };
      } catch (error) {
        console.error('API call error:', error.message);
        return {
          success: false,
          error: 'REQUEST_FAILED',
          message: error.message
        };
      }
    };
    
    // Check each symbol
    for (const symbol of symbols) {
      results[symbol] = await checkApiResponse(symbol);
    }
    
    // Check API key validity
    try {
      const keyCheckResponse = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=compact`,
        { timeout: 5000 }
      );
      
      if (keyCheckResponse.data.Note || keyCheckResponse.data.Information) {
        results.keyStatus = {
          valid: false,
          message: keyCheckResponse.data.Note || keyCheckResponse.data.Information
        };
      } else {
        results.keyStatus = {
          valid: true,
          message: 'API key appears to be working'
        };
      }
    } catch (error) {
      results.keyStatus = {
        valid: false,
        message: `Error checking API key: ${error.message}`
      };
    }
    
    // Add environment info
    results.environment = {
      apiKey: ALPHA_VANTAGE_API_KEY ? `${ALPHA_VANTAGE_API_KEY.substring(0, 4)}...` : 'Not set',
      nodeEnv: process.env.NODE_ENV,
      serverTime: new Date().toISOString()
    };
    
    res.json({
      diagnosis: results,
      summary: {
        workingSymbols: Object.keys(results)
          .filter(key => key !== 'keyStatus' && key !== 'environment')
          .filter(symbol => results[symbol].success)
          .join(', '),
        isRateLimited: Object.values(results)
          .some(result => result.error === 'RATE_LIMIT'),
        isKeyValid: results.keyStatus.valid
      }
    });
  } catch (error) {
    console.error('Diagnosis endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to run diagnosis',
      message: error.message 
    });
  }
});

// Add a test endpoint for the Alpha Vantage API key
app.get('/api/test-key', async (req, res) => {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'API key is not configured' 
      });
    }
    
    console.log('Testing API key:', ALPHA_VANTAGE_API_KEY);
    
    // Make a simple API call to test the key
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    console.log('Test key response:', response.data);
    
    if (response.data.Note && response.data.Note.includes('Invalid API call')) {
      return res.json({ 
        success: false, 
        message: 'Invalid API key or usage', 
        details: response.data.Note 
      });
    }
    
    if (response.data['Global Quote']) {
      return res.json({ 
        success: true, 
        message: 'API key is valid and working', 
        price: response.data['Global Quote']['05. price'] 
      });
    }
    
    res.json({ 
      success: false,
      message: 'Unknown API response format',
      data: response.data
    });
  } catch (error) {
    console.error('Error testing API key:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error testing API key: ${error.message}` 
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 