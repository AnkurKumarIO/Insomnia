import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AlumniDiscovery from './AlumniDiscovery';
import ProgressAnalytics from './ProgressAnalytics';
import PremiumPage from './PremiumPage';
import SettingsPage from './SettingsPage';
import AlumNexLogo from '../AlumNexLogo';
import { getStudentNotifications, markStudentNotifsRead, sendRequest, getRequestsByStudent } from '../interviewRequests';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import { api } from '../api';
import { getAllAlumni, getUserById } from '../lib/db';

// â”€â”€ Inline BookModal for Recommended Mentor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TOPICS = [
  'Mock Interview — General', 'Mock Interview — System Design',
  'Mock Interview — Frontend', 'Mock Interview — Backend',
  'Career Guidance', 'Resume Review',
];

function MentorBookModal({ mentor, studentName, onClose, onSent }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!mentor) return null;

  const handleSend = () => {
    const profile = JSON.parse(localStorage.getItem('alumniconnect_profile') || '{}');
    const authUser = JSON.parse(localStorage.getItem('alumniconnect_user') || '{}');
    sendRequest({
      studentName,
      studentId: authUser.id || studentName,
      alumniName: mentor.name,
      alumniId:   mentor.id,
      alumniRole: `${mentor.title} • ${mentor.company}`,
      topic,
      message,
      studentProfile: {
        name: profile.name || studentName,
        college: profile.college || '',
        department: profile.department || '',
        year: profile.year || '',
        cgpa: profile.cgpa || '',
        linkedin: profile.linkedin || '',
        github: profile.github || '',
        resumeName: profile.resumeName || '',
        skills: profile.skills || [],
        bio: profile.bio || '',
      },
    });
    setSent(true);
    setTimeout(() => { onSent(); onClose(); }, 1800);
  };

  const inp = { width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.65rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 460, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ fontWeight: 700, color: '#4edea3', marginBottom: 8 }}>Request Sent!</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>
              Your request has been sent to <strong style={{ color: '#dae2fd' }}>{mentor.name}</strong>.<br />
              You'll see the scheduled time once they accept.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Book Mock Interview</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dae2fd' }}>{mentor.name}</h3>
                <p style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2 }}>{mentor.title} • {mentor.company}</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8', padding: 4 }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {mentor.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
                {mentor.tags.map(t => <span key={t} style={{ padding: '0.2rem 0.6rem', background: '#222a3d', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600, color: '#c7c4d8' }}>{t}</span>)}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Session Type</label>
                <select value={topic} onChange={e => setTopic(e.target.value)} style={inp}>
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Message <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={`Hi ${mentor.name?.split(' ')[0]}, I'd love to practice ${topic.toLowerCase()} with you...`} rows={3} style={{ ...inp, resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSend} style={{ flex: 2, padding: '0.75rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span> Send Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [studentNotifs, setStudentNotifs] = useState([]);
  const [showMentorBook, setShowMentorBook] = useState(false);
  const [mentorBookSent, setMentorBookSent] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [recommendedMentor, setRecommendedMentor] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [aiProfileStrength, setAiProfileStrength] = useState(null);

  // Push tab to browser history so back button works within dashboard
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      window.history.replaceState({ tab: 'home' }, '');
      return;
    }
    window.history.pushState({ tab: activeTab }, '');
  }, [activeTab]);

  useEffect(() => {
    const onPop = (e) => {
      const tab = e.state?.tab || 'home';
      setActiveTab(tab);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (!user) return <Navigate to="/" replace />;
  const firstName = (user?.name || user?.role || 'Student').split(' ')[0];

  // Deterministic roomId from requestId — MUST match bookSlot formula
  const deriveRoomId = (requestId) =>
    requestId ? `room-${String(requestId).replace(/[^a-z0-9]/gi, '').slice(-16).toLowerCase()}` : null;

  // Poll student notifications every 3s + sync from Supabase
  useEffect(() => {
    const NOTIF_KEY = 'alumniconnect_student_notifications';
    const load = async () => {
      if (user?.id) {
        try {
          // Sync interview requests (pulls room_id, status, scheduled_time from DB)
          const { syncStudentRequests } = await import('../interviewRequests');
          await syncStudentRequests(user.id);

          // Sync DB notifications
          const { getNotificationsForUser } = await import('../lib/db');
          const dbNotifs = await getNotificationsForUser(user.id);
          if (dbNotifs && dbNotifs.length > 0) {
            const currentLocal = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
            let changed = false;
            dbNotifs.forEach(dn => {
              const localId = `dbnotif-${dn.id}`;
              if (!currentLocal.some(cn => cn.id === localId)) {
                // Derive roomId from requestId so Join works on any device
                const computedRoomId = dn.request_id ? deriveRoomId(dn.request_id) : null;
                currentLocal.unshift({
                  id: localId,
                  studentName: user.name,
                  type: dn.type?.toLowerCase() || 'default',
                  title: dn.title,
                  message: dn.message,
                  requestId: dn.request_id,
                  read: dn.read,
                  createdAt: dn.created_at,
                  roomId: computedRoomId,
                });
                changed = true;
              }
            });
            if (changed) localStorage.setItem(NOTIF_KEY, JSON.stringify(currentLocal));
          }
        } catch { /* fallback to local */ }
      }

      setStudentNotifs(getStudentNotifications(user.name));

      // Auto-fire "meeting is live" notification when scheduled slot arrives
      const requests = getRequestsByStudent(user.name);
      requests.forEach(r => {
        if (r.status === 'slot_booked' && r.scheduledTime) {
          const roomId = r.roomId || deriveRoomId(r.id);
          const now = Date.now();
          const scheduled = new Date(r.scheduledTime).getTime();
          if (now >= scheduled - 60000 && now <= scheduled + 2 * 60 * 60 * 1000) {
            try {
              const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
              const alreadyLive = all.some(n => n.requestId === r.id && n.type === 'live');
              if (!alreadyLive) {
                all.unshift({ id: `live-${r.id}`, studentName: user.name, type: 'live', title: '🔴 Interview is Live Now!', message: 'Your mock interview is starting now. Click Join to enter the room.', requestId: r.id, roomId, read: false, createdAt: new Date().toISOString() });
                localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
              }
            } catch {}
          }
        }
      });
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [user.name, user.id]);

  // Fetch recommended mentor + profile data
  useEffect(() => {
    getAllAlumni().then(alumni => {
      if (Array.isArray(alumni) && alumni.length > 0) {
        const a = alumni[0];
        const p = a.profile_data || {};
        setRecommendedMentor({
          id:      a.id,
          name:    a.name,
          company: a.company || '',
          title:   p.title || (a.company ? `Alumni at ${a.company}` : 'Alumni'),
          tags:    (p.skills || []).slice(0, 3),
        });
      }
    }).catch(() => {});

    if (user?.id) {
      getUserById(user.id).then(u => {
        const pd = u?.profile_data || JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
        setProfileData(pd);
        if (Object.keys(pd).length > 0) {
          api.profileStrength(pd).then(r => { if (r && !r.error) setAiProfileStrength(r); }).catch(() => {});
        }
      }).catch(() => {
        const saved = JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
        setProfileData(saved);
      });
    } else {
      const saved = JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
      setProfileData(saved);
    }
  }, [user?.id]);

  const unreadNotifCount = studentNotifs.filter(n => !n.read).length;

  // Profile completion — use Gemini result if available, else calculate locally
  const profileCompletion = aiProfileStrength?.score ?? (() => {
    const checks = [
      !!profileData.bio, !!profileData.linkedin, !!profileData.github,
      !!profileData.department, (profileData.skills?.length > 0),
      !!profileData.cgpa, !!profileData.resumeName,
      (profileData.projects?.some(p => p.title)),
      (profileData.targetRoles?.length > 0),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  })();
  const completionLabel = aiProfileStrength?.label ?? (profileCompletion >= 80 ? 'Expert' : profileCompletion >= 50 ? 'Growing' : 'Starter');
  const skills = aiProfileStrength?.top_skills?.length > 0
    ? aiProfileStrength.top_skills
    : (profileData.skills || []).slice(0, 3);

  const SKILL_COLORS = ['#c3c0ff', '#4edea3', '#ffb95f'];
  const myRequests     = getRequestsByStudent(user?.name || '');
  const pendingCount   = myRequests.filter(r => r.status === 'pending').length;
  const interviewCount = myRequests.filter(r => r.status === 'slot_booked' || r.status === 'accepted').length;
  const CIRC   = 2 * Math.PI * 70;
  const offset = CIRC * (1 - profileCompletion / 100);
  const savedProfile = profileData;

  const renderContent = () => {
    if (activeTab === 'directory') return <AlumniDiscovery searchQuery={search} />;
    if (activeTab === 'analytics') return <ProgressAnalytics />;
    if (activeTab === 'premium') return <PremiumPage />;
    if (activeTab === 'messages') {
      const allNotifs = studentNotifs;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Messages & Notifications</h2>
              <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Updates from your interview requests and scheduled sessions</p>
            </div>
            {allNotifs.some(n => !n.read) && (
              <button onClick={() => markStudentNotifsRead(user.name)} style={{ padding: '0.4rem 1rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 8, color: '#c3c0ff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          {allNotifs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#c7c4d8', background: '#131b2e', borderRadius: 16, border: '1px solid rgba(70,69,85,0.15)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 56, opacity: 0.25, display: 'block', marginBottom: 16 }}>notifications_none</span>
              <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>No messages yet</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Notifications from alumni will appear here once you send interview requests</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {allNotifs.map(n => {
                const req = getRequestsByStudent(user.name).find(r => r.id === n.requestId);
                const isLive = n.type === 'live';
                const canJoin = (n.type === 'slot_booked' || isLive) && req?.roomId && req?.scheduledTime &&
                  Date.now() >= new Date(req.scheduledTime).getTime() - 5 * 60 * 1000;
                const iconMap = { slot_booked: 'event_available', accepted: 'check_circle', declined: 'cancel', live: 'videocam', default: 'notifications' };
                const colorMap = { slot_booked: '#4edea3', accepted: '#c3c0ff', declined: '#ffb4ab', live: '#ff4444', default: '#c7c4d8' };
                const bgMap = { slot_booked: 'rgba(78,222,163,0.1)', accepted: 'rgba(195,192,255,0.1)', declined: 'rgba(255,180,171,0.1)', live: 'rgba(255,68,68,0.1)', default: 'rgba(70,69,85,0.1)' };
                const type = n.type || 'default';
                return (
                  <div key={n.id} style={{ background: !n.read ? '#171f33' : '#131b2e', borderRadius: 14, padding: '1.25rem', border: `1px solid ${!n.read ? 'rgba(195,192,255,0.12)' : 'rgba(70,69,85,0.12)'}`, display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'all 0.2s' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: bgMap[type] || bgMap.default, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, color: colorMap[type] || colorMap.default, fontVariationSettings: "'FILL' 1" }}>
                        {iconMap[type] || iconMap.default}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: !n.read ? '#dae2fd' : '#c7c4d8' }}>{n.title}</span>
                        {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c3c0ff', flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6, marginBottom: 6 }}>{n.message}</p>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(199,196,216,0.4)', fontWeight: 600 }}>
                        {new Date(n.createdAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {/* Join Now button */}
                      {(n.type === 'slot_booked' || n.type === 'live') && (
                        <div style={{ marginTop: 10 }}>
                          {(() => {
                            // roomId: prefer stored, then derive deterministically from requestId
                            const joinRoomId = n.roomId || req?.roomId
                              || (n.requestId ? `room-${String(n.requestId).replace(/[^a-z0-9]/gi, '').slice(-16).toLowerCase()}` : null);
                            const scheduledTime = req?.scheduledTime;
                            const isNowJoinable = scheduledTime
                              ? Date.now() >= new Date(scheduledTime).getTime() - 5 * 60 * 1000
                              : !!joinRoomId; // instant meet = always joinable
                            if (n.type === 'live' && joinRoomId) {
                              return (
                                <a href={`/interview/${joinRoomId}?name=${encodeURIComponent(user?.name || 'Student')}`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg,#ff4444,#ff6b6b)', color: '#fff', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', animation: 'pulse 1.5s ease-in-out infinite' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>videocam</span> Join Now — Live
                                </a>
                              );
                            }
                            if (joinRoomId && isNowJoinable) {
                              return (
                                <a href={`/interview/${joinRoomId}?name=${encodeURIComponent(user?.name || 'Student')}`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>videocam</span> Join Now
                                </a>
                              );
                            }
                            if (scheduledTime) {
                              return (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.875rem', background: 'rgba(78,222,163,0.08)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 8, fontSize: '0.75rem', color: '#4edea3', fontWeight: 600 }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>schedule</span>
                                  {new Date(scheduledTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              );
                            }
                            // slot_booked with no scheduled time = instant meet, show join
                            if (joinRoomId) {
                              return (
                                <a href={`/interview/${joinRoomId}?name=${encodeURIComponent(user?.name || 'Student')}`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg,#ff4444,#ff6b6b)', color: '#fff', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>videocam</span> Join Now
                                </a>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
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
                  <span style={{ fontSize: '1.75rem', fontWeight: 900 }}>{profileCompletion}%</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4edea3' }}>{completionLabel}</span>
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
            {skills.length > 0 ? skills.map((skill, idx) => (
              <div key={skill} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{skill}</span>
                  <span style={{ color: '#c7c4d8' }}>—</span>
                </div>
                <div style={{ height: 6, background: '#2d3449', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '70%', background: SKILL_COLORS[idx % SKILL_COLORS.length], borderRadius: 999 }} />
                </div>
              </div>
            )) : (
              <p style={{ fontSize: '0.8rem', color: '#c7c4d8', opacity: 0.6 }}>Add skills in your profile to see them here.</p>
            )}
          </div>

          {/* Pipeline */}
          <div style={glass}>
            <div style={{ ...label, marginBottom: '1.5rem' }}>Pipeline</div>
            {[
              { icon: 'send',       label: 'Requests Sent', count: myRequests.length,  color: '#c3c0ff' },
              { icon: 'forum',      label: 'Interviews',    count: interviewCount,      color: '#4edea3' },
              { icon: 'hourglass_empty', label: 'Pending', count: pendingCount,         color: '#ffb95f' },
            ].map(({ icon, label: l, count, color }) => (
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {/* Resume CTA — full width */}
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

          {/* Recommended Mentor CTA — clean button, no profile preview */}
          <div style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.12),rgba(11,19,38,0.9))', borderRadius: 16, padding: '1.5rem 2rem', border: '1px solid rgba(195,192,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: '#1d00a5', fontSize: 24, fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd', marginBottom: 3 }}>Recommended Mentor</div>
                <div style={{ fontSize: '0.8rem', color: '#c7c4d8' }}>Get matched with a top alumni mentor for your mock interview</div>
              </div>
            </div>
            <button onClick={() => setShowMentorBook(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1.5rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_search</span>
              View Mentor
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
      {showMentorBook && (
        <MentorBookModal
          mentor={recommendedMentor}
          studentName={user?.name || 'Student'}
          onClose={() => setShowMentorBook(false)}
          onSent={() => setMentorBookSent(true)}
        />
      )}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={() => { logout(); navigate('/login'); }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
      <aside style={{ width: 256, minHeight: '100vh', position: 'fixed', left: 0, top: 0, background: '#131b2e', display: 'flex', flexDirection: 'column', padding: '1rem', zIndex: 50 }}>
        <div style={{ padding: '1.5rem 1rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlumNexLogo size={28} />
            <div>
          <div style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>Alum<span style={{ color: '#60a5fa' }}>NEX</span></div>
              <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginTop: 1 }}>Intelligence Suite</div>
            </div>
          </div>
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
            <button onClick={() => setActiveTab('premium')} style={{ width: '100%', padding: '0.4rem', background: '#060e20', color: '#c3c0ff', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Upgrade to Pro</button>
          </div>
          <div style={{ borderTop: '1px solid rgba(70,69,85,0.3)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <a href="mailto:support@alumnex.ai" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#c7c4d8', fontSize: '0.875rem', textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>help</span> Support
            </a>
            <button onClick={() => setShowLogoutConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#c7c4d8', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
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
              { label: 'Messages',    tab: 'messages'  },
            ].map((t) => (
              <button key={t.label} onClick={() => setActiveTab(t.tab)} style={{ fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: activeTab === t.tab ? '#c3c0ff' : '#c7c4d8', borderBottom: activeTab === t.tab ? '2px solid #4f46e5' : '2px solid transparent', paddingBottom: 4, position: 'relative', display: 'flex', alignItems: 'center', gap: 5 }}>
                {t.label}
                {t.tab === 'messages' && studentNotifs.filter(n => !n.read).length > 0 && (
                  <span style={{ background: '#ff4444', color: 'white', borderRadius: 999, fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.35rem', minWidth: 16, textAlign: 'center' }}>
                    {studentNotifs.filter(n => !n.read).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Search — only visible in Directory tab */}
            {activeTab === 'directory' && (
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#c7c4d8' }}>search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search alumni..." style={{ background: '#060e20', border: 'none', borderRadius: 999, padding: '0.4rem 1rem 0.4rem 2.2rem', color: '#dae2fd', fontSize: '0.75rem', width: 220, outline: 'none' }} />
              </div>
            )}

            {/* Student notification bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowNotifs(v => !v); setShowProfile(false); if (!showNotifs) markStudentNotifsRead(user.name); }} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: showNotifs ? '#c3c0ff' : '#c7c4d8', fontSize: 22, fontVariationSettings: showNotifs ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
                {unreadNotifCount > 0 && (
                  <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#ff4444', border: '1.5px solid #0b1326' }} />
                )}
              </button>
              {showNotifs && (
                <>
                  <div onClick={() => setShowNotifs(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 44, right: 0, width: 340, background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                      <span style={{ fontSize: '0.65rem', color: '#c7c4d8' }}>{studentNotifs.length} total</span>
                    </div>
                    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                      {studentNotifs.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#c7c4d8' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3, display: 'block', marginBottom: 8 }}>notifications_none</span>
                          <p style={{ fontSize: '0.875rem' }}>No notifications yet</p>
                        </div>
                      ) : studentNotifs.map((n, i) => (
                        <div key={n.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.1)', display: 'flex', gap: 12, alignItems: 'flex-start', background: !n.read ? 'rgba(195,192,255,0.04)' : 'transparent' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: n.type === 'live' ? 'rgba(255,68,68,0.12)' : n.type === 'slot_booked' ? 'rgba(78,222,163,0.12)' : n.type === 'accepted' ? 'rgba(195,192,255,0.12)' : 'rgba(255,180,171,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: n.type === 'live' ? '#ff6b6b' : n.type === 'slot_booked' ? '#4edea3' : n.type === 'accepted' ? '#c3c0ff' : '#ffb4ab', fontVariationSettings: "'FILL' 1" }}>
                              {n.type === 'live' ? 'videocam' : n.type === 'slot_booked' ? 'event_available' : n.type === 'accepted' ? 'check_circle' : 'cancel'}
                            </span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 3, color: !n.read ? '#dae2fd' : '#c7c4d8' }}>{n.title}</div>
                            <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.5 }}>{n.message}</div>
                            <div style={{ fontSize: '0.62rem', color: 'rgba(199,196,216,0.4)', marginTop: 4 }}>
                              {new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {/* Join Now — instant meet */}
                            {n.type === 'live' && n.roomId && (
                              <a href={`/interview/${n.roomId}`} onClick={() => setShowNotifs(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, padding: '0.35rem 0.875rem', background: 'linear-gradient(135deg,#ff4444,#ff6b6b)', color: '#fff', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Join Now — Live
                              </a>
                            )}
                            {/* Join Now button for slot_booked notifications */}
                            {n.type === 'slot_booked' && (() => {
                              const req = getRequestsByStudent(user.name).find(r => r.id === n.requestId);
                              const joinRoomId = n.roomId || req?.roomId;
                              const scheduledTime = req?.scheduledTime;
                              if (!joinRoomId) return null;
                              const nowMs = Date.now();
                              const endMs = scheduledTime ? new Date(scheduledTime).getTime() + 2 * 60 * 60 * 1000 : null;
                              const isEnded = endMs && nowMs > endMs;
                              const canJoin = !isEnded && (scheduledTime ? nowMs >= new Date(scheduledTime).getTime() - 5 * 60 * 1000 : true);
                              return isEnded ? (
                                <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>videocam_off</span> Session ended
                                </div>
                              ) : canJoin ? (
                                <a href={`/interview/${joinRoomId}?name=${encodeURIComponent(user?.name || 'Student')}`} onClick={() => setShowNotifs(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, padding: '0.35rem 0.875rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Join Now
                                </a>
                              ) : (
                                <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#4edea3', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                                  {scheduledTime ? new Date(scheduledTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}
                                </div>
                              );
                            })()}
                          </div>
                          {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c3c0ff', flexShrink: 0, marginTop: 6 }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile avatar button */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowProfile(p => !p)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#1d00a5', border: showProfile ? '2px solid #c3c0ff' : '2px solid transparent', cursor: 'pointer', transition: 'border 0.2s' }}>
                {firstName ? firstName[0] : '?'}
              </button>

              {/* Profile dropdown */}
              {showProfile && (
                <>
                  {/* Invisible backdrop to close on outside click */}
                  <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 44, right: 0, width: 280, background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(11,19,38,0.8))', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#1d00a5', flexShrink: 0 }}>{firstName ? firstName[0] : '?'}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#dae2fd' }}>{user?.name || 'Student'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#c7c4d8', marginTop: 2 }}>{savedProfile?.department || user?.department || 'Student'}</div>
                        {savedProfile?.college && <div style={{ fontSize: '0.65rem', color: '#c7c4d8', opacity: 0.7, marginTop: 1 }}>{savedProfile.college}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Profile details */}
                  <div style={{ padding: '1rem' }}>
                    {[
                      { icon: 'school', label: 'Year', val: savedProfile.year || '—' },
                      { icon: 'grade', label: 'CGPA', val: savedProfile.cgpa || '—' },
                      { icon: 'code', label: 'Skills', val: savedProfile.skills?.length ? savedProfile.skills.slice(0,3).join(', ') + (savedProfile.skills.length > 3 ? '...' : '') : '—' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c3c0ff' }}>{item.icon}</span>
                        <span style={{ fontSize: '0.72rem', color: '#c7c4d8', flex: 1 }}>{item.label}</span>
                        <span style={{ fontSize: '0.72rem', color: '#dae2fd', fontWeight: 600, textAlign: 'right', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.val}</span>
                      </div>
                    ))}
                    {savedProfile.bio && (
                      <p style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.5, marginTop: '0.75rem', fontStyle: 'italic' }}>"{savedProfile.bio.slice(0, 80)}{savedProfile.bio.length > 80 ? '...' : ''}"</p>
                    )}
                    {/* Interview Ratings from Alumni */}
                    {(() => {
                      const profileRatings = JSON.parse(localStorage.getItem('alumnex_candidate_ratings') || '{}');
                      const myRatings = profileRatings[user?.name] || [];
                      if (myRatings.length === 0) return null;
                      const avg = (myRatings.reduce((s, r) => s + r.rating, 0) / myRatings.length).toFixed(1);
                      return (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,185,95,0.06)', border: '1px solid rgba(255,185,95,0.15)', borderRadius: 10 }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffb95f', marginBottom: 6 }}>Interview Ratings</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffb95f' }}>{avg}</span>
                            <div>
                              <div style={{ display: 'flex', gap: 2 }}>
                                {[1,2,3,4,5].map(s => (
                                  <span key={s} style={{ fontSize: '0.75rem', color: s <= Math.round(avg) ? '#ffb95f' : 'rgba(70,69,85,0.5)' }}>★</span>
                                ))}
                              </div>
                              <div style={{ fontSize: '0.6rem', color: '#c7c4d8' }}>{myRatings.length} review{myRatings.length > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          {myRatings.slice(0, 2).map((r, i) => r.feedback && (
                            <div key={i} style={{ fontSize: '0.65rem', color: '#c7c4d8', fontStyle: 'italic', marginBottom: 3, lineHeight: 1.4 }}>
                              "{r.feedback.slice(0, 60)}{r.feedback.length > 60 ? '...' : ''}" — {r.by}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(70,69,85,0.15)', display: 'flex', gap: 8 }}>
                    <button onClick={() => { setShowProfile(false); setActiveTab('settings'); }} style={{ flex: 1, padding: '0.5rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 8, color: '#c3c0ff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                      Edit Profile
                    </button>
                    <button onClick={() => setShowLogoutConfirm(true)} style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                      Sign Out
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>
          </div>
        </header>

        <section style={{ marginTop: 64, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {renderContent()}
        </section>

        <footer style={{ marginTop: 'auto', padding: '3rem 2rem', borderTop: '1px solid rgba(70,69,85,0.2)', background: '#0b1326', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7c4d8', opacity: 0.8 }}>Â© 2026 AlumNEX. The Intelligence Platform.</p>
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



