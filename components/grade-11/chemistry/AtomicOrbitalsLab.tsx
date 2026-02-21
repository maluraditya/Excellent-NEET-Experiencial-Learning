import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Slice, Eye, HelpCircle } from 'lucide-react';

const AtomicOrbitalsLab: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Quantum numbers state
    const [n, setN] = useState<number>(1);
    const [l, setL] = useState<number>(0);
    const [m, setM] = useState<number>(0);

    // View state
    const [sliceOpen, setSliceOpen] = useState<boolean>(true);
    const [highlightNodes, setHighlightNodes] = useState<boolean>(false);

    // Track size for accurate canvas resolution
    const [dimensions, setDimensions] = useState({ w: 800, h: 500 });

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

    // Handle reliable resizing
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    setDimensions({ w: width, h: height });
                }
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

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

        const { w, h } = dimensions;
        if (w === 0 || h === 0) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        ctx.scale(dpr, dpr);

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

        const baseRadius = Math.min(w, h) * 0.20;
        const size = baseRadius * (1 + n * 0.25); // Scale more gently with n
        const lobeWidth = size * 0.7;
        const lobeThickness = size * 0.4;

        const drawLobe = (x: number, y: number, rx: number, ry: number, angle: number) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);

            // Shift gradient slightly for lighting
            const gradX = sliceOpen ? x : x - Math.sign(x) * rx * 0.15;
            const gradY = sliceOpen ? y : y - Math.sign(y) * ry * 0.15;

            let grad = ctx.createRadialGradient(gradX, gradY, 0, x, y, Math.max(rx, ry));

            if (sliceOpen) {
                // Sliced view - internal energy
                grad.addColorStop(0, theme.core);
                grad.addColorStop(0.3, theme.edge);
                grad.addColorStop(1, 'transparent');
            } else {
                // External puffy view
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.1, theme.core);
                grad.addColorStop(0.8, theme.edge);
                grad.addColorStop(1, 'transparent');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        // Draw Orbitals
        ctx.globalCompositeOperation = 'screen';

        if (l === 0) {
            drawLobe(0, 0, size, size, 0);
        } else if (l === 1) {
            const angle = m === 0 ? Math.PI / 2 : (m === 1 ? 0 : Math.PI / 4);
            drawLobe(size * 0.55, 0, lobeWidth, lobeThickness, angle);
            drawLobe(-size * 0.55, 0, lobeWidth, lobeThickness, angle);
        } else if (l === 2) {
            if (m === 0) {
                // dz2 specific lobe
                drawLobe(0, size * 0.55, lobeThickness, lobeWidth, 0);
                drawLobe(0, -size * 0.55, lobeThickness, lobeWidth, 0);

                // Torus (Doughnut)
                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(1, 0.35);
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
                ctx.lineWidth = size * 0.3;

                if (sliceOpen) {
                    ctx.strokeStyle = theme.edge;
                } else {
                    ctx.strokeStyle = theme.edge;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = theme.core;
                }
                ctx.stroke();
                ctx.restore();
            } else {
                // Clover shapes
                const angleOffset = (m === 2 || m === -2) ? Math.PI / 4 : 0;
                for (let i = 0; i < 4; i++) {
                    drawLobe(size * 0.45, 0, lobeWidth * 0.8, lobeThickness * 0.8, angleOffset + i * Math.PI / 2);
                }
            }
        }

        ctx.globalCompositeOperation = 'source-over';

        // Draw exact Nodes
        if (highlightNodes) {
            // Draw Nucleus center point
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Radial Nodes -> Dashed Red Circles
            if (radialNodes > 0 && sliceOpen) {
                ctx.strokeStyle = '#ef4444';
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

            // Angular Nodes -> Blue Lines
            if (angularNodes > 0) {
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.8;

                const drawPlaneLine = (angle: number) => {
                    ctx.beginPath();
                    // Just draw across the canvas bounds
                    const rad = Math.max(w, h);
                    ctx.moveTo(cx - Math.cos(angle) * rad, cy - Math.sin(angle) * rad);
                    ctx.lineTo(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad);
                    ctx.stroke();
                };

                if (l === 1) { // 1 plane
                    const angle = m === 0 ? 0 : (m === 1 ? Math.PI / 2 : -Math.PI / 4);
                    drawPlaneLine(angle);
                } else if (l === 2) { // 2 planes or conical surface
                    if (m === 0) {
                        drawPlaneLine(Math.PI / 6);
                        drawPlaneLine(-Math.PI / 6);
                    } else {
                        const angleOffset = (m === 2 || m === -2) ? 0 : Math.PI / 4;
                        drawPlaneLine(angleOffset);
                        drawPlaneLine(angleOffset + Math.PI / 2);
                    }
                }
                ctx.globalAlpha = 1.0;
            }
        }

        // Mini Axes Legend fixed in bottom right corner
        const drawAxis = (xDir: number, yDir: number, color: string, label: string) => {
            const axX = w - 60;
            const axY = h - 60;
            ctx.beginPath();
            ctx.moveTo(axX, axY);
            ctx.lineTo(axX + xDir * 35, axY + yDir * 35);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(label, axX + xDir * 45 - 4, axY + yDir * 45 + 4);
        };
        drawAxis(1, 0, '#f43f5e', 'x');
        drawAxis(0, -1, '#22c55e', 'y');

    }, [n, l, m, sliceOpen, highlightNodes, dimensions]);

    return (
        <div className="w-full flex-1 flex flex-col lg:flex-row h-full bg-slate-900 border-x border-b border-slate-700 rounded-b-xl text-slate-200 font-sans relative overflow-hidden">

            {/* 2D Visualizer Area */}
            <div ref={containerRef} className="flex-1 relative bg-black min-h-[600px] overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 block cursor-crosshair"
                />

                {/* Realtime Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none z-10 w-fit">
                    <div className="bg-slate-800/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg inline-flex items-center shadow-xl">
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
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-slate-800/80 backdrop-blur p-2 rounded-xl border border-slate-700 shadow-2xl z-10 w-fit">
                    <button
                        onClick={() => setSliceOpen(!sliceOpen)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all border whitespace-nowrap ${sliceOpen
                            ? 'bg-amber-500 text-slate-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                            : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        <Slice size={18} />
                        Cross-Section View
                    </button>

                    <button
                        onClick={() => setHighlightNodes(!highlightNodes)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all border whitespace-nowrap ${highlightNodes
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
            <div className="w-full lg:w-96 shrink-0 bg-slate-800 border-l border-slate-700 flex flex-col z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">

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
