import React, { useState } from 'react';

const INTERVIEWS = [
  { id: 5, label: 'Mock Interview #05', score: 88, expanded: true,  checklist: [{ done: true, text: 'Improve eye contact' },{ done: false, text: 'Structure STAR responses better' },{ done: false, text: "Reduce filler words ('um','like')" },{ done: false, text: 'Clarify technical project details' }] },
  { id: 4, label: 'Mock Interview #04', score: 76, expanded: false, checklist: [] },
  { id: 3, label: 'Mock Interview #03', score: 70, expanded: false, checklist: [] },
];

const INSIGHTS = [
  { icon: 'record_voice_over', color: '#4edea3', title: 'Vocal Clarity',   text: "Your pacing has improved by 15% in the last two sessions. Focus on ending sentences with conviction." },
  { icon: 'analytics',         color: '#c3c0ff', title: 'Narrative Arc',   text: "Use more quantitative results in your STAR method 'Results' phase to increase your score." },
  { icon: 'diversity_3',       color: '#ffb95f', title: 'Cultural Fit',    text: "You're excelling in collaborative stories. Try to showcase more leadership in your next mock." },
  { icon: 'history',           color: '#ffb4ab', title: 'Consistency',     text: "Session frequency has dipped. Schedule a follow-up mock to maintain your upward momentum." },
];

// Simple SVG line graph
const POINTS = [[0,240],[300,160],[600,120],[900,60],[1200,40]];
const pathD = `M ${POINTS.map(p => p.join(' ')).join(' L ')}`;

export default function ProgressAnalytics() {
  const [expanded, setExpanded] = useState(5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 12 }}>
          Your Growth <span style={{ background: 'linear-gradient(135deg,#c3c0ff,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Journey</span>
        </h1>
        <p style={{ fontSize: '1rem', color: '#c7c4d8', lineHeight: 1.6 }}>Track your mock interview performance, identify weak spots, and watch your confidence soar.</p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Average Score', val: '82%', change: '+12%', changeColor: '#4edea3' },
          { label: 'Total Mock Interviews', val: '14', sub: 'This Term' },
          { label: 'Top Improvement Area', val: 'STAR Structure', highlight: true },
        ].map((m, i) => (
          <div key={i} style={{ background: '#171f33', borderRadius: 12, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)', position: 'relative', overflow: 'hidden' }}>
            {m.highlight && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#c3c0ff' }} />}
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 8 }}>{m.label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: m.highlight ? '1.5rem' : '2.5rem', fontWeight: 900, color: m.highlight ? '#ffb95f' : '#c3c0ff' }}>{m.val}</span>
              {m.change && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: m.changeColor, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 2 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_upward</span>{m.change}</span>}
              {m.sub && <span style={{ fontSize: '0.8rem', color: '#c7c4d8', marginBottom: 6 }}>{m.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Past Interviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Line graph */}
        <div style={{ background: '#131b2e', borderRadius: 12, padding: '2rem', border: '1px solid rgba(70,69,85,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Performance Trend</h2>
            <span style={{ padding: '0.25rem 0.75rem', background: '#2d3449', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>Interview Score</span>
          </div>
          <div style={{ position: 'relative', height: 280 }}>
            {/* Grid lines */}
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 25}%`, borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
            ))}
            <svg width="100%" height="260" viewBox="0 0 1200 260" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
              <defs>
                <linearGradient id="lg" x1="0%" x2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#c3c0ff" />
                </linearGradient>
              </defs>
              <path d={pathD} fill="none" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" />
              {POINTS.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="6" fill={i < 2 ? '#4f46e5' : '#c3c0ff'} stroke="#0b1326" strokeWidth="2" />
              ))}
            </svg>
            <div style={{ position: 'absolute', bottom: -24, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>
              {['Int 01','Int 02','Int 03','Int 04','Int 05'].map(l => <span key={l}>{l}</span>)}
            </div>
          </div>
        </div>

        {/* Past interviews */}
        <div style={{ background: '#222a3d', borderRadius: 12, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.1)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Past Interviews</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {INTERVIEWS.map(iv => (
              <div key={iv.id} style={{ background: expanded === iv.id ? '#171f33' : '#131b2e', borderRadius: 12, overflow: 'hidden', border: expanded === iv.id ? '1px solid rgba(195,192,255,0.2)' : '1px solid transparent' }}>
                <button onClick={() => setExpanded(expanded === iv.id ? null : iv.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#dae2fd' }}>
                  <div>
                    {expanded === iv.id && <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Current Focus</div>}
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{iv.label}</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c7c4d8' }}>{expanded === iv.id ? 'expand_less' : 'expand_more'}</span>
                </button>
                {expanded === iv.id && iv.checklist.length > 0 && (
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 12 }}>Feedback Checklist</div>
                    {iv.checklist.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 4, background: c.done ? 'rgba(78,222,163,0.2)' : 'transparent', border: c.done ? 'none' : '1px solid rgba(70,69,85,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          {c.done && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#4edea3', fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: c.done ? '#dae2fd' : '#c7c4d8' }}>{c.text}</span>
                      </div>
                    ))}
                    <button style={{ width: '100%', marginTop: 8, padding: '0.5rem', background: '#2d3449', color: '#c3c0ff', border: 'none', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                      View Detailed Report
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 28 }}>auto_awesome</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>AI Curator Insights</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
          {INSIGHTS.map(ins => (
            <div key={ins.title} style={{ background: '#171f33', borderRadius: 12, padding: '1.5rem', position: 'relative', overflow: 'hidden', borderLeft: `3px solid transparent`, transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderLeft = `3px solid ${ins.color}`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderLeft = '3px solid transparent'; e.currentTarget.style.transform = 'none'; }}>
              <span className="material-symbols-outlined" style={{ color: ins.color, fontSize: 24, marginBottom: 12, display: 'block' }}>{ins.icon}</span>
              <h4 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.9rem' }}>{ins.title}</h4>
              <p style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6 }}>{ins.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
