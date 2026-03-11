import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Layers, Hammer, Flame, Zap, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface Props {
    topic: any;
    onExit: () => void;
}

const ClassificationOfSolidsLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const startTime = useRef(Date.now());

    const [solidType, setSolidType] = useState<'ionic' | 'metallic' | 'molecular' | 'covalent'>('ionic');
    const [action, setAction] = useState<'none' | 'hammer' | 'heat' | 'battery'>('none');

    const handleReset = useCallback(() => {
        setAction('none');
        startTime.current = Date.now();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const ro = new ResizeObserver(() => { });
        ro.observe(parent);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const draw = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const parent = canvas.parentElement;
            if (!parent) return;

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
            const drawScale = Math.min(scaleX, scaleY);

            const offsetX = (displayWidth - logicalWidth * drawScale) / 2;
            const offsetY = (displayHeight - logicalHeight * drawScale) / 2;

            ctx.translate(offsetX, offsetY);
            ctx.scale(drawScale, drawScale);

            // Rich radial gradient background
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);
            const bgGrad = ctx.createRadialGradient(logicalWidth / 2, logicalHeight / 2, 0, logicalWidth / 2, logicalHeight / 2, logicalWidth);
            bgGrad.addColorStop(0, '#ffffff');
            bgGrad.addColorStop(1, '#f1f5f9');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);

            // Soft border
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, logicalWidth, logicalHeight);

            const time = (Date.now() - startTime.current) / 1000;

            const spacing = 65;
            const startX = 250;
            const startY = 160;

            // Title
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'left';

            const titles = {
                'ionic': 'Ionic Solid (e.g., NaCl)',
                'metallic': 'Metallic Solid (e.g., Cu)',
                'molecular': 'Molecular Solid (e.g., I₂)',
                'covalent': 'Covalent Network (e.g., Diamond)'
            };
            ctx.fillText(titles[solidType], 30, 40);

            let explanation = "";
            if (action === 'hammer') {
                if (solidType === 'ionic') explanation = "Ionic solids are BRITTLE. Force aligns like charges -> Repulsion -> Fracture.";
                if (solidType === 'metallic') explanation = "Metallic solids are MALLEABLE. Electron sea allows layers to slide without breaking.";
                if (solidType === 'molecular') explanation = "Molecular solids are SOFT. Weak intermolecular forces are easily overcome.";
                if (solidType === 'covalent') explanation = "Covalent networks are extremely HARD. Strong bonds resist deformation.";
            } else if (action === 'battery') {
                if (solidType === 'ionic') explanation = "INSULATOR (Solid State). Ions fixed in rigid lattice.";
                if (solidType === 'metallic') explanation = "CONDUCTOR. Free delocalized electrons carry charge.";
                if (solidType === 'molecular') explanation = "INSULATOR. No free charge carriers.";
                if (solidType === 'covalent') explanation = "INSULATOR. Electrons held tightly in bonds (Diamond).";
            } else if (action === 'heat') {
                if (solidType === 'molecular') explanation = "Low M.P. Weak dispersion/dipole forces break easily.";
                if (solidType === 'ionic') explanation = "High M.P. Strong electrostatic forces.";
                if (solidType === 'metallic') explanation = "Medium-High M.P. Strong metallic bonds.";
                if (solidType === 'covalent') explanation = "Very High M.P. Rigid network covalent bonds.";
            }

            if (explanation) {
                // Stylish explanation box
                ctx.fillStyle = '#fff7ed';
                ctx.beginPath(); ctx.roundRect(logicalWidth / 2 - 280, 420, 560, 50, 8); ctx.fill();

                ctx.strokeStyle = '#fca5a5';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#b91c1c';
                ctx.textAlign = 'center';
                ctx.font = 'bold 15px sans-serif';
                ctx.fillText(explanation, logicalWidth / 2, 450);
            }

            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 5; c++) {
                    let x = startX + c * spacing;
                    let y = startY + r * spacing;
                    let color = '#94a3b8';
                    let radius = 20;
                    let label = '';

                    if (action === 'hammer') {
                        const impactTime = time % 2 > 1;
                        if (solidType === 'ionic') {
                            if (r === 1 && impactTime) x += 30;
                            if (r === 1 && time % 2 > 1.2) {
                                y += (time % 2 - 1.2) * 200;
                                x += (Math.random() - 0.5) * 50;
                            }
                        } else if (solidType === 'metallic') {
                            if (r === 1 && impactTime) x += (time % 2 - 1) * 30;
                        } else if (solidType === 'molecular') {
                            if (impactTime) {
                                x += Math.sin(time * 20 + r) * 5;
                                y += Math.cos(time * 20 + c) * 5;
                            }
                        } else if (solidType === 'covalent') {
                            if (impactTime) {
                                x += Math.sin(time * 50) * 2;
                            }
                        }
                    }

                    if (action === 'heat') {
                        const vib = solidType === 'covalent' ? 1 : (solidType === 'molecular' ? 5 : 2);
                        x += Math.sin(time * 20 + r * c) * vib;
                        y += Math.cos(time * 20 + r * c) * vib;

                        const meltStart = 3;
                        if (time % 5 > meltStart) {
                            if (solidType !== 'covalent') {
                                y += (time % 5 - meltStart) * (solidType === 'molecular' ? 80 : 40);
                                x += Math.sin(y * 0.1) * 20;
                            }
                        }
                    }

                    if (solidType === 'ionic') {
                        // 3D sphere gradient
                        const grad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, radius);
                        if ((r + c) % 2 === 0) {
                            grad.addColorStop(0, '#86efac'); // Light Green
                            grad.addColorStop(1, '#16a34a'); // Dark Green
                        } else {
                            grad.addColorStop(0, '#93c5fd'); // Light Blue
                            grad.addColorStop(1, '#2563eb'); // Dark Blue
                        }
                        color = (r + c) % 2 === 0 ? '#16a34a' : '#2563eb';
                        label = (r + c) % 2 === 0 ? '+' : '-';

                        if (c < 4 && action !== 'hammer') {
                            ctx.beginPath();
                            ctx.moveTo(x + radius, y);
                            ctx.lineTo(x + spacing - radius, y);
                            ctx.strokeStyle = '#bae6fd';
                            ctx.lineWidth = 3;
                            ctx.stroke();
                        }

                        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();

                    } else if (solidType === 'metallic') {
                        const grad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, radius);
                        grad.addColorStop(0, '#fde68a');
                        grad.addColorStop(1, '#d97706');
                        label = '+';

                        // Electron sea glow
                        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
                        ctx.beginPath();
                        ctx.arc(x, y, 40, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();

                    } else if (solidType === 'molecular') {
                        label = 'I₂';
                        radius = 22;

                        if (c < 4) {
                            ctx.beginPath();
                            ctx.setLineDash([4, 4]);
                            ctx.moveTo(x + radius, y);
                            ctx.lineTo(x + spacing - radius, y);
                            ctx.strokeStyle = '#cbd5e1';
                            ctx.lineWidth = 2;
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }

                        // Draw iodine molecule (diatomic)
                        ctx.fillStyle = '#a855f7'; // Purple
                        ctx.beginPath(); ctx.arc(x - 8, y, radius * 0.6, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + 8, y, radius * 0.6, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#3b0764'; // Dark border outline
                        ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.arc(x - 8, y, radius * 0.6, 0, Math.PI * 2); ctx.stroke();
                        ctx.beginPath(); ctx.arc(x + 8, y, radius * 0.6, 0, Math.PI * 2); ctx.stroke();

                    } else if (solidType === 'covalent') {
                        const grad = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, radius);
                        grad.addColorStop(0, '#64748b');
                        grad.addColorStop(1, '#1e293b');
                        label = 'C';
                        radius = 16;

                        if (c < 4) {
                            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + spacing, y); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 5; ctx.stroke();
                        }
                        if (r < 3) {
                            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + spacing); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 5; ctx.stroke();
                        }

                        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
                    }

                    ctx.fillStyle = 'white';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(label, x, y);
                }
            }

            if (action === 'battery') {
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 4;
                ctx.strokeRect(startX - 20, startY - 20, 5 * spacing, 4 * spacing);

                ctx.beginPath();
                ctx.arc(startX + 2.5 * spacing, startY - 60, 20, 0, Math.PI * 2);
                const isConducting = solidType === 'metallic';
                ctx.fillStyle = isConducting ? '#fbbf24' : '#475569';
                if (isConducting) {
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = 20;
                }
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;

                if (isConducting) {
                    const eSize = 4;
                    const eCount = 10;
                    ctx.fillStyle = '#fbbf24';
                    for (let i = 0; i < eCount; i++) {
                        const p = ((time * 0.5) + i / eCount) % 1;
                        let ex = 0, ey = 0;
                        if (p < 0.3) { ex = startX - 20 + p / 0.3 * (5 * spacing); ey = startY - 20; }
                        else if (p < 0.5) { ex = startX - 20 + 5 * spacing; ey = startY - 20 + (p - 0.3) / 0.2 * (4 * spacing); }
                        else if (p < 0.8) { ex = startX - 20 + 5 * spacing - (p - 0.5) / 0.3 * (5 * spacing); ey = startY - 20 + 4 * spacing; }
                        else { ex = startX - 20; ey = startY - 20 + 4 * spacing - (p - 0.8) / 0.2 * (4 * spacing); }

                        ctx.beginPath(); ctx.arc(ex, ey, eSize, 0, Math.PI * 2); ctx.fill();
                    }
                }

                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'center';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(isConducting ? "CONDUCTOR" : "INSULATOR", startX + 2.5 * spacing, startY - 90);
            }

            if (action === 'hammer') {
                const hammerX = startX - 90 + Math.sin(time * 15) * 30; // Faster swing
                const hammerY = startY + 60;

                // Draw hammer handle
                ctx.fillStyle = '#78350f'; // brown
                ctx.fillRect(hammerX - 60, hammerY + 15, 60, 12);

                // Draw hammer head
                ctx.fillStyle = '#64748b'; // slate grey
                ctx.beginPath(); ctx.roundRect(hammerX, hammerY, 50, 40, 5); ctx.fill();

                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("STRESS", hammerX + 25, hammerY + 25);
            }

            ctx.restore();
            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [solidType, action]);

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 overflow-hidden rounded-2xl border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 touch-none" />
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full w-full">
            <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-2 rounded-t-xl shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm bg-indigo-600 text-white w-full justify-center shadow-md">
                    <Layers size={16} /> Classification of Solids
                </div>
            </div>

            <div className="p-4 flex flex-col gap-4 w-full flex-1 overflow-y-auto max-h-[35vh] lg:max-h-[350px]">
                <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase">Select Solid Type</label>
                    <select
                        value={solidType}
                        onChange={(e) => { setSolidType(e.target.value as any); setAction('none'); }}
                        className="w-full p-3 border border-slate-200 shadow-sm rounded-xl font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value="ionic">Ionic Solid (NaCl)</option>
                        <option value="metallic">Metallic Solid (Cu)</option>
                        <option value="molecular">Molecular Solid (I₂)</option>
                        <option value="covalent">Covalent Network (Diamond)</option>
                    </select>
                    <label className="text-xs font-bold text-slate-500 uppercase mt-4 block">Test Properties</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setAction('hammer')} className={`p-2 flex flex-col items-center gap-1 rounded border shadow-sm transition-colors ${action === 'hammer' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Hammer size={18} /> Stress</button>
                        <button onClick={() => setAction('heat')} className={`p-2 flex flex-col items-center gap-1 rounded border shadow-sm transition-colors ${action === 'heat' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Flame size={18} /> Heat</button>
                        <button onClick={() => setAction('battery')} className={`p-2 flex flex-col items-center gap-1 rounded border shadow-sm transition-colors ${action === 'battery' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}><Zap size={18} /> Electrify</button>
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

export default ClassificationOfSolidsLab;
