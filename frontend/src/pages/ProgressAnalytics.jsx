import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';
import { subscribeRealtimeSync } from '../lib/realtimeSync';

const INSIGHTS = [
  { icon: 'record_voice_over', color: '#4edea3', title: 'Vocal Clarity',   text: "Focus on pacing and ending sentences with conviction to improve clarity scores." },
  { icon: 'analytics',         color: '#c3c0ff', title: 'Narrative Arc',   text: "Use quantitative results in your STAR method 'Results' phase to boost your score." },
  { icon: 'diversity_3',       color: '#ffb95f', title: 'Cultural Fit',    text: "Showcase leadership examples alongside collaborative stories in your next mock." },
  { icon: 'history',           color: '#ffb4ab', title: 'Consistency',     text: "Schedule regular mock sessions to maintain upward momentum in your scores." },
];

export default function ProgressAnalytics() {
  const { user } = useContext(AuthContext);
  const [interviews, setInterviews]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(null);
  const [reportModal, setReportModal] = useState(null);

  const HISTORY_KEY = 'alumnex_interview_history';

  const loadInterviews = () => {
    // 1. Load from localStorage (saved after each session)
    try {
      const local = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const userHistory = local.filter(r => r.userId === user?.id || r.studentName === user?.name);
      if (userHistory.length > 0) {
        setInterviews(userHistory);
        setLoading(false);
        return;
      }
    } catch {}

    // 2. Fallback: fetch from API
    if (!user?.id) { setLoading(false); return; }
    api.getInterviewRecords(user.id).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((r, i) => ({
          id:        r.interview_id,
          label:     `Mock Interview #${String(i + 1).padStart(2, '0')}`,
          score:     r.student_score || 0,
          date:      r.created_at,
          checklist: r.ai_action_items?.actionable_insights
            ? r.ai_action_items.actionable_insights.map(t => ({ done: false, text: t }))
            : [],
          analytics: r.ai_action_items || null,
          userId:    user.id,
        }));
        setInterviews(mapped.reverse());
        // Save to localStorage for offline access
        try {
          const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
          const merged = [...mapped, ...existing.filter(e => !mapped.find(m => m.id === e.id))];
          localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
        } catch {}
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadInterviews(); }, [user?.id, user?.name]);

  useEffect(() => subscribeRealtimeSync(() => loadInterviews()), [user?.id, user?.name]);

  // Derived stats
  const scores      = interviews.filter(i => i.score > 0).map(i => i.score);
  const avgScore    = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalCount  = interviews.length;

  // Build chart points from real scores (up to 5)
  const chartScores = scores.slice(-5);
  const maxS = Math.max(...chartScores, 100);
  const chartPoints = chartScores.map((s, i) => [
    i * (1200 / Math.max(chartScores.length - 1, 1)),
    260 - (s / maxS) * 240,
  ]);
  const pathD = chartPoints.length > 1
    ? `M ${chartPoints.map(p => p.join(' ')).join(' L ')}`
    : null;

  const toggleCheckItem = (interviewId, itemIdx) => {
    setInterviews(prev => {
      const updated = prev.map(iv =>
        iv.id === interviewId
          ? { ...iv, checklist: iv.checklist.map((c, i) => i === itemIdx ? { ...c, done: !c.done } : c) }
          : iv
      );
      // Persist checklist state
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#c7c4d8', gap: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 28, opacity: 0.4, animation: 'spin 1s linear infinite' }}>progress_activity</span>
      Loading your analytics...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 12 }}>
          Your Growth <span style={{ background: 'linear-gradient(135deg,#c3c0ff,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Journey</span>
        </h1>
        <p style={{ fontSize: '1rem', color: '#c7c4d8', lineHeight: 1.6 }}>Track your mock interview performance, identify weak spots, and watch your confidence soar.</p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Average Score', val: scores.length ? `${avgScore}%` : '—', change: scores.length > 1 ? `+${Math.max(0, scores[scores.length-1] - scores[0])}%` : null, changeColor: '#4edea3' },
          { label: 'Total Mock Interviews', val: totalCount || '0', sub: 'Completed' },
          { label: 'Top Improvement Area', val: interviews[0]?.analytics?.actionable_insights?.[0]?.split(' ').slice(0,3).join(' ') || 'Complete an interview', highlight: true },
        ].map((m, i) => (
          <div key={i} style={{ background: '#171f33', borderRadius: 12, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)', position: 'relative', overflow: 'hidden' }}>
            {m.highlight && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#c3c0ff' }} />}
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 8 }}>{m.label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: m.highlight ? '1.2rem' : '2.5rem', fontWeight: 900, color: m.highlight ? '#ffb95f' : '#c3c0ff' }}>{m.val}</span>
              {m.change && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: m.changeColor, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 2 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_upward</span>{m.change}</span>}
              {m.sub && <span style={{ fontSize: '0.8rem', color: '#c7c4d8', marginBottom: 6 }}>{m.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Past Interviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ background: '#131b2e', borderRadius: 12, padding: '2rem', border: '1px solid rgba(70,69,85,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Performance Trend</h2>
            <span style={{ padding: '0.25rem 0.75rem', background: '#2d3449', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>Interview Score</span>
          </div>
          <div style={{ position: 'relative', height: 280 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 25}%`, borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
            ))}
            {pathD ? (
              <svg width="100%" height="260" viewBox="0 0 1200 260" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <linearGradient id="lg" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#c3c0ff" />
                  </linearGradient>
                </defs>
                <path d={pathD} fill="none" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" />
                {chartPoints.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="6" fill={i < 2 ? '#4f46e5' : '#c3c0ff'} stroke="#0b1326" strokeWidth="2" />
                ))}
              </svg>
            ) : chartPoints.length === 1 ? (
              <svg width="100%" height="260" viewBox="0 0 1200 260" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
                <circle cx={600} cy={chartPoints[0][1]} r="8" fill="#c3c0ff" stroke="#0b1326" strokeWidth="2">
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x={600} y={chartPoints[0][1] - 18} textAnchor="middle" fill="#c3c0ff" fontSize="14" fontWeight="700">{chartScores[0]}%</text>
              </svg>
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c7c4d8', fontSize: '0.875rem', opacity: 0.5 }}>
                Complete mock interviews to see your trend
              </div>
            )}
            {chartPoints.length > 0 && (
              <div style={{ position: 'absolute', bottom: -24, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>
                {chartScores.map((_, i) => <span key={i}>Int {String(i+1).padStart(2,'0')}</span>)}
              </div>
            )}
          </div>
        </div>

        <div style={{ background: '#222a3d', borderRadius: 12, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.1)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Past Interviews</h2>
          {interviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#c7c4d8', opacity: 0.5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>videocam_off</span>
              <p style={{ fontSize: '0.8rem' }}>No interviews yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {interviews.map(iv => (
                <div key={iv.id} style={{ background: expanded === iv.id ? '#171f33' : '#131b2e', borderRadius: 12, overflow: 'hidden', border: expanded === iv.id ? '1px solid rgba(195,192,255,0.2)' : '1px solid transparent' }}>
                  <button onClick={() => setExpanded(expanded === iv.id ? null : iv.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#dae2fd' }}>
                    <div>
                      {expanded === iv.id && <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Current Focus</div>}
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{iv.label}</span>
                      {iv.score > 0 && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#4edea3', fontWeight: 700 }}>{iv.score}%</span>}
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c7c4d8' }}>{expanded === iv.id ? 'expand_less' : 'expand_more'}</span>
                  </button>
                  {expanded === iv.id && iv.checklist.length > 0 && (
                    <div style={{ padding: '0 1rem 1rem' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 12 }}>Feedback Checklist</div>
                      {iv.checklist.map((c, i) => (
                        <div key={i} onClick={() => toggleCheckItem(iv.id, i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, cursor: 'pointer' }}>
                          <div style={{ width: 20, height: 20, borderRadius: 4, background: c.done ? 'rgba(78,222,163,0.2)' : 'transparent', border: c.done ? 'none' : '1px solid rgba(70,69,85,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            {c.done && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#4edea3', fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                          </div>
                          <span style={{ fontSize: '0.8rem', color: c.done ? '#dae2fd' : '#c7c4d8', textDecoration: c.done ? 'line-through' : 'none', opacity: c.done ? 0.7 : 1 }}>{c.text}</span>
                        </div>
                      ))}
                      <button onClick={() => setReportModal(iv)} style={{ width: '100%', marginTop: 8, padding: '0.5rem', background: '#2d3449', color: '#c3c0ff', border: 'none', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                        View Detailed Report
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Insights — from latest interview or static fallback */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 28 }}>auto_awesome</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>AI Curator Insights</h2>
          {interviews[0]?.analytics && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4edea3', background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 999, padding: '0.2rem 0.6rem' }}>From latest interview</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
          {(interviews[0]?.analytics?.actionable_insights?.length > 0
            ? interviews[0].analytics.actionable_insights.slice(0, 4).map((text, i) => ({
                icon: ['record_voice_over','analytics','diversity_3','history'][i % 4],
                color: ['#4edea3','#c3c0ff','#ffb95f','#ffb4ab'][i % 4],
                title: `Action Item ${i + 1}`,
                text,
              }))
            : INSIGHTS
          ).map(ins => (
            <div key={ins.title} style={{ background: '#171f33', borderRadius: 12, padding: '1.5rem', borderLeft: '3px solid transparent', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderLeft = `3px solid ${ins.color}`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderLeft = '3px solid transparent'; e.currentTarget.style.transform = 'none'; }}>
              <span className="material-symbols-outlined" style={{ color: ins.color, fontSize: 24, marginBottom: 12, display: 'block' }}>{ins.icon}</span>
              <h4 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>{ins.title}</h4>
              <p style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6 }}>{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

      {reportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 560, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Detailed Report</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#dae2fd' }}>{reportModal.label}</h3>
              </div>
              <button onClick={() => setReportModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {reportModal.score > 0 && (
              <div style={{ background: '#131b2e', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>Overall Score</span>
                  <span style={{ fontSize: '2rem', fontWeight: 900, color: '#c3c0ff' }}>{reportModal.score}</span>
                </div>
                <div style={{ height: 8, background: '#2d3449', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${reportModal.score}%`, background: 'linear-gradient(90deg,#4f46e5,#c3c0ff)', borderRadius: 999 }} />
                </div>
              </div>
            )}
            {reportModal.checklist.length > 0 && (
              <div style={{ background: '#131b2e', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: '1rem' }}>Action Items</div>
                {reportModal.checklist.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: c.done ? '#4edea3' : '#464555', fontVariationSettings: "'FILL' 1" }}>{c.done ? 'check_circle' : 'radio_button_unchecked'}</span>
                    <span style={{ fontSize: '0.875rem', color: c.done ? '#4edea3' : '#c7c4d8', textDecoration: c.done ? 'line-through' : 'none', opacity: c.done ? 0.7 : 1 }}>{c.text}</span>
                  </div>
                ))}
              </div>
            )}
            {reportModal.analytics?.overall_confidence && (
              <div style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(11,19,38,0.8))', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>AI Analysis</div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[['Confidence', reportModal.analytics.overall_confidence], ['Clarity', reportModal.analytics.communication_clarity], ['Depth', reportModal.analytics.technical_depth]].map(([k,v]) => v && (
                    <div key={k} style={{ fontSize: '0.8rem', color: '#dae2fd' }}><span style={{ color: '#c7c4d8' }}>{k}:</span> {v}</div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setReportModal(null)} style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Close Report</button>
          </div>
        </div>
      )}
    </div>
  );
}
