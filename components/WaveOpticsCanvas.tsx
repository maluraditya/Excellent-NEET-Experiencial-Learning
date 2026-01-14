import React, { useEffect, useRef } from 'react';

const WaveOpticsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let time = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      time += 0.2; // Speed

      ctx.clearRect(0, 0, width, height);

      // Black background for light simulation
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // --- Simulation: Double Slit Interference ---
      const slitGap = 40;
      const s1 = { x: 100, y: centerY - slitGap / 2 };
      const s2 = { x: 100, y: centerY + slitGap / 2 };

      // Draw Slits
      ctx.fillStyle = '#334155';
      ctx.fillRect(90, 0, 10, centerY - slitGap / 2 - 5);
      ctx.fillRect(90, centerY - slitGap / 2 + 5, 10, slitGap - 10);
      ctx.fillRect(90, centerY + slitGap / 2 + 5, 10, height - (centerY + slitGap / 2 + 5));

      const wavenumber = 0.5; // k

      // Optimization: Draw concentric circles for wavefronts instead of pixel-by-pixel
      // Or simply draw pixel buffer for true interference pattern (expensive in JS canvas for 60fps? 800x500 is 400k pixels. Might be slow.)
      // Let's use drawing commands for wavefronts

      const maxRadius = width;
      const waveSpacing = 20;

      ctx.lineWidth = 2;

      // Source 1 Waves
      for (let r = (time % waveSpacing); r < maxRadius; r += waveSpacing) {
        const opacity = Math.max(0, 1 - r / 500);
        ctx.strokeStyle = 'rgba(59, 130, 246, ' + opacity + ')'; // Blue
        ctx.beginPath();
        ctx.arc(s1.x, s1.y, r, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }

      // Source 2 Waves
      for (let r = (time % waveSpacing); r < maxRadius; r += waveSpacing) {
        const opacity = Math.max(0, 1 - r / 500);
        ctx.strokeStyle = 'rgba(59, 130, 246, ' + opacity + ')'; // Blue
        ctx.beginPath();
        ctx.arc(s2.x, s2.y, r, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }

      // Screen Intensity Graph (Right Side)
      const screenX = width - 50;
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#facc15'; // Yellow Intensity
      ctx.lineWidth = 2;

      for (let y = 0; y < height; y += 5) {
        // Calc path difference
        const d1 = Math.hypot(screenX - s1.x, y - s1.y);
        const d2 = Math.hypot(screenX - s2.x, y - s2.y);
        const delta = d2 - d1;
        const phase = delta * wavenumber;
        // Intensity I = I0 * cos^2(delta/2)
        const intensity = Math.pow(Math.cos(delta * 0.1), 2);

        const graphX = screenX + intensity * 40;
        if (y === 0) ctx.moveTo(graphX, y);
        else ctx.lineTo(graphX, y);

        // Draw Fringe on 'screen' line
        ctx.fillStyle = 'rgba(250, 204, 21, ' + intensity + ')';
        ctx.fillRect(screenX - 2, y, 4, 5);
      }
      ctx.stroke();

      // Labels
      ctx.fillStyle = 'white';
      ctx.font = '14px sans-serif';
      ctx.fillText("Young's Double Slit Experiment", 20, 30);
      ctx.fillStyle = '#facc15';
      ctx.fillText("Interference Pattern", width - 150, 30);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />;
};

export default WaveOpticsCanvas;
