import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Beaker,
    Droplet,
    Eye,
    EyeOff,
    FlaskConical,
    Pause,
    Play,
    RotateCcw,
    Thermometer,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface SolutionColligativeLabProps {
    topic: Topic;
    onExit: () => void;
}

type SolventId = 'water' | 'benzene' | 'cyclohexane' | 'ethanol' | 'acetic';
type SoluteId = 'urea' | 'glucose' | 'nacl' | 'k2so4';

interface Solvent {
    id: SolventId;
    label: string;
    Tb: number;     // K
    Tf: number;     // K
    Kb: number;     // K kg mol-1
    Kf: number;     // K kg mol-1
    M: number;      // g mol-1
    density: number;// g mL-1
    tint: string;
    accent: string;
}

interface Solute {
    id: SoluteId;
    label: string;
    formula: string;
    M: number;      // g mol-1
    i: number;      // van't Hoff factor (0.1 m value from Table 1.4)
    iLimit: number; // limiting integer dissociation count
    color: string;
    particles: number; // visible particles per formula unit
}

const W = 1280;
const H = 760;

// NCERT Class 12 Chemistry, Chapter 1, Table 1.3 (Kb, Kf for solvents)
// Densities are NCERT-standard pure-solvent values.
const SOLVENTS: Record<SolventId, Solvent> = {
    water:       { id: 'water',       label: 'Water',       Tb: 373.15, Tf: 273.00, Kb: 0.52, Kf: 1.86,  M: 18.015, density: 1.000, tint: '#bae6fd', accent: '#0284c7' },
    benzene:     { id: 'benzene',     label: 'Benzene',     Tb: 353.30, Tf: 278.60, Kb: 2.53, Kf: 5.12,  M: 78.11,  density: 0.879, tint: '#fde68a', accent: '#b45309' },
    cyclohexane: { id: 'cyclohexane', label: 'Cyclohexane', Tb: 353.74, Tf: 279.55, Kb: 2.79, Kf: 20.00, M: 84.16,  density: 0.779, tint: '#e9d5ff', accent: '#7c3aed' },
    ethanol:     { id: 'ethanol',     label: 'Ethanol',     Tb: 351.50, Tf: 155.70, Kb: 1.20, Kf: 1.99,  M: 46.07,  density: 0.789, tint: '#bbf7d0', accent: '#15803d' },
    acetic:      { id: 'acetic',      label: 'Acetic acid', Tb: 391.10, Tf: 290.00, Kb: 2.93, Kf: 3.90,  M: 60.05,  density: 1.049, tint: '#fed7aa', accent: '#c2410c' },
};

// NCERT Table 1.4 i-values at 0.1 m (water).
const SOLUTES: Record<SoluteId, Solute> = {
    urea:    { id: 'urea',    label: 'Urea',     formula: 'NH₂CONH₂', M: 60.06,  i: 1.00, iLimit: 1, color: '#64748b', particles: 1 },
    glucose: { id: 'glucose', label: 'Glucose',  formula: 'C₆H₁₂O₆',  M: 180.16, i: 1.00, iLimit: 1, color: '#f59e0b', particles: 1 },
    nacl:    { id: 'nacl',    label: 'NaCl',     formula: 'NaCl',      M: 58.44,  i: 1.87, iLimit: 2, color: '#0891b2', particles: 2 },
    k2so4:   { id: 'k2so4',   label: 'K₂SO₄',   formula: 'K₂SO₄',     M: 174.26, i: 2.32, iLimit: 3, color: '#a855f7', particles: 3 },
};

const SOLVENT_ORDER: SolventId[] = ['water', 'benzene', 'cyclohexane', 'ethanol', 'acetic'];
const SOLUTE_ORDER: SoluteId[] = ['urea', 'glucose', 'nacl', 'k2so4'];

interface FloatParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    r: number;
}

const SolutionColligativeLab: React.FC<SolutionColligativeLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const particlesRef = useRef<FloatParticle[]>([]);
    const tickRef = useRef(0);

    const [solventId, setSolventId] = useState<SolventId>('water');
    const [soluteId, setSoluteId] = useState<SoluteId>('urea');
    const [soluteMass, setSoluteMass] = useState(0);    // g
    const [solventMass, setSolventMass] = useState(100); // g
    const [showRef, setShowRef] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);

    const solvent = SOLVENTS[solventId];
    const solute = SOLUTES[soluteId];

    // ----- NCERT-strict numerics (Sections 1.2 & 1.6) -----
    const nSolute = soluteMass / solute.M;                     // mol
    const nSolvent = solventMass / solvent.M;                  // mol
    const molality = nSolute / (solventMass / 1000);           // mol kg-1
    const massPercent = soluteMass + solventMass > 0
        ? (soluteMass / (soluteMass + solventMass)) * 100 : 0;
    const xSolute = nSolute + nSolvent > 0 ? nSolute / (nSolute + nSolvent) : 0;
    // Dilute approx: total volume ≈ solvent volume (NCERT keeps molarity defn pure)
    const volumeL = (solventMass / solvent.density) / 1000;
    const molarity = volumeL > 0 ? nSolute / volumeL : 0;

    const dTb = solute.i * solvent.Kb * molality;
    const dTf = solute.i * solvent.Kf * molality;
    const TbSol = solvent.Tb + dTb;
    const TfSol = solvent.Tf - dTf;

    // Thermometer range (visual): -50 °C to +130 °C — covers all NCERT Table 1.3 solvents.
    const T_MIN_C = -50;
    const T_MAX_C = 130;
    const THERMO_TOP_Y = 90;
    const THERMO_BOTTOM_Y = 690;
    const THERMO_X = 920;

    const tempToY = useCallback((tC: number) => {
        const clamped = Math.max(T_MIN_C, Math.min(T_MAX_C, tC));
        const t = (T_MAX_C - clamped) / (T_MAX_C - T_MIN_C);
        return THERMO_TOP_Y + t * (THERMO_BOTTOM_Y - THERMO_TOP_Y);
    }, []);

    // ----- particle pool (visible solute count, capped) -----
    const targetParticles = useMemo(() => {
        const visible = Math.min(160, Math.round(nSolute * 60 * solute.particles));
        return visible;
    }, [nSolute, solute.particles]);

    useEffect(() => {
        const cur = particlesRef.current;
        const target = targetParticles;
        // beaker bounds (canvas coords)
        const bx0 = 220, bx1 = 600, by0 = 240, by1 = 600;
        if (cur.length < target) {
            for (let i = cur.length; i < target; i += 1) {
                cur.push({
                    x: bx0 + 20 + Math.random() * (bx1 - bx0 - 40),
                    y: by0 + 30 + Math.random() * (by1 - by0 - 60),
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (Math.random() - 0.5) * 0.6,
                    color: solute.color,
                    r: 4 + Math.random() * 2.5,
                });
            }
        } else if (cur.length > target) {
            cur.length = target;
        }
        // recolour to current solute
        for (const p of cur) p.color = solute.color;
    }, [targetParticles, solute.color]);

    const handleReset = useCallback(() => {
        setSoluteMass(0);
        setSolventMass(100);
        particlesRef.current = [];
        tickRef.current = 0;
    }, []);

    // ----- draw loop -----
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            tickRef.current += paused ? 0 : speed;
            ctx.clearRect(0, 0, W, H);

            // background wash
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);

            // ===== Beaker =====
            const bx0 = 220, bx1 = 600, by0 = 200, by1 = 620;
            // glass body
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(bx0 - 18, by0 - 8);
            ctx.lineTo(bx0, by0);
            ctx.lineTo(bx0, by1);
            ctx.quadraticCurveTo((bx0 + bx1) / 2, by1 + 30, bx1, by1);
            ctx.lineTo(bx1, by0);
            ctx.lineTo(bx1 + 18, by0 - 8);
            ctx.stroke();

            // liquid fill
            const fillTop = by0 + 60;
            ctx.beginPath();
            ctx.moveTo(bx0 + 2, fillTop);
            ctx.lineTo(bx0 + 2, by1 - 2);
            ctx.quadraticCurveTo((bx0 + bx1) / 2, by1 + 24, bx1 - 2, by1 - 2);
            ctx.lineTo(bx1 - 2, fillTop);
            ctx.closePath();
            ctx.fillStyle = solvent.tint;
            ctx.fill();

            // gentle surface line
            ctx.strokeStyle = solvent.accent;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.moveTo(bx0 + 2, fillTop);
            ctx.lineTo(bx1 - 2, fillTop);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // beaker label
            ctx.fillStyle = '#0f172a';
            ctx.font = '800 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${solvent.label} · ${solventMass} g`, (bx0 + bx1) / 2, by1 + 56);

            // ===== Solute particles =====
            const liquidTop = fillTop + 6;
            const liquidBottom = by1 + 12;
            for (const p of particlesRef.current) {
                if (!paused) {
                    p.x += p.vx * speed;
                    p.y += p.vy * speed;
                    if (p.x < bx0 + 8) { p.x = bx0 + 8; p.vx = Math.abs(p.vx); }
                    if (p.x > bx1 - 8) { p.x = bx1 - 8; p.vx = -Math.abs(p.vx); }
                    if (p.y < liquidTop) { p.y = liquidTop; p.vy = Math.abs(p.vy); }
                    if (p.y > liquidBottom) { p.y = liquidBottom; p.vy = -Math.abs(p.vy); }
                    if (Math.random() < 0.02) {
                        p.vx += (Math.random() - 0.5) * 0.2;
                        p.vy += (Math.random() - 0.5) * 0.2;
                        p.vx = Math.max(-1, Math.min(1, p.vx));
                        p.vy = Math.max(-1, Math.min(1, p.vy));
                    }
                }
                // halo for dissociating solutes
                if (solute.iLimit > 1) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
                    ctx.fillStyle = p.color + '33';
                    ctx.fill();
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }

            // empty beaker message
            if (soluteMass === 0) {
                ctx.fillStyle = '#64748b';
                ctx.font = '700 14px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Pure solvent · drag the solute slider →', (bx0 + bx1) / 2, (by0 + by1) / 2);
            }

            // short solute label (apparatus annotation)
            if (soluteMass > 0) {
                ctx.fillStyle = solute.color;
                ctx.font = '700 13px Inter, system-ui, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${solute.label} (i = ${solute.i.toFixed(2)})`, bx0, by0 - 22);
            }

            // ===== Thermometer =====
            const thX = THERMO_X;
            const thTop = THERMO_TOP_Y;
            const thBot = THERMO_BOTTOM_Y;
            // stem
            ctx.fillStyle = '#f1f5f9';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(thX - 18, thTop - 8, 36, thBot - thTop + 16, 12);
            ctx.fill();
            ctx.stroke();
            // bulb
            ctx.beginPath();
            ctx.arc(thX, thBot + 36, 28, 0, Math.PI * 2);
            ctx.fillStyle = '#fecaca';
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();
            // mercury column up to a neutral level
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(thX - 6, thBot - 8, 12, 16);
            ctx.beginPath();
            ctx.arc(thX, thBot + 36, 18, 0, Math.PI * 2);
            ctx.fill();

            // tick marks
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.fillStyle = '#475569';
            ctx.font = '600 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'right';
            for (let tC = T_MIN_C; tC <= T_MAX_C; tC += 10) {
                const y = tempToY(tC);
                const major = tC % 20 === 0;
                ctx.beginPath();
                ctx.moveTo(thX - 22, y);
                ctx.lineTo(thX - (major ? 32 : 28), y);
                ctx.stroke();
                if (major) ctx.fillText(`${tC}`, thX - 36, y + 3);
            }
            ctx.textAlign = 'left';
            ctx.fillText('°C', thX + 28, thTop - 14);

            // pure-solvent reference lines (dotted)
            if (showRef) {
                const drawRef = (tK: number, color: string, label: string) => {
                    const tC = tK - 273.15;
                    if (tC < T_MIN_C || tC > T_MAX_C) return;
                    const y = tempToY(tC);
                    ctx.strokeStyle = color;
                    ctx.setLineDash([4, 4]);
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(thX + 30, y);
                    ctx.lineTo(thX + 230, y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = color;
                    ctx.font = '600 11px Inter, system-ui, sans-serif';
                    ctx.fillText(label, thX + 236, y + 4);
                };
                drawRef(solvent.Tf, '#60a5fa', `T°f = ${(solvent.Tf - 273.15).toFixed(1)} °C  (pure)`);
                drawRef(solvent.Tb, '#fca5a5', `T°b = ${(solvent.Tb - 273.15).toFixed(1)} °C  (pure)`);
            }

            // live solution markers
            const drawMarker = (tK: number, color: string, fill: string, title: string, value: string) => {
                const tC = tK - 273.15;
                const offScale = tC < T_MIN_C || tC > T_MAX_C;
                const y = tempToY(tC);
                ctx.fillStyle = fill;
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(thX + 30, y - 22, 230, 44, 12);
                ctx.fill();
                ctx.stroke();
                // pointer arrow
                ctx.beginPath();
                ctx.moveTo(thX + 30, y);
                ctx.lineTo(thX + 14, y - 8);
                ctx.lineTo(thX + 14, y + 8);
                ctx.closePath();
                ctx.fillStyle = color;
                ctx.fill();
                // text
                ctx.fillStyle = color;
                ctx.font = '700 11px Inter, system-ui, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(title, thX + 44, y - 5);
                ctx.font = '800 18px Inter, system-ui, sans-serif';
                ctx.fillText(offScale ? `${value} ↯` : value, thX + 44, y + 16);
            };

            drawMarker(
                TfSol,
                '#1d4ed8',
                '#dbeafe',
                'Freezing point',
                `${(TfSol - 273.15).toFixed(1)} °C   (ΔTf = ${dTf.toFixed(2)} K)`,
            );
            drawMarker(
                TbSol,
                '#b91c1c',
                '#fee2e2',
                'Boiling point',
                `${(TbSol - 273.15).toFixed(1)} °C   (ΔTb = ${dTb.toFixed(2)} K)`,
            );

            // ===== Ice / steam icons next to thermometer =====
            // ice cube near Tf
            {
                const tC = TfSol - 273.15;
                const y = tempToY(tC);
                const melted = tC > 0 && solvent.id === 'water';
                ctx.fillStyle = melted ? '#bae6fd' : '#e0f2fe';
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                if (melted) {
                    ctx.arc(thX - 56, y, 12, 0, Math.PI * 2);
                } else {
                    ctx.roundRect(thX - 68, y - 12, 24, 24, 4);
                }
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#0c4a6e';
                ctx.font = '700 10px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(melted ? 'melt' : 'ice', thX - 56, y + 28);
            }
            // steam wisp near Tb
            {
                const tC = TbSol - 273.15;
                const y = tempToY(tC);
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 2;
                for (let k = 0; k < 3; k += 1) {
                    ctx.beginPath();
                    const x0 = thX - 70 + k * 8;
                    ctx.moveTo(x0, y + 6);
                    ctx.bezierCurveTo(x0 - 6, y - 4, x0 + 8, y - 10, x0 + 2, y - 18);
                    ctx.stroke();
                }
                ctx.fillStyle = '#475569';
                ctx.font = '700 10px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('vapour', thX - 58, y + 24);
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        draw(); // immediate first paint (does not depend on rAF firing)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [paused, speed, solvent, solute, soluteMass, solventMass, showRef, dTb, dTf, TbSol, TfSol, tempToY]);

    // ===== Left aside: stacked graph cards =====
    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                {/* (a) ΔT vs molality line graph */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">ΔT vs molality</h3>
                    <p className="text-xs font-semibold text-slate-500">ΔTb = i·Kb·m   ·   ΔTf = i·Kf·m</p>
                    <svg viewBox="0 0 320 170" className="mt-2 w-full">
                        {/* axes */}
                        <line x1="40" y1="20" x2="40" y2="140" stroke="#94a3b8" />
                        <line x1="40" y1="80" x2="310" y2="80" stroke="#94a3b8" />
                        {/* x labels */}
                        <text x="40" y="158" fontSize="10" fill="#475569" textAnchor="middle">0</text>
                        <text x="175" y="158" fontSize="10" fill="#475569" textAnchor="middle">m (mol/kg)</text>
                        <text x="310" y="158" fontSize="10" fill="#475569" textAnchor="middle">{Math.max(2, Math.ceil(molality * 1.3)).toFixed(0)}</text>
                        {/* y labels */}
                        <text x="35" y="24" fontSize="10" fill="#b91c1c" textAnchor="end">+ΔTb</text>
                        <text x="35" y="84" fontSize="10" fill="#475569" textAnchor="end">0</text>
                        <text x="35" y="144" fontSize="10" fill="#1d4ed8" textAnchor="end">−ΔTf</text>
                        {(() => {
                            const mMax = Math.max(2, molality * 1.3);
                            const xScale = (m: number) => 40 + (m / mMax) * 270;
                            const yUp = (dt: number) => 80 - Math.min(60, (dt / 60) * 60);
                            const yDown = (dt: number) => 80 + Math.min(60, (dt / 60) * 60);
                            // theoretical lines from solvent K * solute i
                            const slopeB = solute.i * solvent.Kb;
                            const slopeF = solute.i * solvent.Kf;
                            const xEnd = xScale(mMax);
                            return (
                                <g>
                                    <line x1={xScale(0)} y1={80} x2={xEnd} y2={yUp(slopeB * mMax)} stroke="#dc2626" strokeWidth="2" />
                                    <line x1={xScale(0)} y1={80} x2={xEnd} y2={yDown(slopeF * mMax)} stroke="#1d4ed8" strokeWidth="2" />
                                    {/* live dot */}
                                    <circle cx={xScale(molality)} cy={yUp(dTb)} r="5" fill="#dc2626" />
                                    <circle cx={xScale(molality)} cy={yDown(dTf)} r="5" fill="#1d4ed8" />
                                </g>
                            );
                        })()}
                    </svg>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600">
                        <span>slope_b = i·Kb = {(solute.i * solvent.Kb).toFixed(2)}</span>
                        <span>slope_f = i·Kf = {(solute.i * solvent.Kf).toFixed(2)}</span>
                    </div>
                </div>

                {/* (b) Vapour pressure schematic (NCERT Fig 1.8) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Vapour pressure vs T</h3>
                    <p className="text-xs font-semibold text-slate-500">NCERT Fig 1.8 — Why fp drops & bp rises</p>
                    <svg viewBox="0 0 320 160" className="mt-2 w-full">
                        <line x1="40" y1="20" x2="40" y2="140" stroke="#94a3b8" />
                        <line x1="40" y1="140" x2="310" y2="140" stroke="#94a3b8" />
                        <text x="35" y="24" fontSize="10" fill="#475569" textAnchor="end">P</text>
                        <text x="310" y="158" fontSize="10" fill="#475569" textAnchor="middle">T →</text>
                        {/* atmospheric line */}
                        <line x1="40" y1="60" x2="310" y2="60" stroke="#cbd5e1" strokeDasharray="3 3" />
                        <text x="306" y="56" fontSize="9" fill="#64748b" textAnchor="end">P_atm</text>
                        {/* pure solvent curve (exponential-ish) */}
                        <path d="M 50 138 Q 170 132 220 70 T 300 18" fill="none" stroke="#0f172a" strokeWidth="2" />
                        <text x="220" y="46" fontSize="10" fill="#0f172a">pure</text>
                        {/* solution curve (lowered) */}
                        <path d={`M 50 142 Q 180 138 ${230 + Math.min(40, dTb * 4)} 76 T ${300 + Math.min(20, dTb * 2)} 28`} fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="2 0" />
                        <text x="232" y="92" fontSize="10" fill="#dc2626">solution</text>
                        {/* fp marker */}
                        <line x1="80" y1="20" x2="80" y2="140" stroke="#1d4ed8" strokeDasharray="2 3" />
                        <text x="82" y="30" fontSize="9" fill="#1d4ed8">T°f</text>
                        <line x1={80 - Math.min(28, dTf * 2)} y1="20" x2={80 - Math.min(28, dTf * 2)} y2="140" stroke="#1d4ed8" />
                        <text x={82 - Math.min(28, dTf * 2)} y="44" fontSize="9" fill="#1d4ed8">Tf</text>
                    </svg>
                </div>

                {/* (c) Concentration card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Concentration (live)</h3>
                    <p className="text-xs font-semibold text-slate-500">NCERT §1.2 — four ways to express</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                        <div className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5">
                            <div className="text-slate-500">Mass %</div>
                            <div className="font-mono text-sm text-slate-900">{massPercent.toFixed(2)}%</div>
                        </div>
                        <div className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5">
                            <div className="text-slate-500">Mole fraction x₂</div>
                            <div className="font-mono text-sm text-slate-900">{xSolute.toFixed(4)}</div>
                        </div>
                        <div className="rounded-md border border-slate-100 bg-amber-50 px-2 py-1.5">
                            <div className="text-amber-700">Molarity M</div>
                            <div className="font-mono text-sm text-amber-900">{molarity.toFixed(3)} M</div>
                        </div>
                        <div className="rounded-md border border-slate-100 bg-emerald-50 px-2 py-1.5">
                            <div className="text-emerald-700">Molality m</div>
                            <div className="font-mono text-sm text-emerald-900">{molality.toFixed(3)} m</div>
                        </div>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold text-slate-500">
                        Molality is T-independent — that is why colligative formulas use m, not M.
                    </p>
                </div>
            </div>
        </aside>
    ), [molality, dTb, dTf, massPercent, xSolute, molarity, solute.i, solvent.Kb, solvent.Kf]);

    // ===== Right aside: theory + real-time values =====
    const valuesPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="flex items-start gap-2">
                        <FlaskConical size={19} className="mt-0.5 text-amber-800" />
                        <div>
                            <h3 className="text-base font-extrabold text-amber-950">Colligative Properties</h3>
                            <p className="text-xs font-semibold text-amber-700">NCERT Class 12 · Ch 1 · §1.6</p>
                        </div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-950">
                        <p>Depend on the <strong>number</strong> of solute particles, not their identity.</p>
                        <p>Four properties: relative lowering of vapour pressure, ΔTb, ΔTf, osmotic pressure.</p>
                        <p>ΔTb = i·Kb·m   ·   ΔTf = i·Kf·m   (dilute solutions)</p>
                        <p>Kb, Kf are <strong>solvent</strong> properties (Table 1.3).</p>
                        <p>i = van't Hoff factor — counts dissociated particles (Table 1.4).</p>
                        <p>Molality is used because it does not change with temperature.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Solvent', value: `${solvent.label} · Kb ${solvent.Kb} · Kf ${solvent.Kf}`, tint: 'bg-slate-50', color: 'text-slate-800' },
                            { label: 'Solute', value: `${solute.label} · i ${solute.i.toFixed(2)} (→ ${solute.iLimit})`, tint: 'bg-slate-50', color: 'text-slate-800' },
                            { label: 'Molality m', value: `${molality.toFixed(3)} mol/kg`, tint: 'bg-emerald-50', color: 'text-emerald-700' },
                            { label: 'ΔTb (elevation)', value: `+${dTb.toFixed(2)} K`, tint: 'bg-red-50', color: 'text-red-700' },
                            { label: 'ΔTf (depression)', value: `−${dTf.toFixed(2)} K`, tint: 'bg-blue-50', color: 'text-blue-700' },
                            { label: 'Tb of solution', value: `${(TbSol - 273.15).toFixed(2)} °C`, tint: 'bg-amber-50', color: 'text-amber-700' },
                            { label: 'Tf of solution', value: `${(TfSol - 273.15).toFixed(2)} °C`, tint: 'bg-cyan-50', color: 'text-cyan-700' },
                        ].map((row) => (
                            <div key={row.label} className={`rounded-lg border border-slate-100 ${row.tint} px-3 py-2.5`}>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                                <div className={`mt-1 font-mono text-base font-extrabold ${row.color}`}>{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Everyday connections</h3>
                    <div className="mt-2 space-y-2 text-sm font-semibold leading-snug text-slate-700">
                        <p>Salt on icy roads — depresses fp below 0 °C, ice melts.</p>
                        <p>Ethylene glycol antifreeze — depresses fp and raises bp of radiator water (NCERT Ex 1.9).</p>
                        <p>Fish in cold lakes — dissolved solutes lower body-fluid fp.</p>
                    </div>
                </div>
            </div>
        </aside>
    ), [solvent, solute, molality, dTb, dTf, TbSol, TfSol]);

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
        <div className="grid h-full auto-rows-min grid-cols-12 gap-3 overflow-y-auto text-slate-900">
            <div className="col-span-12 flex min-w-0 items-center gap-2 lg:col-span-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                    <Beaker size={18} />
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900">Solution & Colligative Bench</div>
                    <div className="truncate text-[11px] font-black text-slate-500">smartboard controls</div>
                </div>
            </div>

            {/* Solvent selector */}
            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:col-span-5">
                <div className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-500">Solvent (Table 1.3)</div>
                <div className="grid grid-cols-5 gap-1.5">
                    {SOLVENT_ORDER.map((id) => {
                        const s = SOLVENTS[id];
                        const active = solventId === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setSolventId(id)}
                                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 text-[11px] font-black transition ${
                                    active ? 'border-amber-500 bg-amber-500 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <span className="truncate">{s.label}</span>
                                <span className={`text-[9px] ${active ? 'text-amber-50' : 'text-slate-500'}`}>Kf {s.Kf}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Solute selector */}
            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:col-span-4">
                <div className="mb-1.5 text-xs font-black uppercase tracking-wide text-slate-500">Solute (Table 1.4)</div>
                <div className="grid grid-cols-4 gap-1.5">
                    {SOLUTE_ORDER.map((id) => {
                        const s = SOLUTES[id];
                        const active = soluteId === id;
                        return (
                            <button
                                key={id}
                                onClick={() => setSoluteId(id)}
                                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 text-[11px] font-black transition ${
                                    active ? 'border-cyan-500 bg-cyan-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <span className="truncate">{s.label}</span>
                                <span className={`text-[9px] ${active ? 'text-cyan-50' : 'text-slate-500'}`}>i = {s.i.toFixed(2)}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-6">
                <label className="block">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Solute mass</span>
                        <output className="font-mono">{soluteMass.toFixed(0)} g</output>
                    </div>
                    <input
                        className="w-full accent-cyan-600"
                        type="range"
                        min={0}
                        max={30}
                        step={0.5}
                        value={soluteMass}
                        onChange={(event) => setSoluteMass(Number(event.target.value))}
                    />
                    <div className="mt-1 flex justify-between text-[10px] font-bold text-slate-500">
                        <span>0 g</span><span>30 g</span>
                    </div>
                </label>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-4">
                <label className="block">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Solvent mass</span>
                        <output className="font-mono">{solventMass} g</output>
                    </div>
                    <input
                        className="w-full accent-amber-600"
                        type="range"
                        min={50}
                        max={500}
                        step={10}
                        value={solventMass}
                        onChange={(event) => setSolventMass(Number(event.target.value))}
                    />
                    <div className="mt-1 flex justify-between text-[10px] font-bold text-slate-500">
                        <span>50 g</span><span>500 g</span>
                    </div>
                </label>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-2">
                <button
                    onClick={() => setShowRef((v) => !v)}
                    className={`flex h-full w-full items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-black ${
                        showRef ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                    title="Pure-solvent reference"
                >
                    {showRef ? <Eye size={14} /> : <EyeOff size={14} />} Pure ref
                </button>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-3">
                <label className="block">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Animation speed</span>
                        <output>{speed.toFixed(1)}x</output>
                    </div>
                    <input
                        className="w-full accent-violet-600"
                        type="range"
                        min={0.2}
                        max={2.5}
                        step={0.1}
                        value={speed}
                        onChange={(event) => setSpeed(Number(event.target.value))}
                    />
                </label>
            </section>

        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controls}
            controlsAreaFlex="0 0 220px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default SolutionColligativeLab;
