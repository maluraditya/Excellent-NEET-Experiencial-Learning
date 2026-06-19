import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Cuboid } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface Props {
    topic: any;
    onExit: () => void;
}

const UnitCellsLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | undefined>(undefined);

    const [cellType, setCellType] = useState<string>('cubic-scc');
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

            const midX = logicalWidth / 2;
            const midY = logicalHeight / 2;
            const size = 120;
            const rx = rotation.x;
            const ry = rotation.y;

            const crystalParams: Record<string, any> = {
                'cubic-scc': { sys: 'Cubic', p: {a: 1, b: 1, c: 1, alpha: 90, beta: 90, gamma: 90}, type: 'scc' },
                'cubic-bcc': { sys: 'Cubic', p: {a: 1, b: 1, c: 1, alpha: 90, beta: 90, gamma: 90}, type: 'bcc' },
                'cubic-fcc': { sys: 'Cubic', p: {a: 1, b: 1, c: 1, alpha: 90, beta: 90, gamma: 90}, type: 'fcc' },
                'tetragonal': { sys: 'Tetragonal', p: {a: 1, b: 1, c: 1.5, alpha: 90, beta: 90, gamma: 90}, type: 'scc' },
                'orthorhombic': { sys: 'Orthorhombic', p: {a: 1, b: 1.3, c: 1.6, alpha: 90, beta: 90, gamma: 90}, type: 'scc' },
                'hexagonal': { sys: 'Hexagonal', p: {a: 1, b: 1, c: 1.5, alpha: 90, beta: 90, gamma: 120}, type: 'scc' },
                'rhombohedral': { sys: 'Rhombohedral', p: {a: 1, b: 1, c: 1, alpha: 75, beta: 75, gamma: 75}, type: 'scc' },
                'monoclinic': { sys: 'Monoclinic', p: {a: 1, b: 1.3, c: 1.5, alpha: 90, beta: 105, gamma: 90}, type: 'scc' },
                'triclinic': { sys: 'Triclinic', p: {a: 1, b: 1.2, c: 1.4, alpha: 75, beta: 110, gamma: 85}, type: 'scc' },
            };

            const selected = crystalParams[cellType] || crystalParams['cubic-scc'];
            const { p, type } = selected;
            
            const toRad = Math.PI / 180;
            const aVec = { x: p.a, y: 0, z: 0 };
            const bVec = { x: p.b * Math.cos(p.gamma * toRad), y: p.b * Math.sin(p.gamma * toRad), z: 0 };
            
            const cv_x = p.c * Math.cos(p.beta * toRad);
            const cv_y = p.c * (Math.cos(p.alpha * toRad) - Math.cos(p.beta * toRad) * Math.cos(p.gamma * toRad)) / Math.sin(p.gamma * toRad);
            const cv_z2 = p.c * p.c - cv_x * cv_x - cv_y * cv_y;
            const cv_z = Math.sqrt(Math.max(0, cv_z2));
            const cVec = { x: cv_x, y: cv_y, z: cv_z };

            const basis = (i: number, j: number, k: number) => {
                const shiftX = -0.5 * (aVec.x + bVec.x + cVec.x);
                const shiftY = -0.5 * (aVec.y + bVec.y + cVec.y);
                const shiftZ = -0.5 * (aVec.z + bVec.z + cVec.z);
                return {
                    x: (i * aVec.x + j * bVec.x + k * cVec.x + shiftX) * size,
                    y: -(i * aVec.y + j * bVec.y + k * cVec.y + shiftY) * size, // Negative because canvas Y goes down
                    z: (i * aVec.z + j * bVec.z + k * cVec.z + shiftZ) * size
                };
            };

            const corners = [
                basis(0,0,0), basis(1,0,0), basis(1,1,0), basis(0,1,0),
                basis(0,0,1), basis(1,0,1), basis(1,1,1), basis(0,1,1)
            ];

            const project = (pt: {x: number, y: number, z: number}) => {
                let x1 = pt.x * Math.cos(rx) - pt.z * Math.sin(rx);
                let z1 = pt.x * Math.sin(rx) + pt.z * Math.cos(rx);
                let y1 = pt.y * Math.cos(ry) - z1 * Math.sin(ry);
                let z2 = pt.y * Math.sin(ry) + z1 * Math.cos(ry);
                const scale = 500 / (500 - z2);
                return { x: midX + x1 * scale, y: midY + y1 * scale, scale, depth: z2 };
            };

            const projCorners = corners.map(c => project(c));

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
            corners.forEach(c => atoms.push({ ...c, type: 'corner', color: '#3b82f6' }));

            if (type === 'bcc') {
                atoms.push({ ...basis(0.5, 0.5, 0.5), type: 'body', color: '#ef4444' });
            }

            if (type === 'fcc') {
                atoms.push({ ...basis(0.5, 0.5, 0), type: 'face', color: '#22c55e' });
                atoms.push({ ...basis(0.5, 0.5, 1), type: 'face', color: '#22c55e' });
                atoms.push({ ...basis(0.5, 0, 0.5), type: 'face', color: '#22c55e' });
                atoms.push({ ...basis(0.5, 1, 0.5), type: 'face', color: '#22c55e' });
                atoms.push({ ...basis(0, 0.5, 0.5), type: 'face', color: '#22c55e' });
                atoms.push({ ...basis(1, 0.5, 0.5), type: 'face', color: '#22c55e' });
            }

            const atomsWithDepth = atoms.map(a => {
                let p = project(a);
                return { ...a, depth: p.depth, proj: p };
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
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${selected.sys} System`, 40, 70);

            let zValue = 1;
            if (type === 'bcc') zValue = 2;
            if (type === 'fcc') zValue = 4;
            
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(`Atoms per unit cell (Z) = ${zValue}`, 40, 95);

            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = '#4f46e5';
            
            const printParams = (p: any) => {
                const a_print = p.a === p.b && p.b === p.c ? "a=b=c" : p.a === p.b ? "a=b≠c" : "a≠b≠c";
                const ang_print = p.alpha === 90 && p.beta === 90 && p.gamma === 90 ? "α=β=γ=90°" : 
                    p.alpha === 90 && p.beta === 90 && p.gamma === 120 ? "α=β=90°, γ=120°" : 
                    p.alpha === p.beta && p.beta === p.gamma ? "α=β=γ≠90°" :
                    p.alpha === 90 && p.gamma === 90 ? "α=γ=90°, β≠90°" : "α≠β≠γ≠90°";
                return { dist: a_print, ang: ang_print };
            };
            const formats = printParams(p);
            ctx.fillText(formats.dist, 40, 115);
            ctx.fillText(formats.ang, 40, 135);

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
                            <label className="text-sm font-bold text-slate-600 uppercase">Cubic Variations</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setCellType('cubic-scc')} className={`py-2 px-2 rounded-lg font-bold text-sm transition-all border-2 ${cellType === 'cubic-scc' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>SCC</button>
                                <button onClick={() => setCellType('cubic-bcc')} className={`py-2 px-2 rounded-lg font-bold text-sm transition-all border-2 ${cellType === 'cubic-bcc' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>BCC</button>
                                <button onClick={() => setCellType('cubic-fcc')} className={`py-2 px-2 rounded-lg font-bold text-sm transition-all border-2 ${cellType === 'cubic-fcc' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>FCC</button>
                            </div>

                            <label className="text-sm font-bold text-slate-600 uppercase mt-4 block">Other Crystal Systems</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['tetragonal', 'orthorhombic', 'hexagonal', 'rhombohedral', 'monoclinic', 'triclinic'].map((t) => (
                                    <button key={t} onClick={() => setCellType(t)} className={`py-2 px-2 rounded-lg font-bold text-sm transition-all border-2 capitalize ${cellType === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                            
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer mt-6 p-4 bg-slate-100 rounded-xl">
                                <input type="checkbox" checked={showSlicer} onChange={(e) => setShowSlicer(e.target.checked)} className="rounded w-4 h-4 accent-indigo-600" />
                                Visualize Sliced Atoms (1/8 corner, 1/2 face)
                            </label>
                            <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border mt-2 leading-relaxed">
                                Explore the 7 crystal systems defined by variations in edge lengths (a,b,c) and angles (α,β,γ). This perfectly matches the 14 Bravais lattices taught in NCERT.
                            </p>
                        </div>
                    </div>
                </div>
            }
        />
    );
};

export default UnitCellsLab;
