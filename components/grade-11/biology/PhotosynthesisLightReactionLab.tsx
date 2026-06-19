import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Sun,
    Droplets,
    Zap,
    Leaf,
    Activity,
    Gauge,
    Play,
    Pause,
    RotateCcw,
    ChevronRight,
    Info,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PhotosynthesisLightReactionLabProps {
    topic: any;
    onExit: () => void;
}

type WavelengthMode = 'blue450' | 'red680' | 'red700' | 'farRed';
type FlowMode = 'noncyclic' | 'cyclic';
type Speed = 0.5 | 1 | 2;

interface MovingDot {
    id: number;
    progress: number;
    life: number;
    path: 'noncyclic' | 'cyclic' | 'proton' | 'oxygen' | 'atp' | 'nadph' | 'photon';
    color: string;
    label: string;
    offset: number;
    trail: Array<{ x: number; y: number }>;
}

interface World {
    time: number;
    eventClock: number;
    waterElectrons: number;
    lumenH: number;
    stromaH: number;
    oxygen: number;
    nadph: number;
    atp: number;
    adp: number;
    rotor: number;
    protonRotor: number;
    activeStep: number;
    particles: MovingDot[];
    pulsePS2: number;
    pulsePS1: number;
    pulseOEC: number;
    pulseFNR: number;
    pulseATP: number;
}

interface Snapshot {
    lumenH: number;
    stromaH: number;
    pH: number;
    oxygen: number;
    nadph: number;
    atp: number;
    adp: number;
    activeStep: number;
    mode: FlowMode;
}

const W = 1280;
const H = 760;
const MAIN_APPARATUS_SCALE = 1.16;
const EMPTY_SNAPSHOT: Snapshot = {
    lumenH: 0,
    stromaH: 12,
    pH: 7,
    oxygen: 0,
    nadph: 0,
    atp: 0,
    adp: 3,
    activeStep: 1,
    mode: 'noncyclic',
};

const WAVELENGTHS: Record<WavelengthMode, { label: string; nm: number; color: string; note: string }> = {
    blue450: { label: 'Blue 450', nm: 450, color: '#2563eb', note: 'chl b / carotenoid antenna' },
    red680: { label: 'Red 680', nm: 680, color: '#f97316', note: 'PS II P680 plus PS I chain' },
    red700: { label: 'Red 700', nm: 700, color: '#dc2626', note: 'PS I P700 dominant' },
    farRed: { label: 'Far-red >680', nm: 710, color: '#991b1b', note: 'PS I only, cyclic' },
};

const PhotosynthesisLightReactionLab: React.FC<PhotosynthesisLightReactionLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef(0);
    const worldRef = useRef<World>(createWorld());
    const idRef = useRef(1);

    const [playing, setPlaying] = useState(true);
    const [wavelength, setWavelength] = useState<WavelengthMode>('red680');
    const [flowMode, setFlowMode] = useState<FlowMode>('noncyclic');
    const [intensity, setIntensity] = useState(60);
    const [adpSupply, setAdpSupply] = useState(3);
    const [cf0Open, setCf0Open] = useState(true);
    const [speed, setSpeed] = useState<Speed>(1);
    const [resetKey, setResetKey] = useState(0);
    const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);

    const effectiveMode: FlowMode = wavelength === 'farRed' ? 'cyclic' : flowMode;
    const canRunNoncyclic = effectiveMode === 'noncyclic' && (wavelength === 'red680' || wavelength === 'blue450');
    const canRunCyclic = effectiveMode === 'cyclic' || wavelength === 'red700' || wavelength === 'farRed';

    useEffect(() => {
        setFlowMode((mode) => wavelength === 'farRed' ? 'cyclic' : mode);
    }, [wavelength]);

    useEffect(() => {
        worldRef.current.adp = adpSupply;
    }, [adpSupply]);

    const resetLab = useCallback(() => {
        worldRef.current = createWorld();
        idRef.current = 1;
        setPlaying(true);
        setWavelength('red680');
        setFlowMode('noncyclic');
        setIntensity(60);
        setAdpSupply(3);
        setCf0Open(true);
        setSpeed(1);
        setSnapshot(EMPTY_SNAPSHOT);
        setResetKey((key) => key + 1);
    }, []);

    const addAdp = useCallback(() => {
        setAdpSupply((value) => {
            const next = Math.min(10, value + 3);
            worldRef.current.adp = next;
            return next;
        });
    }, []);

    const pulseChloroplastInset = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * W / rect.width;
        const y = (event.clientY - rect.top) * H / rect.height;
        if (x < 72 || x > 242 || y < 98 || y > 200) return;

        const world = worldRef.current;
        world.activeStep = effectiveMode === 'cyclic' ? 3 : 1;
        world.pulsePS1 = 1;
        world.pulsePS2 = effectiveMode === 'noncyclic' ? 1 : world.pulsePS2;
        world.pulseOEC = effectiveMode === 'noncyclic' ? 1 : world.pulseOEC;
        setSnapshot({
            lumenH: Math.round(world.lumenH),
            stromaH: Math.round(world.stromaH),
            pH: lumenPH(world.lumenH),
            oxygen: world.oxygen,
            nadph: world.nadph,
            atp: world.atp,
            adp: world.adp,
            activeStep: world.activeStep,
            mode: effectiveMode,
        });
    }, [effectiveMode]);

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
                    wavelength,
                    mode: effectiveMode,
                    intensity,
                    cf0Open,
                    canRunNoncyclic,
                    canRunCyclic,
                    nextId: () => idRef.current++,
                });
            }
            drawWorld(ctx, worldRef.current, {
                wavelength,
                mode: effectiveMode,
                intensity,
                cf0Open,
                canRunNoncyclic,
                canRunCyclic,
            });
            const world = worldRef.current;
            if (Math.floor(world.time * 5) !== Math.floor((world.time - dt) * 5)) {
                setSnapshot({
                    lumenH: Math.round(world.lumenH),
                    stromaH: Math.round(world.stromaH),
                    pH: lumenPH(world.lumenH),
                    oxygen: world.oxygen,
                    nadph: world.nadph,
                    atp: world.atp,
                    adp: world.adp,
                    activeStep: world.activeStep,
                    mode: effectiveMode,
                });
                setAdpSupply(world.adp);
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastRef.current = 0;
        };
    }, [canRunCyclic, canRunNoncyclic, cf0Open, effectiveMode, intensity, playing, resetKey, speed, wavelength]);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 min-[1800px]:block">
            <div className="flex flex-col gap-2.5 pt-9">
                <AbsorptionCard wavelength={wavelength} />
                <ZSchemeCard mode={effectiveMode} activeStep={snapshot.activeStep} />
                <ProductMeterCard snapshot={snapshot} />
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 min-[1800px]:block">
            <div className="flex flex-col gap-3 pr-16">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="mb-1 flex items-center gap-2 text-base font-extrabold text-amber-900">
                        <Info size={16} />
                        NCERT Ch 11.5-11.7
                    </div>
                    <div className="mb-3 text-xs font-semibold text-amber-700">Light reaction and photophosphorylation</div>
                    <div className="rounded-lg border border-amber-100 bg-white/85 px-3 py-2 text-sm font-bold leading-snug text-amber-950">
                        Photophosphorylation is the synthesis of ATP from ADP and inorganic phosphate in the presence of light.
                    </div>
                    <div className="mt-3 space-y-1.5">
                        {[
                            'Photon energy reaches P680 / P700 via antenna pigments.',
                            'P680 loses e-; water splitting replenishes PS II.',
                            'e- flows PQ -> Cyt b6f -> PC; H+ enters lumen.',
                            'PS I reduces NADP+ to NADPH + H+ in non-cyclic flow.',
                            'Lumen gains H+; stroma loses H+; pH drops.',
                            'H+ returns through CF0; CF1 changes shape and makes ATP.',
                        ].map((text, index) => (
                            <div
                                key={text}
                                className={`flex gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold leading-snug ${
                                    snapshot.activeStep === index + 1
                                        ? 'border-amber-300 bg-white text-amber-950 shadow-sm'
                                        : 'border-white/70 bg-white/55 text-amber-900'
                                }`}
                            >
                                <ChevronRight size={13} className="mt-0.5 shrink-0" />
                                <span>{index + 1}. {text}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">LIVE</span>
                    </div>
                    <div className="grid gap-2">
                        <ValueRow label="Mode" value={snapshot.mode === 'cyclic' ? 'Cyclic PS I' : 'Non-cyclic Z-scheme'} tint="#f8fafc" color="#334155" />
                        <ValueRow label="Wavelength" value={`${WAVELENGTHS[wavelength].nm} nm`} tint="#eef2ff" color="#4f46e5" />
                        <ValueRow label="Lumen pH" value={snapshot.pH.toFixed(1)} tint={snapshot.pH <= 5.5 ? '#fff7ed' : '#ecfdf5'} color={snapshot.pH <= 5.5 ? '#c2410c' : '#059669'} />
                        <ValueRow label="H+ in lumen" value={`${snapshot.lumenH}`} tint="#fffbeb" color="#b45309" />
                        <ValueRow label="Stromal H+ pool" value={`${snapshot.stromaH}`} tint="#ecfeff" color="#0891b2" />
                        <ValueRow label="O2 released" value={`${snapshot.oxygen}`} tint="#eff6ff" color="#1d4ed8" />
                        <ValueRow label="NADPH made" value={`${snapshot.nadph}`} tint="#ecfdf5" color="#047857" />
                        <ValueRow label="ATP made" value={`${snapshot.atp}`} tint="#f5f3ff" color="#7c3aed" />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
                        <Leaf size={16} className="text-emerald-700" />
                        NCERT notes
                    </div>
                    <div className="space-y-2 text-xs font-semibold leading-snug text-slate-700">
                        <MiniFact color="#16a34a" text="Membranes trap light energy and synthesize ATP and NADPH; stroma carries carbon-fixation reactions." />
                        <MiniFact color="#d97706" text="Accessory pigments broaden light absorption and protect chlorophyll a from photo-oxidation." />
                        <MiniFact color="#dc2626" text="PS I and PS II are named by discovery order, not functional order. Function order is PS II then PS I." />
                        <MiniFact color="#7c3aed" text="Cyclic flow occurs with PS I only in stroma lamellae or when wavelengths beyond 680 nm are available." />
                        <MiniFact color="#0891b2" text="Chemiosmosis needs a membrane, proton pump, proton gradient, and ATP synthase." />
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
                    onClick={pulseChloroplastInset}
                    className="absolute inset-0 h-full w-full"
                    aria-label="Canvas animation of light reaction and photophosphorylation"
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
                <Sun size={16} className="text-amber-600" />
                Light Reaction Bench
            </div>
            <div className="grid flex-1 min-h-0 gap-2.5 md:grid-cols-2 lg:grid-cols-[1.35fr_1.35fr_1fr_1.2fr_.9fr_.9fr]">
                <ControlGroup icon={<Sun size={14} className="text-amber-700" />} label="Wavelength">
                    <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(WAVELENGTHS) as WavelengthMode[]).map((item) => (
                            <SegmentButton
                                key={item}
                                active={wavelength === item}
                                color={WAVELENGTHS[item].color}
                                onClick={() => setWavelength(item)}
                            >
                                {WAVELENGTHS[item].label}
                            </SegmentButton>
                        ))}
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Activity size={14} className="text-amber-700" />} label="Light intensity">
                    <SliderControl label="Intensity" value={intensity} min={0} max={100} step={1} suffix="%" onChange={setIntensity} />
                </ControlGroup>
                <ControlGroup icon={<Zap size={14} className="text-violet-700" />} label="Flow mode">
                    <div className="grid grid-cols-2 gap-1.5">
                        <SegmentButton active={effectiveMode === 'noncyclic'} color="#16a34a" onClick={() => setFlowMode('noncyclic')}>Non-cyclic</SegmentButton>
                        <SegmentButton active={effectiveMode === 'cyclic'} color="#7c3aed" onClick={() => setFlowMode('cyclic')}>Cyclic</SegmentButton>
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Droplets size={14} className="text-cyan-700" />} label="CF0 gate">
                    <ToggleButton active={cf0Open} color="#0891b2" onClick={() => setCf0Open((value) => !value)}>
                        {cf0Open ? 'CF0 open: H+ flows' : 'CF0 closed: H+ accumulates'}
                    </ToggleButton>
                </ControlGroup>
                <ControlGroup icon={<Leaf size={14} className="text-emerald-700" />} label="ADP + Pi supply">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-black text-slate-800">
                            {adpSupply}
                        </div>
                        <button
                            type="button"
                            onClick={addAdp}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 transition-colors hover:bg-emerald-100"
                        >
                            +3
                        </button>
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Gauge size={14} className="text-slate-700" />} label="Animation speed">
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
    waterElectrons: 0,
    lumenH: 0,
    stromaH: 12,
    oxygen: 0,
    nadph: 0,
    atp: 0,
    adp: 3,
    rotor: 0,
    protonRotor: 0,
    activeStep: 1,
    particles: [],
    pulsePS2: 0,
    pulsePS1: 0,
    pulseOEC: 0,
    pulseFNR: 0,
    pulseATP: 0,
});

const advanceWorld = (
    world: World,
    config: {
        dt: number;
        wavelength: WavelengthMode;
        mode: FlowMode;
        intensity: number;
        cf0Open: boolean;
        canRunNoncyclic: boolean;
        canRunCyclic: boolean;
        nextId: () => number;
    },
) => {
    world.time += config.dt;
    world.eventClock += config.dt * Math.max(0.15, config.intensity / 60);
    world.pulsePS2 = Math.max(0, world.pulsePS2 - config.dt * 3);
    world.pulsePS1 = Math.max(0, world.pulsePS1 - config.dt * 3);
    world.pulseOEC = Math.max(0, world.pulseOEC - config.dt * 3);
    world.pulseFNR = Math.max(0, world.pulseFNR - config.dt * 3);
    world.pulseATP = Math.max(0, world.pulseATP - config.dt * 3);

    const eventGap = 1.2;
    while (world.eventClock > eventGap && config.intensity > 0) {
        world.eventClock -= eventGap;
        spawnPhoton(world, config);
        if (config.mode === 'noncyclic' && config.canRunNoncyclic) triggerNoncyclicEvent(world, config.nextId);
        if (config.mode === 'cyclic' && config.canRunCyclic) triggerCyclicEvent(world, config.nextId);
    }

    if (config.cf0Open && world.lumenH >= 1 && world.adp > 0) {
        const flow = Math.min(world.lumenH, config.dt * (1.5 + world.lumenH * 0.11));
        world.lumenH -= flow;
        world.stromaH += flow * 0.65;
        world.rotor += flow * 1.85;
        world.protonRotor += flow;
        if (world.protonRotor >= 3) {
            world.protonRotor -= 3;
            world.atp += 1;
            world.adp = Math.max(0, world.adp - 1);
            world.pulseATP = 1;
            world.activeStep = 6;
            world.particles.push(makeParticle(config.nextId(), 'atp', '#10b981', 'ATP', 0));
        }
        if (flow > 0.05) {
            world.particles.push(makeParticle(config.nextId(), 'proton', '#fbbf24', 'H+', Math.random()));
        }
    }

    world.particles = world.particles
        .map((particle) => {
            const next = { ...particle, progress: particle.progress + config.dt / particle.life };
            const position = particlePosition(next);
            next.trail = [...next.trail.slice(-5), position];
            return next;
        })
        .filter((particle) => particle.progress < 1.05);
};

const spawnPhoton = (world: World, config: { wavelength: WavelengthMode; mode: FlowMode; nextId: () => number }) => {
    const meta = WAVELENGTHS[config.wavelength];
    world.particles.push(makeParticle(config.nextId(), 'photon', meta.color, `${meta.nm}`, Math.random()));
};

const triggerNoncyclicEvent = (world: World, nextId: () => number) => {
    world.pulsePS2 = 1;
    world.pulsePS1 = 1;
    world.pulseOEC = 1;
    world.activeStep = (world.activeStep % 5) + 1;
    world.waterElectrons += 1;
    world.lumenH += 1;
    world.stromaH = Math.max(0, world.stromaH - 0.35);
    world.particles.push(makeParticle(nextId(), 'noncyclic', '#38bdf8', 'e-', 0));
    world.particles.push(makeParticle(nextId(), 'oxygen', '#93c5fd', 'O2', Math.random()));
    if (world.waterElectrons >= 4) {
        world.waterElectrons = 0;
        world.oxygen += 1;
        world.lumenH += 3;
    }
    world.lumenH += 1;
    if (world.stromaH > 0) {
        world.stromaH -= 1;
        world.nadph += 1;
        world.pulseFNR = 1;
        world.particles.push(makeParticle(nextId(), 'nadph', '#22c55e', 'NADPH', 0));
    }
};

const triggerCyclicEvent = (world: World, nextId: () => number) => {
    world.pulsePS1 = 1;
    world.activeStep = world.activeStep === 6 ? 3 : Math.min(6, world.activeStep + 1);
    world.lumenH += 1.4;
    world.stromaH = Math.max(0, world.stromaH - 0.45);
    world.particles.push(makeParticle(nextId(), 'cyclic', '#38bdf8', 'e-', 0));
};

const makeParticle = (id: number, path: MovingDot['path'], color: string, label: string, offset: number): MovingDot => ({
    id,
    path,
    color,
    label,
    offset,
    progress: 0,
    life: path === 'photon' ? 0.8 : path === 'proton' ? 0.9 : path === 'atp' || path === 'nadph' ? 1.3 : 2.6,
    trail: [],
});

const drawWorld = (
    ctx: CanvasRenderingContext2D,
    world: World,
    config: { wavelength: WavelengthMode; mode: FlowMode; intensity: number; cf0Open: boolean; canRunNoncyclic: boolean; canRunCyclic: boolean },
) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx);
    drawChloroplastInset(ctx, config.mode);
    ctx.save();
    ctx.translate(W / 2, H / 2 + 4);
    ctx.scale(MAIN_APPARATUS_SCALE, MAIN_APPARATUS_SCALE);
    ctx.translate(-W / 2, -H / 2 - 4);
    drawThylakoid(ctx, world, config);
    world.particles.forEach((particle) => drawMovingParticle(ctx, particle));
    drawLabels(ctx, config, world);
    ctx.restore();
};

const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 40; x < W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    for (let y = 40; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }
    ctx.restore();
};

const drawChloroplastInset = (ctx: CanvasRenderingContext2D, mode: FlowMode) => {
    ctx.save();
    ctx.fillStyle = '#f0fdf4';
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2;
    roundRect(ctx, 72, 98, 170, 102, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#dcfce7';
    ctx.beginPath();
    ctx.ellipse(157, 149, 70, 32, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 4; i += 1) {
        const x = 112 + i * 26;
        ctx.fillStyle = mode === 'noncyclic' ? '#86efac' : '#bbf7d0';
        roundRect(ctx, x, 128, 18, 42, 6);
        ctx.fill();
        ctx.stroke();
    }
    ctx.strokeStyle = mode === 'cyclic' ? '#7c3aed' : '#16a34a';
    ctx.lineWidth = mode === 'cyclic' ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(110, 174);
    ctx.bezierCurveTo(148, 188, 170, 112, 210, 128);
    ctx.stroke();
    ctx.fillStyle = '#166534';
    ctx.font = '900 11px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mode === 'cyclic' ? 'Stroma lamellae active' : 'Grana thylakoids active', 157, 191);
    ctx.restore();
};

const drawThylakoid = (
    ctx: CanvasRenderingContext2D,
    world: World,
    config: { wavelength: WavelengthMode; mode: FlowMode; intensity: number; cf0Open: boolean },
) => {
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    roundRect(ctx, 290, 94, 850, 560, 32);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(219, 234, 254, 0.72)';
    roundRect(ctx, 324, 126, 782, 172, 24);
    ctx.fill();
    ctx.fillStyle = 'rgba(254, 243, 199, 0.72)';
    roundRect(ctx, 324, 428, 782, 172, 24);
    ctx.fill();

    const y = 342;
    const gradient = ctx.createLinearGradient(330, y - 46, 1110, y + 46);
    gradient.addColorStop(0, '#bbf7d0');
    gradient.addColorStop(0.5, '#86efac');
    gradient.addColorStop(1, '#bbf7d0');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;
    roundRect(ctx, 330, y - 48, 780, 96, 42);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(21, 128, 61, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(350, y - 18);
    ctx.lineTo(1088, y - 18);
    ctx.moveTo(350, y + 18);
    ctx.lineTo(1088, y + 18);
    ctx.stroke();

    drawPhotosystem(ctx, 458, y, 'PS II', 'P680', '#f97316', world.pulsePS2, true);
    drawCarrier(ctx, 580, y + Math.sin(world.time * 2.2) * 9, 'PQ', '#f59e0b');
    drawComplex(ctx, 688, y, 'Cyt b6f', '#0ea5e9', world.pulsePS2 + world.pulsePS1);
    drawCarrier(ctx, 792, y - 32 + Math.cos(world.time * 2.2) * 8, 'PC', '#38bdf8');
    drawPhotosystem(ctx, 898, y, 'PS I', 'P700', '#dc2626', world.pulsePS1, false);
    drawFNR(ctx, 990, 218, world.pulseFNR);
    drawATPSynthase(ctx, 1046, y, config.cf0Open, world);
    drawOEC(ctx, 430, 426, world.pulseOEC);
    drawSun(ctx, 1050, 134, config.wavelength, config.intensity);

    ctx.restore();
};

const drawPhotosystem = (ctx: CanvasRenderingContext2D, x: number, y: number, name: string, center: string, color: string, pulse: number, hasOec: boolean) => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 + pulse * 24;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 56 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 12; i += 1) {
        const angle = i / 12 * Math.PI * 2 + (pulse * 0.15);
        const px = x + Math.cos(angle) * 43;
        const py = y + Math.sin(angle) * 43;
        ctx.fillStyle = ['#16a34a', '#84cc16', '#facc15', '#fb923c'][i % 4];
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.font = '900 16px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - 4);
    ctx.font = '900 13px Inter, Arial, sans-serif';
    ctx.fillText(center, x, y + 16);
    if (hasOec) {
        ctx.fillStyle = '#eff6ff';
        ctx.strokeStyle = '#2563eb';
        roundRect(ctx, x - 38, y + 58, 76, 30, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1d4ed8';
        ctx.font = '900 10px Inter, Arial, sans-serif';
        ctx.fillText('OEC', x, y + 78);
    }
    ctx.restore();
};

const drawCarrier = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) => {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, 30, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '900 14px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 5);
    ctx.restore();
};

const drawComplex = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string, pulse: number) => {
    ctx.save();
    ctx.fillStyle = '#ecfeff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    roundRect(ctx, x - 42, y - 52, 84, 104, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '900 13px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 4);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y - 34);
    ctx.lineTo(x, y + 34 + pulse * 5);
    ctx.stroke();
    ctx.fillStyle = '#d97706';
    ctx.fillText('H+', x + 24, y + 38);
    ctx.restore();
};

const drawFNR = (ctx: CanvasRenderingContext2D, x: number, y: number, pulse: number) => {
    ctx.save();
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = pulse * 20;
    ctx.fillStyle = '#dcfce7';
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 3;
    roundRect(ctx, x - 48, y - 24, 96, 48, 14);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#166534';
    ctx.font = '900 12px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FNR', x, y - 2);
    ctx.font = '800 10px Inter, Arial, sans-serif';
    ctx.fillText('NADP+ -> NADPH', x, y + 14);
    ctx.restore();
};

const drawATPSynthase = (ctx: CanvasRenderingContext2D, x: number, y: number, open: boolean, world: World) => {
    ctx.save();
    ctx.fillStyle = open ? '#ddd6fe' : '#f1f5f9';
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 3;
    roundRect(ctx, x - 18, y - 56, 36, 112, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7c3aed';
    ctx.font = '900 11px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CF0', x, y + 6);
    ctx.fillText(open ? 'open' : 'closed', x, y + 24);

    ctx.translate(x, y - 92);
    ctx.rotate(world.rotor);
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = world.pulseATP * 22;
    for (let i = 0; i < 3; i += 1) {
        const angle = i * Math.PI * 2 / 3;
        ctx.fillStyle = ['#fbbf24', '#34d399', '#f87171'][i];
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 23, Math.sin(angle) * 23, 19, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4c1d95';
    ctx.font = '900 11px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CF1', 0, 4);
    ctx.restore();
};

const drawOEC = (ctx: CanvasRenderingContext2D, x: number, y: number, pulse: number) => {
    ctx.save();
    ctx.shadowColor = '#2563eb';
    ctx.shadowBlur = pulse * 18;
    ctx.fillStyle = '#dbeafe';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    roundRect(ctx, x - 84, y, 168, 46, 14);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '900 11px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OEC: water splitting', x, y + 17);
    ctx.fillText('2H2O -> 4H+ + O2 + 4e-', x, y + 33);
    ctx.restore();
};

const drawSun = (ctx: CanvasRenderingContext2D, x: number, y: number, wavelength: WavelengthMode, intensity: number) => {
    const meta = WAVELENGTHS[wavelength];
    ctx.save();
    ctx.shadowColor = meta.color;
    ctx.shadowBlur = 14 + intensity * 0.08;
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#92400e';
    ctx.font = '900 12px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${meta.nm} nm`, x, y + 46);
    ctx.restore();
};

const drawLabels = (
    ctx: CanvasRenderingContext2D,
    config: { wavelength: WavelengthMode; mode: FlowMode; intensity: number; cf0Open: boolean },
    world: World,
) => {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 18px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Thylakoid membrane light reaction', 310, 72);
    ctx.font = '700 12px Inter, Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${WAVELENGTHS[config.wavelength].label} nm - ${config.mode === 'cyclic' ? 'cyclic PS I flow' : 'non-cyclic PS II -> PS I flow'}`, 310, 94);
    ctx.font = '900 15px Inter, Arial, sans-serif';
    ctx.fillStyle = '#1d4ed8';
    ctx.fillText('STROMA: Fd, FNR, CF1, NADP+ reduction, Calvin cycle uses ATP + NADPH', 352, 152);
    ctx.fillStyle = '#166534';
    ctx.fillText('THYLAKOID MEMBRANE: PS II -> PQ -> Cyt b6f -> PC -> PS I -> Fd', 352, 282);
    ctx.fillStyle = '#92400e';
    ctx.fillText('LUMEN: H+ accumulates; proton gradient lowers pH', 352, 512);
    ctx.fillStyle = '#64748b';
    ctx.font = '900 12px Inter, Arial, sans-serif';
    ctx.fillText('O2 diffuses out; ATP + NADPH move to the stroma for carbon fixation.', 392, 630);
    ctx.fillStyle = world.lumenH >= 8 ? '#c2410c' : '#059669';
    ctx.font = '900 22px Inter, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`lumen pH ${lumenPH(world.lumenH).toFixed(1)}`, 1080, 546);
    ctx.restore();
};

const drawMovingParticle = (ctx: CanvasRenderingContext2D, particle: MovingDot) => {
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
    ctx.shadowBlur = particle.path === 'photon' ? 14 : 8;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, particle.path === 'photon' ? 5 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = particle.path === 'photon' ? particle.color : '#ffffff';
    ctx.font = '900 7px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    if (particle.path !== 'photon') ctx.fillText(particle.label, pos.x, pos.y + 2.5);
    ctx.restore();
};

const particlePosition = (particle: MovingDot) => {
    const t = clamp(particle.progress, 0, 1);
    if (particle.path === 'noncyclic') {
        return bezierPath(t, [
            { x: 458, y: 342 },
            { x: 458, y: 250 },
            { x: 580, y: 322 },
            { x: 688, y: 340 },
            { x: 792, y: 310 },
            { x: 898, y: 342 },
            { x: 898, y: 244 },
            { x: 990, y: 218 },
        ]);
    }
    if (particle.path === 'cyclic') {
        const a = t * Math.PI * 2 + particle.offset;
        return { x: 898 + Math.cos(a) * 112, y: 290 + Math.sin(a) * 58 };
    }
    if (particle.path === 'proton') return { x: 1046 + Math.sin(t * Math.PI) * 16, y: 510 - t * 150 };
    if (particle.path === 'oxygen') return { x: 410 + particle.offset * 90, y: 514 - t * 80 };
    if (particle.path === 'nadph') return { x: 990 + t * 72, y: 208 - t * 34 };
    if (particle.path === 'atp') return { x: 1046 + t * 70, y: 252 - t * 58 };
    return { x: 1080 - t * 250, y: 134 + particle.offset * 44 };
};

const bezierPath = (t: number, points: Array<{ x: number; y: number }>) => {
    const scaled = t * (points.length - 1);
    const index = Math.min(points.length - 2, Math.floor(scaled));
    const local = scaled - index;
    const start = points[index];
    const end = points[index + 1];
    return {
        x: start.x + (end.x - start.x) * local,
        y: start.y + (end.y - start.y) * local,
    };
};

const lumenPH = (lumenH: number) => clamp(7 - lumenH * 0.16, 4.2, 7);

const AbsorptionCard: React.FC<{ wavelength: WavelengthMode }> = ({ wavelength }) => {
    const nm = WAVELENGTHS[wavelength].nm;
    const x = 34 + ((nm - 400) / 320) * 220;
    return (
        <AsideCard title="NCERT Fig 11.3(a-c)" subtitle="Pigment absorption and action" icon={<Sun size={15} className="text-amber-700" />}>
            <svg viewBox="0 0 282 176" className="h-[176px] w-full">
                <line x1="34" y1="142" x2="258" y2="142" stroke="#475569" strokeWidth="2" />
                <line x1="34" y1="142" x2="34" y2="24" stroke="#475569" strokeWidth="2" />
                <path d="M34 128 C58 42 82 34 112 120 C148 150 200 50 258 72" fill="none" stroke="#16a34a" strokeWidth="3" />
                <path d="M34 136 C72 54 104 64 126 110 C158 130 204 82 236 118" fill="none" stroke="#84cc16" strokeWidth="3" />
                <path d="M44 118 C82 72 120 68 160 118" fill="none" stroke="#f59e0b" strokeWidth="3" />
                <path d="M34 126 C62 50 100 42 124 110 C166 150 210 62 252 86" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="5 5" />
                <line x1={x} y1="24" x2={x} y2="142" stroke={WAVELENGTHS[wavelength].color} strokeWidth="3" strokeDasharray="6 5" />
                <circle cx={x} cy="34" r="6" fill={WAVELENGTHS[wavelength].color} />
                <text x="35" y="160" fontSize="10" fontWeight="900" fill="#475569">400</text>
                <text x="138" y="160" fontSize="10" fontWeight="900" fill="#475569">550</text>
                <text x="238" y="160" fontSize="10" fontWeight="900" fill="#475569">700 nm</text>
                <text x="54" y="34" fontSize="9" fontWeight="900" fill="#16a34a">chl a</text>
                <text x="86" y="55" fontSize="9" fontWeight="900" fill="#84cc16">chl b</text>
                <text x="120" y="86" fontSize="9" fontWeight="900" fill="#f59e0b">carot.</text>
                <text x="176" y="34" fontSize="9" fontWeight="900" fill="#dc2626">action</text>
            </svg>
        </AsideCard>
    );
};

const ZSchemeCard: React.FC<{ mode: FlowMode; activeStep: number }> = ({ mode, activeStep }) => {
    const dotX = activeStep <= 2 ? 66 : activeStep === 3 ? 130 : activeStep === 4 ? 196 : 234;
    const dotY = activeStep <= 2 ? 48 : activeStep === 3 ? 104 : activeStep === 4 ? 54 : 92;
    return (
        <AsideCard title="NCERT Fig 11.5" subtitle="Z-scheme redox path" icon={<Zap size={15} className="text-cyan-700" />}>
            <svg viewBox="0 0 282 166" className="h-[166px] w-full">
                <line x1="34" y1="136" x2="258" y2="136" stroke="#475569" strokeWidth="2" />
                <line x1="34" y1="136" x2="34" y2="22" stroke="#475569" strokeWidth="2" />
                <text x="10" y="54" fontSize="9" fontWeight="900" fill="#475569" transform="rotate(-90 10 54)">redox potential</text>
                {mode === 'noncyclic' ? (
                    <polyline points="52,120 68,44 120,108 176,108 196,48 238,96" fill="none" stroke="#0891b2" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
                ) : (
                    <path d="M174 112 C224 84 226 40 186 42 C142 46 134 92 174 112" fill="none" stroke="#7c3aed" strokeWidth="4" />
                )}
                <circle cx={dotX} cy={dotY} r="7" fill={mode === 'noncyclic' ? '#0891b2' : '#7c3aed'} stroke="#ffffff" strokeWidth="3" />
                <text x="46" y="150" fontSize="9" fontWeight="900" fill="#475569">H2O</text>
                <text x="56" y="38" fontSize="9" fontWeight="900" fill="#f97316">P680*</text>
                <text x="108" y="124" fontSize="9" fontWeight="900" fill="#475569">PQ/Cyt</text>
                <text x="176" y="38" fontSize="9" fontWeight="900" fill="#dc2626">P700*</text>
                <text x="224" y="112" fontSize="9" fontWeight="900" fill="#16a34a">NADP+</text>
                <text x="50" y="18" fontSize="10" fontWeight="900" fill="#64748b">negative up</text>
            </svg>
        </AsideCard>
    );
};

const ProductMeterCard: React.FC<{ snapshot: Snapshot }> = ({ snapshot }) => {
    return (
        <AsideCard title="Products" subtitle="Light reaction output" icon={<Gauge size={15} className="text-violet-700" />}>
            <div className="space-y-2">
                <Meter label="ATP" value={snapshot.atp} max={12} color="#7c3aed" />
                <Meter label="NADPH" value={snapshot.nadph} max={12} color="#16a34a" />
                <Meter label="O2" value={snapshot.oxygen} max={8} color="#2563eb" />
                <div className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-xs font-bold text-slate-700">
                    {snapshot.mode === 'cyclic' ? 'Cyclic: ATP only, no O2/NADPH.' : 'Non-cyclic: ATP + NADPH + O2.'}
                </div>
            </div>
        </AsideCard>
    );
};

const Meter: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
    <div>
        <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-600">
            <span>{label}</span>
            <span style={{ color }}>{value}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, value / max * 100)}%`, background: color }} />
        </div>
    </div>
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

const ValueRow: React.FC<{ label: string; value: string; tint: string; color: string }> = ({ label, value, tint, color }) => (
    <div className="rounded-lg border border-slate-100 px-3 py-2.5" style={{ background: tint }}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 break-words font-mono text-sm font-extrabold" style={{ color }}>{value}</div>
    </div>
);

const MiniFact: React.FC<{ color: string; text: string }> = ({ color, text }) => (
    <div className="flex gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
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

const SliderControl: React.FC<{ label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }> = ({ label, value, min, max, step, suffix = '', onChange }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-600">{label}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-black text-slate-700">{value}{suffix}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full accent-amber-600"
        />
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
        className="min-h-[32px] w-full rounded-lg border px-2.5 py-1.5 text-xs font-black transition-colors"
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default PhotosynthesisLightReactionLab;
