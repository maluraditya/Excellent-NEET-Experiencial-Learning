import React, { useEffect, useRef } from 'react';

const AtomsCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let animationFrameId: number;

        // Particles manager
        const particles: { x: number, y: number, vx: number, vy: number, passed: boolean }[] = [];

        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            // --- Draw Gold Nucleus ---
            const nucFilter = 10000; // Force scaler
            ctx.fillStyle = '#facc15'; // Gold
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0f172a';
            ctx.font = '10px sans-serif';
            ctx.fillText('Au Nucleus (+79e)', centerX - 30, centerY + 25);


            // --- Spawn Alpha Particles ---
            if (particles.length < 50 && Math.random() < 0.2) {
                // Random impact parameter b (Y offset)
                // Concentrate closer to center for interesting scattering
                const b = (Math.random() - 0.5) * 200;
                particles.push({
                    x: 0,
                    y: centerY + b,
                    vx: 5,
                    vy: 0,
                    passed: false
                });
            }

            // --- Update & Draw Particles ---
            ctx.fillStyle = '#ef4444'; // Alpha particle red

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                // Coulomb Repulsion Logic
                const dx = p.x - centerX;
                const dy = p.y - centerY;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                if (dist < 5) {
                    particles.splice(i, 1); // Collision? (shouldn't really happen with simple physics step)
                    continue;
                }

                // Force F = k * q1q2 / r^2
                // a = F/m. 
                // Vector force points away from nucleus.
                // Fx = F * (dx/dist), Fy = F * (dy/dist)

                // Only scatter if somewhat close to avoid wasted calc for far particles? 
                // No, inverse square law is long range.
                if (dist < 400) {
                    const force = nucFilter / distSq;
                    // Apply repulsion (acceleration)
                    // Note: p.x < centerX means dx is negative, force should be negative (push back)? 
                    // No, force pushes AWAY. Vector (dx, dy) points FROM Center TO Particle?
                    // dx = p.x - centerX. If p.x < centerX, dx is neg. Vector points to left.
                    // Correct. Force direction is (dx, dy).

                    p.vx += (dx / dist) * force;
                    p.vy += (dy / dist) * force;
                }

                p.x += p.vx;
                p.y += p.vy;

                // Draw path trace? Or just particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();

                // Trail
                ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.fillRect(p.x - p.vx * 2, p.y - p.vy * 2, 4, 4);
                ctx.fillStyle = '#ef4444'; // Restore

                if (p.x > width || p.x < 0 || p.y > height || p.y < 0) {
                    particles.splice(i, 1);
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return <canvas ref={canvasRef} width={800} height={500} className="w-full h-full object-contain" />;
};

export default AtomsCanvas;
