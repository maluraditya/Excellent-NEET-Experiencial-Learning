import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff, Zap, Activity, GitCommit } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type SimulationMode = 'faraday' | 'acgenerator' | 'motional';

interface EMILabProps {
    topic: any;
    onExit: () => void;
}

type TrailParticle = { x: number; y: number; life: number; maxLife: number };
type LiveValues = {
    flux: number;
    emf: number;
    velocity: number;
    angle: number;
    peakEmf: number;
    frequency: number;
    current: number;
    force: number;
};

const CANVAS_W = 1280;
const CANVAS_H = 760;
const HISTORY_SIZE = 300;
const FARADAY_MAGNET_START_X = 70;
const FARADAY_MAGNET_END_X = 800;

const ElectromagneticInductionLab: React.FC<EMILabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const lastTimeRef = useRef<number>(performance.now());

    const [mode, setMode] = useState<SimulationMode>('faraday');
    const [isPlaying, setIsPlaying] = useState(true);
    const [showFieldLines, setShowFieldLines] = useState(true);
    const [showLenz, setShowLenz] = useState(true);
    const [showStageLabels, setShowStageLabels] = useState(true);

    const [angularSpeed, setAngularSpeed] = useState(2);
    const [turns, setTurns] = useState(100);
    const [magneticField, setMagneticField] = useState(2);
    const [rodVelocity, setRodVelocity] = useState(3);
    const [resistance, setResistance] = useState(5);
    const [liveValues, setLiveValues] = useState<LiveValues>({
        flux: 0,
        emf: 0,
        velocity: 0,
        angle: 0,
        peakEmf: 0,
        frequency: 0,
        current: 0,
        force: 0,
    });

    const draggingRef = useRef(false);
    const magnetXRef = useRef(FARADAY_MAGNET_START_X);
    const prevMagnetXRef = useRef(FARADAY_MAGNET_START_X);
    const magnetVelocityRef = useRef(0);
    const galvAngleRef = useRef(0);
    const coilDotAngleRef = useRef(0);
    const faradayPhaseRef = useRef(0);

    const coilAngleRef = useRef(0);
    const fluxHistoryRef = useRef<number[]>([]);
    const emfHistoryRef = useRef<number[]>([]);

    const rodXRef = useRef(200);
    const rodDirRef = useRef(1);
    const rodTrailRef = useRef<TrailParticle[]>([]);
    const faradayFluxHistoryRef = useRef<number[]>([]);
    const faradayEmfHistoryRef = useRef<number[]>([]);
    const motionalEmfHistoryRef = useRef<number[]>([]);
    const motionalForceHistoryRef = useRef<number[]>([]);
    const lastLiveUpdateRef = useRef(0);

    const resetSimulation = useCallback(() => {
        magnetXRef.current = FARADAY_MAGNET_START_X;
        prevMagnetXRef.current = FARADAY_MAGNET_START_X;
        magnetVelocityRef.current = 0;
        galvAngleRef.current = 0;
        coilDotAngleRef.current = 0;
        faradayPhaseRef.current = 0;
        coilAngleRef.current = 0;
        fluxHistoryRef.current = [];
        emfHistoryRef.current = [];
        faradayFluxHistoryRef.current = [];
        faradayEmfHistoryRef.current = [];
        motionalEmfHistoryRef.current = [];
        motionalForceHistoryRef.current = [];
        rodXRef.current = 200;
        rodDirRef.current = 1;
        rodTrailRef.current = [];
        lastTimeRef.current = performance.now();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const render = (time: number) => {
            const dt = isPlaying ? Math.min((time - lastTimeRef.current) / 1000, 0.1) : 0;
            lastTimeRef.current = time;

            drawBackground(ctx);

            if (mode === 'faraday') {
                drawFaradayMode(ctx, dt, time, isPlaying, showFieldLines, showLenz);
            } else if (mode === 'acgenerator') {
                drawACGeneratorMode(ctx, dt, time, isPlaying, angularSpeed, turns, showFieldLines);
            } else {
                drawMotionalMode(ctx, dt, time, isPlaying, magneticField, rodVelocity, resistance, showFieldLines);
            }

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [mode, isPlaying, showFieldLines, showLenz, showStageLabels, angularSpeed, turns, magneticField, rodVelocity, resistance]);

    const canvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
            y: (e.clientY - rect.top) * (CANVAS_H / rect.height),
        };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (mode !== 'faraday') return;
        const { x, y } = canvasPoint(e);
        if (x >= magnetXRef.current && x <= magnetXRef.current + 160 && y >= 300 && y <= 380) {
            e.currentTarget.setPointerCapture(e.pointerId);
            draggingRef.current = true;
            setIsPlaying(true);
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (mode !== 'faraday' || !draggingRef.current) return;
        const { x } = canvasPoint(e);
        magnetXRef.current = clamp(x - 80, FARADAY_MAGNET_START_X, FARADAY_MAGNET_END_X);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        draggingRef.current = false;
        magnetVelocityRef.current = 0;
    };

    const switchMode = (nextMode: SimulationMode) => {
        setMode(nextMode);
        resetSimulation();
    };

    const updateLiveValues = (time: number, next: Partial<LiveValues>) => {
        if (time - lastLiveUpdateRef.current < 90) return;
        lastLiveUpdateRef.current = time;
        setLiveValues((previous) => ({ ...previous, ...next }));
    };

    const drawBackground = (ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.strokeStyle = 'rgba(15,23,42,0.06)';
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
    };

    const drawFaradayMode = (
        ctx: CanvasRenderingContext2D,
        dt: number,
        time: number,
        playing: boolean,
        fieldLinesVisible: boolean,
        lenzVisible: boolean
    ) => {
        const magnetX = magnetXRef.current;
        const velocity = dt > 0 ? (magnetX - prevMagnetXRef.current) / dt : 0;
        magnetVelocityRef.current = velocity * 0.65 + magnetVelocityRef.current * 0.35;
        prevMagnetXRef.current = magnetX;

        const coilCX = 640;
        const coilY = 340;
        const coilLeft = 560;
        const coilRight = 720;
        const magnetCenter = magnetX + 80;
        const distance = coilCX - magnetCenter;
        const rawFlux = clamp(Math.exp(-(distance * distance) / (260 * 260)), 0, 1);
        const flux = rawFlux < 0.035 ? 0 : rawFlux;
        const fluxGradient = flux === 0 ? 0 : (2 * distance / (260 * 260)) * rawFlux;
        const rawEmf = -fluxGradient * magnetVelocityRef.current * 180;
        const motionStrength = clamp(Math.abs(magnetVelocityRef.current) / 190, 0, 1);
        const changingFluxStrength = flux * motionStrength;
        const emf = changingFluxStrength < 0.025 ? 0 : clamp(rawEmf, -50, 50);
        const brightness = clamp(Math.abs(emf) / 38, 0, 1);
        pushHistory(faradayFluxHistoryRef.current, flux);
        pushHistory(faradayEmfHistoryRef.current, emf);
        updateLiveValues(time, {
            flux,
            emf,
            velocity: magnetVelocityRef.current,
            angle: 0,
            peakEmf: 0,
            frequency: 0,
            current: emf / 10,
            force: 0,
        });

        drawTitle(ctx, "Faraday's Law: moving magnet changes magnetic flux", 'ΦB = B · A = BA cos θ    |    ε = −dΦB/dt    |    ε = −N dΦB/dt');

        const visibleFluxStrength = Math.max(changingFluxStrength, flux * 0.42);
        if (fieldLinesVisible && flux > 0.035) {
            drawFaradayFieldLines(ctx, magnetX, flux, visibleFluxStrength, magnetVelocityRef.current);
        }

        drawCoil(ctx, coilLeft, coilRight, coilY, flux);
        if (lenzVisible) {
            drawLenzIndicator(ctx, coilCX, coilY, emf, dt, coilDotAngleRef);
        }
        drawBarMagnet(ctx, magnetX, coilY, Math.abs(magnetVelocityRef.current) > 12);
        drawFaradayCircuit(ctx, brightness, emf);
        drawGalvanometer(ctx, 900, 560, emf, galvAngleRef);
        drawFluxMeter(ctx, 1180, 80, 30, 300, flux);
        drawFaradayReadouts(ctx, flux, emf, magnetVelocityRef.current);
    };

    const drawACGeneratorMode = (
        ctx: CanvasRenderingContext2D,
        dt: number,
        time: number,
        playing: boolean,
        omega: number,
        nTurns: number,
        fieldLinesVisible: boolean
    ) => {
        if (playing) coilAngleRef.current = (coilAngleRef.current + omega * dt) % (Math.PI * 2);
        const theta = coilAngleRef.current;
        const degrees = ((theta * 180 / Math.PI) + 360) % 360;
        const flux = Math.cos(theta);
        const peakEmf = Math.max(0.1, omega);
        const emf = peakEmf * Math.sin(theta);

        pushHistory(fluxHistoryRef.current, flux);
        pushHistory(emfHistoryRef.current, emf);
        updateLiveValues(time, {
            flux,
            emf,
            velocity: 0,
            angle: degrees,
            peakEmf: nTurns * omega,
            frequency: omega / (2 * Math.PI),
            current: emf / 10,
            force: 0,
        });

        drawTitle(ctx, 'AC Generator: mechanical energy → electrical energy', 'ΦB = BA cos(ωt)    |    ε = NBAω sin(ωt)    |    ε₀ = NBAω    |    ε = ε₀ sin(2πνt)');
        drawGeneratorApparatus(ctx, theta, degrees, omega, emf, fieldLinesVisible);
    };

    const drawMotionalMode = (
        ctx: CanvasRenderingContext2D,
        dt: number,
        time: number,
        playing: boolean,
        bField: number,
        velocitySetting: number,
        rValue: number,
        fieldLinesVisible: boolean
    ) => {
        const pixelsPerMeter = 32;
        if (playing) {
            rodXRef.current += rodDirRef.current * velocitySetting * dt * pixelsPerMeter;
            if (rodXRef.current > 850) {
                rodXRef.current = 850;
                rodDirRef.current = -1;
            }
            if (rodXRef.current < 150) {
                rodXRef.current = 150;
                rodDirRef.current = 1;
            }
            for (let i = 0; i < 2; i++) {
                rodTrailRef.current.push({
                    x: rodXRef.current,
                    y: 245 + Math.random() * 230,
                    life: 30,
                    maxLife: 30,
                });
            }
        }

        rodTrailRef.current = rodTrailRef.current
            .map((p) => ({ ...p, x: p.x - rodDirRef.current * velocitySetting * 0.3, life: p.life - 1 }))
            .filter((p) => p.life > 0);

        const signedVelocity = rodDirRef.current * velocitySetting;
        const rodLength = 1;
        const emf = bField * rodLength * signedVelocity;
        const current = emf / rValue;
        const force = (bField * bField * rodLength * rodLength * signedVelocity) / rValue;
        pushHistory(motionalEmfHistoryRef.current, emf);
        pushHistory(motionalForceHistoryRef.current, force);
        updateLiveValues(time, {
            flux: bField,
            emf,
            velocity: signedVelocity,
            angle: 0,
            peakEmf: Math.abs(bField * rodLength * velocitySetting),
            frequency: 0,
            current,
            force,
        });

        drawTitle(ctx, 'Motional EMF: conducting rod sliding on rails', 'ε = Blv    |    I = ε/R = Blv/R    |    F = BIl = B²l²v/R');
        drawMotionalApparatus(ctx, bField, signedVelocity, emf, current, force, fieldLinesVisible, rodXRef.current, rodTrailRef.current);
    };

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 z-20 hidden w-[380px] 2xl:block">
            <div className="flex flex-col gap-3">
                {mode === 'faraday' && (
                    <>
                        <GraphCard title="Magnetic Flux Through Coil" subtitle="Flux rises as the N-pole links more field through the coil">
                            <HistorySvg
                                data={faradayFluxHistoryRef.current}
                                amplitude={1}
                                color="#facc15"
                                yLabel="ΦB"
                                xLabel="time"
                                readout={`ΦB = ${liveValues.flux.toFixed(2)} Wb`}
                            />
                        </GraphCard>
                        <GraphCard title="Induced EMF" subtitle="Only non-zero while flux is changing">
                            <HistorySvg
                                data={faradayEmfHistoryRef.current}
                                amplitude={50}
                                color={liveValues.emf >= 0 ? '#22c55e' : '#f59e0b'}
                                yLabel="ε"
                                xLabel="time"
                                readout={`ε = ${liveValues.emf.toFixed(1)} V`}
                            />
                        </GraphCard>
                    </>
                )}

                {mode === 'acgenerator' && (
                    <>
                        <GraphCard title="Magnetic Flux Φ(t)" subtitle="ΦB = NAB cos(ωt)">
                            <HistorySvg
                                data={fluxHistoryRef.current}
                                amplitude={1}
                                color="#3b82f6"
                                yLabel="Φ"
                                xLabel="one cycle"
                                readout={`Φ = ${liveValues.flux.toFixed(2)}`}
                                stageMarkers={showStageLabels}
                            />
                        </GraphCard>
                        <GraphCard title="Induced EMF ε(t)" subtitle="NCERT Fig. 6.14 stage markers">
                            <HistorySvg
                                data={emfHistoryRef.current}
                                amplitude={Math.max(0.5, angularSpeed)}
                                color="#ef4444"
                                yLabel="ε"
                                xLabel="T/4, T/2, 3T/4, T"
                                readout={`ε = ${liveValues.emf.toFixed(2)} V`}
                                stageMarkers={showStageLabels}
                            />
                        </GraphCard>
                    </>
                )}

                {mode === 'motional' && (
                    <>
                        <GraphCard title="Motional EMF" subtitle="ε = Blv, so B or v increases the induced EMF">
                            <HistorySvg
                                data={motionalEmfHistoryRef.current}
                                amplitude={Math.max(2, magneticField * rodVelocity)}
                                color="#facc15"
                                yLabel="ε"
                                xLabel="time"
                                readout={`ε = ${liveValues.emf.toFixed(1)} V`}
                            />
                        </GraphCard>
                        <GraphCard title="Opposing Magnetic Force" subtitle="F = B²l²v/R from Lenz's law">
                            <HistorySvg
                                data={motionalForceHistoryRef.current}
                                amplitude={Math.max(1, (magneticField * magneticField * rodVelocity) / resistance)}
                                color="#ef4444"
                                yLabel="F"
                                xLabel="time"
                                readout={`F = ${liveValues.force.toFixed(2)} N`}
                            />
                        </GraphCard>
                    </>
                )}
            </div>
        </aside>
    );

    const formulaPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 z-20 hidden w-[320px] 2xl:block">
            <div className="rounded-xl border border-amber-200 bg-amber-50/95 p-4 text-amber-950 shadow-xl backdrop-blur">
                <div className="text-base font-extrabold">{sideInfo[mode].title}</div>
                <div className="mt-2 space-y-1.5 text-sm leading-snug text-amber-900">
                    {sideInfo[mode].points.map((point) => (
                        <p key={point}>{point}</p>
                    ))}
                </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">Live</span>
                </div>
                <div className="grid gap-2">
                    {getReadoutItems(mode, liveValues, angularSpeed, turns, magneticField, rodVelocity, resistance).map((item) => (
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
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    className="absolute inset-0 h-[760px] w-[1280px] cursor-grab touch-none active:cursor-grabbing"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                />
            </div>
            {graphPanel}
            {formulaPanel}
        </div>
    );

    const controlsCombo = (
        <div className="w-full space-y-4 p-4">
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => switchMode('faraday')}
                    className={tabClass(mode === 'faraday')}
                >
                    <Zap size={18} /> Faraday's Law
                </button>
                <button
                    onClick={() => switchMode('acgenerator')}
                    className={tabClass(mode === 'acgenerator')}
                >
                    <Activity size={18} /> AC Generator
                </button>
                <button
                    onClick={() => switchMode('motional')}
                    className={tabClass(mode === 'motional')}
                >
                    <GitCommit size={18} /> Motional EMF
                </button>
            </div>

            {mode === 'faraday' && (
                <div className="grid gap-3 md:grid-cols-4">
                    <ToggleButton active={showFieldLines} onClick={() => setShowFieldLines((v) => !v)} label="Field Lines" />
                    <ToggleButton active={showLenz} onClick={() => setShowLenz((v) => !v)} label="Lenz's Law" />
                    <ControlButton onClick={() => setIsPlaying((v) => !v)} icon={isPlaying ? <Pause size={18} /> : <Play size={18} />} label={isPlaying ? 'Pause' : 'Play'} />
                    <ControlButton onClick={resetSimulation} icon={<RotateCcw size={18} />} label="Reset" />
                </div>
            )}

            {mode === 'acgenerator' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <SliderCard label="Angular Speed (ω)" value={`${angularSpeed.toFixed(1)} rad/s`}>
                        <input className="w-full accent-amber-500" type="range" min="0.5" max="12" step="0.5" value={angularSpeed} onChange={(e) => setAngularSpeed(Number(e.target.value))} />
                        <p className="text-xs text-slate-500">f = ω/2π = {(angularSpeed / (2 * Math.PI)).toFixed(2)} Hz</p>
                    </SliderCard>
                    <SliderCard label="Number of Turns (N)" value={`${turns}`}>
                        <input className="w-full accent-amber-500" type="range" min="50" max="500" step="50" value={turns} onChange={(e) => setTurns(Number(e.target.value))} />
                        <p className="text-xs text-slate-500">Peak EMF ε₀ ∝ N. More turns increase induced EMF.</p>
                    </SliderCard>
                    <ToggleButton active={showFieldLines} onClick={() => setShowFieldLines((v) => !v)} label="Field Lines" />
                    <ToggleButton active={showStageLabels} onClick={() => setShowStageLabels((v) => !v)} label="Stage Labels" />
                    <ControlButton onClick={() => setIsPlaying((v) => !v)} icon={isPlaying ? <Pause size={18} /> : <Play size={18} />} label={isPlaying ? 'Pause' : 'Play'} />
                    <ControlButton onClick={resetSimulation} icon={<RotateCcw size={18} />} label="Reset" />
                </div>
            )}

            {mode === 'motional' && (
                <div className="grid gap-4 md:grid-cols-2">
                    <SliderCard label="Magnetic Field (B)" value={`${magneticField.toFixed(1)} T`}>
                        <input className="w-full accent-blue-500" type="range" min="0.5" max="5" step="0.5" value={magneticField} onChange={(e) => setMagneticField(Number(e.target.value))} />
                    </SliderCard>
                    <SliderCard label="Rod Velocity (v)" value={`${rodVelocity.toFixed(1)} m/s`}>
                        <input className="w-full accent-green-500" type="range" min="0.5" max="10" step="0.5" value={rodVelocity} onChange={(e) => setRodVelocity(Number(e.target.value))} />
                    </SliderCard>
                    <SliderCard label="Resistance (R)" value={`${resistance} Ω`}>
                        <input className="w-full accent-rose-500" type="range" min="1" max="20" step="1" value={resistance} onChange={(e) => setResistance(Number(e.target.value))} />
                    </SliderCard>
                    <ToggleButton active={showFieldLines} onClick={() => setShowFieldLines((v) => !v)} label="Field Lines" />
                    <ControlButton onClick={() => setIsPlaying((v) => !v)} icon={isPlaying ? <Pause size={18} /> : <Play size={18} />} label={isPlaying ? 'Pause' : 'Play'} />
                    <ControlButton onClick={resetSimulation} icon={<RotateCcw size={18} />} label="Reset" />
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

function drawTitle(ctx: CanvasRenderingContext2D, title: string, formulas: string) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, 270, 18, 740, 58, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250,204,21,0.35)';
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 18px Inter, monospace';
    ctx.fillText(title, 640, 42);
    ctx.fillStyle = '#334155';
    ctx.font = '600 14px Inter, monospace';
    ctx.fillText(formulas, 640, 64);
}

function drawCoil(ctx: CanvasRenderingContext2D, left: number, right: number, cy: number, flux: number) {
    if (flux > 0.05) {
        const glow = ctx.createRadialGradient((left + right) / 2, cy, 0, (left + right) / 2, cy, 120);
        glow.addColorStop(0, `rgba(250,204,21,${0.25 * flux})`);
        glow.addColorStop(1, 'rgba(250,204,21,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(left - 45, cy - 105, right - left + 90, 210);
    }

    for (let i = 0; i < 16; i++) {
        const x = left + i * ((right - left) / 15);
        ctx.save();
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 4 + flux * 14;
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, cy, 12, 70, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.strokeRect(left, cy - 70, right - left, 140);
    ctx.fillStyle = '#facc15';
    ctx.font = '700 14px Inter, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Stationary N-turn coil', (left + right) / 2, cy + 102);
}

function drawBarMagnet(ctx: CanvasRenderingContext2D, x: number, cy: number, moving: boolean) {
    const y = cy - 40;
    ctx.save();
    if (moving) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 20;
    }
    ctx.fillStyle = '#3b82f6';
    roundRect(ctx, x, y, 80, 80, 10);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    roundRect(ctx, x + 80, y, 80, 80, 10);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x + 78, y + 8, 4, 64);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '800 24px Inter, monospace';
    ctx.fillText('S', x + 40, cy + 8);
    ctx.fillText('N', x + 120, cy + 8);
    ctx.fillStyle = '#475569';
    ctx.font = '700 13px Inter, sans-serif';
    ctx.fillText('Drag →', x + 80, y - 18);
}

function drawFaradayFieldLines(
    ctx: CanvasRenderingContext2D,
    magnetX: number,
    flux: number,
    strength: number,
    velocity: number
) {
    const startX = magnetX + 160;
    const opacity = clamp(0.08 + strength * 0.7, 0, 0.78);
    const isStationary = Math.abs(velocity) < 12;
    const isWithdrawing = velocity < 0;
    const color = isStationary ? '59,130,246' : isWithdrawing ? '245,158,11' : '239,68,68';
    for (let i = 0; i < 8; i++) {
        const offset = (i - 3.5) * 24;
        const startY = 340 + offset * 0.55;
        const endX = 690 + flux * 80;
        const endY = 340 + offset * 1.15;
        const controlX = 445 + flux * 135;
        const controlY = 340 + offset * 1.5;
        ctx.strokeStyle = `rgba(${color},${opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.stroke();

        const t = 0.55;
        const ax = quadraticPoint(startX, controlX, endX, t);
        const ay = quadraticPoint(startY, controlY, endY, t);
        const dx = 2 * (1 - t) * (controlX - startX) + 2 * t * (endX - controlX);
        const dy = 2 * (1 - t) * (controlY - startY) + 2 * t * (endY - controlY);
        const direction = Math.atan2(dy, dx) + (isWithdrawing ? Math.PI : 0);
        drawArrowHead(ctx, ax, ay, direction, `rgba(${color},${opacity})`, 9);
    }
}

function drawLenzIndicator(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    emf: number,
    dt: number,
    dotAngleRef: React.MutableRefObject<number>
) {
    const strength = clamp(Math.abs(emf) / 40, 0, 1);
    if (strength < 0.03) return;
    const positive = emf > 0;
    const color = positive ? '#22c55e' : '#f59e0b';
    dotAngleRef.current += (positive ? 1 : -1) * dt * (1.2 + strength);

    ctx.save();
    ctx.globalAlpha = strength;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 88, 88, 0, positive ? 0.25 : 1.2, positive ? Math.PI * 1.75 : Math.PI * 2.7, !positive);
    ctx.stroke();
    const arrowAngle = positive ? 0.55 : -0.55;
    drawArrowHead(ctx, cx + 78, cy - 40, arrowAngle, color, 14);

    const dotX = cx + Math.cos(dotAngleRef.current) * 72;
    const dotY = cy + Math.sin(dotAngleRef.current) * 62;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = color;
    ctx.font = '800 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(positive ? 'CCW current: Opposes ↑ Flux' : 'CW current: Opposes ↓ Flux', cx, cy - 112);
}

function drawFaradayCircuit(ctx: CanvasRenderingContext2D, brightness: number, emf: number) {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(560, 410);
    ctx.lineTo(560, 560);
    ctx.lineTo(798, 560);
    ctx.moveTo(720, 410);
    ctx.lineTo(720, 500);
    ctx.lineTo(820, 500);
    ctx.lineTo(820, 538);
    ctx.moveTo(842, 560);
    ctx.lineTo(850, 560);
    ctx.moveTo(950, 560);
    ctx.lineTo(1030, 560);
    ctx.lineTo(1030, 500);
    ctx.lineTo(720, 500);
    ctx.stroke();

    drawBulb(ctx, 820, 560, brightness, 'Bulb');
    ctx.fillStyle = '#334155';
    ctx.font = '700 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(emf === 0 ? 'Stationary magnet: ε = 0' : emf > 0 ? 'Approaching: deflection +' : 'Withdrawing: deflection −', 70, 690);
}

function drawBulb(ctx: CanvasRenderingContext2D, x: number, y: number, brightness: number, label?: string) {
    if (brightness > 0.02) {
        ctx.save();
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 60 * brightness);
        glow.addColorStop(0, `rgba(250,204,21,${0.8 * brightness})`);
        glow.addColorStop(1, 'rgba(250,204,21,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 60 * brightness, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.fillStyle = brightness > 0.05 ? `rgba(250,204,21,${0.4 + brightness * 0.6})` : '#1e293b';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 3);
    ctx.quadraticCurveTo(x, y - 8, x + 10, y + 3);
    ctx.stroke();
    if (label) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 45);
    }
}

function drawGalvanometer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    emf: number,
    angleRef: React.MutableRefObject<number>
) {
    const targetAngle = clamp(emf, -50, 50);
    angleRef.current = angleRef.current * 0.85 + targetAngle * 0.15;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 50, Math.PI, 0);
    ctx.lineTo(x - 50, y);
    ctx.fill();
    ctx.stroke();

    for (const angle of [-50, -30, 0, 30, 50]) {
        const a = (-90 + angle) * Math.PI / 180;
        ctx.strokeStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 38, y + Math.sin(a) * 38);
        ctx.lineTo(x + Math.cos(a) * 46, y + Math.sin(a) * 46);
        ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 13px Inter, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('−', x - 40, y - 10);
    ctx.fillText('0', x, y - 42);
    ctx.fillText('+', x + 40, y - 10);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angleRef.current * Math.PI) / 180);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-3, -42);
    ctx.lineTo(3, -42);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 16px Inter, monospace';
    ctx.fillText('G', x, y + 30);
}

function drawFluxMeter(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, flux: number) {
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    roundRect(ctx, x, y + h - flux * h, w, flux * h, 8);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = '800 16px Inter, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Φ', x + w / 2, y - 12);
    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillText(`${Math.round(flux * 100)}%`, x + w / 2, y + h + 22);
}

function drawFaradayReadouts(ctx: CanvasRenderingContext2D, flux: number, emf: number, velocity: number) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, 38, 92, 420, 116, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 15px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NCERT observations', 58, 120);
    ctx.fillStyle = '#334155';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText('Magnet passes fully through the coil.', 58, 144);
    ctx.fillText('Entering coil: current spike in one direction.', 58, 166);
    ctx.fillText('Exiting coil: opposite spike due to Lenz law.', 58, 188);

    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, 470, 650, 350, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.font = '800 14px Inter, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ΦB = ${flux.toFixed(2)} Wb (relative)`, 575, 684);
    ctx.fillStyle = emf >= 0 ? '#22c55e' : '#f59e0b';
    ctx.fillText(`ε = ${emf.toFixed(1)} V`, 705, 684);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`v = ${velocity.toFixed(0)} px/s`, 790, 684);
}

function drawGeneratorApparatus(
    ctx: CanvasRenderingContext2D,
    theta: number,
    degrees: number,
    omega: number,
    emf: number,
    showFieldLines: boolean
) {
    const cx = 640;
    const cy = 315;
    const poleTop = 180;
    const poleH = 270;
    const poleW = 78;
    const leftPoleX = 350;
    const rightPoleX = 850;
    const fieldLeft = leftPoleX + poleW;
    const fieldRight = rightPoleX;
    const coilTop = 190;
    const coilBottom = 440;
    const coilHalfBase = 140;
    const ringY = 465;
    const lampY = 630;
    ctx.fillStyle = '#ef4444';
    roundRect(ctx, leftPoleX, poleTop, poleW, poleH, 12);
    ctx.fill();
    ctx.fillStyle = '#3b82f6';
    roundRect(ctx, rightPoleX, poleTop, poleW, poleH, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', leftPoleX + poleW / 2, cy + 10);
    ctx.fillText('S', rightPoleX + poleW / 2, cy + 10);

    if (showFieldLines) {
        for (let y = 218; y <= 412; y += 28) {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fieldLeft, y);
            ctx.lineTo(fieldRight, y);
            ctx.stroke();
            drawArrowHead(ctx, cx, y, 0, '#64748b', 11);
        }
    }

    const coilHalfW = coilHalfBase * Math.abs(Math.cos(theta));
    const glow = Math.abs(Math.sin(theta));
    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 30 * glow;
    ctx.strokeStyle = '#f59e0b';
    if (Math.abs(Math.cos(theta)) < 0.05) {
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(cx, coilTop);
        ctx.lineTo(cx, coilBottom);
        ctx.stroke();
    } else {
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx - coilHalfW, coilTop);
        ctx.lineTo(cx + coilHalfW, coilTop);
        ctx.lineTo(cx + coilHalfW, coilBottom);
        ctx.lineTo(cx - coilHalfW, coilBottom);
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();

    const stage = getGeneratorStage(degrees);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, cx - 178, 96, 356, 36, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250,204,21,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.font = '800 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${stage}  θ=${degrees.toFixed(0)}°`, cx, 119);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, 150, 24, 0.15, Math.PI * 1.55);
    ctx.stroke();
    drawArrowHead(ctx, cx - 4, 126, -2.4, '#d97706', 10);
    ctx.fillStyle = '#334155';
    ctx.font = '700 13px Inter, monospace';
    ctx.fillText(`ω = ${omega.toFixed(1)} rad/s`, cx, 558);

    drawSlipRingsAndBrushes(ctx, cx, ringY);
    drawBulb(ctx, cx, lampY, clamp(Math.abs(emf) / Math.max(omega, 1), 0, 1), 'External lamp');

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 40, ringY + 40);
    ctx.lineTo(cx - 40, lampY - 42);
    ctx.lineTo(cx - 18, lampY - 20);
    ctx.moveTo(cx + 40, ringY + 40);
    ctx.lineTo(cx + 40, lampY - 42);
    ctx.lineTo(cx + 18, lampY - 20);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, 54, 94, 310, 60, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#3b82f6';
    ctx.font = '800 15px Inter, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ΦB = BA cos(ωt)', 76, 122);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('ε = NBAω sin(ωt)', 76, 145);
}

function drawSlipRingsAndBrushes(ctx: CanvasRenderingContext2D, cx: number, y: number) {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx - 40, y + 14, 12, -Math.PI * 0.65, Math.PI * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 40, y + 14, 12, Math.PI * 0.1, Math.PI * 1.65);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    roundRect(ctx, cx - 52, y + 38, 24, 12, 3);
    ctx.fill();
    roundRect(ctx, cx + 28, y + 38, 24, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('slip rings + carbon brushes', cx, y + 74);
}

function drawACGraphPanel(
    ctx: CanvasRenderingContext2D,
    flux: number,
    emf: number,
    peakEmf: number,
    omega: number,
    turns: number,
    theta: number,
    showStageLabels: boolean,
    fluxHistory: number[],
    emfHistory: number[]
) {
    const x = 580;
    const y = 60;
    const w = 670;
    const h = 640;
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawTimeGraph(ctx, x + 40, y + 54, w - 80, 240, fluxHistory, 1, '#3b82f6', 'Magnetic Flux  Φ(t) = NAB cos(ωt)', `Φ = ${flux.toFixed(2)}`, theta, showStageLabels, false);
    drawTimeGraph(ctx, x + 40, y + 368, w - 80, 240, emfHistory, peakEmf, '#ef4444', 'Induced EMF  ε(t) = NBAω sin(ωt)', `ε = ${emf.toFixed(2)} V`, theta, showStageLabels, true);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 13px Inter, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`ε₀ = NBAω = ${turns} × B × A × ${omega.toFixed(1)}  (peak ∝ Nω)`, x + 42, y + h - 18);
}

function drawTimeGraph(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    data: number[],
    amplitude: number,
    color: string,
    title: string,
    readout: string,
    theta: number,
    stageLabels: boolean,
    emfGraph: boolean
) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '800 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x, y - 24);
    ctx.fillStyle = color;
    ctx.textAlign = 'right';
    ctx.fillText(readout, x + w, y - 24);

    ctx.strokeStyle = 'rgba(15,23,42,0.10)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const gy = y + (h * i) / 4;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
    }
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.stroke();

    if (stageLabels) {
        const cycle = Math.PI * 2;
        const visibleSpan = cycle;
        const startAngle = theta - visibleSpan;
        const markers = [
            { a: Math.PI / 2, label: '90°/MAX' },
            { a: Math.PI, label: '180°/0' },
            { a: Math.PI * 1.5, label: '270°/−MAX' },
        ];
        for (const marker of markers) {
            let markerAngle = marker.a;
            while (markerAngle < startAngle) markerAngle += cycle;
            while (markerAngle > theta) markerAngle -= cycle;
            const gx = x + ((markerAngle - startAngle) / visibleSpan) * w;
            if (gx >= x && gx <= x + w) {
                ctx.save();
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = '#facc15';
                ctx.beginPath();
                ctx.moveTo(gx, y);
                ctx.lineTo(gx, y + h);
                ctx.stroke();
                ctx.restore();
                ctx.fillStyle = '#facc15';
                ctx.font = '700 11px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(marker.label, gx, y + 14);
            }
        }
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    data.forEach((value, i) => {
        const gx = x + (i / (HISTORY_SIZE - 1)) * w;
        const gy = y + h / 2 - (value / amplitude) * (h * 0.42);
        if (i === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
    });
    ctx.stroke();

    if (emfGraph) {
        ctx.fillStyle = '#64748b';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('T/4', x + w * 0.25, y + h + 20);
        ctx.fillText('T/2', x + w * 0.5, y + h + 20);
        ctx.fillText('3T/4', x + w * 0.75, y + h + 20);
        ctx.fillText('T', x + w, y + h + 20);
        ctx.fillStyle = '#facc15';
        ctx.fillText('MAX', x + w * 0.25, y + 30);
        ctx.fillText('−MAX', x + w * 0.75, y + h - 18);
    } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('max', x + 8, y + 14);
        ctx.fillText('0', x + 8, y + h / 2 - 6);
        ctx.fillText('−max', x + 8, y + h - 8);
    }
}

function drawMotionalApparatus(
    ctx: CanvasRenderingContext2D,
    bField: number,
    velocity: number,
    emf: number,
    current: number,
    force: number,
    showFieldLines: boolean,
    rodX: number,
    rodTrail: TrailParticle[]
) {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 240);
    ctx.lineTo(900, 240);
    ctx.moveTo(100, 480);
    ctx.lineTo(900, 480);
    ctx.stroke();

    if (showFieldLines) {
        for (let col = 0; col < 10; col++) {
            for (let row = 0; row < 4; row++) {
                drawCrossField(ctx, 150 + col * 75, 285 + row * 45, clamp(bField / 5, 0.3, 1));
            }
        }
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(900, 240);
    ctx.lineTo(950, 240);
    ctx.lineTo(950, 338);
    ctx.moveTo(950, 382);
    ctx.lineTo(950, 480);
    ctx.lineTo(900, 480);
    ctx.stroke();
    drawBulb(ctx, 950, 360, clamp(Math.abs(emf) / 20, 0, 1), 'Load');

    for (const p of rodTrail) {
        const alpha = p.life / p.maxLife;
        ctx.fillStyle = `rgba(245,158,11,${alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 * alpha, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 20 * clamp(Math.abs(velocity) / 10, 0, 1);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(rodX, 240);
    ctx.lineTo(rodX, 480);
    ctx.stroke();
    ctx.restore();

    drawDoubleArrow(ctx, rodX + 26, 240, rodX + 26, 480, '#cbd5e1');
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '800 14px Inter, monospace';
    ctx.fillText('l', rodX + 42, 365);

    drawArrow(ctx, rodX, 360, rodX + Math.sign(velocity) * (54 + Math.abs(velocity) * 5), 360, '#22c55e', 4);
    ctx.fillStyle = '#22c55e';
    ctx.font = '800 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('v', rodX + Math.sign(velocity) * 82, 350);

    drawArrow(ctx, rodX, 420, rodX - Math.sign(force || velocity) * (45 + Math.min(70, Math.abs(force) * 18)), 420, '#ef4444', 4);
    ctx.fillStyle = '#ef4444';
    ctx.font = '800 13px Inter, sans-serif';
    ctx.fillText('F = B²l²v/R opposes motion', rodX - Math.sign(force || velocity) * 95, 444);

    const arrowColor = '#22c55e';
    const alpha = clamp(Math.abs(current) / 2, 0.15, 1);
    ctx.globalAlpha = alpha;
    const direction = Math.sign(current || 1);
    for (let x = 160; x < 860; x += 80) {
        drawArrowHead(ctx, x, direction > 0 ? 240 : 480, direction > 0 ? Math.PI : 0, arrowColor, 9);
        drawArrowHead(ctx, x, direction > 0 ? 480 : 240, direction > 0 ? 0 : Math.PI, arrowColor, 9);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(ctx, 84, 560, 760, 72, 14);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 15px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Lenz law in the sliding rod: induced current creates magnetic force opposite to motion.', 110, 594);
    ctx.fillStyle = '#facc15';
    ctx.font = '800 14px Inter, monospace';
    ctx.fillText(`ε = ${emf.toFixed(1)} V   I = ${current.toFixed(2)} A   direction reverses when rod bounces`, 110, 618);
}

function drawMotionalFormulaPanel(
    ctx: CanvasRenderingContext2D,
    bField: number,
    length: number,
    velocity: number,
    resistance: number,
    emf: number,
    current: number,
    force: number
) {
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, 920, 100, 330, 430, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.25)';
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 24px Inter, monospace';
    ctx.fillText('ε = Blv', 950, 150);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 17px Inter, monospace';
    ctx.fillText('I = ε/R = Blv/R', 950, 188);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('F = BIl = B²l²v/R', 950, 224);

    const rows = [
        `B = ${bField.toFixed(1)} T`,
        `l = ${length.toFixed(1)} m`,
        `v = ${velocity.toFixed(1)} m/s`,
        `R = ${resistance.toFixed(0)} Ω`,
        `ε = ${emf.toFixed(1)} V`,
        `I = ${current.toFixed(2)} A`,
        `F = ${force.toFixed(2)} N`,
    ];
    ctx.font = '800 15px Inter, monospace';
    rows.forEach((row, i) => {
        ctx.fillStyle = i >= 4 ? '#facc15' : '#cbd5e1';
        ctx.fillText(row, 950, 274 + i * 28);
    });

    ctx.fillStyle = '#f59e0b';
    ctx.font = '800 13px Inter, sans-serif';
    ctx.fillText("Lenz's Law: Force OPPOSES motion", 950, 494);
}

function drawCrossField(ctx: CanvasRenderingContext2D, x: number, y: number, opacity: number) {
    ctx.strokeStyle = `rgba(59,130,246,${opacity * 0.55})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x + 5, y + 5);
    ctx.moveTo(x + 5, y - 5);
    ctx.lineTo(x - 5, y + 5);
    ctx.stroke();
}

function getGeneratorStage(degrees: number) {
    if (degrees < 20 || degrees > 340) return 'Stage 1: ε = 0 (Φ max)';
    if (degrees > 70 && degrees < 110) return 'Stage 2: ε = ε₀ (MAX)';
    if (degrees > 160 && degrees < 200) return 'Stage 3: ε = 0';
    if (degrees > 250 && degrees < 290) return 'Stage 4: ε = −ε₀ (MAX)';
    return 'Rotating armature';
}

function pushHistory(history: number[], value: number) {
    history.push(value);
    if (history.length > HISTORY_SIZE) history.shift();
}

function tabClass(active: boolean) {
    return `flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold transition-all ${
        active
            ? 'border-2 border-amber-400 bg-amber-100 text-amber-800 shadow-sm'
            : 'border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
    }`;
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

function HistorySvg({
    data,
    amplitude,
    color,
    yLabel,
    xLabel,
    readout,
    stageMarkers = false,
}: {
    data: number[];
    amplitude: number;
    color: string;
    yLabel: string;
    xLabel: string;
    readout: string;
    stageMarkers?: boolean;
}) {
    const graphW = 300;
    const graphH = 178;
    const safeAmplitude = Math.max(0.001, amplitude);
    const path = historyPath(data, graphW, graphH, safeAmplitude);
    const markers = [
        { x: graphW * 0.25, label: '90°/MAX' },
        { x: graphW * 0.5, label: '180°/0' },
        { x: graphW * 0.75, label: '270°/-MAX' },
    ];

    return (
        <svg viewBox={`0 0 ${graphW + 58} ${graphH + 62}`} className="h-[238px] w-full">
            <g transform="translate(42 12)">
                <path d={`M0 0V${graphH}H${graphW}`} fill="none" stroke="rgba(15,23,42,0.48)" strokeWidth="1.4" />
                {[1, 2, 3].map((line) => (
                    <line key={line} x1="0" x2={graphW} y1={(graphH * line) / 4} y2={(graphH * line) / 4} stroke="rgba(15,23,42,0.10)" />
                ))}
                <line x1="0" x2={graphW} y1={graphH / 2} y2={graphH / 2} stroke="rgba(15,23,42,0.25)" strokeDasharray="4 5" />
                {stageMarkers && markers.map((marker) => (
                    <g key={marker.label}>
                        <line x1={marker.x} x2={marker.x} y1="0" y2={graphH} stroke="#facc15" strokeDasharray="5 6" opacity="0.75" />
                        <text x={marker.x} y="12" textAnchor="middle" className="fill-amber-700 text-[10px] font-bold">{marker.label}</text>
                    </g>
                ))}
                <path d={path} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                <text x="-32" y="-3" className="fill-slate-700 text-[11px] font-bold">{yLabel}</text>
                <text x={graphW / 2} y={graphH + 38} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">{xLabel}</text>
                <text x={graphW - 4} y={graphH - 9} textAnchor="end" className="fill-slate-800 text-[12px] font-bold">{readout}</text>
            </g>
        </svg>
    );
}

function historyPath(data: number[], graphW: number, graphH: number, amplitude: number) {
    if (data.length === 0) return `M0 ${graphH / 2}`;
    return data.map((value, index) => {
        const x = (index / Math.max(1, HISTORY_SIZE - 1)) * graphW;
        const y = graphH / 2 - (clamp(value / amplitude, -1, 1) * graphH * 0.42);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                active ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            }`}
        >
            {active ? <Eye size={18} /> : <EyeOff size={18} />}
            {label}
        </button>
    );
}

function ControlButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
        >
            {icon}
            {label}
        </button>
    );
}

function SliderCard({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold uppercase tracking-wide text-slate-600">{label}</span>
                <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-sm font-bold text-slate-800">{value}</span>
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

const sideInfo: Record<SimulationMode, { title: string; points: string[] }> = {
    faraday: {
        title: "Faraday's law",
        points: [
            'Magnetic flux: ΦB = B · A = BA cos θ.',
            'Single loop: ε = −dΦB/dt.',
            'N-turn coil: ε = −N dΦB/dt.',
            "Lenz's law: induced current opposes the flux change.",
        ],
    },
    acgenerator: {
        title: 'AC generator',
        points: [
            'Flux: ΦB = BA cos(ωt).',
            'EMF: ε = NBAω sin(ωt).',
            'Peak EMF: ε₀ = NBAω.',
            'At 90° and 270°, EMF magnitude is maximum.',
        ],
    },
    motional: {
        title: 'Motional EMF',
        points: [
            'Rod moving in field: ε = Blv.',
            'Current: I = ε/R = Blv/R.',
            'Opposing force: F = BIl = B²l²v/R.',
            "Lenz's law makes the force oppose the rod motion.",
        ],
    },
};

function getReadoutItems(
    mode: SimulationMode,
    values: LiveValues,
    angularSpeed: number,
    turns: number,
    magneticField: number,
    rodVelocity: number,
    resistance: number
) {
    if (mode === 'faraday') {
        return [
            { label: 'Flux linked', value: `${values.flux.toFixed(2)} Wb`, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Induced EMF', value: `${values.emf.toFixed(1)} V`, color: values.emf >= 0 ? 'text-emerald-700' : 'text-orange-700', bg: 'bg-emerald-50' },
            { label: 'Magnet speed', value: `${values.velocity.toFixed(0)} px/s`, color: 'text-sky-700', bg: 'bg-sky-50' },
            { label: 'Bulb status', value: Math.abs(values.emf) > 0.5 ? 'Glowing' : 'Dark', color: 'text-slate-800', bg: 'bg-slate-50' },
        ];
    }

    if (mode === 'acgenerator') {
        return [
            { label: 'Angle θ', value: `${values.angle.toFixed(0)}°`, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Frequency', value: `${values.frequency.toFixed(2)} Hz`, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Turns N', value: `${turns}`, color: 'text-slate-800', bg: 'bg-slate-50' },
            { label: 'Angular speed', value: `${angularSpeed.toFixed(1)} rad/s`, color: 'text-purple-700', bg: 'bg-purple-50' },
            { label: 'Peak EMF ε0', value: `${values.peakEmf.toFixed(0)} rel. V`, color: 'text-rose-700', bg: 'bg-rose-50' },
            { label: 'Instant EMF', value: `${values.emf.toFixed(2)} V`, color: 'text-red-700', bg: 'bg-red-50' },
        ];
    }

    return [
        { label: 'Magnetic field', value: `${magneticField.toFixed(1)} T`, color: 'text-blue-700', bg: 'bg-blue-50' },
        { label: 'Rod velocity', value: `${values.velocity.toFixed(1)} m/s`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { label: 'Resistance', value: `${resistance} Ω`, color: 'text-slate-800', bg: 'bg-slate-50' },
        { label: 'Motional EMF', value: `${values.emf.toFixed(1)} V`, color: 'text-amber-700', bg: 'bg-amber-50' },
        { label: 'Current', value: `${values.current.toFixed(2)} A`, color: 'text-yellow-700', bg: 'bg-yellow-50' },
        { label: 'Opposing force', value: `${values.force.toFixed(2)} N`, color: 'text-rose-700', bg: 'bg-rose-50' },
        { label: 'Slider speed', value: `${rodVelocity.toFixed(1)} m/s`, color: 'text-purple-700', bg: 'bg-purple-50' },
    ];
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function quadraticPoint(a: number, b: number, c: number, t: number) {
    return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    drawArrowHead(ctx, x2, y2, Math.atan2(y2 - y1, x2 - x1), color, 12);
}

function drawDoubleArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
    drawArrow(ctx, x1, y1, x2, y2, color, 2);
    drawArrowHead(ctx, x1, y1, Math.atan2(y1 - y2, x1 - x2), color, 10);
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

export default ElectromagneticInductionLab;
