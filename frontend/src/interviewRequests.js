// Interview requests — backed by Supabase directly from frontend
// Falls back to localStorage when Supabase is unreachable

import { createRequest as dbCreateRequest, getRequestsForAlumni as dbGetRequestsForAlumni, getRequestsForStudent, updateRequest as dbUpdateRequest, createNotification } from './lib/db';

const STORAGE_KEY = 'alumnex_interview_requests';
const NOTIF_KEY   = 'alumniconnect_student_notifications';

// ── localStorage helpers (fallback) ──────────────────────────────────────────
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveLocal(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}
function pushLocalNotif({ studentName, type, title, message, requestId, roomId }) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    all.unshift({ id: `notif-${Date.now()}`, studentName, type, title, message, requestId, roomId: roomId || null, read: false, createdAt: new Date().toISOString() });
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

export async function markStudentNotifsRead(studentName, studentId) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    const updated = all.map(n => n.studentName === studentName ? { ...n, read: true } : n);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    
    // Also sync to DB if we have the ID
    let realStudentId = studentId;
    if (!realStudentId) {
      const authUser = JSON.parse(localStorage.getItem('alumnex_user') || '{}');
      if (authUser.id && authUser.name === studentName) realStudentId = authUser.id;
    }
    if (realStudentId && !String(realStudentId).startsWith('stu-')) {
      const { markNotificationsRead } = await import('./lib/db');
      await markNotificationsRead(realStudentId);
    }
  } catch {}
}

// ── Send a request (student → alumni) ────────────────────────────────────────

export async function sendRequest({ studentName, studentId, alumniName, alumniRole, topic, message, studentProfile, alumniId }) {
  // Get the real student UUID from auth context
  let realStudentId = studentId;
  try {
    const authUser = JSON.parse(localStorage.getItem('alumnex_user') || '{}');
    if (authUser.id && !authUser.id.startsWith('stu-') && !authUser.id.startsWith('alm-')) {
      realStudentId = authUser.id;
    }
  } catch {}

  const hasRealIds = realStudentId && alumniId &&
    !String(realStudentId).startsWith('stu-') && !String(alumniId).startsWith('alm-');

  if (hasRealIds) {
    try {
      const result = await dbCreateRequest({
        studentId: realStudentId,
        alumniId,
        topic:    topic   || 'Mock Interview',
        message:  message || '',
        studentProfileSnapshot: studentProfile || null,
      });

      if (result?.request_id) {
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
      console.warn('sendRequest: Supabase failed, falling back to localStorage', e.message);
    }
  } else {
    console.warn('sendRequest: missing real UUIDs — studentId:', realStudentId, 'alumniId:', alumniId);
  }

  // Fallback — localStorage only
  const local = loadLocal();
  const req = {
    id:            `req-${Date.now()}`,
    studentName,
    studentId:     realStudentId || studentId,
    alumniName,
    alumniId:      alumniId || '',
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
      const data = await dbGetRequestsForAlumni(alumniId);
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return loadLocal();
}

// ── Sync local requests from DB for a student ─────────────────────────────────

export async function syncStudentRequests(studentId) {
  try {
    if (studentId) {
      const data = await getRequestsForStudent(studentId);
      if (Array.isArray(data)) {
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
            status:        (dbReq.status || 'PENDING').toLowerCase(),
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
  try {
    await dbUpdateRequest(requestId, { status: 'ACCEPTED' });
  } catch (e) { console.warn('acceptRequestOnly DB error:', e.message); }

  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], status: 'accepted' };
  saveLocal(requests);

  // Push notification to student in Supabase
  try {
    const req = requests[idx];
    const authUser = JSON.parse(localStorage.getItem('alumnex_user') || '{}');
    if (req.studentId && !String(req.studentId).startsWith('stu-')) {
      await createNotification({
        userId:    req.studentId,
        type:      'ACCEPTED',
        title:     'Interview Request Accepted! 🎉',
        message:   'Your interview request has been accepted. The alumni will book a slot shortly.',
        requestId,
      });
    }
  } catch {}

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
  // roomId derived ONLY from requestId — same on every device, no Date.now()
  const roomId = `room-${requestId.replace(/[^a-z0-9]/gi, '').slice(-16).toLowerCase()}`;
  try {
    await dbUpdateRequest(requestId, { status: 'SLOT_BOOKED', scheduledTime, roomId });
  } catch (e) { console.warn('bookSlot DB error:', e.message); }

  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], status: 'slot_booked', scheduledTime, roomId };
  saveLocal(requests);

  const formatted = new Date(scheduledTime).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  try {
    const req = requests[idx];
    if (req.studentId && !String(req.studentId).startsWith('stu-')) {
      await createNotification({
        userId:    req.studentId,
        type:      'SLOT_BOOKED',
        title:     'Interview Slot Confirmed! 📅',
        message:   `Your interview is scheduled for ${formatted}.`,
        requestId,
      });
    }
  } catch {}

  const isInstant = Math.abs(new Date(scheduledTime).getTime() - Date.now()) < 60000;
  pushLocalNotif({
    studentName: requests[idx].studentName,
    type:        isInstant ? 'live' : 'slot_booked',
    title:       isInstant ? '🔴 Interview is Live Now!' : 'Interview Slot Confirmed! 📅',
    message:     isInstant
      ? 'Your mock interview is starting now. Click Join to enter the room.'
      : `Your interview is scheduled for ${formatted}.`,
    requestId,
    roomId,
  });
  return requests[idx];
}

// ── Reschedule (alumni) ───────────────────────────────────────────────────────

export async function rescheduleSlot(requestId, newScheduledTime) {
  try {
    await dbUpdateRequest(requestId, { status: 'SLOT_BOOKED', scheduledTime: newScheduledTime });
  } catch (e) { console.warn('rescheduleSlot DB error:', e.message); }

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
    await dbUpdateRequest(requestId, { status: 'DECLINED' });
  } catch (e) { console.warn('declineRequest DB error:', e.message); }

  const requests = loadLocal();
  const idx = requests.findIndex(r => r.id === requestId);
  if (idx === -1) return;
  const studentName = requests[idx].studentName;
  requests[idx] = { ...requests[idx], status: 'declined' };
  saveLocal(requests);

  try {
    const req = requests[idx];
    if (req.studentId && !String(req.studentId).startsWith('stu-')) {
      await createNotification({
        userId:    req.studentId,
        type:      'DECLINED',
        title:     'Interview Request Update',
        message:   'Your request was not accepted this time. Try another mentor.',
        requestId,
      });
    }
  } catch {}

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
