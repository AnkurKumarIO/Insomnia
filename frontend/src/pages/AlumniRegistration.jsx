import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AlumNexLogo from '../AlumNexLogo';
import { supabase } from '../lib/supabaseClient';

const DEPTS = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'MBA', 'Other'];
const BATCH_YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);

export default function AlumniRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', company: '', department: '', batchYear: '', title: '' });
  const [creds, setCreds] = useState({ username: '', password: '', confirmPassword: '' });
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [usernameTimer, setUsernameTimer] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [done, setDone] = useState(false);

  const inp = { width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.7rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };
  const lbl = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (!form.company.trim()) e.company = 'Required';
    if (!form.department) e.department = 'Required';
    if (!form.batchYear) e.batchYear = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!creds.username.trim() || creds.username.length < 4) e.username = 'At least 4 characters';
    if (!/^[a-z0-9._]+$/.test(creds.username)) e.username = 'Only lowercase letters, numbers, dots, underscores';
    if (usernameStatus !== 'available') e.username = 'Choose an available username';
    if (creds.password.length < 8) e.password = 'At least 8 characters';
    if (creds.password !== creds.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUsernameChange = (val) => {
    setCreds(c => ({ ...c, username: val }));
    setUsernameStatus(null);
    if (usernameTimer) clearTimeout(usernameTimer);
    if (!val || val.length < 4 || !/^[a-z0-9._]+$/.test(val)) return;
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('profile_data->>username', val)
          .maybeSingle();
        setUsernameStatus(data ? 'taken' : 'available');
      } catch {
        setUsernameStatus('available');
      }
    }, 600);
    setUsernameTimer(t);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    setRegError('');
    try {
      // Check email not already used
      const { data: existing } = await supabase.from('users').select('id').eq('email', form.email).maybeSingle();
      if (existing) { setRegError('An account with this email already exists.'); setLoading(false); return; }

      // Create Supabase auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: creds.password,
        options: { data: { name: form.name, role: 'ALUMNI' } },
      });
      if (authErr) throw authErr;
      const userId = authData.user?.id;
      if (!userId) throw new Error('Failed to create auth user');

      // Insert into users table
      const { error: dbErr } = await supabase.from('users').insert({
        id: userId,
        role: 'ALUMNI',
        name: form.name,
        email: form.email,
        department: form.department,
        company: form.company,
        batch_year: parseInt(form.batchYear),
        verification_status: 'VERIFIED',
        profile_data: { username: creds.username, title: form.title || '', college: form.company },
      });
      if (dbErr) console.warn('DB insert error:', dbErr.message);

      // Save to localStorage for login fallback
      const approved = JSON.parse(localStorage.getItem('alumniconnect_approved_accounts') || '[]');
      approved.push({ id: userId, username: creds.username, password: creds.password, role: 'ALUMNI', name: form.name, email: form.email, department: form.department });
      localStorage.setItem('alumniconnect_approved_accounts', JSON.stringify(approved));

      // Notify TNP
      try {
        const pendingAlumni = JSON.parse(localStorage.getItem('alumniconnect_pending_alumni') || '[]');
        if (!pendingAlumni.find(a => a.email === form.email)) {
          pendingAlumni.push({ id: userId, name: form.name, email: form.email, department: form.department, role: 'ALUMNI', createdAt: new Date().toISOString() });
          localStorage.setItem('alumniconnect_pending_alumni', JSON.stringify(pendingAlumni));
        }
      } catch {}

      setDone(true);
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  if (done) return (
    <div style={{ minHeight: '100vh', background: '#0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 480, border: '1px solid rgba(78,222,163,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Alumni Account Created!</h2>
        <p style={{ fontSize: '0.875rem', color: '#c7c4d8', marginBottom: '2rem' }}>Your mentor profile is live. Log in to start accepting requests.</p>
        <div style={{ background: '#131b2e', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem', border: '1px solid rgba(70,69,85,0.2)', textAlign: 'left' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 4 }}>Username</div>
          <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: '#c3c0ff' }}>{creds.username}</div>
        </div>
        <div style={{ background: 'rgba(255,185,95,0.08)', border: '1px solid rgba(255,185,95,0.2)', borderRadius: 10, padding: '0.875rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.78rem', color: '#ffb95f', lineHeight: 1.6 }}>⚠️ Remember your password — it won't be shown again.</p>
        </div>
        <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Continue to Login <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
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
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Alumni Portal</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
            {step === 1 ? 'Join as Mentor' : 'Choose Credentials'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>
            {step === 1 ? 'Help students ace their interviews.' : "Pick a username and password you'll use to log in."}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 999, background: s <= step ? 'linear-gradient(90deg,#4f46e5,#4edea3)' : '#2d3449' }} />
          ))}
        </div>

        {regError && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#ffb4ab' }}>
            {regError}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={e => { e.preventDefault(); if (validateStep1()) setStep(2); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'name', label: 'Full Name', placeholder: 'Priya Sharma', type: 'text' },
              { key: 'email', label: 'Email Address', placeholder: 'priya@company.com', type: 'email' },
              { key: 'company', label: 'Current Company', placeholder: 'Google, Microsoft...', type: 'text' },
              { key: 'title', label: 'Job Title (optional)', placeholder: 'Senior Software Engineer', type: 'text' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label style={lbl}>{label}</label>
                <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ ...inp, borderColor: errors[key] ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }} />
                {errors[key] && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors[key]}</div>}
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={lbl}>Department</label>
                <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={{ ...inp, borderColor: errors.department ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }}>
                  <option value="">Select dept</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.department}</div>}
              </div>
              <div>
                <label style={lbl}>Batch Year</label>
                <select value={form.batchYear} onChange={e => setForm(f => ({ ...f, batchYear: e.target.value }))} style={{ ...inp, borderColor: errors.batchYear ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }}>
                  <option value="">Select year</option>
                  {BATCH_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.batchYear && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.batchYear}</div>}
              </div>
            </div>
            <button type="submit" style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg,#4f46e5,#4edea3)', color: '#003d29', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Next: Choose Credentials <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={lbl}>Username</label>
              <div style={{ position: 'relative' }}>
                <input type="text" placeholder="e.g. priya.sharma" value={creds.username} onChange={e => handleUsernameChange(e.target.value.toLowerCase())}
                  style={{ ...inp, borderColor: usernameStatus === 'available' ? 'rgba(78,222,163,0.5)' : usernameStatus === 'taken' ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)', paddingRight: '2.5rem' }} />
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                  {usernameStatus === 'checking' && <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c7c4d8', animation: 'spin 0.8s linear infinite' }}>progress_activity</span>}
                  {usernameStatus === 'available' && <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#4edea3' }}>check_circle</span>}
                  {usernameStatus === 'taken' && <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffb4ab' }}>cancel</span>}
                </div>
              </div>
              {usernameStatus === 'available' && <div style={{ fontSize: '0.7rem', color: '#4edea3', marginTop: 4 }}>✓ Username is available</div>}
              {usernameStatus === 'taken' && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>✗ Username already taken</div>}
              {errors.username && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.username}</div>}
              <div style={{ fontSize: '0.65rem', color: 'rgba(199,196,216,0.5)', marginTop: 4 }}>Lowercase letters, numbers, dots and underscores only</div>
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input type="password" placeholder="Min. 8 characters" value={creds.password} onChange={e => setCreds(c => ({ ...c, password: e.target.value }))} style={{ ...inp, borderColor: errors.password ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }} />
              {errors.password && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.password}</div>}
            </div>
            <div>
              <label style={lbl}>Confirm Password</label>
              <input type="password" placeholder="Re-enter your password" value={creds.confirmPassword} onChange={e => setCreds(c => ({ ...c, confirmPassword: e.target.value }))} style={{ ...inp, borderColor: errors.confirmPassword ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }} />
              {errors.confirmPassword && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.confirmPassword}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '0.875rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Back</button>
              <button type="submit" disabled={loading || usernameStatus !== 'available'}
                style={{ flex: 2, padding: '0.875rem', background: loading || usernameStatus !== 'available' ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#4edea3)', color: loading || usernameStatus !== 'available' ? '#c7c4d8' : '#003d29', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: loading || usernameStatus !== 'available' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Creating...</> : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c7c4d8', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#c3c0ff', textDecoration: 'none', fontWeight: 600 }}>Sign in</a>
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
