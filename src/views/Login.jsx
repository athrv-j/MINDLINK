/* ═══════════════════════════════════════════════════════════════
   LOGIN VIEW
   Neon pulse styled authentication page.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Login.css';

export default function Login() {
  const { login } = useApp();
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password, isSignup);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card neon-box">
        <div className="login-header">
          <img src="/logo.png" alt="MindLink Logo" className="login-logo" />
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </div>
          
          {error && <p className="login-error">{error}</p>}
          
          <button 
            type="submit" 
            className="login-button neon-button"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (isSignup ? 'Create Account' : 'Enter Credentials')}
          </button>
        </form>
        <p className="login-hint">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button" 
            onClick={() => setIsSignup(!isSignup)}
            style={{background:'none', border:'none', color:'var(--color-accent)', cursor:'pointer', textDecoration:'underline'}}
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
