import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import './index.css';
import LandingPage from './pages/LandingPage';
import StudentAuth from './pages/StudentAuth';
import StudentRegistration from './pages/StudentRegistration';
import StudentLogin from './pages/StudentLogin';
import UnifiedLogin from './pages/UnifiedLogin';
import ProfileSetup from './pages/ProfileSetup';
import TNPLogin from './pages/TNPLogin';
import AlumniLogin from './pages/AlumniLogin';
import Dashboard from './pages/Dashboard';
import AlumniDashboard from './pages/AlumniDashboard';
import TNPDashboard from './pages/TNPDashboard';
import InterviewRoom from './pages/InterviewRoom';
import ResumeAnalyzer from './pages/ResumeAnalyzer';

// Auth Context
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('alumniconnect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('alumniconnect_token'));

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('alumniconnect_user', JSON.stringify(userData));
    localStorage.setItem('alumniconnect_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('alumniconnect_user');
    localStorage.removeItem('alumniconnect_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Smart dashboard redirect based on role — requires login
function DashboardRouter() {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
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

// Minimal navbar only shown on public pages (not on full-screen interview room)
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
        <Link to="/login">Sign In</Link>
        <Link to="/auth/student/register" className="nav-cta">Register</Link>
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
          <Route path="/login" element={<UnifiedLogin />} />
          <Route path="/auth/student" element={<StudentAuth />} />
          <Route path="/auth/student/register" element={<StudentRegistration />} />
          <Route path="/auth/student/login" element={<StudentLogin />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/auth/tnp" element={<TNPLogin />} />
          <Route path="/auth/alumni" element={<AlumniLogin />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/interview/:roomId" element={<InterviewRoom />} />
          <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
