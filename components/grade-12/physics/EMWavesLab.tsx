import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Radio, Eye, EyeOff, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type SimulationMode = 'wave' | 'spectrum';

interface EMWavesLabProps {
    topic: any;
    onExit: () => void;
}

type Band = {
    name: string;
    shortName: string;
    color: string;
    x0: number;
    x1: number;
    wavelength: string;
    frequency: string;
    production: string;
    application: string;
};

type LiveValues = {
    wavelength: number;
    frequency: number;
    e0: number;
    b0Visual: number;
    speed: number;
    hoveredBand: string;
};

const CANVAS_W = 1280;
const CANVAS_H = 760;
const C_LIGHT = '3 × 10⁸ m/s';
const B_VISUAL_RATIO = 0.55;

const BANDS: Band[] = [
    {
        name: 'Radio waves',
        shortName: 'Radio',
        color: '#ef4444',
        x0: 80,
        x1: 280,
        wavelength: '> 0.1 m',
        frequency: '500 kHz – 1000 MHz',
        production: 'Rapid acceleration of electrons in aerials',
        application: 'AM (530–1710 kHz), FM (88–108 MHz), TV (54–890 MHz)',
    },
    {
        name: 'Microwaves',
        shortName: 'Micro-wave',
        color: '#f97316',
        x0: 280,
        x1: 430,
        wavelength: '1 mm – 0.1 m',
        frequency: '10⁸ – 10¹¹ Hz',
        production: 'Klystron valve or magnetron valve',
        application: 'Radar, microwave ovens',
    },
    {
        name: 'Infrared',
        shortName: 'Infrared',
        color: '#f59e0b',
        x0: 430,
        x1: 580,
        wavelength: '700 nm – 1 mm',
        frequency: '10¹¹ – 10¹⁴ Hz',
        production: 'Vibration of atoms and molecules',
        application: 'TV remote controls, thermal imaging, greenhouse effect',
    },
    {
        name: 'Visible light',
        shortName: 'VISIBLE',
        color: '#22c55e',
        x0: 580,
        x1: 740,
        wavelength: '400 nm – 700 nm',
        frequency: '4×10¹⁴ – 7×10¹⁴ Hz',
        production: 'Electrons moving between energy levels in atoms',
        application: 'Human vision; violet 400 nm → red 700 nm',
    },
    {
        name: 'Ultraviolet',
        shortName: 'UV',
        color: '#8b5cf6',
        x0: 740,
        x1: 900,
        wavelength: '1 nm – 400 nm',
        frequency: '10¹⁵ – 10¹⁷ Hz',
        production: 'Inner shell electron transitions in atoms',
        application: 'Sterilization; causes sunburn',
    },
    {
        name: 'X-rays',
        shortName: 'X-rays',
        color: '#93c5fd',
        x0: 900,
        x1: 1100,
        wavelength: '10⁻¹³ m – 10⁻⁸ m',
        frequency: '10¹⁶ – 10²⁰ Hz',
        production: 'High-energy electrons bombarding metal target',
        application: 'Medical diagnosis; cancer treatment',
    },
    {
        name: 'Gamma rays',
        shortName: 'γ-rays',
        color: '#f8fafc',
        x0: 1100,
        x1: 1200,
        wavelength: '< 10⁻¹⁰ m',
        frequency: '10¹⁹ – 10²³ Hz',
        production: 'Radioactive decay of nucleus',
        application: 'Cancer cell destruction; nuclear medicine',
    },
];

const EMWavesLab: React.FC<EMWavesLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const lastTimeRef = useRef(performance.now());
    const timeAccRef = useRef(0);
    const hoverXRef = useRef(640);
    const lastLiveUpdateRef = useRef(0);

    const [mode, setMode] = useState<SimulationMode>('wave');
    const [isPlaying, setIsPlaying] = useState(true);
    const [wavelength, setWavelength] = useState(200);
    const [amplitude, setAmplitude] = useState(80);
    const [speed, setSpeed] = useState(150);
    const [showPlanes, setShowPlanes] = useState(true);
    const [showEBArrow, setShowEBArrow] = useState(true);
    const [hoveredBandName, setHoveredBandName] = useState('Visible light');
    const [liveValues, setLiveValues] = useState<LiveValues>({
        wavelength: 200,
        frequency: 0.75,
        e0: 80,
        b0Visual: 44,
        speed: 150,
        hoveredBand: 'Visible light',
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
    }, []);

    const updateLiveValues = useCallback((timeMs: number, values: LiveValues) => {
        if (timeMs - lastLiveUpdateRef.current < 100) return;
        lastLiveUpdateRef.current = timeMs;
        setLiveValues(values);
    }, []);

    const reset = useCallback(() => {
        setWavelength(200);
        setAmplitude(80);
        setSpeed(150);
        setShowPlanes(true);
        setShowEBArrow(true);
        setIsPlaying(true);
        timeAccRef.current = 0;
        lastTimeRef.current = performance.now();
        hoverXRef.current = 640;
        setHoveredBandName('Visible light');
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const render = (timeMs: number) => {
            const dt = Math.min((timeMs - lastTimeRef.current) / 1000, 0.1);
            lastTimeRef.current = timeMs;

            if (isPlaying && mode === 'wave') {
                const angularSpeed = (2 * Math.PI * speed) / wavelength;
                timeAccRef.current += dt * angularSpeed;
            }

            drawBackground(ctx);
            if (mode === 'wave') {
                drawWaveMode(ctx, timeAccRef.current, wavelength, amplitude, speed, showPlanes, showEBArrow);
                updateLiveValues(timeMs, {
                    wavelength,
                    frequency: speed / wavelength,
                    e0: amplitude,
                    b0Visual: amplitude * B_VISUAL_RATIO,
                    speed,
                    hoveredBand: hoveredBandName,
                });
            } else {
                const band = drawSpectrumMode(ctx, hoverXRef.current);
                if (band.name !== hoveredBandName) setHoveredBandName(band.name);
                updateLiveValues(timeMs, {
                    wavelength,
                    frequency: speed / wavelength,
                    e0: amplitude,
                    b0Visual: amplitude * B_VISUAL_RATIO,
                    speed,
                    hoveredBand: band.name,
                });
            }

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [amplitude, hoveredBandName, isPlaying, mode, showEBArrow, showPlanes, speed, updateLiveValues, wavelength]);

    const canvasPoint = (event: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (CANVAS_W / rect.width),
            y: (event.clientY - rect.top) * (CANVAS_H / rect.height),
        };
    };

    const handleCanvasMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const { x } = canvasPoint(event);
        hoverXRef.current = clamp(x, 80, 1200);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const { x } = canvasPoint(event);
        hoverXRef.current = clamp(x, 80, 1200);
    };

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+22px)] top-0 z-20 hidden w-[370px] 2xl:block">
            <div className="flex flex-col gap-3">
                {mode === 'wave' ? (
                    <>
                        <InfoGraphCard title="Field Geometry" subtitle="NCERT Fig. 8.3 orientation">
                            <MiniWaveGeometry />
                        </InfoGraphCard>
                        <InfoGraphCard title="Maxwell Link" subtitle="Oscillating fields regenerate each other">
                            <div className="space-y-2 text-sm font-semibold text-slate-200">
                                <div className="rounded-lg bg-slate-900 px-3 py-2 text-rose-300">Changing E → magnetic field</div>
                                <div className="rounded-lg bg-slate-900 px-3 py-2 text-sky-300">Changing B → electric field</div>
                                <div className="rounded-lg bg-slate-900 px-3 py-2 text-emerald-300">E × B → Z propagation</div>
                                <div className="text-xs leading-relaxed text-slate-400">No material medium is required; the coupled fields carry energy through space.</div>
                            </div>
                        </InfoGraphCard>
                    </>
                ) : (
                    <>
                        <InfoGraphCard title="Spectrum Order" subtitle="Increasing wavelength → decreasing frequency">
                            <SpectrumMiniBar />
                        </InfoGraphCard>
                        <InfoGraphCard title="Selected Band" subtitle="Hover the canvas spectrum bar">
                            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                                <div className="text-lg font-extrabold text-white">{liveValues.hoveredBand}</div>
                                <div className="mt-2 text-sm leading-relaxed text-slate-300">
                                    There is no sharp boundary between neighbouring EM-wave regions.
                                </div>
                            </div>
                        </InfoGraphCard>
                    </>
                )}
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 z-20 hidden w-[320px] 2xl:block">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/95 p-4 text-indigo-950 shadow-xl backdrop-blur">
                <div className="text-base font-extrabold">{mode === 'wave' ? 'EM wave propagation' : 'EM spectrum'}</div>
                <div className="mt-2 space-y-1.5 text-sm leading-snug text-indigo-900">
                    {mode === 'wave' ? (
                        <>
                            <p>E and B are perpendicular and in phase.</p>
                            <p>Propagation direction is E × B.</p>
                            <p>B₀ ≪ E₀ in SI; B is scaled here for visibility.</p>
                            <p>Accelerated charges radiate EM waves.</p>
                        </>
                    ) : (
                        <>
                            <p>All bands travel at c = 3 × 10⁸ m/s in vacuum.</p>
                            <p>Classification is based on production and detection.</p>
                            <p>No sharp division exists between neighbouring bands.</p>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">Live</span>
                </div>
                <div className="grid gap-2">
                    {getReadoutItems(mode, liveValues).map(item => (
                        <div key={item.label} className={`rounded-lg border border-slate-100 ${item.bg} px-3 py-2.5`}>
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
                            <div className={`mt-1 font-mono text-base font-extrabold ${item.color}`}>{item.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-slate-900 shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#0f172a]">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    className="absolute inset-0 h-[760px] w-[1280px] touch-none"
                    onMouseMove={handleCanvasMove}
                    onPointerMove={handlePointerMove}
                />
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="w-full space-y-4 p-4 text-slate-900">
            <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMode('wave')} className={tabClass(mode === 'wave')}>
                    <Zap size={18} /> Wave Propagation
                </button>
                <button type="button" onClick={() => setMode('spectrum')} className={tabClass(mode === 'spectrum')}>
                    <Radio size={18} /> EM Spectrum
                </button>
            </div>

            {mode === 'wave' ? (
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-950">
                        <div className="font-mono text-base font-extrabold">Ex = E₀ sin(kz − ωt) &nbsp; By = B₀ sin(kz − ωt)</div>
                        <div className="mt-2 font-semibold">E ⊥ B ⊥ propagation • E × B = propagation direction</div>
                        <div className="mt-1">c = 1/√(μ₀ε₀) = 3×10⁸ m/s • B₀ = E₀/c</div>
                        <div className="mt-1">Source: accelerated/oscillating charges</div>
                    </div>

                    <div className="space-y-3">
                        <SliderControl
                            label="Wavelength (λ)"
                            value={`${wavelength} px (visual)`}
                            valueClass="text-indigo-700 bg-indigo-50"
                            min={100}
                            max={500}
                            step={10}
                            valueNumber={wavelength}
                            onChange={setWavelength}
                            accent="accent-indigo-500"
                            leftTick="Short (γ-rays)"
                            rightTick="Long (Radio)"
                        />
                        <SliderControl
                            label="Amplitude E₀"
                            value={`${amplitude} arb. units`}
                            valueClass="text-red-700 bg-red-50"
                            min={40}
                            max={140}
                            step={5}
                            valueNumber={amplitude}
                            onChange={setAmplitude}
                            accent="accent-red-500"
                        />
                        <SliderControl
                            label="Speed"
                            value={`${speed} px/s (visual c)`}
                            valueClass="text-emerald-700 bg-emerald-50"
                            min={50}
                            max={300}
                            step={25}
                            valueNumber={speed}
                            onChange={setSpeed}
                            accent="accent-emerald-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <ToggleButton active={showPlanes} onClick={() => setShowPlanes(value => !value)} label="Planes" />
                            <ToggleButton active={showEBArrow} onClick={() => setShowEBArrow(value => !value)} label="E×B Arrow" />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                            <div className="font-mono font-bold text-slate-900">ν = c/λ = {(speed / wavelength).toFixed(2)}</div>
                            <div className="mt-1 font-mono text-blue-700">B₀ visual = {(amplitude * B_VISUAL_RATIO).toFixed(1)}</div>
                            <div className="mt-1 text-xs">B₀ ≪ E₀ in reality (ratio = c = 3×10⁸)</div>
                            <div className="mt-1 text-xs font-bold text-emerald-700">Energy: uE = uB ✓</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <ControlButton onClick={() => setIsPlaying(value => !value)} icon={isPlaying ? <Pause size={18} /> : <Play size={18} />} label={isPlaying ? 'Pause' : 'Play'} />
                            <ControlButton onClick={reset} icon={<RotateCcw size={18} />} label="Reset" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-950">
                        <div className="font-bold">Hover over the spectrum bar above to explore each band.</div>
                        <div className="mt-1">All EM waves travel at c = 3×10⁸ m/s in vacuum regardless of frequency.</div>
                        <div className="mt-1">Production method varies; detection requires different instruments.</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
                        <div className="font-bold text-slate-900">Hertz and radio communication</div>
                        <div className="mt-1">Heinrich Hertz (1887) first produced and detected EM waves in a laboratory.</div>
                        <div className="mt-1">J.C. Bose (Kolkata) produced EM waves of 25–5 mm wavelength.</div>
                        <div className="mt-1">Marconi transmitted EM waves over long distances.</div>
                    </div>
                </div>
            )}
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

function drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_H);
        ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
    }
}

function drawWaveMode(
    ctx: CanvasRenderingContext2D,
    timeAcc: number,
    wavelength: number,
    amplitude: number,
    speed: number,
    showPlanes: boolean,
    showEBArrow: boolean
) {
    const origin = { x: 120, y: 480 };
    const axisLen = 880;
    const to2D = (z: number, ex: number, by: number) => ({
        x: origin.x + z - by * 0.866,
        y: origin.y - ex + by * 0.5,
    });

    drawCanvasTitle(ctx, 'EM Wave Propagation (NCERT Fig. 8.3)', 'Ex = E₀ sin(kz − ωt)   |   By = B₀ sin(kz − ωt)   |   E ⊥ B ⊥ Z');

    if (showPlanes) {
        drawWavePlanes(ctx, to2D, amplitude, axisLen);
    }

    drawAxes(ctx, origin, to2D, amplitude, axisLen);

    const ePath = new Path2D();
    const bPath = new Path2D();
    const k = (2 * Math.PI) / wavelength;
    const points = 300;
    const vectorEvery = 12;

    for (let i = 0; i <= points; i++) {
        const z = (i / points) * axisLen;
        const phase = k * z - timeAcc;
        const ex = amplitude * Math.sin(phase);
        const by = amplitude * B_VISUAL_RATIO * Math.sin(phase);
        const base = to2D(z, 0, 0);
        const eTip = to2D(z, ex, 0);
        const bTip = to2D(z, 0, by);

        if (i % vectorEvery === 0) {
            ctx.strokeStyle = 'rgba(239,68,68,0.45)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(base.x, base.y);
            ctx.lineTo(eTip.x, eTip.y);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(59,130,246,0.45)';
            ctx.beginPath();
            ctx.moveTo(base.x, base.y);
            ctx.lineTo(bTip.x, bTip.y);
            ctx.stroke();
        }

        if (i === 0) {
            ePath.moveTo(eTip.x, eTip.y);
            bPath.moveTo(bTip.x, bTip.y);
        } else {
            ePath.lineTo(eTip.x, eTip.y);
            bPath.lineTo(bTip.x, bTip.y);
        }
    }

    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.stroke(ePath);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.stroke(bPath);
    ctx.restore();

    if (showEBArrow) {
        drawArrow(ctx, to2D(380, 0, 0).x, to2D(380, 0, 0).y - 28, to2D(520, 0, 0).x, to2D(520, 0, 0).y - 28, '#22c55e', 3);
        ctx.fillStyle = '#22c55e';
        ctx.font = '800 12px Inter, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('E × B', to2D(450, 0, 0).x, to2D(450, 0, 0).y - 38);
    }

    const pulseZ = ((timeAcc % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * axisLen;
    const pulse = to2D(pulseZ, 0, 0);
    ctx.save();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'italic 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E and B are IN PHASE', 735, 120);

    drawWaveFormulaPanel(ctx, wavelength, speed, amplitude);
}

function drawWavePlanes(
    ctx: CanvasRenderingContext2D,
    to2D: (z: number, ex: number, by: number) => { x: number; y: number },
    amplitude: number,
    axisLen: number
) {
    const eMax = amplitude * 1.5;
    const bMax = amplitude * B_VISUAL_RATIO * 1.5;

    let p1 = to2D(0, eMax, 0);
    let p2 = to2D(axisLen, eMax, 0);
    let p3 = to2D(axisLen, -eMax, 0);
    let p4 = to2D(0, -eMax, 0);
    ctx.fillStyle = 'rgba(239,68,68,0.05)';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fill();

    p1 = to2D(0, 0, bMax);
    p2 = to2D(axisLen, 0, bMax);
    p3 = to2D(axisLen, 0, -bMax);
    p4 = to2D(0, 0, -bMax);
    ctx.fillStyle = 'rgba(59,130,246,0.05)';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fill();
}

function drawAxes(
    ctx: CanvasRenderingContext2D,
    origin: { x: number; y: number },
    to2D: (z: number, ex: number, by: number) => { x: number; y: number },
    amplitude: number,
    axisLen: number
) {
    const zEnd = to2D(axisLen + 20, 0, 0);
    const xEnd = to2D(0, amplitude * 2.6, 0);
    const yEnd = to2D(0, 0, amplitude * B_VISUAL_RATIO * 2.5);

    drawArrow(ctx, origin.x, origin.y, zEnd.x, zEnd.y, '#64748b', 2);
    drawArrow(ctx, origin.x, origin.y, xEnd.x, xEnd.y, '#64748b', 2);
    drawArrow(ctx, origin.x, origin.y, yEnd.x, yEnd.y, '#64748b', 2);

    ctx.font = '800 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Z (Propagation)', zEnd.x - 112, zEnd.y - 12);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('X (Electric Field E)', xEnd.x + 12, xEnd.y - 8);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('Y (Magnetic Field B)', Math.max(12, yEnd.x + 8), yEnd.y + 24);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '900 15px Inter, monospace';
    ctx.fillText('c →', 520, 462);
}

function drawWaveFormulaPanel(ctx: CanvasRenderingContext2D, wavelength: number, speed: number, amplitude: number) {
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, 910, 30, 350, 700, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 11px Inter, sans-serif';
    ctx.fillText('KEY EQUATIONS', 932, 64);
    ctx.fillStyle = '#ef4444';
    ctx.font = '900 16px Inter, monospace';
    ctx.fillText('Ex = E₀ sin(kz − ωt)', 932, 94);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('By = B₀ sin(kz − ωt)', 932, 122);
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 11px Inter, sans-serif';
    ctx.fillText('Same phase → E and B oscillate together', 932, 146);

    ctx.strokeStyle = 'rgba(148,163,184,0.18)';
    ctx.beginPath();
    ctx.moveTo(932, 166);
    ctx.lineTo(1238, 166);
    ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '800 14px Inter, monospace';
    const rows = ['k = 2π/λ', 'c = 1/√(μ₀ε₀)', 'B₀ = E₀/c', 'νλ = c', 'v = 1/√(με)'];
    rows.forEach((row, index) => ctx.fillText(row, 932, 198 + index * 26));

    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 11px Inter, sans-serif';
    ctx.fillText("MAXWELL'S EQUATIONS", 932, 346);
    const equations = [
        ['(1) ∮E·dA = Q/ε₀', 'Gauss (E)'],
        ['(2) ∮B·dA = 0', 'Gauss (B)'],
        ['(3) ∮E·dl = −dΦB/dt', 'Faraday'],
        ['(4) ∮B·dl = μ₀ic + μ₀ε₀(dΦE/dt)', 'Ampere-Maxwell'],
    ];
    equations.forEach(([eq, label], index) => {
        const y = 378 + index * 34;
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '700 11px Inter, monospace';
        ctx.fillText(eq, 932, y);
        ctx.fillStyle = '#64748b';
        ctx.font = '700 10px Inter, sans-serif';
        ctx.fillText(label, 1140, y);
    });

    ctx.strokeStyle = 'rgba(148,163,184,0.18)';
    ctx.beginPath();
    ctx.moveTo(932, 520);
    ctx.lineTo(1238, 520);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 11px Inter, sans-serif';
    ctx.fillText('CURRENT VALUES', 932, 550);
    const valueRows = [
        [`λ = ${wavelength} px (visual)`, '#f1f5f9'],
        [`ν = ${(speed / wavelength).toFixed(2)} (visual)`, '#f1f5f9'],
        [`E₀ = ${amplitude} (arb.)`, '#ef4444'],
        [`B₀ = ${(amplitude * B_VISUAL_RATIO).toFixed(1)} (scaled)`, '#3b82f6'],
        ['B₀ ≪ E₀ in reality', '#64748b'],
        ['uE = uB (equal energy)', '#22c55e'],
    ];
    valueRows.forEach(([text, color], index) => {
        ctx.fillStyle = color;
        ctx.font = index === 4 ? 'italic 13px Inter, sans-serif' : '800 13px Inter, monospace';
        ctx.fillText(text, 932, 580 + index * 25);
    });
}

function drawSpectrumMode(ctx: CanvasRenderingContext2D, hoverX: number) {
    drawCanvasTitle(ctx, 'Electromagnetic Spectrum', 'All travel at c = 3×10⁸ m/s in vacuum  |  νλ = c  |  No sharp division between bands');
    drawSpectrumBar(ctx);
    const band = getBandAt(hoverX);
    drawSpectrumCursor(ctx, hoverX, band);
    drawVisibleInset(ctx);
    drawBandCards(ctx);
    drawSpectrumFormulaNotes(ctx);
    return band;
}

function drawSpectrumBar(ctx: CanvasRenderingContext2D) {
    const x = 80;
    const y = 80;
    const w = 1120;
    const h = 120;
    const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
    gradient.addColorStop(0, '#ef4444');
    gradient.addColorStop(0.18, '#f97316');
    gradient.addColorStop(0.32, '#f59e0b');
    gradient.addColorStop(0.45, '#dc2626');
    gradient.addColorStop(0.5, '#facc15');
    gradient.addColorStop(0.54, '#22c55e');
    gradient.addColorStop(0.58, '#2563eb');
    gradient.addColorStop(0.62, '#7c3aed');
    gradient.addColorStop(0.74, '#8b5cf6');
    gradient.addColorStop(0.9, '#bfdbfe');
    gradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    BANDS.forEach(band => {
        const mid = (band.x0 + band.x1) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.font = band.shortName === 'VISIBLE' ? '900 13px Inter, sans-serif' : '800 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(band.shortName, mid, 65);
        ctx.strokeStyle = 'rgba(15,23,42,0.42)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(band.x0, y);
        ctx.lineTo(band.x0, y + h);
        ctx.stroke();
    });

    const freqLabels: Array<[string, number]> = [
        ['10⁶Hz', 80],
        ['10⁹Hz', 240],
        ['10¹²Hz', 400],
        ['10¹⁴Hz', 560],
        ['10¹⁶Hz', 760],
        ['10¹⁸Hz', 940],
        ['10²⁰Hz', 1080],
        ['10²³Hz', 1200],
    ];
    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 11px Inter, monospace';
    freqLabels.forEach(([label, pos]) => ctx.fillText(label, Number(pos), 220));
    const waveLabels: Array<[string, number]> = [
        ['10⁶m', 80],
        ['10³m', 240],
        ['1m', 400],
        ['10⁻³m', 560],
        ['10⁻⁶m', 760],
        ['10⁻⁹m', 940],
        ['10⁻¹²m', 1120],
    ];
    ctx.fillStyle = '#64748b';
    waveLabels.forEach(([label, pos]) => ctx.fillText(label, Number(pos), 240));
}

function drawSpectrumCursor(ctx: CanvasRenderingContext2D, x: number, band: Band) {
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 58);
    ctx.lineTo(x, 704);
    ctx.stroke();
    ctx.restore();

    const bubbleW = 285;
    const bubbleX = clamp(x - bubbleW / 2, 80, 1200 - bubbleW);
    ctx.fillStyle = 'rgba(2,6,23,0.93)';
    roundRect(ctx, bubbleX, 36, bubbleW, 116, 14);
    ctx.fill();
    ctx.strokeStyle = band.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 14px Inter, sans-serif';
    ctx.fillText(band.name.toUpperCase(), bubbleX + 16, 60);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.fillText(`λ: ${band.wavelength}`, bubbleX + 16, 82);
    ctx.fillText(`ν: ${band.frequency}`, bubbleX + 16, 102);
    ctx.fillText(`Source: ${shorten(band.production, 37)}`, bubbleX + 16, 122);
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`Use: ${shorten(band.application, 40)}`, bubbleX + 16, 142);
}

function drawVisibleInset(ctx: CanvasRenderingContext2D) {
    const x = 82;
    const y = 278;
    ctx.fillStyle = 'rgba(2,6,23,0.72)';
    roundRect(ctx, x, y, 260, 74, 12);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Visible light inset', x + 14, y + 22);
    const g = ctx.createLinearGradient(x + 18, 0, x + 238, 0);
    g.addColorStop(0, '#7c3aed');
    g.addColorStop(0.28, '#2563eb');
    g.addColorStop(0.5, '#22c55e');
    g.addColorStop(0.72, '#facc15');
    g.addColorStop(1, '#dc2626');
    ctx.fillStyle = g;
    roundRect(ctx, x + 18, y + 32, 220, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('400nm violet', x + 30, y + 68);
    ctx.fillText('550nm green', x + 130, y + 68);
    ctx.fillText('700nm red', x + 228, y + 68);
}

function drawBandCards(ctx: CanvasRenderingContext2D) {
    const positions = [
        [380, 280],
        [600, 280],
        [820, 280],
        [1040, 280],
        [270, 492],
        [490, 492],
        [710, 492],
    ];
    BANDS.forEach((band, index) => {
        const [x, y] = positions[index];
        drawBandCard(ctx, band, x, y);
    });
}

function drawBandCard(ctx: CanvasRenderingContext2D, band: Band, x: number, y: number) {
    const w = 200;
    const h = 172;
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = band.color;
    ctx.beginPath();
    ctx.arc(x + 18, y + 22, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(band.name, x + 34, y + 27);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillText(`λ: ${band.wavelength}`, x + 14, y + 54);
    ctx.fillStyle = '#64748b';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.fillText(`ν: ${band.frequency}`, x + 14, y + 76);
    ctx.fillStyle = '#f1f5f9';
    wrapText(ctx, band.production, x + 14, y + 101, 170, 13, 2);
    ctx.fillStyle = '#22c55e';
    wrapText(ctx, band.application, x + 14, y + 140, 170, 13, 2);
}

function drawSpectrumFormulaNotes(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(15,23,42,0.78)';
    roundRect(ctx, 970, 492, 230, 172, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.18)';
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 13px Inter, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Core formulas', 990, 520);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '800 12px Inter, monospace';
    ctx.fillText('νλ = c', 990, 548);
    ctx.fillText('c = 1/√(μ₀ε₀)', 990, 574);
    ctx.fillText('v = 1/√(με)', 990, 600);
    ctx.fillText('id = ε₀ dΦE/dt', 990, 626);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.fillText('Accelerated charges radiate EM waves.', 990, 652);
}

function drawCanvasTitle(ctx: CanvasRenderingContext2D, title: string, subtitle: string) {
    ctx.fillStyle = 'rgba(2,6,23,0.78)';
    roundRect(ctx, 255, 18, 770, 52, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(129,140,248,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '900 16px Inter, sans-serif';
    ctx.fillText(title, 640, 40);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 12px Inter, monospace';
    ctx.fillText(subtitle, 640, 60);
}

function getBandAt(x: number) {
    return BANDS.find(band => x >= band.x0 && x <= band.x1) ?? BANDS[BANDS.length - 1];
}

function getReadoutItems(mode: SimulationMode, values: LiveValues) {
    if (mode === 'wave') {
        return [
            { label: 'Wavelength λ', value: `${values.wavelength.toFixed(0)} px`, color: 'text-indigo-700', bg: 'bg-indigo-50' },
            { label: 'Frequency ν', value: `${values.frequency.toFixed(2)} visual`, color: 'text-purple-700', bg: 'bg-purple-50' },
            { label: 'E₀ amplitude', value: `${values.e0.toFixed(0)} arb.`, color: 'text-red-700', bg: 'bg-red-50' },
            { label: 'B₀ scaled', value: `${values.b0Visual.toFixed(1)} visual`, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Wave speed', value: `${values.speed.toFixed(0)} px/s`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Energy density', value: 'uE = uB', color: 'text-slate-800', bg: 'bg-slate-50' },
        ];
    }

    return [
        { label: 'Selected band', value: values.hoveredBand, color: 'text-indigo-700', bg: 'bg-indigo-50' },
        { label: 'Vacuum speed', value: C_LIGHT, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { label: 'Relation', value: 'νλ = c', color: 'text-purple-700', bg: 'bg-purple-50' },
        { label: 'Visible range', value: '400–700 nm', color: 'text-rose-700', bg: 'bg-rose-50' },
    ];
}

function InfoGraphCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-xl">
            <div className="mb-2">
                <div className="text-lg font-extrabold text-white">{title}</div>
                <div className="mt-1 text-sm font-semibold text-slate-300">{subtitle}</div>
            </div>
            {children}
        </div>
    );
}

function MiniWaveGeometry() {
    return (
        <svg viewBox="0 0 320 190" className="h-[190px] w-full overflow-visible">
            <defs>
                <filter id="glow-red"><feGaussianBlur stdDeviation="2.8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                <filter id="glow-blue"><feGaussianBlur stdDeviation="2.8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <line x1="44" y1="118" x2="292" y2="118" stroke="#64748b" strokeWidth="2" />
            <line x1="44" y1="118" x2="44" y2="30" stroke="#ef4444" strokeWidth="2" />
            <line x1="44" y1="118" x2="12" y2="148" stroke="#3b82f6" strokeWidth="2" />
            <path d="M44 118 C84 62 124 62 164 118 S244 174 284 118" fill="none" stroke="#ef4444" strokeWidth="3" filter="url(#glow-red)" />
            <path d="M44 118 C84 142 124 142 164 118 S244 94 284 118" fill="none" stroke="#3b82f6" strokeWidth="3" filter="url(#glow-blue)" />
            <text x="292" y="109" className="fill-slate-300 text-[12px] font-bold">Z</text>
            <text x="54" y="34" className="fill-red-300 text-[12px] font-bold">X/E</text>
            <text x="16" y="169" className="fill-blue-300 text-[12px] font-bold">Y/B</text>
            <rect x="136" y="86" width="62" height="20" rx="6" className="fill-slate-950/80" />
            <text x="167" y="100" textAnchor="middle" className="fill-emerald-300 text-[11px] font-bold">E x B →</text>
        </svg>
    );
}

function SpectrumMiniBar() {
    return (
        <svg viewBox="0 0 320 220" className="h-[220px] w-full">
            <defs>
                <linearGradient id="mini-spectrum" x1="0" x2="1">
                    <stop offset="0" stopColor="#ef4444" />
                    <stop offset="0.23" stopColor="#f97316" />
                    <stop offset="0.38" stopColor="#facc15" />
                    <stop offset="0.5" stopColor="#22c55e" />
                    <stop offset="0.62" stopColor="#2563eb" />
                    <stop offset="0.78" stopColor="#8b5cf6" />
                    <stop offset="1" stopColor="#f8fafc" />
                </linearGradient>
            </defs>
            <rect x="18" y="70" width="284" height="56" rx="14" fill="url(#mini-spectrum)" />
            <text x="20" y="52" className="fill-slate-300 text-[11px] font-bold">Radio</text>
            <text x="106" y="52" className="fill-slate-300 text-[11px] font-bold">IR</text>
            <text x="158" y="52" className="fill-white text-[11px] font-black">Visible</text>
            <text x="220" y="52" className="fill-slate-300 text-[11px] font-bold">X/γ</text>
            <text x="18" y="150" className="fill-slate-400 text-[11px]">Long λ, low ν</text>
            <text x="202" y="150" className="fill-slate-400 text-[11px]">Short λ, high ν</text>
            <path d="M30 170 H290" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
            <text x="96" y="196" className="fill-slate-300 text-[12px] font-bold">Increasing frequency</text>
        </svg>
    );
}

function SliderControl({
    label,
    value,
    valueClass,
    min,
    max,
    step,
    valueNumber,
    onChange,
    accent,
    leftTick,
    rightTick,
}: {
    label: string;
    value: string;
    valueClass: string;
    min: number;
    max: number;
    step: number;
    valueNumber: number;
    onChange: (value: number) => void;
    accent: string;
    leftTick?: string;
    rightTick?: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <label className="flex items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                <span>{label}</span>
                <span className={`rounded-lg px-2 py-1 font-mono text-xs font-bold ${valueClass}`}>{value}</span>
            </label>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={valueNumber}
                onChange={event => onChange(Number(event.target.value))}
                className={`mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 ${accent}`}
            />
            {(leftTick || rightTick) && (
                <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>{leftTick}</span>
                    <span>{rightTick}</span>
                </div>
            )}
        </div>
    );
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold shadow-sm ${
                active ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
        >
            {active ? <Eye size={16} /> : <EyeOff size={16} />}
            {label}
        </button>
    );
}

function ControlButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
            {icon}
            {label}
        </button>
    );
}

function tabClass(active: boolean) {
    return `flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold transition-all ${
        active
            ? 'border-2 border-indigo-400 bg-indigo-100 text-indigo-800 shadow-sm'
            : 'border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
    }`;
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    drawArrowHead(ctx, x2, y2, Math.atan2(y2 - y1, x2 - x1), color, width * 4.2);
}

function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, size: number) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * Math.cos(angle - 0.45), y - size * Math.sin(angle - 0.45));
    ctx.lineTo(x - size * Math.cos(angle + 0.45), y - size * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fill();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
    const words = text.split(' ');
    let line = '';
    let drawn = 0;
    for (let i = 0; i < words.length; i++) {
        const test = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(drawn === maxLines - 1 ? `${line}…` : line, x, y + drawn * lineHeight);
            drawn += 1;
            line = words[i];
            if (drawn >= maxLines) return;
        } else {
            line = test;
        }
    }
    if (line && drawn < maxLines) ctx.fillText(line, x, y + drawn * lineHeight);
}

function shorten(text: string, length: number) {
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

export default EMWavesLab;
