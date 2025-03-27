import React from 'react';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stock-overview">
        <div className="stock-card">
          <h3>AAPL</h3>
          <p>Apple Inc.</p>
          <p className="price">$150.23</p>
          <p className="change positive">+2.5%</p>
        </div>
        <div className="stock-card">
          <h3>GOOGL</h3>
          <p>Alphabet Inc.</p>
          <p className="price">$2,850.00</p>
          <p className="change negative">-1.2%</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 