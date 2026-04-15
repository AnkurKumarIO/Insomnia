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

// POST /users/:id/rating — store an interviewer rating for a candidate
router.post('/:id/rating', async (req, res) => {
  try {
    const candidateId = req.params.id;
    const { rating, feedback, interviewerName, interviewerId, roomId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Try to find the candidate by id or by name
    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { id: candidateId } });
    } catch (_) {}

    // If not found by id, try finding by name (candidateId might be a name string)
    if (!user) {
      try {
        user = await prisma.user.findFirst({ where: { name: candidateId } });
      } catch (_) {}
    }

    const ratingEntry = {
      rating: Number(rating),
      feedback: feedback || '',
      interviewerName: interviewerName || 'Anonymous',
      interviewerId: interviewerId || null,
      roomId: roomId || null,
      date: new Date().toISOString(),
    };

    if (user) {
      // Append rating to profile_data
      const profileData = JSON.parse(user.profile_data || '{}');
      if (!profileData.ratings) profileData.ratings = [];
      profileData.ratings.unshift(ratingEntry);

      // Calculate average rating
      const allRatings = profileData.ratings.map(r => r.rating);
      profileData.averageRating = Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10;
      profileData.totalRatings = allRatings.length;

      await prisma.user.update({
        where: { id: user.id },
        data: { profile_data: JSON.stringify(profileData) },
      });

      res.json({ success: true, message: 'Rating saved', averageRating: profileData.averageRating, totalRatings: profileData.totalRatings });
    } else {
      // User not in DB — still return success (rating stored in localStorage on frontend)
      console.warn(`[Rating] Candidate "${candidateId}" not found in DB — rating stored client-side only`);
      res.json({ success: true, message: 'Rating acknowledged (candidate not in DB)', clientOnly: true });
    }
  } catch (err) {
    console.error('Rating save error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
