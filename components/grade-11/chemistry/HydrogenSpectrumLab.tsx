import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

// ─── NCERT Constants (Chapter 2, Structure of Atom) ─────────────────────────
const RH_EV        = 13.6;    // Rydberg constant in eV (NCERT Eq. 2.13)
const RYDBERG_CM   = 109677;  // Rydberg constant in cm⁻¹ (NCERT Eq. 2.9)
const BOHR_RADIUS  = 52.9;    // a₀ = 52.9 pm (NCERT Eq. 2.12)
const HC_EV_NM     = 1240;    // hc ≈ 1240 eV·nm
const MAX_N        = 6;

// ─── Physics Helpers ─────────────────────────────────────────────────────────
const getEnergy    = (n: number) => -RH_EV / (n * n);
const getRadius_pm = (n: number) => n * n * BOHR_RADIUS;
const getWavelength = (ni: number, nf: number) =>
    HC_EV_NM / Math.abs(getEnergy(nf) - getEnergy(ni));
const getWavenumber = (lambda_nm: number) => 1e7 / lambda_nm;
const getSeriesName = (nf: number) =>
    ({ 1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett', 5: 'Pfund' } as Record<number, string>)[nf] ?? 'Higher';
const getRegion = (λ: number): 'UV' | 'Visible' | 'IR' =>
    λ < 400 ? 'UV' : λ <= 750 ? 'Visible' : 'IR';
const getPhotonColor = (λ: number): string => {
    if (λ < 400)  return '#7c3aed';
    if (λ < 440)  return '#8b5cf6';
    if (λ < 490)  return '#2563eb';
    if (λ < 510)  return '#0891b2';
    if (λ < 580)  return '#16a34a';
    if (λ < 600)  return '#ca8a04';
    if (λ < 650)  return '#ea580c';
    if (λ <= 750) return '#dc2626';
    return '#f97316';
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface SpectralLine {
    id: number; ni: number; nf: number;
    lambda: number; wavenumber: number; deltaE: number;
    color: string; series: string; region: 'UV' | 'Visible' | 'IR';
}
interface AnimState {
    type: 'absorb' | 'emit'; ni: number; nf: number;
    lambda: number; color: string; progress: number;
    pendingLine?: SpectralLine;
}
interface Props { topic: Topic; onExit: () => void; }

// ─── Canvas Constants ────────────────────────────────────────────────────────
const CX = 640, CY = 390; // nucleus centre on 1280×760 canvas
const ORBIT_R = [0, 52, 98, 148, 192, 230, 262]; // index = n
const ORBIT_SPD = [0, 2.0, 0.72, 0.38, 0.24, 0.16, 0.11]; // rad/s

const HydrogenSpectrumLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);
    const S = useRef({ angle: 0, n: 1, anim: null as AnimState | null, paused: false, speed: 1 });

    const [currentN,      setCurrentN]      = useState(1);
    const [spectralLines, setSpectralLines] = useState<SpectralLine[]>([]);
    const [lastLine,      setLastLine]      = useState<SpectralLine | null>(null);
    const [mode,          setMode]          = useState<'emission' | 'absorption'>('emission');
    const [paused,        setPaused]        = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [speed,         setSpeed]         = useState(1);
    const [demoRunning,   setDemoRunning]   = useState(false);

    useEffect(() => { S.current.n      = currentN; }, [currentN]);
    useEffect(() => { S.current.paused = paused;   }, [paused]);
    useEffect(() => { S.current.speed  = speed;    }, [speed]);

    const drawFrame = useCallback((angle: number, n: number, anim: AnimState | null) => {
        const cv = canvasRef.current; if (!cv) return;
        const ctx = cv.getContext('2d'); if (!ctx) return;
        const W = 1280, H = 760;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(100,116,139,0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('Bohr Model of the Hydrogen Atom', CX, 28);
        ctx.textAlign = 'left';

        for (let i = 1; i <= MAX_N; i++) {
            const r = ORBIT_R[i];
            const active = i === n;
            ctx.beginPath();
            ctx.arc(CX, CY, r, 0, Math.PI * 2);
            ctx.setLineDash([6, 5]);
            ctx.strokeStyle = active ? '#0369a1' : '#e2e8f0';
            ctx.lineWidth   = active ? 2.5 : 1;
            ctx.stroke();
            ctx.setLineDash([]);

            const lx = CX + r + 7;
            ctx.font      = active ? 'bold 12px monospace' : '11px monospace';
            ctx.fillStyle = active ? '#0369a1' : '#94a3b8';
            ctx.fillText(`n=${i}`, lx, CY + 4);

            if (active) {
                ctx.font      = '10px monospace';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(`r = ${getRadius_pm(i).toFixed(0)} pm`, lx, CY + 18);
            }
        }

        {
            const r = ORBIT_R[MAX_N] + 38;
            ctx.beginPath();
            ctx.arc(CX, CY, r, 0, Math.PI * 2);
            ctx.setLineDash([3, 8]);
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font      = '10px monospace';
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText('n=∞  (ionised)', CX + r + 7, CY + 4);
        }

        ctx.beginPath();
        ctx.arc(CX, CY, 14, 0, Math.PI * 2);
        ctx.fillStyle  = '#d97706';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur  = 22;
        ctx.fill();
        ctx.shadowBlur  = 0;
        ctx.font        = 'bold 10px sans-serif';
        ctx.fillStyle   = '#ffffff';
        ctx.textAlign   = 'center';
        ctx.fillText('H⁺', CX, CY + 4);
        ctx.textAlign   = 'left';

        const eR = ORBIT_R[n];
        const ex = CX + eR * Math.cos(angle);
        const ey = CY + eR * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(ex, ey, 9, 0, Math.PI * 2);
        ctx.fillStyle   = '#0369a1';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur  = 22;
        ctx.fill();
        ctx.shadowBlur  = 0;
        ctx.font        = 'bold 9px sans-serif';
        ctx.fillStyle   = '#ffffff';
        ctx.textAlign   = 'center';
        ctx.fillText('e⁻', ex, ey + 3);
        ctx.textAlign   = 'left';

        if (anim) {
            const r1 = ORBIT_R[anim.ni], r2 = ORBIT_R[anim.nf];
            const midR = (r1 + r2) / 2;
            const startA = -Math.PI * 0.7, endA = -Math.PI * 0.3;
            ctx.beginPath();
            ctx.arc(CX, CY, midR, startA, endA, anim.type === 'absorb');
            ctx.strokeStyle = anim.color + '90';
            ctx.lineWidth   = 2;
            ctx.setLineDash([5, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            const arrowA = anim.type === 'absorb' ? startA : endA;
            const ax = CX + midR * Math.cos(arrowA);
            const ay = CY + midR * Math.sin(arrowA);
            ctx.beginPath();
            ctx.arc(ax, ay, 4, 0, Math.PI * 2);
            ctx.fillStyle = anim.color;
            ctx.fill();
        }

        if (anim) {
            const t = anim.progress;
            const targetX = ex, targetY = ey;
            let px: number, py: number;

            if (anim.type === 'absorb') {
                const sx = 80, sy = CY;
                const mx = (sx + targetX) / 2, my = Math.min(sy, targetY) - 70;
                px = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * mx + t * t * targetX;
                py = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * my + t * t * targetY;
            } else {
                const dx = W - 80, dy = CY;
                const mx = (targetX + dx) / 2, my = Math.min(targetY, dy) - 60;
                px = (1 - t) * (1 - t) * targetX + 2 * (1 - t) * t * mx + t * t * dx;
                py = (1 - t) * (1 - t) * targetY + 2 * (1 - t) * t * my + t * t * dy;
            }

            const pulse = 7 + 3 * Math.sin(t * Math.PI * 10);
            ctx.beginPath();
            ctx.arc(px, py, pulse, 0, Math.PI * 2);
            ctx.fillStyle   = anim.color;
            ctx.shadowColor = anim.color;
            ctx.shadowBlur  = 28;
            ctx.fill();
            ctx.shadowBlur  = 0;

            ctx.beginPath();
            ctx.arc(px, py, pulse + 6, 0, Math.PI * 2);
            ctx.strokeStyle = anim.color + '55';
            ctx.lineWidth   = 1.5;
            ctx.stroke();

            if (t > 0.1 && t < 0.9) {
                ctx.font      = '10px monospace';
                ctx.fillStyle = anim.color;
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.round(anim.lambda)} nm`, px, py - pulse - 8);
                ctx.textAlign = 'left';
            }
        }
    }, []);

    useEffect(() => {
        let lastT = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - lastT) / 1000, 0.1);
            lastT = now;
            const s = S.current;
            if (!s.paused) {
                s.angle += ORBIT_SPD[s.n] * dt * s.speed;
                if (s.anim) {
                    s.anim.progress = Math.min(s.anim.progress + dt / 0.65, 1);
                }
            }
            drawFrame(s.angle, s.n, s.anim);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, [drawFrame]);

    const ANIM_MS = 680;

    const handleExcite = useCallback((target: number) => {
        if (S.current.anim) return;
        const ni = S.current.n;
        if (target <= ni || target > MAX_N) return;
        const λ = getWavelength(ni, target);
        S.current.anim = { type: 'absorb', ni, nf: target, lambda: λ, color: getPhotonColor(λ), progress: 0 };
        setTransitioning(true);
        setTimeout(() => {
            S.current.anim = null;
            S.current.n    = target;
            setCurrentN(target);
            setTransitioning(false);
        }, ANIM_MS);
    }, []);

    const handleEmit = useCallback((target: number) => {
        if (S.current.anim) return;
        const ni = S.current.n;
        if (target >= ni) return;
        const λ  = getWavelength(ni, target);
        const wn = Math.round(getWavenumber(λ));
        const dE = Math.round(Math.abs(getEnergy(target) - getEnergy(ni)) * 1000) / 1000;
        const line: SpectralLine = {
            id: Date.now(), ni, nf: target,
            lambda: Math.round(λ * 10) / 10, wavenumber: wn, deltaE: dE,
            color: getPhotonColor(λ), series: getSeriesName(target), region: getRegion(λ)
        };
        S.current.anim = { type: 'emit', ni, nf: target, lambda: λ, color: getPhotonColor(λ), progress: 0, pendingLine: line };
        setTransitioning(true);
        setTimeout(() => {
            S.current.anim = null;
            S.current.n    = target;
            setSpectralLines(p => [...p, line]);
            setLastLine(line);
            setCurrentN(target);
            setTransitioning(false);
        }, ANIM_MS);
    }, []);

    const handleReset = useCallback(() => {
        S.current.anim = null; S.current.n = 1; S.current.angle = 0;
        setCurrentN(1); setTransitioning(false);
        setSpectralLines([]); setLastLine(null); setDemoRunning(false);
    }, []);

    const handleShowBalmer = useCallback(async () => {
        if (demoRunning) return;
        setDemoRunning(true);
        handleReset();
        await new Promise(r => setTimeout(r, 400));

        for (const [ni, nf] of [[6, 2], [5, 2], [4, 2], [3, 2]] as [number, number][]) {
            S.current.n = ni; setCurrentN(ni);
            await new Promise(r => setTimeout(r, 200));

            const λ  = getWavelength(ni, nf);
            const wn = Math.round(getWavenumber(λ));
            const dE = Math.round(Math.abs(getEnergy(nf) - getEnergy(ni)) * 1000) / 1000;
            const line: SpectralLine = {
                id: Date.now() + ni * 100, ni, nf,
                lambda: Math.round(λ * 10) / 10, wavenumber: wn, deltaE: dE,
                color: getPhotonColor(λ), series: getSeriesName(nf), region: getRegion(λ)
            };
            S.current.anim = { type: 'emit', ni, nf, lambda: λ, color: getPhotonColor(λ), progress: 0, pendingLine: line };
            setTransitioning(true);

            await new Promise(r => setTimeout(r, ANIM_MS));
            S.current.anim = null;
            S.current.n    = nf;
            setSpectralLines(p => [...p, line]);
            setLastLine(line);
            setCurrentN(nf);
            setTransitioning(false);

            await new Promise(r => setTimeout(r, 200));
        }
        setDemoRunning(false);
    }, [demoRunning, handleReset]);

    const svgW = 300, svgH = 480;
    const padL = 72, padR = 58, padT = 28, padB = 28;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;
    const EMin = -15.2, EMax = 1.2;
    const eToY = (e: number) => padT + plotH * (1 - (e - EMin) / (EMax - EMin));

    const LEVELS = [
        { n: 1, e: getEnergy(1) }, { n: 2, e: getEnergy(2) }, { n: 3, e: getEnergy(3) },
        { n: 4, e: getEnergy(4) }, { n: 5, e: getEnergy(5) }, { n: 6, e: getEnergy(6) },
    ];

    const energyCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Energy Level Diagram</div>
            <div className="text-xs font-semibold text-slate-500 mb-1">NCERT Fig. 2.11 — Ch. 2 Structure of Atom</div>
            <svg width={svgW} height={svgH} className="block overflow-visible">
                <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#94a3b8" strokeWidth={1.5} />
                <text x={11} y={padT + plotH / 2} textAnchor="middle" fill="#475569" fontSize={10} fontWeight="bold"
                    transform={`rotate(-90, 11, ${padT + plotH / 2})`}>Energy (eV)</text>

                {(() => {
                    const y = eToY(0);
                    return (
                        <g>
                            <line x1={padL} y1={y} x2={padL + plotW} y2={y} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />
                            <text x={padL - 4} y={y + 4} textAnchor="end" fill="#64748b" fontSize={9}>n=∞</text>
                            <text x={padL + plotW + 3} y={y + 4} fill="#64748b" fontSize={9}>0.00 eV</text>
                            <text x={padL + plotW / 2} y={y - 5} textAnchor="middle" fill="#94a3b8" fontSize={8} fontStyle="italic">Ionised H (E=0)</text>
                        </g>
                    );
                })()}

                {LEVELS.map(({ n, e }) => {
                    const y      = eToY(e);
                    const active = n === currentN;
                    const color  = active ? '#0369a1' : '#64748b';
                    const labelX = (n >= 3 && n % 2 === 0) ? padL + plotW + 3 : padL - 4;
                    const labelAnchor = (n >= 3 && n % 2 === 0) ? 'start' : 'end';
                    return (
                        <g key={n}>
                            <line x1={padL} y1={y} x2={padL + plotW} y2={y}
                                stroke={active ? '#0369a1' : '#cbd5e1'} strokeWidth={active ? 2.5 : 1.5} />
                            <text x={labelX} y={y + 4} textAnchor={labelAnchor as 'start' | 'end'}
                                fill={color} fontSize={active ? 10 : 9} fontWeight={active ? 'bold' : 'normal'}>n={n}</text>
                            {n <= 4 && (
                                <text x={padL + plotW + (n % 2 === 0 ? 3 : -3)} y={y + 4}
                                    textAnchor={n % 2 === 0 ? 'start' : 'end'} fill={color} fontSize={8}>
                                    {e.toFixed(2)} eV
                                </text>
                            )}
                        </g>
                    );
                })}

                {[
                    { nf: 1, label: '← Lyman', sublabel: 'UV', color: '#7c3aed' },
                    { nf: 2, label: '← Balmer', sublabel: 'Visible', color: '#0891b2' },
                    { nf: 3, label: '← Paschen', sublabel: 'IR', color: '#ea580c' },
                ].map(({ nf, label, sublabel, color }) => {
                    const yBot = eToY(getEnergy(nf));
                    const yTop = eToY(getEnergy(nf + 1));
                    const midY = (yBot + yTop) / 2;
                    return (
                        <g key={nf}>
                            <rect x={padL + 4} y={yTop} width={plotW * 0.38} height={yBot - yTop} fill={color} opacity={0.07} rx={2} />
                            <text x={padL + 7} y={midY - 4} fill={color} fontSize={9} fontWeight="bold">{label}</text>
                            <text x={padL + 7} y={midY + 8} fill={color} fontSize={8}>{sublabel}</text>
                        </g>
                    );
                })}

                {lastLine && (() => {
                    const y1 = eToY(getEnergy(lastLine.ni));
                    const y2 = eToY(getEnergy(lastLine.nf));
                    const x  = padL + plotW * 0.62;
                    const mid = (y1 + y2) / 2;
                    const markId = `arr-${lastLine.id}`;
                    return (
                        <g>
                            <defs>
                                <marker id={markId} markerWidth={7} markerHeight={7} refX={5} refY={3.5} orient="auto">
                                    <path d="M0,0 L7,3.5 L0,7 Z" fill={lastLine.color} />
                                </marker>
                            </defs>
                            <line x1={x} y1={y1} x2={x} y2={y2 + 8} stroke={lastLine.color} strokeWidth={2.5} markerEnd={`url(#${markId})`} />
                            <text x={x + 5} y={mid - 2} fill={lastLine.color} fontSize={9} fontWeight="bold">{lastLine.series}</text>
                            <text x={x + 5} y={mid + 11} fill={lastLine.color} fontSize={8}>{lastLine.lambda} nm</text>
                        </g>
                    );
                })()}
            </svg>
        </div>
    );

    const SPW = 288, SPH = 150;
    const LMIN = 90, LMAX = 1100;
    const toX = (λ: number) =>
        10 + ((Math.min(Math.max(λ, LMIN), LMAX) - LMIN) / (LMAX - LMIN)) * (SPW - 20);
    const x400 = toX(400), x750 = toX(750);

    const spectrometerCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="flex items-center justify-between mb-1">
                <div>
                    <div className="text-base font-extrabold text-slate-900">Spectrometer</div>
                    <div className="text-xs font-semibold text-slate-500">
                        {mode === 'emission' ? 'Emission: bright lines on black' : 'Absorption: dark lines on rainbow'}
                    </div>
                </div>
                {spectralLines.length > 0 && (
                    <button onClick={() => setSpectralLines([])}
                        className="text-[9px] font-bold text-slate-400 hover:text-slate-600 border border-slate-200 rounded px-2 py-0.5">
                        CLEAR
                    </button>
                )}
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-200" style={{ width: SPW, height: SPH }}>
                {mode === 'emission' ? (
                    <div className="absolute inset-0 bg-black" />
                ) : (
                    <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(to right, #7c3aed55 0%, #4f46e5 8%, #2563eb 18%, #0891b2 28%, #16a34a 42%, #ca8a04 55%, #dc2626 68%, transparent 100%)' }} />
                )}

                <div className="absolute top-0 bottom-8" style={{ left: 0, width: x400 }}>
                    {mode === 'emission' && <div className="absolute inset-0 bg-violet-950 opacity-70" />}
                    <div className="absolute top-1 left-1.5 text-[8px] font-bold text-violet-400 z-10">UV</div>
                </div>

                <div className="absolute top-0 bottom-8" style={{ left: x750, right: 0 }}>
                    {mode === 'emission' && <div className="absolute inset-0 bg-orange-950 opacity-60" />}
                    <div className="absolute top-1 left-1.5 text-[8px] font-bold text-orange-400 z-10">IR</div>
                </div>

                <div className="absolute top-1 text-[8px] font-bold text-white z-10" style={{ left: (x400 + x750) / 2 - 14 }}>VISIBLE</div>

                {[x400, x750].map((x, i) => (
                    <div key={i} className="absolute top-0 bottom-8 w-px bg-white/30 z-10" style={{ left: x }} />
                ))}

                {spectralLines.map(line => {
                    const lx = toX(line.lambda);
                    if (mode === 'emission') {
                        return (
                            <div key={line.id}
                                className="absolute top-0 bottom-8 z-20 cursor-pointer"
                                title={`${line.series}: ${line.lambda} nm | ${line.wavenumber.toLocaleString()} cm⁻¹`}
                                style={{ left: lx - 1, width: 2, backgroundColor: line.color, boxShadow: `0 0 6px ${line.color}, 0 0 14px ${line.color}80` }}>
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[7px] font-mono whitespace-nowrap" style={{ color: line.color }}>
                                    {Math.round(line.lambda)}
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <div key={line.id} className="absolute top-0 bottom-8 z-20 cursor-pointer"
                                title={`${line.series}: ${line.lambda} nm`}
                                style={{ left: lx - 1.5, width: 3, backgroundColor: 'rgba(0,0,0,0.85)' }} />
                        );
                    }
                })}

                <div className="absolute bottom-0 left-0 right-0 bg-white/10 border-t border-white/20 flex justify-between items-center px-1.5 py-1">
                    {['100', '250', '400', '550', '700', '850', '1100nm'].map(l => (
                        <span key={l} className="text-[7px] font-mono text-slate-400">{l}</span>
                    ))}
                </div>
            </div>

            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="font-mono text-[10px] text-slate-700">
                    ν̄ = 109,677 × (1/n₁² − 1/n₂²) cm⁻¹
                </div>
                <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                    R<sub>H</sub> = 2.18×10⁻¹⁸ J = 13.6 eV
                </div>
            </div>
        </div>
    );

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[320px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                {energyCard}
                {spectrometerCard}
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[300px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">

                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl">
                    <div className="text-base font-extrabold text-violet-900">Bohr's Model</div>
                    <div className="text-xs font-semibold text-violet-600 mb-2">NCERT §2.4 — Structure of Atom</div>
                    <ul className="text-xs leading-relaxed text-violet-800 space-y-1.5">
                        <li><span className="font-bold">i.</span> Electron moves in fixed circular orbits of constant energy (stationary states).</li>
                        <li><span className="font-bold">ii.</span> Energy absorbed/emitted only during orbital transitions — in discrete amounts.</li>
                        <li><span className="font-bold">iii.</span> Bohr frequency rule: <span className="font-mono font-bold">ν = ΔE / h</span></li>
                        <li><span className="font-bold">iv.</span> Angular momentum quantised: <span className="font-mono font-bold">m·v·r = n·h/2π</span></li>
                    </ul>
                    <div className="mt-3 rounded-xl border border-violet-300 bg-white/80 p-2.5 space-y-1">
                        <div className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Key Formulae</div>
                        <div className="font-mono text-[10px] text-slate-800">E<sub>n</sub> = −13.6/n² eV</div>
                        <div className="font-mono text-[10px] text-slate-800">r<sub>n</sub> = n² × 52.9 pm</div>
                        <div className="font-mono text-[10px] text-slate-800">ν̄ = 109,677(1/n₁²−1/n₂²) cm⁻¹</div>
                    </div>
                    <div className="mt-2 rounded-xl border border-violet-200 bg-white/60 px-3 py-2">
                        <div className="text-[10px] font-bold text-violet-700 mb-1">NCERT Table 2.3</div>
                        {[
                            { s: 'Lyman', n1: 1, r: 'UV', c: '#7c3aed' },
                            { s: 'Balmer', n1: 2, r: 'Visible ✦', c: '#0891b2' },
                            { s: 'Paschen', n1: 3, r: 'IR', c: '#ea580c' },
                            { s: 'Brackett', n1: 4, r: 'IR', c: '#94a3b8' },
                            { s: 'Pfund', n1: 5, r: 'IR', c: '#94a3b8' },
                        ].map(({ s, n1, r, c }) => (
                            <div key={s} className="flex justify-between text-[10px] py-0.5">
                                <span style={{ color: c }} className="font-bold">{s}</span>
                                <span className="text-slate-500">n₁={n1}, n₂&gt;n₁</span>
                                <span style={{ color: c }}>{r}</span>
                            </div>
                        ))}
                        <div className="text-[9px] text-violet-500 mt-1">✦ Only visible series</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-extrabold text-slate-900">Real-time Values</div>
                        <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">LIVE</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="rounded-lg border border-slate-100 bg-sky-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Electron Level</div>
                            <div className="mt-0.5 font-mono text-lg font-extrabold text-sky-700">n = {currentN}</div>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Energy</div>
                            <div className="mt-0.5 font-mono text-base font-extrabold text-amber-700">{getEnergy(currentN).toFixed(2)} eV</div>
                            <div className="text-[9px] text-amber-500 font-mono">{(getEnergy(currentN) * 1.602e-19).toExponential(2)} J</div>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Orbit Radius</div>
                            <div className="mt-0.5 font-mono text-sm font-extrabold text-slate-700">{getRadius_pm(currentN).toFixed(1)} pm</div>
                            <div className="text-[9px] text-slate-400 font-mono">= {currentN}² × 52.9 pm</div>
                        </div>
                        {lastLine ? (
                            <>
                                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Last Transition</div>
                                <div className="rounded-lg border px-3 py-2"
                                    style={{ borderColor: lastLine.color + '50', backgroundColor: lastLine.color + '12' }}>
                                    <div className="text-[10px] font-bold text-slate-500">{lastLine.series} Series · {lastLine.region}</div>
                                    <div className="font-mono text-sm font-extrabold" style={{ color: lastLine.color }}>
                                        n={lastLine.ni} → n={lastLine.nf}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                                        <div className="text-[9px] font-bold uppercase text-slate-400">λ (nm)</div>
                                        <div className="font-mono text-sm font-extrabold text-slate-800">{lastLine.lambda}</div>
                                    </div>
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                                        <div className="text-[9px] font-bold uppercase text-slate-400">ν̄ (cm⁻¹)</div>
                                        <div className="font-mono text-xs font-extrabold text-slate-800">{lastLine.wavenumber.toLocaleString()}</div>
                                    </div>
                                    <div className="col-span-2 rounded-lg border border-slate-100 bg-red-50 px-2 py-1.5">
                                        <div className="text-[9px] font-bold uppercase text-slate-400">ΔE Released</div>
                                        <div className="font-mono text-sm font-extrabold text-red-700">{lastLine.deltaE} eV</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-xs text-slate-400 text-center py-3 border border-dashed border-slate-200 rounded-lg">
                                Fire a transition to see spectral data
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={1280} height={760} className="absolute inset-0 h-full w-full" />
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

    const controlsCombo = (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                <span className="text-sm font-extrabold text-slate-800">Hydrogen Spectrum Bench</span>
                <span className="ml-auto font-mono text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-2 py-0.5">
                    n={currentN} | {getEnergy(currentN).toFixed(2)} eV
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Spectrum Mode</div>
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                        {(['emission', 'absorption'] as const).map(m => (
                            <button key={m} onClick={() => setMode(m)}
                                className={`flex-1 py-2 text-xs font-bold capitalize transition-colors ${mode === m ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Anim Speed</div>
                        <input type="range" min={0.5} max={3} step={0.5} value={speed}
                            onChange={e => setSpeed(Number(e.target.value))}
                            className="w-full accent-slate-700 h-1.5 cursor-pointer" />
                        <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                            <span>0.5×</span><span>{speed}×</span><span>3×</span>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1.5">
                        ⚡ Excite — Absorb Photon (Jump Up)
                    </div>
                    {currentN >= MAX_N ? (
                        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 font-semibold">
                            Maximum level n=6 reached
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: MAX_N }, (_, i) => i + 1).filter(n => n > currentN).map(n => {
                                const dE = Math.abs(getEnergy(n) - getEnergy(currentN));
                                return (
                                    <button key={n} onClick={() => handleExcite(n)} disabled={transitioning}
                                        className="bg-white hover:bg-amber-500 hover:text-white text-amber-700 border border-amber-300 rounded-xl px-2.5 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex flex-col items-center">
                                        <span>n={n}</span>
                                        <span className="text-[9px] opacity-70">+{dE.toFixed(2)} eV</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600 mb-1.5">
                        ↓ Emit — Release Photon (Drop Down)
                    </div>
                    {currentN <= 1 ? (
                        <div className="text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2.5 font-semibold">
                            Ground state n=1 — cannot emit
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from({ length: MAX_N }, (_, i) => i + 1).filter(n => n < currentN).map(n => {
                                const λ    = getWavelength(currentN, n);
                                const col  = getPhotonColor(λ);
                                const ser  = getSeriesName(n);
                                return (
                                    <button key={n} onClick={() => handleEmit(n)} disabled={transitioning}
                                        className="border rounded-xl px-2.5 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-white flex flex-col items-center hover:opacity-80"
                                        style={{ borderColor: col + '80', color: col }}>
                                        <span>n={n}</span>
                                        <span className="text-[9px] opacity-80">{ser}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Quick Demo</div>
                    <button onClick={() => void handleShowBalmer()} disabled={demoRunning || transitioning}
                        className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors">
                        {demoRunning ? 'Showing Balmer…' : 'Show All Balmer Lines'}
                    </button>
                    <button onClick={() => setSpectralLines([])}
                        className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-colors">
                        Clear Spectrum
                    </button>
                    <div className="text-[9px] text-slate-400 leading-relaxed mt-1">
                        Balmer is the only series in the visible region (NCERT Table 2.3).
                        λ=434 nm for n=5→2 (NCERT Problem 2.10).
                    </div>
                </div>
            </div>
        </div>
    );

    const statusBadge = (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-md text-xs font-bold">
            <span className="text-slate-500">Electron:</span>
            <span className="text-sky-700 text-base font-extrabold font-mono">n={currentN}</span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-700 font-mono">{getEnergy(currentN).toFixed(2)} eV</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-mono">{getRadius_pm(currentN).toFixed(0)} pm</span>
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

export default HydrogenSpectrumLab;
