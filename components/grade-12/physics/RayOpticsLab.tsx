import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Box, Crosshair, MoveHorizontal } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type OpticsDevice = 'convex_lens' | 'concave_lens' | 'prism';

interface RayOpticsLabProps {
    topic: any;
    onExit: () => void;
}

// ─── Helper: line-to-edge intersection ───
// Given a point (x0,y0) and slope dy/dx, find where the line exits the canvas [0,W]×[0,H]
function lineToEdge(x0: number, y0: number, dx: number, dy: number, W: number, H: number): [number, number] {
    // parameterise: x = x0 + t*dx, y = y0 + t*dy,  find min positive t that hits a wall
    let tMin = 1e9;
    if (dx !== 0) {
        const tRight = (W - x0) / dx;
        const tLeft = -x0 / dx;
        if (tRight > 0.001) tMin = Math.min(tMin, tRight);
        if (tLeft > 0.001) tMin = Math.min(tMin, tLeft);
    }
    if (dy !== 0) {
        const tBot = (H - y0) / dy;
        const tTop = -y0 / dy;
        if (tBot > 0.001) tMin = Math.min(tMin, tBot);
        if (tTop > 0.001) tMin = Math.min(tMin, tTop);
    }
    if (tMin > 1e8) tMin = 0;
    return [x0 + tMin * dx, y0 + tMin * dy];
}

const RayOpticsLab: React.FC<RayOpticsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    // Physics state (all in "cm" conceptually)
    const [device, setDevice] = useState<OpticsDevice>('convex_lens');
    const [focalLength, setFocalLength] = useState(100);   // |f| in cm
    const [objectU, setObjectU] = useState(200);            // positive distance from lens (left side)
    const [objectHeight, setObjectHeight] = useState(40);   // arbitrary height units
    const [refractiveIndex, setRefractiveIndex] = useState(1.52);

    const isDragging = useRef(false);

    const handleReset = useCallback(() => {
        setFocalLength(100);
        setObjectU(200);
        setObjectHeight(40);
        setRefractiveIndex(1.52);
    }, []);

    // ─── ResizeObserver ───
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const ro = new ResizeObserver(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        ro.observe(parent);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        return () => ro.disconnect();
    }, []);

    // ─── Main Render ───
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const W = canvas.width;
            const H = canvas.height;
            if (W < 10 || H < 10) { animationRef.current = requestAnimationFrame(draw); return; }

            const cx = W / 2;   // optical centre x
            const cy = H / 2;   // principal axis y

            // Background
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, W, H);

            // Principal axis
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // ────────────── LENS MODES ──────────────
            if (device === 'convex_lens' || device === 'concave_lens') {
                const fSigned = device === 'convex_lens' ? focalLength : -focalLength;
                const uSigned = -objectU;  // sign convention: object on left → u < 0

                // Lens formula
                let vSigned = Infinity;
                if (Math.abs(uSigned + fSigned) > 0.5) {
                    vSigned = 1 / (1 / fSigned + 1 / uSigned);
                }
                const isAtInfinity = !isFinite(vSigned) || Math.abs(vSigned) > 10000;
                const mag = isAtInfinity ? Infinity : vSigned / uSigned;

                // ── Dynamic scale ──
                // Scale based on object distance, focal length, AND image distance
                // but cap image distance to prevent extreme squishing.
                const margin = W * 0.42;
                const workspace = Math.max(objectU, Math.abs(fSigned), 50);
                // Include |v| in scale but cap at 2.5x workspace to prevent squishing
                let scaleMax = workspace;
                if (!isAtInfinity && Math.abs(vSigned) < workspace * 2.5) {
                    scaleMax = Math.max(scaleMax, Math.abs(vSigned));
                }
                const S = margin / scaleMax;  // px per cm

                // converter: physics-cm-from-centre → canvas-x
                const px = (cm: number) => cx + cm * S;
                // height scale (cap so object arrow isn't absurdly tall on small canvases)
                const hScale = Math.min(S, H * 0.008);

                // Key positions in pixel space
                const objPx = px(-objectU);
                const f1Px = px(-Math.abs(fSigned));
                const f2Px = px(+Math.abs(fSigned));
                const objHPx = Math.max(objectHeight * hScale, 25); // minimum 25px arrow
                const objTopPx = cy - objHPx;

                const isVirtual = vSigned < 0 || isAtInfinity;

                // Image position: compute from physics, then CLAMP to canvas bounds
                let imgPx = cx, imgHPx = 0, imgTopPx = cy;
                if (!isAtInfinity) {
                    const rawImgPx = px(vSigned);
                    // Clamp image x to stay 40px inside canvas edges
                    imgPx = Math.max(40, Math.min(W - 40, rawImgPx));
                    imgHPx = objHPx * (mag as number);
                    // Clamp image height so it doesn't go off canvas vertically
                    const maxImgH = (H / 2) - 35;
                    if (Math.abs(imgHPx) > maxImgH) {
                        imgHPx = imgHPx > 0 ? maxImgH : -maxImgH;
                    }
                    imgTopPx = cy - imgHPx;
                }

                // ── Draw lens ──
                const lensH = Math.min(130, H * 0.42);
                ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
                ctx.strokeStyle = '#0ea5e9';
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (device === 'convex_lens') {
                    ctx.ellipse(cx, cy, 14, lensH, 0, 0, Math.PI * 2);
                } else {
                    ctx.moveTo(cx - 14, cy - lensH);
                    ctx.lineTo(cx + 14, cy - lensH);
                    ctx.quadraticCurveTo(cx + 4, cy, cx + 14, cy + lensH);
                    ctx.lineTo(cx - 14, cy + lensH);
                    ctx.quadraticCurveTo(cx - 4, cy, cx - 14, cy - lensH);
                }
                ctx.fill(); ctx.stroke();

                // ── Focal points ──
                ctx.fillStyle = '#ef4444';
                [f1Px, f2Px].forEach((fpx, idx) => {
                    ctx.beginPath(); ctx.arc(fpx, cy, 5, 0, Math.PI * 2); ctx.fill();
                    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText(idx === 0 ? 'F₁' : 'F₂', fpx, cy + 22);
                });
                // Optical centre
                ctx.fillStyle = '#334155';
                ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('O', cx, cy + 22);

                // ── Ray 1: parallel to axis → refracted through F₂ / diverging from F₁ ──
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#ef4444';
                // Incident (horizontal)
                ctx.beginPath(); ctx.moveTo(objPx, objTopPx); ctx.lineTo(cx, objTopPx); ctx.stroke();
                // Refracted
                ctx.beginPath(); ctx.moveTo(cx, objTopPx);
                if (device === 'convex_lens') {
                    const [ex, ey] = lineToEdge(cx, objTopPx, f2Px - cx, cy - objTopPx, W, H);
                    ctx.lineTo(ex, ey);
                } else {
                    // Diverging ray: slope away from F₁
                    const dxR = cx - f1Px;
                    const dyR = objTopPx - cy;
                    const [ex, ey] = lineToEdge(cx, objTopPx, dxR, dyR, W, H);
                    ctx.lineTo(ex, ey);
                }
                ctx.stroke();

                // Virtual backtrack for concave / virtual image
                if (device === 'concave_lens') {
                    ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(239,68,68,0.35)';
                    ctx.beginPath(); ctx.moveTo(cx, objTopPx); ctx.lineTo(f1Px, cy); ctx.stroke();
                    ctx.restore();
                }

                // ── Ray 2: through optical centre → undeviated ──
                ctx.strokeStyle = '#10b981';
                ctx.beginPath(); ctx.moveTo(objPx, objTopPx);
                {
                    const dxR = cx - objPx;
                    const dyR = cy - objTopPx;
                    const [ex, ey] = lineToEdge(objPx, objTopPx, dxR, dyR, W, H);
                    ctx.lineTo(ex, ey);
                }
                ctx.stroke();

                // ── Draw Object ──
                ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(objPx, cy); ctx.lineTo(objPx, objTopPx); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(objPx - 7, objTopPx + 10); ctx.lineTo(objPx, objTopPx); ctx.lineTo(objPx + 7, objTopPx + 10);
                ctx.stroke();
                ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('Object', objPx, cy + 18);

                // ── Draw Image ──
                if (!isAtInfinity) {
                    const imgColor = isVirtual ? '#a855f7' : '#8b5cf6';
                    ctx.strokeStyle = imgColor; ctx.fillStyle = imgColor;
                    if (isVirtual) { ctx.save(); ctx.setLineDash([6, 6]); }

                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(imgPx, cy); ctx.lineTo(imgPx, imgTopPx); ctx.stroke();
                    const arrD = imgHPx > 0 ? 10 : -10;
                    ctx.beginPath();
                    ctx.moveTo(imgPx - 7, imgTopPx + arrD); ctx.lineTo(imgPx, imgTopPx); ctx.lineTo(imgPx + 7, imgTopPx + arrD);
                    ctx.stroke();

                    if (isVirtual) ctx.restore();
                    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText(isVirtual ? 'Virtual Image' : 'Real Image', imgPx, cy + (imgHPx > 0 ? -8 : 22));
                } else {
                    ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'right';
                    ctx.fillText('Image at ∞ (parallel rays)', W - 20, 28);
                }

                // ────────────── PRISM MODE ──────────────
            } else {
                const side = Math.min(200, W * 0.28, H * 0.52);
                const h = side * Math.sin(Math.PI / 3);
                const baseX = cx - side / 2;
                const baseY = cy + h / 3;

                // --- Prism body ---
                ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
                ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(baseX, baseY);
                ctx.lineTo(baseX + side, baseY);
                ctx.lineTo(cx, baseY - h);
                ctx.closePath();
                ctx.fill(); ctx.stroke();

                // --- Incident white ray ---
                const hitX = baseX + side * 0.28;
                const hitY = baseY - h * 0.28;
                ctx.strokeStyle = '#475569'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(Math.max(0, baseX - 180), baseY + 40); ctx.lineTo(hitX, hitY); ctx.stroke();

                // --- VIBGYOR dispersion ---
                const spectrum = [
                    { c: '#dc2626', nMod: 0.98, label: 'R' },
                    { c: '#ea580c', nMod: 0.985 },
                    { c: '#f59e0b', nMod: 0.99 },
                    { c: '#16a34a', nMod: 1.00, label: 'G' },
                    { c: '#2563eb', nMod: 1.02 },
                    { c: '#4f46e5', nMod: 1.03 },
                    { c: '#7c3aed', nMod: 1.04, label: 'V' },
                ];

                ctx.lineWidth = 2.5;
                spectrum.forEach((sp, i) => {
                    const n = refractiveIndex * sp.nMod;
                    const devIn = (n - 1) * 14;
                    const mid2X = cx + 18 + i * 3;
                    const mid2Y = baseY - h * 0.38 + devIn;
                    const devOut = (n - 1) * 32;
                    const endY = baseY + devOut + i * 18;

                    ctx.strokeStyle = sp.c;
                    ctx.beginPath();
                    ctx.moveTo(hitX, hitY);
                    ctx.lineTo(mid2X, mid2Y);
                    ctx.lineTo(Math.min(W - 10, W * 0.9), endY);
                    ctx.stroke();

                    // Label first, middle, last
                    if (sp.label) {
                        ctx.fillStyle = sp.c; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
                        ctx.fillText(sp.label, Math.min(W - 30, W * 0.9) + 6, endY + 5);
                    }
                });

                ctx.fillStyle = '#334155'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(`Dispersion of White Light  (n ≈ ${refractiveIndex.toFixed(2)})`, cx, baseY + 50);
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        animationRef.current = requestAnimationFrame(draw);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [device, focalLength, objectU, objectHeight, refractiveIndex]);

    // ─── Drag-to-move object ───
    const getScale = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return { S: 1, W: 800 };
        const W = canvas.width;
        const margin = W * 0.42;
        const workspace = Math.max(objectU, focalLength, 50);
        const S = margin / workspace;
        return { S, W };
    }, [objectU, focalLength]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (device === 'prism') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const { S, W } = getScale();
        const objPx = W / 2 + (-objectU) * S;
        if (Math.abs(mouseX - objPx) < 50) isDragging.current = true;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || device === 'prism') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const { S, W } = getScale();
        const cmFromCentre = (mouseX - W / 2) / S;  // negative means left
        const newU = Math.max(30, Math.min(350, -cmFromCentre));
        setObjectU(Math.round(newU / 5) * 5);   // snap to 5cm steps
    };

    const handleMouseUp = () => { isDragging.current = false; };

    // ─── Derived display values ───
    const fD = device === 'convex_lens' ? focalLength : -focalLength;
    const uD = -objectU;
    const vD = (device !== 'prism' && Math.abs(uD + fD) > 0.5) ? 1 / (1 / fD + 1 / uD) : Infinity;
    const mD = isFinite(vD) ? vD / uD : Infinity;

    // ─── JSX ───
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px] bg-white">
                <canvas
                    ref={canvasRef}
                    className={`absolute inset-0 w-full h-full ${device !== 'prism' ? 'cursor-ew-resize' : ''}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
            </div>

            {device !== 'prism' && (
                <div className="bg-slate-800 text-white flex justify-around items-center p-3 text-sm font-mono border-t border-slate-700 shrink-0">
                    <div className="flex flex-col items-center">
                        <span className="text-slate-400 text-xs">Object Dist (u)</span>
                        <span className="text-emerald-400 font-bold">{uD.toFixed(1)} cm</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-slate-600 pl-8">
                        <span className="text-slate-400 text-xs">Image Dist (v)</span>
                        <span className="text-violet-400 font-bold">{!isFinite(vD) ? '∞' : vD.toFixed(1)} cm</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-slate-600 pl-8">
                        <span className="text-slate-400 text-xs">Magnification (m)</span>
                        <span className={`font-bold ${mD > 0 ? 'text-blue-400' : 'text-red-400'}`}>{!isFinite(mD) ? '∞' : mD.toFixed(2)}x</span>
                    </div>
                </div>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col w-full h-full">
            {/* Device Selector */}
            <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-2 rounded-t-xl overflow-x-auto shrink-0">
                {([
                    { id: 'convex_lens', label: 'Convex Lens', icon: <Crosshair size={16} /> },
                    { id: 'concave_lens', label: 'Concave Lens', icon: <Box size={16} /> },
                    { id: 'prism', label: 'Glass Prism', icon: <Box size={16} /> }
                ] as const).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => { setDevice(item.id); handleReset(); }}
                        className={`flex whitespace-nowrap items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all flex-1 justify-center ${device === item.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    >
                        {item.icon} {item.label}
                    </button>
                ))}
            </div>

            <div className="p-6 flex flex-col gap-6 w-full flex-1 overflow-y-auto">
                <div className="text-center p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-sm">
                    {device === 'convex_lens' && <span><strong>Convex Lenses</strong> converge light rays. Real images form when |u| {'>'} f. <br /><span className="font-mono">1/v − 1/u = 1/f</span></span>}
                    {device === 'concave_lens' && <span><strong>Concave Lenses</strong> diverge light rays. Images are always virtual, erect, and diminished. <br /><span className="font-mono">1/v − 1/u = 1/f  (f {'<'} 0)</span></span>}
                    {device === 'prism' && <span><strong>Prism Dispersion:</strong> Refractive index varies with wavelength. Violet bends most, red bends least. <br /><span className="font-mono">δ = (μ − 1) A</span></span>}
                </div>

                <div className="space-y-6">
                    {device !== 'prism' ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                    <span>Focal Length (f)</span>
                                    <span className="text-indigo-600 font-mono bg-indigo-50 px-2 rounded">±{focalLength} cm</span>
                                </label>
                                <input type="range" min="40" max={device === 'convex_lens' ? Math.max(50, Math.floor(objectU * 0.7)) : 250} step="10"
                                    value={Math.min(focalLength, device === 'convex_lens' ? Math.floor(objectU * 0.7) : 250)}
                                    onChange={(e) => setFocalLength(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                {device === 'convex_lens' && <p className="text-[10px] text-slate-400 italic">Max f limited to 70% of u to keep image visible</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                    <span className="flex items-center gap-1"><MoveHorizontal size={14} /> Object Distance (u)</span>
                                    <span className="text-emerald-600 font-mono bg-emerald-50 px-2 rounded">{-objectU} cm</span>
                                </label>
                                <input type="range" min={device === 'convex_lens' ? Math.max(30, Math.ceil(focalLength * 1.5)) : 30} max="400" step="5"
                                    value={Math.max(objectU, device === 'convex_lens' ? Math.ceil(focalLength * 1.5) : 30)}
                                    onChange={(e) => setObjectU(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <p className="text-[10px] text-slate-400 text-right italic">Or drag the object in the simulation</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                    <span>Object Height (h)</span>
                                    <span className="font-mono bg-slate-100 px-2 rounded">{objectHeight}</span>
                                </label>
                                <input type="range" min="10" max="80" step="5"
                                    value={objectHeight}
                                    onChange={(e) => setObjectHeight(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                                <span>Refractive Index (μ)</span>
                                <span className="text-blue-600 font-mono bg-blue-50 px-2 rounded">{refractiveIndex.toFixed(2)}</span>
                            </label>
                            <input type="range" min="1.3" max="1.8" step="0.02"
                                value={refractiveIndex}
                                onChange={(e) => setRefractiveIndex(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <p className="text-xs text-slate-400 mt-1">Higher μ → greater deviation and more pronounced spectrum spread.</p>
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

export default RayOpticsLab;
