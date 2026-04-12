const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const dotenv  = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Routes (mounted at root, no /api prefix) ──────────────────────────────────
app.use('/auth',          require('./routes/auth'));
app.use('/ai',            require('./routes/aiRoutes'));
app.use('/requests',      require('./routes/requests'));
app.use('/notifications', require('./routes/notifications'));
app.use('/users',         require('./routes/users'));
app.use('/alumni',        require('./routes/alumni'));
app.use('/register',      require('./routes/register'));
app.use('/stats',         require('./routes/stats'));
app.use('/chat',          require('./routes/chat'));

// ── Socket.io ─────────────────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
require('./socket/interviewRoom')(io);

// ── Health & info ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AlumNEX Backend is running' });
});

app.get('/', (req, res) => {
  res.json({
    name: 'AlumNEX AI API',
    version: '2.0.0',
    database: 'Supabase (PostgreSQL)',
    routes: [
      'GET  /health',
      'GET  /alumni',
      'POST /auth/student/verify',
      'POST /auth/tnp/login',
      'POST /auth/alumni/login',
      'POST /ai/resume-analyze',
      'POST /ai/interview-analytics',
      'POST /ai/profile-strength',
      'GET  /requests?alumniId=&studentId=',
      'POST /requests',
      'PATCH /requests/:id',
      'GET  /notifications?userId=',
      'PATCH /notifications/read',
      'GET  /users/:id',
      'GET  /users/by-email/:email',
      'PATCH /users/:id/profile',
      'GET  /stats/platform',
      'GET  /stats/interviews?userId=',
      'GET  /stats/pending-users',
      'PATCH /stats/verify/:id',
      'POST /chat/interview',
      'POST /chat/questions',
    ],
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`\n🚀 AlumNEX Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready on ws://localhost:${PORT}/interview`);
  console.log(`🗄️  Database: Supabase (PostgreSQL)`);
  console.log(`🤖 Groq AI: ${process.env.GROQ_API_KEY ? '✅ connected' : '❌ missing key'}\n`);
});
