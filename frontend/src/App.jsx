import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import './index.css';
import LandingPage from './pages/LandingPage';
import StudentAuth from './pages/StudentAuth';
import StudentRegistration from './pages/StudentRegistration';
import StudentLogin from './pages/StudentLogin';
import ProfileSetup from './pages/ProfileSetup';
import TNPLogin from './pages/TNPLogin';
import AlumniLogin from './pages/AlumniLogin';
import AlumniRegistration from './pages/AlumniRegistration';
import Dashboard from './pages/Dashboard';
import AlumniDashboard from './pages/AlumniDashboard';
import TNPDashboard from './pages/TNPDashboard';
import InterviewRoom from './pages/InterviewRoom';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Smart dashboard redirect based on role
function DashboardRouter() {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'ALUMNI') return <AlumniDashboard />;
  if (user.role === 'TNP') return <TNPDashboard />;
  return <Dashboard />;
}

// Landing page guard — redirect to dashboard if already logged in
function LandingGuard() {
  const { user } = useContext(AuthContext);
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function PublicNavbar() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isInterview = window.location.pathname.startsWith('/interview');

  if (user || isInterview) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🎓 <span>AlumniConnect</span> AI
      </Link>
      <div className="navbar-links">
        <Link to="/student/login">Student</Link>
        <Link to="/alumni/login">Alumni</Link>
        <Link to="/tnp/login" className="nav-cta">Admin Login</Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <PublicNavbar />
        <Routes>
          <Route path="/" element={<LandingGuard />} />
          <Route path="/student/register" element={<StudentRegistration />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/tnp/login" element={<TNPLogin />} />
          <Route path="/alumni/login" element={<AlumniLogin />} />
          <Route path="/alumni/register" element={<AlumniRegistration />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/interview/:roomId" element={<InterviewRoom />} />
          <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
