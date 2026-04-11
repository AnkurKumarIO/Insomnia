import React, { useState } from 'react';

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 44, height: 24, borderRadius: 999, background: on ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#2d3449', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </div>
  );
}

const ALL_PERMISSIONS = ['approve', 'reports', 'settings', 'logs', 'messaging'];

export default function SystemSettingsTab({ commSettings, setCommSettings, roles, setRoles }) {
  const [section, setSection] = useState('communication');
  const [saved, setSaved] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');

  const flashSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const togglePerm = (roleId, perm) => {
    setRoles(prev => prev.map(r => r.id === roleId ? {
      ...r,
      permissions: r.permissions.includes(perm) ? r.permissions.filter(p => p !== perm) : [...r.permissions, perm]
    } : r));
  };

  const COMM_ITEMS = [
    { key: 'emailNotifs', label: 'Email Notifications', desc: 'Send email alerts for new verifications and approvals' },
    { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Send SMS for urgent placement drive updates' },
    { key: 'weeklyReport', label: 'Weekly Summary Report', desc: 'Auto-generate and email weekly placement report every Monday' },
    { key: 'instantApproval', label: 'Instant Approval Notifications', desc: 'Notify students immediately when their account is approved' },
    { key: 'mentorMatchAlert', label: 'Mentor Match Alerts', desc: 'Alert students when a mentor accepts their interview request' },
  ];

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      {saved && (
        <div style={{ position: 'fixed', top: 80, right: 24, background: 'rgba(78,222,163,0.15)', border: '1px solid rgba(78,222,163,0.3)', borderRadius: 12, padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: 8, zIndex: 100 }}>
          <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4edea3' }}>Settings saved!</span>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div style={{ background: '#131b2e', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
          {[
            { id: 'communication', icon: 'mail', label: 'Communication' },
            { id: 'roles', icon: 'manage_accounts', label: 'Role Management' },
          ].map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.875rem 1.25rem', background: section === s.id ? '#222a3d' : 'transparent', color: section === s.id ? '#c3c0ff' : '#c7c4d8', border: 'none', borderLeft: section === s.id ? '3px solid #c3c0ff' : '3px solid transparent', cursor: 'pointer', fontSize: '0.875rem', fontWeight: section === s.id ? 600 : 400, textAlign: 'left', transition: 'all 0.2s' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: section === s.id ? "'FILL' 1" : "'FILL' 0" }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {/* ── COMMUNICATION SETTINGS ── */}
        {section === 'communication' && (
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Communication Settings</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8', marginBottom: '1.75rem' }}>Configure how the TNP system communicates with students, alumni, and coordinators.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {COMM_ITEMS.map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#171f33', borderRadius: 12, border: `1px solid ${commSettings[item.key] ? 'rgba(195,192,255,0.15)' : 'rgba(70,69,85,0.15)'}`, transition: 'border-color 0.2s' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{item.desc}</div>
                  </div>
                  <Toggle on={commSettings[item.key]} onChange={v => setCommSettings(s => ({ ...s, [item.key]: v }))} />
                </div>
              ))}
            </div>

            {/* Email template preview */}
            <div style={{ background: '#171f33', borderRadius: 12, padding: '1.25rem', border: '1px solid rgba(70,69,85,0.15)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 10 }}>Email Template Preview</div>
              <div style={{ background: '#0b1326', borderRadius: 8, padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#c7c4d8', lineHeight: 1.7 }}>
                <div style={{ color: '#c3c0ff' }}>Subject: Your AlumNex account has been approved</div>
                <div style={{ marginTop: 8 }}>Dear {'{{student_name}}'},</div>
                <div>Your account has been verified by the TNP team.</div>
                <div>Username: <span style={{ color: '#4edea3' }}>{'{{username}}'}</span></div>
                <div>Login at: <span style={{ color: '#60a5fa' }}>alumnex.edu/login</span></div>
              </div>
            </div>

            <button onClick={flashSave} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              Save Settings
            </button>
          </div>
        )}

        {/* ── ROLE MANAGEMENT ── */}
        {section === 'roles' && (
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Role Management</h3>
                <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Define roles and their permissions within the TNP system.</p>
              </div>
              <button onClick={() => { setNewRoleName(''); setEditingRole('new'); }} style={{ padding: '0.5rem 1rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, color: '#c3c0ff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> Add Role
              </button>
            </div>

            {/* Permission legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.25rem' }}>
              {ALL_PERMISSIONS.map(p => (
                <span key={p} style={{ padding: '0.2rem 0.6rem', background: '#222a3d', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600, color: '#c7c4d8', textTransform: 'capitalize' }}>{p}</span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {roles.map(r => (
                <div key={r.id} style={{ background: '#171f33', borderRadius: 12, padding: '1rem 1.25rem', border: `1px solid ${r.active ? 'rgba(195,192,255,0.12)' : 'rgba(70,69,85,0.12)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: r.active ? 'rgba(195,192,255,0.1)' : '#222a3d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: r.active ? '#c3c0ff' : '#464555' }}>manage_accounts</span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#c7c4d8' }}>{r.permissions.length} permission{r.permissions.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: 999, background: r.active ? 'rgba(78,222,163,0.12)' : 'rgba(70,69,85,0.2)', color: r.active ? '#4edea3' : '#c7c4d8' }}>
                        {r.active ? 'Active' : 'Inactive'}
                      </span>
                      <Toggle on={r.active} onChange={v => setRoles(prev => prev.map(x => x.id === r.id ? { ...x, active: v } : x))} />
                    </div>
                  </div>
                  {/* Permission chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ALL_PERMISSIONS.map(p => (
                      <button key={p} onClick={() => togglePerm(r.id, p)}
                        style={{ padding: '0.2rem 0.6rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.15s',
                          background: r.permissions.includes(p) ? 'rgba(195,192,255,0.15)' : '#222a3d',
                          color: r.permissions.includes(p) ? '#c3c0ff' : '#464555',
                          outline: r.permissions.includes(p) ? '1px solid rgba(195,192,255,0.3)' : 'none',
                        }}>
                        {r.permissions.includes(p) && '✓ '}{p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={flashSave} style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              Save Role Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
