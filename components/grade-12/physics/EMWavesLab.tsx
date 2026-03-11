import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Radio } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface EMWavesLabProps {
    topic: any;
    onExit: () => void;
}

const EMWavesLab: React.FC<EMWavesLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    const [isPlaying, setIsPlaying] = useState(true);
    const [wavelength, setWavelength] = useState(250); // pixels
    const [amplitude, setAmplitude] = useState(80); // Electric field amplitude
    const [showPlanes, setShowPlanes] = useState(true);

    // E_0 / B_0 = c (speed of light). We fix c conceptually to a visual ratio
    const bToERatio = 0.6;
    // v = f * lambda. In our visual space, let velocity be constant c (pixels/sec)
    // C is visually 150 px/sec
    const speed = 150;

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
        let timeAcc = 0;

        const render = (timeMs: number) => {
            const dt = (timeMs - lastTime) / 1000;
            lastTime = timeMs;
            timeAcc += dt * speed;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const width = canvas.width;
            const height = canvas.height;

            // Origin of 3D axes (isometric-ish projection)
            const originX = 150;
            const originY = height / 2 + 50;

            // X-axis (direction of propagation) -> horizontal right
            // Y-axis (Electric Field) -> vertical up
            // Z-axis (Magnetic Field) -> diagonal down-left

            const axisLength = width - originX - 50;
            const zAngle = Math.PI / 6; // 30 degrees down

            // Function to map 3D coordinate (x: propagation, y: E-field, z: B-field) to 2D
            const to2D = (x: number, y: number, z: number) => {
                return {
                    x: originX + x - z * Math.cos(zAngle),
                    y: originY - y + z * Math.sin(zAngle)
                };
            };

            // Draw Base Planes (Optional)
            if (showPlanes) {
                // XY Plane (Red tint)
                ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
                ctx.beginPath();
                let p1 = to2D(0, amplitude * 1.5, 0);
                let p2 = to2D(axisLength, amplitude * 1.5, 0);
                let p3 = to2D(axisLength, -amplitude * 1.5, 0);
                let p4 = to2D(0, -amplitude * 1.5, 0);
                ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
                ctx.fill();

                // XZ Plane (Blue tint)
                const zMax = amplitude * bToERatio * 1.5;
                ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
                ctx.beginPath();
                p1 = to2D(0, 0, zMax);
                p2 = to2D(axisLength, 0, zMax);
                p3 = to2D(axisLength, 0, -zMax);
                p4 = to2D(0, 0, -zMax);
                ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
                ctx.fill();
            }

            // Draw Axes
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();

            // X-axis (Propagation)
            let endP = to2D(axisLength + 20, 0, 0);
            ctx.moveTo(originX, originY); ctx.lineTo(endP.x, endP.y);
            ctx.stroke();
            ctx.fillStyle = '#64748b'; ctx.font = '12px sans-serif'; ctx.fillText('X (Propagation direction c)', endP.x + 10, endP.y);

            // Y-axis
            endP = to2D(0, amplitude * 1.5 + 20, 0);
            ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(endP.x, endP.y); ctx.stroke();
            ctx.fillText('Y (Electric Field)', endP.x - 40, endP.y - 10);

            // Z-axis
            endP = to2D(0, 0, amplitude * bToERatio * 1.5 + 20);
            ctx.beginPath(); ctx.moveTo(originX, originY); ctx.lineTo(endP.x, endP.y); ctx.stroke();
            ctx.fillText('Z (Magnetic Field)', endP.x - 30, endP.y + 20);


            // Draw Waves
            const points = 150;
            ctx.lineWidth = 2;

            const bPath = new Path2D();
            const ePath = new Path2D();

            for (let i = 0; i <= points; i++) {
                const x = (i / points) * axisLength;

                // phase = kx - wt = (2PI/lambda)*x - timeAcc * (2PI/lambda)
                const k = (2 * Math.PI) / wavelength;
                const phase = k * x - k * timeAcc;

                const eMag = Math.sin(phase) * amplitude;
                const bMag = Math.sin(phase) * (amplitude * bToERatio);

                // Draw Electric Field Vector (Y direction)
                const eBase = to2D(x, 0, 0);
                const eTip = to2D(x, eMag, 0);

                ctx.beginPath();
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Red E vectors
                ctx.moveTo(eBase.x, eBase.y);
                ctx.lineTo(eTip.x, eTip.y);
                ctx.stroke();

                // Draw Magnetic Field Vector (Z direction)
                const bBase = to2D(x, 0, 0);
                const bTip = to2D(x, 0, bMag);

                ctx.beginPath();
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)'; // Blue B vectors
                ctx.moveTo(bBase.x, bBase.y);
                ctx.lineTo(bTip.x, bTip.y);
                ctx.stroke();

                // Envelope paths
                if (i === 0) {
                    ePath.moveTo(eTip.x, eTip.y);
                    bPath.moveTo(bTip.x, bTip.y);
                } else {
                    ePath.lineTo(eTip.x, eTip.y);
                    bPath.lineTo(bTip.x, bTip.y);
                }
            }

            // Draw Envelopes Main Line
            ctx.strokeStyle = '#ef4444'; // Solid Red E
            ctx.stroke(ePath);

            ctx.strokeStyle = '#3b82f6'; // Solid Blue B
            ctx.stroke(bPath);

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying, wavelength, amplitude, showPlanes]);

    // Derived values for UI
    const frequency = speed / wavelength; // v = f * lambda

    const simulationCombo = (
        <div className="w-full h-full relative bg-white rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex flex-col">
            <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-200">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                        <span className="text-sm font-bold text-slate-700">Electric Field (E)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                        <span className="text-sm font-bold text-slate-700">Magnetic Field (B)</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative min-h-[300px]">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                />
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setShowPlanes(!showPlanes)} className={`p-2 rounded-lg text-sm font-bold shadow transition-colors ${showPlanes ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}>
                    Toggle Planes
                </button>
                <button onClick={() => setIsPlaying(!isPlaying)} className={`p-2 rounded-lg text-sm font-bold shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200`}>
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={() => { setWavelength(250); setAmplitude(80); }} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6 w-full">
            <div className="text-center p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-sm">
                Electromagnetic waves consist of mutually perpendicular oscillating electric and magnetic fields. Both fields are perpendicular to the direction of propagation (Transverse wave).
                <br /> The speed of the wave in vacuum is given by <span className="font-mono mt-1 inline-block bg-white px-2 rounded border border-indigo-200">c = 1 / √(μ₀ε₀) = E₀ / B₀</span>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 border-b pb-2 flex items-center gap-2">
                        <Radio size={16} className="text-indigo-500" /> Wave Properties
                    </h4>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span>Wavelength (λ)</span>
                            <span className="text-indigo-600 font-mono bg-indigo-50 px-2 rounded">{wavelength} nm</span>
                        </label>
                        <input
                            type="range" min="100" max="400" step="10"
                            value={wavelength}
                            onChange={(e) => setWavelength(Number(e.target.value))}
                            className="w-full accent-indigo-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                            <span>Higher Freq (Gamma)</span>
                            <span>Lower Freq (Radio)</span>
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span>Amplitude (E₀)</span>
                            <span className="text-red-500 font-mono bg-red-50 px-2 rounded">{amplitude} V/m</span>
                        </label>
                        <input
                            type="range" min="20" max="150" step="5"
                            value={amplitude}
                            onChange={(e) => setAmplitude(Number(e.target.value))}
                            className="w-full accent-red-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 border-b pb-2">Derived Relations</h4>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 font-medium">Wave Speed (v)</span>
                            <span className="font-mono font-bold text-slate-800">c (Const)</span>
                        </div>
                        <div className="w-full h-px bg-slate-200"></div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 font-medium">Frequency (f = v/λ)</span>
                            <span className="font-mono font-bold text-indigo-600">{frequency.toFixed(2)} Hz (scaled)</span>
                        </div>
                        <div className="w-full h-px bg-slate-200"></div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 font-medium">Magnetic Amplitude (B₀)</span>
                            <span className="font-mono font-bold text-blue-600">{(amplitude * bToERatio).toFixed(1)} T</span>
                        </div>
                        <div className="text-xs text-slate-400 text-right">E₀ / c = B₀</div>
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

export default EMWavesLab;
