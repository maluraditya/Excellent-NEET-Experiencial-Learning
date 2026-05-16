import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Droplets, RefreshCcw, ScanEye, VenusAndMars } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type SystemView = 'Digestive' | 'Respiratory' | 'Circulatory' | 'Nervous' | 'Reproductive';
type EnvironmentMode = 'Land' | 'Water';
type SexMode = 'Male' | 'Female';

interface FrogsLabProps {
    topic: any;
    onExit: () => void;
}

const SYSTEM_COLORS: Record<SystemView, string> = {
    Digestive: '#f59e0b',
    Respiratory: '#0ea5e9',
    Circulatory: '#ef4444',
    Nervous: '#64748b',
    Reproductive: '#22c55e',
};

const FrogsLab: React.FC<FrogsLabProps> = ({ topic, onExit }) => {
    const [systemView, setSystemView] = useState<SystemView>('Digestive');
    const [environment, setEnvironment] = useState<EnvironmentMode>('Land');
    const [sex, setSex] = useState<SexMode>('Male');
    const [foodStep, setFoodStep] = useState(0);
    const [probeOn, setProbeOn] = useState(true);

    const respirationText = useMemo(() => {
        if (environment === 'Water') {
            return 'In water, the moist skin becomes the main respiratory surface. Dissolved oxygen diffuses through the highly vascularised skin.';
        }
        return 'On land, the pair of sac-like lungs expand and contract. Skin still helps, but pulmonary respiration becomes more important.';
    }, [environment]);

    const digestiveText = useMemo(() => {
        if (foodStep === 0) return 'Drag the insect trigger to begin. A frog is carnivorous, so its alimentary canal is short and suited for animal food.';
        if (foodStep === 1) return 'The bilobed tongue catches the insect and brings it into the buccal cavity.';
        if (foodStep === 2) return 'Food passes through the pharynx and short oesophagus into the stomach, where HCl and gastric juice form chyme.';
        return 'Chyme enters the duodenum. Bile and pancreatic juice act here, then villi and microvilli absorb digested food in the intestine.';
    }, [foodStep]);

    const systemObservation = useMemo(() => {
        if (systemView === 'Digestive') return digestiveText;
        if (systemView === 'Respiratory') return respirationText;
        if (systemView === 'Circulatory') return 'The frog has a closed vascular system. Its three-chambered heart has two atria and one ventricle. Sinus venosus receives deoxygenated blood before it enters the right atrium.';
        if (systemView === 'Nervous') return 'The brain is protected inside the cranium. CNS, PNS and ANS coordinate movement, sense organs, and body functions.';
        if (sex === 'Male') return 'Male frog: testes lie attached to kidneys by a mesorchium. Vasa efferentia carry sperms from testes into the kidney, then through the Bidder\'s canal and urinogenital duct to the cloaca. Fertilisation is external — sperms are shed into water.';
        return 'Female frog: ovaries lie near the kidneys but are not directly connected to them. Mature eggs fall into the body cavity, are collected by ciliated funnels, and pass through the oviducts to the cloaca. Eggs are laid in water where external fertilisation occurs.';
    }, [digestiveText, respirationText, sex, systemView]);

    const oxygenSource = environment === 'Water' ? 'Skin' : 'Lungs';
    const activeColor = SYSTEM_COLORS[systemView];

    const resetLab = () => {
        setSystemView('Digestive');
        setEnvironment('Land');
        setSex('Male');
        setFoodStep(0);
        setProbeOn(true);
    };

    const simulationCombo = (
        <div className="w-full h-full min-h-0 bg-slate-50 rounded-2xl border border-slate-200 p-3 md:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="grid xl:grid-cols-[1.25fr_0.75fr] gap-3 flex-1 min-h-0">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col min-h-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                            <div className="text-base md:text-lg font-bold text-slate-900">Virtual Frog Anatomy</div>
                            <div className="text-xs text-slate-500">Section 7.2.2 - organ system overlay</div>
                        </div>
                        <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: activeColor }}>
                            {systemView}
                        </span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2 min-h-[320px]">
                        <FrogAnatomySVG
                            systemView={systemView}
                            environment={environment}
                            sex={sex}
                            foodStep={foodStep}
                            probeOn={probeOn}
                        />
                    </div>
                    <div className="grid sm:grid-cols-4 gap-2 mt-2">
                        <MetricCard label="Oxygen Source" value={oxygenSource} tone={environment === 'Water' ? 'text-sky-700' : 'text-emerald-700'} />
                        <MetricCard label="Heart" value="3 chambers" tone="text-rose-700" />
                        <MetricCard label="Exit" value="Cloaca" tone="text-slate-700" />
                        <MetricCard label="Food Type" value="Carnivore" tone="text-amber-700" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-3 min-h-0">
                    <InfoCard title="Live Observation" icon={<ScanEye size={16} className="text-indigo-600" />}>
                        <p>{systemObservation}</p>
                    </InfoCard>
                    <InfoCard title="NCERT Logic" icon={<Activity size={16} className="text-teal-600" />}>
                        <p>Frogs are amphibians, so their body plan supports life in water and on land. The same animal can shift respiration mode, digest carnivorous food, and use one cloacal exit for digestive, urinary, and reproductive ducts.</p>
                    </InfoCard>
                    <InfoCard title="Classroom Analogy" icon={<ArrowRight size={16} className="text-amber-600" />}>
                        {environment === 'Water' ? (
                            <p>The frog is like a student using mobile data when Wi-Fi is unavailable: it switches to skin respiration in water.</p>
                        ) : (
                            <p>The frog is like a hybrid vehicle: lungs work on land, while the skin remains a backup exchange surface.</p>
                        )}
                    </InfoCard>
                </div>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-h-[36vh] overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <strong>Experiment Goal:</strong> Explore how frog organ systems are arranged and how respiration changes between land and water.
                </div>

                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">System Switch</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(['Digestive', 'Respiratory', 'Circulatory', 'Nervous', 'Reproductive'] as SystemView[]).map((system) => (
                            <button
                                key={system}
                                onClick={() => setSystemView(system)}
                                className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${systemView === system ? 'text-white border-transparent' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}
                                style={systemView === system ? { backgroundColor: SYSTEM_COLORS[system] } : undefined}
                            >
                                {system}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Environment Toggle</div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['Land', 'Water'] as EnvironmentMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setEnvironment(mode)}
                                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${environment === mode ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Food Trigger</span>
                        <span className="text-xs font-bold text-slate-700">Step {foodStep}/3</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { step: 0, label: 'Insect' },
                            { step: 1, label: 'Tongue' },
                            { step: 2, label: 'Stomach' },
                            { step: 3, label: 'Absorption' },
                        ].map((item) => (
                            <button
                                key={item.step}
                                onClick={() => {
                                    setSystemView('Digestive');
                                    setFoodStep(item.step);
                                }}
                                className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all ${foodStep === item.step ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Gender Selector</div>
                    <div className="grid grid-cols-2 gap-2">
                        {(['Male', 'Female'] as SexMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => { setSex(mode); setSystemView('Reproductive'); }}
                                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${sex === mode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <FactTile icon={<Droplets size={15} className="text-sky-600" />} title="Respiration">
                        {environment === 'Water' ? 'Water mode: cutaneous respiration through moist skin.' : 'Land mode: pulmonary respiration through lungs.'}
                    </FactTile>
                    <FactTile icon={<VenusAndMars size={15} className="text-emerald-600" />} title="Reproduction">
                        {sex === 'Male' ? 'Male: testes → vasa efferentia → Bidder\'s canal → cloaca. Fertilisation is external.' : 'Female: ovaries → body cavity → oviduct → cloaca. Eggs laid in water; external fertilisation.'}
                    </FactTile>
                </div>

                <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                    <button
                        onClick={() => setProbeOn((prev) => !prev)}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${probeOn ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                        Probe Labels: {probeOn ? 'ON' : 'OFF'}
                    </button>
                    <button
                        onClick={resetLab}
                        className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={15} />
                        Reset
                    </button>
                </div>
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

const FrogAnatomySVG: React.FC<{
    systemView: SystemView;
    environment: EnvironmentMode;
    sex: SexMode;
    foodStep: number;
    probeOn: boolean;
}> = ({ systemView, environment, sex, foodStep, probeOn }) => {
    const showDigestive = systemView === 'Digestive';
    const showRespiratory = systemView === 'Respiratory';
    const showCirculatory = systemView === 'Circulatory';
    const showNervous = systemView === 'Nervous';
    const showReproductive = systemView === 'Reproductive';
    const dim = (active: boolean) => active ? 1 : 0.12;
    const skinGlow = environment === 'Water' ? '#7dd3fc' : '#86efac';

    return (
        <svg viewBox="0 0 620 360" className="w-full h-full" aria-label="Frog internal anatomy simulation">
            <rect width="620" height="360" rx="16" fill={environment === 'Water' ? '#e0f2fe' : '#ecfdf5'} />
            <text x="310" y="28" textAnchor="middle" fontSize="17" fontWeight="800" fill="#0f172a">
                Rana tigrina - Internal Anatomy
            </text>
            <text x="310" y="49" textAnchor="middle" fontSize="12" fontWeight="700" fill="#475569">
                {environment} mode: {environment === 'Water' ? 'cutaneous respiration highlighted' : 'pulmonary respiration highlighted'}
            </text>

            {/* realistic top-view frog silhouette */}
            <g>
                {/* hind legs and webbed feet */}
                <path d="M218 235 C178 249 148 286 114 313 C104 321 87 319 83 309 C78 296 94 288 108 280 C136 263 153 236 190 218 Z" fill="#4ade80" stroke="#15803d" strokeWidth="4" />
                <path d="M402 235 C442 249 472 286 506 313 C516 321 533 319 537 309 C542 296 526 288 512 280 C484 263 467 236 430 218 Z" fill="#4ade80" stroke="#15803d" strokeWidth="4" />
                <path d="M110 309 C92 316 78 326 63 338 M111 309 C94 333 85 342 73 350 M113 309 C126 329 135 339 148 350" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
                <path d="M510 309 C528 316 542 326 557 338 M509 309 C526 333 535 342 547 350 M507 309 C494 329 485 339 472 350" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />

                {/* forelimbs */}
                <path d="M200 172 C156 169 118 185 94 219 C88 228 75 226 72 216 C68 203 83 190 98 181 C128 163 163 150 205 151 Z" fill="#4ade80" stroke="#15803d" strokeWidth="4" />
                <path d="M420 172 C464 169 502 185 526 219 C532 228 545 226 548 216 C552 203 537 190 522 181 C492 163 457 150 415 151 Z" fill="#4ade80" stroke="#15803d" strokeWidth="4" />
                <path d="M91 219 C78 228 67 239 55 252 M91 219 C82 241 75 254 66 267 M92 219 C104 235 116 246 130 257" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
                <path d="M529 219 C542 228 553 239 565 252 M529 219 C538 241 545 254 554 267 M528 219 C516 235 504 246 490 257" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />

                {/* connected head and trunk */}
                <path
                    d="M310 86
                       C262 72 224 83 204 114
                       C183 145 184 179 202 211
                       C225 252 264 274 310 278
                       C356 274 395 252 418 211
                       C436 179 437 145 416 114
                       C396 83 358 72 310 86Z"
                    fill="#86efac"
                    stroke={skinGlow}
                    strokeWidth={environment === 'Water' ? 8 : 4}
                />
                <path d="M214 137 C246 112 281 106 310 118 C339 106 374 112 406 137" fill="none" stroke="#22c55e" strokeWidth="4" opacity="0.55" />
                <path d="M230 202 C252 235 281 249 310 251 C339 249 368 235 390 202" fill="none" stroke="#16a34a" strokeWidth="3" opacity="0.45" />

                {/* dorsal markings */}
                <ellipse cx="310" cy="167" rx="45" ry="60" fill="#22c55e" opacity="0.13" />
                {[248, 276, 344, 372].map((cx, i) => (
                    <ellipse key={cx} cx={cx} cy={158 + (i % 2) * 30} rx="16" ry="9" fill="#166534" opacity="0.16" />
                ))}

                {/* eyes and tympanum */}
                <ellipse cx="252" cy="104" rx="23" ry="17" fill="#bbf7d0" stroke="#15803d" strokeWidth="3" />
                <ellipse cx="368" cy="104" rx="23" ry="17" fill="#bbf7d0" stroke="#15803d" strokeWidth="3" />
                <circle cx="252" cy="101" r="10" fill="#111827" />
                <circle cx="368" cy="101" r="10" fill="#111827" />
                <circle cx="228" cy="137" r="13" fill="#dbeafe" opacity="0.75" stroke="#64748b" strokeWidth="3" />
                <circle cx="392" cy="137" r="13" fill="#dbeafe" opacity="0.75" stroke="#64748b" strokeWidth="3" />
                <text x="228" y="163" textAnchor="middle" fontSize="10" fill="#475569" fontWeight="700">Tympanum</text>
                <text x="392" y="163" textAnchor="middle" fontSize="10" fill="#475569" fontWeight="700">Tympanum</text>
            </g>

            {/* digestive */}
            <g opacity={dim(showDigestive)}>
                <path d="M255 137 C285 118 335 118 365 137" stroke="#f59e0b" strokeWidth="9" fill="none" strokeLinecap="round" />
                <path d="M310 139 L310 162" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
                <ellipse cx="310" cy="187" rx="34" ry="24" fill="#fbbf24" stroke="#b45309" strokeWidth="3" />
                <path d="M333 198 C382 205 384 248 330 251 C285 254 280 225 326 220" fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
                <path d="M330 252 L330 278" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
                <circle cx="330" cy="292" r="11" fill="#92400e" />
                <ellipse cx="365" cy="205" rx="14" ry="9" fill="#22c55e" stroke="#166534" strokeWidth="2" />
                <path d="M365 214 C358 226 349 229 340 230" stroke="#166534" strokeWidth="3" fill="none" />
                {foodStep >= 1 && <circle cx={foodStep === 1 ? 258 : foodStep === 2 ? 310 : 340} cy={foodStep === 1 ? 137 : foodStep === 2 ? 187 : 230} r="7" fill="#111827" />}
                {probeOn && showDigestive && (
                    <>
                        <Label x={245} y={118} text="Bilobed tongue" color="#92400e" />
                        <Label x={392} y={188} text="Stomach + HCl" color="#92400e" />
                        <Label x={421} y={232} text="Duodenum + bile duct" color="#92400e" />
                        <Label x={381} y={292} text="Cloaca" color="#92400e" />
                    </>
                )}
            </g>

            {/* respiratory */}
            <g opacity={dim(showRespiratory)}>
                <ellipse cx="274" cy="162" rx="28" ry="48" fill="#bae6fd" stroke="#0284c7" strokeWidth="3" />
                <ellipse cx="346" cy="162" rx="28" ry="48" fill="#bae6fd" stroke="#0284c7" strokeWidth="3" />
                {environment === 'Land' && (
                    <>
                        <path d="M274 125 C260 110 288 110 274 125" fill="#0284c7" opacity="0.25" />
                        <path d="M346 125 C332 110 360 110 346 125" fill="#0284c7" opacity="0.25" />
                    </>
                )}
                {environment === 'Water' && (
                    <g opacity="0.75">
                        {[150, 205, 465, 515].map((x, i) => (
                            <circle key={i} cx={x} cy={180 + (i % 2) * 24} r="10" fill="#38bdf8" />
                        ))}
                        <text x="310" y="318" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0369a1">Moist skin absorbs dissolved oxygen</text>
                    </g>
                )}
                {probeOn && showRespiratory && (
                    <>
                        <Label x={216} y={172} text="Left lung" color="#0369a1" />
                        <Label x={392} y={172} text="Right lung" color="#0369a1" />
                        <Label x={310} y={304} text={environment === 'Water' ? 'Cutaneous respiration' : 'Pulmonary respiration'} color="#0369a1" />
                    </>
                )}
            </g>

            {/* circulatory */}
            <g opacity={dim(showCirculatory)}>
                <path d="M310 148 C276 126 236 142 222 174" stroke="#3b82f6" strokeWidth="5" fill="none" />
                <path d="M310 148 C344 126 384 142 398 174" stroke="#ef4444" strokeWidth="5" fill="none" />
                <path d="M310 218 C274 236 246 224 226 198" stroke="#3b82f6" strokeWidth="5" fill="none" />
                <path d="M310 218 C346 236 374 224 394 198" stroke="#ef4444" strokeWidth="5" fill="none" />
                <HeartSVG x={310} y={178} />
                <path d="M280 166 L248 151 L278 140 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                <path d="M340 166 L374 150 L344 139 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
                {probeOn && showCirculatory && (
                    <>
                        <Label x={222} y={145} text="Sinus venosus" color="#1d4ed8" />
                        <Label x={388} y={143} text="Conus arteriosus" color="#b91c1c" />
                        <Label x={310} y={244} text="2 atria + 1 ventricle" color="#be123c" />
                    </>
                )}
            </g>

            {/* nervous */}
            <g opacity={dim(showNervous)}>
                <ellipse cx="310" cy="105" rx="38" ry="19" fill="#e2e8f0" stroke="#475569" strokeWidth="3" />
                <rect x="305" y="119" width="10" height="133" rx="5" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
                {[145, 165, 185, 205, 225].map((y) => (
                    <React.Fragment key={y}>
                        <path d={`M310 ${y} C270 ${y - 10} 238 ${y - 3} 210 ${y + 12}`} stroke="#94a3b8" strokeWidth="3" fill="none" />
                        <path d={`M310 ${y} C350 ${y - 10} 382 ${y - 3} 410 ${y + 12}`} stroke="#94a3b8" strokeWidth="3" fill="none" />
                    </React.Fragment>
                ))}
                {probeOn && showNervous && (
                    <>
                        <Label x={310} y={80} text="Brain inside cranium" color="#334155" />
                        <Label x={355} y={203} text="Spinal nerves" color="#334155" />
                        <Label x={470} y={114} text="Tympanum: hearing" color="#334155" />
                    </>
                )}
            </g>

            {/* reproductive */}
            <g opacity={dim(showReproductive)}>
                {sex === 'Male' ? (
                    <>
                        <ellipse cx="270" cy="210" rx="16" ry="24" fill="#fde68a" stroke="#ca8a04" strokeWidth="3" />
                        <ellipse cx="350" cy="210" rx="16" ry="24" fill="#fde68a" stroke="#ca8a04" strokeWidth="3" />
                        <path d="M270 234 C286 250 303 253 330 282" stroke="#22c55e" strokeWidth="4" fill="none" />
                        <path d="M350 234 C338 250 335 260 330 282" stroke="#22c55e" strokeWidth="4" fill="none" />
                        <rect x="250" y="192" width="12" height="55" rx="6" fill="#86efac" opacity="0.7" />
                        <rect x="358" y="192" width="12" height="55" rx="6" fill="#86efac" opacity="0.7" />
                        {probeOn && showReproductive && (
                            <>
                                <Label x={226} y={210} text="Testes" color="#15803d" />
                                <Label x={418} y={226} text="Vasa efferentia" color="#15803d" />
                                <Label x={396} y={270} text="Bidder's canal" color="#15803d" />
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <ellipse cx="263" cy="207" rx="25" ry="31" fill="#bbf7d0" stroke="#15803d" strokeWidth="3" />
                        <ellipse cx="357" cy="207" rx="25" ry="31" fill="#bbf7d0" stroke="#15803d" strokeWidth="3" />
                        {[250, 264, 276, 344, 358, 370].map((cx, i) => (
                            <circle key={i} cx={cx} cy={i < 3 ? 202 + (i % 2) * 14 : 202 + (i % 2) * 14} r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                        ))}
                        <path d="M244 222 C224 246 255 278 330 286" stroke="#22c55e" strokeWidth="4" fill="none" />
                        <path d="M376 222 C396 246 365 278 330 286" stroke="#22c55e" strokeWidth="4" fill="none" />
                        {probeOn && showReproductive && (
                            <>
                                <Label x={215} y={200} text="Ovaries" color="#15803d" />
                                <Label x={428} y={244} text="Oviducts" color="#15803d" />
                                <Label x={392} y={291} text="Cloaca opening" color="#15803d" />
                            </>
                        )}
                    </>
                )}
            </g>

            {/* cloaca marker */}
            <circle cx="330" cy="292" r="6" fill="#78350f" />
        </svg>
    );
};

const Label = ({ x, y, text, color }: { x: number; y: number; text: string; color: string }) => (
    <g>
        <rect x={x - text.length * 3.6} y={y - 14} width={text.length * 7.2} height="20" rx="8" fill="white" stroke={color} strokeWidth="1.5" />
        <text x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="800" fill={color}>{text}</text>
    </g>
);

const HeartSVG = ({ x, y }: { x: number; y: number }) => (
    <g>
        <path d={`M${x - 20} ${y - 12} C${x - 40} ${y - 36} ${x - 72} ${y - 5} ${x - 34} ${y + 26} C${x - 20} ${y + 39} ${x} ${y + 52} ${x} ${y + 52} C${x} ${y + 52} ${x + 20} ${y + 39} ${x + 34} ${y + 26} C${x + 72} ${y - 5} ${x + 40} ${y - 36} ${x + 20} ${y - 12} C${x + 8} ${y - 25} ${x - 8} ${y - 25} ${x - 20} ${y - 12}Z`} fill="#fb7185" stroke="#be123c" strokeWidth="3" />
        <line x1={x} y1={y - 19} x2={x} y2={y + 18} stroke="#be123c" strokeWidth="2" />
        <line x1={x - 28} y1={y + 10} x2={x + 28} y2={y + 10} stroke="#be123c" strokeWidth="2" />
        <text x={x - 18} y={y - 2} textAnchor="middle" fontSize="10" fill="white" fontWeight="800">RA</text>
        <text x={x + 18} y={y - 2} textAnchor="middle" fontSize="10" fill="white" fontWeight="800">LA</text>
        <text x={x} y={y + 30} textAnchor="middle" fontSize="10" fill="white" fontWeight="800">V</text>
    </g>
);

const MetricCard = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
        <div className={`mt-1 text-xs md:text-sm font-bold break-words ${tone}`}>{value}</div>
    </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-xs md:text-sm text-slate-600 leading-relaxed min-w-0">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

const FactTile = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <div className="flex items-center gap-2 text-slate-900 font-bold mb-1">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

export default FrogsLab;
