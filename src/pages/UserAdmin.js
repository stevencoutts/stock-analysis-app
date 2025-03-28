import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserAdmin.css';

export default function UserAdmin() {
  const [users, setUsers] = useState([
    // Simulated user data - replace with API call
    { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active' },
    { id: '2', name: 'Regular User', email: 'user@example.com', role: 'user', status: 'active' },
    { id: '3', name: 'John Doe', email: 'john@example.com', role: 'user', status: 'inactive' }
  ]);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user',
    password: ''
  });
  
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddUser = (e) => {
    e.preventDefault();
    // Simulated add user - replace with API call
    const user = {
      id: Date.now().toString(),
      ...newUser,
      status: 'active'
    };
    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: 'user', password: '' });
    setSuccess('User added successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    // Simulated update user - replace with API call
    const updatedUsers = users.map(u => 
      u.id === editingUser.id ? editingUser : u
    );
    setUsers(updatedUsers);
    setEditingUser(null);
    setSuccess('User updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      // Simulated delete user - replace with API call
      setUsers(users.filter(u => u.id !== userId));
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleToggleStatus = (userId) => {
    // Simulated status toggle - replace with API call
    setUsers(users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: u.status === 'active' ? 'inactive' : 'active'
        };
      }
      return u;
    }));
  };

  return (
    <div className="user-admin-container">
      <h1>User Administration</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Add New User Form */}
      <div className="admin-card">
        <h2>Add New User</h2>
        <form onSubmit={handleAddUser} className="admin-form">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Role:</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Add User</button>
        </form>
      </div>

      {/* User List */}
      <div className="admin-card">
        <h2>User List</h2>
        <div className="user-list">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`btn-${user.status === 'active' ? 'warning' : 'success'}`}
                    >
                      {user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit User</h2>
            <form onSubmit={handleUpdateUser} className="admin-form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="button-group">
                <button type="submit" className="btn-primary">Update</button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary"
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