import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Slice, Eye, HelpCircle } from 'lucide-react';

const AtomicOrbitalsLab: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Quantum numbers state
    const [n, setN] = useState<number>(1);
    const [l, setL] = useState<number>(0);
    const [m, setM] = useState<number>(0);

    // View state
    const [sliceOpen, setSliceOpen] = useState<boolean>(true); // Default to open for clarity
    const [highlightNodes, setHighlightNodes] = useState<boolean>(false);

    // Auto-correct l and m when n or l changes
    useEffect(() => {
        if (l >= n) {
            setL(n - 1);
        }
    }, [n, l]);

    useEffect(() => {
        if (Math.abs(m) > l) {
            setM(0);
        }
    }, [l, m]);

    // Derived Node Counts
    const radialNodes = n - l - 1;
    const angularNodes = l;
    const totalNodes = n - 1;

    const getOrbitalLetter = (l_val: number) => {
        if (l_val === 0) return 's';
        if (l_val === 1) return 'p';
        if (l_val === 2) return 'd';
        if (l_val === 3) return 'f';
        return 'g';
    };

    const getSubscript = (l_val: number, m_val: number) => {
        if (l_val === 0) return '';
        if (l_val === 1) {
            if (m_val === 0) return 'z';
            if (m_val === 1) return 'x';
            if (m_val === -1) return 'y';
        }
        if (l_val === 2) {
            if (m_val === 0) return 'z²';
            if (m_val === 1) return 'xz';
            if (m_val === -1) return 'yz';
            if (m_val === 2) return 'x²-y²';
            if (m_val === -2) return 'xy';
        }
        return '';
    };

    // High-performance Canvas Rendering for 2D cross-sections
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Responsive Canvas
        const parent = canvas.parentElement;
        if (parent) {
            // Setup High-DPI canvas for crisp graphics
            const dpr = window.devicePixelRatio || 1;
            canvas.width = parent.clientWidth * dpr;
            canvas.height = parent.clientHeight * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${parent.clientWidth}px`;
            canvas.style.height = `${parent.clientHeight}px`;
        }

        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        const cx = w / 2;
        const cy = h / 2;

        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Grid (Sci-fi look)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
        for (let i = 0; i < h; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

        // Colors
        const colors = [
            { core: '#60a5fa', glow: 'rgba(59, 130, 246, 0.1)', edge: '#3b82f6' }, // s
            { core: '#c084fc', glow: 'rgba(168, 85, 247, 0.1)', edge: '#a855f7' }, // p
            { core: '#34d399', glow: 'rgba(16, 185, 129, 0.1)', edge: '#10b981' }, // d
        ];
        const theme = colors[Math.min(l, 2)];

        const baseRadius = Math.min(cx, cy) * 0.25;
        const size = baseRadius * (1 + n * 0.3); // Scale with n

        const drawLobe = (x: number, y: number, rx: number, ry: number, angle: number) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);

            // Slightly shift the center of the gradient towards the nucleus for realism
            const gradX = sliceOpen ? x : x - Math.sign(x) * rx * 0.2;
            const gradY = sliceOpen ? y : y - Math.sign(y) * ry * 0.2;

            let grad = ctx.createRadialGradient(gradX, gradY, 0, x, y, Math.max(rx, ry));

            if (sliceOpen) {
                // Sliced view shows internal probability density beautifully as a glow
                grad.addColorStop(0, theme.core);
                grad.addColorStop(0.4, theme.edge);
                grad.addColorStop(1, 'transparent');
            } else {
                // Unsliced is a soft volumetric balloon
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.2, theme.core);
                grad.addColorStop(0.8, theme.edge);
                grad.addColorStop(1, 'transparent');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);

            ctx.fill();
            ctx.restore();
        };

        // Draw Orbitals Based on Quantum Numbers
        // Screen composite to simulate light/probability overlap
        ctx.globalCompositeOperation = 'screen';

        if (l === 0) {
            // S Orbital
            drawLobe(0, 0, size, size, 0);
        } else if (l === 1) {
            // P Orbital (Dumbbell)
            // m determines orientation. m=0 is vertical (pz), m=1/-1 are horizontal/diagonal
            const angle = m === 0 ? Math.PI / 2 : (m === 1 ? 0 : Math.PI / 4);
            drawLobe(size * 0.6, 0, size * 0.7, size * 0.4, angle);
            drawLobe(-size * 0.6, 0, size * 0.7, size * 0.4, angle);
        } else if (l === 2) {
            // D Orbital
            if (m === 0) {
                // dz2: Dumbbell + Doughnut
                drawLobe(0, size * 0.6, size * 0.3, size * 0.6, 0);
                drawLobe(0, -size * 0.6, size * 0.3, size * 0.6, 0);

                // Doughnut
                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(1, 0.3);
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
                ctx.lineWidth = size * 0.3;
                ctx.strokeStyle = sliceOpen ? theme.edge : theme.glow;

                // Add gradient to stroke if unsliced
                if (!sliceOpen) {
                    ctx.strokeStyle = theme.edge;
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = theme.core;
                }

                ctx.stroke();
                ctx.restore();
            } else {
                // Clover shapes (dxy, dyz, dxz, dx2-y2)
                const angleOffset = m === 2 || m === -2 ? Math.PI / 4 : 0;
                for (let i = 0; i < 4; i++) {
                    drawLobe(size * 0.5, 0, size * 0.6, size * 0.3, angleOffset + i * Math.PI / 2);
                }
            }
        }

        ctx.globalCompositeOperation = 'source-over';

        // Highlight Nodes Explicitly
        if (highlightNodes) {
            // Draw Nucleus
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // 1. Radial Nodes (Spherical zero-probability shells)
            // Rendered as bold dashed circles cutting through the lobes
            if (radialNodes > 0 && sliceOpen) {
                ctx.strokeStyle = '#ef4444'; // Red for radial nodes
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                for (let i = 1; i <= radialNodes; i++) {
                    const nodeRadius = size * (i / (radialNodes + 1));
                    ctx.beginPath();
                    ctx.arc(cx, cy, nodeRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.setLineDash([]);
            }

            // 2. Angular Nodes (Planes of zero probability)
            // Rendered as infinite lines slicing the space
            if (angularNodes > 0) {
                ctx.strokeStyle = '#38bdf8'; // Blue for angular nodes (planes)
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.8;

                const drawPlaneLine = (angle: number) => {
                    ctx.beginPath();
                    ctx.moveTo(cx - Math.cos(angle) * w, cy - Math.sin(angle) * w);
                    ctx.lineTo(cx + Math.cos(angle) * w, cy + Math.sin(angle) * w);
                    ctx.stroke();
                };

                if (l === 1) { // 1 plane
                    const angle = m === 0 ? 0 : (m === 1 ? Math.PI / 2 : -Math.PI / 4);
                    drawPlaneLine(angle);
                } else if (l === 2) { // 2 planes or conical node
                    if (m === 0) {
                        // Two conical nodes for dz2, shown as an X in 2D slice
                        drawPlaneLine(Math.PI / 6);
                        drawPlaneLine(-Math.PI / 6);
                    } else {
                        // Two perpendicular planes
                        const angleOffset = m === 2 || m === -2 ? 0 : Math.PI / 4;
                        drawPlaneLine(angleOffset);
                        drawPlaneLine(angleOffset + Math.PI / 2);
                    }
                }
                ctx.globalAlpha = 1.0;
            }
        }

        // Axes
        const drawAxis = (xDir: number, yDir: number, color: string, label: string) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + xDir * 80, cy + yDir * 80);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = color;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(label, cx + xDir * 90, cy + yDir * 90);
        };
        drawAxis(1, 0, '#f43f5e', 'x');
        drawAxis(0, -1, '#22c55e', 'y');

    }, [n, l, m, sliceOpen, highlightNodes]);

    // Hook for window resize
    useEffect(() => {
        const handleResize = () => setN(n => n); // trigger re-render
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="w-full flex-1 flex flex-col lg:flex-row h-full bg-slate-900 border-x border-b border-slate-700 rounded-b-xl text-slate-200 font-sans relative overflow-hidden">

            {/* 2D Visualizer Area */}
            <div className="flex-1 relative bg-black min-h-[500px]">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full block cursor-crosshair"
                />

                {/* Realtime Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
                    <div className="bg-slate-800/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg inline-flex items-center w-fit shadow-xl">
                        <span className="font-display font-bold text-3xl text-white tracking-widest">
                            {n}{getOrbitalLetter(l)}<sub className="text-sm text-brand-secondary ml-1 font-sans">{getSubscript(l, m)}</sub>
                        </span>
                    </div>

                    <div className="bg-slate-800/80 backdrop-blur border border-slate-700 px-4 py-3 rounded-lg shadow-xl text-sm space-y-2 mt-2 w-64">
                        <div className="flex justify-between items-center group">
                            <span className="text-slate-400 group-hover:text-white transition-colors">Radial Nodes (n-l-1):</span>
                            <span className="text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded">{radialNodes}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="text-slate-400 group-hover:text-white transition-colors">Angular Nodes (l):</span>
                            <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded">{angularNodes}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-700 pt-2 mt-2">
                            <span className="text-slate-300 font-semibold">Total Nodes (n-1):</span>
                            <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">{totalNodes}</span>
                        </div>
                    </div>
                </div>

                {/* View Tools */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-slate-800/80 backdrop-blur p-2 rounded-xl border border-slate-700 shadow-2xl">
                    <button
                        onClick={() => setSliceOpen(!sliceOpen)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all border ${sliceOpen
                                ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        <Slice size={18} />
                        Cross-Section View
                    </button>

                    <button
                        onClick={() => setHighlightNodes(!highlightNodes)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all border ${highlightNodes
                                ? 'bg-emerald-500 text-slate-900 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        <Eye size={18} />
                        Highlight Nodes
                    </button>
                </div>
            </div>

            {/* Controls Panel */}
            <div className="w-full lg:w-96 bg-slate-800 border-l border-slate-700 flex flex-col z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">

                <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                    <h3 className="font-bold text-xl text-white mb-2 flex items-center gap-2">
                        <HelpCircle size={20} className="text-brand-primary" />
                        Quantum Controls
                    </h3>
                    <p className="text-sm text-slate-400">
                        Adjust the quantum numbers to observe the exact geometrical solutions to the Schrödinger wave equation.
                    </p>
                </div>

                <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">

                    {/* Principal Quantum Number (n) */}
                    <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-bold text-slate-200">Principal (n)</label>
                            <div className="bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-3 py-1 rounded-md font-mono text-xl font-bold shadow-inner">
                                {n}
                            </div>
                        </div>
                        <input type="range" min="1" max="5" step="1" value={n} onChange={(e) => setN(parseInt(e.target.value))} className="w-full accent-brand-primary h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <p className="text-xs text-slate-500 mt-3 leading-relaxed">Determines the overall size (energy level) of the orbital. As <strong>n</strong> increases, the electron cloud expands further from the nucleus.</p>
                    </div>

                    {/* Azimuthal Quantum Number (l) */}
                    <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-bold text-slate-200">Azimuthal (l)</label>
                            <div className="bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30 px-3 py-1 rounded-md font-mono text-xl font-bold shadow-inner flex items-center gap-2">
                                {l}
                                <span className="text-xs bg-brand-secondary text-white px-1.5 py-0.5 rounded font-sans uppercase">({getOrbitalLetter(l)})</span>
                            </div>
                        </div>
                        <input type="range" min="0" max={n - 1} step="1" value={l} onChange={(e) => setL(parseInt(e.target.value))} className="w-full accent-brand-secondary h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <p className="text-xs text-slate-500 mt-3 leading-relaxed">Determines the <strong>shape</strong> of the orbital. The maximum value is strictly bounded to <span className="font-mono bg-slate-800 px-1 rounded text-slate-300">n - 1</span>.</p>
                    </div>

                    {/* Magnetic Quantum Number (m) */}
                    <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-bold text-slate-200">Magnetic (m<sub>l</sub>)</label>
                            <div className={`border px-3 py-1 rounded-md font-mono text-xl font-bold shadow-inner ${l === 0 ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                                {m > 0 ? `+${m}` : m}
                            </div>
                        </div>
                        <input type="range" min={-l} max={l} step="1" value={m} onChange={(e) => setM(parseInt(e.target.value))} className={`w-full h-2 rounded-lg appearance-none ${l === 0 ? 'bg-slate-800 cursor-not-allowed hidden' : 'accent-emerald-500 bg-slate-700 cursor-pointer'}`} disabled={l === 0} />

                        {l === 0 ? (
                            <div className="mt-3 p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-400 flex items-start gap-2">
                                <HelpCircle size={14} className="shrink-0 mt-0.5" />
                                <p>For s-orbitals (l=0), the only possible m<sub>l</sub> value is 0. Spherical symmetry means there's no distinct spatial orientation.</p>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 mt-3 leading-relaxed">Determines the spatial <strong>orientation</strong> of the orbital along the specific molecular axes.</p>
                        )}
                    </div>

                </div>

                {/* Educational Insight Panel */}
                <div className="bg-slate-900/80 p-6 border-t border-slate-700">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-2">
                        <Eye size={16} /> What you are seeing
                    </h4>
                    <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
                        <p>In the quantum model, electrons aren't particles moving in tracks, but <strong>probability density clouds (ψ²)</strong>.</p>
                        <p>Toggle <strong>Cross-Section View</strong> to see the internal probability distributions, and use the <strong>Highlight Nodes</strong> tool to reveal the mathematically empty zones where probability is precisely zero.</p>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default AtomicOrbitalsLab;
