import React, { useContext, useState, useEffect, createContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          setAuthToken(token);
          // For demo purposes, use simulated users if token exists
          const simulatedUsers = {
            'admin@example.com': { 
              email: 'admin@example.com', 
              role: 'admin',
              id: '1',
              name: 'Admin User'
            },
            'user@example.com': { 
              email: 'user@example.com', 
              role: 'user',
              id: '2',
              name: 'Regular User'
            }
          };
          
          try {
            // Try to decode JWT if using real token
            const decoded = jwtDecode(token);
            setCurrentUser({
              id: decoded.userId || '1',
              email: decoded.email || 'admin@example.com',
              role: decoded.role || 'admin',
              name: decoded.name || 'Admin User'
            });
          } catch (e) {
            // Fallback to demo users for testing
            const userEmail = localStorage.getItem('userEmail');
            if (userEmail && simulatedUsers[userEmail]) {
              setCurrentUser(simulatedUsers[userEmail]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading user:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  async function login(email, password) {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('http://localhost:8081/api/auth/login', {
        email,
        password
      });
      
      if (response.data.token) {
        setCurrentUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        setAuthToken(response.data.token);
        return response.data;
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    delete axios.defaults.headers.common['Authorization'];
  }

  function isAdmin() {
    return currentUser?.role === 'admin';
  }

  const value = {
    currentUser,
    login,
    logout,
    error,
    loading,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 