const fs = require('fs');

const files = [
  'frontend/src/pages/Dashboard.jsx',
  'frontend/src/pages/AlumniDashboard.jsx',
];

// Exact byte patterns extracted from the actual files
const replacements = [
  // em dash: c3 a2 e2 82 ac e2 80 9c -> e2 80 94 (—)
  [Buffer.from([0xc3,0xa2,0xe2,0x82,0xac,0xe2,0x80,0x9c]), Buffer.from([0xe2,0x80,0x94])],
  // red circle: c3 b0 c5 b8 e2 80 9d c2 b4 -> f0 9f 94 b4 (🔴)
  [Buffer.from([0xc3,0xb0,0xc5,0xb8,0xe2,0x80,0x9d,0xc2,0xb4]), Buffer.from([0xf0,0x9f,0x94,0xb4])],
  // calendar: c3 b0 c5 b8 e2 80 9d e2 80 a6 -> f0 9f 93 85 (📅)
  [Buffer.from([0xc3,0xb0,0xc5,0xb8,0xe2,0x80,0x9d,0xe2,0x80,0xa6]), Buffer.from([0xf0,0x9f,0x93,0x85])],
  // refresh: c3 b0 c5 b8 e2 80 9d e2 80 9e -> f0 9f 94 84 (🔄)
  [Buffer.from([0xc3,0xb0,0xc5,0xb8,0xe2,0x80,0x9d,0xe2,0x80,0x9e]), Buffer.from([0xf0,0x9f,0x94,0x84])],
  // checkmark: c3 a2 c5 93 e2 80 9c -> e2 9c 93 (✓)
  [Buffer.from([0xc3,0xa2,0xc5,0x93,0xe2,0x80,0x9c]), Buffer.from([0xe2,0x9c,0x93])],
  // hourglass: c3 a2 c2 b3 -> e2 8f b3 (⏳)
  [Buffer.from([0xc3,0xa2,0xc2,0xb3]), Buffer.from([0xe2,0x8f,0xb3])],
  // clipboard: c3 b0 c5 b8 e2 80 9d e2 80 b9 -> f0 9f 93 8b (📋)
  [Buffer.from([0xc3,0xb0,0xc5,0xb8,0xe2,0x80,0x9d,0xe2,0x80,0xb9]), Buffer.from([0xf0,0x9f,0x93,0x8b])],
];

function replaceAll(buf, from, to) {
  let idx;
  while ((idx = buf.indexOf(from)) !== -1) {
    buf = Buffer.concat([buf.slice(0, idx), to, buf.slice(idx + from.length)]);
  }
  return buf;
}

for (const file of files) {
  let buf = fs.readFileSync(file);
  const original = buf.toString('hex');
  for (const [bad, good] of replacements) {
    buf = replaceAll(buf, bad, good);
  }
  fs.writeFileSync(file, buf);
  const changed = buf.toString('hex') !== original;
  console.log((changed ? 'Fixed' : 'No change') + ': ' + file);
}

// Final verification
console.log('\n--- Verification ---');
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let found = 0;
  lines.forEach((l, i) => {
    // Check for multi-byte garbled sequences (not box-drawing â"€ which is harmless)
    if (/\u00e2\u20ac|\u00f0\u0178|\u00e2\u0153\u201c|\u00e2\u00b3/.test(l)) {
      console.log('  GARBLED ' + file + ':' + (i+1) + ': ' + l.trim());
      found++;
    }
  });
  if (found === 0) console.log('  CLEAN: ' + file);
}
