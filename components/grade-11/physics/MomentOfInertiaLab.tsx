import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CircleDot, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface MomentOfInertiaLabProps {
    topic: any;
    onExit: () => void;
}

type BodyId = 'ring' | 'disc' | 'rod' | 'sphere';

interface BodyDef {
    id: BodyId;
    label: string;
    formula: string;
    axis: string;
    coefficient: number;
    sizeSymbol: 'R' | 'L';
    color: string;
}

const W = 1280;
const H = 760;
const BODIES: BodyDef[] = [
    { id: 'ring', label: 'Thin ring', formula: 'I = MR²', axis: 'Through centre, perpendicular to plane', coefficient: 1, sizeSymbol: 'R', color: '#0891b2' },
    { id: 'disc', label: 'Circular disc', formula: 'I = ½MR²', axis: 'Through centre, perpendicular to plane', coefficient: 0.5, sizeSymbol: 'R', color: '#2563eb' },
    { id: 'rod', label: 'Thin rod', formula: 'I = ML²/12', axis: 'Through midpoint, perpendicular to rod', coefficient: 1 / 12, sizeSymbol: 'L', color: '#d97706' },
    { id: 'sphere', label: 'Solid sphere', formula: 'I = ⅖MR²', axis: 'About a diameter', coefficient: 2 / 5, sizeSymbol: 'R', color: '#7c3aed' },
];

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const fmt = (value: number, digits = 2) => (Math.abs(value) < 0.0005 ? 0 : value).toFixed(digits);

const MomentOfInertiaLab: React.FC<MomentOfInertiaLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const lastFrameRef = useRef<number | null>(null);
    const angleRef = useRef(0);
    const omegaRef = useRef(0);
    const lastLiveRef = useRef(0);

    const [bodyId, setBodyId] = useState<BodyId>('ring');
    const [mass, setMass] = useState(8);
    const [size, setSize] = useState(2);
    const [torque, setTorque] = useState(20);
    const [direction, setDirection] = useState<1 | -1>(1);
    const [animationSpeed, setAnimationSpeed] = useState(0.5);
    const [paused, setPaused] = useState(false);
    const [live, setLive] = useState({ omega: 0, angle: 0 });

    const body = BODIES.find(item => item.id === bodyId) ?? BODIES[0];
    const momentOfInertia = body.coefficient * mass * size * size;
    const signedTorque = direction * torque;
    const angularAcceleration = momentOfInertia > 0 ? signedTorque / momentOfInertia : 0;
    const radiusOfGyration = Math.sqrt(momentOfInertia / mass);
    const kineticEnergy = 0.5 * momentOfInertia * live.omega * live.omega;

    const model = useMemo(() => ({ body, mass, size, torque: signedTorque, angularAcceleration, momentOfInertia, animationSpeed, paused }), [animationSpeed, angularAcceleration, body, mass, momentOfInertia, paused, signedTorque, size]);
    const modelRef = useRef(model);
    useEffect(() => { modelRef.current = model; }, [model]);

    const resetMotion = () => {
        angleRef.current = 0;
        omegaRef.current = 0;
        lastFrameRef.current = null;
        setLive({ omega: 0, angle: 0 });
    };

    const resetAll = () => {
        setBodyId('ring'); setMass(8); setSize(2); setTorque(20); setDirection(1); setAnimationSpeed(0.5); setPaused(false);
        resetMotion();
    };

    const selectBody = (id: BodyId) => { setBodyId(id); resetMotion(); };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const render = (now: number) => {
            const state = modelRef.current;
            const previous = lastFrameRef.current ?? now;
            const dt = Math.min(0.05, (now - previous) / 1000);
            lastFrameRef.current = now;
            if (!state.paused) {
                omegaRef.current += state.angularAcceleration * dt;
                // cap angular speed so the spin stays slow enough to follow; the
                // acceleration phase (rest -> cap) is where larger I visibly spins up slower
                const cap = 2.6;
                omegaRef.current = clamp(omegaRef.current, -cap, cap);
                angleRef.current += omegaRef.current * dt * state.animationSpeed;
                if (now - lastLiveRef.current > 90) {
                    lastLiveRef.current = now;
                    setLive({ omega: omegaRef.current, angle: angleRef.current });
                }
            }
            drawBackground(ctx);
            drawRotationBench(ctx, state, angleRef.current, omegaRef.current);
            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, []);

    const comparisonValues = BODIES.map(item => ({ ...item, value: item.coefficient * mass * size * size }));
    const maxComparison = Math.max(...comparisonValues.map(item => item.value), 1);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Moment of inertia comparison</div>
                    <div className="text-xs font-semibold text-slate-500">Same numerical M and size parameter</div>
                    <div className="mt-4 space-y-3">
                        {comparisonValues.map(item => (
                            <div key={item.id}>
                                <div className="mb-1 flex justify-between text-xs font-bold text-slate-600"><span>{item.label}</span><span className="font-mono text-slate-900">{fmt(item.value)} kg m²</span></div>
                                <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all duration-300" style={{ width: `${item.value / maxComparison * 100}%`, backgroundColor: item.color }} /></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Angular response</div>
                    <div className="text-xs font-semibold text-slate-500">Same applied torque: alpha = tau / I</div>
                    <svg viewBox="0 0 310 185" className="mt-2 w-full">
                        <line x1="38" y1="145" x2="292" y2="145" stroke="#475569" strokeWidth="1.5" />
                        <line x1="38" y1="24" x2="38" y2="145" stroke="#475569" strokeWidth="1.5" />
                        {comparisonValues.map((item, index) => {
                            const alpha = item.value > 0 ? torque / item.value : 0;
                            const maxAlpha = Math.max(...comparisonValues.map(row => torque / row.value));
                            const height = alpha / maxAlpha * 96;
                            const x = 58 + index * 59;
                            return <g key={item.id}><rect x={x} y={145 - height} width="35" height={height} rx="6" fill={item.color} opacity={item.id === bodyId ? 1 : 0.55} /><text x={x + 17.5} y="164" textAnchor="middle" fill="#64748b" fontSize="10">{item.id}</text></g>;
                        })}
                        <text x="18" y="29" textAnchor="middle" fill="#64748b" fontSize="11">alpha</text>
                    </svg>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">NCERT Table 6.1</div>
                    <div className="mt-2 space-y-1.5 text-xs text-slate-700">
                        {BODIES.map(item => <div key={item.id} className="flex justify-between gap-3"><span>{item.label}</span><span className="font-mono font-bold text-slate-900">{item.formula}</span></div>)}
                    </div>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-violet-950">Rotational inertia</div>
                    <div className="text-xs font-semibold text-violet-700">NCERT Ch 6, Sections 6.9-6.11</div>
                    <div className="mt-3 space-y-2 text-sm leading-snug text-violet-950">
                        <p className="font-mono font-bold">I = sum(mᵢ rᵢ²)</p>
                        <p>Moment of inertia is the rotational analogue of mass.</p>
                        <p>It depends on the body and the chosen axis, not on angular speed.</p>
                        <p className="font-mono font-bold">tau = I alpha</p>
                        <p>For the same torque, a larger I produces a smaller angular acceleration.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-extrabold text-slate-900">Real-time values</h3><span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live</span></div>
                    <div className="grid gap-2">
                        <ValueCard label="Selected body" value={body.label} tone="slate" />
                        <ValueCard label="Moment of inertia I" value={`${fmt(momentOfInertia)} kg m²`} tone="violet" />
                        <ValueCard label="Radius of gyration k" value={`${fmt(radiusOfGyration)} m`} tone="blue" />
                        <ValueCard label="Angular acceleration alpha" value={`${fmt(angularAcceleration)} rad/s²`} tone={direction === 1 ? 'emerald' : 'rose'} />
                        <ValueCard label="Angular velocity omega" value={`${fmt(live.omega)} rad/s`} tone="cyan" />
                        <ValueCard label="Rotational kinetic energy" value={`${fmt(kineticEnergy)} J`} tone="amber" />
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button onClick={() => setPaused(value => !value)} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
                    <button onClick={resetAll} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50" title="Reset"><RotateCcw size={16} /></button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="flex h-full w-full flex-col gap-4 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><CircleDot size={18} className="text-violet-700" /> Moment of Inertia Bench</div>
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:grid-cols-4">
                    {BODIES.map(item => <button key={item.id} onClick={() => selectBody(item.id)} className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${bodyId === item.id ? 'bg-violet-700 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>{item.label}</button>)}
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Slider label="Total mass M" value={mass} min={2} max={20} step={1} unit="kg" accent="accent-violet-600" onChange={value => { setMass(value); resetMotion(); }} />
                <Slider label={body.sizeSymbol === 'R' ? 'Radius R' : 'Length L'} value={size} min={1} max={4} step={0.1} unit="m" accent="accent-blue-600" onChange={value => { setSize(value); resetMotion(); }} />
                <Slider label="Applied torque" value={torque} min={0} max={30} step={1} unit="N m" accent="accent-amber-600" onChange={value => { setTorque(value); resetMotion(); }} />
                <Slider label="Animation speed" value={animationSpeed} min={0.2} max={1.0} step={0.1} unit="x" accent="accent-emerald-600" onChange={setAnimationSpeed} />
                <div className="rounded-xl border border-slate-200 bg-white p-3 md:col-span-2">
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">Torque direction</div>
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                        <button onClick={() => { setDirection(1); resetMotion(); }} className={`rounded-md px-3 py-2 text-xs font-bold ${direction === 1 ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>Anticlockwise</button>
                        <button onClick={() => { setDirection(-1); resetMotion(); }} className={`rounded-md px-3 py-2 text-xs font-bold ${direction === -1 ? 'bg-rose-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>Clockwise</button>
                    </div>
                </div>
            </div>
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} simulationStageWidth={W} simulationStageHeight={H} simulationAreaFlex="7 1 0%" controlsAreaFlex="3 1 0%" controlsWrapperClassName="w-full h-full max-w-[min(100%,860px)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:rounded-3xl md:p-5" />;
};

const PX_PER_M = 52;          // pixels per metre for the size dimension (R or L)

const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(15,23,42,0.045)'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
};

const drawRotationBench = (ctx: CanvasRenderingContext2D, state: { body: BodyDef; mass: number; size: number; torque: number; angularAcceleration: number; momentOfInertia: number; animationSpeed: number; paused: boolean }, physicalAngle: number, omega: number) => {
    const cx = 640, cy = 388;
    const angle = -physicalAngle;
    const color = state.body.color;

    // ---- headings -----------------------------------------------------
    ctx.textAlign = 'center'; ctx.fillStyle = '#0f172a'; ctx.font = '800 28px Inter, sans-serif';
    ctx.fillText(`${state.body.label} — rotating about the fixed axis O`, cx, 60);
    ctx.fillStyle = '#64748b'; ctx.font = '600 16px Inter, sans-serif';
    ctx.fillText('Every bit of mass m sits at a distance r from the axis. Add up m·r² for all of them → I', cx, 88);

    // ---- geometry in pixels -------------------------------------------
    const Rpx = clamp(state.size * PX_PER_M, 60, 250);                 // outer extent (R, or rod half = Rpx/2)
    const halfRod = Rpx / 2;
    const kPx = clamp(Math.sqrt(state.body.coefficient) * state.size * PX_PER_M, 26, 250); // radius of gyration

    // ---- 1. the actual body shape (faint, so the mass beads read on top)
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
    if (state.body.id === 'ring') drawRing(ctx, color, Rpx);
    if (state.body.id === 'disc') drawDisc(ctx, color, Rpx);
    if (state.body.id === 'rod') drawRod(ctx, color, halfRod);
    if (state.body.id === 'sphere') drawSphere(ctx, color, Rpx);
    ctx.restore();

    // ---- 2. radius-of-gyration circle: where all the mass could sit as one ring
    ctx.save();
    ctx.setLineDash([10, 8]); ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, kPx, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // ---- 3. discrete mass beads m on the k-circle, with radius lines r = k
    const beads = state.body.id === 'rod' ? 6 : 10;
    for (let i = 0; i < beads; i++) {
        const theta = (i / beads) * Math.PI * 2 + angle;
        const bx = cx + Math.cos(theta) * kPx;
        const by = cy + Math.sin(theta) * kPx;
        ctx.strokeStyle = 'rgba(124,58,237,0.35)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.lineWidth = 0;
        ctx.font = '800 9px Inter, sans-serif'; ctx.fillText('m', bx, by + 3);
    }

    // ---- 4. one highlighted radius line labelled r = k -----------------
    const hx = cx + Math.cos(angle) * kPx, hy = cy + Math.sin(angle) * kPx;
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = '#7c3aed'; ctx.font = '800 16px Inter, sans-serif';
    ctx.fillText('r = k', cx + Math.cos(angle) * (kPx * 0.55) + 14, cy + Math.sin(angle) * (kPx * 0.55) - 8);

    // ---- 5. fixed axis hub at O ---------------------------------------
    ctx.save(); ctx.shadowColor = 'rgba(15,23,42,0.3)'; ctx.shadowBlur = 12; ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.font = '800 11px Inter, sans-serif'; ctx.fillText('O', cx, cy + 4);

    // ---- 6. applied torque: a clean three-quarter curved arrow ---------
    const ccw = state.torque >= 0;
    const arrowColor = ccw ? '#16a34a' : '#e11d48';
    if (Math.abs(state.torque) > 0.001) {
        const Ra = Math.max(Rpx, kPx) + 46;
        const a0 = ccw ? 0.35 : Math.PI - 0.35;
        const a1 = ccw ? -Math.PI * 1.15 : Math.PI + Math.PI * 1.15;
        ctx.strokeStyle = arrowColor; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(cx, cy, Ra, a0, a1, ccw); ctx.stroke();
        // arrow head
        const tip = a1, tx = cx + Math.cos(tip) * Ra, ty = cy + Math.sin(tip) * Ra;
        const tang = tip + (ccw ? -Math.PI / 2 : Math.PI / 2);
        ctx.fillStyle = arrowColor; ctx.beginPath();
        ctx.moveTo(tx + Math.cos(tang) * 16, ty + Math.sin(tang) * 16);
        ctx.lineTo(tx + Math.cos(tang + 2.5) * 16, ty + Math.sin(tang + 2.5) * 16);
        ctx.lineTo(tx + Math.cos(tang - 2.5) * 16, ty + Math.sin(tang - 2.5) * 16);
        ctx.closePath(); ctx.fill();
        ctx.lineCap = 'butt';
        ctx.font = '800 16px Inter, sans-serif';
        ctx.fillText(`applied torque τ (${ccw ? 'anticlockwise' : 'clockwise'})`, cx, cy - Ra - 16);
    }

    // ---- 7. bottom caption: the take-away ------------------------------
    ctx.fillStyle = '#7c3aed'; ctx.font = '700 15px Inter, sans-serif';
    ctx.fillText('Dashed violet circle = radius of gyration k:  I = Σ m r² = M k²', cx, 700);
    ctx.fillStyle = '#475569'; ctx.font = '700 14px Inter, sans-serif';
    ctx.fillText(`τ = I α  →  same torque, larger I spins up slower    |    ω = ${fmt(omega)} rad/s`, cx, 726);
};

const drawRing = (ctx: CanvasRenderingContext2D, color: string, R: number) => {
    ctx.save(); ctx.globalAlpha = 0.9; ctx.strokeStyle = color; ctx.lineWidth = Math.max(14, R * 0.16);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
};

const drawDisc = (ctx: CanvasRenderingContext2D, color: string, R: number) => {
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.9; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
};

const drawRod = (ctx: CanvasRenderingContext2D, color: string, half: number) => {
    ctx.save(); ctx.globalAlpha = 0.85; const h = 26; roundRect(ctx, -half, -h / 2, half * 2, h, 12);
    ctx.fillStyle = color; ctx.fill(); ctx.restore();
};

const drawSphere = (ctx: CanvasRenderingContext2D, color: string, R: number) => {
    const gradient = ctx.createRadialGradient(-R * 0.34, -R * 0.36, R * 0.05, 0, 0, R);
    gradient.addColorStop(0, '#ede9fe'); gradient.addColorStop(0.5, color); gradient.addColorStop(1, '#2e1065');
    ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.8; ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, 0, R, R * 0.33, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => { ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.arcTo(x + width, y, x + width, y + height, radius); ctx.arcTo(x + width, y + height, x, y + height, radius); ctx.arcTo(x, y + height, x, y, radius); ctx.arcTo(x, y, x + width, y, radius); ctx.closePath(); };

const ValueCard: React.FC<{ label: string; value: string; tone: 'slate' | 'violet' | 'blue' | 'emerald' | 'rose' | 'cyan' | 'amber' }> = ({ label, value, tone }) => {
    const styles = { slate: 'bg-slate-50 text-slate-800', violet: 'bg-violet-50 text-violet-800', blue: 'bg-blue-50 text-blue-800', emerald: 'bg-emerald-50 text-emerald-800', rose: 'bg-rose-50 text-rose-800', cyan: 'bg-cyan-50 text-cyan-800', amber: 'bg-amber-50 text-amber-800' };
    return <div className={`rounded-lg border border-slate-100 px-3 py-2.5 ${styles[tone]}`}><div className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</div><div className="mt-1 font-mono text-base font-extrabold">{value}</div></div>;
};

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit: string; accent: string; onChange: (value: number) => void }> = ({ label, value, min, max, step, unit, accent, onChange }) => <label className="rounded-xl border border-slate-200 bg-white p-3"><span className="mb-2 flex justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600"><span>{label}</span><span className="font-mono text-sm text-slate-900">{fmt(value, step < 1 ? 1 : 0)} {unit}</span></span><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className={`h-2 w-full cursor-pointer ${accent}`} /></label>;

export default MomentOfInertiaLab;
