import React, { useState, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AlumNexLogo from '../AlumNexLogo';

// ── Hardcoded credential store ──
const CREDENTIAL_STORE = [
  { username: 'admin',           password: 'tnp_secure_123', role: 'TNP',     name: 'TNP Coordinator',  department: 'Administration',         id: 'tnp-admin' },
  { username: 'alice.johnson42', password: 'Xk7mP2qR9n',    role: 'STUDENT', name: 'Alice Johnson',    department: 'Computer Science',       id: 'stu-alice-johnson' },
  { username: 'bob.smith18',     password: 'Ry4nQ8wL3v',    role: 'STUDENT', name: 'Bob Smith',        department: 'Electrical Engineering', id: 'stu-bob-smith' },
  { username: 'priya.sharma',    password: 'Alumni@2026',    role: 'ALUMNI',  name: 'Priya Sharma',     department: 'Computer Science',       id: 'alm-priya-sharma' },
  { username: 'rahul.verma',     password: 'Alumni@2026',    role: 'ALUMNI',  name: 'Rahul Verma',      department: 'Electrical Engineering', id: 'alm-rahul-verma' },
  { username: 'sarah.chen',      password: 'Alumni@2026',    role: 'ALUMNI',  name: 'Sarah Chen',       department: 'Computer Science',       id: 'alm-sarah-chen' },
  { username: 'jasmine.patel',   password: 'Alumni@2026',    role: 'ALUMNI',  name: 'Jasmine Patel',    department: 'Computer Science',       id: 'alm-jasmine-patel' },
  { username: 'aisha.okonkwo',   password: 'Alumni@2026',    role: 'ALUMNI',  name: 'Aisha Okonkwo',    department: 'Computer Science',       id: 'alm-aisha-okonkwo' },
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

  const [role, setRole]         = useState('STUDENT');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
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
      const userData = { id: cred.id || `${cred.role.toLowerCase()}-${Date.now()}`, name: cred.name, role: cred.role, department: cred.department };
      login(userData, `token-${Date.now()}`);

    try {
      // TNP uses hardcoded credentials (no Supabase Auth)
      if (role === 'TNP') {
        if (email === 'admin' && password === 'tnp_secure_123') {
          login({ id: 'tnp-001', name: 'TNP Coordinator', role: 'TNP' }, 'tnp-token');
          navigate('/dashboard');
        } else {
          setError('Invalid TNP credentials. Use admin / tnp_secure_123');
        }
        setLoading(false);
        return;
      }

      // Students and Alumni use Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) throw authErr;

      const dbUser = await getUserByEmail(email);
      if (!dbUser) throw new Error('User profile not found. Please register first.');

      // Role check
      if (dbUser.role !== role) {
        setError(`This account is registered as ${dbUser.role}. Please select the correct tab.`);
        setLoading(false);
        return;
      }

      const userData = { id: dbUser.id, name: dbUser.name, role: dbUser.role, department: dbUser.department, email: dbUser.email };
      if (dbUser.profile_data) {
        localStorage.setItem('alumnex_profile', JSON.stringify(dbUser.profile_data));
      }

      // Store for session restoration
      localStorage.setItem('alumnex_pending_profile', JSON.stringify({
        id: dbUser.id, email, password, role: dbUser.role, name: dbUser.name,
        profileComplete: dbUser.profile_data?.profileComplete || false,
      }));

      login(userData, authData.session?.access_token || `token-${Date.now()}`);

      if (role === 'STUDENT' && !dbUser.profile_data?.profileComplete) {
        navigate('/profile-setup');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    }
    setLoading(false);
  };

  const ROLE_TABS = [
    { id: 'STUDENT', label: 'Student',   icon: 'school' },
    { id: 'ALUMNI',  label: 'Alumni',    icon: 'psychology' },
    { id: 'TNP',     label: 'TNP Admin', icon: 'admin_panel_settings' },
  ];

  const DEMO_HINTS = {
    STUDENT: 'Demo: alice.johnson42 / Xk7mP2qR9n',
    ALUMNI:  'Demo: priya.sharma / Alumni@2026  (also: sarah.chen, jasmine.patel, aisha.okonkwo)',
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

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '0.75rem' }}>
            <AlumNexLogo size={40} />
            <span style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>Alum<span style={{ color: '#60a5fa' }}>NEX</span></span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Sign in to your account</p>
        </div>

        <div style={{ background: '#171f33', borderRadius: 20, border: '1px solid rgba(70,69,85,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', overflow: 'hidden' }}>

          {/* Role tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
            {ROLE_TABS.map(tab => (
              <button key={tab.id} onClick={() => { setRole(tab.id); setError(''); setEmail(''); setPassword(''); }}
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
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>
                  {role === 'TNP' ? 'Username' : 'Email'}
                </label>
                <input
                  type={role === 'TNP' ? 'text' : 'email'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={role === 'TNP' ? 'admin' : role === 'STUDENT' ? 'alice@college.edu' : 'priya@google.com'}
                  autoComplete={role === 'TNP' ? 'username' : 'email'}
                  style={inp}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" style={{ ...inp, paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: loading ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: loading ? '#c7c4d8' : '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Signing in...</> : 'Sign In'}
              </button>
            </form>

            {/* Register links */}
            {role === 'STUDENT' && (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c7c4d8', marginTop: '1.25rem' }}>
                Don't have an account?{' '}
                <a href="/student/register" style={{ color: '#c3c0ff', textDecoration: 'none', fontWeight: 600 }}>Register here</a>
              </p>
            )}
            {role === 'ALUMNI' && (
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c7c4d8', marginTop: '1.25rem' }}>
                New alumni mentor?{' '}
                <a href="/auth/alumni/register" style={{ color: '#4edea3', textDecoration: 'none', fontWeight: 600 }}>Create account</a>
              </p>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
