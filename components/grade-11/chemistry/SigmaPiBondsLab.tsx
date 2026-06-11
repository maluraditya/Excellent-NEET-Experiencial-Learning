import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Atom } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props { topic: Topic; onExit: () => void; }

const W = 1280, H = 760;
const CX = 640, CY = 380;

type OrbitalType = '1s' | '2pz' | '2px' | '2py';
type Result      = 'sigma' | 'pi' | 'destructive' | 'zero' | 'none';

interface OrbitalInfo { id: OrbitalType; label: string; geom: string; axis: 'iso' | 'z' | 'x' | 'y'; }
const ORBITALS: OrbitalInfo[] = [
    { id: '1s',  label: '1s',  geom: 'Spherical',     axis: 'iso' },
    { id: '2pz', label: '2pz', geom: 'Along z-axis',  axis: 'z' },
    { id: '2px', label: '2px', geom: '⊥ to z-axis',   axis: 'x' },
    { id: '2py', label: '2py', geom: '⊥ to z (depth)', axis: 'y' },
];

interface Example { key: string; pretty: string; a: OrbitalType; b: OrbitalType; flip: boolean; note: string; }
const EXAMPLES: Example[] = [
    { key: 'H2',     pretty: 'H₂  (1σ — s-s)',         a: '1s',  b: '1s',  flip: false, note: 'NCERT §4.5.4 s-s axial overlap.' },
    { key: 'HF',     pretty: 'HF  (1σ — s-p)',         a: '1s',  b: '2pz', flip: false, note: 'NCERT §4.5.4 s-p axial overlap.' },
    { key: 'F2',     pretty: 'F₂  (1σ — p-p)',         a: '2pz', b: '2pz', flip: false, note: 'NCERT §4.5.4 p-p head-on overlap.' },
    { key: 'C2H4',   pretty: 'Ethene π  (p-p lateral)', a: '2px', b: '2px', flip: false, note: 'NCERT Fig. 4.15: C=C contains 1 σ + 1 π.' },
    { key: 'destr',  pretty: 'Phase mismatch (no bond)', a: '2pz', b: '2pz', flip: true,  note: 'Destructive interference: + meets − ⇒ antibonding (no net bond).' },
    { key: 'ortho',  pretty: 'Orthogonal (no overlap)', a: '2pz', b: '2px', flip: false, note: 'Different symmetry (NCERT §4.7.2 condition 2) ⇒ zero overlap.' },
];

const SigmaPiBondsLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);
    const pulseRef  = useRef(0);

    const [orbA,     setOrbA]     = useState<OrbitalType>('1s');
    const [orbB,     setOrbB]     = useState<OrbitalType>('1s');
    const [distance, setDistance] = useState(110);
    const [flipB,    setFlipB]    = useState(false);
    const [paused,   setPaused]   = useState(false);

    const result: Result = useMemo(() => {
        if (distance > 200) return 'none';
        if (orbA === '1s' && orbB === '1s') return 'sigma';
        if ((orbA === '1s' && orbB === '2pz') || (orbA === '2pz' && orbB === '1s'))
            return flipB ? 'destructive' : 'sigma';
        if (orbA === '2pz' && orbB === '2pz')
            return flipB ? 'destructive' : 'sigma';
        if ((orbA === '2px' && orbB === '2px') || (orbA === '2py' && orbB === '2py'))
            return flipB ? 'destructive' : 'pi';
        return 'zero';
    }, [orbA, orbB, distance, flipB]);

    const potentialEnergy = useCallback((r: number, kind: Result): number => {
        if (kind === 'none' || kind === 'zero') return 0;
        const r0 = 75;
        const a  = 0.04;
        const U0 = kind === 'sigma' ? 420 : kind === 'pi' ? 220 : -180;
        if (kind === 'destructive') {
            return Math.max(0, 350 * Math.exp(-0.05 * (r - 30)));
        }
        const e = 1 - Math.exp(-a * (r - r0));
        return U0 * (e * e - 1);
    }, []);

    const currentEnergy = potentialEnergy(distance, result);

    const resultMeta = useMemo(() => {
        switch (result) {
            case 'sigma':       return { name: 'σ Bond formed',         sub: 'Head-on (axial) overlap',           color: '#16a34a', soft: '#d1fae5' };
            case 'pi':          return { name: 'π Bond formed',         sub: 'Sidewise (lateral) overlap',        color: '#2563eb', soft: '#dbeafe' };
            case 'destructive': return { name: 'Destructive (no bond)', sub: 'Phase mismatch — antibonding',      color: '#dc2626', soft: '#fee2e2' };
            case 'zero':        return { name: 'Zero net overlap',      sub: 'Orthogonal symmetries (§4.7.2)',     color: '#d97706', soft: '#fef3c7' };
            default:            return { name: 'Bring atoms closer',    sub: 'Slide internuclear distance down',  color: '#94a3b8', soft: '#f1f5f9' };
        }
    }, [result]);

    const handleReset = useCallback(() => {
        setOrbA('1s'); setOrbB('1s'); setDistance(110); setFlipB(false); setPaused(false);
    }, []);

    const setExample = useCallback((ex: Example) => {
        setOrbA(ex.a); setOrbB(ex.b); setFlipB(ex.flip); setDistance(110);
    }, []);

    const drawFrame = useCallback(() => {
        const cv = canvasRef.current; if (!cv) return;
        const ctx = cv.getContext('2d'); if (!ctx) return;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(100,116,139,0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        ctx.font      = '12px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`§4.5.4 Type of overlap depends on orbital geometry · §4.5.5 σ > π in strength`, 30, 76);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([10, 6]);
        ctx.beginPath(); ctx.moveTo(120, CY); ctx.lineTo(W - 120, CY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font      = 'bold 11px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('z (internuclear axis)', W - 220, CY - 8);

        const half = Math.max(0, Math.min(distance, 260)) * 1.4;
        const ax = CX - half;
        const bx = CX + half;

        ctx.font      = 'bold 11px monospace';
        ctx.fillStyle = '#475569';
        ctx.fillText(`r = ${distance} pm`, CX - 28, CY + 22);

        drawOrbital(ctx, ax, CY, orbA, false);
        drawOrbital(ctx, bx, CY, orbB, flipB);

        const overlapFrac = Math.max(0, Math.min(1, 1 - (distance - 30) / 180));
        if (overlapFrac > 0.05 && result !== 'none') {
            drawOverlap(ctx, ax, bx, CY, result, overlapFrac, pulseRef.current);
        }

        for (const [x] of [[ax], [bx]] as [number, number?][]) {
            ctx.beginPath();
            ctx.arc(x, CY, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.font      = 'bold 13px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText('A', ax, CY + 56);
        ctx.fillText('B', bx, CY + 56);
        ctx.textAlign = 'left';

        const bandY = H - 70;
        ctx.fillStyle = resultMeta.soft;
        const padX = 60;
        ctx.beginPath();
        const radius = 14;
        const bw = W - padX * 2, bh = 52;
        ctx.moveTo(padX + radius, bandY);
        ctx.arcTo(padX + bw, bandY,        padX + bw, bandY + bh, radius);
        ctx.arcTo(padX + bw, bandY + bh,   padX,      bandY + bh, radius);
        ctx.arcTo(padX,      bandY + bh,   padX,      bandY,       radius);
        ctx.arcTo(padX,      bandY,        padX + bw, bandY,       radius);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = resultMeta.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font      = 'bold 18px sans-serif';
        ctx.fillStyle = resultMeta.color;
        ctx.textAlign = 'center';
        ctx.fillText(resultMeta.name, CX, bandY + 22);
        ctx.font      = '12px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(resultMeta.sub, CX, bandY + 40);
        ctx.textAlign = 'left';
    }, [orbA, orbB, distance, flipB, result, resultMeta]);

    function drawOrbital(ctx: CanvasRenderingContext2D, x: number, y: number, type: OrbitalType, flip: boolean) {
        const posColor = flip ? '#ef4444' : '#3b82f6';
        const negColor = flip ? '#3b82f6' : '#ef4444';

        if (type === '1s') {
            const col = flip ? '#ef4444' : '#3b82f6';
            const grad = ctx.createRadialGradient(x, y, 4, x, y, 65);
            grad.addColorStop(0, col + 'EE');
            grad.addColorStop(0.5, col + '80');
            grad.addColorStop(1, col + '00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, 65, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = col + '60';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.font      = 'bold 14px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(flip ? '−' : '+', x, y + 5);
            ctx.textAlign = 'left';
            return;
        }

        const drawLobe = (lobeAng: number, color: string, sign: '+' | '-') => {
            const lobeR = 70, lobeW = 35;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(lobeAng);
            ctx.translate(lobeR * 0.6, 0);

            const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, lobeR);
            grad.addColorStop(0, color + 'EE');
            grad.addColorStop(0.55, color + '90');
            grad.addColorStop(1, color + '00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(0, 0, lobeR, lobeW, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = color + '70';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font      = 'bold 14px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(sign, 0, 5);
            ctx.textAlign = 'left';
            ctx.restore();
        };

        if (type === '2pz') {
            drawLobe(0,        posColor, '+');
            drawLobe(Math.PI,  negColor, '-');
        } else if (type === '2px') {
            drawLobe(-Math.PI / 2, posColor, '+');
            drawLobe( Math.PI / 2, negColor, '-');
        } else {
            ctx.save();
            ctx.translate(x, y);
            ctx.globalAlpha = 0.55;
            const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
            grad.addColorStop(0, posColor + 'CC');
            grad.addColorStop(1, posColor + '00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, 38, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.font      = 'bold 11px monospace';
            ctx.fillStyle = '#475569';
            ctx.textAlign = 'center';
            ctx.fillText('2py (depth)', 0, 55);
            ctx.textAlign = 'left';
            ctx.restore();
        }
    }

    function drawOverlap(ctx: CanvasRenderingContext2D, ax: number, bx: number, y: number, kind: Result, frac: number, pulse: number) {
        const mx = (ax + bx) / 2;
        const pulseScale = 1 + 0.08 * Math.sin(pulse * 3);

        if (kind === 'sigma') {
            const wid = Math.abs(bx - ax) * 0.55;
            const ht  = 36 * pulseScale;
            const grad = ctx.createRadialGradient(mx, y, 6, mx, y, wid);
            grad.addColorStop(0, `rgba(22,163,74,${0.7 * frac})`);
            grad.addColorStop(0.5, `rgba(22,163,74,${0.35 * frac})`);
            grad.addColorStop(1, 'rgba(22,163,74,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(mx, y, wid, ht, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.font      = 'bold 12px sans-serif';
            ctx.fillStyle = '#15803d';
            ctx.textAlign = 'center';
            ctx.fillText('σ overlap', mx, y - ht - 8);
            ctx.textAlign = 'left';
        } else if (kind === 'pi') {
            const wid = Math.abs(bx - ax) * 0.55;
            const ht  = 22 * pulseScale;
            const off = 52;
            for (const dy of [-off, off]) {
                const grad = ctx.createRadialGradient(mx, y + dy, 4, mx, y + dy, wid);
                grad.addColorStop(0, `rgba(37,99,235,${0.65 * frac})`);
                grad.addColorStop(0.6, `rgba(37,99,235,${0.3 * frac})`);
                grad.addColorStop(1, 'rgba(37,99,235,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(mx, y + dy, wid, ht, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([3, 4]);
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(ax - 40, y); ctx.lineTo(bx + 40, y); ctx.stroke();
            ctx.setLineDash([]);
            ctx.font      = '10px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('nodal plane', bx + 44, y + 4);
            ctx.font      = 'bold 12px sans-serif';
            ctx.fillStyle = '#1d4ed8';
            ctx.textAlign = 'center';
            ctx.fillText('π overlap (above + below plane)', mx, y - off - ht - 4);
            ctx.textAlign = 'left';
        } else if (kind === 'destructive') {
            const wid = Math.abs(bx - ax) * 0.55;
            ctx.strokeStyle = `rgba(220,38,38,${0.9 * frac})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mx - 14, y - 14); ctx.lineTo(mx + 14, y + 14); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(mx + 14, y - 14); ctx.lineTo(mx - 14, y + 14); ctx.stroke();
            ctx.strokeStyle = `rgba(220,38,38,${0.5 * frac})`;
            ctx.setLineDash([5, 4]);
            ctx.beginPath(); ctx.moveTo(mx, y - wid * 0.5); ctx.lineTo(mx, y + wid * 0.5); ctx.stroke();
            ctx.setLineDash([]);
            ctx.font      = 'bold 12px sans-serif';
            ctx.fillStyle = '#b91c1c';
            ctx.textAlign = 'center';
            ctx.fillText('+ / − cancel', mx, y - 26);
            ctx.textAlign = 'left';
        } else if (kind === 'zero') {
            ctx.strokeStyle = `rgba(217,119,6,${0.7 * frac})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(mx, y, 32, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font      = 'bold 12px sans-serif';
            ctx.fillStyle = '#b45309';
            ctx.textAlign = 'center';
            ctx.fillText('Σ overlap = 0', mx, y - 38);
            ctx.textAlign = 'left';
        }
    }

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

    const energyCard = useMemo(() => {
        const svgW = 320, svgH = 170;
        const padL = 38, padR = 14, padT = 16, padB = 26;
        const pw = svgW - padL - padR;
        const ph = svgH - padT - padB;
        const rMin = 30, rMax = 260;
        const samples: { r: number; u: number }[] = [];
        for (let i = 0; i <= 80; i++) {
            const r = rMin + (rMax - rMin) * (i / 80);
            samples.push({ r, u: potentialEnergy(r, result) });
        }
        const uMin = Math.min(-500, ...samples.map(s => s.u)) * 1.05;
        const uMax = Math.max( 500, ...samples.map(s => s.u)) * 1.05;
        const xOf = (r: number) => padL + ((r - rMin) / (rMax - rMin)) * pw;
        const yOf = (u: number) => padT + ph - ((u - uMin) / (uMax - uMin)) * ph;
        const y0  = yOf(0);
        const path = samples.map((s, i) => `${i === 0 ? 'M' : 'L'}${xOf(s.r).toFixed(1)},${yOf(s.u).toFixed(1)}`).join(' ');
        const curX = xOf(distance);
        const curY = yOf(currentEnergy);

        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="text-base font-extrabold text-slate-900">Potential Energy Curve</div>
                <div className="text-xs font-semibold text-slate-500 mb-1">Morse well — minimum at equilibrium bond length</div>
                <svg width={svgW} height={svgH} className="block">
                    <line x1={padL} y1={padT} x2={padL} y2={padT + ph} stroke="#475569" strokeWidth={1.5} />
                    <line x1={padL} y1={padT + ph} x2={padL + pw} y2={padT + ph} stroke="#475569" strokeWidth={1.5} />
                    <line x1={padL} y1={y0} x2={padL + pw} y2={y0} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
                    <text x={padL - 6} y={padT + 8}   fill="#64748b" fontSize={9} textAnchor="end">+U</text>
                    <text x={padL - 6} y={padT + ph}  fill="#64748b" fontSize={9} textAnchor="end">−U</text>
                    <text x={padL + pw / 2} y={padT + ph + 16} fill="#475569" fontSize={10} textAnchor="middle">r (pm)</text>

                    <path d={path} fill="none" stroke={resultMeta.color} strokeWidth={2.2} />

                    <line x1={curX} y1={padT} x2={curX} y2={padT + ph} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4 3" />
                    <circle cx={curX} cy={curY} r={5} fill={resultMeta.color} stroke="white" strokeWidth={1.5} />
                    <text x={curX} y={curY - 8} fill={resultMeta.color} fontSize={10} fontWeight="bold" textAnchor="middle">
                        {currentEnergy >= 0 ? '+' : ''}{currentEnergy.toFixed(0)} kJ/mol
                    </text>
                </svg>
            </div>
        );
    }, [distance, result, currentEnergy, resultMeta, potentialEnergy]);

    const strengthCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Bond Strength</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §4.5.5 — σ &gt; π (extent of overlap)</div>
            <div className="flex flex-col gap-1.5">
                {[
                    { lab: 'σ (head-on)',     pct: 100, col: '#16a34a', bg: '#d1fae5' },
                    { lab: 'π (lateral)',     pct: 52,  col: '#2563eb', bg: '#dbeafe' },
                    { lab: 'Antibonding (σ*)', pct: -30, col: '#dc2626', bg: '#fee2e2' },
                ].map(r => (
                    <div key={r.lab} className="rounded-lg border border-slate-100 px-2 py-1.5" style={{ backgroundColor: r.bg }}>
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-slate-800">{r.lab}</span>
                            <span style={{ color: r.col }} className="font-mono">{r.pct > 0 ? `${r.pct}%` : 'repulsive'}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-white rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(0, r.pct)}%`, backgroundColor: r.col }} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-[10px] text-slate-500 italic leading-snug">
                σ has larger overlap → more electron density between nuclei → stronger bond.
            </div>
        </div>
    );

    const multipleBondsCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Multiple Bonds</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §4.5.5 — π always with a σ</div>
            <table className="w-full text-[11px]">
                <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                        <th className="text-left py-1">Type</th>
                        <th className="text-left py-1">Composition</th>
                        <th className="text-right py-1">Example</th>
                    </tr>
                </thead>
                <tbody className="font-mono">
                    <tr><td className="py-1 text-slate-700">Single</td><td className="text-emerald-700 font-bold">1 σ</td><td className="text-right text-slate-600">H–H</td></tr>
                    <tr className="border-t border-slate-100"><td className="py-1 text-slate-700">Double</td><td className="text-emerald-700 font-bold">1 σ + 1 π</td><td className="text-right text-slate-600">C=C (ethene)</td></tr>
                    <tr className="border-t border-slate-100"><td className="py-1 text-slate-700">Triple</td><td className="text-emerald-700 font-bold">1 σ + 2 π</td><td className="text-right text-slate-600">C≡C (ethyne)</td></tr>
                </tbody>
            </table>
            <div className="mt-2 text-[10px] text-slate-500 leading-snug">
                Ethene C=C: 134 pm. Ethyne C≡C shorter (NCERT Fig. 4.15).
            </div>
        </div>
    );

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                {energyCard}
                {strengthCard}
                {multipleBondsCard}
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">

                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl">
                    <div className="text-base font-extrabold text-violet-900">σ vs π Overlap</div>
                    <div className="text-xs font-semibold text-violet-600 mb-2">NCERT §4.5.4–4.5.5</div>
                    <table className="w-full text-[11px] mb-2">
                        <thead>
                            <tr className="text-violet-500 border-b border-violet-200">
                                <th className="text-left py-1">Feature</th>
                                <th className="text-left py-1 text-emerald-700">σ</th>
                                <th className="text-left py-1 text-blue-700">π</th>
                            </tr>
                        </thead>
                        <tbody className="text-violet-900">
                            <tr><td className="py-1">Overlap</td><td>Head-on</td><td>Sidewise</td></tr>
                            <tr className="border-t border-violet-100"><td className="py-1">Axis ∥</td><td>z-axis</td><td>⊥ to z</td></tr>
                            <tr className="border-t border-violet-100"><td className="py-1">Strength</td><td>Stronger</td><td>Weaker</td></tr>
                            <tr className="border-t border-violet-100"><td className="py-1">e⁻ density</td><td>On axis</td><td>Above + below</td></tr>
                            <tr className="border-t border-violet-100"><td className="py-1">Symmetry</td><td>Around axis</td><td>Has node</td></tr>
                        </tbody>
                    </table>
                    <div className="rounded-xl border border-violet-300 bg-white/80 p-2.5">
                        <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">σ combinations</div>
                        <div className="text-[11px] text-slate-700 mt-1">s–s · s–p · p–p (along z)</div>
                        <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wider mt-2">π combinations</div>
                        <div className="text-[11px] text-slate-700 mt-1">2pₓ–2pₓ · 2pᵧ–2pᵧ (parallel)</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">LIVE</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="rounded-lg border border-slate-100 px-3 py-2" style={{ backgroundColor: resultMeta.soft }}>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Result</div>
                            <div className="mt-0.5 font-mono text-base font-extrabold" style={{ color: resultMeta.color }}>
                                {resultMeta.name}
                            </div>
                            <div className="text-[9px] mt-0.5" style={{ color: resultMeta.color }}>{resultMeta.sub}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                                <div className="text-[9px] font-bold uppercase text-slate-400">Atom A</div>
                                <div className="font-mono text-sm font-extrabold text-slate-800">{orbA}</div>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                                <div className="text-[9px] font-bold uppercase text-slate-400">Atom B</div>
                                <div className="font-mono text-sm font-extrabold text-slate-800">{orbB}{flipB ? ' (flipped)' : ''}</div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Distance</div>
                            <div className="mt-0.5 font-mono text-base font-extrabold text-amber-700">{distance} pm</div>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-violet-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Potential Energy U(r)</div>
                            <div className="mt-0.5 font-mono text-base font-extrabold text-violet-700">
                                {currentEnergy >= 0 ? '+' : ''}{currentEnergy.toFixed(0)} kJ/mol
                            </div>
                            <div className="text-[9px] text-violet-500">{currentEnergy < -50 ? 'Bound — stable region' : currentEnergy > 50 ? 'Repulsive' : 'Far / non-interacting'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const inCanvasStatus = (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-md text-xs font-bold"
             style={{ borderColor: resultMeta.color + '60' }}>
            <Atom size={12} style={{ color: resultMeta.color }} />
            <span className="font-mono text-slate-700">{orbA}</span>
            <span className="text-slate-400">+</span>
            <span className="font-mono text-slate-700">{orbB}{flipB ? ' (−)' : ''}</span>
            <span className="text-slate-300">|</span>
            <span className="text-base font-extrabold" style={{ color: resultMeta.color }}>
                {resultMeta.name}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700 font-mono">{distance} pm</span>
        </div>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
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

    const orbitalChip = (id: OrbitalType, label: string, geom: string, current: OrbitalType, setter: (o: OrbitalType) => void) => {
        const active = id === current;
        return (
            <button key={id} onClick={() => setter(id)}
                className={`flex-1 min-w-[64px] px-2 py-1.5 rounded-lg border transition-all flex flex-col items-center ${
                    active ? 'bg-violet-600 text-white border-violet-700 shadow-md scale-105' : 'bg-white text-violet-700 border-violet-200 hover:scale-105 hover:shadow'
                }`}>
                <span className="font-mono text-sm font-extrabold">{label}</span>
                <span className={`text-[9px] mt-0.5 ${active ? 'text-white/85' : 'text-slate-500'}`}>{geom}</span>
            </button>
        );
    };

    const controlsCombo = (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Atom size={16} className="text-violet-600" />
                <span className="text-sm font-extrabold text-slate-800">σ / π Overlap Bench</span>
                <span className="ml-auto font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2 py-0.5">
                    {orbA} + {orbB}{flipB ? ' flipped' : ''} → {resultMeta.name}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1.2fr_auto] gap-3">

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Atom A orbital</div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2 flex flex-wrap gap-1.5">
                        {ORBITALS.map(o => orbitalChip(o.id, o.label, o.geom, orbA, setOrbA))}
                    </div>
                </div>

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Atom B orbital</div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2 flex flex-wrap gap-1.5">
                        {ORBITALS.map(o => orbitalChip(o.id, o.label, o.geom, orbB, setOrbB))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Internuclear distance</label>
                            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 rounded">{distance} pm</span>
                        </div>
                        <input type="range" min={30} max={260} step={2} value={distance}
                            onChange={e => setDistance(Number(e.target.value))}
                            className="w-full accent-amber-600 h-1.5 cursor-pointer" />
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                            <span>30</span><span>110</span><span>260 pm</span>
                        </div>
                    </div>
                    <button onClick={() => setFlipB(f => !f)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                            flipB ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}>
                        {flipB ? 'B flipped (phase −)' : 'Flip B phase'}
                    </button>
                </div>

                <div className="md:w-[170px]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">NCERT Examples</div>
                    <div className="flex flex-col gap-1">
                        {EXAMPLES.map(ex => (
                            <button key={ex.key} onClick={() => setExample(ex)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-colors text-left"
                                title={ex.note}>
                                {ex.pretty}
                            </button>
                        ))}
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

export default SigmaPiBondsLab;
