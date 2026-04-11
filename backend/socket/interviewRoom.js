module.exports = (io) => {
  const interviewNamespace = io.of('/interview');

  interviewNamespace.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
      socket.to(roomId).emit('user-connected', userId);

      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId);
      });
    });

    // WebRTC signaling — relay only to the other peer
    socket.on('offer',         (roomId, data) => socket.to(roomId).emit('offer', data));
    socket.on('answer',        (roomId, data) => socket.to(roomId).emit('answer', data));
    socket.on('ice-candidate', (roomId, data) => socket.to(roomId).emit('ice-candidate', data));

    // Live coach metrics — broadcast to everyone in room including sender
    socket.on('coach_metrics', (roomId, metrics) => {
      interviewNamespace.to(roomId).emit('coach_metrics_update', metrics);
    });

    // Transcript → AI hint → broadcast to ALL in room so both tabs see it
    socket.on('transcript_chunk', async (roomId, textChunk) => {
      try {
        console.log(`[Room ${roomId}] Transcript: ${textChunk}`);
        const { generateSocraticHint } = require('../services/aiService');
        const hintData = await generateSocraticHint(textChunk);
        if (hintData && hintData.hint) {
          interviewNamespace.to(roomId).emit('whisperer_feed', hintData.hint);
        }
      } catch (err) {
        console.error('[Whisperer] Error generating hint:', err.message);
      }
    });
  });
};
