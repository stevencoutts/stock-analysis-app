const express = require('express');
const router = express.Router();
const { Stock, StockAnalysis, WatchList } = require('../models');
const { auth, isAdmin } = require('../middleware/auth');
const { analyzeStock } = require('../services/stockAnalysis');
const { fetchStockData } = require('../services/stockData');

// Get all stocks
router.get('/', auth, async (req, res) => {
  try {
    const stocks = await Stock.findAll({
      attributes: ['id', 'symbol', 'name', 'exchange', 'currentPrice', 'priceChange', 'percentChange', 'lastUpdated']
    });
    
    res.status(200).json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get stock by symbol
router.get('/:symbol', auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    let stock = await Stock.findOne({ where: { symbol: symbol.toUpperCase() } });
    
    if (!stock) {
      // If stock doesn't exist in our database, try to fetch it
      try {
        const stockData = await fetchStockData(symbol);
        
        if (stockData) {
          stock = await Stock.create({
            symbol: stockData.symbol,
            name: stockData.name,
            exchange: stockData.exchange,
            sector: stockData.sector,
            industry: stockData.industry,
            currentPrice: stockData.price,
            priceChange: stockData.priceChange,
            percentChange: stockData.percentChange,
            lastUpdated: new Date()
          });
        } else {
          return res.status(404).json({ message: 'Stock not found' });
        }
      } catch (error) {
        return res.status(404).json({ message: 'Stock not found' });
      }
    }
    
    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update stock data (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const stockId = req.params.id;
    
    const stock = await Stock.findByPk(stockId);
    
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    
    // Update stock with request body
    await stock.update(req.body);
    
    res.status(200).json({
      message: 'Stock updated successfully',
      stock
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a stock to the database (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { symbol, name, exchange, sector, industry } = req.body;
    
    // Check if stock already exists
    const existingStock = await Stock.findOne({ where: { symbol: symbol.toUpperCase() } });
    
    if (existingStock) {
      return res.status(400).json({ message: 'Stock already exists' });
    }
    
    // Try to fetch current data for the stock
    try {
      const stockData = await fetchStockData(symbol);
      
      const stock = await Stock.create({
        symbol: symbol.toUpperCase(),
        name: name || stockData.name,
        exchange: exchange || stockData.exchange,
        sector: sector || stockData.sector,
        industry: industry || stockData.industry,
        currentPrice: stockData.price,
        priceChange: stockData.priceChange,
        percentChange: stockData.percentChange,
        lastUpdated: new Date()
      });
      
      res.status(201).json({
        message: 'Stock added successfully',
        stock
      });
    } catch (error) {
      // If we can't fetch data, create with basic info
      const stock = await Stock.create({
        symbol: symbol.toUpperCase(),
        name,
        exchange,
        sector,
        industry,
        lastUpdated: new Date()
      });
      
      res.status(201).json({
        message: 'Stock added with basic info',
        stock
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Analyze a stock
router.post('/:symbol/analyze', auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { analysisType, timeframe } = req.body;
    
    let stock = await Stock.findOne({ where: { symbol: symbol.toUpperCase() } });
    
    if (!stock) {
      try {
        const stockData = await fetchStockData(symbol);
        
        if (stockData) {
          stock = await Stock.create({
            symbol: stockData.symbol,
            name: stockData.name,
            exchange: stockData.exchange,
            sector: stockData.sector,
            industry: stockData.industry,
            currentPrice: stockData.price,
            priceChange: stockData.priceChange,
            percentChange: stockData.percentChange,
            lastUpdated: new Date()
          });
        } else {
          return res.status(404).json({ message: 'Stock not found' });
        }
      } catch (error) {
        return res.status(404).json({ message: 'Stock not found' });
      }
    }
    
    // Perform the analysis
    const analysisResults = await analyzeStock(stock, analysisType, timeframe);
    
    // Save the analysis to the database
    const stockAnalysis = await StockAnalysis.create({
      StockId: stock.id,
      UserId: req.user.id,
      analysisType,
      timeframe,
      results: analysisResults.results,
      buySignal: analysisResults.buySignal,
      sellSignal: analysisResults.sellSignal,
      signalStrength: analysisResults.signalStrength,
      targetPrice: analysisResults.targetPrice,
      stopLoss: analysisResults.stopLoss
    });
    
    res.status(200).json({
      message: 'Analysis completed',
      analysis: stockAnalysis
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all analyses for a stock
router.get('/:symbol/analyses', auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const stock = await Stock.findOne({ where: { symbol: symbol.toUpperCase() } });
    
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    
    const analyses = await StockAnalysis.findAll({
      where: { StockId: stock.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(analyses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a stock to user's watchlist
router.post('/:symbol/watchlist/:watchlistId', auth, async (req, res) => {
  try {
    const { symbol, watchlistId } = req.params;
    
    const watchlist = await WatchList.findOne({ 
      where: { 
        id: watchlistId,
        UserId: req.user.id
      }
    });
    
    if (!watchlist) {
      return res.status(404).json({ message: 'Watchlist not found' });
    }
    
    let stock = await Stock.findOne({ where: { symbol: symbol.toUpperCase() } });
    
    if (!stock) {
      try {
        const stockData = await fetchStockData(symbol);
        
        if (stockData) {
          stock = await Stock.create({
            symbol: stockData.symbol,
            name: stockData.name,
            exchange: stockData.exchange,
            sector: stockData.sector,
            industry: stockData.industry,
            currentPrice: stockData.price,
            priceChange: stockData.priceChange,
            percentChange: stockData.percentChange,
            lastUpdated: new Date()
          });
        } else {
          return res.status(404).json({ message: 'Stock not found' });
        }
      } catch (error) {
        return res.status(404).json({ message: 'Stock not found' });
      }
    }
    
    // Add stock to watchlist
    await watchlist.addStock(stock);
    
    res.status(200).json({
      message: 'Stock added to watchlist',
      watchlist,
      stock
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 