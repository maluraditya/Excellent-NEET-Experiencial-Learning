import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Beaker, Droplets, Gauge, Link2, Pause, Play, RotateCcw, Scale } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface WeakAcidBaseIonizationLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'side' | 'conjugate' | 'dilution';

interface Acid {
    id: string;
    label: string;
    cation: string;   // ionised H species shown on canvas
    anion: string;    // conjugate base on canvas
    Ka: number;
}

interface Base {
    id: string;
    label: string;
    bhPlus: string;
    Kb: number;
}

// NCERT Class 11 Chemistry, Unit 6 Equilibrium — Table 6.6 (Ka) and Table 6.7 (Kb) at 298 K
const ACIDS: Acid[] = [
    { id: 'hf',     label: 'HF (hydrofluoric)',  cation: 'H⁺', anion: 'F⁻',         Ka: 6.8e-4 },
    { id: 'hcooh',  label: 'HCOOH (formic)',     cation: 'H⁺', anion: 'HCOO⁻',      Ka: 1.8e-4 },
    { id: 'hocl',   label: 'HOCl (hypochlorous)',cation: 'H⁺', anion: 'ClO⁻',       Ka: 2.5e-5 },
    { id: 'ch3cooh',label: 'CH₃COOH (acetic)',   cation: 'H⁺', anion: 'CH₃COO⁻',    Ka: 1.8e-5 },
    { id: 'hcn',    label: 'HCN (hydrocyanic)',  cation: 'H⁺', anion: 'CN⁻',        Ka: 4.9e-10 }
];

const BASES: Base[] = [
    { id: 'dma',     label: '(CH₃)₂NH (dimethylamine)', bhPlus: '(CH₃)₂NH₂⁺', Kb: 5.4e-4 },
    { id: 'tea',     label: '(C₂H₅)₃N (triethylamine)', bhPlus: '(C₂H₅)₃NH⁺', Kb: 6.45e-5 },
    { id: 'nh3',     label: 'NH₃ (ammonia)',            bhPlus: 'NH₄⁺',       Kb: 1.77e-5 },
    { id: 'pyr',     label: 'C₅H₅N (pyridine)',         bhPlus: 'C₅H₅NH⁺',    Kb: 1.77e-9 },
    { id: 'ani',     label: 'C₆H₅NH₂ (aniline)',        bhPlus: 'C₆H₅NH₃⁺',   Kb: 4.27e-10 }
];

// NCERT §6.11.5: NH₄⁺ is the conjugate acid of NH₃; Ka(NH₄⁺) = 5.6 × 10⁻¹⁰
const NH4_KA = 5.6e-10;

const Kw = 1.0e-14;
const W = 1280;
const H = 760;

const log10 = (x: number) => Math.log(x) / Math.LN10;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// Solve cα²/(1−α) = K exactly: cα² + Kα − K = 0 → α = (−K + √(K² + 4Kc)) / (2c)
function alphaOf(K: number, c: number): number {
    if (c <= 0) return 0;
    const disc = K * K + 4 * K * c;
    const a = (-K + Math.sqrt(disc)) / (2 * c);
    return clamp(a, 0, 1);
}

function pHfromAcid(Ka: number, c: number) {
    const a = alphaOf(Ka, c);
    const h = c * a + 1e-7;
    return { alpha: a, conc: c * a, pH: -log10(h) };
}
function pHfromBase(Kb: number, c: number) {
    const a = alphaOf(Kb, c);
    const oh = c * a + 1e-7;
    const pOH = -log10(oh);
    return { alpha: a, conc: c * a, pH: 14 - pOH, pOH };
}

// Deterministic pseudo-random points inside an axis-aligned ellipse (cx,cy,rx,ry)
function seedPositions(n: number, cx: number, cy: number, rx: number, ry: number, seed: number) {
    const pts: { x: number; y: number; ph: number }[] = [];
    let s = seed;
    for (let i = 0; i < n; i++) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const u = (s & 0xffff) / 0x10000;
        s = (s * 1664525 + 1013904223) >>> 0;
        const v = ((s >>> 8) & 0xffff) / 0x10000;
        const r = Math.sqrt(u);
        const theta = 2 * Math.PI * v;
        pts.push({
            x: cx + rx * r * Math.cos(theta),
            y: cy + ry * r * Math.sin(theta),
            ph: 2 * Math.PI * v + i * 0.37
        });
    }
    return pts;
}

const WeakAcidBaseIonizationLab: React.FC<WeakAcidBaseIonizationLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const tRef = useRef(0);
    const dilRef = useRef(0); // 0..1 sweep phase

    const [mode, setMode] = useState<Mode>('side');
    const [acidId, setAcidId] = useState<string>('ch3cooh');
    const [baseId, setBaseId] = useState<string>('nh3');
    const [c, setC] = useState<number>(0.1);          // shared molarity for both beakers
    const [speed, setSpeed] = useState<number>(1);
    const [paused, setPaused] = useState<boolean>(false);
    const [showLabels, setShowLabels] = useState<boolean>(true);

    const acid = useMemo(() => ACIDS.find(a => a.id === acidId)!, [acidId]);
    const base = useMemo(() => BASES.find(b => b.id === baseId)!, [baseId]);

    // In conjugate-pair mode the acid is forced to NH4+ and the base to NH3
    const effectiveKa = mode === 'conjugate' ? NH4_KA : acid.Ka;
    const effectiveKb = mode === 'conjugate' ? BASES.find(b => b.id === 'nh3')!.Kb : base.Kb;
    const acidGlyph = mode === 'conjugate'
        ? { label: 'NH₄⁺', cation: 'H₃O⁺', anion: 'NH₃' }
        : { label: acid.label.split(' ')[0], cation: acid.cation, anion: acid.anion };
    const baseGlyph = mode === 'conjugate'
        ? { label: 'NH₃', bhPlus: 'NH₄⁺' }
        : { label: base.label.split(' ')[0], bhPlus: base.bhPlus };

    const cLive = mode === 'dilution'
        ? Math.pow(10, -3 + 3 * (1 - dilRef.current)) // sweep 1.0 → 0.001 M
        : c;

    const acidNum = useMemo(() => pHfromAcid(effectiveKa, cLive), [effectiveKa, cLive]);
    const baseNum = useMemo(() => pHfromBase(effectiveKb, cLive), [effectiveKb, cLive]);
    const conjProduct = effectiveKa * effectiveKb;

    // ---------- canvas draw ----------
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const t = tRef.current;

        // background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        // subtle grid
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // mode pill
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 18px Inter, ui-sans-serif, system-ui';
        ctx.textAlign = 'left';
        const modeText = mode === 'side' ? 'Side-by-side comparison'
            : mode === 'conjugate' ? 'Conjugate pair · NH₄⁺ / NH₃'
            : 'Dilution sweep';
        ctx.fillText(modeText, 32, 38);

        // Two beakers
        drawBeaker(ctx, {
            cx: 360, cy: 410, w: 440, h: 460,
            tint: '#fef3c7', rim: '#f59e0b',
            title: acidGlyph.label,
            subtitle: mode === 'conjugate' ? 'Conjugate acid' : 'WEAK ACID',
            t
        });
        drawBeaker(ctx, {
            cx: 920, cy: 410, w: 440, h: 460,
            tint: '#ccfbf1', rim: '#0d9488',
            title: baseGlyph.label,
            subtitle: mode === 'conjugate' ? 'Weak base' : 'WEAK BASE',
            t
        });

        // Equilibrium arrows above each beaker
        drawEquilibriumArrow(ctx, 360, 150, acidNum.alpha, '#b45309');
        drawEquilibriumArrow(ctx, 920, 150, baseNum.alpha, '#0f766e');

        ctx.fillStyle = '#334155';
        ctx.font = '600 14px Inter, ui-sans-serif, system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`HA + H₂O ⇌ ${acidGlyph.cation} + ${acidGlyph.anion}`, 360, 130);
        ctx.fillText(`B + H₂O ⇌ ${baseGlyph.bhPlus} + OH⁻`, 920, 130);

        // particles inside beakers
        drawParticles(ctx, {
            cx: 360, cy: 460, rx: 170, ry: 170,
            t,
            alpha: acidNum.alpha,
            neutralLabel: 'HA',
            cationLabel: acidGlyph.cation,
            anionLabel: acidGlyph.anion,
            neutralColor: '#f59e0b',
            cationColor: '#dc2626',
            anionColor: '#b45309',
            showLabels,
            seed: 1337
        });
        drawParticles(ctx, {
            cx: 920, cy: 460, rx: 170, ry: 170,
            t,
            alpha: baseNum.alpha,
            neutralLabel: 'B',
            cationLabel: baseGlyph.bhPlus.length > 4 ? 'BH⁺' : baseGlyph.bhPlus,
            anionLabel: 'OH⁻',
            neutralColor: '#0d9488',
            cationColor: '#1d4ed8',
            anionColor: '#16a34a',
            showLabels,
            seed: 2718
        });

        // Conjugate-pair bridge — apparatus link only (values live in the right aside)
        if (mode === 'conjugate') {
            ctx.save();
            ctx.strokeStyle = '#7c3aed';
            ctx.setLineDash([10, 8]);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(540, 470);
            ctx.lineTo(740, 470);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#7c3aed';
            ctx.font = '800 15px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('conjugate pair', 640, 462);
            ctx.restore();
        }

        // hint line
        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px Inter';
        ctx.textAlign = 'center';
        if (mode === 'dilution') {
            ctx.fillText('Watch α grow as c shrinks — Ka = cα² / (1 − α) demands it', 640, 736);
        } else if (mode === 'conjugate') {
            ctx.fillText('Strong acid ⇒ weak conjugate base. The product Ka × Kb stays equal to Kw.', 640, 736);
        } else {
            ctx.fillText('Larger Ka / Kb ⇒ more split particles ⇒ pH pointer moves farther from 7', 640, 736);
        }
    }, [mode, acidGlyph, baseGlyph, acidNum.alpha, acidNum.pH, baseNum.alpha, baseNum.pH, conjProduct, cLive, showLabels]);

    // ---------- animation loop ----------
    useEffect(() => {
        let last = performance.now();
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000) * speed;
            last = now;
            if (!paused) {
                tRef.current += dt;
                if (mode === 'dilution') {
                    dilRef.current = (dilRef.current + dt * 0.18) % 1;
                }
            }
            draw();
            rafRef.current = requestAnimationFrame(tick);
        };
        draw(); // immediate first paint (does not depend on rAF firing)
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
    }, [draw, paused, speed, mode]);

    const handleReset = () => {
        tRef.current = 0;
        dilRef.current = 0;
        setC(0.1);
        setMode('side');
        setAcidId('ch3cooh');
        setBaseId('nh3');
        setSpeed(1);
        setPaused(false);
    };

    // ---------- left aside: graph cards ----------
    const graphPanel = (
        <aside
            className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1"
        >
            <div className="flex flex-col gap-2.5">
                {/* Ka / Kb log-scale strip */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Ka & Kb strength scale</div>
                    <div className="text-xs font-semibold text-slate-500">NCERT Tables 6.6 / 6.7 · log scale</div>
                    <svg viewBox="0 0 320 180" className="mt-2 w-full">
                        {/* axis */}
                        <line x1={20} y1={150} x2={300} y2={150} stroke="#94a3b8" strokeWidth={1.2} />
                        {[-10, -8, -6, -4].map(p => {
                            const x = 20 + ((p + 10) / 6) * 280;
                            return (
                                <g key={p}>
                                    <line x1={x} y1={146} x2={x} y2={154} stroke="#64748b" />
                                    <text x={x} y={168} textAnchor="middle" fontSize={10} fill="#475569">10^{p}</text>
                                </g>
                            );
                        })}
                        <text x={160} y={16} textAnchor="middle" fontSize={11} fill="#64748b" fontWeight={600}>weak ←      → stronger</text>
                        {/* Ka markers */}
                        <text x={20} y={36} fontSize={11} fill="#b45309" fontWeight={800}>Ka (acids)</text>
                        {ACIDS.map((a, i) => {
                            const p = log10(a.Ka);
                            const x = 20 + clamp((p + 10) / 6, 0, 1) * 280;
                            const y = 56;
                            const on = mode !== 'conjugate' && a.id === acidId;
                            return (
                                <g key={a.id}>
                                    <circle cx={x} cy={y} r={on ? 7 : 5} fill={on ? '#d97706' : '#fcd34d'} stroke="#b45309" strokeWidth={on ? 2 : 1} />
                                    <text x={x} y={y - 10} textAnchor="middle" fontSize={9} fill="#92400e" fontWeight={on ? 800 : 600}>
                                        {a.label.split(' ')[0]}
                                    </text>
                                </g>
                            );
                        })}
                        {/* Kb markers */}
                        <text x={20} y={96} fontSize={11} fill="#0f766e" fontWeight={800}>Kb (bases)</text>
                        {BASES.map((b) => {
                            const p = log10(b.Kb);
                            const x = 20 + clamp((p + 10) / 6, 0, 1) * 280;
                            const y = 120;
                            const on = mode !== 'conjugate' && b.id === baseId;
                            return (
                                <g key={b.id}>
                                    <circle cx={x} cy={y} r={on ? 7 : 5} fill={on ? '#0d9488' : '#5eead4'} stroke="#0f766e" strokeWidth={on ? 2 : 1} />
                                    <text x={x} y={y + 18} textAnchor="middle" fontSize={9} fill="#115e59" fontWeight={on ? 800 : 600}>
                                        {b.label.split(' ')[0]}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* α vs c curve */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Degree of ionization α vs c</div>
                    <div className="text-xs font-semibold text-slate-500">α = √(K/c) for small α (NCERT)</div>
                    <svg viewBox="0 0 320 170" className="mt-2 w-full">
                        <line x1={28} y1={140} x2={310} y2={140} stroke="#94a3b8" />
                        <line x1={28} y1={20} x2={28} y2={140} stroke="#94a3b8" />
                        <text x={170} y={158} textAnchor="middle" fontSize={10} fill="#475569">c (M, log scale)</text>
                        <text x={10} y={80} textAnchor="middle" fontSize={10} fill="#475569" transform="rotate(-90 10 80)">α</text>
                        {[0, 0.25, 0.5, 0.75, 1].map(a => (
                            <g key={a}>
                                <line x1={26} x2={30} y1={140 - 120 * a} y2={140 - 120 * a} stroke="#64748b" />
                                <text x={22} y={143 - 120 * a} textAnchor="end" fontSize={9} fill="#475569">{a}</text>
                            </g>
                        ))}
                        {/* curve for chosen acid */}
                        {(() => {
                            const pts: string[] = [];
                            for (let i = 0; i <= 60; i++) {
                                const logC = -3 + (i / 60) * 3;
                                const cc = Math.pow(10, logC);
                                const a = alphaOf(effectiveKa, cc);
                                const x = 28 + (i / 60) * 282;
                                const y = 140 - 120 * a;
                                pts.push(`${x},${y}`);
                            }
                            return <polyline points={pts.join(' ')} fill="none" stroke="#b45309" strokeWidth={2.4} />;
                        })()}
                        {/* curve for chosen base */}
                        {(() => {
                            const pts: string[] = [];
                            for (let i = 0; i <= 60; i++) {
                                const logC = -3 + (i / 60) * 3;
                                const cc = Math.pow(10, logC);
                                const a = alphaOf(effectiveKb, cc);
                                const x = 28 + (i / 60) * 282;
                                const y = 140 - 120 * a;
                                pts.push(`${x},${y}`);
                            }
                            return <polyline points={pts.join(' ')} fill="none" stroke="#0d9488" strokeWidth={2.4} />;
                        })()}
                        {/* live marker */}
                        {(() => {
                            const logC = clamp(log10(cLive), -3, 0);
                            const x = 28 + ((logC + 3) / 3) * 282;
                            return (
                                <g>
                                    <line x1={x} y1={20} x2={x} y2={140} stroke="#0f172a" strokeDasharray="3 3" />
                                    <circle cx={x} cy={140 - 120 * acidNum.alpha} r={4.5} fill="#d97706" stroke="#fff" strokeWidth={1.5} />
                                    <circle cx={x} cy={140 - 120 * baseNum.alpha} r={4.5} fill="#0d9488" stroke="#fff" strokeWidth={1.5} />
                                </g>
                            );
                        })()}
                        <text x={300} y={32} textAnchor="end" fontSize={9} fill="#b45309" fontWeight={700}>acid</text>
                        <text x={300} y={46} textAnchor="end" fontSize={9} fill="#0d9488" fontWeight={700}>base</text>
                    </svg>
                </div>

                {/* pH comparison card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">pH comparison</div>
                    <div className="text-xs font-semibold text-slate-500">acid vs base on the 0–14 scale</div>
                    <svg viewBox="0 0 320 120" className="mt-2 w-full">
                        <defs>
                            <linearGradient id="phgrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0" stopColor="#dc2626" />
                                <stop offset="0.5" stopColor="#f8fafc" />
                                <stop offset="1" stopColor="#1d4ed8" />
                            </linearGradient>
                        </defs>
                        {[{ y: 30, pH: acidNum.pH, label: 'Acid', color: '#b45309' }, { y: 82, pH: baseNum.pH, label: 'Base', color: '#0f766e' }].map(row => {
                            const x = 24 + clamp(row.pH / 14, 0, 1) * 272;
                            return (
                                <g key={row.label}>
                                    <text x={24} y={row.y - 8} fontSize={10} fontWeight={800} fill={row.color}>{row.label}</text>
                                    <text x={296} y={row.y - 8} fontSize={11} fontWeight={800} textAnchor="end" fill="#0f172a">pH {row.pH.toFixed(2)}</text>
                                    <rect x={24} y={row.y} width={272} height={12} rx={6} fill="url(#phgrad)" stroke="#cbd5e1" />
                                    <polygon points={`${x},${row.y - 3} ${x - 5},${row.y - 11} ${x + 5},${row.y - 11}`} fill="#0f172a" />
                                    <circle cx={x} cy={row.y + 6} r={4} fill={row.color} stroke="#fff" strokeWidth={1.5} />
                                </g>
                            );
                        })}
                        <text x={24} y={114} fontSize={9} fill="#475569">0 (acidic)</text>
                        <text x={160} y={114} fontSize={9} textAnchor="middle" fill="#475569">7</text>
                        <text x={296} y={114} fontSize={9} textAnchor="end" fill="#475569">14 (basic)</text>
                    </svg>
                </div>

                {/* Quick stats card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Quick read</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-amber-50 px-2 py-1.5 font-semibold text-amber-900">
                            pKa = {(-log10(effectiveKa)).toFixed(2)}
                        </div>
                        <div className="rounded-lg bg-teal-50 px-2 py-1.5 font-semibold text-teal-900">
                            pKb = {(-log10(effectiveKb)).toFixed(2)}
                        </div>
                        <div className="col-span-2 rounded-lg bg-violet-50 px-2 py-1.5 font-semibold text-violet-900">
                            pKa + pKb = {(-log10(effectiveKa) - log10(effectiveKb)).toFixed(2)}{' '}
                            <span className="text-violet-500">(pKw = 14 for true pair)</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

    // ---------- right aside: theory + live values ----------
    const valuesPanel = (
        <aside
            className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1"
        >
            <div className="flex flex-col gap-3">
                {/* Theory card */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">Ionization of weak acids & bases</div>
                    <div className="text-xs font-semibold text-amber-700">NCERT Class 11 · Ch 6 §6.11.3 – §6.11.5</div>
                    <ul className="mt-2 list-disc pl-4 text-sm leading-snug text-amber-950 space-y-1.5">
                        <li><b>HX + H₂O ⇌ H₃O⁺ + X⁻</b>, Ka = [H⁺][X⁻] / [HX]</li>
                        <li>Ka = <b>cα² / (1 − α)</b> &nbsp; (Eqn 6.30)</li>
                        <li><b>B + H₂O ⇌ BH⁺ + OH⁻</b>, Kb = cα² / (1 − α)</li>
                        <li>For a conjugate pair: <b>Ka × Kb = Kw</b> = 10⁻¹⁴ at 298 K</li>
                        <li><b>pKa + pKb = 14</b> &nbsp; (Eqn 6.36)</li>
                        <li>Strong acid ⇒ weak conjugate base, and vice-versa.</li>
                    </ul>
                </div>

                {/* Live values card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
                        </span>
                    </div>

                    <div className="mt-3 grid gap-2">
                        <ValueRow label="Concentration c" value={`${cLive >= 0.1 ? cLive.toFixed(3) : cLive.toExponential(2)} M`} tint="slate" />
                        <ValueRow label="Ka (acid)" value={effectiveKa.toExponential(2)} tint="amber" />
                        <ValueRow label="α (acid)" value={acidNum.alpha < 0.001 ? acidNum.alpha.toExponential(2) : acidNum.alpha.toFixed(4)} tint="amber" />
                        <ValueRow label="[H⁺]" value={`${acidNum.conc.toExponential(2)} M`} tint="amber" />
                        <ValueRow label="pH (acid)" value={acidNum.pH.toFixed(2)} tint="amber" big />

                        <div className="my-1 h-px bg-slate-100" />

                        <ValueRow label="Kb (base)" value={effectiveKb.toExponential(2)} tint="teal" />
                        <ValueRow label="α (base)" value={baseNum.alpha < 0.001 ? baseNum.alpha.toExponential(2) : baseNum.alpha.toFixed(4)} tint="teal" />
                        <ValueRow label="[OH⁻]" value={`${baseNum.conc.toExponential(2)} M`} tint="teal" />
                        <ValueRow label="pH (base)" value={baseNum.pH.toFixed(2)} tint="teal" big />

                        {mode === 'conjugate' && (
                            <>
                                <div className="my-1 h-px bg-slate-100" />
                                <ValueRow label="Ka × Kb" value={conjProduct.toExponential(2)} tint="violet" big />
                                <div className={`rounded-lg border px-3 py-2 text-xs font-bold ${Math.abs(conjProduct - Kw) / Kw < 0.05 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                                    Kw = 1.0 × 10⁻¹⁴ at 298 K
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );

    // ---------- simulation combo ----------
    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="absolute inset-0 h-full w-full"
                />
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={() => setPaused(p => !p)}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50"
                        title={paused ? 'Play' : 'Pause'}
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50"
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

    // ---------- bottom controls ----------
    const controlsComponent = (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Beaker size={18} className="text-amber-600" />
                Weak Acid / Weak Base Ionization Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Demonstration mode</div>
                    <div className="grid grid-cols-3 gap-2">
                        {([
                            { id: 'side',     label: 'Side-by-side', icon: <Scale size={14} /> },
                            { id: 'conjugate',label: 'Conjugate pair', icon: <Link2 size={14} /> },
                            { id: 'dilution', label: 'Dilution sweep', icon: <Droplets size={14} /> }
                        ] as { id: Mode; label: string; icon: React.ReactNode }[]).map(m => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-extrabold transition ${mode === m.id ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                {m.icon}
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {mode !== 'conjugate' && (
                        <>
                            <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Acid (left beaker)</div>
                            <select
                                value={acidId}
                                onChange={e => setAcidId(e.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800"
                            >
                                {ACIDS.map(a => (
                                    <option key={a.id} value={a.id}>{a.label} · Ka = {a.Ka.toExponential(1)}</option>
                                ))}
                            </select>

                            <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Base (right beaker)</div>
                            <select
                                value={baseId}
                                onChange={e => setBaseId(e.target.value)}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800"
                            >
                                {BASES.map(b => (
                                    <option key={b.id} value={b.id}>{b.label} · Kb = {b.Kb.toExponential(1)}</option>
                                ))}
                            </select>
                        </>
                    )}

                </div>

                <div className="space-y-3">
                    {mode !== 'dilution' && (
                        <div>
                            <label className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                                <span className="flex items-center gap-1.5"><Gauge size={13} /> Concentration c</span>
                                <span className="font-mono text-slate-700">{c.toFixed(3)} M</span>
                            </label>
                            <input
                                type="range" min={-3} max={0} step={0.01}
                                value={log10(c)}
                                onChange={e => setC(Math.pow(10, Number(e.target.value)))}
                                className="w-full accent-amber-600"
                            />
                            <div className="mt-0.5 flex justify-between text-[10px] font-semibold text-slate-400">
                                <span>0.001 M</span><span>0.01</span><span>0.1</span><span>1.0 M</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                            Animation speed
                            <span className="font-mono text-slate-700">{speed.toFixed(2)}×</span>
                        </label>
                        <input
                            type="range" min={0.25} max={2.5} step={0.05}
                            value={speed}
                            onChange={e => setSpeed(Number(e.target.value))}
                            className="w-full accent-slate-700"
                        />
                    </div>

                    <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                        <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} className="accent-amber-600" />
                        Show particle labels (HA, H⁺, B, OH⁻ …)
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsComponent}
            controlsAreaFlex="0 0 240px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

// ---------- helper presentational ----------

const ValueRow: React.FC<{ label: string; value: string; tint: 'slate' | 'amber' | 'teal' | 'violet'; big?: boolean }> = ({ label, value, tint, big }) => {
    const tintBg = tint === 'amber' ? 'bg-amber-50' : tint === 'teal' ? 'bg-teal-50' : tint === 'violet' ? 'bg-violet-50' : 'bg-slate-50';
    const tintText = tint === 'amber' ? 'text-amber-700' : tint === 'teal' ? 'text-teal-700' : tint === 'violet' ? 'text-violet-700' : 'text-slate-700';
    return (
        <div className={`rounded-lg border border-slate-100 ${tintBg} px-3 py-2`}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className={`mt-0.5 font-mono ${big ? 'text-base' : 'text-sm'} font-extrabold ${tintText}`}>{value}</div>
        </div>
    );
};

// ---------- canvas helpers ----------

function drawBeaker(
    ctx: CanvasRenderingContext2D,
    o: { cx: number; cy: number; w: number; h: number; tint: string; rim: string; title: string; subtitle: string; t: number }
) {
    const { cx, cy, w, h, tint, rim, title, subtitle, t } = o;
    const left = cx - w / 2;
    const right = cx + w / 2;
    const top = cy - h / 2 + 30;
    const bottom = cy + h / 2;

    // beaker body (rounded)
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#94a3b8';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom - 30);
    ctx.quadraticCurveTo(left, bottom, left + 30, bottom);
    ctx.lineTo(right - 30, bottom);
    ctx.quadraticCurveTo(right, bottom, right, bottom - 30);
    ctx.lineTo(right, top);
    ctx.stroke();

    // liquid
    const liquidTop = top + 80;
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.moveTo(left + 4, liquidTop);
    ctx.lineTo(left + 4, bottom - 30);
    ctx.quadraticCurveTo(left + 4, bottom - 4, left + 30, bottom - 4);
    ctx.lineTo(right - 30, bottom - 4);
    ctx.quadraticCurveTo(right - 4, bottom - 4, right - 4, bottom - 30);
    ctx.lineTo(right - 4, liquidTop);
    // subtle wave
    const amp = 4;
    const wave = (x: number) => liquidTop + Math.sin((x + t * 70) / 28) * amp;
    for (let x = right - 4; x >= left + 4; x -= 8) ctx.lineTo(x, wave(x));
    ctx.closePath();
    ctx.fill();

    // rim labels
    ctx.fillStyle = rim;
    ctx.font = '800 22px Inter, ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(title, cx, top - 8);
    ctx.fillStyle = '#64748b';
    ctx.font = '700 11px Inter';
    ctx.fillText(subtitle, cx, top + 18);
    ctx.restore();
}

function drawEquilibriumArrow(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number, color: string) {
    const fwd = clamp(0.4 + 4 * alpha, 1, 5);
    const rev = clamp(0.4 + 4 * (1 - alpha), 1, 5);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = fwd;
    ctx.beginPath();
    ctx.moveTo(x - 40, y - 4);
    ctx.lineTo(x + 36, y - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 36, y - 4);
    ctx.lineTo(x + 28, y - 9);
    ctx.moveTo(x + 36, y - 4);
    ctx.lineTo(x + 28, y + 1);
    ctx.stroke();
    ctx.lineWidth = rev;
    ctx.beginPath();
    ctx.moveTo(x + 40, y + 6);
    ctx.lineTo(x - 36, y + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 36, y + 6);
    ctx.lineTo(x - 28, y + 1);
    ctx.moveTo(x - 36, y + 6);
    ctx.lineTo(x - 28, y + 11);
    ctx.stroke();
    ctx.restore();
}

function drawParticles(
    ctx: CanvasRenderingContext2D,
    o: {
        cx: number; cy: number; rx: number; ry: number;
        t: number;
        alpha: number;
        neutralLabel: string; cationLabel: string; anionLabel: string;
        neutralColor: string; cationColor: string; anionColor: string;
        showLabels: boolean;
        seed: number;
    }
) {
    const total = 36;
    const positions = seedPositions(total, o.cx, o.cy, o.rx, o.ry, o.seed);
    const ionised = Math.round(total * o.alpha);
    const neutral = total - ionised;

    // neutral molecules
    for (let i = 0; i < neutral; i++) {
        const p = positions[i];
        const x = p.x + Math.sin(o.t * 0.7 + p.ph) * 4;
        const y = p.y + Math.cos(o.t * 0.6 + p.ph * 1.3) * 4;
        drawParticle(ctx, x, y, 14, o.neutralColor, o.neutralLabel, o.showLabels);
    }
    // dissociated ion pairs — slightly farther apart, with a faint connecting glow on emit
    for (let i = neutral; i < total; i++) {
        const p = positions[i];
        const off = 11 + Math.sin(o.t * 1.2 + p.ph) * 3;
        const cx = p.x + Math.sin(o.t * 0.5 + p.ph) * 4;
        const cy = p.y + Math.cos(o.t * 0.7 + p.ph * 1.1) * 4;
        // glow link
        ctx.save();
        ctx.strokeStyle = 'rgba(148,163,184,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - off, cy);
        ctx.lineTo(cx + off, cy);
        ctx.stroke();
        ctx.restore();
        drawParticle(ctx, cx - off, cy, 11, o.cationColor, o.cationLabel, o.showLabels);
        drawParticle(ctx, cx + off, cy, 12, o.anionColor, o.anionLabel, o.showLabels);
    }
}

function drawParticle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, label: string, showLabel: boolean) {
    ctx.save();
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (showLabel) {
        ctx.fillStyle = '#0f172a';
        ctx.font = `700 ${Math.max(9, Math.round(r * 0.8))}px Inter, ui-sans-serif, system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y + 0.5);
    }
    ctx.restore();
}

export default WeakAcidBaseIonizationLab;
