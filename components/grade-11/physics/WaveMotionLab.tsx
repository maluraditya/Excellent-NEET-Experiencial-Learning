import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RotateCcw, Info } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface WaveMotionLabProps {
    topic: any;
    onExit: () => void;
}

type WaveType = 'transverse' | 'longitudinal';

const WaveMotionLab: React.FC<WaveMotionLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    // --- State ---
    const [waveType, setWaveType] = useState<WaveType>('transverse');
    const [amplitude, setAmplitude] = useState(40);
    const [frequency, setFrequency] = useState(2.0);
    const [tension, setTension] = useState(500); // Affects wave speed v = sqrt(T/mu)
    const [mu, setMu] = useState(0.5); // Linear mass density
    const [running, setRunning] = useState(true);

    const stateRef = useRef({
        waveType, amplitude, frequency, tension, mu, running,
        time: 0,
        particles: Array.from({ length: 60 }, (_, i) => ({ x: i * 15, y: 0 }))
    });

    useEffect(() => {
        stateRef.current.waveType = waveType;
        stateRef.current.amplitude = amplitude;
        stateRef.current.frequency = frequency;
        stateRef.current.tension = tension;
        stateRef.current.mu = mu;
        stateRef.current.running = running;
    }, [waveType, amplitude, frequency, tension, mu, running]);

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
        return () => resizeObserver.disconnect();
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }

        const s = stateRef.current;
        if (s.running) s.time += 0.016;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        const v = Math.sqrt(s.tension / s.mu);
        const omega = 2 * Math.PI * s.frequency;
        const k = omega / v;

        const pivotX = 50;
        const pivotY = H / 2;
        const spacing = (W - 100) / (s.particles.length - 1);

        // --- Draw Piston Source ---
        const pistonPos = s.amplitude * Math.sin(omega * s.time);
        ctx.fillStyle = '#475569';
        if (s.waveType === 'transverse') {
            ctx.fillRect(pivotX - 10, pivotY + pistonPos - 30, 20, 60);
        } else {
            ctx.fillRect(pivotX + pistonPos - 10, pivotY - 30, 20, 60);
        }

        // --- Draw Particles ---
        s.particles.forEach((p, i) => {
            const x0 = pivotX + i * spacing;
            const phase = k * (x0 - pivotX) - omega * s.time;
            const disp = s.amplitude * Math.sin(phase);

            let px, py;
            const isTracer = i === 20;

            if (s.waveType === 'transverse') {
                px = x0;
                py = pivotY + disp;
                
                // Draw connecting string
                if (i > 0) {
                    const prevX = pivotX + (i-1) * spacing;
                    const prevPhase = k * (prevX - pivotX) - omega * s.time;
                    const prevDisp = s.amplitude * Math.sin(prevPhase);
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(prevX, pivotY + prevDisp);
                    ctx.lineTo(px, py);
                    ctx.stroke();
                }
            } else {
                px = x0 + disp;
                py = pivotY;
                
                // Draw compression shading for longitudinal
                ctx.fillStyle = `rgba(37, 99, 235, ${0.1 + Math.max(0, -disp/s.amplitude) * 0.3})`;
                ctx.fillRect(px - 10, py - 40, 20, 80);
            }

            ctx.fillStyle = isTracer ? '#ef4444' : '#2563eb';
            ctx.beginPath();
            ctx.arc(px, py, isTracer ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();

            if (isTracer) {
                // Label for tracer particle
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('TRACER (Matter stays)', px, py - 15);
            }
        });

        // --- HUD / Labels ---
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Wave Speed (v): ${v.toFixed(1)} m/s`, 20, 90);
        ctx.fillText(`Wavelength (W): ${(v / s.frequency).toFixed(1)} m`, 20, 115);

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, [draw]);

    const reset = () => {
        setAmplitude(40);
        setFrequency(2.0);
        setTension(500);
        setMu(0.5);
        stateRef.current.time = 0;
    };

    const simulationCombo = (
        <div className="w-full h-full relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute top-4 right-4 flex gap-2">
                <button 
                    onClick={() => setWaveType('transverse')}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${waveType === 'transverse' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >TRANSVERSE</button>
                <button 
                    onClick={() => setWaveType('longitudinal')}
                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${waveType === 'longitudinal' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >LONGITUDINAL</button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col xl:flex-row gap-6 w-full text-slate-700 p-2">
            <div className="hidden xl:flex flex-col gap-4 w-72 shrink-0 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm overflow-y-auto max-h-[500px]">
                <div className="flex items-center gap-2 text-blue-600 font-bold border-b pb-3 mb-1">
                    <Info size={20} />
                    <span className="text-sm uppercase">Scientific Context</span>
                </div>
                <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                    <p><strong>Wave Motion:</strong> Energy travels, but medium particles only oscillate about their equilibrium position.</p>
                    <p><strong>Transverse:</strong> Motion is perpendicular to propagation (e.g., string waves).</p>
                    <p><strong>Longitudinal:</strong> Motion is parallel to propagation, creating compressions and rarefactions (e.g., sound).</p>
                    <p><strong>Speed (v):</strong> v = sqrt(T/mu) for a string. Speed depends on elastic and inertial properties of the medium.</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <label className="flex justify-between text-sm font-bold">
                            <span>Frequency (f)</span>
                            <span className="text-blue-600">{frequency.toFixed(1)} Hz</span>
                        </label>
                        <input type="range" min="0.5" max="5" step="0.1" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                        
                        <label className="flex justify-between text-sm font-bold pt-2">
                            <span>Amplitude (A)</span>
                            <span className="text-blue-600">{amplitude} px</span>
                        </label>
                        <input type="range" min="10" max="80" step="1" value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div className="space-y-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <label className="flex justify-between text-sm font-bold">
                            <span>Tension (T)</span>
                            <span className="text-blue-600">{tension} N</span>
                        </label>
                        <input type="range" min="100" max="2000" step="50" value={tension} onChange={(e) => setTension(Number(e.target.value))} className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />

                        <label className="flex justify-between text-sm font-bold pt-2">
                            <span>Inertia (mu)</span>
                            <span className="text-blue-600">{mu.toFixed(2)} kg/m</span>
                        </label>
                        <input type="range" min="0.1" max="2" step="0.05" value={mu} onChange={(e) => setMu(Number(e.target.value))} className="w-full accent-emerald-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>

                <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${running ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-600 text-white shadow-lg'}`}>
                        {running ? 'PAUSE' : 'PLAY'}
                    </button>
                    <button onClick={reset} className="px-8 py-3 bg-white text-slate-600 border border-slate-200 rounded-lg font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
                        <RotateCcw size={18} /> RESET
                    </button>
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

export default WaveMotionLab;
