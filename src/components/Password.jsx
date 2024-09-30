import React, { useState } from 'react';

const correctPassword = import.meta.env.VITE_PASSWORD ?? (typeof process !== 'undefined' ? process.env.VITE_PASSWORD : '')

const PasswordPage = ({ onCorrectPassword, children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(correctPassword === '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
      onCorrectPassword();
    } else {
      alert('Incorrect password. Please try again.');
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="password-protection">
      <div className="metrocard-background"></div>
      <h2>Please carry MetroCard at all times</h2>
      <form onSubmit={handleSubmit} className="password-form">
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="password-input"
        />
        <button type="submit" className="submit-button">Swipe</button>
      </form>
    </div>
  );
};

export default PasswordPage;