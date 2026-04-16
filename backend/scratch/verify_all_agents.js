require('dotenv').config();
const { 
  analyzeResume, 
  generateSocraticHint, 
  generatePostInterviewAnalytics,
  summarizeStudentProfile,
  analyzeSpokenChunk,
  factCheck
} = require('../services/aiService');

async function verifyAll() {
  console.log('🚀 Starting Comprehensive AI Agent Verification...\n');

  // 1. Resume Analyzer
  console.log('--- Agent 1: Resume Analyzer ---');
  try {
    const res = await analyzeResume("John Doe. Experience: Senior Developer. Skills: React, Node.");
    console.log('✅ Agent 1 Working. Score:', res.score);
  } catch (e) { console.error('❌ Agent 1 Failed:', e.message); }

  // 2. Socratic Whisperer
  console.log('\n--- Agent 2: Socratic Whisperer ---');
  try {
    const res = await generateSocraticHint("I am implementing a Redux store for state management.");
    console.log('✅ Agent 2 Working. Hint:', res.hint);
  } catch (e) { console.error('❌ Agent 2 Failed:', e.message); }

  // 3. Post-Interview Analytics
  console.log('\n--- Agent 3: Post-Interview Analytics ---');
  try {
    const res = await generatePostInterviewAnalytics([{confidence: 85, clarity: 90}], "The interview went well.");
    console.log('✅ Agent 3 Working. Overall Score:', res.overall_score);
  } catch (e) { console.error('❌ Agent 3 Failed:', e.message); }

  // 5. Student Profile Summarizer
  console.log('\n--- Agent 5: Student Profile Summarizer ---');
  try {
    const res = await summarizeStudentProfile({ name: "Alice", skills: ["Python", "ML"] });
    console.log('✅ Agent 5 Working. Summary:', res.summary);
  } catch (e) { console.error('❌ Agent 5 Failed:', e.message); }

  // 6. Live Speech Coach
  console.log('\n--- Agent 6: Live Speech Coach ---');
  try {
    const res = await analyzeSpokenChunk({ wordsPerMinute: 140, fillerCount: 1 });
    console.log('✅ Agent 6 Working. Tip:', res.coaching_tip);
  } catch (e) { console.error('❌ Agent 6 Failed:', e.message); }

  // 7. Fact Checker
  console.log('\n--- Agent 7: Live Fact Checker ---');
  try {
    const res = await factCheck("React was created by Facebook in 2013.");
    console.log('✅ Agent 7 Working. Verified:', res.verified);
  } catch (e) { console.error('❌ Agent 7 Failed:', e.message); }

  console.log('\n✨ Verification Finished.');
}

verifyAll();
