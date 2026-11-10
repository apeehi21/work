import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  rotation: number;
  rotSpeed: number;
  isHeart: boolean;
  color: string;
}

export const BackgroundEffects: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
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

    const colors = [
      'rgba(244, 63, 94, ',   // rose-500
      'rgba(236, 72, 153, ',  // pink-500
      'rgba(251, 113, 133, ', // rose-400
      'rgba(253, 164, 175, ', // rose-300
      'rgba(255, 228, 230, '  // rose-100
    ];

    const particleCount = Math.min(Math.floor((width * height) / 18000), 45);
    const particles: Particle[] = [];

    function drawHeart(c: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number, rot: number) {
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.scale(size / 15, size / 15);
      c.fillStyle = color + alpha + ')';
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-7, -8, -14, 0, 0, 12);
      c.bezierCurveTo(14, 0, 7, -8, 0, 0);
      c.fill();
      c.restore();
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 10 + 6,
        speedY: -(Math.random() * 0.7 + 0.3),
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        isHeart: Math.random() > 0.35,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render subtle radial glow spots
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        100,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      gradient.addColorStop(0, 'rgba(159, 18, 57, 0.15)'); // rose-900 glow
      gradient.addColorStop(0.5, 'rgba(88, 28, 135, 0.08)'); // purple-900 glow
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        if (p.y < -30) {
          p.y = height + 30;
          p.x = Math.random() * width;
        }
        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;

        if (p.isHeart) {
          drawHeart(ctx, p.x, p.y, p.size, p.color, p.opacity, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = p.color + p.opacity + ')';
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(244, 63, 94, 0.6)';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
