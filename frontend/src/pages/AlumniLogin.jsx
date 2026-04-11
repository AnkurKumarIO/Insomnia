import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { supabase } from '../lib/supabaseClient';
import { getUserByEmail, createUser } from '../lib/db';

export default function AlumniLogin() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      // 1. Check if alumni already exists in users table
      let dbUser = await getUserByEmail(email);

      if (!dbUser) {
        // 2. Create Supabase Auth + users row
        const tempPassword = `alumni_${Date.now()}`;
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email,
          password: tempPassword,
          options: { data: { name, role: 'ALUMNI' } },
        });
        if (authErr) throw authErr;

        // Sign in immediately to get session for RLS
        await supabase.auth.signInWithPassword({ email, password: tempPassword }).catch(() => {});

        dbUser = await createUser({
          id:         authData.user.id,
          role:       'ALUMNI',
          name,
          email,
          department: department || 'General',
          password:   tempPassword,
        });
      } else {
        // Existing user — sign in with Supabase Auth if possible
        // (we don't have their password, so just proceed with the profile data)
      }

      if (!dbUser) throw new Error('Failed to create or find user');

      setStatus({ type: 'success', message: `Welcome, ${dbUser.name}!` });

      const userData = {
        id:         dbUser.id,
        name:       dbUser.name,
        role:       dbUser.role || 'ALUMNI',
        department: dbUser.department || department,
        email,
      };

      login(userData, `token-${Date.now()}`);

      // Sync profile_data to localStorage
      if (dbUser.profile_data) {
        localStorage.setItem('alumniconnect_profile', JSON.stringify(dbUser.profile_data));
      }

      // Notify TNP: add to pending alumni list so bell shows notification
      try {
        const pendingAlumni = JSON.parse(localStorage.getItem('alumniconnect_pending_alumni') || '[]');
        const alreadyExists = pendingAlumni.find(a => a.email === email);
        if (!alreadyExists) {
          pendingAlumni.push({
            id: dbUser.id,
            name: dbUser.name,
            email,
            department: department || 'General',
            role: 'ALUMNI',
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem('alumniconnect_pending_alumni', JSON.stringify(pendingAlumni));
        }
      } catch {}

      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      console.error('Alumni login error:', err);
      setStatus({ type: 'error', message: err.message || 'Login failed.' });
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ padding: '2.5rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍💼</div>
        <h2>Alumni Mentor Login</h2>
        <p className="auth-subtitle">Join as a mentor and help students ace their interviews</p>

        {status && (
          <div className={`status-message ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" className="input-field" placeholder="Priya Sharma" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" className="input-field" placeholder="priya@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Department</label>
            <input type="text" className="input-field" placeholder="Computer Science" value={department} onChange={e => setDepartment(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? <><div className="spinner"></div> Joining...</> : 'Join as Mentor'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c7c4d8', marginTop: '1.25rem' }}>
          New alumni?{' '}
          <a href="/auth/alumni/register" style={{ color: '#ffb95f', textDecoration: 'none', fontWeight: 600 }}>Create an account</a>
        </p>
      </div>
    </div>
  );
}
