import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Battery, Zap, Activity } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ElectrochemistryLabProps {
    topic: any;
    onExit: () => void;
}

const ElectrochemistryLab: React.FC<ElectrochemistryLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const ionsRef = useRef<Array<{ id: string, x: number, y: number, type: 'anion' | 'cation', offset: number }>>([]);
    const metalIonsRef = useRef<Array<{ id: string, x: number, y: number, type: 'Zn' | 'Cu', state: 'metal' | 'solution', progress: number, active: boolean }>>([]);

    // Extracted state from App.tsx
    const [externalVoltage, setExternalVoltage] = useState(0.0); // 0 to 2.5V
    const CELL_POTENTIAL = 1.10;

    const handleReset = useCallback(() => {
        setExternalVoltage(0.0);
    }, []);

    // Initialize ions
    useEffect(() => {
        const ions = [];
        for (let i = 0; i < 15; i++) {
            ions.push({
                id: `bridge-${i}`,
                x: 0,
                y: 0,
                type: Math.random() > 0.5 ? 'anion' : 'cation' as const,
                offset: Math.random()
            });
        }
        ionsRef.current = ions;

        const metalIons = [];
        for (let i = 0; i < 10; i++) {
            metalIons.push({
                id: `zn-${i}`,
                x: 0, y: 0,
                type: 'Zn' as const,
                state: 'metal' as const,
                progress: Math.random(),
                active: false
            });
            metalIons.push({
                id: `cu-${i}`,
                x: 0, y: 0,
                type: 'Cu' as const,
                state: 'solution' as const,
                progress: Math.random(),
                active: false
            });
        }
        metalIonsRef.current = metalIons;
    }, []);

    // ─── ResizeObserver ───
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const ro = new ResizeObserver(() => {
            // Trigger redraw implicitly if needed, loop handles it
        });
        ro.observe(parent);
        return () => ro.disconnect();
    }, []);

    // ─── Main Render ───
    useEffect(() => {
        const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const parent = canvas.parentElement;
            if (!parent) return;

            const isElectrolytic = externalVoltage.toFixed(2) > CELL_POTENTIAL.toFixed(2);
            const isEquilibrium = Math.abs(externalVoltage - CELL_POTENTIAL) < 0.02; // Tighter bounds
            const netVoltage = externalVoltage - CELL_POTENTIAL;
            const flowSpeed = isEquilibrium ? 0 : Math.abs(netVoltage) * 2;
            const flowDirection = isEquilibrium ? 0 : (externalVoltage < CELL_POTENTIAL ? 1 : -1);

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

            const scaleX = displayWidth / logicalWidth;
            const scaleY = displayHeight / logicalHeight;
            const drawScale = Math.min(scaleX, scaleY) * 0.95; // Slight padding

            const offsetX = (displayWidth - logicalWidth * drawScale) / 2;
            const offsetY = (displayHeight - logicalHeight * drawScale) / 2;

            ctx.translate(offsetX, offsetY);
            ctx.scale(drawScale, drawScale);

            const time = Date.now() / 1000;

            // Clear & Background
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);

            // Create a rich, subtle radial backdrop to make the components pop
            const bgGrad = ctx.createRadialGradient(logicalWidth / 2, logicalHeight / 2, 0, logicalWidth / 2, logicalHeight / 2, logicalWidth);
            bgGrad.addColorStop(0, '#ffffff');
            bgGrad.addColorStop(1, '#f1f5f9');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);

            const beakerY = 180;
            const beakerW = 160;
            const beakerH = 220;
            const leftBeakerX = 220;
            const rightBeakerX = 580;

            // Dynamic liquid levels based on cell action (exaggerated for effect)
            // Galvanic: Zn dissolves (left gets deeper), Cu plates (right gets shallower)
            // Electrolytic: opposite
            let levelOffset = 0;
            if (!isEquilibrium) {
                // simple oscillation for depth effect, bounded
                levelOffset = Math.sin(time * 0.5) * 10 * flowDirection;
            }
            const leftBgLevel = beakerY + 40 - levelOffset;
            const rightBgLevel = beakerY + 40 + levelOffset;

            // --- DRAW BEAKERS ---
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#cbd5e1';

            // Left Beaker (Zinc Sulfate - clear/light grey)
            ctx.beginPath();
            ctx.roundRect(leftBeakerX - beakerW / 2, beakerY, beakerW, beakerH, [5, 5, 15, 15]);
            ctx.stroke();

            const leftLiqGrad = ctx.createLinearGradient(0, leftBgLevel, 0, beakerY + beakerH);
            leftLiqGrad.addColorStop(0, 'rgba(241, 245, 249, 0.4)');
            leftLiqGrad.addColorStop(1, 'rgba(226, 232, 240, 0.8)');
            ctx.fillStyle = leftLiqGrad;
            ctx.beginPath();
            ctx.roundRect(leftBeakerX - beakerW / 2 + 2, leftBgLevel, beakerW - 4, beakerH - (leftBgLevel - beakerY) - 2, [0, 0, 12, 12]);
            ctx.fill();

            // Right Beaker (Copper Sulfate - rich blue)
            ctx.beginPath();
            ctx.roundRect(rightBeakerX - beakerW / 2, beakerY, beakerW, beakerH, [5, 5, 15, 15]);
            ctx.stroke();

            const rightLiqGrad = ctx.createLinearGradient(0, rightBgLevel, 0, beakerY + beakerH);
            rightLiqGrad.addColorStop(0, 'rgba(186, 230, 253, 0.6)'); // light blue top
            rightLiqGrad.addColorStop(1, 'rgba(56, 189, 248, 0.9)');  // deep blue bottom
            ctx.fillStyle = rightLiqGrad;
            ctx.beginPath();
            ctx.roundRect(rightBeakerX - beakerW / 2 + 2, rightBgLevel, beakerW - 4, beakerH - (rightBgLevel - beakerY) - 2, [0, 0, 12, 12]);
            ctx.fill();

            // Liquid surface ovals for 3D effect
            ctx.beginPath(); ctx.ellipse(leftBeakerX, leftBgLevel, beakerW / 2 - 2, 8, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
            ctx.beginPath(); ctx.ellipse(rightBeakerX, rightBgLevel, beakerW / 2 - 2, 8, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();

            // --- ELECTRODES ---
            // Dynamic thickness based on plating/dissolving (exaggerated)
            let leftThickness = 30 + (levelOffset * -0.5);
            let rightThickness = 30 + (levelOffset * 0.5);
            const electrodeH = 200;

            // Left (Zinc - silvery gray)
            const znGrad = ctx.createLinearGradient(leftBeakerX - leftThickness / 2, 0, leftBeakerX + leftThickness / 2, 0);
            znGrad.addColorStop(0, '#64748b');
            znGrad.addColorStop(0.5, '#94a3b8');
            znGrad.addColorStop(1, '#475569');
            ctx.fillStyle = znGrad;
            ctx.beginPath(); ctx.roundRect(leftBeakerX - leftThickness / 2, beakerY - 50, leftThickness, electrodeH, 3); ctx.fill();

            ctx.fillStyle = '#334155';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("Zn (s)", leftBeakerX, beakerY + beakerH + 30);

            // Right (Copper - metallic orange/brown)
            const cuGrad = ctx.createLinearGradient(rightBeakerX - rightThickness / 2, 0, rightBeakerX + rightThickness / 2, 0);
            cuGrad.addColorStop(0, '#92400e');
            cuGrad.addColorStop(0.5, '#d97706');
            cuGrad.addColorStop(1, '#78350f');
            ctx.fillStyle = cuGrad;
            ctx.beginPath(); ctx.roundRect(rightBeakerX - rightThickness / 2, beakerY - 50, rightThickness, electrodeH, 3); ctx.fill();

            ctx.fillStyle = '#92400e';
            ctx.fillText("Cu (s)", rightBeakerX, beakerY + beakerH + 30);

            // --- SALT BRIDGE ---
            ctx.beginPath();
            ctx.lineWidth = 36;
            ctx.strokeStyle = 'rgba(254, 240, 138, 0.3)'; // outer glow
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const bridgePath = new Path2D();
            const bridgeYDrop = 30; // how deep it goes into liquid
            bridgePath.moveTo(leftBeakerX + leftThickness / 2 + 20, Math.min(leftBgLevel + bridgeYDrop, beakerY + beakerH - 20));
            bridgePath.lineTo(leftBeakerX + 80, Math.min(leftBgLevel + bridgeYDrop, beakerY + beakerH - 20));
            bridgePath.lineTo(leftBeakerX + 80, beakerY - 10);
            bridgePath.lineTo(rightBeakerX - 80, beakerY - 10);
            bridgePath.lineTo(rightBeakerX - 80, Math.min(rightBgLevel + bridgeYDrop, beakerY + beakerH - 20));
            bridgePath.lineTo(rightBeakerX - rightThickness / 2 - 20, Math.min(rightBgLevel + bridgeYDrop, beakerY + beakerH - 20));

            ctx.stroke(bridgePath);

            ctx.lineWidth = 24;
            ctx.strokeStyle = '#fef08a'; // Inner solid
            ctx.stroke(bridgePath);

            // Cotton plugs
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(leftBeakerX + leftThickness / 2 + 20, Math.min(leftBgLevel + bridgeYDrop, beakerY + beakerH - 20), 12, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(rightBeakerX - rightThickness / 2 - 20, Math.min(rightBgLevel + bridgeYDrop, beakerY + beakerH - 20), 12, 0, Math.PI * 2); ctx.fill();

            ctx.lineWidth = 1;

            // --- IONS IN BRIDGE ---
            if (!isEquilibrium) {
                const bridgeY = beakerY - 10;
                const bridgeLeftX = leftBeakerX + 80;
                const bridgeRightX = rightBeakerX - 80;

                ionsRef.current.forEach((ion, i) => {
                    let y = bridgeY + (Math.sin(time * 5 + ion.offset * 10) * 6);
                    let x = 0;

                    if (ion.type === 'anion') {
                        const p = (time * 0.5 + ion.offset) % 1;
                        const effectiveP = flowDirection === 1 ? (1 - p) : p;
                        x = bridgeLeftX + effectiveP * (bridgeRightX - bridgeLeftX);

                        ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10;
                        ctx.fillStyle = '#ef4444';
                        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.shadowBlur = 0;
                        ctx.fillStyle = 'white'; ctx.font = 'bold 11px sans-serif'; ctx.fillText("-", x, y + 4);
                    } else {
                        const p = (time * 0.5 + ion.offset + 0.5) % 1;
                        const effectiveP = flowDirection === 1 ? p : (1 - p);
                        x = bridgeLeftX + effectiveP * (bridgeRightX - bridgeLeftX);

                        ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 10;
                        ctx.fillStyle = '#22c55e';
                        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.shadowBlur = 0;
                        ctx.fillStyle = 'white'; ctx.font = 'bold 11px sans-serif'; ctx.fillText("+", x, y + 4);
                    }
                });
            }

            // --- METAL ION TRANSFER (Dissolving/Plating) ---
            if (!isEquilibrium) {
                const transferSpeed = flowSpeed * 0.8;

                metalIonsRef.current.forEach(ion => {
                    ion.progress = (ion.progress + transferSpeed * 0.01) % 1;
                    ion.active = true;

                    let x = 0, y = 0, alpha = 1;

                    if (ion.type === 'Zn') {
                        // In Galvanic (flowDirection=1): Zn dissolving from electrode to solution
                        // In Electrolytic (flowDirection=-1): Zn plating from solution to electrode
                        const p = flowDirection === 1 ? ion.progress : (1 - ion.progress);

                        const startX = leftBeakerX + (Math.random() > 0.5 ? leftThickness / 2 : -leftThickness / 2);
                        const startY = beakerY + 50 + (ion.offset * 100);

                        const endX = leftBeakerX + (Math.sin(ion.offset * Math.PI * 2) * (beakerW / 2 - 20));
                        const endY = beakerY + beakerH - 40 - (ion.offset * 50);

                        // Bezier curve path
                        x = startX + (endX - startX) * p;
                        y = startY + (endY - startY) * p + Math.sin(p * Math.PI) * 20;

                        // Fade out as it dissolves deep, fade in as it plates
                        alpha = flowDirection === 1 ? (1 - p) : p;

                        ctx.shadowColor = '#94a3b8'; ctx.shadowBlur = 10;
                        ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
                        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
                        ctx.shadowBlur = 0;
                        if (alpha > 0.2) {
                            ctx.fillStyle = `rgba(30, 41, 59, ${alpha})`; ctx.font = 'bold 10px sans-serif'; ctx.fillText("Zn²⁺", x, y + 3);
                        }
                    } else if (ion.type === 'Cu') {
                        // In Galvanic (flowDirection=1): Cu plating from solution to electrode
                        // In Electrolytic (flowDirection=-1): Cu dissolving from electrode to solution
                        const p = flowDirection === 1 ? ion.progress : (1 - ion.progress);

                        const startX = rightBeakerX + (Math.sin(ion.offset * Math.PI * 2) * (beakerW / 2 - 20));
                        const startY = beakerY + beakerH - 40 - (ion.offset * 50);

                        const endX = rightBeakerX + (Math.random() > 0.5 ? rightThickness / 2 : -rightThickness / 2);
                        const endY = beakerY + 50 + (ion.offset * 100);

                        // Bezier curve path
                        x = startX + (endX - startX) * p;
                        y = startY + (endY - startY) * p - Math.sin(p * Math.PI) * 20;

                        // Fade out as it plates (becomes solid), fade in as it dissolves
                        alpha = flowDirection === 1 ? (1 - p) : p;

                        ctx.shadowColor = '#0284c7'; ctx.shadowBlur = 10;
                        ctx.fillStyle = `rgba(2, 132, 199, ${alpha})`;
                        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
                        ctx.shadowBlur = 0;
                        if (alpha > 0.2) {
                            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`; ctx.font = 'bold 10px sans-serif'; ctx.fillText("Cu²⁺", x, y + 3);
                        }
                    }
                });
            }

            // --- WIRING ---
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(leftBeakerX, beakerY - 50);
            ctx.lineTo(leftBeakerX, 50);
            ctx.lineTo(rightBeakerX, 50);
            ctx.lineTo(rightBeakerX, beakerY - 50);
            ctx.stroke();

            // Wire inner highlight
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Source/Load Box
            const centerX = (leftBeakerX + rightBeakerX) / 2;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.roundRect(centerX - 60, 25, 120, 50, 8); ctx.fill();
            ctx.shadowBlur = 0;

            // Color based on state
            const stateColor = isEquilibrium ? '#64748b' : (isElectrolytic ? '#ef4444' : '#22c55e');
            ctx.strokeStyle = stateColor;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Bulb glow effect if generating
            if (!isEquilibrium && !isElectrolytic) {
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 20 + Math.sin(time * 10) * 10; // Flicker
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath(); ctx.arc(centerX, 25, 15, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = stateColor;
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(isElectrolytic ? "Ext Power" : "Load (Bulb)", centerX, 55);

            // --- ELECTRONS ---
            if (!isEquilibrium) {
                const eSpeed = flowSpeed * 3;
                ctx.fillStyle = '#fbbf24';
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 15;
                for (let i = 0; i < 12; i++) {
                    let progress = (time * eSpeed + i / 12) % 1;
                    if (flowDirection === -1) progress = 1 - progress;

                    const x = leftBeakerX + progress * (rightBeakerX - leftBeakerX);
                    const y = 50;

                    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#78350f'; ctx.font = 'bold 10px sans-serif'; ctx.fillText("e-", x, y + 3);
                    ctx.fillStyle = '#fbbf24'; // Reset for next
                }
                ctx.shadowBlur = 0;
            }

            // --- LABELS ---
            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = stateColor;
            let modeText = "Equilibrium (No Reaction)";
            if (!isEquilibrium) modeText = isElectrolytic ? "Electrolytic Cell (Consumes)" : "Galvanic Cell (Produces)";
            ctx.fillText(modeText, centerX, 15);

            // Description underneath
            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#64748b';
            if (isElectrolytic) {
                ctx.fillText("Reduction (Cathode)", leftBeakerX, beakerY + beakerH + 55);
                ctx.fillText("Oxidation (Anode)", rightBeakerX, beakerY + beakerH + 55);
                ctx.fillStyle = '#ef4444';
                ctx.fillText("← e⁻ flow driven by external V", centerX, 100);
            } else if (!isEquilibrium) {
                ctx.fillText("Oxidation (Anode)", leftBeakerX, beakerY + beakerH + 55);
                ctx.fillText("Reduction (Cathode)", rightBeakerX, beakerY + beakerH + 55);
                ctx.fillStyle = '#22c55e';
                ctx.fillText("e⁻ flow spontaneous →", centerX, 100);
            }

            ctx.restore();
            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [externalVoltage]);

    const isElectrolytic = externalVoltage.toFixed(2) > CELL_POTENTIAL.toFixed(2);
    const isEquilibrium = Math.abs(externalVoltage - CELL_POTENTIAL) < 0.02;

    // ─── JSX ───
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 overflow-hidden rounded-2xl border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

                {/* Overlay Dashboard - enhanced styling */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl p-4 rounded-2xl pointer-events-none">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Voltages</div>
                    <div className="flex flex-col gap-2 min-w-[140px]">
                        <div className="flex justify-between items-center gap-4 border-b border-slate-100 pb-1">
                            <span className="text-sm font-medium text-slate-600">Cell (E°):</span>
                            <span className="font-mono font-bold text-emerald-600">{CELL_POTENTIAL.toFixed(2)}V</span>
                        </div>
                        <div className="flex justify-between items-center gap-4 border-b border-slate-100 pb-1">
                            <span className="text-sm font-medium text-slate-600">External:</span>
                            <span className="font-mono font-bold text-red-600">{externalVoltage.toFixed(2)}V</span>
                        </div>
                        <div className="flex justify-between items-center gap-4 mt-1">
                            <span className="text-sm font-bold text-slate-800">Net:</span>
                            <span className="font-mono font-bold text-slate-800">{Math.abs(CELL_POTENTIAL - externalVoltage).toFixed(2)}V</span>
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>
            <div className={`text-white flex justify-center items-center p-3 text-sm font-bold border-t shrink-0 ${isEquilibrium ? 'bg-slate-600 border-slate-700' : (isElectrolytic ? 'bg-red-600 border-red-700' : 'bg-emerald-600 border-emerald-700')}`}>
                {isEquilibrium && "EQUILIBRIUM: External opposing voltage equals Cell potential. Reactions stop."}
                {!isEquilibrium && !isElectrolytic && "GALVANIC MODE: Net potential is positive. Spontaneous chemical reaction generates electricity."}
                {!isEquilibrium && isElectrolytic && "ELECTROLYTIC MODE: External voltage overcomes cell potential, driving a non-spontaneous reaction backwards."}
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full w-full">
            <div className="flex bg-slate-50 border-b border-slate-200 p-4 gap-2 rounded-t-xl shrink-0">
                <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Battery className={isElectrolytic ? "text-red-500" : "text-emerald-500"} size={20} />
                    Opposing Voltage (E_ext)
                </h3>
            </div>

            <div className="p-4 flex flex-col gap-4 w-full flex-1 overflow-y-auto max-h-[35vh] lg:max-h-[300px]">
                <div className={`text-center px-3 py-2 border rounded-lg text-sm ${isEquilibrium ? 'bg-slate-50 border-slate-300 text-slate-800' : (isElectrolytic ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900')}`}>
                    A Daniel Cell (Zn/Cu) has a standard potential of <strong>1.1V</strong>. Applying an external opposing voltage (E_ext) changes its behavior.
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span className="flex items-center gap-1"><Zap size={14} /> External Voltage</span>
                            <span className="text-slate-800 font-mono bg-slate-100 px-2 rounded">{externalVoltage.toFixed(2)} V</span>
                        </label>
                        <input
                            type="range" min="0" max="2.5" step="0.05"
                            value={externalVoltage}
                            onChange={(e) => setExternalVoltage(Number(e.target.value))}
                            className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${isElectrolytic ? 'accent-red-500 bg-red-100' : 'accent-emerald-500 bg-emerald-100'}`}
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 mt-1">
                            <span>0.0V (Pure Galvanic)</span>
                            <span className="text-slate-600">1.1V (Equilibrium)</span>
                            <span>2.5V (Electrolytic)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                            onClick={() => setExternalVoltage(0)}
                            className="p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Set to 0.0V
                        </button>
                        <button
                            onClick={() => setExternalVoltage(1.10)}
                            className="p-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Set to E° (1.10V)
                        </button>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm mt-2">
                        <ul className="space-y-2">
                            <li className="flex gap-2">
                                <Activity className="text-emerald-500 shrink-0" size={16} />
                                <span className="text-slate-700"><strong>E_ext &lt; 1.1V:</strong> Electrons flow Zn → Cu. Zinc dissolves, Copper plates.</span>
                            </li>
                            <li className="flex gap-2">
                                <Activity className="text-slate-500 shrink-0" size={16} />
                                <span className="text-slate-700"><strong>E_ext = 1.1V:</strong> No electron flow. Chemical reactions halt. Current is zero.</span>
                            </li>
                            <li className="flex gap-2">
                                <Activity className="text-red-500 shrink-0" size={16} />
                                <span className="text-slate-700"><strong>E_ext &gt; 1.1V:</strong> Electrons flow Cu → Zn. Copper dissolves, Zinc plates (Electrolytic).</span>
                            </li>
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

export default ElectrochemistryLab;
