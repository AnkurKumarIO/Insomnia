const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// GET /stats/platform — TNP dashboard stats from real data
router.get('/platform', async (req, res) => {
  try {
    const [studentsRes, alumniRes, interviewsRes, requestsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'STUDENT').eq('verification_status', 'VERIFIED'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'ALUMNI').eq('verification_status', 'VERIFIED'),
      supabase.from('interview_records').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
      supabase.from('interview_requests').select('id', { count: 'exact', head: true }).eq('status', 'SLOT_BOOKED'),
    ]);

    res.json({
      verified_students: studentsRes.count || 0,
      active_mentors:    alumniRes.count  || 0,
      mock_interviews:   interviewsRes.count || 0,
      scheduled_today:   requestsRes.count  || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/interviews?userId= — interview records for a student
router.get('/interviews', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const { data, error } = await supabase
      .from('interview_records')
      .select('*')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /stats/pending-users — users with PENDING verification for TNP queue
router.get('/pending-users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, role, department, email, verification_status, created_at')
      .eq('verification_status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /stats/verify/:id — TNP approves a user
router.patch('/verify/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // VERIFIED or REJECTED

    const { data, error } = await supabase
      .from('users')
      .update({ verification_status: status || 'VERIFIED' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
