import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Eye,
    Gauge,
    Info,
    Leaf,
    Pause,
    Play,
    RotateCcw,
    Sprout,
    StepForward,
    Tags,
    Zap,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface DoubleFertilisationSeedDevelopmentLabProps {
    topic: any;
    onExit: () => void;
}

type StageKey =
    | 'POLLINATION'
    | 'POLLEN_GERMINATION'
    | 'TUBE_GROWTH_STYLE'
    | 'TUBE_ENTRY_SYNERGID'
    | 'GAMETE_DISCHARGE'
    | 'SYNGAMY'
    | 'TRIPLE_FUSION'
    | 'SYNERGID_DEGEN'
    | 'FREE_NUCLEAR_ENDOSPERM'
    | 'CELLULAR_ENDOSPERM'
    | 'EMBRYOGENY'
    | 'SEED_MATURE'
    | 'FRUIT';

type SpeciesKey = 'maize' | 'pea' | 'castor' | 'coconut';
type PollenMode = 'twoCell' | 'threeCell';

interface StageMeta {
    key: StageKey;
    label: string;
    shortLabel: string;
    duration: number;
    observation: string;
}

interface Dot {
    x: number;
    y: number;
}

interface Snapshot {
    stageLabel: string;
    tubeGrowth: number;
    zygote: boolean;
    pen: boolean;
    seedType: string;
    endosperm: string;
    embryo: string;
}

interface SpeciesMeta {
    label: string;
    seedType: string;
    embryoType: 'monocot' | 'dicot';
    endospermNote: string;
    reserveLabel: string;
    color: string;
}

const W = 1280;
const H = 760;

const STAGES: StageMeta[] = [
    {
        key: 'POLLINATION',
        label: 'Pollination',
        shortLabel: 'Pollination',
        duration: 1.6,
        observation: 'Compatible pollen rests on the stigma; exine, intine and germ pores are visible.',
    },
    {
        key: 'POLLEN_GERMINATION',
        label: 'Pollen germination',
        shortLabel: 'Germination',
        duration: 2,
        observation: 'Pollen tube emerges through a germ pore. In 2-celled pollen, the generative cell divides in the tube.',
    },
    {
        key: 'TUBE_GROWTH_STYLE',
        label: 'Tube growth through style',
        shortLabel: 'Style tube',
        duration: 3.8,
        observation: 'The pollen tube grows through the style carrying two male gametes near its tip.',
    },
    {
        key: 'TUBE_ENTRY_SYNERGID',
        label: 'Porogamy and synergid entry',
        shortLabel: 'Porogamy',
        duration: 2.4,
        observation: 'The tube enters the ovule through the micropyle and enters one synergid guided by filiform apparatus.',
    },
    {
        key: 'GAMETE_DISCHARGE',
        label: 'Gamete discharge',
        shortLabel: 'Discharge',
        duration: 1.8,
        observation: 'The tube releases two male gametes into the cytoplasm of the receiving synergid.',
    },
    {
        key: 'SYNGAMY',
        label: 'Syngamy',
        shortLabel: 'Syngamy',
        duration: 1.7,
        observation: 'One male gamete fuses with the egg cell to form the diploid zygote.',
    },
    {
        key: 'TRIPLE_FUSION',
        label: 'Triple fusion',
        shortLabel: 'Triple fusion',
        duration: 1.7,
        observation: 'The second male gamete fuses with the secondary nucleus to form triploid PEN.',
    },
    {
        key: 'SYNERGID_DEGEN',
        label: 'Synergid and antipodal degeneration',
        shortLabel: 'Degeneration',
        duration: 1.6,
        observation: 'Synergids and antipodal cells fade after fertilisation; zygote division waits for endosperm initiation.',
    },
    {
        key: 'FREE_NUCLEAR_ENDOSPERM',
        label: 'Free-nuclear endosperm',
        shortLabel: 'Free nuclear',
        duration: 3,
        observation: 'PEN divides repeatedly without wall formation. Coconut water is free-nuclear endosperm.',
    },
    {
        key: 'CELLULAR_ENDOSPERM',
        label: 'Cellular endosperm',
        shortLabel: 'Cellular',
        duration: 2.4,
        observation: 'Cell walls form around nuclei, converting the endosperm into cellular tissue.',
    },
    {
        key: 'EMBRYOGENY',
        label: 'Embryogeny',
        shortLabel: 'Embryogeny',
        duration: 3.4,
        observation: 'The zygote forms proembryo, globular, heart-shaped and mature embryo stages.',
    },
    {
        key: 'SEED_MATURE',
        label: 'Seed maturation',
        shortLabel: 'Seed',
        duration: 2.8,
        observation: 'The ovule becomes a seed; integuments form testa and tegmen and the micropyle persists.',
    },
    {
        key: 'FRUIT',
        label: 'Fruit formation',
        shortLabel: 'Fruit',
        duration: 2.4,
        observation: 'The ovary becomes a fruit and the ovary wall becomes the pericarp.',
    },
];

const SPECIES: Record<SpeciesKey, SpeciesMeta> = {
    maize: {
        label: 'Maize',
        seedType: 'Albuminous monocot',
        embryoType: 'monocot',
        endospermNote: 'Bulky persistent endosperm with aleurone layer',
        reserveLabel: 'Aleurone + endosperm',
        color: '#ca8a04',
    },
    pea: {
        label: 'Pea',
        seedType: 'Non-albuminous dicot',
        embryoType: 'dicot',
        endospermNote: 'Endosperm consumed; food stored in two cotyledons',
        reserveLabel: 'Fleshy cotyledons',
        color: '#16a34a',
    },
    castor: {
        label: 'Castor',
        seedType: 'Albuminous dicot',
        embryoType: 'dicot',
        endospermNote: 'Persistent endosperm with thin dicot cotyledons',
        reserveLabel: 'Persistent endosperm',
        color: '#7c3aed',
    },
    coconut: {
        label: 'Coconut',
        seedType: 'Albuminous monocot',
        embryoType: 'monocot',
        endospermNote: 'Water is free-nuclear; meat is cellular endosperm',
        reserveLabel: 'Water to meat',
        color: '#0891b2',
    },
};

const DEFAULT_SNAPSHOT: Snapshot = {
    stageLabel: STAGES[0].label,
    tubeGrowth: 0,
    zygote: false,
    pen: false,
    seedType: SPECIES.maize.seedType,
    endosperm: 'Not started',
    embryo: 'Egg apparatus',
};

const DoubleFertilisationSeedDevelopmentLab: React.FC<DoubleFertilisationSeedDevelopmentLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef(0);
    const snapshotClockRef = useRef(0);
    const stageIndexRef = useRef(0);
    const stageProgressRef = useRef(0);

    const [playing, setPlaying] = useState(true);
    const [stageIndex, setStageIndex] = useState(0);
    const [stageProgress, setStageProgress] = useState(0);
    const [species, setSpecies] = useState<SpeciesKey>('maize');
    const [pollenMode, setPollenMode] = useState<PollenMode>('twoCell');
    const [showLabels, setShowLabels] = useState(true);
    const [showPloidy, setShowPloidy] = useState(true);
    const [zoomSac, setZoomSac] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [snapshot, setSnapshot] = useState<Snapshot>(DEFAULT_SNAPSHOT);

    const currentStage = STAGES[stageIndex];
    const speciesMeta = SPECIES[species];

    const resetLab = useCallback(() => {
        stageIndexRef.current = 0;
        stageProgressRef.current = 0;
        setPlaying(true);
        setStageIndex(0);
        setStageProgress(0);
        setSpecies('maize');
        setPollenMode('twoCell');
        setShowLabels(true);
        setShowPloidy(true);
        setZoomSac(true);
        setSpeed(1);
        setSnapshot(DEFAULT_SNAPSHOT);
        lastRef.current = 0;
        snapshotClockRef.current = 0;
    }, []);

    const jumpToStage = useCallback((index: number) => {
        const next = clamp(index, 0, STAGES.length - 1);
        stageIndexRef.current = next;
        stageProgressRef.current = 0;
        setStageIndex(next);
        setStageProgress(0);
    }, []);

    const nextStage = useCallback(() => {
        const next = Math.min(STAGES.length - 1, stageIndexRef.current + 1);
        stageIndexRef.current = next;
        stageProgressRef.current = 0;
        setStageIndex(next);
        setStageProgress(0);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const tick = (now: number) => {
            const last = lastRef.current || now;
            const dt = Math.min(0.1, (now - last) / 1000);
            lastRef.current = now;

            if (playing) {
                const index = stageIndexRef.current;
                const duration = STAGES[index].duration;
                const next = stageProgressRef.current + (dt * speed) / duration;
                if (next >= 1 && index < STAGES.length - 1) {
                    stageIndexRef.current = index + 1;
                    stageProgressRef.current = 0;
                    setStageIndex(index + 1);
                    setStageProgress(0);
                } else {
                    stageProgressRef.current = index === STAGES.length - 1 ? next % 1 : Math.min(1, next);
                    setStageProgress(stageProgressRef.current);
                }
            }

            drawWorld(ctx, {
                time: now / 1000,
                stageIndex: stageIndexRef.current,
                stageProgress: stageProgressRef.current,
                species,
                pollenMode,
                showLabels,
                showPloidy,
                zoomSac,
            });

            snapshotClockRef.current += dt;
            if (snapshotClockRef.current > 0.16) {
                snapshotClockRef.current = 0;
                setSnapshot(makeSnapshot(stageIndexRef.current, stageProgressRef.current, species));
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastRef.current = 0;
        };
    }, [playing, pollenMode, showLabels, showPloidy, species, speed, zoomSac]);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[350px] overflow-y-auto pr-1 min-[1800px]:block">
            <div className="flex flex-col gap-2.5 pt-9">
                <AsideCard title="NCERT Fig 1.10-1.13" subtitle="Route from stigma to embryo sac" icon={<Activity size={15} className="text-emerald-700" />}>
                    <StageRail stageIndex={stageIndex} />
                </AsideCard>
                <AsideCard title="Embryo Sac Map" subtitle="Polygonum type: 7-celled, 8-nucleate" icon={<Eye size={15} className="text-pink-700" />}>
                    <EmbryoSacMini activeStage={currentStage.key} />
                </AsideCard>
                <AsideCard title="Seed Outcomes" subtitle="Albuminous vs non-albuminous" icon={<Sprout size={15} className="text-amber-700" />}>
                    <SeedCompare selected={species} />
                </AsideCard>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[318px] overflow-y-auto pl-1 min-[1800px]:block">
            <div className="flex flex-col gap-3 pr-16">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="mb-1 flex items-center gap-2 text-base font-extrabold text-emerald-950">
                        <Info size={16} />
                        NCERT Ch 1
                    </div>
                    <div className="mb-3 text-xs font-semibold text-emerald-700">Sexual reproduction in flowering plants</div>
                    <div className="space-y-2 text-xs font-semibold leading-snug text-emerald-950">
                        <MiniFact color="#16a34a" text="Pollen tube enters through micropyle, then into one synergid guided by filiform apparatus." />
                        <MiniFact color="#2563eb" text="Syngamy: male gamete (n) + egg (n) -> zygote (2n)." />
                        <MiniFact color="#d97706" text="Triple fusion: male gamete (n) + secondary nucleus (2n) -> PEN (3n)." />
                        <MiniFact color="#7c3aed" text="Double fertilisation was discovered by S.G. Nawaschin in 1898 and is unique to angiosperms." />
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
                    <div className="grid gap-2">
                        <ValueRow label="Stage" value={snapshot.stageLabel} tint="#f8fafc" color="#334155" />
                        <ValueRow label="Tube growth" value={`${snapshot.tubeGrowth}%`} tint="#ecfdf5" color="#047857" />
                        <ValueRow label="Ploidy events" value={`Zygote ${snapshot.zygote ? '2n' : '--'} / PEN ${snapshot.pen ? '3n' : '--'}`} tint="#fef3c7" color="#b45309" />
                        <ValueRow label="Endosperm" value={snapshot.endosperm} tint="#ecfeff" color="#0891b2" />
                        <ValueRow label="Embryo" value={snapshot.embryo} tint="#fdf2f8" color="#be185d" />
                        <ValueRow label="Seed type" value={snapshot.seedType} tint="#f5f3ff" color={speciesMeta.color} />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-900">
                        <Leaf size={16} className="text-emerald-700" />
                        Live observation
                    </div>
                    <div className="text-sm font-semibold leading-snug text-slate-700">{currentStage.observation}</div>
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
                    aria-label="Canvas simulation of double fertilisation and seed development"
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
        <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto bg-white text-slate-900">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
                <Leaf size={16} className="text-emerald-700" />
                Double Fertilisation Bench
            </div>
            <div className="grid flex-1 min-h-0 gap-2.5 md:grid-cols-2 xl:grid-cols-[1.6fr_1.1fr_1fr_1.2fr_1.1fr]">
                <ControlGroup icon={<Activity size={14} className="text-emerald-700" />} label="Stage stepper">
                    <div className="grid grid-cols-3 gap-1.5">
                        {[0, 2, 4, 5, 6, 8, 10, 11, 12].map((index) => (
                            <SegmentButton key={STAGES[index].key} active={stageIndex === index} color="#059669" onClick={() => jumpToStage(index)}>
                                {STAGES[index].shortLabel}
                            </SegmentButton>
                        ))}
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Sprout size={14} className="text-amber-700" />} label="Seed species">
                    <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(SPECIES) as SpeciesKey[]).map((item) => (
                            <SegmentButton key={item} active={species === item} color={SPECIES[item].color} onClick={() => setSpecies(item)}>
                                {SPECIES[item].label}
                            </SegmentButton>
                        ))}
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Zap size={14} className="text-blue-700" />} label="Pollen state">
                    <div className="grid grid-cols-2 gap-1.5">
                        <SegmentButton active={pollenMode === 'twoCell'} color="#2563eb" onClick={() => setPollenMode('twoCell')}>2-cell</SegmentButton>
                        <SegmentButton active={pollenMode === 'threeCell'} color="#7c3aed" onClick={() => setPollenMode('threeCell')}>3-cell</SegmentButton>
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Tags size={14} className="text-slate-700" />} label="Overlays">
                    <div className="grid grid-cols-1 gap-1.5">
                        <ToggleButton active={showLabels} color="#0f766e" onClick={() => setShowLabels((value) => !value)}>Labels</ToggleButton>
                        <ToggleButton active={showPloidy} color="#d97706" onClick={() => setShowPloidy((value) => !value)}>Ploidy badges</ToggleButton>
                        <ToggleButton active={zoomSac} color="#be185d" onClick={() => setZoomSac((value) => !value)}>Embryo sac zoom</ToggleButton>
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Gauge size={14} className="text-slate-700" />} label="Timeline">
                    <div className="space-y-2">
                        <SliderControl label="Speed" value={speed} min={0.25} max={3} step={0.25} suffix="x" onChange={setSpeed} />
                        <button
                            type="button"
                            onClick={nextStage}
                            className="flex min-h-[32px] w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-800 transition-colors hover:bg-emerald-100"
                        >
                            <StepForward size={13} />
                            Next stage
                        </button>
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
            controlsAreaFlex="0 0 clamp(196px, 26%, 258px)"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1360px)] overflow-y-auto overscroll-contain bg-white border border-slate-200 shadow-2xl rounded-2xl md:rounded-3xl p-3 md:p-4"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
        />
    );
};

const makeSnapshot = (stageIndex: number, progress: number, species: SpeciesKey): Snapshot => {
    const stage = STAGES[stageIndex];
    const tubeGrowth = Math.round(computeTubeGrowth(stageIndex, progress));
    const zygote = isStageAtLeast(stageIndex, progress, 'SYNGAMY', 0.55);
    const pen = isStageAtLeast(stageIndex, progress, 'TRIPLE_FUSION', 0.55);
    const embryo = stageIndex < 10
        ? zygote ? 'Zygote resting' : 'Egg apparatus'
        : stageIndex === 10
            ? progress < 0.34 ? 'Globular' : progress < 0.68 ? 'Heart-shaped' : 'Mature embryo'
            : 'Mature embryo';
    const endosperm = stageIndex < 8
        ? pen ? 'PEN formed' : 'Not started'
        : stageIndex === 8
            ? 'Free-nuclear'
            : 'Cellular';
    return {
        stageLabel: stage.label,
        tubeGrowth,
        zygote,
        pen,
        seedType: SPECIES[species].seedType,
        endosperm,
        embryo,
    };
};

const drawWorld = (
    ctx: CanvasRenderingContext2D,
    config: {
        time: number;
        stageIndex: number;
        stageProgress: number;
        species: SpeciesKey;
        pollenMode: PollenMode;
        showLabels: boolean;
        showPloidy: boolean;
        zoomSac: boolean;
    },
) => {
    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx);
    drawPistilZone(ctx, config);
    drawOvuleZone(ctx, config);
    drawDevelopmentZone(ctx, config);
    drawTopTitle(ctx, config);
};

const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#f0fdf4');
    gradient.addColorStop(0.5, '#ffffff');
    gradient.addColorStop(1, '#fef3c7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 40; x < W; x += 40) {
        ctx.globalAlpha = x % 120 === 0 ? 0.55 : 0.25;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    for (let y = 40; y < H; y += 40) {
        ctx.globalAlpha = y % 120 === 0 ? 0.55 : 0.25;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
};

const drawTopTitle = (
    ctx: CanvasRenderingContext2D,
    config: { stageIndex: number; stageProgress: number; species: SpeciesKey },
) => {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 22px Inter, Arial, sans-serif';
    ctx.fillText('Double fertilisation and endosperm formation', 42, 44);
    ctx.font = '800 12px Inter, Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`${STAGES[config.stageIndex].label} - ${SPECIES[config.species].label} seed view`, 42, 64);
    const x = 42;
    const y = 84;
    const w = 360;
    ctx.fillStyle = '#e2e8f0';
    roundRect(ctx, x, y, w, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    roundRect(ctx, x, y, w * ((config.stageIndex + config.stageProgress) / STAGES.length), 8, 4);
    ctx.fill();
    ctx.restore();
};

const drawPistilZone = (
    ctx: CanvasRenderingContext2D,
    config: { time: number; stageIndex: number; stageProgress: number; pollenMode: PollenMode; showLabels: boolean; showPloidy: boolean },
) => {
    ctx.save();
    const stigmaGradient = ctx.createLinearGradient(140, 100, 210, 220);
    stigmaGradient.addColorStop(0, '#f9a8d4');
    stigmaGradient.addColorStop(1, '#fb7185');
    ctx.fillStyle = stigmaGradient;
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(175, 125, 92, 34, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 13; i += 1) {
        const x = 96 + i * 13;
        ctx.fillStyle = i % 2 ? '#f472b6' : '#fbcfe8';
        ctx.beginPath();
        ctx.arc(x, 102 + Math.sin(i) * 8, 13, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = stigmaGradient;
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(168, 154);
    ctx.bezierCurveTo(190, 252, 195, 358, 256, 470);
    ctx.bezierCurveTo(278, 508, 330, 520, 390, 512);
    ctx.lineWidth = 50;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fda4af';
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#be123c';
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#fce7f3';
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(340, 580, 170, 74, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawPollenGrain(ctx, 174, 94, config);
    drawPollenTube(ctx, config);

    if (config.showLabels) {
        label(ctx, 'Stigma', 108, 78, '#be185d');
        label(ctx, 'Style', 230, 302, '#be185d');
        label(ctx, 'Ovary', 270, 668, '#be185d');
    }
    ctx.restore();
};

const drawPollenGrain = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    config: { time: number; stageIndex: number; stageProgress: number; pollenMode: PollenMode; showLabels: boolean; showPloidy: boolean },
) => {
    ctx.save();
    const pulse = 1 + Math.sin(config.time * 5) * 0.03;
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 28, 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i += 1) {
        const a = i * Math.PI * 2 / 14;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 25, Math.sin(a) * 20, 2.4, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-6, 0, 22, 16, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(-10, -2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2563eb';
    if (config.pollenMode === 'twoCell' && config.stageIndex < 2) {
        ctx.beginPath();
        ctx.ellipse(14, 8, 9, 5, -0.55, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(12, -7, 4.5, 0, Math.PI * 2);
        ctx.arc(18, 8, 4.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(31, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (config.showLabels) {
        label(ctx, 'Pollen', x - 38, y - 42, '#92400e');
        if (config.showPloidy) badge(ctx, 'n', x + 30, y + 30, '#2563eb');
    }
};

const drawPollenTube = (
    ctx: CanvasRenderingContext2D,
    config: { stageIndex: number; stageProgress: number; showLabels: boolean },
) => {
    const progress = computeTubeGrowth(config.stageIndex, config.stageProgress) / 100;
    if (progress <= 0) return;
    const path = [
        { x: 194, y: 112 },
        { x: 210, y: 222 },
        { x: 226, y: 360 },
        { x: 286, y: 482 },
        { x: 448, y: 520 },
        { x: 510, y: 493 },
    ];
    const points = samplePolyline(path, 95);
    const visible = Math.max(2, Math.floor(points.length * progress));
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i < visible; i += 1) {
        const alpha = 0.16 + (i / visible) * 0.72;
        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.lineWidth = 15 - (1 - i / visible) * 5;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = i > visible - 6 ? 16 : 3;
        ctx.beginPath();
        ctx.moveTo(points[i - 1].x, points[i - 1].y);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();
    }
    const tip = points[visible - 1];
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (config.showLabels && progress > 0.2) label(ctx, 'Pollen tube', 260, 430, '#166534');
    ctx.restore();
};

const drawOvuleZone = (
    ctx: CanvasRenderingContext2D,
    config: { time: number; stageIndex: number; stageProgress: number; showLabels: boolean; showPloidy: boolean; zoomSac: boolean },
) => {
    ctx.save();
    const zoom = config.zoomSac && config.stageIndex >= 4 && config.stageIndex <= 7 ? easeInOut(clamp((config.stageIndex - 4 + config.stageProgress) / 2, 0, 1)) : 0;
    const cx = lerp(626, 642, zoom);
    const cy = lerp(438, 404, zoom);
    const scale = lerp(1, 1.12, zoom);
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-626, -438);

    drawOvuleShell(ctx, config);
    drawEmbryoSac(ctx, config);
    drawMaleGametes(ctx, config);
    drawFusionFlashes(ctx, config);
    ctx.restore();
};

const drawOvuleShell = (
    ctx: CanvasRenderingContext2D,
    config: { stageIndex: number; stageProgress: number; showLabels: boolean },
) => {
    ctx.save();
    ctx.fillStyle = '#dcfce7';
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(628, 438, 194, 146, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 16;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(628, 438, 171, 124, -0.12, 0.16, Math.PI * 1.88);
    ctx.stroke();
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.ellipse(628, 438, 148, 103, -0.12, 0.2, Math.PI * 1.86);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#bbf7d0';
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(628, 438, 126, 88, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0e7490';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(632, 438, 92, 62, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#86efac';
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(462, 520);
    ctx.bezierCurveTo(410, 532, 378, 562, 360, 622);
    ctx.lineTo(394, 628);
    ctx.bezierCurveTo(408, 588, 434, 566, 478, 554);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(512, 498, 22, 18, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#16a34a';
    ctx.stroke();

    if (config.showLabels) {
        label(ctx, 'Funicle', 360, 646, '#166534');
        label(ctx, 'Hilum', 480, 530, '#166534');
        label(ctx, 'Micropyle', 506, 486, '#166534');
        label(ctx, 'Integuments', 680, 318, '#166534');
        label(ctx, 'Nucellus', 710, 530, '#166534');
        label(ctx, 'Chalaza', 660, 304, '#166534');
    }
    ctx.restore();
};

const drawEmbryoSac = (
    ctx: CanvasRenderingContext2D,
    config: { time: number; stageIndex: number; stageProgress: number; showLabels: boolean; showPloidy: boolean },
) => {
    const syngamyDone = isStageAtLeast(config.stageIndex, config.stageProgress, 'SYNGAMY', 0.55);
    const tripleDone = isStageAtLeast(config.stageIndex, config.stageProgress, 'TRIPLE_FUSION', 0.55);
    const degenerateAlpha = config.stageIndex >= 7 ? 1 - easeInOut(config.stageProgress) * 0.72 : 1;
    ctx.save();
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#ecfeff';
    ctx.beginPath();
    ctx.ellipse(632, 438, 92, 62, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawCell(ctx, 566, 472, 24, 32, '#fde2e7', '#be185d', degenerateAlpha);
    drawFiliform(ctx, 552, 494, degenerateAlpha);
    drawCell(ctx, 601, 484, 25, 32, '#fde2e7', '#be185d', degenerateAlpha);
    drawFiliform(ctx, 588, 504, degenerateAlpha);
    drawCell(ctx, 636, 482, 25, 25, syngamyDone ? '#f472b6' : '#fbcfe8', '#be185d', 1);
    if (config.showLabels) {
        label(ctx, syngamyDone ? 'Zygote' : 'Egg', 622, 532, '#be185d');
        label(ctx, 'Synergids', 530, 526, '#be185d');
    }
    if (config.showPloidy) {
        badge(ctx, syngamyDone ? '2n' : 'n', 666, 484, syngamyDone ? '#be185d' : '#2563eb');
    }

    const polarFuse = clamp((config.stageIndex - 2 + config.stageProgress) / 1.8, 0, 1);
    const p1 = { x: lerp(618, 632, polarFuse), y: lerp(428, 430, polarFuse) };
    const p2 = { x: lerp(655, 632, polarFuse), y: lerp(428, 430, polarFuse) };
    if (!tripleDone) {
        ctx.fillStyle = '#c084fc';
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, lerp(14, 19, polarFuse), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (polarFuse < 0.85) {
            ctx.beginPath();
            ctx.arc(p2.x, p2.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    } else {
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(632, 430, 27, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    if (config.showLabels) label(ctx, tripleDone ? 'PEN' : 'Secondary nucleus', 576, 398, tripleDone ? '#b45309' : '#7e22ce');
    if (config.showPloidy) badge(ctx, tripleDone ? '3n' : '2n', 666, 422, tripleDone ? '#b45309' : '#7e22ce');

    ctx.globalAlpha = degenerateAlpha;
    for (let i = 0; i < 3; i += 1) {
        drawCell(ctx, 590 + i * 34, 372 + Math.sin(i) * 8, 17, 18, '#e5e7eb', '#6b7280', degenerateAlpha);
    }
    ctx.globalAlpha = 1;
    if (config.showLabels) label(ctx, 'Antipodals', 568, 344, '#475569');
    ctx.restore();
};

const drawMaleGametes = (
    ctx: CanvasRenderingContext2D,
    config: { time: number; stageIndex: number; stageProgress: number; showLabels: boolean; showPloidy: boolean },
) => {
    if (config.stageIndex < 4) return;
    const discharge = clamp(config.stageIndex - 4 + config.stageProgress, 0, 1);
    const syngamyMove = config.stageIndex === 5 ? easeInOut(config.stageProgress) : config.stageIndex > 5 ? 1 : 0;
    const tripleMove = config.stageIndex === 6 ? easeInOut(config.stageProgress) : config.stageIndex > 6 ? 1 : 0;
    const start1 = { x: lerp(528, 574, discharge), y: lerp(508, 482, discharge) };
    const start2 = { x: lerp(516, 574, discharge), y: lerp(530, 496, discharge) };
    const g1 = { x: lerp(start1.x, 636, syngamyMove), y: lerp(start1.y, 482, syngamyMove) };
    const g2 = { x: lerp(start2.x, 632, tripleMove), y: lerp(start2.y, 430, tripleMove) };
    drawGamete(ctx, g1, 'Male 1', config.time, config.showLabels && config.stageIndex <= 5, config.showPloidy);
    drawGamete(ctx, g2, 'Male 2', config.time + 0.6, config.showLabels && config.stageIndex <= 6, config.showPloidy);
};

const drawFusionFlashes = (
    ctx: CanvasRenderingContext2D,
    config: { stageIndex: number; stageProgress: number },
) => {
    if (config.stageIndex === 5 && config.stageProgress > 0.42) {
        drawFlash(ctx, 636, 482, (config.stageProgress - 0.42) / 0.58, '#ec4899');
    }
    if (config.stageIndex === 6 && config.stageProgress > 0.42) {
        drawFlash(ctx, 632, 430, (config.stageProgress - 0.42) / 0.58, '#f59e0b');
    }
};

const drawDevelopmentZone = (
    ctx: CanvasRenderingContext2D,
    config: { time: number; stageIndex: number; stageProgress: number; species: SpeciesKey; showLabels: boolean; showPloidy: boolean },
) => {
    ctx.save();
    ctx.fillStyle = '#fffbeb';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    roundRect(ctx, 865, 114, 356, 580, 28);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#78350f';
    ctx.font = '900 17px Inter, Arial, sans-serif';
    ctx.fillText('Seed and fruit development', 898, 150);
    ctx.font = '800 12px Inter, Arial, sans-serif';
    ctx.fillStyle = '#92400e';
    ctx.fillText(SPECIES[config.species].seedType, 898, 170);

    drawEndospermPanel(ctx, config);
    drawEmbryoPanel(ctx, config);
    drawSeedPanel(ctx, config);
    drawFruitPanel(ctx, config);
    ctx.restore();
};

const drawEndospermPanel = (
    ctx: CanvasRenderingContext2D,
    config: { time: number; stageIndex: number; stageProgress: number; species: SpeciesKey; showLabels: boolean },
) => {
    const active = config.stageIndex >= 8;
    const cellular = config.stageIndex > 9 || (config.stageIndex === 9 && config.stageProgress > 0.15);
    ctx.save();
    ctx.fillStyle = active ? '#ecfeff' : '#f8fafc';
    ctx.strokeStyle = active ? '#0891b2' : '#cbd5e1';
    ctx.lineWidth = 2;
    roundRect(ctx, 898, 194, 288, 138, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0e7490';
    ctx.font = '900 13px Inter, Arial, sans-serif';
    ctx.fillText(active ? (cellular ? 'Cellular endosperm' : 'Free-nuclear endosperm') : 'Endosperm waits for PEN', 916, 220);
    const cx = 1042;
    const cy = 270;
    ctx.fillStyle = '#cffafe';
    ctx.strokeStyle = '#0891b2';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 96, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (active) {
        for (let i = 0; i < 22; i += 1) {
            const angle = i * 1.73 + config.time * 0.6;
            const r = 12 + (i % 6) * 12;
            const px = cx + Math.cos(angle) * r * 1.05;
            const py = cy + Math.sin(angle * 1.3) * r * 0.44;
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(px, py, 4.5, 0, Math.PI * 2);
            ctx.fill();
        }
        if (cellular) {
            const wall = config.stageIndex === 9 ? easeInOut(config.stageProgress) : 1;
            ctx.strokeStyle = `rgba(22, 163, 74, ${wall})`;
            ctx.lineWidth = 2;
            for (let x = cx - 72; x <= cx + 72; x += 24) {
                ctx.beginPath();
                ctx.moveTo(x, cy - 33);
                ctx.lineTo(x, cy + 33);
                ctx.stroke();
            }
            for (let y = cy - 24; y <= cy + 24; y += 18) {
                ctx.beginPath();
                ctx.moveTo(cx - 88, y);
                ctx.lineTo(cx + 88, y);
                ctx.stroke();
            }
        }
    }
    ctx.restore();
};

const drawEmbryoPanel = (
    ctx: CanvasRenderingContext2D,
    config: { stageIndex: number; stageProgress: number; species: SpeciesKey },
) => {
    const progress = config.stageIndex < 10 ? 0 : config.stageIndex === 10 ? config.stageProgress : 1;
    ctx.save();
    ctx.fillStyle = progress > 0 ? '#fdf2f8' : '#f8fafc';
    ctx.strokeStyle = progress > 0 ? '#ec4899' : '#cbd5e1';
    ctx.lineWidth = 2;
    roundRect(ctx, 898, 350, 288, 122, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#be185d';
    ctx.font = '900 13px Inter, Arial, sans-serif';
    ctx.fillText('Embryogeny', 916, 376);
    drawEmbryoShape(ctx, 1042, 420, progress, config.species);
    ctx.restore();
};

const drawSeedPanel = (
    ctx: CanvasRenderingContext2D,
    config: { stageIndex: number; stageProgress: number; species: SpeciesKey; showLabels: boolean },
) => {
    const progress = config.stageIndex < 11 ? 0 : config.stageIndex === 11 ? config.stageProgress : 1;
    ctx.save();
    ctx.fillStyle = progress > 0 ? '#fff7ed' : '#f8fafc';
    ctx.strokeStyle = progress > 0 ? SPECIES[config.species].color : '#cbd5e1';
    ctx.lineWidth = 2;
    roundRect(ctx, 898, 492, 288, 124, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SPECIES[config.species].color;
    ctx.font = '900 13px Inter, Arial, sans-serif';
    ctx.fillText(`${SPECIES[config.species].label} seed`, 916, 518);
    if (progress > 0) drawSeedCrossSection(ctx, 1042, 560, progress, config.species);
    ctx.restore();
};

const drawFruitPanel = (
    ctx: CanvasRenderingContext2D,
    config: { stageIndex: number; stageProgress: number; species: SpeciesKey },
) => {
    const progress = config.stageIndex < 12 ? 0 : config.stageProgress;
    ctx.save();
    ctx.fillStyle = progress > 0 ? '#f0fdf4' : '#f8fafc';
    ctx.strokeStyle = progress > 0 ? '#16a34a' : '#cbd5e1';
    ctx.lineWidth = 2;
    roundRect(ctx, 898, 636, 288, 42, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#166534';
    ctx.font = '900 12px Inter, Arial, sans-serif';
    ctx.fillText(progress > 0 ? 'Ovary wall -> pericarp; ovary -> fruit' : 'Fruit forms after seed maturation', 916, 662);
    if (progress > 0) {
        ctx.fillStyle = '#86efac';
        ctx.strokeStyle = '#16a34a';
        ctx.beginPath();
        ctx.ellipse(1154, 658, 18 + progress * 8, 12 + progress * 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
};

const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, stroke: string, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
};

const drawFiliform = (ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 7; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + i * 4, y);
        ctx.lineTo(x + i * 2, y + 15);
        ctx.stroke();
    }
    ctx.restore();
};

const drawGamete = (ctx: CanvasRenderingContext2D, point: Dot, name: string, time: number, showLabel: boolean, showPloidy: boolean) => {
    ctx.save();
    ctx.shadowColor = '#2563eb';
    ctx.shadowBlur = 14 + Math.sin(time * 6) * 3;
    ctx.fillStyle = '#2563eb';
    ctx.strokeStyle = '#dbeafe';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (showLabel) label(ctx, name, point.x - 24, point.y - 24, '#1d4ed8');
    if (showPloidy) badge(ctx, 'n', point.x + 12, point.y + 8, '#2563eb');
    ctx.restore();
};

const drawFlash = (ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string) => {
    const k = clamp(t, 0, 1);
    const radius = 12 + k * 70;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `${color}aa`);
    gradient.addColorStop(0.42, `${color}44`);
    gradient.addColorStop(1, `${color}00`);
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 11; i += 1) {
        const angle = i * Math.PI * 2 / 11;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * radius * 0.72, y + Math.sin(angle) * radius * 0.72, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

const drawEmbryoShape = (ctx: CanvasRenderingContext2D, x: number, y: number, progress: number, species: SpeciesKey) => {
    ctx.save();
    const t = clamp(progress, 0, 1);
    if (t <= 0) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '900 11px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('zygote waits', x, y + 4);
        ctx.restore();
        return;
    }
    ctx.fillStyle = '#ec4899';
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 3;
    if (t < 0.34) {
        const r = 16 + t * 36;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        label(ctx, 'Globular', x - 30, y + 54, '#be185d');
    } else if (t < 0.68) {
        const k = (t - 0.34) / 0.34;
        ctx.beginPath();
        ctx.moveTo(x, y + 30);
        ctx.bezierCurveTo(x - 58, y - 10 - k * 18, x - 26, y - 55, x, y - 18);
        ctx.bezierCurveTo(x + 26, y - 55, x + 58, y - 10 - k * 18, x, y + 30);
        ctx.fill();
        ctx.stroke();
        label(ctx, 'Heart-shaped', x - 42, y + 54, '#be185d');
    } else {
        drawMatureEmbryo(ctx, x, y, species, 0.8);
        label(ctx, 'Mature embryo', x - 45, y + 54, '#be185d');
    }
    ctx.restore();
};

const drawMatureEmbryo = (ctx: CanvasRenderingContext2D, x: number, y: number, species: SpeciesKey, scale: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const meta = SPECIES[species];
    if (meta.embryoType === 'dicot') {
        ctx.fillStyle = '#86efac';
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(-28, -4, 34, 50, -0.36, 0, Math.PI * 2);
        ctx.ellipse(28, -4, 34, 50, 0.36, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#db2777';
        ctx.beginPath();
        ctx.ellipse(0, 28, 12, 44, 0, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#86efac';
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(-16, 0, 25, 55, -0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.ellipse(26, -16, 14, 26, 0, 0, Math.PI * 2);
        ctx.ellipse(28, 32, 13, 23, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

const drawSeedCrossSection = (ctx: CanvasRenderingContext2D, x: number, y: number, progress: number, species: SpeciesKey) => {
    const meta = SPECIES[species];
    ctx.save();
    ctx.globalAlpha = clamp(progress * 1.6, 0, 1);
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(x, y, 94, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (species === 'maize' || species === 'coconut') {
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.ellipse(x - 10, y, 66, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(x - 10, y, 72, 32, 0, 0, Math.PI * 2);
        ctx.stroke();
        drawMatureEmbryo(ctx, x + 52, y + 5, species, 0.38);
        label(ctx, species === 'maize' ? 'Aleurone' : 'Meat', x - 72, y - 34, '#92400e');
        label(ctx, 'Scutellum', x + 28, y + 46, '#166534');
    } else {
        ctx.fillStyle = species === 'pea' ? '#86efac' : '#ddd6fe';
        ctx.beginPath();
        ctx.ellipse(x - 28, y, 38, 32, -0.2, 0, Math.PI * 2);
        ctx.ellipse(x + 28, y, 38, 32, 0.2, 0, Math.PI * 2);
        ctx.fill();
        drawMatureEmbryo(ctx, x, y + 6, species, 0.3);
        label(ctx, species === 'pea' ? 'Cotyledons' : 'Endosperm', x - 58, y - 36, meta.color);
    }
    label(ctx, 'Testa/Tegmen', x - 86, y + 50, '#78350f');
    label(ctx, 'Micropyle', x + 56, y - 38, '#78350f');
    ctx.restore();
};

const StageRail: React.FC<{ stageIndex: number }> = ({ stageIndex }) => (
    <div className="space-y-1.5">
        {[
            ['Stigma', 0],
            ['Tube in style', 2],
            ['Micropyle', 3],
            ['Syngamy', 5],
            ['Triple fusion', 6],
            ['Endosperm', 8],
            ['Embryo', 10],
            ['Seed/Fruit', 11],
        ].map(([labelText, index]) => (
            <div key={labelText} className="grid grid-cols-[28px_1fr] items-center gap-2 text-xs font-black text-slate-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px]" style={{ background: stageIndex >= Number(index) ? '#dcfce7' : '#f1f5f9', color: stageIndex >= Number(index) ? '#166534' : '#64748b' }}>
                    {Number(index) + 1}
                </span>
                <span>{labelText}</span>
            </div>
        ))}
    </div>
);

const EmbryoSacMini: React.FC<{ activeStage: StageKey }> = ({ activeStage }) => {
    const fused = ['TRIPLE_FUSION', 'SYNERGID_DEGEN', 'FREE_NUCLEAR_ENDOSPERM', 'CELLULAR_ENDOSPERM', 'EMBRYOGENY', 'SEED_MATURE', 'FRUIT'].includes(activeStage);
    return (
        <svg viewBox="0 0 292 156" className="h-[156px] w-full">
            <ellipse cx="146" cy="78" rx="116" ry="58" fill="#ecfeff" stroke="#0891b2" strokeWidth="3" />
            <circle cx="94" cy="96" r="16" fill="#fde2e7" stroke="#be185d" strokeWidth="2" />
            <circle cx="122" cy="102" r="16" fill="#fde2e7" stroke="#be185d" strokeWidth="2" />
            <circle cx="150" cy="100" r="16" fill="#fbcfe8" stroke="#be185d" strokeWidth="2" />
            <circle cx="146" cy="74" r="19" fill={fused ? '#f59e0b' : '#c084fc'} stroke={fused ? '#b45309' : '#7e22ce'} strokeWidth="2" />
            {[116, 146, 176].map((x) => <circle key={x} cx={x} cy="44" r="11" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />)}
            <text x="76" y="134" fontSize="10" fontWeight="900" fill="#be185d">egg apparatus</text>
            <text x="112" y="24" fontSize="10" fontWeight="900" fill="#64748b">3 antipodals</text>
            <text x="174" y="78" fontSize="10" fontWeight="900" fill={fused ? '#b45309' : '#7e22ce'}>{fused ? 'PEN 3n' : 'polar nuclei'}</text>
        </svg>
    );
};

const SeedCompare: React.FC<{ selected: SpeciesKey }> = ({ selected }) => (
    <div className="space-y-2">
        {(Object.keys(SPECIES) as SpeciesKey[]).map((key) => (
            <div key={key} className="rounded-xl border px-3 py-2 text-xs font-bold" style={{ borderColor: selected === key ? SPECIES[key].color : '#e2e8f0', background: selected === key ? '#f8fafc' : '#ffffff', color: '#334155' }}>
                <div className="flex items-center justify-between gap-2">
                    <span className="font-black" style={{ color: SPECIES[key].color }}>{SPECIES[key].label}</span>
                    <span>{SPECIES[key].seedType}</span>
                </div>
                <div className="mt-1 text-[11px] leading-snug text-slate-600">{SPECIES[key].endospermNote}</div>
            </div>
        ))}
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
        className="min-h-[30px] w-full rounded-lg border px-2.5 py-1.5 text-xs font-black transition-colors"
        style={{
            background: active ? color : '#ffffff',
            borderColor: active ? color : '#e2e8f0',
            color: active ? '#ffffff' : '#334155',
        }}
    >
        {children}
    </button>
);

const SliderControl: React.FC<{ label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }> = ({ label, value, min, max, step, suffix, onChange }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-600">{label}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-black text-slate-700">{value.toFixed(value % 1 ? 2 : 0)}{suffix}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full accent-emerald-600"
        />
    </div>
);

const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const width = Math.max(48, text.length * 7.2 + 14);
    roundRect(ctx, x - 4, y - 15, width, 22, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '900 11px Inter, Arial, sans-serif';
    ctx.fillText(text, x + 3, y);
    ctx.restore();
};

const badge = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 10px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 3);
    ctx.restore();
};

const computeTubeGrowth = (stageIndex: number, progress: number) => {
    const key = STAGES[stageIndex].key;
    if (key === 'POLLINATION') return 0;
    if (key === 'POLLEN_GERMINATION') return progress * 24;
    if (key === 'TUBE_GROWTH_STYLE') return 24 + progress * 56;
    if (key === 'TUBE_ENTRY_SYNERGID') return 80 + progress * 20;
    if (stageIndex > stageIndexOf('TUBE_ENTRY_SYNERGID')) return 100;
    return 0;
};

const isStageAtLeast = (stageIndex: number, progress: number, key: StageKey, threshold = 0) => {
    const target = stageIndexOf(key);
    return stageIndex > target || (stageIndex === target && progress >= threshold);
};

const stageIndexOf = (key: StageKey) => STAGES.findIndex((stage) => stage.key === key);

const samplePolyline = (points: Dot[], count: number): Dot[] => {
    const sampled: Dot[] = [];
    for (let i = 0; i < count; i += 1) {
        const t = i / Math.max(1, count - 1);
        sampled.push(bezier(t, points));
    }
    return sampled;
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);
const easeInOut = (t: number) => t * t * (3 - 2 * t);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default DoubleFertilisationSeedDevelopmentLab;
