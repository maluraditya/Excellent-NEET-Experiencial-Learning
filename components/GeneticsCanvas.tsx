import React, { useRef, useEffect, useState } from 'react';

interface GeneticsCanvasProps {
    mode: 'punnett' | 'meiosis';
}

const GeneticsCanvas: React.FC<GeneticsCanvasProps> = ({ mode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const startTime = useRef(Date.now());

    // State for Visualization
    const [hoverCell, setHoverCell] = useState<{ r: number, c: number } | null>(null);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // High DPI Scaling
        const dpr = window.devicePixelRatio || 1;
        const logicalWidth = 800;
        const logicalHeight = 500;
        if (canvas.width !== logicalWidth * dpr || canvas.height !== logicalHeight * dpr) {
            canvas.width = logicalWidth * dpr;
            canvas.height = logicalHeight * dpr;
            ctx.scale(dpr, dpr);
        }
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);

        const time = (Date.now() - startTime.current) / 1000;

        // ---------------------------------------------------------
        // MODE 1: PUNNETT SQUARE (DIHYBRID CROSS)
        // ---------------------------------------------------------
        if (mode === 'punnett') {
            const gametesM = ['RY', 'Ry', 'rY', 'ry']; // Male Gametes
            const gametesF = ['RY', 'Ry', 'rY', 'ry']; // Female Gametes

            const cellSize = 80;
            const startX = 250;
            const startY = 100;

            // Draw Headers
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 16px Poppins';
            ctx.textAlign = 'center';

            // Gamete Labels
            gametesM.forEach((g, i) => {
                ctx.fillStyle = '#3b82f6'; // Blue for Male
                ctx.fillText(g, startX + i * cellSize + cellSize / 2, startY - 20);
            });
            gametesF.forEach((g, i) => {
                ctx.fillStyle = '#ec4899'; // Pink for Female
                ctx.fillText(g, startX - 30, startY + i * cellSize + cellSize / 2 + 5);
            });

            // Draw Grid
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    const x = startX + c * cellSize;
                    const y = startY + r * cellSize;

                    // Genotype Logic
                    const g1 = gametesF[r];
                    const g2 = gametesM[c];
                    // Combine: RrYy order
                    const R = (g1.includes('R') || g2.includes('R')) ? ((g1.includes('R') && g2.includes('R')) ? 'RR' : 'Rr') : 'rr';
                    const Y = (g1.includes('Y') || g2.includes('Y')) ? ((g1.includes('Y') && g2.includes('Y')) ? 'YY' : 'Yy') : 'yy';
                    const genotype = R + Y;

                    // Phenotype Logic
                    const isRound = genotype.includes('R');
                    const isYellow = genotype.includes('Y');

                    // Hover Effect
                    const isHovered = hoverCell?.r === r && hoverCell?.c === c;
                    ctx.fillStyle = isHovered ? '#f1f5f9' : 'white';
                    ctx.fillRect(x, y, cellSize, cellSize);
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.strokeRect(x, y, cellSize, cellSize);

                    // Draw Pea
                    ctx.beginPath();
                    // Wrinkled shape if !isRound (wobbly circle)
                    if (!isRound) {
                        // Draw wrinkled shape
                        const cx = x + cellSize / 2;
                        const cy = y + cellSize / 2 + 10;
                        ctx.moveTo(cx + 15, cy);
                        for (let i = 0; i < Math.PI * 2; i += 0.5) {
                            const rad = 15 + Math.sin(i * 5) * 2;
                            ctx.lineTo(cx + Math.cos(i) * rad, cy + Math.sin(i) * rad);
                        }
                    } else {
                        ctx.arc(x + cellSize / 2, y + cellSize / 2 + 10, 15, 0, Math.PI * 2);
                    }

                    ctx.fillStyle = isYellow ? '#fbbf24' : '#22c55e'; // Yellow or Green
                    ctx.fill();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = '#1e293b';
                    ctx.stroke();

                    // Draw Text
                    ctx.fillStyle = '#64748b';
                    ctx.font = '12px monospace';
                    ctx.fillText(genotype, x + cellSize / 2, y + 25);
                }
            }

            // Stats Panel
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(20, 100, 180, 250);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(20, 100, 180, 250);

            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'left';
            ctx.font = 'bold 14px Poppins';
            ctx.fillText("Phenotype Ratio", 35, 130);

            const stats = [
                { label: 'Round Yellow', count: 9, color: '#fbbf24' },
                { label: 'Round Green', count: 3, color: '#22c55e' },
                { label: 'Wrinkled Yellow', count: 3, color: '#d97706' }, // darker yellow
                { label: 'Wrinkled Green', count: 1, color: '#15803d' }   // darker green
            ];

            let sy = 160;
            stats.forEach(s => {
                ctx.fillStyle = s.color;
                ctx.beginPath(); ctx.arc(40, sy - 5, 6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#475569';
                ctx.font = '12px Roboto';
                ctx.fillText(`${s.label}: ${s.count}`, 55, sy);
                sy += 30;
            });

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 16px Poppins';
            ctx.fillText("Ratio: 9 : 3 : 3 : 1", 35, 300);
        }

        // ---------------------------------------------------------
        // MODE 2: MEIOSIS (INDEPENDENT ASSORTMENT)
        // ---------------------------------------------------------
        else if (mode === 'meiosis') {
            const cx = logicalWidth / 2;
            const cy = logicalHeight / 2;

            // Draw Cell
            ctx.beginPath();
            ctx.arc(cx, cy, 180, 0, Math.PI * 2);
            ctx.fillStyle = '#f0fdf4'; // Light green bg
            ctx.fill();
            ctx.strokeStyle = '#86efac';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Metaphase Plate
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(cx, cy - 160);
            ctx.lineTo(cx, cy + 160);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.setLineDash([]);

            // Chromosomes Animation
            // Possibility 1 vs Possibility 2 oscillates every 5 seconds
            const possibility = time % 10 < 5 ? 1 : 2;

            ctx.textAlign = 'center';
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 20px Poppins';
            ctx.fillText(possibility === 1 ? "Possibility I" : "Possibility II", cx, 50);
            ctx.font = '14px Roboto';
            ctx.fillStyle = '#64748b';
            ctx.fillText(possibility === 1 ? "Maternal/Paternal align together" : "Maternal/Paternal mix independently", cx, 80);

            // Draw Chromosomes
            // Pair 1 (Large) - Color Blue (Paternal) / Red (Maternal)
            // Pair 2 (Small) - Color Blue / Red

            const drawChromosome = (x: number, y: number, color: string, size: number) => {
                ctx.fillStyle = color;
                // X shape
                ctx.save();
                ctx.translate(x, y);
                ctx.beginPath();
                ctx.roundRect(-5, -size / 2, 10, size, 5);
                ctx.roundRect(-size / 2, -5, size, 10, 5);
                ctx.fill();
                ctx.restore();
            };

            const offset = 40;

            // Left Side
            const topColorL = '#3b82f6'; // Blue (Pat)
            const botColorL = possibility === 1 ? '#3b82f6' : '#ec4899'; // Blue (Pat) OR Red (Mat)

            // Right Side
            const topColorR = '#ec4899'; // Red (Mat)
            const botColorR = possibility === 1 ? '#ec4899' : '#3b82f6'; // Red (Mat) OR Blue (Pat)

            // Draw Pairs
            // Top Pair (Large)
            drawChromosome(cx - offset, cy - 60, topColorL, 60);
            drawChromosome(cx + offset, cy - 60, topColorR, 60);

            // Bottom Pair (Small)
            drawChromosome(cx - offset, cy + 60, botColorL, 40);
            drawChromosome(cx + offset, cy + 60, botColorR, 40);

            // Arrows showing segregation
            if (time % 1 > 0.5) {
                ctx.fillStyle = '#94a3b8';
                ctx.font = 'bold 20px Arial';
                ctx.fillText("←", cx - 100, cy - 60);
                ctx.fillText("→", cx + 100, cy - 60);
                ctx.fillText("←", cx - 100, cy + 60);
                ctx.fillText("→", cx + 100, cy + 60);
            }
        }
    };

    const animate = () => {
        draw();
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    });

    // Mouse Interaction for Punnett
    const handleMouseMove = (e: React.MouseEvent) => {
        if (mode !== 'punnett') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const cellSize = 80;
        const startX = 250;
        const startY = 100;

        // Calculate logical coordinates
        const dpr = window.devicePixelRatio || 1;
        const scaleX = 800 / rect.width;
        const scaleY = 500 / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (x > startX && x < startX + 4 * cellSize && y > startY && y < startY + 4 * cellSize) {
            const c = Math.floor((x - startX) / cellSize);
            const r = Math.floor((y - startY) / cellSize);
            setHoverCell({ r, c });
        } else {
            setHoverCell(null);
        }
    };


    return (
        <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            className="w-full h-full rounded-xl bg-white shadow-inner border border-slate-200"
        />
    );
};

export default GeneticsCanvas;
