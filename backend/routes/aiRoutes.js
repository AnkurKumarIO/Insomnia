const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const fs      = require('fs');
const pdf     = require('pdf-parse');
const { analyzeResume, generatePostInterviewAnalytics, analyzeProfileStrength } = require('../services/aiService');
const supabase = require('../supabase');

const upload = multer({ dest: 'uploads/' });

// POST /ai/resume-analyze
router.post('/resume-analyze', upload.single('resume'), async (req, res) => {
  try {
    let resumeText = '';

    // Extract real text from uploaded PDF
    if (req.file) {
      try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData    = await pdf(dataBuffer);
        resumeText       = pdfData.text?.trim() || '';
      } catch (pdfErr) {
        console.warn('[Resume] PDF parse failed, using filename as context:', pdfErr.message);
        resumeText = `Resume file: ${req.file.originalname}`;
      }
    }

    if (!resumeText) {
      resumeText = 'No resume text could be extracted. Please provide a text-based PDF.';
    }

    const analysis = await analyzeResume(resumeText);

    const { userId } = req.body;
    if (userId) {
      await supabase.from('resume_analyses').insert({
        user_id:          userId,
        score:            analysis.score,
        target_companies: analysis.target_companies,
        formatting_fixes: analysis.formatting_fixes,
      });
      await supabase.from('users').update({ profile_data: analysis }).eq('id', userId);
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
      await supabase
        .from('interview_records')
        .update({
          transcript:      fullTranscript,
          ai_action_items: analytics,
          student_score:   analytics.score || null,
          status:          'COMPLETED',
        })
        .eq('interview_id', interviewId);
    }

    res.json({ message: 'Analytics generated successfully', analytics });
  } catch (error) {
    console.error('Post-Interview Analytics Error:', error);
    res.status(500).json({ error: 'Failed to generate analytics.' });
  }
});

// POST /ai/profile-strength
router.post('/profile-strength', async (req, res) => {
  try {
    const { profileData } = req.body;
    if (!profileData) return res.status(400).json({ error: 'profileData is required.' });

    const result = await analyzeProfileStrength(profileData);
    res.json(result);
  } catch (error) {
    console.error('Profile Strength Error:', error);
    res.status(500).json({ error: 'Failed to analyze profile.' });
  }
});

module.exports = router;
