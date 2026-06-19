import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Atom, GitBranch, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props { topic: Topic; onExit: () => void; }

type Mode = 'chain' | 'position' | 'functional' | 'metamerism';

interface Isomer {
    name: string;
    formula: string;
    structure: string;
    bp?: number;
    surface: number;
    polarity: number;
    branch: number;
    typeNote: string;
}

interface ModeInfo {
    id: Mode;
    label: string;
    formula: string;
    principle: string;
    color: string;
    examples: Isomer[];
}

// NCERT Class 11 Chemistry, Ch 12 §8.6.1 — structural isomerism types & examples
const MODES: ModeInfo[] = [
    {
        id: 'chain',
        label: 'Chain',
        formula: 'C₅H₁₂',
        principle: 'Same molecular formula, different carbon skeleton.',
        color: '#2563eb',
        examples: [
            { name: 'Pentane', formula: 'C₅H₁₂', structure: 'CH3-CH2-CH2-CH2-CH3', bp: 309, surface: 96, polarity: 4, branch: 0, typeNote: 'continuous chain' },
            { name: '2-Methylbutane', formula: 'C₅H₁₂', structure: 'CH3-CH(CH3)-CH2-CH3', bp: 301, surface: 76, polarity: 4, branch: 46, typeNote: 'branched chain' },
            { name: '2,2-Dimethylpropane', formula: 'C₅H₁₂', structure: 'CH3-C(CH3)2-CH3', bp: 282.5, surface: 54, polarity: 4, branch: 92, typeNote: 'highly branched chain' },
        ],
    },
    {
        id: 'position',
        label: 'Position',
        formula: 'C₃H₈O',
        principle: 'Same skeleton and functional group, different position of the group.',
        color: '#7c3aed',
        examples: [
            { name: 'Propan-1-ol', formula: 'C₃H₈O', structure: 'CH3-CH2-CH2-OH', bp: 370, surface: 70, polarity: 78, branch: 0, typeNote: '-OH on carbon 1' },
            { name: 'Propan-2-ol', formula: 'C₃H₈O', structure: 'CH3-CH(OH)-CH3', bp: 356, surface: 58, polarity: 74, branch: 35, typeNote: '-OH on carbon 2' },
        ],
    },
    {
        id: 'functional',
        label: 'Functional',
        formula: 'C₃H₆O',
        principle: 'Same molecular formula, different functional groups.',
        color: '#dc2626',
        examples: [
            { name: 'Propanal', formula: 'C₃H₆O', structure: 'CH3-CH2-CHO', bp: 322, surface: 62, polarity: 68, branch: 0, typeNote: 'aldehyde group' },
            { name: 'Propanone', formula: 'C₃H₆O', structure: 'CH3-CO-CH3', bp: 329, surface: 55, polarity: 76, branch: 20, typeNote: 'ketone group' },
        ],
    },
    {
        id: 'metamerism',
        label: 'Metamerism',
        formula: 'C₄H₁₀O',
        principle: 'Different alkyl groups on either side of a polyvalent functional group.',
        color: '#16a34a',
        examples: [
            { name: 'Methoxypropane', formula: 'C₄H₁₀O', structure: 'CH3-O-C3H7', bp: 312, surface: 70, polarity: 42, branch: 18, typeNote: 'methyl + propyl around oxygen' },
            { name: 'Ethoxyethane', formula: 'C₄H₁₀O', structure: 'C2H5-O-C2H5', bp: 308, surface: 68, polarity: 36, branch: 0, typeNote: 'ethyl + ethyl around oxygen' },
        ],
    },
];

function useTick(paused: boolean) {
    const [, force] = useState(0);
    const tRef = useRef(0);
    useEffect(() => {
        let raf = 0;
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            if (!paused) { tRef.current += dt; force(v => (v + 1) % 1e6); }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [paused]);
    return tRef.current;
}

const StructuralIsomerismPropertiesLab: React.FC<Props> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('chain');
    const [selected, setSelected] = useState(0);
    const [paused, setPaused] = useState(false);

    const modeInfo = useMemo(() => MODES.find(item => item.id === mode)!, [mode]);
    const active = modeInfo.examples[Math.min(selected, modeInfo.examples.length - 1)];
    const sortedByBp = [...modeInfo.examples].sort((a, b) => (b.bp ?? 0) - (a.bp ?? 0));
    const allSameFormula = modeInfo.examples.every(item => item.formula === modeInfo.formula);

    const selectMode = (next: Mode) => { setMode(next); setSelected(0); };
    const handleReset = () => { setMode('chain'); setSelected(0); setPaused(false); };

    /* ---------- left aside: property graph cards ---------- */
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Boiling-point order</div>
                    <div className="text-xs font-semibold text-slate-500">isomers of {modeInfo.formula}</div>
                    <div className="mt-3 flex flex-col gap-2">
                        {sortedByBp.map(item => (
                            <PropBar key={item.name} name={item.name} value={item.bp ?? 0} max={Math.max(...sortedByBp.map(i => i.bp ?? 0), 1)} display={`${item.bp} K`} color={modeInfo.color} active={item.name === active.name} />
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Polarity & forces</div>
                    <div className="text-xs font-semibold text-slate-500">relative polarity index</div>
                    <div className="mt-3 flex flex-col gap-2">
                        {modeInfo.examples.map(item => (
                            <PropBar key={item.name} name={item.name} value={item.polarity} max={100} display={`${item.polarity}`} color="#7c3aed" active={item.name === active.name} />
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Branching</div>
                    <div className="text-xs font-semibold text-slate-500">more branching ⇒ smaller surface ⇒ lower b.p.</div>
                    <div className="mt-3 flex flex-col gap-2">
                        {modeInfo.examples.map(item => (
                            <PropBar key={item.name} name={item.name} value={item.branch} max={100} display={`${item.branch}%`} color="#f59e0b" active={item.name === active.name} />
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );

    /* ---------- right aside: theory + live values ---------- */
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-blue-900">Structural isomerism</div>
                    <div className="text-xs font-semibold text-blue-700">Class 11 Chemistry, Ch 12 §8.6.1</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-blue-900">
                        <div><span className="font-extrabold">{modeInfo.label} isomerism:</span> {modeInfo.principle}</div>
                        <div>Same molecular formula, different connectivity ⇒ different properties.</div>
                    </div>
                    <div className="mt-3 rounded-lg bg-white/70 px-3 py-2 font-mono text-[12px] font-bold text-blue-800">
                        Shared formula: {modeInfo.formula}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</div>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Selected isomer', value: active.name, tint: 'bg-slate-50', fg: 'text-slate-800' },
                            { label: 'Molecular formula', value: active.formula, tint: 'bg-blue-50', fg: 'text-blue-700' },
                            { label: 'Boiling point', value: active.bp ? `${active.bp} K` : '—', tint: 'bg-rose-50', fg: 'text-rose-700' },
                            { label: 'Polarity index', value: `${active.polarity}`, tint: 'bg-violet-50', fg: 'text-violet-700' },
                            { label: 'Surface area', value: `${active.surface}%`, tint: 'bg-sky-50', fg: 'text-sky-700' },
                            { label: 'Branching', value: `${active.branch}%`, tint: 'bg-amber-50', fg: 'text-amber-700' },
                        ].map(r => (
                            <div key={r.label} className={`rounded-lg border border-slate-100 ${r.tint} px-3 py-2.5`}>
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{r.label}</div>
                                <div className={`mt-0.5 font-mono text-base font-extrabold ${r.fg}`}>{r.value}</div>
                            </div>
                        ))}
                        <div className={`rounded-lg border px-3 py-2 text-xs font-bold ${allSameFormula ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                            {allSameFormula ? '✓ All isomers share the same molecular formula' : 'Formula mismatch'}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* short label — top-left */}
                <div className="absolute left-4 top-3 z-10">
                    <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                        <GitBranch size={18} style={{ color: modeInfo.color }} />{active.name}
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-500">{active.structure}</div>
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

                {/* Apparatus — the molecule structure, centred */}
                <div className="absolute inset-0 flex items-center justify-center px-12 pt-10">
                    <MoleculeView isomer={active} color={modeInfo.color} paused={paused} />
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Atom size={18} className="text-blue-700" />
                Structural Isomerism Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Isomerism type</div>
                    <div className="grid grid-cols-2 gap-2">
                        {MODES.map(item => (
                            <button
                                key={item.id}
                                onClick={() => selectMode(item.id)}
                                className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition-all ${mode === item.id ? 'text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                style={{ backgroundColor: mode === item.id ? item.color : '#ffffff', borderColor: mode === item.id ? item.color : '#e2e8f0' }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Isomer ({modeInfo.formula})</div>
                    <div className="flex flex-col gap-2">
                        {modeInfo.examples.map((item, index) => (
                            <button
                                key={item.name}
                                onClick={() => setSelected(index)}
                                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-extrabold transition ${selected === index ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span>{item.name}</span>
                                {item.bp && <span className="font-mono opacity-70">{item.bp} K</span>}
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
            controlsAreaFlex="0 0 220px"
            simulationStageWidth={1280}
            simulationStageHeight={760}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

/* ----------------------------- molecule (animated) ----------------------------- */

function MoleculeView({ isomer, color, paused }: { isomer: Isomer; color: string; paused: boolean }) {
    const t = useTick(paused);
    const segments = isomer.structure.split('-');
    const n = segments.length;
    const span = 620;
    const x0 = 90;
    const step = span / Math.max(1, n - 1);
    const baseY = 230;

    const atomXY = (index: number) => {
        const x = x0 + index * step;
        const wobble = Math.sin(t * 1.8 + index * 0.9) * 5;
        const lift = segments[index].includes('(') ? (index % 2 === 0 ? -22 : 22) : 0;
        return { x, y: baseY + lift + wobble };
    };

    return (
        <svg viewBox="0 0 800 460" className="h-full w-full max-w-[900px]" role="img" aria-label={`${isomer.name} structure`}>
            <defs>
                <filter id="softShadow"><feDropShadow dx="0" dy="7" stdDeviation="5" floodOpacity="0.16" /></filter>
            </defs>

            {/* bonds */}
            {segments.map((_, index) => {
                if (index === 0) return null;
                const a = atomXY(index - 1), b = atomXY(index);
                return <line key={`b${index}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#475569" strokeWidth="6" strokeLinecap="round" />;
            })}

            {/* branch methyl (animated) for branched isomers */}
            {isomer.branch > 30 && (() => {
                const mid = atomXY(Math.floor((n - 1) / 2));
                const by = 120 + Math.sin(t * 2.2) * 6;
                return (
                    <g>
                        <line x1={mid.x} y1={mid.y} x2={mid.x} y2={by + 24} stroke="#475569" strokeWidth="5" strokeLinecap="round" />
                        <circle cx={mid.x} cy={by} r={26} fill="#f97316" filter="url(#softShadow)" />
                        <text x={mid.x} y={by + 5} textAnchor="middle" className="fill-white text-[15px] font-black">CH3</text>
                    </g>
                );
            })()}

            {/* atoms */}
            {segments.map((part, index) => {
                const { x, y } = atomXY(index);
                const isPolar = part.includes('OH');
                const isCarbonyl = part.includes('CO') || part.includes('CHO');
                const pulse = 0.6 + 0.4 * Math.sin(t * 3 + index);
                return (
                    <g key={`a${index}`}>
                        {isPolar && <circle cx={x} cy={y} r={42} fill="#1d4ed8" opacity={0.18 * pulse} />}
                        {isCarbonyl && <circle cx={x} cy={y} r={42} fill="#dc2626" opacity={0.18 * pulse} />}
                        <circle cx={x} cy={y} r={34} fill={color} opacity="0.94" filter="url(#softShadow)" />
                        <text x={x} y={y + 5} textAnchor="middle" className="fill-white text-[17px] font-black">{part.replace(/\(.+\)/, '')}</text>
                        {isPolar && <text x={x} y={y + 60} textAnchor="middle" className="fill-blue-700 text-[13px] font-black">polar –OH</text>}
                        {isCarbonyl && <text x={x} y={y + 60} textAnchor="middle" className="fill-red-700 text-[13px] font-black">C=O</text>}
                    </g>
                );
            })}

            <text x={400} y={430} textAnchor="middle" className="fill-slate-500 text-[14px] font-bold">{isomer.typeNote}</text>
        </svg>
    );
}

const PropBar: React.FC<{ name: string; value: number; max: number; display: string; color: string; active: boolean }> = ({ name, value, max, display, color, active }) => {
    return (
        <div className="grid grid-cols-[120px_1fr_52px] items-center gap-2">
            <div className={`truncate text-xs font-bold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{name}</div>
            <div className="h-3.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, backgroundColor: color, opacity: active ? 1 : 0.55 }} />
            </div>
            <div className="text-right font-mono text-[11px] font-black text-slate-700">{display}</div>
        </div>
    );
};

export default StructuralIsomerismPropertiesLab;
