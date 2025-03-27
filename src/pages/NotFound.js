import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="not-found card text-center">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="button button-primary mt-3">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound; 