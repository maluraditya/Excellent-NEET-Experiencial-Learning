import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff, HelpCircle, X, Zap, Activity } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type SimulationMode = 'faraday' | 'acgenerator';

interface EMILabProps {
    topic: any;
    onExit: () => void;
}

const ElectromagneticInductionLab: React.FC<EMILabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const graphCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    const [mode, setMode] = useState<SimulationMode>('faraday');
    const [isPlaying, setIsPlaying] = useState(true);
    const [showFieldLines, setShowFieldLines] = useState(true);

    // Faraday mode state
    const [magnetX, setMagnetX] = useState(100);
    const [magnetVelocity, setMagnetVelocity] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const lastMouseX = useRef(0);
    const [galvanometerAngle, setGalvanometerAngle] = useState(0);
    const [bulbBrightness, setBulbBrightness] = useState(0);

    // AC Generator mode state
    const [angularSpeed, setAngularSpeed] = useState(1);
    const [coilAngle, setCoilAngle] = useState(0);
    const fluxHistory = useRef<number[]>([]);
    const emfHistory = useRef<number[]>([]);

    // Constants
    const COIL_CENTER_X = 450;
    const COIL_LEFT = 380;
    const COIL_RIGHT = 520;

    // Reset simulation
    const handleReset = useCallback(() => {
        setMagnetX(100);
        setMagnetVelocity(0);
        setGalvanometerAngle(0);
        setBulbBrightness(0);
        setCoilAngle(0);
        fluxHistory.current = [];
        emfHistory.current = [];
    }, []);

    // Mouse handlers for dragging magnet
    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'faraday') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);

        if (mouseX >= magnetX && mouseX <= magnetX + 120) {
            setIsDragging(true);
            lastMouseX.current = mouseX;
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || mode !== 'faraday') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);

        // Movement is 1:1 with mouse when dragged
        const delta = mouseX - lastMouseX.current;
        setMagnetVelocity(delta);
        setMagnetX(prev => Math.max(20, Math.min(prev + delta, 600)));
        lastMouseX.current = mouseX;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setMagnetVelocity(0);
    };

    // Calculate Flux realistically for Faraday mode
    // Using a Gaussian curve for the axial magnetic field B(x) of a dipole:
    // Phi(x) ~ B0 * exp(-((x - c)/w)^2)
    const getFluxAtPosition = (x: number) => {
        const magnetCenter = x + 60;
        const dist = magnetCenter - COIL_CENTER_X;
        // Width of the coil field effectively
        const w = 100;
        return Math.exp(-(dist * dist) / (w * w)); // Returns 0 to 1
    };

    // Main animation loop
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

        let lastTime = performance.now();

        const render = (time: number) => {
            const width = canvas.width;
            const height = canvas.height;
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            ctx.clearRect(0, 0, width, height);

            if (mode === 'faraday') {
                renderFaradayMode(ctx, width, height, dt);
            } else {
                renderACGeneratorMode(ctx, width, height, dt);
                const graphCanvas = graphCanvasRef.current;
                if (graphCanvas) {
                    const graphCtx = graphCanvas.getContext('2d');
                    if (graphCtx) renderGraphs(graphCtx, graphCanvas.width, graphCanvas.height);
                }
            }
            animationRef.current = requestAnimationFrame(render);
        };

        const renderFaradayMode = (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
            const centerY = h / 2;

            // EMF = - N * (dΦ/dt)
            // dΦ/dt = (dΦ/dx) * (dx/dt)
            // if Φ(x) = exp(-((x-c)/w)^2), 
            // dΦ/dx = -2*(x-c)/w^2 * Φ(x)
            const magnetCenter = magnetX + 60;
            const dist = magnetCenter - COIL_CENTER_X;
            const w_width = 100;
            const flux = getFluxAtPosition(magnetX);
            const dFluxDx = -2 * dist / (w_width * w_width) * flux;

            // magnetVelocity is px/frame based on mouse. If we drag, velocity is non-zero.
            // Let's smooth velocity to prevent instantaneous jumps
            const v = magnetVelocity * 60; // scale to px/sec roughly

            // NCERT concept: Change in flux induces EMF (ε = -dΦ/dt)
            const emf = -dFluxDx * v * 50; // Scaling factor for visual effect

            // Update galvanometer (decaying physics with inertia)
            const targetAngle = Math.max(-45, Math.min(45, emf));
            setGalvanometerAngle(prev => {
                // simple spring-damper
                return prev * 0.8 + targetAngle * 0.2;
            });

            // Update bulb brightness
            const absEmf = Math.abs(emf);
            const targetBrightness = Math.min(1, absEmf / 20);
            setBulbBrightness(prev => prev * 0.85 + targetBrightness * 0.15);

            // Drawings
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, w, h);

            // Highlight Flux Area
            if (showFieldLines && flux > 0.05) {
                ctx.fillStyle = `rgba(250, 204, 21, ${flux * 0.3})`;
                ctx.fillRect(COIL_LEFT - 20, centerY - 60, (COIL_RIGHT - COIL_LEFT) + 40, 120);
            }

            // Draw Coil
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 4;
            const coilRadius = 50;
            const numTurns = 12;
            for (let i = 0; i < numTurns; i++) {
                const x = COIL_LEFT + (i / numTurns) * (COIL_RIGHT - COIL_LEFT);
                ctx.beginPath();
                ctx.ellipse(x, centerY, 8, coilRadius, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Outline of Coil Core
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 2;
            ctx.strokeRect(COIL_LEFT, centerY - coilRadius, COIL_RIGHT - COIL_LEFT, coilRadius * 2);

            // Wires
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(COIL_LEFT, centerY + coilRadius);
            ctx.lineTo(COIL_LEFT, h - 80);
            ctx.lineTo(550, h - 80);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(COIL_RIGHT, centerY + coilRadius);
            ctx.lineTo(COIL_RIGHT, h - 120);
            ctx.lineTo(700, h - 120);
            ctx.lineTo(700, h - 80);
            ctx.stroke();

            // Galvanometer
            const galvoX = 660, galvoY = h - 80;
            ctx.fillStyle = '#e2e8f0';
            ctx.strokeStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(galvoX, galvoY, 40, Math.PI, 0);
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.font = '10px monospace';
            ctx.fillText('-  0  +', galvoX - 15, galvoY - 5);

            // Needle
            ctx.save();
            ctx.translate(galvoX, galvoY);
            ctx.rotate(galvanometerAngle * Math.PI / 180);
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-2, -35); ctx.lineTo(2, -35);
            ctx.fill();
            ctx.restore();

            // Lamp
            const bulbX = 550, bulbY = h - 80;
            if (bulbBrightness > 0.05) {
                const glow = ctx.createRadialGradient(bulbX, bulbY - 20, 0, bulbX, bulbY - 20, 60 * bulbBrightness);
                glow.addColorStop(0, `rgba(250, 204, 21, ${bulbBrightness})`);
                glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(bulbX, bulbY - 20, 60, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = bulbBrightness > 0.1 ? `rgba(250,204,21,${0.5 + bulbBrightness * 0.5})` : '#f1f5f9';
            ctx.beginPath(); ctx.arc(bulbX, bulbY - 20, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

            // Magnet
            const magnetW = 120, magnetH = 50, magnetY = centerY - 25;
            ctx.fillStyle = '#1d4ed8'; // South (Blue)
            ctx.fillRect(magnetX, magnetY, magnetW / 2, magnetH);
            ctx.fillStyle = '#b91c1c'; // North (Red)
            ctx.fillRect(magnetX + magnetW / 2, magnetY, magnetW / 2, magnetH);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText('S', magnetX + 25, centerY + 8);
            ctx.fillText('N', magnetX + 85, centerY + 8);

            // Field Lines
            if (showFieldLines) {
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(magnetX + 120, centerY + i * 20);
                    ctx.quadraticCurveTo(magnetX + 200, centerY + i * 50, COIL_CENTER_X, centerY + i * 20);
                    ctx.stroke();
                }
                ctx.setLineDash([]);
            }

            if (!isDragging) {
                ctx.fillStyle = '#64748b';
                ctx.font = '14px sans-serif';
                ctx.fillText('← Drag Magnet →', magnetX + 10, magnetY - 15);
            }
        };

        const renderACGeneratorMode = (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => {
            const centerX = w / 2;
            const centerY = h / 2 - 20;

            // NCERT: Φ(t) = NAB cos(ωt), Ε = -dΦ/dt = NABω sin(ωt)
            // EMF amplitude is directly proportional to angularSpeed (ω)
            setCoilAngle(prev => prev + angularSpeed * dt);

            const flux = Math.cos(coilAngle);
            const emf = angularSpeed * Math.sin(coilAngle);

            fluxHistory.current.push(flux);
            emfHistory.current.push(emf);
            if (fluxHistory.current.length > 200) {
                fluxHistory.current.shift();
                emfHistory.current.shift();
            }

            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, w, h);

            // Magnets
            ctx.fillStyle = '#ef4444'; // North
            ctx.fillRect(centerX - 150, centerY - 60, 40, 120);
            ctx.fillStyle = 'white'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('N', centerX - 135, centerY + 8);

            ctx.fillStyle = '#3b82f6'; // South
            ctx.fillRect(centerX + 110, centerY - 60, 40, 120);
            ctx.fillStyle = 'white'; ctx.fillText('S', centerX + 125, centerY + 8);

            // B-Field Lines
            if (showFieldLines) {
                ctx.strokeStyle = '#94a3b8';
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath(); ctx.moveTo(centerX - 110, centerY + i * 20); ctx.lineTo(centerX + 110, centerY + i * 20); ctx.stroke();
                }
            }

            // Coil
            const coilW = 100, coilH = 100;
            const projectedW = coilW * Math.abs(Math.cos(coilAngle));
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 6;
            ctx.strokeRect(centerX - projectedW / 2, centerY - coilH / 2, projectedW, coilH);

            // Slip Rings & Wires
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(centerX - 10, centerY + coilH / 2, 20, 10);
            ctx.strokeStyle = '#475569';
            ctx.beginPath(); ctx.moveTo(centerX, centerY + coilH / 2 + 10); ctx.lineTo(centerX, h - 40); ctx.stroke();

            // Lamp brightness proportional to |EMF|
            // Divide by max possible EMF (angularSpeed = 10 -> peak EMF = 10)
            const brightness = Math.min(1, Math.abs(emf) / 10);
            const lampX = centerX + 50, lampY = h - 40;

            ctx.beginPath(); ctx.moveTo(centerX, h - 40); ctx.lineTo(lampX, lampY); ctx.stroke();

            if (brightness > 0.05) {
                const glow = ctx.createRadialGradient(lampX, lampY - 15, 0, lampX, lampY - 15, 40 * brightness);
                glow.addColorStop(0, `rgba(250, 204, 21, ${brightness})`);
                glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(lampX, lampY - 15, 40, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = brightness > 0.1 ? `rgba(250,204,21,${0.3 + brightness * 0.7})` : '#e2e8f0';
            ctx.beginPath(); ctx.arc(lampX, lampY - 15, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.font = '12px sans-serif';
            ctx.fillText(`ω = ${angularSpeed.toFixed(1)} rad/s`, centerX - 80, centerY - 80);
        };

        const renderGraphs = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.clearRect(0, 0, w, h);
            const padding = 30;
            const graphH = h / 2;

            // Axes
            ctx.strokeStyle = '#cbd5e1';
            ctx.beginPath(); ctx.moveTo(padding, graphH / 2); ctx.lineTo(w - 10, graphH / 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(padding, graphH + graphH / 2); ctx.lineTo(w - 10, graphH + graphH / 2); ctx.stroke();

            // Plot Flux
            ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
            ctx.beginPath();
            fluxHistory.current.forEach((v, i) => {
                const x = padding + (i / 200) * (w - padding - 10);
                const y = graphH / 2 - v * (graphH / 2 - 10);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Plot EMF (Scale down EMF by max AngularSpeed 10 for fitting)
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            emfHistory.current.forEach((v, i) => {
                const x = padding + (i / 200) * (w - padding - 10);
                // peak is 10, so divide by 10
                const y = graphH + graphH / 2 - (v / 10) * (graphH / 2 - 10);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();

            ctx.fillStyle = '#3b82f6'; ctx.font = '10px sans'; ctx.fillText('Flux (Φ)', padding, 15);
            ctx.fillStyle = '#ef4444'; ctx.fillText('EMF (ε)', padding, graphH + 15);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying, mode, magnetX, magnetVelocity, showFieldLines, angularSpeed, coilAngle, isDragging]);

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full mix-blend-multiply cursor-pointer"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
            </div>
            {mode === 'acgenerator' && (
                <div className="h-32 bg-slate-50 border-t border-slate-300 relative">
                    <canvas ref={graphCanvasRef} width={800} height={128} className="w-full h-full object-contain" />
                </div>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setShowFieldLines(!showFieldLines)} className={`p-2 rounded-lg text-sm font-bold shadow transition-colors ${showFieldLines ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    {showFieldLines ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-lg text-sm font-bold shadow transition-colors bg-white text-slate-700 hover:bg-slate-50`}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 w-full">
            <div className="flex justify-center gap-4 border-b border-slate-100 pb-4">
                <button onClick={() => { setMode('faraday'); handleReset(); }} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${mode === 'faraday' ? 'bg-amber-100 text-amber-800 border-2 border-amber-300' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                    <Zap size={20} /> Faraday's Law (Magnet & Coil)
                </button>
                <button onClick={() => { setMode('acgenerator'); handleReset(); }} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${mode === 'acgenerator' ? 'bg-amber-100 text-amber-800 border-2 border-amber-300' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                    <Activity size={20} /> AC Generator
                </button>
            </div>

            {mode === 'faraday' && (
                <div className="text-center p-4 bg-amber-50 rounded-lg text-amber-800 text-sm">
                    An induced electromotive force (EMF) is generated whenever there is a <strong>rate of change of magnetic flux</strong> linked with the circuit. <br /><br />
                    <em>Try dragging the magnet back and forth rapidly! Notice how the bulb only glows when the magnet is <strong>moving</strong>.</em>
                </div>
            )}

            {mode === 'acgenerator' && (
                <div className="space-y-4">
                    <div className="text-center p-4 bg-amber-50 rounded-lg text-amber-800 text-sm">
                        EMF = N•A•B•ω•sin(ωt). The peak voltage (and bulb brightness) is directly proportional to the rotation speed (ω).
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase flex justify-between items-center">
                            <span>Angular Speed (ω)</span>
                            <span className="text-amber-700 bg-amber-100 px-3 py-1 rounded-lg font-mono">{angularSpeed.toFixed(1)} rad/s</span>
                        </label>
                        <input
                            type="range" min="1" max="10" step="0.5"
                            value={angularSpeed}
                            onChange={(e) => setAngularSpeed(Number(e.target.value))}
                            className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            )}
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

export default ElectromagneticInductionLab;
