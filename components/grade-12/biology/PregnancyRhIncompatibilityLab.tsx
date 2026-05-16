import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Baby, Droplets, HeartPulse, Play, RefreshCcw, ShieldCheck, Syringe } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type RhType = 'Rh-ve' | 'Rh+ve';

interface PregnancyRhIncompatibilityLabProps {
    topic: any;
    onExit: () => void;
}

interface LeakedCell {
    id: number;
    x: number;
    y: number;
    neutralized: boolean;
}

const PregnancyRhIncompatibilityLab: React.FC<PregnancyRhIncompatibilityLabProps> = ({ topic, onExit }) => {
    const [progesterone, setProgesterone] = useState(82);
    const [motherRh, setMotherRh] = useState<RhType>('Rh-ve');
    const [fetusRh, setFetusRh] = useState<RhType>('Rh+ve');
    const [deliveryActive, setDeliveryActive] = useState(false);
    const [barrierGap, setBarrierGap] = useState(false);
    const [leakedCells, setLeakedCells] = useState<LeakedCell[]>([]);
    const [antibodyLevel, setAntibodyLevel] = useState(0);
    const [sensitized, setSensitized] = useState(false);
    const [secondPregnancy, setSecondPregnancy] = useState(false);
    const [fetalRbcHealth, setFetalRbcHealth] = useState(100);
    const [antiRhGiven, setAntiRhGiven] = useState(false);
    const [tick, setTick] = useState(0);
    const [cellId, setCellId] = useState(1);
    const [status, setStatus] = useState('Set progesterone high to maintain the uterus, then set up an Rh-ve mother with an Rh+ve foetus.');

    const incompatible = motherRh === 'Rh-ve' && fetusRh === 'Rh+ve';
    const pregnancyStable = progesterone >= 55;

    useEffect(() => {
        const interval = window.setInterval(() => {
            setTick((value) => value + 1);

            if (leakedCells.some((cell) => !cell.neutralized) && incompatible && !antiRhGiven) {
                setAntibodyLevel((value) => {
                    const next = Math.min(100, value + 1.2);
                    if (next > 25) setSensitized(true);
                    return next;
                });
            }

            if (secondPregnancy && sensitized && incompatible && !antiRhGiven) {
                setFetalRbcHealth((value) => Math.max(0, value - 0.75));
            }
        }, 180);

        return () => window.clearInterval(interval);
    }, [antiRhGiven, incompatible, leakedCells, secondPregnancy, sensitized]);

    const uterineMessage = useMemo(() => {
        if (progesterone >= 75) return 'Uterine lining is thick, warm, and stable. Pregnancy is chemically supported.';
        if (progesterone >= 55) return 'Pregnancy is supported, but the uterus is less stable than the ideal state.';
        return 'Pregnancy Unsupported: low progesterone makes the uterine chamber unstable.';
    }, [progesterone]);

    const rhMessage = useMemo(() => {
        if (!incompatible) return 'No Rh incompatibility setup. Maternal and foetal Rh condition is not dangerous in this model.';
        if (antiRhGiven) return 'Anti-Rh injection neutralized leaked Rh+ cells. Maternal immune memory is prevented in this simulation.';
        if (secondPregnancy && sensitized) return 'Second pregnancy risk: maternal Rh antibodies can cross the placenta and damage foetal RBCs.';
        if (sensitized) return 'Mother is sensitized. Antibodies have formed after exposure to Rh+ foetal RBCs.';
        if (leakedCells.length > 0) return 'Foetal Rh+ cells leaked into maternal blood. Watch for antibody formation.';
        return 'First pregnancy: blood streams are separated by the placental barrier.';
    }, [antiRhGiven, incompatible, leakedCells.length, secondPregnancy, sensitized]);

    const startDelivery = () => {
        setDeliveryActive(true);
        setBarrierGap(true);
        setStatus('Delivery pressure started. The placental barrier has temporary gaps.');
    };

    const exposeCells = () => {
        if (!deliveryActive || !barrierGap) {
            setStatus('Start Delivery first. Exposure happens when delivery pressure opens temporary gaps.');
            return;
        }

        if (!incompatible) {
            setStatus('Exposure occurred, but this Rh setup is not the risky Rh-ve mother / Rh+ve foetus combination.');
            return;
        }

        const newCells = Array.from({ length: 5 }).map((_, index) => ({
            id: cellId + index,
            x: 508 + index * 16,
            y: 205 + (index % 2) * 18,
            neutralized: false
        }));
        setCellId((id) => id + 5);
        setLeakedCells((cells) => [...cells, ...newCells]);
        setStatus('Five Rh+ foetal RBCs crossed into maternal blood. Maternal antibodies begin forming unless anti-Rh is given.');
    };

    const giveAntiRh = () => {
        setAntiRhGiven(true);
        setLeakedCells((cells) => cells.map((cell) => ({ ...cell, neutralized: true })));
        setAntibodyLevel(0);
        setSensitized(false);
        setStatus('Anti-Rh injection neutralized leaked Rh+ foetal cells before immune memory formed.');
    };

    const startSecondPregnancy = () => {
        setSecondPregnancy(true);
        setDeliveryActive(false);
        setBarrierGap(false);
        setStatus(sensitized
            ? 'Pregnancy #2 started. Existing antibodies can now cross the placenta and attack Rh+ foetal RBCs.'
            : 'Pregnancy #2 started. No maternal Rh antibodies are present, so foetal RBCs are safe in this model.');
    };

    const resetLab = () => {
        setProgesterone(82);
        setMotherRh('Rh-ve');
        setFetusRh('Rh+ve');
        setDeliveryActive(false);
        setBarrierGap(false);
        setLeakedCells([]);
        setAntibodyLevel(0);
        setSensitized(false);
        setSecondPregnancy(false);
        setFetalRbcHealth(100);
        setAntiRhGiven(false);
        setTick(0);
        setCellId(1);
        setStatus('Set progesterone high to maintain the uterus, then set up an Rh-ve mother with an Rh+ve foetus.');
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:p-4 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-3 min-h-full">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-[460px]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Uterine Chamber</div>
                            <div className="text-xs text-slate-500">Progesterone maintains pregnancy state</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${pregnancyStable ? 'bg-emerald-600' : 'bg-red-600'}`}>
                            {pregnancyStable ? 'Supported' : 'Unsupported'}
                        </span>
                    </div>
                    <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-2 flex-1 min-h-[360px]">
                        <UterusScene progesterone={progesterone} stable={pregnancyStable} tick={tick} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-3">
                        <MetricCard label="Progesterone" value={`${progesterone}%`} tone={pregnancyStable ? 'text-emerald-700' : 'text-red-700'} />
                        <MetricCard label="Uterus" value={pregnancyStable ? 'Stable' : 'Unstable'} tone={pregnancyStable ? 'text-emerald-700' : 'text-red-700'} />
                        <MetricCard label="Oxytocin Role" value="Birth contractions" tone="text-slate-700" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-[460px]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Placental Border</div>
                            <div className="text-xs text-slate-500">Separated blood streams and Rh memory</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${incompatible ? 'bg-amber-600' : 'bg-slate-600'}`}>
                            {incompatible ? 'Rh Risk Setup' : 'No Rh Risk'}
                        </span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-red-50 p-2 flex-1 min-h-[360px]">
                        <PlacentaScene
                            motherRh={motherRh}
                            fetusRh={fetusRh}
                            barrierGap={barrierGap}
                            deliveryActive={deliveryActive}
                            leakedCells={leakedCells}
                            antibodyLevel={antibodyLevel}
                            secondPregnancy={secondPregnancy}
                            fetalRbcHealth={fetalRbcHealth}
                            antiRhGiven={antiRhGiven}
                            tick={tick}
                        />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 mt-3">
                        <MetricCard label="Antibodies" value={`${Math.round(antibodyLevel)}%`} tone={antibodyLevel > 20 ? 'text-amber-700' : 'text-slate-700'} />
                        <MetricCard label="Foetal RBC" value={`${Math.round(fetalRbcHealth)}%`} tone={fetalRbcHealth > 70 ? 'text-emerald-700' : 'text-red-700'} />
                        <MetricCard label="Pregnancy" value={secondPregnancy ? '#2' : '#1'} tone="text-slate-700" />
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mt-3">
                <InfoCard title="Current Observation" icon={<HeartPulse size={16} className="text-rose-600" />}>
                    <p>{status}</p>
                </InfoCard>
                <InfoCard title="Pregnancy Maintenance" icon={<Baby size={16} className="text-emerald-600" />}>
                    <p>{uterineMessage}</p>
                </InfoCard>
                <InfoCard title="Rh Logic" icon={<ShieldCheck size={16} className="text-blue-600" />}>
                    <p>{rhMessage}</p>
                </InfoCard>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-slate-800">
                    <strong>Experiment Goal:</strong> Maintain pregnancy with progesterone, then observe how Rh exposure during delivery can create immune memory for a later pregnancy.
                </div>

                <SliderBlock label="Progesterone Slider" value={`${progesterone}%`} minLabel="Unsupported" maxLabel="Stable">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progesterone}
                        onChange={(e) => {
                            const next = parseInt(e.target.value, 10);
                            setProgesterone(next);
                            setStatus(next >= 55 ? 'Progesterone is supporting the uterine lining.' : 'Pregnancy Unsupported: progesterone is below the stable level.');
                        }}
                        className="w-full accent-rose-600"
                    />
                </SliderBlock>

                <div className="grid sm:grid-cols-2 gap-4">
                    <RhSelector title="Mother Blood Type" value={motherRh} onChange={setMotherRh} />
                    <RhSelector title="Foetus Blood Type" value={fetusRh} onChange={setFetusRh} />
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                    <button onClick={startDelivery} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                        <Play size={15} />
                        Start Delivery
                    </button>
                    <button onClick={exposeCells} className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                        <Droplets size={15} />
                        Exposure: Leak 5 Cells
                    </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-2">
                    <button onClick={giveAntiRh} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                        <Syringe size={15} />
                        Anti-Rh Injection
                    </button>
                    <button onClick={startSecondPregnancy} className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-800 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                        <Baby size={15} />
                        Start Pregnancy #2
                    </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-bold text-slate-800 mb-3 text-sm">Step-by-Step Workflow</h4>
                    <ol className="space-y-2 text-sm text-slate-600">
                        <StepItem number="1">Slide <strong>Progesterone</strong> to 100%. Observe the uterus become stable and green.</StepItem>
                        <StepItem number="2">Set mother to <strong>Rh-ve</strong> and foetus to <strong>Rh+ve</strong>. Blood streams remain separated.</StepItem>
                        <StepItem number="3">Click <strong>Start Delivery</strong>, then <strong>Exposure</strong> to move five red foetal cells into maternal blood.</StepItem>
                        <StepItem number="4">Watch yellow antibodies form on the maternal side after exposure.</StepItem>
                        <StepItem number="5">Start <strong>Pregnancy #2</strong>. Maternal antibodies cross and damage foetal RBCs unless anti-Rh was given.</StepItem>
                    </ol>
                </div>

                <button onClick={resetLab} className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
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

const UterusScene = ({ progesterone, stable, tick }: { progesterone: number; stable: boolean; tick: number }) => {
    const pulse = 1 + Math.sin(tick / 5) * 0.02;
    const wall = 16 + progesterone * 0.28;
    return (
        <svg viewBox="0 0 520 360" className="w-full h-full">
            <rect width="520" height="360" rx="24" fill="#fff1f2" />
            <path d="M118 82 C170 36 224 92 260 120 C296 92 350 36 402 82 C438 116 418 176 368 214 C332 242 304 274 260 312 C216 274 188 242 152 214 C102 176 82 116 118 82Z" fill={stable ? '#fecdd3' : '#fee2e2'} stroke={stable ? '#16a34a' : '#dc2626'} strokeWidth={stable ? 8 : 5} transform={`translate(${260 - 260 * pulse} ${180 - 180 * pulse}) scale(${pulse})`} />
            <path d="M164 110 C206 92 226 132 260 154 C294 132 314 92 356 110 C382 126 382 164 350 188 C318 210 296 236 260 264 C224 236 202 210 170 188 C138 164 138 126 164 110Z" fill={stable ? '#fb7185' : '#fca5a5'} opacity="0.72" />
            <circle cx="260" cy="188" r="42" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" opacity={stable ? 0.95 : 0.45} />
            <text x="216" y="194" className="fill-amber-900 text-[15px] font-bold">Foetus</text>
            {!stable && (
                <>
                    <text x="130" y="42" className="fill-red-700 text-[18px] font-bold">Pregnancy Unsupported</text>
                    <path d="M98 248 L126 220 M126 248 L98 220 M386 248 L414 220 M414 248 L386 220" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
                </>
            )}
            {stable && <text x="132" y="42" className="fill-emerald-700 text-[18px] font-bold">Progesterone support active</text>}
            <rect x="122" y="318" width="276" height="14" rx="7" fill="#fecdd3" />
            <rect x="122" y="318" width={progesterone * 2.76} height="14" rx="7" fill={stable ? '#22c55e' : '#ef4444'} />
            <text x="178" y="306" className="fill-slate-700 text-[13px] font-bold">Progesterone Meter</text>
        </svg>
    );
};

const PlacentaScene = ({
    motherRh,
    fetusRh,
    barrierGap,
    deliveryActive,
    leakedCells,
    antibodyLevel,
    secondPregnancy,
    fetalRbcHealth,
    antiRhGiven,
    tick
}: {
    motherRh: RhType;
    fetusRh: RhType;
    barrierGap: boolean;
    deliveryActive: boolean;
    leakedCells: LeakedCell[];
    antibodyLevel: number;
    secondPregnancy: boolean;
    fetalRbcHealth: number;
    antiRhGiven: boolean;
    tick: number;
}) => {
    const offset = (tick * 5) % 180;
    const antibodies = Math.round(antibodyLevel / 14);
    const fetalPopCount = secondPregnancy && antibodyLevel > 20 && !antiRhGiven ? Math.max(0, Math.round((100 - fetalRbcHealth) / 12)) : 0;

    return (
        <svg viewBox="0 0 620 360" className="w-full h-full">
            <rect width="620" height="360" rx="24" fill="#f8fafc" />
            <rect x="34" y="58" width="250" height="236" rx="22" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
            <rect x="336" y="58" width="250" height="236" rx="22" fill="#fee2e2" stroke="#dc2626" strokeWidth="3" />
            <text x="74" y="40" className="fill-blue-900 text-[17px] font-bold">Maternal Area ({motherRh})</text>
            <text x="390" y="40" className="fill-red-900 text-[17px] font-bold">Foetal Area ({fetusRh})</text>

            <rect x="294" y="46" width="32" height="260" rx="16" fill="#ecfeff" stroke="#06b6d4" strokeWidth="3" opacity="0.88" />
            {barrierGap && (
                <>
                    <rect x="292" y="128" width="36" height="34" rx="8" fill="#fff7ed" stroke="#f97316" strokeWidth="3" />
                    <rect x="292" y="204" width="36" height="30" rx="8" fill="#fff7ed" stroke="#f97316" strokeWidth="3" />
                </>
            )}
            <text x="248" y="324" className="fill-cyan-900 text-[13px] font-bold">Placental barrier</text>

            {Array.from({ length: 8 }).map((_, index) => (
                <circle key={`m-${index}`} cx={72 + ((index * 34 + offset) % 190)} cy={92 + (index % 4) * 42} r="12" fill="#2563eb" opacity="0.85" />
            ))}
            {Array.from({ length: 8 }).map((_, index) => (
                <circle key={`f-${index}`} cx={374 + ((index * 36 + offset) % 178)} cy={92 + (index % 4) * 42} r="12" fill={index < fetalPopCount ? '#fecaca' : '#ef4444'} stroke={index < fetalPopCount ? '#991b1b' : 'none'} strokeWidth="3" opacity={index < fetalPopCount ? 0.45 : 0.9} />
            ))}

            {leakedCells.map((cell) => (
                <g key={cell.id}>
                    <circle cx={cell.x - (cell.neutralized ? 78 : 150)} cy={cell.y} r="12" fill={cell.neutralized ? '#fca5a5' : '#ef4444'} stroke={cell.neutralized ? '#22c55e' : '#991b1b'} strokeWidth="3" opacity={cell.neutralized ? 0.45 : 0.95} />
                    {cell.neutralized && <path d={`M${cell.x - 86} ${cell.y} L${cell.x - 70} ${cell.y}`} stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />}
                </g>
            ))}

            {Array.from({ length: antibodies }).map((_, index) => {
                const x = 76 + (index % 4) * 44;
                const y = 222 + Math.floor(index / 4) * 30;
                return <g key={`a-${index}`}><Antibody x={x} y={y} /></g>;
            })}

            {secondPregnancy && antibodyLevel > 20 && !antiRhGiven && Array.from({ length: 5 }).map((_, index) => {
                const x = 304 + index * 42;
                const y = 132 + (index % 2) * 54;
                return <g key={`cross-${index}`}><Antibody x={x} y={y} /></g>;
            })}

            {deliveryActive && <text x="212" y="18" className="fill-orange-700 text-[15px] font-bold">Delivery pressure: temporary barrier gaps</text>}
            {antiRhGiven && <text x="70" y="318" className="fill-emerald-700 text-[15px] font-bold">Anti-Rh cleanup active</text>}
            {secondPregnancy && !antiRhGiven && antibodyLevel > 20 && <text x="340" y="318" className="fill-red-700 text-[15px] font-bold">Antibodies crossing in pregnancy #2</text>}
        </svg>
    );
};

const Antibody = ({ x, y }: { x: number; y: number }) => (
    <g transform={`translate(${x} ${y})`} stroke="#eab308" strokeWidth="5" strokeLinecap="round">
        <path d="M0 0 L0 18" />
        <path d="M0 0 L-12 -12" />
        <path d="M0 0 L12 -12" />
    </g>
);

const RhSelector = ({ title, value, onChange }: { title: string; value: RhType; onChange: (value: RhType) => void }) => (
    <div className="space-y-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</div>
        <div className="grid grid-cols-2 gap-2">
            {(['Rh-ve', 'Rh+ve'] as RhType[]).map((item) => (
                <button
                    key={item}
                    onClick={() => onChange(item)}
                    className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${value === item ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'}`}
                >
                    {item}
                </button>
            ))}
        </div>
    </div>
);

const MetricCard = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
        <div className={`text-sm font-bold ${tone}`}>{value}</div>
    </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

export default PregnancyRhIncompatibilityLab;
