import React, { useEffect, useRef, useState } from 'react';

const SemiconductorCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        let animationFrameId: number;
        // Holes (left) and Electrons (right)
        // When joined, they recombine in center to form depletion zone

        // Initial random positions
        // P-side (Left) : x < width/2
        const pSidePoints = Array.from({ length: 50 }, () => ({
            x: Math.random() * 350 + 20,
            y: Math.random() * 400 + 50,
            vx: (Math.random() - 0.5),
            vy: (Math.random() - 0.5)
        }));

        // N-side (Right): x > width/2
        const nSidePoints = Array.from({ length: 50 }, () => ({
            x: Math.random() * 350 + 430,
            y: Math.random() * 400 + 50,
            vx: (Math.random() - 0.5),
            vy: (Math.random() - 0.5)
        }));

        const depletionWidth = 0;
        let currentDepletion = 0;

        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;

            ctx.clearRect(0, 0, width, height);

            // --- Backgrounds ---
            // P-Type 
            ctx.fillStyle = '#fce7f3'; // Pinkish
            ctx.fillRect(0, 0, centerX, height);
            // N-Type
            ctx.fillStyle = '#dbeafe'; // Blueish
            ctx.fillRect(centerX, 0, centerX, height);

            if (joined) {
                if (currentDepletion < 60) currentDepletion += 0.5;
            } else {
                currentDepletion = 0;
            }

            // Depletion Region
            if (currentDepletion > 0) {
                ctx.fillStyle = '#e2e8f0'; // Gray
                ctx.fillRect(centerX - currentDepletion, 0, currentDepletion * 2, height);

                ctx.strokeStyle = '#94a3b8';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(centerX - currentDepletion, 0);
                ctx.lineTo(centerX - currentDepletion, height);
                ctx.moveTo(centerX + currentDepletion, 0);
                ctx.lineTo(centerX + currentDepletion, height);
                ctx.stroke();
                ctx.setLineDash([]);

                // Fixed Ions
                // Left side (P) loses holes -> becomes Negative Ion
                ctx.fillStyle = '#94a3b8';
                ctx.font = '20px sans-serif';
                for (let y = 50; y < height; y += 50) {
                    ctx.fillText('-', centerX - currentDepletion / 2, y);
                    ctx.fillText('+', centerX + currentDepletion / 2, y);
                }
            }

            // Draw Carriers
            const updateAndDraw = (p: any, type: 'hole' | 'electron') => {
                // Bounce logic
                p.x += p.vx;
                p.y += p.vy;

                if (p.y < 0 || p.y > height) p.vy *= -1;
                if (p.x < 0 || p.x > width) p.vx *= -1;

                // Junction logic
                if (joined) {
                    const barrier = centerX - (type === 'hole' ? currentDepletion : -currentDepletion);
                    // Holes stay left of barrier (mostly), Electrons right
                    if (type === 'hole' && p.x > centerX - currentDepletion) {
                        p.vx = -Math.abs(p.vx) - 1; // Kick back
                    }
                    if (type === 'electron' && p.x < centerX + currentDepletion) {
                        p.vx = Math.abs(p.vx) + 1; // Kick back
                    }
                } else {
                    // Hard wall at center before join
                    if (type === 'hole' && p.x > centerX) p.vx = -Math.abs(p.vx);
                    if (type === 'electron' && p.x < centerX) p.vx = Math.abs(p.vx);
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                if (type === 'hole') {
                    ctx.strokeStyle = '#be185d'; // Dark Pink
                    ctx.lineWidth = 2;
                    ctx.stroke(); // Hollow circle
                } else {
                    ctx.fillStyle = '#1e3a8a'; // Dark Blue
                    ctx.fill(); // Solid dot
                }
            };

            pSidePoints.forEach(p => updateAndDraw(p, 'hole'));
            nSidePoints.forEach(p => updateAndDraw(p, 'electron'));

            // Labels
            ctx.fillStyle = '#be185d';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText('P-Type (Holes)', 20, 30);

            ctx.fillStyle = '#1e3a8a';
            ctx.fillText('N-Type (Electrons)', width - 200, 30);

            if (joined) {
                ctx.fillStyle = '#475569';
                ctx.textAlign = 'center';
                ctx.fillText('Depletion Region', centerX, height - 20);
                ctx.textAlign = 'left';
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [joined]);

    return (
        <div className="relative w-full h-full">
            <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <button
                    onClick={() => setJoined(!joined)}
                    className={`px-6 py-2 rounded-full font-bold shadow-lg transition-colors \${joined ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                >
                    {joined ? 'Separate Junction' : 'Join P-N Junction'}
                </button>
            </div>
        </div>
    );
};

export default SemiconductorCanvas;
