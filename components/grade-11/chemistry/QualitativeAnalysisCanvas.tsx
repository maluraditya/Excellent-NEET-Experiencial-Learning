import React, { useState, useEffect, useRef } from 'react';
import { RefreshCcw, FlaskConical, TestTube, Flame, Droplet, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

type Phase = 1 | 2 | 3 | 4 | 5;

const QualitativeAnalysisCanvas: React.FC = () => {
    const [phase, setPhase] = useState<Phase>(1);
    const [systemMessage, setSystemMessage] = useState('Welcome to Qualitative Analysis. We have an Unknown Organic Compound (contains C, H, N, S, Cl). Try testing directly for Chlorine (Cl) using AgNO₃.');

    // Phase 1 specific state
    const [phase1Tested, setPhase1Tested] = useState(false);

    // Phase 2 specific state
    const [fusionStep, setFusionStep] = useState(0); // 0: initial, 1: heated Na, 2: heated compound, 3: extracted (SFE ready)

    // Phase 3 specific state
    const [nitrogenStep, setNitrogenStep] = useState(0); // 0: initial, 1: added FeSO4, 2: added H2SO4 (Prussian Blue)

    // Phase 4 specific state
    const [sulphurTest, setSulphurTest] = useState<'none' | 'lead-acetate' | 'nitroprusside'>('none');

    // Phase 5 specific state
    const [halogenStep, setHalogenStep] = useState(0); // 0: initial, 1: error (Ag2S/AgCN), 2: HNO3 added, 3: AgNO3 added (AgCl)

    // Molecular View states
    const [showMoleculeLens, setShowMoleculeLens] = useState(false);
    const [lensContent, setLensContent] = useState<React.ReactNode>(null);

    const handleReset = () => {
        setPhase(1);
        setPhase1Tested(false);
        setFusionStep(0);
        setNitrogenStep(0);
        setSulphurTest('none');
        setHalogenStep(0);
        setSystemMessage('Welcome to Qualitative Analysis. We have an Unknown Organic Compound (contains C, H, N, S, Cl). Try testing directly for Chlorine (Cl) using AgNO₃.');
        setShowMoleculeLens(false);
    };

    const triggerLens = (content: React.ReactNode, duration: number = 4000) => {
        setLensContent(content);
        setShowMoleculeLens(true);
        setTimeout(() => setShowMoleculeLens(false), duration);
    };

    // Phase 1 Actions
    const handleDirectTest = () => {
        setPhase1Tested(true);
        setSystemMessage('Organic compounds are covalent. Ag⁺ cannot find free Cl⁻ ions. You must break the bonds first!');
        triggerLens(
            <div className="flex flex-col items-center justify-center text-center gap-2">
                <div className="font-mono text-lg font-bold text-slate-300">R-Cl + Ag⁺</div>
                <div className="text-red-400 font-bold text-2xl">✗ NO REACTION</div>
                <div className="text-sm text-slate-400">Covalent bonds prevent ionization</div>
            </div>
        );
    };

    // Phase 2 Actions
    const handleFusionAction = (action: string) => {
        if (action === 'heat-na' && fusionStep === 0) {
            setFusionStep(1);
            setSystemMessage('Sodium metal heated to a silvery ball. Now add the organic compound and heat to red hot.');
        } else if (action === 'heat-compound' && fusionStep === 1) {
            setFusionStep(2);
            setSystemMessage('Compound heated to red hot with Sodium! Now plunge it into distilled water.');
        } else if (action === 'extract' && fusionStep === 2) {
            setFusionStep(3);
            setSystemMessage('💥 Covalent bonds broken! Heteroatoms are now water-soluble ionic salts (Sodium Fusion Extract). Proceed to Phase 3.');
            triggerLens(
                <div className="flex flex-col items-center justify-center text-center gap-2 animate-in zoom-in duration-500">
                    <div className="text-xl">Na + C + N + S + Cl</div>
                    <ArrowRight className="text-emerald-400 animate-pulse" />
                    <div className="font-mono text-lg font-bold text-emerald-300">
                        Na⁺CN⁻ &nbsp; Na⁺₂S²⁻ &nbsp; Na⁺Cl⁻
                    </div>
                    <div className="text-sm text-slate-400 mt-2">Covalent structured shattered into ionic salts!</div>
                </div>, 5000
            );
        }
    };

    // Phase 3 Actions
    const handleNitrogenAction = (action: string) => {
        if (action === 'feso4' && nitrogenStep === 0) {
            setNitrogenStep(1);
            setSystemMessage('FeSO₄ added and boiled. Hexacyanidoferrate(II) complex formed. Now add conc. H₂SO₄.');
        } else if (action === 'h2so4' && nitrogenStep === 1) {
            setNitrogenStep(2);
            setSystemMessage('Nitrogen Detected! Cyanide ions bonded with Iron to form Iron(III) hexacyanidoferrate(II) (Prussian Blue). Proceed to Phase 4.');
        }
    };

    // Phase 4 Actions
    const handleSulphurAction = (action: 'lead-acetate' | 'nitroprusside') => {
        setSulphurTest(action);
        if (action === 'lead-acetate') {
            setSystemMessage('Sulphur Detected! Black precipitate of Lead Sulphide (PbS) confirms S²⁻ ions.');
        } else {
            setSystemMessage('Sulphur Detected! Violet coloration confirms S²⁻ ions.');
        }
    };

    // Phase 5 Actions
    const handleHalogenAction = (action: string) => {
        if (action === 'direct-agno3' && halogenStep === 0) {
            setHalogenStep(1);
            setSystemMessage('ERROR! The CN⁻ and S²⁻ ions interfered, forming dirty AgCN and Ag₂S. You must remove them first by boiling with HNO₃!');
        } else if (action === 'boil-hno3' && (halogenStep === 0 || halogenStep === 1)) {
            setHalogenStep(2);
            setSystemMessage('Boiling with HNO₃ expelled HCN and H₂S gases. Interfering ions removed! Now add AgNO₃.');
            triggerLens(
                <div className="flex flex-col items-center justify-center text-center gap-2 animate-in slide-in-from-bottom duration-500">
                    <div className="font-mono text-md text-amber-300">NaCN + HNO₃ → NaNO₃ + HCN↑ </div>
                    <div className="font-mono text-md text-amber-300">Na₂S + 2HNO₃ → 2NaNO₃ + H₂S↑ </div>
                    <div className="text-sm text-slate-400 mt-2">Interfering gases boiled off!</div>
                </div>
            );
        } else if (action === 'add-agno3' && halogenStep === 2) {
            setHalogenStep(3);
            setSystemMessage('Chlorine Detected! Pure white precipitate (AgCl) formed. Analysis Complete!');
        }
    };

    // Renders the central lab visualization based on phase
    const renderLabVisualization = () => {
        switch (phase) {
            case 1:
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative w-32 h-40">
                            {/* Beaker with unknown compound */}
                            <div className="absolute bottom-0 w-24 h-28 left-4 border-b-4 border-l-4 border-r-4 border-white/20 rounded-b-xl overflow-hidden bg-slate-800/50">
                                <div className="absolute bottom-0 w-full h-1/2 bg-amber-900/40" />
                            </div>

                            {/* Dropper animation if tested */}
                            {phase1Tested && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-16 bg-blue-400/20 rounded-t-full border border-blue-400/50 animate-[drip_2s_ease-in-out]">
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-300 animate-ping" />
                                </div>
                            )}
                        </div>
                        <div className="mt-6 text-sm font-bold text-slate-400 uppercase tracking-widest">Raw Organic Compound</div>
                        <div className="text-xs text-slate-500 mt-1">(Covalent Lattice)</div>
                    </div>
                );
            case 2:
                let tubeColor = 'bg-transparent';
                let waterReaction = false;
                if (fusionStep === 1) tubeColor = 'bg-slate-300/80 shadow-[0_0_15px_rgba(203,213,225,0.8)]'; // Na ball
                if (fusionStep === 2) tubeColor = 'bg-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse'; // Red hot
                if (fusionStep === 3) waterReaction = true;

                return (
                    <div className="flex flex-col items-center justify-center h-full relative">
                        {waterReaction ? (
                            <div className="flex flex-col items-center">
                                {/* Funnel and flask */}
                                <div className="relative w-24 h-40">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-12 border-l-2 border-r-2 border-slate-400 bg-slate-800 rounded-t border-t-0" style={{ clipPath: 'polygon(0 0, 100% 0, 60% 100%, 40% 100%)' }}>
                                        <div className="absolute inset-x-2 top-0 h-full bg-slate-200/5" />
                                    </div>
                                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-2 h-8 border-l border-r border-slate-400 bg-emerald-400/20" />
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 border-2 border-slate-400 rounded-full bg-slate-800/50 overflow-hidden">
                                        <div className="absolute bottom-0 w-full h-1/2 bg-emerald-400/30 shadow-[0_-5px_20px_rgba(52,211,154,0.3)] animate-[wave_3s_ease-in-out_infinite]" />
                                    </div>
                                    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-300 animate-[drip_1s_infinite]" />
                                </div>
                                <div className="mt-4 text-sm font-bold text-emerald-400 uppercase tracking-widest">Sodium Fusion Extract (SFE)</div>
                                <div className="text-xs text-slate-500 mt-1">Ionic Phase Generated</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                {/* Ignition Tube */}
                                <div className="relative w-6 h-24 border-2 border-slate-400 rounded-b-full bg-slate-800/50 overflow-hidden flex items-end justify-center pb-2 transition-all duration-500">
                                    <div className={`w-3 h-3 rounded-full transition-all duration-1000 ${tubeColor}`} />
                                </div>
                                <Flame className={`w-10 h-10 ${fusionStep > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-600'}`} />
                            </div>
                        )}
                    </div>
                );
            case 3:
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative w-20 h-32 border-2 border-white/20 rounded-b-full overflow-hidden bg-slate-800/50">
                            <div className={`absolute bottom-0 w-full transition-all duration-1000 ${nitrogenStep === 0 ? 'h-1/3 bg-emerald-400/30' :
                                nitrogenStep === 1 ? 'h-1/2 bg-emerald-600/60' :
                                    'h-3/4 bg-blue-800 shadow-[0_0_30px_rgba(30,64,175,0.8)]'
                                }`} />
                            {nitrogenStep === 2 && (
                                <div className="absolute inset-0 bg-blue-500/10 animate-pulse pointer-events-none" />
                            )}
                        </div>
                        <div className="mt-6 text-sm font-bold uppercase tracking-widest transition-colors duration-500 text-blue-400">
                            {nitrogenStep === 2 ? 'Prussian Blue Formed' : 'Nitrogen Test (SFE)'}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-8">
                        <div className="flex gap-12">
                            {/* Lead Acetate Tube */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-16 h-28 border-2 border-white/20 rounded-b-full overflow-hidden bg-slate-800/50">
                                    <div className={`absolute bottom-0 w-full h-1/2 transition-all duration-1000 ${sulphurTest === 'lead-acetate' ? 'bg-black shadow-[inset_0_-10px_20px_rgba(0,0,0,0.8)]' : 'bg-emerald-400/30'
                                        }`} />
                                </div>
                                <div className="mt-3 text-xs font-bold text-slate-400">Lead Acetate Test</div>
                                {sulphurTest === 'lead-acetate' && <span className="text-white font-mono mt-1 text-xs">PbS (Black ppt)</span>}
                            </div>

                            {/* Nitroprusside Tube */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-16 h-28 border-2 border-white/20 rounded-b-full overflow-hidden bg-slate-800/50">
                                    <div className={`absolute bottom-0 w-full h-1/2 transition-all duration-1000 ${sulphurTest === 'nitroprusside' ? 'bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.6)]' : 'bg-emerald-400/30'
                                        }`} />
                                </div>
                                <div className="mt-3 text-xs font-bold text-slate-400">Nitroprusside Test</div>
                                {sulphurTest === 'nitroprusside' && <span className="text-purple-300 font-mono mt-1 text-xs">Violet Complex</span>}
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative w-20 h-32 border-2 border-white/20 rounded-b-full overflow-hidden bg-slate-800/50">
                            <div className={`absolute bottom-0 w-full h-1/2 transition-all duration-1000 ${halogenStep === 0 ? 'bg-emerald-400/30' :
                                halogenStep === 1 ? 'bg-[#4a3f35] flex items-end justify-center pb-2' :
                                    halogenStep === 2 ? 'bg-emerald-400/30 animate-[bubble_1s_infinite]' :
                                        'bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.6)]'
                                }`}>
                                {halogenStep === 1 && <div className="text-[8px] text-white/50 text-center uppercase tracking-tighter">Dirty ppt<br />(AgCN/Ag₂S)</div>}
                                {halogenStep === 3 && <div className="absolute inset-0 flex items-center justify-center"><div className="w-16 h-8 bg-white/90 rounded-full blur-sm" /></div>}
                            </div>
                            {halogenStep === 2 && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="absolute w-1 h-1 bg-white/40 rounded-full" style={{ left: `${20 + i * 15}%`, animation: `bubble-up ${1 + i * 0.2}s infinite linear ${i * 0.1}s` }} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="mt-6 text-sm font-bold uppercase tracking-widest transition-colors duration-500 text-slate-300">
                            {halogenStep === 0 ? 'Halogen Test (SFE)' :
                                halogenStep === 1 ? <span className="text-red-400">Interference Detected</span> :
                                    halogenStep === 2 ? <span className="text-amber-400">Boiling off Impurities...</span> :
                                        <span className="text-white">Pure AgCl Precipitate</span>}
                        </div>
                    </div>
                );
        }
    };

    // Render control buttons based on phase
    const renderControls = () => {
        switch (phase) {
            case 1:
                return (
                    <div className="flex flex-col gap-3">
                        <button onClick={handleDirectTest} disabled={phase1Tested}
                            className={`py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border transition-all ${phase1Tested ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                }`}>
                            <Droplet size={16} /> Add AgNO₃ Directly
                        </button>
                        {phase1Tested && (
                            <button onClick={() => setPhase(2)} className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer">
                                Proceed to Phase 2: Sodium Fusion <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                );
            case 2:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button onClick={() => handleFusionAction('heat-na')} disabled={fusionStep !== 0}
                            className={`py-3 px-4 rounded-lg text-xs font-bold transition-all border ${fusionStep === 0 ? 'bg-slate-700 border-slate-500 text-white cursor-pointer hover:bg-slate-600' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                }`}>
                            {fusionStep > 0 ? '✓ Na Heated' : '1. Heat Na Metal'}
                        </button>
                        <button onClick={() => handleFusionAction('heat-compound')} disabled={fusionStep !== 1}
                            className={`py-3 px-4 rounded-lg text-xs font-bold transition-all border ${fusionStep === 1 ? 'bg-orange-600 border-orange-400 text-white cursor-pointer hover:bg-orange-500' :
                                fusionStep > 1 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                                }`}>
                            {fusionStep > 1 ? '✓ Compound Fused' : '2. Add Cmpd & Heat'}
                        </button>
                        <button onClick={() => handleFusionAction('extract')} disabled={fusionStep !== 2}
                            className={`py-3 px-4 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 ${fusionStep === 2 ? 'bg-cyan-600 border-cyan-400 text-white cursor-pointer hover:bg-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.5)]' :
                                fusionStep > 2 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                                }`}>
                            {fusionStep > 2 ? '✓ Extract Prepared' : '3. Plunge in Water & Filter'}
                        </button>
                        {fusionStep === 3 && (
                            <button onClick={() => setPhase(3)} className="md:col-span-3 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer mt-2">
                                Extract Ready! Proceed to Phase 3: Tests <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                );
            case 3:
                return (
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleNitrogenAction('feso4')} disabled={nitrogenStep !== 0}
                                className={`py-3 px-4 rounded-lg font-bold border ${nitrogenStep === 0 ? 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-white cursor-pointer' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                    }`}>
                                {nitrogenStep > 0 ? '✓ FeSO₄ Added' : 'Add FeSO₄ & Boil'}
                            </button>
                            <button onClick={() => handleNitrogenAction('h2so4')} disabled={nitrogenStep !== 1}
                                className={`py-3 px-4 rounded-lg font-bold border ${nitrogenStep === 1 ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.5)]' :
                                    nitrogenStep > 1 ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                                    }`}>
                                {nitrogenStep > 1 ? '✓ Prussian Blue!' : 'Add conc. H₂SO₄'}
                            </button>
                        </div>
                        {nitrogenStep === 2 && (
                            <button onClick={() => setPhase(4)} className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer mt-2">
                                N Confirmed. Proceed to Phase 4: Sulphur <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                );
            case 4:
                return (
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleSulphurAction('lead-acetate')}
                                className={`py-3 px-4 rounded-lg font-bold border cursor-pointer transition-all ${sulphurTest === 'lead-acetate' ? 'bg-slate-800 border-slate-500 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300'
                                    }`}>
                                Add Acetic acid + Lead Acetate
                            </button>
                            <button onClick={() => handleSulphurAction('nitroprusside')}
                                className={`py-3 px-4 rounded-lg font-bold border cursor-pointer transition-all ${sulphurTest === 'nitroprusside' ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300'
                                    }`}>
                                Add Sodium Nitroprusside
                            </button>
                        </div>
                        {sulphurTest !== 'none' && (
                            <button onClick={() => setPhase(5)} className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer mt-2">
                                S Confirmed. Proceed to Phase 5: Halogens <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                );
            case 5:
                return (
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button onClick={() => handleHalogenAction('direct-agno3')} disabled={halogenStep !== 0}
                                className={`py-3 px-4 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 ${halogenStep === 0 ? 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-white cursor-pointer' :
                                    halogenStep === 1 ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed hidden md:flex'
                                    }`}>
                                {halogenStep === 1 ? <><ShieldAlert size={14} /> Interference!</> : '1. Add AgNO₃ Directly'}
                            </button>

                            <button onClick={() => handleHalogenAction('boil-hno3')} disabled={(halogenStep !== 0 && halogenStep !== 1)}
                                className={`py-3 px-4 rounded-lg text-xs font-bold transition-all border ${(halogenStep === 0 || halogenStep === 1) ? 'bg-orange-600 hover:bg-orange-500 border-orange-400 text-white cursor-pointer shadow-[0_0_15px_rgba(234,88,12,0.4)]' :
                                    halogenStep >= 2 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : ''
                                    }`}>
                                {halogenStep >= 2 ? '✓ Boiled with HNO₃' : 'Boil with conc. HNO₃'}
                            </button>

                            <button onClick={() => handleHalogenAction('add-agno3')} disabled={halogenStep !== 2}
                                className={`py-3 px-4 rounded-lg text-xs font-bold transition-all border ${halogenStep === 2 ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.4)]' :
                                    halogenStep === 3 ? 'bg-white/20 border-white/50 text-white' : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                                    }`}>
                                {halogenStep === 3 ? '✓ AgCl Precipitated' : 'Add AgNO₃'}
                            </button>
                        </div>
                        {halogenStep === 3 && (
                            <button onClick={handleReset} className="py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer mt-2">
                                <CheckCircle2 size={16} /> Analysis Complete - Restart Simulation
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
                    { p: 1, label: 'Trap' },
                    { p: 2, label: 'Lassaigne\'s' },
                    { p: 3, label: 'Nitrogen' },
                    { p: 4, label: 'Sulphur' },
                    { p: 5, label: 'Halogens' }
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
                <div className="flex-1 relative bg-slate-900 flex items-center justify-center p-8">
                    {/* Workbench background gradient */}
                    <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />

                    {/* The current visualization */}
                    <div className="relative z-10 w-full max-w-2xl aspect-video bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
                        {renderLabVisualization()}

                        {/* Molecular Lens Overlay */}
                        {showMoleculeLens && (
                            <div className="absolute inset-x-8 bottom-8 md:top-8 md:bottom-auto p-4 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in duration-300 text-center">
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
                @keyframes drip {
                    0% { transform: translate(-50%, 0) scale(0); opacity: 0; }
                    50% { transform: translate(-50%, 15px) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, 40px) scale(0.5); opacity: 0; }
                }
                @keyframes wave {
                    0% { transform: translateY(5px); }
                    50% { transform: translateY(-5px); }
                    100% { transform: translateY(5px); }
                }
                @keyframes bubble-up {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
                }
             `
            }} />
        </div>
    );
};

export default QualitativeAnalysisCanvas;
