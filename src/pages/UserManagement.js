import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  
  const [editUser, setEditUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  useEffect(() => {
    // Redirect if not admin
    if (currentUser && !isAdmin()) {
      navigate('/dashboard');
    }
    
    fetchUsers();
  }, [currentUser, isAdmin, navigate]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8081/api/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch users: ' + (err.response?.data?.error || err.message));
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8081/api/users', newUser);
      setUsers([...users, response.data]);
      setSuccess('User added successfully');
      setShowAddModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add user: ' + (err.response?.data?.error || err.message));
      console.error('Error adding user:', err);
    }
  };
  
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const { id, name, email, role, status } = editUser;
      const response = await axios.put(`http://localhost:8081/api/users/${id}`, {
        name, email, role, status
      });
      
      setUsers(users.map(user => user.id === id ? response.data : user));
      setSuccess('User updated successfully');
      setShowEditModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update user: ' + (err.response?.data?.error || err.message));
      console.error('Error updating user:', err);
    }
  };
  
  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:8081/api/users/${id}`);
        setUsers(users.filter(user => user.id !== id));
        setSuccess('User deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete user: ' + (err.response?.data?.error || err.message));
        console.error('Error deleting user:', err);
      }
    }
  };
  
  const toggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const response = await axios.put(`http://localhost:8081/api/users/${user.id}`, {
        ...user,
        status: newStatus
      });
      
      setUsers(users.map(u => u.id === user.id ? response.data : u));
      setSuccess(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update user status: ' + (err.response?.data?.error || err.message));
      console.error('Error updating user status:', err);
    }
  };
  
  return (
    <div className="user-management-container">
      <header className="admin-header">
        <h1>User Management</h1>
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
                <th>Created</th>
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
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="action-buttons">
                    <button 
                      className="edit-button"
                      onClick={() => {
                        setEditUser(user);
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className={`status-button ${user.status === 'active' ? 'deactivate' : 'activate'}`}
                      onClick={() => toggleStatus(user)}
                    >
                      {user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="submit-button">Add User</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditModal && editUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit User</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  value={editUser.name}
                  onChange={e => setEditUser({...editUser, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={editUser.email}
                  onChange={e => setEditUser({...editUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editUser.role}
                  onChange={e => setEditUser({...editUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editUser.status}
                  onChange={e => setEditUser({...editUser, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="submit-button">Update User</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 