import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RotateCcw, Thermometer, Zap, Users, Shuffle } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

// Local Simulation config interfaces
interface SimulationConfig {
    temperature: number;
    activationEnergy: number;
    stericFactor: number;
    moleculeCount: number;
}
enum MoleculeState { REACTANT, PRODUCT }
interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    state: MoleculeState;
    angle: number;
    energy: number;
}

interface CollisionTheoryLabProps {
    topic: any;
    onExit: () => void;
}

const CollisionTheoryLab: React.FC<CollisionTheoryLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const particlesRef = useRef<Particle[]>([]);

    // Extracted state from App.tsx
    const [config, setConfig] = useState<SimulationConfig>({
        temperature: 300,
        activationEnergy: 120,
        stericFactor: 0.5,
        moleculeCount: 25
    });
    const [reactionCount, setReactionCount] = useState(0);
    const reactionCountRef = useRef(0);

    const handleReset = useCallback(() => {
        setConfig({
            temperature: 300,
            activationEnergy: 120,
            stericFactor: 0.5,
            moleculeCount: 25
        });
        // Component will re-initialize particles because of config ref changes in useEffect
    }, []);

    // ─── Initialize Particles ───
    useEffect(() => {
        const logicalWidth = 800;
        const logicalHeight = 500;

        const count = config.moleculeCount;
        const newParticles: Particle[] = [];
        reactionCountRef.current = 0;
        setReactionCount(0);

        for (let i = 0; i < count; i++) {
            const speed = (Math.random() * 0.5 + 0.5) * Math.sqrt(config.temperature / 100);
            const angle = Math.random() * Math.PI * 2;

            newParticles.push({
                id: i,
                x: Math.random() * logicalWidth,
                y: Math.random() * logicalHeight,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 10,
                state: MoleculeState.REACTANT,
                angle: Math.random() * Math.PI * 2,
                energy: speed * speed * 50
            });
        }
        particlesRef.current = newParticles;
    }, [config.moleculeCount, config.temperature]);

    // ─── ResizeObserver ───
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const ro = new ResizeObserver(() => {
            // We're handling scaling differently here (using logical coords)
            // But we can trigger a forced redraw if needed or rely on the animation loop.
        });
        ro.observe(parent);
        return () => ro.disconnect();
    }, []);

    // ─── Main Render & Physics ───
    const updatePhysics = (width: number, height: number, currentConfig: SimulationConfig) => {
        const particles = particlesRef.current;

        // 1. Move
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.angle += 0.05;

            if (p.x < p.radius) { p.x = p.radius; p.vx *= -1; }
            if (p.x > width - p.radius) { p.x = width - p.radius; p.vx *= -1; }
            if (p.y < p.radius) { p.y = p.radius; p.vy *= -1; }
            if (p.y > height - p.radius) { p.y = height - p.radius; p.vy *= -1; }
        });

        // 2. Collision
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < p1.radius + p2.radius) {
                    const overlap = (p1.radius + p2.radius - dist) / 2;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    p1.x -= nx * overlap;
                    p1.y -= ny * overlap;
                    p2.x += nx * overlap;
                    p2.y += ny * overlap;

                    const dvx = p2.vx - p1.vx;
                    const dvy = p2.vy - p1.vy;
                    const velAlongNormal = dvx * nx + dvy * ny;

                    if (velAlongNormal > 0) continue;

                    const impulse = velAlongNormal;
                    p1.vx += impulse * nx;
                    p1.vy += impulse * ny;
                    p2.vx -= impulse * nx;
                    p2.vy -= impulse * ny;

                    // Reaction Logic
                    const collisionEnergy = p1.energy + p2.energy;
                    const orientationSuccess = Math.random() < currentConfig.stericFactor;

                    if (
                        p1.state === MoleculeState.REACTANT &&
                        p2.state === MoleculeState.REACTANT &&
                        collisionEnergy >= currentConfig.activationEnergy &&
                        orientationSuccess
                    ) {
                        p1.state = MoleculeState.PRODUCT;
                        p2.state = MoleculeState.PRODUCT;
                        reactionCountRef.current += 1;
                        setReactionCount(reactionCountRef.current);
                    }
                }
            }
        }
    };

    const draw = (currentConfig: SimulationConfig) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        // Use parent dimensions for crisp rendering
        const displayWidth = parent.clientWidth;
        const displayHeight = parent.clientHeight;

        const dpr = window.devicePixelRatio || 1;

        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
            canvas.width = displayWidth * dpr;
            canvas.height = displayHeight * dpr;
        }
        canvas.style.width = displayWidth + 'px';
        canvas.style.height = displayHeight + 'px';

        ctx.save();
        ctx.scale(dpr, dpr);

        const logicalWidth = 800;
        const logicalHeight = 500;

        // Scale the drawing to fit the canvas proportionally
        const scaleX = displayWidth / logicalWidth;
        const scaleY = displayHeight / logicalHeight;
        const drawScale = Math.min(scaleX, scaleY);

        // Center the logical canvas inside the actual canvas
        const offsetX = (displayWidth - logicalWidth * drawScale) / 2;
        const offsetY = (displayHeight - logicalHeight * drawScale) / 2;

        ctx.translate(offsetX, offsetY);
        ctx.scale(drawScale, drawScale);

        updatePhysics(logicalWidth, logicalHeight, currentConfig);

        // Background / Container
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);

        // Rich radial gradient background
        const bgGrad = ctx.createRadialGradient(logicalWidth / 2, logicalHeight / 2, 0, logicalWidth / 2, logicalHeight / 2, logicalWidth);
        bgGrad.addColorStop(0, '#ffffff');
        bgGrad.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // Container Border
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, logicalWidth, logicalHeight);

        // Draw a soft grid for scientific feel
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1;
        for (let x = 0; x < logicalWidth; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, logicalHeight); ctx.stroke(); }
        for (let y = 0; y < logicalHeight; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(logicalWidth, y); ctx.stroke(); }

        // Particles
        particlesRef.current.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);

            ctx.beginPath();
            if (p.state === MoleculeState.PRODUCT) {
                // Energetic Red/Orange Product
                const pGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, p.radius);
                pGrad.addColorStop(0, '#fca5a5');
                pGrad.addColorStop(1, '#ef4444');
                ctx.fillStyle = pGrad;
                ctx.strokeStyle = '#b91c1c';

                // Add a permanent soft glow to products
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
            } else {
                // Cool Blue Reactant
                const pGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, p.radius);
                pGrad.addColorStop(0, '#93c5fd');
                pGrad.addColorStop(1, '#3b82f6');
                ctx.fillStyle = pGrad;
                ctx.strokeStyle = '#1d4ed8';
            }

            // Draw a more complex diatomic molecule shape
            ctx.arc(-6, 0, p.radius * 0.9, 0, Math.PI * 2);
            ctx.arc(6, 0, p.radius * 0.9, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0; // reset for stroke
            ctx.lineWidth = 2;
            ctx.stroke();

            // Sizzling glow for high energy reactants (close to Ea)
            if (p.state === MoleculeState.REACTANT && p.energy > currentConfig.activationEnergy * 0.8) {
                const glowIntensity = Math.min(25, (p.energy - currentConfig.activationEnergy * 0.8) * 0.5);
                ctx.shadowBlur = glowIntensity;
                ctx.shadowColor = '#fbbf24';
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            ctx.restore();
        });

        ctx.restore();
    };

    // Use a ref for config so the animation loop always has the latest without recreating the loop
    const configRef = useRef(config);
    useEffect(() => { configRef.current = config; }, [config]);

    useEffect(() => {
        const animate = () => {
            draw(configRef.current);
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // ─── JSX ───
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 overflow-hidden rounded-2xl border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

                {/* Overlay Dashboard */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm p-3 rounded-xl pointer-events-none">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-2 border-b border-slate-100 pb-1">Live Feed</div>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-sm font-medium text-slate-600">Total Molecules:</span>
                            <span className="font-mono font-bold text-slate-800">{config.moleculeCount}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Reactants:
                            </span>
                            <span className="font-mono font-bold text-blue-600">{config.moleculeCount - reactionCount * 2}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span> Products:
                            </span>
                            <span className="font-mono font-bold text-red-600">{reactionCount * 2}</span>
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full w-full">
            <div className="flex bg-slate-50 border-b border-slate-200 p-4 gap-2 rounded-t-xl shrink-0">
                <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Shuffle className="text-blue-500" size={20} />
                    Collision Theory Parameters
                </h3>
            </div>

            <div className="p-4 flex flex-col gap-4 w-full flex-1 overflow-y-auto max-h-[35vh] lg:max-h-[350px]">
                <div className="text-center p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-sm">
                    For a reaction to occur, molecules must collide with energy greater than the <strong>Activation Energy (Ea)</strong> and with proper orientation (controlled by <strong>Steric Factor P</strong>).
                </div>

                <div className="space-y-6">
                    {/* Temperature */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span className="flex items-center gap-1"><Thermometer size={14} /> Temperature (T)</span>
                            <span className="text-orange-600 font-mono bg-orange-50 px-2 rounded">{config.temperature} K</span>
                        </label>
                        <input
                            type="range" min="100" max="600" step="10"
                            value={config.temperature}
                            onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <p className="text-[10px] text-slate-400 italic">Increases average kinetic energy.</p>
                    </div>

                    {/* Activation Energy */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span className="flex items-center gap-1"><Zap size={14} /> Activation Energy (Ea)</span>
                            <span className="text-purple-600 font-mono bg-purple-50 px-2 rounded">{config.activationEnergy} J</span>
                        </label>
                        <input
                            type="range" min="50" max="300" step="10"
                            value={config.activationEnergy}
                            onChange={(e) => setConfig({ ...config, activationEnergy: Number(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <p className="text-[10px] text-slate-400 italic">Energy threshold for molecules to react on impact.</p>
                    </div>

                    {/* Steric Factor */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span>Steric Factor (P)</span>
                            <span className="text-emerald-600 font-mono bg-emerald-50 px-2 rounded">{config.stericFactor.toFixed(2)}</span>
                        </label>
                        <input
                            type="range" min="0" max="1" step="0.05"
                            value={config.stericFactor}
                            onChange={(e) => setConfig({ ...config, stericFactor: Number(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <p className="text-[10px] text-slate-400 italic">Probability of correct collision orientation.</p>
                    </div>

                    {/* Molecule Count */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span className="flex items-center gap-1"><Users size={14} /> Reactant Molecules</span>
                            <span className="text-blue-600 font-mono bg-blue-50 px-2 rounded">{config.moleculeCount}</span>
                        </label>
                        <input
                            type="range" min="10" max="50" step="5"
                            value={config.moleculeCount}
                            onChange={(e) => setConfig({ ...config, moleculeCount: Number(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
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

export default CollisionTheoryLab;
