import React, { useContext, useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { getRequests, acceptRequest, declineRequest, formatScheduledTime } from '../interviewRequests';
import SettingsPage from './SettingsPage';

// Modal to accept a request and pick a scheduled time
function AcceptModal({ request, onClose, onAccepted }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const defaultDate = tomorrow.toISOString().slice(0, 10);
  const defaultTime = '10:00';

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [done, setDone] = useState(false);

  const handleAccept = () => {
    const scheduledTime = new Date(`${date}T${time}`).toISOString();
    const updated = acceptRequest(request.id, scheduledTime);
    setDone(true);
    setTimeout(() => { onAccepted(updated); onClose(); }, 1500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 420, border: '1px solid rgba(195,192,255,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
            <h3 style={{ fontWeight: 700, color: '#4edea3', marginBottom: 8 }}>Session Scheduled!</h3>
            <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>
              {request.studentName} will be notified of the scheduled time.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Accept & Schedule</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dae2fd' }}>{request.studentName}</h3>
                <p style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2 }}>{request.topic}</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c7c4d8' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {request.message && (
              <div style={{ background: 'rgba(45,52,73,0.5)', borderLeft: '2px solid #c3c0ff', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.78rem', color: '#c7c4d8', fontStyle: 'italic', lineHeight: 1.5 }}>"{request.message}"</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().slice(0,10)} style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.6rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c7c4d8', display: 'block', marginBottom: 6 }}>Time</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', background: '#222a3d', border: '1px solid rgba(70,69,85,0.4)', borderRadius: 10, padding: '0.6rem 0.875rem', color: '#dae2fd', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAccept} disabled={!date || !time} style={{ flex: 2, padding: '0.75rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                Confirm Schedule
              </button>
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
  const [acceptingRequest, setAcceptingRequest] = useState(null);
  const [liveRequests, setLiveRequests] = useState([]);

  if (!user) return <Navigate to="/" replace />;
  const firstName = user.name ? user.name.split(' ')[0] : 'Alumni';

  // Load requests for this alumni from the shared store
  useEffect(() => {
    const load = () => {
      const all = getRequests();
      setLiveRequests(all.filter(r => r.alumniName === user.name && r.status === 'pending'));
    };
    load();
    // Poll every 3s so new requests appear without refresh
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [user.name]);

  const handleAddSlot = ({ date, time, duration }) => {
    const label = `${date} • ${time}`;
    setExtraSlots(s => [...s, { when: label, title: `Open Slot (${duration} min)`, sub: 'Available for booking', active: false }]);
  };

  const handleDeclineRequest = (id) => {
    declineRequest(id);
    setLiveRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleAccepted = (updated) => {
    setLiveRequests(prev => prev.filter(r => r.id !== updated.id));
    // Add to schedule
    const formatted = formatScheduledTime(updated.scheduledTime);
    setExtraSlots(s => [...s, {
      when: formatted,
      title: `Mock Interview: ${updated.studentName}`,
      sub: updated.topic,
      active: true,
      roomId: updated.roomId,
    }]);
  };

  const renderContent = () => {
    if (activeTab === 'schedule') {
      // Build week grid
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sun
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
      });

      const HOURS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
      const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

      // Collect all booked slots (from SCHEDULE + extraSlots)
      const allSlots = [...SCHEDULE, ...extraSlots];
      const isBooked = (dayIdx, hour) => {
        return allSlots.some(s => {
          if (!s.when) return false;
          const parts = s.when.split('•');
          if (parts.length < 2) return false;
          const timeStr = parts[1].trim().replace(' PM','').replace(' AM','');
          const slotHour = parseInt(timeStr.split(':')[0]);
          const isPM = s.when.includes('PM') && slotHour !== 12;
          const slotH24 = isPM ? slotHour + 12 : slotHour;
          const slotHourStr = `${String(slotH24).padStart(2,'0')}:00`;
          // Match by day label
          const dayLabel = DAY_LABELS[dayIdx];
          const isToday = parts[0].trim() === 'Today' && dayIdx === (today.getDay() + 6) % 7;
          const isTomorrow = parts[0].trim() === 'Tomorrow' && dayIdx === (today.getDay() + 7) % 7;
          const matchDay = isToday || isTomorrow || parts[0].trim().startsWith(dayLabel);
          return matchDay && slotHourStr === hour;
        });
      };

      const getSlotInfo = (dayIdx, hour) => {
        return allSlots.find(s => {
          if (!s.when) return false;
          const parts = s.when.split('•');
          if (parts.length < 2) return false;
          const timeStr = parts[1].trim().replace(' PM','').replace(' AM','');
          const slotHour = parseInt(timeStr.split(':')[0]);
          const isPM = s.when.includes('PM') && slotHour !== 12;
          const slotH24 = isPM ? slotHour + 12 : slotHour;
          const slotHourStr = `${String(slotH24).padStart(2,'0')}:00`;
          const dayLabel = DAY_LABELS[dayIdx];
          const isToday = parts[0].trim() === 'Today' && dayIdx === (today.getDay() + 6) % 7;
          const isTomorrow = parts[0].trim() === 'Tomorrow' && dayIdx === (today.getDay() + 7) % 7;
          const matchDay = isToday || isTomorrow || parts[0].trim().startsWith(dayLabel);
          return matchDay && slotHourStr === hour;
        });
      };

      const todayIdx = (today.getDay() + 6) % 7; // Mon=0

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Weekly Schedule</h2>
            <button onClick={() => setShowSlotModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              Add Slot
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem', color: '#c7c4d8' }}>
            {[
              { color: 'rgba(195,192,255,0.15)', border: 'rgba(195,192,255,0.3)', label: 'Available' },
              { color: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.4)', label: 'Booked / Interview' },
              { color: 'rgba(78,222,163,0.1)',   border: 'rgba(78,222,163,0.3)',   label: 'Today' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: l.color, border: `1px solid ${l.border}` }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ background: '#131b2e', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.15)' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7,1fr)', borderBottom: '1px solid rgba(70,69,85,0.2)' }}>
              <div style={{ padding: '0.75rem', background: '#171f33' }} />
              {weekDays.map((d, i) => {
                const isToday = i === todayIdx;
                return (
                  <div key={i} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', background: isToday ? 'rgba(78,222,163,0.08)' : '#171f33', borderLeft: '1px solid rgba(70,69,85,0.15)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: isToday ? '#4edea3' : '#c7c4d8' }}>{DAY_LABELS[i]}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: isToday ? '#4edea3' : '#dae2fd', marginTop: 2 }}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>

            {/* Time rows */}
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {HOURS.map(hour => (
                <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7,1fr)', borderBottom: '1px solid rgba(70,69,85,0.08)' }}>
                  <div style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'rgba(199,196,216,0.4)', background: '#131b2e' }}>{hour}</div>
                  {weekDays.map((_, dayIdx) => {
                    const booked = isBooked(dayIdx, hour);
                    const slotInfo = booked ? getSlotInfo(dayIdx, hour) : null;
                    const isToday = dayIdx === todayIdx;
                    return (
                      <div key={dayIdx}
                        title={slotInfo ? `${slotInfo.title} — ${slotInfo.sub}` : 'Available'}
                        style={{ padding: '0.3rem', borderLeft: '1px solid rgba(70,69,85,0.1)', background: booked ? 'rgba(255,107,107,0.08)' : isToday ? 'rgba(78,222,163,0.03)' : 'transparent', cursor: booked ? 'default' : 'pointer', minHeight: 36, position: 'relative', transition: 'background 0.15s' }}
                        onMouseEnter={e => { if (!booked) e.currentTarget.style.background = 'rgba(195,192,255,0.06)'; }}
                        onMouseLeave={e => { if (!booked) e.currentTarget.style.background = isToday ? 'rgba(78,222,163,0.03)' : 'transparent'; }}>
                        {booked && slotInfo && (
                          <div style={{ background: slotInfo.active ? 'rgba(195,192,255,0.2)' : 'rgba(255,107,107,0.15)', border: `1px solid ${slotInfo.active ? 'rgba(195,192,255,0.4)' : 'rgba(255,107,107,0.3)'}`, borderRadius: 6, padding: '0.2rem 0.4rem', fontSize: '0.58rem', fontWeight: 700, color: slotInfo.active ? '#c3c0ff' : '#ffb4ab', lineHeight: 1.3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {slotInfo.title.replace('Mock Interview: ','').replace('Open Slot','Slot')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming list */}
          <div style={{ background: '#171f33', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(70,69,85,0.1)' }}>
            <div style={{ background: '#222a3d', padding: '0.875rem 1.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#dad7ff' }}>Upcoming Sessions</span>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[...SCHEDULE, ...extraSlots].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: '#131b2e', borderRadius: 12, borderLeft: `3px solid ${s.active ? '#c3c0ff' : 'rgba(70,69,85,0.3)'}` }}>
                  <div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: s.active ? '#c3c0ff' : '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{s.when}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c7c4d8', marginTop: 2 }}>{s.sub}</div>
                  </div>
                  {s.active && (
                    <Link to={`/interview/${s.roomId || 'demo-room'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.875rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Join Now
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'requests') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Interview Requests</h2>
          <span style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{liveRequests.length} Pending</span>
        </div>
        {liveRequests.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#c7c4d8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.3, display: 'block', marginBottom: 12 }}>task_alt</span>
            <p style={{ fontWeight: 600 }}>No pending requests</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: 6 }}>New requests from students will appear here</p>
          </div>
        )}
        {liveRequests.map(r => (
          <div key={r.id} style={{ background: '#171f33', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.2)' }}>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg,#222a3d,#2d3449)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0 }}>{r.studentName[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{r.studentName}</div>
                    <div style={{ fontSize: '0.65rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.topic}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setAcceptingRequest(r)} style={{ padding: '0.4rem 0.8rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Accept & Schedule</button>
                    <button onClick={() => handleDeclineRequest(r.id)} style={{ padding: '0.4rem 0.8rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Decline</button>
                  </div>
                </div>
                {r.message && (
                  <div style={{ background: 'rgba(45,52,73,0.5)', borderLeft: '2px solid #c3c0ff', borderRadius: 8, padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Student's Message</div>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(218,226,253,0.8)', fontStyle: 'italic', lineHeight: 1.6 }}>"{r.message}"</p>
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: '0.65rem', color: 'rgba(199,196,216,0.5)' }}>
                  Sent {new Date(r.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
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
                <span style={{ background: 'rgba(195,192,255,0.1)', color: '#c3c0ff', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{liveRequests.length} Pending</span>
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
              <div key={r.id} style={{ background: '#171f33', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.2)' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#222a3d,#2d3449)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#c3c0ff', flexShrink: 0 }}>{r.studentName[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{r.studentName}</div>
                        <div style={{ fontSize: '0.65rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.topic}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setAcceptingRequest(r)} style={{ padding: '0.4rem 0.8rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Accept</button>
                        <button onClick={() => handleDeclineRequest(r.id)} style={{ padding: '0.4rem 0.8rem', background: '#222a3d', color: '#c7c4d8', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }}>Decline</button>
                      </div>
                    </div>
                    {r.message && (
                      <p style={{ fontSize: '0.75rem', color: 'rgba(218,226,253,0.7)', fontStyle: 'italic', lineHeight: 1.5 }}>"{r.message}"</p>
                    )}
                  </div>
                </div>
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
      {acceptingRequest && <AcceptModal request={acceptingRequest} onClose={() => setAcceptingRequest(null)} onAccepted={handleAccepted} />}
      <aside style={{ width: 256, minHeight: '100vh', position: 'fixed', left: 0, top: 0, background: '#131b2e', display: 'flex', flexDirection: 'column', padding: '1.5rem', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#1d00a5', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#c3c0ff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Alumni Portal</div>
            <div style={{ fontSize: '0.6rem', color: '#c7c4d8', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>The Digital Curator</div>
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
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link to="/interview/demo-room" style={{ display: 'block', width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: 'white', borderRadius: 12, textAlign: 'center', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
            New Mentorship
          </Link>
          <button onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 1rem', color: '#ffb4ab', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span> Sign Out
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 256, flex: 1 }}>
        <header style={{ position: 'fixed', top: 0, left: 256, right: 0, height: 64, zIndex: 40, background: 'rgba(11,19,38,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(195,192,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#131b2e', padding: '0.4rem 1rem', borderRadius: 999, width: 320 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c7c4d8' }}>search</span>
            <input placeholder="Search candidates or sessions..." style={{ background: 'transparent', border: 'none', outline: 'none', color: '#dae2fd', fontSize: '0.75rem', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="material-symbols-outlined" style={{ color: '#c7c4d8', cursor: 'pointer' }}>notifications</span>
            <span className="material-symbols-outlined" style={{ color: '#c7c4d8', cursor: 'pointer' }}>mail</span>
            <div style={{ width: 1, height: 32, background: 'rgba(70,69,85,0.3)' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c3c0ff' }}>{user.name || 'Alumni'}</div>
              <div style={{ fontSize: '0.6rem', color: '#c7c4d8' }}>SENIOR MENTOR</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1d00a5', fontSize: '0.85rem' }}>{firstName[0]}</div>
          </div>
        </header>
        <section style={{ marginTop: 64, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {renderContent()}
        </section>
      </main>

      <Link to="/interview/demo-room" style={{ position: 'fixed', bottom: 40, right: 40, width: 56, height: 56, background: 'linear-gradient(135deg,#4f46e5,#6366f1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(79,70,229,0.4)', zIndex: 50, textDecoration: 'none' }}>
        <span className="material-symbols-outlined" style={{ color: 'white', fontSize: 24, fontVariationSettings: "'FILL' 1" }}>add</span>
      </Link>
    </div>
  );
}

const glass = { background: 'rgba(23,31,51,0.7)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderRadius: 16 };
const btnOutline = { padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid rgba(195,192,255,0.2)', color: '#c3c0ff', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' };
