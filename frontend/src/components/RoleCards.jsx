import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const CARDS = [
  {
    icon: 'rocket_launch',
    bgIcon: 'school',
    title: 'I am a Student',
    desc: 'Accelerate your career with AI-matched mentors, personalized internship insights, and real-world alumni journeys.',
    checks: ['AI Mentor Matching', 'Resume Intelligence'],
    btnLabel: 'CREATE STUDENT ACCOUNT',
    btnTo: '/auth/student/register',
    glowColor: '99, 179, 237',   // blue
  },
  {
    icon: 'volunteer_activism',
    bgIcon: 'psychology',
    title: 'I am an Alumnus',
    desc: 'Re-engage with your alma mater, mentor the next generation, and tap into an exclusive high-tier professional network.',
    checks: ['Giving & Mentorship', 'Executive Network'],
    btnLabel: 'CREATE ALUMNI ACCOUNT',
    btnTo: '/auth/alumni/register',
    glowColor: '99, 179, 237',
  },
  {
    icon: 'admin_panel_settings',
    bgIcon: 'query_stats',
    title: 'I am a TNP Coordinator',
    desc: 'Streamline campus placements with predictive analytics, alumni verified referrals, and automated outreach.',
    checks: ['Placement Intelligence', 'Verified Referrals'],
    btnLabel: 'LAUNCH DASHBOARD',
    btnTo: '/login',
    glowColor: '99, 179, 237',
  },
];

function TiltCard({ card, isHovered, onEnter, onLeave }) {
  const ref = useRef(null);
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

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    onLeave();
  };

  const { glowColor } = card;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={onEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        flex: '1 1 280px',
        maxWidth: 360,
        background: '#111827',
        borderRadius: 20,
        padding: '2rem',
        border: isHovered
          ? `1px solid rgba(${glowColor}, 0.5)`
          : '1px solid rgba(70,69,85,0.18)',
        boxShadow: isHovered
          ? `0 0 0 1px rgba(${glowColor},0.15), 0 8px 32px rgba(${glowColor},0.18), 0 0 60px rgba(${glowColor},0.12)`
          : '0 4px 24px rgba(0,0,0,0.4)',
        transform: isHovered
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.05)`
          : 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)',
        transition: isHovered
          ? 'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.08s linear'
          : 'box-shadow 0.5s ease, border-color 0.5s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        opacity: isHovered === false ? 0.45 : 1,
        willChange: 'transform',
      }}
    >
      {/* Subtle bg icon */}
      <span
        className="material-symbols-outlined"
        style={{
          position: 'absolute', top: 12, right: 16,
          fontSize: '5rem', opacity: 0.05, color: '#fff',
          pointerEvents: 'none', userSelect: 'none',
        }}
      >
        {card.bgIcon}
      </span>

      {/* Icon box */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
        background: isHovered
          ? `rgba(${glowColor}, 0.2)`
          : 'rgba(255,255,255,0.04)',
        border: isHovered
          ? `1px solid rgba(${glowColor}, 0.4)`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isHovered ? `0 0 18px rgba(${glowColor},0.35)` : 'none',
        transition: 'all 0.35s ease',
      }}>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 26,
            color: isHovered ? `rgb(${glowColor})` : '#4a5568',
            transition: 'color 0.35s ease',
          }}
        >
          {card.icon}
        </span>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em',
        color: isHovered ? '#f0f4ff' : '#4a5568',
        marginBottom: '0.75rem',
        transition: 'color 0.35s ease',
      }}>
        {card.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '0.85rem', lineHeight: 1.7,
        color: isHovered ? '#94a3b8' : '#2d3748',
        marginBottom: '1.5rem',
        transition: 'color 0.35s ease',
      }}>
        {card.desc}
      </p>

      {/* Checklist */}
      <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {card.checks.map(item => (
          <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem',
            color: isHovered ? '#94a3b8' : '#2d3748',
            transition: 'color 0.35s ease',
          }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 16,
                color: isHovered ? `rgb(${glowColor})` : '#2d3748',
                transition: 'color 0.35s ease',
              }}
            >
              check_circle
            </span>
            {item}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Link
        to={card.btnTo}
        style={{
          display: 'block', width: '100%', padding: '0.875rem',
          borderRadius: 12, textAlign: 'center', textDecoration: 'none',
          fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em',
          boxSizing: 'border-box',
          background: isHovered
            ? `linear-gradient(135deg, rgba(${glowColor},0.25), rgba(${glowColor},0.12))`
            : 'rgba(255,255,255,0.03)',
          border: isHovered
            ? `1px solid rgba(${glowColor},0.5)`
            : '1px solid rgba(255,255,255,0.06)',
          color: isHovered ? `rgb(${glowColor})` : '#2d3748',
          boxShadow: isHovered ? `0 0 20px rgba(${glowColor},0.2)` : 'none',
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
    <section style={{
      background: '#0b1326',
      padding: '7rem 2rem',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 900, letterSpacing: '-0.04em',
            lineHeight: 1.1, color: '#e2e8f0',
            marginBottom: '1.25rem',
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
          <p style={{
            fontSize: '1rem', color: '#4a5568',
            lineHeight: 1.7, maxWidth: 580, margin: '0 auto',
          }}>
            AlumNex connects students, alumni, and administrators through AI-powered career pathways, mock interviews, and mentorship.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'flex', flexWrap: 'wrap',
          gap: '1.5rem', justifyContent: 'center',
        }}>
          {CARDS.map((card, i) => (
            <TiltCard
              key={i}
              card={card}
              isHovered={hoveredIdx === null ? null : hoveredIdx === i}
              onEnter={() => setHoveredIdx(i)}
              onLeave={() => setHoveredIdx(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
