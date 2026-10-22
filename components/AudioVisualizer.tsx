'use client';

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
}

export default function AudioVisualizer({ state }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let primaryColor = 'rgba(212, 175, 55, 0.4)';
      let glowColor = 'rgba(212, 175, 55, 0.2)';

      if (state === 'listening') {
        primaryColor = '#10B981';
        glowColor = 'rgba(16, 185, 129, 0.5)';
      } else if (state === 'thinking') {
        primaryColor = '#F59E0B';
        glowColor = 'rgba(245, 158, 11, 0.5)';
      } else if (state === 'speaking') {
        primaryColor = '#A78BFA';
        glowColor = 'rgba(167, 139, 250, 0.6)';
      }

      const barCount = 38;
      const barWidth = Math.floor(width / (barCount * 1.5));
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 4) + (width - barCount * (barWidth + 4)) / 2;

        let barHeight = 4;
        if (state === 'listening') {
          // Dynamic active ripple for user speaking
          const wave1 = Math.sin(phase * 2.2 + i * 0.35);
          const wave2 = Math.cos(phase * 1.4 - i * 0.2);
          barHeight = Math.max(8, (Math.abs(wave1 * wave2) + 0.2) * (height * 0.7));
        } else if (state === 'thinking') {
          // Amber undulating wave
          const wave = Math.sin(phase * 1.8 + i * 0.3);
          barHeight = Math.max(6, (wave * 0.5 + 0.5) * (height * 0.55));
        } else if (state === 'speaking') {
          // Rich rhythmic voice modulation for Aria
          const wave = Math.sin(phase * 2.5 + i * 0.28) * Math.cos(phase * 0.9 + i * 0.15);
          barHeight = Math.max(10, (Math.abs(wave) + 0.35) * (height * 0.72));
        } else {
          // Idle breathing state
          const wave = Math.sin(phase * 0.6 + i * 0.2);
          barHeight = Math.max(4, (wave * 0.5 + 0.5) * 14);
        }

        // Draw bar with rounded caps and glowing gradient
        const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, glowColor);

        ctx.fillStyle = gradient;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = state === 'idle' ? 4 : 12;

        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 4);
        ctx.fill();
      }

      phase += 0.045;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state]);

  return (
    <div style={{
      width: '100%',
      maxWidth: '680px',
      margin: '0 auto',
      position: 'relative',
      height: '110px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(7, 25, 18, 0.4)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(212, 175, 55, 0.12)',
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        width={640}
        height={90}
        style={{ width: '100%', height: '90px' }}
      />
    </div>
  );
}
