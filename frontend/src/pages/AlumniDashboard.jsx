import React, { useContext, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

const REQUESTS = [
  { id: 1, name: 'Alex Mercer', dept: 'CS Senior', insight: 'Highly proficient in Distributed Systems and Go. Recently led a team of 4 to build a decentralized voting app. Shows strong leadership potential.' },
  { id: 2, name: 'Sarah Liao',  dept: 'Product Design', insight: 'Specializes in UX Research and Interaction Design. Interned at Figma. Strong portfolio in accessibility. Transitioning to full-cycle product ownership.' },
];
const SCHEDULE = [
  { when: 'Today • 2:00 PM',     title: 'Mock Interview: David Chen',  sub: 'Backend Infrastructure Focus', active: true },
  { when: 'Tomorrow • 10:30 AM', title: 'Career Path Guidance',         sub: 'Group Session • 4 Students',   active: false },
  { when: 'Fri • 4:00 PM',       title: 'Resume Deep Dive',             sub: 'One-on-One • Marcus Aurelius', active: false },
];
const NAV_ITEMS = [
  { icon: 'dashboard',     label: 'Dashboard',  tab: 'home' },
  { icon: 'calendar_today',label: 'Schedule',   tab: 'schedule' },
  { icon: 'chat_bubble',   label: 'Requests',   tab: 'requests' },
  { icon: 'settings',      label: 'Settings',   tab: 'settings' },
];

export default function AlumniDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [declined, setDeclined] = useState([]);

  if (!user) return <Navigate to="/" replace />;
  const firstName = user.name ? user.name.split(' ')[0] : 'Alumni';

  const renderContent = () => {
    if (activeTab === 'schedule') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Schedule</h2>
        <div style={{ background: '#171f33', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ background: '#222a3d', padding: '1rem 1.5rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#dad7ff' }}>Upcoming Sessions</span>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {SCHEDULE.map((s, i) => (
              <div key={i} style={{ position: 'relative', paddingLeft: 24, borderLeft: `2px solid ${s.active ? '#c3c0ff' : 'rgba(70,69,85,0.3)'}` }}>
                <div style={{ position: 'absolute', left: -5, top: 0, width: 8, height: 8, borderRadius: '50%', background: s.active ? '#c3c0ff' : '#464555' }} />
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: s.active ? '#c3c0ff' : '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.when}</div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2, marginBottom: 8 }}>{s.sub}</div>
                {s.active && (
                  <Link to="/interview/demo-room" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.8rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Join Now
                  </Link>
                )}
              </div>
            ))}
          </div>
          <button style={{ width: '100%', padding: '1rem', background: '#222a3d', color: '#c3c0ff', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>
            + Add Availability Slot
          </button>
        </div>
      </div>
    );

    if (activeTab === 'requests') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Interview Requests</h2>
          <span style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{REQUESTS.filter(r => !declined.includes(r.id)).length} Pending</span>
        </div>
        {REQUESTS.filter(r => !declined.includes(r.id)).map(r => (
          <div key={r.id} style={{ background: '#171f33', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.2)' }}>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg,#222a3d,#2d3449)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0 }}>{r.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{r.name}</div>
                    <div style={{ fontSize: '0.65rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.dept}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to="/interview/demo-room" style={{ padding: '0.4rem 0.8rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>Accept & Schedule</Link>
                    <button onClick={() => setDeclined(d => [...d, r.id])} style={{ padding: '0.4rem 0.8rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Decline</button>
                  </div>
                </div>
                <div style={{ background: 'rgba(45,52,73,0.5)', borderLeft: '2px solid #c3c0ff', borderRadius: 8, padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>⚡ AI Intelligence Insight</div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(218,226,253,0.8)', fontStyle: 'italic', lineHeight: 1.6 }}>"{r.insight}"</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {REQUESTS.filter(r => !declined.includes(r.id)).length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#c7c4d8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }}>task_alt</span>
            <p style={{ fontWeight: 600 }}>You're all caught up!</p>
          </div>
        )}
      </div>
    );

    if (activeTab === 'settings') return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: '#c7c4d8' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16 }}>settings</span>
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Settings</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 8 }}>Profile & preferences management</p>
      </div>
    );

    // home
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem' }}>
          <div style={{ ...glass, padding: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '5rem' }}>auto_awesome</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Welcome back, <span style={{ color: '#c3c0ff' }}>{firstName}</span></h2>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8', maxWidth: 400, lineHeight: 1.6 }}>Your mentorship impact has increased by 14% this month. Three students are currently awaiting your feedback.</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: 12 }}>
              <button onClick={() => setActiveTab('requests')} style={btnOutline}>View Requests</button>
              <button onClick={() => setActiveTab('schedule')} style={btnOutline}>My Schedule</button>
            </div>
          </div>
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', borderLeft: '2px solid #c3c0ff' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c7c4d8', marginBottom: 16 }}>Students Benefited</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>1,284</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4edea3', marginBottom: 6 }}>+12%</span>
            </div>
          </div>
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', borderLeft: '2px solid #4edea3' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c7c4d8', marginBottom: 16 }}>Average Rating</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>4.9</span>
              <span style={{ color: '#ffb95f', fontSize: '1rem', marginBottom: 6 }}>★★★★★</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          {/* Requests preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Interview Requests</span>
                <span style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>3 Pending</span>
              </div>
              <button onClick={() => setActiveTab('requests')} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c7c4d8', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>View All</button>
            </div>
            {REQUESTS.map(r => (
              <div key={r.id} style={{ background: '#171f33', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.2)' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg,#222a3d,#2d3449)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0 }}>{r.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{r.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.dept}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to="/interview/demo-room" style={{ padding: '0.4rem 0.8rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>Accept</Link>
                        <button style={{ padding: '0.4rem 0.8rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Decline</button>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(45,52,73,0.5)', borderLeft: '2px solid #c3c0ff', borderRadius: 8, padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>⚡ AI Intelligence Insight</div>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(218,226,253,0.8)', fontStyle: 'italic', lineHeight: 1.6 }}>"{r.insight}"</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>My Schedule</span>
              <button onClick={() => setActiveTab('schedule')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ color: '#c7c4d8' }}>calendar_month</span>
              </button>
            </div>
            <div style={{ background: '#171f33', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: '#222a3d', padding: '1rem 1.5rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#dad7ff' }}>Upcoming Sessions</span>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {SCHEDULE.map((s, i) => (
                  <div key={i} style={{ position: 'relative', paddingLeft: 24, borderLeft: `2px solid ${s.active ? '#c3c0ff' : 'rgba(70,69,85,0.3)'}` }}>
                    <div style={{ position: 'absolute', left: -5, top: 0, width: 8, height: 8, borderRadius: '50%', background: s.active ? '#c3c0ff' : '#464555' }} />
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: s.active ? '#c3c0ff' : '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.when}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('schedule')} style={{ width: '100%', padding: '1rem', background: '#222a3d', color: '#c3c0ff', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>
                Manage Availability
              </button>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#171f33)', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(195,192,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: 20 }}>tips_and_updates</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mentor's Edge</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#dad7ff', lineHeight: 1.6, opacity: 0.85 }}>
                Students are 40% more likely to succeed when mentors provide specific feedback on soft skills during mock interviews.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif' }}>
      <aside style={{ width: 256, minHeight: '100vh', position: 'fixed', left: 0, top: 0, background: '#131b2e', display: 'flex', flexDirection: 'column', padding: '1.5rem', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#1d00a5', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#c3c0ff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Alumni Portal</div>
            <div style={{ fontSize: '0.6rem', color: '#c7c4d8', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>The Digital Curator</div>
          </div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(({ icon, label, tab }) => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', borderRadius: 12, background: active ? '#222a3d' : 'transparent', color: active ? '#c3c0ff' : '#c7c4d8', fontWeight: active ? 600 : 400, fontSize: '0.875rem', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>{label}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/interview/demo-room" style={{ display: 'block', width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: 'white', borderRadius: 12, textAlign: 'center', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
            New Mentorship
          </Link>
          <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#ffb4ab', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> Sign Out
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 256, flex: 1 }}>
        <header style={{ position: 'fixed', top: 0, left: 256, right: 0, height: 64, zIndex: 40, background: 'rgba(11,19,38,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(195,192,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#131b2e', padding: '0.4rem 1rem', borderRadius: 999, width: 320 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c7c4d8' }}>search</span>
            <input placeholder="Search candidates or sessions..." style={{ background: 'transparent', border: 'none', outline: 'none', color: '#dae2fd', fontSize: '0.75rem', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="material-symbols-outlined" style={{ color: '#c7c4d8', cursor: 'pointer' }}>notifications</span>
            <span className="material-symbols-outlined" style={{ color: '#c7c4d8', cursor: 'pointer' }}>mail</span>
            <div style={{ width: 1, height: 32, background: 'rgba(70,69,85,0.3)' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c3c0ff' }}>{user.name || 'Alumni'}</div>
              <div style={{ fontSize: '0.6rem', color: '#c7c4d8' }}>SENIOR MENTOR</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1d00a5', fontSize: '0.85rem' }}>{firstName[0]}</div>
          </div>
        </header>
        <section style={{ marginTop: 64, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {renderContent()}
        </section>
      </main>

      <Link to="/interview/demo-room" style={{ position: 'fixed', bottom: 40, right: 40, width: 56, height: 56, background: 'linear-gradient(135deg,#4f46e5,#6366f1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(79,70,229,0.4)', zIndex: 50, textDecoration: 'none' }}>
        <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 24, fontVariationSettings: "'FILL' 1" }}>add</span>
      </Link>
    </div>
  );
}

const glass = { background: 'rgba(23,31,51,0.7)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: 16 };
const btnOutline = { padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid rgba(195,192,255,0.2)', color: '#c3c0ff', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' };
