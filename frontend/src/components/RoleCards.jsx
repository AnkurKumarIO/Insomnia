import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const CARDS = [
  {
    icon: 'rocket_launch',
    iconColor: '#c3c0ff',
    bgIcon: 'school',
    title: 'I am a Student',
    desc: 'Accelerate your career with AI-matched mentors, personalized internship insights, and real-world alumni journeys.',
    checks: ['AI Mentor Matching', 'Resume Intelligence'],
    btnLabel: 'CREATE STUDENT ACCOUNT',
    btnTo: '/student/register',
    glowColor: '99, 179, 237',
  },
  {
    icon: 'volunteer_activism',
    iconColor: '#c3c0ff',
    bgIcon: 'psychology',
    title: 'I am an Alumnus',
    desc: 'Re-engage with your alma mater, mentor the next generation, and tap into an exclusive high-tier professional network.',
    checks: ['Giving & Mentorship', 'Executive Network'],
    btnLabel: 'CREATE ALUMNI ACCOUNT',
    btnTo: '/alumni/register',
    glowColor: '99, 179, 237',
  },
  {
    icon: 'admin_panel_settings',
    iconColor: '#4edea3',
    bgIcon: 'query_stats',
    title: 'I am a TNP Coordinator',
    desc: 'Streamline campus placements with predictive analytics, alumni verified referrals, and automated outreach.',
    checks: ['Placement Intelligence', 'Verified Referrals'],
    btnLabel: 'LAUNCH DASHBOARD',
    btnTo: '/login',
    glowColor: '99, 179, 237',
  },
];

function TiltCard({ card, onEnter, onLeave }) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -12, y: dx * 12 });
  };

  const handleMouseEnter = () => { setHovered(true); onEnter(); };
  const handleMouseLeave = () => { setTilt({ x: 0, y: 0 }); setHovered(false); onLeave(); };

  const { glowColor, iconColor } = card;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        flex: '1 1 280px',
        maxWidth: 360,
        background: 'rgba(23,31,51,0.5)',
        backdropFilter: 'blur(20px)',
        borderRadius: 14,
        padding: '2rem',
        border: hovered
          ? `1px solid rgba(${glowColor}, 0.5)`
          : '1px solid rgba(70,69,85,0.15)',
        boxShadow: hovered
          ? `0 0 0 1px rgba(${glowColor},0.1), 0 8px 32px rgba(${glowColor},0.2), 0 0 60px rgba(${glowColor},0.1), 0 20px 40px rgba(0,0,0,0.3)`
          : '0 20px 40px rgba(0,0,0,0.3)',
        transform: hovered
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.05)`
          : 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: hovered
          ? 'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.08s linear'
          : 'box-shadow 0.5s ease, border-color 0.5s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1)',
        position: 'relative',
        overflow: 'hidden',
        willChange: 'transform',
        cursor: 'default',
      }}
    >
      {/* Subtle bg icon */}
      <div style={{ position: 'absolute', top: 0, right: 0, padding: '1.5rem', opacity: 0.1 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '5rem', color: '#fff' }}>{card.bgIcon}</span>
      </div>

      {/* Icon box — original style, glow added on hover */}
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
        background: `${iconColor}18`,
        border: `1px solid ${iconColor}30`,
        boxShadow: hovered ? `0 0 18px rgba(${glowColor},0.4)` : 'none',
        transition: 'box-shadow 0.35s ease',
      }}>
        <span className="material-symbols-outlined" style={{ color: iconColor, fontSize: 22 }}>{card.icon}</span>
      </div>

      {/* Title — original color always */}
      <h3 style={{
        fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em',
        color: '#dae2fd', marginBottom: '1rem',
      }}>
        {card.title}
      </h3>

      {/* Description */}
      <p style={{ fontSize: '0.875rem', color: '#c7c4d8', lineHeight: 1.7, marginBottom: '2rem' }}>
        {card.desc}
      </p>

      {/* Checklist */}
      <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {card.checks.map(item => (
          <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: '#c7c4d8' }}>
            <span className="material-symbols-outlined" style={{ color: '#4edea3', fontSize: 16 }}>check_circle</span>
            {item}
          </li>
        ))}
      </ul>

      {/* CTA Button — original style, glow added on hover */}
      <Link
        to={card.btnTo}
        style={{
          display: 'block', width: '100%', padding: '1rem',
          borderRadius: 12, textAlign: 'center', textDecoration: 'none',
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', boxSizing: 'border-box',
          background: hovered ? `rgba(${glowColor}, 0.15)` : '#131b2e',
          border: hovered ? `1px solid rgba(${glowColor}, 0.5)` : '1px solid rgba(70,69,85,0.3)',
          color: hovered ? `rgb(${glowColor})` : '#dae2fd',
          boxShadow: hovered ? `0 0 20px rgba(${glowColor},0.25)` : 'none',
          transition: 'all 0.35s ease',
        }}
      >
        {card.btnLabel}
      </Link>
    </div>
  );
}

export default function RoleCards() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <section style={{ background: '#0b1326', padding: '7rem 2rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 900, letterSpacing: '-0.04em',
            lineHeight: 1.1, color: '#dae2fd', marginBottom: '1.25rem',
          }}>
            Between Campus and{' '}
            <span style={{
              background: 'linear-gradient(135deg, #4edea3, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 18px rgba(78,222,163,0.4))',
            }}>
              Career
            </span>
          </h2>
          <p style={{ fontSize: '1rem', color: '#c7c4d8', lineHeight: 1.7, maxWidth: 580, margin: '0 auto', opacity: 0.85 }}>
            AlumNex connects students, alumni, and administrators through AI-powered career pathways, mock interviews, and mentorship.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', width: '100%' }}>
          {CARDS.map((card, i) => (
            <TiltCard
              key={i}
              card={card}
              onEnter={() => setHoveredIdx(i)}
              onLeave={() => setHoveredIdx(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
