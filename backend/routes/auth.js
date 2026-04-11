const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const supabase = require('../supabase');

const upload = multer({ dest: 'uploads/' });

// Simulate OCR extraction (mock)
const simulateOCRExtraction = async () => ({
  extracted_name: 'Alice Johnson',
  extracted_college_id: 'STU1001',
});

// POST /auth/student/verify
router.post('/student/verify', upload.single('idDocument'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No document uploaded.' });

    const ocrData = await simulateOCRExtraction(file);

    // Look up student in college_registry table
    const { data: match, error: regErr } = await supabase
      .from('college_registry')
      .select('*')
      .eq('college_id', ocrData.extracted_college_id)
      .eq('name', ocrData.extracted_name)
      .single();

    if (regErr || !match) {
      return res.status(401).json({ error: 'Verification failed. Student not found in college registry.' });
    }

    const email = `${match.college_id.toLowerCase()}@alumniconnect.edu`;

    // Check if user already exists
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      // Create auth user + profile row
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password: `${match.college_id}_auto_${Date.now()}`,
        email_confirm: true,
      });
      if (authErr) throw authErr;

      const { data: newUser, error: insertErr } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          role: 'STUDENT',
          name: match.name,
          email,
          department: match.department,
          college_id: match.college_id,
          verification_status: 'VERIFIED',
        })
        .select()
        .single();
      if (insertErr) throw insertErr;
      user = newUser;
    } else {
      await supabase
        .from('users')
        .update({ verification_status: 'VERIFIED' })
        .eq('id', user.id);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'hackathon_secret',
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Verification successful',
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('OCR Verification Error:', error);
    res.status(500).json({ error: 'Internal Server Error during verification.' });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

// POST /auth/tnp/login
router.post('/tnp/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const validUsername = process.env.TNP_USERNAME || 'admin';
    const validPassword = process.env.TNP_PASSWORD || 'tnp_secure_123';

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({ error: 'Invalid TNP credentials.' });
    }

    const tnpEmail = 'tnp@alumniconnect.edu';
    let { data: tnpUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', tnpEmail)
      .single();

    if (!tnpUser) {
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: tnpEmail,
        password: validPassword,
        email_confirm: true,
      });
      if (authErr) throw authErr;

      const { data: newUser, error: insertErr } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          role: 'TNP',
          name: 'TNP Coordinator',
          email: tnpEmail,
          verification_status: 'VERIFIED',
        })
        .select()
        .single();
      if (insertErr) throw insertErr;
      tnpUser = newUser;
    }

    const token = jwt.sign(
      { userId: tnpUser.id, role: tnpUser.role, permissions: ['admin'] },
      process.env.JWT_SECRET || 'hackathon_secret',
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'TNP Login successful',
      token,
      user: { id: tnpUser.id, role: tnpUser.role },
    });
  } catch (error) {
    console.error('TNP Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

// POST /auth/alumni/login
router.post('/alumni/login', async (req, res) => {
  try {
    const { name, email, department } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password: `alumni_${Date.now()}`,
        email_confirm: true,
      });
      if (authErr) throw authErr;

      const { data: newUser, error: insertErr } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          role: 'ALUMNI',
          name,
          email,
          department: department || 'General',
          verification_status: 'VERIFIED',
        })
        .select()
        .single();
      if (insertErr) throw insertErr;
      user = newUser;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'hackathon_secret',
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Alumni login successful',
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (error) {
    console.error('Alumni Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

module.exports = router;
