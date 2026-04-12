import React, { useState, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';

export default function ResumeAnalyzer() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
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
    try {
      const data = await api.resumeAnalyze(file);
      setResult(data.analysis);
    } catch (err) {
      setError('Failed to analyze resume. Is the backend running?');
    }
    setLoading(false);
  };

  // ── Analysis Result View ──────────────────────────────────────────────
  if (result) {
    const scoreColor = result.score >= 85 ? '#4edea3' : result.score >= 70 ? '#ffb95f' : '#ffb4ab';
    const scoreLabel = result.score >= 85 ? 'Excellent' : result.score >= 70 ? 'Good' : 'Needs Work';
    const CIRC = 2 * Math.PI * 54;
    const offset = CIRC * (1 - result.score / 100);

    return (
      <div style={{ maxWidth: 760, margin: '2rem auto', padding: '0 1rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
        {/* Back button */}
        <button onClick={() => setResult(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#c7c4d8', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Analyze another resume
        </button>

        {/* Score hero */}
        <div style={{ background: '#131b2e', borderRadius: 20, padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', border: `1px solid ${scoreColor}30` }}>
          {/* Circular score */}
          <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="54" fill="transparent" stroke="#2d3449" strokeWidth="8" />
              <circle cx="60" cy="60" r="54" fill="transparent" stroke={scoreColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: scoreColor }}>{result.score}</span>
              <span style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: scoreColor }}>{scoreLabel}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c7c4d8', marginBottom: 6 }}>Resume Score</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
              {result.score >= 85 ? 'Your resume is strong! 🎉' : result.score >= 70 ? 'Good foundation, room to improve' : 'Needs significant improvements'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.6 }}>
              {result.score >= 85
                ? 'Your resume is well-optimized for top-tier tech roles. Apply with confidence.'
                : 'Follow the suggestions below to boost your match rate with target companies.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Target Companies */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>business</span>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Target Companies</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {result.target_companies?.map((c, i) => (
                <span key={i} style={{ padding: '0.3rem 0.75rem', background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, color: '#4edea3' }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>insights</span>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Quick Stats</h3>
            </div>
            {[
              { label: 'ATS Compatibility', val: result.score >= 80 ? 'High' : 'Medium', color: result.score >= 80 ? '#4edea3' : '#ffb95f' },
              { label: 'Keyword Match', val: `${result.score}%`, color: scoreColor },
              { label: 'Suggestions', val: `${result.formatting_fixes?.length || 0} items`, color: '#c3c0ff' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
                <span style={{ fontSize: '0.78rem', color: '#c7c4d8' }}>{s.label}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Formatting suggestions */}
        <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.15)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Improvement Suggestions</h3>
          </div>
          {result.formatting_fixes?.map((fix, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0.75rem 0', borderBottom: i < result.formatting_fixes.length - 1 ? '1px solid rgba(70,69,85,0.1)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,185,95,0.15)', border: '1px solid rgba(255,185,95,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ffb95f' }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.6 }}>{fix}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '0.875rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
          <button onClick={() => setResult(null)} style={{ flex: 1, padding: '0.875rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
            Analyze Another
          </button>
        </div>
      </div>
    );
  }

  // ── Upload View ───────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 560, margin: '3rem auto', padding: '0 1rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{ background: '#131b2e', borderRadius: 20, padding: '2.5rem', border: '1px solid rgba(70,69,85,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#1d00a5', fontSize: 30, fontVariationSettings: "'FILL' 1" }}>description</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>AI Resume Analyzer</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.6 }}>Upload your resume and get instant AI-powered feedback on score, target companies, and improvements.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Drop zone */}
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '2rem', background: file ? 'rgba(78,222,163,0.06)' : '#222a3d', border: `2px dashed ${file ? 'rgba(78,222,163,0.4)' : 'rgba(70,69,85,0.4)'}`, borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: file ? '#4edea3' : '#c7c4d8' }}>{file ? 'check_circle' : 'upload_file'}</span>
            <div style={{ textAlign: 'center' }}>
              {file ? (
                <>
                  <div style={{ fontWeight: 700, color: '#4edea3', marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>Click to change file</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop your resume here</div>
                  <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>PDF or image • Max 10MB</div>
                </>
              )}
            </div>
            <input type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
          </label>

          {error && (
            <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#ffb4ab' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !file} style={{ width: '100%', padding: '0.875rem', background: loading || !file ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: loading || !file ? '#c7c4d8' : '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: loading || !file ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Analyzing your resume...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
                Analyze Resume
              </>
            )}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
