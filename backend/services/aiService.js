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
 * Context-aware hint engine — analyses transcript and returns targeted coaching.
 * @param {string} transcriptChunk 
 */
const generateSocraticHint = async (transcriptChunk) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const text = transcriptChunk.toLowerCase();

      // Topic → hint map (ordered by specificity)
      const rules = [
        // Frontend
        { keys: ['react', 'jsx', 'component', 'hook', 'useeffect', 'usestate'],
          hints: [
            "Ask how they handle state management at scale — Redux vs Zustand vs Context?",
            "Probe their understanding of React's reconciliation algorithm and virtual DOM diffing.",
            "Ask about their experience with React Server Components or concurrent features.",
          ]
        },
        { keys: ['css', 'tailwind', 'styled', 'animation', 'responsive'],
          hints: [
            "Ask how they approach design systems and component reusability across teams.",
            "Probe their understanding of CSS specificity, cascade, and performance implications.",
          ]
        },
        // Backend
        { keys: ['node', 'express', 'api', 'rest', 'graphql', 'endpoint'],
          hints: [
            "Ask how they handle API versioning and backward compatibility in production.",
            "Probe their approach to rate limiting, authentication middleware, and error handling.",
            "Ask about their experience designing idempotent APIs.",
          ]
        },
        { keys: ['database', 'sql', 'postgres', 'mysql', 'query', 'index', 'schema'],
          hints: [
            "Ask about their experience with query optimization — EXPLAIN plans, index strategies.",
            "Probe their understanding of ACID properties and when to use NoSQL vs relational.",
            "Ask how they handle database migrations in a zero-downtime deployment.",
          ]
        },
        { keys: ['redis', 'cache', 'caching', 'memcache'],
          hints: [
            "Ask how they decide what to cache and how they handle cache invalidation.",
            "Probe their understanding of cache stampede and how to prevent it.",
          ]
        },
        // System design
        { keys: ['scale', 'scalab', 'microservice', 'distributed', 'load balanc', 'kubernetes', 'docker'],
          hints: [
            "Ask how they'd design a system to handle 10x traffic overnight — what breaks first?",
            "Probe their understanding of CAP theorem and how it influenced their design decisions.",
            "Ask about their experience with service discovery and inter-service communication.",
          ]
        },
        { keys: ['kafka', 'queue', 'message', 'event', 'pubsub', 'rabbitmq'],
          hints: [
            "Ask how they handle message ordering guarantees and exactly-once delivery.",
            "Probe their experience with dead-letter queues and retry strategies.",
          ]
        },
        // AI/ML
        { keys: ['machine learning', 'ml', 'model', 'llm', 'gpt', 'ai', 'neural', 'training'],
          hints: [
            "Ask how they evaluate model performance beyond accuracy — precision, recall, F1?",
            "Probe their understanding of model drift and how they monitor production ML systems.",
            "Ask about their experience with prompt engineering and LLM token efficiency.",
          ]
        },
        // Soft skills / leadership
        { keys: ['team', 'lead', 'manage', 'conflict', 'disagree', 'mentor'],
          hints: [
            "Ask for a specific example where they had to influence without authority.",
            "Probe how they give constructive feedback to peers — ask for a real scenario.",
            "Ask how they prioritize when everything is urgent and stakeholders disagree.",
          ]
        },
        { keys: ['fail', 'mistake', 'wrong', 'bug', 'error', 'incident', 'outage'],
          hints: [
            "Probe deeper — ask what they'd do differently and what systemic change they made.",
            "Ask how they communicated the incident to stakeholders and what the post-mortem looked like.",
          ]
        },
        { keys: ['project', 'built', 'shipped', 'launched', 'delivered'],
          hints: [
            "Ask about the biggest technical challenge they faced and how they unblocked it.",
            "Probe the impact — ask for specific metrics: users, revenue, latency improvement.",
            "Ask what they'd redesign if they started the project today.",
          ]
        },
        // Security
        { keys: ['security', 'auth', 'oauth', 'jwt', 'xss', 'csrf', 'injection'],
          hints: [
            "Ask how they stay current with security vulnerabilities in their stack.",
            "Probe their understanding of the OWASP Top 10 and which they've encountered.",
          ]
        },
      ];

      // Find matching rule
      for (const rule of rules) {
        if (rule.keys.some(k => text.includes(k))) {
          const hint = rule.hints[Math.floor(Math.random() * rule.hints.length)];
          return resolve({ hint });
        }
      }

      // Generic fallbacks
      const fallbacks = [
        "Ask them to walk you through the most complex system they've ever built end-to-end.",
        "Probe their decision-making process — ask 'why this approach over alternatives?'",
        "Ask about a time they had to learn something completely new under time pressure.",
        "Ask what they're currently learning and why they chose that topic.",
        "Probe their understanding of trade-offs — ask 'what would you sacrifice for speed?'",
      ];
      resolve({ hint: fallbacks[Math.floor(Math.random() * fallbacks.length)] });
    }, 600);
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
