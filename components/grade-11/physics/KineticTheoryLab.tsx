import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RotateCcw, Plus, Minus } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface KineticTheoryLabProps {
    topic: any;
    onExit: () => void;
}

function tempToSpeed(T: number) { return 1.0 + (T - 100) / 900 * 4.0; }

interface Molecule { x: number; y: number; vx: number; vy: number; }
interface Flash { x: number; y: number; t: number; wall: string; }

const KineticTheoryLab: React.FC<KineticTheoryLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);

    const [temperature, setTemperature] = useState(400);
    const [volFrac, setVolFrac] = useState(1.0);
    const [molCount, setMolCount] = useState(60);

    const stateRef = useRef({ T: 400, volFrac: 1.0, N: 60 });
    const molRef = useRef<Molecule[]>([]);
    const flashRef = useRef<Flash[]>([]);
    const pressureRef = useRef(0);
    const graphRef = useRef<{ t: number; P: number }[]>([]);
    const frameRef = useRef(0);
    const collCountRef = useRef(0);

    // Chamber bounds are now proportional — stored dynamically
    const chamberBoundsRef = useRef({ x: 30, w: 340, top: 60, bottom: 340 });

    useEffect(() => {
        stateRef.current.T = temperature;
        stateRef.current.volFrac = volFrac;
        stateRef.current.N = molCount;
        rescaleMols();
    }, [temperature, volFrac, molCount]);

    const initMols = useCallback((count: number, T: number) => {
        const speed = tempToSpeed(T);
        const mols: Molecule[] = [];
        const b = chamberBoundsRef.current;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sp = speed * (0.5 + Math.random());
            mols.push({
                x: b.x + 5 + Math.random() * (b.w - 10),
                y: b.top + 5 + Math.random() * (b.bottom - b.top - 10),
                vx: Math.cos(angle) * sp,
                vy: Math.sin(angle) * sp,
            });
        }
        return mols;
    }, []);

    const rescaleMols = useCallback(() => {
        const s = stateRef.current;
        const speed = tempToSpeed(s.T);
        const b = chamberBoundsRef.current;
        const mols = molRef.current;

        while (mols.length < s.N) {
            const angle = Math.random() * Math.PI * 2;
            const sp = speed * (0.5 + Math.random());
            mols.push({
                x: b.x + 5 + Math.random() * (b.w - 10),
                y: b.top + 5 + Math.random() * (b.bottom - b.top - 10),
                vx: Math.cos(angle) * sp,
                vy: Math.sin(angle) * sp,
            });
        }
        while (mols.length > s.N) mols.pop();

        mols.forEach(m => {
            const curSpeed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
            if (curSpeed > 0.1) {
                const ratio = speed / curSpeed;
                m.vx *= ratio * (0.7 + Math.random() * 0.6);
                m.vy *= ratio * (0.7 + Math.random() * 0.6);
            } else {
                const angle = Math.random() * Math.PI * 2;
                m.vx = Math.cos(angle) * speed;
                m.vy = Math.sin(angle) * speed;
            }
            m.x = Math.max(b.x + 3, Math.min(b.x + b.w - 3, m.x));
            m.y = Math.max(b.top + 3, Math.min(b.bottom - 3, m.y));
        });
    }, []);

    useEffect(() => {
        molRef.current = initMols(stateRef.current.N, stateRef.current.T);
    }, [initMols]);

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
        const mols = molRef.current;
        const flashes = flashRef.current;
        frameRef.current++;

        // Clear
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; // Soft White
        ctx.fillRect(0, 0, W, H);

        // DYNAMIC VIEWPORT SCALING (Laptop vs Smartboard)
        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

        const halfW = (W - pad * 3) / 2;

        // ─── MAIN PANEL: GAS CHAMBER ───
        const chamberPanelX = pad;
        const chamberPanelY = pad * 2.5;
        const chamberPanelW = W - pad * 2; // Full width instead of halfW
        const chamberPanelH = H - pad * 3.5;

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, chamberPanelX, chamberPanelY, chamberPanelW, chamberPanelH, 16); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, chamberPanelX, chamberPanelY, chamberPanelW, chamberPanelH, 16); ctx.stroke();

        // Title
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(14)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('EXPERIMENTAL GAS CHAMBER', chamberPanelX + chamberPanelW / 2, chamberPanelY + pad * 1.2);

        // Chamber bounds
        const chamberX = chamberPanelX + pad * 1.5;
        const chamberW = chamberPanelW - pad * 3;
        const chamberFullH = chamberPanelH - pad * 8;
        const chamberBottom = chamberPanelY + chamberPanelH - pad * 3.5;
        const chamberH = chamberFullH * s.volFrac;
        const chamberTop = chamberBottom - chamberH;

        chamberBoundsRef.current = { x: chamberX, w: chamberW, top: chamberTop, bottom: chamberBottom };

        // Chamber body
        ctx.fillStyle = 'rgba(241, 245, 249, 0.4)';
        ctx.fillRect(chamberX, chamberTop, chamberW, chamberH);
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
        ctx.strokeRect(chamberX, chamberTop, chamberW, chamberH);

        // Piston
        ctx.fillStyle = '#475569';
        roundRect(ctx, chamberX - 6, chamberTop - 15, chamberW + 12, 16, 5); ctx.fill();
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
        roundRect(ctx, chamberX - 6, chamberTop - 15, chamberW + 12, 16, 5); ctx.stroke();

        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(chamberX + chamberW / 2, chamberTop - 15);
        ctx.lineTo(chamberX + chamberW / 2, chamberPanelY + pad * 2.5);
        ctx.stroke();

        // ─── Simulate molecules ───
        let collisions = 0;
        const now_time = Date.now() * 0.001;

        mols.forEach(m => {
            m.x += m.vx; m.y += m.vy;
            if (m.x <= chamberX + 3) { m.x = chamberX + 3; m.vx = Math.abs(m.vx); collisions++; flashes.push({ x: chamberX, y: m.y, t: now_time, wall: 'left' }); }
            if (m.x >= chamberX + chamberW - 3) { m.x = chamberX + chamberW - 3; m.vx = -Math.abs(m.vx); collisions++; flashes.push({ x: chamberX + chamberW, y: m.y, t: now_time, wall: 'right' }); }
            if (m.y <= chamberTop + 4) { m.y = chamberTop + 4; m.vy = Math.abs(m.vy); collisions++; flashes.push({ x: m.x, y: chamberTop, t: now_time, wall: 'top' }); }
            if (m.y >= chamberBottom - 3) { m.y = chamberBottom - 3; m.vy = -Math.abs(m.vy); collisions++; flashes.push({ x: m.x, y: chamberBottom, t: now_time, wall: 'bottom' }); }
        });

        collCountRef.current += collisions;

        let sumV2 = 0;
        mols.forEach(m => { sumV2 += m.vx * m.vx + m.vy * m.vy; });
        const avgV2 = mols.length > 0 ? sumV2 / mols.length : 0;
        const rawP = (s.N * avgV2) / (chamberW * chamberH * s.volFrac || 1) * 500;
        pressureRef.current = pressureRef.current * 0.9 + rawP * 0.1;
        const P_val = pressureRef.current;

        if (frameRef.current % 10 === 0) {
            graphRef.current.push({ t: frameRef.current, P: P_val });
            if (graphRef.current.length > 100) graphRef.current.shift();
        }

        const current_now = Date.now() * 0.001;
        for (let i = flashes.length - 1; i >= 0; i--) {
            const age = current_now - flashes[i].t;
            if (age > 0.3) { flashes.splice(i, 1); continue; }
            const alpha = 1 - age / 0.3;
            const r = 4 + age * 30;
            ctx.fillStyle = `rgba(217, 119, 6, ${alpha * 0.7})`;
            ctx.beginPath(); ctx.arc(flashes[i].x, flashes[i].y, r, 0, Math.PI * 2); ctx.fill();
        }

        const tempNorm = Math.max(0, Math.min(1, (s.T - 100) / 900));
        const mR = Math.round(37 + tempNorm * 187), mB = Math.round(235 - tempNorm * 180);
        const molR = Math.max(4, Math.min(7, chamberW * 0.015));
        mols.forEach(m => {
            const speed_val = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
            const trailLen = Math.min(speed_val * 5, 15);
            if (trailLen > 1) {
                const ang = Math.atan2(-m.vy, -m.vx);
                ctx.strokeStyle = `rgba(${mR}, 80, ${mB}, 0.3)`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                ctx.lineTo(m.x + Math.cos(ang) * trailLen, m.y + Math.sin(ang) * trailLen);
                ctx.stroke();
            }
            ctx.fillStyle = `rgb(${mR}, 80, ${mB})`;
            ctx.beginPath(); ctx.arc(m.x, m.y, molR, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,0.7)`;
            ctx.beginPath(); ctx.arc(m.x - 0.8, m.y - 0.8, molR * 0.45, 0, Math.PI * 2); ctx.fill();
        });

        const thX = chamberX + chamberW - pad * 1.5, thY2 = chamberTop + 20;
        const thH = Math.min(70, chamberH - 40);
        if (thH > 15) {
            ctx.fillStyle = '#e2e8f0'; roundRect(ctx, thX, thY2, 11, thH, 4); ctx.fill();
            ctx.fillStyle = `rgb(${mR}, 50, ${mB})`;
            ctx.fillRect(thX + 2, thY2 + thH - tempNorm * thH, 7, tempNorm * thH);
            ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(13)}px monospace`; ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(s.T)}K`, thX + 5, thY2 - 8);
        }

        const fY = chamberBottom + pad * 0.8;
        const fH = chamberPanelY + chamberPanelH - fY - pad * 0.5;
        if (fH > 40) {
            ctx.fillStyle = '#f8fafc';
            roundRect(ctx, chamberX, fY, chamberW, fH, 12); ctx.fill();
            ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2;
            roundRect(ctx, chamberX, fY, chamberW, fH, 12); ctx.stroke();
            
            // Draw formula on the left
            ctx.fillStyle = '#d97706'; ctx.font = `bold ${fs(16)}px monospace`; ctx.textAlign = 'left';
            ctx.fillText('P = ⅓ (N/V) m ⟨v²⟩', chamberX + pad * 2, fY + fH * 0.45);
            ctx.fillStyle = '#475569'; ctx.font = `bold ${fs(12)}px sans-serif`;
            ctx.fillText('n = N/V (number density, m⁻³)', chamberX + pad * 2, fY + fH * 0.7);
            ctx.fillText('Average KE = 3/2 kᵦT', chamberX + pad * 2, fY + fH * 0.9);

            // Draw current stats on the right inside this bottom panel
            ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px monospace`; ctx.textAlign = 'right';
            ctx.fillText(`Relative Pressure: ${P_val.toFixed(2)}`, chamberX + chamberW - pad * 2, fY + fH * 0.45);
            ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(11)}px sans-serif`;
            ctx.fillText('(simulation units — actual P ∝ NkT/V)', chamberX + chamberW - pad * 2, fY + fH * 0.65);
            ctx.fillStyle = '#16a34a'; ctx.font = `bold ${fs(14)}px monospace`;
            ctx.fillText(`MOLS: ${s.N}`, chamberX + chamberW - pad * 2, fY + fH * 0.9);
        }

        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(18)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('Kinetic Theory: Pressure of an Ideal Gas', pad, pad * 1.3);

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        molRef.current = initMols(stateRef.current.N, stateRef.current.T);
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw, initMols]);

    const handleReset = () => {
        setTemperature(400); setVolFrac(1.0); setMolCount(60);
        graphRef.current = []; pressureRef.current = 0; collCountRef.current = 0;
        molRef.current = initMols(60, 400);
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
            <div className="grid grid-cols-3 gap-2 md:grid-cols-3 md:gap-4">
                <div className="bg-white rounded-xl p-2 md:p-4 text-center border border-slate-200 shadow-sm">
                    <div className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">Temp</div>
                    <div className="text-sm md:text-2xl font-bold text-red-600 font-mono tracking-tight">{Math.round(temperature)} K</div>
                </div>
                <div className="bg-white rounded-xl p-2 md:p-4 text-center border border-slate-200 shadow-sm">
                    <div className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">Mols</div>
                    <div className="text-sm md:text-2xl font-bold text-emerald-600 font-mono tracking-tight">{molCount}</div>
                </div>
                <div className="bg-white rounded-xl p-2 md:p-4 text-center border border-slate-200 shadow-sm">
                    <div className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">Relative Pressure</div>
                    <div className="text-sm md:text-2xl font-bold text-amber-600 font-mono tracking-tight">{pressureRef.current.toFixed(2)}</div>
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-1 md:mt-2">
                <div className="space-y-2 md:space-y-4 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🔥 Temperature</span>
                        <span className="text-red-700 font-mono text-base md:text-lg bg-red-50 border border-red-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{Math.round(temperature)} K</span>
                    </label>
                    <input type="range" min="100" max="1000" step="10" value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="w-full accent-red-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[9px] md:text-xs font-bold text-slate-400 uppercase">
                        <span>Min (100 K)</span><span>Max (1000 K)</span>
                    </div>
                </div>
                <div className="space-y-2 md:space-y-4 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>📦 Volume</span>
                        <span className="text-violet-700 font-mono text-base md:text-lg bg-violet-50 border border-violet-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{(volFrac * 100).toFixed(0)}%</span>
                    </label>
                    <input type="range" min="30" max="100" step="5"
                        value={volFrac * 100}
                        onChange={(e) => setVolFrac(Number(e.target.value) / 100)}
                        className="w-full accent-violet-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[9px] md:text-xs font-bold text-slate-400 uppercase">
                        <span>30%</span><span>100%</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center mt-2">
                <div className="w-full md:flex-1 flex items-center gap-3 bg-white p-2 md:p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-xs md:text-base font-bold text-slate-600 ml-2">Molecules:</span>
                    <button onClick={() => setMolCount(Math.max(20, molCount - 20))}
                        className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-slate-50 hover:bg-red-50 text-red-600 rounded-xl border border-slate-100 hover:border-red-500 transition-all shadow-sm active:scale-90">
                        <Minus size={20} />
                    </button>
                    <span className="text-xl md:text-2xl font-bold text-emerald-600 font-mono w-12 md:w-16 text-center">{molCount}</span>
                    <button onClick={() => setMolCount(Math.min(200, molCount + 20))}
                        className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-slate-50 hover:bg-emerald-50 text-emerald-600 rounded-xl border border-slate-100 hover:border-emerald-500 transition-all shadow-sm active:scale-90">
                        <Plus size={20} />
                    </button>
                </div>
                <button onClick={handleReset}
                    className="flex items-center justify-center gap-2 md:gap-3 w-full md:w-auto px-6 md:px-10 py-3 md:py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-xs md:text-base shadow-sm active:scale-95">
                    <RotateCcw size={18} className="md:w-5 md:h-5" /> RESET SYSTEM
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

export default KineticTheoryLab;
