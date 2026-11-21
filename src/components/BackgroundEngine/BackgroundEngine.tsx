import React, { useEffect, useRef } from 'react';
import type { BackgroundConfig } from '../../types';

interface BackgroundEngineProps {
  config: BackgroundConfig;
}

export const BackgroundEngine: React.FC<BackgroundEngineProps> = ({ config }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particle Constellation Animation for 'particles' mode
  useEffect(() => {
    if (config.type !== 'particles') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1.2,
      baseAlpha: Math.random() * 0.35 + 0.15,
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Warm porcelain base fill
      ctx.fillStyle = '#F9F8F6';
      ctx.fillRect(0, 0, width, height);

      // Render links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.22;
            ctx.strokeStyle = `rgba(114, 23, 41, ${alpha})`; // Burgundy connecting lines
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Render and update nodes
      particles.forEach((p) => {
        // Subtle mouse gravity
        const mdx = mouseX - p.x;
        const mdy = mouseY - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 180) {
          p.x += (mdx / mdist) * 0.2;
          p.y += (mdy / mdist) * 0.2;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(114, 23, 41, ${p.baseAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [config.type]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 transition-opacity duration-700">
      {/* 0. Clean Base Canvas for Sky Mode (Top 20% clouds are specifically managed by SkyHeader) */}
      {(config.type === 'sky' || !config.type) && (
        <div className="absolute inset-0 bg-white" />
      )}

      {/* 1. Porcelain Minimal */}
      {config.type === 'porcelain' && (
        <div className="absolute inset-0 bg-[#F9F8F6]">
          {/* Subtle ambient lighting vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.9)_0%,rgba(249,248,246,0.6)_60%,rgba(240,237,230,0.8)_100%)]" />
          <div className="absolute inset-0 opacity-[0.025] bg-[radial-gradient(#121214_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
      )}

      {/* 2. Liquid Mesh Gradient (Porcelain + Burgundy mist) */}
      {config.type === 'mesh' && (
        <div className="absolute inset-0 bg-[#F8F6F2] overflow-hidden">
          {/* Animated blurred luminous orbs */}
          <div className="absolute -top-[25%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-burgundy-200/40 via-burgundy-100/20 to-transparent blur-[120px] animate-pulse duration-[8000ms]" />
          <div className="absolute top-[35%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-bl from-burgundy-300/25 via-porcelain-300/40 to-transparent blur-[140px] animate-pulse duration-[10000ms]" />
          <div className="absolute -bottom-[20%] left-[25%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-t from-burgundy-100/30 to-transparent blur-[100px]" />
          <div className="absolute inset-0 bg-porcelain-100/40 backdrop-blur-[2px]" />
        </div>
      )}

      {/* 3. Interactive Particles Canvas */}
      {config.type === 'particles' && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      )}

      {/* 4. Cyber Vector Grid with subtle burgundy perspective */}
      {config.type === 'cyber' && (
        <div className="absolute inset-0 bg-[#F6F4EF] flex items-center justify-center">
          <div 
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(114, 23, 41, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(114, 23, 41, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
              transform: 'perspective(600px) rotateX(25deg) translateY(-40px) scale(1.15)',
              transformOrigin: 'center center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F6F4EF] via-transparent to-[#F6F4EF]" />
        </div>
      )}

      {/* 5. Custom Dynamic Video or Image */}
      {config.type === 'custom' && config.customUrl && (
        <div className="absolute inset-0">
          <img
            src={config.customUrl}
            alt="Dynamic Workspace Background"
            className="w-full h-full object-cover filter brightness-[0.96] contrast-[0.98]"
          />
        </div>
      )}
    </div>
  );
};
