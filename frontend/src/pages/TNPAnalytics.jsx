import React, { useState } from 'react';

const PLACEMENT_DATA = [
  { dept: 'CS', placed: 87, total: 95, avg_pkg: '12.4 LPA', top: 'Google, Microsoft' },
  { dept: 'IT', placed: 72, total: 80, avg_pkg: '10.8 LPA', top: 'Infosys, TCS' },
  { dept: 'ECE', placed: 58, total: 75, avg_pkg: '9.2 LPA', top: 'Qualcomm, Intel' },
  { dept: 'ME', placed: 41, total: 60, avg_pkg: '7.6 LPA', top: 'L&T, Bosch' },
  { dept: 'CE', placed: 35, total: 55, avg_pkg: '6.8 LPA', top: 'Shapoorji, DLF' },
];

const COHORT_DATA = [
  { batch: '2021', placed: 78, avg: '9.2', top_company: 'Wipro', mock_sessions: 312 },
  { batch: '2022', placed: 83, avg: '10.5', top_company: 'Infosys', mock_sessions: 428 },
  { batch: '2023', placed: 89, avg: '11.8', top_company: 'Microsoft', mock_sessions: 567 },
  { batch: '2024', placed: 94, avg: '12.4', top_company: 'Google', mock_sessions: 712 },
];

const PREDICTIONS = [
  { icon: 'trending_up', color: '#4edea3', title: 'CS Placement Rate', prediction: '96% by end of term', confidence: 92, detail: 'Based on 712 mock sessions and 94% interview conversion rate.' },
  { icon: 'psychology', color: '#c3c0ff', title: 'Top Hiring Domain', prediction: 'AI/ML & Data Science', confidence: 87, detail: 'Demand for ML roles up 340% vs last year across partner companies.' },
  { icon: 'warning', color: '#ffb95f', title: 'At-Risk Students', prediction: '23 students need intervention', confidence: 78, detail: 'Students with <3 mock sessions and CGPA below 6.5 flagged for support.' },
  { icon: 'business', color: '#60a5fa', title: 'New Recruiters', prediction: '8 new companies expected', confidence: 71, detail: 'Based on alumni referrals and industry outreach pipeline.' },
];

export default function AnalyticsTab() {
  const [activeSection, setActiveSection] = useState('trends');

  const maxPlaced = Math.max(...PLACEMENT_DATA.map(d => d.placed));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Reports & Analytics</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Placement trends, cohort analysis, and AI-powered predictive insights</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'trends', label: 'Placement Trends' },
            { id: 'cohort', label: 'Cohort Analysis' },
            { id: 'predict', label: 'Predictive Insights' },
          ].map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{ padding: '0.5rem 1rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s',
                background: activeSection === s.id ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#222a3d',
                color: activeSection === s.id ? '#1d00a5' : '#c7c4d8',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PLACEMENT TRENDS ── */}
      {activeSection === 'trends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
            {[
              { label: 'Overall Placement', val: '94.2%', change: '+3.1%', color: '#4edea3' },
              { label: 'Avg Package', val: '12.4 LPA', change: '+1.8 LPA', color: '#c3c0ff' },
              { label: 'Companies Visited', val: '68', change: '+12 new', color: '#ffb95f' },
              { label: 'Offers Received', val: '1,284', change: '+18%', color: '#60a5fa' },
            ].map(k => (
              <div key={k.label} style={{ background: '#131b2e', borderRadius: 14, padding: '1.25rem', border: `1px solid ${k.color}20` }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: k.color, marginBottom: 4 }}>{k.val}</div>
                <div style={{ fontSize: '0.72rem', color: '#4edea3', fontWeight: 600 }}>↑ {k.change} vs last year</div>
              </div>
            ))}
          </div>

          {/* Bar chart by dept */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Placement by Department</h3>
              <span style={{ fontSize: '0.65rem', color: '#c7c4d8', background: '#222a3d', padding: '0.25rem 0.75rem', borderRadius: 999 }}>Academic Year 2023–24</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {PLACEMENT_DATA.map(d => {
                const pct = Math.round((d.placed / d.total) * 100);
                return (
                  <div key={d.dept}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 600 }}>{d.dept} Dept</span>
                      <div style={{ display: 'flex', gap: 16, color: '#c7c4d8' }}>
                        <span>{d.placed}/{d.total} placed</span>
                        <span style={{ color: '#4edea3', fontWeight: 700 }}>{pct}%</span>
                        <span style={{ color: '#c3c0ff' }}>{d.avg_pkg}</span>
                      </div>
                    </div>
                    <div style={{ height: 10, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,#4f46e5,${pct > 85 ? '#4edea3' : pct > 70 ? '#c3c0ff' : '#ffb95f'})`, borderRadius: 999, transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#c7c4d8', marginTop: 4 }}>Top: {d.top}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly trend SVG */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Monthly Placement Drive Activity</h3>
            <svg width="100%" height="160" viewBox="0 0 800 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="tg1" x1="0%" x2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#4edea3" />
                </linearGradient>
              </defs>
              {[0,40,80,120,160].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
              <polyline points="0,140 100,110 200,90 300,70 400,50 500,40 600,30 700,20 800,15" fill="none" stroke="url(#tg1)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {[[0,140],[100,110],[200,90],[300,70],[400,50],[500,40],[600,30],[700,20],[800,15]].map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r="5" fill={i === 8 ? '#4edea3' : '#4f46e5'} stroke="#0b1326" strokeWidth="2" />
              ))}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.6rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'].map(m => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* ── COHORT ANALYSIS ── */}
      {activeSection === 'cohort' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
            <div style={{ background: '#171f33', padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8 }}>
              {['Batch', 'Placement %', 'Avg Package', 'Top Company', 'Mock Sessions'].map(h => (
                <div key={h} style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{h}</div>
              ))}
            </div>
            {COHORT_DATA.map((c, i) => (
              <div key={c.batch} style={{ padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, borderTop: '1px solid rgba(70,69,85,0.1)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <div style={{ fontWeight: 700, color: '#c3c0ff' }}>Batch {c.batch}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#4edea3', fontSize: '0.95rem' }}>{c.placed}%</div>
                  <div style={{ height: 4, background: '#222a3d', borderRadius: 999, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.placed}%`, background: 'linear-gradient(90deg,#4f46e5,#4edea3)', borderRadius: 999 }} />
                  </div>
                </div>
                <div style={{ fontWeight: 600, color: '#dae2fd' }}>{c.avg} LPA</div>
                <div style={{ fontSize: '0.8rem', color: '#c7c4d8' }}>{c.top_company}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#c3c0ff' }}>psychology</span>
                  <span style={{ fontSize: '0.8rem', color: '#dae2fd' }}>{c.mock_sessions}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Cohort comparison bars */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Year-over-Year Comparison</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', alignItems: 'flex-end', height: 160 }}>
              {COHORT_DATA.map((c, i) => {
                const h = (c.placed / 100) * 140;
                const colors = ['#4f46e5','#6366f1','#818cf8','#4edea3'];
                return (
                  <div key={c.batch} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: colors[i] }}>{c.placed}%</div>
                    <div style={{ width: '100%', height: h, background: `linear-gradient(180deg,${colors[i]},${colors[i]}80)`, borderRadius: '8px 8px 0 0', transition: 'height 0.8s ease' }} />
                    <div style={{ fontSize: '0.7rem', color: '#c7c4d8', fontWeight: 600 }}>{c.batch}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── PREDICTIVE INSIGHTS ── */}
      {activeSection === 'predict' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(11,19,38,0.9))', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(195,192,255,0.15)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#c3c0ff', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>AI-Powered Predictions</div>
              <div style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6 }}>Based on historical placement data, mock interview performance, and industry hiring trends. Confidence scores reflect model accuracy.</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {PREDICTIONS.map(p => (
              <div key={p.title} style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: `1px solid ${p.color}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${p.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: p.color, fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{p.title}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: p.color, marginTop: 2 }}>{p.prediction}</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#c7c4d8', lineHeight: 1.6, marginBottom: '1rem' }}>{p.detail}</p>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#c7c4d8', marginBottom: 4 }}>
                    <span>Confidence</span><span style={{ fontWeight: 700, color: p.color }}>{p.confidence}%</span>
                  </div>
                  <div style={{ height: 6, background: '#222a3d', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p.confidence}%`, background: p.color, borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Risk matrix */}
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.75rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Placement Risk Matrix</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
              {[
                { label: 'High Risk', count: 23, color: '#ffb4ab', bg: 'rgba(255,180,171,0.1)', desc: 'CGPA < 6.5, < 3 mock sessions' },
                { label: 'Medium Risk', count: 67, color: '#ffb95f', bg: 'rgba(255,185,95,0.1)', desc: 'CGPA 6.5–7.5, 3–6 mock sessions' },
                { label: 'On Track', count: 312, color: '#4edea3', bg: 'rgba(78,222,163,0.1)', desc: 'CGPA > 7.5, 6+ mock sessions' },
              ].map(r => (
                <div key={r.label} style={{ background: r.bg, border: `1px solid ${r.color}30`, borderRadius: 12, padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: r.color, marginBottom: 4 }}>{r.count}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 6 }}>{r.label}</div>
                  <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.5 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

