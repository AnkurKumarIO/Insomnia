const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// GET /alumni — return all verified alumni with their profile data
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, department, company, batch_year, profile_data')
      .eq('role', 'ALUMNI')
      .eq('verification_status', 'VERIFIED')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
