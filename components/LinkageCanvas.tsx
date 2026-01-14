import React, { useRef, useEffect, useState } from 'react';

interface LinkageCanvasProps {
    mode: 'crossover' | 'mapping';
}

const LinkageCanvas: React.FC<LinkageCanvasProps> = ({ mode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const startTime = useRef(Date.now());

    // State for Mapping Mode
    const [distance, setDistance] = useState<number>(30); // Distance in centiMorgans (cM)

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
        // MODE 1: CROSSING OVER ANIMATION
        // ---------------------------------------------------------
        if (mode === 'crossover') {
            const cx = logicalWidth / 2;
            const cy = logicalHeight / 2;

            // Animation Phases
            // 0-3s: Approach
            // 3-6s: Chiasma (Twist)
            // 6-9s: Separation (Recombined)
            const phase = time % 9;

            let twistFactor = 0;
            let separation = 60;
            let colorSwap = false;
            let statusText = "Homologous Chromosomes Pair Up";

            if (phase > 3 && phase < 6) {
                // Crossing Over
                statusText = "Crossing Over (Chiasma Formation)";
                const t = (phase - 3) / 3; // 0 to 1
                twistFactor = Math.sin(t * Math.PI) * 40;
                separation = 60 - Math.sin(t * Math.PI) * 40;
            } else if (phase >= 6) {
                // Separation
                statusText = "Recombinant Chromatids Formed";
                colorSwap = true;
                separation = 60;
            }

            ctx.textAlign = 'center';
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 20px Poppins';
            ctx.fillText(statusText, cx, 50);

            // Draw Chromosomes
            const drawChromatid = (x: number, y: number, color: string, swappedColor: string, isLeft: boolean) => {
                ctx.lineWidth = 20;
                ctx.lineCap = 'round';

                // Upper arm
                ctx.beginPath();
                ctx.moveTo(x, y);
                // Control points for twist
                const cp1x = x + (isLeft ? 1 : -1) * twistFactor;
                ctx.quadraticCurveTo(cp1x, y - 80, x + (isLeft ? -20 : 20), y - 160);
                ctx.strokeStyle = color;
                ctx.stroke();

                // Lower arm (Site of Crossover)
                ctx.beginPath();
                ctx.moveTo(x, y);
                // Control points for twist
                const cp2x = x + (isLeft ? 1 : -1) * twistFactor * 1.5;
                // If colorSwap is true, we draw the tip in the *other* color

                if (colorSwap && isLeft) {
                    // Left chromatid gets Right color tip
                    ctx.strokeStyle = color;
                    ctx.quadraticCurveTo(cp2x, y + 80, x + (isLeft ? -10 : 10), y + 100);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x + (isLeft ? -10 : 10), y + 100);
                    ctx.quadraticCurveTo(x + (isLeft ? -15 : 15), y + 130, x + (isLeft ? -20 : 20), y + 160);
                    ctx.strokeStyle = swappedColor;
                    ctx.stroke();
                } else if (colorSwap && !isLeft) {
                    // Right chromatid gets Left color tip
                    ctx.strokeStyle = color;
                    ctx.quadraticCurveTo(cp2x, y + 80, x + (isLeft ? -10 : 10), y + 100);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x + (isLeft ? -10 : 10), y + 100);
                    ctx.quadraticCurveTo(x + (isLeft ? -15 : 15), y + 130, x + (isLeft ? -20 : 20), y + 160);
                    ctx.strokeStyle = swappedColor;
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = color;
                    ctx.quadraticCurveTo(cp2x, y + 80, x + (isLeft ? -20 : 20), y + 160);
                    ctx.stroke();
                }
            };

            // Centromere
            const cy_shift = cy + 20;

            // Chromosome 1 (Blue)
            drawChromatid(cx - separation, cy_shift, '#3b82f6', '#ef4444', true);

            // Chromosome 2 (Red)
            drawChromatid(cx + separation, cy_shift, '#ef4444', '#3b82f6', false);

            // Draw Centromeres
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath(); ctx.arc(cx - separation, cy_shift, 12, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + separation, cy_shift, 12, 0, Math.PI * 2); ctx.fill();
        }

        // ---------------------------------------------------------
        // MODE 2: GENETIC MAPPING (MORGAN)
        // ---------------------------------------------------------
        else if (mode === 'mapping') {
            const cx = logicalWidth / 2;
            const cy = logicalHeight / 2;

            // Draw Chromosome
            ctx.lineCap = 'round';
            ctx.lineWidth = 40;
            ctx.strokeStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(100, cy);
            ctx.lineTo(700, cy);
            ctx.stroke();

            // Draw Gene A (Fixed)
            const ax = 150;
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath(); ctx.arc(ax, cy, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 16px Poppins';
            ctx.textAlign = 'center';
            ctx.fillText("Gene A", ax, cy - 40);
            ctx.fillText("(White Eye)", ax, cy + 50);

            // Draw Gene B (Movable)
            // distance 0 to 100 maps to x 150 to 650
            const bx = 150 + (distance * 5);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath(); ctx.arc(bx, cy, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1e293b';
            ctx.fillText("Gene B", bx, cy - 40);
            ctx.fillText("(Miniature Wing)", bx, cy + 50);

            // Draw Connection / Ruler
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(ax, cy - 10);
            ctx.lineTo(bx, cy - 10);
            ctx.stroke();
            ctx.setLineDash([]);

            // Distance Label
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`${distance} cM`, (ax + bx) / 2, cy - 20);

            // Recombination Info Box
            const recombFreq = distance > 50 ? 50 : distance; // Max recombination is 50%

            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.fillRect(logicalWidth / 2 - 150, 350, 300, 120);
            ctx.strokeRect(logicalWidth / 2 - 150, 350, 300, 120);

            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'left';
            ctx.font = 'bold 16px Poppins';
            ctx.fillText("Data Analysis", logicalWidth / 2 - 130, 380);

            ctx.font = '14px Roboto';
            ctx.fillStyle = '#475569';
            ctx.fillText(`Physical Distance: ${distance} map units`, logicalWidth / 2 - 130, 410);
            ctx.fillText(`Recombination Freq: ${recombFreq}%`, logicalWidth / 2 - 130, 435);

            ctx.font = 'bold 14px Roboto';
            ctx.fillStyle = recombFreq < 10 ? '#dc2626' : (recombFreq > 40 ? '#16a34a' : '#d97706');
            const conclusion = recombFreq < 10 ? "TIGHTLY LINKED (Inherited Together)" : (recombFreq > 40 ? "LOOSELY LINKED (Independent)" : "LINKED (Some Crossing Over)");
            ctx.fillText(conclusion, logicalWidth / 2 - 130, 460);
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

    return (
        <div className="w-full h-full flex flex-col">
            <div className="relative flex-1 bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-full" />
            </div>

            {/* Controls for Mapping Mode */}
            {mode === 'mapping' && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-4">
                    <label className="font-bold text-slate-700">Distance:</label>
                    <input
                        type="range" min="1" max="100"
                        value={distance}
                        onChange={(e) => setDistance(Number(e.target.value))}
                        className="flex-1 accent-brand-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono text-slate-500 w-16">{distance} cM</span>
                </div>
            )}
        </div>
    );
};

export default LinkageCanvas;
