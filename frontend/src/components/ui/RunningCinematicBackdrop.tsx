import React, { useEffect, useRef } from 'react';

interface RunningCinematicBackdropProps {
  imageSrc: string;
  altText?: string;
  videoSrc?: string;
  gradientOverlay?: string;
  brightness?: string;
  opacity?: string;
  showParticles?: boolean;
  accentGlow?: 'cyan' | 'amber' | 'emerald' | 'rose' | 'mixed';
}

export const RunningCinematicBackdrop: React.FC<RunningCinematicBackdropProps> = ({
  imageSrc,
  altText = 'Cinematic Clinical Environment',
  videoSrc,
  gradientOverlay = 'from-white/25 via-transparent to-white/35',
  brightness = 'brightness-100 contrast-[1.05] saturate-[1.08]',
  opacity = 'opacity-100',
  showParticles = true,
  accentGlow = 'cyan',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Floating ambient clinical light particles
  useEffect(() => {
    if (!showParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Subtle clinical particles
    const particleCount = Math.min(28, Math.floor(width / 45));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2 + 0.8,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.35 + 0.15), // Gentle upward drift
      alpha: Math.random() * 0.45 + 0.15,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${p.alpha * 0.55})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [showParticles]);

  const glowStyles = {
    cyan: 'from-cyan-400/10 via-teal-400/5 to-transparent',
    amber: 'from-amber-400/12 via-orange-400/5 to-transparent',
    emerald: 'from-emerald-400/12 via-teal-400/5 to-transparent',
    rose: 'from-rose-400/12 via-pink-400/5 to-transparent',
    mixed: 'from-cyan-400/10 via-emerald-400/8 to-transparent',
  }[accentGlow];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* 1. Continuous Running Architectural Motion Layer (Smooth Ken Burns 60fps Drift) */}
      <div className="absolute inset-[-4%] w-[108%] h-[108%] animate-kenburns">
        {videoSrc ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={imageSrc}
            className={`w-full h-full object-cover object-center filter ${brightness} ${opacity}`}
          >
            <source src={videoSrc} type="video/mp4" />
            <img
              src={imageSrc}
              alt={altText}
              className={`w-full h-full object-cover object-center filter ${brightness} ${opacity}`}
            />
          </video>
        ) : (
          <img
            src={imageSrc}
            alt={altText}
            className={`w-full h-full object-cover object-center filter ${brightness} ${opacity}`}
          />
        )}
      </div>

      {/* 2. Floating Ambient Clinical Particle Field */}
      {showParticles && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen pointer-events-none"
        />
      )}

      {/* 3. Luminous Pulsing Accent Lights (Subtle breathing glow in corners) */}
      <div
        className={`absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br ${glowStyles} blur-3xl animate-ambient-glow`}
      />
      <div
        className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tl ${glowStyles} blur-3xl animate-ambient-glow`}
        style={{ animationDelay: '4.5s' }}
      />

      {/* 4. Protective White Glassmorphism Veil (Ensures 100% optical readability of all foreground text) */}
      <div className={`absolute inset-0 bg-gradient-to-b ${gradientOverlay}`} />
    </div>
  );
};
