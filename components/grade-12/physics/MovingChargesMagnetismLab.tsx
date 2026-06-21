import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, CircleDot, Magnet, Pause, Play, RotateCcw, Waves } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface Props { topic: any; onExit: () => void; }
type Mode = 'charge' | 'wire' | 'selector';

const W = 1280;
const H = 760;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const rad = (d: number) => (d * Math.PI) / 180;

const MovingChargesMagnetismLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tRef = useRef(0);

    const [mode, setMode] = useState<Mode>('charge');
    const [paused, setPaused] = useState(false);

    // Scene A — moving charge
    const [charge, setCharge] = useState(1);          // C  (sign matters; magnitude scales force)
    const [speed, setSpeed] = useState(4);            // m/s
    const [field, setField] = useState(1.5);          // T  (B into page)
    const [angle, setAngle] = useState(90);           // deg (v with B)
    const [mass, setMass] = useState(2);              // kg

    // Scene B — current-carrying wire
    const [current, setCurrent] = useState(3);        // A
    const [length, setLength] = useState(2);          // m
    const [wireAngle, setWireAngle] = useState(90);   // deg (wire with B)

    // Scene C — velocity selector
    const [electricField, setElectricField] = useState(6); // N/C
    const [selectorSpeed, setSelectorSpeed] = useState(4); // m/s

    const values = useMemo(() => {
        const th = rad(angle);
        const qAbs = Math.abs(charge) || 1e-6;
        const force = qAbs * speed * field * Math.sin(th);
        const radius = (mass * speed) / (qAbs * field);
        const period = (2 * Math.PI * mass) / (qAbs * field);
        const pitch = (2 * Math.PI * mass * speed * Math.cos(th)) / (qAbs * field);
        const wireForce = current * length * field * Math.sin(rad(wireAngle));
        const matched = electricField / field;
        return { force, radius, period, pitch, wireForce, matched };
    }, [angle, charge, current, electricField, field, length, mass, speed, wireAngle]);

    const reset = useCallback(() => {
        setMode('charge'); setPaused(false);
        setCharge(1); setSpeed(4); setField(1.5); setAngle(90); setMass(2);
        setCurrent(3); setLength(2); setWireAngle(90);
        setElectricField(6); setSelectorSpeed(4);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let raf = 0;
        let last = performance.now();
        const draw = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (!paused) tRef.current += dt;
            const t = tRef.current;

            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
            for (let x = 40; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, H - 30); ctx.stroke(); }
            for (let y = 40; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke(); }

            // Title strip
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            const title =
                mode === 'charge' ? 'Charge in a uniform B (into the page) — F = q v × B  (NCERT §4.3)' :
                mode === 'wire' ? 'Current-carrying conductor — F = I L × B  (NCERT §4.4)' :
                'Velocity selector — straight-line motion when qE = qvB  (NCERT §4.3)';
            ctx.fillText(title, 24, 30);

            if (mode === 'charge') drawCharge(ctx, t, charge, speed, field, angle, mass, values.radius, values.period, values.force);
            else if (mode === 'wire') drawWire(ctx, t, current, length, field, wireAngle, values.wireForce);
            else drawSelector(ctx, t, electricField, field, selectorSpeed, values.matched);

            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [mode, paused, charge, speed, field, angle, mass, current, length, wireAngle, electricField, selectorSpeed, values.radius, values.period, values.force, values.wireForce, values.matched]);

    // ============= GRAPH PANEL =============
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Right-hand rule</div>
                    <div className="text-xs font-semibold text-slate-500">For a positive charge: fingers v → curl to B → thumb gives F</div>
                    <div className="mt-3 grid grid-cols-3 items-center text-center">
                        <div><div className="text-2xl text-blue-700">→</div><b className="text-xs">velocity v</b></div>
                        <div><div className="text-2xl text-violet-700">⊗</div><b className="text-xs">field B (in)</b></div>
                        <div><div className="text-2xl text-red-700">↑</div><b className="text-xs">force F</b></div>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">F / F<sub>max</sub> = sin θ</div>
                    <div className="text-xs font-semibold text-slate-500">Force is maximum at θ = 90°, zero when v ∥ B</div>
                    <svg viewBox="0 0 300 190" className="mt-2 w-full h-[170px]">
                        <path d="M35 15V160H285" fill="none" stroke="#475569" strokeWidth="2" />
                        {Array.from({ length: 91 }, (_, i) => [35 + (i / 90) * 250, 160 - Math.sin(rad(i)) * 135] as [number, number])
                            .map((p, i, arr) => i === 0 ? null : <line key={i} x1={arr[i - 1][0]} y1={arr[i - 1][1]} x2={p[0]} y2={p[1]} stroke="#d97706" strokeWidth="3" />)}
                        {(() => {
                            const a = mode === 'wire' ? wireAngle : angle;
                            return <circle cx={35 + (a / 90) * 250} cy={160 - Math.sin(rad(a)) * 135} r="6" fill="#dc2626" stroke="#fff" strokeWidth="2" />;
                        })()}
                        <text x="160" y="184" textAnchor="middle" fill="#64748b" fontSize="12">θ (deg)</text>
                        <text x="20" y="20" fill="#64748b" fontSize="11">1</text>
                    </svg>
                </div>
            </div>
        </aside>
    );

    // ============= VALUES PANEL =============
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl">
                    <div className="text-base font-extrabold text-amber-900">
                        {mode === 'charge' ? 'Lorentz force' : mode === 'wire' ? 'Force on conductor' : 'Velocity selector'}
                    </div>
                    <div className="text-xs font-semibold text-amber-700">NCERT Class 12 · Ch 4</div>
                    {mode === 'charge' && (
                        <ul className="mt-3 space-y-1.5 text-sm leading-snug text-amber-950">
                            <li><b>F = q(v × B)</b>; magnitude qvB sin θ</li>
                            <li>θ = 90° → circle of radius <b>r = mv/qB</b></li>
                            <li>θ &lt; 90° → helix, pitch <b>2π m v cos θ/qB</b></li>
                            <li>Magnetic force does no work — speed is constant.</li>
                        </ul>
                    )}
                    {mode === 'wire' && (
                        <ul className="mt-3 space-y-1.5 text-sm leading-snug text-amber-950">
                            <li><b>F = I L × B</b>; magnitude BIL sin θ</li>
                            <li>θ = angle between current and B</li>
                            <li>Reverse the current → force flips.</li>
                        </ul>
                    )}
                    {mode === 'selector' && (
                        <ul className="mt-3 space-y-1.5 text-sm leading-snug text-amber-950">
                            <li><b>qE</b> down, <b>qvB</b> up (E ⊥ B ⊥ v)</li>
                            <li>Straight path iff <b>v = E/B</b></li>
                            <li>Slower particles bend down; faster ones bend up.</li>
                        </ul>
                    )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="font-extrabold text-slate-900">Real-time values</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE
                        </span>
                    </div>
                    <div className="space-y-2">
                        {mode === 'charge' && (
                            <>
                                <Value label="Lorentz force F" value={`${values.force.toFixed(2)} N`} />
                                <Value label="Orbit radius r = mv/qB" value={`${values.radius.toFixed(2)} m`} />
                                <Value label="Period T = 2πm/qB" value={`${values.period.toFixed(2)} s`} />
                                <Value label="Helix pitch" value={`${Math.abs(values.pitch).toFixed(2)} m`} />
                                <Value label="Work done by B" value="0 J" />
                            </>
                        )}
                        {mode === 'wire' && (
                            <>
                                <Value label="Force on wire F" value={`${values.wireForce.toFixed(2)} N`} />
                                <Value label="F per unit length" value={`${(values.wireForce / Math.max(length, 0.01)).toFixed(2)} N/m`} />
                                <Value label="Direction" value={current >= 0 ? 'Upward (↑)' : 'Downward (↓)'} />
                            </>
                        )}
                        {mode === 'selector' && (
                            <>
                                <Value label="Selected speed v = E/B" value={`${values.matched.toFixed(2)} m/s`} />
                                <Value label="Particle speed v" value={`${selectorSpeed.toFixed(2)} m/s`} />
                                <Value label="qE (down)" value={`${(electricField).toFixed(2)} units`} />
                                <Value label="qvB (up)" value={`${(selectorSpeed * field).toFixed(2)} units`} />
                                <Value label="Status" value={
                                    Math.abs(selectorSpeed - values.matched) < 0.15 ? 'BALANCED — straight'
                                        : selectorSpeed > values.matched ? 'qvB > qE → bends up' : 'qE > qvB → bends down'
                                } />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={reset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="w-full">
            <div className="mb-3 flex items-center gap-2 text-slate-800">
                <Magnet size={18} className="text-amber-600" />
                <span className="font-extrabold text-base">Moving Charges &amp; Magnetism Bench</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Scene</div>
                    <div className="grid grid-cols-3 gap-2">
                        <ModeButton active={mode === 'charge'} label="Moving charge" icon={<CircleDot size={15} />} onClick={() => setMode('charge')} />
                        <ModeButton active={mode === 'wire'} label="Conductor" icon={<Activity size={15} />} onClick={() => setMode('wire')} />
                        <ModeButton active={mode === 'selector'} label="Velocity selector" icon={<Waves size={15} />} onClick={() => setMode('selector')} />
                    </div>
                </div>

                {mode === 'charge' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <Slider label="Charge q" value={charge} min={-2} max={2} step={1} unit="C" onChange={v => setCharge(v === 0 ? 1 : v)} />
                            <div className="h-3" />
                            <Slider label="Speed v" value={speed} min={1} max={10} step={0.5} unit="m/s" onChange={setSpeed} />
                            <div className="h-3" />
                            <Slider label="Mass m" value={mass} min={1} max={5} step={0.5} unit="kg" onChange={setMass} />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <Slider label="Magnetic field B (into page)" value={field} min={0.2} max={3} step={0.1} unit="T" onChange={setField} />
                            <div className="h-3" />
                            <Slider label="Angle θ between v and B" value={angle} min={10} max={90} step={5} unit="°" onChange={setAngle} />
                            <p className="mt-2 text-xs text-slate-500 leading-snug">θ = 90° → pure circle. θ &lt; 90° → helix (v cos θ along B, v sin θ around B).</p>
                        </div>
                    </>
                )}

                {mode === 'wire' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <Slider label="Current I" value={current} min={-10} max={10} step={0.5} unit="A" onChange={setCurrent} />
                            <div className="h-3" />
                            <Slider label="Length L" value={length} min={0.5} max={5} step={0.5} unit="m" onChange={setLength} />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <Slider label="Magnetic field B (into page)" value={field} min={0.2} max={3} step={0.1} unit="T" onChange={setField} />
                            <div className="h-3" />
                            <Slider label="Angle θ (wire with B)" value={wireAngle} min={0} max={90} step={5} unit="°" onChange={setWireAngle} />
                        </div>
                    </>
                )}

                {mode === 'selector' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <Slider label="Electric field E (down)" value={electricField} min={1} max={15} step={0.5} unit="N/C" onChange={setElectricField} />
                            <div className="h-3" />
                            <Slider label="Magnetic field B (into page)" value={field} min={0.2} max={3} step={0.1} unit="T" onChange={setField} />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <Slider label="Particle speed v" value={selectorSpeed} min={0.5} max={15} step={0.1} unit="m/s" onChange={setSelectorSpeed} />
                            <p className="mt-2 text-xs text-slate-500 leading-snug">Match v to E/B = <b>{values.matched.toFixed(2)} m/s</b> to make the particle pass straight through.</p>
                        </div>
                    </>
                )}
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

// ============= UI helpers =============
const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }> = ({ label, value, min, max, step, unit, onChange }) => (
    <label className="block">
        <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-700">
            <span>{label}</span>
            <span className="font-mono text-amber-700">{Number(value).toFixed(value % 1 === 0 ? 0 : 2)} {unit}</span>
        </span>
        <input className="h-2 w-full accent-amber-500" type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))} />
    </label>
);

const ModeButton: React.FC<{ active: boolean; label: string; icon: React.ReactNode; onClick: () => void }> = ({ active, label, icon, onClick }) => (
    <button onClick={onClick}
        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${active ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
        {icon}{label}
    </button>
);

const Value: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 font-mono text-base font-extrabold text-amber-700">{value}</div>
    </div>
);

// ============= CANVAS DRAWING =============

// Draw "B into page" dots — density scales with |B|
function fieldDots(ctx: CanvasRenderingContext2D, B: number, x0 = 80, y0 = 80, x1 = W - 50, y1 = H - 50) {
    const bNorm = clamp((B - 0.2) / 2.8, 0, 1);
    const step = Math.round(120 - bNorm * 70); // 120..50 px
    const dotR = 2 + bNorm * 2.5;
    const ringR = 6 + bNorm * 4;
    ctx.strokeStyle = '#93c5fd';
    ctx.fillStyle = '#2563eb';
    ctx.lineWidth = 1.5;
    for (let x = x0; x < x1; x += step) {
        for (let y = y0; y < y1; y += step) {
            ctx.beginPath(); ctx.arc(x, y, ringR, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, dotR, 0, Math.PI * 2); ctx.fill();
        }
    }
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, label?: string, width = 5) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    const head = 14 + width;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
    ctx.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45));
    ctx.closePath(); ctx.fill();
    if (label) {
        ctx.font = '700 16px Inter, system-ui, sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(label, x2 + 8 * Math.cos(a) + 6, y2 + 8 * Math.sin(a) - 6);
    }
}

// ============= SCENE A — moving charge =============
function drawCharge(ctx: CanvasRenderingContext2D, t: number, q: number, v: number, B: number, angleDeg: number, m: number, radius: number, period: number, force: number) {
    fieldDots(ctx, B);

    const cx = 640, cy = 400;
    // Map physics radius (m) to px — cap so it stays on screen
    const rPx = clamp(radius * 22, 35, 260);

    // Angular speed ω = v⊥ / r ; for animation use signed direction by charge
    const vPerp = v * Math.sin(rad(angleDeg));
    const omega = (vPerp / Math.max(radius, 1e-3)) * (q >= 0 ? 1 : -1);
    const phase = t * omega;

    if (angleDeg >= 89) {
        // ----- Pure circular motion -----
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.beginPath(); ctx.arc(cx, cy, rPx, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);

        const x = cx + rPx * Math.cos(phase);
        const y = cy + rPx * Math.sin(phase);
        // velocity direction (tangent)
        const vx = -Math.sin(phase) * (q >= 0 ? 1 : -1);
        const vy = Math.cos(phase) * (q >= 0 ? 1 : -1);
        // force direction (radially inward for circular motion)
        const fx = (cx - x), fy = (cy - y);
        const fNorm = Math.hypot(fx, fy) || 1;

        // particle
        const pCol = q >= 0 ? '#dc2626' : '#1d4ed8';
        ctx.fillStyle = pCol;
        ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 18px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(q >= 0 ? '+' : '−', x, y + 6); ctx.textAlign = 'left';

        // v and F arrows (length scales with v and force)
        const vLen = 50 + v * 6;
        arrow(ctx, x, y, x + vx * vLen, y + vy * vLen, '#0f172a', 'v');
        const fLen = clamp(force * 18, 35, 140);
        arrow(ctx, x, y, x + (fx / fNorm) * fLen, y + (fy / fNorm) * fLen, '#dc2626', 'F');
    } else {
        // ----- Helical motion: draw a coil from left to right, projected -----
        const len = 800;
        const xStart = cx - len / 2;
        const turns = clamp(len / Math.max(2 * Math.PI * rPx * Math.tan(rad(angleDeg)) * 0.1 + 1e-3, 40), 1.5, 8);
        void turns;
        // Static helix path
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        const segments = 240;
        const pitchPx = clamp(2 * Math.PI * rPx * (Math.cos(rad(angleDeg)) / Math.max(Math.sin(rad(angleDeg)), 0.05)), 60, 360);
        for (let i = 0; i <= segments; i++) {
            const u = i / segments;          // 0..1 along axis
            const xAxis = xStart + u * len;
            const ph = (u * len / pitchPx) * 2 * Math.PI;
            const yh = cy + rPx * Math.sin(ph) * 0.7;
            if (i === 0) ctx.moveTo(xAxis, yh); else ctx.lineTo(xAxis, yh);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Moving particle along the helix
        const axialV = v * Math.cos(rad(angleDeg));
        const u = ((t * axialV * 30) % len) / len;
        const xAxis = xStart + u * len;
        const ph = phase;
        const y = cy + rPx * Math.sin(ph) * 0.7;
        const pCol = q >= 0 ? '#dc2626' : '#1d4ed8';
        ctx.fillStyle = pCol;
        ctx.beginPath(); ctx.arc(xAxis, y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 16px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(q >= 0 ? '+' : '−', xAxis, y + 5); ctx.textAlign = 'left';

        // Axis (along B-perp component)
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(xStart, cy); ctx.lineTo(xStart + len, cy); ctx.stroke();
        ctx.setLineDash([]);
    }

    // Readout strip (top-left)
    ctx.fillStyle = '#475569';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`r = ${radius.toFixed(2)} m   ·   T = ${period.toFixed(2)} s   ·   F = ${force.toFixed(2)} N`, 24, 60);
    ctx.fillText(angleDeg >= 89 ? 'θ = 90° → circular path' : `θ = ${angleDeg}° → helical path (axis along B-parallel component)`, 24, H - 24);

    // m readout
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`q=${q.toFixed(0)} C · v=${v.toFixed(1)} m/s · B=${B.toFixed(2)} T · m=${m.toFixed(1)} kg`, W - 24, 60);
}

// ============= SCENE B — current-carrying conductor =============
function drawWire(ctx: CanvasRenderingContext2D, t: number, I: number, L: number, B: number, angleDeg: number, force: number) {
    fieldDots(ctx, B);

    const cx = 640, cy = 400;
    // Wire length scales with L (0.5..5 m), capped
    const lenPx = clamp(L * 140, 120, 820);
    const th = rad(angleDeg - 90); // 90° = horizontal (perpendicular to vertical reference)

    // Wire endpoints (rotate around centre)
    const dx = (lenPx / 2) * Math.cos(th);
    const dy = (lenPx / 2) * Math.sin(th);
    const x1 = cx - dx, y1 = cy - dy;
    const x2 = cx + dx, y2 = cy + dy;

    // Wire body
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = Math.max(10, 12 + Math.min(12, Math.abs(I))); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.lineCap = 'butt';

    // Animated current carriers (dots flowing along the wire)
    const dir = I >= 0 ? 1 : -1;
    const speed = Math.abs(I) * 40;
    const carriers = Math.max(3, Math.round(Math.abs(I) * 1.5));
    for (let i = 0; i < carriers; i++) {
        const u = (((t * speed + (i * lenPx) / carriers) * dir) % lenPx + lenPx) % lenPx;
        const px = x1 + ((x2 - x1) * u) / lenPx;
        const py = y1 + ((y2 - y1) * u) / lenPx;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Current arrow above the wire
    const cax1 = cx - dx * 0.7 - 18 * Math.sin(th);
    const cay1 = cy - dy * 0.7 + 18 * Math.cos(th);
    const cax2 = cx + dx * 0.7 - 18 * Math.sin(th);
    const cay2 = cy + dy * 0.7 + 18 * Math.cos(th);
    if (Math.abs(I) > 0.05) {
        if (dir > 0) arrow(ctx, cax1, cay1, cax2, cay2, '#0f172a', `I=${I.toFixed(1)} A`, 3);
        else arrow(ctx, cax2, cay2, cax1, cay1, '#0f172a', `I=${I.toFixed(1)} A`, 3);
    }

    // Force F = IL × B — for B into page and current along wire, F is perpendicular to wire in plane
    // direction depends on sign of (I sin θ)
    const Fdir = Math.sign(I) * Math.sign(Math.sin(rad(angleDeg))) || 1;
    const fLenPx = clamp(Math.abs(force) * 24, 0, 200);
    if (fLenPx > 5) {
        // perpendicular to wire, in the screen plane
        const nx = -Math.sin(th) * Fdir;
        const ny = Math.cos(th) * Fdir;
        arrow(ctx, cx, cy, cx + nx * fLenPx, cy + ny * fLenPx, '#dc2626', `F=${force.toFixed(2)} N`, 6);
    }

    // Caption
    ctx.fillStyle = '#475569';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Right-hand rule: fingers along I, curl into B (into page) → thumb gives F.', cx, H - 26);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 14px Inter, system-ui, sans-serif';
    ctx.fillText(`I=${I.toFixed(1)} A · L=${L.toFixed(1)} m · B=${B.toFixed(2)} T · θ=${angleDeg}°`, W - 24, 60);
}

// ============= SCENE C — velocity selector =============
function drawSelector(ctx: CanvasRenderingContext2D, t: number, E: number, B: number, v: number, matched: number) {
    fieldDots(ctx, B, 220, 240, W - 60, 540);

    const cy = 400;
    const xL = 200, xR = 1100;
    // Plates
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(xL, 220, xR - xL, 18);          // top (+)
    ctx.fillRect(xL, 560, xR - xL, 18);          // bottom (−)
    ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2;
    ctx.strokeRect(xL, 220, xR - xL, 18);
    ctx.strokeRect(xL, 560, xR - xL, 18);
    ctx.fillStyle = '#b45309';
    ctx.font = '800 22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('+ + + + + + + + + + + +', xL + 12, 213);
    ctx.fillText('− − − − − − − − − − − −', xL + 12, 600);

    // E-field arrows (down) — density scales with E
    const eRows = clamp(Math.round(E / 2), 2, 7);
    ctx.strokeStyle = '#16a34a'; ctx.fillStyle = '#16a34a'; ctx.lineWidth = 2;
    for (let i = 0; i < eRows; i++) {
        const x = xL + 60 + (i * (xR - xL - 120)) / (eRows - 1);
        arrow(ctx, x, 250, x, 540, '#16a34a', i === 0 ? 'E' : undefined, 2);
    }

    // Particle trajectory: integrate net acceleration
    // Take qE downward, qvxB upward (magnitudes, with v entering rightward)
    // a_y = (E - vB) / m_unit  (positive = downward in screen coords)
    const span = xR - xL - 80;
    const vx = clamp(v * 26, 30, 280);  // px/s entry speed
    // Compute trajectory
    const traj: [number, number][] = [];
    const N = 220;
    const dt = span / vx / N; // seconds across span
    let px = xL + 40, py = cy, pvy = 0;
    const ay = (E - v * B) * 7; // px/s^2 (visual scaling)
    for (let i = 0; i <= N; i++) {
        traj.push([px, py]);
        pvy += ay * dt;
        py += pvy * dt;
        px += vx * dt;
        if (py < 230 || py > 570) break;
    }
    // Path
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath();
    traj.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.stroke();
    ctx.setLineDash([]);

    // Animate the particle along the trajectory
    const cycle = 3.5;                            // seconds for a single sweep
    const u = ((t % cycle) / cycle);
    const idx = clamp(Math.floor(u * (traj.length - 1)), 0, traj.length - 1);
    const [pxA, pyA] = traj[idx];

    // Particle
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(pxA, pyA, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '800 16px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('+', pxA, pyA + 5); ctx.textAlign = 'left';

    // Force arrows on the particle
    const fE = clamp(E * 6, 20, 90);
    arrow(ctx, pxA, pyA, pxA, pyA + fE, '#16a34a', 'qE', 3);
    const fB = clamp(v * B * 6, 0, 110);
    if (fB > 5) arrow(ctx, pxA, pyA, pxA, pyA - fB, '#7c3aed', 'qvB', 3);

    // v arrow on entry
    arrow(ctx, xL + 20, cy, xL + 20 + vx * 0.5, cy, '#0f172a', 'v', 3);

    // Status banner
    const balanced = Math.abs(v - matched) < 0.15;
    ctx.fillStyle = balanced ? '#15803d' : '#b91c1c';
    ctx.font = '800 16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
        balanced
            ? `BALANCED  qE = qvB  →  v = E/B = ${matched.toFixed(2)} m/s  →  straight line`
            : `v = ${v.toFixed(2)} m/s  vs  E/B = ${matched.toFixed(2)} m/s  →  ${v > matched ? 'qvB wins, bends UP' : 'qE wins, bends DOWN'}`,
        W / 2, H - 24
    );
}

export default MovingChargesMagnetismLab;
