import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { sendRequest, getRequestsByStudent } from '../interviewRequests';
import { getAllAlumni } from '../lib/db';

const TOPICS = [
  'Mock Interview – General','Mock Interview – System Design','Mock Interview – Frontend',
  'Mock Interview – Backend','Mock Interview – Data Science','Career Guidance','Resume Review','Salary Negotiation',
];

// ── Map Supabase row → display shape ─────────────────────────────────────────
function toDisplay(u) {
  const p = u.profile_data || {};
  const yrs = u.batch_year ? new Date().getFullYear() - u.batch_year : null;
  const expRange = !yrs ? '0-2 Years' : yrs <= 2 ? '0-2 Years' : yrs <= 5 ? '3-5 Years' : yrs <= 10 ? '6-10 Years' : '10+ Years';
  const skills = p.skills || [];
  const domain = skills.length > 0 ? skills[0] : (u.department || 'Engineering');
  return {
    id: u.id,
    name: u.name,
    company: u.company || 'Alumni',
    department: u.department || '',
    batch_year: u.batch_year,
    title: p.title || (u.company ? `Alumni at ${u.company}` : 'Alumni'),
    role: `${p.title || 'Alumni'} • ${u.company || ''}`,
    experience: yrs ? `${yrs} yr${yrs !== 1 ? 's' : ''}` : '',
    expRange,
    domain,
    bio: p.bio || '',
    tags: skills.slice(0, 5),
    linkedin: p.linkedin || '',
    github: p.github || '',
    score: Math.min(99, 70 + (skills.length * 3) + (yrs || 0)),
    scoreColor: yrs >= 8 ? '#ffb95f' : '#4edea3',
  };
}

// ── Fallback mock data (matches Supabase alumni) ──────────────────────────────
const MOCK = [
  { id:'alm-priya-sharma',  name:'Priya Sharma',  company:'Google',    batch_year:2019, department:'Computer Science',       profile_data:{ title:'Senior SWE',        skills:['System Design','Go','Python','Kubernetes'],  bio:'Senior Software Engineer at Google. Love mentoring on system design and FAANG interviews.' } },
  { id:'alm-rahul-verma',   name:'Rahul Verma',   company:'Microsoft', batch_year:2018, department:'Electrical Engineering', profile_data:{ title:'Principal Engineer', skills:['Azure','DevOps','C#','.NET','Terraform'],    bio:'Principal Engineer at Microsoft Azure. Specialise in cloud infrastructure and DevOps.' } },
  { id:'alm-ananya-iyer',   name:'Ananya Iyer',   company:'Stripe',    batch_year:2020, department:'Computer Science',       profile_data:{ title:'Full Stack Engineer',skills:['React','TypeScript','Node.js','GraphQL'],     bio:'Full Stack Engineer at Stripe working on payment infrastructure.' } },
  { id:'alm-karan-mehta',   name:'Karan Mehta',   company:'Amazon',    batch_year:2017, department:'Information Technology', profile_data:{ title:'Engineering Manager',skills:['Leadership','System Design','Java','AWS'],     bio:'Engineering Manager at Amazon. 7 years scaling teams and systems.' } },
  { id:'alm-sneha-patel',   name:'Sneha Patel',   company:'Atlassian', batch_year:2021, department:'Computer Science',       profile_data:{ title:'Product Engineer',  skills:['React','JavaScript','Figma','REST APIs'],    bio:'Product Engineer at Atlassian working on Jira. Great at internship prep.' } },
  { id:'alm-arjun-nair',    name:'Arjun Nair',    company:'Uber',      batch_year:2016, department:'Electronics & Communication', profile_data:{ title:'Staff Engineer', skills:['C++','Python','Kafka','Spark','DSA'],       bio:'Staff Engineer at Uber Maps. Expert in geospatial systems and DSA coaching.' } },
];


// ── Book Request Modal ────────────────────────────────────────────────────────
function BookModal({ alumni, studentName, onClose, onSent }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    const authUser = JSON.parse(localStorage.getItem('alumnex_user') || localStorage.getItem('alumniconnect_user') || '{}');
    sendRequest({
      studentName,
      studentId: authUser.id || studentName,
      alumniName: alumni.name,
      alumniId: alumni.id,
      alumniRole: alumni.role,
      topic,
      message,
    });
    setSent(true);
    setTimeout(() => { onSent(); onClose(); }, 1800);
  };

  const inp = { width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.65rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 480, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ fontWeight: 700, color: '#4edea3', marginBottom: 8 }}>Request Sent!</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Your request has been sent to <strong style={{ color: '#dae2fd' }}>{alumni.name}</strong>.<br />You'll see the scheduled time once they accept.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Book Mock Interview</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dae2fd' }}>{alumni.name}</h3>
                <p style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2 }}>{alumni.title} • {alumni.company}</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8', padding: 4 }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {alumni.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.5rem' }}>
                {alumni.tags.map(t => <span key={t} style={{ padding: '0.2rem 0.6rem', background: '#222a3d', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600, color: '#c7c4d8' }}>{t}</span>)}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Session Type</label>
                <select value={topic} onChange={e => setTopic(e.target.value)} style={inp}>
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Message <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={`Hi ${alumni.name.split(' ')[0]}, I'd love to practice ${topic.toLowerCase()} with you...`} rows={3} style={{ ...inp, resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSend} style={{ flex: 2, padding: '0.75rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span> Send Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Book Button ───────────────────────────────────────────────────────────────
function BookButton({ alumni, studentName, onBook }) {
  const myRequests = getRequestsByStudent(studentName);
  const existing = myRequests.find(r => r.alumniName === alumni.name);

  if (!existing || existing.status === 'declined') {
    return (
      <button onClick={onBook} style={{ width: '100%', padding: '0.6rem', background: existing?.status === 'declined' ? 'rgba(255,180,171,0.1)' : 'rgba(79,70,229,0.15)', color: existing?.status === 'declined' ? '#ffb4ab' : '#c3c0ff', border: `1px solid ${existing?.status === 'declined' ? 'rgba(255,180,171,0.3)' : 'rgba(195,192,255,0.15)'}`, borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {existing?.status === 'declined' ? <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>Send Again</> : <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>send</span>Book Mock Interview</>}
      </button>
    );
  }
  if (existing.status === 'pending') return (
    <div style={{ width: '100%', padding: '0.6rem', background: 'rgba(255,185,95,0.1)', border: '1px solid rgba(255,185,95,0.25)', borderRadius: 10, textAlign: 'center' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>⏳ Request Pending</div>
      <div style={{ fontSize: '0.7rem', color: '#c7c4d8' }}>Waiting for {alumni.name.split(' ')[0]} to accept</div>
    </div>
  );
  if (existing.status === 'accepted') return (
    <div style={{ width: '100%', padding: '0.6rem', background: 'rgba(195,192,255,0.08)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 10, textAlign: 'center' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>✓ Accepted</div>
      <div style={{ fontSize: '0.7rem', color: '#c7c4d8' }}>Alumni is selecting a time slot...</div>
    </div>
  );
  if (existing.status === 'slot_booked') {
    const canJoin = Date.now() >= new Date(existing.scheduledTime).getTime() - 5 * 60 * 1000;
    if (canJoin) return (
      <a href={`/interview/${existing.roomId}`} style={{ width: '100%', padding: '0.6rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', border: 'none', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', boxSizing: 'border-box' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>videocam</span>Join Mock Interview
      </a>
    );
    const formatted = new Date(existing.scheduledTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return (
      <div style={{ width: '100%', padding: '0.6rem', background: 'rgba(78,222,163,0.08)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 10, textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>📅 Scheduled</div>
        <div style={{ fontSize: '0.75rem', color: '#dae2fd', fontWeight: 700 }}>{formatted}</div>
        <div style={{ fontSize: '0.65rem', color: '#c7c4d8', marginTop: 2 }}>Join button activates 5 min before</div>
      </div>
    );
  }
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AlumniDiscovery({ searchQuery = '' }) {
  const { user } = useContext(AuthContext);
  const [allAlumni, setAllAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState('');
  const [expFilter, setExpFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [bookingAlumni, setBookingAlumni] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    getAllAlumni().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setAllAlumni(data.map(toDisplay));
      } else {
        setAllAlumni(MOCK.map(toDisplay));
      }
      setLoading(false);
    }).catch(() => { setAllAlumni(MOCK.map(toDisplay)); setLoading(false); });
  }, []);

  // Build filter options from actual data
  const companies = [...new Set(allAlumni.map(a => a.company).filter(Boolean))].sort();
  const expRanges = ['0-2 Years', '3-5 Years', '6-10 Years', '10+ Years'];
  const domains = [...new Set(allAlumni.flatMap(a => a.tags).filter(Boolean))].sort().slice(0, 12);

  const q = searchQuery.toLowerCase().trim();
  React.useEffect(() => { setVisibleCount(6); }, [searchQuery, companyFilter, expFilter, domainFilter]);

  const filtered = allAlumni.filter(a => {
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.company.toLowerCase().includes(q) || a.bio.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q));
    const matchCompany = !companyFilter || a.company === companyFilter;
    const matchExp = !expFilter || a.expRange === expFilter;
    const matchDomain = !domainFilter || a.tags.some(t => t.toLowerCase().includes(domainFilter.toLowerCase())) || a.domain.toLowerCase().includes(domainFilter.toLowerCase());
    return matchSearch && matchCompany && matchExp && matchDomain;
  });

  const visible = filtered.slice(0, visibleCount);
  const studentName = user?.name || 'Student';
  const hasFilters = companyFilter || expFilter || domainFilter;

  const selStyle = (active) => ({
    padding: '0.35rem 0.875rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    background: active ? 'rgba(195,192,255,0.18)' : '#171f33',
    color: active ? '#c3c0ff' : '#c7c4d8',
    outline: active ? '1px solid rgba(195,192,255,0.35)' : 'none',
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#c7c4d8', gap: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 28, opacity: 0.4, animation: 'spin 1s linear infinite' }}>progress_activity</span>
      Loading alumni...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div key={refreshKey}>
      {bookingAlumni && <BookModal alumni={bookingAlumni} studentName={studentName} onClose={() => setBookingAlumni(null)} onSent={() => setRefreshKey(k => k + 1)} />}

      {/* ── Filter bar ── */}
      <div style={{ background: '#131b2e', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(70,69,85,0.15)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Company */}
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c7c4d8', marginBottom: 8 }}>Company</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {companies.map(c => <button key={c} onClick={() => setCompanyFilter(companyFilter === c ? '' : c)} style={selStyle(companyFilter === c)}>{c}</button>)}
            </div>
          </div>
          {/* Experience */}
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c7c4d8', marginBottom: 8 }}>Experience</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {expRanges.map(e => <button key={e} onClick={() => setExpFilter(expFilter === e ? '' : e)} style={selStyle(expFilter === e)}>{e}</button>)}
            </div>
          </div>
          {/* Domain / Skills */}
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c7c4d8', marginBottom: 8 }}>Domain / Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {domains.map(d => <button key={d} onClick={() => setDomainFilter(domainFilter === d ? '' : d)} style={selStyle(domainFilter === d)}>{d}</button>)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(70,69,85,0.15)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[companyFilter, expFilter, domainFilter].filter(Boolean).map(f => (
              <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.2rem 0.6rem', background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.25)', borderRadius: 999, fontSize: '0.72rem', color: '#4edea3' }}>
                {f}
                <button onClick={() => { if (f === companyFilter) setCompanyFilter(''); else if (f === expFilter) setExpFilter(''); else setDomainFilter(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4edea3', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
              </span>
            ))}
            {hasFilters && <button onClick={() => { setCompanyFilter(''); setExpFilter(''); setDomainFilter(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c3c0ff', fontSize: '0.72rem', fontWeight: 600 }}>Clear all</button>}
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{filtered.length} Alumni Found</span>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5rem' }}>
        {visible.map(a => (
          <div key={a.id || a.name} style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid transparent', transition: 'all 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(195,192,255,0.15)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#222a3d,#2d3449)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#c3c0ff' }}>{a.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>{a.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#c7c4d8' }}>{a.title}</div>
                  <div style={{ fontSize: '0.72rem', color: a.scoreColor, fontWeight: 600, marginTop: 1 }}>{a.company}{a.experience ? ` • ${a.experience}` : ''}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: a.scoreColor, marginBottom: 2 }}>Impact</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: a.scoreColor }}>{a.score}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6, marginBottom: '1rem' }}>{a.bio}</p>
            {a.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1rem' }}>
                {a.tags.map(t => <span key={t} style={{ padding: '0.2rem 0.6rem', background: '#222a3d', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600, color: '#c7c4d8' }}>{t}</span>)}
              </div>
            )}
            <div style={{ height: 4, background: '#2d3449', borderRadius: 999, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ height: '100%', width: `${a.score}%`, background: `linear-gradient(90deg,#4f46e5,${a.scoreColor})`, borderRadius: 999 }} />
            </div>
            <BookButton alumni={a} studentName={studentName} onBook={() => setBookingAlumni(a)} />
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <p style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>Showing <strong style={{ color: '#dae2fd' }}>{visible.length}</strong> of <strong style={{ color: '#dae2fd' }}>{filtered.length}</strong> alumni</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {visibleCount < filtered.length && (
            <button onClick={() => setVisibleCount(c => Math.min(c + 3, filtered.length))} style={{ padding: '0.75rem 3rem', background: '#131b2e', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 12, color: '#c3c0ff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>Show More ({filtered.length - visibleCount} remaining)
            </button>
          )}
          {visibleCount > 6 && <button onClick={() => setVisibleCount(6)} style={{ padding: '0.75rem 2rem', background: 'transparent', border: '1px solid rgba(70,69,85,0.2)', borderRadius: 12, color: '#c7c4d8', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Show Less</button>}
        </div>
        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#c7c4d8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }}>search_off</span>
            <p style={{ fontWeight: 600 }}>No alumni found</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 4 }}>Try different filters or clear all</p>
          </div>
        )}
      </div>
    </div>
  );
}
