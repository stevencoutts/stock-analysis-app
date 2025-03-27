const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Stock = sequelize.define('Stock', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  symbol: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  exchange: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sector: {
    type: DataTypes.STRING
  },
  industry: {
    type: DataTypes.STRING
  },
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2)
  },
  priceChange: {
    type: DataTypes.DECIMAL(10, 2)
  },
  percentChange: {
    type: DataTypes.DECIMAL(10, 2)
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  historicalData: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true
});

module.exports = Stock; 