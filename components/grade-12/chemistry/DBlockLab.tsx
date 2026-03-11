import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Palette, Magnet, Atom } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface DBlockLabProps {
    topic: any;
    onExit: () => void;
}

const IONS: Record<string, { d: number, color: string, absorbed: string, absorbedWavelength: string }> = {
    'Sc3+': { d: 0, color: '#ffffff', absorbed: 'None', absorbedWavelength: '' }, // Colorless
    'Ti3+': { d: 1, color: '#a78bfa', absorbed: '#22c55e', absorbedWavelength: '498 nm (Blue-Green)' }, // Violet
    'V3+': { d: 2, color: '#22c55e', absorbed: '#dc2626', absorbedWavelength: 'Red' }, // Green
    'Cr3+': { d: 3, color: '#a855f7', absorbed: '#eab308', absorbedWavelength: 'Yellow' }, // Violet
    'Mn3+': { d: 4, color: '#ef4444', absorbed: '#3b82f6', absorbedWavelength: 'Blue' }, // Violet/Red
    'Mn2+': { d: 5, color: '#fbcfe8', absorbed: 'None', absorbedWavelength: 'Pale Pink (Weak)' }, // Pale Pink
    'Fe2+': { d: 6, color: '#22c55e', absorbed: '#dc2626', absorbedWavelength: 'Red' }, // Green
    'Co2+': { d: 7, color: '#ec4899', absorbed: '#3b82f6', absorbedWavelength: 'Blue' }, // Pink
    'Ni2+': { d: 8, color: '#22c55e', absorbed: '#dc2626', absorbedWavelength: 'Red' }, // Green
    'Cu2+': { d: 9, color: '#3b82f6', absorbed: '#f59e0b', absorbedWavelength: 'Orange' }, // Blue
    'Zn2+': { d: 10, color: '#ffffff', absorbed: 'None', absorbedWavelength: '' }, // Colorless
};

const DBlockLab: React.FC<DBlockLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();

    // Extracted state from App.tsx
    const [selectedIon, setSelectedIon] = useState<string>('Ti3+');
    const ionData = IONS[selectedIon] || IONS['Ti3+'];

    // Animation State for Electron Jump
    const jumpProgress = useRef(0);
    const isJumping = useRef(false);

    // Trigger jump occasionally
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isJumping.current && ionData.d > 0 && ionData.d < 10) {
                isJumping.current = true;
                jumpProgress.current = 0;
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [ionData]);

    const handleReset = useCallback(() => {
        setSelectedIon('Ti3+');
        isJumping.current = false;
        jumpProgress.current = 0;
    }, []);

    // ─── Calculations ───
    const unpairedElectrons = useCallback(() => {
        const d = ionData.d;
        if (d <= 3) return d;
        if (d <= 5) return d;
        // High Spin Complex Assumption (Weak Field Ligand H2O)
        if (d === 6) return 4;
        if (d === 7) return 3;
        if (d === 8) return 2;
        if (d === 9) return 1;
        return 0;
    }, [ionData.d]);

    const magneticMoment = useCallback(() => {
        const n = unpairedElectrons();
        return Math.sqrt(n * (n + 2)).toFixed(2);
    }, [unpairedElectrons]);

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

            // --- 1. TITLE & INFO ---
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Crystal Field Splitting (Octahedral): [M(H₂O)₆]ⁿ⁺`, 30, 40);

            // --- 2. ENERGY DIAGRAM ---
            const groundY = 380; // t2g level
            const excitedY = 180; // eg level

            // Draw Axis
            ctx.beginPath();
            ctx.moveTo(80, 420);
            ctx.lineTo(80, 100);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Arrow head
            ctx.beginPath(); ctx.moveTo(75, 110); ctx.lineTo(80, 100); ctx.lineTo(85, 110); ctx.stroke();

            ctx.save();
            ctx.translate(50, 260);
            ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText("Energy", 0, 0);
            ctx.restore();

            // Draw Levels
            ctx.lineWidth = 4; // Thicker orbital lines
            ctx.lineCap = 'round';

            // t2g (Lower, 3 orbitals)
            const orbW = 45;
            const gap = 20;
            const t2gX = 140;

            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(t2gX + i * (orbW + gap), groundY);
                ctx.lineTo(t2gX + i * (orbW + gap) + orbW, groundY);
                ctx.strokeStyle = '#3b82f6'; // Blue
                ctx.stroke();

                // Add soft glow to empty orbitals
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
            ctx.textAlign = 'center';
            ctx.fillStyle = '#3b82f6';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText("t₂g (Lower Energy)", t2gX + 1.5 * (orbW + gap) - gap / 2, groundY + 35);

            // eg (Upper, 2 orbitals)
            const egX = 175;
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.moveTo(egX + i * (orbW + gap), excitedY);
                ctx.lineTo(egX + i * (orbW + gap) + orbW, excitedY);
                ctx.strokeStyle = '#ef4444'; // Red
                ctx.stroke();

                // Add soft glow to empty orbitals
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(239, 68, 68, 0.3)';
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
            ctx.fillStyle = '#ef4444';
            ctx.fillText("e₉ (Higher Energy)", egX + 1 * (orbW + gap) - gap, excitedY - 20);

            // Splitting Energy Delta_o
            ctx.beginPath();
            ctx.moveTo(350, groundY);
            ctx.lineTo(350, excitedY);
            ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#64748b';
            ctx.fillText("Δₒ", 370, (groundY + excitedY) / 2 + 5);

            // --- 3. ELECTRON POPULATION ---
            const electrons = ionData.d;

            const drawElectron = (x: number, y: number, spin: 'up' | 'down', isAnimated: boolean = false) => {
                const dir = spin === 'up' ? -1 : 1;
                const offset = 22.5; // Center on orbital (45/2)
                ctx.beginPath();
                ctx.moveTo(x + offset, y);
                ctx.lineTo(x + offset, y + (25 * dir));
                ctx.moveTo(x + offset, y + (25 * dir));
                ctx.lineTo(x + offset - 6, y + (18 * dir));

                if (isAnimated) {
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#fcd34d';
                } else {
                    ctx.strokeStyle = '#0f172a';
                    ctx.lineWidth = 2.5;
                }

                ctx.stroke();
                ctx.shadowBlur = 0;
            };

            const t2gPos = [0, 1, 2].map(i => ({ x: t2gX + i * (orbW + gap), y: groundY }));
            const egPos = [0, 1].map(i => ({ x: egX + i * (orbW + gap), y: excitedY }));

            const electronPositions: { x: number, y: number, spin: 'up' | 'down', id: number }[] = [];

            for (let i = 0; i < electrons; i++) {
                if (i < 3) electronPositions.push({ ...t2gPos[i], spin: 'up', id: i });
                else if (i < 5) electronPositions.push({ ...egPos[i - 3], spin: 'up', id: i });
                else if (i < 8) electronPositions.push({ ...t2gPos[i - 5], spin: 'down', id: i });
                else electronPositions.push({ ...egPos[i - 8], spin: 'down', id: i });
            }

            // Animation Logic
            let jumpingElectronIndex = -1;
            let jumpY = 0;

            if (isJumping.current) {
                if (electrons > 0 && electrons < 10) {
                    jumpingElectronIndex = 0;
                    jumpProgress.current += 0.02;
                    if (jumpProgress.current >= 1) {
                        if (jumpProgress.current > 1.5) {
                            isJumping.current = false;
                            jumpProgress.current = 0;
                        }
                    }
                    if (jumpProgress.current <= 1) {
                        jumpY = groundY + (excitedY - groundY) * Math.sin(jumpProgress.current * Math.PI / 2);
                    } else {
                        jumpY = excitedY;
                    }
                } else {
                    isJumping.current = false;
                }
            }

            // Draw Electrons
            electronPositions.forEach((e, idx) => {
                if (idx === jumpingElectronIndex && isJumping.current) {
                    drawElectron(e.x, jumpY, e.spin, true);
                    // Draw Photon
                    if (jumpProgress.current < 0.5) {
                        ctx.beginPath();
                        const waveY = (groundY + excitedY) / 2;
                        ctx.strokeStyle = ionData.absorbed !== 'None' ? ionData.absorbed : 'rgba(156, 163, 175, 0.5)';
                        ctx.lineWidth = 3;
                        ctx.moveTo(e.x - 40, waveY);
                        for (let k = 0; k < 20; k++) {
                            ctx.lineTo(e.x - 40 + k * 3, waveY + Math.sin(k * 1.5) * 5);
                        }
                        ctx.stroke();
                        ctx.fillStyle = ctx.strokeStyle;
                        ctx.font = 'bold 12px sans-serif';
                        ctx.fillText("hv", e.x - 45, waveY - 10);
                    }
                } else {
                    drawElectron(e.x, e.y, e.spin);
                }
            });


            // --- 4. COLOR SWATCHES ---
            const centerX = 600;
            const centerY = 180;
            const radius = 70;

            ctx.fillStyle = ionData.color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Shine
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(centerX - 25, centerY - 25, radius / 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("Observed Color", centerX, centerY + radius + 30);
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(selectedIon === 'Sc3+' || selectedIon === 'Zn2+' ? "Colorless" : "Complementary (d-d transition)", centerX, centerY + radius + 45);

            // --- 5. MAGNETISM DISPLAY ---
            const magX = 480;
            const magY = 340;
            const boxW = 280;
            const boxH = 130;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(magX, magY, boxW, boxH);
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(magX, magY, boxW, boxH);

            const n = unpairedElectrons();
            const mu = magneticMoment();

            ctx.textAlign = 'left';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText("MAGNETIC PROPERTY", magX + 20, magY + 25);

            if (n > 0) {
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 20px sans-serif';
                ctx.fillText("PARAMAGNETIC", magX + 20, magY + 60);
            } else {
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 20px sans-serif';
                ctx.fillText("DIAMAGNETIC", magX + 20, magY + 60);
            }

            ctx.font = '15px sans-serif';
            ctx.fillStyle = '#475569';
            ctx.fillText(`Unpaired e⁻ (n): ${n}`, magX + 20, magY + 95);
            ctx.fillText(`Magnetic Moment (μ): ${mu} BM`, magX + 20, magY + 115);

            ctx.restore();
            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [ionData, selectedIon, unpairedElectrons, magneticMoment]);

    // ─── JSX ───
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
            <div className="flex bg-slate-50 border-b border-slate-200 p-4 gap-2 rounded-t-xl shrink-0">
                <h3 className="font-display font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Atom className="text-violet-500" size={20} />
                    Transition Metal Ion
                </h3>
            </div>

            <div className="p-4 flex flex-col gap-4 w-full flex-1 overflow-y-auto max-h-[35vh] lg:max-h-[350px]">
                <div className="text-center p-3 bg-violet-50 border border-violet-100 rounded-lg text-violet-900 text-sm">
                    Transition metals exhibit color due to <strong>d-d transitions</strong> (electrons jump from t₂g to e₉ absorbing specific visible light) and paramagnetism due to <strong>unpaired electrons</strong>.
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase">Select Ion</label>
                        <select
                            value={selectedIon}
                            onChange={(e) => setSelectedIon(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white shadow-sm focus:border-violet-500 focus:ring-violet-500 font-bold text-slate-800 appearance-none outline-none cursor-pointer"
                        >
                            {Object.keys(IONS).map(ion => (
                                <option key={ion} value={ion}>{ion} (3d{IONS[ion].d})</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400">Assuming high-spin octahedral complex [M(H₂O)₆]ⁿ⁺</p>
                    </div>

                    <div className="bg-slate-50 p-4 flex flex-col gap-3 rounded-xl border border-slate-200">
                        <div className="flex items-start gap-3">
                            <Palette size={20} className="text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Color Origin</h4>
                                <p className="text-xs text-slate-600 mt-1">
                                    {ionData.d === 0 ? "No d-electrons. Cannot undergo d-d transitions (Colorless)." :
                                        ionData.d === 10 ? "Completely filled d-orbitals. No empty space for electron to jump (Colorless)." :
                                            `Absorbs ${ionData.absorbedWavelength} to jump the Δₒ gap. Transmits complementary color.`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 flex flex-col gap-3 rounded-xl border border-slate-200">
                        <div className="flex items-start gap-3">
                            <Magnet size={20} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">Magnetic Properties</h4>
                                <p className="text-xs text-slate-600 mt-1 mb-2">
                                    Determined by the spin-only magnetic moment formula: <span className="font-mono bg-white border px-1 rounded">μ = √(n(n+2))</span>
                                </p>
                                <p className="text-xs text-slate-600">
                                    Because {selectedIon} has {unpairedElectrons()} unpaired electron(s), it is {unpairedElectrons() > 0 ? "Paramagnetic (attracted to fields)" : "Diamagnetic (weakly repelled)"}.
                                </p>
                            </div>
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

export default DBlockLab;
