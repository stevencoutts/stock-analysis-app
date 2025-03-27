import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast ${type} ${isVisible ? 'show' : ''}`}>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={() => setIsVisible(false)}>
        ×
      </button>
    </div>
  );
};

export default Toast; 