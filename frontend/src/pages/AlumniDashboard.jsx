import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AlumNexLogo from '../AlumNexLogo';
import { getRequests, acceptRequestOnly, bookSlot, rescheduleSlot, declineRequest, formatScheduledTime } from '../interviewRequests';
import { api } from '../api';
import { getAllAlumni, getRequestsForAlumni } from '../lib/db';
import SettingsPage from './SettingsPage';
import LogoutConfirmModal from '../components/LogoutConfirmModal';

// â”€â”€ Student Detail + Accept Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StudentDetailModal({ request, onClose, onAccept }) {
  const p = request.studentProfile || {};
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);

  const handleAccept = () => {
    setAccepting(true);
    setTimeout(() => {
      acceptRequestOnly(request.id);
      setDone(true);
      setTimeout(() => { onAccept(); onClose(); }, 1400);
    }, 600);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#171f33', borderRadius: 20, width: '100%', maxWidth: 560, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Interview Request</div>
            <h3 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#dae2fd', marginBottom: 2 }}>{request.studentName}</h3>
            <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{request.topic}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8', padding: 4 }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {done ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
            <h3 style={{ fontWeight: 700, color: '#4edea3', marginBottom: 8 }}>Request Accepted!</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>{request.studentName} has been notified. Click "Book Slot" to schedule the interview.</p>
          </div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* Student basic info */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: '#1d00a5', flexShrink: 0 }}>{request?.studentName ? request.studentName[0] : '?'}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>{p?.name || request?.studentName || 'Student'}</div>
                  {p.college && <div style={{ fontSize: '0.78rem', color: '#c7c4d8', marginTop: 2 }}>{p.college}</div>}
                  {(p.department || p.year) && (
                    <div style={{ fontSize: '0.72rem', color: '#c3c0ff', marginTop: 2 }}>
                      {[p.department, p.year].filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {p.cgpa && (
                  <div style={{ background: '#131b2e', borderRadius: 10, padding: '0.6rem 0.875rem' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 3 }}>CGPA</div>
                    <div style={{ fontWeight: 700, color: '#4edea3' }}>{p.cgpa} / 10</div>
                  </div>
                )}
                {p.skills?.length > 0 && (
                  <div style={{ background: '#131b2e', borderRadius: 10, padding: '0.6rem 0.875rem' }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 3 }}>Top Skills</div>
                    <div style={{ fontSize: '0.72rem', color: '#dae2fd', fontWeight: 600 }}>{p.skills.slice(0, 3).join(', ')}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {p.bio && (
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 6 }}>About</div>
                <p style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6 }}>{p.bio}</p>
              </div>
            )}

            {/* Links */}
            {(p.linkedin || p.github || p.resumeName) && (
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 10 }}>Links & Documents</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {p.linkedin && (
                    <a href={p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}`} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.875rem', background: 'rgba(10,102,194,0.15)', border: '1px solid rgba(10,102,194,0.3)', borderRadius: 8, color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>link</span> LinkedIn
                    </a>
                  )}
                  {p.github && (
                    <a href={p.github.startsWith('http') ? p.github : `https://${p.github}`} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.875rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 8, color: '#c3c0ff', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>code</span> GitHub
                    </a>
                  )}
                  {p.resumeName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.875rem', background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 8, color: '#4edea3', fontSize: '0.75rem', fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>description</span> {p.resumeName}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Student's message */}
            {request.message && (
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 6 }}>Student's Message</div>
                <div style={{ background: 'rgba(45,52,73,0.5)', borderLeft: '2px solid #c3c0ff', borderRadius: 8, padding: '0.75rem 1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(218,226,253,0.85)', fontStyle: 'italic', lineHeight: 1.6 }}>"{request.message}"</p>
                </div>
              </div>
            )}

            {/* Skills tags */}
            {p.skills?.length > 0 && (
              <div style={{ padding: '1rem 1.5rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 8 }}>Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {p.skills.map(s => (
                    <span key={s} style={{ padding: '0.2rem 0.6rem', background: '#222a3d', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, color: '#c7c4d8' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        {!done && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(70,69,85,0.2)', display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={() => { declineRequest(request.id); onClose(); }} style={{ flex: 1, padding: '0.75rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
              Decline
            </button>
            <button onClick={handleAccept} disabled={accepting} style={{ flex: 2, padding: '0.75rem', background: accepting ? '#2d3449' : 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: accepting ? '#c7c4d8' : '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem', cursor: accepting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {accepting ? (
                <><div style={{ width: 14, height: 14, border: '2px solid rgba(199,196,216,0.3)', borderTop: '2px solid #c7c4d8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Accepting...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span> Accept Request</>
              )}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// â”€â”€ Book Slot Calendar Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BookSlotModal({ request, onClose, onBooked }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeHH, setTimeHH]   = useState('10');
  const [timeMM, setTimeMM]   = useState('00');
  const [ampm, setAmpm]       = useState('AM');
  const [timeError, setTimeError] = useState('');
  const [step, setStep] = useState('calendar');

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr   = today.toDateString();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };
  const isPast = (day) => new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const to24h = () => {
    let h = parseInt(timeHH, 10) || 12;
    const m = parseInt(timeMM, 10) || 0;
    if (ampm === 'AM') { if (h === 12) h = 0; }
    else { if (h !== 12) h += 12; }
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };

  const handleBook = () => {
    const h = parseInt(timeHH, 10);
    const m = parseInt(timeMM, 10);
    if (isNaN(h) || h < 1 || h > 12) { setTimeError('Hour must be 1-12'); return; }
    if (isNaN(m) || m < 0 || m > 59) { setTimeError('Minutes must be 00-59'); return; }
    setTimeError('');
    const time24 = to24h();
    const scheduledTime = new Date(`${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}T${time24}`).toISOString();
    bookSlot(request.id, scheduledTime);
    setStep('done');
    setTimeout(() => { onBooked(scheduledTime); onClose(); }, 1800);
  };

  const displayTime = () => `${String(timeHH).padStart(2,'0')}:${String(timeMM).padStart(2,'0')} ${ampm}`;

  const formattedSelected = selectedDate
    ? new Date(viewYear, viewMonth, selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const inputStyle = {
    background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10,
    color: '#dae2fd', fontSize: '1.4rem', fontWeight: 700, textAlign: 'center',
    width: '100%', padding: '0.6rem 0.25rem', outline: 'none', fontFamily: 'Inter, monospace',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#171f33', borderRadius: 20, width: '100%', maxWidth: 520, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {step === 'done' ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📅</div>
            <h3 style={{ fontWeight: 700, color: '#4edea3', marginBottom: 8 }}>Slot Booked!</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.6 }}>{request.studentName} has been notified with the interview date and time.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Book Interview Slot</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>with {request.studentName}</h3>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto' }}>
              {/* Month nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button onClick={prevMonth} style={{ background: '#222a3d', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#c7c4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span></button>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>{MONTHS[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} style={{ background: '#222a3d', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#c7c4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span></button>
              </div>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c7c4d8', padding: '0.25rem 0' }}>{d}</div>)}
              </div>
              {/* Calendar grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: '1.5rem' }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const past = isPast(day);
                  const isToday = new Date(viewYear, viewMonth, day).toDateString() === todayStr;
                  const selected = selectedDate === day;
                  return (
                    <button key={day} onClick={() => !past && setSelectedDate(day)} disabled={past}
                      style={{ aspectRatio: '1', borderRadius: 8, border: 'none', cursor: past ? 'not-allowed' : 'pointer', fontWeight: selected ? 700 : 500, fontSize: '0.8rem', transition: 'all 0.15s',
                        background: selected ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : isToday ? 'rgba(78,222,163,0.15)' : 'transparent',
                        color: selected ? '#1d00a5' : past ? 'rgba(199,196,216,0.25)' : isToday ? '#4edea3' : '#dae2fd',
                        outline: isToday && !selected ? '1px solid rgba(78,222,163,0.4)' : 'none',
                      }}>{day}</button>
                  );
                })}
              </div>
              {/* Time input */}
              {selectedDate && (
                <>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: '0.75rem' }}>
                    Select Time — {formattedSelected}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: timeError ? 6 : '1.25rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.55rem', color: '#c7c4d8', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hour</div>
                      <input type="number" min="1" max="12" value={timeHH}
                        onChange={e => { setTimeHH(e.target.value); setTimeError(''); }}
                        onBlur={e => { const v = Math.min(12, Math.max(1, parseInt(e.target.value)||1)); setTimeHH(String(v)); }}
                        style={inputStyle} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#c3c0ff', paddingTop: 18 }}>:</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.55rem', color: '#c7c4d8', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Min</div>
                      <input type="number" min="0" max="59" value={timeMM}
                        onChange={e => { setTimeMM(e.target.value); setTimeError(''); }}
                        onBlur={e => { const v = Math.min(59, Math.max(0, parseInt(e.target.value)||0)); setTimeMM(String(v).padStart(2,'0')); }}
                        style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 18 }}>
                      {['AM','PM'].map(p => (
                        <button key={p} onClick={() => setAmpm(p)} style={{ width: 52, padding: '0.4rem 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', background: ampm === p ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#222a3d', color: ampm === p ? '#1d00a5' : '#c7c4d8', transition: 'all 0.15s' }}>{p}</button>
                      ))}
                    </div>
                  </div>
                  {timeError && <div style={{ fontSize: '0.7rem', color: '#ffb4ab', marginBottom: '1rem' }}>⚠ {timeError}</div>}
                  <div style={{ background: 'rgba(78,222,163,0.08)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4edea3', marginBottom: 4 }}>Scheduled Slot</div>
                    <div style={{ fontWeight: 700, color: '#dae2fd', fontSize: '0.9rem' }}>{formattedSelected} at {displayTime()}</div>
                    <div style={{ fontSize: '0.72rem', color: '#c7c4d8', marginTop: 3 }}>A notification will be sent to {request.studentName}</div>
                  </div>
                  <button onClick={handleBook} style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>event_available</span>
                    Confirm & Notify Student
                  </button>
                </>
              )}
              {!selectedDate && <div style={{ textAlign: 'center', padding: '0.5rem', color: '#c7c4d8', fontSize: '0.8rem', opacity: 0.6 }}>Select a date to set a time</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// â”€â”€ Reschedule Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RescheduleModal({ request, onClose, onRescheduled }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [done, setDone] = useState(false);

  const TIME_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = today.toDateString();
  const isPast = (day) => new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const handleReschedule = () => {
    const newTime = new Date(`${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}T${selectedTime}`).toISOString();
    rescheduleSlot(request.id, newTime);
    setDone(true);
    setTimeout(() => { onRescheduled(newTime); onClose(); }, 1600);
  };

  const formattedSelected = selectedDate ? new Date(viewYear, viewMonth, selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#171f33', borderRadius: 20, width: '100%', maxWidth: 520, border: '1px solid rgba(255,185,95,0.2)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
        {done ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔄</div>
            <h3 style={{ fontWeight: 700, color: '#ffb95f', marginBottom: 8 }}>Slot Rescheduled!</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>{request.studentName} has been notified of the new time.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Reschedule Interview</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>with {request.studentName}</h3>
                {request.scheduledTime && <div style={{ fontSize: '0.72rem', color: '#c7c4d8', marginTop: 2 }}>Current: {new Date(request.scheduledTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button onClick={prevMonth} style={{ background: '#222a3d', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#c7c4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span></button>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#dae2fd' }}>{MONTHS[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} style={{ background: '#222a3d', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#c7c4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: '#c7c4d8', padding: '0.25rem 0' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: '1.25rem' }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const past = isPast(day); const isToday = new Date(viewYear, viewMonth, day).toDateString() === todayStr; const selected = selectedDate === day;
                  return <button key={day} onClick={() => !past && setSelectedDate(day)} disabled={past} style={{ aspectRatio: '1', borderRadius: 8, border: 'none', cursor: past ? 'not-allowed' : 'pointer', fontWeight: selected ? 700 : 500, fontSize: '0.8rem', background: selected ? 'linear-gradient(135deg,#e07b00,#ffb95f)' : isToday ? 'rgba(78,222,163,0.15)' : 'transparent', color: selected ? '#1d00a5' : past ? 'rgba(199,196,216,0.25)' : isToday ? '#4edea3' : '#dae2fd' }}>{day}</button>;
                })}
              </div>
              {selectedDate && (
                <>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', marginBottom: 8 }}>Select New Time — {formattedSelected}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6, marginBottom: '1.25rem' }}>
                    {TIME_SLOTS.map(t => <button key={t} onClick={() => setSelectedTime(t)} style={{ padding: '0.4rem 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, background: selectedTime === t ? 'linear-gradient(135deg,#e07b00,#ffb95f)' : '#222a3d', color: selectedTime === t ? '#1d00a5' : '#c7c4d8' }}>{t}</button>)}
                  </div>
                  <div style={{ background: 'rgba(255,185,95,0.08)', border: '1px solid rgba(255,185,95,0.2)', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffb95f', marginBottom: 4 }}>New Slot</div>
                    <div style={{ fontWeight: 700, color: '#dae2fd', fontSize: '0.9rem' }}>{formattedSelected} at {selectedTime}</div>
                  </div>
                  <button onClick={handleReschedule} style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg,#e07b00,#ffb95f)', color: '#1d00a5', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>event_repeat</span> Confirm Reschedule & Notify Student
                  </button>
                </>
              )}
              {!selectedDate && <div style={{ textAlign: 'center', padding: '0.5rem', color: '#c7c4d8', fontSize: '0.8rem', opacity: 0.6 }}>Select a new date to reschedule</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Modal to add an availability slot
function AddSlotModal({ onClose, onAdd }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', width: 400, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dae2fd' }}>Add Availability Slot</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.6rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Start Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.6rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Duration</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.6rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { if (date && time) { onAdd({ date, time, duration }); onClose(); } }} disabled={!date || !time} style={{ flex: 1, padding: '0.75rem', background: date && time ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : '#2d3449', color: date && time ? '#1d00a5' : '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: date && time ? 'pointer' : 'not-allowed' }}>Add Slot</button>
        </div>
      </div>
    </div>
  );
}

const SCHEDULE = [
  { when: 'Today • 2:00 PM',     title: 'Mock Interview: David Chen',  sub: 'Backend Infrastructure Focus', active: true },
  { when: 'Tomorrow • 10:30 AM', title: 'Career Path Guidance',         sub: 'Group Session • 4 Students',   active: false },
  { when: 'Fri • 4:00 PM',       title: 'Resume Deep Dive',             sub: 'One-on-One • Marcus Aurelius', active: false },
];
const NAV_ITEMS = [
  { icon: 'dashboard',     label: 'Dashboard',  tab: 'home' },
  { icon: 'calendar_today',label: 'Schedule',   tab: 'schedule' },
  { icon: 'chat_bubble',   label: 'Requests',   tab: 'requests' },
  { icon: 'settings',      label: 'Settings',   tab: 'settings' },
];

export default function AlumniDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [extraSlots, setExtraSlots] = useState([]);
  const [viewingRequest, setViewingRequest] = useState(null);
  const [bookingRequest, setBookingRequest] = useState(null);
  const [reschedulingRequest, setReschedulingRequest] = useState(null);
  const [liveRequests, setLiveRequests] = useState([]);
  const [declinedToast, setDeclinedToast] = useState(null);
  const [acceptedToast, setAcceptedToast] = useState(null); // { name }
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Profile dropdown
  const [showProfile, setShowProfile] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const savedProfile = JSON.parse(localStorage.getItem('alumnex_profile') || '{}');
  const [profileForm, setProfileForm] = useState({
    username: savedProfile.username || user?.name || '',
    email:    savedProfile.email    || '',
    domain:   savedProfile.domain   || savedProfile.department || '',
    experience: savedProfile.experience || '',
  });

  // Notifications panel
  const [showNotifs, setShowNotifs] = useState(false);
  const [seenNotifIds, setSeenNotifIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alumni_seen_notifs') || '[]'); } catch { return []; }
  });

  if (!user) return <Navigate to="/" replace />;
  const firstName = (user?.name || user?.role || 'Alumni').split(' ')[0];

  // Load requests for this alumni from Supabase directly
  useEffect(() => {
    const load = async () => {
      let usedSupabase = false;
      try {
        let alumniId = user.id;
        const isMockId = !alumniId || String(alumniId).startsWith('alm-') || String(alumniId).startsWith('stu-');
        if (isMockId) {
          const { getAllAlumni } = await import('../lib/db');
          const alumniList = await getAllAlumni();
          const match = alumniList.find(a => a.name === user.name);
          if (match) alumniId = match.id;
        }
        if (alumniId && !String(alumniId).startsWith('alm-') && !String(alumniId).startsWith('stu-')) {
          const { getRequestsForAlumni: dbGetRequests } = await import('../lib/db');
          const data = await dbGetRequests(alumniId);
          const mapped = data.map(r => ({
            id:            r.request_id,
            studentName:   r.student_name || r.student?.name || '',
            studentId:     r.student_id,
            alumniName:    user.name,
            alumniRole:    '',
            topic:         r.topic,
            message:       r.message || '',
            status:        (r.status || 'PENDING').toLowerCase(),
            scheduledTime: r.scheduled_time || null,
            roomId:        r.room_id || null,
            createdAt:     r.created_at,
            studentProfile: r.student_profile_snapshot || r.student?.profile_data || null,
          }));
          const local = JSON.parse(localStorage.getItem('alumnex_interview_requests') || '[]');
          mapped.forEach(dbReq => {
            const idx = local.findIndex(l => l.id === dbReq.id);
            if (idx === -1) local.push(dbReq);
            else local[idx] = { ...local[idx], ...dbReq };
          });
          localStorage.setItem('alumnex_interview_requests', JSON.stringify(local));
          setLiveRequests(mapped.filter(r => ['pending','accepted','slot_booked'].includes(r.status)));
          usedSupabase = true;
        }
      } catch (err) {
        console.warn('AlumniDashboard: Supabase failed, using localStorage', err.message);
      }
      if (!usedSupabase) {
        const all = getRequests();
        const mine = all.filter(r => r.alumniName === user.name || r.alumniId === user.id);
        setLiveRequests(mine.filter(r => ['pending','accepted','slot_booked'].includes(r.status)));
      }
    };
    load();

    // Supabase Realtime — fires instantly on new/updated requests for this alumni
    let channel = null;
    let supabaseRef = null;
    (async () => {
      try {
        let alumniId = user.id;
        const isMockId = !alumniId || String(alumniId).startsWith('alm-') || String(alumniId).startsWith('stu-');
        if (isMockId) {
          const { getAllAlumni } = await import('../lib/db');
          const alumniList = await getAllAlumni();
          const match = alumniList.find(a => a.name === user.name);
          if (match) alumniId = match.id;
        }
        if (alumniId && !String(alumniId).startsWith('alm-') && !String(alumniId).startsWith('stu-')) {
          const { supabase } = await import('../lib/supabaseClient');
          supabaseRef = supabase;
          channel = supabase
            .channel(`alumni-reqs-${alumniId}`)
            .on('postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'interview_requests', filter: `alumni_id=eq.${alumniId}` },
              () => load()
            )
            .on('postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'interview_requests', filter: `alumni_id=eq.${alumniId}` },
              () => load()
            )
            .subscribe();
        }
      } catch(e) { console.warn('Alumni Realtime setup failed:', e.message); }
    })();

    return () => {
      try { if (channel && supabaseRef) supabaseRef.removeChannel(channel); } catch {}
    };
  }, [user.name, user.id]);

  // Build notifications list: new requests + meetings in 24h
  const allScheduled = [...SCHEDULE, ...extraSlots];
  const now = Date.now();
  const upcomingMeetings = allScheduled.filter(s => {
    if (!s.scheduledTime) return false;
    const t = new Date(s.scheduledTime).getTime();
    return t > now && t - now <= 24 * 60 * 60 * 1000;
  });
  const notifications = [
    ...liveRequests.map(r => ({ id: r.id, type: 'request', title: 'New Interview Request', desc: `${r.studentName} wants to book a ${r.topic}`, time: r.createdAt })),
    ...upcomingMeetings.map(s => ({ id: `meet-${s.title}`, type: 'meeting', title: 'Meeting in 24h', desc: `${s.title} — ${s.when}`, time: s.scheduledTime })),
  ];
  const unreadCount = notifications.filter(n => !seenNotifIds.includes(n.id)).length;

  const openNotifs = () => {
    setShowNotifs(v => !v);
    setShowProfile(false);
    // Mark all as seen
    const ids = notifications.map(n => n.id);
    setSeenNotifIds(ids);
    localStorage.setItem('alumni_seen_notifs', JSON.stringify(ids));
  };

  const saveProfileForm = () => {
    const updated = { ...savedProfile, ...profileForm };
    localStorage.setItem('alumnex_profile', JSON.stringify(updated));
    setEditProfile(false);
  };

  const handleAddSlot = ({ date, time, duration }) => {
    const isoTime = new Date(`${date}T${time}`).toISOString();
    setExtraSlots(s => [...s, {
      when: formatScheduledTime(isoTime),
      title: `Open Slot (${duration} min)`,
      sub: 'Available for booking',
      active: false,
      isFreeSlot: true,
      scheduledTime: isoTime,
      duration: parseInt(duration),
    }]);
  };

  const handleDeclineRequest = (id) => {
    const req = liveRequests.find(r => r.id === id);
    declineRequest(id);
    setLiveRequests(prev => prev.filter(r => r.id !== id));
    if (req) {
      setDeclinedToast({ name: req.studentName });
      setTimeout(() => setDeclinedToast(null), 3000);
    }
  };

  const handleAccepted = (requestId) => {
    const req = liveRequests.find(r => r.id === requestId);
    setLiveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r));
    // Show accepted toast
    if (req) {
      setAcceptedToast({ name: req.studentName });
      setTimeout(() => setAcceptedToast(null), 3500);
    }
  };

  const handleSlotBooked = (requestId, scheduledTime) => {
    setLiveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'slot_booked', scheduledTime, roomId: `room-${requestId.slice(-8)}-${Date.now()}` } : r));
    const formatted = formatScheduledTime(scheduledTime);
    const req = liveRequests.find(r => r.id === requestId);
    const roomId = `room-${requestId.slice(-8)}-${Date.now()}`;
    setExtraSlots(s => [...s, {
      when: formatted,
      title: `Mock Interview: ${req?.studentName || 'Student'}`,
      sub: req?.topic || 'Mock Interview',
      active: true,
      roomId,
      scheduledTime,
    }]);
  };

  // ── Instant Meet — start right now, notify student ────────────────────────
  const handleInstantMeet = (req) => {
    const now = new Date().toISOString();
    // Deterministic roomId from requestId — same on every device
    const roomId = `room-instant-${req.id.replace(/[^a-z0-9]/gi, '').slice(-16).toLowerCase()}`;
    // Update request to slot_booked with current time
    bookSlot(req.id, now);
    setLiveRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'slot_booked', scheduledTime: now, roomId } : r));
    // Push instant notification to student
    try {
      const NOTIF_KEY = 'alumniconnect_student_notifications';
      const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
      all.unshift({
        id: `instant-${req.id}-${Date.now()}`,
        studentName: req.studentName,
        type: 'live',
        title: '🔴 Instant Meeting Started!',
        message: `${user.name} has started an instant mock interview session. Join now!`,
        requestId: req.id,
        roomId,
        read: false,
        createdAt: now,
      });
      localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    } catch {}
    // Navigate alumni to the room with their name
    navigate(`/interview/${roomId}?name=${encodeURIComponent(user?.name || 'Alumni')}`);
  };

  const handleRescheduled = (requestId, newScheduledTime) => {
    setLiveRequests(prev => prev.map(r => r.id === requestId ? { ...r, scheduledTime: newScheduledTime } : r));
    const formatted = formatScheduledTime(newScheduledTime);
    setExtraSlots(s => s.map(slot => {
      const req = liveRequests.find(r => r.id === requestId);
      if (req && slot.title === `Mock Interview: ${req.studentName}`) {
        return { ...slot, when: formatted, scheduledTime: newScheduledTime };
      }
      return slot;
    }));
  };

  // â”€â”€ Highlight matching text (like PDF search) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const highlight = (text, query) => {
    if (!text || !query) return text;
    const str = String(text);
    const idx = str.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return str;
    return (
      <>
        {str.slice(0, idx)}
        <mark style={{ background: 'rgba(195,192,255,0.35)', color: '#dae2fd', borderRadius: 3, padding: '0 2px' }}>{str.slice(idx, idx + query.length)}</mark>
        {str.slice(idx + query.length)}
      </>
    );
  };

  const renderSearchResults = (q) => {
    const ql = q.toLowerCase();

    // Search requests — include all statuses for this alumni
    const allRequests = (() => {
      try {
        return getRequests().filter(r => r.alumniName === user.name);
      } catch { return liveRequests; }
    })();

    const matchedRequests = allRequests.filter(r =>
      r.studentName?.toLowerCase().includes(ql) ||
      r.topic?.toLowerCase().includes(ql) ||
      r.message?.toLowerCase().includes(ql) ||
      r.studentProfile?.college?.toLowerCase().includes(ql) ||
      r.studentProfile?.department?.toLowerCase().includes(ql) ||
      r.studentProfile?.skills?.some(s => s.toLowerCase().includes(ql)) ||
      r.status?.toLowerCase().includes(ql)
    );

    // Search schedule
    const allSlots = [...SCHEDULE, ...extraSlots];
    const matchedSlots = allSlots.filter(s =>
      s.title?.toLowerCase().includes(ql) ||
      s.sub?.toLowerCase().includes(ql) ||
      s.when?.toLowerCase().includes(ql)
    );

    const total = matchedRequests.length + matchedSlots.length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Search header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 22 }}>search</span>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Search results for "<span style={{ color: '#c3c0ff' }}>{q}</span>"
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#c7c4d8', marginTop: 3 }}>{total} result{total !== 1 ? 's' : ''} found across requests and schedule</p>
          </div>
        </div>

        {total === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#c7c4d8', background: '#131b2e', borderRadius: 16, border: '1px solid rgba(70,69,85,0.15)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }}>search_off</span>
            <p style={{ fontWeight: 600 }}>No results found</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 4 }}>Try different keywords</p>
          </div>
        )}

        {/* Matched Requests */}
        {matchedRequests.length > 0 && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c7c4d8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c3c0ff' }}>person</span>
              Interview Requests ({matchedRequests.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {matchedRequests.map(r => (
                <div key={r.id} style={{ background: '#131b2e', borderRadius: 14, padding: '1rem 1.25rem', border: '1px solid rgba(70,69,85,0.15)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#222a3d,#2d3449)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0 }}>{r?.studentName ? r.studentName[0] : '?'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{highlight(r.studentName, q)}</div>
                    <div style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>{highlight(r.topic, q)}</div>
                    {r.studentProfile?.college && <div style={{ fontSize: '0.68rem', color: 'rgba(199,196,216,0.5)', marginTop: 1 }}>{highlight(r.studentProfile.college, q)}</div>}
                    {r.message && <div style={{ fontSize: '0.7rem', color: '#c7c4d8', fontStyle: 'italic', marginTop: 4 }}>"{highlight(r.message.slice(0, 80), q)}{r.message.length > 80 ? '...' : ''}"</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                      background: r.status === 'accepted' ? 'rgba(255,185,95,0.15)' : r.status === 'slot_booked' ? 'rgba(78,222,163,0.15)' : 'rgba(195,192,255,0.1)',
                      color: r.status === 'accepted' ? '#ffb95f' : r.status === 'slot_booked' ? '#4edea3' : '#c3c0ff',
                    }}>{r.status === 'slot_booked' ? '✓ Booked' : r.status === 'accepted' ? 'Accepted' : 'Pending'}</span>
                    {r.status === 'pending' && (
                      <button onClick={() => { setViewingRequest(r); setGlobalSearch(''); }} style={{ padding: '0.3rem 0.7rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 7, fontSize: '0.6rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>View</button>
                    )}
                    {r.status === 'accepted' && (
                      <>
                        <button onClick={() => { setBookingRequest(r); setGlobalSearch(''); }} style={{ padding: '0.3rem 0.7rem', background: 'rgba(78,222,163,0.15)', color: '#4edea3', borderRadius: 7, fontSize: '0.6rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Book Slot</button>
                        <button onClick={() => handleInstantMeet(r)} style={{ padding: '0.3rem 0.7rem', background: 'rgba(255,68,68,0.15)', color: '#ff6b6b', borderRadius: 7, fontSize: '0.6rem', fontWeight: 700, border: '1px solid rgba(255,68,68,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>videocam</span>Instant Meet
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matched Schedule */}
        {matchedSlots.length > 0 && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c7c4d8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#4edea3' }}>calendar_today</span>
              Schedule ({matchedSlots.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {matchedSlots.map((s, i) => (
                <div key={i} style={{ background: '#131b2e', borderRadius: 14, padding: '1rem 1.25rem', border: `1px solid ${s.active ? 'rgba(195,192,255,0.15)' : 'rgba(70,69,85,0.15)'}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: s.active ? 'rgba(195,192,255,0.1)' : '#222a3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: s.active ? '#c3c0ff' : '#c7c4d8' }}>event</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{highlight(s.title, q)}</div>
                    <div style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>{highlight(s.sub, q)}</div>
                    <div style={{ fontSize: '0.68rem', color: s.active ? '#c3c0ff' : 'rgba(199,196,216,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{highlight(s.when, q)}</div>
                  </div>
                  {s.active && s.roomId && (
                    <a href={`/interview/${s.roomId}`} style={{ padding: '0.35rem 0.875rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Join
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'schedule') {
      const now = new Date();

      // Build Mon–Sun week
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
      monday.setHours(0,0,0,0);
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday); d.setDate(monday.getDate() + i); return d;
      });
      const todayIdx = (now.getDay() + 6) % 7;

      // All events with ISO scheduledTime
      const bookedRequests = liveRequests.filter(r => r.status === 'slot_booked' && r.scheduledTime);
      const allEvents = [
        ...bookedRequests.map(r => ({
          scheduledTime: r.scheduledTime,
          title: `Mock Interview: ${r.studentName}`,
          sub: r.topic,
          isFreeSlot: false,
          duration: 120,
          roomId: r.roomId,
        })),
        ...extraSlots.filter(s => s.scheduledTime).map(s => ({
          scheduledTime: s.scheduledTime,
          title: s.title,
          sub: s.sub,
          isFreeSlot: true,
          duration: s.duration || 60,
        })),
      ].sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

      const weekStart = new Date(monday);
      const weekEnd   = new Date(monday); weekEnd.setDate(monday.getDate() + 7);
      const weekEvents = allEvents.filter(e => {
        const d = new Date(e.scheduledTime);
        return d >= weekStart && d < weekEnd;
      });

      // Group by day index Mon=0
      const eventsByDay = Array.from({ length: 7 }, () => []);
      weekEvents.forEach(e => {
        const d = new Date(e.scheduledTime);
        eventsByDay[(d.getDay() + 6) % 7].push(e);
      });

      const isEnded = (e) => Date.now() > new Date(e.scheduledTime).getTime() + (e.duration || 60) * 60000;
      const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      // Unique sorted time labels for calendar rows
      const allTimes = [...new Set(weekEvents.map(e => {
        const d = new Date(e.scheduledTime);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      }))].sort();

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Weekly Schedule</h2>
            <button onClick={() => setShowSlotModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span> Add Slot
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem', color: '#c7c4d8', flexWrap: 'wrap' }}>
            {[
              { color: 'rgba(195,192,255,0.2)', border: 'rgba(195,192,255,0.4)', label: 'Interview' },
              { color: 'rgba(78,222,163,0.15)', border: 'rgba(78,222,163,0.4)',  label: 'Free Slot' },
              { color: 'rgba(100,100,100,0.15)',border: 'rgba(100,100,100,0.3)', label: 'Ended' },
              { color: 'rgba(78,222,163,0.06)', border: 'rgba(78,222,163,0.2)',  label: 'Today' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: `1px solid ${l.border}` }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Calendar grid — only rows with events */}
          <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7,1fr)', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
              <div style={{ padding: '0.75rem', background: '#171f33' }} />
              {weekDays.map((d, i) => {
                const isToday = i === todayIdx;
                return (
                  <div key={i} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', background: isToday ? 'rgba(78,222,163,0.08)' : '#171f33', borderLeft: '1px solid rgba(70,69,85,0.15)' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: isToday ? '#4edea3' : '#c7c4d8' }}>
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: isToday ? '#4edea3' : '#dae2fd', marginTop: 2 }}>{d.getDate()}</div>
                    {eventsByDay[i].length > 0 && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c3c0ff', margin: '3px auto 0' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Event-only time rows */}
            {allTimes.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#c7c4d8', opacity: 0.5 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>event_busy</span>
                No meetings this week
              </div>
            ) : allTimes.map(timeStr => (
              <div key={timeStr} style={{ display: 'grid', gridTemplateColumns: '64px repeat(7,1fr)', borderBottom: '1px solid rgba(70,69,85,0.08)', minHeight: 48 }}>
                <div style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 700, color: 'rgba(199,196,216,0.5)', background: '#131b2e' }}>{timeStr}</div>
                {weekDays.map((_, dayIdx) => {
                  const event = eventsByDay[dayIdx].find(e => {
                    const d = new Date(e.scheduledTime);
                    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` === timeStr;
                  });
                  const ended = event && isEnded(event);
                  const isToday = dayIdx === todayIdx;
                  return (
                    <div key={dayIdx} style={{
                      padding: '0.25rem',
                      borderLeft: '1px solid rgba(70,69,85,0.1)',
                      background: event
                        ? (ended ? 'rgba(100,100,100,0.06)' : event.isFreeSlot ? 'rgba(78,222,163,0.06)' : 'rgba(195,192,255,0.06)')
                        : isToday ? 'rgba(78,222,163,0.02)' : 'transparent',
                      minHeight: 48,
                    }}>
                      {event && (
                        <div style={{
                          background: ended ? 'rgba(100,100,100,0.18)' : event.isFreeSlot ? 'rgba(78,222,163,0.15)' : 'rgba(195,192,255,0.18)',
                          border: `1px solid ${ended ? 'rgba(100,100,100,0.3)' : event.isFreeSlot ? 'rgba(78,222,163,0.35)' : 'rgba(195,192,255,0.4)'}`,
                          borderRadius: 6, padding: '0.2rem 0.35rem',
                          fontSize: '0.55rem', fontWeight: 700,
                          color: ended ? '#6b7280' : event.isFreeSlot ? '#4edea3' : '#c3c0ff',
                          lineHeight: 1.4,
                        }}>
                          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {event.title.replace('Mock Interview: ','').replace(/Open Slot.*/, 'Free Slot')}
                          </div>
                          {ended && <div style={{ fontSize: '0.48rem', opacity: 0.8, marginTop: 1 }}>Ended</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sorted session list */}
          <div style={{ background: '#171f33', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.1)' }}>
            <div style={{ background: '#222a3d', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#dad7ff' }}>All Sessions — Sorted by Time</span>
              <span style={{ fontSize: '0.6rem', color: '#c7c4d8' }}>{allEvents.length} total</span>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {allEvents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#c7c4d8', opacity: 0.5, fontSize: '0.875rem' }}>No sessions scheduled yet</div>
              )}
              {allEvents.map((e, i) => {
                const ended = isEnded(e);
                const accentColor = ended ? 'rgba(100,100,100,0.4)' : e.isFreeSlot ? '#4edea3' : '#c3c0ff';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: '#131b2e', borderRadius: 12, borderLeft: `3px solid ${accentColor}`, opacity: ended ? 0.65 : 1, gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.6rem', fontWeight: 700, color: ended ? '#6b7280' : e.isFreeSlot ? '#4edea3' : '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                        {fmtDate(e.scheduledTime)} • {fmtTime(e.scheduledTime)}
                        {ended && <span style={{ marginLeft: 8, color: '#6b7280', fontWeight: 600 }}>— Ended</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: ended ? '#6b7280' : '#dae2fd' }}>{e.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2 }}>{e.sub}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {e.isFreeSlot && (
                        <button
                          onClick={() => setExtraSlots(s => s.filter(x => x.scheduledTime !== e.scheduledTime))}
                          style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, color: '#ffb4ab', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>delete</span> Remove
                        </button>
                      )}
                      {!e.isFreeSlot && (
                        ended ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.75rem', background: 'rgba(100,100,100,0.15)', color: '#6b7280', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam_off</span> Ended
                          </div>
                        ) : (
                          <Link to={`/interview/${e.roomId || 'demo-room'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.75rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Join
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'requests') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Interview Requests</h2>
          <span style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {liveRequests.filter(r => r.status === 'pending').length} Pending
          </span>
          {liveRequests.filter(r => r.status === 'accepted').length > 0 && (
            <span style={{ background: 'rgba(255,185,95,0.1)', color: '#ffb95f', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {liveRequests.filter(r => r.status === 'accepted').length} Awaiting Slot
            </span>
          )}
        </div>

        {liveRequests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#c7c4d8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }}>task_alt</span>
            <p style={{ fontWeight: 600 }}>No pending requests</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 6 }}>New requests from students will appear here</p>
          </div>
        )}

        {liveRequests.map(r => (
          <div key={r.id} style={{ background: '#171f33', borderRadius: 16, padding: '1.25rem 1.5rem', border: `1px solid ${r.status === 'accepted' ? 'rgba(255,185,95,0.2)' : 'rgba(70,69,85,0.2)'}`, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = r.status === 'accepted' ? 'rgba(255,185,95,0.4)' : 'rgba(195,192,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = r.status === 'accepted' ? 'rgba(255,185,95,0.2)' : 'rgba(70,69,85,0.2)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'linear-gradient(135deg,#222a3d,#2d3449)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0 }}>{r.studentName[0]}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.studentName}</span>
                  {/* Status badge */}
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: r.status === 'accepted' ? 'rgba(255,185,95,0.15)' : r.status === 'slot_booked' ? 'rgba(78,222,163,0.15)' : 'rgba(195,192,255,0.1)',
                    color: r.status === 'accepted' ? '#ffb95f' : r.status === 'slot_booked' ? '#4edea3' : '#c3c0ff',
                  }}>
                    {r.status === 'slot_booked' ? '📅 Booked' : r.status === 'accepted' ? '✓ Accepted' : 'â³ Pending'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#c7c4d8' }}>{r.topic}</div>
                {r.studentProfile?.college && <div style={{ fontSize: '0.68rem', color: 'rgba(199,196,216,0.5)', marginTop: 2 }}>{r.studentProfile.college} {r.studentProfile.department ? `• ${r.studentProfile.department}` : ''}</div>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {r.status === 'pending' && (
                  <>
                    <button onClick={() => setViewingRequest(r)} style={{ padding: '0.45rem 0.875rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span> View & Accept
                    </button>
                    <button onClick={() => { handleDeclineRequest(r.id); }} style={{ padding: '0.45rem 0.75rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      Decline
                    </button>
                  </>
                )}
                {r.status === 'accepted' && (
                  <button onClick={() => setBookingRequest(r)} style={{ padding: '0.45rem 1rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_month</span> Book Slot
                  </button>
                )}
                {r.status === 'slot_booked' && (() => {
                  const now = Date.now();
                  const scheduledMs = new Date(r.scheduledTime).getTime();
                  const endMs = scheduledMs + 2 * 60 * 60 * 1000;
                  const isEnded = now > endMs;
                  const canJoin = !isEnded && now >= scheduledMs - 5 * 60 * 1000;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      {isEnded ? (<div style={{ padding: '0.45rem 1rem', background: 'rgba(100,100,100,0.12)', color: '#6b7280', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, opacity: 0.7 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam_off</span> Ended</div>) : canJoin ? (
                        <a href={`/interview/${r.roomId}`} style={{ padding: '0.45rem 1rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Join Now
                        </a>
                      ) : (
                        <div style={{ padding: '0.35rem 0.75rem', background: 'rgba(78,222,163,0.1)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, color: '#4edea3', textAlign: 'right' }}>
                          📅 {new Date(r.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      <button onClick={() => setReschedulingRequest(r)} style={{ padding: '0.35rem 0.75rem', background: 'rgba(255,185,95,0.1)', border: '1px solid rgba(255,185,95,0.25)', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, color: '#ffb95f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>event_repeat</span> Reschedule
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Message preview */}
            {r.message && (
              <div style={{ marginTop: '0.875rem', padding: '0.6rem 0.875rem', background: 'rgba(45,52,73,0.4)', borderLeft: '2px solid rgba(195,192,255,0.3)', borderRadius: 8, fontSize: '0.75rem', color: 'rgba(218,226,253,0.7)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{r.message.length > 100 ? r.message.slice(0, 100) + '...' : r.message}"
              </div>
            )}

            <div style={{ marginTop: 8, fontSize: '0.62rem', color: 'rgba(199,196,216,0.4)' }}>
              Sent {new Date(r.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    );

    if (activeTab === 'settings') return <SettingsPage />;

    // home
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem' }}>
          <div style={{ ...glass, padding: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '5rem' }}>auto_awesome</span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Welcome back, <span style={{ color: '#c3c0ff' }}>{firstName}</span></h2>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8', maxWidth: 400, lineHeight: 1.6 }}>Your mentorship impact has increased by 14% this month. Three students are currently awaiting your feedback.</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: 12 }}>
              <button onClick={() => setActiveTab('requests')} style={btnOutline}>View Requests</button>
              <button onClick={() => setActiveTab('schedule')} style={btnOutline}>My Schedule</button>
            </div>
          </div>
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', borderLeft: '2px solid #c3c0ff' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c7c4d8', marginBottom: 16 }}>Students Benefited</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>1,284</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4edea3', marginBottom: 6 }}>+12%</span>
            </div>
          </div>
          <div style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', borderLeft: '2px solid #4edea3' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c7c4d8', marginBottom: 16 }}>Average Rating</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>4.9</span>
              <span style={{ color: '#ffb95f', fontSize: '1rem', marginBottom: 6 }}>★★★★★</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          {/* Requests preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Interview Requests</span>
                <span style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{liveRequests.filter(r => r.status === 'pending').length} Pending</span>
              </div>
              <button onClick={() => setActiveTab('requests')} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c7c4d8', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>View All</button>
            </div>
            {liveRequests.length === 0 ? (
              <div style={{ background: '#171f33', borderRadius: 16, padding: '2rem', textAlign: 'center', color: '#c7c4d8', border: '1px solid rgba(70,69,85,0.2)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3, display: 'block', marginBottom: 8 }}>inbox</span>
                <p style={{ fontSize: '0.875rem' }}>No pending requests</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 4 }}>Students can find you in the Alumni Directory</p>
              </div>
            ) : liveRequests.slice(0, 2).map(r => (
              <div key={r.id} style={{ background: '#171f33', borderRadius: 16, padding: '1.25rem 1.5rem', border: `1px solid ${r.status === 'accepted' || r.status === 'slot_booked' ? 'rgba(78,222,163,0.15)' : 'rgba(70,69,85,0.2)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#222a3d,#2d3449)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0 }}>{r.studentName[0]}</div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>{r.studentName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{r.topic}</div>
                  </div>

                  {/* Status-aware actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => setViewingRequest(r)} style={{ padding: '0.4rem 0.875rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', border: 'none', cursor: 'pointer' }}>
                          Accept
                        </button>
                        <button onClick={() => handleDeclineRequest(r.id)} style={{ padding: '0.4rem 0.75rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                          Decline
                        </button>
                      </>
                    )}
                    {(r.status === 'accepted' || r.status === 'slot_booked') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* ✓ Accepted badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.75rem', background: 'rgba(78,222,163,0.12)', border: '1px solid rgba(78,222,163,0.25)', borderRadius: 8 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#4edea3', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4edea3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {r.status === 'slot_booked' ? 'Booked' : 'Accepted'}
                          </span>
                        </div>
                        {/* Book Slot / View button */}
                        {r.status === 'accepted' && (
                          <button onClick={() => setBookingRequest(r)} style={{ padding: '0.35rem 0.75rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>calendar_month</span> Book Slot
                          </button>
                        )}                        {r.status === 'slot_booked' && (() => {
                          const now = Date.now();
                          const scheduledMs = new Date(r.scheduledTime).getTime();
                          const endMs = scheduledMs + 2 * 60 * 60 * 1000;
                          const isEnded = now > endMs;
                          const canJoin = !isEnded && now >= scheduledMs - 5 * 60 * 1000;
                          return isEnded ? (
                            <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>videocam_off</span> Ended
                            </div>
                          ) : canJoin ? (
                            <a href={`/interview/${r.roomId}`} style={{ padding: '0.35rem 0.75rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>videocam</span> Join
                            </a>
                          ) : (
                            <div style={{ fontSize: '0.65rem', color: '#4edea3', fontWeight: 600 }}>
                              📅 {new Date(r.scheduledTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                {r.message && r.status === 'pending' && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'rgba(218,226,253,0.6)', fontStyle: 'italic', lineHeight: 1.5, paddingLeft: 62 }}>
                    "{r.message.slice(0, 80)}{r.message.length > 80 ? '...' : ''}"
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Schedule sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>My Schedule</span>
              <button onClick={() => setActiveTab('schedule')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ color: '#c7c4d8' }}>calendar_month</span>
              </button>
            </div>
            <div style={{ background: '#171f33', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: '#222a3d', padding: '1rem 1.5rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#dad7ff' }}>Upcoming Sessions</span>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {SCHEDULE.map((s, i) => (
                  <div key={i} style={{ position: 'relative', paddingLeft: 24, borderLeft: `2px solid ${s.active ? '#c3c0ff' : 'rgba(70,69,85,0.3)'}` }}>
                    <div style={{ position: 'absolute', left: -5, top: 0, width: 8, height: 8, borderRadius: '50%', background: s.active ? '#c3c0ff' : '#464555' }} />
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: s.active ? '#c3c0ff' : '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{s.when}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowSlotModal(true)} style={{ width: '100%', padding: '1rem', background: '#222a3d', color: '#c3c0ff', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>
                Manage Availability
              </button>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#171f33)', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(195,192,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#ffb95f', fontSize: 20 }}>tips_and_updates</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ffb95f', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mentor's Edge</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#dad7ff', lineHeight: 1.6, opacity: 0.85 }}>
                Students are 40% more likely to succeed when mentors provide specific feedback on soft skills during mock interviews.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif' }}>
      {showSlotModal && <AddSlotModal onClose={() => setShowSlotModal(false)} onAdd={handleAddSlot} />}
      {viewingRequest && (
        <StudentDetailModal
          request={viewingRequest}
          onClose={() => setViewingRequest(null)}
          onAccept={() => handleAccepted(viewingRequest.id)}
        />
      )}
      {bookingRequest && (
        <BookSlotModal
          request={bookingRequest}
          onClose={() => setBookingRequest(null)}
          onBooked={(scheduledTime) => handleSlotBooked(bookingRequest.id, scheduledTime)}
        />
      )}
      {reschedulingRequest && (
        <RescheduleModal
          request={reschedulingRequest}
          onClose={() => setReschedulingRequest(null)}
          onRescheduled={(newTime) => handleRescheduled(reschedulingRequest.id, newTime)}
        />
      )}

      {/* Declined toast */}
      {declinedToast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#222a3d', border: '1px solid rgba(255,180,171,0.3)', borderRadius: 12, padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: 10, zIndex: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'slideUp 0.3s ease' }}>
          <span className="material-symbols-outlined" style={{ color: '#ffb4ab', fontSize: 20 }}>cancel</span>
          <span style={{ fontSize: '0.875rem', color: '#dae2fd' }}>Request from <strong>{declinedToast.name}</strong> declined</span>
        </div>
      )}

      {/* Accepted toast */}
      {acceptedToast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#131b2e', border: '1px solid rgba(78,222,163,0.35)', borderRadius: 12, padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: 10, zIndex: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'slideUp 0.3s ease' }}>
          <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4edea3' }}>Request Accepted!</div>
            <div style={{ fontSize: '0.75rem', color: '#c7c4d8' }}>{acceptedToast.name} has been notified. Click "Book Slot" to schedule.</div>
          </div>
        </div>
      )}

      {/* Logout confirmation */}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={() => { logout(); navigate('/login'); }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {/* â”€â”€ SIDEBAR â”€â”€ */}
      <aside style={{ width: 256, minHeight: '100vh', position: 'fixed', left: 0, top: 0, background: '#131b2e', display: 'flex', flexDirection: 'column', padding: '1.5rem', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
          <AlumNexLogo size={32} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#fff', letterSpacing: '-0.02em' }}>Alum<span style={{ color: '#60a5fa' }}>NEX</span></div>
            <div style={{ fontSize: '0.55rem', color: '#c7c4d8', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>Alumni Portal</div>
          </div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(({ icon, label, tab }) => {
            const active = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', borderRadius: 12, background: active ? '#222a3d' : 'transparent', color: active ? '#c3c0ff' : '#c7c4d8', fontWeight: active ? 600 : 400, fontSize: '0.875rem', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>{label}
              </button>
            );
          })}
        </nav>
        {/* Only Sign Out at bottom — no "New Mentorship" button */}
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => setShowLogoutConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#ffb4ab', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> Sign Out
          </button>
        </div>
      </aside>

      {/* â”€â”€ MAIN â”€â”€ */}
      <main style={{ marginLeft: 256, flex: 1 }}>
        <header style={{ position: 'fixed', top: 0, left: 256, right: 0, height: 64, zIndex: 40, background: 'rgba(11,19,38,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(195,192,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem' }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#131b2e', padding: '0.4rem 1rem', borderRadius: 999, width: 300 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c7c4d8' }}>search</span>
            <input
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search anything — names, sessions, topics..."
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#dae2fd', fontSize: '0.75rem', width: '100%' }}
            />
            {globalSearch && (
              <button onClick={() => setGlobalSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8', padding: 0, display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

            {/* â”€â”€ NOTIFICATIONS â”€â”€ */}
            <div style={{ position: 'relative' }}>
              <button onClick={openNotifs} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: showNotifs ? '#c3c0ff' : '#c7c4d8', fontSize: 22, fontVariationSettings: showNotifs ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
                {/* Red dot for unread */}
                {unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#ff4444', border: '1.5px solid #0b1326' }} />
                )}
              </button>

              {showNotifs && (
                <>
                  <div onClick={() => setShowNotifs(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 44, right: 0, width: 340, background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                      <span style={{ fontSize: '0.65rem', color: '#c7c4d8' }}>{notifications.length} total</span>
                    </div>
                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#c7c4d8' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.3, display: 'block', marginBottom: 8 }}>notifications_none</span>
                          <p style={{ fontSize: '0.875rem' }}>All caught up!</p>
                        </div>
                      ) : notifications.map((n, i) => (
                        <div key={n.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.1)', display: 'flex', gap: 12, alignItems: 'flex-start', background: i === 0 ? 'rgba(195,192,255,0.03)' : 'transparent' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: n.type === 'request' ? 'rgba(195,192,255,0.12)' : 'rgba(78,222,163,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: n.type === 'request' ? '#c3c0ff' : '#4edea3', fontVariationSettings: "'FILL' 1" }}>
                              {n.type === 'request' ? 'person_add' : 'event'}
                            </span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 3 }}>{n.title}</div>
                            <div style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.4 }}>{n.desc}</div>
                            <div style={{ fontSize: '0.62rem', color: 'rgba(199,196,216,0.4)', marginTop: 4 }}>
                              {new Date(n.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {n.type === 'request' && (
                            <button onClick={() => { setShowNotifs(false); setActiveTab('requests'); }} style={{ padding: '0.25rem 0.6rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', border: 'none', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>View</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ width: 1, height: 32, background: 'rgba(70,69,85,0.3)' }} />

            {/* â”€â”€ PROFILE BUTTON â”€â”€ */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowProfile(p => !p); setShowNotifs(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c3c0ff' }}>{user.name || 'Alumni'}</div>
                  <div style={{ fontSize: '0.6rem', color: '#c7c4d8' }}>SENIOR MENTOR</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1d00a5', fontSize: '0.85rem', border: showProfile ? '2px solid #c3c0ff' : '2px solid transparent', transition: 'border 0.2s' }}>{firstName[0]}</div>
              </button>

              {/* Profile dropdown */}
              {showProfile && (
                <>
                  <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 48, right: 0, width: 300, background: '#171f33', borderRadius: 16, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 200, overflow: 'hidden' }}>

                    {!editProfile ? (
                      <>
                        {/* Profile view */}
                        <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(11,19,38,0.8))', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#1d00a5', flexShrink: 0 }}>{firstName[0]}</div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#dae2fd' }}>{user.name || 'Alumni'}</div>
                              <div style={{ fontSize: '0.7rem', color: '#c7c4d8', marginTop: 2 }}>{savedProfile.domain || savedProfile.department || 'Senior Mentor'}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: '0.75rem 1rem' }}>
                          {[
                            { icon: 'alternate_email', label: 'Username', val: savedProfile.username || user.name || '—' },
                            { icon: 'mail',            label: 'Email',    val: savedProfile.email    || '—' },
                            { icon: 'work',            label: 'Domain',   val: savedProfile.domain   || savedProfile.department || '—' },
                            { icon: 'history_edu',     label: 'Experience', val: savedProfile.experience || '—' },
                          ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.45rem 0', borderBottom: '1px solid rgba(70,69,85,0.1)' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#c3c0ff' }}>{item.icon}</span>
                              <span style={{ fontSize: '0.7rem', color: '#c7c4d8', flex: 1 }}>{item.label}</span>
                              <span style={{ fontSize: '0.7rem', color: '#dae2fd', fontWeight: 600, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.val}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(70,69,85,0.15)', display: 'flex', gap: 8 }}>
                          <button onClick={() => setEditProfile(true)} style={{ flex: 1, padding: '0.5rem', background: 'rgba(195,192,255,0.1)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 8, color: '#c3c0ff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                            Edit Profile
                          </button>
                          <button onClick={() => setShowLogoutConfirm(true)} style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)', borderRadius: 8, color: '#ffb4ab', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Edit profile form */}
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(70,69,85,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => setEditProfile(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8', padding: 0, display: 'flex' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                          </button>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Edit Profile</span>
                        </div>
                        <div style={{ padding: '1rem' }}>
                          {[
                            { key: 'username',   label: 'Username',   icon: 'alternate_email', placeholder: 'your.username' },
                            { key: 'email',      label: 'Email',      icon: 'mail',            placeholder: 'you@company.com' },
                            { key: 'domain',     label: 'Domain',     icon: 'work',            placeholder: 'e.g. Software Engineering' },
                            { key: 'experience', label: 'Experience', icon: 'history_edu',     placeholder: 'e.g. 8 years at Google' },
                          ].map(field => (
                            <div key={field.key} style={{ marginBottom: '0.875rem' }}>
                              <label style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#c3c0ff' }}>{field.icon}</span>
                                {field.label}
                              </label>
                              <input
                                value={profileForm[field.key]}
                                onChange={e => setProfileForm(f => ({ ...f, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                                style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 8, padding: '0.55rem 0.75rem', color: '#dae2fd', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
                              />
                            </div>
                          ))}
                          <button onClick={saveProfileForm} style={{ width: '100%', padding: '0.65rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                            Save Changes
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <section style={{ marginTop: 64, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {globalSearch.trim() ? renderSearchResults(globalSearch.trim()) : renderContent()}
        </section>
      </main>
      {/* FAB removed */}
    </div>
  );
}

const glass = { background: 'rgba(23,31,51,0.7)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: 16 };
const btnOutline = { padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid rgba(195,192,255,0.2)', color: '#c3c0ff', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' };


