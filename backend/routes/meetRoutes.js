const express = require('express');
const router = express.Router();
const {
  generateSimpleMeetLink,
  generateConsistentMeetLink,
  createMeetLinkWithCode,
  isValidMeetUrl,
} = require('../services/googleMeetService');

/**
 * GET /meet/ice-config
 * Returns ICE servers. Uses Metered API if configured (best),
 * otherwise uses multiple reliable free TURN servers (works cross-network).
 * MUST be before /:roomId wildcard.
 */
router.get('/ice-config', async (req, res) => {
  try {
    const apiKey  = process.env.METERED_API_KEY;
    const appName = process.env.METERED_APP_NAME;

    // Option 1: Metered dedicated TURN (fastest, most reliable)
    if (apiKey && appName) {
      const response = await fetch(
        `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`
      );
      if (response.ok) {
        const iceServers = await response.json();
        console.log('[ICE] Serving Metered credentials:', iceServers.length, 'servers');
        return res.json({ iceServers, iceCandidatePoolSize: 10 });
      }
    }

    // Option 2: Multiple free TURN providers — works reliably cross-network
    // Using several providers increases chance of successful relay
    console.log('[ICE] Serving multi-provider free TURN config');
    res.json({
      iceServers: [
        // Google STUN
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Cloudflare STUN
        { urls: 'stun:stun.cloudflare.com:3478' },
        // Open Relay TURN (port 80/443 bypass firewalls)
        { urls: 'turn:openrelay.metered.ca:80',                username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443',               username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
        // Numb TURN (backup)
        { urls: 'turn:numb.viagenie.ca',                       username: 'webrtc@live.com',  credential: 'muazkh' },
        // Xirsys free tier (backup)
        { urls: 'stun:stun.relay.metered.ca:80' },
        { urls: 'turn:standard.relay.metered.ca:80',           username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:standard.relay.metered.ca:443',          username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:standard.relay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
      ],
      iceCandidatePoolSize: 10,
    });
  } catch (e) {
    console.error('[ICE] Error:', e.message);
    // Always return something — never fail silently
    res.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'turn:openrelay.metered.ca:80',                username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443',               username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
      ],
      iceCandidatePoolSize: 10,
    });
  }
});

/** POST /meet/create */
router.post('/create', async (req, res) => {
  try {
    const { roomId, title, consistent = true } = req.body;
    if (!roomId) return res.status(400).json({ success: false, error: 'roomId is required' });
    const meetLink = consistent ? generateConsistentMeetLink(roomId) : generateSimpleMeetLink(roomId);
    res.json({ success: true, meetLink, roomId, title: title || `AlumNEX Interview - Room ${roomId}`, createdAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /meet/custom */
router.post('/custom', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'code is required' });
    res.json({ success: true, meetLink: createMeetLinkWithCode(code), code, createdAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /meet/validate */
router.post('/validate', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'url is required' });
    res.json({ success: true, isValid: isValidMeetUrl(url), url });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** GET /meet/:roomId — wildcard, MUST be last */
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const meetLink = generateConsistentMeetLink(roomId);
    res.json({ success: true, meetLink, roomId, retrievedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
