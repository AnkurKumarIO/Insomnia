// Shared localStorage store for interview requests + student notifications
// Status flow: pending → accepted → slot_booked | declined

const STORAGE_KEY  = 'alumniconnect_interview_requests';
const NOTIF_KEY    = 'alumniconnect_student_notifications';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function getStudentNotifications(studentName) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    return all.filter(n => n.studentName === studentName);
  } catch { return []; }
}

function pushStudentNotification({ studentName, type, title, message, requestId }) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    all.unshift({ id: `notif-${Date.now()}`, studentName, type, title, message, requestId, read: false, createdAt: new Date().toISOString() });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
  } catch {}
}

export function markStudentNotifsRead(studentName) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    const updated = all.map(n => n.studentName === studentName ? { ...n, read: true } : n);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  } catch {}
}

// ── Requests ──────────────────────────────────────────────────────────────────
export function getRequests() { return load(); }

export function sendRequest({ studentName, studentId, alumniName, alumniRole, topic, message, studentProfile }) {
  const requests = load();
  const req = {
    id: `req-${Date.now()}`,
    studentName,
    studentId,
    alumniName,
    alumniRole,
    topic: topic || 'Mock Interview',
    message: message || '',
    status: 'pending',       // pending | accepted | slot_booked | declined
    scheduledTime: null,
    roomId: null,
    createdAt: new Date().toISOString(),
    // Student profile snapshot (populated from localStorage if available)
    studentProfile: studentProfile || null,
  };
  requests.push(req);
  save(requests);
  return req;
}

// Alumni accepts (no slot yet) — status: accepted
export function acceptRequestOnly(requestId) {
  const requests = load();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], status: 'accepted' };
  save(requests);
  // Notify student
  pushStudentNotification({
    studentName: requests[idx].studentName,
    type: 'accepted',
    title: 'Interview Request Accepted! 🎉',
    message: `Your interview request has been accepted by the alumni. They will book a slot for you shortly.`,
    requestId,
  });
  return requests[idx];
}

// Alumni books a slot — status: slot_booked
export function bookSlot(requestId, scheduledTime) {
  const requests = load();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  const roomId = `room-${requestId.slice(-8)}-${Date.now()}`;
  requests[idx] = { ...requests[idx], status: 'slot_booked', scheduledTime, roomId };
  save(requests);
  // Notify student with date/time
  const formatted = new Date(scheduledTime).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  pushStudentNotification({
    studentName: requests[idx].studentName,
    type: 'slot_booked',
    title: 'Interview Slot Confirmed! 📅',
    message: `Your interview request has been accepted. Your interview is scheduled for ${formatted}.`,
    requestId,
  });
  return requests[idx];
}

// Alumni reschedules a booked slot
export function rescheduleSlot(requestId, newScheduledTime) {
  const requests = load();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], scheduledTime: newScheduledTime };
  save(requests);
  const formatted = new Date(newScheduledTime).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  pushStudentNotification({
    studentName: requests[idx].studentName,
    type: 'slot_booked',
    title: 'Interview Rescheduled 🔄',
    message: `Your interview has been rescheduled to ${formatted}.`,
    requestId,
  });
  return requests[idx];
}

// Legacy — kept for backward compat
export function acceptRequest(requestId, scheduledTime) {
  return bookSlot(requestId, scheduledTime);
}

export function declineRequest(requestId) {
  const requests = load();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return;
  const studentName = requests[idx].studentName;
  requests[idx] = { ...requests[idx], status: 'declined' };
  save(requests);
  pushStudentNotification({
    studentName,
    type: 'declined',
    title: 'Interview Request Update',
    message: `Your interview request was not accepted this time. You can send a new request to another mentor.`,
    requestId,
  });
}

export function getRequestsForAlumni(alumniName) {
  return load().filter(r => r.alumniName === alumniName && r.status === 'pending');
}

export function getRequestsByStudent(studentName) {
  return load().filter(r => r.studentName === studentName);
}

export function isJoinable(scheduledTime) {
  if (!scheduledTime) return false;
  const scheduled = new Date(scheduledTime).getTime();
  const now = Date.now();
  return now >= scheduled - 5 * 60 * 1000 && now <= scheduled + 2 * 60 * 60 * 1000;
}

export function formatScheduledTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
