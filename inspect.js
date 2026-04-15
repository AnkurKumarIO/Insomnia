const fs = require('fs');

// Read as raw buffer
const buf = fs.readFileSync('frontend/src/pages/Dashboard.jsx');

// Find "Mock Interview" and show surrounding bytes
let idx = buf.indexOf(Buffer.from('Mock Interview'));
if (idx >= 0) {
  const slice = buf.slice(idx, idx + 40);
  console.log('Text:', slice.toString('utf8'));
  console.log('Hex:', [...slice].map(b => b.toString(16).padStart(2,'0')).join(' '));
}

// Find the red circle emoji area
const buf2 = fs.readFileSync('frontend/src/pages/Dashboard.jsx');
idx = buf2.indexOf(Buffer.from('Interview is Live'));
if (idx >= 0) {
  const slice = buf2.slice(Math.max(0, idx-15), idx+5);
  console.log('\nLive area hex:', [...slice].map(b => b.toString(16).padStart(2,'0')).join(' '));
  console.log('Live area text:', slice.toString('utf8'));
}

// AlumniDashboard refresh emoji
const buf3 = fs.readFileSync('frontend/src/pages/AlumniDashboard.jsx');
idx = buf3.indexOf(Buffer.from('3rem'));
while (idx >= 0) {
  const slice = buf3.slice(idx + 6, idx + 30);
  const text = slice.toString('utf8');
  if (text.includes('\u00f0') || text.includes('\u00e2') || text.charCodeAt(0) > 127) {
    console.log('\nRefresh area hex:', [...buf3.slice(idx+6, idx+20)].map(b => b.toString(16).padStart(2,'0')).join(' '));
    console.log('Refresh area text:', text);
    break;
  }
  idx = buf3.indexOf(Buffer.from('3rem'), idx + 1);
}
