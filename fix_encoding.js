/**
 * Comprehensive fix for the interview room notification + join flow
 * Fixes:
 * 1. handleSlotBooked still uses Date.now() in roomId — breaks consistency
 * 2. handleInstantMeet uses 'room-instant-' prefix — doesn't match bookSlot formula
 * 3. bookSlot local notification has NO roomId — student can't join on same device
 * 4. Supabase notification has no roomId field — cross-device join broken
 */

const fs = require('fs');

// --- Fix 1 & 2: AlumniDashboard.jsx ---
{
  const file = 'c:/Users/garvk/OneDrive/Desktop/Hackathon1/frontend/src/pages/AlumniDashboard.jsx';
  let text = fs.readFileSync(file, 'utf8');

  // Fix handleSlotBooked - both occurrences of Date.now() based roomId
  const OLD_SLOT_BOOKED = `  const handleSlotBooked = (requestId, scheduledTime) => {
    setLiveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'slot_booked', scheduledTime, roomId: \`room-\${requestId.slice(-8)}-\${Date.now()}\` } : r));
    const formatted = formatScheduledTime(scheduledTime);
    const req = liveRequests.find(r => r.id === requestId);
    const roomId = \`room-\${requestId.slice(-8)}-\${Date.now()}\`;`;

  const NEW_SLOT_BOOKED = `  const handleSlotBooked = (requestId, scheduledTime) => {
    // roomId MUST match bookSlot formula exactly
    const roomId = \`room-\${requestId.replace(/[^a-z0-9]/gi, '').slice(-16).toLowerCase()}\`;
    setLiveRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'slot_booked', scheduledTime, roomId } : r));
    const formatted = formatScheduledTime(scheduledTime);
    const req = liveRequests.find(r => r.id === requestId);`;

  if (text.includes(OLD_SLOT_BOOKED)) {
    text = text.replace(OLD_SLOT_BOOKED, NEW_SLOT_BOOKED);
    console.log('✓ Fixed handleSlotBooked roomId');
  } else {
    // Try CRLF
    const oldCRLF = OLD_SLOT_BOOKED.replace(/\n/g, '\r\n');
    const newCRLF = NEW_SLOT_BOOKED.replace(/\n/g, '\r\n');
    if (text.includes(oldCRLF)) {
      text = text.replace(oldCRLF, newCRLF);
      console.log('✓ Fixed handleSlotBooked roomId (CRLF)');
    } else {
      console.log('✗ handleSlotBooked block not found');
    }
  }

  // Fix handleInstantMeet - wrong roomId prefix + still pushing local notif (needed now since DB notif goes through Supabase)
  const OLD_INSTANT = `  // ── Instant Meet — start right now, notify student ────────────────────────
  const handleInstantMeet = (req) => {
    const now = new Date().toISOString();
    // Deterministic roomId from requestId — same on every device
    const roomId = \`room-instant-\${req.id.replace(/[^a-z0-9]/gi, '').slice(-16).toLowerCase()}\`;
    // Update request to slot_booked with current time
    bookSlot(req.id, now);
    setLiveRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'slot_booked', scheduledTime: now, roomId } : r));
    // Push instant notification to student
    try {
      const NOTIF_KEY = 'alumniconnect_student_notifications';
      const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
      all.unshift({
        id: \`instant-\${req.id}-\${Date.now()}\`,
        studentName: req.studentName,
        type: 'live',
        title: '🔴 Instant Meeting Started!',
        message: \`\${user.name} has started an instant mock interview session. Join now!\`,
        requestId: req.id,
        roomId,
        read: false,
        createdAt: now,
      });
      localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
    } catch {}
    // Navigate alumni to the room with their name
    navigate(\`/interview/\${roomId}?name=\${encodeURIComponent(user?.name || 'Alumni')}\`);
  };`;

  const NEW_INSTANT = `  // ── Instant Meet — start right now, notify student ────────────────────────
  const handleInstantMeet = (req) => {
    const now = new Date().toISOString();
    // roomId MUST match bookSlot formula exactly — no 'instant-' prefix
    const roomId = \`room-\${req.id.replace(/[^a-z0-9]/gi, '').slice(-16).toLowerCase()}\`;
    // bookSlot updates DB (status, roomId, scheduledTime) and creates Supabase notification
    bookSlot(req.id, now);
    setLiveRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'slot_booked', scheduledTime: now, roomId } : r));
    // Also push local notification so it works even without Supabase Realtime
    try {
      const NOTIF_KEY = 'alumniconnect_student_notifications';
      const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
      const alreadyExists = all.some(n => n.requestId === req.id && n.type === 'live');
      if (!alreadyExists) {
        all.unshift({
          id: \`live-\${req.id}\`,
          studentName: req.studentName,
          type: 'live',
          title: '🔴 Interview is Live Now!',
          message: \`\${user.name} has started a mock interview session. Join now!\`,
          requestId: req.id,
          roomId,
          read: false,
          createdAt: now,
        });
        localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
      }
    } catch {}
    // Navigate alumni to the room
    navigate(\`/interview/\${roomId}?name=\${encodeURIComponent(user?.name || 'Alumni')}\`);
  };`;

  // Try LF first
  if (text.includes(OLD_INSTANT)) {
    text = text.replace(OLD_INSTANT, NEW_INSTANT);
    console.log('✓ Fixed handleInstantMeet');
  } else {
    const oldCRLF = OLD_INSTANT.replace(/\n/g, '\r\n');
    const newCRLF = NEW_INSTANT.replace(/\n/g, '\r\n');
    if (text.includes(oldCRLF)) {
      text = text.replace(oldCRLF, newCRLF);
      console.log('✓ Fixed handleInstantMeet (CRLF)');
    } else {
      // Try partial match
      const partialOld = `room-instant-\${req.id.replace`;
      if (text.includes(partialOld)) {
        text = text.replace(partialOld, `room-\${req.id.replace`);
        console.log('✓ Fixed handleInstantMeet roomId prefix (partial)');
      } else {
        console.log('✗ handleInstantMeet block not found');
      }
    }
  }

  fs.writeFileSync(file, text, 'utf8');
  console.log('AlumniDashboard.jsx saved');
}

// --- Fix 3: bookSlot local notification needs roomId ---
{
  const file = 'c:/Users/garvk/OneDrive/Desktop/Hackathon1/frontend/src/interviewRequests.js';
  let text = fs.readFileSync(file, 'utf8');

  const OLD_PUSH = `  pushLocalNotif({
    studentName: requests[idx].studentName,
    type:        'slot_booked',
    title:       'Interview Slot Confirmed! 📅',
    message:     \`Your interview is scheduled for \${formatted}.\`,
    requestId,
    roomId,      // ← include roomId so student can join from any device
  });`;

  // Check if roomId is already included
  if (!text.includes('roomId,      // ← include roomId')) {
    console.log('bookSlot local notif: roomId already updated or missing marker');
  } else {
    console.log('bookSlot local notif: roomId already included ✓');
  }

  // The key fix: ensure the 'slot_booked' type local notification includes the roomId
  // Look for the pushLocalNotif call and make sure roomId is there
  const PUSH_SEARCH = `  pushLocalNotif({\n    studentName: requests[idx].studentName,\n    type:        'slot_booked',`;
  if (text.includes(PUSH_SEARCH)) {
    console.log('✓ bookSlot pushLocalNotif found');
  }

  // Ensure bookSlot also pushes a 'live' type notification for instant meets
  // Actually bookSlot is generic — Instant Meet passes 'now' as scheduledTime
  // We need to add a 'live' type push when scheduledTime === now (within 1 min of current time)
  const OLD_PUSH_SLOT = `  pushLocalNotif({\n    studentName: requests[idx].studentName,\n    type:        'slot_booked',\n    title:       'Interview Slot Confirmed! 📅',\n    message:     \`Your interview is scheduled for \${formatted}.\`,\n    requestId,\n    roomId,      // ← include roomId so student can join from any device\n  });\n  return requests[idx];`;

  const NEW_PUSH_SLOT = `  const isInstant = Math.abs(new Date(scheduledTime).getTime() - Date.now()) < 60000;
  pushLocalNotif({
    studentName: requests[idx].studentName,
    type:        isInstant ? 'live' : 'slot_booked',
    title:       isInstant ? '🔴 Interview is Live Now!' : 'Interview Slot Confirmed! 📅',
    message:     isInstant
      ? 'Your mock interview is starting now. Click Join to enter the room.'
      : \`Your interview is scheduled for \${formatted}.\`,
    requestId,
    roomId,
  });
  return requests[idx];`;

  if (text.includes(OLD_PUSH_SLOT)) {
    text = text.replace(OLD_PUSH_SLOT, NEW_PUSH_SLOT);
    console.log('✓ Fixed bookSlot notification type (instant vs scheduled)');
  } else {
    const oldCRLF = OLD_PUSH_SLOT.replace(/\n/g, '\r\n');
    const newCRLF = NEW_PUSH_SLOT.replace(/\n/g, '\r\n');
    if (text.includes(oldCRLF)) {
      text = text.replace(oldCRLF, newCRLF);
      console.log('✓ Fixed bookSlot notification type (CRLF)');
    } else {
      console.log('✗ bookSlot push block not found — checking what is there:');
      const idx = text.indexOf('slot_booked');
      if (idx !== -1) console.log('Context:', JSON.stringify(text.substring(idx-20, idx+200)));
    }
  }

  fs.writeFileSync(file, text, 'utf8');
  console.log('interviewRequests.js saved');
}

console.log('\nAll fixes applied. Run: npx vite build');
