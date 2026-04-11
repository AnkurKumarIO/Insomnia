import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AlumNexLogo from '../AlumNexLogo';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabaseClient';
import { getUserByEmail, createUser } from '../lib/db';

function genPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const DEPTS = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'MBA', 'Other'];
const YEARS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);

export default function AlumniRegistration() {
  const navigate  = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm]       = useState({ name: '', email: '', company: '', department: '', batchYear: '', linkedin: '', bio: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (!form.company.trim()) e.company = 'Required';
    if (!form.department)   e.department = 'Required';
    if (!form.batchYear)    e.batchYear  = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setRegError('');

    const password = genPassword();

    try {
      // Check if already exists
      const existing = await getUserByEmail(form.email);
      if (existing) {
        // Already registered — just log them in
        const userData = { id: existing.id, name: existing.name, role: 'ALUMNI', department: existing.department, email: form.email };
        login(userData, `token-${Date.now()}`);
        navigate('/dashboard');
        return;
      }

      // 1. Create Supabase Auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email,
        password: password,
        options:  { data: { name: form.name, role: 'ALUMNI' } },
      });
      if (authErr) throw authErr;

      const userId = authData.user?.id;
      if (!userId) throw new Error('Failed to create auth user');

      // 2. Insert into users table (signs in first for RLS)
      const dbUser = await createUser({
        id:         userId,
        role:       'ALUMNI',
        name:       form.name,
        email:      form.email,
        department: form.department,
        password,
        // Extra alumni fields stored in profile_data
        college:    form.company, // reuse college field for company
        year:       form.batchYear,
        username:   null,
      });

      // 3. Update with alumni-specific profile data
      await supabase.from('users').update({
        company:    form.company,
        batch_year: parseInt(form.batchYear),
        profile_data: {
          bio:      form.bio,
          linkedin: form.linkedin,
          company:  form.company,
          batchYear: form.batchYear,
        },
      }).eq('id', userId);

      // 4. Log them in
      const userData = {
        id:         userId,
        name:       form.name,
        role:       'ALUMNI',
        department: form.department,
        email:      form.email,
      };
      login(userData, `token-${Date.now()}`);
      localStorage.setItem('alumniconnect_profile', JSON.stringify({ bio: form.bio, linkedin: form.linkedin }));
      navigate('/dashboard');

    } catch (err) {
      console.error('Alumni registration error:', err);
      setRegError(err.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const inp = { width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.7rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };
  const lbl = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 520, border: '1px solid rgba(70,69,85,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <AlumNexLogo size={32} />
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>Alum<span style={{ color: '#60a5fa' }}>NEX</span></span>
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Alumni Portal</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Join as a Mentor</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Help students ace their interviews and grow their careers.</p>
        </div>

        {regError && (
          <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#ffb4ab' }}>
            {regError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={lbl}>Full Name</label>
              <input type="text" placeholder="Priya Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ ...inp, borderColor: errors.name ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }} />
              {errors.name && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.name}</div>}
            </div>
            <div>
              <label style={lbl}>Email Address</label>
              <input type="email" placeholder="priya@google.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ ...inp, borderColor: errors.email ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }} />
              {errors.email && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.email}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={lbl}>Current Company</label>
              <input type="text" placeholder="Google" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} style={{ ...inp, borderColor: errors.company ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }} />
              {errors.company && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.company}</div>}
            </div>
            <div>
              <label style={lbl}>Batch Year</label>
              <select value={form.batchYear} onChange={e => setForm(f => ({ ...f, batchYear: e.target.value }))} style={{ ...inp, borderColor: errors.batchYear ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }}>
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {errors.batchYear && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.batchYear}</div>}
            </div>
          </div>

          <div>
            <label style={lbl}>Department</label>
            <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={{ ...inp, borderColor: errors.department ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }}>
              <option value="">Select department</option>
              {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.department}</div>}
          </div>

          <div>
            <label style={lbl}>LinkedIn URL <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <input type="text" placeholder="https://linkedin.com/in/yourname" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} style={inp} />
          </div>

          <div>
            <label style={lbl}>Bio <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <textarea placeholder="Tell students about your experience and what you can help with..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} style={{ ...inp, resize: 'none' }} />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: loading ? '#2d3449' : 'linear-gradient(135deg,#e07b00,#ffb95f)', color: loading ? '#c7c4d8' : '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading
              ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Creating account...</>
              : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>psychology</span> Join as Mentor</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c7c4d8', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <a href="/auth/alumni" style={{ color: '#ffb95f', textDecoration: 'none', fontWeight: 600 }}>Sign in here</a>
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
