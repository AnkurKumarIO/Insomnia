import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';

export default function AlumniRegistration() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', department: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (!form.username.trim()) e.username = 'Required';
    if (!form.password.trim() || form.password.length < 6) e.password = 'Min 6 chars';
    if (!form.department.trim()) e.department = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await api.alumniRegister(form);
      if (result.token) {
        setStatus({ type: 'success', message: 'Account Created Successfully!' });
        login(result.user, result.token);
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setStatus({ type: 'error', message: result.error || 'Registration failed.' });
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
        <h2>Alumni Mentor Registration</h2>
        <p className="auth-subtitle">Join us as a mentor and guide future talent.</p>

        {status && (
          <div className={`status-message ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Name</label>
            <input type="text" className="input-field" placeholder="Priya Sharma" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
            {errors.name && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.name}</div>}
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" className="input-field" placeholder="priya@company.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            {errors.email && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.email}</div>}
          </div>
          <div className="input-group">
            <label>Username</label>
            <input type="text" className="input-field" placeholder="priya_s" value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} />
            {errors.username && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.username}</div>}
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" className="input-field" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
            {errors.password && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.password}</div>}
          </div>
          <div className="input-group">
            <label>Department / Expertise</label>
            <input type="text" className="input-field" placeholder="Computer Science" value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} />
            {errors.department && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginTop: 4 }}>{errors.department}</div>}
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? <><div className="spinner"></div> Registering...</> : 'Register as Mentor'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/alumni/login" style={{ color: 'var(--accent-purple)' }}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
