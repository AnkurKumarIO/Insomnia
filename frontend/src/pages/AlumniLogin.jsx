import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import { api } from '../api';

export default function AlumniLogin() {
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
      const result = await api.alumniLogin(username, password);
      if (result.token) {
        setStatus({ type: 'success', message: `Welcome, ${result.user.name}!` });
        login(result.user, result.token);
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setStatus({ type: 'error', message: result.error || 'Login failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Server connection failed.' });
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ padding: '2.5rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍💼</div>
        <h2>Alumni Mentor Login</h2>
        <p className="auth-subtitle">Welcome back, mentor.</p>

        {status && (
          <div className={`status-message ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input type="text" className="input-field" placeholder="e.g. mentor_joe" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? <><div className="spinner"></div> Logging in...</> : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/alumni/register" style={{ color: 'var(--accent-purple)' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
