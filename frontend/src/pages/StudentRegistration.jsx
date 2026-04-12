import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { AuthContext } from '../context/AuthContext';

export default function StudentRegistration() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', college: '', year: '', department: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];
  const DEPTS = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'MBA', 'Other'];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (!form.username.trim()) e.username = 'Required';
    if (!form.password.trim() || form.password.length < 6) e.password = 'Min 6 chars';
    if (!form.college.trim()) e.college = 'Required';
    if (!form.year) e.year = 'Required';
    if (!form.department) e.department = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await api.studentRegister(form);
      if (result.token) {
        setStatus({ type: 'success', message: 'Account Created Successfully!' });
        login(result.user, result.token);
        setTimeout(() => navigate('/profile-setup'), 1000);
      } else {
        setStatus({ type: 'error', message: result.error || 'Registration failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Server connection failed.' });
    }
    setLoading(false);
  };

  const inp = { width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.7rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };
  const lbl = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1326', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 480, border: '1px solid rgba(70,69,85,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Student Portal</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Register</h2>
          <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Join AlumNEX AI and start your career journey.</p>
        </div>

        {status && (
          <div style={{ background: status.type === 'success' ? 'rgba(78,222,163,0.1)' : 'rgba(255,107,107,0.1)', color: status.type === 'success' ? '#4edea3' : '#ffb4ab', padding: '1rem', borderRadius: 10, marginBottom: '1rem' }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { key: 'name', label: 'Full Name', placeholder: 'Alice Johnson', type: 'text' },
            { key: 'email', label: 'Email Address', placeholder: 'alice@college.edu', type: 'email' },
            { key: 'username', label: 'Username', placeholder: 'alice_j', type: 'text' },
            { key: 'password', label: 'Password', placeholder: '••••••••', type: 'password' },
            { key: 'college', label: 'College / University', placeholder: 'MIT', type: 'text' },
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

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', marginTop: 8 }}>
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#c7c4d8', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/student/login" style={{ color: '#c3c0ff', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
