const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// GET /requests?alumniId=&studentId=
router.get('/', async (req, res) => {
  try {
    const { alumniId, studentId } = req.query;
    let query = supabase
      .from('interview_requests')
      .select(`
        *,
        student:users!interview_requests_student_id_fkey(id, name, email, profile_data),
        alumni:users!interview_requests_alumni_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (alumniId)  query = query.eq('alumni_id', alumniId);
    if (studentId) query = query.eq('student_id', studentId);

    const { data, error } = await query;
    if (error) throw error;

    // Flatten names into top-level fields for easy frontend use
    const result = (data || []).map(r => ({
      ...r,
      student_name: r.student?.name || '',
      alumni_name:  r.alumni?.name  || '',
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /requests — student sends a request
router.post('/', async (req, res) => {
  try {
    const { studentId, alumniId, topic, message, studentProfileSnapshot } = req.body;
    if (!studentId || !alumniId) return res.status(400).json({ error: 'studentId and alumniId are required.' });

    const { data, error } = await supabase
      .from('interview_requests')
      .insert({
        student_id: studentId,
        alumni_id: alumniId,
        topic: topic || 'Mock Interview',
        message: message || '',
        student_profile_snapshot: studentProfileSnapshot || null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /requests/:id — update status (accept, book slot, decline)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduledTime } = req.body;

    const updates = { status };
    if (scheduledTime) {
      updates.scheduled_time = scheduledTime;
      updates.room_id = `room-${id.slice(-8)}-${Date.now()}`;
    }

    const { data: request, error } = await supabase
      .from('interview_requests')
      .update(updates)
      .eq('request_id', id)
      .select()
      .single();

    if (error) throw error;

    // Push notification to student
    let notifPayload = null;
    if (status === 'ACCEPTED') {
      notifPayload = {
        user_id: request.student_id,
        type: 'ACCEPTED',
        title: 'Interview Request Accepted! 🎉',
        message: 'Your interview request has been accepted. The alumni will book a slot shortly.',
        request_id: id,
      };
    } else if (status === 'SLOT_BOOKED') {
      const formatted = new Date(scheduledTime).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      notifPayload = {
        user_id: request.student_id,
        type: 'SLOT_BOOKED',
        title: 'Interview Slot Confirmed! 📅',
        message: `Your interview is scheduled for ${formatted}.`,
        request_id: id,
      };
    } else if (status === 'DECLINED') {
      notifPayload = {
        user_id: request.student_id,
        type: 'DECLINED',
        title: 'Interview Request Update',
        message: 'Your request was not accepted this time. Try another mentor.',
        request_id: id,
      };
    }

    if (notifPayload) {
      await supabase.from('notifications').insert(notifPayload);
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
