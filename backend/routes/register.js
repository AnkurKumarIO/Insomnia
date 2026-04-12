const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// POST /register/student
router.post('/student', async (req, res) => {
  try {
    const { name, email, department, college, year, username, password } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

    // Check if already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.json({ message: 'User already exists', user: existing });
    }

    // Create Supabase auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: password || `student_${Date.now()}`,
      email_confirm: true,
    });
    if (authErr) throw authErr;

    // Insert profile row
    const { data: user, error: insertErr } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        role: 'STUDENT',
        name,
        email,
        department: department || 'General',
        verification_status: 'VERIFIED',
        profile_data: { college, year, username },
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.json({ message: 'Student registered successfully', user });
  } catch (err) {
    console.error('Student register error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
