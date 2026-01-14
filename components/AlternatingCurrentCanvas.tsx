import React, { useEffect, useRef } from 'react';

interface AlternatingCurrentCanvasProps {
    primaryTurns: number;
    secondaryTurns: number;
}

const AlternatingCurrentCanvas: React.FC<AlternatingCurrentCanvasProps> = ({ primaryTurns, secondaryTurns }) => {
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

            time += 0.05;

            ctx.clearRect(0, 0, width, height);

            // --- Draw Iron Core ---
            const coreX = width / 2 - 100;
            const coreY = height / 2 - 100;
            const coreW = 200;
            const coreH = 200;
            const thick = 40;

            ctx.fillStyle = '#94a3b8'; // Slate 400
            // Outer rect
            ctx.fillRect(coreX, coreY, coreW, coreH);
            // Inner clear (hole)
            ctx.clearRect(coreX + thick, coreY + thick, coreW - thick * 2, coreH - thick * 2);
            // Inner stroke
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.strokeRect(coreX, coreY, coreW, coreH);
            ctx.strokeRect(coreX + thick, coreY + thick, coreW - thick * 2, coreH - thick * 2);

            // --- Helper to draw coil ---
            const drawCoil = (x: number, startY: number, h: number, turns: number, color: string, currentVal: number) => {
                const turnHeight = h / (turns + 1);
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.beginPath();
                for (let i = 0; i < turns; i++) {
                    const y = startY + (i + 0.5) * turnHeight;
                    // Loop front
                    ctx.moveTo(x - 20, y - turnHeight / 2 + 5);
                    ctx.bezierCurveTo(x + 40, y - turnHeight / 2 + 5, x + 40, y + turnHeight / 2 - 5, x - 20, y + turnHeight / 2 - 5);
                }
                ctx.stroke();

                // Draw Flux glow proportional to current
                if (Math.abs(currentVal) > 0.1) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = Math.abs(currentVal) * 10;
                } else {
                    ctx.shadowBlur = 0;
                }
            };

            // Input Voltage (Primary)
            const vp = Math.sin(time);
            // Output Voltage (Secondary)
            const ratio = secondaryTurns / Math.max(1, primaryTurns);
            const vs = vp * ratio;

            // Draw Primary Coil (Left)
            drawCoil(coreX, coreY + thick, coreH - thick * 2, primaryTurns, '#ef4444', vp);

            // Draw Secondary Coil (Right)
            // Right side x is coreX + coreW - thick
            // Actually we wrap around the side bar
            drawCoil(coreX + coreW, coreY + thick, coreH - thick * 2, secondaryTurns, '#3b82f6', vs);

            ctx.shadowBlur = 0; // Reset shadow

            // --- Draw Oscilloscope Views ---
            const drawScope = (x: number, y: number, label: string, val: number, color: string, scale: number = 1) => {
                const w = 120;
                const h = 80;
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(x, y, w, h);
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, w, h);

                // Label
                ctx.fillStyle = color;
                ctx.font = '10px monospace';
                ctx.fillText(label, x + 5, y + 15);
                // Instant Value
                ctx.fillText(`${val.toFixed(2)}V`, x + 5, y + h - 5);

                // Wave trace
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < w; i++) {
                    // Plot history
                    const waveT = time - (w - i) * 0.1;
                    const waveY = (label.includes('Sec') ? Math.sin(waveT) * ratio : Math.sin(waveT)) * scale;

                    // Auto-scale to fit box height roughly
                    // Clamp roughly
                    const plotY = y + h / 2 - (waveY * 20);
                    if (i === 0) ctx.moveTo(x + i, plotY);
                    else ctx.lineTo(x + i, plotY);
                }
                ctx.stroke();
            };

            drawScope(50, height - 100, "Primary (Input)", vp, '#ef4444');
            drawScope(width - 170, height - 100, "Secondary (Output)", vs, '#3b82f6', 1); // scaling handled in logic

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [primaryTurns, secondaryTurns]);

    return <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />;
};

export default AlternatingCurrentCanvas;
