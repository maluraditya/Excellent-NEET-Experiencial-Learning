import React, { useEffect, useRef, useState } from 'react';
import { Hand, Pause, Play, RotateCcw, Crosshair, Gauge, MousePointerClick } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface NewtonsLawsLabProps {
    topic: any;
    onExit: () => void;
}

const W = 1280;
const H = 760;
const SCALE = 56;           // px per metre (for on-screen speeds)
const GROUND_Y = 540;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const fmt = (v: number, d = 1) => `${Math.abs(v) < 1e-4 ? 0 : v.toFixed(d)}`;

type Law = 'first' | 'second' | 'third';

const NewtonsLawsLab: React.FC<NewtonsLawsLabProps> = ({ topic, onExit }) => {
    const [law, setLaw] = useState<Law>('first');
    const [mass, setMass] = useState(4);          // kg — puck / block / gun
    const [bulletMass, setBulletMass] = useState(1); // kg — law 3 bullet
    const [steadyF, setSteadyF] = useState(0);    // N — law 2 hands-free push
    const [friction, setFriction] = useState(false); // law 1
    const [paused, setPaused] = useState(false);

    // live display values (updated from the loop)
    const [hud, setHud] = useState({ v: 0, F: 0, a: 0, vg: 0, vb: 0, charged: 0, fired: false });

    // motion refs (positions in px, velocities in px/s)
    const xRef = useRef(360);
    const vRef = useRef(0);
    const gunXRef = useRef(560);
    const gunVRef = useRef(0);
    const bulXRef = useRef(700);
    const bulVRef = useRef(0);
    const firedRef = useRef(false);
    const chargeRef = useRef(0);   // 0..1 pull-back for law 3
    const dragRef = useRef<{ id: number; targetX: number; offset: number; lastX: number; lastT: number; vEst: number } | null>(null);
    const [dragging, setDragging] = useState(false);

    const rafRef = useRef<number | null>(null);
    const lastRef = useRef<number | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    // ---- geometry helpers (shared by render + hit-test) -------------------
    const blockSize = clamp(64 + mass * 9, 70, 150);
    const gunW = clamp(120 + mass * 10, 140, 230), gunH = 78;
    const bulW = clamp(26 + bulletMass * 8, 30, 70), bulH = 34;

    const resetPositions = () => {
        xRef.current = 360; vRef.current = 0;
        gunXRef.current = 560; gunVRef.current = 0;
        bulXRef.current = 560 + gunW / 2; bulVRef.current = 0;
        firedRef.current = false; chargeRef.current = 0;
        dragRef.current = null; setDragging(false);
    };

    const reset = () => { setLaw('first'); setMass(4); setBulletMass(1); setSteadyF(0); setFriction(false); setPaused(false); resetPositions(); };
    const switchLaw = (l: Law) => { setLaw(l); resetPositions(); };

    useEffect(() => { resetPositions(); /* eslint-disable-next-line */ }, [law]);

    // ---- animation loop --------------------------------------------------
    useEffect(() => {
        const step = (now: number) => {
            const prev = lastRef.current ?? now;
            const dt = Math.min(0.04, (now - prev) / 1000);
            lastRef.current = now;
            const drag = dragRef.current;

            if (!paused) {
                if (law === 'first') {
                    if (!drag) {
                        xRef.current += vRef.current * dt;
                        if (friction && vRef.current !== 0) {
                            const dec = 1.6 * SCALE * dt;           // a = 1.6 m/s²
                            vRef.current -= Math.sign(vRef.current) * Math.min(dec, Math.abs(vRef.current));
                        }
                        // wrap around so it keeps gliding (inertia)
                        if (xRef.current > W - 120) xRef.current = 120;
                        if (xRef.current < 120) xRef.current = W - 120;
                    }
                    setHud(h => ({ ...h, v: vRef.current / SCALE, F: 0, a: 0 }));
                } else if (law === 'second') {
                    const frontX = xRef.current + blockSize / 2;
                    const F = drag ? clamp((drag.targetX - drag.offset - frontX + blockSize / 2) * 0.7, 0, 40) : steadyF;
                    const a = F / mass;                              // m/s²
                    vRef.current += a * SCALE * dt;
                    xRef.current += vRef.current * dt;
                    if (xRef.current > W - 140) { xRef.current = 200; vRef.current = 0; } // recycle
                    setHud(h => ({ ...h, v: vRef.current / SCALE, F, a }));
                } else {
                    // third law — recoil of a gun (NCERT §4.7)
                    if (firedRef.current) {
                        gunXRef.current += gunVRef.current * dt;
                        bulXRef.current += bulVRef.current * dt;
                        if (bulXRef.current > W + 80 || gunXRef.current < -120) resetPositions();
                    } else if (!drag) {
                        // sit loaded; bullet rests at the muzzle
                        bulXRef.current = gunXRef.current + gunW / 2 - chargeRef.current * 90;
                    }
                    setHud(h => ({ ...h, vg: gunVRef.current / SCALE, vb: bulVRef.current / SCALE, charged: chargeRef.current, fired: firedRef.current }));
                }
            }
            rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, [law, mass, friction, steadyF, paused, blockSize, gunW]);

    // ---- pointer interaction (drag on the smartboard) --------------------
    const toSvg = (e: React.PointerEvent<SVGSVGElement>) => {
        const svg = e.currentTarget; const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : pt;
    };
    const inRect = (px: number, py: number, x: number, y: number, w: number, h: number) => px >= x && px <= x + w && py >= y && py <= y + h;

    const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (paused) return;
        const p = toSvg(e);
        let hit = false; let offset = 0;
        if (law === 'first') {
            if (inRect(p.x, p.y, xRef.current - blockSize / 2, GROUND_Y - blockSize, blockSize, blockSize)) { hit = true; offset = p.x - xRef.current; }
        } else if (law === 'second') {
            if (inRect(p.x, p.y, xRef.current - blockSize / 2, GROUND_Y - blockSize, blockSize, blockSize)) { hit = true; offset = p.x - xRef.current; }
        } else {
            if (!firedRef.current && inRect(p.x, p.y, bulXRef.current - bulW, GROUND_Y - bulH - 8, bulW + 24, bulH + 24)) { hit = true; offset = 0; }
        }
        if (!hit) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { id: e.pointerId, targetX: p.x, offset, lastX: p.x, lastT: performance.now(), vEst: 0 };
        setDragging(true);
        if (law === 'third') firedRef.current = false;
    };
    const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        const d = dragRef.current; if (!d || d.id !== e.pointerId) return;
        const p = toSvg(e);
        const tnow = performance.now(); const dtm = Math.max(0.001, (tnow - d.lastT) / 1000);
        d.vEst = (p.x - d.lastX) / dtm; d.lastX = p.x; d.lastT = tnow; d.targetX = p.x;
        if (law === 'first') {
            xRef.current = clamp(p.x - d.offset, 120, W - 120);
            vRef.current = clamp(d.vEst, -10 * SCALE, 10 * SCALE);
        } else if (law === 'third') {
            // pull bullet to the left of the muzzle to charge
            const muzzle = gunXRef.current + gunW / 2;
            chargeRef.current = clamp((muzzle - p.x) / 90, 0, 1);
            bulXRef.current = muzzle - chargeRef.current * 90;
        }
        // law 'second' uses d.targetX inside the loop (force-based, keeps inertia)
    };
    const fire = (charge: number) => {
        const c = clamp(charge, 0.05, 1);
        const J = 18 * c; // impulse magnitude (kg·m/s)
        bulVRef.current = (J / bulletMass) * SCALE;     // bullet → right
        gunVRef.current = -(J / mass) * SCALE;          // gun recoils ← left
        firedRef.current = true;
    };
    const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
        const d = dragRef.current; if (!d || d.id !== e.pointerId) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        if (law === 'third' && chargeRef.current > 0.05) fire(chargeRef.current);
        dragRef.current = null; setDragging(false);
    };

    // ---- left aside graphs -----------------------------------------------
    const accel2 = (hud.F || steadyF) / mass;
    const p1Law3 = bulletMass * Math.abs(hud.vb);
    const p2Law3 = mass * Math.abs(hud.vg);
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+16px)] top-0 bottom-0 z-20 hidden w-[380px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                {law === 'first' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                        <div className="text-base font-extrabold text-slate-900">Velocity vs time</div>
                        <div className="text-xs font-semibold text-slate-500">{friction ? 'friction → force → it slows' : 'net force = 0 → constant velocity'}</div>
                        <VelocityTimeSVG friction={friction} />
                    </div>
                )}
                {law === 'second' && (
                    <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Acceleration vs force</div>
                            <div className="text-xs font-semibold text-slate-500">a = F / m — straight line (slope 1/m)</div>
                            <AccelForceSVG mass={mass} appliedF={hud.F || steadyF} />
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Acceleration vs mass</div>
                            <div className="text-xs font-semibold text-slate-500">heavier ⇒ smaller a (for a fixed F)</div>
                            <AccelMassSVG mass={mass} appliedF={(hud.F || steadyF) || 10} />
                        </div>
                    </>
                )}
                {law === 'third' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl">
                        <div className="text-base font-extrabold text-slate-900">Momentum: bullet vs gun</div>
                        <div className="text-xs font-semibold text-slate-500">|p_bullet| = |p_gun| → total stays 0</div>
                        <MomentumBarsSVG p1={p1Law3} p2={p2Law3} />
                    </div>
                )}
            </div>
        </aside>
    );

    // ---- right aside theory + values -------------------------------------
    const theory = {
        first: { title: 'First Law — Inertia', ref: 'NCERT §4.4', lines: [
            'A body keeps its state of rest or uniform motion unless an external force acts.',
            'Net external force = 0 ⇒ acceleration = 0.',
            'Inertia = resistance to a change of motion.',
            'Aristotle was wrong — force is only needed to overcome friction.',
        ] },
        second: { title: 'Second Law — F = ma', ref: 'NCERT §4.5', lines: [
            'F = dp/dt; for fixed mass, F = ma.',
            'Same force, heavier body ⇒ smaller acceleration.',
            '1 N = 1 kg·m·s⁻². Consistent with the first law.',
            'Impulse J = F·Δt = Δp.',
        ] },
        third: { title: 'Third Law — Action = Reaction', ref: 'NCERT §4.6–4.7', lines: [
            'Every action has an equal and opposite reaction.',
            'The pair acts on two different bodies — it never cancels.',
            'Gun + bullet start at rest, so p_gun = −p_bullet.',
            'Total momentum of the isolated system stays zero.',
        ] },
    }[law];

    const values: { label: string; value: string; tone: string }[] =
        law === 'first'
            ? [
                { label: 'Speed', value: `${fmt(Math.abs(hud.v))} m/s`, tone: 'text-blue-700' },
                { label: 'Net force', value: friction && Math.abs(hud.v) > 0.01 ? 'friction acts' : '0 N', tone: friction ? 'text-rose-700' : 'text-emerald-700' },
                { label: 'Acceleration', value: friction && Math.abs(hud.v) > 0.01 ? 'slows down' : '0 m/s²', tone: 'text-violet-700' },
            ]
            : law === 'second'
                ? [
                    { label: 'Applied force F', value: `${fmt(hud.F || steadyF)} N`, tone: 'text-blue-700' },
                    { label: 'Mass m', value: `${fmt(mass)} kg`, tone: 'text-slate-700' },
                    { label: 'Acceleration a = F/m', value: `${fmt(accel2)} m/s²`, tone: 'text-violet-700' },
                    { label: 'Speed v', value: `${fmt(Math.abs(hud.v))} m/s`, tone: 'text-emerald-700' },
                ]
                : [
                    { label: 'Bullet mass', value: `${fmt(bulletMass)} kg`, tone: 'text-blue-700' },
                    { label: 'Gun mass', value: `${fmt(mass)} kg`, tone: 'text-rose-700' },
                    { label: 'Bullet velocity', value: `${fmt(hud.vb)} m/s`, tone: 'text-blue-700' },
                    { label: 'Gun recoil', value: `${fmt(hud.vg)} m/s`, tone: 'text-rose-700' },
                    { label: '|p_bullet| = |p_gun|', value: `${fmt(p1Law3)} kg·m/s`, tone: 'text-emerald-700' },
                ];

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-sky-200 bg-sky-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-sky-900">{theory.title}</div>
                    <div className="text-xs font-semibold text-sky-700">{theory.ref} · Laws of Motion</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-sky-950">
                        {theory.lines.map((l, i) => <p key={i}>• {l}</p>)}
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
    const moving = Math.abs(hud.v) > 0.01;
    const caption =
        law === 'first'
            ? (dragging ? 'Flick it — then let go' : moving ? (friction ? 'Friction is slowing it down' : 'No force acts → it glides at constant speed') : 'Drag the puck and let go to flick it')
            : law === 'second'
                ? (hud.F || steadyF ? `Pushing with ${fmt(hud.F || steadyF)} N → a = ${fmt(accel2)} m/s²` : 'Drag the block to push it (or set a steady push below)')
                : (hud.fired ? `Bullet ${fmt(hud.vb)} m/s →   ← gun recoils ${fmt(Math.abs(hud.vg))} m/s` : (chargeRef.current > 0.05 ? 'Release to fire!' : 'Drag the bullet back to load, then release to fire'));

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    className={`absolute inset-0 h-full w-full ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    role="img" aria-label="Newton's laws of motion — interactive"
                    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                    style={{ touchAction: 'none' }}
                >
                    <defs>
                        <pattern id="nlGrid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0f172a" strokeOpacity="0.05" /></pattern>
                        <linearGradient id="nlBlock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#0ea5e9" /></linearGradient>
                        <linearGradient id="nlGun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#64748b" /><stop offset="1" stopColor="#334155" /></linearGradient>
                        <filter id="nlGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" /></filter>
                        <marker id="nlBlue" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#1d4ed8" /></marker>
                        <marker id="nlRed" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#dc2626" /></marker>
                        <marker id="nlGreen" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#16a34a" /></marker>
                        <marker id="nlViolet" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#7c3aed" /></marker>
                    </defs>

                    <rect width={W} height={H} fill="#ffffff" />
                    <rect width={W} height={H} fill="url(#nlGrid)" />

                    {/* heading + live caption */}
                    <text x="640" y="54" textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="800">{theory.title}</text>
                    <text x="640" y="86" textAnchor="middle" fill="#1d4ed8" fontSize="17" fontWeight="700">{caption}</text>

                    {/* ground */}
                    <rect x="0" y={GROUND_Y} width={W} height={H - GROUND_Y} fill="#f1f5f9" />
                    <line x1="0" y1={GROUND_Y} x2={W} y2={GROUND_Y} stroke="#94a3b8" strokeWidth="2" />
                    {law === 'first' && friction && Array.from({ length: 27 }, (_, i) => <line key={i} x1={i * 48} y1={GROUND_Y} x2={i * 48 - 14} y2={GROUND_Y + 16} stroke="#cbd5e1" strokeWidth="2" />)}

                    {law === 'first' && <FirstScene x={xRef.current} size={blockSize} v={hud.v} friction={friction} dragging={dragging} />}
                    {law === 'second' && <SecondScene x={xRef.current} size={blockSize} F={hud.F || steadyF} a={accel2} dragging={dragging} />}
                    {law === 'third' && <ThirdScene gunX={gunXRef.current} bulX={bulXRef.current} gunW={gunW} gunH={gunH} bulW={bulW} bulH={bulH} charge={chargeRef.current} fired={hud.fired} vg={hud.vg} vb={hud.vb} />}

                    {/* drag hint chip */}
                    <g transform="translate(640 700)">
                        <rect x="-150" y="-20" width="300" height="38" rx="19" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5" />
                        <text x="0" y="5" textAnchor="middle" fill="#4338ca" fontSize="14" fontWeight="700">{law === 'third' ? '👆 Drag the bullet to load · release to fire' : '👆 Drag the ' + (law === 'first' ? 'puck' : 'block') + ' in the scene'}</text>
                    </g>
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

    // ---- bottom controls (3 columns, fills the width) --------------------
    const lawMeta = {
        first: { icon: <Hand size={15} />, how: 'Drag the puck across the floor and let go. It keeps gliding — that is inertia. Turn friction on to give it an external force and watch it slow down.', example: 'NCERT §4.4 — A body on a smooth (frictionless) surface needs no force to keep moving; Galileo\'s inclined-plane idea.' },
        second: { icon: <Gauge size={15} />, how: 'Drag the block to push it, or set a steady push. The acceleration is a = F / m — make the block heavier and the same force gives less acceleration.', example: 'NCERT §4.5 — F = ma. SI unit: 1 N accelerates 1 kg at 1 m/s². Try 10 N on 2 kg vs 5 kg.' },
        third: { icon: <Crosshair size={15} />, how: 'Drag the bullet back into the gun to load it, then release to fire. The bullet flies one way, the gun recoils the other — equal and opposite.', example: 'NCERT §4.7 — Recoil of a gun: total momentum starts at zero, so p_gun = −p_bullet.' },
    }[law];

    const controlsCombo = (
        <div className="flex h-full w-full flex-col gap-3 text-slate-900">
            {/* top bar: modes + transport */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {([['first', '1st · Inertia'], ['second', '2nd · F = ma'], ['third', '3rd · Recoil']] as const).map(([id, label]) => (
                        <button key={id} onClick={() => switchLaw(id)} className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${law === id ? 'bg-sky-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>{label}</button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPaused(p => !p)} className={`flex min-w-[104px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition ${paused ? 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600' : 'bg-rose-500 shadow-rose-500/30 hover:bg-rose-600'}`}>
                        {paused ? <><Play size={16} /> Play</> : <><Pause size={16} /> Pause</>}
                    </button>
                    <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"><RotateCcw size={16} /> Reset</button>
                </div>
            </div>

            {/* 3-column body fills the width */}
            <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-3">
                {/* how to use */}
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-indigo-900"><MousePointerClick size={16} /> Try this</div>
                    <p className="mt-1.5 text-sm leading-snug text-indigo-950">{lawMeta.how}</p>
                </div>

                {/* controls for the mode */}
                <div className="flex flex-col gap-2.5">
                    {law === 'first' && (
                        <>
                            <Slider label="Puck mass m" value={mass} min={1} max={12} step={0.5} unit="kg" onChange={e => setMass(Number(e.target.value))} accent="accent-sky-500" chip="bg-sky-50 text-sky-700" />
                            <Toggle label="Friction (an external force)" on={friction} onClick={() => setFriction(f => !f)} />
                        </>
                    )}
                    {law === 'second' && (
                        <>
                            <Slider label="Block mass m" value={mass} min={1} max={12} step={0.5} unit="kg" onChange={e => setMass(Number(e.target.value))} accent="accent-violet-500" chip="bg-violet-50 text-violet-700" />
                            <Slider label="Steady push F (hands-free)" value={steadyF} min={0} max={40} step={1} unit="N" onChange={e => setSteadyF(Number(e.target.value))} accent="accent-blue-500" chip="bg-blue-50 text-blue-700" />
                        </>
                    )}
                    {law === 'third' && (
                        <>
                            <Slider label="Bullet mass" value={bulletMass} min={0.5} max={4} step={0.5} unit="kg" onChange={e => { setBulletMass(Number(e.target.value)); resetPositions(); }} accent="accent-blue-500" chip="bg-blue-50 text-blue-700" />
                            <Slider label="Gun mass" value={mass} min={4} max={16} step={1} unit="kg" onChange={e => { setMass(Number(e.target.value)); resetPositions(); }} accent="accent-rose-500" chip="bg-rose-50 text-rose-700" />
                            <button onClick={() => { resetPositions(); chargeRef.current = 1; setTimeout(() => fire(1), 30); }} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600">Fire 🔫</button>
                        </>
                    )}
                </div>

                {/* NCERT example */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-amber-900">{lawMeta.icon} NCERT example</div>
                    <p className="mt-1.5 text-sm leading-snug text-amber-950">{lawMeta.example}</p>
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

// ---- canvas scenes --------------------------------------------------------

const Arrow: React.FC<{ x: number; y: number; dx: number; dy: number; color: string; marker: string; label?: string; width?: number }> = ({ x, y, dx, dy, color, marker, label, width = 6 }) => {
    if (Math.hypot(dx, dy) < 4) return null;
    return (
        <g>
            <line x1={x} y1={y} x2={x + dx} y2={y + dy} stroke={color} strokeWidth={width} strokeLinecap="round" markerEnd={`url(#${marker})`} />
            {label && <text x={x + dx + (dx >= 0 ? 8 : -8)} y={y + dy - 10} textAnchor={dx >= 0 ? 'start' : 'end'} fill={color} fontSize="16" fontWeight="800">{label}</text>}
        </g>
    );
};

const FirstScene: React.FC<{ x: number; size: number; v: number; friction: boolean; dragging: boolean }> = ({ x, size, v, friction, dragging }) => {
    const by = GROUND_Y - size, cx = x;
    const vPx = clamp(v * 16, -150, 150);
    return (
        <g>
            <ellipse cx={cx} cy={GROUND_Y + 6} rx={size * 0.5} ry="10" fill="#0f172a" opacity="0.1" />
            <rect x={x - size / 2} y={by} width={size} height={size} rx="14" fill="url(#nlBlock)" stroke="#0284c7" strokeWidth="2.5" filter={dragging ? 'url(#nlGlow)' : undefined} />
            <text x={cx} y={by + size / 2 + 7} textAnchor="middle" fill="#0c4a6e" fontSize="20" fontWeight="800">m</text>
            {Math.abs(vPx) > 4 && <Arrow x={cx + (vPx >= 0 ? size / 2 : -size / 2)} y={by + size / 2} dx={vPx} dy={0} color="#16a34a" marker="nlGreen" label="v" width={7} />}
            {friction && Math.abs(v) > 0.01 && <Arrow x={x - size / 2} y={by + size / 2} dx={-Math.sign(v) * 64} dy={0} color="#dc2626" marker="nlRed" label="f" width={7} />}
        </g>
    );
};

const SecondScene: React.FC<{ x: number; size: number; F: number; a: number; dragging: boolean }> = ({ x, size, F, a, dragging }) => {
    const by = GROUND_Y - size, cx = x;
    return (
        <g>
            <ellipse cx={cx} cy={GROUND_Y + 6} rx={size * 0.5} ry="10" fill="#0f172a" opacity="0.1" />
            <rect x={x - size / 2} y={by} width={size} height={size} rx="14" fill="url(#nlBlock)" stroke="#0284c7" strokeWidth="2.5" filter={dragging ? 'url(#nlGlow)' : undefined} />
            <text x={cx} y={by + size / 2 + 7} textAnchor="middle" fill="#0c4a6e" fontSize="20" fontWeight="800">m</text>
            {F > 0.1 && <Arrow x={x - size / 2} y={by + size / 2} dx={clamp(F * 7, 0, 260)} dy={0} color="#1d4ed8" marker="nlBlue" label="F" width={8} />}
            {a > 0.05 && <Arrow x={cx} y={by - 26} dx={clamp(a * 20, 0, 200)} dy={0} color="#7c3aed" marker="nlViolet" label="a" width={5} />}
        </g>
    );
};

const ThirdScene: React.FC<{ gunX: number; bulX: number; gunW: number; gunH: number; bulW: number; bulH: number; charge: number; fired: boolean; vg: number; vb: number }> = ({ gunX, bulX, gunW, gunH, bulW, bulH, charge, fired, vg, vb }) => {
    const gy = GROUND_Y - gunH;
    const lx = gunX - gunW / 2, rx = gunX + gunW / 2;
    const barrelY = gy + gunH * 0.30, barrelH = gunH * 0.26;
    const barrelCenterY = barrelY + barrelH / 2;
    const recvX = lx + gunW * 0.30, recvW = gunW * 0.30;
    const recvY = gy + gunH * 0.18, recvH = gunH * 0.56;
    const barrelStartX = recvX + recvW * 0.5;
    const by = barrelCenterY - bulH / 2;           // bullet rides in the barrel line
    return (
        <g>
            {/* ground shadow */}
            <ellipse cx={gunX} cy={GROUND_Y + 6} rx={gunW * 0.5} ry="9" fill="#0f172a" opacity="0.1" />

            {/* === side-view shotgun (muzzle points right) === */}
            {/* wooden butt-stock */}
            <path d={`M ${lx} ${recvY + recvH * 0.1} L ${recvX + recvW * 0.5} ${recvY} L ${recvX + recvW * 0.5} ${recvY + recvH} L ${lx + gunW * 0.12} ${GROUND_Y} L ${lx} ${GROUND_Y} Z`} fill="#b45309" stroke="#7c2d12" strokeWidth="2" strokeLinejoin="round" />
            {/* wooden fore-end / pump under the barrel */}
            <rect x={gunX + gunW * 0.06} y={barrelY + barrelH - 1} width={gunW * 0.24} height={gunH * 0.20} rx="6" fill="#92400e" stroke="#7c2d12" strokeWidth="1.5" />
            {/* barrel */}
            <rect x={barrelStartX} y={barrelY} width={rx - barrelStartX} height={barrelH} rx={barrelH / 2} fill="url(#nlGun)" stroke="#1e293b" strokeWidth="2" />
            {/* muzzle tip */}
            <rect x={rx - 7} y={barrelY - 2} width="9" height={barrelH + 4} rx="3" fill="#0f172a" />
            {/* receiver / body */}
            <rect x={recvX} y={recvY} width={recvW} height={recvH} rx="6" fill="url(#nlGun)" stroke="#1e293b" strokeWidth="2.5" />
            {/* trigger guard + trigger */}
            <path d={`M ${recvX + recvW * 0.40} ${recvY + recvH} q 9 17 24 0`} fill="none" stroke="#1e293b" strokeWidth="3" />
            <line x1={recvX + recvW * 0.52} y1={recvY + recvH} x2={recvX + recvW * 0.52} y2={recvY + recvH + 9} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            {/* gun label */}
            <text x={recvX + recvW * 0.5} y={gy - 8} textAnchor="middle" fill="#475569" fontSize="13" fontWeight="800">shotgun (mass M)</text>

            {/* === bullet (sits in the barrel) === */}
            <rect x={bulX - bulW / 2} y={by} width={bulW} height={bulH} rx={bulH / 2} fill="#fb7185" stroke="#be123c" strokeWidth="2.5" />
            <circle cx={bulX + bulW / 2 - 5} cy={by + bulH / 2} r={bulH * 0.18} fill="#fecdd3" />

            {/* charge indicator */}
            {!fired && charge > 0.05 && <text x={bulX} y={by - 14} textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="700">loaded {Math.round(charge * 100)}%</text>}

            {/* equal & opposite force arrows on fire */}
            {fired && (
                <>
                    <Arrow x={bulX + bulW / 2} y={by + bulH / 2} dx={clamp(vb * 6, 20, 200)} dy={0} color="#1d4ed8" marker="nlBlue" label="bullet" width={6} />
                    <Arrow x={lx} y={recvY + recvH / 2} dx={clamp(vg * 6, -160, -16)} dy={0} color="#dc2626" marker="nlRed" label="recoil" width={6} />
                </>
            )}
        </g>
    );
};

// ---- left-aside SVG cards (unchanged visuals) -----------------------------

const VelocityTimeSVG: React.FC<{ friction: boolean }> = ({ friction }) => {
    const vw = 372, vh = 188, left = 40, top = 14, plotW = vw - left - 16, plotH = vh - top - 30;
    const path = friction
        ? `M ${left} ${top + 10} L ${left + plotW * 0.7} ${top + plotH} L ${left + plotW} ${top + plotH}`
        : `M ${left} ${top + plotH * 0.4} L ${left + plotW} ${top + plotH * 0.4}`;
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[186px] w-full">
            <line x1={left} y1={top} x2={left} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <line x1={left} y1={top + plotH} x2={left + plotW} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <path d={path} fill="none" stroke={friction ? '#dc2626' : '#16a34a'} strokeWidth="4" strokeLinecap="round" />
            <text x={left + plotW} y={top + plotH + 20} textAnchor="end" fill="#475569" fontSize="12" fontWeight="700">time →</text>
            <text x={left - 6} y={top + 6} textAnchor="end" fill="#475569" fontSize="12" fontWeight="700">v</text>
        </svg>
    );
};

const AccelForceSVG: React.FC<{ mass: number; appliedF: number }> = ({ mass, appliedF }) => {
    const vw = 372, vh = 150, left = 42, top = 12, plotW = vw - left - 16, plotH = vh - top - 28;
    const fMax = 40, aMax = fMax / mass;
    const mx = (f: number) => left + (f / fMax) * plotW;
    const my = (a: number) => top + (1 - a / Math.max(aMax, 0.001)) * plotH;
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[148px] w-full">
            <line x1={left} y1={top} x2={left} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <line x1={left} y1={top + plotH} x2={left + plotW} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <line x1={mx(0)} y1={my(0)} x2={mx(fMax)} y2={my(aMax)} stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx={mx(clamp(appliedF, 0, fMax))} cy={my(clamp(appliedF / mass, 0, aMax))} r="6.5" fill="#fff" stroke="#7c3aed" strokeWidth="3.5" />
            <text x={left + plotW} y={top + plotH + 18} textAnchor="end" fill="#475569" fontSize="11" fontWeight="700">force F →</text>
            <text x={left - 6} y={top + 6} textAnchor="end" fill="#475569" fontSize="11" fontWeight="700">a</text>
        </svg>
    );
};

const AccelMassSVG: React.FC<{ mass: number; appliedF: number }> = ({ mass, appliedF }) => {
    const vw = 372, vh = 150, left = 42, top = 12, plotW = vw - left - 16, plotH = vh - top - 28;
    const mMax = 12, aMax = appliedF / 1;
    const mx = (m: number) => left + (m / mMax) * plotW;
    const my = (a: number) => top + (1 - a / Math.max(aMax, 0.001)) * plotH;
    const path = Array.from({ length: 49 }, (_, i) => { const m = 1 + (mMax - 1) * i / 48; return `${i ? 'L' : 'M'}${mx(m).toFixed(1)},${my(appliedF / m).toFixed(1)}`; }).join(' ');
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[148px] w-full">
            <line x1={left} y1={top} x2={left} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <line x1={left} y1={top + plotH} x2={left + plotW} y2={top + plotH} stroke="#475569" strokeWidth="1.4" />
            <path d={path} fill="none" stroke="#0ea5e9" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx={mx(clamp(mass, 1, mMax))} cy={my(clamp(appliedF / mass, 0, aMax))} r="6.5" fill="#fff" stroke="#0ea5e9" strokeWidth="3.5" />
            <text x={left + plotW} y={top + plotH + 18} textAnchor="end" fill="#475569" fontSize="11" fontWeight="700">mass m →</text>
            <text x={left - 6} y={top + 6} textAnchor="end" fill="#475569" fontSize="11" fontWeight="700">a</text>
        </svg>
    );
};

const MomentumBarsSVG: React.FC<{ p1: number; p2: number }> = ({ p1, p2 }) => {
    const vw = 372, vh = 170, mid = vh / 2 - 6;
    const peak = Math.max(p1, p2, 1);
    const len = (p: number) => clamp((p / peak) * 150, 4, 150);
    return (
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[168px] w-full">
            <line x1={vw / 2} y1="12" x2={vw / 2} y2={vh - 24} stroke="#cbd5e1" strokeWidth="2" />
            <rect x={vw / 2 - len(p1)} y={mid - 46} width={len(p1)} height="34" rx="7" fill="#1d4ed822" stroke="#1d4ed8" strokeWidth="2.5" />
            <text x={vw / 2 - len(p1) - 6} y={mid - 26} textAnchor="end" fill="#1d4ed8" fontSize="14" fontWeight="800">bullet {fmt(p1)}</text>
            <rect x={vw / 2} y={mid + 12} width={len(p2)} height="34" rx="7" fill="#dc262622" stroke="#dc2626" strokeWidth="2.5" />
            <text x={vw / 2 + len(p2) + 6} y={mid + 32} textAnchor="start" fill="#dc2626" fontSize="14" fontWeight="800">gun {fmt(p2)}</text>
            <text x={vw / 2} y={vh - 6} textAnchor="middle" fill="#16a34a" fontSize="13" fontWeight="800">p_bullet + p_gun = 0</text>
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
    <button onClick={onClick} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${on ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
        <span className={`h-4 w-4 rounded-full border-2 ${on ? 'border-rose-500 bg-rose-500' : 'border-slate-300'}`} /> {label}
    </button>
);

export default NewtonsLawsLab;
