import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface FluidDynamicsLabProps {
    flowRate: number; // Volume flux
    constrictionArea: number; // Cross-sectional area at the narrowest point
    onFlowRateChange: (val: number) => void;
    onAreaChange: (val: number) => void;
}

const FluidDynamicsLab: React.FC<FluidDynamicsLabProps> = ({ flowRate, constrictionArea, onFlowRateChange, onAreaChange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    // Constants
    const A1 = 100; // Fixed wide area 
    const rho = 1000; // Density of water (kg/m^3)
    const P_atm = 101325; // Atmospheric pressure 

    // Calculations based on Continuity Equation: A1 * v1 = A2 * v2 = flowRate
    // where flowRate is Q. So v = Q / A.
    const v1 = flowRate / A1;
    const v2 = flowRate / constrictionArea;

    // Bernoulli's: P1 + 0.5 * rho * v1^2 = P2 + 0.5 * rho * v2^2 (h is constant)
    // Let P1 be based on flow rate, but let's just make P1 slightly above atm.
    // We want visual differences, so let's scale the values for display.

    // Real calculation for delta P
    const deltaP = 0.5 * rho * (v2 * v2 - v1 * v1);
    const P1_display = 200000; // Base pressure for wide pipe
    const P2_display = P1_display - deltaP;

    const KE1 = 0.5 * rho * v1 * v1;
    const KE2 = 0.5 * rho * v2 * v2;

    // Manometer heights (P = rho * g * h -> h = P / (rho * g))
    // We'll scale heights for visual representation
    const h1 = 120; // Fixed visual height for P1
    // Scale h2 relative to h1 based on pressure difference
    // Max deltaP occurs at max flowRate and min area:
    // v1_max = 500 / 100 = 5
    // v2_max = 500 / 20 = 25
    // deltaP_max = 0.5 * 1000 * (625 - 25) = 500 * 600 = 300,000
    // So scale deltaP to a max drop of ~110px
    const maxDeltaP = 300000;
    const h2 = Math.max(10, h1 - (deltaP / maxDeltaP) * 110);

    // Particles state for animation
    const particlesRef = useRef<{ x: number, y: number, speedMultiplier: number }[]>([]);
    const animationRef = useRef<number>();

    // Initialize particles
    useEffect(() => {
        particlesRef.current = Array.from({ length: 150 }).map(() => ({
            x: Math.random() * 800,
            y: (Math.random() - 0.5) * A1, // Spread across pipe height
            speedMultiplier: 0.8 + Math.random() * 0.4
        }));
    }, [A1]);

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isPlaying) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = performance.now();

        const render = (time: number) => {
            const dt = (time - lastTime) / 1000; // Delta time in seconds
            lastTime = time;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // We need to figure out the pipe's Y boundary at any given X.
            // Pipe goes from x=0 to 800.
            // Narrow section is roughly between x=300 and x=500.
            const getRadiusAtX = (x: number) => {
                if (x < 250) return A1 / 2;
                if (x > 550) return A1 / 2;
                if (x >= 350 && x <= 450) return constrictionArea / 2;

                // Easing for the transition
                if (x >= 250 && x < 350) {
                    const t = (x - 250) / 100;
                    // smoothstep
                    const smooth_t = t * t * (3 - 2 * t);
                    return (A1 / 2) * (1 - smooth_t) + (constrictionArea / 2) * smooth_t;
                }
                if (x > 450 && x <= 550) {
                    const t = (x - 450) / 100;
                    const smooth_t = t * t * (3 - 2 * t);
                    return (constrictionArea / 2) * (1 - smooth_t) + (A1 / 2) * smooth_t;
                }
                return A1 / 2;
            };

            const getVelocityAtX = (x: number) => {
                // A * v = constant -> v = (A1 * v1) / A_x
                const rx = getRadiusAtX(x);
                const Ax = rx * 2; // Linear mapping since it's 2D visually
                return (A1 * v1) / Ax;
            };

            // Draw Pipe Background
            ctx.fillStyle = '#dbeafe'; // blue-100
            ctx.beginPath();
            for (let x = 0; x <= 800; x += 5) {
                ctx.lineTo(x, 200 - getRadiusAtX(x));
            }
            for (let x = 800; x >= 0; x -= 5) {
                ctx.lineTo(x, 200 + getRadiusAtX(x));
            }
            ctx.closePath();
            ctx.fill();

            // Draw outlines
            ctx.strokeStyle = '#64748b'; // slate-500
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let x = 0; x <= 800; x += 5) ctx.lineTo(x, 200 - getRadiusAtX(x));
            ctx.stroke();

            ctx.beginPath();
            for (let x = 0; x <= 800; x += 5) ctx.lineTo(x, 200 + getRadiusAtX(x));
            ctx.stroke();

            // v2_max is needed for particle opacity scaling
            const v2_max = 500 / 20;

            // Update & Draw Particles (Streamlines)
            const particles = particlesRef.current;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const vel = getVelocityAtX(p.x);
                p.x = p.x + vel * p.speedMultiplier * dt * 45; // Speed factor

                if (p.x > 800) {
                    p.x = -20;
                    p.y = (Math.random() - 0.5) * A1; // Respawn at the start
                }

                // Adjust Y based on current radius to keep them inside the pipe
                // This is a simple approximation: scale their relative Y position
                const currentR = getRadiusAtX(p.x);
                const startR = A1 / 2;
                const normalizedY = p.y / startR; // -1 to 1
                const actualY = 200 + normalizedY * currentR;

                // Draw particle
                ctx.beginPath();
                // Draw a small horizontal line for streamline effect
                ctx.moveTo(p.x, actualY);
                ctx.lineTo(p.x + Math.max(15, vel * 3), actualY);
                ctx.strokeStyle = `rgba(37, 99, 235, ${Math.min(1, 0.3 + (vel / v2_max) * 0.7)})`; // blue-600, more opaque when faster
                ctx.lineWidth = 1.5 + (vel / v2_max) * 2.5;
                ctx.stroke();
            }

            // Draw Manometers

            const drawManometer = (x: number, waterHeight: number) => {
                const pipeTopY = 200 - getRadiusAtX(x);
                // Tube outline
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(x - 10, 20, 20, pipeTopY - 20);

                // Draw left and right lines of tube
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x - 10, 20);
                ctx.lineTo(x - 10, pipeTopY);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + 10, 20);
                ctx.lineTo(x + 10, pipeTopY);
                ctx.stroke();

                // Erase the pipe's top border where the tube meets it
                ctx.fillStyle = '#dbeafe'; // pipe color matching new background
                ctx.fillRect(x - 8, pipeTopY - 3, 16, 6);

                // Water level inside
                ctx.fillStyle = '#3b82f6'; // darker blue for manometer water to stand out
                const waterTop = Math.max(22, pipeTopY - waterHeight);
                ctx.fillRect(x - 8, waterTop, 16, pipeTopY - waterTop + 2); // +2 to blend into pipe
            };

            drawManometer(150, h1); // P1
            drawManometer(400, h2); // P2


            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, A1, v1, constrictionArea, h1, h2]);


    // Bar Chart Max Values for scaling
    const maxKE = 0.5 * rho * (500 / 20) * (500 / 20); // max flow rate, min area
    const maxP = 300000;

    return (
        <div className="flex flex-col h-full bg-slate-50 gap-4 p-4">

            {/* Visual Apparatus Area */}
            <div className="flex-1 relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center min-h-[300px]">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    className="w-full h-full object-contain"
                />

                {/* Play/Pause Overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="bg-white p-2 rounded-full shadow hover:bg-slate-100 text-brand-primary"
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                </div>

                {/* Labels Overlay */}
                <div className="absolute top-[280px] left-[150px] -translate-x-1/2 text-center text-xs font-bold text-slate-500 bg-white/80 px-2 rounded">
                    Wide Section (A₁) <br /> Low Velocity
                </div>
                <div className="absolute top-[280px] left-[400px] -translate-x-1/2 text-center text-xs font-bold text-slate-500 bg-white/80 px-2 rounded">
                    Constriction (A₂) <br /> High Velocity
                </div>

            </div>

            {/* Real-time Data & Charts Area */}
            <div className="h-48 flex gap-4">

                {/* Chart 1: Wide Section */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Wide Section (A₁)</h4>
                    <div className="flex-1 w-full flex items-end justify-center gap-6">

                        <div className="flex flex-col items-center w-12 gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">{(KE1 / 1000).toFixed(1)}k</span>
                            <div className="w-8 bg-slate-100 rounded-t-md relative h-28 flex items-end">
                                <div
                                    className="w-full bg-amber-400 rounded-t-md transition-all duration-300"
                                    style={{ height: `${Math.max(5, (KE1 / maxKE) * 100)}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-brand-dark">KE</span>
                        </div>

                        <div className="flex flex-col items-center w-12 gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">{(P1_display / 1000).toFixed(0)}k</span>
                            <div className="w-8 bg-slate-100 rounded-t-md relative h-28 flex items-end">
                                <div
                                    className="w-full bg-blue-500 rounded-t-md transition-all duration-300"
                                    style={{ height: `${(P1_display / maxP) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-brand-dark">Press</span>
                        </div>

                    </div>
                </div>

                {/* Chart 2: Constriction */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center shadow-sm border-t-4 border-t-brand-primary">
                    <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-4">Constriction (A₂)</h4>
                    <div className="flex-1 w-full flex items-end justify-center gap-6">

                        <div className="flex flex-col items-center w-12 gap-2">
                            <span className="text-[10px] text-orange-500 font-mono font-bold">{(KE2 / 1000).toFixed(1)}k</span>
                            <div className="w-8 bg-slate-100 rounded-t-md relative h-28 flex items-end">
                                <div
                                    className="w-full bg-amber-400 rounded-t-md transition-all duration-300 relative overflow-hidden"
                                    style={{ height: `${Math.max(5, (KE2 / maxKE) * 100)}%` }}
                                >
                                    {/* Shimmer effect for high KE */}
                                    {KE2 > 50000 && <div className="absolute inset-0 bg-white/30 animate-pulse"></div>}
                                </div>
                            </div>
                            <span className="text-xs font-bold text-amber-600">KE</span>
                        </div>

                        <div className="flex flex-col items-center w-12 gap-2">
                            <span className="text-[10px] text-blue-500 font-mono font-bold">{(P2_display / 1000).toFixed(0)}k</span>
                            <div className="w-8 bg-slate-100 rounded-t-md relative h-28 flex items-end">
                                <div
                                    className="w-full bg-blue-500 rounded-t-md transition-all duration-300"
                                    style={{ height: `${Math.max(5, (P2_display / maxP) * 100)}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-blue-600">Press</span>
                        </div>

                    </div>
                </div>

            </div>

        </div>
    );
};

export default FluidDynamicsLab;
