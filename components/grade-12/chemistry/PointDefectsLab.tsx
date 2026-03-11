import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Grid3X3 } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface Props {
    topic: any;
    onExit: () => void;
}

const PointDefectsLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();

    const [defectMode, setDefectMode] = useState<'schottky' | 'frenkel'>('schottky');
    const gridRef = useRef<Array<{ id: number, type: 'cation' | 'anion', x: number, y: number, originalX: number, originalY: number, removed: boolean, interstitial: boolean }>>([]);
    const [density, setDensity] = useState(100);

    const initializeDefects = useCallback(() => {
        const grid = [];
        const rows = 6;
        const cols = 8;
        const spacing = 60;
        const startX = 180;
        const startY = 100;
        let id = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                grid.push({
                    id: id++,
                    type: (r + c) % 2 === 0 ? 'cation' : 'anion' as const,
                    x: startX + c * spacing,
                    y: startY + r * spacing,
                    originalX: startX + c * spacing,
                    originalY: startY + r * spacing,
                    removed: false,
                    interstitial: false
                });
            }
        }
        gridRef.current = grid;
        setDensity(100);
    }, []);

    useEffect(() => {
        initializeDefects();
    }, [defectMode, initializeDefects]);

    const handleReset = useCallback(() => {
        initializeDefects();
    }, [initializeDefects]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        const logicalWidth = 800;
        const logicalHeight = 500;
        const scaleX = displayWidth / logicalWidth;
        const scaleY = displayHeight / logicalHeight;
        const drawScale = Math.min(scaleX, scaleY);

        const offsetX = (displayWidth - logicalWidth * drawScale) / 2;
        const offsetY = (displayHeight - logicalHeight * drawScale) / 2;

        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const x = (clickX - offsetX) / drawScale;
        const y = (clickY - offsetY) / drawScale;

        const clickedIon = gridRef.current.find(i => Math.hypot(i.x - x, i.y - y) < 30 && !i.removed);

        if (clickedIon) {
            if (defectMode === 'schottky') {
                clickedIon.removed = true;
                const neighbor = gridRef.current.find(i => !i.removed && i.type !== clickedIon.type && Math.hypot(i.x - clickedIon.x, i.y - clickedIon.y) < 70);
                if (neighbor) neighbor.removed = true;
            } else {
                if (clickedIon.type === 'cation' && !clickedIon.interstitial) {
                    clickedIon.x += 30;
                    clickedIon.y += 30;
                    clickedIon.interstitial = true;
                }
            }
        }
    };

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
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);

            // Rich radial gradient background
            const bgGrad = ctx.createRadialGradient(logicalWidth / 2, logicalHeight / 2, 0, logicalWidth / 2, logicalHeight / 2, logicalWidth);
            bgGrad.addColorStop(0, '#ffffff');
            bgGrad.addColorStop(1, '#f1f5f9');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);

            // Soft border
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, logicalWidth, logicalHeight);

            const grid = gridRef.current;

            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`Defect Type: ${defectMode === 'schottky' ? 'Schottky (Vacancy)' : 'Frenkel (Dislocation)'}`, 30, 40);

            const totalOriginal = 48;
            let currentCount = 0;
            grid.forEach(i => { if (!i.removed && !i.interstitial) currentCount++; });

            grid.forEach(ion => {
                if (ion.removed) {
                    ctx.beginPath();
                    ctx.arc(ion.originalX, ion.originalY, 20, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.05)';
                    ctx.fill();
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    return;
                }

                ctx.beginPath();
                let x = ion.x;
                let y = ion.y;

                ctx.arc(x, y, ion.type === 'cation' ? 18 : 28, 0, Math.PI * 2);

                const radius = ion.type === 'cation' ? 18 : 28;
                const grad = ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 5, x, y, radius);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, ion.type === 'cation' ? '#3b82f6' : '#22c55e');
                grad.addColorStop(1, ion.type === 'cation' ? '#1e3a8a' : '#14532d'); // Darker shadows
                ctx.fillStyle = grad;
                ctx.fill();

                // Subtle border for pop
                ctx.strokeStyle = ion.type === 'cation' ? '#1d4ed8' : '#16a34a';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = 'white';
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ion.type === 'cation' ? '+' : '-', x, y);

                if (ion.interstitial) {
                    ctx.beginPath();
                    ctx.arc(ion.originalX, ion.originalY, 18, 0, Math.PI * 2);
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    ctx.beginPath();
                    ctx.moveTo(ion.originalX + 15, ion.originalY + 15);
                    ctx.lineTo(x - 15, y - 15);
                    ctx.strokeStyle = '#94a3b8';
                    ctx.stroke();
                }
            });

            // Density Meter Background
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath(); ctx.roundRect(logicalWidth - 110, 100, 70, 300, 8); ctx.fill();

            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText("Density", logicalWidth - 75, 80);

            const ratio = defectMode === 'schottky' ? (currentCount / totalOriginal) : 1;
            const densityH = ratio * 300;

            // Neon glow for density bar
            ctx.shadowBlur = 10;
            ctx.shadowColor = defectMode === 'schottky' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)';
            ctx.fillStyle = defectMode === 'schottky' ? '#ef4444' : '#22c55e';
            ctx.beginPath(); ctx.roundRect(logicalWidth - 110, 100 + (300 - densityH), 70, densityH, 8); ctx.fill();
            ctx.shadowBlur = 0;

            // Display percentage
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`${(ratio * 100).toFixed(1)}%`, logicalWidth - 75, 100 + (300 - densityH) + 20);

            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("Click ions to create defects", logicalWidth / 2, logicalHeight - 40);

            ctx.restore();
            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [defectMode]);

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={
                <div className="w-full h-full relative bg-slate-50 overflow-hidden rounded-2xl border border-slate-300 shadow-inner flex flex-col cursor-pointer" onMouseDown={handleMouseDown}>
                    <canvas ref={canvasRef} className="absolute inset-0 touch-none w-full h-full" />
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 pointer-events-auto">
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            }
            ControlsComponent={
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full w-full">
                    <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-2 rounded-t-xl shrink-0">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm bg-indigo-600 text-white w-full justify-center shadow-md">
                            <Grid3X3 size={16} /> Point Defects in Solids
                        </div>
                    </div>
                    <div className="p-4 flex flex-col gap-4 w-full flex-1 overflow-y-auto max-h-[35vh] lg:max-h-[350px]">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase">Select Defect Mode</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button onClick={() => setDefectMode('schottky')} className={`flex-1 py-2 px-2 rounded font-bold text-sm transition-all ${defectMode === 'schottky' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Schottky</button>
                                <button onClick={() => setDefectMode('frenkel')} className={`flex-1 py-2 px-2 rounded font-bold text-sm transition-all ${defectMode === 'frenkel' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>Frenkel</button>
                            </div>
                            <p className="text-xs text-slate-600 p-3 bg-slate-50 rounded border mt-4 leading-relaxed">
                                {defectMode === 'schottky' ? "Equal number of cations and anions are missing from lattice sites. Density decreases. Common in NaCl, KCl." : "Smaller ion (usually cation) is dislocated to an interstitial site. Density remains same. Common in ZnS, AgCl."}
                            </p>
                        </div>
                    </div>
                </div>
            }
        />
    );
};

export default PointDefectsLab;
