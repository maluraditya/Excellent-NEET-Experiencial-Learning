import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Brain, Gauge, RefreshCcw, TimerReset, Venus, Mars, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type SystemType = 'Male' | 'Female';
type HormoneType = 'FSH' | 'LH';

interface GametogenesisHormonalRegulationLabProps {
    topic: any;
    onExit: () => void;
}

interface HormoneParticle {
    id: number;
    type: HormoneType;
    progress: number;
}

const GametogenesisHormonalRegulationLab: React.FC<GametogenesisHormonalRegulationLabProps> = ({ topic, onExit }) => {
    const [system, setSystem] = useState<SystemType>('Male');
    const [particles, setParticles] = useState<HormoneParticle[]>([]);
    const [particleId, setParticleId] = useState(1);
    const [timeSpeed, setTimeSpeed] = useState(45);
    const [cycleDay, setCycleDay] = useState(1);
    const [fshSignal, setFshSignal] = useState(0);
    const [lhSignal, setLhSignal] = useState(0);
    const [androgen, setAndrogen] = useState(10);
    const [estrogen, setEstrogen] = useState(12);
    const [progesterone, setProgesterone] = useState(6);
    const [spermProgress, setSpermProgress] = useState(0);
    const [follicleGrowth, setFollicleGrowth] = useState(16);
    const [ovulated, setOvulated] = useState(false);
    const [status, setStatus] = useState('Select a system, then release FSH or LH from the pituitary.');

    const spermActive = system === 'Male' && fshSignal > 18 && androgen > 35;
    const ovulationReady = system === 'Female' && estrogen > 55 && follicleGrowth > 62;

    useEffect(() => {
        const interval = window.setInterval(() => {
            const step = 1.3 + timeSpeed / 30;

            setParticles((items) => items
                .map((item) => ({ ...item, progress: Math.min(100, item.progress + step) }))
                .filter((item) => {
                    if (item.progress < 100) return true;
                    applyHormoneArrival(item.type);
                    return false;
                }));

            setFshSignal((value) => Math.max(0, value - 0.7));
            setLhSignal((value) => Math.max(0, value - 0.8));

            if (system === 'Male') {
                setAndrogen((value) => clamp(value + (lhSignal > 15 ? 0.9 : -0.25), 0, 100));
                setSpermProgress((value) => clamp(value + (spermActive ? 1.15 : -0.35), 0, 100));
            } else {
                setFollicleGrowth((value) => clamp(value + (fshSignal > 15 && !ovulated ? 0.9 : -0.16), 8, 100));
                setEstrogen((value) => clamp(value + (follicleGrowth > 28 && !ovulated ? 0.55 : -0.2), 0, 100));
                setProgesterone((value) => clamp(value + (ovulated ? 0.75 : -0.15), 0, 100));
            }
        }, 160);

        return () => window.clearInterval(interval);
    }, [follicleGrowth, fshSignal, lhSignal, ovulated, spermActive, system, timeSpeed]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCycleDay((day) => {
                const next = day + (timeSpeed > 70 ? 2 : 1);
                return next > 28 ? 1 : next;
            });
        }, 1000);
        return () => window.clearInterval(interval);
    }, [timeSpeed]);

    const applyHormoneArrival = (type: HormoneType) => {
        if (type === 'LH') {
            setLhSignal((value) => clamp(value + 34, 0, 100));
            if (system === 'Male') {
                setAndrogen((value) => clamp(value + 20, 0, 100));
                setStatus('LH reached the testis. Leydig cells glow and release androgens.');
            } else {
                if (ovulationReady) {
                    setOvulated(true);
                    setFollicleGrowth(72);
                    setProgesterone((value) => clamp(value + 28, 0, 100));
                    setStatus('LH surge reached the mature follicle. Ovulation occurred and corpus luteum activity begins.');
                } else {
                    setStatus('LH reached the ovary, but the follicle is not mature enough for ovulation yet. Build estrogen with FSH first.');
                }
            }
        } else {
            setFshSignal((value) => clamp(value + 34, 0, 100));
            if (system === 'Male') {
                setStatus('FSH reached the seminiferous tubules. With androgens, it supports spermatogenesis.');
            } else {
                setFollicleGrowth((value) => clamp(value + 16, 0, 100));
                setEstrogen((value) => clamp(value + 12, 0, 100));
                setStatus('FSH reached the ovary. Follicles grow and estrogen rises.');
            }
        }
    };

    const releaseHormone = (type: HormoneType) => {
        setParticles((items) => [...items, { id: particleId, type, progress: 0 }]);
        setParticleId((id) => id + 1);
        setStatus(`${type} released from the pituitary and is travelling through the hormone highway.`);
    };

    const switchSystem = (next: SystemType) => {
        setSystem(next);
        setParticles([]);
        setFshSignal(0);
        setLhSignal(0);
        setAndrogen(next === 'Male' ? 10 : 0);
        setEstrogen(next === 'Female' ? 12 : 0);
        setProgesterone(next === 'Female' ? 6 : 0);
        setSpermProgress(0);
        setFollicleGrowth(16);
        setOvulated(false);
        setStatus(next === 'Male' ? 'Male system selected. Testis is inactive until LH and FSH arrive.' : 'Female system selected. Release FSH to mature follicles, then use an LH surge for ovulation.');
    };

    const resetLab = () => {
        switchSystem('Male');
        setTimeSpeed(45);
        setCycleDay(1);
        setStatus('Select a system, then release FSH or LH from the pituitary.');
    };

    const outcomeText = useMemo(() => {
        if (system === 'Male') {
            if (spermActive) return 'FSH and androgens are both present. Sperm production is active in seminiferous tubules.';
            if (androgen > 35) return 'Androgens are available, but FSH support is still needed for strong spermatogenesis.';
            if (fshSignal > 18) return 'FSH has arrived, but Leydig cells need LH to raise androgen levels.';
            return 'No strong gonadotrophin support yet. Sperm production remains low.';
        }
        if (ovulated) return 'Ovulation has occurred. The ruptured follicle behaves like corpus luteum and progesterone rises.';
        if (ovulationReady) return 'Follicle is mature and estrogen is high. A strong LH pulse can trigger ovulation.';
        if (fshSignal > 18) return 'FSH is growing the follicle. Estrogen is rising toward the ovulation-ready level.';
        return 'Follicles stay small without FSH support.';
    }, [androgen, fshSignal, ovulated, ovulationReady, spermActive, system]);

    const simulationCombo = (
        <div className="w-full h-full min-h-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-3 min-h-full">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-[460px]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Brain-to-Gonad Hormone Highway</div>
                            <div className="text-xs text-slate-500">Pituitary signals controlling gamete production</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${system === 'Male' ? 'bg-blue-600' : 'bg-pink-600'}`}>
                            {system} System
                        </span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-2 flex-1 min-h-[380px]">
                        <HormoneScene
                            system={system}
                            particles={particles}
                            fshSignal={fshSignal}
                            lhSignal={lhSignal}
                            androgen={androgen}
                            estrogen={estrogen}
                            progesterone={progesterone}
                            spermProgress={spermProgress}
                            follicleGrowth={follicleGrowth}
                            ovulated={ovulated}
                            cycleDay={cycleDay}
                        />
                    </div>

                    <div className="grid sm:grid-cols-4 gap-2 mt-3">
                        <MetricCard label="FSH Signal" value={`${Math.round(fshSignal)}%`} tone="text-blue-700" />
                        <MetricCard label="LH Signal" value={`${Math.round(lhSignal)}%`} tone="text-rose-700" />
                        <MetricCard label={system === 'Male' ? 'Sperm Count' : 'Follicle'} value={`${Math.round(system === 'Male' ? spermProgress : follicleGrowth)}%`} tone="text-emerald-700" />
                        <MetricCard label="Cycle Day" value={`${cycleDay}/28`} tone="text-slate-700" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-3">
                    <InfoCard title="Current Observation" icon={<Activity size={16} className="text-emerald-600" />}>
                        <p>{status}</p>
                    </InfoCard>
                    <InfoCard title="Scientific Logic" icon={<Brain size={16} className="text-indigo-600" />}>
                        <p>{outcomeText}</p>
                    </InfoCard>
                    <InfoCard title="Hormone Meters" icon={<Gauge size={16} className="text-amber-600" />}>
                        <Meter label="Androgen" value={system === 'Male' ? androgen : 0} color="bg-emerald-500" />
                        <Meter label="Estrogen" value={system === 'Female' ? estrogen : 0} color="bg-pink-500" />
                        <Meter label="Progesterone" value={system === 'Female' ? progesterone : 0} color="bg-violet-500" />
                    </InfoCard>
                </div>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-slate-800">
                    <strong>Experiment Goal:</strong> Release FSH and LH from the pituitary and observe how the testis or ovary responds.
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gender Toggle</div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => switchSystem('Male')} className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${system === 'Male' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'}`}>
                            <Mars size={16} />
                            Male System
                        </button>
                        <button onClick={() => switchSystem('Female')} className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${system === 'Female' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300'}`}>
                            <Venus size={16} />
                            Female System
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hormone Release Buttons</div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => releaseHormone('FSH')} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                            <Zap size={15} />
                            Release FSH
                        </button>
                        <button onClick={() => releaseHormone('LH')} className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                            <Zap size={15} />
                            Release LH
                        </button>
                    </div>
                </div>

                <SliderBlock label="Time Dial" value={`${timeSpeed}%`} minLabel="Slow day" maxLabel="Fast cycle">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={timeSpeed}
                        onChange={(e) => setTimeSpeed(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-600"
                    />
                </SliderBlock>

                {system === 'Male' ? (
                    <SliderBlock label="Manual Androgen Level" value={`${Math.round(androgen)}%`} minLabel="Low" maxLabel="High">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={androgen}
                            onChange={(e) => {
                                setAndrogen(parseInt(e.target.value, 10));
                                setStatus('Manual androgen slider changed. Observe feedback on sperm production.');
                            }}
                            className="w-full accent-emerald-600"
                        />
                    </SliderBlock>
                ) : (
                    <SliderBlock label="Manual Estrogen Level" value={`${Math.round(estrogen)}%`} minLabel="Low" maxLabel="High">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={estrogen}
                            onChange={(e) => {
                                setEstrogen(parseInt(e.target.value, 10));
                                setStatus('Manual estrogen slider changed. High estrogen prepares the system for an LH-triggered ovulation.');
                            }}
                            className="w-full accent-pink-600"
                        />
                    </SliderBlock>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-800 mb-3 text-sm">Step-by-Step Workflow</h4>
                    <ol className="space-y-2 text-sm text-slate-600">
                        <StepItem number="1">Select <strong>Male System</strong>. Observe inactive seminiferous tubules.</StepItem>
                        <StepItem number="2">Release <strong>LH</strong>. Watch red particles reach Leydig cells and raise androgen.</StepItem>
                        <StepItem number="3">Release <strong>FSH</strong>. With androgen present, sperm production begins to fill.</StepItem>
                        <StepItem number="4">Switch to <strong>Female System</strong>. Release FSH to grow follicles and raise estrogen.</StepItem>
                        <StepItem number="5">After estrogen is high, release a strong <strong>LH</strong> pulse to trigger ovulation.</StepItem>
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

const HormoneScene = ({
    system,
    particles,
    fshSignal,
    lhSignal,
    androgen,
    estrogen,
    progesterone,
    spermProgress,
    follicleGrowth,
    ovulated,
    cycleDay
}: {
    system: SystemType;
    particles: HormoneParticle[];
    fshSignal: number;
    lhSignal: number;
    androgen: number;
    estrogen: number;
    progesterone: number;
    spermProgress: number;
    follicleGrowth: number;
    ovulated: boolean;
    cycleDay: number;
}) => {
    const targetLabel = system === 'Male' ? 'Testis Factory' : 'Ovarian Gallery';
    const targetColor = system === 'Male' ? '#dbeafe' : '#fce7f3';

    return (
        <svg viewBox="0 0 900 560" className="w-full h-full">
            <defs>
                <filter id="hormoneGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <marker id="arrowHormone" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
                </marker>
            </defs>

            <rect width="900" height="560" rx="26" fill="#f8fafc" />

            <g transform="translate(80 40)">
                <rect width="250" height="128" rx="28" fill="#eef2ff" stroke="#6366f1" strokeWidth="3" />
                <path d="M64 74 C36 52 48 24 86 30 C103 6 152 11 160 42 C204 37 218 83 184 101 C157 129 104 119 84 101 C76 94 69 84 64 74Z" fill="#c7d2fe" stroke="#4338ca" strokeWidth="3" />
                <circle cx="184" cy="86" r={18 + (fshSignal + lhSignal) / 18} fill="#818cf8" opacity="0.75" filter="url(#hormoneGlow)" />
                <text x="28" y="28" className="fill-indigo-900 text-[16px] font-bold">Hypothalamus / Pituitary</text>
                <text x="70" y="118" className="fill-indigo-800 text-[13px] font-bold">Master endocrine control</text>
            </g>

            <path d="M210 176 C260 248 338 270 450 286 C574 304 668 336 722 397" fill="none" stroke="#94a3b8" strokeWidth="14" strokeLinecap="round" opacity="0.24" />
            <path d="M210 176 C260 248 338 270 450 286 C574 304 668 336 722 397" fill="none" stroke="#475569" strokeWidth="3" strokeDasharray="10 8" markerEnd="url(#arrowHormone)" />
            <text x="354" y="254" className="fill-slate-600 text-[15px] font-bold">Hormone Highway</text>

            {particles.map((particle) => {
                const position = pointOnHighway(particle.progress);
                const fill = particle.type === 'FSH' ? '#2563eb' : '#e11d48';
                return (
                    <g key={particle.id}>
                        <circle cx={position.x} cy={position.y} r="15" fill={fill} stroke="#ffffff" strokeWidth="4" filter="url(#hormoneGlow)" />
                        <text x={position.x - 12} y={position.y + 5} className="fill-white text-[11px] font-bold">{particle.type}</text>
                    </g>
                );
            })}

            <g transform="translate(585 342)">
                <rect width="255" height="170" rx="30" fill={targetColor} stroke={system === 'Male' ? '#2563eb' : '#db2777'} strokeWidth="3" />
                <text x="26" y="32" className="fill-slate-800 text-[18px] font-bold">{targetLabel}</text>
                {system === 'Male' ? (
                    <MaleGonad spermProgress={spermProgress} androgen={androgen} fshSignal={fshSignal} lhSignal={lhSignal} />
                ) : (
                    <FemaleGonad follicleGrowth={follicleGrowth} estrogen={estrogen} progesterone={progesterone} ovulated={ovulated} />
                )}
            </g>

            <g transform="translate(56 235)">
                <rect width="245" height="220" rx="24" fill="#ffffff" stroke="#cbd5e1" />
                <text x="22" y="34" className="fill-slate-800 text-[17px] font-bold">Hormone Signals</text>
                <MeterSvg x={24} y={58} label="FSH" value={fshSignal} color="#2563eb" />
                <MeterSvg x={24} y={112} label="LH" value={lhSignal} color="#e11d48" />
                <text x="24" y="186" className="fill-slate-500 text-[13px]">Cycle day / clock</text>
                <text x="132" y="187" className="fill-slate-900 text-[22px] font-bold">{cycleDay}</text>
                <TimerReset x={24} y={198} size={18} className="text-slate-500" />
                <text x="50" y="212" className="fill-slate-500 text-[12px]">Time dial affects visible cycle speed</text>
            </g>

            <g transform="translate(340 376)">
                <rect width="180" height="86" rx="20" fill="#ecfdf5" stroke="#10b981" />
                <text x="18" y="30" className="fill-emerald-900 text-[15px] font-bold">{system === 'Male' ? 'Sperm Production' : 'Ovum Readiness'}</text>
                <rect x="18" y="48" width="140" height="14" rx="7" fill="#d1fae5" />
                <rect x="18" y="48" width={(system === 'Male' ? spermProgress : follicleGrowth) * 1.4} height="14" rx="7" fill="#10b981" />
            </g>
        </svg>
    );
};

const MaleGonad = ({ spermProgress, androgen, fshSignal, lhSignal }: { spermProgress: number; androgen: number; fshSignal: number; lhSignal: number }) => (
    <g>
        <ellipse cx="80" cy="92" rx="52" ry="42" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="3" />
        <ellipse cx="174" cy="92" rx="52" ry="42" fill="#bfdbfe" stroke="#1d4ed8" strokeWidth="3" />
        <path d="M48 92 C78 58 111 128 139 92 C169 58 202 128 232 92" fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" opacity={0.45 + spermProgress / 180} />
        <circle cx="128" cy="88" r={12 + lhSignal / 10} fill="#22c55e" opacity={0.45 + androgen / 160} />
        <text x="92" y="132" className="fill-blue-900 text-[12px] font-bold">Seminiferous tubules</text>
        <text x="98" y="70" className="fill-emerald-900 text-[12px] font-bold">Leydig cells</text>
        {Array.from({ length: Math.round(spermProgress / 14) }).map((_, index) => (
            <path key={index} d={`M${48 + index * 22} 104 q10 -10 20 0 q-10 9 -20 0 l-14 10`} fill="none" stroke="#0f172a" strokeWidth="2" />
        ))}
        <text x="24" y="154" className="fill-slate-600 text-[11px]">FSH: {Math.round(fshSignal)}%</text>
        <text x="150" y="154" className="fill-slate-600 text-[11px]">Androgen: {Math.round(androgen)}%</text>
    </g>
);

const FemaleGonad = ({ follicleGrowth, estrogen, progesterone, ovulated }: { follicleGrowth: number; estrogen: number; progesterone: number; ovulated: boolean }) => {
    const follicleRadius = 18 + follicleGrowth * 0.34;
    return (
        <g>
            <ellipse cx="126" cy="93" rx="86" ry="58" fill="#fbcfe8" stroke="#be185d" strokeWidth="3" />
            <circle cx="80" cy="88" r="16" fill="#f9a8d4" stroke="#db2777" strokeWidth="2" />
            <circle cx="126" cy="88" r={follicleRadius} fill={ovulated ? '#fde68a' : '#f472b6'} stroke={ovulated ? '#d97706' : '#be185d'} strokeWidth="3" opacity="0.92" />
            <circle cx="126" cy="88" r="10" fill="#fff7ed" stroke="#fb7185" strokeWidth="2" />
            {ovulated && (
                <g>
                    <circle cx="214" cy="82" r="12" fill="#fff7ed" stroke="#db2777" strokeWidth="3" />
                    <path d="M190 86 C204 70 222 64 240 72" fill="none" stroke="#db2777" strokeWidth="4" strokeLinecap="round" />
                    <text x="182" y="124" className="fill-rose-900 text-[12px] font-bold">Ovum released</text>
                </g>
            )}
            <text x="68" y="152" className="fill-slate-600 text-[11px]">Estrogen: {Math.round(estrogen)}%</text>
            <text x="156" y="152" className="fill-slate-600 text-[11px]">Progesterone: {Math.round(progesterone)}%</text>
        </g>
    );
};

const MeterSvg = ({ x, y, label, value, color }: { x: number; y: number; label: string; value: number; color: string }) => (
    <g transform={`translate(${x} ${y})`}>
        <text x="0" y="0" className="fill-slate-600 text-[13px] font-bold">{label}</text>
        <rect x="0" y="12" width="190" height="13" rx="7" fill="#e2e8f0" />
        <rect x="0" y="12" width={Math.max(0, Math.min(190, value * 1.9))} height="13" rx="7" fill={color} />
        <text x="198" y="24" className="fill-slate-700 text-[12px] font-bold">{Math.round(value)}%</text>
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

const Meter = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="mb-3 last:mb-0">
        <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
            <span>{label}</span>
            <span>{Math.round(value)}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
            <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${clamp(value, 0, 100)}%` }} />
        </div>
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

const pointOnHighway = (progress: number) => {
    const t = clamp(progress, 0, 100) / 100;
    const x = 210 + (722 - 210) * t;
    const y = 176 + (397 - 176) * t + Math.sin(t * Math.PI) * 42;
    return { x, y };
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export default GametogenesisHormonalRegulationLab;
