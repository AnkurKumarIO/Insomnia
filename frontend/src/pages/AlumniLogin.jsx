import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { api } from '../api';

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
      const result = await api.alumniLogin(name, email, department);
      if (result.token) {
        setStatus({ type: 'success', message: `Welcome, ${result.user.name}!` });
        // Store full user including DB id
        const userData = {
          id:         result.user.id,
          name:       result.user.name,
          role:       result.user.role || 'ALUMNI',
          department: result.user.department || department,
          email,
        };
        login(userData, result.token);
        // Sync profile_data from Supabase to localStorage
        if (result.user.id) {
          api.getUser(result.user.id).then(dbUser => {
            if (dbUser?.profile_data) {
              localStorage.setItem('alumniconnect_profile', JSON.stringify(dbUser.profile_data));
            }
          }).catch(() => {});
        }
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setStatus({ type: 'error', message: result.error || 'Login failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Server connection failed.' });
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
      </div>
    </div>
  );
}
