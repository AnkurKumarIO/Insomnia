// Interview requests — backed by Supabase via the backend API
// Falls back to localStorage when backend is unreachable (offline/mock mode)

import { api } from './api';

const STORAGE_KEY = 'alumniconnect_interview_requests';
const NOTIF_KEY   = 'alumniconnect_student_notifications';

// ── localStorage helpers (fallback) ──────────────────────────────────────────
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveLocal(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}
function pushLocalNotif({ studentName, type, title, message, requestId }) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    all.unshift({ id: `notif-${Date.now()}`, studentName, type, title, message, requestId, read: false, createdAt: new Date().toISOString() });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
  } catch {}
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function getStudentNotifications(studentName) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    return all.filter(n => n.studentName === studentName);
  } catch { return []; }
}

export function markStudentNotifsRead(studentName) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    const updated = all.map(n => n.studentName === studentName ? { ...n, read: true } : n);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  } catch {}
}

// ── Send a request (student → alumni) ────────────────────────────────────────

export async function sendRequest({ studentName, studentId, alumniName, alumniRole, topic, message, studentProfile, alumniId }) {
  // Get the real student UUID from auth context
  let realStudentId = studentId;
  try {
    const authUser = JSON.parse(localStorage.getItem('alumniconnect_user') || '{}');
    if (authUser.id && !authUser.id.startsWith('stu-') && !authUser.id.startsWith('alm-')) {
      realStudentId = authUser.id; // real Supabase UUID
    }
  } catch {}

  // Try backend first — only if we have real UUIDs
  const hasRealIds = realStudentId && alumniId &&
    !realStudentId.startsWith('stu-') && !alumniId.startsWith('alm-');

  if (hasRealIds) {
    try {
      const result = await api.createRequest({
        studentId: realStudentId,
        alumniId,
        topic:    topic   || 'Mock Interview',
        message:  message || '',
        studentProfileSnapshot: studentProfile || null,
      });
      if (result && result.request_id) {
        // Mirror to localStorage so BookButton reads it instantly
        const local = loadLocal();
        local.push({
          id:            result.request_id,
          studentName,
          studentId:     realStudentId,
          alumniName,
          alumniRole,
          topic:         result.topic,
          message:       result.message || '',
          status:        'pending',
          scheduledTime: null,
          roomId:        null,
          createdAt:     result.created_at || new Date().toISOString(),
          studentProfile,
        });
        saveLocal(local);
        return result;
      }
    } catch (e) {
      console.warn('sendRequest: backend failed, falling back to localStorage', e.message);
    }
  } else {
    console.warn('sendRequest: missing real UUIDs — studentId:', realStudentId, 'alumniId:', alumniId, '— using localStorage only');
  }

  // Fallback — localStorage only
  const local = loadLocal();
  const req = {
    id:            `req-${Date.now()}`,
    studentName,
    studentId:     realStudentId || studentId,
    alumniName,
    alumniRole,
    topic:         topic   || 'Mock Interview',
    message:       message || '',
    status:        'pending',
    scheduledTime: null,
    roomId:        null,
    createdAt:     new Date().toISOString(),
    studentProfile: studentProfile || null,
  };
  local.push(req);
  saveLocal(local);
  return req;
}

// Normalize DB status (PENDING/ACCEPTED/SLOT_BOOKED/DECLINED) → local (pending/accepted/slot_booked/declined)
function normalizeStatus(status) {
  if (!status) return 'pending';
  return status.toLowerCase().replace('slot_booked', 'slot_booked');
}

// ── Get all requests (for alumni dashboard) ───────────────────────────────────

export async function getRequestsFromDB(alumniId) {
  try {
    if (alumniId) {
      const data = await api.getRequests({ alumniId });
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return loadLocal();
}

// ── Sync local requests from DB for a student ─────────────────────────────────

export async function syncStudentRequests(studentId) {
  try {
    if (studentId) {
      const data = await api.getRequests({ studentId });
      if (Array.isArray(data)) {
        // Merge DB records into localStorage
        const local = loadLocal();
        data.forEach(dbReq => {
          const idx = local.findIndex(r => r.id === dbReq.request_id);
          const mapped = {
            id:            dbReq.request_id,
            studentName:   dbReq.student_name || '',
            studentId:     dbReq.student_id,
            alumniName:    dbReq.alumni_name  || '',
            alumniRole:    '',
            topic:         dbReq.topic,
            message:       dbReq.message,
            status:        dbReq.status?.toLowerCase().replace('_booked', '_booked') || 'pending',
            scheduledTime: dbReq.scheduled_time || null,
            roomId:        dbReq.room_id || null,
            createdAt:     dbReq.created_at,
            studentProfile: dbReq.student_profile_snapshot || null,
          };
          if (idx === -1) local.push(mapped);
          else local[idx] = { ...local[idx], ...mapped };
        });
        saveLocal(local);
      }
    }
  } catch {}
}

// ── localStorage-based reads (used by BookButton, etc.) ──────────────────────

export function getRequests() { return loadLocal(); }

export function getRequestsForAlumni(alumniName) {
  return loadLocal().filter(r => r.alumniName === alumniName && r.status === 'pending');
}

export function getRequestsByStudent(studentName) {
  return loadLocal().filter(r => r.studentName === studentName);
}

// ── Accept (alumni) ───────────────────────────────────────────────────────────

export async function acceptRequestOnly(requestId) {
  // Update backend
  try {
    await api.updateRequest(requestId, { status: 'ACCEPTED' });
  } catch {}

  // Update localStorage
  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], status: 'accepted' };
  saveLocal(requests);

  pushLocalNotif({
    studentName: requests[idx].studentName,
    type:        'accepted',
    title:       'Interview Request Accepted! 🎉',
    message:     'Your interview request has been accepted. The alumni will book a slot shortly.',
    requestId,
  });
  return requests[idx];
}

// ── Book slot (alumni) ────────────────────────────────────────────────────────

export async function bookSlot(requestId, scheduledTime) {
  try {
    await api.updateRequest(requestId, { status: 'SLOT_BOOKED', scheduledTime });
  } catch {}

  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  const roomId = `room-${requestId.slice(-8)}-${Date.now()}`;
  requests[idx] = { ...requests[idx], status: 'slot_booked', scheduledTime, roomId };
  saveLocal(requests);

  const formatted = new Date(scheduledTime).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  pushLocalNotif({
    studentName: requests[idx].studentName,
    type:        'slot_booked',
    title:       'Interview Slot Confirmed! 📅',
    message:     `Your interview is scheduled for ${formatted}.`,
    requestId,
  });
  return requests[idx];
}

// ── Reschedule (alumni) ───────────────────────────────────────────────────────

export async function rescheduleSlot(requestId, newScheduledTime) {
  try {
    await api.updateRequest(requestId, { status: 'SLOT_BOOKED', scheduledTime: newScheduledTime });
  } catch {}

  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], scheduledTime: newScheduledTime };
  saveLocal(requests);

  const formatted = new Date(newScheduledTime).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  pushLocalNotif({
    studentName: requests[idx].studentName,
    type:        'slot_booked',
    title:       'Interview Rescheduled 🔄',
    message:     `Your interview has been rescheduled to ${formatted}.`,
    requestId,
  });
  return requests[idx];
}

// ── Decline (alumni) ──────────────────────────────────────────────────────────

export async function declineRequest(requestId) {
  try {
    await api.updateRequest(requestId, { status: 'DECLINED' });
  } catch {}

  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return;
  const studentName = requests[idx].studentName;
  requests[idx] = { ...requests[idx], status: 'declined' };
  saveLocal(requests);

  pushLocalNotif({
    studentName,
    type:    'declined',
    title:   'Interview Request Update',
    message: 'Your request was not accepted this time. Try another mentor.',
    requestId,
  });
}

// ── Legacy compat ─────────────────────────────────────────────────────────────

export function acceptRequest(requestId, scheduledTime) {
  return bookSlot(requestId, scheduledTime);
}

export function isJoinable(scheduledTime) {
  if (!scheduledTime) return false;
  const scheduled = new Date(scheduledTime).getTime();
  const now = Date.now();
  return now >= scheduled - 5 * 60 * 1000 && now <= scheduled + 2 * 60 * 60 * 1000;
}

export function formatScheduledTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
