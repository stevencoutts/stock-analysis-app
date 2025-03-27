import axios from 'axios';
import jwt_decode from 'jwt-decode';
import bcryptjs from 'bcryptjs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5010/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      // Token expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const register = async (userData) => {
  try {
    // Hash password before sending
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(userData.password, salt);

    const response = await api.post('/auth/register', {
      ...userData,
      password: hashedPassword
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    // Store token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh-token');
    const { token } = response.data;
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw new Error('Token refresh failed');
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/auth/profile', userData);
    const updatedUser = response.data;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Profile update failed');
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const salt = await bcryptjs.genSalt(10);
    const hashedNewPassword = await bcryptjs.hash(newPassword, salt);

    await api.put('/auth/change-password', {
      currentPassword,
      newPassword: hashedNewPassword
    });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Password change failed');
  }
};

export const resetPassword = async (email) => {
  try {
    await api.post('/auth/reset-password', { email });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Password reset failed');
  }
};

export const verifyResetToken = async (token) => {
  try {
    await api.post('/auth/verify-reset-token', { token });
    return true;
  } catch (error) {
    return false;
  }
}; 