import React, { useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { updateUserProfile } from '../lib/db';

const NOTIF_ITEMS = [
  { key: 'interview_requests', label: 'Interview Requests', desc: 'When a student sends you a booking request' },
  { key: 'session_reminders', label: 'Session Reminders', desc: '30 minutes before a scheduled session' },
  { key: 'messages',          label: 'New Messages',       desc: 'When you receive a direct message' },
  { key: 'platform_updates',  label: 'Platform Updates',   desc: 'New features and announcements' },
  { key: 'weekly_digest',     label: 'Weekly Digest',      desc: 'Summary of your activity every Monday' },
];

export default function SettingsPage() {
  const { user, login } = useContext(AuthContext);
  const resumeInputRef = useRef(null);

  // Load saved profile or fall back to user data
  const savedProfile = JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
  const savedNotifs  = JSON.parse(localStorage.getItem('alumnex_notifs')  || '{}');

  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    name:       user?.name       || savedProfile.name       || '',
    email:      user?.email      || savedProfile.email      || '',
    department: user?.department || savedProfile.department || '',
    bio:        savedProfile.bio        || '',
    linkedin:   savedProfile.linkedin   || '',
    github:     savedProfile.github     || '',
    portfolio:  savedProfile.portfolio  || '',
    skills:     savedProfile.skills     || [],
    cgpa:       savedProfile.cgpa       || '',
    college:    savedProfile.college    || '',
    year:       savedProfile.year       || '',
    resumeName: savedProfile.resumeName || '',
    resumeUrl:  savedProfile.resumeUrl  || '',
  });

  // Notifications state — default all ON
  const [notifs, setNotifs] = useState({
    interview_requests: savedNotifs.interview_requests ?? true,
    session_reminders:  savedNotifs.session_reminders  ?? true,
    messages:           savedNotifs.messages           ?? true,
    platform_updates:   savedNotifs.platform_updates   ?? false,
    weekly_digest:      savedNotifs.weekly_digest      ?? true,
  });

  // Skill tag input
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !profile.skills.includes(s)) {
      setProfile(p => ({ ...p, skills: [...p.skills, s] }));
    }
    setSkillInput('');
  };

  const removeSkill = (s) => setProfile(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const toDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF resume.');
      return;
    }
    try {
      const dataUrl = await toDataUrl(file);
      setProfile(p => ({ ...p, resumeName: file.name, resumeUrl: dataUrl }));
    } catch {
      alert('Could not read resume file. Please try again.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const saveProfile = async () => {
    const updated = { ...savedProfile, ...profile };
    localStorage.setItem('alumnex_profile', JSON.stringify(updated));
    // Update auth context name/department
    const updatedUser = { ...user, name: profile.name, department: profile.department };
    login(updatedUser, localStorage.getItem('alumnex_token'));

    // Save to Supabase directly
    if (user?.id && !user.id.startsWith('stu-') && !user.id.startsWith('alm-')) {
      await updateUserProfile(user.id, profile).catch(err => console.warn('Profile save:', err.message));
    }

    flashSaved();
  };

  const saveNotifs = () => {
    localStorage.setItem('alumnex_notifs', JSON.stringify(notifs));
    flashSaved();
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inp = {
    width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)',
    borderRadius: 10, padding: '0.65rem 0.875rem', color: '#dae2fd',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  };
  const lbl = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 };

  const SECTIONS = [
    { id: 'profile',       icon: 'person',         label: 'Edit Profile'  },
    { id: 'notifications', icon: 'notifications',  label: 'Notifications' },
    { id: 'account',       icon: 'manage_accounts', label: 'Account'      },
  ];

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

      {/* Sidebar nav */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.875rem 1.25rem', background: activeSection === s.id ? '#222a3d' : 'transparent', color: activeSection === s.id ? '#c3c0ff' : '#c7c4d8', border: 'none', borderLeft: activeSection === s.id ? '3px solid #c3c0ff' : '3px solid transparent', cursor: 'pointer', fontSize: '0.875rem', fontWeight: activeSection === s.id ? 600 : 400, textAlign: 'left', transition: 'all 0.2s' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: activeSection === s.id ? "'FILL' 1" : "'FILL' 0" }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>

        {/* Save toast */}
        {saved && (
          <div style={{ position: 'fixed', top: 80, right: 24, background: 'rgba(78,222,163,0.15)', border: '1px solid rgba(78,222,163,0.3)', borderRadius: 12, padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: 8, zIndex: 100, animation: 'slideIn 0.3s ease' }}>
            <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4edea3' }}>Changes saved!</span>
          </div>
        )}

        {/* ── EDIT PROFILE ── */}
        {activeSection === 'profile' && (
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.75rem' }}>Edit Profile</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your name" style={inp} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" type="email" style={inp} />
              </div>
              <div>
                <label style={lbl}>Department / Branch</label>
                <input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Computer Science" style={inp} />
              </div>
              <div>
                <label style={lbl}>College / University</label>
                <input value={profile.college} onChange={e => setProfile(p => ({ ...p, college: e.target.value }))} placeholder="e.g. IIT Bombay" style={inp} />
              </div>
              <div>
                <label style={lbl}>Year of Study</label>
                <select value={profile.year} onChange={e => setProfile(p => ({ ...p, year: e.target.value }))} style={inp}>
                  <option value="">Select year</option>
                  {['1st Year','2nd Year','3rd Year','4th Year','Postgraduate'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>CGPA</label>
                <input type="number" min="0" max="10" step="0.1" value={profile.cgpa} onChange={e => setProfile(p => ({ ...p, cgpa: e.target.value }))} placeholder="e.g. 8.5" style={inp} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={lbl}>Bio</label>
              <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell mentors about yourself..." rows={3} style={{ ...inp, resize: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {[['linkedin','LinkedIn URL','https://linkedin.com/in/...'],['github','GitHub URL','https://github.com/...'],['portfolio','Portfolio','https://yoursite.com']].map(([key, label, ph]) => (
                <div key={key}>
                  <label style={lbl}>{label}</label>
                  <input value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} style={inp} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={lbl}>Skills</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {profile.skills.map(s => (
                  <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.6rem', background: 'rgba(195,192,255,0.12)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 999, fontSize: '0.75rem', color: '#c3c0ff' }}>
                    {s}
                    <button onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c3c0ff', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="Add a skill and press Enter..." style={{ ...inp, flex: 1 }} />
                <button onClick={addSkill} style={{ padding: '0.65rem 1rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Add</button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={lbl}>Resume (PDF)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => resumeInputRef.current?.click()}
                  style={{ padding: '0.65rem 1rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Upload Resume
                </button>
                {profile.resumeUrl && (
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: '0.65rem 1rem', background: 'rgba(78,222,163,0.12)', border: '1px solid rgba(78,222,163,0.25)', borderRadius: 10, color: '#4edea3', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}
                  >
                    View Resume
                  </a>
                )}
                {profile.resumeUrl && (
                  <button
                    onClick={() => setProfile(p => ({ ...p, resumeName: '', resumeUrl: '' }))}
                    style={{ padding: '0.65rem 1rem', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.25)', borderRadius: 10, color: '#ffb4ab', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </div>
              {profile.resumeName && (
                <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#c7c4d8' }}>
                  Current: {profile.resumeName}
                </div>
              )}
              <input
                ref={resumeInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleResumeUpload}
                style={{ display: 'none' }}
              />
            </div>

            <button onClick={saveProfile} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              Save Changes
            </button>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeSection === 'notifications' && (
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Notifications</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8', marginBottom: '1.75rem' }}>Choose what you want to be notified about.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {NOTIF_ITEMS.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#171f33', borderRadius: 12, border: `1px solid ${notifs[item.key] ? 'rgba(195,192,255,0.15)' : 'rgba(70,69,85,0.15)'}`, transition: 'border-color 0.2s' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{item.desc}</div>
                  </div>
                  {/* Toggle switch */}
                  <div onClick={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key] }))}
                    style={{ width: 44, height: 24, borderRadius: 999, background: notifs[item.key] ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#2d3449', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: notifs[item.key] ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Master toggle */}
            <div style={{ padding: '1rem 1.25rem', background: '#222a3d', borderRadius: 12, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 3 }}>Turn Off All Notifications</div>
                <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>Disable all notifications at once</div>
              </div>
              <button onClick={() => setNotifs(Object.fromEntries(NOTIF_ITEMS.map(i => [i.key, false])))}
                style={{ padding: '0.4rem 1rem', background: 'rgba(255,180,171,0.1)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                Turn Off All
              </button>
            </div>

            <button onClick={saveNotifs} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              Save Preferences
            </button>
          </div>
        )}

        {/* ── ACCOUNT ── */}
        {activeSection === 'account' && (
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.75rem' }}>Account Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: 'key', label: 'Change Password', desc: 'Update your login password', color: '#c3c0ff' },
                { icon: 'download', label: 'Export My Data', desc: 'Download all your profile and session data', color: '#4edea3' },
                { icon: 'delete_forever', label: 'Delete Account', desc: 'Permanently remove your account and data', color: '#ffb4ab' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#171f33', borderRadius: 12, border: '1px solid rgba(70,69,85,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ color: item.color, fontSize: 20 }}>{item.icon}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{item.desc}</div>
                    </div>
                  </div>
                  <button style={{ padding: '0.4rem 0.875rem', background: 'transparent', border: `1px solid ${item.color}40`, borderRadius: 8, color: item.color, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                    {item.label === 'Delete Account' ? 'Delete' : 'Manage'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
