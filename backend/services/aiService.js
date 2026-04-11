const Groq = require('groq-sdk');

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const MODEL = 'llama-3.3-70b-versatile';

// Shared helper — call Groq and parse JSON from the response
async function callAI(prompt, fallback) {
  if (!groq) {
    console.warn('[Groq] API key not set — using fallback');
    return fallback;
  }
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1024,
    });

    const text  = completion.choices[0]?.message?.content?.trim() || '';
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('[Groq] Error:', err.message);
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 1: Resume Analyzer
// ─────────────────────────────────────────────────────────────────────────────
const analyzeResume = async (resumeText) => {
  const prompt = `You are an expert technical recruiter. Analyze this resume and return ONLY a JSON object with these exact fields:
{
  "score": <integer 0-100>,
  "target_companies": [<4-5 company names matching the candidate>],
  "formatting_fixes": [<3-5 specific actionable improvements>],
  "strengths": [<2-3 key strengths>],
  "summary": "<one sentence candidate summary>"
}

Resume:
"""
${resumeText.slice(0, 3000)}
"""

Return ONLY valid JSON, no markdown, no explanation.`;

  return callAI(prompt, {
    score: 72,
    target_companies: ['Google', 'Microsoft', 'Stripe', 'Atlassian', 'Razorpay'],
    formatting_fixes: [
      'Use bullet points for experience instead of paragraphs.',
      'Add a dedicated Skills section highlighting your top technologies.',
      'Quantify achievements with metrics (e.g. reduced load time by 40%).',
    ],
    strengths: ['Strong technical foundation', 'Relevant project experience'],
    summary: 'A motivated developer with hands-on experience in modern web technologies.',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Agent 2: Socratic Whisperer (live interview coaching)
// ─────────────────────────────────────────────────────────────────────────────
const generateSocraticHint = async (transcriptChunk) => {
  const prompt = `You are an expert technical interview coach helping an alumni mentor in real-time.

The student just said:
"""
${transcriptChunk.slice(0, 500)}
"""

Generate ONE sharp Socratic follow-up question or coaching hint the alumni should ask next to probe deeper. Be specific to what the student said.

Return ONLY this JSON:
{ "hint": "<your coaching hint>" }`;

  return callAI(prompt, {
    hint: "Ask them to walk you through the most complex system they've ever built end-to-end.",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Agent 3: Post-Interview Analytics
// ─────────────────────────────────────────────────────────────────────────────
const generatePostInterviewAnalytics = async (metricsArray, fullTranscript) => {
  const metricsText = metricsArray.length > 0
    ? `Live metrics: ${JSON.stringify(metricsArray)}`
    : 'No live metrics recorded.';

  const transcriptText = fullTranscript
    ? `Transcript:\n"""\n${fullTranscript.slice(0, 2000)}\n"""`
    : 'No transcript available.';

  const prompt = `You are an expert interview performance analyst. Analyze this mock interview data.

${metricsText}
${transcriptText}

Return ONLY this JSON:
{
  "overall_confidence": "<percentage like '78%'>",
  "communication_clarity": "<High / Moderate / Low>",
  "technical_depth": "<High / Moderate / Low>",
  "actionable_insights": [<3-5 specific personalized improvement tips>],
  "suggested_readings": [<2-3 relevant resource URLs or titles>],
  "score": <integer 0-100>
}`;

  return callAI(prompt, {
    overall_confidence: '75%',
    communication_clarity: 'Moderate',
    technical_depth: 'Moderate',
    actionable_insights: [
      'Structure answers using the STAR method for behavioral questions.',
      "Reduce filler words — pause instead of saying 'um' or 'like'.",
      'Quantify your impact when describing past projects.',
    ],
    suggested_readings: [
      'https://www.techinterviewhandbook.org',
      'https://leetcode.com/explore/',
    ],
    score: 75,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Agent 4: Profile Strength Analyzer
// ─────────────────────────────────────────────────────────────────────────────
const analyzeProfileStrength = async (profileData) => {
  const prompt = `You are a career coach reviewing a student's profile for job readiness.

Profile:
${JSON.stringify(profileData, null, 2).slice(0, 1500)}

Return ONLY this JSON:
{
  "score": <integer 0-100>,
  "label": "<Starter / Growing / Strong / Expert>",
  "missing": [<2-3 specific things to add to improve the profile>],
  "top_skills": [<top 3 skills from the profile>]
}`;

  return callAI(prompt, {
    score: 60,
    label: 'Growing',
    missing: ['Add a GitHub link', 'Upload your resume', 'Add target companies'],
    top_skills: [],
  });
};

module.exports = {
  analyzeResume,
  generateSocraticHint,
  generatePostInterviewAnalytics,
  analyzeProfileStrength,
};
