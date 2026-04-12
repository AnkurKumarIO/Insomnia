const express = require('express');
const router  = express.Router();
const supabase = require('../supabase');

// PATCH /interview-records/:id
// Updates alumni_feedback, student_score, and/or status on an interview record.
// Used by the Alumni RatingReviewForm after session ends.
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { alumni_feedback, student_score, status } = req.body;

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase not configured on this server.' });
  }

  const updates = {};
  if (alumni_feedback !== undefined) updates.alumni_feedback = alumni_feedback;
  if (student_score   !== undefined) updates.student_score   = student_score;
  if (status          !== undefined) updates.status          = status;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('interview_records')
    .update(updates)
    .eq('interview_id', id)
    .select()
    .single();

  if (error) {
    console.error('PATCH /interview-records/:id error:', error.message);
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

module.exports = router;
