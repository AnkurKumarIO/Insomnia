import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ALUMNI = [
  { name: 'Sarah Chen',      role: 'Senior PM • Google',          score: 98, scoreColor: '#4edea3', tags: ['Strategy','Growth','AI/ML'],       bio: 'Expert in scaling AI consumer products from 0 to 1. Mentoring early-stage founders and product enthusiasts.' },
  { name: 'David Miller',    role: 'Eng Director • Stripe',        score: 85, scoreColor: '#ffb95f', tags: ['Fintech','Architecture','Leadership'], bio: 'Passionate about building resilient engineering cultures and complex fintech infrastructure systems.' },
  { name: 'Elena Rodriguez', role: 'Design Lead • Airbnb',         score: 92, scoreColor: '#4edea3', tags: ['UX Research','UI Systems','Storytelling'], bio: 'Focusing on emotional design and systemic UX. Helping designers bridge the gap between UI and UX.' },
  { name: 'Marcus Thorne',   role: 'Founder • Stealth Startup',    score: 79, scoreColor: '#4edea3', tags: ['Venture Capital','Sustainability','Fundraising'], bio: 'Serial entrepreneur with a focus on sustainable energy tech. Helping alumni navigate the startup ecosystem.' },
  { name: 'Jasmine Patel',   role: 'Data Scientist • Meta',        score: 94, scoreColor: '#4edea3', tags: ['Python','Big Data','Algorithms'],   bio: 'Specializing in large scale recommendation engines. Happy to discuss careers in Data Science and ML.' },
  { name: 'Robert Vance',    role: 'VP Ops • Amazon',              score: 88, scoreColor: '#ffb95f', tags: ['Logistics','Scaling','Operations'],  bio: 'Decade of experience in logistics and supply chain optimization. Mentoring for leadership roles in ops.' },
];

export default function AlumniDiscovery() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState([]);
  const FILTER_OPTIONS = ['Google','Product Management','5-10 Years','Engineering','Design'];

  const toggleFilter = (f) => setFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  return (
    <div>
      {/* Filter bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FILTER_OPTIONS.map(f => (
              <button key={f} onClick={() => toggleFilter(f)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 1rem', borderRadius: 999, background: '#171f33', color: '#c7c4d8', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                {f} <span className="material-symbols-outlined" style={{ fontSize: 14 }}>expand_more</span>
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>842 Alumni Found</span>
        </div>
        {filters.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {filters.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.25rem 0.75rem', background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 999, color: '#4edea3', fontSize: '0.75rem' }}>
                {f}
                <button onClick={() => toggleFilter(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4edea3', padding: 0, display: 'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              </div>
            ))}
            <button onClick={() => setFilters([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c3c0ff', fontSize: '0.75rem', fontWeight: 600 }}>Clear all</button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5rem' }}>
        {ALUMNI.map((a) => (
          <div key={a.name} style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(195,192,255,0.15)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#222a3d,#2d3449)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#c3c0ff' }}>{a.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>{a.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#c7c4d8' }}>{a.role}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: a.scoreColor, marginBottom: 2 }}>Impact Score</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: a.scoreColor }}>{a.score}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6, marginBottom: '1rem' }}>{a.bio}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1rem' }}>
              {a.tags.map(t => <span key={t} style={{ padding: '0.2rem 0.6rem', background: '#222a3d', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600, color: '#c7c4d8' }}>{t}</span>)}
            </div>
            <div style={{ height: 4, background: '#2d3449', borderRadius: 999, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ height: '100%', width: `${a.score}%`, background: `linear-gradient(90deg,#4f46e5,${a.scoreColor})`, borderRadius: 999 }} />
            </div>
            <button onClick={() => navigate('/interview/demo-room')} style={{ width: '100%', padding: '0.6rem', background: 'rgba(79,70,229,0.15)', color: '#c3c0ff', border: '1px solid rgba(195,192,255,0.15)', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Book Mock Interview
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
        <button style={{ padding: '0.75rem 3rem', background: '#131b2e', border: '1px solid rgba(70,69,85,0.3)', borderRadius: 12, color: '#c7c4d8', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
          Show More Alumni
        </button>
      </div>
    </div>
  );
}
