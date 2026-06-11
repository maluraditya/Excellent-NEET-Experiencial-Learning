import React, { useMemo, useState } from 'react';
import {
    ArrowRight,
    Eye,
    EyeOff,
    Leaf,
    Network,
    Pause,
    Play,
    RefreshCcw,
    Shield,
    Sprout,
    Trees,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Mode = 'roots' | 'stems' | 'leaves' | 'phyllotaxy';
type RootMod = 'tap' | 'fibrous' | 'adventitious' | 'storage' | 'support' | 'respiration';
type StemMod = 'ordinary' | 'storage' | 'support' | 'protection' | 'propagation';
type LeafMod = 'ordinary' | 'parts' | 'venation' | 'tendril' | 'spine';
type PhyllotaxyType = 'alternate' | 'opposite' | 'whorled';

interface MorphologyFloweringPlantsLabProps {
    topic: any;
    onExit: () => void;
}

const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: 'roots', label: 'Roots', icon: <Sprout size={13} /> },
    { id: 'stems', label: 'Stems', icon: <Trees size={13} /> },
    { id: 'leaves', label: 'Leaves', icon: <Leaf size={13} /> },
    { id: 'phyllotaxy', label: 'Phyllotaxy', icon: <Network size={13} /> },
];

const ROOTS: { id: RootMod; label: string; role: string; ncert: string }[] = [
    { id: 'tap', label: 'Tap root', role: 'Dicot root system', ncert: 'Mustard: primary root persists with lateral roots.' },
    { id: 'fibrous', label: 'Fibrous', role: 'Monocot root system', ncert: 'Wheat: primary root is short lived; many roots arise from stem base.' },
    { id: 'adventitious', label: 'Adventitious', role: 'Other origin', ncert: 'Roots may arise from parts other than radicle, as in grass, Monstera and banyan.' },
    { id: 'storage', label: 'Storage', role: 'Modified root', ncert: 'Roots in some plants are modified for storage of food.' },
    { id: 'support', label: 'Support', role: 'Modified root', ncert: 'Roots in some plants are modified for mechanical support.' },
    { id: 'respiration', label: 'Respiration', role: 'Modified root', ncert: 'Roots in some plants are modified for respiration.' },
];

const STEMS: { id: StemMod; label: string; role: string; ncert: string }[] = [
    { id: 'ordinary', label: 'Ordinary', role: 'Shoot axis', ncert: 'Stem bears nodes, internodes, terminal buds and axillary buds.' },
    { id: 'storage', label: 'Storage', role: 'Stem function', ncert: 'Some stems perform storage of food.' },
    { id: 'support', label: 'Support', role: 'Stem function', ncert: 'Some stems perform support.' },
    { id: 'protection', label: 'Protection', role: 'Stem function', ncert: 'Some stems perform protection.' },
    { id: 'propagation', label: 'Propagation', role: 'Stem function', ncert: 'Some stems perform vegetative propagation.' },
];

const LEAVES: { id: LeafMod; label: string; role: string; ncert: string }[] = [
    { id: 'ordinary', label: 'Ordinary', role: 'Photosynthesis', ncert: 'Leaf is a lateral flattened structure borne on stem and is a major photosynthetic organ.' },
    { id: 'parts', label: 'Parts', role: 'Leaf plan', ncert: 'A typical leaf has leaf base, petiole and lamina.' },
    { id: 'venation', label: 'Venation', role: 'Vein pattern', ncert: 'Reticulate venation is common in dicots; parallel venation in most monocots.' },
    { id: 'tendril', label: 'Tendril', role: 'Climbing', ncert: 'Variations may support adaptation for climbing.' },
    { id: 'spine', label: 'Spine', role: 'Protection', ncert: 'Variations may support adaptation for protection.' },
];

const PHYLLS: { id: PhyllotaxyType; label: string; example: string; ncert: string }[] = [
    { id: 'alternate', label: 'Alternate', example: 'China rose, mustard, sunflower', ncert: 'Single leaf arises at each node in alternate manner.' },
    { id: 'opposite', label: 'Opposite', example: 'Calotropis, guava', ncert: 'A pair of leaves arises at each node opposite each other.' },
    { id: 'whorled', label: 'Whorled', example: 'Alstonia', ncert: 'More than two leaves arise at a node and form a whorl.' },
];

const MorphologyFloweringPlantsLab: React.FC<MorphologyFloweringPlantsLabProps> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('roots');
    const [rootMod, setRootMod] = useState<RootMod>('tap');
    const [stemMod, setStemMod] = useState<StemMod>('ordinary');
    const [leafMod, setLeafMod] = useState<LeafMod>('parts');
    const [phyllotaxy, setPhyllotaxy] = useState<PhyllotaxyType>('alternate');
    const [showLabels, setShowLabels] = useState(true);
    const [showSection, setShowSection] = useState(true);
    const [paused, setPaused] = useState(false);

    const activeLens = useMemo(() => {
        if (mode === 'roots') return ROOTS.find((item) => item.id === rootMod) ?? ROOTS[0];
        if (mode === 'stems') return STEMS.find((item) => item.id === stemMod) ?? STEMS[0];
        if (mode === 'leaves') return LEAVES.find((item) => item.id === leafMod) ?? LEAVES[0];
        return PHYLLS.find((item) => item.id === phyllotaxy) ?? PHYLLS[0];
    }, [leafMod, mode, phyllotaxy, rootMod, stemMod]);

    const facts = getModeFacts(mode, activeLens);

    const resetLab = () => {
        setMode('roots');
        setRootMod('tap');
        setStemMod('ordinary');
        setLeafMod('parts');
        setPhyllotaxy('alternate');
        setShowLabels(true);
        setShowSection(true);
        setPaused(false);
    };

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas width={1280} height={760} className="absolute inset-0 h-full w-full bg-white" />
                <div className="absolute inset-0">
                    <SimulationStage
                        mode={mode}
                        rootMod={rootMod}
                        stemMod={stemMod}
                        leafMod={leafMod}
                        phyllotaxy={phyllotaxy}
                        showLabels={showLabels}
                        showSection={showSection}
                        paused={paused}
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
            <LeftAside mode={mode} rootMod={rootMod} stemMod={stemMod} leafMod={leafMod} phyllotaxy={phyllotaxy} />
            <RightAside facts={facts} activeLens={activeLens} mode={mode} />
        </div>
    );

    const controlsCombo = (
        <div className="h-full w-full bg-white">
            <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[1.1fr_1.15fr_1.15fr_0.8fr]">
                <ControlGroup title="Morphology Bench" icon={<Leaf size={15} className="text-emerald-700" />}>
                    <div className="grid grid-cols-2 gap-1.5">
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
                </ControlGroup>

                <ControlGroup title="Organ Selector" icon={<Sprout size={15} className="text-sky-700" />}>
                    {mode === 'roots' && <Select value={rootMod} onChange={(value) => setRootMod(value as RootMod)} items={ROOTS} />}
                    {mode === 'stems' && <Select value={stemMod} onChange={(value) => setStemMod(value as StemMod)} items={STEMS} />}
                    {mode === 'leaves' && <Select value={leafMod} onChange={(value) => setLeafMod(value as LeafMod)} items={LEAVES} />}
                    {mode === 'phyllotaxy' && <Select value={phyllotaxy} onChange={(value) => setPhyllotaxy(value as PhyllotaxyType)} items={PHYLLS} />}
                </ControlGroup>

                <ControlGroup title="Quick Switch" icon={<Trees size={15} className="text-violet-700" />}>
                    {mode === 'roots' && (
                        <div className="grid grid-cols-3 gap-1.5">
                            {ROOTS.slice(0, 6).map((item) => (
                                <React.Fragment key={item.id}>
                                    <Choice active={rootMod === item.id} onClick={() => setRootMod(item.id)} label={item.label} />
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    {mode === 'stems' && (
                        <div className="grid grid-cols-5 gap-1.5">
                            {STEMS.map((item) => (
                                <React.Fragment key={item.id}>
                                    <Choice active={stemMod === item.id} onClick={() => setStemMod(item.id)} label={item.label} compact />
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    {mode === 'leaves' && (
                        <div className="grid grid-cols-5 gap-1.5">
                            {LEAVES.map((item) => (
                                <React.Fragment key={item.id}>
                                    <Choice active={leafMod === item.id} onClick={() => setLeafMod(item.id)} label={item.label} compact />
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    {mode === 'phyllotaxy' && (
                        <div className="grid grid-cols-3 gap-1.5">
                            {PHYLLS.map((item) => (
                                <React.Fragment key={item.id}>
                                    <Choice active={phyllotaxy === item.id} onClick={() => setPhyllotaxy(item.id)} label={item.label} />
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </ControlGroup>

                <ControlGroup title="View" icon={<Eye size={15} className="text-slate-700" />}>
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleButton active={showLabels} onClick={() => setShowLabels((prev) => !prev)} icon={showLabels ? <Eye size={14} /> : <EyeOff size={14} />} label="Labels" />
                        <ToggleButton active={showSection} onClick={() => setShowSection((prev) => !prev)} icon={<Network size={14} />} label="Detail" />
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
    rootMod,
    stemMod,
    leafMod,
    phyllotaxy,
    showLabels,
    showSection,
    paused,
}: {
    mode: Mode;
    rootMod: RootMod;
    stemMod: StemMod;
    leafMod: LeafMod;
    phyllotaxy: PhyllotaxyType;
    showLabels: boolean;
    showSection: boolean;
    paused: boolean;
}) => (
    <div className="relative h-full w-full bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute left-1/2 top-1/2 h-[650px] w-[1120px] -translate-x-1/2 -translate-y-1/2">
            {mode === 'roots' && <RootView active={rootMod} showLabels={showLabels} showSection={showSection} paused={paused} />}
            {mode === 'stems' && <StemView active={stemMod} showLabels={showLabels} showSection={showSection} paused={paused} />}
            {mode === 'leaves' && <LeafView active={leafMod} showLabels={showLabels} showSection={showSection} paused={paused} />}
            {mode === 'phyllotaxy' && <PhyllotaxyView active={phyllotaxy} showLabels={showLabels} paused={paused} />}
        </div>
    </div>
);

const SceneDefs = () => (
    <defs>
        <linearGradient id="stageWash" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="48%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ecfdf5" />
        </linearGradient>
        <linearGradient id="leafGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="58%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="soilGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d8b58b" />
            <stop offset="55%" stopColor="#b98552" />
            <stop offset="100%" stopColor="#8b5a2b" />
        </linearGradient>
        <radialGradient id="storageGradient" cx="45%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="58%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#64748b" floodOpacity="0.18" />
        </filter>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>
);

const AmbientMotion = ({ paused }: { paused: boolean }) => (
    <g opacity="0.7">
        <circle cx="960" cy="114" r="42" fill="#fde68a" opacity="0.55" filter="url(#glow)">
            {!paused && <animate attributeName="r" values="38;47;38" dur="4.5s" repeatCount="indefinite" />}
        </circle>
        {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={172 + i * 172} cy={124 + (i % 2) * 64} r={4 + (i % 3)} fill={i % 2 ? '#38bdf8' : '#86efac'} opacity="0.42">
                {!paused && (
                    <>
                        <animate attributeName="cy" values={`${124 + (i % 2) * 64};${108 + (i % 2) * 64};${124 + (i % 2) * 64}`} dur={`${3.2 + i * 0.35}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.2;0.58;0.2" dur={`${3.2 + i * 0.35}s`} repeatCount="indefinite" />
                    </>
                )}
            </circle>
        ))}
    </g>
);

const WindStrokes = ({ paused }: { paused: boolean }) => (
    <g opacity="0.42" fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round">
        {[0, 1, 2].map((i) => (
            <path key={i} d={`M${720 + i * 36} ${178 + i * 72} C${768 + i * 34} ${154 + i * 72} ${826 + i * 26} ${184 + i * 72} ${882 + i * 42} ${162 + i * 72}`} strokeDasharray="18 18">
                {!paused && <animate attributeName="stroke-dashoffset" values="80;0" dur={`${2.6 + i * 0.4}s`} repeatCount="indefinite" />}
            </path>
        ))}
    </g>
);

const SoilGrains = () => (
    <g opacity="0.26">
        {[
            [130, 342], [204, 390], [278, 452], [356, 526], [454, 348], [626, 398],
            [726, 462], [810, 532], [910, 360], [1002, 468], [178, 528], [884, 420],
        ].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#78350f" />)}
    </g>
);

const Sway = ({ children, paused, pivot, delay = 0 }: { children: React.ReactNode; paused: boolean; pivot: string; delay?: number }) => (
    <g>
        {!paused && (
            <animateTransform
                attributeName="transform"
                type="rotate"
                values={`-1.8 ${pivot};1.8 ${pivot};-1.8 ${pivot}`}
                dur={`${3.2 + delay}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
            />
        )}
        {children}
    </g>
);

const RootView = ({ active, showLabels, showSection, paused }: { active: RootMod; showLabels: boolean; showSection: boolean; paused: boolean }) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <SceneDefs />
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="url(#stageWash)" stroke="#e2e8f0" />
        <AmbientMotion paused={paused} />
        <rect x="70" y="310" width="980" height="250" rx="24" fill="url(#soilGradient)" opacity="0.96" />
        <SoilGrains />
        <line x1="70" y1="310" x2="1050" y2="310" stroke="#65a30d" strokeWidth="5" />
        <g filter="url(#softShadow)">
            <line x1="560" y1="310" x2="560" y2="166" stroke="#15803d" strokeWidth="12" strokeLinecap="round" />
            <Sway paused={paused} pivot="560 166">
                <ellipse cx="522" cy="162" rx="62" ry="22" fill="url(#leafGradient)" transform="rotate(-18 522 162)" />
                <ellipse cx="598" cy="160" rx="62" ry="22" fill="#22c55e" transform="rotate(18 598 160)" />
            </Sway>
            {active === 'tap' && <TapRoot paused={paused} />}
            {active === 'fibrous' && <FibrousRoot paused={paused} />}
            {active === 'adventitious' && <AdventitiousRoot paused={paused} />}
            {active === 'storage' && <StorageRoot paused={paused} />}
            {active === 'support' && <SupportRoots paused={paused} />}
        </g>
        {active === 'respiration' && <RespirationRoots paused={paused} />}
        {showSection && <RootTipInset />}
        {showLabels && (
            <>
                <Label x={94} y={86} text="Root system: underground axis" width={238} />
                <Label x={610} y={190} text={rootCaption(active)} width={310} />
                <Label x={820} y={548} text="Root hairs absorb water and minerals" width={280} />
            </>
        )}
    </svg>
);

const TapRoot = ({ paused }: { paused: boolean }) => (
    <g>
        <path d="M560 310 C560 382 560 462 560 552" stroke="#7c3f16" strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray="360" strokeDashoffset="0">
            {!paused && <animate attributeName="stroke-dashoffset" values="360;0;0" dur="3.2s" repeatCount="indefinite" />}
        </path>
        <path d="M560 370 C522 392 498 418 478 462" stroke="#7c3f16" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M560 405 C606 424 636 456 658 506" stroke="#7c3f16" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M560 458 C518 480 492 506 470 540" stroke="#7c3f16" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
);

const FibrousRoot = ({ paused }: { paused: boolean }) => (
    <g>
        <path d="M560 310 C560 336 560 352 560 370" stroke="#7c3f16" strokeWidth="8" strokeDasharray="10 8" fill="none" />
        {[-82, -56, -30, -8, 18, 44, 72].map((dx, index) => (
            <path key={dx} d={`M560 312 C${552 + dx} 376 ${548 + dx * 1.35} ${436 + index * 7} ${540 + dx * 1.6} 544`} stroke="#7c3f16" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.95">
                {!paused && <animate attributeName="stroke-width" values="6;8;6" dur={`${2.1 + index * 0.16}s`} repeatCount="indefinite" />}
            </path>
        ))}
    </g>
);

const AdventitiousRoot = ({ paused }: { paused: boolean }) => (
    <g>
        <path d="M508 274 C456 332 418 402 392 522" stroke="#7c3f16" strokeWidth="8" fill="none" strokeLinecap="round">
            {!paused && <animate attributeName="stroke-width" values="7;10;7" dur="2.8s" repeatCount="indefinite" />}
        </path>
        <path d="M612 274 C674 336 706 410 728 536" stroke="#7c3f16" strokeWidth="8" fill="none" strokeLinecap="round">
            {!paused && <animate attributeName="stroke-width" values="8;6;9;8" dur="3.1s" repeatCount="indefinite" />}
        </path>
        <path d="M560 310 C560 382 560 462 560 552" stroke="#7c3f16" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.45" />
        <circle cx="508" cy="274" r="8" fill="#92400e" />
        <circle cx="612" cy="274" r="8" fill="#92400e" />
    </g>
);

const StorageRoot = ({ paused }: { paused: boolean }) => (
    <g>
        <path d="M560 308 C512 380 514 494 560 560 C606 494 608 380 560 308Z" fill="url(#storageGradient)" stroke="#9a3412" strokeWidth="7">
            {!paused && <animate attributeName="opacity" values="0.86;1;0.86" dur="2.6s" repeatCount="indefinite" />}
        </path>
        <path d="M560 384 C530 402 528 454 560 486 C592 454 590 402 560 384Z" fill="#fed7aa" opacity="0.75" />
    </g>
);

const SupportRoots = ({ paused }: { paused: boolean }) => (
    <g>
        <line x1="422" y1="206" x2="698" y2="206" stroke="#15803d" strokeWidth="9" strokeLinecap="round" />
        {[
            'M454 206 C438 286 426 380 412 526',
            'M560 206 C548 292 536 394 524 536',
            'M666 206 C682 292 698 390 714 536',
        ].map((d, i) => (
            <path key={d} d={d} stroke="#7c3f16" strokeWidth="9" fill="none" strokeLinecap="round">
                {!paused && <animate attributeName="stroke-width" values="8;11;8" dur={`${2.4 + i * 0.2}s`} repeatCount="indefinite" />}
            </path>
        ))}
    </g>
);

const RespirationRoots = ({ paused }: { paused: boolean }) => (
    <g>
        <rect x="70" y="310" width="980" height="106" rx="24" fill="#bae6fd" opacity="0.65" />
        {[-170, -110, -48, 32, 96, 166].map((dx, index) => (
            <g key={dx}>
                <path d={`M${560 + dx} 442 C${556 + dx} 402 ${558 + dx} 354 ${560 + dx} 318`} stroke="#7c3f16" strokeWidth="8" fill="none" strokeLinecap="round" />
                <circle cx={560 + dx} cy={298 - (index % 3) * 8} r="5" fill="#38bdf8" opacity={paused ? 0.35 : 0.8}>
                    {!paused && (
                        <>
                            <animate attributeName="cy" values={`${314 - (index % 3) * 8};${278 - (index % 3) * 9};${314 - (index % 3) * 8}`} dur={`${1.8 + index * 0.16}s`} repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.25;0.9;0.25" dur={`${1.8 + index * 0.16}s`} repeatCount="indefinite" />
                        </>
                    )}
                </circle>
            </g>
        ))}
        <text x="784" y="364" fontSize="15" fontWeight="900" fill="#075985">O2 entry</text>
    </g>
);

const RootTipInset = () => (
    <g transform="translate(116 364)">
        <rect x="0" y="0" width="196" height="158" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M98 22 C76 52 74 116 98 140 C122 116 120 52 98 22Z" fill="#fef3c7" stroke="#92400e" strokeWidth="4" />
        <line x1="98" y1="42" x2="98" y2="124" stroke="#92400e" strokeWidth="3" />
        <text x="98" y="28" textAnchor="middle" fontSize="11" fontWeight="900" fill="#334155">Root tip</text>
        <text x="98" y="76" textAnchor="middle" fontSize="10" fontWeight="800" fill="#92400e">elongation</text>
        <text x="98" y="106" textAnchor="middle" fontSize="10" fontWeight="800" fill="#92400e">maturation</text>
    </g>
);

const StemView = ({ active, showLabels, showSection, paused }: { active: StemMod; showLabels: boolean; showSection: boolean; paused: boolean }) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <SceneDefs />
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="url(#stageWash)" stroke="#e2e8f0" />
        <AmbientMotion paused={paused} />
        <WindStrokes paused={paused} />
        <rect x="70" y="504" width="980" height="58" rx="22" fill="#d9f99d" />
        <g filter="url(#softShadow)">
            {active === 'ordinary' && <OrdinaryStem paused={paused} />}
            {active === 'storage' && <StorageStem paused={paused} />}
            {active === 'support' && <SupportStem paused={paused} />}
            {active === 'protection' && <ProtectionStem paused={paused} />}
        </g>
        {active === 'propagation' && <PropagationStem paused={paused} />}
        {showSection && <StemNodeInset />}
        {showLabels && (
            <>
                <Label x={106} y={90} text="Stem: ascending shoot axis" width={236} />
                <Label x={672} y={120} text={stemCaption(active)} width={332} />
                <Label x={712} y={548} text="Stem conducts water, minerals and photosynthates" width={352} />
            </>
        )}
    </svg>
);

const OrdinaryStem = ({ paused }: { paused: boolean }) => (
    <g>
        <line x1="540" y1="504" x2="540" y2="128" stroke="#15803d" strokeWidth="13" strokeLinecap="round" />
        {[170, 248, 326, 404, 482].map((y, i) => (
            <g key={y}>
                <circle cx="540" cy={y} r="9" fill="#14532d" />
                <Sway paused={paused} pivot={`${i % 2 ? 592 : 488} ${y - 8}`} delay={i * 0.14}>
                    <ellipse cx={i % 2 ? 592 : 488} cy={y - 8} rx="52" ry="18" fill="url(#leafGradient)" transform={`rotate(${i % 2 ? 20 : -20} ${i % 2 ? 592 : 488} ${y - 8})`} />
                </Sway>
            </g>
        ))}
    </g>
);

const StorageStem = ({ paused }: { paused: boolean }) => (
    <g>
        <line x1="390" y1="300" x2="760" y2="300" stroke="#92400e" strokeWidth="14" strokeLinecap="round" />
        {[440, 540, 642].map((x, index) => (
            <g key={x}>
                <ellipse cx={x} cy="300" rx={index === 1 ? 58 : 46} ry="34" fill="url(#storageGradient)" stroke="#92400e" strokeWidth="5">
                    {!paused && <animate attributeName="ry" values={`${index === 1 ? 34 : 32};${index === 1 ? 38 : 36};${index === 1 ? 34 : 32}`} dur={`${2.2 + index * 0.2}s`} repeatCount="indefinite" />}
                </ellipse>
                <circle cx={x - 14} cy="292" r="5" fill="#78350f" />
                <path d={`M${x} 300 C${x + 18} 270 ${x + 42} 244 ${x + 70} 226`} stroke="#15803d" strokeWidth="5" fill="none">
                    {!paused && <animate attributeName="stroke-dashoffset" values="60;0;60" dur="2.6s" repeatCount="indefinite" />}
                </path>
            </g>
        ))}
        <rect x="70" y="300" width="980" height="204" fill="#d6b38a" opacity="0.38" />
    </g>
);

const SupportStem = ({ paused }: { paused: boolean }) => (
    <g>
        <line x1="730" y1="116" x2="730" y2="504" stroke="#64748b" strokeWidth="8" />
        {[180, 250, 320, 390, 460].map((y) => <line key={y} x1="702" y1={y} x2="758" y2={y} stroke="#94a3b8" strokeWidth="4" />)}
        <path d="M470 504 C498 412 530 300 592 236 C632 194 670 184 726 206" stroke="#15803d" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M588 240 C624 232 648 226 676 220 C702 214 710 202 728 190" stroke="#16a34a" strokeWidth="5" fill="none" strokeDasharray="220">
            {!paused && <animate attributeName="stroke-dashoffset" values="220;0;0" dur="2.2s" repeatCount="indefinite" />}
        </path>
        {!paused && <circle cx="728" cy="190" r="7" fill="#22c55e"><animate attributeName="r" values="4;9;4" dur="1.4s" repeatCount="indefinite" /></circle>}
    </g>
);

const ProtectionStem = ({ paused }: { paused: boolean }) => (
    <g>
        <line x1="560" y1="504" x2="560" y2="128" stroke="#15803d" strokeWidth="14" strokeLinecap="round" />
        {[188, 256, 324, 392, 460].map((y, i) => (
            <g key={y}>
                <circle cx="560" cy={y} r="9" fill="#14532d" />
                <path d={`M560 ${y} L${i % 2 ? 646 : 474} ${y - 24} L${i % 2 ? 616 : 504} ${y + 6}Z`} fill="#92400e">
                    {!paused && <animate attributeName="opacity" values="0.72;1;0.72" dur={`${1.8 + i * 0.1}s`} repeatCount="indefinite" />}
                </path>
            </g>
        ))}
        <Shield x={240} y={230} width={90} height={90} className="text-amber-600" />
    </g>
);

const PropagationStem = ({ paused }: { paused: boolean }) => (
    <g filter="url(#softShadow)">
        <line x1="226" y1="498" x2="914" y2="498" stroke="#15803d" strokeWidth="11" strokeLinecap="round" />
        {[286, 454, 622, 790].map((x, i) => (
            <g key={x}>
                <circle cx={x} cy="498" r="10" fill="#14532d" />
                <line x1={x} y1="498" x2={x} y2={paused ? 428 : 400 + (i % 2) * 14} stroke="#15803d" strokeWidth="6" strokeLinecap="round" />
                <Sway paused={paused} pivot={`${x} ${paused ? 430 : 404 + (i % 2) * 14}`} delay={i * 0.2}>
                    <ellipse cx={x - 28} cy={paused ? 430 : 404 + (i % 2) * 14} rx="34" ry="14" fill="#86efac" transform={`rotate(-22 ${x - 28} ${paused ? 430 : 404 + (i % 2) * 14})`} />
                    <ellipse cx={x + 28} cy={paused ? 430 : 404 + (i % 2) * 14} rx="34" ry="14" fill="#4ade80" transform={`rotate(22 ${x + 28} ${paused ? 430 : 404 + (i % 2) * 14})`} />
                </Sway>
            </g>
        ))}
    </g>
);

const StemNodeInset = () => (
    <g transform="translate(132 350)">
        <rect x="0" y="0" width="210" height="144" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="106" y1="18" x2="106" y2="126" stroke="#15803d" strokeWidth="9" strokeLinecap="round" />
        <circle cx="106" cy="52" r="9" fill="#14532d" />
        <circle cx="106" cy="92" r="9" fill="#14532d" />
        <text x="132" y="56" fontSize="12" fontWeight="900" fill="#334155">node</text>
        <text x="128" y="78" fontSize="12" fontWeight="900" fill="#334155">internode</text>
        <circle cx="132" cy="48" r="7" fill="#22c55e" />
        <text x="78" y="24" fontSize="11" fontWeight="900" fill="#334155">Bud</text>
    </g>
);

const LeafView = ({ active, showLabels, showSection, paused }: { active: LeafMod; showLabels: boolean; showSection: boolean; paused: boolean }) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <SceneDefs />
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="url(#stageWash)" stroke="#e2e8f0" />
        <AmbientMotion paused={paused} />
        <WindStrokes paused={paused} />
        <line x1="302" y1="540" x2="302" y2="154" stroke="#15803d" strokeWidth="12" strokeLinecap="round" />
        <circle cx="302" cy="336" r="10" fill="#14532d" />
        <g filter="url(#softShadow)">
            {active === 'ordinary' && <OrdinaryLeaf paused={paused} />}
            {active === 'parts' && <LeafParts paused={paused} />}
            {active === 'venation' && <VenationLeaf paused={paused} />}
            {active === 'tendril' && <LeafTendril paused={paused} />}
            {active === 'spine' && <LeafSpine paused={paused} />}
        </g>
        {showSection && <LeafInset active={active} />}
        {showLabels && (
            <>
                <Label x={96} y={90} text="Leaf: lateral outgrowth at node" width={260} />
                <Label x={592} y={112} text={leafCaption(active)} width={350} />
                <Label x={654} y={548} text="Leaf base, petiole and lamina form a typical leaf" width={360} />
            </>
        )}
    </svg>
);

const OrdinaryLeaf = ({ paused }: { paused: boolean }) => (
    <Sway paused={paused} pivot="302 336">
        <path d="M302 336 C430 224 618 210 796 328 C620 448 430 448 302 336Z" fill="#86efac" stroke="#15803d" strokeWidth="6" />
        <path d="M302 336 C454 330 608 328 796 328" stroke="#166534" strokeWidth="5" fill="none" />
        {[430, 510, 590, 670].map((x) => (
            <path key={x} d={`M${x} 332 C${x - 20} 292 ${x - 48} 268 ${x - 92} 246`} stroke="#16a34a" strokeWidth="3" fill="none" />
        ))}
    </Sway>
);

const LeafParts = ({ paused }: { paused: boolean }) => (
    <Sway paused={paused} pivot="302 336">
        <path d="M302 336 C442 218 636 214 800 332 C628 456 442 456 302 336Z" fill="#bbf7d0" stroke="#15803d" strokeWidth="6" />
        <line x1="302" y1="336" x2="800" y2="332" stroke="#166534" strokeWidth="5" />
        <line x1="302" y1="336" x2="216" y2="390" stroke="#15803d" strokeWidth="8" strokeLinecap="round" />
        <circle cx="302" cy="336" r="16" fill="#4ade80" stroke="#15803d" strokeWidth="4" />
    </Sway>
);

const VenationLeaf = ({ paused }: { paused: boolean }) => (
    <g>
        <path d="M242 338 C344 236 462 236 566 338 C464 444 346 444 242 338Z" fill="#dcfce7" stroke="#15803d" strokeWidth="5" />
        <line x1="242" y1="338" x2="566" y2="338" stroke="#166534" strokeWidth="4" />
        {[310, 360, 410, 460, 510].map((x) => (
            <g key={x}>
                <path d={`M${x} 338 C${x - 22} 306 ${x - 52} 284 ${x - 86} 266`} stroke="#16a34a" strokeWidth="3" fill="none">
                    {!paused && <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />}
                </path>
                <path d={`M${x} 338 C${x - 22} 370 ${x - 52} 392 ${x - 86} 410`} stroke="#16a34a" strokeWidth="3" fill="none">
                    {!paused && <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />}
                </path>
            </g>
        ))}
        <path d="M632 438 C660 326 716 250 818 206 C858 306 840 398 776 480 C720 510 672 494 632 438Z" fill="#dbeafe" stroke="#2563eb" strokeWidth="5" />
        {[674, 706, 738, 770, 802].map((x) => <line key={x} x1={x} y1="258" x2={x - 78} y2="454" stroke="#60a5fa" strokeWidth="3" />)}
        <text x="400" y="502" textAnchor="middle" fontSize="16" fontWeight="900" fill="#166534">Reticulate</text>
        <text x="732" y="540" textAnchor="middle" fontSize="16" fontWeight="900" fill="#1d4ed8">Parallel</text>
    </g>
);

const LeafTendril = ({ paused }: { paused: boolean }) => (
    <g>
        <path d="M302 336 C392 266 494 258 584 334 C506 398 394 406 302 336Z" fill="#bbf7d0" stroke="#15803d" strokeWidth="6" />
        <path d="M548 330 C612 274 664 278 690 326 C716 374 666 408 632 378 C604 354 634 328 662 346" stroke="#16a34a" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="380">
            {!paused && <animate attributeName="stroke-dashoffset" values="380;0;0" dur="2.2s" repeatCount="indefinite" />}
        </path>
        <line x1="720" y1="160" x2="720" y2="510" stroke="#64748b" strokeWidth="8" />
        {[220, 304, 388, 472].map((y) => <line key={y} x1="694" y1={y} x2="746" y2={y} stroke="#94a3b8" strokeWidth="4" />)}
    </g>
);

const LeafSpine = ({ paused }: { paused: boolean }) => (
    <g>
        <rect x="442" y="204" width="182" height="294" rx="80" fill="#86efac" stroke="#15803d" strokeWidth="7" />
        {[250, 300, 350, 400, 450].map((y, i) => (
            <g key={y}>
                <path d={`M442 ${y} L${390 - i * 8} ${y - 18}`} stroke="#92400e" strokeWidth="5" strokeLinecap="round">
                    {!paused && <animate attributeName="stroke-width" values="4;7;4" dur={`${2 + i * 0.1}s`} repeatCount="indefinite" />}
                </path>
                <path d={`M624 ${y + 10} L${684 + i * 8} ${y - 8}`} stroke="#92400e" strokeWidth="5" strokeLinecap="round">
                    {!paused && <animate attributeName="stroke-width" values="5;3;7;5" dur={`${2.2 + i * 0.1}s`} repeatCount="indefinite" />}
                </path>
            </g>
        ))}
    </g>
);

const LeafInset = ({ active }: { active: LeafMod }) => (
    <g transform="translate(108 394)">
        <rect x="0" y="0" width="214" height="128" rx="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="54" cy="64" r="22" fill={active === 'tendril' ? '#bbf7d0' : '#dcfce7'} stroke="#15803d" strokeWidth="4" />
        <line x1="92" y1="64" x2="176" y2="64" stroke="#15803d" strokeWidth="8" strokeLinecap="round" />
        <circle cx="96" cy="64" r="9" fill="#14532d" />
        <text x="116" y="48" fontSize="12" fontWeight="900" fill="#334155">axillary bud</text>
        <text x="102" y="86" fontSize="12" fontWeight="900" fill="#334155">node</text>
    </g>
);

const PhyllotaxyView = ({ active, showLabels, paused }: { active: PhyllotaxyType; showLabels: boolean; paused: boolean }) => (
    <svg viewBox="0 0 1120 650" className="h-full w-full">
        <SceneDefs />
        <rect x="24" y="24" width="1072" height="602" rx="30" fill="url(#stageWash)" stroke="#e2e8f0" />
        <AmbientMotion paused={paused} />
        <PhyllotaxyPlant x={250} active={active === 'alternate'} type="alternate" paused={paused} />
        <PhyllotaxyPlant x={560} active={active === 'opposite'} type="opposite" paused={paused} />
        <PhyllotaxyPlant x={870} active={active === 'whorled'} type="whorled" paused={paused} />
        {showLabels && (
            <>
                <Label x={150} y={92} text="Alternate: one leaf per node" width={235} />
                <Label x={458} y={92} text="Opposite: a leaf pair per node" width={250} />
                <Label x={780} y={92} text="Whorled: more than two leaves per node" width={300} />
            </>
        )}
    </svg>
);

const PhyllotaxyPlant = ({ x, type, active, paused }: { x: number; type: PhyllotaxyType; active: boolean; paused: boolean }) => (
    <g opacity={active ? 1 : 0.45}>
        <rect x={x - 112} y="108" width="224" height="450" rx="28" fill="#ffffff" stroke={active ? '#16a34a' : '#cbd5e1'} strokeWidth={active ? 5 : 2} filter={active ? 'url(#softShadow)' : undefined}>
            {active && !paused && <animate attributeName="stroke-width" values="4;7;4" dur="1.8s" repeatCount="indefinite" />}
        </rect>
        <line x1={x} y1="506" x2={x} y2="158" stroke="#15803d" strokeWidth="10" strokeLinecap="round" />
        {type === 'alternate' && [208, 278, 348, 418].map((y, i) => (
            <React.Fragment key={y}>
                <NodeLeaf x={x} y={y} sides={i % 2 ? ['right'] : ['left']} />
            </React.Fragment>
        ))}
        {type === 'opposite' && [214, 314, 414].map((y) => (
            <React.Fragment key={y}>
                <NodeLeaf x={x} y={y} sides={['left', 'right']} />
            </React.Fragment>
        ))}
        {type === 'whorled' && [240, 378].map((y) => (
            <React.Fragment key={y}>
                <NodeLeaf x={x} y={y} sides={['left', 'right', 'top']} />
            </React.Fragment>
        ))}
        <text x={x} y="540" textAnchor="middle" fontSize="18" fontWeight="900" fill="#0f172a">{titleCase(type)}</text>
    </g>
);

const NodeLeaf = ({ x, y, sides }: { x: number; y: number; sides: string[] }) => (
    <g>
        <circle cx={x} cy={y} r="8" fill="#14532d" />
        {sides.includes('left') && <ellipse cx={x - 54} cy={y - 8} rx="44" ry="15" fill="#86efac" transform={`rotate(-22 ${x - 54} ${y - 8})`} />}
        {sides.includes('right') && <ellipse cx={x + 54} cy={y - 8} rx="44" ry="15" fill="#4ade80" transform={`rotate(22 ${x + 54} ${y - 8})`} />}
        {sides.includes('top') && <ellipse cx={x} cy={y - 42} rx="38" ry="14" fill="#bbf7d0" transform={`rotate(90 ${x} ${y - 42})`} />}
    </g>
);

const LeftAside = ({ mode, rootMod, stemMod, leafMod, phyllotaxy }: { mode: Mode; rootMod: RootMod; stemMod: StemMod; leafMod: LeafMod; phyllotaxy: PhyllotaxyType }) => (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
        <div className="flex flex-col gap-2.5">
            <AsideCard title="Organ Map" subtitle="Root, stem and leaf axes">
                <MiniOrganMap mode={mode} />
            </AsideCard>
            <AsideCard title="Current Selection" subtitle="Live morphology lens">
                <MiniRow label="Root" value={ROOTS.find((item) => item.id === rootMod)?.label ?? 'Tap'} active={mode === 'roots'} />
                <MiniRow label="Stem" value={STEMS.find((item) => item.id === stemMod)?.label ?? 'Ordinary'} active={mode === 'stems'} />
                <MiniRow label="Leaf" value={LEAVES.find((item) => item.id === leafMod)?.label ?? 'Parts'} active={mode === 'leaves'} />
                <MiniRow label="Phyllotaxy" value={PHYLLS.find((item) => item.id === phyllotaxy)?.label ?? 'Alternate'} active={mode === 'phyllotaxy'} />
            </AsideCard>
            <AsideCard title="Figure Targets" subtitle="NCERT visual anchors">
                <ReferenceRow icon={<Sprout size={15} />} label="Fig. 5.2" value="Tap, fibrous and adventitious roots" />
                <ReferenceRow icon={<Leaf size={15} />} label="Fig. 5.4" value="Leaf parts and venation" />
                <ReferenceRow icon={<Network size={15} />} label="Fig. 5.6" value="Alternate, opposite and whorled phyllotaxy" />
            </AsideCard>
        </div>
    </aside>
);

const RightAside = ({ facts, activeLens, mode }: { facts: { title: string; section: string; facts: string[]; values: [string, string][] }; activeLens: { label: string; role?: string; ncert?: string; example?: string }; mode: Mode }) => (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
        <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
                <div className="flex items-center gap-2 text-base font-extrabold text-emerald-950">
                    <Leaf size={17} />
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
                <ValueRow label="Selected" value={activeLens.label} tone="emerald" />
                <ValueRow label="Role" value={activeLens.role ?? activeLens.example ?? 'NCERT'} tone="cyan" />
                {facts.values.map(([label, value]) => (
                    <React.Fragment key={label}>
                        <ValueRow label={label} value={value} tone="amber" />
                    </React.Fragment>
                ))}
            </div>
        </div>
    </aside>
);

const MiniOrganMap = ({ mode }: { mode: Mode }) => (
    <svg viewBox="0 0 300 180" className="h-[160px] w-full">
        <rect x="12" y="12" width="276" height="156" rx="22" fill="#f8fafc" stroke="#cbd5e1" />
        <line x1="150" y1="130" x2="150" y2="52" stroke="#15803d" strokeWidth="8" strokeLinecap="round" opacity={mode === 'stems' ? 1 : 0.45} />
        <ellipse cx="112" cy="58" rx="44" ry="14" fill="#86efac" opacity={mode === 'leaves' || mode === 'phyllotaxy' ? 1 : 0.45} transform="rotate(-22 112 58)" />
        <ellipse cx="188" cy="58" rx="44" ry="14" fill="#4ade80" opacity={mode === 'leaves' || mode === 'phyllotaxy' ? 1 : 0.45} transform="rotate(22 188 58)" />
        <path d="M150 132 C150 150 132 156 114 158" stroke="#7c3f16" strokeWidth="7" fill="none" opacity={mode === 'roots' ? 1 : 0.45} />
        <path d="M150 132 C150 150 168 156 186 158" stroke="#7c3f16" strokeWidth="7" fill="none" opacity={mode === 'roots' ? 1 : 0.45} />
    </svg>
);

const AsideCard = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
        <div className="text-base font-extrabold text-slate-900">{title}</div>
        <div className="mb-3 text-xs font-semibold text-slate-500">{subtitle}</div>
        {children}
    </div>
);

const MiniRow = ({ label, value, active }: { label: string; value: string; active: boolean }) => (
    <div className={`mb-2 rounded-lg border px-3 py-2 text-sm ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-100 bg-slate-50 text-slate-700'}`}>
        <div className="text-[10px] font-black uppercase text-slate-500">{label}</div>
        <div className="font-extrabold">{value}</div>
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

const ControlGroup = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-700">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

const Select = ({ value, onChange, items }: { value: string; onChange: (value: string) => void; items: { id: string; label: string }[] }) => (
    <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
    >
        {items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select>
);

const Choice = ({ active, onClick, label, compact = false }: { active: boolean; onClick: () => void; label: string; compact?: boolean }) => (
    <button
        onClick={onClick}
        className={`min-h-[34px] rounded-lg border px-1 text-[10px] font-black transition-colors ${
            active ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
        } ${compact ? 'text-[9px]' : ''}`}
    >
        {label}
    </button>
);

const ToggleButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button
        onClick={onClick}
        className={`flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold transition-colors ${
            active ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
        }`}
    >
        {icon}
        {label}
    </button>
);

const ValueRow = ({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'cyan' | 'emerald' | 'slate' }) => {
    const colors = {
        amber: 'bg-amber-50 text-amber-700',
        cyan: 'bg-cyan-50 text-cyan-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        slate: 'bg-slate-50 text-slate-700',
    };
    return (
        <div className={`mb-2 rounded-lg border border-slate-100 px-3 py-2.5 ${colors[tone]}`}>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 font-mono text-base font-extrabold">{value}</div>
        </div>
    );
};

const Label = ({ x, y, text, width }: { x: number; y: number; text: string; width?: number }) => {
    const rectWidth = width ?? Math.min(360, Math.max(120, text.length * 7));
    const labelX = Math.max(32, Math.min(x - 8, 1088 - rectWidth));
    const labelText = text.length > 48 ? `${text.slice(0, 45)}...` : text;

    return (
        <g>
            <rect x={labelX} y={y - 17} width={rectWidth} height="27" rx="9" fill="#ffffff" stroke="#cbd5e1" />
            <text x={labelX + 10} y={y} fontSize="12" fontWeight="800" fill="#334155">{labelText}</text>
        </g>
    );
};

function getModeFacts(mode: Mode, activeLens: { label: string; role?: string; ncert?: string; example?: string }): { title: string; section: string; facts: string[]; values: [string, string][] } {
    if (mode === 'roots') {
        return {
            title: 'Root modifications',
            section: 'NCERT 5.1 The Root',
            facts: [
                'Tap root: primary root persists in dicots such as mustard.',
                'Fibrous root: primary root is short-lived in monocots such as wheat.',
                'Roots may be modified for storage, mechanical support and respiration.',
            ],
            values: [
                ['Figure', '5.2'],
                ['Focus', activeLens.role ?? 'Root'],
            ],
        };
    }
    if (mode === 'stems') {
        return {
            title: 'Stem modifications',
            section: 'NCERT 5.2 The Stem',
            facts: [
                'Stem bears nodes, internodes and buds.',
                'Stem conducts water, minerals and photosynthates.',
                'Some stems perform storage, support, protection and vegetative propagation.',
            ],
            values: [
                ['Marker', 'Nodes'],
                ['Focus', activeLens.role ?? 'Stem'],
            ],
        };
    }
    if (mode === 'leaves') {
        return {
            title: 'Leaf structure',
            section: 'NCERT 5.3 The Leaf',
            facts: [
                'A typical leaf has leaf base, petiole and lamina.',
                'Veins provide rigidity and transport channels in the leaf blade.',
                'Leaves are major vegetative organs for photosynthesis.',
            ],
            values: [
                ['Figure', '5.4'],
                ['Focus', activeLens.role ?? 'Leaf'],
            ],
        };
    }
    return {
        title: 'Phyllotaxy',
        section: 'NCERT 5.3.3 Phyllotaxy',
        facts: [
            'Phyllotaxy is the arrangement of leaves on stem or branch.',
            'Alternate has one leaf at each node.',
            'Opposite has a pair; whorled has more than two leaves at a node.',
        ],
        values: [
            ['Figure', '5.6'],
            ['Example', activeLens.example ?? 'NCERT'],
        ],
    };
}

function rootCaption(active: RootMod) {
    const captions: Record<RootMod, string> = {
        tap: 'Primary root persists with lateral branches',
        fibrous: 'Many roots arise from stem base',
        adventitious: 'Roots arise from parts other than radicle',
        storage: 'Modified root stores reserve food',
        support: 'Modified roots provide mechanical support',
        respiration: 'Modified roots assist gaseous exchange',
    };
    return captions[active];
}

function stemCaption(active: StemMod) {
    const captions: Record<StemMod, string> = {
        ordinary: 'Nodes, internodes and buds identify the stem',
        storage: 'Stem may store food below ground',
        support: 'Stem may aid climbing and support',
        protection: 'Stem may protect through pointed structures',
        propagation: 'Stem may form new plantlets vegetatively',
    };
    return captions[active];
}

function leafCaption(active: LeafMod) {
    const captions: Record<LeafMod, string> = {
        ordinary: 'Leaf blade is the major photosynthetic surface',
        parts: 'Leaf base, petiole and lamina form a typical leaf',
        venation: 'Reticulate and parallel venation compare vein layout',
        tendril: 'Leaf variation can support climbing',
        spine: 'Leaf variation can support protection',
    };
    return captions[active];
}

function titleCase(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export default MorphologyFloweringPlantsLab;
