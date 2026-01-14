import React, { useEffect, useRef, useState } from 'react';

interface ElectromagneticInductionCanvasProps {
    angularSpeed: number; // roughly 1-10
}

const ElectromagneticInductionCanvas: React.FC<ElectromagneticInductionCanvasProps> = ({ angularSpeed }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [angle, setAngle] = useState(0);

    useEffect(() => {
        let animationFrameId: number;
        let currentAngle = 0;

        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;

            // Update state
            currentAngle += (angularSpeed * 0.05);
            setAngle(currentAngle);

            // Clear
            ctx.clearRect(0, 0, width, height);

            // --- Draw Magnetic Poles ---
            const poleWidth = 60;
            const poleHeight = 200;
            const gap = 200;
            const centerX = width / 2;
            const centerY = height / 2;

            // North Pole (Left)
            ctx.fillStyle = '#ef4444'; // Red
            ctx.fillRect(centerX - gap / 2 - poleWidth, centerY - poleHeight / 2, poleWidth, poleHeight);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 32px sans-serif';
            ctx.fillText('N', centerX - gap / 2 - 40, centerY + 10);

            // South Pole (Right)
            ctx.fillStyle = '#3b82f6'; // Blue
            ctx.fillRect(centerX + gap / 2, centerY - poleHeight / 2, poleWidth, poleHeight);
            ctx.fillStyle = 'white';
            ctx.fillText('S', centerX + gap / 2 + 15, centerY + 10);

            // Field Lines
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            for (let i = -2; i <= 2; i++) {
                const y = centerY + i * 40;
                ctx.beginPath();
                ctx.moveTo(centerX - gap / 2, y);
                ctx.lineTo(centerX + gap / 2, y);
                ctx.stroke();
            }
            ctx.setLineDash([]);

            // --- Draw Coil ---
            // Perspective projection of rotating coil rectangle
            const coilW = 120;
            const coilH = 80;

            const cosA = Math.cos(currentAngle);
            const sinA = Math.sin(currentAngle);

            // 4 corners relative to center
            // Flat coil points: (-w, -h), (w, -h), (w, h), (-w, h)
            // Rotated around Y axis

            const project = (x: number, y: number, z: number) => {
                // Simple weak perspective: just ignore z depth for scale for now, mainly x compression
                return {
                    x: centerX + x * cosA,
                    y: centerY + y
                };
            };

            // Draw sides to show 3D effect
            ctx.strokeStyle = '#f59e0b'; // Amber
            ctx.lineWidth = 6;
            ctx.lineJoin = 'round';

            const p1 = project(-coilW / 2, -coilH / 2, 0);
            const p2 = project(coilW / 2, -coilH / 2, 0);
            const p3 = project(coilW / 2, coilH / 2, 0);
            const p4 = project(-coilW / 2, coilH / 2, 0);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.stroke();

            // Slip rings / Commutator representation (simple)
            ctx.fillStyle = '#64748b';
            ctx.fillRect(centerX - 10, centerY + coilH / 2, 20, 40);

            // --- Draw Graph Overlay (Flux & EMF) ---
            // Mini graph in bottom right
            const gWidth = 150;
            const gHeight = 80;
            const gapX = 20;
            const gapY = 20;
            const gX = width - gWidth - gapX;
            const gY = height - gHeight - gapY;

            // Bg
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(gX, gY, gWidth, gHeight);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.strokeRect(gX, gY, gWidth, gHeight);

            // Time axis points
            ctx.beginPath();
            // Emf is proportional to -sin(angle) if Flux is cos(angle)
            // Visualizing sin wave
            for (let x = 0; x < gWidth; x++) {
                // Map x to past time
                const historyAngle = currentAngle - (gWidth - x) * 0.1;
                const val = Math.sin(historyAngle);
                const y = gY + gHeight / 2 - val * (gHeight / 2 - 5);
                if (x === 0) ctx.moveTo(gX + x, y);
                else ctx.lineTo(gX + x, y);
            }
            ctx.strokeStyle = '#f59e0b'; // Amber for EMF
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.font = '10px sans-serif';
            ctx.fillText('Induced EMF', gX + 5, gY + 12);

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [angularSpeed]);

    return <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />;
};

export default ElectromagneticInductionCanvas;
