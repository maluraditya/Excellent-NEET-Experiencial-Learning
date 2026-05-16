import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FastForward, Leaf, MousePointer2, Play, RefreshCcw, Sprout, Wheat } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type PlantType = 'Maize' | 'Pea';
type GameteKey = 'gamete1' | 'gamete2';
type DragKey = 'pollen' | GameteKey | null;

interface DoubleFertilisationSeedDevelopmentLabProps {
    topic: any;
    onExit: () => void;
}

const EGG_TARGET = { x: 700, y: 410 };
const NUCLEUS_TARGET = { x: 590, y: 345 };
const GAMETE_START = { x: 392, y: 430 };

const DoubleFertilisationSeedDevelopmentLab: React.FC<DoubleFertilisationSeedDevelopmentLabProps> = ({ topic, onExit }) => {
    const [plantType, setPlantType] = useState<PlantType>('Maize');
    const [speed, setSpeed] = useState(45);
    const [tubeProgress, setTubeProgress] = useState(0);
    const [pollinationStarted, setPollinationStarted] = useState(false);
    const [gamete1, setGamete1] = useState(GAMETE_START);
    const [gamete2, setGamete2] = useState({ x: GAMETE_START.x - 26, y: GAMETE_START.y - 16 });
    const [pollenX, setPollenX] = useState(165);
    const [dragging, setDragging] = useState<DragKey>(null);
    const [zygoteFormed, setZygoteFormed] = useState(false);
    const [penFormed, setPenFormed] = useState(false);
    const [seedTime, setSeedTime] = useState(0);
    const [status, setStatus] = useState('Drag the pollen grain on the stigma, then tap Pollination to start pollen tube growth.');

    const tubeReady = tubeProgress >= 100;
    const bothFusionsDone = zygoteFormed && penFormed;

    useEffect(() => {
        if (!pollinationStarted || tubeReady) return;
        const interval = window.setInterval(() => {
            setTubeProgress((value) => {
                const next = Math.min(100, value + 1.3 + speed / 26);
                if (next >= 100) {
                    setStatus('The pollen tube has reached the embryo sac. Drag Gamete 1 to the egg and Gamete 2 to the secondary nucleus.');
                }
                return next;
            });
        }, 120);
        return () => window.clearInterval(interval);
    }, [pollinationStarted, speed, tubeReady]);

    const seedMetrics = useMemo(() => {
        if (!bothFusionsDone) {
            return { reserve: 0, embryo: 0, coat: 0, endospermRadius: 28, cotyledonSize: 12, label: 'Waiting for both fertilisation events' };
        }

        const mature = Math.max(seedTime, 12);
        if (plantType === 'Maize') {
            return {
                reserve: Math.round(28 + mature * 0.72),
                embryo: Math.round(12 + mature * 0.38),
                coat: Math.round(mature),
                endospermRadius: 32 + mature * 0.82,
                cotyledonSize: 14 + mature * 0.2,
                label: 'Endosperm persists and becomes bulky, like rice or wheat grain.'
            };
        }

        const reserve = seedTime < 45 ? 22 + seedTime * 0.85 : Math.max(8, 78 - (seedTime - 45) * 1.2);
        return {
            reserve: Math.round(reserve),
            embryo: Math.round(15 + seedTime * 0.78),
            coat: Math.round(seedTime),
            endospermRadius: 34 + Math.max(8, reserve) * 0.45,
            cotyledonSize: 16 + seedTime * 0.62,
            label: 'Cotyledons absorb the endosperm, so the mature pea seed becomes non-endospermic.'
        };
    }, [bothFusionsDone, plantType, seedTime]);

    const startPollination = () => {
        setPollinationStarted(true);
        setStatus('Pollen tube is growing through the style toward the ovule. Increase speed to watch it move faster.');
    };

    const resetLab = () => {
        setPlantType('Maize');
        setSpeed(45);
        setTubeProgress(0);
        setPollinationStarted(false);
        setGamete1(GAMETE_START);
        setGamete2({ x: GAMETE_START.x - 26, y: GAMETE_START.y - 16 });
        setPollenX(165);
        setDragging(null);
        setZygoteFormed(false);
        setPenFormed(false);
        setSeedTime(0);
        setStatus('Drag the pollen grain on the stigma, then tap Pollination to start pollen tube growth.');
    };

    const fastForward = () => {
        if (!bothFusionsDone) {
            setStatus('Complete syngamy and triple fusion first. Seed development starts only after double fertilisation.');
            return;
        }
        setSeedTime((value) => Math.min(100, value + 18));
        setStatus(plantType === 'Maize'
            ? 'Time is moving forward. In maize, the endosperm remains large and stores food.'
            : 'Time is moving forward. In pea, cotyledons become fleshy by absorbing endosperm food.');
    };

    const moveGameteToTarget = (key: GameteKey) => {
        if (!tubeReady) {
            setStatus('Wait until the pollen tube reaches the embryo sac.');
            return;
        }
        if (key === 'gamete1') {
            setGamete1(EGG_TARGET);
            setZygoteFormed(true);
            setStatus('Syngamy complete: Gamete 1 fused with the egg cell and formed a diploid zygote.');
        } else {
            setGamete2(NUCLEUS_TARGET);
            setPenFormed(true);
            setStatus('Triple fusion complete: Gamete 2 fused with the secondary nucleus and formed PEN.');
        }
    };

    const updateDrag = (clientX: number, clientY: number, target: SVGSVGElement) => {
        if (!dragging) return;
        const rect = target.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 900;
        const y = ((clientY - rect.top) / rect.height) * 560;

        if (dragging === 'pollen') {
            setPollenX(Math.max(120, Math.min(220, x)));
            return;
        }

        if (!tubeReady) return;
        const position = { x: Math.max(360, Math.min(760, x)), y: Math.max(250, Math.min(470, y)) };
        if (dragging === 'gamete1' && !zygoteFormed) {
            setGamete1(position);
            if (distance(position, EGG_TARGET) < 34) {
                setZygoteFormed(true);
                setGamete1(EGG_TARGET);
                setStatus('Syngamy complete: the zygote is formed. Now guide Gamete 2 to the secondary nucleus.');
            }
        }
        if (dragging === 'gamete2' && !penFormed) {
            setGamete2(position);
            if (distance(position, NUCLEUS_TARGET) < 38) {
                setPenFormed(true);
                setGamete2(NUCLEUS_TARGET);
                setStatus('Triple fusion complete: PEN formed. The endosperm food bank can now develop.');
            }
        }
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-[1.22fr_0.78fr] gap-3 min-h-full">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-[460px]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Double Fertilisation Lab</div>
                            <div className="text-xs text-slate-500">Pistil to embryo sac to seed development</div>
                        </div>
                        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                            {plantType}
                        </span>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-2 flex-1 min-h-[380px]">
                        <FertilisationScene
                            pollenX={pollenX}
                            tubeProgress={tubeProgress}
                            tubeReady={tubeReady}
                            gamete1={gamete1}
                            gamete2={gamete2}
                            zygoteFormed={zygoteFormed}
                            penFormed={penFormed}
                            plantType={plantType}
                            seedMetrics={seedMetrics}
                            onDragStart={setDragging}
                            onDragEnd={() => setDragging(null)}
                            onDragMove={updateDrag}
                        />
                    </div>

                    <div className="grid sm:grid-cols-4 gap-2 mt-3">
                        <MetricCard label="Tube Growth" value={`${Math.round(tubeProgress)}%`} tone="text-emerald-700" />
                        <MetricCard label="Zygote" value={zygoteFormed ? 'Formed' : 'Pending'} tone={zygoteFormed ? 'text-emerald-700' : 'text-slate-600'} />
                        <MetricCard label="Food Reserve" value={`${seedMetrics.reserve}%`} tone="text-amber-700" />
                        <MetricCard label="Seed Coat" value={`${seedMetrics.coat}%`} tone="text-slate-700" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-3">
                    <InfoCard title="Current Observation" icon={<MousePointer2 size={16} className="text-emerald-600" />}>
                        <p>{status}</p>
                    </InfoCard>
                    <InfoCard title="Double Hit Logic" icon={<CheckCircle2 size={16} className="text-blue-600" />}>
                        <p>Gamete 1 + egg cell forms the zygote. Gamete 2 + secondary nucleus forms PEN, which develops into endosperm.</p>
                    </InfoCard>
                    <InfoCard title="Seed Result" icon={plantType === 'Maize' ? <Wheat size={16} className="text-amber-600" /> : <Leaf size={16} className="text-green-600" />}>
                        <p>{seedMetrics.label}</p>
                    </InfoCard>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                            <span>Food Reserves</span>
                            <span>{seedMetrics.reserve}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(100, seedMetrics.reserve)}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-800">
                    <strong>Experiment Goal:</strong> Watch pollen tube growth, complete the two fusions, and compare maize and pea seed development.
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <button
                        onClick={startPollination}
                        disabled={pollinationStarted}
                        className={`rounded-xl px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${pollinationStarted ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                    >
                        <Play size={15} />
                        Pollination
                    </button>
                    <button
                        onClick={fastForward}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                    >
                        <FastForward size={15} />
                        Fast-forward Time
                    </button>
                </div>

                <SliderBlock label="Pollen Tube Speed" value={`${speed}%`} minLabel="Slow" maxLabel="Fast">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={speed}
                        onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-600"
                    />
                </SliderBlock>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fusion Trigger</div>
                    <div className="grid sm:grid-cols-2 gap-2">
                        <button
                            onClick={() => moveGameteToTarget('gamete1')}
                            className={`rounded-xl border px-4 py-3 text-xs font-bold transition-all ${zygoteFormed ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300'}`}
                        >
                            Guide Gamete 1 to Egg
                        </button>
                        <button
                            onClick={() => moveGameteToTarget('gamete2')}
                            className={`rounded-xl border px-4 py-3 text-xs font-bold transition-all ${penFormed ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'}`}
                        >
                            Guide Gamete 2 to Centre
                        </button>
                    </div>
                    <p className="text-xs text-slate-500">You can also drag the blue gamete sparks directly inside the embryo sac after the pollen tube reaches it.</p>
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Plant Selector</div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['Maize', 'Pea'] as PlantType[]).map((item) => (
                            <button
                                key={item}
                                onClick={() => setPlantType(item)}
                                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${plantType === item ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>

                <SliderBlock label="Seed Maturation" value={`${seedTime}%`} minLabel="Young" maxLabel="Mature">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={seedTime}
                        disabled={!bothFusionsDone}
                        onChange={(e) => setSeedTime(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500 disabled:opacity-40"
                    />
                </SliderBlock>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-800 mb-3 text-sm">Step-by-Step Observation Flow</h4>
                    <ol className="space-y-2 text-sm text-slate-600">
                        <StepItem number="1">Tap <strong>Pollination</strong> and observe the pollen tube elongating through the style.</StepItem>
                        <StepItem number="2">When the tube reaches the ovule, follow the two blue male gametes into the embryo sac.</StepItem>
                        <StepItem number="3">Drag or guide Gamete 1 to the egg cell to form the <strong>zygote</strong>.</StepItem>
                        <StepItem number="4">Drag or guide Gamete 2 to the secondary nucleus to form <strong>PEN</strong> and endosperm.</StepItem>
                        <StepItem number="5">Select <strong>Maize</strong> or <strong>Pea</strong>, then fast-forward seed maturation.</StepItem>
                    </ol>
                </div>

                <button
                    onClick={resetLab}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCcw size={15} />
                    Reset Lab
                </button>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
        />
    );
};

const FertilisationScene = ({
    pollenX,
    tubeProgress,
    tubeReady,
    gamete1,
    gamete2,
    zygoteFormed,
    penFormed,
    plantType,
    seedMetrics,
    onDragStart,
    onDragEnd,
    onDragMove
}: {
    pollenX: number;
    tubeProgress: number;
    tubeReady: boolean;
    gamete1: { x: number; y: number };
    gamete2: { x: number; y: number };
    zygoteFormed: boolean;
    penFormed: boolean;
    plantType: PlantType;
    seedMetrics: { reserve: number; embryo: number; coat: number; endospermRadius: number; cotyledonSize: number; label: string };
    onDragStart: (value: DragKey) => void;
    onDragEnd: () => void;
    onDragMove: (clientX: number, clientY: number, target: SVGSVGElement) => void;
}) => {
    const tubeLength = 395;
    const visibleTube = (tubeProgress / 100) * tubeLength;
    const seedCoatOpacity = Math.min(1, seedMetrics.coat / 100);

    return (
        <svg
            viewBox="0 0 900 560"
            className="w-full h-full select-none"
            onMouseMove={(event) => onDragMove(event.clientX, event.clientY, event.currentTarget)}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchMove={(event) => {
                const touch = event.touches[0];
                if (touch) onDragMove(touch.clientX, touch.clientY, event.currentTarget);
            }}
            onTouchEnd={onDragEnd}
        >
            <defs>
                <filter id="softGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="styleGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f9a8d4" />
                    <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
                <linearGradient id="ovuleGradient" x1="0" x2="1">
                    <stop offset="0%" stopColor="#dcfce7" />
                    <stop offset="100%" stopColor="#bbf7d0" />
                </linearGradient>
            </defs>

            <rect x="0" y="0" width="900" height="560" rx="26" fill="#f8fafc" />
            <path d="M120 70 C180 36 255 45 300 86 C260 125 170 122 120 70Z" fill="#f9a8d4" opacity="0.85" />
            <path d="M178 103 C207 185 235 260 257 342 C272 398 310 435 374 439" fill="none" stroke="url(#styleGradient)" strokeWidth="68" strokeLinecap="round" opacity="0.72" />
            <path d="M178 103 C207 185 235 260 257 342 C272 398 310 435 374 439" fill="none" stroke="#be123c" strokeWidth="3" opacity="0.35" />
            <text x="110" y="42" className="fill-slate-700 text-[18px] font-bold">Stigma</text>
            <text x="218" y="234" className="fill-slate-700 text-[18px] font-bold">Style</text>

            <ellipse cx="440" cy="455" rx="210" ry="72" fill="#fce7f3" opacity="0.65" />
            <text x="338" y="535" className="fill-slate-700 text-[18px] font-bold">Ovary with Ovule</text>

            <ellipse cx="560" cy="390" rx="178" ry="110" fill="url(#ovuleGradient)" stroke="#16a34a" strokeWidth="3" />
            <ellipse cx="575" cy="384" rx="126" ry="78" fill="#ecfeff" stroke="#06b6d4" strokeWidth="2" strokeDasharray="8 7" />
            <text x="510" y="290" className="fill-emerald-900 text-[17px] font-bold">Embryo Sac</text>

            <path
                d="M170 82 C188 175 221 275 270 356 C303 410 350 430 392 430"
                fill="none"
                stroke="#22c55e"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${visibleTube} ${tubeLength}`}
                filter="url(#softGlow)"
            />
            <path
                d="M170 82 C188 175 221 275 270 356 C303 410 350 430 392 430"
                fill="none"
                stroke="#bbf7d0"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${visibleTube} ${tubeLength}`}
            />

            <g
                onMouseDown={() => onDragStart('pollen')}
                onTouchStart={() => onDragStart('pollen')}
                className="cursor-grab"
            >
                <circle cx={pollenX} cy="72" r="20" fill="#facc15" stroke="#a16207" strokeWidth="3" />
                <circle cx={pollenX - 7} cy="65" r="3" fill="#a16207" />
                <circle cx={pollenX + 8} cy="77" r="3" fill="#a16207" />
                <text x={pollenX - 48} y="26" className="fill-amber-900 text-[14px] font-bold">Pollen Grain</text>
            </g>

            <circle cx={EGG_TARGET.x} cy={EGG_TARGET.y} r="34" fill={zygoteFormed ? '#f472b6' : '#fbcfe8'} stroke="#be185d" strokeWidth="3" />
            <text x="674" y="460" className="fill-pink-900 text-[15px] font-bold">{zygoteFormed ? 'Zygote' : 'Egg Cell'}</text>

            <circle cx={NUCLEUS_TARGET.x} cy={NUCLEUS_TARGET.y} r={penFormed ? 40 : 30} fill={penFormed ? '#f59e0b' : '#fde68a'} stroke="#b45309" strokeWidth="3" opacity="0.95" />
            <text x="525" y="314" className="fill-amber-900 text-[14px] font-bold">{penFormed ? 'PEN' : 'Secondary Nucleus'}</text>

            {tubeReady && (
                <>
                    <GameteSpark position={gamete1} label="Gamete 1" locked={zygoteFormed} onDragStart={() => onDragStart('gamete1')} />
                    <GameteSpark position={gamete2} label="Gamete 2" locked={penFormed} onDragStart={() => onDragStart('gamete2')} />
                </>
            )}

            {penFormed && (
                <g>
                    <ellipse cx="560" cy="390" rx={seedMetrics.endospermRadius * 1.16} ry={seedMetrics.endospermRadius * 0.72} fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" opacity="0.72" />
                    <text x="485" y="506" className="fill-amber-900 text-[15px] font-bold">Endosperm food bank</text>
                </g>
            )}

            {zygoteFormed && (
                <g>
                    <ellipse cx="690" cy="410" rx={18 + seedMetrics.embryo * 0.18} ry={12 + seedMetrics.embryo * 0.12} fill="#db2777" opacity="0.82" />
                    <path d={`M690 410 C${708 + seedMetrics.cotyledonSize * 0.18} ${390 - seedMetrics.cotyledonSize * 0.08}, ${726 + seedMetrics.cotyledonSize * 0.28} ${410}, ${705 + seedMetrics.cotyledonSize * 0.2} ${430}`} fill="#86efac" stroke="#16a34a" strokeWidth="2" opacity={plantType === 'Pea' ? 0.9 : 0.55} />
                    <text x="665" y="382" className="fill-rose-900 text-[14px] font-bold">Embryo</text>
                </g>
            )}

            {seedMetrics.coat > 4 && (
                <ellipse cx="560" cy="390" rx="183" ry="114" fill="none" stroke="#78350f" strokeWidth={4 + seedCoatOpacity * 8} opacity={0.24 + seedCoatOpacity * 0.55} />
            )}

            {plantType === 'Maize' && seedMetrics.coat > 20 && (
                <ellipse cx="560" cy="390" rx="142" ry="87" fill="none" stroke="#854d0e" strokeWidth="8" strokeDasharray="4 7" opacity="0.75" />
            )}
            {plantType === 'Maize' && seedMetrics.coat > 20 && (
                <text x="475" y="260" className="fill-yellow-900 text-[14px] font-bold">Aleurone layer</text>
            )}

            <g transform="translate(28 438)">
                <rect width="230" height="82" rx="16" fill="#ffffff" stroke="#cbd5e1" />
                <text x="16" y="26" className="fill-slate-700 text-[14px] font-bold">Process Map</text>
                <text x="16" y="50" className="fill-slate-500 text-[12px]">1. Pollen tube path</text>
                <text x="16" y="68" className="fill-slate-500 text-[12px]">2. Syngamy + Triple fusion</text>
            </g>
        </svg>
    );
};

const GameteSpark = ({ position, label, locked, onDragStart }: { position: { x: number; y: number }; label: string; locked: boolean; onDragStart: () => void }) => (
    <g
        onMouseDown={!locked ? onDragStart : undefined}
        onTouchStart={!locked ? onDragStart : undefined}
        className={locked ? 'cursor-default' : 'cursor-grab'}
        style={{ transition: 'transform 240ms ease' }}
    >
        <circle cx={position.x} cy={position.y} r="16" fill={locked ? '#38bdf8' : '#2563eb'} stroke="#bfdbfe" strokeWidth="4" filter="url(#softGlow)" />
        {!locked && <circle cx={position.x} cy={position.y} r="23" fill="#60a5fa" opacity="0.2" />}
        <text x={position.x - 28} y={position.y - 26} className="fill-blue-900 text-[12px] font-bold">{label}</text>
    </g>
);

const MetricCard = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
        <div className={`text-sm font-bold ${tone}`}>{value}</div>
    </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-800">
            {icon}
            {title}
        </div>
        <div className="text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
);

const SliderBlock = ({ label, value, minLabel, maxLabel, children }: { label: string; value: string; minLabel: string; maxLabel: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</div>
            <div className="text-xs font-bold text-slate-800">{value}</div>
        </div>
        {children}
        <div className="flex justify-between text-[11px] text-slate-400">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
        </div>
    </div>
);

const StepItem = ({ number, children }: { number: string; children: React.ReactNode }) => (
    <li className="flex items-start gap-3">
        <span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">{number}</span>
        <span>{children}</span>
    </li>
);

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
};

export default DoubleFertilisationSeedDevelopmentLab;
