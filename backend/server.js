const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/aiRoutes');
app.use('/auth', authRoutes);
app.use('/ai', aiRoutes);

// HTTP Server + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Socket handlers
const socketInterviewRoom = require('./socket/interviewRoom');
socketInterviewRoom(io);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AlumniConnect Backend is running' });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'AlumniConnect AI API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      studentVerify: 'POST /auth/student/verify',
      tnpLogin: 'POST /auth/tnp/login',
      resumeAnalyze: 'POST /ai/resume-analyze',
      interviewAnalytics: 'POST /ai/interview-analytics'
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 AlumniConnect Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready on ws://localhost:${PORT}/interview`);
  console.log(`🔗 API docs at http://localhost:${PORT}/api\n`);
});
