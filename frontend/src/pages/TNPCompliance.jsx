import React, { useState } from 'react';

const LOGS = [
  { id: 1, user: 'admin', role: 'TNP', action: 'Login', detail: 'Successful login from 192.168.1.10', timestamp: '2026-04-12 09:14:22', status: 'success' },
  { id: 2, user: 'alice.johnson42', role: 'STUDENT', action: 'Profile Update', detail: 'Updated department to Computer Science', timestamp: '2026-04-12 09:22:05', status: 'success' },
  { id: 3, user: 'admin', role: 'TNP', action: 'Account Approved', detail: 'Approved account for Arjun Malhotra (STUDENT)', timestamp: '2026-04-12 09:35:18', status: 'success' },
  { id: 4, user: 'priya.sharma', role: 'ALUMNI', action: 'Login', detail: 'Successful login from 10.0.0.45', timestamp: '2026-04-12 10:02:44', status: 'success' },
  { id: 5, user: 'bob.smith18', role: 'STUDENT', action: 'Login', detail: 'Failed login attempt — wrong password', timestamp: '2026-04-12 10:15:30', status: 'failed' },
  { id: 6, user: 'bob.smith18', role: 'STUDENT', action: 'Login', detail: 'Successful login after retry', timestamp: '2026-04-12 10:16:02', status: 'success' },
  { id: 7, user: 'admin', role: 'TNP', action: 'Data Change', detail: 'Updated placement rate for CS Dept to 94.2%', timestamp: '2026-04-12 10:45:00', status: 'success' },
  { id: 8, user: 'priya.sharma', role: 'ALUMNI', action: 'Profile Update', detail: 'Updated experience field', timestamp: '2026-04-12 11:00:15', status: 'success' },
  { id: 9, user: 'rahul.verma', role: 'ALUMNI', action: 'Login', detail: 'Successful login from 172.16.0.8', timestamp: '2026-04-12 11:22:40', status: 'success' },
  { id: 10, user: 'admin', role: 'TNP', action: 'Account Approved', detail: 'Approved account for Sarah Jenkins (ALUMNI)', timestamp: '2026-04-12 11:45:10', status: 'success' },
  { id: 11, user: 'alice.johnson42', role: 'STUDENT', action: 'Logout', detail: 'Session ended normally', timestamp: '2026-04-12 12:10:00', status: 'success' },
  { id: 12, user: 'unknown', role: 'UNKNOWN', action: 'Login', detail: 'Unauthorized access attempt blocked', timestamp: '2026-04-12 13:05:55', status: 'blocked' },
  { id: 13, user: 'admin', role: 'TNP', action: 'Settings Change', detail: 'Enabled email notifications for approvals', timestamp: '2026-04-12 14:00:00', status: 'success' },
  { id: 14, user: 'priya.sharma', role: 'ALUMNI', action: 'Logout', detail: 'Session ended normally', timestamp: '2026-04-12 14:30:22', status: 'success' },
  { id: 15, user: 'admin', role: 'TNP', action: 'Logout', detail: 'Session ended normally', timestamp: '2026-04-12 17:00:00', status: 'success' },
];

const STATUS_STYLE = {
  success: { bg: 'rgba(78,222,163,0.12)', color: '#4edea3', label: '✓ Success' },
  failed:  { bg: 'rgba(255,180,171,0.12)', color: '#ffb4ab', label: '✗ Failed' },
  blocked: { bg: 'rgba(255,107,107,0.15)', color: '#ff6b6b', label: '⛔ Blocked' },
};

const ACTION_ICONS = {
  'Login': 'login', 'Logout': 'logout', 'Profile Update': 'edit', 'Account Approved': 'verified_user',
  'Data Change': 'edit_note', 'Settings Change': 'settings',
};

export default function ComplianceTab({ logRole, setLogRole, logAction, setLogAction, logDate, setLogDate }) {
  const ROLES = ['', 'TNP', 'STUDENT', 'ALUMNI', 'UNKNOWN'];
  const ACTIONS = ['', 'Login', 'Logout', 'Profile Update', 'Account Approved', 'Data Change', 'Settings Change'];

  const filtered = LOGS.filter(l => {
    const matchRole   = !logRole   || l.role === logRole;
    const matchAction = !logAction || l.action === logAction;
    const matchDate   = !logDate   || l.timestamp.startsWith(logDate);
    return matchRole && matchAction && matchDate;
  });

  const inp = { background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 8, padding: '0.5rem 0.875rem', color: '#dae2fd', fontSize: '0.78rem', outline: 'none', cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Compliance & Logs</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Track all user activities — logins, profile updates, approvals, and data changes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Total', val: LOGS.length, color: '#c3c0ff' },
            { label: 'Success', val: LOGS.filter(l => l.status === 'success').length, color: '#4edea3' },
            { label: 'Failed', val: LOGS.filter(l => l.status !== 'success').length, color: '#ffb4ab' },
          ].map(s => (
            <div key={s.label} style={{ background: '#131b2e', borderRadius: 10, padding: '0.5rem 1rem', textAlign: 'center', border: '1px solid rgba(70,69,85,0.15)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#131b2e', borderRadius: 14, padding: '1.25rem 1.5rem', border: '1px solid rgba(70,69,85,0.15)', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Role</label>
          <select value={logRole} onChange={e => setLogRole(e.target.value)} style={inp}>
            {ROLES.map(r => <option key={r} value={r}>{r || 'All Roles'}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Action</label>
          <select value={logAction} onChange={e => setLogAction(e.target.value)} style={inp}>
            {ACTIONS.map(a => <option key={a} value={a}>{a || 'All Actions'}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Date</label>
          <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} style={inp} />
        </div>
        {(logRole || logAction || logDate) && (
          <button onClick={() => { setLogRole(''); setLogAction(''); setLogDate(''); }} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
            Clear Filters
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#c7c4d8' }}>
          Showing <strong style={{ color: '#dae2fd' }}>{filtered.length}</strong> of {LOGS.length} entries
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 3fr 1.5fr 1fr', gap: 0, background: '#171f33', padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
          {['User', 'Role', 'Action', 'Detail', 'Timestamp', 'Status'].map(h => (
            <div key={h} style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ maxHeight: 480, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#c7c4d8' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, display: 'block', marginBottom: 10 }}>search_off</span>
              <p>No logs match the selected filters</p>
            </div>
          ) : filtered.map((l, i) => {
            const st = STATUS_STYLE[l.status] || STATUS_STYLE.success;
            const actionIcon = ACTION_ICONS[l.action] || 'info';
            return (
              <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 3fr 1.5fr 1fr', gap: 0, padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.08)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(195,192,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#dae2fd', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#1d00a5', flexShrink: 0 }}>
                    {l.user[0].toUpperCase()}
                  </div>
                  {l.user}
                </div>
                <div>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase',
                    background: l.role === 'TNP' ? 'rgba(195,192,255,0.12)' : l.role === 'ALUMNI' ? 'rgba(78,222,163,0.12)' : l.role === 'STUDENT' ? 'rgba(255,185,95,0.12)' : 'rgba(70,69,85,0.2)',
                    color: l.role === 'TNP' ? '#c3c0ff' : l.role === 'ALUMNI' ? '#4edea3' : l.role === 'STUDENT' ? '#ffb95f' : '#c7c4d8',
                  }}>{l.role}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#dae2fd' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#c3c0ff' }}>{actionIcon}</span>
                  {l.action}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.4 }}>{l.detail}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(199,196,216,0.5)', fontFamily: 'monospace' }}>{l.timestamp}</div>
                <div>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.58rem', fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

