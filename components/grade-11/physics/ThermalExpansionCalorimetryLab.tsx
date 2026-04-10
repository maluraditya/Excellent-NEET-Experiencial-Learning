import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Thermometer, Layers, Droplets, Activity, Flame, Maximize2, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ThermalExpansionCalorimetryLabProps {
    topic: any;
    onExit: () => void;
}

type Station = 'expansion' | 'calorimetry' | 'phase_change';
type MaterialKey = 'aluminum' | 'copper' | 'steel' | 'glass' | 'water';
type DimensionMode = 'linear' | 'area' | 'volume';
type SolidMaterialKey = 'aluminum' | 'copper' | 'lead';

const EXPANSION_MATERIALS: Record<MaterialKey, { label: string; alpha: number; color: string; type: 'solid' | 'liquid' }> = {
    aluminum: { label: 'Aluminum', alpha: 25e-6, color: '#94a3b8', type: 'solid' },
    copper: { label: 'Copper', alpha: 17e-6, color: '#d97706', type: 'solid' },
    steel: { label: 'Steel', alpha: 12e-6, color: '#64748b', type: 'solid' },
    glass: { label: 'Glass', alpha: 9e-6, color: '#38bdf8', type: 'solid' },
    water: { label: 'Water', alpha: 210e-6, color: '#0ea5e9', type: 'liquid' } // alpha is average volumetric, but we use special function for anomalous 0-10C
};

const CALORIMETRY_SOLIDS: Record<SolidMaterialKey, { label: string; c: number; color: string; rho: number }> = {
    aluminum: { label: 'Aluminum', c: 900, color: '#94a3b8', rho: 2700 },
    copper: { label: 'Copper', c: 385, color: '#d97706', rho: 8960 },
    lead: { label: 'Lead', c: 128, color: '#475569', rho: 11340 }
};

const WATER_C = 4186; // J/(kg K)
const L_FUSION = 3.33e5; // J/kg
const L_VAPOR = 2.26e6; // J/kg

const STATIONS: { key: Station; label: string; accent: string; icon: React.ReactNode }[] = [
    { key: 'expansion', label: 'Expansion', accent: '#f97316', icon: <Maximize2 size={18} /> },
    { key: 'phase_change', label: 'Phase Change', accent: '#06b6d4', icon: <Flame size={18} /> },
    { key: 'calorimetry', label: 'Calorimetry', accent: '#f43f5e', icon: <Thermometer size={18} /> },
];

const AMBIENT_TEMP = 20;

const ThermalExpansionCalorimetryLab: React.FC<ThermalExpansionCalorimetryLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    const [station, setStation] = useState<Station>('expansion');
    
    // Station 1: Expansion State
    const [expMaterial, setExpMaterial] = useState<MaterialKey>('copper');
    const [expDimension, setExpDimension] = useState<DimensionMode>('linear');
    const [expTemp, setExpTemp] = useState(20);

    // Station 2: Phase Change State
    const [phaseHeaterPower, setPhaseHeaterPower] = useState(500); // W
    const [phaseIceMass, setPhaseIceMass] = useState(50); // g
    const [phaseTime, setPhaseTime] = useState(0); // seconds passed
    const [phasePlaying, setPhasePlaying] = useState(false);
    
    // Station 3: Calorimetry State
    const [calHotMat, setCalHotMat] = useState<SolidMaterialKey>('copper');
    const [calHotMass, setCalHotMass] = useState(50); // g
    const [calHotTemp, setCalHotTemp] = useState(100); // C
    const [calWaterMass, setCalWaterMass] = useState(200); // g
    const [calWaterTemp, setCalWaterTemp] = useState(20); // C
    const [calDropped, setCalDropped] = useState(false);
    const [calMixTime, setCalMixTime] = useState(0);

    const stateRef = useRef({
        station,
        expMaterial, expDimension, expTemp,
        phaseHeaterPower, phaseIceMass, phaseTime, phasePlaying,
        calHotMat, calHotMass, calHotTemp, calWaterMass, calWaterTemp, calDropped, calMixTime
    });

    useEffect(() => {
        stateRef.current = {
            station,
            expMaterial, expDimension, expTemp,
            phaseHeaterPower, phaseIceMass, phaseTime, phasePlaying,
            calHotMat, calHotMass, calHotTemp, calWaterMass, calWaterTemp, calDropped, calMixTime
        };
    }, [station, expMaterial, expDimension, expTemp, phaseHeaterPower, phaseIceMass, phaseTime, phasePlaying, calHotMat, calHotMass, calHotTemp, calWaterMass, calWaterTemp, calDropped, calMixTime]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        resizeObserver.observe(parent);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        return () => resizeObserver.disconnect();
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        if (W < 10 || H < 10) {
            animRef.current = requestAnimationFrame(draw);
            return;
        }

        const state = stateRef.current;
        const time = Date.now() * 0.001;

        ctx.clearRect(0, 0, W, H);

        const pad = Math.min(W * 0.03, H * 0.03, 16);
        const gap = pad;
        const availableW = W - pad * 2 - gap;
        const leftWidth = availableW * 0.55;
        const rightWidth = availableW - leftWidth;
        // Decrease padding at the bottom by ensuring availableH leaves enough space
        const availableH = H - pad * 2; // Reduced bottom padding constraint
        
        const leftX = pad;
        const rightX = pad + leftWidth + gap;
        const topSectionY = pad;

        // Draw left visually-appealing box (Simulation)
        ctx.fillStyle = '#f8fafc';
        roundRect(ctx, leftX, topSectionY, leftWidth, availableH, 12);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
        roundRect(ctx, leftX, topSectionY, leftWidth, availableH, 12);
        ctx.stroke();

        // Draw right mathematically-focused box (Graph)
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, rightX, topSectionY, rightWidth, availableH, 12);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
        roundRect(ctx, rightX, topSectionY, rightWidth, availableH, 12);
        ctx.stroke();

        const fs = (base: number) => Math.max(9, Math.min(base, W * 0.02, H * 0.03));

        if (state.station === 'expansion') {
            drawExpansionScene(ctx, { x: leftX, y: topSectionY, w: leftWidth, h: availableH, state, fs, time, pad });
            drawExpansionGraph(ctx, { x: rightX, y: topSectionY, w: rightWidth, h: availableH, state, fs, pad });
        } else if (state.station === 'phase_change') {
            drawPhaseChangeScene(ctx, { x: leftX, y: topSectionY, w: leftWidth, h: availableH, state, fs, time, pad });
            drawPhaseChangeGraph(ctx, { x: rightX, y: topSectionY, w: rightWidth, h: availableH, state, fs, pad });
            
            if (state.phasePlaying) {
                const stats = calculatePhaseState(state.phaseIceMass, state.phaseHeaterPower, state.phaseTime);
                if (state.phaseTime >= stats.totalTimeRequired) {
                    setPhasePlaying(false);
                } else {
                    setPhaseTime(prev => prev + 0.5); // Fast forward time
                }
            }
        } else {
            drawCalorimetryScene(ctx, { x: leftX, y: topSectionY, w: leftWidth, h: availableH, state, fs, time, pad });
            drawCalorimetryGraph(ctx, { x: rightX, y: topSectionY, w: rightWidth, h: availableH, state, fs, pad });
            
            if (state.calDropped && state.calMixTime < 1) {
                setCalMixTime(prev => Math.min(1, prev + 0.02));
            }
        }

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const resetPhase = () => { setPhaseTime(0); setPhasePlaying(false); };
    const resetCalorimetry = () => { setCalDropped(false); setCalMixTime(0); };
    const resetLab = () => {
        setStation('expansion');
        setExpMaterial('copper'); setExpDimension('linear'); setExpTemp(20);
        setPhaseTime(0); setPhasePlaying(false);
        setCalDropped(false); setCalMixTime(0);
    };

    // Derived logic calculations to show in descriptions and UI
    let expVal = 0;
    if (station === 'expansion') {
        if (expMaterial === 'water') {
            expVal = getWaterVolumeFactor(expTemp);
        } else {
            const alpha = EXPANSION_MATERIALS[expMaterial].alpha;
            const deltaT = expTemp - 20; // Assume 20C is base
            expVal = 1 + (expDimension === 'linear' ? alpha : expDimension === 'area' ? 2 * alpha : 3 * alpha) * deltaT;
        }
    }

    // Phase Change logic
    const { phaseTemp, phaseStateLabel, totalTimeRequired } = calculatePhaseState(phaseIceMass, phaseHeaterPower, phaseTime);
    
    // Calorimetry Mixing logic
    const m1 = calHotMass * 1e-3, c1 = CALORIMETRY_SOLIDS[calHotMat].c, T1 = calHotTemp;
    const m2 = calWaterMass * 1e-3, c2 = WATER_C, T2 = calWaterTemp;
    const Tf = (m1*c1*T1 + m2*c2*T2) / (m1*c1 + m2*c2);
    const calCurrentTempHot = calDropped ? T1 - (T1 - Tf) * Math.sin(calMixTime * Math.PI / 2) : T1;
    const calCurrentTempCold = calDropped ? T2 + (Tf - T2) * Math.sin(calMixTime * Math.PI / 2) : T2;

    const descriptions = getDescriptions(station, { expMaterial, expDimension, calDropped, phaseStateLabel });

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative w-full h-full">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-4 w-full text-slate-700 p-2 relative">
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex gap-2">
                    {STATIONS.map((item) => (
                        <button key={item.key} onClick={() => setStation(item.key)} className={`flex-1 flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 font-bold text-sm transition-all shadow-sm active:scale-95 ${station === item.key ? 'text-white border-transparent shadow-lg scale-105' : 'bg-white text-slate-600 border-slate-200'}`} style={station === item.key ? { backgroundColor: item.accent } : {}}>
                            {item.icon} <span className="hidden md:inline">{item.label}</span>
                        </button>
                    ))}
                </div>

                {station === 'expansion' && (
                    <div className="flex flex-col gap-4">
                        <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
                            <SliderRow label="Temperature" valueLabel={`${expTemp} °C`} minLabel={expMaterial === 'water' ? '0 °C' : '20 °C'} maxLabel={expMaterial === 'water' ? '15 °C' : '400 °C'}>
                                <input type="range" min={expMaterial === 'water' ? 0 : 20} max={expMaterial === 'water' ? 15 : 400} step={expMaterial === 'water' ? 0.2 : 10} value={expTemp} onChange={(e) => setExpTemp(Number(e.target.value))} className="w-full accent-orange-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                            </SliderRow>
                            
                            <div className="pt-2">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Dimension</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {['linear', 'area', 'volume'].map((d) => (
                                        <button key={d} onClick={() => setExpDimension(d as DimensionMode)} disabled={expMaterial === 'water' && d !== 'volume'} className={`text-xs p-2 rounded-lg font-bold border transition-colors ${expDimension === d ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 text-slate-600 border-slate-200'} disabled:opacity-30 disabled:cursor-not-allowed`}>
                                            {d.charAt(0).toUpperCase() + d.slice(1)} ({d === 'linear' ? '1D' : d === 'area' ? '2D' : '3D'})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Material</div>
                                <div className="flex flex-wrap gap-2">
                                    {(Object.keys(EXPANSION_MATERIALS) as MaterialKey[]).map((key) => (
                                        <button key={key} onClick={() => { setExpMaterial(key); if (key === 'water') { setExpDimension('volume'); setExpTemp(4); } else if (expMaterial === 'water') { setExpTemp(20); } }} className={`flex-1 min-w-[75px] rounded-xl px-2 py-2 text-xs md:text-sm font-bold border transition-all ${expMaterial === key ? 'text-white border-transparent shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`} style={expMaterial === key ? { backgroundColor: EXPANSION_MATERIALS[key].color } : {}}>
                                            {EXPANSION_MATERIALS[key].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {station === 'phase_change' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                        <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
                            <SliderRow label="Ice Mass" valueLabel={`${phaseIceMass} g`} minLabel="10 g" maxLabel="100 g">
                                <input type="range" min="10" max="100" step="5" value={phaseIceMass} onChange={(e) => {setPhaseIceMass(Number(e.target.value)); setPhaseTime(0);}} disabled={phasePlaying} className="w-full accent-cyan-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
                            </SliderRow>
                            <SliderRow label="Heater Power" valueLabel={`${phaseHeaterPower} W`} minLabel="100 W" maxLabel="1000 W">
                                <input type="range" min="100" max="1000" step="50" value={phaseHeaterPower} onChange={(e) => {setPhaseHeaterPower(Number(e.target.value)); setPhaseTime(0);}} disabled={phasePlaying} className="w-full accent-red-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
                            </SliderRow>
                        </div>
                        <div className="flex flex-col gap-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200 justify-center">
                           <div className="flex gap-2">
                               <button onClick={() => setPhasePlaying(!phasePlaying)} disabled={phaseTime >= totalTimeRequired} className={`flex-1 py-3 font-bold rounded-xl text-white transition-transform active:scale-95 ${phasePlaying ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'} disabled:opacity-50`}>
                                   {phasePlaying ? 'PAUSE HEATING' : (phaseTime > 0 ? 'RESUME HEATING' : 'START HEATING')}
                               </button>
                               <button onClick={resetPhase} className="px-5 py-3 font-bold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                   RESET
                               </button>
                           </div>
                           <div className="text-center text-sm font-medium text-slate-500">
                               Temp: <span className="font-bold text-slate-800 font-mono">{phaseTemp.toFixed(1)} °C</span> | State: <span className="font-bold text-cyan-600">{phaseStateLabel}</span>
                           </div>
                        </div>
                    </div>
                )}

                {station === 'calorimetry' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                        <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-bold text-slate-700">Hot Object (Metal)</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(Object.keys(CALORIMETRY_SOLIDS) as SolidMaterialKey[]).map((key) => (
                                    <button key={key} onClick={() => setCalHotMat(key)} disabled={calDropped} className={`flex-1 min-w-[70px] text-xs px-2 py-1.5 rounded-lg font-bold border ${calHotMat === key ? 'text-white border-transparent shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200'} disabled:opacity-50`} style={calHotMat === key ? { backgroundColor: CALORIMETRY_SOLIDS[key].color } : {}}>{CALORIMETRY_SOLIDS[key].label}</button>
                                ))}
                            </div>
                            <SliderRow label="Mass" valueLabel={`${calHotMass} g`} minLabel="10 g" maxLabel="200 g">
                                <input type="range" min="10" max="200" step="5" value={calHotMass} onChange={(e) => setCalHotMass(Number(e.target.value))} disabled={calDropped} className="w-full accent-rose-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
                            </SliderRow>
                            <SliderRow label="Temp (T1)" valueLabel={`${calHotTemp} °C`} minLabel="50 °C" maxLabel="200 °C">
                                <input type="range" min="50" max="200" step="5" value={calHotTemp} onChange={(e) => setCalHotTemp(Number(e.target.value))} disabled={calDropped} className="w-full accent-rose-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
                            </SliderRow>
                        </div>
                        <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                            <div>
                                <span className="text-sm font-bold text-slate-700 mb-2 block">Cold Bath (Water)</span>
                                <SliderRow label="Volume" valueLabel={`${calWaterMass} ml (${calWaterMass} g)`} minLabel="50 ml" maxLabel="500 ml">
                                    <input type="range" min="50" max="500" step="10" value={calWaterMass} onChange={(e) => setCalWaterMass(Number(e.target.value))} disabled={calDropped} className="w-full accent-cyan-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
                                </SliderRow>
                                <SliderRow label="Temp (T2)" valueLabel={`${calWaterTemp} °C`} minLabel="10 °C" maxLabel="40 °C">
                                    <input type="range" min="10" max="40" step="1" value={calWaterTemp} onChange={(e) => setCalWaterTemp(Number(e.target.value))} disabled={calDropped} className="w-full accent-cyan-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
                                </SliderRow>
                            </div>
                            <div className="flex gap-2">
                                {!calDropped ? (
                                    <button onClick={() => setCalDropped(true)} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 text-sm">
                                        DROP OBJECT
                                    </button>
                                ) : (
                                    <button onClick={resetCalorimetry} className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 text-sm">
                                        RESET CALORIMETER
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />;
};

const SliderRow = ({ label, valueLabel, minLabel, maxLabel, children, className="" }: { label: string; valueLabel: string; minLabel: string; maxLabel: string; children: React.ReactNode, className?:string }) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
            <span>{label}</span>
            <span className="text-slate-700 font-mono text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">{valueLabel}</span>
        </label>
        {children}
        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
        </div>
    </div>
);

function getDescriptions(station: Station, opts: any): React.ReactNode[] {
    if (station === 'expansion') {
        if (opts.expMaterial === 'water') {
            return [
                "Anomalous Expansion of Water:",
                "Between 0°C and 4°C, water contracts (density increases) as hydrogen bonds collapse.",
                "Above 4°C, it expands normally.",
                "This is why ice floats and lakes freeze from the top down."
            ];
        }
        const mult = opts.expDimension === 'linear' ? <span>α<sub>l</sub></span> : opts.expDimension === 'area' ? <span>α<sub>a</sub> = 2α<sub>l</sub></span> : <span>α<sub>v</sub> = 3α<sub>l</sub></span>;
        return [
            "Thermal Expansion in Solids:",
            "As temperature increases, atoms vibrate more violently, pushing each other apart.",
            <span>Formula: Δ{opts.expDimension === 'linear' ? 'l' : opts.expDimension === 'area' ? 'A' : 'V'} = {opts.expDimension === 'linear' ? 'l' : opts.expDimension === 'area' ? 'A' : 'V'}<sub>0</sub> · {mult} · ΔT</span>,
            "Different materials expand at different rates governed by their structural bonds."
        ];
    }
    if (station === 'phase_change') {
        return [
            "Heating Curve and Phase Changes:",
            "During a phase change, temperature remains constant despite heat being added.",
            "Q = mL (Latent Heat of Fusion/Vaporization): Energy breaks intermolecular bonds.",
            "Q = msΔT (Specific Heat): Energy increases kinetic energy (temperature)."
        ];
    }
    return [
        "Calorimetry Principle:",
        "Law of Conservation of Energy: Heat Lost by Hot Body = Heat Gained by Cold Bath.",
        <span>m<sub>1</sub>s<sub>1</sub>(T<sub>1</sub> - T<sub>f</sub>) = m<sub>2</sub>s<sub>2</sub>(T<sub>f</sub> - T<sub>2</sub>)</span>,
        opts.calDropped ? "Notice how water's high specific heat capacity means its temperature changes much less than the metal's." : "Drop the hot metal to observe the thermal equilibrium process."
    ];
}

// ------ PHYSICS HELPER FUNCTIONS ------
function getWaterVolumeFactor(T: number): number {
    // Empirical fit for water relative volume near 4C. Min volume at 4C = 1.0000.
    // Rel Vol = 1 + 8e-6 * (T - 4)^2
    return 1 + 8e-6 * Math.pow(T - 4, 2);
}

function calculatePhaseState(iceMassG: number, powerW: number, timeS: number) {
    const m = iceMassG * 1e-3; // kg
    
    // Ice specific heat = 2100 J/kgK. Let's start at -20C
    const e_ice = m * 2100 * 20; // Energy to reach 0C
    const e_melt = m * L_FUSION; // Energy to melt
    const e_water = m * WATER_C * 100; // Energy to reach 100C
    const e_boil = m * L_VAPOR; // Energy to completely boil
    
    // Total energy put in
    const E = powerW * timeS;
    
    let phaseTemp = -20;
    let phaseStateLabel = 'Solid (Ice)';
    
    if (E < e_ice) {
        phaseTemp = -20 + (E / (m * 2100));
        phaseStateLabel = 'Solid (Ice)';
    } else if (E < e_ice + e_melt) {
        phaseTemp = 0;
        phaseStateLabel = 'Melting (Solid + Liquid)';
    } else if (E < e_ice + e_melt + e_water) {
        phaseTemp = 0 + ((E - e_ice - e_melt) / (m * WATER_C));
        phaseStateLabel = 'Liquid (Water)';
    } else if (E < e_ice + e_melt + e_water + e_boil) {
        phaseTemp = 100;
        phaseStateLabel = 'Boiling (Liquid + Gas)';
    } else {
        // Steam specific heat ~ 2000 J/kgK
        phaseTemp = 100 + ((E - e_ice - e_melt - e_water - e_boil) / (m * 2000));
        phaseStateLabel = 'Gas (Steam)';
    }
    
    const totalTimeRequired = (e_ice + e_melt + e_water + e_boil + m*2000*50) / powerW; // Max out at 150C
    
    return { phaseTemp, phaseStateLabel, totalTimeRequired, E, e_ice, e_melt, e_water, e_boil };
}


// ------ CANVAS DRAWING UTILS ------
function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
    if (w < 0 || h < 0) return;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.closePath();
}

function drawExpansionScene(ctx: CanvasRenderingContext2D, p: any) {
    const { x, y, w, h, state, fs, time } = p;
    const { expMaterial, expDimension, expTemp } = state;
    const cx = x + w / 2; const cy = y + h / 2;
    const clipInset = 8;

    let scaleFactor = 1;
    if (expMaterial === 'water') {
        // Exaggerate visually
        const vol = getWaterVolumeFactor(expTemp);
        scaleFactor = 1 + (vol - 1) * 300; // Exaggerate but keep inside beaker
    } else {
        const deltaT = expTemp - 20;
        const alpha = EXPANSION_MATERIALS[expMaterial].alpha;
        const visualMultiplier = 150; // To make expansion visible
        scaleFactor = 1 + alpha * deltaT * visualMultiplier;
    }

    const baseColor = EXPANSION_MATERIALS[expMaterial].color;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + clipInset, y + clipInset, w - clipInset * 2, h - clipInset * 2);
    ctx.clip();

    ctx.save();
    ctx.translate(cx, cy);

    if (expDimension === 'linear') {
        const bw = 20;
        const visualMultiplier = 150;
        const maxDeltaT = 400 - AMBIENT_TEMP;
        const maxScaleFactor = 1 + EXPANSION_MATERIALS[expMaterial].alpha * maxDeltaT * visualMultiplier;
        const maxVisualLength = Math.max(80, w - 80);
        const bl = Math.min(w * 0.5, maxVisualLength / maxScaleFactor);
        const l = bl * scaleFactor;
        
        ctx.fillStyle = '#e2e8f0'; // placeholder outline
        ctx.fillRect(-bl/2, -bw/2, bl, bw);
        
        ctx.fillStyle = baseColor;
        // Thermal glow overlay
        ctx.shadowColor = expTemp > 100 ? 'rgba(239,68,68,0.5)' : 'transparent';
        ctx.shadowBlur = Math.max(0, (expTemp-100)/10);
        ctx.fillRect(-l/2, -bw/2, l, bw);
        
        // Draw dimension lines
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-l/2, -bw/2 - 20); ctx.lineTo(l/2, -bw/2 - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-l/2, -bw/2 - 25); ctx.lineTo(-l/2, -bw/2 - 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(l/2, -bw/2 - 25); ctx.lineTo(l/2, -bw/2 - 15); ctx.stroke();
        
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(14)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(`L = L₀(1 + αΔT)`, 0, -bw/2 - 30);

    } else if (expDimension === 'area') {
        const bl = Math.min(w, h) * 0.4;
        const l = bl * scaleFactor;
        
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.strokeRect(-bl/2, -bl/2, bl, bl);
        ctx.fillStyle = baseColor; 
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = expTemp > 100 ? 'rgba(239,68,68,0.5)' : 'transparent';
        ctx.shadowBlur = Math.max(0, (expTemp-100)/10);
        ctx.fillRect(-l/2, -l/2, l, l);
        ctx.globalAlpha = 1.0;
        
    } else if (expDimension === 'volume') {
        const bl = Math.min(w, h) * 0.35;
        const l = bl * scaleFactor;
        
        if (expMaterial === 'water') {
            // Draw beaker
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(-bl, -bl*1.2); ctx.lineTo(-bl, bl); ctx.lineTo(bl, bl); ctx.lineTo(bl, -bl*1.2); ctx.stroke();
            
            // Water fill - contracts at 4C
            ctx.fillStyle = baseColor;
            const fillH = bl * 1.5 * scaleFactor;
            ctx.fillRect(-bl+2, bl - fillH, bl*2-4, fillH);
            
            // Draw temperature particles (slow near 4C/0C)
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            for(let i=0; i<20; i++) {
                const px = -bl + 10 + ((i*37)%1)*(bl*2-20);
                const py = bl - 10 - ((i*91 + time*(5+expTemp))%1) * fillH;
                ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fill();
            }

            // Annotation showing max density
            if (Math.abs(expTemp - 4) < 0.5) {
                ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(14)}px sans-serif`; ctx.textAlign = 'center';
                ctx.fillText(`MAXIMUM DENSITY at 4°C`, 0, -bl*1.3);
            }
        } else {
            // 3D cube projection
            const drawCube = (size: number, isOutline: boolean) => {
                const off = size * 0.3;
                ctx.beginPath();
                ctx.moveTo(-size/2, -size/2); ctx.lineTo(size/2, -size/2); ctx.lineTo(size/2, size/2); ctx.lineTo(-size/2, size/2); ctx.closePath();
                ctx.moveTo(-size/2 + off, -size/2 - off); ctx.lineTo(size/2 + off, -size/2 - off); ctx.lineTo(size/2 + off, size/2 - off); ctx.lineTo(-size/2 + off, size/2 - off); ctx.closePath();
                ctx.moveTo(-size/2, -size/2); ctx.lineTo(-size/2 + off, -size/2 - off);
                ctx.moveTo(size/2, -size/2); ctx.lineTo(size/2 + off, -size/2 - off);
                ctx.moveTo(size/2, size/2); ctx.lineTo(size/2 + off, size/2 - off);
                ctx.moveTo(-size/2, size/2); ctx.lineTo(-size/2 + off, size/2 - off);
                
                if (isOutline) {
                    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
                } else {
                    ctx.fillStyle = baseColor; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1.0;
                }
            };
            drawCube(bl, true);
            drawCube(l, false);
        }
    }
    ctx.restore();
    ctx.restore();
}

function drawExpansionGraph(ctx: CanvasRenderingContext2D, p: any) {
    const { x, y, w, h, state, fs, pad: passedPad } = p;
    const pad = passedPad || 30;
    
    ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px sans-serif`; ctx.textAlign = 'left';
    ctx.fillText(state.expMaterial === 'water' ? 'Anomalous Expansion: Volume vs Temp' : 'Fractional Change vs Temperature', x + pad, y + pad);

    const gx = x + pad * 3.5; const gy = y + pad * 2;
    const gw = w - pad * 5.5; const gh = h - pad * 5; // decreased bottom margin
    
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(10)}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('Temperature (°C)', gx + gw / 2, gy + gh + pad * 1.5);
    
    ctx.save();
    ctx.translate(gx - pad * 2.5, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(state.expMaterial === 'water' ? 'Rel. Volume' : 'ΔL / L₀', 0, 0);
    ctx.restore();

    ctx.strokeStyle = EXPANSION_MATERIALS[state.expMaterial].color; ctx.lineWidth = 4; 
    ctx.beginPath();
    
    if (state.expMaterial === 'water') {
        for(let t=0; t<=15; t+=0.5) {
            const vol = getWaterVolumeFactor(t);
            // graph from 1.0000 to 1.0020
            const py = gy + gh - ((vol - 1.0) / 0.002) * gh;
            const px = gx + (t / 15) * gw;
            if (t===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
        }
        ctx.stroke();
        
        // current dot
        const c_vol = getWaterVolumeFactor(state.expTemp);
        const cx = gx + (state.expTemp / 15) * gw;
        const cy = gy + gh - ((c_vol - 1.0) / 0.002) * gh;
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(cx,cy,6,0,Math.PI*2); ctx.fill();
        
        ctx.fillStyle = '#64748b'; ctx.font = `${fs(10)}px sans-serif`;
        ctx.fillText("4°C Min", gx + (4/15)*gw, gy + gh + 15);
    } else {
        const maxT = 400;
        const maxMultiplier = state.expDimension === 'linear' ? 1 : state.expDimension === 'area' ? 2 : 3;
        const alpha = EXPANSION_MATERIALS[state.expMaterial].alpha;
        
        for(let t=20; t<=maxT; t+=10) {
            const frac = maxMultiplier * alpha * (t - 20);
            const maxFrac = maxMultiplier * alpha * (maxT - 20);
            const py = gy + gh - (frac / maxFrac) * gh;
            const px = gx + ((t - 20) / (maxT - 20)) * gw;
            if (t===20) ctx.moveTo(px,py); else ctx.lineTo(px,py);
        }
        ctx.stroke();
        
        // Current dot
        const fracStr = (maxMultiplier * alpha * (state.expTemp - 20));
        const maxFrac = maxMultiplier * alpha * (maxT - 20);
        const cx = gx + ((state.expTemp - 20) / (maxT - 20)) * gw;
        const cy = gy + gh - (fracStr / maxFrac) * gh;
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(cx,cy,6,0,Math.PI*2); ctx.fill();
    }
}

function drawPhaseChangeScene(ctx: CanvasRenderingContext2D, p: any) {
    const { x, y, w, h, state, fs, time } = p;
    const cx = x + w/2; const cy = y + h*0.6;
    const bW = Math.min(w*0.3, 150); const bH = Math.min(h*0.6, 200);
    
    // Draw Bunsen burner
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(cx - 30, cy + bH/2 + 10, 60, 20);
    // Flames based on heater power
    if (state.phasePlaying) {
        ctx.fillStyle = '#ef4444';
        const flameH = 20 + (state.phaseHeaterPower / 1000) * 30;
        for(let i=0; i<5; i++) {
            const fx = cx - 20 + i*10 + Math.sin(time*10+i)*5;
            const fy = cy + bH/2 + 10 - Math.random() * flameH;
            ctx.beginPath(); ctx.arc(fx,fy,5,0,Math.PI*2); ctx.fill();
        }
    }

    // Beaker body
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx-bW/2, cy-bH/2); ctx.lineTo(cx-bW/2, cy+bH/2); ctx.lineTo(cx+bW/2, cy+bH/2); ctx.lineTo(cx+bW/2, cy-bH/2); ctx.stroke();

    const stats = calculatePhaseState(state.phaseIceMass, state.phaseHeaterPower, state.phaseTime);
    
    // Draw contents based on energy state
    const { E, e_ice, e_melt, e_water, e_boil } = stats;

    const fillLevel = cy + bH/2;
    const waterLevel = bH * Math.min(1, state.phaseIceMass/100);

    // Ice fraction
    let iceFraction = 1;
    if (E > e_ice && E < e_ice + e_melt) iceFraction = 1 - (E - e_ice)/e_melt;
    if (E >= e_ice + e_melt) iceFraction = 0;

    // Water level
    let waterFraction = 1 - iceFraction;
    if (E > e_ice + e_melt + e_water) {
        // Boiling away
        waterFraction = 1 - Math.min(1, (E - e_ice - e_melt - e_water)/e_boil);
    }
    
    if (waterFraction > 0) {
        ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
        ctx.fillRect(cx-bW/2+2, fillLevel - waterLevel * waterFraction, bW-4, waterLevel * waterFraction);
        
        // Boiling bubbles
        if (stats.phaseTemp >= 100 && state.phasePlaying) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            for(let i=0; i<15; i++) {
                const px = cx - bW/2 + 10 + (Math.sin(i*77)*0.5+0.5)*(bW-20);
                const py = fillLevel - (time*50 + i*13)%waterLevel * waterFraction;
                ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fill();
            }
        }
    }

    if (iceFraction > 0) {
        ctx.fillStyle = 'rgba(224, 242, 254, 0.9)'; // Ice cubes
        const iceH = waterLevel * iceFraction;
        ctx.fillRect(cx - bW/3, fillLevel - iceH, bW*0.6, iceH);
        ctx.strokeStyle = '#bae6fd'; ctx.strokeRect(cx - bW/3, fillLevel - iceH, bW*0.6, iceH);
    }
    
    // Steam
    if (E > e_ice + e_melt + e_water && state.phasePlaying) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
        for(let i=0; i<8; i++) {
            const sx = cx - bW/2 + Math.random()*bW;
            const sy = cy - bH/2 - Math.random()*100 - (time*20)%50;
            ctx.beginPath(); ctx.arc(sx,sy,15,0,Math.PI*2); ctx.fill();
        }
    }
}

function drawPhaseChangeGraph(ctx: CanvasRenderingContext2D, p: any) {
    const { x, y, w, h, state, fs, pad: passedPad } = p;
    const pad = passedPad || 30;
    
    const stats = calculatePhaseState(state.phaseIceMass, state.phaseHeaterPower, state.phaseTime);
    
    ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px sans-serif`; ctx.textAlign = 'left';
    ctx.fillText('Heating Curve: Temp vs Heat Added (Joules)', x + pad, y + pad);

    const gx = x + pad * 3; const gy = y + pad * 2;
    const gw = w - pad * 5; const gh = h - pad * 5; // decreased bottom margin
    
    // Axes
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(10)}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('Heat Added (Joules)', gx + gw / 2, gy + gh + pad * 1.5);
    
    ctx.save();
    ctx.translate(gx - pad * 2.5, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Temperature (°C)', 0, 0);
    ctx.restore();

    const m = state.phaseIceMass * 1e-3;
    const e_steam = m * 2000 * 50;
    const maxE = stats.e_ice + stats.e_melt + stats.e_water + stats.e_boil + e_steam;
    const minT = -20; const maxT = 150;
    const getPy = (T: number) => gy + gh - ((T - minT)/(maxT - minT)) * gh;
    const getPx = (E: number) => gx + (E / maxE) * gw;

    // Draw theoretical line
    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(getPx(0), getPy(-20)); // Start ice
    ctx.lineTo(getPx(stats.e_ice), getPy(0)); // reach 0C
    ctx.lineTo(getPx(stats.e_ice + stats.e_melt), getPy(0)); // melt
    ctx.lineTo(getPx(stats.e_ice + stats.e_melt + stats.e_water), getPy(100)); // reach 100C
    ctx.lineTo(getPx(stats.e_ice + stats.e_melt + stats.e_water + stats.e_boil), getPy(100)); // Boil
    ctx.lineTo(getPx(maxE), getPy(150)); // Steam heat
    ctx.stroke(); ctx.setLineDash([]);

    // Draw solid progress line
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4;
    ctx.beginPath();
    let currentE = Math.min(stats.E, maxE);
    // Re-tread path up to currentE
    let drawE = 0;
    ctx.moveTo(getPx(0), getPy(-20));
    const checkpoints = [
        {E: stats.e_ice, T: 0},
        {E: stats.e_ice + stats.e_melt, T: 0},
        {E: stats.e_ice + stats.e_melt + stats.e_water, T: 100},
        {E: stats.e_ice + stats.e_melt + stats.e_water + stats.e_boil, T: 100}
    ];
    
    for (let cp of checkpoints) {
        if (currentE > cp.E) {
            ctx.lineTo(getPx(cp.E), getPy(cp.T));
        } else {
            break;
        }
    }
    // Final segment
    ctx.lineTo(getPx(currentE), getPy(stats.phaseTemp));
    ctx.stroke();
    
    // Live dot
    ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(getPx(currentE), getPy(stats.phaseTemp), 6, 0, Math.PI*2); ctx.fill();

    // Labels
    ctx.fillStyle = '#64748b'; ctx.font = `${fs(10)}px sans-serif`;
    ctx.fillText("0°C Fusion", gx - 50, getPy(0)+4);
    ctx.fillText("100°C Vap.", gx - 50, getPy(100)+4);
}

function drawCalorimetryScene(ctx: CanvasRenderingContext2D, p: any) {
    const { x, y, w, h, state, fs, time } = p;
    const cx = x + w/2; const cy = y + h*0.5;
    
    // Beaker (Calorimeter)
    const bW = 140; const bH = 160;
    const baseWaterLvl = bH * (state.calWaterMass / 500) * 0.8; // scales with mass visually
    
    // Calculate displaced volume when metal is submerged
    const metalMassKg = state.calHotMass * 1e-3;
    const metalRho = CALORIMETRY_SOLIDS[state.calHotMat].rho;
    const metalVolM3 = metalMassKg / metalRho; // m^3
    const metalVolMl = metalVolM3 * 1e6; // ml
    // beaker cross-section area in ml-per-pixel units
    const beakerInnerW = bW - 4; // px inner width
    const maxWaterLvlPx = bH * 0.8; // max water height in px for 500ml
    const pxPerMl = maxWaterLvlPx / 500;
    const displacePx = metalVolMl * pxPerMl;
    
    // Animate displacement
    const dropProgress = state.calDropped ? Math.min(1, state.calMixTime * 5) : 0;
    const waterLvl = baseWaterLvl + displacePx * dropProgress;
    
    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(cx - bW/2 - 10, cy - bH/2, bW + 20, bH); // insulation outer
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4; ctx.strokeRect(cx - bW/2 - 10, cy - bH/2, bW + 20, bH);
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.strokeRect(cx - bW/2, cy - bH/2 + 10, bW, bH - 20); // inner cup
    
    // Current temperatures
    const T1 = state.calHotTemp; const T2 = state.calWaterTemp;
    const m1 = state.calHotMass * 1e-3, c1 = CALORIMETRY_SOLIDS[state.calHotMat].c;
    const m2 = state.calWaterMass * 1e-3, c2 = WATER_C;
    const Tf = (m1*c1*T1 + m2*c2*T2) / (m1*c1 + m2*c2);
    
    const curHotT = state.calDropped ? T1 - (T1 - Tf) * Math.sin(state.calMixTime * Math.PI / 2) : T1;
    const curColdT = state.calDropped ? T2 + (Tf - T2) * Math.sin(state.calMixTime * Math.PI / 2) : T2;

    // Water
    ctx.fillStyle = `rgba(14, 165, 233, ${0.3 + (curColdT-10)/100})`; // Color warms up slightly
    ctx.fillRect(cx - bW/2 + 2, cy + bH/2 - 10 - waterLvl, bW-4, waterLvl);

    // Metal Block
    const blockS = 30 + (state.calHotMass / 200) * 30;
    let blockY = cy - bH/2 - 50; // default hanging
    if (state.calDropped) {
        // Drop animation phase
        const dropY = cy + bH/2 - 10 - blockS;
        blockY = cy - bH/2 - 50 + (dropY - (cy - bH/2 - 50)) * Math.min(1, state.calMixTime * 5); // drops fast
    }
    
    ctx.fillStyle = CALORIMETRY_SOLIDS[state.calHotMat].color;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(cx - blockS/2, blockY, blockS, blockS);
    ctx.globalAlpha = 1.0;
    
    // Wire holding block (disappears on drop)
    if (!state.calDropped || state.calMixTime < 0.2) {
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy - bH/2 - 120); ctx.lineTo(cx, blockY); ctx.stroke();
    }

    // Thermometers
    const drawTherm = (tx: number, ty: number, T: number, label: string) => {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth=2;
        ctx.beginPath(); roundRect(ctx, tx-5, ty-60, 10, 80, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ef4444';
        const fill = 60 * Math.min(1, T/200);
        ctx.fillRect(tx-3, ty+10-fill, 6, fill);
        ctx.beginPath(); ctx.arc(tx, ty+10, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign='center';
        ctx.fillText(`${T.toFixed(1)}${String.fromCharCode(176)}C`, tx, ty+35);
        ctx.fillText(label, tx, ty-70);
    };

    drawTherm(cx - bW/2 - 50, cy, curColdT, 'Water');
    drawTherm(cx + bW/2 + 50, blockY, curHotT, 'Metal');
}

function drawCalorimetryGraph(ctx: CanvasRenderingContext2D, p: any) {
    const { x, y, w, h, state, fs, pad: passedPad } = p;
    const pad = passedPad || 30;
    
    ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px sans-serif`; ctx.textAlign = 'left';
    ctx.fillText('Thermal Equilibrium Curve (Temp vs Time)', x + pad, y + pad);

    const gx = x + pad * 3.5; const gy = y + pad * 2;
    const gw = w - pad * 5.5; const gh = h - pad * 5; // decreased bottom margin
    
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(10)}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('Mixing Time (relative)', gx + gw / 2, gy + gh + pad * 1.5);
    
    ctx.save();
    ctx.translate(gx - pad * 2.5, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Temperature (°C)', 0, 0);
    ctx.restore();

    const T1 = state.calHotTemp; const T2 = state.calWaterTemp;
    const maxT = Math.max(T1, T2) + 10;
    const minT = 0;
    const getPy = (T: number) => gy + gh - ((T - minT)/(maxT - minT)) * gh;
    const getPx = (t: number) => gx + t * gw; // t from 0 to 1

    const m1 = state.calHotMass * 1e-3, c1 = CALORIMETRY_SOLIDS[state.calHotMat].c;
    const m2 = state.calWaterMass * 1e-3, c2 = WATER_C;
    const Tf = (m1*c1*T1 + m2*c2*T2) / (m1*c1 + m2*c2);

    if (state.calDropped) {
        // Hot line
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3; ctx.beginPath();
        for(let t=0; t<=state.calMixTime; t+=0.02) {
            const temp = T1 - (T1 - Tf) * Math.sin(t * Math.PI / 2);
            if (t===0) ctx.moveTo(getPx(t), getPy(temp)); else ctx.lineTo(getPx(t), getPy(temp));
        }
        ctx.stroke();

        // Cold line
        ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 3; ctx.beginPath();
        for(let t=0; t<=state.calMixTime; t+=0.02) {
            const temp = T2 + (Tf - T2) * Math.sin(t * Math.PI / 2);
            if (t===0) ctx.moveTo(getPx(t), getPy(temp)); else ctx.lineTo(getPx(t), getPy(temp));
        }
        ctx.stroke();

        // Equilibrium line (dashed)
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.setLineDash([5,5]);
        ctx.beginPath(); ctx.moveTo(gx, getPy(Tf)); ctx.lineTo(gx+gw, getPy(Tf)); ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(12)}px sans-serif`;
        ctx.fillText(`T_final = ${Tf.toFixed(1)}°C`, gx + gw - 100, getPy(Tf) - 10);
    } else {
        // Just show dots before drop
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(getPx(0), getPy(T1), 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0ea5e9'; ctx.beginPath(); ctx.arc(getPx(0), getPy(T2), 5, 0, Math.PI*2); ctx.fill();
    }
}

export default ThermalExpansionCalorimetryLab;
