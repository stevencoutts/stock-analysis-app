import axios from 'axios';

// You'll need to get an API key from a service like Alpha Vantage or Finnhub
const API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'https://finnhub.io/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  params: {
    token: API_KEY
  }
});

export const getStockQuote = async (symbol) => {
  try {
    const response = await api.get(`/quote?symbol=${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
};

export const getStockDetails = async (symbol) => {
  try {
    const response = await api.get(`/stock/profile2?symbol=${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock details:', error);
    return null;
  }
};

// Mock data for development
export const getMockStockData = (symbol) => {
  return {
    quote: {
      c: 150.25, // Current price
      d: 2.5,    // Change
      dp: 1.67,  // Percent change
      h: 152.0,  // High
      l: 149.0,  // Low
      o: 149.5,  // Open
      pc: 147.75 // Previous close
    },
    details: {
      name: 'Sample Company',
      logo: 'https://example.com/logo.png',
      industry: 'Technology',
      marketCap: 2000000000000,
      shareOutstanding: 16500000000
    }
  };
}; 