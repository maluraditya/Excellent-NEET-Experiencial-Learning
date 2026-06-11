import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Atom,
    BatteryCharging,
    Beaker,
    Droplets,
    Layers,
    Microscope,
    Pause,
    Play,
    RotateCcw,
    Shuffle,
    Tag,
    Waves,
    Zap
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface CellMembraneLabProps { topic: any; onExit: () => void }

type TransportMode = 'simple' | 'osmosis' | 'facilitated' | 'channel' | 'active';
type ParticleKind = 'o2' | 'co2' | 'h2o' | 'glucose' | 'amino' | 'na' | 'k' | 'cl' | 'nak';
type Side = 'outside' | 'inside';

interface Particle {
    id: number;
    kind: ParticleKind;
    side: Side;
    x: number;
    y: number;
    vx: number;
    vy: number;
    trail: Array<{ x: number; y: number }>;
    flash: number;
    bound: number;
}

const W = 1280;
const H = 760;
const OUT_TOP = 82;
const OUT_BOTTOM = 292;
const IN_TOP = 468;
const IN_BOTTOM = 720;
const BILAYER_TOP = 300;
const BILAYER_BOTTOM = 460;

const MODES: Array<{ id: TransportMode; label: string; color: string }> = [
    { id: 'simple', label: 'Simple Diffusion', color: '#16a34a' },
    { id: 'osmosis', label: 'Osmosis', color: '#0891b2' },
    { id: 'facilitated', label: 'Facilitated', color: '#4f46e5' },
    { id: 'channel', label: 'Channel', color: '#0284c7' },
    { id: 'active', label: 'Active Pump', color: '#7c3aed' },
];

const PARTICLES: Record<ParticleKind, { label: string; short: string; color: string; radius: number; group: string }> = {
    o2: { label: 'O2', short: 'neutral', color: '#22c55e', radius: 8, group: 'neutral' },
    co2: { label: 'CO2', short: 'neutral', color: '#16a34a', radius: 8, group: 'neutral' },
    h2o: { label: 'H2O', short: 'water', color: '#38bdf8', radius: 7, group: 'water' },
    glucose: { label: 'Glucose', short: 'polar', color: '#ec4899', radius: 11, group: 'polar' },
    amino: { label: 'Amino acid', short: 'polar', color: '#db2777', radius: 11, group: 'polar' },
    na: { label: 'Na+', short: 'ion', color: '#f59e0b', radius: 10, group: 'ion' },
    k: { label: 'K+', short: 'ion', color: '#a855f7', radius: 10, group: 'ion' },
    cl: { label: 'Cl-', short: 'ion', color: '#64748b', radius: 10, group: 'ion' },
    nak: { label: 'Na+/K+ pair', short: 'pump pair', color: '#7c3aed', radius: 10, group: 'pump' },
};

const modeLabels: Record<TransportMode, string> = {
    simple: 'Simple diffusion',
    osmosis: 'Osmosis',
    facilitated: 'Facilitated diffusion',
    channel: 'Ion channel',
    active: 'Active transport',
};

const particleOptions: Record<TransportMode, ParticleKind[]> = {
    simple: ['o2', 'co2'],
    osmosis: ['h2o'],
    facilitated: ['glucose', 'amino'],
    channel: ['na', 'k', 'cl'],
    active: ['nak'],
};

const narration: Record<TransportMode, string> = {
    simple: 'Neutral solutes move along the concentration gradient directly across the lipid bilayer. No energy required.',
    osmosis: 'Water diffuses across a selectively permeable membrane from higher to lower water concentration.',
    facilitated: 'Polar molecules cannot cross the nonpolar core. A carrier protein binds and ferries them down the gradient. No ATP.',
    channel: 'Selective channel proteins form pores; ions diffuse through them passively down the electrochemical gradient.',
    active: 'Against the gradient and ATP-driven. The Na+/K+ pump moves 3 Na+ out for 2 K+ in per ATP.',
};

const CellMembraneLab: React.FC<CellMembraneLabProps> = ({ topic, onExit }) => {
    const frameRef = useRef<number | null>(null);
    const lastRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const nextIdRef = useRef(1);
    const pumpClockRef = useRef(0);
    const calloutRef = useRef(0);

    const [mode, setMode] = useState<TransportMode>('simple');
    const [particleKind, setParticleKind] = useState<ParticleKind>('o2');
    const [outsideConcentration, setOutsideConcentration] = useState(12);
    const [insideConcentration, setInsideConcentration] = useState(4);
    const [fluidity, setFluidity] = useState(55);
    const [speed, setSpeed] = useState(1);
    const [atp, setAtp] = useState(4);
    const [atpUsed, setAtpUsed] = useState(0);
    const [labels, setLabels] = useState(true);
    const [playing, setPlaying] = useState(true);
    const [time, setTime] = useState(0);
    const [live, setLive] = useState({
        outside: outsideConcentration,
        inside: insideConcentration,
        direction: 'Outside -> Inside',
    });

    const activeParticle = PARTICLES[particleKind];

    const resetParticles = useCallback((kind: ParticleKind, outside: number, inside: number) => {
        const created: Particle[] = [];
        const make = (side: Side, count: number, actualKind: ParticleKind) => {
            const top = side === 'outside' ? OUT_TOP + 28 : IN_TOP + 28;
            const bottom = side === 'outside' ? OUT_BOTTOM - 22 : IN_BOTTOM - 22;
            for (let i = 0; i < count; i += 1) {
                created.push({
                    id: nextIdRef.current++,
                    kind: actualKind,
                    side,
                    x: 110 + Math.random() * 1040,
                    y: top + Math.random() * (bottom - top),
                    vx: (Math.random() - 0.5) * 44,
                    vy: (Math.random() - 0.5) * 38,
                    trail: [],
                    flash: 0,
                    bound: 0,
                });
            }
        };

        if (kind === 'nak') {
            make('inside', Math.max(3, inside), 'na');
            make('outside', Math.max(2, outside), 'k');
        } else {
            make('outside', outside, kind);
            make('inside', inside, kind);
        }
        particlesRef.current = created;
        setLive(makeLive(created, mode, atp, atpUsed));
    }, [atp, atpUsed, mode]);

    const resetLab = useCallback(() => {
        setMode('simple');
        setParticleKind('o2');
        setOutsideConcentration(12);
        setInsideConcentration(4);
        setFluidity(55);
        setSpeed(1);
        setAtp(4);
        setAtpUsed(0);
        setLabels(true);
        setPlaying(true);
        setTime(0);
        pumpClockRef.current = 0;
        calloutRef.current = 1.4;
        resetParticles('o2', 12, 4);
    }, [resetParticles]);

    useEffect(() => {
        resetParticles(particleKind, outsideConcentration, insideConcentration);
        calloutRef.current = 1.4;
    }, [insideConcentration, outsideConcentration, particleKind, resetParticles]);

    useEffect(() => {
        const options = particleOptions[mode];
        const nextParticle = options.includes(particleKind) ? particleKind : options[0];
        if (nextParticle !== particleKind) setParticleKind(nextParticle);
        calloutRef.current = 1.4;
    }, [mode, particleKind]);

    const updateParticles = useCallback((dt: number) => {
        const particles = particlesRef.current;
        const canUseAtp = mode === 'active' && atp > 0;
        const pumpCycle = mode === 'active' && canUseAtp;

        if (pumpCycle) {
            pumpClockRef.current += dt * speed;
            if (pumpClockRef.current > 0.8) {
                pumpClockRef.current = 0;
                setAtp((value) => Math.max(0, value - 1));
                setAtpUsed((value) => value + 1);
            }
        }

        for (const p of particles) {
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 6) p.trail.shift();

            const jitter = 16 * speed;
            p.vx += (Math.random() - 0.5) * jitter * dt;
            p.vy += (Math.random() - 0.5) * jitter * dt;
            p.vx = clamp(p.vx, -80, 80);
            p.vy = clamp(p.vy, -75, 75);

            if (mode === 'active') {
                if (p.kind === 'na') {
                    p.vy -= 34 * dt * (canUseAtp ? 1 : 0.2);
                    p.x += (640 - p.x) * 0.25 * dt;
                }
                if (p.kind === 'k') {
                    p.vy += 34 * dt * (canUseAtp ? 1 : 0.2);
                    p.x += (640 - p.x) * 0.25 * dt;
                }
            }

            p.x += p.vx * dt * speed;
            p.y += p.vy * dt * speed;

            if (p.x < 82 || p.x > 1198) p.vx *= -1;
            p.x = clamp(p.x, 82, 1198);

            const top = p.side === 'outside' ? OUT_TOP + 22 : IN_TOP + 22;
            const bottom = p.side === 'outside' ? OUT_BOTTOM - 18 : IN_BOTTOM - 18;
            if (p.y < top) {
                p.y = top;
                p.vy = Math.abs(p.vy);
            }
            if (p.y > bottom) {
                p.y = bottom;
                p.vy = -Math.abs(p.vy);
            }

            const movingDown = p.side === 'outside' && p.y > OUT_BOTTOM - 34;
            const movingUp = p.side === 'inside' && p.y < IN_TOP + 34;
            if (movingDown || movingUp) {
                const allowed = allowsCrossing(mode, p.kind, p.side, outsideConcentration, insideConcentration, canUseAtp);
                if (allowed && nearProteinPath(mode, p.x, p.kind)) {
                    p.side = p.side === 'outside' ? 'inside' : 'outside';
                    p.y = p.side === 'inside' ? IN_TOP + 30 : OUT_BOTTOM - 30;
                    p.vy *= 0.6;
                    p.bound = 0.5;
                } else if (allowed && mode === 'simple') {
                    p.side = p.side === 'outside' ? 'inside' : 'outside';
                    p.y = p.side === 'inside' ? IN_TOP + 28 : OUT_BOTTOM - 28;
                    p.bound = 0.25;
                } else if (allowed && mode === 'osmosis') {
                    p.side = p.side === 'outside' ? 'inside' : 'outside';
                    p.y = p.side === 'inside' ? IN_TOP + 28 : OUT_BOTTOM - 28;
                    p.bound = 0.25;
                } else {
                    p.vy *= -1;
                    p.flash = 0.25;
                }
            }

            p.flash = Math.max(0, p.flash - dt);
            p.bound = Math.max(0, p.bound - dt);
        }

        setLive(makeLive(particles, mode, atp, atpUsed));
    }, [atp, atpUsed, insideConcentration, mode, outsideConcentration, speed]);

    useEffect(() => {
        resetParticles('o2', 12, 4);
    }, []);

    useEffect(() => {
        const animate = (stamp: number) => {
            if (lastRef.current === null) lastRef.current = stamp;
            const dt = Math.min(0.1, (stamp - lastRef.current) / 1000);
            lastRef.current = stamp;
            if (playing) {
                updateParticles(dt);
                setTime((value) => value + dt * speed);
                calloutRef.current = Math.max(0, calloutRef.current - dt);
            }
            frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [playing, speed, updateParticles]);

    const netDirection = live.direction;
    const energyText = mode === 'active' ? `Active · ${atpUsed} ATP used` : 'Passive · no ATP';

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+12px)] top-0 bottom-0 z-20 hidden w-[300px] overflow-y-auto overflow-x-hidden pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <AsideCard title="NCERT Fig 8.4" subtitle="Fluid mosaic model">
                    <MiniMembraneFigure />
                </AsideCard>
                <AsideCard title="Composition (RBC)" subtitle="NCERT Sec 8.5.1 p.93">
                    <CompositionFigure />
                </AsideCard>
                <AsideCard title="Passive vs Active" subtitle="energy comparison">
                    <EnergyFigure active={mode === 'active'} />
                </AsideCard>
                <AsideCard title="Na+/K+ Pump" subtitle="NCERT Sec 18.2">
                    <PumpFigure active={mode === 'active'} />
                </AsideCard>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+12px)] top-0 bottom-0 z-20 hidden w-[300px] overflow-y-auto overflow-x-hidden pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-teal-200 bg-teal-50/95 p-4 text-teal-950 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-teal-900">Plasma membrane</div>
                    <div className="mt-0.5 text-xs font-semibold text-teal-700">NCERT Ch 8 · Sec 8.5.1</div>
                    <p className="mt-3 text-sm font-semibold leading-snug text-teal-900">{narration[mode]}</p>
                    <div className="mt-3 text-xs font-bold uppercase tracking-wide text-teal-700">Fluidity matters for</div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-teal-900">
                        {['cell growth', 'junctions', 'secretion', 'endocytosis', 'cell division'].map((item) => (
                            <span key={item} className="rounded-full border border-teal-200 bg-white px-2 py-1">{item}</span>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
                        </span>
                    </div>
                    <div className="grid gap-2">
                        <ValueRow label="Mode" value={modeLabels[mode]} tone="slate" />
                        <ValueRow label="Particle" value={`${activeParticle.label} · ${activeParticle.short}`} tone={particleTone(activeParticle.group)} />
                        <ValueRow label="Outside count" value={`${live.outside}`} tone="sky" />
                        <ValueRow label="Inside count" value={`${live.inside}`} tone="emerald" />
                        <ValueRow label="Net flow direction" value={netDirection} tone="amber" />
                        <ValueRow label="Energy" value={energyText} tone="violet" />
                        <ValueRow label="ATP available" value={mode === 'active' ? `${atp} units` : 'not used'} tone="amber" />
                        <ValueRow label="Composition (RBC)" value="52% protein · 40% lipid" tone="slate" />
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg viewBox="0 0 1280 760" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full">
                    <MembraneScene
                        mode={mode}
                        particleKind={particleKind}
                        particles={particlesRef.current}
                        outside={live.outside}
                        inside={live.inside}
                        fluidity={fluidity}
                        time={time}
                        labels={labels}
                        calloutVisible={calloutRef.current > 0}
                        atp={atp}
                        netDirection={netDirection}
                    />
                </svg>
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
        <div className="flex h-full min-h-0 flex-col gap-3 text-slate-900">
            <div className="flex shrink-0 items-center gap-2 text-sm font-extrabold text-slate-900">
                <Layers size={16} className="text-teal-700" />
                Plasma Membrane Bench
            </div>

            <div className="grid min-h-0 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <ControlGroup title="Transport Mode" icon={<Shuffle size={14} />}>
                    <div className="grid grid-cols-2 gap-1.5">
                        {MODES.map((item) => (
                            <SegmentButton
                                key={item.id}
                                active={mode === item.id}
                                label={item.label}
                                color={item.color}
                                onClick={() => setMode(item.id)}
                            />
                        ))}
                    </div>
                </ControlGroup>

                <ControlGroup title="Particle Selector" icon={<Atom size={14} />}>
                    <div className="grid grid-cols-2 gap-1.5">
                        {particleOptions[mode].map((kind) => (
                            <SegmentButton
                                key={kind}
                                active={particleKind === kind}
                                label={PARTICLES[kind].label}
                                color={PARTICLES[kind].color}
                                onClick={() => setParticleKind(kind)}
                            />
                        ))}
                    </div>
                </ControlGroup>

                <ControlGroup title="Concentration" icon={<Beaker size={14} />}>
                    <RangeControl label="Outside concentration" min={0} max={20} value={outsideConcentration} onChange={setOutsideConcentration} accent="accent-sky-600" />
                    <RangeControl label="Inside concentration" min={0} max={20} value={insideConcentration} onChange={setInsideConcentration} accent="accent-emerald-600" />
                </ControlGroup>

                <ControlGroup title="Animation" icon={<Waves size={14} />}>
                    <RangeControl label="Fluidity" min={0} max={100} value={fluidity} onChange={setFluidity} accent="accent-teal-600" />
                    <RangeControl label={`Speed ${speed.toFixed(2)}x`} min={0.25} max={2} step={0.25} value={speed} onChange={setSpeed} accent="accent-violet-600" />
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                        <button
                            type="button"
                            onClick={() => setAtp((value) => Math.min(8, value + 1))}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2 text-xs font-extrabold text-amber-900 transition-colors hover:bg-amber-100"
                        >
                            <BatteryCharging size={13} /> ATP +1
                        </button>
                        <button
                            type="button"
                            onClick={() => setLabels((value) => !value)}
                            className={`min-h-9 rounded-lg border px-2 text-xs font-extrabold transition-colors ${labels ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                            Labels
                        </button>
                    </div>
                </ControlGroup>
            </div>

            <div className="shrink-0 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-extrabold text-teal-800">
                Fig 8.4 · Singer & Nicolson, 1972
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
            controlsAreaFlex="0 0 clamp(220px, 30%, 278px)"
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1320px)] overflow-y-auto overscroll-contain bg-white border border-slate-200 shadow-2xl rounded-2xl p-4"
            contentToggleClassName="bg-white text-teal-700 border border-teal-200 hover:bg-teal-50"
        />
    );
};

const MembraneScene = ({
    mode,
    particleKind,
    particles,
    outside,
    inside,
    fluidity,
    time,
    labels,
    calloutVisible,
    atp,
    netDirection,
}: {
    mode: TransportMode;
    particleKind: ParticleKind;
    particles: Particle[];
    outside: number;
    inside: number;
    fluidity: number;
    time: number;
    labels: boolean;
    calloutVisible: boolean;
    atp: number;
    netDirection: string;
}) => {
    const proteinDrift = (index: number) => Math.sin(time * 0.55 + index * 1.7) * (fluidity / 4);
    const channelMode = mode === 'channel';
    const carrierMode = mode === 'facilitated';
    const pumpMode = mode === 'active';

    return (
        <g>
            <rect width={W} height={H} fill="#ffffff" />
            <Grid />
            <text x="40" y="30" fill="#0f172a" fontSize="18" fontWeight="900" fontStyle="italic">
                Plasma membrane · NCERT Ch 8 · Fig 8.4 (Singer & Nicolson, 1972)
            </text>
            <text x="40" y="58" fill="#64748b" fontSize="12" fontWeight="700">
                {modeLabels[mode]} · active particle: {PARTICLES[particleKind].label}
            </text>

            <rect x="0" y={OUT_TOP} width={W} height={OUT_BOTTOM - OUT_TOP} fill="#eff6ff" />
            <rect x="0" y={IN_TOP} width={W} height={IN_BOTTOM - IN_TOP} fill="#ecfdf5" />
            <text x="42" y="112" fill="#1d4ed8" fontSize="15" fontWeight="900">EXTRACELLULAR · aqueous</text>
            <text x="42" y="700" fill="#047857" fontSize="15" fontWeight="900">CYTOPLASM · aqueous</text>

            <TallyPill x={42} y={128} label={`Outside: ${outside} ${PARTICLES[particleKind].label}`} color="#1d4ed8" />
            <TallyPill x={42} y={664} label={`Inside: ${inside} ${PARTICLES[particleKind].label}`} color="#047857" />
            <GradientHint mode={mode} direction={netDirection} />

            <rect x="0" y={BILAYER_TOP} width={W} height={BILAYER_BOTTOM - BILAYER_TOP} fill="#f8fafc" />
            <rect x="98" y="374" width="1084" height="14" rx="7" fill="#334155" opacity="0.15" />

            <Phospholipids time={time} fluidity={fluidity} />
            <CholesterolLabels labels={labels} />
            <Proteins
                mode={mode}
                time={time}
                drift={proteinDrift}
                labels={labels}
                channelMode={channelMode}
                carrierMode={carrierMode}
                pumpMode={pumpMode}
                atp={atp}
            />
            <PeripheralProtein labels={labels} />

            {particles.map((p) => <ParticleGlyph key={p.id} particle={p} />)}

            {labels && (
                <g>
                    <LabelLine x1={176} y1={318} x2={88} y2={260} label="Phospholipid bilayer" color="#0369a1" />
                    <LabelLine x1={706} y1={312} x2={812} y2={242} label="carbohydrate (sugar)" color="#b45309" />
                    <LabelLine x1={500} y1={300} x2={418} y2={226} label="peripheral protein" color="#be123c" />
                    <LabelLine x1={644} y1={384} x2={758} y2={520} label="integral protein" color="#4f46e5" />
                </g>
            )}

            {calloutVisible && (
                <g>
                    <rect x="42" y="724" width="314" height="26" rx="13" fill="#ffffff" stroke="#14b8a6" strokeWidth="2" />
                    <text x="58" y="742" fill="#0f766e" fontSize="12" fontWeight="900">NCERT Fig 8.4 · Fluid mosaic model</text>
                </g>
            )}
        </g>
    );
};

const Phospholipids = ({ time, fluidity }: { time: number; fluidity: number }) => (
    <g>
        {Array.from({ length: 26 }).map((_, index) => {
            const x = 108 + index * 42;
            const wobble = Math.sin(time * 0.6 + index * 0.4) * (fluidity / 30);
            return (
                <g key={`p-top-${index}`}>
                    <line x1={x - 5} y1={324 + wobble} x2={x - 13} y2={378 + wobble} stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                    <line x1={x + 5} y1={324 + wobble} x2={x + 13} y2={378 + wobble} stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                    <circle cx={x} cy={308 + wobble} r="14" fill="#38bdf8" stroke="#0369a1" strokeWidth="2" />
                </g>
            );
        })}
        {Array.from({ length: 26 }).map((_, index) => {
            const x = 108 + index * 42;
            const wobble = Math.sin(time * 0.6 + index * 0.4 + 1.8) * (fluidity / 30);
            return (
                <g key={`p-bottom-${index}`}>
                    <line x1={x - 5} y1={436 + wobble} x2={x - 13} y2={382 + wobble} stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                    <line x1={x + 5} y1={436 + wobble} x2={x + 13} y2={382 + wobble} stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                    <circle cx={x} cy={452 + wobble} r="14" fill="#38bdf8" stroke="#0369a1" strokeWidth="2" />
                </g>
            );
        })}
    </g>
);

const cholesterolPositions = [
    { x: 230, y: 354 }, { x: 362, y: 408 }, { x: 506, y: 352 }, { x: 804, y: 405 },
    { x: 914, y: 350 }, { x: 1042, y: 406 }, { x: 1120, y: 356 },
];

const CholesterolLabels = ({ labels }: { labels: boolean }) => (
    <g>
        {cholesterolPositions.map((item, index) => (
            <g key={index} transform={`translate(${item.x} ${item.y})`}>
                {[0, 1, 2, 3].map((row) => (
                    <rect key={row} x={row * 7} y={row % 2 === 0 ? 0 : 8} width="9" height="8" rx="2" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
                ))}
            </g>
        ))}
        {labels && <LabelLine x1={934} y1={356} x2={1026} y2={262} label="cholesterol" color="#b45309" />}
    </g>
);

const Proteins = ({
    mode,
    time,
    drift,
    labels,
    channelMode,
    carrierMode,
    pumpMode,
    atp,
}: {
    mode: TransportMode;
    time: number;
    drift: (index: number) => number;
    labels: boolean;
    channelMode: boolean;
    carrierMode: boolean;
    pumpMode: boolean;
    atp: number;
}) => {
    const bases = [320, 640, 960];
    return (
        <g>
            {bases.map((base, index) => {
                const x = base + drift(index);
                const active = index === 1;
                const color = pumpMode && active ? '#7c3aed' : carrierMode && active ? '#6366f1' : channelMode && active ? '#2563eb' : '#94a3b8';
                const flip = carrierMode && active ? Math.sin(time * 5) * 10 : 0;
                return (
                    <g key={base} transform={`translate(${x} 0)`}>
                        <path d={`M-42 296 C-70 330 -70 430 -42 464 L42 464 C70 430 70 330 42 296 Z`} fill={color} opacity={active ? 0.95 : 0.68} stroke="#312e81" strokeWidth="3" />
                        <ellipse cx={flip} cy="380" rx={channelMode && active ? 15 : 22} ry="64" fill="#ffffff" opacity={channelMode && active ? 0.86 : 0.32} />
                        {pumpMode && active && (
                            <g>
                                <circle cx="56" cy="380" r="16" fill={atp > 0 ? '#fbbf24' : '#fee2e2'} stroke="#b45309" strokeWidth="2" />
                                <text x="56" y="384" textAnchor="middle" fill="#92400e" fontSize="9" fontWeight="900">ATP</text>
                            </g>
                        )}
                        {active && labels && (
                            <text x="0" y="486" textAnchor="middle" fill="#312e81" fontSize="12" fontWeight="900">
                                {mode === 'channel' ? 'channel pore' : mode === 'facilitated' ? 'carrier protein' : mode === 'active' ? 'Na+/K+ pump' : 'integral protein'}
                            </text>
                        )}
                        {[0, 1, 2].map((branch) => active && (
                            <g key={branch} transform={`translate(${-20 + branch * 20} 286)`}>
                                <line x1="0" y1="0" x2="0" y2="-28" stroke="#b45309" strokeWidth="2" />
                                <circle cx="-8" cy="-34" r="6" fill="#fde68a" stroke="#d97706" />
                                <circle cx="8" cy="-44" r="6" fill="#fde68a" stroke="#d97706" />
                            </g>
                        ))}
                    </g>
                );
            })}
        </g>
    );
};

const PeripheralProtein = ({ labels }: { labels: boolean }) => (
    <g>
        <path d="M440 294 C456 268 493 268 509 292 C529 292 544 310 532 330 C516 354 462 354 438 332 C425 320 428 304 440 294Z" fill="#fb7185" stroke="#be123c" strokeWidth="3" />
        {labels && <text x="486" y="365" textAnchor="middle" fill="#be123c" fontSize="12" fontWeight="900">peripheral</text>}
    </g>
);

const ParticleGlyph: React.FC<{ particle: Particle }> = ({ particle }) => {
    const meta = PARTICLES[particle.kind];
    return (
        <g>
            {particle.trail.map((point, index) => (
                <circle key={index} cx={point.x} cy={point.y} r={meta.radius * 0.55} fill={meta.color} opacity={0.05 + index * 0.05} />
            ))}
            {particle.flash > 0 && (
                <circle cx={particle.x} cy={particle.y} r={18 * (1 - particle.flash / 0.25)} fill="none" stroke="#dc2626" strokeWidth="3" opacity={particle.flash / 0.25} />
            )}
            {particle.bound > 0 && (
                <circle cx={particle.x} cy={particle.y} r={meta.radius + 8} fill="none" stroke="#14b8a6" strokeWidth="2" opacity={particle.bound * 1.8} />
            )}
            <circle cx={particle.x} cy={particle.y} r={meta.radius} fill={meta.color} stroke="#0f172a" strokeWidth="1.4" />
            {(meta.group === 'ion' || particle.kind === 'na' || particle.kind === 'k' || particle.kind === 'cl') && (
                <text x={particle.x} y={particle.y + 4} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
                    {particle.kind === 'cl' ? '-' : '+'}
                </text>
            )}
            {particle.kind === 'h2o' && <text x={particle.x} y={particle.y + 3} textAnchor="middle" fill="#075985" fontSize="9" fontWeight="900">~</text>}
        </g>
    );
};

const GradientHint = ({ mode, direction }: { mode: TransportMode; direction: string }) => {
    if (mode === 'active') return null;
    const down = direction === 'Outside -> Inside';
    return (
        <g opacity="0.72">
            {[0, 1, 2].map((i) => (
                <line
                    key={i}
                    x1={78 + i * 24}
                    y1={down ? 218 : 542}
                    x2={78 + i * 24}
                    y2={down ? 520 : 250}
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="7 7"
                    markerEnd="url(#gradArrow)"
                />
            ))}
            <defs>
                <marker id="gradArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="#f59e0b" />
                </marker>
            </defs>
        </g>
    );
};

const TallyPill = ({ x, y, label, color }: { x: number; y: number; label: string; color: string }) => (
    <g>
        <rect x={x} y={y} width="164" height="28" rx="14" fill="#ffffff" stroke={color} strokeWidth="2" />
        <text x={x + 14} y={y + 18} fill={color} fontSize="12" fontWeight="900">{label}</text>
    </g>
);

const LabelLine = ({ x1, y1, x2, y2, label, color }: { x1: number; y1: number; x2: number; y2: number; label: string; color: string }) => (
    <g>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" />
        <rect x={x2 - 8} y={y2 - 18} width={Math.max(92, label.length * 7 + 18)} height="26" rx="9" fill="#ffffff" stroke={color} strokeWidth="1.8" />
        <text x={x2 + 4} y={y2 - 1} fill={color} fontSize="11" fontWeight="900">{label}</text>
    </g>
);

const Grid = () => (
    <g opacity="0.5">
        {Array.from({ length: 17 }).map((_, i) => <line key={`x-${i}`} x1={80 + i * 70} y1="80" x2={80 + i * 70} y2="720" stroke="#e2e8f0" />)}
        {Array.from({ length: 9 }).map((_, i) => <line key={`y-${i}`} x1="40" y1={100 + i * 70} x2="1240" y2={100 + i * 70} stroke="#e2e8f0" />)}
    </g>
);

const AsideCard = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
        <div className="text-base font-extrabold text-slate-900">{title}</div>
        <div className="text-xs font-semibold text-slate-500">{subtitle}</div>
        <div className="mt-2">{children}</div>
    </div>
);

const MiniMembraneFigure = () => (
    <svg viewBox="0 0 260 150" className="h-[150px] w-full">
        <rect width="260" height="150" rx="16" fill="#ffffff" />
        {Array.from({ length: 10 }).map((_, i) => (
            <g key={i}>
                <circle cx={28 + i * 22} cy="48" r="7" fill="#38bdf8" stroke="#0369a1" />
                <line x1={24 + i * 22} y1="56" x2={20 + i * 22} y2="88" stroke="#475569" strokeWidth="2" />
                <line x1={32 + i * 22} y1="56" x2={36 + i * 22} y2="88" stroke="#475569" strokeWidth="2" />
                <circle cx={28 + i * 22} cy="110" r="7" fill="#38bdf8" stroke="#0369a1" />
                <line x1={24 + i * 22} y1="102" x2={20 + i * 22} y2="72" stroke="#475569" strokeWidth="2" />
                <line x1={32 + i * 22} y1="102" x2={36 + i * 22} y2="72" stroke="#475569" strokeWidth="2" />
            </g>
        ))}
        <path d="M112 40 C92 58 92 102 112 120 L146 120 C166 102 166 58 146 40Z" fill="#6366f1" opacity="0.9" />
        <path d="M64 42 C80 20 112 28 116 52 C98 62 75 64 64 42Z" fill="#fb7185" />
        <text x="130" y="142" textAnchor="middle" fontSize="11" fontWeight="900" fill="#334155">bilayer + proteins + sugar + cholesterol</text>
    </svg>
);

const CompositionFigure = () => (
    <svg viewBox="0 0 260 150" className="h-[150px] w-full">
        <rect width="260" height="150" rx="16" fill="#ffffff" />
        <circle cx="78" cy="76" r="42" fill="none" stroke="#6366f1" strokeWidth="18" strokeDasharray="137 264" transform="rotate(-90 78 76)" />
        <circle cx="78" cy="76" r="42" fill="none" stroke="#38bdf8" strokeWidth="18" strokeDasharray="106 264" strokeDashoffset="-137" transform="rotate(-90 78 76)" />
        <circle cx="78" cy="76" r="42" fill="none" stroke="#f59e0b" strokeWidth="18" strokeDasharray="21 264" strokeDashoffset="-243" transform="rotate(-90 78 76)" />
        <text x="78" y="72" textAnchor="middle" fontSize="16" fontWeight="900" fill="#0f172a">RBC</text>
        <text x="78" y="91" textAnchor="middle" fontSize="10" fontWeight="800" fill="#64748b">membrane</text>
        <Legend x={144} y={45} color="#6366f1" label="52% protein" />
        <Legend x={144} y={74} color="#38bdf8" label="40% lipid" />
        <Legend x={144} y={103} color="#f59e0b" label="8% carb + other" />
    </svg>
);

const EnergyFigure = ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 260 150" className="h-[150px] w-full">
        <rect width="260" height="150" rx="16" fill="#ffffff" />
        <rect x="42" y="48" width="64" height="56" rx="12" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
        <text x="74" y="82" textAnchor="middle" fontSize="12" fontWeight="900" fill="#166534">Passive</text>
        <text x="74" y="122" textAnchor="middle" fontSize="11" fontWeight="800" fill="#64748b">no ATP</text>
        <rect x="154" y="24" width="64" height="80" rx="12" fill={active ? '#f3e8ff' : '#f8fafc'} stroke="#7c3aed" strokeWidth="2" />
        <text x="186" y="62" textAnchor="middle" fontSize="12" fontWeight="900" fill="#6d28d9">Active</text>
        <text x="186" y="122" textAnchor="middle" fontSize="11" fontWeight="800" fill="#64748b">ATP</text>
        {[0, 1, 2].map((i) => <Zap key={i} x={166 + i * 14} y={78} size={12} color="#f59e0b" />)}
    </svg>
);

const PumpFigure = ({ active }: { active: boolean }) => (
    <svg viewBox="0 0 260 150" className="h-[150px] w-full">
        <rect width="260" height="150" rx="16" fill="#ffffff" />
        <rect x="26" y="32" width="208" height="86" rx="20" fill={active ? '#faf5ff' : '#f8fafc'} stroke="#7c3aed" strokeWidth="2" />
        <path d="M96 92 C64 88 50 70 44 52" fill="none" stroke="#f59e0b" strokeWidth="4" markerEnd="url(#naMini)" />
        <path d="M166 54 C198 58 212 76 218 94" fill="none" stroke="#a855f7" strokeWidth="4" markerEnd="url(#kMini)" />
        <text x="78" y="44" fontSize="12" fontWeight="900" fill="#b45309">3 Na+ out</text>
        <text x="154" y="112" fontSize="12" fontWeight="900" fill="#7c3aed">2 K+ in</text>
        <circle cx="130" cy="76" r="22" fill="#7c3aed" />
        <text x="130" y="81" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">ATP</text>
        <defs>
            <marker id="naMini" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" /></marker>
            <marker id="kMini" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#a855f7" /></marker>
        </defs>
    </svg>
);

const Legend = ({ x, y, color, label }: { x: number; y: number; color: string; label: string }) => (
    <g>
        <rect x={x} y={y - 10} width="14" height="14" rx="4" fill={color} />
        <text x={x + 20} y={y + 1} fontSize="11" fontWeight="900" fill="#334155">{label}</text>
    </g>
);

const ValueRow = ({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'cyan' | 'emerald' | 'rose' | 'slate' | 'sky' | 'violet' }) => {
    const classes = {
        amber: 'bg-amber-50 text-amber-700',
        cyan: 'bg-cyan-50 text-cyan-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        rose: 'bg-rose-50 text-rose-700',
        slate: 'bg-slate-50 text-slate-700',
        sky: 'bg-sky-50 text-sky-700',
        violet: 'bg-violet-50 text-violet-700',
    }[tone];
    return (
        <div className={`rounded-lg border border-slate-100 px-3 py-2.5 ${classes}`}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 font-mono text-sm font-extrabold leading-tight">{value}</div>
        </div>
    );
};

const ControlGroup = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-600">
            {icon}
            <span className="truncate">{title}</span>
        </div>
        {children}
    </div>
);

const SegmentButton: React.FC<{ active: boolean; label: string; color: string; onClick: () => void }> = ({ active, label, color, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="min-h-9 rounded-lg border px-2 text-xs font-extrabold leading-tight transition-colors"
        style={{
            borderColor: active ? color : '#e2e8f0',
            backgroundColor: active ? color : '#ffffff',
            color: active ? '#ffffff' : '#334155',
        }}
    >
        {label}
    </button>
);

const RangeControl = ({
    label,
    min,
    max,
    step = 1,
    value,
    onChange,
    accent,
}: {
    label: string;
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (value: number) => void;
    accent: string;
}) => (
    <div className="mb-2">
        <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
            <span>{label}</span>
            <span>{value}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className={`w-full ${accent}`}
        />
    </div>
);

const makeLive = (particles: Particle[], mode: TransportMode, atp: number, atpUsed: number) => {
    const outside = particles.filter((p) => p.side === 'outside').length;
    const inside = particles.length - outside;
    const direction = outside > inside ? 'Outside -> Inside' : inside > outside ? 'Inside -> Outside' : 'Balanced';
    if (mode === 'active') {
        return {
            outside,
            inside,
            direction: atp > 0 || atpUsed > 0 ? '3 Na+ out / 2 K+ in' : 'ATP depleted',
        };
    }
    return { outside, inside, direction };
};

const allowsCrossing = (mode: TransportMode, kind: ParticleKind, side: Side, outside: number, inside: number, hasAtp: boolean) => {
    if (mode === 'simple') return kind === 'o2' || kind === 'co2';
    if (mode === 'osmosis') {
        if (kind !== 'h2o') return false;
        const towardInside = outside > inside;
        return towardInside ? side === 'outside' : side === 'inside';
    }
    if (mode === 'facilitated') return kind === 'glucose' || kind === 'amino';
    if (mode === 'channel') return kind === 'na' || kind === 'k' || kind === 'cl';
    if (mode === 'active') {
        if (!hasAtp) return false;
        return (kind === 'na' && side === 'inside') || (kind === 'k' && side === 'outside');
    }
    return false;
};

const nearProteinPath = (mode: TransportMode, x: number, kind: ParticleKind) => {
    if (mode === 'simple' || mode === 'osmosis') return true;
    if (mode === 'active') return Math.abs(x - 640) < 80;
    if (mode === 'facilitated') return Math.abs(x - 640) < 80;
    if (mode === 'channel') return Math.abs(x - 640) < 62 || (kind === 'k' && Math.abs(x - 320) < 62) || (kind === 'cl' && Math.abs(x - 960) < 62);
    return false;
};

const particleTone = (group: string): 'amber' | 'cyan' | 'emerald' | 'rose' | 'slate' | 'sky' | 'violet' => {
    if (group === 'ion') return 'rose';
    if (group === 'water') return 'cyan';
    if (group === 'polar') return 'rose';
    if (group === 'neutral') return 'emerald';
    return 'violet';
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default CellMembraneLab;
