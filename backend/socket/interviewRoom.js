const {
  generateSocraticHint,
  analyzeSpokenChunk,
  factCheck,
} = require('../services/aiService');

module.exports = (io) => {
  const ns = io.of('/interview');

  ns.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Room management ──────────────────────────────────────────────────
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      console.log(`[${roomId}] ${userId} joined`);
      socket.to(roomId).emit('user-connected', userId);
      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId);
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
