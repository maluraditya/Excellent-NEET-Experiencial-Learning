import React, { useState, useMemo } from 'react';
import { RefreshCcw, FlipHorizontal } from 'lucide-react';

type OrbitalType = '1s' | '2pz' | '2px' | '2py';
type BondResult = 'sigma' | 'pi' | 'zero' | 'destructive' | 'none';

const SigmaPiBondsLab: React.FC = () => {
    const [orbitalA, setOrbitalA] = useState<OrbitalType>('1s');
    const [orbitalB, setOrbitalB] = useState<OrbitalType>('1s');
    const [distance, setDistance] = useState(100);
    const [flipB, setFlipB] = useState(false);

    const bondResult = useMemo((): BondResult => {
        if (distance > 130) return 'none';
        if (orbitalA === '1s' && orbitalB === '1s') return 'sigma';
        if ((orbitalA === '1s' && orbitalB === '2pz') || (orbitalA === '2pz' && orbitalB === '1s'))
            return flipB ? 'destructive' : 'sigma';
        if (orbitalA === '2pz' && orbitalB === '2pz')
            return flipB ? 'destructive' : 'sigma';
        if ((orbitalA === '2px' && orbitalB === '2px') || (orbitalA === '2py' && orbitalB === '2py'))
            return flipB ? 'destructive' : 'pi';
        if (
            (orbitalA === '2pz' && (orbitalB === '2px' || orbitalB === '2py')) ||
            (orbitalB === '2pz' && (orbitalA === '2px' || orbitalA === '2py')) ||
            (orbitalA === '2px' && orbitalB === '2py') ||
            (orbitalA === '2py' && orbitalB === '2px')
        ) return 'zero';
        if (
            (orbitalA === '1s' && (orbitalB === '2px' || orbitalB === '2py')) ||
            (orbitalB === '1s' && (orbitalA === '2px' || orbitalA === '2py'))
        ) return 'zero';
        return 'none';
    }, [orbitalA, orbitalB, distance, flipB]);

    const bondInfo = useMemo(() => {
        switch (bondResult) {
            case 'sigma': return { text: 'σ Bond Formed!', sub: 'Head-on overlap → Strong Bond', color: '#34d399', bg: 'rgba(52,211,153,0.1)' };
            case 'pi': return { text: 'π Bond Formed!', sub: 'Lateral overlap → Weaker Bond', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' };
            case 'destructive': return { text: 'Destructive Interference!', sub: 'Phase mismatch (+meets−) → No Bond', color: '#f87171', bg: 'rgba(248,113,113,0.1)' };
            case 'zero': return { text: 'Zero Net Overlap', sub: 'Orthogonal orbitals → Cannot bond', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' };
            default: return { text: 'Bring atoms closer', sub: 'Slide the distance slider left', color: '#94a3b8', bg: 'rgba(148,163,184,0.05)' };
        }
    }, [bondResult]);

    const energy = useMemo(() => {
        if (distance >= 130) return 0;
        if (bondResult === 'destructive') return (1 - distance / 130) * 50;
        if (bondResult === 'zero' || bondResult === 'none') return 0;
        return (bondResult === 'sigma' ? -90 : -45) * (1 - distance / 130);
    }, [distance, bondResult]);

    const overlapFrac = distance < 130 ? 1 - distance / 130 : 0;

    // Calculate atom positions as pixel offsets from center
    const sep = distance * 1.2;

    const handleReset = () => {
        setOrbitalA('1s'); setOrbitalB('1s'); setDistance(100); setFlipB(false);
    };

    // ---- ORBITAL RENDERING ----
    const renderSOrbital = (color: string) => (
        <div className="relative w-28 h-28 flex items-center justify-center" style={{ animation: 'pulse-slow 3s ease-in-out infinite' }}>
            <div className="absolute inset-0 rounded-full" style={{
                background: `radial-gradient(circle, ${color}55 0%, ${color}25 40%, ${color}08 70%, transparent 100%)`,
                boxShadow: `0 0 30px ${color}20, inset 0 0 20px ${color}15`,
                border: `1.5px solid ${color}40`,
            }} />
            <div className="absolute w-14 h-14 rounded-full" style={{
                background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), transparent 70%)`,
            }} />
            {/* Floating dots */}
            {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} className="absolute w-1.5 h-1.5 rounded-full" style={{
                    backgroundColor: `${color}40`,
                    top: `${50 + 35 * Math.sin(i * 1.05)}%`,
                    left: `${50 + 35 * Math.cos(i * 1.05)}%`,
                    animation: `float-dot ${2 + i * 0.3}s ease-in-out infinite alternate`,
                }} />
            ))}
        </div>
    );

    const renderPLobe = (color: string, label: string, position: 'top' | 'bottom' | 'left' | 'right') => {
        const isHorizontal = position === 'left' || position === 'right';
        const w = isHorizontal ? 'w-16 h-10' : 'w-10 h-16';
        const rounded = isHorizontal
            ? (position === 'left' ? 'rounded-l-[50px] rounded-r-[30px]' : 'rounded-r-[50px] rounded-l-[30px]')
            : (position === 'top' ? 'rounded-t-[50px] rounded-b-[30px]' : 'rounded-b-[50px] rounded-t-[30px]');

        return (
            <div className={`${w} ${rounded} flex items-center justify-center text-xs font-bold font-mono relative`}
                style={{
                    background: `radial-gradient(ellipse, ${color}60 0%, ${color}25 50%, transparent 100%)`,
                    border: `1px solid ${color}35`,
                    boxShadow: `0 0 15px ${color}20`,
                    color: `${color}bb`,
                    animation: 'pulse-slow 3s ease-in-out infinite',
                }}>
                {label}
                {[0, 1, 2].map(i => (
                    <div key={i} className="absolute w-1 h-1 rounded-full" style={{
                        backgroundColor: `${color}30`,
                        top: `${30 + 20 * Math.sin(i * 2.1)}%`,
                        left: `${30 + 20 * Math.cos(i * 2.1)}%`,
                    }} />
                ))}
            </div>
        );
    };

    const renderPOrbital = (axis: 'x' | 'y' | 'z', flipped: boolean) => {
        const posColor = flipped ? '#ef4444' : '#60a5fa';
        const negColor = flipped ? '#60a5fa' : '#ef4444';
        const posLabel = flipped ? '−' : '+';
        const negLabel = flipped ? '+' : '−';

        if (axis === 'z') {
            // Horizontal lobes along internuclear axis
            return (
                <div className="relative flex items-center h-28">
                    {renderPLobe(posColor, posLabel, 'left')}
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 -mx-1 z-10" />
                    {renderPLobe(negColor, negLabel, 'right')}
                </div>
            );
        } else if (axis === 'x') {
            // Vertical lobes perpendicular
            return (
                <div className="relative flex flex-col items-center w-28">
                    {renderPLobe(posColor, posLabel, 'top')}
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 -my-1 z-10" />
                    {renderPLobe(negColor, negLabel, 'bottom')}
                </div>
            );
        } else {
            // y = into screen, render smaller
            return (
                <div className="relative flex items-center h-20 opacity-70">
                    {renderPLobe(posColor, posLabel, 'left')}
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 -mx-1 z-10" />
                    {renderPLobe(negColor, negLabel, 'right')}
                </div>
            );
        }
    };

    const renderAtomOrbital = (orbital: OrbitalType, flipped: boolean) => {
        if (orbital === '1s') return renderSOrbital('#facc15');
        const axis = orbital === '2pz' ? 'z' : orbital === '2px' ? 'x' : 'y';
        return renderPOrbital(axis, flipped);
    };

    // Overlap glow between atoms
    const renderOverlapGlow = () => {
        if (overlapFrac <= 0) return null;
        if (bondResult === 'none') return null;

        if (bondResult === 'sigma') {
            return (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                    style={{ opacity: overlapFrac }}>
                    <div className="w-16 h-16 rounded-full" style={{
                        background: 'radial-gradient(circle, rgba(52,211,153,0.7) 0%, rgba(52,211,153,0.3) 40%, transparent 70%)',
                        boxShadow: '0 0 30px rgba(52,211,153,0.5), 0 0 60px rgba(52,211,153,0.2)',
                        animation: 'pulse-slow 2s ease-in-out infinite',
                    }} />
                </div>
            );
        }
        if (bondResult === 'pi') {
            return (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col gap-10"
                    style={{ opacity: overlapFrac }}>
                    <div className="w-12 h-8 rounded-full" style={{
                        background: 'radial-gradient(ellipse, rgba(96,165,250,0.6) 0%, transparent 70%)',
                        boxShadow: '0 0 20px rgba(96,165,250,0.4)',
                    }} />
                    <div className="w-full h-px bg-white/10 relative">
                        <span className="absolute left-1/2 -translate-x-1/2 text-[8px] text-white/30 whitespace-nowrap">nodal plane</span>
                    </div>
                    <div className="w-12 h-8 rounded-full" style={{
                        background: 'radial-gradient(ellipse, rgba(96,165,250,0.6) 0%, transparent 70%)',
                        boxShadow: '0 0 20px rgba(96,165,250,0.4)',
                    }} />
                </div>
            );
        }
        if (bondResult === 'destructive') {
            return (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                    style={{ opacity: overlapFrac }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
                        background: 'radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, transparent 70%)',
                        boxShadow: '0 0 20px rgba(248,113,113,0.3)',
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" className="text-red-400">
                            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>
            );
        }
        if (bondResult === 'zero') {
            return (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                    style={{ opacity: overlapFrac }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-yellow-500/30" style={{
                        background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)',
                    }}>
                        <span className="text-yellow-400/60 text-xl font-bold">∅</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const orbitalOptions: { value: OrbitalType; label: string; desc: string }[] = [
        { value: '1s', label: '1s', desc: 'Spherical' },
        { value: '2pz', label: '2pz', desc: 'Axial (along z)' },
        { value: '2px', label: '2px', desc: 'Vertical (⊥ z)' },
        { value: '2py', label: '2py', desc: 'Depth (⊥ z)' },
    ];

    return (
        <div className="w-full h-full flex flex-col text-slate-100 font-sans">
            {/* ===== SIMULATION AREA ===== */}
            <div className="flex-1 relative bg-slate-900 overflow-hidden min-h-0">
                {/* Grid background */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                }} />

                {/* Internuclear axis */}
                <div className="absolute left-8 right-8 top-1/2 h-px border-t border-dashed border-white/10" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/20 font-mono">z-axis (internuclear)</div>

                {/* Atoms container */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {/* Atom A */}
                    <div className="flex flex-col items-center absolute transition-all duration-300"
                        style={{ left: `calc(50% - ${sep / 2 + 56}px)` }}>
                        {/* Nucleus */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                        </div>
                        {renderAtomOrbital(orbitalA, false)}
                        <div className="mt-3 text-center">
                            <div className="text-xs font-bold text-white/80">Atom A</div>
                            <div className="text-[10px] text-white/40 font-mono">{orbitalA}</div>
                        </div>
                    </div>

                    {/* Overlap glow */}
                    {renderOverlapGlow()}

                    {/* Atom B */}
                    <div className="flex flex-col items-center absolute transition-all duration-300"
                        style={{ left: `calc(50% + ${sep / 2 - 56}px)` }}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                        </div>
                        {renderAtomOrbital(orbitalB, flipB)}
                        <div className="mt-3 text-center">
                            <div className="text-xs font-bold text-white/80">Atom B</div>
                            <div className="text-[10px] text-white/40 font-mono">{orbitalB}{flipB ? ' (flipped)' : ''}</div>
                        </div>
                    </div>
                </div>

                {/* Energy mini-graph (top-right) */}
                <div className="absolute top-3 right-3 w-44 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                    <div className="text-[10px] font-bold text-white/50 mb-2">Potential Energy</div>
                    <svg width="100%" height="50" viewBox="0 0 150 50">
                        {/* Axis */}
                        <line x1="20" y1="0" x2="20" y2="45" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <line x1="20" y1="25" x2="145" y2="25" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x="16" y="27" fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="end">0</text>
                        <text x="140" y="44" fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="end">r →</text>
                        {/* Curve */}
                        <path d={(() => {
                            let d = 'M 22 25';
                            for (let i = 0; i <= 120; i++) {
                                const r = 200 * (1 - i / 120);
                                let e = 0;
                                if (r < 130 && (bondResult === 'sigma' || bondResult === 'none')) e = -90 * (1 - r / 130);
                                else if (r < 130 && bondResult === 'pi') e = -45 * (1 - r / 130);
                                else if (r < 130 && bondResult === 'destructive') e = (1 - r / 130) * 50;
                                const py = 25 - e * 20 / 90;
                                d += ` L ${22 + i} ${py}`;
                            }
                            return d;
                        })()} fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5" />
                        {/* Current position */}
                        <circle
                            cx={22 + 120 * (1 - distance / 200)}
                            cy={25 - energy * 20 / 90}
                            r="4"
                            fill={energy < 0 ? '#34d399' : energy > 0 ? '#f87171' : '#94a3b8'}
                            style={{ filter: `drop-shadow(0 0 4px ${energy < 0 ? '#34d399' : energy > 0 ? '#f87171' : '#94a3b8'})` }}
                        />
                        <text
                            x={22 + 120 * (1 - distance / 200)}
                            y={25 - energy * 20 / 90 - 8}
                            fill={energy < 0 ? '#34d399' : energy > 0 ? '#f87171' : '#94a3b8'}
                            fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace"
                        >{energy > 0 ? '+' : ''}{energy.toFixed(0)} kJ</text>
                    </svg>
                </div>

                {/* Bond Result Badge */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 text-center z-10"
                    style={{ backgroundColor: bondInfo.bg }}>
                    <div className="text-sm font-bold" style={{ color: bondInfo.color }}>{bondInfo.text}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{bondInfo.sub}</div>
                </div>
            </div>

            {/* ===== CONTROLS ===== */}
            <div className="bg-slate-800 border-t border-slate-700 px-5 py-4 shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end max-w-4xl mx-auto">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Atom A Orbital</label>
                        <select value={orbitalA} onChange={e => setOrbitalA(e.target.value as OrbitalType)}
                            className="w-full bg-slate-900 border border-slate-600 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer">
                            {orbitalOptions.map(o => <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Atom B Orbital</label>
                        <select value={orbitalB} onChange={e => setOrbitalB(e.target.value as OrbitalType)}
                            className="w-full bg-slate-900 border border-slate-600 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer">
                            {orbitalOptions.map(o => <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between mb-1.5">
                            <span>Internuclear Distance</span>
                            <span className="text-emerald-400 font-mono">{distance} pm</span>
                        </label>
                        <input type="range" min="20" max="200" step="2" value={distance}
                            onChange={e => setDistance(Number(e.target.value))}
                            className="w-full accent-emerald-400 h-2 bg-slate-700 rounded-lg cursor-pointer" />
                        <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                            <span>Close</span><span>Far</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setFlipB(!flipB)}
                            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${flipB ? 'bg-red-500/20 border-red-500/40 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                            <FlipHorizontal size={14} />
                            {flipB ? 'Flipped ✕' : 'Flip B'}
                        </button>
                        <button onClick={handleReset}
                            className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs text-slate-300 transition-colors cursor-pointer" title="Reset">
                            <RefreshCcw size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Keyframe animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.04); opacity: 0.92; }
                }
                @keyframes float-dot {
                    0% { transform: translate(0, 0); opacity: 0.3; }
                    100% { transform: translate(3px, -3px); opacity: 0.6; }
                }
            `}} />
        </div>
    );
};

export default SigmaPiBondsLab;
