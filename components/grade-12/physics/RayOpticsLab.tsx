import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCcw, Box, Crosshair, MoveHorizontal } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type OpticsDevice = 'convex_lens' | 'concave_lens' | 'prism';

interface RayOpticsLabProps {
    topic: any;
    onExit: () => void;
}

// ─── Helper: line-to-edge intersection ───
function lineToEdge(x0: number, y0: number, dx: number, dy: number, W: number, H: number): [number, number] {
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

// ─── Helper: draw arrow on line segment ───
function drawArrowOnLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, t: number, size: number) {
    const mx = x1 + t * (x2 - x1);
    const my = y1 + t * (y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.5);
    ctx.lineTo(-size, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

const RayOpticsLab: React.FC<RayOpticsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    // Physics state
    const [device, setDevice] = useState<OpticsDevice>('convex_lens');
    const [focalLength, setFocalLength] = useState(100);
    const [objectU, setObjectU] = useState(200);
    const [objectHeight, setObjectHeight] = useState(40);
    const [refractiveIndex, setRefractiveIndex] = useState(1.52);

    const isDragging = useRef(false);

    const handleReset = useCallback(() => {
        setFocalLength(100);
        setObjectU(200);
        setObjectHeight(40);
        setRefractiveIndex(1.52);
    }, []);

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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const W = canvas.width;
            const H = canvas.height;
            if (W < 10 || H < 10) { animationRef.current = requestAnimationFrame(draw); return; }

            const cx = W / 2;
            const cy = H / 2;

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

            if (device === 'convex_lens' || device === 'concave_lens') {
                const fSigned = device === 'convex_lens' ? focalLength : -focalLength;
                const uSigned = -objectU;

                let vSigned = Infinity;
                if (Math.abs(uSigned + fSigned) > 0.5) vSigned = 1 / (1 / fSigned + 1 / uSigned);
                const isAtInfinity = !isFinite(vSigned) || Math.abs(vSigned) > 10000;
                const mag = isAtInfinity ? Infinity : vSigned / uSigned;

                const margin = W * 0.42;
                const workspace = Math.max(objectU, Math.abs(fSigned) * 2, 50);
                let scaleMax = workspace;
                if (!isAtInfinity && Math.abs(vSigned) < workspace * 2.5) {
                    scaleMax = Math.max(scaleMax, Math.abs(vSigned));
                }
                const S = margin / scaleMax;
                const px = (cm: number) => cx + cm * S;
                const hScale = Math.min(S, H * 0.008);

                const objPx = px(-objectU);
                const f1Px = px(-Math.abs(fSigned));
                const f2Px = px(+Math.abs(fSigned));
                const f12Px = px(-Math.abs(fSigned) * 2);
                const f22Px = px(+Math.abs(fSigned) * 2);
                const objHPx = Math.max(objectHeight * hScale, 25);
                const objTopPx = cy - objHPx;
                const isVirtual = vSigned < 0 || isAtInfinity;

                let imgPx = cx, imgHPx = 0, imgTopPx = cy;
                if (!isAtInfinity) {
                    const rawImgPx = px(vSigned);
                    imgPx = Math.max(40, Math.min(W - 40, rawImgPx));
                    imgHPx = objHPx * (mag as number);
                    const maxImgH = (H / 2) - 35;
                    if (Math.abs(imgHPx) > maxImgH) imgHPx = imgHPx > 0 ? maxImgH : -maxImgH;
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

                // ── Points: F1, 2F1, F2, 2F2 ──
                ctx.fillStyle = '#ef4444';
                [
                    { x: f1Px, tag: 'F₁' }, { x: f2Px, tag: 'F₂' },
                    { x: f12Px, tag: '2F₁' }, { x: f22Px, tag: '2F₂' }
                ].forEach((pt) => {
                    ctx.beginPath(); ctx.arc(pt.x, cy, 5, 0, Math.PI * 2); ctx.fill();
                    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText(pt.tag, pt.x, cy + 22);
                });
                ctx.fillStyle = '#334155'; ctx.fillText('O', cx - 12, cy + 22);

                const arrSize = 8;

                // ── Ray 1: Parallel to axis → through/away from F2 ──
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#ef4444'; ctx.fillStyle = '#ef4444';
                ctx.beginPath(); ctx.moveTo(objPx, objTopPx); ctx.lineTo(cx, objTopPx); ctx.stroke();
                drawArrowOnLine(ctx, objPx, objTopPx, cx, objTopPx, 0.5, arrSize);

                ctx.beginPath(); ctx.moveTo(cx, objTopPx);
                let r1Ex, r1Ey;
                if (device === 'convex_lens') {
                    [r1Ex, r1Ey] = lineToEdge(cx, objTopPx, f2Px - cx, cy - objTopPx, W, H);
                } else {
                    [r1Ex, r1Ey] = lineToEdge(cx, objTopPx, cx - f1Px, objTopPx - cy, W, H);
                }
                ctx.lineTo(r1Ex, r1Ey); ctx.stroke();
                drawArrowOnLine(ctx, cx, objTopPx, r1Ex, r1Ey, 0.3, arrSize);

                if (device === 'concave_lens') {
                    ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(239,68,68,0.35)';
                    ctx.beginPath(); ctx.moveTo(cx, objTopPx); ctx.lineTo(f1Px, cy); ctx.stroke();
                    ctx.restore();
                }

                // ── Ray 2: Through optical center ──
                ctx.strokeStyle = '#10b981'; ctx.fillStyle = '#10b981';
                const [r2Ex, r2Ey] = lineToEdge(objPx, objTopPx, cx - objPx, cy - objTopPx, W, H);
                ctx.beginPath(); ctx.moveTo(objPx, objTopPx); ctx.lineTo(r2Ex, r2Ey); ctx.stroke();
                drawArrowOnLine(ctx, objPx, objTopPx, cx, cy, 0.5, arrSize);
                drawArrowOnLine(ctx, cx, cy, r2Ex, r2Ey, 0.3, arrSize);

                // ── Ray 3 (NCERT 3rd ray): Through/towards F1 → Emerges parallel ──
                // Convex: Ray passes through F1, hits lens, goes parallel.
                // Concave: Ray heads towards F2, hits lens, goes parallel.
                if (Math.abs(uSigned - fSigned) > 1) {
                    ctx.strokeStyle = '#3b82f6'; ctx.fillStyle = '#3b82f6';
                    let lensHitY;
                    if (device === 'convex_lens') {
                        // Ray from objTop through F1
                        lensHitY = objTopPx + ((cx - objPx) / (f1Px - objPx)) * (cy - objTopPx);
                    } else {
                        // Ray from objTop towards F2
                        lensHitY = objTopPx + ((cx - objPx) / (f2Px - objPx)) * (cy - objTopPx);
                    }

                    // Draw incident part to lens (or edge if it misses lens)
                    let drawIncToX = cx, drawIncToY = lensHitY;
                    if (Math.abs(lensHitY - cy) > lensH * 1.5) {
                        // Ray goes wildly off frame before reaching lens
                        [drawIncToX, drawIncToY] = lineToEdge(objPx, objTopPx, cx - objPx, lensHitY - objTopPx, W, H);
                        ctx.beginPath(); ctx.moveTo(objPx, objTopPx); ctx.lineTo(drawIncToX, drawIncToY); ctx.stroke();
                        drawArrowOnLine(ctx, objPx, objTopPx, drawIncToX, drawIncToY, 0.5, arrSize);
                    } else {
                        ctx.beginPath(); ctx.moveTo(objPx, objTopPx); ctx.lineTo(cx, lensHitY); ctx.stroke();
                        drawArrowOnLine(ctx, objPx, objTopPx, cx, lensHitY, 0.5, arrSize);

                        // Draw refracted part
                        const [r3Ex, r3Ey] = lineToEdge(cx, lensHitY, W - cx, 0, W, H);
                        ctx.beginPath(); ctx.moveTo(cx, lensHitY); ctx.lineTo(r3Ex, r3Ey); ctx.stroke();
                        drawArrowOnLine(ctx, cx, lensHitY, r3Ex, r3Ey, 0.3, arrSize);

                        // Backtrack if needed
                        if (device === 'concave_lens' || (device === 'convex_lens' && objectU < focalLength)) {
                            ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(59,130,246,0.35)';
                            ctx.beginPath(); ctx.moveTo(cx, lensHitY); ctx.lineTo(imgPx, imgTopPx); ctx.stroke();
                            if (device === 'concave_lens') {
                                // Original path towards F2 behind lens
                                ctx.strokeStyle = 'rgba(59,130,246,0.2)';
                                ctx.beginPath(); ctx.moveTo(cx, lensHitY); ctx.lineTo(f2Px, cy); ctx.stroke();
                            }
                            ctx.restore();
                        }
                        if (device === 'convex_lens' && objectU < focalLength) {
                            // back track of ray 1 & 2
                            ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(239,68,68,0.35)';
                            ctx.beginPath(); ctx.moveTo(cx, objTopPx); ctx.lineTo(imgPx, imgTopPx); ctx.stroke();
                            ctx.strokeStyle = 'rgba(16,185,129,0.35)';
                            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(imgPx, imgTopPx); ctx.stroke();
                            ctx.restore();
                        }
                    }
                }

                // ── Object ──
                ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(objPx, cy); ctx.lineTo(objPx, objTopPx); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(objPx - 7, objTopPx + 10); ctx.lineTo(objPx, objTopPx); ctx.lineTo(objPx + 7, objTopPx + 10); ctx.stroke();
                ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('O', objPx, cy + 18);

                // ── Image ──
                if (!isAtInfinity && Math.abs(imgTopPx - cy) > 2) {
                    const imgColor = isVirtual ? '#a855f7' : '#8b5cf6';
                    ctx.strokeStyle = imgColor; ctx.fillStyle = imgColor;
                    if (isVirtual) { ctx.save(); ctx.setLineDash([6, 6]); }
                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(imgPx, cy); ctx.lineTo(imgPx, imgTopPx); ctx.stroke();
                    const arrD = imgHPx > 0 ? 10 : -10;
                    ctx.beginPath(); ctx.moveTo(imgPx - 7, imgTopPx + arrD); ctx.lineTo(imgPx, imgTopPx); ctx.lineTo(imgPx + 7, imgTopPx + arrD); ctx.stroke();
                    if (isVirtual) ctx.restore();
                    ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText('I', imgPx, cy + (imgHPx > 0 ? -8 : 22));
                }

                // ── Labels for u, v, f ──
                ctx.strokeStyle = '#94a3b8'; ctx.fillStyle = '#64748b'; ctx.lineWidth = 1;
                const topD = cy + 45;
                // u
                ctx.beginPath(); ctx.moveTo(objPx, cy + 5); ctx.lineTo(objPx, topD + 5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, topD + 5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(objPx, topD); ctx.lineTo(cx, topD); ctx.stroke();
                drawArrowOnLine(ctx, (objPx+cx)/2, topD, cx, topD, 0.95, 6);
                drawArrowOnLine(ctx, (objPx+cx)/2, topD, objPx, topD, 0.95, 6);
                ctx.fillText('u', (objPx + cx) / 2, topD - 4);
                // v
                if (!isAtInfinity && Math.abs(imgPx - cx) > 10) {
                    const vD = cy + 65;
                    ctx.beginPath(); ctx.moveTo(imgPx, cy + 5); ctx.lineTo(imgPx, vD + 5); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, vD + 5); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(cx, vD); ctx.lineTo(imgPx, vD); ctx.stroke();
                    drawArrowOnLine(ctx, (cx+imgPx)/2, vD, imgPx, vD, 0.95, 6);
                    drawArrowOnLine(ctx, (cx+imgPx)/2, vD, cx, vD, 0.95, 6);
                    ctx.fillText('v', (cx + imgPx) / 2, vD - 4);
                }
                // f
                const fD = cy + 85;
                const plotF = device === 'convex_lens' ? f2Px : f1Px;
                ctx.beginPath(); ctx.moveTo(plotF, cy + 5); ctx.lineTo(plotF, fD + 5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, cy + 5); ctx.lineTo(cx, fD + 5); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx, fD); ctx.lineTo(plotF, fD); ctx.stroke();
                drawArrowOnLine(ctx, (cx+plotF)/2, fD, plotF, fD, 0.95, 6);
                drawArrowOnLine(ctx, (cx+plotF)/2, fD, cx, fD, 0.95, 6);
                ctx.fillText('f', (cx + plotF) / 2, fD - 4);

            } else {
                // Prism mode
                const side = Math.min(200, W * 0.28, H * 0.52);
                const h = side * Math.sin(Math.PI / 3);
                const baseX = cx - side / 2;
                const baseY = cy + h / 3;

                ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
                ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.lineTo(baseX + side, baseY); ctx.lineTo(cx, baseY - h); ctx.closePath();
                ctx.fill(); ctx.stroke();
                
                // Prism angle label A
                ctx.fillStyle = '#0ea5e9'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('A', cx, baseY - h - 10);

                const hitX = baseX + side * 0.28;
                const hitY = baseY - h * 0.28;
                const startX = Math.max(0, baseX - 180);
                const startY = baseY + 40;

                // Normal 1
                const n1dx = Math.cos(-Math.PI/6);
                const n1dy = Math.sin(-Math.PI/6);
                ctx.strokeStyle = '#94a3b8'; ctx.setLineDash([4,4]); ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(hitX - n1dx*40, hitY - n1dy*40); ctx.lineTo(hitX + n1dx*40, hitY + n1dy*40); ctx.stroke();
                ctx.setLineDash([]);

                ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(hitX, hitY); ctx.stroke();
                ctx.fillStyle = '#334155';
                drawArrowOnLine(ctx, startX, startY, hitX, hitY, 0.5, 10);

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
                    const endX = Math.min(W - 10, W * 0.9);

                    ctx.strokeStyle = sp.c; ctx.fillStyle = sp.c;
                    ctx.beginPath(); ctx.moveTo(hitX, hitY); ctx.lineTo(mid2X, mid2Y); ctx.lineTo(endX, endY); ctx.stroke();
                    drawArrowOnLine(ctx, mid2X, mid2Y, endX, endY, 0.4, 7);

                    if (sp.label) {
                        ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
                        ctx.fillText(sp.label, endX + 6, endY + 5);
                    }
                    
                    if (sp.label === 'G' || sp.label === 'V' || sp.label === 'R') {
                        // Normal 2 for visual
                        if(sp.label === 'V') {
                            const n2dx = Math.cos(Math.PI/6);
                            const n2dy = Math.sin(Math.PI/6);
                            ctx.strokeStyle = '#cbd5e1'; ctx.setLineDash([4,4]); ctx.lineWidth = 1;
                            ctx.beginPath(); ctx.moveTo(mid2X - n2dx*40, mid2Y - n2dy*40); ctx.lineTo(mid2X + n2dx*40, mid2Y + n2dy*40); ctx.stroke();
                            ctx.setLineDash([]);
                        }
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

    const getScale = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return { S: 1, W: 800 };
        const W = canvas.width;
        const margin = W * 0.42;
        const workspace = Math.max(objectU, focalLength * 2, 50);
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
        const cmFromCentre = (mouseX - W / 2) / S;
        const newU = Math.max(30, Math.min(350, -cmFromCentre));
        setObjectU(Math.round(newU / 5) * 5);
    };

    const handleMouseUp = () => { isDragging.current = false; };

    const fD = device === 'convex_lens' ? focalLength : -focalLength;
    const uD = -objectU;
    const vD = (device !== 'prism' && Math.abs(uD + fD) > 0.5) ? 1 / (1 / fD + 1 / uD) : Infinity;
    const mD = isFinite(vD) ? vD / uD : Infinity;

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px] bg-white">
                <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${device !== 'prism' ? 'cursor-ew-resize' : ''}`}
                    onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
            </div>

            {device !== 'prism' && (
                <div className="bg-slate-800 text-white flex justify-around items-center p-3 text-sm font-mono border-t border-slate-700 shrink-0">
                    <div className="flex flex-col items-center"><span className="text-slate-400 text-xs">Object Dist (u)</span><span className="text-emerald-400 font-bold">{uD.toFixed(1)} cm</span></div>
                    <div className="flex flex-col items-center border-l border-slate-600 pl-8"><span className="text-slate-400 text-xs">Image Dist (v)</span><span className="text-violet-400 font-bold">{!isFinite(vD) ? '∞' : vD.toFixed(1)} cm</span></div>
                    <div className="flex flex-col items-center border-l border-slate-600 pl-8"><span className="text-slate-400 text-xs">Magnification (m)</span><span className={`font-bold ${mD > 0 ? 'text-blue-400' : 'text-red-400'}`}>{!isFinite(mD) ? '∞' : mD.toFixed(2)}x</span></div>
                    <div className="flex flex-col items-center border-l border-slate-600 pl-8 text-center">
                        <span className="text-slate-400 text-xs">Image Nature</span>
                        <span className="text-amber-300 font-bold text-xs">
                            {!isFinite(vD) ? 'Image at infinity' : vD > 0 ? 'Real, Inverted' : 'Virtual, Erect'}
                            {isFinite(vD) && isFinite(mD) && ` • ${Math.abs(mD) > 1 ? 'Magnified' : 'Diminished'}`}
                        </span>
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
            <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-2 rounded-t-xl overflow-x-auto shrink-0">
                {([{ id: 'convex_lens', label: 'Convex Lens', icon: <Crosshair size={16} /> }, { id: 'concave_lens', label: 'Concave Lens', icon: <Box size={16} /> }, { id: 'prism', label: 'Glass Prism', icon: <Box size={16} /> }] as const).map((item) => (
                    <button key={item.id} onClick={() => { setDevice(item.id); handleReset(); }} className={`flex whitespace-nowrap items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all flex-1 justify-center ${device === item.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                        {item.icon} {item.label}
                    </button>
                ))}
            </div>

            <div className="p-6 flex flex-col gap-6 w-full flex-1 overflow-y-auto">
                <div className="text-center p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-sm">
                    {device === 'convex_lens' && <span><strong>Convex Lenses</strong> converge light rays. Real images form when |u| {'>'} f. <br /><span className="font-mono">1/v − 1/u = 1/f</span></span>}
                    {device === 'concave_lens' && <span><strong>Concave Lenses</strong> diverge light rays. Images are always virtual, erect, and diminished. <br /><span className="font-mono">1/v − 1/u = 1/f  (f {'<'} 0)</span></span>}
                    {device === 'prism' && <span><strong>Prism Dispersion:</strong> Refractive index varies with wavelength. Violet bends most, red bends least. <br /><span className="font-mono">Thin prism approximation: δ ≈ (μ − 1)A</span><br /><span className="text-xs text-indigo-700">For general case: μ = sin((A + δm)/2) / sin(A/2)</span></span>}
                </div>

                <div className="space-y-6">
                    {device !== 'prism' ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between"><span>Focal Length (f)</span><span className="text-indigo-600 font-mono bg-indigo-50 px-2 rounded">±{focalLength} cm</span></label>
                                <input type="range" min="40" max={device === 'convex_lens' ? Math.max(50, Math.floor(objectU * 0.7)) : 250} step="10" value={Math.min(focalLength, device === 'convex_lens' ? Math.floor(objectU * 0.7) : 250)} onChange={(e) => setFocalLength(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between"><span className="flex items-center gap-1"><MoveHorizontal size={14} /> Object Distance (u)</span><span className="text-emerald-600 font-mono bg-emerald-50 px-2 rounded">{-objectU} cm</span></label>
                                <input type="range" min={device === 'convex_lens' ? Math.max(30, focalLength + 5) : 30} max="400" step="5" value={Math.max(objectU, device === 'convex_lens' ? Math.max(30, focalLength + 5) : 30)} onChange={(e) => setObjectU(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between"><span>Object Height (h)</span><span className="font-mono bg-slate-100 px-2 rounded">{objectHeight}</span></label>
                                <input type="range" min="10" max="80" step="5" value={objectHeight} onChange={(e) => setObjectHeight(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500" />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between"><span>Refractive Index (μ)</span><span className="text-blue-600 font-mono bg-blue-50 px-2 rounded">{refractiveIndex.toFixed(2)}</span></label>
                            <input type="range" min="1.3" max="1.8" step="0.02" value={refractiveIndex} onChange={(e) => setRefractiveIndex(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />;
};

export default RayOpticsLab;
