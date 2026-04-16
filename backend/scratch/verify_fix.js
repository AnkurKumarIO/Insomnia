const { buildResumeAnalysisFromText } = require('../services/aiService');

const shortText = "Ankur Kumar. Software Engineer. React, Nodejs.";
const result = buildResumeAnalysisFromText(shortText);

console.log('Test Result for short text:', JSON.stringify(result, null, 2));

if (result.not_a_resume) {
  console.error('❌ FAIL: Document was rejected as not a resume.');
  process.exit(1);
} else {
  console.log('✅ PASS: Document was analyzed correctly despite being short.');
}
