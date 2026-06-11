import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Eye,
    EyeOff,
    Layers,
    Microscope,
    Pause,
    Play,
    RotateCcw,
    SlidersHorizontal,
    Trees
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Mode = 'tissue' | 'bundle' | 'secondary' | 'differentiation';
type TissueFocus = 'epidermal' | 'ground' | 'vascular';

interface AnatomyFloweringPlantsLabProps {
    topic: any;
    onExit: () => void;
}

interface LiveSnapshot {
    modeLabel: string;
    focusLabel: string;
    girthIndex: string;
    cambiumLabel: string;
    productionLabel: string;
    figureCue: string;
}

interface DrawConfig {
    mode: Mode;
    tissueFocus: TissueFocus;
    ageYears: number;
    cambiumActivity: number;
    showLabels: boolean;
    xrayOn: boolean;
    corkOn: boolean;
    time: number;
    speed: number;
}

const W = 1280;
const H = 760;

const MODE_OPTIONS: Array<{ id: Mode; label: string }> = [
    { id: 'tissue', label: 'Tissues' },
    { id: 'bundle', label: 'Bundles' },
    { id: 'secondary', label: 'Growth' },
    { id: 'differentiation', label: 'Cell fate' }
];

const TISSUE_OPTIONS: Array<{ id: TissueFocus; label: string }> = [
    { id: 'epidermal', label: 'Epidermal' },
    { id: 'ground', label: 'Ground' },
    { id: 'vascular', label: 'Vascular' }
];

const modeLabels: Record<Mode, string> = {
    tissue: 'Tissue systems',
    bundle: 'Bundle anatomy',
    secondary: 'Secondary growth',
    differentiation: 'Differentiation'
};

const focusLabels: Record<TissueFocus, string> = {
    epidermal: 'Epidermal system',
    ground: 'Ground system',
    vascular: 'Vascular system'
};

const AnatomyFloweringPlantsLab: React.FC<AnatomyFloweringPlantsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number | null>(null);
    const lastTimeRef = useRef(0);
    const timeRef = useRef(0);
    const liveTimerRef = useRef(0);

    const [mode, setMode] = useState<Mode>('secondary');
    const [tissueFocus, setTissueFocus] = useState<TissueFocus>('vascular');
    const [ageYears, setAgeYears] = useState(16);
    const [cambiumActivity, setCambiumActivity] = useState(68);
    const [showLabels, setShowLabels] = useState(true);
    const [xrayOn, setXrayOn] = useState(true);
    const [corkOn, setCorkOn] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [paused, setPaused] = useState(false);
    const [live, setLive] = useState<LiveSnapshot>({
        modeLabel: 'Secondary growth',
        focusLabel: 'Vascular system',
        girthIndex: '1.86x',
        cambiumLabel: '68%',
        productionLabel: 'Xylem inward, phloem outward',
        figureCue: 'Ch 13 Fig 13.2'
    });

    const resetLab = useCallback(() => {
        timeRef.current = 0;
        setMode('secondary');
        setTissueFocus('vascular');
        setAgeYears(16);
        setCambiumActivity(68);
        setShowLabels(true);
        setXrayOn(true);
        setCorkOn(true);
        setSpeed(1);
        setPaused(false);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const render = (now: number) => {
            const last = lastTimeRef.current || now;
            const dt = Math.min(0.1, (now - last) / 1000);
            lastTimeRef.current = now;

            if (!paused) {
                timeRef.current += dt * speed;
            }

            const config: DrawConfig = {
                mode,
                tissueFocus,
                ageYears,
                cambiumActivity,
                showLabels,
                xrayOn,
                corkOn,
                time: timeRef.current,
                speed
            };

            drawSimulation(ctx, config);

            liveTimerRef.current += dt;
            if (liveTimerRef.current > 0.15) {
                liveTimerRef.current = 0;
                setLive(makeLiveSnapshot(config));
            }

            frameRef.current = requestAnimationFrame(render);
        };

        frameRef.current = requestAnimationFrame(render);
        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [ageYears, cambiumActivity, corkOn, mode, paused, showLabels, speed, tissueFocus, xrayOn]);

    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <AsideCard title="NCERT Fig 6.2" subtitle="vascular bundle arrangements">
                    <BundleTypesSvg />
                </AsideCard>
                <AsideCard title="NCERT Fig 6.4" subtitle="dicot ring vs monocot scattered bundles">
                    <StemCompareSvg />
                </AsideCard>
                <AsideCard title="Growth Trace" subtitle="visual girth index">
                    <GrowthTraceSvg ageYears={ageYears} cambiumActivity={cambiumActivity} />
                </AsideCard>
            </div>
        </aside>
    ), [ageYears, cambiumActivity]);

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 text-emerald-950 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold">NCERT anchor</div>
                    <div className="mt-1 text-xs font-semibold text-emerald-700">Class 11 Biology, Ch 6 and Ch 13</div>
                    <div className="mt-3 space-y-2 text-sm leading-snug">
                        <p>Three tissue systems: epidermal, ground, and vascular.</p>
                        <p>Open dicot bundles contain cambium between phloem and xylem.</p>
                        <p>Vascular cambium and cork cambium are lateral meristems that increase girth.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between gap-3">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                        <ValueRow label="Mode" value={live.modeLabel} tone="emerald" />
                        <ValueRow label="Focus" value={live.focusLabel} tone="cyan" />
                        <ValueRow label="Girth index" value={live.girthIndex} tone="amber" />
                        <ValueRow label="Cambium" value={live.cambiumLabel} tone="green" />
                        <ValueRow label="Direction" value={live.productionLabel} tone="rose" />
                        <ValueRow label="NCERT cue" value={live.figureCue} tone="slate" />
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />

                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setPaused((value) => !value)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title={paused ? 'Play' : 'Pause'}
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button
                        type="button"
                        onClick={resetLab}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title="Reset"
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain">
            <div className="flex shrink-0 items-center gap-2 text-sm font-extrabold text-slate-900">
                <Microscope size={17} className="text-emerald-700" />
                Tissue Growth Bench
            </div>

            <div className="grid min-h-0 grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-12">
                <ControlGroup className="xl:col-span-4" icon={<Layers size={15} />} label="View">
                    <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={setMode} />
                </ControlGroup>

                {mode === 'tissue' && (
                    <ControlGroup className="xl:col-span-3" icon={<Microscope size={15} />} label="Focus">
                        <SegmentedControl options={TISSUE_OPTIONS} value={tissueFocus} onChange={setTissueFocus} />
                    </ControlGroup>
                )}

                {mode === 'secondary' && (
                    <>
                        <ControlGroup className="xl:col-span-2" icon={<Trees size={15} />} label={`Age ${ageYears}y`}>
                            <RangeControl min={1} max={50} step={1} value={ageYears} onChange={setAgeYears} minLabel="1" maxLabel="50" />
                        </ControlGroup>
                        <ControlGroup className="xl:col-span-2" icon={<Activity size={15} />} label={`Cambium ${cambiumActivity}%`}>
                            <RangeControl min={0} max={100} step={1} value={cambiumActivity} onChange={setCambiumActivity} minLabel="quiet" maxLabel="active" />
                        </ControlGroup>
                    </>
                )}

                <ControlGroup className="xl:col-span-2" icon={<SlidersHorizontal size={15} />} label={`Speed ${speed.toFixed(2)}x`}>
                    <RangeControl min={0.25} max={2} step={0.25} value={speed} onChange={setSpeed} minLabel="0.25x" maxLabel="2x" />
                </ControlGroup>

                <ControlGroup className="xl:col-span-2" icon={showLabels ? <Eye size={15} /> : <EyeOff size={15} />} label="Layers">
                    <div className="grid grid-cols-3 gap-2">
                        <ToggleChip active={showLabels} onClick={() => setShowLabels((value) => !value)} label="Labels" />
                        <ToggleChip active={xrayOn} onClick={() => setXrayOn((value) => !value)} label="X-ray" />
                        {mode === 'secondary' ? (
                            <ToggleChip active={corkOn} onClick={() => setCorkOn((value) => !value)} label="Periderm" />
                        ) : (
                            <ToggleChip active={corkOn} onClick={() => setCorkOn((value) => !value)} label="Cork" />
                        )}
                    </div>
                </ControlGroup>
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
            controlsAreaFlex="0 0 clamp(205px, 28%, 260px)"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1320px)] overflow-y-auto overscroll-contain bg-white border border-slate-200 shadow-2xl rounded-2xl p-4"
        />
    );
};

const makeLiveSnapshot = (config: DrawConfig): LiveSnapshot => {
    const girth = 1 + config.ageYears * 0.035 + config.cambiumActivity * 0.005;
    const figureCue = config.mode === 'bundle'
        ? 'Ch 6 Fig 6.2'
        : config.mode === 'secondary'
            ? 'Ch 13 Fig 13.2'
            : config.mode === 'differentiation'
                ? 'Ch 13 Sec 13.2'
                : 'Ch 6 Sec 6.1';

    return {
        modeLabel: modeLabels[config.mode],
        focusLabel: config.mode === 'tissue' ? focusLabels[config.tissueFocus] : 'Vascular cambium',
        girthIndex: `${girth.toFixed(2)}x`,
        cambiumLabel: config.mode === 'secondary' ? `${config.cambiumActivity}% active` : 'open dicot bundles',
        productionLabel: config.mode === 'secondary' ? 'xylem inward, phloem outward' : 'water/minerals + food',
        figureCue
    };
};

const drawSimulation = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx);
    drawMicroscopeStage(ctx);

    if (config.mode === 'differentiation') {
        drawDifferentiationScene(ctx, config);
    } else {
        drawStemSection(ctx, config);
    }

    drawModeBadge(ctx, config);
};

const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    for (let y = 0; y <= H; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }
};

const drawMicroscopeStage = (ctx: CanvasRenderingContext2D) => {
    roundRect(ctx, 170, 96, 940, 590, 24, '#ffffff', '#dbeafe', 3);
    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(250, 650, 780, 8);
    ctx.fillStyle = '#475569';
    ctx.font = '700 13px Arial';
    ctx.fillText('microscope slide: transverse section of dicot stem', 198, 126);
};

const drawStemSection = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    const cx = 640;
    const cy = 392;
    const growth = config.mode === 'secondary' ? config.ageYears * 1.35 + config.cambiumActivity * 0.22 : 0;
    const outerR = config.mode === 'secondary' ? 206 + growth * 0.45 : 208;
    const pulse = 1 + Math.sin(config.time * 4) * 0.025;
    const corkR = outerR + (config.corkOn && config.mode === 'secondary' ? 18 : 0);
    const epidermisR = outerR;
    const cortexR = outerR - 32;
    const bundleR = outerR - 72;
    const cambiumR = bundleR - (config.mode === 'secondary' ? 18 + config.ageYears * 0.7 : 0);
    const xylemR = Math.max(64, cambiumR - (config.mode === 'secondary' ? 44 + config.ageYears * 0.95 : 28));
    const pithR = Math.max(42, xylemR - 34);

    ctx.save();
    ctx.globalAlpha = config.xrayOn ? 0.58 : 1;
    if (config.corkOn && config.mode === 'secondary') {
        drawRing(ctx, cx, cy, corkR, outerR + 2, '#fef3c7', '#a16207', 3);
    }
    drawDisk(ctx, cx, cy, epidermisR, '#dcfce7', '#16a34a', 4);
    drawDisk(ctx, cx, cy, cortexR, '#fef3c7', '#f59e0b', 3);
    drawDisk(ctx, cx, cy, Math.max(52, xylemR + 42), '#fee2e2', '#ef4444', 2);
    drawDisk(ctx, cx, cy, pithR, '#fdf2f8', '#db2777', 3);
    ctx.restore();

    if (config.mode === 'tissue') {
        drawTissueHighlight(ctx, cx, cy, config, { epidermisR, cortexR, bundleR, pithR });
    }

    const bundles = config.mode === 'bundle' ? 14 : 12;
    for (let i = 0; i < bundles; i += 1) {
        const angle = (Math.PI * 2 * i) / bundles - Math.PI / 2;
        drawVascularBundle(ctx, cx, cy, bundleR, angle, config, pulse);
    }

    drawCambiumRing(ctx, cx, cy, Math.max(96, cambiumR), config);
    drawMedullaryRays(ctx, cx, cy, pithR + 12, bundleR + 16, config.time);

    if (config.mode === 'secondary') {
        drawSecondaryCellFlow(ctx, cx, cy, Math.max(96, cambiumR), config);
    }

    if (config.mode === 'bundle') {
        drawBundleCallout(ctx, config.time);
    }

    drawSurfaceFeatures(ctx, cx, cy, epidermisR, config.time);

    if (config.showLabels) {
        drawStemLabels(ctx, cx, cy, {
            corkR,
            epidermisR,
            cortexR,
            bundleR,
            cambiumR: Math.max(96, cambiumR),
            pithR
        }, config);
    }
};

const drawTissueHighlight = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    config: DrawConfig,
    radii: { epidermisR: number; cortexR: number; bundleR: number; pithR: number }
) => {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 12;
    ctx.setLineDash([16, 12]);
    ctx.lineDashOffset = -config.time * 22;
    const color = config.tissueFocus === 'epidermal' ? '#16a34a' : config.tissueFocus === 'ground' ? '#d97706' : '#2563eb';
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    if (config.tissueFocus === 'epidermal') {
        ctx.arc(cx, cy, radii.epidermisR + 7, 0, Math.PI * 2);
    } else if (config.tissueFocus === 'ground') {
        ctx.arc(cx, cy, radii.cortexR - 12, 0, Math.PI * 2);
    } else {
        ctx.arc(cx, cy, radii.bundleR, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.restore();
};

const drawVascularBundle = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    angle: number,
    config: DrawConfig,
    pulse: number
) => {
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const outwardX = Math.cos(angle);
    const outwardY = Math.sin(angle);
    const tangent = angle + Math.PI / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tangent);
    ctx.shadowBlur = 0;

    roundRect(ctx, -18, -34, 36, 26, 11, '#dbeafe', '#2563eb', 2);
    roundRect(ctx, -15, -7, 30, 10, 5, '#dcfce7', '#22c55e', 2);
    roundRect(ctx, -20, 7, 40, 32, 12, '#fee2e2', '#dc2626', 2);

    if (config.mode === 'secondary' || config.mode === 'bundle') {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3 + pulse * 1.4;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
    }

    ctx.restore();

    if (config.mode === 'secondary') {
        const activity = config.cambiumActivity / 100;
        for (let j = 0; j < 2; j += 1) {
            const phase = (config.time * (0.45 + activity) + j * 0.5 + angle) % 1;
            const inward = 11 + phase * (24 + activity * 26);
            const outward = 8 + phase * (9 + activity * 12);
            drawCell(ctx, x - outwardX * inward, y - outwardY * inward, 4.5, '#ef4444', 0.35 + activity * 0.45);
            drawCell(ctx, x + outwardX * outward, y + outwardY * outward, 3.6, '#2563eb', 0.3 + activity * 0.35);
        }
    }
};

const drawCambiumRing = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, config: DrawConfig) => {
    const pulse = 0.5 + Math.sin(config.time * 5) * 0.5;
    ctx.save();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 5 + pulse * 2;
    ctx.setLineDash([10, 9]);
    ctx.lineDashOffset = -config.time * 26;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = config.mode === 'secondary' ? 16 : 6;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
};

const drawMedullaryRays = (ctx: CanvasRenderingContext2D, cx: number, cy: number, innerR: number, outerR: number, time: number) => {
    ctx.save();
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.38;
    for (let i = 0; i < 16; i += 1) {
        const angle = (Math.PI * 2 * i) / 16 + Math.sin(time * 0.7) * 0.01;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.stroke();
    }
    ctx.restore();
};

const drawSecondaryCellFlow = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, config: DrawConfig) => {
    const activity = config.cambiumActivity / 100;
    for (let i = 0; i < 42; i += 1) {
        const angle = (Math.PI * 2 * i) / 42 + Math.sin(config.time * 0.4 + i) * 0.02;
        const phase = (config.time * (0.28 + activity * 0.9) + i * 0.137) % 1;
        const inwardR = radius - phase * (72 + config.ageYears * 1.2);
        const outwardR = radius + phase * (22 + activity * 22);
        drawCell(ctx, cx + Math.cos(angle) * inwardR, cy + Math.sin(angle) * inwardR, 3.8, '#dc2626', 0.28 + activity * 0.46);
        if (i % 2 === 0) {
            drawCell(ctx, cx + Math.cos(angle) * outwardR, cy + Math.sin(angle) * outwardR, 3.2, '#2563eb', 0.22 + activity * 0.34);
        }
    }
};

const drawSurfaceFeatures = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, time: number) => {
    ctx.save();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i += 1) {
        const angle = (Math.PI * 2 * i) / 20;
        const x1 = cx + Math.cos(angle) * (r - 2);
        const y1 = cy + Math.sin(angle) * (r - 2);
        const x2 = cx + Math.cos(angle + Math.sin(time + i) * 0.04) * (r + 18 + (i % 3) * 5);
        const y2 = cy + Math.sin(angle + Math.sin(time + i) * 0.04) * (r + 18 + (i % 3) * 5);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    ctx.fillStyle = '#16a34a';
    for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI * 2 * i) / 6 + Math.PI / 10;
        const x = cx + Math.cos(angle) * (r + 3);
        const y = cy + Math.sin(angle) * (r + 3);
        ctx.beginPath();
        ctx.ellipse(x - 5, y, 8, 4, angle, 0, Math.PI * 2);
        ctx.ellipse(x + 5, y, 8, 4, angle, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
    }
    ctx.restore();
};

const drawBundleCallout = (ctx: CanvasRenderingContext2D, time: number) => {
    const x = 880;
    const y = 188;
    roundRect(ctx, x, y, 190, 132, 18, '#ffffff', '#bfdbfe', 2);
    ctx.fillStyle = '#1e293b';
    ctx.font = '800 15px Arial';
    ctx.fillText('Conjoint open', x + 24, y + 30);
    ctx.font = '700 11px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText('phloem outside, xylem inside', x + 24, y + 50);
    ctx.save();
    ctx.translate(x + 94, y + 88);
    roundRect(ctx, -25, -32, 50, 22, 10, '#dbeafe', '#2563eb', 2);
    roundRect(ctx, -23, -4, 46, 9, 5, '#dcfce7', '#22c55e', 2);
    roundRect(ctx, -28, 12, 56, 28, 12, '#fee2e2', '#dc2626', 2);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3 + Math.sin(time * 5) * 1;
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(26, 0);
    ctx.stroke();
    ctx.restore();
};

const drawDifferentiationScene = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    const y = 388;
    const centers = [315, 510, 705, 900];
    const labels = ['Cambium cell', 'Division', 'Redifferentiation', 'Tracheary element'];
    const colors = ['#dcfce7', '#bbf7d0', '#fef3c7', '#fee2e2'];
    const strokes = ['#22c55e', '#16a34a', '#d97706', '#dc2626'];

    for (let i = 0; i < centers.length; i += 1) {
        const x = centers[i];
        const pulse = i === 0 ? Math.sin(config.time * 5) * 5 : 0;
        roundRect(ctx, x - 72, y - 78, 144, 156, 24, '#ffffff', '#e2e8f0', 2);
        ctx.fillStyle = colors[i];
        ctx.strokeStyle = strokes[i];
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (i < 3) {
            ctx.ellipse(x, y, 40 + pulse, 52 - pulse * 0.25, 0, 0, Math.PI * 2);
        } else {
            ctx.roundRect(x - 25, y - 62, 50, 124, 20);
        }
        ctx.fill();
        ctx.stroke();

        if (i === 3) {
            ctx.strokeStyle = '#991b1b';
            ctx.lineWidth = 3;
            for (let k = -38; k <= 38; k += 19) {
                ctx.beginPath();
                ctx.moveTo(x - 20, y + k);
                ctx.lineTo(x + 20, y + k - 12);
                ctx.stroke();
            }
        }

        ctx.fillStyle = '#0f172a';
        ctx.font = '800 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x, y + 105);

        if (i < centers.length - 1) {
            drawArrow(ctx, x + 88, y, centers[i + 1] - 88, y, '#64748b');
        }
    }

    if (config.showLabels) {
        ctx.fillStyle = '#475569';
        ctx.font = '700 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('living differentiated cells can regain division capacity; new cells mature for specific functions', 640, 606);
        ctx.textAlign = 'left';
    }
};

const drawStemLabels = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radii: { corkR: number; epidermisR: number; cortexR: number; bundleR: number; cambiumR: number; pithR: number },
    config: DrawConfig
) => {
    const labels: Array<{ text: string; angle: number; r: number; tx: number; ty: number; color: string }> = [
        { text: config.corkOn && config.mode === 'secondary' ? 'Periderm' : 'Epidermis', angle: -2.35, r: radii.epidermisR, tx: 302, ty: 196, color: '#15803d' },
        { text: 'Cortex', angle: -0.55, r: radii.cortexR, tx: 912, ty: 230, color: '#b45309' },
        { text: 'Phloem', angle: 0.05, r: radii.bundleR + 18, tx: 940, ty: 384, color: '#1d4ed8' },
        { text: 'Cambium', angle: 0.8, r: radii.cambiumR, tx: 884, ty: 548, color: '#16a34a' },
        { text: 'Xylem', angle: 2.3, r: radii.pithR + 68, tx: 336, ty: 554, color: '#dc2626' },
        { text: 'Pith', angle: Math.PI, r: radii.pithR, tx: 402, ty: 388, color: '#be185d' }
    ];

    labels.forEach((item) => {
        const sx = cx + Math.cos(item.angle) * item.r;
        const sy = cy + Math.sin(item.angle) * item.r;
        drawLeaderLabel(ctx, sx, sy, item.tx, item.ty, item.text, item.color);
    });
};

const drawModeBadge = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    roundRect(ctx, 198, 145, 270, 48, 16, '#ffffff', '#d1fae5', 2);
    ctx.fillStyle = '#064e3b';
    ctx.font = '800 16px Arial';
    ctx.fillText(modeLabels[config.mode], 220, 176);
};

const drawDisk = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, stroke: string, line = 2) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;
    ctx.stroke();
};

const drawRing = (ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number, fill: string, stroke: string, line = 2) => {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;
    ctx.stroke();
};

const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

const drawLeaderLabel = (ctx: CanvasRenderingContext2D, sx: number, sy: number, tx: number, ty: number, text: string, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    roundRect(ctx, tx - 8, ty - 20, ctx.measureText(text).width + 26, 30, 10, '#ffffff', color, 2);
    ctx.fillStyle = color;
    ctx.font = '800 13px Arial';
    ctx.fillText(text, tx + 5, ty);
};

const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(angle - 0.45) * 12, y2 - Math.sin(angle - 0.45) * 12);
    ctx.lineTo(x2 - Math.cos(angle + 0.45) * 12, y2 - Math.sin(angle + 0.45) * 12);
    ctx.closePath();
    ctx.fill();
};

const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: string,
    stroke?: string,
    lineWidth = 1
) => {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
};

const AsideCard = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
        <div className="text-base font-extrabold text-slate-900">{title}</div>
        <div className="text-xs font-semibold text-slate-500">{subtitle}</div>
        <div className="mt-3">{children}</div>
    </div>
);

const BundleTypesSvg = () => (
    <svg viewBox="0 0 300 162" className="h-[162px] w-full">
        <rect width="300" height="162" rx="14" fill="#ffffff" />
        <MiniBundle x={48} y={66} label="Radial" radial />
        <MiniBundle x={150} y={66} label="Closed" />
        <MiniBundle x={252} y={66} label="Open" cambium />
        <text x="48" y="145" textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569">root type</text>
        <text x="150" y="145" textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569">monocot</text>
        <text x="252" y="145" textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569">dicot</text>
    </svg>
);

const MiniBundle = ({ x, y, label, radial, cambium }: { x: number; y: number; label: string; radial?: boolean; cambium?: boolean }) => (
    <g>
        <circle cx={x} cy={y} r="42" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        {radial ? (
            <>
                <ellipse cx={x - 14} cy={y} rx="10" ry="28" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
                <ellipse cx={x + 14} cy={y} rx="10" ry="28" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
            </>
        ) : (
            <>
                <rect x={x - 22} y={y - 28} width="44" height="22" rx="10" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
                {cambium && <rect x={x - 22} y={y - 2} width="44" height="7" rx="4" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />}
                <rect x={x - 26} y={y + 12} width="52" height="25" rx="12" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
            </>
        )}
        <text x={x} y={y - 52} textAnchor="middle" fontSize="12" fontWeight="900" fill="#0f172a">{label}</text>
    </g>
);

const StemCompareSvg = () => (
    <svg viewBox="0 0 300 162" className="h-[162px] w-full">
        <rect width="300" height="162" rx="14" fill="#ffffff" />
        <circle cx="82" cy="78" r="58" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
        <circle cx="82" cy="78" r="25" fill="#fdf2f8" stroke="#db2777" strokeWidth="2" />
        {Array.from({ length: 10 }).map((_, i) => {
            const a = (Math.PI * 2 * i) / 10;
            return <ellipse key={i} cx={82 + Math.cos(a) * 40} cy={78 + Math.sin(a) * 40} rx="6" ry="12" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" transform={`rotate(${(a * 180) / Math.PI + 90} ${82 + Math.cos(a) * 40} ${78 + Math.sin(a) * 40})`} />;
        })}
        <circle cx="218" cy="78" r="58" fill="#ecfdf5" stroke="#16a34a" strokeWidth="3" />
        {Array.from({ length: 18 }).map((_, i) => {
            const a = i * 2.399;
            const r = 14 + (i % 5) * 8;
            return <ellipse key={i} cx={218 + Math.cos(a) * r} cy={78 + Math.sin(a) * r} rx="5" ry="10" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" transform={`rotate(${(a * 180) / Math.PI} ${218 + Math.cos(a) * r} ${78 + Math.sin(a) * r})`} />;
        })}
        <text x="82" y="150" textAnchor="middle" fontSize="12" fontWeight="900" fill="#0f172a">Dicot: ring/open</text>
        <text x="218" y="150" textAnchor="middle" fontSize="12" fontWeight="900" fill="#0f172a">Monocot: scattered</text>
    </svg>
);

const GrowthTraceSvg = ({ ageYears, cambiumActivity }: { ageYears: number; cambiumActivity: number }) => {
    const points = Array.from({ length: 10 }).map((_, i) => {
        const age = 1 + i * 5;
        const value = 112 - Math.min(88, age * 1.35 + cambiumActivity * 0.28);
        return `${24 + i * 28},${value}`;
    }).join(' ');
    const currentX = 24 + Math.min(9, Math.floor(ageYears / 5)) * 28;
    const currentY = 112 - Math.min(88, ageYears * 1.35 + cambiumActivity * 0.28);

    return (
        <svg viewBox="0 0 300 150" className="h-[150px] w-full">
            <rect width="300" height="150" rx="14" fill="#ffffff" />
            <line x1="24" y1="120" x2="282" y2="120" stroke="#94a3b8" strokeWidth="2" />
            <line x1="24" y1="20" x2="24" y2="120" stroke="#94a3b8" strokeWidth="2" />
            <polyline points={points} fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={currentX} cy={currentY} r="7" fill="#dc2626" />
            <text x="30" y="140" fontSize="11" fontWeight="800" fill="#475569">age</text>
            <text x="154" y="22" fontSize="11" fontWeight="800" fill="#475569">girth index</text>
        </svg>
    );
};

const ValueRow = ({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'cyan' | 'amber' | 'green' | 'rose' | 'slate' }) => {
    const styles: Record<typeof tone, string> = {
        emerald: 'bg-emerald-50 text-emerald-700',
        cyan: 'bg-cyan-50 text-cyan-700',
        amber: 'bg-amber-50 text-amber-700',
        green: 'bg-green-50 text-green-700',
        rose: 'bg-rose-50 text-rose-700',
        slate: 'bg-slate-50 text-slate-700'
    };

    return (
        <div className={`rounded-lg border border-slate-100 px-3 py-2.5 ${styles[tone]}`}>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 font-mono text-sm font-extrabold">{value}</div>
        </div>
    );
};

const ControlGroup = ({
    icon,
    label,
    children,
    className = ''
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div className={`min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${className}`}>
        <div className="mb-2 flex min-h-[18px] items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-700">
            {icon}
            <span className="truncate">{label}</span>
        </div>
        {children}
    </div>
);

const SegmentedControl = <T extends string>({
    options,
    value,
    onChange
}: {
    options: Array<{ id: T; label: string }>;
    value: T;
    onChange: (value: T) => void;
}) => (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => (
            <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                className={`min-h-[36px] rounded-lg border px-2 text-xs font-extrabold transition-colors ${value === option.id ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'}`}
            >
                {option.label}
            </button>
        ))}
    </div>
);

const RangeControl = ({
    min,
    max,
    step,
    value,
    onChange,
    minLabel,
    maxLabel
}: {
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
    minLabel: string;
    maxLabel: string;
}) => (
    <div>
        <div className="flex h-9 items-center">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="w-full accent-emerald-600"
            />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
        </div>
    </div>
);

const ToggleChip = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
        type="button"
        onClick={onClick}
        className={`min-h-[36px] rounded-lg border px-2 text-xs font-extrabold transition-colors ${active ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'}`}
    >
        {label}
    </button>
);

export default AnatomyFloweringPlantsLab;
