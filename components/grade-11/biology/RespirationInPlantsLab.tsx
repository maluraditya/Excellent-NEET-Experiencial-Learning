import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Flame, Gauge, Play, RefreshCcw, RotateCw, Wind, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type OxygenMode = 'ON' | 'OFF';
type FermentationMode = 'Yeast' | 'Muscle Cell';

interface RespirationInPlantsLabProps {
    topic: any;
    onExit: () => void;
}

const RespirationInPlantsLab: React.FC<RespirationInPlantsLabProps> = ({ topic, onExit }) => {
    const [oxygen, setOxygen] = useState<OxygenMode>('ON');
    const [fermentationMode, setFermentationMode] = useState<FermentationMode>('Yeast');
    const [speed, setSpeed] = useState(45);
    const [glycolysisProgress, setGlycolysisProgress] = useState(0);
    const [glycolysisRunning, setGlycolysisRunning] = useState(false);
    const [activated, setActivated] = useState(false);
    const [pyruvateReady, setPyruvateReady] = useState(false);
    const [pyruvateFed, setPyruvateFed] = useState(0);
    const [tcaTurns, setTcaTurns] = useState(0);
    const [wheelAngle, setWheelAngle] = useState(0);
    const [fermented, setFermented] = useState(false);
    const [draggingPyruvate, setDraggingPyruvate] = useState<number | null>(null);
    const [pyruvatePositions, setPyruvatePositions] = useState([{ x: 270, y: 260 }, { x: 270, y: 318 }]);
    const [atp, setAtp] = useState(0);
    const [nadh, setNadh] = useState(0);
    const [fadh2, setFadh2] = useState(0);
    const [co2, setCo2] = useState(0);
    const [status, setStatus] = useState('Click Start Glycolysis. Glucose first uses 2 ATP tokens, then splits into two pyruvates.');

    useEffect(() => {
        if (!glycolysisRunning || glycolysisProgress >= 100) return;
        const interval = window.setInterval(() => {
            setGlycolysisProgress((value) => {
                const next = Math.min(100, value + 1.4 + speed / 24);
                if (next >= 25 && !activated) {
                    setActivated(true);
                    setAtp(-2);
                    setStatus('Activation phase: two ATP tokens are used to phosphorylate glucose.');
                }
                if (next >= 100) {
                    setPyruvateReady(true);
                    setAtp(2);
                    setNadh(2);
                    setStatus('Glycolysis complete: glucose split into two pyruvates. Net yield is 2 ATP and 2 NADH.');
                }
                return next;
            });
        }, 140);
        return () => window.clearInterval(interval);
    }, [activated, glycolysisProgress, glycolysisRunning, speed]);

    useEffect(() => {
        if (pyruvateFed <= tcaTurns) return;
        const interval = window.setInterval(() => {
            setWheelAngle((angle) => angle + 18);
            setTcaTurns((turns) => {
                if (wheelAngle % 360 < 330) return turns;
                const next = turns + 1;
                setCo2((value) => value + 2);
                setNadh((value) => value + 3);
                setFadh2((value) => value + 1);
                setAtp((value) => value + 1);
                setStatus(`TCA wheel completed turn ${next}. NADH sparks, FADH2, ATP/GTP and CO2 puffs are produced.`);
                return next;
            });
        }, Math.max(80, 220 - speed));
        return () => window.clearInterval(interval);
    }, [pyruvateFed, speed, tcaTurns, wheelAngle]);

    const startGlycolysis = () => {
        if (glycolysisProgress > 0) return;
        setGlycolysisRunning(true);
        setStatus('Glycolysis started in the cytoplasm. Watch ATP investment, splitting, and NAD+ conversion to NADH.');
    };

    const ferment = () => {
        if (!pyruvateReady) {
            setStatus('Complete glycolysis first. Fermentation starts from pyruvate.');
            return;
        }
        if (oxygen === 'ON') {
            setStatus('Switch O2 OFF to force pyruvate into fermentation.');
            return;
        }
        setFermented(true);
        setNadh(0);
        if (fermentationMode === 'Yeast') {
            setCo2(2);
            setStatus('Alcoholic fermentation: pyruvate forms ethanol and CO2. NADH is reoxidised to NAD+.');
        } else {
            setStatus('Lactic acid fermentation: pyruvate becomes lactic acid. NADH is reoxidised to NAD+ so glycolysis can continue.');
        }
    };

    const feedMatrix = (index?: number) => {
        if (!pyruvateReady) {
            setStatus('Complete glycolysis first. Pyruvate must be formed before entering the mitochondrion.');
            return;
        }
        if (oxygen === 'OFF') {
            setStatus('O2 is OFF. Pyruvate cannot enter aerobic respiration; it remains in the cytoplasm for fermentation.');
            return;
        }
        if (pyruvateFed >= 2) {
            setStatus('Both pyruvates have entered the mitochondrion. Watch the matrix wheel complete two turns.');
            return;
        }
        const nextFed = pyruvateFed + 1;
        setPyruvateFed(nextFed);
        setPyruvatePositions((positions) => positions.map((position, i) => i === (index ?? pyruvateFed) ? { x: 650, y: 260 + i * 58 } : position));
        setCo2((value) => value + 1);
        setNadh((value) => value + 1);
        setStatus(`Link reaction: Pyruvate ${nextFed} entered the matrix, released CO2, formed NADH, and became Acetyl CoA.`);
    };

    const updateDrag = (clientX: number, clientY: number, target: SVGSVGElement) => {
        if (draggingPyruvate === null || !pyruvateReady) return;
        const rect = target.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 900;
        const y = ((clientY - rect.top) / rect.height) * 520;
        setPyruvatePositions((positions) => positions.map((position, index) => index === draggingPyruvate ? { x, y } : position));
        if (oxygen === 'ON' && x > 555 && x < 810 && y > 160 && y < 390) {
            feedMatrix(draggingPyruvate);
            setDraggingPyruvate(null);
        }
    };

    const resetLab = () => {
        setOxygen('ON');
        setFermentationMode('Yeast');
        setSpeed(45);
        setGlycolysisProgress(0);
        setGlycolysisRunning(false);
        setActivated(false);
        setPyruvateReady(false);
        setPyruvateFed(0);
        setTcaTurns(0);
        setWheelAngle(0);
        setFermented(false);
        setDraggingPyruvate(null);
        setPyruvatePositions([{ x: 270, y: 260 }, { x: 270, y: 318 }]);
        setAtp(0);
        setNadh(0);
        setFadh2(0);
        setCo2(0);
        setStatus('Click Start Glycolysis. Glucose first uses 2 ATP tokens, then splits into two pyruvates.');
    };

    const pathwayText = useMemo(() => {
        if (!pyruvateReady) return 'Glucose is still moving through the EMP pathway in the cytoplasm.';
        if (oxygen === 'OFF') return fermented ? `Anaerobic fate selected: ${fermentationMode} fermentation regenerates NAD+ but keeps ATP yield low.` : 'O2 is absent. Pyruvate must stay in the cytoplasm and enter fermentation.';
        if (pyruvateFed === 0) return 'O2 is available. Drag pyruvate into the mitochondrion or use Feed the Matrix.';
        if (tcaTurns < 2) return 'Acetyl CoA is feeding the TCA matrix wheel. One turn is needed for each pyruvate.';
        return 'Aerobic oxidation complete in this model: glucose carbon has been released as CO2 and energy carriers are loaded.';
    }, [fermentationMode, fermented, oxygen, pyruvateFed, pyruvateReady, tcaTurns]);

    const simulationCombo = (
        <div className="w-full h-full min-h-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-3 min-h-full">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-[460px]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Cellular Respiration Pathway</div>
                            <div className="text-xs text-slate-500">Cytoplasm glycolysis and mitochondrial TCA cycle</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${oxygen === 'ON' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                            O2 {oxygen}
                        </span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-2 flex-1 min-h-[380px]">
                        <RespirationScene
                            oxygen={oxygen}
                            glycolysisProgress={glycolysisProgress}
                            activated={activated}
                            pyruvateReady={pyruvateReady}
                            pyruvatePositions={pyruvatePositions}
                            draggingPyruvate={draggingPyruvate}
                            pyruvateFed={pyruvateFed}
                            tcaTurns={tcaTurns}
                            wheelAngle={wheelAngle}
                            fermented={fermented}
                            fermentationMode={fermentationMode}
                            co2={co2}
                            onDragStart={setDraggingPyruvate}
                            onDragEnd={() => setDraggingPyruvate(null)}
                            onDragMove={updateDrag}
                        />
                    </div>
                    <div className="grid sm:grid-cols-4 gap-2 mt-3">
                        <MetricCard label="ATP Net" value={`${atp}`} tone={atp >= 2 ? 'text-emerald-700' : 'text-red-700'} />
                        <MetricCard label="NADH" value={`${nadh}`} tone="text-blue-700" />
                        <MetricCard label="FADH2" value={`${fadh2}`} tone="text-purple-700" />
                        <MetricCard label="CO2" value={`${co2}/6`} tone="text-slate-700" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-3">
                    <InfoCard title="Current Observation" icon={<Zap size={16} className="text-amber-600" />}>
                        <p>{status}</p>
                    </InfoCard>
                    <InfoCard title="Pathway Logic" icon={<CheckCircle2 size={16} className="text-emerald-600" />}>
                        <p>{pathwayText}</p>
                    </InfoCard>
                    <InfoCard title="Energy Meters" icon={<Gauge size={16} className="text-blue-600" />}>
                        <Meter label="ATP" value={Math.max(0, atp * 16)} color="bg-emerald-500" />
                        <Meter label="NADH" value={nadh * 10} color="bg-blue-500" />
                        <Meter label="FADH2" value={fadh2 * 22} color="bg-purple-500" />
                        <Meter label="CO2" value={(co2 / 6) * 100} color="bg-slate-500" />
                    </InfoCard>
                </div>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-800">
                    <strong>Experiment Goal:</strong> Split glucose in the cytoplasm, then use the oxygen switch to compare fermentation with aerobic TCA-cycle oxidation.
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                    <button onClick={startGlycolysis} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                        <Play size={15} />
                        Start Glycolysis
                    </button>
                    <button onClick={() => feedMatrix()} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                        <Flame size={15} />
                        Feed the Matrix
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Oxygen Toggle</div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['ON', 'OFF'] as OxygenMode[]).map((item) => (
                            <button key={item} onClick={() => { setOxygen(item); setStatus(item === 'ON' ? 'O2 is ON. Pyruvate can enter mitochondria for aerobic respiration.' : 'O2 is OFF. Pyruvate remains in cytoplasm and fermentation regenerates NAD+.'); }} className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${oxygen === item ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}>
                                O2 {item}
                            </button>
                        ))}
                    </div>
                </div>

                <SliderBlock label="Reaction Speed" value={`${speed}%`} minLabel="Slow NAD+ sparks" maxLabel="Fast pathway">
                    <input type="range" min="10" max="100" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value, 10))} className="w-full accent-emerald-600" />
                </SliderBlock>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Anaerobic Fate</div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['Yeast', 'Muscle Cell'] as FermentationMode[]).map((item) => (
                            <button key={item} onClick={() => setFermentationMode(item)} className={`rounded-xl border px-4 py-3 text-xs font-bold transition-all ${fermentationMode === item ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'}`}>
                                {item}
                            </button>
                        ))}
                    </div>
                    <button onClick={ferment} className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100 transition-all">
                        Run Fermentation
                    </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-800 mb-3 text-sm">Step-by-Step Workflow</h4>
                    <ol className="space-y-2 text-sm text-slate-600">
                        <StepItem number="1">Click <strong>Start Glycolysis</strong>. Glucose consumes 2 ATP to become activated.</StepItem>
                        <StepItem number="2">Watch the split into two pyruvates. Four ATP are made, giving net +2 ATP.</StepItem>
                        <StepItem number="3">Switch <strong>O2 OFF</strong>, select Yeast or Muscle Cell, and run fermentation.</StepItem>
                        <StepItem number="4">Switch <strong>O2 ON</strong>. Drag pyruvate into the mitochondrion or click Feed the Matrix.</StepItem>
                        <StepItem number="5">Watch the TCA wheel spin twice. CO2 reaches 6 after complete oxidation of one glucose.</StepItem>
                    </ol>
                </div>

                <button onClick={resetLab} className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                    <RefreshCcw size={15} />
                    Reset Lab
                </button>
            </div>
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />;
};

const RespirationScene = ({
    oxygen,
    glycolysisProgress,
    activated,
    pyruvateReady,
    pyruvatePositions,
    draggingPyruvate,
    pyruvateFed,
    tcaTurns,
    wheelAngle,
    fermented,
    fermentationMode,
    co2,
    onDragStart,
    onDragEnd,
    onDragMove
}: {
    oxygen: OxygenMode;
    glycolysisProgress: number;
    activated: boolean;
    pyruvateReady: boolean;
    pyruvatePositions: { x: number; y: number }[];
    draggingPyruvate: number | null;
    pyruvateFed: number;
    tcaTurns: number;
    wheelAngle: number;
    fermented: boolean;
    fermentationMode: FermentationMode;
    co2: number;
    onDragStart: (value: number) => void;
    onDragEnd: () => void;
    onDragMove: (clientX: number, clientY: number, target: SVGSVGElement) => void;
}) => {
    const glucoseX = 110 + glycolysisProgress * 1.45;
    return (
        <svg viewBox="0 0 900 520" className="w-full h-full select-none" onMouseMove={(event) => onDragMove(event.clientX, event.clientY, event.currentTarget)} onMouseUp={onDragEnd} onMouseLeave={onDragEnd} onTouchMove={(event) => { const touch = event.touches[0]; if (touch) onDragMove(touch.clientX, touch.clientY, event.currentTarget); }} onTouchEnd={onDragEnd}>
            <defs>
                <filter id="respGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <rect width="900" height="520" rx="26" fill="#f8fafc" />
            <rect x="34" y="48" width="420" height="410" rx="28" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
            <rect x="504" y="48" width="360" height="410" rx="28" fill="#dcfce7" stroke="#16a34a" strokeWidth="3" />
            <text x="70" y="86" className="fill-sky-900 text-[18px] font-bold">Cytoplasm: Glycolysis / Fermentation</text>
            <text x="560" y="86" className="fill-emerald-900 text-[18px] font-bold">Mitochondrial Matrix: TCA Cycle</text>

            <path d="M84 190 C180 136 300 150 394 190" fill="none" stroke="#0ea5e9" strokeWidth="5" strokeDasharray="8 8" />
            <text x="128" y="132" className="fill-slate-700 text-[14px] font-bold">EMP pathway progress</text>
            {!pyruvateReady && <GlucoseChain x={glucoseX} y={190} activated={activated} />}
            {pyruvateReady && (
                <>
                    {pyruvatePositions.map((position, index) => (
                        <g key={index}>
                            <PyruvateChain x={position.x} y={position.y} faded={index < pyruvateFed} dragging={draggingPyruvate === index} onMouseDown={() => onDragStart(index)} />
                        </g>
                    ))}
                    <text x="204" y="236" className="fill-slate-700 text-[14px] font-bold">Two 3C pyruvates</text>
                </>
            )}

            {oxygen === 'OFF' && pyruvateReady && (
                <g>
                    <rect x="84" y="354" width="310" height="62" rx="18" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
                    <text x="104" y="390" className="fill-amber-900 text-[16px] font-bold">{fermented ? (fermentationMode === 'Yeast' ? 'Ethanol + CO2 bubbles' : 'Lactic acid formed') : 'Anaerobic fate waiting'}</text>
                    {fermented && fermentationMode === 'Yeast' && Array.from({ length: 5 }).map((_, i) => <circle key={i} cx={320 + i * 14} cy={374 - (i % 2) * 14} r="7" fill="#94a3b8" opacity="0.75" />)}
                </g>
            )}

            <path d="M454 254 C484 254 492 254 518 254" stroke={oxygen === 'ON' ? '#16a34a' : '#94a3b8'} strokeWidth="7" strokeLinecap="round" strokeDasharray={oxygen === 'ON' ? '0' : '10 8'} />
            <text x="448" y="232" className="fill-slate-600 text-[13px] font-bold">O2 gate {oxygen}</text>

            <ellipse cx="684" cy="260" rx="142" ry="100" fill="#bbf7d0" stroke="#15803d" strokeWidth="5" />
            <ellipse cx="684" cy="260" rx="112" ry="74" fill="#ecfdf5" stroke="#22c55e" strokeWidth="2" strokeDasharray="7 6" />
            <g transform={`translate(684 260) rotate(${wheelAngle})`}>
                {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (Math.PI * 2 * i) / 8;
                    const x = Math.cos(angle) * 58;
                    const y = Math.sin(angle) * 58;
                    return <line key={i} x1="0" y1="0" x2={x} y2={y} stroke="#15803d" strokeWidth="3" />;
                })}
                <circle r="24" fill="#16a34a" />
            </g>
            <text x="632" y="393" className="fill-emerald-900 text-[15px] font-bold">Matrix wheel turns: {tcaTurns}/2</text>
            {Array.from({ length: Math.min(co2, 6) }).map((_, i) => <circle key={i} cx={560 + i * 34} cy={126 + (i % 2) * 24} r="12" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />)}
            {pyruvateFed > tcaTurns && <text x="610" y="156" className="fill-blue-700 text-[14px] font-bold">NADH sparks + CO2 puffs</text>}
        </svg>
    );
};

const GlucoseChain = ({ x, y, activated }: { x: number; y: number; activated: boolean }) => (
    <g>
        {Array.from({ length: 6 }).map((_, index) => <circle key={index} cx={x + index * 24} cy={y} r="14" fill={activated ? '#facc15' : '#a7f3d0'} stroke="#047857" strokeWidth="2" />)}
        <text x={x + 14} y={y - 28} className="fill-slate-700 text-[13px] font-bold">{activated ? 'Activated glucose: 2 ATP used' : '6C Glucose'}</text>
    </g>
);

const PyruvateChain = ({ x, y, faded, dragging, onMouseDown }: { x: number; y: number; faded: boolean; dragging: boolean; onMouseDown: () => void }) => (
    <g onMouseDown={onMouseDown} onTouchStart={onMouseDown} className="cursor-grab" opacity={faded ? 0.35 : 1} filter={dragging ? 'url(#respGlow)' : undefined}>
        {Array.from({ length: 3 }).map((_, index) => <circle key={index} cx={x + index * 24} cy={y} r="14" fill="#38bdf8" stroke="#0369a1" strokeWidth="2" />)}
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
        <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-800">{icon}{title}</div>
        <div className="text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
);

const Meter = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="mb-3 last:mb-0">
        <div className="mb-1 flex justify-between text-xs font-bold text-slate-500"><span>{label}</span><span>{Math.round(value)}%</span></div>
        <div className="h-3 rounded-full bg-slate-200 overflow-hidden"><div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
    </div>
);

const SliderBlock = ({ label, value, minLabel, maxLabel, children }: { label: string; value: string; minLabel: string; maxLabel: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between"><div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</div><div className="text-xs font-bold text-slate-800">{value}</div></div>
        {children}
        <div className="flex justify-between text-[11px] text-slate-400"><span>{minLabel}</span><span>{maxLabel}</span></div>
    </div>
);

const StepItem = ({ number, children }: { number: string; children: React.ReactNode }) => (
    <li className="flex items-start gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">{number}</span><span>{children}</span></li>
);

export default RespirationInPlantsLab;
