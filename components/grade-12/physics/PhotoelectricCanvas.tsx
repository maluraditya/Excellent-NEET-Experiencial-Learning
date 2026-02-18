import React, { useEffect, useRef } from 'react';

interface PhotoelectricCanvasProps {
    frequency: number; // 1-10 (Red to UV)
    intensity: number; // 1-10
}

const PhotoelectricCanvas: React.FC<PhotoelectricCanvasProps> = ({ frequency, intensity }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let animationFrameId: number;
        let electrons: { x: number, y: number, vx: number, vy: number }[] = [];
        let photons: { x: number, y: number, color: string }[] = [];

        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // --- Draw Setup ---
            // Metal Plate (Left)
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(50, 100, 20, 300);
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '12px sans-serif';
            ctx.fillRect(40, 400, 40, 10); // Base

            // Anode (Right)
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(width - 70, 100, 20, 300);

            // Glass Tube border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(30, 80, width - 60, 340);

            // Ammeter Circuit
            ctx.beginPath();
            ctx.moveTo(60, 420);
            ctx.lineTo(60, 480);
            ctx.lineTo(width / 2 - 20, 480);
            // Meter circle
            ctx.moveTo(width / 2 + 20, 480);
            ctx.lineTo(width - 60, 480);
            ctx.lineTo(width - 60, 420);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(width / 2, 480, 20, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.fillText('A', width / 2, 485);

            // --- Physics Logic ---
            const thresholdFreq = 4; // Green light approx
            const isEjecting = frequency > thresholdFreq;
            const ke = Math.max(0, (frequency - thresholdFreq) * 2); // Kinetic Energy prop to (hν - Φ)
            const color = frequency < 3 ? '#ef4444' : (frequency < 5 ? '#22c55e' : '#a855f7'); // Red, Green, Purple

            // Spawn Photons
            if (Math.random() < intensity * 0.1) {
                // Angle incoming from top-left
                photons.push({
                    x: 100 + Math.random() * 50,
                    y: 80,
                    color: color
                });
            }

            // Update Photons
            for (let i = photons.length - 1; i >= 0; i--) {
                const p = photons[i];
                p.x -= 2; // Move left-down
                p.y += 2;

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();

                // Hit plate?
                if (p.x <= 70 && p.y >= 100 && p.y <= 400) {
                    photons.splice(i, 1);
                    // Eject Electron?
                    if (isEjecting) {
                        electrons.push({
                            x: 70,
                            y: p.y,
                            vx: 2 + Math.random() * ke, // Velocity depends on KE
                            vy: (Math.random() - 0.5) * 1
                        });
                    }
                } else if (p.y > height) {
                    photons.splice(i, 1);
                }
            }

            // Update Electrons
            let currentDraw = 0;
            for (let i = electrons.length - 1; i >= 0; i--) {
                const e = electrons[i];
                e.x += e.vx;
                e.y += e.vy;

                ctx.fillStyle = '#facc15'; // Yellow
                ctx.beginPath();
                ctx.arc(e.x, e.y, 2, 0, Math.PI * 2);
                ctx.fill();

                // Hit Anode
                if (e.x >= width - 70) {
                    electrons.splice(i, 1);
                    currentDraw += 1;
                }
            }

            // Ammeter needle
            const angle = (Math.PI * 1.5) + Math.min(Math.PI / 2, electrons.length * 0.05);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width / 2, 480);
            ctx.lineTo(width / 2 + Math.cos(angle) * 15, 480 + Math.sin(angle) * 15);
            ctx.stroke();

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [frequency, intensity]);

    return <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />;
};

export default PhotoelectricCanvas;
