import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Droplets,
    Flame,
    Gauge,
    Info,
    Pause,
    Play,
    RotateCcw,
    Sparkles,
    Wind,
    Zap,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface RespirationInPlantsLabProps {
    topic: any;
    onExit: () => void;
}

type OxygenMode = 'ON' | 'OFF';
type FermentationMode = 'Yeast' | 'Muscle';
type Speed = 0.5 | 1 | 2;
type Stage = 1 | 2 | 3 | 4 | 5;
type ParticleKind = 'ATP' | 'NADH' | 'FADH2' | 'CO2' | 'H+' | 'e-' | 'O2' | 'H2O' | 'Pyruvate' | 'Acetyl';
type PathKind = 'glycolysis' | 'ferment' | 'link' | 'tca' | 'etsElectron' | 'protonPump' | 'protonReturn' | 'water';

interface Dot {
    x: number;
    y: number;
}

interface Particle {
    id: number;
    kind: ParticleKind;
    path: PathKind;
    progress: number;
    life: number;
    offset: number;
    trail: Dot[];
}

interface Flash {
    x: number;
    y: number;
    color: string;
    age: number;
    life: number;
    maxRadius: number;
}

interface World {
    time: number;
    clock: number;
    glyStep: number;
    tcaAngle: number;
    etsRotor: number;
    particles: Particle[];
    flashes: Flash[];
    smoothAtp: number;
    smoothNadh: number;
    smoothFadh2: number;
    smoothCo2: number;
    pulseStep: number;
    pulseTca: number;
    pulseEts: number;
}

interface Snapshot {
    atp: number;
    nadh: number;
    fadh2: number;
    co2: number;
    targetAtp: number;
    targetNadh: number;
    targetFadh2: number;
    targetCo2: number;
    activeStep: number;
    observation: string;
}

interface Targets {
    atp: number;
    nadh: number;
    fadh2: number;
    co2: number;
    label: string;
}

const W = 1280;
const H = 760;
const DEFAULT_SNAPSHOT: Snapshot = {
    atp: 0,
    nadh: 0,
    fadh2: 0,
    co2: 0,
    targetAtp: 0,
    targetNadh: 0,
    targetFadh2: 0,
    targetCo2: 0,
    activeStep: 0,
    observation: 'Glycolysis begins in the cytoplasm and splits glucose into pyruvic acid.',
};

const GLYCOLYSIS = [
    { name: 'Glucose', c: '6C', enzyme: 'hexokinase', event: '-ATP' },
    { name: 'G-6-P', c: '6C', enzyme: 'phosphoglucoisomerase', event: '' },
    { name: 'F-6-P', c: '6C', enzyme: 'PFK', event: '-ATP' },
    { name: 'F-1,6-BP', c: '6C', enzyme: 'aldolase', event: 'split' },
    { name: 'DHAP + PGAL', c: '3C + 3C', enzyme: 'isomerase', event: '2 x PGAL' },
    { name: 'BPGA', c: '3C', enzyme: 'GAPDH', event: '+NADH' },
    { name: '3-PGA', c: '3C', enzyme: 'PGK', event: '+ATP' },
    { name: '2-PG', c: '3C', enzyme: 'mutase', event: '' },
    { name: 'PEP', c: '3C', enzyme: 'enolase', event: '-H2O' },
    { name: 'Pyruvate', c: '3C', enzyme: 'pyruvate kinase', event: '+ATP' },
];

const TCA = [
    { name: 'Citrate', c: '6C', event: 'CoA out' },
    { name: 'Isocitrate', c: '6C', event: 'aconitase' },
    { name: 'alpha-KG', c: '5C', event: '+CO2 +NADH' },
    { name: 'Succinyl-CoA', c: '4C', event: '+CO2 +NADH' },
    { name: 'Succinate', c: '4C', event: '+GTP/ATP' },
    { name: 'Fumarate', c: '4C', event: '+FADH2' },
    { name: 'Malate', c: '4C', event: '+H2O' },
    { name: 'OAA', c: '4C', event: '+NADH' },
];

const PARTICLE_STYLE: Record<ParticleKind, { fill: string; stroke: string; label: string }> = {
    ATP: { fill: '#16a34a', stroke: '#166534', label: 'ATP' },
    NADH: { fill: '#2563eb', stroke: '#1e40af', label: 'NADH' },
    FADH2: { fill: '#7c3aed', stroke: '#5b21b6', label: 'FADH2' },
    CO2: { fill: '#94a3b8', stroke: '#475569', label: 'CO2' },
    'H+': { fill: '#ec4899', stroke: '#be185d', label: 'H+' },
    'e-': { fill: '#facc15', stroke: '#ca8a04', label: 'e-' },
    O2: { fill: '#ef4444', stroke: '#b91c1c', label: 'O2' },
    H2O: { fill: '#06b6d4', stroke: '#0e7490', label: 'H2O' },
    Pyruvate: { fill: '#fb923c', stroke: '#c2410c', label: 'Pyr' },
    Acetyl: { fill: '#f59e0b', stroke: '#b45309', label: 'AcCoA' },
};

const STAGE_LABELS: Record<Stage, string> = {
    1: 'Glycolysis',
    2: 'Link / Fermentation',
    3: 'TCA cycle',
    4: 'ETS',
    5: 'Balance',
};

const RespirationInPlantsLab: React.FC<RespirationInPlantsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef(0);
    const idRef = useRef(1);
    const snapshotClockRef = useRef(0);
    const worldRef = useRef<World>(createWorld());

    const [oxygen, setOxygen] = useState<OxygenMode>('ON');
    const [fermentationMode, setFermentationMode] = useState<FermentationMode>('Yeast');
    const [stage, setStage] = useState<Stage>(1);
    const [speed, setSpeed] = useState<Speed>(1);
    const [playing, setPlaying] = useState(true);
    const [showIntermediates, setShowIntermediates] = useState(true);
    const [showEnzymes, setShowEnzymes] = useState(true);
    const [showBalance, setShowBalance] = useState(true);
    const [resetKey, setResetKey] = useState(0);
    const [snapshot, setSnapshot] = useState<Snapshot>(DEFAULT_SNAPSHOT);

    const targets = useMemo(() => computeTargets(stage, oxygen, fermentationMode, showBalance), [fermentationMode, oxygen, showBalance, stage]);
    const observation = useMemo(() => observationFor(stage, oxygen, fermentationMode), [fermentationMode, oxygen, stage]);

    const resetLab = useCallback(() => {
        worldRef.current = createWorld();
        idRef.current = 1;
        snapshotClockRef.current = 0;
        setOxygen('ON');
        setFermentationMode('Yeast');
        setStage(1);
        setSpeed(1);
        setPlaying(true);
        setShowIntermediates(true);
        setShowEnzymes(true);
        setShowBalance(true);
        setSnapshot(DEFAULT_SNAPSHOT);
        setResetKey((key) => key + 1);
    }, []);

    const stepForward = useCallback(() => {
        setStage((value) => (value < 5 ? (value + 1) as Stage : 1));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const tick = (now: number) => {
            const last = lastRef.current || now;
            let dt = (now - last) / 1000;
            if (dt > 0.1) dt = 0.1;
            lastRef.current = now;

            if (playing) {
                advanceWorld(worldRef.current, {
                    dt: dt * speed,
                    stage,
                    oxygen,
                    fermentationMode,
                    targets,
                    nextId: () => idRef.current++,
                });
            }

            drawWorld(ctx, worldRef.current, {
                stage,
                oxygen,
                fermentationMode,
                showIntermediates,
                showEnzymes,
                showBalance,
                targets,
            });

            snapshotClockRef.current += dt;
            if (snapshotClockRef.current > 0.14) {
                snapshotClockRef.current = 0;
                const world = worldRef.current;
                setSnapshot({
                    atp: Math.round(world.smoothAtp),
                    nadh: Math.round(world.smoothNadh),
                    fadh2: Math.round(world.smoothFadh2),
                    co2: Math.round(world.smoothCo2),
                    targetAtp: targets.atp,
                    targetNadh: targets.nadh,
                    targetFadh2: targets.fadh2,
                    targetCo2: targets.co2,
                    activeStep: world.glyStep,
                    observation,
                });
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastRef.current = 0;
        };
    }, [fermentationMode, observation, oxygen, playing, resetKey, showBalance, showEnzymes, showIntermediates, speed, stage, targets]);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 min-[1800px]:block">
            <div className="flex flex-col gap-2.5">
                <BalanceCard snapshot={snapshot} />
                <GlycolysisCard activeStep={snapshot.activeStep} />
                <FermentationCard fermentationMode={fermentationMode} />
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[318px] overflow-y-auto pl-1 min-[1800px]:block">
            <div className="flex flex-col gap-3 pr-16">
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="mb-1 flex items-center gap-2 text-base font-extrabold text-cyan-950">
                        <Info size={16} />
                        NCERT Ch 12.1-12.5
                    </div>
                    <div className="mb-3 text-xs font-semibold text-cyan-700">Respiration in Plants</div>
                    <div className="rounded-lg border border-cyan-100 bg-white/90 px-3 py-2 text-sm font-bold leading-snug text-cyan-950">
                        C6H12O6 + 6 O2 -&gt; 6 CO2 + 6 H2O + 38 ATP
                    </div>
                    <div className="mt-2 rounded-lg border border-cyan-100 bg-white/90 px-3 py-2 text-sm font-bold leading-snug text-cyan-950">
                        The 38 ATP value is theoretical under NCERT assumptions.
                    </div>
                    <div className="mt-3 space-y-2 text-xs font-semibold leading-snug text-cyan-900">
                        <MiniFact color="#2563eb" text="Glycolysis is the EMP pathway and occurs in the cytoplasm." />
                        <MiniFact color="#16a34a" text="Krebs/TCA cycle operates in the mitochondrial matrix." />
                        <MiniFact color="#ec4899" text="ETS and oxidative phosphorylation occur on the inner mitochondrial membrane." />
                        <MiniFact color="#ef4444" text="O2 is the final hydrogen acceptor and is reduced to water." />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                            <Gauge size={16} className="text-emerald-700" />
                            Real-time values
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</span>
                    </div>
                    <div className="space-y-2">
                        <ValueRow label="ATP" value={`${snapshot.atp} / ${snapshot.targetAtp}`} tint="#ecfdf5" color="#16a34a" />
                        <ValueRow label="NADH" value={`${snapshot.nadh} / ${snapshot.targetNadh}`} tint="#eff6ff" color="#2563eb" />
                        <ValueRow label="FADH2" value={`${snapshot.fadh2} / ${snapshot.targetFadh2}`} tint="#f5f3ff" color="#7c3aed" />
                        <ValueRow label="CO2 released" value={`${snapshot.co2} / ${snapshot.targetCo2}`} tint="#f8fafc" color="#64748b" />
                        <ValueRow label="Current stage" value={STAGE_LABELS[stage]} tint="#fff7ed" color="#c2410c" />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
                        <Activity size={16} className="text-cyan-700" />
                        Live observation
                    </div>
                    <div className="text-sm font-semibold leading-snug text-slate-700">{snapshot.observation}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
                        <Sparkles size={16} className="text-violet-700" />
                        Amphibolic + RQ
                    </div>
                    <div className="space-y-2 text-xs font-semibold leading-snug text-slate-700">
                        <MiniFact color="#0891b2" text="Respiration is amphibolic: both catabolic and anabolic." />
                        <MiniFact color="#d97706" text="RQ = volume CO2 evolved / volume O2 consumed." />
                        <MiniFact color="#16a34a" text="Carbohydrate RQ is about 1; fats have RQ less than 1." />
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="absolute inset-0 h-full w-full"
                    aria-label="Canvas animation of glycolysis, fermentation, TCA cycle, and electron transport system"
                />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setPlaying((value) => !value)}
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

    const controlsCombo = (
        <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-hidden bg-white text-slate-900">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
                <Flame size={16} className="text-orange-700" />
                Respiration Bench
            </div>
            <div className="grid flex-1 min-h-0 gap-2.5 md:grid-cols-2 xl:grid-cols-[1.55fr_.75fr_1.1fr_.95fr_1.2fr_.8fr]">
                <ControlGroup icon={<Activity size={14} className="text-cyan-700" />} label="Stage">
                    <div className="grid grid-cols-5 gap-1.5">
                        {([1, 2, 3, 4, 5] as Stage[]).map((item) => (
                            <SegmentButton key={item} active={stage === item} color="#0891b2" onClick={() => setStage(item)}>
                                {item}
                            </SegmentButton>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={stepForward}
                        className="mt-1.5 min-h-[28px] w-full rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1 text-[11px] font-black text-cyan-800 transition-colors hover:bg-cyan-100"
                    >
                        Step stage
                    </button>
                </ControlGroup>
                <ControlGroup icon={<Wind size={14} className="text-red-700" />} label="O2">
                    <div className="grid grid-cols-2 gap-1.5">
                        <SegmentButton active={oxygen === 'ON'} color="#16a34a" onClick={() => setOxygen('ON')}>ON</SegmentButton>
                        <SegmentButton active={oxygen === 'OFF'} color="#ef4444" onClick={() => setOxygen('OFF')}>OFF</SegmentButton>
                    </div>
                </ControlGroup>
                {oxygen === 'OFF' && (
                    <ControlGroup icon={<Droplets size={14} className="text-purple-700" />} label="Fermentation">
                        <div className="grid grid-cols-2 gap-1.5">
                            <SegmentButton active={fermentationMode === 'Yeast'} color="#7c3aed" onClick={() => setFermentationMode('Yeast')}>Yeast</SegmentButton>
                            <SegmentButton active={fermentationMode === 'Muscle'} color="#be123c" onClick={() => setFermentationMode('Muscle')}>Muscle</SegmentButton>
                        </div>
                    </ControlGroup>
                )}
                <ControlGroup icon={<Info size={14} className="text-slate-700" />} label="Labels">
                    <div className="grid grid-cols-1 gap-1.5">
                        <ToggleButton active={showIntermediates} color="#0f766e" onClick={() => setShowIntermediates((value) => !value)}>Intermediates</ToggleButton>
                        <ToggleButton active={showEnzymes} color="#d97706" onClick={() => setShowEnzymes((value) => !value)}>Enzymes</ToggleButton>
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Gauge size={14} className="text-emerald-700" />} label="Balance">
                    <ToggleButton active={showBalance} color="#16a34a" onClick={() => setShowBalance((value) => !value)}>
                        NADH/FADH2 ATP
                    </ToggleButton>
                </ControlGroup>
                <ControlGroup icon={<Zap size={14} className="text-slate-700" />} label="Speed">
                    <div className="grid grid-cols-3 gap-1.5">
                        {([0.5, 1, 2] as Speed[]).map((item) => (
                            <SegmentButton key={item} active={speed === item} color="#0f172a" onClick={() => setSpeed(item)}>
                                {item}x
                            </SegmentButton>
                        ))}
                    </div>
                </ControlGroup>
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
            controlsAreaFlex="0 0 clamp(170px, 22%, 205px)"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1320px)] overflow-hidden bg-white border border-slate-200 shadow-2xl rounded-2xl md:rounded-3xl p-3 md:p-4"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

const createWorld = (): World => ({
    time: 0,
    clock: 0,
    glyStep: 0,
    tcaAngle: 0,
    etsRotor: 0,
    particles: [],
    flashes: [],
    smoothAtp: 0,
    smoothNadh: 0,
    smoothFadh2: 0,
    smoothCo2: 0,
    pulseStep: 0,
    pulseTca: 0,
    pulseEts: 0,
});

const computeTargets = (stage: Stage, oxygen: OxygenMode, fermentationMode: FermentationMode, showBalance: boolean): Targets => {
    if (stage === 1) return { atp: 2, nadh: 2, fadh2: 0, co2: 0, label: 'Glycolysis net: 2 ATP + 2 NADH' };
    if (oxygen === 'OFF') {
        return {
            atp: 2,
            nadh: 0,
            fadh2: 0,
            co2: fermentationMode === 'Yeast' ? 2 : 0,
            label: fermentationMode === 'Yeast' ? 'Alcoholic fermentation: ethanol + CO2' : 'Lactic fermentation: lactic acid',
        };
    }
    if (stage === 2) return { atp: 2, nadh: 4, fadh2: 0, co2: 2, label: 'Link reaction: 2 pyruvate -> 2 acetyl CoA' };
    if (stage === 3) return { atp: 4, nadh: 10, fadh2: 2, co2: 6, label: 'Link + two TCA turns per glucose' };
    if (stage >= 4) return { atp: showBalance ? 38 : 4, nadh: 10, fadh2: 2, co2: 6, label: showBalance ? 'Theoretical NCERT balance: 38 ATP' : 'Substrate-level ATP only' };
    return { atp: 0, nadh: 0, fadh2: 0, co2: 0, label: '' };
};

const observationFor = (stage: Stage, oxygen: OxygenMode, fermentationMode: FermentationMode) => {
    if (oxygen === 'OFF' && stage >= 2) {
        return fermentationMode === 'Yeast'
            ? 'Anaerobic yeast fermentation converts pyruvic acid to ethanol and CO2; NADH+H+ is reoxidised to NAD+.'
            : 'When oxygen is inadequate in muscle, pyruvic acid is reduced to lactic acid by lactate dehydrogenase.';
    }
    if (stage === 1) return 'Glycolysis is the EMP pathway in cytoplasm; glucose undergoes partial oxidation to two pyruvic acid molecules.';
    if (stage === 2) return 'Pyruvate enters the mitochondrial matrix and pyruvate dehydrogenase forms acetyl CoA, CO2, and NADH.';
    if (stage === 3) return 'The TCA cycle releases 2 CO2, 3 NADH, 1 FADH2, and 1 ATP per acetyl CoA turn.';
    if (stage === 4) return 'ETS on the inner mitochondrial membrane transfers electrons to O2; ATP synthase uses the proton gradient.';
    return 'The 38 ATP balance is theoretical and assumes an orderly pathway, mitochondrial transfer of glycolytic NADH, no diversion, and glucose only.';
};

const advanceWorld = (
    world: World,
    config: {
        dt: number;
        stage: Stage;
        oxygen: OxygenMode;
        fermentationMode: FermentationMode;
        targets: Targets;
        nextId: () => number;
    },
) => {
    world.time += config.dt;
    world.clock += config.dt;
    world.pulseStep = Math.max(0, world.pulseStep - config.dt * 3);
    world.pulseTca = Math.max(0, world.pulseTca - config.dt * 3);
    world.pulseEts = Math.max(0, world.pulseEts - config.dt * 3);
    world.tcaAngle = (world.tcaAngle + config.dt * 0.55) % (Math.PI * 2);
    world.etsRotor += config.dt * 4;

    world.smoothAtp += (config.targets.atp - world.smoothAtp) * (1 - Math.exp(-config.dt * 2.8));
    world.smoothNadh += (config.targets.nadh - world.smoothNadh) * (1 - Math.exp(-config.dt * 2.8));
    world.smoothFadh2 += (config.targets.fadh2 - world.smoothFadh2) * (1 - Math.exp(-config.dt * 2.8));
    world.smoothCo2 += (config.targets.co2 - world.smoothCo2) * (1 - Math.exp(-config.dt * 2.8));

    const gap = config.stage === 4 ? 0.36 : 0.58;
    while (world.clock >= gap) {
        world.clock -= gap;
        if (config.stage === 1) {
            world.glyStep = (world.glyStep + 1) % GLYCOLYSIS.length;
            world.pulseStep = 1;
            const step = GLYCOLYSIS[world.glyStep];
            if (step.event.includes('ATP')) world.particles.push(makeParticle(config.nextId(), 'ATP', 'glycolysis', 1.8, world.glyStep));
            if (step.event.includes('NADH')) world.particles.push(makeParticle(config.nextId(), 'NADH', 'glycolysis', 1.8, world.glyStep));
            world.particles.push(makeParticle(config.nextId(), world.glyStep === 9 ? 'Pyruvate' : 'e-', 'glycolysis', 1.7, world.glyStep));
            world.flashes.push({ x: glycolysisNodeX(world.glyStep), y: 172, color: step.event.includes('NADH') ? '#2563eb' : step.event.includes('ATP') ? '#16a34a' : '#f59e0b', age: 0, life: 0.7, maxRadius: 58 });
        } else if (config.oxygen === 'OFF') {
            world.particles.push(makeParticle(config.nextId(), config.fermentationMode === 'Yeast' ? 'CO2' : 'NADH', 'ferment', 1.7, Math.random()));
            world.flashes.push({ x: 1060, y: 210, color: config.fermentationMode === 'Yeast' ? '#64748b' : '#be123c', age: 0, life: 0.75, maxRadius: 70 });
        } else if (config.stage === 2) {
            world.particles.push(makeParticle(config.nextId(), 'Pyruvate', 'link', 1.9, Math.random()));
            world.particles.push(makeParticle(config.nextId(), 'Acetyl', 'link', 2.1, Math.random()));
            world.particles.push(makeParticle(config.nextId(), 'CO2', 'link', 1.6, Math.random()));
            world.particles.push(makeParticle(config.nextId(), 'NADH', 'link', 1.6, Math.random()));
            world.flashes.push({ x: 276, y: 404, color: '#f97316', age: 0, life: 0.8, maxRadius: 80 });
        } else if (config.stage === 3) {
            world.pulseTca = 1;
            world.particles.push(makeParticle(config.nextId(), 'NADH', 'tca', 2, Math.random()));
            world.particles.push(makeParticle(config.nextId(), Math.random() > 0.65 ? 'FADH2' : 'CO2', 'tca', 2.1, Math.random()));
            world.flashes.push({ x: 640, y: 446, color: '#16a34a', age: 0, life: 0.75, maxRadius: 95 });
        } else if (config.stage >= 4) {
            world.pulseEts = 1;
            world.particles.push(makeParticle(config.nextId(), 'e-', 'etsElectron', 2.1, Math.random()));
            world.particles.push(makeParticle(config.nextId(), 'H+', 'protonPump', 1.6, Math.random()));
            world.particles.push(makeParticle(config.nextId(), 'H+', 'protonReturn', 1.8, Math.random()));
            if (Math.random() > 0.5) world.particles.push(makeParticle(config.nextId(), 'H2O', 'water', 1.5, Math.random()));
            world.flashes.push({ x: 1074, y: 608, color: '#16a34a', age: 0, life: 0.8, maxRadius: 82 });
        }
    }

    world.particles.forEach((particle) => {
        particle.progress += config.dt / particle.life;
        const pos = particlePosition(particle);
        particle.trail.push(pos);
        if (particle.trail.length > 10) particle.trail.shift();
    });
    world.particles = world.particles.filter((particle) => particle.progress < 1);
    world.flashes.forEach((flash) => { flash.age += config.dt; });
    world.flashes = world.flashes.filter((flash) => flash.age < flash.life);
};

const makeParticle = (id: number, kind: ParticleKind, path: PathKind, life: number, offset: number): Particle => ({
    id,
    kind,
    path,
    life,
    offset,
    progress: 0,
    trail: [],
});

const drawWorld = (
    ctx: CanvasRenderingContext2D,
    world: World,
    config: {
        stage: Stage;
        oxygen: OxygenMode;
        fermentationMode: FermentationMode;
        showIntermediates: boolean;
        showEnzymes: boolean;
        showBalance: boolean;
        targets: Targets;
    },
) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx);
    drawTitle(ctx, config);
    drawCytoplasm(ctx, world, config);
    drawMitochondrion(ctx, world, config);
    drawETS(ctx, world, config);
    if (config.oxygen === 'OFF') drawFermentationBranch(ctx, config.fermentationMode);
    world.flashes.forEach((flash) => drawFlash(ctx, flash));
    world.particles.forEach((particle) => drawParticle(ctx, particle));
};

const drawTitle = (ctx: CanvasRenderingContext2D, config: { stage: Stage; oxygen: OxygenMode; targets: Targets }) => {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 24px Inter, Arial, sans-serif';
    ctx.fillText('Glycolysis - TCA Cycle - ETS', 78, 54);
    ctx.fillStyle = '#475569';
    ctx.font = '800 13px Inter, Arial, sans-serif';
    ctx.fillText(`${STAGE_LABELS[config.stage]} | O2 ${config.oxygen} | ${config.targets.label}`, 78, 76);
    ctx.restore();
};

const drawCytoplasm = (
    ctx: CanvasRenderingContext2D,
    world: World,
    config: { stage: Stage; oxygen: OxygenMode; showIntermediates: boolean; showEnzymes: boolean },
) => {
    ctx.save();
    ctx.fillStyle = '#e0f2fe';
    ctx.strokeStyle = config.stage === 1 ? '#0284c7' : '#bae6fd';
    ctx.lineWidth = config.stage === 1 ? 4 : 2;
    roundRect(ctx, 72, 96, 1136, 172, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#075985';
    ctx.font = '900 17px Inter, Arial, sans-serif';
    ctx.fillText('Cytoplasm: glycolysis / EMP pathway', 94, 124);
    for (let i = 0; i < GLYCOLYSIS.length; i += 1) {
        const x = glycolysisNodeX(i);
        const active = i === world.glyStep && config.stage === 1;
        if (i > 0) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(glycolysisNodeX(i - 1) + 36, 172);
            ctx.lineTo(x - 36, 172);
            ctx.stroke();
        }
        ctx.shadowColor = active ? '#38bdf8' : 'transparent';
        ctx.shadowBlur = active ? 18 : 0;
        ctx.fillStyle = active ? '#ffffff' : '#f8fafc';
        ctx.strokeStyle = active ? '#0284c7' : '#94a3b8';
        ctx.lineWidth = active ? 4 : 2;
        roundRect(ctx, x - 44, 146, 88, 54, 15);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        if (config.showIntermediates) {
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 10px Inter, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(GLYCOLYSIS[i].name, x, 168);
            ctx.fillStyle = '#2563eb';
            ctx.font = '800 10px Inter, Arial, sans-serif';
            ctx.fillText(GLYCOLYSIS[i].c, x, 186);
        }
        const event = GLYCOLYSIS[i].event;
        if (event) {
            ctx.fillStyle = event.includes('-') ? '#dc2626' : event.includes('NADH') ? '#2563eb' : '#16a34a';
            ctx.font = '900 10px Inter, Arial, sans-serif';
            ctx.fillText(event, x, 218);
        }
        if (config.showEnzymes && i < GLYCOLYSIS.length - 1) {
            ctx.fillStyle = '#475569';
            ctx.font = '800 8px Inter, Arial, sans-serif';
            ctx.fillText(GLYCOLYSIS[i].enzyme, x + 52, 140);
        }
    }
    ctx.restore();
};

const drawMitochondrion = (
    ctx: CanvasRenderingContext2D,
    world: World,
    config: { stage: Stage; oxygen: OxygenMode; showIntermediates: boolean; showEnzymes: boolean },
) => {
    ctx.save();
    ctx.fillStyle = '#dcfce7';
    ctx.strokeStyle = config.oxygen === 'ON' && config.stage >= 2 ? '#16a34a' : '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(640, 452, 536, 176, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 7;
    for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(208 + i * 176, 392);
        ctx.bezierCurveTo(260 + i * 176, 342, 326 + i * 176, 442, 382 + i * 176, 388);
        ctx.stroke();
    }
    ctx.fillStyle = '#166534';
    ctx.font = '900 17px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Mitochondrial matrix: link reaction + TCA / Krebs cycle', 180, 324);
    drawLinkReaction(ctx, config.stage, config.oxygen);
    drawTcaCycle(ctx, world, config);
    ctx.restore();
};

const drawLinkReaction = (ctx: CanvasRenderingContext2D, stage: Stage, oxygen: OxygenMode) => {
    const active = stage === 2 && oxygen === 'ON';
    ctx.save();
    ctx.shadowColor = active ? '#fb923c' : 'transparent';
    ctx.shadowBlur = active ? 20 : 0;
    ctx.fillStyle = '#fff7ed';
    ctx.strokeStyle = active ? '#f97316' : '#fed7aa';
    ctx.lineWidth = active ? 4 : 2;
    roundRect(ctx, 150, 344, 244, 86, 18);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#9a3412';
    ctx.font = '900 13px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Link reaction', 272, 368);
    ctx.font = '800 10px Inter, Arial, sans-serif';
    ctx.fillText('Pyruvate -> Acetyl CoA', 272, 388);
    ctx.fillText('+ CO2 + NADH', 272, 405);
    ctx.restore();
};

const drawTcaCycle = (
    ctx: CanvasRenderingContext2D,
    world: World,
    config: { stage: Stage; showIntermediates: boolean; showEnzymes: boolean },
) => {
    const cx = 650;
    const cy = 464;
    const r = 120;
    ctx.save();
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    const tokenX = cx + Math.cos(world.tcaAngle - Math.PI / 2) * r;
    const tokenY = cy + Math.sin(world.tcaAngle - Math.PI / 2) * r;
    ctx.shadowColor = '#16a34a';
    ctx.shadowBlur = config.stage === 3 ? 22 : 0;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(tokenX, tokenY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    TCA.forEach((node, index) => {
        const angle = -Math.PI / 2 + index * Math.PI * 2 / TCA.length;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const active = config.stage === 3 && Math.abs(angleDistance(world.tcaAngle - Math.PI / 2, angle)) < 0.45;
        ctx.fillStyle = active ? '#ffffff' : '#f0fdf4';
        ctx.strokeStyle = active ? '#16a34a' : '#86efac';
        ctx.lineWidth = active ? 4 : 2;
        roundRect(ctx, x - 48, y - 23, 96, 46, 13);
        ctx.fill();
        ctx.stroke();
        if (config.showIntermediates) {
            ctx.fillStyle = '#14532d';
            ctx.font = '900 10px Inter, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(node.name, x, y - 3);
            ctx.fillStyle = '#15803d';
            ctx.font = '800 9px Inter, Arial, sans-serif';
            ctx.fillText(node.c, x, y + 13);
        }
        if (config.showEnzymes) {
            ctx.fillStyle = node.event.includes('NADH') ? '#2563eb' : node.event.includes('FADH2') ? '#7c3aed' : node.event.includes('CO2') ? '#64748b' : '#b45309';
            ctx.font = '800 8px Inter, Arial, sans-serif';
            ctx.fillText(node.event, x, y + 33);
        }
    });
    ctx.fillStyle = '#166534';
    ctx.font = '900 18px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TCA', cx, cy - 8);
    ctx.font = '800 11px Inter, Arial, sans-serif';
    ctx.fillText('2 turns / glucose', cx, cy + 12);
    ctx.restore();
};

const drawETS = (
    ctx: CanvasRenderingContext2D,
    world: World,
    config: { stage: Stage; oxygen: OxygenMode; showEnzymes: boolean; showBalance: boolean },
) => {
    ctx.save();
    const active = config.stage >= 4 && config.oxygen === 'ON';
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = active ? '#ec4899' : '#cbd5e1';
    ctx.lineWidth = active ? 4 : 2;
    roundRect(ctx, 140, 598, 1000, 104, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = '900 13px Inter, Arial, sans-serif';
    ctx.fillText('Inner mitochondrial membrane: ETS + oxidative phosphorylation', 168, 620);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(176, 650);
    ctx.lineTo(1116, 650);
    ctx.stroke();
    const complexes = [
        { x: 260, label: 'I', sub: 'NADH' },
        { x: 394, label: 'II', sub: 'FADH2' },
        { x: 568, label: 'III', sub: 'bc1' },
        { x: 770, label: 'IV', sub: 'cyt ox' },
        { x: 1030, label: 'V', sub: 'F0F1' },
    ];
    complexes.forEach((complex) => {
        const color = complex.label === 'V' ? '#16a34a' : complex.label === 'IV' ? '#ef4444' : '#2563eb';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = active ? color : '#94a3b8';
        ctx.lineWidth = 4;
        roundRect(ctx, complex.x - 36, 614, 72, 76, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '900 18px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(complex.label, complex.x, 645);
        if (config.showEnzymes) {
            ctx.font = '800 9px Inter, Arial, sans-serif';
            ctx.fillText(complex.sub, complex.x, 664);
        }
    });
    drawMobileCarrier(ctx, 476 + Math.sin(world.time * 2) * 16, 650, 'UQ', '#f59e0b');
    drawMobileCarrier(ctx, 668 + Math.cos(world.time * 2.3) * 18, 602, 'cyt c', '#06b6d4');
    drawOxygenWater(ctx, active);
    drawAtpSynthaseRotor(ctx, 1030, 650, world.etsRotor, active);
    ctx.restore();
};

const drawFermentationBranch = (ctx: CanvasRenderingContext2D, mode: FermentationMode) => {
    ctx.save();
    ctx.fillStyle = mode === 'Yeast' ? '#f5f3ff' : '#fff1f2';
    ctx.strokeStyle = mode === 'Yeast' ? '#7c3aed' : '#be123c';
    ctx.lineWidth = 4;
    roundRect(ctx, 934, 112, 238, 136, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = mode === 'Yeast' ? '#5b21b6' : '#be123c';
    ctx.font = '900 15px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mode === 'Yeast' ? 'Alcoholic fermentation' : 'Lactic fermentation', 1053, 145);
    ctx.font = '800 11px Inter, Arial, sans-serif';
    ctx.fillText(mode === 'Yeast' ? 'pyruvic acid decarboxylase' : 'lactate dehydrogenase', 1053, 169);
    ctx.fillText(mode === 'Yeast' ? 'acetaldehyde -> ethanol + CO2' : 'pyruvate -> lactic acid', 1053, 190);
    ctx.fillText('NADH+H+ -> NAD+', 1053, 212);
    drawArrow(ctx, 1040, 252, 930, 252, mode === 'Yeast' ? '#7c3aed' : '#be123c', '');
    ctx.restore();
};

const drawMobileCarrier = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) => {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, 26, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '900 11px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 4);
    ctx.restore();
};

const drawOxygenWater = (ctx: CanvasRenderingContext2D, active: boolean) => {
    ctx.save();
    ctx.fillStyle = '#fee2e2';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(858, 632, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b91c1c';
    ctx.font = '900 10px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('O2', 858, 636);
    if (active) {
        ctx.fillStyle = '#cffafe';
        ctx.strokeStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(858, 682, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0e7490';
        ctx.fillText('H2O', 858, 686);
    }
    ctx.restore();
};

const drawAtpSynthaseRotor = (ctx: CanvasRenderingContext2D, x: number, y: number, rotor: number, active: boolean) => {
    ctx.save();
    ctx.translate(x, y - 68);
    ctx.rotate(rotor);
    ctx.shadowColor = active ? '#16a34a' : 'transparent';
    ctx.shadowBlur = active ? 18 : 0;
    for (let i = 0; i < 3; i += 1) {
        const angle = i * Math.PI * 2 / 3;
        ctx.fillStyle = ['#22c55e', '#facc15', '#38bdf8'][i];
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 20, Math.sin(angle) * 20, 17, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(-rotor);
    ctx.fillStyle = '#166534';
    ctx.font = '900 10px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ATP', 0, 4);
    ctx.restore();
};

const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    const pos = particlePosition(particle);
    const style = PARTICLE_STYLE[particle.kind];
    ctx.save();
    particle.trail.forEach((point, index) => {
        ctx.globalAlpha = (index + 1) / Math.max(1, particle.trail.length) * 0.22;
        ctx.fillStyle = style.fill;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowColor = style.fill;
    ctx.shadowBlur = 15;
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 8px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(style.label, pos.x, pos.y + 3);
    ctx.restore();
};

const drawFlash = (ctx: CanvasRenderingContext2D, flash: Flash) => {
    const t = flash.age / flash.life;
    const radius = flash.maxRadius * t;
    const gradient = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, Math.max(1, radius));
    gradient.addColorStop(0, `${flash.color}88`);
    gradient.addColorStop(0.55, `${flash.color}22`);
    gradient.addColorStop(1, `${flash.color}00`);
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const particlePosition = (particle: Particle): Dot => {
    const t = easeInOut(clamp(particle.progress, 0, 1));
    if (particle.path === 'glycolysis') {
        const start = Math.max(0, Math.min(8, Math.floor(particle.offset)));
        return bezier(t, [
            { x: glycolysisNodeX(start), y: 172 },
            { x: (glycolysisNodeX(start) + glycolysisNodeX(start + 1)) / 2, y: 126 - (start % 2) * 18 },
            { x: glycolysisNodeX(start + 1), y: 172 },
        ]);
    }
    if (particle.path === 'ferment') return bezier(t, [{ x: 1072, y: 238 }, { x: 1120, y: 180 }, { x: 1052, y: 164 }]);
    if (particle.path === 'link') return bezier(t, [{ x: 1052, y: 238 }, { x: 720, y: 270 }, { x: 276, y: 386 }]);
    if (particle.path === 'tca') {
        const angle = t * Math.PI * 2 + particle.offset * Math.PI;
        return { x: 650 + Math.cos(angle - Math.PI / 2) * 124, y: 464 + Math.sin(angle - Math.PI / 2) * 124 };
    }
    if (particle.path === 'etsElectron') return bezier(t, [{ x: 260, y: 650 }, { x: 476, y: 650 }, { x: 568, y: 650 }, { x: 668, y: 604 }, { x: 770, y: 650 }]);
    if (particle.path === 'protonPump') return bezier(t, [{ x: 260 + particle.offset * 540, y: 650 }, { x: 260 + particle.offset * 540, y: 594 }]);
    if (particle.path === 'protonReturn') return bezier(t, [{ x: 1026 + Math.sin(particle.offset * 6) * 30, y: 594 }, { x: 1030, y: 650 }, { x: 1030, y: 690 }]);
    return bezier(t, [{ x: 838, y: 632 }, { x: 858, y: 682 }]);
};

const glycolysisNodeX = (index: number) => 122 + index * 115;

const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, label: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(angle - 0.45) * 16, y2 - Math.sin(angle - 0.45) * 16);
    ctx.lineTo(x2 - Math.cos(angle + 0.45) * 16, y2 - Math.sin(angle + 0.45) * 16);
    ctx.closePath();
    ctx.fill();
    if (label) {
        ctx.font = '900 11px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 8);
    }
    ctx.restore();
};

const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 44; x < W; x += 44) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    for (let y = 44; y < H; y += 44) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }
    ctx.restore();
};

const angleDistance = (a: number, b: number) => {
    const diff = Math.atan2(Math.sin(a - b), Math.cos(a - b));
    return Math.abs(diff);
};

const bezier = (t: number, points: Dot[]): Dot => {
    let current = points.map((point) => ({ ...point }));
    while (current.length > 1) {
        current = current.slice(0, -1).map((point, index) => ({
            x: point.x + (current[index + 1].x - point.x) * t,
            y: point.y + (current[index + 1].y - point.y) * t,
        }));
    }
    return current[0];
};

const BalanceCard: React.FC<{ snapshot: Snapshot }> = ({ snapshot }) => (
    <AsideCard title="NCERT 38 ATP sheet" subtitle="Theoretical balance" icon={<Gauge size={15} className="text-emerald-700" />}>
        <div className="space-y-2">
            <Meter label="ATP" value={snapshot.atp} max={38} color="#16a34a" />
            <Meter label="NADH" value={snapshot.nadh} max={10} color="#2563eb" />
            <Meter label="FADH2" value={snapshot.fadh2} max={2} color="#7c3aed" />
            <Meter label="CO2" value={snapshot.co2} max={6} color="#64748b" />
            <div className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-xs font-bold text-slate-700">
                2 glycolysis ATP + 2 TCA ATP + 10 NADH x 3 + 2 FADH2 x 2 = 38.
            </div>
        </div>
    </AsideCard>
);

const GlycolysisCard: React.FC<{ activeStep: number }> = ({ activeStep }) => (
    <AsideCard title="NCERT Fig 12.1" subtitle="Glycolysis checkpoints" icon={<Activity size={15} className="text-cyan-700" />}>
        <div className="space-y-1.5 text-xs font-bold text-slate-700">
            {[
                'ATP used at hexokinase and PFK.',
                'DHAP isomerises to PGAL; two PGAL move forward.',
                'PGAL to BPGA makes NADH+H+.',
                'BPGA to 3-PGA and PEP to pyruvate make ATP.',
                'Net per glucose: 2 ATP, 2 NADH, 2 pyruvate.',
            ].map((text, index) => (
                <div key={text} className={`rounded-lg border px-2.5 py-1.5 ${Math.floor(activeStep / 2) === index ? 'border-cyan-300 bg-cyan-50 text-cyan-950' : 'border-slate-100 bg-white'}`}>
                    {text}
                </div>
            ))}
        </div>
    </AsideCard>
);

const FermentationCard: React.FC<{ fermentationMode: FermentationMode }> = ({ fermentationMode }) => (
    <AsideCard title="NCERT Fig 12.2" subtitle="Anaerobic branches" icon={<Droplets size={15} className="text-violet-700" />}>
        <div className="space-y-2 text-xs font-bold text-slate-700">
            <div className="rounded-lg border border-violet-100 bg-violet-50 px-2 py-1.5">
                Yeast: pyruvate -&gt; acetaldehyde -&gt; ethanol + CO2.
            </div>
            <div className="rounded-lg border border-rose-100 bg-rose-50 px-2 py-1.5">
                Muscle/bacteria: pyruvate -&gt; lactic acid.
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-1.5">
                Less than 7 percent energy is released; yeast poison themselves near 13 percent alcohol.
            </div>
            <div className="rounded-lg border border-slate-100 bg-white px-2 py-1.5">
                Active: {fermentationMode === 'Yeast' ? 'alcoholic fermentation' : 'lactic acid fermentation'}
            </div>
        </div>
    </AsideCard>
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

const Meter: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
    <div>
        <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-600">
            <span>{label}</span>
            <span style={{ color }}>{Math.round(value)}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, value / max * 100)}%`, background: color }} />
        </div>
    </div>
);

const ValueRow: React.FC<{ label: string; value: string; tint: string; color: string }> = ({ label, value, tint, color }) => (
    <div className="rounded-lg border border-slate-100 px-3 py-2.5" style={{ background: tint }}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 break-words font-mono text-sm font-extrabold" style={{ color }}>{value}</div>
    </div>
);

const MiniFact: React.FC<{ color: string; text: string }> = ({ color, text }) => (
    <div className="flex gap-2 rounded-lg border border-cyan-100 bg-white px-2.5 py-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        <span>{text}</span>
    </div>
);

const ControlGroup: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="min-h-0 rounded-xl border border-slate-200 bg-white p-2.5">
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
        className="min-h-[30px] rounded-lg border px-2 py-1 text-[11px] font-black leading-tight transition-colors"
        style={{
            background: active ? color : '#ffffff',
            borderColor: active ? color : '#e2e8f0',
            color: active ? '#ffffff' : '#334155',
        }}
    >
        {children}
    </button>
);

const ToggleButton: React.FC<{ active: boolean; color: string; onClick: () => void; children: React.ReactNode }> = ({ active, color, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="min-h-[30px] w-full rounded-lg border px-2 py-1 text-[11px] font-black leading-tight transition-colors"
        style={{
            background: active ? color : '#ffffff',
            borderColor: active ? color : '#e2e8f0',
            color: active ? '#ffffff' : '#334155',
        }}
    >
        {children}
    </button>
);

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
};

const easeInOut = (t: number) => t * t * (3 - 2 * t);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default RespirationInPlantsLab;
