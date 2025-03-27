import React, { createContext, useContext, useState } from 'react';
import * as authService from '../services/authService';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      // For testing, accept any credentials
      const newUser = {
        email: email,
        name: email.split('@')[0]
      };
      setCurrentUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return true;
    } catch (err) {
      setError('Failed to login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.updateProfile(updates);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      await authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(email);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updates) => {
    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    resetPassword,
    updateUser,
    error,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 