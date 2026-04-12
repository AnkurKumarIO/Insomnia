const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// PATCH /users/:id/profile — save full profile data
router.patch('/:id/profile', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      bio, linkedin, github, portfolio,
      department, skills, cgpa, college, year,
      resumeName, projects, targetRoles,
      preferredCompanies, openTo, gradMonth, gradYear,
      name, email,
    } = req.body;

    const profileDataObj = {
      bio, linkedin, github, portfolio,
      skills, cgpa, college, year,
      resumeName, projects, targetRoles,
      preferredCompanies, openTo,
      gradMonth, gradYear,
      profileCompletedAt: new Date().toISOString(),
    };

    const updates = { profile_data: JSON.stringify(profileDataObj) };
    if (department) updates.department = department;
    if (name)       updates.name = name;
    if (email)      updates.email = email;

    const user = await prisma.user.update({
      where: { id },
      data: updates
    });

    const result = {
      ...user,
      profile_data: JSON.parse(user.profile_data || '{}')
    };

    res.json({ message: 'Profile saved', user: result });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = {
      ...user,
      profile_data: JSON.parse(user.profile_data || '{}')
    };

    res.json(result);
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /users/by-email/:email
router.get('/by-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = {
      ...user,
      profile_data: JSON.parse(user.profile_data || '{}')
    };

    res.json(result);
  } catch (err) {
    console.error('Fetch user by email error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
