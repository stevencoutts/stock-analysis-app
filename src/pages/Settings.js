import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './Settings.css';

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    fetchSettings();
  }, [isAdmin, navigate]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8081/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Settings response:', response.data); // Debug log
      setSettings(response.data);
      setError('');
    } catch (err) {
      console.error('Settings fetch error:', err); // Debug log
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError('Failed to fetch settings: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8081/api/settings/${key}`, 
        { value },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setSuccess(`Updated ${key} successfully`);
      fetchSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update setting');
    }
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="settings-container">
      <header className="admin-header">
        <div className="header-content">
          <div className="header-navigation">
            <Link to="/dashboard" className="back-link">
              <span className="back-arrow">←</span> Back to Dashboard
            </Link>
          </div>
          <h1>System Settings</h1>
          <div className="header-subtitle">
            Manage application settings and configurations
          </div>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="loading-spinner">Loading settings...</div>
      ) : (
        <div className="settings-grid">
          {settings.map(setting => (
            <div key={setting.key} className="setting-card">
              <h3>{setting.key}</h3>
              <p className="setting-description">{setting.description}</p>
              <div className="setting-value">
                <input
                  type="text"
                  value={setting.value}
                  onChange={(e) => {
                    const newSettings = settings.map(s =>
                      s.key === setting.key ? { ...s, value: e.target.value } : s
                    );
                    setSettings(newSettings);
                  }}
                />
                <button
                  onClick={() => handleUpdate(setting.key, setting.value)}
                  className="update-button"
                >
                  Update
                </button>
              </div>
              <div className="setting-meta">
                Last updated: {new Date(setting.updated_at).toLocaleString()}
                {setting.updated_by_name && ` by ${setting.updated_by_name}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 