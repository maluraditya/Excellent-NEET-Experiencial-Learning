import React, { useMemo, useState } from 'react';
import {
    Activity,
    BookOpen,
    Eye,
    EyeOff,
    FlaskConical,
    Leaf,
    Microscope,
    Pause,
    Play,
    RefreshCcw,
    Search,
    SlidersHorizontal,
    Waves,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type AlgaeClass = 'Chlorophyceae' | 'Phaeophyceae' | 'Rhodophyceae';
type ReproMode = 'Vegetative' | 'Asexual' | 'Sexual';
type ViewMode = 'habitat' | 'motility' | 'lifeCycle' | 'compare';
type SpeedMode = 1 | 2 | 3;

interface AlgaeLabProps {
    topic: any;
    onExit: () => void;
}

interface AlgaeInfo {
    name: AlgaeClass;
    commonName: string;
    shortName: string;
    color: string;
    deepColor: string;
    paleColor: string;
    borderColor: string;
    textColor: string;
    pigments: string;
    storage: string;
    cellWall: string;
    flagella: string;
    habitat: string;
    examples: string;
    habit: string;
    vegetative: string;
    asexual: string;
    sexual: string;
    hydrocolloid: string;
}

const ALGAE_DATA: Record<AlgaeClass, AlgaeInfo> = {
    Chlorophyceae: {
        name: 'Chlorophyceae',
        commonName: 'Green algae',
        shortName: 'Green',
        color: '#22c55e',
        deepColor: '#166534',
        paleColor: '#dcfce7',
        borderColor: '#86efac',
        textColor: 'text-green-800',
        pigments: 'Chlorophyll a, b',
        storage: 'Starch in pyrenoids',
        cellWall: 'Cellulose; outer pectose layer in green algae',
        flagella: '2-8 equal, apical',
        habitat: 'Fresh water, brackish water, salt water',
        examples: 'Chlamydomonas, Volvox, Ulothrix, Spirogyra, Chara',
        habit: 'Unicellular, colonial or filamentous forms',
        vegetative: 'Fragmentation can make each fragment grow into a thallus.',
        asexual: 'Flagellated zoospores are produced in zoosporangia.',
        sexual: 'Sexual reproduction may be isogamous, anisogamous or oogamous.',
        hydrocolloid: 'Key NCERT use: protein-rich Chlorella as a supplement.',
    },
    Phaeophyceae: {
        name: 'Phaeophyceae',
        commonName: 'Brown algae',
        shortName: 'Brown',
        color: '#b45309',
        deepColor: '#78350f',
        paleColor: '#fef3c7',
        borderColor: '#fbbf24',
        textColor: 'text-amber-800',
        pigments: 'Chlorophyll a, c and fucoxanthin',
        storage: 'Mannitol and laminarin',
        cellWall: 'Cellulose wall with algin coating',
        flagella: '2 unequal, lateral',
        habitat: 'Mostly marine; fresh water forms are rare',
        examples: 'Ectocarpus, Dictyota, Laminaria, Sargassum, Fucus',
        habit: 'Filamentous forms to large kelps with holdfast, stipe and frond',
        vegetative: 'Fragmentation can regenerate portions of the thallus.',
        asexual: 'Pear-shaped biflagellate zoospores swim with unequal lateral flagella.',
        sexual: 'Gametes are pyriform and bear two laterally attached flagella.',
        hydrocolloid: 'Brown algae produce algin commercially.',
    },
    Rhodophyceae: {
        name: 'Rhodophyceae',
        commonName: 'Red algae',
        shortName: 'Red',
        color: '#e11d48',
        deepColor: '#881337',
        paleColor: '#ffe4e6',
        borderColor: '#fda4af',
        textColor: 'text-rose-800',
        pigments: 'Chlorophyll a, d and phycoerythrin',
        storage: 'Floridean starch',
        cellWall: 'Cellulose, pectin and polysulphate esters',
        flagella: 'Absent',
        habitat: 'Mostly marine; often in warmer seas and deeper water',
        examples: 'Polysiphonia, Porphyra, Gracilaria, Gelidium',
        habit: 'Mostly multicellular red thalli; some complex body organisation',
        vegetative: 'Fragmentation is common.',
        asexual: 'Asexual spores are non-motile.',
        sexual: 'Gametes are non-motile; sexual reproduction is oogamous.',
        hydrocolloid: 'Red algae provide carrageen; Gelidium and Gracilaria provide agar.',
    },
};

const CLASSES: AlgaeClass[] = ['Chlorophyceae', 'Phaeophyceae', 'Rhodophyceae'];
const PHASES: ReproMode[] = ['Vegetative', 'Asexual', 'Sexual'];
const VIEW_MODES: Array<{ id: ViewMode; label: string; icon: React.ReactNode }> = [
    { id: 'habitat', label: 'Habitat', icon: <Leaf size={15} /> },
    { id: 'motility', label: 'Motility', icon: <Microscope size={15} /> },
    { id: 'lifeCycle', label: 'Cycle', icon: <Activity size={15} /> },
    { id: 'compare', label: 'Compare', icon: <Search size={15} /> },
];

const AlgaeLab: React.FC<AlgaeLabProps> = ({ topic, onExit }) => {
    const [selectedClass, setSelectedClass] = useState<AlgaeClass>('Chlorophyceae');
    const [viewMode, setViewMode] = useState<ViewMode>('motility');
    const [reproMode, setReproMode] = useState<ReproMode>('Asexual');
    const [isPlaying, setIsPlaying] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [speed, setSpeed] = useState<SpeedMode>(2);
    const [resetKey, setResetKey] = useState(0);

    const activeData = ALGAE_DATA[selectedClass];
    const showPhaseControls = viewMode === 'motility' || viewMode === 'lifeCycle';
    const showMotionControls = viewMode !== 'compare';
    const speedMultiplier = speed === 1 ? 1.45 : speed === 2 ? 1 : 0.62;

    const observation = useMemo(() => {
        if (viewMode === 'compare') {
            return 'Compare pigments, stored food, cell wall chemistry, flagellar insertion and habitats across the three NCERT algae classes.';
        }
        if (reproMode === 'Vegetative') {
            return activeData.vegetative;
        }
        if (reproMode === 'Asexual') {
            return activeData.asexual;
        }
        return activeData.sexual;
    }, [activeData, reproMode, viewMode]);

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white text-slate-900 shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas width={1280} height={760} className="absolute inset-0 h-full w-full bg-white" />

                <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />

                <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 shadow-sm">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: activeData.color }} />
                    <span className="text-xs font-black text-slate-800">{activeData.name}</span>
                    <span className="text-xs font-semibold text-slate-500">{activeData.commonName}</span>
                </div>

                <div className="absolute right-5 top-5 z-30 flex items-center gap-2">
                    {viewMode !== 'compare' && (
                        <IconButton
                            label={isPlaying ? 'Pause motion' : 'Play motion'}
                            onClick={() => setIsPlaying((value) => !value)}
                        >
                            {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                        </IconButton>
                    )}
                    <IconButton
                        label="Reset simulation"
                        onClick={() => {
                            setIsPlaying(true);
                            setResetKey((value) => value + 1);
                        }}
                    >
                        <RefreshCcw size={17} />
                    </IconButton>
                </div>

                <div key={`${resetKey}-${viewMode}-${selectedClass}-${reproMode}`} className="absolute inset-0 z-10">
                    <SimulationStage
                        viewMode={viewMode}
                        selectedClass={selectedClass}
                        reproMode={reproMode}
                        activeData={activeData}
                        isPlaying={isPlaying}
                        showLabels={showLabels}
                        speedMultiplier={speedMultiplier}
                    />
                </div>
            </div>

            <LeftAside activeData={activeData} selectedClass={selectedClass} />
            <RightAside activeData={activeData} observation={observation} />
        </div>
    );

    const controlsCombo = (
        <div className="flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="grid w-full flex-1 grid-cols-[1.1fr_1.2fr_1fr] gap-3 min-[1150px]:grid-cols-[1.1fr_1.2fr_1fr_1fr]">
                <ControlGroup label="Simulation Mode">
                    <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                        {VIEW_MODES.map((mode) => (
                            <button
                                key={mode.id}
                                type="button"
                                onClick={() => setViewMode(mode.id)}
                                className={`flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-black transition ${
                                    viewMode === mode.id
                                        ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
                                        : 'text-slate-500 hover:bg-white hover:text-slate-800'
                                }`}
                                title={mode.label}
                            >
                                {mode.icon}
                                <span>{mode.label}</span>
                            </button>
                        ))}
                    </div>
                </ControlGroup>

                <ControlGroup label="Algae Class">
                    <div className="grid grid-cols-3 gap-2">
                        {CLASSES.map((algaeClass) => {
                            const data = ALGAE_DATA[algaeClass];
                            const active = selectedClass === algaeClass;
                            return (
                                <button
                                    key={algaeClass}
                                    type="button"
                                    onClick={() => setSelectedClass(algaeClass)}
                                    className={`min-h-10 rounded-xl border px-2 py-2 text-left transition ${
                                        active
                                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 text-xs font-black">
                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
                                        {data.shortName}
                                    </span>
                                    <span className={`mt-0.5 block text-[10px] font-semibold ${active ? 'text-slate-200' : 'text-slate-500'}`}>
                                        {data.name.replace('ceae', '')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </ControlGroup>

                {showPhaseControls && (
                    <ControlGroup label="Reproduction Phase">
                        <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                            {PHASES.map((phase) => (
                                <button
                                    key={phase}
                                    type="button"
                                    onClick={() => setReproMode(phase)}
                                    className={`min-h-10 rounded-lg px-2 text-xs font-black transition ${
                                        reproMode === phase
                                            ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
                                            : 'text-slate-500 hover:bg-white hover:text-slate-800'
                                    }`}
                                >
                                    {phase}
                                </button>
                            ))}
                        </div>
                    </ControlGroup>
                )}

                {showMotionControls && (
                    <ControlGroup label="Motion And Labels">
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                            <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                                <SlidersHorizontal size={16} className="text-slate-500" />
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={1}
                                    value={speed}
                                    onChange={(event) => setSpeed(Number(event.target.value) as SpeedMode)}
                                    className="w-full accent-slate-900"
                                    aria-label="Motion speed"
                                />
                                <span className="w-9 text-right text-xs font-black text-slate-700">{speed}x</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowLabels((value) => !value)}
                                className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition ${
                                    showLabels
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                }`}
                            >
                                {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
                                Labels
                            </button>
                        </div>
                    </ControlGroup>
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
            simulationStageWidth={1280}
            simulationStageHeight={760}
            controlsAreaFlex="0 0 172px"
            rootClassName="bg-white text-slate-900"
            simulationClassName="bg-white"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1240px)] overflow-hidden bg-white"
            contentToggleClassName="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        />
    );
};

interface SimulationStageProps {
    viewMode: ViewMode;
    selectedClass: AlgaeClass;
    reproMode: ReproMode;
    activeData: AlgaeInfo;
    isPlaying: boolean;
    showLabels: boolean;
    speedMultiplier: number;
}

const SimulationStage = (props: SimulationStageProps) => {
    if (props.viewMode === 'habitat') return <HabitatStage {...props} />;
    if (props.viewMode === 'lifeCycle') return <LifeCycleStage {...props} />;
    if (props.viewMode === 'compare') return <CompareStage selectedClass={props.selectedClass} />;
    return <MotilityStage {...props} />;
};

const HabitatStage = ({ selectedClass, activeData, isPlaying, showLabels, speedMultiplier }: SimulationStageProps) => {
    const duration = 5 * speedMultiplier;

    return (
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <style>{`
                @keyframes algae-sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(3deg); } }
                @keyframes water-glide { 0% { transform: translateX(-8%); } 100% { transform: translateX(8%); } }
                .algae-sway { animation: algae-sway ${duration}s ease-in-out infinite; animation-play-state: ${isPlaying ? 'running' : 'paused'}; }
                .water-glide { animation: water-glide ${duration * 1.2}s ease-in-out infinite alternate; animation-play-state: ${isPlaying ? 'running' : 'paused'}; }
            `}</style>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(14,165,233,0.12),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f8fafc_38%,#ecfeff_100%)]" />
            <div className="water-glide absolute inset-x-[-60px] bottom-0 h-28 rounded-[50%] bg-sky-100/80" />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-slate-100" />

            {selectedClass === 'Chlorophyceae' && <GreenHabitat showLabels={showLabels} />}
            {selectedClass === 'Phaeophyceae' && <BrownHabitat showLabels={showLabels} />}
            {selectedClass === 'Rhodophyceae' && <RedHabitat showLabels={showLabels} />}

            {showLabels && (
                <div className="absolute left-6 top-6 rounded-full border bg-white/90 px-3 py-1 text-xs font-black shadow-sm" style={{ borderColor: activeData.borderColor, color: activeData.deepColor }}>
                    {activeData.habitat}
                </div>
            )}
        </div>
    );
};

const GreenHabitat = ({ showLabels }: { showLabels: boolean }) => (
    <div className="absolute inset-0">
        <div className="absolute left-[17%] top-[33%] h-32 w-32 rounded-full border-[9px] border-green-300 bg-green-500 shadow-xl algae-sway">
            <div className="absolute inset-5 rounded-full border-2 border-dashed border-green-100" />
            {[0, 1, 2, 3, 4].map((dot) => (
                <span
                    key={dot}
                    className="absolute h-5 w-5 rounded-full bg-green-100/90"
                    style={{ left: `${22 + (dot % 3) * 24}%`, top: `${25 + Math.floor(dot / 3) * 35}%` }}
                />
            ))}
        </div>
        <div className="absolute bottom-14 right-[20%] h-28 w-2 rounded-full bg-green-700 algae-sway" />
        <div className="absolute bottom-14 right-[23%] h-24 w-2 rounded-full bg-green-600 algae-sway" />
        <div className="absolute bottom-14 right-[26%] h-20 w-2 rounded-full bg-green-500 algae-sway" />
        {showLabels && <ShortLabel className="left-[13%] top-[26%]" text="Volvox colony" />}
        {showLabels && <ShortLabel className="right-[15%] bottom-[30%]" text="Filamentous green algae" />}
    </div>
);

const BrownHabitat = ({ showLabels }: { showLabels: boolean }) => (
    <div className="absolute inset-0">
        <div className="absolute bottom-12 left-1/2 h-52 w-14 -translate-x-1/2 rounded-t-full bg-amber-800 algae-sway">
            <div className="absolute -left-24 top-10 h-12 w-32 rotate-12 rounded-full bg-amber-700" />
            <div className="absolute -right-24 top-20 h-12 w-32 -rotate-12 rounded-full bg-amber-700" />
            <div className="absolute -left-20 top-32 h-10 w-28 -rotate-12 rounded-full bg-amber-600" />
            <div className="absolute -right-20 top-6 h-10 w-28 rotate-12 rounded-full bg-amber-600" />
            <div className="absolute -bottom-8 left-1/2 h-10 w-28 -translate-x-1/2 rounded-[50%] bg-amber-950" />
        </div>
        {showLabels && <ShortLabel className="left-[45%] bottom-[10%]" text="Holdfast" />}
        {showLabels && <ShortLabel className="right-[25%] top-[28%]" text="Frond" />}
        {showLabels && <ShortLabel className="left-[32%] top-[42%]" text="Stipe" />}
    </div>
);

const RedHabitat = ({ showLabels }: { showLabels: boolean }) => (
    <div className="absolute inset-0">
        <div className="absolute bottom-12 left-1/2 h-48 w-5 -translate-x-1/2 rounded-full bg-rose-700 algae-sway">
            {[0, 1, 2, 3, 4, 5].map((branch) => (
                <span
                    key={branch}
                    className="absolute h-4 w-28 rounded-full bg-rose-500"
                    style={{
                        left: branch % 2 === 0 ? '-104px' : '4px',
                        top: `${20 + branch * 24}px`,
                        transform: `rotate(${branch % 2 === 0 ? -20 : 22}deg)`,
                    }}
                />
            ))}
        </div>
        {showLabels && <ShortLabel className="left-[46%] top-[22%]" text="Branched red thallus" />}
        {showLabels && <ShortLabel className="right-[20%] bottom-[20%]" text="Often marine" />}
    </div>
);

const MotilityStage = ({ selectedClass, reproMode, activeData, isPlaying, showLabels, speedMultiplier }: SimulationStageProps) => {
    const duration = selectedClass === 'Chlorophyceae' ? 3.2 * speedMultiplier : selectedClass === 'Phaeophyceae' ? 4.2 * speedMultiplier : 12 * speedMultiplier;
    const motilityLabel = reproMode === 'Vegetative'
        ? 'No motile cell shown'
        : selectedClass === 'Chlorophyceae'
            ? 'active swim: equal apical flagella'
            : selectedClass === 'Phaeophyceae'
                ? 'wobble swim: unequal lateral flagella'
                : 'passive drift: flagella absent';

    return (
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <style>{`
                @keyframes algae-grid-drift { 0% { transform: translate(0,0); } 100% { transform: translate(30px,22px); } }
                @keyframes green-swim { 0%,100% { transform: translate(0,0) rotate(0deg); } 28% { transform: translate(76px,-22px) rotate(6deg); } 55% { transform: translate(120px,28px) rotate(-4deg); } 82% { transform: translate(34px,54px) rotate(7deg); } }
                @keyframes brown-swim { 0%,100% { transform: translate(0,0) rotate(0deg); } 25% { transform: translate(54px,24px) rotate(18deg); } 50% { transform: translate(18px,70px) rotate(-14deg); } 75% { transform: translate(-46px,24px) rotate(16deg); } }
                @keyframes red-drift { 0%,100% { transform: translate(0,0); } 33% { transform: translate(3px,2px); } 66% { transform: translate(-2px,4px); } }
                @keyframes flagella-wave { 0%,100% { transform: rotate(var(--angle)); } 50% { transform: rotate(calc(var(--angle) + 22deg)); } }
                .micro-grid { animation: algae-grid-drift ${10 * speedMultiplier}s linear infinite; animation-play-state: ${isPlaying ? 'running' : 'paused'}; }
                .green-swim { animation: green-swim ${duration}s ease-in-out infinite; animation-play-state: ${isPlaying ? 'running' : 'paused'}; }
                .brown-swim { animation: brown-swim ${duration}s ease-in-out infinite; animation-play-state: ${isPlaying ? 'running' : 'paused'}; }
                .red-drift { animation: red-drift ${duration}s ease-in-out infinite; animation-play-state: ${isPlaying ? 'running' : 'paused'}; }
                .flagella-wave { animation: flagella-wave ${0.34 * speedMultiplier}s ease-in-out infinite; animation-play-state: ${isPlaying ? 'running' : 'paused'}; }
            `}</style>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#ffffff_0%,#ffffff_45%,#f8fafc_100%)]" />
            <div className="micro-grid absolute inset-[-40px] bg-[linear-gradient(rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
            <div className="absolute inset-8 rounded-[48px] border-[12px] border-slate-100 shadow-inner" />
            <div className="absolute left-8 top-8 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700">
                Microscope chamber
            </div>

            {reproMode === 'Vegetative' ? (
                <FragmentationVisual activeData={activeData} showLabels={showLabels} />
            ) : (
                <ParticleField selectedClass={selectedClass} reproMode={reproMode} showLabels={showLabels} />
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm">
                {motilityLabel}
            </div>
        </div>
    );
};

const ParticleField = ({ selectedClass, reproMode, showLabels }: { selectedClass: AlgaeClass; reproMode: ReproMode; showLabels: boolean }) => {
    const points = [
        { x: '16%', y: '24%', delay: '0s' },
        { x: '30%', y: '54%', delay: '-0.8s' },
        { x: '47%', y: '30%', delay: '-1.6s' },
        { x: '60%', y: '60%', delay: '-2.4s' },
        { x: '66%', y: '28%', delay: '-3.2s' },
        { x: '72%', y: '54%', delay: '-4s' },
    ];

    return (
        <>
            {points.map((point, index) => (
                <div key={`${point.x}-${point.y}`} className="absolute" style={{ left: point.x, top: point.y }}>
                    {selectedClass === 'Chlorophyceae' && <GreenParticle delay={point.delay} flagellaCount={reproMode === 'Asexual' ? 6 : 4} />}
                    {selectedClass === 'Phaeophyceae' && <BrownParticle delay={point.delay} />}
                    {selectedClass === 'Rhodophyceae' && <RedParticle delay={point.delay} />}
                    {showLabels && index === 0 && (
                        <ShortLabel
                            className="-left-8 -top-12"
                            text={selectedClass === 'Rhodophyceae' ? 'non-motile spore' : selectedClass === 'Phaeophyceae' ? 'lateral flagella' : 'apical flagella'}
                        />
                    )}
                </div>
            ))}
        </>
    );
};

const GreenParticle = ({ delay, flagellaCount }: { delay: string; flagellaCount: number }) => (
    <div className="green-swim relative h-16 w-16" style={{ animationDelay: delay }}>
        {Array.from({ length: flagellaCount }).map((_, index) => {
            const angle = -34 + index * (68 / Math.max(1, flagellaCount - 1));
            return (
                <span
                    key={index}
                    className="flagella-wave absolute left-1/2 top-0 h-8 w-[2px] origin-bottom rounded-full bg-green-900"
                    style={{ '--angle': `${angle}deg`, animationDelay: `${index * 0.05}s` } as React.CSSProperties}
                />
            );
        })}
        <span className="absolute inset-x-2 bottom-0 top-6 rounded-full border-2 border-green-800 bg-green-500 shadow-md" />
        <span className="absolute left-1/2 top-10 h-3 w-3 -translate-x-1/2 rounded-full bg-green-900/40" />
    </div>
);

const BrownParticle = ({ delay }: { delay: string }) => (
    <div className="brown-swim relative h-16 w-20" style={{ animationDelay: delay }}>
        <span className="absolute left-5 top-3 h-12 w-9 rounded-t-[55%] rounded-b-[48%] border-2 border-amber-950 bg-amber-700 shadow-md" />
        <span className="flagella-wave absolute left-14 top-6 h-[2px] w-12 origin-left rounded-full bg-amber-950" style={{ '--angle': '8deg' } as React.CSSProperties} />
        <span className="flagella-wave absolute left-14 top-9 h-[2px] w-7 origin-left rounded-full bg-amber-950" style={{ '--angle': '-18deg', animationDelay: '0.12s' } as React.CSSProperties} />
        <span className="absolute left-9 top-7 h-3 w-3 rounded-full bg-amber-950/45" />
    </div>
);

const RedParticle = ({ delay }: { delay: string }) => (
    <div className="red-drift relative h-12 w-12" style={{ animationDelay: delay }}>
        <span className="absolute inset-2 rounded-full border-2 border-rose-900 bg-rose-500 shadow-md" />
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-900/35" />
    </div>
);

const FragmentationVisual = ({ activeData, showLabels }: { activeData: AlgaeInfo; showLabels: boolean }) => (
    <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 620 300" className="h-[80%] w-[90%]" role="img" aria-label="Fragmentation">
            <defs>
                <linearGradient id="fragmentGradient" x1="0" x2="1">
                    <stop offset="0%" stopColor={activeData.color} stopOpacity="0.92" />
                    <stop offset="100%" stopColor={activeData.paleColor} stopOpacity="0.95" />
                </linearGradient>
            </defs>
            <path d="M92 150 C160 92 235 205 310 150 C388 90 460 204 530 150" fill="none" stroke="url(#fragmentGradient)" strokeWidth="30" strokeLinecap="round" />
            <path d="M300 118 L320 182" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
            <path d="M310 116 L310 184" stroke={activeData.deepColor} strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="220" cy="130" r="10" fill="#ffffff" opacity="0.75" />
            <circle cx="412" cy="170" r="10" fill="#ffffff" opacity="0.75" />
            <text x="310" y="238" textAnchor="middle" fontSize="22" fontWeight="800" fill="#334155">each fragment can grow into a new thallus</text>
        </svg>
        {showLabels && <ShortLabel className="left-[45%] top-[22%]" text="fragmentation" />}
    </div>
);

const LifeCycleStage = ({ selectedClass, reproMode, activeData, isPlaying, showLabels, speedMultiplier }: SimulationStageProps) => {
    const cycleNodes = [
        { id: 'Vegetative' as ReproMode, x: 260, y: 150, label: 'Fragmented thallus' },
        { id: 'Asexual' as ReproMode, x: 610, y: 150, label: selectedClass === 'Rhodophyceae' ? 'Non-motile spores' : 'Motile zoospores' },
        { id: 'Sexual' as ReproMode, x: 435, y: 440, label: selectedClass === 'Rhodophyceae' ? 'Non-motile gametes' : 'Gamete fusion' },
    ];

    return (
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <style>{`
                @keyframes dash-cycle { to { stroke-dashoffset: -46; } }
                @keyframes node-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                .cycle-dash { animation: dash-cycle ${3.5 * speedMultiplier}s linear infinite; animation-play-state: ${isPlaying ? 'running' : 'paused'}; }
                .cycle-pulse { animation: node-pulse ${2.6 * speedMultiplier}s ease-in-out infinite; animation-play-state: ${isPlaying ? 'running' : 'paused'}; transform-origin: center; }
            `}</style>
            <svg viewBox="0 0 870 560" className="absolute inset-0 h-full w-full">
                <path d="M290 165 C390 70 500 70 585 160" fill="none" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
                <path d="M592 180 C650 260 590 365 470 425" fill="none" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
                <path d="M402 425 C270 365 210 260 248 180" fill="none" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
                <path className="cycle-dash" d="M290 165 C390 70 500 70 585 160 M592 180 C650 260 590 365 470 425 M402 425 C270 365 210 260 248 180" fill="none" stroke={activeData.color} strokeWidth="5" strokeLinecap="round" strokeDasharray="20 18" />

                {cycleNodes.map((node) => {
                    const active = node.id === reproMode;
                    return (
                        <g key={node.id} className={active ? 'cycle-pulse' : ''}>
                            <circle cx={node.x} cy={node.y} r={active ? 78 : 66} fill={active ? activeData.paleColor : '#ffffff'} stroke={active ? activeData.color : '#cbd5e1'} strokeWidth={active ? 7 : 3} />
                            <text x={node.x} y={node.y - 8} textAnchor="middle" fontSize="22" fontWeight="900" fill={active ? activeData.deepColor : '#334155'}>{node.id}</text>
                            <text x={node.x} y={node.y + 24} textAnchor="middle" fontSize="16" fontWeight="700" fill="#64748b">{node.label}</text>
                        </g>
                    );
                })}
            </svg>
            {showLabels && (
                <div className="absolute bottom-7 left-1/2 max-w-[560px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm">
                    {activeData.name}: {observationForPhase(activeData, reproMode)}
                </div>
            )}
        </div>
    );
};

const CompareStage = ({ selectedClass }: { selectedClass: AlgaeClass }) => (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
            <div>
                <div className="text-lg font-black text-slate-950">NCERT Table 3.1 Comparison</div>
                <div className="text-sm font-semibold text-slate-500">Classes of algae and their main characteristics</div>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
                {ALGAE_DATA[selectedClass].name} selected
            </div>
        </div>
        <div className="grid grid-cols-[1.05fr_1fr_1fr_1fr] overflow-hidden rounded-2xl border border-slate-200 text-sm">
            <CompareHeader label="Trait" />
            {CLASSES.map((algaeClass) => (
                <React.Fragment key={algaeClass}>
                    <CompareHeader label={ALGAE_DATA[algaeClass].shortName} active={selectedClass === algaeClass} />
                </React.Fragment>
            ))}
            {[
                ['Common name', 'commonName'],
                ['Pigments', 'pigments'],
                ['Stored food', 'storage'],
                ['Cell wall', 'cellWall'],
                ['Flagella', 'flagella'],
                ['Habitat', 'habitat'],
                ['Examples', 'examples'],
            ].map(([label, field]) => (
                <React.Fragment key={label}>
                    <CompareCell strong>{label}</CompareCell>
                    {CLASSES.map((algaeClass) => (
                        <React.Fragment key={`${label}-${algaeClass}`}>
                            <CompareCell active={selectedClass === algaeClass}>
                                {String(ALGAE_DATA[algaeClass][field as keyof AlgaeInfo])}
                            </CompareCell>
                        </React.Fragment>
                    ))}
                </React.Fragment>
            ))}
        </div>
    </div>
);

const MotilityLegend = ({ selectedClass }: { selectedClass: AlgaeClass }) => (
    <div className="space-y-2">
        {CLASSES.map((algaeClass) => {
            const data = ALGAE_DATA[algaeClass];
            const active = selectedClass === algaeClass;
            return (
                <div key={algaeClass} className={`rounded-xl border px-3 py-2 ${active ? 'border-slate-900 bg-slate-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
                        <span className="text-xs font-black text-slate-800">{data.shortName}</span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{data.flagella}</div>
                </div>
            );
        })}
    </div>
);

const LeftAside = ({ activeData, selectedClass }: { activeData: AlgaeInfo; selectedClass: AlgaeClass }) => (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
        <div className="space-y-3">
            <AsideCard title="NCERT Identity" icon={<BookOpen size={16} />}>
                <FactLine label="Pigments" value={activeData.pigments} />
                <FactLine label="Stored food" value={activeData.storage} />
                <FactLine label="Cell wall" value={activeData.cellWall} />
                <FactLine label="Examples" value={activeData.examples} />
            </AsideCard>

            <AsideCard title="Motility Key" icon={<Waves size={16} />}>
                <MotilityLegend selectedClass={selectedClass} />
            </AsideCard>
        </div>
    </aside>
);

const RightAside = ({ activeData, observation }: { activeData: AlgaeInfo; observation: string }) => (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
        <div className="space-y-3">
            <AsideCard title="Observation" icon={<Eye size={16} />}>
                <p className="text-sm font-semibold leading-relaxed text-slate-700">{observation}</p>
            </AsideCard>

            <AsideCard title="Classifier Clues" icon={<FlaskConical size={16} />}>
                <FactLine label="Habitat" value={activeData.habitat} />
                <FactLine label="Flagella" value={activeData.flagella} />
                <FactLine label="Body plan" value={activeData.habit} />
                <FactLine label="Use" value={activeData.hydrocolloid} />
            </AsideCard>
        </div>
    </aside>
);

const ControlGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <section className="min-w-0">
        <div className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</div>
        {children}
    </section>
);

const AsideCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
            <span className="text-slate-500">{icon}</span>
            {title}
        </div>
        {children}
    </section>
);

const FactLine = ({ label, value }: { label: string; value: string }) => (
    <div className="border-t border-slate-100 py-2 first:border-t-0 first:pt-0 last:pb-0">
        <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
        <div className="mt-0.5 text-xs font-bold leading-snug text-slate-700">{value}</div>
    </div>
);

const IconButton = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
    <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
    >
        {children}
    </button>
);

const ShortLabel = ({ text, className }: { text: string; className: string }) => (
    <div className={`absolute rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm ${className}`}>
        {text}
    </div>
);

const CompareHeader = ({ label, active = false }: { label: string; active?: boolean }) => (
    <div className={`border-b border-r border-slate-200 px-3 py-3 text-xs font-black uppercase tracking-wide ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
        {label}
    </div>
);

const CompareCell = ({ children, active = false, strong = false }: { children: React.ReactNode; active?: boolean; strong?: boolean }) => (
    <div className={`min-h-14 border-b border-r border-slate-200 px-3 py-3 leading-snug ${active ? 'bg-slate-50' : 'bg-white'} ${strong ? 'font-black text-slate-800' : 'font-semibold text-slate-600'}`}>
        {children}
    </div>
);

function observationForPhase(activeData: AlgaeInfo, reproMode: ReproMode) {
    if (reproMode === 'Vegetative') return activeData.vegetative;
    if (reproMode === 'Asexual') return activeData.asexual;
    return activeData.sexual;
}

export default AlgaeLab;
