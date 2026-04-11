/**
 * Agent 1: The AI Resume Analyzer (Pre-Interview)
 * Mock logic representing Gemini processing a parsed PDF resume.
 * @param {string} resumeText 
 */
const analyzeResume = async (resumeText) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        score: Math.floor(Math.random() * 30 + 70), // Mock score 70-100
        target_companies: ["Google", "Microsoft", "Stripe", "Attlasian"],
        formatting_fixes: [
          "Use bullet points for experience instead of paragraphs.",
          "Highlight 'React' and 'Node.js' in a dedicated skills section."
        ]
      });
    }, 1200);
  });
};

/**
 * Agent 2: The Socratic Whisperer (Live Alumni AI)
 * Mock logic representing a prompt engineering wrapper around Gemini.
 * @param {string} transcriptChunk 
 */
const generateSocraticHint = async (transcriptChunk) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let hint = "";
      const text = transcriptChunk.toLowerCase();

      if (text.includes("react")) {
        hint = "Ask them how they handled state management or component lifecycles.";
      } else if (text.includes("database") || text.includes("sql")) {
        hint = "Ask about their experience with query optimization and index design.";
      } else if (text.includes("bug") || text.includes("error")) {
        hint = "Probe deeper into their systematic debugging approach.";
      } else {
        hint = "Ask about a time they disagreed with a teammate on architecture.";
      }

      resolve({ hint });
    }, 800);
  });
};

/**
 * Agent 3: The Post-Interview Analytics Generator
 * Aggregates live coach metrics and full interview transcripts for insights.
 * @param {Array} metricsArray 
 * @param {string} fullTranscript 
 */
const generatePostInterviewAnalytics = async (metricsArray, fullTranscript) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        overall_confidence: "82%",
        communication_clarity: "High",
        technical_depth: "Moderate",
        actionable_insights: [
          "Work on reducing filler words like 'um' and 'like'.",
          "You explained React well, but stumbled on Node.js middleware concepts. Review Express.js routing.",
          "Maintained good eye contact throughout the technical explanation."
        ],
        suggested_readings: [
          "https://react.dev/learn",
          "https://nodejs.org/en/docs/"
        ]
      });
    }, 2000);
  });
};

module.exports = {
  analyzeResume,
  generateSocraticHint,
  generatePostInterviewAnalytics
};
