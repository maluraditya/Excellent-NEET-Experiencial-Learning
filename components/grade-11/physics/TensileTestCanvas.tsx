import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';

interface TensileTestProps {
    materialType?: 'ductile' | 'brittle' | 'elastomer';
}

const TensileTestCanvas: React.FC<TensileTestProps> = ({ materialType: initialMaterial = 'ductile' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [material, setMaterial] = useState<'ductile' | 'brittle' | 'elastomer'>(initialMaterial);

    const [force, setForce] = useState(0);
    const [radius, setRadius] = useState(2);
    const originalLength = 100;

    // Derived physics (computed, not in state, to avoid feedback loops)
    const materials = useMemo(() => ({
        ductile: { name: 'Steel', Y: 200, ultimateStress: 400, fractureStress: 450, color: '#64748b', emoji: '🔩' },
        brittle: { name: 'Glass', Y: 70, ultimateStress: 50, fractureStress: 55, color: '#94a3b8', emoji: '🪟' },
        elastomer: { name: 'Rubber', Y: 0.05, ultimateStress: 30, fractureStress: 35, color: '#f59e0b', emoji: '🎈' }
    }), []);

    const currentMat = materials[material];
    const area = Math.PI * radius * radius;

    // Compute stress/strain from force (pure derivation, no state updates in loops)
    const computePhysics = useCallback((f: number) => {
        const s = f / area; // stress in MPa

        let e = 0; // strain
        if (material === 'elastomer') {
            // Rubber: very non-linear, huge strains
            e = s / currentMat.Y;
            if (e > 2) e = 2 + Math.sqrt(s / currentMat.Y - 2) * 0.5;
        } else {
            const yieldStress = currentMat.ultimateStress * 0.6;
            if (s <= yieldStress) {
                // Linear elastic region (Hooke's Law)
                e = s / (currentMat.Y * 10);
            } else {
                // Plastic region - softer slope
                const yieldStrain = yieldStress / (currentMat.Y * 10);
                e = yieldStrain + (s - yieldStress) / (currentMat.Y * 2);
            }
        }

        const isFractured = s >= currentMat.fractureStress;
        return { stress: s, strain: e, fractured: isFractured };
    }, [area, material, currentMat]);

    const physics = computePhysics(force);
    const extension = physics.strain * originalLength;

    // Max force for slider: set so fracture happens near 90% of slider
    const maxForce = useMemo(() => {
        return Math.ceil(currentMat.fractureStress * area * 1.15 / 100) * 100;
    }, [currentMat, area]);

    // Build graph data: sample across the force range
    const graphData = useMemo(() => {
        const points: { strain: number; stress: number }[] = [];
        const steps = 200;
        const capForce = physics.fractured ? currentMat.fractureStress * area : force;
        for (let i = 0; i <= steps; i++) {
            const f = (capForce * i) / steps;
            const p = computePhysics(f);
            if (p.stress >= currentMat.fractureStress) break;
            points.push({ strain: p.strain, stress: p.stress });
        }
        return points;
    }, [force, physics.fractured, computePhysics, currentMat, area]);

    const resetSimulation = () => {
        setForce(0);
    };

    // Draw Logic
    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.clearRect(0, 0, w, h);

        // --- LEFT: APPARATUS ---
        const apparatusX = w * 0.2;
        const topY = 50;

        // Support frame
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(apparatusX - 70, topY - 30, 140, 8);
        ctx.fillRect(apparatusX - 70, topY - 30, 8, 35);
        ctx.fillRect(apparatusX + 62, topY - 30, 8, 35);

        // Clamp
        ctx.fillStyle = '#475569';
        ctx.fillRect(apparatusX - 20, topY - 5, 40, 12);

        // The Wire
        const wireBaseLen = 180;
        const wireExt = Math.min(extension * 1.5, 120);
        const wireTotalLen = wireBaseLen + wireExt;
        const wireWidth = Math.max(radius * 3, 4);

        if (!physics.fractured) {
            // Necking effect near fracture
            const neckFactor = physics.stress > currentMat.ultimateStress
                ? Math.max(0.4, 1 - (physics.stress - currentMat.ultimateStress) / (currentMat.fractureStress - currentMat.ultimateStress) * 0.6)
                : 1;

            const gradient = ctx.createLinearGradient(apparatusX - wireWidth, topY + 7, apparatusX + wireWidth, topY + 7);
            gradient.addColorStop(0, currentMat.color);
            gradient.addColorStop(0.5, '#94a3b8');
            gradient.addColorStop(1, currentMat.color);
            ctx.fillStyle = gradient;

            // Top half
            ctx.fillRect(apparatusX - wireWidth / 2, topY + 7, wireWidth, wireTotalLen * 0.45);
            // Neck region
            const neckWidth = wireWidth * neckFactor;
            ctx.fillRect(apparatusX - neckWidth / 2, topY + 7 + wireTotalLen * 0.45, neckWidth, wireTotalLen * 0.1);
            // Bottom half
            ctx.fillRect(apparatusX - wireWidth / 2, topY + 7 + wireTotalLen * 0.55, wireWidth, wireTotalLen * 0.45);
        } else {
            // Fractured wire - two pieces
            ctx.fillStyle = currentMat.color;
            ctx.fillRect(apparatusX - wireWidth / 2, topY + 7, wireWidth, wireTotalLen * 0.45);

            // Jagged break
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            const breakY = topY + 7 + wireTotalLen * 0.47;
            ctx.moveTo(apparatusX - wireWidth, breakY);
            ctx.lineTo(apparatusX - wireWidth / 3, breakY + 5);
            ctx.lineTo(apparatusX, breakY - 3);
            ctx.lineTo(apparatusX + wireWidth / 3, breakY + 4);
            ctx.lineTo(apparatusX + wireWidth, breakY);
            ctx.stroke();

            ctx.fillStyle = currentMat.color;
            ctx.fillRect(apparatusX - wireWidth / 2, topY + 7 + wireTotalLen * 0.55 + 15, wireWidth, wireTotalLen * 0.35);

            // FRACTURED label
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 16px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('⚠ FRACTURED!', apparatusX, topY + wireTotalLen + 50);
            ctx.textAlign = 'start';
        }

        // Weight hanger
        const hangerY = topY + 7 + wireTotalLen;
        if (!physics.fractured) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(apparatusX - 35, hangerY, 70, 6);

            // Weight blocks (proportional to force)
            const weightRatio = force / maxForce;
            const numWeights = Math.floor(weightRatio * 6);
            for (let i = 0; i < numWeights; i++) {
                const shade = 30 + i * 15;
                ctx.fillStyle = `rgb(${shade}, ${shade + 10}, ${shade + 20})`;
                ctx.fillRect(apparatusX - 25, hangerY + 8 + i * 14, 50, 11);
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(apparatusX - 25, hangerY + 8 + i * 14, 50, 11);
            }

            // Force arrow
            if (force > 0) {
                const arrowY = hangerY + 8 + numWeights * 14 + 10;
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(apparatusX, arrowY);
                ctx.lineTo(apparatusX, arrowY + 20);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(apparatusX - 6, arrowY + 14);
                ctx.lineTo(apparatusX, arrowY + 22);
                ctx.lineTo(apparatusX + 6, arrowY + 14);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 11px system-ui';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.round(force)} N`, apparatusX, arrowY + 36);
                ctx.textAlign = 'start';
            }
        }

        // --- RIGHT: STRESS-STRAIN GRAPH ---
        const gX = w * 0.48;
        const gY = 40;
        const gW = w * 0.46;
        const gH = h * 0.75;

        // Graph background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(gX, gY, gW, gH);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(gX, gY, gW, gH);

        // Grid
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(gX, gY + (gH / 5) * i);
            ctx.lineTo(gX + gW, gY + (gH / 5) * i);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(gX + (gW / 5) * i, gY);
            ctx.lineTo(gX + (gW / 5) * i, gY + gH);
            ctx.stroke();
        }

        // Axes
        ctx.beginPath();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.moveTo(gX, gY);
        ctx.lineTo(gX, gY + gH);
        ctx.lineTo(gX + gW, gY + gH);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px system-ui';
        ctx.save();
        ctx.translate(gX - 14, gY + gH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText('Stress σ (MPa)', 0, 0);
        ctx.restore();
        ctx.textAlign = 'center';
        ctx.fillText('Strain ε', gX + gW / 2, gY + gH + 20);
        ctx.textAlign = 'start';

        // Scale
        const maxGraphStress = currentMat.fractureStress * 1.2;
        const maxGraphStrain = material === 'elastomer' ? 800 : (currentMat.fractureStress / (currentMat.Y * 2) + currentMat.ultimateStress * 0.6 / (currentMat.Y * 10)) * 1.5;

        const gGetX = (v: number) => gX + (v / maxGraphStrain) * gW;
        const gGetY = (v: number) => gY + gH - (v / maxGraphStress) * gH;


        // Tick marks
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        for (let i = 0; i <= 4; i++) {
            const sv = (maxGraphStress / 4) * i;
            ctx.textAlign = 'right';
            ctx.fillText(sv.toFixed(0), gX - 4, gGetY(sv) + 3);
        }
        for (let i = 0; i <= 4; i++) {
            const ev = (maxGraphStrain / 4) * i;
            ctx.textAlign = 'center';
            ctx.fillText(ev.toFixed(3), gGetX(ev), gY + gH + 12);
        }
        ctx.textAlign = 'start';

        // Plot curve
        if (graphData.length > 1) {
            // Curve shadow
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.lineWidth = 6;
            ctx.moveTo(gGetX(graphData[0].strain), gGetY(graphData[0].stress));
            graphData.forEach(pt => ctx.lineTo(gGetX(pt.strain), gGetY(pt.stress)));
            ctx.stroke();

            // Main curve
            ctx.beginPath();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.moveTo(gGetX(graphData[0].strain), gGetY(graphData[0].stress));
            graphData.forEach(pt => ctx.lineTo(gGetX(pt.strain), gGetY(pt.stress)));
            ctx.stroke();

            // Tracer dot
            const last = graphData[graphData.length - 1];
            ctx.beginPath();
            ctx.arc(gGetX(last.strain), gGetY(last.stress), 6, 0, Math.PI * 2);
            ctx.fillStyle = '#dc2626';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Yield point marker
            const yieldStress = currentMat.ultimateStress * 0.6;
            const yieldPt = graphData.find(p => p.stress >= yieldStress * 0.95);
            if (yieldPt) {
                ctx.beginPath();
                ctx.arc(gGetX(yieldPt.strain), gGetY(yieldPt.stress), 4, 0, Math.PI * 2);
                ctx.fillStyle = '#f59e0b';
                ctx.fill();
                ctx.fillStyle = '#92400e';
                ctx.font = '9px system-ui';
                ctx.fillText('Yield Point', gGetX(yieldPt.strain) + 8, gGetY(yieldPt.stress) - 5);
            }

            // Fracture point marker
            if (physics.fractured && graphData.length > 0) {
                const fracPt = last;
                const fx = gGetX(fracPt.strain);
                const fy = gGetY(fracPt.stress);

                // X marker
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(fx - 6, fy - 6);
                ctx.lineTo(fx + 6, fy + 6);
                ctx.moveTo(fx + 6, fy - 6);
                ctx.lineTo(fx - 6, fy + 6);
                ctx.stroke();

                // Label with background
                const label = '⚠ Fracture Point';
                ctx.font = 'bold 10px system-ui';
                const textW = ctx.measureText(label).width;
                ctx.fillStyle = 'rgba(254, 226, 226, 0.9)';
                ctx.fillRect(fx - textW / 2 - 4, fy - 24, textW + 8, 16);
                ctx.strokeStyle = '#fca5a5';
                ctx.lineWidth = 1;
                ctx.strokeRect(fx - textW / 2 - 4, fy - 24, textW + 8, 16);
                ctx.fillStyle = '#991b1b';
                ctx.textAlign = 'center';
                ctx.fillText(label, fx, fy - 13);
                ctx.textAlign = 'start';
            }
        }

    }, [force, extension, radius, physics, currentMat, graphData, material, maxForce]);


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const render = () => {
            draw(ctx);
            animationFrameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [draw]);


    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Canvas */}
            <div className="relative flex-grow min-h-[350px]">
                <canvas ref={canvasRef} width={800} height={450} className="w-full h-full" />

                {/* Live Data Overlay */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md border border-slate-200 text-xs">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                        <span className="text-slate-400 font-semibold uppercase tracking-wide">Material</span>
                        <span className="font-mono font-bold text-right" style={{ color: currentMat.color }}>{currentMat.emoji} {currentMat.name}</span>

                        <span className="text-slate-400 font-semibold uppercase tracking-wide">Young's Mod</span>
                        <span className="font-mono font-bold text-right">{currentMat.Y} GPa</span>

                        <div className="col-span-2 h-px bg-slate-200 my-0.5"></div>

                        <span className="text-slate-400 font-semibold uppercase tracking-wide">Stress σ</span>
                        <span className={`font-mono font-bold text-right ${physics.fractured ? 'text-red-500' : 'text-red-500'}`}>{physics.stress.toFixed(1)} MPa</span>

                        <span className="text-slate-400 font-semibold uppercase tracking-wide">Strain ε</span>
                        <span className="font-mono font-bold text-right text-blue-500">{physics.strain.toFixed(4)}</span>

                        <span className="text-slate-400 font-semibold uppercase tracking-wide">Cross Area</span>
                        <span className="font-mono font-bold text-right">{area.toFixed(1)} mm²</span>
                    </div>
                </div>
            </div>

            {/* ===== Controls ===== */}
            <div className="bg-white border-t-2 border-slate-200 px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

                    {/* Material */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Material</label>
                        <div className="flex bg-slate-100 rounded-lg p-1 gap-0.5">
                            {(Object.keys(materials) as Array<keyof typeof materials>).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => { setMaterial(m); setForce(0); }}
                                    className={`flex-1 py-2 px-1 text-xs font-bold rounded-md transition-all duration-200 ${material === m
                                        ? 'bg-white shadow-sm text-slate-800 ring-1 ring-slate-200'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                        }`}
                                >
                                    {materials[m].emoji} {materials[m].name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Force */}
                    <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Applied Force</label>
                            <span className={`text-sm font-mono font-bold ${physics.fractured ? 'text-red-500' : 'text-slate-700'}`}>
                                {physics.fractured ? '⚠ SNAP!' : `${Math.round(force)} N`}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={maxForce}
                            step={Math.max(1, Math.round(maxForce / 500))}
                            value={force}
                            onChange={(e) => setForce(Number(e.target.value))}
                            className="w-full h-2.5 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-green-200 via-yellow-200 to-red-300"
                            style={{ accentColor: physics.fractured ? '#ef4444' : '#3b82f6' }}
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>0 N</span>
                            <span>{maxForce} N</span>
                        </div>
                    </div>

                    {/* Radius + Reset */}
                    <div className="flex gap-3 items-end">
                        <div className="space-y-1.5 flex-grow">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Wire Radius</label>
                                <span className="text-xs font-mono font-bold text-slate-600">{radius} mm</span>
                            </div>
                            <input
                                type="range"
                                min={0.5}
                                max={5}
                                step={0.5}
                                value={radius}
                                onChange={(e) => { setRadius(Number(e.target.value)); setForce(0); }}
                                className="w-full h-2.5 rounded-full appearance-none cursor-pointer bg-slate-200"
                                style={{ accentColor: '#3b82f6' }}
                            />
                        </div>
                        <button
                            onClick={() => { setForce(0); }}
                            className="h-9 w-9 flex-shrink-0 flex items-center justify-center bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-lg border border-slate-200 hover:border-red-200 transition-all duration-200"
                            title="Reset"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TensileTestCanvas;
