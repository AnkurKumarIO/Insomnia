import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { api } from '../api';
import { supabase } from '../lib/supabaseClient';
import { getUserById } from '../lib/db';

export default function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);

    // Check credentials against localStorage pending profile
    const pending = JSON.parse(localStorage.getItem('alumniconnect_pending_profile') || '{}');

    if (pending.username === username.trim() && pending.password === password.trim()) {
      // Sign into Supabase Auth to get a real session (needed for RLS on requests)
      if (pending.email && pending.password) {
        await supabase.auth.signInWithPassword({
          email:    pending.email,
          password: pending.password,
        }).catch(() => {});
      }

      // Fetch real user data from Supabase
      let userData = {
        id:         pending.id   || null,
        name:       pending.name || 'Student',
        role:       'STUDENT',
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

      // If profile not yet completed, go to profile setup
      const profileComplete = pending.profileComplete || userData.profileComplete;
      navigate(profileComplete ? '/dashboard' : '/profile-setup');
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

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#1d00a5', fontSize: 30, fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Student Portal</div>
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
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. alice.johnson42"
              autoComplete="username"
              style={inp}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your generated password"
                autoComplete="current-password"
                style={{ ...inp, paddingRight: '2.5rem' }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: loading ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: loading ? '#c7c4d8' : '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#131b2e', borderRadius: 12, border: '1px solid rgba(70,69,85,0.2)' }}>
          <p style={{ fontSize: '0.75rem', color: '#c7c4d8', lineHeight: 1.6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffb95f', verticalAlign: 'middle', marginRight: 4 }}>info</span>
            Use the username and password shown after registration. If you lost them, <a href="/auth/student/register" style={{ color: '#c3c0ff', textDecoration: 'none', fontWeight: 600 }}>create a new account</a>.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c7c4d8', marginTop: '1.25rem' }}>
          Don't have an account?{' '}
          <a href="/auth/student/register" style={{ color: '#c3c0ff', textDecoration: 'none', fontWeight: 600 }}>Register here</a>
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
