import React, { useEffect, useRef, useState } from 'react';
import { Hand, Mountain, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface FrictionLabProps {
    topic: any;
    onExit: () => void;
}

const W = 1280;
const H = 760;
const G = 9.8;
// A smart-board drag behaves like a spring scale: 100 design pixels = 16 N.
// This makes the pull distance needed for breakaway visibly track μsN.
const DRAG_FORCE_PER_PX = 0.16;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const fmt = (v: number, d = 1) => `${Math.abs(v) < 1e-4 ? 0 : v.toFixed(d)}`;
const rad = (deg: number) => (deg * Math.PI) / 180;

type Mode = 'flat' | 'incline';

const FrictionLab: React.FC<FrictionLabProps> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('flat');
    const [applied, setApplied] = useState(0);     // N (flat mode)
    const [tilt, setTilt] = useState(10);          // degrees (incline mode)
    const [mus, setMus] = useState(0.5);
    const [muk, setMuk] = useState(0.3);
    const [mass, setMass] = useState(4);
    const [paused, setPaused] = useState(false);
    const [dragging, setDragging] = useState(false);

    // motion state (block displacement + velocity along surface)
    const posRef = useRef(0);
    const velRef = useRef(0);
    const [, force] = useState(0);                  // re-render tick
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef<number | null>(null);
    const dragRef = useRef<{ pointerId: number; targetX: number; grabOffset: number } | null>(null);

    // Keep kinetic friction below static friction while allowing either control to lead.
    const setMusClamped = (v: number) => {
        setMus(v);
        if (muk >= v) setMuk(Math.max(0.05, Number((v - 0.05).toFixed(2))));
    };
    const setMukClamped = (v: number) => {
        setMuk(v);
        if (v >= mus) setMus(Math.min(1, Number((v + 0.05).toFixed(2))));
    };

    // ---- physics ---------------------------------------------------------
    const weight = mass * G;
    const flat = mode === 'flat';
    const N = flat ? weight : weight * Math.cos(rad(tilt));
    const fsMax = mus * N;          // limiting (static) friction
    const fk = muk * N;             // kinetic friction
    // driving force along the surface
    const drive = flat ? applied : weight * Math.sin(rad(tilt));
    const moving = velRef.current > 1e-3;

    // current friction & state (instantaneous, for display)
    let frictionNow: number;
    let state: 'rest' | 'verge' | 'sliding';
    if (moving) { frictionNow = fk; state = 'sliding'; }
    else if (drive >= fsMax - 1e-6) { frictionNow = fsMax; state = 'verge'; }
    else { frictionNow = drive; state = 'rest'; }
    const netForce = moving ? drive - fk : 0;
    const accel = moving ? netForce / mass : 0;
    const thetaRepose = Math.atan(mus); // radians

    // ---- animation loop --------------------------------------------------
    useEffect(() => {
        const step = (now: number) => {
            const prev = lastRef.current ?? now;
            const dt = Math.min(0.04, (now - prev) / 1000);
            lastRef.current = now;
            if (!paused) {
                const drag = dragRef.current;
                const desiredBlockX = drag ? drag.targetX - drag.grabOffset : null;
                const currentDrive = desiredBlockX === null
                    ? drive
                    : clamp((desiredBlockX - (300 + posRef.current)) * DRAG_FORCE_PER_PX, 0, 80);
                if (drag && Math.abs(currentDrive - drive) > 0.25) setApplied(currentDrive);

                const isMoving = velRef.current > 1e-3;
                const breakFree = currentDrive > fsMax + 1e-6;
                if (isMoving || breakFree) {
                    const a = (currentDrive - fk) / mass;     // net accel along surface
                    velRef.current = Math.max(0, velRef.current + a * dt);
                    posRef.current += velRef.current * dt * 26; // px scale
                    const limit = flat ? 760 : 360;
                    if (posRef.current > limit) { posRef.current = limit; velRef.current = 0; }
                } else {
                    velRef.current = 0;
                }
            }
            force(f => (f + 1) % 1000000);
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, [drive, fsMax, fk, mass, flat, paused]);

    const endDrag = (clearApplied = true) => {
        dragRef.current = null;
        setDragging(false);
        if (clearApplied) setApplied(0);
    };
    const reset = () => {
        setMode('flat'); setApplied(0); setTilt(10); setMus(0.5); setMuk(0.3); setMass(4);
        setPaused(false);
        dragRef.current = null; setDragging(false);
        posRef.current = 0; velRef.current = 0;
    };
    const resetMotion = () => { endDrag(false); posRef.current = 0; velRef.current = 0; };

    const pointerToSvg = (event: React.PointerEvent<SVGSVGElement>) => {
        const point = event.currentTarget.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const matrix = event.currentTarget.getScreenCTM();
        return matrix ? point.matrixTransform(matrix.inverse()) : point;
    };
    const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!flat || paused) return;
        const point = pointerToSvg(event);
        const blockX = 300 + posRef.current;
        const blockY = 540 - 96;
        if (point.x < blockX || point.x > blockX + 150 || point.y < blockY || point.y > 540) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { pointerId: event.pointerId, targetX: point.x, grabOffset: point.x - blockX };
        setDragging(true);
    };
    const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
        event.preventDefault();
        dragRef.current.targetX = pointerToSvg(event).x;
    };
    const handlePointerEnd = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        endDrag();
    };

    const slidePx = posRef.current;

    // ---- left aside: graphs ----------------------------------------------
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+16px)] top-0 bottom-0 z-20 hidden w-[380px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Friction vs applied force</div>
                    <div className="text-xs font-semibold text-slate-500">static ramp → peak μₛN → kinetic plateau μₖN</div>
                    <FrictionCurveSVG fsMax={fsMax} fk={fk} drive={drive} moving={moving} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Limiting vs kinetic friction</div>
                    <div className="text-xs font-semibold text-slate-500">(fₛ)ₘₐₓ = μₛN &gt; fₖ = μₖN</div>
                    <BarsSVG fsMax={fsMax} fk={fk} frictionNow={frictionNow} />
                </div>
            </div>
        </aside>
    );

    // ---- right aside: theory + live values -------------------------------
    const values: { label: string; value: string; tone: string }[] = [
        { label: flat ? 'Applied force F' : 'Driving force mg·sinθ', value: `${fmt(drive)} N`, tone: 'text-blue-700' },
        { label: 'Friction f', value: `${fmt(frictionNow)} N`, tone: 'text-rose-700' },
        { label: 'Normal force N', value: `${fmt(N)} N`, tone: 'text-slate-700' },
        { label: 'Limiting (fₛ)ₘₐₓ = μₛN', value: `${fmt(fsMax)} N`, tone: 'text-amber-700' },
        { label: 'Kinetic fₖ = μₖN', value: `${fmt(fk)} N`, tone: 'text-emerald-700' },
        flat
            ? { label: 'Acceleration a', value: `${fmt(accel)} m/s²`, tone: 'text-violet-700' }
            : { label: 'Angle of repose tan⁻¹μₛ', value: `${fmt((thetaRepose * 180) / Math.PI)}°`, tone: 'text-violet-700' },
    ];

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">Friction</div>
                    <div className="text-xs font-semibold text-amber-700">NCERT Ch 4 · Laws of Motion (§4.9.1)</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-amber-950">
                        <p>• Static friction self-adjusts: <b>fₛ = F</b>, up to <b>fₛ ≤ μₛN</b>.</p>
                        <p>• Limiting friction <b>(fₛ)ₘₐₓ = μₛN</b> is the most it can give.</p>
                        <p>• Once sliding, <b>fₖ = μₖN</b> and <b>μₖ &lt; μₛ</b>.</p>
                        <p>• Moving block: <b>a = (F − fₖ)/m</b>; constant speed when F = fₖ.</p>
                        <p>• On an incline it slips at <b>tanθₘₐₓ = μₛ</b> (mass-independent).</p>
                        <p>• These laws are empirical — only approximately true.</p>
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

    // ---- canvas ----------------------------------------------------------
    const stateText = state === 'sliding' ? 'SLIDING' : state === 'verge' ? 'ON THE VERGE' : 'AT REST';
    const stateColor = state === 'sliding' ? '#dc2626' : state === 'verge' ? '#d97706' : '#16a34a';
    const fScale = 8; // px per N for arrows
    const blockW = 150, blockH = 96;
    const statusX = flat ? 640 : 930;

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className={`absolute inset-0 h-full w-full select-none ${flat ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
                    style={{ touchAction: 'none' }}
                    role="img"
                    aria-label="Interactive block on a rough surface. Touch or drag the block to apply force."
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                >
                    <defs>
                        <pattern id="frGrid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0f172a" strokeOpacity="0.05" /></pattern>
                        <linearGradient id="frBlock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbbf24" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
                        <filter id="frGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" /></filter>
                        <marker id="frBlue" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1d4ed8" /></marker>
                        <marker id="frRed" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#dc2626" /></marker>
                        <marker id="frSlate" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#475569" /></marker>
                    </defs>

                    <rect width={W} height={H} fill="#ffffff" />
                    <rect width={W} height={H} fill="url(#frGrid)" />

                    {/* status pill */}
                    <text x={statusX} y="58" textAnchor="middle" fill="#64748b" fontSize="15" fontWeight="700">{flat ? 'Touch the block and drag it to the right' : 'Tilt the surface until the block slips'}</text>
                    <g transform={`translate(${statusX} 96)`}>
                        <rect x="-120" y="-22" width="240" height="40" rx="20" fill={`${stateColor}1a`} stroke={stateColor} strokeWidth="2" />
                        <text x="0" y="5" textAnchor="middle" fill={stateColor} fontSize="20" fontWeight="800">{stateText}</text>
                    </g>

                    {flat ? (
                        <FlatScene blockW={blockW} blockH={blockH} slidePx={slidePx} drive={drive} frictionNow={frictionNow} N={N} weight={weight} fScale={fScale} dragging={dragging} />
                    ) : (
                        <InclineScene blockW={blockW} blockH={blockH} slidePx={slidePx} tilt={tilt} N={N} weight={weight} frictionNow={frictionNow} drive={drive} fScale={fScale} />
                    )}
                </svg>
            </div>

            {/* Pause / Play / Reset — canvas top-right */}
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
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">Friction Bench</div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
                        <button onClick={() => { setMode('flat'); resetMotion(); }} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${flat ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}><Hand size={14} /> Flat push</button>
                        <button onClick={() => { setMode('incline'); resetMotion(); }} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${!flat ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}><Mountain size={14} /> Incline</button>
                    </div>
                    <button onClick={() => setPaused(p => !p)} className={`flex min-w-[104px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition ${paused ? 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600' : 'bg-rose-500 shadow-rose-500/30 hover:bg-rose-600'}`}>
                        {paused ? <><Play size={16} /> Play</> : <><Pause size={16} /> Pause</>}
                    </button>
                    <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"><RotateCcw size={16} /> Reset</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {flat ? (
                    <Slider label="Applied force F" value={applied} min={0} max={80} step={1} unit="N" onChange={e => { setApplied(Number(e.target.value)); resetMotion(); }} accent="accent-blue-500" chip="bg-blue-50 text-blue-700" />
                ) : (
                    <Slider label="Incline angle θ" value={tilt} min={0} max={60} step={1} unit="°" onChange={e => { setTilt(Number(e.target.value)); resetMotion(); }} accent="accent-blue-500" chip="bg-blue-50 text-blue-700" />
                )}
                <Slider label="μₛ (static)" value={mus} min={0.1} max={1} step={0.05} unit="" onChange={e => { setMusClamped(Number(e.target.value)); resetMotion(); }} accent="accent-amber-500" chip="bg-amber-50 text-amber-700" />
                <Slider label="μₖ (kinetic)" value={muk} min={0.05} max={0.95} step={0.05} unit="" onChange={e => { setMukClamped(Number(e.target.value)); resetMotion(); }} accent="accent-emerald-500" chip="bg-emerald-50 text-emerald-700" />
                <Slider label="Mass m" value={mass} min={1} max={12} step={0.5} unit="kg" onChange={e => { setMass(Number(e.target.value)); resetMotion(); }} accent="accent-violet-500" chip="bg-violet-50 text-violet-700" />
            </div>

            <div className="flex flex-wrap gap-2">
                <span className="self-center text-[11px] font-bold uppercase tracking-wide text-slate-400">Surface</span>
                {([['Low grip', 0.2, 0.1], ['Medium grip', 0.5, 0.3], ['High grip', 0.9, 0.6]] as const).map(([label, s, k]) => (
                    <button key={label} onClick={() => { setMus(s); setMuk(k); resetMotion(); }} className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${Math.abs(mus - s) < 1e-6 && Math.abs(muk - k) < 1e-6 ? 'border-sky-400 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{label}</button>
                ))}
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

// ---- canvas scenes --------------------------------------------------------

const Arrow: React.FC<{ x: number; y: number; dx: number; dy: number; color: string; marker: string; label?: string; width?: number }> = ({ x, y, dx, dy, color, marker, label, width = 6 }) => {
    if (Math.hypot(dx, dy) < 4) return null;
    return (
        <g>
            <line x1={x} y1={y} x2={x + dx} y2={y + dy} stroke={color} strokeWidth={width} strokeLinecap="round" markerEnd={`url(#${marker})`} />
            {label && <text x={x + dx + (dx >= 0 ? 8 : -8)} y={y + dy + (dy >= 0 ? 18 : -8)} textAnchor={dx >= 0 ? 'start' : 'end'} fill={color} fontSize="15" fontWeight="800">{label}</text>}
        </g>
    );
};

const FlatScene: React.FC<{ blockW: number; blockH: number; slidePx: number; drive: number; frictionNow: number; N: number; weight: number; fScale: number; dragging: boolean }> = ({ blockW, blockH, slidePx, drive, frictionNow, N, weight, fScale, dragging }) => {
    const groundY = 540;
    const bx = 300 + slidePx;
    const by = groundY - blockH;
    const cx = bx + blockW / 2, cy = by + blockH / 2;
    return (
        <g>
            {/* ground */}
            <rect x="0" y={groundY} width={W} height={H - groundY} fill="#f1f5f9" />
            <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#94a3b8" strokeWidth="2" />
            {Array.from({ length: 40 }, (_, i) => <line key={i} x1={i * 34} y1={groundY} x2={i * 34 - 14} y2={groundY + 16} stroke="#cbd5e1" strokeWidth="2" />)}

            {/* block */}
            <rect x={bx} y={by} width={blockW} height={blockH} rx="12" fill="url(#frBlock)" stroke="#d97706" strokeWidth="2.5" />
            <text x={cx} y={cy + 6} textAnchor="middle" fill="#7c2d12" fontSize="18" fontWeight="800">m</text>
            {!dragging && slidePx < 1 && (
                <g pointerEvents="none">
                    <path d={`M ${cx - 26} ${by - 18} Q ${cx} ${by - 42} ${cx + 26} ${by - 18}`} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                    <text x={cx} y={by - 50} textAnchor="middle" fill="#0369a1" fontSize="14" fontWeight="800">DRAG ME</text>
                </g>
            )}

            {/* normal + weight */}
            <Arrow x={cx} y={by} dx={0} dy={-clamp(N * fScale, 0, 150)} color="#475569" marker="frSlate" label="N" />
            <Arrow x={cx} y={by + blockH} dx={0} dy={clamp(weight * fScale, 0, 150)} color="#475569" marker="frSlate" label="mg" />

            {/* applied force (blue, right) */}
            <Arrow x={bx + blockW} y={cy} dx={clamp(drive * fScale, 0, 320)} dy={0} color="#1d4ed8" marker="frBlue" label="F" width={7} />
            {/* friction (red, left, opposing) */}
            <Arrow x={bx} y={cy} dx={-clamp(frictionNow * fScale, 0, 320)} dy={0} color="#dc2626" marker="frRed" label="f" width={7} />
        </g>
    );
};

const InclineScene: React.FC<{ blockW: number; blockH: number; slidePx: number; tilt: number; N: number; weight: number; frictionNow: number; drive: number; fScale: number }> = ({ blockW, blockH, slidePx, tilt, N, weight, frictionNow, drive, fScale }) => {
    const th = rad(tilt);
    const pivotX = 250, pivotY = 560;
    const rampLen = 760;
    const ex = pivotX + rampLen * Math.cos(th);
    const ey = pivotY - rampLen * Math.sin(th);
    // block sits on ramp, distance d up-slope from the pivot
    const d = 520 - slidePx;
    const bcx = pivotX + d * Math.cos(th);
    const bcy = pivotY - d * Math.sin(th);
    // lift block centre off the surface by half height along outward normal
    const outX = Math.sin(th), outY = -Math.cos(th);      // outward normal (screen up-ish)
    const ccx = bcx + outX * (blockH / 2);
    const ccy = bcy + outY * (blockH / 2);
    return (
        <g>
            {/* ground */}
            <line x1="0" y1={pivotY} x2={W} y2={pivotY} stroke="#cbd5e1" strokeWidth="2" />
            {/* ramp */}
            <path d={`M ${pivotX} ${pivotY} L ${ex} ${ey} L ${ex} ${pivotY} Z`} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
            <line x1={pivotX} y1={pivotY} x2={ex} y2={ey} stroke="#94a3b8" strokeWidth="3" />
            {/* angle arc + label */}
            <path d={`M ${pivotX + 70} ${pivotY} A 70 70 0 0 0 ${pivotX + 70 * Math.cos(th)} ${pivotY - 70 * Math.sin(th)}`} fill="none" stroke="#64748b" strokeWidth="2" />
            <text x={pivotX + 92} y={pivotY - 14} fill="#475569" fontSize="16" fontWeight="800">θ = {fmt(tilt, 0)}°</text>

            {/* block (rotated to ramp) */}
            <g transform={`translate(${ccx} ${ccy}) rotate(${-tilt})`}>
                <rect x={-blockW / 2} y={-blockH / 2} width={blockW} height={blockH} rx="12" fill="url(#frBlock)" stroke="#d97706" strokeWidth="2.5" />
                <text x="0" y="6" textAnchor="middle" fill="#7c2d12" fontSize="18" fontWeight="800">m</text>
            </g>

            {/* weight (down), normal (out), friction (up-slope) */}
            <Arrow x={ccx} y={ccy} dx={0} dy={clamp(weight * fScale, 0, 150)} color="#475569" marker="frSlate" label="mg" />
            <Arrow x={ccx} y={ccy} dx={outX * clamp(N * fScale, 0, 140)} dy={outY * clamp(N * fScale, 0, 140)} color="#475569" marker="frSlate" label="N" />
            {/* friction acts up the slope (opposing impending/relative downhill motion) */}
            <Arrow x={ccx} y={ccy} dx={Math.cos(th) * clamp(frictionNow * fScale, 0, 220)} dy={-Math.sin(th) * clamp(frictionNow * fScale, 0, 220)} color="#dc2626" marker="frRed" label="f" width={7} />
        </g>
    );
};

// ---- left-aside SVG cards -------------------------------------------------

const FrictionCurveSVG: React.FC<{ fsMax: number; fk: number; drive: number; moving: boolean }> = ({ fsMax, fk, drive, moving }) => {
    const vw = 372, vh = 196;
    const left = 40, top = 14, plotW = vw - left - 16, plotH = vh - top - 30;
    const fMax = Math.max(fsMax * 1.6, 1);
    const xMax = Math.max(fsMax * 1.7, 1);
    const mx = (f: number) => left + (f / xMax) * plotW;
    const my = (f: number) => top + (1 - f / fMax) * plotH;
    // static ramp: f = applied up to fsMax (at applied = fsMax). then kinetic plateau at fk.
    const rampEndX = mx(fsMax);
    const opX = mx(clamp(drive, 0, xMax));
    const opY = moving ? my(fk) : my(Math.min(drive, fsMax));
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[194px] w-full">
            <line x1={left} y1={top} x2={left} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <line x1={left} y1={top + plotH} x2={left + plotW} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            {/* static ramp */}
            <line x1={left} y1={my(0)} x2={rampEndX} y2={my(fsMax)} stroke="#d97706" strokeWidth="3.5" />
            {/* drop at break-free */}
            <line x1={rampEndX} y1={my(fsMax)} x2={rampEndX} y2={my(fk)} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
            {/* kinetic plateau */}
            <line x1={rampEndX} y1={my(fk)} x2={left + plotW} y2={my(fk)} stroke="#16a34a" strokeWidth="3.5" />
            {/* peak + labels */}
            <circle cx={rampEndX} cy={my(fsMax)} r="4" fill="#d97706" />
            <text x={rampEndX + 4} y={my(fsMax) - 6} fill="#b45309" fontSize="11" fontWeight="700">μₛN</text>
            <text x={left + plotW} y={my(fk) - 6} textAnchor="end" fill="#15803d" fontSize="11" fontWeight="700">μₖN</text>
            {/* operating point */}
            <circle cx={opX} cy={opY} r="6.5" fill="#fff" stroke={moving ? '#16a34a' : '#d97706'} strokeWidth="3.5" />
            <text x={left + plotW} y={top + plotH + 20} textAnchor="end" fill="#475569" fontSize="11" fontWeight="700">applied force →</text>
            <text x={left - 6} y={top + 6} textAnchor="end" fill="#475569" fontSize="11" fontWeight="700">f</text>
        </svg>
    );
};

const BarsSVG: React.FC<{ fsMax: number; fk: number; frictionNow: number }> = ({ fsMax, fk, frictionNow }) => {
    const vw = 372, vh = 150;
    const base = vh - 28, top = 12, maxH = base - top;
    const peak = Math.max(fsMax, 1);
    const h = (f: number) => clamp((f / peak) * maxH, 2, maxH);
    const bar = (cx: number, f: number, color: string, label: string) => (
        <g>
            <rect x={cx - 44} y={base - h(f)} width="88" height={h(f)} rx="8" fill={`${color}22`} stroke={color} strokeWidth="2.5" />
            <text x={cx} y={base - h(f) - 8} textAnchor="middle" fill={color} fontSize="15" fontWeight="800">{fmt(f)} N</text>
            <text x={cx} y={base + 18} textAnchor="middle" fill="#475569" fontSize="12" fontWeight="700">{label}</text>
        </g>
    );
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[148px] w-full">
            <line x1="20" y1={base} x2={vw - 20} y2={base} stroke="#cbd5e1" strokeWidth="2" />
            {bar(110, fsMax, '#d97706', '(fₛ)ₘₐₓ = μₛN')}
            {bar(262, fk, '#16a34a', 'fₖ = μₖN')}
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

export default FrictionLab;
