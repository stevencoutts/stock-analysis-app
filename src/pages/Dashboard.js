import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  const { currentUser, isAdmin, logout } = useAuth();
  const [marketData, setMarketData] = useState([]);
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching market data...');
      
      const response = await fetch('/api/market-overview');
      const data = await response.json();
      
      console.log('Received market data:', data);
      
      if (data.data && Array.isArray(data.data)) {
        setMarketData(data.data);
        setLastUpdated(data.lastUpdated);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStockData = useCallback(async (symbol) => {
    try {
      const response = await axios.get(`http://localhost:8081/api/stock-performance/${symbol}`);
      setStockData(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to fetch stock data');
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    fetchStockData(selectedStock);
  }, [selectedStock, fetchMarketData, fetchStockData]);

  const handleStockSelect = (event) => {
    setSelectedStock(event.target.value);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchMarketData(),
        fetchStockData(selectedStock)
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const formatLastUpdated = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const checkApiStatus = async () => {
    try {
      setDiagnosing(true);
      const response = await fetch('/api/diagnose-api');
      const data = await response.json();
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      alert('Failed to check API status: ' + error.message);
    } finally {
      setDiagnosing(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Welcome, {currentUser?.name || currentUser?.email}</h1>
          <div className="user-role">
            Role: <span className="role-badge">{currentUser?.role || 'User'}</span>
          </div>
          <div className="last-update">
            Last updated: {formatLastUpdated(lastUpdated)}
          </div>
        </div>
        <div className="header-actions">
          {isAdmin() && (
            <div className="admin-menu">
              <button className="admin-menu-button">Admin ▾</button>
              <div className="admin-dropdown">
                <Link to="/admin/users" className="admin-menu-item">User Management</Link>
                <Link to="/admin/settings" className="admin-menu-item">System Settings</Link>
              </div>
            </div>
          )}
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button 
            onClick={checkApiStatus} 
            disabled={diagnosing}
            className="diagnose-button"
          >
            {diagnosing ? 'Checking API...' : 'Check API Status'}
          </button>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="error-alert">
          {error}
        </div>
      )}

      <div className="dashboard-content">
        <div className="market-overview">
          <h2>Market Overview</h2>
          {loading && <div>Loading...</div>}
          {!loading && !error && marketData.length === 0 && (
            <div>No market data available</div>
          )}
          {!loading && !error && marketData.length > 0 && (
            <div className="stock-grid">
              {marketData.map((stock) => (
                <div key={stock.symbol} className="stock-card">
                  <h3>{stock.symbol}</h3>
                  <div className="stock-price">${typeof stock.price === 'number' ? stock.price.toFixed(2) : 'N/A'}</div>
                  <div className={`stock-change ${parseFloat(stock.change_percent) >= 0 ? 'positive' : 'negative'}`}>
                    {typeof stock.change_percent === 'number' ? stock.change_percent.toFixed(2) : '0.00'}%
                  </div>
                  <div className="volume">
                    Vol: {stock.volume?.toLocaleString() || 'N/A'}
                  </div>
                  <div className={`data-source ${stock.is_real_data ? 'real' : 'simulated'}`}>
                    {stock.is_real_data ? 'Real Data' : 'Simulated'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stock-performance">
          <h2>Stock Performance</h2>
          <div className="stock-controls">
            <select 
              value={selectedStock} 
              onChange={handleStockSelect}
              className="stock-select"
            >
              <option value="AAPL">Apple (AAPL)</option>
              <option value="TSLA">Tesla (TSLA)</option>
              <option value="BRK.B">Berkshire Hathaway (BRK.B)</option>
              <option value="SCT">Softcat plc (SCT)</option>
            </select>
          </div>
          
          {stockData && (
            <div className="chart-container">
              <Line
                data={stockData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: `${selectedStock} Stock Price`,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: false,
                    },
                  },
                }}
              />
              {stockData.isMock && (
                <div className="mock-data-notice">
                  Using simulated data for demonstration
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 