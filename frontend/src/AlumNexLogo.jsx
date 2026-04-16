// AlumNex Logo Component — SVG recreation of the brand logo
// Usage: <AlumNexLogo size={32} /> or <AlumNexLogo size={40} showText />

export default function AlumNexLogo({ size = 32, showText = false, textSize = '1rem' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: showText ? 10 : 0 }}>
      {/* Geometric diamond/play icon */}
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="an-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5e9ff" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="an-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8b4fe" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="an-grad3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        {/* Outer rotated square/diamond */}
        <path d="M50 8 L88 35 L80 78 L20 78 L12 35 Z" fill="url(#an-grad1)" opacity="0.85" />
        {/* Inner play triangle */}
        <path d="M38 32 L72 50 L38 68 Z" fill="url(#an-grad2)" />
        {/* Small inner triangle */}
        <path d="M44 42 L60 50 L44 58 Z" fill="url(#an-grad3)" opacity="0.9" />
        {/* Top accent shard */}
        <path d="M50 8 L62 22 L50 18 Z" fill="#e9d5ff" opacity="0.8" />
        {/* Left accent shard */}
        <path d="M12 35 L24 28 L20 42 Z" fill="#a855f7" opacity="0.7" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span style={{ fontSize: textSize, fontWeight: 700, color: '#f5e9ff', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>Alum</span>
          <span style={{ fontSize: textSize, fontWeight: 900, color: '#a855f7', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>NEX</span>
        </div>
      )}
    </div>
  );
}
