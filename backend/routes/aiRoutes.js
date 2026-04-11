const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeResume, generatePostInterviewAnalytics } = require('../services/aiService');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/' });

// Agent 1: Resume Analyzer
router.post('/resume-analyze', upload.single('resume'), async (req, res) => {
  try {
    const mockExtractedText = 'I have 2 years of experience in React and Node.js. Built scalable microservices.';
    const analysis = await analyzeResume(mockExtractedText);

    const { userId } = req.body;
    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { profile_data: JSON.stringify(analysis) }
        });
      } catch (e) {
        console.log('User not found for profile update, continuing...');
      }
    }

    res.json({ message: 'Resume analyzed successfully', analysis });
  } catch (error) {
    console.error('Resume Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze resume.' });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// Agent 3: Post-Interview Analytics
router.post('/interview-analytics', async (req, res) => {
  try {
    const { interviewId, metricsArray, fullTranscript } = req.body;
    const analytics = await generatePostInterviewAnalytics(metricsArray || [], fullTranscript || '');

    // Try to save to DB if interviewId exists, otherwise just return the analytics
    if (interviewId) {
      try {
        await prisma.interviewRecord.update({
          where: { interview_id: interviewId },
          data: {
            transcript: fullTranscript,
            ai_action_items: JSON.stringify(analytics)
          }
        });
      } catch (e) {
        console.log('InterviewRecord not found, returning analytics without DB save.');
      }
    }

    res.json({ message: 'Analytics generated successfully', analytics });
  } catch (error) {
    console.error('Post-Interview Analytics Error:', error);
    res.status(500).json({ error: 'Failed to generate analytics.' });
  }
});

module.exports = router;
