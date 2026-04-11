/**
 * Direct Supabase data layer — used when backend is unreachable.
 * Handles: user registration, login lookup, profile save, requests, notifications.
 */
import { supabase } from './supabaseClient';

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUserByEmail(email) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  return data || null;
}

export async function getUserById(id) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  return data || null;
}

export async function createUser({ id, role, name, email, department, college, year, username, password }) {
  // Sign in first to get an authenticated session so RLS allows the insert
  if (password) {
    await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      id,
      role,
      name,
      email,
      department: department || 'General',
      verification_status: 'VERIFIED',
      profile_data: { college, year, username },
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId, profileData) {
  // Try with current session first
  const { data, error } = await supabase
    .from('users')
    .update({ profile_data: profileData, ...(profileData.department ? { department: profileData.department } : {}) })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.warn('updateUserProfile error:', error.message);
    throw error;
  }
  return data;
}

export async function getAllAlumni() {
  const { data } = await supabase
    .from('users')
    .select('id, name, email, department, company, batch_year, profile_data')
    .eq('role', 'ALUMNI')
    .eq('verification_status', 'VERIFIED')
    .order('created_at', { ascending: true });
  return data || [];
}

// ── Interview Requests ────────────────────────────────────────────────────────

export async function createRequest({ studentId, alumniId, topic, message, studentProfileSnapshot }) {
  const { data, error } = await supabase
    .from('interview_requests')
    .insert({
      student_id: studentId,
      alumni_id:  alumniId,
      topic:      topic   || 'Mock Interview',
      message:    message || '',
      student_profile_snapshot: studentProfileSnapshot || null,
      status: 'PENDING',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getRequestsForAlumni(alumniId) {
  const { data } = await supabase
    .from('interview_requests')
    .select(`
      *,
      student:users!interview_requests_student_id_fkey(id, name, email, profile_data)
    `)
    .eq('alumni_id', alumniId)
    .order('created_at', { ascending: false });

  return (data || []).map(r => ({
    ...r,
    student_name: r.student?.name || '',
  }));
}

export async function getRequestsForStudent(studentId) {
  const { data } = await supabase
    .from('interview_requests')
    .select(`
      *,
      alumni:users!interview_requests_alumni_id_fkey(id, name, email, company, profile_data)
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  return (data || []).map(r => ({
    ...r,
    alumni_name: r.alumni?.name || '',
  }));
}

export async function updateRequest(requestId, updates) {
  const payload = {};
  if (updates.status)        payload.status         = updates.status.toUpperCase().replace('SLOT_BOOKED','SLOT_BOOKED');
  if (updates.scheduledTime) payload.scheduled_time = updates.scheduledTime;
  if (updates.roomId)        payload.room_id        = updates.roomId;

  const { data, error } = await supabase
    .from('interview_requests')
    .update(payload)
    .eq('request_id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function createNotification({ userId, type, title, message, requestId }) {
  await supabase.from('notifications').insert({
    user_id:    userId,
    type:       type.toUpperCase(),
    title,
    message,
    request_id: requestId || null,
  });
}

export async function getNotificationsForUser(userId) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function markNotificationsRead(userId) {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

// ── Platform Stats ────────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const [s, a, i] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'STUDENT').eq('verification_status', 'VERIFIED'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'ALUMNI').eq('verification_status', 'VERIFIED'),
    supabase.from('interview_records').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
  ]);
  return { verified_students: s.count || 0, active_mentors: a.count || 0, mock_interviews: i.count || 0, scheduled_today: 0 };
}

export async function getPendingUsers() {
  const { data } = await supabase
    .from('users')
    .select('id, name, role, department, email, verification_status, created_at')
    .eq('verification_status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(20);
  return data || [];
}

export async function verifyUser(id, status) {
  const { data } = await supabase
    .from('users')
    .update({ verification_status: status })
    .eq('id', id)
    .select()
    .single();
  return data;
}
