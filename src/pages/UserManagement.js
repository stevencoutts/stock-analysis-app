import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [userActivity, setUserActivity] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
  });

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8081/api/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:8081/api/users/${userId}/activity`);
      setUserActivity(response.data);
      setShowActivityModal(true);
    } catch (err) {
      setError('Failed to fetch user activity');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showAddModal) {
        await axios.post('http://localhost:8081/api/users', formData);
        setSuccess('User created successfully');
      } else {
        await axios.put(`http://localhost:8081/api/users/${selectedUser.id}`, formData);
        setSuccess('User updated successfully');
      }
      
      fetchUsers();
      closeModals();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`http://localhost:8081/api/users/${userId}`);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowActivityModal(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      status: 'active'
    });
  };

  return (
    <div className="user-management-container">
      <header className="admin-header">
        <div className="header-content">
          <div className="header-navigation">
            <Link to="/dashboard" className="back-link">
              <span className="back-arrow">←</span> Back to Dashboard
            </Link>
          </div>
          <h1>User Management</h1>
          <div className="header-subtitle">
            Manage system users and their permissions
          </div>
        </div>
        <button 
          className="add-user-button"
          onClick={() => setShowAddModal(true)}
        >
          Add New User
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="loading-spinner">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.status === 'inactive' ? 'inactive-user' : ''}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleString()
                      : 'Never'
                    }
                  </td>
                  <td className="action-buttons">
                    <button 
                      className="edit-button"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                    <button 
                      className="activity-button"
                      onClick={() => fetchUserActivity(user.id)}
                    >
                      Activity
                    </button>
                    {user.id !== currentUser.id && (
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{showAddModal ? 'Add New User' : 'Edit User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              {showAddModal && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required={showAddModal}
                    minLength="6"
                  />
                </div>
              )}
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {showEditModal && (
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="modal-buttons">
                <button type="submit" className="submit-button">
                  {showAddModal ? 'Add User' : 'Update User'}
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={closeModals}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Activity Modal */}
      {showActivityModal && (
        <div className="modal-overlay">
          <div className="modal activity-modal">
            <h2>User Activity Log</h2>
            <div className="activity-list">
              {userActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-action">{activity.action}</div>
                  <div className="activity-time">
                    {new Date(activity.created_at).toLocaleString()}
                  </div>
                  {activity.details && (
                    <div className="activity-details">
                      {JSON.stringify(activity.details)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => setShowActivityModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 