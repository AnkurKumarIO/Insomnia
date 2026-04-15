const fs = require('fs');
const file = 'frontend/src/pages/AlumniDashboard.jsx';
let text = fs.readFileSync(file, 'utf8');

// Normalize to LF for matching
text = text.replace(/\r\n/g, '\n');

const startMarker = "if (activeTab === 'schedule') {\n      // Build week grid";
const endMarker   = "if (activeTab === 'requests') return (";

const startIdx = text.indexOf(startMarker);
const endIdx   = text.indexOf(endMarker);

if (startIdx === -1) { console.log('START not found'); process.exit(1); }
if (endIdx   === -1) { console.log('END not found');   process.exit(1); }

const NEW_BLOCK = `if (activeTab === 'schedule') {
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
          title: \`Mock Interview: \${r.studentName}\`,
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
        return \`\${String(d.getHours()).padStart(2,'0')}:\${String(d.getMinutes()).padStart(2,'0')}\`;
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
                <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: \`1px solid \${l.border}\` }} />
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
                    return \`\${String(d.getHours()).padStart(2,'0')}:\${String(d.getMinutes()).padStart(2,'0')}\` === timeStr;
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
                          border: \`1px solid \${ended ? 'rgba(100,100,100,0.3)' : event.isFreeSlot ? 'rgba(78,222,163,0.35)' : 'rgba(195,192,255,0.4)'}\`,
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
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: '#131b2e', borderRadius: 12, borderLeft: \`3px solid \${accentColor}\`, opacity: ended ? 0.65 : 1, gap: 12 }}>
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
                          <Link to={\`/interview/\${e.roomId || 'demo-room'}\`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.35rem 0.75rem', background: 'rgba(79,70,229,0.2)', color: '#c3c0ff', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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

    `;

text = text.slice(0, startIdx) + NEW_BLOCK + text.slice(endIdx);
fs.writeFileSync(file, text, 'utf8');
console.log('Done');
