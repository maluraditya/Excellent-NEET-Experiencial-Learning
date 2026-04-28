import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface FluidDynamicsLabProps {
    topic: any;
    onExit: () => void;
}

const FluidDynamicsLab: React.FC<FluidDynamicsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [flowRate, setFlowRate] = useState(50);
    const [constrictionArea, setConstrictionArea] = useState(100);

    const A1_val = 100;
    const rho_val = 1000;
    const v1_val = flowRate / A1_val;
    const v2_val = flowRate / constrictionArea;
    const deltaP_val = 0.5 * rho_val * (v2_val * v2_val - v1_val * v1_val);
    const P1_display_val = 200000;
    const P2_display_val = P1_display_val - deltaP_val;
    const KE1_val = 0.5 * rho_val * v1_val * v1_val;
    const KE2_val = 0.5 * rho_val * v2_val * v2_val;

    const particlesRef = useRef<{ x: number, y: number, speedMultiplier: number }[]>([]);
    const animRef = useRef<number>(0);
    const lastTimeRef = useRef(performance.now());

    // Dynamic resize
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

    // Init particles
    useEffect(() => {
        particlesRef.current = Array.from({ length: 150 }).map(() => ({
            x: Math.random() * 800,
            y: (Math.random() - 0.5) * A1_val,
            speedMultiplier: 0.8 + Math.random() * 0.4
        }));
    }, [A1_val]);

    const draw = useCallback((time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }

        const dt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; // Soft White
        ctx.fillRect(0, 0, W, H);

        // DYNAMIC VIEWPORT SCALING (Laptop vs Smartboard)
        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

        const pipeFullR_val = H * 0.2;
        const panelMinH_val = Math.max(96 * scale, H * 0.22);
        const titleY_val = pad * 1.6;
        const titleFontSize_val = fs(18);
        const titleBandBottom_val = titleY_val + titleFontSize_val + pad * 1.4;
        const manoTargetH_val = Math.min(H * 0.18, Math.max(56 * scale, H * 0.14));
        const midlineLowerBound_val = titleBandBottom_val + manoTargetH_val + pipeFullR_val + pad * 0.8;
        const midlineUpperBound_val = Math.max(
            midlineLowerBound_val,
            H - panelMinH_val - pipeFullR_val - pad * 2.6
        );
        const midlineY = Math.max(midlineLowerBound_val, Math.min(H * 0.36, midlineUpperBound_val));
        const panelY_val = Math.min(
            H - panelMinH_val - pad,
            Math.max(H * 0.62, midlineY + pipeFullR_val + pad * 1.4)
        );
        const panelH_val = H - panelY_val - pad;

        const getRadiusAtX_val = (x: number) => {
            const normX = x / W;
            const startNarrow = 0.35, endNarrow = 0.45;
            const transLen = 0.12;

            if (normX < startNarrow - transLen) return pipeFullR_val;
            if (normX > endNarrow + transLen) return pipeFullR_val;
            if (normX >= startNarrow && normX <= endNarrow) return (constrictionArea / A1_val) * pipeFullR_val;

            if (normX >= startNarrow - transLen && normX < startNarrow) {
                const t = (normX - (startNarrow - transLen)) / transLen;
                const st = t * t * (3 - 2 * t);
                return pipeFullR_val * (1 - st) + (constrictionArea / A1_val) * pipeFullR_val * st;
            }
            if (normX > endNarrow && normX <= endNarrow + transLen) {
                const t = (normX - endNarrow) / transLen;
                const st = t * t * (3 - 2 * t);
                return (constrictionArea / A1_val) * pipeFullR_val * (1 - st) + pipeFullR_val * st;
            }
            return pipeFullR_val;
        };

        const getVelocityAtX_val = (x: number) => {
            const rx = getRadiusAtX_val(x);
            return (pipeFullR_val * v1_val) / rx;
        };

        // Pipe Wall
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let x = 0; x <= W; x += 5) ctx.lineTo(x, midlineY - getRadiusAtX_val(x));
        for (let x = W; x >= 0; x -= 5) ctx.lineTo(x, midlineY + getRadiusAtX_val(x));
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4 * scale;
        ctx.beginPath(); for (let x = 0; x <= W; x += 5) ctx.lineTo(x, midlineY - getRadiusAtX_val(x)); ctx.stroke();
        ctx.beginPath(); for (let x = 0; x <= W; x += 5) ctx.lineTo(x, midlineY + getRadiusAtX_val(x)); ctx.stroke();

        // Particles
        if (isPlaying) {
            const particles = particlesRef.current;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const vel = getVelocityAtX_val(p.x);
                p.x += vel * p.speedMultiplier * dt * W * 0.15;
                if (p.x > W) { p.x = -20; p.y = (Math.random() - 0.5) * A1_val; }
                const currentR = getRadiusAtX_val(p.x);
                const actualY = midlineY + (p.y / (A1_val / 2)) * currentR;
                ctx.beginPath();
                ctx.moveTo(p.x, actualY); ctx.lineTo(p.x + Math.max(14, vel * 6) * scale, actualY);
                ctx.strokeStyle = `rgba(37, 99, 235, ${Math.min(1, 0.4 + (vel / 25) * 0.6)})`;
                ctx.lineWidth = (2.5 + (vel / 25) * 2.5) * scale;
                ctx.stroke();
            }
        }

        // Manometers
        const drawMano_val = (normX: number, label: string, pVal: number) => {
            const x = normX * W;
            const rx = getRadiusAtX_val(x);
            const topY_val = midlineY - rx;
            const manoTopY_val = titleBandBottom_val + pad * 0.2;
            const manoH_val = Math.max(0, topY_val - manoTopY_val);
            const pNorm_val = Math.min(1, pVal / P1_display_val);
            const waterLevel_val = manoH_val * pNorm_val;

            ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 14 * scale, manoTopY_val, 28 * scale, manoH_val);
            ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5 * scale;
            ctx.strokeRect(x - 14 * scale, manoTopY_val, 28 * scale, manoH_val);

            ctx.fillStyle = '#2563eb'; ctx.fillRect(x - 11 * scale, topY_val - waterLevel_val, 22 * scale, waterLevel_val);
            ctx.fillStyle = '#1e293b'; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(label.toUpperCase(), x, manoTopY_val - 10 * scale);

            const pressureText_val = `${(pVal / 1000).toFixed(1)} kPa`;
            const pressureFontSize_val = fs(13);
            ctx.font = `bold ${pressureFontSize_val}px monospace`;
            const textMetrics_val = ctx.measureText(pressureText_val);
            const badgePadX_val = 8 * scale;
            const badgeH_val = pressureFontSize_val + 10 * scale;
            const badgeW_val = textMetrics_val.width + badgePadX_val * 2;
            const preferredBadgeTop_val = topY_val - waterLevel_val - badgeH_val - 8 * scale;
            const badgeY_val = Math.max(titleBandBottom_val + pad * 0.35, preferredBadgeTop_val);

            ctx.fillStyle = 'rgba(255,255,255,0.96)';
            roundRect(ctx, x - badgeW_val / 2, badgeY_val, badgeW_val, badgeH_val, 8 * scale);
            ctx.fill();
            ctx.strokeStyle = '#93c5fd';
            ctx.lineWidth = 1.5 * scale;
            roundRect(ctx, x - badgeW_val / 2, badgeY_val, badgeW_val, badgeH_val, 8 * scale);
            ctx.stroke();

            ctx.fillStyle = '#1d4ed8';
            ctx.fillText(pressureText_val, x, badgeY_val + badgeH_val * 0.72);
        };
        drawMano_val(0.2, 'P₁', P1_display_val);
        drawMano_val(0.42, 'P₂', P2_display_val);

        // Stats Panels (Bottom)
        const colW_val = (W - pad * 3) / 2;
        const maxKE_val = 0.5 * rho_val * (25) ** 2;

        const drawStats_val = (x: number, title: string, ke: number, pr: number, color: string) => {
            ctx.fillStyle = '#ffffff'; roundRect(ctx, x, panelY_val, colW_val, panelH_val, 16); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5; roundRect(ctx, x, panelY_val, colW_val, panelH_val, 16); ctx.stroke();
            ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(13)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(title.toUpperCase(), x + colW_val / 2, panelY_val + pad * 1.2);

            const barY_val = panelY_val + pad * 2.8, barH_val = panelH_val - pad * 5.5, bw_val = colW_val * 0.18;
            const drawBar_val = (bx: number, val: number, max: number, bCol: string, bLab: string) => {
                ctx.fillStyle = '#f8fafc'; roundRect(ctx, bx, barY_val, bw_val, barH_val, 6); ctx.fill();
                const hVal = (val / max) * barH_val;
                ctx.fillStyle = bCol; roundRect(ctx, bx + 1, barY_val + barH_val - hVal, bw_val - 2, hVal, 6); ctx.fill();
                ctx.fillStyle = '#475569'; ctx.font = `bold ${fs(10)}px sans-serif`;
                ctx.fillText(bLab.toUpperCase(), bx + bw_val / 2, barY_val + barH_val + fs(12));
            };
            drawBar_val(x + colW_val * 0.22, ke, maxKE_val, '#d97706', 'Vel E');
            drawBar_val(x + colW_val * 0.6, pr, P1_display_val * 1.2, '#2563eb', 'Press');
        };
        drawStats_val(pad, 'Inlet (A₁)', KE1_val, P1_display_val, '#64748b');
        drawStats_val(pad * 2 + colW_val, 'Narrow (A₂)', KE2_val, P2_display_val, '#2563eb');

        // Header Title
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${titleFontSize_val}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('Fluid Mechanics: Bernoulli\'s Principle', W / 2, titleY_val, W * 0.58);

        animRef.current = requestAnimationFrame(draw);
    }, [isPlaying, constrictionArea, flowRate, A1_val, v1_val, v2_val, KE1_val, KE2_val, P1_display_val, P2_display_val]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, [draw]);

    const handleReset = () => {
        setFlowRate(50);
        setConstrictionArea(100);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🌊 Flow Rate</span>
                        <span className="text-amber-700 font-mono text-base md:text-lg bg-amber-50 border border-amber-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{flowRate} u/s</span>
                    </label>
                    <input type="range" min="10" max="500" step="10" value={flowRate}
                        onChange={(e) => setFlowRate(Number(e.target.value))}
                        className="w-full accent-amber-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>Low</span><span>High</span>
                    </div>
                </div>
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>📏 Area (A₂)</span>
                        <span className="text-blue-700 font-mono text-base md:text-lg bg-blue-50 border border-blue-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{constrictionArea} u²</span>
                    </label>
                    <input type="range" min="20" max="100" step="5" value={constrictionArea}
                        onChange={(e) => setConstrictionArea(Number(e.target.value))}
                        className="w-full accent-blue-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>Narrow</span><span>Normal</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-center mt-1 md:mt-2">
                <button onClick={() => setIsPlaying(!isPlaying)}
                    className={`w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-12 py-3 md:py-4 rounded-xl border font-bold text-sm md:text-base transition-all shadow-md active:scale-95 ${isPlaying ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50' : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-lg'}`}>
                    {isPlaying ? <Pause size={22} /> : <Play size={22} />} {isPlaying ? 'PAUSE' : 'START'}
                </button>
                <button onClick={handleReset}
                    className="w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-12 py-3 md:py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-sm md:text-base shadow-sm active:scale-95">
                    <RotateCcw size={22} /> RESET ALL
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

export default FluidDynamicsLab;
