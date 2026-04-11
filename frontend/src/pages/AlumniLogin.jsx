import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabaseClient';
import { getUserById } from '../lib/db';
import AlumNexLogo from '../AlumNexLogo';

export default function AlumniLogin() {
  const navigate  = useNavigate();
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);

    // Check credentials against stored pending profile
    const pending = JSON.parse(localStorage.getItem('alumniconnect_pending_profile') || '{}');

    if (pending.username === username.trim() && pending.password === password.trim()) {
      // Restore Supabase Auth session
      if (pending.email && pending.password) {
        await supabase.auth.signInWithPassword({
          email:    pending.email,
          password: pending.password,
        }).catch(() => {});
      }

      let userData = {
        id:         pending.id   || null,
        name:       pending.name || 'Alumni',
        role:       'ALUMNI',
        department: pending.department || '',
        email:      pending.email || '',
      };

      if (pending.id) {
        const dbUser = await getUserById(pending.id).catch(() => null);
        if (dbUser) {
          userData = { id: dbUser.id, name: dbUser.name, role: dbUser.role, department: dbUser.department, email: dbUser.email };
          if (dbUser.profile_data) {
            localStorage.setItem('alumniconnect_profile', JSON.stringify(dbUser.profile_data));
          }
        }
      }

      login(userData, `token-${Date.now()}`);
      navigate('/dashboard');
    } else {
      setError('Invalid username or password. Check your credentials and try again.');
    }
    setLoading(false);
  };

  const inp = {
    width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)',
    borderRadius: 10, padding: '0.75rem 0.875rem', color: '#dae2fd',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 440, border: '1px solid rgba(70,69,85,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '1rem' }}>
            <AlumNexLogo size={28} />
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>Alum<span style={{ color: '#60a5fa' }}>NEX</span></span>
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Alumni Portal</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Welcome Back</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Sign in with your generated credentials</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#ffb4ab' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. priya.sharma42" autoComplete="username" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your generated password" autoComplete="current-password" style={{ ...inp, paddingRight: '2.5rem' }} />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: loading ? '#2d3449' : 'linear-gradient(135deg,#e07b00,#ffb95f)', color: loading ? '#c7c4d8' : '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Signing in...</>
              : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#131b2e', borderRadius: 12, border: '1px solid rgba(70,69,85,0.2)' }}>
          <p style={{ fontSize: '0.75rem', color: '#c7c4d8', lineHeight: 1.6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffb95f', verticalAlign: 'middle', marginRight: 4 }}>info</span>
            Use the username and password shown after registration.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c7c4d8', marginTop: '1.25rem' }}>
          New alumni?{' '}
          <a href="/auth/alumni/register" style={{ color: '#ffb95f', textDecoration: 'none', fontWeight: 600 }}>Create an account</a>
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
