import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Focus, Triangle, Layers, Microscope, Eye, Search, Ruler, SlidersHorizontal } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface RayOpticsLabProps {
    topic: any;
    onExit: () => void;
}

type OpticsMode = 'lens' | 'prism' | 'tir' | 'microscope' | 'telescope';
type LensType = 'convex' | 'concave';
type PrismLight = 'mono' | 'white';
type TirMaterialKey = 'water' | 'crown' | 'flint' | 'diamond' | 'custom';

const W = 1280;
const H = 760;
const D_NEAR = 25;
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const TIR_MATERIALS: Record<TirMaterialKey, { name: string; n: number; ic: number }> = {
    water: { name: 'Water', n: 1.33, ic: 48.75 },
    crown: { name: 'Crown glass', n: 1.52, ic: 41.14 },
    flint: { name: 'Dense flint glass', n: 1.62, ic: 37.31 },
    diamond: { name: 'Diamond', n: 2.42, ic: 24.41 },
    custom: { name: 'Custom', n: 1.50, ic: 41.81 },
};

const DISPERSION = [
    { label: 'V', name: 'Violet', n: 1.532, color: '#8b5cf6' },
    { label: 'I', name: 'Indigo', n: 1.528, color: '#4f46e5' },
    { label: 'B', name: 'Blue', n: 1.524, color: '#2563eb' },
    { label: 'G', name: 'Green', n: 1.520, color: '#22c55e' },
    { label: 'Y', name: 'Yellow', n: 1.517, color: '#facc15' },
    { label: 'O', name: 'Orange', n: 1.514, color: '#fb923c' },
    { label: 'R', name: 'Red', n: 1.510, color: '#ef4444' },
];

type LensSnapshot = {
    fSigned: number;
    uSigned: number;
    vSigned: number;
    m: number;
    power: number;
    atInfinity: boolean;
    caseText: string;
    nature: string;
};

type PrismSnapshot = {
    delta: number;
    r1: number;
    r2: number;
    e: number;
    dm: number;
    tirAtSecondFace: boolean;
    minimumDeviationPossible: boolean;
    minimum: boolean;
};

type TirSnapshot = {
    n: number;
    ic: number;
    refractedAngle: number;
    state: 'refraction' | 'critical' | 'tir';
};

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function safeAsin(value: number) {
    return Math.asin(clamp(value, -1, 1));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, size = 9) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.55);
    ctx.lineTo(-size, size * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawArrowOnLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, t: number, color: string, size = 8) {
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    drawArrowHead(ctx, x, y, Math.atan2(y2 - y1, x2 - x1), color, size);
}

function lineToEdge(x: number, y: number, dx: number, dy: number) {
    const candidates: number[] = [];
    if (Math.abs(dx) > 1e-6) {
        candidates.push((W - x) / dx, (0 - x) / dx);
    }
    if (Math.abs(dy) > 1e-6) {
        candidates.push((H - y) / dy, (0 - y) / dy);
    }
    const t = candidates.filter(v => v > 0.001).sort((a, b) => a - b)[0] ?? 0;
    return { x: x + dx * t, y: y + dy * t };
}

function reflectAngle(direction: number, mirrorAngle: number) {
    return 2 * mirrorAngle - direction;
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 2, dash: number[] = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1 + 0.5, y1 + 0.5);
    ctx.lineTo(x2 + 0.5, y2 + 0.5);
    ctx.stroke();
    ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = '#334155', align: CanvasTextAlign = 'center', font = '700 13px Inter, sans-serif') {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

function drawGlowRay(ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>, color: string, width = 3, dash: number[] = []) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(dash);
    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.restore();
}

function computeLens(lensType: LensType, fAbs: number, uAbs: number): LensSnapshot {
    const fSigned = lensType === 'convex' ? fAbs : -fAbs;
    const uSigned = -uAbs;
    const denominator = 1 / fSigned + 1 / uSigned;
    const atInfinity = Math.abs(denominator) < 0.0001;
    const vSigned = atInfinity ? Infinity : 1 / denominator;
    const m = atInfinity ? Infinity : vSigned / uSigned;
    const power = 100 / fSigned;
    let caseText = '';
    if (lensType === 'concave') {
        caseText = 'Concave lens: virtual, erect, diminished image on object side.';
    } else if (uAbs > 2 * fAbs + 1) {
        caseText = 'Object beyond 2F: real, inverted, diminished image between F and 2F.';
    } else if (Math.abs(uAbs - 2 * fAbs) <= 1) {
        caseText = 'Object at 2F: real, inverted, same-size image at 2F.';
    } else if (uAbs > fAbs + 1) {
        caseText = 'Object between F and 2F: real, inverted, magnified image beyond 2F.';
    } else if (Math.abs(uAbs - fAbs) <= 1) {
        caseText = 'Object at F: image at infinity.';
    } else {
        caseText = 'Object between O and F: virtual, erect, magnified image on same side.';
    }
    const nature = atInfinity
        ? 'Image at infinity'
        : `${vSigned > 0 ? 'Real' : 'Virtual'}, ${m < 0 ? 'Inverted' : 'Erect'}, ${Math.abs(m) > 1.05 ? 'Magnified' : Math.abs(m) < 0.95 ? 'Diminished' : 'Same size'}`;
    return { fSigned, uSigned, vSigned, m, power, atInfinity, caseText, nature };
}

function computePrism(angleA: number, incidence: number, n: number): PrismSnapshot {
    const A = angleA * DEG;
    const i = incidence * DEG;
    const r1 = safeAsin(Math.sin(i) / n);
    const r2 = A - r1;
    const exitArg = n * Math.sin(r2);
    const tirAtSecondFace = exitArg > 1;
    const e = tirAtSecondFace ? Number.NaN : safeAsin(exitArg);
    const delta = tirAtSecondFace ? Number.NaN : (i + e - A) * RAD;
    const dmArg = n * Math.sin(A / 2);
    const minimumDeviationPossible = dmArg <= 1;
    const dm = minimumDeviationPossible ? 2 * safeAsin(dmArg) * RAD - angleA : Number.NaN;
    return {
        delta,
        r1: r1 * RAD,
        r2: r2 * RAD,
        e: e * RAD,
        dm,
        tirAtSecondFace,
        minimumDeviationPossible,
        minimum: minimumDeviationPossible && !tirAtSecondFace && Math.abs(incidence - (angleA + dm) / 2) < 1.2,
    };
}

function computeTir(materialKey: TirMaterialKey, customN: number, incidence: number): TirSnapshot {
    const n = materialKey === 'custom' ? customN : TIR_MATERIALS[materialKey].n;
    const ic = Math.asin(1 / n) * RAD;
    const i = incidence;
    const refractedAngle = i >= ic ? 90 : safeAsin(n * Math.sin(i * DEG)) * RAD;
    const state = Math.abs(i - ic) < 0.6 ? 'critical' : i > ic ? 'tir' : 'refraction';
    return { n, ic, refractedAngle, state };
}

const RayOpticsLab: React.FC<RayOpticsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const lastTimeRef = useRef<number>(performance.now());
    const dragRef = useRef(false);

    const [mode, setMode] = useState<OpticsMode>('lens');
    const [lensType, setLensType] = useState<LensType>('convex');
    const [focalLength, setFocalLength] = useState(100);
    const [objectDistance, setObjectDistance] = useState(180);
    const [objectHeight, setObjectHeight] = useState(46);
    const [showLabels, setShowLabels] = useState(true);
    const [showMeasurements, setShowMeasurements] = useState(true);

    const [prismAngle, setPrismAngle] = useState(60);
    const [incidence, setIncidence] = useState(48);
    const [prismN, setPrismN] = useState(1.52);
    const [prismLight, setPrismLight] = useState<PrismLight>('white');

    const [tirMaterial, setTirMaterial] = useState<TirMaterialKey>('crown');
    const [tirAngle, setTirAngle] = useState(50);
    const [customN, setCustomN] = useState(1.5);

    const [foMicro, setFoMicro] = useState(1);
    const [feMicro, setFeMicro] = useState(2);
    const [tubeLength, setTubeLength] = useState(20);
    const [microObjectOffset, setMicroObjectOffset] = useState(0.25);

    const [foTel, setFoTel] = useState(100);
    const [feTel, setFeTel] = useState(5);

    const lensSnapshot = computeLens(lensType, focalLength, objectDistance);
    const prismSnapshot = computePrism(prismAngle, incidence, prismN);
    const tirSnapshot = computeTir(tirMaterial, customN, tirAngle);
    const microMo = tubeLength / foMicro;
    const microMe = D_NEAR / feMicro;
    const microM = microMo * microMe;
    const telescopeM = foTel / feTel;

    const reset = useCallback(() => {
        if (mode === 'lens') {
            setLensType('convex');
            setFocalLength(100);
            setObjectDistance(180);
            setObjectHeight(46);
        } else if (mode === 'prism') {
            setPrismAngle(60);
            setIncidence(48);
            setPrismN(1.52);
            setPrismLight('white');
        } else if (mode === 'tir') {
            setTirMaterial('crown');
            setTirAngle(50);
            setCustomN(1.5);
        } else if (mode === 'microscope') {
            setFoMicro(1);
            setFeMicro(2);
            setTubeLength(20);
            setMicroObjectOffset(0.25);
        } else {
            setFoTel(100);
            setFeTel(5);
        }
    }, [mode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = W;
        canvas.height = H;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const render = (timestamp: number) => {
            const dt = Math.min(timestamp - lastTimeRef.current, 100);
            lastTimeRef.current = timestamp;
            drawBackground(ctx);
            if (mode === 'lens') drawLensMode(ctx, lensType, focalLength, objectDistance, objectHeight, showLabels, showMeasurements);
            if (mode === 'prism') drawPrismMode(ctx, prismAngle, incidence, prismN, prismLight);
            if (mode === 'tir') drawTirMode(ctx, tirMaterial, customN, tirAngle);
            if (mode === 'microscope') drawMicroscopeMode(ctx, foMicro, feMicro, tubeLength, microObjectOffset);
            if (mode === 'telescope') drawTelescopeMode(ctx, foTel, feTel);
            void dt;
            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [mode, lensType, focalLength, objectDistance, objectHeight, showLabels, showMeasurements, prismAngle, incidence, prismN, prismLight, tirMaterial, tirAngle, customN, foMicro, feMicro, tubeLength, microObjectOffset, foTel, feTel]);

    const canvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (W / rect.width),
            y: (event.clientY - rect.top) * (H / rect.height),
        };
    };

    const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (mode !== 'lens') return;
        const { x } = canvasPoint(event);
        const lensX = 640;
        const imageDistanceForScale = lensSnapshot.atInfinity ? 0 : Math.min(Math.abs(lensSnapshot.vSigned), 430);
        const scale = 420 / Math.max(objectDistance, imageDistanceForScale, focalLength * 2, 120);
        const objectX = lensX - objectDistance * scale;
        if (Math.abs(x - objectX) < 55) {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = true;
        }
    };

    const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (mode !== 'lens' || !dragRef.current) return;
        const { x } = canvasPoint(event);
        const imageDistanceForScale = lensSnapshot.atInfinity ? 0 : Math.min(Math.abs(lensSnapshot.vSigned), 430);
        const scale = 420 / Math.max(objectDistance, imageDistanceForScale, focalLength * 2, 120);
        setObjectDistance(clamp(Math.round(((640 - x) / scale) / 5) * 5, 20, 400));
    };

    const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        dragRef.current = false;
    };

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 z-20 hidden w-[380px] 2xl:block">
            <div className="flex flex-col gap-3">
                <GraphCard title={graphTitle(mode)} subtitle={graphSubtitle(mode)}>
                    {mode === 'lens' && <LensCasesSvg lensType={lensType} objectDistance={objectDistance} focalLength={focalLength} />}
                    {mode === 'prism' && <PrismDeviationSvg angleA={prismAngle} n={prismN} incidence={incidence} />}
                    {mode === 'tir' && <TirGraphSvg ic={tirSnapshot.ic} incidence={tirAngle} />}
                    {mode === 'microscope' && <MagnificationSvg fo={foMicro} fe={feMicro} L={tubeLength} />}
                    {mode === 'telescope' && <TelescopeCompareSvg m={telescopeM} />}
                </GraphCard>
                <GraphCard title={secondaryGraphTitle(mode)} subtitle={secondaryGraphSubtitle(mode)}>
                    {mode === 'lens' && <LensPowerSvg f={focalLength} lensType={lensType} />}
                    {mode === 'prism' && <PrismSpectrumSvg mode={prismLight} />}
                    {mode === 'tir' && <TirApplicationsSvg material={tirMaterial} />}
                    {mode === 'microscope' && <MicroscopePathSvg />}
                    {mode === 'telescope' && <TelescopeTubeSvg fo={foTel} fe={feTel} />}
                </GraphCard>
            </div>
        </aside>
    );

    const readouts = getReadouts(mode, lensSnapshot, prismSnapshot, tirSnapshot, {
        focalLength,
        objectDistance,
        prismAngle,
        incidence,
        prismN,
        tirMaterial,
        customN,
        foMicro,
        feMicro,
        tubeLength,
        microMo,
        microMe,
        microM,
        foTel,
        feTel,
        telescopeM,
    });

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 z-20 hidden w-[320px] 2xl:block">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/95 p-4 text-indigo-950 shadow-xl backdrop-blur">
                <div className="text-base font-extrabold">{theoryTitle(mode)}</div>
                <div className="mt-2 space-y-1.5 text-sm leading-snug text-indigo-900">
                    {theoryLines(mode).map(line => <p key={line}>{line}</p>)}
                </div>
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">Live</span>
                </div>
                <div className="grid gap-2">
                    {readouts.map(item => (
                        <div key={item.label} className={`rounded-lg border border-slate-100 ${item.bg} px-3 py-2.5`}>
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
                            <div className={`mt-1 font-mono text-base font-extrabold ${item.color}`}>{item.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );

    const simulationJSX = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className={`absolute inset-0 h-[760px] w-[1280px] touch-none ${mode === 'lens' ? 'cursor-ew-resize' : ''}`}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                />
            </div>
            <button
                type="button"
                onClick={reset}
                className="absolute right-4 top-4 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow transition hover:bg-slate-50"
                title="Reset"
            >
                <RotateCcw size={18} />
            </button>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsJSX = (
        <div className="w-full space-y-4 p-4 text-slate-900">
            <div className="grid gap-2 md:grid-cols-5">
                <TabButton active={mode === 'lens'} onClick={() => setMode('lens')} icon={<Focus size={18} />} label="Lens" />
                <TabButton active={mode === 'prism'} onClick={() => setMode('prism')} icon={<Triangle size={18} />} label="Prism" />
                <TabButton active={mode === 'tir'} onClick={() => setMode('tir')} icon={<Layers size={18} />} label="TIR" />
                <TabButton active={mode === 'microscope'} onClick={() => setMode('microscope')} icon={<Microscope size={18} />} label="Microscope" />
                <TabButton active={mode === 'telescope'} onClick={() => setMode('telescope')} icon={<Eye size={18} />} label="Telescope" />
            </div>

            {mode === 'lens' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                        <Segmented
                            options={[['convex', 'Convex lens'], ['concave', 'Concave lens']]}
                            value={lensType}
                            onChange={value => setLensType(value as LensType)}
                        />
                        <Slider label="Focal Length f" value={`${focalLength} cm`} min={40} max={200} step={10} valueNumber={focalLength} onChange={setFocalLength} />
                        <Slider label="Object Distance |u|" value={`${objectDistance} cm`} min={20} max={400} step={5} valueNumber={objectDistance} onChange={setObjectDistance} />
                    </div>
                    <div className="space-y-3">
                        <Slider label="Object Height h" value={`${objectHeight}`} min={10} max={80} step={5} valueNumber={objectHeight} onChange={setObjectHeight} />
                        <div className="grid grid-cols-2 gap-2">
                            <Toggle active={showLabels} onClick={() => setShowLabels(v => !v)} label="Ray labels" />
                            <Toggle active={showMeasurements} onClick={() => setShowMeasurements(v => !v)} label="Measurements" />
                        </div>
                    </div>
                </div>
            )}

            {mode === 'prism' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Slider label="Prism Angle A" value={`${prismAngle}°`} min={30} max={75} step={5} valueNumber={prismAngle} onChange={setPrismAngle} />
                    <Slider label="Angle of Incidence i" value={`${incidence}°`} min={20} max={80} step={1} valueNumber={incidence} onChange={setIncidence} />
                    <Slider label="Refractive Index n" value={prismN.toFixed(2)} min={1.3} max={1.8} step={0.02} valueNumber={prismN} onChange={setPrismN} />
                    <Segmented options={[['mono', 'Monochromatic'], ['white', 'White light']]} value={prismLight} onChange={value => setPrismLight(value as PrismLight)} />
                </div>
            )}

            {mode === 'tir' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Material</label>
                        <select value={tirMaterial} onChange={event => setTirMaterial(event.target.value as TirMaterialKey)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
                            {Object.entries(TIR_MATERIALS).map(([key, item]) => <option key={key} value={key}>{item.name} (n={item.n})</option>)}
                        </select>
                    </div>
                    <Slider label="Angle of Incidence i" value={`${tirAngle}°`} min={0} max={90} step={1} valueNumber={tirAngle} onChange={setTirAngle} />
                    {tirMaterial === 'custom' && <Slider label="Custom refractive index n" value={customN.toFixed(2)} min={1.1} max={3} step={0.05} valueNumber={customN} onChange={setCustomN} />}
                </div>
            )}

            {mode === 'microscope' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Slider label="Objective focal length fo" value={`${foMicro.toFixed(1)} cm`} min={0.5} max={3} step={0.1} valueNumber={foMicro} onChange={setFoMicro} />
                    <Slider label="Eyepiece focal length fe" value={`${feMicro.toFixed(1)} cm`} min={1} max={5} step={0.5} valueNumber={feMicro} onChange={setFeMicro} />
                    <Slider label="Tube length L" value={`${tubeLength} cm`} min={10} max={30} step={1} valueNumber={tubeLength} onChange={setTubeLength} />
                    <Slider label="Object fine adjustment" value={`fo + ${microObjectOffset.toFixed(2)} cm`} min={0.05} max={1.2} step={0.05} valueNumber={microObjectOffset} onChange={setMicroObjectOffset} />
                </div>
            )}

            {mode === 'telescope' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Slider label="Objective focal length fo" value={`${foTel} cm`} min={20} max={200} step={10} valueNumber={foTel} onChange={setFoTel} />
                    <Slider label="Eyepiece focal length fe" value={`${feTel} cm`} min={1} max={20} step={1} valueNumber={feTel} onChange={setFeTel} />
                </div>
            )}
        </div>
    );

    return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationJSX} ControlsComponent={controlsJSX} />;
};

function drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(15,23,42,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) drawLine(ctx, x, 0, x, H, 'rgba(15,23,42,0.06)', 1);
    for (let y = 0; y <= H; y += 40) drawLine(ctx, 0, y, W, y, 'rgba(15,23,42,0.06)', 1);
}

function drawCanvasTitle(ctx: CanvasRenderingContext2D, title: string, subtitle: string) {
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, 278, 18, 724, 58, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawLabel(ctx, title, 640, 40, '#0f172a', 'center', '900 18px Inter, sans-serif');
    drawLabel(ctx, subtitle, 640, 62, '#334155', 'center', '800 12px Inter, monospace');
}

function drawDataBar(ctx: CanvasRenderingContext2D, items: Array<{ label: string; value: string; color: string }>) {
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    roundRect(ctx, 36, 654, 1208, 74, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,0.14)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const step = 1208 / items.length;
    items.forEach((item, index) => {
        const x = 36 + step * index + step / 2;
        if (index > 0) drawLine(ctx, 36 + step * index, 666, 36 + step * index, 714, 'rgba(15,23,42,0.14)', 1);
        drawLabel(ctx, item.label, x, 680, '#475569', 'center', '900 10px Inter, sans-serif');
        drawLabel(ctx, item.value, x, 704, item.color, 'center', '900 14px Inter, monospace');
    });
}

function drawLensMode(ctx: CanvasRenderingContext2D, lensType: LensType, fAbs: number, uAbs: number, hObj: number, labels: boolean, measurements: boolean) {
    const snap = computeLens(lensType, fAbs, uAbs);
    const cx = 640;
    const cy = 365;
    const imageDistanceForScale = snap.atInfinity ? 0 : Math.min(Math.abs(snap.vSigned), 430);
    const scale = 420 / Math.max(uAbs, imageDistanceForScale, fAbs * 2, 130);
    const px = (cm: number) => cx + cm * scale;
    const objX = px(-uAbs);
    const objH = hObj * 1.45;
    const objTop = cy - objH;
    const vClamped = snap.atInfinity ? 520 : clamp(snap.vSigned, -430 / scale, 430 / scale);
    const imgX = px(vClamped);
    const imgH = snap.atInfinity ? 0 : clamp(objH * snap.m, -210, 210);
    const imgTop = cy - imgH;
    const f1 = px(-fAbs);
    const f2 = px(fAbs);
    const f12 = px(-2 * fAbs);
    const f22 = px(2 * fAbs);
    const lensH = 185;

    drawCanvasTitle(ctx, `${lensType === 'convex' ? 'Convex' : 'Concave'} Lens Ray Diagram`, '1/v − 1/u = 1/f  |  m = v/u  |  P = 1/f');
    drawLine(ctx, 70, cy, 1210, cy, '#475569', 1.6, [8, 8]);
    [f12, f1, f2, f22].forEach((x, i) => {
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(x, cy, i === 1 || i === 2 ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
    });
    if (labels) {
        drawLabel(ctx, '2F₁', f12, cy + 26, '#0e7490');
        drawLabel(ctx, 'F₁', f1, cy + 26, '#0e7490');
        drawLabel(ctx, 'O', cx - 16, cy + 26, '#334155');
        drawLabel(ctx, 'F₂', f2, cy + 26, '#0e7490');
        drawLabel(ctx, '2F₂', f22, cy + 26, '#0e7490');
    }

    const gradient = ctx.createLinearGradient(cx - 22, cy - lensH, cx + 22, cy + lensH);
    gradient.addColorStop(0, 'rgba(56,189,248,0.08)');
    gradient.addColorStop(0.5, 'rgba(56,189,248,0.24)');
    gradient.addColorStop(1, 'rgba(56,189,248,0.08)');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (lensType === 'convex') {
        ctx.ellipse(cx, cy, 22, lensH, 0, 0, Math.PI * 2);
    } else {
        ctx.moveTo(cx - 22, cy - lensH);
        ctx.quadraticCurveTo(cx + 14, cy, cx - 22, cy + lensH);
        ctx.lineTo(cx + 22, cy + lensH);
        ctx.quadraticCurveTo(cx - 14, cy, cx + 22, cy - lensH);
        ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    const ray1End = lensType === 'convex'
        ? lineToEdge(cx, objTop, f2 - cx, cy - objTop)
        : lineToEdge(cx, objTop, cx - f1, objTop - cy);
    drawGlowRay(ctx, [{ x: objX, y: objTop }, { x: cx, y: objTop }, ray1End], '#ef4444', 3);
    drawArrowOnLine(ctx, objX, objTop, cx, objTop, 0.55, '#ef4444');
    drawArrowOnLine(ctx, cx, objTop, ray1End.x, ray1End.y, 0.28, '#ef4444');
    if (lensType === 'concave') drawGlowRay(ctx, [{ x: cx, y: objTop }, { x: f1, y: cy }], 'rgba(239,68,68,0.35)', 2, [6, 6]);

    const centerEnd = lineToEdge(objX, objTop, cx - objX, cy - objTop);
    drawGlowRay(ctx, [{ x: objX, y: objTop }, centerEnd], '#10b981', 3);
    drawArrowOnLine(ctx, objX, objTop, centerEnd.x, centerEnd.y, 0.44, '#10b981');

    const focusDenominator = lensType === 'convex' ? f1 - objX : f2 - objX;
    const lensHitY = Math.abs(focusDenominator) < 0.001
        ? null
        : objTop + ((cx - objX) / focusDenominator) * (cy - objTop);
    if (lensHitY !== null && Math.abs(lensHitY - cy) < 250) {
        const r3End = lineToEdge(cx, lensHitY, 1, 0);
        drawGlowRay(ctx, [{ x: objX, y: objTop }, { x: cx, y: lensHitY }, r3End], '#3b82f6', 3);
        drawArrowOnLine(ctx, objX, objTop, cx, lensHitY, 0.5, '#3b82f6');
        drawArrowOnLine(ctx, cx, lensHitY, r3End.x, r3End.y, 0.28, '#3b82f6');
    }

    if (!snap.atInfinity && snap.vSigned < 0) {
        drawGlowRay(ctx, [{ x: cx, y: objTop }, { x: imgX, y: imgTop }], 'rgba(239,68,68,0.35)', 2, [7, 6]);
        drawGlowRay(ctx, [{ x: cx, y: cy }, { x: imgX, y: imgTop }], 'rgba(16,185,129,0.35)', 2, [7, 6]);
        if (lensHitY !== null) drawGlowRay(ctx, [{ x: cx, y: lensHitY }, { x: imgX, y: imgTop }], 'rgba(59,130,246,0.35)', 2, [7, 6]);
    }

    drawArrowObject(ctx, objX, cy, objH, '#22c55e', 'Ob');
    if (!snap.atInfinity) drawArrowObject(ctx, imgX, cy, imgH, snap.vSigned > 0 ? '#d946ef' : '#a855f7', 'I', snap.vSigned < 0);

    if (labels) {
        drawLabel(ctx, snap.caseText, 640, 104, '#92400e', 'center', '900 16px Inter, sans-serif');
        drawLabel(ctx, 'Ray 1: parallel → focus', 88, 124, '#ef4444', 'left');
        drawLabel(ctx, 'Ray 2: through O undeviated', 88, 148, '#10b981', 'left');
        drawLabel(ctx, snap.atInfinity ? 'At F: refracted rays are parallel' : 'Ray 3: through/towards focus -> parallel', 88, 172, '#3b82f6', 'left');
        if (snap.atInfinity) drawLabel(ctx, 'Image at infinity', 1032, 132, '#a21caf', 'left', '900 18px Inter, sans-serif');
    }

    if (measurements) {
        drawDimension(ctx, objX, cx, cy + 78, 'u');
        if (!snap.atInfinity) drawDimension(ctx, cx, imgX, cy + 108, 'v');
        drawDimension(ctx, cx, lensType === 'convex' ? f2 : f1, cy + 138, 'f');
    }

    drawDataBar(ctx, [
        { label: 'u', value: `${snap.uSigned.toFixed(0)} cm`, color: '#22c55e' },
        { label: 'v', value: snap.atInfinity ? '∞' : `${snap.vSigned.toFixed(1)} cm`, color: '#d946ef' },
        { label: 'm', value: snap.atInfinity ? '∞' : snap.m.toFixed(2), color: '#38bdf8' },
        { label: 'f', value: `${snap.fSigned.toFixed(0)} cm`, color: '#ca8a04' },
        { label: 'P', value: `${snap.power.toFixed(2)} D`, color: '#fb923c' },
        { label: 'Image', value: snap.nature, color: '#334155' },
    ]);
}

function drawArrowObject(ctx: CanvasRenderingContext2D, x: number, axisY: number, height: number, color: string, label: string, dashed = false) {
    ctx.save();
    if (dashed) ctx.setLineDash([8, 8]);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, axisY);
    ctx.lineTo(x, axisY - height);
    ctx.stroke();
    drawArrowHead(ctx, x, axisY - height, height >= 0 ? -Math.PI / 2 : Math.PI / 2, color, 12);
    ctx.restore();
    drawLabel(ctx, label, x, axisY + (height >= 0 ? 24 : -24), color, 'center', '900 14px Inter, sans-serif');
}

function drawDimension(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, label: string) {
    drawLine(ctx, x1, y - 10, x1, y + 10, '#64748b', 1);
    drawLine(ctx, x2, y - 10, x2, y + 10, '#64748b', 1);
    drawLine(ctx, x1, y, x2, y, '#64748b', 1);
    drawArrowOnLine(ctx, (x1 + x2) / 2, y, x1, y, 0.9, '#64748b', 6);
    drawArrowOnLine(ctx, (x1 + x2) / 2, y, x2, y, 0.9, '#64748b', 6);
    drawLabel(ctx, label, (x1 + x2) / 2, y - 14, '#334155');
}

function drawPrismMode(ctx: CanvasRenderingContext2D, angleA: number, incidence: number, n: number, light: PrismLight) {
    const snap = computePrism(angleA, incidence, n);
    drawCanvasTitle(ctx, 'Refraction Through A Prism', 'r₁ + r₂ = A  |  δ = i + e − A  |  n = sin[(A + Dm)/2] / sin(A/2)');
    const apex = { x: 650, y: 160 };
    const left = { x: 440, y: 525 };
    const right = { x: 860, y: 525 };
    ctx.fillStyle = 'rgba(56,189,248,0.08)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(apex.x, apex.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(left.x, left.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawLabel(ctx, `A = ${angleA}°`, apex.x, apex.y - 22, '#0e7490', 'center', '900 15px Inter, sans-serif');

    const hit1 = { x: 512, y: 400 };
    const face1Angle = -60 * DEG;
    const normal1 = face1Angle - Math.PI / 2;
    const incDir = normal1 + incidence * DEG;
    const start = { x: hit1.x - Math.cos(incDir) * 260, y: hit1.y - Math.sin(incDir) * 260 };
    const internalAngle = normal1 + snap.r1 * DEG;
    const hit2 = { x: 744, y: 365 + (snap.r2 - angleA / 2) * 1.5 };
    const face2Angle = 60 * DEG;
    const normal2 = face2Angle + Math.PI / 2;

    drawLine(ctx, hit1.x - Math.cos(normal1) * 62, hit1.y - Math.sin(normal1) * 62, hit1.x + Math.cos(normal1) * 62, hit1.y + Math.sin(normal1) * 62, '#64748b', 1.3, [5, 5]);
    drawLine(ctx, hit2.x - Math.cos(normal2) * 62, hit2.y - Math.sin(normal2) * 62, hit2.x + Math.cos(normal2) * 62, hit2.y + Math.sin(normal2) * 62, '#64748b', 1.3, [5, 5]);
    drawGlowRay(ctx, [start, hit1], light === 'white' ? '#f59e0b' : '#ca8a04', 4);
    drawArrowOnLine(ctx, start.x, start.y, hit1.x, hit1.y, 0.64, light === 'white' ? '#f59e0b' : '#ca8a04', 10);

    const colors = light === 'white' ? DISPERSION : [{ label: '', name: 'Mono', n, color: '#ca8a04' }];
    colors.forEach((band, index) => {
        const bandSnap = computePrism(angleA, incidence, band.n);
        const r1Dir = normal1 + bandSnap.r1 * DEG;
        const r2Hit = { x: hit2.x, y: hit2.y + (index - 3) * (light === 'white' ? 6 : 0) };
        drawGlowRay(ctx, [hit1, { x: hit1.x + Math.cos(r1Dir) * 140, y: hit1.y + Math.sin(r1Dir) * 140 }, r2Hit], light === 'white' ? `${band.color}cc` : band.color, 2.7);
        if (bandSnap.tirAtSecondFace) {
            const reflectedDirection = reflectAngle(r1Dir, face2Angle);
            const reflectedEnd = {
                x: r2Hit.x + Math.cos(reflectedDirection) * 230,
                y: r2Hit.y + Math.sin(reflectedDirection) * 230,
            };
            drawGlowRay(ctx, [r2Hit, reflectedEnd], light === 'white' ? band.color : '#be123c', light === 'white' ? 2.4 : 4, light === 'white' ? [] : [7, 5]);
            drawArrowOnLine(ctx, r2Hit.x, r2Hit.y, reflectedEnd.x, reflectedEnd.y, 0.35, light === 'white' ? band.color : '#be123c', 8);
        } else {
            const eDirection = normal2 + (Math.PI - bandSnap.e * DEG) + (index - 3) * (light === 'white' ? 0.006 : 0);
            const end = lineToEdge(r2Hit.x, r2Hit.y, Math.cos(eDirection), Math.sin(eDirection));
            drawGlowRay(ctx, [r2Hit, end], light === 'white' ? band.color : '#ca8a04', light === 'white' ? 2.6 : 4);
            drawArrowOnLine(ctx, r2Hit.x, r2Hit.y, end.x, end.y, 0.28, light === 'white' ? band.color : '#ca8a04', 8);
            if (light === 'white') drawLabel(ctx, band.label, end.x - 24, end.y, band.color, 'center', '900 14px Inter, sans-serif');
        }
    });

    drawAngleArc(ctx, hit1.x, hit1.y, normal1, incDir, 52, `i=${incidence}°`, '#ca8a04');
    drawAngleArc(ctx, hit1.x, hit1.y, normal1, internalAngle, 36, `r₁=${snap.r1.toFixed(1)}°`, '#0e7490');
    if (snap.tirAtSecondFace) {
        const critical = Math.asin(1 / n) * RAD;
        drawAngleArc(ctx, hit2.x, hit2.y, normal2, normal2 + Math.PI / 2, 50, `r2=${snap.r2.toFixed(1)}° > ic=${critical.toFixed(1)}°`, '#be123c');
        drawLabel(ctx, 'No emergent ray', 920, 184, '#be123c', 'left', '900 18px Inter, sans-serif');
        drawLabel(ctx, 'Total internal reflection at second face', 920, 214, '#be123c', 'left', '800 14px Inter, sans-serif');
    } else {
        drawAngleArc(ctx, hit2.x, hit2.y, normal2, normal2 + (Math.PI - snap.e * DEG), 50, `e=${snap.e.toFixed(1)}°`, '#ca8a04');
        drawLabel(ctx, `δ = ${snap.delta.toFixed(1)}°`, 920, 184, '#ca8a04', 'left', '900 18px Inter, sans-serif');
        drawLabel(ctx, snap.minimumDeviationPossible ? `Dm = ${snap.dm.toFixed(1)}° ${snap.minimum ? '(minimum)' : ''}` : 'Dm unavailable for this A,n', 920, 214, snap.minimum ? '#15803d' : '#334155', 'left', '800 14px Inter, sans-serif');
    }
    drawDataBar(ctx, [
        { label: 'i', value: `${incidence}°`, color: '#ca8a04' },
        { label: 'r1', value: `${snap.r1.toFixed(1)}°`, color: '#0e7490' },
        { label: 'r2', value: `${snap.r2.toFixed(1)}°`, color: '#0e7490' },
        { label: 'e', value: snap.tirAtSecondFace ? 'TIR' : `${snap.e.toFixed(1)}°`, color: '#ca8a04' },
        { label: 'δ', value: snap.tirAtSecondFace ? '--' : `${snap.delta.toFixed(1)}°`, color: '#fb923c' },
        { label: 'Condition', value: snap.tirAtSecondFace ? 'TIR: no emergent ray' : snap.minimum ? 'At minimum deviation' : 'General deviation', color: snap.tirAtSecondFace ? '#be123c' : snap.minimum ? '#15803d' : '#334155' },
    ]);
}

function drawAngleArc(ctx: CanvasRenderingContext2D, x: number, y: number, a1: number, a2: number, r: number, label: string, color: string) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.min(a1, a2), Math.max(a1, a2));
    ctx.stroke();
    const mid = (a1 + a2) / 2;
    drawLabel(ctx, label, x + Math.cos(mid) * (r + 22), y + Math.sin(mid) * (r + 22), color, 'center', '800 11px Inter, sans-serif');
    ctx.restore();
}

function drawTirMode(ctx: CanvasRenderingContext2D, material: TirMaterialKey, customN: number, incidence: number) {
    const snap = computeTir(material, customN, incidence);
    drawCanvasTitle(ctx, 'Total Internal Reflection', 'sin ic = 1/n  |  i > ic ⇒ no refracted ray');
    const interfaceY = 360;
    ctx.fillStyle = 'rgba(59,130,246,0.14)';
    ctx.fillRect(0, interfaceY, W, H - interfaceY);
    ctx.fillStyle = 'rgba(241,245,249,0.86)';
    ctx.fillRect(0, 78, W, interfaceY - 78);
    drawLine(ctx, 80, interfaceY, 1200, interfaceY, '#334155', 3);
    const hit = { x: 640, y: interfaceY };
    drawLine(ctx, hit.x, 130, hit.x, 600, '#64748b', 1.5, [8, 8]);
    drawLabel(ctx, 'Rarer medium (air)', 180, 150, '#334155', 'left', '900 15px Inter, sans-serif');
    drawLabel(ctx, `Denser medium: ${material === 'custom' ? 'Custom' : TIR_MATERIALS[material].name}  n=${snap.n.toFixed(2)}`, 180, 570, '#1d4ed8', 'left', '900 15px Inter, sans-serif');

    const rayLen = 240;
    const theta = (90 - incidence) * DEG;
    const start = { x: hit.x - Math.cos(theta) * rayLen, y: hit.y + Math.sin(theta) * rayLen };
    drawGlowRay(ctx, [start, hit], '#ca8a04', 4);
    drawArrowOnLine(ctx, start.x, start.y, hit.x, hit.y, 0.64, '#ca8a04', 10);
    const refl = { x: hit.x + Math.cos(theta) * 260, y: hit.y + Math.sin(theta) * 260 };
    drawGlowRay(ctx, [hit, refl], '#fb923c', 3.5);
    drawArrowOnLine(ctx, hit.x, hit.y, refl.x, refl.y, 0.34, '#fb923c', 9);
    if (snap.state === 'refraction') {
        const rTheta = (90 - snap.refractedAngle) * DEG;
        const refr = { x: hit.x + Math.cos(rTheta) * 360, y: hit.y - Math.sin(rTheta) * 360 };
        drawGlowRay(ctx, [hit, refr], '#22c55e', 3.5);
        drawArrowOnLine(ctx, hit.x, hit.y, refr.x, refr.y, 0.3, '#22c55e', 9);
    } else if (snap.state === 'critical') {
        drawGlowRay(ctx, [hit, { x: 1010, y: interfaceY }], '#22c55e', 4);
        drawLabel(ctx, 'Critical Angle!', 820, interfaceY - 28, '#22c55e', 'center', '900 18px Inter, sans-serif');
    } else {
        drawLabel(ctx, 'TOTAL INTERNAL REFLECTION', 640, 196, '#fb7185', 'center', '900 24px Inter, sans-serif');
    }
    drawAngleArc(ctx, hit.x, hit.y, Math.PI / 2, Math.PI / 2 + incidence * DEG, 62, `i=${incidence}°`, '#ca8a04');
    if (snap.state !== 'tir') drawAngleArc(ctx, hit.x, hit.y, -Math.PI / 2, -Math.PI / 2 + snap.refractedAngle * DEG, 82, `r=${snap.refractedAngle.toFixed(1)}°`, '#22c55e');
    drawLabel(ctx, `sin ic = 1/n = ${(1 / snap.n).toFixed(3)}  ⇒  ic = ${snap.ic.toFixed(2)}°`, 640, 116, '#0f172a', 'center', '900 17px Inter, monospace');
    drawDataBar(ctx, [
        { label: 'n denser', value: snap.n.toFixed(2), color: '#1d4ed8' },
        { label: 'Critical angle ic', value: `${snap.ic.toFixed(2)}°`, color: '#ca8a04' },
        { label: 'Incident angle i', value: `${incidence}°`, color: '#fb923c' },
        { label: 'Refracted angle r', value: snap.state === 'tir' ? 'No ray' : `${snap.refractedAngle.toFixed(1)}°`, color: '#22c55e' },
        { label: 'State', value: snap.state === 'tir' ? 'TIR' : snap.state === 'critical' ? 'Critical' : 'Refraction + reflection', color: snap.state === 'tir' ? '#be123c' : '#334155' },
    ]);
}

function drawMicroscopeMode(ctx: CanvasRenderingContext2D, fo: number, fe: number, L: number, offset: number) {
    drawCanvasTitle(ctx, 'Compound Microscope', 'm = (L/fo)(D/fe) for final image at infinity  |  D = 25 cm');
    const objLensX = 360;
    const eyeLensX = 860;
    const axisY = 360;
    drawLine(ctx, 96, axisY, 1160, axisY, '#475569', 1.6, [8, 8]);
    drawThinLens(ctx, objLensX, axisY, 150, '#22d3ee', 'Objective');
    drawThinLens(ctx, eyeLensX, axisY, 190, '#a78bfa', 'Eyepiece');
    const s = 54;
    const objectX = objLensX - (fo + offset) * s;
    const objectH = 28;
    const intermediateX = eyeLensX - fe * s * 0.85;
    const intermediateH = -objectH * (L / fo) * 0.12;
    const finalX = 145;
    const finalH = intermediateH * (D_NEAR / fe) * 0.18;
    drawArrowObject(ctx, objectX, axisY, objectH, '#22c55e', 'Object');
    drawArrowObject(ctx, intermediateX, axisY, intermediateH, '#f97316', 'I₁');
    drawArrowObject(ctx, finalX, axisY, finalH, '#d946ef', 'Final virtual', true);
    drawGlowRay(ctx, [{ x: objectX, y: axisY - objectH }, { x: objLensX, y: axisY - objectH }, { x: intermediateX, y: axisY - intermediateH }], '#ef4444', 3);
    drawGlowRay(ctx, [{ x: objectX, y: axisY - objectH }, { x: objLensX, y: axisY }, { x: intermediateX, y: axisY - intermediateH }], '#ef4444', 3);
    drawGlowRay(ctx, [{ x: intermediateX, y: axisY - intermediateH }, { x: eyeLensX, y: axisY - intermediateH }, { x: 1130, y: axisY - intermediateH - 60 }], '#3b82f6', 3);
    drawGlowRay(ctx, [{ x: eyeLensX, y: axisY - intermediateH }, { x: finalX, y: axisY - finalH }], 'rgba(217,70,239,0.45)', 2, [8, 7]);
    drawFocalMarks(ctx, objLensX, axisY, fo * s, 'Fo', '#22d3ee');
    drawFocalMarks(ctx, eyeLensX, axisY, fe * s, 'Fe', '#a78bfa');
    drawDimension(ctx, objLensX + fo * s, eyeLensX - fe * s, 570, 'L');
    drawLabel(ctx, 'Objective: small fo, small aperture', objLensX, 154, '#0e7490');
    drawLabel(ctx, 'Eyepiece acts as simple magnifier', eyeLensX, 132, '#7c3aed');
    drawDataBar(ctx, [
        { label: 'fo', value: `${fo.toFixed(1)} cm`, color: '#0e7490' },
        { label: 'fe', value: `${fe.toFixed(1)} cm`, color: '#7c3aed' },
        { label: 'L', value: `${L} cm`, color: '#ca8a04' },
        { label: 'mo', value: `${(L / fo).toFixed(1)}×`, color: '#fb923c' },
        { label: 'me', value: `${(D_NEAR / fe).toFixed(1)}×`, color: '#2563eb' },
        { label: 'm total', value: `${((L / fo) * (D_NEAR / fe)).toFixed(0)}×`, color: '#d946ef' },
    ]);
}

function drawTelescopeMode(ctx: CanvasRenderingContext2D, fo: number, fe: number) {
    drawCanvasTitle(ctx, 'Astronomical Telescope', 'm = β/α = fo/fe  |  Tube length = fo + fe (normal adjustment)');
    const objLensX = 355;
    const eyeLensX = 895;
    const axisY = 365;
    const m = fo / fe;
    drawLine(ctx, 80, axisY, 1180, axisY, '#475569', 1.6, [8, 8]);
    drawThinLens(ctx, objLensX, axisY, 220, '#22d3ee', 'Large objective');
    drawThinLens(ctx, eyeLensX, axisY, 150, '#a78bfa', 'Eyepiece');
    const imageX = objLensX + 330;
    const imageH = -36;
    const incomingSlope = -0.12;
    for (let k = -2; k <= 2; k++) {
        const y = axisY - 85 + k * 42;
        drawGlowRay(ctx, [{ x: 95, y }, { x: objLensX, y: y + incomingSlope * (objLensX - 95) }, { x: imageX, y: axisY - imageH }], '#ca8a04', 2.6);
    }
    drawArrowObject(ctx, imageX, axisY, imageH, '#f97316', 'I₁');
    drawGlowRay(ctx, [{ x: imageX, y: axisY - imageH }, { x: eyeLensX, y: axisY - imageH }, { x: 1160, y: axisY - imageH - 120 }], '#3b82f6', 3);
    drawGlowRay(ctx, [{ x: imageX, y: axisY }, { x: eyeLensX, y: axisY }, { x: 1160, y: axisY - 64 }], '#3b82f6', 3);
    drawLabel(ctx, 'α', objLensX - 75, axisY - 55, '#ca8a04', 'center', '900 18px Inter, sans-serif');
    drawLabel(ctx, 'β', 1088, axisY - 92, '#2563eb', 'center', '900 18px Inter, sans-serif');
    drawLabel(ctx, 'Eye', 1150, axisY + 80, '#334155');
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(1150, axisY + 40, 22, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawDimension(ctx, objLensX, eyeLensX, 586, 'tube length = fo + fe');
    drawDataBar(ctx, [
        { label: 'fo', value: `${fo} cm`, color: '#0e7490' },
        { label: 'fe', value: `${fe} cm`, color: '#7c3aed' },
        { label: 'm', value: `${m.toFixed(1)}×`, color: '#ca8a04' },
        { label: 'Tube length', value: `${fo + fe} cm`, color: '#fb923c' },
        { label: 'Objective', value: 'Large aperture', color: '#1d4ed8' },
        { label: 'Final image', value: 'At infinity', color: '#334155' },
    ]);
}

function drawThinLens(ctx: CanvasRenderingContext2D, x: number, y: number, halfH: number, color: string, label: string) {
    ctx.save();
    ctx.fillStyle = color.replace(')', ',0.16)');
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, 18, halfH, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawLabel(ctx, label, x, y + halfH + 24, color, 'center', '900 13px Inter, sans-serif');
}

function drawFocalMarks(ctx: CanvasRenderingContext2D, x: number, y: number, fPx: number, label: string, color: string) {
    [x - fPx, x + fPx].forEach((fx, index) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(fx, y, 4, 0, Math.PI * 2);
        ctx.fill();
        drawLabel(ctx, `${label}${index === 0 ? '₁' : '₂'}`, fx, y + 22, color, 'center', '800 11px Inter, sans-serif');
    });
}

function GraphCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
            <div className="mb-2">
                <div className="text-lg font-extrabold text-slate-950">{title}</div>
                <div className="mt-1 text-sm font-semibold text-slate-600">{subtitle}</div>
            </div>
            {children}
        </div>
    );
}

function LensCasesSvg({ lensType, objectDistance, focalLength }: { lensType: LensType; objectDistance: number; focalLength: number }) {
    const x = lensType === 'concave' ? 64 : clamp((objectDistance / (3 * focalLength)) * 300, 22, 300);
    return (
        <svg viewBox="0 0 340 220" className="h-[230px] w-full">
            <line x1="22" y1="112" x2="318" y2="112" stroke="#475569" strokeWidth="2" />
            {[1, 2].map(k => <g key={k}><circle cx={170 - k * 55} cy="112" r="4" fill="#22d3ee" /><circle cx={170 + k * 55} cy="112" r="4" fill="#22d3ee" /></g>)}
            <line x1="170" y1="30" x2="170" y2="190" stroke="#22d3ee" strokeWidth="3" />
            <line x1={170 - x} y1="112" x2={170 - x} y2="62" stroke="#22c55e" strokeWidth="5" />
            <polygon points={`${170 - x},56 ${162 - x},70 ${178 - x},70`} fill="#22c55e" />
            <text x="170" y="210" textAnchor="middle" className="fill-slate-600 text-[11px]">Focal markers and current object position</text>
        </svg>
    );
}

function LensPowerSvg({ f, lensType }: { f: number; lensType: LensType }) {
    const power = 100 / (lensType === 'convex' ? f : -f);
    return (
        <svg viewBox="0 0 340 160" className="h-[180px] w-full">
            <text x="20" y="34" className="fill-slate-950 text-[18px] font-black">P = 1/f</text>
            <text x="20" y="68" className="fill-slate-700 text-[13px]">f in metres, unit = dioptre (D)</text>
            <rect x="20" y="92" width="300" height="30" rx="15" fill="#e2e8f0" />
            <rect x={power > 0 ? 170 : 170 + power * 20} y="92" width={Math.abs(power) * 20} height="30" rx="15" fill={power > 0 ? '#22c55e' : '#fb7185'} />
            <line x1="170" y1="84" x2="170" y2="132" stroke="#0f172a" strokeWidth="2" />
            <text x="170" y="150" textAnchor="middle" className="fill-slate-700 text-[12px]">{power.toFixed(2)} D</text>
        </svg>
    );
}

function PrismDeviationSvg({ angleA, n, incidence }: { angleA: number; n: number; incidence: number }) {
    const points = Array.from({ length: 61 }, (_, i) => {
        const inc = 20 + i;
        const p = computePrism(angleA, inc, n);
        return { inc, d: p.delta, tir: p.tirAtSecondFace };
    });
    const validPoints = points.filter(p => !p.tir && Number.isFinite(p.d));
    const minD = validPoints.length ? Math.min(...validPoints.map(p => p.d)) : 0;
    const maxD = validPoints.length ? Math.max(...validPoints.map(p => p.d)) : 1;
    const path = validPoints.map((p, i) => `${i ? 'L' : 'M'} ${28 + ((p.inc - 20) / 60) * 280} ${176 - ((p.d - minD) / Math.max(1, maxD - minD)) * 132}`).join(' ');
    const curr = computePrism(angleA, incidence, n);
    const cx = 28 + ((incidence - 20) / 60) * 280;
    const cy = curr.tirAtSecondFace || !Number.isFinite(curr.delta) ? 42 : 176 - ((curr.delta - minD) / Math.max(1, maxD - minD)) * 132;
    return <svg viewBox="0 0 340 220" className="h-[230px] w-full"><path d="M28 28V176H316" stroke="#475569" fill="none" /><path d={path} stroke="#ca8a04" strokeWidth="3" fill="none" />{curr.tirAtSecondFace && <rect x="28" y="28" width="288" height="30" fill="rgba(190,18,60,0.10)" />}{curr.tirAtSecondFace ? <><circle cx={cx} cy={cy} r="6" fill="#be123c" /><text x={cx} y="24" textAnchor="middle" className="fill-rose-700 text-[11px] font-bold">TIR</text></> : <circle cx={cx} cy={cy} r="6" fill="#0f172a" />}<text x="170" y="210" textAnchor="middle" className="fill-slate-700 text-[12px]">Deviation δ vs incidence i</text></svg>;
}

function PrismSpectrumSvg({ mode }: { mode: PrismLight }) {
    return <svg viewBox="0 0 340 160" className="h-[180px] w-full"><text x="20" y="28" className="fill-slate-950 text-[15px] font-bold">{mode === 'white' ? 'VIBGYOR dispersion' : 'Monochromatic ray'}</text>{DISPERSION.map((b, i) => <g key={b.label}><line x1="40" y1={60 + i * 11} x2="300" y2={42 + i * 14} stroke={mode === 'white' ? b.color : '#ca8a04'} strokeWidth="3" /><text x="310" y={46 + i * 14} className="fill-slate-700 text-[10px]">{mode === 'white' ? b.label : ''}</text></g>)}</svg>;
}

function TirGraphSvg({ ic, incidence }: { ic: number; incidence: number }) {
    const x = 30 + (incidence / 90) * 280;
    const icX = 30 + (ic / 90) * 280;
    return <svg viewBox="0 0 340 220" className="h-[230px] w-full"><path d="M30 30V176H318" stroke="#475569" fill="none" /><rect x={icX} y="30" width={318 - icX} height="146" fill="rgba(251,113,133,0.14)" /><line x1={icX} y1="30" x2={icX} y2="176" stroke="#be123c" strokeDasharray="6 6" /><circle cx={x} cy="98" r="7" fill={incidence > ic ? '#be123c' : '#15803d'} /><text x={icX} y="200" textAnchor="middle" className="fill-rose-700 text-[12px]">ic</text><text x="168" y="18" textAnchor="middle" className="fill-slate-700 text-[12px]">TIR region begins at critical angle</text></svg>;
}

function TirApplicationsSvg({ material }: { material: TirMaterialKey }) {
    return <svg viewBox="0 0 340 180" className="h-[190px] w-full"><text x="20" y="28" className="fill-slate-950 text-[15px] font-black">NCERT applications</text><text x="20" y="62" className="fill-slate-700 text-[13px]">• TIR prisms: 90° or 180° deviation</text><text x="20" y="92" className="fill-slate-700 text-[13px]">• Optical fibres: repeated TIR</text><text x="20" y="122" className="fill-slate-700 text-[13px]">• Diamond brilliance: small ic</text><text x="20" y="154" className="fill-amber-700 text-[13px]">Selected: {material}</text></svg>;
}

function MagnificationSvg({ fo, fe, L }: { fo: number; fe: number; L: number }) {
    const m = (L / fo) * (D_NEAR / fe);
    return <svg viewBox="0 0 340 220" className="h-[230px] w-full"><text x="20" y="30" className="fill-slate-950 text-[16px] font-black">m = (L/fo)(D/fe)</text><rect x="40" y="58" width={Math.min(260, m)} height="38" rx="8" fill="#d946ef" /><text x="40" y="126" className="fill-slate-700 text-[13px]">Current magnification = {m.toFixed(0)}×</text><text x="40" y="154" className="fill-amber-700 text-[12px]">NCERT example: 1 cm, 2 cm, 20 cm → 250×</text></svg>;
}

function MicroscopePathSvg() {
    return <svg viewBox="0 0 340 180" className="h-[190px] w-full"><line x1="20" y1="90" x2="320" y2="90" stroke="#475569" /><ellipse cx="95" cy="90" rx="10" ry="70" stroke="#0891b2" fill="none" /><ellipse cx="245" cy="90" rx="10" ry="78" stroke="#7c3aed" fill="none" /><path d="M35 65 L95 65 L185 125 L245 125 L315 55" stroke="#ef4444" fill="none" strokeWidth="3" /><path d="M185 125 L245 90 L315 30" stroke="#2563eb" fill="none" strokeWidth="3" /><text x="170" y="165" textAnchor="middle" className="fill-slate-700 text-[12px]">Objective forms I₁, eyepiece magnifies</text></svg>;
}

function TelescopeCompareSvg({ m }: { m: number }) {
    const sep = clamp(m * 2, 12, 130);
    return <svg viewBox="0 0 340 220" className="h-[230px] w-full"><text x="42" y="32" className="fill-slate-700 text-[12px]">Naked eye</text><circle cx="80" cy="78" r="5" fill="#ca8a04" /><circle cx="94" cy="78" r="5" fill="#ca8a04" /><text x="212" y="32" className="fill-slate-700 text-[12px]">Telescope</text><circle cx={210 - sep / 2} cy="94" r="7" fill="#ca8a04" /><circle cx={210 + sep / 2} cy="94" r="7" fill="#ca8a04" /><text x="170" y="176" textAnchor="middle" className="fill-slate-800 text-[13px]">Angular separation × {m.toFixed(1)}</text></svg>;
}

function TelescopeTubeSvg({ fo, fe }: { fo: number; fe: number }) {
    return <svg viewBox="0 0 340 180" className="h-[190px] w-full"><line x1="40" y1="90" x2="300" y2="90" stroke="#475569" strokeWidth="3" /><ellipse cx="75" cy="90" rx="14" ry="72" stroke="#0891b2" fill="none" strokeWidth="3" /><ellipse cx="265" cy="90" rx="10" ry="45" stroke="#7c3aed" fill="none" strokeWidth="3" /><text x="170" y="152" textAnchor="middle" className="fill-amber-700 text-[13px]">Tube length = fo + fe = {fo + fe} cm</text></svg>;
}

function graphTitle(mode: OpticsMode) {
    return mode === 'lens' ? 'Lens Cases' : mode === 'prism' ? 'i-δ Graph' : mode === 'tir' ? 'Critical Angle' : mode === 'microscope' ? 'Microscope Magnification' : 'Angular Magnification';
}
function graphSubtitle(mode: OpticsMode) {
    return mode === 'lens' ? 'Image formation regions' : mode === 'prism' ? 'Minimum deviation marker' : mode === 'tir' ? 'Refraction vs TIR' : mode === 'microscope' ? 'm = (L/fo)(D/fe)' : 'm = fo/fe';
}
function secondaryGraphTitle(mode: OpticsMode) {
    return mode === 'lens' ? 'Power Of Lens' : mode === 'prism' ? 'Dispersion' : mode === 'tir' ? 'Applications' : mode === 'microscope' ? 'Ray Path Summary' : 'Tube Length';
}
function secondaryGraphSubtitle(mode: OpticsMode) {
    return mode === 'lens' ? 'Unit: dioptre' : mode === 'prism' ? 'Violet bends most' : mode === 'tir' ? 'NCERT examples' : mode === 'microscope' ? 'Two-lens system' : 'Normal adjustment';
}

function theoryTitle(mode: OpticsMode) {
    return mode === 'lens' ? 'Thin lens formulas' : mode === 'prism' ? 'Prism relations' : mode === 'tir' ? 'Critical angle' : mode === 'microscope' ? 'Compound microscope' : 'Astronomical telescope';
}

function theoryLines(mode: OpticsMode) {
    if (mode === 'lens') return ['1/v − 1/u = 1/f; m = v/u.', 'Power P = 1/f in metres; unit is dioptre.', 'Convex f > 0, concave f < 0.'];
    if (mode === 'prism') return ['r₁ + r₂ = A and δ = i + e − A.', 'At minimum deviation: i = e and r₁ = r₂ = A/2.', 'Violet has highest n and bends most.'];
    if (mode === 'tir') return ['Light must travel denser → rarer.', 'sin ic = nrarer/ndenser = 1/n for air.', 'For i > ic, no refracted ray emerges.'];
    if (mode === 'microscope') return ['Objective forms real inverted magnified I₁.', 'Eyepiece acts as simple magnifier.', 'For infinity: m = (L/fo)(D/fe), D = 25 cm.'];
    return ['Objective: large focal length and aperture.', 'Eyepiece: small focal length.', 'Normal adjustment: tube length = fo + fe and m = fo/fe.'];
}

function getReadouts(
    mode: OpticsMode,
    lens: LensSnapshot,
    prism: PrismSnapshot,
    tir: TirSnapshot,
    values: Record<string, number | string>
) {
    if (mode === 'lens') return [
        { label: 'Lens formula', value: '1/v - 1/u = 1/f', color: 'text-indigo-700', bg: 'bg-indigo-50' },
        { label: 'u', value: `${lens.uSigned.toFixed(0)} cm`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { label: 'v', value: lens.atInfinity ? '∞' : `${lens.vSigned.toFixed(1)} cm`, color: 'text-purple-700', bg: 'bg-purple-50' },
        { label: 'm', value: lens.atInfinity ? '∞' : lens.m.toFixed(2), color: 'text-sky-700', bg: 'bg-sky-50' },
        { label: 'Power', value: `${lens.power.toFixed(2)} D`, color: 'text-amber-700', bg: 'bg-amber-50' },
        { label: 'Nature', value: lens.nature, color: 'text-slate-800', bg: 'bg-slate-50' },
    ];
    if (mode === 'prism') return [
        { label: 'A', value: `${values.prismAngle}°`, color: 'text-indigo-700', bg: 'bg-indigo-50' },
        { label: 'i', value: `${values.incidence}°`, color: 'text-amber-700', bg: 'bg-amber-50' },
        { label: 'n', value: Number(values.prismN).toFixed(2), color: 'text-sky-700', bg: 'bg-sky-50' },
        { label: 'δ', value: prism.tirAtSecondFace ? '--' : `${prism.delta.toFixed(1)}°`, color: 'text-orange-700', bg: 'bg-orange-50' },
        { label: 'Dm', value: prism.minimumDeviationPossible ? `${prism.dm.toFixed(1)}°` : 'N/A', color: 'text-purple-700', bg: 'bg-purple-50' },
        { label: 'State', value: prism.tirAtSecondFace ? 'TIR: no emergent ray' : prism.minimum ? 'Minimum deviation' : 'General path', color: prism.tirAtSecondFace ? 'text-rose-700' : 'text-slate-800', bg: prism.tirAtSecondFace ? 'bg-rose-50' : 'bg-slate-50' },
    ];
    if (mode === 'tir') return [
        { label: 'n', value: tir.n.toFixed(2), color: 'text-sky-700', bg: 'bg-sky-50' },
        { label: 'ic', value: `${tir.ic.toFixed(2)}°`, color: 'text-amber-700', bg: 'bg-amber-50' },
        { label: 'i', value: `${values.tirAngle}°`, color: 'text-orange-700', bg: 'bg-orange-50' },
        { label: 'Condition', value: tir.state === 'tir' ? 'TIR' : tir.state === 'critical' ? 'Critical' : 'Refracts', color: tir.state === 'tir' ? 'text-rose-700' : 'text-emerald-700', bg: tir.state === 'tir' ? 'bg-rose-50' : 'bg-emerald-50' },
    ];
    if (mode === 'microscope') return [
        { label: 'fo', value: `${Number(values.foMicro).toFixed(1)} cm`, color: 'text-sky-700', bg: 'bg-sky-50' },
        { label: 'fe', value: `${Number(values.feMicro).toFixed(1)} cm`, color: 'text-purple-700', bg: 'bg-purple-50' },
        { label: 'L', value: `${values.tubeLength} cm`, color: 'text-amber-700', bg: 'bg-amber-50' },
        { label: 'mo', value: `${Number(values.microMo).toFixed(1)}x`, color: 'text-orange-700', bg: 'bg-orange-50' },
        { label: 'me', value: `${Number(values.microMe).toFixed(1)}x`, color: 'text-indigo-700', bg: 'bg-indigo-50' },
        { label: 'm total', value: `${Number(values.microM).toFixed(0)}x`, color: 'text-fuchsia-700', bg: 'bg-fuchsia-50' },
    ];
    return [
        { label: 'fo', value: `${values.foTel} cm`, color: 'text-sky-700', bg: 'bg-sky-50' },
        { label: 'fe', value: `${values.feTel} cm`, color: 'text-purple-700', bg: 'bg-purple-50' },
        { label: 'm = fo/fe', value: `${Number(values.telescopeM).toFixed(1)}x`, color: 'text-amber-700', bg: 'bg-amber-50' },
        { label: 'Tube length', value: `${Number(values.foTel) + Number(values.feTel)} cm`, color: 'text-orange-700', bg: 'bg-orange-50' },
    ];
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold transition ${active ? 'bg-indigo-600 text-white shadow' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{icon}{label}</button>;
}

function Slider({ label, value, min, max, step, valueNumber, onChange }: { label: string; value: string; min: number; max: number; step: number; valueNumber: number; onChange: (value: number) => void }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <label className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                <span className="flex items-center gap-2"><SlidersHorizontal size={14} />{label}</span>
                <span className="rounded-lg bg-indigo-50 px-3 py-1 font-mono text-sm font-bold text-indigo-700">{value}</span>
            </label>
            <input type="range" min={min} max={max} step={step} value={valueNumber} onChange={event => onChange(Number(event.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600" />
        </div>
    );
}

function Segmented({ options, value, onChange }: { options: Array<[string, string]>; value: string; onChange: (value: string) => void }) {
    return <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">{options.map(([id, label]) => <button key={id} onClick={() => onChange(id)} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${value === id ? 'bg-white text-indigo-700 shadow' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}</div>;
}

function Toggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${active ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}><Ruler size={16} />{label}</button>;
}

export default RayOpticsLab;
