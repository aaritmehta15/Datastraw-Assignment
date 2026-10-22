'use client';

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioStream?: MediaStream | null;
}

export default function AudioVisualizer({ state, audioStream }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;

    if (audioStream && state === 'listening') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioCtx();
        const source = audioContext.createMediaStreamSource(audioStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) {
        console.warn('AudioContext init error:', e);
      }
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let primaryColor = 'rgba(212, 175, 55, 0.4)';
      let glowColor = 'rgba(212, 175, 55, 0.2)';

      if (state === 'listening') {
        primaryColor = '#10B981';
        glowColor = 'rgba(16, 185, 129, 0.4)';
      } else if (state === 'thinking') {
        primaryColor = '#F59E0B';
        glowColor = 'rgba(245, 158, 11, 0.4)';
      } else if (state === 'speaking') {
        primaryColor = '#A78BFA';
        glowColor = 'rgba(167, 139, 250, 0.5)';
      }

      const barCount = 36;
      const barWidth = Math.floor(width / (barCount * 1.5));
      const centerY = height / 2;

      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray as any);
      }

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 4) + (width - barCount * (barWidth + 4)) / 2;

        let barHeight = 4;
        if (state === 'listening') {
          const freq = dataArray ? (dataArray[i % dataArray.length] / 255) : 0.2;
          const dynamicFactor = Math.sin(phase + i * 0.3) * 0.3 + 0.7;
          barHeight = Math.max(6, freq * height * 0.75 * dynamicFactor);
        } else if (state === 'thinking') {
          const wave = Math.sin(phase * 1.5 + i * 0.35);
          barHeight = Math.max(6, (wave * 0.5 + 0.5) * (height * 0.55));
        } else if (state === 'speaking') {
          const wave = Math.sin(phase * 2 + i * 0.25) * Math.cos(phase + i * 0.1);
          barHeight = Math.max(8, (Math.abs(wave) + 0.3) * (height * 0.65));
        } else {
          // Idle breathing state
          const wave = Math.sin(phase * 0.5 + i * 0.2);
          barHeight = Math.max(4, (wave * 0.5 + 0.5) * 12);
        }

        // Draw bar with rounded caps and glowing gradient
        const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, glowColor);

        ctx.fillStyle = gradient;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 4);
        ctx.fill();
      }

      phase += 0.05;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    };
  }, [state, audioStream]);

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
