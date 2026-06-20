import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Zap, MousePointerClick } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface MomentumConservationLabProps {
    topic: any;
    onExit: () => void;
}

const W = 1280;
const H = 760;
const TRACK_Y = 430;
const TRACK_LEFT = 150;
const TRACK_RIGHT = 1130;
const PXM = 30;                 // px per metre along the track
const CENTRE = (TRACK_LEFT + TRACK_RIGHT) / 2;
const VARROW = 13;             // px per m/s for velocity arrows
const RECOIL_IMPULSE = 24;     // kg·m/s released in recoil mode

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const fmt = (v: number, d = 1) => `${Math.abs(v) < 1e-4 ? 0 : v.toFixed(d)}`;

type Mode = 'elastic' | 'inelastic' | 'recoil';
type Phase = 'ready' | 'moving' | 'after';

const MomentumConservationLab: React.FC<MomentumConservationLabProps> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('elastic');
    const [m1, setM1] = useState(4);
    const [m2, setM2] = useState(2);
    const [u1, setU1] = useState(6);     // m/s (rightward +)
    const [u2, setU2] = useState(-3);    // m/s
    const [paused, setPaused] = useState(false);
    const [phase, setPhase] = useState<Phase>('ready');

    const xaRef = useRef(-7);
    const xbRef = useRef(7);
    const vaRef = useRef(0);
    const vbRef = useRef(0);
    const flashRef = useRef(0);
    const afterTRef = useRef(0);
    const frozenRef = useRef(false);
    const dragRef = useRef<{ which: 'a' | 'b'; id: number } | null>(null);
    const [, tick] = useState(0);
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef<number | null>(null);

    const sizeFor = (m: number) => clamp(48 + m * 6, 52, 110);
    const sA = sizeFor(m1), sB = sizeFor(m2);
    const homeA = mode === 'recoil' ? -((sA / 2) / PXM) : -7;
    const homeB = mode === 'recoil' ? ((sB / 2) / PXM) : 7;

    // ---- final velocities for the chosen collision -----------------------
    const finals = (() => {
        if (mode === 'recoil') return { va: -RECOIL_IMPULSE / m1, vb: RECOIL_IMPULSE / m2 };
        if (mode === 'inelastic') { const v = (m1 * u1 + m2 * u2) / (m1 + m2); return { va: v, vb: v }; }
        const va = ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2);
        const vb = ((m2 - m1) * u2 + 2 * m1 * u1) / (m1 + m2);
        return { va, vb };
    })();

    // momentum / KE bookkeeping
    const pBefore = mode === 'recoil' ? 0 : m1 * u1 + m2 * u2;
    const pAfter = m1 * finals.va + m2 * finals.vb;
    const keBefore = mode === 'recoil' ? 0 : 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
    const keAfter = 0.5 * m1 * finals.va * finals.va + 0.5 * m2 * finals.vb * finals.vb;

    // velocities to display right now
    const showV1 = phase === 'ready' ? (mode === 'recoil' ? 0 : u1) : vaRef.current;
    const showV2 = phase === 'ready' ? (mode === 'recoil' ? 0 : u2) : vbRef.current;
    const p1Now = m1 * showV1, p2Now = m2 * showV2;
    const totalNow = p1Now + p2Now;

    const arm = () => {
        xaRef.current = homeA; xbRef.current = homeB;
        vaRef.current = 0; vbRef.current = 0;
        flashRef.current = 0; afterTRef.current = 0; frozenRef.current = false;
        setPhase('ready');
    };
    // re-arm whenever the scenario inputs change
    useEffect(() => { arm(); /* eslint-disable-next-line */ }, [mode, m1, m2, u1, u2]);

    const run = () => {
        afterTRef.current = 0; frozenRef.current = false; flashRef.current = 0;
        if (mode === 'recoil') {
            xaRef.current = homeA; xbRef.current = homeB;
            vaRef.current = finals.va; vbRef.current = finals.vb;
            flashRef.current = 0.45; setPhase('after');
        } else {
            xaRef.current = homeA; xbRef.current = homeB;
            vaRef.current = u1; vbRef.current = u2;
            setPhase('moving');
        }
    };

    useEffect(() => {
        const step = (now: number) => {
            const prev = lastRef.current ?? now;
            const dt = Math.min(0.04, (now - prev) / 1000);
            lastRef.current = now;
            if (!paused && !frozenRef.current) {
                if (phase === 'moving' || phase === 'after') {
                    xaRef.current += vaRef.current * dt;
                    xbRef.current += vbRef.current * dt;
                    if (flashRef.current > 0) flashRef.current -= dt;

                    if (phase === 'moving') {
                        const contact = (sA / 2 + sB / 2) / PXM;
                        if (xbRef.current - xaRef.current <= contact) {
                            const mid = (xaRef.current + xbRef.current) / 2;
                            xaRef.current = mid - contact / 2; xbRef.current = mid + contact / 2;
                            vaRef.current = finals.va; vbRef.current = finals.vb;
                            flashRef.current = 0.45; afterTRef.current = 0;
                            setPhase('after');
                        }
                    } else {
                        afterTRef.current += dt;
                        // freeze once the result is clearly separated & readable
                        if (afterTRef.current > 1.6 || xaRef.current < -15 || xbRef.current > 15) frozenRef.current = true;
                    }
                }
            }
            tick(t => (t + 1) % 1000000);
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, [paused, phase, mode, m1, m2, u1, u2, sA, sB]);

    const reset = () => { setMode('elastic'); setM1(4); setM2(2); setU1(6); setU2(-3); setPaused(false); arm(); };

    const mapX = (xm: number) => clamp(CENTRE + xm * PXM, TRACK_LEFT - 60, TRACK_RIGHT + 60);

    // ---- drag the velocity handles (ready phase) -------------------------
    const toSvg = (e: React.PointerEvent<SVGSVGElement>) => {
        const svg = e.currentTarget; const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY; const m = svg.getScreenCTM();
        return m ? pt.matrixTransform(m.inverse()) : pt;
    };
    const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (phase !== 'ready' || mode === 'recoil') return;
        const p = toSvg(e);
        const tipA = mapX(homeA) + u1 * VARROW, tipB = mapX(homeB) + u2 * VARROW;
        const ay = TRACK_Y - sA - 30, by = TRACK_Y - sB - 30;
        if (Math.hypot(p.x - tipA, p.y - ay) < 30) { dragRef.current = { which: 'a', id: e.pointerId }; e.currentTarget.setPointerCapture(e.pointerId); }
        else if (Math.hypot(p.x - tipB, p.y - by) < 30) { dragRef.current = { which: 'b', id: e.pointerId }; e.currentTarget.setPointerCapture(e.pointerId); }
    };
    const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        const d = dragRef.current; if (!d || d.id !== e.pointerId) return;
        const p = toSvg(e);
        if (d.which === 'a') setU1(clamp(Math.round(((p.x - mapX(homeA)) / VARROW) * 2) / 2, -10, 10));
        else setU2(clamp(Math.round(((p.x - mapX(homeB)) / VARROW) * 2) / 2, -10, 10));
    };
    const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
        const d = dragRef.current; if (!d || d.id !== e.pointerId) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        dragRef.current = null;
    };

    // ---- left aside graphs ----------------------------------------------
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+16px)] top-0 bottom-0 z-20 hidden w-[380px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Total momentum: before vs after</div>
                    <div className="text-xs font-semibold text-slate-500">always equal — Σp is conserved</div>
                    <BeforeAfterSVG before={pBefore} after={pAfter} unit="kg·m/s" colorBefore="#1d4ed8" colorAfter="#16a34a" signed />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Total kinetic energy: before vs after</div>
                    <div className="text-xs font-semibold text-slate-500">{mode === 'elastic' ? 'elastic → KE conserved' : mode === 'inelastic' ? 'inelastic → KE lost (heat/sound)' : 'recoil from rest → KE from the burst'}</div>
                    <BeforeAfterSVG before={keBefore} after={keAfter} unit="J" colorBefore="#d97706" colorAfter="#7c3aed" />
                </div>
            </div>
        </aside>
    );

    // ---- right aside theory + values ------------------------------------
    const values: { label: string; value: string; tone: string }[] = [
        ...(mode === 'recoil' ? [] : [{ label: 'Initial u₁, u₂', value: `${fmt(u1)}, ${fmt(u2)} m/s`, tone: 'text-slate-700' }]),
        { label: 'Final v₁', value: `${fmt(finals.va)} m/s`, tone: 'text-blue-700' },
        { label: 'Final v₂', value: `${fmt(finals.vb)} m/s`, tone: 'text-rose-700' },
        { label: 'Σp before', value: `${fmt(pBefore)} kg·m/s`, tone: 'text-blue-700' },
        { label: 'Σp after', value: `${fmt(pAfter)} kg·m/s`, tone: 'text-emerald-700' },
        { label: 'KE before → after', value: `${fmt(keBefore)} → ${fmt(keAfter)} J`, tone: 'text-amber-700' },
    ];

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-sky-200 bg-sky-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-sky-900">Conservation of momentum</div>
                    <div className="text-xs font-semibold text-sky-700">NCERT Ch 4 · Laws of Motion (§4.7)</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-sky-950">
                        <p>• Momentum <b>p = m v</b> (it has a direction: + right, − left).</p>
                        <p>• No outside force ⇒ <b>total momentum stays the same</b>.</p>
                        <p>• <b>m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂</b>.</p>
                        <p>• True for <b>elastic and inelastic</b> collisions.</p>
                        <p>• Elastic also keeps KE; inelastic loses some KE.</p>
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
    const ax = mapX(xaRef.current), bx = mapX(xbRef.current);
    const ayTop = TRACK_Y - sA, byTop = TRACK_Y - sB;
    const caption =
        phase === 'ready'
            ? (mode === 'recoil' ? 'Two bodies at rest, touching. Press Burst to push them apart.' : 'Drag each arrow to set how fast it moves, then press Collide.')
            : phase === 'moving' ? 'Moving toward each other…'
                : (mode === 'recoil' ? 'They fly apart with equal & opposite momenta → total stays 0' : 'After the collision — compare the totals below');
    const conserved = Math.abs(pBefore - pAfter) < 0.05;

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className={`absolute inset-0 h-full w-full ${phase === 'ready' && mode !== 'recoil' ? 'cursor-grab' : ''}`}
                    role="img" aria-label="Two bodies colliding on a track demonstrating conservation of momentum"
                    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                    style={{ touchAction: 'none' }}
                >
                    <defs>
                        <pattern id="mcGrid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0f172a" strokeOpacity="0.05" /></pattern>
                        <linearGradient id="mcA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#0ea5e9" /></linearGradient>
                        <linearGradient id="mcB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fb7185" /><stop offset="1" stopColor="#e11d48" /></linearGradient>
                        <filter id="mcGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8" /></filter>
                        <marker id="mcBlue" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1d4ed8" /></marker>
                        <marker id="mcRed" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#e11d48" /></marker>
                    </defs>

                    <rect width={W} height={H} fill="#ffffff" />
                    <rect width={W} height={H} fill="url(#mcGrid)" />

                    {/* title + caption */}
                    <text x="640" y="48" textAnchor="middle" fill="#0f172a" fontSize="21" fontWeight="800">Conservation of Momentum</text>
                    <text x="640" y="78" textAnchor="middle" fill="#1d4ed8" fontSize="16" fontWeight="700">{caption}</text>

                    {/* ===== TOTAL MOMENTUM comparison (always visible, the key idea) ===== */}
                    <g transform="translate(640 132)">
                        <rect x="-330" y="-30" width="660" height="62" rx="16" fill={conserved ? '#ecfdf5' : '#fff7ed'} stroke={conserved ? '#16a34a' : '#f59e0b'} strokeWidth="2.5" />
                        <text x="-300" y="-6" fill="#475569" fontSize="13" fontWeight="700">TOTAL MOMENTUM (m·v)</text>
                        <text x="-300" y="20" fill="#1d4ed8" fontSize="20" fontWeight="800">before: {fmt(pBefore)}</text>
                        <text x="20" y="20" fill={phase === 'after' ? '#16a34a' : '#94a3b8'} fontSize="20" fontWeight="800">after: {phase === 'after' ? fmt(pAfter) : '—'}</text>
                        <text x="250" y="14" textAnchor="middle" fill={conserved ? '#16a34a' : '#b45309'} fontSize="15" fontWeight="800">{phase === 'after' ? (conserved ? '✓ equal' : 'check') : 'kg·m/s'}</text>
                    </g>

                    {/* track */}
                    <rect x={TRACK_LEFT - 20} y={TRACK_Y + 8} width={TRACK_RIGHT - TRACK_LEFT + 40} height="12" rx="6" fill="#e2e8f0" />
                    <line x1={TRACK_LEFT - 20} y1={TRACK_Y + 8} x2={TRACK_RIGHT + 20} y2={TRACK_Y + 8} stroke="#94a3b8" strokeWidth="2" />

                    {/* impact flash */}
                    {flashRef.current > 0 && <circle cx={(ax + bx) / 2} cy={TRACK_Y - 30} r={26 + (0.45 - flashRef.current) * 130} fill="#fde047" opacity={clamp(flashRef.current * 1.6, 0, 0.7)} filter="url(#mcGlow)" />}

                    {/* body A */}
                    <ellipse cx={ax} cy={TRACK_Y + 14} rx={sA * 0.5} ry="8" fill="#0f172a" opacity="0.1" />
                    <rect x={ax - sA / 2} y={ayTop} width={sA} height={sA} rx="14" fill="url(#mcA)" stroke="#0284c7" strokeWidth="2.5" />
                    <text x={ax} y={ayTop + sA / 2 + 6} textAnchor="middle" fill="#0c4a6e" fontSize="16" fontWeight="800">m₁</text>
                    {Math.abs(showV1) > 0.05 && <VArrow x={ax} y={ayTop - 30} v={showV1} color="#1d4ed8" marker="mcBlue" />}
                    {phase === 'ready' && mode !== 'recoil' && Math.abs(u1) > 0.05 && <circle cx={ax + u1 * VARROW} cy={ayTop - 30} r="9" fill="#fff" stroke="#1d4ed8" strokeWidth="3" />}
                    {/* momentum chip A */}
                    <g transform={`translate(${ax} ${TRACK_Y + 40})`}>
                        <rect x="-66" y="-2" width="132" height="28" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
                        <text x="0" y="17" textAnchor="middle" fill="#1d4ed8" fontSize="13" fontWeight="800">p₁ = {fmt(p1Now)} kg·m/s</text>
                    </g>

                    {/* body B */}
                    <ellipse cx={bx} cy={TRACK_Y + 14} rx={sB * 0.5} ry="8" fill="#0f172a" opacity="0.1" />
                    <rect x={bx - sB / 2} y={byTop} width={sB} height={sB} rx="14" fill="url(#mcB)" stroke="#be123c" strokeWidth="2.5" />
                    <text x={bx} y={byTop + sB / 2 + 6} textAnchor="middle" fill="#881337" fontSize="16" fontWeight="800">m₂</text>
                    {Math.abs(showV2) > 0.05 && <VArrow x={bx} y={byTop - 30} v={showV2} color="#e11d48" marker="mcRed" />}
                    {phase === 'ready' && mode !== 'recoil' && Math.abs(u2) > 0.05 && <circle cx={bx + u2 * VARROW} cy={byTop - 30} r="9" fill="#fff" stroke="#e11d48" strokeWidth="3" />}
                    {/* momentum chip B */}
                    <g transform={`translate(${bx} ${TRACK_Y + 76})`}>
                        <rect x="-66" y="-2" width="132" height="28" rx="8" fill="#fff1f2" stroke="#fecdd3" />
                        <text x="0" y="17" textAnchor="middle" fill="#e11d48" fontSize="13" fontWeight="800">p₂ = {fmt(p2Now)} kg·m/s</text>
                    </g>

                    {/* drag hint */}
                    {phase === 'ready' && mode !== 'recoil' && (
                        <text x="640" y="700" textAnchor="middle" fill="#4338ca" fontSize="15" fontWeight="700">👆 Drag the white handles to aim the blocks, then press Collide</text>
                    )}
                </svg>
            </div>

            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                    {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
                <button onClick={arm} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title="Reset positions">
                    <RotateCcw size={15} />
                </button>
            </div>

            {graphPanel}
            {valuesPanel}
        </div>
    );

    // ---- bottom controls (3 columns, fills width) ------------------------
    const exampleText = {
        elastic: 'Elastic collision — like two hard balls / a Newton\'s cradle. Total momentum AND total kinetic energy stay the same.',
        inelastic: 'Perfectly inelastic — the bodies stick and move together. Momentum is conserved, but some KE turns into heat & sound.',
        recoil: 'Recoil — like a gun firing a bullet. Both start at rest (total p = 0), so they fly apart with equal & opposite momenta.',
    }[mode];

    const controlsCombo = (
        <div className="flex h-full w-full flex-col gap-3 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {([['elastic', 'Elastic'], ['inelastic', 'Inelastic (stick)'], ['recoil', 'Recoil']] as const).map(([id, label]) => (
                        <button key={id} onClick={() => setMode(id)} className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${mode === id ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>{label}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={run} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"><Zap size={16} /> {mode === 'recoil' ? 'Burst' : 'Collide'}</button>
                    <button onClick={() => setPaused(p => !p)} className={`flex min-w-[104px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition ${paused ? 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600' : 'bg-rose-500 shadow-rose-500/30 hover:bg-rose-600'}`}>
                        {paused ? <><Play size={16} /> Play</> : <><Pause size={16} /> Pause</>}
                    </button>
                    <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"><RotateCcw size={16} /> Reset</button>
                </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-indigo-900"><MousePointerClick size={16} /> Try this</div>
                    <p className="mt-1.5 text-sm leading-snug text-indigo-950">{mode === 'recoil' ? 'Set the two masses, then press Burst. The lighter body flies off faster — but the two momenta are always equal and opposite.' : 'Drag the white handle on each block (or use the sliders) to choose its speed and direction, then press Collide and compare the “before” and “after” totals.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <Slider label="Mass m₁" value={m1} min={1} max={12} step={0.5} unit="kg" onChange={e => setM1(Number(e.target.value))} accent="accent-sky-500" chip="bg-sky-50 text-sky-700" />
                    <Slider label="Mass m₂" value={m2} min={1} max={12} step={0.5} unit="kg" onChange={e => setM2(Number(e.target.value))} accent="accent-rose-500" chip="bg-rose-50 text-rose-700" />
                    {mode !== 'recoil' && <Slider label="Speed u₁" value={u1} min={-10} max={10} step={0.5} unit="m/s" onChange={e => setU1(Number(e.target.value))} accent="accent-blue-500" chip="bg-blue-50 text-blue-700" />}
                    {mode !== 'recoil' && <Slider label="Speed u₂" value={u2} min={-10} max={10} step={0.5} unit="m/s" onChange={e => setU2(Number(e.target.value))} accent="accent-rose-500" chip="bg-rose-50 text-rose-700" />}
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="text-sm font-extrabold text-amber-900">NCERT example</div>
                    <p className="mt-1.5 text-sm leading-snug text-amber-950">{exampleText}</p>
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
            simulationStageWidth={W}
            simulationStageHeight={H}
            simulationAreaFlex="7 1 0%"
            controlsAreaFlex="3 1 0%"
        />
    );
};

// ---- helpers --------------------------------------------------------------

const VArrow: React.FC<{ x: number; y: number; v: number; color: string; marker: string }> = ({ x, y, v, color, marker }) => {
    const dx = clamp(v * VARROW, -150, 150);
    if (Math.abs(dx) < 4) return null;
    return (
        <g>
            <line x1={x} y1={y} x2={x + dx} y2={y} stroke={color} strokeWidth="6" strokeLinecap="round" markerEnd={`url(#${marker})`} />
            <text x={x + dx + (dx >= 0 ? 10 : -10)} y={y - 9} textAnchor={dx >= 0 ? 'start' : 'end'} fill={color} fontSize="14" fontWeight="800">{fmt(v)} m/s</text>
        </g>
    );
};

const BeforeAfterSVG: React.FC<{ before: number; after: number; unit: string; colorBefore: string; colorAfter: string; signed?: boolean }> = ({ before, after, unit, colorBefore, colorAfter, signed }) => {
    const vw = 372, vh = 168, base = vh - 28, top = 14, maxH = base - top;
    const peak = Math.max(Math.abs(before), Math.abs(after), 1);
    const h = (v: number) => clamp((Math.abs(v) / peak) * maxH, 3, maxH);
    const bar = (cx: number, v: number, color: string, label: string) => (
        <g>
            <rect x={cx - 52} y={base - h(v)} width="104" height={h(v)} rx="9" fill={`${color}22`} stroke={color} strokeWidth="2.5" />
            <text x={cx} y={base - h(v) - 8} textAnchor="middle" fill={color} fontSize="15" fontWeight="800">{signed ? fmt(v) : fmt(Math.abs(v))} {unit}</text>
            <text x={cx} y={base + 18} textAnchor="middle" fill="#475569" fontSize="12" fontWeight="700">{label}</text>
        </g>
    );
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[166px] w-full">
            <line x1="20" y1={base} x2={vw - 20} y2={base} stroke="#cbd5e1" strokeWidth="2" />
            {bar(112, before, colorBefore, 'before')}
            {bar(262, after, colorAfter, 'after')}
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

export default MomentumConservationLab;
