const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI  = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Shared helper — call Gemini and parse JSON from the response
async function callGemini(prompt, fallback) {
  if (!genAI) {
    console.warn('[Gemini] API key not set — using fallback');
    return fallback;
  }
  try {
    const model  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();

    // Strip markdown code fences if present
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('[Gemini] Error:', err.message);
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 1: Resume Analyzer
// ─────────────────────────────────────────────────────────────────────────────
const analyzeResume = async (resumeText) => {
  const prompt = `
You are an expert technical recruiter and career coach. Analyze the following resume text and return a JSON object with exactly these fields:

{
  "score": <integer 0-100 representing overall resume quality>,
  "target_companies": [<array of 4-5 company names that match the candidate's profile>],
  "formatting_fixes": [<array of 3-5 specific, actionable improvements>],
  "strengths": [<array of 2-3 key strengths found in the resume>],
  "summary": "<one sentence summary of the candidate's profile>"
}

Resume text:
"""
${resumeText}
"""

Return ONLY valid JSON, no markdown, no explanation.`;

  const fallback = {
    score: 72,
    target_companies: ['Google', 'Microsoft', 'Stripe', 'Atlassian', 'Razorpay'],
    formatting_fixes: [
      'Use bullet points for experience instead of paragraphs.',
      "Add a dedicated Skills section highlighting your top technologies.",
      'Quantify your achievements with metrics (e.g. reduced load time by 40%).',
    ],
    strengths: ['Strong technical foundation', 'Relevant project experience'],
    summary: 'A motivated developer with hands-on experience in modern web technologies.',
  };

  return callGemini(prompt, fallback);
};

// ─────────────────────────────────────────────────────────────────────────────
// Agent 2: Socratic Whisperer (live interview coaching hints)
// ─────────────────────────────────────────────────────────────────────────────
const generateSocraticHint = async (transcriptChunk) => {
  const prompt = `
You are an expert technical interview coach assisting an alumni mentor in real-time during a mock interview.

The student just said:
"""
${transcriptChunk}
"""

Generate ONE sharp, Socratic follow-up question or coaching hint the alumni should ask next to probe deeper. 
The hint should be specific to what the student said, not generic.

Return ONLY a JSON object:
{ "hint": "<your coaching hint here>" }

No markdown, no explanation, just JSON.`;

  const fallback = {
    hint: "Ask them to walk you through the most complex system they've ever built end-to-end.",
  };

  return callGemini(prompt, fallback);
};

// ─────────────────────────────────────────────────────────────────────────────
// Agent 3: Post-Interview Analytics Generator
// ─────────────────────────────────────────────────────────────────────────────
const generatePostInterviewAnalytics = async (metricsArray, fullTranscript) => {
  const metricsText = metricsArray.length > 0
    ? `Live metrics recorded during the interview: ${JSON.stringify(metricsArray)}`
    : 'No live metrics recorded.';

  const transcriptText = fullTranscript
    ? `Full interview transcript:\n"""\n${fullTranscript}\n"""`
    : 'No transcript available.';

  const prompt = `
You are an expert interview performance analyst. Analyze the following mock interview data and return a detailed JSON report.

${metricsText}

${transcriptText}

Return a JSON object with exactly these fields:
{
  "overall_confidence": "<percentage like '78%' or qualitative like 'High/Moderate/Low'>",
  "communication_clarity": "<High / Moderate / Low>",
  "technical_depth": "<High / Moderate / Low>",
  "actionable_insights": [<array of 3-5 specific, personalized improvement tips based on the transcript>],
  "suggested_readings": [<array of 2-3 relevant URLs or resource titles>],
  "score": <integer 0-100 overall performance score>
}

Return ONLY valid JSON, no markdown, no explanation.`;

  const fallback = {
    overall_confidence: '75%',
    communication_clarity: 'Moderate',
    technical_depth: 'Moderate',
    actionable_insights: [
      "Structure answers using the STAR method for behavioral questions.",
      "Reduce filler words — pause instead of saying 'um' or 'like'.",
      "Quantify your impact when describing past projects.",
    ],
    suggested_readings: [
      'https://www.techinterviewhandbook.org',
      'https://leetcode.com/explore/',
    ],
    score: 75,
  };

  return callGemini(prompt, fallback);
};

// ─────────────────────────────────────────────────────────────────────────────
// Agent 4: AI Profile Strength Analyzer
// ─────────────────────────────────────────────────────────────────────────────
const analyzeProfileStrength = async (profileData) => {
  const prompt = `
You are a career coach reviewing a student's profile for job readiness.

Profile:
${JSON.stringify(profileData, null, 2)}

Return a JSON object:
{
  "score": <integer 0-100>,
  "label": "<Starter / Growing / Strong / Expert>",
  "missing": [<array of 2-3 specific things they should add to improve their profile>],
  "top_skills": [<array of their top 3 skills from the profile>]
}

Return ONLY valid JSON, no markdown.`;

  const fallback = {
    score: 60,
    label: 'Growing',
    missing: ['Add a GitHub link', 'Upload your resume', 'Add target companies'],
    top_skills: [],
  };

  return callGemini(prompt, fallback);
};

module.exports = {
  analyzeResume,
  generateSocraticHint,
  generatePostInterviewAnalytics,
  analyzeProfileStrength,
};
