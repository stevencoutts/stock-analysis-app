const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StockAnalysis = sequelize.define('StockAnalysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  analysisType: {
    type: DataTypes.ENUM('technical', 'fundamental', 'sentiment', 'custom'),
    allowNull: false
  },
  timeframe: {
    type: DataTypes.STRING,
    allowNull: false
  },
  results: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  buySignal: {
    type: DataTypes.BOOLEAN
  },
  sellSignal: {
    type: DataTypes.BOOLEAN
  },
  signalStrength: {
    type: DataTypes.ENUM('strong', 'moderate', 'weak'),
    allowNull: true
  },
  targetPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  stopLoss: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = StockAnalysis; 