import React from 'react';
import { useParams } from 'react-router-dom';

const WatchlistDetails = () => {
  const { id } = useParams();

  return (
    <div className="watchlist-details card">
      <h2>Watchlist Details</h2>
      <p>Viewing watchlist ID: {id}</p>
    </div>
  );
};

export default WatchlistDetails; 