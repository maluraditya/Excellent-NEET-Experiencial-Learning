import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ProjectileMotionLabProps {
    topic: any;
    onExit: () => void;
}

const W = 1280;
const H = 760;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const fmt = (v: number, d = 1) => `${Math.abs(v) < 1e-4 ? 0 : v.toFixed(d)}`;
const rad = (deg: number) => (deg * Math.PI) / 180;

const ProjectileMotionLab: React.FC<ProjectileMotionLabProps> = ({ topic, onExit }) => {
    const [v0, setV0] = useState(25);
    const [angle, setAngle] = useState(45);      // θ₀ in degrees
    const [g, setG] = useState(9.8);
    const [showComponents, setShowComponents] = useState(true);
    const [showGhost, setShowGhost] = useState(false);
    const [playback, setPlayback] = useState(1);
    const [running, setRunning] = useState(true);
    const [time, setTime] = useState(0);
    const lastFrame = useRef<number | null>(null);

    // --- NCERT projectile relations (Ch 3, §3.8) --------------------------
    const th = rad(angle);
    const v0x = v0 * Math.cos(th);
    const v0y = v0 * Math.sin(th);
    const tm = v0y / g;                       // time to apex
    const Tf = (2 * v0y) / g;                 // time of flight
    const hm = (v0y * v0y) / (2 * g);         // max height
    const R = (v0 * v0 * Math.sin(2 * th)) / g; // range

    const t = clamp(time, 0, Tf);
    const x = v0x * t;
    const y = v0y * t - 0.5 * g * t * t;
    const vx = v0x;
    const vy = v0y - g * t;
    const vNow = Math.hypot(vx, vy);

    // complementary angle (Galileo) — same range
    const compAngle = 90 - angle;
    const compTh = rad(compAngle);
    const compTf = (2 * v0 * Math.sin(compTh)) / g;

    useEffect(() => {
        if (!running) { lastFrame.current = null; return; }
        let frame = 0;
        const animate = (now: number) => {
            const prev = lastFrame.current ?? now;
            const dt = Math.min(0.05, (now - prev) / 1000) * playback;
            lastFrame.current = now;
            setTime(curr => {
                const next = curr + dt;
                return next >= Tf ? 0 : next; // loop
            });
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [running, playback, Tf]);

    const restart = (mut: () => void) => { mut(); setTime(0); };
    const reset = () => { setV0(25); setAngle(45); setG(9.8); setShowComponents(true); setShowGhost(false); setPlayback(1); setRunning(true); setTime(0); };
    const togglePlay = () => { if (time >= Tf) setTime(0); setRunning(r => !r); };

    // --- world → canvas mapping -------------------------------------------
    const originX = 140, groundY = 660, topPad = 120, rightPad = 1180;
    const xMax = Math.max(R * 1.08, 1);
    const yMax = Math.max(hm * 1.25, 1);
    const scale = Math.min((rightPad - originX) / xMax, (groundY - topPad) / yMax);
    const mapX = (wx: number) => originX + wx * scale;
    const mapY = (wy: number) => groundY - wy * scale;

    const trajPath = useMemo(() => {
        const pts: string[] = [];
        const N = 90;
        for (let i = 0; i <= N; i++) {
            const tt = (Tf * i) / N;
            const px = mapX(v0x * tt);
            const py = mapY(v0y * tt - 0.5 * g * tt * tt);
            pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`);
        }
        return pts.join(' ');
    }, [Tf, v0x, v0y, g, scale]);

    const traveledPath = useMemo(() => {
        const pts: string[] = [];
        const N = 60;
        for (let i = 0; i <= N; i++) {
            const tt = (t * i) / N;
            const px = mapX(v0x * tt);
            const py = mapY(v0y * tt - 0.5 * g * tt * tt);
            pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`);
        }
        return pts.join(' ');
    }, [t, v0x, v0y, g, scale]);

    const ghostPath = useMemo(() => {
        if (!showGhost) return '';
        const cvx = v0 * Math.cos(compTh), cvy = v0 * Math.sin(compTh);
        const pts: string[] = [];
        const N = 90;
        for (let i = 0; i <= N; i++) {
            const tt = (compTf * i) / N;
            const px = mapX(cvx * tt);
            const py = mapY(cvy * tt - 0.5 * g * tt * tt);
            pts.push(`${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`);
        }
        return pts.join(' ');
    }, [showGhost, v0, compTh, compTf, g, scale]);

    const Px = mapX(x), Py = mapY(y);
    const vScale = 4;
    const apexX = mapX(v0x * tm), apexY = mapY(hm);
    const rangeX = mapX(R);

    // strobe dots along traveled portion
    const strobeN = 10;
    const strobe = Array.from({ length: strobeN + 1 }, (_, i) => (Tf * i) / strobeN).filter(tt => tt <= t + 1e-6);

    // ---- left aside: graph cards -----------------------------------------
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+16px)] top-0 bottom-0 z-20 hidden w-[380px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                {/* Vector resolution triangle */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Vector resolution</div>
                    <div className="text-xs font-semibold text-slate-500">v₀ → v₀cosθ₀ (î) + v₀sinθ₀ (ĵ)</div>
                    <ResolutionSVG v0={v0} angle={angle} v0x={v0x} v0y={v0y} />
                </div>

                {/* velocity components vs time */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Velocity components vs time</div>
                    <div className="text-xs font-semibold text-slate-500">vₓ constant · vᵧ = v₀sinθ₀ − gt</div>
                    <ComponentsSVG v0x={v0x} v0y={v0y} g={g} Tf={Tf} t={t} />
                </div>

                {/* range vs angle */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Range vs launch angle</div>
                    <div className="text-xs font-semibold text-slate-500">R = v₀²sin2θ₀ / g · peaks at 45°</div>
                    <RangeSVG v0={v0} g={g} angle={angle} />
                </div>
            </div>
        </aside>
    );

    // ---- right aside: theory + live values -------------------------------
    const values: { label: string; value: string; tone: string }[] = [
        { label: 'v₀ₓ = v₀cosθ₀', value: `${fmt(v0x)} m/s`, tone: 'text-emerald-700' },
        { label: 'v₀ᵧ = v₀sinθ₀', value: `${fmt(v0y)} m/s`, tone: 'text-amber-700' },
        { label: 'Time of flight T_f', value: `${fmt(Tf)} s`, tone: 'text-blue-700' },
        { label: 'Max height hₘ', value: `${fmt(hm)} m`, tone: 'text-sky-700' },
        { label: 'Range R', value: `${fmt(R)} m`, tone: 'text-rose-700' },
        { label: 'Current vᵧ', value: `${fmt(vy)} m/s`, tone: 'text-violet-700' },
    ];

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-sky-200 bg-sky-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-sky-900">Projectile motion</div>
                    <div className="text-xs font-semibold text-sky-700">NCERT Ch 3 · Motion in a Plane (§3.8)</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-sky-950">
                        <p>• Resolve v₀ into <b>v₀cosθ₀</b> (horizontal) and <b>v₀sinθ₀</b> (vertical).</p>
                        <p>• aₓ = 0, aᵧ = −g — the two motions are <b>independent</b> (Galileo).</p>
                        <p>• The path is a <b>parabola</b>: y = (tanθ₀)x − g x² / 2(v₀cosθ₀)².</p>
                        <p>• At the apex vᵧ = 0; tₘ = v₀sinθ₀/g, T_f = 2tₘ.</p>
                        <p>• Range is maximum at <b>θ₀ = 45°</b> (R_m = v₀²/g).</p>
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
    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Projectile launched at an angle showing its parabolic path and velocity components">
                    <defs>
                        <pattern id="pmGrid" width="48" height="48" patternUnits="userSpaceOnUse">
                            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0f172a" strokeOpacity="0.05" />
                        </pattern>
                        <linearGradient id="pmGround" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#e2e8f0" /><stop offset="1" stopColor="#f1f5f9" />
                        </linearGradient>
                        <filter id="pmGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" /></filter>
                        <marker id="pmArrowBlue" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1d4ed8" /></marker>
                        <marker id="pmArrowGreen" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#16a34a" /></marker>
                        <marker id="pmArrowAmber" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#d97706" /></marker>
                    </defs>

                    <rect width={W} height={H} fill="#ffffff" />
                    <rect width={W} height={H} fill="url(#pmGrid)" />

                    {/* heading */}
                    <text x="640" y="60" textAnchor="middle" fill="#64748b" fontSize="15" fontWeight="700">Projectile launched at {fmt(angle, 0)}° — horizontal &amp; vertical motions are independent</text>

                    {/* ground */}
                    <rect x="0" y={groundY} width={W} height={H - groundY} fill="url(#pmGround)" />
                    <line x1="0" y1={groundY} x2={W} y2={groundY} stroke="#94a3b8" strokeWidth="2" />

                    {/* distance ticks */}
                    {Array.from({ length: 7 }, (_, i) => {
                        const wv = (xMax * i) / 6;
                        const px = mapX(wv);
                        return <g key={`xt${i}`}><line x1={px} y1={groundY} x2={px} y2={groundY + 12} stroke="#94a3b8" /><text x={px} y={groundY + 30} textAnchor="middle" fill="#64748b" fontSize="13">{fmt(wv, 0)}</text></g>;
                    })}
                    <text x={rightPad} y={groundY + 30} textAnchor="end" fill="#475569" fontSize="13" fontWeight="700">horizontal distance (m)</text>

                    {/* full path (faint) + ghost */}
                    {showGhost && ghostPath && <path d={ghostPath} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="8 8" opacity="0.7" />}
                    <path d={trajPath} fill="none" stroke="#bfdbfe" strokeWidth="3" />
                    <path d={traveledPath} fill="none" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round" />

                    {/* strobe dots */}
                    {strobe.map((tt, i) => {
                        const sx = mapX(v0x * tt), sy = mapY(v0y * tt - 0.5 * g * tt * tt);
                        return <circle key={i} cx={sx} cy={sy} r="4.5" fill="#1d4ed8" opacity={0.2 + 0.5 * (i / Math.max(1, strobe.length - 1))} />;
                    })}

                    {/* apex + range markers */}
                    <line x1={apexX} y1={apexY} x2={apexX} y2={groundY} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.7" />
                    <text x={apexX + 8} y={apexY - 8} fill="#0284c7" fontSize="14" fontWeight="700">hₘ = {fmt(hm)} m</text>
                    <g>
                        <line x1={rangeX} y1={groundY} x2={rangeX} y2={groundY - 18} stroke="#dc2626" strokeWidth="2" />
                        <circle cx={rangeX} cy={groundY} r="5" fill="#dc2626" />
                        <text x={rangeX} y={groundY - 26} textAnchor="middle" fill="#b91c1c" fontSize="14" fontWeight="700">R = {fmt(R)} m</text>
                    </g>

                    {/* ghost label */}
                    {showGhost && <text x={mapX(R) - 6} y={mapY(0) - 44} textAnchor="end" fill="#9333ea" fontSize="13" fontWeight="700">{fmt(compAngle, 0)}° ghost · same R</text>}

                    {/* independence rectangle + shadow dots */}
                    {showComponents && (
                        <g>
                            <line x1={Px} y1={Py} x2={Px} y2={groundY} stroke="#16a34a" strokeWidth="1.5" strokeDasharray="4 5" />
                            <line x1={Px} y1={Py} x2={originX} y2={Py} stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 5" />
                            <line x1={originX} y1={topPad - 30} x2={originX} y2={groundY} stroke="#fbbf24" strokeWidth="2" opacity="0.5" />
                            {/* horizontal-motion shadow (constant speed) */}
                            <circle cx={Px} cy={groundY} r="9" fill="#16a34a" />
                            <text x={Px} y={groundY - 14} textAnchor="middle" fill="#15803d" fontSize="12" fontWeight="700">x-motion</text>
                            {/* vertical-motion shadow (slows at apex) */}
                            <circle cx={originX} cy={Py} r="9" fill="#d97706" />
                            <text x={originX - 14} y={Py + 4} textAnchor="end" fill="#b45309" fontSize="12" fontWeight="700">y-motion</text>
                        </g>
                    )}

                    {/* launch pad + angle */}
                    <g>
                        <rect x={originX - 26} y={groundY - 14} width="52" height="14" rx="4" fill="#475569" />
                        <line x1={originX} y1={groundY} x2={originX + 64 * Math.cos(th)} y2={groundY - 64 * Math.sin(th)} stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                        <path d={`M ${originX + 46} ${groundY} A 46 46 0 0 0 ${originX + 46 * Math.cos(th)} ${groundY - 46 * Math.sin(th)}`} fill="none" stroke="#94a3b8" strokeWidth="2" />
                        <text x={originX + 56} y={groundY - 16} fill="#475569" fontSize="14" fontWeight="700">θ₀</text>
                    </g>

                    {/* velocity vector + components at projectile */}
                    {showComponents && Math.abs(vx) > 0.01 && (
                        <line x1={Px} y1={Py} x2={Px + vx * vScale} y2={Py} stroke="#16a34a" strokeWidth="4" markerEnd="url(#pmArrowGreen)" />
                    )}
                    {showComponents && Math.abs(vy) > 0.01 && (
                        <line x1={Px} y1={Py} x2={Px} y2={Py - vy * vScale} stroke="#d97706" strokeWidth="4" markerEnd="url(#pmArrowAmber)" />
                    )}
                    {vNow > 0.01 && (
                        <line x1={Px} y1={Py} x2={Px + vx * vScale} y2={Py - vy * vScale} stroke="#1d4ed8" strokeWidth="4.5" markerEnd="url(#pmArrowBlue)" />
                    )}
                    <text x={Px + vx * vScale + 6} y={Py - vy * vScale - 6} fill="#1d4ed8" fontSize="14" fontWeight="800">v</text>

                    {/* projectile */}
                    <circle cx={Px} cy={Py} r="20" fill="#38bdf8" opacity="0.35" filter="url(#pmGlow)" />
                    <circle cx={Px} cy={Py} r="11" fill="#0ea5e9" stroke="#0369a1" strokeWidth="2.5" />
                </svg>
            </div>

            {/* Pause / Play / Reset — canvas top-right */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                <button onClick={togglePlay} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title={running ? 'Pause' : 'Play'}>
                    {running ? <Pause size={15} /> : <Play size={15} />}
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
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                    <Crosshair size={18} className="text-sky-600" /> Projectile Launch Bench
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={togglePlay}
                        className={`flex min-w-[112px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold text-white shadow-lg transition ${running ? 'bg-rose-500 shadow-rose-500/30 hover:bg-rose-600' : 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600'}`}
                    >
                        {running ? <><Pause size={17} /> Pause</> : <><Play size={17} /> Play</>}
                    </button>
                    <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
                        <RotateCcw size={16} /> Reset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                <Slider label="Launch speed v₀" value={v0} min={5} max={40} step={1} unit="m/s" onChange={e => restart(() => setV0(Number(e.target.value)))} accent="accent-blue-500" chip="bg-blue-50 text-blue-700" />
                <Slider label="Launch angle θ₀" value={angle} min={5} max={85} step={1} unit="°" onChange={e => restart(() => setAngle(Number(e.target.value)))} accent="accent-sky-500" chip="bg-sky-50 text-sky-700" />
                <Slider label="Gravity g" value={g} min={1.6} max={12} step={0.1} unit="m/s²" onChange={e => restart(() => setG(Number(e.target.value)))} accent="accent-violet-500" chip="bg-violet-50 text-violet-700" />
                <Slider label="Playback speed" value={playback} min={0.2} max={2} step={0.1} unit="×" onChange={e => setPlayback(Number(e.target.value))} accent="accent-slate-500" chip="bg-slate-100 text-slate-700" />
            </div>

            <div className="flex flex-wrap gap-2">
                <Toggle label="Show components & shadows" on={showComponents} onClick={() => setShowComponents(s => !s)} />
                <Toggle label="Show 45°-complement ghost" on={showGhost} onClick={() => setShowGhost(s => !s)} />
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

// ---- small SVG cards ------------------------------------------------------

const ResolutionSVG: React.FC<{ v0: number; angle: number; v0x: number; v0y: number }> = ({ v0, angle, v0x, v0y }) => {
    const vw = 360, vh = 188;
    const ox = 52, oy = vh - 34;
    const s = Math.min((vw - 90) / Math.max(v0x, 1), (vh - 70) / Math.max(v0y, 1));
    const ex = ox + v0x * s, ey = oy - v0y * s;
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[186px] w-full">
            <defs>
                <marker id="resBlue" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1d4ed8" /></marker>
                <marker id="resGreen" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#16a34a" /></marker>
                <marker id="resAmber" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#d97706" /></marker>
            </defs>
            <line x1={ox} y1={oy} x2={vw - 16} y2={oy} stroke="#cbd5e1" strokeWidth="1.4" />
            <line x1={ox} y1={oy} x2={ox} y2="16" stroke="#cbd5e1" strokeWidth="1.4" />
            {/* components */}
            <line x1={ox} y1={oy} x2={ex} y2={oy} stroke="#16a34a" strokeWidth="3.5" markerEnd="url(#resGreen)" />
            <line x1={ex} y1={oy} x2={ex} y2={ey} stroke="#d97706" strokeWidth="3.5" markerEnd="url(#resAmber)" strokeDasharray="5 4" />
            {/* resultant */}
            <line x1={ox} y1={oy} x2={ex} y2={ey} stroke="#1d4ed8" strokeWidth="4" markerEnd="url(#resBlue)" />
            <text x={(ox + ex) / 2} y={oy + 18} textAnchor="middle" fill="#15803d" fontSize="12" fontWeight="700">v₀cosθ₀ = {fmt(v0x)}</text>
            <text x={ex + 6} y={(oy + ey) / 2} fill="#b45309" fontSize="12" fontWeight="700">v₀sinθ₀ = {fmt(v0y)}</text>
            <text x={ox + (ex - ox) * 0.4} y={ey + (oy - ey) * 0.35} fill="#1d4ed8" fontSize="13" fontWeight="800">v₀ = {fmt(v0)}</text>
            <text x={ox + 26} y={oy - 6} fill="#64748b" fontSize="12">{fmt(angle, 0)}°</text>
        </svg>
    );
};

const ComponentsSVG: React.FC<{ v0x: number; v0y: number; g: number; Tf: number; t: number }> = ({ v0x, v0y, g, Tf, t }) => {
    const vw = 360, vh = 172;
    const left = 38, top = 12, plotW = vw - left - 14, plotH = vh - top - 30;
    const vMax = Math.max(v0x, v0y, 1) * 1.1;
    const vMin = -(v0y) * 1.1 || -1;
    const mx = (tt: number) => left + (Tf > 0 ? tt / Tf : 0) * plotW;
    const my = (val: number) => top + (vMax - val) / (vMax - vMin) * plotH;
    const vyPath = Array.from({ length: 41 }, (_, i) => { const tt = (Tf * i) / 40; return `${i ? 'L' : 'M'}${mx(tt).toFixed(1)},${my(v0y - g * tt).toFixed(1)}`; }).join(' ');
    const zeroY = my(0);
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[170px] w-full">
            <line x1={left} y1={top} x2={left} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <line x1={left} y1={zeroY} x2={left + plotW} y2={zeroY} stroke="#475569" strokeWidth="1.4" />
            {/* vx constant */}
            <line x1={left} y1={my(v0x)} x2={left + plotW} y2={my(v0x)} stroke="#16a34a" strokeWidth="3.5" />
            <text x={left + plotW} y={my(v0x) - 6} textAnchor="end" fill="#15803d" fontSize="12" fontWeight="700">vₓ</text>
            {/* vy linear */}
            <path d={vyPath} fill="none" stroke="#d97706" strokeWidth="3.5" />
            <text x={left + 6} y={my(v0y) - 4} fill="#b45309" fontSize="12" fontWeight="700">vᵧ</text>
            {/* cursor */}
            <line x1={mx(t)} y1={top} x2={mx(t)} y2={top + plotH} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 4" />
            <circle cx={mx(t)} cy={my(v0x)} r="5" fill="#fff" stroke="#16a34a" strokeWidth="3" />
            <circle cx={mx(t)} cy={my(v0y - g * t)} r="5" fill="#fff" stroke="#d97706" strokeWidth="3" />
            <text x={left + plotW} y={top + plotH + 20} textAnchor="end" fill="#475569" fontSize="12" fontWeight="700">t (s)</text>
        </svg>
    );
};

const RangeSVG: React.FC<{ v0: number; g: number; angle: number }> = ({ v0, g, angle }) => {
    const vw = 360, vh = 172;
    const left = 42, top = 12, plotW = vw - left - 14, plotH = vh - top - 30;
    const rMax = (v0 * v0) / g;
    const mx = (deg: number) => left + (deg / 90) * plotW;
    const my = (r: number) => top + (1 - r / Math.max(rMax, 1)) * plotH;
    const path = Array.from({ length: 46 }, (_, i) => { const d = (90 * i) / 45; return `${i ? 'L' : 'M'}${mx(d).toFixed(1)},${my((v0 * v0 * Math.sin(rad(2 * d))) / g).toFixed(1)}`; }).join(' ');
    const curR = (v0 * v0 * Math.sin(rad(2 * angle))) / g;
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[170px] w-full">
            <line x1={left} y1={top} x2={left} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <line x1={left} y1={top + plotH} x2={left + plotW} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <line x1={mx(45)} y1={top} x2={mx(45)} y2={top + plotH} stroke="#16a34a" strokeWidth="1.4" strokeDasharray="5 5" />
            <text x={mx(45)} y={top + 12} textAnchor="middle" fill="#15803d" fontSize="11" fontWeight="700">45°</text>
            <path d={path} fill="none" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" />
            <line x1={mx(angle)} y1={top} x2={mx(angle)} y2={top + plotH} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4 4" />
            <circle cx={mx(angle)} cy={my(curR)} r="6" fill="#fff" stroke="#dc2626" strokeWidth="3.5" />
            {[0, 30, 60, 90].map(d => <text key={d} x={mx(d)} y={top + plotH + 20} textAnchor="middle" fill="#64748b" fontSize="12">{d}°</text>)}
            <text x={left - 6} y={top + 8} textAnchor="end" fill="#475569" fontSize="11" fontWeight="700">R</text>
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
            <span>{label}</span><span className={`rounded-md px-2 py-0.5 font-mono ${chip}`}>{fmt(value)} {unit}</span>
        </span>
        <input className={`h-2 w-full cursor-pointer ${accent}`} type="range" value={value} min={min} max={max} step={step} onChange={onChange} />
    </label>
);

const Toggle: React.FC<{ label: string; on: boolean; onClick: () => void }> = ({ label, on, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${on ? 'border-sky-400 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
        <span className={`h-3.5 w-3.5 rounded-full border-2 ${on ? 'border-sky-500 bg-sky-500' : 'border-slate-300'}`} /> {label}
    </button>
);

export default ProjectileMotionLab;
