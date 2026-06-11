import React, { useEffect, useState } from 'react';
import {
    Activity,
    ArrowRight,
    BookOpen,
    Droplets,
    Eye,
    EyeOff,
    Layers,
    Leaf,
    Microscope,
    Pause,
    Play,
    RefreshCcw,
    Shield,
    Sprout,
    Trees,
    Waves,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Mode = 'overview' | 'lifeCycle' | 'bryophyteLab' | 'pteridophyteLab' | 'heterospory' | 'compare';
type FocusPlant = 'Bryophyte' | 'Pteridophyte';
type BryophyteSpecimen = 'Marchantia' | 'Funaria' | 'Sphagnum';
type PteridophyteSpecimen = 'Fern' | 'Selaginella' | 'Equisetum';

interface BryophytesPteridophytesLabProps {
    topic: any;
    onExit: () => void;
}

const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Trees size={13} /> },
    { id: 'lifeCycle', label: 'Cycle', icon: <Activity size={13} /> },
    { id: 'bryophyteLab', label: 'Bryo Lab', icon: <Leaf size={13} /> },
    { id: 'pteridophyteLab', label: 'Pterido Lab', icon: <Sprout size={13} /> },
    { id: 'heterospory', label: 'Heterospory', icon: <Layers size={13} /> },
    { id: 'compare', label: 'Compare', icon: <BookOpen size={13} /> },
];

const STAGE_STEPS = [
    { label: 'Spore', detail: 'spores germinate' },
    { label: 'Gametophyte', detail: 'main bryophyte phase' },
    { label: 'Fertilisation', detail: 'water film needed' },
    { label: 'Sporophyte', detail: 'dominant in pteridophytes' },
];

const modeFacts: Record<Mode, { title: string; section: string; facts: string[]; values: [string, string][] }> = {
    overview: {
        title: 'Dominance shift',
        section: 'NCERT Plant Kingdom 3.2-3.3',
        facts: [
            'Bryophytes are amphibians of the plant kingdom: soil-living but water-dependent for sexual reproduction.',
            'Bryophyte main body is haploid gametophyte; pteridophyte main body is sporophyte.',
            'Pteridophytes are the first terrestrial plants with xylem and phloem.',
        ],
        values: [
            ['Bryophyte phase', 'Gametophyte (n)'],
            ['Pteridophyte phase', 'Sporophyte (2n)'],
            ['Fertilisation', 'Water required'],
        ],
    },
    lifeCycle: {
        title: 'Alternation of generations',
        section: 'NCERT Fig. 3.2-3.3',
        facts: [
            'Bryophyte sporophyte is attached to the photosynthetic gametophyte and derives nourishment.',
            'Pteridophyte prothallus is small, multicellular, free-living and mostly photosynthetic.',
            'Spores are formed after meiosis and germinate into gametophytes.',
        ],
        values: [
            ['Bryophyte sporophyte', 'Dependent'],
            ['Pterido gametophyte', 'Prothallus'],
            ['Spore ploidy', 'n'],
        ],
    },
    bryophyteLab: {
        title: 'Bryophyte details',
        section: 'NCERT 3.2.1-3.2.2',
        facts: [
            'Liverworts such as Marchantia are thalloid and dorsiventral; gemmae form in gemma cups.',
            'Moss gametophyte has protonema and leafy stages.',
            'Moss sporophyte has foot, seta and capsule; spores form after meiosis.',
        ],
        values: [
            ['Groups', 'Liverworts, mosses'],
            ['Moss stages', 'Protonema, leafy'],
            ['Sporophyte parts', 'Foot, seta, capsule'],
        ],
    },
    pteridophyteLab: {
        title: 'Pteridophyte details',
        section: 'NCERT 3.3',
        facts: [
            'Pteridophytes include horsetails and ferns and are often medicinal, soil-binders and ornamentals.',
            'Leaves may be microphylls in Selaginella or macrophylls in ferns.',
            'Sporangia are subtended by sporophylls; in Selaginella and Equisetum they form strobili or cones.',
        ],
        values: [
            ['Vascular tissue', 'Xylem, phloem'],
            ['Leaf types', 'Microphyll, macrophyll'],
            ['Examples', 'Selaginella, Equisetum, Fern'],
        ],
    },
    heterospory: {
        title: 'Seed habit precursor',
        section: 'NCERT 3.3 + Exercise 7',
        facts: [
            'Most pteridophytes are homosporous.',
            'Selaginella and Salvinia produce macrospores and microspores and are heterosporous.',
            'Retention of female gametophyte on parent sporophyte is a precursor to seed habit.',
        ],
        values: [
            ['Microspore', 'Male gametophyte'],
            ['Megaspore', 'Female gametophyte'],
            ['Significance', 'Seed habit'],
        ],
    },
    compare: {
        title: 'NEET comparison',
        section: 'NCERT summary',
        facts: [
            'Bryophytes lack true roots, stem and leaves; pteridophytes have true roots, stem and leaves.',
            'Both have antheridia and archegonia and require water for fertilisation.',
            'Pteridophytes are classified into Psilopsida, Lycopsida, Sphenopsida and Pteropsida.',
        ],
        values: [
            ['Common organs', 'Antheridia, archegonia'],
            ['Key split', 'Vascular tissue'],
            ['Pterido classes', '4'],
        ],
    },
};

const compareRows = [
    ['Main plant body', 'Haploid gametophyte', 'Diploid sporophyte'],
    ['Roots, stem, leaves', 'No true organs; rhizoids and root/leaf/stem-like structures', 'True roots, stem and leaves'],
    ['Vascular tissue', 'Absent', 'Xylem and phloem present'],
    ['Gametophyte', 'Large, photosynthetic, dominant', 'Small prothallus; free-living, mostly photosynthetic'],
    ['Sporophyte', 'Attached and dependent; foot, seta, capsule', 'Independent, well-differentiated dominant plant'],
    ['Water need', 'Antherozoids need water to reach archegonium', 'Antherozoids need water to reach archegonium'],
    ['Examples', 'Marchantia, Funaria, Sphagnum', 'Selaginella, Equisetum, Fern, Salvinia'],
];

const BryophytesPteridophytesLab: React.FC<BryophytesPteridophytesLabProps> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('overview');
    const [focusPlant, setFocusPlant] = useState<FocusPlant>('Bryophyte');
    const [bryophyteSpecimen, setBryophyteSpecimen] = useState<BryophyteSpecimen>('Funaria');
    const [pteridophyteSpecimen, setPteridophyteSpecimen] = useState<PteridophyteSpecimen>('Fern');
    const [soilMoisture, setSoilMoisture] = useState(68);
    const [showVascular, setShowVascular] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [paused, setPaused] = useState(false);
    const [step, setStep] = useState(1);
    const [playSpeed, setPlaySpeed] = useState(2);
    const [quizChoice, setQuizChoice] = useState<'vascular' | 'height' | 'seed' | null>(null);

    const stepDelay = playSpeed === 1 ? 2200 : playSpeed === 2 ? 1400 : 800;

    useEffect(() => {
        if (paused) return;
        const timer = window.setInterval(() => setStep((prev) => (prev + 1) % 4), stepDelay);
        return () => window.clearInterval(timer);
    }, [paused, stepDelay]);

    const activeFacts = modeFacts[mode];
    const waterReady = soilMoisture >= 45;

    const resetSimulation = () => {
        setMode('overview');
        setFocusPlant('Bryophyte');
        setBryophyteSpecimen('Funaria');
        setPteridophyteSpecimen('Fern');
        setSoilMoisture(68);
        setShowVascular(true);
        setShowLabels(true);
        setPaused(false);
        setStep(1);
        setPlaySpeed(2);
        setQuizChoice(null);
    };

    const setManualStep = (nextStep: number) => {
        setPaused(true);
        setStep((nextStep + STAGE_STEPS.length) % STAGE_STEPS.length);
    };

    const advanceStep = () => setManualStep(step + 1);
    const rewindStep = () => setManualStep(step - 1);

    const applyPreset = (preset: 'water' | 'vascular' | 'heterospory') => {
        setShowLabels(true);
        setPaused(false);
        if (preset === 'water') {
            setMode('overview');
            setFocusPlant('Bryophyte');
            setBryophyteSpecimen('Funaria');
            setSoilMoisture(88);
            setStep(2);
        }
        if (preset === 'vascular') {
            setMode('pteridophyteLab');
            setFocusPlant('Pteridophyte');
            setPteridophyteSpecimen('Fern');
            setShowVascular(true);
            setSoilMoisture(72);
            setStep(3);
        }
        if (preset === 'heterospory') {
            setMode('heterospory');
            setFocusPlant('Pteridophyte');
            setPteridophyteSpecimen('Selaginella');
            setSoilMoisture(68);
            setStep(0);
        }
    };

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas width={1280} height={760} className="absolute inset-0 h-full w-full bg-white" />
                <div className="absolute inset-0">
                    <SimulationStage
                        mode={mode}
                        focusPlant={focusPlant}
                        bryophyteSpecimen={bryophyteSpecimen}
                        pteridophyteSpecimen={pteridophyteSpecimen}
                        soilMoisture={soilMoisture}
                        showVascular={showVascular}
                        showLabels={showLabels}
                        waterReady={waterReady}
                        step={step}
                        paused={paused}
                        quizChoice={quizChoice}
                        onQuizChoice={setQuizChoice}
                    />
                </div>
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={() => setPaused((prev) => !prev)}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title={paused ? 'Play' : 'Pause'}
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button
                        onClick={resetSimulation}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Reset"
                    >
                        <RefreshCcw size={15} />
                    </button>
                </div>
                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur pointer-events-auto">
                    <button
                        onClick={rewindStep}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                        title="Previous stage"
                    >
                        <ArrowRight size={14} className="rotate-180" />
                    </button>
                    {STAGE_STEPS.map((item, index) => (
                        <button
                            key={item.label}
                            onClick={() => setManualStep(index)}
                            className={`h-8 rounded-lg border px-2 text-[11px] font-black transition-colors ${
                                step === index ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                            }`}
                            title={item.detail}
                        >
                            {item.label}
                        </button>
                    ))}
                    <button
                        onClick={advanceStep}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                        title="Next stage"
                    >
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>
            <LeftAside mode={mode} focusPlant={focusPlant} />
            <RightAside facts={activeFacts} mode={mode} focusPlant={focusPlant} soilMoisture={soilMoisture} waterReady={waterReady} />
        </div>
    );

    const controlsCombo = (
        <div className="h-full w-full bg-white">
            <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[1.15fr_1.25fr_1fr_1fr]">
                <ControlGroup title="Scene" icon={<Trees size={15} className="text-emerald-700" />}>
                    <div className="grid grid-cols-3 gap-1.5">
                        {MODES.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setMode(item.id)}
                                className={`flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold transition-colors ${
                                    mode === item.id ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                        <PresetButton label="Water" onClick={() => applyPreset('water')} />
                        <PresetButton label="Vascular" onClick={() => applyPreset('vascular')} />
                        <PresetButton label="Heterospory" onClick={() => applyPreset('heterospory')} />
                    </div>
                </ControlGroup>

                <ControlGroup title="Timeline" icon={<Activity size={15} className="text-violet-700" />}>
                    <div className="grid grid-cols-[34px_34px_1fr_34px_34px] gap-1.5">
                        <button onClick={rewindStep} className="flex min-h-[34px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50" title="Previous stage">
                            <ArrowRight size={14} className="rotate-180" />
                        </button>
                        <button onClick={() => setPaused((prev) => !prev)} className="flex min-h-[34px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50" title={paused ? 'Play' : 'Pause'}>
                            {paused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                        <div className="flex items-center justify-center rounded-lg border border-violet-200 bg-violet-50 px-2 text-center text-[11px] font-black text-violet-900">
                            {STAGE_STEPS[step].label}
                        </div>
                        <button onClick={advanceStep} className="flex min-h-[34px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50" title="Next stage">
                            <ArrowRight size={14} />
                        </button>
                        <button onClick={resetSimulation} className="flex min-h-[34px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50" title="Reset">
                            <RefreshCcw size={14} />
                        </button>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                        {STAGE_STEPS.map((item, index) => (
                            <button
                                key={item.label}
                                onClick={() => setManualStep(index)}
                                className={`min-h-[30px] rounded-lg border px-1 text-[10px] font-black transition-colors ${
                                    step === index ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-500">Speed</span>
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="1"
                            value={playSpeed}
                            onChange={(event) => setPlaySpeed(parseInt(event.target.value, 10))}
                            className="w-full accent-violet-600"
                            aria-label="Playback speed"
                        />
                        <span className="w-8 rounded-md border border-slate-200 bg-slate-50 text-center text-[10px] font-black text-slate-700">{playSpeed}x</span>
                    </div>
                </ControlGroup>

                <ControlGroup title="Specimen" icon={<Microscope size={15} className="text-sky-700" />}>
                    <div className="grid grid-cols-2 gap-2">
                        <SelectBlock label="Bryophyte" value={bryophyteSpecimen} onChange={(value) => setBryophyteSpecimen(value as BryophyteSpecimen)} options={['Marchantia', 'Funaria', 'Sphagnum']} />
                        <SelectBlock label="Pteridophyte" value={pteridophyteSpecimen} onChange={(value) => setPteridophyteSpecimen(value as PteridophyteSpecimen)} options={['Fern', 'Selaginella', 'Equisetum']} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <ToggleButton active={focusPlant === 'Bryophyte'} onClick={() => setFocusPlant('Bryophyte')} icon={<Leaf size={14} />} label="Bryo" />
                        <ToggleButton active={focusPlant === 'Pteridophyte'} onClick={() => setFocusPlant('Pteridophyte')} icon={<Sprout size={14} />} label="Pterido" />
                    </div>
                </ControlGroup>

                <ControlGroup title="Conditions" icon={<Droplets size={15} className="text-cyan-700" />}>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="20"
                            max="100"
                            step="1"
                            value={soilMoisture}
                            onChange={(event) => setSoilMoisture(parseInt(event.target.value, 10))}
                            className="w-full accent-cyan-600"
                            aria-label="Soil moisture"
                        />
                        <span className="w-12 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center text-xs font-mono font-bold text-slate-700">{soilMoisture}%</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                        <PresetButton label="Dry" onClick={() => setSoilMoisture(30)} active={!waterReady} />
                        <PresetButton label="Damp" onClick={() => setSoilMoisture(68)} active={soilMoisture >= 45 && soilMoisture < 80} />
                        <PresetButton label="Wet" onClick={() => setSoilMoisture(92)} active={soilMoisture >= 80} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <ToggleButton active={showVascular} onClick={() => setShowVascular((prev) => !prev)} icon={<Shield size={14} />} label="Vascular" />
                        <ToggleButton active={showLabels} onClick={() => setShowLabels((prev) => !prev)} icon={showLabels ? <Eye size={14} /> : <EyeOff size={14} />} label="Labels" />
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
            simulationStageWidth={1280}
            simulationStageHeight={760}
            controlsAreaFlex="0 0 224px"
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1220px)] overflow-y-auto overscroll-contain bg-white border border-slate-200 shadow-2xl rounded-2xl p-3"
            contentToggleClassName="bg-red-600 text-white border border-red-500 hover:bg-white hover:text-red-600"
        />
    );
};

const SimulationStage = ({
    mode,
    focusPlant,
    bryophyteSpecimen,
    pteridophyteSpecimen,
    soilMoisture,
    showVascular,
    showLabels,
    waterReady,
    step,
    paused,
    quizChoice,
    onQuizChoice,
}: {
    mode: Mode;
    focusPlant: FocusPlant;
    bryophyteSpecimen: BryophyteSpecimen;
    pteridophyteSpecimen: PteridophyteSpecimen;
    soilMoisture: number;
    showVascular: boolean;
    showLabels: boolean;
    waterReady: boolean;
    step: number;
    paused: boolean;
    quizChoice: 'vascular' | 'height' | 'seed' | null;
    onQuizChoice: (choice: 'vascular' | 'height' | 'seed') => void;
}) => (
    <div className="relative h-full w-full bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute left-1/2 top-1/2 h-[650px] w-[1120px] -translate-x-1/2 -translate-y-1/2">
            {mode === 'overview' && <OverviewView focusPlant={focusPlant} bryophyteSpecimen={bryophyteSpecimen} pteridophyteSpecimen={pteridophyteSpecimen} soilMoisture={soilMoisture} showVascular={showVascular} showLabels={showLabels} waterReady={waterReady} step={step} paused={paused} />}
            {mode === 'lifeCycle' && <LifeCycleView step={step} showLabels={showLabels} paused={paused} />}
            {mode === 'bryophyteLab' && <BryophyteLabView specimen={bryophyteSpecimen} step={step} showLabels={showLabels} paused={paused} />}
            {mode === 'pteridophyteLab' && <PteridophyteLabView specimen={pteridophyteSpecimen} step={step} showVascular={showVascular} showLabels={showLabels} paused={paused} />}
            {mode === 'heterospory' && <HeterosporyView step={step} showLabels={showLabels} paused={paused} />}
            {mode === 'compare' && <CompareView quizChoice={quizChoice} onQuizChoice={onQuizChoice} />}
        </div>
    </div>
);

const SceneDefs = () => (
    <defs>
        <linearGradient id="bryoPteridoStageWash" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f0fdfa" />
            <stop offset="44%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#eff6ff" />
        </linearGradient>
        <linearGradient id="bryoLeafGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id="pteridoLeafGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="soilGradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="55%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
        <filter id="softPlantShadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="9" stdDeviation="7" floodColor="#0f172a" floodOpacity="0.14" />
        </filter>
        <filter id="sporeGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>
);

const AmbientSpores = ({ paused, tone = 'emerald' }: { paused: boolean; tone?: 'emerald' | 'cyan' | 'violet' }) => {
    const fill = tone === 'cyan' ? '#67e8f9' : tone === 'violet' ? '#c4b5fd' : '#86efac';
    const stroke = tone === 'cyan' ? '#0891b2' : tone === 'violet' ? '#7c3aed' : '#16a34a';
    return (
        <g opacity="0.55" filter="url(#sporeGlow)">
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <circle key={i} cx={145 + i * 155} cy={120 + (i % 3) * 68} r={3 + (i % 2)} fill={fill} stroke={stroke} strokeWidth="1">
                    {!paused && (
                        <>
                            <animate attributeName="cy" values={`${120 + (i % 3) * 68};${104 + (i % 3) * 68};${120 + (i % 3) * 68}`} dur={`${3.5 + i * 0.35}s`} repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.25;0.85;0.25" dur={`${3.2 + i * 0.25}s`} repeatCount="indefinite" />
                        </>
                    )}
                </circle>
            ))}
        </g>
    );
};

const HabitatBackdrop = ({ waterReady, paused }: { waterReady: boolean; paused: boolean }) => (
    <g>
        <path d="M72 510 C214 474 326 498 438 482 C570 464 690 492 830 472 C922 458 1002 472 1052 456" fill="none" stroke={waterReady ? '#67e8f9' : '#fda4af'} strokeWidth="4" strokeLinecap="round" opacity="0.45" strokeDasharray="12 12">
            {!paused && <animate attributeName="stroke-dashoffset" values="0;-48" dur="3.5s" repeatCount="indefinite" />}
        </path>
        <path d="M74 528 C224 500 350 524 492 504 C620 486 740 510 878 492 C964 480 1018 488 1052 476" fill="none" stroke={waterReady ? '#22d3ee' : '#fb7185'} strokeWidth="2" strokeLinecap="round" opacity="0.32" strokeDasharray="8 10">
            {!paused && <animate attributeName="stroke-dashoffset" values="0;-36" dur="4.2s" repeatCount="indefinite" />}
        </path>
    </g>
);

const Sway = ({ children, pivotX, pivotY, amount = 2.4, dur = 3.2, paused }: { children: React.ReactNode; pivotX: number; pivotY: number; amount?: number; dur?: number; paused: boolean; key?: React.Key }) => (
    <g>
        {!paused && <animateTransform attributeName="transform" type="rotate" values={`${-amount} ${pivotX} ${pivotY};${amount} ${pivotX} ${pivotY};${-amount} ${pivotX} ${pivotY}`} dur={`${dur}s`} repeatCount="indefinite" />}
        {children}
    </g>
);

const OverviewView = ({
    focusPlant,
    bryophyteSpecimen,
    pteridophyteSpecimen,
    soilMoisture,
    showVascular,
    showLabels,
    waterReady,
    step,
    paused,
}: {
    focusPlant: FocusPlant;
    bryophyteSpecimen: BryophyteSpecimen;
    pteridophyteSpecimen: PteridophyteSpecimen;
    soilMoisture: number;
    showVascular: boolean;
    showLabels: boolean;
    waterReady: boolean;
    step: number;
    paused: boolean;
}) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <SceneDefs />
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="url(#bryoPteridoStageWash)" stroke="#dbeafe" />
        <AmbientSpores paused={paused} tone={focusPlant === 'Pteridophyte' ? 'cyan' : 'emerald'} />
        <HabitatBackdrop waterReady={waterReady} paused={paused} />
        <g opacity={focusPlant === 'Pteridophyte' ? 0.55 : 1}>
            <PlantBench x={70} y={78} title={`Bryophyte: ${bryophyteSpecimen}`} color="#16a34a" phase="Dominant gametophyte (n)" />
            <BryophytePlant x={160} y={188} specimen={bryophyteSpecimen} scale={1.15} paused={paused} />
            <WaterTransfer x={246} y={404} active={waterReady} step={step} paused={paused} />
            {showLabels && (
                <>
                    <Label x={88} y={520} text="Rhizoids, no true roots" />
                    <Label x={238} y={160} text="Attached sporophyte" />
                    <Label x={280} y={452} text="Water needed for antherozoids" />
                </>
            )}
        </g>
        <g opacity={focusPlant === 'Bryophyte' ? 0.55 : 1}>
            <PlantBench x={585} y={78} title={`Pteridophyte: ${pteridophyteSpecimen}`} color="#0284c7" phase="Dominant sporophyte (2n)" />
            <PteridophytePlant x={730} y={156} specimen={pteridophyteSpecimen} scale={1.15} showVascular={showVascular} paused={paused} />
            <VascularColumn x={940} y={284} active={showVascular} paused={paused} />
            {showLabels && (
                <>
                    <Label x={684} y={518} text="True roots, stem, leaves" />
                    <Label x={850} y={132} text="Sporophyte is main plant" />
                    <Label x={902} y={454} text="Xylem and phloem" />
                </>
            )}
        </g>
        <g>
            <rect x="450" y="562" width="220" height="34" rx="17" fill={waterReady ? '#ecfeff' : '#fff1f2'} stroke={waterReady ? '#06b6d4' : '#fb7185'} />
            <text x="560" y="584" textAnchor="middle" fontSize="13" fontWeight="900" fill={waterReady ? '#0e7490' : '#be123c'}>
                Moisture {soilMoisture}%: {waterReady ? 'fertilisation possible' : 'fertilisation limited'}
            </text>
        </g>
    </svg>
);

const LifeCycleView = ({ step, showLabels, paused }: { step: number; showLabels: boolean; paused: boolean }) => {
    const bryo = [
        ['Spore', 'n'],
        ['Protonema', 'n'],
        ['Gametophyte', 'dominant n'],
        ['Sporophyte', 'attached 2n'],
    ];
    const pterido = [
        ['Spore', 'n'],
        ['Prothallus', 'small n'],
        ['Fertilisation', 'water'],
        ['Sporophyte', 'dominant 2n'],
    ];
    return (
        <svg viewBox="0 0 1120 650" className="h-full w-full">
            <SceneDefs />
            <rect x="24" y="24" width="1072" height="602" rx="30" fill="url(#bryoPteridoStageWash)" stroke="#dbeafe" />
            <AmbientSpores paused={paused} tone="violet" />
            <CycleWheel cx={302} cy={330} color="#16a34a" title="Bryophyte Cycle" step={step} items={bryo} paused={paused} />
            <CycleWheel cx={818} cy={330} color="#0284c7" title="Pteridophyte Cycle" step={step} items={pterido} paused={paused} />
            <path d="M560 96 L560 568" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10 8" />
            {showLabels && (
                <>
                    <Label x={178} y={562} text="Bryophyte sporophyte depends on gametophyte" />
                    <Label x={674} y={562} text="Pteridophyte sporophyte becomes independent" />
                    <Label x={434} y={88} text="Spores form by meiosis; water is required for fertilisation" />
                </>
            )}
        </svg>
    );
};

const BryophyteLabView = ({ specimen, step, showLabels, paused }: { specimen: BryophyteSpecimen; step: number; showLabels: boolean; paused: boolean }) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <SceneDefs />
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="url(#bryoPteridoStageWash)" stroke="#dbeafe" />
        <AmbientSpores paused={paused} tone="emerald" />
        <HabitatBackdrop waterReady paused={paused} />
        <PlantBench x={62} y={58} title={`Bryophyte Lab: ${specimen}`} color="#16a34a" phase={specimen === 'Marchantia' ? 'Liverwort thallus' : 'Moss gametophyte'} />
        {specimen === 'Marchantia' ? <MarchantiaDiagram step={step} paused={paused} /> : <MossDiagram specimen={specimen} step={step} paused={paused} />}
        <g transform="translate(760 145)">
            <StageChip y={0} color="#16a34a" title="1. Spore" body="Haploid spore germinates" active={step === 0} paused={paused} />
            <StageChip y={86} color="#22c55e" title="2. Protonema / thallus" body="Green gametophyte growth" active={step === 1} paused={paused} />
            <StageChip y={172} color="#0d9488" title="3. Sex organs" body="Antheridia + archegonia" active={step === 2} paused={paused} />
            <StageChip y={258} color="#7c3aed" title="4. Sporophyte" body="Foot, seta, capsule" active={step === 3} paused={paused} />
        </g>
        {showLabels && (
            <>
                <Label x={112} y={548} text="Bryophytes lack true roots, stem and leaves" />
                <Label x={370} y={112} text="Main body is haploid gametophyte" />
                <Label x={452} y={494} text="Capsule contains spores formed after meiosis" />
            </>
        )}
    </svg>
);

const PteridophyteLabView = ({ specimen, step, showVascular, showLabels, paused }: { specimen: PteridophyteSpecimen; step: number; showVascular: boolean; showLabels: boolean; paused: boolean }) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <SceneDefs />
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="url(#bryoPteridoStageWash)" stroke="#dbeafe" />
        <AmbientSpores paused={paused} tone="cyan" />
        <HabitatBackdrop waterReady paused={paused} />
        <PlantBench x={62} y={58} title={`Pteridophyte Lab: ${specimen}`} color="#0284c7" phase="First vascular terrestrial plants" />
        <PteridophytePlant x={270} y={130} specimen={specimen} scale={1.65} showVascular={showVascular} paused={paused} />
        {step === 2 && <WaterTransfer x={470} y={438} active paused={paused} step={step} />}
        <g transform="translate(720 116)">
            <AnatomyPill title="True organs" body="Root, stem and leaves are well differentiated" icon={<Sprout size={18} />} active={step === 3} />
            <AnatomyPill y={92} title="Vascular tissue" body="Xylem and phloem support taller sporophyte" icon={<Shield size={18} />} active={showVascular && step === 3} />
            <AnatomyPill y={184} title="Sporangia" body="Borne on sporophylls; spores by meiosis" icon={<Microscope size={18} />} active={step === 0} />
            <AnatomyPill y={276} title="Prothallus" body="Small free-living gametophyte in damp shade" icon={<Leaf size={18} />} active={step === 1 || step === 2} />
        </g>
        {showLabels && (
            <>
                <Label x={242} y={538} text="Dominant sporophyte (2n)" />
                <Label x={432} y={174} text={specimen === 'Fern' ? 'Macrophylls in ferns' : specimen === 'Selaginella' ? 'Microphylls in Selaginella' : 'Strobilus in Equisetum'} />
                <Label x={500} y={464} text={step === 2 ? 'Water carries antherozoids to archegonium' : 'Cool, damp shade helps gametophyte spread'} />
            </>
        )}
    </svg>
);

const HeterosporyView = ({ step, showLabels, paused }: { step: number; showLabels: boolean; paused: boolean }) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <SceneDefs />
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="url(#bryoPteridoStageWash)" stroke="#dbeafe" />
        <AmbientSpores paused={paused} tone="violet" />
        <PlantBench x={70} y={58} title="Heterospory in Pteridophytes" color="#7c3aed" phase="Selaginella and Salvinia" />
        <g transform="translate(110 150)">
            <rect x="0" y="0" width="310" height="340" rx="24" fill="#ffffff" stroke="#ddd6fe" strokeWidth="3" />
            <text x="155" y="42" textAnchor="middle" fontSize="20" fontWeight="900" fill="#4c1d95">Homosporous</text>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <circle key={i} cx={84 + (i % 3) * 58} cy={104 + Math.floor(i / 3) * 70} r="22" fill="#e2e8f0" stroke="#64748b" strokeWidth="3">
                    {!paused && <animate attributeName="opacity" values="0.72;1;0.72" dur={`${2.4 + i * 0.2}s`} repeatCount="indefinite" />}
                </circle>
            ))}
            <text x="155" y="292" textAnchor="middle" fontSize="15" fontWeight="800" fill="#475569">Majority produce similar spores</text>
        </g>
        <g transform="translate(520 150)">
            <rect x="0" y="0" width="380" height="340" rx="24" fill="#ffffff" stroke="#c4b5fd" strokeWidth="3" />
            <text x="190" y="42" textAnchor="middle" fontSize="20" fontWeight="900" fill="#4c1d95">Heterosporous</text>
            <circle cx="120" cy="148" r={step % 2 === 0 ? 46 : 40} fill="#fef3c7" stroke="#d97706" strokeWidth="5">
                {!paused && <animate attributeName="r" values="40;48;40" dur="2.8s" repeatCount="indefinite" />}
            </circle>
            <circle cx="252" cy="148" r={step % 2 === 1 ? 28 : 24} fill="#dbeafe" stroke="#2563eb" strokeWidth="5">
                {!paused && <animate attributeName="r" values="23;30;23" dur="2.2s" repeatCount="indefinite" />}
            </circle>
            <text x="120" y="228" textAnchor="middle" fontSize="15" fontWeight="900" fill="#92400e">Megaspore</text>
            <text x="252" y="228" textAnchor="middle" fontSize="15" fontWeight="900" fill="#1d4ed8">Microspore</text>
            <path d="M120 248 C130 294 168 308 190 310 C218 310 246 292 252 248" fill="none" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" strokeDasharray="18 12">
                {!paused && <animate attributeName="stroke-dashoffset" values="0;-60" dur="3s" repeatCount="indefinite" />}
            </path>
            <text x="190" y="314" textAnchor="middle" fontSize="14" fontWeight="900" fill="#5b21b6">Retained female gametophyte to seed habit precursor</text>
        </g>
        {showLabels && (
            <>
                <Label x={538} y={538} text="Megaspores and microspores form female and male gametophytes" />
                <Label x={750} y={102} text="Examples: Selaginella and Salvinia" />
            </>
        )}
    </svg>
);

const CompareView = ({ quizChoice, onQuizChoice }: { quizChoice: 'vascular' | 'height' | 'seed' | null; onQuizChoice: (choice: 'vascular' | 'height' | 'seed') => void }) => (
    <div className="grid h-full grid-cols-[1.55fr_0.85fr] gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 grid grid-cols-[0.7fr_1fr_1fr] gap-2 text-xs font-black uppercase text-slate-500">
                <div>Feature</div>
                <div className="text-emerald-700">Bryophytes</div>
                <div className="text-sky-700">Pteridophytes</div>
            </div>
            <div className="space-y-2">
                {compareRows.map(([feature, bryo, pterido]) => (
                    <div key={feature} className="grid grid-cols-[0.7fr_1fr_1fr] gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm">
                        <div className="font-black text-slate-900">{feature}</div>
                        <div className="font-semibold text-emerald-800">{bryo}</div>
                        <div className="font-semibold text-sky-800">{pterido}</div>
                    </div>
                ))}
            </div>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-black text-violet-950">
                <BookOpen size={20} />
                NCERT Check
            </div>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-violet-900">
                What is the strongest structural reason pteridophytes can have a taller, independent dominant plant body?
            </p>
            <div className="mt-5 space-y-2">
                <QuizButton active={quizChoice === 'vascular'} correct label="They possess vascular tissues: xylem and phloem" onClick={() => onQuizChoice('vascular')} />
                <QuizButton active={quizChoice === 'height'} label="They never require water for fertilisation" onClick={() => onQuizChoice('height')} />
                <QuizButton active={quizChoice === 'seed'} label="All pteridophytes make seeds" onClick={() => onQuizChoice('seed')} />
            </div>
            {quizChoice && (
                <div className={`mt-5 rounded-xl border p-3 text-sm font-bold ${quizChoice === 'vascular' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900'}`}>
                    {quizChoice === 'vascular' ? 'Correct. NCERT calls pteridophytes the first terrestrial plants with xylem and phloem.' : 'Not quite. Pteridophytes still need water for fertilisation, and heterospory is only a seed-habit precursor.'}
                </div>
            )}
        </div>
    </div>
);

const BryophytePlant = ({ x, y, specimen, scale, paused }: { x: number; y: number; specimen: BryophyteSpecimen; scale: number; paused: boolean }) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
        {specimen === 'Marchantia' ? (
            <g filter="url(#softPlantShadow)">
                <ellipse cx="80" cy="220" rx="92" ry="40" fill="url(#bryoLeafGradient)" stroke="#166534" strokeWidth="5" />
                <ellipse cx="26" cy="218" rx="46" ry="25" fill="#4ade80" opacity="0.82" />
                <ellipse cx="132" cy="218" rx="48" ry="27" fill="#4ade80" opacity="0.82" />
                <path d="M16 220 C52 202 94 240 150 218" fill="none" stroke="#bbf7d0" strokeWidth="3" opacity="0.75" />
                {[64, 112].map((cx, i) => (
                    <g key={cx}>
                        <circle cx={cx} cy={i === 0 ? 210 : 226} r="13" fill="#dcfce7" stroke="#15803d" strokeWidth="3" />
                        <circle cx={cx} cy={i === 0 ? 210 : 226} r="5" fill="#16a34a">
                            {!paused && <animate attributeName="r" values="4;7;4" dur={`${2.2 + i * 0.5}s`} repeatCount="indefinite" />}
                        </circle>
                    </g>
                ))}
                {[34, 78, 124].map((rx) => (
                    <path key={rx} d={`M${rx} 244 C${rx - 8} 258 ${rx - 18} 264 ${rx - 26} 272`} fill="none" stroke="#854d0e" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
                ))}
                <text x="80" y="280" textAnchor="middle" fontSize="15" fontWeight="900" fill="#166534">Gemma cups</text>
            </g>
        ) : (
            <>
                <ellipse cx="82" cy="238" rx="100" ry="24" fill="url(#soilGradient)" opacity="0.78" />
                {[0, 1, 2, 3, 4].map((i) => (
                    <Sway key={i} pivotX={36 + i * 34} pivotY={235 - i * 6} amount={2 + i * 0.3} dur={3 + i * 0.2} paused={paused}>
                        <g transform={`translate(${36 + i * 34} ${235 - i * 6})`} filter="url(#softPlantShadow)">
                            <line x1="0" y1="0" x2="0" y2="-90" stroke="#166534" strokeWidth="6" strokeLinecap="round" />
                            <ellipse cx="-16" cy="-36" rx="24" ry="10" fill="url(#bryoLeafGradient)" transform="rotate(-30 -16 -36)" />
                            <ellipse cx="16" cy="-52" rx="24" ry="10" fill="#22c55e" transform="rotate(30 16 -52)" />
                            <ellipse cx="-13" cy="-70" rx="18" ry="8" fill="#4ade80" transform="rotate(-24 -13 -70)" opacity="0.92" />
                        </g>
                    </Sway>
                ))}
                <Sway pivotX={105} pivotY={126} amount={3} dur={3.6} paused={paused}>
                    <line x1="105" y1="126" x2="105" y2="32" stroke="#7c3aed" strokeWidth="7" strokeLinecap="round" />
                    <ellipse cx="105" cy="22" rx="24" ry="16" fill="#f59e0b" stroke="#92400e" strokeWidth="4" />
                    {[0, 1, 2, 3].map((i) => (
                        <circle key={i} cx={94 + i * 8} cy={16 + (i % 2) * 5} r="2.5" fill="#fde68a">
                            {!paused && <animate attributeName="cy" values={`${16 + (i % 2) * 5};${2 - i * 3};${16 + (i % 2) * 5}`} dur={`${2.8 + i * 0.25}s`} repeatCount="indefinite" />}
                            {!paused && <animate attributeName="opacity" values="0.95;0.15;0.95" dur={`${2.8 + i * 0.25}s`} repeatCount="indefinite" />}
                        </circle>
                    ))}
                </Sway>
                {specimen === 'Sphagnum' && <text x="82" y="284" textAnchor="middle" fontSize="15" fontWeight="900" fill="#166534">Peat moss, high water holding</text>}
            </>
        )}
    </g>
);

const PteridophytePlant = ({ x, y, specimen, scale, showVascular, paused }: { x: number; y: number; specimen: PteridophyteSpecimen; scale: number; showVascular: boolean; paused: boolean }) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <ellipse cx="92" cy="270" rx="96" ry="28" fill="url(#soilGradient)" opacity="0.72" />
        <path d="M54 270 C42 296 26 306 10 322 M94 270 C96 300 78 318 58 332 M130 270 C154 292 170 306 184 330" fill="none" stroke="#713f12" strokeWidth="5" strokeLinecap="round" opacity="0.78" />
        {specimen === 'Equisetum' ? (
            <>
                <Sway pivotX={92} pivotY={268} amount={1.4} dur={3.5} paused={paused}>
                    <line x1="92" y1="268" x2="92" y2="40" stroke="#0f766e" strokeWidth="18" strokeLinecap="round" />
                    <line x1="92" y1="246" x2="92" y2="56" stroke="#5eead4" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
                </Sway>
                {[70, 112, 154, 196].map((cy) => (
                    <Sway key={cy} pivotX={92} pivotY={cy} amount={1.8} dur={2.6 + cy / 120} paused={paused}>
                        <line x1="92" y1={cy} x2="38" y2={cy + 24} stroke="#14b8a6" strokeWidth="5" strokeLinecap="round" />
                        <line x1="92" y1={cy} x2="146" y2={cy + 24} stroke="#14b8a6" strokeWidth="5" strokeLinecap="round" />
                    </Sway>
                ))}
                <path d="M72 38 L92 2 L112 38Z" fill="#f59e0b" stroke="#92400e" strokeWidth="4" filter="url(#softPlantShadow)" />
            </>
        ) : specimen === 'Selaginella' ? (
            <>
                <line x1="40" y1="250" x2="172" y2="130" stroke="#0f766e" strokeWidth="12" strokeLinecap="round" />
                {[0, 1, 2, 3, 4].map((i) => (
                    <Sway key={i} pivotX={64 + i * 26} pivotY={230 - i * 24} amount={2.2} dur={2.8 + i * 0.15} paused={paused}>
                        <g transform={`translate(${64 + i * 26} ${230 - i * 24})`}>
                            <ellipse cx="-12" cy="-8" rx="18" ry="7" fill="#16a34a" />
                            <ellipse cx="12" cy="8" rx="18" ry="7" fill="#22c55e" />
                        </g>
                    </Sway>
                ))}
                <path d="M156 122 L184 92 L190 134Z" fill="#f59e0b" stroke="#92400e" strokeWidth="4" />
            </>
        ) : (
            <>
                <line x1="92" y1="270" x2="92" y2="120" stroke="#0f766e" strokeWidth="14" strokeLinecap="round" />
                {[0, 1, 2].map((i) => (
                    <Sway key={i} pivotX={92} pivotY={132 + i * 38} amount={2.5 + i * 0.45} dur={3.2 + i * 0.35} paused={paused}>
                        <g transform={`translate(92 ${132 + i * 38})`} filter="url(#softPlantShadow)">
                            <path d="M0 0 C-58 -18 -104 -14 -150 20" fill="none" stroke="url(#pteridoLeafGradient)" strokeWidth="8" strokeLinecap="round" />
                            <path d="M0 0 C58 -18 104 -14 150 20" fill="none" stroke="url(#pteridoLeafGradient)" strokeWidth="8" strokeLinecap="round" />
                            <path d="M-42 -10 L-58 -30 M-72 -4 L-96 -24 M42 -10 L58 -30 M72 -4 L96 -24" stroke="#5eead4" strokeWidth="4" strokeLinecap="round" />
                            {[[-118, 10], [118, 10], [-86, 2], [86, 2]].map(([cx, cy], dot) => (
                                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#f59e0b" stroke="#92400e" strokeWidth="1.5">
                                    {!paused && dot < 2 && <animate attributeName="r" values="3;5;3" dur="2.4s" repeatCount="indefinite" />}
                                </circle>
                            ))}
                        </g>
                    </Sway>
                ))}
            </>
        )}
        {showVascular && (
            <g transform="translate(118 178)">
                <rect x="0" y="0" width="18" height="88" rx="9" fill="#38bdf8" opacity="0.9" />
                <rect x="26" y="0" width="18" height="88" rx="9" fill="#f59e0b" opacity="0.9" />
                <rect x="4" y="62" width="10" height="18" rx="5" fill="#e0f2fe" opacity="0.85">
                    {!paused && <animate attributeName="y" values="62;8;62" dur="2.2s" repeatCount="indefinite" />}
                </rect>
                <rect x="30" y="10" width="10" height="18" rx="5" fill="#fef3c7" opacity="0.85">
                    {!paused && <animate attributeName="y" values="10;62;10" dur="2.5s" repeatCount="indefinite" />}
                </rect>
                <text x="22" y="108" textAnchor="middle" fontSize="11" fontWeight="900" fill="#0f172a">X/P</text>
            </g>
        )}
    </g>
);

const MarchantiaDiagram = ({ step, paused }: { step: number; paused: boolean }) => (
    <g>
        <BryophytePlant x={150} y={185} specimen="Marchantia" scale={1.55} paused={paused} />
        {step >= 2 && (
            <>
                <line x1="402" y1="312" x2="402" y2="190" stroke="#7c3aed" strokeWidth="7" strokeLinecap="round" />
                <path d="M358 190 C386 154 418 154 446 190 C420 204 382 204 358 190Z" fill="#a78bfa" stroke="#6d28d9" strokeWidth="4" />
            </>
        )}
    </g>
);

const MossDiagram = ({ specimen, step, paused }: { specimen: BryophyteSpecimen; step: number; paused: boolean }) => (
    <g>
        <path d="M112 470 C220 410 306 412 428 470" fill="none" stroke="#16a34a" strokeWidth="8" strokeLinecap="round" strokeDasharray={step === 0 ? '0' : '14 10'}>
            {!paused && step > 0 && <animate attributeName="stroke-dashoffset" values="0;-48" dur="3s" repeatCount="indefinite" />}
        </path>
        <text x="256" y="506" textAnchor="middle" fontSize="15" fontWeight="900" fill="#166534">Protonema</text>
        <BryophytePlant x={248} y={176} specimen={specimen} scale={1.35} paused={paused} />
        <g transform="translate(525 180)">
            <line x1="0" y1="260" x2="0" y2="74" stroke="#7c3aed" strokeWidth="8" strokeLinecap="round" />
            <ellipse cx="0" cy="58" rx="34" ry="23" fill="#f59e0b" stroke="#92400e" strokeWidth="5" />
            <text x="0" y="310" textAnchor="middle" fontSize="15" fontWeight="900" fill="#6d28d9">Foot - seta - capsule</text>
        </g>
    </g>
);

const WaterTransfer = ({ x, y, active, step, paused }: { x: number; y: number; active: boolean; step: number; paused: boolean }) => (
    <g transform={`translate(${x} ${y})`} opacity={active ? 1 : 0.5}>
        <path d="M0 0 C48 -54 104 -52 150 -6" fill="none" stroke={active ? '#06b6d4' : '#f43f5e'} strokeWidth="6" strokeLinecap="round" strokeDasharray="12 8">
            {!paused && <animate attributeName="stroke-dashoffset" values="0;-40" dur="2.5s" repeatCount="indefinite" />}
        </path>
        {[0, 1, 2].map((i) => (
            <circle key={i} cx={Math.min(150, step * 42 + i * 18)} cy={step === 0 ? 0 : step === 1 ? -28 + i * 2 : step === 2 ? -30 + i * 2 : -6} r={i === 0 ? 9 : 5} fill={active ? '#67e8f9' : '#fda4af'} stroke={active ? '#0891b2' : '#e11d48'} strokeWidth="2">
                {!paused && (
                    <>
                        <animate attributeName="opacity" values="1;0.42;1" dur={`${1.7 + i * 0.25}s`} repeatCount="indefinite" />
                        <animate attributeName="r" values={`${i === 0 ? 8 : 4};${i === 0 ? 11 : 6};${i === 0 ? 8 : 4}`} dur={`${1.9 + i * 0.2}s`} repeatCount="indefinite" />
                    </>
                )}
            </circle>
        ))}
    </g>
);

const VascularColumn = ({ x, y, active, paused }: { x: number; y: number; active: boolean; paused: boolean }) => (
    <g transform={`translate(${x} ${y})`} opacity={active ? 1 : 0.35}>
        <rect x="0" y="0" width="84" height="178" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3" />
        <rect x="18" y="34" width="18" height="92" rx="9" fill="#38bdf8" />
        <rect x="48" y="34" width="18" height="92" rx="9" fill="#f59e0b" />
        <rect x="22" y="96" width="10" height="22" rx="5" fill="#e0f2fe" opacity="0.9">
            {active && !paused && <animate attributeName="y" values="100;38;100" dur="2s" repeatCount="indefinite" />}
        </rect>
        <rect x="52" y="44" width="10" height="22" rx="5" fill="#fef3c7" opacity="0.9">
            {active && !paused && <animate attributeName="y" values="44;98;44" dur="2.4s" repeatCount="indefinite" />}
        </rect>
        <text x="27" y="148" textAnchor="middle" fontSize="12" fontWeight="900" fill="#0369a1">X</text>
        <text x="57" y="148" textAnchor="middle" fontSize="12" fontWeight="900" fill="#b45309">P</text>
    </g>
);

const PlantBench = ({ x, y, title, color, phase }: { x: number; y: number; title: string; color: string; phase: string }) => (
    <g transform={`translate(${x} ${y})`}>
        <rect x="0" y="0" width="378" height="54" rx="18" fill="#ffffff" stroke={color} strokeWidth="3" />
        <circle cx="28" cy="27" r="12" fill={color} />
        <text x="50" y="24" fontSize="16" fontWeight="900" fill="#0f172a">{title}</text>
        <text x="50" y="42" fontSize="11" fontWeight="800" fill="#64748b">{phase}</text>
    </g>
);

const CycleWheel = ({ cx, cy, color, title, step, items, paused }: { cx: number; cy: number; color: string; title: string; step: number; items: string[][]; paused: boolean }) => (
    <g>
        <circle cx={cx} cy={cy} r="198" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3" />
        <circle cx={cx} cy={cy} r="154" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.25" strokeDasharray="18 18">
            {!paused && <animate attributeName="stroke-dashoffset" values="0;-72" dur="5s" repeatCount="indefinite" />}
        </circle>
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="900" fill="#0f172a">{title}</text>
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize="13" fontWeight="800" fill="#64748b">spore to gametophyte to fertilisation to sporophyte</text>
        {items.map(([head, sub], i) => {
            const angle = -90 + i * 90;
            const rad = (angle * Math.PI) / 180;
            const x = cx + Math.cos(rad) * 185;
            const y = cy + Math.sin(rad) * 185;
            const active = i === step;
            return (
                <g key={head}>
                    <circle cx={x} cy={y} r={active ? 54 : 44} fill={active ? color : '#f8fafc'} stroke={active ? color : '#cbd5e1'} strokeWidth="3">
                        {active && !paused && <animate attributeName="r" values="50;57;50" dur="1.5s" repeatCount="indefinite" />}
                    </circle>
                    <text x={x} y={y - 4} textAnchor="middle" fontSize="14" fontWeight="900" fill={active ? '#ffffff' : '#334155'}>{head}</text>
                    <text x={x} y={y + 18} textAnchor="middle" fontSize="11" fontWeight="800" fill={active ? '#ffffff' : '#64748b'}>{sub}</text>
                </g>
            );
        })}
    </g>
);

const StageChip = ({ y, color, title, body, active, paused }: { y: number; color: string; title: string; body: string; active: boolean; paused: boolean }) => (
    <g transform={`translate(0 ${y})`} opacity={active ? 1 : 0.45}>
        <rect x="0" y="0" width="250" height="66" rx="17" fill="#ffffff" stroke={color} strokeWidth="3">
            {active && !paused && <animate attributeName="stroke-width" values="3;6;3" dur="1.5s" repeatCount="indefinite" />}
        </rect>
        <circle cx="28" cy="33" r="12" fill={color} />
        <text x="50" y="28" fontSize="15" fontWeight="900" fill="#0f172a">{title}</text>
        <text x="50" y="48" fontSize="12" fontWeight="800" fill="#64748b">{body}</text>
    </g>
);

const AnatomyPill = ({ y = 0, title, body, icon, active = false }: { y?: number; title: string; body: string; icon: React.ReactNode; active?: boolean }) => (
    <foreignObject x="0" y={y} width="300" height="74">
        <div className={`flex h-[66px] items-center gap-3 rounded-2xl border px-4 transition-colors ${active ? 'border-sky-500 bg-sky-50 shadow-md' : 'border-slate-200 bg-white shadow-sm'}`}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'}`}>{icon}</div>
            <div>
                <div className="text-sm font-black text-slate-900">{title}</div>
                <div className="text-xs font-semibold leading-snug text-slate-600">{body}</div>
            </div>
        </div>
    </foreignObject>
);

const LeftAside = ({ mode, focusPlant }: { mode: Mode; focusPlant: FocusPlant }) => (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
        <div className="flex flex-col gap-2.5">
            <AsideCard title="NCERT Figures" subtitle="What this stage is modelling">
                <ReferenceRow icon={<Leaf size={15} />} label="Fig. 3.2" value="Marchantia, Funaria and Sphagnum bryophytes" />
                <ReferenceRow icon={<Sprout size={15} />} label="Fig. 3.3" value="Selaginella, Equisetum, Fern and Salvinia pteridophytes" />
                <ReferenceRow icon={<BookOpen size={15} />} label="Exercises 7-9" value="Heterospory, protonema, sporophyll, liverwort vs moss" />
            </AsideCard>
            <AsideCard title="Dominance Map" subtitle="Phase size and dependence">
                <svg viewBox="0 0 300 172" className="h-[160px] w-full">
                    <rect x="12" y="20" width="118" height="116" rx="20" fill={focusPlant === 'Bryophyte' ? '#dcfce7' : '#f8fafc'} stroke="#16a34a" strokeWidth="3" />
                    <rect x="170" y="20" width="118" height="116" rx="20" fill={focusPlant === 'Pteridophyte' ? '#e0f2fe' : '#f8fafc'} stroke="#0284c7" strokeWidth="3" />
                    <text x="71" y="62" textAnchor="middle" fontSize="14" fontWeight="900" fill="#166534">Bryophyte</text>
                    <text x="71" y="88" textAnchor="middle" fontSize="12" fontWeight="800" fill="#166534">Gametophyte</text>
                    <text x="71" y="110" textAnchor="middle" fontSize="18" fontWeight="900" fill="#166534">n</text>
                    <text x="229" y="62" textAnchor="middle" fontSize="14" fontWeight="900" fill="#0369a1">Pteridophyte</text>
                    <text x="229" y="88" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0369a1">Sporophyte</text>
                    <text x="229" y="110" textAnchor="middle" fontSize="18" fontWeight="900" fill="#0369a1">2n</text>
                </svg>
            </AsideCard>
            <AsideCard title="Ploidy Trail" subtitle="Fast NEET recall">
                <ValueMini label="Spore" value="n" tone="emerald" />
                <ValueMini label="Gametophyte / prothallus" value="n" tone="cyan" />
                <ValueMini label="Zygote and sporophyte" value="2n" tone="violet" />
            </AsideCard>
        </div>
    </aside>
);

const RightAside = ({ facts, mode, focusPlant, soilMoisture, waterReady }: { facts: { title: string; section: string; facts: string[]; values: [string, string][] }; mode: Mode; focusPlant: FocusPlant; soilMoisture: number; waterReady: boolean }) => (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
        <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 text-base font-extrabold text-emerald-950">
                    <Waves size={17} />
                    {facts.title}
                </div>
                <div className="mt-1 text-xs font-semibold text-emerald-700">{facts.section}</div>
                <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-emerald-950">
                    {facts.facts.map((fact) => (
                        <div key={fact} className="flex gap-2">
                            <ArrowRight size={14} className="mt-0.5 shrink-0 text-emerald-700" />
                            <span>{fact}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <div className="font-bold text-slate-900">Real-time values</div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</span>
                </div>
                <ValueRow label="Mode" value={mode.toUpperCase()} tone="slate" />
                <ValueRow label="Focus" value={focusPlant} tone={focusPlant === 'Bryophyte' ? 'emerald' : 'cyan'} />
                <ValueRow label="Moisture" value={`${soilMoisture}%`} tone="cyan" />
                <ValueRow label="Fertilisation" value={waterReady ? 'Water film available' : 'Water limited'} tone={waterReady ? 'emerald' : 'rose'} />
                {facts.values.map(([label, value]) => (
                    <React.Fragment key={label}>
                        <ValueRow label={label} value={value} tone="amber" />
                    </React.Fragment>
                ))}
            </div>
        </div>
    </aside>
);

const AsideCard = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
        <div className="text-base font-extrabold text-slate-900">{title}</div>
        <div className="mb-3 text-xs font-semibold text-slate-500">{subtitle}</div>
        {children}
    </div>
);

const ReferenceRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="mb-2 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
        <span className="mt-0.5 text-slate-600">{icon}</span>
        <div>
            <div className="font-black text-slate-900">{label}</div>
            <div className="text-xs font-semibold text-slate-600">{value}</div>
        </div>
    </div>
);

const ValueRow = ({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'cyan' | 'emerald' | 'rose' | 'slate' | 'violet' }) => {
    const colors = {
        amber: 'bg-amber-50 text-amber-700',
        cyan: 'bg-cyan-50 text-cyan-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        rose: 'bg-rose-50 text-rose-700',
        slate: 'bg-slate-50 text-slate-700',
        violet: 'bg-violet-50 text-violet-700',
    };
    return (
        <div className={`mb-2 rounded-lg border border-slate-100 px-3 py-2.5 ${colors[tone]}`}>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 font-mono text-base font-extrabold">{value}</div>
        </div>
    );
};

const ValueMini = ({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'cyan' | 'violet' }) => (
    <div className={`mb-2 flex justify-between rounded-lg px-3 py-2 text-sm font-bold ${tone === 'emerald' ? 'bg-emerald-50 text-emerald-800' : tone === 'cyan' ? 'bg-cyan-50 text-cyan-800' : 'bg-violet-50 text-violet-800'}`}>
        <span>{label}</span>
        <span>{value}</span>
    </div>
);

const ControlGroup = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-700">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

const ToggleButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button
        onClick={onClick}
        className={`flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold transition-colors ${
            active ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
        }`}
    >
        {icon}
        {label}
    </button>
);

const PresetButton = ({ label, onClick, active = false }: { label: string; onClick: () => void; active?: boolean }) => (
    <button
        onClick={onClick}
        className={`min-h-[30px] rounded-lg border px-2 text-[10px] font-black transition-colors ${
            active ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
        }`}
    >
        {label}
    </button>
);

const SelectBlock = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => (
    <label className="block">
        <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">{label}</span>
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
        >
            {options.map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    </label>
);

const QuizButton = ({ active, correct = false, label, onClick }: { active: boolean; correct?: boolean; label: string; onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-bold transition-colors ${
            active
                ? correct
                    ? 'border-emerald-500 bg-emerald-600 text-white'
                    : 'border-rose-500 bg-rose-600 text-white'
                : 'border-violet-200 bg-white text-slate-700 hover:border-violet-400'
        }`}
    >
        {label}
    </button>
);

const Label = ({ x, y, text }: { x: number; y: number; text: string }) => {
    const display = text.length > 58 ? `${text.slice(0, 55)}...` : text;
    const width = Math.min(360, Math.max(116, display.length * 7.1));
    const labelX = Math.max(38, Math.min(x - 8, 1082 - width));
    const textX = labelX + 8;
    return (
        <g>
            <rect x={labelX} y={y - 17} width={width} height="27" rx="9" fill="#ffffff" stroke="#cbd5e1" />
            <text x={textX} y={y} fontSize="12" fontWeight="800" fill="#334155">{display}</text>
        </g>
    );
};

export default BryophytesPteridophytesLab;
