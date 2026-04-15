const fs = require('fs');
const file = 'frontend/src/DualAgentInterviewRoom.jsx';
let text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// ── 1. Add isInterviewer detection after myId is set ─────────────────────────
const ROLE_OLD = `  const myId = myIdRef.current;

  // UI State`;

const ROLE_NEW = `  const myId = myIdRef.current;

  // Role: alumni = interviewer, student = candidate
  const isInterviewer = user?.role === 'ALUMNI' || searchParams.get('role') === 'alumni';

  // UI State`;

text = text.replace(ROLE_OLD, ROLE_NEW);

// ── 2. Add rating state after analytics state ─────────────────────────────────
const STATE_OLD = `  const [ended,             setEnded]             = useState(false);
  const [analytics,         setAnalytics]         = useState(null);`;

const STATE_NEW = `  const [ended,             setEnded]             = useState(false);
  const [analytics,         setAnalytics]         = useState(null);
  const [rating,            setRating]            = useState(0);
  const [ratingFeedback,    setRatingFeedback]    = useState('');
  const [ratingSubmitted,   setRatingSubmitted]   = useState(false);`;

text = text.replace(STATE_OLD, STATE_NEW);

// ── 3. Add chat scroll useEffect after chatEndRef declaration ─────────────────
const CHATREF_OLD = `  const chatEndRef      = useRef(null);`;
const CHATREF_NEW = `  const chatEndRef      = useRef(null);`;
// Already exists — add scroll effect after the big useEffect block
// Find the sendChat function and add useEffect before it
const SENDCHAT_OLD = `  const sendChat = () => {`;
const SENDCHAT_NEW = `  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChat = () => {`;
text = text.replace(SENDCHAT_OLD, SENDCHAT_NEW);

// ── 4. Remove People tab from side panel tabs ─────────────────────────────────
const TABS_OLD = `{[['ai','auto_awesome','AI'],['chat','chat_bubble','Chat'],['participants','group','People']].map(([tab,icon,label])=>(`;
const TABS_NEW = `{[['ai','auto_awesome','AI'],['chat','chat_bubble','Chat']].map(([tab,icon,label])=>(`;
text = text.replace(TABS_OLD, TABS_NEW);

// ── 5. Remove participants panel JSX ─────────────────────────────────────────
const PARTICIPANTS_OLD = `          {/* Participants panel */}
          {sidePanel === 'participants' && (
            <div style={{ flex:1, padding:'1rem', overflowY:'auto' }}>
              <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(199,196,216,0.4)', marginBottom:'1rem' }}>In this room</div>
              {[{name:myId,role:'You',color:'#c3c0ff',online:true},{name:peerName,role:'Peer',color:'#4edea3',online:peerConnected},{name:'AI Whisperer',role:'AI Agent',color:'#ffb95f',online:true}].map((p,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'0.75rem', background:'#171f33', borderRadius:10, marginBottom:8, border:'1px solid rgba(70,69,85,0.15)', opacity: p.online ? 1 : 0.45 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:\`linear-gradient(135deg,\${p.color}40,\${p.color}20)\`, border:\`1px solid \${p.color}40\`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', fontWeight:700, color:p.color, flexShrink:0 }}>{p.name[0]?.toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{p.name}</div>
                    <div style={{ fontSize:'0.65rem', color:'#c7c4d8' }}>{p.role}</div>
                  </div>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: p.online ? '#4edea3' : '#464555' }} />
                </div>
              ))}
            </div>
          )}`;
text = text.replace(PARTICIPANTS_OLD, '');

// ── 6. Wrap confidence overlay to show only for student (candidate) ───────────
const CONF_OLD = `              {/* Live metrics overlay ... existing */}
              <div style={{ position:'absolute', top:10, right:10, background:'rgba(11,19,38,0.88)', backdropFilter:'blur(12px)', borderRadius:10, padding:'0.65rem', width:168, border:'1px solid rgba(195,192,255,0.1)' }}>
                {[{l:'Confidence',v:confidence,c:'#4edea3'},{l:'Clarity',v:clarity,c:'#c3c0ff'},{l:'Energy',v:energy,c:'#ffb95f'}].map(m=>(
                  <div key={m.l} style={{ marginBottom:7 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.58rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#c7c4d8', marginBottom:3 }}>
                      <span>{m.l}</span><span style={{ color:m.c, transition:'color 0.5s' }}>{m.v}%</span>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:\`\${m.v}%\`, background:m.c, borderRadius:999, transition:'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5, paddingTop:5, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:10, color:'#4edea3' }}>auto_fix_high</span>
                  <span style={{ fontSize:'0.58rem', color:'#c7c4d8' }}>AI coaching live</span>
                </div>
              </div>`;

const CONF_NEW = `              {/* Live metrics overlay — candidate only */}
              {!isInterviewer && (
              <div style={{ position:'absolute', top:10, right:10, background:'rgba(11,19,38,0.88)', backdropFilter:'blur(12px)', borderRadius:10, padding:'0.65rem', width:168, border:'1px solid rgba(195,192,255,0.1)' }}>
                {[{l:'Confidence',v:confidence,c:'#4edea3'},{l:'Clarity',v:clarity,c:'#c3c0ff'},{l:'Energy',v:energy,c:'#ffb95f'}].map(m=>(
                  <div key={m.l} style={{ marginBottom:7 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.58rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#c7c4d8', marginBottom:3 }}>
                      <span>{m.l}</span><span style={{ color:m.c, transition:'color 0.5s' }}>{m.v}%</span>
                    </div>
                    <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:\`\${m.v}%\`, background:m.c, borderRadius:999, transition:'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
                <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5, paddingTop:5, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:10, color:'#4edea3' }}>auto_fix_high</span>
                  <span style={{ fontSize:'0.58rem', color:'#c7c4d8' }}>AI coaching live</span>
                </div>
              </div>
              )}`;

text = text.replace(CONF_OLD, CONF_NEW);

// ── 7. Replace end session screen with role-based view ────────────────────────
const ENDED_OLD = `  // ── Analytics screen ──────────────────────────────────────────────────────
  if (ended && analytics) {
    return (
      <div style={{ minHeight:'100vh', background:'#0b1326', color:'#dae2fd', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ maxWidth:720, width:'100%' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>📊</div>
            <h2 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-0.03em' }}>Post-Interview Analytics</h2>
            <p style={{ color:'#c7c4d8', marginTop:8 }}>Session complete — here's your performance breakdown</p>
          </div>`;

const ENDED_NEW = `  // ── Post-session: Interviewer rating screen ─────────────────────────────────
  if (ended && isInterviewer) {
    const submitRating = () => {
      if (rating === 0) return;
      // Store rating in localStorage keyed by roomId + peerName
      const key = 'alumnex_interview_ratings';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        id: \`rating-\${roomId}-\${Date.now()}\`,
        roomId,
        candidateName: peerName,
        rating,
        feedback: ratingFeedback,
        date: new Date().toISOString(),
        interviewerName: myId,
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
      // Also update candidate's profile rating
      const profileKey = 'alumnex_candidate_ratings';
      const profileRatings = JSON.parse(localStorage.getItem(profileKey) || '{}');
      if (!profileRatings[peerName]) profileRatings[peerName] = [];
      profileRatings[peerName].unshift({ rating, feedback: ratingFeedback, by: myId, date: new Date().toISOString(), roomId });
      localStorage.setItem(profileKey, JSON.stringify(profileRatings));
      setRatingSubmitted(true);
    };

    return (
      <div style={{ minHeight:'100vh', background:'#0b1326', color:'#dae2fd', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ maxWidth:520, width:'100%' }}>
          {ratingSubmitted ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</div>
              <h2 style={{ fontSize:'1.75rem', fontWeight:900, marginBottom:8 }}>Rating Submitted</h2>
              <p style={{ color:'#c7c4d8', marginBottom:'2rem' }}>Your feedback for <strong style={{ color:'#c3c0ff' }}>{peerName}</strong> has been saved and will reflect in their profile.</p>
              <button onClick={() => navigate('/dashboard')} style={{ padding:'0.875rem 2rem', background:'linear-gradient(135deg,#4f46e5,#c3c0ff)', color:'#1d00a5', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.875rem', cursor:'pointer' }}>Back to Dashboard</button>
            </div>
          ) : (
            <>
              <div style={{ textAlign:'center', marginBottom:'2rem' }}>
                <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>🎯</div>
                <h2 style={{ fontSize:'1.75rem', fontWeight:900, letterSpacing:'-0.03em' }}>Rate the Candidate</h2>
                <p style={{ color:'#c7c4d8', marginTop:8 }}>Your rating for <strong style={{ color:'#c3c0ff' }}>{peerName}</strong> will be stored in their profile.</p>
              </div>
              {/* Star rating */}
              <div style={{ background:'#131b2e', borderRadius:16, padding:'1.5rem', marginBottom:'1rem', textAlign:'center' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:'1rem' }}>Overall Performance</div>
                <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:'0.5rem' }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setRating(s)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'2.5rem', color: s <= rating ? '#ffb95f' : 'rgba(70,69,85,0.5)', transition:'all 0.15s', transform: s <= rating ? 'scale(1.15)' : 'scale(1)' }}>★</button>
                  ))}
                </div>
                <div style={{ fontSize:'0.8rem', color: rating > 0 ? '#ffb95f' : '#c7c4d8' }}>
                  {['','Poor','Below Average','Average','Good','Excellent'][rating] || 'Select a rating'}
                </div>
              </div>
              {/* Category ratings */}
              <div style={{ background:'#131b2e', borderRadius:16, padding:'1.5rem', marginBottom:'1rem' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:'1rem' }}>Quick Assessment</div>
                {[
                  { label:'Technical Knowledge', color:'#c3c0ff' },
                  { label:'Communication',        color:'#4edea3' },
                  { label:'Problem Solving',      color:'#ffb95f' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:'0.78rem', color:'#c7c4d8' }}>{item.label}</span>
                    <div style={{ display:'flex', gap:6 }}>
                      {[1,2,3,4,5].map(s => (
                        <div key={s} style={{ width:10, height:10, borderRadius:'50%', background: s <= rating ? item.color : 'rgba(70,69,85,0.4)', transition:'background 0.2s' }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {/* Feedback text */}
              <div style={{ background:'#131b2e', borderRadius:16, padding:'1.5rem', marginBottom:'1.5rem' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'#c7c4d8', marginBottom:8 }}>Written Feedback (optional)</div>
                <textarea
                  value={ratingFeedback}
                  onChange={e => setRatingFeedback(e.target.value)}
                  placeholder="Share specific feedback about the candidate's performance..."
                  rows={4}
                  style={{ width:'100%', background:'#222a3d', border:'1px solid rgba(70,69,85,0.4)', borderRadius:10, padding:'0.75rem', color:'#dae2fd', fontSize:'0.85rem', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'Inter,sans-serif' }}
                />
              </div>
              <button onClick={submitRating} disabled={rating === 0} style={{ width:'100%', padding:'1rem', background: rating > 0 ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#2d3449', color: rating > 0 ? '#1d00a5' : '#c7c4d8', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.875rem', cursor: rating > 0 ? 'pointer' : 'not-allowed', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                Submit Rating
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Analytics screen (candidate only) ────────────────────────────────────────
  if (ended && analytics) {
    return (
      <div style={{ minHeight:'100vh', background:'#0b1326', color:'#dae2fd', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
        <div style={{ maxWidth:720, width:'100%' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ fontSize:'3rem', marginBottom:'0.5rem' }}>📊</div>
            <h2 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-0.03em' }}>Post-Interview Analytics</h2>
            <p style={{ color:'#c7c4d8', marginTop:8 }}>Session complete — here's your performance breakdown</p>
          </div>`;

text = text.replace(ENDED_OLD, ENDED_NEW);

// ── 8. Handle ended state when analytics is null (interviewer case) ───────────
const ENDED_NULL_OLD = `  if (ended && analytics) {`;
// Already replaced above — also handle ended with no analytics (interviewer ends before analytics loads)
// Add a fallback for interviewer
const BACK_DASH_OLD = `          <button onClick={()=>navigate('/dashboard')} style={{ width:'100%', padding:'1rem', background:'linear-gradient(135deg,#4f46e5,#c3c0ff)', color:'#1d00a5', border:'none', borderRadius:12, fontWeight:700, fontSize:'0.875rem', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Back to Dashboard
          </button>`;
// This is the last button in the analytics screen — keep as is

fs.writeFileSync(file, text, 'utf8');
console.log('Done');

// Verify key changes
const final = fs.readFileSync(file, 'utf8');
console.log('isInterviewer:', final.includes('isInterviewer'));
console.log('People tab removed:', !final.includes("'participants','group','People'"));
console.log('Confidence wrapped:', final.includes('!isInterviewer && ('));
console.log('Rating screen:', final.includes('Rate the Candidate'));
console.log('Chat scroll effect:', final.includes('chatEndRef.current?.scrollIntoView'));
