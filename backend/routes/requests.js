const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /requests?alumniId=&studentId=
router.get('/', async (req, res) => {
  try {
    const { alumniId, studentId } = req.query;
    const where = {};
    if (alumniId)  where.alumni_id = alumniId;
    if (studentId) where.student_id = studentId;

    const data = await prisma.interviewRequest.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, email: true, profile_data: true }
        },
        alumni: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Flatten names and parse profile_data for easy frontend use
    const result = (data || []).map(r => ({
      ...r,
      id:           r.request_id, // Alias for frontend compat
      student_name: r.student?.name || '',
      alumni_name:  r.alumni?.name   || '',
      student_profile_snapshot: r.student_profile_snapshot ? JSON.parse(r.student_profile_snapshot) : (r.student?.profile_data ? JSON.parse(r.student.profile_data) : null),
    }));

    res.json(result);
  } catch (err) {
    console.error('Fetch requests error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /requests — student sends a request
router.post('/', async (req, res) => {
  try {
    const { studentId, alumniId, topic, message, studentProfileSnapshot } = req.body;
    if (!studentId || !alumniId) return res.status(400).json({ error: 'studentId and alumniId are required.' });

    const request = await prisma.interviewRequest.create({
      data: {
        student_id: studentId,
        alumni_id: alumniId,
        topic: topic || 'Mock Interview',
        message: message || '',
        student_profile_snapshot: studentProfileSnapshot ? JSON.stringify(studentProfileSnapshot) : null,
        status: 'PENDING',
      },
      include: { student: true, alumni: true }
    });

    // Notify alumni of new request
    await prisma.notification.create({
      data: {
        user_id: alumniId,
        type: 'NEW_REQUEST',
        title: 'New Interview Request! 📬',
        message: `${request.student?.name || 'A student'} requested an interview for ${topic || 'Mock Interview'}.`,
        request_id: request.request_id,
      }
    });

    res.json({ ...request, id: request.request_id });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /requests/:id — update status (accept, book slot, decline)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduledTime } = req.body;

    const updates = { status };
    if (scheduledTime) {
      updates.scheduled_time = new Date(scheduledTime);
      updates.room_id = `room-${id.slice(-8)}-${Date.now()}`;
    }

    const request = await prisma.interviewRequest.update({
      where: { request_id: id },
      data: updates,
      include: { student: true, alumni: true }
    });

    // Push notifications to both student and alumni
    const notificationsToCreate = [];

    if (status === 'ACCEPTED') {
      // Notify student that alumni accepted
      notificationsToCreate.push({
        user_id: request.student_id,
        type: 'ACCEPTED',
        title: 'Interview Request Accepted! 🎉',
        message: `${request.alumni?.name || 'The alumni'} has accepted your request. Waiting for slot confirmation.`,
        request_id: id,
      });
    } else if (status === 'SLOT_BOOKED') {
      const formatted = new Date(scheduledTime).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      
      // Notify student of confirmed slot
      notificationsToCreate.push({
        user_id: request.student_id,
        type: 'SLOT_BOOKED',
        title: 'Interview Slot Confirmed! 📅',
        message: `Your interview with ${request.alumni?.name || 'the alumni'} is scheduled for ${formatted}.`,
        request_id: id,
      });

      // Notify alumni of confirmed slot
      notificationsToCreate.push({
        user_id: request.alumni_id,
        type: 'SLOT_BOOKED_ALUMNI',
        title: 'Interview Slot Confirmed! 📅',
        message: `Your interview with ${request.student?.name || 'the student'} is scheduled for ${formatted}.`,
        request_id: id,
      });
    } else if (status === 'DECLINED') {
      // Notify student of decline
      notificationsToCreate.push({
        user_id: request.student_id,
        type: 'DECLINED',
        title: 'Interview Request Update',
        message: `${request.alumni?.name || 'The alumni'} declined your request. Try another mentor.`,
        request_id: id,
      });
    }

    // Create all notifications
    for (const notifPayload of notificationsToCreate) {
      await prisma.notification.create({
        data: notifPayload
      });
    }

    res.json({ ...request, id: request.request_id });
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
