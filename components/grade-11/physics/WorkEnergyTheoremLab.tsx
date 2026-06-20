import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface WorkEnergyTheoremLabProps {
    topic: any;
    onExit: () => void;
}

const W = 1280;
const H = 760;
const G = 9.8;
const TRACK_LEN = 8;          // metres of travel
const TRACK_LEFT = 170;
const TRACK_RIGHT = 1110;
const GROUND_Y = 520;

const SPEED = 0.35;           // slows the demo so students can follow it

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const fmt = (v: number, d = 1) => `${Math.abs(v) < 1e-4 ? 0 : v.toFixed(d)}`;
const rad = (deg: number) => (deg * Math.PI) / 180;

const WorkEnergyTheoremLab: React.FC<WorkEnergyTheoremLabProps> = ({ topic, onExit }) => {
    const [force, setForce] = useState(12);    // N applied
    const [angle, setAngle] = useState(0);     // degrees above horizontal
    const [mass, setMass] = useState(3);       // kg
    const [mu, setMu] = useState(0.15);        // coefficient of friction
    const [ki, setKi] = useState(2);           // initial KE (J)
    const [paused, setPaused] = useState(false);

    const xRef = useRef(0);        // displacement along track (m)
    const [, tick] = useState(0);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef<number | null>(null);

    // ---- physics (NCERT Ch.5 Work, Energy & Power) -----------------------
    const th = rad(angle);
    const N = Math.max(0, mass * G - force * Math.sin(th));   // normal reaction
    const Fpar = force * Math.cos(th);                        // F cosθ (along-track component)
    const fric = mu * N;                                      // friction magnitude f = μN
    const netForce = Fpar - fric;                             // net along track
    const d = xRef.current;
    const wApplied = Fpar * d;        // W = (F cosθ) d
    const wFriction = -fric * d;      // friction always negative work
    const wNet = netForce * d;        // net work
    const kNow = Math.max(0, ki + wNet);
    const vNow = Math.sqrt((2 * kNow) / mass);
    const deltaK = kNow - ki;         // K_f − K_i ( == wNet by the theorem )

    // full-track totals (used for fixed graph axes so the plot doesn't jump)
    const wAppFull = Fpar * TRACK_LEN;
    const wFricFull = -fric * TRACK_LEN;
    const wNetFull = netForce * TRACK_LEN;
    const kFull = Math.max(0, ki + wNetFull);

    useEffect(() => {
        const stepFn = (now: number) => {
            const prev = lastRef.current ?? now;
            const dt = Math.min(0.04, (now - prev) / 1000);
            lastRef.current = now;
            if (!paused) {
                const a = netForce / mass;
                const k = Math.max(0, ki + netForce * xRef.current);
                const v = Math.sqrt((2 * k) / mass);
                if (a <= 0 && v <= 0.001) {
                    // net force can't move it / it has stopped — hold
                } else {
                    xRef.current += v * dt * SPEED;
                    if (xRef.current >= TRACK_LEN) {
                        xRef.current = TRACK_LEN;   // run once, then stop at the end
                        setPaused(true);
                    }
                }
            }
            tick(t => (t + 1) % 1000000);
            rafRef.current = requestAnimationFrame(stepFn);
        };
        rafRef.current = requestAnimationFrame(stepFn);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, [paused, netForce, mass, ki]);

    const replay = () => { xRef.current = 0; setPaused(false); };
    const reset = () => { setForce(12); setAngle(0); setMass(3); setMu(0.15); setKi(2); setPaused(false); xRef.current = 0; };

    // world → screen
    const mapX = (xm: number) => TRACK_LEFT + (xm / TRACK_LEN) * (TRACK_RIGHT - TRACK_LEFT);
    const blockSize = clamp(60 + mass * 9, 64, 150);
    const bx = mapX(d);
    const by = GROUND_Y - blockSize;
    const cx = bx, cy = by + blockSize / 2;

    // ---- LEFT aside — graph cards ----------------------------------------
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[350px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Net work = gain in KE</div>
                    <div className="text-xs font-semibold text-slate-500">green W_net bar matches the violet ΔKE segment</div>
                    <EnergyBarSVG ki={ki} kNow={kNow} deltaK={deltaK} wNet={wNet} kFull={kFull} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Work builds up vs distance</div>
                    <div className="text-xs font-semibold text-slate-500">applied (+), friction (−), net</div>
                    <WorkDistanceSVG wApp={wApplied} wFric={wFriction} wNet={wNet} d={d} wAppFull={wAppFull} wFricFull={wFricFull} wNetFull={wNetFull} />
                </div>
            </div>
        </aside>
    );

    // ---- RIGHT aside — theory + live values ------------------------------
    const values: { label: string; value: string; tone: string }[] = [
        { label: 'Work along track  F cosθ · d', value: `${fmt(wApplied)} J`, tone: 'text-blue-700' },
        { label: 'Work by friction  −f · d', value: `${fmt(wFriction)} J`, tone: 'text-rose-700' },
        { label: 'Net work  W_net', value: `${fmt(wNet)} J`, tone: 'text-emerald-700' },
        { label: 'KE:  K_i → K_f', value: `${fmt(ki)} → ${fmt(kNow)} J`, tone: 'text-amber-700' },
        { label: 'Change in KE  ΔK', value: `${fmt(deltaK)} J`, tone: 'text-violet-700' },
        { label: 'Speed  v = √(2K/m)', value: `${fmt(vNow)} m/s`, tone: 'text-sky-700' },
    ];

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-sky-200 bg-sky-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-sky-900">Work-Energy theorem</div>
                    <div className="text-xs font-semibold text-sky-700">NCERT Ch 5 · Work, Energy &amp; Power (§5.4–5.5)</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-sky-950">
                        <p>• Work of a force: <b>W = F d cosθ</b> (a scalar, in joules).</p>
                        <p>• Kinetic energy: <b>K = ½mv²</b> (always positive).</p>
                        <p>• Theorem: <b>W_net = K_f − K_i</b> — net work equals the change in KE.</p>
                        <p>• A force perpendicular to motion (θ = 90°) does <b>no work</b>.</p>
                        <p>• Friction does <b>negative</b> work, reducing KE.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
                        </span>
                    </div>
                    <div className="grid gap-2">
                        {values.map(v => (
                            <div key={v.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{v.label}</div>
                                <div className={`mt-1 font-mono text-base font-extrabold ${v.tone}`}>{v.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );

    // ---- canvas (apparatus only) -----------------------------------------
    const fScale = 7;
    const FparPx = clamp(Fpar * fScale, 0, 300);
    const fricPx = clamp(fric * fScale, 0, 200);
    const vPx = clamp(vNow * 14, 0, 160);

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label="A block pushed across a track showing the applied force, friction and velocity">
                    <defs>
                        <pattern id="weGrid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0f172a" strokeOpacity="0.05" /></pattern>
                        <linearGradient id="weGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1f5f9" /><stop offset="1" stopColor="#e2e8f0" /></linearGradient>
                        <linearGradient id="weBlock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#0ea5e9" /></linearGradient>
                        <marker id="weBlue" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1d4ed8" /></marker>
                        <marker id="weGreen" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#16a34a" /></marker>
                        <marker id="weRed" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#dc2626" /></marker>
                        <marker id="weSky" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#0284c7" /></marker>
                    </defs>

                    <rect width={W} height={H} fill="#ffffff" />
                    <rect width={W} height={H} fill="url(#weGrid)" />
                    <text x={W / 2} y="60" textAnchor="middle" fill="#475569" fontSize="16" fontWeight="700">Net work done on the block equals its change in kinetic energy</text>

                    {/* ground + track */}
                    <rect x="0" y={GROUND_Y} width={W} height={H - GROUND_Y} fill="url(#weGround)" />
                    <line x1="0" y1={GROUND_Y} x2={W} y2={GROUND_Y} stroke="#94a3b8" strokeWidth="2" />
                    {Array.from({ length: 9 }, (_, i) => { const px = mapX((TRACK_LEN * i) / 8); return <g key={i}><line x1={px} y1={GROUND_Y} x2={px} y2={GROUND_Y + 12} stroke="#94a3b8" /><text x={px} y={GROUND_Y + 30} textAnchor="middle" fill="#64748b" fontSize="12">{fmt((TRACK_LEN * i) / 8, 0)}</text></g>; })}
                    <text x={TRACK_RIGHT} y={GROUND_Y + 30} textAnchor="end" fill="#475569" fontSize="13" fontWeight="700">displacement d (m)</text>

                    {/* start marker */}
                    <line x1={mapX(0)} y1={GROUND_Y - 170} x2={mapX(0)} y2={GROUND_Y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />
                    <text x={mapX(0)} y={GROUND_Y - 178} textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="700">start</text>

                    {/* block */}
                    <ellipse cx={cx} cy={GROUND_Y + 6} rx={blockSize * 0.5} ry="9" fill="#0f172a" opacity="0.1" />
                    <rect x={bx - blockSize / 2} y={by} width={blockSize} height={blockSize} rx="14" fill="url(#weBlock)" stroke="#0284c7" strokeWidth="2.5" />
                    <text x={cx} y={by + blockSize / 2 + 6} textAnchor="middle" fill="#0c4a6e" fontSize="18" fontWeight="800">m</text>

                    {/* applied force at angle θ + along-track component */}
                    {force > 0 && (
                        <>
                            <line x1={cx} y1={cy} x2={cx + Math.cos(th) * force * fScale} y2={cy - Math.sin(th) * force * fScale} stroke="#1d4ed8" strokeWidth="7" strokeLinecap="round" markerEnd="url(#weBlue)" />
                            <text x={cx + Math.cos(th) * force * fScale + 8} y={cy - Math.sin(th) * force * fScale - 6} fill="#1d4ed8" fontSize="16" fontWeight="800">F</text>
                            {angle > 0 && FparPx > 6 && (
                                <>
                                    <line x1={cx} y1={cy} x2={cx + FparPx} y2={cy} stroke="#16a34a" strokeWidth="4" strokeDasharray="6 4" markerEnd="url(#weGreen)" />
                                    <text x={cx + FparPx + 8} y={cy + 16} fill="#16a34a" fontSize="13" fontWeight="800">F cosθ</text>
                                </>
                            )}
                        </>
                    )}
                    {/* friction (opposes motion) */}
                    {fricPx > 4 && <line x1={bx - blockSize / 2} y1={cy + 8} x2={bx - blockSize / 2 - fricPx} y2={cy + 8} stroke="#dc2626" strokeWidth="6" strokeLinecap="round" markerEnd="url(#weRed)" />}
                    {fricPx > 4 && <text x={bx - blockSize / 2 - fricPx - 8} y={cy + 12} textAnchor="end" fill="#dc2626" fontSize="15" fontWeight="800">f</text>}
                    {/* velocity */}
                    {vPx > 4 && <line x1={cx} y1={by - 22} x2={cx + vPx} y2={by - 22} stroke="#0284c7" strokeWidth="5" strokeLinecap="round" markerEnd="url(#weSky)" />}
                    {vPx > 4 && <text x={cx + vPx + 8} y={by - 26} fill="#0284c7" fontSize="15" fontWeight="800">v</text>}
                    {angle > 0 && <text x={cx + 40} y={cy + 30} fill="#475569" fontSize="13" fontWeight="700">θ = {fmt(angle, 0)}°</text>}
                </svg>
            </div>

            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                    {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
                <button onClick={reset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title="Reset">
                    <RotateCcw size={15} />
                </button>
            </div>

            {graphPanel}
            {valuesPanel}
        </div>
    );

    // ---- bottom controls --------------------------------------------------
    const controlsCombo = (
        <div className="flex h-full w-full flex-col gap-3 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">Work-Energy Bench</div>
                <div className="flex items-center gap-2">
                    <button onClick={replay} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"><Zap size={16} /> Run again</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
                <Slider label="Applied force F" value={force} min={0} max={30} step={1} unit="N" onChange={e => { setForce(Number(e.target.value)); replay(); }} accent="accent-blue-500" chip="bg-blue-50 text-blue-700" />
                <Slider label="Force angle θ" value={angle} min={0} max={90} step={5} unit="°" onChange={e => { setAngle(Number(e.target.value)); replay(); }} accent="accent-emerald-500" chip="bg-emerald-50 text-emerald-700" />
                <Slider label="Mass m" value={mass} min={1} max={10} step={0.5} unit="kg" onChange={e => { setMass(Number(e.target.value)); replay(); }} accent="accent-violet-500" chip="bg-violet-50 text-violet-700" />
                <Slider label="Friction μ" value={mu} min={0} max={0.5} step={0.05} unit="" onChange={e => { setMu(Number(e.target.value)); replay(); }} accent="accent-rose-500" chip="bg-rose-50 text-rose-700" />
                <Slider label="Initial KE K_i" value={ki} min={0} max={20} step={1} unit="J" onChange={e => { setKi(Number(e.target.value)); replay(); }} accent="accent-amber-500" chip="bg-amber-50 text-amber-700" />
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
            simulationStageWidth={W}
            simulationStageHeight={H}
            simulationAreaFlex="7 1 0%"
            controlsAreaFlex="3 1 0%"
        />
    );
};

// ---- left-aside SVG cards -------------------------------------------------

// Energy-bar proof: K_i (amber) + ΔKE (violet) stacked = K_f, beside W_net (green).
const EnergyBarSVG: React.FC<{ ki: number; kNow: number; deltaK: number; wNet: number; kFull: number }> = ({ ki, kNow, deltaK, wNet, kFull }) => {
    const vw = 318, vh = 228, base = vh - 40, top = 30, maxH = base - top;
    const peak = Math.max(ki, kNow, kFull, Math.abs(wNet), 4) * 1.12;
    const hh = (e: number) => clamp((e / peak) * maxH, 0, maxH);
    const kiH = hh(ki), kfH = hh(kNow), dkH = kfH - kiH;
    const wNetH = hh(Math.abs(wNet)) * (wNet < 0 ? -1 : 1);
    const barW = 78, keX = 92, wX = 228;
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[226px] w-full">
            <line x1="16" y1={base} x2={vw - 16} y2={base} stroke="#cbd5e1" strokeWidth="2" />
            <text x="16" y={base + 16} fill="#94a3b8" fontSize="10" fontWeight="700">KE = 0</text>

            {/* KE stacked bar */}
            <rect x={keX - barW / 2} y={base - kiH} width={barW} height={kiH} fill="#f59e0b22" stroke="#f59e0b" strokeWidth="2.5" />
            {kiH > 20 && <text x={keX} y={base - kiH / 2 + 4} textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="800">K_i {fmt(ki)}</text>}
            {dkH >= 0
                ? <rect x={keX - barW / 2} y={base - kiH - dkH} width={barW} height={dkH} fill="#7c3aed22" stroke="#7c3aed" strokeWidth="2.5" />
                : <rect x={keX - barW / 2} y={base - kiH} width={barW} height={-dkH} fill="#dc262622" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="5 4" />}
            <text x={keX} y={base - kfH - 8} textAnchor="middle" fill="#7c3aed" fontSize="12" fontWeight="800">K_f {fmt(kNow)}</text>
            <text x={keX} y={base + 30} textAnchor="middle" fill="#475569" fontSize="11" fontWeight="700">Kinetic energy</text>

            {/* connectors tying ΔKE segment to W_net bar */}
            <line x1={keX + barW / 2} y1={base - kiH} x2={wX - barW / 2} y2={base - kiH} stroke="#94a3b8" strokeWidth="1.3" strokeDasharray="5 4" />
            <line x1={keX + barW / 2} y1={base - kfH} x2={wX - barW / 2} y2={base - kfH} stroke="#94a3b8" strokeWidth="1.3" strokeDasharray="5 4" />
            <text x={(keX + wX) / 2} y={base - (kiH + kfH) / 2 - 5} textAnchor="middle" fill="#7c3aed" fontSize="10" fontWeight="800">ΔKE {fmt(deltaK)}</text>

            {/* W_net bar */}
            <rect x={wX - barW / 2} y={wNetH >= 0 ? base - wNetH : base} width={barW} height={Math.abs(wNetH)} fill="#16a34a22" stroke="#16a34a" strokeWidth="2.5" />
            <text x={wX} y={wNetH >= 0 ? base - Math.abs(wNetH) - 8 : base + Math.abs(wNetH) + 16} textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="800">W_net {fmt(wNet)}</text>
            <text x={wX} y={base + 30} textAnchor="middle" fill="#475569" fontSize="11" fontWeight="700">Net work (J)</text>
        </svg>
    );
};

// Accumulated work vs distance, with faint full-track guides + bold travelled portion.
const WorkDistanceSVG: React.FC<{ wApp: number; wFric: number; wNet: number; d: number; wAppFull: number; wFricFull: number; wNetFull: number }> = ({ wApp, wFric, wNet, d, wAppFull, wFricFull, wNetFull }) => {
    const vw = 318, vh = 210, left = 42, top = 18, plotW = vw - left - 14, plotH = vh - top - 34;
    const peak = Math.max(Math.abs(wAppFull), Math.abs(wFricFull), Math.abs(wNetFull), 1) * 1.1;
    const mx = (xm: number) => left + (xm / TRACK_LEN) * plotW;
    const zeroY = top + plotH / 2;
    const my = (wv: number) => zeroY - (wv / peak) * (plotH / 2);
    const guide = (full: number, color: string) => <path d={`M ${mx(0)} ${my(0)} L ${mx(TRACK_LEN)} ${my(full)}`} fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.25" />;
    const live = (val: number, color: string, wpx: number) => <line x1={mx(0)} y1={my(0)} x2={mx(d)} y2={my(val)} stroke={color} strokeWidth={wpx} />;
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[208px] w-full">
            <line x1={left} y1={top} x2={left} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <line x1={left} y1={zeroY} x2={left + plotW} y2={zeroY} stroke="#475569" strokeWidth="1.4" />
            <text x={left - 6} y={top + 8} textAnchor="end" fill="#475569" fontSize="10" fontWeight="700">+W</text>
            <text x={left - 6} y={zeroY + 4} textAnchor="end" fill="#94a3b8" fontSize="10" fontWeight="700">0</text>
            <text x={left - 6} y={top + plotH} textAnchor="end" fill="#475569" fontSize="10" fontWeight="700">−W</text>
            {guide(wAppFull, '#1d4ed8')}
            {guide(wFricFull, '#dc2626')}
            {guide(wNetFull, '#16a34a')}
            {live(wApp, '#1d4ed8', 3)}
            {live(wFric, '#dc2626', 3)}
            {live(wNet, '#16a34a', 4)}
            <line x1={mx(d)} y1={top} x2={mx(d)} y2={top + plotH} stroke="#94a3b8" strokeWidth="1.1" strokeDasharray="4 4" />
            <circle cx={mx(d)} cy={my(wApp)} r="4.5" fill="#1d4ed8" />
            <circle cx={mx(d)} cy={my(wFric)} r="4.5" fill="#dc2626" />
            <circle cx={mx(d)} cy={my(wNet)} r="5.5" fill="#fff" stroke="#16a34a" strokeWidth="3" />
            <text x={left + plotW} y={top + plotH + 22} textAnchor="end" fill="#475569" fontSize="11" fontWeight="700">distance d (m) →</text>
        </svg>
    );
};

interface SliderProps {
    label: string; value: number; min: number; max: number; step: number; unit: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; accent?: string; chip?: string;
}
const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, unit, onChange, accent = 'accent-sky-500', chip = 'bg-sky-50 text-sky-700' }) => (
    <label className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-slate-300">
        <span className="mb-2 flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <span>{label}</span><span className={`rounded-md px-2 py-0.5 font-mono ${chip}`}>{fmt(value, 2)} {unit}</span>
        </span>
        <input className={`h-2 w-full cursor-pointer ${accent}`} type="range" value={value} min={min} max={max} step={step} onChange={onChange} />
    </label>
);

export default WorkEnergyTheoremLab;
