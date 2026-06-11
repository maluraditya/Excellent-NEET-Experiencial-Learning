import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Bone,
    Eye,
    EyeOff,
    HeartPulse,
    Layers,
    Microscope,
    Pause,
    Play,
    RotateCcw,
    SlidersHorizontal
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Mode = 'overview' | 'epithelial' | 'connective' | 'muscle';
type EpitheliumView = 'simple' | 'compound';
type ConnectiveView = 'cartilage' | 'bone' | 'blood';
type MuscleView = 'skeletal' | 'smooth' | 'cardiac';

interface AnimalTissuesLabProps {
    topic: any;
    onExit: () => void;
}

interface DrawConfig {
    mode: Mode;
    epitheliumView: EpitheliumView;
    connectiveView: ConnectiveView;
    muscleView: MuscleView;
    stress: number;
    contraction: number;
    speed: number;
    showLabels: boolean;
    microView: boolean;
    time: number;
}

interface LiveSnapshot {
    mode: string;
    sample: string;
    property: string;
    motion: string;
    ncertCue: string;
}

const W = 1280;
const H = 760;

const MODE_OPTIONS: Array<{ id: Mode; label: string }> = [
    { id: 'overview', label: 'Map' },
    { id: 'epithelial', label: 'Epithelium' },
    { id: 'connective', label: 'Connective' },
    { id: 'muscle', label: 'Muscle' }
];

const EPITHELIUM_OPTIONS: Array<{ id: EpitheliumView; label: string }> = [
    { id: 'simple', label: 'Simple' },
    { id: 'compound', label: 'Compound' }
];

const CONNECTIVE_OPTIONS: Array<{ id: ConnectiveView; label: string }> = [
    { id: 'cartilage', label: 'Cartilage' },
    { id: 'bone', label: 'Bone' },
    { id: 'blood', label: 'Blood' }
];

const MUSCLE_OPTIONS: Array<{ id: MuscleView; label: string }> = [
    { id: 'skeletal', label: 'Skeletal' },
    { id: 'smooth', label: 'Smooth' },
    { id: 'cardiac', label: 'Cardiac' }
];

const modeNames: Record<Mode, string> = {
    overview: 'Tissue map',
    epithelial: 'Epithelial tissue',
    connective: 'Connective tissue',
    muscle: 'Muscle tissue'
};

const AnimalTissuesLab: React.FC<AnimalTissuesLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number | null>(null);
    const lastTimeRef = useRef(0);
    const timeRef = useRef(0);
    const liveTimerRef = useRef(0);

    const [mode, setMode] = useState<Mode>('overview');
    const [epitheliumView, setEpitheliumView] = useState<EpitheliumView>('simple');
    const [connectiveView, setConnectiveView] = useState<ConnectiveView>('cartilage');
    const [muscleView, setMuscleView] = useState<MuscleView>('skeletal');
    const [stress, setStress] = useState(35);
    const [contraction, setContraction] = useState(60);
    const [speed, setSpeed] = useState(1);
    const [showLabels, setShowLabels] = useState(true);
    const [microView, setMicroView] = useState(true);
    const [paused, setPaused] = useState(false);
    const [live, setLive] = useState<LiveSnapshot>({
        mode: 'Tissue map',
        sample: 'four basic tissue types',
        property: 'division of labour',
        motion: 'coordinated organ view',
        ncertCue: 'Ch 7 summary'
    });

    const resetLab = useCallback(() => {
        timeRef.current = 0;
        setMode('overview');
        setEpitheliumView('simple');
        setConnectiveView('cartilage');
        setMuscleView('skeletal');
        setStress(35);
        setContraction(60);
        setSpeed(1);
        setShowLabels(true);
        setMicroView(true);
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
                epitheliumView,
                connectiveView,
                muscleView,
                stress,
                contraction,
                speed,
                showLabels,
                microView,
                time: timeRef.current
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
    }, [connectiveView, contraction, epitheliumView, microView, mode, muscleView, paused, showLabels, speed, stress]);

    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <AsideCard title="NCERT Tissue Map" subtitle="four basic tissue types">
                    <TissueMapSvg active={mode} />
                </AsideCard>
                <AsideCard title="Connective Matrix" subtitle="fluid, pliable, hard">
                    <MatrixSvg active={connectiveView} />
                </AsideCard>
                <AsideCard title="Muscle Classes" subtitle="location, appearance, regulation">
                    <MuscleClassesSvg active={muscleView} />
                </AsideCard>
            </div>
        </aside>
    ), [connectiveView, mode, muscleView]);

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/95 p-4 text-rose-950 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold">NCERT anchor</div>
                    <div className="mt-1 text-xs font-semibold text-rose-700">Class 11 Biology, Ch 7, Ch 15, Ch 17</div>
                    <div className="mt-3 space-y-2 text-sm leading-snug">
                        <p>Tissues are cells with intercellular substances performing functions.</p>
                        <p>Epithelia are sheet-like linings with one free surface and junctions.</p>
                        <p>Bone is hard due to calcium salts; cartilage is pliable due to chondroitin salts.</p>
                        <p>Muscles show excitability, contractility, extensibility and elasticity.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between gap-3">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                        <ValueRow label="Mode" value={live.mode} tone="rose" />
                        <ValueRow label="Sample" value={live.sample} tone="cyan" />
                        <ValueRow label="Property" value={live.property} tone="amber" />
                        <ValueRow label="Motion" value={live.motion} tone="green" />
                        <ValueRow label="NCERT cue" value={live.ncertCue} tone="slate" />
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
                <Microscope size={17} className="text-rose-700" />
                Animal Tissue Bench
            </div>

            <div className="grid min-h-0 grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-12">
                <ControlGroup className="xl:col-span-4" icon={<Layers size={15} />} label="View">
                    <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={setMode} />
                </ControlGroup>

                {mode === 'epithelial' && (
                    <ControlGroup className="xl:col-span-3" icon={<Eye size={15} />} label="Layer model">
                        <SegmentedControl options={EPITHELIUM_OPTIONS} value={epitheliumView} onChange={setEpitheliumView} />
                    </ControlGroup>
                )}

                {mode === 'connective' && (
                    <ControlGroup className="xl:col-span-3" icon={<Bone size={15} />} label="Matrix">
                        <SegmentedControl options={CONNECTIVE_OPTIONS} value={connectiveView} onChange={setConnectiveView} />
                    </ControlGroup>
                )}

                {mode === 'muscle' && (
                    <ControlGroup className="xl:col-span-3" icon={<HeartPulse size={15} />} label="Muscle">
                        <SegmentedControl options={MUSCLE_OPTIONS} value={muscleView} onChange={setMuscleView} />
                    </ControlGroup>
                )}

                {(mode === 'epithelial' || mode === 'connective') && (
                    <ControlGroup className="xl:col-span-2" icon={<Activity size={15} />} label={`Stress ${stress}%`}>
                        <RangeControl min={0} max={100} step={1} value={stress} onChange={setStress} minLabel="low" maxLabel="high" />
                    </ControlGroup>
                )}

                {mode === 'muscle' && (
                    <ControlGroup className="xl:col-span-2" icon={<Activity size={15} />} label={`Signal ${contraction}%`}>
                        <RangeControl min={0} max={100} step={1} value={contraction} onChange={setContraction} minLabel="rest" maxLabel="active" />
                    </ControlGroup>
                )}

                <ControlGroup className="xl:col-span-2" icon={<SlidersHorizontal size={15} />} label={`Speed ${speed.toFixed(2)}x`}>
                    <RangeControl min={0.25} max={2} step={0.25} value={speed} onChange={setSpeed} minLabel="0.25x" maxLabel="2x" />
                </ControlGroup>

                <ControlGroup className="xl:col-span-2" icon={showLabels ? <Eye size={15} /> : <EyeOff size={15} />} label="Layers">
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleChip active={showLabels} onClick={() => setShowLabels((value) => !value)} label="Labels" />
                        <ToggleChip active={microView} onClick={() => setMicroView((value) => !value)} label="Micro" />
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
    if (config.mode === 'epithelial') {
        return {
            mode: 'Epithelial tissue',
            sample: config.epitheliumView === 'simple' ? 'single sheet model' : 'layered sheet model',
            property: 'one free surface + junctions',
            motion: `surface shear ${config.stress}%`,
            ncertCue: 'Ch 7 summary'
        };
    }

    if (config.mode === 'connective') {
        const property = config.connectiveView === 'bone'
            ? 'hard calcium-salt matrix'
            : config.connectiveView === 'cartilage'
                ? 'pliable chondroitin-salt matrix'
                : 'fluid plasma matrix';
        return {
            mode: 'Connective tissue',
            sample: config.connectiveView,
            property,
            motion: config.connectiveView === 'blood' ? 'formed elements flow' : `load index ${config.stress}%`,
            ncertCue: config.connectiveView === 'blood' ? 'Ch 15 Sec 15.1' : 'Ch 17 Sec 17.3'
        };
    }

    if (config.mode === 'muscle') {
        const property = config.muscleView === 'skeletal'
            ? 'striated voluntary'
            : config.muscleView === 'smooth'
                ? 'nonstriated involuntary'
                : 'branched striated involuntary';
        return {
            mode: 'Muscle tissue',
            sample: config.muscleView,
            property,
            motion: `contractility ${config.contraction}%`,
            ncertCue: 'Ch 17 Sec 17.2'
        };
    }

    return {
        mode: 'Tissue map',
        sample: 'epithelial, connective, muscle, neural',
        property: 'division of labour',
        motion: 'organ-level coordination',
        ncertCue: 'Ch 7 Sec 7.1'
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
    drawSlideFrame(ctx);

    if (config.mode === 'overview') drawOverview(ctx, config);
    if (config.mode === 'epithelial') drawEpithelial(ctx, config);
    if (config.mode === 'connective') drawConnective(ctx, config);
    if (config.mode === 'muscle') drawMuscle(ctx, config);

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

const drawSlideFrame = (ctx: CanvasRenderingContext2D) => {
    roundRect(ctx, 92, 88, 1096, 610, 24, '#ffffff', '#fecdd3', 3);
    roundRect(ctx, 130, 154, 1020, 488, 26, '#fff7ed', '#fed7aa', 2);
    ctx.fillStyle = '#475569';
    ctx.font = '700 13px Arial';
    ctx.fillText('NCERT Ch 7: cells, tissues, organs and organ systems', 128, 120);
};

const drawOverview = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    const pulse = 1 + Math.sin(config.time * 2.2) * 0.018;
    const tissueRows = [
        { y: 332, label: 'Epithelial', cue: 'sheet-like linings', color: '#0284c7' },
        { y: 384, label: 'Connective', cue: 'intercellular matrix', color: '#d97706' },
        { y: 436, label: 'Muscular', cue: 'movement', color: '#dc2626' },
        { y: 488, label: 'Neural', cue: 'quick coordination', color: '#7c3aed' }
    ];

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 24px Arial';
    ctx.fillText('Animal body organisation', 640, 206);
    ctx.fillStyle = '#64748b';
    ctx.font = '700 14px Arial';
    ctx.fillText('All complex animals have four basic tissue types', 640, 232);
    ctx.restore();

    drawMapBox(ctx, 238, 410, 152, 82, 'Cells', 'similar cells', '#475569', config.time, 0);
    drawMapBox(ctx, 936, 348, 174, 86, 'Organs', 'tissues in patterns', '#0f766e', config.time, 2);
    drawMapBox(ctx, 936, 530, 224, 86, 'Organ systems', 'organs share a function', '#4338ca', config.time, 3);

    drawArrow(ctx, 314, 410, 378, 410, '#94a3b8');
    drawArrow(ctx, 762, 410, 848, 360, '#94a3b8');
    drawArrow(ctx, 936, 391, 936, 487, '#94a3b8');

    roundRect(ctx, 382, 276, 380, 284, 22, '#ffffff', '#fecdd3', 2.5);
    ctx.fillStyle = '#881337';
    ctx.font = '900 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Tissues', 572, 306);
    ctx.fillStyle = '#64748b';
    ctx.font = '800 12px Arial';
    ctx.fillText('cells + intercellular substances perform functions', 572, 326);

    tissueRows.forEach((row, index) => {
        const y = row.y + Math.sin(config.time * 1.6 + index) * 1.5;
        ctx.save();
        ctx.translate(572, y);
        ctx.scale(pulse, pulse);
        roundRect(ctx, -148, -18, 296, 38, 11, '#ffffff', row.color, 2.2);
        ctx.fillStyle = row.color;
        ctx.font = '900 13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(row.label, -124, 5);
        ctx.fillStyle = '#64748b';
        ctx.font = '800 11px Arial';
        ctx.fillText(row.cue, 30, 5);
        ctx.restore();
    });

    if (config.showLabels) {
        drawInlineNote(ctx, 784, 250, 304, 36, 'Heart contains all four tissues', '#0f766e');
        drawInlineNote(ctx, 784, 592, 304, 36, 'Digestive and respiratory systems', '#4338ca');
    }
};

const drawInlineNote = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    color: string
) => {
    roundRect(ctx, x, y, width, height, 13, '#ffffff', color, 2);
    ctx.fillStyle = color;
    ctx.font = '800 11.5px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + width / 2, y + height / 2 + 4);
    ctx.textAlign = 'left';
};

const drawMapBox = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    width: number,
    height: number,
    title: string,
    subtitle: string,
    color: string,
    time: number,
    phase: number
) => {
    const scale = 1 + Math.sin(time * 1.8 + phase) * 0.012;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.shadowColor = `${color}33`;
    ctx.shadowBlur = 10;
    roundRect(ctx, -width / 2, -height / 2, width, height, 16, '#ffffff', color, 2.8);
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.font = '900 17px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, 0, -3);
    ctx.fillStyle = '#64748b';
    ctx.font = '800 11px Arial';
    ctx.fillText(subtitle, 0, 19);
    ctx.restore();
};

const drawEpithelial = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    const baseY = 472;
    const startX = 310;
    const cellW = 56;
    const cellCount = 11;
    const shear = Math.sin(config.time * 2.3) * config.stress * 0.18;
    const layers = config.epitheliumView === 'simple' ? 1 : 5;
    const layerH = config.epitheliumView === 'simple' ? 72 : 34;

    drawFreeSurface(ctx, startX - 20, baseY - layers * layerH - 28, cellCount * cellW + 40, config.time);

    for (let layer = 0; layer < layers; layer += 1) {
        for (let i = 0; i < cellCount; i += 1) {
            const x = startX + i * cellW + (layer === 0 ? shear : shear * 0.25);
            const y = baseY - (layer + 1) * layerH;
            const fill = config.epitheliumView === 'simple'
                ? '#bae6fd'
                : ['#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6'][layer];
            roundRect(ctx, x, y, cellW - 6, layerH - 4, 8, fill, '#2563eb', 1.5);
            ctx.fillStyle = layer > 2 ? '#ffffff' : '#1d4ed8';
            ctx.beginPath();
            ctx.ellipse(x + cellW * 0.42, y + layerH * 0.5, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    roundRect(ctx, startX - 14, baseY + 8, cellCount * cellW + 6, 12, 6, '#cbd5e1', '#94a3b8', 1);

    if (config.microView) {
        drawJunctions(ctx, startX, baseY - layerH, cellW, cellCount, config.time);
    }

    if (config.showLabels) {
        drawLeaderLabel(ctx, startX + 40, baseY - layers * layerH - 20, 340, 216, 'free surface', '#0284c7');
        drawLeaderLabel(ctx, startX + 260, baseY + 14, 455, 578, 'basement membrane', '#64748b');
        drawLeaderLabel(ctx, startX + 520, baseY - 28, 864, 560, 'cell junctions', '#2563eb');
    }
};

const drawConnective = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    if (config.connectiveView === 'blood') {
        drawBlood(ctx, config);
        return;
    }

    if (config.connectiveView === 'bone') {
        drawBone(ctx, config);
        return;
    }

    drawCartilage(ctx, config);
};

const drawCartilage = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    const compression = config.stress * 0.32;
    const top = 266 + compression * 0.55;
    const height = 238 - compression;
    roundRect(ctx, 380, top, 520, height, 34, '#bbf7d0', '#059669', 4);

    for (let i = 0; i < 8; i += 1) {
        const x = 438 + (i % 4) * 116 + Math.sin(config.time + i) * 4;
        const y = top + 54 + Math.floor(i / 4) * 82 + Math.cos(config.time * 1.3 + i) * 4;
        ctx.fillStyle = '#6ee7b7';
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 26, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWavyMatrix(ctx, 410, top + 38, 460, Math.max(60, height - 70), '#10b981', config.time);
    drawPressPlate(ctx, 430, top - 62, 420, config.stress, '#059669');

    if (config.showLabels) {
        drawLeaderLabel(ctx, 520, top + 54, 310, 240, 'chondrocytes', '#047857');
        drawLeaderLabel(ctx, 802, top + 136, 865, 520, 'pliable matrix', '#059669');
    }
};

const drawBone = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    roundRect(ctx, 380, 246, 520, 278, 22, '#f8fafc', '#64748b', 4);

    for (let i = 0; i < 3; i += 1) {
        const cx = 492 + i * 148;
        const cy = 382 + Math.sin(config.time + i) * 1.4;
        for (let r = 72; r >= 22; r -= 18) {
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            drawCell(ctx, cx + Math.cos(a + config.time * 0.12) * 42, cy + Math.sin(a + config.time * 0.12) * 42, 4, '#f59e0b', 0.85);
        }
    }

    drawPressPlate(ctx, 430, 176, 420, config.stress, '#64748b');

    if (config.showLabels) {
        drawLeaderLabel(ctx, 492, 382, 310, 266, 'hard calcium-salt matrix', '#475569');
        drawLeaderLabel(ctx, 640, 382, 850, 536, 'compact lamellae', '#64748b');
    }
};

const drawBlood = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    roundRect(ctx, 300, 288, 680, 184, 92, '#fff7ed', '#f59e0b', 4);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(362, 324, 556, 112);

    for (let i = 0; i < 42; i += 1) {
        const t = (config.time * (0.18 + config.stress / 220) + i / 42) % 1;
        const x = 344 + t * 584;
        const lane = i % 5;
        const y = 340 + lane * 22 + Math.sin(config.time * 2 + i) * 3;
        drawRbc(ctx, x, y);
    }

    for (let i = 0; i < 7; i += 1) {
        const t = (config.time * 0.11 + i / 7) % 1;
        drawCell(ctx, 360 + t * 548, 354 + (i % 4) * 26, 11, '#e0f2fe', 0.95);
    }

    for (let i = 0; i < 16; i += 1) {
        const t = (config.time * 0.25 + i / 16) % 1;
        drawCell(ctx, 350 + t * 570, 338 + (i % 4) * 28, 3.5, '#a855f7', 0.8);
    }

    if (config.showLabels) {
        drawLeaderLabel(ctx, 420, 340, 322, 238, 'plasma matrix', '#d97706');
        drawLeaderLabel(ctx, 670, 370, 838, 258, 'formed elements', '#dc2626');
    }
};

const drawMuscle = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    const activity = config.contraction / 100;
    if (config.muscleView === 'skeletal') {
        drawSkeletalMuscle(ctx, config, activity);
    } else if (config.muscleView === 'smooth') {
        drawSmoothMuscle(ctx, config, activity);
    } else {
        drawCardiacMuscle(ctx, config, activity);
    }
};

const drawSkeletalMuscle = (ctx: CanvasRenderingContext2D, config: DrawConfig, activity: number) => {
    const shift = Math.sin(config.time * 6) * activity * 12;
    for (let row = 0; row < 5; row += 1) {
        const y = 280 + row * 54;
        roundRect(ctx, 300, y, 680, 34, 17, '#fee2e2', '#dc2626', 2);
        for (let x = 320; x < 960; x += 42) {
            ctx.fillStyle = (Math.floor((x + shift) / 42) % 2 === 0) ? '#fecaca' : '#ffffff';
            ctx.fillRect(x + shift % 42, y + 2, 18, 30);
        }
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(300 + shift * 0.4, y + 17);
        ctx.lineTo(980 - shift * 0.4, y + 17);
        ctx.stroke();
    }
    drawSignalPulse(ctx, 276, 402, config.time, '#dc2626');
    if (config.showLabels) {
        drawLeaderLabel(ctx, 450, 288, 315, 218, 'striated fibres', '#dc2626');
        drawLeaderLabel(ctx, 850, 414, 916, 560, 'voluntary control', '#991b1b');
    }
};

const drawSmoothMuscle = (ctx: CanvasRenderingContext2D, config: DrawConfig, activity: number) => {
    for (let i = 0; i < 16; i += 1) {
        const x = 360 + (i % 4) * 150;
        const y = 270 + Math.floor(i / 4) * 70;
        const squeeze = Math.sin(config.time * 3 + i) * activity * 14;
        ctx.fillStyle = '#fde68a';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, 58 - squeeze * 0.2, 18 + squeeze * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.ellipse(x, y, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    drawFlowDots(ctx, 300, 552, config.time, activity);
    if (config.showLabels) {
        drawLeaderLabel(ctx, 514, 270, 342, 208, 'smooth, nonstriated', '#b45309');
        drawLeaderLabel(ctx, 730, 480, 840, 556, 'involuntary waves', '#d97706');
    }
};

const drawCardiacMuscle = (ctx: CanvasRenderingContext2D, config: DrawConfig, activity: number) => {
    const pulse = Math.sin(config.time * (3 + activity * 3));
    const scale = 1 + pulse * activity * 0.035;
    ctx.save();
    ctx.translate(640, 386);
    ctx.scale(scale, scale);
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i += 1) {
        const y = -150 + i * 38;
        ctx.beginPath();
        ctx.moveTo(-260, y);
        ctx.bezierCurveTo(-130, y - 32, -40, y + 32, 100, y - 4);
        ctx.bezierCurveTo(156, y - 20, 214, y - 10, 260, y - 40);
        ctx.stroke();
        if (i % 2 === 0) {
            ctx.beginPath();
            ctx.moveTo(-40, y);
            ctx.lineTo(60, y + 48);
            ctx.stroke();
        }
    }
    ctx.restore();

    for (let x = 360; x < 930; x += 58) {
        ctx.strokeStyle = '#fecdd3';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, 250);
        ctx.lineTo(x + Math.sin(config.time + x) * 18, 520);
        ctx.stroke();
    }

    if (config.showLabels) {
        drawLeaderLabel(ctx, 520, 292, 318, 220, 'branched pattern', '#be123c');
        drawLeaderLabel(ctx, 765, 426, 864, 552, 'striated, involuntary', '#e11d48');
    }
};

const drawFreeSurface = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, time: number) => {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= width; i += 12) {
        const py = y + Math.sin(time * 2 + i * 0.04) * 3;
        if (i === 0) ctx.moveTo(x + i, py);
        else ctx.lineTo(x + i, py);
    }
    ctx.stroke();
};

const drawJunctions = (ctx: CanvasRenderingContext2D, startX: number, y: number, cellW: number, count: number, time: number) => {
    ctx.save();
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -time * 14;
    for (let i = 1; i < count; i += 1) {
        const x = startX + i * cellW - 3;
        ctx.beginPath();
        ctx.moveTo(x, y + 8);
        ctx.lineTo(x, y + 64);
        ctx.stroke();
    }
    ctx.restore();
};

const drawWavyMatrix = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, time: number) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.65;
    for (let i = 0; i < 10; i += 1) {
        const sx = x + i * (width / 9);
        ctx.beginPath();
        for (let j = 0; j <= height; j += 12) {
            const px = sx + Math.sin(j * 0.09 + time + i) * 8;
            if (j === 0) ctx.moveTo(px, y + j);
            else ctx.lineTo(px, y + j);
        }
        ctx.stroke();
    }
    ctx.restore();
};

const drawPressPlate = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, level: number, color: string) => {
    const drop = level * 0.35;
    roundRect(ctx, x, y + drop, width, 18, 7, color, color, 1);
    ctx.fillStyle = color;
    ctx.font = '800 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`load ${level}%`, x + width / 2, y + drop - 8);
    ctx.textAlign = 'left';
};

const drawRbc = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(x, y, 15, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fecaca';
    ctx.beginPath();
    ctx.ellipse(x, y, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
};

const drawSignalPulse = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, color: string) => {
    for (let i = 0; i < 4; i += 1) {
        const phase = (time * 0.85 + i * 0.25) % 1;
        drawCell(ctx, x + phase * 720, y + Math.sin(phase * Math.PI * 4) * 18, 6, color, 1 - phase * 0.75);
    }
};

const drawFlowDots = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, activity: number) => {
    for (let i = 0; i < 12; i += 1) {
        const phase = (time * (0.2 + activity * 0.5) + i / 12) % 1;
        drawCell(ctx, x + phase * 680, y + Math.sin(phase * Math.PI * 2) * 14, 4, '#d97706', 0.8);
    }
};

const drawModeBadge = (ctx: CanvasRenderingContext2D, config: DrawConfig) => {
    ctx.save();
    ctx.textAlign = 'left';
    roundRect(ctx, 904, 108, 196, 42, 14, '#ffffff', '#fecdd3', 2);
    ctx.fillStyle = '#881337';
    ctx.font = '800 15px Arial';
    ctx.fillText(modeNames[config.mode], 924, 134);
    ctx.restore();
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

const TissueMapSvg = ({ active }: { active: Mode }) => {
    const rows = [
        { y: 85, label: 'Epithelial', color: '#0284c7', active: active === 'epithelial' || active === 'overview' },
        { y: 106, label: 'Connective', color: '#d97706', active: active === 'connective' || active === 'overview' },
        { y: 127, label: 'Muscular', color: '#dc2626', active: active === 'muscle' || active === 'overview' },
        { y: 148, label: 'Neural', color: '#7c3aed', active: active === 'overview' }
    ];

    return (
        <svg viewBox="0 0 300 198" className="h-[198px] w-full">
            <rect width="300" height="198" rx="14" fill="#ffffff" />
            <defs>
                <marker id="tissue-map-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                    <path d="M0,0 L7,3.5 L0,7 Z" fill="#94a3b8" />
                </marker>
            </defs>

            <MiniFlowBox x={18} y={12} width={62} height={34} label="Cells" color="#475569" />
            <MiniFlowBox x={106} y={12} width={86} height={34} label="Tissues" color="#881337" />
            <MiniFlowBox x={220} y={12} width={62} height={34} label="Organs" color="#0f766e" />
            <line x1="82" y1="29" x2="102" y2="29" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#tissue-map-arrow)" />
            <line x1="194" y1="29" x2="216" y2="29" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#tissue-map-arrow)" />

            <rect x="54" y="62" width="192" height="98" rx="13" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.8" />
            <text x="150" y="57" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#881337">four basic tissue types</text>
            {rows.map((row) => (
                <g key={row.label}>
                    <rect x="72" y={row.y - 10} width="156" height="17" rx="7" fill={row.active ? row.color : '#ffffff'} stroke={row.color} strokeWidth="1.5" />
                    <text x="150" y={row.y + 2.5} textAnchor="middle" fontSize="9.8" fontWeight="900" fill={row.active ? '#ffffff' : row.color}>{row.label}</text>
                </g>
            ))}

            <MiniFlowBox x={92} y={170} width={116} height={24} label="Organ systems" color="#4338ca" />
            <line x1="251" y1="29" x2="251" y2="182" stroke="#cbd5e1" strokeWidth="1.8" strokeDasharray="4 4" />
            <line x1="251" y1="182" x2="212" y2="182" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#tissue-map-arrow)" />
        </svg>
    );
};

const MiniFlowBox = ({
    x,
    y,
    width,
    height,
    label,
    color
}: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    color: string;
}) => (
    <g>
        <rect x={x} y={y} width={width} height={height} rx="10" fill="#ffffff" stroke={color} strokeWidth="2" />
        <text x={x + width / 2} y={y + height / 2 + 3.5} textAnchor="middle" fontSize={height < 30 ? 9.4 : 10.5} fontWeight="900" fill={color}>{label}</text>
    </g>
);

const MatrixSvg = ({ active }: { active: ConnectiveView }) => (
    <svg viewBox="0 0 300 162" className="h-[162px] w-full">
        <rect width="300" height="162" rx="14" fill="#ffffff" />
        <MatrixBar y={38} label="Blood" value="fluid plasma" color="#ef4444" active={active === 'blood'} />
        <MatrixBar y={82} label="Cartilage" value="pliable" color="#059669" active={active === 'cartilage'} />
        <MatrixBar y={126} label="Bone" value="hard calcium" color="#64748b" active={active === 'bone'} />
    </svg>
);

const MatrixBar = ({ y, label, value, color, active }: { y: number; label: string; value: string; color: string; active: boolean }) => (
    <g>
        <rect x="22" y={y - 17} width="256" height="34" rx="10" fill={active ? '#fff7ed' : '#ffffff'} stroke={active ? color : '#e2e8f0'} strokeWidth="2" />
        <circle cx="42" cy={y} r="7" fill={color} />
        <text x="60" y={y + 4} fontSize="12" fontWeight="900" fill="#0f172a">{label}</text>
        <text x="172" y={y + 4} fontSize="11" fontWeight="800" fill="#64748b">{value}</text>
    </g>
);

const MuscleClassesSvg = ({ active }: { active: MuscleView }) => (
    <svg viewBox="0 0 300 162" className="h-[162px] w-full">
        <rect width="300" height="162" rx="14" fill="#ffffff" />
        <MuscleClassRow y={36} label="Skeletal" note="striated, voluntary" color="#dc2626" active={active === 'skeletal'} />
        <MuscleClassRow y={82} label="Smooth" note="nonstriated, involuntary" color="#d97706" active={active === 'smooth'} />
        <MuscleClassRow y={128} label="Cardiac" note="branched, involuntary" color="#be123c" active={active === 'cardiac'} />
    </svg>
);

const MuscleClassRow = ({ y, label, note, color, active }: { y: number; label: string; note: string; color: string; active: boolean }) => (
    <g>
        <rect x="18" y={y - 17} width="264" height="34" rx="10" fill={active ? '#fff1f2' : '#ffffff'} stroke={active ? color : '#e2e8f0'} strokeWidth="2" />
        <line x1="36" y1={y} x2="74" y2={y} stroke={color} strokeWidth="6" strokeLinecap="round" />
        <text x="88" y={y + 4} fontSize="12" fontWeight="900" fill="#0f172a">{label}</text>
        <text x="160" y={y + 4} fontSize="10.5" fontWeight="800" fill="#64748b">{note}</text>
    </g>
);

const ValueRow = ({ label, value, tone }: { label: string; value: string; tone: 'rose' | 'cyan' | 'amber' | 'green' | 'slate' }) => {
    const styles: Record<typeof tone, string> = {
        rose: 'bg-rose-50 text-rose-700',
        cyan: 'bg-cyan-50 text-cyan-700',
        amber: 'bg-amber-50 text-amber-700',
        green: 'bg-green-50 text-green-700',
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
                className={`min-h-[36px] rounded-lg border px-2 text-xs font-extrabold transition-colors ${value === option.id ? 'border-rose-600 bg-rose-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50'}`}
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
                className="w-full accent-rose-600"
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
        className={`min-h-[36px] rounded-lg border px-2 text-xs font-extrabold transition-colors ${active ? 'border-rose-600 bg-rose-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50'}`}
    >
        {label}
    </button>
);

export default AnimalTissuesLab;
