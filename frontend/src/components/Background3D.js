'use client';

import { useEffect, useRef } from 'react';

export default function Background3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const getThemeColors = () => {
      const style = getComputedStyle(document.documentElement);
      return {
        accent: style.getPropertyValue('--accent-primary').trim() || '#ffffff',
        bg1: style.getPropertyValue('--bg-primary').trim() || '#050505',
        bg2: style.getPropertyValue('--bg-secondary').trim() || '#0a0a0a'
      };
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initialize particles
    const initParticles = () => {
      particles = [];
      const particleCount = 100;

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 2,
          size: Math.random() * 1.5,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.5 + 0.1
        });
      }
    };

    const drawParticles = () => {
      // Clear with theme background
      const colors = getThemeColors();

      // Create gradient based on current theme
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, colors.bg1);
      gradient.addColorStop(1, colors.bg2);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = colors.accent;
      ctx.globalAlpha = 0.03;
      ctx.lineWidth = 1;

      const gridSize = 100;
      const offsetX = (Date.now() * 0.01) % gridSize;

      for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Draw particles
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        // Use theme accent color for particles
        ctx.fillStyle = colors.accent;
        ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.size > 1) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = colors.accent;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    initParticles();
    drawParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        // Fallback
        background: '#050505'
      }}
    />
  );
}
