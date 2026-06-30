'use client';

import { useEffect, useRef } from 'react';

const TONE_THEME = {
  night: {
    veil: [4, 7, 13],
    glow: [180, 35, 28],
    accent: [118, 78, 255],
    particles: [255, 92, 70],
    direction: 1
  },
  day: {
    veil: [255, 227, 176],
    glow: [255, 211, 122],
    accent: [255, 245, 210],
    particles: [241, 210, 154],
    direction: -1
  },
  vote: {
    veil: [28, 0, 0],
    glow: [220, 45, 32],
    accent: [241, 210, 154],
    particles: [255, 86, 60],
    direction: 1
  },
  end: {
    veil: [10, 6, 8],
    glow: [184, 146, 90],
    accent: [255, 180, 168],
    particles: [241, 210, 154],
    direction: -1
  }
};

const easeInOut = (value) => {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
};

const rgba = ([r, g, b], alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

export default function PhaseTransitionCanvas({ overlay }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !overlay) return undefined;

    const ctx = canvas.getContext('2d');
    const theme = TONE_THEME[overlay.tone] || TONE_THEME.night;
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const startedAt = performance.now();
    const duration = 2700;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      particlesRef.current = Array.from({ length: 96 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.7 + Math.random() * 2.4,
        speed: 0.16 + Math.random() * 0.7,
        drift: -0.35 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.18 + Math.random() * 0.58
      }));
    };

    const drawSmokeRibbon = (progress, offset, alpha) => {
      const ribbonY = height * (0.42 + offset * 0.12);
      const ribbonHeight = height * (0.18 + offset * 0.05);
      const gradient = ctx.createLinearGradient(0, ribbonY - ribbonHeight, width, ribbonY + ribbonHeight);
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.22, rgba(theme.accent, alpha * 0.12));
      gradient.addColorStop(0.5, rgba(theme.glow, alpha * 0.18));
      gradient.addColorStop(0.78, rgba(theme.accent, alpha * 0.1));
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate((progress - 0.5) * width * 0.18 * theme.direction, 0);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(-width * 0.1, ribbonY);
      for (let i = 0; i <= 6; i += 1) {
        const x = (width / 6) * i;
        const wave = Math.sin(progress * 5 + i * 0.9 + offset) * ribbonHeight;
        ctx.lineTo(x, ribbonY + wave);
      }
      ctx.lineTo(width * 1.1, ribbonY + ribbonHeight * 1.8);
      ctx.lineTo(-width * 0.1, ribbonY + ribbonHeight * 1.8);
      ctx.closePath();
      ctx.filter = 'blur(18px)';
      ctx.fill();
      ctx.restore();
    };

    const draw = (now) => {
      const raw = (now - startedAt) / duration;
      const progress = Math.min(raw, 1);
      const intro = easeInOut(Math.min(progress / 0.36, 1));
      const outro = easeInOut(Math.max((progress - 0.72) / 0.28, 0));
      const visibility = Math.max(0, intro * (1 - outro));
      const sweep = easeInOut(progress);

      ctx.clearRect(0, 0, width, height);

      const curtain = ctx.createLinearGradient(0, 0, 0, height);
      if (overlay.tone === 'day') {
        curtain.addColorStop(0, rgba(theme.veil, 0.24 * visibility));
        curtain.addColorStop(0.48, rgba(theme.glow, 0.13 * visibility));
        curtain.addColorStop(1, rgba([18, 10, 5], 0.36 * visibility));
      } else {
        curtain.addColorStop(0, rgba(theme.veil, 0.68 * visibility));
        curtain.addColorStop(0.52, rgba([0, 0, 0], 0.38 * visibility));
        curtain.addColorStop(1, rgba([0, 0, 0], 0.76 * visibility));
      }
      ctx.fillStyle = curtain;
      ctx.fillRect(0, 0, width, height);

      const orbX = overlay.tone === 'day'
        ? width * (0.16 + sweep * 0.2)
        : width * (0.82 - sweep * 0.18);
      const orbY = overlay.tone === 'day'
        ? height * (0.16 + sweep * 0.08)
        : height * (0.2 + sweep * 0.06);
      const orb = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, Math.max(width, height) * 0.38);
      orb.addColorStop(0, rgba(theme.glow, overlay.tone === 'day' ? 0.34 * visibility : 0.3 * visibility));
      orb.addColorStop(0.22, rgba(theme.glow, 0.14 * visibility));
      orb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = orb;
      ctx.fillRect(0, 0, width, height);

      drawSmokeRibbon(progress, -0.8, visibility * 0.74);
      drawSmokeRibbon(progress, 0.3, visibility * 0.5);

      ctx.save();
      ctx.globalCompositeOperation = overlay.tone === 'day' ? 'screen' : 'lighter';
      particlesRef.current.forEach((particle) => {
        const drift = Math.sin(progress * 7 + particle.phase) * particle.drift * 40;
        const y = (particle.y + progress * height * particle.speed * theme.direction + height) % height;
        const x = particle.x + drift;
        const flicker = 0.55 + Math.sin(progress * 18 + particle.phase) * 0.45;
        ctx.beginPath();
        ctx.fillStyle = rgba(theme.particles, particle.alpha * flicker * visibility);
        ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      const wipeX = overlay.tone === 'day'
        ? width * (-0.1 + sweep * 1.2)
        : width * (1.1 - sweep * 1.2);
      const wipe = ctx.createLinearGradient(wipeX - width * 0.18, 0, wipeX + width * 0.18, 0);
      wipe.addColorStop(0, 'rgba(255,255,255,0)');
      wipe.addColorStop(0.5, rgba(theme.accent, (overlay.tone === 'day' ? 0.22 : 0.14) * visibility));
      wipe.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = wipe;
      ctx.fillRect(0, 0, width, height);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    resize();
    animationFrame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, [overlay]);

  if (!overlay) return null;

  return (
    <div className={`phase-cinematic phase-cinematic-${overlay.tone}`} aria-live="polite">
      <canvas ref={canvasRef} className="phase-cinematic__canvas" />
      <div className="phase-cinematic__copy">
        <span>Nghi thức chuyển pha</span>
        <h2>{overlay.title}</h2>
        <p>{overlay.subtitle}</p>
      </div>
    </div>
  );
}
