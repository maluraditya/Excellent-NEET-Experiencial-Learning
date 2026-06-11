import React, { useMemo, useState } from 'react';
import {
    Activity,
    Apple,
    ArrowRight,
    Award,
    BookOpen,
    Eye,
    EyeOff,
    Flower,
    Info,
    Layers,
    Leaf,
    Microscope,
    Pause,
    Play,
    RefreshCcw,
    Search,
    Shield,
    Sprout,
    Trees,
    Wind,
    Zap,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Mode = 'anatomy' | 'cycle' | 'double' | 'seed' | 'examples' | 'compare';
type GymnoSpecies = 'Pinus' | 'Cycas' | 'Ginkgo';
type AngioExample = 'Hibiscus' | 'Mango' | 'Maize';
type SeedView = 'dicot' | 'monocot';
type ExampleFilter = 'all' | 'gymno' | 'angio';

interface GymnospermsAngiospermsLabProps {
    topic: any;
    onExit: () => void;
}

interface ExampleCard {
    name: string;
    group: 'gymno' | 'angio';
    visual: string;
    detail: string;
    tone: string;
}

const modes: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: 'anatomy', label: 'Anatomy', icon: <Search size={13} /> },
    { id: 'cycle', label: 'Life Cycle', icon: <Activity size={13} /> },
    { id: 'double', label: 'Double Fert.', icon: <Zap size={13} /> },
    { id: 'seed', label: 'Seed', icon: <Layers size={13} /> },
    { id: 'examples', label: 'Examples', icon: <Award size={13} /> },
    { id: 'compare', label: 'Compare', icon: <BookOpen size={13} /> },
];

const stageSteps = [
    { label: 'Sporophyte', detail: 'dominant seed plant body' },
    { label: 'Pollen', detail: 'microspore forms pollen' },
    { label: 'Tube', detail: 'pollen tube reaches ovule' },
    { label: 'Seed/Fruit', detail: 'seed forms; angio ovary becomes fruit' },
];

const usesTimeline = (mode: Mode) => mode === 'anatomy' || mode === 'cycle' || mode === 'double';

const comparisonRows = [
    ['Ovule', 'Exposed; no ovary wall', 'Inside ovary'],
    ['Seed', 'Naked; not covered', 'Enclosed in fruit'],
    ['Main structure', 'Cones or strobili', 'Flowers'],
    ['Sporangia', 'Microsporangia and megasporangia on sporophylls', 'Ovules inside carpels; pollen from stamens'],
    ['Fertilisation', 'One fusion event with egg in archegonium', 'Double fertilisation in flowering plants'],
    ['Endosperm', 'Female gametophyte tissue; haploid (n)', 'Food-storing endosperm after double fertilisation'],
    ['Examples', 'Cycas, Pinus, Ginkgo, Sequoia, Cedrus', 'Hibiscus, Mango, Wolffia, Eucalyptus, Maize'],
];

const examples: ExampleCard[] = [
    { name: 'Cycas', group: 'gymno', visual: 'Pinnate leaves', detail: 'Unbranched stem; coralloid roots with N2-fixing cyanobacteria; male cones and megasporophylls on different trees.', tone: 'emerald' },
    { name: 'Pinus', group: 'gymno', visual: 'Needle leaves', detail: 'Mycorrhiza in roots; branched stem; male and female cones may be borne on the same tree.', tone: 'emerald' },
    { name: 'Ginkgo', group: 'gymno', visual: 'Fig. 3.4 example', detail: 'NCERT Figure 3.4 shows Ginkgo along with Cycas and Pinus as gymnosperm examples.', tone: 'emerald' },
    { name: 'Sequoia', group: 'gymno', visual: 'Giant redwood', detail: 'One of the tallest tree species among gymnosperms.', tone: 'emerald' },
    { name: 'Cedrus', group: 'gymno', visual: 'Branched conifer', detail: 'NCERT names Cedrus while describing branched gymnosperm stems.', tone: 'emerald' },
    { name: 'Hibiscus', group: 'angio', visual: 'Flower', detail: 'Use it as the flower model: pollen and ovules occur in specialised structures called flowers.', tone: 'rose' },
    { name: 'Mango', group: 'angio', visual: 'Drupe', detail: 'Pericarp has thin epicarp, fleshy edible mesocarp and stony hard endocarp.', tone: 'amber' },
    { name: 'Wolffia', group: 'angio', visual: 'Smallest', detail: 'NCERT names Wolffia as the smallest angiosperm.', tone: 'amber' },
    { name: 'Eucalyptus', group: 'angio', visual: 'Over 100 m', detail: 'NCERT names Eucalyptus as a tall angiosperm tree over 100 metres.', tone: 'amber' },
    { name: 'Maize', group: 'angio', visual: 'Monocot seed', detail: 'Monocot seed with scutellum, bulky endosperm, aleurone, coleoptile and coleorhiza.', tone: 'amber' },
];

const modeHints: Record<Mode, { title: string; section: string; facts: string[]; values: [string, string][] }> = {
    anatomy: {
        title: 'Ovule position is the key split',
        section: 'NCERT 3.4-3.5',
        facts: [
            'Gymnosperm ovules are not enclosed by any ovary wall.',
            'Angiosperm pollen grains and ovules develop in flowers.',
            'Angiosperm seeds are enclosed in fruits.',
        ],
        values: [
            ['Gymno ovule', 'Exposed'],
            ['Angio ovule', 'Inside ovary'],
            ['Fruit', 'Angiosperm only'],
        ],
    },
    cycle: {
        title: 'Both groups are seed plants',
        section: 'NCERT 3.4 summary',
        facts: [
            'Gymnosperms are heterosporous: microspores and megaspores.',
            'Gametophytes stay within sporangia retained on sporophytes.',
            'Reduction division occurs in microspore and megaspore mother cells.',
        ],
        values: [
            ['Dominant phase', 'Sporophyte'],
            ['Microspore', 'n'],
            ['Zygote', '2n'],
        ],
    },
    double: {
        title: 'Double fertilisation marker',
        section: 'NCERT 3.5, 5.6-5.7',
        facts: [
            'Angiosperm ovules are enclosed within the ovary wall.',
            'After fertilisation, the ovary becomes fruit and ovules become seeds.',
            'Class 11 seed chapter links endosperm formation with double fertilisation.',
        ],
        values: [
            ['Ovary after fertilisation', 'Fruit'],
            ['Ovule after fertilisation', 'Seed'],
            ['Food tissue', 'Endosperm'],
        ],
    },
    seed: {
        title: 'Seed anatomy from Chapter 5',
        section: 'NCERT 5.7.1-5.7.2',
        facts: [
            'Dicot seed coat has testa and tegmen, with hilum and micropyle.',
            'Maize has seed coat fused with fruit wall, bulky endosperm and aleurone.',
            'Scutellum is the single shield-shaped cotyledon in monocot seeds.',
        ],
        values: [
            ['Dicot cotyledons', 'Two'],
            ['Monocot cotyledon', 'One'],
            ['Maize endosperm', 'Bulky'],
        ],
    },
    examples: {
        title: 'NCERT named examples',
        section: 'NCERT Fig. 3.4, 3.5, 5.13',
        facts: [
            'Figure 3.4 names Cycas, Pinus and Ginkgo.',
            'Wolffia is the smallest angiosperm; Eucalyptus can exceed 100 m.',
            'Mango and coconut are drupes with differentiated pericarp layers.',
        ],
        values: [
            ['Gymno examples', '5'],
            ['Angio examples', '5'],
            ['Fruit example', 'Mango'],
        ],
    },
    compare: {
        title: 'Why classify separately?',
        section: 'NCERT Plant Kingdom Exercise 6',
        facts: [
            'Both bear seeds, but gymnosperm seeds are naked.',
            'Angiosperm seeds are enclosed in fruits.',
            'Flowers and fruits are the angiosperm signature structures.',
        ],
        values: [
            ['Question', 'Exercise 6'],
            ['Answer key', 'Seed covering'],
            ['Classes', 'Dicot / Monocot'],
        ],
    },
};

const GymnospermsAngiospermsLab: React.FC<GymnospermsAngiospermsLabProps> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('anatomy');
    const [gymnoSpecies, setGymnoSpecies] = useState<GymnoSpecies>('Pinus');
    const [angioExample, setAngioExample] = useState<AngioExample>('Hibiscus');
    const [seedView, setSeedView] = useState<SeedView>('dicot');
    const [exampleFilter, setExampleFilter] = useState<ExampleFilter>('all');
    const [showXray, setShowXray] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [showEtymology, setShowEtymology] = useState(true);
    const [slowMotion, setSlowMotion] = useState(false);
    const [paused, setPaused] = useState(false);
    const [step, setStep] = useState(0);
    const [quizChoice, setQuizChoice] = useState<'naked' | 'height' | 'cones' | null>(null);

    const activeHint = modeHints[mode];
    const filteredExamples = examples.filter((item) => exampleFilter === 'all' || item.group === exampleFilter);

    const resetSimulation = () => {
        setMode('anatomy');
        setGymnoSpecies('Pinus');
        setAngioExample('Hibiscus');
        setSeedView('dicot');
        setExampleFilter('all');
        setShowXray(true);
        setShowLabels(true);
        setShowEtymology(true);
        setSlowMotion(false);
        setPaused(false);
        setStep(0);
        setQuizChoice(null);
    };

    const setManualStep = (nextStep: number) => {
        setPaused(false);
        setStep((nextStep + stageSteps.length) % stageSteps.length);
    };

    const previousStep = () => setManualStep(step - 1);
    const nextStep = () => setManualStep(step + 1);

    const applyPreset = (preset: 'naked' | 'flower' | 'double' | 'seed') => {
        setPaused(false);
        setShowLabels(true);
        setShowXray(true);
        if (preset === 'naked') {
            setMode('anatomy');
            setGymnoSpecies('Pinus');
            setStep(3);
        }
        if (preset === 'flower') {
            setMode('anatomy');
            setAngioExample('Hibiscus');
            setStep(2);
        }
        if (preset === 'double') {
            setMode('double');
            setAngioExample('Hibiscus');
            setStep(3);
        }
        if (preset === 'seed') {
            setMode('seed');
            setSeedView('monocot');
            setStep(3);
        }
    };

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas width={1280} height={760} className="absolute inset-0 h-full w-full bg-white" />

                <div className="absolute inset-0 pointer-events-auto">
                    <SimulationCanvas
                        mode={mode}
                        step={step}
                        gymnoSpecies={gymnoSpecies}
                        angioExample={angioExample}
                        seedView={seedView}
                        examples={filteredExamples}
                        showXray={showXray}
                        showLabels={showLabels}
                        showEtymology={showEtymology}
                        slowMotion={slowMotion}
                        paused={paused}
                        quizChoice={quizChoice}
                        onQuizChoice={setQuizChoice}
                    />
                </div>

                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={() => setPaused((prev) => !prev)}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title={paused ? 'Start motion' : 'Pause motion'}
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
                {usesTimeline(mode) && (
                    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur pointer-events-auto">
                        <button onClick={previousStep} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300 hover:bg-amber-50" title="Previous stage">
                            <ArrowRight size={14} className="rotate-180" />
                        </button>
                        {stageSteps.map((item, index) => (
                            <button
                                key={item.label}
                                onClick={() => setManualStep(index)}
                                className={`h-8 rounded-lg border px-2 text-[11px] font-black transition-colors ${
                                    step === index ? 'border-amber-600 bg-amber-500 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300'
                                }`}
                                title={item.detail}
                            >
                                {item.label}
                            </button>
                        ))}
                        <button onClick={nextStep} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300 hover:bg-amber-50" title="Next stage">
                            <ArrowRight size={14} />
                        </button>
                    </div>
                )}
            </div>
            <LeftAside mode={mode} seedView={seedView} exampleFilter={exampleFilter} />
            <RightAside hint={activeHint} mode={mode} gymnoSpecies={gymnoSpecies} angioExample={angioExample} seedView={seedView} step={step} />
        </div>
    );

    const controlsCombo = (
        <div className="w-full h-full bg-white">
            <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[1.05fr_1.25fr_1fr_0.95fr]">
                <ControlGroup title="Scene" icon={<Trees size={15} className="text-emerald-700" />}>
                    <div className="grid grid-cols-3 gap-1.5">
                        {modes.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setMode(item.id);
                                    setPaused(false);
                                }}
                                className={`flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold transition-colors ${
                                    mode === item.id
                                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                        <PresetButton label="Naked" onClick={() => applyPreset('naked')} />
                        <PresetButton label="Flower" onClick={() => applyPreset('flower')} />
                        <PresetButton label="Double" onClick={() => applyPreset('double')} />
                        <PresetButton label="Seed" onClick={() => applyPreset('seed')} />
                    </div>
                </ControlGroup>

                {usesTimeline(mode) && (
                    <ControlGroup title="Timeline" icon={<Activity size={15} className="text-violet-700" />}>
                        <div className="grid grid-cols-[34px_34px_1fr_34px_34px] gap-1.5">
                            <button onClick={previousStep} className="flex min-h-[34px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50" title="Previous stage"><ArrowRight size={14} className="rotate-180" /></button>
                            <button onClick={() => setPaused((prev) => !prev)} className="flex min-h-[34px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50" title={paused ? 'Start motion' : 'Pause motion'}>{paused ? <Play size={14} /> : <Pause size={14} />}</button>
                            <div className="flex items-center justify-center rounded-lg border border-violet-200 bg-violet-50 px-2 text-center text-[11px] font-black text-violet-900">
                                {stageSteps[step].label}
                            </div>
                            <button onClick={nextStep} className="flex min-h-[34px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50" title="Next stage"><ArrowRight size={14} /></button>
                            <button onClick={resetSimulation} className="flex min-h-[34px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50" title="Reset"><RefreshCcw size={14} /></button>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                            {stageSteps.map((item, index) => (
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
                    </ControlGroup>
                )}

                <ControlGroup title="Specimen" icon={<Leaf size={15} className="text-amber-700" />}>
                    {mode === 'seed' ? (
                        <Segmented
                            options={[
                                ['dicot', 'Dicot'],
                                ['monocot', 'Monocot'],
                            ]}
                            value={seedView}
                            onChange={(value) => {
                                setSeedView(value as SeedView);
                                setPaused(false);
                            }}
                        />
                    ) : mode === 'examples' ? (
                        <Segmented
                            options={[
                                ['all', 'All'],
                                ['gymno', 'Gymno'],
                                ['angio', 'Angio'],
                            ]}
                            value={exampleFilter}
                            onChange={(value) => {
                                setExampleFilter(value as ExampleFilter);
                                setPaused(false);
                            }}
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <SelectBlock
                                label="Gymno"
                                value={gymnoSpecies}
                                onChange={(value) => {
                                    setGymnoSpecies(value as GymnoSpecies);
                                    setPaused(false);
                                }}
                                options={['Pinus', 'Cycas', 'Ginkgo']}
                            />
                            <SelectBlock
                                label="Angio"
                                value={angioExample}
                                onChange={(value) => {
                                    setAngioExample(value as AngioExample);
                                    setPaused(false);
                                }}
                                options={['Hibiscus', 'Mango', 'Maize']}
                            />
                        </div>
                    )}
                </ControlGroup>

                <ControlGroup title="View" icon={<Eye size={15} className="text-sky-700" />}>
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleButton active={showXray} onClick={() => setShowXray((prev) => !prev)} icon={showXray ? <Eye size={14} /> : <EyeOff size={14} />} label="X-ray" />
                        <ToggleButton active={showLabels} onClick={() => setShowLabels((prev) => !prev)} icon={<Info size={14} />} label="Labels" />
                        <ToggleButton active={showEtymology} onClick={() => setShowEtymology((prev) => !prev)} icon={<BookOpen size={14} />} label="Etym." />
                        <ToggleButton active={!paused} onClick={() => setPaused((prev) => !prev)} icon={paused ? <Play size={14} /> : <Pause size={14} />} label="Motion" />
                        <ToggleButton active={slowMotion} onClick={() => setSlowMotion((prev) => !prev)} icon={<Activity size={14} />} label="Slow" />
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

const SimulationCanvas = ({
    mode,
    step,
    gymnoSpecies,
    angioExample,
    seedView,
    examples,
    showXray,
    showLabels,
    showEtymology,
    slowMotion,
    paused,
    quizChoice,
    onQuizChoice,
}: {
    mode: Mode;
    step: number;
    gymnoSpecies: GymnoSpecies;
    angioExample: AngioExample;
    seedView: SeedView;
    examples: ExampleCard[];
    showXray: boolean;
    showLabels: boolean;
    showEtymology: boolean;
    slowMotion: boolean;
    paused: boolean;
    quizChoice: 'naked' | 'height' | 'cones' | null;
    onQuizChoice: (choice: 'naked' | 'height' | 'cones') => void;
}) => {
    const content = useMemo(() => {
        switch (mode) {
            case 'cycle':
                return <CycleView step={step} showLabels={showLabels} paused={paused} />;
            case 'double':
                return <DoubleFertilisationView step={step} slowMotion={slowMotion} showLabels={showLabels} paused={paused} />;
            case 'seed':
                return <SeedStructureView seedView={seedView} showLabels={showLabels} />;
            case 'examples':
                return <ExamplesGallery examples={examples} />;
            case 'compare':
                return <CompareView quizChoice={quizChoice} onQuizChoice={onQuizChoice} />;
            default:
                return <AnatomyView gymnoSpecies={gymnoSpecies} angioExample={angioExample} showXray={showXray} showLabels={showLabels} showEtymology={showEtymology} step={step} paused={paused} />;
        }
    }, [angioExample, examples, gymnoSpecies, mode, onQuizChoice, paused, quizChoice, seedView, showEtymology, showLabels, showXray, slowMotion, step]);

    return (
        <div className="relative h-full w-full bg-white">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute left-1/2 top-1/2 h-[650px] w-[1120px] -translate-x-1/2 -translate-y-1/2">
                {content}
            </div>
        </div>
    );
};

const AnatomyView = ({
    gymnoSpecies,
    angioExample,
    showXray,
    showLabels,
    showEtymology,
    step,
    paused,
}: {
    gymnoSpecies: GymnoSpecies;
    angioExample: AngioExample;
    showXray: boolean;
    showLabels: boolean;
    showEtymology: boolean;
    step: number;
    paused: boolean;
}) => (
    <div className="grid h-full grid-cols-2 gap-6">
        <div className="relative rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-5 shadow-sm">
            <TopBadge icon={<Trees size={16} />} label={`Gymnosperm: ${gymnoSpecies}`} color="emerald" />
            <GymnospermSvg species={gymnoSpecies} showLabels={showLabels} showXray={showXray} step={step} paused={paused} />
            {showEtymology && <SmallTag className="left-5 bottom-5" text="gymnos = naked; sperma = seeds" tone="emerald" />}
        </div>
        <div className="relative rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-5 shadow-sm">
            <TopBadge icon={<Flower size={16} />} label={`Angiosperm: ${angioExample}`} color="amber" />
            <AngiospermSvg example={angioExample} showLabels={showLabels} showXray={showXray} step={step} paused={paused} />
            <SmallTag className="left-5 bottom-5" text="ovary wall becomes fruit; ovules become seeds" tone="amber" />
        </div>
    </div>
);

const GymnospermSvg = ({ species, showLabels, showXray, step, paused }: { species: GymnoSpecies; showLabels: boolean; showXray: boolean; step: number; paused: boolean }) => {
    const isCycas = species === 'Cycas';
    const isGinkgo = species === 'Ginkgo';

    return (
        <svg viewBox="0 0 520 560" className="h-full w-full">
            <defs>
                <linearGradient id="needle" x1="0" x2="1">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#166534" />
                </linearGradient>
                <filter id="gymnoGlow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <rect x="18" y="28" width="484" height="492" rx="26" fill="#f8fafc" stroke="#d1fae5" />
            {[0, 1, 2, 3].map((i) => (
                <circle key={i} cx={72 + i * 92} cy={72 + (i % 2) * 38} r="4" fill="#facc15" opacity="0.45" filter="url(#gymnoGlow)">
                    {!paused && <animate attributeName="cy" values={`${72 + (i % 2) * 38};${56 + (i % 2) * 38};${72 + (i % 2) * 38}`} dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />}
                </circle>
            ))}
            {isGinkgo ? (
                <g transform="translate(78 84)">
                    <path d="M180 350 L180 128" stroke="#7c2d12" strokeWidth="18" strokeLinecap="round" />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <path key={i} d={`M180 ${155 + i * 38} C${95 - i * 3} ${115 + i * 18} ${78 - i * 4} ${78 + i * 42} ${162 - i * 8} ${122 + i * 32}Z`} fill="#84cc16" stroke="#4d7c0f" strokeWidth="3" opacity="0.9" />
                    ))}
                    <text x="180" y="390" textAnchor="middle" fontSize="17" fontWeight="800" fill="#365314">Ginkgo in NCERT Fig. 3.4</text>
                </g>
            ) : isCycas ? (
                <g transform="translate(74 76)">
                    <path d="M210 370 L210 150" stroke="#854d0e" strokeWidth="28" strokeLinecap="round" />
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                        const rot = -72 + i * 24;
                        return (
                            <g key={i} transform={`translate(210 150) rotate(${rot})`}>
                                <path d="M0 0 C72 -12 122 6 172 34" fill="none" stroke="#166534" strokeWidth="8" strokeLinecap="round" />
                                <path d="M36 -5 L58 -22 M66 -1 L90 -18 M96 8 L120 -8 M128 21 L152 8" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
                            </g>
                        );
                    })}
                    <path d="M132 386 C104 350 98 324 126 306 C162 324 160 356 132 386Z" fill="#f59e0b" stroke="#92400e" strokeWidth="5" />
                    <path d="M270 386 C244 350 238 324 266 306 C304 326 300 360 270 386Z" fill="#f59e0b" stroke="#92400e" strokeWidth="5" />
                    <text x="210" y="418" textAnchor="middle" fontSize="15" fontWeight="800" fill="#92400e">Coralloid roots: N2-fixing cyanobacteria</text>
                </g>
            ) : (
                <g transform="translate(60 70)">
                    <path d="M210 406 L210 86" stroke="#854d0e" strokeWidth="22" strokeLinecap="round" />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <g key={i} transform={`translate(210 ${130 + i * 48})`}>
                            {!paused && <animateTransform attributeName="transform" type="rotate" values={`-1 210 ${130 + i * 48};1 210 ${130 + i * 48};-1 210 ${130 + i * 48}`} dur={`${3 + i * 0.2}s`} additive="sum" repeatCount="indefinite" />}
                            <path d="M0 0 C-82 12 -132 44 -164 76" fill="none" stroke="url(#needle)" strokeWidth="8" strokeLinecap="round" />
                            <path d="M0 0 C82 12 132 44 164 76" fill="none" stroke="url(#needle)" strokeWidth="8" strokeLinecap="round" />
                        </g>
                    ))}
                    <text x="210" y="438" textAnchor="middle" fontSize="16" fontWeight="800" fill="#166534">Needle leaves reduce water loss</text>
                </g>
            )}

            <g transform="translate(302 255)">
                <path d="M34 0 C85 45 90 122 34 180 C-22 122 -18 45 34 0Z" fill="#a16207" stroke="#78350f" strokeWidth="4" />
                {[20, 50, 80, 110, 140].map((y, i) => (
                    <path key={i} d={`M34 ${y} C10 ${y + 14} 10 ${y + 38} 34 ${y + 52} C58 ${y + 38} 58 ${y + 14} 34 ${y}`} fill="#d97706" stroke="#92400e" strokeWidth="2" />
                ))}
                <ellipse cx="34" cy="102" rx="22" ry="32" fill={showXray ? '#fef08a' : '#fbbf24'} stroke="#ca8a04" strokeWidth="3" />
                <circle cx="34" cy="118" r="7" fill="#16a34a" />
                {step >= 1 && (
                    <circle cx={step === 1 ? -54 : 34} cy={step === 1 ? 20 : 72} r="8" fill="#facc15" stroke="#d97706" strokeWidth="2">
                        {!paused && <animate attributeName="cx" values="-54;34" dur="2s" repeatCount="indefinite" />}
                    </circle>
                )}
                {step >= 2 && (
                    <path d="M34 72 C28 94 28 108 34 118" fill="none" stroke="#fde047" strokeWidth="5" strokeLinecap="round" strokeDasharray="12 10">
                        {!paused && <animate attributeName="stroke-dashoffset" values="0;-44" dur="2.2s" repeatCount="indefinite" />}
                    </path>
                )}
            </g>

            {showLabels && (
                <>
                    <Label x={330} y={238} text="Female cone / megasporophylls" />
                    <Label x={346} y={366} text="Naked ovule, no ovary wall" />
                    <Label x={62} y={72} text="Sporophyte (2n), dominant" />
                    <Label x={64} y={468} text="Pollen tube discharges near archegonia" />
                </>
            )}
        </svg>
    );
};

const AngiospermSvg = ({ example, showLabels, showXray, step, paused }: { example: AngioExample; showLabels: boolean; showXray: boolean; step: number; paused: boolean }) => (
    <svg viewBox="0 0 520 560" className="h-full w-full">
        <defs>
            <linearGradient id="angioPetal" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#fbcfe8" />
                <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            <linearGradient id="fruitGlow" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
        </defs>
        <rect x="18" y="28" width="484" height="492" rx="26" fill="#f8fafc" stroke="#fde68a" />
        {example === 'Mango' ? (
            <g transform="translate(150 86)">
                <path d="M110 30 C220 80 230 258 115 356 C20 278 -22 116 110 30Z" fill="url(#fruitGlow)" stroke="#b45309" strokeWidth="7" />
                <path d="M112 92 C174 140 180 236 118 296 C60 242 42 156 112 92Z" fill="#fef3c7" stroke="#d97706" strokeWidth="5" />
                <path d="M116 142 C154 180 154 232 118 260 C84 232 78 176 116 142Z" fill="#92400e" />
                {step >= 3 && !paused && <animateTransform attributeName="transform" type="rotate" values="-1 260 250;1 260 250;-1 260 250" dur="3s" additive="sum" repeatCount="indefinite" />}
                <text x="116" y="405" textAnchor="middle" fontSize="17" fontWeight="800" fill="#92400e">Mango drupe: epicarp, mesocarp, endocarp</text>
            </g>
        ) : example === 'Maize' ? (
            <g transform="translate(126 88)">
                <ellipse cx="145" cy="190" rx="94" ry="164" fill="#fde68a" stroke="#ca8a04" strokeWidth="7" />
                <path d="M106 80 C180 130 190 242 114 322 C92 244 86 154 106 80Z" fill="#fef3c7" stroke="#d97706" strokeWidth="4" />
                <ellipse cx="112" cy="252" rx="24" ry="58" fill="#65a30d" />
                <text x="145" y="392" textAnchor="middle" fontSize="17" fontWeight="800" fill="#854d0e">Monocot seed: one scutellum</text>
            </g>
        ) : (
            <g transform="translate(72 55)">
                {[0, 1, 2, 3, 4].map((i) => (
                    <ellipse key={i} cx="190" cy="178" rx="64" ry="138" fill="url(#angioPetal)" stroke="#db2777" strokeWidth="4" transform={`rotate(${i * 72} 190 178)`} opacity="0.9">
                        {!paused && <animate attributeName="opacity" values="0.82;1;0.82" dur={`${2.2 + i * 0.2}s`} repeatCount="indefinite" />}
                    </ellipse>
                ))}
                <rect x="184" y="184" width="13" height="174" rx="7" fill="#fbbf24" />
                <path d="M152 358 C168 425 212 425 228 358 C220 320 160 320 152 358Z" fill={showXray ? '#fce7f3' : '#fb7185'} stroke="#be123c" strokeWidth={showXray ? 3 : 6} strokeDasharray={showXray ? '9 7' : '0'} />
                <ellipse cx="190" cy="370" rx="26" ry="39" fill="#fff7ed" stroke="#f97316" strokeWidth="3" />
                <circle cx="190" cy="392" r="7" fill="#16a34a" />
                <circle cx="186" cy="366" r="5" fill="#2563eb" />
                <circle cx="196" cy="366" r="5" fill="#2563eb" />
                {step >= 1 && <circle cx="190" cy="86" r="10" fill="#facc15" stroke="#d97706" strokeWidth="2" />}
                {step >= 2 && (
                    <path d="M190 94 C190 180 190 265 190 342" stroke="#fde047" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="18 12">
                        {!paused && <animate attributeName="stroke-dashoffset" values="0;-72" dur="2.4s" repeatCount="indefinite" />}
                    </path>
                )}
                {step >= 3 && (
                    <>
                        <circle cx="186" cy="392" r="6" fill="#ef4444">
                            {!paused && <animate attributeName="r" values="5;8;5" dur="1.4s" repeatCount="indefinite" />}
                        </circle>
                        <circle cx="196" cy="366" r="6" fill="#f59e0b">
                            {!paused && <animate attributeName="r" values="5;8;5" dur="1.4s" repeatCount="indefinite" />}
                        </circle>
                    </>
                )}
            </g>
        )}
        {showLabels && (
            <>
                <Label x={334} y={100} text="Flower: specialised structure" />
                <Label x={334} y={356} text="Ovules enclosed in ovary" />
                <Label x={334} y={405} text="Ovary matures into fruit" />
                <Label x={52} y={470} text="Seeds enclosed in fruits" />
            </>
        )}
    </svg>
);

const CycleView = ({ step, showLabels, paused }: { step: number; showLabels: boolean; paused: boolean }) => {
    const cycle = [
        ['Sporophyte', '2n dominant plant'],
        ['Meiosis', 'microspores + megaspores'],
        ['Gametophyte', 'pollen + female gametophyte'],
        ['Fertilisation', 'zygote -> embryo -> seed'],
    ];

    return (
        <div className="relative h-full rounded-2xl border border-slate-200 bg-white shadow-sm">
            <svg viewBox="0 0 1120 650" className="h-full w-full">
                <rect x="24" y="24" width="1072" height="602" rx="28" fill="#f8fafc" stroke="#e2e8f0" />
                <LifeCycleWheel cx={300} cy={324} title="Gymnosperm" color="#16a34a" step={step} labels={cycle} paused={paused} />
                <LifeCycleWheel cx={820} cy={324} title="Angiosperm" color="#f59e0b" step={step} labels={cycle} paused={paused} />
                <path d="M560 122 L560 528" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10 8" />
                {showLabels && (
                    <>
                        <Label x={196} y={558} text="Archegonia retained in megasporangium" />
                        <Label x={670} y={558} text="Flower, ovary and fruit added to seed habit" />
                        <Label x={398} y={82} text="Both: sporophyte dominant, heterosporous seed plants" />
                    </>
                )}
            </svg>
        </div>
    );
};

const LifeCycleWheel = ({ cx, cy, title, color, step, labels, paused }: { cx: number; cy: number; title: string; color: string; step: number; labels: string[][]; paused: boolean }) => (
    <g>
        <circle cx={cx} cy={cy} r="192" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3" />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="900" fill="#0f172a">{title}</text>
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize="13" fontWeight="700" fill="#64748b">No independent free-living gametophyte</text>
        {labels.map(([head, sub], i) => {
            const angle = -90 + i * 90;
            const rad = (angle * Math.PI) / 180;
            const x = cx + Math.cos(rad) * 185;
            const y = cy + Math.sin(rad) * 185;
            const active = i === step;
            return (
                <g key={head}>
                    <circle cx={x} cy={y} r={active ? 52 : 44} fill={active ? color : '#f8fafc'} stroke={active ? color : '#cbd5e1'} strokeWidth="3">
                        {active && !paused && <animate attributeName="r" values="49;56;49" dur="1.5s" repeatCount="indefinite" />}
                    </circle>
                    <text x={x} y={y - 4} textAnchor="middle" fontSize="14" fontWeight="900" fill={active ? '#ffffff' : '#334155'}>{head}</text>
                    <text x={x} y={y + 17} textAnchor="middle" fontSize="10" fontWeight="700" fill={active ? '#ffffff' : '#64748b'}>{sub}</text>
                </g>
            );
        })}
        <path d={`M${cx} ${cy - 185} A185 185 0 1 1 ${cx - 1} ${cy - 185}`} fill="none" stroke={color} strokeWidth="5" strokeDasharray="34 22" opacity="0.45">
            {!paused && <animate attributeName="stroke-dashoffset" values="0;-112" dur="5s" repeatCount="indefinite" />}
        </path>
    </g>
);

const DoubleFertilisationView = ({ step, slowMotion, showLabels, paused }: { step: number; slowMotion: boolean; showLabels: boolean; paused: boolean }) => (
    <div className="relative h-full rounded-2xl border border-slate-200 bg-white shadow-sm">
        <style>{`
            @keyframes pollen-slide { 0% { transform: translate(0, 0); opacity: 0.95; } 100% { transform: translate(-8px, 206px); opacity: 0.95; } }
            @keyframes pulse-fusion { 0%,100% { transform: scale(1); opacity: 0.82; } 50% { transform: scale(1.28); opacity: 1; } }
            .pollen-slide { animation: pollen-slide ${slowMotion ? '6s' : '2.8s'} ease-in-out infinite alternate; transform-origin: center; }
            .pulse-fusion { animation: pulse-fusion 1.4s ease-in-out infinite; transform-origin: center; }
            .motion-paused { animation-play-state: paused; }
        `}</style>
        <svg viewBox="0 0 1120 650" className="h-full w-full">
            <defs>
                <linearGradient id="pistilPink" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fbcfe8" />
                    <stop offset="100%" stopColor="#db2777" />
                </linearGradient>
                <linearGradient id="ovuleWarm" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fff7ed" />
                    <stop offset="100%" stopColor="#fdba74" />
                </linearGradient>
                <filter id="fertGlow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <rect x="24" y="24" width="1072" height="602" rx="28" fill="#fff7ed" stroke="#fed7aa" />
            <g transform="translate(126 54)">
                <path d="M330 35 C420 82 442 170 368 246 C294 170 240 84 330 35Z" fill="#f9a8d4" stroke="#db2777" strokeWidth="6" />
                <ellipse cx="330" cy="38" rx="42" ry="18" fill="#facc15" stroke="#d97706" strokeWidth="4" />
                <circle cx="330" cy="34" r="12" fill="#fde047" stroke="#ca8a04" strokeWidth="3" />

                <path d="M318 214 C312 296 308 392 316 470" fill="none" stroke="#db2777" strokeWidth="24" strokeLinecap="round" />
                <path d="M342 214 C348 296 352 392 344 470" fill="none" stroke="#be185d" strokeWidth="24" strokeLinecap="round" opacity="0.45" />
                <path d="M330 66 C330 176 330 314 330 426" stroke="#fde047" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={step >= 2 ? '18 12' : '0'}>
                    {step >= 2 && !paused && <animate attributeName="stroke-dashoffset" values="0;-72" dur={slowMotion ? '5s' : '2.4s'} repeatCount="indefinite" />}
                </path>

                <path d="M190 484 C230 374 430 374 470 484 C438 584 222 584 190 484Z" fill="#fce7f3" stroke="#be123c" strokeWidth="7" />
                <path d="M220 488 C260 410 400 410 440 488 C402 550 258 550 220 488Z" fill="#fff1f2" stroke="#fb7185" strokeWidth="2" strokeDasharray="10 7" />
                <ellipse cx="330" cy="492" rx="88" ry="48" fill="url(#ovuleWarm)" stroke="#f97316" strokeWidth="5" />
                <ellipse cx="330" cy="492" rx="52" ry="27" fill="#ffffff" stroke="#fbbf24" strokeWidth="3" />
                <path d="M330 432 C326 452 326 466 330 478" fill="none" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />

                <circle cx="330" cy="506" r="10" fill="#22c55e" stroke="#15803d" strokeWidth="3" className={step >= 3 ? `pulse-fusion ${paused ? 'motion-paused' : ''}` : ''} filter={step >= 3 ? 'url(#fertGlow)' : undefined} />
                <circle cx="316" cy="490" r="8" fill="#2563eb" />
                <circle cx="344" cy="490" r="8" fill="#2563eb" />
                <circle cx="302" cy="486" r="6" fill="#94a3b8" />
                <circle cx="358" cy="486" r="6" fill="#94a3b8" />
                {step >= 3 && (
                    <circle cx="344" cy="490" r="11" fill="#f59e0b" opacity="0.9" className={`pulse-fusion ${paused ? 'motion-paused' : ''}`} filter="url(#fertGlow)" />
                )}

                {step >= 1 && <circle cx="330" cy="34" r="7" fill="#ef4444" />}
                {step >= 2 && <circle cx="338" cy="274" r="8" fill="#ef4444" className={`pollen-slide ${paused ? 'motion-paused' : ''}`} />}
                {step >= 3 && <circle cx="350" cy="264" r="8" fill="#f59e0b" className={`pollen-slide ${paused ? 'motion-paused' : ''}`} />}

                <g>
                    <path d="M170 442 L220 468" stroke="#be123c" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="58" y="420" width="112" height="30" rx="9" fill="#ffffff" stroke="#fecdd3" />
                    <text x="114" y="439" textAnchor="middle" fontSize="12" fontWeight="900" fill="#be123c">ovary wall</text>
                    <path d="M474 494 L420 494" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="474" y="479" width="142" height="30" rx="9" fill="#ffffff" stroke="#fed7aa" />
                    <text x="545" y="498" textAnchor="middle" fontSize="12" fontWeight="900" fill="#9a3412">ovule inside ovary</text>
                </g>
            </g>
            <g transform="translate(746 102)">
                <ResultPill y={0} color="#db2777" title="1. Pollination" body="pollen grain rests on stigma" active={step >= 1} />
                <ResultPill y={112} color="#d97706" title="2. Tube growth" body="pollen tube enters ovule through micropyle" active={step >= 2} />
                <ResultPill y={224} color="#16a34a" title="3. Zygote" body="one male gamete fuses with egg" active={step >= 3} />
                <ResultPill y={336} color="#2563eb" title="4. Endosperm" body="food tissue linked to double fertilisation" active={step >= 3} />
            </g>
            {showLabels && (
                <>
                    <Label x={386} y={84} text="Pollen grain on stigma" />
                    <Label x={480} y={282} text="Pollen tube through style" />
                    <Label x={418} y={594} text="NCERT: ovary becomes fruit; ovules become seeds" />
                </>
            )}
        </svg>
    </div>
);

const ResultPill = ({ y, color, title, body, active }: { y: number; color: string; title: string; body: string; active: boolean }) => (
    <g transform={`translate(0 ${y})`} opacity={active ? 1 : 0.35}>
        <rect x="0" y="0" width="265" height="86" rx="18" fill="#ffffff" stroke={color} strokeWidth="3" />
        <circle cx="34" cy="43" r="15" fill={color} />
        <text x="60" y="34" fontSize="18" fontWeight="900" fill="#0f172a">{title}</text>
        <text x="60" y="58" fontSize="13" fontWeight="700" fill="#475569">{body}</text>
    </g>
);

const SeedStructureView = ({ seedView, showLabels }: { seedView: SeedView; showLabels: boolean }) => (
    <div className="relative h-full rounded-2xl border border-slate-200 bg-white shadow-sm">
        <svg viewBox="0 0 1120 650" className="h-full w-full">
            <rect x="24" y="24" width="1072" height="602" rx="28" fill="#f8fafc" stroke="#e2e8f0" />
            {seedView === 'dicot' ? (
                <g transform="translate(235 88)">
                    <path d="M312 28 C520 62 570 292 388 438 C196 520 24 340 74 150 C104 62 194 14 312 28Z" fill="#fde68a" stroke="#92400e" strokeWidth="8" />
                    <path d="M296 74 C420 94 462 234 352 354 C234 430 110 310 148 166 C170 102 220 72 296 74Z" fill="#fef3c7" stroke="#b45309" strokeWidth="4" />
                    <path d="M304 86 C238 164 234 286 314 374 C395 292 396 168 304 86Z" fill="#fbbf24" stroke="#d97706" strokeWidth="3" />
                    <path d="M318 214 C346 238 352 292 332 330" stroke="#16a34a" strokeWidth="8" strokeLinecap="round" fill="none" />
                    <circle cx="312" cy="210" r="12" fill="#22c55e" />
                    <circle cx="104" cy="244" r="12" fill="#7c2d12" />
                    <text x="312" y="495" textAnchor="middle" fontSize="18" fontWeight="900" fill="#78350f">Dicot: gram / pea - two cotyledons</text>
                </g>
            ) : (
                <g transform="translate(255 68)">
                    <ellipse cx="286" cy="260" rx="160" ry="226" fill="#fde68a" stroke="#ca8a04" strokeWidth="8" />
                    <ellipse cx="286" cy="260" rx="126" ry="188" fill="#fef3c7" stroke="#d97706" strokeWidth="5" />
                    <path d="M190 86 C314 164 332 346 208 450 C152 340 142 190 190 86Z" fill="#fff7ed" stroke="#b45309" strokeWidth="4" />
                    <path d="M206 280 C254 310 256 366 214 410" stroke="#16a34a" strokeWidth="13" strokeLinecap="round" fill="none" />
                    <ellipse cx="188" cy="332" rx="26" ry="82" fill="#65a30d" />
                    <path d="M330 75 C384 200 382 320 330 445" fill="none" stroke="#f59e0b" strokeWidth="16" strokeLinecap="round" opacity="0.8" />
                    <text x="286" y="535" textAnchor="middle" fontSize="18" fontWeight="900" fill="#78350f">Monocot: maize - scutellum and bulky endosperm</text>
                </g>
            )}
            {showLabels && seedView === 'dicot' && (
                <>
                    <Label x={214} y={150} text="Seed coat: testa + tegmen" />
                    <Label x={188} y={335} text="Hilum and micropyle" />
                    <Label x={604} y={286} text="Two fleshy cotyledons store food" />
                    <Label x={604} y={354} text="Plumule + radicle on embryonal axis" />
                </>
            )}
            {showLabels && seedView === 'monocot' && (
                <>
                    <Label x={620} y={150} text="Seed coat fused with fruit wall" />
                    <Label x={636} y={252} text="Bulky endosperm stores food" />
                    <Label x={636} y={330} text="Aleurone layer is proteinous" />
                    <Label x={176} y={390} text="Scutellum; coleoptile; coleorhiza" />
                </>
            )}
        </svg>
    </div>
);

const ExamplesGallery = ({ examples }: { examples: ExampleCard[] }) => (
    <div className="grid h-full grid-cols-5 gap-3">
        {examples.map((item) => (
            <div key={item.name} className={`rounded-2xl border bg-white p-3 shadow-sm ${item.group === 'gymno' ? 'border-emerald-200' : 'border-amber-200'}`}>
                <div className={`mb-3 flex h-28 items-center justify-center rounded-xl ${item.group === 'gymno' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <ExampleIcon item={item} />
                </div>
                <div className="text-base font-black text-slate-900">{item.name}</div>
                <div className={`mt-1 text-xs font-bold uppercase ${item.group === 'gymno' ? 'text-emerald-700' : 'text-amber-700'}`}>{item.visual}</div>
                <div className="mt-2 text-xs leading-snug text-slate-600">{item.detail}</div>
            </div>
        ))}
    </div>
);

const ExampleIcon = ({ item }: { item: ExampleCard }) => {
    const color = item.group === 'gymno' ? '#16a34a' : '#f59e0b';
    if (item.name === 'Mango') return <Apple size={58} color="#f59e0b" strokeWidth={1.8} />;
    if (item.name === 'Hibiscus') return <Flower size={58} color="#db2777" strokeWidth={1.8} />;
    if (item.name === 'Maize') return <Sprout size={58} color="#ca8a04" strokeWidth={1.8} />;
    return <Trees size={58} color={color} strokeWidth={1.8} />;
};

const CompareView = ({ quizChoice, onQuizChoice }: { quizChoice: 'naked' | 'height' | 'cones' | null; onQuizChoice: (choice: 'naked' | 'height' | 'cones') => void }) => (
    <div className="grid h-full grid-cols-[1.55fr_0.85fr] gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 grid grid-cols-[0.85fr_1fr_1fr] gap-2 text-xs font-black uppercase text-slate-500">
                <div>Feature</div>
                <div className="text-emerald-700">Gymnosperm</div>
                <div className="text-amber-700">Angiosperm</div>
            </div>
            <div className="space-y-2">
                {comparisonRows.map(([feature, gymno, angio]) => (
                    <div key={feature} className="grid grid-cols-[0.85fr_1fr_1fr] gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm">
                        <div className="font-black text-slate-900">{feature}</div>
                        <div className="font-semibold text-emerald-800">{gymno}</div>
                        <div className="font-semibold text-amber-800">{angio}</div>
                    </div>
                ))}
            </div>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-black text-violet-950">
                <Award size={20} />
                NCERT Exercise 6
            </div>
            <p className="mt-4 text-sm font-semibold leading-relaxed text-violet-900">
                Both gymnosperms and angiosperms bear seeds. Why are they classified separately?
            </p>
            <div className="mt-5 space-y-2">
                <QuizButton active={quizChoice === 'naked'} correct label="Seed covering differs: naked vs enclosed in fruits" onClick={() => onQuizChoice('naked')} />
                <QuizButton active={quizChoice === 'height'} label="Angiosperms are always taller" onClick={() => onQuizChoice('height')} />
                <QuizButton active={quizChoice === 'cones'} label="Only cone colour differs" onClick={() => onQuizChoice('cones')} />
            </div>
            {quizChoice && (
                <div className={`mt-5 rounded-xl border p-3 text-sm font-bold ${quizChoice === 'naked' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900'}`}>
                    {quizChoice === 'naked' ? 'Correct. Gymnosperms have exposed ovules and naked seeds; angiosperms enclose seeds in fruits.' : 'Not quite. The decisive NCERT distinction is whether the seed is naked or enclosed in fruit.'}
                </div>
            )}
        </div>
    </div>
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

const LeftAside = ({ mode, seedView, exampleFilter }: { mode: Mode; seedView: SeedView; exampleFilter: ExampleFilter }) => (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
        <div className="flex flex-col gap-2.5">
            <AsideCard title="Concept Map" subtitle="NCERT visual checkpoints">
                <MiniDiagram mode={mode} seedView={seedView} exampleFilter={exampleFilter} />
            </AsideCard>
            <AsideCard title="Figure References" subtitle="Class 11 Biology">
                <ReferenceRow icon={<Trees size={15} />} label="Fig. 3.4" value="Cycas, Pinus, Ginkgo" />
                <ReferenceRow icon={<Flower size={15} />} label="Fig. 3.5" value="Dicotyledon and monocotyledon" />
                <ReferenceRow icon={<Apple size={15} />} label="Fig. 5.13" value="Mango and coconut drupes" />
                <ReferenceRow icon={<Microscope size={15} />} label="Fig. 5.14-5.15" value="Gram seed and maize seed" />
            </AsideCard>
            <AsideCard title="Ploidy Trail" subtitle="NEET quick audit">
                <div className="space-y-2 text-sm font-bold text-slate-700">
                    <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2"><span>Microspore / megaspore</span><span className="text-emerald-700">n</span></div>
                    <div className="flex justify-between rounded-lg bg-sky-50 px-3 py-2"><span>Sporophyte</span><span className="text-sky-700">2n</span></div>
                    <div className="flex justify-between rounded-lg bg-amber-50 px-3 py-2"><span>Primary endosperm nucleus</span><span className="text-amber-700">3n</span></div>
                </div>
            </AsideCard>
        </div>
    </aside>
);

const RightAside = ({
    hint,
    mode,
    gymnoSpecies,
    angioExample,
    seedView,
    step,
}: {
    hint: { title: string; section: string; facts: string[]; values: [string, string][] };
    mode: Mode;
    gymnoSpecies: GymnoSpecies;
    angioExample: AngioExample;
    seedView: SeedView;
    step: number;
}) => (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
        <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 text-base font-extrabold text-emerald-950">
                    <Info size={17} />
                    {hint.title}
                </div>
                <div className="mt-1 text-xs font-semibold text-emerald-700">{hint.section}</div>
                <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-emerald-950">
                    {hint.facts.map((fact) => (
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
                <ValueRow label="Gymno specimen" value={gymnoSpecies} tone="emerald" />
                <ValueRow label="Angio specimen" value={angioExample} tone="amber" />
                <ValueRow label="Seed view" value={seedView === 'dicot' ? 'Dicot / Gram' : 'Monocot / Maize'} tone="cyan" />
                {usesTimeline(mode) && <ValueRow label="Selected stage" value={stageSteps[step].label} tone="violet" />}
                {hint.values.map(([label, value]) => (
                    <React.Fragment key={label}>
                        <ValueRow label={label} value={value} tone="amber" />
                    </React.Fragment>
                ))}
            </div>
        </div>
    </aside>
);

const MiniDiagram = ({ mode, seedView, exampleFilter }: { mode: Mode; seedView: SeedView; exampleFilter: ExampleFilter }) => (
    <svg viewBox="0 0 300 180" className="h-[170px] w-full">
        <rect x="8" y="8" width="284" height="164" rx="18" fill="#f8fafc" stroke="#cbd5e1" />
        {mode === 'seed' ? (
            <>
                <ellipse cx="85" cy="90" rx="52" ry="68" fill={seedView === 'dicot' ? '#fde68a' : '#e2e8f0'} stroke="#d97706" strokeWidth="4" />
                <ellipse cx="215" cy="90" rx="52" ry="68" fill={seedView === 'monocot' ? '#fde68a' : '#e2e8f0'} stroke="#d97706" strokeWidth="4" />
                <text x="85" y="158" textAnchor="middle" fontSize="13" fontWeight="800" fill="#475569">Dicot</text>
                <text x="215" y="158" textAnchor="middle" fontSize="13" fontWeight="800" fill="#475569">Monocot</text>
            </>
        ) : mode === 'examples' ? (
            <>
                <circle cx="92" cy="90" r="48" fill={exampleFilter !== 'angio' ? '#dcfce7' : '#e2e8f0'} />
                <circle cx="208" cy="90" r="48" fill={exampleFilter !== 'gymno' ? '#fef3c7' : '#e2e8f0'} />
                <text x="92" y="96" textAnchor="middle" fontSize="15" fontWeight="900" fill="#166534">Gymno</text>
                <text x="208" y="96" textAnchor="middle" fontSize="15" fontWeight="900" fill="#92400e">Angio</text>
            </>
        ) : (
            <>
                <path d="M64 132 C96 52 132 52 150 132" fill="none" stroke="#16a34a" strokeWidth="10" strokeLinecap="round" />
                <path d="M156 132 C174 52 214 52 246 132" fill="none" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" />
                <circle cx="150" cy="132" r="13" fill="#facc15" />
                <text x="150" y="158" textAnchor="middle" fontSize="13" fontWeight="800" fill="#475569">Seed habit</text>
            </>
        )}
    </svg>
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

const ValueRow = ({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'cyan' | 'emerald' | 'slate' | 'violet' }) => {
    const colors = {
        amber: 'bg-amber-50 text-amber-700',
        cyan: 'bg-cyan-50 text-cyan-700',
        emerald: 'bg-emerald-50 text-emerald-700',
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

const PresetButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="min-h-[30px] rounded-lg border border-slate-200 bg-slate-50 px-2 text-[10px] font-black text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50"
    >
        {label}
    </button>
);

const Segmented = ({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (value: string) => void }) => (
    <div className="grid grid-cols-3 gap-1.5">
        {options.map(([id, label]) => (
            <button
                key={id}
                onClick={() => onChange(id)}
                className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                    value === id ? 'border-amber-600 bg-amber-500 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300'
                }`}
            >
                {label}
            </button>
        ))}
    </div>
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

const TopBadge = ({ icon, label, color }: { icon: React.ReactNode; label: string; color: 'emerald' | 'amber' }) => (
    <div className={`absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black shadow-sm ${color === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
        {icon}
        {label}
    </div>
);

const SmallTag = ({ text, tone, className }: { text: string; tone: 'emerald' | 'amber'; className: string }) => (
    <div className={`absolute z-10 rounded-full border px-3 py-1.5 text-xs font-black shadow-sm ${className} ${tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
        {text}
    </div>
);

const Label = ({ x, y, text }: { x: number; y: number; text: string }) => {
    const display = text.length > 58 ? `${text.slice(0, 55)}...` : text;
    const width = Math.min(360, Math.max(116, display.length * 7.2));
    const labelX = Math.max(30, Math.min(x - 8, 1090 - width));
    const textX = labelX + 8;
    return (
        <g>
            <rect x={labelX} y={y - 17} width={width} height="27" rx="9" fill="#ffffff" stroke="#cbd5e1" />
            <text x={textX} y={y} fontSize="12" fontWeight="800" fill="#334155">{display}</text>
        </g>
    );
};

export default GymnospermsAngiospermsLab;
