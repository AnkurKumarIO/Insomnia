import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlumNexLogo from '../AlumNexLogo';
import { supabase } from '../lib/supabaseClient';
import { getUserByEmail, createUser } from '../lib/db';

function genPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function genUsername(name) {
  const parts = name.trim().toLowerCase().split(/\s+/);
  const base = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
  return base.replace(/[^a-z.]/g, '') + Math.floor(Math.random() * 90 + 10);
}

export default function StudentRegistration() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', college: '', year: '', department: '' });
  const [creds, setCreds]   = useState(null);
  const [copied, setCopied] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];
  const DEPTS = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'MBA', 'Other'];

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (!form.college.trim()) e.college = 'Required';
    if (!form.year)       e.year       = 'Required';
    if (!form.department) e.department = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setRegError('');

    const username = genUsername(form.name);
    const password = genPassword();

    try {
      // 1. Check if user already exists
      const existing = await getUserByEmail(form.email);
      if (existing) {
        setRegError('An account with this email already exists. Please log in.');
        setLoading(false);
        return;
      }

      // 2. Create Supabase Auth user directly from frontend
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email,
        password: password,
        options:  { data: { name: form.name, role: 'STUDENT' } },
      });

      if (authErr) throw authErr;
      const userId = authData.user?.id;
      if (!userId) throw new Error('Failed to create auth user');

      // 3. Insert profile row into users table (signs in first for RLS)
      await createUser({
        id:         userId,
        role:       'STUDENT',
        name:       form.name,
        email:      form.email,
        department: form.department,
        college:    form.college,
        year:       form.year,
        username,
        password,
      });

      // 4. Store pending profile locally
      const pending = { ...form, username, password, role: 'STUDENT', id: userId };
      localStorage.setItem('alumniconnect_pending_profile', JSON.stringify(pending));
      setCreds({ username, password });

    } catch (err) {
      console.error('Registration error:', err);
      setRegError(err.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const copy = (key, val) => {
    navigator.clipboard.writeText(val);
    setCopied(c => ({ ...c, [key]: true }));
    setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 2000);
  };

  const inp = { width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.7rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };
  const lbl = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 };

  if (creds) return (
    <div style={{ minHeight: '100vh', background: '#0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 480, border: '1px solid rgba(78,222,163,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>Account Created!</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Your account is saved. Use these credentials to log in.</p>
        </div>

        {[['Username', creds.username, 'user'], ['Password', creds.password, 'pass']].map(([label, val, key]) => (
          <div key={key} style={{ background: '#131b2e', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(70,69,85,0.2)' }}>
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: '#c3c0ff', letterSpacing: '0.05em' }}>{val}</div>
            </div>
            <button onClick={() => copy(key, val)} style={{ background: copied[key] ? 'rgba(78,222,163,0.15)' : 'rgba(195,192,255,0.1)', border: 'none', borderRadius: 8, padding: '0.4rem 0.75rem', color: copied[key] ? '#4edea3' : '#c3c0ff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              {copied[key] ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        ))}

        <div style={{ background: 'rgba(255,185,95,0.08)', border: '1px solid rgba(255,185,95,0.2)', borderRadius: 10, padding: '0.875rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.78rem', color: '#ffb95f', lineHeight: 1.6 }}>⚠️ Screenshot or note these credentials. They won't be shown again.</p>
        </div>

        <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Continue to Login
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 480, border: '1px solid rgba(70,69,85,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <AlumNexLogo size={32} />
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>Alum<span style={{ color: '#60a5fa' }}>NEX</span></span>
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Student Portal</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Create Account</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Join AlumNex and start your career journey.</p>
        </div>

        {regError && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#ffb4ab' }}>
            {regError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { key: 'name',    label: 'Full Name',           placeholder: 'Alice Johnson',    type: 'text'  },
            { key: 'email',   label: 'Email Address',       placeholder: 'alice@college.edu', type: 'email' },
            { key: 'college', label: 'College / University', placeholder: 'MIT',              type: 'text'  },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ ...inp, borderColor: errors[key] ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }} />
              {errors[key] && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors[key]}</div>}
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={lbl}>Year of Study</label>
              <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} style={{ ...inp, borderColor: errors.year ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }}>
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.year && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.year}</div>}
            </div>
            <div>
              <label style={lbl}>Department</label>
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={{ ...inp, borderColor: errors.department ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }}>
                <option value="">Select dept</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.department}</div>}
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: loading ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: loading ? '#c7c4d8' : '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Creating account...</>
              : 'Create Account & Continue'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c7c4d8', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#c3c0ff', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
