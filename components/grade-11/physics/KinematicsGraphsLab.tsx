import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Gauge, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface KinematicsGraphsLabProps {
    topic: any;
    onExit: () => void;
}

type MotionPreset = 'uniform' | 'speed-up' | 'brake' | 'custom';

const W = 1280;
const H = 760;
const TICK_COUNT = 5;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const positionAt = (x0: number, v0: number, a: number, t: number) => x0 + v0 * t + 0.5 * a * t * t;
const velocityAt = (v0: number, a: number, t: number) => v0 + a * t;

const niceBounds = (values: number[]) => {
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const span = Math.max(2, max - min);
    const padding = span * 0.16;
    return { min: min - padding, max: max + padding };
};

const fmt = (value: number, digits = 1) => `${Math.abs(value) < 0.0001 ? 0 : value.toFixed(digits)}`;

const PRESET_LABEL: Record<MotionPreset, string> = {
    uniform: 'Uniform motion · a = 0',
    'speed-up': 'Speeding up · v and a same sign',
    brake: 'Braking · v and a opposite signs',
    custom: 'Custom motion',
};

const KinematicsGraphsLab: React.FC<KinematicsGraphsLabProps> = ({ topic, onExit }) => {
    const [x0, setX0] = useState(0);
    const [v0, setV0] = useState(4);
    const [acceleration, setAcceleration] = useState(1);
    const [duration, setDuration] = useState(10);
    const [time, setTime] = useState(0);
    const [running, setRunning] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [preset, setPreset] = useState<MotionPreset>('speed-up');
    const lastFrame = useRef<number | null>(null);

    useEffect(() => {
        if (!running) {
            lastFrame.current = null;
            return;
        }
        let frame = 0;
        const animate = (now: number) => {
            const previous = lastFrame.current ?? now;
            const dt = Math.min(0.1, (now - previous) / 1000) * speed;
            lastFrame.current = now;
            setTime(current => {
                const next = current + dt;
                // loop for continuous, lively motion
                return next >= duration ? 0 : next;
            });
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [duration, running, speed]);

    const data = useMemo(() => Array.from({ length: 121 }, (_, index) => {
        const t = duration * index / 120;
        return { t, x: positionAt(x0, v0, acceleration, t), v: velocityAt(v0, acceleration, t) };
    }), [acceleration, duration, v0, x0]);

    const currentX = positionAt(x0, v0, acceleration, time);
    const currentV = velocityAt(v0, acceleration, time);
    const displacement = currentX - x0;
    const xBounds = niceBounds(data.map(point => point.x));
    const vBounds = niceBounds(data.map(point => point.v));
    const aSpan = Math.max(2, Math.abs(acceleration) * 1.5);

    const speedingUp = currentV * acceleration > 0.0001;
    const slowingDown = currentV * acceleration < -0.0001;
    const phaseTag = acceleration === 0 ? 'CONSTANT VELOCITY' : speedingUp ? 'SPEEDING UP' : slowingDown ? 'SLOWING DOWN' : 'TURNING POINT';
    const phaseColor = acceleration === 0 ? '#1d4ed8' : speedingUp ? '#16a34a' : slowingDown ? '#dc2626' : '#d97706';

    const setMotion = (next: MotionPreset) => {
        setPreset(next);
        setRunning(false);
        setTime(0);
        if (next === 'uniform') { setX0(-10); setV0(6); setAcceleration(0); }
        if (next === 'speed-up') { setX0(0); setV0(4); setAcceleration(1); }
        if (next === 'brake') { setX0(0); setV0(10); setAcceleration(-1.5); }
    };

    const change = (setter: React.Dispatch<React.SetStateAction<number>>) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setter(Number(event.target.value));
        setPreset('custom');
        setRunning(false);
    };

    const reset = () => {
        setX0(0); setV0(4); setAcceleration(1); setDuration(10); setTime(0);
        setPreset('speed-up'); setRunning(true); setSpeed(1);
    };

    const togglePlay = () => {
        if (time >= duration) setTime(0);
        setRunning(value => !value);
    };

    // ---- Canvas apparatus (white theme, motion scene only) ----------------
    const trackLeft = 150;
    const trackRight = 1130;
    const roadY = 430;
    const mapPos = (value: number) => trackLeft + (value - xBounds.min) / (xBounds.max - xBounds.min) * (trackRight - trackLeft);
    const carX = mapPos(currentX);
    const x0X = mapPos(x0);

    // strobe / motion-diagram dots at equal time steps up to the cursor
    const strobeStep = duration / 12;
    const strobeDots = Array.from({ length: 13 }, (_, i) => i * strobeStep).filter(t => t <= time + 1e-6);

    const vLen = clamp(currentV * 14, -150, 150);
    const aLen = clamp(acceleration * 42, -120, 120);
    const timeFrac = duration > 0 ? time / duration : 0;
    const scrubX = trackLeft + timeFrac * (trackRight - trackLeft);

    // ---- Left aside: three white graph cards ------------------------------
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+16px)] top-0 bottom-0 z-20 hidden w-[400px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <GraphCard
                    title="Position – Time" subtitle="slope of tangent = velocity v" symbol="x (m)" color="#1d4ed8"
                    data={data.map(p => ({ t: p.t, y: p.x }))} bounds={xBounds} duration={duration} time={time}
                    currentValue={currentX} tangentSlope={currentV}
                />
                <GraphCard
                    title="Velocity – Time" subtitle="slope = acceleration · signed area = displacement" symbol="v (m/s)" color="#16a34a"
                    data={data.map(p => ({ t: p.t, y: p.v }))} bounds={vBounds} duration={duration} time={time}
                    currentValue={currentV} areaUntil={time}
                />
                <GraphCard
                    title="Acceleration – Time" subtitle="constant a → horizontal line" symbol="a (m/s²)" color="#d97706"
                    data={[{ t: 0, y: acceleration }, { t: duration, y: acceleration }]} bounds={{ min: -aSpan, max: aSpan }} duration={duration} time={time}
                    currentValue={acceleration}
                />
            </div>
        </aside>
    );

    // ---- Right aside: theory + live values --------------------------------
    const values: { label: string; value: string; tone: string }[] = [
        { label: 'Position x', value: `${fmt(currentX)} m`, tone: 'text-blue-700' },
        { label: 'Velocity v', value: `${fmt(currentV)} m/s`, tone: 'text-emerald-700' },
        { label: 'Acceleration a', value: `${fmt(acceleration)} m/s²`, tone: 'text-amber-700' },
        { label: 'Displacement Δx', value: `${fmt(displacement)} m`, tone: 'text-violet-700' },
        { label: 'Time t', value: `${fmt(time)} s`, tone: 'text-slate-700' },
    ];

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-sky-200 bg-sky-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-sky-900">Reading motion graphs</div>
                    <div className="text-xs font-semibold text-sky-700">NCERT Ch 2 · Motion in a Straight Line</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-sky-950">
                        <p>• <b>v = dx/dt</b> — velocity is the slope of the x–t graph.</p>
                        <p>• <b>a = dv/dt</b> — acceleration is the slope of the v–t graph.</p>
                        <p>• <b>Signed area</b> under the v–t graph = displacement Δx.</p>
                        <p>• Same sign of v and a → speeding up; opposite signs → slowing down.</p>
                        <p>• Right is positive, left is negative.</p>
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

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Moving object on a position axis with velocity and acceleration vectors">
                    <defs>
                        <pattern id="kgGrid" width="48" height="48" patternUnits="userSpaceOnUse">
                            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0f172a" strokeOpacity="0.05" />
                        </pattern>
                        <linearGradient id="kgRoad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#f1f5f9" /><stop offset="1" stopColor="#e2e8f0" />
                        </linearGradient>
                        <linearGradient id="kgCar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#0ea5e9" />
                        </linearGradient>
                        <filter id="kgGlow" x="-60%" y="-60%" width="220%" height="220%">
                            <feGaussianBlur stdDeviation="9" />
                        </filter>
                    </defs>

                    <rect width={W} height={H} fill="#ffffff" />
                    <rect width={W} height={H} fill="url(#kgGrid)" />

                    {/* phase label (brief) */}
                    <g transform="translate(640 90)">
                        <text x="0" y="0" textAnchor="middle" fill="#64748b" fontSize="15" fontWeight="700">Motion along a straight line</text>
                        <text x="0" y="34" textAnchor="middle" fill={phaseColor} fontSize="26" fontWeight="800">{phaseTag}</text>
                    </g>

                    {/* road / position axis */}
                    <rect x={trackLeft - 20} y={roadY - 46} width={trackRight - trackLeft + 40} height={92} rx="20" fill="url(#kgRoad)" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1={trackLeft - 10} y1={roadY} x2={trackRight + 10} y2={roadY} stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="16 14" strokeDashoffset={-time * 70 * (currentV >= 0 ? 1 : -1)} />

                    {/* distance ticks */}
                    {Array.from({ length: 9 }, (_, i) => {
                        const value = xBounds.min + (xBounds.max - xBounds.min) * i / 8;
                        const px = mapPos(value);
                        return (
                            <g key={i}>
                                <line x1={px} y1={roadY + 40} x2={px} y2={roadY + 54} stroke="#94a3b8" strokeWidth="1.5" />
                                <text x={px} y={roadY + 74} textAnchor="middle" fill="#64748b" fontSize="14">{fmt(value, 0)}</text>
                            </g>
                        );
                    })}
                    <text x={trackRight + 8} y={roadY + 74} textAnchor="end" fill="#475569" fontSize="14" fontWeight="700">position x (m)</text>

                    {/* x0 marker */}
                    <line x1={x0X} y1={roadY - 70} x2={x0X} y2={roadY + 40} stroke="#1d4ed8" strokeWidth="2" strokeDasharray="6 6" />
                    <text x={x0X} y={roadY - 78} textAnchor="middle" fill="#1d4ed8" fontSize="15" fontWeight="700">x₀</text>

                    {/* strobe motion diagram */}
                    {strobeDots.map((t, i) => {
                        const px = mapPos(positionAt(x0, v0, acceleration, t));
                        const op = 0.18 + 0.55 * (i / Math.max(1, strobeDots.length - 1));
                        return <circle key={i} cx={px} cy={roadY} r="6" fill="#0ea5e9" opacity={op} />;
                    })}

                    {/* acceleration vector (amber, below car) */}
                    {Math.abs(acceleration) > 0.01 && (
                        <g>
                            <line x1={carX} y1={roadY + 96} x2={carX + aLen} y2={roadY + 96} stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
                            <path d={aLen >= 0 ? `M${carX + aLen} ${roadY + 96} l-13 -8 v16 z` : `M${carX + aLen} ${roadY + 96} l13 -8 v16 z`} fill="#d97706" />
                            <text x={carX + aLen / 2} y={roadY + 124} textAnchor="middle" fill="#b45309" fontSize="14" fontWeight="700">a</text>
                        </g>
                    )}

                    {/* velocity vector (green, above car) */}
                    {Math.abs(currentV) > 0.03 && (
                        <g>
                            <line x1={carX} y1={roadY - 96} x2={carX + vLen} y2={roadY - 96} stroke="#16a34a" strokeWidth="6" strokeLinecap="round" />
                            <path d={vLen >= 0 ? `M${carX + vLen} ${roadY - 96} l-13 -8 v16 z` : `M${carX + vLen} ${roadY - 96} l13 -8 v16 z`} fill="#16a34a" />
                            <text x={carX + vLen / 2} y={roadY - 106} textAnchor="middle" fill="#15803d" fontSize="14" fontWeight="700">v</text>
                        </g>
                    )}

                    {/* speed lines behind the moving object */}
                    {running && Math.abs(currentV) > 0.8 && [0, 1, 2].map(i => {
                        const dir = currentV >= 0 ? -1 : 1;
                        const len = clamp(Math.abs(currentV) * 7, 16, 84);
                        const yy = roadY - 12 + i * 12;
                        const sx = carX + dir * 50;
                        return <line key={i} x1={sx} y1={yy} x2={sx + dir * len} y2={yy} stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" opacity={0.6 - i * 0.16} />;
                    })}

                    {/* the moving object — speed glow + pulse + body */}
                    <ellipse cx={carX} cy={roadY} rx={64} ry={26} fill="#38bdf8" opacity={clamp(Math.abs(currentV) / 16, 0, 0.3)} filter="url(#kgGlow)" />
                    <circle cx={carX} cy={roadY} r={46 + 4 * Math.sin(time * 6)} fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.32" />
                    <g transform={`translate(${carX} ${roadY})`}>
                        <ellipse cx="0" cy="34" rx="44" ry="9" fill="#0f172a" opacity="0.12" />
                        <rect x="-42" y="-22" width="84" height="34" rx="11" fill="url(#kgCar)" stroke="#0284c7" strokeWidth="2" />
                        <path d="M-26 -22 L-14 -38 H16 L30 -22 Z" fill="#7dd3fc" stroke="#0284c7" strokeWidth="2" />
                        <circle cx="-22" cy="14" r="11" fill="#0f172a" /><circle cx="-22" cy="14" r="4.5" fill="#cbd5e1" />
                        <circle cx="22" cy="14" r="11" fill="#0f172a" /><circle cx="22" cy="14" r="4.5" fill="#cbd5e1" />
                    </g>

                    {/* time scrubber (apparatus state, no numeric readout) */}
                    <g>
                        <text x={trackLeft} y={665} fill="#64748b" fontSize="13">0 s</text>
                        <text x={trackRight} y={665} textAnchor="end" fill="#64748b" fontSize="13">{fmt(duration, 0)} s</text>
                        <line x1={trackLeft} y1={685} x2={trackRight} y2={685} stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                        <line x1={trackLeft} y1={685} x2={scrubX} y2={685} stroke="#0ea5e9" strokeWidth="8" strokeLinecap="round" />
                        <circle cx={scrubX} cy={685} r="11" fill="#ffffff" stroke="#0ea5e9" strokeWidth="4" />
                        <text x={640} y={715} textAnchor="middle" fill="#475569" fontSize="14" fontWeight="700">time cursor</text>
                    </g>
                </svg>
            </div>

            {/* Pause / Play / Reset — canvas top-right only */}
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

    // ---- Bottom controls: transport + presets + sliders -------------------
    const controlsCombo = (
        <div className="flex h-full w-full flex-col gap-3 text-slate-900">
            {/* transport row */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                    <Gauge size={18} className="text-sky-600" /> Motion Graphs Bench
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={togglePlay}
                        className={`flex min-w-[112px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold text-white shadow-lg transition ${running ? 'bg-rose-500 shadow-rose-500/30 hover:bg-rose-600' : 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600'}`}
                    >
                        {running ? <><Pause size={17} /> Pause</> : <><Play size={17} /> Play</>}
                    </button>
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <RotateCcw size={16} /> Reset
                    </button>
                </div>
            </div>

            {/* presets */}
            <div className="flex flex-wrap items-stretch gap-2">
                <span className="self-center text-[11px] font-bold uppercase tracking-wide text-slate-400">Preset</span>
                {([['uniform', 'Uniform', 'a = 0'], ['speed-up', 'Speeding up', 'v, a same sign'], ['brake', 'Braking', 'v, a opposite']] as const).map(([id, label, desc]) => (
                    <button
                        key={id}
                        onClick={() => setMotion(id)}
                        className={`flex-1 rounded-xl border px-3 py-1.5 text-left transition ${preset === id ? 'border-sky-400 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                        <div className={`text-xs font-bold ${preset === id ? 'text-sky-800' : 'text-slate-700'}`}>{label}</div>
                        <div className="text-[10px] text-slate-400">{desc}</div>
                    </button>
                ))}
            </div>

            {/* sliders */}
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                <Slider label="Initial position x₀" value={x0} min={-20} max={20} step={1} unit="m" onChange={change(setX0)} accent="accent-blue-500" chip="bg-blue-50 text-blue-700" />
                <Slider label="Initial velocity v₀" value={v0} min={-12} max={12} step={0.5} unit="m/s" onChange={change(setV0)} accent="accent-emerald-500" chip="bg-emerald-50 text-emerald-700" />
                <Slider label="Acceleration a" value={acceleration} min={-4} max={4} step={0.25} unit="m/s²" onChange={change(setAcceleration)} accent="accent-amber-500" chip="bg-amber-50 text-amber-700" />
                <Slider label="Graph duration" value={duration} min={4} max={12} step={1} unit="s" onChange={event => { const next = Number(event.target.value); setDuration(next); setTime(t => Math.min(t, next)); }} accent="accent-violet-500" chip="bg-violet-50 text-violet-700" />
                <Slider label="Time cursor" value={time} min={0} max={duration} step={0.1} unit="s" onChange={event => { setTime(Number(event.target.value)); setRunning(false); }} accent="accent-sky-500" chip="bg-sky-50 text-sky-700" />
                <Slider label="Playback speed" value={speed} min={0.3} max={2} step={0.1} unit="×" onChange={event => setSpeed(Number(event.target.value))} accent="accent-slate-500" chip="bg-slate-100 text-slate-700" />
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

interface GraphCardProps {
    title: string; subtitle: string; symbol: string; color: string;
    data: { t: number; y: number }[]; bounds: { min: number; max: number }; duration: number; time: number;
    currentValue: number; tangentSlope?: number; areaUntil?: number;
}

const GraphCard: React.FC<GraphCardProps> = ({ title, subtitle, symbol, color, data, bounds, duration, time, currentValue, tangentSlope, areaUntil }) => {
    const vw = 372, vh = 212;
    const left = 46, top = 16, plotW = vw - left - 14, plotH = vh - top - 42;
    const mx = (t: number) => left + (duration > 0 ? t / duration : 0) * plotW;
    const my = (value: number) => top + (bounds.max - value) / (bounds.max - bounds.min) * plotH;
    const path = data.map((p, i) => `${i ? 'L' : 'M'}${mx(p.t).toFixed(1)},${my(p.y).toFixed(1)}`).join(' ');
    const zeroY = my(clamp(0, bounds.min, bounds.max));
    const visibleArea = areaUntil === undefined ? [] : data.filter(p => p.t <= areaUntil + duration / 120);
    const areaPath = visibleArea.length
        ? `M${mx(0)},${zeroY} ${visibleArea.map(p => `L${mx(p.t)},${my(p.y)}`).join(' ')} L${mx(visibleArea[visibleArea.length - 1].t)},${zeroY} Z`
        : '';
    const tangentDt = duration * 0.13;
    const ptX = mx(time), ptY = my(currentValue);
    const gid = `grad-${title.replace(/[^a-z]/gi, '')}`;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-900 shadow-xl">
            <div className="flex items-baseline justify-between">
                <div className="text-lg font-extrabold text-slate-900">{title}</div>
                <div className="rounded-md px-2 py-0.5 font-mono text-xs font-bold" style={{ color, backgroundColor: `${color}14` }}>{symbol}</div>
            </div>
            <div className="text-xs font-semibold text-slate-500">{subtitle}</div>
            <svg viewBox={`0 0 ${vw} ${vh}`} className="mt-1.5 h-[208px] w-full">
                <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={color} stopOpacity="0.30" /><stop offset="1" stopColor={color} stopOpacity="0.03" />
                    </linearGradient>
                </defs>
                {Array.from({ length: TICK_COUNT }, (_, i) => {
                    const gy = top + plotH * i / (TICK_COUNT - 1);
                    const value = bounds.max - (bounds.max - bounds.min) * i / (TICK_COUNT - 1);
                    return (
                        <g key={`y${i}`}>
                            <line x1={left} y1={gy} x2={left + plotW} y2={gy} stroke="#eef2f6" strokeWidth="1" />
                            <text x={left - 8} y={gy + 4} textAnchor="end" fill="#64748b" fontSize="12">{fmt(value, 0)}</text>
                        </g>
                    );
                })}
                {Array.from({ length: TICK_COUNT }, (_, i) => {
                    const gx = left + plotW * i / (TICK_COUNT - 1);
                    return <text key={`x${i}`} x={gx} y={top + plotH + 20} textAnchor="middle" fill="#64748b" fontSize="12">{fmt(duration * i / (TICK_COUNT - 1), 0)}</text>;
                })}
                <text x={left + plotW} y={top + plotH + 37} textAnchor="end" fill="#475569" fontSize="13" fontWeight="700">t (s)</text>

                {/* axes */}
                <line x1={left} y1={top} x2={left} y2={top + plotH} stroke="#475569" strokeWidth="1.6" />
                <line x1={left} y1={zeroY} x2={left + plotW} y2={zeroY} stroke="#475569" strokeWidth="1.6" />

                {areaPath && <path d={areaPath} fill={`url(#${gid})`} />}
                <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                {/* tangent line for x-t */}
                {tangentSlope !== undefined && (
                    <line
                        x1={mx(clamp(time - tangentDt, 0, duration))}
                        y1={my(currentValue + tangentSlope * (clamp(time - tangentDt, 0, duration) - time))}
                        x2={mx(clamp(time + tangentDt, 0, duration))}
                        y2={my(currentValue + tangentSlope * (clamp(time + tangentDt, 0, duration) - time))}
                        stroke="#0f172a" strokeWidth="2" strokeDasharray="6 4"
                    />
                )}

                {/* time cursor + animated current point */}
                <line x1={ptX} y1={top} x2={ptX} y2={top + plotH} stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="5 5" />
                <circle cx={ptX} cy={ptY} r="10" fill={color} opacity="0.18" />
                <circle cx={ptX} cy={ptY} r="6.5" fill="#ffffff" stroke={color} strokeWidth="3.5" />
                <text x={clamp(ptX, left + 26, left + plotW - 26)} y={clamp(ptY - 14, top + 12, top + plotH)} textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{fmt(currentValue)}</text>
            </svg>
        </div>
    );
};

interface SliderProps {
    label: string; value: number; min: number; max: number; step: number; unit: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; accent?: string; chip?: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, unit, onChange, accent = 'accent-sky-500', chip = 'bg-sky-50 text-sky-700' }) => (
    <label className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-slate-300">
        <span className="mb-2 flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <span>{label}</span><span className={`rounded-md px-2 py-0.5 font-mono ${chip}`}>{fmt(value)} {unit}</span>
        </span>
        <input className={`h-2 w-full cursor-pointer ${accent}`} type="range" value={value} min={min} max={max} step={step} onChange={onChange} />
    </label>
);

export default KinematicsGraphsLab;
