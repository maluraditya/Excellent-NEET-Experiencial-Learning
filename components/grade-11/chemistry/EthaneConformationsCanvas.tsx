import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Eye, EyeOff, FlaskConical } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

/*
 *  Conformations of Ethane — NCERT §9.2.2 (Class 11 Chemistry, Unit 9 Hydrocarbons)
 *
 *  - C₂H₆ allows rotation about the C–C single bond → infinite spatial arrangements (conformations / rotamers)
 *  - Eclipsed (H atoms aligned, dihedral θ = 0°, 120°, 240°)  → maximum torsional strain → least stable
 *  - Staggered (H atoms 60° apart, θ = 60°, 180°, 300°)        → minimum torsional strain → most stable
 *  - Skew (any intermediate θ)                                 → intermediate strain
 *  - Energy barrier (eclipsed − staggered) ≈ 12.5 kJ mol⁻¹  (small; overcome by thermal energy at room T)
 *  - Energy curve is threefold-periodic:  E(θ) = (12.5 / 2) · (1 − cos 3θ)
 *  - Bond angles and bond lengths remain unchanged across all conformations
 *  - Newman projection (Fig 9.3): front C as a point with 3 lines at 120°; rear C as a circle with 3 shorter lines at 120°
 *  - Sawhorse projection (Fig 9.2): tilted C–C line, front C bottom, rear C top, three H atoms at 120°
 */

interface EthaneConformationsProps { topic: Topic; onExit: () => void; }
type ViewMode = 'newman' | 'sawhorse' | '3d';

const E_BARRIER = 12.5;  // kJ/mol — NCERT value

const EthaneConformationsCanvas: React.FC<EthaneConformationsProps> = ({ topic, onExit }) => {
    const [dihedralAngle, setDihedralAngle] = useState(60);
    const [viewMode, setViewMode] = useState<ViewMode>('newman');
    const [showElectronClouds, setShowElectronClouds] = useState(false);
    const [autoRotate, setAutoRotate] = useState(false);
    const [paused, setPaused] = useState(false);
    const animRef = useRef<number | null>(null);

    // Drag-to-rotate state — works for mouse, touch, and smartboard
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startPointerAngle: number; startDihedral: number; startPointerX: number } | null>(null);

    // Continuous "breathing" time for idle animations
    const [animT, setAnimT] = useState(0);
    useEffect(() => {
        let raf = 0;
        const tick = (t: number) => { setAnimT(t / 1000); raf = requestAnimationFrame(tick); };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    /* ── Derived chemistry values ────────────────────────────── */
    const potentialEnergy = useMemo(() => {
        const rad = (dihedralAngle * Math.PI) / 180;
        return (E_BARRIER / 2) * (1 - Math.cos(3 * rad));
    }, [dihedralAngle]);

    const conformationType: 'staggered' | 'eclipsed' | 'skew' = useMemo(() => {
        const norm = ((dihedralAngle % 360) + 360) % 360;
        const eclipsed = [0, 120, 240, 360];
        const staggered = [60, 180, 300];
        const tol = 4;
        for (const a of eclipsed) if (Math.abs(norm - a) < tol) return 'eclipsed';
        for (const a of staggered) if (Math.abs(norm - a) < tol) return 'staggered';
        return 'skew';
    }, [dihedralAngle]);

    const message = useMemo(() => {
        if (conformationType === 'staggered') return 'Staggered (θ = 60°/180°/300°) — H atoms farthest apart, minimum torsional strain, most stable.';
        if (conformationType === 'eclipsed') return `Eclipsed (θ = ${dihedralAngle.toFixed(0)}°) — H atoms aligned, maximum torsional strain ${E_BARRIER.toFixed(1)} kJ/mol, least stable.`;
        return `Skew / intermediate (θ = ${dihedralAngle.toFixed(0)}°) — torsional strain ${potentialEnergy.toFixed(2)} kJ/mol.`;
    }, [conformationType, dihedralAngle, potentialEnergy]);

    /* ── Auto-rotate loop ────────────────────────────────────── */
    useEffect(() => {
        if (autoRotate && !paused) {
            const tick = () => {
                setDihedralAngle((p) => (p + 0.6) % 360);
                animRef.current = requestAnimationFrame(tick);
            };
            animRef.current = requestAnimationFrame(tick);
        }
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [autoRotate, paused]);

    const handleReset = () => {
        setDihedralAngle(60);
        setAutoRotate(false);
        setPaused(false);
        setShowElectronClouds(false);
    };

    /* ── Drag-to-rotate handlers (smartboard / touch / mouse) ── */
    const angleFromPointer = (e: React.PointerEvent<SVGSVGElement>, vbCx: number, vbCy: number) => {
        // Convert pointer event to SVG viewBox coords, then to polar angle from (vbCx, vbCy)
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const vbW = svg.viewBox.baseVal.width || 800;
        const vbH = svg.viewBox.baseVal.height || 800;
        const sx = ((e.clientX - rect.left) / rect.width) * vbW;
        const sy = ((e.clientY - rect.top) / rect.height) * vbH;
        const dx = sx - vbCx;
        const dy = vbCy - sy;                              // flip — math angles go CCW
        return Math.atan2(dy, dx) * 180 / Math.PI;
    };

    const beginRotateDrag = (e: React.PointerEvent<SVGSVGElement>, mode: ViewMode) => {
        (e.currentTarget as any).setPointerCapture?.(e.pointerId);
        setAutoRotate(false);
        if (mode === 'newman') {
            const p = angleFromPointer(e, 400, 400);
            dragRef.current = { startPointerAngle: p, startDihedral: dihedralAngle, startPointerX: e.clientX };
        } else {
            // sawhorse / 3d → horizontal drag (1px ≈ 0.6°)
            dragRef.current = { startPointerAngle: 0, startDihedral: dihedralAngle, startPointerX: e.clientX };
        }
        setIsDragging(true);
    };

    const moveRotateDrag = (e: React.PointerEvent<SVGSVGElement>, mode: ViewMode) => {
        if (!isDragging || !dragRef.current) return;
        if (mode === 'newman') {
            const p = angleFromPointer(e, 400, 400);
            const delta = p - dragRef.current.startPointerAngle;
            // Polar angle: dragging CCW → dihedral DECREASES (rear rotates relative to front)
            let next = dragRef.current.startDihedral - delta;
            next = ((next % 360) + 360) % 360;
            setDihedralAngle(next);
        } else {
            const dx = e.clientX - dragRef.current.startPointerX;
            let next = dragRef.current.startDihedral + dx * 0.7;
            next = ((next % 360) + 360) % 360;
            setDihedralAngle(next);
        }
    };

    const endRotateDrag = (e: React.PointerEvent<SVGSVGElement>) => {
        try { (e.currentTarget as any).releasePointerCapture?.(e.pointerId); } catch { /* */ }
        setIsDragging(false);
        dragRef.current = null;
    };

    /* ── SVG molecule renderers (NCERT geometry + motion + drag) ── */
    const renderNewman = useCallback(() => {
        const cx = 400, cy = 400;
        const bondLen = 240;
        const circleR = 180;
        const atomR = 32;
        const hAtomR = 26;
        const frontAngles = [90, 210, 330];
        const rearAngles = frontAngles.map((a) => a + dihedralAngle);

        // Eclipsed strain wobble — tiny oscillation that scales with PE
        const strain = potentialEnergy / E_BARRIER;            // 0..1
        const wobble = strain * 2.2 * Math.sin(animT * 18);    // rapid oscillation when strained

        // Detect near-eclipsed alignment between specific front/rear H pairs (within 10° → alignment line)
        const alignmentPairs: Array<{ fAng: number; rAng: number; t: number }> = [];
        frontAngles.forEach((f, i) => {
            const r = rearAngles[i];
            const norm = ((r - f) % 360 + 360) % 360;
            const near = Math.min(norm, 360 - norm);
            if (near < 18) alignmentPairs.push({ fAng: f, rAng: r, t: 1 - near / 18 });
        });
        const cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-grab';
        return (
            <svg viewBox="0 0 800 800" className={`absolute inset-0 h-full w-full touch-none ${cursorClass}`}
                onPointerDown={(e) => beginRotateDrag(e, 'newman')}
                onPointerMove={(e) => moveRotateDrag(e, 'newman')}
                onPointerUp={endRotateDrag}
                onPointerCancel={endRotateDrag}
            >
                <defs>
                    <radialGradient id="hG" cx="35%" cy="30%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                    </radialGradient>
                    <radialGradient id="cFront" cx="40%" cy="35%">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </radialGradient>
                    <radialGradient id="cRear" cx="40%" cy="35%">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#475569" />
                    </radialGradient>
                    <radialGradient id="eCloud" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="rgba(59,130,246,0.35)" />
                        <stop offset="70%" stopColor="rgba(59,130,246,0.10)" />
                        <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                    </radialGradient>
                    <radialGradient id="strainGlow" cx="50%" cy="50%">
                        <stop offset="0%" stopColor={`rgba(220,38,38,${0.55 * strain})`} />
                        <stop offset="60%" stopColor={`rgba(220,38,38,${0.18 * strain})`} />
                        <stop offset="100%" stopColor="rgba(220,38,38,0)" />
                    </radialGradient>
                    <radialGradient id="grabHint" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="rgba(245,158,11,0.5)" />
                        <stop offset="100%" stopColor="rgba(245,158,11,0)" />
                    </radialGradient>
                </defs>

                {/* Rear C circle */}
                <circle cx={cx} cy={cy} r={circleR} fill="none" stroke="#94a3b8" strokeWidth="4" />

                {/* Alignment indicators — dotted lines connecting nearly-eclipsed H pairs (extra strain visual cue) */}
                {alignmentPairs.map((p, i) => {
                    const fRad = (p.fAng * Math.PI) / 180;
                    const rRad = (p.rAng * Math.PI) / 180;
                    const fx = cx + Math.cos(fRad) * bondLen;
                    const fy = cy - Math.sin(fRad) * bondLen;
                    const rx = cx + Math.cos(rRad) * bondLen;
                    const ry = cy - Math.sin(rRad) * bondLen;
                    return (
                        <line key={`al-${i}`} x1={fx} y1={fy} x2={rx} y2={ry} stroke="#dc2626" strokeWidth={2 + p.t * 3} strokeDasharray="4 4" opacity={0.5 + p.t * 0.4} />
                    );
                })}

                {/* Rear H bonds + atoms (drawn first) — grab affordance + strain wobble */}
                {rearAngles.map((angle, i) => {
                    const rad = ((angle + wobble) * Math.PI) / 180;
                    const hx = cx + Math.cos(rad) * bondLen;
                    const hy = cy - Math.sin(rad) * bondLen;
                    const edgeX = cx + Math.cos(rad) * circleR;
                    const edgeY = cy - Math.sin(rad) * circleR;
                    // Subtle grab hint pulse on rear atoms when not dragging
                    const hintR = isDragging ? 0 : 38 + 6 * Math.sin(animT * 2.6 + i);
                    return (
                        <g key={`r-${i}`}>
                            <line x1={edgeX} y1={edgeY} x2={hx} y2={hy} stroke="#94a3b8" strokeWidth="9" strokeLinecap="round" />
                            {!isDragging && hintR > 0 && (
                                <circle cx={hx} cy={hy} r={hintR} fill="url(#grabHint)" opacity={0.55} />
                            )}
                            {strain > 0.25 && <circle cx={hx} cy={hy} r={hAtomR + 22 + 6 * Math.sin(animT * 8)} fill="url(#strainGlow)" />}
                            {showElectronClouds && <circle cx={hx} cy={hy} r={60} fill="url(#eCloud)" />}
                            <circle cx={hx} cy={hy} r={hAtomR} fill="url(#hG)" stroke="#94a3b8" strokeWidth="2" />
                            <text x={hx} y={hy + 8} textAnchor="middle" className="select-none" fontSize="22" fontWeight="800" fill="#475569">H</text>
                        </g>
                    );
                })}

                {/* Front H bonds + atoms */}
                {frontAngles.map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const hx = cx + Math.cos(rad) * bondLen;
                    const hy = cy - Math.sin(rad) * bondLen;
                    return (
                        <g key={`f-${i}`}>
                            <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#0f172a" strokeWidth="11" strokeLinecap="round" />
                            {strain > 0.25 && <circle cx={hx} cy={hy} r={hAtomR + 22 + 6 * Math.sin(animT * 8 + 1.5)} fill="url(#strainGlow)" />}
                            {showElectronClouds && <circle cx={hx} cy={hy} r={60} fill="url(#eCloud)" />}
                            <circle cx={hx} cy={hy} r={hAtomR} fill="url(#hG)" stroke="#0f172a" strokeWidth="3" />
                            <text x={hx} y={hy + 8} textAnchor="middle" className="select-none" fontSize="22" fontWeight="800" fill="#0f172a">H</text>
                        </g>
                    );
                })}

                {/* Front carbon (point) */}
                <circle cx={cx} cy={cy} r={atomR} fill="url(#cFront)" stroke="#0f172a" strokeWidth="3" />
                <text x={cx} y={cy + 9} textAnchor="middle" className="select-none" fontSize="24" fontWeight="900" fill="#ffffff">C</text>

                {/* Labels for projection parts */}
                <text x={cx} y={cy + circleR + 56} textAnchor="middle" fontSize="16" fontWeight="700" fill="#64748b" className="select-none">Front C (fixed) — drawn as point</text>
                <text x={cx} y={56} textAnchor="middle" fontSize="16" fontWeight="700" fill="#64748b" className="select-none">Rear C (rotates) — drag to spin ↻</text>

                {/* Dihedral arc */}
                {(() => {
                    const arcR = 88;
                    const start = (frontAngles[0] * Math.PI) / 180;
                    const end = ((frontAngles[0] + dihedralAngle) * Math.PI) / 180;
                    const largeArc = dihedralAngle > 180 ? 1 : 0;
                    const sx = cx + Math.cos(start) * arcR;
                    const sy = cy - Math.sin(start) * arcR;
                    const ex = cx + Math.cos(end) * arcR;
                    const ey = cy - Math.sin(end) * arcR;
                    return (
                        <g>
                            <path d={`M ${sx} ${sy} A ${arcR} ${arcR} 0 ${largeArc} 0 ${ex} ${ey}`}
                                fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="8 5" />
                            <text x={cx + Math.cos((start + end) / 2) * (arcR + 30)} y={cy - Math.sin((start + end) / 2) * (arcR + 30)}
                                textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="900" fill="#d97706" className="select-none">{dihedralAngle.toFixed(0)}°</text>
                        </g>
                    );
                })()}

                {/* Drag hint banner (only shown when idle) */}
                {!isDragging && !autoRotate && (
                    <g transform={`translate(${cx} ${cy + circleR + 110})`} opacity={0.5 + 0.3 * Math.sin(animT * 2.2)}>
                        <rect x={-110} y={-16} width={220} height={32} rx={16} fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
                        <text x={0} y={5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#92400e" className="select-none">✋  Drag anywhere to rotate</text>
                    </g>
                )}
            </svg>
        );
    }, [dihedralAngle, showElectronClouds, isDragging, autoRotate, animT, potentialEnergy]);

    const renderSawhorse = useCallback(() => {
        const fcx = 280, fcy = 540;
        const rcx = 520, rcy = 260;
        const bondLen = 150;
        const hR = 22;
        const frontAngles = [150, 210, 270];
        const rearAngles = [30, 330, 270].map((a) => a + dihedralAngle);
        const projH = (cx: number, cy: number, angle: number, len: number, pf = 1) => {
            const rad = (angle * Math.PI) / 180;
            return { x: cx + Math.cos(rad) * len * pf, y: cy - Math.sin(rad) * len * 0.6 * pf };
        };
        const strain = potentialEnergy / E_BARRIER;
        const wobble = strain * 2.5 * Math.sin(animT * 18);
        const cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-grab';
        return (
            <svg viewBox="0 0 800 800" className={`absolute inset-0 h-full w-full touch-none ${cursorClass}`}
                onPointerDown={(e) => beginRotateDrag(e, 'sawhorse')}
                onPointerMove={(e) => moveRotateDrag(e, 'sawhorse')}
                onPointerUp={endRotateDrag}
                onPointerCancel={endRotateDrag}
            >
                <defs>
                    <radialGradient id="hGS" cx="35%" cy="30%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                    </radialGradient>
                    <radialGradient id="strainGlowS" cx="50%" cy="50%">
                        <stop offset="0%" stopColor={`rgba(220,38,38,${0.5 * strain})`} />
                        <stop offset="100%" stopColor="rgba(220,38,38,0)" />
                    </radialGradient>
                    <radialGradient id="grabHintS" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="rgba(245,158,11,0.45)" />
                        <stop offset="100%" stopColor="rgba(245,158,11,0)" />
                    </radialGradient>
                </defs>
                {/* C–C bond */}
                <line x1={fcx} y1={fcy} x2={rcx} y2={rcy} stroke="#475569" strokeWidth="13" strokeLinecap="round" />
                {/* Front H */}
                {frontAngles.map((angle, i) => {
                    const h = projH(fcx, fcy, angle, bondLen);
                    return (
                        <g key={`sf-${i}`}>
                            <line x1={fcx} y1={fcy} x2={h.x} y2={h.y} stroke="#0f172a" strokeWidth="9" strokeLinecap="round" />
                            {showElectronClouds && <circle cx={h.x} cy={h.y} r={48} fill="rgba(59,130,246,0.18)" />}
                            <circle cx={h.x} cy={h.y} r={hR} fill="url(#hGS)" stroke="#0f172a" strokeWidth="2.5" />
                            <text x={h.x} y={h.y + 7} textAnchor="middle" fontSize="20" fontWeight="800" fill="#0f172a" className="select-none">H</text>
                        </g>
                    );
                })}
                {/* Rear H — wobbles when strained, glows when grabable */}
                {rearAngles.map((angle, i) => {
                    const h = projH(rcx, rcy, angle + wobble, bondLen, 0.85);
                    const hintR = isDragging ? 0 : 32 + 5 * Math.sin(animT * 2.6 + i);
                    return (
                        <g key={`sr-${i}`}>
                            <line x1={rcx} y1={rcy} x2={h.x} y2={h.y} stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
                            {!isDragging && hintR > 0 && <circle cx={h.x} cy={h.y} r={hintR} fill="url(#grabHintS)" opacity={0.55} />}
                            {strain > 0.25 && <circle cx={h.x} cy={h.y} r={hR + 14 + 5 * Math.sin(animT * 8)} fill="url(#strainGlowS)" />}
                            {showElectronClouds && <circle cx={h.x} cy={h.y} r={48} fill="rgba(59,130,246,0.14)" />}
                            <circle cx={h.x} cy={h.y} r={hR} fill="url(#hGS)" stroke="#94a3b8" strokeWidth="2" />
                            <text x={h.x} y={h.y + 7} textAnchor="middle" fontSize="20" fontWeight="800" fill="#475569" className="select-none">H</text>
                        </g>
                    );
                })}
                {/* Carbons */}
                <circle cx={fcx} cy={fcy} r={28} fill="#0f172a" stroke="#000" strokeWidth="3" />
                <text x={fcx} y={fcy + 9} textAnchor="middle" fontSize="22" fontWeight="900" fill="#ffffff" className="select-none">C</text>
                <circle cx={rcx} cy={rcy} r={28} fill="#475569" stroke="#0f172a" strokeWidth="3" />
                <text x={rcx} y={rcy + 9} textAnchor="middle" fontSize="22" fontWeight="900" fill="#ffffff" className="select-none">C</text>
                {/* Labels */}
                <text x={fcx - 10} y={fcy + 65} textAnchor="middle" fontSize="16" fontWeight="700" fill="#64748b" className="select-none">Front C</text>
                <text x={rcx + 10} y={rcy - 50} textAnchor="middle" fontSize="16" fontWeight="700" fill="#64748b" className="select-none">Rear C ↔ drag</text>
                <text x={(fcx + rcx) / 2 + 30} y={(fcy + rcy) / 2 + 10} textAnchor="middle" fontSize="14" fontWeight="800" fill="#d97706" className="select-none">C–C bond (axis)</text>

                {/* Drag hint */}
                {!isDragging && !autoRotate && (
                    <g transform="translate(400 720)" opacity={0.5 + 0.3 * Math.sin(animT * 2.2)}>
                        <rect x={-130} y={-16} width={260} height={32} rx={16} fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
                        <text x={0} y={5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#92400e" className="select-none">✋  Drag left ↔ right to rotate rear C</text>
                    </g>
                )}
            </svg>
        );
    }, [dihedralAngle, showElectronClouds, isDragging, autoRotate, animT, potentialEnergy]);

    const render3D = useCallback(() => {
        const cx = 340, cy = 430;
        const ccBondLen = 175;
        const chBondLen = 125;
        const atomR = 32;
        const hR = 22;
        const camAngle = 25 * Math.PI / 180;
        const camTilt = 15 * Math.PI / 180;
        const rcx3d = cx + ccBondLen * Math.cos(camAngle);
        const rcy3d = cy - ccBondLen * Math.sin(camTilt) * 0.5;
        const frontAngles3D = [150, 270, 30];
        const rearAngles3D = frontAngles3D.map((a) => a + dihedralAngle);
        const projAtom = (bx: number, by: number, angle: number, len: number, depth = 0) => {
            const rad = (angle * Math.PI) / 180;
            return { x: bx + Math.cos(rad) * len * (1 - depth * 0.15), y: by - Math.sin(rad) * len * 0.65 };
        };
        const strain = potentialEnergy / E_BARRIER;
        const wobble = strain * 2.5 * Math.sin(animT * 18);
        const cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-grab';
        return (
            <svg viewBox="0 0 800 800" className={`absolute inset-0 h-full w-full touch-none ${cursorClass}`}
                onPointerDown={(e) => beginRotateDrag(e, '3d')}
                onPointerMove={(e) => moveRotateDrag(e, '3d')}
                onPointerUp={endRotateDrag}
                onPointerCancel={endRotateDrag}
            >
                <defs>
                    <radialGradient id="hG3" cx="35%" cy="30%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                    </radialGradient>
                    <radialGradient id="strainGlow3" cx="50%" cy="50%">
                        <stop offset="0%" stopColor={`rgba(220,38,38,${0.5 * strain})`} />
                        <stop offset="100%" stopColor="rgba(220,38,38,0)" />
                    </radialGradient>
                    <radialGradient id="grabHint3" cx="50%" cy="50%">
                        <stop offset="0%" stopColor="rgba(245,158,11,0.45)" />
                        <stop offset="100%" stopColor="rgba(245,158,11,0)" />
                    </radialGradient>
                </defs>
                {/* C–C bond */}
                <line x1={cx} y1={cy} x2={rcx3d} y2={rcy3d} stroke="#475569" strokeWidth="14" strokeLinecap="round" />
                {/* Rear — wobble + grab affordance */}
                {rearAngles3D.map((angle, i) => {
                    const h = projAtom(rcx3d, rcy3d, angle + wobble, chBondLen, 0.3);
                    const hintR = isDragging ? 0 : 34 + 5 * Math.sin(animT * 2.6 + i);
                    return (
                        <g key={`r3-${i}`}>
                            <line x1={rcx3d} y1={rcy3d} x2={h.x} y2={h.y} stroke="#94a3b8" strokeWidth="9" strokeLinecap="round" />
                            {!isDragging && hintR > 0 && <circle cx={h.x} cy={h.y} r={hintR} fill="url(#grabHint3)" opacity={0.55} />}
                            {strain > 0.25 && <circle cx={h.x} cy={h.y} r={hR + 14 + 5 * Math.sin(animT * 8)} fill="url(#strainGlow3)" />}
                            {showElectronClouds && <circle cx={h.x} cy={h.y} r={48} fill="rgba(59,130,246,0.15)" />}
                            <circle cx={h.x} cy={h.y} r={hR} fill="url(#hG3)" stroke="#94a3b8" strokeWidth="2" />
                            <text x={h.x} y={h.y + 7} textAnchor="middle" fontSize="20" fontWeight="800" fill="#475569" className="select-none">H</text>
                        </g>
                    );
                })}
                <circle cx={rcx3d} cy={rcy3d} r={atomR} fill="#475569" stroke="#0f172a" strokeWidth="3" />
                <text x={rcx3d} y={rcy3d + 9} textAnchor="middle" fontSize="22" fontWeight="900" fill="#ffffff" className="select-none">C</text>
                {/* Front */}
                {frontAngles3D.map((angle, i) => {
                    const h = projAtom(cx, cy, angle, chBondLen);
                    return (
                        <g key={`f3-${i}`}>
                            <line x1={cx} y1={cy} x2={h.x} y2={h.y} stroke="#0f172a" strokeWidth="10" strokeLinecap="round" />
                            {showElectronClouds && <circle cx={h.x} cy={h.y} r={50} fill="rgba(59,130,246,0.22)" />}
                            <circle cx={h.x} cy={h.y} r={hR} fill="url(#hG3)" stroke="#0f172a" strokeWidth="3" />
                            <text x={h.x} y={h.y + 7} textAnchor="middle" fontSize="20" fontWeight="800" fill="#0f172a" className="select-none">H</text>
                        </g>
                    );
                })}
                <circle cx={cx} cy={cy} r={atomR} fill="#0f172a" stroke="#000" strokeWidth="3" />
                <text x={cx} y={cy + 9} textAnchor="middle" fontSize="22" fontWeight="900" fill="#ffffff" className="select-none">C</text>

                {/* Drag hint */}
                {!isDragging && !autoRotate && (
                    <g transform="translate(400 740)" opacity={0.5 + 0.3 * Math.sin(animT * 2.2)}>
                        <rect x={-130} y={-16} width={260} height={32} rx={16} fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
                        <text x={0} y={5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#92400e" className="select-none">✋  Drag left ↔ right to spin model</text>
                    </g>
                )}
            </svg>
        );
    }, [dihedralAngle, showElectronClouds, isDragging, autoRotate, animT, potentialEnergy]);

    /* ── Energy curve SVG (used in LEFT aside) ────────────────── */
    const energyCurveSvg = () => {
        const gw = 320, gh = 200, padL = 36, padR = 12, padT = 14, padB = 32;
        const plotW = gw - padL - padR;
        const plotH = gh - padT - padB;
        const eMax = E_BARRIER;
        const pts: string[] = [];
        for (let deg = 0; deg <= 360; deg += 2) {
            const e = (eMax / 2) * (1 - Math.cos(3 * (deg * Math.PI) / 180));
            const x = padL + (deg / 360) * plotW;
            const y = padT + plotH - (e / (eMax + 1.5)) * plotH;
            pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
        const norm = ((dihedralAngle % 360) + 360) % 360;
        const curX = padL + (norm / 360) * plotW;
        const curY = padT + plotH - (potentialEnergy / (eMax + 1.5)) * plotH;
        return (
            <svg viewBox={`0 0 ${gw} ${gh}`} className="h-[200px] w-full">
                {/* Axes */}
                <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#475569" strokeWidth="1.2" />
                <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#475569" strokeWidth="1.2" />
                {/* Gridlines: vertical at 60° intervals */}
                {[60, 120, 180, 240, 300].map((deg) => {
                    const x = padL + (deg / 360) * plotW;
                    return <line key={deg} x1={x} y1={padT} x2={x} y2={padT + plotH} stroke="rgba(15,23,42,0.08)" strokeWidth="1" />;
                })}
                {/* Y ticks */}
                {[0, 6.25, 12.5].map((e) => {
                    const y = padT + plotH - (e / (eMax + 1.5)) * plotH;
                    return (
                        <g key={e}>
                            <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="#475569" strokeWidth="1" />
                            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fontWeight="700" fill="#475569">{e.toFixed(2)}</text>
                        </g>
                    );
                })}
                {/* Curve */}
                <polyline points={pts.join(' ')} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinejoin="round" />
                {/* Staggered/Eclipsed markers */}
                {[0, 120, 240, 360].map((deg) => {
                    const x = padL + (deg / 360) * plotW;
                    return <circle key={`e${deg}`} cx={x} cy={padT + plotH - (eMax / (eMax + 1.5)) * plotH} r={3.5} fill="#dc2626" stroke="#fff" strokeWidth="1" />;
                })}
                {[60, 180, 300].map((deg) => {
                    const x = padL + (deg / 360) * plotW;
                    return <circle key={`s${deg}`} cx={x} cy={padT + plotH} r={3.5} fill="#16a34a" stroke="#fff" strokeWidth="1" />;
                })}
                {/* Current position */}
                <line x1={curX} y1={padT} x2={curX} y2={padT + plotH} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
                <circle cx={curX} cy={curY} r={5.5} fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                {/* X ticks/labels */}
                {[0, 60, 120, 180, 240, 300, 360].map((deg) => {
                    const x = padL + (deg / 360) * plotW;
                    return <text key={`x${deg}`} x={x} y={padT + plotH + 14} textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">{deg}°</text>;
                })}
                {/* Y axis label */}
                <text x={padL + plotW / 2} y={gh - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#475569">Dihedral angle θ</text>
                <text x={10} y={padT + plotH / 2} textAnchor="middle" fontSize="10" fontWeight="700" fill="#475569" transform={`rotate(-90 10 ${padT + plotH / 2})`}>PE (kJ/mol)</text>
            </svg>
        );
    };

    /* ── Left aside: energy graph + conformation key ──────────── */
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-950">Potential Energy vs θ</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">E(θ) = (12.5/2)·(1 − cos 3θ) · NCERT §9.2.2</div>
                    <div className="mt-2">{energyCurveSvg()}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />staggered (min)</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-600" />eclipsed (max)</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />current</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-950">Conformation key</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">Threefold periodic — every 120° of rotation</div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2">
                            <div className="text-emerald-700">60° · 180° · 300°</div>
                            <div className="text-emerald-900">staggered</div>
                            <div className="font-mono text-[10px] text-emerald-700">E ≈ 0 kJ/mol</div>
                        </div>
                        <div className="rounded-lg border border-red-200 bg-red-50 px-2 py-2">
                            <div className="text-red-700">0° · 120° · 240°</div>
                            <div className="text-red-900">eclipsed</div>
                            <div className="font-mono text-[10px] text-red-700">E ≈ 12.5</div>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2">
                            <div className="text-amber-700">elsewhere</div>
                            <div className="text-amber-900">skew</div>
                            <div className="font-mono text-[10px] text-amber-700">0 &lt; E &lt; 12.5</div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

    /* ── Right aside: theory + live values ───────────────────── */
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">Conformations of ethane</div>
                    <div className="mt-0.5 text-xs font-semibold text-amber-700">NCERT §9.2.2 · Figs 9.2, 9.3</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-amber-900">
                        <p>Rotation about the C–C single bond gives infinite spatial arrangements of H atoms — called <b>conformers</b> or <b>rotamers</b>.</p>
                        <p>The two extremes:</p>
                        <p>• <b>Staggered</b> — H atoms farthest apart; least torsional strain; most stable.</p>
                        <p>• <b>Eclipsed</b> — H atoms aligned; most torsional strain; least stable.</p>
                        <p>Torsional strain comes from C–H electron-cloud repulsion. Barrier ≈ <b>12.5 kJ/mol</b>, small enough that rotation is almost free at ordinary temperatures and the conformers cannot be isolated.</p>
                        <p className="text-xs">Bond lengths and bond angles stay the same across all conformations.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-base font-extrabold text-slate-900">Live values</div>
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <ValueChip label="Dihedral θ" value={`${dihedralAngle.toFixed(0)}°`} tone="amber" />
                        <ValueChip label="Conformation" value={conformationType} tone={conformationType === 'staggered' ? 'emerald' : conformationType === 'eclipsed' ? 'red' : 'amber'} />
                        <ValueChip label="PE (E)" value={`${potentialEnergy.toFixed(2)} kJ/mol`} tone="blue" />
                        <ValueChip label="Barrier ΔE" value={`${E_BARRIER.toFixed(1)} kJ/mol`} tone="red" />
                        <ValueChip label="Stability" value={conformationType === 'staggered' ? 'most stable' : conformationType === 'eclipsed' ? 'least stable' : 'intermediate'} tone={conformationType === 'staggered' ? 'emerald' : conformationType === 'eclipsed' ? 'red' : 'amber'} />
                        <ValueChip label="View" value={viewMode} tone="slate" />
                    </div>
                </div>
            </div>
        </aside>
    );

    /* ── Simulation wrapper (white) ──────────────────────────── */
    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                {/* Faint grid background */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
                {/* Title strip */}
                <div className="absolute left-6 top-4 z-10 pointer-events-none">
                    <div className="text-lg font-extrabold text-slate-900">Conformations of Ethane (C₂H₆)</div>
                    <div className="text-xs font-semibold text-slate-500">NCERT §9.2.2 · Hydrocarbons (Unit 9)</div>
                </div>
                {/* Phase label, top-right (next to controls) */}
                <div className="absolute right-32 top-6 z-10 pointer-events-none flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800 shadow">{viewMode === 'newman' ? 'Newman projection' : viewMode === 'sawhorse' ? 'Sawhorse projection' : 'Ball-and-stick (3D)'}</span>
                    {isDragging && (
                        <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-extrabold text-violet-800 shadow animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-600" /> ROTATING
                        </span>
                    )}
                </div>

                {/* The molecule SVG, centred — draggable surface */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative h-[640px] w-[640px]">
                        {viewMode === 'newman' && renderNewman()}
                        {viewMode === 'sawhorse' && renderSawhorse()}
                        {viewMode === '3d' && render3D()}
                    </div>
                </div>

                {/* Hint line near bottom */}
                <div className="absolute inset-x-0 bottom-2 z-10 mx-auto max-w-3xl px-4 pointer-events-none">
                    <div className={`mx-auto flex items-center gap-2 rounded-md border px-3 py-1.5 text-[12px] font-bold ${conformationType === 'staggered' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : conformationType === 'eclipsed' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                        <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-extrabold">HINT</span>
                        <span>{message}</span>
                    </div>
                </div>

                {/* Pause / Reset — top-right of canvas */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                    <button onClick={() => setPaused((p) => !p)} disabled={!autoRotate}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={paused ? 'Play (resume auto-rotate)' : 'Pause auto-rotate'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    /* ── Bottom controls — view mode, slider, jump-to, toggles ── */
    const controlsCombo = (
        <div className="w-full p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
                <FlaskConical size={18} className="text-amber-600" />
                <span className="text-sm font-extrabold uppercase tracking-wide">Ethane Conformations Bench</span>
            </div>

            {/* View mode + toggles */}
            <div className="grid gap-2 md:grid-cols-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">View:</span>
                    {([
                        { mode: 'newman' as const, label: 'Newman' },
                        { mode: 'sawhorse' as const, label: 'Sawhorse' },
                        { mode: '3d' as const, label: '3D Model' },
                    ]).map(({ mode, label }) => (
                        <button key={mode} onClick={() => setViewMode(mode)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition-colors ${viewMode === mode ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <button onClick={() => setShowElectronClouds((v) => !v)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-colors ${showElectronClouds ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {showElectronClouds ? <Eye size={14} /> : <EyeOff size={14} />} e⁻ clouds
                    </button>
                    <button onClick={() => { setAutoRotate((v) => !v); setPaused(false); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-colors ${autoRotate ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        <RotateCw size={14} /> {autoRotate ? 'Stop auto-rotate' : 'Auto-rotate'}
                    </button>
                </div>
            </div>

            {/* Dihedral slider */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">Dihedral angle θ</span>
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-xs font-extrabold text-amber-800">{dihedralAngle.toFixed(0)}°</span>
                </div>
                <input
                    type="range" min={0} max={360} step={1}
                    value={dihedralAngle}
                    onChange={(e) => { setDihedralAngle(Number(e.target.value)); setAutoRotate(false); }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg accent-amber-500"
                    style={{
                        background: `linear-gradient(90deg,
                            #dc2626 0%, #dc2626 4%,
                            #16a34a 16%, #16a34a 18%,
                            #dc2626 32%, #dc2626 34%,
                            #16a34a 49%, #16a34a 51%,
                            #dc2626 65%, #dc2626 67%,
                            #16a34a 82%, #16a34a 84%,
                            #dc2626 96%, #dc2626 100%)`,
                    }}
                />
            </div>

            {/* Quick jump */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">Jump to:</span>
                {[0, 60, 120, 180, 240, 300].map((angle) => {
                    const isEcl = [0, 120, 240].includes(angle);
                    return (
                        <button key={angle} onClick={() => { setDihedralAngle(angle); setAutoRotate(false); }}
                            className={`rounded-md border px-2.5 py-1 text-xs font-extrabold transition-colors ${isEcl ? 'border-red-300 bg-white text-red-800 hover:bg-red-50' : 'border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50'}`}>
                            {angle}° · {isEcl ? 'eclipsed' : 'staggered'}
                        </button>
                    );
                })}
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

/* ── Sub-components ──────────────────────────────────────────── */
function ValueChip({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'slate' | 'red' | 'emerald' | 'blue' }) {
    const palette: Record<string, { bg: string; text: string }> = {
        amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
        slate: { bg: 'bg-slate-50', text: 'text-slate-800' },
        red: { bg: 'bg-red-50', text: 'text-red-700' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    };
    const p = palette[tone];
    return (
        <div className={`rounded-lg border border-slate-100 ${p.bg} px-3 py-2.5`}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className={`mt-1 font-mono text-sm font-extrabold ${p.text}`}>{value}</div>
        </div>
    );
}

export default EthaneConformationsCanvas;
