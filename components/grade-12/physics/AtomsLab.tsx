import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Info, Atom, Microscope, RotateCcw, Crosshair, Target } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

// --- Constants ---
const AU_Z = 79;
const AL_Z = 13;

interface AlphaParticle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    impactB: number;
    trail: { x: number; y: number }[];
}

interface AtomsLabProps {
    topic: any;
    onExit: () => void;
}

const AtomsLab: React.FC<AtomsLabProps> = ({ topic, onExit }) => {
    // --- State ---
    const [isPlaying, setIsPlaying] = useState(true);
    const [targetZ, setTargetZ] = useState(AU_Z);
    const [energyMev, setEnergyMev] = useState(5.5);
    const [beamSpread, setBeamSpread] = useState(120);
    const [showLabels, setShowLabels] = useState(true);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const frameRef = useRef(0);

    const particlesRef = useRef<AlphaParticle[]>([]);

    const handleReset = useCallback(() => {
        particlesRef.current = [];
        frameRef.current = 0;
    }, []);

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

        const animate = () => {
            const width = canvas.width;
            const height = canvas.height;
            const nucX = width * 0.6;
            const nucY = height / 2;

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);

            const nucRadius = targetZ === AU_Z ? 10 : 7;
            const speed = 4 + energyMev * 0.3;
            const deflectionRadius = 150;
            const forceScale = (targetZ / AU_Z) * 2000 * (5.5 / energyMev);

            // Background Grid
            ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
            ctx.lineWidth = 1;
            for (let x = 0; x < width; x += 60) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
            }
            for (let y = 0; y < height; y += 60) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
            }

            // Source Box
            const srcX = 30;
            ctx.fillStyle = '#475569';
            ctx.fillRect(5, nucY - beamSpread - 20, 40, 20);
            ctx.fillRect(5, nucY + beamSpread, 40, 20);
            ctx.fillStyle = '#334155';
            ctx.fillRect(5, nucY - beamSpread, 40, beamSpread * 2);

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(35, nucY - beamSpread, 15, beamSpread * 2);

            if (showLabels) {
                ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('α Source', 25, nucY - beamSpread - 28);
            }

            // Foil
            ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
            ctx.fillRect(nucX - 1, 0, 2, height);
            if (showLabels) {
                ctx.fillStyle = '#fde047'; ctx.font = '9px sans-serif';
                ctx.fillText('Gold Foil', nucX, 15);
            }

            // Nucleus Glow
            const grad = ctx.createRadialGradient(nucX, nucY, 0, nucX, nucY, deflectionRadius);
            grad.addColorStop(0, 'rgba(250, 204, 21, 0.25)');
            grad.addColorStop(0.5, 'rgba(250, 204, 21, 0.05)');
            grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(nucX, nucY, deflectionRadius, 0, Math.PI * 2); ctx.fill();

            // Interaction zone label
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
            ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(nucX, nucY, deflectionRadius, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(250,204,21,0.6)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('Interaction zone (schematic — Coulomb force has infinite range)', nucX, nucY - deflectionRadius - 6);

            // Electrons (simplified)
            const electronShells = targetZ === AU_Z ? [
                { r: 35, e: 2, speed: 0.03, label: 'K', dotR: 3 },
                { r: 55, e: 8, speed: 0.02, label: 'L', dotR: 3 },
                { r: 80, e: 18, speed: 0.012, label: 'M', dotR: 2 },
                { r: 108, e: 32, speed: 0.008, label: 'N', dotR: 2 },
                { r: 130, e: 18, speed: 0.006, label: 'O', dotR: 2 },
                { r: 148, e: 1, speed: 0.004, label: 'P', dotR: 2 }
            ] : [
                { r: 40, e: 2, speed: 0.03, label: 'K', dotR: 3 },
                { r: 75, e: 8, speed: 0.02, label: 'L', dotR: 3 },
                { r: 110, e: 3, speed: 0.015, label: 'M', dotR: 2 }
            ];

            const time = frameRef.current * 0.016;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 6]);
            electronShells.forEach(shell => {
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
                ctx.beginPath(); ctx.arc(nucX, nucY, shell.r, 0, Math.PI * 2); ctx.stroke();

                for (let i = 0; i < shell.e; i++) {
                    const angle = (2 * Math.PI * i) / shell.e + time * shell.speed * 60;
                    const eX = nucX + shell.r * Math.cos(angle);
                    const eY = nucY + shell.r * Math.sin(angle);

                    ctx.fillStyle = '#60a5fa';
                    ctx.beginPath(); ctx.arc(eX, eY, shell.dotR, 0, Math.PI * 2); ctx.fill();
                }
            });
            ctx.setLineDash([]);

            // Nucleus Core
            ctx.fillStyle = targetZ === AU_Z ? '#facc15' : '#a1a1aa';
            ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(nucX, nucY, nucRadius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#1e293b'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('+', nucX, nucY);

            if (showLabels) {
                ctx.fillStyle = '#fde047'; ctx.font = '11px sans-serif'; ctx.textBaseline = 'top';
                ctx.fillText(targetZ === AU_Z ? 'Au (Z=79)' : 'Al (Z=13)', nucX, nucY + nucRadius + 8);
            }

            // Spawn Particles
            if (isPlaying && frameRef.current % 5 === 0 && particlesRef.current.length < 80) {
                for (let i = 0; i < 3; i++) {
                    const yOffset = (Math.random() - 0.5) * beamSpread * 2;
                    particlesRef.current.push({
                        id: Math.random(), x: srcX + 15, y: nucY + yOffset,
                        vx: speed, vy: 0, impactB: Math.abs(yOffset), trail: []
                    });
                }
            }

            // Update & Draw Particles
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                if (isPlaying) {
                    const dx = p.x - nucX;
                    const dy = p.y - nucY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < deflectionRadius && dist > nucRadius) {
                        const forceMag = forceScale / (dist * dist);
                        p.vx += (dx / dist) * forceMag;
                        p.vy += (dy / dist) * forceMag;
                    }

                    p.x += p.vx;
                    p.y += p.vy;

                    p.trail.push({ x: p.x, y: p.y });
                    if (p.trail.length > 80) p.trail.shift();
                }

                if (p.trail.length > 1) {
                    ctx.beginPath(); ctx.moveTo(p.trail[0].x, p.trail[0].y);
                    for (let j = 1; j < p.trail.length; j++) ctx.lineTo(p.trail[j].x, p.trail[j].y);

                    ctx.strokeStyle = p.impactB < 15 ? '#fbbf24' : (p.impactB < 40 ? '#ef4444' : '#22c55e');
                    ctx.lineWidth = 1.5; ctx.stroke();
                }

                ctx.fillStyle = '#ef4444';
                ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();

                if (p.x > width + 20 || p.x < -50 || p.y < -50 || p.y > height + 50) {
                    particlesRef.current.splice(i, 1);
                }
            }

            // Guide lines
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.1)'; ctx.lineWidth = 1; ctx.setLineDash([4, 8]);
            for (let i = 0; i < 9; i++) {
                const y = nucY - beamSpread + (beamSpread * 2 * i) / 8;
                ctx.beginPath(); ctx.moveTo(srcX + 15, y); ctx.lineTo(width, y); ctx.stroke();
            }
            ctx.setLineDash([]);

            // Legend
            if (showLabels) {
                const legendW = 148;
                const legendH = 90;
                const lx = width - legendW - 12;
                const ly = 70;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'; ctx.fillRect(lx, ly, legendW, legendH);
                ctx.strokeStyle = '#334155'; ctx.strokeRect(lx, ly, legendW, legendH);
                ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';

                ctx.fillStyle = '#fbbf24'; ctx.fillRect(lx + 10, ly + 15, 15, 3);
                ctx.fillText('Head-on (θ ~ 180°)', lx + 30, ly + 16);

                ctx.fillStyle = '#ef4444'; ctx.fillRect(lx + 10, ly + 35, 15, 3);
                ctx.fillText('Deflected (large θ)', lx + 30, ly + 36);

                ctx.fillStyle = '#22c55e'; ctx.fillRect(lx + 10, ly + 55, 15, 3);
                ctx.fillText('Undeviated', lx + 30, ly + 56);

                ctx.fillStyle = '#64748b'; ctx.font = 'italic 9px sans-serif';
                ctx.fillText('F ∝ 1/r² (Coulomb)', lx + 10, ly + 75);
            }

            if (isPlaying) frameRef.current++;
            if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        };

        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            animate();
        }

        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, targetZ, energyMev, beamSpread, showLabels]);

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setShowLabels(!showLabels)} className={`p-2 rounded-lg text-sm font-bold shadow transition-colors ${showLabels ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'} border border-slate-600`}>
                    Labels
                </button>
                <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-lg text-sm font-bold shadow transition-colors bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600`}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col w-full h-full">
            <div className="p-6 flex flex-col gap-6 w-full flex-1 overflow-y-auto">
                <div className="text-center p-4 bg-orange-50 border border-orange-100 rounded-lg text-orange-900 text-sm">
                    Rutherford's Alpha Scattering. <br />
                    Most alpha particles pass undeflected because the atom is mostly empty space. <br />
                    A tiny fraction bounce back, showing that the positive charge and mass are concentrated in a tiny central nucleus.
                </div>

                <div className="grid md:grid-cols-1 gap-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span className="flex items-center gap-2"><Target size={14} /> Target Nucleus</span>
                            </label>
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => setTargetZ(AU_Z)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${targetZ === AU_Z ? 'bg-white shadow text-yellow-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Gold (Z=79)
                                </button>
                                <button
                                    onClick={() => setTargetZ(AL_Z)}
                                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${targetZ === AL_Z ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Aluminum (Z=13)
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400">Higher Z = stronger Coulomb repulsion ({AU_Z} vs {AL_Z}).</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span>Alpha Energy (MeV)</span>
                                <span className="text-red-600 font-mono bg-red-50 px-2 rounded">{energyMev.toFixed(1)} MeV</span>
                            </label>
                            <input
                                type="range" min="2" max="10" step="0.5"
                                value={energyMev}
                                onChange={(e) => setEnergyMev(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <p className="text-[10px] text-slate-400">Higher kinetic energy allows particles to get closer to the nucleus before deflecting.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span>Beam Width Spread</span>
                                <span className="text-slate-700 font-mono bg-slate-100 px-2 rounded">{beamSpread} px</span>
                            </label>
                            <input
                                type="range" min="40" max="180" step="10"
                                value={beamSpread}
                                onChange={(e) => setBeamSpread(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                            />
                            <p className="text-[10px] text-slate-400">Controls how many particles are aimed head-on vs far away.</p>
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

export default AtomsLab;
