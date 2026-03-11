import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, FlaskConical, Beaker, ShieldAlert, Target } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface HaloalkaneLabProps {
    topic: any;
    onExit: () => void;
}

const HaloalkaneLab: React.FC<HaloalkaneLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const startTime = useRef(Date.now());

    // Extracted state from App.tsx
    const [haloConfig, setHaloConfig] = useState<{ substrate: 'primary' | 'tertiary', mechanism: 'SN1' | 'SN2' }>({
        substrate: 'primary',
        mechanism: 'SN2'
    });

    const handleReset = useCallback(() => {
        setHaloConfig({ substrate: 'primary', mechanism: 'SN2' });
        startTime.current = Date.now();
    }, []);

    // ─── ResizeObserver ───
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const ro = new ResizeObserver(() => { });
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

            const t = (Date.now() - startTime.current) / 1000;
            const cycle = 6;
            const progress = (t % cycle) / cycle;

            const centerX = logicalWidth / 2;
            const centerY = logicalHeight / 2;

            // --- DRAW HELPERS ---
            const drawAtom = (x: number, y: number, r: number, color: string, label?: string) => {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Specular highlight
                ctx.beginPath();
                ctx.arc(x - r / 3, y - r / 3, r / 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fill();

                if (label) {
                    ctx.fillStyle = 'white';
                    ctx.font = `bold ${Math.max(12, r * 0.6)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(label, x, y);
                }
            };

            const drawBond = (x1: number, y1: number, x2: number, y2: number, thickness: number = 4) => {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';
                ctx.stroke();
            };

            const COLOR_C = '#475569';
            const COLOR_H = '#cbd5e1';
            const COLOR_X = '#22c55e'; // Leaving Group (Halogen - Green)
            const COLOR_NU = '#ef4444'; // Nucleophile (Red)

            // --- SCENARIO LOGIC ---
            if (haloConfig.mechanism === 'SN2') {
                let nuX = 0;
                let cX = centerX;
                let lgX = 0;
                let umbrellaInversion = 0;

                const isBlocked = haloConfig.substrate === 'tertiary';

                if (isBlocked) {
                    const approach = Math.min(progress * 2, 1);
                    const retreat = Math.max(0, progress * 2 - 1);
                    nuX = 100 + approach * 200 - retreat * 200;
                    lgX = centerX + 60;
                    umbrellaInversion = -1;

                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 24px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText("STERIC HINDRANCE! REACTION BLOCKED", centerX, 80);

                } else {
                    if (progress < 0.4) {
                        nuX = 100 + (progress / 0.4) * (centerX - 100 - 40);
                        lgX = centerX + 40;
                        umbrellaInversion = -1;
                    } else if (progress < 0.6) {
                        nuX = centerX - 40;
                        lgX = centerX + 40 + (progress - 0.4) * 50;
                        umbrellaInversion = -1 + ((progress - 0.4) / 0.2) * 2;
                    } else {
                        nuX = centerX - 40;
                        lgX = centerX + 50 + (progress - 0.6) * 300;
                        umbrellaInversion = 1;
                    }
                }

                const tilt = isBlocked ? 20 : (20 * -umbrellaInversion);

                // Bonds
                drawBond(cX, centerY, cX + tilt, centerY - 60);
                drawAtom(cX + tilt, centerY - 60, haloConfig.substrate === 'tertiary' ? 25 : 15, haloConfig.substrate === 'tertiary' ? COLOR_C : COLOR_H, haloConfig.substrate === 'tertiary' ? 'CH₃' : 'H');

                drawBond(cX, centerY, cX + tilt, centerY + 60);
                drawAtom(cX + tilt, centerY + 60, haloConfig.substrate === 'tertiary' ? 25 : 15, haloConfig.substrate === 'tertiary' ? COLOR_C : COLOR_H, haloConfig.substrate === 'tertiary' ? 'CH₃' : 'H');

                // C-Nu
                if (progress > 0.4 && !isBlocked) {
                    ctx.setLineDash([5, 5]);
                    drawBond(nuX, centerY, cX, centerY, 3);
                    ctx.setLineDash([]);
                }

                // C-LG
                if (progress < 0.8) {
                    if (progress > 0.4) ctx.setLineDash([5, 5]);
                    drawBond(cX, centerY, lgX, centerY, 3);
                    ctx.setLineDash([]);
                } else if (isBlocked) {
                    drawBond(cX, centerY, lgX, centerY, 4);
                }

                drawAtom(cX, centerY, 30, COLOR_C, "C");
                drawAtom(nuX, centerY, 25, COLOR_NU, "Nu⁻");
                drawAtom(lgX, centerY, 25, COLOR_X, "X");

                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 20px sans-serif';
                ctx.textAlign = 'left';
                let phaseText = "Phase 1: Nucleophile Approach";
                if (isBlocked) phaseText = "Steric Hindrance (Blocked)";
                else if (progress > 0.4 && progress < 0.6) phaseText = "Phase 2: Transition State (Pentacoordinate)";
                else if (progress >= 0.6) phaseText = "Phase 3: Inversion & Product";

                ctx.fillText(phaseText, 30, 40);

            } else {
                // SN1 ANIMATION
                const isUnstable = haloConfig.substrate === 'primary';

                let cX = centerX;
                let lgX = centerX + 40;
                let nuX = 50;

                let step1Progress = Math.min(progress * 2, 1);
                let step2Progress = Math.max(0, progress * 2 - 1);

                if (isUnstable && progress > 0.3) {
                    step1Progress = Math.max(0, 0.3 - (progress - 0.3));
                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 24px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText("PRIMARY CARBOCATION UNSTABLE!", centerX, 80);
                }

                lgX = centerX + 40 + step1Progress * 200;

                if (!isUnstable) {
                    nuX = 50 + step2Progress * (centerX - 50 - 40);
                }

                const tilt = 20 * (1 - step1Progress);

                drawBond(cX, centerY, cX - tilt, centerY - 60);
                drawAtom(cX - tilt, centerY - 60, haloConfig.substrate === 'tertiary' ? 25 : 15, haloConfig.substrate === 'tertiary' ? COLOR_C : COLOR_H, haloConfig.substrate === 'tertiary' ? 'CH₃' : 'H');

                drawBond(cX, centerY, cX - tilt, centerY + 60);
                drawAtom(cX - tilt, centerY + 60, haloConfig.substrate === 'tertiary' ? 25 : 15, haloConfig.substrate === 'tertiary' ? COLOR_C : COLOR_H, haloConfig.substrate === 'tertiary' ? 'CH₃' : 'H');

                if (step1Progress < 0.8) {
                    if (step1Progress > 0.1) ctx.setLineDash([5, 5]);
                    drawBond(cX, centerY, lgX, centerY, 3);
                    ctx.setLineDash([]);
                }

                if (step2Progress > 0.1 && !isUnstable) {
                    if (step2Progress < 0.9) ctx.setLineDash([5, 5]);
                    drawBond(nuX, centerY, cX, centerY, 3);
                    ctx.setLineDash([]);
                }

                if (step1Progress > 0.2 && step2Progress < 0.8 && !isUnstable) {
                    ctx.fillStyle = '#3b82f6';
                    ctx.font = 'bold 24px sans-serif';
                    ctx.fillText("+", cX + 22, centerY - 15);

                    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
                    ctx.beginPath();
                    ctx.ellipse(cX, centerY - 60, 20, 50, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(cX, centerY + 60, 20, 50, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // Empty p-orbital orbital outline
                    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.ellipse(cX, centerY - 60, 20, 50, 0, 0, Math.PI * 2); ctx.stroke();
                    ctx.beginPath(); ctx.ellipse(cX, centerY + 60, 20, 50, 0, 0, Math.PI * 2); ctx.stroke();
                }

                drawAtom(cX, centerY, 30, COLOR_C, "C");
                drawAtom(lgX, centerY, 25, COLOR_X, "X⁻");
                drawAtom(nuX, centerY, 25, COLOR_NU, "Nu⁻");

                if (!isUnstable) {
                    ctx.fillStyle = '#1e293b';
                    ctx.font = 'bold 20px sans-serif';
                    ctx.textAlign = 'left';
                    if (step1Progress < 1) ctx.fillText("Step 1: Leaving Group departs (Rate Determining - Slow)", 30, 40);
                    else ctx.fillText("Step 2: Nucleophilic Attack on Planar Carbocation (Fast)", 30, 40);
                }
            }

            ctx.restore();
            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [haloConfig]);

    // ─── JSX ───
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 overflow-hidden rounded-2xl border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 touch-none" />
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => startTime.current = Date.now()} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200" title="Replay Animation">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full w-full">
            <div className="flex bg-slate-50 border-b border-slate-200 p-4 gap-2 rounded-t-xl shrink-0">
                <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
                    <FlaskConical className="text-emerald-500" size={20} />
                    Reaction Mechanisms
                </h3>
            </div>

            <div className="p-4 flex flex-col gap-4 w-full flex-1 overflow-y-auto max-h-[35vh] lg:max-h-[350px]">
                <div className="text-center p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 text-sm">
                    Haloalkanes undergo Nucleophilic Substitution. The pathway (S<sub>N</sub>1 or S<sub>N</sub>2) depends heavily on the <strong>steric nature</strong> of the substrate.
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase">1. Select Mechanism</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setHaloConfig(p => ({ ...p, mechanism: 'SN1' })); startTime.current = Date.now(); }}
                                className={`p-3 rounded-lg font-bold text-sm border-2 transition-all ${haloConfig.mechanism === 'SN1' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                S<sub>N</sub>1 (Two-Step)
                            </button>
                            <button
                                onClick={() => { setHaloConfig(p => ({ ...p, mechanism: 'SN2' })); startTime.current = Date.now(); }}
                                className={`p-3 rounded-lg font-bold text-sm border-2 transition-all ${haloConfig.mechanism === 'SN2' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                S<sub>N</sub>2 (Concerted)
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase">2. Select Substrate</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setHaloConfig(p => ({ ...p, substrate: 'primary' })); startTime.current = Date.now(); }}
                                className={`p-3 flex flex-col items-center justify-center rounded-lg font-bold text-sm border-2 transition-all ${haloConfig.substrate === 'primary' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span>Primary (1°)</span>
                                <span className="text-[10px] font-normal opacity-75">Uncrowded</span>
                            </button>
                            <button
                                onClick={() => { setHaloConfig(p => ({ ...p, substrate: 'tertiary' })); startTime.current = Date.now(); }}
                                className={`p-3 flex flex-col items-center justify-center rounded-lg font-bold text-sm border-2 transition-all ${haloConfig.substrate === 'tertiary' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <span>Tertiary (3°)</span>
                                <span className="text-[10px] font-normal opacity-75">Crowded (Bulky)</span>
                            </button>
                        </div>
                    </div>

                    {/* Explanatory Box based on combination */}
                    <div className={`p-4 rounded-xl border-2 text-sm ${(haloConfig.mechanism === 'SN2' && haloConfig.substrate === 'primary') || (haloConfig.mechanism === 'SN1' && haloConfig.substrate === 'tertiary')
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                        {haloConfig.mechanism === 'SN2' && haloConfig.substrate === 'primary' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 font-bold"><Target size={16} /> Successful S<sub>N</sub>2</div>
                                <p>Primary substrates have little steric hindrance. The nucleophile can easily attack from the back, causing an <strong>inversion of configuration</strong> (Walden Inversion).</p>
                            </div>
                        )}
                        {haloConfig.mechanism === 'SN2' && haloConfig.substrate === 'tertiary' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 font-bold"><ShieldAlert size={16} /> Blocked S<sub>N</sub>2</div>
                                <p>Tertiary substrates have massive bulky methyl groups. This creates <strong>Steric Hindrance</strong>, physically blocking the nucleophile from attacking the backside.</p>
                            </div>
                        )}
                        {haloConfig.mechanism === 'SN1' && haloConfig.substrate === 'tertiary' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 font-bold"><Target size={16} /> Successful S<sub>N</sub>1</div>
                                <p>Tertiary carbocations are highly stable due to hyperconjugation and inductive effects (+I). The <strong>planar intermediate</strong> allows attack from either side, often leading to racemization.</p>
                            </div>
                        )}
                        {haloConfig.mechanism === 'SN1' && haloConfig.substrate === 'primary' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 font-bold"><ShieldAlert size={16} /> Unstable Intermediates</div>
                                <p>Primary carbocations are extremely unstable. They will not form readily, meaning S<sub>N</sub>1 is not a viable pathway for primary haloalkanes under normal conditions.</p>
                            </div>
                        )}
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

export default HaloalkaneLab;
