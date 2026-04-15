const fs = require('fs');

const files = [
  'frontend/src/pages/AlumniDashboard.jsx',
  'frontend/src/pages/Dashboard.jsx',
];

const replacements = [
  // â€" -> — (em dash U+2014)
  [Buffer.from([0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9D]), Buffer.from([0xE2,0x80,0x94])],
  // âœ" -> ✓ (checkmark U+2713)
  [Buffer.from([0xC3,0xA2,0xC5,0x93,0xE2,0x80,0x9C]), Buffer.from([0xE2,0x9C,0x93])],
  // â³ -> ⏳ (hourglass U+23F3)
  [Buffer.from([0xC3,0xA2,0xC2,0xB3]), Buffer.from([0xE2,0x8F,0xB3])],
  // ðŸ"… -> 📅 (calendar U+1F4C5)
  [Buffer.from([0xC3,0xB0,0xC5,0xB8,0xE2,0x80,0x9C,0xE2,0x80,0xA6]), Buffer.from([0xF0,0x9F,0x93,0x85])],
  // ðŸ"„ -> 🔄 (refresh U+1F504)
  [Buffer.from([0xC3,0xB0,0xC5,0xB8,0xE2,0x80,0x9C,0xE2,0x80,0x9E]), Buffer.from([0xF0,0x9F,0x94,0x84])],
  // ðŸ"´ -> 🔴 (red circle U+1F534)
  [Buffer.from([0xC3,0xB0,0xC5,0xB8,0xE2,0x80,0x9C,0xC2,0xB4]), Buffer.from([0xF0,0x9F,0x94,0xB4])],
  // ðŸ"‹ -> 📋 (clipboard U+1F4CB)
  [Buffer.from([0xC3,0xB0,0xC5,0xB8,0xE2,0x80,0x9C,0xE2,0x80,0xB9]), Buffer.from([0xF0,0x9F,0x93,0x8B])],
];

// Also do string-level replacements after byte fixes
const stringReplacements = [
  ['â€"', '—'],
  ['âœ"', '✓'],
  ['â³', '⏳'],
  ['ðŸ"…', '📅'],
  ['ðŸ"„', '🔄'],
  ['ðŸ"´', '🔴'],
  ['â€¢', '•'],
];

function replaceBuffer(buf, from, to) {
  let result = buf;
  let idx;
  while ((idx = result.indexOf(from)) !== -1) {
    result = Buffer.concat([result.slice(0, idx), to, result.slice(idx + from.length)]);
  }
  return result;
}

for (const file of files) {
  let buf = fs.readFileSync(file);
  for (const [bad, good] of replacements) {
    buf = replaceBuffer(buf, bad, good);
  }
  // String-level pass
  let text = buf.toString('utf8');
  for (const [bad, good] of stringReplacements) {
    text = text.split(bad).join(good);
  }
  fs.writeFileSync(file, text, 'utf8');
  console.log('Fixed: ' + file);
}
console.log('Done');
