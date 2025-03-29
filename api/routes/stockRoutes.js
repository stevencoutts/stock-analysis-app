const express = require('express');
const router = express.Router();
const stockDataService = require('../services/stockDataService');
const settingsService = require('../services/settingsService');
const axios = require('axios');

router.get('/diagnose-api', async (req, res) => {
  try {
    const apiKey = await settingsService.getApiKey();
    console.log('Testing with API key:', apiKey ? apiKey.substring(0, 4) + '...' : 'Missing');

    if (!apiKey || apiKey === 'CHANGEME') {
      return res.json({
        status: 'error',
        message: 'No valid API key found in settings'
      });
    }

    // Test a single stock (AAPL) to verify API works
    const testSymbol = 'AAPL';
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${testSymbol}&apikey=${apiKey}`;
    
    console.log('Making test API call to Alpha Vantage');
    const response = await axios.get(url);
    
    if (response.data['Global Quote']) {
      return res.json({
        status: 'success',
        message: 'API key is valid and working',
        testData: response.data
      });
    } else if (response.data.Note) {
      return res.json({
        status: 'error',
        message: 'API rate limit reached',
        note: response.data.Note
      });
    } else {
      return res.json({
        status: 'error',
        message: 'Unexpected API response',
        response: response.data
      });
    }
  } catch (error) {
    console.error('Diagnostic error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      stack: error.stack
    });
  }
});

router.get('/market-overview', async (req, res) => {
  try {
    const apiKey = await settingsService.getApiKey();
    console.log('Current API Key:', apiKey ? `${apiKey.substring(0, 4)}...` : 'Missing');

    const symbols = ['AAPL', 'TSLA', 'BRK.B', 'SCT'];
    const marketData = [];

    for (const symbol of symbols) {
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        console.log(`Fetching data for ${symbol}`);
        
        const response = await axios.get(url);
        console.log(`Response for ${symbol}:`, response.data);

        if (response.data['Global Quote']) {
          const quote = response.data['Global Quote'];
          marketData.push({
            symbol,
            price: parseFloat(quote['05. price']),
            change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseInt(quote['06. volume']),
            is_real_data: true,
            fetch_time: new Date()
          });
        } else {
          console.log(`No quote data for ${symbol}, response:`, response.data);
          throw new Error('No quote data available');
        }

        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error.message);
        marketData.push({
          symbol,
          price: 100 + Math.random() * 100,
          change_percent: (Math.random() * 10 - 5).toFixed(2),
          volume: Math.floor(Math.random() * 1000000),
          is_real_data: false,
          fetch_time: new Date()
        });
      }
    }

    res.json({
      data: marketData,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Market overview error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

router.get('/stock-performance/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const history = await stockDataService.getStockHistory(symbol);
    
    res.json({
      labels: history.map(item => item.date),
      datasets: [{
        label: `${symbol} Stock Price`,
        data: history.map(item => item.price),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        fill: true
      }],
      isMock: !history[0]?.is_real_data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

module.exports = router; 