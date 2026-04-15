const fs = require('fs');
const file = 'frontend/src/pages/Dashboard.jsx';
let text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const idx = text.indexOf('Join Now button for slot_booked');
const blockStart = text.lastIndexOf('{/*', idx);
const blockEnd = text.indexOf('})()}', idx) + 5;

const OLD = text.slice(blockStart, blockEnd);
console.log('OLD block length:', OLD.length);

const NEW = `{/* Join Now button for slot_booked notifications */}
                            {n.type === 'slot_booked' && (() => {
                              const req = getRequestsByStudent(user.name).find(r => r.id === n.requestId);
                              const joinRoomId = n.roomId || req?.roomId;
                              const scheduledTime = req?.scheduledTime;
                              if (!joinRoomId) return null;
                              const nowMs = Date.now();
                              const endMs = scheduledTime ? new Date(scheduledTime).getTime() + 2 * 60 * 60 * 1000 : null;
                              const isEnded = endMs && nowMs > endMs;
                              const canJoin = !isEnded && (scheduledTime ? nowMs >= new Date(scheduledTime).getTime() - 5 * 60 * 1000 : true);
                              return isEnded ? (
                                <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#6b7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>videocam_off</span> Session ended
                                </div>
                              ) : canJoin ? (
                                <a href={\`/interview/\${joinRoomId}?name=\${encodeURIComponent(user?.name || 'Student')}\`} onClick={() => setShowNotifs(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, padding: '0.35rem 0.875rem', background: 'linear-gradient(135deg,#00a572,#4edea3)', color: '#003d29', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>videocam</span> Join Now
                                </a>
                              ) : (
                                <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#4edea3', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                                  {scheduledTime ? new Date(scheduledTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}
                                </div>
                              );
                            })()}`;

text = text.slice(0, blockStart) + NEW + text.slice(blockEnd);
fs.writeFileSync(file, text, 'utf8');
console.log('Done');
