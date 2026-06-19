import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Thermometer,
    Droplet,
    ShieldAlert,
    Plus,
    Minus,
    Play,
    Pause,
    RotateCcw,
    Gauge,
    FlaskConical,
    Info,
    ChevronRight,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface EnzymesLabProps {
    topic: any;
    onExit: () => void;
}

type Mechanism = 'induced' | 'lock';
type Speed = 0.5 | 1 | 2;
type EnzymePhase = 'free' | 'es' | 'ep' | 'inhibited';

interface Dot {
    x: number;
    y: number;
}

interface Particle {
    id: number;
    kind: 'substrate' | 'inhibitor';
    x: number;
    y: number;
    vx: number;
    vy: number;
    trail: Dot[];
}

interface Product {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
}

interface Flash {
    x: number;
    y: number;
    age: number;
}

interface EnzymeAnim {
    x: number;
    y: number;
    phase: EnzymePhase;
    timer: number;
    pulse: number;
}

interface Snapshot {
    velocity: number;
    products: number;
    bound: number;
    inhibited: number;
    occupied: number;
    stage: string;
}

const W = 1280;
const H = 760;
const CHAMBER = { x: 88, y: 106, w: 1104, h: 548 };
const BASE_KM = 55;
const BASE_VMAX_PER_ENZYME = 24;
const DEFAULT_SNAPSHOT: Snapshot = {
    velocity: 0,
    products: 0,
    bound: 0,
    inhibited: 0,
    occupied: 0,
    stage: 'Free enzyme',
};

const EnzymesLab: React.FC<EnzymesLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef(0);
    const productTotalRef = useRef(0);
    const snapshotClockRef = useRef(0);

    const [substrate, setSubstrate] = useState(80);
    const [temperature, setTemperature] = useState(37);
    const [pH, setPH] = useState(7);
    const [enzymeCount, setEnzymeCount] = useState(2);
    const [mechanism, setMechanism] = useState<Mechanism>('induced');
    const [inhibitorOn, setInhibitorOn] = useState(false);
    const [thermophile, setThermophile] = useState(false);
    const [speed, setSpeed] = useState<Speed>(1);
    const [playing, setPlaying] = useState(true);
    const [resetKey, setResetKey] = useState(0);
    const [snapshot, setSnapshot] = useState<Snapshot>(DEFAULT_SNAPSHOT);
    const [activeStep, setActiveStep] = useState(1);

    const derived = useMemo(() => computeKinetics({
        substrate,
        temperature,
        pH,
        enzymeCount,
        inhibitorOn,
        thermophile,
    }), [enzymeCount, inhibitorOn, pH, substrate, temperature, thermophile]);

    const resetLab = useCallback(() => {
        productTotalRef.current = 0;
        snapshotClockRef.current = 0;
        setSubstrate(80);
        setTemperature(37);
        setPH(7);
        setEnzymeCount(2);
        setMechanism('induced');
        setInhibitorOn(false);
        setThermophile(false);
        setSpeed(1);
        setPlaying(true);
        setSnapshot(DEFAULT_SNAPSHOT);
        setActiveStep(1);
        setResetKey((key) => key + 1);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles = createParticles(substrate, inhibitorOn);
        let enzymes = createEnzymes(enzymeCount);
        let products: Product[] = [];
        let flashes: Flash[] = [];
        let sequence = 0;

        const tick = (now: number) => {
            const last = lastRef.current || now;
            let dt = (now - last) / 1000;
            if (dt > 0.1) dt = 0.1;
            lastRef.current = now;
            const scaledDt = playing ? dt * speed : 0;

            enzymes = syncEnzymes(enzymes, enzymeCount);
            particles = syncParticles(particles, substrate, inhibitorOn, sequence);
            sequence += 3;

            if (scaledDt > 0) {
                const update = advanceWorld({
                    dt: scaledDt,
                    particles,
                    products,
                    flashes,
                    enzymes,
                    substrate,
                    inhibitorOn,
                    mechanism,
                    denatured: derived.denatured,
                    rateFactor: derived.activityFactor,
                });
                particles = update.particles;
                products = update.products;
                flashes = update.flashes;
                enzymes = update.enzymes;
                if (update.productEvents > 0) productTotalRef.current += update.productEvents;
            }

            const stage = resolveStage(enzymes, derived.denatured);
            drawCanvas(ctx, {
                time: now / 1000,
                particles,
                products,
                flashes,
                enzymes,
                mechanism,
                inhibitorOn,
                denatured: derived.denatured,
                thermophile,
                temperature,
            });

            snapshotClockRef.current += dt;
            if (snapshotClockRef.current > 0.18) {
                snapshotClockRef.current = 0;
                const bound = enzymes.filter((enzyme) => enzyme.phase === 'es' || enzyme.phase === 'ep').length;
                const inhibited = enzymes.filter((enzyme) => enzyme.phase === 'inhibited').length;
                const occupied = Math.round(((bound + inhibited) / Math.max(1, enzymes.length)) * 100);
                setSnapshot({
                    velocity: derived.velocity,
                    products: productTotalRef.current,
                    bound,
                    inhibited,
                    occupied,
                    stage,
                });
                setActiveStep(stageToStep(stage));
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastRef.current = 0;
        };
    }, [
        derived.activityFactor,
        derived.denatured,
        derived.velocity,
        enzymeCount,
        inhibitorOn,
        mechanism,
        playing,
        resetKey,
        speed,
        substrate,
        temperature,
        thermophile,
    ]);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5 pt-9">
                <EnergyProfileCard activeStep={activeStep} />
                <VelocityCard substrate={substrate} inhibitorOn={inhibitorOn} derived={derived} />
                <EnvironmentCard pH={pH} temperature={temperature} thermophile={thermophile} derived={derived} />
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3 pr-16">
                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="mb-1 flex items-center gap-2 text-base font-extrabold text-violet-900">
                        <Info size={16} />
                        NCERT Ch 9.8
                    </div>
                    <div className="mb-3 text-xs font-semibold text-violet-700">Enzyme-substrate complex and catalysis</div>
                    <div className="rounded-lg border border-violet-100 bg-white/85 px-3 py-2 text-center font-mono text-sm font-black text-violet-900">
                        E + S -&gt; ES -&gt; EP -&gt; E + P
                    </div>
                    <div className="mt-3 space-y-1.5">
                        {[
                            'Substrate binds the active-site pocket.',
                            'Binding induces the enzyme to alter shape.',
                            'Bonds break or form; EP complex appears.',
                            'Products release; enzyme is unchanged.',
                        ].map((text, index) => (
                            <div
                                key={text}
                                className={`flex gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold leading-snug ${
                                    activeStep === index + 1
                                        ? 'border-violet-300 bg-white text-violet-900 shadow-sm'
                                        : 'border-white/70 bg-white/55 text-violet-800'
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
                        <ValueRow label="Rate" value={`${snapshot.velocity.toFixed(1)} units/s`} tint="#fffbeb" color="#b45309" />
                        <ValueRow label="Vmax" value={`${derived.vmax.toFixed(0)} units/s`} tint="#ecfeff" color="#0891b2" />
                        <ValueRow label="Km" value={`${derived.km.toFixed(0)} substrate units`} tint="#eef2ff" color="#4f46e5" />
                        <ValueRow label="Active sites occupied" value={`${snapshot.occupied}%`} tint="#f8fafc" color="#334155" />
                        <ValueRow label="ES / EP complexes" value={`${snapshot.bound}`} tint="#f5f3ff" color="#7c3aed" />
                        <ValueRow label="Products formed" value={`${snapshot.products}`} tint="#ecfdf5" color="#059669" />
                        {inhibitorOn && <ValueRow label="Malonate blocks" value={`${snapshot.inhibited}`} tint="#fff1f2" color="#be123c" />}
                        <ValueRow label="Current event" value={snapshot.stage} tint="#f8fafc" color="#334155" />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
                        <FlaskConical size={16} className="text-teal-700" />
                        Required facts
                    </div>
                    <div className="space-y-2 text-xs font-semibold leading-snug text-slate-700">
                        <MiniFact color="#7c3aed" text="Almost all enzymes are proteins; catalytic RNA molecules are ribozymes." />
                        <MiniFact color="#dc2626" text="Ordinary enzymes are damaged above about 40 deg C; thermophile enzymes can retain activity at 80-90 deg C." />
                        <MiniFact color="#0891b2" text="Cofactors: prosthetic groups, coenzymes, and metal ions. Protein portion is the apoenzyme." />
                        <MiniFact color="#059669" text="Six classes: oxidoreductases, transferases, hydrolases, lyases, isomerases, ligases." />
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
                    aria-label="Canvas animation of enzyme-substrate complex formation and catalysis"
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
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain bg-white text-slate-900">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
                <Activity size={16} className="text-violet-700" />
                Enzyme Catalysis Bench
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <ControlGroup icon={<Gauge size={14} className="text-emerald-700" />} label="Substrate concentration">
                    <SliderControl label="Succinate [S]" value={substrate} min={0} max={240} step={1} onChange={setSubstrate} />
                </ControlGroup>
                <ControlGroup icon={<Thermometer size={14} className="text-red-700" />} label="Temperature">
                    <SliderControl label="Temperature" value={temperature} min={0} max={100} step={1} onChange={setTemperature} suffix=" deg C" />
                </ControlGroup>
                <ControlGroup icon={<Droplet size={14} className="text-cyan-700" />} label="pH">
                    <SliderControl label="pH" value={pH} min={0} max={14} step={0.1} onChange={setPH} />
                </ControlGroup>
                <ControlGroup icon={<Plus size={14} className="text-indigo-700" />} label="Enzyme molecules">
                    <div className="flex items-center gap-2">
                        <IconButton onClick={() => setEnzymeCount((count) => Math.max(1, count - 1))} title="Remove enzyme">
                            <Minus size={15} />
                        </IconButton>
                        <div className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-black text-slate-800">
                            {enzymeCount}
                        </div>
                        <IconButton onClick={() => setEnzymeCount((count) => Math.min(4, count + 1))} title="Add enzyme">
                            <Plus size={15} />
                        </IconButton>
                    </div>
                </ControlGroup>
                <ControlGroup icon={<FlaskConical size={14} className="text-violet-700" />} label="Mechanism">
                    <div className="grid grid-cols-2 gap-1.5">
                        <SegmentButton active={mechanism === 'induced'} color="#7c3aed" onClick={() => setMechanism('induced')}>Induced Fit</SegmentButton>
                        <SegmentButton active={mechanism === 'lock'} color="#475569" onClick={() => setMechanism('lock')}>Lock-Key</SegmentButton>
                    </div>
                </ControlGroup>
                <ControlGroup icon={<ShieldAlert size={14} className="text-red-700" />} label="Inhibitor">
                    <ToggleButton active={inhibitorOn} color="#dc2626" onClick={() => setInhibitorOn((value) => !value)}>
                        Competitive malonate
                    </ToggleButton>
                </ControlGroup>
                <ControlGroup icon={<Thermometer size={14} className="text-amber-700" />} label="Enzyme type">
                    <ToggleButton active={thermophile} color="#d97706" onClick={() => setThermophile((value) => !value)}>
                        Thermophile enzyme
                    </ToggleButton>
                </ControlGroup>
                <ControlGroup icon={<Activity size={14} className="text-slate-700" />} label="Animation speed">
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
            controlsWrapperClassName="w-full h-full max-w-[min(100%,980px)] overflow-y-auto overscroll-contain bg-white border border-slate-200 shadow-2xl rounded-2xl md:rounded-3xl p-3 md:p-5"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

const computeKinetics = ({
    substrate,
    temperature,
    pH,
    enzymeCount,
    inhibitorOn,
    thermophile,
}: {
    substrate: number;
    temperature: number;
    pH: number;
    enzymeCount: number;
    inhibitorOn: boolean;
    thermophile: boolean;
}) => {
    const optimumT = thermophile ? 82 : 37;
    const denatureLimit = thermophile ? 94 : 60;
    const denatured = temperature >= denatureLimit;
    const pHFactor = Math.exp(-Math.pow((pH - 7) / 2.7, 2));
    const thermalCurve = Math.exp(-Math.pow((temperature - optimumT) / (thermophile ? 16 : 13), 2));
    const heatPenalty = !thermophile && temperature > 40 ? Math.max(0, 1 - (temperature - 40) / 20) : 1;
    const tempFactor = denatured ? 0 : clamp(thermalCurve * heatPenalty, 0, 1);
    const km = inhibitorOn ? BASE_KM * 1.9 : BASE_KM;
    const vmax = enzymeCount * BASE_VMAX_PER_ENZYME;
    const substrateFactor = substrate / (km + Math.max(1, substrate));
    const activityFactor = clamp(pHFactor * tempFactor, 0, 1);
    const velocity = vmax * substrateFactor * activityFactor;
    return { optimumT, denatureLimit, denatured, pHFactor, tempFactor, km, vmax, activityFactor, velocity };
};

const createParticles = (substrate: number, inhibitorOn: boolean): Particle[] => {
    const count = Math.min(42, Math.round(substrate / 6));
    const inhibitors = inhibitorOn ? 10 : 0;
    return [
        ...Array.from({ length: count }, (_, index) => makeParticle(index, 'substrate')),
        ...Array.from({ length: inhibitors }, (_, index) => makeParticle(1000 + index, 'inhibitor')),
    ];
};

const makeParticle = (id: number, kind: 'substrate' | 'inhibitor'): Particle => ({
    id,
    kind,
    x: CHAMBER.x + 70 + Math.random() * (CHAMBER.w - 140),
    y: CHAMBER.y + 70 + Math.random() * (CHAMBER.h - 140),
    vx: (Math.random() - 0.5) * 45,
    vy: (Math.random() - 0.5) * 45,
    trail: [],
});

const syncParticles = (particles: Particle[], substrate: number, inhibitorOn: boolean, sequence: number) => {
    const substrateTarget = Math.min(42, Math.round(substrate / 6));
    const inhibitorTarget = inhibitorOn ? 10 : 0;
    const substrates = particles.filter((particle) => particle.kind === 'substrate');
    const inhibitors = particles.filter((particle) => particle.kind === 'inhibitor');
    while (substrates.length < substrateTarget) substrates.push(makeParticle(sequence + substrates.length, 'substrate'));
    while (inhibitors.length < inhibitorTarget) inhibitors.push(makeParticle(2000 + sequence + inhibitors.length, 'inhibitor'));
    return [...substrates.slice(0, substrateTarget), ...inhibitors.slice(0, inhibitorTarget)];
};

const createEnzymes = (count: number): EnzymeAnim[] => {
    const xs = count === 1 ? [640] : count === 2 ? [500, 780] : count === 3 ? [390, 640, 890] : [330, 535, 745, 950];
    return xs.map((x, index) => ({
        x,
        y: index % 2 === 0 ? 365 : 430,
        phase: 'free',
        timer: 0,
        pulse: 0,
    }));
};

const syncEnzymes = (enzymes: EnzymeAnim[], count: number) => {
    const fresh = createEnzymes(count);
    return fresh.map((enzyme, index) => ({
        ...enzyme,
        phase: enzymes[index]?.phase ?? 'free',
        timer: enzymes[index]?.timer ?? 0,
        pulse: enzymes[index]?.pulse ?? 0,
    }));
};

const advanceWorld = ({
    dt,
    particles,
    products,
    flashes,
    enzymes,
    substrate,
    inhibitorOn,
    mechanism,
    denatured,
    rateFactor,
}: {
    dt: number;
    particles: Particle[];
    products: Product[];
    flashes: Flash[];
    enzymes: EnzymeAnim[];
    substrate: number;
    inhibitorOn: boolean;
    mechanism: Mechanism;
    denatured: boolean;
    rateFactor: number;
}) => {
    let productEvents = 0;
    const freeEnzymes = denatured ? [] : enzymes.filter((enzyme) => enzyme.phase === 'free');

    particles = particles.map((particle) => {
        const target = nearestFreeEnzyme(particle, freeEnzymes);
        const bias = particle.kind === 'substrate' ? Math.min(0.55, substrate / 500) : inhibitorOn ? 0.22 : 0;
        if (target) {
            const dx = target.x - particle.x;
            const dy = target.y - 64 - particle.y;
            const d = Math.max(1, Math.hypot(dx, dy));
            particle.vx += (dx / d) * bias * 48 * dt;
            particle.vy += (dy / d) * bias * 48 * dt;
        }
        particle.vx += (Math.random() - 0.5) * 55 * dt;
        particle.vy += (Math.random() - 0.5) * 55 * dt;
        particle.vx *= 0.985;
        particle.vy *= 0.985;
        particle.x += particle.vx * dt * 2.2;
        particle.y += particle.vy * dt * 2.2;
        bounceParticle(particle);
        particle.trail = [...particle.trail.slice(-5), { x: particle.x, y: particle.y }];
        return particle;
    });

    const remaining = [...particles];
    enzymes = enzymes.map((enzyme) => {
        if (denatured) return { ...enzyme, phase: 'free', timer: 0, pulse: 0 };
        const next = { ...enzyme, pulse: Math.max(0, enzyme.pulse - dt * 2) };
        if (next.phase === 'es') {
            next.timer -= dt;
            if (next.timer <= 0) {
                next.phase = 'ep';
                next.timer = 0.32;
                flashes.push({ x: next.x, y: next.y - 62, age: 0 });
                next.pulse = 1;
            }
            return next;
        }
        if (next.phase === 'ep') {
            next.timer -= dt;
            if (next.timer <= 0) {
                next.phase = 'free';
                next.timer = 0;
                productEvents += 1;
                products.push(
                    { x: next.x - 18, y: next.y - 66, vx: -80 - Math.random() * 40, vy: -45 - Math.random() * 20, life: 1.5 },
                    { x: next.x + 18, y: next.y - 66, vx: 80 + Math.random() * 40, vy: -45 - Math.random() * 20, life: 1.5 },
                );
            }
            return next;
        }
        if (next.phase === 'inhibited') {
            next.timer -= dt;
            if (next.timer <= 0) {
                next.phase = 'free';
                next.timer = 0;
            }
            return next;
        }

        const inhibitor = inhibitorOn ? findDockingParticle(remaining, next, 'inhibitor', 70) : null;
        if (inhibitor && Math.random() < 0.06) {
            removeParticle(remaining, inhibitor.id);
            next.phase = 'inhibited';
            next.timer = 1.1 + Math.random() * 0.8;
            next.pulse = 1;
            return next;
        }

        const substrateParticle = findDockingParticle(remaining, next, 'substrate', 76);
        const bindChance = 0.12 * rateFactor * (mechanism === 'induced' ? 1.15 : 0.85);
        if (substrateParticle && Math.random() < bindChance) {
            removeParticle(remaining, substrateParticle.id);
            next.phase = 'es';
            next.timer = 0.42;
            next.pulse = 1;
        }
        return next;
    });

    products = products
        .map((product) => ({
            ...product,
            x: product.x + product.vx * dt,
            y: product.y + product.vy * dt,
            vy: product.vy + 26 * dt,
            life: product.life - dt,
        }))
        .filter((product) => product.life > 0);

    flashes = flashes
        .map((flash) => ({ ...flash, age: flash.age + dt }))
        .filter((flash) => flash.age < 0.22);

    return { particles: remaining, products, flashes, enzymes, productEvents };
};

const drawCanvas = (
    ctx: CanvasRenderingContext2D,
    {
        time,
        particles,
        products,
        flashes,
        enzymes,
        mechanism,
        inhibitorOn,
        denatured,
        thermophile,
        temperature,
    }: {
        time: number;
        particles: Particle[];
        products: Product[];
        flashes: Flash[];
        enzymes: EnzymeAnim[];
        mechanism: Mechanism;
        inhibitorOn: boolean;
        denatured: boolean;
        thermophile: boolean;
        temperature: number;
    },
) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx);
    drawChamber(ctx);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 18px Inter, Arial, sans-serif';
    ctx.fillText('Succinic dehydrogenase micro-lab', 120, 78);
    ctx.font = '700 12px Inter, Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(inhibitorOn ? 'Succinate substrates and malonate competitors diffuse toward active sites' : 'Succinate substrates diffuse, dock, form ES and EP, then release products', 120, 100);

    for (const particle of particles) drawParticle(ctx, particle);
    for (const enzyme of enzymes) drawEnzyme(ctx, enzyme, mechanism, denatured, time);
    for (const flash of flashes) drawFlash(ctx, flash);
    for (const product of products) drawProduct(ctx, product);

    drawLegend(ctx, inhibitorOn, thermophile, denatured, temperature);
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

const drawChamber = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    roundRect(ctx, CHAMBER.x, CHAMBER.y, CHAMBER.w, CHAMBER.h, 34);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
    roundRect(ctx, CHAMBER.x + 28, CHAMBER.y + 36, CHAMBER.w - 56, CHAMBER.h - 72, 26);
    ctx.fill();
    ctx.restore();
};

const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    particle.trail.forEach((point, index) => {
        ctx.globalAlpha = (index + 1) / particle.trail.length * 0.25;
        ctx.fillStyle = particle.kind === 'substrate' ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(point.x, point.y, particle.kind === 'substrate' ? 7 : 6, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (particle.kind === 'substrate') {
        drawHex(ctx, particle.x, particle.y, 15, '#22c55e', '#14532d');
        ctx.fillStyle = '#052e16';
        ctx.font = '900 9px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('S', particle.x, particle.y + 3);
    } else {
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2;
        roundRect(ctx, particle.x - 12, particle.y - 12, 24, 24, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 8px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('M', particle.x, particle.y + 3);
    }
    ctx.restore();
};

const drawEnzyme = (ctx: CanvasRenderingContext2D, enzyme: EnzymeAnim, mechanism: Mechanism, denatured: boolean, time: number) => {
    ctx.save();
    ctx.translate(enzyme.x, enzyme.y);
    if (denatured) {
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < 13; i += 1) {
            const x = -105 + i * 18;
            const y = Math.sin(time * 2 + i * 0.8) * 22;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = '#6b7280';
        ctx.font = '900 12px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Denatured', 0, 58);
        ctx.restore();
        return;
    }

    const squeeze = mechanism === 'induced' && (enzyme.phase === 'es' || enzyme.phase === 'ep') ? 0.88 : 1;
    const pulse = 1 + enzyme.pulse * 0.035;
    ctx.scale(squeeze * pulse, pulse);
    ctx.shadowColor = enzyme.phase === 'free' ? 'rgba(124,58,237,0.22)' : enzyme.phase === 'inhibited' ? 'rgba(220,38,38,0.26)' : 'rgba(217,119,6,0.34)';
    ctx.shadowBlur = enzyme.phase === 'free' ? 12 : 22;
    ctx.fillStyle = enzyme.phase === 'inhibited' ? '#ddd6fe' : '#ede9fe';
    ctx.strokeStyle = enzyme.phase === 'inhibited' ? '#dc2626' : '#7c3aed';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-104, -8);
    ctx.bezierCurveTo(-118, -86, -28, -120, 44, -92);
    ctx.bezierCurveTo(126, -58, 126, 50, 52, 88);
    ctx.bezierCurveTo(-30, 128, -126, 76, -104, -8);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = enzyme.phase === 'es' || enzyme.phase === 'ep' ? 18 : 0;
    ctx.shadowColor = '#fde68a';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = enzyme.phase === 'inhibited' ? '#dc2626' : '#6d28d9';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-16, -88);
    ctx.bezierCurveTo(30, -112, 74, -82, 82, -38);
    ctx.bezierCurveTo(44, -16, 10, -16, -20, -38);
    ctx.bezierCurveTo(-12, -54, -12, -70, -16, -88);
    ctx.fill();
    ctx.stroke();

    if (enzyme.phase === 'es' || enzyme.phase === 'ep') {
        drawHex(ctx, 30, -58, 18, '#22c55e', '#14532d');
        if (enzyme.phase === 'ep') {
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = '#075985';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(14, -60, 8, 0, Math.PI * 2);
            ctx.arc(44, -60, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    if (enzyme.phase === 'inhibited') {
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2;
        roundRect(ctx, 16, -72, 28, 28, 6);
        ctx.fill();
        ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#4c1d95';
    ctx.font = '900 12px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(enzyme.phase === 'inhibited' ? 'Malonate block' : 'Active site', 20, -118);
    ctx.restore();
};

const drawProduct = (ctx: CanvasRenderingContext2D, product: Product) => {
    ctx.save();
    ctx.globalAlpha = clamp(product.life / 1.5, 0, 1);
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#075985';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(56,189,248,0.35)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(product.x, product.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

const drawFlash = (ctx: CanvasRenderingContext2D, flash: Flash) => {
    const radius = 18 + flash.age * 180;
    const alpha = 1 - flash.age / 0.22;
    const gradient = ctx.createRadialGradient(flash.x, flash.y, 1, flash.x, flash.y, radius);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(0.38, `rgba(250,204,21,${alpha * 0.75})`);
    gradient.addColorStop(1, 'rgba(250,204,21,0)');
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawLegend = (ctx: CanvasRenderingContext2D, inhibitorOn: boolean, thermophile: boolean, denatured: boolean, temperature: number) => {
    ctx.save();
    ctx.font = '900 12px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`S = succinate substrate; P = products${inhibitorOn ? '; M = malonate competitive inhibitor' : ''}`, 120, 704);
    ctx.fillStyle = denatured ? '#be123c' : '#475569';
    ctx.textAlign = 'right';
    ctx.fillText(`${temperature} deg C ${thermophile ? 'thermophile' : 'ordinary enzyme'}${denatured ? ' - denatured' : ''}`, 1160, 704);
    ctx.restore();
};

const nearestFreeEnzyme = (particle: Particle, enzymes: EnzymeAnim[]) => {
    let best: EnzymeAnim | null = null;
    let bestDistance = Infinity;
    enzymes.forEach((enzyme) => {
        const distance = Math.hypot(enzyme.x - particle.x, enzyme.y - 64 - particle.y);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = enzyme;
        }
    });
    return best;
};

const findDockingParticle = (particles: Particle[], enzyme: EnzymeAnim, kind: Particle['kind'], radius: number) => (
    particles.find((particle) => particle.kind === kind && Math.hypot(particle.x - enzyme.x, particle.y - (enzyme.y - 64)) < radius) ?? null
);

const removeParticle = (particles: Particle[], id: number) => {
    const index = particles.findIndex((particle) => particle.id === id);
    if (index >= 0) particles.splice(index, 1);
};

const bounceParticle = (particle: Particle) => {
    const minX = CHAMBER.x + 42;
    const maxX = CHAMBER.x + CHAMBER.w - 42;
    const minY = CHAMBER.y + 54;
    const maxY = CHAMBER.y + CHAMBER.h - 54;
    if (particle.x < minX || particle.x > maxX) {
        particle.vx *= -1;
        particle.x = clamp(particle.x, minX, maxX);
    }
    if (particle.y < minY || particle.y > maxY) {
        particle.vy *= -1;
        particle.y = clamp(particle.y, minY, maxY);
    }
};

const resolveStage = (enzymes: EnzymeAnim[], denatured: boolean) => {
    if (denatured) return 'Heat denaturation';
    if (enzymes.some((enzyme) => enzyme.phase === 'inhibited')) return 'Competitive inhibition';
    if (enzymes.some((enzyme) => enzyme.phase === 'ep')) return 'EP complex';
    if (enzymes.some((enzyme) => enzyme.phase === 'es')) return 'ES complex';
    return 'Free enzyme';
};

const stageToStep = (stage: string) => {
    if (stage === 'ES complex') return 2;
    if (stage === 'EP complex') return 3;
    if (stage === 'Free enzyme') return 4;
    return 1;
};

const EnergyProfileCard: React.FC<{ activeStep: number }> = ({ activeStep }) => {
    const dotX = 44 + activeStep * 43;
    const dotY = activeStep === 1 ? 108 : activeStep === 2 ? 70 : activeStep === 3 ? 96 : 124;
    return (
        <AsideCard title="NCERT Fig 9.4" subtitle="Activation energy" icon={<Gauge size={15} className="text-red-700" />}>
            <svg viewBox="0 0 282 172" className="h-[172px] w-full">
                <rect width="282" height="172" rx="14" fill="#ffffff" />
                <line x1="34" y1="138" x2="254" y2="138" stroke="#475569" strokeWidth="2" />
                <line x1="34" y1="138" x2="34" y2="24" stroke="#475569" strokeWidth="2" />
                <path d="M44 116 C92 36 144 28 232 126" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="7 6" />
                <path d="M44 116 C96 72 142 66 232 126" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
                <line x1="92" y1="116" x2="92" y2="44" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="132" y1="116" x2="132" y2="78" stroke="#dc2626" strokeWidth="2" strokeDasharray="5 5" />
                <circle cx={dotX} cy={dotY} r="7" fill="#dc2626" stroke="#ffffff" strokeWidth="3" />
                <text x="52" y="154" fontSize="10" fontWeight="900" fill="#475569">S</text>
                <text x="224" y="154" fontSize="10" fontWeight="900" fill="#475569">P</text>
                <text x="136" y="36" textAnchor="middle" fontSize="10" fontWeight="900" fill="#475569">Transition state</text>
                <text x="145" y="13" textAnchor="middle" fontSize="10" fontWeight="900" fill="#475569">Potential Energy</text>
                <text x="144" y="168" textAnchor="middle" fontSize="10" fontWeight="900" fill="#475569">Progress of reaction</text>
                <text x="178" y="61" fontSize="10" fontWeight="900" fill="#94a3b8">without enzyme</text>
                <text x="172" y="91" fontSize="10" fontWeight="900" fill="#dc2626">with enzyme</text>
            </svg>
        </AsideCard>
    );
};

const VelocityCard: React.FC<{ substrate: number; inhibitorOn: boolean; derived: ReturnType<typeof computeKinetics> }> = ({ substrate, inhibitorOn, derived }) => {
    const dotX = 44 + (substrate / 240) * 210;
    const dotY = 130 - (derived.velocity / Math.max(1, derived.vmax)) * 88;
    const points = curvePoints(derived.vmax, derived.km);
    const refPoints = curvePoints(derived.vmax, BASE_KM);
    const kmX = 44 + (derived.km / 240) * 210;
    return (
        <AsideCard title="NCERT Fig 9.5(c)" subtitle="Velocity vs substrate" icon={<Activity size={15} className="text-emerald-700" />}>
            <svg viewBox="0 0 282 162" className="h-[162px] w-full">
                <line x1="34" y1="132" x2="258" y2="132" stroke="#475569" strokeWidth="2" />
                <line x1="34" y1="132" x2="34" y2="22" stroke="#475569" strokeWidth="2" />
                <line x1="34" y1="42" x2="258" y2="42" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 5" />
                {inhibitorOn && <polyline points={refPoints} fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="5 5" />}
                <polyline points={points} fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <line x1={kmX} y1="132" x2={kmX} y2="86" stroke="#d97706" strokeWidth="2" strokeDasharray="5 5" />
                <circle cx={dotX} cy={dotY} r="7" fill="#16a34a" stroke="#ffffff" strokeWidth="3" />
                <text x="232" y="36" fontSize="10" fontWeight="900" fill="#dc2626">Vmax</text>
                <text x={kmX} y="82" textAnchor="middle" fontSize="10" fontWeight="900" fill="#92400e">Km</text>
                <text x="146" y="156" textAnchor="middle" fontSize="10" fontWeight="900" fill="#475569">[S]</text>
                <text x="12" y="84" textAnchor="middle" fontSize="10" fontWeight="900" fill="#475569" transform="rotate(-90 12 84)">V</text>
                {inhibitorOn && <text x="50" y="26" fontSize="10" fontWeight="900" fill="#be123c">Malonate raises apparent Km; Vmax unchanged</text>}
            </svg>
        </AsideCard>
    );
};

const EnvironmentCard: React.FC<{ pH: number; temperature: number; thermophile: boolean; derived: ReturnType<typeof computeKinetics> }> = ({ pH, temperature, thermophile, derived }) => {
    const phX = 40 + (pH / 14) * 200;
    const phY = 66 - derived.pHFactor * 40;
    const tempX = 40 + (temperature / 100) * 200;
    const tempY = 134 - derived.tempFactor * 40;
    return (
        <AsideCard title="NCERT Fig 9.5(a,b)" subtitle="pH and temperature" icon={<Thermometer size={15} className="text-amber-700" />}>
            <svg viewBox="0 0 282 164" className="h-[164px] w-full">
                <rect x="28" y="14" width="230" height="58" rx="12" fill="#ecfeff" />
                <path d="M40 66 C86 66 84 26 140 26 C196 26 194 66 240 66" fill="none" stroke="#0891b2" strokeWidth="4" />
                <circle cx={phX} cy={phY} r="6" fill="#0891b2" stroke="#ffffff" strokeWidth="3" />
                <text x="40" y="86" fontSize="10" fontWeight="900" fill="#475569">pH 0</text>
                <text x="132" y="86" fontSize="10" fontWeight="900" fill="#0891b2">optimum pH</text>
                <text x="222" y="86" fontSize="10" fontWeight="900" fill="#475569">14</text>
                <rect x="28" y="92" width="230" height="58" rx="12" fill="#fff7ed" />
                <rect x={thermophile ? 236 : 120} y="92" width={thermophile ? 22 : 138} height="58" rx="12" fill="#fecaca" opacity="0.55" />
                <path d={thermophile ? 'M40 144 C92 144 132 102 204 102 C226 102 235 126 240 144' : 'M40 144 C78 144 90 104 122 104 C154 104 174 126 240 144'} fill="none" stroke="#d97706" strokeWidth="4" />
                <circle cx={tempX} cy={tempY} r="6" fill="#d97706" stroke="#ffffff" strokeWidth="3" />
                <text x="40" y="160" fontSize="10" fontWeight="900" fill="#475569">0</text>
                <text x="120" y="160" fontSize="10" fontWeight="900" fill="#be123c">heat denatures</text>
                <text x="222" y="160" fontSize="10" fontWeight="900" fill="#475569">100</text>
            </svg>
        </AsideCard>
    );
};

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
    <div className="rounded-xl border border-slate-200 bg-white p-3">
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
            className="w-full accent-violet-700"
        />
    </div>
);

const SegmentButton: React.FC<{ active: boolean; color: string; onClick: () => void; children: React.ReactNode }> = ({ active, color, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="min-h-[34px] rounded-lg border px-2 py-1.5 text-[11px] font-black leading-tight transition-colors"
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
        className="min-h-[36px] w-full rounded-lg border px-3 py-2 text-xs font-black transition-colors"
        style={{
            background: active ? color : '#ffffff',
            borderColor: active ? color : '#e2e8f0',
            color: active ? '#ffffff' : '#334155',
        }}
    >
        {children}
    </button>
);

const IconButton: React.FC<{ title: string; onClick: () => void; children: React.ReactNode }> = ({ title, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-50"
        title={title}
    >
        {children}
    </button>
);

const curvePoints = (vmax: number, km: number) => (
    Array.from({ length: 30 }, (_, index) => {
        const s = (index / 29) * 240;
        const v = vmax * s / (km + Math.max(1, s));
        const x = 44 + (s / 240) * 210;
        const y = 130 - (v / Math.max(1, vmax)) * 88;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ')
);

const drawHex = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke: string) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
        const angle = -Math.PI / 2 + i * Math.PI / 3;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
};

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

export default EnzymesLab;
