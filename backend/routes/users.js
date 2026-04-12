const express = require('express');
const router = express.Router();
const supabase = require('../supabase');

// PATCH /users/:id/profile — save full profile data
router.patch('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bio, linkedin, github, portfolio,
      department, skills, cgpa, college, year,
      resumeName, projects, targetRoles,
      preferredCompanies, openTo, gradMonth, gradYear,
      name, email, profileComplete,
    } = req.body;

    const profile_data = {
      bio, linkedin, github, portfolio,
      skills, cgpa, college, year,
      resumeName, projects, targetRoles,
      preferredCompanies, openTo,
      gradMonth, gradYear,
      profileCompletedAt: new Date().toISOString(),
    };

    const updates = { profile_data };
    if (department) updates.department = department;
    if (name)       updates.name = name;
    if (email)      updates.email = email;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Profile saved', user: data });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/by-email/:email
router.get('/by-email/:email', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', decodeURIComponent(req.params.email))
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: 'User not found' });
  }
});

module.exports = router;
