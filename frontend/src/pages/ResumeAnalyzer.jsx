import React, { useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { api } from '../api';

export default function ResumeAnalyzer() {
  const { user } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.resumeAnalyze(file);
      setResult(data.analysis);
    } catch (err) {
      setError('Failed to analyze resume. Is the backend running?');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
        <h2>AI Resume Analyzer</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Upload your resume and get instant AI feedback.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          <div className="input-group">
            <label>Resume (PDF or Image)</label>
            <input
              type="file"
              accept=".pdf,image/*"
              className="input-field"
              style={{ padding: '0.5rem' }}
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file && <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>✓ {file.name}</span>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !file} style={{ width: '100%' }}>
            {loading ? <><div className="spinner"></div> Analyzing...</> : 'Analyze Resume'}
          </button>
        </form>

        {error && <div className="status-message status-error" style={{ marginTop: '1rem' }}>{error}</div>}

        {result && (
          <div style={{ marginTop: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-glow)' }}>
              <h3>Analysis Results</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{result.score}</div>
                <div>
                  <div style={{ fontWeight: 600 }}>Resume Score</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>out of 100</div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>🎯 Target Companies</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {result.target_companies?.map((c, i) => (
                    <span key={i} className="badge badge-purple">{c}</span>
                  ))}
                </div>
              </div>

              <div>
                <strong>✏️ Formatting Suggestions</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                  {result.formatting_fixes?.map((fix, i) => (
                    <li key={i} style={{ marginBottom: '0.4rem' }}>{fix}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
