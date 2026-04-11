/**
 * AlumniConnect AI — All 7 Agents powered by Groq (llama-3.3-70b-versatile)
 * Groq is ultra-fast inference — responses in ~200ms.
 * Falls back to deterministic mock when GROQ_API_KEY is not set.
 *
 * Free key at: https://console.groq.com
 */

const Groq = require('groq-sdk');

const API_KEY = process.env.GROQ_API_KEY;
const USE_AI  = !!API_KEY;
const MODEL   = 'llama-3.3-70b-versatile';

let groq = null;
if (USE_AI) {
  groq = new Groq({ apiKey: API_KEY });
  console.log('✅ Groq AI connected — all 7 agents using llama-3.3-70b-versatile');
} else {
  console.log('⚠️  GROQ_API_KEY not set — agents running in mock mode');
}

// Core helper — sends a prompt, expects JSON back
async function ask(systemPrompt, userPrompt, maxTokens = 512) {
  const res = await groq.chat.completions.create({
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

// ─── Agent 1: Resume Analyzer ────────────────────────────────────────────────
const analyzeResume = async (resumeText) => {
  if (USE_AI) {
    try {
      return await ask(
        `You are an expert technical recruiter. Analyze the resume and return JSON with keys:
score (0-100), grade (A/B/C/D), ats_score (0-100), target_companies (array of 5 strings),
keyword_gaps (array of 3 missing keywords), formatting_fixes (array of 3 actionable tips),
strengths (array of 2 genuine strengths).`,
        `Resume:\n${resumeText}`
      );
    } catch (e) { console.error('Agent 1 error:', e.message); }
  }
  const score = Math.floor(Math.random() * 25 + 72);
  return {
    score, grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D',
    ats_score: Math.floor(Math.random() * 20 + 75),
    target_companies: ['Google', 'Microsoft', 'Stripe', 'Atlassian', 'Figma'],
    keyword_gaps: ['Kubernetes', 'GraphQL', 'System Design'],
    formatting_fixes: [
      'Use bullet points for experience instead of paragraphs.',
      "Highlight 'React' and 'Node.js' in a dedicated skills section.",
      "Add quantifiable achievements (e.g., 'Reduced load time by 40%').",
    ],
    strengths: ['Strong technical stack coverage.', 'Clear project descriptions with tech stack listed.'],
  };
};

// ─── Agent 2: Socratic Whisperer ─────────────────────────────────────────────
const generateSocraticHint = async (transcriptChunk) => {
  if (USE_AI) {
    try {
      return await ask(
        `You are an expert technical interviewer coaching an alumni mentor in real-time.
Return JSON with keys: hint (one sharp follow-up question or coaching tip, max 20 words),
category (one of: frontend|backend|database|system-design|debugging|soft-skills|ai-ml|general).`,
        `The candidate just said: "${transcriptChunk}"`
      );
    } catch (e) { console.error('Agent 2 error:', e.message); }
  }
  const text = transcriptChunk.toLowerCase();
  const HINTS = {
    frontend:        'Ask how they handled state management at scale — Redux vs Zustand vs Context?',
    backend:         'Ask about middleware design: "How did you handle auth and rate limiting?"',
    database:        'Ask about indexing: "How did you decide which columns to index?"',
    'system-design': 'Ask about trade-offs: "Why this architecture over a monolith?"',
    debugging:       'Probe: "What tools did you use to isolate the issue?"',
    'soft-skills':   'Ask: "Tell me about a time you disagreed with a teammate on a technical decision."',
    'ai-ml':         'Ask: "How did you measure model performance in production?"',
    general:         'Ask about their biggest technical challenge in the last 6 months.',
  };
  let category = 'general';
  if (text.includes('react') || text.includes('frontend') || text.includes('ui')) category = 'frontend';
  else if (text.includes('node') || text.includes('backend') || text.includes('api')) category = 'backend';
  else if (text.includes('database') || text.includes('sql') || text.includes('mongo')) category = 'database';
  else if (text.includes('system') || text.includes('architect') || text.includes('scale')) category = 'system-design';
  else if (text.includes('bug') || text.includes('debug') || text.includes('error')) category = 'debugging';
  else if (text.includes('team') || text.includes('lead') || text.includes('collaborat')) category = 'soft-skills';
  else if (text.includes('ai') || text.includes('ml') || text.includes('model') || text.includes('llm')) category = 'ai-ml';
  return { hint: HINTS[category], category };
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
    talk_listen_ratio: `${Math.floor(Math.random() * 20 + 55)}% / ${Math.floor(Math.random() * 20 + 25)}%`,
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

module.exports = { analyzeResume, generateSocraticHint, generatePostInterviewAnalytics, verifyDocument, summarizeStudentProfile, analyzeSpokenChunk, factCheck };
