const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Mock data (used when backend is unreachable) ───────────────────────────

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

const MOCK_TOKEN = 'mock-jwt-token-for-local-dev';

const mockDelay = (ms = 600) => new Promise(r => setTimeout(r, ms));

const MOCK_API = {
  health: async () => ({ status: 'ok (mock)', message: 'Running in offline/mock mode' }),

  studentVerify: async (_file) => {
    await mockDelay();
    const user = MOCK_USERS.students[0]; // Always verifies as Alice Johnson
    return { token: MOCK_TOKEN, user };
  },

  tnpLogin: async (username, password) => {
    await mockDelay();
    if (username === 'admin' && password === 'tnp_secure_123') {
      return { token: MOCK_TOKEN, user: MOCK_USERS.tnp };
    }
    return { error: 'Invalid credentials. Use admin / tnp_secure_123' };
  },

  alumniLogin: async (name, email, _department) => {
    await mockDelay();
    if (!name || !email) return { error: 'Name and email are required.' };
    const user = { id: 'alm-' + Date.now(), name, role: 'ALUMNI', department: _department || 'General' };
    return { token: MOCK_TOKEN, user };
  },

  resumeAnalyze: async (_file) => {
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

  interviewAnalytics: async (_data) => {
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
};

// ─── Try real backend, fall back to mock ────────────────────────────────────

let _backendAvailable = null; // null = unknown, true/false after first check

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
    try {
      return await realFn();
    } catch {
      return await mockFn();
    }
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

  resumeAnalyze: (file) => callOrMock(
    () => {
      const fd = new FormData();
      fd.append('resume', file);
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
};

export const SOCKET_URL = API_BASE;
