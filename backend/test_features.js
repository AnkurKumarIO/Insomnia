/**
 * AlumNex Feature Test Suite
 * Tests all major features against the live backend (http://localhost:5000)
 * and directly against Supabase using the anon key.
 *
 * Run: node test_features.js
 * Requires: backend running on port 5000 (npm run dev in /backend)
 */

const http = require('http');
const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────────
const API = 'http://localhost:5000';
const SUPABASE_URL = 'https://hfngnstxfitukofbkapy.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhmbmduc3R4Zml0dWtvZmJrYXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjAxMTYsImV4cCI6MjA5MTQ5NjExNn0.QTJ8P_EbMgUSM3RN0ZRSJdn0lThJRAOVtSGnsIXf4PI';

// Random test data
const TS = Date.now();
const TEST_STUDENT = {
  name: `Test Student ${TS}`,
  email: `teststudent_${TS}@alumniconnect.edu`,
  department: 'Computer Science',
  college: 'Test College',
  year: '3rd Year',
  username: `stu_${TS}`,
  password: `Pass_${TS}!`,
};
const TEST_ALUMNI = {
  name: `Test Alumni ${TS}`,
  email: `testalumni_${TS}@alumniconnect.edu`,
  department: 'Computer Science',
  company: 'Google',
  batch_year: 2018,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function log(label, ok, detail = '') {
  const icon = ok ? '✅' : '❌';
  const msg = `${icon} ${label}${detail ? ' — ' + detail : ''}`;
  console.log(msg);
  results.push({ label, ok, detail });
  if (ok) passed++; else failed++;
}

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + path);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const bodyStr = body ? JSON.stringify(body) : null;

    const opts = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...headers,
      },
    };

    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function supabaseRequest(method, table, body, params = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}${params}`);
    const bodyStr = body ? JSON.stringify(body) : null;

    const opts = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Test Sections ─────────────────────────────────────────────────────────────

async function testHealth() {
  console.log('\n━━━ 1. HEALTH CHECK ━━━');
  try {
    const r = await request('GET', '/health');
    log('Backend health check', r.status === 200, r.body?.status);
  } catch (e) {
    log('Backend health check', false, 'Backend not running — start with: npm run dev');
    console.error('   ⚠️  Cannot continue without backend. Start it first.\n');
    process.exit(1);
  }
}

async function testSupabaseConnection() {
  console.log('\n━━━ 2. SUPABASE CONNECTION ━━━');
  try {
    const r = await supabaseRequest('GET', 'users', null, '?select=id&limit=1');
    log('Supabase anon read (users table)', r.status === 200 || r.status === 206,
      r.status === 200 ? `${Array.isArray(r.body) ? r.body.length : 0} row(s)` : JSON.stringify(r.body));
  } catch (e) {
    log('Supabase connection', false, e.message);
  }
}

async function testTNPLogin() {
  console.log('\n━━━ 3. TNP LOGIN ━━━');
  try {
    const r = await request('POST', '/auth/tnp/login', { username: 'admin', password: 'tnp_secure_123' });
    log('TNP login with correct credentials', r.status === 200 && r.body?.token, `role=${r.body?.user?.role}`);

    const r2 = await request('POST', '/auth/tnp/login', { username: 'admin', password: 'wrongpass' });
    log('TNP login with wrong password (should fail)', r2.status === 401, `status=${r2.status}`);
  } catch (e) {
    log('TNP login', false, e.message);
  }
}

let studentId = null;
let alumniId = null;

async function testStudentRegistration() {
  console.log('\n━━━ 4. STUDENT REGISTRATION ━━━');
  try {
    const r = await request('POST', '/register/student', TEST_STUDENT);
    const ok = r.status === 200 && (r.body?.user?.id || r.body?.message);
    log('Register new student', ok, r.body?.message || r.body?.error);
    if (r.body?.user?.id) studentId = r.body.user.id;

    // Duplicate registration
    const r2 = await request('POST', '/register/student', TEST_STUDENT);
    log('Duplicate student registration (should return existing)', r2.status === 200, r2.body?.message);
  } catch (e) {
    log('Student registration', false, e.message);
  }
}

async function testAlumniLogin() {
  console.log('\n━━━ 5. ALUMNI LOGIN / REGISTRATION ━━━');
  try {
    const r = await request('POST', '/auth/alumni/login', TEST_ALUMNI);
    const ok = r.status === 200 && r.body?.user;
    log('Alumni login/register', ok, r.body?.message || r.body?.error);
    if (r.body?.user?.id) alumniId = r.body.user.id;
  } catch (e) {
    log('Alumni login', false, e.message);
  }
}

async function testGetUsers() {
  console.log('\n━━━ 6. USER MANAGEMENT ━━━');
  try {
    if (studentId) {
      const r = await request('GET', `/users/${studentId}`);
      log('GET /users/:id (student)', r.status === 200 && r.body?.id, `name=${r.body?.name}`);
    } else {
      log('GET /users/:id (student)', false, 'No studentId from registration');
    }

    const email = encodeURIComponent(TEST_STUDENT.email);
    const r2 = await request('GET', `/users/by-email/${email}`);
    log('GET /users/by-email/:email', r2.status === 200 && r2.body?.email, `found=${r2.body?.name}`);

    if (studentId) {
      const r3 = await request('PATCH', `/users/${studentId}/profile`, {
        bio: 'Passionate CS student looking for mentorship',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        linkedin: 'https://linkedin.com/in/teststudent',
        github: 'https://github.com/teststudent',
        cgpa: '8.5',
        department: 'Computer Science',
        targetRoles: ['SWE', 'Full Stack Developer'],
      });
      log('PATCH /users/:id/profile', r3.status === 200, r3.body?.message || r3.body?.error);
    }
  } catch (e) {
    log('User management', false, e.message);
  }
}

async function testAlumniDiscovery() {
  console.log('\n━━━ 7. ALUMNI DISCOVERY ━━━');
  try {
    const r = await request('GET', '/alumni');
    const ok = r.status === 200 && Array.isArray(r.body);
    log('GET /alumni (verified alumni list)', ok, `count=${Array.isArray(r.body) ? r.body.length : 'N/A'}`);

    if (ok && r.body.length > 0) {
      const a = r.body[0];
      log('Alumni has required fields', !!(a.id && a.name && a.email), `name=${a.name}, company=${a.company}`);
    } else {
      log('Alumni list has entries', false, 'No verified alumni in DB yet');
    }
  } catch (e) {
    log('Alumni discovery', false, e.message);
  }
}

let requestId = null;

async function testInterviewRequests() {
  console.log('\n━━━ 8. INTERVIEW REQUESTS ━━━');
  try {
    if (!studentId || !alumniId) {
      log('Interview request creation', false, 'Need both studentId and alumniId');
      return;
    }

    // Create request
    const r = await request('POST', '/requests', {
      studentId,
      alumniId,
      topic: 'Mock Interview – General',
      message: 'Hi! I would love to practice for my upcoming Google interview.',
      studentProfileSnapshot: {
        name: TEST_STUDENT.name,
        department: TEST_STUDENT.department,
        skills: ['JavaScript', 'React'],
      },
    });
    const ok = r.status === 200 || r.status === 201;
    log('POST /requests (create interview request)', ok, r.body?.request_id || r.body?.error);
    if (r.body?.request_id) requestId = r.body.request_id;

    // Fetch by student
    const r2 = await request('GET', `/requests?studentId=${studentId}`);
    log('GET /requests?studentId=', r2.status === 200 && Array.isArray(r2.body),
      `count=${Array.isArray(r2.body) ? r2.body.length : 'N/A'}`);

    // Fetch by alumni
    const r3 = await request('GET', `/requests?alumniId=${alumniId}`);
    log('GET /requests?alumniId=', r3.status === 200 && Array.isArray(r3.body),
      `count=${Array.isArray(r3.body) ? r3.body.length : 'N/A'}`);

    // Accept request
    if (requestId) {
      const r4 = await request('PATCH', `/requests/${requestId}`, { status: 'ACCEPTED' });
      log('PATCH /requests/:id (ACCEPTED)', r4.status === 200, r4.body?.status || r4.body?.error);

      // Book slot
      const r5 = await request('PATCH', `/requests/${requestId}`, {
        status: 'SLOT_BOOKED',
        scheduledTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
        roomId: `room_${TS}`,
      });
      log('PATCH /requests/:id (SLOT_BOOKED)', r5.status === 200, r5.body?.status || r5.body?.error);
    }
  } catch (e) {
    log('Interview requests', false, e.message);
  }
}

async function testNotifications() {
  console.log('\n━━━ 9. NOTIFICATIONS ━━━');
  try {
    if (!studentId) {
      log('Notifications fetch', false, 'No studentId available');
      return;
    }

    const r = await request('GET', `/notifications?userId=${studentId}`);
    log('GET /notifications?userId=', r.status === 200 && Array.isArray(r.body),
      `count=${Array.isArray(r.body) ? r.body.length : 'N/A'}`);

    const r2 = await request('PATCH', '/notifications/read', { userId: studentId });
    log('PATCH /notifications/read', r2.status === 200, r2.body?.success ? 'marked read' : r2.body?.error);
  } catch (e) {
    log('Notifications', false, e.message);
  }
}

async function testPlatformStats() {
  console.log('\n━━━ 10. PLATFORM STATS (TNP) ━━━');
  try {
    const r = await request('GET', '/stats/platform');
    log('GET /stats/platform', r.status === 200 && r.body?.verified_students !== undefined,
      `students=${r.body?.verified_students}, mentors=${r.body?.active_mentors}, interviews=${r.body?.mock_interviews}`);

    const r2 = await request('GET', '/stats/pending-users');
    log('GET /stats/pending-users', r2.status === 200 && Array.isArray(r2.body),
      `pending=${Array.isArray(r2.body) ? r2.body.length : 'N/A'}`);

    if (studentId) {
      const r3 = await request('GET', `/stats/interviews?userId=${studentId}`);
      log('GET /stats/interviews?userId=', r3.status === 200 && Array.isArray(r3.body),
        `records=${Array.isArray(r3.body) ? r3.body.length : 'N/A'}`);
    }
  } catch (e) {
    log('Platform stats', false, e.message);
  }
}

async function testAIProfileStrength() {
  console.log('\n━━━ 11. AI — PROFILE STRENGTH ━━━');
  try {
    const r = await request('POST', '/ai/profile-strength', {
      profileData: {
        name: TEST_STUDENT.name,
        bio: 'Passionate CS student',
        skills: ['JavaScript', 'React', 'Node.js'],
        linkedin: 'https://linkedin.com/in/test',
        github: 'https://github.com/test',
        cgpa: '8.5',
        resumeName: 'resume.pdf',
        projects: [{ title: 'Portfolio', description: 'Personal website' }],
        targetRoles: ['SWE'],
      },
    });
    log('POST /ai/profile-strength', r.status === 200 && r.body?.score !== undefined,
      `score=${r.body?.score}, label=${r.body?.label}`);
  } catch (e) {
    log('AI profile strength', false, e.message);
  }
}

async function testAIInterviewAnalytics() {
  console.log('\n━━━ 12. AI — INTERVIEW ANALYTICS ━━━');
  try {
    const r = await request('POST', '/ai/interview-analytics', {
      metricsArray: [
        { timestamp: 1000, confidence: 75, clarity: 80, depth: 70 },
        { timestamp: 2000, confidence: 82, clarity: 85, depth: 75 },
        { timestamp: 3000, confidence: 88, clarity: 90, depth: 80 },
      ],
      fullTranscript:
        'Interviewer: Tell me about yourself.\nStudent: I am a final year CS student with experience in React and Node.js. I have built several full-stack projects and am passionate about system design.',
    });
    log('POST /ai/interview-analytics', r.status === 200 && r.body?.analytics,
      `score=${r.body?.analytics?.score}, confidence=${r.body?.analytics?.confidence}`);
  } catch (e) {
    log('AI interview analytics', false, e.message);
  }
}

async function testChatInterview() {
  console.log('\n━━━ 13. AI CHAT — INTERVIEW COACH ━━━');
  try {
    const r = await request('POST', '/chat/interview', {
      role: 'coach',
      messages: [{ role: 'user', content: 'Give me a system design question for a senior SWE role.' }],
    });
    const ok = r.status === 200 && r.body?.reply;
    log('POST /chat/interview (coach)', ok, ok ? r.body.reply.slice(0, 80) + '...' : r.body?.error);

    const r2 = await request('POST', '/chat/interview', {
      role: 'interviewer',
      messages: [{ role: 'user', content: 'Start the interview.' }],
    });
    const ok2 = r2.status === 200 && r2.body?.reply;
    log('POST /chat/interview (interviewer)', ok2, ok2 ? r2.body.reply.slice(0, 80) + '...' : r2.body?.error);
  } catch (e) {
    log('AI chat', false, e.message);
  }
}

async function testChatQuestions() {
  console.log('\n━━━ 14. AI CHAT — QUESTION GENERATION ━━━');
  try {
    const r = await request('POST', '/chat/questions', { topic: 'React and Frontend', count: 5 });
    const ok = r.status === 200 && Array.isArray(r.body?.questions);
    log('POST /chat/questions', ok,
      ok ? `${r.body.questions.length} questions, first: "${r.body.questions[0]?.q?.slice(0, 60)}..."` : r.body?.error);
  } catch (e) {
    log('Chat questions', false, e.message);
  }
}

async function testTNPVerification() {
  console.log('\n━━━ 15. TNP VERIFICATION WORKFLOW ━━━');
  try {
    // Create a pending alumni to verify
    const pendingAlumni = {
      name: `Pending Alumni ${TS}`,
      email: `pendingalumni_${TS}@test.com`,
      department: 'Electrical Engineering',
      company: 'Amazon',
      batch_year: 2020,
    };
    const r1 = await request('POST', '/auth/alumni/login', pendingAlumni);
    const pendingId = r1.body?.user?.id;
    log('Create pending alumni for verification', !!pendingId, `id=${pendingId}`);

    if (pendingId) {
      const r2 = await request('PATCH', `/stats/verify/${pendingId}`, { status: 'VERIFIED' });
      log('PATCH /stats/verify/:id (VERIFIED)', r2.status === 200 && r2.body?.verification_status === 'VERIFIED',
        `status=${r2.body?.verification_status}`);

      const r3 = await request('PATCH', `/stats/verify/${pendingId}`, { status: 'REJECTED' });
      log('PATCH /stats/verify/:id (REJECTED)', r3.status === 200 && r3.body?.verification_status === 'REJECTED',
        `status=${r3.body?.verification_status}`);
    }
  } catch (e) {
    log('TNP verification', false, e.message);
  }
}

async function testSupabaseDirectRead() {
  console.log('\n━━━ 16. SUPABASE DIRECT — TABLE READS ━━━');
  const tables = ['users', 'interview_requests', 'interview_records', 'notifications', 'college_registry'];
  for (const table of tables) {
    try {
      const r = await supabaseRequest('GET', table, null, '?select=*&limit=3');
      const ok = r.status === 200 && Array.isArray(r.body);
      log(`Supabase: read ${table}`, ok,
        ok ? `${r.body.length} row(s)` : `status=${r.status} ${JSON.stringify(r.body).slice(0, 80)}`);
    } catch (e) {
      log(`Supabase: read ${table}`, false, e.message);
    }
  }
}

async function testBulkRandomData() {
  console.log('\n━━━ 17. BULK RANDOM DATA — 3 STUDENTS + 3 ALUMNI ━━━');
  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Data Science'];
  const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Flipkart'];
  const names = ['Arjun Sharma', 'Priya Nair', 'Rohan Mehta', 'Sneha Iyer', 'Vikram Patel', 'Ananya Rao'];

  for (let i = 0; i < 3; i++) {
    const ts2 = Date.now() + i;
    const student = {
      name: `${names[i]} ${ts2}`,
      email: `bulk_stu_${ts2}@alumniconnect.edu`,
      department: departments[i % departments.length],
      college: 'National Institute of Technology',
      year: `${i + 2}nd Year`,
      username: `bulkstu${ts2}`,
      password: `BulkPass${ts2}!`,
    };
    try {
      const r = await request('POST', '/register/student', student);
      log(`Bulk student ${i + 1}: ${student.name.split(' ')[0]}`, r.status === 200,
        r.body?.message || r.body?.error);
    } catch (e) {
      log(`Bulk student ${i + 1}`, false, e.message);
    }
  }

  for (let i = 0; i < 3; i++) {
    const ts2 = Date.now() + i + 100;
    const alumni = {
      name: `${names[i + 3]} ${ts2}`,
      email: `bulk_alm_${ts2}@alumniconnect.edu`,
      department: departments[(i + 1) % departments.length],
      company: companies[i % companies.length],
      batch_year: 2015 + i,
    };
    try {
      const r = await request('POST', '/auth/alumni/login', alumni);
      log(`Bulk alumni ${i + 1}: ${alumni.name.split(' ')[0]}`, r.status === 200,
        r.body?.message || r.body?.error);
    } catch (e) {
      log(`Bulk alumni ${i + 1}`, false, e.message);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║       AlumNex Full Feature Test Suite                ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  API: ${API}`);
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  Timestamp: ${new Date().toISOString()}\n`);

  await testHealth();
  await testSupabaseConnection();
  await testTNPLogin();
  await testStudentRegistration();
  await testAlumniLogin();
  await testGetUsers();
  await testAlumniDiscovery();
  await testInterviewRequests();
  await testNotifications();
  await testPlatformStats();
  await testAIProfileStrength();
  await testAIInterviewAnalytics();
  await testChatInterview();
  await testChatQuestions();
  await testTNPVerification();
  await testSupabaseDirectRead();
  await testBulkRandomData();

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                      ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Total : ${passed + failed}`);
  console.log(`  ✅ Passed : ${passed}`);
  console.log(`  ❌ Failed : ${failed}`);

  if (failed > 0) {
    console.log('\n  Failed tests:');
    results.filter(r => !r.ok).forEach(r => console.log(`    ❌ ${r.label} — ${r.detail}`));
  }

  console.log('\n  Created test data:');
  console.log(`    Student email : ${TEST_STUDENT.email}`);
  console.log(`    Student ID    : ${studentId || 'not created'}`);
  console.log(`    Alumni email  : ${TEST_ALUMNI.email}`);
  console.log(`    Alumni ID     : ${alumniId || 'not created'}`);
  console.log(`    Request ID    : ${requestId || 'not created'}`);
  console.log('');
}

main().catch(console.error);
