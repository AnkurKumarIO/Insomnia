import React, { useContext, useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import AlumNexLogo from '../AlumNexLogo';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import { api } from '../api';

export default function TNPDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab]       = useState('home');
  const [queueStatus, setQueueStatus]   = useState({});
  const [credModal, setCredModal]       = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats]               = useState({ verified_students: 0, active_mentors: 0, mock_interviews: 0, scheduled_today: 0 });
  const [recentAlumni, setRecentAlumni] = useState([]);

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    api.getPlatformStats().then(s => { if (s && !s.error) setStats(s); }).catch(() => {});
    api.getPendingUsers().then(u => { if (Array.isArray(u)) setPendingUsers(u); }).catch(() => {});
    api.getAlumni().then(a => { if (Array.isArray(a)) setRecentAlumni(a.slice(0, 3)); }).catch(() => {});
  }, []);

  const handleApprove = async (u) => {
    await api.verifyUser(u.id, 'VERIFIED').catch(() => {});
    setPendingUsers(prev => prev.filter(p => p.id !== u.id));
    setQueueStatus(s => ({ ...s, [u.id]: 'approved' }));
    setCredModal({ name: u.name, email: u.email, role: u.role });
  };

  const handleReview = (id) => setQueueStatus(s => ({ ...s, [id]: 'review' }));

  const TNP_NAV = [
    { icon: 'dashboard',       label: 'Dashboard',          tab: 'home' },
    { icon: 'rule',            label: 'Verification Queue', tab: 'queue' },
    { icon: 'analytics',       label: 'Analytics',          tab: 'analytics' },
    { icon: 'settings_suggest',label: 'System Settings',    tab: 'settings' },
  ];

  const renderContent = () => {
    if (activeTab === 'queue') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Verification Queue</h2>
        {pendingUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#c7c4d8', background: '#131b2e', borderRadius: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }}>check_circle</span>
            <p style={{ fontWeight: 600 }}>No pending verifications</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 4 }}>All users are verified</p>
          </div>
        ) : pendingUsers.map((u) => {
          const st = queueStatus[u.id];
          const color = u.role === 'ALUMNI' ? '#ffb95f' : '#c3c0ff';
          const icon  = u.role === 'ALUMNI' ? 'history_edu' : 'school';
          return (
            <div key={u.id} style={{ background: '#131b2e', borderRadius: 16, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${st === 'approved' ? '#4edea3' : st === 'review' ? '#ffb95f' : color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#222a3d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color, fontSize: 22 }}>{icon}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{u.role} • {u.department || u.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ background: st === 'approved' ? 'rgba(78,222,163,0.15)' : st === 'review' ? 'rgba(255,185,95,0.15)' : '#2d3449', color: st === 'approved' ? '#4edea3' : st === 'review' ? '#ffb95f' : '#c7c4d8', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {st === 'approved' ? '✓ Approved' : st === 'review' ? '⏳ Under Review' : 'Pending'}
                </span>
                {!st && <>
                  <button onClick={() => handleApprove(u)} style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,165,114,0.15)', color: '#4edea3', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => handleReview(u.id)} style={{ padding: '0.4rem 0.8rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(70,69,85,0.3)', cursor: 'pointer' }}>Review</button>
                </>}
              </div>
            </div>
          );
        })}
      </div>
    );
    if (activeTab === 'analytics') return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: '#c7c4d8' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16 }}>analytics</span>
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Advanced Analytics</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 8 }}>Placement trends, cohort analysis, and predictive insights</p>
      </div>
    );
    if (activeTab === 'settings') return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, color: '#c7c4d8' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16 }}>settings_suggest</span>
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>System Settings</p>
        <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 8 }}>Configure platform rules, roles, and integrations</p>
      </div>
    );
    return null; // home rendered below
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif' }}>

      {credModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 460, border: '1px solid rgba(78,222,163,0.25)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#4edea3', marginBottom: 6 }}>Account Approved!</h3>
              <p style={{ fontSize: '0.8rem', color: '#c7c4d8' }}>
                Credentials for <strong style={{ color: '#dae2fd' }}>{credModal.name}</strong> have been generated.<br />
                <span style={{ color: '#ffb95f' }}>In production, these would be emailed to {credModal.email}</span>
              </p>
            </div>
            {[['Name', credModal.name], ['Email', credModal.email], ['Role', credModal.role]].map(([label, val]) => (
              <div key={label} style={{ background: '#131b2e', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(70,69,85,0.2)' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: '#c3c0ff' }}>{val}</div>
                </div>
                <button onClick={() => navigator.clipboard.writeText(val)} style={{ background: 'rgba(195,192,255,0.1)', border: 'none', borderRadius: 6, padding: '0.3rem 0.6rem', color: '#c3c0ff', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}>Copy</button>
              </div>
            ))}
            <div style={{ background: 'rgba(255,185,95,0.08)', border: '1px solid rgba(255,185,95,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#ffb95f', lineHeight: 1.6 }}>📧 Simulated email sent to {credModal.email}. User can now log in at <strong>/login</strong></p>
            </div>
            <button onClick={() => setCredModal(null)} style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={() => { logout(); navigate('/login'); }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
      {/* Sidebar */}
      <aside style={{ width: 256, minHeight: '100vh', position: 'fixed', left: 0, top: 0, background: '#131b2e', display: 'flex', flexDirection: 'column', padding: '1.5rem', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
          <AlumNexLogo size={32} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#fff', letterSpacing: '-0.02em' }}>Alum<span style={{ color: '#60a5fa' }}>NEX</span></div>
            <div style={{ fontSize: '0.55rem', color: '#c7c4d8', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>Master Control</div>
          </div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TNP_NAV.map(({ icon, label, tab }) => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', borderRadius: 12, background: active ? '#222a3d' : 'transparent', color: active ? '#c3c0ff' : '#c7c4d8', fontWeight: active ? 600 : 400, fontSize: '0.875rem', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>{label}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setActiveTab('analytics')} style={{ width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', borderRadius: 12, fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>
            Generate Report
          </button>
          <a href="#" onClick={e => { e.preventDefault(); setShowLogoutConfirm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#ffb4ab', fontSize: '0.875rem', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> Logout
          </a>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 256, flex: 1 }}>
        <header style={{ position: 'fixed', top: 0, left: 256, right: 0, height: 64, zIndex: 40, background: 'rgba(11,19,38,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(195,192,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#c7c4d8' }}>search</span>
              <input placeholder="Search students, alumni, or companies..." style={{ background: '#060e20', border: 'none', borderRadius: 999, padding: '0.4rem 1rem 0.4rem 2.2rem', color: '#dae2fd', fontSize: '0.75rem', width: 320, outline: 'none' }} />
            </div>
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              {['Overview','Compliance','Logs'].map((t,i) => (
                <a key={t} href="#" style={{ fontSize: '0.875rem', fontWeight: i===0?600:400, color: i===0?'#c3c0ff':'#c7c4d8', textDecoration: 'none' }}>{t}</a>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ color: '#c7c4d8', cursor: 'pointer' }}>notifications</span>
            <span className="material-symbols-outlined" style={{ color: '#c7c4d8', cursor: 'pointer' }}>settings</span>
            <div style={{ width: 1, height: 32, background: 'rgba(70,69,85,0.3)' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dae2fd' }}>Coordinator Profile</div>
              <div style={{ fontSize: '0.6rem', color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senior Lead</div>
            </div>
          </div>
        </header>

        <section style={{ marginTop: 64, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {activeTab !== 'home' ? renderContent() : (<>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Command Center</h2>
              <p style={{ color: '#c7c4d8', maxWidth: 500, fontSize: '0.875rem' }}>Overseeing the growth and integration of AlumNex across all active placement departments.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#171f33', border: '1px solid rgba(70,69,85,0.2)', padding: '0.5rem 1rem', borderRadius: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4edea3' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Status: Optimal</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem' }}>
            {[
              { label: 'Verified Students', val: stats.verified_students.toLocaleString(), change: 'Total verified', icon: 'verified_user' },
              { label: 'Active Mentors',    val: stats.active_mentors.toLocaleString(),    change: 'Alumni mentors', icon: 'record_voice_over' },
              { label: 'Mock Interviews',   val: stats.mock_interviews.toLocaleString(),   change: `${stats.scheduled_today} scheduled`, icon: 'videocam' },
            ].map(s => (
              <div key={s.label} style={{ background: '#171f33', borderRadius: 16, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '3.5rem' }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 12 }}>{s.label}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#c3c0ff' }}>{s.val}</div>
                <div style={{ marginTop: 12, fontSize: '0.75rem', fontWeight: 700, color: '#4edea3', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trending_up</span>{s.change}
                </div>
              </div>
            ))}
            <div style={{ background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', borderRadius: 16, padding: '1.5rem', boxShadow: '0 20px 40px rgba(79,70,229,0.2)' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c3c0ff', marginBottom: 12 }}>Placement Rate</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'white' }}>94.2%</div>
              <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>All-time record this quarter</div>
            </div>
          </div>

          {/* Bento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
            {/* Queue + Heatmap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: '#c3c0ff' }}>rule</span> Verification Queue
                  </h3>
                  <a href="#" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c3c0ff', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em' }}>View All</a>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(pendingUsers.length > 0 ? pendingUsers.slice(0, 3) : []).map((u) => {
                    const st = queueStatus[u.id];
                    const color = u.role === 'ALUMNI' ? '#ffb95f' : '#c3c0ff';
                    const icon  = u.role === 'ALUMNI' ? 'history_edu' : 'school';
                    return (
                    <div key={u.id} style={{ background: '#131b2e', borderRadius: 16, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${st === 'approved' ? '#4edea3' : st === 'review' ? '#ffb95f' : color}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#222a3d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color, fontSize: 22 }}>{icon}</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{u.role} • {u.department || u.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ background: st === 'approved' ? 'rgba(78,222,163,0.15)' : st === 'review' ? 'rgba(255,185,95,0.15)' : '#2d3449', color: st === 'approved' ? '#4edea3' : st === 'review' ? '#ffb95f' : '#c7c4d8', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {st === 'approved' ? '✓ Approved' : st === 'review' ? '⏳ Under Review' : 'Pending'}
                        </span>
                        {!st && <>
                          <button onClick={() => handleApprove(u)} style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,165,114,0.15)', color: '#4edea3', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Approve</button>
                          <button onClick={() => handleReview(u.id)} style={{ padding: '0.4rem 0.8rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(70,69,85,0.3)', cursor: 'pointer' }}>Review</button>
                        </>}
                      </div>
                    </div>
                    );
                  })}
                  {pendingUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#c7c4d8', opacity: 0.5, background: '#131b2e', borderRadius: 12 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>check_circle</span>
                      <p style={{ fontSize: '0.8rem' }}>No pending verifications</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Heatmap */}
              <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Placement Readiness Heatmap</h3>
                    <p style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 4 }}>Aggregate student proficiency levels across departments.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#c7c4d8' }}>
                    Low
                    {[0.2,0.4,0.6,0.8,1].map(o => <div key={o} style={{ width: 12, height: 12, borderRadius: 4, background: `rgba(195,192,255,${o})` }} />)}
                    Expert
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5,1fr)', gap: 8 }}>
                  <div />
                  {HMAP_COLS.map(c => <div key={c} style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7c4d8', textAlign: 'center' }}>{c}</div>)}
                  {HEATMAP.map(row => (
                    <React.Fragment key={row.dept}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#c7c4d8', display: 'flex', alignItems: 'center' }}>{row.dept}</div>
                      {row.vals.map((v, i) => (
                        <div key={i} style={{ height: 48, background: `rgba(195,192,255,${v/100})`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: v > 50 ? '#1d00a5' : '#c7c4d8' }}>{v}%</div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#171f33', borderRadius: 20, padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#4edea3' }}>dynamic_feed</span> Activity Feed
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 1, background: 'rgba(70,69,85,0.3)' }} />
                  {recentAlumni.length > 0 ? recentAlumni.map((a, i) => (
                    <div key={a.id} style={{ position: 'relative', paddingLeft: 36 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, width: 24, height: 24, borderRadius: '50%', background: 'rgba(78,222,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#4edea3', fontVariationSettings: "'FILL' 1" }}>person_add</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>Alumni Verified</div>
                      <div style={{ fontSize: '0.75rem', color: '#c7c4d8', lineHeight: 1.5 }}>{a.name} ({a.company}) has joined the mentor pool.</div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(199,196,216,0.5)', marginTop: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>Batch {a.batch_year || '—'}</div>
                    </div>
                  )) : (
                    <div style={{ paddingLeft: 36, color: '#c7c4d8', fontSize: '0.8rem', opacity: 0.5 }}>No recent activity</div>
                  )}
                </div>
                <button onClick={() => setActiveTab('queue')} style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', background: 'transparent', border: '1px solid rgba(70,69,85,0.2)', borderRadius: 12, color: '#c7c4d8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
                  View Full History
                </button>
              </div>

              <div style={{ background: '#2d3449', borderRadius: 20, padding: '1.5rem', borderLeft: '3px solid #c3c0ff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c3c0ff', marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_awesome</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Prediction</span>
                </div>
                <h4 style={{ fontWeight: 700, marginBottom: 8 }}>High-Growth Cluster Detected</h4>
                <p style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6 }}>Students specializing in <span style={{ color: '#c3c0ff', fontWeight: 600 }}>Rust Systems Engineering</span> are seeing a 300% increase in interview requests this month.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[['hub','#c3c0ff','12','Active Drives'],['assignment_turned_in','#4edea3','456','Job Offers']].map(([icon,color,val,label]) => (
                  <div key={label} style={{ background: '#222a3d', borderRadius: 16, padding: '1rem' }}>
                    <span className="material-symbols-outlined" style={{ color, fontSize: 22, marginBottom: 8, display: 'block' }}>{icon}</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{val}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>)}
        </section>
      </main>

      {/* FAB */}
      <button style={{ position: 'fixed', bottom: 32, right: 32, width: 56, height: 56, background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(79,70,229,0.4)', zIndex: 50, border: 'none', cursor: 'pointer' }}>
        <span className="material-symbols-outlined" style={{ color: '#1d00a5', fontSize: 24, fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>
    </div>
  );
}
