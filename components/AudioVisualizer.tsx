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

      let primaryColor = 'rgba(56, 189, 248, 0.3)';

      if (state === 'listening') {
        primaryColor = '#3B82F6'; // Enterprise Cobalt Blue
      } else if (state === 'thinking') {
        primaryColor = '#F59E0B'; // Enterprise Amber
      } else if (state === 'speaking') {
        primaryColor = '#38BDF8'; // Crisp Steel Cyan
      }

      const barCount = 42;
      const barWidth = 3;
      const barGap = 6;
      const totalWidth = barCount * (barWidth + barGap);
      const startX = (width - totalWidth) / 2;
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        const x = startX + i * (barWidth + barGap);

        // Center weighting factor (bell curve)
        const normalizedDist = Math.abs(i - barCount / 2) / (barCount / 2);
        const centerWeight = Math.cos(normalizedDist * Math.PI * 0.45);

        let barHeight = 4;
        if (state === 'listening') {
          // Subtle responsive wave for incoming voice
          const wave = Math.sin(phase * 2.8 + i * 0.4) * Math.cos(phase * 1.5 - i * 0.2);
          barHeight = Math.max(6, (Math.abs(wave) * 0.75 + 0.2) * (height * 0.65) * centerWeight);
        } else if (state === 'thinking') {
          // Gentle undulating processing wave
          const wave = Math.sin(phase * 1.8 + i * 0.25);
          barHeight = Math.max(5, (wave * 0.5 + 0.5) * (height * 0.4) * centerWeight + 4);
        } else if (state === 'speaking') {
          // Natural voice cadence for Aria
          const wave1 = Math.sin(phase * 2.2 + i * 0.3);
          const wave2 = Math.cos(phase * 1.1 + i * 0.18);
          barHeight = Math.max(8, (Math.abs(wave1 * wave2) + 0.25) * (height * 0.7) * centerWeight);
        } else {
          // Minimal resting baseline
          const wave = Math.sin(phase * 0.8 + i * 0.2);
          barHeight = Math.max(3, (wave * 0.5 + 0.5) * 8 * centerWeight + 2);
        }

        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 2);
        ctx.fill();
      }

      phase += 0.04;
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
      maxWidth: '620px',
      margin: '0 auto',
      position: 'relative',
      height: '84px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-inset)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        width={580}
        height={76}
        style={{ width: '100%', height: '76px' }}
      />
    </div>
  );
}
