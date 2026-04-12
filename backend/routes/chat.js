const express = require('express');
const router  = express.Router();
const Groq    = require('groq-sdk');

const groq  = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const MODEL = 'llama-3.3-70b-versatile';

// POST /chat/interview — AI interview coach chat
router.post('/interview', async (req, res) => {
  const { messages, role } = req.body; // role: 'coach' | 'interviewer'

  if (!groq) return res.status(503).json({ error: 'AI not configured.' });

  const systemPrompt = role === 'interviewer'
    ? `You are Alex, an expert technical interviewer with 8 years of experience at top tech companies. 
You conduct mock interviews for software engineering roles. Ask sharp, relevant technical and behavioral questions. 
Keep responses concise (2-4 sentences max). Be encouraging but rigorous.`
    : `You are an expert AI interview coach helping a student prepare for technical interviews. 
Give specific, actionable advice. When asked for a question, provide one relevant interview question. 
Keep responses concise (2-4 sentences max). Be warm and encouraging.`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10), // last 10 messages for context
      ],
      temperature: 0.7,
      max_tokens: 256,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || 'I had trouble responding. Please try again.';
    res.json({ reply });
  } catch (err) {
    console.error('[Chat] Groq error:', err.message);
    res.status(500).json({ error: 'AI response failed.', reply: "I'm having trouble connecting. Please try again." });
  }
});

// POST /chat/questions — generate interview questions for a topic
router.post('/questions', async (req, res) => {
  const { topic, count = 7 } = req.body;

  if (!groq) return res.status(503).json({ error: 'AI not configured.' });

  const prompt = `Generate ${count} diverse mock interview questions for a software engineering candidate${topic ? ` focusing on ${topic}` : ''}.
Mix behavioral, technical, and system design questions.

Return ONLY a JSON array:
[
  { "q": "<question text>", "cat": "<Intro|Behavioral|Technical|System Design|Career>" }
]

No markdown, no explanation.`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 512,
    });

    const text  = completion.choices[0]?.message?.content?.trim() || '[]';
    const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const questions = JSON.parse(clean);
    res.json({ questions });
  } catch (err) {
    console.error('[Questions] Groq error:', err.message);
    // Fallback questions
    res.json({
      questions: [
        { q: "Tell me about yourself and your background.", cat: "Intro" },
        { q: "Describe a challenging technical problem you solved recently.", cat: "Behavioral" },
        { q: "How would you design a scalable notification system?", cat: "System Design" },
        { q: "What's the difference between SQL and NoSQL databases?", cat: "Technical" },
        { q: "How do you handle conflicts within your team?", cat: "Behavioral" },
        { q: "Explain the concept of microservices and their trade-offs.", cat: "System Design" },
        { q: "Where do you see yourself in 5 years?", cat: "Career" },
      ]
    });
  }
});

module.exports = router;
