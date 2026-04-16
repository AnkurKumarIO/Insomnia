import React, { useState, useContext, useRef, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';

// ── Animated step indicator ────────────────────────────────────────────────────
const STEPS = [
  { icon: '📄', label: 'Reading document' },
  { icon: '🔍', label: 'Validating content' },
  { icon: '🤖', label: 'AI deep analysis' },
  { icon: '✨', label: 'Generating report' },
];

function ProcessingScreen() {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1rem', textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      {/* Pulsing orb */}
      <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 2rem' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,0.6) 0%, transparent 70%)',
          animation: 'pulseOrb 1.5s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid rgba(195,192,255,0.3)',
          animation: 'spinRing 2s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
        }}>
          {STEPS[step].icon}
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>
        Analyzing your resume…
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#9b98b8', marginBottom: '2.5rem' }}>
        Our AI is reading every detail to give you real feedback
      </p>

      {/* Step pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '0.65rem 1rem',
              borderRadius: 12,
              background: done ? 'rgba(78,222,163,0.08)' : active ? 'rgba(79,70,229,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${done ? 'rgba(78,222,163,0.2)' : active ? 'rgba(195,192,255,0.2)' : 'transparent'}`,
              transition: 'all 0.4s ease',
              opacity: i > step ? 0.4 : 1,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#4edea3' : active ? '#4f46e5' : '#222a3d',
                fontSize: done ? '0.7rem' : '0.8rem',
                color: done || active ? '#fff' : '#9b98b8',
                fontWeight: 700,
                animation: active ? 'pulseDot 1s ease-in-out infinite' : 'none',
              }}>
                {done ? '✓' : active ? '…' : i + 1}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500, color: active ? '#dae2fd' : done ? '#4edea3' : '#9b98b8' }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes pulseOrb { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.15);opacity:1} }
        @keyframes spinRing { to{transform:rotate(360deg)} }
        @keyframes pulseDot { 0%,100%{box-shadow:0 0 0 0 rgba(79,70,229,0.6)} 50%{box-shadow:0 0 0 6px rgba(79,70,229,0)} }
      `}</style>
    </div>
  );
}

// ── Not a resume error screen ─────────────────────────────────────────────────
function NotResumeScreen({ message, onReset }) {
  return (
    <div style={{ maxWidth: 500, margin: '4rem auto', padding: '0 1rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd', textAlign: 'center' }}>
      <div style={{ background: '#131b2e', borderRadius: 20, padding: '2.5rem', border: '1px solid rgba(255,107,107,0.2)', boxShadow: '0 0 40px rgba(255,107,107,0.08)' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.5rem',
          background: 'rgba(255,107,107,0.1)', border: '2px solid rgba(255,107,107,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
        }}>
          🚫
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 12, color: '#ffb4ab' }}>
          That doesn't look like a resume
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#9b98b8', lineHeight: 1.7, marginBottom: '0.75rem' }}>
          {message || 'The document you uploaded does not appear to be a resume or CV.'}
        </p>
        <div style={{ background: 'rgba(255,185,95,0.08)', border: '1px solid rgba(255,185,95,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '2rem', fontSize: '0.8rem', color: '#ffb95f', lineHeight: 1.6 }}>
          💡 <strong>Tip:</strong> Please upload a PDF or image of your actual resume/CV — the document listing your education, work experience, skills, and projects.
        </div>
        <button
          onClick={onReset}
          style={{
            width: '100%', padding: '0.875rem',
            background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5',
            border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '0.9rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span>↑</span> Try Again with a Resume
        </button>
      </div>
    </div>
  );
}

// ── Circular score ring ───────────────────────────────────────────────────────
function ScoreRing({ score, color, label, size = 120, stroke = 8 }) {
  const R = (size - stroke * 2) / 2;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - score / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={R} fill="transparent" stroke="#2d3449" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={R} fill="transparent" stroke={color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 100 ? '1.75rem' : '1.1rem', fontWeight: 900, color }}>{score}</span>
        {label && <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color, marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
}

// ── Grade badge ───────────────────────────────────────────────────────────────
function GradeBadge({ grade }) {
  const colors = { A: '#4edea3', B: '#c3c0ff', C: '#ffb95f', D: '#ff6b6b' };
  const c = colors[grade] || '#c7c4d8';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 40, height: 40, borderRadius: 10,
      background: `${c}18`, border: `1.5px solid ${c}44`,
      fontSize: '1.1rem', fontWeight: 900, color: c, letterSpacing: '-0.02em',
    }}>{grade}</div>
  );
}

// ── Results View ──────────────────────────────────────────────────────────────
function ResultsView({ result, onReset, navigate }) {
  const score = result.score || 0;
  const atsScore = result.ats_score || score;
  const scoreColor = score >= 85 ? '#4edea3' : score >= 70 ? '#c3c0ff' : score >= 55 ? '#ffb95f' : '#ff8a80';
  const scoreLabel = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Fair' : 'Needs Work';
  const atsColor = atsScore >= 80 ? '#4edea3' : atsScore >= 60 ? '#ffb95f' : '#ff8a80';

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>

      {/* Back */}
      <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#9b98b8', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1.5rem', padding: 0, fontFamily: 'inherit' }}>
        ← Analyze another resume
      </button>

      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg, #131b2e 0%, #1a2035 100%)',
        borderRadius: 20, padding: '2rem', marginBottom: '1.25rem',
        border: `1px solid ${scoreColor}28`,
        boxShadow: `0 0 60px ${scoreColor}0a`,
        display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <ScoreRing score={score} color={scoreColor} label={scoreLabel} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {result.grade && <GradeBadge grade={result.grade} />}
            {result.role_detected && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: 999, background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', color: '#c3c0ff', letterSpacing: '0.04em' }}>
                {result.role_detected}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.2 }}>
            {score >= 85 ? '🎉 Your resume is strong!' : score >= 70 ? '👍 Solid foundation, room to grow' : score >= 55 ? "⚡ Good start — let's improve it" : '🔧 Needs significant work'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#9b98b8', lineHeight: 1.65 }}>
            {score >= 85
              ? 'Your resume is well-optimized for top-tier roles. Apply with confidence!'
              : score >= 70
              ? 'A few targeted improvements will significantly boost your match rate.'
              : 'Follow the suggestions below to bring your resume up to industry standard.'}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* ATS Score */}
        <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <ScoreRing score={atsScore} color={atsColor} size={64} stroke={6} />
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9b98b8', marginBottom: 3 }}>ATS Score</div>
            <div style={{ fontWeight: 800, color: atsColor, fontSize: '0.9rem' }}>{atsScore >= 80 ? 'High' : atsScore >= 60 ? 'Medium' : 'Low'} Compatibility</div>
          </div>
        </div>

        {/* Experience */}
        {result.experience_years !== undefined && (
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(195,192,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🗓️</div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9b98b8', marginBottom: 3 }}>Experience</div>
              <div style={{ fontWeight: 800, color: '#c3c0ff', fontSize: '0.9rem' }}>{result.experience_years}+ yr{result.experience_years !== 1 ? 's' : ''}</div>
            </div>
          </div>
        )}

        {/* Suggestions count */}
        <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,185,95,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>💡</div>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9b98b8', marginBottom: 3 }}>Improvements</div>
            <div style={{ fontWeight: 800, color: '#ffb95f', fontSize: '0.9rem' }}>{result.formatting_fixes?.length || 0} items found</div>
          </div>
        </div>
      </div>

      {/* Two-col: Target Companies + Top Skills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Target Companies */}
        <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🏢</span>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Target Companies</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {result.target_companies?.map((c, i) => (
              <span key={i} style={{ padding: '0.3rem 0.7rem', background: 'rgba(78,222,163,0.08)', border: '1px solid rgba(78,222,163,0.18)', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, color: '#4edea3' }}>{c}</span>
            ))}
          </div>
        </div>

        {/* Top Skills */}
        <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Detected Skills</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {result.top_skills?.map((s, i) => (
              <span key={i} style={{ padding: '0.3rem 0.7rem', background: 'rgba(195,192,255,0.08)', border: '1px solid rgba(195,192,255,0.18)', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, color: '#c3c0ff' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Keyword Gaps */}
      {result.keyword_gaps?.length > 0 && (
        <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(255,185,95,0.12)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🔑</span>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Missing Keywords</h3>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#9b98b8' }}>Add these to beat ATS filters</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {result.keyword_gaps.map((gap, i) => (
              <span key={i} style={{ padding: '0.35rem 0.85rem', background: 'rgba(255,185,95,0.06)', border: '1px solid rgba(255,185,95,0.2)', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, color: '#ffb95f', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.6rem' }}>+</span>{gap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {result.strengths?.length > 0 && (
        <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(78,222,163,0.12)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>✅</span>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Your Strengths</h3>
          </div>
          {result.strengths.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: i < result.strengths.length - 1 ? '1px solid rgba(70,69,85,0.08)' : 'none' }}>
              <span style={{ color: '#4edea3', fontSize: '1rem', marginTop: 1 }}>✦</span>
              <span style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.6 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Improvement Suggestions */}
      {result.formatting_fixes?.length > 0 && (
        <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.15)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>📝</span>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Improvement Suggestions</h3>
          </div>
          {result.formatting_fixes.map((fix, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0.75rem 0', borderBottom: i < result.formatting_fixes.length - 1 ? '1px solid rgba(70,69,85,0.1)' : 'none' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,185,95,0.12)', border: '1px solid rgba(255,185,95,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#ffb95f' }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.65 }}>{fix}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA row */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '0.875rem', background: '#222a3d', color: '#c7c4d8', border: '1px solid rgba(70,69,85,0.2)', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          ← Dashboard
        </button>
        <button onClick={onReset} style={{ flex: 1, padding: '0.875rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          ↺ Analyze Another
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ResumeAnalyzer() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notResume, setNotResume] = useState(null);   // { message }
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef(null);

  if (!user) return <Navigate to="/" replace />;

  const handleFile = (f) => {
    if (!f) return;
    const MAX = 10 * 1024 * 1024;
    if (f.size > MAX) { setError('File too large. Maximum size is 10 MB.'); return; }
    setError(null);
    setNotResume(null);
    setFile(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !text.trim()) return;
    setLoading(true);
    setError(null);
    setNotResume(null);
    try {
      const input = text.trim() ? text.trim() : file;
      console.log('Submitting resume analysis:', { input: typeof input === 'string' ? input.substring(0, 100) + '...' : input?.name, userId: user?.id });
      const data = await api.resumeAnalyze(input, user?.id);
      console.log('API Response:', data);
      if (data.error === 'not_a_resume') {
        setNotResume({ message: data.message });
      } else if (data.error === 'text_extraction_failed') {
        setError(data.message || 'Could not read text from this file. Please try a clearer resume PDF or image.');
      } else if (data.error === 'image_analysis_unavailable') {
        setError(data.message || 'Image resume analysis is temporarily unavailable. Please upload a PDF resume instead.');
      } else if (data.error === 'file_too_large') {
        setError(data.message || 'File too large. Maximum size is 10 MB.');
      } else if (data.analysis) {
        console.log('Setting result:', data.analysis);
        setResult(data.analysis);
      } else {
        setError(data.message || data.error || 'Unexpected response from server. Please try again.');
      }
    } catch (err) {
      console.error('Frontend error:', err);
      setError('Failed to reach the server. Is the backend running?');
    }
    setLoading(false);
  };

  const reset = () => { setFile(null); setText(''); setResult(null); setError(null); setNotResume(null); };

  if (loading) return <ProcessingScreen />;
  if (notResume) return <NotResumeScreen message={notResume.message} onReset={reset} />;
  if (result) return <ResultsView result={result} onReset={reset} navigate={navigate} />;

  // ── Upload screen ────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 560, margin: '3rem auto', padding: '0 1rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{
        background: 'linear-gradient(160deg, #131b2e 0%, #1c2540 100%)',
        borderRadius: 24, padding: '2.5rem',
        border: '1px solid rgba(79,70,229,0.15)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: '0 auto 1.25rem',
            background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
            boxShadow: '0 8px 30px rgba(79,70,229,0.4)',
          }}>🤖</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8, background: 'linear-gradient(135deg,#dae2fd,#c3c0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Resume Analyzer
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#9b98b8', lineHeight: 1.65, maxWidth: 360, margin: '0 auto' }}>
            Upload your resume and get an honest, real-time AI analysis — score, skill gaps, target companies, and actionable fixes.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Drop zone */}
          <label
            ref={dropRef}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 14, padding: '2.5rem 1.5rem',
              background: dragOver
                ? 'rgba(79,70,229,0.1)'
                : file
                ? 'rgba(78,222,163,0.05)'
                : 'rgba(255,255,255,0.02)',
              border: `2px dashed ${dragOver ? 'rgba(195,192,255,0.6)' : file ? 'rgba(78,222,163,0.35)' : 'rgba(70,69,85,0.3)'}`,
              borderRadius: 16, cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: file ? 'rgba(78,222,163,0.12)' : dragOver ? 'rgba(79,70,229,0.15)' : 'rgba(70,69,85,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
              transition: 'all 0.3s ease',
            }}>
              {file ? '✅' : dragOver ? '📂' : '📎'}
            </div>
            <div style={{ textAlign: 'center' }}>
              {file ? (
                <>
                  <div style={{ fontWeight: 700, color: '#4edea3', fontSize: '0.95rem', marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9b98b8' }}>{(file.size / 1024).toFixed(0)} KB · Click to change</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: '#dae2fd' }}>
                    {dragOver ? 'Drop it here!' : 'Drop your resume here'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9b98b8' }}>PDF, JPG, PNG, WEBP · Max 10 MB</div>
                </>
              )}
            </div>
            <input type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          </label>

          {/* Or paste text */}
          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#9b98b8', margin: '-0.5rem 0' }}>— or —</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your resume text here..."
            style={{
              width: '100%', minHeight: 120, padding: '1rem',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(70,69,85,0.3)',
              borderRadius: 12, color: '#dae2fd', fontFamily: 'inherit', fontSize: '0.875rem',
              resize: 'vertical', outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(195,192,255,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(70,69,85,0.3)'}
          />

          {/* Supported formats note */}
          {!file && !text.trim() && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {['PDF', 'JPG', 'PNG', 'WEBP', 'Text'].map(f => (
                <span key={f} style={{ padding: '0.2rem 0.55rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(70,69,85,0.25)', borderRadius: 6, fontSize: '0.68rem', fontWeight: 600, color: '#9b98b8' }}>{f}</span>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#ffb4ab', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!file && !text.trim()}
            style={{
              width: '100%', padding: '1rem',
              background: (!file && !text.trim()) ? '#222a3d' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              color: (!file && !text.trim()) ? '#9b98b8' : '#fff',
              border: 'none', borderRadius: 14,
              fontWeight: 800, fontSize: '0.95rem',
              cursor: (!file && !text.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            Analyze Resume
          </button>
        </form>

        {/* What we analyze */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(70,69,85,0.15)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9b98b8', marginBottom: '0.75rem', textAlign: 'center' }}>What you'll get</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['📊', 'Resume score & grade'],
              ['🎯', 'ATS compatibility'],
              ['🏢', 'Target companies'],
              ['🔑', 'Missing keywords'],
              ['✅', 'Your strengths'],
              ['📝', 'Improvement tips'],
            ].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#9b98b8' }}>
                <span>{icon}</span> {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
