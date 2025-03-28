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
  Legend,
  Filler
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [stockChartData, setStockChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState('');

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

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8081/api/market-overview');
        setMarketData(response.data.data);
        setLastUpdated(new Date(response.data.lastUpdated));
        setWarning(response.data.warning || '');
        setError('');
      } catch (err) {
        setError('Failed to fetch market data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    // Refresh data every minute
    const interval = setInterval(fetchMarketData, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setChartLoading(true);
        setChartError('');
        console.log('Fetching data for:', selectedStock);
        
        const response = await axios.get(`http://localhost:8081/api/stock-performance/${selectedStock}`);
        console.log('Received chart data:', response.data);
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        setStockChartData(response.data);
      } catch (err) {
        console.error('Chart error:', err);
        setChartError(err.message || 'Failed to fetch stock performance data');
      } finally {
        setChartLoading(false);
      }
    };

    fetchStockData();
    const interval = setInterval(fetchStockData, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [selectedStock]);

  const formatLastUpdated = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // difference in seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${selectedStock} Stock Performance (Last 30 Days)`,
        font: {
          size: 16
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(2);
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

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
          <div className="card-header">
            <h2>Market Overview</h2>
            {marketData.some(item => !item.realData) && (
              <div className="data-notice">
                <span className="warning-icon">⚠️</span> Some data shown is simulated due to API limitations
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="loading-spinner">Loading market data...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="market-summary">
              {marketData.map((stock) => (
                <div key={stock.symbol} className="market-item">
                  <span className="symbol">{stock.symbol}</span>
                  <span className="price">${stock.price}</span>
                  <span className={`change ${stock.change?.startsWith('-') ? 'negative' : 'positive'}`}>
                    {stock.change}
                  </span>
                  <span className="volume">Vol: {parseInt(stock.volume || 0).toLocaleString()}</span>
                  {!stock.realData && <span className="mock-data-tag">mock</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Chart Card */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h2>Stock Performance</h2>
            <select 
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="stock-selector"
            >
              <option value="AAPL">Apple (AAPL)</option>
              <option value="TSLA">Tesla (TSLA)</option>
              <option value="BRK.B">Berkshire Hathaway (BRK.B)</option>
              <option value="SCT.L">Softcat plc (SCT.L)</option>
            </select>
          </div>
          
          <div className="chart-container">
            {chartLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                Loading chart data...
              </div>
            ) : chartError ? (
              <div className="error-message">{chartError}</div>
            ) : stockChartData ? (
              <>
                <Line data={stockChartData} options={chartOptions} />
                {stockChartData.datasets[0].label.includes('Mock') && (
                  <div className="data-notice">
                    <span className="warning-icon">⚠️</span> Showing simulated data due to API limitations
                  </div>
                )}
              </>
            ) : (
              <div className="error-message">No data available</div>
            )}
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