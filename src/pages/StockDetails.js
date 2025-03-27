import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getMockStockData } from '../services/stockApi';

const StockDetails = () => {
  const { symbol } = useParams();
  const [stockData, setStockData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      // In production, replace with real API call
      const data = getMockStockData(symbol);
      setStockData(data);
      
      // Generate mock historical data
      const mockHistorical = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        price: data.quote.c + (Math.random() - 0.5) * 10
      }));
      setHistoricalData(mockHistorical);
      setLoading(false);
    };

    fetchStockData();
  }, [symbol]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="stock-details-container">
      <div className="stock-header">
        <h2>{symbol}</h2>
        <h3>{stockData.details.name}</h3>
        <div className="price-info">
          <span className="current-price">${stockData.quote.c.toFixed(2)}</span>
          <span className={`price-change ${stockData.quote.d >= 0 ? 'positive' : 'negative'}`}>
            {stockData.quote.d >= 0 ? '+' : ''}{stockData.quote.d.toFixed(2)} ({stockData.quote.dp.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="chart-container">
        <h3>Price History</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="stock-metrics">
        <div className="metric-card">
          <h4>Today's Range</h4>
          <div className="range">
            <span>${stockData.quote.l.toFixed(2)}</span>
            <span>${stockData.quote.h.toFixed(2)}</span>
          </div>
        </div>
        <div className="metric-card">
          <h4>Market Cap</h4>
          <span>${(stockData.details.marketCap / 1000000000).toFixed(2)}B</span>
        </div>
        <div className="metric-card">
          <h4>Previous Close</h4>
          <span>${stockData.quote.pc.toFixed(2)}</span>
        </div>
        <div className="metric-card">
          <h4>Open</h4>
          <span>${stockData.quote.o.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default StockDetails; 