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
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
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

  async function login(email, password) {
    try {
      setLoading(true);
      setError('');
      
      // For demo purposes, use hardcoded credentials
      if ((email === 'admin@example.com' && password === 'admin123') || 
          (email === 'user@example.com' && password === 'user123')) {
        
        const isAdmin = email === 'admin@example.com';
        const user = {
          id: isAdmin ? '1' : '2',
          email,
          role: isAdmin ? 'admin' : 'user',
          name: isAdmin ? 'Admin User' : 'Regular User'
        };
        
        // Save to state
        setCurrentUser(user);
        
        // Save to localStorage (simulating token)
        const demoToken = 'demo-token-' + Math.random().toString(36).substring(2);
        localStorage.setItem('token', demoToken);
        localStorage.setItem('userEmail', email);
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${demoToken}`;
        
        return { success: true, user };
      }
      
      throw new Error('Invalid email or password');
    } catch (err) {
      setError(err.message || 'Failed to login');
      return { success: false, error: err.message };
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