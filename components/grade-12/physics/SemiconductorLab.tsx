import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff, HelpCircle, Activity } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
    flashTimer?: number;
}

interface SemiconductorLabProps {
    topic: any;
    onExit: () => void;
}

const SemiconductorLab: React.FC<SemiconductorLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const graphCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    const [joined, setJoined] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showForces, setShowForces] = useState(true);
    const [phase, setPhase] = useState<'initial' | 'diffusion' | 'depletion' | 'efield' | 'equilibrium'>('initial');
    const [depletionWidth, setDepletionWidth] = useState(0);

    // Particle refs for animation
    const holesRef = useRef<Particle[]>([]);
    const electronsRef = useRef<Particle[]>([]);
    const recombinationsRef = useRef<{ x: number, y: number, timer: number }[]>([]);
    const minorityCarriersRef = useRef<Particle[]>([]);

    const initParticles = useCallback(() => {
        const holes: Particle[] = [];
        const electrons: Particle[] = [];
        for (let i = 0; i < 40; i++) {
            holes.push({
                x: Math.random() * 340 + 30, y: Math.random() * 320 + 40,
                vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
                active: true
            });
        }
        for (let i = 0; i < 40; i++) {
            electrons.push({
                x: Math.random() * 340 + 430, y: Math.random() * 320 + 40,
                vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
                active: true
            });
        }
        holesRef.current = holes;
        electronsRef.current = electrons;
        recombinationsRef.current = [];
        minorityCarriersRef.current = [];
    }, []);

    const handleReset = useCallback(() => {
        setJoined(false);
        setPhase('initial');
        setDepletionWidth(0);
        setShowForces(true);
        initParticles();
    }, [initParticles]);

    useEffect(() => { initParticles(); }, [initParticles]);

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
        const graphCanvas = graphCanvasRef.current;
        if (!canvas || !graphCanvas) return;

        const ctx = canvas.getContext('2d');
        const graphCtx = graphCanvas.getContext('2d');
        if (!ctx || !graphCtx) return;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = '#dbeafe'; ctx.fillRect(0, 0, centerX, height);
            ctx.fillStyle = '#fce7f3'; ctx.fillRect(centerX, 0, centerX, height);

            const ionSpacing = 40;
            const ionSize = joined ? 16 : 12;

            for (let x = 20; x < centerX - depletionWidth; x += ionSpacing) {
                for (let y = 40; y < height - 20; y += ionSpacing) {
                    ctx.fillStyle = joined && x > centerX - depletionWidth - 60 ? '#64748b' : '#cbd5e1';
                    ctx.font = `${ionSize}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('−', x, y);
                }
            }
            for (let x = centerX + depletionWidth + 20; x < width - 20; x += ionSpacing) {
                for (let y = 40; y < height - 20; y += ionSpacing) {
                    ctx.fillStyle = joined && x < centerX + depletionWidth + 60 ? '#64748b' : '#fecaca';
                    ctx.font = `${ionSize}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('+', x, y);
                }
            }

            if (depletionWidth > 0) {
                const gradient = ctx.createLinearGradient(centerX - depletionWidth, 0, centerX + depletionWidth, 0);
                gradient.addColorStop(0, 'rgba(148, 163, 184, 0.3)');
                gradient.addColorStop(0.5, 'rgba(148, 163, 184, 0.5)');
                gradient.addColorStop(1, 'rgba(148, 163, 184, 0.3)');
                ctx.fillStyle = gradient; ctx.fillRect(centerX - depletionWidth, 0, depletionWidth * 2, height);

                ctx.strokeStyle = '#475569'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centerX - depletionWidth, 0); ctx.lineTo(centerX - depletionWidth, height);
                ctx.moveTo(centerX + depletionWidth, 0); ctx.lineTo(centerX + depletionWidth, height);
                ctx.stroke(); ctx.setLineDash([]);

                ctx.font = 'bold 18px sans-serif';
                for (let y = 50; y < height - 30; y += 35) {
                    ctx.fillStyle = '#1e40af';
                    for (let x = centerX - depletionWidth + 15; x < centerX; x += 25) ctx.fillText('⊖', x, y);
                    ctx.fillStyle = '#dc2626';
                    for (let x = centerX + 15; x < centerX + depletionWidth; x += 25) ctx.fillText('⊕', x, y);
                }

                if (depletionWidth > 30) {
                    const arrowY = height / 2;
                    ctx.strokeStyle = '#ef4444'; ctx.fillStyle = '#ef4444'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(centerX + depletionWidth - 20, arrowY); ctx.lineTo(centerX - depletionWidth + 20 + 15, arrowY); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(centerX - depletionWidth + 20, arrowY); ctx.lineTo(centerX - depletionWidth + 20 + 15, arrowY - 8); ctx.lineTo(centerX - depletionWidth + 20 + 15, arrowY + 8); ctx.fill();
                    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('E', centerX, arrowY - 15);
                }
            }

            const updateParticle = (p: Particle, type: 'hole' | 'electron') => {
                if (!p.active) return;
                p.x += p.vx; p.y += p.vy;
                if (p.y < 30 || p.y > height - 30) p.vy *= -1;

                if (!joined) {
                    if (type === 'hole' && p.x > centerX - 5) { p.x = centerX - 5; p.vx = -Math.abs(p.vx); }
                    if (type === 'electron' && p.x < centerX + 5) { p.x = centerX + 5; p.vx = Math.abs(p.vx); }
                } else {
                    if (type === 'hole' && p.x < centerX - depletionWidth) p.vx += 0.05;
                    if (type === 'electron' && p.x > centerX + depletionWidth) p.vx -= 0.05;
                    if (type === 'hole' && p.x > centerX - depletionWidth && depletionWidth > 20) p.vx = -Math.abs(p.vx) - 0.5;
                    if (type === 'electron' && p.x < centerX + depletionWidth && depletionWidth > 20) p.vx = Math.abs(p.vx) + 0.5;

                    if (p.x < 20) { p.x = 20; p.vx = Math.abs(p.vx); }
                    if (p.x > width - 20) { p.x = width - 20; p.vx = -Math.abs(p.vx); }
                }

                p.vx = Math.max(-3, Math.min(3, p.vx));
                p.vy = Math.max(-3, Math.min(3, p.vy));

                ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                if (type === 'hole') { ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 2.5; ctx.stroke(); }
                else { ctx.fillStyle = '#be185d'; ctx.fill(); }
            };

            if (joined && depletionWidth < 80) {
                holesRef.current.forEach((hole) => {
                    if (!hole.active) return;
                    electronsRef.current.forEach((electron) => {
                        if (!electron.active) return;
                        if (Math.hypot(hole.x - electron.x, hole.y - electron.y) < 15 && Math.abs(hole.x - centerX) < 100 && Math.abs(electron.x - centerX) < 100) {
                            hole.active = false; electron.active = false;
                            recombinationsRef.current.push({ x: (hole.x + electron.x) / 2, y: (hole.y + electron.y) / 2, timer: 30 });
                            setDepletionWidth(prev => Math.min(prev + 2, 80));
                        }
                    });
                });
            }

            holesRef.current.forEach(p => updateParticle(p, 'hole'));
            electronsRef.current.forEach(p => updateParticle(p, 'electron'));

            recombinationsRef.current = recombinationsRef.current.filter(r => {
                r.timer--;
                if (r.timer > 0) {
                    const alpha = r.timer / 30;
                    ctx.beginPath(); ctx.arc(r.x, r.y, (30 - r.timer) * 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`; ctx.fill();
                    ctx.strokeStyle = `rgba(234, 179, 8, ${alpha})`; ctx.lineWidth = 2; ctx.stroke();
                    return true;
                }
                return false;
            });

            if (joined && depletionWidth > 40 && Math.random() < 0.005) {
                minorityCarriersRef.current.push({ x: width - 50, y: Math.random() * 300 + 50, vx: -2, vy: (Math.random() - 0.5) * 2, active: true });
            }

            minorityCarriersRef.current = minorityCarriersRef.current.filter(p => {
                if (p.x < centerX - depletionWidth || p.x > width) return false;
                if (p.x < centerX + depletionWidth && p.x > centerX - depletionWidth) p.vx -= 0.3;
                p.x += p.vx; p.y += p.vy;
                ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.stroke();
                return p.x > centerX - depletionWidth - 50;
            });

            if (showForces && joined) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.fillRect(centerX - 130, 55, 260, 70);
                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.strokeRect(centerX - 130, 55, 260, 70);

                ctx.strokeStyle = '#16a34a'; ctx.fillStyle = '#16a34a'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(centerX - 100, 75); ctx.lineTo(centerX + 70, 75); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(centerX + 85, 75); ctx.lineTo(centerX + 65, 65); ctx.lineTo(centerX + 65, 85); ctx.fill();
                ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('DIFFUSION →', centerX + 90, 79);

                const eF = Math.max(0.2, Math.min(depletionWidth / 80, 1));
                ctx.strokeStyle = '#dc2626'; ctx.fillStyle = '#dc2626'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(centerX + 100, 105); ctx.lineTo(centerX - 70 * eF, 105); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(centerX - 85 * eF, 105); ctx.lineTo(centerX - 65 * eF, 95); ctx.lineTo(centerX - 65 * eF, 115); ctx.fill();
                ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('← E-FIELD (Drift)', centerX - 90 * eF - 5, 109);

                if (depletionWidth > 60) {
                    ctx.fillStyle = '#7c3aed'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText('⚖️ EQUILIBRIUM: Net Current = 0', centerX, 140);
                }
            }

            ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#1e40af'; ctx.fillText('P-Type', 20, 25);
            ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif'; ctx.fillText('(Acceptors, Holes)', 20, 42);
            ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#be185d'; ctx.fillText('N-Type', width - 20, 25);
            ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif'; ctx.fillText('(Donors, Electrons)', width - 20, 42);

            if (depletionWidth > 20) {
                ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#475569';
                ctx.fillText('Depletion Region', centerX, height - 15);
            }

            // --- Graph Render ---
            graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
            graphCtx.fillStyle = '#f8fafc'; graphCtx.fillRect(0, 0, graphCanvas.width, graphCanvas.height);
            graphCtx.strokeStyle = '#e2e8f0'; graphCtx.lineWidth = 1;
            for (let x = 50; x < graphCanvas.width; x += 50) { graphCtx.beginPath(); graphCtx.moveTo(x, 0); graphCtx.lineTo(x, graphCanvas.height); graphCtx.stroke(); }
            for (let y = 20; y < graphCanvas.height; y += 20) { graphCtx.beginPath(); graphCtx.moveTo(0, y); graphCtx.lineTo(graphCanvas.width, y); graphCtx.stroke(); }

            graphCtx.strokeStyle = '#64748b'; graphCtx.lineWidth = 2;
            graphCtx.beginPath(); graphCtx.moveTo(40, 10); graphCtx.lineTo(40, graphCanvas.height - 20); graphCtx.lineTo(graphCanvas.width - 10, graphCanvas.height - 20); graphCtx.stroke();
            graphCtx.font = 'bold 12px sans-serif'; graphCtx.fillStyle = '#475569'; graphCtx.textAlign = 'center'; graphCtx.fillText('Position (x)', graphCanvas.width / 2, graphCanvas.height - 5);
            graphCtx.save(); graphCtx.translate(12, graphCanvas.height / 2); graphCtx.rotate(-Math.PI / 2); graphCtx.fillText('Potential (V)', 0, 0); graphCtx.restore();

            const barrierHeight = (depletionWidth / 80) * 50;
            graphCtx.strokeStyle = '#8b5cf6'; graphCtx.lineWidth = 3; graphCtx.beginPath();
            const baseline = graphCanvas.height - 35;
            for (let x = 50; x < graphCanvas.width - 10; x++) {
                const sigmoid = 1 / (1 + Math.exp(-((x - graphCanvas.width / 2) / 80) * 3));
                if (x === 50) graphCtx.moveTo(x, baseline - sigmoid * barrierHeight);
                else graphCtx.lineTo(x, baseline - sigmoid * barrierHeight);
            }
            graphCtx.stroke();
            if (barrierHeight > 10) {
                graphCtx.fillStyle = '#8b5cf6'; graphCtx.font = 'bold 14px sans-serif'; graphCtx.textAlign = 'left';
                graphCtx.fillText(`V₀ = ${(barrierHeight / 50 * 0.7).toFixed(2)}V`, graphCanvas.width - 80, baseline - barrierHeight / 2);
            }
            graphCtx.font = 'bold 12px sans-serif'; graphCtx.fillStyle = '#1e40af'; graphCtx.textAlign = 'left'; graphCtx.fillText('P', 55, 25);
            graphCtx.fillStyle = '#be185d'; graphCtx.textAlign = 'right'; graphCtx.fillText('N', graphCanvas.width - 15, 25);

            animationRef.current = requestAnimationFrame(render);
        };

        render();
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying, joined, showForces, depletionWidth]);

    const handleJoin = () => {
        if (!joined) {
            setJoined(true);
            setPhase('diffusion');
            setTimeout(() => setPhase('depletion'), 1000);
            setTimeout(() => setPhase('efield'), 2500);
            setTimeout(() => setPhase('equilibrium'), 5000);
        }
    };

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex flex-col">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-2 border-b border-indigo-800 text-center relative shrink-0">
                <span className={`px-3 py-1 bg-black/30 rounded-full text-xs font-bold transition-all text-white inline-block shadow-inner border border-white/10 ${phase === 'initial' ? 'opacity-80' : 'animate-in fade-in zoom-in'
                    }`}>
                    {phase === 'initial' ? '⏸ Ready' :
                        phase === 'diffusion' ? '🔀 Phase A: Diffusion' :
                            phase === 'depletion' ? '⚡ Phase B: Depletion' :
                                phase === 'efield' ? '🔋 Phase C: E-Field & Drift' :
                                    '⚖️ Phase D: Equilibrium Dynamic Balance'}
                </span>
            </div>

            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-white object-contain" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs shadow-lg border border-slate-200">
                    <div className="font-bold text-slate-700 mb-1 text-[10px] uppercase">Legend</div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full border-2 border-blue-800"></div><span className="text-[10px]">Hole (h⁺)</span></div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-pink-700"></div><span className="text-[10px]">Electron (e⁻)</span></div>
                        <div className="flex items-center gap-2"><span className="text-blue-800 font-bold text-[12px] leading-none">⊖</span><span className="text-[10px]">Acceptor</span></div>
                        <div className="flex items-center gap-2"><span className="text-red-600 font-bold text-[12px] leading-none">⊕</span><span className="text-[10px]">Donor</span></div>
                    </div>
                </div>
            </div>

            <div className="h-28 bg-slate-50 border-t border-slate-200 shrink-0">
                <canvas ref={graphCanvasRef} width={800} height={112} className="w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col w-full h-full">
            <div className="p-6 flex flex-col gap-6 w-full flex-1 overflow-y-auto">
                <div className="text-center p-4 bg-teal-50 border border-teal-100 rounded-lg text-teal-900 text-sm">
                    <strong>P-N Junction Formation:</strong> <br />
                    When a p-type and an n-type semiconductor are joined, electrons diffuse from N to P and holes from P to N.
                    This leaves behind immobile ions, creating a <strong>Depletion Region</strong> and an opposing <strong>Electric Field</strong> that balances diffusion.
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleJoin}
                        disabled={joined}
                        className={`w-full py-4 rounded-xl font-bold font-display shadow-md transition-all flex items-center justify-center gap-2 ${joined
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:shadow-lg hover:-translate-y-0.5 animate-pulse'
                            }`}
                    >
                        {joined ? 'Junction Formed' : '▶ Join P-N Junction'}
                    </button>

                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors flex items-center justify-center gap-2 font-bold text-xs shadow-sm"
                        >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />} {isPlaying ? 'Pause' : 'Play'}
                        </button>

                        <button
                            onClick={() => setShowForces(!showForces)}
                            className={`p-3 border rounded-lg transition-colors flex items-center justify-center gap-2 font-bold text-xs shadow-sm ${showForces ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            {showForces ? <Eye size={16} /> : <EyeOff size={16} />} Forces
                        </button>

                        <button
                            onClick={handleReset}
                            className="p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-700 transition-colors flex items-center justify-center gap-2 font-bold text-xs shadow-sm"
                        >
                            <RotateCcw size={16} /> Reset
                        </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 space-y-3">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm border-b border-slate-200 pb-2"><Activity size={16} /> Phases of Junction</h4>
                        <ul className="text-xs text-slate-600 space-y-2 font-medium">
                            <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> <strong>Diffusion (🔀):</strong> Majority carriers cross the junction.</li>
                            <li className="flex items-start gap-2"><span className="text-yellow-600 mt-0.5">•</span> <strong>Depletion (⚡):</strong> Recombination creates an ion zone lacking free carriers.</li>
                            <li className="flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span> <strong>E-Field (🔋):</strong> Uncovered ions form a barrier potential (V₀) that resists diffusion.</li>
                            <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">•</span> <strong>Equilibrium (⚖️):</strong> Net current becomes zero.</li>
                        </ul>
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

export default SemiconductorLab;
