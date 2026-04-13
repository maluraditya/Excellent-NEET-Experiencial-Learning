import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCw, Eye, Zap, ArrowRight, RefreshCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

type Phase = 1 | 2 | 3 | 4;

interface GeometricalIsomerismProps {
    topic: Topic;
    onExit: () => void;
}

const GeometricalIsomerismCanvas: React.FC<GeometricalIsomerismProps> = ({ topic, onExit }) => {
    const [phase, setPhase] = useState<Phase>(1);
    const [twistAngle, setTwistAngle] = useState(0); // 0-360 for single bond
    const [showDipoles, setShowDipoles] = useState(false);
    const [piWarning, setPiWarning] = useState(false);
    const [twistAttempts, setTwistAttempts] = useState(0);
    const [autoAnimate, setAutoAnimate] = useState(false);
    const animRef = useRef<number | null>(null);
    const [isomerType, setIsomerType] = useState<'cis' | 'trans'>('cis');

    // Phase 1: Free rotation animation for single bond
    useEffect(() => {
        if (autoAnimate && phase === 1) {
            const animate = () => {
                setTwistAngle(prev => (prev + 1) % 360);
                animRef.current = requestAnimationFrame(animate);
            };
            animRef.current = requestAnimationFrame(animate);
        }
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [autoAnimate, phase]);

    // Phase 2: Attempt to twist double bond
    const handleDoubleBondTwist = useCallback((angle: number) => {
        if (phase !== 2) return;
        setTwistAttempts(prev => prev + 1);
        if (Math.abs(angle) > 15) {
            setPiWarning(true);
            setTimeout(() => setPiWarning(false), 2000);
        }
    }, [phase]);

    const systemMessages: Record<Phase, string> = {
        1: 'Phase 1: Free Rotation in Alkanes — Spin the right carbon of 1,2-dichloroethane. The single σ bond allows 360° rotation!',
        2: 'Phase 2: Restricted Rotation — Try twisting the double bond of 1,2-dichloroethene. The π bond prevents rotation!',
        3: `Phase 3: Cis-Isomer — Both Cl atoms on the SAME side. Dipole vectors ADD UP → Net μ > 0 (Polar molecule).`,
        4: `Phase 4: Trans-Isomer — Cl atoms on OPPOSITE sides. Dipole vectors CANCEL → Net μ = 0 (Non-polar molecule).`
    };

    const phaseColors: Record<Phase, { bg: string; border: string; text: string }> = {
        1: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
        2: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
        3: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
        4: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' }
    };

    // Phase 1: Single bond molecule (1,2-dichloroethane)
    const renderSingleBond = () => {
        const cx = 250, cy = 250;
        const bondLen = 80;
        const atomR = 20;
        const hR = 13;
        const clR = 17;

        // Left carbon fixed, right carbon rotates
        const lcx = cx - 50, lcy = cy;
        const rcx = cx + 50, rcy = cy;

        // Left carbon bonds: Cl up, H down (fixed)
        const leftClPos = { x: lcx - 50, y: lcy - 50 };
        const leftHPos = { x: lcx - 50, y: lcy + 50 };

        // Right carbon bonds: rotate with twist
        const rad = (twistAngle * Math.PI) / 180;
        const rightClPos = { x: rcx + Math.cos(rad - Math.PI / 3) * 65, y: rcy + Math.sin(rad - Math.PI / 3) * 65 };
        const rightHPos = { x: rcx + Math.cos(rad + Math.PI / 3) * 65, y: rcy + Math.sin(rad + Math.PI / 3) * 65 };

        return (
            <svg viewBox="0 0 500 500" className="w-full h-full">
                <defs>
                    <radialGradient id="carbonGrad" cx="35%" cy="30%"><stop offset="0%" stopColor="#6b7280" /><stop offset="100%" stopColor="#1f2937" /></radialGradient>
                    <radialGradient id="clGrad" cx="35%" cy="30%"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#15803d" /></radialGradient>
                    <radialGradient id="hGrad" cx="35%" cy="30%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#d1d5db" /></radialGradient>
                    <filter id="glowGreen"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>

                {/* C-C single bond */}
                <line x1={lcx} y1={lcy} x2={rcx} y2={rcy} stroke="#6b7280" strokeWidth="6" strokeLinecap="round" />

                {/* Left bonds */}
                <line x1={lcx} y1={lcy} x2={leftClPos.x} y2={leftClPos.y} stroke="#4b5563" strokeWidth="4" />
                <line x1={lcx} y1={lcy} x2={leftHPos.x} y2={leftHPos.y} stroke="#4b5563" strokeWidth="4" />

                {/* Right bonds */}
                <line x1={rcx} y1={rcy} x2={rightClPos.x} y2={rightClPos.y} stroke="#4b5563" strokeWidth="4" />
                <line x1={rcx} y1={rcy} x2={rightHPos.x} y2={rightHPos.y} stroke="#4b5563" strokeWidth="4" />

                {/* Atoms */}
                <circle cx={leftClPos.x} cy={leftClPos.y} r={clR} fill="url(#clGrad)" stroke="#166534" strokeWidth="2" filter="url(#glowGreen)" />
                <text x={leftClPos.x} y={leftClPos.y + 2} textAnchor="middle" dominantBaseline="central" className="text-[13px] font-bold fill-white select-none pointer-events-none">Cl</text>
                <circle cx={leftHPos.x} cy={leftHPos.y} r={hR} fill="url(#hGrad)" stroke="#4b5563" strokeWidth="1.5" />
                <text x={leftHPos.x} y={leftHPos.y + 1} textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold fill-slate-700 select-none pointer-events-none">H</text>

                <circle cx={rightClPos.x} cy={rightClPos.y} r={clR} fill="url(#clGrad)" stroke="#166534" strokeWidth="2" filter="url(#glowGreen)" />
                <text x={rightClPos.x} y={rightClPos.y + 2} textAnchor="middle" dominantBaseline="central" className="text-[13px] font-bold fill-white select-none pointer-events-none">Cl</text>
                <circle cx={rightHPos.x} cy={rightHPos.y} r={hR} fill="url(#hGrad)" stroke="#4b5563" strokeWidth="1.5" />
                <text x={rightHPos.x} y={rightHPos.y + 1} textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold fill-slate-700 select-none pointer-events-none">H</text>

                {/* Carbons */}
                <circle cx={lcx} cy={lcy} r={atomR} fill="url(#carbonGrad)" stroke="#111827" strokeWidth="2" />
                <text x={lcx} y={lcy + 2} textAnchor="middle" dominantBaseline="central" className="text-[15px] font-bold fill-white select-none pointer-events-none">C</text>
                <circle cx={rcx} cy={rcy} r={atomR} fill="url(#carbonGrad)" stroke="#111827" strokeWidth="2" />
                <text x={rcx} y={rcy + 2} textAnchor="middle" dominantBaseline="central" className="text-[15px] font-bold fill-white select-none pointer-events-none">C</text>

                {/* Rotation arrow */}
                <text x={rcx} y={rcy + 45} textAnchor="middle" className="text-[12px] fill-blue-400 select-none">↻ {twistAngle.toFixed(0)}°</text>

                {/* Bond type label */}
                <text x={cx} y={cy - 70} textAnchor="middle" className="text-[14px] font-bold fill-slate-400 select-none">Single Bond (σ only)</text>
                <text x={cx} y={cy - 50} textAnchor="middle" className="text-[11px] fill-blue-400 select-none">✓ FREE ROTATION</text>

                {/* Molecule name */}
                <text x={cx} y={460} textAnchor="middle" className="text-[13px] fill-slate-500 select-none">1,2-Dichloroethane (ClCH₂—CH₂Cl)</text>
            </svg>
        );
    };

    // Phase 2: Double bond with restricted rotation
    const renderDoubleBond = () => {
        const cx = 250, cy = 250;
        const lcx = cx - 55, lcy = cy;
        const rcx = cx + 55, rcy = cy;
        const clR = 17, hR = 13, atomR = 20;

        // Fixed positions (no rotation possible)
        const leftClPos = { x: lcx - 55, y: lcy - 55 };
        const leftHPos = { x: lcx - 55, y: lcy + 55 };
        const rightClPos = { x: rcx + 55, y: rcy - 55 };
        const rightHPos = { x: rcx + 55, y: rcy + 55 };

        return (
            <svg viewBox="0 0 500 500" className="w-full h-full">
                <defs>
                    <radialGradient id="carbonGrad2" cx="35%" cy="30%"><stop offset="0%" stopColor="#6b7280" /><stop offset="100%" stopColor="#1f2937" /></radialGradient>
                    <radialGradient id="clGrad2" cx="35%" cy="30%"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#15803d" /></radialGradient>
                    <radialGradient id="hGrad2" cx="35%" cy="30%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#d1d5db" /></radialGradient>
                </defs>

                {/* C=C double bond: σ + π */}
                <line x1={lcx} y1={lcy - 5} x2={rcx} y2={rcy - 5} stroke="#6b7280" strokeWidth="5" strokeLinecap="round" />
                <line x1={lcx} y1={lcy + 5} x2={rcx} y2={rcy + 5} stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeDasharray={piWarning ? "8 4" : "none"} className={piWarning ? "animate-pulse" : ""} />

                {/* π bond label */}
                <text x={cx} y={lcy + 22} textAnchor="middle" className="text-[10px] fill-red-400 select-none">π bond</text>
                <text x={cx} y={lcy - 15} textAnchor="middle" className="text-[10px] fill-slate-500 select-none">σ bond</text>

                {/* Bonds to atoms */}
                <line x1={lcx} y1={lcy} x2={leftClPos.x} y2={leftClPos.y} stroke="#4b5563" strokeWidth="4" />
                <line x1={lcx} y1={lcy} x2={leftHPos.x} y2={leftHPos.y} stroke="#4b5563" strokeWidth="4" />
                <line x1={rcx} y1={rcy} x2={rightClPos.x} y2={rightClPos.y} stroke="#4b5563" strokeWidth="4" />
                <line x1={rcx} y1={rcy} x2={rightHPos.x} y2={rightHPos.y} stroke="#4b5563" strokeWidth="4" />

                {/* Atoms */}
                <circle cx={leftClPos.x} cy={leftClPos.y} r={clR} fill="url(#clGrad2)" stroke="#166534" strokeWidth="2" />
                <text x={leftClPos.x} y={leftClPos.y + 2} textAnchor="middle" dominantBaseline="central" className="text-[13px] font-bold fill-white select-none pointer-events-none">Cl</text>
                <circle cx={leftHPos.x} cy={leftHPos.y} r={hR} fill="url(#hGrad2)" stroke="#4b5563" strokeWidth="1.5" />
                <text x={leftHPos.x} y={leftHPos.y + 1} textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold fill-slate-700 select-none pointer-events-none">H</text>

                <circle cx={rightClPos.x} cy={rightClPos.y} r={clR} fill="url(#clGrad2)" stroke="#166534" strokeWidth="2" />
                <text x={rightClPos.x} y={rightClPos.y + 2} textAnchor="middle" dominantBaseline="central" className="text-[13px] font-bold fill-white select-none pointer-events-none">Cl</text>
                <circle cx={rightHPos.x} cy={rightHPos.y} r={hR} fill="url(#hGrad2)" stroke="#4b5563" strokeWidth="1.5" />
                <text x={rightHPos.x} y={rightHPos.y + 1} textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold fill-slate-700 select-none pointer-events-none">H</text>

                {/* Carbons */}
                <circle cx={lcx} cy={lcy} r={atomR} fill="url(#carbonGrad2)" stroke="#111827" strokeWidth="2" />
                <text x={lcx} y={lcy + 2} textAnchor="middle" dominantBaseline="central" className="text-[15px] font-bold fill-white select-none pointer-events-none">C</text>
                <circle cx={rcx} cy={rcy} r={atomR} fill="url(#carbonGrad2)" stroke="#111827" strokeWidth="2" />
                <text x={rcx} y={rcy + 2} textAnchor="middle" dominantBaseline="central" className="text-[15px] font-bold fill-white select-none pointer-events-none">C</text>

                {/* Lock icon + labels */}
                <text x={cx} y={cy - 80} textAnchor="middle" className="text-[14px] font-bold fill-slate-400 select-none">Double Bond (σ + π)</text>
                <text x={cx} y={cy - 60} textAnchor="middle" className="text-[11px] fill-red-400 select-none">🔒 ROTATION LOCKED</text>

                {/* π warning */}
                {piWarning && (
                    <g>
                        <rect x={cx - 130} y={cy + 60} width="260" height="40" rx="10" fill="#7f1d1d" opacity="0.95" />
                        <text x={cx} y={cy + 85} textAnchor="middle" className="text-[13px] font-bold fill-red-300 select-none">⚠️ WARNING: π-Bond Broken!</text>
                    </g>
                )}

                <text x={cx} y={460} textAnchor="middle" className="text-[13px] fill-slate-500 select-none">1,2-Dichloroethene (ClHC=CHCl)</text>
            </svg>
        );
    };

    // Phase 3 & 4: Cis and Trans with dipole vectors
    const renderCisTrans = (isCis: boolean) => {
        const cx = 250, cy = 220;
        const lcx = cx - 60, lcy = cy;
        const rcx = cx + 60, rcy = cy;
        const clR = 17, hR = 13, atomR = 20;

        // Cis: both Cl on top. Trans: Cl top-left, Cl bottom-right
        const leftClPos = { x: lcx - 55, y: lcy - 55 };
        const leftHPos = { x: lcx - 55, y: lcy + 55 };
        const rightClPos = isCis
            ? { x: rcx + 55, y: rcy - 55 }  // same side as left Cl
            : { x: rcx + 55, y: rcy + 55 }; // opposite side
        const rightHPos = isCis
            ? { x: rcx + 55, y: rcy + 55 }
            : { x: rcx + 55, y: rcy - 55 };

        // Dipole vectors
        const dipoleLen = 50;

        return (
            <svg viewBox="0 0 500 480" className="w-full h-full">
                <defs>
                    <radialGradient id="cg" cx="35%" cy="30%"><stop offset="0%" stopColor="#6b7280" /><stop offset="100%" stopColor="#1f2937" /></radialGradient>
                    <radialGradient id="clg" cx="35%" cy="30%"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#15803d" /></radialGradient>
                    <radialGradient id="hg" cx="35%" cy="30%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#d1d5db" /></radialGradient>
                    <marker id="arrowRed" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#ef4444" /></marker>
                    <marker id="arrowGreen" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#22c55e" /></marker>
                    <marker id="arrowNet" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto"><path d="M0,0 L10,3.5 L0,7 Z" fill="#f59e0b" /></marker>
                </defs>

                {/* C=C double bond */}
                <line x1={lcx} y1={lcy - 5} x2={rcx} y2={rcy - 5} stroke="#6b7280" strokeWidth="5" strokeLinecap="round" />
                <line x1={lcx} y1={lcy + 5} x2={rcx} y2={rcy + 5} stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />

                {/* Bonds */}
                <line x1={lcx} y1={lcy} x2={leftClPos.x} y2={leftClPos.y} stroke="#4b5563" strokeWidth="4" />
                <line x1={lcx} y1={lcy} x2={leftHPos.x} y2={leftHPos.y} stroke="#4b5563" strokeWidth="4" />
                <line x1={rcx} y1={rcy} x2={rightClPos.x} y2={rightClPos.y} stroke="#4b5563" strokeWidth="4" />
                <line x1={rcx} y1={rcy} x2={rightHPos.x} y2={rightHPos.y} stroke="#4b5563" strokeWidth="4" />

                {/* Dipole vectors */}
                {showDipoles && (
                    <g>
                        {/* Left C→Cl vector */}
                        <line x1={lcx} y1={lcy} x2={lcx + (leftClPos.x - lcx) * 0.8} y2={lcy + (leftClPos.y - lcy) * 0.8}
                            stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowRed)" opacity="0.9" />
                        {/* Right C→Cl vector */}
                        <line x1={rcx} y1={rcy} x2={rcx + (rightClPos.x - rcx) * 0.8} y2={rcy + (rightClPos.y - rcy) * 0.8}
                            stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowRed)" opacity="0.9" />

                        {/* Net resultant */}
                        {isCis ? (
                            <g>
                                {/* Cis: net upward */}
                                <line x1={cx} y1={cy + 10} x2={cx} y2={cy - 70}
                                    stroke="#f59e0b" strokeWidth="4" markerEnd="url(#arrowNet)" opacity="0.9" />
                                <text x={cx + 15} y={cy - 45} className="text-[11px] font-bold fill-amber-400 select-none">Net μ</text>
                            </g>
                        ) : (
                            <g>
                                {/* Trans: vectors cancel - show X */}
                                <line x1={cx - 15} y1={cy - 15} x2={cx + 15} y2={cy + 15} stroke="#ef4444" strokeWidth="3" opacity="0.7" />
                                <line x1={cx + 15} y1={cy - 15} x2={cx - 15} y2={cy + 15} stroke="#ef4444" strokeWidth="3" opacity="0.7" />
                                <text x={cx} y={cy + 35} textAnchor="middle" className="text-[11px] font-bold fill-red-400 select-none">μ = 0 (cancelled)</text>
                            </g>
                        )}
                    </g>
                )}

                {/* Atoms */}
                <circle cx={leftClPos.x} cy={leftClPos.y} r={clR} fill="url(#clg)" stroke="#166534" strokeWidth="2" />
                <text x={leftClPos.x} y={leftClPos.y + 2} textAnchor="middle" dominantBaseline="central" className="text-[13px] font-bold fill-white select-none pointer-events-none">Cl</text>
                <circle cx={leftHPos.x} cy={leftHPos.y} r={hR} fill="url(#hg)" stroke="#4b5563" strokeWidth="1.5" />
                <text x={leftHPos.x} y={leftHPos.y + 1} textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold fill-slate-700 select-none pointer-events-none">H</text>

                <circle cx={rightClPos.x} cy={rightClPos.y} r={clR} fill="url(#clg)" stroke="#166534" strokeWidth="2" />
                <text x={rightClPos.x} y={rightClPos.y + 2} textAnchor="middle" dominantBaseline="central" className="text-[13px] font-bold fill-white select-none pointer-events-none">Cl</text>
                <circle cx={rightHPos.x} cy={rightHPos.y} r={hR} fill="url(#hg)" stroke="#4b5563" strokeWidth="1.5" />
                <text x={rightHPos.x} y={rightHPos.y + 1} textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold fill-slate-700 select-none pointer-events-none">H</text>

                <circle cx={lcx} cy={lcy} r={atomR} fill="url(#cg)" stroke="#111827" strokeWidth="2" />
                <text x={lcx} y={lcy + 2} textAnchor="middle" dominantBaseline="central" className="text-[15px] font-bold fill-white select-none pointer-events-none">C</text>
                <circle cx={rcx} cy={rcy} r={atomR} fill="url(#cg)" stroke="#111827" strokeWidth="2" />
                <text x={rcx} y={rcy + 2} textAnchor="middle" dominantBaseline="central" className="text-[15px] font-bold fill-white select-none pointer-events-none">C</text>

                {/* Isomer label */}
                <text x={cx} y={55} textAnchor="middle" className="text-[18px] font-bold fill-white select-none">
                    {isCis ? 'Cis-1,2-Dichloroethene' : 'Trans-1,2-Dichloroethene'}
                </text>
                <text x={cx} y={78} textAnchor="middle" className={`text-[12px] font-bold select-none ${isCis ? 'fill-emerald-400' : 'fill-amber-400'}`}>
                    {isCis ? 'Both Cl on SAME side → Polar (μ = 1.90 D)' : 'Cl on OPPOSITE sides → Non-Polar (μ = 0 D)'}
                </text>

                {/* Property dashboard */}
                <rect x={30} y={370} width="440" height="90" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="1" opacity="0.9" />
                <text x={cx} y={395} textAnchor="middle" className="text-[11px] font-bold fill-slate-400 uppercase tracking-widest select-none">Property Dashboard</text>
                <line x1={50} y1={405} x2={450} y2={405} stroke="#334155" strokeWidth="0.5" />

                {/* Properties row */}
                <text x={90} y={425} textAnchor="middle" className="text-[10px] fill-slate-500 select-none">Dipole (μ)</text>
                <text x={90} y={445} textAnchor="middle" className={`text-[16px] font-bold select-none ${isCis ? 'fill-emerald-400' : 'fill-red-400'}`}>
                    {isCis ? '1.90 D' : '0 D'}
                </text>

                <text x={210} y={425} textAnchor="middle" className="text-[10px] fill-slate-500 select-none">Polarity</text>
                <text x={210} y={445} textAnchor="middle" className={`text-[14px] font-bold select-none ${isCis ? 'fill-emerald-400' : 'fill-amber-400'}`}>
                    {isCis ? 'Polar ✓' : 'Non-Polar'}
                </text>

                <text x={330} y={425} textAnchor="middle" className="text-[10px] fill-slate-500 select-none">Boiling Point</text>
                <text x={330} y={445} textAnchor="middle" className="text-[14px] font-bold fill-blue-400 select-none">
                    {isCis ? '60.3°C (higher)' : '47.5°C (lower)'}
                </text>

                <text x={420} y={425} textAnchor="middle" className="text-[10px] fill-slate-500 select-none">Melting Point</text>
                <text x={420} y={445} textAnchor="middle" className="text-[14px] font-bold fill-purple-400 select-none">
                    {isCis ? '-80°C (lower)' : '-50°C (higher)'}
                </text>
            </svg>
        );
    };

    const handleReset = () => {
        setPhase(1);
        setTwistAngle(0);
        setShowDipoles(false);
        setPiWarning(false);
        setTwistAttempts(0);
        setAutoAnimate(false);
        setIsomerType('cis');
    };
    const pc = phaseColors[phase];

    const topBar = (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map(p => (
                <button key={p} onClick={() => { setPhase(p as Phase); setAutoAnimate(false); setShowDipoles(p >= 3); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${phase === p ? `${phaseColors[p as Phase].bg.replace('/10', '')} shadow-lg text-white border-transparent` : 'bg-transparent border-transparent text-slate-300 hover:bg-white/10'}`}>
                    Phase {p}
                </button>
            ))}
            <div className="w-px h-4 bg-white/20 mx-1" />
            {phase >= 3 && (
                <button onClick={() => setShowDipoles(!showDipoles)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${showDipoles ? 'bg-red-500 shadow-lg text-white border-transparent' : 'bg-transparent border-transparent text-slate-300 hover:bg-white/10'}`}>
                    <Eye size={12} /> {showDipoles ? 'Hide Dipoles' : 'Show Dipoles'}
                </button>
            )}
            {phase === 1 && (
                <button onClick={() => setAutoAnimate(!autoAnimate)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${autoAnimate ? 'bg-blue-500 shadow-lg text-white border-transparent' : 'bg-transparent border-transparent text-slate-300 hover:bg-white/10'}`}>
                    <RotateCw size={12} /> Auto-Spin
                </button>
            )}
            <button onClick={handleReset}
                className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all bg-transparent border-transparent text-slate-300 hover:bg-white/10 flex items-center gap-1.5 ml-1 cursor-pointer" title="Reset">
                <RefreshCcw size={14} /> 
            </button>
        </div>
    );

    const systemMessageBadge = (
        <div className={`w-full p-4 rounded-xl border backdrop-blur-sm shadow-sm transition-all duration-300 ${pc.bg} ${pc.border}`}>
            <div className={`uppercase tracking-widest text-[10px] font-bold mb-1 ${pc.text}`}>
                PHASE {phase}
            </div>
            <div className={`text-xs md:text-sm font-medium leading-relaxed ${pc.text}`}>
                {systemMessages[phase]}
            </div>
        </div>
    );

    const infoPanelContent = (
        <div className="flex flex-col h-full shrink-0">
            {/* System Message at the top of the Info Panel on Desktop */}
            <div className="hidden xl:block mb-6 shrink-0">
                {systemMessageBadge}
            </div>

            <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5 shrink-0">
                <Zap size={10} className="text-amber-400" /> Concept Summary
            </div>
            {phase === 1 && (
                <div className="space-y-3 text-xs shrink-0">
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-blue-300 font-bold mb-1">σ Bond = Free Rotation</p>
                        <p className="text-slate-400 leading-relaxed">The C-C single bond has cylindrical electron symmetry along the axis. Rotation doesn&apos;t disrupt electron overlap.</p>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-lg border border-white/5">
                        <p className="text-slate-300 font-bold mb-1">🔩 Analogy: Single Nail</p>
                        <p className="text-slate-400 leading-relaxed">Two cardboards joined by ONE nail — you can spin one freely.</p>
                    </div>
                </div>
            )}
            {phase === 2 && (
                <div className="space-y-3 text-xs shrink-0">
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="text-red-300 font-bold mb-1">π Bond = Locked Rotation</p>
                        <p className="text-slate-400 leading-relaxed">The π bond forms by lateral overlap of parallel p-orbitals. Rotation would break this overlap, destroying the bond.</p>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-lg border border-white/5">
                        <p className="text-slate-300 font-bold mb-1">🔩🔩 Analogy: Two Nails</p>
                        <p className="text-slate-400 leading-relaxed">Two cardboards joined by TWO nails — rotation is impossible without tearing!</p>
                    </div>
                    {twistAttempts > 0 && (
                        <div className="p-3 bg-red-900/40 rounded-lg border border-red-500/40 animate-pulse">
                            <p className="text-red-300 font-bold">Twist attempts: {twistAttempts}</p>
                            <p className="text-red-200/80 text-[10px]">Every attempt would break the π bond!</p>
                        </div>
                    )}
                </div>
            )}
            {(phase === 3 || phase === 4) && (
                <div className="space-y-3 text-xs shrink-0">
                    <div className={`p-3 rounded-lg border ${phase === 3 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                        <p className={`font-bold mb-1 ${phase === 3 ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {phase === 3 ? 'Cis: Same Side' : 'Trans: Opposite Sides'}
                        </p>
                        <p className="text-slate-400 leading-relaxed">
                            {phase === 3
                                ? 'Identical groups on the same side → bond dipoles ADD → polar molecule with higher boiling point.'
                                : 'Identical groups on opposite sides → bond dipoles CANCEL → non-polar molecule but higher melting point (better crystal packing).'}
                        </p>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-lg border border-white/5">
                        <p className="text-slate-300 font-bold mb-1">🍳 Trans Fats</p>
                        <p className="text-slate-400 leading-relaxed">
                            Natural fats are cis (bent, liquid oil). Hydrogenation flips some to trans (straight, solid margarine). Our bodies can&apos;t process the unnatural trans geometry.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    const simulationContent = (
        <div className="w-full h-full relative flex flex-col xl:flex-row pointer-events-auto overflow-hidden">
            
            {/* Left Box: SVG Molecule Viewer */}
            <div className="flex-1 flex flex-col relative h-full min-w-0 min-h-0">

                {/* System Message on Mobile ONLY (Desktop uses Info Panel) */}
                <div className="xl:hidden absolute top-4 left-4 right-4 z-20">
                    {systemMessageBadge}
                </div>

                <div className="flex-1 w-full h-full flex items-center justify-center p-4 xl:p-8 min-w-0 min-h-0">
                    <div className="w-full h-full max-w-[800px] aspect-square flex items-center justify-center">
                        {phase === 1 && renderSingleBond()}
                        {phase === 2 && renderDoubleBond()}
                        {phase === 3 && renderCisTrans(true)}
                        {phase === 4 && renderCisTrans(false)}
                    </div>
                </div>
            </div>
            
            {/* Right Box: Info Panel Dock (Flex column alongside, preventing overlaps) */}
            <div className="hidden xl:flex w-[340px] 2xl:w-[380px] bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 flex-col overflow-y-auto custom-scrollbar m-4 ml-0 shrink-0">
                {infoPanelContent}
            </div>

        </div>
    );

    const bottomControls = (
        <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
            {phase === 1 && (
                <div className="flex items-center gap-4">
                    <RotateCw size={14} className="text-slate-500 shrink-0 hidden sm:block" />
                    <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Twist Angle</span>
                    <input type="range" min="0" max="360" step="1" value={twistAngle}
                        onChange={e => { setTwistAngle(Number(e.target.value)); setAutoAnimate(false); }}
                        className="flex-1 h-2 bg-slate-950/80 rounded-full appearance-none cursor-pointer border border-white/5"
                        style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(twistAngle / 360) * 100}%, rgba(15,23,42,0.8) ${(twistAngle / 360) * 100}%)` }}
                    />
                    <div className="font-mono text-sm text-blue-400 font-bold w-12 text-right shrink-0">{twistAngle.toFixed(0)}°</div>
                </div>
            )}
            {phase === 2 && (
                <div className="flex items-center gap-4">
                    <AlertTriangle size={14} className="text-red-500 shrink-0 hidden sm:block" />
                    <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Try to Twist</span>
                    <input type="range" min="-30" max="30" step="1" value={0}
                        onChange={e => handleDoubleBondTwist(Number(e.target.value))}
                         className="flex-1 h-2 bg-slate-950/80 rounded-full appearance-none cursor-pointer border border-white/5"
                    />
                    <div className="font-mono text-[10px] text-red-500 font-bold whitespace-nowrap shrink-0 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md">🔒 Locked</div>
                </div>
            )}
            {(phase === 3 || phase === 4) && (
                <div className="flex items-center justify-center gap-4">
                    <button onClick={() => { setPhase(3); setShowDipoles(true); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${phase === 3 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-emerald-400' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                        ← Cis-Isomer (μ &gt; 0)
                    </button>
                    <div className="w-px h-6 bg-slate-700/50" />
                    <button onClick={() => { setPhase(4); setShowDipoles(true); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${phase === 4 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 border-amber-400' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                        Trans-Isomer (μ = 0) →
                    </button>
                </div>
            )}
            
            <div className="flex items-center justify-center gap-2 mt-2">
                {phase > 1 && (
                    <button onClick={() => setPhase((phase - 1) as Phase)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-700 text-slate-400 cursor-pointer hover:bg-slate-800 bg-slate-900/50">
                        ← Previous Phase
                    </button>
                )}
                {phase < 4 && (
                    <button onClick={() => { setPhase((phase + 1) as Phase); if (phase + 1 >= 3) setShowDipoles(true); }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-indigo-500/40 text-indigo-300 cursor-pointer hover:bg-indigo-500/10 flex items-center gap-1 bg-indigo-500/5">
                        Next Phase <ArrowRight size={10} />
                    </button>
                )}
            </div>

            {/* Mobile / Tablet Info Panel Flow */}
            <div className="xl:hidden mt-2 pt-4 border-t border-slate-800 space-y-3">
                {infoPanelContent}
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            FloatingNavComponent={topBar}
            SimulationComponent={simulationContent}
            ControlsComponent={bottomControls}
        />
    );
};

export default GeometricalIsomerismCanvas;
