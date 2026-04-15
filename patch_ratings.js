const fs = require('fs');
const file = 'frontend/src/pages/Dashboard.jsx';
let text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const OLD = `                    {savedProfile.bio && (
                      <p style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.5, marginTop: '0.75rem', fontStyle: 'italic' }}>"{savedProfile.bio.slice(0, 80)}{savedProfile.bio.length > 80 ? '...' : ''}"</p>
                    )}
                  </div>

                  {/* Actions */}`;

const NEW = `                    {savedProfile.bio && (
                      <p style={{ fontSize: '0.72rem', color: '#c7c4d8', lineHeight: 1.5, marginTop: '0.75rem', fontStyle: 'italic' }}>"{savedProfile.bio.slice(0, 80)}{savedProfile.bio.length > 80 ? '...' : ''}"</p>
                    )}
                    {/* Interview Ratings from Alumni */}
                    {(() => {
                      const profileRatings = JSON.parse(localStorage.getItem('alumnex_candidate_ratings') || '{}');
                      const myRatings = profileRatings[user?.name] || [];
                      if (myRatings.length === 0) return null;
                      const avg = (myRatings.reduce((s, r) => s + r.rating, 0) / myRatings.length).toFixed(1);
                      return (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,185,95,0.06)', border: '1px solid rgba(255,185,95,0.15)', borderRadius: 10 }}>
                          <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffb95f', marginBottom: 6 }}>Interview Ratings</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffb95f' }}>{avg}</span>
                            <div>
                              <div style={{ display: 'flex', gap: 2 }}>
                                {[1,2,3,4,5].map(s => (
                                  <span key={s} style={{ fontSize: '0.75rem', color: s <= Math.round(avg) ? '#ffb95f' : 'rgba(70,69,85,0.5)' }}>★</span>
                                ))}
                              </div>
                              <div style={{ fontSize: '0.6rem', color: '#c7c4d8' }}>{myRatings.length} review{myRatings.length > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          {myRatings.slice(0, 2).map((r, i) => r.feedback && (
                            <div key={i} style={{ fontSize: '0.65rem', color: '#c7c4d8', fontStyle: 'italic', marginBottom: 3, lineHeight: 1.4 }}>
                              "{r.feedback.slice(0, 60)}{r.feedback.length > 60 ? '...' : ''}" — {r.by}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions */}`;

if (text.includes(OLD)) {
  text = text.replace(OLD, NEW);
  fs.writeFileSync(file, text, 'utf8');
  console.log('Ratings section added to profile dropdown');
} else {
  console.log('Pattern not found');
  const idx = text.indexOf('savedProfile.bio');
  console.log('bio found at:', idx);
}
