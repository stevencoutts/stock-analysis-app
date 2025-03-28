import React, { useState, useEffect, useCallback } from 'react';
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState({
    market: null,
    chart: null
  });

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

  // Function to get cached data from localStorage
  const getCachedData = (key) => {
    try {
      const cachedData = localStorage.getItem(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    } catch (e) {
      console.error('Error reading from localStorage:', e);
    }
    return null;
  };
  
  // Function to store data in localStorage
  const setCachedData = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  };
  
  // Function to check if cached data is fresh enough
  const isCacheFresh = (timestamp, maxAgeMinutes = 5) => {
    if (!timestamp) return false;
    
    const cachedTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now - cachedTime;
    const diffMinutes = diffMs / (1000 * 60);
    
    return diffMinutes < maxAgeMinutes;
  };
  
  // Intelligent function to determine if refresh is needed
  const needsRefresh = (dataType) => {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const hour = now.getHours();
    const isMarketHours = hour >= 9 && hour < 16;
    
    // Cache longer outside market hours
    const maxAge = isWeekend ? 720 : (isMarketHours ? 5 : 60);
    
    if (!lastFetched[dataType]) return true;
    return !isCacheFresh(lastFetched[dataType], maxAge);
  };

  // Define fetchMarketData as a useCallback to avoid recreation
  const fetchMarketData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Check localStorage first if not forcing refresh
      if (!forceRefresh) {
        const cachedMarketData = getCachedData('marketData');
        if (cachedMarketData && isCacheFresh(cachedMarketData.timestamp, 
                                            needsRefresh('market') ? 5 : 60)) {
          setMarketData(cachedMarketData.data.data);
          setError('');
          setLoading(false);
          setLastFetched(prev => ({...prev, market: cachedMarketData.timestamp}));
          return;
        }
      }
      
      // Fetch from API with refresh parameter
      const response = await axios.get(`http://localhost:8081/api/market-overview${forceRefresh ? '?refresh=true' : ''}`);
      setMarketData(response.data.data);
      setError('');
      
      // Store in localStorage
      setCachedData('marketData', response.data);
      setLastFetched(prev => ({...prev, market: new Date().toISOString()}));
    } catch (err) {
      setError('Failed to fetch market data');
      console.error('Error:', err);
      
      // Try to use cached data even if it's old
      const cachedMarketData = getCachedData('marketData');
      if (cachedMarketData) {
        setMarketData(cachedMarketData.data.data);
        setError('Using cached data due to fetch error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setMarketData, setError, setLoading, setLastFetched, setRefreshing]);

  // Define fetchStockData as a useCallback
  const fetchStockData = useCallback(async (forceRefresh = false) => {
    try {
      setChartLoading(true);
      
      // Check localStorage first if not forcing refresh
      const cacheKey = `stockData-${selectedStock}`;
      if (!forceRefresh) {
        const cachedStockData = getCachedData(cacheKey);
        if (cachedStockData && isCacheFresh(cachedStockData.timestamp,
                                           needsRefresh('chart') ? 10 : 120)) {
          setStockChartData(cachedStockData.data);
          setChartError('');
          setChartLoading(false);
          setLastFetched(prev => ({...prev, chart: cachedStockData.timestamp}));
          return;
        }
      }
      
      // Fetch from API with refresh parameter
      const response = await axios.get(
        `http://localhost:8081/api/stock-performance/${selectedStock}${forceRefresh ? '?refresh=true' : ''}`
      );
      setStockChartData(response.data);
      setChartError('');
      
      // Store in localStorage
      setCachedData(cacheKey, response.data);
      setLastFetched(prev => ({...prev, chart: new Date().toISOString()}));
    } catch (err) {
      setChartError('Failed to fetch stock data');
      console.error('Error:', err);
      
      // Try to use cached data even if it's old
      const cacheKey = `stockData-${selectedStock}`;
      const cachedStockData = getCachedData(cacheKey);
      if (cachedStockData) {
        setStockChartData(cachedStockData.data);
        setChartError('Using cached data due to fetch error');
      }
    } finally {
      setChartLoading(false);
    }
  }, [selectedStock, setStockChartData, setChartError, setChartLoading, setLastFetched]);

  // Fetch market data on component mount
  useEffect(() => {
    fetchMarketData();
    
    // Set up an interval to check if we need to refresh
    const interval = setInterval(() => {
      if (needsRefresh('market')) {
        fetchMarketData();
      }
    }, 60000); // Check every minute if refresh is needed
    
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Fetch stock data when selected stock changes
  useEffect(() => {
    fetchStockData();
    
    // Check periodically if we need to refresh
    const interval = setInterval(() => {
      if (needsRefresh('chart')) {
        fetchStockData();
      }
    }, 120000); // Check every 2 minutes
    
    return () => clearInterval(interval);
  }, [selectedStock, fetchStockData]);

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([
      fetchMarketData(true),
      fetchStockData(true)
    ]).finally(() => {
      setRefreshing(false);
    });
  };

  // Format the last updated time
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
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

  // Update the checkApiStatus function
  const checkApiStatus = async () => {
    try {
      setRefreshing(true);
      console.log('Requesting API diagnosis...');
      
      const response = await axios.get('http://localhost:8081/api/diagnosis');
      console.log('API Diagnosis response:', response.data);
      
      if (response.data && response.data.summary) {
        // Display diagnosis results
        alert(`API Diagnosis Results:
        - API Key Valid: ${response.data.summary.isKeyValid ? 'Yes' : 'No'}
        - Rate Limited: ${response.data.summary.isRateLimited ? 'Yes' : 'No'}
        - Working Symbols: ${response.data.summary.workingSymbols || 'None'}
        
        Check the browser console for complete details.`);
      } else {
        throw new Error('Invalid diagnosis response format');
      }
    } catch (error) {
      console.error('Diagnosis failed:', error);
      alert(`Failed to run diagnosis: ${error.message || 'Unknown error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header with refresh and diagnostic buttons */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Welcome, {currentUser?.email}</h1>
          <div className="last-update">
            Last updated: {formatLastUpdated(lastFetched.market)}
          </div>
        </div>
        <div className="header-right">
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button 
            className="diagnostic-button" 
            onClick={checkApiStatus}
            disabled={refreshing}
          >
            Check API Status
          </button>
        </div>
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