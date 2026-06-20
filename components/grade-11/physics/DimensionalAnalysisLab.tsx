import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Scale, Wand2, FlaskConical, CheckCircle2 } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface DimensionalAnalysisLabProps {
    topic: any;
    onExit: () => void;
}

const W = 1280;
const H = 760;

// Dimension vector: [M, L, T]
type Dim = [number, number, number];
interface Term { label: string; dim: Dim; }
interface EquationDef {
    id: string;
    title: string;
    ncert: string;
    lhs: Term;
    rhs: Term[];
    tamperedRhs?: Term[]; // only correct equations support the "Tamper" demo
}

// Every value below is the NCERT Class 11, Ch 1 dimensional formula.
const EQUATIONS: EquationDef[] = [
    {
        id: 'kinematics',
        title: 'x = x₀ + v₀t + ½at²',
        ncert: 'Section 1.6.1 — consistency test',
        lhs: { label: 'x', dim: [0, 1, 0] },
        rhs: [
            { label: 'x₀', dim: [0, 1, 0] },
            { label: 'v₀t', dim: [0, 1, 0] },
            { label: '½at²', dim: [0, 1, 0] },
        ],
        // Drop one 't' from ½at² → ½at = [L T⁻²][T] = [L T⁻¹]
        tamperedRhs: [
            { label: 'x₀', dim: [0, 1, 0] },
            { label: 'v₀t', dim: [0, 1, 0] },
            { label: '½at', dim: [0, 1, -1] },
        ],
    },
    {
        id: 'energy',
        title: '½mv² = mgh',
        ncert: 'Example 1.3',
        lhs: { label: '½mv²', dim: [1, 2, -2] },
        rhs: [{ label: 'mgh', dim: [1, 2, -2] }],
        // Drop g → mh = [M][L]
        tamperedRhs: [{ label: 'mh', dim: [1, 1, 0] }],
    },
    {
        id: 'wrong-cube',
        title: 'K = m³v³',
        ncert: 'Example 1.4 (a) — ruled out',
        lhs: { label: 'K', dim: [1, 2, -2] },
        rhs: [{ label: 'm³v³', dim: [3, 3, -3] }],
    },
    {
        id: 'wrong-ma',
        title: 'K = ma',
        ncert: 'Example 1.4 (c) — ruled out',
        lhs: { label: 'K', dim: [1, 2, -2] },
        rhs: [{ label: 'ma', dim: [1, 1, -2] }],
    },
];

// NCERT dimensional-formula reference key (Ch 1 + Appendix table values)
const FORMULA_KEY: { q: string; dim: Dim }[] = [
    { q: 'Length / distance', dim: [0, 1, 0] },
    { q: 'Mass', dim: [1, 0, 0] },
    { q: 'Time', dim: [0, 0, 1] },
    { q: 'Velocity, speed', dim: [0, 1, -1] },
    { q: 'Acceleration', dim: [0, 1, -2] },
    { q: 'Force', dim: [1, 1, -2] },
    { q: 'Work, energy', dim: [1, 2, -2] },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const sup = (s: string) =>
    s.split('').map(c => (({ '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '.': '·' } as Record<string, string>)[c] ?? c)).join('');
const supN = (n: number) => sup(Number.isInteger(n) ? String(n) : String(n));
const fmtDim = (d: Dim) => `[M${supN(d[0])} L${supN(d[1])} T${supN(d[2])}]`;
const dimEqual = (a: Dim, b: Dim) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const dimDist = (a: Dim, b: Dim) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

type Mode = 'check' | 'derive';

interface Model {
    mode: Mode;
    reference: Dim;
    lhsTerm: Term;
    rhsTerms: Term[];
    rep: Term;            // representative RHS term used for the M/L/T bars
    balanced: boolean;
    targetAngle: number;  // radians
    // derive specifics
    x: number; y: number; z: number;
    derived: boolean;
}

const EMERALD = '#16a34a';
const RED = '#dc2626';
const SLATE = '#0f172a';
const MUTED = '#64748b';

const DimensionalAnalysisLab: React.FC<DimensionalAnalysisLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const angleRef = useRef(0);
    const modelRef = useRef<Model | null>(null);

    const [mode, setMode] = useState<Mode>('check');
    const [equationId, setEquationId] = useState('kinematics');
    const [tampered, setTampered] = useState(false);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [z, setZ] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [paused, setPaused] = useState(false);

    const equation = useMemo(() => EQUATIONS.find(e => e.id === equationId) ?? EQUATIONS[0], [equationId]);

    const model = useMemo<Model>(() => {
        if (mode === 'check') {
            const reference = equation.lhs.dim;
            const rhsTerms = tampered && equation.tamperedRhs ? equation.tamperedRhs : equation.rhs;
            const balanced = rhsTerms.every(t => dimEqual(t.dim, reference));
            // representative = the RHS term that differs most from the reference
            let rep = rhsTerms[0];
            let best = -1;
            for (const t of rhsTerms) {
                const d = dimDist(t.dim, reference);
                if (d > best) { best = d; rep = t; }
            }
            const dist = dimDist(rep.dim, reference);
            const sign = Math.sign((rep.dim[0] + rep.dim[1] + rep.dim[2]) - (reference[0] + reference[1] + reference[2])) || 1;
            const targetAngle = balanced ? 0 : sign * clamp(dist * 0.05, 0.05, 0.16);
            return { mode, reference, lhsTerm: equation.lhs, rhsTerms, rep, balanced, targetAngle, x, y, z, derived: false };
        }
        // derive mode: T = k · lˣ gʸ mᶻ   ;  l=[0,1,0] g=[0,1,-2] m=[1,0,0]
        const reference: Dim = [0, 0, 1]; // T
        const repDim: Dim = [z, x + y, -2 * y];
        const rhsTerms: Term[] = [{ label: 'k lˣ gʸ mᶻ', dim: repDim }];
        const balanced = dimEqual(repDim, reference);
        const dist = dimDist(repDim, reference);
        const sign = Math.sign((repDim[0] + repDim[1] + repDim[2]) - (reference[0] + reference[1] + reference[2])) || 1;
        const targetAngle = balanced ? 0 : sign * clamp(dist * 0.05, 0.05, 0.16);
        return { mode, reference, lhsTerm: { label: 'T', dim: reference }, rhsTerms, rep: rhsTerms[0], balanced, targetAngle, x, y, z, derived: balanced };
    }, [mode, equation, tampered, x, y, z]);

    useEffect(() => { modelRef.current = model; }, [model]);

    const handleReset = () => {
        setMode('check');
        setEquationId('kinematics');
        setTampered(false);
        setX(0); setY(0); setZ(0);
        setSpeed(1);
        setPaused(false);
        angleRef.current = 0;
    };

    // ---- drawing ----------------------------------------------------------
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const drawBackground = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = 'rgba(15,23,42,0.05)';
            ctx.lineWidth = 1;
            for (let gx = 0; gx <= W; gx += 48) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
            for (let gy = 0; gy <= H; gy += 48) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
        };

        const roundRect = (rx: number, ry: number, rw: number, rh: number, r: number) => {
            const rr = Math.min(r, rw / 2, rh / 2);
            ctx.beginPath();
            ctx.moveTo(rx + rr, ry);
            ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, rr);
            ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, rr);
            ctx.arcTo(rx, ry + rh, rx, ry, rr);
            ctx.arcTo(rx, ry, rx + rw, ry, rr);
            ctx.closePath();
        };

        const drawTile = (cx: number, cy: number, tw: number, label: string, dim: Dim, matched: boolean) => {
            const th = 60;
            ctx.save();
            ctx.shadowColor = 'rgba(15,23,42,0.12)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;
            roundRect(cx - tw / 2, cy - th / 2, tw, th, 14);
            ctx.fillStyle = matched ? '#ecfdf5' : '#fef2f2';
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = matched ? EMERALD : RED;
            ctx.stroke();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = SLATE;
            ctx.font = '700 22px Inter, ui-sans-serif, system-ui';
            ctx.fillText(label, cx, cy - 9);
            ctx.fillStyle = matched ? '#047857' : '#b91c1c';
            ctx.font = '600 16px "JetBrains Mono", ui-monospace, monospace';
            ctx.fillText(fmtDim(dim), cx, cy + 14);
            ctx.restore();
        };

        const drawTray = (m: Model, endX: number, endY: number, terms: Term[]) => {
            const ropeLen = 96;
            const trayTop = endY + ropeLen;
            // rope
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(endX, endY + 8);
            ctx.lineTo(endX, trayTop);
            ctx.stroke();
            // tray bar
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(endX - 110, trayTop);
            ctx.lineTo(endX + 110, trayTop);
            ctx.stroke();
            terms.forEach((t, i) => {
                const cy = trayTop + 44 + i * 70;
                drawTile(endX, cy, 172, t.label, t.dim, dimEqual(t.dim, m.reference));
            });
        };

        const drawBars = (m: Model, centerX: number, label: string, side: 'lhs' | 'rhs') => {
            const baseY = 700;
            const maxH = 96;
            const bases = ['M', 'L', 'T'];
            const lhs = m.reference;
            const rhs = m.rep.dim;
            ctx.textAlign = 'center';
            ctx.fillStyle = MUTED;
            ctx.font = '700 13px Inter, ui-sans-serif, system-ui';
            ctx.fillText(label, centerX, baseY + 40);
            for (let i = 0; i < 3; i++) {
                const bx = centerX - 64 + i * 64;
                const exp = side === 'lhs' ? lhs[i] : rhs[i];
                const matched = lhs[i] === rhs[i];
                const h = clamp((Math.abs(exp) / 4) * maxH, 4, maxH);
                // baseline
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(bx - 22, baseY);
                ctx.lineTo(bx + 22, baseY);
                ctx.stroke();
                roundRect(bx - 17, baseY - h, 34, h, 6);
                ctx.fillStyle = matched ? '#bbf7d0' : '#fecaca';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = matched ? EMERALD : RED;
                ctx.stroke();
                ctx.fillStyle = matched ? '#047857' : '#b91c1c';
                ctx.font = '800 16px Inter, ui-sans-serif, system-ui';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(supN(exp).length ? String(exp) : '0', bx, baseY - h - 8);
                ctx.fillStyle = MUTED;
                ctx.font = '600 13px Inter, ui-sans-serif, system-ui';
                ctx.fillText(bases[i], bx, baseY + 18);
            }
        };

        const render = () => {
            const m = modelRef.current;
            if (!m) { rafRef.current = requestAnimationFrame(render); return; }

            if (!paused) {
                angleRef.current += (m.targetAngle - angleRef.current) * 0.12 * speed;
            }
            const angle = angleRef.current;

            drawBackground();

            // reference chip
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '700 15px Inter, ui-sans-serif, system-ui';
            ctx.fillStyle = MUTED;
            ctx.fillText(m.mode === 'check' ? 'Target dimension (LHS)' : 'Target: time period  T', 640, 44);
            ctx.font = '800 26px "JetBrains Mono", ui-monospace, monospace';
            ctx.fillStyle = '#1d4ed8';
            ctx.fillText(fmtDim(m.reference), 640, 74);

            // verdict
            ctx.font = '800 22px Inter, ui-sans-serif, system-ui';
            ctx.fillStyle = m.balanced ? EMERALD : RED;
            ctx.fillText(m.balanced ? 'DIMENSIONALLY CONSISTENT' : 'DIMENSIONALLY INCONSISTENT', 640, 116);

            // balance
            const pivot = { x: 640, y: 210 };
            const half = 300;
            const lx = pivot.x - half * Math.cos(angle);
            const ly = pivot.y + half * Math.sin(angle);
            const rx = pivot.x + half * Math.cos(angle);
            const ry = pivot.y - half * Math.sin(angle);

            // fulcrum
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(pivot.x - 46, 470);
            ctx.lineTo(pivot.x + 46, 470);
            ctx.lineTo(pivot.x, pivot.y + 6);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.stroke();

            // beam
            const glow = m.balanced ? EMERALD : RED;
            ctx.save();
            ctx.shadowColor = m.balanced ? 'rgba(22,163,74,0.45)' : 'rgba(220,38,38,0.4)';
            ctx.shadowBlur = 18;
            ctx.strokeStyle = glow;
            ctx.lineWidth = 9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(rx, ry);
            ctx.stroke();
            ctx.restore();
            // pivot cap
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(pivot.x, pivot.y, 9, 0, Math.PI * 2);
            ctx.fill();

            // side labels
            ctx.fillStyle = MUTED;
            ctx.font = '700 14px Inter, ui-sans-serif, system-ui';
            ctx.fillText('LHS', lx, ly - 22);
            ctx.fillText('RHS', rx, ry - 22);

            // trays + tiles
            drawTray(m, lx, ly, [m.lhsTerm]);
            drawTray(m, rx, ry, m.rhsTerms);

            // M/L/T comparison bars
            drawBars(m, 300, 'LHS exponents', 'lhs');
            drawBars(m, 980, 'RHS exponents', 'rhs');

            // resolved pendulum result
            if (m.mode === 'derive' && m.derived) {
                ctx.textAlign = 'center';
                ctx.font = '800 24px "JetBrains Mono", ui-monospace, monospace';
                ctx.fillStyle = EMERALD;
                ctx.fillText('T = k √(l / g)', 640, 150);
            }

            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, [paused, speed]);

    // ---- side panels ------------------------------------------------------
    const repMatch = (i: number) => model.reference[i] === model.rep.dim[i];

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Base-quantity ledger</div>
                    <div className="text-xs font-semibold text-slate-500">Exponents must match base-by-base</div>
                    <div className="mt-2 grid grid-cols-4 gap-1 text-center text-sm">
                        <div className="font-bold text-slate-400"> </div>
                        <div className="font-bold text-slate-700">M</div>
                        <div className="font-bold text-slate-700">L</div>
                        <div className="font-bold text-slate-700">T</div>
                        <div className="font-bold text-slate-500 text-left">LHS</div>
                        {model.reference.map((v, i) => <div key={`l${i}`} className="font-mono text-slate-900">{v}</div>)}
                        <div className="font-bold text-slate-500 text-left">RHS</div>
                        {model.rep.dim.map((v, i) => <div key={`r${i}`} className={`font-mono ${repMatch(i) ? 'text-emerald-600' : 'text-red-600'}`}>{v}</div>)}
                        <div className="font-bold text-slate-500 text-left">=?</div>
                        {[0, 1, 2].map(i => <div key={`m${i}`} className={repMatch(i) ? 'text-emerald-600' : 'text-red-600'}>{repMatch(i) ? '✓' : '✗'}</div>)}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Dimensional formula key</div>
                    <div className="text-xs font-semibold text-slate-500">NCERT Ch 1, Section 1.5</div>
                    <div className="mt-2 flex flex-col gap-1 text-sm">
                        {FORMULA_KEY.map(k => (
                            <div key={k.q} className="flex items-center justify-between gap-2">
                                <span className="text-slate-700">{k.q}</span>
                                <span className="font-mono text-slate-900">{fmtDim(k.dim)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">Principle of homogeneity</div>
                    <div className="text-xs font-semibold text-amber-700">NCERT Ch 1, Section 1.6</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-amber-950">
                        <p>• Only quantities with the <b>same dimensions</b> can be added or subtracted.</p>
                        <p>• So every term on both sides must have <b>identical</b> dimensions.</p>
                        <p>• Fails the test → equation is <b>wrong</b>. Passes → <b>not proved right</b> (consistency is necessary, not sufficient).</p>
                        <p>• Cannot fix dimensionless constants (the ½, the 2π).</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
                        </span>
                    </div>
                    <div className="grid gap-2">
                        <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{mode === 'check' ? 'LHS dimension' : 'Target (T)'}</div>
                            <div className="mt-1 font-mono text-base font-extrabold text-amber-700">{fmtDim(model.reference)}</div>
                        </div>
                        {model.rhsTerms.map((t, i) => (
                            <div key={i} className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">RHS · {t.label}</div>
                                <div className={`mt-1 font-mono text-base font-extrabold ${dimEqual(t.dim, model.reference) ? 'text-emerald-600' : 'text-red-600'}`}>{fmtDim(t.dim)}</div>
                            </div>
                        ))}
                        <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Consistent?</div>
                            <div className={`mt-1 font-mono text-base font-extrabold ${model.balanced ? 'text-emerald-600' : 'text-red-600'}`}>{model.balanced ? 'YES — homogeneous' : 'NO — terms differ'}</div>
                        </div>
                        {mode === 'derive' && (
                            <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Exponents x, y, z</div>
                                <div className="mt-1 font-mono text-base font-extrabold text-amber-700">{x}, {y}, {z}</div>
                                <div className="mt-1 text-xs text-slate-500">Solve: x=½, y=−½, z=0 → T = k√(l/g), with k = 2π.</div>
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
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
            </div>

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

            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="flex h-full w-full flex-col gap-4 text-slate-900">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                    <Scale size={18} className="text-blue-600" /> Dimensional Analysis Bench
                </div>
                <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                        onClick={() => setMode('check')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${mode === 'check' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}
                    >
                        <CheckCircle2 size={14} /> Check Consistency
                    </button>
                    <button
                        onClick={() => setMode('derive')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${mode === 'derive' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}
                    >
                        <FlaskConical size={14} /> Derive a Relation
                    </button>
                </div>
            </div>

            {mode === 'check' ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Equation to test</div>
                        <div className="grid grid-cols-2 gap-2">
                            {EQUATIONS.map(eq => (
                                <button
                                    key={eq.id}
                                    onClick={() => { setEquationId(eq.id); setTampered(false); }}
                                    className={`rounded-xl border px-3 py-2 text-left transition ${equationId === eq.id ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <div className="font-mono text-sm font-bold">{eq.title}</div>
                                    <div className="text-[11px] font-semibold text-slate-500">{eq.ncert}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-2">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Demonstration</div>
                            <button
                                onClick={() => setTampered(t => !t)}
                                disabled={!equation.tamperedRhs}
                                className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${!equation.tamperedRhs ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : tampered ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                                title={equation.tamperedRhs ? 'Break a term to see the beam crash' : 'This equation is already wrong'}
                            >
                                <Wand2 size={16} /> {tampered ? 'Restore the term' : 'Tamper with a term'}
                            </button>
                            <p className="text-[11px] leading-snug text-slate-500">
                                {equation.tamperedRhs
                                    ? 'Removes a factor from the last term so the class watches homogeneity break.'
                                    : 'Tamper is only available for the dimensionally correct equations.'}
                            </p>
                        </div>
                        <SpeedSlider speed={speed} setSpeed={setSpeed} />
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Assume T = k · lˣ gʸ mᶻ — drag the exponents</div>
                        <ExpSlider label="x  (length l)" value={x} setValue={setX} />
                        <ExpSlider label="y  (gravity g)" value={y} setValue={setY} />
                        <ExpSlider label="z  (mass m)" value={z} setValue={setZ} />
                    </div>
                    <div className="space-y-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-snug text-slate-600">
                            Balance all three M, L, T bars to find the only solution that matches the time period <b>T</b>.
                            Dimensional analysis gives the form — the constant k = 2π comes from experiment.
                        </div>
                        <SpeedSlider speed={speed} setSpeed={setSpeed} />
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
            simulationStageWidth={W}
            simulationStageHeight={H}
            simulationAreaFlex="7 1 0%"
            controlsAreaFlex="3 1 0%"
        />
    );
};

const SpeedSlider: React.FC<{ speed: number; setSpeed: (n: number) => void }> = ({ speed, setSpeed }) => (
    <label className="block rounded-xl border border-slate-200 bg-white p-3">
        <span className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <span>Settle speed</span><span className="font-mono text-slate-800">{speed.toFixed(1)}×</span>
        </span>
        <input
            type="range" min={0.3} max={2} step={0.1} value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-blue-500"
        />
    </label>
);

const ExpSlider: React.FC<{ label: string; value: number; setValue: (n: number) => void }> = ({ label, value, setValue }) => (
    <label className="block rounded-xl border border-slate-200 bg-white p-3">
        <span className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <span>{label}</span><span className="font-mono text-base text-slate-900">{value}</span>
        </span>
        <input
            type="range" min={-2} max={2} step={0.5} value={value}
            onChange={e => setValue(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-blue-500"
        />
    </label>
);

export default DimensionalAnalysisLab;
