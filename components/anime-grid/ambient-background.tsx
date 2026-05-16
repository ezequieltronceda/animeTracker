'use client';

interface AmbientBackgroundProps {
  accent: string;
}

export function AmbientBackground({ accent }: AmbientBackgroundProps) {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}33, transparent 60%)`,
          filter: 'blur(60px)',
          animation: 'cgDrift1 22s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, color-mix(in oklch, ${accent} 60%, #ec4899)22, transparent 60%)`,
          filter: 'blur(80px)',
          animation: 'cgDrift2 28s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.04), transparent 60%)',
        }}
      />
    </div>
  );
}
