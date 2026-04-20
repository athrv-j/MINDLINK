/* ═══════════════════════════════════════════════════════════════
   FLOATING PARTICLES (ENHANCED)
   Canvas-based reactive particle system. Particles respond to 
   the mouse cursor and pulse with organic timing.
   ═══════════════════════════════════════════════════════════════ */

import React, { useRef, useEffect } from 'react';

const COLORS = [
  [0, 255, 204],  // Teal/Accent
  [153, 51, 255], // Purple
  [0, 153, 255],  // Blue
];

const CONNECTION_DISTANCE = 110;
const MOUSE_RADIUS = 150;

export default function FloatingParticles() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      createParticles();
    };

    const createParticles = () => {
      const area = window.innerWidth * window.innerHeight;
      const count = Math.min(Math.floor(area / 20000), 50); // Optimized count
      particles = Array.from({ length: count }, () => {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        return {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          originX: 0,
          originY: 0,
          radius: Math.random() * 2 + 0.8,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          color: color,
          opacity: Math.random() * 0.4 + 0.1,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.01 + 0.005,
        };
      });
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        // Normal movement
        p.x += p.vx;
        p.y += p.vy;

        // Mouse interaction (Repulsion)
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.x += (dx / dist) * force * 2;
          p.y += (dy / dist) * force * 2;
        }

        p.pulse += p.pulseSpeed;

        // Wrap around edges
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        const pulseFactor = 0.5 + Math.sin(p.pulse) * 0.5;
        const alpha = p.opacity * pulseFactor;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.join(',')}, ${alpha})`;
        ctx.fill();
        
        // Soft Glow
        if (alpha > 0.3) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(${p.color.join(',')}, ${alpha * 0.5})`;
        } else {
          ctx.shadowBlur = 0;
        }
      }

      // Connection lines
      ctx.shadowBlur = 0;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
            const dist = Math.sqrt(distSq);
            const alpha = 0.06 * (1 - dist / CONNECTION_DISTANCE);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(180, 255, 230, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
