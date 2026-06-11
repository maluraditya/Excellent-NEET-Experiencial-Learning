import React, { useEffect, useState } from 'react';
import {
    Activity,
    ArrowRight,
    BookOpen,
    Bug,
    CircleDot,
    Droplets,
    Eye,
    EyeOff,
    Fish,
    Gauge,
    Layers,
    Microscope,
    Pause,
    Play,
    RefreshCcw,
    Search,
    Shield,
    Sparkles,
    Waves,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Mode = 'scanner' | 'porifera' | 'cnidaria' | 'coelom' | 'gallery' | 'compare';
type PhylumId =
    | 'porifera'
    | 'cnidaria'
    | 'ctenophora'
    | 'platyhelminthes'
    | 'aschelminthes'
    | 'annelida'
    | 'arthropoda'
    | 'mollusca'
    | 'echinodermata'
    | 'hemichordata';
type ObeliaStage = 'polyp' | 'budding' | 'medusa' | 'gametes' | 'planula';

interface AnimalKingdomLabProps {
    topic: any;
    onExit: () => void;
}

interface PhylumInfo {
    id: PhylumId;
    name: string;
    common: string;
    example: string;
    specimen: string;
    level: string;
    symmetry: string;
    germLayers: string;
    coelom: string;
    hallmark: string;
    color: string;
}

const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: 'scanner', label: 'Scanner', icon: <Search size={13} /> },
    { id: 'porifera', label: 'Canal', icon: <Droplets size={13} /> },
    { id: 'cnidaria', label: 'Obelia', icon: <Waves size={13} /> },
    { id: 'coelom', label: 'Coelom', icon: <CircleDot size={13} /> },
    { id: 'gallery', label: 'Gallery', icon: <Layers size={13} /> },
    { id: 'compare', label: 'Compare', icon: <BookOpen size={13} /> },
];

const OBELIA_STAGES: ObeliaStage[] = ['polyp', 'budding', 'medusa', 'gametes', 'planula'];

const PHYLA: PhylumInfo[] = [
    {
        id: 'porifera',
        name: 'Porifera',
        common: 'sponges',
        example: 'Sycon, Spongilla, Euspongia',
        specimen: 'tube sponge with pores',
        level: 'Cellular',
        symmetry: 'Mostly asymmetrical',
        germLayers: 'No true tissues',
        coelom: 'No coelom',
        hallmark: 'Canal system: ostia to spongocoel to osculum; choanocytes drive water flow.',
        color: '#059669',
    },
    {
        id: 'cnidaria',
        name: 'Cnidaria',
        common: 'coelenterates',
        example: 'Hydra, Obelia, Aurelia, Adamsia',
        specimen: 'Hydra, Obelia or jellyfish',
        level: 'Tissue',
        symmetry: 'Radial',
        germLayers: 'Diploblastic',
        coelom: 'No coelom',
        hallmark: 'Cnidoblasts, gastrovascular cavity, polyp and medusa forms; Obelia shows metagenesis.',
        color: '#0284c7',
    },
    {
        id: 'ctenophora',
        name: 'Ctenophora',
        common: 'comb jellies',
        example: 'Pleurobrachia, Ctenoplana',
        specimen: 'comb jelly with eight plates',
        level: 'Tissue',
        symmetry: 'Radial',
        germLayers: 'Diploblastic',
        coelom: 'No coelom',
        hallmark: 'Eight comb plates for locomotion and bioluminescence.',
        color: '#7c3aed',
    },
    {
        id: 'platyhelminthes',
        name: 'Platyhelminthes',
        common: 'flatworms',
        example: 'Taenia, Fasciola',
        specimen: 'flatworm or tapeworm body',
        level: 'Organ',
        symmetry: 'Bilateral',
        germLayers: 'Triploblastic',
        coelom: 'Acoelomate',
        hallmark: 'Dorsoventrally flattened; flame cells; many parasitic forms with hooks and suckers.',
        color: '#db2777',
    },
    {
        id: 'aschelminthes',
        name: 'Aschelminthes',
        common: 'roundworms',
        example: 'Ascaris, Wuchereria, Ancylostoma',
        specimen: 'roundworm cylindrical body',
        level: 'Organ-system',
        symmetry: 'Bilateral',
        germLayers: 'Triploblastic',
        coelom: 'Pseudocoelomate',
        hallmark: 'Circular cross-section, complete alimentary canal and separate sexes.',
        color: '#d97706',
    },
    {
        id: 'annelida',
        name: 'Annelida',
        common: 'segmented worms',
        example: 'Nereis, Pheretima, Hirudinaria',
        specimen: 'earthworm or leech segments',
        level: 'Organ-system',
        symmetry: 'Bilateral',
        germLayers: 'Triploblastic',
        coelom: 'Coelomate',
        hallmark: 'Metameric segmentation, closed circulation and nephridia.',
        color: '#16a34a',
    },
    {
        id: 'arthropoda',
        name: 'Arthropoda',
        common: 'joint-legged animals',
        example: 'Apis, Bombyx, Anopheles, Locusta',
        specimen: 'insect with jointed legs',
        level: 'Organ-system',
        symmetry: 'Bilateral',
        germLayers: 'Triploblastic',
        coelom: 'Coelomate',
        hallmark: 'Largest phylum; chitinous exoskeleton, jointed appendages and open circulation.',
        color: '#ea580c',
    },
    {
        id: 'mollusca',
        name: 'Mollusca',
        common: 'soft-bodied animals',
        example: 'Pila, Sepia, Octopus, Dentalium',
        specimen: 'snail or shell-bearing mollusc',
        level: 'Organ-system',
        symmetry: 'Bilateral',
        germLayers: 'Triploblastic',
        coelom: 'Coelomate',
        hallmark: 'Head, muscular foot, visceral hump, mantle, shell and radula in most.',
        color: '#0891b2',
    },
    {
        id: 'echinodermata',
        name: 'Echinodermata',
        common: 'spiny-skinned animals',
        example: 'Asterias, Echinus, Antedon, Ophiura',
        specimen: 'starfish or sea urchin',
        level: 'Organ-system',
        symmetry: 'Adult radial; larva bilateral',
        germLayers: 'Triploblastic',
        coelom: 'Coelomate',
        hallmark: 'Marine forms with calcareous endoskeleton and water vascular system.',
        color: '#ca8a04',
    },
    {
        id: 'hemichordata',
        name: 'Hemichordata',
        common: 'acorn worms',
        example: 'Balanoglossus, Saccoglossus',
        specimen: 'acorn worm body regions',
        level: 'Organ-system',
        symmetry: 'Bilateral',
        germLayers: 'Triploblastic',
        coelom: 'Coelomate',
        hallmark: 'Worm-like marine body divided into proboscis, collar and trunk.',
        color: '#64748b',
    },
];

const modeFacts: Record<Mode, { title: string; section: string; facts: string[]; values: [string, string][] }> = {
    scanner: {
        title: 'Classification logic',
        section: 'NCERT Animal Kingdom basis of classification',
        facts: [
            'Body plans are compared by level of organisation, symmetry, germ layers, coelom and segmentation.',
            'Non-chordates lack a notochord.',
            'The phyla progress from cellular organisation in Porifera to organ-system organisation in higher non-chordates.',
        ],
        values: [
            ['Phyla shown', '10'],
            ['Notochord', 'Absent'],
            ['Main scan', 'Body plan'],
        ],
    },
    porifera: {
        title: 'Porifera canal system',
        section: 'NCERT Phylum Porifera',
        facts: [
            'Water enters through ostia, reaches spongocoel and leaves through osculum.',
            'Choanocytes or collar cells line the spongocoel and canals.',
            'The canal current helps food gathering, respiration and waste removal.',
        ],
        values: [
            ['Level', 'Cellular'],
            ['Flow path', 'Ostia to osculum'],
            ['Example', 'Sycon'],
        ],
    },
    cnidaria: {
        title: 'Cnidaria forms',
        section: 'NCERT Phylum Coelenterata / Cnidaria',
        facts: [
            'Cnidarians have tissue-level organisation, radial symmetry and diploblastic body wall.',
            'Cnidoblasts are used for anchorage, defence and prey capture.',
            'In Obelia, polyp produces medusa asexually and medusa produces gametes sexually: metagenesis.',
        ],
        values: [
            ['Polyp', 'Sessile'],
            ['Medusa', 'Free-swimming'],
            ['Example', 'Obelia'],
        ],
    },
    coelom: {
        title: 'Coelom ladder',
        section: 'NCERT coelom classification',
        facts: [
            'Platyhelminthes are acoelomate.',
            'Aschelminthes are pseudocoelomate.',
            'Annelida onward in this non-chordate set are coelomate.',
        ],
        values: [
            ['Acoelomate', 'Flatworm'],
            ['Pseudo', 'Roundworm'],
            ['True coelom', 'Annelid onward'],
        ],
    },
    gallery: {
        title: 'Phyla gallery',
        section: 'NCERT Animal Kingdom phyla',
        facts: [
            'Arthropoda is the largest animal phylum.',
            'Mollusca is the second largest animal phylum.',
            'Echinoderms are marine and have a water vascular system.',
        ],
        values: [
            ['Largest', 'Arthropoda'],
            ['Second largest', 'Mollusca'],
            ['Water vascular', 'Echinodermata'],
        ],
    },
    compare: {
        title: 'NEET comparator',
        section: 'NCERT quick distinctions',
        facts: [
            'Segmentation begins clearly in Annelida as metamerism.',
            'Arthropods have jointed appendages and chitinous exoskeleton.',
            'Hemichordata is non-chordate in this classification and has proboscis, collar and trunk.',
        ],
        values: [
            ['Metamerism', 'Annelida'],
            ['Jointed legs', 'Arthropoda'],
            ['Body regions', 'Proboscis, collar, trunk'],
        ],
    },
};

const AnimalKingdomLab: React.FC<AnimalKingdomLabProps> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('scanner');
    const [selectedPhylum, setSelectedPhylum] = useState<PhylumId>('porifera');
    const [pumpOn, setPumpOn] = useState(true);
    const [foodReleased, setFoodReleased] = useState(true);
    const [showCutaway, setShowCutaway] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [paused, setPaused] = useState(true);
    const [stageIndex, setStageIndex] = useState(0);
    const [quizChoice, setQuizChoice] = useState<'arthropoda' | 'mollusca' | 'annelida' | null>(null);

    useEffect(() => {
        if (paused || mode !== 'cnidaria') return;
        const timer = window.setInterval(() => setStageIndex((prev) => (prev + 1) % OBELIA_STAGES.length), 1600);
        return () => window.clearInterval(timer);
    }, [mode, paused]);

    const selected = PHYLA.find((item) => item.id === selectedPhylum) ?? PHYLA[0];
    const stage = OBELIA_STAGES[stageIndex];
    const activeFacts = modeFacts[mode];

    const resetLab = () => {
        setMode('scanner');
        setSelectedPhylum('porifera');
        setPumpOn(true);
        setFoodReleased(true);
        setShowCutaway(true);
        setShowLabels(true);
        setPaused(true);
        setStageIndex(0);
        setQuizChoice(null);
    };

    const chooseMode = (nextMode: Mode) => {
        setMode(nextMode);
        if (nextMode === 'porifera') setSelectedPhylum('porifera');
        if (nextMode === 'cnidaria') setSelectedPhylum('cnidaria');
    };

    const choosePhylum = (nextPhylum: PhylumId) => {
        setSelectedPhylum(nextPhylum);
        if ((mode === 'porifera' && nextPhylum !== 'porifera') || (mode === 'cnidaria' && nextPhylum !== 'cnidaria')) {
            setMode('scanner');
        }
    };

    const stepPhylum = (direction: -1 | 1) => {
        const index = PHYLA.findIndex((item) => item.id === selectedPhylum);
        const next = PHYLA[(index + direction + PHYLA.length) % PHYLA.length];
        choosePhylum(next.id);
    };

    const chooseObeliaStage = (nextStage: ObeliaStage) => {
        setMode('cnidaria');
        setSelectedPhylum('cnidaria');
        setPaused(true);
        setStageIndex(OBELIA_STAGES.indexOf(nextStage));
    };

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas width={1280} height={760} className="absolute inset-0 h-full w-full bg-white" />
                <div className="absolute inset-0">
                    <SimulationStage
                        mode={mode}
                        selected={selected}
                        pumpOn={pumpOn}
                        foodReleased={foodReleased}
                        showCutaway={showCutaway}
                        showLabels={showLabels}
                        stage={stage}
                        stageIndex={stageIndex}
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
                        onClick={resetLab}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Reset"
                    >
                        <RefreshCcw size={15} />
                    </button>
                </div>
            </div>
            <LeftAside selected={selected} mode={mode} />
            <RightAside facts={activeFacts} selected={selected} mode={mode} stage={stage} pumpOn={pumpOn} />
        </div>
    );

    const controlsCombo = (
        <div className="h-full w-full bg-white">
            <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[1.15fr_1fr_1.3fr_0.8fr]">
                <ControlGroup title="Non-Chordate Bench" icon={<Fish size={15} className="text-sky-700" />}>
                    <div className="grid grid-cols-3 gap-1.5">
                        {MODES.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => chooseMode(item.id)}
                                className={`flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold transition-colors ${
                                    mode === item.id ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </ControlGroup>

                <ControlGroup title="Phylum" icon={<Microscope size={15} className="text-violet-700" />}>
                    <select
                        value={selectedPhylum}
                        onChange={(event) => choosePhylum(event.target.value as PhylumId)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none focus:border-sky-500"
                    >
                        {PHYLA.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <StepButton onClick={() => stepPhylum(-1)} label="Prev" />
                        <StepButton onClick={() => stepPhylum(1)} label="Next" />
                    </div>
                </ControlGroup>

                <ControlGroup title="Canvas Controls" icon={<Activity size={15} className="text-emerald-700" />}>
                    {mode === 'cnidaria' ? (
                        <>
                            <div className="grid grid-cols-5 gap-1.5">
                                {OBELIA_STAGES.map((item) => (
                                    <button
                                        key={item}
                                        onClick={() => chooseObeliaStage(item)}
                                        className={`min-h-[34px] rounded-lg border px-1 text-[10px] font-black transition-colors ${
                                            stage === item ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                                        }`}
                                    >
                                        {stageShortLabel(item)}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => chooseObeliaStage(OBELIA_STAGES[(stageIndex + 1) % OBELIA_STAGES.length])}
                                className="mt-2 flex min-h-[34px] w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100"
                            >
                                <ArrowRight size={14} />
                                Next stage
                            </button>
                        </>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            <ToggleButton active={pumpOn} onClick={() => { setMode('porifera'); setSelectedPhylum('porifera'); setPumpOn((prev) => !prev); }} icon={<Gauge size={14} />} label="Pump" />
                            <ToggleButton active={foodReleased} onClick={() => { setMode('porifera'); setSelectedPhylum('porifera'); setFoodReleased((prev) => !prev); }} icon={<Sparkles size={14} />} label="Food" />
                            <ToggleButton active={showCutaway} onClick={() => { setMode('porifera'); setSelectedPhylum('porifera'); setShowCutaway((prev) => !prev); }} icon={<Shield size={14} />} label="Cut" />
                        </div>
                    )}
                </ControlGroup>

                <ControlGroup title="View" icon={<Eye size={15} className="text-slate-700" />}>
                    <ToggleButton active={showLabels} onClick={() => setShowLabels((prev) => !prev)} icon={showLabels ? <Eye size={14} /> : <EyeOff size={14} />} label="Labels" />
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
            controlsAreaFlex="0 0 178px"
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1180px)] overflow-y-auto overscroll-contain bg-white border border-slate-200 shadow-2xl rounded-2xl p-3"
            contentToggleClassName="bg-red-600 text-white border border-red-500 hover:bg-white hover:text-red-600"
        />
    );
};

const SimulationStage = ({
    mode,
    selected,
    pumpOn,
    foodReleased,
    showCutaway,
    showLabels,
    stage,
    stageIndex,
    quizChoice,
    onQuizChoice,
}: {
    mode: Mode;
    selected: PhylumInfo;
    pumpOn: boolean;
    foodReleased: boolean;
    showCutaway: boolean;
    showLabels: boolean;
    stage: ObeliaStage;
    stageIndex: number;
    quizChoice: 'arthropoda' | 'mollusca' | 'annelida' | null;
    onQuizChoice: (choice: 'arthropoda' | 'mollusca' | 'annelida') => void;
}) => (
    <div className="relative h-full w-full bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute left-1/2 top-1/2 h-[650px] w-[1120px] -translate-x-1/2 -translate-y-1/2">
            {mode === 'scanner' && <ScannerView selected={selected} showLabels={showLabels} />}
            {mode === 'porifera' && <PoriferaView pumpOn={pumpOn} foodReleased={foodReleased} showCutaway={showCutaway} showLabels={showLabels} />}
            {mode === 'cnidaria' && <CnidariaView stage={stage} stageIndex={stageIndex} showLabels={showLabels} />}
            {mode === 'coelom' && <CoelomView selected={selected} showLabels={showLabels} />}
            {mode === 'gallery' && <GalleryView selected={selected} />}
            {mode === 'compare' && <CompareView quizChoice={quizChoice} onQuizChoice={onQuizChoice} />}
        </div>
    </div>
);

const ScannerView = ({ selected, showLabels }: { selected: PhylumInfo; showLabels: boolean }) => (
    <div className="relative h-full w-full overflow-hidden rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(14,165,233,0.10),transparent_30%),radial-gradient(circle_at_78%_78%,rgba(16,185,129,0.10),transparent_28%)]" />
        <div className="relative grid h-full grid-cols-[1.05fr_1fr] gap-6">
            <SpecimenPlate phylum={selected} />

            <div className="flex min-w-0 flex-col rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs font-black uppercase tracking-wide text-slate-500">Body-plan scan</div>
                        <div className="mt-1 text-3xl font-black text-slate-950">{selected.name}</div>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: selected.color }}>
                        {selected.common}
                    </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <TraitCard label="Organisation" value={selected.level} color={selected.color} />
                    <TraitCard label="Symmetry" value={selected.symmetry} color={selected.color} />
                    <TraitCard label="Germ layers" value={selected.germLayers} color={selected.color} />
                    <TraitCard label="Coelom" value={selected.coelom} color={selected.color} />
                    <TraitCard label="Notochord" value="Absent" color="#64748b" />
                    <TraitCard label="Real cue" value={selected.specimen} color={selected.color} />
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500">NCERT marker</div>
                    <div className="mt-1 text-sm font-bold leading-relaxed text-slate-800">{selected.hallmark}</div>
                </div>
            </div>
        </div>

        {showLabels && (
            <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-xs font-black text-slate-700 shadow-sm">
                Select a phylum, then match the real body shape to organisation, symmetry and coelom.
            </div>
        )}
    </div>
);

const PoriferaView = ({ pumpOn, foodReleased, showCutaway, showLabels }: { pumpOn: boolean; foodReleased: boolean; showCutaway: boolean; showLabels: boolean }) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="#f8fafc" stroke="#e2e8f0" />
        <rect x="74" y="452" width="972" height="76" rx="26" fill="#d6d3d1" />
        <g transform="translate(370 92)">
            <path d="M178 38 C276 78 312 246 248 384 C188 486 66 462 42 338 C20 220 58 72 178 38Z" fill={pumpOn ? '#fbbf24' : '#cbd5e1'} stroke="#92400e" strokeWidth="8" />
            <ellipse cx="178" cy="44" rx="42" ry="20" fill="#ffffff" stroke="#92400e" strokeWidth="6" />
            {[70, 88, 62, 288, 306, 298, 80, 300].map((x, i) => (
                <circle key={i} cx={x} cy={148 + (i % 3) * 74} r="9" fill="#ffffff" stroke="#059669" strokeWidth="3" />
            ))}
            {showCutaway && (
                <>
                    <path d="M178 70 C220 156 226 310 174 420 C134 320 132 166 178 70Z" fill="#fef3c7" stroke="#d97706" strokeWidth="4" strokeDasharray="10 8" />
                    {[0, 1, 2, 3, 4].map((i) => (
                        <g key={i} transform={`translate(${158 + (i % 2) * 42} ${146 + i * 44})`}>
                            <circle cx="0" cy="0" r="8" fill="#0ea5e9" />
                            <line x1="0" y1="0" x2={i % 2 === 0 ? 28 : -28} y2="-10" stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" />
                        </g>
                    ))}
                </>
            )}
            {foodReleased && (
                <>
                    {[0, 1, 2, 3, 4].map((i) => {
                        const entered = pumpOn ? 70 + i * 34 : 0;
                        return <circle key={i} cx={-72 + entered} cy={136 + i * 42} r="8" fill="#22c55e" stroke="#15803d" strokeWidth="2" />;
                    })}
                </>
            )}
            {pumpOn && (
                <>
                    <path d="M-74 150 C6 150 42 148 70 148" stroke="#22c55e" strokeWidth="5" strokeDasharray="12 9" fill="none" />
                    <path d="M72 222 C118 222 148 218 172 204" stroke="#22c55e" strokeWidth="5" strokeDasharray="12 9" fill="none" />
                    <path d="M178 206 C178 150 178 94 178 62" stroke="#22c55e" strokeWidth="5" strokeDasharray="12 9" fill="none" />
                </>
            )}
        </g>
        {showLabels && (
            <>
                <Label x={548} y={94} text="Osculum: water exits" />
                <Label x={270} y={260} text="Ostia: water enters" />
                <Label x={662} y={318} text="Spongocoel lined by choanocytes" />
                <Label x={348} y={540} text="Canal system supports nutrition, respiration and excretion" />
            </>
        )}
    </svg>
);

const CnidariaView = ({ stage, stageIndex, showLabels }: { stage: ObeliaStage; stageIndex: number; showLabels: boolean }) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="#f8fafc" stroke="#e2e8f0" />
        <rect x="72" y="452" width="976" height="72" rx="28" fill="#cbd5e1" />
        <g transform="translate(92 88)">
            <ObeliaPolyp active={stageIndex <= 1 || stage === 'planula'} />
            {stageIndex >= 1 && <BuddingMedusae />}
            {stageIndex >= 2 && <Medusa x={610} y={150} active={stageIndex >= 2} />}
            {stageIndex >= 3 && <Gametes />}
            {stageIndex >= 4 && <Planula />}
        </g>
        <g transform="translate(150 568)">
            {OBELIA_STAGES.map((item, i) => (
                <g key={item} transform={`translate(${i * 178} 0)`} opacity={i === stageIndex ? 1 : 0.42}>
                    <circle cx="0" cy="0" r="13" fill={i === stageIndex ? '#0284c7' : '#94a3b8'} />
                    <text x="22" y="5" fontSize="13" fontWeight="900" fill="#334155">{stageLabel(item)}</text>
                </g>
            ))}
        </g>
        {showLabels && (
            <>
                <Label x={150} y={92} text="Polyp: sessile asexual form" width={220} />
                <Label x={704} y={92} text="Medusa: free-swimming sexual form" width={265} />
                <Label x={660} y={486} text="Metagenesis: polyp and medusa alternate" width={315} />
                <Label x={192} y={416} text="Cnidoblasts: anchorage, defence, prey capture" width={330} />
            </>
        )}
    </svg>
);

const CoelomView = ({ selected, showLabels }: { selected: PhylumInfo; showLabels: boolean }) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="#f8fafc" stroke="#e2e8f0" />
        <g transform="translate(100 106)">
            <CoelomDiagram x={0} title="Acoelomate" subtitle="Platyhelminthes" bodyColor="#f9a8d4" cavity="none" active={selected.coelom === 'Acoelomate'} />
            <CoelomDiagram x={330} title="Pseudocoelomate" subtitle="Aschelminthes" bodyColor="#fed7aa" cavity="pseudo" active={selected.coelom === 'Pseudocoelomate'} />
            <CoelomDiagram x={660} title="Coelomate" subtitle="Annelida onward" bodyColor="#bfdbfe" cavity="true" active={selected.coelom === 'Coelomate'} />
        </g>
        {showLabels && (
            <>
                <Label x={136} y={536} text="No body cavity between body wall and gut" />
                <Label x={450} y={536} text="Body cavity not fully lined by mesoderm" />
                <Label x={780} y={536} text="True coelom fully lined by mesoderm" />
            </>
        )}
    </svg>
);

const GalleryView = ({ selected }: { selected: PhylumInfo }) => (
    <div className="grid h-full grid-cols-5 gap-3">
        {PHYLA.map((item) => (
            <div key={item.id} className={`flex min-h-0 flex-col rounded-2xl border bg-white p-3 shadow-sm ${selected.id === item.id ? 'ring-2 ring-sky-300' : ''}`} style={{ borderColor: item.color }}>
                <div className="mb-2 flex h-32 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-[linear-gradient(180deg,#ffffff,#f8fafc)]">
                    <PhylumBodyIcon phylum={item} x={0} y={0} scale={0.52} asHtml sizeClass="h-28 w-28" />
                </div>
                <div className="text-sm font-black text-slate-900">{item.name}</div>
                <div className="text-[11px] font-bold uppercase text-slate-500">{item.common}</div>
                <div className="mt-1 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-black text-slate-700">{item.specimen}</div>
                <div className="mt-2 line-clamp-3 text-xs font-semibold leading-snug text-slate-600">{item.hallmark}</div>
            </div>
        ))}
    </div>
);

const CompareView = ({ quizChoice, onQuizChoice }: { quizChoice: 'arthropoda' | 'mollusca' | 'annelida' | null; onQuizChoice: (choice: 'arthropoda' | 'mollusca' | 'annelida') => void }) => (
    <div className="grid h-full grid-cols-[1.45fr_0.9fr] gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 grid grid-cols-[0.9fr_1fr_1fr_1fr] gap-2 text-xs font-black uppercase text-slate-500">
                <div>Phylum</div>
                <div>Symmetry</div>
                <div>Coelom</div>
                <div>Key marker</div>
            </div>
            <div className="space-y-2">
                {PHYLA.map((item) => (
                    <div key={item.id} className="grid grid-cols-[0.9fr_1fr_1fr_1fr] gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs">
                        <div className="font-black text-slate-900">{item.name}</div>
                        <div className="font-semibold text-slate-700">{item.symmetry}</div>
                        <div className="font-semibold text-slate-700">{item.coelom}</div>
                        <div className="font-semibold text-slate-700">{item.hallmark.split('.')[0]}</div>
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
                Which phylum is the largest animal phylum and is marked by jointed appendages?
            </p>
            <div className="mt-5 space-y-2">
                <QuizButton active={quizChoice === 'arthropoda'} correct label="Arthropoda" onClick={() => onQuizChoice('arthropoda')} />
                <QuizButton active={quizChoice === 'mollusca'} label="Mollusca" onClick={() => onQuizChoice('mollusca')} />
                <QuizButton active={quizChoice === 'annelida'} label="Annelida" onClick={() => onQuizChoice('annelida')} />
            </div>
            {quizChoice && (
                <div className={`mt-5 rounded-xl border p-3 text-sm font-bold ${quizChoice === 'arthropoda' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900'}`}>
                    {quizChoice === 'arthropoda' ? 'Correct. Arthropoda is the largest animal phylum and has jointed appendages.' : 'Not quite. Mollusca is second largest; Annelida is segmented but not joint-legged.'}
                </div>
            )}
        </div>
    </div>
);

const SpecimenPlate = ({ phylum }: { phylum: PhylumInfo }) => (
    <div className="relative min-w-0 overflow-hidden rounded-[28px] border bg-white shadow-sm" style={{ borderColor: phylum.color }}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_58%,#ecfeff_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-sky-100/70" />
        <div className="relative flex h-full flex-col p-5">
            <div>
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">Specimen plate</div>
                <div className="mt-1 text-3xl font-black text-slate-950">{phylum.name}</div>
                <div className="mt-1 text-sm font-black text-slate-500">{phylum.common} | {phylum.example}</div>
            </div>

            <div className="flex flex-1 items-center justify-center py-4">
                <div className="relative flex h-[330px] w-[330px] items-center justify-center rounded-[36px] border border-slate-200 bg-white/80 shadow-inner">
                    <div className="absolute inset-5 rounded-[30px] border border-dashed border-slate-200" />
                    <PhylumBodyIcon phylum={phylum} x={0} y={0} scale={1} asHtml sizeClass="h-[285px] w-[285px]" />
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3">
                <div className="text-xs font-black uppercase tracking-wide text-slate-500">Look for</div>
                <div className="mt-1 text-sm font-bold leading-relaxed text-slate-800">{phylum.specimen}</div>
            </div>
        </div>
    </div>
);

const TraitCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="min-h-[82px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 h-1.5 w-12 rounded-full" style={{ backgroundColor: color }} />
        <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 text-base font-black leading-tight text-slate-900">{value}</div>
    </div>
);

const PhylumBodyIcon = ({ phylum, x, y, scale, asHtml = false, sizeClass = 'h-20 w-20' }: { phylum: PhylumInfo; x: number; y: number; scale: number; asHtml?: boolean; sizeClass?: string }) => {
    const icon = (
        <svg viewBox="-110 -110 220 220" className={asHtml ? sizeClass : undefined}>
            <g transform={`scale(${asHtml ? 1 : scale})`}>
                {phylum.id === 'porifera' && <SpongeIcon color={phylum.color} />}
                {phylum.id === 'cnidaria' && <JellyIcon color={phylum.color} />}
                {phylum.id === 'ctenophora' && <CombJellyIcon color={phylum.color} />}
                {phylum.id === 'platyhelminthes' && <path d="M-82 -10 C-38 -52 40 -52 82 -10 C42 42 -38 42 -82 -10Z" fill="#f9a8d4" stroke={phylum.color} strokeWidth="8" />}
                {phylum.id === 'aschelminthes' && <path d="M-82 28 C-34 -18 28 -48 82 -26" fill="none" stroke={phylum.color} strokeWidth="22" strokeLinecap="round" />}
                {phylum.id === 'annelida' && <SegmentedWormIcon color={phylum.color} />}
                {phylum.id === 'arthropoda' && <BugIcon color={phylum.color} />}
                {phylum.id === 'mollusca' && <ShellIcon color={phylum.color} />}
                {phylum.id === 'echinodermata' && <StarIcon color={phylum.color} />}
                {phylum.id === 'hemichordata' && <AcornWormIcon color={phylum.color} />}
            </g>
        </svg>
    );
    if (asHtml) return icon;
    return <foreignObject x={x - 170} y={y - 170} width="340" height="340"><div className="flex h-full w-full items-center justify-center">{icon}</div></foreignObject>;
};

const SpongeIcon = ({ color }: { color: string }) => (
    <g>
        <defs>
            <radialGradient id="spongeTone" cx="42%" cy="32%" r="70%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="58%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
        </defs>
        <path d="M-48 76 C-76 20 -64 -58 -14 -78 C32 -98 76 -54 72 10 C68 58 26 88 -48 76Z" fill="url(#spongeTone)" stroke="#92400e" strokeWidth="8" />
        <ellipse cx="8" cy="-78" rx="34" ry="17" fill="#fff7ed" stroke="#92400e" strokeWidth="7" />
        {[
            [-38, -30], [-16, -42], [18, -34], [42, -12],
            [-46, 6], [-20, 10], [12, 2], [38, 26],
            [-34, 42], [0, 48], [28, 54],
        ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.5" fill="#ffffff" stroke={color} strokeWidth="3" />
        ))}
        <path d="M-74 18 C-46 8 -28 8 -8 0" fill="none" stroke="#14b8a6" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 8" />
        <path d="M4 -58 C6 -40 6 -18 2 8" fill="none" stroke="#14b8a6" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 8" />
    </g>
);

const JellyIcon = ({ color }: { color: string }) => (
    <g>
        <path d="M-58 -8 C-38 -70 42 -70 62 -8 C42 16 -38 16 -58 -8Z" fill="#bae6fd" stroke={color} strokeWidth="8" />
        {[-42, -18, 8, 34].map((x) => <path key={x} d={`M${x} 12 C${x - 8} 42 ${x + 8} 60 ${x} 88`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />)}
    </g>
);

const CombJellyIcon = ({ color }: { color: string }) => (
    <g>
        <ellipse cx="0" cy="0" rx="54" ry="78" fill="#ede9fe" stroke={color} strokeWidth="8" />
        {[-35, -15, 5, 25].map((x) => <path key={x} d={`M${x} -60 C${x + 16} -20 ${x - 16} 20 ${x} 60`} stroke="#f0abfc" strokeWidth="5" fill="none" />)}
    </g>
);

const SegmentedWormIcon = ({ color }: { color: string }) => (
    <g>
        {[0, 1, 2, 3, 4, 5].map((i) => <ellipse key={i} cx={-58 + i * 24} cy={Math.sin(i) * 10} rx="20" ry="28" fill="#dcfce7" stroke={color} strokeWidth="5" />)}
    </g>
);

const BugIcon = ({ color }: { color: string }) => (
    <g>
        <ellipse cx="0" cy="0" rx="42" ry="58" fill="#fed7aa" stroke={color} strokeWidth="8" />
        <circle cx="0" cy="-58" r="24" fill="#fdba74" stroke={color} strokeWidth="6" />
        {[-54, 54].map((side) => [ -30, 0, 30 ].map((yy) => <path key={`${side}-${yy}`} d={`M${side > 0 ? 28 : -28} ${yy} L${side} ${yy - 18}`} stroke={color} strokeWidth="6" strokeLinecap="round" />))}
    </g>
);

const ShellIcon = ({ color }: { color: string }) => (
    <g>
        <path d="M-62 48 C-44 -50 48 -72 74 20 C44 72 -24 82 -62 48Z" fill="#cffafe" stroke={color} strokeWidth="8" />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M-36 ${38 - i * 14} C0 ${6 - i * 8} 34 ${0 - i * 8} 60 ${22 - i * 5}`} stroke={color} strokeWidth="4" fill="none" opacity="0.65" />)}
    </g>
);

const StarIcon = ({ color }: { color: string }) => (
    <path d="M0 -82 L24 -26 L84 -24 L36 14 L52 76 L0 42 L-52 76 L-36 14 L-84 -24 L-24 -26Z" fill="#fef3c7" stroke={color} strokeWidth="8" />
);

const AcornWormIcon = ({ color }: { color: string }) => (
    <g>
        <ellipse cx="-58" cy="0" rx="26" ry="34" fill="#e2e8f0" stroke={color} strokeWidth="6" />
        <rect x="-30" y="-24" width="42" height="48" rx="20" fill="#cbd5e1" stroke={color} strokeWidth="6" />
        <path d="M10 0 C36 -48 82 -40 84 0 C86 48 36 48 10 0Z" fill="#f8fafc" stroke={color} strokeWidth="6" />
    </g>
);

const ObeliaPolyp = ({ active }: { active: boolean }) => (
    <g opacity={active ? 1 : 0.5}>
        {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${70 + i * 62} ${260 - i * 20})`}>
                <path d="M0 170 C0 92 -18 60 -38 18" stroke="#0f766e" strokeWidth="8" fill="none" />
                <circle cx="-38" cy="18" r="20" fill="#86efac" stroke="#166534" strokeWidth="4" />
            </g>
        ))}
        <text x="106" y="38" textAnchor="middle" fontSize="16" fontWeight="900" fill="#166534">Polyp colony</text>
    </g>
);

const BuddingMedusae = () => (
    <g>
        <path d="M292 152 C330 116 366 110 410 128" stroke="#6366f1" strokeWidth="4" strokeDasharray="8 7" fill="none" />
        <Medusa x={412} y={138} active />
        <text x="372" y="94" fontSize="15" fontWeight="900" fill="#4338ca">Asexual budding</text>
    </g>
);

const Medusa = ({ x, y, active }: { x: number; y: number; active: boolean }) => (
    <g transform={`translate(${x} ${y})`} opacity={active ? 1 : 0.5}>
        <path d="M-62 0 C-42 -72 42 -72 62 0 C34 28 -34 28 -62 0Z" fill="#7dd3fc" stroke="#0369a1" strokeWidth="6" />
        {[-36, -12, 14, 38].map((dx) => <line key={dx} x1={dx} y1="8" x2={dx - 10} y2="68" stroke="#0369a1" strokeWidth="4" strokeLinecap="round" />)}
    </g>
);

const Gametes = () => (
    <g>
        <circle cx="790" cy="324" r="10" fill="#f472b6" />
        <circle cx="830" cy="334" r="8" fill="#60a5fa" />
        <path d="M790 324 C806 330 814 332 824 334" stroke="#a855f7" strokeWidth="3" fill="none" />
        <circle cx="870" cy="354" r="13" fill="#c084fc" stroke="#7c3aed" strokeWidth="4" />
        <text x="780" y="292" fontSize="15" fontWeight="900" fill="#7c3aed">Gametes and zygote</text>
    </g>
);

const Planula = () => (
    <g>
        <ellipse cx="806" cy="380" rx="44" ry="22" fill="#fde68a" stroke="#d97706" strokeWidth="5" />
        {[-30, -15, 0, 15, 30].map((dx) => <line key={dx} x1={806 + dx} y1="358" x2={806 + dx} y2="340" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />)}
        <path d="M848 380 C894 378 930 402 936 430" stroke="#16a34a" strokeWidth="4" strokeDasharray="8 7" fill="none" />
        <circle cx="936" cy="440" r="17" fill="#86efac" stroke="#166534" strokeWidth="5" />
        <text x="806" y="332" textAnchor="middle" fontSize="15" fontWeight="900" fill="#92400e">Planula larva</text>
    </g>
);

const CoelomDiagram = ({ x, title, subtitle, bodyColor, cavity, active }: { x: number; title: string; subtitle: string; bodyColor: string; cavity: 'none' | 'pseudo' | 'true'; active: boolean }) => (
    <g transform={`translate(${x} 0)`} opacity={active ? 1 : 0.55}>
        <rect x="0" y="0" width="280" height="360" rx="28" fill="#ffffff" stroke={active ? '#0284c7' : '#cbd5e1'} strokeWidth={active ? 5 : 3} />
        <circle cx="140" cy="154" r="96" fill={bodyColor} stroke="#334155" strokeWidth="5" />
        {cavity !== 'none' && <circle cx="140" cy="154" r={cavity === 'pseudo' ? 58 : 72} fill="#ffffff" stroke={cavity === 'pseudo' ? '#f59e0b' : '#16a34a'} strokeWidth="7" strokeDasharray={cavity === 'pseudo' ? '10 8' : '0'} />}
        <circle cx="140" cy="154" r="25" fill="#f8fafc" stroke="#334155" strokeWidth="5" />
        <text x="140" y="292" textAnchor="middle" fontSize="20" fontWeight="900" fill="#0f172a">{title}</text>
        <text x="140" y="322" textAnchor="middle" fontSize="14" fontWeight="800" fill="#64748b">{subtitle}</text>
    </g>
);

const LeftAside = ({ selected, mode }: { selected: PhylumInfo; mode: Mode }) => (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
        <div className="flex flex-col gap-2.5">
            <AsideCard title="Body Plan Map" subtitle="NCERT classification axes">
                <MiniMap selected={selected} />
            </AsideCard>
            <AsideCard title="Figure Targets" subtitle="What to inspect">
                <ReferenceRow icon={<Droplets size={15} />} label="Porifera" value="Ostia, spongocoel, osculum and choanocytes" />
                <ReferenceRow icon={<Waves size={15} />} label="Cnidaria" value="Polyp, medusa, cnidoblasts and metagenesis" />
                <ReferenceRow icon={<CircleDot size={15} />} label="Coelom" value="Acoelomate, pseudocoelomate and coelomate" />
                <ReferenceRow icon={<Bug size={15} />} label="Diversity" value="Arthropoda largest; Mollusca second largest" />
            </AsideCard>
            <AsideCard title="Current Lens" subtitle="Stage mode">
                <ValueMini label="Mode" value={mode.toUpperCase()} tone="slate" />
                <ValueMini label="Selected" value={selected.name} tone="cyan" />
                <ValueMini label="Coelom" value={selected.coelom} tone="violet" />
            </AsideCard>
        </div>
    </aside>
);

const RightAside = ({ facts, selected, mode, stage, pumpOn }: { facts: { title: string; section: string; facts: string[]; values: [string, string][] }; selected: PhylumInfo; mode: Mode; stage: ObeliaStage; pumpOn: boolean }) => (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
        <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-sky-200 bg-sky-50/95 p-4 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 text-base font-extrabold text-sky-950">
                    <Fish size={17} />
                    {facts.title}
                </div>
                <div className="mt-1 text-xs font-semibold text-sky-700">{facts.section}</div>
                <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-sky-950">
                    {facts.facts.map((fact) => (
                        <div key={fact} className="flex gap-2">
                            <ArrowRight size={14} className="mt-0.5 shrink-0 text-sky-700" />
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
                <ValueRow label="Phylum" value={selected.name} tone="cyan" />
                <ValueRow label="Body level" value={selected.level} tone="emerald" />
                <ValueRow label="Obelia stage" value={stageLabel(stage)} tone="violet" />
                <ValueRow label="Sponge pump" value={pumpOn ? 'Choanocyte current on' : 'Current off'} tone={pumpOn ? 'emerald' : 'rose'} />
                {facts.values.map(([label, value]) => (
                    <React.Fragment key={label}>
                        <ValueRow label={label} value={value} tone="amber" />
                    </React.Fragment>
                ))}
            </div>
        </div>
    </aside>
);

const MiniMap = ({ selected }: { selected: PhylumInfo }) => (
    <svg viewBox="0 0 300 172" className="h-[160px] w-full">
        <rect x="10" y="12" width="280" height="148" rx="22" fill="#f8fafc" stroke="#cbd5e1" />
        {PHYLA.slice(0, 10).map((item, i) => {
            const x = 30 + (i % 5) * 60;
            const y = 48 + Math.floor(i / 5) * 62;
            return (
                <g key={item.id}>
                    <circle cx={x} cy={y} r={selected.id === item.id ? 18 : 13} fill={item.color} opacity={selected.id === item.id ? 1 : 0.42} />
                    <text x={x} y={y + 33} textAnchor="middle" fontSize="8" fontWeight="900" fill="#475569">{item.name.slice(0, 4)}</text>
                </g>
            );
        })}
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

const ValueMini = ({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'slate' | 'violet' }) => {
    const colors = {
        cyan: 'bg-cyan-50 text-cyan-800',
        slate: 'bg-slate-50 text-slate-800',
        violet: 'bg-violet-50 text-violet-800',
    };
    return (
        <div className={`mb-2 flex justify-between rounded-lg px-3 py-2 text-sm font-bold ${colors[tone]}`}>
            <span>{label}</span>
            <span>{value}</span>
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

const StepButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button
        onClick={onClick}
        className="flex min-h-[34px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold text-slate-700 transition-colors hover:border-sky-300"
    >
        {label}
    </button>
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

const Label = ({ x, y, text, width }: { x: number; y: number; text: string; width?: number }) => {
    const rectWidth = width ?? Math.min(360, Math.max(116, text.length * 7.1));
    const labelX = Math.max(32, Math.min(x - 8, 1088 - rectWidth));
    const labelText = text.length > 48 ? `${text.slice(0, 45)}...` : text;

    return (
        <g>
            <rect x={labelX} y={y - 17} width={rectWidth} height="27" rx="9" fill="#ffffff" stroke="#cbd5e1" />
            <text x={labelX + 10} y={y} fontSize="12" fontWeight="800" fill="#334155">{labelText}</text>
        </g>
    );
};

function stageLabel(stage: ObeliaStage) {
    const labels: Record<ObeliaStage, string> = {
        polyp: 'Polyp',
        budding: 'Asexual budding',
        medusa: 'Medusa',
        gametes: 'Gametes',
        planula: 'Planula larva',
    };
    return labels[stage];
}

function stageShortLabel(stage: ObeliaStage) {
    const labels: Record<ObeliaStage, string> = {
        polyp: 'Polyp',
        budding: 'Budding',
        medusa: 'Medusa',
        gametes: 'Gametes',
        planula: 'Planula',
    };
    return labels[stage];
}

export default AnimalKingdomLab;
