import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Atom, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface Props { topic: any; onExit: () => void; }
type Mode = 'binding' | 'decay' | 'reactions';
type Reaction = 'fission' | 'fusion';

const W = 1280;
const H = 760;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// NCERT Fig 13.1 reference points (BE per nucleon in MeV)
const bindingData = [
    { a: 2, be: 1.11, label: 'H-2' },
    { a: 4, be: 7.07, label: 'He-4' },
    { a: 12, be: 7.68, label: 'C-12' },
    { a: 16, be: 7.98, label: 'O-16' },
    { a: 40, be: 8.55, label: 'Ca-40' },
    { a: 56, be: 8.79, label: 'Fe-56' },
    { a: 120, be: 8.50, label: 'Sn-120' },
    { a: 197, be: 7.92, label: 'Au-197' },
    { a: 238, be: 7.57, label: 'U-238' },
];

// Estimate Z from A using simple stable-valley approximation (NCERT-style)
// Light: Z ≈ A/2; heavy: Z ≈ A/(1.98 + 0.0155 A^(2/3))
const estimateZ = (A: number) => {
    if (A <= 20) return Math.round(A / 2);
    return Math.round(A / (1.98 + 0.0155 * Math.pow(A, 2 / 3)));
};

// Interpolate BE/A from reference points
const interpBE = (A: number) => {
    if (A <= bindingData[0].a) return bindingData[0].be;
    if (A >= bindingData[bindingData.length - 1].a) return bindingData[bindingData.length - 1].be;
    for (let i = 1; i < bindingData.length; i++) {
        if (A <= bindingData[i].a) {
            const a = bindingData[i - 1], b = bindingData[i];
            const t = (A - a.a) / (b.a - a.a);
            return a.be + t * (b.be - a.be);
        }
    }
    return 0;
};

// ===================== COMPONENT =====================
const NucleiLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tRef = useRef(0);
    const lastTRef = useRef(performance.now());

    const [mode, setMode] = useState<Mode>('binding');
    const [paused, setPaused] = useState(false);

    // Scene A — binding
    const [massNumber, setMassNumber] = useState(56);

    // Scene B — decay  (N₀ fixed at 100 — one dot = one nucleus, easiest to teach)
    const initialNuclei = 100;
    const [halfLife, setHalfLife] = useState(10);
    const [elapsed, setElapsed] = useState(10);

    // Scene C — reactions
    const [reaction, setReaction] = useState<Reaction>('fission');

    const Z = useMemo(() => estimateZ(massNumber), [massNumber]);
    const N = massNumber - Z;
    const beA = useMemo(() => interpBE(massNumber), [massNumber]);
    const totalBE = beA * massNumber;
    const massDefectAMU = totalBE / 931.5; // Δm·c² (MeV) → Δm (u) using NCERT 1 u = 931.5 MeV/c²

    const decay = useMemo(() => {
        const lambda = Math.log(2) / halfLife;
        const remaining = initialNuclei * Math.exp(-lambda * elapsed);
        return {
            lambda,
            remaining,
            decayed: initialNuclei - remaining,
            activity: lambda * remaining,
            fractionRemaining: remaining / initialNuclei,
            nHalfLives: elapsed / halfLife,
        };
    }, [elapsed, halfLife, initialNuclei]);

    // Sync the fixed 100-dot grid to the current alive fraction.
    // Each dot represents N₀/100 nuclei. State is deterministic: first `aliveCount` dots are alive.
    useEffect(() => {
        const grid = decayGridRefStatic();
        const target = Math.round(decay.fractionRemaining * 100);
        const aliveNow = grid.alive.filter(Boolean).length;
        if (aliveNow > target) {
            // Mark (aliveNow - target) dots dead, walking from the end. Trigger a fade.
            let killed = 0;
            for (let i = grid.alive.length - 1; i >= 0 && killed < (aliveNow - target); i--) {
                if (grid.alive[i]) {
                    grid.alive[i] = false;
                    grid.fade[i] = 1; // start fade-out (1 → 0 over time)
                    killed++;
                    // Queue at most 2 emissions per frame to keep things calm
                    if (grid.emissions.length < 6) {
                        const { x, y } = gridPos(i);
                        const ang = Math.random() * Math.PI * 2;
                        const sp = 55 + Math.random() * 35;
                        grid.emissions.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1.5, kind: Math.random() < 0.5 ? 'a' : 'b' });
                    }
                }
            }
        } else if (aliveNow < target) {
            // Scrubbed time backwards — revive from the front
            let restored = 0;
            for (let i = 0; i < grid.alive.length && restored < (target - aliveNow); i++) {
                if (!grid.alive[i]) {
                    grid.alive[i] = true;
                    grid.fade[i] = 0; // fully solid alive
                    restored++;
                }
            }
        }
    }, [decay.fractionRemaining]);

    const reset = useCallback(() => {
        setMode('binding'); setPaused(false);
        setMassNumber(56);
        setHalfLife(10); setElapsed(10);
        setReaction('fission');
    }, []);

    // ============ Animation loop ============
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - lastTRef.current) / 1000);
            lastTRef.current = now;
            if (!paused) tRef.current += dt;
            const t = tRef.current;

            // bg
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
            for (let x = 40; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, H - 30); ctx.stroke(); }
            for (let y = 40; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke(); }

            // title
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            const title =
                mode === 'binding' ? 'Nucleus & Binding Energy — NCERT §13.4 (Fig 13.1: BE/A peaks at Fe-56 ≈ 8.79 MeV)' :
                    mode === 'decay' ? 'Radioactive Decay — N = N₀ e^(−λt),  λ = ln2 / T½  (NCERT §13.5)' :
                        reaction === 'fission'
                            ? 'Neutron-induced Fission of U-235  →  ~200 MeV released  (NCERT §13.7.1)'
                            : 'D-T Fusion:  ²H + ³H → ⁴He + n + 17.6 MeV  (NCERT §13.7.3)';
            ctx.fillText(title, 24, 30);

            if (mode === 'binding') drawBinding(ctx, t, massNumber, Z, N, beA, paused);
            else if (mode === 'decay') drawDecay(ctx, t, dt, paused, initialNuclei, halfLife, elapsed);
            else drawReaction(ctx, t, reaction, paused);

            requestAnimationFrame(tick);
        };
        const raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [mode, paused, massNumber, Z, N, beA, decay, initialNuclei, halfLife, elapsed, reaction]);

    // ============ Side panels ============
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Binding-energy curve</div>
                    <div className="text-xs font-semibold text-slate-500">BE per nucleon vs. A · NCERT Fig 13.1</div>
                    <svg viewBox="0 0 310 220" className="mt-2 w-full">
                        <line x1="35" y1="190" x2="295" y2="190" stroke="#475569" strokeWidth={1} />
                        <line x1="35" y1="12" x2="35" y2="190" stroke="#475569" strokeWidth={1} />
                        {Array.from({ length: 60 }, (_, i) => {
                            const A = 2 + (i / 59) * 236;
                            return [35 + (A / 250) * 255, 190 - (interpBE(A) / 10) * 165] as [number, number];
                        }).map((p, i, arr) => i === 0 ? null : (
                            <line key={i} x1={arr[i - 1][0]} y1={arr[i - 1][1]} x2={p[0]} y2={p[1]} stroke="#d97706" strokeWidth={3} />
                        ))}
                        {bindingData.map(p => (
                            <circle key={p.label} cx={35 + (p.a / 250) * 255} cy={190 - (p.be / 10) * 165} r={3} fill="#1d4ed8" />
                        ))}
                        {(() => {
                            const cx = 35 + (massNumber / 250) * 255;
                            const cy = 190 - (beA / 10) * 165;
                            return <>
                                <line x1={cx} y1={cy} x2={cx} y2={190} stroke="#dc2626" strokeWidth={1} strokeDasharray="3 3" />
                                <circle cx={cx} cy={cy} r={6} fill="#dc2626" stroke="#fff" strokeWidth={2} />
                                <text x={cx} y={cy - 10} fontSize="10" fontWeight="800" textAnchor="middle" fill="#dc2626">A={massNumber}</text>
                            </>;
                        })()}
                        <text x="165" y="212" textAnchor="middle" fill="#64748b" fontSize="11">A (mass number)</text>
                        <text x="35" y="9" fill="#64748b" fontSize="9">MeV</text>
                    </svg>
                </div>
                {mode === 'decay' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                        <div className="text-base font-extrabold">Exponential decay</div>
                        <div className="text-xs font-semibold text-slate-500">N(t) / N₀  vs.  t / T½</div>
                        <svg viewBox="0 0 310 180" className="mt-2 w-full">
                            <line x1="35" y1="150" x2="295" y2="150" stroke="#475569" strokeWidth={1} />
                            <line x1="35" y1="12" x2="35" y2="150" stroke="#475569" strokeWidth={1} />
                            {Array.from({ length: 80 }, (_, i) => {
                                const x = (i / 79) * 5;        // 0..5 half-lives
                                const y = Math.pow(0.5, x);
                                return [35 + (x / 5) * 260, 150 - y * 130] as [number, number];
                            }).map((p, i, arr) => i === 0 ? null : (
                                <line key={i} x1={arr[i - 1][0]} y1={arr[i - 1][1]} x2={p[0]} y2={p[1]} stroke="#6d28d9" strokeWidth={3} />
                            ))}
                            {[1, 2, 3, 4].map(h => (
                                <g key={h}>
                                    <line x1={35 + (h / 5) * 260} y1={150} x2={35 + (h / 5) * 260} y2={150 - Math.pow(0.5, h) * 130} stroke="#cbd5e1" strokeDasharray="3 3" />
                                    <text x={35 + (h / 5) * 260} y={163} fontSize="9" textAnchor="middle" fill="#64748b">{h}T½</text>
                                    <text x={32} y={150 - Math.pow(0.5, h) * 130 + 3} fontSize="9" textAnchor="end" fill="#64748b">{(100 * Math.pow(0.5, h)).toFixed(h <= 2 ? 0 : 1)}%</text>
                                </g>
                            ))}
                            <circle cx={35 + Math.min(5, decay.nHalfLives) / 5 * 260} cy={150 - decay.fractionRemaining * 130} r={6} fill="#dc2626" stroke="#fff" strokeWidth={2} />
                        </svg>
                    </div>
                )}
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl">
                    <div className="text-base font-extrabold text-amber-900">
                        {mode === 'binding' ? 'Mass defect & binding energy' : mode === 'decay' ? 'Radioactivity' : 'Nuclear reactions'}
                    </div>
                    <div className="text-xs font-semibold text-amber-700">NCERT Class 12 · Ch 13</div>
                    {mode === 'binding' && (
                        <ul className="mt-3 space-y-1.5 text-sm leading-snug text-amber-950">
                            <li><b>Δm</b> = (Z m_p + N m_n) − M(nucleus)</li>
                            <li><b>BE</b> = Δm · c² ;   1 u ≡ 931.5 MeV</li>
                            <li>Higher BE/A ⇒ more stable. Peak at <b>Fe-56 ≈ 8.79 MeV</b>.</li>
                            <li>Light → heavy: fusion releases energy.<br />Heavy → medium: fission releases energy.</li>
                        </ul>
                    )}
                    {mode === 'decay' && (
                        <ul className="mt-3 space-y-1.5 text-sm leading-snug text-amber-950">
                            <li><b>dN/dt = −λN</b>  ⇒  N(t) = N₀ e^(−λt)</li>
                            <li><b>T½ = ln 2 / λ</b> ≈ 0.693 / λ</li>
                            <li>After n half-lives: N = N₀ · (½)^n</li>
                            <li>Activity <b>A = λN</b> (in becquerel)</li>
                        </ul>
                    )}
                    {mode === 'reactions' && (
                        <ul className="mt-3 space-y-1.5 text-sm leading-snug text-amber-950">
                            <li>Energy released <b>Q = Δm · c²</b></li>
                            <li>Fission of U-235 → ≈ 200 MeV (≈ 0.9 MeV/nucleon gained)</li>
                            <li>D-T fusion → 17.6 MeV (≈ 3.5 MeV/nucleon gained)</li>
                            <li>Both move products to higher BE/A.</li>
                        </ul>
                    )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">Real-time values</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE
                        </span>
                    </div>
                    <div className="space-y-2">
                        {mode === 'binding' && (
                            <>
                                <Value label="Mass number A" value={`${massNumber}`} />
                                <Value label="Z (protons)" value={`${Z}`} />
                                <Value label="N (neutrons)" value={`${N}`} />
                                <Value label="BE / nucleon" value={`${beA.toFixed(2)} MeV`} />
                                <Value label="Total BE" value={`${totalBE.toFixed(1)} MeV`} />
                                <Value label="Mass defect Δm" value={`${massDefectAMU.toFixed(4)} u`} />
                            </>
                        )}
                        {mode === 'decay' && (
                            <>
                                <Value label="Decay constant λ" value={`${decay.lambda.toFixed(4)} s⁻¹`} />
                                <Value label="Remaining N" value={`${decay.remaining.toFixed(1)} of ${initialNuclei}`} />
                                <Value label="Decayed" value={`${decay.decayed.toFixed(1)}`} />
                                <Value label="Half-lives elapsed" value={`${decay.nHalfLives.toFixed(2)} × T½`} />
                                <Value label="N/N₀" value={`${(decay.fractionRemaining * 100).toFixed(2)} %`} />
                                <Value label="Activity λN" value={`${decay.activity.toFixed(2)} Bq`} />
                            </>
                        )}
                        {mode === 'reactions' && (
                            <>
                                <Value label="Reaction" value={reaction === 'fission' ? 'n + U-235 → fragments' : '²H + ³H → ⁴He + n'} />
                                <Value label="Q (energy released)" value={reaction === 'fission' ? '≈ 200 MeV' : '17.6 MeV'} />
                                <Value label="Per nucleon" value={reaction === 'fission' ? '≈ 0.9 MeV/A' : '≈ 3.5 MeV/A'} />
                                <Value label="Source equation" value="Q = Δm · c²" />
                            </>
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
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={reset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}{valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="w-full">
            <div className="mb-3 flex items-center gap-2 text-slate-800">
                <Atom size={18} className="text-amber-600" />
                <span className="font-extrabold text-base">Nuclei Bench</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Scene</div>
                    <div className="grid grid-cols-3 gap-2">
                        <ModeButton active={mode === 'binding'} onClick={() => setMode('binding')} icon={<Atom size={14} />} label="Nucleus & BE" />
                        <ModeButton active={mode === 'decay'} onClick={() => setMode('decay')} icon={<Activity size={14} />} label="Radioactive decay" />
                        <ModeButton active={mode === 'reactions'} onClick={() => setMode('reactions')} icon={<Sparkles size={14} />} label="Fission / Fusion" />
                    </div>
                </div>

                {mode === 'binding' && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
                        <SliderRow label="Mass number A" value={massNumber} min={2} max={238} step={1} unit="" onChange={setMassNumber} />
                        <div className="mt-3 flex flex-wrap gap-2">
                            {bindingData.map(d => (
                                <button key={d.label} onClick={() => setMassNumber(d.a)}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${massNumber === d.a ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-400'}`}>
                                    {d.label}
                                </button>
                            ))}
                        </div>
                        <p className="mt-2 text-[11px] leading-snug text-slate-500">Iron-56 sits at the BE/A peak — the most tightly bound nucleus. Above & below it, fission and fusion release energy.</p>
                    </div>
                )}

                {mode === 'decay' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="Half-life T½" value={halfLife} min={1} max={30} step={1} unit="s" onChange={setHalfLife} />
                            <p className="mt-2 text-[11px] leading-snug text-slate-500">
                                Sample contains <b>N₀ = 100 nuclei</b> — one glowing dot per nucleus.
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="Elapsed time t" value={elapsed} min={0} max={Math.max(60, halfLife * 5)} step={1} unit="s" onChange={setElapsed} />
                            <div className="mt-3 flex flex-wrap gap-2">
                                {[0, 1, 2, 3, 4].map(h => (
                                    <button key={h} onClick={() => setElapsed(halfLife * h)}
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:border-amber-400 hover:text-amber-700">
                                        t = {h}·T½
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-[11px] leading-snug text-slate-500">Each ‘kill’ animation emits an α or β particle from the nucleus that just decayed.</p>
                        </div>
                    </>
                )}

                {mode === 'reactions' && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Choose reaction</div>
                        <div className="grid grid-cols-2 gap-2">
                            <ModeButton active={reaction === 'fission'} onClick={() => setReaction('fission')} icon={<Sparkles size={14} />} label="U-235 fission" />
                            <ModeButton active={reaction === 'fusion'} onClick={() => setReaction('fusion')} icon={<Sparkles size={14} />} label="D-T fusion" />
                        </div>
                        <p className="mt-2 text-[11px] leading-snug text-slate-500">
                            {reaction === 'fission'
                                ? 'A slow neutron strikes U-235 → unstable U-236 → two medium fragments + 2-3 neutrons + ~200 MeV.'
                                : 'A deuteron (²H) and a triton (³H) fuse → α-particle (⁴He) + a fast neutron + 17.6 MeV.'}
                        </p>
                    </div>
                )}
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

// ===================== UI =====================
const SliderRow: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }> = ({ label, value, min, max, step, unit, onChange }) => (
    <div>
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className="font-mono text-sm font-bold text-amber-700">{value} {unit}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-2 accent-amber-500" />
    </div>
);
const ModeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick}
        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-semibold transition-colors ${active ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
        {icon}<span>{label}</span>
    </button>
);
const Value: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 font-mono text-base font-extrabold text-amber-700">{value}</div>
    </div>
);

// ===================== CANVAS DRAWING =====================

// ----- Scene A: Nucleus structure & binding energy -----
// Nucleons are randomly placed inside a circle (radius ∝ A^(1/3) per NCERT R = R₀ A^(1/3))
// with gentle jiggling motion. Protons are red, neutrons are blue.
function drawBinding(ctx: CanvasRenderingContext2D, t: number, A: number, Z: number, N: number, beA: number, paused: boolean) {
    const cx = 520, cy = 410;
    const R = clamp(60 + Math.pow(A, 1 / 3) * 20, 70, 230);

    // glow halo
    const grad = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.8);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.18)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.8, 0, Math.PI * 2); ctx.fill();

    // nuclear surface (faint)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // pack nucleons using sunflower spiral with jitter
    const total = A;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const nucleonR = clamp(Math.sqrt((R * R) / total) * 0.85, 4, 14);
    // protons assigned to even indices roughly proportional to Z/A
    // We'll fill an array marking proton/neutron preserving counts
    const flags: ('p' | 'n')[] = new Array(total);
    for (let i = 0; i < total; i++) flags[i] = (Math.floor(i * Z / total) !== Math.floor((i + 1) * Z / total)) ? 'p' : 'n';
    // exact correction
    let pCount = flags.filter(f => f === 'p').length;
    let i = 0;
    while (pCount < Z && i < total) { if (flags[i] === 'n') { flags[i] = 'p'; pCount++; } i++; }
    i = 0;
    while (pCount > Z && i < total) { if (flags[i] === 'p') { flags[i] = 'n'; pCount--; } i++; }

    for (let k = 0; k < total; k++) {
        const ring = Math.sqrt(k / total) * (R - nucleonR);
        const ang = k * golden;
        // gentle jiggle
        const j = paused ? 0 : Math.sin(t * 2.4 + k * 1.7) * 1.6 + Math.cos(t * 1.7 + k * 0.9) * 1.3;
        const x = cx + Math.cos(ang) * (ring + j);
        const y = cy + Math.sin(ang) * (ring - j * 0.6);
        const isProton = flags[k] === 'p';
        const g = ctx.createRadialGradient(x - nucleonR * 0.3, y - nucleonR * 0.3, nucleonR * 0.2, x, y, nucleonR);
        if (isProton) { g.addColorStop(0, '#fecaca'); g.addColorStop(1, '#dc2626'); }
        else { g.addColorStop(0, '#bfdbfe'); g.addColorStop(1, '#1d4ed8'); }
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, nucleonR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // labels
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    const label = bindingData.find(d => d.a === A)?.label ?? `A = ${A}`;
    ctx.fillText(label, cx, cy + R + 36);
    ctx.font = '700 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`R = R₀·A^(1/3) ∝ ${Math.pow(A, 1 / 3).toFixed(2)}`, cx, cy + R + 56);

    // legend
    ctx.font = '700 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    legendDot(ctx, 970, 120, '#dc2626'); ctx.fillStyle = '#0f172a'; ctx.fillText(`Protons (Z) = ${Z}`, 990, 124);
    legendDot(ctx, 970, 146, '#1d4ed8'); ctx.fillStyle = '#0f172a'; ctx.fillText(`Neutrons (N) = ${N}`, 990, 150);

    // ---------- BE bar on the right ----------
    const barX = 1000, barY = 230, barW = 32, barH = 360;
    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(barX, barY, barW, barH);
    const fill = (beA / 9.5) * barH;
    const gradBar = ctx.createLinearGradient(0, barY + barH, 0, barY);
    gradBar.addColorStop(0, '#fbbf24'); gradBar.addColorStop(1, '#dc2626');
    ctx.fillStyle = gradBar;
    ctx.fillRect(barX, barY + barH - fill, barW, fill);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);
    // Fe-56 peak line
    const peakY = barY + barH - (8.79 / 9.5) * barH;
    ctx.strokeStyle = '#16a34a'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(barX - 8, peakY); ctx.lineTo(barX + barW + 8, peakY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#16a34a';
    ctx.font = '700 11px Inter, system-ui, sans-serif';
    ctx.fillText('Fe-56 peak  8.79', barX + barW + 12, peakY + 4);
    // current reading
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 14px Inter, system-ui, sans-serif';
    ctx.fillText('BE / nucleon', barX - 14, barY - 18);
    ctx.font = '900 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText(`${beA.toFixed(2)} MeV`, barX - 14, barY - 2);

    // total BE & Δm
    ctx.fillStyle = '#475569';
    ctx.font = '700 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Total BE = A·(BE/A) = ${(A * beA).toFixed(0)} MeV`, 60, H - 60);
    ctx.fillText(`Mass defect  Δm = BE/c² = ${(A * beA / 931.5).toFixed(4)} u`, 60, H - 38);
}

function legendDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 7);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
}

// ----- Scene B: live decay grid (fixed 10×10) -----
const GRID_COLS = 10;
const GRID_ROWS = 10;
const GRID_PITCH = 48;
const GRID_X0 = (W - (GRID_COLS - 1) * GRID_PITCH) / 2;   // centred horizontally
const GRID_Y0 = 150;
function gridPos(i: number) {
    const r = Math.floor(i / GRID_COLS), c = i % GRID_COLS;
    return { x: GRID_X0 + c * GRID_PITCH, y: GRID_Y0 + r * GRID_PITCH };
}
function drawDecay(ctx: CanvasRenderingContext2D, t: number, dt: number, paused: boolean,
    N0: number, halfLife: number, elapsed: number
) {
    const grid = decayGridRefStatic();

    // ----- Update fade values (smooth alive→dead transition) -----
    if (!paused) {
        for (let i = 0; i < grid.fade.length; i++) {
            if (grid.fade[i] > 0) grid.fade[i] = Math.max(0, grid.fade[i] - dt / 0.6);
        }
    }

    // ----- Title strip showing alive count -----
    const aliveDots = grid.alive.filter(Boolean).length;
    void N0;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 20px Inter, system-ui, sans-serif';
    ctx.fillText(`${aliveDots} of 100 nuclei remain`, W / 2, 88);
    ctx.font = '600 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText('Glowing = still radioactive   ·   Faded = already decayed', W / 2, 115);

    // ----- Render the 10×10 grid -----
    for (let i = 0; i < grid.alive.length; i++) {
        const { x, y } = gridPos(i);
        const alive = grid.alive[i];
        // gentle jiggle for live nuclei
        const j = paused ? 0 : Math.sin(t * 2.5 + i) * 0.7;

        if (alive) {
            // glowing live nucleus
            const g = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 18);
            g.addColorStop(0, '#fef3c7');
            g.addColorStop(0.4, '#f59e0b');
            g.addColorStop(1, '#b45309');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(x + j, y, 18, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.55)';
            ctx.lineWidth = 1.2; ctx.stroke();
        } else if (grid.fade[i] > 0) {
            // mid-fade: blend amber → grey, shrinking
            const f = grid.fade[i]; // 1 → 0
            const r = 18 * (0.55 + 0.45 * f);
            const g = ctx.createRadialGradient(x, y, 2, x, y, r);
            g.addColorStop(0, `rgba(254, 243, 199, ${0.4 + 0.5 * f})`);
            g.addColorStop(1, `rgba(245, 158, 11, ${0.2 + 0.4 * f})`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        } else {
            // fully decayed — small faded grey dot
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
        }
    }

    // ----- Move emissions -----
    if (!paused) {
        const alive: typeof grid.emissions = [];
        for (const p of grid.emissions) {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.life -= dt;
            if (p.life > 0) alive.push(p);
        }
        grid.emissions = alive;
    }
    for (const p of grid.emissions) {
        const op = clamp(p.life / 1.5, 0, 1);
        ctx.globalAlpha = op;
        if (p.kind === 'a') {
            // α — small cluster
            ctx.fillStyle = '#dc2626';
            ctx.beginPath(); ctx.arc(p.x - 3, p.y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + 3, p.y - 3, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1d4ed8';
            ctx.beginPath(); ctx.arc(p.x - 3, p.y + 3, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(p.x + 3, p.y + 3, 3.5, 0, Math.PI * 2); ctx.fill();
        } else {
            // β
            ctx.fillStyle = '#16a34a';
            ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 0.06, p.y - p.vy * 0.06);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // ===== HALF-LIFE TIMELINE (the key teaching tool) =====
    const tlX0 = 100, tlX1 = W - 100, tlY = H - 100;
    const tlSpan = tlX1 - tlX0;
    const maxHL = 5;                                   // show 0..5 half-lives
    const nHL = Math.min(maxHL, elapsed / halfLife);

    // baseline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(tlX0, tlY); ctx.lineTo(tlX1, tlY); ctx.stroke();

    // filled (elapsed) portion
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tlX0, tlY);
    ctx.lineTo(tlX0 + (nHL / maxHL) * tlSpan, tlY);
    ctx.stroke();

    // tick marks at each half-life with % remaining
    for (let h = 0; h <= maxHL; h++) {
        const tx = tlX0 + (h / maxHL) * tlSpan;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(tx, tlY - 8); ctx.lineTo(tx, tlY + 8); ctx.stroke();
        ctx.fillStyle = '#475569';
        ctx.font = '700 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(h === 0 ? '0' : `${h}·T½`, tx, tlY + 26);
        ctx.font = '700 11px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#16a34a';
        const pct = Math.pow(0.5, h) * 100;
        ctx.fillText(`${pct.toFixed(pct < 10 ? 1 : 0)}%`, tx, tlY - 16);
    }
    // current time pointer
    const px = tlX0 + (nHL / maxHL) * tlSpan;
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(px, tlY - 12);
    ctx.lineTo(px - 8, tlY - 28);
    ctx.lineTo(px + 8, tlY - 28);
    ctx.closePath();
    ctx.fill();
    ctx.font = '800 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`t = ${elapsed}s`, px, tlY - 36);

    // bottom legend
    ctx.fillStyle = '#dc2626'; ctx.font = '700 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('● α-decay particle', 100, H - 35);
    ctx.fillStyle = '#16a34a';
    ctx.fillText('● β-decay (electron)', 270, H - 35);
    ctx.fillStyle = '#64748b'; ctx.font = '600 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`T½ = ${halfLife}s   ·   λ = ln2/T½ = ${(Math.log(2) / halfLife).toFixed(4)} s⁻¹`, W - 100, H - 35);
}

// Module-scope reference to the decay grid (set by the component)
let _decayGridSingleton: {
    alive: boolean[];
    fade: number[];     // 0 = fully gone, 1 = mid-fade, snaps to 0 over time; for live dots stays 0 (we use alive flag)
    emissions: { x: number; y: number; vx: number; vy: number; life: number; kind: 'a' | 'b' }[];
} | null = null;
function decayGridRefStatic() {
    if (!_decayGridSingleton) {
        _decayGridSingleton = {
            alive: new Array(GRID_COLS * GRID_ROWS).fill(true),
            fade: new Array(GRID_COLS * GRID_ROWS).fill(0),
            emissions: [],
        };
    }
    return _decayGridSingleton;
}

// ----- Scene C: fission / fusion animated cycle -----
function drawReaction(ctx: CanvasRenderingContext2D, t: number, reaction: Reaction, paused: boolean) {
    const cycle = reaction === 'fission' ? 5.5 : 4.5;
    const u = ((t % cycle) / cycle);   // 0..1 cycle phase
    if (reaction === 'fission') drawFission(ctx, u, t, paused);
    else drawFusion(ctx, u, t, paused);
}

function drawNuclide(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, label: string, color: string) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, color);
    g.addColorStop(1, shade(color, -0.35));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${Math.max(11, r * 0.32)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
    ctx.textBaseline = 'alphabetic';
}

function shade(hex: string, amount: number) {
    const c = hex.startsWith('#') ? hex.slice(1) : hex;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const f = (v: number) => clamp(Math.round(v + 255 * amount), 0, 255);
    return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function drawFission(ctx: CanvasRenderingContext2D, u: number, t: number, paused: boolean) {
    void paused;
    const cy = 410;
    const uxLeft = 540, uxRight = 700;
    // Phases: 0..0.25 incoming neutron; 0.25..0.45 vibration of U-236; 0.45..1 fragments + neutrons fly out + flash
    const cx = 640;

    if (u < 0.25) {
        // U-235 sitting, incoming neutron from far left
        const nx = -120 + (u / 0.25) * (uxLeft - 30 - (-120));
        drawNuclide(ctx, cx, cy, 80, 'U-235', '#d97706');
        // neutron
        drawNuclide(ctx, nx, cy, 14, 'n', '#1d4ed8');
        arrowStraight(ctx, nx - 80, cy, nx - 22, cy, '#1d4ed8');
        label(ctx, 'slow neutron', nx - 50, cy - 30, '#1e40af', 'center', '700 13px Inter');
    } else if (u < 0.45) {
        // wobbling U-236 — radius oscillates
        const v = (u - 0.25) / 0.20;                  // 0..1
        const wobble = 1 + 0.06 * Math.sin(v * Math.PI * 8);
        const rx = 80 * wobble, ry = 80 / wobble;
        ctx.save();
        const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 90);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#f59e0b'); g.addColorStop(1, '#b45309');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(15,23,42,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '800 22px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('U-236*', cx, cy);
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
        label(ctx, 'unstable compound nucleus oscillates...', cx, cy + 130, '#475569', 'center', '700 14px Inter');
    } else {
        // Fission products fly apart
        const v = (u - 0.45) / 0.55;                  // 0..1
        const dx = v * 380;
        // bright flash at start
        if (v < 0.15) {
            const flashR = 200 * (1 - v / 0.15);
            const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, flashR);
            g.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
            g.addColorStop(0.5, 'rgba(251, 191, 36, 0.5)');
            g.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(cx, cy, flashR, 0, Math.PI * 2); ctx.fill();
        }
        // Two fragments (Ba-141 and Kr-92 — common NCERT fission products)
        drawNuclide(ctx, cx - dx, cy - 30, 56, 'Ba-141', '#2563eb');
        drawNuclide(ctx, cx + dx, cy + 30, 50, 'Kr-92', '#7c3aed');
        // 3 prompt neutrons spreading out
        const neutAng = [-0.55, 0.1, 0.7];
        neutAng.forEach((a, k) => {
            const r = v * 320;
            const nx = cx + Math.cos(a) * r;
            const ny = cy - 80 + Math.sin(a) * r;
            drawNuclide(ctx, nx, ny, 12, 'n', '#1d4ed8');
        });
        // Energy released label
        const eOp = clamp(v * 2, 0, 1);
        ctx.globalAlpha = eOp;
        ctx.fillStyle = '#dc2626';
        ctx.font = '900 26px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('≈ 200 MeV released', cx, 130);
        ctx.fillStyle = '#475569';
        ctx.font = '600 13px Inter, system-ui, sans-serif';
        ctx.fillText('(≈ 0.9 MeV per nucleon — products sit higher on BE/A curve)', cx, 156);
        ctx.globalAlpha = 1;
    }

    // Equation footer
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('¹n + ²³⁵U  →  ²³⁶U*  →  ¹⁴¹Ba + ⁹²Kr + 3·¹n  + Q (≈ 200 MeV)', W / 2, H - 50);
    void t;
}

function drawFusion(ctx: CanvasRenderingContext2D, u: number, t: number, paused: boolean) {
    void paused; void t;
    const cy = 410;
    const cx = 640;
    // Phases: 0..0.4 D and T accelerate toward each other; 0.4..0.55 collision flash; 0.55..1 He + n fly out
    if (u < 0.4) {
        const v = u / 0.4;
        const sep = 380 * (1 - v);
        drawNuclide(ctx, cx - sep / 2, cy, 36, 'D', '#1d4ed8');
        drawNuclide(ctx, cx + sep / 2, cy, 40, 'T', '#7c3aed');
        // velocity arrows
        arrowStraight(ctx, cx - sep / 2 - 60, cy, cx - sep / 2 - 22, cy, '#1d4ed8');
        arrowStraight(ctx, cx + sep / 2 + 60, cy, cx + sep / 2 + 22, cy, '#7c3aed');
        label(ctx, '²H (deuteron)', cx - sep / 2, cy + 60, '#1e40af', 'center', '700 13px Inter');
        label(ctx, '³H (triton)', cx + sep / 2, cy + 60, '#5b21b6', 'center', '700 13px Inter');
        label(ctx, 'High-temperature plasma — nuclei overcome Coulomb barrier', cx, 130, '#475569', 'center', '700 14px Inter');
    } else if (u < 0.55) {
        const v = (u - 0.4) / 0.15;
        const flashR = 100 + v * 100;
        const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, flashR);
        g.addColorStop(0, 'rgba(254, 240, 138, 1)');
        g.addColorStop(0.4, 'rgba(251, 191, 36, 0.7)');
        g.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, flashR, 0, Math.PI * 2); ctx.fill();
        drawNuclide(ctx, cx, cy, 48, '⁵He*', '#dc2626');
    } else {
        const v = (u - 0.55) / 0.45;
        // He-4 flies one way (slower), neutron flies opposite (faster)
        const heX = cx - v * 200, nX = cx + v * 360;
        drawNuclide(ctx, heX, cy, 46, 'He-4', '#dc2626');
        drawNuclide(ctx, nX, cy - 20, 14, 'n', '#1d4ed8');
        // energy ribbon
        const eOp = clamp(v * 2, 0, 1);
        ctx.globalAlpha = eOp;
        ctx.fillStyle = '#dc2626';
        ctx.font = '900 26px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('17.6 MeV released', cx, 130);
        ctx.fillStyle = '#475569';
        ctx.font = '600 13px Inter, system-ui, sans-serif';
        ctx.fillText('(≈ 3.5 MeV per nucleon — He-4 is very tightly bound)', cx, 156);
        ctx.globalAlpha = 1;
    }
    // Equation footer
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('²H + ³H  →  ⁴He + ¹n + 17.6 MeV', W / 2, H - 50);
}

function arrowStraight(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(a - 0.5), y2 - 10 * Math.sin(a - 0.5));
    ctx.lineTo(x2 - 10 * Math.cos(a + 0.5), y2 - 10 * Math.sin(a + 0.5));
    ctx.closePath(); ctx.fill();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'center', font = '12px Inter') {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.font = font;
    ctx.fillText(text, x, y);
    ctx.textBaseline = 'alphabetic';
}

export default NucleiLab;

// ---- bridging helper: the component's ref needs the singleton to render the decay grid ----
// Wire by assigning during render (see ComponentEffect above).
