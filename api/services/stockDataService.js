const { pool } = require('../db/init');
const axios = require('axios');
const settingsService = require('./settingsService');

class StockDataService {
  constructor() {
    this.DAILY_LIMIT = 25;
    this.symbols = ['AAPL', 'TSLA', 'BRK.B', 'SCT'];
    this.callsPerStock = Math.floor(this.DAILY_LIMIT / this.symbols.length);
  }

  async getLatestStockPrice(symbol) {
    const client = await pool.connect();
    try {
      const apiKey = await settingsService.getApiKey();
      console.log(`Attempting to fetch data for ${symbol} with API key: ${apiKey ? 'Present' : 'Missing'}`);

      if (apiKey && apiKey !== 'CHANGEME' && await this.canMakeApiCall(symbol)) {
        try {
          const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
          console.log(`Making API call to: ${url}`);
          
          const response = await axios.get(url);
          console.log(`Raw API Response for ${symbol}:`, response.data);

          if (response.data['Global Quote'] && Object.keys(response.data['Global Quote']).length > 0) {
            const quote = response.data['Global Quote'];
            await this.recordApiCall();
            
            const newData = {
              symbol,
              price: parseFloat(quote['05. price']),
              change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
              volume: parseInt(quote['06. volume']),
              is_real_data: true,
              fetch_time: new Date()
            };

            // Store in database
            await client.query(`
              INSERT INTO stock_prices (symbol, price, change_percent, volume, is_real_data, fetch_time)
              VALUES ($1, $2, $3, $4, true, NOW())
            `, [newData.symbol, newData.price, newData.change_percent, newData.volume]);

            console.log(`Successfully fetched real data for ${symbol}:`, newData);
            return newData;
          } else {
            throw new Error(`No quote data available for ${symbol}`);
          }
        } catch (error) {
          console.error(`API call failed for ${symbol}:`, error.message);
          throw error;
        }
      }
    } catch (error) {
      console.error(`Error in getLatestStockPrice for ${symbol}:`, error);
      
      // Try to get recent cached data
      const cachedResult = await client.query(`
        SELECT * FROM stock_prices 
        WHERE symbol = $1 AND is_real_data = true 
        AND fetch_time > NOW() - INTERVAL '15 minutes'
        ORDER BY fetch_time DESC 
        LIMIT 1
      `, [symbol]);

      if (cachedResult.rows.length > 0) {
        console.log(`Using cached data for ${symbol}`);
        return cachedResult.rows[0];
      }

      console.log(`Falling back to mock data for ${symbol}`);
      return {
        symbol,
        price: 100 + Math.random() * 100,
        change_percent: (Math.random() * 10 - 5).toFixed(2),
        volume: Math.floor(Math.random() * 1000000),
        is_real_data: false,
        fetch_time: new Date()
      };
    } finally {
      client.release();
    }
  }

  async getStockHistory(symbol) {
    const client = await pool.connect();
    try {
      if (await this.canMakeApiCall(symbol)) {
        try {
          const apiKey = await settingsService.getApiKey();
          
          if (apiKey && apiKey !== 'CHANGEME') {
            console.log(`Fetching historical data for ${symbol}`);
            const response = await axios.get(
              `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`
            );

            if (response.data['Time Series (Daily)']) {
              await this.recordApiCall();
              
              const timeSeriesData = response.data['Time Series (Daily)'];
              const entries = Object.entries(timeSeriesData);
              
              // Store in database
              for (let i = 0; i < Math.min(30, entries.length); i++) {
                const [date, values] = entries[i];
                await client.query(`
                  INSERT INTO stock_history (symbol, date, price, volume, is_real_data)
                  VALUES ($1, $2, $3, $4, true)
                  ON CONFLICT (symbol, date) 
                  DO UPDATE SET price = $3, volume = $4, is_real_data = true
                `, [
                  symbol,
                  date,
                  parseFloat(values['4. close']),
                  parseInt(values['5. volume'])
                ]);
              }

              // Return real data
              const historyResult = await client.query(`
                SELECT *
                FROM stock_history
                WHERE symbol = $1 AND is_real_data = true
                ORDER BY date DESC
                LIMIT 30
              `, [symbol]);

              return historyResult.rows;
            }
          }
        } catch (error) {
          console.error(`Error fetching historical data for ${symbol}:`, error);
        }
      }

      // Get existing real data from database
      const result = await client.query(`
        SELECT *
        FROM stock_history
        WHERE symbol = $1 AND is_real_data = true
        ORDER BY date DESC
        LIMIT 30
      `, [symbol]);

      if (result.rows.length > 0) {
        return result.rows;
      }

      // Only use simulated data if we have no real data
      return this.generateMockHistory(symbol);
    } finally {
      client.release();
    }
  }

  async canMakeApiCall(symbol) {
    const client = await pool.connect();
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create today's API call record
      await client.query(`
        INSERT INTO api_calls (call_date, call_count)
        VALUES ($1, 0)
        ON CONFLICT (call_date) DO NOTHING
      `, [today]);

      // Get current call count
      const callRecord = await client.query(`
        SELECT call_count, last_call
        FROM api_calls
        WHERE call_date = $1
      `, [today]);

      const { call_count, last_call } = callRecord.rows[0];

      // Check if we've exceeded daily limit
      if (call_count >= this.DAILY_LIMIT) {
        console.log('Daily API limit reached');
        return false;
      }

      // Ensure minimum 5-minute gap between calls for the same stock
      if (last_call) {
        const minutesSinceLastCall = (Date.now() - new Date(last_call).getTime()) / (1000 * 60);
        if (minutesSinceLastCall < 5) {
          console.log('Too soon since last API call');
          return false;
        }
      }

      return true;
    } finally {
      client.release();
    }
  }

  async recordApiCall() {
    const client = await pool.connect();
    try {
      const today = new Date().toISOString().split('T')[0];
      await client.query(`
        UPDATE api_calls
        SET call_count = call_count + 1,
            last_call = NOW()
        WHERE call_date = $1
      `, [today]);
    } finally {
      client.release();
    }
  }

  generateMockPrice(symbol) {
    const basePrice = {
      'AAPL': 170,
      'TSLA': 240,
      'BRK.B': 360,
      'SCT': 1450
    }[symbol] || 100;

    const changePercent = (Math.random() * 2 - 1).toFixed(2);
    
    return {
      symbol,
      price: basePrice * (1 + parseFloat(changePercent) / 100),
      change_percent: parseFloat(changePercent),
      volume: Math.floor(Math.random() * 1000000) + 500000,
      is_real_data: false
    };
  }

  generateMockHistory(symbol) {
    const basePrice = {
      'AAPL': 170,
      'TSLA': 240,
      'BRK.B': 360,
      'SCT': 1450
    }[symbol] || 100;

    const history = [];
    let currentPrice = basePrice;

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const changePercent = (Math.random() * 2 - 1) * 0.02;
      currentPrice = currentPrice * (1 + changePercent);

      history.push({
        symbol,
        date: date.toISOString().split('T')[0],
        price: parseFloat(currentPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000) + 500000,
        is_real_data: false
      });
    }

    return history;
  }
}

module.exports = new StockDataService(); 