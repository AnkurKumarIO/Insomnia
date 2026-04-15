const express = require('express');
const router = express.Router();
const {
  generateSimpleMeetLink,
  generateConsistentMeetLink,
  createMeetLinkWithCode,
  isValidMeetUrl,
} = require('../services/googleMeetService');

/**
 * POST /api/meet/create
 * Create a new Google Meet link for an interview room
 */
router.post('/create', async (req, res) => {
  try {
    const { roomId, title, consistent = true } = req.body;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: 'roomId is required',
      });
    }

    // Generate meet link
    const meetLink = consistent
      ? generateConsistentMeetLink(roomId)
      : generateSimpleMeetLink(roomId);

    res.json({
      success: true,
      meetLink,
      roomId,
      title: title || `AlumNEX Interview - Room ${roomId}`,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating meet link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create Google Meet link',
      message: error.message,
    });
  }
});

/**
 * GET /api/meet/:roomId
 * Get or create a Google Meet link for a specific room
 */
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: 'roomId is required',
      });
    }

    // Generate consistent link for the room
    const meetLink = generateConsistentMeetLink(roomId);

    res.json({
      success: true,
      meetLink,
      roomId,
      retrievedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error retrieving meet link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve Google Meet link',
      message: error.message,
    });
  }
});

/**
 * POST /api/meet/custom
 * Create a Google Meet link with custom code
 */
router.post('/custom', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Meeting code is required',
      });
    }

    const meetLink = createMeetLinkWithCode(code);

    res.json({
      success: true,
      meetLink,
      code,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating custom meet link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create custom Google Meet link',
      message: error.message,
    });
  }
});

/**
 * POST /api/meet/validate
 * Validate a Google Meet URL
 */
router.post('/validate', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    const isValid = isValidMeetUrl(url);

    res.json({
      success: true,
      isValid,
      url,
    });
  } catch (error) {
    console.error('Error validating meet URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate Google Meet URL',
      message: error.message,
    });
  }
});

module.exports = router;
