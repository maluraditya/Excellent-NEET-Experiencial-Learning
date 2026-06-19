import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Beaker,
    Eye,
    EyeOff,
    FlaskConical,
    Link2,
    Pause,
    Play,
    RotateCcw,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface IdealVsNonIdealSolutionsLabProps {
    topic: Topic;
    onExit: () => void;
}

type Deviation = 'ideal' | 'positive' | 'negative';

interface BinarySystem {
    id: string;
    label: string;
    label1: string;
    label2: string;
    color1: string;
    color2: string;
    p1: number;     // pure vapour pressure of component 1, mmHg
    p2: number;     // pure vapour pressure of component 2, mmHg
    tempK: number;
    deviation: Deviation;
    k: number;      // qualitative bowing magnitude (mmHg). +ve raises curve, -ve lowers.
    azeotrope?: { x2: number; label: string; tempK?: number };
    note: string;
}

const W = 1280;
const H = 760;

// NCERT Class 12 Chemistry, Ch 1 — Sections 1.4 & 1.5
// p° values: benzene+toluene (NCERT Ex 1.5 / Ex 1.38, 300 K),
// chloroform+acetone (NCERT Ex 1.4 dataset, 328 K),
// ethanol+acetone, ethanol+water, HNO3+water — composition & deviation type per NCERT §1.5.2.
const SYSTEMS: BinarySystem[] = [
    {
        id: 'benzene-toluene',
        label: 'Benzene + Toluene',
        label1: 'Toluene',
        label2: 'Benzene',
        color1: '#fbbf24',
        color2: '#60a5fa',
        p1: 32.06,
        p2: 50.71,
        tempK: 300,
        deviation: 'ideal',
        k: 0,
        note: 'Nearly ideal — A–A ≈ B–B ≈ A–B (NCERT §1.5.1).',
    },
    {
        id: 'ethanol-acetone',
        label: 'Ethanol + Acetone',
        label1: 'Ethanol',
        label2: 'Acetone',
        color1: '#22c55e',
        color2: '#a855f7',
        p1: 44.6,
        p2: 185.0,
        tempK: 298,
        deviation: 'positive',
        k: 60,
        note: 'Acetone breaks ethanol H-bonds → A–B weaker → P higher (NCERT §1.5.2).',
    },
    {
        id: 'chloroform-acetone',
        label: 'Chloroform + Acetone',
        label1: 'Chloroform',
        label2: 'Acetone',
        color1: '#0891b2',
        color2: '#a855f7',
        p1: 632.8,
        p2: 741.8,
        tempK: 328,
        deviation: 'negative',
        k: -200,
        note: 'CHCl₃ H bonds with C=O of acetone → A–B stronger → P lower (NCERT Ex 1.4).',
    },
    {
        id: 'ethanol-water',
        label: 'Ethanol + Water (azeotrope)',
        label1: 'Water',
        label2: 'Ethanol',
        color1: '#3b82f6',
        color2: '#22c55e',
        p1: 23.8,
        p2: 59.0,
        tempK: 298,
        deviation: 'positive',
        k: 80,
        azeotrope: { x2: 0.956, label: 'Min-bp azeotrope ~95% v/v ethanol', tempK: 351.4 },
        note: 'Large positive deviation → minimum-boiling azeotrope at ~95% ethanol (NCERT §1.5.2).',
    },
    {
        id: 'hno3-water',
        label: 'HNO₃ + Water (azeotrope)',
        label1: 'Water',
        label2: 'HNO₃',
        color1: '#3b82f6',
        color2: '#ef4444',
        p1: 23.8,
        p2: 48.0,
        tempK: 298,
        deviation: 'negative',
        k: -90,
        azeotrope: { x2: 0.38, label: 'Max-bp azeotrope ~68% HNO₃ w/w  (bp 393.5 K)', tempK: 393.5 },
        note: 'Large negative deviation → maximum-boiling azeotrope at ~68% HNO₃ by mass (NCERT §1.5.2).',
    },
];

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    species: 1 | 2;
    r: number;
}

const IdealVsNonIdealSolutionsLab: React.FC<IdealVsNonIdealSolutionsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    const [systemId, setSystemId] = useState<string>('benzene-toluene');
    const [x2, setX2] = useState(0.5);
    const [showIdeal, setShowIdeal] = useState(true);
    const [showBonds, setShowBonds] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);

    const system = useMemo(() => SYSTEMS.find((s) => s.id === systemId)!, [systemId]);

    // ===== NCERT-strict numerics =====
    const x1 = 1 - x2;
    const p1Ideal = system.p1 * x1;
    const p2Ideal = system.p2 * x2;
    const pTotalIdeal = p1Ideal + p2Ideal;
    // Bowing: positive k -> partials rise; negative k -> partials drop.
    // Endpoints (x=0, x=1) remain exactly Raoult.
    const p1Actual = Math.max(0, p1Ideal + 2 * system.k * x2 * x2);
    const p2Actual = Math.max(0, p2Ideal + 2 * system.k * x1 * x1);
    const pTotalActual = p1Actual + p2Actual;
    const y1 = pTotalActual > 0 ? p1Actual / pTotalActual : 0;
    const y2 = pTotalActual > 0 ? p2Actual / pTotalActual : 0;
    const deviationPct = pTotalIdeal > 0 ? ((pTotalActual - pTotalIdeal) / pTotalIdeal) * 100 : 0;

    // ===== particles seed (constant pool, ratio set by x2) =====
    useEffect(() => {
        const total = 80;
        const targetA = Math.round(total * x1);
        const cur = particlesRef.current;
        // seed strictly inside the liquid region (matches the draw-loop bounds below)
        const sx0 = 880 + 18, sx1 = 1230 - 18, sy0 = 250 + 60, sy1 = 600 - 12;
        if (cur.length === 0) {
            for (let i = 0; i < total; i += 1) {
                cur.push({
                    x: sx0 + Math.random() * (sx1 - sx0),
                    y: sy0 + Math.random() * (sy1 - sy0),
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (Math.random() - 0.5) * 0.6,
                    species: 1,
                    r: 4.5,
                });
            }
        }
        cur.forEach((p, idx) => {
            p.species = idx < targetA ? 1 : 2;
        });
    }, [x1]);

    const handleReset = useCallback(() => {
        setX2(0.5);
    }, []);

    // ===== draw loop =====
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // ---- chart domain ----
        const chX0 = 90, chX1 = 800, chY0 = 110, chY1 = 620;
        const yMaxData = Math.max(system.p1, system.p2, pTotalActual, pTotalIdeal) * 1.15;

        const xToPx = (xv: number) => chX0 + xv * (chX1 - chX0);
        const yToPx = (pv: number) => chY1 - (pv / yMaxData) * (chY1 - chY0);

        const drawCurve = (fn: (xv: number) => number, color: string, dashed: boolean, lineWidth = 2) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.setLineDash(dashed ? [5, 5] : []);
            ctx.beginPath();
            const steps = 100;
            for (let i = 0; i <= steps; i += 1) {
                const xv = i / steps;
                const yv = Math.max(0, fn(xv));
                const px = xToPx(xv);
                const py = yToPx(yv);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        };

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);

            // short caption (single line — allowed)
            ctx.fillStyle = '#64748b';
            ctx.font = '600 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Vapour pressure vs composition (P–x)  ·  T = ${system.tempK} K`, 60, 64);

            // ===== chart frame =====
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(chX0, chY0);
            ctx.lineTo(chX0, chY1);
            ctx.lineTo(chX1, chY1);
            ctx.stroke();

            // y-axis ticks
            ctx.fillStyle = '#475569';
            ctx.font = '600 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'right';
            for (let p = 0; p <= yMaxData; p += Math.max(50, Math.round(yMaxData / 6 / 50) * 50)) {
                const py = yToPx(p);
                ctx.beginPath();
                ctx.moveTo(chX0 - 6, py);
                ctx.lineTo(chX0, py);
                ctx.strokeStyle = '#94a3b8';
                ctx.stroke();
                ctx.fillText(`${Math.round(p)}`, chX0 - 10, py + 4);
            }
            ctx.save();
            ctx.translate(38, (chY0 + chY1) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Vapour pressure  (mmHg)', 0, 0);
            ctx.restore();

            // x-axis ticks
            ctx.fillStyle = '#475569';
            ctx.font = '600 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            for (let i = 0; i <= 10; i += 1) {
                const xv = i / 10;
                const px = xToPx(xv);
                ctx.beginPath();
                ctx.moveTo(px, chY1);
                ctx.lineTo(px, chY1 + 6);
                ctx.strokeStyle = '#94a3b8';
                ctx.stroke();
                if (i % 2 === 0) ctx.fillText(xv.toFixed(1), px, chY1 + 20);
            }
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 13px Inter, system-ui, sans-serif';
            ctx.fillText(`x₂  (mole fraction of ${system.label2})  →`, (chX0 + chX1) / 2, chY1 + 44);
            ctx.font = '600 11px Inter, system-ui, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(`pure ${system.label1}`, chX0, chY1 + 60);
            ctx.fillText(`pure ${system.label2}`, chX1, chY1 + 60);

            // ===== ideal (Raoult) reference lines =====
            if (showIdeal) {
                drawCurve((xv) => system.p1 * (1 - xv), '#cbd5e1', true, 2);    // p1 ideal
                drawCurve((xv) => system.p2 * xv, '#cbd5e1', true, 2);          // p2 ideal
                drawCurve((xv) => system.p1 * (1 - xv) + system.p2 * xv, '#94a3b8', true, 2.5); // pTotal ideal
                // labels
                ctx.fillStyle = '#94a3b8';
                ctx.font = '600 11px Inter, system-ui, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('p_total (ideal · Raoult)', xToPx(0.42), yToPx(system.p1 * 0.5 + system.p2 * 0.5) - 6);
            }

            // ===== shaded deviation area (between actual and ideal p_total) =====
            if (system.deviation !== 'ideal') {
                const totalActual = (xv: number) => {
                    const pa = Math.max(0, system.p1 * (1 - xv) + 2 * system.k * xv * xv);
                    const pb = Math.max(0, system.p2 * xv + 2 * system.k * (1 - xv) * (1 - xv));
                    return pa + pb;
                };
                const totalIdeal = (xv: number) => system.p1 * (1 - xv) + system.p2 * xv;
                ctx.beginPath();
                const steps = 100;
                for (let i = 0; i <= steps; i += 1) { const xv = i / steps; const px = xToPx(xv); const py = yToPx(totalActual(xv)); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
                for (let i = steps; i >= 0; i -= 1) { const xv = i / steps; const px = xToPx(xv); const py = yToPx(totalIdeal(xv)); ctx.lineTo(px, py); }
                ctx.closePath();
                ctx.fillStyle = system.deviation === 'positive' ? 'rgba(245,158,11,0.16)' : 'rgba(6,182,212,0.16)';
                ctx.fill();
            }

            // ===== actual curves =====
            drawCurve((xv) => Math.max(0, system.p1 * (1 - xv) + 2 * system.k * xv * xv), '#dc2626', false, 3);
            drawCurve((xv) => Math.max(0, system.p2 * xv + 2 * system.k * (1 - xv) * (1 - xv)), '#2563eb', false, 3);
            drawCurve(
                (xv) => {
                    const pa = Math.max(0, system.p1 * (1 - xv) + 2 * system.k * xv * xv);
                    const pb = Math.max(0, system.p2 * xv + 2 * system.k * (1 - xv) * (1 - xv));
                    return pa + pb;
                },
                '#0f172a',
                false,
                3.5,
            );

            // labels for actual curves
            ctx.fillStyle = '#dc2626';
            ctx.font = '700 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`p₁ (${system.label1})`, xToPx(0.02), yToPx(system.p1) - 6);
            ctx.fillStyle = '#2563eb';
            ctx.textAlign = 'right';
            ctx.fillText(`p₂ (${system.label2})`, xToPx(0.98), yToPx(system.p2) - 6);
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.fillText('p_total (actual)', xToPx(0.5), yToPx(pTotalActual) - 12);

            // ===== composition cursor =====
            const cx = xToPx(x2);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(cx, chY0);
            ctx.lineTo(cx, chY1);
            ctx.stroke();
            ctx.setLineDash([]);
            // chip at top
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.roundRect(cx - 50, chY0 - 32, 100, 24, 6);
            ctx.fill();
            ctx.fillStyle = '#78350f';
            ctx.font = '800 12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`x₂ = ${x2.toFixed(2)}`, cx, chY0 - 14);

            // live dots
            const dot = (px: number, py: number, color: string, label: string) => {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(px, py, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#0f172a';
                ctx.font = '700 11px Inter, system-ui, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(label, px + 12, py + 4);
            };
            dot(cx, yToPx(pTotalActual), '#0f172a', `${pTotalActual.toFixed(1)} mmHg`);
            dot(cx, yToPx(p1Actual), '#dc2626', '');
            dot(cx, yToPx(p2Actual), '#2563eb', '');

            // ===== azeotrope marker =====
            if (system.azeotrope) {
                const ax = xToPx(system.azeotrope.x2);
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 2;
                ctx.setLineDash([2, 4]);
                ctx.beginPath();
                ctx.moveTo(ax, chY0);
                ctx.lineTo(ax, chY1 + 70);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#fb923c';
                ctx.beginPath();
                ctx.roundRect(ax - 110, chY1 + 70, 220, 28, 8);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = '700 11px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(system.azeotrope.label, ax, chY1 + 88);
            }

            // ===== mixing beaker (right inset) =====
            const bx0 = 880, bx1 = 1230, by0 = 250, by1 = 600;
            // glass
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx0 - 12, by0 - 8);
            ctx.lineTo(bx0, by0);
            ctx.lineTo(bx0, by1);
            ctx.quadraticCurveTo((bx0 + bx1) / 2, by1 + 26, bx1, by1);
            ctx.lineTo(bx1, by0);
            ctx.lineTo(bx1 + 12, by0 - 8);
            ctx.stroke();
            // liquid
            const fillTop = by0 + 50;
            ctx.fillStyle = `${system.color1}33`;
            ctx.beginPath();
            ctx.moveTo(bx0 + 2, fillTop);
            ctx.lineTo(bx0 + 2, by1 - 2);
            ctx.quadraticCurveTo((bx0 + bx1) / 2, by1 + 20, bx1 - 2, by1 - 2);
            ctx.lineTo(bx1 - 2, fillTop);
            ctx.closePath();
            ctx.fill();

            // beaker title
            ctx.fillStyle = '#0f172a';
            ctx.font = '800 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Mixing flask', (bx0 + bx1) / 2, by0 - 22);
            ctx.font = '700 11px Inter, system-ui, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(`${system.label1} ↔ ${system.label2}`, (bx0 + bx1) / 2, by1 + 50);

            // particles
            // keep particles inside the straight-walled liquid region (with radius margin)
            const liquidTop = fillTop + 10;
            const liquidBottom = by1 - 12;
            const wallL = bx0 + 16;
            const wallR = bx1 - 16;
            for (const p of particlesRef.current) {
                if (!paused) {
                    p.x += p.vx * speed;
                    p.y += p.vy * speed;
                    if (p.x < wallL) { p.x = wallL; p.vx = Math.abs(p.vx); }
                    if (p.x > wallR) { p.x = wallR; p.vx = -Math.abs(p.vx); }
                    if (p.y < liquidTop) { p.y = liquidTop; p.vy = Math.abs(p.vy); }
                    if (p.y > liquidBottom) { p.y = liquidBottom; p.vy = -Math.abs(p.vy); }
                } else {
                    p.x = Math.max(wallL, Math.min(wallR, p.x));
                    p.y = Math.max(liquidTop, Math.min(liquidBottom, p.y));
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.species === 1 ? system.color1 : system.color2;
                ctx.fill();
            }

            // A–B bonds when deviation is strong
            if (showBonds && system.deviation !== 'ideal') {
                const parts = particlesRef.current;
                const isNeg = system.deviation === 'negative';
                const bondColor = isNeg ? '#06b6d4' : '#f59e0b';
                const intensity = Math.min(1, Math.abs(system.k) / 200);
                ctx.lineWidth = 1.5;
                for (let i = 0; i < parts.length; i += 1) {
                    for (let j = i + 1; j < parts.length; j += 1) {
                        const a = parts[i], b = parts[j];
                        if (a.species === b.species) continue;
                        const dx = a.x - b.x, dy = a.y - b.y;
                        const d = Math.sqrt(dx * dx + dy * dy);
                        if (d < 28) {
                            ctx.strokeStyle = bondColor + Math.floor(180 * intensity * (1 - d / 28)).toString(16).padStart(2, '0');
                            ctx.beginPath();
                            ctx.moveTo(a.x, a.y);
                            ctx.lineTo(b.x, b.y);
                            ctx.stroke();
                        }
                    }
                }
                ctx.fillStyle = bondColor;
                ctx.font = '700 10px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(isNeg ? 'A–B attraction stronger' : 'A–B attraction weaker', (bx0 + bx1) / 2, by0 - 4);
            }

            // pause-aware request
            rafRef.current = requestAnimationFrame(draw);
        };

        draw(); // immediate first paint (does not depend on rAF firing)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [system, x2, showIdeal, showBonds, paused, speed, p1Actual, p2Actual, pTotalActual, pTotalIdeal]);

    // ===== Left aside: composition / energetics / azeotrope =====
    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Composition (liquid vs vapour)</h3>
                    <p className="text-xs font-semibold text-slate-500">x from slider, y from Dalton (Eq 1.17–1.19)</p>
                    <div className="mt-2 space-y-2 text-[11px] font-bold">
                        {[
                            { label: `x₁  ${system.label1}`, value: x1, color: '#dc2626' },
                            { label: `x₂  ${system.label2}`, value: x2, color: '#2563eb' },
                            { label: `y₁  ${system.label1}`, value: y1, color: '#fca5a5' },
                            { label: `y₂  ${system.label2}`, value: y2, color: '#93c5fd' },
                        ].map((row) => (
                            <div key={row.label}>
                                <div className="flex items-center justify-between text-slate-700">
                                    <span>{row.label}</span>
                                    <span className="font-mono text-slate-900">{row.value.toFixed(3)}</span>
                                </div>
                                <div className="mt-0.5 h-2 w-full rounded-full bg-slate-100">
                                    <div className="h-2 rounded-full" style={{ width: `${row.value * 100}%`, background: row.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 text-[10px] font-semibold text-slate-500">
                        When x and y bars look identical → azeotrope composition.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Mixing energetics</h3>
                    <p className="text-xs font-semibold text-slate-500">NCERT Eq 1.21 · sign by interaction balance</p>
                    {(() => {
                        const dev = system.deviation;
                        const verdict = dev === 'ideal' ? 'Ideal solution' : dev === 'positive' ? 'Positive deviation' : 'Negative deviation';
                        const hSign = dev === 'ideal' ? '≈ 0' : dev === 'positive' ? '> 0  (endothermic)' : '< 0  (exothermic)';
                        const vSign = dev === 'ideal' ? '≈ 0' : dev === 'positive' ? '> 0' : '< 0';
                        const tint = dev === 'ideal' ? 'bg-slate-50' : dev === 'positive' ? 'bg-amber-50' : 'bg-cyan-50';
                        const fg = dev === 'ideal' ? 'text-slate-700' : dev === 'positive' ? 'text-amber-800' : 'text-cyan-800';
                        return (
                            <div className={`mt-2 space-y-2 rounded-xl ${tint} p-3 text-[12px] font-bold ${fg}`}>
                                <div className="text-sm font-extrabold">{verdict}</div>
                                <div className="font-mono">ΔmixH {hSign}</div>
                                <div className="font-mono">ΔmixV {vSign}</div>
                                <div className="text-[11px] font-semibold opacity-80">
                                    Δ(p_total) = {deviationPct >= 0 ? '+' : ''}{deviationPct.toFixed(1)}% vs Raoult
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {system.azeotrope && (
                    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3 text-orange-900 shadow-xl">
                        <h3 className="text-base font-extrabold">Azeotrope</h3>
                        <p className="text-xs font-semibold text-orange-700">NCERT §1.5.2 — same x in liquid and vapour</p>
                        <div className="mt-2 text-[12px] font-bold leading-snug">{system.azeotrope.label}</div>
                        <div className="mt-1 font-mono text-[11px] text-orange-800">x₂ = {system.azeotrope.x2.toFixed(3)}{system.azeotrope.tempK ? `   ·   bp ${system.azeotrope.tempK} K` : ''}</div>
                        <button
                            onClick={() => setX2(system.azeotrope!.x2)}
                            className="mt-2 w-full rounded-lg border border-orange-300 bg-white px-2 py-1.5 text-[11px] font-black text-orange-800 hover:bg-orange-100"
                        >
                            Jump cursor to azeotrope
                        </button>
                    </div>
                )}
            </div>
        </aside>
    ), [system, x1, x2, y1, y2, deviationPct]);

    // ===== Right aside: theory + values + examples =====
    const valuesPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="flex items-start gap-2">
                        <FlaskConical size={19} className="mt-0.5 text-amber-800" />
                        <div>
                            <h3 className="text-base font-extrabold text-amber-950">Raoult's Law & Deviations</h3>
                            <p className="text-xs font-semibold text-amber-700">NCERT Class 12 · Ch 1 · §1.4 + §1.5</p>
                        </div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-950">
                        <p>p₁ = p₁°·x₁   ·   p₂ = p₂°·x₂   ·   p_total = x₁p₁° + x₂p₂°</p>
                        <p>Ideal: obeys Raoult over the whole range. ΔmixH = ΔmixV = 0.</p>
                        <p>+ve deviation: A–B weaker than A–A/B–B → P higher than Raoult.</p>
                        <p>−ve deviation: A–B stronger than A–A/B–B → P lower than Raoult.</p>
                        <p>Azeotropes: extreme deviations; x_liq = y_vap; fractional distillation halts.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'p₁ pure', value: `${system.p1.toFixed(1)} mmHg`, tint: 'bg-slate-50', color: 'text-slate-800' },
                            { label: 'p₂ pure', value: `${system.p2.toFixed(1)} mmHg`, tint: 'bg-slate-50', color: 'text-slate-800' },
                            { label: 'p₁ actual', value: `${p1Actual.toFixed(1)} mmHg`, tint: 'bg-red-50', color: 'text-red-700' },
                            { label: 'p₂ actual', value: `${p2Actual.toFixed(1)} mmHg`, tint: 'bg-blue-50', color: 'text-blue-700' },
                            { label: 'p_total ideal (Raoult)', value: `${pTotalIdeal.toFixed(1)} mmHg`, tint: 'bg-slate-50', color: 'text-slate-700' },
                            { label: 'p_total actual', value: `${pTotalActual.toFixed(1)} mmHg`, tint: 'bg-amber-50', color: 'text-amber-700' },
                            { label: 'y₁ (vapour)', value: y1.toFixed(3), tint: 'bg-red-50', color: 'text-red-700' },
                            { label: 'y₂ (vapour)', value: y2.toFixed(3), tint: 'bg-blue-50', color: 'text-blue-700' },
                        ].map((row) => (
                            <div key={row.label} className={`rounded-lg border border-slate-100 ${row.tint} px-3 py-2`}>
                                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                                <div className={`mt-0.5 font-mono text-base font-extrabold ${row.color}`}>{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </aside>
    ), [system, p1Actual, p2Actual, pTotalIdeal, pTotalActual, y1, y2]);

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        onClick={() => setPaused((value) => !value)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50"
                        title={paused ? 'Play' : 'Pause'}
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button
                        onClick={handleReset}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50"
                        title="Reset"
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controls = (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Beaker size={18} className="text-amber-600" />
                Ideal vs Non-ideal Solutions Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Binary system</div>
                    <div className="grid grid-cols-2 gap-2">
                        {SYSTEMS.map((s) => {
                            const active = systemId === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSystemId(s.id)}
                                    className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left text-[11px] font-extrabold transition ${active ? 'border-amber-500 bg-amber-500 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <span className="leading-tight">{s.label}</span>
                                    <span className={`text-[9px] font-bold ${active ? 'text-amber-50' : 'text-slate-500'}`}>
                                        {s.deviation === 'ideal' ? 'ideal' : s.deviation === 'positive' ? '+ deviation' : '− deviation'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                            <span>Composition x₂ ({system.label2})</span>
                            <span className="font-mono text-slate-700">{x2.toFixed(2)}</span>
                        </div>
                        <input className="w-full accent-amber-600" type="range" min={0} max={1} step={0.01} value={x2} onChange={(e) => setX2(Number(e.target.value))} />
                        <div className="mt-0.5 flex justify-between text-[10px] font-semibold text-slate-400">
                            <span>pure {system.label1}</span><span>pure {system.label2}</span>
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                            <span>Animation speed</span>
                            <span className="font-mono text-slate-700">{speed.toFixed(1)}×</span>
                        </div>
                        <input className="w-full accent-violet-600" type="range" min={0.2} max={2.5} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setShowIdeal((v) => !v)}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${showIdeal ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                            {showIdeal ? <Eye size={13} /> : <EyeOff size={13} />} Ideal ref
                        </button>
                        <button
                            onClick={() => setShowBonds((v) => !v)}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${showBonds ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Link2 size={13} /> A–B bonds
                        </button>
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
            ControlsComponent={controls}
            controlsAreaFlex="0 0 240px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default IdealVsNonIdealSolutionsLab;
