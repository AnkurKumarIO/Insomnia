import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './index.css';
import AlumNexLogo from './AlumNexLogo';
import { AuthContext, AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import StudentRegistration from './pages/StudentRegistration';
import StudentLogin from './pages/StudentLogin';
import UnifiedLogin from './pages/UnifiedLogin';
import ProfileSetup from './pages/ProfileSetup';
import TNPLogin from './pages/TNPLogin';
import AlumniLogin from './pages/AlumniLogin';
import AlumniRegistration from './pages/AlumniRegistration';
import Dashboard from './pages/Dashboard';
import AlumniDashboard from './pages/AlumniDashboard';
import TNPDashboard from './pages/TNPDashboard';
import InterviewRoom from './pages/InterviewRoom';
import GoogleMeetInterviewRoom from './GoogleMeetInterviewRoom';
import ResumeAnalyzer from './pages/ResumeAnalyzer';

function DashboardRouter() {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ALUMNI') return <AlumniDashboard />;
  if (user.role === 'TNP')    return <TNPDashboard />;
  return <Dashboard />;
}

function LandingGuard() {
  const { user } = useContext(AuthContext);
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function PublicNavbar() {
  const { user } = useContext(AuthContext);
  const isInterview = window.location.pathname.startsWith('/interview');
  if (user || isInterview) return null;
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <AlumNexLogo size={28} />
        <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff' }}>Alum<span style={{ color: '#60a5fa' }}>NEX</span></span>
      </Link>
      <div className="navbar-links">
        <Link to="/login">Sign In</Link>
        <Link to="/student/register" className="nav-cta">Register</Link>
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
          <Route path="/"                      element={<LandingGuard />} />
          <Route path="/login"                 element={<UnifiedLogin />} />
          <Route path="/student/register"      element={<StudentRegistration />} />
          <Route path="/student/login"         element={<StudentLogin />} />
          <Route path="/profile-setup"         element={<ProfileSetup />} />
          <Route path="/alumni/login"          element={<AlumniLogin />} />
          <Route path="/alumni/register"       element={<AlumniRegistration />} />
          <Route path="/tnp/login"             element={<TNPLogin />} />
          <Route path="/dashboard"             element={<DashboardRouter />} />
          <Route path="/interview/:roomId"     element={<InterviewRoom />} />
          <Route path="/meet-interview/:roomId" element={<GoogleMeetInterviewRoom />} />
          <Route path="/resume-analyzer"       element={<ResumeAnalyzer />} />
          <Route path="*"                      element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
