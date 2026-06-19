import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Gauge,
    Info,
    Leaf,
    Pause,
    Play,
    RotateCcw,
    Sparkles,
    Thermometer,
    Wind,
    Zap,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface CalvinCycleC3C4LabProps {
    topic: any;
    onExit: () => void;
}

type PlantMode = 'C3' | 'C4';
type OxygenLevel = 'Low' | 'Normal' | 'High';
type Speed = 0.5 | 1 | 2;
type ParticleKind = 'CO2' | 'O2' | 'RuBP' | 'PGA' | 'G3P' | 'PEP' | 'OAA' | 'MALATE' | 'C3RETURN' | 'PHOSPHOGLYCOLATE' | 'SUGAR';
type PathKind = 'c3In' | 'o2In' | 'photoSink' | 'c4Fix' | 'c4Transport' | 'c4Return' | 'bundleCO2' | 'sugarOut';

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
    color: string;
    ring: string;
    label: string;
    offset: number;
    trail: Dot[];
}

interface Flash {
    x: number;
    y: number;
    age: number;
    life: number;
    color: string;
    maxRadius: number;
}

interface World {
    time: number;
    eventClock: number;
    wheel: number;
    turns: number;
    glucose: number;
    co2Pool: number;
    sugar: number;
    photoEvents: number;
    atpConsumedWaste: number;
    c4Cycles: number;
    rubiscoPulse: number;
    pepPulse: number;
    decarbPulse: number;
    calvinPulse: number;
    particles: Particle[];
    flashes: Flash[];
    smoothPhoto: number;
    smoothCo2AtRubisco: number;
}

interface Snapshot {
    mode: PlantMode;
    turns: number;
    glucose: number;
    sugar: number;
    photoRate: number;
    co2AtRubisco: number;
    atpWaste: number;
    activeStage: number;
    c4Cycles: number;
}

interface Derived {
    photoTarget: number;
    co2AtRubisco: number;
    cycleRate: number;
    heatLabel: string;
    observation: string;
}

const W = 1280;
const H = 760;
const DEFAULT_SNAPSHOT: Snapshot = {
    mode: 'C3',
    turns: 0,
    glucose: 0,
    sugar: 0,
    photoRate: 0,
    co2AtRubisco: 62,
    atpWaste: 0,
    activeStage: 1,
    c4Cycles: 0,
};

const PARTICLES: Record<ParticleKind, { color: string; ring: string; label: string; shape: 'circle' | 'hex' | 'diamond' | 'square' }> = {
    CO2: { color: '#22c55e', ring: '#15803d', label: 'CO2', shape: 'circle' },
    O2: { color: '#fb7185', ring: '#dc2626', label: 'O2', shape: 'circle' },
    RuBP: { color: '#2dd4bf', ring: '#0f766e', label: 'RuBP 5C', shape: 'hex' },
    PGA: { color: '#60a5fa', ring: '#1d4ed8', label: '3-PGA', shape: 'square' },
    G3P: { color: '#fbbf24', ring: '#d97706', label: 'G3P', shape: 'diamond' },
    PEP: { color: '#c084fc', ring: '#7c3aed', label: 'PEP 3C', shape: 'hex' },
    OAA: { color: '#86efac', ring: '#16a34a', label: 'OAA 4C', shape: 'diamond' },
    MALATE: { color: '#4ade80', ring: '#15803d', label: 'C4 acid', shape: 'diamond' },
    C3RETURN: { color: '#a7f3d0', ring: '#059669', label: '3C return', shape: 'hex' },
    PHOSPHOGLYCOLATE: { color: '#fda4af', ring: '#be123c', label: '2C waste', shape: 'square' },
    SUGAR: { color: '#fcd34d', ring: '#b45309', label: 'sugar', shape: 'circle' },
};

const STAGES = [
    { name: 'Carboxylation', color: '#16a34a', detail: 'CO2 + RuBP -> 2 x 3-PGA' },
    { name: 'Reduction', color: '#d97706', detail: '2 ATP + 2 NADPH' },
    { name: 'Regeneration', color: '#0891b2', detail: '1 ATP reforms RuBP' },
];

const CalvinCycleC3C4Lab: React.FC<CalvinCycleC3C4LabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef(0);
    const idRef = useRef(1);
    const snapshotClockRef = useRef(0);
    const worldRef = useRef<World>(createWorld());

    const [mode, setMode] = useState<PlantMode>('C3');
    const [temperature, setTemperature] = useState(25);
    const [oxygen, setOxygen] = useState<OxygenLevel>('Normal');
    const [co2Pulse, setCo2Pulse] = useState(4);
    const [showLabels, setShowLabels] = useState(true);
    const [highlightStages, setHighlightStages] = useState(true);
    const [speed, setSpeed] = useState<Speed>(1);
    const [playing, setPlaying] = useState(true);
    const [resetKey, setResetKey] = useState(0);
    const [snapshot, setSnapshot] = useState<Snapshot>(DEFAULT_SNAPSHOT);

    const derived = useMemo(() => computeDerived(mode, temperature, oxygen, co2Pulse), [co2Pulse, mode, oxygen, temperature]);

    const resetLab = useCallback(() => {
        worldRef.current = createWorld();
        idRef.current = 1;
        snapshotClockRef.current = 0;
        setMode('C3');
        setTemperature(25);
        setOxygen('Normal');
        setCo2Pulse(4);
        setShowLabels(true);
        setHighlightStages(true);
        setSpeed(1);
        setPlaying(true);
        setSnapshot(DEFAULT_SNAPSHOT);
        setResetKey((key) => key + 1);
    }, []);

    const addCo2 = useCallback(() => {
        setCo2Pulse((value) => Math.min(10, value + 2));
        worldRef.current.co2Pool = Math.min(14, worldRef.current.co2Pool + 3);
    }, []);

    useEffect(() => {
        worldRef.current.co2Pool = Math.max(worldRef.current.co2Pool, co2Pulse);
    }, [co2Pulse]);

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
                    mode,
                    temperature,
                    oxygen,
                    co2Pulse,
                    derived,
                    nextId: () => idRef.current++,
                });
            }

            drawWorld(ctx, worldRef.current, {
                mode,
                temperature,
                oxygen,
                showLabels,
                highlightStages,
                derived,
            });

            snapshotClockRef.current += dt;
            if (snapshotClockRef.current > 0.15) {
                snapshotClockRef.current = 0;
                const world = worldRef.current;
                const activeStage = Math.floor(((world.wheel % 1) + 1) * 3) % 3 + 1;
                setSnapshot({
                    mode,
                    turns: world.turns,
                    glucose: world.glucose,
                    sugar: world.sugar,
                    photoRate: Math.round(world.smoothPhoto),
                    co2AtRubisco: Math.round(world.smoothCo2AtRubisco),
                    atpWaste: world.atpConsumedWaste,
                    activeStage,
                    c4Cycles: world.c4Cycles,
                });
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastRef.current = 0;
        };
    }, [co2Pulse, derived, highlightStages, mode, oxygen, playing, resetKey, showLabels, speed, temperature]);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 min-[1800px]:block">
            <div className="flex flex-col gap-2.5">
                <CompareCard />
                <EnergyCard snapshot={snapshot} />
                <LegendCard />
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[316px] overflow-y-auto pl-1 min-[1800px]:block">
            <div className="flex flex-col gap-3 pr-16">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="mb-1 flex items-center gap-2 text-base font-extrabold text-emerald-950">
                        <Leaf size={16} />
                        NCERT Ch 11.7-11.9
                    </div>
                    <div className="mb-3 text-xs font-semibold text-emerald-700">Calvin cycle, C4 pathway, photorespiration</div>
                    <div className="rounded-lg border border-emerald-100 bg-white/90 px-3 py-2 text-sm font-bold leading-snug text-emerald-950">
                        RuBP + CO2 --RuBisCO--&gt; 2 x 3-PGA
                    </div>
                    <div className="mt-2 rounded-lg border border-emerald-100 bg-white/90 px-3 py-2 text-sm font-bold leading-snug text-emerald-950">
                        3 ATP + 2 NADPH per CO2; 6 turns make 1 glucose.
                    </div>
                    <div className="mt-3 space-y-2 text-xs font-semibold leading-snug text-emerald-900">
                        <MiniFact color="#16a34a" text="Calvin cycle occurs in all photosynthetic plants." />
                        <MiniFact color="#d97706" text="C3 plants run Calvin cycle in mesophyll cells." />
                        <MiniFact color="#0891b2" text="C4 plants run Calvin cycle only in bundle sheath cells." />
                        <MiniFact color="#dc2626" text="Photorespiration has no known biological function in NCERT." />
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
                        <ValueRow label="ATP / NADPH per CO2" value="3 ATP / 2 NADPH" tint="#ecfdf5" color="#047857" />
                        <ValueRow label="Turns / glucose" value={`${snapshot.turns % 6} / 6`} tint="#fffbeb" color="#b45309" />
                        <ValueRow label="Photorespiration rate" value={snapshot.mode === 'C4' ? '0' : `${snapshot.photoRate}%`} tint="#fff1f2" color="#be123c" />
                        <ValueRow label="CO2 at RuBisCO" value={`${snapshot.co2AtRubisco}%`} tint="#ecfeff" color="#0891b2" />
                        <ValueRow label="Glucose made" value={`${snapshot.glucose}`} tint="#fefce8" color="#a16207" />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
                        <Info size={16} className="text-sky-700" />
                        Live observation
                    </div>
                    <div className="text-sm font-semibold leading-snug text-slate-700">{derived.observation}</div>
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
                    aria-label="Animated Calvin cycle and C3 C4 pathway simulation"
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
                <Leaf size={16} className="text-emerald-700" />
                Calvin Pathway Bench
            </div>
            <div className="grid flex-1 min-h-0 gap-2.5 md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_1fr_.9fr_.95fr_.95fr]">
                <ControlGroup icon={<Leaf size={14} className="text-emerald-700" />} label="Plant pathway">
                    <div className="grid grid-cols-2 gap-1.5">
                        <SegmentButton active={mode === 'C3'} color="#0284c7" onClick={() => setMode('C3')}>C3 plant</SegmentButton>
                        <SegmentButton active={mode === 'C4'} color="#16a34a" onClick={() => setMode('C4')}>C4 plant</SegmentButton>
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Thermometer size={14} className="text-orange-700" />} label="Temperature">
                    <div className="grid grid-cols-5 gap-1.5">
                        {[20, 25, 35, 40, 45].map((item) => (
                            <SegmentButton key={item} active={temperature === item} color={item <= 25 ? '#0284c7' : '#f97316'} onClick={() => setTemperature(item)}>
                                {item}C
                            </SegmentButton>
                        ))}
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Wind size={14} className="text-rose-700" />} label="O2 level">
                    <div className="grid grid-cols-3 gap-1.5">
                        {(['Low', 'Normal', 'High'] as OxygenLevel[]).map((item) => (
                            <SegmentButton key={item} active={oxygen === item} color={item === 'High' ? '#e11d48' : '#0ea5e9'} onClick={() => setOxygen(item)}>
                                {item}
                            </SegmentButton>
                        ))}
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Sparkles size={14} className="text-emerald-700" />} label="CO2 pulse">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={addCo2}
                            className="min-h-[32px] flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-black text-emerald-800 transition-colors hover:bg-emerald-100"
                        >
                            Add CO2
                        </button>
                        <span className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-black text-slate-700">{co2Pulse}</span>
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Activity size={14} className="text-slate-700" />} label="Labels">
                    <div className="grid grid-cols-1 gap-1.5">
                        <ToggleButton active={showLabels} color="#0f766e" onClick={() => setShowLabels((value) => !value)}>Molecule labels</ToggleButton>
                        <ToggleButton active={highlightStages} color="#d97706" onClick={() => setHighlightStages((value) => !value)}>Stage highlight</ToggleButton>
                    </div>
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
    eventClock: 0,
    wheel: 0,
    turns: 0,
    glucose: 0,
    co2Pool: 4,
    sugar: 0,
    photoEvents: 0,
    atpConsumedWaste: 0,
    c4Cycles: 0,
    rubiscoPulse: 0,
    pepPulse: 0,
    decarbPulse: 0,
    calvinPulse: 0,
    particles: [],
    flashes: [],
    smoothPhoto: 0,
    smoothCo2AtRubisco: 62,
});

const computeDerived = (mode: PlantMode, temperature: number, oxygen: OxygenLevel, co2Pulse: number): Derived => {
    const c3Heat = Math.max(0, temperature - 25) / 20;
    const o2Factor = oxygen === 'High' ? 1 : oxygen === 'Normal' ? 0.5 : 0.15;
    const co2Relief = clamp(co2Pulse / 10, 0, 0.65);
    const photoTarget = mode === 'C4' ? 0 : clamp((c3Heat * 58 + o2Factor * 34) * (1 - co2Relief), 0, 82);
    const co2AtRubisco = mode === 'C4'
        ? clamp(86 + co2Pulse * 2, 84, 100)
        : clamp(70 + co2Pulse * 3 - c3Heat * 30 - (oxygen === 'High' ? 12 : 0), 24, 92);
    const optimumBoost = mode === 'C4'
        ? temperature >= 30 && temperature <= 40 ? 1.25 : temperature > 40 ? 0.95 : 0.9
        : temperature >= 20 && temperature <= 25 ? 1.2 : temperature >= 35 ? 0.72 : 0.95;
    const cycleRate = clamp((0.55 + co2AtRubisco / 160) * optimumBoost * (1 - photoTarget / 140), 0.28, 1.45);
    const heatLabel = mode === 'C4' ? 'C4 optimum 30-40C' : 'C3 optimum 20-25C';
    const observation = mode === 'C4'
        ? temperature >= 35
            ? 'C4 in heat: PEPcase fixes CO2 in mesophyll, C4 acid releases concentrated CO2 in bundle sheath, so photorespiration is absent.'
            : 'C4 pathway: Hatch and Slack shuttle separates initial fixation from the Calvin cycle; RuBisCO is in bundle sheath cells.'
        : photoTarget >= 40
            ? 'C3 photorespiring: O2 competes at RuBisCO, producing phosphoglycerate plus phosphoglycolate; sugar stalls and ATP is consumed.'
            : 'C3 mild condition: RuBP accepts CO2 at RuBisCO, two 3-PGA form, and the Calvin cycle regenerates RuBP.';
    return { photoTarget, co2AtRubisco, cycleRate, heatLabel, observation };
};

const advanceWorld = (
    world: World,
    config: {
        dt: number;
        mode: PlantMode;
        temperature: number;
        oxygen: OxygenLevel;
        co2Pulse: number;
        derived: Derived;
        nextId: () => number;
    },
) => {
    world.time += config.dt;
    world.eventClock += config.dt * config.derived.cycleRate;
    world.wheel = (world.wheel + config.dt * config.derived.cycleRate * 0.18) % 1;
    world.rubiscoPulse = Math.max(0, world.rubiscoPulse - config.dt * 2.8);
    world.pepPulse = Math.max(0, world.pepPulse - config.dt * 2.8);
    world.decarbPulse = Math.max(0, world.decarbPulse - config.dt * 2.8);
    world.calvinPulse = Math.max(0, world.calvinPulse - config.dt * 2.8);
    world.smoothPhoto += (config.derived.photoTarget - world.smoothPhoto) * (1 - Math.exp(-config.dt * 3.5));
    world.smoothCo2AtRubisco += (config.derived.co2AtRubisco - world.smoothCo2AtRubisco) * (1 - Math.exp(-config.dt * 3));

    while (world.eventClock >= 1) {
        world.eventClock -= 1;
        if (config.mode === 'C4') {
            triggerC4Cycle(world, config.nextId);
        } else {
            const photoChance = config.derived.photoTarget / 100;
            if (Math.random() < photoChance) triggerPhotorespiration(world, config.nextId);
            else triggerC3Turn(world, config.nextId);
        }
    }

    world.particles.forEach((particle) => {
        particle.progress += config.dt / particle.life;
        const pos = particlePosition(particle);
        particle.trail.push(pos);
        if (particle.trail.length > 11) particle.trail.shift();
    });
    world.particles = world.particles.filter((particle) => particle.progress < 1);
    world.flashes.forEach((flash) => { flash.age += config.dt; });
    world.flashes = world.flashes.filter((flash) => flash.age < flash.life);
};

const triggerC3Turn = (world: World, nextId: () => number) => {
    world.rubiscoPulse = 1;
    world.calvinPulse = 1;
    world.turns += 1;
    world.sugar += 1;
    world.co2Pool = Math.max(0, world.co2Pool - 1);
    if (world.turns % 6 === 0) world.glucose += 1;
    world.particles.push(makeParticle(nextId(), 'CO2', 'c3In', 1.5, Math.random()));
    world.particles.push(makeParticle(nextId(), 'RuBP', 'c3In', 2.1, Math.random()));
    world.particles.push(makeParticle(nextId(), 'PGA', 'sugarOut', 2.3, 0));
    world.particles.push(makeParticle(nextId(), 'G3P', 'sugarOut', 2.1, 0.35));
    world.flashes.push({ x: 660, y: 356, age: 0, life: 0.8, color: '#22c55e', maxRadius: 110 });
};

const triggerPhotorespiration = (world: World, nextId: () => number) => {
    world.rubiscoPulse = 1;
    world.photoEvents += 1;
    world.atpConsumedWaste += 1;
    world.particles.push(makeParticle(nextId(), 'O2', 'o2In', 1.45, Math.random()));
    world.particles.push(makeParticle(nextId(), 'PGA', 'photoSink', 2, 0));
    world.particles.push(makeParticle(nextId(), 'PHOSPHOGLYCOLATE', 'photoSink', 2.2, 0.5));
    world.flashes.push({ x: 660, y: 356, age: 0, life: 0.9, color: '#fb7185', maxRadius: 135 });
};

const triggerC4Cycle = (world: World, nextId: () => number) => {
    world.pepPulse = 1;
    world.decarbPulse = 1;
    world.calvinPulse = 1;
    world.turns += 1;
    world.sugar += 1;
    world.c4Cycles += 1;
    world.co2Pool = Math.max(0, world.co2Pool - 1);
    if (world.turns % 6 === 0) world.glucose += 1;
    world.particles.push(makeParticle(nextId(), 'CO2', 'c4Fix', 1.35, 0));
    world.particles.push(makeParticle(nextId(), 'PEP', 'c4Fix', 1.55, 0.45));
    world.particles.push(makeParticle(nextId(), 'OAA', 'c4Transport', 2.2, 0.1));
    world.particles.push(makeParticle(nextId(), 'MALATE', 'c4Transport', 2.3, 0.5));
    world.particles.push(makeParticle(nextId(), 'C3RETURN', 'c4Return', 2.35, 0.35));
    world.particles.push(makeParticle(nextId(), 'CO2', 'bundleCO2', 1.8, 0.6));
    world.particles.push(makeParticle(nextId(), 'SUGAR', 'sugarOut', 2.1, 0));
    world.flashes.push({ x: 846, y: 362, age: 0, life: 0.9, color: '#22c55e', maxRadius: 128 });
};

const makeParticle = (id: number, kind: ParticleKind, path: PathKind, life: number, offset: number): Particle => ({
    id,
    kind,
    path,
    life,
    offset,
    progress: 0,
    color: PARTICLES[kind].color,
    ring: PARTICLES[kind].ring,
    label: PARTICLES[kind].label,
    trail: [],
});

const drawWorld = (
    ctx: CanvasRenderingContext2D,
    world: World,
    config: { mode: PlantMode; temperature: number; oxygen: OxygenLevel; showLabels: boolean; highlightStages: boolean; derived: Derived },
) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx);
    drawLeafHalo(ctx, config.mode);
    if (config.mode === 'C3') drawC3Apparatus(ctx, world, config);
    else drawC4Apparatus(ctx, world, config);
    world.flashes.forEach((flash) => drawFlash(ctx, flash));
    world.particles.forEach((particle) => drawParticle(ctx, particle, config.showLabels));
    drawCanvasTitle(ctx, config);
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

const drawLeafHalo = (ctx: CanvasRenderingContext2D, mode: PlantMode) => {
    ctx.save();
    const gradient = ctx.createLinearGradient(190, 120, 1110, 648);
    gradient.addColorStop(0, '#f0fdf4');
    gradient.addColorStop(1, '#dcfce7');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = mode === 'C4' ? '#16a34a' : '#0284c7';
    ctx.lineWidth = 3;
    roundRect(ctx, 116, 96, 1048, 564, 36);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

const drawCanvasTitle = (
    ctx: CanvasRenderingContext2D,
    config: { mode: PlantMode; temperature: number; oxygen: OxygenLevel; derived: Derived },
) => {
    ctx.save();
    ctx.fillStyle = '#166534';
    ctx.font = '900 24px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(config.mode === 'C4' ? 'C4 Hatch-Slack pathway' : 'C3 Calvin cycle pathway', 148, 68);
    ctx.fillStyle = '#475569';
    ctx.font = '800 13px Inter, Arial, sans-serif';
    ctx.fillText(`${config.temperature}C | O2 ${config.oxygen} | ${config.derived.heatLabel}`, 148, 90);
    ctx.restore();
};

const drawC3Apparatus = (
    ctx: CanvasRenderingContext2D,
    world: World,
    config: { highlightStages: boolean; derived: Derived },
) => {
    drawCell(ctx, 190, 138, 900, 460, '#e0f2fe', '#0284c7', 'Mesophyll cell', 'C3: Calvin cycle runs in mesophyll');
    drawCalvinWheel(ctx, 650, 354, 168, world, config.highlightStages, false);
    drawRubisco(ctx, 650, 354, world.rubiscoPulse, world.smoothPhoto > 35);
    drawMoleculeCloud(ctx, 345, 280, 'CO2', 7, '#22c55e');
    drawMoleculeCloud(ctx, 346, 438, 'O2', 4, '#fb7185');
    drawArrow(ctx, 404, 282, 520, 320, '#16a34a', 'CO2');
    drawArrow(ctx, 404, 438, 518, 388, '#e11d48', 'O2 competition');
    drawWasteSink(ctx, 900, 416, world.smoothPhoto);
    drawSugarJar(ctx, 914, 238, world.glucose, world.sugar);
};

const drawC4Apparatus = (
    ctx: CanvasRenderingContext2D,
    world: World,
    config: { highlightStages: boolean; derived: Derived },
) => {
    drawCell(ctx, 156, 146, 424, 438, '#f0fdf4', '#16a34a', 'Mesophyll cell', 'PEPcase present; RuBisCO absent');
    drawCell(ctx, 682, 126, 424, 478, '#ecfdf5', '#047857', 'Bundle sheath cell', 'RuBisCO rich; PEPcase absent');
    drawThickWall(ctx, 682, 126, 424, 478);
    drawPlasmodesmata(ctx, 582, 330, 682);
    drawPepcase(ctx, 356, 344, world.pepPulse);
    drawCalvinWheel(ctx, 896, 350, 126, world, config.highlightStages, true);
    drawRubisco(ctx, 896, 350, world.calvinPulse, false);
    drawBundleChloroplasts(ctx, 760, 188);
    drawCo2Cloud(ctx, 966, 236, world.smoothCo2AtRubisco);
    drawArrow(ctx, 460, 276, 734, 276, '#16a34a', 'C4 acid ->');
    drawArrow(ctx, 736, 494, 460, 494, '#059669', '<- 3C return');
    drawArrow(ctx, 356, 405, 356, 454, '#7c3aed', 'PEP regenerated');
    drawO2Boundary(ctx, 1052, 188);
    drawSugarJar(ctx, 1050, 444, world.glucose, world.sugar);
};

const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke: string, title: string, subtitle: string) => {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    roundRect(ctx, x, y, w, h, 34);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = stroke;
    ctx.font = '900 18px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 24, y + 34);
    ctx.fillStyle = '#475569';
    ctx.font = '800 12px Inter, Arial, sans-serif';
    ctx.fillText(subtitle, x + 24, y + 54);
    ctx.restore();
};

const drawCalvinWheel = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, world: World, highlight: boolean, compact: boolean) => {
    ctx.save();
    const start = -Math.PI / 2;
    STAGES.forEach((stage, index) => {
        const a0 = start + index * Math.PI * 2 / 3;
        const a1 = start + (index + 1) * Math.PI * 2 / 3 - 0.035;
        const active = Math.floor(world.wheel * 3) === index;
        ctx.beginPath();
        ctx.arc(cx, cy, r, a0, a1);
        ctx.arc(cx, cy, r - (compact ? 42 : 54), a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = active && highlight ? stage.color : `${stage.color}55`;
        ctx.strokeStyle = stage.color;
        ctx.lineWidth = active && highlight ? 5 : 3;
        ctx.shadowColor = active && highlight ? stage.color : 'transparent';
        ctx.shadowBlur = active && highlight ? 18 : 0;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        const mid = (a0 + a1) / 2;
        ctx.fillStyle = '#0f172a';
        ctx.font = `900 ${compact ? 10 : 13}px Inter, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(stage.name, cx + Math.cos(mid) * (r - 27), cy + Math.sin(mid) * (r - 27));
        if (!compact) {
            ctx.font = '800 10px Inter, Arial, sans-serif';
            ctx.fillStyle = '#334155';
            ctx.fillText(stage.detail, cx + Math.cos(mid) * (r - 76), cy + Math.sin(mid) * (r - 76) + 16);
        }
    });
    const marker = start + world.wheel * Math.PI * 2;
    const mx = cx + Math.cos(marker) * (r - (compact ? 22 : 28));
    const my = cy + Math.sin(marker) * (r - (compact ? 22 : 28));
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(mx, my, compact ? 11 : 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#166534';
    ctx.font = `900 ${compact ? 16 : 22}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Calvin', cx, cy - 4);
    ctx.font = `800 ${compact ? 11 : 13}px Inter, Arial, sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText(`${world.turns % 6}/6 turns`, cx, cy + 22);
    ctx.restore();
};

const drawRubisco = (ctx: CanvasRenderingContext2D, x: number, y: number, pulse: number, danger: boolean) => {
    ctx.save();
    ctx.shadowColor = danger ? '#fb7185' : '#22c55e';
    ctx.shadowBlur = 10 + pulse * 26;
    ctx.fillStyle = danger ? '#ffe4e6' : '#dcfce7';
    ctx.strokeStyle = danger ? '#e11d48' : '#16a34a';
    ctx.lineWidth = 4;
    roundRect(ctx, x - 56, y - 28, 112, 56, 18);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = danger ? '#be123c' : '#166534';
    ctx.font = '900 15px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RuBisCO', x, y - 4);
    ctx.font = '800 10px Inter, Arial, sans-serif';
    ctx.fillText(danger ? 'O2 bound' : 'CO2 bound', x, y + 13);
    ctx.restore();
};

const drawPepcase = (ctx: CanvasRenderingContext2D, x: number, y: number, pulse: number) => {
    ctx.save();
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 8 + pulse * 22;
    ctx.fillStyle = '#f3e8ff';
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 4;
    roundRect(ctx, x - 70, y - 34, 140, 68, 20);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#581c87';
    ctx.font = '900 16px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PEPcase', x, y - 5);
    ctx.font = '800 10px Inter, Arial, sans-serif';
    ctx.fillText('PEP + CO2 -> OAA', x, y + 14);
    ctx.restore();
};

const drawThickWall = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.save();
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 10;
    roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 28);
    ctx.stroke();
    ctx.fillStyle = '#065f46';
    ctx.font = '900 12px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Kranz: thick wall, no intercellular spaces', x + w / 2, y + h - 28);
    ctx.restore();
};

const drawPlasmodesmata = (ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) => {
    ctx.save();
    for (let i = -2; i <= 2; i += 1) {
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y + i * 18);
        ctx.lineTo(x2, y + i * 18);
        ctx.stroke();
    }
    ctx.fillStyle = '#065f46';
    ctx.font = '900 11px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('plasmodesmata', (x1 + x2) / 2, y - 58);
    ctx.restore();
};

const drawBundleChloroplasts = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.fillStyle = '#bbf7d0';
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i += 1) {
        const px = x + (i % 4) * 54;
        const py = y + Math.floor(i / 4) * 42;
        ctx.beginPath();
        ctx.ellipse(px, py, 25, 14, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.fillStyle = '#166534';
    ctx.font = '900 11px Inter, Arial, sans-serif';
    ctx.fillText('many chloroplasts', x + 82, y + 86);
    ctx.restore();
};

const drawCo2Cloud = (ctx: CanvasRenderingContext2D, x: number, y: number, amount: number) => {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#bbf7d0';
    for (let i = 0; i < 14; i += 1) {
        const angle = i * 1.7;
        const radius = 12 + amount * 0.55 + (i % 3) * 8;
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * radius * 0.55, y + Math.sin(angle) * radius * 0.34, 10 + (i % 3) * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#15803d';
    ctx.font = '900 13px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('high CO2', x, y + 4);
    ctx.restore();
};

const drawMoleculeCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, count: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.font = '900 11px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < count; i += 1) {
        const px = x + Math.cos(i * 1.9) * (30 + (i % 3) * 8);
        const py = y + Math.sin(i * 1.4) * (24 + (i % 2) * 8);
        ctx.beginPath();
        ctx.arc(px, py, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, px, py + 4);
        ctx.fillStyle = color;
    }
    ctx.restore();
};

const drawWasteSink = (ctx: CanvasRenderingContext2D, x: number, y: number, photoRate: number) => {
    ctx.save();
    ctx.fillStyle = '#fff1f2';
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 3;
    roundRect(ctx, x - 86, y - 58, 172, 116, 20);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#be123c';
    ctx.font = '900 14px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Photorespiration sink', x, y - 24);
    ctx.font = '800 11px Inter, Arial, sans-serif';
    ctx.fillText('no sugar', x, y - 2);
    ctx.fillText('ATP consumed', x, y + 17);
    ctx.fillText(`rate ${Math.round(photoRate)}%`, x, y + 38);
    ctx.restore();
};

const drawSugarJar = (ctx: CanvasRenderingContext2D, x: number, y: number, glucose: number, sugar: number) => {
    ctx.save();
    ctx.fillStyle = '#fffbeb';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    roundRect(ctx, x - 56, y - 70, 112, 140, 22);
    ctx.fill();
    ctx.stroke();
    const fillHeight = clamp((sugar % 12) / 12 * 98, 8, 98);
    ctx.fillStyle = '#fcd34d';
    roundRect(ctx, x - 42, y + 50 - fillHeight, 84, fillHeight, 14);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.font = '900 13px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sugar', x, y - 42);
    ctx.font = '900 18px Inter, Arial, sans-serif';
    ctx.fillText(`${glucose}`, x, y + 8);
    ctx.font = '800 10px Inter, Arial, sans-serif';
    ctx.fillText('glucose', x, y + 26);
    ctx.restore();
};

const drawO2Boundary = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 5;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 290);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#be123c';
    ctx.font = '900 13px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('O2 excluded', x, y - 14);
    ctx.restore();
};

const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, label: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(angle - 0.45) * 18, y2 - Math.sin(angle - 0.45) * 18);
    ctx.lineTo(x2 - Math.cos(angle + 0.45) * 18, y2 - Math.sin(angle + 0.45) * 18);
    ctx.closePath();
    ctx.fill();
    ctx.font = '900 12px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 10);
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

const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle, showLabel: boolean) => {
    const pos = particlePosition(particle);
    ctx.save();
    particle.trail.forEach((point, index) => {
        ctx.globalAlpha = (index + 1) / Math.max(1, particle.trail.length) * 0.22;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = particle.color;
    ctx.strokeStyle = particle.ring;
    ctx.lineWidth = 3;
    drawParticleShape(ctx, pos.x, pos.y, PARTICLES[particle.kind].shape, 17);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (showLabel) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 9px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(particle.label, pos.x, pos.y + 3);
    }
    ctx.restore();
};

const drawParticleShape = (ctx: CanvasRenderingContext2D, x: number, y: number, shape: 'circle' | 'hex' | 'diamond' | 'square', r: number) => {
    ctx.beginPath();
    if (shape === 'circle') {
        ctx.arc(x, y, r, 0, Math.PI * 2);
        return;
    }
    const points = shape === 'square' ? 4 : shape === 'diamond' ? 4 : 6;
    const rotation = shape === 'diamond' ? Math.PI / 4 : -Math.PI / 2;
    for (let i = 0; i < points; i += 1) {
        const angle = rotation + i * Math.PI * 2 / points;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
};

const particlePosition = (particle: Particle): Dot => {
    const t = easeInOut(clamp(particle.progress, 0, 1));
    if (particle.path === 'c3In') return bezier(t, [{ x: 280, y: 260 + particle.offset * 90 }, { x: 430, y: 280 }, { x: 565, y: 330 }, { x: 650, y: 356 }]);
    if (particle.path === 'o2In') return bezier(t, [{ x: 270, y: 450 }, { x: 410, y: 438 }, { x: 540, y: 395 }, { x: 650, y: 356 }]);
    if (particle.path === 'photoSink') return bezier(t, [{ x: 650, y: 356 }, { x: 720, y: 404 }, { x: 800, y: 436 }, { x: 900 + particle.offset * 24, y: 430 + particle.offset * 42 }]);
    if (particle.path === 'c4Fix') return bezier(t, [{ x: 214 + particle.offset * 40, y: 280 }, { x: 270, y: 320 }, { x: 322, y: 344 }, { x: 356, y: 344 }]);
    if (particle.path === 'c4Transport') return bezier(t, [{ x: 356, y: 344 }, { x: 446, y: 246 }, { x: 658, y: 250 }, { x: 846, y: 310 + particle.offset * 48 }]);
    if (particle.path === 'c4Return') return bezier(t, [{ x: 906, y: 418 }, { x: 748, y: 522 }, { x: 524, y: 520 }, { x: 356, y: 454 }]);
    if (particle.path === 'bundleCO2') return bezier(t, [{ x: 846, y: 310 }, { x: 908, y: 280 }, { x: 958, y: 254 }, { x: 966, y: 236 }]);
    return bezier(t, [{ x: 650, y: 356 }, { x: 760, y: 282 }, { x: 880, y: 250 }, { x: 930, y: 224 + particle.offset * 26 }]);
};

const bezier = (t: number, points: Dot[]) => {
    let current = points.map((point) => ({ ...point }));
    while (current.length > 1) {
        current = current.slice(0, -1).map((point, index) => ({
            x: point.x + (current[index + 1].x - point.x) * t,
            y: point.y + (current[index + 1].y - point.y) * t,
        }));
    }
    return current[0];
};

const CompareCard: React.FC = () => (
    <AsideCard title="NCERT Table 11.1" subtitle="C3 vs C4 comparison" icon={<Activity size={15} className="text-emerald-700" />}>
        <div className="grid grid-cols-[1fr_.8fr_.8fr] overflow-hidden rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700">
            {[
                ['Feature', 'C3', 'C4'],
                ['Calvin cycle', 'Mesophyll', 'Bundle sheath'],
                ['Initial fixation', 'Mesophyll', 'Mesophyll'],
                ['Cell types fixing CO2', 'One', 'Two'],
                ['Primary acceptor', 'RuBP 5C', 'PEP 3C'],
                ['First product', 'PGA 3C', 'OAA 4C'],
                ['RuBisCO', 'Yes', 'BS only'],
                ['PEPcase', 'No', 'Yes'],
                ['Optimum temp.', '20-25C', '30-40C'],
                ['Photorespiration', 'Present', 'Absent'],
            ].map((row, index) => row.map((cell, col) => (
                <div key={`${index}-${col}`} className={`${index === 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-white'} border-b border-r border-slate-100 px-2 py-1.5`}>
                    {cell}
                </div>
            )))}
        </div>
    </AsideCard>
);

const EnergyCard: React.FC<{ snapshot: Snapshot }> = ({ snapshot }) => (
    <AsideCard title="NCERT Fig 11.8" subtitle="Calvin energy accounting" icon={<Zap size={15} className="text-amber-700" />}>
        <div className="space-y-2">
            <Meter label="Glucose progress" value={snapshot.turns % 6} max={6} color="#16a34a" />
            <Meter label="Photorespiration" value={snapshot.photoRate} max={100} color="#e11d48" />
            <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900">
                1 CO2: 3 ATP + 2 NADPH
            </div>
            <div className="rounded-lg border border-slate-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900">
                1 glucose: 18 ATP + 12 NADPH
            </div>
        </div>
    </AsideCard>
);

const LegendCard: React.FC = () => (
    <AsideCard title="Molecule legend" subtitle="Token colors and labels" icon={<Sparkles size={15} className="text-teal-700" />}>
        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
            {(['CO2', 'O2', 'RuBP', 'PGA', 'G3P', 'PEP', 'OAA', 'MALATE'] as ParticleKind[]).map((kind) => (
                <div key={kind} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2 py-1.5">
                    <span className="h-3 w-3 rounded-full" style={{ background: PARTICLES[kind].color, border: `2px solid ${PARTICLES[kind].ring}` }} />
                    {PARTICLES[kind].label}
                </div>
            ))}
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
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, value / max * 100)}%`, background: color }} />
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
    <div className="flex gap-2 rounded-lg border border-emerald-100 bg-white px-2.5 py-2">
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

export default CalvinCycleC3C4Lab;
