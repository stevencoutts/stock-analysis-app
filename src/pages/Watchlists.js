import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Watchlists = () => {
  const [watchlists, setWatchlists] = useState([
    {
      id: 1,
      name: 'Tech Stocks',
      stocks: [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, change: 2.5 },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: 290.50, change: -1.2 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.30, change: 1.8 }
      ]
    },
    {
      id: 2,
      name: 'Growth Stocks',
      stocks: [
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 850.75, change: 3.2 },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 195.20, change: 0.8 }
      ]
    }
  ]);

  const [newWatchlistName, setNewWatchlistName] = useState('');

  const handleCreateWatchlist = (e) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;

    const newWatchlist = {
      id: watchlists.length + 1,
      name: newWatchlistName,
      stocks: []
    };

    setWatchlists([...watchlists, newWatchlist]);
    setNewWatchlistName('');
  };

  const handleDeleteWatchlist = (id) => {
    setWatchlists(watchlists.filter(list => list.id !== id));
  };

  return (
    <div className="watchlists-container">
      <h2>My Watchlists</h2>

      <div className="create-watchlist">
        <form onSubmit={handleCreateWatchlist}>
          <input
            type="text"
            value={newWatchlistName}
            onChange={(e) => setNewWatchlistName(e.target.value)}
            placeholder="Enter watchlist name"
            className="watchlist-input"
          />
          <button type="submit" className="create-button">Create Watchlist</button>
        </form>
      </div>

      <div className="watchlists-grid">
        {watchlists.map(watchlist => (
          <div key={watchlist.id}
</rewritten_file> 