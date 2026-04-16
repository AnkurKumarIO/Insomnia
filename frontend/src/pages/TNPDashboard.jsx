import React, { useContext, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AlumNexLogo from '../AlumNexLogo';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import AnalyticsTab from './TNPAnalytics';
import SystemSettingsTab from './TNPSettings';
import ComplianceTab from './TNPCompliance';

const STATIC_QUEUE = [
  { name: 'Arjun Malhotra', sub: 'B.Tech Computer Science • Year 2024', status: 'Document Pending', color: '#c3c0ff', icon: 'school' },
  { name: 'Sarah Jenkins', sub: 'Alumni • Senior Dev at Google • Batch 2018', status: 'ID Verification', color: '#ffb95f', icon: 'history_edu' },
  { name: 'Dr. Elena Rodriguez', sub: 'Alumni Mentor • PhD in AI Ethics • Batch 2015', status: 'Academic Check', color: '#c3c0ff', icon: 'psychology' },
];

const FEED = [
  { icon: 'person_add', color: '#4edea3', title: 'New Alumni Verified', desc: 'David K. (Senior UI Designer at Airbnb) has joined the mentor pool.', time: '2 minutes ago' },
  { icon: 'campaign', color: '#c3c0ff', title: 'Placement Drive Scheduled', desc: 'Microsoft Recruitment Drive for Batch 2024 set for Oct 15th.', time: '1 hour ago' },
  { icon: 'event_available', color: '#ffb95f', title: '12 Interviews Completed', desc: 'Mock interview session for "Fintech Role" concluded successfully.', time: '4 hours ago' },
];

const FULL_FEED = [
  { icon: 'person_add',        color: '#4edea3', title: 'New Alumni Verified',          desc: 'David K. (Senior UI Designer at Airbnb) has joined the mentor pool.',                    time: '2 minutes ago',  category: 'Alumni' },
  { icon: 'campaign',          color: '#c3c0ff', title: 'Placement Drive Scheduled',    desc: 'Microsoft Recruitment Drive for Batch 2024 set for Oct 15th.',                          time: '1 hour ago',     category: 'Placement' },
  { icon: 'event_available',   color: '#ffb95f', title: '12 Interviews Completed',      desc: 'Mock interview session for "Fintech Role" concluded successfully.',                      time: '4 hours ago',    category: 'Interview' },
  { icon: 'verified_user',     color: '#4edea3', title: 'Student Profile Approved',     desc: 'Priya Sharma (CS, 2024) has been verified and granted portal access.',                  time: '5 hours ago',    category: 'Student' },
  { icon: 'school',            color: '#c3c0ff', title: 'New Student Registration',     desc: 'Arjun Malhotra submitted documents for B.Tech CS verification.',                        time: '6 hours ago',    category: 'Student' },
  { icon: 'handshake',         color: '#4edea3', title: 'Mentorship Match Created',     desc: 'Rohan Verma (Student) matched with Neha Gupta (Alumni, Google).',                      time: '8 hours ago',    category: 'Mentorship' },
  { icon: 'business_center',   color: '#ffb95f', title: 'New Recruiter Onboarded',      desc: 'Infosys Ltd. added as a verified recruiter for Batch 2024 placements.',                 time: '10 hours ago',   category: 'Placement' },
  { icon: 'psychology',        color: '#c3c0ff', title: 'Alumni Mentor Application',    desc: 'Dr. Elena Rodriguez (PhD AI Ethics, Batch 2015) applied for mentor verification.',      time: '12 hours ago',   category: 'Alumni' },
  { icon: 'workspace_premium', color: '#ffb95f', title: 'Placement Record Achieved',    desc: 'CS Department hit 94% placement rate — highest in 5 years.',                           time: '1 day ago',      category: 'Placement' },
  { icon: 'event_repeat',      color: '#4edea3', title: 'Interview Rescheduled',        desc: 'Mock interview for Kavya Nair rescheduled to Oct 18th at 3:00 PM.',                     time: '1 day ago',      category: 'Interview' },
  { icon: 'group_add',         color: '#c3c0ff', title: 'Batch 2025 Onboarding',        desc: '47 new students from Batch 2025 completed profile setup.',                              time: '2 days ago',     category: 'Student' },
  { icon: 'star',              color: '#ffb95f', title: 'Top Mentor Recognised',        desc: 'Amit Joshi (Alumni, Microsoft) rated 4.9/5 across 32 mentorship sessions.',             time: '2 days ago',     category: 'Mentorship' },
  { icon: 'notifications_active', color: '#4edea3', title: 'Drive Reminder Sent',       desc: 'Automated reminder sent to 120 eligible students for Google Drive on Oct 20th.',        time: '3 days ago',     category: 'Placement' },
  { icon: 'cancel',            color: '#ffb4ab', title: 'Application Rejected',         desc: 'Alumni application from unverified account flagged and rejected by system.',             time: '3 days ago',     category: 'Alumni' },
  { icon: 'analytics',         color: '#c3c0ff', title: 'Weekly Report Generated',      desc: 'Placement analytics report for Week 41 auto-generated and archived.',                   time: '4 days ago',     category: 'System' },
];

const CATEGORY_COLORS = {
  Alumni:     '#4edea3',
  Placement:  '#c3c0ff',
  Interview:  '#ffb95f',
  Student:    '#60a5fa',
  Mentorship: '#f472b6',
  System:     '#94a3b8',
};

function ActivityFeedTab() {
  const [filter, setFilter] = React.useState('All');
  const categories = ['All', 'Alumni', 'Student', 'Placement', 'Interview', 'Mentorship', 'System'];
  const filtered = filter === 'All' ? FULL_FEED : FULL_FEED.filter(f => f.category === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Activity Feed</h2>
          <p style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 4 }}>All portal events — verifications, placements, interviews and more.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', border: 'none',
              background: filter === cat ? (CATEGORY_COLORS[cat] || '#c3c0ff') : 'rgba(70,69,85,0.2)',
              color: filter === cat ? '#0b1326' : '#c7c4d8',
              transition: 'all 0.2s',
            }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Feed list */}
      <div style={{ background: '#131b2e', borderRadius: 20, padding: '1.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 35, top: 24, bottom: 24, width: 1, background: 'rgba(70,69,85,0.25)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filtered.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
              {/* Icon dot */}
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${f.color}20`, border: `1px solid ${f.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, marginTop: 2 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, color: f.color, fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              </div>
              {/* Content */}
              <div style={{ flex: 1, background: '#171f33', borderRadius: 12, padding: '0.875rem 1rem', borderLeft: `3px solid ${f.color}40` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#dae2fd' }}>{f.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: `${CATEGORY_COLORS[f.category]}18`, color: CATEGORY_COLORS[f.category], padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.category}</span>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(199,196,216,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.time}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#c7c4d8', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const HEATMAP = [
  { dept: 'CS Dept',  vals: [92,84,95,62,48] },
  { dept: 'IT Dept',  vals: [78,88,42,81,24] },
  { dept: 'ECE Dept', vals: [45,31,58,18,39] },
];
const HMAP_COLS = ['Frontend','Backend','Data Sci','DevOps','UI/UX'];

export default function TNPDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [queueStatus, setQueueStatus] = useState({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [queueSearch, setQueueSearch] = useState('');
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [tnpNotifs, setTnpNotifs] = useState([]);
  const [seenNotifIds, setSeenNotifIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tnp_seen_notifs') || '[]'); } catch { return []; }
  });

  // Poll for new approval requests every 3s
  useEffect(() => {
    const buildNotifs = () => {
      const notifs = [];
      // Pending student registrations (awaiting TNP approval)
      try {
        const pending = JSON.parse(localStorage.getItem('alumnex_pending_profile') || '{}');
        if (pending.username && pending.name) {
          notifs.push({
            id: `pending-${pending.username}`,
            type: 'student_register',
            title: 'New Student Registration',
            desc: `${pending.name} (${pending.department || 'Student'}) is awaiting verification`,
            time: pending.createdAt || new Date().toISOString(),
            icon: 'school',
            color: '#c3c0ff',
          });
        }
      } catch {}
      // Pending alumni applications (awaiting TNP approval)
      try {
        const pendingAlumni = JSON.parse(localStorage.getItem('alumnex_pending_alumni') || '[]');
        pendingAlumni.forEach(acc => {
          notifs.push({
            id: `pending-alumni-${acc.id || acc.email}`,
            type: 'alumni_register',
            title: 'Alumni Approval Request',
            desc: `${acc.name} (${acc.department || 'Alumni'}) applied for mentor verification`,
            time: acc.createdAt || new Date().toISOString(),
            icon: 'psychology',
            color: '#4edea3',
          });
        });
      } catch {}
      // Hardcoded demo notifications (always present for demo)
      const DEMO = [
        { id: 'demo-1', type: 'student_register', title: 'New Student Registration', desc: 'Arjun Malhotra (CS, 2024) submitted documents for verification', time: new Date(Date.now() - 5 * 60000).toISOString(), icon: 'school', color: '#c3c0ff' },
        { id: 'demo-2', type: 'alumni_register', title: 'Alumni Approval Request', desc: 'Sarah Jenkins (Senior Dev, Google) applied for mentor verification', time: new Date(Date.now() - 62 * 60000).toISOString(), icon: 'psychology', color: '#4edea3' },
        { id: 'demo-3', type: 'alumni_register', title: 'Alumni Approval Request', desc: 'Dr. Elena Rodriguez (PhD AI Ethics) submitted academic credentials', time: new Date(Date.now() - 3 * 3600000).toISOString(), icon: 'psychology', color: '#4edea3' },
      ];
      // Merge demo + dynamic, deduplicate by id
      const all = [...DEMO, ...notifs.filter(n => !DEMO.find(d => d.id === n.id))];
      setTnpNotifs(all);
    };
    buildNotifs();
    const interval = setInterval(buildNotifs, 3000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = tnpNotifs.filter(n => !seenNotifIds.includes(n.id)).length;

  const openNotifPanel = () => {
    setShowNotifPanel(v => !v);
    setShowProfile(false);
    // Mark all as seen
    const ids = tnpNotifs.map(n => n.id);
    setSeenNotifIds(ids);
    localStorage.setItem('tnp_seen_notifs', JSON.stringify(ids));
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  // Settings state
  const [commSettings, setCommSettings] = useState({ emailNotifs: true, smsAlerts: false, weeklyReport: true, instantApproval: false, mentorMatchAlert: true });
  const [roles, setRoles] = useState([
    { id: 1, name: 'TNP Coordinator', permissions: ['approve', 'reports', 'settings', 'logs'], active: true },
    { id: 2, name: 'Placement Officer', permissions: ['approve', 'reports'], active: true },
    { id: 3, name: 'Alumni Verifier', permissions: ['approve'], active: false },
    { id: 4, name: 'Analytics Viewer', permissions: ['reports'], active: true },
  ]);
  // Logs filter state
  const [logRole, setLogRole] = useState('');
  const [logAction, setLogAction] = useState('');
  const [logDate, setLogDate] = useState('');

  // Dynamic queue — merges static demo items + real pending submissions from localStorage
  const [liveQueue, setLiveQueue] = useState(STATIC_QUEUE);

  useEffect(() => {
    const buildQueue = () => {
      const dynamic = [];
      try {
        // Pending alumni from 4-step registration
        const pendingAlumni = JSON.parse(localStorage.getItem('alumniconnect_pending_alumni') || '[]');
        pendingAlumni.filter(a => a.status === 'pending').forEach(a => {
          dynamic.push({
            name: a.name,
            email: a.email,
            sub: `Alumni • ${a.company || 'N/A'} • Batch ${a.batchYear || 'N/A'} • ${a.department || ''}`,
            status: 'Document Submitted',
            color: '#4edea3',
            icon: 'psychology',
          });
        });
      } catch {}
      try {
        // Pending student from 3-step registration
        const pending = JSON.parse(localStorage.getItem('alumniconnect_pending_profile') || '{}');
        if (pending.name && pending.role === 'STUDENT') {
          dynamic.push({
            name: pending.name,
            email: pending.email,
            sub: `${pending.department || 'Student'} • ${pending.college || ''} • ${pending.year || ''}`,
            status: 'Awaiting Approval',
            color: '#c3c0ff',
            icon: 'school',
          });
        }
      } catch {}
      // Merge: real submissions first, then static demo (deduplicate by name)
      const allNames = new Set(dynamic.map(d => d.name));
      const merged = [...dynamic, ...STATIC_QUEUE.filter(s => !allNames.has(s.name))];
      setLiveQueue(merged);
    };
    buildQueue();
    const interval = setInterval(buildQueue, 3000);
    return () => clearInterval(interval);
  }, []);



  if (!user) return <Navigate to="/login" replace />;

  const handleApprove = (q) => {
    setQueueStatus(s => ({ ...s, [q.name]: 'approved' }));
  };

  const handleReview = (name) => setQueueStatus(s => ({ ...s, [name]: 'review' }));

  const TNP_NAV = [
    { icon: 'dashboard',       label: 'Dashboard',          tab: 'home' },
    { icon: 'rule',            label: 'Verification Queue', tab: 'queue' },
    { icon: 'dynamic_feed',    label: 'Activity Feed',      tab: 'activity' },
    { icon: 'analytics',       label: 'Analytics',          tab: 'analytics' },
    { icon: 'policy',          label: 'Compliance & Log',   tab: 'compliance' },
    { icon: 'settings_suggest',label: 'System Settings',    tab: 'settings' },
  ];

  const renderContent = () => {
    if (activeTab === 'queue') {
      const q = queueSearch.toLowerCase().trim();
      const filteredQueue = q
        ? liveQueue.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.sub.toLowerCase().includes(q) ||
            item.status.toLowerCase().includes(q)
          )
        : liveQueue;

      const highlight = (text) => {
        if (!q) return text;
        const str = String(text);
        const idx = str.toLowerCase().indexOf(q);
        if (idx === -1) return str;
        return (
          <>
            {str.slice(0, idx)}
            <mark style={{ background: 'rgba(195,192,255,0.35)', color: '#dae2fd', borderRadius: 3, padding: '0 2px' }}>{str.slice(idx, idx + q.length)}</mark>
            {str.slice(idx + q.length)}
          </>
        );
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Verification Queue</h2>
            {q && (
              <div style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>
                <span style={{ color: '#c3c0ff', fontWeight: 700 }}>{filteredQueue.length}</span> of {liveQueue.length} results for "<span style={{ color: '#c3c0ff' }}>{queueSearch}</span>"
              </div>
            )}
          </div>
          {filteredQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#c7c4d8', background: '#131b2e', borderRadius: 16, border: '1px solid rgba(70,69,85,0.15)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, display: 'block', marginBottom: 10 }}>search_off</span>
              <p style={{ fontWeight: 600 }}>No results for "{queueSearch}"</p>
            </div>
          ) : filteredQueue.map((item, i) => {
            const st = queueStatus[item.name];
            return (
              <div key={i} style={{ background: '#131b2e', borderRadius: 16, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${st === 'approved' ? '#4edea3' : st === 'review' ? '#ffb95f' : item.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#222a3d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: item.color, fontSize: 22 }}>{item.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{highlight(item.name)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{highlight(item.sub)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ background: st === 'approved' ? 'rgba(78,222,163,0.15)' : st === 'review' ? 'rgba(255,185,95,0.15)' : '#2d3449', color: st === 'approved' ? '#4edea3' : st === 'review' ? '#ffb95f' : '#c7c4d8', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {st === 'approved' ? '✓ Approved' : st === 'review' ? '⏳ Under Review' : highlight(item.status)}
                  </span>
                  {!st && <>
                    <button onClick={() => handleApprove(item)} style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,165,114,0.15)', color: '#4edea3', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Approve</button>
                    <button onClick={() => handleReview(item.name)} style={{ padding: '0.4rem 0.8rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(70,69,85,0.3)', cursor: 'pointer' }}>Review</button>
                  </>}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    if (activeTab === 'analytics') return <AnalyticsTab />;
    if (activeTab === 'activity') return <ActivityFeedTab />;
    if (activeTab === 'compliance') return <ComplianceTab logRole={logRole} setLogRole={setLogRole} logAction={logAction} setLogAction={setLogAction} logDate={logDate} setLogDate={setLogDate} />;
    if (activeTab === 'settings') return <SystemSettingsTab commSettings={commSettings} setCommSettings={setCommSettings} roles={roles} setRoles={setRoles} />;
    return null; // home rendered below
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif' }}>

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
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#f5e9ff', letterSpacing: '-0.02em' }}>Alum<span style={{ color: '#a855f7' }}>NEX</span></div>
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
          <a href="#" onClick={e => { e.preventDefault(); setShowLogoutConfirm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#ffb4ab', fontSize: '0.875rem', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> Logout
          </a>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 256, flex: 1 }}>
        <header style={{ position: 'fixed', top: 0, left: 256, right: 0, height: 64, zIndex: 40, background: 'rgba(11,19,38,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(195,192,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {/* Search — only shown on home/queue tabs, searches verification queue */}
            {(activeTab === 'home' || activeTab === 'queue') && (
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#c7c4d8' }}>search</span>
                <input
                  value={queueSearch}
                  onChange={e => setQueueSearch(e.target.value)}
                  placeholder="Search verification queue..."
                  style={{ background: '#060e20', border: 'none', borderRadius: 999, padding: '0.4rem 1rem 0.4rem 2.2rem', color: '#dae2fd', fontSize: '0.75rem', width: 280, outline: 'none' }}
                />
                {queueSearch && (
                  <button onClick={() => setQueueSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8', padding: 0, display: 'flex' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                  </button>
                )}
              </div>
            )}
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              {[
                { label: 'Overview',         tab: 'home' },
                { label: 'Compliance & Log', tab: 'compliance' },
              ].map((t) => (
                <button key={t.label} onClick={() => setActiveTab(t.tab)} style={{ fontSize: '0.875rem', fontWeight: activeTab === t.tab ? 600 : 400, color: activeTab === t.tab ? '#c3c0ff' : '#c7c4d8', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === t.tab ? '2px solid #4f46e5' : '2px solid transparent', paddingBottom: 4 }}>{t.label}</button>
              ))}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={openNotifPanel} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: showNotifPanel ? '#c3c0ff' : '#c7c4d8', fontSize: 22, fontVariationSettings: showNotifPanel ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
                {unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#ff4444', border: '1.5px solid #0b1326' }} />
                )}
              </button>

              {showNotifPanel && (
                <>
                  <div onClick={() => setShowNotifPanel(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 44, right: 0, width: 360, background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Approval Requests</span>
                        {unreadCount > 0 && (
                          <span style={{ background: '#ff4444', color: 'white', borderRadius: 999, fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem' }}>{unreadCount} new</span>
                        )}
                      </div>
                      <button onClick={() => { setShowNotifPanel(false); setActiveTab('queue'); }} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c3c0ff', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>View Queue</button>
                    </div>
                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                      {tnpNotifs.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#c7c4d8' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3, display: 'block', marginBottom: 8 }}>notifications_none</span>
                          <p style={{ fontSize: '0.875rem' }}>No pending approvals</p>
                        </div>
                      ) : tnpNotifs.map((n) => {
                        const isNew = !seenNotifIds.includes(n.id);
                        return (
                          <div key={n.id} onClick={() => { setShowNotifPanel(false); setActiveTab('queue'); }}
                            style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.1)', display: 'flex', gap: 12, alignItems: 'flex-start', background: isNew ? 'rgba(195,192,255,0.04)' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(195,192,255,0.07)'}
                            onMouseLeave={e => e.currentTarget.style.background = isNew ? 'rgba(195,192,255,0.04)' : 'transparent'}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${n.color}15`, border: `1px solid ${n.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 19, color: n.color, fontVariationSettings: "'FILL' 1" }}>{n.icon}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: isNew ? '#dae2fd' : '#c7c4d8' }}>{n.title}</span>
                                {isNew && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c3c0ff', flexShrink: 0 }} />}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.4, marginBottom: 4 }}>{n.desc}</div>
                              <div style={{ fontSize: '0.62rem', color: 'rgba(199,196,216,0.4)', fontWeight: 600 }}>{timeAgo(n.time)}</div>
                            </div>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#c7c4d8', flexShrink: 0, marginTop: 4 }}>chevron_right</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(70,69,85,0.15)', textAlign: 'center' }}>
                      <button onClick={() => { setShowNotifPanel(false); setActiveTab('queue'); }} style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c3c0ff', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Go to Verification Queue →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ width: 1, height: 32, background: 'rgba(70,69,85,0.3)' }} />

            {/* Profile button */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowProfile(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dae2fd' }}>TNP Coordinator</div>
                  <div style={{ fontSize: '0.6rem', color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senior Lead</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1d00a5', fontSize: '0.85rem', border: showProfile ? '2px solid #c3c0ff' : '2px solid transparent', transition: 'border 0.2s' }}>T</div>
              </button>

              {showProfile && (
                <>
                  <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 48, right: 0, width: 260, background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>
                    {/* Profile header */}
                    <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(11,19,38,0.8))', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#1d00a5' }}>T</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#dae2fd' }}>TNP Coordinator</div>
                          <div style={{ fontSize: '0.65rem', color: '#c3c0ff', marginTop: 2 }}>Senior Lead</div>
                          <div style={{ fontSize: '0.62rem', color: '#c7c4d8', marginTop: 1 }}>tnp@alumnex.edu</div>
                        </div>
                      </div>
                    </div>
                    {/* Menu items */}
                    <div style={{ padding: '0.5rem' }}>
                      {[
                        { icon: 'person', label: 'Coordinator Profile', sub: 'Title: Coordinator • Senior Lead', action: () => { setShowProfile(false); setActiveTab('settings'); } },
                        { icon: 'settings', label: 'Account Settings', sub: 'Configure your preferences', action: () => { setShowProfile(false); setActiveTab('settings'); } },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 0.875rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10, textAlign: 'left', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(195,192,255,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(195,192,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 17, color: '#c3c0ff' }}>{item.icon}</span>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dae2fd' }}>{item.label}</div>
                            <div style={{ fontSize: '0.65rem', color: '#c7c4d8', marginTop: 1 }}>{item.sub}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div style={{ padding: '0.5rem', borderTop: '1px solid rgba(70,69,85,0.15)' }}>
                      <button onClick={() => { setShowProfile(false); setShowLogoutConfirm(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 0.875rem', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10, color: '#ffb4ab', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 17 }}>logout</span> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <section style={{ marginTop: 64, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {activeTab !== 'home' ? renderContent() : (<>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Command Center</h2>
              <p style={{ color: '#c7c4d8', maxWidth: 500, fontSize: '0.875rem' }}>Overseeing the growth and integration of AlumNEX across all active placement departments.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#171f33', border: '1px solid rgba(70,69,85,0.2)', padding: '0.5rem 1rem', borderRadius: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4edea3' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Status: Optimal</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem' }}>
            {[
              { label: 'Total Verified', val: '14,208', change: '+12% this month', icon: 'verified_user' },
              { label: 'Active Mentors', val: '842', change: '42 new in 7 days', icon: 'record_voice_over' },
              { label: 'Mock Interviews', val: '2,115', change: '118 scheduled today', icon: 'videocam' },
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
                  <button onClick={() => setActiveTab('queue')} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c3c0ff', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>View All</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(() => {
                    const sq = queueSearch.toLowerCase().trim();
                    const filtered = sq ? liveQueue.filter(item => item.name.toLowerCase().includes(sq) || item.sub.toLowerCase().includes(sq) || item.status.toLowerCase().includes(sq)) : liveQueue;
                    const hl = (text) => {
                      if (!sq) return text;
                      const str = String(text);
                      const idx = str.toLowerCase().indexOf(sq);
                      if (idx === -1) return str;
                      return <>{str.slice(0, idx)}<mark style={{ background: 'rgba(195,192,255,0.35)', color: '#dae2fd', borderRadius: 3, padding: '0 2px' }}>{str.slice(idx, idx + sq.length)}</mark>{str.slice(idx + sq.length)}</>;
                    };
                    return filtered.map((item, i) => {
                      const st = queueStatus[item.name];
                      return (
                        <div key={i} style={{ background: '#131b2e', borderRadius: 16, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${st === 'approved' ? '#4edea3' : st === 'review' ? '#ffb95f' : item.color}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#222a3d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span className="material-symbols-outlined" style={{ color: item.color, fontSize: 22 }}>{item.icon}</span>
                            </div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{hl(item.name)}</div>
                              <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{hl(item.sub)}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ background: st === 'approved' ? 'rgba(78,222,163,0.15)' : st === 'review' ? 'rgba(255,185,95,0.15)' : '#2d3449', color: st === 'approved' ? '#4edea3' : st === 'review' ? '#ffb95f' : '#c7c4d8', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {st === 'approved' ? '✓ Approved' : st === 'review' ? '⏳ Under Review' : hl(item.status)}
                            </span>
                            {!st && <>
                              <button onClick={() => handleApprove(item)} style={{ padding: '0.4rem 0.8rem', background: 'rgba(0,165,114,0.15)', color: '#4edea3', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Approve</button>
                              <button onClick={() => handleReview(item.name)} style={{ padding: '0.4rem 0.8rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(70,69,85,0.3)', cursor: 'pointer' }}>Review</button>
                            </>}
                          </div>
                        </div>
                      );
                    });
                  })()}
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
                  {FEED.map((f, i) => (
                    <div key={i} style={{ position: 'relative', paddingLeft: 36 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, width: 24, height: 24, borderRadius: '50%', background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12, color: f.color, fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{f.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#c7c4d8', lineHeight: 1.5 }}>{f.desc}</div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(199,196,216,0.5)', marginTop: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>{f.time}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab('activity')} style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', background: 'transparent', border: '1px solid rgba(70,69,85,0.2)', borderRadius: 12, color: '#c7c4d8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
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

    </div>
  );
}

