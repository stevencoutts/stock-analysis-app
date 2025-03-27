import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Temporary simple components for testing
const Dashboard = () => <div>Dashboard Page</div>;
const Analysis = () => <div>Analysis Page</div>;
const Watchlists = () => <div>Watchlists Page</div>;
const Profile = () => <div>Profile Page</div>;

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/">Stock Analysis</Link>
          </div>
          <div className="nav-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/analysis">Analysis</Link>
            <Link to="/watchlists">Watchlists</Link>
            <Link to="/profile">Profile</Link>
          </div>
        </nav>

        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/watchlists" element={<Watchlists />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
