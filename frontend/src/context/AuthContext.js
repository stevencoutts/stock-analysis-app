import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Check if user is already logged in (token exists in localStorage)
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Decode token to get user info
        const decoded = jwt_decode(token);
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          // Token is expired
          logout();
        } else {
          // Set auth header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user data from API
          loadUser();
        }
      } catch (error) {
        console.error("Invalid token", error);
        logout();
      }
    } else {
      setLoading(false);
    }
  }, []);
  
  const loadUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error("Error loading user", error);
      logout();
    }
  };
  
  const login = async (email, password) => {
    try {
      setError(null);
      
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      // Save token to localStorage
      localStorage.setItem('token', res.data.token);
      
      // Set auth header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      
      return res.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };
  
  const register = async (username, email, password) => {
    try {
      setError(null);
      
      const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      
      // Save token to localStorage
      localStorage.setItem('token', res.data.token);
      
      // Set auth header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      setUser(res.data.user);
      setIsAuthenticated(true);
      
      return res.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };
  
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };
  
  const updateProfile = async (userId, data) => {
    try {
      const res = await axios.put(`${API_URL}/users/${userId}`, data);
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Profile update failed');
      throw error;
    }
  };
  
  const isAdmin = () => {
    return user && user.role === 'admin';
  };
  
  // Authentication context value
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAdmin
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 