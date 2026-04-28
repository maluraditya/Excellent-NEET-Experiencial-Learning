import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Flame, Wind, Sun, BookOpen, Activity, Zap, Droplets, CloudSun } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface HeatTransferBlackbodyLabProps {
    topic: any;
    onExit: () => void;
}

type Station = 'conduction' | 'convection' | 'radiation';
type MaterialKey = 'copper' | 'steel' | 'glass';
type EnvironmentKey = 'air' | 'water' | 'vacuum';

const MATERIALS: Record<MaterialKey, { label: string; k: number; color: string; mp: number }> = {
    copper: { label: 'Copper', k: 400, color: '#d97706', mp: 1358 },
    steel: { label: 'Steel', k: 50, color: '#64748b', mp: 1643 },
    glass: { label: 'Glass', k: 1.05, color: '#0ea5e9', mp: 1773 },
};

const ENVIRONMENTS: Record<EnvironmentKey, { label: string; h: number; color: string }> = {
    air: { label: 'Air', h: 10, color: '#38bdf8' },
    water: { label: 'Water', h: 500, color: '#0f766e' },
    vacuum: { label: 'Vacuum', h: 0, color: '#7c3aed' },
};

const STATIONS: { key: Station; label: string; accent: string; icon: React.ReactNode }[] = [
    { key: 'conduction', label: 'Conduction', accent: '#f97316', icon: <Flame size={18} /> },
    { key: 'convection', label: 'Convection', accent: '#06b6d4', icon: <Wind size={18} /> },
    { key: 'radiation', label: 'Radiation', accent: '#f43f5e', icon: <Sun size={18} /> },
];

const SIGMA = 5.67e-8; // Stefan-Boltzmann constant W/(m2 K4)
const WIEN_CONSTANT_NM_K = 2.898e6; // Wien's displacement constant in nm.K
const AMBIENT_TEMPERATURE = 300; // Kelvin

function formatWatts(w: number): string {
    if (Math.abs(w) < 0.01) return '0 W';
    if (Math.abs(w) >= 1e6) return `${(w / 1e6).toFixed(2)} MW`;
    if (Math.abs(w) >= 1e3) return `${(w / 1e3).toFixed(2)} kW`;
    if (Math.abs(w) >= 1) return `${w.toFixed(2)} W`;
    return `${(w * 1e3).toFixed(2)} mW`;
}

const HeatTransferBlackbodyLab: React.FC<HeatTransferBlackbodyLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    const [station, setStation] = useState<Station>('conduction');
    const [temperature, setTemperature] = useState(1200);
    const [material, setMaterial] = useState<MaterialKey>('copper');
    const [environment, setEnvironment] = useState<EnvironmentKey>('air');
    const [areaCm2, setAreaCm2] = useState(4);
    const [lengthM, setLengthM] = useState(0.6);

    const stateRef = useRef({
        station,
        temperature,
        material,
        environment,
        areaCm2,
        lengthM,
    });

    useEffect(() => {
        stateRef.current = { station, temperature, material, environment, areaCm2, lengthM };
    }, [station, temperature, material, environment, areaCm2, lengthM]);

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

        const { station: activeStation, temperature: T, material: materialKey, environment: environmentKey, areaCm2: area, lengthM: length } = stateRef.current;
        const materialData = MATERIALS[materialKey];
        const areaM2 = area * 1e-4;
        const deltaT = Math.max(T - AMBIENT_TEMPERATURE, 0);
        const conductionRate = materialData.k * areaM2 * deltaT / Math.max(length, 0.2);
        const radiationPower = SIGMA * areaM2 * Math.pow(T, 4);
        const peakNm = WIEN_CONSTANT_NM_K / Math.max(T, 1);
        const time = Date.now() * 0.001;

        ctx.clearRect(0, 0, W, H);

        const scale = W < 1000 ? 1 : (W > 1500 ? 1.25 : 1 + (W - 1000) * 0.0005);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.022, H * 0.035));
        const pad = Math.min(W * 0.04, H * 0.04, scale * 28);

        // Equalize Box Sizes
        const innerH = H - pad * 3;
        const topSectionHeight = innerH / 2;
        const bottomSectionHeight = topSectionHeight;
        const bottomSectionY = pad * 2 + topSectionHeight;

        const graphWidth = W - pad * 2;
        const graphX = pad;

        // Draw upper simulation box
        ctx.fillStyle = activeStation === 'radiation' ? '#020617' : '#f8fafc';
        roundRect(ctx, pad, pad, W - pad * 2, topSectionHeight, 16);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        roundRect(ctx, pad, pad, W - pad * 2, topSectionHeight, 16);
        ctx.stroke();

        // Draw lower graph box
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, pad, bottomSectionY, W - pad * 2, bottomSectionHeight, 16);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        roundRect(ctx, pad, bottomSectionY, W - pad * 2, bottomSectionHeight, 16);
        ctx.stroke();

        // DRAW UNIFIED SIMULATION (Context-Aware)
        if (activeStation === 'convection' && environmentKey === 'air') {
            drawHotAirBalloonScene(ctx, {
                x: pad, y: pad, w: W - pad * 2, h: topSectionHeight,
                pad, fs, time, temperature: T, area, length
            });
        } else if (activeStation === 'convection' && environmentKey === 'vacuum') {
            drawVacuumScene(ctx, {
                x: pad, y: pad, w: W - pad * 2, h: topSectionHeight,
                pad, fs, time, temperature: T, area, length
            });
        } else {
            drawPotOnStoveScene(ctx, {
                x: pad, y: pad, w: W - pad * 2, h: topSectionHeight,
                pad, fs, time, temperature: T, materialColor: materialData.color, rate: conductionRate,
                activeStation, environment: environmentKey, area, length
            });
        }

        // DRAW GRAPHS
        if (activeStation === 'conduction') {
            drawConductionGraph(ctx, {
                x: graphX, y: bottomSectionY, w: graphWidth, h: bottomSectionHeight,
                pad, fs, currentArea: area, lengthM: length, materialK: materialData.k, deltaT
            });
        } else if (activeStation === 'convection') {
            drawConvectionGraph(ctx, {
                x: graphX, y: bottomSectionY, w: graphWidth, h: bottomSectionHeight,
                pad, fs, selected: environmentKey, deltaT, areaCm2: area, lengthM: length
            });
        } else {
            drawSpectrumGraph(ctx, {
                x: graphX, y: bottomSectionY, w: graphWidth, h: bottomSectionHeight,
                pad, fs, temperature: T, peakNm
            });
        }

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const reset = () => {
        setStation('conduction');
        setTemperature(1200);
        setMaterial('copper');
        setEnvironment('air');
        setAreaCm2(4);
        setLengthM(0.6);
    };

    const maxTemp = station === 'radiation' ? 6000 : MATERIALS[material].mp;

    // Fourier's Law: Q/t = k * A * deltaT / L  (W)
    const areaM2 = areaCm2 * 1e-4;
    const conductionRate = MATERIALS[material].k * areaM2 * Math.max(temperature - AMBIENT_TEMPERATURE, 0) / Math.max(lengthM, 0.2);
    const deltaT = Math.max(temperature - AMBIENT_TEMPERATURE, 0);
    // Newton's Law of Cooling: Q/t = h * A * deltaT  (W)
    const convectionRate = environment === 'vacuum' ? 0 : ENVIRONMENTS[environment].h * areaM2 * deltaT;
    // Stefan-Boltzmann (net): P = sigma * A * (T^4 - T0^4)  (W)
    const radiationPower = SIGMA * areaM2 * (Math.pow(temperature, 4) - Math.pow(AMBIENT_TEMPERATURE, 4));
    // Wien's Displacement Law: lambda_max = b / T  (nm)
    const peakNm = WIEN_CONSTANT_NM_K / temperature;

    const descriptions = [
        // Placeholder as it was removed
    ];

    const simulationCombo = (
        <div className="w-full h-full relative bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-0">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-4 w-full text-slate-700 p-2 relative max-w-5xl mx-auto">
            {/* Main Center Controls */}
            <div className="flex gap-2">
                {STATIONS.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setStation(item.key)}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl border-2 font-bold text-sm transition-all shadow-sm active:scale-95 ${
                            station === item.key ? 'text-white border-transparent shadow-lg scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                        style={station === item.key ? { backgroundColor: item.accent } : {}}
                    >
                        {item.icon}
                        <span className="hidden md:inline">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatCard label="Heat Flow" value={`${conductionRate.toFixed(1)} W`} color="text-orange-600" icon={<Zap size={14}/>} />
                <StatCard label="Convection" value={`${convectionRate.toFixed(1)} W`} color="text-cyan-600" icon={<Droplets size={14}/>} />
                <StatCard label="Net Radiation (P_net)" value={`${radiationPower.toFixed(1)} W`} color="text-rose-600" icon={<CloudSun size={14}/>} />
                <StatCard label="Peak Lambda" value={`${peakNm.toFixed(0)} nm`} color="text-purple-600" icon={<Activity size={14}/>} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <SliderRow label="Temperature" valueLabel={`${temperature} K`} minLabel="300 K" maxLabel={`${maxTemp} K`}>
                        <input type="range" min="300" max={maxTemp} step="50" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-full accent-rose-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    </SliderRow>
                    <SliderRow label="Area" valueLabel={`${areaCm2.toFixed(1)} cm²`} minLabel="1 cm²" maxLabel="8 cm²">
                        <input type="range" min="1" max="8" step="0.5" value={areaCm2} onChange={(e) => setAreaCm2(Number(e.target.value))} className="w-full accent-orange-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    </SliderRow>
                    {station === 'conduction' && (
                        <SliderRow label="Length" valueLabel={`${lengthM.toFixed(2)} m`} minLabel="0.20 m" maxLabel="1.20 m">
                            <input type="range" min="0.2" max="1.2" step="0.05" value={lengthM} onChange={(e) => setLengthM(Number(e.target.value))} className="w-full accent-blue-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                        </SliderRow>
                    )}
                </div>

                <div className="space-y-4 flex flex-col">
                    <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col justify-between">
                        {station === 'conduction' ? (
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Material</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {(Object.keys(MATERIALS) as MaterialKey[]).map((key) => (
                                        <button key={key} onClick={() => { setMaterial(key); if (temperature > MATERIALS[key].mp) setTemperature(MATERIALS[key].mp); }} className={`rounded-xl px-3 py-3 text-xs md:text-sm font-bold border transition-all ${material === key ? 'text-white border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'}`} style={material === key ? { backgroundColor: MATERIALS[key].color } : {}}>{MATERIALS[key].label} ({MATERIALS[key].mp} K)</button>
                                    ))}
                                </div>
                            </div>
                        ) : station === 'convection' ? (
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Environment</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {(Object.keys(ENVIRONMENTS) as EnvironmentKey[]).map((key) => (
                                        <button key={key} onClick={() => setEnvironment(key)} className={`rounded-xl px-3 py-3 text-xs md:text-sm font-bold border transition-all ${environment === key ? 'text-white border-transparent' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'}`} style={environment === key ? { backgroundColor: ENVIRONMENTS[key].color } : {}}>{ENVIRONMENTS[key].label}</button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-2 flex-1">
                                <Sun size={32} className="text-rose-500 mb-2 animate-pulse" />
                                <p className="text-xs text-slate-500 font-bold">Radiation is independent of material.</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">Emission depends only on Temperature and Area.</p>
                                <p className="text-[10px] text-rose-500 mt-2 font-bold bg-rose-50 px-2 py-1 rounded">P_net = σA(T⁴ − T₀⁴), where T₀ = 300 K ambient</p>
                            </div>
                        )}
                        <button onClick={reset} className="mt-4 flex items-center justify-center gap-2 w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-sm shadow-sm active:scale-95"><RotateCcw size={16} /> RESET LAB</button>
                    </div>

                    {/* Live Output */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 shadow-inner flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Zap size={16} className="text-brand-secondary" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Output</span>
                        </div>
                        <div className="text-xl md:text-2xl font-mono font-bold text-white tracking-tighter">
                            {station === 'conduction' ? formatWatts(conductionRate) : station === 'convection' ? formatWatts(convectionRate) : formatWatts(radiationPower)}
                            <span className="text-xs md:text-sm ml-2 text-slate-400">(SI)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

const StatCard = ({ label, value, color, icon }: { label: string; value: string; color: string; icon?: React.ReactNode }) => (
    <div className="bg-white rounded-xl p-3 text-center border border-slate-200 shadow-sm flex flex-col items-center">
        <div className="flex items-center gap-1.5 mb-1">
            <span className={`${color} opacity-60`}>{icon}</span>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
        </div>
        <div className={`text-sm lg:text-base font-bold font-mono tracking-tight ${color}`}>{value}</div>
    </div>
);

const SliderRow = ({ label, valueLabel, minLabel, maxLabel, children }: { label: string; valueLabel: string; minLabel: string; maxLabel: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="text-xs md:text-sm font-bold text-slate-700 flex justify-between items-center">
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

// --- UNIFIED SCENE DRAWING ---

function drawHotAirBalloonScene(ctx: CanvasRenderingContext2D, p: any) {
    const { x, y, w, h, time, temperature, area = 4, length = 0.6, pad, fs } = p;
    const centerX = x + w / 2;
    const centerY = y + h * 0.55;
    
    const areaScale = Math.sqrt(area / 4);
    const balloonR = Math.min(w, h) * 0.15 * areaScale;

    // Background sky
    ctx.fillStyle = '#bae6fd';
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();

    ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(20)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.fillText('Convection: Hot Air Balloon', centerX, y + pad * 1.5);
    ctx.font = `${fs(12)}px sans-serif`; ctx.fillStyle = '#475569';
    ctx.fillText('Heated air becomes less dense and rises, lifting the balloon', centerX, y + pad * 1.5 + fs(18));

    // Draw Clouds
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 3; i++) {
        const cx = x + w * (0.2 + i * 0.3) + Math.sin(time * 0.5 + i) * 20;
        const cy = y + h * (0.2 + (i % 2) * 0.1);
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.arc(cx + 15, cy - 10, 20, 0, Math.PI * 2);
        ctx.arc(cx + 30, cy, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    // Balloon Animation (Vertical float)
    const deltaT = Math.max(temperature - 300, 0);
    const speed = 1 + deltaT / 500;
    const floatY = Math.sin(time * speed * 2) * (10 + deltaT / 100);
    const by = centerY + floatY;

    // Envelope
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(centerX, by - balloonR * 1.5);
    ctx.bezierCurveTo(centerX + balloonR * 1.5, by - balloonR * 1.5, centerX + balloonR, by + balloonR * 0.5, centerX + balloonR * 0.4, by + balloonR);
    ctx.lineTo(centerX - balloonR * 0.4, by + balloonR);
    ctx.bezierCurveTo(centerX - balloonR, by + balloonR * 0.5, centerX - balloonR * 1.5, by - balloonR * 1.5, centerX, by - balloonR * 1.5);
    ctx.fill();

    // Basket & Ropes
    const ropeLen = 5 + (length * 15);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX - balloonR * 0.3, by + balloonR * 0.8); ctx.lineTo(centerX - balloonR * 0.2, by + balloonR + ropeLen);
    ctx.moveTo(centerX + balloonR * 0.3, by + balloonR * 0.8); ctx.lineTo(centerX + balloonR * 0.2, by + balloonR + ropeLen);
    ctx.stroke();

    ctx.fillStyle = '#78350f';
    ctx.fillRect(centerX - balloonR * 0.2, by + balloonR + ropeLen, balloonR * 0.4, balloonR * 0.3);

    // Heat Waves from Burner
    const burnerX = centerX;
    const burnerY = by + balloonR + ropeLen - 5;
    for (let i = 0; i < 4; i++) {
        const t = (time * speed * 2 + i / 4) % 1;
        const alpha = 1 - t;
        const flameH = 20 + deltaT / 30;
        ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
        ctx.lineWidth = 3 * areaScale;
        ctx.beginPath();
        ctx.moveTo(burnerX - 10 * areaScale, burnerY - t * flameH);
        ctx.quadraticCurveTo(burnerX, burnerY - 15 * areaScale - t * flameH, burnerX + 10 * areaScale, burnerY - t * flameH);
        ctx.stroke();
    }
}

function drawVacuumScene(ctx: CanvasRenderingContext2D, p: any) {
    const { x, y, w, h, pad, fs, time, temperature, area, length } = p;
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    ctx.fillStyle = '#020617'; // Space black
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fs(22)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Convection is not possible in vacuum', centerX, centerY);
    
    ctx.font = `${fs(14)}px sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Convection requires a fluid medium (liquid or gas) to transfer heat.', centerX, centerY + 30);
    
    // Draw some stars to emphasize space
    ctx.fillStyle = '#ffffff';
    for(let i=0; i<20; i++) {
        const sx = x + (Math.sin(i*999) * 0.5 + 0.5) * w;
        const sy = y + (Math.cos(i*888) * 0.5 + 0.5) * h;
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI*2);
        ctx.fill();
    }
}

function drawPotOnStoveScene(ctx: CanvasRenderingContext2D, p: any) {
    const { x, y, w, h, time, temperature, materialColor, rate, activeStation, environment, pad, fs, area = 4, length = 0.6 } = p;
    
    const centerX = x + w * 0.55; 
    const centerY = y + h * 0.6;
    
    let potW = 200 * (w / 1000);
    let potH = 140 * (h / 600);
    
    if (activeStation === 'convection' || activeStation === 'radiation') {
        potW = Math.max(100, 45 * area) * (w / 1000); 
    }
    if (activeStation === 'convection') {
        potH = Math.max(80, 230 * length) * (h / 600);
    }

    const burnerY = centerY + potH / 2 + 10;

    // 1. Draw Burner & Flames
    const isRadiation = activeStation === 'radiation';
    // Emphasize burner color for radiation
    if (isRadiation) {
        ctx.shadowColor = blackbodyColor(temperature);
        ctx.shadowBlur = 10 + temperature/300;
    }
    drawBurner(ctx, centerX, burnerY, potW);
    drawFire(ctx, centerX, burnerY, 30 + temperature / 150, isRadiation);
    ctx.shadowBlur = 0; // reset

    // 2. Draw Radiation Waves if selected
    if (isRadiation) {
        const numRays = Math.floor(6 + area * 2);
        drawRadiationWaves(ctx, centerX, burnerY - 10, potW + 100, time, temperature, numRays);
    }

    // 3. Draw Pot Body
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.fillStyle = 'rgba(203, 213, 225, 0.2)'; // Glassy pot
    roundRect(ctx, centerX - potW/2, centerY - potH/2, potW, potH, 15);
    ctx.fill();
    ctx.stroke();

    // 4. Draw Water & Convection
    const waterLevel = potH * 0.8;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
    roundRect(ctx, centerX - potW/2 + 2, centerY + potH/2 - waterLevel, potW - 4, waterLevel - 2, 12);
    ctx.fill();

    if (activeStation === 'convection') {
        drawConvectionCurrents(ctx, centerX, centerY, potW, potH, time, environment);
    }

    // 5. Draw Handle & Conduction
    const handleL = (activeStation === 'conduction' ? (100 + 150 * length) : 180) * (w / 1000);
    const handleH = (activeStation === 'conduction' ? Math.max(10, 5 * area) : 20) * (h / 600);
    const handleX = centerX - potW/2 - handleL;
    const handleY = centerY - potH/4;

    // Handle gradient based on conduction
    const handleGrad = ctx.createLinearGradient(handleX, 0, centerX - potW/2, 0);
    handleGrad.addColorStop(0, '#64748b'); // Cool end
    handleGrad.addColorStop(0.6, materialColor);
    handleGrad.addColorStop(1, '#ef4444'); // Hot end near pot
    
    ctx.fillStyle = handleGrad;
    roundRect(ctx, handleX, handleY, handleL, handleH, 8);
    ctx.fill();
    ctx.strokeStyle = activeStation === 'conduction' ? '#f97316' : '#334155';
    ctx.lineWidth = activeStation === 'conduction' ? 3 : 1;
    ctx.stroke();

    if (activeStation === 'conduction') {
        drawConductionParticles(ctx, handleX, handleY, handleL, handleH, time, rate);
    }

    // 6. Draw Highlight Labels (Match screenshot)
    ctx.font = `bold ${fs(14)}px sans-serif`;
    ctx.textAlign = 'center';
    
    // Conduction Label
    if (activeStation === 'conduction') {
        ctx.fillStyle = '#f97316';
        ctx.fillText('Conduction', handleX + handleL/2, handleY - 30);
        ctx.font = `${fs(10)}px sans-serif`;
        ctx.fillText('transfer of energy between adjacent molecules', handleX + handleL/2, handleY - 15);
    }

    // Convection Label
    if (activeStation === 'convection') {
        ctx.fillStyle = '#06b6d4';
        ctx.font = `bold ${fs(14)}px sans-serif`;
        ctx.fillText('Convection', centerX + potW * 0.6, centerY - potH * 0.4);
        ctx.font = `${fs(10)}px sans-serif`;
        ctx.fillText('movement of a hot fluid', centerX + potW * 0.6, centerY - potH * 0.4 + 15);
    }

    // Radiation Label
    if (activeStation === 'radiation') {
        ctx.fillStyle = '#f43f5e';
        ctx.font = `bold ${fs(14)}px sans-serif`;
        ctx.fillText('Radiation', centerX - potW * 0.7, burnerY + 20);
        ctx.font = `${fs(10)}px sans-serif`;
        ctx.fillText('emission of electromagnetic rays', centerX - potW * 0.7, burnerY + 35);
    }
}

function drawBurner(ctx: any, x: number, y: number, w: number) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(x, y + i * 5, w * 0.6 - i * 10, 15, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawFire(ctx: any, x: number, y: number, size: number, active: boolean) {
    const particles = active ? 15 : 8;
    for (let i = 0; i < particles; i++) {
        const t = (Date.now() * 0.002 + i / particles) % 1;
        const px = x + Math.sin(i * 2 + Date.now() * 0.01) * 25;
        const py = y - t * size;
        const pSize = (1 - t) * (active ? 30 : 20);
        const alpha = (active ? 0.9 : 0.6) * (1 - t);
        
        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(249, 115, 22, ${alpha})`;
        ctx.beginPath(); ctx.arc(px, py - 5, pSize * 0.7, 0, Math.PI * 2); ctx.fill();
    }
}

function drawRadiationWaves(ctx: any, x: number, y: number, w: number, time: number, temperature: number, rays: number) {
    ctx.strokeStyle = blackbodyColor(temperature);
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2;
        const startR = 40;
        const endR = 120;
        ctx.beginPath();
        for (let r = startR; r < endR; r += 5) {
            const wave = Math.sin(r * 0.2 - time * 10) * 10;
            const px = x + Math.cos(angle) * r + Math.cos(angle + Math.PI/2) * wave;
            const py = y + Math.sin(angle) * r + Math.sin(angle + Math.PI/2) * wave;
            if (r === startR) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}

function drawConvectionCurrents(ctx: any, x: number, y: number, w: number, h: number, time: number, env: string) {
    const speed = env === 'water' ? 0.5 : 0.2;
    
    // Draw Water Bubbles
    if (env === 'water') {
        for (let i = 0; i < 15; i++) {
            const t = (time * 0.8 + i / 15) % 1;
            const bx = x - w * 0.4 + (i * 1234 % 1) * w * 0.8;
            const by = y + h * 0.4 - t * h * 0.8;
            const size = (1 - t) * 4 + 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.4 * (1 - t)})`;
            ctx.beginPath();
            ctx.arc(bx, by, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - t)})`;
            ctx.stroke();
        }
    }

    for (let i = 0; i < 6; i++) {
        const t = (time * speed + i / 6) % 1;
        const alpha = 1 - t;
        ctx.fillStyle = `rgba(14, 165, 233, ${alpha * 0.6})`;
        // Rising side (Center)
        ctx.beginPath();
        ctx.arc(x + Math.sin(t * Math.PI * 2) * 10, y + h * 0.3 - t * h * 0.6, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw arrows
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 3;
    const arrowY = y + h * 0.2;
    
    // Rising arrow
    ctx.beginPath();
    ctx.moveTo(x - 10, arrowY); ctx.quadraticCurveTo(x, arrowY - 40, x + 10, arrowY - 60);
    ctx.stroke();
    // Head
    ctx.beginPath();
    ctx.moveTo(x, arrowY - 60); ctx.lineTo(x + 10, arrowY - 60); ctx.lineTo(x + 10, arrowY - 50);
    ctx.stroke();
}

function drawConductionParticles(ctx: any, x: number, y: number, w: number, h: number, time: number, rate: number) {
    const count = 12;
    const speed = Math.min(rate / 20, 8);
    for (let i = 0; i < count; i++) {
        const offset = ((time * speed + i / count) % 1) * w;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x + offset, y + h / 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- GRAPH DRAWING (FIXED OVERFLOW) ---

function drawConductionGraph(ctx: any, p: any) {
    const { x, y, w, h, pad, fs, currentArea, lengthM, materialK, deltaT } = p;
    const titleY = y + pad * 1.5;
    ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Conduction Law: H vs Area (A)', x + pad * 1.5, titleY);

    const gx = x + pad * 2.5; const gy = y + pad * 3.5;
    const gw = w - pad * 5; const gh = h - pad * 5.5;
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();

    const maxArea = 8; 
    const maxFlow = materialK * (maxArea * 1e-4) * deltaT / Math.max(lengthM, 0.2);
    
    ctx.strokeStyle = '#f97316'; ctx.lineWidth = 4; ctx.beginPath();
    for (let a = 1; a <= maxArea; a += 0.2) {
        const flow = materialK * (a * 1e-4) * deltaT / Math.max(lengthM, 0.2);
        const px = gx + ((a - 1) / (maxArea - 1)) * gw;
        const py = gy + gh - (flow / maxFlow) * (gh - 20);
        if (a === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    
    const curFlow = materialK * (currentArea * 1e-4) * deltaT / Math.max(lengthM, 0.2);
    const cx = gx + ((currentArea - 1) / (maxArea - 1)) * gw;
    const cy = gy + gh - (curFlow / maxFlow) * (gh - 20);
    ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI*2); ctx.fill();
}

function drawConvectionGraph(ctx: any, p: any) {
    const { x, y, w, h, pad, fs, selected, deltaT, areaCm2, lengthM } = p;
    const titleY = y + pad * 1.5;
    ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Convection Strength by Medium', x + pad * 1.5, titleY);

    const gx = x + pad * 2.5; const gy = y + pad * 3.5;
    const gw = w - pad * 5; const gh = h - pad * 5.5;
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();

    const order: EnvironmentKey[] = ['air', 'water', 'vacuum'];
    const barW = gw / 5;
    const maxDeltaT = 1500;
    const maxValue = ENVIRONMENTS.water.h * (8 * 1e-4) * maxDeltaT;

    order.forEach((key, index) => {
        const val = key === 'vacuum' ? 0 : ENVIRONMENTS[key].h * (areaCm2 * 1e-4) * deltaT;
        const barH = (val / maxValue) * (gh - 30);
        const bx = gx + (index * 1.8 + 0.5) * barW;
        const by = gy + gh - barH;
        ctx.fillStyle = key === selected ? ENVIRONMENTS[key].color : '#e2e8f0';
        roundRect(ctx, bx, by, barW, barH, 8); ctx.fill();
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(10)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(ENVIRONMENTS[key].label, bx + barW/2, gy + gh + 20);
    });
}

function drawSpectrumGraph(ctx: any, p: any) {
    const { x, y, w, h, pad, fs, temperature } = p;
    const titleY = y + pad * 1.5;
    ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Blackbody Spectral Radiance (Fixed)', x + pad * 1.5, titleY);

    const gx = x + pad * 2.5; const gy = y + pad * 3.5;
    const gw = w - pad * 5; const gh = h - pad * 5.5;
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();

    const minL = 200; const maxL = 3500;
    
    // Normalize logic: find max intensity first
    let maxI = 0;
    for(let i=0; i<=100; i++) {
        const l = minL + (i/100)*(maxL-minL);
        maxI = Math.max(maxI, normalizedPlanck(l, temperature));
    }

    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
        const lambda = minL + (i / 100) * (maxL - minL);
        const intensity = normalizedPlanck(lambda, temperature);
        const px = gx + ((lambda - minL) / (maxL - minL)) * gw;
        const py = gy + gh - (intensity / maxI) * (gh - 30); // Normalized peak
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
}

function normalizedPlanck(l: number, T: number) {
    const c2 = 1.4388e-2; const exponent = c2 / (l * 1e-9 * T);
    const val = 1 / (Math.pow(l*1e-9, 5) * (Math.exp(Math.min(exponent, 700)) - 1));
    return isFinite(val) ? val : 0;
}

function blackbodyColor(T: number) {
    if (T < 1000) return '#450a0a'; // Dark Red (Dull)
    if (T < 2000) return '#ef4444'; // Red
    if (T < 3500) return '#f97316'; // Orange
    if (T < 5500) return '#fbbf24'; // Yellow/Amber
    if (T < 7500) return '#ffffff'; // White
    return '#bae6fd'; // Blue-White
}

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
    if (w < 0 || h < 0) return;
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

export default HeatTransferBlackbodyLab;
