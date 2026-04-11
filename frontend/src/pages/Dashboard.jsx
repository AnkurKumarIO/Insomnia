import React, { useContext, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import AlumniDiscovery from './AlumniDiscovery';
import ProgressAnalytics from './ProgressAnalytics';
import PremiumPage from './PremiumPage';
import SettingsPage from './SettingsPage';

const SKILLS = [
  { label: 'Data Architecture', pct: 92, color: '#c3c0ff' },
  { label: 'Product Strategy',  pct: 78, color: '#4edea3' },
  { label: 'Interface Design',  pct: 64, color: '#ffb95f' },
];
const PIPELINE = [
  { icon: 'rocket_launch', label: 'Applied',    count: 12, color: '#c3c0ff' },
  { icon: 'forum',         label: 'Interviews', count: 4,  color: '#4edea3' },
  { icon: 'verified',      label: 'Offers',     count: 1,  color: '#ffb95f' },
];
const NAV_ITEMS = [
  { icon: 'dashboard',   label: 'Dashboard',          tab: 'home' },
  { icon: 'group',       label: 'Directory',           tab: 'directory' },
  { icon: 'psychology',  label: 'Alumni Intelligence', tab: 'analytics' },
  { icon: 'chat_bubble', label: 'Messages',            tab: 'messages' },
  { icon: 'settings',    label: 'Settings',            tab: 'settings' },
];

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [search, setSearch] = useState('');

  if (!user) return <Navigate to="/" replace />;
  const firstName = user.name ? user.name.split(' ')[0] : user.role;
  const CIRC = 2 * Math.PI * 70;
  const offset = CIRC * (1 - 0.8);

  const renderContent = () => {
    if (activeTab === 'directory') return <AlumniDiscovery searchQuery={search} />;
    if (activeTab === 'analytics') return <ProgressAnalytics />;
    if (activeTab === 'premium') return <PremiumPage />;
    if (activeTab === 'messages') return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: '#c7c4d8' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16 }}>chat_bubble</span>
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Messages coming soon</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 8 }}>Real-time chat with alumni mentors</p>
      </div>
    );
    if (activeTab === 'settings') return <SettingsPage />;
    // home
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Welcome back, {firstName}</h2>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8', marginTop: 4 }}>Your career trajectory is up 12% this month.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setActiveTab('analytics')} style={btnOutline}>View Analytics</button>
            <Link to="/resume-analyzer" style={{ ...btnPrimary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Analyze Resume</Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 0.9fr', gap: '1.5rem' }}>
          {/* Profile ring */}
          <div style={glass}>
            <div style={label}>Profile Strength</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="80" cy="80" r="70" fill="transparent" stroke="#2d3449" strokeWidth="8" />
                  <circle cx="80" cy="80" r="70" fill="transparent" stroke="#c3c0ff" strokeWidth="10" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900 }}>80%</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4edea3' }}>Expert</span>
                </div>
              </div>
              <p style={{ marginTop: '1rem', fontSize: '0.75rem', textAlign: 'center', color: '#c7c4d8', lineHeight: 1.6, maxWidth: 180 }}>
                Add your <span style={{ color: '#c3c0ff', textDecoration: 'underline', cursor: 'pointer' }}>Github Portfolio</span> to reach All-Star status.
              </p>
            </div>
          </div>

          {/* Skills */}
          <div style={glass}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={label}>Top Proficiencies</div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c7c4d8' }}>more_horiz</span>
            </div>
            {SKILLS.map(({ label: l, pct, color }) => (
              <div key={l} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{l}</span><span style={{ color: '#c7c4d8' }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: '#2d3449', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div style={glass}>
            <div style={{ ...label, marginBottom: '1.5rem' }}>Pipeline</div>
            {PIPELINE.map(({ icon, label: l, count, color }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#222a3d', borderRadius: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color }}>{icon}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{l}</span>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* Resume CTA */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, background: '#131b2e' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(79,70,229,0.15),transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.2rem 0.6rem', background: 'rgba(195,192,255,0.08)', border: '1px solid rgba(195,192,255,0.15)', borderRadius: 6, marginBottom: '1rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#c3c0ff', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c3c0ff' }}>New Intelligence</span>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>AI Resume Optimizer</h3>
                <p style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.7, maxWidth: 400, marginBottom: '1.25rem' }}>
                  Our neural network analyzes your resume against 5,000+ top-tier tech job descriptions.
                </p>
                <Link to="/resume-analyzer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#c3c0ff', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                  Try Analyzer <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                </Link>
              </div>
              <div style={{ width: 160, height: 160, background: '#2d3449', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(70,69,85,0.2)', flexShrink: 0 }}>
                <div style={{ padding: '1.25rem', background: '#131b2e', borderRadius: 10, border: '1px solid rgba(195,192,255,0.08)' }}>
                  <div style={{ width: 48, height: 4, background: 'rgba(195,192,255,0.3)', borderRadius: 999, marginBottom: 10 }} />
                  <div style={{ width: 80, height: 4, background: 'rgba(195,192,255,0.3)', borderRadius: 999, marginBottom: 10 }} />
                  <div style={{ width: 64, height: 4, background: 'rgba(195,192,255,0.3)', borderRadius: 999, marginBottom: 20 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4edea3' }} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>94% MATCH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mentor */}
          <div style={{ ...glass, borderLeft: '2px solid #c3c0ff' }}>
            <div style={{ ...label, marginBottom: '1.5rem' }}>Recommended Mentor</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#4edea3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'white', border: '2px solid #c3c0ff' }}>PS</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Priya Sharma</div>
                <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>Senior Engineer at Google</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
                {['React','System Design','Big Tech'].map(t => (
                  <span key={t} style={{ padding: '0.2rem 0.6rem', background: 'rgba(78,222,163,0.1)', color: '#4edea3', fontSize: '0.65rem', borderRadius: 999, fontWeight: 500 }}>{t}</span>
                ))}
              </div>
              <button onClick={() => setActiveTab('directory')} style={{ width: '100%', padding: '0.6rem', background: '#222a3d', color: '#dae2fd', fontSize: '0.75rem', fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'center', display: 'block' }}>
                Book Mock Interview
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif' }}>
      <aside style={{ width: 256, minHeight: '100vh', position: 'fixed', left: 0, top: 0, background: '#131b2e', display: 'flex', flexDirection: 'column', padding: '1rem', zIndex: 50 }}>
        <div style={{ padding: '1.5rem 1rem 1rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#c3c0ff' }}>AlumniConnect</div>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c7c4d8', marginTop: 2 }}>Intelligence Suite</div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(({ icon, label: l, tab }) => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', borderRadius: 12, background: active ? '#222a3d' : 'transparent', color: active ? '#c3c0ff' : '#c7c4d8', fontWeight: active ? 600 : 400, fontSize: '0.875rem', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>{l}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1d00a5', fontWeight: 700, marginBottom: 4 }}>Elite Access</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1d00a5', marginBottom: 12, lineHeight: 1.4 }}>Unlock AI Mentorship</div>
            <button onClick={() => setActiveTab('analytics')} style={{ width: '100%', padding: '0.4rem', background: '#060e20', color: '#c3c0ff', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Upgrade to Pro</button>
          </div>
          <div style={{ borderTop: '1px solid rgba(70,69,85,0.3)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <a href="mailto:support@alumniconnect.ai" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#c7c4d8', fontSize: '0.875rem', textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>help</span> Support
            </a>
            <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#c7c4d8', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> Logout
            </button>
          </div>
        </div>
      </aside>

      <main style={{ marginLeft: 256, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{ position: 'fixed', top: 0, left: 256, right: 0, height: 64, zIndex: 40, background: 'rgba(11,19,38,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(195,192,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Network',     tab: 'directory' },
              { label: 'Insights',    tab: 'analytics' },
              { label: 'Mentorship',  tab: 'premium'   },
              { label: 'Events',      tab: 'messages'  },
            ].map((t) => (
              <button key={t.label} onClick={() => setActiveTab(t.tab)} style={{ fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: activeTab === t.tab ? '#c3c0ff' : '#c7c4d8', borderBottom: activeTab === t.tab ? '2px solid #4f46e5' : '2px solid transparent', paddingBottom: 4 }}>{t.label}</button>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#c7c4d8' }}>search</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search alumni, jobs..." style={{ background: '#060e20', border: 'none', borderRadius: 999, padding: '0.4rem 1rem 0.4rem 2.2rem', color: '#dae2fd', fontSize: '0.75rem', width: 240, outline: 'none' }} />
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#1d00a5' }}>{firstName[0]}</div>
          </div>
        </header>

        <section style={{ marginTop: 64, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {renderContent()}
        </section>

        <footer style={{ marginTop: 'auto', padding: '3rem 2rem', borderTop: '1px solid rgba(70,69,85,0.2)', background: '#0b1326', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7c4d8', opacity: 0.8 }}>© 2026 AlumniConnect AI. The Digital Curator.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy','Terms','API','Contact'].map(l => <a key={l} href="#" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7c4d8', textDecoration: 'none' }}>{l}</a>)}
          </div>
        </footer>
      </main>
    </div>
  );
}

const glass = { background: 'rgba(23,31,51,0.7)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4),0 0 0 1px rgba(195,192,255,0.05)', borderRadius: 16, padding: '1.5rem' };
const label = { fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', fontWeight: 700, marginBottom: '1rem' };
const btnOutline = { padding: '0.5rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c3c0ff', border: '1px solid rgba(195,192,255,0.2)', background: 'transparent', borderRadius: 8, cursor: 'pointer' };
const btnPrimary = { padding: '0.5rem 1rem', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' };
