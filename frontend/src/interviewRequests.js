// Shared in-memory + localStorage store for interview requests
// Both student and alumni dashboards read/write this same store.
// In a real app this would be a backend API + websocket push.

const STORAGE_KEY = 'alumniconnect_interview_requests';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function getRequests() {
  return load();
}

// Student sends a request to an alumni
export function sendRequest({ studentName, studentId, alumniName, alumniRole, topic, message }) {
  const requests = load();
  const req = {
    id: `req-${Date.now()}`,
    studentName,
    studentId,
    alumniName,
    alumniRole,
    topic: topic || 'Mock Interview',
    message: message || '',
    status: 'pending',       // pending | accepted | declined
    scheduledTime: null,     // ISO string set when alumni accepts
    roomId: null,            // set when alumni accepts
    createdAt: new Date().toISOString(),
  };
  requests.push(req);
  save(requests);
  return req;
}

// Alumni accepts a request and sets a scheduled time
export function acceptRequest(requestId, scheduledTime) {
  const requests = load();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  const roomId = `room-${requestId.slice(-8)}-${Date.now()}`;
  requests[idx] = { ...requests[idx], status: 'accepted', scheduledTime, roomId };
  save(requests);
  return requests[idx];
}

// Alumni declines a request
export function declineRequest(requestId) {
  const requests = load();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return;
  requests[idx] = { ...requests[idx], status: 'declined' };
  save(requests);
}

// Get requests for a specific alumni (by name)
export function getRequestsForAlumni(alumniName) {
  return load().filter(r => r.alumniName === alumniName && r.status === 'pending');
}

// Get requests sent by a specific student (by name or id)
export function getRequestsByStudent(studentName) {
  return load().filter(r => r.studentName === studentName);
}

// Check if scheduled time has arrived (within 15 min window)
export function isJoinable(scheduledTime) {
  if (!scheduledTime) return false;
  const scheduled = new Date(scheduledTime).getTime();
  const now = Date.now();
  // Allow joining 5 min before and up to 2 hours after
  return now >= scheduled - 5 * 60 * 1000 && now <= scheduled + 2 * 60 * 60 * 1000;
}

// Format scheduled time nicely
export function formatScheduledTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
