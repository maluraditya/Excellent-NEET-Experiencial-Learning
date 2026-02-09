import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff, HelpCircle, X } from 'lucide-react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
    flashTimer?: number;
}

const SemiconductorCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const graphCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    const [joined, setJoined] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showForces, setShowForces] = useState(false);
    const [showAnalogy, setShowAnalogy] = useState(false);
    const [phase, setPhase] = useState<'initial' | 'diffusion' | 'depletion' | 'equilibrium'>('initial');
    const [depletionWidth, setDepletionWidth] = useState(0);
    const [time, setTime] = useState(0);

    // Particle refs for animation
    const holesRef = useRef<Particle[]>([]);
    const electronsRef = useRef<Particle[]>([]);
    const recombinationsRef = useRef<{ x: number, y: number, timer: number }[]>([]);
    const minorityCarriersRef = useRef<Particle[]>([]);

    // Initialize particles
    const initParticles = useCallback(() => {
        const holes: Particle[] = [];
        const electrons: Particle[] = [];

        // P-side holes (left side, x < 400)
        for (let i = 0; i < 40; i++) {
            holes.push({
                x: Math.random() * 340 + 30,
                y: Math.random() * 320 + 40,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                active: true
            });
        }

        // N-side electrons (right side, x > 400)
        for (let i = 0; i < 40; i++) {
            electrons.push({
                x: Math.random() * 340 + 430,
                y: Math.random() * 320 + 40,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                active: true
            });
        }

        holesRef.current = holes;
        electronsRef.current = electrons;
        recombinationsRef.current = [];
        minorityCarriersRef.current = [];
    }, []);

    // Reset simulation
    const handleReset = useCallback(() => {
        setJoined(false);
        setPhase('initial');
        setDepletionWidth(0);
        setTime(0);
        setShowForces(false);
        initParticles();
    }, [initParticles]);

    // Initialize on mount
    useEffect(() => {
        initParticles();
    }, [initParticles]);

    // Main animation loop
    useEffect(() => {
        if (!isPlaying) return;

        const canvas = canvasRef.current;
        const graphCanvas = graphCanvasRef.current;
        if (!canvas || !graphCanvas) return;

        const ctx = canvas.getContext('2d');
        const graphCtx = graphCanvas.getContext('2d');
        if (!ctx || !graphCtx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // --- Draw Background Regions ---
            // P-Type (Left) - Light Blue
            ctx.fillStyle = '#dbeafe';
            ctx.fillRect(0, 0, centerX, height);

            // N-Type (Right) - Light Pink
            ctx.fillStyle = '#fce7f3';
            ctx.fillRect(centerX, 0, centerX, height);

            // --- Draw Background Lattice Ions ---
            const ionSpacing = 40;
            const ionSize = joined ? 16 : 12;

            // P-side: Negative acceptor ions (faded)
            for (let x = 20; x < centerX - depletionWidth; x += ionSpacing) {
                for (let y = 40; y < height - 20; y += ionSpacing) {
                    ctx.fillStyle = joined && x > centerX - depletionWidth - 60 ? '#64748b' : '#cbd5e1';
                    ctx.font = `${ionSize}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText('−', x, y);
                }
            }

            // N-side: Positive donor ions (faded)
            for (let x = centerX + depletionWidth + 20; x < width - 20; x += ionSpacing) {
                for (let y = 40; y < height - 20; y += ionSpacing) {
                    ctx.fillStyle = joined && x < centerX + depletionWidth + 60 ? '#64748b' : '#fecaca';
                    ctx.font = `${ionSize}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText('+', x, y);
                }
            }

            // --- Depletion Region ---
            if (depletionWidth > 0) {
                // Gray depletion zone
                const gradient = ctx.createLinearGradient(centerX - depletionWidth, 0, centerX + depletionWidth, 0);
                gradient.addColorStop(0, 'rgba(148, 163, 184, 0.3)');
                gradient.addColorStop(0.5, 'rgba(148, 163, 184, 0.5)');
                gradient.addColorStop(1, 'rgba(148, 163, 184, 0.3)');
                ctx.fillStyle = gradient;
                ctx.fillRect(centerX - depletionWidth, 0, depletionWidth * 2, height);

                // Depletion boundaries
                ctx.strokeStyle = '#475569';
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centerX - depletionWidth, 0);
                ctx.lineTo(centerX - depletionWidth, height);
                ctx.moveTo(centerX + depletionWidth, 0);
                ctx.lineTo(centerX + depletionWidth, height);
                ctx.stroke();
                ctx.setLineDash([]);

                // Bold ions in depletion region
                ctx.font = 'bold 18px sans-serif';
                for (let y = 50; y < height - 30; y += 35) {
                    // Negative ions on P-side of depletion
                    ctx.fillStyle = '#1e40af';
                    for (let x = centerX - depletionWidth + 15; x < centerX; x += 25) {
                        ctx.fillText('⊖', x, y);
                    }
                    // Positive ions on N-side of depletion
                    ctx.fillStyle = '#dc2626';
                    for (let x = centerX + 15; x < centerX + depletionWidth; x += 25) {
                        ctx.fillText('⊕', x, y);
                    }
                }

                // Electric Field Arrow
                if (depletionWidth > 30) {
                    const arrowY = height / 2;
                    const arrowStartX = centerX + depletionWidth - 20;
                    const arrowEndX = centerX - depletionWidth + 20;

                    ctx.strokeStyle = '#ef4444';
                    ctx.fillStyle = '#ef4444';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(arrowStartX, arrowY);
                    ctx.lineTo(arrowEndX + 15, arrowY);
                    ctx.stroke();

                    // Arrow head
                    ctx.beginPath();
                    ctx.moveTo(arrowEndX, arrowY);
                    ctx.lineTo(arrowEndX + 15, arrowY - 8);
                    ctx.lineTo(arrowEndX + 15, arrowY + 8);
                    ctx.closePath();
                    ctx.fill();

                    // E label
                    ctx.font = 'bold 16px sans-serif';
                    ctx.fillStyle = '#ef4444';
                    ctx.textAlign = 'center';
                    ctx.fillText('E', centerX, arrowY - 15);
                }
            }

            // --- Update and Draw Particles ---
            const updateParticle = (p: Particle, type: 'hole' | 'electron') => {
                if (!p.active) return;

                p.x += p.vx;
                p.y += p.vy;

                // Bounce off walls
                if (p.y < 30 || p.y > height - 30) p.vy *= -1;

                if (!joined) {
                    // Hard wall at center before join
                    if (type === 'hole' && p.x > centerX - 5) {
                        p.x = centerX - 5;
                        p.vx = -Math.abs(p.vx);
                    }
                    if (type === 'electron' && p.x < centerX + 5) {
                        p.x = centerX + 5;
                        p.vx = Math.abs(p.vx);
                    }
                } else {
                    // After joining - diffusion and recombination
                    const leftBound = type === 'hole' ? 20 : centerX - depletionWidth;
                    const rightBound = type === 'electron' ? width - 20 : centerX + depletionWidth;

                    // Diffusion tendency
                    if (type === 'hole' && p.x < centerX - depletionWidth) {
                        p.vx += 0.05; // Holes diffuse right
                    }
                    if (type === 'electron' && p.x > centerX + depletionWidth) {
                        p.vx -= 0.05; // Electrons diffuse left
                    }

                    // Depletion region barrier
                    if (type === 'hole' && p.x > centerX - depletionWidth && depletionWidth > 20) {
                        p.vx = -Math.abs(p.vx) - 0.5; // Repelled by E-field
                    }
                    if (type === 'electron' && p.x < centerX + depletionWidth && depletionWidth > 20) {
                        p.vx = Math.abs(p.vx) + 0.5; // Repelled by E-field
                    }

                    // Boundary check
                    if (p.x < 20) { p.x = 20; p.vx = Math.abs(p.vx); }
                    if (p.x > width - 20) { p.x = width - 20; p.vx = -Math.abs(p.vx); }
                }

                // Limit velocity
                const maxV = 3;
                p.vx = Math.max(-maxV, Math.min(maxV, p.vx));
                p.vy = Math.max(-maxV, Math.min(maxV, p.vy));

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                if (type === 'hole') {
                    ctx.strokeStyle = '#1e40af';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                } else {
                    ctx.fillStyle = '#be185d';
                    ctx.fill();
                }
            };

            // Check for recombination
            if (joined && depletionWidth < 80) {
                holesRef.current.forEach((hole) => {
                    if (!hole.active) return;
                    electronsRef.current.forEach((electron) => {
                        if (!electron.active) return;
                        const dist = Math.sqrt((hole.x - electron.x) ** 2 + (hole.y - electron.y) ** 2);
                        if (dist < 15 && Math.abs(hole.x - centerX) < 100 && Math.abs(electron.x - centerX) < 100) {
                            // Recombination!
                            hole.active = false;
                            electron.active = false;
                            recombinationsRef.current.push({
                                x: (hole.x + electron.x) / 2,
                                y: (hole.y + electron.y) / 2,
                                timer: 30
                            });
                            // Grow depletion region
                            setDepletionWidth(prev => Math.min(prev + 2, 80));
                        }
                    });
                });
            }

            // Draw active particles
            holesRef.current.forEach(p => updateParticle(p, 'hole'));
            electronsRef.current.forEach(p => updateParticle(p, 'electron'));

            // Draw recombination flashes
            recombinationsRef.current = recombinationsRef.current.filter(r => {
                r.timer--;
                if (r.timer > 0) {
                    const alpha = r.timer / 30;
                    const radius = (30 - r.timer) * 0.8;
                    ctx.beginPath();
                    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
                    ctx.fill();
                    ctx.strokeStyle = `rgba(234, 179, 8, ${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    return true;
                }
                return false;
            });

            // Spawn minority carriers occasionally
            if (joined && depletionWidth > 40 && Math.random() < 0.005) {
                // Thermal generation - spawn hole on N-side
                minorityCarriersRef.current.push({
                    x: width - 50,
                    y: Math.random() * 300 + 50,
                    vx: -2,
                    vy: (Math.random() - 0.5) * 2,
                    active: true
                });
            }

            // Draw and update minority carriers (drift)
            minorityCarriersRef.current = minorityCarriersRef.current.filter(p => {
                if (p.x < centerX - depletionWidth || p.x > width) return false;

                // Drift - accelerated by E-field in depletion
                if (p.x < centerX + depletionWidth && p.x > centerX - depletionWidth) {
                    p.vx -= 0.3; // Swept by E-field
                }

                p.x += p.vx;
                p.y += p.vy;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 2;
                ctx.stroke();

                return p.x > centerX - depletionWidth - 50;
            });

            // --- Force Arrows (Toggle) ---
            if (showForces && depletionWidth > 30) {
                const arrowY1 = 70;
                const arrowY2 = 100;

                // Diffusion force arrow (→)
                ctx.strokeStyle = '#22c55e';
                ctx.fillStyle = '#22c55e';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(centerX - 80, arrowY1);
                ctx.lineTo(centerX + 60, arrowY1);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(centerX + 70, arrowY1);
                ctx.lineTo(centerX + 55, arrowY1 - 8);
                ctx.lineTo(centerX + 55, arrowY1 + 8);
                ctx.closePath();
                ctx.fill();
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Diffusion →', centerX + 80, arrowY1 + 4);

                // E-field force arrow (←)
                const eFieldStrength = Math.min(depletionWidth / 80, 1);
                ctx.strokeStyle = '#ef4444';
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(centerX + 80, arrowY2);
                ctx.lineTo(centerX - 60 * eFieldStrength, arrowY2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(centerX - 70 * eFieldStrength, arrowY2);
                ctx.lineTo(centerX - 55 * eFieldStrength, arrowY2 - 8);
                ctx.lineTo(centerX - 55 * eFieldStrength, arrowY2 + 8);
                ctx.closePath();
                ctx.fill();
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('← E-field (Drift)', centerX - 90 * eFieldStrength, arrowY2 + 4);
            }

            // --- Labels ---
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#1e40af';
            ctx.fillText('P-Type', 20, 25);
            ctx.fillStyle = '#64748b';
            ctx.font = '12px sans-serif';
            ctx.fillText('(Acceptors, Holes)', 20, 42);

            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#be185d';
            ctx.fillText('N-Type', width - 20, 25);
            ctx.fillStyle = '#64748b';
            ctx.font = '12px sans-serif';
            ctx.fillText('(Donors, Electrons)', width - 20, 42);

            if (depletionWidth > 20) {
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#475569';
                ctx.fillText('Depletion Region', centerX, height - 15);
            }

            // --- Draw Potential Graph ---
            graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
            const gWidth = graphCanvas.width;
            const gHeight = graphCanvas.height;

            // Background
            graphCtx.fillStyle = '#f8fafc';
            graphCtx.fillRect(0, 0, gWidth, gHeight);

            // Grid
            graphCtx.strokeStyle = '#e2e8f0';
            graphCtx.lineWidth = 1;
            for (let x = 50; x < gWidth; x += 50) {
                graphCtx.beginPath();
                graphCtx.moveTo(x, 0);
                graphCtx.lineTo(x, gHeight);
                graphCtx.stroke();
            }
            for (let y = 20; y < gHeight; y += 20) {
                graphCtx.beginPath();
                graphCtx.moveTo(0, y);
                graphCtx.lineTo(gWidth, y);
                graphCtx.stroke();
            }

            // Axes
            graphCtx.strokeStyle = '#64748b';
            graphCtx.lineWidth = 2;
            graphCtx.beginPath();
            graphCtx.moveTo(40, 10);
            graphCtx.lineTo(40, gHeight - 20);
            graphCtx.lineTo(gWidth - 10, gHeight - 20);
            graphCtx.stroke();

            // Axis labels
            graphCtx.font = 'bold 12px sans-serif';
            graphCtx.fillStyle = '#475569';
            graphCtx.textAlign = 'center';
            graphCtx.fillText('Position (x)', gWidth / 2, gHeight - 5);
            graphCtx.save();
            graphCtx.translate(12, gHeight / 2);
            graphCtx.rotate(-Math.PI / 2);
            graphCtx.fillText('Potential (V)', 0, 0);
            graphCtx.restore();

            // Draw potential curve (S-curve sigmoid)
            const barrierHeight = (depletionWidth / 80) * 50;
            graphCtx.strokeStyle = '#8b5cf6';
            graphCtx.lineWidth = 3;
            graphCtx.beginPath();

            const graphCenterX = gWidth / 2;
            const baseline = gHeight - 35;

            for (let x = 50; x < gWidth - 10; x++) {
                const relX = (x - graphCenterX) / 80; // Normalized position
                const sigmoid = 1 / (1 + Math.exp(-relX * 3));
                const y = baseline - sigmoid * barrierHeight;

                if (x === 50) {
                    graphCtx.moveTo(x, y);
                } else {
                    graphCtx.lineTo(x, y);
                }
            }
            graphCtx.stroke();

            // V₀ annotation
            if (barrierHeight > 10) {
                graphCtx.fillStyle = '#8b5cf6';
                graphCtx.font = 'bold 14px sans-serif';
                graphCtx.textAlign = 'left';
                graphCtx.fillText(`V₀ = ${(barrierHeight / 50 * 0.7).toFixed(2)}V`, gWidth - 80, baseline - barrierHeight / 2);

                // Barrier height indicator
                graphCtx.setLineDash([3, 3]);
                graphCtx.strokeStyle = '#8b5cf6';
                graphCtx.lineWidth = 1;
                graphCtx.beginPath();
                graphCtx.moveTo(graphCenterX + 60, baseline);
                graphCtx.lineTo(graphCenterX + 60, baseline - barrierHeight);
                graphCtx.stroke();
                graphCtx.setLineDash([]);
            }

            // P and N labels on graph
            graphCtx.font = 'bold 12px sans-serif';
            graphCtx.fillStyle = '#1e40af';
            graphCtx.textAlign = 'left';
            graphCtx.fillText('P', 55, 25);
            graphCtx.fillStyle = '#be185d';
            graphCtx.textAlign = 'right';
            graphCtx.fillText('N', gWidth - 15, 25);

            setTime(prev => prev + 1);
            animationRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, joined, showForces, depletionWidth]);

    // Handle join toggle
    const handleJoin = () => {
        if (!joined) {
            setJoined(true);
            setPhase('diffusion');
            setTimeout(() => setPhase('depletion'), 2000);
            setTimeout(() => setPhase('equilibrium'), 5000);
        } else {
            handleReset();
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold text-lg">P-N Junction Formation</h3>
                    <p className="text-indigo-200 text-xs">Diffusion, Drift & Equilibrium</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${phase === 'initial' ? 'bg-gray-500 text-white' :
                            phase === 'diffusion' ? 'bg-green-500 text-white' :
                                phase === 'depletion' ? 'bg-yellow-500 text-black' :
                                    'bg-blue-500 text-white'
                        }`}>
                        {phase === 'initial' ? 'Ready' :
                            phase === 'diffusion' ? 'Phase A: Diffusion' :
                                phase === 'depletion' ? 'Phase B: Depletion' :
                                    'Phase D: Equilibrium'}
                    </span>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    className="w-full h-full object-contain bg-white"
                />

                {/* Analogy Popup */}
                {showAnalogy && (
                    <div className="absolute inset-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 overflow-y-auto z-20">
                        <button
                            onClick={() => setShowAnalogy(false)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                        <h4 className="font-bold text-xl text-indigo-600 mb-4 flex items-center gap-2">
                            <HelpCircle size={20} /> The Robot & Balloon Analogy
                        </h4>
                        <div className="text-sm text-slate-700 space-y-4">
                            <p><strong>Imagine two crowded rooms merging:</strong></p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                                    <strong className="text-pink-700">N-Room:</strong>
                                    <p className="text-xs mt-1">Full of <strong>Robots</strong> (Electrons) standing on movable carpets.</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <strong className="text-blue-700">P-Room:</strong>
                                    <p className="text-xs mt-1">Full of <strong>Balloons</strong> (Holes) tied to heavy chairs.</p>
                                </div>
                            </div>
                            <p>When the wall opens:</p>
                            <ul className="list-disc pl-5 space-y-1 text-xs">
                                <li>Robots rush to the empty P-room, Balloons float to the N-room (<strong>Diffusion</strong>)</li>
                                <li>Every Robot that leaves behind a heavy, immobile <strong>Positive Ion (+)</strong></li>
                                <li>Every Balloon that leaves behind a heavy, immobile <strong>Negative Ion (−)</strong></li>
                            </ul>
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                                <p className="text-xs">
                                    <strong>Soon, the doorway is blocked</strong> by a pile of heavy ions (<strong>Depletion Region</strong>).
                                    The "hill" of furniture prevents anyone else from crossing (<strong>Barrier Potential V₀</strong>).
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Graph Canvas */}
            <div className="h-28 bg-slate-50 border-t border-slate-200">
                <canvas
                    ref={graphCanvasRef}
                    width={800}
                    height={100}
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Controls */}
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleJoin}
                        className={`px-5 py-2 rounded-full font-bold text-sm shadow-lg transition-all ${joined
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                    >
                        {joined ? 'Reset Junction' : 'Join P-N Junction'}
                    </button>

                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                    >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>

                    <button
                        onClick={handleReset}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowForces(!showForces)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${showForces
                                ? 'bg-purple-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {showForces ? <Eye size={16} /> : <EyeOff size={16} />}
                        Show Forces
                    </button>

                    <button
                        onClick={() => setShowAnalogy(!showAnalogy)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white text-sm font-medium transition-colors"
                    >
                        <HelpCircle size={16} />
                        Analogy
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="absolute top-16 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs shadow-lg">
                <div className="font-bold text-slate-700 mb-2">Legend</div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 border-blue-800"></div>
                        <span>Hole (h⁺)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-700"></div>
                        <span>Electron (e⁻)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-800 font-bold">⊖</span>
                        <span>Fixed Acceptor</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-red-600 font-bold">⊕</span>
                        <span>Fixed Donor</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SemiconductorCanvas;
