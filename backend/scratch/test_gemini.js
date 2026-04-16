require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in .env');
    return;
  }

  console.log('Testing Gemini 1.5 Flash...');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Use a dummy text to test connectivity and basic response
  try {
    const result = await model.generateContent('Hi, can you confirm you are Gemini 1.5 Flash?');
    console.log('Gemini Response:', result.response.text());
  } catch (e) {
    console.error('Gemini Test Failed:', e.message);
  }
}

testGemini();
