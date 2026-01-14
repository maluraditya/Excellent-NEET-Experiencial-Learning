import React, { useEffect, useRef } from 'react';

const EMWavesCanvas: React.FC = () => {
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

            const centerY = height / 2;
            const startX = 50;
            const endX = width - 50;
            const axisLength = endX - startX;

            // Draw Axis
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startX, centerY);
            ctx.lineTo(endX, centerY); // Z-axis (propagation)
            ctx.stroke();

            // Text
            ctx.fillStyle = '#64748b';
            ctx.font = '12px sans-serif';
            ctx.fillText('Analysis of E and B vectors', width / 2 - 60, 30);

            // Draw Sine Waves (E in Y, B in X/Z perspective)
            // Perspective: Z is right, Y is up, X is "out" (diagonal)

            ctx.lineWidth = 2;

            const points = 100;
            const wavelength = 200;

            for (let i = 0; i <= points; i++) {
                const x = startX + (i / points) * axisLength;
                const distance = x - startX;

                // Phase: kx - wt
                const phase = (distance / wavelength) * Math.PI * 2 - time;

                const mag = Math.sin(phase) * 60; // Amplitude

                // Electric Field (E) - Vertical (Red)
                const ey = centerY - mag;

                ctx.beginPath();
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Red
                ctx.moveTo(x, centerY);
                ctx.lineTo(x, ey);
                ctx.stroke();

                if (i % 5 === 0) {
                    // Arrow head for E
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(x, ey, 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Magnetic Field (B) - Horizontal/Depth (Blue)
                // We simulate 3D by drawing diagonal
                const b_start_x = x;
                const b_start_y = centerY;
                // 3D projection: x' = x - z*0.5, y' = y + z*0.5 (Cabinet projection ish)
                // B oscillates on Z axis (in/out). Let's represent it as a diagonal line
                const bx = x - mag * 0.4;
                const by = centerY + mag * 0.4;

                ctx.beginPath();
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; // Blue
                ctx.moveTo(x, centerY);
                ctx.lineTo(bx, by);
                ctx.stroke();

                if (i % 5 === 0) {
                    // Arrow head for B
                    ctx.fillStyle = '#3b82f6';
                    ctx.beginPath();
                    ctx.arc(bx, by, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Connect tips for envelope
            // E Envelope
            ctx.beginPath();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            for (let i = 0; i <= points; i++) {
                const x = startX + (i / points) * axisLength;
                const distance = x - startX;
                const phase = (distance / wavelength) * Math.PI * 2 - time;
                const mag = Math.sin(phase) * 60;
                const ey = centerY - mag;
                if (i === 0) ctx.moveTo(x, ey);
                else ctx.lineTo(x, ey);
            }
            ctx.stroke();

            // B Envelope
            ctx.beginPath();
            ctx.strokeStyle = '#3b82f6';
            for (let i = 0; i <= points; i++) {
                const x = startX + (i / points) * axisLength;
                const distance = x - startX;
                const phase = (distance / wavelength) * Math.PI * 2 - time;
                const mag = Math.sin(phase) * 60;
                const bx = x - mag * 0.4;
                const by = centerY + mag * 0.4;
                if (i === 0) ctx.moveTo(bx, by);
                else ctx.lineTo(bx, by);
            }
            ctx.stroke();

            // Labels
            ctx.fillStyle = '#ef4444';
            ctx.fillText('Electric Field (E)', startX, centerY - 80);
            ctx.fillStyle = '#3b82f6';
            ctx.fillText('Magnetic Field (B)', startX, centerY + 80);


            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />;
};

export default EMWavesCanvas;
