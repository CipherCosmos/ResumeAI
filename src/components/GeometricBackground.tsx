'use client';

import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  baseX: number;
  baseY: number;
  density: number;
  color: string;
  type: 'circle' | 'square' | 'triangle';
}

export const GeometricBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let mouse = {
      x: -100,
      y: -100,
      radius: 150
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    window.addEventListener('resize', resize);
    resize();

    function init() {
      particles = [];
      const numberOfParticles = Math.floor((canvas!.width * canvas!.height) / 15000);
      const colors = ['rgba(var(--primary-rgb), 0.3)', 'rgba(99, 102, 241, 0.2)', 'rgba(var(--primary-rgb), 0.1)'];
      const types: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 5 + 2;
        const x = Math.random() * canvas!.width;
        const y = Math.random() * canvas!.height;
        
        particles.push({
          x,
          y,
          size,
          baseX: x,
          baseY: y,
          density: (Math.random() * 30) + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          type: types[Math.floor(Math.random() * types.length)]
        });
      }
    }

    function drawShape(p: Particle) {
      ctx!.fillStyle = p.color;
      ctx!.beginPath();
      
      if (p.type === 'circle') {
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      } else if (p.type === 'square') {
        ctx!.rect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      } else if (p.type === 'triangle') {
        ctx!.moveTo(p.x, p.y - p.size * 1.5);
        ctx!.lineTo(p.x - p.size * 1.5, p.y + p.size * 1.5);
        ctx!.lineTo(p.x + p.size * 1.5, p.y + p.size * 1.5);
      }
      
      ctx!.closePath();
      ctx!.fill();
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Calculate distance between mouse and particle
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Swarm effect: attract towards mouse
        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const directionX = (dx / distance) * force * p.density * 0.5;
          const directionY = (dy / distance) * force * p.density * 0.5;
          
          p.x += directionX;
          p.y += directionY;

          // Draw a faint line to the mouse for the ones that are "connected"
          ctx!.strokeStyle = p.color;
          ctx!.lineWidth = 0.1 * force;
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(mouse.x, mouse.y);
          ctx!.stroke();
        } else {
          // Return to base position
          const dxBase = p.x - p.baseX;
          const dyBase = p.y - p.baseY;
          p.x -= dxBase / 20;
          p.y -= dyBase / 20;
        }
        
        drawShape(p);

        // Connect particles that are close together (constellation effect)
        for (let j = i; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                ctx!.strokeStyle = p.color;
                ctx!.lineWidth = 0.2;
                ctx!.beginPath();
                ctx!.moveTo(p.x, p.y);
                ctx!.lineTo(p2.x, p2.y);
                ctx!.stroke();
            }
        }
      }
      
      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-40 md:opacity-100"
    />
  );
};
