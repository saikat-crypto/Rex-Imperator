import React, { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  analyser: AnalyserNode | null;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let lastTickTime = performance.now();

    // Visual configuration matching user's reference image
    const BAR_WIDTH = 3; // 3px wide vertical pills / dots
    const BAR_GAP = 3.5; // Gap between bars
    const BAR_PITCH = BAR_WIDTH + BAR_GAP; // ~6.5px center-to-center
    const MAX_HALF_HEIGHT = 15; // Extends up to 15px up and 15px down (30px total height + 3px caps)
    const MIN_HALF_HEIGHT = 0; // 0 renders as a circular dot centered on the axis
    const TICK_INTERVAL = 60; // Milliseconds per new waveform slice (~16 slices per second)
    const BAR_COLOR = '#8E8E93'; // Neutral medium gray matching the uploaded image

    // Buffer of bar heights (representing speech amplitude over time)
    // 0 = silent dot, > 0 = capsule half-height in px
    let barHeights: number[] = [];

    // Frequency data buffer
    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    // Handle high-DPI displays and container resizing
    const resizeCanvas = () => {
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = Math.max(rect.width, 100);
      const height = Math.max(rect.height, 36);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      const neededBars = Math.floor(width / BAR_PITCH);
      if (neededBars > barHeights.length) {
        const extra = new Array(neededBars - barHeights.length).fill(0);
        barHeights = [...extra, ...barHeights];
      } else if (neededBars < barHeights.length && neededBars > 10) {
        barHeights = barHeights.slice(barHeights.length - neededBars);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let scrollProgress = 0;
    let smoothedVolume = 0;

    const render = (now: number) => {
      const elapsed = now - lastTickTime;

      // 1. Read microphone volume
      let instantVolume = 0;
      if (analyser && freqData) {
        analyser.getByteFrequencyData(freqData);
        let sum = 0;
        let count = 0;
        for (let i = 2; i < Math.min(freqData.length, 28); i++) {
          sum += freqData[i];
          count++;
        }
        const avg = count > 0 ? sum / count : 0;
        // Sensitivity curve: maps ambient silence to 0, voice to 0.15 - 1.0
        instantVolume = Math.min(Math.max((avg - 5) / 45, 0), 1);
      }

      smoothedVolume += (instantVolume - smoothedVolume) * 0.3;

      // 2. Add new bar when tick interval elapses (scrolling from right to left)
      if (elapsed >= TICK_INTERVAL) {
        lastTickTime = now;

        let targetHalfHeight = 0;
        if (smoothedVolume > 0.08) {
          // Organic speech cadence: slight harmonic variation
          const variance = 0.88 + Math.random() * 0.25;
          targetHalfHeight = Math.min(
            Math.max(smoothedVolume * MAX_HALF_HEIGHT * variance, 2.5),
            MAX_HALF_HEIGHT
          );
        } else {
          // Silence produces a dot (halfHeight = 0)
          targetHalfHeight = 0;
        }

        barHeights.push(targetHalfHeight);
        const maxBars = Math.ceil(container.clientWidth / BAR_PITCH) + 4;
        if (barHeights.length > maxBars) {
          barHeights.shift();
        }
        scrollProgress = 0;
      } else {
        scrollProgress = Math.min(elapsed / TICK_INTERVAL, 1);
      }

      // 3. Draw waveform onto canvas
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = BAR_COLOR;
      ctx.fillStyle = BAR_COLOR;
      ctx.lineWidth = BAR_WIDTH;
      ctx.lineCap = 'round';

      // Pixel shift for smooth, continuous fluid scrolling
      const pixelShift = scrollProgress * BAR_PITCH;

      // Draw bars right-aligned (newest bars enter on right, scrolling smoothly left)
      const totalBars = barHeights.length;
      for (let i = 0; i < totalBars; i++) {
        const x = width - (totalBars - 1 - i) * BAR_PITCH - pixelShift;

        // Skip bars outside the visible canvas boundary
        if (x < -BAR_WIDTH || x > width + BAR_WIDTH) continue;

        let halfHeight = barHeights[i];

        // The very latest active bar also reacts directly to current live voice volume
        if (i === totalBars - 1 && smoothedVolume > 0.08) {
          halfHeight = Math.max(halfHeight, smoothedVolume * MAX_HALF_HEIGHT);
        }

        ctx.beginPath();
        if (halfHeight <= MIN_HALF_HEIGHT) {
          // Quiet dot: 3px circular dot centered on baseline
          ctx.arc(x, centerY, BAR_WIDTH / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Active speech bar: rounded vertical capsule extending symmetrically up and down
          ctx.moveTo(x, centerY - halfHeight);
          ctx.lineTo(x, centerY + halfHeight);
          ctx.stroke();
        }
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [analyser]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center h-9 sm:h-10 px-2 overflow-hidden select-none relative"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
