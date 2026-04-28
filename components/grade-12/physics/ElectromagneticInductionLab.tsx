import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff, Zap, Activity } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type SimulationMode = 'faraday' | 'acgenerator';

interface EMILabProps {
    topic: any;
    onExit: () => void;
}

const ElectromagneticInductionLab: React.FC<EMILabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    const [mode, setMode] = useState<SimulationMode>('faraday');
    const [isPlaying, setIsPlaying] = useState(true);
    const [showFieldLines, setShowFieldLines] = useState(true);

    // Faraday mode state
    const [magnetX, setMagnetX] = useState(0.15); // fraction of width
    const [magnetVelocity, setMagnetVelocity] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const lastMouseX = useRef(0);
    const galvAngleRef = useRef(0);
    const bulbRef = useRef(0);

    // AC Generator mode state
    const [angularSpeed, setAngularSpeed] = useState(1);
    const coilAngleRef = useRef(0);
    const fluxHistory = useRef<number[]>([]);
    const emfHistory = useRef<number[]>([]);

    const handleReset = useCallback(() => {
        setMagnetX(0.15);
        setMagnetVelocity(0);
        galvAngleRef.current = 0;
        bulbRef.current = 0;
        coilAngleRef.current = 0;
        fluxHistory.current = [];
        emfHistory.current = [];
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'faraday') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseXFrac = (e.clientX - rect.left) / rect.width;
        const magW = 0.15;
        if (mouseXFrac >= magnetX && mouseXFrac <= magnetX + magW) {
            setIsDragging(true);
            lastMouseX.current = mouseXFrac;
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || mode !== 'faraday') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseXFrac = (e.clientX - rect.left) / rect.width;
        const delta = mouseXFrac - lastMouseX.current;
        setMagnetVelocity(delta * 60);
        setMagnetX(prev => Math.max(0.02, Math.min(prev + delta, 0.75)));
        lastMouseX.current = mouseXFrac;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setMagnetVelocity(0);
    };

    // Dynamic canvas resize
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

        const render = (time: number) => {
            const W = canvas.width;
            const H = canvas.height;
            if (W < 10 || H < 10) { animationRef.current = requestAnimationFrame(render); return; }
            const dt = (time - lastTime) / 1000;
            lastTime = time;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, W, H);

            const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
            const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
            const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

            if (mode === 'faraday') {
                renderFaraday(ctx, W, H, dt, scale, fs, pad);
            } else {
                renderACGenerator(ctx, W, H, dt, scale, fs, pad);
            }

            animationRef.current = requestAnimationFrame(render);
        };

        const renderFaraday = (ctx: CanvasRenderingContext2D, W: number, H: number, _dt: number, scale: number, fs: (b: number) => number, pad: number) => {
            const centerY = H * 0.42;
            const headerSafeLeft = Math.max(pad, 170 * scale);
            const headerCenterX = headerSafeLeft + (W - headerSafeLeft - pad) * 0.5;
            const headerMaxW = Math.max(180, W - headerSafeLeft - pad);

            // -- Coil position (responsive) --
            const COIL_CX = W * 0.55;
            const COIL_LEFT = COIL_CX - W * 0.06;
            const COIL_RIGHT = COIL_CX + W * 0.06;
            const coilRadius = Math.min(55, H * 0.13);

            // -- Magnet position (responsive) --
            const magPxX = magnetX * W;
            const magW = W * 0.13;
            const magH = Math.min(55, H * 0.12);
            const magCenterX = magPxX + magW / 2;

            // -- Flux calculation --
            const dist = magCenterX - COIL_CX;
            const w_width = W * 0.12;
            const flux = Math.exp(-(dist * dist) / (w_width * w_width));
            const dFluxDx = -2 * dist / (w_width * w_width) * flux;
            const v = magnetVelocity * W;
            const emf = -dFluxDx * v * 50;

            // Galvanometer + bulb (spring-damper)
            const targetAngle = Math.max(-50, Math.min(50, emf));
            galvAngleRef.current = galvAngleRef.current * 0.82 + targetAngle * 0.18;
            const absEmf = Math.abs(emf);
            const targetBright = Math.min(1, absEmf / 18);
            bulbRef.current = bulbRef.current * 0.85 + targetBright * 0.15;

            // -- Draw coil --
            const numTurns = 14;
            ctx.strokeStyle = '#92400e'; ctx.lineWidth = 3 * scale;
            for (let i = 0; i < numTurns; i++) {
                const x = COIL_LEFT + (i / numTurns) * (COIL_RIGHT - COIL_LEFT);
                ctx.beginPath();
                ctx.ellipse(x, centerY, 8 * scale, coilRadius, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
            ctx.strokeRect(COIL_LEFT, centerY - coilRadius, COIL_RIGHT - COIL_LEFT, coilRadius * 2);

            // -- Flux highlight in coil --
            if (flux > 0.05) {
                ctx.fillStyle = `rgba(250, 204, 21, ${flux * 0.35})`;
                ctx.fillRect(COIL_LEFT, centerY - coilRadius, COIL_RIGHT - COIL_LEFT, coilRadius * 2);
            }

            // -- DYNAMIC FIELD LINES --
            if (showFieldLines) {
                const nLines = 10;
                // Determine how many lines are currently actively linking based on flux (from 0 to 10)
                const numActiveLines = Math.max(0, Math.round(flux * nLines));
                
                for (let i = 0; i < nLines; i++) {
                    // Only draw the lines that are active, growing symmetrically from the center
                    const isCentralEnough = Math.abs(i - 4.5) < (numActiveLines / 2);
                    if (!isCentralEnough) continue;
                    
                    const offset = ((i - (nLines - 1) / 2) / (nLines / 2)) * coilRadius * 0.9;
                    const startX = magPxX + magW;
                    const startY = centerY + offset * 0.3;

                    // Since it's an active line, it passes through the coil
                    const endX = Math.min(COIL_CX + W * 0.2, W * 0.9);
                    const endY = centerY + offset * 1.8;

                    // Curve through coil
                    const ctrlX = (startX + endX) / 2;
                    const ctrlY = centerY + offset * 0.6;

                    ctx.strokeStyle = `rgba(59, 130, 246, 0.5)`;
                    ctx.lineWidth = 2.5 * scale;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
                    ctx.stroke();

                    // Arrowhead at midpoint
                    const t = 0.6;
                    const ax = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * ctrlX + t * t * endX;
                    const ay = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * ctrlY + t * t * endY;
                    const dx = 2 * (1 - t) * (ctrlX - startX) + 2 * t * (endX - ctrlX);
                    const dy = 2 * (1 - t) * (ctrlY - startY) + 2 * t * (endY - ctrlY);
                    const angle = Math.atan2(dy, dx);
                    const hl = 8 * scale;
                    ctx.fillStyle = `rgba(59, 130, 246, 0.5)`;
                    ctx.beginPath();
                    ctx.moveTo(ax + hl * Math.cos(angle), ay + hl * Math.sin(angle));
                    ctx.lineTo(ax - hl * Math.cos(angle - 0.5), ay - hl * Math.sin(angle - 0.5));
                    ctx.lineTo(ax - hl * Math.cos(angle + 0.5), ay - hl * Math.sin(angle + 0.5));
                    ctx.closePath(); ctx.fill();
                }
            }

            // -- Flux meter bar --
            const meterX = W * 0.82, meterY = pad * 3, meterW = W * 0.04, meterH = H * 0.35;
            ctx.fillStyle = '#f1f5f9';
            roundRect(ctx, meterX, meterY, meterW, meterH, 8); ctx.fill();
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
            roundRect(ctx, meterX, meterY, meterW, meterH, 8); ctx.stroke();
            const fillH = flux * meterH;
            if (fillH > 2) {
                ctx.fillStyle = '#facc15';
                roundRect(ctx, meterX, meterY + meterH - fillH, meterW, fillH, 8); ctx.fill();
            }
            ctx.fillStyle = '#475569'; ctx.font = `bold ${fs(11)}px "Inter", sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('Phi', meterX + meterW / 2, meterY - 8);
            ctx.fillText(`${(flux * 100).toFixed(0)}%`, meterX + meterW / 2, meterY + meterH + fs(12) + 4);

            // -- Magnet --
            const magnetY = centerY - magH / 2;
            ctx.fillStyle = '#1d4ed8';
            roundRect(ctx, magPxX, magnetY, magW / 2, magH, 6); ctx.fill();
            ctx.fillStyle = '#b91c1c';
            roundRect(ctx, magPxX + magW / 2, magnetY, magW / 2, magH, 6); ctx.fill();
            ctx.fillStyle = 'white'; ctx.font = `bold ${fs(18)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('S', magPxX + magW * 0.25, centerY + fs(18) * 0.35);
            ctx.fillText('N', magPxX + magW * 0.75, centerY + fs(18) * 0.35);

            if (!isDragging) {
                ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(12)}px "Inter", sans-serif`;
                ctx.fillText('Drag Magnet', magPxX + magW / 2, magnetY - 12);
            }

            // -- Wires --
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3 * scale;
            ctx.beginPath();
            ctx.moveTo(COIL_LEFT, centerY + coilRadius);
            ctx.lineTo(COIL_LEFT, H * 0.82);
            ctx.lineTo(W * 0.62, H * 0.82);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(COIL_RIGHT, centerY + coilRadius);
            ctx.lineTo(COIL_RIGHT, H * 0.75);
            ctx.lineTo(W * 0.78, H * 0.75);
            ctx.lineTo(W * 0.78, H * 0.82);
            ctx.stroke();

            // -- Bulb --
            const bulbX = W * 0.62, bulbY = H * 0.82;
            const brightness = bulbRef.current;
            if (brightness > 0.05) {
                const glow = ctx.createRadialGradient(bulbX, bulbY - 20, 0, bulbX, bulbY - 20, 55 * brightness);
                glow.addColorStop(0, `rgba(250, 204, 21, ${brightness})`);
                glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(bulbX, bulbY - 20, 55, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = brightness > 0.1 ? `rgba(250,204,21,${0.5 + brightness * 0.5})` : '#f1f5f9';
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(bulbX, bulbY - 20, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#475569'; ctx.font = `bold ${fs(11)}px "Inter", sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('Bulb', bulbX, bulbY + 18);

            // -- Galvanometer --
            const galvoX = W * 0.78, galvoY = H * 0.82;
            ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(galvoX, galvoY, 36 * scale, Math.PI, 0); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(10)}px monospace`; ctx.textAlign = 'center';
            ctx.fillText('-  0  +', galvoX, galvoY - 8);

            ctx.save();
            ctx.translate(galvoX, galvoY);
            ctx.rotate(galvAngleRef.current * Math.PI / 180);
            ctx.fillStyle = '#dc2626';
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, -30 * scale); ctx.lineTo(2, -30 * scale); ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#475569'; ctx.font = `bold ${fs(11)}px "Inter", sans-serif`;
            ctx.fillText('G', galvoX, galvoY + 18);

            // -- EMF indicator bar --
            const emfBarX = pad, emfBarY = H * 0.88, emfBarW = W * 0.35;
            ctx.fillStyle = '#f1f5f9';
            roundRect(ctx, emfBarX, emfBarY, emfBarW, 20 * scale, 6); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
            roundRect(ctx, emfBarX, emfBarY, emfBarW, 20 * scale, 6); ctx.stroke();
            const emfFill = Math.min(1, Math.abs(emf) / 25);
            if (emfFill > 0.01) {
                const emfColor = emf > 0 ? '#16a34a' : '#dc2626';
                ctx.fillStyle = emfColor;
                const halfW = emfBarW / 2;
                if (emf > 0) {
                    roundRect(ctx, emfBarX + halfW, emfBarY, emfFill * halfW, 20 * scale, 6); ctx.fill();
                } else {
                    roundRect(ctx, emfBarX + halfW - emfFill * halfW, emfBarY, emfFill * halfW, 20 * scale, 6); ctx.fill();
                }
            }
            ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(12)}px "Inter", sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('EMF: e = -dPhi/dt', emfBarX + emfBarW / 2, emfBarY - 6);
        };

        const renderACGenerator = (ctx: CanvasRenderingContext2D, W: number, H: number, dt: number, scale: number, fs: (b: number) => number, pad: number) => {
            const centerX = W * 0.35;
            const centerY = H * 0.38;
            const headerSafeLeft = Math.max(pad, 170 * scale);
            const headerCenterX = headerSafeLeft + (W - headerSafeLeft - pad) * 0.5;
            const headerMaxW = Math.max(180, W - headerSafeLeft - pad);

            coilAngleRef.current += angularSpeed * dt;
            const cAngle = coilAngleRef.current;

            const flux = Math.cos(cAngle);
            const emf = angularSpeed * Math.sin(cAngle);

            fluxHistory.current.push(flux);
            emfHistory.current.push(emf);
            if (fluxHistory.current.length > 200) {
                fluxHistory.current.shift();
                emfHistory.current.shift();
            }

            // Magnets
            const magW = 35 * scale, magH = 120 * scale;
            ctx.fillStyle = '#ef4444';
            roundRect(ctx, centerX - W * 0.15, centerY - magH / 2, magW, magH, 6); ctx.fill();
            ctx.fillStyle = 'white'; ctx.font = `bold ${fs(20)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('N', centerX - W * 0.15 + magW / 2, centerY + fs(20) * 0.35);

            ctx.fillStyle = '#3b82f6';
            roundRect(ctx, centerX + W * 0.15 - magW, centerY - magH / 2, magW, magH, 6); ctx.fill();
            ctx.fillStyle = 'white';
            ctx.fillText('S', centerX + W * 0.15 - magW / 2, centerY + fs(20) * 0.35);

            // B-Field
            if (showFieldLines) {
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(centerX - W * 0.15 + magW, centerY + i * 20 * scale);
                    ctx.lineTo(centerX + W * 0.15 - magW, centerY + i * 20 * scale);
                    ctx.stroke();
                    // Arrowheads
                    const ax = centerX, ay = centerY + i * 20 * scale;
                    ctx.fillStyle = '#94a3b8';
                    ctx.beginPath(); ctx.moveTo(ax + 6, ay); ctx.lineTo(ax - 4, ay - 4); ctx.lineTo(ax - 4, ay + 4); ctx.fill();
                }
            }

            // Coil
            const coilW = 90 * scale, coilH = 90 * scale;
            const projW = coilW * Math.abs(Math.cos(cAngle));
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 5 * scale;
            ctx.strokeRect(centerX - projW / 2, centerY - coilH / 2, projW, coilH);

            // Rotation arrow
            ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2 * scale;
            ctx.beginPath(); ctx.arc(centerX, centerY - coilH / 2 - 15 * scale, 12 * scale, 0, Math.PI * 1.5); ctx.stroke();

            // Slip rings + wire
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(centerX - 8 * scale, centerY + coilH / 2, 16 * scale, 10 * scale);
            ctx.strokeStyle = '#475569'; ctx.lineWidth = 2 * scale;
            ctx.beginPath(); ctx.moveTo(centerX, centerY + coilH / 2 + 10 * scale); ctx.lineTo(centerX, H * 0.62); ctx.stroke();

            // Lamp
            const brightness = Math.min(1, Math.abs(emf) / 10);
            const lampX = centerX + 40 * scale, lampY = H * 0.62;
            ctx.strokeStyle = '#475569'; ctx.lineWidth = 2 * scale;
            ctx.beginPath(); ctx.moveTo(centerX, lampY); ctx.lineTo(lampX, lampY); ctx.stroke();

            if (brightness > 0.05) {
                const glow = ctx.createRadialGradient(lampX, lampY - 12, 0, lampX, lampY - 12, 35 * brightness);
                glow.addColorStop(0, `rgba(250, 204, 21, ${brightness})`);
                glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(lampX, lampY - 12, 35, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = brightness > 0.1 ? `rgba(250,204,21,${0.3 + brightness * 0.7})` : '#e2e8f0';
            ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(lampX, lampY - 12, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

            // Angular speed label
            ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(13)}px monospace`; ctx.textAlign = 'center';
            ctx.fillText(`omega = ${angularSpeed.toFixed(1)} rad/s`, centerX, centerY - coilH / 2 - 35 * scale);

            // -- Graphs panel (right side) --
            const graphX = W * 0.58, graphY = pad * 2.5, graphW = W * 0.38, graphH = H * 0.82;
            ctx.fillStyle = '#ffffff';
            roundRect(ctx, graphX, graphY, graphW, graphH, 14); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
            roundRect(ctx, graphX, graphY, graphW, graphH, 14); ctx.stroke();

            const halfGH = graphH / 2;
            const gPad = 30;

            // Flux graph
            ctx.fillStyle = '#3b82f6'; ctx.font = `bold ${fs(12)}px "Inter", sans-serif`; ctx.textAlign = 'left';
            ctx.fillText('Magnetic Flux Phi(t) = NAB cos(omega t)', graphX + gPad, graphY + 20);
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(graphX + gPad, graphY + halfGH / 2 + 10); ctx.lineTo(graphX + graphW - gPad, graphY + halfGH / 2 + 10); ctx.stroke();

            ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2.5;
            ctx.beginPath();
            fluxHistory.current.forEach((v, i) => {
                const x = graphX + gPad + (i / 200) * (graphW - gPad * 2);
                const y = graphY + halfGH / 2 + 10 - v * (halfGH / 2 - 20);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();

            // EMF graph
            const emfGY = graphY + halfGH;
            ctx.fillStyle = '#ef4444'; ctx.font = `bold ${fs(12)}px "Inter", sans-serif`;
            ctx.fillText('EMF e(t) = NAB omega sin(omega t)', graphX + gPad, emfGY + 20);
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(graphX + gPad, emfGY + halfGH / 2 + 10); ctx.lineTo(graphX + graphW - gPad, emfGY + halfGH / 2 + 10); ctx.stroke();

            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5;
            ctx.beginPath();
            emfHistory.current.forEach((v, i) => {
                const x = graphX + gPad + (i / 200) * (graphW - gPad * 2);
                const y = emfGY + halfGH / 2 + 10 - (v / 10) * (halfGH / 2 - 20);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Current values
            ctx.fillStyle = '#3b82f6'; ctx.font = `bold ${fs(16)}px monospace`; ctx.textAlign = 'right';
            ctx.fillText(`Phi = ${flux.toFixed(2)}`, graphX + graphW - gPad, graphY + 20);
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`e = ${emf.toFixed(2)}`, graphX + graphW - gPad, emfGY + 20);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, [isPlaying, mode, magnetX, magnetVelocity, showFieldLines, angularSpeed, isDragging]);

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />

                <div className="absolute top-3 left-40 right-20 md:left-44 md:right-24 pointer-events-none">
                    <div className="bg-slate-50/98 rounded-lg px-3 py-2 shadow-sm">
                        <p className="text-sm md:text-lg font-bold text-slate-900 text-center">
                            {mode === 'faraday'
                                ? "Faraday's Law - Electromagnetic Induction"
                                : 'AC Generator - Electromagnetic Induction'}
                        </p>
                    </div>
                </div>

                {mode === 'acgenerator' && (
                    <div className="absolute top-[9%] right-[4%] w-[38%] h-[82%] pointer-events-none">
                        <div className="absolute left-3 right-3 top-3 bg-white/98 rounded-xl px-4 py-3 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] md:text-xs font-bold text-blue-500">Magnetic Flux Phi(t) = NAB cos(omega t)</p>
                                    <p className="text-[9px] md:text-[10px] text-slate-400">Normalized (N = A = B = 1). Real peak EMF = N*A*B*omega</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute left-3 right-3 top-1/2 mt-3 bg-white/98 rounded-xl px-4 py-3 shadow-sm">
                            <p className="text-[11px] md:text-xs font-bold text-red-500">EMF e(t) = NAB omega sin(omega t)</p>
                            <p className="text-[9px] md:text-[10px] text-slate-400">Normalized (N = A = B = 1). Real peak EMF = N*A*B*omega</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => setShowFieldLines(!showFieldLines)} className={`p-2 rounded-lg text-sm font-bold shadow transition-colors ${showFieldLines ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                    {showFieldLines ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-lg text-sm font-bold shadow transition-colors bg-white text-slate-700 hover:bg-slate-50">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={handleReset} className="p-2 rounded-lg text-sm shadow transition-colors bg-white text-slate-700 hover:bg-slate-50">
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 flex flex-col gap-4 md:gap-6 w-full">
            <div className="flex justify-center gap-3 border-b border-slate-100 pb-4">
                <button onClick={() => { setMode('faraday'); handleReset(); }} className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold text-sm md:text-base transition-all ${mode === 'faraday' ? 'bg-amber-100 text-amber-800 border-2 border-amber-300' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                    <Zap size={18} /> Faraday's Law
                </button>
                <button onClick={() => { setMode('acgenerator'); handleReset(); }} className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-bold text-sm md:text-base transition-all ${mode === 'acgenerator' ? 'bg-amber-100 text-amber-800 border-2 border-amber-300' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                    <Activity size={18} /> AC Generator
                </button>
            </div>

            {mode === 'faraday' && (
                <div className="text-center p-3 md:p-4 bg-amber-50 rounded-lg text-amber-800 text-sm">
                    An induced EMF is generated whenever there is a <strong>rate of change of magnetic flux</strong> linked with the circuit.<br /><br />
                    <em>Drag the magnet — watch the field lines passing through the coil change! The bulb glows only when the magnet is <strong>moving</strong>.</em>
                </div>
            )}

            {mode === 'acgenerator' && (
                <div className="space-y-4">
                    <div className="text-center p-3 md:p-4 bg-amber-50 rounded-lg text-amber-800 text-sm">
                        EMF = N*A*B*omega*sin(omega*t). Peak voltage is proportional to rotation speed (omega).
                    </div>
                    <div className="space-y-2 p-3 md:p-4 bg-white rounded-xl border border-slate-200">
                        <label className="text-sm font-bold text-slate-700 uppercase flex justify-between items-center">
                            <span>Angular Speed (omega)</span>
                            <span className="text-amber-700 bg-amber-100 px-3 py-1 rounded-lg font-mono">{angularSpeed.toFixed(1)} rad/s</span>
                        </label>
                        <input type="range" min="1" max="10" step="0.5" value={angularSpeed}
                            onChange={(e) => setAngularSpeed(Number(e.target.value))}
                            className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

export default ElectromagneticInductionLab;

