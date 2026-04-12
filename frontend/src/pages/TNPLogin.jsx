import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';

export default function TNPLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const result = await api.tnpLogin(username, password);
      if (result.token) {
        setStatus({ type: 'success', message: 'Login successful! Redirecting...' });
        login({ ...result.user, name: 'TNP Coordinator' }, result.token);
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setStatus({ type: 'error', message: result.error || 'Invalid credentials.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Server connection failed.' });
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ padding: '2.5rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
        <h2>TNP Coordinator Login</h2>
        <p className="auth-subtitle">Secure admin access for Training & Placement</p>

        {status && (
          <div className={`status-message ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input type="text" className="input-field" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? <><div className="spinner"></div> Authenticating...</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Demo credentials: <strong>admin</strong> / <strong>tnp_secure_123</strong></p>
        </div>
      </div>
    </div>
  );
}
