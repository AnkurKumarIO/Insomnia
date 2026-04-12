const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const supabase = require('../supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'alumnex_secret_2026';

function makeToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── POST /auth/student/register ───────────────────────────────────────────────
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, username, password, department, college, year } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });

    // Check duplicate
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'An account with this email already exists.' });

    // Create Supabase Auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authErr) throw authErr;

    // Insert profile
    const { data: user, error: insertErr } = await supabase.from('users').insert({
      id:                  authData.user.id,
      role:                'STUDENT',
      name,
      email,
      department:          department || 'General',
      verification_status: 'VERIFIED',
      profile_data:        { college, year, username },
    }).select().single();
    if (insertErr) throw insertErr;

    res.json({ message: 'Registration successful', token: makeToken(user), user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    console.error('Student Register Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/student/login ──────────────────────────────────────────────────
router.post('/student/login', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Support both email and username login
    let userEmail = email;
    if (!userEmail && username) {
      // Look up email by username stored in profile_data
      const { data: users } = await supabase.from('users')
        .select('*').eq('role', 'STUDENT');
      const match = (users || []).find(u =>
        u.profile_data?.username === username || u.email === username
      );
      if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
      userEmail = match.email;
    }

    if (!userEmail || !password) return res.status(400).json({ error: 'Credentials required.' });

    // Sign in via Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email: userEmail, password });
    if (authErr) return res.status(401).json({ error: 'Invalid credentials.' });

    const { data: user } = await supabase.from('users').select('*').eq('email', userEmail).single();
    if (!user || user.role !== 'STUDENT') return res.status(401).json({ error: 'Not a student account.' });

    res.json({ message: 'Login successful', token: makeToken(user), user: { id: user.id, name: user.name, role: user.role, email: user.email, department: user.department, profile_data: user.profile_data } });
  } catch (err) {
    console.error('Student Login Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/alumni/register ────────────────────────────────────────────────
router.post('/alumni/register', async (req, res) => {
  try {
    const { name, email, username, password, department, company, batchYear } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'An account with this email already exists.' });

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (authErr) throw authErr;

    const { data: user, error: insertErr } = await supabase.from('users').insert({
      id:                  authData.user.id,
      role:                'ALUMNI',
      name,
      email,
      department:          department || 'General',
      company:             company || '',
      batch_year:          batchYear ? parseInt(batchYear) : null,
      verification_status: 'VERIFIED',
      profile_data:        { username, company, batchYear },
    }).select().single();
    if (insertErr) throw insertErr;

    res.json({ message: 'Alumni registration successful', token: makeToken(user), user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    console.error('Alumni Register Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/alumni/login ───────────────────────────────────────────────────
router.post('/alumni/login', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    let userEmail = email;
    if (!userEmail && username) {
      const { data: users } = await supabase.from('users').select('*').eq('role', 'ALUMNI');
      const match = (users || []).find(u =>
        u.profile_data?.username === username || u.email === username
      );
      if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
      userEmail = match.email;
    }

    if (!userEmail || !password) return res.status(400).json({ error: 'Credentials required.' });

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email: userEmail, password });
    if (authErr) return res.status(401).json({ error: 'Invalid credentials.' });

    const { data: user } = await supabase.from('users').select('*').eq('email', userEmail).single();
    if (!user || user.role !== 'ALUMNI') return res.status(401).json({ error: 'Not an alumni account.' });

    res.json({ message: 'Login successful', token: makeToken(user), user: { id: user.id, name: user.name, role: user.role, email: user.email, department: user.department, profile_data: user.profile_data } });
  } catch (err) {
    console.error('Alumni Login Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/tnp/login ──────────────────────────────────────────────────────
router.post('/tnp/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username !== (process.env.TNP_USERNAME || 'admin') || password !== (process.env.TNP_PASSWORD || 'tnp_secure_123')) {
      return res.status(401).json({ error: 'Invalid TNP credentials.' });
    }
    const user = { id: 'tnp-001', name: 'TNP Coordinator', role: 'TNP' };
    res.json({ message: 'TNP Login successful', token: makeToken(user), user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
