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
const {
  analyzeResume,
  buildResumeAnalysisFromText,
  generatePostInterviewAnalytics,
  verifyDocument,
  summarizeStudentProfile,
  analyzeSpokenChunk,
  factCheck,
} = require('../services/aiService');

const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });
const execFileAsync = promisify(execFile);

async function runCommand(paths, args, options = {}) {
  let lastError;
  for (const path of paths) {
    try {
      return await execFileAsync(path, args, options);
    } catch (err) {
      if (err.code === 'ENOENT') {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error(`Command not found: ${paths.join(', ')}`);
}

async function convertPdfToImages(pdfPath, outputDir, outputBase) {
  const outputPrefix = path.join(outputDir, outputBase);
  const converters = [
    {
      names: ['pdftoppm', '/usr/bin/pdftoppm', '/usr/local/bin/pdftoppm'],
      args: ['-jpeg', '-jpegopt', 'quality=90', pdfPath, outputPrefix],
    },
    {
      names: ['magick', '/usr/bin/magick', '/usr/local/bin/magick'],
      args: [pdfPath, `${outputPrefix}-%03d.jpg`],
    },
    {
      names: ['convert', '/usr/bin/convert', '/usr/local/bin/convert'],
      args: [pdfPath, `${outputPrefix}-%03d.jpg`],
    },
    {
      names: ['gs', '/usr/bin/gs', '/usr/local/bin/gs'],
      args: ['-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=jpeg', '-dJPEGQ=90', `-sOutputFile=${outputPrefix}-%03d.jpg`, pdfPath],
    },
    {
      names: ['sips', '/usr/bin/sips'],
      args: ['-s', 'format', 'jpeg', pdfPath, '--out', `${outputPrefix}.jpg`],
    },
  ];

  for (const converter of converters) {
    try {
      await runCommand(converter.names, converter.args, {
        maxBuffer: 50 * 1024 * 1024,
      });
      const files = fs.readdirSync(outputDir)
        .filter((file) => file.startsWith(outputBase) && /\.(jpg|jpeg|png)$/i.test(file))
        .map((file) => path.join(outputDir, file))
        .sort();
      if (files.length) return files;
    } catch (e) {
      console.warn(`PDF conversion attempt failed with ${converter.names[0]}:`, e.message);
      continue;
    }
  }

  throw new Error('No PDF-to-image converter available (pdftoppm or convert).');
}

async function extractTextFromPdfUsingOcr(filePath) {
  const tempDir = path.dirname(filePath);
  const outputBase = `${path.basename(filePath, path.extname(filePath))}-ocr`;
  let imagePaths = [];
  try {
    imagePaths = await convertPdfToImages(filePath, tempDir, outputBase);
    console.log(`[PDF OCR] Converted PDF to ${imagePaths.length} images`);
  } catch (e) {
    console.warn('PDF-to-image conversion failed:', e.message);
    return {
      unavailable: true,
      reason: 'Unable to convert scanned PDF to images for OCR. Install pdftoppm or ImageMagick, or upload a text-based PDF.',
    };
  }

  if (!imagePaths.length) {
    return {
      unavailable: true,
      reason: 'No images were generated from the scanned PDF for OCR processing.',
    };
  }

  let combinedText = '';
  for (const imagePath of imagePaths) {
    try {
      const imageResult = await extractImageTextViaGroq(imagePath, 'image/jpeg');
      if (!imageResult.unavailable && imageResult.text) {
        combinedText += ` ${imageResult.text}`;
      } else {
        console.warn('[PDF OCR] Groq OCR returned no text for image:', imagePath, imageResult.reason);
      }
    } catch (e) {
      console.warn('[PDF OCR] Groq OCR failed for image:', imagePath, e.message);
    } finally {
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
  }

  const text = normalizeText(combinedText);
  console.log(`[PDF OCR] Combined extracted text length: ${text.length}, word count: ${wordCount(text)}`);
  if (!text) {
    return {
      unavailable: true,
      reason: 'Groq OCR extracted no readable text from the scanned PDF images.',
    };
  }

  return { unavailable: false, text };
}

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

// ── Helper: Extract text from image via Groq Vision ───────────────────────────
async function extractImageTextViaGroq(filePath, mimeType) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.log('[Groq OCR] No API key configured');
      return {
        unavailable: true,
        reason: 'Cloud image OCR is not configured right now.',
      };
    }

    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const imageData = fs.readFileSync(filePath).toString('base64');
    console.log(`[Groq OCR] Sending image (${mimeType}) to Groq Vision, size: ${imageData.length} chars`);
    const response = await client.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image exactly as it appears. If this is a resume or CV, extract every word. Output only the raw text with no commentary.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageData}`,
                detail: 'auto',
              },
            },
          ],
        },
      ],
      max_tokens: 2048,
    });

    const text = response.choices?.[0]?.message?.content?.trim() || '';
    console.log(`[Groq OCR] Extracted text length: ${text.length}, preview: ${text.substring(0, 100)}`);
    return { unavailable: false, text };
  } catch (e) {
    console.error('[Groq OCR] Error:', e.message);
  }
}

async function extractImageTextLocally(filePath) {
  return {
    unavailable: true,
    reason: 'Local OCR has been removed. Please configure GROQ_API_KEY for image resume analysis.',
  };
}

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
        
        // Fallback for scanned/image-based PDFs based on actual word count rather than raw char length
        if (!extractedText || extractedWords < 20) {
          console.log('[PDF] native text extraction returned too little usable text. Falling back to scanned PDF OCR.');
          const pdfOcrResult = await extractTextFromPdfUsingOcr(file.path);
          if (!pdfOcrResult.unavailable) {
            extractedText = normalizeText(pdfOcrResult.text);
            const ocrWords = wordCount(extractedText);
            console.log(`[PDF->OCR] Extracted ${extractedText.length} chars and ${ocrWords} words via scanned PDF OCR fallback.`);
          } else {
            console.warn('[PDF->OCR] scanned PDF OCR unavailable:', pdfOcrResult.reason);
          }
        }
      } else if (isImage) {
        const imageResult = await extractImageTextViaGroq(file.path, mimeType);
        if (imageResult.unavailable) {
          return res.status(503).json({
            error: 'image_analysis_unavailable',
            message: imageResult.reason || 'Image resume analysis is temporarily unavailable. Please configure GROQ_API_KEY or upload a PDF resume instead.',
          });
        }
        extractedText = imageResult.text;
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
    if (!cleanedText || cleanedWords < 10) {
      return res.status(422).json({
        error: 'text_extraction_failed',
        message: 'Please provide more text content. If this is a scanned resume, upload a clearer PDF or paste the text directly.',
      });
    }
    extractedText = cleanedText;

    console.log('Extracted text length:', extractedText.length);
    console.log('Extracted text preview:', extractedText.substring(0, 200));

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
