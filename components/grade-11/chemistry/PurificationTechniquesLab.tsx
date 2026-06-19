import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Beaker, Droplets, Filter, Flame, Layers, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props { topic: Topic; onExit: () => void; }

type TechniqueId = 'sublimation' | 'crystallisation' | 'distillation' | 'extraction' | 'chromatography';

interface Technique {
    id: TechniqueId;
    label: string;
    principle: string;
    example: string;
    color: string;
    soft: string;
    icon: React.ReactNode;
    sliders: Array<'heat' | 'solvent' | 'cycles' | 'load'>;
}

const TECHNIQUES: Technique[] = [
    { id: 'sublimation',    label: 'Sublimation',           principle: 'Sublimable solid leaves non-sublimable impurity behind.', example: 'Camphor or naphthalene + sand', color: '#dc2626', soft: '#fee2e2', icon: <Flame size={15} />,    sliders: ['heat', 'load'] },
    { id: 'crystallisation',label: 'Crystallisation',       principle: 'Different solubility in hot and cold solvent.',           example: 'Impure benzoic acid',           color: '#2563eb', soft: '#dbeafe', icon: <Beaker size={15} />,   sliders: ['heat', 'solvent', 'load'] },
    { id: 'distillation',   label: 'Distillation',          principle: 'Different boiling points give separate vapours.',         example: 'Chloroform and aniline',        color: '#0891b2', soft: '#cffafe', icon: <Droplets size={15} />, sliders: ['heat', 'load'] },
    { id: 'extraction',     label: 'Differential Extraction',principle: 'Different solubility in two immiscible solvents.',        example: 'Organic compound in water',     color: '#7c3aed', soft: '#ede9fe', icon: <Filter size={15} />,   sliders: ['cycles', 'solvent'] },
    { id: 'chromatography', label: 'Chromatography',         principle: 'Different movement over stationary and mobile phases.',   example: 'Mixture of coloured compounds', color: '#16a34a', soft: '#dcfce7', icon: <Layers size={15} />,   sliders: ['solvent', 'load'] },
];

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }

// Animation clock (pausable). Lives in the scene so only the scene re-renders per frame.
function useTick(paused: boolean) {
    const [, force] = useState(0);
    const tRef = useRef(0);
    useEffect(() => {
        let raf = 0;
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            if (!paused) { tRef.current += dt; force(v => (v + 1) % 1000000); }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [paused]);
    return tRef.current;
}

const PurificationTechniquesLab: React.FC<Props> = ({ topic, onExit }) => {
    const [techniqueId, setTechniqueId] = useState<TechniqueId>('crystallisation');
    const [heat, setHeat] = useState(58);
    const [solvent, setSolvent] = useState(62);
    const [cycles, setCycles] = useState(3);
    const [load, setLoad] = useState(40);
    const [paused, setPaused] = useState(false);

    const technique = useMemo(() => TECHNIQUES.find(item => item.id === techniqueId)!, [techniqueId]);
    const metrics = useMemo(() => getMetrics(techniqueId, heat, solvent, cycles, load), [cycles, heat, load, solvent, techniqueId]);

    const handleReset = () => {
        setTechniqueId('crystallisation');
        setHeat(58); setSolvent(62); setCycles(3); setLoad(40);
    };

    /* ---------- Left aside — outcome chart + what is separated ---------- */
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Separation outcome</div>
                    <div className="text-xs font-semibold text-slate-500">{technique.label}</div>
                    <div className="mt-3 space-y-3">
                        <OutcomeBar label="Purity" value={metrics.purity} color="#16a34a" />
                        <OutcomeBar label="Recovery" value={metrics.recovery} color="#0891b2" />
                    </div>
                    <div className="mt-3 rounded-lg bg-violet-50 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-violet-500">Separation quality</div>
                        <div className="text-sm font-extrabold text-violet-800">{metrics.quality}</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">What is separated?</div>
                    <div className="text-xs font-semibold text-slate-500">Target compound vs impurity</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-bold">
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-3 text-rose-800">Target compound</div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-slate-600">Impurities</div>
                    </div>
                    <div className="mt-3 text-xs font-semibold leading-relaxed text-slate-600">{metrics.note}</div>
                </div>
            </div>
        </aside>
    );

    /* ---------- Right aside — theory + live values ---------- */
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-teal-200 bg-teal-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-teal-900">Purification of organic compounds</div>
                    <div className="text-xs font-semibold text-teal-700">Class 11 Chemistry, Ch 12 §8.8</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-teal-900">
                        <div><span className="font-extrabold">{technique.label}:</span> {technique.principle}</div>
                        <div>Each method exploits a difference in a physical property between the compound and its impurities.</div>
                    </div>
                    <div className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-[12px] font-semibold text-teal-800">
                        Example: {technique.example}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</div>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Final purity', value: `${metrics.purity}%`, tint: 'bg-emerald-50', fg: 'text-emerald-700' },
                            { label: 'Recovery', value: `${metrics.recovery}%`, tint: 'bg-cyan-50', fg: 'text-cyan-700' },
                            { label: 'Separation quality', value: metrics.quality, tint: 'bg-violet-50', fg: 'text-violet-700' },
                        ].map(r => (
                            <div key={r.label} className={`rounded-lg border border-slate-100 ${r.tint} px-3 py-2.5`}>
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{r.label}</div>
                                <div className={`mt-0.5 font-mono text-base font-extrabold ${r.fg}`}>{r.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />

                {/* short label — top-left */}
                <div className="absolute left-4 top-3 z-10">
                    <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                        <span style={{ color: technique.color }}>{technique.icon}</span>{technique.label}
                    </div>
                    <div className="text-xs font-semibold text-slate-500">Purification station</div>
                </div>

                {/* Pause / Play / Reset — top-right only */}
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button onClick={() => setPaused(p => !p)} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50" title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>

                {/* Apparatus — centred */}
                <div className="absolute inset-0 flex items-center justify-center px-10 pt-10">
                    {techniqueId === 'sublimation' && <SublimationScene color={technique.color} heat={heat} paused={paused} />}
                    {techniqueId === 'crystallisation' && <CrystallisationScene color={technique.color} solvent={solvent} heat={heat} paused={paused} />}
                    {techniqueId === 'distillation' && <DistillationScene color={technique.color} heat={heat} paused={paused} />}
                    {techniqueId === 'extraction' && <ExtractionScene color={technique.color} cycles={cycles} solvent={solvent} paused={paused} />}
                    {techniqueId === 'chromatography' && <ChromatographyScene color={technique.color} solvent={solvent} load={load} paused={paused} />}
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const sliderDefs: Record<string, { label: string; value: number; min: number; max: number; unit: string; color: string; set: (v: number) => void }> = {
        heat:    { label: 'Heat / energy',       value: heat,    min: 0,  max: 100, unit: '%', color: 'accent-rose-600',    set: setHeat },
        solvent: { label: 'Solvent selectivity', value: solvent, min: 0,  max: 100, unit: '%', color: 'accent-blue-600',    set: setSolvent },
        cycles:  { label: 'Extraction / plates', value: cycles,  min: 1,  max: 6,   unit: 'x', color: 'accent-violet-600',  set: setCycles },
        load:    { label: 'Sample load',          value: load,    min: 10, max: 90,  unit: '%', color: 'accent-emerald-600', set: setLoad },
    };

    const controlsCombo = (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Filter size={18} className="text-teal-600" />
                Purification Techniques Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Technique</div>
                    <div className="grid grid-cols-2 gap-2">
                        {TECHNIQUES.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setTechniqueId(item.id)}
                                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left text-xs font-extrabold transition-all ${item.id === techniqueId ? 'text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                style={{ backgroundColor: item.id === techniqueId ? item.color : '#ffffff', borderColor: item.id === techniqueId ? item.color : '#e2e8f0' }}
                            >
                                <span className="shrink-0">{item.icon}</span>
                                <span className="leading-tight">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Parameters</div>
                    {technique.sliders.map(key => {
                        const s = sliderDefs[key];
                        return <SliderBlock key={key} label={s.label} value={s.value} min={s.min} max={s.max} unit={s.unit} color={s.color} onChange={s.set} />;
                    })}
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
            controlsAreaFlex="0 0 220px"
            simulationStageWidth={1280}
            simulationStageHeight={760}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

function getMetrics(id: TechniqueId, heat: number, solvent: number, cycles: number, load: number) {
    const heatFit = 100 - Math.abs(heat - 58);
    const solventFit = 100 - Math.abs(solvent - 64);
    const loadPenalty = Math.max(0, load - 55);
    if (id === 'sublimation') {
        const purity = clamp(Math.round(54 + heat * 0.42 - loadPenalty * 0.25), 35, 98);
        return { purity, recovery: clamp(Math.round(72 + heat * 0.12 - loadPenalty * 0.2), 40, 96), quality: heat > 45 ? 'Clean deposit' : 'Weak vapour', note: 'Only the sublimable compound reaches the cool surface; sand-like impurity stays in the dish.' };
    }
    if (id === 'crystallisation') {
        const purity = clamp(Math.round(48 + solventFit * 0.35 + heatFit * 0.2 - loadPenalty * 0.2), 35, 99);
        return { purity, recovery: clamp(Math.round(58 + solventFit * 0.25 - Math.abs(heat - 60) * 0.1), 35, 94), quality: solventFit > 72 ? 'Sharp crystals' : 'Mother liquor loss', note: 'A good solvent dissolves the compound when hot but lets pure crystals form on cooling.' };
    }
    if (id === 'distillation') {
        const heatControl = 100 - Math.abs(heat - 52);
        const purity = clamp(Math.round(50 + heatControl * 0.38 - loadPenalty * 0.15), 30, 97);
        return { purity, recovery: clamp(Math.round(62 + heatControl * 0.22), 40, 95), quality: heat > 75 ? 'Co-distillation risk' : 'Separate fractions', note: 'Lower-boiling vapour reaches the condenser first; a packed column improves close-boiling mixtures.' };
    }
    if (id === 'extraction') {
        const purity = clamp(Math.round(42 + cycles * 8 + solventFit * 0.18 - loadPenalty * 0.15), 35, 98);
        return { purity, recovery: clamp(Math.round(46 + cycles * 7 + solventFit * 0.12), 35, 96), quality: cycles >= 3 ? 'Layer transfer' : 'Incomplete extraction', note: 'The organic compound partitions into the solvent layer; repeated extraction improves recovery.' };
    }
    const resolution = 100 - Math.abs(solvent - 54) - Math.max(0, load - 45) * 0.7;
    const purity = clamp(Math.round(44 + resolution * 0.42 + cycles * 2), 30, 99);
    return { purity, recovery: clamp(Math.round(55 + resolution * 0.2), 35, 90), quality: resolution > 62 ? 'Resolved bands' : 'Overlapping spots', note: 'Components travel at different rates because their adsorption or partitioning differs.' };
}

/* ----------------------------- Scenes (animated) ----------------------------- */

function SublimationScene({ color, heat, paused }: { color: string; heat: number; paused: boolean }) {
    const t = useTick(paused);
    const vapourCount = Math.max(5, Math.round(heat / 8));
    return (
        <svg viewBox="0 0 680 430" className="h-full w-full max-w-[760px]" role="img" aria-label="Sublimation apparatus">
            <text x="32" y="30" className="fill-slate-700 text-[18px] font-bold">Heat solid mixture · vapour deposits on cool surface</text>
            <path d="M230 142 L450 142 L390 52 L290 52 Z" fill="#f8fafc" stroke="#334155" strokeWidth="5" />
            <rect x="226" y="250" width="228" height="34" rx="16" fill="#e2e8f0" stroke="#475569" strokeWidth="4" />
            <path d="M250 248 C298 216 384 216 430 248 Z" fill="#fed7aa" stroke="#c2410c" strokeWidth="4" />
            {Array.from({ length: vapourCount }).map((_, i) => {
                const ph = ((t / 2.2) + i / vapourCount) % 1;
                const y = 232 - ph * 96;
                const x = 272 + (i * 18) % 150;
                return <circle key={i} cx={x} cy={y} r={4.5} fill={color} opacity={Math.sin(ph * Math.PI) * 0.7} />;
            })}
            <rect x="292" y="288" width="96" height="52" rx="10" fill={color} opacity="0.85" />
            <path d="M272 340 H410" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />
            <text x="340" y="392" textAnchor="middle" className="fill-slate-600 text-[15px] font-bold">Non-sublimable impurity remains in the dish</text>
        </svg>
    );
}

function CrystallisationScene({ color, solvent, heat, paused }: { color: string; solvent: number; heat: number; paused: boolean }) {
    const t = useTick(paused);
    const crystals = Math.max(5, Math.round((solvent + heat) / 22));
    return (
        <svg viewBox="0 0 680 430" className="h-full w-full max-w-[760px]" role="img" aria-label="Crystallisation beaker">
            <text x="34" y="30" className="fill-slate-700 text-[18px] font-bold">Dissolve hot · cool slowly · filter crystals</text>
            <path d="M200 92 H480 L450 334 Q340 372 230 334 Z" fill="#eff6ff" stroke="#334155" strokeWidth="5" />
            <path d="M224 240 Q340 264 456 240 L438 326 Q340 356 242 326 Z" fill={color} opacity="0.2" />
            {(() => {
                const n = Math.min(7, crystals);
                const x0 = 268, x1 = 412;            // keep inside the beaker bottom
                return Array.from({ length: n }).map((_, i) => {
                    const cxC = n === 1 ? 340 : x0 + i * ((x1 - x0) / (n - 1));
                    const op = 0.55 + 0.35 * Math.sin(t * 1.6 + i);
                    return <polygon key={i} points={`${cxC - 11},312 ${cxC},294 ${cxC + 11},312 ${cxC},329`} fill={color} opacity={op} />;
                });
            })()}
            {Array.from({ length: 5 }).map((_, i) => {
                const ph = ((t / 2.6) + i / 5) % 1;
                return <circle key={i} cx={278 + i * 38} cy={250 + ph * 56} r={3.5} fill={color} opacity={0.5 * (1 - ph)} />;
            })}
            <text x="340" y="388" textAnchor="middle" className="fill-slate-600 text-[15px] font-bold">Impurities stay in the mother liquor</text>
        </svg>
    );
}

function DistillationScene({ color, heat, paused }: { color: string; heat: number; paused: boolean }) {
    const t = useTick(paused);
    const vapour = Math.max(3, Math.round(heat / 14));
    const drip = (t / 2) % 1;
    const dripX = 306 + drip * 186;
    return (
        <svg viewBox="0 0 680 430" className="h-full w-full max-w-[800px]" role="img" aria-label="Distillation apparatus">
            <text x="34" y="30" className="fill-slate-700 text-[18px] font-bold">Vapourise · condense · collect the fraction</text>
            <circle cx="190" cy="270" r="76" fill="#ecfeff" stroke="#334155" strokeWidth="5" />
            <path d="M145 285 Q190 312 235 285 V320 Q190 350 145 320 Z" fill={color} opacity="0.2" />
            <path d="M190 194 V112 H288" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
            <rect x="284" y="88" width="230" height="48" rx="24" fill="#f8fafc" stroke="#334155" strokeWidth="5" />
            <path d="M514 112 C566 146 548 224 482 246" fill="none" stroke="#334155" strokeWidth="7" />
            <path d="M458 246 H560 V344 H458 Z" fill="#ecfeff" stroke="#334155" strokeWidth="5" />
            <path d="M478 300 Q510 316 540 300 V332 H478 Z" fill={color} opacity="0.35" />
            {Array.from({ length: vapour }).map((_, i) => {
                const ph = ((t / 1.6) + i / vapour) % 1;
                return <circle key={i} cx={186 - 20 + ph * 4 + i * 4} cy={250 - ph * 150} r={5} fill={color} opacity={0.6 * (1 - ph)} />;
            })}
            <circle cx={dripX} cy={112} r={5} fill={color} opacity={0.85} />
            <text x="190" y="392" textAnchor="middle" className="fill-slate-600 text-[14px] font-bold">Higher b.p. residue</text>
            <text x="508" y="392" textAnchor="middle" className="fill-slate-600 text-[14px] font-bold">Lower b.p. distillate</text>
        </svg>
    );
}

function ExtractionScene({ color, cycles, solvent, paused }: { color: string; cycles: number; solvent: number; paused: boolean }) {
    const t = useTick(paused);
    const dots = Math.max(6, cycles * 3);
    const migrate = clamp(t / 4, 0, 1) * (cycles / 6);
    const wobble = Math.sin(t * 6) * 3;
    return (
        <svg viewBox="0 0 680 430" className="h-full w-full max-w-[760px]" role="img" aria-label="Differential extraction funnel">
            <text x="34" y="30" className="fill-slate-700 text-[18px] font-bold">Shake with immiscible solvent · separate layers</text>
            <g transform={`translate(${wobble} 0)`}>
                <path d="M252 76 H428 L402 238 L350 304 L298 238 Z" fill="#fafafa" stroke="#334155" strokeWidth="5" />
                <path d="M276 142 H404 L390 226 H290 Z" fill="#dbeafe" />
                <path d="M290 226 H390 L350 284 Z" fill={color} opacity="0.28" />
                <path d="M350 304 V354" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                <rect x="320" y="350" width="60" height="18" rx="9" fill="#475569" />
                {Array.from({ length: dots }).map((_, i) => {
                    const yTop = 160 + (i * 17) % 50;
                    const yBot = 240 + (i * 9) % 36;
                    const cy = yTop + (yBot - yTop) * migrate;
                    return <circle key={i} cx={300 + (i * 31) % 90} cy={cy} r={4} fill={color} opacity={0.35 + solvent / 180} />;
                })}
            </g>
            <text x="340" y="396" textAnchor="middle" className="fill-slate-600 text-[15px] font-bold">More cycles shift more compound into the solvent layer</text>
        </svg>
    );
}

function ChromatographyScene({ color, solvent, load, paused }: { color: string; solvent: number; load: number; paused: boolean }) {
    const t = useTick(paused);
    const front = clamp(t / 5, 0, 1);
    const spread = Math.max(36, Math.min(150, solvent * 1.3));
    const band = Math.max(9, load / 5);
    const baseY = 300;
    const solventFrontY = baseY - front * 210;
    return (
        <svg viewBox="0 0 680 430" className="h-full w-full max-w-[700px]" role="img" aria-label="Paper chromatography">
            <text x="34" y="30" className="fill-slate-700 text-[18px] font-bold">Mobile phase carries components at different rates</text>
            <rect x="250" y="60" width="180" height="300" rx="6" fill="#fff7ed" stroke="#334155" strokeWidth="5" />
            {/* solvent front rising */}
            <line x1="252" y1={solventFrontY} x2="428" y2={solventFrontY} stroke="#93c5fd" strokeWidth="4" strokeDasharray="6 5" />
            <rect x="222" y="334" width="236" height="48" rx="18" fill="#dbeafe" stroke="#334155" strokeWidth="5" />
            <line x1="252" y1={baseY} x2="428" y2={baseY} stroke="#64748b" strokeWidth="2" strokeDasharray="6 6" />
            <ellipse cx="340" cy={baseY - front * spread * 0.45} rx={band} ry="9" fill="#dc2626" opacity="0.86" />
            <ellipse cx="340" cy={baseY - front * spread * 0.75} rx={band * 0.85} ry="9" fill={color} opacity="0.86" />
            <ellipse cx="340" cy={baseY - front * spread} rx={band * 0.7} ry="9" fill="#7c3aed" opacity="0.86" />
            <text x="340" y="406" textAnchor="middle" className="fill-slate-600 text-[15px] font-bold">Separated bands reveal purity and components</text>
        </svg>
    );
}

/* ----------------------------- small components ----------------------------- */

function OutcomeBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">{label}</span>
                <span className="font-mono text-slate-900">{value}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

function SliderBlock({ label, value, min, max, unit, color, onChange }: { label: string; value: number; min: number; max: number; unit: string; color: string; onChange: (value: number) => void }) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
                <span className="rounded bg-slate-50 px-2 font-mono text-xs font-bold text-slate-800">{value}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={1} value={value} onChange={event => onChange(Number(event.target.value))} className={`h-1.5 w-full cursor-pointer ${color}`} />
        </div>
    );
}

export default PurificationTechniquesLab;
