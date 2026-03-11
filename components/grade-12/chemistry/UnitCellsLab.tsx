import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Cuboid } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface Props {
    topic: any;
    onExit: () => void;
}

const UnitCellsLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();

    const [cellType, setCellType] = useState<'scc' | 'bcc' | 'fcc'>('scc');
    const [showSlicer, setShowSlicer] = useState(false);
    const [rotation, setRotation] = useState({ x: 0.5, y: 0.5 });

    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        setRotation(prev => ({ x: prev.x + dx * 0.01, y: prev.y + dy * 0.01 }));
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => { isDragging.current = false; };

    const handleReset = useCallback(() => {
        setRotation({ x: 0.5, y: 0.5 });
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

            const cx = logicalWidth / 2;
            const cy = logicalHeight / 2;
            const size = 150;
            const rx = rotation.x;
            const ry = rotation.y;

            const project = (x: number, y: number, z: number) => {
                let x1 = x * Math.cos(rx) - z * Math.sin(rx);
                let z1 = x * Math.sin(rx) + z * Math.cos(rx);
                let y1 = y * Math.cos(ry) - z1 * Math.sin(ry);
                const scale = 500 / (500 - (y * Math.sin(ry) + z1 * Math.cos(ry)));
                return { x: cx + x1 * scale, y: cy + y1 * scale, scale };
            };

            const corners = [
                [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
            ];
            const projCorners = corners.map(c => project(c[0] * size / 2, c[1] * size / 2, c[2] * size / 2));

            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            const edges = [
                [0, 1], [1, 2], [2, 3], [3, 0],
                [4, 5], [5, 6], [6, 7], [7, 4],
                [0, 4], [1, 5], [2, 6], [3, 7]
            ];
            edges.forEach(e => {
                ctx.beginPath();
                ctx.moveTo(projCorners[e[0]].x, projCorners[e[0]].y);
                ctx.lineTo(projCorners[e[1]].x, projCorners[e[1]].y);
                ctx.stroke();
            });

            const atoms: { x: number, y: number, z: number, type: 'corner' | 'face' | 'body', color: string }[] = [];
            corners.forEach(c => atoms.push({ x: c[0] * size / 2, y: c[1] * size / 2, z: c[2] * size / 2, type: 'corner', color: '#3b82f6' }));

            if (cellType === 'bcc') {
                atoms.push({ x: 0, y: 0, z: 0, type: 'body', color: '#ef4444' });
            }

            if (cellType === 'fcc') {
                const faces = [
                    [0, 0, -1], [0, 0, 1], [0, -1, 0], [0, 1, 0], [-1, 0, 0], [1, 0, 0]
                ];
                faces.forEach(f => atoms.push({ x: f[0] * size / 2, y: f[1] * size / 2, z: f[2] * size / 2, type: 'face', color: '#22c55e' }));
            }

            const atomsWithDepth = atoms.map(a => {
                let x1 = a.x * Math.cos(rx) - a.z * Math.sin(rx);
                let z1 = a.x * Math.sin(rx) + a.z * Math.cos(rx);
                let z2 = a.y * Math.sin(ry) + z1 * Math.cos(ry);
                return { ...a, depth: z2, proj: project(a.x, a.y, a.z) };
            });
            atomsWithDepth.sort((a, b) => a.depth - b.depth);

            atomsWithDepth.forEach(a => {
                ctx.beginPath();
                let radius = 25;

                if (showSlicer) {
                    if (a.type === 'corner') {
                        ctx.arc(a.proj.x, a.proj.y, radius, 0, Math.PI / 2);
                        ctx.lineTo(a.proj.x, a.proj.y);
                    } else if (a.type === 'face') {
                        ctx.arc(a.proj.x, a.proj.y, radius, 0, Math.PI);
                    } else {
                        ctx.arc(a.proj.x, a.proj.y, radius, 0, Math.PI * 2);
                    }
                } else {
                    ctx.arc(a.proj.x, a.proj.y, radius * a.proj.scale, 0, Math.PI * 2);
                }

                // Enhanced 3D lighting gradient
                const gradRadius = showSlicer ? Math.max(radius, 1) : radius * a.proj.scale;
                const grad = ctx.createRadialGradient(
                    a.proj.x - gradRadius / 3,
                    a.proj.y - gradRadius / 3,
                    gradRadius / 8,
                    a.proj.x,
                    a.proj.y,
                    gradRadius
                );
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.4, a.color);

                // Deepen shadows based on depth
                const shadowStrength = Math.min(Math.max((a.depth + size / 2) / size, 0), 1);
                grad.addColorStop(1, `rgba(0,0,0,${0.3 + shadowStrength * 0.5})`);

                ctx.fillStyle = grad;
                ctx.fill();
                ctx.strokeStyle = showSlicer ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.3)';
                ctx.lineWidth = showSlicer ? 1.5 : 1;
                ctx.stroke();
            });

            // Info Box
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.beginPath(); ctx.roundRect(20, 35, 300, 110, 8); ctx.fill();

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.shadowColor = 'rgba(0,0,0,0.05)';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'left';
            const z = cellType === 'fcc' ? 4 : cellType === 'bcc' ? 2 : 1;
            ctx.fillText(`Total Atoms (Z): ${z}`, 40, 70);

            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#64748b';
            if (cellType === 'scc') ctx.fillText("8 Corners × 1/8 = 1", 40, 100);
            if (cellType === 'bcc') ctx.fillText("8 Corners × 1/8 + 1 Body = 2", 40, 100);
            if (cellType === 'fcc') {
                ctx.fillText("8 Corners × 1/8 = 1", 40, 95);
                ctx.fillText("6 Faces × 1/2 = 3", 40, 115);
            }

            ctx.restore();
            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [cellType, showSlicer, rotation]);

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={
                <div className="w-full h-full relative bg-slate-50 overflow-hidden rounded-2xl border border-slate-300 shadow-inner flex flex-col cursor-move" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                    <canvas ref={canvasRef} className="absolute inset-0 touch-none w-full h-full" />
                    <div className="absolute bottom-4 left-0 right-0 pointer-events-none flex justify-center">
                        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm px-4 py-2 rounded-xl text-slate-700 font-bold text-sm flex gap-2 items-center">
                            <RotateCcw size={16} className="text-indigo-500" />
                            Drag to rotate 3D Cell
                        </div>
                    </div>
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
                            <Cuboid size={16} /> Unit Cells & Atomic Calculation
                        </div>
                    </div>
                    <div className="p-4 flex flex-col gap-4 w-full flex-1 overflow-y-auto max-h-[35vh] lg:max-h-[350px]">
                        <div className="space-y-4">
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {['scc', 'bcc', 'fcc'].map(t => (
                                    <button key={t} onClick={() => setCellType(t as any)} className={`flex-1 py-2 px-2 rounded font-bold text-sm transition-all ${cellType === t ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                        {t.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer mt-4">
                                <input type="checkbox" checked={showSlicer} onChange={(e) => setShowSlicer(e.target.checked)} className="rounded w-4 h-4 accent-indigo-600" />
                                Visualize Sliced Atoms (1/8, 1/2)
                            </label>
                            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded border mt-4 leading-relaxed">
                                {cellType === 'scc' && "Simple Cubic: Atoms only at the 8 corners. Effective atoms per unit cell = 1."}
                                {cellType === 'bcc' && "Body Centered Cubic: Atoms at 8 corners + 1 in exact center. Effective atoms per unit cell = 2."}
                                {cellType === 'fcc' && "Face Centered Cubic: Atoms at 8 corners + 1 in center of every 6 faces. Effective atoms per unit cell = 4."}
                            </p>
                        </div>
                    </div>
                </div>
            }
        />
    );
};

export default UnitCellsLab;
