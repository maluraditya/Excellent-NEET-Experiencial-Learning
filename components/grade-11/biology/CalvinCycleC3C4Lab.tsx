import React, { useMemo, useState } from 'react';
import { Activity, Gauge, Leaf, RefreshCcw, Sprout, Thermometer, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type PlantPathway = 'C3' | 'C4';
type TemperatureLevel = 25 | 35 | 40 | 45;
type OxygenLevel = 'Low' | 'Normal' | 'High';

interface CalvinCycleC3C4LabProps {
    topic: any;
    onExit: () => void;
}

const TEMP_OPTIONS: TemperatureLevel[] = [25, 35, 40, 45];
const OXYGEN_OPTIONS: OxygenLevel[] = ['Low', 'Normal', 'High'];

/* ─── derived simulation values ─── */
function useSimValues(pathway: PlantPathway, temperature: TemperatureLevel, oxygen: OxygenLevel, co2Pulse: number) {
    const heatStress = temperature >= 40;
    const oxygenStress = oxygen === 'High';
    const photorespirationRisk = pathway === 'C3' && (heatStress || oxygenStress);
    const sugarRate = pathway === 'C4'
        ? Math.min(10, co2Pulse + 4)
        : photorespirationRisk ? Math.max(1, co2Pulse - 2) : Math.min(8, co2Pulse + 2);
    const atpUse = pathway === 'C4' ? 7 : photorespirationRisk ? 6 : 5;
    const wasteRate = photorespirationRisk ? (oxygen === 'High' ? 6 : 4) : pathway === 'C4' ? 0 : 1;
    const yieldC3 = photorespirationRisk ? 42 : 76;
    const yieldC4 = heatStress ? 92 : 82;
    const yieldScore = pathway === 'C4' ? yieldC4 : yieldC3;
    // particle motion speed: faster at high temperature
    const particleDur = temperature === 45 ? 1.4 : temperature === 40 ? 1.9 : temperature === 35 ? 2.6 : 3.4;
    const o2Count = oxygen === 'High' ? 7 : oxygen === 'Normal' ? 4 : 2;
    return { heatStress, oxygenStress, photorespirationRisk, sugarRate, atpUse, wasteRate, yieldC3, yieldC4, yieldScore, particleDur, o2Count };
}

const CalvinCycleC3C4Lab: React.FC<CalvinCycleC3C4LabProps> = ({ topic, onExit }) => {
    const [pathway, setPathway] = useState<PlantPathway>('C3');
    const [temperature, setTemperature] = useState<TemperatureLevel>(25);
    const [oxygen, setOxygen] = useState<OxygenLevel>('Normal');
    const [co2Pulse, setCo2Pulse] = useState(3);

    const sim = useSimValues(pathway, temperature, oxygen, co2Pulse);

    const observation = useMemo(() => {
        if (pathway === 'C3' && sim.photorespirationRisk) {
            return 'C3 plant under heat/high O2: RuBisCO binds O2 instead of CO2. Photorespiration consumes ATP but produces no sugar — energy is wasted.';
        }
        if (pathway === 'C3') {
            return 'C3 plant at mild conditions: CO2 enters Calvin cycle directly. RuBisCO fixes CO2 + RuBP → 3-PGA, and G3P (sugar) is produced steadily.';
        }
        if (pathway === 'C4' && sim.heatStress) {
            return 'C4 plant in heat: PEPcase (mesophyll) captures CO2 first → C4 acid shuttled to bundle sheath → CO2 released near RuBisCO. No photorespiration!';
        }
        return 'C4 plant: CO2 fixed by PEPcase into C4 acid in mesophyll, then decarboxylated in bundle sheath. RuBisCO receives concentrated CO2 — efficient Calvin cycle.';
    }, [sim.heatStress, pathway, sim.photorespirationRisk]);

    const resetLab = () => { setPathway('C3'); setTemperature(25); setOxygen('Normal'); setCo2Pulse(3); };
    const addCo2 = () => setCo2Pulse(v => Math.min(6, v + 1));

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Thin header strip */}
            <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1 shrink-0">
                <div>
                    <div className="text-sm font-bold text-slate-900">C3–C4 Photosynthesis Lab</div>
                    <div className="text-[11px] text-slate-500">Calvin cycle · C4 CO₂ pump · Photorespiration</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold text-white shrink-0 ${pathway === 'C4' ? 'bg-emerald-600' : 'bg-sky-600'}`}>
                    {pathway} Plant
                </span>
            </div>

            {/* SVG takes all remaining height */}
            <div className="flex-1 min-h-0 px-2 pb-1">
                <C3C4SVG pathway={pathway} temperature={temperature} oxygen={oxygen} co2Pulse={co2Pulse} sim={sim} />
            </div>

            {/* Metric strip pinned at bottom */}
            <div className="grid grid-cols-4 gap-2 px-3 pb-2 shrink-0">
                <MetricCard label="Sugar Bin" value={`${sim.sugarRate}/10`} tone={sim.sugarRate >= 7 ? 'text-emerald-700' : 'text-amber-700'} />
                <MetricCard label="ATP Use" value={`${sim.atpUse} units`} tone="text-indigo-700" />
                <MetricCard label="Waste" value={`${sim.wasteRate}/6`} tone={sim.wasteRate > 3 ? 'text-red-700' : 'text-slate-700'} />
                <MetricCard label="Yield" value={`${sim.yieldScore}%`} tone={sim.yieldScore >= 80 ? 'text-emerald-700' : 'text-rose-700'} />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full overflow-y-auto max-h-[34vh]">
            <div className="p-3 flex flex-col gap-3">
                {/* Goal */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
                    <strong>Goal:</strong> Discover why C4 plants outperform C3 in heat by comparing CO₂ fixation strategies.
                </div>

                {/* Controls row: pathway + temp + O2 + buttons in a compact grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Plant</div>
                        <div className="grid grid-cols-2 gap-1">
                            {(['C3', 'C4'] as PlantPathway[]).map(item => (
                                <button key={item} onClick={() => setPathway(item)}
                                    className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${pathway === item ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'}`}>
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temp</span>
                            <span className="text-[10px] font-bold text-orange-700">{temperature}°C</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                            {TEMP_OPTIONS.map(item => (
                                <button key={item} onClick={() => setTemperature(item)}
                                    className={`rounded-lg border px-1 py-2 text-[10px] font-bold transition-all ${temperature === item ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-orange-50'}`}>
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">O₂</span>
                            <span className="text-[10px] font-bold text-rose-700">{oxygen}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            {OXYGEN_OPTIONS.map(item => (
                                <button key={item} onClick={() => setOxygen(item)}
                                    className={`rounded-lg border px-1 py-2 text-[10px] font-bold transition-all ${oxygen === item ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'}`}>
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 items-end">
                        <button onClick={addCo2} className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1">
                            <Sprout size={13} /> CO₂+
                        </button>
                        <button onClick={resetLab} className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1">
                            <RefreshCcw size={13} /> Reset
                        </button>
                    </div>
                </div>

                {/* Live observation */}
                <InfoCard title="Live Observation" icon={<Activity size={14} className="text-emerald-600" />}>
                    <p className="text-xs">{observation}</p>
                </InfoCard>

                {/* Steps */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                    <div className="text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-widest">Steps</div>
                    <ol className="text-[10px] text-slate-600 space-y-0.5 list-decimal list-inside">
                        <li><strong>C3</strong> at 25°C → CO₂ enters Calvin cycle → Sugar Bin fills.</li>
                        <li>Raise to <strong>40°C</strong> → red O₂ invades RuBisCO → photorespiration flashes.</li>
                        <li>Switch to <strong>C4</strong> at 40°C → PEPcase grabs CO₂ in mesophyll.</li>
                        <li>Follow CO₂ shuttle → Bundle Sheath (no O₂!) → RuBisCO at peak.</li>
                        <li>Compare <strong>Yield Meter</strong> — C4 wins in tropical heat.</li>
                    </ol>
                </div>

                {/* Info cards */}
                <InfoCard title="NCERT Key Points" icon={<Leaf size={14} className="text-lime-600" />}>
                    <ul className="text-xs list-disc list-inside space-y-0.5">
                        <li>C3: Calvin cycle in mesophyll. First product = 3-PGA.</li>
                        <li>C4: PEPcase → C4 acid → bundle sheath → Calvin cycle.</li>
                        <li>PEPcase has NO O₂ affinity — no photorespiration.</li>
                    </ul>
                </InfoCard>
                <InfoCard title="Memory Anchor" icon={<Gauge size={14} className="text-amber-600" />}>
                    <p className="text-xs">RuBisCO binds CO₂ or O₂. High temp → O₂ wins → photorespiration. C4 = CO₂ pump that keeps O₂ away from RuBisCO.</p>
                </InfoCard>
                <div className="grid grid-cols-2 gap-2">
                    <FactTile icon={<Thermometer size={13} className="text-orange-600" />} title="Heat Effect">
                        <span className="text-[10px]">Above 35°C O₂ beats CO₂ at RuBisCO → photorespiration in C3.</span>
                    </FactTile>
                    <FactTile icon={<Zap size={13} className="text-emerald-600" />} title="C4 Advantage">
                        <span className="text-[10px]">Bundle sheath is O₂-free. RuBisCO at peak efficiency.</span>
                    </FactTile>
                </div>
            </div>
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />;
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN SVG CANVAS  760 × 460
   Band 1:  y  0– 44   Title + header
   Band 2:  y 44– 80   Status bar (Temp label, O2 label, ATP battery, photorespiration flash)
   Band 3:  y 80–118   Atmosphere: CO2 cloud (left) + O2 cloud (right)
   Band 4:  y118–358   Cells
   Band 5:  y366–458   Meters: Sugar Bin + Yield Meter
═══════════════════════════════════════════════════════════════════════ */
const C3C4SVG = ({
    pathway, temperature, oxygen, co2Pulse, sim,
}: {
    pathway: PlantPathway;
    temperature: TemperatureLevel;
    oxygen: OxygenLevel;
    co2Pulse: number;
    sim: ReturnType<typeof useSimValues>;
}) => {
    const isC4 = pathway === 'C4';
    const { photorespirationRisk, particleDur, o2Count, sugarRate, wasteRate, atpUse, yieldC3, yieldC4 } = sim;

    // CO2 particle count
    const co2Count = co2Pulse + 2; // 4–8

    // ── ATP battery: height proportional to (10 - drain). Drain = atpUse scaled.
    const batteryFill = Math.max(4, 38 - atpUse * 4); // 38px max, shrinks with use

    return (
        <svg viewBox="0 0 760 460" className="w-full h-full" preserveAspectRatio="xMidYMid meet"
            aria-label="Calvin Cycle C3 C4 Pathway Simulation">

            {/* ── DEFS: arrows + gradients ── */}
            <defs>
                <marker id="arrG" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#15803d" />
                </marker>
                <marker id="arrB" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#0369a1" />
                </marker>
                <marker id="arrR" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#dc2626" />
                </marker>
                <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0fdf4" />
                    <stop offset="100%" stopColor="#dcfce7" />
                </linearGradient>
                <linearGradient id="sugarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="c4Grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="c3Grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* ── BACKGROUND ── */}
            <rect width="760" height="460" rx="16" fill="url(#bgGrad)" />

            {/* ════════════════ BAND 1 – TITLE ════════════════ */}
            <rect x="0" y="0" width="760" height="44" rx="16" fill="#166534" opacity="0.92" />
            <rect x="0" y="28" width="760" height="16" fill="#166534" opacity="0.92" />
            <text x="380" y="28" textAnchor="middle" fontSize="17" fontWeight="900" fill="#ffffff" letterSpacing="0.5">
                Calvin Cycle &amp; {pathway} Pathway — Interactive Simulation
            </text>

            {/* ════════════════ BAND 2 – STATUS BAR ════════════════ */}
            <rect x="8" y="48" width="744" height="30" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />

            {/* Temp label */}
            <text x="18" y="68" fontSize="12" fontWeight="800" fill={temperature >= 40 ? '#dc2626' : '#475569'}>
                🌡 Temp: {temperature}°C{temperature >= 40 ? '  ⚠ Heat Stress' : ''}
            </text>

            {/* O2 label */}
            <text x="240" y="68" fontSize="12" fontWeight="800" fill={oxygen === 'High' ? '#dc2626' : '#475569'}>
                O₂: {oxygen}{oxygen === 'High' ? '  ⚠ High O₂' : ''}
            </text>

            {/* ATP Battery (top-right of status bar) */}
            <AtpBattery x={560} y={48} fillHeight={batteryFill} atpUse={atpUse} photorespirationRisk={photorespirationRisk} />

            {/* ── Photorespiration flash banner (only when risk) ── */}
            {photorespirationRisk && (
                <g>
                    <rect x="430" y="50" width="120" height="24" rx="8" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5">
                        <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite" />
                    </rect>
                    <text x="490" y="66" textAnchor="middle" fontSize="10" fontWeight="900" fill="#991b1b">
                        ⚡ PHOTORESPIRATION
                        <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite" />
                    </text>
                </g>
            )}

            {/* ════════════════ BAND 3 – ATMOSPHERE ════════════════ */}
            {/* CO2 source cloud – left */}
            <rect x="8" y="82" width="148" height="34" rx="10" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.5" />
            <text x="82" y="101" textAnchor="middle" fontSize="11" fontWeight="800" fill="#14532d">☁ CO₂ Source (Atmosphere)</text>

            {/* O2 source cloud – right */}
            <rect x="604" y="82" width="148" height="34" rx="10" fill="#fecdd3" stroke="#dc2626" strokeWidth="1.5" />
            <text x="678" y="101" textAnchor="middle" fontSize="11" fontWeight="800" fill="#991b1b">☁ O₂ Source (Atmosphere)</text>

            {/* Pathway label – center */}
            <text x="380" y="100" textAnchor="middle" fontSize="12" fontWeight="800" fill={isC4 ? '#065f46' : '#0c4a6e'}>
                {isC4 ? '⟵ Mesophyll Cell ⟶   |   ⟵ Bundle Sheath Cell ⟶' : '⟵ Mesophyll Cell (C3) — Calvin Cycle runs here ⟶'}
            </text>

            {/* ════════════════ BAND 4 – CELLS ════════════════ */}
            {!isC4 ? (
                <C3Cell photorespirationRisk={photorespirationRisk} particleDur={particleDur} co2Count={co2Count} o2Count={o2Count} oxygen={oxygen} temperature={temperature} />
            ) : (
                <C4Cells particleDur={particleDur} co2Count={co2Count} o2Count={o2Count} />
            )}

            {/* ════════════════ BAND 5 – METERS ════════════════ */}
            {/* Sugar Bin */}
            <SugarBinMeter x={18} y={368} sugarRate={sugarRate} />

            {/* Waste indicator */}
            <WasteMeter x={18} y={418} wasteRate={wasteRate} />

            {/* Yield Meter – always visible dual bar */}
            <YieldMeter x={380} y={368} yieldC3={yieldC3} yieldC4={yieldC4} activePathway={pathway} />
        </svg>
    );
};

/* ════════════════════════════════════════════════════════
   C3 CELL  (x=18, y=118, w=724, h=238)
════════════════════════════════════════════════════════ */
const C3Cell = ({ photorespirationRisk, particleDur, co2Count, o2Count, oxygen, temperature }: {
    photorespirationRisk: boolean;
    particleDur: number;
    co2Count: number;
    o2Count: number;
    oxygen: OxygenLevel;
    temperature: TemperatureLevel;
}) => {
    // Calvin cycle center
    const cx = 362, cy = 237;
    // RuBisCO gear center (same as Calvin center)
    const gearColor = photorespirationRisk ? '#ef4444' : '#16a34a';
    const gearSpeed = photorespirationRisk ? `${particleDur * 1.8}s` : `${particleDur * 1.1}s`;

    return (
        <g>
            {/* Cell boundary */}
            <rect x="18" y="118" width="724" height="238" rx="22" fill="#dcfce7" stroke="#16a34a" strokeWidth="3" />
            <text x="362" y="140" textAnchor="middle" fontSize="14" fontWeight="900" fill="#166534">Mesophyll Cell</text>

            {/* ── Calvin Cycle wheel ── */}
            <CalvinCycleWheel cx={cx} cy={cy} r={76} risk={photorespirationRisk} gearColor={gearColor} gearSpeed={gearSpeed} />

            {/* RuBisCO label below cycle */}
            <rect x={cx - 52} y={cy + 82} width="104" height="22" rx="8" fill={photorespirationRisk ? '#fee2e2' : '#dcfce7'} stroke={gearColor} strokeWidth="1.5" />
            <text x={cx} y={cy + 97} textAnchor="middle" fontSize="11" fontWeight="900" fill={photorespirationRisk ? '#991b1b' : '#166534'}>
                RuBisCO {photorespirationRisk ? '⚠ O₂ binding!' : '✓ fixing CO₂'}
            </text>

            {/* ── CO2 animated particles → Calvin cycle ── */}
            {Array.from({ length: co2Count }).map((_, i) => (
                <React.Fragment key={`c3-co2-${i}`}>
                    <AnimatedCO2
                        path={`M ${72 + i * 14} 99 C ${72 + i * 14} 155 ${cx - 40 + i * 8} 185 ${cx - 20 + (i % 3) * 14} ${cy - 60}`}
                        dur={particleDur + i * 0.22}
                        begin={i * (particleDur / co2Count)}
                    />
                </React.Fragment>
            ))}

            {/* ── O2 animated particles – floating in cell; some redirected to RuBisCO on risk ── */}
            {Array.from({ length: o2Count }).map((_, i) => {
                const distracted = photorespirationRisk && i < Math.ceil(o2Count / 2);
                const floatX1 = 580 + (i % 4) * 30;
                const distractPath = `M ${floatX1} 99 C ${floatX1 - 20} 155 ${cx + 60} 200 ${cx + 30} ${cy - 30}`;
                const floatPath = `M ${floatX1} 99 C ${floatX1} 160 ${floatX1 - 20} 220 ${floatX1 + 10} 290 C ${floatX1 + 20} 320 ${floatX1 - 30} 280 ${floatX1 - 10} 200 C ${floatX1 - 30} 150 ${floatX1} 120 ${floatX1} 99`;
                return (
                    <React.Fragment key={`c3-o2-${i}`}>
                        <AnimatedO2
                            path={distracted ? distractPath : floatPath}
                            dur={particleDur * (distracted ? 0.9 : 1.6) + i * 0.18}
                            begin={i * 0.4}
                        />
                    </React.Fragment>
                );
            })}

            {/* Arrows: CO2 → cycle, Sugar → out */}
            <path d={`M ${cx - 76} ${cy} L ${cx - 6} ${cy}`} fill="none" stroke="#15803d" strokeWidth="2.5" markerEnd="url(#arrG)" />
            <text x={cx - 95} y={cy - 5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#166534">CO₂</text>
            <path d={`M ${cx} ${cy + 76} L ${cx} ${cy + 80}`} fill="none" stroke="#92400e" strokeWidth="2.5" markerEnd="url(#arrG)" strokeDasharray="4 2" />
            <text x={cx + 18} y={cy + 90} fontSize="10" fontWeight="800" fill="#92400e">Sugar</text>

            {/* RuBP regeneration label */}
            <text x={cx - 85} y={cy - 55} fontSize="10" fontWeight="700" fill="#0f766e">RuBP ↻</text>
            {/* 3-PGA label */}
            <text x={cx + 62} y={cy - 18} fontSize="10" fontWeight="700" fill="#0f766e">3-PGA</text>
            {/* G3P label */}
            <text x={cx + 62} y={cy + 30} fontSize="10" fontWeight="700" fill="#92400e">G3P</text>
        </g>
    );
};

/* ════════════════════════════════════════════════════════
   C4 CELLS  (Mesophyll x=18 w=330 + Bundle Sheath x=412 w=330)
════════════════════════════════════════════════════════ */
const C4Cells = ({ particleDur, co2Count, o2Count }: {
    particleDur: number;
    co2Count: number;
    o2Count: number;
}) => {
    const mesoCx = 183, mesoCy = 237; // PEPcase center in mesophyll
    const bsCx = 577, bsCy = 237;     // RuBisCO center in bundle sheath

    return (
        <g>
            {/* ── Mesophyll Cell ── */}
            <rect x="18" y="118" width="330" height="238" rx="22" fill="#dcfce7" stroke="#16a34a" strokeWidth="3" />
            <text x="183" y="140" textAnchor="middle" fontSize="13" fontWeight="900" fill="#166534">Mesophyll Cell</text>
            <text x="183" y="156" textAnchor="middle" fontSize="10" fontWeight="700" fill="#15803d">(CO₂ first fixed here)</text>

            {/* PEPcase Vacuum in mesophyll */}
            <PEPcaseVacuum cx={mesoCx} cy={mesoCy} />

            {/* CO2 particles → PEPcase */}
            {Array.from({ length: co2Count }).map((_, i) => (
                <React.Fragment key={`c4-co2-meso-${i}`}>
                    <AnimatedCO2
                        path={`M ${58 + i * 12} 99 C ${58 + i * 12} 155 ${mesoCx - 30 + i * 6} 190 ${mesoCx - 10 + (i % 3) * 10} ${mesoCy - 48}`}
                        dur={particleDur * 0.8 + i * 0.18}
                        begin={i * (particleDur / co2Count) * 0.7}
                    />
                </React.Fragment>
            ))}

            {/* O2 floats in mesophyll – BLOCKED from bundle sheath */}
            {Array.from({ length: o2Count }).map((_, i) => {
                const floatX = 58 + (i % 3) * 38 + 580;
                const startX = Math.min(floatX, 700);
                const floatPath = `M ${startX} 99 C ${startX} 160 ${startX - 20} 230 ${startX + 15} 300 C ${startX + 20} 330 ${startX - 25} 270 ${startX - 5} 180 C ${startX - 15} 130 ${startX} 110 ${startX} 99`;
                return (
                    <React.Fragment key={`c4-o2-${i}`}>
                        <AnimatedO2 path={floatPath} dur={particleDur * 1.5 + i * 0.2} begin={i * 0.5} />
                    </React.Fragment>
                );
            })}

            {/* C4 acid label: CO2 + PEP → OAA (C4) */}
            <rect x="90" y={mesoCy + 60} width="186" height="34" rx="8" fill="#bbf7d0" stroke="#16a34a" strokeWidth="1.5" />
            <text x="183" y={mesoCy + 75} textAnchor="middle" fontSize="10" fontWeight="800" fill="#14532d">CO₂ + PEP → OAA (C4 acid)</text>
            <text x="183" y={mesoCy + 88} textAnchor="middle" fontSize="9" fontWeight="700" fill="#15803d">Enzyme: PEPcase (no O₂ affinity)</text>

            {/* ── Shuttle arrow (C4 acid → Bundle Sheath) ── */}
            <g>
                {/* Animated shuttle arrow */}
                <path d="M 352 237 C 368 220 388 220 412 237" fill="none" stroke="#0369a1" strokeWidth="3" strokeDasharray="6 3" markerEnd="url(#arrB)">
                    <animate attributeName="stroke-dashoffset" values="18;0" dur="0.8s" repeatCount="indefinite" />
                </path>
                <text x="382" y="215" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0369a1">C4 acid</text>
                <text x="382" y="227" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0369a1">shuttle</text>

                {/* Animated CO2 molecule traveling shuttle */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <circle key={`shuttle-co2-${i}`} r="5" fill="#86efac" stroke="#15803d" strokeWidth="1.5">
                        <animateMotion dur={`${particleDur * 0.5}s`} begin={`${i * particleDur * 0.17}s`} repeatCount="indefinite">
                            <mpath href={`#shuttlePath`} />
                        </animateMotion>
                    </circle>
                ))}
                <path id="shuttlePath" d="M 352 237 C 368 220 388 220 412 237" fill="none" stroke="none" />
            </g>

            {/* ── Bundle Sheath Cell ── */}
            <rect x="412" y="118" width="330" height="238" rx="22" fill="#ecfdf5" stroke="#047857" strokeWidth="3.5" />
            <text x="577" y="140" textAnchor="middle" fontSize="13" fontWeight="900" fill="#065f46">Bundle Sheath Cell</text>
            <text x="577" y="156" textAnchor="middle" fontSize="10" fontWeight="700" fill="#047857">🔒 Protected — O₂ excluded!</text>

            {/* Calvin Cycle in bundle sheath */}
            <CalvinCycleWheel cx={bsCx} cy={bsCy} r={72} risk={false} gearColor="#047857" gearSpeed={`${particleDur * 0.9}s`} />

            {/* RuBisCO label */}
            <rect x={bsCx - 52} y={bsCy + 78} width="104" height="22" rx="8" fill="#dcfce7" stroke="#047857" strokeWidth="1.5" />
            <text x={bsCx} y={bsCy + 93} textAnchor="middle" fontSize="11" fontWeight="900" fill="#065f46">
                RuBisCO ✓ peak speed
            </text>

            {/* CO2 particles → bundle sheath RuBisCO (from shuttle) */}
            {Array.from({ length: Math.min(co2Count, 4) }).map((_, i) => (
                <React.Fragment key={`c4-co2-bs-${i}`}>
                    <AnimatedCO2
                        path={`M 414 ${220 + i * 8} C 450 ${210 + i * 8} ${bsCx - 30} ${bsCy - 40 + i * 6} ${bsCx - 10 + (i % 3) * 8} ${bsCy - 55}`}
                        dur={particleDur * 0.75 + i * 0.2}
                        begin={particleDur * 0.38 + i * 0.22}
                    />
                </React.Fragment>
            ))}

            {/* Molecule labels in bundle sheath */}
            <text x={bsCx - 80} y={bsCy - 52} fontSize="10" fontWeight="700" fill="#0f766e">RuBP ↻</text>
            <text x={bsCx + 58} y={bsCy - 16} fontSize="10" fontWeight="700" fill="#0f766e">3-PGA</text>
            <text x={bsCx + 58} y={bsCy + 28} fontSize="10" fontWeight="700" fill="#92400e">G3P</text>

            {/* No-O2 barrier visual – dashed red line at left edge of bundle sheath */}
            <line x1="412" y1="118" x2="412" y2="356" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
            <text x="406" y="290" textAnchor="middle" fontSize="9" fontWeight="800" fill="#dc2626" transform="rotate(-90, 406, 290)">O₂ BLOCKED ✗</text>
        </g>
    );
};

/* ════════════════════════════════════════════════════════
   CALVIN CYCLE WHEEL with rotating gear
════════════════════════════════════════════════════════ */
const CalvinCycleWheel = ({ cx, cy, r, risk, gearColor, gearSpeed }: {
    cx: number; cy: number; r: number; risk: boolean; gearColor: string; gearSpeed: string;
}) => {
    const teeth = 10;
    const innerR = r * 0.72;
    const outerR = r;
    const points = Array.from({ length: teeth * 2 }, (_, i) => {
        const angle = (i * Math.PI) / teeth;
        const radius = i % 2 === 0 ? outerR : innerR;
        return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    }).join(' ');

    return (
        <g>
            {/* Gear teeth */}
            <polygon points={points} fill={risk ? '#fee2e2' : '#dcfce7'} stroke={gearColor} strokeWidth="2.5">
                <animateTransform attributeName="transform" type="rotate"
                    from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`}
                    dur={gearSpeed} repeatCount="indefinite" />
            </polygon>
            {/* Inner hub */}
            <circle cx={cx} cy={cy} r={r * 0.48} fill="white" stroke={gearColor} strokeWidth="2.5" />
            {/* Cycle arrow path inside hub */}
            <path d={`M ${cx} ${cy - r * 0.34} C ${cx + r * 0.28} ${cy - r * 0.34} ${cx + r * 0.34} ${cy} ${cx + r * 0.22} ${cy + r * 0.28} C ${cx + r * 0.1} ${cy + r * 0.4} ${cx - r * 0.28} ${cy + r * 0.36} ${cx - r * 0.32} ${cy + r * 0.1} C ${cx - r * 0.36} ${cy - r * 0.18} ${cx - r * 0.1} ${cy - r * 0.38} ${cx} ${cy - r * 0.34}`}
                fill="none" stroke={gearColor} strokeWidth="2" markerEnd="url(#arrG)" strokeLinecap="round" />
            {/* Labels inside hub */}
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="12" fontWeight="900" fill={risk ? '#991b1b' : '#14532d'}>Calvin</text>
            <text x={cx} y={cy + 8} textAnchor="middle" fontSize="12" fontWeight="900" fill={risk ? '#991b1b' : '#14532d'}>Cycle</text>
        </g>
    );
};

/* ════════════════════════════════════════════════════════
   PEPcase VACUUM  (C4 mesophyll)
════════════════════════════════════════════════════════ */
const PEPcaseVacuum = ({ cx, cy }: { cx: number; cy: number }) => (
    <g>
        {/* Funnel body */}
        <polygon points={`${cx - 42},${cy - 46} ${cx + 42},${cy - 46} ${cx + 18},${cy + 14} ${cx - 18},${cy + 14}`}
            fill="#bbf7d0" stroke="#15803d" strokeWidth="2.5" />
        {/* Funnel neck */}
        <rect x={cx - 14} y={cy + 14} width="28" height="22" rx="4" fill="#86efac" stroke="#15803d" strokeWidth="2" />
        {/* Label */}
        <text x={cx} y={cy - 28} textAnchor="middle" fontSize="11" fontWeight="900" fill="#14532d">PEPcase</text>
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize="10" fontWeight="800" fill="#166534">Vacuum</text>
        {/* Pulse scale animation on funnel */}
        <ellipse cx={cx} cy={cy - 48} rx="46" ry="6" fill="none" stroke="#15803d" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7">
            <animate attributeName="rx" values="46;54;46" dur="1.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.1s" repeatCount="indefinite" />
        </ellipse>
        {/* Suction lines */}
        {[-28, -10, 8, 26].map((dx, i) => (
            <line key={i} x1={cx + dx} y1={cy - 80} x2={cx + dx * 0.5} y2={cy - 52}
                stroke="#15803d" strokeWidth="1.5" strokeDasharray="4 3">
                <animate attributeName="stroke-dashoffset" values="14;0" dur={`${0.7 + i * 0.12}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur={`${0.7 + i * 0.12}s`} repeatCount="indefinite" />
            </line>
        ))}
        {/* "CO2 only" badge */}
        <rect x={cx - 38} y={cy + 38} width="76" height="18" rx="6" fill="#15803d" />
        <text x={cx} y={cy + 51} textAnchor="middle" fontSize="9" fontWeight="900" fill="white">CO₂ only — ignores O₂</text>
    </g>
);

/* ════════════════════════════════════════════════════════
   ANIMATED CO2 PARTICLE
════════════════════════════════════════════════════════ */
const AnimatedCO2 = ({ path, dur, begin }: { path: string; dur: number; begin: number }) => (
    <g>
        <circle r="10" fill="#86efac" stroke="#15803d" strokeWidth="2" opacity="0.95">
            <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={path} />
        </circle>
        <text fontSize="7" fontWeight="900" fill="#14532d" textAnchor="middle" dy="2.5">
            CO₂
            <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={path} />
        </text>
    </g>
);

/* ════════════════════════════════════════════════════════
   ANIMATED O2 PARTICLE (Brownian float)
════════════════════════════════════════════════════════ */
const AnimatedO2 = ({ path, dur, begin }: { path: string; dur: number; begin: number }) => (
    <g>
        <circle r="9" fill="#fecdd3" stroke="#dc2626" strokeWidth="2" opacity="0.9">
            <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={path} />
        </circle>
        <text fontSize="7" fontWeight="900" fill="#991b1b" textAnchor="middle" dy="2.5">
            O₂
            <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" path={path} />
        </text>
    </g>
);

/* ════════════════════════════════════════════════════════
   ATP/NADPH BATTERY
════════════════════════════════════════════════════════ */
const AtpBattery = ({ x, y, fillHeight, atpUse, photorespirationRisk }: {
    x: number; y: number; fillHeight: number; atpUse: number; photorespirationRisk: boolean;
}) => {
    const barColor = photorespirationRisk ? '#ef4444' : '#6366f1';
    return (
        <g transform={`translate(${x} ${y})`}>
            <text x="0" y="12" fontSize="10" fontWeight="800" fill="#475569">ATP/NADPH:</text>
            {/* Battery outline */}
            <rect x="88" y="4" width="22" height="22" rx="3" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Battery tip */}
            <rect x="93" y="2" width="12" height="3" rx="1" fill="#94a3b8" />
            {/* Battery fill (draining) */}
            <rect x="90" y={6 + (20 - fillHeight * 20 / 38)} width="18" height={fillHeight * 20 / 38} rx="2" fill={barColor}>
                <animate attributeName="height" values={`${fillHeight * 20 / 38};${fillHeight * 20 / 38 * 0.7};${fillHeight * 20 / 38}`}
                    dur={photorespirationRisk ? '1.2s' : '3s'} repeatCount="indefinite" />
                <animate attributeName="y" values={`${6 + (20 - fillHeight * 20 / 38)};${6 + (20 - fillHeight * 20 / 38 * 0.7)};${6 + (20 - fillHeight * 20 / 38)}`}
                    dur={photorespirationRisk ? '1.2s' : '3s'} repeatCount="indefinite" />
            </rect>
            <text x="116" y="18" fontSize="9" fontWeight="800" fill={barColor}>{atpUse}u</text>
        </g>
    );
};

/* ════════════════════════════════════════════════════════
   SUGAR BIN METER
════════════════════════════════════════════════════════ */
const SugarBinMeter = ({ x, y, sugarRate }: { x: number; y: number; sugarRate: number }) => {
    const maxW = 330;
    const fillW = Math.max(14, (sugarRate / 10) * maxW);
    return (
        <g transform={`translate(${x} ${y})`}>
            <text x="0" y="12" fontSize="11" fontWeight="900" fill="#92400e">🍬 Sugar Bin</text>
            <rect x="0" y="16" width={maxW} height="22" rx="10" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
            <rect x="3" y="19" width={fillW - 6} height="16" rx="8" fill="url(#sugarGrad)">
                <animate attributeName="width" values={`${fillW - 6};${fillW - 2};${fillW - 6}`} dur="1.6s" repeatCount="indefinite" />
            </rect>
            <text x={maxW / 2} y="32" textAnchor="middle" fontSize="11" fontWeight="900" fill="#78350f">
                {sugarRate}/10 units
            </text>
            {/* Dropping sugar icon */}
            <circle r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1">
                <animateMotion dur={`${2.2 - sugarRate * 0.15}s`} repeatCount="indefinite"
                    path={`M ${fillW - 20} 0 C ${fillW - 20} 10 ${fillW - 15} 18 ${fillW - 18} 22`} />
            </circle>
        </g>
    );
};

/* ════════════════════════════════════════════════════════
   WASTE METER
════════════════════════════════════════════════════════ */
const WasteMeter = ({ x, y, wasteRate }: { x: number; y: number; wasteRate: number }) => {
    const maxW = 330;
    const fillW = Math.max(6, (wasteRate / 6) * maxW);
    const col = wasteRate > 3 ? '#ef4444' : wasteRate > 1 ? '#f59e0b' : '#94a3b8';
    return (
        <g transform={`translate(${x} ${y})`}>
            <text x="0" y="12" fontSize="11" fontWeight="900" fill={wasteRate > 3 ? '#991b1b' : '#64748b'}>⚡ Energy Waste</text>
            <rect x="0" y="16" width={maxW} height="18" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="3" y="19" width={Math.max(0, fillW - 6)} height="12" rx="6" fill={col}>
                {wasteRate > 2 && (
                    <animate attributeName="opacity" values="1;0.5;1" dur="0.8s" repeatCount="indefinite" />
                )}
            </rect>
            <text x={maxW / 2} y="30" textAnchor="middle" fontSize="10" fontWeight="900" fill={wasteRate > 3 ? '#991b1b' : '#475569'}>
                {wasteRate}/6  {wasteRate > 3 ? '— Photorespiration wasting energy!' : wasteRate > 0 ? '— Low waste' : '— Zero waste (C4)'}
            </text>
        </g>
    );
};

/* ════════════════════════════════════════════════════════
   YIELD METER — always-visible dual bar (C3 vs C4)
════════════════════════════════════════════════════════ */
const YieldMeter = ({ x, y, yieldC3, yieldC4, activePathway }: {
    x: number; y: number; yieldC3: number; yieldC4: number; activePathway: PlantPathway;
}) => {
    const maxW = 348;
    const c3W = (yieldC3 / 100) * maxW;
    const c4W = (yieldC4 / 100) * maxW;
    return (
        <g transform={`translate(${x} ${y})`}>
            <text x={maxW / 2} y="10" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1e293b">📊 Yield Meter — C3 vs C4</text>

            {/* C3 bar */}
            <rect x="0" y="16" width={maxW} height="20" rx="8" fill="#e0f2fe" stroke={activePathway === 'C3' ? '#0284c7' : '#94a3b8'} strokeWidth={activePathway === 'C3' ? 2.5 : 1.5} />
            <rect x="2" y="18" width={c3W - 4} height="16" rx="7" fill="url(#c3Grad)">
                <animate attributeName="width" values={`${c3W - 10};${c3W - 4};${c3W - 10}`} dur="2.2s" repeatCount="indefinite" />
            </rect>
            <text x="6" y="30" fontSize="9" fontWeight="900" fill="#075985">C3: {yieldC3}%</text>
            <text x={maxW - 4} y="30" textAnchor="end" fontSize="9" fontWeight="700" fill="#0369a1">
                {activePathway === 'C3' ? '◀ Active' : ''}
            </text>

            {/* C4 bar */}
            <rect x="0" y="42" width={maxW} height="20" rx="8" fill="#d1fae5" stroke={activePathway === 'C4' ? '#047857' : '#94a3b8'} strokeWidth={activePathway === 'C4' ? 2.5 : 1.5} />
            <rect x="2" y="44" width={c4W - 4} height="16" rx="7" fill="url(#c4Grad)">
                <animate attributeName="width" values={`${c4W - 10};${c4W - 4};${c4W - 10}`} dur="1.8s" repeatCount="indefinite" />
            </rect>
            <text x="6" y="56" fontSize="9" fontWeight="900" fill="#065f46">C4: {yieldC4}%</text>
            <text x={maxW - 4} y="56" textAnchor="end" fontSize="9" fontWeight="700" fill="#047857">
                {activePathway === 'C4' ? '◀ Active' : ''}
            </text>

            {/* Winner badge */}
            <rect x={maxW - 74} y="14" width="70" height="50" rx="8" fill={yieldC4 > yieldC3 ? '#d1fae5' : '#e0f2fe'}
                stroke={yieldC4 > yieldC3 ? '#059669' : '#0284c7'} strokeWidth="2">
                <animate attributeName="opacity" values="1;0.6;1" dur="1.4s" repeatCount="indefinite" />
            </rect>
            <text x={maxW - 39} y="32" textAnchor="middle" fontSize="9" fontWeight="900" fill="#065f46">C4 wins</text>
            <text x={maxW - 39} y="44" textAnchor="middle" fontSize="14" fontWeight="900" fill="#059669">+{yieldC4 - yieldC3}%</text>
            <text x={maxW - 39} y="57" textAnchor="middle" fontSize="8" fontWeight="700" fill="#047857">tropical</text>
        </g>
    );
};

/* ════════════════════════════════════════════════════════
   UI HELPER COMPONENTS
════════════════════════════════════════════════════════ */
const MetricCard = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
        <div className={`mt-1 text-xs md:text-sm font-bold break-words ${tone}`}>{value}</div>
    </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-xs md:text-sm text-slate-600 leading-relaxed min-w-0">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">{icon}{title}</div>
        {children}
    </div>
);

const FactTile = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">{icon}{title}</div>
        {children}
    </div>
);

export default CalvinCycleC3C4Lab;
