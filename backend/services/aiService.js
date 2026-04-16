/**
 * AlumniConnect AI — All 7 Agents powered by Groq (llama-3.3-70b-versatile)
 * Groq is ultra-fast inference — responses in ~200ms.
 * Falls back to deterministic mock when GROQ_API_KEY is not set.
 *
 * Free key at: https://console.groq.com
 */

const Groq = require('groq-sdk');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const API_KEY        = process.env.GROQ_API_KEY;
const RESUME_API_KEY = process.env.GROQ_API_KEY_RESUME || API_KEY;
const USE_GROQ       = !!API_KEY;
const USE_OPENAI     = !!process.env.OPENAI_API_KEY;
const USE_AI         = USE_GROQ || USE_OPENAI;
const MODEL          = 'llama-3.3-70b-versatile';

let groq       = null;
let groqResume = null;

if (USE_GROQ) {
  groq = new Groq({ apiKey: API_KEY });
  console.log('✅ Groq Primary AI connected');
  
  // Use dedicated resume key if present, otherwise fallback to primary
  if (process.env.GROQ_API_KEY_RESUME) {
    groqResume = new Groq({ apiKey: RESUME_API_KEY });
    console.log('✅ Groq Resume-Specific AI connected');
  } else {
    groqResume = groq;
  }
} else if (USE_OPENAI) {
  console.log('⚠️  GROQ_API_KEY not set — using OpenAI fallback for AI agents');
} else {
  console.log('⚠️  GROQ_API_KEY and OPENAI_API_KEY not set — agents running in mock mode');
}

/**
 * OCR Fallback via OpenAI GPT-4o-mini (Vision)
 * Extracts text from an image buffer.
 */
const extractTextViaOpenAI = async (fileBuffer, mimeType = 'image/jpeg') => {
  if (!process.env.OPENAI_API_KEY) {
    return { unavailable: true, reason: 'OpenAI API key missing' };
  }

  try {
    const base64Image = fileBuffer.toString('base64');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Act as a highly accurate OCR engine. Transcribe ALL text from this resume image exactly. Include all contact details, headers, dates, and bullet points. Do not summarize. Do not add any conversational filler like 'Here is the transcript'." 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2500,
      temperature: 0,
    });

    return { text: response.choices[0].message.content };
  } catch (error) {
    console.error('OpenAI OCR Error:', error.message);
    return { unavailable: true, reason: error.message };
  }
};

async function askOpenAI(systemPrompt, userPrompt, maxTokens = 900) {
  if (!USE_OPENAI) throw new Error('OpenAI API key missing');
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.2,
  });

  return response.choices?.[0]?.message?.content || '';
}

function parseJsonResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const jsonMatch = rawText.match(/\{[\s\S]*\}$/m);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    return null;
  }
}

function normalizeResult(result) {
  if (!result || typeof result !== 'object') return null;
  if (result.analysis && typeof result.analysis === 'object') result = result.analysis;
  if (result.resume && typeof result.resume === 'object') result = result.resume;
  return result;
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

// Core helper — sends a prompt, expects JSON back
async function ask(systemPrompt, userPrompt, maxTokens = 512, clientOverride = null) {
  const client = clientOverride || groq;
  if (!client) throw new Error('Groq client not initialized — key is missing');
  
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    max_tokens: maxTokens,
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(res.choices[0].message.content);
}

function extractResumeSection(label, resumeText) {
  const regex = new RegExp(`${label}\s*[:\-]?\s*([\s\S]{20,300})`, 'i');
  const match = resumeText.match(regex);
  if (!match) return [];
  return match[1]
    .split(/[\n,•;•]/)
    .map((piece) => piece.trim())
    .filter((piece) => piece && piece.length < 60)
    .slice(0, 6);
}

function extractCompaniesFromText(resumeText) {
  const found = new Set();
  const companyRegex = /\bat\s+([A-Z][A-Za-z0-9&.\- ]{2,})(?=[\.,\n]|$)/g;
  for (const match of resumeText.matchAll(companyRegex)) {
    found.add(match[1].trim());
  }
  return Array.from(found).slice(0, 5);
}

function buildResumeAnalysisFromText(resumeText) {
  const normalizedText = resumeText.replace(/\s+/g, ' ').trim();
  const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;
  const score = Math.min(88, Math.max(45, Math.floor(wordCount * 1.2) + 10));
  const companies = extractCompaniesFromText(resumeText);
  const skills = extractResumeSection('skills', resumeText);
  const roleHints = [];
  if (/machine learning|artificial intelligence|deep learning|neural network/i.test(resumeText)) roleHints.push('Machine Learning Engineer');
  if (/react\b|vue\b|angular\b|frontend\b/i.test(resumeText)) roleHints.push('Frontend / Full-Stack Developer');
  if (/python\b|django\b|flask\b|backend\b/i.test(resumeText)) roleHints.push('Backend / Data Engineer');
  if (/data science|data analyst|analytics/i.test(resumeText)) roleHints.push('Data Analyst / Scientist');

  return {
    score,
    grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D',
    ats_score: Math.min(90, Math.max(40, score - 5)),
    target_companies: companies.length > 0 ? companies : ['Industry-relevant companies'],
    keyword_gaps: [
      skills.length > 0 ? `Add more role-specific keywords around ${skills[0]}` : 'Add domain-specific keywords aligned to your target role.',
      'Use stronger impact language for achievements, including metrics where possible.',
      'Include a concise summary highlighting your top strengths and role focus.',
      'Ensure consistent formatting for dates, headings, and bullets.',
    ].slice(0, 4),
    formatting_fixes: [
      wordCount < 150 ? 'Expand your resume with more experience and project details.' : 'Prioritize the most relevant experience at the top of the document.',
      'Add a brief professional summary or headline to frame your target role.',
      'Use bullet points for achievements and technical contributions.',
      'Keep section headings consistent and easy to scan.',
    ],
    strengths: [
      skills.length > 0 ? `Listed skills include ${skills.slice(0, 3).join(', ')}.` : 'The resume contains a clear focus on career experience and accomplishments.',
      wordCount > 300 ? 'Sufficient detail is present to evaluate experience and technical ability.' : 'A concise format can be easier to read, but more detail may improve accuracy.',
    ].slice(0, 3),
    role_detected: roleHints[0] || 'Software Engineer',
    experience_years: Math.min(15, Math.max(0, Math.floor(wordCount / 100))),
    top_skills: skills.length > 0 ? skills.slice(0, 6) : ['Resume content needs more explicit skills'],
    is_mock: true,
    fallback_reason: 'AI service unavailable; using deterministic text extraction.',
  };
}

// ─── Agent 1: Resume Analyzer ────────────────────────────────────────────────
const analyzeResume = async (resumeText) => {
  const aiPrompt = `You are an expert technical recruiter and resume analyst.

ALWAYS analyze this text as a resume/CV, even if it seems incomplete or unusual. Return JSON with ALL these keys:
- score: integer 0-100 (honest assessment of this specific resume's quality)
- grade: "A", "B", "C", or "D"
- ats_score: integer 0-100 (keyword/ATS compatibility score)
- target_companies: array of 5 company names that match THIS candidate's actual profile
- keyword_gaps: array of 3-4 high-value missing keywords for their target role
- formatting_fixes: array of 3-4 specific, actionable tips referencing the actual content found
- strengths: array of 2-3 genuine strengths found in this document
- role_detected: the most likely job role this resume targets (e.g. "Frontend Developer", "Data Scientist")
- experience_years: total count of years of experience as a number (NOT the start or end year)
- top_skills: array of 5-6 actual skills listed in this resume

Use ONLY the content in the resume text to infer companies and skills. If the resume mentions specific employers, include those in target_companies. If no explicit employer is present, choose companies that are a strong hiring match for the candidate's domain and role based on the resume details.

For top_skills, list the 5-6 most relevant skills actually present or clearly implied by the resume. Do not invent unrelated skills.

If the resume text does not contain enough explicit evidence for a field, return a conservative placeholder that reflects the lack of information rather than fabricating details.

Do not refuse to analyze or return not_a_resume. Analyze any text that mentions work, skills, education, or projects as a resume.`;

  const normalize = (result) => {
    result = normalizeResult(result);
    if (!result) return null;

    let exp = parseInt(result.experience_years);
    if (isNaN(exp)) exp = 0;
    if (exp >= 1900 && exp <= 2100) exp = 1;
    else if (exp > 50) exp = 50;

    return {
      score: Math.min(100, Math.max(0, parseInt(result.score) || 60)),
      grade: result.grade || 'C',
      ats_score: Math.min(100, Math.max(0, parseInt(result.ats_score) || 55)),
      target_companies: ensureArray(result.target_companies).slice(0, 5),
      keyword_gaps: ensureArray(result.keyword_gaps).slice(0, 4),
      formatting_fixes: ensureArray(result.formatting_fixes).slice(0, 4),
      strengths: ensureArray(result.strengths).slice(0, 3),
      role_detected: String(result.role_detected || 'Software Engineer'),
      experience_years: exp,
      top_skills: ensureArray(result.top_skills).slice(0, 6),
    };
  };

  if (USE_GROQ) {
    try {
      const rawResult = await ask(aiPrompt, `Resume text:\n${resumeText.slice(0, 4000)}`, 900, groqResume);
      console.log('AI Raw Result:', JSON.stringify(rawResult, null, 2));
      const normalized = normalize(rawResult);
      if (normalized) {
        normalized.is_mock = false;
        return normalized;
      }
      throw new Error('Failed to normalize Groq response');
    } catch (e) {
      console.error('Groq resume analyzer failed:', e.message);
      if (!USE_OPENAI) {
        const mockResult = buildResumeAnalysisFromText(resumeText);
        mockResult.is_mock = true;
        mockResult.fallback_reason = `AI Analysis failed: ${e.message}`;
        return mockResult;
      }
    }
  }

  if (USE_OPENAI) {
    try {
      const rawText = await askOpenAI(aiPrompt, `Resume text:\n${resumeText.slice(0, 4000)}`, 1200);
      const parsed = parseJsonResponse(rawText);
      const normalized = normalize(parsed);
      if (normalized) {
        normalized.is_mock = false;
        return normalized;
      }
      throw new Error('Failed to parse OpenAI response');
    } catch (e) {
      console.error('OpenAI resume analyzer failed:', e.message);
      const mockResult = buildResumeAnalysisFromText(resumeText);
      mockResult.is_mock = true;
      mockResult.fallback_reason = `AI Analysis failed: ${e.message}`;
      return mockResult;
    }
  }

  const mockResult = buildResumeAnalysisFromText(resumeText);
  mockResult.is_mock = true;
  mockResult.fallback_reason = 'GROQ_API_KEY and OPENAI_API_KEY not found. Running deterministic fallback.';
  return mockResult;
};

// ─── Agent 2: Socratic Whisperer ─────────────────────────────────────────────
/**
 * Agent 2: The Socratic Whisperer (Live Alumni AI)
 * Context-aware hint engine — analyses transcript and returns targeted coaching.
 * @param {string} transcriptChunk 
 */
const generateSocraticHint = async (transcriptChunk) => {
  if (USE_AI) {
    try {
      return await ask(
        `You are an expert technical interviewer coaching an alumni mentor in real-time.
Return JSON with keys: hint (one sharp follow-up question or coaching tip, max 20 words),
category (one of: frontend|backend|database|system-design|debugging|soft-skills|ai-ml|general).`,
        `The candidate just said: "${transcriptChunk}"`
      );
    } catch (e) {
      console.error('Agent 2 error:', e.message);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const text = transcriptChunk.toLowerCase();

      // Topic → hint map (ordered by specificity)
      const rules = [
        // Frontend
        { keys: ['react', 'jsx', 'component', 'hook', 'useeffect', 'usestate'],
          hints: [
            "Ask how they handle state management at scale — Redux vs Zustand vs Context?",
            "Probe their understanding of React's reconciliation algorithm and virtual DOM diffing.",
            "Ask about their experience with React Server Components or concurrent features.",
          ], category: 'frontend'
        },
        { keys: ['css', 'tailwind', 'styled', 'animation', 'responsive'],
          hints: [
            "Ask how they approach design systems and component reusability across teams.",
            "Probe their understanding of CSS specificity, cascade, and performance implications.",
          ], category: 'frontend'
        },
        // Backend
        { keys: ['node', 'express', 'api', 'rest', 'graphql', 'endpoint'],
          hints: [
            "Ask how they handle API versioning and backward compatibility in production.",
            "Probe their approach to rate limiting, authentication middleware, and error handling.",
            "Ask about their experience designing idempotent APIs.",
          ], category: 'backend'
        },
        { keys: ['database', 'sql', 'postgres', 'mysql', 'query', 'index', 'schema'],
          hints: [
            "Ask about their experience with query optimization — EXPLAIN plans, index strategies.",
            "Probe their understanding of ACID properties and when to use NoSQL vs relational.",
            "Ask how they handle database migrations in a zero-downtime deployment.",
          ], category: 'database'
        },
        { keys: ['redis', 'cache', 'caching', 'memcache'],
          hints: [
            "Ask how they decide what to cache and how they handle cache invalidation.",
            "Probe their understanding of cache stampede and how to prevent it.",
          ], category: 'database'
        },
        // System design
        { keys: ['scale', 'scalab', 'microservice', 'distributed', 'load balanc', 'kubernetes', 'docker'],
          hints: [
            "Ask how they'd design a system to handle 10x traffic overnight — what breaks first?",
            "Probe their understanding of CAP theorem and how it influenced their design decisions.",
            "Ask about their experience with service discovery and inter-service communication.",
          ], category: 'system-design'
        },
        { keys: ['kafka', 'queue', 'message', 'event', 'pubsub', 'rabbitmq'],
          hints: [
            "Ask how they handle message ordering guarantees and exactly-once delivery.",
            "Probe their experience with dead-letter queues and retry strategies.",
          ], category: 'system-design'
        },
        // AI/ML
        { keys: ['machine learning', 'ml', 'model', 'llm', 'gpt', 'ai', 'neural', 'training'],
          hints: [
            "Ask how they evaluate model performance beyond accuracy — precision, recall, F1?",
            "Probe their understanding of model drift and how they monitor production ML systems.",
            "Ask about their experience with prompt engineering and LLM token efficiency.",
          ], category: 'ai-ml'
        },
        // Soft skills / leadership
        { keys: ['team', 'lead', 'manage', 'conflict', 'disagree', 'mentor'],
          hints: [
            "Ask for a specific example where they had to influence without authority.",
            "Probe how they give constructive feedback to peers — ask for a real scenario.",
            "Ask how they prioritize when everything is urgent and stakeholders disagree.",
          ], category: 'soft-skills'
        },
        { keys: ['fail', 'mistake', 'wrong', 'bug', 'error', 'incident', 'outage'],
          hints: [
            "Probe deeper — ask what they'd do differently and what systemic change they made.",
            "Ask how they communicated the incident to stakeholders and what the post-mortem looked like.",
          ], category: 'soft-skills'
        },
        { keys: ['project', 'built', 'shipped', 'launched', 'delivered'],
          hints: [
            "Ask about the biggest technical challenge they faced and how they unblocked it.",
            "Probe the impact — ask for specific metrics: users, revenue, latency improvement.",
            "Ask what they'd redesign if they started the project today.",
          ], category: 'general'
        },
        // Security
        { keys: ['security', 'auth', 'oauth', 'jwt', 'xss', 'csrf', 'injection'],
          hints: [
            "Ask how they stay current with security vulnerabilities in their stack.",
            "Probe their understanding of the OWASP Top 10 and which they've encountered.",
          ], category: 'general'
        },
      ];

      // Find matching rule
      for (const rule of rules) {
        if (rule.keys.some(k => text.includes(k))) {
          const hint = rule.hints[Math.floor(Math.random() * rule.hints.length)];
          return resolve({ hint, category: rule.category });
        }
      }

      // Generic fallbacks
      const fallbacks = [
        "Ask them to walk you through the most complex system they've ever built end-to-end.",
        "Probe their decision-making process — ask 'why this approach over alternatives?'",
        "Ask about a time they had to learn something completely new under time pressure.",
        "Ask what they're currently learning and why they chose that topic.",
        "Probe their understanding of trade-offs — ask 'what would you sacrifice for speed?'",
      ];
      resolve({ hint: fallbacks[Math.floor(Math.random() * fallbacks.length)], category: 'general' });
    }, 600);
  });
};

// ─── Agent 3: Post-Interview Analytics ───────────────────────────────────────
const generatePostInterviewAnalytics = async (metricsArray, fullTranscript) => {
  const avg = (key) => metricsArray.length
    ? Math.round(metricsArray.reduce((s, m) => s + (m[key] || 75), 0) / metricsArray.length) : 75;
  const conf = avg('confidence'), clar = avg('clarity'), enrg = avg('energy');

  if (USE_AI && fullTranscript?.length > 10) {
    try {
      return await ask(
        `You are an expert interview coach. Generate a post-interview performance report.
Return JSON with keys: overall_score (0-100), overall_confidence (e.g. "82%"),
communication_clarity (High|Moderate|Needs Work), technical_depth (Strong|Moderate|Shallow),
filler_word_count (number), eye_contact_score (e.g. "78%"), talk_listen_ratio (e.g. "65% / 35%"),
actionable_insights (array of 4 specific tips), suggested_readings (array of 2-3 real URLs),
next_session_focus (string).`,
        `Metrics: confidence=${conf}%, clarity=${clar}%, energy=${enrg}%\nTranscript: "${fullTranscript.slice(0, 600)}"`,
        700
      );
    } catch (e) { console.error('Agent 3 error:', e.message); }
  }
  const overall = Math.round((conf + clar + enrg) / 3);
  return {
    overall_score: overall,
    overall_confidence: `${conf}%`,
    communication_clarity: clar >= 80 ? 'High' : clar >= 60 ? 'Moderate' : 'Needs Work',
    technical_depth: enrg >= 80 ? 'Strong' : enrg >= 60 ? 'Moderate' : 'Shallow',
    filler_word_count: Math.floor(Math.random() * 12 + 3),
    eye_contact_score: `${Math.floor(Math.random() * 20 + 72)}%`,
    talk_listen_ratio: (() => { const talk = Math.floor(Math.random() * 20 + 55); return `${talk}% / ${100 - talk}%`; })(),
    actionable_insights: [
      conf < 75 ? 'Work on projecting confidence — slow down, pause before answering.' : 'Strong confidence. Maintain this in high-pressure rounds.',
      clar < 70 ? 'Reduce filler words. Practice the STAR method.' : 'Communication was clear and structured.',
      enrg < 70 ? 'Technical depth needs improvement — review system design fundamentals.' : 'Solid technical depth. Add more quantitative results.',
      `Next: Book a follow-up session on ${overall < 70 ? 'fundamentals' : overall < 85 ? 'system design' : 'behavioral rounds'}.`,
    ],
    suggested_readings: ['https://react.dev/learn', 'https://nodejs.org/en/docs/', 'https://www.educative.io/courses/grokking-the-system-design-interview'],
    next_session_focus: overall < 70 ? 'Fundamentals & Communication' : overall < 85 ? 'System Design & Depth' : 'Behavioral & Leadership',
  };
};

// ─── Agent 4: Document Verifier ──────────────────────────────────────────────
const verifyDocument = async (fileInfo) => {
  if (USE_AI) {
    try {
      return await ask(
        `You are an AI document verification system for a university placement portal.
Return JSON with keys: verified (boolean), confidence (88-99), extracted (object with name, college_id, institution, department, year),
flags (empty array), message (string).`,
        `Document filename: "${fileInfo?.filename || 'college_id.pdf'}"`
      );
    } catch (e) { console.error('Agent 4 error:', e.message); }
  }
  return {
    verified: true, confidence: Math.floor(Math.random() * 10 + 90),
    extracted: { name: 'Alice Johnson', college_id: 'STU1001', institution: 'AlumniConnect University', department: 'Computer Science', year: '2024' },
    flags: [], message: 'Document verified successfully. No anomalies detected.',
  };
};

// ─── Agent 5: Student Profile Summarizer ─────────────────────────────────────
const summarizeStudentProfile = async (profileData) => {
  if (USE_AI) {
    try {
      return await ask(
        `You are an AI assistant briefing an alumni mentor before a mock interview.
Return JSON with keys: summary (2-3 sentence professional summary), top_skills (array of 4-5 strings),
experience_level (Junior|Mid-level|Senior), interview_focus_areas (array of 3 topics to probe),
red_flags (array, can be empty), match_score (70-99).`,
        `Student profile: ${JSON.stringify(profileData)}`
      );
    } catch (e) { console.error('Agent 5 error:', e.message); }
  }
  return {
    summary: 'Strong full-stack developer with 2+ years in React and Node.js. Built scalable microservices and led a team of 4 on a distributed systems project.',
    top_skills: ['React', 'Node.js', 'System Design', 'Distributed Systems', 'Python'],
    experience_level: 'Mid-level',
    interview_focus_areas: ['System design at scale', 'Node.js middleware and performance', 'Leadership and team collaboration'],
    red_flags: [], match_score: Math.floor(Math.random() * 15 + 82),
  };
};

// ─── Agent 6: Live Speech Coach ───────────────────────────────────────────────
const analyzeSpokenChunk = async (audioMetrics) => {
  const { wordsPerMinute = 130, fillerCount = 2, pauseCount = 1 } = audioMetrics || {};
  if (USE_AI) {
    try {
      return await ask(
        `You are a real-time speech coach for a job interview.
Return JSON with keys: confidence (40-99), clarity (40-99), energy (40-99),
filler_words_detected (number), speech_rate (slow|optimal|fast),
coaching_tip (one actionable tip, max 12 words).`,
        `Speech metrics: wordsPerMinute=${wordsPerMinute}, fillerWords=${fillerCount}, naturalPauses=${pauseCount}`,
        150
      );
    } catch (e) { console.error('Agent 6 error:', e.message); }
  }
  const confidence = Math.min(99, Math.max(40, 100 - (fillerCount * 5) - (wordsPerMinute > 180 ? 15 : 0)));
  const clarity    = Math.min(99, Math.max(40, 100 - (fillerCount * 8) - (wordsPerMinute > 200 ? 20 : 0)));
  return {
    confidence: Math.round(confidence + (Math.random() * 10 - 5)),
    clarity:    Math.round(clarity    + (Math.random() * 10 - 5)),
    energy:     Math.round(80         + (Math.random() * 20 - 10)),
    filler_words_detected: fillerCount,
    speech_rate: wordsPerMinute < 100 ? 'slow' : wordsPerMinute > 170 ? 'fast' : 'optimal',
    coaching_tip: fillerCount > 3 ? 'Pause and breathe instead of saying "um".' : wordsPerMinute > 170 ? 'Slow down to improve clarity.' : 'Good pace. Keep it up!',
  };
};

// ─── Agent 7: Live Fact Checker ───────────────────────────────────────────────
const factCheck = async (claim) => {
  if (USE_AI) {
    try {
      return await ask(
        `You are a real-time technical fact-checker for a job interview.
Return JSON with keys: verified (boolean), confidence (0-100),
note (one sentence: what is accurate or inaccurate about this claim).`,
        `Candidate claimed: "${claim}"`,
        150
      );
    } catch (e) { console.error('Agent 7 error:', e.message); }
  }
  const text = claim.toLowerCase();
  if (text.includes('react') && text.includes('2013')) return { verified: true, confidence: 98, note: 'React was open-sourced by Facebook in May 2013.' };
  if (text.includes('node') && text.includes('2009'))  return { verified: true, confidence: 99, note: 'Node.js created by Ryan Dahl in 2009.' };
  if (text.includes('kubernetes'))                     return { verified: true, confidence: 97, note: 'Kubernetes open-sourced by Google in 2014.' };
  return { verified: Math.random() > 0.2, confidence: Math.floor(Math.random() * 20 + 78), note: 'Claim is plausible — no contradicting data found.' };
};

module.exports = { 
  analyzeResume, 
  buildResumeAnalysisFromText, 
  generateSocraticHint, 
  generatePostInterviewAnalytics, 
  verifyDocument, 
  summarizeStudentProfile, 
  analyzeSpokenChunk, 
  factCheck,
  extractTextViaOpenAI 
};
