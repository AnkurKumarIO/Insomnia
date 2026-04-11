import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { sendRequest, getRequestsByStudent } from '../interviewRequests';

// Each alumni has explicit fields for accurate filtering
const ALL_ALUMNI = [
  {
    name: 'Sarah Chen', title: 'Senior Product Manager', company: 'Google',
    experience: '8 years', expRange: '5-10 Years',
    score: 98, scoreColor: '#4edea3',
    tags: ['Strategy', 'Growth', 'AI/ML', 'Product Management'],
    bio: 'Expert in scaling AI consumer products from 0 to 1. Mentoring early-stage founders and product enthusiasts.',
  },
  {
    name: 'David Miller', title: 'Engineering Director', company: 'Stripe',
    experience: '12 years', expRange: '10+ Years',
    score: 85, scoreColor: '#ffb95f',
    tags: ['Fintech', 'Architecture', 'Leadership', 'Engineering'],
    bio: 'Passionate about building resilient engineering cultures and complex fintech infrastructure systems.',
  },
  {
    name: 'Elena Rodriguez', title: 'Design Lead', company: 'Airbnb',
    experience: '7 years', expRange: '5-10 Years',
    score: 92, scoreColor: '#4edea3',
    tags: ['UX Research', 'UI Systems', 'Storytelling', 'Design'],
    bio: 'Focusing on emotional design and systemic UX. Helping designers bridge the gap between UI and UX.',
  },
  {
    name: 'Marcus Thorne', title: 'Founder & CEO', company: 'Stealth Startup',
    experience: '9 years', expRange: '5-10 Years',
    score: 79, scoreColor: '#4edea3',
    tags: ['Venture Capital', 'Sustainability', 'Fundraising', 'Engineering'],
    bio: 'Serial entrepreneur with a focus on sustainable energy tech. Helping alumni navigate the startup ecosystem.',
  },
  {
    name: 'Jasmine Patel', title: 'Senior Data Scientist', company: 'Meta',
    experience: '6 years', expRange: '5-10 Years',
    score: 94, scoreColor: '#4edea3',
    tags: ['Python', 'Big Data', 'Algorithms', 'Data Science'],
    bio: 'Specializing in large scale recommendation engines. Happy to discuss careers in Data Science and ML.',
  },
  {
    name: 'Robert Vance', title: 'VP of Operations', company: 'Amazon',
    experience: '14 years', expRange: '10+ Years',
    score: 88, scoreColor: '#ffb95f',
    tags: ['Logistics', 'Scaling', 'Operations', 'Engineering'],
    bio: 'Decade of experience in logistics and supply chain optimization. Mentoring for leadership roles in ops.',
  },
  {
    name: 'Aisha Okonkwo', title: 'ML Engineer', company: 'DeepMind',
    experience: '4 years', expRange: '1-5 Years',
    score: 96, scoreColor: '#4edea3',
    tags: ['AI Research', 'PyTorch', 'NLP', 'Data Science'],
    bio: 'Working on large language model alignment. Passionate about responsible AI and mentoring underrepresented talent.',
  },
  {
    name: 'Carlos Mendez', title: 'Staff Software Engineer', company: 'Netflix',
    experience: '11 years', expRange: '10+ Years',
    score: 91, scoreColor: '#4edea3',
    tags: ['Distributed Systems', 'Java', 'Scale', 'Engineering'],
    bio: 'Built streaming infrastructure serving 200M+ users. Loves helping engineers navigate senior IC career paths.',
  },
  {
    name: 'Priya Nair', title: 'Product Director', company: 'Figma',
    experience: '8 years', expRange: '5-10 Years',
    score: 89, scoreColor: '#ffb95f',
    tags: ['Design Systems', 'B2B', 'PLG', 'Product Management'],
    bio: "Led Figma's enterprise product expansion. Mentoring PMs transitioning from engineering backgrounds.",
  },
  {
    name: 'James Liu', title: 'Software Engineer II', company: 'Google',
    experience: '3 years', expRange: '1-5 Years',
    score: 82, scoreColor: '#4edea3',
    tags: ['Frontend', 'React', 'TypeScript', 'Engineering'],
    bio: 'Working on Google Search infrastructure. Loves helping new grads crack FAANG interviews.',
  },
  {
    name: 'Neha Kapoor', title: 'Product Manager', company: 'Microsoft',
    experience: '5 years', expRange: '5-10 Years',
    score: 87, scoreColor: '#4edea3',
    tags: ['Product Management', 'B2B SaaS', 'Roadmapping'],
    bio: 'PM on Microsoft Teams. Specializes in enterprise product strategy and stakeholder management.',
  },
  {
    name: 'Ravi Shankar', title: 'Backend Engineer', company: 'Uber',
    experience: '6 years', expRange: '5-10 Years',
    score: 83, scoreColor: '#ffb95f',
    tags: ['Go', 'Microservices', 'Engineering', 'System Design'],
    bio: 'Building real-time dispatch systems at Uber. Passionate about distributed systems and mentoring junior engineers.',
  },
];

// Derive filter options dynamically from data
const ALL_COMPANIES   = [...new Set(ALL_ALUMNI.map(a => a.company))].sort();
const ALL_ROLES       = [...new Set(ALL_ALUMNI.map(a => {
  if (a.tags.includes('Product Management')) return 'Product Management';
  if (a.tags.includes('Data Science'))       return 'Data Science';
  if (a.tags.includes('Design'))             return 'Design';
  if (a.tags.includes('Engineering'))        return 'Engineering';
  return 'Other';
}))].filter((v, i, a) => a.indexOf(v) === i).sort();
const EXP_RANGES = ['1-5 Years', '5-10 Years', '10+ Years'];

const TOPICS = [
  'Mock Interview – General', 'Mock Interview – System Design',
  'Mock Interview – Frontend', 'Mock Interview – Backend',
  'Mock Interview – Data Science', 'Career Guidance', 'Resume Review', 'Salary Negotiation',
];

// ── Book Request Modal ────────────────────────────────────────────────────────
function BookModal({ alumni, studentName, onClose, onSent }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    sendRequest({ studentName, studentId: studentName, alumniName: alumni.name, alumniRole: `${alumni.title} • ${alumni.company}`, topic, message });
    setSent(true);
    setTimeout(() => { onSent(); onClose(); }, 1800);
  };

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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.5rem' }}>
              {alumni.tags.map(t => <span key={t} style={{ padding: '0.2rem 0.6rem', background: '#222a3d', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600, color: '#c7c4d8' }}>{t}</span>)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Session Type</label>
                <select value={topic} onChange={e => setTopic(e.target.value)} style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.65rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}>
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Message <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={`Hi ${alumni.name.split(' ')[0]}, I'd love to practice ${topic.toLowerCase()} with you...`} rows={3} style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.65rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
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
      <button onClick={onBook} style={{ width: '100%', padding: '0.6rem', background: 'rgba(79,70,229,0.15)', color: '#c3c0ff', border: '1px solid rgba(195,192,255,0.15)', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {existing?.status === 'declined' ? 'Request Again' : 'Book Mock Interview'}
      </button>
    );
  }
  if (existing.status === 'pending') {
    return (
      <div style={{ width: '100%', padding: '0.6rem', background: 'rgba(255,185,95,0.1)', border: '1px solid rgba(255,185,95,0.25)', borderRadius: 10, textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>⏳ Request Pending</div>
        <div style={{ fontSize: '0.7rem', color: '#c7c4d8' }}>Waiting for {alumni.name.split(' ')[0]} to accept</div>
      </div>
    );
  }
  if (existing.status === 'accepted') {
    const canJoin = Date.now() >= new Date(existing.scheduledTime).getTime() - 5 * 60 * 1000;
    if (canJoin) {
      return (
        <a href={`/interview/${existing.roomId}`} style={{ width: '100%', padding: '0.6rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', border: 'none', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', boxSizing: 'border-box' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>videocam</span> Join Mock Interview
        </a>
      );
    }
    const formatted = new Date(existing.scheduledTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return (
      <div style={{ width: '100%', padding: '0.6rem', background: 'rgba(78,222,163,0.08)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 10, textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>✓ Scheduled</div>
        <div style={{ fontSize: '0.7rem', color: '#dae2fd', fontWeight: 600 }}>{formatted}</div>
      </div>
    );
  }
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AlumniDiscovery({ searchQuery = '' }) {
  const { user } = useContext(AuthContext);
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter]       = useState('');
  const [expFilter, setExpFilter]         = useState('');
  const [visibleCount, setVisibleCount]   = useState(6);
  const [bookingAlumni, setBookingAlumni] = useState(null);
  const [refreshKey, setRefreshKey]       = useState(0);

  const q = searchQuery.toLowerCase().trim();

  React.useEffect(() => { setVisibleCount(6); }, [searchQuery, companyFilter, roleFilter, expFilter]);

  const filteredAlumni = ALL_ALUMNI.filter(a => {
    const matchesSearch = !q ||
      a.name.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q)) ||
      a.bio.toLowerCase().includes(q);

    const matchesCompany = !companyFilter || a.company === companyFilter;
    const matchesRole    = !roleFilter    || a.tags.some(t => t.toLowerCase().includes(roleFilter.toLowerCase())) || a.title.toLowerCase().includes(roleFilter.toLowerCase());
    const matchesExp     = !expFilter     || a.expRange === expFilter;

    return matchesSearch && matchesCompany && matchesRole && matchesExp;
  });

  const visibleAlumni = filteredAlumni.slice(0, visibleCount);
  const studentName   = user?.name || 'Student';
  const hasFilters    = companyFilter || roleFilter || expFilter;

  const clearAll = () => { setCompanyFilter(''); setRoleFilter(''); setExpFilter(''); };

  const selStyle = (active) => ({
    padding: '0.4rem 0.875rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
    background: active ? 'rgba(195,192,255,0.18)' : '#171f33',
    color: active ? '#c3c0ff' : '#c7c4d8',
    outline: active ? '1px solid rgba(195,192,255,0.35)' : 'none',
  });

  return (
    <div key={refreshKey}>
      {bookingAlumni && (
        <BookModal alumni={bookingAlumni} studentName={studentName} onClose={() => setBookingAlumni(null)} onSent={() => setRefreshKey(k => k + 1)} />
      )}

      {/* ── Filter bar ── */}
      <div style={{ background: '#131b2e', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(70,69,85,0.15)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* Company filter */}
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c7c4d8', marginBottom: 8 }}>Company</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_COMPANIES.map(c => (
                <button key={c} onClick={() => setCompanyFilter(companyFilter === c ? '' : c)} style={selStyle(companyFilter === c)}>{c}</button>
              ))}
            </div>
          </div>

          {/* Role filter */}
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c7c4d8', marginBottom: 8 }}>Role</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_ROLES.map(r => (
                <button key={r} onClick={() => setRoleFilter(roleFilter === r ? '' : r)} style={selStyle(roleFilter === r)}>{r}</button>
              ))}
            </div>
          </div>

          {/* Experience filter */}
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c7c4d8', marginBottom: 8 }}>Experience</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {EXP_RANGES.map(e => (
                <button key={e} onClick={() => setExpFilter(expFilter === e ? '' : e)} style={selStyle(expFilter === e)}>{e}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filters + count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(70,69,85,0.15)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[companyFilter, roleFilter, expFilter].filter(Boolean).map(f => (
              <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.2rem 0.6rem', background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.25)', borderRadius: 999, fontSize: '0.72rem', color: '#4edea3' }}>
                {f}
                <button onClick={() => { if (f === companyFilter) setCompanyFilter(''); else if (f === roleFilter) setRoleFilter(''); else setExpFilter(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4edea3', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
              </span>
            ))}
            {hasFilters && <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c3c0ff', fontSize: '0.72rem', fontWeight: 600 }}>Clear all</button>}
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8' }}>{filteredAlumni.length} Alumni Found</span>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.5rem' }}>
        {visibleAlumni.map((a) => (
          <div key={a.name} style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid transparent', transition: 'all 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(195,192,255,0.15)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#222a3d,#2d3449)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#c3c0ff' }}>{a.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>{a.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#c7c4d8' }}>{a.title}</div>
                  <div style={{ fontSize: '0.72rem', color: a.scoreColor, fontWeight: 600, marginTop: 1 }}>{a.company} • {a.experience}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: a.scoreColor, marginBottom: 2 }}>Impact</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: a.scoreColor }}>{a.score}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6, marginBottom: '1rem' }}>{a.bio}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1rem' }}>
              {a.tags.map(t => <span key={t} style={{ padding: '0.2rem 0.6rem', background: '#222a3d', borderRadius: 6, fontSize: '0.65rem', fontWeight: 600, color: '#c7c4d8' }}>{t}</span>)}
            </div>
            <div style={{ height: 4, background: '#2d3449', borderRadius: 999, overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ height: '100%', width: `${a.score}%`, background: `linear-gradient(90deg,#4f46e5,${a.scoreColor})`, borderRadius: 999 }} />
            </div>
            <BookButton alumni={a} studentName={studentName} onBook={() => setBookingAlumni(a)} />
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <p style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>
          Showing <strong style={{ color: '#dae2fd' }}>{visibleAlumni.length}</strong> of <strong style={{ color: '#dae2fd' }}>{filteredAlumni.length}</strong> alumni
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          {visibleCount < filteredAlumni.length && (
            <button onClick={() => setVisibleCount(c => Math.min(c + 3, filteredAlumni.length))}
              style={{ padding: '0.75rem 3rem', background: '#131b2e', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 12, color: '#c3c0ff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
              Show More ({filteredAlumni.length - visibleCount} remaining)
            </button>
          )}
          {visibleCount > 6 && (
            <button onClick={() => setVisibleCount(6)} style={{ padding: '0.75rem 2rem', background: 'transparent', border: '1px solid rgba(70,69,85,0.2)', borderRadius: 12, color: '#c7c4d8', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              Show Less
            </button>
          )}
        </div>
        {filteredAlumni.length === 0 && (
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
