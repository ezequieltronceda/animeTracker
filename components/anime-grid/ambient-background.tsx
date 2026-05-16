'use client';

const ACCENT = '#6366f1';

export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute rounded-full"
        style={{
          top: '-15%',
          left: '-10%',
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${ACCENT}33, transparent 60%)`,
          filter: 'blur(60px)',
          animation: 'cgDrift1 22s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: '-20%',
          right: '-10%',
          width: 700,
          height: 700,
          background: `radial-gradient(circle, color-mix(in oklch, ${ACCENT} 60%, #ec4899)22, transparent 60%)`,
          filter: 'blur(80px)',
          animation: 'cgDrift2 28s ease-in-out infinite',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.04), transparent 60%)',
        }}
      />
    </div>
  );
}
