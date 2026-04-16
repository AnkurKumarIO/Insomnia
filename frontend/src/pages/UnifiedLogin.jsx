import React, { useState, useContext } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AlumNexLogo from "../AlumNexLogo";
import { supabase } from "../lib/supabaseClient";

const CREDENTIAL_STORE = [
  { username: "admin",           password: "tnp_secure_123", role: "TNP",     name: "TNP Coordinator",  department: "Administration",         id: "tnp-admin" },
  { username: "alice.johnson42", password: "Xk7mP2qR9n",    role: "STUDENT", name: "Alice Johnson",    department: "Computer Science",       id: "stu-alice-johnson" },
  { username: "bob.smith18",     password: "Ry4nQ8wL3v",    role: "STUDENT", name: "Bob Smith",        department: "Electrical Engineering", id: "stu-bob-smith" },
  { username: "priya.sharma",    password: "Alumni@2026",    role: "ALUMNI",  name: "Priya Sharma",     department: "Computer Science",       id: "alm-priya-sharma" },
  { username: "rahul.verma",     password: "Alumni@2026",    role: "ALUMNI",  name: "Rahul Verma",      department: "Electrical Engineering", id: "alm-rahul-verma" },
  { username: "sarah.chen",      password: "Alumni@2026",    role: "ALUMNI",  name: "Sarah Chen",       department: "Computer Science",       id: "alm-sarah-chen" },
  { username: "jasmine.patel",   password: "Alumni@2026",    role: "ALUMNI",  name: "Jasmine Patel",    department: "Computer Science",       id: "alm-jasmine-patel" },
  { username: "aisha.okonkwo",   password: "Alumni@2026",    role: "ALUMNI",  name: "Aisha Okonkwo",    department: "Computer Science",       id: "alm-aisha-okonkwo" },
];

function findLocalCredential(username, password) {
  const found = CREDENTIAL_STORE.find(c => c.username === username.trim() && c.password === password.trim());
  if (found) return found;
  try {
    const pending = JSON.parse(localStorage.getItem("alumniconnect_pending_profile") || "{}");
    if (pending.username === username.trim() && pending.password === password.trim()) return { ...pending, role: pending.role || "STUDENT" };
    const approved = JSON.parse(localStorage.getItem("alumniconnect_approved_accounts") || "[]");
    return approved.find(c => c.username === username.trim() && c.password === password.trim()) || null;
  } catch { return null; }
}

export default function UnifiedLogin() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [role, setRole] = useState("STUDENT");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) { setError("Please enter both username and password."); return; }
    setLoading(true);

    // 1. Try local credential store
    const localCred = findLocalCredential(username, password);
    if (localCred) {
      if (localCred.role !== role) { setError(`These credentials belong to a ${localCred.role.toLowerCase()} account.`); setLoading(false); return; }
      const userData = { id: localCred.id || `${localCred.role.toLowerCase()}-${Date.now()}`, name: localCred.name, role: localCred.role, department: localCred.department };
      login(userData, `token-${Date.now()}`);
      if (localCred.role === "STUDENT" && !localStorage.getItem("alumniconnect_profile")) { navigate("/profile-setup"); } else { navigate("/dashboard"); }
      setLoading(false);
      return;
    }

    // 2. Try Supabase auth (for users who registered with own password)
    try {
      const { data: userRows } = await supabase.from("users").select("id, name, email, role, department, profile_data").eq("profile_data->>username", username.trim()).maybeSingle();
      if (!userRows) { setError("Invalid username or password."); setLoading(false); return; }
      if (userRows.role !== role) { setError(`This account is registered as ${userRows.role}. Select the correct tab.`); setLoading(false); return; }
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email: userRows.email, password: password.trim() });
      if (authErr) { setError("Invalid username or password."); setLoading(false); return; }
      const userData = { id: userRows.id, name: userRows.name, role: userRows.role, department: userRows.department, email: userRows.email };
      login(userData, authData.session?.access_token || `token-${Date.now()}`);
      if (userRows.role === "STUDENT" && !localStorage.getItem("alumniconnect_profile")) { navigate("/profile-setup"); } else { navigate("/dashboard"); }
    } catch (err) { setError("Login failed. Please try again."); }
    setLoading(false);
  };

  const ROLE_TABS = [
    { id: "STUDENT", label: "Student",   icon: "school" },
    { id: "ALUMNI",  label: "Alumni",    icon: "psychology" },
    { id: "TNP",     label: "TNP Admin", icon: "admin_panel_settings" },
  ];
  const DEMO_HINTS = {
    STUDENT: "Demo: alice.johnson42 / Xk7mP2qR9n",
    ALUMNI:  "Demo: priya.sharma / Alumni@2026",
    TNP:     "Demo: admin / tnp_secure_123",
  };
  const inp = { width: "100%", background: "#222a3d", border: "1px solid rgba(70,69,85,0.4)", borderRadius: 10, padding: "0.75rem 0.875rem", color: "#dae2fd", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", fontFamily: "Inter, sans-serif" };

  return (
    <div style={{ minHeight: "100vh", background: "#0b1326", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "Inter, sans-serif", color: "#dae2fd" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: "0.75rem" }}>
            <AlumNexLogo size={40} showText textSize="1.75rem" />
          </div>
          <p style={{ fontSize: "0.875rem", color: "#c7c4d8" }}>Sign in with your credentials</p>
        </div>
        <div style={{ background: "#171f33", borderRadius: 20, border: "1px solid rgba(70,69,85,0.15)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)", overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid rgba(70,69,85,0.2)" }}>
            {ROLE_TABS.map(tab => (
              <button key={tab.id} onClick={() => { setRole(tab.id); setError(""); }}
                style={{ flex: 1, padding: "0.875rem 0.5rem", background: "none", border: "none", borderBottom: role === tab.id ? "2px solid #c3c0ff" : "2px solid transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: role === tab.id ? "#c3c0ff" : "#c7c4d8" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{tab.icon}</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{tab.label}</span>
              </button>
            ))}
          </div>
          <div style={{ padding: "2rem" }}>
            {error && <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#ffb4ab" }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#c7c4d8", display: "block", marginBottom: 6 }}>Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" autoComplete="username" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#c7c4d8", display: "block", marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" style={{ ...inp, paddingRight: "2.5rem" }} />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#c7c4d8" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ width: "100%", padding: "0.875rem", background: loading ? "#2d3449" : "linear-gradient(135deg,#4f46e5,#c3c0ff)", color: loading ? "#c7c4d8" : "#1d00a5", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.875rem", cursor: loading ? "not-allowed" : "pointer", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(199,196,216,0.3)", borderTop: "2px solid #c7c4d8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Signing in...</> : "Sign In"}
              </button>
            </form>
            <div style={{ marginTop: "1.25rem", padding: "0.75rem 1rem", background: "#131b2e", borderRadius: 10, border: "1px solid rgba(70,69,85,0.2)" }}>
              <p style={{ fontSize: "0.72rem", color: "#c7c4d8", lineHeight: 1.6, margin: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#ffb95f", verticalAlign: "middle", marginRight: 4 }}>info</span>
                {DEMO_HINTS[role]}
              </p>
            </div>
            {role === "STUDENT" && <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#c7c4d8", marginTop: "1.25rem" }}>Don&apos;t have an account?{" "}<a href="/auth/student/register" style={{ color: "#c3c0ff", textDecoration: "none", fontWeight: 600 }}>Register here</a></p>}
            {role === "ALUMNI" && <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#c7c4d8", marginTop: "1.25rem" }}>New alumni mentor?{" "}<a href="/auth/alumni/register" style={{ color: "#4edea3", textDecoration: "none", fontWeight: 600 }}>Create account</a></p>}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
