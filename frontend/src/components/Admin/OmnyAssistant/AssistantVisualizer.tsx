import React, { useEffect, useRef } from 'react';

export enum AssistantState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}

interface AssistantVisualizerProps {
  state: AssistantState;
  audioLevel?: number; // 0-1 range for audio visualization
}

const AssistantVisualizer: React.FC<AssistantVisualizerProps> = ({ state, audioLevel = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Refs for physics smoothing
  const phaseRef = useRef(0);
  const amplitudeRef = useRef(0);

  // Google-inspired neon colors
  const colors = [
    'rgba(66, 133, 244, 1)',   // Blue
    'rgba(234, 67, 53, 1)',    // Red
    'rgba(251, 188, 5, 1)',    // Yellow
    'rgba(52, 168, 83, 1)'     // Green
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // 1. Resize & Setup
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 2. Determine animation parameters based on state
      let targetAmplitude = 0;
      let speedMultiplier = 1;

      switch (state) {
        case AssistantState.LISTENING:
          targetAmplitude = 0.15 + (audioLevel * 0.5); // Base + audio input
          speedMultiplier = 1.2;
          break;
        case AssistantState.SPEAKING:
          targetAmplitude = 0.25 + (audioLevel * 0.7);
          speedMultiplier = 2.0;
          break;
        case AssistantState.THINKING:
          targetAmplitude = 0.1;
          speedMultiplier = 3.0; // Fast nervous energy
          break;
        case AssistantState.CONNECTING:
          targetAmplitude = 0.3 + Math.sin(Date.now() / 200) * 0.1; // Heartbeat
          speedMultiplier = 0.5;
          break;
        case AssistantState.IDLE:
          targetAmplitude = 0.05 + Math.sin(Date.now() / 1000) * 0.02; // Gentle breathing
          speedMultiplier = 0.8;
          break;
        default:
          targetAmplitude = 0.05;
      }

      // Clamp amplitude
      targetAmplitude = Math.min(1.5, targetAmplitude);

      // Smooth physics
      amplitudeRef.current += (targetAmplitude - amplitudeRef.current) * 0.1;
      const amplitude = amplitudeRef.current;

      // Update phase
      phaseRef.current += 0.05 * speedMultiplier + (amplitude * 0.1);

      // 3. Draw waves with glow effect
      ctx.globalCompositeOperation = 'lighter';

      const totalLines = 4;

      for (let i = 0; i < totalLines; i++) {
        const color = colors[i];

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 + (amplitude * 4);

        const iOffset = i * (Math.PI / 2);

        for (let x = 0; x <= width; x += 4) {
          const normX = (x / width) * 2 - 1;
          const envelope = Math.pow(Math.cos(normX * Math.PI * 0.5), 2.5);

          // Wave components
          const wave1 = Math.sin(x * 0.01 + phaseRef.current + iOffset);
          const wave2 = Math.sin(x * 0.03 - phaseRef.current * 1.5 + (i * 1.3));
          const wave3 = Math.sin(x * 0.05 + phaseRef.current * 3) * (amplitude * 0.5);

          const separation = (i - 1.5) * (amplitude * 30);

          const y = centerY +
                    (wave1 * 30 + wave2 * 15 + wave3 * 10) * envelope * (0.5 + amplitude) +
                    (separation * envelope);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.shadowBlur = 15 + (amplitude * 20);
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.globalCompositeOperation = 'source-over';
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state, audioLevel]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ filter: 'contrast(1.2) saturate(1.2)' }}
    />
  );
};

export default AssistantVisualizer;
