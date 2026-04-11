const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Mock data (used when backend is unreachable) ───────────────────────────

const MOCK_TOKEN = 'mock-jwt-token-for-local-dev';
const mockDelay = (ms = 600) => new Promise(r => setTimeout(r, ms));

const MOCK_API = {
  health: async () => ({ status: 'ok (mock)', message: 'Running in offline/mock mode' }),

  studentVerify: async () => {
    await mockDelay();
    return { token: MOCK_TOKEN, user: { id: 'stu-001', name: 'Alice Johnson', role: 'STUDENT', department: 'Computer Science' } };
  },

  tnpLogin: async (username, password) => {
    await mockDelay();
    if (username === 'admin' && password === 'tnp_secure_123') {
      return { token: MOCK_TOKEN, user: { id: 'tnp-001', name: 'TNP Coordinator', role: 'TNP' } };
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

  getRequests: async ({ alumniId, studentId } = {}) => {
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

  alumniLogin: (name, email, department) => callOrMock(
    () => fetch(`${API_BASE}/auth/alumni/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, department }),
    }).then(r => r.json()),
    () => MOCK_API.alumniLogin(name, email, department)
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

  profileStrength: (profileData) => callOrMock(
    () => fetch(`${API_BASE}/ai/profile-strength`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileData }),
    }).then(r => r.json()),
    async () => { await mockDelay(600); return { score: 60, label: 'Growing', missing: ['Add GitHub link', 'Upload resume'], top_skills: [] }; }
  ),

  // ── Interview Requests ──────────────────────────────────────

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

  // ── Notifications ───────────────────────────────────────────

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

  // ── User Profile ────────────────────────────────────────────

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

  // ── Student Register ────────────────────────────────────────

  studentRegister: (payload) => callOrMock(
    () => fetch(`${API_BASE}/register/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(r => r.json()),
    async () => { await mockDelay(500); return { user: { id: `stu-${Date.now()}` } }; }
  ),

  // ── Alumni ──────────────────────────────────────────────────

  getAlumni: () => callOrMock(
    () => fetch(`${API_BASE}/alumni`).then(r => r.json()),
    async () => {
      await mockDelay(500);
      return [
        { id: 'alm-1', name: 'Priya Sharma',  company: 'Google',    department: 'Computer Science',       batch_year: 2019, profile_data: { bio: 'Senior SWE at Google. Expert in distributed systems.', skills: ['System Design','Go','Python','Kubernetes'], openTo: ['Mock Interviews','Resume Review'] } },
        { id: 'alm-2', name: 'Rahul Verma',   company: 'Microsoft', department: 'Electrical Engineering', batch_year: 2018, profile_data: { bio: 'Principal Engineer at Azure. Cloud & DevOps specialist.', skills: ['Azure','DevOps','C#','Terraform'], openTo: ['Mock Interviews','Career Guidance'] } },
        { id: 'alm-3', name: 'Ananya Iyer',   company: 'Stripe',    department: 'Computer Science',       batch_year: 2020, profile_data: { bio: 'Full Stack Engineer at Stripe. React & Node.js expert.', skills: ['React','TypeScript','Node.js','GraphQL'], openTo: ['Mock Interviews','Resume Review'] } },
        { id: 'alm-4', name: 'Karan Mehta',   company: 'Amazon',    department: 'Information Technology', batch_year: 2017, profile_data: { bio: 'Engineering Manager at Amazon. Leadership & system design.', skills: ['Leadership','Java','AWS','Agile'], openTo: ['Mock Interviews','Career Guidance'] } },
        { id: 'alm-5', name: 'Sneha Patel',   company: 'Atlassian', department: 'Computer Science',       batch_year: 2021, profile_data: { bio: 'Product Engineer at Atlassian. Frontend & product thinking.', skills: ['React','JavaScript','Figma','Jest'], openTo: ['Mock Interviews','Internship Guidance'] } },
        { id: 'alm-6', name: 'Arjun Nair',    company: 'Uber',      department: 'Electronics & Communication', batch_year: 2016, profile_data: { bio: 'Staff Engineer at Uber Maps. DSA & competitive programming mentor.', skills: ['C++','Python','Kafka','DSA'], openTo: ['Mock Interviews','DSA Coaching'] } },
      ];
    }
  ),

  // ── Stats ────────────────────────────────────────────────────

  getPlatformStats: () => callOrMock(
    () => fetch(`${API_BASE}/stats/platform`).then(r => r.json()),
    async () => { await mockDelay(400); return { verified_students: 5, active_mentors: 6, mock_interviews: 0, scheduled_today: 0 }; }
  ),

  getInterviewRecords: (userId) => callOrMock(
    () => fetch(`${API_BASE}/stats/interviews?userId=${userId}`).then(r => r.json()),
    async () => { await mockDelay(400); return []; }
  ),

  getPendingUsers: () => callOrMock(
    () => fetch(`${API_BASE}/stats/pending-users`).then(r => r.json()),
    async () => { await mockDelay(400); return []; }
  ),

  verifyUser: (id, status) => callOrMock(
    () => fetch(`${API_BASE}/stats/verify/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(r => r.json()),
    async () => { await mockDelay(300); return { id, verification_status: status }; }
  ),

  // ── AI Chat ─────────────────────────────────────────────────

  chatInterview: (messages, role = 'coach') => callOrMock(
    () => fetch(`${API_BASE}/chat/interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, role }),
    }).then(r => r.json()),
    async () => { await mockDelay(800); return { reply: "That's a great point! Can you elaborate on the technical implementation?" }; }
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
};

export const SOCKET_URL = API_BASE;
