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
      include: { student: true }
    });

    // Push notification to student
    let notifPayload = null;
    if (status === 'ACCEPTED') {
      notifPayload = {
        user_id: request.student_id,
        type: 'ACCEPTED',
        title: 'Interview Request Accepted! 🎉',
        message: 'Your interview request has been accepted. The alumni will book a slot shortly.',
        request_id: id,
      };
    } else if (status === 'SLOT_BOOKED') {
      const formatted = new Date(scheduledTime).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      notifPayload = {
        user_id: request.student_id,
        type: 'SLOT_BOOKED',
        title: 'Interview Slot Confirmed! 📅',
        message: `Your interview is scheduled for ${formatted}.`,
        request_id: id,
      };
    } else if (status === 'DECLINED') {
      notifPayload = {
        user_id: request.student_id,
        type: 'DECLINED',
        title: 'Interview Request Update',
        message: 'Your request was not accepted this time. Try another mentor.',
        request_id: id,
      };
    }

    if (notifPayload) {
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
