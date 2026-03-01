import React, { useState, useMemo } from 'react';
import { RefreshCcw, Flame, ArrowRight, CheckCircle2, Scale, FlaskConical, AlertTriangle } from 'lucide-react';

type Phase = 1 | 2 | 3 | 4;

interface TubeState {
    id: 'cacl2' | 'koh';
    label: string;
    color: string;
    initialMass: number;
    finalMass: number | null;
    weighed: boolean;
}

const QuantitativeAnalysisCanvas: React.FC = () => {
    const [phase, setPhase] = useState<Phase>(1);
    const [systemMessage, setSystemMessage] = useState(
        'Welcome to Liebig\'s Combustion Lab. You have 0.5000 g of an unknown organic compound. First, weigh the empty U-tubes on the analytical balance, then assemble them in the correct order.'
    );

    // Secret compound: C₂H₆O (Ethanol) → 52.17% C, 13.04% H, 34.78% O
    const sampleMass = 0.5000;
    const truePercentC = 52.17;
    const truePercentH = 13.04;
    const massCO2 = (truePercentC / 100) * sampleMass * (44 / 12); // ~0.9565g
    const massH2O = (truePercentH / 100) * sampleMass * (18 / 2);  // ~0.5868g

    // Phase 1: Assembly state
    const [tube1Weighed, setTube1Weighed] = useState(false);
    const [tube2Weighed, setTube2Weighed] = useState(false);
    const [assemblyOrder, setAssemblyOrder] = useState<('cacl2' | 'koh')[]>([]);
    const [assemblyError, setAssemblyError] = useState(false);
    const [assemblyCorrect, setAssemblyCorrect] = useState(false);

    const tube1InitialMass = 45.3200;
    const tube2InitialMass = 62.1500;

    // Phase 2: Combustion state
    const [combustionStarted, setCombustionStarted] = useState(false);
    const [combustionProgress, setCombustionProgress] = useState(0);
    const [combustionComplete, setCombustionComplete] = useState(false);

    // Phase 3: Data collection state
    const [tube1FinalWeighed, setTube1FinalWeighed] = useState(false);
    const [tube2FinalWeighed, setTube2FinalWeighed] = useState(false);
    const tube1FinalMass = +(tube1InitialMass + massH2O).toFixed(4);
    const tube2FinalMass = +(tube2InitialMass + massCO2).toFixed(4);

    // Phase 4: Calculation state
    const [calcStep, setCalcStep] = useState(0); // 0: none, 1: %H shown, 2: %C shown, 3: %O deduced, 4: empirical shown
    const deltaM1 = +(tube1FinalMass - tube1InitialMass).toFixed(4);
    const deltaM2 = +(tube2FinalMass - tube2InitialMass).toFixed(4);
    const calculatedPercentH = +((2 / 18) * (deltaM1 / sampleMass) * 100).toFixed(2);
    const calculatedPercentC = +((12 / 44) * (deltaM2 / sampleMass) * 100).toFixed(2);
    const calculatedPercentO = +(100 - calculatedPercentC - calculatedPercentH).toFixed(2);

    // Molecular Lens
    const [showMoleculeLens, setShowMoleculeLens] = useState(false);
    const [lensContent, setLensContent] = useState<React.ReactNode>(null);

    const triggerLens = (content: React.ReactNode, duration = 4500) => {
        setLensContent(content);
        setShowMoleculeLens(true);
        setTimeout(() => setShowMoleculeLens(false), duration);
    };

    const handleReset = () => {
        setPhase(1);
        setTube1Weighed(false);
        setTube2Weighed(false);
        setAssemblyOrder([]);
        setAssemblyError(false);
        setAssemblyCorrect(false);
        setCombustionStarted(false);
        setCombustionProgress(0);
        setCombustionComplete(false);
        setTube1FinalWeighed(false);
        setTube2FinalWeighed(false);
        setCalcStep(0);
        setShowMoleculeLens(false);
        setSystemMessage('Welcome to Liebig\'s Combustion Lab. You have 0.5000 g of an unknown organic compound. First, weigh the empty U-tubes on the analytical balance, then assemble them in the correct order.');
    };

    // Phase 1 handlers
    const handleWeighTube = (tube: 'cacl2' | 'koh') => {
        if (tube === 'cacl2') {
            setTube1Weighed(true);
            setSystemMessage(`CaCl₂ tube weighed: ${tube1InitialMass} g. Now weigh the KOH tube.`);
        } else {
            setTube2Weighed(true);
            setSystemMessage(`KOH tube weighed: ${tube2InitialMass} g. Now connect the tubes to the furnace in the correct order.`);
        }
    };

    const handleConnectTube = (tube: 'cacl2' | 'koh') => {
        if (assemblyCorrect || assemblyError) return;
        const newOrder = [...assemblyOrder, tube];
        setAssemblyOrder(newOrder);

        if (newOrder.length === 1 && newOrder[0] === 'koh') {
            setAssemblyError(true);
            setSystemMessage('⚠️ WARNING! KOH is a strong alkali that absorbs both CO₂ AND moisture! If placed first, it traps water too, making your Carbon calculation artificially high. Put CaCl₂ first!');
            triggerLens(
                <div className="flex flex-col items-center gap-2 text-center">
                    <AlertTriangle className="text-red-400 w-10 h-10" />
                    <div className="text-red-400 font-bold text-lg">Incorrect Order!</div>
                    <div className="text-sm text-slate-300">KOH absorbs H₂O + CO₂ → ruins %C data</div>
                    <div className="text-xs text-slate-400 mt-2">CaCl₂ must come first to trap only H₂O</div>
                </div>
            );
        } else if (newOrder.length === 1 && newOrder[0] === 'cacl2') {
            setSystemMessage('CaCl₂ (desiccant) connected first — good! It selectively absorbs only water vapour. Now connect the KOH tube.');
        } else if (newOrder.length === 2 && newOrder[0] === 'cacl2' && newOrder[1] === 'koh') {
            setAssemblyCorrect(true);
            setSystemMessage('✅ Combustion train assembled correctly! CaCl₂ → KOH. Ready to ignite the furnace. Proceed to Phase 2.');
            triggerLens(
                <div className="flex flex-col items-center gap-2 text-center">
                    <CheckCircle2 className="text-emerald-400 w-10 h-10" />
                    <div className="text-emerald-300 font-bold">Correct Assembly!</div>
                    <div className="font-mono text-sm text-slate-300">Furnace → CaCl₂ (traps H₂O) → KOH (traps CO₂)</div>
                </div>
            );
        }
    };

    const handleResetAssembly = () => {
        setAssemblyOrder([]);
        setAssemblyError(false);
        setSystemMessage('Assembly reset. Connect CaCl₂ first, then KOH.');
    };

    // Phase 2 handlers
    const handleIgnite = () => {
        setCombustionStarted(true);
        setSystemMessage('🔥 Furnace ignited! O₂ flowing. CuO is oxidizing the compound. Watch: Blue particles (H₂O) are trapped by CaCl₂, Grey particles (CO₂) pass through to KOH.');

        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            setCombustionProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setCombustionComplete(true);
                setSystemMessage('Combustion complete! The compound has been fully oxidized. All gases have been trapped. Proceed to Phase 3 to weigh the tubes again.');
            }
        }, 80);
    };

    // Phase 3 handlers
    const handleWeighFinal = (tube: 'cacl2' | 'koh') => {
        if (tube === 'cacl2') {
            setTube1FinalWeighed(true);
            setSystemMessage(`CaCl₂ tube final mass: ${tube1FinalMass} g (gained ${deltaM1.toFixed(4)} g of H₂O). Now weigh the KOH tube.`);
        } else {
            setTube2FinalWeighed(true);
            setSystemMessage(`KOH tube final mass: ${tube2FinalMass} g (gained ${deltaM2.toFixed(4)} g of CO₂). All data collected! Proceed to Phase 4.`);
        }
    };

    // Phase 4 handlers
    const handleCalcStep = () => {
        const next = calcStep + 1;
        setCalcStep(next);
        if (next === 1) {
            setSystemMessage(`%H = (2/18) × (${deltaM1.toFixed(4)}/${sampleMass}) × 100 = ${calculatedPercentH}%`);
        } else if (next === 2) {
            setSystemMessage(`%C = (12/44) × (${deltaM2.toFixed(4)}/${sampleMass}) × 100 = ${calculatedPercentC}%`);
        } else if (next === 3) {
            setSystemMessage(`%C + %H = ${(calculatedPercentC + calculatedPercentH).toFixed(2)}%. Difference from 100% → %O = ${calculatedPercentO}%. There IS Oxygen!`);
        } else if (next === 4) {
            setSystemMessage('Empirical formula deduced! Mole ratio: C : H : O = 2 : 6 : 1. The unknown compound is C₂H₆O (Ethanol)!');
            triggerLens(
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="text-3xl">🧪</div>
                    <div className="text-emerald-300 font-bold text-xl font-mono">C₂H₆O</div>
                    <div className="text-sm text-slate-300">Ethanol — deduced from mass data alone!</div>
                    <div className="text-xs text-slate-400 mt-1">Mole Ratio: C(2) : H(6) : O(1)</div>
                </div>, 6000
            );
        }
    };

    // ---- RENDERERS ----

    const renderLabVisualization = () => {
        switch (phase) {
            case 1:
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
                        {/* Balance */}
                        <div className="flex items-end gap-8 md:gap-16">
                            {/* CaCl2 tube */}
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-14 h-20 md:w-16 md:h-24 rounded-lg border-2 transition-all duration-500 flex items-center justify-center ${tube1Weighed ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-blue-400/40 bg-blue-500/10'
                                    }`}>
                                    <div className="w-8 h-12 md:w-10 md:h-16 bg-white/20 rounded-md" />
                                </div>
                                <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">CaCl₂</div>
                                {tube1Weighed && <div className="font-mono text-xs text-emerald-300">{tube1InitialMass} g</div>}
                            </div>

                            {/* Balance icon */}
                            <div className="flex flex-col items-center gap-1">
                                <Scale className="w-8 h-8 md:w-10 md:h-10 text-amber-400/70" />
                                <div className="text-[9px] text-slate-500 uppercase">Balance</div>
                            </div>

                            {/* KOH tube */}
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-14 h-20 md:w-16 md:h-24 rounded-lg border-2 transition-all duration-500 flex items-center justify-center ${tube2Weighed ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-red-400/40 bg-red-500/10'
                                    }`}>
                                    <div className="w-8 h-12 md:w-10 md:h-16 bg-white/20 rounded-md" />
                                </div>
                                <div className="text-[10px] font-bold text-red-300 uppercase tracking-widest">KOH</div>
                                {tube2Weighed && <div className="font-mono text-xs text-emerald-300">{tube2InitialMass} g</div>}
                            </div>
                        </div>

                        {/* Assembly area */}
                        {tube1Weighed && tube2Weighed && (
                            <div className="w-full max-w-sm md:max-w-md">
                                <div className="text-[10px] text-center text-slate-400 uppercase tracking-widest mb-3">Combustion Train Assembly</div>
                                <div className="flex items-center justify-center gap-2 md:gap-3">
                                    <div className="px-3 py-1.5 rounded bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold">Furnace</div>
                                    <span className="text-slate-500">→</span>
                                    {assemblyOrder.length > 0 ? (
                                        <div className={`px-3 py-1.5 rounded text-xs font-bold ${assemblyOrder[0] === 'cacl2' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'
                                            }`}>{assemblyOrder[0] === 'cacl2' ? 'CaCl₂' : 'KOH'}</div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded border border-dashed border-slate-600 text-slate-500 text-xs">Slot 1</div>
                                    )}
                                    <span className="text-slate-500">→</span>
                                    {assemblyOrder.length > 1 ? (
                                        <div className={`px-3 py-1.5 rounded text-xs font-bold ${assemblyOrder[1] === 'cacl2' ? 'bg-blue-500/20 border border-blue-500/30 text-blue-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'
                                            }`}>{assemblyOrder[1] === 'cacl2' ? 'CaCl₂' : 'KOH'}</div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded border border-dashed border-slate-600 text-slate-500 text-xs">Slot 2</div>
                                    )}
                                    <span className="text-slate-500">→</span>
                                    <div className="px-3 py-1.5 rounded bg-slate-700 border border-slate-600 text-slate-400 text-xs">Vent</div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
                        {/* Combustion train visualization */}
                        <div className="flex items-center gap-1 md:gap-3 relative z-10 px-4">
                            {/* O2 cylinder */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-6 h-14 md:w-8 md:h-20 rounded-full bg-cyan-900/50 border border-cyan-400/30 flex items-center justify-center">
                                    <span className="text-[8px] md:text-[10px] font-bold text-cyan-300">O₂</span>
                                </div>
                            </div>

                            <span className="text-slate-600 text-xs">→</span>

                            {/* Furnace with sample */}
                            <div className="relative">
                                <div className={`w-20 h-12 md:w-28 md:h-16 rounded-lg border-2 flex items-center justify-center transition-all duration-1000 ${combustionStarted ? 'border-orange-500 bg-orange-900/40 shadow-[0_0_30px_rgba(249,115,22,0.4)]' : 'border-slate-600 bg-slate-800'
                                    }`}>
                                    <div className={`w-4 h-4 md:w-6 md:h-6 rounded transition-all duration-1000 ${combustionStarted && !combustionComplete ? 'bg-white animate-pulse scale-75' : combustionComplete ? 'bg-slate-600 scale-50' : 'bg-white/80'
                                        }`} />
                                    {combustionStarted && <div className="absolute -bottom-1 w-full h-1 bg-orange-500 rounded animate-pulse" />}
                                </div>
                                <div className="text-[8px] md:text-[9px] text-center text-slate-500 mt-1">Furnace + CuO</div>
                            </div>

                            <span className="text-slate-600 text-xs">→</span>

                            {/* CaCl2 tube */}
                            <div className="relative">
                                <div className={`w-12 h-16 md:w-16 md:h-20 rounded-lg border-2 border-blue-400/40 bg-blue-500/10 flex items-center justify-center overflow-hidden`}>
                                    <div className={`w-6 h-10 md:w-8 md:h-14 rounded bg-white/20 transition-all duration-500 ${combustionComplete ? 'bg-blue-300/30' : ''}`} />
                                    {/* Blue particles being absorbed */}
                                    {combustionStarted && !combustionComplete && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            {[...Array(4)].map((_, i) => (
                                                <div key={`b${i}`} className="absolute w-1.5 h-1.5 rounded-full bg-blue-400" style={{
                                                    left: `${20 + i * 18}%`, top: `${30 + (i % 2) * 30}%`,
                                                    animation: `particle-absorb ${1.5 + i * 0.3}s infinite ease-in ${i * 0.2}s`
                                                }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-[8px] md:text-[9px] text-center text-blue-300 mt-1 font-bold">CaCl₂</div>
                            </div>

                            <span className="text-slate-600 text-xs">→</span>

                            {/* KOH tube */}
                            <div className="relative">
                                <div className={`w-12 h-16 md:w-16 md:h-20 rounded-lg border-2 border-red-400/40 bg-red-500/10 flex items-center justify-center overflow-hidden`}>
                                    <div className={`w-6 h-10 md:w-8 md:h-14 rounded bg-white/20 transition-all duration-500 ${combustionComplete ? 'bg-red-300/20' : ''}`} />
                                    {/* Grey particles being absorbed */}
                                    {combustionStarted && !combustionComplete && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            {[...Array(4)].map((_, i) => (
                                                <div key={`g${i}`} className="absolute w-1.5 h-1.5 rounded-full bg-slate-400" style={{
                                                    left: `${15 + i * 20}%`, top: `${25 + (i % 2) * 35}%`,
                                                    animation: `particle-absorb ${1.8 + i * 0.2}s infinite ease-in ${i * 0.15}s`
                                                }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-[8px] md:text-[9px] text-center text-red-300 mt-1 font-bold">KOH</div>
                            </div>

                            <span className="text-slate-600 text-xs">→</span>

                            {/* Vent */}
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-slate-600 bg-slate-800 flex items-center justify-center">
                                <span className="text-[8px] text-slate-500">⇡</span>
                            </div>
                        </div>

                        {/* Particle Stream between furnace and tubes */}
                        {combustionStarted && !combustionComplete && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(8)].map((_, i) => (
                                    <div key={`stream${i}`} className={`absolute w-1 h-1 rounded-full ${i % 2 === 0 ? 'bg-blue-400/60' : 'bg-slate-400/60'}`}
                                        style={{
                                            left: `${30 + i * 5}%`, top: `${40 + (i % 3) * 8}%`,
                                            animation: `stream-flow ${2 + i * 0.3}s linear infinite ${i * 0.25}s`
                                        }} />
                                ))}
                            </div>
                        )}

                        {/* Progress bar */}
                        {combustionStarted && (
                            <div className="absolute bottom-4 left-8 right-8 md:left-16 md:right-16">
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 rounded-full" style={{ width: `${combustionProgress}%` }} />
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                                    <span>Combustion</span>
                                    <span className="font-mono">{combustionProgress}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
                        <Scale className="w-10 h-10 md:w-12 md:h-12 text-amber-400/60" />
                        <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Post-Combustion Weighing</div>
                        <div className="flex gap-8 md:gap-16">
                            {/* CaCl2 result */}
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-14 h-20 md:w-16 md:h-24 rounded-lg border-2 transition-all duration-500 flex items-center justify-center ${tube1FinalWeighed ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-blue-400/40 bg-blue-500/10 animate-pulse'
                                    }`}>
                                    <div className="w-8 h-12 md:w-10 md:h-16 bg-blue-300/20 rounded-md" />
                                </div>
                                <div className="text-[10px] font-bold text-blue-300">CaCl₂ Tube</div>
                                {tube1FinalWeighed && (
                                    <div className="text-center">
                                        <div className="font-mono text-xs text-emerald-300">{tube1FinalMass} g</div>
                                        <div className="font-mono text-[10px] text-amber-300">Δm₁ = {deltaM1.toFixed(4)} g (H₂O)</div>
                                    </div>
                                )}
                            </div>

                            {/* KOH result */}
                            <div className="flex flex-col items-center gap-2">
                                <div className={`w-14 h-20 md:w-16 md:h-24 rounded-lg border-2 transition-all duration-500 flex items-center justify-center ${tube2FinalWeighed ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-red-400/40 bg-red-500/10 animate-pulse'
                                    }`}>
                                    <div className="w-8 h-12 md:w-10 md:h-16 bg-red-300/20 rounded-md" />
                                </div>
                                <div className="text-[10px] font-bold text-red-300">KOH Tube</div>
                                {tube2FinalWeighed && (
                                    <div className="text-center">
                                        <div className="font-mono text-xs text-emerald-300">{tube2FinalMass} g</div>
                                        <div className="font-mono text-[10px] text-amber-300">Δm₂ = {deltaM2.toFixed(4)} g (CO₂)</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-4 px-4 overflow-y-auto py-4">
                        <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Lab Notebook — Empirical Formula Deduction</div>
                        <div className="w-full max-w-sm md:max-w-md space-y-2">
                            {/* Data summary */}
                            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 text-xs font-mono text-slate-300 space-y-1">
                                <div>Sample mass (m) = {sampleMass} g</div>
                                <div>Δm₁ (H₂O trapped) = {deltaM1.toFixed(4)} g</div>
                                <div>Δm₂ (CO₂ trapped) = {deltaM2.toFixed(4)} g</div>
                            </div>

                            {/* Step-by-step reveals */}
                            {calcStep >= 1 && (
                                <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 text-sm animate-in fade-in duration-500">
                                    <div className="text-blue-300 font-bold text-xs mb-1">%H = (2/18) × (Δm₁/m) × 100</div>
                                    <div className="font-mono text-blue-200 text-center text-lg">{calculatedPercentH}%</div>
                                </div>
                            )}
                            {calcStep >= 2 && (
                                <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-500/30 text-sm animate-in fade-in duration-500">
                                    <div className="text-slate-300 font-bold text-xs mb-1">%C = (12/44) × (Δm₂/m) × 100</div>
                                    <div className="font-mono text-slate-200 text-center text-lg">{calculatedPercentC}%</div>
                                </div>
                            )}
                            {calcStep >= 3 && (
                                <div className="p-3 bg-amber-900/30 rounded-lg border border-amber-500/30 text-sm animate-in fade-in duration-500">
                                    <div className="text-amber-300 font-bold text-xs mb-1">%O = 100 − %C − %H (by difference)</div>
                                    <div className="font-mono text-amber-200 text-center text-lg">{calculatedPercentO}%</div>
                                </div>
                            )}
                            {calcStep >= 4 && (
                                <div className="p-4 bg-emerald-900/30 rounded-lg border border-emerald-500/40 text-center animate-in zoom-in duration-500 shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                                    <div className="text-emerald-300 font-bold text-xs mb-2 uppercase tracking-widest">Empirical Formula</div>
                                    <div className="font-mono text-2xl text-emerald-200 font-bold">C₂H₆O</div>
                                    <div className="text-[10px] text-emerald-400/60 mt-1">Ethanol</div>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    const renderControls = () => {
        switch (phase) {
            case 1:
                return (
                    <div className="flex flex-col gap-3">
                        {/* Weighing buttons */}
                        {(!tube1Weighed || !tube2Weighed) && (
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleWeighTube('cacl2')} disabled={tube1Weighed}
                                    className={`py-3 px-4 rounded-lg font-bold border transition-all flex items-center justify-center gap-2 ${tube1Weighed ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                        }`}>
                                    <Scale size={14} /> {tube1Weighed ? '✓ CaCl₂ Weighed' : 'Weigh CaCl₂ Tube'}
                                </button>
                                <button onClick={() => handleWeighTube('koh')} disabled={tube2Weighed}
                                    className={`py-3 px-4 rounded-lg font-bold border transition-all flex items-center justify-center gap-2 ${tube2Weighed ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-red-600 hover:bg-red-500 border-red-400 text-white cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                                        }`}>
                                    <Scale size={14} /> {tube2Weighed ? '✓ KOH Weighed' : 'Weigh KOH Tube'}
                                </button>
                            </div>
                        )}

                        {/* Assembly buttons */}
                        {tube1Weighed && tube2Weighed && !assemblyCorrect && (
                            <div className="flex flex-col gap-3">
                                <div className="text-xs text-slate-400 text-center font-bold uppercase">Connect tubes to furnace (in order):</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleConnectTube('cacl2')}
                                        disabled={assemblyOrder.includes('cacl2') || assemblyError}
                                        className={`py-3 px-4 rounded-lg font-bold border transition-all cursor-pointer ${assemblyOrder.includes('cacl2') ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white'
                                            } ${assemblyError ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        Connect CaCl₂
                                    </button>
                                    <button onClick={() => handleConnectTube('koh')}
                                        disabled={assemblyOrder.includes('koh') || assemblyError}
                                        className={`py-3 px-4 rounded-lg font-bold border transition-all cursor-pointer ${assemblyOrder.includes('koh') ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-red-600 hover:bg-red-500 border-red-400 text-white'
                                            } ${assemblyError ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        Connect KOH
                                    </button>
                                </div>
                                {assemblyError && (
                                    <button onClick={handleResetAssembly}
                                        className="py-2 px-4 rounded-lg font-bold border border-amber-500/50 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 cursor-pointer text-sm flex items-center justify-center gap-2">
                                        <RefreshCcw size={14} /> Reset Assembly
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Proceed */}
                        {assemblyCorrect && (
                            <button onClick={() => setPhase(2)} className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer">
                                Proceed to Phase 2: Combustion <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div className="flex flex-col gap-3">
                        {!combustionStarted ? (
                            <button onClick={handleIgnite}
                                className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-orange-500/50 bg-orange-600 hover:bg-orange-500 text-white cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                                <Flame size={16} /> Ignite Furnace
                            </button>
                        ) : combustionComplete ? (
                            <button onClick={() => setPhase(3)}
                                className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer">
                                Proceed to Phase 3: Weigh Tubes <ArrowRight size={16} />
                            </button>
                        ) : (
                            <div className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-orange-500/30 bg-orange-500/10 text-orange-300">
                                <Flame size={16} className="animate-pulse" /> Combustion in progress...
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleWeighFinal('cacl2')} disabled={tube1FinalWeighed}
                                className={`py-3 px-4 rounded-lg font-bold border transition-all flex items-center justify-center gap-2 ${tube1FinalWeighed ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white cursor-pointer'
                                    }`}>
                                <Scale size={14} /> {tube1FinalWeighed ? `✓ ${tube1FinalMass} g` : 'Re-weigh CaCl₂'}
                            </button>
                            <button onClick={() => handleWeighFinal('koh')} disabled={tube2FinalWeighed}
                                className={`py-3 px-4 rounded-lg font-bold border transition-all flex items-center justify-center gap-2 ${tube2FinalWeighed ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-red-600 hover:bg-red-500 border-red-400 text-white cursor-pointer'
                                    }`}>
                                <Scale size={14} /> {tube2FinalWeighed ? `✓ ${tube2FinalMass} g` : 'Re-weigh KOH'}
                            </button>
                        </div>
                        {tube1FinalWeighed && tube2FinalWeighed && (
                            <button onClick={() => setPhase(4)} className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer mt-2">
                                Data Collected! Proceed to Phase 4: Calculate <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                );

            case 4:
                return (
                    <div className="flex flex-col gap-3">
                        {calcStep < 4 ? (
                            <button onClick={handleCalcStep}
                                className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-purple-500/50 bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-[0_0_15px_rgba(147,51,234,0.4)]">
                                {calcStep === 0 ? 'Calculate %Hydrogen' : calcStep === 1 ? 'Calculate %Carbon' : calcStep === 2 ? 'Deduce %Oxygen' : 'Derive Empirical Formula'}
                            </button>
                        ) : (
                            <button onClick={handleReset}
                                className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer">
                                <CheckCircle2 size={16} /> Analysis Complete — Restart Simulation
                            </button>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="w-full h-full flex flex-col text-slate-100 font-sans bg-slate-900 absolute inset-0">
            {/* Top Navigation / Progress */}
            <div className="flex border-b border-slate-800 p-4 gap-2 bg-slate-950 shrink-0 overflow-x-auto">
                {[
                    { p: 1, label: 'Assembly' },
                    { p: 2, label: 'Combustion' },
                    { p: 3, label: 'Weighing' },
                    { p: 4, label: 'Calculation' }
                ].map(({ p, label }) => (
                    <button key={p} onClick={() => { if (p < phase) setPhase(p as Phase); }}
                        disabled={p > phase}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${phase === p ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                                p < phase ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-pointer hover:bg-slate-700' :
                                    'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                            }`}>
                        Phase {p}: {label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative flex flex-col overflow-hidden">
                {/* System Message Banner */}
                <div className="p-4 bg-slate-800/80 border-b border-slate-700 backdrop-blur-sm z-10 min-h-[80px] flex items-center justify-center text-center shadow-lg">
                    <p className="text-sm md:text-base font-medium text-slate-200 leading-relaxed max-w-3xl">
                        {systemMessage}
                    </p>
                </div>

                {/* Central Visualization */}
                <div className="flex-1 relative bg-slate-900 flex items-center justify-center p-4 md:p-8">
                    <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                    <div className="relative z-10 w-full max-w-2xl aspect-video bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
                        {renderLabVisualization()}

                        {/* Molecular Lens Overlay */}
                        {showMoleculeLens && (
                            <div className="absolute inset-x-4 md:inset-x-8 bottom-4 md:bottom-8 md:top-8 md:bottom-auto p-4 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in duration-300 text-center">
                                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Molecular Lens Active
                                </div>
                                {lensContent}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Controls Area */}
            <div className="bg-slate-950 border-t border-slate-800 p-4 md:p-6 shrink-0">
                <div className="max-w-3xl mx-auto block">
                    {renderControls()}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
          @keyframes particle-absorb {
            0% { opacity: 0; transform: translateY(0) scale(0.5); }
            30% { opacity: 1; transform: translateY(-5px) scale(1); }
            70% { opacity: 1; transform: translateY(-10px) scale(1.2); }
            100% { opacity: 0; transform: translateY(-15px) scale(0); }
          }
          @keyframes stream-flow {
            0% { transform: translateX(0); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateX(120px); opacity: 0; }
          }
        `
            }} />
        </div>
    );
};

export default QuantitativeAnalysisCanvas;
