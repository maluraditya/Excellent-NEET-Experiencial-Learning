import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Activity, ZoomIn } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface WaveOpticsLabProps {
    topic: any;
    onExit: () => void;
}

const WaveOpticsLab: React.FC<WaveOpticsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    const [isPlaying, setIsPlaying] = useState(true);
    // Simulation parameters conceptually mapped
    const [wavelength, setWavelength] = useState(500); // nm (Visual color and fringe spacing)
    const [slitSeparation, setSlitSeparation] = useState(2.0); // mm (Visual gap)
    const [screenDistance, setScreenDistance] = useState(1.0); // m

    // Wavelength to RGB approximation
    const getWavelengthColor = (wl: number) => {
        let R, G, B;
        if (wl >= 380 && wl < 440) { R = -(wl - 440) / (440 - 380); G = 0.0; B = 1.0; }
        else if (wl >= 440 && wl < 490) { R = 0.0; G = (wl - 440) / (490 - 440); B = 1.0; }
        else if (wl >= 490 && wl < 510) { R = 0.0; G = 1.0; B = -(wl - 510) / (510 - 490); }
        else if (wl >= 510 && wl < 580) { R = (wl - 510) / (580 - 510); G = 1.0; B = 0.0; }
        else if (wl >= 580 && wl < 645) { R = 1.0; G = -(wl - 645) / (645 - 580); B = 0.0; }
        else if (wl >= 645 && wl <= 780) { R = 1.0; G = 0.0; B = 0.0; }
        else { R = 0.0; G = 0.0; B = 0.0; }

        let alpha = 1.0;
        if (wl >= 380 && wl < 420) { alpha = 0.3 + 0.7 * (wl - 380) / (420 - 380); }
        else if (wl >= 700 && wl <= 780) { alpha = 0.3 + 0.7 * (780 - wl) / (780 - 700); }

        return { r: Math.round(R * 255), g: Math.round(G * 255), b: Math.round(B * 255), a: alpha };
    };

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
        if (!isPlaying) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let time = 0;
        let lastTime = performance.now();

        const render = (timeMs: number) => {
            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;
            const dt = (timeMs - lastTime) / 1000;
            lastTime = timeMs;
            time += dt * 30; // speed of wave animation

            ctx.clearRect(0, 0, width, height);

            // Black background for light simulation
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);

            const colorRGB = getWavelengthColor(wavelength);
            const waveColorBase = `rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}`;

            // --- Simulation Setup ---
            const d_pixels = slitSeparation * 20; // visual scaling
            const D_pixels = 300 + screenDistance * 200; // Screen X pos
            const s1 = { x: 100, y: centerY - d_pixels / 2 };
            const s2 = { x: 100, y: centerY + d_pixels / 2 };

            // Draw Slit Barrier
            ctx.fillStyle = '#475569';
            const slitWidth = 10;
            const barrierWidth = 12;
            ctx.fillRect(s1.x - barrierWidth / 2, 0, barrierWidth, centerY - d_pixels / 2 - slitWidth / 2); // Top
            ctx.fillRect(s1.x - barrierWidth / 2, centerY - d_pixels / 2 + slitWidth / 2, barrierWidth, d_pixels - slitWidth); // Middle
            ctx.fillRect(s1.x - barrierWidth / 2, centerY + d_pixels / 2 + slitWidth / 2, barrierWidth, height - (centerY + d_pixels / 2 + slitWidth / 2)); // Bottom

            // Draw Incident plane waves (left side)
            ctx.strokeStyle = `${waveColorBase}, 0.3)`;
            ctx.lineWidth = 2;
            const waveSpacing = wavelength / 15; // Visual scaling for lambda
            for (let x = (time % waveSpacing); x < s1.x - barrierWidth / 2; x += waveSpacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            // --- Draw Radiating Circular Waves (Huygens Principle) ---
            ctx.lineWidth = 1.5;
            for (let r = (time % waveSpacing); r < D_pixels - s1.x; r += waveSpacing) {
                const opacity = Math.max(0, 1 - r / (D_pixels - s1.x + 100)); // fade out
                ctx.strokeStyle = `${waveColorBase}, ${opacity * 0.4})`;

                // Slit 1
                ctx.beginPath(); ctx.arc(s1.x, s1.y, r, -Math.PI / 2, Math.PI / 2); ctx.stroke();
                // Slit 2
                ctx.beginPath(); ctx.arc(s2.x, s2.y, r, -Math.PI / 2, Math.PI / 2); ctx.stroke();
            }

            // --- Draw Screen & Interference Pattern (Right Side) ---
            const screenX = D_pixels;

            // Screen Line
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(screenX, 20); ctx.lineTo(screenX, height - 20); ctx.stroke();

            ctx.fillStyle = '#94a3b8'; ctx.font = '12px sans-serif';
            ctx.fillText('Screen', screenX - 20, 15);

            // Calculate Intensity graph: I = 4 I0 cos^2 (pi * d * y / lambda * D)
            // Visually map y to screen height centered at centerY
            ctx.beginPath();
            ctx.strokeStyle = `${waveColorBase}, 0.8)`;
            ctx.lineWidth = 2;

            for (let y = 20; y < height - 20; y += 2) {
                // Precise Path difference delta = d * sin(theta) ≈ d * (y - centerY) / D
                const pathDiff = (slitSeparation * (y - centerY)) / (screenDistance * 100);
                // phase = 2pi * pathDiff / lambda_visual
                const phase = (2 * Math.PI * pathDiff) / (wavelength / 100);

                // Intensity factor
                const intensity = Math.pow(Math.cos(phase / 2), 2);

                // Draw Intensity Graph Curve spreading to the right
                const graphX = screenX + 10 + intensity * 60;
                if (y === 20) ctx.moveTo(graphX, y);
                else ctx.lineTo(graphX, y);

                // Draw bright fringes physically on the screen line
                if (intensity > 0.1) {
                    ctx.fillStyle = `${waveColorBase}, ${intensity})`;
                    ctx.fillRect(screenX - 4, y, 8, 2);
                }
            }
            ctx.stroke();

            // Label Graph
            ctx.fillStyle = `${waveColorBase}, 0.8)`;
            ctx.fillText('Intensity', screenX + 25, 15);

            // Draw Central Maxima Line (Axis)
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(s1.x, centerY); ctx.lineTo(screenX + 80, centerY); ctx.stroke();
            ctx.setLineDash([]);

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying, wavelength, slitSeparation, screenDistance]);

    // Derived formulas
    // β = λD / d
    const fringeWidth = ((wavelength * Math.pow(10, -9) * screenDistance) / (slitSeparation * Math.pow(10, -3))) * 1000; // in mm

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex flex-col">
            <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700 pointer-events-none">
                <div className="flex flex-col gap-1 text-xs font-mono text-slate-300">
                    <span className="font-bold text-white mb-1">YDSE Setup</span>
                    <span>λ = {wavelength} nm</span>
                    <span>d = {slitSeparation.toFixed(1)} mm</span>
                    <span>D = {screenDistance.toFixed(1)} m</span>
                </div>
            </div>

            <div className="flex-1 relative min-h-[300px]">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                />
            </div>

            <div className="bg-slate-950 text-white flex justify-around items-center p-3 text-sm font-mono border-t border-slate-800">
                <div className="flex flex-col items-center">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider">Fringe Width (β)</span>
                    <span className="text-amber-400 font-bold">{fringeWidth.toFixed(3)} mm</span>
                </div>
                <div className="flex flex-col items-center border-l border-slate-800 pl-8 text-center text-[10px] text-slate-400">
                    <span>β = λD / d</span>
                    <span>Directly proportional to λ and D</span>
                    <span>Inversely proportional to d</span>
                </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-lg text-sm font-bold shadow transition-colors bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600`}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col w-full h-full">
            <div className="p-6 flex flex-col gap-6 w-full flex-1 overflow-y-auto">
                <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-sm">
                    Young's Double Slit Experiment (YDSE) demonstrates the wave nature of light. <br />
                    Constructive interference forms bright fringes where path difference <span className="font-mono">Δx = nλ</span>. <br />
                    Destructive interference forms dark fringes where <span className="font-mono">Δx = (n + ½)λ</span>.
                </div>

                <div className="grid md:grid-cols-1 gap-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span className="flex items-center gap-2"><Activity size={14} /> Wavelength (λ)</span>
                                <span className="font-mono bg-slate-100 px-2 rounded" style={{ color: `rgb(${getWavelengthColor(wavelength).r}, ${getWavelengthColor(wavelength).g}, ${getWavelengthColor(wavelength).b})` }}>
                                    {wavelength} nm
                                </span>
                            </label>
                            <input
                                type="range" min="380" max="750" step="5"
                                value={wavelength}
                                onChange={(e) => setWavelength(Number(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                style={{
                                    background: 'linear-gradient(to right, #7e22ce, #3b82f6, #10b981, #eab308, #ef4444)'
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span>Slit Separation (d)</span>
                                <span className="text-slate-700 font-mono bg-slate-100 px-2 rounded">{slitSeparation.toFixed(1)} mm</span>
                            </label>
                            <input
                                type="range" min="0.5" max="5.0" step="0.1"
                                value={slitSeparation}
                                onChange={(e) => setSlitSeparation(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                            />
                            <p className="text-[10px] text-slate-400">Decreasing identical slit gap increases the fringe width.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span>Screen Distance (D)</span>
                                <span className="text-slate-700 font-mono bg-slate-100 px-2 rounded">{screenDistance.toFixed(1)} m</span>
                            </label>
                            <input
                                type="range" min="0.5" max="3.0" step="0.1"
                                value={screenDistance}
                                onChange={(e) => setScreenDistance(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                            />
                            <p className="text-[10px] text-slate-400">Increasing screen distance increases fringe width proportionately.</p>
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

export default WaveOpticsLab;
