import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RotateCcw, Play, Pause, Zap, Activity } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface SimplePendulumLabProps {
    topic: any;
    onExit: () => void;
}

const SimplePendulumLab: React.FC<SimplePendulumLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);

    // --- State ---
    const [length, setLength] = useState(1.0);
    const [mass, setMass] = useState(0.1);
    const [gravity, setGravity] = useState(9.8);
    const [damping, setDamping] = useState(0.05);
    const [running, setRunning] = useState(false);
    const [showVectors, setShowVectors] = useState(true);
    
    const [initAngle, setInitAngle] = useState(30);
    // Stopwatch State
    const [isTiming, setIsTiming] = useState(true);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [measuredPeriod, setMeasuredPeriod] = useState<number | null>(null);

    // --- Refs for Physics ---
    const stateRef = useRef({
        L: 1.0, m: 0.1, g: 9.8, b: 0.05, 
        theta: 30 * Math.PI / 180, 
        omega: 0, 
        time: 0, 
        running: true,
        initTheta: 30 * Math.PI / 180
    });
    
    const graphRef = useRef<{ t: number; theta: number; theoryTheta: number }[]>([]);
    const frameRef = useRef(0);
    const timerRef = useRef({ start: 0, elapsed: 0, active: true, oscCount: 0, lastOmega: 0 });

    // Sync React state to Ref
    useEffect(() => {
        stateRef.current.L = length;
        stateRef.current.m = mass;
        stateRef.current.g = gravity;
        stateRef.current.b = damping;
        stateRef.current.running = running;
    }, [length, mass, gravity, damping, running]);

    // Canvas Resize
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

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }
        
        const s = stateRef.current;
        const tRef = timerRef.current;
        frameRef.current++;

        // --- Physics Update (RK4 Integration) ---
        if (s.running) {
            const dt = 0.016; // 60fps approximation
            const subSteps = 4;
            const h = dt / subSteps;

            for (let i = 0; i < subSteps; i++) {
                // f(theta, omega) = [omega, -(g/L)sin(theta) - (b/m)omega]
                const getAcc = (th: number, om: number) => -(s.g / s.L) * Math.sin(th) - (s.b / s.m) * om;

                const k1_th = s.omega;
                const k1_om = getAcc(s.theta, s.omega);

                const k2_th = s.omega + 0.5 * h * k1_om;
                const k2_om = getAcc(s.theta + 0.5 * h * k1_th, s.omega + 0.5 * h * k1_om);

                const k3_th = s.omega + 0.5 * h * k2_om;
                const k3_om = getAcc(s.theta + 0.5 * h * k2_th, s.omega + 0.5 * h * k2_om);

                const k4_th = s.omega + h * k3_om;
                const k4_om = getAcc(s.theta + h * k3_th, s.omega + h * k3_om);

                s.theta += (h / 6) * (k1_th + 2 * k2_th + 2 * k3_th + k4_th);
                s.omega += (h / 6) * (k1_om + 2 * k2_om + 2 * k3_om + k4_om);
            }
            s.time += dt;

            // --- Stopwatch Logic ---
            if (tRef.active) {
                tRef.elapsed += dt;
                setElapsedTime(tRef.elapsed);

                // Auto-timer: Count zero-crossings
                if ((tRef.lastOmega <= 0 && s.omega > 0) || (tRef.lastOmega >= 0 && s.omega < 0)) {
                    tRef.oscCount += 0.5; // Half oscillation
                    if (tRef.oscCount >= 10) { // Stop at 10 full oscillations
                        tRef.active = false;
                        setIsTiming(false);
                        setMeasuredPeriod(tRef.elapsed / 10);
                        s.running = false; // Stop simulation after 10 oscillations
                        setRunning(false);
                    }
                }
            }
            tRef.lastOmega = s.omega;
        }

        // Theory Overlay (Small Angle)
        const omega_theory = Math.sqrt(s.g / s.L);
        const theta_theory = s.initTheta * Math.exp(- (s.b / (2 * s.m)) * s.time) * Math.cos(omega_theory * s.time);

        // Data for Graph
        if (s.running && frameRef.current % 2 === 0) {
            graphRef.current.push({ t: s.time, theta: s.theta, theoryTheta: theta_theory });
            if (graphRef.current.length > 300) graphRef.current.shift();
        }

        // --- Render ---
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; // Platform Standard Soft White
        ctx.fillRect(0, 0, W, H);

        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

        // Animation Viewport
        const topH = H * 0.50; // Increased to 50% for better spacing
        const pivotX = W * 0.5;
        const pivotY = pad * 2.8; 
        
        const bobR = (10 + Math.sqrt(s.m) * 25) * scale;
        // Strict boundary: pivotY + visualL + bobR <= topH
        const maxVisualL = topH - pivotY - bobR - 5; 
        const visualL = Math.min(s.L * 160 * scale, maxVisualL);

        // 1. Draw Protractor (Reference for teachers)
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, visualL + 20, 0, Math.PI);
        ctx.stroke();
        for (let a = -90; a <= 90; a += 10) {
            const rad = (a + 90) * Math.PI / 180;
            const len = a % 30 === 0 ? 15 : 8;
            ctx.beginPath();
            ctx.moveTo(pivotX + (visualL + 20) * Math.sin(rad), pivotY + (visualL + 20) * Math.cos(rad));
            ctx.lineTo(pivotX + (visualL + 20 - len) * Math.sin(rad), pivotY + (visualL + 20 - len) * Math.cos(rad));
            ctx.stroke();
            if (a % 30 === 0) {
                ctx.fillStyle = '#94a3b8'; ctx.font = `${fs(10)}px sans-serif`; ctx.textAlign = 'center';
                ctx.fillText(`${Math.abs(a)}°`, pivotX + (visualL + 40) * Math.sin(rad), pivotY + (visualL + 40) * Math.cos(rad));
            }
        }

        // 2. Pivot
        ctx.fillStyle = '#475569';
        ctx.beginPath(); ctx.arc(pivotX, pivotY, 6 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2; ctx.stroke();

        // 3. String & Bob
        const bobX = pivotX + visualL * Math.sin(s.theta);
        const bobY = pivotY + visualL * Math.cos(s.theta);

        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2 * scale;
        ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(bobX, bobY); ctx.stroke();

        // Bob Gradient (3D look)
        const grad = ctx.createRadialGradient(bobX - bobR * 0.3, bobY - bobR * 0.3, 2, bobX, bobY, bobR);
        grad.addColorStop(0, '#60a5fa'); grad.addColorStop(1, '#2563eb');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(bobX, bobY, bobR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 2; ctx.stroke();

        // 4. Force Vectors
        if (showVectors) {
            const fScale = 40 * scale;
            // Gravity (mg) - Red
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3 * scale;
            drawArrow(ctx, bobX, bobY, bobX, bobY + fScale, 8 * scale);
            ctx.fillStyle = '#ef4444'; ctx.font = `bold ${fs(12)}px sans-serif`;
            ctx.fillText('mg', bobX + 5, bobY + fScale + 15);

            // Tension (T) - Green
            const tensionMag = (s.m * s.g * Math.cos(s.theta) + s.m * s.L * s.omega * s.omega);
            const tEndX = bobX - (bobX - pivotX) * 0.4;
            const tEndY = bobY - (bobY - pivotY) * 0.4;
            ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 3 * scale;
            drawArrow(ctx, bobX, bobY, tEndX, tEndY, 8 * scale);
            ctx.fillStyle = '#16a34a'; ctx.fillText('T', tEndX - 15, tEndY - 5);
        }

        // 5. Floating Info (Digital Stopwatch & Oscillation Counter)
        const stopW = 140 * scale;
        const boxPad = 8 * scale;
        const stopX = W - stopW - pad;
        const stopY = pad;

        // Time Box
        const timeBoxH = 45 * scale;
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e2e8f0';
        roundRect(ctx, stopX, stopY, stopW, timeBoxH, 12); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = '#1e293b'; ctx.font = `bold ${fs(18)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText(`${tRef.elapsed.toFixed(2)}s`, stopX + stopW / 2, stopY + timeBoxH * 0.65);
        
        ctx.fillStyle = '#94a3b8'; ctx.font = `bold ${fs(8)}px sans-serif`;
        ctx.fillText('ELAPSED TIME', stopX + stopW / 2, stopY + 12 * scale);

        // Oscillation Box
        const oscBoxY = stopY + timeBoxH + boxPad;
        const oscBoxH = 40 * scale;
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e2e8f0';
        roundRect(ctx, stopX, oscBoxY, stopW, oscBoxH, 12); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(`OSC: ${Math.floor(tRef.oscCount)}/10`, stopX + stopW / 2, oscBoxY + oscBoxH * 0.7);

        ctx.fillStyle = '#94a3b8'; ctx.font = `bold ${fs(8)}px sans-serif`;
        ctx.fillText('COUNT', stopX + stopW / 2, oscBoxY + 12 * scale);

        // --- Bottom Layout: Graphs + Energy ---
        const bottomY = topH + pad;
        const bottomH = H - bottomY - pad;

        // Left: Comparison Graph (Theta vs Time)
        const graphW = W * 0.6;
        const graphX = pad;
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e2e8f0';
        roundRect(ctx, graphX, bottomY, graphW, bottomH, 12); ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = '#1e293b'; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('DISPLACEMENT θ(t) — [Solid: Actual, Dashed: Ideal SHM]', graphX + 15, bottomY + 25);

        const gd = graphRef.current;
        if (gd.length > 1) {
            const centerY = bottomY + bottomH / 2;
            const ampScale = (bottomH * 0.35) / (s.initTheta || 1);
            
            // Theory Line (Dashed)
            ctx.setLineDash([5, 5]); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            gd.forEach((d, i) => {
                const px = graphX + (i / (gd.length - 1)) * graphW;
                const py = centerY - d.theoryTheta * ampScale;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            });
            ctx.stroke(); ctx.setLineDash([]);

            // Actual Line
            ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3;
            ctx.beginPath();
            gd.forEach((d, i) => {
                const px = graphX + (i / (gd.length - 1)) * graphW;
                const py = centerY - d.theta * ampScale;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            });
            ctx.stroke();
        }

        // Right: Info Cards
        const rightX = graphX + graphW + pad;
        const rightW = W - rightX - pad;
        
        // Theory vs Measured Card
        const cardH = (bottomH - pad) / 2;
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2563eb40';
        roundRect(ctx, rightX, bottomY, rightW, cardH, 12); ctx.fill(); ctx.stroke();
        
        const theoryT = 2 * Math.PI * Math.sqrt(s.L / s.g);
        ctx.fillStyle = '#2563eb'; ctx.font = `bold ${fs(16)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText(`Theory T: ${theoryT.toFixed(3)}s`, rightX + rightW / 2, bottomY + cardH * 0.4);
        ctx.fillStyle = measuredPeriod ? '#16a34a' : '#64748b';
        ctx.fillText(`Measured: ${measuredPeriod ? measuredPeriod.toFixed(3) + 's' : '---'}`, rightX + rightW / 2, bottomY + cardH * 0.7);

        // Energy Bar Chart
        const ebY = bottomY + cardH + pad;
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#e2e8f0';
        roundRect(ctx, rightX, ebY, rightW, cardH, 12); ctx.fill(); ctx.stroke();
        
        const PE = s.m * s.g * s.L * (1 - Math.cos(s.theta));
        const KE = 0.5 * s.m * (s.L * s.omega) * (s.L * s.omega);
        const maxE = s.m * s.g * s.L * (1 - Math.cos(s.initTheta));
        
        const drawBar = (x: number, val: number, color: string, label: string) => {
            const bW = rightW * 0.2;
            const bH = (val / (maxE || 1)) * (cardH * 0.6);
            ctx.fillStyle = '#f1f5f9'; roundRect(ctx, x, ebY + cardH * 0.8 - (cardH * 0.6), bW, cardH * 0.6, 4); ctx.fill();
            ctx.fillStyle = color; roundRect(ctx, x, ebY + cardH * 0.8 - bH, bW, bH, 4); ctx.fill();
            ctx.fillStyle = '#475569'; ctx.font = `bold ${fs(9)}px sans-serif`; ctx.fillText(label, x + bW / 2, ebY + cardH * 0.92);
        };
        drawBar(rightX + rightW * 0.15, KE, '#16a34a', 'KE');
        drawBar(rightX + rightW * 0.4, PE, '#ef4444', 'PE');
        drawBar(rightX + rightW * 0.65, KE + PE, '#d97706', 'TOTAL');

        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(20)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('Simple Pendulum Dynamics Lab', pad + 220 * scale, pad * 1.3);

        animRef.current = requestAnimationFrame(draw);
    }, [showVectors]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animRef.current);
    }, [draw]);

    const handleReset = (overrideAngle?: number | React.MouseEvent) => {
        const angleToUse = typeof overrideAngle === 'number' ? overrideAngle : initAngle;
        const thetaRad = angleToUse * Math.PI / 180;
        stateRef.current.theta = thetaRad;
        stateRef.current.omega = 0;
        stateRef.current.time = 0;
        stateRef.current.initTheta = thetaRad;
        stateRef.current.running = false;
        graphRef.current = [];
        timerRef.current = { start: 0, elapsed: 0, active: true, oscCount: 0, lastOmega: 0 };
        setElapsedTime(0); setIsTiming(true); setMeasuredPeriod(null);
        setRunning(false);
    };

    // --- Components ---
    const simulationCombo = (
        <div className="w-full h-full relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-4 w-full text-slate-700 p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <ControlCard label="String Length" value={`${length.toFixed(2)}m`} icon="📏" color="violet">
                    <input type="range" min="0.2" max="2.0" step="0.05" value={length} onChange={(e) => { setLength(Number(e.target.value)); handleReset(); }} className="w-full accent-violet-600" />
                </ControlCard>
                <ControlCard label="Bob Mass" value={`${(mass * 1000).toFixed(0)}g`} icon="⚖️" color="blue">
                    <input type="range" min="0.01" max="0.5" step="0.01" value={mass} onChange={(e) => setMass(Number(e.target.value))} className="w-full accent-blue-600" />
                </ControlCard>
                <ControlCard label="Gravity" value={`${gravity.toFixed(1)}m/s²`} icon="🌍" color="emerald">
                    <select value={gravity} onChange={(e) => { setGravity(Number(e.target.value)); handleReset(); }} className="w-full p-1 bg-slate-50 border rounded text-sm font-mono">
                        <option value={9.8}>Earth (9.8)</option>
                        <option value={1.62}>Moon (1.62)</option>
                        <option value={3.72}>Mars (3.72)</option>
                        <option value={24.8}>Jupiter (24.8)</option>
                    </select>
                </ControlCard>
                <ControlCard label="Damping" value={damping.toFixed(2)} icon="💨" color="amber">
                    <input type="range" min="0" max="0.5" step="0.01" value={damping} onChange={(e) => setDamping(Number(e.target.value))} className="w-full accent-amber-600" />
                </ControlCard>
                <ControlCard label="Release Angle" value={`${initAngle}°`} icon="📐" color="rose">
                    <input type="range" min="5" max="90" step="1" value={initAngle} onChange={(e) => { const val = Number(e.target.value); setInitAngle(val); handleReset(val); }} className="w-full accent-rose-600" />
                </ControlCard>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex gap-2">
                    <button onClick={() => setRunning(!running)} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-sm ${running ? 'bg-red-500 text-white shadow-red-200 shadow-lg border-red-600' : 'bg-emerald-600 text-white shadow-emerald-200 shadow-lg'}`}>
                        {running ? <Pause size={18} /> : <Play size={18} />} {running ? 'STOP' : 'START'}
                    </button>
                    <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-all">
                        <RotateCcw size={18} /> RESET
                    </button>
                </div>

                <button onClick={() => setShowVectors(!showVectors)} className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold border transition-all ${showVectors ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                    {showVectors ? <Zap size={18} /> : <Activity size={18} />} VECTORS
                </button>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

// --- Helpers ---
const ControlCard: React.FC<{ label: string; value: string; icon: string; color: string; children: React.ReactNode }> = ({ label, value, icon, color, children }) => (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-600">{icon} {label}</span>
            <span className={`text-sm font-mono font-bold px-2 py-1 rounded bg-${color}-50 text-${color}-700 border border-${color}-100`}>{value}</span>
        </div>
        {children}
    </div>
);

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, size: number) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath(); ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

export default SimplePendulumLab;
