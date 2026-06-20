import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BatteryCharging, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface MechanicalEnergyLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'gravity' | 'spring';
type Environment = 'ideal' | 'dissipative';

const W = 1280;
const H = 760;
const G = 9.8;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const fmt = (value: number, digits = 2) => (Math.abs(value) < 0.0005 ? 0 : value).toFixed(digits);

interface EnergyState {
    position: number;
    velocity: number;
    kinetic: number;
    potential: number;
    total: number;
    initial: number;
    dissipated: number;
    progress: number;
    completed: boolean;
}

const MechanicalEnergyLab: React.FC<MechanicalEnergyLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const lastFrameRef = useRef<number | null>(null);
    const timeRef = useRef(0);
    const lastLiveRef = useRef(0);
    const lastHistoryTimeRef = useRef(-1);
    const completionHandledRef = useRef(false);

    const [mode, setMode] = useState<Mode>('gravity');
    const [environment, setEnvironment] = useState<Environment>('ideal');
    const [mass, setMass] = useState(2);
    const [height, setHeight] = useState(12);
    const [springK, setSpringK] = useState(40);
    const [amplitude, setAmplitude] = useState(1.5);
    const [animationSpeed, setAnimationSpeed] = useState(0.65);
    const [paused, setPaused] = useState(false);
    const [showVectors, setShowVectors] = useState(true);
    const [live, setLive] = useState<EnergyState>(() => gravityState(2, 12, 0, 'ideal'));
    const [history, setHistory] = useState<Array<{ t: number; k: number; v: number; e: number; loss: number }>>([]);

    const model = useMemo(() => ({ mode, environment, mass, height, springK, amplitude, animationSpeed, paused, showVectors }), [amplitude, animationSpeed, environment, height, mass, mode, paused, showVectors, springK]);
    const modelRef = useRef(model);
    useEffect(() => { modelRef.current = model; }, [model]);

    const stateAt = (nextMode: Mode, nextEnvironment: Environment, nextMass: number, nextHeight: number, nextK: number, nextAmplitude: number, time = 0) => (
        nextMode === 'gravity'
            ? gravityState(nextMass, nextHeight, time, nextEnvironment)
            : springState(nextMass, nextK, nextAmplitude, time, nextEnvironment)
    );

    const restartMotion = (overrides: Partial<{ mode: Mode; environment: Environment; mass: number; height: number; springK: number; amplitude: number }> = {}) => {
        const nextMode = overrides.mode ?? mode;
        const nextEnvironment = overrides.environment ?? environment;
        const nextMass = overrides.mass ?? mass;
        const nextHeight = overrides.height ?? height;
        const nextK = overrides.springK ?? springK;
        const nextAmplitude = overrides.amplitude ?? amplitude;
        timeRef.current = 0;
        lastFrameRef.current = null;
        lastHistoryTimeRef.current = -1;
        completionHandledRef.current = false;
        const next = stateAt(nextMode, nextEnvironment, nextMass, nextHeight, nextK, nextAmplitude);
        setLive(next);
        setHistory([{ t: 0, k: next.kinetic, v: next.potential, e: next.total, loss: next.dissipated }]);
    };

    const resetAll = () => {
        setMode('gravity'); setEnvironment('ideal'); setMass(2); setHeight(12); setSpringK(40); setAmplitude(1.5); setAnimationSpeed(0.65); setPaused(false); setShowVectors(true);
        restartMotion({ mode: 'gravity', environment: 'ideal', mass: 2, height: 12, springK: 40, amplitude: 1.5 });
    };

    const changeMode = (next: Mode) => {
        setMode(next);
        setPaused(false);
        restartMotion({ mode: next });
    };

    const changeEnvironment = (next: Environment) => {
        setEnvironment(next);
        setPaused(false);
        restartMotion({ environment: next });
    };

    const togglePlayback = () => {
        if (paused && mode === 'gravity' && live.completed) {
            restartMotion();
            setPaused(false);
            return;
        }
        setPaused(value => !value);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const render = (now: number) => {
            const state = modelRef.current;
            const previous = lastFrameRef.current ?? now;
            const dt = Math.min(0.05, (now - previous) / 1000);
            lastFrameRef.current = now;
            if (!state.paused) timeRef.current += dt * state.animationSpeed;

            const energy = state.mode === 'gravity'
                ? gravityState(state.mass, state.height, timeRef.current, state.environment)
                : springState(state.mass, state.springK, state.amplitude, timeRef.current, state.environment);

            if (energy.completed && !state.paused && !completionHandledRef.current) {
                completionHandledRef.current = true;
                setPaused(true);
            }

            if (now - lastLiveRef.current > 90) {
                lastLiveRef.current = now;
                setLive(energy);
                if (!state.paused && timeRef.current - lastHistoryTimeRef.current > 0.035) {
                    lastHistoryTimeRef.current = timeRef.current;
                    setHistory(current => [...current, { t: timeRef.current, k: energy.kinetic, v: energy.potential, e: energy.total, loss: energy.dissipated }].slice(-120));
                }
            }

            drawBackground(ctx);
            if (state.mode === 'gravity') drawGravityScene(ctx, state, energy);
            else drawSpringScene(ctx, state, energy, timeRef.current);
            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, []);

    const maxEnergy = Math.max(live.initial, 0.001);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Energy conversion</div>
                    <div className="text-xs font-semibold text-slate-500">{environment === 'ideal' ? 'K and V exchange; K + V stays fixed' : 'Mechanical energy becomes internal energy'}</div>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                        <EnergyColumn label="K" value={live.kinetic} max={maxEnergy} color="#16a34a" />
                        <EnergyColumn label="V" value={live.potential} max={maxEnergy} color="#d97706" />
                        <EnergyColumn label="K+V" value={live.total} max={maxEnergy} color="#7c3aed" />
                        <EnergyColumn label="Loss" value={live.dissipated} max={maxEnergy} color="#dc2626" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Energy vs time</div>
                    <div className="text-xs font-semibold text-slate-500">Green K / amber V / violet K+V / red loss</div>
                    <EnergyGraph history={history} />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Potential-energy shape</div>
                    <div className="text-xs font-semibold text-slate-500">{mode === 'gravity' ? 'V(h) = mgh is linear' : 'V(x) = 1/2 kx^2 is parabolic'}</div>
                    <PotentialGraph mode={mode} position={live.position} height={height} amplitude={amplitude} />
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-emerald-950">{environment === 'ideal' ? 'Conservative energy exchange' : 'Non-conservative comparison'}</div>
                    <div className="text-xs font-semibold text-emerald-700">NCERT Ch 5, Section 5.8</div>
                    <div className="mt-3 space-y-2 text-sm leading-snug text-emerald-950">
                        <p className="font-mono font-bold">{environment === 'ideal' ? 'Delta K + Delta V = 0' : 'E_f - E_i = W_nc'}</p>
                        <p className="font-mono font-bold">{environment === 'ideal' ? 'K + V = constant' : 'K + V + E_loss = E_i'}</p>
                        <p>{environment === 'ideal' ? 'Gravity and the ideal spring force are conservative.' : 'Air resistance or damping does negative work, so mechanical energy decreases.'}</p>
                        <p>Potential energy uses one fixed zero: ground level or spring equilibrium.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-extrabold text-slate-900">Real-time values</h3><span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live</span></div>
                    <div className="grid gap-2">
                        <ValueCard label={mode === 'gravity' ? 'Height h' : 'Displacement x'} value={`${fmt(live.position)} m`} tone="blue" />
                        <ValueCard label="Speed |v|" value={`${fmt(Math.abs(live.velocity))} m/s`} tone="cyan" />
                        <ValueCard label="Kinetic energy K" value={`${fmt(live.kinetic)} J`} tone="emerald" />
                        <ValueCard label="Potential energy V" value={`${fmt(live.potential)} J`} tone="amber" />
                        <ValueCard label="Mechanical energy E" value={`${fmt(live.total)} J`} tone="violet" />
                        <ValueCard label="Energy transferred" value={`${fmt(live.dissipated)} J`} tone="red" />
                        <ValueCard label="Balance residual" value={`${fmt(live.kinetic + live.potential + live.dissipated - live.initial, 4)} J`} tone="slate" />
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
                    <button onClick={togglePlayback} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50" title={paused ? (live.completed ? 'Replay' : 'Play') : 'Pause'}>{paused ? (live.completed ? <RotateCcw size={16} /> : <Play size={16} />) : <Pause size={16} />}</button>
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
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><BatteryCharging size={18} className="text-emerald-700" /> Mechanical Energy Bench</div>
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <ModeButton active={mode === 'gravity'} label="Free fall" onClick={() => changeMode('gravity')} />
                    <ModeButton active={mode === 'spring'} label="Spring-block" onClick={() => changeMode('spring')} />
                </div>
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <ModeButton active={environment === 'ideal'} label="NCERT ideal" onClick={() => changeEnvironment('ideal')} />
                    <ModeButton active={environment === 'dissipative'} label="Real losses" onClick={() => changeEnvironment('dissipative')} />
                </div>
            </div>
            {mode === 'gravity' ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <Slider label="Ball mass m" value={mass} min={0.5} max={8} step={0.5} unit="kg" accent="accent-blue-600" onChange={value => { setMass(value); setPaused(false); restartMotion({ mass: value }); }} />
                    <Slider label="Release height H" value={height} min={3} max={20} step={1} unit="m" accent="accent-amber-600" onChange={value => { setHeight(value); setPaused(false); restartMotion({ height: value }); }} />
                    <Slider label="Animation speed" value={animationSpeed} min={0.2} max={1.5} step={0.1} unit="x" accent="accent-emerald-600" onChange={setAnimationSpeed} />
                    <Toggle label="Show velocity vector" checked={showVectors} onChange={setShowVectors} />
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                    <Slider label="Block mass m" value={mass} min={0.5} max={8} step={0.5} unit="kg" accent="accent-blue-600" onChange={value => { setMass(value); setPaused(false); restartMotion({ mass: value }); }} />
                    <Slider label="Spring constant k" value={springK} min={10} max={100} step={5} unit="N/m" accent="accent-violet-600" onChange={value => { setSpringK(value); setPaused(false); restartMotion({ springK: value }); }} />
                    <Slider label="Amplitude A" value={amplitude} min={0.5} max={2.5} step={0.1} unit="m" accent="accent-amber-600" onChange={value => { setAmplitude(value); setPaused(false); restartMotion({ amplitude: value }); }} />
                    <Slider label="Animation speed" value={animationSpeed} min={0.2} max={1.5} step={0.1} unit="x" accent="accent-emerald-600" onChange={setAnimationSpeed} />
                    <Toggle label="Show velocity vector" checked={showVectors} onChange={setShowVectors} />
                </div>
            )}
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} simulationStageWidth={W} simulationStageHeight={H} simulationAreaFlex="7 1 0%" controlsAreaFlex="3 1 0%" controlsWrapperClassName="w-full h-full max-w-[min(100%,900px)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:rounded-3xl md:p-5" />;
};

const gravityState = (mass: number, height: number, time: number, environment: Environment): EnergyState => {
    // The comparison model uses a constant upward resistance of 0.18 mg.
    // It is intentionally labelled non-conservative rather than presented as an air-drag law.
    const effectiveG = environment === 'ideal' ? G : 0.82 * G;
    const fallTime = Math.sqrt(2 * height / effectiveG);
    const fallingTime = Math.min(time, fallTime);
    const h = Math.max(0, height - 0.5 * effectiveG * fallingTime * fallingTime);
    const velocity = -effectiveG * fallingTime;
    const potential = mass * G * h;
    const kinetic = 0.5 * mass * velocity * velocity;
    const initial = mass * G * height;
    const total = kinetic + potential;
    const dissipated = Math.max(0, initial - total);
    return { position: h, velocity, kinetic, potential, total, initial, dissipated, progress: fallingTime / fallTime, completed: time >= fallTime };
};

const springState = (mass: number, springK: number, amplitude: number, time: number, environment: Environment): EnergyState => {
    const omega0 = Math.sqrt(springK / mass);
    const dampingRate = environment === 'ideal' ? 0 : 0.22 / mass;
    const omega = Math.sqrt(Math.max(omega0 * omega0 - dampingRate * dampingRate, 0.001));
    const decay = Math.exp(-dampingRate * time);
    const x = environment === 'ideal'
        ? amplitude * Math.cos(omega * time)
        : amplitude * decay * (Math.cos(omega * time) + dampingRate / omega * Math.sin(omega * time));
    const velocity = environment === 'ideal'
        ? -omega * amplitude * Math.sin(omega * time)
        : -amplitude * decay * (omega0 * omega0 / omega) * Math.sin(omega * time);
    const potential = 0.5 * springK * x * x;
    const kinetic = 0.5 * mass * velocity * velocity;
    const initial = 0.5 * springK * amplitude * amplitude;
    const total = kinetic + potential;
    const dissipated = Math.max(0, initial - total);
    return { position: x, velocity, kinetic, potential, total, initial, dissipated, progress: (x / amplitude + 1) / 2, completed: false };
};

const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(15,23,42,0.04)'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
};

const drawGravityScene = (ctx: CanvasRenderingContext2D, state: { mass: number; height: number; showVectors: boolean; environment: Environment }, energy: EnergyState) => {
    const topY = 145, groundY = 660, x = 640;
    const ballY = groundY - energy.position / state.height * (groundY - topY);
    ctx.textAlign = 'center'; ctx.fillStyle = '#0f172a'; ctx.font = '800 29px Inter, sans-serif'; ctx.fillText('Gravitational potential energy becomes kinetic energy', 640, 64);
    ctx.fillStyle = '#64748b'; ctx.font = '600 15px Inter, sans-serif'; ctx.fillText(state.environment === 'ideal' ? 'NCERT Fig. 5.5 idealisation / air resistance neglected / g = 9.8 m/s^2' : 'Non-conservative comparison / constant upward resistance = 0.18 mg', 640, 94);

    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(410, topY); ctx.lineTo(410, groundY); ctx.stroke();
    for (let i = 0; i <= 5; i++) { const y = groundY - i / 5 * (groundY - topY); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(395, y); ctx.lineTo(425, y); ctx.stroke(); ctx.fillStyle = '#475569'; ctx.font = '700 13px Inter, sans-serif'; ctx.textAlign = 'right'; ctx.fillText(`${fmt(state.height * i / 5, 1)} m`, 380, y + 5); }

    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(250, groundY + 35); ctx.lineTo(1030, groundY + 35); ctx.stroke();
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(250, groundY + 35, 780, 22);

    const checkpoints = state.environment === 'ideal'
        ? [['At H', 'K = 0, V = mgH'], ['At H/2', 'K = V = mgH/2'], ['At 0', 'K = mgH, V = 0']]
        : [['At H', 'K = 0, V = mgH'], ['During fall', 'K + V decreases'], ['Energy balance', 'K + V + loss = mgH']];
    checkpoints.forEach(([label, equation], index) => {
        const cardY = 205 + index * 112;
        ctx.fillStyle = index === 1 ? '#eff6ff' : '#f8fafc';
        roundRect(ctx, 845, cardY, 290, 82, 14); ctx.fill();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.textAlign = 'left'; ctx.fillStyle = '#334155'; ctx.font = '800 14px Inter, sans-serif'; ctx.fillText(label, 865, cardY + 29);
        ctx.fillStyle = '#0f172a'; ctx.font = '700 15px ui-monospace, monospace'; ctx.fillText(equation, 865, cardY + 57);
    });

    for (let i = 1; i <= 6; i++) { const trailY = ballY - i * 32; if (trailY > topY) { ctx.fillStyle = `rgba(37,99,235,${0.24 - i * 0.025})`; ctx.beginPath(); ctx.arc(x, trailY, 16 - i, 0, Math.PI * 2); ctx.fill(); } }
    drawBall(ctx, x, ballY, 31);
    ctx.fillStyle = '#1d4ed8'; ctx.textAlign = 'center'; ctx.font = '800 14px Inter, sans-serif'; ctx.fillText(`${fmt(state.mass, 1)} kg`, x, ballY + 54);

    if (state.showVectors && Math.abs(energy.velocity) > 0.05) {
        const length = clamp(Math.abs(energy.velocity) * 8, 28, 145);
        drawArrow(ctx, x + 72, ballY, x + 72, ballY + length, '#16a34a');
        ctx.fillStyle = '#15803d'; ctx.font = '800 14px Inter, sans-serif'; ctx.fillText('v', x + 92, ballY + length / 2);
        drawArrow(ctx, x - 72, ballY - 45, x - 72, ballY + 55, '#dc2626');
        ctx.fillStyle = '#b91c1c'; ctx.fillText('mg', x - 98, ballY + 8);
        if (state.environment === 'dissipative') {
            drawArrow(ctx, x + 122, ballY + 40, x + 122, ballY - 35, '#f59e0b');
            ctx.fillStyle = '#b45309'; ctx.fillText('resistance', x + 174, ballY + 8);
        }
    }
    ctx.fillStyle = '#64748b'; ctx.font = '700 13px Inter, sans-serif'; ctx.fillText(energy.completed ? 'ground: V = 0 / state shown just before impact' : 'ground: V = 0', 640, 728);
};

const drawSpringScene = (ctx: CanvasRenderingContext2D, state: { mass: number; amplitude: number; showVectors: boolean; environment: Environment }, energy: EnergyState, time: number) => {
    const wallX = 220, y = 410, equilibriumX = 700, pxPerMetre = 150, blockX = equilibriumX + energy.position * pxPerMetre;
    ctx.textAlign = 'center'; ctx.fillStyle = '#0f172a'; ctx.font = '800 29px Inter, sans-serif'; ctx.fillText('Elastic potential energy exchanges with kinetic energy', 640, 64);
    ctx.fillStyle = '#64748b'; ctx.font = '600 15px Inter, sans-serif'; ctx.fillText(state.environment === 'ideal' ? 'NCERT Fig. 5.7 / ideal massless spring / smooth horizontal surface' : 'Real comparison / weak velocity-dependent damping transfers mechanical energy', 640, 94);

    ctx.fillStyle = '#cbd5e1'; ctx.fillRect(wallX - 34, 190, 34, 410);
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(wallX - 34, 205 + i * 34); ctx.lineTo(wallX, 185 + i * 34); ctx.stroke(); }
    drawSpring(ctx, wallX, y, blockX - 58, y, time);

    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(170, y + 87); ctx.lineTo(1110, y + 87); ctx.stroke();
    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(170, y + 88, 940, 28);
    ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 2; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.moveTo(equilibriumX, 190); ctx.lineTo(equilibriumX, y + 116); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#0e7490'; ctx.font = '800 13px Inter, sans-serif'; ctx.fillText('x = 0', equilibriumX, 174);
    ctx.fillStyle = '#64748b'; ctx.font = '800 12px Inter, sans-serif';
    ctx.fillText('-A', equilibriumX - state.amplitude * pxPerMetre, 545);
    ctx.fillText('x = 0', equilibriumX, 545);
    ctx.fillText('+A', equilibriumX + state.amplitude * pxPerMetre, 545);
    ctx.font = '700 13px Inter, sans-serif'; ctx.fillText('At +/-A: V is maximum / at x = 0: K is maximum', equilibriumX, 580);

    ctx.save(); ctx.shadowColor = 'rgba(37,99,235,0.28)'; ctx.shadowBlur = 18; roundRect(ctx, blockX - 58, y - 58, 116, 116, 18); const gradient = ctx.createLinearGradient(blockX - 58, y - 58, blockX + 58, y + 58); gradient.addColorStop(0, '#dbeafe'); gradient.addColorStop(0.55, '#2563eb'); gradient.addColorStop(1, '#1e3a8a'); ctx.fillStyle = gradient; ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.font = '800 16px Inter, sans-serif'; ctx.fillText(`${fmt(state.mass, 1)} kg`, blockX, y + 6);

    if (state.showVectors && Math.abs(energy.velocity) > 0.05) {
        const direction = Math.sign(energy.velocity); const length = clamp(Math.abs(energy.velocity) * 20, 35, 150);
        drawArrow(ctx, blockX, y - 92, blockX + direction * length, y - 92, '#16a34a');
        ctx.fillStyle = '#15803d'; ctx.font = '800 14px Inter, sans-serif'; ctx.fillText('v', blockX + direction * length / 2, y - 110);
    }

    if (state.showVectors && Math.abs(energy.position) > 0.02) {
        const forceDirection = -Math.sign(energy.position);
        const forceLength = clamp(Math.abs(energy.position) * 70, 35, 145);
        drawArrow(ctx, blockX, y + 82, blockX + forceDirection * forceLength, y + 82, '#7c3aed');
        ctx.fillStyle = '#6d28d9'; ctx.font = '800 14px Inter, sans-serif'; ctx.fillText('F = -kx', blockX + forceDirection * forceLength / 2, y + 112);
    }

    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(equilibriumX, 650); ctx.lineTo(blockX, 650); ctx.stroke();
    ctx.fillStyle = '#6d28d9'; ctx.font = '800 14px Inter, sans-serif'; ctx.fillText(`x = ${fmt(energy.position)} m`, (equilibriumX + blockX) / 2, 678);
};

const drawBall = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => { ctx.save(); ctx.shadowColor = 'rgba(37,99,235,0.45)'; ctx.shadowBlur = 20; const g = ctx.createRadialGradient(x - 10, y - 11, 3, x, y, radius); g.addColorStop(0, '#ffffff'); g.addColorStop(0.28, '#60a5fa'); g.addColorStop(1, '#1e3a8a'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
const drawSpring = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, time: number) => { const coils = 14, amplitude = 25; ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); for (let i = 1; i < coils * 2; i++) { const t = i / (coils * 2); ctx.lineTo(x1 + (x2 - x1) * t, y1 + (i % 2 ? -amplitude : amplitude)); } ctx.lineTo(x2, y2); ctx.stroke(); };
const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => { const angle = Math.atan2(y2 - y1, x2 - x1); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 16 * Math.cos(angle - Math.PI / 6), y2 - 16 * Math.sin(angle - Math.PI / 6)); ctx.lineTo(x2 - 16 * Math.cos(angle + Math.PI / 6), y2 - 16 * Math.sin(angle + Math.PI / 6)); ctx.closePath(); ctx.fill(); };
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => { ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.arcTo(x + width, y, x + width, y + height, radius); ctx.arcTo(x + width, y + height, x, y + height, radius); ctx.arcTo(x, y + height, x, y, radius); ctx.arcTo(x, y, x + width, y, radius); ctx.closePath(); };

const EnergyColumn: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => { const height = clamp(value / max * 118, 0, 118); return <div className="text-center"><div className="relative mx-auto h-[125px] w-12 overflow-hidden rounded-xl bg-slate-100"><div className="absolute bottom-0 w-full rounded-xl transition-all" style={{ height, backgroundColor: color }} /></div><div className="mt-2 font-bold text-slate-700">{label}</div><div className="font-mono text-[11px] text-slate-600">{fmt(value, 1)} J</div></div>; };

const EnergyGraph: React.FC<{ history: Array<{ t: number; k: number; v: number; e: number; loss: number }> }> = ({ history }) => { const width = 300, height = 175, left = 32, top = 18, plotW = 250, plotH = 125, max = Math.max(...history.map(p => p.e + p.loss), 1); const pathFor = (key: 'k' | 'v' | 'e' | 'loss') => history.map((point, index) => `${index ? 'L' : 'M'}${left + index / Math.max(1, history.length - 1) * plotW},${top + plotH - point[key] / max * plotH}`).join(' '); return <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full"><line x1={left} y1={top + plotH} x2={left + plotW} y2={top + plotH} stroke="#475569" /><line x1={left} y1={top} x2={left} y2={top + plotH} stroke="#475569" />{history.length > 1 && <><path d={pathFor('k')} fill="none" stroke="#16a34a" strokeWidth="3" /><path d={pathFor('v')} fill="none" stroke="#d97706" strokeWidth="3" /><path d={pathFor('e')} fill="none" stroke="#7c3aed" strokeWidth="3" /><path d={pathFor('loss')} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="5 4" /></>}<text x="282" y="163" textAnchor="end" fill="#64748b" fontSize="10">time</text><text x="15" y="21" fill="#64748b" fontSize="10">E</text></svg>; };

const PotentialGraph: React.FC<{ mode: Mode; position: number; height: number; amplitude: number }> = ({ mode, position, height, amplitude }) => { const points = Array.from({ length: 61 }, (_, i) => { const x = i / 60; return mode === 'gravity' ? { x, y: x } : { x, y: Math.pow((x - 0.5) * 2, 2) }; }); const path = points.map((p, i) => `${i ? 'L' : 'M'}${35 + p.x * 245},${145 - p.y * 110}`).join(' '); const norm = mode === 'gravity' ? clamp(position / height, 0, 1) : clamp((position / amplitude + 1) / 2, 0, 1); const yNorm = mode === 'gravity' ? norm : Math.pow((norm - 0.5) * 2, 2); return <svg viewBox="0 0 310 175" className="mt-2 w-full"><line x1="35" y1="145" x2="286" y2="145" stroke="#475569" /><line x1="35" y1="25" x2="35" y2="145" stroke="#475569" /><path d={path} fill="none" stroke="#d97706" strokeWidth="4" /><circle cx={35 + norm * 245} cy={145 - yNorm * 110} r="7" fill="#2563eb" /><text x="284" y="165" textAnchor="end" fill="#64748b" fontSize="10">{mode === 'gravity' ? 'h' : 'x'}</text><text x="15" y="29" fill="#64748b" fontSize="10">V</text></svg>; };

const ValueCard: React.FC<{ label: string; value: string; tone: 'blue' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'red' | 'slate' }> = ({ label, value, tone }) => { const styles = { blue: 'bg-blue-50 text-blue-800', cyan: 'bg-cyan-50 text-cyan-800', emerald: 'bg-emerald-50 text-emerald-800', amber: 'bg-amber-50 text-amber-800', violet: 'bg-violet-50 text-violet-800', red: 'bg-red-50 text-red-800', slate: 'bg-slate-50 text-slate-800' }; return <div className={`rounded-lg border border-slate-100 px-3 py-2.5 ${styles[tone]}`}><div className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</div><div className="mt-1 font-mono text-base font-extrabold">{value}</div></div>; };
const ModeButton: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => <button onClick={onClick} className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${active ? 'bg-emerald-700 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>{label}</button>;
const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit: string; accent: string; onChange: (value: number) => void }> = ({ label, value, min, max, step, unit, accent, onChange }) => <label className="rounded-xl border border-slate-200 bg-white p-3"><span className="mb-2 flex justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600"><span>{label}</span><span className="font-mono text-sm text-slate-900">{fmt(value, step < 1 ? 1 : 0)} {unit}</span></span><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className={`h-2 w-full cursor-pointer ${accent}`} /></label>;
const Toggle: React.FC<{ label: string; checked: boolean; onChange: (value: boolean) => void }> = ({ label, checked, onChange }) => <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-3"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{label}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-5 w-5 accent-emerald-600" /></label>;

export default MechanicalEnergyLab;
