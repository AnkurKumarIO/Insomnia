import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';

export default function StudentAuth() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus({ type: 'error', message: 'Please upload your college ID document.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const result = await api.studentVerify(file);
      if (result.token) {
        setStatus({ type: 'success', message: `Welcome, ${result.user.name}! Redirecting...` });
        login(result.user, result.token);
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        setStatus({ type: 'error', message: result.error || 'Verification failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Something went wrong. Try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ padding: '2.5rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
        <h2>Student Verification</h2>
        <p className="auth-subtitle">Upload your college ID for AI-powered OCR verification</p>

        {status && (
          <div className={`status-message ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>College ID Document</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="input-field"
              style={{ padding: '0.5rem' }}
            />
            {file && <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>✓ {file.name}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? <><div className="spinner"></div> Verifying...</> : 'Verify & Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Upload any file — OCR is mocked. Logs in as <strong>Alice Johnson</strong>.</p>
          <p style={{ marginTop: 8 }}>New student? <a href="/auth/student/register" style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>Create account</a></p>
        </div>
      </div>
    </div>
  );
}
