import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface AngularMomentumLabProps {
    topic: any;
    onExit: () => void;
}

const W = 1280;
const H = 760;
const CX = 640;          // spin centre x (canvas)
const CY = 390;          // spin centre y
const I_CORE = 1.2;      // body's own moment of inertia (kg·m²)
const REF_REACH = 2.0;
const MIN_REACH = 0.4;
const REACH_RATE = 0.85; // m/s while changing posture

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const fmt = (v: number, d = 1) => `${Math.abs(v) < 1e-4 ? 0 : v.toFixed(d)}`;

const AngularMomentumLab: React.FC<AngularMomentumLabProps> = ({ topic, onExit }) => {
    const [reach, setReach] = useState(REF_REACH); // actual arm extension / radius (m)
    const [targetReach, setTargetReach] = useState(REF_REACH);
    const [armMass, setArmMass] = useState(3);   // each arm-mass (kg)
    const [spin, setSpin] = useState(3);         // reference spin ω0 at full reach (rad/s)
    const [paused, setPaused] = useState(false);

    const angleRef = useRef(0);       // current rotation angle (rad) for animation
    const [, tick] = useState(0);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef<number | null>(null);
    const omegaRef = useRef(0);
    const pausedRef = useRef(false);
    const targetReachRef = useRef(REF_REACH);

    // ---- physics ---------------------------------------------------------
    // Moment of inertia: I = I_core + 2 m r²
    const I = I_CORE + 2 * armMass * reach * reach;
    // Angular momentum is fixed by the reference state (arms fully out at reach=2.0, ω=spin).
    const Iref = I_CORE + 2 * armMass * REF_REACH * REF_REACH;
    const Lz = Iref * spin;            // conserved axial angular momentum (τ_ext,z = 0)
    const omega = Lz / I;              // current ω from conservation
    const KE = 0.5 * I * omega * omega;
    const Imin = I_CORE + 2 * armMass * MIN_REACH * MIN_REACH;
    const omegaMax = Lz / Imin;
    const KEmax = Lz * Lz / (2 * Imin);

    omegaRef.current = omega;
    pausedRef.current = paused;
    targetReachRef.current = targetReach;

    useEffect(() => {
        const step = (now: number) => {
            const prev = lastRef.current ?? now;
            const dt = Math.min(0.04, (now - prev) / 1000);
            lastRef.current = now;
            if (!pausedRef.current) {
                setReach(current => {
                    const difference = targetReachRef.current - current;
                    if (Math.abs(difference) < 0.002) return targetReachRef.current;
                    return current + Math.sign(difference) * Math.min(Math.abs(difference), REACH_RATE * dt);
                });
                angleRef.current = (angleRef.current + omegaRef.current * dt) % (Math.PI * 2);
            }
            tick(t => (t + 1) % 1000000);
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, []);

    const reset = () => { setReach(REF_REACH); setTargetReach(REF_REACH); setArmMass(3); setSpin(3); setPaused(false); angleRef.current = 0; };

    const resetReferenceExperiment = (nextMass: number, nextSpin: number) => {
        setArmMass(nextMass);
        setSpin(nextSpin);
        setReach(REF_REACH);
        setTargetReach(REF_REACH);
        setPaused(false);
        angleRef.current = 0;
    };

    // ---- left aside bars -------------------------------------------------
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+16px)] top-0 bottom-0 z-20 hidden w-[380px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Moment of inertia vs angular speed</div>
                    <div className="text-xs font-semibold text-slate-500">arms in → I falls, ω rises (inverse)</div>
                    <TwoBarSVG
                        a={{ value: I, max: Iref * 1.05, label: 'I (kg·m²)', color: '#1d4ed8' }}
                        b={{ value: omega, max: omegaMax * 1.05, label: 'ω (rad/s)', color: '#d97706' }}
                    />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Angular momentum vs rotational KE</div>
                    <div className="text-xs font-semibold text-slate-500">Lz = Iω is conserved · KE = ½Iω² is not</div>
                    <TwoBarSVG
                        a={{ value: Lz, max: Lz * 1.25, label: 'Lz (kg·m²/s)', color: '#16a34a' }}
                        b={{ value: KE, max: KEmax * 1.05, label: 'KE (J)', color: '#7c3aed' }}
                    />
                </div>
            </div>
        </aside>
    );

    // ---- right aside theory + values -------------------------------------
    const values: { label: string; value: string; tone: string }[] = [
        { label: 'Arm reach r', value: `${fmt(reach, 2)} m`, tone: 'text-slate-700' },
        { label: 'Moment of inertia I', value: `${fmt(I, 2)} kg·m²`, tone: 'text-blue-700' },
        { label: 'Angular speed ω', value: `${fmt(omega, 2)} rad/s`, tone: 'text-amber-700' },
        { label: 'Axial momentum Lz = Iω', value: `${fmt(Lz, 1)} kg·m²/s`, tone: 'text-emerald-700' },
        { label: 'Rotational KE = ½Iω²', value: `${fmt(KE, 1)} J`, tone: 'text-violet-700' },
    ];

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-sky-200 bg-sky-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-sky-900">Conservation of angular momentum</div>
                    <div className="text-xs font-semibold text-sky-700">NCERT Ch 6 · §6.12–6.12.1</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-sky-950">
                        <p>• Vector law: <b>dL/dt = τext</b>.</p>
                        <p>• For this symmetric fixed-axis model, <b>L = Lz = Iω</b>.</p>
                        <p>• If total external torque about the axis is zero, <b>Lz</b> is constant.</p>
                        <p>• Pull arms in → I falls → ω rises so that <b>I₁ω₁ = I₂ω₂</b>.</p>
                        <p>• L is conserved, but rotational KE (½Iω²) is <b>not</b> — the skater does work.</p>
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
                        {values.map(v => (
                            <div key={v.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{v.label}</div>
                                <div className={`mt-1 font-mono text-base font-extrabold ${v.tone}`}>{v.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );

    // ---- canvas ----------------------------------------------------------
    const ang = angleRef.current;
    const armPx = reach * 140;             // linear visual scale: 140 px per metre
    const massR = clamp(14 + armMass * 4, 16, 40);
    const ex = (s: number) => CX + Math.cos(ang + s) * armPx;
    const ey = (s: number) => CY + Math.sin(ang + s) * armPx;
    const spinFast = omega > spin * 1.3;

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label="A spinning figure pulling its arms in to spin faster, demonstrating conservation of angular momentum">
                    <defs>
                        <pattern id="amGrid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0f172a" strokeOpacity="0.05" /></pattern>
                        <radialGradient id="amBody" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stopColor="#7dd3fc" /><stop offset="1" stopColor="#0ea5e9" /></radialGradient>
                        <radialGradient id="amMass" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#fb7185" /><stop offset="1" stopColor="#e11d48" /></radialGradient>
                        <filter id="amGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" /></filter>
                    </defs>

                    <rect width={W} height={H} fill="#ffffff" />
                    <rect width={W} height={H} fill="url(#amGrid)" />
                    <text x="640" y="58" textAnchor="middle" fill="#64748b" fontSize="15" fontWeight="700">Pull the arms in smoothly: I drops, ω rises, but Lz = Iω stays constant</text>
                    <g transform="translate(1060 92)">
                        <rect x="-116" y="-24" width="232" height="48" rx="14" fill="#ecfdf5" stroke="#86efac" strokeWidth="2" />
                        <text x="0" y="5" textAnchor="middle" fill="#166534" fontSize="15" fontWeight="800">τext,z = 0</text>
                    </g>

                    {/* rotation guide circle + motion arc */}
                    <circle cx={CX} cy={CY} r={armPx} fill="none" stroke="#e2e8f0" strokeWidth="2" />
                    <path d={`M ${CX + armPx} ${CY} A ${armPx} ${armPx} 0 0 1 ${CX + Math.cos(0.9) * armPx} ${CY + Math.sin(0.9) * armPx}`} fill="none" stroke={spinFast ? '#f59e0b' : '#38bdf8'} strokeWidth="5" strokeLinecap="round" opacity="0.5" />

                    {/* arms (rod) + end masses */}
                    {[0, Math.PI].map((s, i) => (
                        <g key={i}>
                            <line x1={CX} y1={CY} x2={ex(s)} y2={ey(s)} stroke="#475569" strokeWidth="8" strokeLinecap="round" />
                            <circle cx={ex(s)} cy={ey(s)} r={massR} fill="url(#amMass)" stroke="#be123c" strokeWidth="2.5" filter={spinFast ? 'url(#amGlow)' : undefined} />
                            <text x={ex(s)} y={ey(s) + 5} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="800">m</text>
                        </g>
                    ))}

                    {/* central body */}
                    <circle cx={CX} cy={CY} r="42" fill="url(#amBody)" stroke="#0284c7" strokeWidth="3" />
                    {/* a marker dot so rotation is visible */}
                    <circle cx={CX + Math.cos(ang) * 26} cy={CY + Math.sin(ang) * 26} r="7" fill="#0c4a6e" />
                    <circle cx={CX} cy={CY} r="10" fill="#ffffff" stroke="#0c4a6e" strokeWidth="2" />
                    <circle cx={CX} cy={CY} r="3.5" fill="#0c4a6e" />
                    <text x={CX + 18} y={CY - 14} fill="#0c4a6e" fontSize="13" fontWeight="800">Lz out of page</text>

                    {/* spin-rate gauge label (brief) */}
                    <text x={CX} y={CY + armPx + 48} textAnchor="middle" fill={spinFast ? '#b45309' : '#0369a1'} fontSize="20" fontWeight="800">{spinFast ? 'SPINNING FASTER' : 'SPIN'}</text>
                </svg>
            </div>

            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                    {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
                <button onClick={reset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title="Reset">
                    <RotateCcw size={15} />
                </button>
            </div>

            {graphPanel}
            {valuesPanel}
        </div>
    );

    // ---- bottom controls --------------------------------------------------
    const controlsCombo = (
        <div className="flex h-full w-full flex-col gap-3 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">Angular Momentum Bench</div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setTargetReach(0.5)} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"><Zap size={16} /> Pull arms in</button>
                    <button onClick={() => setTargetReach(REF_REACH)} className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-extrabold text-sky-800 shadow-sm transition hover:bg-sky-100">Stretch arms out</button>
                    <button onClick={() => setPaused(p => !p)} className={`flex min-w-[104px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition ${paused ? 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600' : 'bg-rose-500 shadow-rose-500/30 hover:bg-rose-600'}`}>
                        {paused ? <><Play size={16} /> Play</> : <><Pause size={16} /> Pause</>}
                    </button>
                    <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"><RotateCcw size={16} /> Reset</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                <Slider label="Target arm reach r" value={targetReach} min={MIN_REACH} max={REF_REACH} step={0.1} unit="m" onChange={e => setTargetReach(Number(e.target.value))} accent="accent-sky-500" chip="bg-sky-50 text-sky-700" />
                <Slider label="Setup mass m (resets)" value={armMass} min={1} max={6} step={0.5} unit="kg" onChange={e => resetReferenceExperiment(Number(e.target.value), spin)} accent="accent-rose-500" chip="bg-rose-50 text-rose-700" />
                <Slider label="Initial ω₀ at r = 2 m (resets)" value={spin} min={1} max={6} step={0.5} unit="rad/s" onChange={e => resetReferenceExperiment(armMass, Number(e.target.value))} accent="accent-amber-500" chip="bg-amber-50 text-amber-700" />
            </div>
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

// ---- helper ---------------------------------------------------------------

interface BarSpec { value: number; max: number; label: string; color: string }
const TwoBarSVG: React.FC<{ a: BarSpec; b: BarSpec }> = ({ a, b }) => {
    const vw = 372, vh = 168, base = vh - 28, top = 14, maxH = base - top;
    const h = (s: BarSpec) => clamp((s.value / Math.max(s.max, 1e-6)) * maxH, 3, maxH);
    const bar = (cx: number, s: BarSpec) => (
        <g>
            <rect x={cx - 52} y={base - h(s)} width="104" height={h(s)} rx="9" fill={`${s.color}22`} stroke={s.color} strokeWidth="2.5" />
            <text x={cx} y={base - h(s) - 8} textAnchor="middle" fill={s.color} fontSize="15" fontWeight="800">{fmt(s.value, 1)}</text>
            <text x={cx} y={base + 18} textAnchor="middle" fill="#475569" fontSize="11" fontWeight="700">{s.label}</text>
        </g>
    );
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[166px] w-full">
            <line x1="20" y1={base} x2={vw - 20} y2={base} stroke="#cbd5e1" strokeWidth="2" />
            {bar(112, a)}
            {bar(262, b)}
        </svg>
    );
};

interface SliderProps {
    label: string; value: number; min: number; max: number; step: number; unit: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; accent?: string; chip?: string;
}
const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, unit, onChange, accent = 'accent-sky-500', chip = 'bg-sky-50 text-sky-700' }) => (
    <label className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-slate-300">
        <span className="mb-2 flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <span>{label}</span><span className={`rounded-md px-2 py-0.5 font-mono ${chip}`}>{fmt(value, 1)} {unit}</span>
        </span>
        <input className={`h-2 w-full cursor-pointer ${accent}`} type="range" value={value} min={min} max={max} step={step} onChange={onChange} />
    </label>
);

export default AngularMomentumLab;
