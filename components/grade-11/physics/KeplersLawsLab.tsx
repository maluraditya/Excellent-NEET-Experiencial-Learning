import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Orbit, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface KeplersLawsLabProps {
    topic: any;
    onExit: () => void;
}

type LawMode = 'orbits' | 'areas' | 'periods';

const W = 1280;
const H = 760;
const MU_SUN = 4 * Math.PI * Math.PI; // AU^3 yr^-2: Earth has a=1 AU, T=1 yr.
const AU_PER_YEAR_TO_KM_S = 4.74047;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const fmt = (value: number, digits = 2) => (Math.abs(value) < 0.0005 ? 0 : value).toFixed(digits);

const eccentricAnomaly = (meanAnomaly: number, eccentricity: number) => {
    let estimate = meanAnomaly;
    for (let i = 0; i < 7; i++) {
        estimate -= (estimate - eccentricity * Math.sin(estimate) - meanAnomaly) / (1 - eccentricity * Math.cos(estimate));
    }
    return estimate;
};

const orbitState = (a: number, e: number, meanAnomaly: number) => {
    const E = eccentricAnomaly(meanAnomaly, e);
    const b = a * Math.sqrt(1 - e * e);
    const x = a * (Math.cos(E) - e);
    const y = b * Math.sin(E);
    const r = a * (1 - e * Math.cos(E));
    const meanMotion = Math.sqrt(MU_SUN / (a * a * a));
    const dEdt = meanMotion / (1 - e * Math.cos(E));
    const vx = -a * Math.sin(E) * dEdt;
    const vy = b * Math.cos(E) * dEdt;
    const speedAuYr = Math.sqrt(vx * vx + vy * vy);
    return { E, b, x, y, r, vx, vy, speedAuYr, speedKmS: speedAuYr * AU_PER_YEAR_TO_KM_S };
};

const KeplersLawsLab: React.FC<KeplersLawsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const lastFrameRef = useRef<number | null>(null);
    const meanAnomalyRef = useRef(0);
    const earthAnomalyRef = useRef(0);
    const lastLiveRef = useRef(0);

    const [mode, setMode] = useState<LawMode>('orbits');
    const [semiMajorAxis, setSemiMajorAxis] = useState(1.4);
    const [eccentricity, setEccentricity] = useState(0.5);
    const [animationSpeed, setAnimationSpeed] = useState(0.45);
    const [paused, setPaused] = useState(false);
    const [showTrail, setShowTrail] = useState(true);
    const [live, setLive] = useState(() => orbitState(1.4, 0.5, 0));

    const physicsEccentricity = mode === 'periods' ? 0 : eccentricity;
    const period = Math.pow(semiMajorAxis, 1.5);
    const perihelion = semiMajorAxis * (1 - physicsEccentricity);
    const aphelion = semiMajorAxis * (1 + physicsEccentricity);
    const perihelionSpeed = Math.sqrt(MU_SUN * (2 / perihelion - 1 / semiMajorAxis)) * AU_PER_YEAR_TO_KM_S;
    const aphelionSpeed = Math.sqrt(MU_SUN * (2 / aphelion - 1 / semiMajorAxis)) * AU_PER_YEAR_TO_KM_S;
    const areaRate = 0.5 * Math.sqrt(MU_SUN * semiMajorAxis * (1 - physicsEccentricity * physicsEccentricity));

    const model = useMemo(() => ({ mode, semiMajorAxis, eccentricity, animationSpeed, paused, showTrail }), [animationSpeed, eccentricity, mode, paused, semiMajorAxis, showTrail]);
    const modelRef = useRef(model);
    useEffect(() => { modelRef.current = model; }, [model]);

    const resetMotion = () => {
        meanAnomalyRef.current = 0;
        earthAnomalyRef.current = 0;
        lastFrameRef.current = null;
        setLive(orbitState(semiMajorAxis, mode === 'periods' ? 0 : eccentricity, 0));
    };

    const resetAll = () => {
        setMode('orbits'); setSemiMajorAxis(1.4); setEccentricity(0.5); setAnimationSpeed(0.45); setPaused(false); setShowTrail(true);
        meanAnomalyRef.current = 0; earthAnomalyRef.current = 0; lastFrameRef.current = null;
        setLive(orbitState(1.4, 0.5, 0));
    };

    const setLawMode = (next: LawMode) => {
        setMode(next);
        meanAnomalyRef.current = 0;
        earthAnomalyRef.current = 0;
        lastFrameRef.current = null;
        setLive(orbitState(semiMajorAxis, next === 'periods' ? 0 : eccentricity, 0));
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
            if (!state.paused) {
                const testMeanMotion = 2 * Math.PI / Math.pow(state.semiMajorAxis, 1.5);
                meanAnomalyRef.current = (meanAnomalyRef.current + testMeanMotion * dt * state.animationSpeed) % (2 * Math.PI);
                earthAnomalyRef.current = (earthAnomalyRef.current + 2 * Math.PI * dt * state.animationSpeed) % (2 * Math.PI);
                if (now - lastLiveRef.current > 90) {
                    lastLiveRef.current = now;
                    setLive(orbitState(state.semiMajorAxis, state.mode === 'periods' ? 0 : state.eccentricity, meanAnomalyRef.current));
                }
            }
            drawBackground(ctx);
            if (state.mode === 'periods') drawPeriodsScene(ctx, state, meanAnomalyRef.current, earthAnomalyRef.current);
            else drawEllipseScene(ctx, state, meanAnomalyRef.current);
            rafRef.current = requestAnimationFrame(render);
        };

        rafRef.current = requestAnimationFrame(render);
        return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    }, []);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Ellipse geometry</div>
                    <div className="text-xs font-semibold text-slate-500">The Sun is at one focus, not the centre</div>
                    <svg viewBox="0 0 310 175" className="mt-2 w-full">
                        <ellipse cx="155" cy="87" rx="126" ry={126 * Math.sqrt(1 - physicsEccentricity * physicsEccentricity)} fill="#f8fafc" stroke="#0891b2" strokeWidth="3" />
                        <circle cx={155 - 126 * physicsEccentricity} cy="87" r="9" fill="#f59e0b" />
                        <circle cx={155 + 126 * physicsEccentricity} cy="87" r="4" fill="#94a3b8" />
                        <line x1="29" y1="151" x2="281" y2="151" stroke="#475569" strokeWidth="1.5" />
                        <text x="155" y="168" textAnchor="middle" fill="#475569" fontSize="11">2a = {(2 * semiMajorAxis).toFixed(1)} AU</text>
                        <text x={155 - 126 * physicsEccentricity} y="69" textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="700">Sun</text>
                    </svg>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Orbital speed</div>
                    <div className="text-xs font-semibold text-slate-500">Fast near perihelion, slow near aphelion</div>
                    <div className="mt-3 space-y-3">
                        <MetricBar label="Perihelion" value={perihelionSpeed} max={perihelionSpeed} color="#dc2626" suffix="km/s" />
                        <MetricBar label="Current" value={live.speedKmS} max={perihelionSpeed} color="#0891b2" suffix="km/s" />
                        <MetricBar label="Aphelion" value={aphelionSpeed} max={perihelionSpeed} color="#2563eb" suffix="km/s" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Law of periods</div>
                    <div className="text-xs font-semibold text-slate-500">Straight line when plotting T² against a³</div>
                    <svg viewBox="0 0 310 185" className="mt-2 w-full">
                        <line x1="40" y1="145" x2="286" y2="145" stroke="#475569" strokeWidth="1.5" /><line x1="40" y1="24" x2="40" y2="145" stroke="#475569" strokeWidth="1.5" />
                        <line x1="40" y1="145" x2="276" y2="34" stroke="#7c3aed" strokeWidth="4" />
                        <circle cx={40 + Math.pow(semiMajorAxis, 3) / Math.pow(2.5, 3) * 236} cy={145 - Math.pow(period, 2) / Math.pow(2.5, 3) * 111} r="7" fill="#dc2626" />
                        <text x="286" y="166" textAnchor="end" fill="#64748b" fontSize="11">a³</text><text x="20" y="29" textAnchor="middle" fill="#64748b" fontSize="11">T²</text>
                        <text x="170" y="178" textAnchor="middle" fill="#475569" fontSize="11">Current quotient T²/a³ = 1.00</text>
                    </svg>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <LawTheory mode={mode} />
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-extrabold text-slate-900">Real-time values</h3><span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live</span></div>
                    <div className="grid gap-2">
                        <ValueCard label="Semi-major axis a" value={`${fmt(semiMajorAxis)} AU`} tone="violet" />
                        {mode !== 'periods' && <ValueCard label="Eccentricity e" value={fmt(eccentricity)} tone="slate" />}
                        <ValueCard label="Sun-planet distance r" value={`${fmt(live.r)} AU`} tone="amber" />
                        <ValueCard label="Orbital speed" value={`${fmt(live.speedKmS)} km/s`} tone="cyan" />
                        <ValueCard label="Orbital period T" value={`${fmt(period)} years`} tone="blue" />
                        {mode === 'areas' && <ValueCard label="Swept-area rate" value={`${fmt(areaRate)} AU²/year`} tone="emerald" />}
                        {mode === 'periods' && <ValueCard label="T² / a³" value="1.000 year²/AU³" tone="emerald" />}
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
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><Orbit size={18} className="text-indigo-700" /> Kepler's Laws Orbit Bench</div>
                <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <ModeButton active={mode === 'orbits'} label="1. Orbits" onClick={() => setLawMode('orbits')} />
                    <ModeButton active={mode === 'areas'} label="2. Areas" onClick={() => setLawMode('areas')} />
                    <ModeButton active={mode === 'periods'} label="3. Periods" onClick={() => setLawMode('periods')} />
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Slider label={mode === 'periods' ? 'Test planet semi-major axis' : 'Semi-major axis a'} value={semiMajorAxis} min={0.5} max={2.5} step={0.1} unit="AU" accent="accent-violet-600" onChange={value => { setSemiMajorAxis(value); resetMotion(); }} />
                {mode !== 'periods' && <Slider label="Orbit eccentricity e" value={eccentricity} min={0} max={0.75} step={0.05} unit="" accent="accent-cyan-600" onChange={value => { setEccentricity(value); resetMotion(); }} />}
                <Slider label="Animation speed" value={animationSpeed} min={0.1} max={1.2} step={0.05} unit="x" accent="accent-emerald-600" onChange={setAnimationSpeed} />
                {mode !== 'periods' && <Toggle label="Show orbital trail" checked={showTrail} onChange={setShowTrail} />}
            </div>
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} simulationStageWidth={W} simulationStageHeight={H} simulationAreaFlex="7 1 0%" controlsAreaFlex="3 1 0%" controlsWrapperClassName="w-full h-full max-w-[min(100%,860px)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:rounded-3xl md:p-5" />;
};

const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(15,23,42,0.04)'; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
};

const drawEllipseScene = (ctx: CanvasRenderingContext2D, state: { mode: LawMode; semiMajorAxis: number; eccentricity: number; animationSpeed: number; paused: boolean; showTrail: boolean }, meanAnomaly: number) => {
    const cx = 640, cy = 420, aPx = 300, bPx = aPx * Math.sqrt(1 - state.eccentricity * state.eccentricity), focusX = cx - aPx * state.eccentricity;
    const current = orbitState(state.semiMajorAxis, state.eccentricity, meanAnomaly);
    const px = cx + aPx * (Math.cos(current.E) - state.eccentricity);
    const py = cy + bPx * Math.sin(current.E);

    ctx.textAlign = 'center'; ctx.fillStyle = '#0f172a'; ctx.font = '800 29px Inter, sans-serif';
    ctx.fillText(state.mode === 'areas' ? 'Equal areas in equal times' : 'Elliptical orbit with the Sun at one focus', 640, 65);
    ctx.fillStyle = '#64748b'; ctx.font = '600 15px Inter, sans-serif';
    ctx.fillText(state.mode === 'areas' ? 'Each coloured sector spans the same time interval' : 'Perihelion P is nearest the Sun; aphelion A is farthest', 640, 94);

    if (state.mode === 'areas') {
        const interval = Math.PI / 6;
        for (let sector = 0; sector < 6; sector++) {
            const endM = meanAnomaly - sector * interval;
            const startM = endM - interval;
            drawAreaSector(ctx, cx, cy, focusX, state.eccentricity, aPx, bPx, startM, endM, sector % 2 === 0 ? '#f59e0b' : '#0891b2');
        }
    }

    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.ellipse(cx, cy, aPx, bPx, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    if (state.showTrail) {
        ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
        const samples = 80;
        for (let i = 0; i <= samples; i++) {
            const M = meanAnomaly - 1.4 + 1.4 * i / samples;
            const point = orbitState(state.semiMajorAxis, state.eccentricity, M);
            const x = cx + aPx * (Math.cos(point.E) - state.eccentricity);
            const y = cy + bPx * Math.sin(point.E);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(focusX, cy); ctx.lineTo(px, py); ctx.stroke();
    drawSun(ctx, focusX, cy, 32); drawPlanet(ctx, px, py, 17);

    const velocityScale = 7;
    drawArrow(ctx, px, py, px + current.vx * velocityScale, py + current.vy * velocityScale, '#16a34a');
    ctx.fillStyle = '#15803d'; ctx.font = '800 13px Inter, sans-serif'; ctx.fillText('v', px + current.vx * velocityScale + 13, py + current.vy * velocityScale - 10);

    const secondFocusX = cx + aPx * state.eccentricity;
    ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.arc(secondFocusX, cy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.font = '700 13px Inter, sans-serif'; ctx.fillText('F₂', secondFocusX, cy - 17);
    ctx.fillStyle = '#b45309'; ctx.fillText('Sun (F₁)', focusX, cy + 58);
    ctx.fillStyle = '#dc2626'; ctx.fillText('P', cx - aPx - 18, cy + 5);
    ctx.fillStyle = '#2563eb'; ctx.fillText('A', cx + aPx + 18, cy + 5);

    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - aPx, 132); ctx.lineTo(cx + aPx, 132); ctx.stroke();
    drawArrowHead(ctx, cx - aPx, 132, Math.PI, '#7c3aed'); drawArrowHead(ctx, cx + aPx, 132, 0, '#7c3aed');
    ctx.fillStyle = '#6d28d9'; ctx.font = '800 14px Inter, sans-serif'; ctx.fillText('major axis = 2a', cx, 153);
};

const drawPeriodsScene = (ctx: CanvasRenderingContext2D, state: { semiMajorAxis: number; eccentricity: number }, testM: number, earthM: number) => {
    const cx = 640, cy = 410, scale = 115;
    const testRadius = state.semiMajorAxis * scale;
    const earthRadius = scale;
    ctx.textAlign = 'center'; ctx.fillStyle = '#0f172a'; ctx.font = '800 29px Inter, sans-serif'; ctx.fillText('Orbital period grows as a³ᐟ²', 640, 65);
    ctx.fillStyle = '#64748b'; ctx.font = '600 15px Inter, sans-serif'; ctx.fillText('Earth is the 1 AU reference; the test planet follows T²/a³ = constant', 640, 94);

    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.5; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.arc(cx, cy, earthRadius, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, testRadius, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    drawSun(ctx, cx, cy, 34);
    const earthX = cx + Math.cos(earthM) * earthRadius, earthY = cy + Math.sin(earthM) * earthRadius;
    const testX = cx + Math.cos(testM) * testRadius, testY = cy + Math.sin(testM) * testRadius;
    drawPlanet(ctx, earthX, earthY, 14); drawPlanet(ctx, testX, testY, 18, '#7c3aed');
    ctx.fillStyle = '#2563eb'; ctx.font = '800 13px Inter, sans-serif'; ctx.fillText('Earth: a=1 AU, T=1 y', earthX, earthY - 26);
    ctx.fillStyle = '#6d28d9'; ctx.fillText('Test planet', testX, testY - 28);
    ctx.fillStyle = '#64748b'; ctx.font = '600 13px Inter, sans-serif'; ctx.fillText('Both planets orbit the same Sun', 640, 724);
};

const drawAreaSector = (ctx: CanvasRenderingContext2D, cx: number, cy: number, focusX: number, e: number, aPx: number, bPx: number, startM: number, endM: number, color: string) => {
    ctx.beginPath(); ctx.moveTo(focusX, cy);
    const steps = 22;
    for (let i = 0; i <= steps; i++) {
        const M = startM + (endM - startM) * i / steps;
        const E = eccentricAnomaly(M, e);
        ctx.lineTo(cx + aPx * (Math.cos(E) - e), cy + bPx * Math.sin(E));
    }
    ctx.closePath(); ctx.fillStyle = `${color}24`; ctx.fill(); ctx.strokeStyle = `${color}88`; ctx.lineWidth = 1.5; ctx.stroke();
};

const drawSun = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.save(); ctx.shadowColor = 'rgba(245,158,11,0.65)'; ctx.shadowBlur = 28;
    const gradient = ctx.createRadialGradient(x - 8, y - 9, 4, x, y, radius); gradient.addColorStop(0, '#fff7ed'); gradient.addColorStop(0.35, '#fbbf24'); gradient.addColorStop(1, '#f97316');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};

const drawPlanet = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color = '#2563eb') => {
    ctx.save(); ctx.shadowColor = `${color}77`; ctx.shadowBlur = 18;
    const gradient = ctx.createRadialGradient(x - 5, y - 6, 2, x, y, radius); gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(0.3, color); gradient.addColorStop(1, '#172554');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
};

const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => { const angle = Math.atan2(y2 - y1, x2 - x1); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); drawArrowHead(ctx, x2, y2, angle, color); };
const drawArrowHead = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 15 * Math.cos(angle - Math.PI / 6), y - 15 * Math.sin(angle - Math.PI / 6)); ctx.lineTo(x - 15 * Math.cos(angle + Math.PI / 6), y - 15 * Math.sin(angle + Math.PI / 6)); ctx.closePath(); ctx.fill(); };

const LawTheory: React.FC<{ mode: LawMode }> = ({ mode }) => {
    const content = mode === 'orbits'
        ? { title: 'First law: Orbits', ref: 'NCERT Ch 7, Section 7.2', lines: ['Every planet follows an ellipse.', 'The Sun occupies one focus.', 'A circle is the special case e = 0.', 'P is perihelion; A is aphelion.'] }
        : mode === 'areas'
            ? { title: 'Second law: Areas', ref: 'NCERT Eqs. 7.1-7.2', lines: ['Equal areas are swept in equal times.', 'Delta A / Delta t = L / (2m).', 'Gravity is central, so L is conserved.', 'The planet is fastest at perihelion.'] }
            : { title: 'Third law: Periods', ref: 'NCERT Ch 7, Section 7.2', lines: ['T² is proportional to a³.', 'For the Sun: T² = 4pi²a³/(GM_s).', 'a is the semi-major axis.', 'More distant planets take longer to orbit.'] };
    return <div className="rounded-2xl border border-indigo-200 bg-indigo-50/95 p-4 shadow-xl backdrop-blur"><div className="text-base font-extrabold text-indigo-950">{content.title}</div><div className="text-xs font-semibold text-indigo-700">{content.ref}</div><div className="mt-3 space-y-2 text-sm leading-snug text-indigo-950">{content.lines.map(line => <p key={line}>• {line}</p>)}</div></div>;
};

const MetricBar: React.FC<{ label: string; value: number; max: number; color: string; suffix: string }> = ({ label, value, max, color, suffix }) => <div><div className="mb-1 flex justify-between text-xs font-bold text-slate-600"><span>{label}</span><span className="font-mono text-slate-900">{fmt(value)} {suffix}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all" style={{ width: `${clamp(value / max * 100, 0, 100)}%`, backgroundColor: color }} /></div></div>;

const ValueCard: React.FC<{ label: string; value: string; tone: 'violet' | 'slate' | 'amber' | 'cyan' | 'blue' | 'emerald' }> = ({ label, value, tone }) => { const styles = { violet: 'bg-violet-50 text-violet-800', slate: 'bg-slate-50 text-slate-800', amber: 'bg-amber-50 text-amber-800', cyan: 'bg-cyan-50 text-cyan-800', blue: 'bg-blue-50 text-blue-800', emerald: 'bg-emerald-50 text-emerald-800' }; return <div className={`rounded-lg border border-slate-100 px-3 py-2.5 ${styles[tone]}`}><div className="text-xs font-bold uppercase tracking-wide text-slate-600">{label}</div><div className="mt-1 font-mono text-base font-extrabold">{value}</div></div>; };

const ModeButton: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => <button onClick={onClick} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${active ? 'bg-indigo-700 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>{label}</button>;

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; unit: string; accent: string; onChange: (value: number) => void }> = ({ label, value, min, max, step, unit, accent, onChange }) => <label className="rounded-xl border border-slate-200 bg-white p-3"><span className="mb-2 flex justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-600"><span>{label}</span><span className="font-mono text-sm text-slate-900">{fmt(value, step < 0.1 ? 2 : 1)} {unit}</span></span><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className={`h-2 w-full cursor-pointer ${accent}`} /></label>;

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (value: boolean) => void }> = ({ label, checked, onChange }) => <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-3"><span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{label}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-5 w-5 accent-indigo-600" /></label>;

export default KeplersLawsLab;
