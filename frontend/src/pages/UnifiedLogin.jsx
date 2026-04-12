import React, { useState, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AlumNexLogo from '../AlumNexLogo';

// ── Hardcoded credential store (simulates what would be emailed after TNP approval) ──
// Format: { username, password, role, name, department, email }
const CREDENTIAL_STORE = [
  // TNP
  { username: 'admin',          password: 'tnp_secure_123', role: 'TNP',     name: 'TNP Coordinator',  department: 'Administration' },
  // Demo students (generated after registration + TNP approval)
  { username: 'alice.johnson42', password: 'Xk7mP2qR9n',   role: 'STUDENT', name: 'Alice Johnson',    department: 'Computer Science' },
  { username: 'bob.smith18',     password: 'Ry4nQ8wL3v',   role: 'STUDENT', name: 'Bob Smith',        department: 'Electrical Engineering' },
  // Demo alumni
  { username: 'priya.sharma',    password: 'Alumni@2026',   role: 'ALUMNI',  name: 'Priya Sharma',     department: 'Computer Science' },
  { username: 'rahul.verma',     password: 'Alumni@2026',   role: 'ALUMNI',  name: 'Rahul Verma',      department: 'Electrical Engineering' },
];

// Also check dynamically generated credentials from registration flow
function findCredential(username, password) {
  // Check hardcoded store first
  const found = CREDENTIAL_STORE.find(c => c.username === username.trim() && c.password === password.trim());
  if (found) return found;

  // Check localStorage for TNP-approved pending profiles
  try {
    const pending = JSON.parse(localStorage.getItem('alumniconnect_pending_profile') || '{}');
    if (pending.username === username.trim() && pending.password === password.trim()) {
      return { ...pending, role: pending.role || 'STUDENT' };
    }
    // Check approved accounts store
    const approved = JSON.parse(localStorage.getItem('alumniconnect_approved_accounts') || '[]');
    return approved.find(c => c.username === username.trim() && c.password === password.trim()) || null;
  } catch {
    return null;
  }
}

export default function UnifiedLogin() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('STUDENT'); // tab selector

  // Already logged in → go to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const cred = findCredential(username, password);
      if (!cred) {
        setError('Invalid username or password. Check your credentials and try again.');
        setLoading(false);
        return;
      }
      // Role mismatch check
      if (cred.role !== role) {
        setError(`These credentials belong to a ${cred.role.toLowerCase()} account. Please select the correct role tab.`);
        setLoading(false);
        return;
      }
      const userData = { id: `${cred.role.toLowerCase()}-${Date.now()}`, name: cred.name, role: cred.role, department: cred.department };
      login(userData, `token-${Date.now()}`);

      // If student and profile not set up yet, go to profile setup
      if (cred.role === 'STUDENT') {
        const profile = localStorage.getItem('alumniconnect_profile');
        if (!profile) { navigate('/profile-setup'); return; }
      }
      navigate('/dashboard');
    }, 700);
  };

  const ROLE_TABS = [
    { id: 'STUDENT', label: 'Student',  icon: 'school' },
    { id: 'ALUMNI',  label: 'Alumni',   icon: 'psychology' },
    { id: 'TNP',     label: 'TNP Admin', icon: 'admin_panel_settings' },
  ];

  const DEMO_HINTS = {
    STUDENT: 'Demo: alice.johnson42 / Xk7mP2qR9n',
    ALUMNI:  'Demo: priya.sharma / Alumni@2026',
    TNP:     'Demo: admin / tnp_secure_123',
  };

  const inp = {
    width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)',
    borderRadius: 10, padding: '0.75rem 0.875rem', color: '#dae2fd',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '0.75rem' }}>
            <AlumNexLogo size={40} />
            <span style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Alum<span style={{ color: '#60a5fa' }}>NEX</span></span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6 }}>AlumNex</h1>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Sign in with your credentials</p>
        </div>

        <div style={{ background: '#171f33', borderRadius: 20, border: '1px solid rgba(70,69,85,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', overflow: 'hidden' }}>

          {/* Role tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
            {ROLE_TABS.map(tab => (
              <button key={tab.id} onClick={() => { setRole(tab.id); setError(''); }}
                style={{ flex: 1, padding: '0.875rem 0.5rem', background: 'none', border: 'none', borderBottom: role === tab.id ? '2px solid #c3c0ff' : '2px solid transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: role === tab.id ? '#c3c0ff' : '#c7c4d8', transition: 'all 0.2s' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: role === tab.id ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{tab.label}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: '2rem' }}>
            {error && (
              <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#ffb4ab', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" autoComplete="username" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" style={{ ...inp, paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: loading ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: loading ? '#c7c4d8' : '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Demo hint */}
            <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: '#131b2e', borderRadius: 10, border: '1px solid rgba(70,69,85,0.2)' }}>
              <p style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#ffb95f', verticalAlign: 'middle', marginRight: 4 }}>info</span>
                {DEMO_HINTS[role]}
              </p>
            </div>

            {/* Register link for students */}
            {role === 'STUDENT' && (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c7c4d8', marginTop: '1.25rem' }}>
                Don't have an account?{' '}
                <a href="/auth/student/register" style={{ color: '#c3c0ff', textDecoration: 'none', fontWeight: 600 }}>Register here</a>
              </p>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
