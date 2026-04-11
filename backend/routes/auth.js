const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

// Simulate OCR extraction (mock for hackathon)
const simulateOCRExtraction = async (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        extracted_name: "Alice Johnson",
        extracted_college_id: "STU1001"
      });
    }, 500);
  });
};

const collegeDbPath = path.join(__dirname, '..', 'college_db.json');

// POST /auth/student/verify
router.post('/student/verify', upload.single('idDocument'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No document uploaded.' });
    }

    const ocrData = await simulateOCRExtraction(file);
    const collegeDb = JSON.parse(fs.readFileSync(collegeDbPath, 'utf8'));

    const match = collegeDb.find(
      (s) => s.college_id === ocrData.extracted_college_id && s.name === ocrData.extracted_name
    );

    if (!match) {
      return res.status(401).json({ error: 'Verification failed. Student not found in college registry.' });
    }

    const email = `${match.college_id.toLowerCase()}@alumniconnect.edu`;
    let user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          role: 'STUDENT',
          name: match.name,
          email,
          department: match.department,
          verification_status: 'VERIFIED'
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { verification_status: 'VERIFIED' }
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'hackathon_secret',
      { expiresIn: '24h' }
    );

    return res.json({ message: 'Verification successful', token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error('OCR Verification Error:', error);
    res.status(500).json({ error: 'Internal Server Error during verification.' });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
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

    let tnpUser = await prisma.user.findUnique({ where: { email: 'tnp@alumniconnect.edu' } });

    if (!tnpUser) {
      tnpUser = await prisma.user.create({
        data: {
          role: 'TNP',
          name: 'TNP Coordinator',
          email: 'tnp@alumniconnect.edu',
          verification_status: 'VERIFIED'
        }
      });
    }

    const token = jwt.sign(
      { userId: tnpUser.id, role: tnpUser.role, permissions: ['admin'] },
      process.env.JWT_SECRET || 'hackathon_secret',
      { expiresIn: '24h' }
    );

    return res.json({ message: 'TNP Login successful', token, user: { id: tnpUser.id, role: tnpUser.role } });
  } catch (error) {
    console.error('TNP Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

// POST /auth/alumni/login (simple email-based for demo)
router.post('/alumni/login', async (req, res) => {
  try {
    const { name, email, department } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          role: 'ALUMNI',
          name,
          email,
          department: department || 'General',
          verification_status: 'VERIFIED'
        }
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'hackathon_secret',
      { expiresIn: '24h' }
    );

    return res.json({ message: 'Alumni login successful', token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Alumni Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

module.exports = router;
