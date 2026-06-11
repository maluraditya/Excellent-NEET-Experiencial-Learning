import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Atom, Eye, Layers } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

// ─── NCERT facts (Chapter 2, §2.6) ───────────────────────────────────────────
interface Props { topic: Topic; onExit: () => void; }

const MAX_N = 5;
const W = 1280, H = 760;
const CX = 640, CY = 380;

const HydrogenOrbitalsLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);

    const [n, setN] = useState(2);
    const [l, setL] = useState(1);
    const [m, setM] = useState(0);

    const [showNodes,        setShowNodes]        = useState(true);
    const [crossSection,     setCrossSection]     = useState(true);
    const [showProbability,  setShowProbability]  = useState(false);
    const [paused,           setPaused]           = useState(false);

    useEffect(() => { if (l > n - 1) setL(n - 1); }, [n, l]);
    useEffect(() => { if (Math.abs(m) > l) setM(0); }, [l, m]);

    const radialNodes  = n - l - 1;
    const angularNodes = l;
    const totalNodes   = n - 1;

    const orbitalLetter = (lv: number) => ['s', 'p', 'd', 'f', 'g'][lv] ?? 'g';
    const orbitalLabel  = (() => {
        if (l === 0) return `${n}s`;
        if (l === 1) {
            const ax = m === 0 ? 'z' : m === 1 ? 'x' : 'y';
            return `${n}p${ax}`;
        }
        if (l === 2) {
            const tag = m === 0 ? 'z²' : m === 1 ? 'xz' : m === -1 ? 'yz' : m === 2 ? 'x²-y²' : 'xy';
            return `${n}d${tag}`;
        }
        return `${n}${orbitalLetter(l)}`;
    })();

    const drawFrame = useCallback((tSec: number) => {
        const cv = canvasRef.current; if (!cv) return;
        const ctx = cv.getContext('2d'); if (!ctx) return;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(100,116,139,0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(CX, 80); ctx.lineTo(CX, H - 80); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(180, CY); ctx.lineTo(W - 180, CY); ctx.stroke();
        ctx.setLineDash([]);

        ctx.font      = 'bold 13px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('+x', W - 195, CY - 8);
        ctx.fillText('+z', CX + 6, 78);
        ctx.fillText('−x', 168, CY - 8);
        ctx.fillText('−z', CX + 6, H - 70);

        ctx.font      = 'bold 15px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(`Boundary Surface — ${orbitalLabel}`, 30, 36);
        ctx.font      = '11px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Encloses 90 % probability of finding the electron (NCERT §2.6.2)', 30, 54);

        const baseR = 120;
        const size  = baseR + n * 28;
        const sx    = size, sy = size;

        const themes = [
            { lobe: '#60a5fa', edge: '#1d4ed8', soft: '#dbeafe', name: 's' },
            { lobe: '#a78bfa', edge: '#6d28d9', soft: '#ede9fe', name: 'p' },
            { lobe: '#34d399', edge: '#047857', soft: '#d1fae5', name: 'd' },
            { lobe: '#fbbf24', edge: '#b45309', soft: '#fef3c7', name: 'f' },
        ];
        const T = themes[Math.min(l, 3)];

        const drawLobe = (px: number, py: number, rx: number, ry: number, rot: number, sign: '+' | '-' = '+') => {
            ctx.save();
            ctx.translate(CX, CY);
            ctx.rotate(rot);

            const halo = ctx.createRadialGradient(px, py, 0, px, py, Math.max(rx, ry));
            halo.addColorStop(0, T.lobe + 'CC');
            halo.addColorStop(0.55, T.lobe + '88');
            halo.addColorStop(1, '#ffffff00');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = T.edge;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();

            if (crossSection) {
                ctx.clip();
                const grad = ctx.createRadialGradient(px, py, 0, px, py, Math.max(rx, ry));
                grad.addColorStop(0, T.edge + 'EE');
                grad.addColorStop(0.4, T.lobe + 'AA');
                grad.addColorStop(1, T.soft + '00');
                ctx.fillStyle = grad;
                ctx.fillRect(-W, -H, W * 2, H * 2);

                ctx.font      = 'bold 30px sans-serif';
                ctx.fillStyle = sign === '+' ? '#0369a1' : '#b91c1c';
                ctx.textAlign = 'center';
                ctx.fillText(sign === '+' ? '+' : '−', px, py + 11);
                ctx.textAlign = 'left';
            }
            ctx.restore();
        };

        if (l === 0) {
            drawLobe(0, 0, sx * 0.85, sy * 0.85, 0, '+');
        }
        else if (l === 1) {
            const axisAngle = m === 0 ? -Math.PI / 2 : m === 1 ? 0 : Math.PI / 2;
            const lobeR     = sx * 0.50;
            const lobeS     = sy * 0.32;
            drawLobe(0,  -sy * 0.55, lobeS, lobeR, axisAngle, '+');
            drawLobe(0,   sy * 0.55, lobeS, lobeR, axisAngle, '-');
        }
        else if (l === 2) {
            if (m === 0) {
                const lobeR = sx * 0.45, lobeS = sy * 0.28;
                drawLobe(0, -sy * 0.55, lobeS, lobeR, 0, '+');
                drawLobe(0,  sy * 0.55, lobeS, lobeR, 0, '+');
                ctx.save();
                ctx.translate(CX, CY);
                ctx.scale(1, 0.32);
                ctx.beginPath();
                ctx.arc(0, 0, sx * 0.62, 0, Math.PI * 2);
                ctx.strokeStyle = T.edge;
                ctx.lineWidth   = sx * 0.22;
                ctx.stroke();
                if (crossSection) {
                    ctx.beginPath();
                    ctx.arc(0, 0, sx * 0.62, 0, Math.PI * 2);
                    ctx.lineWidth   = sx * 0.18;
                    ctx.strokeStyle = T.lobe + 'AA';
                    ctx.stroke();
                }
                ctx.restore();
            } else {
                const lobeR = sx * 0.42, lobeS = sy * 0.22;
                const isOnAxis = (m === 2);
                const offset   = isOnAxis ? 0 : Math.PI / 4;
                for (let i = 0; i < 4; i++) {
                    const ang = offset + i * Math.PI / 2;
                    const px  = Math.cos(ang) * sx * 0.55;
                    const py  = Math.sin(ang) * sy * 0.55;
                    drawLobe(px, py, lobeR, lobeS, ang, i % 2 === 0 ? '+' : '-');
                }
            }
        }
        else {
            const count = 2 * l + 1;
            for (let i = 0; i < count; i++) {
                const ang = (i / count) * Math.PI * 2;
                drawLobe(Math.cos(ang) * sx * 0.55, Math.sin(ang) * sy * 0.55,
                         sx * 0.25, sy * 0.18, ang, i % 2 === 0 ? '+' : '-');
            }
        }

        if (showProbability) {
            ctx.save();
            ctx.globalAlpha = 0.22;
            for (let i = 0; i < 2200; i++) {
                const r = Math.random() * size * 0.9;
                const θ = Math.random() * Math.PI * 2;
                const px = CX + r * Math.cos(θ);
                const py = CY + r * Math.sin(θ);
                ctx.fillStyle = T.edge;
                ctx.fillRect(px, py, 1.4, 1.4);
            }
            ctx.restore();
        }

        if (showNodes) {
            ctx.beginPath();
            ctx.arc(CX, CY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.fill();

            if (radialNodes > 0) {
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 5]);
                for (let i = 1; i <= radialNodes; i++) {
                    const rNode = size * (i / (radialNodes + 1));
                    ctx.beginPath();
                    ctx.arc(CX, CY, rNode, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.setLineDash([]);
                    ctx.fillStyle = '#dc2626';
                    ctx.font      = 'bold 10px monospace';
                    ctx.fillText(`radial #${i}`, CX + rNode + 4, CY - 4);
                    ctx.setLineDash([6, 5]);
                }
                ctx.setLineDash([]);
            }

            if (angularNodes > 0) {
                ctx.strokeStyle = '#2563eb';
                ctx.lineWidth = 2.2;

                const drawPlane = (ang: number, label: string) => {
                    ctx.beginPath();
                    const r = Math.max(W, H);
                    ctx.moveTo(CX - Math.cos(ang) * r, CY - Math.sin(ang) * r);
                    ctx.lineTo(CX + Math.cos(ang) * r, CY + Math.sin(ang) * r);
                    ctx.stroke();
                    ctx.fillStyle = '#2563eb';
                    ctx.font      = 'bold 10px monospace';
                    const lx = CX + Math.cos(ang) * 250;
                    const ly = CY + Math.sin(ang) * 250;
                    ctx.fillText(label, lx + 6, ly - 4);
                };

                if (l === 1) {
                    const planeAng = m === 0 ? 0 : Math.PI / 2;
                    drawPlane(planeAng, 'angular node');
                } else if (l === 2 && m === 0) {
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(CX, CY);
                    ctx.lineTo(CX + size * 0.95, CY + size * 0.55);
                    ctx.lineTo(CX - size * 0.95, CY + size * 0.55);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(CX, CY);
                    ctx.lineTo(CX + size * 0.95, CY - size * 0.55);
                    ctx.lineTo(CX - size * 0.95, CY - size * 0.55);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#2563eb';
                    ctx.font      = 'bold 10px monospace';
                    ctx.fillText('conical nodal surface', CX + 14, CY - size * 0.55 - 6);
                } else if (l === 2) {
                    const offset = (m === 2) ? Math.PI / 4 : 0;
                    drawPlane(offset, 'plane 1');
                    drawPlane(offset + Math.PI / 2, 'plane 2');
                }
            }
        }

        if (!paused) {
            const pulse = 6 + 1.5 * Math.sin(tSec * 2.4);
            ctx.beginPath();
            ctx.arc(CX, CY, pulse, 0, Math.PI * 2);
            ctx.fillStyle   = '#0f172a';
            ctx.shadowColor = '#64748b';
            ctx.shadowBlur  = 10;
            ctx.fill();
            ctx.shadowBlur  = 0;
        }
    }, [n, l, m, showNodes, crossSection, showProbability, paused, orbitalLabel, radialNodes, angularNodes]);

    useEffect(() => { drawFrame(0); }, [drawFrame]);

    useEffect(() => {
        let start: number | null = null;
        let cancelled = false;
        const loop = (t: number) => {
            if (cancelled) return;
            if (start === null) start = t;
            drawFrame((t - start) / 1000);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => { cancelled = true; cancelAnimationFrame(rafRef.current); };
    }, [drawFrame]);

    const handleReset = useCallback(() => {
        setN(2); setL(1); setM(0);
        setShowNodes(true); setCrossSection(true); setShowProbability(false);
        setPaused(false);
    }, []);

    const svgW = 320, svgH = 165;
    const padL = 36, padR = 14, padT = 16, padB = 26;
    const pw = svgW - padL - padR;
    const ph = svgH - padT - padB;

    const psi_r = (r: number): number => {
        const ρ = r * 2 / n;
        if (l === 0) {
            if (n === 1) return Math.exp(-ρ / 2);
            if (n === 2) return (2 - ρ) * Math.exp(-ρ / 2) * 0.5;
            if (n === 3) return (6 - 6 * ρ + ρ * ρ) * Math.exp(-ρ / 2) * 0.18;
            if (n === 4) return (24 - 36 * ρ + 12 * ρ * ρ - ρ ** 3) * Math.exp(-ρ / 2) * 0.05;
            return (120 - 240 * ρ + 120 * ρ ** 2 - 20 * ρ ** 3 + ρ ** 4) * Math.exp(-ρ / 2) * 0.012;
        }
        if (l === 1) {
            if (n === 2) return ρ * Math.exp(-ρ / 2) * 0.45;
            if (n === 3) return ρ * (4 - ρ) * Math.exp(-ρ / 2) * 0.15;
            if (n === 4) return ρ * (20 - 10 * ρ + ρ * ρ) * Math.exp(-ρ / 2) * 0.04;
            if (n === 5) return ρ * (120 - 90 * ρ + 18 * ρ ** 2 - ρ ** 3) * Math.exp(-ρ / 2) * 0.009;
        }
        if (l === 2) {
            if (n === 3) return ρ * ρ * Math.exp(-ρ / 2) * 0.18;
            if (n === 4) return ρ * ρ * (6 - ρ) * Math.exp(-ρ / 2) * 0.04;
            if (n === 5) return ρ * ρ * (42 - 14 * ρ + ρ * ρ) * Math.exp(-ρ / 2) * 0.008;
        }
        return ρ ** l * Math.exp(-ρ / 2);
    };

    const rMax = 6 * n;
    const samples = 160;
    const psiVals: { x: number; y: number }[] = [];
    const psi2Vals: { x: number; y: number }[] = [];
    let psiMax = 0, psi2Max = 0;
    for (let i = 0; i <= samples; i++) {
        const r = (i / samples) * rMax;
        const ψ = psi_r(r);
        psiVals.push({ x: r, y: ψ });
        psi2Vals.push({ x: r, y: ψ * ψ });
        if (Math.abs(ψ) > psiMax) psiMax = Math.abs(ψ);
        if (ψ * ψ > psi2Max) psi2Max = ψ * ψ;
    }

    const polyPath = (pts: { x: number; y: number }[], yMin: number, yMax: number) =>
        pts.map(({ x, y }, i) => {
            const px = padL + (x / rMax) * pw;
            const py = padT + ph - ((y - yMin) / (yMax - yMin)) * ph;
            return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
        }).join(' ');

    const radialNodeXs: number[] = [];
    for (let i = 1; i < psiVals.length; i++) {
        if (psiVals[i - 1].y * psiVals[i].y < 0) {
            const r = (psiVals[i - 1].x + psiVals[i].x) / 2;
            radialNodeXs.push(r);
        }
    }

    const psiCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Radial Wavefunction ψ(r)</div>
            <div className="text-xs font-semibold text-slate-500 mb-1">NCERT Fig. 2.12(a) — sign change at each radial node</div>
            <svg width={svgW} height={svgH} className="block">
                <line x1={padL} y1={padT + ph / 2} x2={padL + pw} y2={padT + ph / 2} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
                <line x1={padL} y1={padT} x2={padL} y2={padT + ph} stroke="#475569" strokeWidth={1.5} />
                <line x1={padL} y1={padT + ph} x2={padL + pw} y2={padT + ph} stroke="#475569" strokeWidth={1.5} />
                <text x={padL - 6} y={padT + 4} fill="#64748b" fontSize={9} textAnchor="end">+</text>
                <text x={padL - 6} y={padT + ph - 2} fill="#64748b" fontSize={9} textAnchor="end">−</text>
                <text x={padL + pw / 2} y={padT + ph + 18} fill="#475569" fontSize={10} textAnchor="middle">r (a₀)</text>

                <path d={polyPath(psiVals, -psiMax * 1.1, psiMax * 1.1)} fill="none" stroke="#6d28d9" strokeWidth={2.2} />

                {radialNodeXs.map((r, i) => {
                    const px = padL + (r / rMax) * pw;
                    return (
                        <g key={i}>
                            <line x1={px} y1={padT} x2={px} y2={padT + ph} stroke="#dc2626" strokeWidth={1.3} strokeDasharray="4 3" />
                            <circle cx={px} cy={padT + ph / 2} r={3.5} fill="#dc2626" />
                        </g>
                    );
                })}

                <text x={padL + pw - 6} y={padT + 12} fill="#6d28d9" fontSize={10} fontWeight="bold" textAnchor="end">{orbitalLabel}</text>
            </svg>
        </div>
    );

    const psi2Card = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Probability Density ψ²(r)</div>
            <div className="text-xs font-semibold text-slate-500 mb-1">NCERT Fig. 2.12(b) — touches 0 at every radial node</div>
            <svg width={svgW} height={svgH} className="block">
                <line x1={padL} y1={padT} x2={padL} y2={padT + ph} stroke="#475569" strokeWidth={1.5} />
                <line x1={padL} y1={padT + ph} x2={padL + pw} y2={padT + ph} stroke="#475569" strokeWidth={1.5} />
                <text x={padL + pw / 2} y={padT + ph + 18} fill="#475569" fontSize={10} textAnchor="middle">r (a₀)</text>
                <text x={padL - 4} y={padT + 9} fill="#64748b" fontSize={9} textAnchor="end">|ψ|²</text>

                <path d={polyPath(psi2Vals, 0, psi2Max * 1.05)} fill="#bbf7d055" stroke="#047857" strokeWidth={2.2} />

                {radialNodeXs.map((r, i) => {
                    const px = padL + (r / rMax) * pw;
                    return (
                        <g key={i}>
                            <line x1={px} y1={padT} x2={px} y2={padT + ph} stroke="#dc2626" strokeWidth={1.3} strokeDasharray="4 3" />
                            <text x={px} y={padT + ph + 18} fill="#dc2626" fontSize={9} textAnchor="middle">node</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );

    const energyLevelCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">H-atom Energy Order</div>
            <div className="text-xs font-semibold text-slate-500 mb-1.5">NCERT Eq. 2.23 — Fig. 2.16 (degenerate orbitals)</div>
            <div className="text-[11px] font-mono leading-snug text-slate-800">
                1s &lt; 2s = 2p &lt; 3s = 3p = 3d &lt;<br />
                4s = 4p = 4d = 4f &lt; …
            </div>
            <div className="mt-2 text-[10px] text-slate-500 leading-snug">
                In hydrogen, energy depends <strong>only on n</strong> — so 2s and 2p are degenerate.
                In multi-electron atoms l also matters.
            </div>
        </div>
    );

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                {psiCard}
                {psi2Card}
                {energyLevelCard}
            </div>
        </aside>
    );

    const subshellName = ['Sharp', 'Principal', 'Diffuse', 'Fundamental'][Math.min(l, 3)];

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-violet-900">Boundary Surface Diagrams</div>
                    <div className="text-xs font-semibold text-violet-600 mb-2">NCERT §2.6.2 — Structure of Atom</div>
                    <ul className="text-xs leading-relaxed text-violet-900 space-y-1.5">
                        <li>• Surface encloses <strong>~90 %</strong> of |ψ|². A 100 % boundary is impossible — |ψ|² is never exactly zero at finite r.</li>
                        <li>• <strong>s</strong> (l=0) spherical · <strong>p</strong> (l=1) 2 lobes · <strong>d</strong> (l=2) clover / dz² torus.</li>
                        <li>• Three p-orbitals (pₓ, pᵧ, p_z) are mutually perpendicular and equal in energy.</li>
                        <li>• Five d-orbitals (d_xy, d_xz, d_yz, d_x²-y², d_z²) — first four are similar; d_z² is unique.</li>
                        <li>• Size grows with n: <span className="font-mono">4s &gt; 3s &gt; 2s &gt; 1s</span>.</li>
                    </ul>
                    <div className="mt-3 rounded-xl border border-violet-300 bg-white/80 p-2.5 space-y-1">
                        <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Node Formulae</div>
                        <div className="font-mono text-[10px] text-slate-800">Radial nodes  = n − l − 1</div>
                        <div className="font-mono text-[10px] text-slate-800">Angular nodes = l</div>
                        <div className="font-mono text-[10px] text-slate-800">Total nodes   = n − 1</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">LIVE</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="rounded-lg border border-slate-100 bg-violet-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Orbital</div>
                            <div className="mt-0.5 font-mono text-xl font-extrabold text-violet-700">{orbitalLabel}</div>
                            <div className="text-[9px] text-violet-500 font-semibold">{subshellName} subshell</div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            <div className="rounded-lg border border-slate-100 bg-amber-50 px-2 py-1.5 text-center">
                                <div className="text-[9px] font-bold uppercase text-slate-500">n</div>
                                <div className="font-mono text-base font-extrabold text-amber-700">{n}</div>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-cyan-50 px-2 py-1.5 text-center">
                                <div className="text-[9px] font-bold uppercase text-slate-500">l</div>
                                <div className="font-mono text-base font-extrabold text-cyan-700">{l}</div>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-emerald-50 px-2 py-1.5 text-center">
                                <div className="text-[9px] font-bold uppercase text-slate-500">mₗ</div>
                                <div className="font-mono text-base font-extrabold text-emerald-700">{m > 0 ? `+${m}` : m}</div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-red-500">Radial Nodes (n−l−1)</div>
                            <div className="mt-0.5 font-mono text-lg font-extrabold text-red-700">{radialNodes}</div>
                            <div className="text-[9px] text-red-500">spherical surfaces</div>
                        </div>
                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-blue-500">Angular Nodes (l)</div>
                            <div className="mt-0.5 font-mono text-lg font-extrabold text-blue-700">{angularNodes}</div>
                            <div className="text-[9px] text-blue-500">{l === 2 && m === 0 ? 'conical surface' : l > 0 ? 'planar surfaces' : 'none'}</div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total Nodes (n−1)</div>
                            <div className="mt-0.5 font-mono text-lg font-extrabold text-slate-800">{totalNodes}</div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
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

    const subshellTheme = (lv: number) => {
        if (lv === 0) return { bg: 'bg-blue-50',    fg: 'text-blue-700',    bd: 'border-blue-300',    on: 'bg-blue-600',    onBd: 'border-blue-700' };
        if (lv === 1) return { bg: 'bg-violet-50',  fg: 'text-violet-700',  bd: 'border-violet-300',  on: 'bg-violet-600',  onBd: 'border-violet-700' };
        if (lv === 2) return { bg: 'bg-emerald-50', fg: 'text-emerald-700', bd: 'border-emerald-300', on: 'bg-emerald-600', onBd: 'border-emerald-700' };
        return            { bg: 'bg-amber-50',   fg: 'text-amber-700',   bd: 'border-amber-300',   on: 'bg-amber-600',   onBd: 'border-amber-700' };
    };

    const orientationLabels = (lv: number): { m: number; label: string; sub: string }[] => {
        if (lv === 0) return [{ m: 0,  label: 's', sub: 'sphere' }];
        if (lv === 1) return [
            { m:  0, label: 'pz', sub: 'along z' },
            { m:  1, label: 'px', sub: 'along x' },
            { m: -1, label: 'py', sub: 'along y' },
        ];
        if (lv === 2) return [
            { m:  0, label: 'dz²',     sub: 'z-axis + torus' },
            { m:  1, label: 'dxz',     sub: 'xz plane' },
            { m: -1, label: 'dyz',     sub: 'yz plane' },
            { m:  2, label: 'dx²-y²',  sub: 'on axes' },
            { m: -2, label: 'dxy',     sub: 'between axes' },
        ];
        return Array.from({ length: 2 * lv + 1 }, (_, i) => {
            const mv = i - lv;
            return { m: mv, label: `mₗ=${mv > 0 ? '+' + mv : mv}`, sub: '' };
        });
    };

    const setOrbital = (nv: number, lv: number, mv: number = 0) => {
        setN(nv); setL(lv); setM(mv);
    };

    const controlsCombo = (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Atom size={16} className="text-violet-600" />
                <span className="text-sm font-extrabold text-slate-800">Atomic Orbitals Bench</span>
                <span className="ml-auto font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2 py-0.5">
                    {orbitalLabel}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Pick subshell &nbsp;
                        <span className="text-slate-400 font-normal normal-case">(row = n · col = l)</span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2">
                        {Array.from({ length: MAX_N }, (_, i) => i + 1).map(nv => (
                            <div key={nv} className="flex items-center gap-1 mb-1 last:mb-0">
                                <span className="w-5 text-center text-[10px] font-bold text-slate-400 font-mono">{nv}</span>
                                {Array.from({ length: 4 }, (_, lv) => lv).map(lv => {
                                    const valid  = lv < nv;
                                    const active = n === nv && l === lv;
                                    const th     = subshellTheme(lv);
                                    if (!valid) {
                                        return <div key={lv} className="w-12 h-7 rounded-md" />;
                                    }
                                    return (
                                        <button key={lv} onClick={() => setOrbital(nv, lv, 0)}
                                            className={`w-12 h-7 rounded-md text-[11px] font-mono font-extrabold border transition-all ${
                                                active ? `${th.on} ${th.onBd} text-white shadow-md scale-105` : `${th.bg} ${th.bd} ${th.fg} hover:scale-105 hover:shadow`
                                            }`}
                                            title={`${nv}${orbitalLetter(lv)}`}>
                                            {nv}{orbitalLetter(lv)}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                        <div className="mt-1 text-[9px] text-slate-400 italic text-center">
                            Allowed: l = 0…n−1 · Empty cells violate the rule
                        </div>
                    </div>
                </div>

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Orientation &nbsp;
                        <span className="text-slate-400 font-normal normal-case">
                            ({(2 * l + 1)} orbital{l > 0 ? 's' : ''} in {n}{orbitalLetter(l)})
                        </span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2 flex flex-wrap gap-1.5">
                        {orientationLabels(l).map(({ m: mv, label, sub }) => {
                            const active = m === mv;
                            const th     = subshellTheme(l);
                            return (
                                <button key={mv} onClick={() => setM(mv)}
                                    className={`flex-1 min-w-[80px] px-2 py-1.5 rounded-lg border transition-all flex flex-col items-center ${
                                        active ? `${th.on} ${th.onBd} text-white shadow-md` : `bg-white ${th.bd} ${th.fg} hover:scale-105 hover:shadow`
                                    }`}
                                    title={`mₗ = ${mv > 0 ? '+' + mv : mv}`}>
                                    <span className="font-mono text-xs font-extrabold">{label}</span>
                                    <span className={`text-[9px] mt-0.5 ${active ? 'text-white/80' : 'opacity-60'}`}>
                                        mₗ={mv > 0 ? '+' + mv : mv}
                                    </span>
                                    {sub && (
                                        <span className={`text-[8px] mt-0.5 italic ${active ? 'text-white/70' : 'text-slate-400'}`}>
                                            {sub}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {l === 0 && (
                        <div className="text-[9px] text-slate-400 italic mt-1 text-center">
                            s-orbital is spherically symmetric — only one orientation exists.
                        </div>
                    )}
                </div>

                <div className="md:w-[150px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">View Modes</div>
                    <div className="flex flex-col gap-1.5">
                        <button onClick={() => setCrossSection(c => !c)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                crossSection ? 'bg-violet-600 text-white border-violet-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}>
                            <Layers size={12} /> Cross-section
                        </button>
                        <button onClick={() => setShowNodes(s => !s)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                showNodes ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}>
                            <Eye size={12} /> Show nodes
                        </button>
                        <button onClick={() => setShowProbability(p => !p)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                showProbability ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}>
                            <Atom size={12} /> Prob. cloud
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const statusBadge = (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-md text-xs font-bold">
            <Atom size={12} className="text-violet-600" />
            <span className="text-slate-500">Orbital:</span>
            <span className="text-violet-700 text-base font-extrabold font-mono">{orbitalLabel}</span>
            <span className="text-slate-300">|</span>
            <span className="text-red-700 font-mono">{radialNodes}R</span>
            <span className="text-blue-700 font-mono">{angularNodes}A</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700 font-mono">{totalNodes} total</span>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
            StatusBadgeComponent={statusBadge}
        />
    );
};

export default HydrogenOrbitalsLab;
