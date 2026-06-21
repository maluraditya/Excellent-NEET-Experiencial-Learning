import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Pause, Play, RotateCcw, SlidersHorizontal, Sun } from 'lucide-react';
import { Topic } from '../../../types';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PolarisationLabProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'two' | 'three';

interface Snapshot {
    mode: Mode;
    analyzerAngle: number;       // deg, P2 axis when mode='two'
    middleAngle: number;         // deg, P2 axis when mode='three' (P3 fixed at 90°)
    showVectors: boolean;
    isPlaying: boolean;
}

const W = 1280;
const H = 760;
const rad = (d: number) => (d * Math.PI) / 180;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const PolarisationLab: React.FC<PolarisationLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    const [mode, setMode] = useState<Mode>('two');
    const [analyzerAngle, setAnalyzerAngle] = useState(55);
    const [middleAngle, setMiddleAngle] = useState(45);
    const [showVectors, setShowVectors] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);

    // Physics — all per NCERT §10.7 (Wave Optics)
    const I0 = 100;
    const I_afterP1 = I0 / 2;
    const I_two = I_afterP1 * Math.cos(rad(analyzerAngle)) ** 2;            // Malus
    const I_three = (I0 / 8) * Math.sin(2 * rad(middleAngle)) ** 2;          // (I0/2) cos²θ sin²θ
    const I_out = mode === 'two' ? I_two : I_three;
    const ratio = I_out / I0;

    const snapshotRef = useRef<Snapshot>({ mode, analyzerAngle, middleAngle, showVectors, isPlaying });
    useEffect(() => {
        snapshotRef.current = { mode, analyzerAngle, middleAngle, showVectors, isPlaying };
    }, [mode, analyzerAngle, middleAngle, showVectors, isPlaying]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const tick = (time: number) => {
            drawScene(ctx, snapshotRef.current, time / 1000);
            animationRef.current = requestAnimationFrame(tick);
        };
        animationRef.current = requestAnimationFrame(tick);
        return () => { if (animationRef.current !== null) cancelAnimationFrame(animationRef.current); };
    }, []);

    const readouts = useMemo(() => {
        if (mode === 'two') {
            return [
                ['After P1 (unpolarised → polarised)', `${I_afterP1.toFixed(1)} units`, 'always 50% of I₀'],
                ['After analyser (Malus law)', `${I_two.toFixed(2)} units`, `${(ratio * 100).toFixed(1)}% of I₀`],
                ['cos² θ factor', Math.cos(rad(analyzerAngle)).toFixed(3) + ' × ' + Math.cos(rad(analyzerAngle)).toFixed(3), `θ = ${analyzerAngle}°`],
            ];
        }
        return [
            ['After P1', `${I_afterP1.toFixed(1)} units`, '50% of I₀'],
            ['After P3 (crossed)', `${I_three.toFixed(2)} units`, `${(ratio * 100).toFixed(1)}% of I₀`],
            ['Middle axis θ', `${middleAngle}°`, middleAngle === 45 ? 'MAX — gives I₀/8' : `${(Math.sin(2 * rad(middleAngle)) ** 2 * 100).toFixed(1)}% of max`],
        ];
    }, [mode, analyzerAngle, middleAngle, I_afterP1, I_two, I_three, ratio]);

    const reset = useCallback(() => {
        setMode('two');
        setAnalyzerAngle(55);
        setMiddleAngle(45);
        setShowVectors(true);
        setIsPlaying(true);
    }, []);

    // ---------- Graph panel (right of canvas) ----------
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">{mode === 'two' ? "Malus' law:  I = (I₀/2) cos² θ" : 'Three polaroids:  I = (I₀/8) sin² 2θ'}</div>
                    <div className="text-xs font-semibold text-slate-500">Transmitted fraction vs. axis angle</div>
                    <MalusCurve mode={mode} angle={mode === 'two' ? analyzerAngle : middleAngle} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Axis sequence</div>
                    <div className="text-xs font-semibold text-slate-500">Looking down the beam</div>
                    <div className="mt-4 flex items-center justify-around text-center">
                        <AxisGlyph angle={0} label="P1" />
                        {mode === 'three' && <AxisGlyph angle={middleAngle} label="P2" />}
                        <AxisGlyph angle={mode === 'two' ? analyzerAngle : 90} label={mode === 'two' ? 'P2' : 'P3'} />
                    </div>
                </div>
            </div>
        </aside>
    );

    // ---------- Values panel (left of canvas) ----------
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/95 p-4 shadow-xl">
                    <div className="text-base font-extrabold text-cyan-900">Polarisation</div>
                    <div className="text-xs font-semibold text-cyan-700">NCERT Wave Optics · §10.7</div>
                    <ul className="mt-3 space-y-1.5 text-sm leading-snug text-cyan-950">
                        <li>Light is a <b>transverse</b> EM wave — its E-vector lies perpendicular to the ray.</li>
                        <li>Unpolarised light has E-vectors at every angle (sum of independent waves).</li>
                        <li>A polaroid (P1) passes only the component along its axis ⇒ <b>I₀ → I₀/2</b>.</li>
                        <li><b>Malus' law:</b> I = I₁ cos² θ, where θ is between successive pass axes.</li>
                        <li>Cross P1 ⊥ P3: no light. Insert P2 between them ⇒ light reappears, max at 45°.</li>
                    </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">Real-time values</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE
                        </span>
                    </div>
                    <div className="space-y-2">
                        {readouts.map(([label, value, note]) => (
                            <div key={label} className="rounded-lg border border-slate-100 bg-cyan-50 px-3 py-2.5">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
                                <div className="mt-1 font-mono text-base font-extrabold text-cyan-700">{value}</div>
                                <div className="mt-1 text-xs font-semibold text-slate-500">{note}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulation = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button onClick={() => setIsPlaying(v => !v)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title={isPlaying ? 'Pause' : 'Play'}>
                        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button onClick={reset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}{valuesPanel}
        </div>
    );

    const controls = (
        <div className="w-full">
            <div className="mb-3 flex items-center gap-2 text-slate-800">
                <Sun size={18} className="text-amber-500" />
                <span className="font-extrabold text-base">Polarisation Bench</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Setup</div>
                    <div className="grid grid-cols-2 gap-1">
                        <ModeButton active={mode === 'two'} onClick={() => setMode('two')} icon={<SlidersHorizontal size={14} />} label="Two polaroids (Malus)" />
                        <ModeButton active={mode === 'three'} onClick={() => setMode('three')} icon={<Eye size={14} />} label="Three polaroids (P1 ⊥ P3)" />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    {mode === 'two' ? (
                        <>
                            <SliderRow label="Analyser P2 angle θ" value={analyzerAngle} min={0} max={180} step={1} unit="°" onChange={setAnalyzerAngle} />
                            <div className="mt-3 flex gap-2">
                                {[0, 30, 45, 60, 90].map(a => (
                                    <button key={a} onClick={() => setAnalyzerAngle(a)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:border-cyan-400 hover:text-cyan-700">{a}°</button>
                                ))}
                            </div>
                            <p className="mt-2 text-[11px] leading-snug text-slate-500">θ = 0° ⇒ full pass (I₀/2). θ = 90° ⇒ extinction.</p>
                        </>
                    ) : (
                        <>
                            <SliderRow label="Middle P2 angle θ" value={middleAngle} min={0} max={90} step={1} unit="°" onChange={setMiddleAngle} />
                            <div className="mt-3 flex gap-2">
                                {[0, 30, 45, 60, 90].map(a => (
                                    <button key={a} onClick={() => setMiddleAngle(a)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:border-cyan-400 hover:text-cyan-700">{a}°</button>
                                ))}
                            </div>
                            <p className="mt-2 text-[11px] leading-snug text-slate-500">θ = 0° or 90° ⇒ zero. θ = 45° ⇒ maximum (I₀/8).</p>
                        </>
                    )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Display</div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none">
                        <input type="checkbox" checked={showVectors} onChange={e => setShowVectors(e.target.checked)} className="w-4 h-4 accent-cyan-600" />
                        Show E-field vectors
                    </label>
                    <p className="mt-2 text-[11px] leading-snug text-slate-500">
                        Cross-section circles show the E-vector orientation between elements: random before P1, aligned after.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulation} ControlsComponent={controls} />
    );
};

// ================= UI subcomponents =================

const ModeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick}
        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-semibold transition-colors ${active ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
        {icon}<span>{label}</span>
    </button>
);

const SliderRow: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }> = ({ label, value, min, max, step, unit, onChange }) => (
    <div>
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className="font-mono text-sm font-bold text-cyan-700">{value} {unit}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-2 accent-cyan-500" />
    </div>
);

const AxisGlyph: React.FC<{ angle: number; label: string }> = ({ angle, label }) => (
    <div>
        <div className="relative mx-auto h-16 w-16 rounded-full border-2 border-cyan-300 bg-white">
            <span className="absolute left-1/2 top-1/2 h-12 w-1 rounded bg-cyan-700" style={{ transform: `translate(-50%, -50%) rotate(${angle}deg)` }} />
        </div>
        <div className="mt-1 text-xs font-extrabold text-slate-700">{label}: {angle}°</div>
    </div>
);

const MalusCurve: React.FC<{ mode: Mode; angle: number }> = ({ mode, angle }) => {
    const w = 300, h = 170;
    const padL = 32, padB = 28, padT = 10, padR = 10;
    const maxAngle = mode === 'two' ? 180 : 90;
    const f = (a: number) => mode === 'two' ? Math.cos(rad(a)) ** 2 : Math.sin(2 * rad(a)) ** 2;  // both 0..1
    const x = (a: number) => padL + (a / maxAngle) * (w - padL - padR);
    const y = (v: number) => h - padB - v * (h - padT - padB);
    const pts: string[] = [];
    for (let a = 0; a <= maxAngle; a += 2) pts.push(`${x(a).toFixed(1)},${y(f(a)).toFixed(1)}`);
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full">
            <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#475569" strokeWidth={1} />
            <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#475569" strokeWidth={1} />
            <polyline fill="none" stroke="#0891b2" strokeWidth={3} points={pts.join(' ')} />
            <circle cx={x(angle)} cy={y(f(angle))} r={6} fill="#dc2626" stroke="#fff" strokeWidth={2} />
            <text x={padL - 4} y={padT + 10} fontSize={10} textAnchor="end" fill="#64748b">1</text>
            <text x={padL - 4} y={h - padB + 2} fontSize={10} textAnchor="end" fill="#64748b">0</text>
            <text x={x(maxAngle)} y={h - 8} fontSize={10} textAnchor="end" fill="#64748b">{maxAngle}°</text>
            <text x={padL} y={h - 8} fontSize={10} fill="#64748b">0°</text>
        </svg>
    );
};

// ================= CANVAS DRAWING =================

function drawScene(ctx: CanvasRenderingContext2D, state: Snapshot, time: number) {
    const t = state.isPlaying ? time : 0;
    // Layout
    const cy = 360;
    const xSource = 90;
    const xP1 = 360;
    const xMid = state.mode === 'three' ? 620 : 0;
    const xP2or3 = state.mode === 'three' ? 880 : 760;
    const xDetector = 1140;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(state.mode === 'two'
        ? 'Two polaroids — Malus law:  I = (I₀/2) · cos² θ   (NCERT §10.7.2)'
        : 'Crossed polaroids with a middle sheet:  I = (I₀/8) · sin² 2θ   (NCERT §10.7.2)',
        24, 30);

    // Compute intensities at each leg
    const Iin = 100;
    const I1 = Iin / 2;                                                    // after P1
    let I2 = I1;                                                            // after P2 (or before P3 in 3-mode)
    let I3 = 0;                                                             // after P3 (3-mode only)
    if (state.mode === 'two') {
        I2 = I1 * Math.cos(rad(state.analyzerAngle)) ** 2;
    } else {
        I2 = I1 * Math.cos(rad(state.middleAngle)) ** 2;                    // after P2
        I3 = I2 * Math.cos(rad(90 - state.middleAngle)) ** 2;               // after P3 (cross to P2)
    }
    const Iout = state.mode === 'two' ? I2 : I3;

    // ---------- Beam ----------
    // Source → P1
    drawBeam(ctx, xSource + 50, xP1 - 30, cy, 1.0, '#fde68a');
    // P1 → next element
    drawBeam(ctx, xP1 + 30, (state.mode === 'three' ? xMid - 30 : xP2or3 - 30), cy, I1 / Iin, '#a5f3fc');
    if (state.mode === 'three') {
        drawBeam(ctx, xMid + 30, xP2or3 - 30, cy, I2 / Iin, '#c4b5fd');
    }
    // last element → detector
    drawBeam(ctx, xP2or3 + 30, xDetector - 50, cy, Iout / Iin, '#fde68a');

    // ---------- Animated propagating wave packets ----------
    // Unpolarised (before P1): swarm of differently-oriented vectors moving along
    drawUnpolarisedSwarm(ctx, xSource + 50, xP1 - 30, cy, t, state.showVectors);
    // After P1: travelling sine wave oscillating along axis 0° (vertical)
    drawPolarisedWave(ctx, xP1 + 30, (state.mode === 'three' ? xMid - 30 : xP2or3 - 30), cy, 0, I1 / 50, t, state.showVectors, '#0891b2');
    if (state.mode === 'three') {
        // After P2 (axis = middleAngle): travelling wave at θ
        drawPolarisedWave(ctx, xMid + 30, xP2or3 - 30, cy, state.middleAngle, Math.sqrt(I2 / 50), t, state.showVectors, '#7c3aed');
    }
    // After analyser/P3: at analyser axis (or 90° for P3)
    const finalAxis = state.mode === 'two' ? state.analyzerAngle : 90;
    drawPolarisedWave(ctx, xP2or3 + 30, xDetector - 50, cy, finalAxis, Math.sqrt(Iout / 50), t, state.showVectors, '#d97706');

    // ---------- Cross-section "head-on" circles between elements ----------
    drawCrossSection(ctx, (xSource + xP1) / 2, cy + 130, 'before P1', 'unpol', 0, 1, t, state.showVectors);
    drawCrossSection(ctx,
        ((xP1) + (state.mode === 'three' ? xMid : xP2or3)) / 2, cy + 130,
        'after P1', 'pol', 0, I1 / Iin, t, state.showVectors);
    if (state.mode === 'three') {
        drawCrossSection(ctx, (xMid + xP2or3) / 2, cy + 130, 'after P2', 'pol', state.middleAngle, I2 / Iin, t, state.showVectors);
    }
    drawCrossSection(ctx, (xP2or3 + xDetector) / 2, cy + 130, state.mode === 'two' ? 'after P2' : 'after P3', 'pol', finalAxis, Iout / Iin, t, state.showVectors);

    // ---------- Elements ----------
    drawSource(ctx, xSource, cy, t);
    drawPolaroid(ctx, xP1, cy, 0, '#0891b2', 'P1', 'axis 0°');
    if (state.mode === 'three') {
        drawPolaroid(ctx, xMid, cy, state.middleAngle, '#7c3aed', 'P2', `axis ${state.middleAngle}°`);
        drawPolaroid(ctx, xP2or3, cy, 90, '#2563eb', 'P3', 'axis 90° (crossed)');
    } else {
        drawPolaroid(ctx, xP2or3, cy, state.analyzerAngle, '#2563eb', 'P2', `axis ${state.analyzerAngle}°`);
    }
    drawDetector(ctx, xDetector, cy, Iout / Iin, Iout);

    // ---------- Intensity labels along the beam ----------
    ctx.font = '700 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#92400e';
    ctx.fillText('I₀ = 100', (xSource + xP1) / 2, cy - 50);
    ctx.fillStyle = '#0e7490';
    ctx.fillText('I₀/2 = 50.0', (xP1 + (state.mode === 'three' ? xMid : xP2or3)) / 2, cy - 50);
    if (state.mode === 'three') {
        ctx.fillStyle = '#6d28d9';
        ctx.fillText(`I = ${I2.toFixed(2)}`, (xMid + xP2or3) / 2, cy - 50);
    }
    ctx.fillStyle = '#b45309';
    ctx.fillText(`I = ${Iout.toFixed(2)}`, (xP2or3 + xDetector) / 2, cy - 50);

    // Bottom hint
    ctx.fillStyle = '#64748b';
    ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.mode === 'two'
        ? 'Watch the E-vectors: random before P1, locked vertical after P1, projected onto P2 axis after P2.'
        : 'Without P2 the beam is extinguished. P2 rotates the E-vector partly, so some component leaks through P3 (max at 45°).',
        W / 2, H - 22);
}

// ----- Source -----
function drawSource(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 25 + Math.sin(t * 4) * 5;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    label(ctx, 'Unpolarised', x, y - 56, '#334155', 'center', '700 13px Inter');
    label(ctx, 'source', x, y - 40, '#334155', 'center', '700 13px Inter');
    label(ctx, 'I₀ = 100 units', x, y + 60, '#92400e', 'center', '700 12px Inter');
}

// ----- Beam (translucent band whose opacity = intensity ratio) -----
function drawBeam(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, ratio: number, color: string) {
    const r = clamp(ratio, 0.04, 1);
    const a1 = Math.round(r * 200).toString(16).padStart(2, '0');
    const a2 = Math.round(r * 120).toString(16).padStart(2, '0');
    const g = ctx.createLinearGradient(x1, 0, x2, 0);
    g.addColorStop(0, color + a1);
    g.addColorStop(1, color + a2);
    ctx.fillStyle = g;
    ctx.fillRect(x1, y - 26, Math.max(0, x2 - x1), 52);
}

// ----- Unpolarised swarm (vectors at random angles, drifting along the beam) -----
function drawUnpolarisedSwarm(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, t: number, visible: boolean) {
    if (!visible) return;
    const len = x2 - x1;
    if (len <= 0) return;
    const n = 14;
    for (let i = 0; i < n; i++) {
        // particle position drifts left→right and wraps
        const u = ((i / n) + (t * 0.18)) % 1;
        const px = x1 + u * len;
        // pseudo-random angle that rotates over time (different per particle seed)
        const seed = i * 2.39 + 1.0;
        const ang = (t * 1.4 + seed) * (1 + 0.4 * Math.sin(seed));
        vector(ctx, px, y, (ang * 180) / Math.PI, 22, '#f59e0b', 0.85);
    }
}

// ----- Polarised propagating wave: sine envelope along the beam, oriented at axis° -----
function drawPolarisedWave(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, axisDeg: number, amp01: number, t: number, visible: boolean, color: string) {
    if (x2 <= x1) return;
    const amp = clamp(amp01, 0, 1) * 26;
    if (amp < 1) return;

    // The wave is transverse: E-vector oscillates IN the plane perpendicular to the ray.
    // We project the perpendicular component onto the screen as a sine wave along the beam,
    // tilted at axisDeg so the user sees the orientation.
    const kx = 0.035;      // spatial freq
    const omega = 4.5;     // temporal freq
    const sinT = Math.sin(rad(axisDeg));
    const cosT = Math.cos(rad(axisDeg));

    if (visible) {
        // Sinusoidal envelope: at each x, draw an arrow whose length = amp · sin(kx·x − ω·t)
        const step = 18;
        for (let x = x1; x <= x2; x += step) {
            const s = Math.sin(kx * (x - x1) - omega * t);
            const len = amp * s;
            // arrow oriented along axisDeg, length = signed `len`
            const dx = sinT * len;
            const dy = -cosT * len;
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.85;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + dx, y + dy);
            ctx.stroke();
            // arrow head
            if (Math.abs(len) > 2) {
                const a = Math.atan2(dy, dx);
                ctx.beginPath();
                ctx.moveTo(x + dx, y + dy);
                ctx.lineTo(x + dx - 6 * Math.cos(a - 0.5), y + dy - 6 * Math.sin(a - 0.5));
                ctx.lineTo(x + dx - 6 * Math.cos(a + 0.5), y + dy - 6 * Math.sin(a + 0.5));
                ctx.fillStyle = color;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Continuous sinusoidal envelope curve (the wave itself), drawn tilted at axisDeg
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = x1; x <= x2; x += 4) {
            const s = Math.sin(kx * (x - x1) - omega * t);
            const off = amp * s;
            const px = x + sinT * off;
            const py = y - cosT * off;
            if (x === x1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

// ----- Cross-section "head-on" disc showing the E-vector orientation -----
function drawCrossSection(
    ctx: CanvasRenderingContext2D, x: number, y: number,
    label_: string, kind: 'unpol' | 'pol', axisDeg: number, amp01: number, t: number, visible: boolean
) {
    const R = 34;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // dashed cross
    ctx.strokeStyle = '#e2e8f0'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x - R, y); ctx.lineTo(x + R, y); ctx.moveTo(x, y - R); ctx.lineTo(x, y + R); ctx.stroke();
    ctx.setLineDash([]);

    if (visible) {
        if (kind === 'unpol') {
            // many E vectors at random angles
            for (let i = 0; i < 8; i++) {
                const a = ((t * 1.6 + i * 0.95) % (Math.PI * 2));
                const len = R - 6;
                ctx.strokeStyle = '#f59e0b';
                ctx.globalAlpha = 0.85;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x - Math.cos(a) * len, y - Math.sin(a) * len);
                ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        } else {
            // single oscillating E vector along axisDeg, amplitude pulses sinusoidally
            const s = Math.abs(Math.sin(t * 4.5));
            const len = (R - 6) * Math.max(0.1, amp01) * (0.5 + 0.5 * s);
            const ang = rad(axisDeg);
            ctx.strokeStyle = '#0e7490';
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - Math.sin(ang) * len, y + Math.cos(ang) * len);
            ctx.lineTo(x + Math.sin(ang) * len, y - Math.cos(ang) * len);
            ctx.stroke();
            ctx.lineCap = 'butt';
            // arrowheads
            const tipX = x + Math.sin(ang) * len, tipY = y - Math.cos(ang) * len;
            const tipX2 = x - Math.sin(ang) * len, tipY2 = y + Math.cos(ang) * len;
            ctx.fillStyle = '#0e7490';
            arrowHead(ctx, tipX, tipY, ang + Math.PI / 2);
            arrowHead(ctx, tipX2, tipY2, ang - Math.PI / 2);
        }
    }
    ctx.restore();
    label(ctx, label_, x, y + R + 14, '#475569', 'center', '700 11px Inter');
}

function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number) {
    const h = 7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - h * Math.cos(ang - 0.5), y - h * Math.sin(ang - 0.5));
    ctx.lineTo(x - h * Math.cos(ang + 0.5), y - h * Math.sin(ang + 0.5));
    ctx.closePath();
    ctx.fill();
}

// ----- Polaroid sheet with hatching showing pass axis -----
function drawPolaroid(ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number, color: string, name: string, detail: string) {
    ctx.save();
    ctx.translate(x, y);
    // frame
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-30, -100, 60, 200, 12);
    else ctx.rect(-30, -100, 60, 200);
    ctx.fill(); ctx.stroke();

    // hatch lines parallel to pass axis (clipped to the sheet)
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-30, -100, 60, 200, 12);
    else ctx.rect(-30, -100, 60, 200);
    ctx.clip();
    ctx.rotate(rad(angleDeg));
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.2;
    for (let i = -8; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 10, -240); ctx.lineTo(i * 10, 240);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // bold pass-axis line
    ctx.rotate(rad(angleDeg));
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -84); ctx.lineTo(0, 84);
    ctx.stroke();
    // axis tick arrows
    ctx.fillStyle = color;
    arrowHead(ctx, 0, -84, -Math.PI / 2);
    arrowHead(ctx, 0, 84, Math.PI / 2);
    ctx.lineCap = 'butt';
    ctx.restore();

    label(ctx, name, x, y - 124, color, 'center', '800 17px Inter');
    label(ctx, detail, x, y + 124, '#475569', 'center', '700 12px Inter');
}

// ----- Detector with intensity bar meter -----
function drawDetector(ctx: CanvasRenderingContext2D, x: number, y: number, ratio: number, I: number) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 42, y - 100, 84, 200, 14);
    else ctx.rect(x - 42, y - 100, 84, 200);
    ctx.fill(); ctx.stroke();

    // lens glow
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 32 * ratio;
    ctx.fillStyle = `rgba(254, 240, 138, ${Math.max(0.05, ratio)})`;
    ctx.beginPath(); ctx.arc(x - 18, y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // outline
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x - 18, y, 22, 0, Math.PI * 2); ctx.stroke();

    // vertical bar meter on the right inside the detector
    const bx = x + 14, by = y - 70, bw = 14, bh = 140;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(bx, by, bw, bh);
    const fill = bh * clamp(ratio * 2, 0, 1);  // ratio max is 0.5 (I0/2), scale up
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(bx, by + bh - fill, bw, fill);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    // tick marks
    for (let i = 0; i <= 4; i++) {
        const ty = by + (i / 4) * bh;
        ctx.beginPath(); ctx.moveTo(bx + bw, ty); ctx.lineTo(bx + bw + 4, ty); ctx.stroke();
    }

    ctx.restore();
    label(ctx, 'Detector', x, y - 116, '#334155', 'center', '800 14px Inter');
    label(ctx, `${I.toFixed(2)}`, x, y + 116, '#0f172a', 'center', '800 14px Inter');
    label(ctx, 'units', x, y + 132, '#64748b', 'center', '600 11px Inter');
}

function vector(ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number, length: number, color: string, opacity: number) {
    const a = rad(angleDeg);
    const dx = Math.sin(a) * length;
    const dy = -Math.cos(a) * length;
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - dx, y - dy);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'center', font = '12px Inter') {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.font = font;
    ctx.fillText(text, x, y);
}

export default PolarisationLab;
