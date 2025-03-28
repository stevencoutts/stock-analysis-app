const { pool } = require('../db/init');
const axios = require('axios');

class StockDataService {
  constructor() {
    this.DAILY_LIMIT = 25;
    this.symbols = ['AAPL', 'TSLA', 'BRK.B', 'SCT'];
    this.callsPerStock = Math.floor(this.DAILY_LIMIT / this.symbols.length);
  }

  async canMakeApiCall(symbol) {
    const client = await pool.connect();
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create today's API call record
      const result = await client.query(`
        INSERT INTO api_calls (call_date, call_count)
        VALUES ($1, 0)
        ON CONFLICT (call_date) DO NOTHING
        RETURNING *
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
        return false;
      }

      // Ensure minimum 1-hour gap between calls for the same stock
      if (last_call) {
        const hoursSinceLastCall = (Date.now() - new Date(last_call).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastCall < 1) {
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

  async getLatestStockPrice(symbol) {
    const client = await pool.connect();
    try {
      // Get the most recent price from database
      const result = await client.query(`
        SELECT *
        FROM stock_prices
        WHERE symbol = $1
        ORDER BY fetch_time DESC
        LIMIT 1
      `, [symbol]);

      // If we have recent data (less than 1 hour old), return it
      if (result.rows.length > 0) {
        const data = result.rows[0];
        const age = (Date.now() - new Date(data.fetch_time).getTime()) / (1000 * 60 * 60);
        if (age < 1) {
          return data;
        }
      }

      // Try to fetch new data if we can make an API call
      if (await this.canMakeApiCall(symbol)) {
        try {
          const response = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
          );

          if (response.data['Global Quote']) {
            await this.recordApiCall();
            
            const quote = response.data['Global Quote'];
            const newData = {
              symbol,
              price: parseFloat(quote['05. price']),
              change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
              volume: parseInt(quote['06. volume']),
              is_real_data: true
            };

            // Store in database
            await client.query(`
              INSERT INTO stock_prices (symbol, price, change_percent, volume, is_real_data)
              VALUES ($1, $2, $3, $4, $5)
            `, [newData.symbol, newData.price, newData.change_percent, newData.volume, newData.is_real_data]);

            return newData;
          }
        } catch (error) {
          console.error(`Error fetching real data for ${symbol}:`, error);
        }
      }

      // Return most recent data from database, even if old
      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Generate mock data as last resort
      const mockData = this.generateMockPrice(symbol);
      await client.query(`
        INSERT INTO stock_prices (symbol, price, change_percent, volume, is_real_data)
        VALUES ($1, $2, $3, $4, false)
      `, [symbol, mockData.price, mockData.change_percent, mockData.volume]);

      return mockData;
    } finally {
      client.release();
    }
  }

  async getStockHistory(symbol) {
    const client = await pool.connect();
    try {
      // Get existing history from database
      const result = await client.query(`
        SELECT *
        FROM stock_history
        WHERE symbol = $1
        ORDER BY date DESC
        LIMIT 30
      `, [symbol]);

      // If we have enough recent data, return it
      if (result.rows.length >= 30) {
        const mostRecentDate = new Date(result.rows[0].date);
        const age = (Date.now() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24);
        if (age < 1) {
          return result.rows;
        }
      }

      // Try to fetch new data if we can make an API call
      if (await this.canMakeApiCall(symbol)) {
        try {
          const response = await axios.get(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
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
                ON CONFLICT (symbol, date) DO UPDATE
                SET price = $3, volume = $4, fetch_time = NOW()
              `, [
                symbol,
                date,
                parseFloat(values['4. close']),
                parseInt(values['5. volume'])
              ]);
            }

            // Return updated data
            return (await client.query(`
              SELECT *
              FROM stock_history
              WHERE symbol = $1
              ORDER BY date DESC
              LIMIT 30
            `, [symbol])).rows;
          }
        } catch (error) {
          console.error(`Error fetching history for ${symbol}:`, error);
        }
      }

      // If we have any data in database, return it
      if (result.rows.length > 0) {
        return result.rows;
      }

      // Generate mock history as last resort
      const mockHistory = this.generateMockHistory(symbol);
      for (const entry of mockHistory) {
        await client.query(`
          INSERT INTO stock_history (symbol, date, price, volume, is_real_data)
          VALUES ($1, $2, $3, $4, false)
          ON CONFLICT (symbol, date) DO NOTHING
        `, [symbol, entry.date, entry.price, entry.volume]);
      }

      return mockHistory;
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