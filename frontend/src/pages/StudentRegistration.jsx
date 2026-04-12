import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AlumNexLogo from '../AlumNexLogo';
import { supabase } from '../lib/supabaseClient';

const inp = { width:'100%', background:'#222a3d', border:'1px solid rgba(70,69,85,0.4)', borderRadius:10, padding:'0.7rem 0.875rem', color:'#dae2fd', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', fontFamily:'Inter, sans-serif' };
const lbl = { fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', display:'block', marginBottom:6 };

const DEPTS = ['Computer Science','Information Technology','Electronics & Communication','Mechanical Engineering','Civil Engineering','Electrical Engineering','MBA','Other'];
const YEARS = ['1st Year','2nd Year','3rd Year','4th Year','Postgraduate'];

function passwordStrength(pw) {
  if (!pw) return { label:'', color:'transparent', width:'0%' };
  if (pw.length < 8) return { label:'Too short', color:'#ffb4ab', width:'25%' };
  if (pw.length < 12) return { label:'Fair', color:'#ffb95f', width:'55%' };
  if (/[^a-zA-Z0-9]/.test(pw)) return { label:'Strong', color:'#4edea3', width:'100%' };
  return { label:'Fair', color:'#ffb95f', width:'55%' };
}

export default function StudentRegistration() {
  const navigate = useNavigate();
  const usernameTimer = useRef(null);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:'', email:'', college:'', year:'', department:'', studentId:'' });
  const [creds, setCreds] = useState({ username:'', password:'', confirmPassword:'' });
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [createdUsername, setCreatedUsername] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setC = (k, v) => setCreds(c => ({ ...c, [k]: v }));
  const strength = passwordStrength(creds.password);

  const handleUsernameChange = (val) => {
    setC('username', val);
    setUsernameStatus(null);
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (!val || val.length < 4 || !/^[a-z0-9._]+$/.test(val)) return;
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      try {
        const { data } = await supabase.from('users').select('id').filter('profile_data->>username', 'eq', val).maybeSingle();
        setUsernameStatus(data ? 'taken' : 'available');
      } catch { setUsernameStatus('available'); }
    }, 600);
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required';
    if (!form.college.trim()) e.college = 'Required';
    if (!form.year) e.year = 'Required';
    if (!form.department) e.department = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!creds.username || creds.username.length < 4) e.username = 'Min 4 characters';
    else if (!/^[a-z0-9._]+$/.test(creds.username)) e.username = 'Lowercase letters, numbers, dots and underscores only';
    else if (usernameStatus === 'taken') e.username = 'Username already taken';
    else if (usernameStatus !== 'available') e.username = 'Please wait for availability check';
    if (creds.password.length < 8) e.password = 'Min 8 characters';
    if (creds.password !== creds.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    setRegError('');
    try {
      const { data: existing } = await supabase.from('users').select('id').eq('email', form.email).maybeSingle();
      if (existing) { setRegError('An account with this email already exists.'); setLoading(false); return; }

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: creds.password,
        options: { data: { name: form.name, role: 'STUDENT' } },
      });
      if (authErr) throw authErr;
      const userId = authData.user?.id;
      if (!userId) throw new Error('Failed to create auth user');

      await supabase.from('users').insert({
        id: userId, role: 'STUDENT', name: form.name, email: form.email,
        department: form.department, verification_status: 'VERIFIED',
        profile_data: { username: creds.username, college: form.college, year: form.year, studentId: form.studentId },
      });

      localStorage.setItem('alumniconnect_pending_profile', JSON.stringify({ ...form, username: creds.username, password: creds.password, role: 'STUDENT', id: userId }));
      setCreatedUsername(creds.username);
      setStep(3);
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const stepLabels = ['Basic Info', 'Credentials', 'Done'];
  const StepBar = () => (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:'2rem' }}>
      {stepLabels.map((label, i) => {
        const n = i + 1; const active = step === n; const done = step > n;
        return (
          <React.Fragment key={n}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background: done ? '#4edea3' : active ? '#c3c0ff' : '#222a3d', border:`2px solid ${done ? '#4edea3' : active ? '#c3c0ff' : 'rgba(70,69,85,0.4)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:700, color: done || active ? '#0b1326' : '#c7c4d8', marginBottom:4, transition:'all 0.3s' }}>
                {done ? <span className="material-symbols-outlined" style={{ fontSize:14 }}>check</span> : n}
              </div>
              <span style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color: active ? '#c3c0ff' : done ? '#4edea3' : '#c7c4d8' }}>{label}</span>
            </div>
            {i < stepLabels.length - 1 && <div style={{ flex:1, height:2, background: step > n ? '#4edea3' : 'rgba(70,69,85,0.3)', marginBottom:20, transition:'background 0.3s' }} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  if (step === 3) return (
    <div style={{ minHeight:'100vh', background:'#0b1326', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', fontFamily:'Inter, sans-serif', color:'#dae2fd' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ background:'#171f33', borderRadius:20, padding:'2.5rem', width:'100%', maxWidth:480, border:'1px solid rgba(78,222,163,0.2)', boxShadow:'0 40px 80px rgba(0,0,0,0.5)', textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>🎉</div>
        <h2 style={{ fontSize:'1.75rem', fontWeight:900, letterSpacing:'-0.03em', marginBottom:8 }}>Account Created!</h2>
        <p style={{ fontSize:'0.875rem', color:'#c7c4d8', marginBottom:'1.5rem' }}>Welcome to AlumNex. Your account is ready.</p>
        <div style={{ background:'#131b2e', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid rgba(70,69,85,0.2)' }}>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:4 }}>Your Username</div>
            <div style={{ fontFamily:'monospace', fontSize:'1rem', fontWeight:700, color:'#c3c0ff', letterSpacing:'0.05em' }}>{createdUsername}</div>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(createdUsername); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ background: copied ? 'rgba(78,222,163,0.15)' : 'rgba(195,192,255,0.1)', border:'none', borderRadius:8, padding:'0.4rem 0.75rem', color: copied ? '#4edea3' : '#c3c0ff', fontSize:'0.7rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ background:'rgba(255,185,95,0.08)', border:'1px solid rgba(255,185,95,0.2)', borderRadius:10, padding:'0.875rem', marginBottom:'1.5rem', textAlign:'left' }}>
          <p style={{ fontSize:'0.78rem', color:'#ffb95f', lineHeight:1.6, margin:0 }}>⚠️ Remember your password — it won't be shown again.</p>
        </div>
        <button onClick={() => navigate('/login')} style={{ width:'100%', padding:'0.875rem', background:'linear-gradient(135deg,#4f46e5,#c3c0ff)', color:'#1d00a5', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.875rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          Continue to Login <span className="material-symbols-outlined" style={{ fontSize:18 }}>arrow_forward</span>
        </button>
        <p style={{ textAlign:'center', fontSize:'0.8rem', color:'#c7c4d8', marginTop:'1.5rem' }}>
          Already have an account? <a href="/login" style={{ color:'#c3c0ff', textDecoration:'none', fontWeight:600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0b1326', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', fontFamily:'Inter, sans-serif', color:'#dae2fd' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ background:'#171f33', borderRadius:20, padding:'2.5rem', width:'100%', maxWidth:500, border:'1px solid rgba(70,69,85,0.15)', boxShadow:'0 40px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'0.5rem' }}>
          <AlumNexLogo size={32} />
          <span style={{ fontSize:'1.25rem', fontWeight:900, color:'#fff' }}>Alum<span style={{ color:'#60a5fa' }}>NEX</span></span>
          <span style={{ marginLeft:'auto', fontSize:'0.6rem', fontWeight:700, color:'#c3c0ff', textTransform:'uppercase', letterSpacing:'0.15em', background:'rgba(195,192,255,0.1)', border:'1px solid rgba(195,192,255,0.25)', borderRadius:6, padding:'2px 8px' }}>Student Portal</span>
        </div>
        <p style={{ fontSize:'0.8rem', color:'#c7c4d8', marginBottom:'1.75rem' }}>Student Registration — Step {step} of 3</p>
        <StepBar />
        {regError && <div style={{ background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)', borderRadius:10, padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.8rem', color:'#ffb4ab' }}>{regError}</div>}

        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {[{k:'name',l:'Full Name',p:'Alice Johnson',t:'text'},{k:'email',l:'Email Address',p:'alice@college.edu',t:'email'},{k:'college',l:'College / University',p:'MIT',t:'text'}].map(({k,l,p,t}) => (
              <div key={k}>
                <label style={lbl}>{l}</label>
                <input type={t} value={form[k]} onChange={e => setF(k, e.target.value)} placeholder={p} style={{ ...inp, borderColor: errors[k] ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }} />
                {errors[k] && <div style={{ fontSize:'0.7rem', color:'#ffb4ab', marginTop:4 }}>{errors[k]}</div>}
              </div>
            ))}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div>
                <label style={lbl}>Year of Study</label>
                <select value={form.year} onChange={e => setF('year', e.target.value)} style={{ ...inp, borderColor: errors.year ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }}>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.year && <div style={{ fontSize:'0.7rem', color:'#ffb4ab', marginTop:4 }}>{errors.year}</div>}
              </div>
              <div>
                <label style={lbl}>Department</label>
                <select value={form.department} onChange={e => setF('department', e.target.value)} style={{ ...inp, borderColor: errors.department ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)' }}>
                  <option value="">Select dept</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <div style={{ fontSize:'0.7rem', color:'#ffb4ab', marginTop:4 }}>{errors.department}</div>}
              </div>
            </div>
            <div>
              <label style={lbl}>Student ID <span style={{ color:'#c7c4d8', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
              <input value={form.studentId} onChange={e => setF('studentId', e.target.value)} placeholder="STU-2024-XXXX" style={inp} />
            </div>
            <button onClick={() => { if (validateStep1()) setStep(2); }} style={{ width:'100%', padding:'0.875rem', background:'linear-gradient(135deg,#4f46e5,#c3c0ff)', color:'#1d00a5', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.875rem', cursor:'pointer', marginTop:8, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              Continue to Credentials <span className="material-symbols-outlined" style={{ fontSize:18 }}>arrow_forward</span>
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <h3 style={{ fontSize:'1rem', fontWeight:700, margin:'0 0 4px', color:'#dae2fd' }}>Set Your Login Credentials</h3>
              <p style={{ fontSize:'0.78rem', color:'#c7c4d8', margin:0 }}>Choose a username and a strong password.</p>
            </div>
            {/* Username */}
            <div>
              <label style={lbl}>Username</label>
              <div style={{ position:'relative' }}>
                <input value={creds.username} onChange={e => handleUsernameChange(e.target.value.toLowerCase())} placeholder="alice.johnson" style={{ ...inp, borderColor: errors.username ? 'rgba(255,107,107,0.5)' : usernameStatus === 'available' ? 'rgba(78,222,163,0.5)' : usernameStatus === 'taken' ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)', paddingRight:'2.5rem' }} />
                <div style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)' }}>
                  {usernameStatus === 'checking' && <div style={{ width:14, height:14, border:'2px solid rgba(195,192,255,0.3)', borderTop:'2px solid #c3c0ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />}
                  {usernameStatus === 'available' && <span className="material-symbols-outlined" style={{ fontSize:18, color:'#4edea3' }}>check_circle</span>}
                  {usernameStatus === 'taken' && <span className="material-symbols-outlined" style={{ fontSize:18, color:'#ffb4ab' }}>cancel</span>}
                </div>
              </div>
              <div style={{ fontSize:'0.68rem', color: errors.username ? '#ffb4ab' : usernameStatus === 'available' ? '#4edea3' : usernameStatus === 'taken' ? '#ffb4ab' : '#c7c4d8', marginTop:4 }}>
                {errors.username || (usernameStatus === 'available' ? '✓ Username is available' : usernameStatus === 'taken' ? '✗ Username already taken' : 'Lowercase letters, numbers, dots and underscores only')}
              </div>
            </div>
            {/* Password */}
            <div>
              <label style={lbl}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={creds.password} onChange={e => setC('password', e.target.value)} placeholder="Min 8 characters" style={{ ...inp, borderColor: errors.password ? 'rgba(255,107,107,0.5)' : 'rgba(70,69,85,0.4)', paddingRight:'2.5rem' }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#c7c4d8', padding:0, display:'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:18 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {creds.password && (
                <div style={{ marginTop:6 }}>
                  <div style={{ height:4, borderRadius:4, background:'rgba(70,69,85,0.3)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:strength.width, background:strength.color, borderRadius:4, transition:'all 0.3s' }} />
                  </div>
                  <div style={{ fontSize:'0.68rem', color:strength.color, marginTop:3 }}>{strength.label}</div>
                </div>
              )}
              {errors.password && <div style={{ fontSize:'0.7rem', color:'#ffb4ab', marginTop:4 }}>{errors.password}</div>}
            </div>
            {/* Confirm */}
            <div>
              <label style={lbl}>Confirm Password</label>
              <div style={{ position:'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} value={creds.confirmPassword} onChange={e => setC('confirmPassword', e.target.value)} placeholder="Re-enter password" style={{ ...inp, borderColor: errors.confirmPassword ? 'rgba(255,107,107,0.5)' : creds.confirmPassword && creds.password === creds.confirmPassword ? 'rgba(78,222,163,0.5)' : 'rgba(70,69,85,0.4)', paddingRight:'2.5rem' }} />
                <button type="button" onClick={() => setShowConfirm(s => !s)} style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#c7c4d8', padding:0, display:'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:18 }}>{showConfirm ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {errors.confirmPassword && <div style={{ fontSize:'0.7rem', color:'#ffb4ab', marginTop:4 }}>{errors.confirmPassword}</div>}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onClick={() => setStep(1)} style={{ flex:1, padding:'0.875rem', background:'rgba(70,69,85,0.2)', border:'1px solid rgba(70,69,85,0.3)', borderRadius:12, color:'#c7c4d8', fontWeight:700, fontSize:'0.875rem', cursor:'pointer' }}>Back</button>
              <button onClick={handleSubmit} disabled={loading} style={{ flex:2, padding:'0.875rem', background: loading ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: loading ? '#c7c4d8' : '#1d00a5', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.875rem', cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {loading ? <><div style={{ width:16, height:16, border:'2px solid rgba(199,196,216,0.3)', borderTop:'2px solid #c7c4d8', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Creating...</> : <><span className="material-symbols-outlined" style={{ fontSize:18 }}>person_add</span>Create Account</>}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign:'center', fontSize:'0.8rem', color:'#c7c4d8', marginTop:'1.5rem' }}>
          Already have an account? <a href="/login" style={{ color:'#c3c0ff', textDecoration:'none', fontWeight:600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
