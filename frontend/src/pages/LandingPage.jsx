import React from 'react';
import { Link } from 'react-router-dom';

import AlumNexLogo from '../AlumNexLogo';
import RoleCards from '../components/RoleCards';

export default function LandingPage() {
  return (
    <div style={{ background: '#0b1326', color: '#dae2fd', fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}>
      {/* Hero */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '8rem 2rem 6rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <section style={{ textAlign: 'center', marginBottom: '5rem', maxWidth: 900 }}>
          {/* Logo + Name */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: '2rem' }}>
            <AlumNexLogo size={52} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: '#fff' }}>
                Alum<span style={{ color: '#a855f7' }}>NEX</span>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#c7c4d8', marginTop: 2 }}>Intelligence Platform</div>
            </div>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: '2rem', textShadow: '0 0 20px rgba(195,192,255,0.3)' }}>
            The Intelligence Bridge Between{' '}
            <span style={{ color: '#c3c0ff' }}>Campus</span> and{' '}
            <span style={{ color: '#4edea3' }}>Career</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#c7c4d8', lineHeight: 1.7, maxWidth: 640, margin: '0 auto', opacity: 0.85 }}>
            AlumNex connects students, alumni, and administrators through AI-powered career pathways, mock interviews, and mentorship.
          </p>
        </section>

        {/* Portal Cards */}
        <RoleCards />

        {/* Network Intelligence */}
        <section style={{ marginTop: '8rem', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', textShadow: '0 0 20px rgba(195,192,255,0.3)' }}>Network Intelligence</h2>
            <p style={{ fontSize: '0.65rem', color: '#c7c4d8', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 700, marginTop: 8 }}>Data-Driven Connections</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', height: 400 }}>
            <div style={{ background: '#171f33', borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0b1326 0%, rgba(11,19,38,0.4) 40%, transparent 100%)', zIndex: 1 }} />
              <div style={{ position: 'absolute', bottom: 40, left: 40, zIndex: 2 }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#c3c0ff', marginBottom: 8 }}>Predictive Pathways</h4>
                <p style={{ fontSize: '0.875rem', color: '#c7c4d8', maxWidth: 480, lineHeight: 1.6 }}>Our AI analyzes thousands of career trajectories to recommend the most efficient path for students based on their specific skill sets.</p>
              </div>
              {/* Decorative grid */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(195,192,255,0.08) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ flex: 1, background: '#222a3d', borderRadius: 14, padding: '2rem', borderLeft: '2px solid rgba(195,192,255,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 28, marginBottom: 12 }}>auto_awesome</span>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>94%</div>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c7c4d8', fontWeight: 700, marginTop: 4 }}>Match Accuracy</div>
              </div>
              <div style={{ flex: 1, background: '#131b2e', borderRadius: 14, padding: '2rem', border: '1px solid rgba(70,69,85,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 28, marginBottom: 12 }}>groups</span>
                <div style={{ fontSize: '2rem', fontWeight: 900 }}>12k+</div>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c7c4d8', fontWeight: 700, marginTop: 4 }}>Active Mentors</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: '3rem 2rem', borderTop: '1px solid rgba(70,69,85,0.2)', background: '#0b1326', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlumNexLogo size={22} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f5e9ff' }}>Alum<span style={{ color: '#a855f7' }}>NEX</span></span>
          </div>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7c4d8', opacity: 0.8 }}>© 2026 AlumNex. The Intelligence Platform.</p>
          <p style={{ fontSize: '0.65rem', color: '#c7c4d8', opacity: 0.6 }}>Developed by <strong style={{ color: '#c3c0ff', opacity: 1 }}>The Tesseract</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {['Privacy','Terms','API','Contact'].map(l => (
            <a key={l} href="#" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#c7c4d8', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}

const card = {
  background: 'rgba(23,31,51,0.5)',
  backdropFilter: 'blur(20px)',
  padding: '2rem',
  borderRadius: 14,
  border: '1px solid rgba(70,69,85,0.15)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
  position: 'relative',
  overflow: 'hidden',
};
const iconBox = (color) => ({
  width: 48, height: 48, background: `${color}18`, borderRadius: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: '1.5rem', border: `1px solid ${color}30`,
});
const cardTitle = { fontSize: '1.5rem', fontWeight: 700, color: '#dae2fd', marginBottom: '1rem', letterSpacing: '-0.02em' };
const cardDesc = { fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.7, marginBottom: '2rem' };
const btnCard = {
  display: 'block', width: '100%', padding: '1rem', borderRadius: 12,
  border: '1px solid rgba(70,69,85,0.3)', background: '#131b2e',
  color: '#dae2fd', fontSize: '0.7rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.1em',
  textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box',
};
