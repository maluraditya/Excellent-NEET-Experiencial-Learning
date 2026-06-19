import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    Atom,
    Clock,
    Dna,
    FlaskConical,
    Layers,
    Microscope,
    Pause,
    Play,
    RotateCcw,
    Timer,
    Wrench,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface CellCycleLabProps { topic: any; onExit: () => void }

type ViewMode = 'cycle' | 'content' | 'organelle' | 'duration' | 'regulation';
type Organism = 'human' | 'yeast';
type CellType = 'animal' | 'plant';
type Phase = 'G1' | 'S' | 'G2' | 'M' | 'G0';
type MSubPhase = 'Prophase' | 'Metaphase' | 'Anaphase' | 'Telophase';

const W = 1280;
const H = 760;
const CENTER_X = 640;
const CENTER_Y = 410;
const VISUAL_CYCLE_HOURS = 24;

const PHASES: Array<{ id: Exclude<Phase, 'G0'>; label: string; hours: number; color: string; light: string }> = [
    { id: 'G1', label: 'G1', hours: 11, color: '#60a5fa', light: '#dbeafe' },
    { id: 'S', label: 'S', hours: 8, color: '#34d399', light: '#d1fae5' },
    { id: 'G2', label: 'G2', hours: 4, color: '#f59e0b', light: '#fef3c7' },
    { id: 'M', label: 'M', hours: 1, color: '#ef4444', light: '#fee2e2' },
];

const M_SUB_PHASES: Array<{ id: MSubPhase; fraction: number; color: string }> = [
    { id: 'Prophase', fraction: 0.25, color: '#fb7185' },
    { id: 'Metaphase', fraction: 0.25, color: '#f43f5e' },
    { id: 'Anaphase', fraction: 0.15, color: '#e11d48' },
    { id: 'Telophase', fraction: 0.35, color: '#be123c' },
];

const MODE_META: Record<ViewMode, { label: string; color: string; light: string; section: string; ref: string }> = {
    cycle: { label: 'Cycle Wheel', color: '#4f46e5', light: '#eef2ff', section: 'Ch 10 - Section 10.1.1', ref: 'Fig 10.1' },
    content: { label: 'DNA & Chromosome', color: '#059669', light: '#ecfdf5', section: 'Ch 10 - S phase', ref: 'Section 10.1.1' },
    organelle: { label: 'Organelle Choreography', color: '#d97706', light: '#fffbeb', section: 'Ch 10 - Interphase + M phase', ref: 'Section 10.1.1' },
    duration: { label: 'Duration & Variation', color: '#7c3aed', light: '#f5f3ff', section: 'Ch 10 - Fig 10.1', ref: 'Fig 10.1' },
    regulation: { label: 'Regulation', color: '#475569', light: '#f8fafc', section: 'NEET extension', ref: 'Beyond NCERT Class 11' },
};

const PHASE_NARRATION: Record<Phase, string> = {
    G1: 'Interval between mitosis and initiation of DNA replication. The cell is metabolically active and continuously grows but does not replicate its DNA. Most organelle duplication also occurs during this phase.',
    S: 'DNA synthesis/replication takes place. DNA per cell doubles from 2C to 4C; chromosome number remains 2n. In animal cells, the centriole duplicates in the cytoplasm.',
    G2: 'Proteins are synthesised in preparation for mitosis while cell growth continues.',
    M: 'Actual cell division: karyokinesis followed by cytokinesis. Mitosis is equational division because chromosome number is conserved.',
    G0: 'Quiescent stage. Cells such as heart cells remain metabolically active but no longer proliferate unless required by the organism.',
};

const CellCycleLab: React.FC<CellCycleLabProps> = ({ topic, onExit }) => {
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef<number>(0);
    const cycleRef = useRef(0);
    const [playing, setPlaying] = useState(true);
    const [mode, setMode] = useState<ViewMode>('cycle');
    const [organism, setOrganism] = useState<Organism>('human');
    const [cellType, setCellType] = useState<CellType>('animal');
    const [speed, setSpeed] = useState(1);
    const [elapsed, setElapsed] = useState(0);
    const [labels, setLabels] = useState(true);
    const [cycleCount, setCycleCount] = useState(0);
    const [growthSignal, setGrowthSignal] = useState(true);
    const [nutrients, setNutrients] = useState(true);
    const [dnaIntact, setDnaIntact] = useState(true);
    const [spindleAttached, setSpindleAttached] = useState(true);
    const [forceG0, setForceG0] = useState(false);
    const [practiceOpen, setPracticeOpen] = useState(false);
    const [practiceChoice, setPracticeChoice] = useState<string | null>(null);

    const biologicalCycleDuration = organism === 'human' ? 24 : 1.5;
    const readablePlaybackFactor = organism === 'human' ? 1 : 2.35;

    useEffect(() => {
        const tick = (t: number) => {
            const last = lastRef.current || t;
            let dt = (t - last) / 1000;
            if (dt > 0.1) dt = 0.1;
            lastRef.current = t;
            if (playing) {
                setElapsed((prev) => {
                    if (forceG0 && !growthSignal) return prev;
                    const next = prev + dt * speed * readablePlaybackFactor * 0.18;
                    const nextCycle = Math.floor(next / VISUAL_CYCLE_HOURS);
                    if (nextCycle > cycleRef.current) {
                        const completed = nextCycle - cycleRef.current;
                        cycleRef.current = nextCycle;
                        setCycleCount((count) => count + completed);
                    }
                    return next;
                });
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastRef.current = 0;
        };
    }, [forceG0, growthSignal, playing, readablePlaybackFactor, speed]);

    const cycleState = useMemo(() => {
        if (forceG0 && !growthSignal) {
            return { phase: 'G0' as Phase, phaseProgress: 0, cycleProgress: 0, mSubPhase: null as MSubPhase | null, elapsedInCycle: 0 };
        }
        const elapsedInCycle = ((elapsed % VISUAL_CYCLE_HOURS) + VISUAL_CYCLE_HOURS) % VISUAL_CYCLE_HOURS;
        const fraction = elapsedInCycle / VISUAL_CYCLE_HOURS;
        const humanHours = fraction * 24;
        if (humanHours < 11) return { phase: 'G1' as Phase, phaseProgress: humanHours / 11, cycleProgress: fraction, mSubPhase: null, elapsedInCycle };
        if (humanHours < 19) return { phase: 'S' as Phase, phaseProgress: (humanHours - 11) / 8, cycleProgress: fraction, mSubPhase: null, elapsedInCycle };
        if (humanHours < 23) return { phase: 'G2' as Phase, phaseProgress: (humanHours - 19) / 4, cycleProgress: fraction, mSubPhase: null, elapsedInCycle };
        const mProgress = (humanHours - 23) / 1;
        let acc = 0;
        const sub = M_SUB_PHASES.find((item) => {
            const hit = mProgress >= acc && mProgress < acc + item.fraction;
            acc += item.fraction;
            return hit;
        })?.id ?? 'Telophase';
        return { phase: 'M' as Phase, phaseProgress: mProgress, cycleProgress: fraction, mSubPhase: sub, elapsedInCycle };
    }, [elapsed, forceG0, growthSignal]);

    const phase = cycleState.phase;
    const phaseMeta = PHASES.find((item) => item.id === phase);
    const dnaContent = useMemo(() => {
        if (phase === 'G0' || phase === 'G1') return '2C';
        if (phase === 'S') return `${(2 + 2 * cycleState.phaseProgress).toFixed(1)}C`;
        if (phase === 'M' && cycleState.phaseProgress > 0.86) return '2C each daughter';
        return '4C';
    }, [cycleState.phaseProgress, phase]);
    const chromosomeNumber = phase === 'G1' || phase === 'G0'
        ? '2n unreplicated'
        : phase === 'S'
            ? '2n unchanged'
            : phase === 'M' && cycleState.mSubPhase === 'Anaphase'
                ? '2n chromatids separating'
                : '2n replicated';
    const organelles = phase === 'G1' ? 'G1 duplication in progress' : 'Complete';
    const centrioleStatus = cellType === 'plant'
        ? 'Absent in this plant view'
        : phase === 'G1' || phase === 'G0'
            ? 'Single pair'
            : phase === 'S'
                ? 'Duplicating in cytoplasm'
                : 'Duplicated pairs';
    const gateStatus = useMemo(() => {
        if (mode !== 'regulation') return 'NCERT cycle active';
        if (!growthSignal || !nutrients) return 'G1/S closed';
        if (!dnaIntact) return 'G2/M closed';
        if (!spindleAttached) return 'M checkpoint closed';
        return 'All gates open';
    }, [dnaIntact, growthSignal, mode, nutrients, spindleAttached]);

    const resetLab = useCallback(() => {
        setPlaying(true);
        setMode('cycle');
        setOrganism('human');
        setCellType('animal');
        setSpeed(1);
        setElapsed(0);
        setLabels(true);
        setCycleCount(0);
        setGrowthSignal(true);
        setNutrients(true);
        setDnaIntact(true);
        setSpindleAttached(true);
        setForceG0(false);
        setPracticeOpen(false);
        setPracticeChoice(null);
        cycleRef.current = 0;
    }, []);

    const forceG0Action = useCallback(() => {
        setForceG0(true);
        setGrowthSignal(false);
    }, []);

    const activeNarration = mode === 'regulation'
        ? 'NEET extension: checkpoint gates are shown beyond the NCERT Class 11 textbook. Use the toggles to see why a cycle hand pauses at G1/S, G2/M or the spindle checkpoint.'
        : PHASE_NARRATION[phase];

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+12px)] top-0 bottom-0 z-20 hidden w-[300px] 2xl:block overflow-y-auto overflow-x-hidden pr-1">
            <div className="flex flex-col gap-2.5">
                <AsideCard title="NCERT Fig 10.1" subtitle="Cell cycle clock" icon={<Clock size={15} className="text-indigo-700" />}>
                    <svg viewBox="0 0 250 146" className="h-[146px] w-full">
                        <MiniWheel cx={125} cy={74} r={54} active={phase} />
                    </svg>
                </AsideCard>
                <AsideCard title="Phase Rules" subtitle="NCERT Section 10.1.1" icon={<Layers size={15} className="text-emerald-700" />}>
                    <div className="space-y-1.5 text-xs font-semibold text-slate-700">
                        <RuleDot color="#60a5fa" text="G1: active growth; no DNA replication; most organelle duplication." />
                        <RuleDot color="#34d399" text="S: DNA doubles 2C to 4C; chromosomes remain 2n; centriole duplicates in animals." />
                        <RuleDot color="#f59e0b" text="G2: proteins for mitosis; cytoplasmic growth continues." />
                        <RuleDot color="#ef4444" text="M: karyokinesis plus cytokinesis; equational division." />
                        <RuleDot color="#7c3aed" text="G0: heart cells example; active but not proliferating." />
                    </div>
                </AsideCard>
                <AsideCard title="Durations" subtitle="NCERT Fig 10.1" icon={<Timer size={15} className="text-violet-700" />}>
                    <div className="grid gap-2 text-xs font-bold text-slate-700">
                        <MiniValue label="Human cells" value="about 24 h" />
                        <MiniValue label="M phase" value="about 1 h" />
                        <MiniValue label="Interphase" value="more than 95%" />
                        <MiniValue label="Yeast" value="about 90 min" />
                    </div>
                </AsideCard>
                <AsideCard title="Exceptions" subtitle="NCERT mitosis notes" icon={<AlertTriangle size={15} className="text-amber-700" />}>
                    <div className="space-y-1.5 text-xs font-semibold text-slate-700">
                        <RuleDot color="#0ea5e9" text="Animals: mitosis usually in diploid somatic cells." />
                        <RuleDot color="#f59e0b" text="Male honey bees: haploid cells divide by mitosis." />
                        <RuleDot color="#22c55e" text="Plants: mitosis can occur in haploid and diploid cells." />
                        <RuleDot color="#ef4444" text="Coconut liquid endosperm: syncytium if karyokinesis lacks cytokinesis." />
                    </div>
                </AsideCard>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+12px)] top-0 bottom-0 z-20 hidden w-[300px] 2xl:block overflow-y-auto overflow-x-hidden pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border p-4 shadow-xl" style={{ background: MODE_META[mode].light, borderColor: `${MODE_META[mode].color}40` }}>
                    <div className="mb-1 flex items-center gap-2 text-base font-extrabold" style={{ color: MODE_META[mode].color }}>
                        <Microscope size={16} />
                        {MODE_META[mode].label}
                    </div>
                    <div className="mb-3 text-xs font-semibold" style={{ color: MODE_META[mode].color }}>{MODE_META[mode].section}</div>
                    <p className="text-sm font-semibold leading-snug text-slate-800">{activeNarration}</p>
                    <div className="mt-3 space-y-1.5">
                        <div className="rounded-lg border border-white bg-white/80 px-2.5 py-1.5 text-xs font-bold text-slate-700">Coordinated execution is under genetic control.</div>
                        <div className="rounded-lg border border-white bg-white/80 px-2.5 py-1.5 text-xs font-bold text-slate-700">Mitosis conserves chromosome number across generations.</div>
                        <div className="rounded-lg border border-white bg-white/80 px-2.5 py-1.5 text-xs font-bold text-slate-700">G0 spares non-dividing adult cell populations.</div>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">LIVE</span>
                    </div>
                    <div className="grid gap-2">
                        <ValueRow label="Mode" value={MODE_META[mode].label} tint="#f8fafc" color="#334155" />
                        <ValueRow label="Organism" value={organism === 'human' ? 'Human - 24 h' : 'Yeast - 90 min'} tint="#f8fafc" color="#334155" />
                        <ValueRow label="Current phase" value={phase} tint="#eef2ff" color="#4f46e5" />
                        {phase === 'M' && <ValueRow label="Mitotic sub-phase" value={cycleState.mSubPhase ?? 'Prophase'} tint="#fff1f2" color="#be123c" />}
                        <ValueRow label="DNA content" value={dnaContent} tint="#ecfeff" color="#0891b2" />
                        <ValueRow label="Chromosome number" value={chromosomeNumber} tint="#ecfdf5" color="#059669" />
                        <ValueRow label="Cycle time elapsed" value={formatElapsed(cycleState.elapsedInCycle, biologicalCycleDuration)} tint="#fffbeb" color="#b45309" />
                        <ValueRow label="Organelles duplicated" value={organelles} tint="#f8fafc" color="#334155" />
                        <ValueRow label="Centriole status" value={centrioleStatus} tint="#f8fafc" color="#334155" />
                        <ValueRow label="Cycle # completed" value={`${cycleCount}`} tint="#f5f3ff" color="#7c3aed" />
                        {mode === 'regulation' && <ValueRow label="Gate status" value={gateStatus} tint="#fff1f2" color="#be123c" />}
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cell cycle simulation">
                    <rect width={W} height={H} fill="#ffffff" />
                    <text x="40" y="30" fontSize="18" fontStyle="italic" fontWeight="800" fill="#0f172a">Cell Cycle - NCERT Ch 10 - Section 10.1 - Fig 10.1</text>
                    <text x="40" y="58" fontSize="12" fontWeight="700" fill="#64748b">Current phase: {phase}{cycleState.mSubPhase ? ` - ${cycleState.mSubPhase}` : ''} - cycle duration: {organism === 'human' ? '24 h' : '90 min'}</text>
                    {mode === 'cycle' && <CycleWheelMode phase={phase} progress={cycleState.cycleProgress} phaseProgress={cycleState.phaseProgress} mSubPhase={cycleState.mSubPhase} labels={labels} forceG0={forceG0 && !growthSignal} />}
                    {mode === 'content' && <ContentMode phase={phase} phaseProgress={cycleState.phaseProgress} progress={cycleState.cycleProgress} labels={labels} />}
                    {mode === 'organelle' && <OrganelleMode phase={phase} phaseProgress={cycleState.phaseProgress} mSubPhase={cycleState.mSubPhase} cellType={cellType} labels={labels} time={elapsed} />}
                    {mode === 'duration' && <DurationMode practiceOpen={practiceOpen} practiceChoice={practiceChoice} setPracticeChoice={setPracticeChoice} />}
                    {mode === 'regulation' && <RegulationMode growthSignal={growthSignal} nutrients={nutrients} dnaIntact={dnaIntact} spindleAttached={spindleAttached} phase={phase} progress={cycleState.cycleProgress} />}
                    <g>
                        <rect x="38" y="704" width="238" height="32" rx="16" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="157" y="724" textAnchor="middle" fontSize="11" fontWeight="900" fill="#475569">Ref: {MODE_META[mode].ref}</text>
                    </g>
                </svg>
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => setPlaying((p) => !p)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title={playing ? 'Pause' : 'Play'}
                    >
                        {playing ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                        type="button"
                        onClick={resetLab}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
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

    const showOrganismControls = mode === 'cycle' || mode === 'content';
    const showCellTypeControls = mode === 'organelle';
    const showGateControls = mode === 'regulation';
    const showAnimationControls = mode === 'cycle' || mode === 'content' || mode === 'organelle' || mode === 'regulation';
    const showPracticeControls = mode === 'duration';

    const controlsCombo = (
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain bg-white text-slate-900">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
                <Activity size={16} className="text-indigo-700" />
                Cell Cycle Bench
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <ControlGroup icon={<Layers size={14} className="text-slate-700" />} label="View mode">
                    <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(MODE_META) as ViewMode[]).map((item) => (
                            <SegmentButton key={item} active={mode === item} color={MODE_META[item].color} onClick={() => setMode(item)}>
                                {MODE_META[item].label}
                            </SegmentButton>
                        ))}
                    </div>
                </ControlGroup>
                {showOrganismControls && (
                    <ControlGroup icon={<Clock size={14} className="text-slate-700" />} label="Organism">
                        <div className="grid gap-1.5">
                            <SegmentButton active={organism === 'human'} color="#4f46e5" onClick={() => setOrganism('human')}>Human - 24 h</SegmentButton>
                            <SegmentButton active={organism === 'yeast'} color="#7c3aed" onClick={() => setOrganism('yeast')}>Yeast - 90 min</SegmentButton>
                        </div>
                    </ControlGroup>
                )}
                {showCellTypeControls && (
                    <ControlGroup icon={<Atom size={14} className="text-slate-700" />} label="Cell type">
                        <div className="grid gap-1.5">
                            <SegmentButton active={cellType === 'animal'} color="#d97706" onClick={() => setCellType('animal')}>Animal cell</SegmentButton>
                            <SegmentButton active={cellType === 'plant'} color="#16a34a" onClick={() => setCellType('plant')}>Plant cell</SegmentButton>
                        </div>
                    </ControlGroup>
                )}
                {showGateControls && (
                    <ControlGroup icon={<Wrench size={14} className="text-slate-700" />} label="Gate toggles">
                        <div className="grid grid-cols-2 gap-1.5">
                            <SegmentButton active={growthSignal} color="#059669" onClick={() => setGrowthSignal((v) => !v)}>Signal</SegmentButton>
                            <SegmentButton active={nutrients} color="#059669" onClick={() => setNutrients((v) => !v)}>Nutrients</SegmentButton>
                            <SegmentButton active={dnaIntact} color="#059669" onClick={() => setDnaIntact((v) => !v)}>DNA intact</SegmentButton>
                            <SegmentButton active={spindleAttached} color="#059669" onClick={() => setSpindleAttached((v) => !v)}>Spindle</SegmentButton>
                            <ActionButton icon={<AlertTriangle size={13} />} onClick={forceG0Action}>Force G0</ActionButton>
                        </div>
                    </ControlGroup>
                )}
                {showAnimationControls && (
                    <ControlGroup icon={<Timer size={14} className="text-slate-700" />} label="Animation">
                        <SliderControl label="Speed" value={speed.toFixed(2)} min="0.25" max="2" step="0.05" onChange={(value) => setSpeed(Number(value))} />
                        <div className="mt-2 grid gap-1.5">
                            <SegmentButton active={labels} color="#475569" onClick={() => setLabels((v) => !v)}>Labels</SegmentButton>
                        </div>
                    </ControlGroup>
                )}
                {showPracticeControls && (
                    <ControlGroup icon={<Dna size={14} className="text-slate-700" />} label="Practice">
                        <div className="grid gap-1.5">
                            <ActionButton icon={<FlaskConical size={13} />} onClick={() => setPracticeOpen((v) => !v)}>
                                Onion root tip
                            </ActionButton>
                        </div>
                    </ControlGroup>
                )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">
                Ref: Ch 10 - Section 10.1.1 - Fig 10.1
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
            controlsAreaFlex="0 0 clamp(240px, 31%, 300px)"
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1320px)] overflow-y-auto overscroll-contain bg-white border border-slate-200 shadow-2xl rounded-2xl p-4"
            contentToggleClassName="bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
        />
    );
};

const CycleWheelMode: React.FC<{ phase: Phase; progress: number; phaseProgress: number; mSubPhase: MSubPhase | null; labels: boolean; forceG0: boolean }> = ({ phase, progress, phaseProgress, mSubPhase, labels, forceG0 }) => {
    const handAngle = -90 + progress * 360;
    return (
        <g>
            <StageFrame stroke="#c7d2fe" />
            <text x="640" y="116" textAnchor="middle" fontSize="24" fontWeight="900" fill="#3730a3">NCERT Fig 10.1: Cell cycle as a 24-hour clock</text>
            <g>
                <PhaseArcs cx={CENTER_X} cy={CENTER_Y} r={240} width={82} />
                <MSubDonut cx={776} cy={190} r={62} />
                <line
                    x1={CENTER_X}
                    y1={CENTER_Y}
                    x2={CENTER_X + Math.cos(handAngle * Math.PI / 180) * 222}
                    y2={CENTER_Y + Math.sin(handAngle * Math.PI / 180) * 222}
                    stroke="#0f172a"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <circle cx={CENTER_X} cy={CENTER_Y} r="16" fill="#0f172a" />
                <circle cx="420" cy="240" r="62" fill="#f5f3ff" stroke={forceG0 || phase === 'G0' ? '#7c3aed' : '#c4b5fd'} strokeWidth="4" />
                <path d="M476 270 C520 300 552 302 588 292" fill="none" stroke="#c4b5fd" strokeWidth="4" strokeDasharray="8 8" />
                <text x="420" y="235" textAnchor="middle" fontSize="18" fontWeight="900" fill="#6d28d9">G0</text>
                <text x="420" y="258" textAnchor="middle" fontSize="11" fontWeight="800" fill="#6d28d9">heart cells</text>
            </g>
            <MiniCell x={905} y={470} phase={phase} progress={phaseProgress} mSubPhase={mSubPhase} cellType="animal" labels={labels} time={progress * 24} />
            <rect x="76" y="552" width="300" height="84" rx="22" fill="#ffffff" stroke={phase === 'G0' ? '#c4b5fd' : (PHASES.find((p) => p.id === phase)?.color ?? '#4f46e5')} strokeWidth="2" />
            <text x="226" y="582" textAnchor="middle" fontSize="17" fontWeight="900" fill="#0f172a">{phase === 'G0' ? 'G0 quiescent' : `Active phase: ${phase}`}</text>
            <text x="226" y="610" textAnchor="middle" fontSize="12" fontWeight="800" fill="#64748b">{phase === 'M' ? `M sub-stage: ${mSubPhase}` : 'Interphase prepares the cell for division'}</text>
            {labels && <text x="640" y="666" textAnchor="middle" fontSize="13" fontWeight="900" fill="#475569">G1 11 h - S 8 h - G2 4 h - M about 1 h; interphase is more than 95% of the cycle</text>}
        </g>
    );
};

const ContentMode: React.FC<{ phase: Phase; phaseProgress: number; progress: number; labels: boolean }> = ({ phase, phaseProgress, progress, labels }) => {
    const x = 160 + progress * 900;
    const dnaY = phase === 'S' ? 270 - phaseProgress * 96 : phase === 'G1' || phase === 'G0' ? 270 : phase === 'M' && progress > 0.985 ? 270 : 174;
    return (
        <g>
            <StageFrame stroke="#a7f3d0" />
            <text x="640" y="116" textAnchor="middle" fontSize="24" fontWeight="900" fill="#065f46">DNA content changes; chromosome number stays 2n</text>
            <GraphFrame x={120} y={150} w={1040} h={220} title="DNA per cell (C-value)" yTop="4C" yBottom="2C" color="#0891b2" />
            <path d="M160 270 H572 L872 174 H1100 L1100 270" fill="none" stroke="#0891b2" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={x} cy={dnaY} r="10" fill="#0891b2" stroke="#ffffff" strokeWidth="3" />
            <GraphFrame x={120} y={420} w={1040} h={170} title="Chromosome number" yTop="2n" yBottom="2n" color="#059669" />
            <line x1="160" y1="505" x2="1100" y2="505" stroke="#059669" strokeWidth="6" strokeLinecap="round" />
            <circle cx={x} cy="505" r="10" fill="#059669" stroke="#ffffff" strokeWidth="3" />
            <PhaseBand y={612} />
            <ChromosomeIcon x={1040} y={264} phase={phase} progress={phaseProgress} />
            <ChromosomeIcon x={1040} y={500} phase={phase} progress={phaseProgress} small />
            {labels && <text x="640" y="676" textAnchor="middle" fontSize="13" fontWeight="900" fill="#475569">DNA doubles from 2C to 4C during S; chromosome number remains 2n after S phase</text>}
        </g>
    );
};

const OrganelleMode: React.FC<{ phase: Phase; phaseProgress: number; mSubPhase: MSubPhase | null; cellType: CellType; labels: boolean; time: number }> = ({ phase, phaseProgress, mSubPhase, cellType, labels, time }) => (
    <g>
        <StageFrame stroke="#fde68a" />
        <text x="640" y="116" textAnchor="middle" fontSize="24" fontWeight="900" fill="#92400e">Organelle choreography across interphase and M phase</text>
        <MiniCell x={640} y={410} phase={phase} progress={phaseProgress} mSubPhase={mSubPhase} cellType={cellType} labels={labels} time={time} large />
        <Callout x={120} y={190} color="#2563eb" text="G1: most organelle duplication" />
        <Callout x={120} y={252} color="#059669" text={cellType === 'animal' ? 'S: centriole duplicates in cytoplasm' : 'Plant view: no centrioles shown'} />
        <Callout x={940} y={190} color="#d97706" text="G2: proteins made for mitosis" />
        <Callout x={940} y={252} color="#dc2626" text={cellType === 'animal' ? 'Cytokinesis: cleavage furrow' : 'Cytokinesis: cell plate'} />
        {labels && <text x="640" y="666" textAnchor="middle" fontSize="13" fontWeight="900" fill="#92400e">Interphase is active preparation: growth, DNA replication, organelle duplication and protein synthesis</text>}
    </g>
);

const DurationMode: React.FC<{ practiceOpen: boolean; practiceChoice: string | null; setPracticeChoice: (value: string) => void }> = ({ practiceOpen, practiceChoice, setPracticeChoice }) => (
    <g>
        <StageFrame stroke="#ddd6fe" />
        <text x="640" y="116" textAnchor="middle" fontSize="24" fontWeight="900" fill="#5b21b6">Duration varies between organisms and cell types</text>
        <StackedBar x={98} y={190} w={300} h={385} title="Human cell - 24 h" totalLabel="24 h" />
        <StackedBar x={490} y={190} w={300} h={385} title="Yeast - 90 min" totalLabel="90 min" />
        <InterphasePie cx={980} cy={360} r={128} />
        <rect x="150" y="612" width="980" height="42" rx="18" fill="#ffffff" stroke="#ddd6fe" strokeWidth="2" />
        <text x="640" y="638" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5b21b6">Human cells: about 24 h. Yeast: about 90 min. M phase about 1 h. Interphase lasts more than 95%.</text>
        {practiceOpen && (
            <g>
                <rect x="824" y="498" width="318" height="116" rx="22" fill="#ffffff" stroke="#7c3aed" strokeWidth="2" />
                <text x="983" y="528" textAnchor="middle" fontSize="14" fontWeight="900" fill="#5b21b6">Onion root tip: 16 chromosomes</text>
                {['G1: 16', 'After S: 16', 'After S: 32'].map((answer, i) => {
                    const correct = answer !== 'After S: 32';
                    const active = practiceChoice === answer;
                    return (
                        <g key={answer} onClick={() => setPracticeChoice(answer)} className="cursor-pointer">
                            <rect x={852 + i * 94} y="552" width="84" height="34" rx="12" fill={active ? (correct ? '#dcfce7' : '#fee2e2') : '#ffffff'} stroke={active ? (correct ? '#16a34a' : '#dc2626') : '#cbd5e1'} />
                            <text x={894 + i * 94} y="574" textAnchor="middle" fontSize="10" fontWeight="900" fill="#334155">{answer}</text>
                        </g>
                    );
                })}
            </g>
        )}
    </g>
);

const RegulationMode: React.FC<{ growthSignal: boolean; nutrients: boolean; dnaIntact: boolean; spindleAttached: boolean; phase: Phase; progress: number }> = ({ growthSignal, nutrients, dnaIntact, spindleAttached, phase, progress }) => (
    <g>
        <StageFrame stroke="#cbd5e1" />
        <text x="640" y="116" textAnchor="middle" fontSize="24" fontWeight="900" fill="#334155">Regulation gates</text>
        <text x="640" y="142" textAnchor="middle" fontSize="12" fontStyle="italic" fontWeight="900" fill="#b45309">NEET extension - beyond NCERT Class 11 textbook</text>
        <CycleOutline cx={420} cy={408} r={190} progress={progress} />
        <Gate x={420} y={168} label="G1/S" open={growthSignal && nutrients} active={phase === 'G1'} detail={!growthSignal ? 'no signal' : !nutrients ? 'nutrients low' : 'open'} />
        <Gate x={612} y={408} label="G2/M" open={dnaIntact} active={phase === 'G2'} detail={dnaIntact ? 'open' : 'DNA damage'} />
        <Gate x={420} y={646} label="M check" open={spindleAttached} active={phase === 'M'} detail={spindleAttached ? 'attached' : 'spindle fail'} />
        <g transform="translate(790 240)">
            <rect width="300" height="258" rx="28" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <text x="150" y="36" textAnchor="middle" fontSize="18" fontWeight="900" fill="#334155">CDK + cyclin</text>
            <path d="M78 118 C54 90 76 58 110 72 C126 46 168 56 160 94 C192 112 172 154 136 142 C120 166 82 152 78 118Z" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
            <path d="M172 118 C148 90 170 58 204 72 C220 46 262 56 254 94 C286 112 266 154 230 142 C214 166 176 152 172 118Z" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
            {(growthSignal && nutrients && dnaIntact && spindleAttached) && <circle cx="150" cy="116" r="96" fill="none" stroke="#22c55e" strokeWidth="5" opacity="0.35" />}
            <text x="112" y="122" textAnchor="middle" fontSize="16" fontWeight="900" fill="#075985">CDK</text>
            <text x="220" y="122" textAnchor="middle" fontSize="16" fontWeight="900" fill="#92400e">Cyclin</text>
            <path d="M150 180 L150 222" stroke="#64748b" strokeWidth="4" markerEnd="url(#arrow)" />
            <text x="150" y="236" textAnchor="middle" fontSize="12" fontWeight="900" fill="#475569">paired complex opens phase targets</text>
        </g>
    </g>
);

const StageFrame: React.FC<{ stroke: string }> = ({ stroke }) => (
    <rect x="56" y="82" width="1168" height="622" rx="34" fill="#ffffff" stroke={stroke} strokeWidth="2.5" />
);

const PhaseArcs: React.FC<{ cx: number; cy: number; r: number; width: number }> = ({ cx, cy, r, width }) => {
    let start = -90;
    return (
        <g>
            {PHASES.map((phase) => {
                const sweep = phase.hours * 15;
                const path = arcPath(cx, cy, r, start, start + sweep);
                const mid = start + sweep / 2;
                const lx = cx + Math.cos(mid * Math.PI / 180) * (r - width / 2);
                const ly = cy + Math.sin(mid * Math.PI / 180) * (r - width / 2);
                start += sweep;
                return (
                    <g key={phase.id}>
                        <path d={path} fill="none" stroke={phase.color} strokeWidth={width} strokeLinecap="butt" />
                        <text x={lx} y={ly + 6} textAnchor="middle" fontSize="24" fontWeight="900" fill="#0f172a">{phase.label}</text>
                    </g>
                );
            })}
            <circle cx={cx} cy={cy} r={r - width} fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
            <text x={cx} y={cy - 10} textAnchor="middle" fontSize="20" fontWeight="900" fill="#0f172a">Cell cycle</text>
            <text x={cx} y={cy + 20} textAnchor="middle" fontSize="13" fontWeight="800" fill="#64748b">interphase + M phase</text>
        </g>
    );
};

const MSubDonut: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => {
    let start = -90;
    return (
        <g>
            <circle cx={cx} cy={cy} r={r + 16} fill="#ffffff" stroke="#fecdd3" strokeWidth="2" />
            {M_SUB_PHASES.map((item) => {
                const sweep = item.fraction * 360;
                const path = arcPath(cx, cy, r, start, start + sweep);
                start += sweep;
                return <path key={item.id} d={path} fill="none" stroke={item.color} strokeWidth="20" />;
            })}
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" fontWeight="900" fill="#be123c">M stages</text>
        </g>
    );
};

const MiniWheel: React.FC<{ cx: number; cy: number; r: number; active: Phase }> = ({ cx, cy, r, active }) => {
    let start = -90;
    return (
        <g>
            {PHASES.map((phase) => {
                const sweep = phase.hours * 15;
                const path = arcPath(cx, cy, r, start, start + sweep);
                start += sweep;
                return <path key={phase.id} d={path} fill="none" stroke={phase.color} strokeWidth={active === phase.id ? 28 : 22} opacity={active === phase.id ? 1 : 0.55} />;
            })}
            <circle cx={cx} cy={cy} r={r - 30} fill="#ffffff" />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="900" fill="#0f172a">{active}</text>
        </g>
    );
};

const MiniCell: React.FC<{ x: number; y: number; phase: Phase; progress: number; mSubPhase: MSubPhase | null; cellType: CellType; labels: boolean; time: number; large?: boolean }> = ({ x, y, phase, progress, mSubPhase, cellType, labels, time, large }) => {
    const scale = large ? 1.7 : 1;
    const rx = (cellType === 'plant' ? 150 : 135) * scale;
    const ry = 105 * scale;
    const pinch = phase === 'M' && mSubPhase === 'Telophase' ? 32 * scale * progress : 0;
    return (
        <g transform={`translate(${x} ${y})`}>
            {cellType === 'plant' ? (
                <rect x={-rx} y={-ry} width={rx * 2} height={ry * 2} rx={18 * scale} fill="#f0fdf4" stroke="#16a34a" strokeWidth={4 * scale} />
            ) : (
                <path d={`M${-rx} 0 C${-rx} ${-ry} ${rx} ${-ry} ${rx} 0 C${rx} ${ry} ${-rx} ${ry} ${-rx} 0${pinch ? ` M0 ${-ry} C${-pinch} ${-30 * scale} ${-pinch} ${30 * scale} 0 ${ry}` : ''}`} fill="#ecfdf5" stroke="#16a34a" strokeWidth={4 * scale} />
            )}
            {phase !== 'M' && <circle cx="0" cy="0" r={52 * scale} fill="#dbeafe" stroke="#2563eb" strokeWidth={3 * scale} opacity="0.9" />}
            {phase === 'G1' && <Organelles scale={scale} time={time} count={large ? 22 : 10} />}
            {phase === 'S' && <ReplicationFork scale={scale} progress={progress} />}
            {phase === 'G2' && <ProteinDots scale={scale} time={time} />}
            {phase === 'M' && <MitosisFigure scale={scale} sub={mSubPhase ?? 'Prophase'} progress={progress} cellType={cellType} />}
            {cellType === 'animal' && <Centrioles scale={scale} phase={phase} progress={progress} />}
            {cellType === 'plant' && phase === 'M' && mSubPhase === 'Telophase' && <line x1="0" y1={-ry + 16 * scale} x2="0" y2={ry - 16 * scale} stroke="#16a34a" strokeWidth={5 * scale} strokeDasharray="10 8" />}
            {labels && <text x="0" y={ry + 34 * scale} textAnchor="middle" fontSize={large ? 13 : 12} fontWeight="900" fill="#166534">{cellType === 'animal' ? 'animal cell' : 'plant cell'} - {phase}</text>}
        </g>
    );
};

const Organelles: React.FC<{ scale: number; time: number; count: number }> = ({ scale, time, count }) => (
    <g>
        {Array.from({ length: count }, (_, i) => {
            const angle = i * 2.399 + time * 0.15;
            const radius = (38 + (i % 5) * 18) * scale;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.72;
            const color = i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#0ea5e9' : '#a855f7';
            return <ellipse key={i} cx={x} cy={y} rx={7 * scale} ry={4 * scale} fill={color} opacity="0.75" />;
        })}
    </g>
);

const ReplicationFork: React.FC<{ scale: number; progress: number }> = ({ scale, progress }) => (
    <g>
        <path d={`M${-38 * scale} ${-12 * scale} C${-12 * scale} ${-42 * scale} ${18 * scale} ${-42 * scale} ${44 * scale} ${-12 * scale}`} fill="none" stroke="#4f46e5" strokeWidth={5 * scale} />
        <path d={`M${-38 * scale} ${18 * scale} C${-12 * scale} ${48 * scale} ${18 * scale} ${48 * scale} ${44 * scale} ${18 * scale}`} fill="none" stroke="#4f46e5" strokeWidth={5 * scale} />
        <circle cx={(progress * 84 - 42) * scale} cy="0" r={10 * scale} fill="#34d399" opacity="0.85" />
    </g>
);

const ProteinDots: React.FC<{ scale: number; time: number }> = ({ scale, time }) => (
    <g>
        {Array.from({ length: 14 }, (_, i) => {
            const x = (-80 + ((time * 38 + i * 23) % 160)) * scale;
            const y = (-54 + (i % 7) * 18) * scale;
            return <circle key={i} cx={x} cy={y} r={4 * scale} fill="#2563eb" opacity="0.7" />;
        })}
    </g>
);

const Centrioles: React.FC<{ scale: number; phase: Phase; progress: number }> = ({ scale, phase, progress }) => {
    const split = phase === 'S' ? progress : (phase === 'G2' || phase === 'M') ? 1 : 0;
    return (
        <g>
            <Centriole x={(-80 - split * 28) * scale} y={-66 * scale} scale={scale} />
            <Centriole x={(80 + split * 28) * scale} y={66 * scale} scale={scale} />
            {split > 0.2 && (
                <>
                    <Centriole x={(-50 - split * 44) * scale} y={-40 * scale} scale={scale} />
                    <Centriole x={(50 + split * 44) * scale} y={40 * scale} scale={scale} />
                </>
            )}
        </g>
    );
};

const Centriole: React.FC<{ x: number; y: number; scale: number }> = ({ x, y, scale }) => (
    <g transform={`translate(${x} ${y}) rotate(-25)`}>
        <rect x={-13 * scale} y={-4 * scale} width={26 * scale} height={8 * scale} rx={4 * scale} fill="#f97316" stroke="#c2410c" strokeWidth={1.5 * scale} />
        <rect x={-4 * scale} y={-13 * scale} width={8 * scale} height={26 * scale} rx={4 * scale} fill="#fed7aa" stroke="#c2410c" strokeWidth={1.5 * scale} />
    </g>
);

const MitosisFigure: React.FC<{ scale: number; sub: MSubPhase; progress: number; cellType: CellType }> = ({ scale, sub, progress, cellType }) => {
    if (sub === 'Prophase') {
        return (
            <g>
                <circle cx="0" cy="0" r={54 * scale} fill="#dbeafe" stroke="#2563eb" strokeWidth={2 * scale} strokeDasharray="9 7" opacity="0.65" />
                {[-36, -16, 8, 32].map((x, i) => <XChromosome key={i} x={x * scale} y={(-12 + i * 12) * scale} scale={scale} />)}
            </g>
        );
    }
    if (sub === 'Metaphase') {
        return (
            <g>
                <line x1={-95 * scale} y1={-65 * scale} x2={95 * scale} y2={65 * scale} stroke="#94a3b8" strokeWidth={2 * scale} />
                <line x1={-95 * scale} y1={65 * scale} x2={95 * scale} y2={-65 * scale} stroke="#94a3b8" strokeWidth={2 * scale} />
                {[-36, -12, 12, 36].map((x, i) => <XChromosome key={i} x={x * scale} y={0} scale={scale} />)}
                <line x1="0" y1={-72 * scale} x2="0" y2={72 * scale} stroke="#ef4444" strokeWidth={2 * scale} strokeDasharray="7 6" />
            </g>
        );
    }
    if (sub === 'Anaphase') {
        return (
            <g>
                {[-42, -18, 18, 42].map((x, i) => (
                    <g key={i}>
                        <VChromatid x={(x - 38 * progress) * scale} y={-34 * scale} scale={scale} flip />
                        <VChromatid x={(x + 38 * progress) * scale} y={34 * scale} scale={scale} />
                    </g>
                ))}
            </g>
        );
    }
    return (
        <g>
            <circle cx={-46 * scale} cy="0" r={38 * scale} fill="#dbeafe" stroke="#2563eb" strokeWidth={2.5 * scale} />
            <circle cx={46 * scale} cy="0" r={38 * scale} fill="#dbeafe" stroke="#2563eb" strokeWidth={2.5 * scale} />
            {cellType === 'animal' ? <path d={`M0 ${-92 * scale} C${-20 * scale} ${-30 * scale} ${-20 * scale} ${30 * scale} 0 ${92 * scale}`} fill="none" stroke="#16a34a" strokeWidth={5 * scale} /> : null}
        </g>
    );
};

const XChromosome: React.FC<{ x: number; y: number; scale: number }> = ({ x, y, scale }) => (
    <g transform={`translate(${x} ${y})`}>
        <line x1={-11 * scale} y1={-18 * scale} x2={11 * scale} y2={18 * scale} stroke="#4f46e5" strokeWidth={7 * scale} strokeLinecap="round" />
        <line x1={11 * scale} y1={-18 * scale} x2={-11 * scale} y2={18 * scale} stroke="#4f46e5" strokeWidth={7 * scale} strokeLinecap="round" />
        <circle r={4 * scale} fill="#312e81" />
    </g>
);

const VChromatid: React.FC<{ x: number; y: number; scale: number; flip?: boolean }> = ({ x, y, scale, flip }) => (
    <path d={`M${x - 12 * scale} ${y + (flip ? 14 : -14) * scale} L${x} ${y} L${x + 12 * scale} ${y + (flip ? 14 : -14) * scale}`} fill="none" stroke="#4f46e5" strokeWidth={6 * scale} strokeLinecap="round" />
);

const GraphFrame: React.FC<{ x: number; y: number; w: number; h: number; title: string; yTop: string; yBottom: string; color: string }> = ({ x, y, w, h, title, yTop, yBottom, color }) => (
    <g>
        <rect x={x} y={y} width={w} height={h} rx="20" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        <text x={x + 24} y={y + 32} fontSize="15" fontWeight="900" fill={color}>{title}</text>
        <line x1={x + 40} y1={y + h - 44} x2={x + w - 42} y2={y + h - 44} stroke="#94a3b8" strokeWidth="2" />
        <line x1={x + 40} y1={y + 50} x2={x + 40} y2={y + h - 44} stroke="#94a3b8" strokeWidth="2" />
        <text x={x + 18} y={y + 58} fontSize="11" fontWeight="900" fill="#64748b">{yTop}</text>
        <text x={x + 18} y={y + h - 40} fontSize="11" fontWeight="900" fill="#64748b">{yBottom}</text>
    </g>
);

const PhaseBand: React.FC<{ y: number }> = ({ y }) => {
    let x = 160;
    return (
        <g>
            {PHASES.map((phase) => {
                const w = phase.hours * 37.5;
                const node = (
                    <g key={phase.id}>
                        <rect x={x} y={y} width={w} height="24" fill={phase.light} stroke={phase.color} />
                        <text x={x + w / 2} y={y + 17} textAnchor="middle" fontSize="11" fontWeight="900" fill="#334155">{phase.label}</text>
                    </g>
                );
                x += w;
                return node;
            })}
        </g>
    );
};

const ChromosomeIcon: React.FC<{ x: number; y: number; phase: Phase; progress: number; small?: boolean }> = ({ x, y, phase, progress, small }) => {
    const scale = small ? 0.7 : 1;
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-62 * scale} y={-58 * scale} width={124 * scale} height={116 * scale} rx={18 * scale} fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            {phase === 'G1' || phase === 'G0' ? (
                <line x1={-20 * scale} y1={-34 * scale} x2={20 * scale} y2={34 * scale} stroke="#4f46e5" strokeWidth={8 * scale} strokeLinecap="round" />
            ) : phase === 'S' ? (
                <>
                    <line x1={-18 * scale} y1={-34 * scale} x2={18 * scale} y2={34 * scale} stroke="#4f46e5" strokeWidth={8 * scale} strokeLinecap="round" />
                    <line x1={(2 + progress * 20) * scale} y1={-30 * scale} x2={(24 + progress * 8) * scale} y2={30 * scale} stroke="#34d399" strokeWidth={7 * scale} strokeLinecap="round" />
                </>
            ) : (
                <XChromosome x={0} y={0} scale={scale} />
            )}
            <text x="0" y={46 * scale} textAnchor="middle" fontSize={11 * scale} fontWeight="900" fill="#475569">{phase === 'S' ? 'replicating' : phase}</text>
        </g>
    );
};

const StackedBar: React.FC<{ x: number; y: number; w: number; h: number; title: string; totalLabel: string }> = ({ x, y, w, h, title, totalLabel }) => {
    let currentY = y + h;
    return (
        <g>
            <rect x={x} y={y} width={w} height={h} rx="22" fill="#ffffff" stroke="#ddd6fe" strokeWidth="2" />
            <text x={x + w / 2} y={y + 34} textAnchor="middle" fontSize="16" fontWeight="900" fill="#5b21b6">{title}</text>
            {PHASES.slice().reverse().map((phase) => {
                const bh = (phase.hours / 24) * (h - 78);
                currentY -= bh;
                return (
                    <g key={phase.id}>
                        <rect x={x + 66} y={currentY} width={w - 132} height={bh} fill={phase.color} opacity="0.78" />
                        <text x={x + w / 2} y={currentY + bh / 2 + 5} textAnchor="middle" fontSize="12" fontWeight="900" fill="#0f172a">{phase.id}</text>
                    </g>
                );
            })}
            <text x={x + w / 2} y={y + h - 18} textAnchor="middle" fontSize="13" fontWeight="900" fill="#64748b">{totalLabel}</text>
        </g>
    );
};

const InterphasePie: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
    <g>
        <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke="#ddd6fe" strokeWidth="2" />
        <path d={sectorPath(cx, cy, r - 14, -90, 252)} fill="#99f6e4" />
        <path d={sectorPath(cx, cy, r - 14, 252, 270)} fill="#f87171" />
        <circle cx={cx} cy={cy} r={62} fill="#ffffff" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="19" fontWeight="900" fill="#0f766e">Interphase</text>
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize="15" fontWeight="900" fill="#475569">more than 95%</text>
    </g>
);

const CycleOutline: React.FC<{ cx: number; cy: number; r: number; progress: number }> = ({ cx, cy, r, progress }) => {
    const angle = -90 + progress * 360;
    return (
        <g>
            <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke="#cbd5e1" strokeWidth="16" />
            <circle cx={cx + Math.cos(angle * Math.PI / 180) * r} cy={cy + Math.sin(angle * Math.PI / 180) * r} r="14" fill="#0f172a" />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="18" fontWeight="900" fill="#334155">Cycle outline</text>
        </g>
    );
};

const Gate: React.FC<{ x: number; y: number; label: string; open: boolean; active: boolean; detail: string }> = ({ x, y, label, open, active, detail }) => (
    <g transform={`translate(${x} ${y})`}>
        <rect x="-66" y="-34" width="132" height="68" rx="18" fill={open ? '#dcfce7' : '#fee2e2'} stroke={active ? '#0f172a' : open ? '#16a34a' : '#dc2626'} strokeWidth={active ? 4 : 2.5} />
        <text y="-4" textAnchor="middle" fontSize="15" fontWeight="900" fill={open ? '#166534' : '#991b1b'}>{label}</text>
        <text y="18" textAnchor="middle" fontSize="11" fontWeight="900" fill="#475569">{detail}</text>
    </g>
);

const Callout: React.FC<{ x: number; y: number; color: string; text: string }> = ({ x, y, color, text }) => (
    <g>
        <rect x={x} y={y} width="248" height="36" rx="15" fill="#ffffff" stroke={color} strokeWidth="2" />
        <text x={x + 124} y={y + 23} textAnchor="middle" fontSize="12" fontWeight="900" fill={color}>{text}</text>
    </g>
);

const AsideCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, icon, children }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
        <div className="mb-2 flex items-center gap-2">
            {icon}
            <div>
                <div className="text-base font-extrabold text-slate-900">{title}</div>
                <div className="text-xs font-semibold text-slate-500">{subtitle}</div>
            </div>
        </div>
        {children}
    </div>
);

const RuleDot: React.FC<{ color: string; text: string }> = ({ color, text }) => (
    <div className="flex gap-2 rounded-lg border border-slate-100 bg-white px-2 py-1.5">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <span>{text}</span>
    </div>
);

const MiniValue: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2 py-1.5">
        <span>{label}</span>
        <span className="font-black text-indigo-700">{value}</span>
    </div>
);

const ValueRow: React.FC<{ label: string; value: string; tint: string; color: string }> = ({ label, value, tint, color }) => (
    <div className="rounded-lg border border-slate-100 px-3 py-2.5" style={{ background: tint }}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 break-words font-mono text-sm font-extrabold" style={{ color }}>{value}</div>
    </div>
);

const ControlGroup: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-600">
            {icon}
            {label}
        </div>
        {children}
    </div>
);

const SegmentButton: React.FC<{ active: boolean; color: string; onClick: () => void; children: React.ReactNode }> = ({ active, color, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="min-h-[34px] rounded-lg border px-2 py-1.5 text-[11px] font-black leading-tight transition-colors"
        style={{ background: active ? color : '#ffffff', borderColor: active ? color : '#e2e8f0', color: active ? '#ffffff' : '#334155' }}
    >
        {children}
    </button>
);

const ActionButton: React.FC<{ icon: React.ReactNode; onClick: () => void; children: React.ReactNode }> = ({ icon, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-black leading-tight text-slate-700 transition-colors hover:bg-slate-50"
    >
        {icon}
        {children}
    </button>
);

const SliderControl: React.FC<{ label: string; value: string; min: string; max: string; step: string; onChange: (value: string) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-600">{label}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-black text-slate-700">{value}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="w-full accent-indigo-700" />
    </div>
);

const formatElapsed = (visualHours: number, biologicalCycleDuration: number) => {
    const fraction = visualHours / VISUAL_CYCLE_HOURS;
    const biologicalElapsed = fraction * biologicalCycleDuration;
    if (biologicalCycleDuration === 24) return `${biologicalElapsed.toFixed(1)} h`;
    return `${Math.round(biologicalElapsed * 60)} min`;
};

const arcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polar(cx, cy, r, endAngle);
    const end = polar(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
};

const sectorPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polar(cx, cy, r, startAngle);
    const end = polar(cx, cy, r, endAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
};

const polar = (cx: number, cy: number, r: number, angle: number) => {
    const rad = angle * Math.PI / 180;
    return { x: cx + Math.cos(rad) * r, y: cy + Math.sin(rad) * r };
};

export default CellCycleLab;
