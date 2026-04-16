const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');
const pdfParsePkg = require('pdf-parse');
const pdfParse = typeof pdfParsePkg === 'function'
  ? pdfParsePkg
  : pdfParsePkg?.default || pdfParsePkg?.pdfParse || pdfParsePkg;
const { execFile } = require('child_process');
const { promisify } = require('util');
const OpenAI  = require('openai');
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const pdfImgConvert = require('pdf-img-convert');
const {
  analyzeResume,
  buildResumeAnalysisFromText,
  generatePostInterviewAnalytics,
  verifyDocument,
  summarizeStudentProfile,
  analyzeSpokenChunk,
  factCheck,
  extractTextViaOpenAI
} = require('../services/aiService');

const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

// ── OCR Helpers transitioned to OpenAI (in aiService.js) ───────────────────

function looksLikeResume(text) {
  const lower = text.toLowerCase();
  const indicators = [
    /\bexperience\b/,
    /\beducation\b/,
    /\bskills\b/,
    /\bprojects?\b/,
    /\bsummary\b/,
    /\bobjective\b/,
    /\bwork history\b/,
    /\bintern(ship)?\b/,
    /\blinkedin\b/,
    /@[a-z0-9.-]+\.[a-z]{2,}/,
    /\bphone\b/,
    /\bname\b/,
    /\bcontact\b/,
    /\bcv\b/,
    /\bresume\b/,
  ];
  const matches = indicators.filter((pattern) => pattern.test(lower)).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return matches >= 1 || wordCount >= 50; // More lenient: 1 indicator or 50 words
}

// ── Helper: Extract text from PDF ─────────────────────────────────────────────
async function extractPdfText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text?.trim() || '';
  } catch (e) {
    console.error('PDF parse error:', e.message);
    return '';
  }
}

function normalizeText(rawText) {
  return String(rawText || '').replace(/\s+/g, ' ').trim();
}

function wordCount(text) {
  return normalizeText(text).split(' ').filter(Boolean).length;
}

// Obsolete OCR helpers removed.

// ── Agent 1: Resume Analyzer ─────────────────────────────────────────────────
router.post('/resume-analyze', upload.any(), async (req, res) => {
  try {
    let extractedText = '';

    if (req.body.text) {
      extractedText = req.body.text.trim();
    } else if (req.files && req.files[0]) {
      const file = req.files[0];
      const originalName = (file.originalname || '').toLowerCase();
      const mimeType     = file.mimetype || '';
      const isPdf        = mimeType === 'application/pdf' || originalName.endsWith('.pdf');
      const isImage      = mimeType.startsWith('image/');

      if (isPdf) {
        extractedText = normalizeText(await extractPdfText(file.path));
        const extractedWords = wordCount(extractedText);
        console.log(`[PDF] Extracted ${extractedText.length} characters and ${extractedWords} words from native PDF parse.`);
        
        // If native extract fails (likely a scanned PDF), fallback to OpenAI OCR
        if (!extractedText || extractedWords < 15) {
          console.log('[PDF] native text extraction returned too little usable text. Falling back to OpenAI OCR.');
          try {
            // Convert first page to image buffer for OCR
            const pdfImages = await pdfImgConvert.convert(file.path, { width: 1000 });
            if (pdfImages && pdfImages.length > 0) {
              const ocrResult = await extractTextViaOpenAI(pdfImages[0], 'image/png');
              if (!ocrResult.unavailable) {
                extractedText = normalizeText(ocrResult.text);
                console.log(`[PDF->OpenAI] Extracted ${extractedText.length} chars via OCR.`);
              } else {
                throw new Error(ocrResult.reason);
              }
            } else {
              throw new Error('Could not convert PDF to image for OCR.');
            }
          } catch (ocrErr) {
            console.error('[PDF->OpenAI] OCR failed:', ocrErr.message);
            return res.status(422).json({
              error: 'scanned_pdf_detected',
              message: 'This appears to be a scanned PDF and OCR processing failed. Please upload a text-based resume or paste the text directly.',
            });
          }
        }
      } else if (isImage) {
        console.log('[Image] Processing via OpenAI OCR...');
        try {
          const fileBuffer = fs.readFileSync(file.path);
          const ocrResult = await extractTextViaOpenAI(fileBuffer, mimeType);
          if (!ocrResult.unavailable) {
            extractedText = normalizeText(ocrResult.text);
            console.log(`[Image->OpenAI] Extracted ${extractedText.length} chars via OCR.`);
          } else {
            throw new Error(ocrResult.reason);
          }
        } catch (ocrErr) {
          console.error('[Image->OpenAI] OCR failed:', ocrErr.message);
          return res.status(422).json({
            error: 'image_ocr_failed',
            message: 'OCR processing failed for this image. Please paste your resume text instead.',
          });
        }
      } else {
        // Try to read as plain text
        try { 
          let rawText = fs.readFileSync(file.path, 'utf8').trim();
          // If it looks like HTML, extract text content
          if (rawText.includes('<') && rawText.includes('>')) {
            const $ = cheerio.load(rawText);
            extractedText = $('body').text() || $.text() || rawText;
            // Clean up extra whitespace
            extractedText = extractedText.replace(/\s+/g, ' ').trim();
          } else {
            extractedText = rawText;
          }
        } catch (_) {}
      }

      // Clean up file
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } else {
      return res.status(400).json({ error: 'No file uploaded or text provided.' });
    }

    const cleanedText = normalizeText(extractedText);
    const cleanedWords = wordCount(cleanedText);
    
    // If we have text, but it's very short, check if we should still try analysis
    if (!cleanedText || (cleanedWords < 5 && !extractedText.includes('via OCR'))) {
      return res.status(422).json({
        error: 'text_extraction_failed',
        message: 'Could not extract enough text from this document. If this is a scanned resume, please ensure the file is clear or paste the text directly.',
      });
    }
    extractedText = cleanedText;

    console.log(`[Resume Analyzer] Proceeding with ${extractedText.length} characters of text.`);

    // Send for analysis (analyzeResume will provide analysis)
    let analysis = await analyzeResume(extractedText);

    // Always use the analysis - no rejection for "not a resume"
    const { userId } = req.body;
    if (userId) {
      try {
        await prisma.user.update({ where: { id: userId }, data: { profile_data: JSON.stringify(analysis) } });
      } catch (_) {}
    }

    res.json({ message: 'Resume analyzed successfully', analysis });
  } catch (e) {
    console.error('Resume analyze error:', e);
    res.status(500).json({ error: 'Failed to analyze resume. Please try again.' });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'file_too_large',
        message: 'File too large. Maximum size is 10 MB.',
      });
    }
    return res.status(400).json({
      error: 'upload_error',
      message: err.message,
    });
  }
  return next(err);
});

// ── Agent 3: Post-Interview Analytics ────────────────────────────────────────
router.post('/interview-analytics', async (req, res) => {
  try {
    const { interviewId, metricsArray, fullTranscript } = req.body;
    const analytics = await generatePostInterviewAnalytics(metricsArray || [], fullTranscript || '');

    if (interviewId) {
      try {
        await prisma.interviewRecord.update({
          where: { interview_id: interviewId },
          data: { transcript: fullTranscript, ai_action_items: JSON.stringify(analytics) },
        });
      } catch (_) {}
    }

    res.json({ message: 'Analytics generated successfully', analytics });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate analytics.' });
  }
});

// ── Agent 4: Document Verifier ────────────────────────────────────────────────
router.post('/verify-document', upload.single('document'), async (req, res) => {
  try {
    const result = await verifyDocument({ filename: req.file?.originalname });
    res.json({ message: 'Document processed', result });
  } catch (e) {
    res.status(500).json({ error: 'Document verification failed.' });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

// ── Agent 5: Student Profile Summarizer (for Alumni) ─────────────────────────
router.post('/summarize-profile', async (req, res) => {
  try {
    const { profileData } = req.body;
    const summary = await summarizeStudentProfile(profileData || {});
    res.json({ message: 'Profile summarized', summary });
  } catch (e) {
    res.status(500).json({ error: 'Profile summarization failed.' });
  }
});

// Alias used by api.profileStrength() on the frontend
router.post('/profile-strength', async (req, res) => {
  try {
    const { profileData } = req.body;
    const summary = await summarizeStudentProfile(profileData || {});
    res.json({ message: 'Profile strength evaluated', summary });
  } catch (e) {
    res.status(500).json({ error: 'Profile strength evaluation failed.' });
  }
});

// ── Agent 6: Live Speech Coach (called per audio chunk) ───────────────────────
router.post('/analyze-speech', async (req, res) => {
  try {
    const { wordsPerMinute, fillerCount, pauseCount } = req.body;
    const result = await analyzeSpokenChunk({ wordsPerMinute, fillerCount, pauseCount });
    res.json({ result });
  } catch (e) {
    res.status(500).json({ error: 'Speech analysis failed.' });
  }
});

// ── Agent 7: Fact Checker ─────────────────────────────────────────────────────
router.post('/fact-check', async (req, res) => {
  try {
    const { claim } = req.body;
    if (!claim) return res.status(400).json({ error: 'claim is required' });
    const result = await factCheck(claim);
    res.json({ claim, result });
  } catch (e) {
    res.status(500).json({ error: 'Fact check failed.' });
  }
});

module.exports = router;
