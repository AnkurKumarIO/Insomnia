import React, { useState, useEffect } from 'react';

// ── Logging utility functions ──────────────────────────────────────────────────
export function logUserAction(user, role, action, detail) {
  try {
    const logs = JSON.parse(localStorage.getItem('alumnex_audit_logs') || '[]');
    const entry = {
      id: logs.length + 1,
      user: user || 'system',
      role: role || 'SYSTEM',
      action,
      detail,
      timestamp: new Date().toLocaleString('en-US', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).replace(/\//g, '-').replace(',', ''),
      status: 'success',
    };
    logs.unshift(entry);
    // Keep only last 50 logs to avoid excessive storage
    if (logs.length > 50) logs.pop();
    localStorage.setItem('alumnex_audit_logs', JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to log action:', err);
  }
}

// Initialize with demo logs if empty
function initializeDemoLogs() {
  try {
    const existing = JSON.parse(localStorage.getItem('alumnex_audit_logs') || '[]');
    if (existing.length > 0) return;
    
    const demoLogs = [
      { id: 1, user: 'admin', role: 'TNP', action: 'Login', detail: 'Successful login from 192.168.1.10', timestamp: '2026-04-16 09:14:22', status: 'success' },
      { id: 2, user: 'alice.johnson42', role: 'STUDENT', action: 'Profile Update', detail: 'Updated department to Computer Science', timestamp: '2026-04-16 09:22:05', status: 'success' },
      { id: 3, user: 'admin', role: 'TNP', action: 'Account Approved', detail: 'Approved account for Arjun Malhotra (STUDENT)', timestamp: '2026-04-16 09:35:18', status: 'success' },
      { id: 4, user: 'priya.sharma', role: 'ALUMNI', action: 'Login', detail: 'Successful login from 10.0.0.45', timestamp: '2026-04-16 10:02:44', status: 'success' },
      { id: 5, user: 'bob.smith18', role: 'STUDENT', action: 'Login', detail: 'Failed login attempt — wrong password', timestamp: '2026-04-16 10:15:30', status: 'failed' },
      { id: 6, user: 'bob.smith18', role: 'STUDENT', action: 'Login', detail: 'Successful login after retry', timestamp: '2026-04-16 10:16:02', status: 'success' },
      { id: 7, user: 'admin', role: 'TNP', action: 'Data Change', detail: 'Updated placement rate for CS Dept to 94.2%', timestamp: '2026-04-16 10:45:00', status: 'success' },
      { id: 8, user: 'priya.sharma', role: 'ALUMNI', action: 'Profile Update', detail: 'Updated experience field', timestamp: '2026-04-16 11:00:15', status: 'success' },
    ];
    localStorage.setItem('alumnex_audit_logs', JSON.stringify(demoLogs));
  } catch (err) {
    console.error('Failed to initialize demo logs:', err);
  }
}

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
  
  const [logs, setLogs] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize demo logs on first mount and refresh every 2 seconds
  useEffect(() => {
    initializeDemoLogs();
    loadLogs();
    
    const interval = setInterval(() => {
      loadLogs();
      setRefreshKey(k => k + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadLogs = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('alumnex_audit_logs') || '[]');
      setLogs(stored);
    } catch {
      setLogs([]);
    }
  };

  const filtered = logs.filter(l => {
    const matchRole   = !logRole   || l.role === logRole;
    const matchAction = !logAction || l.action === logAction;
    const matchDate   = !logDate   || l.timestamp.startsWith(logDate);
    return matchRole && matchAction && matchDate;
  });

  const inp = { background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 8, padding: '0.5rem 0.875rem', color: '#dae2fd', fontSize: '0.78rem', outline: 'none', cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }} key={refreshKey}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>Compliance & Logs</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Track all user activities — logins, profile updates, approvals, and data changes in real-time</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Total', val: logs.length, color: '#c3c0ff' },
            { label: 'Success', val: logs.filter(l => l.status === 'success').length, color: '#4edea3' },
            { label: 'Failed', val: logs.filter(l => l.status !== 'success').length, color: '#ffb4ab' },
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
        <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#c7c4d8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, background: '#4edea3', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          Showing <strong style={{ color: '#dae2fd' }}>{filtered.length}</strong> of {logs.length} entries (updating in real-time)
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
                <div style={{ fontSize: '0.75rem', color: l.role === 'TNP' ? '#c3c0ff' : l.role === 'ALUMNI' ? '#4edea3' : l.role === 'STUDENT' ? '#ffb95f' : '#c7c4d8', fontWeight: 700, background: l.role === 'TNP' ? 'rgba(195,192,255,0.1)' : l.role === 'ALUMNI' ? 'rgba(78,222,163,0.1)' : l.role === 'STUDENT' ? 'rgba(255,185,95,0.1)' : '#2d3449', padding: '0.2rem 0.5rem', borderRadius: 4, textAlign: 'center', width: 'fit-content' }}>{l.role}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#c7c4d8' }}><span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c3c0ff' }}>{actionIcon}</span> {l.action}</div>
                <div style={{ fontSize: '0.75rem', color: '#c7c4d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.detail}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(199,196,216,0.7)', fontFamily: 'monospace' }}>{l.timestamp}</div>
                <div style={{ background: st.bg, color: st.color, padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{st.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
