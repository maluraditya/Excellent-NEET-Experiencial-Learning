import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface SHMLabProps {
    topic: any;
    onExit: () => void;
}

const SHMLab: React.FC<SHMLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);

    const [mass, setMass] = useState(1.0);
    const [springK, setSpringK] = useState(100);
    const [amplitude, setAmplitude] = useState(60);
    const [running, setRunning] = useState(true);

    const stateRef = useRef({ mass: 1.0, k: 100, A: 60, running: true, time: 0 });
    const graphRef = useRef<{ t: number; x: number; v: number; a: number }[]>([]);
    const frameRef = useRef(0);

    useEffect(() => {
        stateRef.current.mass = mass;
        stateRef.current.k = springK;
        stateRef.current.A = amplitude;
        stateRef.current.running = running;
    }, [mass, springK, amplitude, running]);

    // Dynamic canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        resizeObserver.observe(parent);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        return () => resizeObserver.disconnect();
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }
        const s = stateRef.current;
        frameRef.current++;

        // Physics
        const omega = Math.sqrt(s.k / s.mass);
        const T_period = 2 * Math.PI / omega;
        const freq = 1 / T_period;
        // Physics update (slowed down for analysis)
        if (s.running) s.time += 0.01;

        const scaledA = Math.min(s.A, W * 0.15); // Scale amplitude to canvas
        const x = scaledA * Math.cos(omega * s.time);
        const v_val = -omega * scaledA * Math.sin(omega * s.time);
        const a_val = -omega * omega * scaledA * Math.cos(omega * s.time);
        const vMax = omega * scaledA;
        const aMax = omega * omega * scaledA;

        // Graph data
        if (s.running && frameRef.current % 2 === 0) {
            graphRef.current.push({ t: s.time, x: x / scaledA, v: vMax > 0 ? v_val / vMax : 0, a: aMax > 0 ? a_val / aMax : 0 });
            if (graphRef.current.length > 200) graphRef.current.shift();
        }

        // Clear
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; // Soft White
        ctx.fillRect(0, 0, W, H);

        // DYNAMIC VIEWPORT SCALING (Laptop vs Smartboard)
        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

        // ═══════════════════════════════════════════
        // TOP HALF: Spring-Mass Animation
        // ═══════════════════════════════════════════
        const topH = H * 0.38;
        const wallX = pad * 2;
        const wallW = 30 * scale;
        const tableY = topH * 0.35;
        const tableH = topH * 0.45;
        const tableW = W * 0.85;
        const equilibX = wallX + wallW + tableW * 0.45;
        const blockW = Math.min(65 * scale, W * 0.07);
        const blockH = Math.min(65 * scale, topH * 0.4);

        // Table surface
        ctx.fillStyle = '#e2e8f0';
        roundRect(ctx, wallX, tableY, tableW, tableH, 8); ctx.fill();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
        roundRect(ctx, wallX, tableY, tableW, tableH, 8); ctx.stroke();

        // Wall
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(wallX, tableY, wallW, tableH);
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(wallX + wallW - 3, tableY + 5 + i * (tableH / 5));
            ctx.lineTo(wallX + 3, tableY + 16 + i * (tableH / 5));
            ctx.stroke();
        }

        // Spring
        const springStartX = wallX + wallW;
        const blockCX = equilibX + x;
        const springEndX = blockCX - blockW / 2;
        const springY = tableY + tableH * 0.35;
        const springLen = Math.max(10, springEndX - springStartX);
        const coils = 12;
        const coilW = springLen / coils;
        const coilH = (12 + (s.k - 10) / 490 * 12) * scale;

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = (3 + (s.k - 10) / 490 * 3.5) * scale;
        ctx.beginPath();
        ctx.moveTo(springStartX, springY);
        for (let i = 0; i < coils; i++) {
            const cx1 = springStartX + (i + 0.25) * coilW;
            const cx2 = springStartX + (i + 0.75) * coilW;
            ctx.lineTo(cx1, springY - coilH);
            ctx.lineTo(cx2, springY + coilH);
        }
        ctx.lineTo(springEndX, springY);
        ctx.stroke();

        // Block
        const blockX = blockCX - blockW / 2;
        const blockY = tableY + 3;
        const massNorm = (s.mass - 0.1) / 4.9;
        const bR = Math.round(37 + massNorm * 150);
        const bG = Math.round(99 + massNorm * 40);
        const bB = Math.round(235 - massNorm * 100);
        ctx.fillStyle = `rgb(${bR},${bG},${bB})`;
        roundRect(ctx, blockX, blockY, blockW, blockH, 6); ctx.fill();
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
        roundRect(ctx, blockX, blockY, blockW, blockH, 6); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = `bold ${fs(14)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText(`${s.mass.toFixed(1)}kg`, blockCX, blockY + blockH / 2 + 5);

        // Velocity vector (green)
        const vArrowScale = W * 0.08;
        const vScale = vMax > 0 ? (v_val / vMax) * vArrowScale : 0;
        if (Math.abs(vScale) > 3) {
            ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 4 * scale;
            ctx.beginPath(); ctx.moveTo(blockCX, blockY - 12); ctx.lineTo(blockCX + vScale, blockY - 12); ctx.stroke();
            const dir = vScale > 0 ? 1 : -1;
            ctx.fillStyle = '#16a34a'; ctx.beginPath();
            ctx.moveTo(blockCX + vScale + dir * 12 * scale, blockY - 12);
            ctx.lineTo(blockCX + vScale - dir * 5 * scale, blockY - 19 * scale);
            ctx.lineTo(blockCX + vScale - dir * 5 * scale, blockY - 5 * scale);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#16a34a'; ctx.font = `bold ${fs(14)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('v', blockCX + vScale / 2, blockY - 25);
        }

        // Acceleration vector (amber)
        const aArrowScale = W * 0.08;
        const aScale = aMax > 0 ? (a_val / aMax) * aArrowScale : 0;
        if (Math.abs(aScale) > 3) {
            ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3.5 * scale;
            ctx.beginPath(); ctx.moveTo(blockCX, blockY + blockH + 15); ctx.lineTo(blockCX + aScale, blockY + blockH + 15); ctx.stroke();
            const dir2 = aScale > 0 ? 1 : -1;
            ctx.fillStyle = '#d97706'; ctx.beginPath();
            ctx.moveTo(blockCX + aScale + dir2 * 11 * scale, blockY + blockH + 15);
            ctx.lineTo(blockCX + aScale - dir2 * 5 * scale, blockY + blockH + 9 * scale);
            ctx.lineTo(blockCX + aScale - dir2 * 5 * scale, blockY + blockH + 21 * scale);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#d97706'; ctx.font = `bold ${fs(14)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('a', blockCX + aScale / 2, blockY + blockH + 34);
        }

        // Equilibrium line
        ctx.strokeStyle = 'rgba(15,23,42,0.2)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(equilibX, tableY - 15); ctx.lineTo(equilibX, tableY + tableH + 15); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('MEAN POSITION (x = 0)', equilibX, tableY + tableH + pad * 1.5);

        // Formula
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(15)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('F = -kx | x(t) = A cos(ωt)', wallX, topH - pad * 0.3);

        // ═══════════════════════════════════════════
        // BOTTOM HALF: Graphs + Info
        // ═══════════════════════════════════════════
        const bottomY = topH + pad * 1.5;
        const bottomH = H - bottomY - pad;

        // Left: 3 sync graphs
        const graphAreaW = W * 0.52;
        const graphX = pad;
        const graphGap = pad * 0.5;
        const singleGH = (bottomH - graphGap * 2) / 3;
        const graphs = [
            { label: 'DISPLACEMENT x(t)', color: '#2563eb', key: 'x' as const },
            { label: 'VELOCITY v(t)', color: '#16a34a', key: 'v' as const },
            { label: 'ACCELERATION a(t)', color: '#d97706', key: 'a' as const },
        ];

        graphs.forEach((g, idx) => {
            const gy = bottomY + idx * (singleGH + graphGap);
            ctx.fillStyle = '#ffffff';
            roundRect(ctx, graphX, gy, graphAreaW, singleGH, 8); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
            roundRect(ctx, graphX, gy, graphAreaW, singleGH, 8); ctx.stroke();

            // Center line
            ctx.strokeStyle = 'rgba(15,23,42,0.08)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(graphX, gy + singleGH / 2); ctx.lineTo(graphX + graphAreaW, gy + singleGH / 2); ctx.stroke();

            // Label
            ctx.fillStyle = g.color; ctx.font = `bold ${fs(11)}px monospace`; ctx.textAlign = 'left';
            ctx.fillText(g.label, graphX + 10, gy + fs(12) + 4);

            // Data
            const gd = graphRef.current;
            if (gd.length > 1) {
                ctx.strokeStyle = g.color; ctx.lineWidth = 3;
                ctx.beginPath();
                gd.forEach((d, i) => {
                    const px = graphX + (i / (gd.length - 1)) * graphAreaW;
                    const py = gy + singleGH / 2 - d[g.key] * (singleGH / 2 - 6);
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                });
                ctx.stroke();
            }
        });

        // Right: Info + Energy bars
        const rightX = graphX + graphAreaW + pad;
        const rightW = W - rightX - pad;

        // Info card
        const infoH = bottomH * 0.42;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, rightX, bottomY, rightW, infoH, 12); ctx.fill();
        ctx.strokeStyle = '#2563eb40'; ctx.lineWidth = 2;
        roundRect(ctx, rightX, bottomY, rightW, infoH, 12); ctx.stroke();

        ctx.fillStyle = '#2563eb'; ctx.font = `bold ${fs(22)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText(`T = ${T_period.toFixed(3)}s`, rightX + rightW / 2, bottomY + infoH * 0.28);
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(11)}px sans-serif`;
        ctx.fillText('T = 2π√(m/k)', rightX + rightW / 2, bottomY + infoH * 0.5);
        ctx.fillStyle = '#1e293b'; ctx.font = `bold ${fs(11)}px sans-serif`;
        ctx.fillText(`f=${freq.toFixed(2)}Hz ω=${omega.toFixed(1)}`, rightX + rightW / 2, bottomY + infoH * 0.75);

        // Energy bars
        const ebY = bottomY + infoH + pad * 0.8;
        const ebH = bottomH - infoH - pad * 0.8;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, rightX, ebY, rightW, ebH, 12); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, rightX, ebY, rightW, ebH, 12); ctx.stroke();

        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(13)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('ENERGY', rightX + rightW / 2, ebY + pad * 1.2);

        const barW2 = Math.min(rightW * 0.22, 60);
        const barGap = Math.min(barW2 * 0.4, 20);
        const barMaxH2 = ebH - pad * 5.5;
        const barBtm = ebY + ebH - pad * 1.8;
        const KE_frac = Math.pow(Math.sin(omega * s.time), 2);
        const PE_frac = Math.pow(Math.cos(omega * s.time), 2);
        const bars_data = [
            { label: 'KE', val: KE_frac, color: '#16a34a' },
            { label: 'PE', val: PE_frac, color: '#dc2626' },
            { label: 'TOT', val: 1.0, color: '#d97706' },
        ];
        const totalBarsW = bars_data.length * barW2 + (bars_data.length - 1) * barGap;
        const barsStartX = rightX + (rightW - totalBarsW) / 2;

        bars_data.forEach((b, i) => {
            const bx = barsStartX + i * (barW2 + barGap);
            const fh = b.val * barMaxH2;
            ctx.fillStyle = '#f8fafc'; roundRect(ctx, bx, barBtm - barMaxH2, barW2, barMaxH2, 5); ctx.fill();
            if (fh > 2) { 
                ctx.fillStyle = b.color; 
                roundRect(ctx, bx + 1, barBtm - fh, barW2 - 2, fh, 5); ctx.fill(); 
            }
            ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(11)}px monospace`; ctx.textAlign = 'center';
            ctx.fillText(`${(b.val * 100).toFixed(0)}%`, bx + barW2 / 2, barBtm - fh - 8);
            ctx.fillStyle = b.color; ctx.font = `bold ${fs(11)}px sans-serif`;
            ctx.fillText(b.label, bx + barW2 / 2, barBtm + fs(12) + 4);
        });

        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(20)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('Simple Harmonic Motion (SHM) Simulation', pad, pad * 1.3);

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const handleReset = () => {
        setMass(1.0); setSpringK(100); setAmplitude(60); setRunning(true);
        stateRef.current = { mass: 1.0, k: 100, A: 60, running: true, time: 0 };
        graphRef.current = [];
    };

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-2 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>⚖️ Block Mass</span>
                        <span className="text-blue-700 font-mono text-base md:text-lg bg-blue-50 border border-blue-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{mass.toFixed(1)} kg</span>
                    </label>
                    <input type="range" min="0.1" max="5" step="0.1" value={mass}
                        onChange={(e) => { setMass(Number(e.target.value)); stateRef.current.time = 0; graphRef.current = []; }}
                        className="w-full accent-blue-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🔩 Spring k</span>
                        <span className="text-violet-700 font-mono text-base md:text-lg bg-violet-50 border border-violet-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{Math.round(springK)} N/m</span>
                    </label>
                    <input type="range" min="10" max="500" step="5" value={springK}
                        onChange={(e) => { setSpringK(Number(e.target.value)); stateRef.current.time = 0; graphRef.current = []; }}
                        className="w-full accent-violet-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>📏 Amplitude</span>
                        <span className="text-red-700 font-mono text-base md:text-lg bg-red-50 border border-red-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{Math.round(amplitude)} px</span>
                    </label>
                    <input type="range" min="10" max="120" step="5" value={amplitude}
                        onChange={(e) => { setAmplitude(Number(e.target.value)); stateRef.current.time = 0; graphRef.current = []; }}
                        className="w-full accent-red-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-center mt-1 md:mt-2">
                <button onClick={() => setRunning(!running)}
                    className={`w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 rounded-xl border font-bold text-sm md:text-base transition-all shadow-md active:scale-95 ${running
                        ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        : 'bg-emerald-600 text-white border-emerald-500 shadow-lg'}`}>
                    {running ? <><Pause size={20} /> PAUSE</> : <><Play size={20} /> RESUME</>}
                </button>
                <button onClick={handleReset}
                    className="w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-sm md:text-base shadow-sm active:scale-95">
                    <RotateCcw size={20} /> RESET ALL
                </button>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

export default SHMLab;
