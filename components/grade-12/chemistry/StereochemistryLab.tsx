import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Box, Layers, Eye } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface StereochemistryLabProps {
    topic: any;
    onExit: () => void;
}

interface Point3D {
    x: number;
    y: number;
    z: number;
    color: string;
    radius: number;
    label?: string;
}

interface Bond {
    from: number;
    to: number;
    isChelate?: boolean;
}

const StereochemistryLab: React.FC<StereochemistryLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();

    // Extracted State
    const [isomerConfig, setIsomerConfig] = useState<{
        type: 'cis-trans-sq' | 'fac-mer' | 'optical',
        subType: 'A' | 'B',
        showMirror: boolean
    }>({
        type: 'cis-trans-sq',
        subType: 'A',
        showMirror: false
    });

    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    const handleReset = useCallback(() => {
        setIsomerConfig({
            type: 'cis-trans-sq',
            subType: 'A',
            showMirror: false
        });
        setRotation({ x: 0, y: 0 });
    }, []);

    // ─── ResizeObserver ───
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const ro = new ResizeObserver(() => {
            // Animation loop handles resize
        });
        ro.observe(parent);
        return () => ro.disconnect();
    }, []);

    // ─── Rendering Logic ───
    const generateMolecule = (type: string, sub: string): { atoms: Point3D[], bonds: Bond[] } => {
        const atoms: Point3D[] = [];
        const bonds: Bond[] = [];

        atoms.push({ x: 0, y: 0, z: 0, color: '#94a3b8', radius: 30, label: 'M' });

        const pos = [
            { x: 120, y: 0, z: 0 },   // 1 Right
            { x: -120, y: 0, z: 0 },  // 2 Left
            { x: 0, y: 120, z: 0 },   // 3 Up
            { x: 0, y: -120, z: 0 },  // 4 Down
            { x: 0, y: 0, z: 120 },   // 5 Front
            { x: 0, y: 0, z: -120 },  // 6 Back
        ];

        if (type === 'cis-trans-sq') {
            if (sub === 'A') { // Cis
                atoms.push({ ...pos[0], color: '#22c55e', radius: 20, label: 'Cl' });
                atoms.push({ ...pos[2], color: '#22c55e', radius: 20, label: 'Cl' });
                atoms.push({ ...pos[1], color: '#3b82f6', radius: 25, label: 'N' });
                atoms.push({ ...pos[3], color: '#3b82f6', radius: 25, label: 'N' });
            } else { // Trans
                atoms.push({ ...pos[0], color: '#22c55e', radius: 20, label: 'Cl' });
                atoms.push({ ...pos[1], color: '#22c55e', radius: 20, label: 'Cl' });
                atoms.push({ ...pos[2], color: '#3b82f6', radius: 25, label: 'N' });
                atoms.push({ ...pos[3], color: '#3b82f6', radius: 25, label: 'N' });
            }
            for (let i = 1; i <= 4; i++) bonds.push({ from: 0, to: i });
        } else if (type === 'fac-mer') {
            const colorA = '#f59e0b';
            const colorB = '#6366f1';
            if (sub === 'A') { // Fac
                atoms.push({ ...pos[0], color: colorA, radius: 20, label: 'a' });
                atoms.push({ ...pos[2], color: colorA, radius: 20, label: 'a' });
                atoms.push({ ...pos[4], color: colorA, radius: 20, label: 'a' });
                atoms.push({ ...pos[1], color: colorB, radius: 20, label: 'b' });
                atoms.push({ ...pos[3], color: colorB, radius: 20, label: 'b' });
                atoms.push({ ...pos[5], color: colorB, radius: 20, label: 'b' });
            } else { // Mer
                atoms.push({ ...pos[0], color: colorA, radius: 20, label: 'a' });
                atoms.push({ ...pos[1], color: colorA, radius: 20, label: 'a' });
                atoms.push({ ...pos[2], color: colorA, radius: 20, label: 'a' });
                atoms.push({ ...pos[3], color: colorB, radius: 20, label: 'b' });
                atoms.push({ ...pos[4], color: colorB, radius: 20, label: 'b' });
                atoms.push({ ...pos[5], color: colorB, radius: 20, label: 'b' });
            }
            for (let i = 1; i <= 6; i++) bonds.push({ from: 0, to: i });
        } else if (type === 'optical') {
            const enColor = '#ec4899';
            atoms.push({ ...pos[0], color: enColor, radius: 15, label: 'N' });
            atoms.push({ ...pos[2], color: enColor, radius: 15, label: 'N' });
            atoms.push({ ...pos[1], color: enColor, radius: 15, label: 'N' });
            atoms.push({ ...pos[3], color: enColor, radius: 15, label: 'N' });
            atoms.push({ ...pos[4], color: enColor, radius: 15, label: 'N' });
            atoms.push({ ...pos[5], color: enColor, radius: 15, label: 'N' });
            for (let i = 1; i <= 6; i++) bonds.push({ from: 0, to: i });

            if (sub === 'A') {
                bonds.push({ from: 1, to: 5, isChelate: true });
                bonds.push({ from: 2, to: 3, isChelate: true });
                bonds.push({ from: 4, to: 6, isChelate: true });
            } else {
                bonds.push({ from: 2, to: 5, isChelate: true });
                bonds.push({ from: 1, to: 3, isChelate: true });
                bonds.push({ from: 4, to: 6, isChelate: true });
            }
        }
        return { atoms, bonds };
    };

    const drawMolecule = (
        ctx: CanvasRenderingContext2D,
        offsetX: number,
        offsetY: number,
        atoms: Point3D[],
        bonds: Bond[],
        currentRotation: { x: number, y: number }
    ) => {
        const project = (p: Point3D) => {
            let x = p.x * Math.cos(currentRotation.x) - p.z * Math.sin(currentRotation.x);
            let z = p.x * Math.sin(currentRotation.x) + p.z * Math.cos(currentRotation.x);
            let y = p.y;

            let y2 = y * Math.cos(currentRotation.y) - z * Math.sin(currentRotation.y);
            let z2 = y * Math.sin(currentRotation.y) + z * Math.cos(currentRotation.y);

            const scale = 500 / (500 - z2);
            return {
                x: x * scale + offsetX,
                y: y2 * scale + offsetY,
                r: p.radius * scale,
                z: z2,
                color: p.color,
                label: p.label
            };
        };

        const projectedAtoms = atoms.map(project);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 5;
        bonds.forEach(b => {
            const start = projectedAtoms[b.from];
            const end = projectedAtoms[b.to];

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);

            if (b.isChelate) {
                const cx = (start.x + end.x) / 2;
                const cy = (start.y + end.y) / 2;
                ctx.quadraticCurveTo(cx * 1.2, cy * 1.2, end.x, end.y);
                ctx.strokeStyle = '#f472b6';
            } else {
                ctx.lineTo(end.x, end.y);
                ctx.strokeStyle = '#cbd5e1';
            }
            ctx.stroke();
        });

        projectedAtoms.sort((a, b) => a.z - b.z);

        projectedAtoms.forEach(a => {
            // Main sphere
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);

            const grad = ctx.createRadialGradient(a.x - a.r / 3, a.y - a.r / 3, a.r / 4, a.x, a.y, a.r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, a.color);
            grad.addColorStop(1, '#000000');

            ctx.fillStyle = grad;
            ctx.fill();

            // Label
            if (a.label) {
                ctx.fillStyle = 'white';
                ctx.font = `bold ${Math.max(12, a.r * 0.8)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // slight text shadow for readability
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 2;
                ctx.fillText(a.label, a.x, a.y);
                ctx.shadowBlur = 0;
            }
        });
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

            // Light theme background
            ctx.clearRect(0, 0, logicalWidth, logicalHeight);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);

            // Draw content
            const rx = rotation.x;
            const ry = rotation.y;

            if (isomerConfig.showMirror && isomerConfig.type === 'optical') {
                const mol1 = generateMolecule(isomerConfig.type, 'A');
                drawMolecule(ctx, logicalWidth * 0.25, logicalHeight / 2, mol1.atoms, mol1.bonds, { x: rx, y: ry });

                // Mirror plane
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(logicalWidth / 2, 50);
                ctx.lineTo(logicalWidth / 2, logicalHeight - 50);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#64748b';
                ctx.font = 'italic 16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Mirror Plane', logicalWidth / 2, 30);

                const mol2 = generateMolecule(isomerConfig.type, 'B');
                drawMolecule(ctx, logicalWidth * 0.75, logicalHeight / 2, mol2.atoms, mol2.bonds, { x: rx, y: -ry });
            } else {
                const mol = generateMolecule(isomerConfig.type, isomerConfig.subType);
                drawMolecule(ctx, logicalWidth / 2, logicalHeight / 2, mol.atoms, mol.bonds, { x: rx, y: ry });
            }

            ctx.restore();
            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [isomerConfig, rotation]);

    // ─── Interaction ───
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

    // ─── JSX ───
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 overflow-hidden rounded-2xl border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative cursor-move">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
            </div>

            <div className="absolute top-4 left-4 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm px-4 py-2 rounded-xl text-slate-700 font-bold text-sm flex gap-2 items-center">
                    <Box size={16} className="text-indigo-500" />
                    Drag to rotate 3D Molecule
                </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200" title="Reset Rotation">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full w-full">
            <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-2 rounded-t-xl shrink-0 overflow-x-auto">
                <button
                    onClick={() => setIsomerConfig({ type: 'cis-trans-sq', subType: 'A', showMirror: false })}
                    className={`flex whitespace-nowrap items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all flex-1 justify-center ${isomerConfig.type === 'cis-trans-sq' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                >
                    <Box size={16} /> Cis-Trans
                </button>
                <button
                    onClick={() => setIsomerConfig({ type: 'fac-mer', subType: 'A', showMirror: false })}
                    className={`flex whitespace-nowrap items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all flex-1 justify-center ${isomerConfig.type === 'fac-mer' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                >
                    <Layers size={16} /> Fac-Mer
                </button>
                <button
                    onClick={() => setIsomerConfig({ type: 'optical', subType: 'A', showMirror: false })}
                    className={`flex whitespace-nowrap items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all flex-1 justify-center ${isomerConfig.type === 'optical' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                >
                    <Eye size={16} /> Optical
                </button>
            </div>

            <div className="p-4 flex flex-col gap-4 w-full flex-1 overflow-y-auto max-h-[35vh] lg:max-h-[350px]">
                {/* Description based on type */}
                <div className="text-center p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-sm">
                    {isomerConfig.type === 'cis-trans-sq' && <strong>Geometrical Isomerism: [MA2B2] Square Planar.</strong>}
                    {isomerConfig.type === 'fac-mer' && <strong>Geometrical Isomerism: [MA3B3] Octahedral.</strong>}
                    {isomerConfig.type === 'optical' && <strong>Optical Isomerism: [M(en)3] Octahedral. Non-superimposable mirror images.</strong>}
                </div>

                <div className="space-y-6">
                    {/* Subtype Toggles */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase">Select Isomer</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsomerConfig(p => ({ ...p, subType: 'A' }))}
                                className={`p-3 rounded-lg font-bold text-sm border-2 transition-all ${isomerConfig.subType === 'A' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                {isomerConfig.type === 'cis-trans-sq' ? 'Cis Isomer' : (isomerConfig.type === 'fac-mer' ? 'Facial (fac)' : 'Dextro (d)')}
                            </button>
                            <button
                                onClick={() => setIsomerConfig(p => ({ ...p, subType: 'B' }))}
                                className={`p-3 rounded-lg font-bold text-sm border-2 transition-all ${isomerConfig.subType === 'B' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                {isomerConfig.type === 'cis-trans-sq' ? 'Trans Isomer' : (isomerConfig.type === 'fac-mer' ? 'Meridional (mer)' : 'Laevo (l)')}
                            </button>
                        </div>
                    </div>

                    {/* Explanatory text of the subtype */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700">
                        {isomerConfig.type === 'cis-trans-sq' && (
                            isomerConfig.subType === 'A'
                                ? "In Cis, identical groups are adjacent to each other."
                                : "In Trans, identical groups are opposite to each other."
                        )}
                        {isomerConfig.type === 'fac-mer' && (
                            isomerConfig.subType === 'A'
                                ? "In Facial, three identical groups occupy the corners of one triangular face of the octahedron."
                                : "In Meridional, three identical groups lie around the meridian (equator) of the octahedron."
                        )}
                        {isomerConfig.type === 'optical' && (
                            isomerConfig.subType === 'A'
                                ? "Dextro (d) isomer rotates plane-polarized light to the right."
                                : "Laevo (l) isomer rotates plane-polarized light to the left. They are Enantiomers."
                        )}
                    </div>

                    {/* Mirror Toggle (Only for Optical) */}
                    {isomerConfig.type === 'optical' && (
                        <div className="pt-4 border-t border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isomerConfig.showMirror}
                                        onChange={(e) => setIsomerConfig(p => ({ ...p, showMirror: e.target.checked }))}
                                    />
                                    <div className={`block w-14 h-8 rounded-full transition-colors ${isomerConfig.showMirror ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isomerConfig.showMirror ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    Compare Non-Superimposable Mirror Images
                                </div>
                            </label>
                            {isomerConfig.showMirror && (
                                <p className="text-xs text-indigo-600 mt-3 font-medium bg-indigo-50 p-2 rounded border border-indigo-100">
                                    Notice how they reflections cannot overlap each other directly, much like your left and right hand (Chirality).
                                </p>
                            )}
                        </div>
                    )}
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

export default StereochemistryLab;
