const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Router for API
const apiRouter = express.Router();
apiRouter.use('/auth',          require('./routes/auth'));
apiRouter.use('/ai',            require('./routes/aiRoutes'));
apiRouter.use('/requests',      require('./routes/requests'));
apiRouter.use('/notifications', require('./routes/notifications'));
apiRouter.use('/users',         require('./routes/users'));
apiRouter.use('/alumni',        require('./routes/alumni'));
apiRouter.use('/register',      require('./routes/register'));
apiRouter.use('/stats',         require('./routes/stats'));
apiRouter.use('/chat',          require('./routes/chat'));

app.use('/api', apiRouter);

// HTTP Server + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

require('./socket/interviewRoom')(io);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AlumniConnect Backend is running' });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'AlumniConnect AI API',
    version: '2.0.0',
    database: 'Supabase (PostgreSQL)',
    endpoints: {
      health:              'GET  /health',
      studentVerify:       'POST /auth/student/verify',
      tnpLogin:            'POST /auth/tnp/login',
      alumniLogin:         'POST /auth/alumni/login',
      resumeAnalyze:       'POST /ai/resume-analyze',
      interviewAnalytics:  'POST /ai/interview-analytics',
      getRequests:         'GET  /requests?alumniId=&studentId=',
      createRequest:       'POST /requests',
      updateRequest:       'PATCH /requests/:id',
      getNotifications:    'GET  /notifications?userId=',
      markNotifsRead:      'PATCH /notifications/read',
    },
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 AlumniConnect Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready on ws://localhost:${PORT}/interview`);
  console.log(`🗄️  Database: Supabase (PostgreSQL)\n`);
});
