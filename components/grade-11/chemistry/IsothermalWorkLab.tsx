import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Atom } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props { topic: Topic; onExit: () => void; }

const W_CV = 1280, H_CV = 760;

type Mode = 'reversible' | 'irreversible_single' | 'irreversible_multi' | 'free';

const R_JOULES        = 8.314;
const R_LATM_MOL_K    = 0.08206;
const ATM_TO_PA       = 101325;
const L_TO_M3         = 1e-3;
const J_PER_LATM      = ATM_TO_PA * L_TO_M3;

interface ModeInfo { id: Mode; label: string; color: string; soft: string; }
const MODES: ModeInfo[] = [
    { id: 'reversible',          label: 'Reversible',           color: '#16a34a', soft: '#d1fae5' },
    { id: 'irreversible_single', label: 'Irreversible (1 step)', color: '#d97706', soft: '#fef3c7' },
    { id: 'irreversible_multi',  label: 'Irreversible (n steps)', color: '#0891b2', soft: '#cffafe' },
    { id: 'free',                label: 'Free expansion',       color: '#7c3aed', soft: '#ede9fe' },
];

const IsothermalWorkLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);
    const pulseRef  = useRef(0);

    const [mode,     setMode]     = useState<Mode>('reversible');
    const [Vi,       setVi]       = useState(1);
    const [Vf,       setVf]       = useState(5);
    const [n,        setN]        = useState(1);
    const [T,        setT]        = useState(298);
    const [steps,    setSteps]    = useState(4);
    const [paused,   setPaused]   = useState(false);

    const Piso = useCallback((V: number) => (n * R_LATM_MOL_K * T) / V, [n, T]);
    const Pi   = useMemo(() => Piso(Vi), [Piso, Vi]);
    const Pf   = useMemo(() => Piso(Vf), [Piso, Vf]);

    const work = useMemo(() => {
        const dV = Vf - Vi;
        if (mode === 'free' || Math.abs(dV) < 1e-6) {
            return { J: 0, latm: 0 };
        }
        if (mode === 'reversible') {
            const w_latm = -n * R_LATM_MOL_K * T * Math.log(Vf / Vi);
            return { J: w_latm * J_PER_LATM, latm: w_latm };
        }
        if (mode === 'irreversible_single') {
            const w_latm = -Pf * dV;
            return { J: w_latm * J_PER_LATM, latm: w_latm };
        }
        let w_latm = 0;
        for (let i = 0; i < steps; i++) {
            const v0 = Vi + (dV * i)       / steps;
            const v1 = Vi + (dV * (i + 1)) / steps;
            const Pext = Piso(v1);
            w_latm += -Pext * (v1 - v0);
        }
        return { J: w_latm * J_PER_LATM, latm: w_latm };
    }, [mode, Vi, Vf, n, T, steps, Pf, Piso]);

    const heat = useMemo(() => ({ J: -work.J, latm: -work.latm }), [work]);
    const dU   = 0;

    const Pi_kPa = Pi * ATM_TO_PA / 1000;
    const Pf_kPa = Pf * ATM_TO_PA / 1000;

    const cylinderVmax = 6, cylinderVmin = 0.5;
    const vToPiston = (V: number) => Math.max(0.04, Math.min(0.96, (V - cylinderVmin) / (cylinderVmax - cylinderVmin)));

    const [currentStep, setCurrentStep] = useState(0);
    useEffect(() => {
        if (paused) return;
        if (mode !== 'irreversible_multi') { setCurrentStep(steps); return; }
        setCurrentStep(0);
        const id = setInterval(() => {
            setCurrentStep(s => (s < steps ? s + 1 : 0));
        }, 900);
        return () => clearInterval(id);
    }, [mode, steps, paused, Vi, Vf]);

    const handleReset = useCallback(() => {
        setMode('reversible'); setVi(1); setVf(5); setN(1); setT(298); setSteps(4); setPaused(false);
    }, []);

    const drawFrame = useCallback(() => {
        const cv = canvasRef.current; if (!cv) return;
        const ctx = cv.getContext('2d'); if (!ctx) return;

        ctx.clearRect(0, 0, W_CV, H_CV);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W_CV, H_CV);

        ctx.strokeStyle = 'rgba(100,116,139,0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W_CV; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H_CV); ctx.stroke(); }
        for (let y = 0; y <= H_CV; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W_CV, y); ctx.stroke(); }

        ctx.font      = '12px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`§5.2.1 PV-work · isothermal: PV = nRT · ΔU = 0 ⇒ q = −w`, 30, 76);

        const modeInfo = MODES.find(m => m.id === mode)!;
        const cx = 380, cy = 380;
        const cylW = 220, cylH = 480;
        const cylTop = cy - cylH / 2;
        const cylBot = cy + cylH / 2;

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - cylW / 2, cylTop);
        ctx.lineTo(cx - cylW / 2, cylBot);
        ctx.lineTo(cx + cylW / 2, cylBot);
        ctx.lineTo(cx + cylW / 2, cylTop);
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.fillRect(cx - cylW / 2 - 10, cylBot - 4, cylW + 20, 12);

        const displayV =
            mode === 'irreversible_multi'
                ? Vi + (Vf - Vi) * (currentStep / steps)
                : Vf;
        const pistonFrac = vToPiston(displayV);
        const gasTop = cylBot - pistonFrac * cylH;

        const gasGrad = ctx.createLinearGradient(cx - cylW / 2, gasTop, cx - cylW / 2, cylBot);
        gasGrad.addColorStop(0, modeInfo.color + '30');
        gasGrad.addColorStop(1, modeInfo.color + '10');
        ctx.fillStyle = gasGrad;
        ctx.fillRect(cx - cylW / 2 + 2, gasTop, cylW - 4, cylBot - gasTop - 2);

        const molCount = Math.max(8, Math.min(40, Math.round(displayV * 6)));
        const seed = mode === 'irreversible_multi' ? currentStep : 0;
        for (let i = 0; i < molCount; i++) {
            const wig = Math.sin(pulseRef.current * 3 + i) * 4;
            const mx = cx - cylW / 2 + 12 + ((i * 41 + seed * 7 + wig) % (cylW - 24));
            const my = gasTop + 12 + ((i * 73 + seed * 11) % Math.max(20, cylBot - gasTop - 24));
            ctx.beginPath();
            ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
            ctx.fillStyle   = modeInfo.color;
            ctx.shadowColor = modeInfo.color;
            ctx.shadowBlur  = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        const pistonGrad = ctx.createLinearGradient(cx, gasTop - 12, cx, gasTop);
        pistonGrad.addColorStop(0, '#94a3b8');
        pistonGrad.addColorStop(1, '#475569');
        ctx.fillStyle = pistonGrad;
        ctx.fillRect(cx - cylW / 2 + 2, gasTop - 12, cylW - 4, 14);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - cylW / 2 + 2, gasTop - 12, cylW - 4, 14);

        ctx.fillStyle = '#64748b';
        ctx.fillRect(cx - 8, cylTop - 30, 16, gasTop - cylTop + 14);

        if (mode === 'irreversible_single') {
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.roundRect(cx - 50, cylTop - 56, 100, 26, 4);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font      = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`P_ext = ${Pf.toFixed(2)} atm`, cx, cylTop - 38);
            ctx.textAlign = 'left';
        } else if (mode === 'irreversible_multi') {
            const remaining = Math.max(0, steps - currentStep);
            for (let i = 0; i < remaining; i++) {
                ctx.fillStyle = '#0891b2';
                ctx.beginPath();
                ctx.roundRect(cx - 35, cylTop - 30 - i * 10 - 14, 70, 8, 2);
                ctx.fill();
            }
            ctx.fillStyle = '#0891b2';
            ctx.font      = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`step ${currentStep}/${steps}`, cx, cylTop - 30 - remaining * 10 - 22);
            ctx.textAlign = 'left';
        } else if (mode === 'reversible') {
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = '#16a34a';
                ctx.beginPath();
                ctx.arc(cx - 30 + i * 2.1, cylTop - 30 - (i * 0.6) - 4, 1.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#15803d';
            ctx.font      = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('infinitesimal grains · dp', cx, cylTop - 60);
            ctx.textAlign = 'left';
        } else if (mode === 'free') {
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(cx - 40, cylTop + 20);
            ctx.lineTo(cx + 40, cylTop + 20);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#7c3aed';
            ctx.font      = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Vacuum (P_ext = 0)', cx, cylTop - 32);
            ctx.textAlign = 'left';
        }

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.font      = '9px monospace';
        ctx.fillStyle = '#64748b';
        for (let V = 1; V <= cylinderVmax; V++) {
            const y = cylBot - vToPiston(V) * cylH;
            ctx.beginPath();
            ctx.moveTo(cx + cylW / 2 + 4, y);
            ctx.lineTo(cx + cylW / 2 + 14, y);
            ctx.stroke();
            ctx.fillText(`${V} L`, cx + cylW / 2 + 18, y + 3);
        }

        ctx.font      = 'bold 13px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('Piston–Cylinder (ideal gas)', cx, cylBot + 38);
        ctx.font      = '11px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`n = ${n} mol · T = ${T} K`, cx, cylBot + 58);
        ctx.textAlign = 'left';

        const px0 = 740,  px1 = 1230;
        const py0 = 110,  py1 = 560;
        const Vlo = Math.min(0.5, Vi - 0.5);
        const Vhi = Math.max(6.5, Vf + 0.5);
        const Pmax = Piso(Vlo) * 1.05;
        const Pmin = 0;
        const xPV = (V: number) => px0 + ((V - Vlo) / (Vhi - Vlo)) * (px1 - px0);
        const yPV = (P: number) => py1 - ((P - Pmin) / (Pmax - Pmin)) * (py1 - py0);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(px0, py0, px1 - px0, py1 - py0);

        ctx.font      = 'bold 12px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('P (atm)', px0 - 56, py0 + 10);
        ctx.fillText('V (L)',   px1 - 38, py1 + 22);
        ctx.font      = 'bold 13px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText('P–V diagram (real-time)', (px0 + px1) / 2, py0 - 18);
        ctx.textAlign = 'left';

        ctx.font      = '10px monospace';
        ctx.fillStyle = '#64748b';
        for (let V = 1; V <= 6; V++) {
            const x = xPV(V);
            ctx.beginPath();
            ctx.moveTo(x, py1); ctx.lineTo(x, py1 + 5);
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.stroke();
            ctx.textAlign = 'center';
            ctx.fillText(`${V}`, x, py1 + 18);
            ctx.textAlign = 'left';
        }
        for (let i = 0; i <= 4; i++) {
            const P = (Pmax / 4) * i;
            const y = yPV(P);
            ctx.beginPath();
            ctx.moveTo(px0 - 5, y); ctx.lineTo(px0, y);
            ctx.strokeStyle = '#94a3b8'; ctx.stroke();
            ctx.textAlign = 'end';
            ctx.fillText(P.toFixed(1), px0 - 8, y + 3);
            ctx.textAlign = 'left';
        }

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const V = Vlo + (Vhi - Vlo) * (i / 100);
            const P = Piso(V);
            if (i === 0) ctx.moveTo(xPV(V), yPV(P));
            else         ctx.lineTo(xPV(V), yPV(P));
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font      = '9px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('isotherm (PV = nRT)', xPV(Vhi) - 110, yPV(Piso(Vhi)) - 6);

        const fillWork = (color: string, soft: string) => {
            ctx.fillStyle = soft;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
        };

        if (mode === 'reversible') {
            fillWork('#16a34a', '#bbf7d055');
            ctx.beginPath();
            ctx.moveTo(xPV(Vi), yPV(0));
            ctx.lineTo(xPV(Vi), yPV(Piso(Vi)));
            for (let i = 0; i <= 60; i++) {
                const V = Vi + (Vf - Vi) * (i / 60);
                ctx.lineTo(xPV(V), yPV(Piso(V)));
            }
            ctx.lineTo(xPV(Vf), yPV(0));
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            for (let i = 0; i <= 60; i++) {
                const V = Vi + (Vf - Vi) * (i / 60);
                if (i === 0) ctx.moveTo(xPV(V), yPV(Piso(V)));
                else         ctx.lineTo(xPV(V), yPV(Piso(V)));
            }
            ctx.stroke();
        } else if (mode === 'irreversible_single') {
            fillWork('#d97706', '#fde68a55');
            const Pext = Pf;
            ctx.beginPath();
            ctx.rect(xPV(Vi), yPV(Pext), xPV(Vf) - xPV(Vi), yPV(0) - yPV(Pext));
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(xPV(Vi), yPV(Pi));
            ctx.lineTo(xPV(Vi), yPV(Pext));
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.8;
            ctx.setLineDash([5, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (mode === 'irreversible_multi') {
            fillWork('#0891b2', '#a5f3fc55');
            ctx.beginPath();
            ctx.moveTo(xPV(Vi), yPV(0));
            ctx.lineTo(xPV(Vi), yPV(Piso(Vi)));
            for (let i = 1; i <= steps; i++) {
                const v0 = Vi + ((Vf - Vi) * (i - 1)) / steps;
                const v1 = Vi + ((Vf - Vi) * i) / steps;
                const Pext = Piso(v1);
                ctx.lineTo(xPV(v0), yPV(Pext));
                ctx.lineTo(xPV(v1), yPV(Pext));
            }
            ctx.lineTo(xPV(Vf), yPV(0));
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(xPV(Vi), yPV(Piso(Vi)));
            for (let i = 1; i <= steps; i++) {
                const v0 = Vi + ((Vf - Vi) * (i - 1)) / steps;
                const v1 = Vi + ((Vf - Vi) * i) / steps;
                const Pext = Piso(v1);
                ctx.lineTo(xPV(v0), yPV(Pext));
                ctx.lineTo(xPV(v1), yPV(Pext));
            }
            ctx.stroke();
            if (currentStep > 0 && currentStep <= steps) {
                const v0 = Vi + ((Vf - Vi) * (currentStep - 1)) / steps;
                const v1 = Vi + ((Vf - Vi) * currentStep)       / steps;
                const Pext = Piso(v1);
                ctx.fillStyle = '#0891b288';
                ctx.fillRect(xPV(v0), yPV(Pext), xPV(v1) - xPV(v0), yPV(0) - yPV(Pext));
            }
        } else {
            ctx.font      = 'bold 14px sans-serif';
            ctx.fillStyle = '#7c3aed';
            ctx.textAlign = 'center';
            ctx.fillText('w = 0  (no work — vacuum)', (px0 + px1) / 2, (py0 + py1) / 2);
            ctx.textAlign = 'left';
        }

        ctx.beginPath();
        ctx.arc(xPV(Vi), yPV(Pi), 6, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.font      = 'bold 10px monospace';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(`A (V₁=${Vi.toFixed(1)} L, P₁=${Pi.toFixed(2)} atm)`, xPV(Vi) + 10, yPV(Pi) - 6);

        ctx.beginPath();
        ctx.arc(xPV(Vf), yPV(Pf), 6, 0, Math.PI * 2);
        ctx.fillStyle = modeInfo.color;
        ctx.fill();
        ctx.fillText(`B (V₂=${Vf.toFixed(1)} L, P₂=${Pf.toFixed(2)} atm)`, xPV(Vf) - 90, yPV(Pf) + 18);

        const midX = (xPV(Vi) + xPV(Vf)) / 2;
        const midY = yPV(0) - 18;
        ctx.font      = 'bold 14px sans-serif';
        ctx.fillStyle = modeInfo.color;
        ctx.textAlign = 'center';
        ctx.fillText(`|w| = ${Math.abs(work.J).toFixed(1)} J = ${Math.abs(work.latm).toFixed(3)} L·atm`, midX, midY);
        ctx.textAlign = 'left';
    }, [mode, Vi, Vf, n, T, steps, Pi, Pf, currentStep, work, Piso]);

    useEffect(() => { drawFrame(); }, [drawFrame]);
    useEffect(() => {
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            if (!paused) pulseRef.current += dt;
            drawFrame();
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, [drawFrame, paused]);

    const allWorks = useMemo(() => {
        const dV = Vf - Vi;
        const wRev = -n * R_LATM_MOL_K * T * Math.log(Vf / Vi);
        const wIrrSingle = -Pf * dV;
        let wIrrMulti = 0;
        for (let i = 0; i < steps; i++) {
            const v0 = Vi + (dV * i)       / steps;
            const v1 = Vi + (dV * (i + 1)) / steps;
            wIrrMulti += -Piso(v1) * (v1 - v0);
        }
        return {
            reversible:          wRev * J_PER_LATM,
            irreversible_single: wIrrSingle * J_PER_LATM,
            irreversible_multi:  wIrrMulti * J_PER_LATM,
            free:                0,
        };
    }, [Vi, Vf, n, T, steps, Pf, Piso]);

    const maxWork = Math.max(Math.abs(allWorks.reversible), Math.abs(allWorks.irreversible_single), Math.abs(allWorks.irreversible_multi));

    const workCompareCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Work Comparison</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">|w_rev| is the maximum (NCERT §5.2.1)</div>
            <div className="flex flex-col gap-1.5">
                {([
                    { id: 'reversible',          label: 'Reversible',          col: '#16a34a', bg: '#d1fae5' },
                    { id: 'irreversible_multi',  label: `Irrev. (${steps} steps)`, col: '#0891b2', bg: '#cffafe' },
                    { id: 'irreversible_single', label: 'Irrev. (1 step)',     col: '#d97706', bg: '#fef3c7' },
                    { id: 'free',                label: 'Free expansion',      col: '#7c3aed', bg: '#ede9fe' },
                ] as const).map(r => {
                    const w = allWorks[r.id];
                    const frac = maxWork === 0 ? 0 : (Math.abs(w) / maxWork) * 100;
                    return (
                        <div key={r.id} className="rounded-lg border border-slate-100 px-2 py-1.5" style={{ backgroundColor: r.bg }}>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-800">{r.label}</span>
                                <span style={{ color: r.col }} className="font-mono">{w.toFixed(1)} J</span>
                            </div>
                            <div className="mt-1 h-1.5 bg-white rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${frac}%`, backgroundColor: r.col }} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-2 text-[10px] text-slate-500 italic leading-snug">
                As n_steps → ∞, irreversible → reversible curve (Fig. 5.5b → c).
            </div>
        </div>
    );

    const firstLawCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">First Law (Isothermal)</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">ΔU = q + w · ideal gas ⇒ ΔU = 0</div>
            <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-lg border border-slate-100 bg-rose-50 px-2 py-1.5 text-center">
                    <div className="text-[9px] font-bold uppercase text-slate-500">w</div>
                    <div className="font-mono text-sm font-extrabold text-rose-700">{work.J.toFixed(1)}</div>
                    <div className="text-[9px] text-rose-500">J</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-emerald-50 px-2 py-1.5 text-center">
                    <div className="text-[9px] font-bold uppercase text-slate-500">q</div>
                    <div className="font-mono text-sm font-extrabold text-emerald-700">{heat.J.toFixed(1)}</div>
                    <div className="text-[9px] text-emerald-500">J</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-center">
                    <div className="text-[9px] font-bold uppercase text-slate-500">ΔU</div>
                    <div className="font-mono text-sm font-extrabold text-slate-800">{dU}</div>
                    <div className="text-[9px] text-slate-500">J</div>
                </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 leading-snug">
                For ideal gas at constant T, U depends only on T ⇒ ΔU = 0; all heat absorbed converts to work done.
            </div>
        </div>
    );

    const equationsCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">NCERT Equations</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">Ch 5, §5.2.1</div>
            <div className="space-y-1.5">
                <div className="rounded-lg border border-slate-100 bg-emerald-50 px-2 py-1.5">
                    <div className="text-[9px] font-bold text-emerald-700 uppercase">Reversible (Eq. 5.5)</div>
                    <div className="font-mono text-[10px] text-slate-800">w_rev = −nRT ln(V₂/V₁)</div>
                    <div className="font-mono text-[10px] text-slate-500">     = −2.303 nRT log(V₂/V₁)</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-amber-50 px-2 py-1.5">
                    <div className="text-[9px] font-bold text-amber-700 uppercase">Irreversible (Eq. 5.2)</div>
                    <div className="font-mono text-[10px] text-slate-800">w_irr = −p_ext (V₂ − V₁)</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-violet-50 px-2 py-1.5">
                    <div className="text-[9px] font-bold text-violet-700 uppercase">Free expansion</div>
                    <div className="font-mono text-[10px] text-slate-800">p_ext = 0 ⇒ w = q = ΔU = 0</div>
                    <div className="text-[9px] text-violet-500">Joule's experiment</div>
                </div>
            </div>
        </div>
    );

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                {workCompareCard}
                {firstLawCard}
                {equationsCard}
            </div>
        </aside>
    );

    const currentMode = MODES.find(m => m.id === mode)!;

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">

                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl">
                    <div className="text-base font-extrabold text-violet-900">Reversible vs Irreversible</div>
                    <div className="text-xs font-semibold text-violet-600 mb-2">NCERT §5.2.1</div>
                    <ul className="text-xs leading-relaxed text-violet-900 space-y-1.5">
                        <li>• <strong>Reversible</strong>: p_ext = p_in ± dp; ∞-slow; series of equilibria; reverses by infinitesimal change.</li>
                        <li>• <strong>Irreversible</strong>: finite p_ext difference; single or finite steps; fast; not in equilibrium during.</li>
                        <li>• <strong>Sign:</strong> w &lt; 0 for expansion; w &gt; 0 for compression.</li>
                        <li>• <strong>|w_rev| is the maximum work</strong> a system can deliver between two states.</li>
                        <li>• <strong>Free expansion</strong> (p_ext=0) ⇒ w = 0 (Problem 5.2).</li>
                    </ul>
                    <div className="mt-3 rounded-xl border border-violet-300 bg-white/80 p-2.5">
                        <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Constants</div>
                        <div className="font-mono text-[10px] text-slate-800 mt-1">R = 8.314 J·mol⁻¹·K⁻¹ = 0.08206 L·atm·mol⁻¹·K⁻¹</div>
                        <div className="font-mono text-[10px] text-slate-800">1 L·atm = 101.325 J</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">LIVE</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="rounded-lg border border-slate-100 px-3 py-2" style={{ backgroundColor: currentMode.soft }}>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Process</div>
                            <div className="mt-0.5 font-mono text-base font-extrabold" style={{ color: currentMode.color }}>
                                {currentMode.label}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                                <div className="text-[9px] font-bold uppercase text-slate-400">V₁</div>
                                <div className="font-mono text-sm font-extrabold text-slate-800">{Vi.toFixed(2)} L</div>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-emerald-50 px-2 py-1.5">
                                <div className="text-[9px] font-bold uppercase text-slate-400">V₂</div>
                                <div className="font-mono text-sm font-extrabold text-emerald-700">{Vf.toFixed(2)} L</div>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                                <div className="text-[9px] font-bold uppercase text-slate-400">P₁</div>
                                <div className="font-mono text-xs font-extrabold text-slate-800">{Pi.toFixed(2)} atm</div>
                                <div className="text-[8px] text-slate-500">{Pi_kPa.toFixed(1)} kPa</div>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-emerald-50 px-2 py-1.5">
                                <div className="text-[9px] font-bold uppercase text-slate-400">P₂</div>
                                <div className="font-mono text-xs font-extrabold text-emerald-700">{Pf.toFixed(2)} atm</div>
                                <div className="text-[8px] text-emerald-500">{Pf_kPa.toFixed(1)} kPa</div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-rose-500">Work done (w)</div>
                            <div className="mt-0.5 font-mono text-base font-extrabold text-rose-700">{work.J.toFixed(1)} J</div>
                            <div className="text-[9px] text-rose-500 font-mono">{work.latm.toFixed(3)} L·atm</div>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">Heat absorbed (q)</div>
                            <div className="mt-0.5 font-mono text-base font-extrabold text-emerald-700">{heat.J.toFixed(1)} J</div>
                            <div className="text-[9px] text-emerald-500">q = −w (isothermal ideal gas)</div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const inCanvasStatus = (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-md text-xs font-bold"
             style={{ borderColor: currentMode.color + '60' }}>
            <Atom size={12} style={{ color: currentMode.color }} />
            <span className="text-base font-extrabold" style={{ color: currentMode.color }}>{currentMode.label}</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-700">{Vi.toFixed(1)} → {Vf.toFixed(1)} L</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-rose-700">w = {work.J.toFixed(1)} J</span>
        </div>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W_CV} height={H_CV} className="absolute inset-0 h-full w-full" />
                <div className="absolute top-3 left-3 z-10 pointer-events-auto">{inCanvasStatus}</div>
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button onClick={() => setPaused(p => !p)}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const modeBtn = (m: ModeInfo) => {
        const active = m.id === mode;
        return (
            <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex-1 min-w-[100px] px-2 py-1.5 rounded-lg border transition-all flex flex-col items-center text-center ${
                    active ? 'text-white shadow-md scale-105' : 'bg-white hover:scale-105 hover:shadow'
                }`}
                style={{
                    backgroundColor: active ? m.color : 'white',
                    borderColor:     active ? m.color : (m.color + '60'),
                    color:           active ? 'white' : m.color,
                }}>
                <span className="text-[11px] font-extrabold">{m.label}</span>
                <span className={`text-[9px] mt-0.5 ${active ? 'text-white/85' : 'opacity-70'}`}>
                    {m.id === 'reversible'          && 'p_ext = p ± dp'}
                    {m.id === 'irreversible_single' && 'p_ext = P_f (const)'}
                    {m.id === 'irreversible_multi'  && 'staircase'}
                    {m.id === 'free'                && 'p_ext = 0'}
                </span>
            </button>
        );
    };

    const controlsCombo = (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Atom size={16} className="text-violet-600" />
                <span className="text-sm font-extrabold text-slate-800">Isothermal Work Bench</span>
                <span className="ml-auto font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2 py-0.5">
                    {currentMode.label} · w = {work.J.toFixed(1)} J
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] gap-3">

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Process Mode</div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2 flex flex-wrap gap-1.5">
                        {MODES.map(modeBtn)}
                    </div>
                    {mode === 'irreversible_multi' && (
                        <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">Number of steps</label>
                                <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 rounded">{steps}</span>
                            </div>
                            <input type="range" min={2} max={20} step={1} value={steps}
                                onChange={e => setSteps(Number(e.target.value))}
                                className="w-full accent-cyan-600 h-1.5 cursor-pointer" />
                            <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                                <span>2 (coarse)</span>
                                <span>20 (≈ reversible)</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial V₁</label>
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 rounded">{Vi.toFixed(1)} L</span>
                        </div>
                        <input type="range" min={0.5} max={3} step={0.1} value={Vi}
                            onChange={e => setVi(Math.min(Number(e.target.value), Vf - 0.5))}
                            className="w-full accent-slate-600 h-1.5 cursor-pointer" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Final V₂</label>
                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 rounded">{Vf.toFixed(1)} L</span>
                        </div>
                        <input type="range" min={1} max={6} step={0.1} value={Vf}
                            onChange={e => setVf(Math.max(Number(e.target.value), Vi + 0.5))}
                            className="w-full accent-emerald-600 h-1.5 cursor-pointer" />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Moles (n)</label>
                            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 rounded">{n} mol</span>
                        </div>
                        <input type="range" min={1} max={5} step={1} value={n}
                            onChange={e => setN(Number(e.target.value))}
                            className="w-full accent-amber-600 h-1.5 cursor-pointer" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Temperature</label>
                            <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 rounded">{T} K</span>
                        </div>
                        <input type="range" min={200} max={500} step={10} value={T}
                            onChange={e => setT(Number(e.target.value))}
                            className="w-full accent-rose-600 h-1.5 cursor-pointer" />
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                            <span>200</span>
                            <span>{T - 273} °C</span>
                            <span>500</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
        />
    );
};

export default IsothermalWorkLab;
