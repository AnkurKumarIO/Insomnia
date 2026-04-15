const {
  generateSocraticHint,
  analyzeSpokenChunk,
  factCheck,
} = require('../services/aiService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = (io) => {
  const ns = io.of('/interview');

  // Track who is in each room: Map<roomId, Set<{socketId, userId}>>
  const rooms = new Map();

  ns.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Room management ──────────────────────────────────────────────────
    socket.on('join-room', async (roomId, userId) => {
      socket.join(roomId);
      socket.data = { roomId, userId };

      // Track membership
      if (!rooms.has(roomId)) rooms.set(roomId, new Map());
      const members = rooms.get(roomId);
      members.set(socket.id, userId);

      console.log(`[${roomId}] ${userId} joined (${members.size} in room)`);

      // Tell the joiner about everyone already in the room
      const existingUsers = [];
      for (const [sid, uid] of members.entries()) {
        if (sid !== socket.id) existingUsers.push(uid);
      }
      if (existingUsers.length > 0) {
        socket.emit('room-users', existingUsers);
      }

      // Tell existing members about the new joiner
      socket.to(roomId).emit('user-connected', userId);

      // When both users are present, create a "meeting live" notification
      if (members.size === 2) {
        try {
          // Extract request ID from room ID (format: room-xxxxx-timestamp)
          const roomIdParts = roomId.match(/room-([a-z0-9]+)-(\d+)/i);
          if (roomIdParts && roomIdParts[1]) {
            // Get the request to find student and alumni IDs
            const request = await prisma.interviewRequest.findUnique({
              where: { request_id: roomIdParts[1] },
              select: { student_id: true, alumni_id: true, student: { select: { name: true } }, alumni: { select: { name: true } } }
            });

            if (request) {
              // Notify both student and alumni that meeting is live
              const meetingLiveNotifs = [
                {
                  user_id: request.student_id,
                  type: 'MEETING_LIVE',
                  title: 'Interview is Live! 🎥',
                  message: `Your interview with ${request.alumni?.name || 'the alumni'} is starting now!`,
                  request_id: roomIdParts[1],
                },
                {
                  user_id: request.alumni_id,
                  type: 'MEETING_LIVE',
                  title: 'Interview is Live! 🎥',
                  message: `Your interview with ${request.student?.name || 'the student'} is starting now!`,
                  request_id: roomIdParts[1],
                }
              ];

              for (const notif of meetingLiveNotifs) {
                await prisma.notification.create({ data: notif });
              }
              console.log(`[${roomId}] Meeting live notifications created for both parties`);
            }
          }
        } catch (error) {
          console.error(`[${roomId}] Error creating meeting live notifications:`, error);
        }
      }

      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId);
        const m = rooms.get(roomId);
        if (m) {
          m.delete(socket.id);
          if (m.size === 0) rooms.delete(roomId);
        }
        console.log(`[${roomId}] ${userId} disconnected`);
      });
    });

    // ── WebRTC signaling ─────────────────────────────────────────────────
    socket.on('offer',         (roomId, d) => socket.to(roomId).emit('offer', d));
    socket.on('answer',        (roomId, d) => socket.to(roomId).emit('answer', d));
    socket.on('ice-candidate', (roomId, d) => socket.to(roomId).emit('ice-candidate', d));

    // ── Live coach metrics (broadcast to all in room) ────────────────────
    socket.on('coach_metrics', (roomId, metrics) => {
      ns.to(roomId).emit('coach_metrics_update', metrics);
    });

    // ── Chat relay ───────────────────────────────────────────────────────
    socket.on('chat_message', (roomId, msg) => {
      socket.to(roomId).emit('chat_message', msg);
    });

    // ── Hand raise ───────────────────────────────────────────────────────
    socket.on('hand_raised', (roomId, userId) => {
      socket.to(roomId).emit('hand_raised', userId);
    });

    // ── Agent 2: Socratic Whisperer ──────────────────────────────────────
    // Triggered by transcript chunks — broadcasts context-aware hints to all
    socket.on('transcript_chunk', async (roomId, textChunk) => {
      console.log(`[${roomId}] transcript: "${textChunk.slice(0, 60)}..."`);
      try {
        const { hint, category } = await generateSocraticHint(textChunk);
        if (hint) {
          ns.to(roomId).emit('whisperer_feed', { hint, category, ts: Date.now() });
        }
      } catch (e) { console.error('Whisperer error:', e); }
    });

    // ── Agent 6: Live Speech Coach ───────────────────────────────────────
    // Client sends audio metrics every few seconds; server returns coaching tip
    socket.on('speech_metrics', async (roomId, metrics) => {
      try {
        const result = await analyzeSpokenChunk(metrics);
        // Send coaching tip only to the speaker (not broadcast)
        socket.emit('speech_coaching', result);
        // But broadcast updated confidence/clarity to everyone
        ns.to(roomId).emit('coach_metrics_update', {
          confidence: result.confidence,
          clarity:    result.clarity,
          energy:     result.energy,
        });
      } catch (e) { console.error('Speech coach error:', e); }
    });

    // ── Agent 7: Live Fact Checker ───────────────────────────────────────
    // Alumni can trigger a fact-check on a candidate claim
    socket.on('fact_check_request', async (roomId, claim) => {
      try {
        const result = await factCheck(claim);
        // Broadcast fact-check result to everyone in room
        ns.to(roomId).emit('fact_check_result', { claim, result, ts: Date.now() });
      } catch (e) { console.error('Fact check error:', e); }
    });
  });
};
