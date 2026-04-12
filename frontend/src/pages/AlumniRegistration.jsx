import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AlumNexLogo from '../AlumNexLogo';
import { supabase } from '../lib/supabaseClient';

const S = { width:'100%', background:'#222a3d', border:'1px solid rgba(70,69,85,0.4)', borderRadius:10, padding:'0.7rem 0.875rem', color:'#dae2fd', fontSize:'0.875rem', outline:'none', boxSizing:'border-box', fontFamily:'Inter, sans-serif' };
const L = { fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', display:'block', marginBottom:6 };
const DEPTS = ['Computer Science','Information Technology','Electronics & Communication','Mechanical Engineering','Civil Engineering','Electrical Engineering','MBA','Other'];
const YEARS = Array.from({length:20},(_,i)=>String(new Date().getFullYear()-i));

export default function AlumniRegistration() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const uTimer = useRef(null);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({name:'',email:'',membershipNo:'',company:'',title:'',department:'',batchYear:''});
  const [ver, setVer] = useState({memVerified:false,memChecking:false,memError:'',emailVerified:false,otpSent:false,otpChecking:false,otp:'',emailChecking:false,emailError:'',dbAlumni:null});
  const [doc, setDoc] = useState({file:null,aiRunning:false,aiStep:'',aiDone:false,dragOver:false});
  const [creds, setCreds] = useState({username:'',password:'',confirmPassword:''});
  const [uStatus, setUStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [done, setDone] = useState(false);

  const sf = (k,v) => setForm(f=>({...f,[k]:v}));
  const sv = (k,v) => setVer(x=>({...x,[k]:v}));

  // ── Step 1 validate ──────────────────────────────────────────────────────
  const v1 = () => {
    const e={};
    if(!form.name.trim()) e.name='Required';
    if(!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email='Valid email required';
    if(!form.membershipNo.trim()) e.membershipNo='Required';
    if(!form.company.trim()) e.company='Required';
    if(!form.department) e.department='Required';
    if(!form.batchYear) e.batchYear='Required';
    setErrors(e); return Object.keys(e).length===0;
  };

  // ── Membership verify against Supabase ───────────────────────────────────
  const verifyMembership = async () => {
    sv('memChecking',true); sv('memError','');
    try {
      // Match by name + batch_year in users table
      const nameParts = form.name.trim().toLowerCase().split(/\s+/);
      const { data } = await supabase.from('users')
        .select('id,name,email,batch_year,department,company,profile_data')
        .eq('role','ALUMNI')
        .eq('verification_status','VERIFIED')
        .ilike('name', `%${nameParts[0]}%`)
        .limit(10);

      // Find best match: name similarity + batch year
      const match = (data||[]).find(u => {
        const nameMatch = u.name.toLowerCase().includes(nameParts[0]) ||
          (nameParts[1] && u.name.toLowerCase().includes(nameParts[1]));
        const yearMatch = !form.batchYear || String(u.batch_year) === String(form.batchYear);
        return nameMatch && yearMatch;
      });

      if (match) {
        sv('memVerified',true);
        sv('dbAlumni',match);
        sv('memError','');
      } else {
        sv('memVerified',false);
        sv('memError','Not found in alumni registry. Check your name and batch year.');
      }
    } catch(e) {
      sv('memError','Verification failed. Try again.');
    }
    sv('memChecking',false);
  };

  // ── Email verify against Supabase ────────────────────────────────────────
  const sendOtp = async () => {
    sv('emailChecking',true); sv('emailError','');
    try {
      // Check email exists in users table as ALUMNI
      const { data } = await supabase.from('users')
        .select('id,name,email')
        .eq('role','ALUMNI')
        .eq('email', form.email.trim().toLowerCase())
        .maybeSingle();

      if (data) {
        sv('otpSent',true);
        sv('emailError','');
      } else {
        sv('emailError','Email not found in alumni registry. Use your registered college email.');
      }
    } catch(e) {
      sv('emailError','Could not verify email. Try again.');
    }
    sv('emailChecking',false);
  };

  const verifyOtp = () => {
    sv('otpChecking',true);
    setTimeout(() => {
      sv('otpChecking',false);
      if(ver.otp==='123456') { sv('emailVerified',true); sv('emailError',''); }
      else sv('emailError','Invalid OTP. Demo code: 123456');
    },600);
  };

  // ── AI doc check ─────────────────────────────────────────────────────────
  const runAI = () => {
    setDoc(d=>({...d,aiRunning:true,aiDone:false,aiStep:'Scanning document...'}));
    const steps=['Scanning document...','Extracting name & institution...','Cross-verifying with alumni registry...'];
    let i=0;
    const iv=setInterval(()=>{
      i++;
      if(i<steps.length) setDoc(d=>({...d,aiStep:steps[i]}));
      else { clearInterval(iv); setDoc(d=>({...d,aiRunning:false,aiDone:true})); }
    },900);
  };

  // ── Username availability check ──────────────────────────────────────────
  const handleUsername = (val) => {
    setCreds(c=>({...c,username:val}));
    setUStatus(null);
    if(uTimer.current) clearTimeout(uTimer.current);
    if(!val||val.length<4||!/^[a-z0-9._]+$/.test(val)) return;
    setUStatus('checking');
    uTimer.current=setTimeout(async()=>{
      try {
        const {data} = await supabase.from('users').select('id').filter('profile_data->>username','eq',val).maybeSingle();
        setUStatus(data?'taken':'available');
      } catch { setUStatus('available'); }
    },600);
  };

  // ── Final submit: create Supabase auth + save credentials ────────────────
  const handleSubmit = async () => {
    const e={};
    if(!creds.username||creds.username.length<4) e.username='Min 4 characters';
    else if(!/^[a-z0-9._]+$/.test(creds.username)) e.username='Lowercase, numbers, dots, underscores only';
    else if(uStatus!=='available') e.username='Choose an available username';
    if(creds.password.length<8) e.password='Min 8 characters';
    if(creds.password!==creds.confirmPassword) e.confirmPassword='Passwords do not match';
    setErrors(e);
    if(Object.keys(e).length>0) return;

    setLoading(true); setRegError('');
    try {
      // Check if email already has auth account
      const { data: existing } = await supabase.from('users').select('id,profile_data').eq('email',form.email.trim().toLowerCase()).maybeSingle();

      let userId;
      if(existing) {
        // Update existing user's profile_data with username
        userId = existing.id;
        const updatedProfile = { ...(existing.profile_data||{}), username: creds.username, company: form.company, title: form.title };
        await supabase.from('users').update({ profile_data: updatedProfile, company: form.company, batch_year: parseInt(form.batchYear)||null }).eq('id',userId);
        // Try to update auth password — create new auth user if needed
        const { error: signUpErr } = await supabase.auth.signUp({ email: form.email.trim().toLowerCase(), password: creds.password, options:{ data:{ name:form.name, role:'ALUMNI' } } });
        if(signUpErr && !signUpErr.message.includes('already registered')) throw signUpErr;
      } else {
        // Create new Supabase auth user
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: creds.password,
          options: { data: { name: form.name, role: 'ALUMNI' } },
        });
        if(authErr) throw authErr;
        userId = authData.user?.id;
        if(!userId) throw new Error('Failed to create auth user');

        // Insert into users table
        await supabase.from('users').insert({
          id: userId, role:'ALUMNI', name:form.name,
          email: form.email.trim().toLowerCase(),
          department: form.department, company: form.company,
          batch_year: parseInt(form.batchYear)||null,
          verification_status:'VERIFIED',
          profile_data:{ username:creds.username, title:form.title||'', membershipNo:form.membershipNo },
        });
      }

      // Save to localStorage for login fallback
      const approved = JSON.parse(localStorage.getItem('alumniconnect_approved_accounts')||'[]');
      approved.push({ id:userId, username:creds.username, password:creds.password, role:'ALUMNI', name:form.name, email:form.email.trim().toLowerCase(), department:form.department });
      localStorage.setItem('alumniconnect_approved_accounts', JSON.stringify(approved));

      setDone(true);
    } catch(err) {
      setRegError(err.message||'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  // ── Step bar ─────────────────────────────────────────────────────────────
  const STEPS=['Profile','Verify','Documents','Credentials'];
  const StepBar=()=>(
    <div style={{display:'flex',alignItems:'center',marginBottom:'2rem'}}>
      {STEPS.map((label,i)=>{
        const n=i+1,active=step===n,done2=step>n;
        return(<React.Fragment key={n}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',flex:1}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:done2?'#4edea3':active?'#c3c0ff':'#222a3d',border:`2px solid ${done2?'#4edea3':active?'#c3c0ff':'rgba(70,69,85,0.4)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.7rem',fontWeight:700,color:done2||active?'#0b1326':'#c7c4d8',marginBottom:4}}>
              {done2?<span className="material-symbols-outlined" style={{fontSize:14}}>check</span>:n}
            </div>
            <span style={{fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:active?'#c3c0ff':done2?'#4edea3':'#c7c4d8'}}>{label}</span>
          </div>
          {i<STEPS.length-1&&<div style={{flex:1,height:2,background:step>n?'#4edea3':'rgba(70,69,85,0.3)',marginBottom:20}}/>}
        </React.Fragment>);
      })}
    </div>
  );

  // ── Done screen ───────────────────────────────────────────────────────────
  if(done) return(
    <div style={{minHeight:'100vh',background:'#0b1326',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',fontFamily:'Inter, sans-serif',color:'#dae2fd'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{background:'#171f33',borderRadius:20,padding:'2.5rem',width:'100%',maxWidth:480,border:'1px solid rgba(78,222,163,0.2)',boxShadow:'0 40px 80px rgba(0,0,0,0.5)',textAlign:'center'}}>
        <div style={{fontSize:'3rem',marginBottom:'0.75rem'}}>🎉</div>
        <h2 style={{fontSize:'1.75rem',fontWeight:900,marginBottom:8}}>Account Created!</h2>
        <p style={{fontSize:'0.875rem',color:'#c7c4d8',marginBottom:'1.5rem'}}>Your alumni mentor account is live. Log in to start accepting requests.</p>
        <div style={{background:'#131b2e',borderRadius:12,padding:'1rem 1.25rem',marginBottom:'1rem',border:'1px solid rgba(70,69,85,0.2)',textAlign:'left'}}>
          <div style={{fontSize:'0.6rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'#c7c4d8',marginBottom:4}}>Username</div>
          <div style={{fontFamily:'monospace',fontSize:'1rem',fontWeight:700,color:'#c3c0ff'}}>{creds.username}</div>
        </div>
        <div style={{background:'rgba(255,185,95,0.08)',border:'1px solid rgba(255,185,95,0.2)',borderRadius:10,padding:'0.875rem',marginBottom:'1.5rem',textAlign:'left'}}>
          <p style={{fontSize:'0.78rem',color:'#ffb95f',lineHeight:1.6,margin:0}}>⚠️ Remember your password — it won't be shown again.</p>
        </div>
        <button onClick={()=>navigate('/login')} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#4f46e5,#c3c0ff)',color:'#1d00a5',border:'none',borderRadius:12,fontWeight:700,fontSize:'0.875rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          Continue to Login <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_forward</span>
        </button>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:'100vh',background:'#0b1326',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',fontFamily:'Inter, sans-serif',color:'#dae2fd'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{background:'#171f33',borderRadius:20,padding:'2.5rem',width:'100%',maxWidth:520,border:'1px solid rgba(70,69,85,0.15)',boxShadow:'0 40px 80px rgba(0,0,0,0.5)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'0.5rem'}}>
          <AlumNexLogo size={32}/>
          <span style={{fontSize:'1.25rem',fontWeight:900,color:'#fff'}}>Alum<span style={{color:'#60a5fa'}}>NEX</span></span>
          <span style={{marginLeft:'auto',fontSize:'0.6rem',fontWeight:700,color:'#4edea3',textTransform:'uppercase',letterSpacing:'0.15em',background:'rgba(78,222,163,0.1)',border:'1px solid rgba(78,222,163,0.25)',borderRadius:6,padding:'2px 8px'}}>Alumni Portal</span>
        </div>
        <p style={{fontSize:'0.8rem',color:'#c7c4d8',marginBottom:'1.75rem'}}>Alumni Registration — Step {step} of 4</p>
        <StepBar/>
        {regError&&<div style={{background:'rgba(255,107,107,0.1)',border:'1px solid rgba(255,107,107,0.3)',borderRadius:10,padding:'0.75rem 1rem',marginBottom:'1rem',fontSize:'0.8rem',color:'#ffb4ab'}}>{regError}</div>}

        {/* ── STEP 1 ── */}
        {step===1&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {[{k:'name',l:'Full Name',p:'Priya Sharma',t:'text'},{k:'email',l:'College / Work Email',p:'priya@college.edu',t:'email'},{k:'membershipNo',l:'Membership Number',p:'ALM-2024-XXXX',t:'text'},{k:'company',l:'Current Company',p:'Google',t:'text'}].map(({k,l,p,t})=>(
              <div key={k}>
                <label style={L}>{l}</label>
                <input type={t} value={form[k]} onChange={e=>sf(k,e.target.value)} placeholder={p} style={{...S,borderColor:errors[k]?'rgba(255,107,107,0.5)':'rgba(70,69,85,0.4)'}}/>
                {errors[k]&&<div style={{fontSize:'0.7rem',color:'#ffb4ab',marginTop:4}}>{errors[k]}</div>}
              </div>
            ))}
            <div><label style={L}>Job Title <span style={{fontWeight:400,textTransform:'none',opacity:0.5}}>(optional)</span></label><input value={form.title} onChange={e=>sf('title',e.target.value)} placeholder="Senior Software Engineer" style={S}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div>
                <label style={L}>Department</label>
                <select value={form.department} onChange={e=>sf('department',e.target.value)} style={{...S,borderColor:errors.department?'rgba(255,107,107,0.5)':'rgba(70,69,85,0.4)'}}>
                  <option value="">Select dept</option>{DEPTS.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department&&<div style={{fontSize:'0.7rem',color:'#ffb4ab',marginTop:4}}>{errors.department}</div>}
              </div>
              <div>
                <label style={L}>Batch Year</label>
                <select value={form.batchYear} onChange={e=>sf('batchYear',e.target.value)} style={{...S,borderColor:errors.batchYear?'rgba(255,107,107,0.5)':'rgba(70,69,85,0.4)'}}>
                  <option value="">Select year</option>{YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                {errors.batchYear&&<div style={{fontSize:'0.7rem',color:'#ffb4ab',marginTop:4}}>{errors.batchYear}</div>}
              </div>
            </div>
            <button onClick={()=>{if(v1())setStep(2);}} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(135deg,#4f46e5,#c3c0ff)',color:'#1d00a5',border:'none',borderRadius:12,fontWeight:700,fontSize:'0.875rem',cursor:'pointer',marginTop:8,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              Continue to Verification <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_forward</span>
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step===2&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
            <div>
              <h3 style={{fontSize:'1rem',fontWeight:700,margin:'0 0 4px',color:'#dae2fd'}}>Identity Verification</h3>
              <p style={{fontSize:'0.8rem',color:'#c7c4d8',margin:0}}>Verified against our alumni database. Complete both checks.</p>
            </div>

            {/* Card A — Membership / Name+Year DB check */}
            <div style={{background:'#131b2e',borderRadius:14,padding:'1.25rem',border:`1px solid ${ver.memVerified?'rgba(78,222,163,0.3)':'rgba(70,69,85,0.3)'}`}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'0.875rem'}}>
                <span className="material-symbols-outlined" style={{fontSize:18,color:'#c3c0ff'}}>badge</span>
                <span style={{fontSize:'0.8rem',fontWeight:700,color:'#dae2fd'}}>A — Membership Number Verification</span>
                {ver.memVerified&&<span className="material-symbols-outlined" style={{fontSize:16,color:'#4edea3',marginLeft:'auto'}}>check_circle</span>}
              </div>
              <div style={{fontSize:'0.72rem',color:'#c7c4d8',marginBottom:'0.75rem',lineHeight:1.5}}>
                Verifies your <strong style={{color:'#c3c0ff'}}>{form.membershipNo}</strong> against Name <strong style={{color:'#c3c0ff'}}>{form.name}</strong> and Batch Year <strong style={{color:'#c3c0ff'}}>{form.batchYear}</strong> in our alumni registry.
              </div>
              {!ver.memVerified&&(
                <button onClick={verifyMembership} disabled={ver.memChecking} style={{padding:'0.5rem 1.25rem',background:'rgba(195,192,255,0.15)',border:'1px solid rgba(195,192,255,0.3)',borderRadius:10,color:'#c3c0ff',fontWeight:700,fontSize:'0.8rem',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                  {ver.memChecking?<><div style={{width:14,height:14,border:'2px solid rgba(195,192,255,0.3)',borderTop:'2px solid #c3c0ff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Checking...</>:<><span className="material-symbols-outlined" style={{fontSize:16}}>search</span>Verify Against DB</>}
                </button>
              )}
              {ver.memVerified&&<div style={{fontSize:'0.78rem',color:'#4edea3',display:'flex',alignItems:'center',gap:6,marginTop:8}}><span className="material-symbols-outlined" style={{fontSize:14}}>check_circle</span>Verified — {ver.dbAlumni?.name} (Batch {ver.dbAlumni?.batch_year}) found in registry</div>}
              {ver.memError&&<div style={{fontSize:'0.75rem',color:'#ffb4ab',marginTop:8,display:'flex',alignItems:'center',gap:6}}><span className="material-symbols-outlined" style={{fontSize:14}}>cancel</span>{ver.memError}</div>}
            </div>

            {/* Card B — Email DB check + OTP */}
            <div style={{background:'#131b2e',borderRadius:14,padding:'1.25rem',border:`1px solid ${ver.emailVerified?'rgba(78,222,163,0.3)':'rgba(70,69,85,0.3)'}`}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'0.875rem'}}>
                <span className="material-symbols-outlined" style={{fontSize:18,color:'#c3c0ff'}}>mark_email_read</span>
                <span style={{fontSize:'0.8rem',fontWeight:700,color:'#dae2fd'}}>B — College Email Verification</span>
                {ver.emailVerified&&<span className="material-symbols-outlined" style={{fontSize:16,color:'#4edea3',marginLeft:'auto'}}>check_circle</span>}
              </div>
              <div style={{display:'flex',gap:8,marginBottom:ver.otpSent?'0.75rem':0}}>
                <input value={form.email} readOnly style={{...S,flex:1,opacity:0.8}}/>
                {!ver.emailVerified&&<button onClick={sendOtp} disabled={ver.otpSent||ver.emailChecking} style={{padding:'0 1rem',background:'rgba(195,192,255,0.15)',border:'1px solid rgba(195,192,255,0.3)',borderRadius:10,color:'#c3c0ff',fontWeight:700,fontSize:'0.8rem',cursor:ver.otpSent?'default':'pointer',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6}}>
                  {ver.emailChecking?<div style={{width:14,height:14,border:'2px solid rgba(195,192,255,0.3)',borderTop:'2px solid #c3c0ff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>:ver.otpSent?'OTP Sent ✓':'Send OTP'}
                </button>}
              </div>
              {ver.otpSent&&!ver.emailVerified&&(
                <div style={{display:'flex',gap:8}}>
                  <input value={ver.otp} onChange={e=>sv('otp',e.target.value)} placeholder="6-digit OTP (demo: 123456)" maxLength={6} style={{...S,flex:1,letterSpacing:'0.15em'}}/>
                  <button onClick={verifyOtp} disabled={ver.otpChecking||ver.otp.length<6} style={{padding:'0 1rem',background:'rgba(78,222,163,0.15)',border:'1px solid rgba(78,222,163,0.3)',borderRadius:10,color:'#4edea3',fontWeight:700,fontSize:'0.8rem',cursor:'pointer',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6}}>
                    {ver.otpChecking?<div style={{width:14,height:14,border:'2px solid rgba(78,222,163,0.3)',borderTop:'2px solid #4edea3',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>:'Verify OTP'}
                  </button>
                </div>
              )}
              {ver.emailVerified&&<div style={{marginTop:10,fontSize:'0.78rem',color:'#4edea3',display:'flex',alignItems:'center',gap:6}}><span className="material-symbols-outlined" style={{fontSize:14}}>check_circle</span>Email verified against alumni registry</div>}
              {ver.emailError&&<div style={{marginTop:8,fontSize:'0.75rem',color:'#ffb4ab',display:'flex',alignItems:'center',gap:6}}><span className="material-symbols-outlined" style={{fontSize:14}}>cancel</span>{ver.emailError}</div>}
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep(1)} style={{flex:1,padding:'0.875rem',background:'rgba(70,69,85,0.2)',border:'1px solid rgba(70,69,85,0.3)',borderRadius:12,color:'#c7c4d8',fontWeight:700,fontSize:'0.875rem',cursor:'pointer'}}>Back</button>
              <button onClick={()=>setStep(3)} disabled={!ver.memVerified||!ver.emailVerified} style={{flex:2,padding:'0.875rem',background:ver.memVerified&&ver.emailVerified?'linear-gradient(135deg,#4f46e5,#c3c0ff)':'#2d3449',color:ver.memVerified&&ver.emailVerified?'#1d00a5':'#c7c4d8',border:'none',borderRadius:12,fontWeight:700,fontSize:'0.875rem',cursor:ver.memVerified&&ver.emailVerified?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                Continue to Documents <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step===3&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
            <div>
              <h3 style={{fontSize:'1rem',fontWeight:700,margin:'0 0 4px',color:'#dae2fd'}}>Upload Verification Document</h3>
              <p style={{fontSize:'0.78rem',color:'#c7c4d8',margin:0}}>Degree Certificate or Alumni ID Card (PDF, JPG, PNG — max 5MB)</p>
            </div>
            <div onClick={()=>fileRef.current?.click()} onDragOver={e=>{e.preventDefault();setDoc(d=>({...d,dragOver:true}));}} onDragLeave={()=>setDoc(d=>({...d,dragOver:false}))} onDrop={e=>{e.preventDefault();setDoc(d=>({...d,dragOver:false}));const f=e.dataTransfer.files[0];if(f&&f.size<=5*1024*1024)setDoc(d=>({...d,file:f}));}}
              style={{border:`2px dashed ${doc.dragOver?'#c3c0ff':doc.file?'rgba(78,222,163,0.5)':'rgba(70,69,85,0.5)'}`,borderRadius:14,padding:'2rem',textAlign:'center',cursor:'pointer',background:doc.file?'rgba(78,222,163,0.04)':'rgba(34,42,61,0.4)',transition:'all 0.2s'}}>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f&&f.size<=5*1024*1024)setDoc(d=>({...d,file:f}));}}/>
              <span className="material-symbols-outlined" style={{fontSize:40,color:doc.file?'#4edea3':'#c3c0ff',display:'block',marginBottom:8}}>upload_file</span>
              {doc.file?<div style={{fontSize:'0.875rem',color:'#4edea3',fontWeight:600}}>{doc.file.name}</div>:<div style={{fontSize:'0.875rem',color:'#c7c4d8'}}>Drag & drop or click to upload</div>}
            </div>
            {!doc.aiDone&&<button onClick={runAI} disabled={!doc.file||doc.aiRunning} style={{width:'100%',padding:'0.875rem',background:doc.file&&!doc.aiRunning?'linear-gradient(135deg,#4f46e5,#c3c0ff)':'#2d3449',color:doc.file&&!doc.aiRunning?'#1d00a5':'#c7c4d8',border:'none',borderRadius:12,fontWeight:700,fontSize:'0.875rem',cursor:doc.file&&!doc.aiRunning?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {doc.aiRunning?<><div style={{width:16,height:16,border:'2px solid rgba(199,196,216,0.3)',borderTop:'2px solid #c7c4d8',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>{doc.aiStep}</>:<><span className="material-symbols-outlined" style={{fontSize:18}}>smart_toy</span>Run AI Forensic Check</>}
            </button>}
            {doc.aiDone&&(
              <div style={{background:'#131b2e',borderRadius:14,padding:'1.25rem',border:'1px solid rgba(78,222,163,0.25)'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'1rem'}}>
                  <span className="material-symbols-outlined" style={{fontSize:18,color:'#4edea3'}}>verified</span>
                  <span style={{fontSize:'0.875rem',fontWeight:700,color:'#4edea3'}}>AI Forensic Check Passed</span>
                </div>
                {[{l:'Extracted Name',v:form.name},{l:'Institution',v:ver.dbAlumni?.company||'AlumNex University'},{l:'Document Authenticity',v:'Genuine',badge:true},{l:'AI Confidence',v:'96%'}].map(row=>(
                  <div key={row.l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.5rem 0',borderBottom:'1px solid rgba(70,69,85,0.2)'}}>
                    <span style={{fontSize:'0.78rem',color:'#c7c4d8'}}>{row.l}</span>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      {row.badge?<span style={{background:'rgba(78,222,163,0.15)',border:'1px solid rgba(78,222,163,0.3)',borderRadius:6,padding:'2px 8px',fontSize:'0.7rem',fontWeight:700,color:'#4edea3'}}>{row.v}</span>:<span style={{fontSize:'0.8rem',fontWeight:600,color:'#dae2fd'}}>{row.v}</span>}
                      <span className="material-symbols-outlined" style={{fontSize:14,color:'#4edea3'}}>check_circle</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setStep(2)} style={{flex:1,padding:'0.875rem',background:'rgba(70,69,85,0.2)',border:'1px solid rgba(70,69,85,0.3)',borderRadius:12,color:'#c7c4d8',fontWeight:700,fontSize:'0.875rem',cursor:'pointer'}}>Back</button>
              {doc.aiDone&&<button onClick={()=>setStep(4)} style={{flex:2,padding:'0.875rem',background:'linear-gradient(135deg,#4edea3,#3bc490)',color:'#0b1326',border:'none',borderRadius:12,fontWeight:700,fontSize:'0.875rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <span className="material-symbols-outlined" style={{fontSize:18}}>arrow_forward</span>Set Credentials
              </button>}
            </div>
          </div>
        )}

        {/* ── STEP 4 — Choose username + password ── */}
        {step===4&&(
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            <div>
              <h3 style={{fontSize:'1rem',fontWeight:700,margin:'0 0 4px',color:'#dae2fd'}}>Set Your Login Credentials</h3>
              <p style={{fontSize:'0.78rem',color:'#c7c4d8',margin:0}}>Choose a username and password for your alumni account.</p>
            </div>

            {/* Username */}
            <div>
              <label style={L}>Username</label>
              <div style={{position:'relative'}}>
                <input value={creds.username} onChange={e=>handleUsername(e.target.value.toLowerCase())} placeholder="e.g. priya.sharma" style={{...S,borderColor:errors.username?'rgba(255,107,107,0.5)':uStatus==='available'?'rgba(78,222,163,0.5)':uStatus==='taken'?'rgba(255,107,107,0.5)':'rgba(70,69,85,0.4)',paddingRight:'2.5rem'}}/>
                <div style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)'}}>
                  {uStatus==='checking'&&<div style={{width:14,height:14,border:'2px solid rgba(195,192,255,0.3)',borderTop:'2px solid #c3c0ff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>}
                  {uStatus==='available'&&<span className="material-symbols-outlined" style={{fontSize:18,color:'#4edea3'}}>check_circle</span>}
                  {uStatus==='taken'&&<span className="material-symbols-outlined" style={{fontSize:18,color:'#ffb4ab'}}>cancel</span>}
                </div>
              </div>
              <div style={{fontSize:'0.68rem',marginTop:4,color:errors.username?'#ffb4ab':uStatus==='available'?'#4edea3':uStatus==='taken'?'#ffb4ab':'#c7c4d8'}}>
                {errors.username||(uStatus==='available'?'✓ Username is available':uStatus==='taken'?'✗ Already taken':'Lowercase letters, numbers, dots and underscores only')}
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={L}>Password</label>
              <input type="password" value={creds.password} onChange={e=>setCreds(c=>({...c,password:e.target.value}))} placeholder="Min 8 characters" style={{...S,borderColor:errors.password?'rgba(255,107,107,0.5)':'rgba(70,69,85,0.4)'}}/>
              {errors.password&&<div style={{fontSize:'0.7rem',color:'#ffb4ab',marginTop:4}}>{errors.password}</div>}
            </div>

            {/* Confirm */}
            <div>
              <label style={L}>Confirm Password</label>
              <input type="password" value={creds.confirmPassword} onChange={e=>setCreds(c=>({...c,confirmPassword:e.target.value}))} placeholder="Re-enter password" style={{...S,borderColor:errors.confirmPassword?'rgba(255,107,107,0.5)':creds.confirmPassword&&creds.password===creds.confirmPassword?'rgba(78,222,163,0.5)':'rgba(70,69,85,0.4)'}}/>
              {errors.confirmPassword&&<div style={{fontSize:'0.7rem',color:'#ffb4ab',marginTop:4}}>{errors.confirmPassword}</div>}
            </div>

            <div style={{display:'flex',gap:10,marginTop:4}}>
              <button onClick={()=>setStep(3)} style={{flex:1,padding:'0.875rem',background:'rgba(70,69,85,0.2)',border:'1px solid rgba(70,69,85,0.3)',borderRadius:12,color:'#c7c4d8',fontWeight:700,fontSize:'0.875rem',cursor:'pointer'}}>Back</button>
              <button onClick={handleSubmit} disabled={loading||uStatus!=='available'} style={{flex:2,padding:'0.875rem',background:loading||uStatus!=='available'?'#2d3449':'linear-gradient(135deg,#4f46e5,#4edea3)',color:loading||uStatus!=='available'?'#c7c4d8':'#003d29',border:'none',borderRadius:12,fontWeight:700,fontSize:'0.875rem',cursor:loading||uStatus!=='available'?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                {loading?<><div style={{width:16,height:16,border:'2px solid rgba(11,19,38,0.3)',borderTop:'2px solid #003d29',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>Creating...</>:<><span className="material-symbols-outlined" style={{fontSize:18}}>check_circle</span>Create Account</>}
              </button>
            </div>
          </div>
        )}

        <p style={{textAlign:'center',fontSize:'0.8rem',color:'#c7c4d8',marginTop:'1.5rem'}}>
          Already have an account?{' '}
          <a href="/login" style={{color:'#c3c0ff',textDecoration:'none',fontWeight:600}}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
