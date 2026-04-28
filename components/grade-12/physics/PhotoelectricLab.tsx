import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, Target } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PhotoelectricLabProps {
    topic: any;
    onExit: () => void;
}

const MATERIALS = [
    { id: 'cs', name: 'Cesium (Cs)', workFunction: 2.14 },
    { id: 'k', name: 'Potassium (K)', workFunction: 2.30 },
    { id: 'na', name: 'Sodium (Na)', workFunction: 2.75 },
    { id: 'zn', name: 'Zinc (Zn)', workFunction: 4.31 },
    { id: 'pt', name: 'Platinum (Pt)', workFunction: 5.65 }
] as const;

type MaterialId = typeof MATERIALS[number]['id'];

const PhotoelectricLab: React.FC<PhotoelectricLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    const [isPlaying, setIsPlaying] = useState(true);
    const [wavelength, setWavelength] = useState(400); // nm (UV to Red)
    const [intensity, setIntensity] = useState(50); // %
    const [materialId, setMaterialId] = useState<MaterialId>('na');
    const [voltage, setVoltage] = useState(0); // Volts (retarding/accelerating)

    const material = MATERIALS.find(m => m.id === materialId)!;

    // Derived values
    const hc_eV_nm = 1240; // approx
    const photonEnergy = hc_eV_nm / wavelength;
    const kMax = Math.max(0, photonEnergy - material.workFunction);
    const stoppingPotential = -kMax; // V0

    // Visual Wavelength Color
    const getWavelengthColor = (wl: number) => {
        let R, G, B;
        if (wl >= 380 && wl < 440) { R = -(wl - 440) / (440 - 380); G = 0.0; B = 1.0; }
        else if (wl >= 440 && wl < 490) { R = 0.0; G = (wl - 440) / (490 - 440); B = 1.0; }
        else if (wl >= 490 && wl < 510) { R = 0.0; G = 1.0; B = -(wl - 510) / (510 - 490); }
        else if (wl >= 510 && wl < 580) { R = (wl - 510) / (580 - 510); G = 1.0; B = 0.0; }
        else if (wl >= 580 && wl < 645) { R = 1.0; G = -(wl - 645) / (645 - 580); B = 0.0; }
        else if (wl >= 645 && wl <= 780) { R = 1.0; G = 0.0; B = 0.0; }
        else { R = 0.5; G = 0.0; B = 0.5; } // UV as dark purple

        let alpha = 1.0;
        if (wl < 380) { alpha = 0.2; R = 0.8; G = 0; B = 1; } // Fake UV visually
        return `rgba(${Math.round(R * 255)}, ${Math.round(G * 255)}, ${Math.round(B * 255)}, ${alpha})`;
    };

    const handleReset = useCallback(() => {
        setWavelength(400);
        setIntensity(50);
        setVoltage(0);
        setMaterialId('na');
    }, []);

    // Refs for simulation state
    const photonsRef = useRef<{ x: number, y: number }[]>([]);
    const electronsRef = useRef<{ x: number, y: number, vx: number, vy: number, maxKe: number }[]>([]);
    const photocurrentRef = useRef<number>(0);

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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = performance.now();
        let currentDrawCount = 0;

        const render = (timeMs: number) => {
            const width = canvas.width;
            const height = canvas.height;
            const dt = Math.min((timeMs - lastTime) / 1000, 0.1);
            lastTime = timeMs;

            ctx.clearRect(0, 0, width, height);

            // Background
            ctx.fillStyle = '#1e293b'; // Dark
            ctx.fillRect(0, 0, width, height);

            // --- Draw Apparatus ---
            // Glass Tube
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(100, 50, width - 200, 200, 40);
            ctx.stroke();

            // Window for light
            ctx.strokeStyle = '#38bdf8'; // Blueish glass highlight
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(width / 2, 50, 30, Math.PI, 0); // Opening arc
            ctx.stroke();

            // Cathode (Emitter) Plate (Left)
            ctx.fillStyle = '#cbd5e1'; // Silver/gray
            ctx.fillRect(120, 80, 20, 140);
            ctx.fillStyle = '#0f172a';
            ctx.font = '12px sans-serif'; ctx.fillText(material.name, 100, 240);

            // Anode (Collector) Plate (Right)
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(width - 140, 80, 20, 140);
            ctx.fillText('Collector', width - 150, 240);

            // Circuit Wiring
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(130, 220);
            ctx.lineTo(130, 280);
            ctx.lineTo(width / 2 - 40, 280); // To ammeter
            ctx.moveTo(width / 2 + 40, 280);
            ctx.lineTo(width - 130, 280);
            ctx.lineTo(width - 130, 220); // From anode
            ctx.stroke();

            // Battery (Variable Voltage)
            ctx.beginPath();
            const batCenter = width / 2 + 100;
            ctx.moveTo(batCenter - 20, 280); ctx.lineTo(batCenter - 20, 295); ctx.stroke(); // Long
            ctx.lineWidth = 4;
            ctx.moveTo(batCenter + 10, 280); ctx.lineTo(batCenter + 10, 290); ctx.stroke(); // Short
            ctx.lineWidth = 2;
            ctx.fillStyle = '#cbd5e1'; ctx.fillText(`${voltage > 0 ? '+' : ''}${voltage.toFixed(2)} V`, batCenter - 15, 315);

            // Ammeter
            ctx.beginPath();
            ctx.arc(width / 2, 280, 25, 0, Math.PI * 2);
            ctx.fillStyle = '#334155'; ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center'; ctx.font = 'bold 16px sans-serif';
            ctx.fillText('μA', width / 2, 285);
            ctx.textAlign = 'left';

            // --- Physics Tick ---
            if (isPlaying) {
                const isEjecting = photonEnergy > material.workFunction;
                const activeColor = getWavelengthColor(wavelength);

                // Spawn Photons (Rate proportional to intensity)
                // Intensity ranges 0 - 100, spawn probability per frame approx 0.0 - 1.0 (adjusted for dt)
                const spawnProb = (intensity / 100) * 15 * dt;
                let toSpawn = Math.floor(spawnProb) + (Math.random() < (spawnProb % 1) ? 1 : 0);

                for (let i = 0; i < toSpawn; i++) {
                    const startX = width / 2 - 20 + Math.random() * 40;
                    photonsRef.current.push({
                        x: startX,
                        y: 0
                    });
                }

                // Update Photons
                for (let i = photonsRef.current.length - 1; i >= 0; i--) {
                    const p = photonsRef.current.length ? photonsRef.current[i] : null;
                    if (!p) continue;

                    // Aim towards cathode
                    const targetX = 130 + Math.random() * 10;
                    const targetY = 150 + (Math.random() - 0.5) * 100;
                    const dx = targetX - p.x;
                    const dy = targetY - p.y;
                    const mag = Math.hypot(dx, dy);

                    p.x += (dx / mag) * 400 * dt; // Photon Speed
                    p.y += (dy / mag) * 400 * dt;

                    // Draw Photon (wavy line or particle)
                    ctx.fillStyle = activeColor;
                    ctx.shadowColor = activeColor;
                    ctx.shadowBlur = 10;
                    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0;

                    // Hit Cathode?
                    if (p.x <= 140 && p.y >= 80 && p.y <= 220) {
                        photonsRef.current.splice(i, 1);
                        // Eject electron? (1 to 1 probability if E > phi, simply scale by intensity)
                        if (isEjecting) {
                            // If applied retarding voltage exceeds stopping potential, electron cannot escape cathode
                            if (voltage < -kMax) {
                                // Electron is stopped before leaving cathode — do not spawn
                            } else {
                                // Initial velocity depends on K.E.
                                // K_max = hf - phi
                                // K_actual is randomly between 0 and K_max (electrons come from different depths)
                                const kActual = Math.random() * kMax;
                                const vBase = Math.sqrt(kActual) * 50; // Visual scaling for speed
                                electronsRef.current.push({
                                    x: 140,
                                    y: p.y,
                                    vx: vBase,
                                    vy: (Math.random() - 0.5) * 20, // Small spread
                                    maxKe: kMax
                                });
                            }
                        }
                    } else if (p.y > height) {
                        photonsRef.current.splice(i, 1); // Missed
                    }
                }

                // Update Electrons
                // Acceleration a = F/m = (eE / m). 
                // E = -V/d (V is anode voltage relative to cathode).
                // So acceleration a_x is proportional to V.
                const ax = (voltage * 150); // Visual scaling. If V < 0 (retarding), ax < 0.

                for (let i = electronsRef.current.length - 1; i >= 0; i--) {
                    const e = electronsRef.current[i];

                    // Apply acceleration
                    e.vx += ax * dt;

                    // Move
                    e.x += e.vx * dt;
                    e.y += e.vy * dt;

                    // Draw Electron
                    ctx.fillStyle = '#fef08a'; // Bright yellow
                    ctx.beginPath(); ctx.arc(e.x, e.y, 2, 0, Math.PI * 2); ctx.fill();

                    // Hit Anode? (Successfully crossed)
                    if (e.x >= width - 140) {
                        electronsRef.current.splice(i, 1);
                        currentDrawCount += 1; // Contributes to current
                    }
                    // Turned back and hit Cathode?
                    else if (e.x <= 140 && e.vx < 0) {
                        electronsRef.current.splice(i, 1);
                    }
                    // Hit walls?
                    else if (e.y < 50 || e.y > 250) {
                        electronsRef.current.splice(i, 1);
                    }
                }
            }

            // Smooth Current Reading for ammeter UI
            photocurrentRef.current = photocurrentRef.current * 0.9 + (currentDrawCount * 1.5) * 0.1;

            // Draw Current Arc
            const currentRatio = Math.min(1, photocurrentRef.current / 50); // arbitrary max scale
            const angle = Math.PI * 0.8 + currentRatio * Math.PI * 0.4; // Arc sweep
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(width / 2, 280);
            ctx.lineTo(width / 2 + Math.cos(angle) * 20, 280 + Math.sin(angle) * 20);
            ctx.stroke();

            if (isPlaying) {
                animationRef.current = requestAnimationFrame(render);
            }
        };

        if (isPlaying) {
            animationRef.current = requestAnimationFrame(render);
        } else {
            // Static render once when paused
            render(performance.now());
        }

        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying, wavelength, intensity, material, voltage]);

    const isEjecting = photonEnergy > material.workFunction;

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>

            <div className="bg-slate-900 text-white flex justify-around items-center p-3 text-sm font-mono border-t border-slate-700">
                <div className="flex flex-col items-center">
                    <span className="text-slate-400 text-[10px] uppercase">Photon Energy (E)</span>
                    <span className="text-blue-400 font-bold">{photonEnergy.toFixed(2)} eV</span>
                </div>
                <div className="flex flex-col items-center border-l border-slate-700 pl-6">
                    <span className="text-slate-400 text-[10px] uppercase">Work Function (Φ₀)</span>
                    <span className="text-amber-400 font-bold">{material.workFunction.toFixed(2)} eV</span>
                </div>
                <div className="flex flex-col items-center border-l border-slate-700 pl-6">
                    <span className="text-slate-400 text-[10px] uppercase">Max Kinetic Energy (K_max)</span>
                    <span className="text-emerald-400 font-bold">{isEjecting ? kMax.toFixed(2) : '0.00'} eV</span>
                </div>
                <div className="flex flex-col items-center border-l border-slate-700 pl-6">
                    <span className="text-slate-400 text-[10px] uppercase">|V₀| (magnitude)</span>
                    <span className="text-red-400 font-bold">{isEjecting ? Math.abs(stoppingPotential).toFixed(2) : '0.00'} V</span>
                    <span className="text-slate-500 text-[9px] text-center max-w-[110px]">Stopping potential is applied as a retarding voltage; its magnitude equals K_max / e.</span>
                </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-lg text-sm font-bold shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200`}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col w-full h-full">
            <div className="p-6 flex flex-col gap-6 w-full flex-1 overflow-y-auto">
                <div className="text-center p-4 bg-purple-50 border border-purple-100 rounded-lg text-purple-900 text-sm">
                    <strong>Einstein's Photoelectric Equation:</strong> <span className="font-mono">K_max = hν - Φ₀</span><br />
                    Emission occurs only if photon energy (hν) {'>'} work function (Φ₀). <br />
                    Intensity increases saturation current, but stopping potential (V₀) depends only on frequency.
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span className="flex items-center gap-1"><Target size={14} /> Target Material</span>
                            </label>
                            <select
                                value={materialId}
                                onChange={(e) => setMaterialId(e.target.value as MaterialId)}
                                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium"
                            >
                                {MATERIALS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} (Φ₀ = {m.workFunction} eV)</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span className="flex items-center gap-1"><Zap size={14} /> Wavelength (λ)</span>
                                <span className="font-mono bg-blue-50 text-blue-700 px-2 rounded">{wavelength} nm</span>
                            </label>
                            <input
                                type="range" min="150" max="750" step="5"
                                value={wavelength}
                                onChange={(e) => setWavelength(Number(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                style={{
                                    background: 'linear-gradient(to right, #000, #7e22ce, #3b82f6, #10b981, #eab308, #ef4444)'
                                }}
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>UV (Higher E)</span>
                                <span>IR (Lower E)</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span>Light Intensity</span>
                                <span className="text-slate-700 font-mono bg-slate-100 px-2 rounded">{intensity}%</span>
                            </label>
                            <input
                                type="range" min="10" max="100" step="5"
                                value={intensity}
                                onChange={(e) => setIntensity(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <p className="text-[10px] text-slate-500 italic">Increasing intensity increases saturation current but does NOT change the stopping potential V₀. (NCERT Ch. 11)</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span>Applied Voltage (V)</span>
                                <span className={`font-mono px-2 rounded ${voltage < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {voltage.toFixed(2)} V
                                </span>
                            </label>
                            <input
                                type="range" min="-10" max="10" step="0.1"
                                value={voltage}
                                onChange={(e) => setVoltage(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Retarding (-)</span>
                                <span>Accelerating (+)</span>
                            </div>
                        </div>
                    </div>
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

export default PhotoelectricLab;
