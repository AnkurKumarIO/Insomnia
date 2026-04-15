const API_BASE  = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const ROOT_BASE = API_BASE;

// ─── Mock data (used when backend is unreachable) ───────────────────────────

const MOCK_TOKEN = 'mock-jwt-token-for-local-dev';
const mockDelay = (ms = 600) => new Promise(r => setTimeout(r, ms));

const MOCK_USERS = {
  students: [
    { id: 'stu-001', name: 'Alice Johnson', role: 'STUDENT', department: 'Computer Science' },
    { id: 'stu-002', name: 'Bob Smith',     role: 'STUDENT', department: 'Electrical Engineering' },
  ],
  alumni: [
    { id: 'alm-001', name: 'Priya Sharma',  role: 'ALUMNI', department: 'Computer Science' },
    { id: 'alm-002', name: 'Rahul Verma',   role: 'ALUMNI', department: 'Electrical Engineering' },
  ],
  tnp: { id: 'tnp-001', name: 'TNP Coordinator', role: 'TNP' },
};

const MOCK_API = {
  health: async () => ({ status: 'ok (mock)', message: 'Running in offline/mock mode' }),

  studentVerify: async () => {
    await mockDelay();
    return { token: MOCK_TOKEN, user: MOCK_USERS.students[0] };
  },

  tnpLogin: async (username, password) => {
    await mockDelay();
    if (username === 'admin' && password === 'tnp_secure_123') {
      return { token: MOCK_TOKEN, user: MOCK_USERS.tnp };
    }
    return { error: 'Invalid credentials. Use admin / tnp_secure_123' };
  },

  alumniLogin: async (name, email, department) => {
    await mockDelay();
    if (!name || !email) return { error: 'Name and email are required.' };
    return { token: MOCK_TOKEN, user: { id: 'alm-' + Date.now(), name, role: 'ALUMNI', department: department || 'General' } };
  },

  resumeAnalyze: async () => {
    await mockDelay(1200);
    return {
      message: 'Resume analyzed (mock)',
      analysis: {
        score: 87,
        target_companies: ['Google', 'Microsoft', 'Stripe', 'Atlassian'],
        formatting_fixes: [
          'Use bullet points for experience instead of paragraphs.',
          "Highlight 'React' and 'Node.js' in a dedicated skills section.",
        ],
      },
    };
  },

  interviewAnalytics: async () => {
    await mockDelay(1500);
    return {
      message: 'Analytics generated (mock)',
      analytics: {
        overall_confidence: '82%',
        communication_clarity: 'High',
        technical_depth: 'Moderate',
        actionable_insights: [
          "Work on reducing filler words like 'um' and 'like'.",
          'You explained React well, but stumbled on Node.js middleware. Review Express.js routing.',
          'Maintained good eye contact throughout the technical explanation.',
        ],
        suggested_readings: ['https://react.dev/learn', 'https://nodejs.org/en/docs/'],
      },
    };
  },

  getRequests: async () => {
    await mockDelay(400);
    return [];
  },

  createRequest: async (payload) => {
    await mockDelay(400);
    return { request_id: `mock-${Date.now()}`, ...payload, status: 'PENDING' };
  },

  updateRequest: async (id, updates) => {
    await mockDelay(400);
    return { request_id: id, ...updates };
  },

  getNotifications: async () => {
    await mockDelay(300);
    return [];
  },

  markNotifsRead: async () => {
    await mockDelay(200);
    return { success: true };
  },
};

// ─── Backend availability check ─────────────────────────────────────────────

let _backendAvailable = null;

async function isBackendUp() {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    _backendAvailable = res.ok;
  } catch {
    _backendAvailable = false;
  }
  return _backendAvailable;
}

async function callOrMock(realFn, mockFn) {
  if (await isBackendUp()) {
    try { return await realFn(); } catch { return await mockFn(); }
  }
  return await mockFn();
}

// ─── Public API ─────────────────────────────────────────────────────────────

export const api = {
  health: () => callOrMock(
    () => fetch(`${API_BASE}/health`).then(r => r.json()),
    MOCK_API.health
  ),

  studentVerify: (file) => callOrMock(
    () => {
      const fd = new FormData();
      fd.append('idDocument', file);
      return fetch(`${API_BASE}/auth/student/verify`, { method: 'POST', body: fd }).then(r => r.json());
    },
    () => MOCK_API.studentVerify(file)
  ),

  tnpLogin: (username, password) => callOrMock(
    () => fetch(`${API_BASE}/auth/tnp/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(r => r.json()),
    () => MOCK_API.tnpLogin(username, password)
  ),

  studentRegister: (data) => callOrMock(
    () => fetch(`${API_BASE}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
    async () => { await mockDelay(); return { token: MOCK_TOKEN, user: { ...data, id: 'stu-new', role: 'STUDENT' } }; }
  ),

  studentLogin: (username, password) => callOrMock(
    () => fetch(`${API_BASE}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(r => r.json()),
    async () => { await mockDelay(); return { token: MOCK_TOKEN, user: MOCK_USERS.students[0] }; }
  ),

  alumniRegister: (data) => callOrMock(
    () => fetch(`${API_BASE}/auth/alumni/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
    async () => { await mockDelay(); return { token: MOCK_TOKEN, user: { ...data, id: 'alm-new', role: 'ALUMNI' } }; }
  ),

  alumniLogin: (username, password) => callOrMock(
    () => fetch(`${API_BASE}/auth/alumni/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(r => r.json()),
    async () => { await mockDelay(); return { token: MOCK_TOKEN, user: MOCK_USERS.alumni[0] }; }
  ),

  resumeAnalyze: (file, userId) => callOrMock(
    () => {
      const fd = new FormData();
      fd.append('resume', file);
      if (userId) fd.append('userId', userId);
      return fetch(`${API_BASE}/ai/resume-analyze`, { method: 'POST', body: fd }).then(r => r.json());
    },
    () => MOCK_API.resumeAnalyze(file)
  ),

  interviewAnalytics: (data) => callOrMock(
    () => fetch(`${API_BASE}/ai/interview-analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
    () => MOCK_API.interviewAnalytics(data)
  ),

  // Agent 4: Document Verifier
  verifyDocument: (file) => callOrMock(
    () => {
      const fd = new FormData();
      fd.append('document', file);
      return fetch(`${API_BASE}/ai/verify-document`, { method: 'POST', body: fd }).then(r => r.json());
    },
    async () => ({ result: { verified: true, confidence: 96, extracted: { name: 'Alice Johnson', college_id: 'STU1001' }, message: 'Document verified (mock)' } })
  ),

  // Agent 5: Student Profile Summarizer
  summarizeProfile: (profileData) => callOrMock(
    () => fetch(`${API_BASE}/ai/summarize-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileData }),
    }).then(r => r.json()),
    async () => ({
      summary: {
        summary: 'Strong full-stack developer with React and Node.js experience. Led a team of 4 on a distributed systems project. Seeking guidance on system architecture.',
        top_skills: ['React', 'Node.js', 'System Design', 'Python'],
        experience_level: 'Mid-level',
        interview_focus_areas: ['System design at scale', 'Node.js performance', 'Leadership'],
        match_score: 88,
      }
    })
  ),

  profileStrength: (profileData) => callOrMock(
    () => fetch(`${API_BASE}/ai/profile-strength`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileData }),
    }).then(r => r.json()),
    async () => { await mockDelay(600); return { score: 60, label: 'Growing', missing: ['Add GitHub link', 'Upload resume'], top_skills: [] }; }
  ),

  // Agent 6: Speech Analysis
  analyzeSpeech: (metrics) => callOrMock(
    () => fetch(`${API_BASE}/ai/analyze-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics),
    }).then(r => r.json()),
    async () => ({ result: { confidence: 82, clarity: 76, energy: 85, coaching_tip: 'Good pace. Keep it up!' } })
  ),

  // Agent 7: Fact Checker
  factCheck: (claim) => callOrMock(
    () => fetch(`${API_BASE}/ai/fact-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim }),
    }).then(r => r.json()),
    async () => ({ claim, result: { verified: true, confidence: 95, note: 'Claim verified (mock)' } })
  ),

  fetchAlumni: () => callOrMock(
    () => fetch(`${API_BASE}/auth/alumni`).then(r => r.json()),
    async () => { await mockDelay(); return MOCK_USERS.alumni; }
  ),

  getRequests: (params = {}) => callOrMock(
    () => {
      const qs = new URLSearchParams(params).toString();
      return fetch(`${API_BASE}/requests?${qs}`).then(r => r.json());
    },
    () => MOCK_API.getRequests(params)
  ),

  createRequest: (payload) => callOrMock(
    () => fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => r.json()),
    () => MOCK_API.createRequest(payload)
  ),

  updateRequest: (id, updates) => callOrMock(
    () => fetch(`${API_BASE}/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(r => r.json()),
    () => MOCK_API.updateRequest(id, updates)
  ),

  getNotifications: (userId) => callOrMock(
    () => fetch(`${API_BASE}/notifications?userId=${userId}`).then(r => r.json()),
    () => MOCK_API.getNotifications(userId)
  ),

  markNotifsRead: (userId) => callOrMock(
    () => fetch(`${API_BASE}/notifications/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).then(r => r.json()),
    () => MOCK_API.markNotifsRead(userId)
  ),

  saveProfile: (userId, profileData) => callOrMock(
    () => fetch(`${API_BASE}/users/${userId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    }).then(r => r.json()),
    async () => { await mockDelay(400); return { message: 'Profile saved (mock)' }; }
  ),

  getUser: (userId) => callOrMock(
    () => fetch(`${API_BASE}/users/${userId}`).then(r => r.json()),
    async () => { await mockDelay(300); return null; }
  ),

  getUserByEmail: (email) => callOrMock(
    () => fetch(`${API_BASE}/users/by-email/${encodeURIComponent(email)}`).then(r => r.json()),
    async () => { await mockDelay(300); return null; }
  ),

  getInterviewRecords: (userId) => callOrMock(
    () => fetch(`${API_BASE}/stats/interviews?userId=${userId}`).then(r => r.json()),
    async () => { await mockDelay(400); return []; }
  ),

  getPlatformStats: () => callOrMock(
    () => fetch(`${API_BASE}/stats/platform`).then(r => r.json()),
    async () => { await mockDelay(400); return { verified_students: 5, active_mentors: 6, mock_interviews: 0, scheduled_today: 0 }; }
  ),

  getInterviewQuestions: (topic) => callOrMock(
    () => fetch(`${API_BASE}/chat/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    }).then(r => r.json()),
    async () => {
      await mockDelay(600);
      return { questions: [
        { q: "Tell me about yourself and your background.", cat: "Intro" },
        { q: "Describe a challenging technical problem you solved recently.", cat: "Behavioral" },
        { q: "How would you design a scalable notification system?", cat: "System Design" },
        { q: "What's the difference between SQL and NoSQL databases?", cat: "Technical" },
        { q: "How do you handle conflicts within your team?", cat: "Behavioral" },
        { q: "Explain the concept of microservices and their trade-offs.", cat: "System Design" },
        { q: "Where do you see yourself in 5 years?", cat: "Career" },
      ]};
    }
  ),

  // ─── Google Meet Integration ─────────────────────────────────────────────

  createMeetLink: (roomId, title) => callOrMock(
    () => fetch(`${API_BASE}/meet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, title, consistent: true }),
    }).then(r => r.json()),
    async () => {
      await mockDelay(300);
      return {
        success: true,
        meetLink: `https://meet.google.com/alumnex-${roomId}`,
        roomId,
        title: title || `AlumNEX Interview - Room ${roomId}`,
      };
    }
  ),

  getMeetLink: (roomId) => callOrMock(
    () => fetch(`${API_BASE}/meet/${roomId}`).then(r => r.json()),
    async () => {
      await mockDelay(200);
      return {
        success: true,
        meetLink: `https://meet.google.com/alumnex-${roomId}`,
        roomId,
      };
    }
  ),

  createCustomMeetLink: (code) => callOrMock(
    () => fetch(`${API_BASE}/meet/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).then(r => r.json()),
    async () => {
      await mockDelay(200);
      return {
        success: true,
        meetLink: `https://meet.google.com/${code}`,
        code,
      };
    }
  ),

  validateMeetUrl: (url) => callOrMock(
    () => fetch(`${API_BASE}/meet/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }).then(r => r.json()),
    async () => {
      await mockDelay(100);
      return {
        success: true,
        isValid: /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i.test(url),
        url,
      };
    }
  ),
};

export const SOCKET_URL = ROOT_BASE;
