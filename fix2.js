const fs = require('fs');

const files = [
  'frontend/src/pages/Dashboard.jsx',
  'frontend/src/pages/AlumniDashboard.jsx',
];

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  const before = text;

  // em dash variants
  text = text.split('\u00e2\u20ac\u201d').join('\u2014');  // â€" -> —
  text = text.split('\u00e2\u0080\u0094').join('\u2014');  // already correct form, keep

  // checkmark
  text = text.split('\u00e2\u0153\u201c').join('\u2713');  // âœ" -> ✓

  // hourglass
  text = text.split('\u00e2\u00b3').join('\u23f3');        // â³ -> ⏳

  // calendar emoji
  text = text.split('\u00f0\u0178\u201c\u2026').join('\uD83D\uDCC5'); // ðŸ"… -> 📅

  // refresh emoji
  text = text.split('\u00f0\u0178\u201c\u201e').join('\uD83D\uDD04'); // ðŸ"„ -> 🔄

  // red circle emoji
  text = text.split('\u00f0\u0178\u201c\u00b4').join('\uD83D\uDD34'); // ðŸ"´ -> 🔴

  if (text !== before) {
    fs.writeFileSync(file, text, 'utf8');
    console.log('Fixed: ' + file);
  } else {
    console.log('No change: ' + file);
  }
}

// Final scan
console.log('\n--- Final scan ---');
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let found = 0;
  lines.forEach((l, i) => {
    if (/\u00e2\u20ac|\u00f0\u0178|\u00e2\u0153|\u00e2\u00b3/.test(l)) {
      console.log(file + ':' + (i+1) + ': ' + l.trim());
      found++;
    }
  });
  if (found === 0) console.log(file + ': CLEAN');
}
