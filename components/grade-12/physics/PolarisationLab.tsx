import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Pause, Play, RotateCcw, SlidersHorizontal, Sun } from 'lucide-react';
import { Topic } from '../../../types';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PolarisationLabProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'two' | 'three';

interface Snapshot {
    mode: Mode;
    analyzerAngle: number;
    middleAngle: number;
    incidentIntensity: number;
    showVectors: boolean;
    isPlaying: boolean;
}

const WIDTH = 1280;
const HEIGHT = 760;
const degreesToRadians = (degrees: number) => degrees * Math.PI / 180;

const PolarisationLab: React.FC<PolarisationLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const [mode, setMode] = useState<Mode>('two');
    const [analyzerAngle, setAnalyzerAngle] = useState(55);
    const [middleAngle, setMiddleAngle] = useState(45);
    const [incidentIntensity, setIncidentIntensity] = useState(100);
    const [showVectors, setShowVectors] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);

    const firstPolariserIntensity = incidentIntensity / 2;
    const twoPolaroidIntensity = firstPolariserIntensity * Math.cos(degreesToRadians(analyzerAngle)) ** 2;
    const threePolaroidIntensity = firstPolariserIntensity / 4 * Math.sin(2 * degreesToRadians(middleAngle)) ** 2;
    const transmittedIntensity = mode === 'two' ? twoPolaroidIntensity : threePolaroidIntensity;
    const incidentRatio = transmittedIntensity / incidentIntensity;

    const snapshotRef = useRef<Snapshot>({
        mode,
        analyzerAngle,
        middleAngle,
        incidentIntensity,
        showVectors,
        isPlaying
    });

    useEffect(() => {
        snapshotRef.current = { mode, analyzerAngle, middleAngle, incidentIntensity, showVectors, isPlaying };
    }, [analyzerAngle, incidentIntensity, isPlaying, middleAngle, mode, showVectors]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        const draw = (time: number) => {
            const state = snapshotRef.current;
            const dpr = window.devicePixelRatio || 1;
            if (canvas.width !== WIDTH * dpr || canvas.height !== HEIGHT * dpr) {
                canvas.width = WIDTH * dpr;
                canvas.height = HEIGHT * dpr;
            }
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawScene(context, state, time / 1000);
            animationRef.current = requestAnimationFrame(draw);
        };

        animationRef.current = requestAnimationFrame(draw);
        return () => {
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    const readouts = useMemo(() => {
        if (mode === 'two') {
            return [
                ['After P1', `${firstPolariserIntensity.toFixed(1)} units`, '50% of incident'],
                ['After analyser', `${twoPolaroidIntensity.toFixed(1)} units`, `${(incidentRatio * 100).toFixed(1)}% of incident`],
                ['Field component', `E cos ${analyzerAngle} deg`, `cos = ${Math.cos(degreesToRadians(analyzerAngle)).toFixed(3)}`]
            ];
        }
        return [
            ['After P1', `${firstPolariserIntensity.toFixed(1)} units`, '50% of incident'],
            ['After crossed P3', `${threePolaroidIntensity.toFixed(1)} units`, `${(incidentRatio * 100).toFixed(1)}% of incident`],
            ['Middle axis', `${middleAngle} deg`, middleAngle === 45 ? 'Maximum transmission' : 'Rotate toward 45 deg']
        ];
    }, [analyzerAngle, firstPolariserIntensity, incidentRatio, middleAngle, mode, threePolaroidIntensity, twoPolaroidIntensity]);

    const reset = () => {
        setMode('two');
        setAnalyzerAngle(55);
        setMiddleAngle(45);
        setIncidentIntensity(100);
        setShowVectors(true);
        setIsPlaying(true);
    };

    const simulation = (
        <div className="relative h-full w-full overflow-hidden bg-[#0f172a]">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Polarisation apparatus simulation" />
            <div className="pointer-events-none absolute left-6 top-6 rounded-xl border border-cyan-400/25 bg-slate-950/80 px-4 py-3 shadow-xl backdrop-blur">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">NCERT Wave Optics 10.7</div>
                <div className="mt-1 text-lg font-extrabold text-white">Polarisation proves light is transverse</div>
            </div>
            <div className="pointer-events-none absolute bottom-5 left-6 flex gap-3">
                {readouts.map(([label, value, note]) => (
                    <div key={label} className="w-48 rounded-xl border border-white/10 bg-slate-950/85 px-4 py-3 shadow-xl backdrop-blur">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
                        <div className="mt-1 font-mono text-base font-extrabold text-cyan-300">{value}</div>
                        <div className="mt-1 text-xs text-slate-400">{note}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const controls = (
        <div className="w-full space-y-4 p-4 text-slate-900">
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMode('two')} className={modeButton(mode === 'two')}>
                    <SlidersHorizontal size={16} /> Two polaroids
                </button>
                <button onClick={() => setMode('three')} className={modeButton(mode === 'three')}>
                    <Eye size={16} /> Crossed + middle
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <ControlCard title={mode === 'two' ? 'Analyzer angle' : 'Middle polaroid angle'} value={`${mode === 'two' ? analyzerAngle : middleAngle} deg`}>
                    <input
                        aria-label={mode === 'two' ? 'Analyzer angle' : 'Middle polaroid angle'}
                        type="range"
                        min="0"
                        max={mode === 'two' ? 180 : 90}
                        step="1"
                        value={mode === 'two' ? analyzerAngle : middleAngle}
                        onChange={(event) => mode === 'two' ? setAnalyzerAngle(+event.target.value) : setMiddleAngle(+event.target.value)}
                        className="w-full accent-cyan-600"
                    />
                    <div className="mt-2 flex gap-2">
                        {(mode === 'two' ? [0, 45, 90] : [0, 45, 90]).map((angle) => (
                            <button
                                key={angle}
                                onClick={() => mode === 'two' ? setAnalyzerAngle(angle) : setMiddleAngle(angle)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:border-cyan-400 hover:text-cyan-700"
                            >
                                {angle} deg
                            </button>
                        ))}
                    </div>
                </ControlCard>

                <ControlCard title="Incident intensity" value={`${incidentIntensity} units`}>
                    <input
                        aria-label="Incident intensity"
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={incidentIntensity}
                        onChange={(event) => setIncidentIntensity(+event.target.value)}
                        className="w-full accent-amber-500"
                    />
                    <button onClick={() => setShowVectors((value) => !value)} className={toggleButton(showVectors)}>
                        Electric-field vectors {showVectors ? 'shown' : 'hidden'}
                    </button>
                </ControlCard>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
                    {mode === 'two' ? (
                        <>
                            <div className="font-extrabold">Malus' law: I = I0 cos^2(theta) (NCERT Eq. 10.18)</div>
                            <div className="mt-1 text-xs">Here I0 is the polarised intensity after P1: {firstPolariserIntensity.toFixed(1)} units. Axes at 90 deg are crossed, so I = 0.</div>
                        </>
                    ) : (
                        <>
                            <div className="font-extrabold">I = (I0/4) sin^2(2 theta) (NCERT Example 10.2)</div>
                            <div className="mt-1 text-xs">P1 and P3 stay crossed. The middle sheet restores transmission, greatest at theta = 45 deg.</div>
                        </>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsPlaying((value) => !value)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50">
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />} {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50">
                        <RotateCcw size={16} /> Reset
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulation}
            ControlsComponent={controls}
        />
    );
};

const ControlCard: React.FC<{ title: string; value: string; children: React.ReactNode }> = ({ title, value, children }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-extrabold text-slate-800">{title}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-600">{value}</span>
        </div>
        {children}
    </div>
);

const modeButton = (active: boolean) => `flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold transition ${active
    ? 'bg-cyan-600 text-white shadow-md'
    : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-300'}`;

const toggleButton = (active: boolean) => `mt-3 w-full rounded-lg border px-3 py-2 text-xs font-bold transition ${active
    ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
    : 'border-slate-200 bg-slate-50 text-slate-500'}`;

function drawScene(ctx: CanvasRenderingContext2D, state: Snapshot, time: number) {
    const animatedTime = state.isPlaying ? time : 0;
    const angle = state.mode === 'two' ? state.analyzerAngle : state.middleAngle;
    const i1 = state.incidentIntensity / 2;
    const output = state.mode === 'two'
        ? i1 * Math.cos(degreesToRadians(angle)) ** 2
        : i1 / 4 * Math.sin(2 * degreesToRadians(angle)) ** 2;
    const brightness = output / state.incidentIntensity;

    const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    background.addColorStop(0, '#0f172a');
    background.addColorStop(1, '#111827');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
    }

    const cy = 345;
    const sourceX = 115;
    const firstX = 420;
    const middleX = 650;
    const finalX = state.mode === 'three' ? 860 : 760;
    const detectorX = 1040;

    drawSource(ctx, sourceX, cy, animatedTime);
    drawBeam(ctx, 170, firstX - 28, cy, 0.5, '#fef3c7');
    drawUnpolarisedVectors(ctx, 210, firstX - 55, cy, animatedTime, state.showVectors);
    drawPolaroid(ctx, firstX, cy, 0, '#22d3ee', 'P1', 'Pass axis 0 deg');
    drawBeam(ctx, firstX + 28, (state.mode === 'three' ? middleX : finalX) - 28, cy, 0.42, '#67e8f9');
    drawPolarisedWave(ctx, firstX + 45, (state.mode === 'three' ? middleX : finalX) - 45, cy, 0, 1, animatedTime, state.showVectors);

    if (state.mode === 'three') {
        drawPolaroid(ctx, middleX, cy, state.middleAngle, '#a78bfa', 'P2', `Middle ${state.middleAngle} deg`);
        drawBeam(ctx, middleX + 28, finalX - 28, cy, Math.cos(degreesToRadians(state.middleAngle)) ** 2 * 0.42, '#c4b5fd');
        drawPolarisedWave(ctx, middleX + 45, finalX - 45, cy, state.middleAngle, Math.abs(Math.cos(degreesToRadians(state.middleAngle))), animatedTime, state.showVectors);
        drawPolaroid(ctx, finalX, cy, 90, '#60a5fa', 'P3', 'Crossed at 90 deg');
    } else {
        drawPolaroid(ctx, finalX, cy, state.analyzerAngle, '#60a5fa', 'P2', `Analyzer ${state.analyzerAngle} deg`);
    }

    drawBeam(ctx, finalX + 28, detectorX - 40, cy, Math.max(0.015, brightness), '#fde68a');
    drawPolarisedWave(ctx, finalX + 45, detectorX - 55, cy, state.mode === 'three' ? 90 : state.analyzerAngle, Math.sqrt(Math.max(0, brightness * 2)), animatedTime, state.showVectors);
    drawDetector(ctx, detectorX, cy, brightness, output);
    drawGraph(ctx, 910, 80, 320, 190, state.mode, angle, brightness);
}

function drawSource(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 25 + Math.sin(time * 4) * 4;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
    label(ctx, 'Unpolarised source', x, y + 70, '#f8fafc', 'center', 'bold 14px Inter');
    label(ctx, 'I incident', x, y + 91, '#94a3b8');
    ctx.restore();
}

function drawBeam(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, opacity: number, color: string) {
    const gradient = ctx.createLinearGradient(x1, 0, x2, 0);
    gradient.addColorStop(0, `${color}${Math.round(Math.min(1, opacity) * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${color}${Math.round(Math.min(1, opacity) * 180).toString(16).padStart(2, '0')}`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x1, y - 24, Math.max(0, x2 - x1), 48);
}

function drawUnpolarisedVectors(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, time: number, visible: boolean) {
    if (!visible) return;
    for (let x = x1; x < x2; x += 34) {
        const angle = (x * 0.071 + time * 2.2) % Math.PI;
        vector(ctx, x, y, angle * 180 / Math.PI, 24, '#fde68a', 0.75);
    }
}

function drawPolarisedWave(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, angle: number, amplitude: number, time: number, visible: boolean) {
    if (!visible || x2 <= x1) return;
    for (let x = x1; x < x2; x += 38) {
        const pulse = Math.sin((x - x1) * 0.055 - time * 5);
        vector(ctx, x, y, angle, 28 * amplitude * pulse, '#67e8f9', 0.9);
    }
}

function vector(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, length: number, color: string, opacity: number) {
    const radians = degreesToRadians(angle);
    const dx = Math.sin(radians) * length;
    const dy = Math.cos(radians) * length;
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - dx, y + dy); ctx.lineTo(x + dx, y - dy); ctx.stroke();
    ctx.globalAlpha = 1;
}

function drawPolaroid(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, name: string, detail: string) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.roundRect(-26, -112, 52, 224, 12); ctx.fill(); ctx.stroke();
    ctx.rotate(degreesToRadians(angle));
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -86); ctx.lineTo(0, 86); ctx.stroke();
    ctx.restore();
    label(ctx, name, x, y - 145, color, 'center', 'bold 18px Inter');
    label(ctx, detail, x, y + 142, '#cbd5e1', 'center', '12px Inter');
}

function drawDetector(ctx: CanvasRenderingContext2D, x: number, y: number, brightness: number, intensity: number) {
    ctx.save();
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x - 38, y - 88, 76, 176, 14); ctx.fill(); ctx.stroke();
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 35 * brightness;
    ctx.fillStyle = `rgba(254, 240, 138, ${Math.max(0.04, brightness)})`;
    ctx.beginPath(); ctx.arc(x, y, 27, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    label(ctx, 'Detector', x, y - 118, '#f8fafc', 'center', 'bold 15px Inter');
    label(ctx, `${intensity.toFixed(1)} units`, x, y + 116, '#fde68a', 'center', 'bold 14px monospace');
}

function drawGraph(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, mode: Mode, angle: number, brightness: number) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, width, height, 14); ctx.fill(); ctx.stroke();
    label(ctx, mode === 'two' ? "Malus' law curve" : 'Crossed polaroids + middle sheet', x + 18, y + 24, '#f8fafc', 'left', 'bold 13px Inter');
    const left = x + 38;
    const top = y + 48;
    const graphWidth = width - 58;
    const graphHeight = height - 76;
    ctx.strokeStyle = '#475569';
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, top + graphHeight); ctx.lineTo(left + graphWidth, top + graphHeight); ctx.stroke();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const maxAngle = mode === 'two' ? 180 : 90;
    for (let a = 0; a <= maxAngle; a += 2) {
        const ratio = mode === 'two'
            ? 0.5 * Math.cos(degreesToRadians(a)) ** 2
            : 0.125 * Math.sin(2 * degreesToRadians(a)) ** 2;
        const px = left + a / maxAngle * graphWidth;
        const py = top + graphHeight - ratio / 0.5 * graphHeight;
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    const dotX = left + angle / maxAngle * graphWidth;
    const dotY = top + graphHeight - brightness / 0.5 * graphHeight;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(dotX, dotY, 6, 0, Math.PI * 2); ctx.fill();
    label(ctx, 'I / I incident', left - 6, top - 9, '#94a3b8', 'left', '10px Inter');
    label(ctx, `angle 0-${maxAngle} deg`, left + graphWidth / 2, y + height - 10, '#94a3b8', 'center', '10px Inter');
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'center', font = '12px Inter') {
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.font = font;
    ctx.fillText(text, x, y);
}

export default PolarisationLab;
