const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { analyzeResume, generatePostInterviewAnalytics } = require('../services/aiService');
const supabase = require('../supabase');

const upload = multer({ dest: 'uploads/' });

// POST /ai/resume-analyze
router.post('/resume-analyze', upload.single('resume'), async (req, res) => {
  try {
    const mockExtractedText = 'I have 2 years of experience in React and Node.js. Built scalable microservices.';
    const analysis = await analyzeResume(mockExtractedText);

    const { userId } = req.body;
    if (userId) {
      // Save analysis result to resume_analyses table
      await supabase.from('resume_analyses').insert({
        user_id: userId,
        score: analysis.score,
        target_companies: analysis.target_companies,
        formatting_fixes: analysis.formatting_fixes,
      });

      // Also update profile_data on the user row
      await supabase
        .from('users')
        .update({ profile_data: analysis })
        .eq('id', userId);
    }

    res.json({ message: 'Resume analyzed successfully', analysis });
  } catch (error) {
    console.error('Resume Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze resume.' });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

// POST /ai/interview-analytics
router.post('/interview-analytics', async (req, res) => {
  try {
    const { interviewId, metricsArray, fullTranscript } = req.body;
    const analytics = await generatePostInterviewAnalytics(metricsArray || [], fullTranscript || '');

    if (interviewId) {
      const { error } = await supabase
        .from('interview_records')
        .update({
          transcript: fullTranscript,
          ai_action_items: analytics,
          status: 'COMPLETED',
        })
        .eq('interview_id', interviewId);

      if (error) console.log('InterviewRecord update failed:', error.message);
    }

    res.json({ message: 'Analytics generated successfully', analytics });
  } catch (error) {
    console.error('Post-Interview Analytics Error:', error);
    res.status(500).json({ error: 'Failed to generate analytics.' });
  }
});

module.exports = router;
