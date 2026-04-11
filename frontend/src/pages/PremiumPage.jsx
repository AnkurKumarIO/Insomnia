import React, { useState } from 'react';

const PLANS = [
  {
    name: 'Starter', price: 'Free', period: '', color: '#c7c4d8',
    features: ['5 mock interviews/month', 'Basic AI feedback', 'Alumni directory access', 'Resume analyzer (3/month)'],
    cta: 'Current Plan', disabled: true,
  },
  {
    name: 'Pro', price: '₹499', period: '/month', color: '#c3c0ff', highlight: true,
    features: ['Unlimited mock interviews', 'Advanced AI Whisperer', 'Priority alumni matching', 'Unlimited resume analysis', 'Post-interview analytics', 'Session recordings'],
    cta: 'Upgrade to Pro', disabled: false,
  },
  {
    name: 'Elite', price: '₹999', period: '/month', color: '#4edea3',
    features: ['Everything in Pro', '1-on-1 career coaching', 'Guaranteed placement support', 'Company-specific prep', 'LinkedIn profile review', 'Referral network access'],
    cta: 'Go Elite', disabled: false,
  },
];

const PERKS = [
  { icon: 'psychology', color: '#c3c0ff', title: 'AI Whisperer Unlimited', desc: 'Real-time coaching hints during every mock interview session, powered by advanced AI.' },
  { icon: 'analytics', color: '#4edea3', title: 'Deep Performance Analytics', desc: 'Track confidence, clarity, and technical depth across all your sessions with trend graphs.' },
  { icon: 'record_voice_over', color: '#ffb95f', title: 'Priority Mentor Matching', desc: 'Get matched with top alumni from FAANG, unicorn startups, and Fortune 500 companies.' },
  { icon: 'workspace_premium', color: '#ffb4ab', title: 'Placement Guarantee', desc: 'Elite members get a placement support guarantee or a full refund. No questions asked.' },
];

export default function PremiumPage() {
  const [selected, setSelected] = useState('Pro');
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', fontFamily: 'Inter, sans-serif', color: '#dae2fd' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.3rem 1rem', background: 'rgba(195,192,255,0.08)', border: '1px solid rgba(195,192,255,0.2)', borderRadius: 999, marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#c3c0ff', fontSize: 14, fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#c3c0ff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>AlumNex Premium</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem,4vw,3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '1rem', lineHeight: 1.1 }}>
          Unlock Your Full{' '}
          <span style={{ background: 'linear-gradient(135deg,#c3c0ff,#4edea3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Career Potential</span>
        </h1>
        <p style={{ fontSize: '1rem', color: '#c7c4d8', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          Get unlimited mock interviews, AI-powered coaching, and direct access to mentors at top companies.
        </p>
      </div>

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.5rem' }}>
        {PLANS.map(plan => (
          <div key={plan.name} onClick={() => !plan.disabled && setSelected(plan.name)}
            style={{ background: plan.highlight ? 'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(11,19,38,0.9))' : '#131b2e', borderRadius: 20, padding: '2rem', border: `2px solid ${selected === plan.name ? plan.color : plan.highlight ? 'rgba(195,192,255,0.3)' : 'rgba(70,69,85,0.2)'}`, cursor: plan.disabled ? 'default' : 'pointer', position: 'relative', transition: 'all 0.3s', boxShadow: plan.highlight ? '0 20px 60px rgba(79,70,229,0.2)' : 'none' }}>
            {plan.highlight && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', borderRadius: 999, padding: '0.2rem 1rem', fontSize: '0.6rem', fontWeight: 700, color: '#1d00a5', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                Most Popular
              </div>
            )}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: plan.color, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#dae2fd', letterSpacing: '-0.03em' }}>{plan.price}</span>
                <span style={{ fontSize: '0.875rem', color: '#c7c4d8', marginBottom: 6 }}>{plan.period}</span>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.8rem', color: '#c7c4d8' }}>
                  <span className="material-symbols-outlined" style={{ color: plan.color, fontSize: 16, flexShrink: 0, marginTop: 1, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={e => { e.stopPropagation(); if (!plan.disabled) setShowModal(true); }}
              disabled={plan.disabled}
              style={{ width: '100%', padding: '0.75rem', background: plan.disabled ? '#222a3d' : plan.highlight ? 'linear-gradient(135deg,#4f46e5,#c3c0ff)' : `rgba(${plan.color === '#4edea3' ? '78,222,163' : '195,192,255'},0.15)`, color: plan.disabled ? '#c7c4d8' : plan.highlight ? '#1d00a5' : plan.color, border: plan.disabled ? 'none' : `1px solid ${plan.color}40`, borderRadius: 12, fontWeight: 700, fontSize: '0.8rem', cursor: plan.disabled ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Perks */}
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>What You Get with Premium</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1rem' }}>
          {PERKS.map(p => (
            <div key={p.title} style={{ background: '#131b2e', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(70,69,85,0.15)', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${p.color}40`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(70,69,85,0.15)'; e.currentTarget.style.transform = 'none'; }}>
              <span className="material-symbols-outlined" style={{ color: p.color, fontSize: 28, marginBottom: 12, display: 'block', fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
              <h4 style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>{p.title}</h4>
              <p style={{ fontSize: '0.8rem', color: '#c7c4d8', lineHeight: 1.6 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#171f33', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 420, border: '1px solid rgba(195,192,255,0.15)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚀</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 8 }}>Upgrade to {selected}</h3>
              <p style={{ fontSize: '0.875rem', color: '#c7c4d8' }}>Payment integration coming soon. You'll be notified when it's live!</p>
            </div>
            <div style={{ background: 'rgba(78,222,163,0.08)', border: '1px solid rgba(78,222,163,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: '#4edea3' }}>🎁 Early access is free during beta. Enjoy all Pro features now!</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#222a3d', color: '#c7c4d8', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Close</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 2, padding: '0.75rem', background: 'linear-gradient(135deg,#4f46e5,#c3c0ff)', color: '#1d00a5', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Got it!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
