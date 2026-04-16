require('dotenv').config();
const { analyzeResume } = require('../services/aiService');

async function testGroq() {
  console.log('Testing Groq AI (Resume Analyzer)...');
  const text = "Ankur Kumar. Experience: Software Engineer at Google. Skills: React, Node.js, AI.";
  try {
    const analysis = await analyzeResume(text);
    console.log('Groq Analysis Result:', JSON.stringify(analysis, null, 2));
    if (analysis.score > 0) {
      console.log('✅ Groq is working in real time!');
    }
  } catch (e) {
    console.error('Groq Test Failed:', e.message);
  }
}

testGroq();
