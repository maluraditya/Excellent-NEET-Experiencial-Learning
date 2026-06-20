import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Gauge, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface CentreOfMassTorqueLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'centre-of-mass' | 'torque';
type Direction = 1 | -1;

const W = 1280;
const H = 760;
const G = 9.8;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const fmt = (value: number, digits = 2) => (Math.abs(value) < 0.0005 ? 0 : value).toFixed(digits);

const CentreOfMassTorqueLab: React.FC<CentreOfMassTorqueLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const lastFrameRef = useRef<number | null>(null);
    const phaseRef = useRef(0);
    const beamAngleRef = useRef(0);
    const angularVelocityRef = useRef(0);
    const elapsedTimeRef = useRef(0);

    const [mode, setMode] = useState<Mode>('centre-of-mass');
    const [paused, setPaused] = useState(false);
    const [animationSpeed, setAnimationSpeed] = useState(0.7);

    const [mass1, setMass1] = useState(2);
    const [mass2, setMass2] = useState(5);
    const [separation, setSeparation] = useState(6);

    const [force, setForce] = useState(24);
    const [radius, setRadius] = useState(2.2);
    const [forceAngle, setForceAngle] = useState(90);
    const [beamMass, setBeamMass] = useState(12);
    const [direction, setDirection] = useState<Direction>(1);

    const model = useMemo(() => {
        const totalMass = mass1 + mass2;
        const d1 = separation * mass2 / totalMass;
        const d2 = separation * mass1 / totalMass;
        const beamLength = 6;
        const momentOfInertia = beamMass * beamLength * beamLength / 12;
        const torqueMagnitude = radius * force * Math.sin(forceAngle * Math.PI / 180);
        const torque = direction * torqueMagnitude;
        const angularAcceleration = torque / momentOfInertia;
        return { totalMass, d1, d2, beamLength, momentOfInertia, torque, torqueMagnitude, angularAcceleration };
    }, [beamMass, direction, force, forceAngle, mass1, mass2, radius, separation]);

    const stateRef = useRef({ mode, paused, animationSpeed, mass1, mass2, force, radius, forceAngle, direction, model });
    useEffect(() => {
        stateRef.current = { mode, paused, animationSpeed, mass1, mass2, force, radius, forceAngle, direction, model };
    }, [animationSpeed, direction, force, forceAngle, mass1, mass2, mode, model, paused, radius]);

    const resetTorqueMotion = () => {
        beamAngleRef.current = 0;
        angularVelocityRef.current = 0;
        elapsedTimeRef.current = 0;
        lastFrameRef.current = null;
    };

    const reset = () => {
        setPaused(false);
        setAnimationSpeed(0.7);
        phaseRef.current = 0;
        resetTorqueMotion();
        if (mode === 'centre-of-mass') {
            setMass1(2); setMass2(5); setSeparation(6);
        } else {
            setForce(24); setRadius(2.2); setForceAngle(90); setBeamMass(12); setDirection(1);
        }
    };

    const changeMode = (next: Mode) => {
        setMode(next);
        setPaused(false);
        phaseRef.current = 0;
        resetTorqueMotion();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const render = (now: number) => {
            const state = stateRef.current;
            const previous = lastFrameRef.current ?? now;
            const dt = Math.min(0.05, (now - previous) / 1000);
            lastFrameRef.current = now;

            if (!state.paused) {
                if (state.mode === 'centre-of-mass') {
                    phaseRef.current += dt * state.animationSpeed;
                } else {
                    const simulationDt = dt * state.animationSpeed;
                    elapsedTimeRef.current += simulationDt;
                    angularVelocityRef.current = state.model.angularAcceleration * elapsedTimeRef.current;
                    beamAngleRef.current = (0.5 * state.model.angularAcceleration * elapsedTimeRef.current ** 2) % (Math.PI * 2);
                }
            }

            drawBackground(ctx);
            if (state.mode === 'centre-of-mass') drawCentreOfMass(ctx, state, phaseRef.current);
            else drawTorqueBench(ctx, state, beamAngleRef.current, angularVelocityRef.current, elapsedTimeRef.current);
            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, []);

    const leftAside = mode === 'centre-of-mass'
        ? <CentreOfMassAside mass1={mass1} mass2={mass2} d1={model.d1} d2={model.d2} />
        : <TorqueAside force={force} radius={radius} forceAngle={forceAngle} torque={model.torque} />;

    const rightAside = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                {mode === 'centre-of-mass' ? (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/95 p-4 shadow-xl backdrop-blur">
                        <div className="text-base font-extrabold text-cyan-950">Mass-weighted position</div>
                        <div className="text-xs font-semibold text-cyan-700">NCERT Ch 6, Section 6.2</div>
                        <div className="mt-3 space-y-2 text-sm leading-snug text-cyan-950">
                            <p className="font-mono font-bold">X = (m1 x1 + m2 x2) / (m1 + m2)</p>
                            <p>The centre of mass lies closer to the heavier particle.</p>
                            <p>Internal motion can continue while the system's centre of mass remains fixed.</p>
                            <p>For equal masses, the centre is exactly midway between them.</p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                        <div className="text-base font-extrabold text-amber-950">Moment of force</div>
                        <div className="text-xs font-semibold text-amber-700">NCERT Ch 6, Eqs. 6.23-6.24</div>
                        <div className="mt-3 space-y-2 text-sm leading-snug text-amber-950">
                            <p className="font-mono font-bold">tau = r x F</p>
                            <p className="font-mono font-bold">|tau| = r F sin(theta) = r_perp F</p>
                            <p>Torque is zero when the force's line of action passes through the pivot.</p>
                            <p>Clockwise and anticlockwise torques have opposite directions.</p>
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live</span>
                    </div>
                    {mode === 'centre-of-mass' ? (
                        <div className="grid gap-2">
                            <ValueCard label="Total mass" value={`${fmt(model.totalMass, 1)} kg`} tone="cyan" />
                            <ValueCard label="m1 distance from CM" value={`${fmt(model.d1)} m`} tone="blue" />
                            <ValueCard label="m2 distance from CM" value={`${fmt(model.d2)} m`} tone="violet" />
                            <ValueCard label="Moment check" value={`${fmt(mass1 * model.d1)} = ${fmt(mass2 * model.d2)} kg m`} tone="emerald" />
                            <ValueCard label="Centre of mass" value="X = 0.00 m" tone="cyan" />
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <ValueCard label="Perpendicular arm" value={`${fmt(radius * Math.sin(forceAngle * Math.PI / 180))} m`} tone="blue" />
                            <ValueCard label="Net torque" value={`${fmt(model.torque)} N m`} tone={model.torque >= 0 ? 'emerald' : 'rose'} />
                            <ValueCard label="Moment of inertia" value={`${fmt(model.momentOfInertia)} kg m2`} tone="violet" />
                            <ValueCard label="Angular acceleration" value={`${fmt(model.angularAcceleration)} rad/s2`} tone="amber" />
                            <ValueCard label="Rotation sense" value={Math.abs(model.torque) < 0.001 ? 'No turning effect' : direction === 1 ? 'Anticlockwise' : 'Clockwise'} tone="slate" />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button onClick={() => setPaused(value => !value)} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
                    <button onClick={reset} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50" title="Reset"><RotateCcw size={16} /></button>
                </div>
            </div>
            <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">{leftAside}</aside>
            {rightAside}
        </div>
    );

    const controlsCombo = (
        <div className="flex h-full w-full flex-col gap-2.5 text-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><Boxes size={18} className="text-cyan-700" /> Centre of Mass &amp; Torque Bench</div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
                        <ModeButton active={mode === 'centre-of-mass'} onClick={() => changeMode('centre-of-mass')} label="Centre of Mass" />
                        <ModeButton active={mode === 'torque'} onClick={() => changeMode('torque')} label="Torque" />
                    </div>
                    <button onClick={() => setPaused(value => !value)} className={`flex min-w-[92px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold text-white shadow transition ${paused ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                        {paused ? <><Play size={15} /> Play</> : <><Pause size={15} /> Pause</>}
                    </button>
                    <button onClick={reset} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"><RotateCcw size={15} /> Reset</button>
                </div>
            </div>

            {mode === 'centre-of-mass' ? (
                <>
                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-950 sm:grid-cols-2">
                        <span className="font-mono">R = (m₁r₁ + m₂r₂)/(m₁ + m₂)</span>
                        <span className="font-mono sm:text-right">m₁d₁ = m₂d₂ = {fmt(mass1 * model.d1, 2)} kg·m</span>
                    </div>
                    <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-4">
                        <Slider label="Particle mass m₁" value={mass1} min={1} max={10} step={0.5} unit="kg" accent="accent-blue-600" onChange={setMass1} />
                        <Slider label="Particle mass m₂" value={mass2} min={1} max={10} step={0.5} unit="kg" accent="accent-violet-600" onChange={setMass2} />
                        <Slider label="Separation" value={separation} min={2} max={9} step={0.5} unit="m" accent="accent-cyan-600" onChange={setSeparation} />
                        <Slider label="Orbit speed" value={animationSpeed} min={0.2} max={1.5} step={0.1} unit="×" accent="accent-emerald-600" onChange={setAnimationSpeed} />
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 sm:grid-cols-3">
                        <span className="font-mono">τ = rF sinθ = {fmt(model.torque)} N·m</span>
                        <span className="font-mono sm:text-center">I = ML²/12 = {fmt(model.momentOfInertia)} kg·m²</span>
                        <span className="font-mono sm:text-right">α = τ/I = {fmt(model.angularAcceleration)} rad/s²</span>
                    </div>
                    <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
                        <Slider label="Applied force F" value={force} min={0} max={40} step={1} unit="N" accent="accent-rose-600" onChange={value => { setForce(value); resetTorqueMotion(); }} />
                        <Slider label="Distance from pivot r" value={radius} min={0} max={3} step={0.1} unit="m" accent="accent-blue-600" onChange={value => { setRadius(value); resetTorqueMotion(); }} />
                        <Slider label="Angle between r and F" value={forceAngle} min={0} max={180} step={5} unit="°" accent="accent-amber-600" onChange={value => { setForceAngle(value); resetTorqueMotion(); }} />
                        <Slider label="Uniform beam mass M" value={beamMass} min={4} max={24} step={1} unit="kg" accent="accent-violet-600" onChange={value => { setBeamMass(value); resetTorqueMotion(); }} />
                        <Slider label="Time scale" value={animationSpeed} min={0.2} max={1.5} step={0.1} unit="×" accent="accent-emerald-600" onChange={setAnimationSpeed} />
                        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">Torque direction</div>
                            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                                <button onClick={() => { setDirection(1); resetTorqueMotion(); }} className={`rounded-md px-2 py-2 text-xs font-bold ${direction === 1 ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>↺ Anticlockwise</button>
                                <button onClick={() => { setDirection(-1); resetTorqueMotion(); }} className={`rounded-md px-2 py-2 text-xs font-bold ${direction === -1 ? 'bg-rose-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>↻ Clockwise</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
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
            controlsWrapperClassName="w-full h-full max-w-[min(100%,980px)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:rounded-3xl md:p-4"
        />
    );
};

const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(15,23,42,0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
};

const drawCentreOfMass = (ctx: CanvasRenderingContext2D, state: typeof initialStateShape, phase: number) => {
    const cx = 640;
    const cy = 385;
    const scale = 58;
    const angle = phase;
    const x1 = cx - state.model.d1 * scale * Math.cos(angle);
    const y1 = cy - state.model.d1 * scale * Math.sin(angle) * 0.55;
    const x2 = cx + state.model.d2 * scale * Math.cos(angle);
    const y2 = cy + state.model.d2 * scale * Math.sin(angle) * 0.55;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a'; ctx.font = '800 28px Inter, sans-serif';
    ctx.fillText('Two-particle system rotating about its centre of mass', 640, 66);
    ctx.fillStyle = '#64748b'; ctx.font = '600 15px Inter, sans-serif';
    ctx.fillText('Internal motion changes both particle positions, but the weighted centre remains fixed', 640, 94);

    ctx.save();
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.setLineDash([8, 7]);
    ctx.beginPath(); ctx.ellipse(cx, cy, state.model.d1 * scale, state.model.d1 * scale * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, state.model.d2 * scale, state.model.d2 * scale * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    drawMass(ctx, x1, y1, state.mass1, '#2563eb', 'm1');
    drawMass(ctx, x2, y2, state.mass2, '#7c3aed', 'm2');
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(8,145,178,0.45)'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#0891b2'; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#0e7490'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 23, cy); ctx.lineTo(cx + 23, cy); ctx.moveTo(cx, cy - 23); ctx.lineTo(cx, cy + 23); ctx.stroke();
    ctx.fillStyle = '#0e7490'; ctx.font = '800 16px Inter, sans-serif'; ctx.fillText('CM', cx, cy - 34);

    const rulerY = 665;
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(160, rulerY); ctx.lineTo(1120, rulerY); ctx.stroke();
    for (let i = -8; i <= 8; i++) {
        const x = cx + i * 58;
        ctx.strokeStyle = i === 0 ? '#0891b2' : '#94a3b8'; ctx.lineWidth = i === 0 ? 3 : 1.5;
        ctx.beginPath(); ctx.moveTo(x, rulerY - (i === 0 ? 15 : 8)); ctx.lineTo(x, rulerY + 10); ctx.stroke();
        ctx.fillStyle = '#475569'; ctx.font = '600 12px Inter, sans-serif'; ctx.fillText(String(i), x, rulerY + 29);
    }
    ctx.fillStyle = '#64748b'; ctx.font = '600 13px Inter, sans-serif'; ctx.fillText('position along reference axis (m)', 640, 724);
};

const drawTorqueBench = (ctx: CanvasRenderingContext2D, state: typeof initialStateShape, beamAngle: number, angularVelocity: number, elapsedTime: number) => {
    const cx = 640;
    const cy = 390;
    const halfLengthPx = 330;
    const pxPerMetre = halfLengthPx / 3;
    // Canvas y points down, so negate physical angles to preserve the usual
    // convention: positive torque is anticlockwise.
    const displayAngle = -beamAngle;
    const ux = Math.cos(displayAngle), uy = Math.sin(displayAngle);
    const pointX = cx + ux * state.radius * pxPerMetre;
    const pointY = cy + uy * state.radius * pxPerMetre;
    const signedTheta = -state.direction * state.forceAngle * Math.PI / 180;
    const forceDirection = displayAngle + signedTheta;
    const arrowLength = state.force > 0 ? 55 + state.force * 3.3 : 0;
    const forceEndX = pointX + Math.cos(forceDirection) * arrowLength;
    const forceEndY = pointY + Math.sin(forceDirection) * arrowLength;
    const forceUx = Math.cos(forceDirection), forceUy = Math.sin(forceDirection);
    const projection = (cx - pointX) * forceUx + (cy - pointY) * forceUy;
    const footX = pointX + projection * forceUx;
    const footY = pointY + projection * forceUy;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a'; ctx.font = '800 28px Inter, sans-serif';
    ctx.fillText('Turning effect of a force about a fixed pivot', 640, 66);
    ctx.fillStyle = '#64748b'; ctx.font = '600 15px Inter, sans-serif';
    ctx.fillText('The force remains at the selected angle to the position vector as the beam turns', 640, 94);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(displayAngle);
    ctx.shadowColor = 'rgba(37,99,235,0.20)'; ctx.shadowBlur = 18;
    roundRect(ctx, -halfLengthPx, -22, halfLengthPx * 2, 44, 20);
    const gradient = ctx.createLinearGradient(-halfLengthPx, 0, halfLengthPx, 0);
    gradient.addColorStop(0, '#dbeafe'); gradient.addColorStop(0.5, '#ffffff'); gradient.addColorStop(1, '#bfdbfe');
    ctx.fillStyle = gradient; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3; ctx.stroke();
    for (let i = -3; i <= 3; i++) {
        const x = i * pxPerMetre;
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, -13); ctx.lineTo(x, 13); ctx.stroke();
        if (i !== 0) { ctx.fillStyle = '#334155'; ctx.font = '700 12px Inter, sans-serif'; ctx.fillText(`${Math.abs(i)}m`, x, i % 2 === 0 ? -31 : 43); }
    }
    ctx.restore();

    ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(cx - 58, cy + 112); ctx.lineTo(cx + 58, cy + 112); ctx.lineTo(cx, cy + 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.shadowColor = 'rgba(15,23,42,0.25)'; ctx.shadowBlur = 10; ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.font = '800 11px Inter, sans-serif'; ctx.fillText('O', cx, cy + 4);

    if (state.force > 0) {
        ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        drawArrow(ctx, pointX, pointY, forceEndX, forceEndY, '#dc2626');
        ctx.fillStyle = '#b91c1c'; ctx.font = '800 15px Inter, sans-serif'; ctx.fillText('F', forceEndX + 16, forceEndY - 10);
    }
    ctx.fillStyle = '#1d4ed8'; ctx.beginPath(); ctx.arc(pointX, pointY, 8, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 6]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pointX, pointY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#0e7490'; ctx.font = '800 14px Inter, sans-serif';
    const beamNormalX = -uy, beamNormalY = ux;
    ctx.fillText(`r = ${fmt(state.radius, 1)} m`, (cx + pointX) / 2 + beamNormalX * 68, (cy + pointY) / 2 + beamNormalY * 68);

    if (state.force > 0 && Math.abs(state.model.torqueMagnitude) > 0.001) {
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(footX, footY); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#6d28d9'; ctx.font = '800 13px Inter, sans-serif';
        const armDx = footX - cx, armDy = footY - cy;
        const armLength = Math.max(1, Math.hypot(armDx, armDy));
        const armNormalX = -armDy / armLength, armNormalY = armDx / armLength;
        const sameSide = armNormalX * beamNormalX + armNormalY * beamNormalY >= 0 ? -1 : 1;
        ctx.fillText(`r⊥ = ${fmt(state.radius * Math.sin(state.forceAngle * Math.PI / 180), 2)} m`, (cx + footX) / 2 + armNormalX * 82 * sameSide, (cy + footY) / 2 + armNormalY * 82 * sameSide);
    }

    const arcRadius = 72;
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(pointX, pointY, arcRadius, displayAngle, forceDirection, state.direction === 1);
    ctx.stroke();
    ctx.fillStyle = '#b45309'; ctx.font = '800 14px Inter, sans-serif';
    const angleLabelX = clamp(pointX + Math.cos(displayAngle + signedTheta / 2) * 95, 100, W - 100);
    const angleLabelY = clamp(pointY + Math.sin(displayAngle + signedTheta / 2) * 95, 135, H - 90);
    ctx.fillText(`${state.forceAngle}°`, angleLabelX, angleLabelY);

    if (Math.abs(state.model.torque) > 0.001) {
        ctx.strokeStyle = state.direction === 1 ? '#16a34a' : '#e11d48'; ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, 78, -0.2, state.direction === 1 ? -2.0 : 1.6, state.direction === 1);
        ctx.stroke();
        const end = state.direction === 1 ? -2.0 : 1.6;
        const ex = cx + Math.cos(end) * 78, ey = cy + Math.sin(end) * 78;
        ctx.fillStyle = state.direction === 1 ? '#16a34a' : '#e11d48';
        ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2); ctx.fill();
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a'; ctx.font = '800 15px Inter, sans-serif';
    ctx.fillText(`t = ${fmt(elapsedTime, 2)} s`, 70, 150);
    ctx.fillText(`ω = ${fmt(angularVelocity, 2)} rad/s`, 70, 178);
    ctx.fillStyle = state.direction === 1 ? '#15803d' : '#be123c';
    ctx.fillText(state.direction === 1 ? 'τ: ⊙ +z (anticlockwise)' : 'τ: ⊗ −z (clockwise)', 70, 206);
    ctx.textAlign = 'center';

    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b'; ctx.font = '600 13px Inter, sans-serif';
    ctx.fillText('uniform beam: L = 6 m • central frictionless pivot', 1180, 150);
    ctx.textAlign = 'center';
};

const initialStateShape = {
    mode: 'centre-of-mass' as Mode,
    paused: false,
    animationSpeed: 0.7,
    mass1: 2,
    mass2: 5,
    force: 24,
    radius: 2.2,
    forceAngle: 90,
    direction: 1 as Direction,
    model: { totalMass: 7, d1: 4.28, d2: 1.72, beamLength: 6, momentOfInertia: 36, torque: 52.8, torqueMagnitude: 52.8, angularAcceleration: 1.47 },
};

const drawMass = (ctx: CanvasRenderingContext2D, x: number, y: number, mass: number, color: string, label: string) => {
    const radius = 27 + mass * 2.4;
    ctx.save(); ctx.shadowColor = `${color}66`; ctx.shadowBlur = 20;
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.35, 4, x, y, radius);
    gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(0.22, color); gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.font = '800 15px Inter, sans-serif'; ctx.fillText(label, x, y - 3);
    ctx.font = '700 12px Inter, sans-serif'; ctx.fillText(`${fmt(mass, 1)} kg`, x, y + 15);
};

const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 18 * Math.cos(angle - Math.PI / 6), y2 - 18 * Math.sin(angle - Math.PI / 6)); ctx.lineTo(x2 - 18 * Math.cos(angle + Math.PI / 6), y2 - 18 * Math.sin(angle + Math.PI / 6)); ctx.closePath(); ctx.fill();
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
};

const CentreOfMassAside: React.FC<{ mass1: number; mass2: number; d1: number; d2: number }> = ({ mass1, mass2, d1, d2 }) => (
    <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Mass-weighted number line</div>
            <div className="text-xs font-semibold text-slate-500">Heavier mass sits closer to CM</div>
            <svg viewBox="0 0 310 172" className="mt-2 w-full">
                <line x1="28" y1="90" x2="282" y2="90" stroke="#64748b" strokeWidth="2" />
                <line x1="155" y1="55" x2="155" y2="126" stroke="#0891b2" strokeWidth="3" />
                <circle cx={155 - d1 / (d1 + d2) * 112} cy="90" r={14 + mass1} fill="#2563eb" />
                <circle cx={155 + d2 / (d1 + d2) * 112} cy="90" r={14 + mass2} fill="#7c3aed" />
                <text x="155" y="44" textAnchor="middle" fill="#0e7490" fontSize="13" fontWeight="800">CM</text>
                <text x="155" y="148" textAnchor="middle" fill="#475569" fontSize="12">m1 d1 = m2 d2</text>
            </svg>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Weighted moments</div>
            <div className="text-xs font-semibold text-slate-500">Both sides balance about CM</div>
            <div className="mt-3 space-y-2 text-sm">
                <Bar label="m1 x d1" value={mass1 * d1} max={50} color="#2563eb" />
                <Bar label="m2 x d2" value={mass2 * d2} max={50} color="#7c3aed" />
            </div>
        </div>
    </div>
);

const TorqueAside: React.FC<{ force: number; radius: number; forceAngle: number; torque: number }> = ({ force, radius, forceAngle, torque }) => {
    const maxTorque = Math.max(1, radius * force);
    const points = Array.from({ length: 37 }, (_, i) => {
        const theta = i * 5;
        return { theta, tau: radius * force * Math.sin(theta * Math.PI / 180) };
    });
    const path = points.map((point, i) => `${i ? 'L' : 'M'}${34 + point.theta / 180 * 242},${132 - point.tau / maxTorque * 92}`).join(' ');
    return (
        <div className="flex flex-col gap-2.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                <div className="text-base font-extrabold text-slate-900">Torque magnitude vs angle</div>
                <div className="text-xs font-semibold text-slate-500">r and F held at current values</div>
                <svg viewBox="0 0 310 180" className="mt-2 w-full">
                    <line x1="34" y1="132" x2="285" y2="132" stroke="#475569" strokeWidth="1.5" />
                    <line x1="34" y1="28" x2="34" y2="132" stroke="#475569" strokeWidth="1.5" />
                    <path d={path} fill="none" stroke="#d97706" strokeWidth="4" />
                    <circle cx={34 + forceAngle / 180 * 242} cy={132 - Math.abs(torque) / maxTorque * 92} r="6" fill="#dc2626" />
                    {[0, 90, 180].map(tick => <text key={tick} x={34 + tick / 180 * 242} y="151" textAnchor="middle" fill="#64748b" fontSize="11">{tick} deg</text>)}
                    <text x="16" y="32" textAnchor="middle" fill="#64748b" fontSize="11">tau</text>
                    <text x="281" y="170" textAnchor="end" fill="#64748b" fontSize="11">theta</text>
                </svg>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                <div className="text-base font-extrabold text-slate-900">What changes torque?</div>
                <div className="mt-3 space-y-2 text-sm"><Bar label="Force F" value={force} max={40} color="#dc2626" /><Bar label="Lever arm r" value={radius} max={3} color="#2563eb" /><Bar label="sin(theta)" value={Math.sin(forceAngle * Math.PI / 180)} max={1} color="#d97706" /></div>
            </div>
        </div>
    );
};

const Bar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
    <div><div className="mb-1 flex justify-between text-xs font-bold text-slate-600"><span>{label}</span><span className="font-mono text-slate-900">{fmt(value)}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all" style={{ width: `${clamp(value / max * 100, 0, 100)}%`, backgroundColor: color }} /></div></div>
);

const ValueCard: React.FC<{ label: string; value: string; tone: 'cyan' | 'blue' | 'violet' | 'emerald' | 'rose' | 'amber' | 'slate' }> = ({ label, value, tone }) => {
    const styles = { cyan: 'bg-cyan-50 text-cyan-800', blue: 'bg-blue-50 text-blue-800', violet: 'bg-violet-50 text-violet-800', emerald: 'bg-emerald-50 text-emerald-800', rose: 'bg-rose-50 text-rose-800', amber: 'bg-amber-50 text-amber-800', slate: 'bg-slate-50 text-slate-800' };
    return <div className={`rounded-lg border border-slate-100 px-3 py-2.5 ${styles[tone]}`}><div className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</div><div className="mt-1 font-mono text-base font-extrabold">{value}</div></div>;
};

const ModeButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => <button onClick={onClick} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${active ? 'bg-cyan-700 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>{label}</button>;

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit: string; accent: string; onChange: (value: number) => void }> = ({ label, value, min, max, step, unit, accent, onChange }) => (
    <label className="rounded-xl border border-slate-200 bg-white p-3"><span className="mb-2 flex justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600"><span>{label}</span><span className="font-mono text-sm text-slate-900">{fmt(value, step < 1 ? 1 : 0)} {unit}</span></span><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className={`h-2 w-full cursor-pointer ${accent}`} /></label>
);

export default CentreOfMassTorqueLab;
