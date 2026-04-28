import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface HydraulicBrakeLabProps {
    topic: any;
    onExit: () => void;
}

const HydraulicBrakeLab: React.FC<HydraulicBrakeLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const [pedalDown, setPedalDown] = useState(false);

    const [force1, setForce1] = useState(100);
    const [area1, setArea1] = useState(10);
    const [area2, setArea2] = useState(100);
    const [fluidType, setFluidType] = useState<'liquid' | 'gas'>('liquid');

    const pedalRef = useRef(false);
    useEffect(() => { pedalRef.current = pedalDown; }, [pedalDown]);

    const pressure_val = force1 / (area1 * 1e-4);
    const force2_val = pressure_val * (area2 * 1e-4);
    const mechanicalAdv_val = area2 / area1;

    const stateRef = useRef({
        d1: 0, d2: 0, discAngle: 0, discSpeed: 3, fluidPulse: 0, sparkLife: 0,
    });

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

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }

        const s = stateRef.current;
        const isPedal = pedalRef.current;
        const isLiquid = fluidType === 'liquid';

        // Physics Update
        const targetD1 = isPedal ? (isLiquid ? 0.8 : 1.0) : 0;
        s.d1 += (targetD1 - s.d1) * 0.1;
        // Slave piston directly mirrors master piston in liquid (visually closes the gap)
        if (isLiquid) {
            const targetD2 = isPedal ? 1.0 : 0;
            s.d2 += (targetD2 - s.d2) * 0.08;
        } else {
            // Gas: compressible — piston moves most of the way but can't quite reach disc
            const targetD2 = isPedal ? 0.70 : 0;
            s.d2 += (targetD2 - s.d2) * 0.06;
        }

        if (isPedal) s.fluidPulse = Math.min(1, s.fluidPulse + 0.04);
        else s.fluidPulse = Math.max(0, s.fluidPulse - 0.06);

        // Only brake when pad is actually contacting the disc (d2 > 0.92)
        const padContact = isLiquid && s.d2 > 0.92;
        const brakingForce = padContact && isPedal ? force2_val * 0.00005 : 0;
        s.discSpeed = Math.max(0, Math.min(3, s.discSpeed - brakingForce + (isPedal ? 0 : 0.02)));
        s.discAngle = (s.discAngle + s.discSpeed) % 360;

        if (padContact && isPedal && s.discSpeed > 0.3) s.sparkLife = 1;
        else s.sparkLife *= 0.9;

        // Draw
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; // Soft White
        ctx.fillRect(0, 0, W, H);

        // DYNAMIC VIEWPORT SCALING (Laptop vs Smartboard)
        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs_val = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad_val = Math.min(W * 0.03, H * 0.035, scale * 24);
        const headerSafeLeft_val = Math.max(pad_val, 170 * scale);
        const headerSafeRight_val = pad_val;
        const headerCenterX_val = headerSafeLeft_val + (W - headerSafeLeft_val - headerSafeRight_val) * 0.5;
        const headerMaxW_val = Math.max(140, W - headerSafeLeft_val - headerSafeRight_val);

        const midlineY = H * 0.42;
        const masterX_pos = pad_val * 3, masterW_val = W * 0.20;

        // ─── AREA-PROPORTIONAL CYLINDER HEIGHTS ───
        // Scale cylinder heights based on area values
        // sqrt(area) gives a diameter-like visual scaling
        const a1Norm = Math.sqrt(area1) / Math.sqrt(50); // normalise to max area1=50
        const a2Norm = Math.sqrt(area2) / Math.sqrt(500); // normalise to max area2=500
        const minCylH = H * 0.08;
        const maxMasterH = H * 0.20;
        const maxWheelH = H * 0.32;
        const masterH_val = minCylH + a1Norm * (maxMasterH - minCylH);
        const wheelH_val = minCylH + a2Norm * (maxWheelH - minCylH);

        const wheelX_pos = W - pad_val * 3 - W * 0.22 - W * 0.08;

        // --- MASTER CYLINDER ---
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3 * scale;
        roundRect(ctx, masterX_pos, midlineY - masterH_val * 0.5, masterW_val, masterH_val, 12); ctx.fill(); ctx.stroke();

        const fluidCol_val = isLiquid ? `rgba(16, 185, 129, ${0.4 + s.fluidPulse * 0.4})` : `rgba(217, 119, 6, ${0.3 + s.fluidPulse * 0.3})`;
        const p1Travel_val = s.d1 * (masterW_val * 0.65);
        ctx.fillStyle = fluidCol_val;
        ctx.fillRect(masterX_pos + 14 * scale, midlineY - masterH_val * 0.5 + 8 * scale, masterW_val - 24 * scale - p1Travel_val, masterH_val - 16 * scale);

        ctx.fillStyle = '#475569'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2 * scale;
        roundRect(ctx, masterX_pos + 10 * scale + p1Travel_val, midlineY - masterH_val * 0.5 + 4 * scale, 14 * scale, masterH_val * 0.95, 5); ctx.fill(); ctx.stroke();

        // Pedal
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 8 * scale;
        ctx.beginPath(); ctx.moveTo(masterX_pos + 10 * scale + p1Travel_val, midlineY); ctx.lineTo(masterX_pos - pad_val * 2, midlineY); ctx.stroke();
        ctx.save(); ctx.translate(masterX_pos - pad_val * 2, midlineY - pad_val * 2.5); ctx.rotate(s.d1 * 0.4);
        ctx.fillStyle = isPedal ? '#dc2626' : '#64748b'; roundRect(ctx, -10 * scale, -6 * scale, 20 * scale, pad_val * 5, 6); ctx.fill();
        ctx.restore();

        // --- CONNECTING PIPE ---
        const pipeStart_val = masterX_pos + masterW_val, pipeEnd_val = wheelX_pos;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(pipeStart_val, midlineY - 10 * scale, pipeEnd_val - pipeStart_val, 20 * scale);
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2 * scale; ctx.strokeRect(pipeStart_val, midlineY - 10 * scale, pipeEnd_val - pipeStart_val, 20 * scale);
        ctx.fillStyle = fluidCol_val; ctx.fillRect(pipeStart_val, midlineY - 7 * scale, pipeEnd_val - pipeStart_val, 14 * scale);

        // Pressure Gauge
        const gx_val = (pipeStart_val + pipeEnd_val) * 0.5, gy_val = midlineY - pad_val * 5;
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(gx_val, gy_val, pad_val * 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 3 * scale; ctx.stroke();

        const gAng_val = -Math.PI * 0.75 + (Math.min(pressure_val, 50) / 50) * Math.PI * 1.5;
        ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 4 * scale;
        ctx.beginPath(); ctx.moveTo(gx_val, gy_val); ctx.lineTo(gx_val + Math.cos(gAng_val) * pad_val * 1.6, gy_val + Math.sin(gAng_val) * pad_val * 1.6); ctx.stroke();

        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs_val(10)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('PRESSURE', gx_val, gy_val - pad_val * 0.8);
        ctx.fillStyle = '#2563eb'; ctx.font = `bold ${fs_val(16)}px monospace`;
        ctx.fillText(pressure_val.toFixed(1), gx_val, gy_val + pad_val * 3);

        // --- WHEEL CYLINDER (area-proportional height) ---
        const wheelW = W * 0.20;
        ctx.fillStyle = '#ffffff'; roundRect(ctx, wheelX_pos, midlineY - wheelH_val * 0.5, wheelW, wheelH_val, 12); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3 * scale; ctx.stroke();

        // ─── DISC is FIXED at the right edge of the wheel cylinder ───
        const discR_val = Math.max(wheelH_val * 0.6, H * 0.10);
        const padW = 10 * scale;
        const pistonW = 14 * scale;
        const discCX_val = wheelX_pos + wheelW + padW + discR_val + 4 * scale;
        const discCY_val = midlineY;
        const discLeftEdge = discCX_val - discR_val;

        // Piston travel: at rest, piston sits at left of cylinder.
        // At max brake, piston + pad reach the disc.
        const maxGap = discLeftEdge - padW - pistonW - (wheelX_pos + 6 * scale);
        const fluidBaseW = 20 * scale;
        const current_p2Travel = s.d2 * Math.max(0, maxGap - fluidBaseW);

        // Fluid pushing from the left
        const fluidCurrentW = fluidBaseW + current_p2Travel;
        ctx.fillStyle = fluidCol_val;
        ctx.fillRect(wheelX_pos + 6 * scale, midlineY - wheelH_val * 0.5 + 6 * scale, fluidCurrentW, wheelH_val - 12 * scale);

        // Piston
        const pistonX = wheelX_pos + 6 * scale + fluidCurrentW;
        ctx.fillStyle = '#475569'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2 * scale;
        roundRect(ctx, pistonX, midlineY - wheelH_val * 0.5 + 4 * scale, pistonW, wheelH_val * 0.95, 5); ctx.fill(); ctx.stroke();

        // Brake Pad
        const padX = pistonX + pistonW;
        ctx.fillStyle = '#7c2d12';
        roundRect(ctx, padX, midlineY - wheelH_val * 0.4, padW, wheelH_val * 0.8, 3); ctx.fill();

        ctx.save(); ctx.translate(discCX_val, discCY_val); ctx.rotate(s.discAngle * Math.PI / 180);
        ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(0, 0, discR_val, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 5 * scale; ctx.stroke();
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(Math.cos(i * Math.PI / 3) * discR_val * 0.7, Math.sin(i * Math.PI / 3) * discR_val * 0.7, 7 * scale, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        // Friction Sparks Animation
        if (s.sparkLife > 0.1 && isLiquid && isPedal && s.d2 > 0.001) {
            for (let i = 0; i < 8; i++) {
                ctx.fillStyle = `rgba(217, 119, 6, ${s.sparkLife * (Math.random() * 0.5 + 0.5)})`;
                ctx.beginPath(); ctx.arc(padX + padW + Math.random() * 15 * scale, midlineY - 30 * scale + Math.random() * 60 * scale, 3 * scale, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Stats Footer Metrics
        const footerY_val = H * 0.76, footerH_val = H - footerY_val - pad_val;
        if (footerH_val > 25) {
            ctx.fillStyle = '#ffffff'; roundRect(ctx, pad_val, footerY_val, W - pad_val * 2, footerH_val, 18); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2; ctx.stroke();

            const colW_val = (W - pad_val * 2) / 5;
            const metrics_data = [
                { l: 'INPUT F₁', v: `${force1}N`, c: '#d97706' },
                { l: 'OUTPUT F₂', v: `${force2_val.toFixed(0)}N`, c: '#16a34a' },
                { l: 'MA (A₂/A₁)', v: `×${mechanicalAdv_val.toFixed(1)}`, c: '#7c3aed' },
                { l: 'PRESSURE', v: `${pressure_val.toFixed(1)}Pa`, c: '#2563eb' },
                { l: 'STATE', v: isPedal ? (isLiquid ? 'BRAKING' : 'FAILURE') : 'READY', c: isPedal ? (isLiquid ? '#16a34a' : '#dc2626') : '#94a3b8' }
            ];
            metrics_data.forEach((st, i) => {
                ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs_val(9)}px sans-serif`; ctx.textAlign = 'center';
                ctx.fillText(st.l, pad_val + i * colW_val + colW_val * 0.5, footerY_val + footerH_val * 0.4);
                ctx.fillStyle = st.c; ctx.font = `bold ${fs_val(16)}px monospace`;
                ctx.fillText(st.v, pad_val + i * colW_val + colW_val * 0.5, footerY_val + footerH_val * 0.8);
            });
        }

        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs_val(18)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('Hydraulic Systems: Pascal\'s Law & Braking', headerCenterX_val, pad_val * 1.3, headerMaxW_val);
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs_val(12)}px sans-serif`;
        ctx.fillText('HOLD ON CANVAS TO APPLY BRAKE', headerCenterX_val, pad_val * 1.3 + fs_val(19), headerMaxW_val);
        if (!isLiquid) {
            ctx.fillStyle = '#d97706';
            ctx.fillText('Gas is compressible — piston moves less but pressure transmits per Pascal\'s Law.', pad_val, pad_val * 1.3 + fs_val(19) * 2);
        }

        if (!isLiquid) {
            const gasNoteY_val = pad_val * 1.3 + fs_val(19) * 2;
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, gasNoteY_val - fs_val(14), W, fs_val(20) * 1.5);
            ctx.fillStyle = '#d97706';
            ctx.font = `bold ${fs_val(12)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('Gas is compressible: piston moves less, so braking is weaker.', headerCenterX_val, gasNoteY_val, headerMaxW_val);
        }

        animRef.current = requestAnimationFrame(draw);
    }, [force1, area1, area2, fluidType, pressure_val, force2_val, mechanicalAdv_val, pedalDown]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, [draw]);

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]"
                onMouseDown={() => setPedalDown(true)} onMouseUp={() => setPedalDown(false)}
                onMouseLeave={() => setPedalDown(false)} onTouchStart={() => setPedalDown(true)} onTouchEnd={() => setPedalDown(false)}>
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain cursor-pointer" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-2 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8">
                <div className="space-y-2 md:space-y-4">
                    <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                            <span>Master Area (A₁)</span>
                            <span className="text-violet-700 font-mono text-base md:text-lg bg-violet-50 border border-violet-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{area1.toFixed(1)} cm²</span>
                        </label>
                        <input type="range" min="5" max="50" step="5" value={area1} onChange={(e) => setArea1(Number(e.target.value))}
                            className="w-full accent-violet-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                            <span>Wheel Area (A₂)</span>
                            <span className="text-blue-700 font-mono text-base md:text-lg bg-blue-50 border border-blue-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{area2.toFixed(1)} cm²</span>
                        </label>
                        <input type="range" min="50" max="500" step="10" value={area2} onChange={(e) => setArea2(Number(e.target.value))}
                            className="w-full accent-blue-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>
                <div className="space-y-2 md:space-y-4">
                    <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                            <span>Input Pedal Force (F₁)</span>
                            <span className="text-amber-700 font-mono text-base md:text-lg bg-amber-50 border border-amber-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{force1} N</span>
                        </label>
                        <input type="range" min="10" max="500" step="10" value={force1} onChange={(e) => setForce1(Number(e.target.value))}
                            className="w-full accent-amber-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="flex bg-slate-100 p-1 md:p-2 rounded-xl border border-slate-200 mt-1 md:mt-2 shadow-sm">
                        <button onClick={() => setFluidType('liquid')}
                            className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-bold rounded-lg transition-all active:scale-95 ${fluidType === 'liquid' ? 'bg-white text-emerald-700 shadow-md border border-emerald-100' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>
                            LIQUID
                        </button>
                        <button onClick={() => setFluidType('gas')}
                            className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-bold rounded-lg transition-all active:scale-95 ${fluidType === 'gas' ? 'bg-white text-amber-700 shadow-md border border-amber-100' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>
                            GAS
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex gap-3 mt-1 md:mt-2">
                <button
                    onMouseDown={() => setPedalDown(true)} onMouseUp={() => setPedalDown(false)}
                    onMouseLeave={() => setPedalDown(false)} onTouchStart={() => setPedalDown(true)} onTouchEnd={() => setPedalDown(false)}
                    className={`flex-1 flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all shadow active:scale-95 border select-none ${pedalDown
                        ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-200'
                        : 'bg-red-500 text-white border-red-400 hover:bg-red-600'}`}>
                    🛑 {pedalDown ? 'BRAKING...' : 'HOLD TO BRAKE'}
                </button>
                <button onClick={() => { setForce1(100); setArea1(10); setArea2(100); setFluidType('liquid'); }}
                    className="flex-1 flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-sm md:text-base shadow-sm active:scale-95">
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

export default HydraulicBrakeLab;
