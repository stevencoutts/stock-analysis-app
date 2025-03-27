const { sequelize } = require('../config/db');
const User = require('./user');
const Stock = require('./stock');
const StockAnalysis = require('./stockAnalysis');
const WatchList = require('./watchlist');

// Define model relationships
User.hasMany(WatchList);
WatchList.belongsTo(User);

WatchList.belongsToMany(Stock, { through: 'WatchlistStocks' });
Stock.belongsToMany(WatchList, { through: 'WatchlistStocks' });

Stock.hasMany(StockAnalysis);
StockAnalysis.belongsTo(Stock);

User.hasMany(StockAnalysis);
StockAnalysis.belongsTo(User);

module.exports = {
  sequelize,
  User,
  Stock,
  StockAnalysis,
  WatchList
}; 