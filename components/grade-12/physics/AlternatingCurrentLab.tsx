import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ACLabProps {
    topic: any;
    onExit: () => void;
}

const AlternatingCurrentLab: React.FC<ACLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    const [isPlaying, setIsPlaying] = useState(true);
    const [primaryTurns, setPrimaryTurns] = useState(100);
    const [secondaryTurns, setSecondaryTurns] = useState(200);
    const [inputVoltagePeak, setInputVoltagePeak] = useState(220); // standard AC

    // Physics constants
    const frequency = 50; // Hz
    // time scaled down for visual tracking
    const angularSpeed = (2 * Math.PI * frequency) * 0.01;

    const timeRef = useRef(0);

    const [liveData, setLiveData] = useState({
        vp: 0,
        vs: 0,
        flux: 0
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        const resizeObserver = new ResizeObserver(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        resizeObserver.observe(parent);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (!isPlaying) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = performance.now();

        const render = (timeMs: number) => {
            const width = canvas.width;
            const height = canvas.height;
            const dt = (timeMs - lastTime) / 1000;
            lastTime = timeMs;

            timeRef.current += dt * angularSpeed;
            const t = timeRef.current;

            const vp = inputVoltagePeak * Math.sin(t);
            // Flux lags voltage by 90 degrees in ideal inductor: V = N dPhi/dt => Phi = - (V_peak / (N * w)) * cos(wt)
            // But visually, just saying flux is proportional to integral of V
            const fluxPeak = inputVoltagePeak / (primaryTurns * angularSpeed); // Simplified max flux
            const flux = -fluxPeak * Math.cos(t) * 1000; // Scaled for visual color

            const ratio = secondaryTurns / primaryTurns;
            const vs = vp * ratio;

            // Optional: Update React state slowly for UI numbers, but draw canvas instantly
            if (Math.floor(timeMs) % 5 === 0) {
                setLiveData({ vp, vs, flux });
            }

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, width, height);

            // --- Draw Iron Core ---
            const coreX = width / 2 - 120;
            const coreY = height / 2 - 120;
            const coreW = 240;
            const coreH = 240;
            const thick = 50;

            // Core shadow
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(coreX + 10, coreY + 10, coreW, coreH);

            // Flux color in core based on flux magnitude and direction
            // If flux > 0, red tint. If flux < 0, blue tint.
            const fluxIntensity = Math.min(1, Math.abs(flux) / 100);
            const r = flux > 0 ? 200 + 55 * fluxIntensity : 200 - 50 * fluxIntensity;
            const b = flux < 0 ? 200 + 55 * fluxIntensity : 200 - 50 * fluxIntensity;
            ctx.fillStyle = `rgb(${r}, 200, ${b})`;

            ctx.fillRect(coreX, coreY, coreW, coreH);
            ctx.clearRect(coreX + thick, coreY + thick, coreW - thick * 2, coreH - thick * 2);

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 3;
            ctx.strokeRect(coreX, coreY, coreW, coreH);
            ctx.strokeRect(coreX + thick, coreY + thick, coreW - thick * 2, coreH - thick * 2);

            // Laminations (lines)
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < coreW; i += 10) {
                ctx.beginPath(); ctx.moveTo(coreX + i, coreY); ctx.lineTo(coreX + i, coreY + coreH); ctx.stroke();
            }

            // --- Draw Coils ---
            const drawCoil = (x: number, startY: number, h: number, turns: number, maxTurns: number, color: string, currentVal: number) => {
                const effectiveTurns = Math.min(maxTurns, Math.max(10, turns / 5)); // visual scaling
                const turnSpacing = h / (effectiveTurns + 1);

                // Glow based on voltage/current
                const glowIntensity = Math.min(1, Math.abs(currentVal) / inputVoltagePeak);
                if (glowIntensity > 0.1) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = glowIntensity * 20;
                }

                ctx.strokeStyle = color;
                ctx.lineWidth = turns > 150 ? 2 : 4; // thinner wire if more turns
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.beginPath();
                for (let i = 0; i < effectiveTurns; i++) {
                    const y = startY + (i + 1) * turnSpacing;
                    // Draw a loop wrapping around the core side
                    ctx.moveTo(x - 10, y - turnSpacing / 2);
                    ctx.bezierCurveTo(x + thick + 20, y - turnSpacing / 2, x + thick + 20, y + turnSpacing / 2, x - 10, y + turnSpacing / 2);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            };

            // Primary coil (left side)
            drawCoil(coreX, coreY, coreH, primaryTurns, 50, '#ef4444', vp);

            // Secondary coil (right side)
            drawCoil(coreX + coreW - thick, coreY, coreH, secondaryTurns, 50, '#3b82f6', vs);

            // --- Draw AC Source Symbol ---
            const srcX = coreX - 80;
            const srcY = height / 2;

            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(coreX, coreY + 20); ctx.lineTo(srcX, coreY + 20); ctx.lineTo(srcX, srcY - 20);
            ctx.moveTo(coreX, coreY + coreH - 20); ctx.lineTo(srcX, coreY + coreH - 20); ctx.lineTo(srcX, srcY + 20);
            ctx.stroke();

            // Source Circle
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath(); ctx.arc(srcX, srcY, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            // Sine wave inside circle
            ctx.beginPath();
            ctx.moveTo(srcX - 10, srcY);
            ctx.quadraticCurveTo(srcX - 5, srcY - 10, srcX, srcY);
            ctx.quadraticCurveTo(srcX + 5, srcY + 10, srcX + 10, srcY);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('AC Input', srcX - 25, srcY + 40);

            // --- Draw Voltmeter / Output ---
            const outX = coreX + coreW + 80;
            const outY = height / 2;

            ctx.strokeStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(coreX + coreW, coreY + 20); ctx.lineTo(outX, coreY + 20); ctx.lineTo(outX, outY - 20);
            ctx.moveTo(coreX + coreW, coreY + coreH - 20); ctx.lineTo(outX, coreY + coreH - 20); ctx.lineTo(outX, outY + 20);
            ctx.stroke();

            // Voltmeter Circle
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath(); ctx.arc(outX, outY, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#3b82f6';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText('V', outX - 5, outY + 5);
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText('Load', outX - 15, outY + 40);

            // --- Flux Arrows in Core ---
            const drawArrow = (x: number, y: number, direction: 'up' | 'down' | 'left' | 'right') => {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                if (direction === 'up') { ctx.moveTo(x, y - 10); ctx.lineTo(x - 5, y + 5); ctx.lineTo(x + 5, y + 5); }
                else if (direction === 'down') { ctx.moveTo(x, y + 10); ctx.lineTo(x - 5, y - 5); ctx.lineTo(x + 5, y - 5); }
                else if (direction === 'right') { ctx.moveTo(x + 10, y); ctx.lineTo(x - 5, y - 5); ctx.lineTo(x - 5, y + 5); }
                else { ctx.moveTo(x - 10, y); ctx.lineTo(x + 5, y - 5); ctx.lineTo(x + 5, y + 5); }
                ctx.fill();
            }

            if (Math.abs(flux) > 10) {
                const dir = flux > 0 ? 1 : -1;
                // top bar (right)
                drawArrow(coreX + coreW / 2, coreY + thick / 2, dir > 0 ? 'right' : 'left');
                // bottom bar (left)
                drawArrow(coreX + coreW / 2, coreY + coreH - thick / 2, dir > 0 ? 'left' : 'right');
                // right bar (down)
                drawArrow(coreX + coreW - thick / 2, coreY + coreH / 2, dir > 0 ? 'down' : 'up');
                // left bar (up)
                drawArrow(coreX + thick / 2, coreY + coreH / 2, dir > 0 ? 'up' : 'down');
            }

            // Labels for turns
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`Primary: ${primaryTurns} turns`, coreX - 50, coreY - 20);
            ctx.fillText(`Secondary: ${secondaryTurns} turns`, coreX + coreW - 80, coreY - 20);

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying, primaryTurns, secondaryTurns, inputVoltagePeak]);

    const ratio = (secondaryTurns / primaryTurns).toFixed(2);
    const transformerType = secondaryTurns > primaryTurns ? 'Step-Up' : (secondaryTurns < primaryTurns ? 'Step-Down' : 'Isolation');

    // RMS Values
    const vpHrms = (inputVoltagePeak / Math.SQRT2).toFixed(1);
    const vsHrms = ((inputVoltagePeak * secondaryTurns / primaryTurns) / Math.SQRT2).toFixed(1);

    // Derived current values (reference load = 1000 W for illustration)
    const referenceLoad = 1000; // W
    const vpRms = inputVoltagePeak / Math.SQRT2;
    const ipRms = (referenceLoad / vpRms).toFixed(2);
    const isRms = (Number(ipRms) * (primaryTurns / secondaryTurns)).toFixed(2);

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full mix-blend-multiply"
                />
            </div>

            <div className="bg-slate-800 text-white flex justify-around p-3 text-sm font-mono border-t border-slate-700">
                <div className="flex flex-col items-center">
                    <span className="text-slate-400 text-xs">Primary V (RMS)</span>
                    <span className="text-red-400 font-bold">{vpHrms} V</span>
                </div>
                <div className="flex flex-col items-center border-l border-slate-600 pl-8">
                    <span className="text-slate-400 text-xs">Transformer Type</span>
                    <span className="text-amber-400 font-bold">{transformerType}</span>
                </div>
                <div className="flex flex-col items-center border-l border-slate-600 pl-8">
                    <span className="text-slate-400 text-xs">Secondary V (RMS)</span>
                    <span className="text-blue-400 font-bold">{vsHrms} V</span>
                </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-lg text-sm font-bold shadow transition-colors bg-white text-slate-700 hover:bg-slate-50`}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={() => { setPrimaryTurns(100); setSecondaryTurns(200); }} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 w-full">
            <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-sm">
                An ideal transformer works on the principle of <strong>Mutual Induction</strong>.
                <br /> The magnetic flux linked with the primary coil is completely linked to the secondary coil through the soft iron core.
                <br /> <span className="font-mono mt-2 inline-block bg-white px-2 py-1 rounded border border-blue-200">V_s / V_p = N_s / N_p</span>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 border-b pb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div> Primary Coil (Input)
                    </h4>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span>Number of Turns (Np)</span>
                            <span className="text-red-500 font-mono bg-red-50 px-2 rounded">{primaryTurns}</span>
                        </label>
                        <input
                            type="range" min="20" max="500" step="10"
                            value={primaryTurns}
                            onChange={(e) => setPrimaryTurns(Number(e.target.value))}
                            className="w-full accent-red-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span>Input Peak Volts (Vp)</span>
                            <span className="text-red-500 font-mono bg-red-50 px-2 rounded">{inputVoltagePeak} V</span>
                        </label>
                        <input
                            type="range" min="10" max="311" step="1"
                            value={inputVoltagePeak}
                            onChange={(e) => setInputVoltagePeak(Number(e.target.value))}
                            className="w-full accent-red-300 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 border-b pb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div> Secondary Coil (Output)
                    </h4>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span>Number of Turns (Ns)</span>
                            <span className="text-blue-500 font-mono bg-blue-50 px-2 rounded">{secondaryTurns}</span>
                        </label>
                        <input
                            type="range" min="20" max="500" step="10"
                            value={secondaryTurns}
                            onChange={(e) => setSecondaryTurns(Number(e.target.value))}
                            className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center opacity-80">
                        <span className="text-sm font-bold text-slate-600">Turns Ratio (k) = {ratio}</span>
                        <div className={`px-3 py-1 text-xs font-bold rounded text-white ${transformerType === 'Step-Up' ? 'bg-amber-500' : 'bg-green-500'}`}>
                            {transformerType}
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-2 text-sm">
                        <h4 className="font-bold text-blue-800 border-b border-blue-200 pb-1">Derived Relations</h4>
                        <div className="flex justify-between items-center">
                            <span className="text-blue-700 font-medium">Input current (Ip)</span>
                            <span className="font-mono text-blue-900 bg-white px-2 rounded border border-blue-200">Ip = P / Vp ≈ {ipRms} A</span>
                        </div>
                        <p className="text-[10px] text-blue-500">(Reference load P = 1000 W for illustration)</p>
                        <div className="flex justify-between items-center">
                            <span className="text-blue-700 font-medium">Output current (Is)</span>
                            <span className="font-mono text-blue-900 bg-white px-2 rounded border border-blue-200">Is = Ip × (Np / Ns) ≈ {isRms} A</span>
                        </div>
                        <div className="text-[10px] text-blue-700 italic border-t border-blue-200 pt-2">
                            For ideal transformer: Vp × Ip = Vs × Is (power conserved)
                        </div>
                        <div className="text-[10px] text-slate-500 italic">
                            This is an ideal transformer model (100% efficiency). Real transformers have copper and iron losses. (NCERT Ch. 7)
                        </div>
                    </div>
                </div>
            </div>
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

export default AlternatingCurrentLab;
