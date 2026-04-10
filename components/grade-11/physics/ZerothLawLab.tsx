import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, Thermometer, Box, Layers, Activity } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ZerothLawLabProps {
    topic: any;
    onExit: () => void;
}

type WallType = 'adiabatic' | 'diathermic';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    chamber: 'A' | 'B' | 'C';
}

const ZerothLawLab: React.FC<ZerothLawLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);

    const [tempA, setTempA] = useState(80);
    const [tempB, setTempB] = useState(20);
    const [tempC, setTempC] = useState(50);
    
    const [wallAC, setWallAC] = useState<WallType>('diathermic');
    const [wallBC, setWallBC] = useState<WallType>('diathermic');
    const [wallAB, setWallAB] = useState<WallType>('adiabatic');

    const [currentTempA, setCurrentTempA] = useState(80);
    const [currentTempB, setCurrentTempB] = useState(20);
    const [currentTempC, setCurrentTempC] = useState(50);

    const stateRef = useRef({ tempA, tempB, tempC, wallAC, wallBC, wallAB, currentTempA, currentTempB, currentTempC });

    useEffect(() => {
        stateRef.current = { tempA, tempB, tempC, wallAC, wallBC, wallAB, currentTempA, currentTempB, currentTempC };
    }, [tempA, tempB, tempC, wallAC, wallBC, wallAB, currentTempA, currentTempB, currentTempC]);

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

    const initParticles = useCallback(() => {
        const particles: Particle[] = [];
        const perChamber = 15;
        
        for (let i = 0; i < perChamber; i++) {
            particles.push({
                x: 50 + Math.random() * 150,
                y: 50 + Math.random() * 150,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                chamber: 'A'
            });
        }
        for (let i = 0; i < perChamber; i++) {
            particles.push({
                x: 350 + Math.random() * 150,
                y: 50 + Math.random() * 150,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                chamber: 'B'
            });
        }
        for (let i = 0; i < perChamber; i++) {
            particles.push({
                x: 200 + Math.random() * 150,
                y: 300 + Math.random() * 100,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                chamber: 'C'
            });
        }
        particlesRef.current = particles;
    }, []);

    useEffect(() => {
        initParticles();
    }, [initParticles]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        if (W < 10 || H < 10) {
            animRef.current = requestAnimationFrame(draw);
            return;
        }

        const { wallAC: wAC, wallBC: wBC, wallAB: wAB } = stateRef.current;
        const time = Date.now() * 0.001;

        ctx.clearRect(0, 0, W, H);

        const scale = W < 1000 ? 1 : (W > 1500 ? 1.25 : 1 + (W - 1000) * 0.0005);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.018, H * 0.025));
        const pad = Math.min(W * 0.03, H * 0.03, scale * 20);

        // Chamber dimensions
        const chamberW = (W - pad * 4) / 2;
        const chamberH = (H - pad * 4) * 0.55;
        const chamberC_H = (H - pad * 4) * 0.35;

        const chamberA = { x: pad, y: pad, w: chamberW, h: chamberH };
        const chamberB = { x: pad * 2 + chamberW, y: pad, w: chamberW, h: chamberH };
        const chamberC = { x: pad + chamberW * 0.25, y: pad * 2 + chamberH, w: chamberW * 1.5, h: chamberC_H };

        // Draw chambers
        drawChamber(ctx, chamberA, 'A', currentTempA, fs, scale, particlesRef.current.filter(p => p.chamber === 'A'), time);
        drawChamber(ctx, chamberB, 'B', currentTempB, fs, scale, particlesRef.current.filter(p => p.chamber === 'B'), time);
        drawChamber(ctx, chamberC, 'C', currentTempC, fs, scale, particlesRef.current.filter(p => p.chamber === 'C'), time);

        // Draw walls
        drawWall(ctx, chamberA.x + chamberA.w, chamberA.y, 8, chamberA.h, wAB, 'A-B', fs, scale, () => {
            setWallAB(wAB === 'adiabatic' ? 'diathermic' : 'adiabatic');
        });
        
        // A-C wall (left side of C connecting to A)
        const acWallX = chamberC.x;
        const acWallY = chamberA.y + chamberA.h;
        drawHorizontalWall(ctx, acWallX, acWallY, chamberC.w * 0.4, 8, wAC, 'A-C', fs, scale);
        
        // B-C wall (right side of C connecting to B)
        drawHorizontalWall(ctx, acWallX + chamberC.w * 0.6, acWallY, chamberC.w * 0.4, 8, wBC, 'B-C', fs, scale);

        // Update temperatures based on wall connections
        let newTempA = currentTempA;
        let newTempB = currentTempB;
        let newTempC = currentTempC;

        if (wAC === 'diathermic') {
            const avgAC = (newTempA + newTempC) / 2;
            newTempA = newTempA + (avgAC - newTempA) * 0.02;
            newTempC = newTempC + (avgAC - newTempC) * 0.02;
        }
        if (wBC === 'diathermic') {
            const avgBC = (newTempB + newTempC) / 2;
            newTempB = newTempB + (avgBC - newTempB) * 0.02;
            newTempC = newTempC + (avgBC - newTempC) * 0.02;
        }
        if (wAB === 'diathermic') {
            const avgAB = (newTempA + newTempB) / 2;
            newTempA = newTempA + (avgAB - newTempA) * 0.02;
            newTempB = newTempB + (avgAB - newTempB) * 0.02;
        }

        setCurrentTempA(newTempA);
        setCurrentTempB(newTempB);
        setCurrentTempC(newTempC);

        // Update particle speeds based on temperatures
        updateParticleSpeeds(particlesRef.current, newTempA, newTempB, newTempC);

        // Move particles
        moveParticles(particlesRef.current, chamberA, chamberB, chamberC, wAB, wAC, wBC, W, H);

        animRef.current = requestAnimationFrame(draw);
    }, [currentTempA, currentTempB, currentTempC]);

    function getTempColor(temp: number): string {
        if (temp < 30) return '#3b82f6';
        if (temp < 50) return '#06b6d4';
        if (temp < 70) return '#f59e0b';
        return '#ef4444';
    }

    function drawChamber(
        ctx: CanvasRenderingContext2D, 
        rect: { x: number; y: number; w: number; h: number }, 
        label: string, 
        temp: number,
        fs: (n: number) => number,
        scale: number,
        particles: Particle[],
        time: number
    ) {
        // Background
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.fill();
        ctx.stroke();

        // Label and temperature
        ctx.fillStyle = '#1e293b';
        ctx.font = `bold ${fs(14)}px "Inter", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`Chamber ${label}`, rect.x + 10, rect.y + 25);

        // Temperature badge
        const tempColor = getTempColor(temp);
        ctx.fillStyle = tempColor;
        ctx.font = `bold ${fs(16)}px "Inter", sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(`${temp.toFixed(1)}°C`, rect.x + rect.w - 10, rect.y + 25);

        // Draw particles
        particles.forEach(p => {
            const pColor = getTempColor(temp);
            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4 * scale, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawWall(
        ctx: CanvasRenderingContext2D,
        x: number, y: number,
        w: number, h: number,
        type: WallType,
        label: string,
        fs: (n: number) => number,
        scale: number,
        onClick?: () => void
    ) {
        const isAdiabatic = type === 'adiabatic';
        
        ctx.fillStyle = isAdiabatic ? '#475569' : '#fbbf24';
        ctx.fillRect(x - w/2, y, w, h);

        ctx.strokeStyle = isAdiabatic ? '#1e293b' : '#d97706';
        ctx.lineWidth = isAdiabatic ? 3 : 1;
        ctx.strokeRect(x - w/2, y, w, h);

        // Label
        ctx.save();
        ctx.translate(x, y + h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = isAdiabatic ? '#ffffff' : '#78350f';
        ctx.font = `bold ${fs(9)}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(isAdiabatic ? 'ADIABATIC' : 'DIATHERMIC', 0, 3);
        ctx.restore();
    }

    function drawHorizontalWall(
        ctx: CanvasRenderingContext2D,
        x: number, y: number,
        w: number, h: number,
        type: WallType,
        label: string,
        fs: (n: number) => number,
        scale: number
    ) {
        const isAdiabatic = type === 'adiabatic';
        
        ctx.fillStyle = isAdiabatic ? '#475569' : '#fbbf24';
        ctx.fillRect(x, y - h/2, w, h);

        ctx.strokeStyle = isAdiabatic ? '#1e293b' : '#d97706';
        ctx.lineWidth = isAdiabatic ? 3 : 1;
        ctx.strokeRect(x, y - h/2, w, h);

        ctx.fillStyle = isAdiabatic ? '#ffffff' : '#78350f';
        ctx.font = `bold ${fs(8)}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(isAdiabatic ? 'ADIABATIC' : 'DIATHERMIC', x + w/2, y + 3);
    }

    function updateParticleSpeeds(particles: Particle[], tempA: number, tempB: number, tempC: number) {
        particles.forEach(p => {
            const targetSpeed = p.chamber === 'A' ? tempA / 20 : p.chamber === 'B' ? tempB / 20 : tempC / 20;
            const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (currentSpeed > 0.01) {
                const ratio = 1 + (targetSpeed - currentSpeed) * 0.01;
                p.vx *= ratio;
                p.vy *= ratio;
            }
        });
    }

    function moveParticles(
        particles: Particle[],
        chamberA: { x: number; y: number; w: number; h: number },
        chamberB: { x: number; y: number; w: number; h: number },
        chamberC: { x: number; y: number; w: number; h: number },
        wAB: WallType,
        wAC: WallType,
        wBC: WallType,
        W: number,
        H: number
    ) {
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            let bounds: { x: number; y: number; w: number; h: number };
            if (p.chamber === 'A') bounds = chamberA;
            else if (p.chamber === 'B') bounds = chamberB;
            else bounds = chamberC;

            // Bounce off walls
            if (p.x < bounds.x + 5) { p.x = bounds.x + 5; p.vx *= -1; }
            if (p.x > bounds.x + bounds.w - 5) { p.x = bounds.x + bounds.w - 5; p.vx *= -1; }
            if (p.y < bounds.y + 5) { p.y = bounds.y + 5; p.vy *= -1; }
            if (p.y > bounds.y + bounds.h - 5) { p.y = bounds.y + bounds.h - 5; p.vy *= -1; }
        });
    }

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const reset = () => {
        setCurrentTempA(tempA);
        setCurrentTempB(tempB);
        setCurrentTempC(tempC);
        setWallAC('diathermic');
        setWallBC('diathermic');
        setWallAB('adiabatic');
        initParticles();
    };

    const setInitialTemps = () => {
        setCurrentTempA(tempA);
        setCurrentTempB(tempB);
        setCurrentTempC(50);
    };

    const simulationCombo = (
        <div className="w-full h-full relative bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[350px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-3 w-full text-slate-700 p-1">
            {/* Temperature Controls */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <span className="text-xs font-bold text-red-600 uppercase shrink-0">T<sub>A</sub>:</span>
                    <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={tempA} 
                        onChange={(e) => { setTempA(Number(e.target.value)); setInitialTemps(); }}
                        className="flex-1 accent-red-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                    />
                    <span className="text-sm font-mono font-bold text-red-600 w-12 text-right">{tempA}°C</span>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <span className="text-xs font-bold text-blue-600 uppercase shrink-0">T<sub>B</sub>:</span>
                    <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        value={tempB} 
                        onChange={(e) => { setTempB(Number(e.target.value)); setInitialTemps(); }}
                        className="flex-1 accent-blue-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                    />
                    <span className="text-sm font-mono font-bold text-blue-600 w-12 text-right">{tempB}°C</span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-500">Current: </span>
                    <span className="text-red-600 font-bold">T<sub>A</sub>={currentTempA.toFixed(1)}°</span>
                    <span className="text-blue-600 font-bold">T<sub>B</sub>={currentTempB.toFixed(1)}°</span>
                    <span className="text-amber-600 font-bold">T<sub>C</sub>={currentTempC.toFixed(1)}°</span>
                </div>
            </div>

            {/* Wall Controls */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Walls:</span>
                
                <button
                    onClick={() => setWallAC(wallAC === 'adiabatic' ? 'diathermic' : 'adiabatic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        wallAC === 'diathermic' 
                            ? 'bg-amber-500 text-white border-amber-600 shadow' 
                            : 'bg-slate-600 text-white border-slate-700'
                    }`}
                >
                    A-C: {wallAC === 'diathermic' ? 'Diathermic' : 'Adiabatic'}
                </button>

                <button
                    onClick={() => setWallBC(wallBC === 'adiabatic' ? 'diathermic' : 'adiabatic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        wallBC === 'diathermic' 
                            ? 'bg-amber-500 text-white border-amber-600 shadow' 
                            : 'bg-slate-600 text-white border-slate-700'
                    }`}
                >
                    B-C: {wallBC === 'diathermic' ? 'Diathermic' : 'Adiabatic'}
                </button>

                <button
                    onClick={() => setWallAB(wallAB === 'adiabatic' ? 'diathermic' : 'adiabatic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        wallAB === 'diathermic' 
                            ? 'bg-amber-500 text-white border-amber-600 shadow' 
                            : 'bg-slate-600 text-white border-slate-700'
                    }`}
                >
                    A-B: {wallAB === 'diathermic' ? 'Diathermic' : 'Adiabatic'}
                </button>

                <div className="flex-1" />

                <button 
                    onClick={reset} 
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 transition-all font-bold text-xs"
                >
                    <RotateCcw size={14} /> Reset
                </button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                <Activity size={14} className="text-brand-primary" />
                <span className="text-slate-600">
                    {Math.abs(currentTempA - currentTempB) < 1 && Math.abs(currentTempA - currentTempC) < 1
                        ? 'All chambers in thermal equilibrium! Zeroth Law verified.'
                        : 'Heat flowing through diathermic walls...'}
                </span>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

export default ZerothLawLab;
