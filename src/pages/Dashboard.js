import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(true);

  // Sample data - replace with actual API calls
  const mockStockData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Stock Price',
      data: [150, 155, 160, 158, 165, 170],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const marketSummary = [
    { symbol: 'AAPL', price: '150.23', change: '+2.5%' },
    { symbol: 'GOOGL', price: '2,800.75', change: '-0.8%' },
    { symbol: 'MSFT', price: '290.50', change: '+1.2%' },
    { symbol: 'AMZN', price: '3,400.25', change: '+0.5%' }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <header className="dashboard-header">
        <h1>Welcome, {currentUser?.email}</h1>
        <div className="date-time">{new Date().toLocaleDateString()}</div>
      </header>

      {/* Main Grid Layout */}
      <div className="dashboard-grid">
        {/* Market Overview Card */}
        <div className="dashboard-card market-overview">
          <h2>Market Overview</h2>
          <div className="market-summary">
            {marketSummary.map((stock) => (
              <div key={stock.symbol} className="market-item">
                <span className="symbol">{stock.symbol}</span>
                <span className="price">${stock.price}</span>
                <span className={`change ${stock.change.startsWith('+') ? 'positive' : 'negative'}`}>
                  {stock.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Chart Card */}
        <div className="dashboard-card chart-card">
          <h2>Stock Performance</h2>
          <select 
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="stock-selector"
          >
            <option value="AAPL">Apple (AAPL)</option>
            <option value="GOOGL">Google (GOOGL)</option>
            <option value="MSFT">Microsoft (MSFT)</option>
            <option value="AMZN">Amazon (AMZN)</option>
          </select>
          <div className="chart-container">
            <Line data={mockStockData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: `${selectedStock} Stock Price`
                }
              }
            }} />
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="dashboard-card stats-card">
          <h2>Quick Stats</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <h3>Portfolio Value</h3>
              <p>$125,430.50</p>
            </div>
            <div className="stat-item">
              <h3>Day's Change</h3>
              <p className="positive">+$1,234.50</p>
            </div>
            <div className="stat-item">
              <h3>Total Gain/Loss</h3>
              <p className="positive">+15.4%</p>
            </div>
            <div className="stat-item">
              <h3>Active Positions</h3>
              <p>12</p>
            </div>
          </div>
        </div>

        {/* News Feed Card */}
        <div className="dashboard-card news-card">
          <h2>Latest News</h2>
          <div className="news-feed">
            {[1, 2, 3].map((item) => (
              <div key={item} className="news-item">
                <h3>Market Update {item}</h3>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <span className="news-time">2 hours ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 