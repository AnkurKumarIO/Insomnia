const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /notifications?userId=
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    const data = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(data);
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /notifications — create a new notification
router.post('/', async (req, res) => {
  try {
    const { user_id, type, title, message, request_id } = req.body;
    
    if (!user_id || !type || !title) {
      return res.status(400).json({ error: 'user_id, type, and title are required.' });
    }

    const notification = await prisma.notification.create({
      data: {
        user_id,
        type,
        title,
        message: message || '',
        request_id: request_id || null,
        read: false
      }
    });

    res.json(notification);
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /notifications/read — mark all as read for a user
router.patch('/read', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    await prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /notifications/:notificationId/read — mark a single notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!notificationId || !userId) {
      return res.status(400).json({ error: 'notificationId and userId are required.' });
    }

    const notification = await prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Mark single notification read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /notifications/:notificationId — delete a notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!notificationId || !userId) {
      return res.status(400).json({ error: 'notificationId and userId are required.' });
    }

    await prisma.notification.deleteMany({
      where: { id: notificationId, user_id: userId }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
