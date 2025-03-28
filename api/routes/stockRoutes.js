const express = require('express');
const router = express.Router();
const stockDataService = require('../services/stockDataService');

router.get('/market-overview', async (req, res) => {
  try {
    const symbols = ['AAPL', 'TSLA', 'BRK.B', 'SCT'];
    const marketData = await Promise.all(
      symbols.map(symbol => stockDataService.getLatestStockPrice(symbol))
    );
    
    res.json({
      data: marketData,
      lastUpdated: new Date()
    });
  } catch (error) {
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