const fs = require('fs');
const file = 'frontend/src/DualAgentInterviewRoom.jsx';
let text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// Skip analytics API call for interviewer — they just need the rating screen
const OLD = `  const endSession = async () => {
    clearInterval(timerRef.current);
    clearInterval(metricsRef.current);
    clearInterval(suggestionRef.current);
    setEnded(true);
    try {
      const data = await api.interviewAnalytics({`;

const NEW = `  const endSession = async () => {
    clearInterval(timerRef.current);
    clearInterval(metricsRef.current);
    clearInterval(suggestionRef.current);
    setEnded(true);
    // Interviewer goes straight to rating screen — no analytics needed
    if (isInterviewer) return;
    try {
      const data = await api.interviewAnalytics({`;

if (text.includes(OLD)) {
  text = text.replace(OLD, NEW);
  fs.writeFileSync(file, text, 'utf8');
  console.log('endSession patched for interviewer');
} else {
  console.log('Pattern not found');
}
