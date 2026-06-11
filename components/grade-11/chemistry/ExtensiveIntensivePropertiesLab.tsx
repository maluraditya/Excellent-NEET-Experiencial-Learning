import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Atom } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props { topic: Topic; onExit: () => void; }

const W_CV = 1280, H_CV = 760;
const R_JOULES   = 8.314;

interface GasInfo { id: string; name: string; M: number; f: number; color: string; }
const GASES: GasInfo[] = [
    { id: 'N2',  name: 'N₂',  M: 28, f: 5, color: '#0891b2' },
    { id: 'He',  name: 'He',  M: 4,  f: 3, color: '#a16207' },
    { id: 'O2',  name: 'O₂',  M: 32, f: 5, color: '#16a34a' },
    { id: 'CO2', name: 'CO₂', M: 44, f: 6, color: '#7c3aed' },
];

const ExtensiveIntensivePropertiesLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);
    const pulseRef  = useRef(0);

    const [partitioned, setPartitioned] = useState(false);
    const [moles,       setMoles]       = useState(4);
    const [T,           setT]           = useState(300);
    const [gasId,       setGasId]       = useState('N2');
    const [view,        setView]        = useState<'full' | 'left' | 'right'>('full');
    const [paused,      setPaused]      = useState(false);

    const baseV_L = 100;

    useEffect(() => {
        if (!partitioned && view !== 'full') setView('full');
        if (partitioned && view === 'full') setView('left');
    }, [partitioned, view]);

    const gas = useMemo(() => GASES.find(g => g.id === gasId)!, [gasId]);

    const factor = partitioned && view !== 'full' ? 0.5 : 1.0;
    const V_L   = baseV_L * factor;
    const n_mol = moles    * factor;
    const m_g   = n_mol * gas.M;
    const U_J   = (gas.f / 2) * n_mol * R_JOULES * T;
    const C_JK  = (gas.f / 2) * n_mol * R_JOULES;
    const V_m3  = V_L * 1e-3;
    const p_Pa  = (n_mol * R_JOULES * T) / V_m3;
    const p_kPa = p_Pa / 1000;
    const d_gL  = m_g / V_L;
    const Vm    = V_L / n_mol;
    const Cm    = C_JK / n_mol;

    const fullV   = baseV_L;
    const fullN   = moles;
    const fullM   = moles * gas.M;
    const fullU   = (gas.f / 2) * moles * R_JOULES * T;
    const fullC   = (gas.f / 2) * moles * R_JOULES;
    const halfV   = baseV_L / 2;
    const halfN   = moles    / 2;
    const halfM   = (moles / 2) * gas.M;
    const halfU   = (gas.f / 2) * (moles / 2) * R_JOULES * T;
    const halfC   = (gas.f / 2) * (moles / 2) * R_JOULES;
    const fullP_kPa = (moles * R_JOULES * T) / (baseV_L * 1e-3) / 1000;
    const fullD     = (moles * gas.M) / baseV_L;
    const fullVm    = baseV_L / moles;

    const handleReset = useCallback(() => {
        setPartitioned(false); setMoles(4); setT(300); setGasId('N2'); setView('full');
        setPaused(false);
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
        ctx.fillText(`§5.2.2(b) Fig 5.6 — partition halves extensive properties · intensive properties stay the same`, 30, 76);

        ctx.font      = 'bold 14px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText('(a) Full system', 230, 120);
        ctx.fillText('(b) Partitioned system', 740, 120);

        const drawContainer = (
            x: number, y: number, w: number, h: number, label: string,
            Vlbl: string, Tlbl: string, particleCount: number, color: string,
            dim: boolean = false,
        ) => {
            ctx.fillStyle = dim ? '#f1f5f9' : '#fafafa';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            const pulse = pulseRef.current;
            const seed = particleCount * 41 + Math.floor(x);
            for (let i = 0; i < particleCount; i++) {
                const wig1 = Math.sin(pulse * 3 + i * 0.7) * 4;
                const wig2 = Math.cos(pulse * 2.4 + i * 0.5) * 4;
                const px = x + 14 + ((i * 73 + seed * 11 + wig1 * 10) % (w - 28));
                const py = y + 14 + ((i * 113 + seed * 19 + wig2 * 7) % (h - 28));
                ctx.beginPath();
                ctx.arc(px, py, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = dim ? '#94a3b8' : color;
                ctx.globalAlpha = dim ? 0.4 : 0.9;
                ctx.shadowColor = color;
                ctx.shadowBlur = dim ? 0 : 5;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }

            ctx.font      = 'bold 12px monospace';
            ctx.fillStyle = dim ? '#94a3b8' : '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y - 8);

            ctx.font      = 'bold 13px monospace';
            ctx.fillStyle = dim ? '#94a3b8' : '#0891b2';
            ctx.fillText(`V = ${Vlbl}`, x + w / 2 - 36, y + h + 22);
            ctx.fillStyle = dim ? '#94a3b8' : '#dc2626';
            ctx.fillText(`T = ${Tlbl}`, x + w / 2 + 36, y + h + 22);
            ctx.textAlign = 'left';
        };

        const aX = 100, aY = 150, aW = 380, aH = 320;
        const moleculeCountA = Math.max(10, Math.round(moles * 8));
        drawContainer(aX, aY, aW, aH, 'gas at (V, T)', `${baseV_L} L`, `${T} K`, moleculeCountA, gas.color, partitioned);

        if (partitioned) {
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(aX + aW + 10, aY + aH / 2);
            ctx.lineTo(aX + aW + 80, aY + aH / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(aX + aW + 80, aY + aH / 2);
            ctx.lineTo(aX + aW + 72, aY + aH / 2 - 6);
            ctx.lineTo(aX + aW + 72, aY + aH / 2 + 6);
            ctx.closePath();
            ctx.fillStyle = '#7c3aed';
            ctx.fill();

            ctx.font      = 'bold 10px sans-serif';
            ctx.fillStyle = '#7c3aed';
            ctx.textAlign = 'center';
            ctx.fillText('insert partition', aX + aW + 45, aY + aH / 2 - 10);
            ctx.textAlign = 'left';
        }

        const bX = 620, bY = 150, bW = 540, bH = 320;
        const halfW = bW / 2 - 2;
        const halfMoleculeCount = Math.max(5, Math.round(moles * 4));

        if (partitioned) {
            drawContainer(bX, bY, halfW, bH, '½ V', `${(baseV_L / 2).toFixed(0)} L`, `${T} K`, halfMoleculeCount, gas.color, view === 'right');
            drawContainer(bX + halfW + 4, bY, halfW, bH, '½ V', `${(baseV_L / 2).toFixed(0)} L`, `${T} K`, halfMoleculeCount, gas.color, view === 'left');
            ctx.fillStyle = '#475569';
            ctx.fillRect(bX + halfW, bY, 4, bH);
            ctx.beginPath();
            ctx.arc(bX + halfW + 2, bY - 4, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#7c3aed';
            ctx.fill();
        } else {
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(bX, bY, bW, bH);
            ctx.setLineDash([]);
            ctx.font      = 'italic 12px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'center';
            ctx.fillText('Insert partition to see (V/2, V/2)', bX + bW / 2, bY + bH / 2);
            ctx.textAlign = 'left';
        }

        if (partitioned) {
            ctx.font      = 'bold 13px sans-serif';
            ctx.fillStyle = '#15803d';
            ctx.textAlign = 'center';
            ctx.fillText('T (intensive) unchanged →', 550, aY - 18);
            ctx.fillStyle = '#dc2626';
            ctx.fillText('V (extensive) halved →', 550, aY + 18);
            ctx.textAlign = 'left';
        }

        if (partitioned) {
            if (view === 'left' || view === 'right') {
                const hx = view === 'left' ? bX : bX + halfW + 4;
                ctx.strokeStyle = '#7c3aed';
                ctx.lineWidth = 4;
                ctx.strokeRect(hx - 2, bY - 2, halfW + 4, bH + 4);
                ctx.fillStyle = '#7c3aed';
                ctx.font      = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('ACTIVE SUB-SYSTEM', hx + halfW / 2, bY + bH + 50);
                ctx.textAlign = 'left';
            }
        } else {
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 4;
            ctx.strokeRect(aX - 2, aY - 2, aW + 4, aH + 4);
            ctx.fillStyle = '#7c3aed';
            ctx.font      = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ACTIVE SYSTEM', aX + aW / 2, aY + aH + 50);
            ctx.textAlign = 'left';
        }

        // BOTTOM BAND — Property comparison strip
        const stripX = 70, stripY = 540, stripW = W_CV - 140, stripH = 200;

        ctx.fillStyle = '#fafafa';
        ctx.fillRect(stripX, stripY, stripW, stripH);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(stripX, stripY, stripW, stripH);

        ctx.font      = 'bold 12px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText('Property comparison — Full system  vs  ½-system', stripX + 14, stripY + 18);
        ctx.font      = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('extensive → halves · intensive → unchanged', stripX + 14, stripY + 34);

        ctx.fillStyle = '#fee2e2';
        ctx.fillRect(stripX + stripW - 240, stripY + 8, 110, 18);
        ctx.fillStyle = '#dc2626';
        ctx.font      = 'bold 10px sans-serif';
        ctx.fillText('■ extensive', stripX + stripW - 232, stripY + 20);
        ctx.fillStyle = '#d1fae5';
        ctx.fillRect(stripX + stripW - 120, stripY + 8, 110, 18);
        ctx.fillStyle = '#16a34a';
        ctx.fillText('■ intensive', stripX + stripW - 112, stripY + 20);

        const cards: { lab: string; unit: string; full: number; half: number; type: 'ext' | 'int'; format: (v: number) => string }[] = [
            { lab: 'V',   unit: 'L',     full: fullV,     half: halfV,     type: 'ext', format: v => v.toFixed(0) },
            { lab: 'n',   unit: 'mol',   full: fullN,     half: halfN,     type: 'ext', format: v => v.toFixed(1) },
            { lab: 'm',   unit: 'g',     full: fullM,     half: halfM,     type: 'ext', format: v => v.toFixed(0) },
            { lab: 'U',   unit: 'kJ',    full: fullU / 1000, half: halfU / 1000, type: 'ext', format: v => v.toFixed(2) },
            { lab: 'T',   unit: 'K',     full: T,         half: T,         type: 'int', format: v => v.toFixed(0) },
            { lab: 'p',   unit: 'kPa',   full: fullP_kPa, half: fullP_kPa, type: 'int', format: v => v.toFixed(1) },
            { lab: 'd',   unit: 'g/L',   full: fullD,     half: fullD,     type: 'int', format: v => v.toFixed(3) },
            { lab: 'V_m', unit: 'L/mol', full: fullVm,    half: fullVm,    type: 'int', format: v => v.toFixed(1) },
        ];

        const cardW   = (stripW - 28 - 7 * 10) / cards.length;
        const cardY   = stripY + 44;
        const cardH   = stripH - 60;

        cards.forEach((c, i) => {
            const cx = stripX + 14 + i * (cardW + 10);
            const cy = cardY;

            const isExt = c.type === 'ext';
            const extColor = '#dc2626', intColor = '#16a34a';
            const accent = isExt ? extColor : intColor;
            const bgColor = isExt ? '#fef2f2' : '#f0fdf4';
            ctx.fillStyle = bgColor;
            ctx.fillRect(cx, cy, cardW, cardH);
            ctx.strokeStyle = accent + '40';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(cx, cy, cardW, cardH);

            ctx.font      = 'bold 14px monospace';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText(c.lab, cx + cardW / 2, cy + 18);
            ctx.font      = '9px sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(c.unit, cx + cardW / 2, cy + 30);
            ctx.textAlign = 'left';

            const maxBarH = cardH - 70;
            const fullBarH = maxBarH;
            const halfBarH = c.full === 0 ? 0 : (c.half / c.full) * maxBarH;

            const barW = (cardW - 22) / 2;
            const bar1X = cx + 8;
            const bar2X = cx + 8 + barW + 6;
            const barBaseY = cy + cardH - 22;

            ctx.fillStyle = accent;
            ctx.fillRect(bar1X, barBaseY - fullBarH, barW, fullBarH);
            ctx.fillStyle = accent;
            ctx.fillRect(bar2X, barBaseY - halfBarH, barW, halfBarH);

            if (!isExt) {
                ctx.strokeStyle = accent + '50';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(bar1X, barBaseY - fullBarH);
                ctx.lineTo(bar2X + barW, barBaseY - fullBarH);
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                ctx.strokeStyle = accent + '80';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(bar2X, barBaseY - fullBarH);
                ctx.lineTo(bar2X + barW, barBaseY - fullBarH);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.font      = 'bold 10px monospace';
            ctx.fillStyle = accent;
            ctx.textAlign = 'center';
            ctx.fillText(c.format(c.full), bar1X + barW / 2, barBaseY - fullBarH - 4);
            ctx.fillText(c.format(c.half), bar2X + barW / 2, barBaseY - halfBarH - 4);

            ctx.font      = '8px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('FULL', bar1X + barW / 2, barBaseY + 11);
            ctx.fillText('½',    bar2X + barW / 2, barBaseY + 11);
            ctx.textAlign = 'left';

            ctx.fillStyle = accent;
            ctx.font      = 'bold 8px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(isExt ? 'EXT' : 'INT', cx + cardW - 6, cy + cardH - 6);
            ctx.textAlign = 'left';

            if (isExt) {
                ctx.strokeStyle = accent + 'CC';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(bar1X + barW + 1, barBaseY - fullBarH);
                ctx.lineTo(bar2X - 1,        barBaseY - halfBarH);
                ctx.stroke();
            }
        });
    }, [partitioned, view, T, moles, gas, fullV, halfV, fullN, halfN, fullM, halfM, fullU, halfU, fullP_kPa, fullD, fullVm]);

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

    const compareCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Full vs Half — NCERT Fig 5.6</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">Partition test: who halves, who stays?</div>
            <table className="w-full text-[11px]">
                <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                        <th className="text-left py-1">Property</th>
                        <th className="text-right py-1">Full</th>
                        <th className="text-right py-1">½</th>
                        <th className="text-center py-1">Type</th>
                    </tr>
                </thead>
                <tbody className="font-mono">
                    {([
                        { lab: 'V (L)',       full: fullV.toFixed(0),   half: halfV.toFixed(0),   type: 'ext' },
                        { lab: 'n (mol)',     full: fullN.toFixed(1),   half: halfN.toFixed(1),   type: 'ext' },
                        { lab: 'm (g)',       full: fullM.toFixed(0),   half: halfM.toFixed(0),   type: 'ext' },
                        { lab: 'U (kJ)',      full: (fullU / 1000).toFixed(2), half: (halfU / 1000).toFixed(2), type: 'ext' },
                        { lab: 'C (J/K)',     full: fullC.toFixed(1),   half: halfC.toFixed(1),   type: 'ext' },
                        { lab: 'T (K)',       full: T.toFixed(0),       half: T.toFixed(0),       type: 'int' },
                        { lab: 'p (kPa)',     full: fullP_kPa.toFixed(1), half: fullP_kPa.toFixed(1), type: 'int' },
                        { lab: 'd (g/L)',     full: fullD.toFixed(3),   half: fullD.toFixed(3),   type: 'int' },
                        { lab: 'V_m (L/mol)', full: fullVm.toFixed(1),  half: fullVm.toFixed(1),  type: 'int' },
                    ]).map(r => (
                        <tr key={r.lab} className="border-t border-slate-100">
                            <td className="py-1 text-slate-700">{r.lab}</td>
                            <td className="text-right text-slate-800">{r.full}</td>
                            <td className={`text-right ${r.type === 'ext' ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}`}>{r.half}</td>
                            <td className="text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] ${r.type === 'ext' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {r.type === 'ext' ? 'ext' : 'int'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-2 text-[10px] text-slate-500 italic leading-snug">
                Extensive (rose) halve · Intensive (emerald) unchanged.
            </div>
        </div>
    );

    const equationsCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Molar Property (intensive)</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">χ_m = χ / n  ⇒  extensive ÷ moles</div>
            <div className="space-y-1.5">
                <div className="rounded-lg border border-slate-100 bg-violet-50 px-2 py-1.5">
                    <div className="text-[9px] font-bold text-violet-700 uppercase">Molar volume</div>
                    <div className="font-mono text-[10px] text-slate-800">V_m = V / n = {fullV}/{fullN} = {fullVm.toFixed(2)} L/mol</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-teal-50 px-2 py-1.5">
                    <div className="text-[9px] font-bold text-teal-700 uppercase">Density</div>
                    <div className="font-mono text-[10px] text-slate-800">d = m / V = {fullM}/{fullV} = {fullD.toFixed(3)} g/L</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-amber-50 px-2 py-1.5">
                    <div className="text-[9px] font-bold text-amber-700 uppercase">Molar heat capacity</div>
                    <div className="font-mono text-[10px] text-slate-800">C_m = C / n = {fullC.toFixed(1)}/{fullN} = {Cm.toFixed(2)} J·mol⁻¹·K⁻¹</div>
                </div>
            </div>
        </div>
    );

    const lawsCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Underlying Equations</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">For ideal gas at {T} K, {moles} mol</div>
            <div className="space-y-1 text-[11px] font-mono text-slate-700">
                <div>p = nRT / V&nbsp;&nbsp;<span className="text-slate-400">(ideal gas)</span></div>
                <div>U = (f/2) nRT&nbsp;&nbsp;<span className="text-slate-400">f = {gas.f} for {gas.name}</span></div>
                <div>C_v = (f/2) nR</div>
                <div>R = 8.314 J·mol⁻¹·K⁻¹</div>
            </div>
        </div>
    );

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                {compareCard}
                {equationsCard}
                {lawsCard}
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">

                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl">
                    <div className="text-base font-extrabold text-violet-900">Extensive vs Intensive</div>
                    <div className="text-xs font-semibold text-violet-600 mb-2">NCERT §5.2.2(b)</div>
                    <div className="grid grid-cols-2 gap-1.5 mb-2 text-[11px]">
                        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2">
                            <div className="font-bold text-rose-700 uppercase text-[9px]">Extensive ↓</div>
                            <div className="font-mono text-rose-900 leading-snug">m, V, n, U, H, C</div>
                            <div className="text-rose-500 text-[9px] mt-0.5">depends on size</div>
                        </div>
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
                            <div className="font-bold text-emerald-700 uppercase text-[9px]">Intensive ═</div>
                            <div className="font-mono text-emerald-900 leading-snug">T, p, d, V_m, C_m</div>
                            <div className="text-emerald-500 text-[9px] mt-0.5">size-independent</div>
                        </div>
                    </div>
                    <div className="text-[11px] text-violet-900 leading-relaxed">
                        Quick test: <strong>insert a partition</strong>. Properties that halve are extensive; those that stay the same are intensive.
                    </div>
                    <div className="mt-2 rounded-xl bg-white/80 border border-violet-300 p-2 text-[10px] text-violet-800">
                        <strong>Rule of thumb:</strong> ratio of two extensive properties (e.g. V/n, m/V) is intensive.
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-extrabold text-slate-900">Real-time Values</div>
                        <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">LIVE</span>
                    </div>
                    <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 mb-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-violet-500">Active</div>
                        <div className="mt-0.5 font-mono text-base font-extrabold text-violet-700">
                            {view === 'full' ? 'Full system' : view === 'left' ? 'Left half' : 'Right half'}
                            {partitioned && view !== 'full' ? ' (× ½)' : ''}
                        </div>
                        <div className="text-[9px] text-violet-500 mt-0.5">Gas: {gas.name} · n = {moles} mol · T = {T} K</div>
                    </div>

                    <div className="text-[10px] font-bold uppercase text-rose-600 mb-1">Extensive</div>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold uppercase text-rose-400">V</div>
                            <div className="font-mono text-sm font-extrabold text-rose-700">{V_L.toFixed(0)} L</div>
                        </div>
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold uppercase text-rose-400">n</div>
                            <div className="font-mono text-sm font-extrabold text-rose-700">{n_mol.toFixed(1)} mol</div>
                        </div>
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold uppercase text-rose-400">m</div>
                            <div className="font-mono text-sm font-extrabold text-rose-700">{m_g.toFixed(0)} g</div>
                        </div>
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold uppercase text-rose-400">U</div>
                            <div className="font-mono text-sm font-extrabold text-rose-700">{(U_J / 1000).toFixed(2)} kJ</div>
                        </div>
                    </div>

                    <div className="text-[10px] font-bold uppercase text-emerald-600 mb-1">Intensive</div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold uppercase text-emerald-400">T</div>
                            <div className="font-mono text-sm font-extrabold text-emerald-700">{T} K</div>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold uppercase text-emerald-400">p</div>
                            <div className="font-mono text-sm font-extrabold text-emerald-700">{p_kPa.toFixed(1)} kPa</div>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold uppercase text-emerald-400">d</div>
                            <div className="font-mono text-sm font-extrabold text-emerald-700">{d_gL.toFixed(3)} g/L</div>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold uppercase text-emerald-400">V_m</div>
                            <div className="font-mono text-sm font-extrabold text-emerald-700">{Vm.toFixed(1)} L/mol</div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const inCanvasStatus = (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-md text-xs font-bold">
            <Atom size={12} className="text-violet-600" />
            <span className="font-mono text-slate-700">{gas.name}</span>
            <span className="text-slate-300">|</span>
            <span className="text-base font-extrabold text-violet-700">
                {partitioned ? (view === 'full' ? 'Full · Partitioned' : `${view === 'left' ? 'Left' : 'Right'} ½`) : 'Full system'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-rose-700">V={V_L.toFixed(0)}L</span>
            <span className="font-mono text-emerald-700">T={T}K</span>
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

    const gasBtn = (g: GasInfo) => {
        const active = g.id === gasId;
        return (
            <button key={g.id} onClick={() => setGasId(g.id)}
                className={`flex-1 min-w-[64px] px-2 py-1.5 rounded-lg border transition-all flex flex-col items-center ${
                    active ? 'text-white shadow-md scale-105' : 'bg-white hover:scale-105 hover:shadow'
                }`}
                style={{
                    backgroundColor: active ? g.color : 'white',
                    borderColor:     active ? g.color : g.color + '60',
                    color:           active ? 'white' : g.color,
                }}>
                <span className="font-mono text-sm font-extrabold">{g.name}</span>
                <span className={`text-[9px] mt-0.5 ${active ? 'text-white/85' : 'opacity-70'}`}>
                    M={g.M} · f={g.f}
                </span>
            </button>
        );
    };

    const controlsCombo = (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Atom size={16} className="text-violet-600" />
                <span className="text-sm font-extrabold text-slate-800">Extensive ⇄ Intensive Bench</span>
                <span className="ml-auto font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2 py-0.5">
                    {gas.name} · {V_L.toFixed(0)} L · {T} K · {n_mol.toFixed(1)} mol
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.4fr_1fr_1fr] gap-3">

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Gas</div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2 flex flex-wrap gap-1.5">
                        {GASES.map(gasBtn)}
                    </div>
                </div>

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Partition (NCERT Fig 5.6)</div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2 flex flex-col gap-1.5">
                        <button onClick={() => setPartitioned(p => !p)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                partitioned ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-violet-700 border-violet-300 hover:bg-violet-50'
                            }`}>
                            {partitioned ? '◢◣ Remove partition' : '✂ Insert partition'}
                        </button>
                        {partitioned && (
                            <div className="flex gap-1">
                                {(['full', 'left', 'right'] as const).map(v => (
                                    <button key={v} onClick={() => setView(v)}
                                        className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                                            view === v ? 'bg-violet-600 text-white border-violet-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}>
                                        {v === 'full' ? 'Both' : v === 'left' ? '½ Left' : '½ Right'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Moles (n)</label>
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 rounded">{moles} mol</span>
                    </div>
                    <input type="range" min={1} max={10} step={1} value={moles}
                        onChange={e => setMoles(Number(e.target.value))}
                        className="w-full accent-amber-600 h-1.5 cursor-pointer" />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                        <span>1</span><span>10 mol</span>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Temperature</label>
                        <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 rounded">{T} K</span>
                    </div>
                    <input type="range" min={200} max={600} step={10} value={T}
                        onChange={e => setT(Number(e.target.value))}
                        className="w-full accent-rose-600 h-1.5 cursor-pointer" />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                        <span>200</span><span>{T - 273} °C</span><span>600 K</span>
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

export default ExtensiveIntensivePropertiesLab;
