import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { RefreshCcw } from 'lucide-react';

/*================================================================
  CONSTANTS
================================================================*/
const Kc = 200;

/*================================================================
  Solve equilibrium: Fe3+ + SCN- ⇌ FeSCN2+
  Kc = x / ((F-x)(S-x))  →  quadratic in x
================================================================*/
function solveEquilibrium(totalFe: number, totalSCN: number) {
    const F = Math.max(0, totalFe);
    const S = Math.max(0, totalSCN);
    const a = Kc;
    const b = -(Kc * F + Kc * S + 1);
    const c = Kc * F * S;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return { fe: F, scn: S, product: 0 };
    const x1 = (-b - Math.sqrt(disc)) / (2 * a);
    const x2 = (-b + Math.sqrt(disc)) / (2 * a);
    const maxX = Math.min(F, S);
    let x = x1;
    if (x < 0 || x > maxX) x = x2;
    if (x < 0 || x > maxX) x = 0;
    return { fe: F - x, scn: S - x, product: x };
}

/*================================================================
  MAIN COMPONENT
================================================================*/
const LeChatelierLab: React.FC = () => {
    const [totalFe, setTotalFe] = useState(0.005);
    const [totalSCN, setTotalSCN] = useState(0.005);

    // Animated concentrations
    const [fe, setFe] = useState(0);
    const [scn, setScn] = useState(0);
    const [product, setProduct] = useState(0);

    // Pouring animation state
    const [pouring, setPouring] = useState<string | null>(null); // dropper id or null
    const pourTimer = useRef<number>(0);

    const eqTarget = useMemo(() => solveEquilibrium(totalFe, totalSCN), [totalFe, totalSCN]);

    // Animation
    const animRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const fromRef = useRef({ fe: 0, scn: 0, product: 0 });
    const toRef = useRef({ fe: 0, scn: 0, product: 0 });

    const animateToEquilibrium = useCallback((target: { fe: number; scn: number; product: number }) => {
        cancelAnimationFrame(animRef.current);
        fromRef.current = { fe, scn, product };
        toRef.current = target;
        startTimeRef.current = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - startTimeRef.current) / 3000);
            const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            setFe(fromRef.current.fe + (toRef.current.fe - fromRef.current.fe) * ease);
            setScn(fromRef.current.scn + (toRef.current.scn - fromRef.current.scn) * ease);
            setProduct(fromRef.current.product + (toRef.current.product - fromRef.current.product) * ease);
            if (t < 1) animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
    }, [fe, scn, product]);

    useEffect(() => {
        animateToEquilibrium(eqTarget);
        return () => cancelAnimationFrame(animRef.current);
    }, [eqTarget]);

    useEffect(() => {
        const eq = solveEquilibrium(0.005, 0.005);
        setFe(eq.fe); setScn(eq.scn); setProduct(eq.product);
    }, []);

    // Qc
    const Qc = (fe > 1e-8 && scn > 1e-8) ? product / (fe * scn) : 0;
    const qcStatus = Math.abs(Qc - Kc) < 5 ? 'equilibrium' : Qc < Kc ? 'forward' : 'backward';

    const [message, setMessage] = useState('System at equilibrium. Click a reagent bottle below to disturb it!');

    // Color: pale yellow → deep blood red
    const maxProduct = 0.012;
    const pRatio = Math.min(1, product / maxProduct);
    const solR = Math.round(255 - pRatio * 40);
    const solG = Math.round(230 - pRatio * 200);
    const solB = Math.round(160 - pRatio * 140);
    const solutionColor = `rgb(${solR}, ${solG}, ${solB})`;

    // Color name for label
    const colorName = pRatio < 0.15 ? 'Pale Yellow' : pRatio < 0.35 ? 'Light Orange' : pRatio < 0.55 ? 'Orange' : pRatio < 0.75 ? 'Reddish Orange' : 'Deep Blood Red';

    // Pour animation trigger
    const triggerPour = (id: string) => {
        clearTimeout(pourTimer.current);
        setPouring(id);
        pourTimer.current = window.setTimeout(() => setPouring(null), 1200);
    };

    const addFe = () => {
        triggerPour('fe');
        setTotalFe(prev => prev + 0.003);
        setMessage('🧪 Fe(NO₃)₃ poured! Fe³⁺ added → Q꜀ < K꜀ → shifts FORWARD → solution turns deeper red.');
    };
    const addSCN = () => {
        triggerPour('scn');
        setTotalSCN(prev => prev + 0.003);
        setMessage('🧪 KSCN poured! SCN⁻ added → Q꜀ < K꜀ → shifts FORWARD → solution turns deeper red.');
    };
    const removeFe = () => {
        triggerPour('oxalic');
        setTotalFe(prev => Math.max(0.001, prev - 0.003));
        setMessage('🧫 Oxalic acid poured! Binds Fe³⁺ → Q꜀ > K꜀ → shifts BACKWARD → color fades toward yellow.');
    };
    const removeSCN = () => {
        triggerPour('hgcl');
        setTotalSCN(prev => Math.max(0.001, prev - 0.003));
        setMessage('🧫 HgCl₂ poured! Binds SCN⁻ → Q꜀ > K꜀ → shifts BACKWARD → color fades toward yellow.');
    };
    const handleReset = () => {
        setTotalFe(0.005); setTotalSCN(0.005);
        setPouring(null);
        setMessage('System reset to baseline equilibrium.');
    };

    // Reagent bottle component
    const ReagentBottle = ({ id, label, sublabel, color, onClick, effect }: {
        id: string; label: string; sublabel: string; color: string; onClick: () => void; effect: string;
    }) => {
        const isPouring = pouring === id;
        return (
            <button onClick={onClick}
                className="flex flex-col items-center gap-1 group cursor-pointer transition-all active:scale-95"
                title={effect}>
                {/* Bottle */}
                <div className={`relative transition-transform duration-300 ${isPouring ? '-rotate-45 translate-x-3 -translate-y-2' : 'group-hover:-rotate-12'}`}>
                    {/* Neck */}
                    <div className="w-3 h-4 mx-auto rounded-t-sm" style={{ backgroundColor: `${color}90` }} />
                    {/* Body */}
                    <div className="w-10 h-14 rounded-b-lg border-2 relative overflow-hidden" style={{ borderColor: `${color}60` }}>
                        <div className="absolute bottom-0 left-0 right-0 h-3/4" style={{ backgroundColor: `${color}40` }} />
                    </div>
                    {/* Pour stream */}
                    {isPouring && (
                        <div className="absolute -right-1 top-2 w-1 h-10 rounded-b animate-pulse" style={{
                            backgroundColor: `${color}80`,
                            transformOrigin: 'top',
                        }} />
                    )}
                </div>
                <div className="text-[10px] font-bold text-center leading-tight mt-1" style={{ color }}>{label}</div>
                <div className="text-[8px] text-white/30 text-center">{sublabel}</div>
                <div className={`text-[8px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${effect.includes('Forward') ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {effect}
                </div>
            </button>
        );
    };

    // Bar component
    const Bar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
        <div className="flex flex-col items-center gap-1">
            <div className="text-[9px] text-white/30 font-mono">{label}</div>
            <div className="w-10 h-24 bg-slate-800/50 rounded border border-white/5 relative overflow-hidden flex items-end">
                <div className="w-full rounded-t transition-all duration-500" style={{
                    height: `${Math.min(100, (value / max) * 100)}%`,
                    backgroundColor: color,
                    opacity: 0.6,
                }} />
            </div>
            <div className="text-[10px] font-mono font-bold" style={{ color }}>
                {(value * 1000).toFixed(1)}
            </div>
            <div className="text-[7px] text-white/20">mM</div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col text-slate-100 font-sans">
            <div className="flex-1 relative bg-slate-900 overflow-hidden min-h-0">
                {/* Grid */}
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }} />

                <div className="absolute inset-0 flex items-stretch p-4 gap-5">
                    {/* ── LEFT: MAIN FLASK ── */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 min-w-0">
                        <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Reaction Flask</div>
                        <div className="text-[10px] font-mono text-white/20">
                            Fe³⁺<span className="text-yellow-400/40">(yellow)</span> + SCN⁻ ⇌ [Fe(SCN)]²⁺<span className="text-red-400/40">(deep red)</span>
                        </div>

                        {/* Large flask */}
                        <div className="relative w-52 h-60 lg:w-60 lg:h-72">
                            {/* Flask neck */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-t-lg border-2 border-b-0 border-slate-500/30 bg-slate-800/30" />
                            {/* Flask body */}
                            <div className="absolute top-8 inset-x-0 bottom-0 rounded-b-[2rem] overflow-hidden"
                                style={{
                                    border: '2px solid rgba(148,163,184,0.25)',
                                    boxShadow: `inset 0 0 60px rgba(${solR},${solG},${solB},0.15), 0 4px 24px rgba(0,0,0,0.3)`,
                                }}>
                                {/* Liquid */}
                                <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 rounded-b-[2rem]" style={{
                                    height: '80%',
                                    background: `linear-gradient(180deg, rgba(${solR},${solG},${solB},0.25) 0%, rgba(${solR},${solG},${solB},0.55) 100%)`,
                                }}>
                                    {/* Animated particles inside */}
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className="absolute rounded-full" style={{
                                            width: i >= 7 ? '6px' : '5px',
                                            height: i >= 7 ? '6px' : '5px',
                                            left: `${8 + ((i * 29 + i * i * 3) % 80)}%`,
                                            top: `${8 + ((i * 41 + i * 7) % 78)}%`,
                                            backgroundColor: i < 3 ? 'rgba(250,204,21,0.5)' : i < 6 ? 'rgba(148,163,184,0.2)' : `rgba(220,38,38,${0.2 + pRatio * 0.6})`,
                                            boxShadow: i >= 7 ? `0 0 8px rgba(220,38,38,${pRatio * 0.4})` : 'none',
                                            animation: `eq-float ${2 + (i % 3) * 0.6}s ease-in-out infinite alternate`,
                                        }} />
                                    ))}
                                </div>
                                {/* White base glow */}
                                <div className="absolute bottom-0 left-0 right-0 h-3 rounded-b-[2rem]" style={{
                                    background: `linear-gradient(0deg, rgba(${solR},${solG},${solB},0.2), transparent)`,
                                }} />
                            </div>
                        </div>

                        {/* Color indicator strip */}
                        <div className="flex items-center gap-3 mt-1">
                            <div className="w-6 h-6 rounded-full border-2 border-white/15 shadow-lg" style={{
                                backgroundColor: solutionColor,
                                boxShadow: `0 0 12px rgba(${solR},${solG},${solB},0.4)`,
                            }} />
                            <div>
                                <div className="text-xs font-bold" style={{ color: solutionColor }}>{colorName}</div>
                                <div className="text-[9px] text-white/25">
                                    [FeSCN²⁺] = {(product * 1000).toFixed(2)} mM
                                </div>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="max-w-sm px-4 py-2 bg-slate-800/50 rounded-lg border border-white/10 text-[10px] text-white/45 text-center leading-relaxed">
                            {message}
                        </div>
                    </div>

                    {/* ── RIGHT: DASHBOARD ── */}
                    <div className="w-56 flex flex-col items-center justify-center gap-3 shrink-0">
                        {/* Qc vs Kc */}
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 w-full text-center">
                            <div className="text-[8px] text-white/25 uppercase tracking-wider mb-1">Reaction Quotient</div>
                            <div className="font-mono text-xs text-white/60">
                                Q꜀ = <span className="text-red-400">[P]</span> / (<span className="text-yellow-400">[Fe³⁺]</span>·<span className="text-slate-300">[SCN⁻]</span>)
                            </div>
                            <div className="mt-1.5 flex items-center justify-center gap-3">
                                <div className="text-center">
                                    <div className="text-[8px] text-white/20">Q꜀</div>
                                    <div className="text-lg font-bold font-mono" style={{
                                        color: qcStatus === 'equilibrium' ? '#34d399' : qcStatus === 'forward' ? '#f59e0b' : '#3b82f6',
                                    }}>{Qc.toFixed(0)}</div>
                                </div>
                                <div className="text-white/15 text-lg">{qcStatus === 'equilibrium' ? '=' : qcStatus === 'forward' ? '<' : '>'}</div>
                                <div className="text-center">
                                    <div className="text-[8px] text-white/20">K꜀</div>
                                    <div className="text-lg font-bold font-mono text-emerald-400">{Kc}</div>
                                </div>
                            </div>
                        </div>

                        {/* Shift direction */}
                        <div className={`w-full px-3 py-2.5 rounded-xl text-center text-xs font-bold border transition-all duration-500 ${qcStatus === 'equilibrium' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                : qcStatus === 'forward' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                                    : 'bg-blue-500/10 border-blue-500/25 text-blue-400'
                            }`}>
                            {qcStatus === 'equilibrium' ? '⚖️ At Equilibrium (Q꜀ = K꜀)' :
                                qcStatus === 'forward' ? '→ Shifting Forward (making product)' :
                                    '← Shifting Backward (consuming product)'}
                        </div>

                        {/* Concentration bars */}
                        <div className="bg-slate-800/40 border border-white/10 rounded-xl p-3 w-full">
                            <div className="text-[8px] text-white/25 text-center uppercase tracking-wider mb-2">Concentrations</div>
                            <div className="flex justify-center gap-4">
                                <Bar label="Fe³⁺" value={fe} max={0.015} color="#facc15" />
                                <Bar label="SCN⁻" value={scn} max={0.015} color="#94a3b8" />
                                <Bar label="FeSCN²⁺" value={product} max={0.015} color="#dc2626" />
                            </div>
                        </div>

                        {/* Fixed Kc reminder */}
                        <div className="bg-slate-800/30 border border-white/5 rounded-lg p-2 w-full text-center">
                            <div className="text-[8px] text-white/15 uppercase tracking-wider">Constant (fixed)</div>
                            <div className="text-sm font-mono font-bold text-emerald-400/70">K꜀ = {Kc}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== REAGENT SHELF ===== */}
            <div className="bg-slate-800 border-t border-slate-700 px-5 py-4 shrink-0">
                <div className="text-[9px] text-white/20 text-center uppercase tracking-widest mb-3">Reagent Shelf — Click a bottle to pour into the flask</div>
                <div className="flex justify-center gap-8 lg:gap-12 items-end max-w-3xl mx-auto">
                    <ReagentBottle id="fe" label="Fe(NO₃)₃" sublabel="Adds Fe³⁺" color="#facc15" onClick={addFe} effect="→ Forward Shift" />
                    <ReagentBottle id="scn" label="KSCN" sublabel="Adds SCN⁻" color="#94a3b8" onClick={addSCN} effect="→ Forward Shift" />

                    <div className="w-px h-16 bg-white/10" />

                    <ReagentBottle id="oxalic" label="Oxalic Acid" sublabel="Removes Fe³⁺" color="#a78bfa" onClick={removeFe} effect="← Backward Shift" />
                    <ReagentBottle id="hgcl" label="HgCl₂" sublabel="Removes SCN⁻" color="#22d3ee" onClick={removeSCN} effect="← Backward Shift" />

                    <div className="w-px h-16 bg-white/10" />

                    <button onClick={handleReset}
                        className="flex flex-col items-center gap-1 cursor-pointer group active:scale-95">
                        <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                            <RefreshCcw size={16} className="text-slate-400" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">Reset</div>
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes eq-float {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(4px, -5px) scale(1.15); }
                }
            `}} />
        </div>
    );
};

export default LeChatelierLab;
