import React, { useRef, useEffect, useState, useCallback } from 'react';

interface HydraulicBrakeLabProps {
    force1: number;
    area1: number;
    area2: number;
    fluidType: 'liquid' | 'gas';
    isApplyingText: boolean;
}

const HydraulicBrakeLab: React.FC<HydraulicBrakeLabProps> = ({ force1, area1, area2, fluidType }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const [pedalDown, setPedalDown] = useState(false);

    // Mutable refs for animation state
    const pedalRef = useRef(false);
    pedalRef.current = pedalDown;

    // Physics derived values
    const pressure = fluidType === 'liquid' ? force1 / area1 : (force1 / area1) * 0.05;
    const force2 = pressure * area2;
    const mechanicalAdv = area2 / area1;

    // Animation state stored in refs to avoid re-renders
    const stateRef = useRef({
        d1: 0,           // master piston displacement (0-1 normalized)
        d2: 0,           // wheel piston displacement (0-1 normalized)
        discAngle: 0,    // brake disc rotation angle in degrees
        discSpeed: 3,    // disc rotation speed (degrees per frame)
        fluidPulse: 0,   // fluid flow highlight animation (0-1)
        sparkLife: 0,    // spark animation timer
    });

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const s = stateRef.current;
        const isPedal = pedalRef.current;
        const isLiquid = fluidType === 'liquid';

        // --- UPDATE PHYSICS ---
        // Pedal push animation
        const targetD1 = isPedal ? (isLiquid ? 0.8 : 1.0) : 0;
        s.d1 += (targetD1 - s.d1) * 0.08;

        // Output displacement (much smaller due to area ratio)
        if (isLiquid) {
            s.d2 = s.d1 / mechanicalAdv;
        } else {
            // Gas compresses, barely any output
            s.d2 += (0 - s.d2) * 0.1;
        }

        // Fluid pulse (travels left to right when pedal is pushed)
        if (isPedal) {
            s.fluidPulse = Math.min(1, s.fluidPulse + 0.04);
        } else {
            s.fluidPulse = Math.max(0, s.fluidPulse - 0.06);
        }

        // Disc rotation - slows down when braking with liquid
        const brakingForce = isLiquid && isPedal ? force2 * 0.00005 : 0;
        s.discSpeed = Math.max(0, Math.min(3, s.discSpeed - brakingForce + (isPedal ? 0 : 0.02)));
        s.discAngle = (s.discAngle + s.discSpeed) % 360;

        // Sparks when braking and disc is still spinning
        if (isPedal && isLiquid && s.discSpeed > 0.3 && s.d2 > 0.001) {
            s.sparkLife = 1;
        } else {
            s.sparkLife *= 0.92;
        }

        // --- CLEAR ---
        ctx.clearRect(0, 0, W, H);

        // --- DRAW BACKGROUND ---
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Layout constants
        const cy = H * 0.42; // vertical center line for the machine
        const masterX = 70;
        const masterW = 140;
        const masterH = 55;
        const wheelX = W - 310;
        const wheelW = 140;
        const wheelH = 80;
        const pipeY = cy;
        const pipeH = 14;

        // === MASTER CYLINDER ===
        // Body
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        roundRect(ctx, masterX, cy - masterH / 2, masterW, masterH, 8);
        ctx.fill();
        ctx.stroke();

        // Fluid inside master cylinder
        const fluidColor = isLiquid ? `rgba(52, 211, 153, ${0.4 + s.fluidPulse * 0.3})` : `rgba(250, 204, 21, ${0.3 + s.fluidPulse * 0.2})`;
        const pistonOffset = s.d1 * 60; // max 60px travel
        ctx.fillStyle = fluidColor;
        ctx.fillRect(masterX + 20 + pistonOffset, cy - masterH / 2 + 6, masterW - 26 - pistonOffset, masterH - 12);

        // Piston (moves right when pedal pushed)
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        roundRect(ctx, masterX + 10 + pistonOffset, cy - masterH / 2 + 4, 14, masterH - 8, 3);
        ctx.fill();
        ctx.stroke();

        // Piston rod going left to pedal
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(masterX + 10 + pistonOffset, cy);
        ctx.lineTo(masterX - 30, cy);
        ctx.stroke();

        // Pedal (rotates when pushed)
        ctx.save();
        ctx.translate(masterX - 30, cy - 40);
        ctx.rotate((s.d1 * 0.4)); // slight rotation
        ctx.fillStyle = isPedal ? '#f59e0b' : '#64748b';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        roundRect(ctx, -12, -10, 24, 80, 6);
        ctx.fill();
        ctx.stroke();
        // Pedal label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PUSH', 0, 40);
        ctx.restore();

        // Label: Master Cylinder
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('MASTER CYLINDER', masterX + masterW / 2, cy - masterH / 2 - 12);

        // === CONNECTING PIPE ===
        const pipeStartX = masterX + masterW;
        const pipeEndX = wheelX;

        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.fillRect(pipeStartX, pipeY - pipeH / 2, pipeEndX - pipeStartX, pipeH);
        ctx.strokeRect(pipeStartX, pipeY - pipeH / 2, pipeEndX - pipeStartX, pipeH);

        // Fluid inside pipe
        ctx.fillStyle = fluidColor;
        ctx.fillRect(pipeStartX + 2, pipeY - pipeH / 2 + 2, pipeEndX - pipeStartX - 4, pipeH - 4);

        // Animated flow dots
        if (isPedal && isLiquid) {
            for (let i = 0; i < 8; i++) {
                const dotX = pipeStartX + ((s.fluidPulse * (pipeEndX - pipeStartX) + i * 40) % (pipeEndX - pipeStartX));
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.arc(dotX, pipeY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Pressure gauge (middle of pipe)
        const gaugeX = (pipeStartX + pipeEndX) / 2;
        const gaugeY = pipeY - 50;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gaugeX, gaugeY, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Gauge needle
        const gaugeAngle = -Math.PI * 0.75 + (Math.min(pressure, 50) / 50) * Math.PI * 1.5;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gaugeX, gaugeY);
        ctx.lineTo(gaugeX + Math.cos(gaugeAngle) * 20, gaugeY + Math.sin(gaugeAngle) * 20);
        ctx.stroke();
        // Center dot
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(gaugeX, gaugeY, 4, 0, Math.PI * 2);
        ctx.fill();
        // Pressure value
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${pressure.toFixed(1)}`, gaugeX, gaugeY + 18);
        ctx.fillStyle = '#64748b';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText('N/cm²', gaugeX, gaugeY + 28);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText('PRESSURE', gaugeX, gaugeY - 36);

        // === WHEEL CYLINDER ===
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        roundRect(ctx, wheelX, cy - wheelH / 2, wheelW, wheelH, 8);
        ctx.fill();
        ctx.stroke();

        // Fluid inside wheel cylinder
        const wPistonOffset = s.d2 * 40; // max 40px travel (much less)
        ctx.fillStyle = fluidColor;
        ctx.fillRect(wheelX + 6, cy - wheelH / 2 + 6, wheelW - 20 - wPistonOffset, wheelH - 12);

        // Wheel piston (moves right when braking)
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        roundRect(ctx, wheelX + wheelW - 20 - wPistonOffset, cy - wheelH / 2 + 4, 14, wheelH - 8, 3);
        ctx.fill();
        ctx.stroke();

        // Label: Wheel Cylinder
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WHEEL CYLINDER', wheelX + wheelW / 2, cy - wheelH / 2 - 12);

        // === BRAKE PAD ===
        const padX = wheelX + wheelW + 4 - wPistonOffset * 0.5;
        ctx.fillStyle = '#c2410c';
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 1;
        roundRect(ctx, padX, cy - wheelH / 2 + 8, 10, wheelH - 16, 2);
        ctx.fill();
        ctx.stroke();

        // === BRAKE DISC ===
        const discCX = wheelX + wheelW + 70;
        const discCY = cy;
        const discR = 50;

        // Disc body
        ctx.save();
        ctx.translate(discCX, discCY);

        // Outer ring
        const discGrad = ctx.createConicGradient(s.discAngle * Math.PI / 180, 0, 0);
        discGrad.addColorStop(0, '#64748b');
        discGrad.addColorStop(0.25, '#94a3b8');
        discGrad.addColorStop(0.5, '#64748b');
        discGrad.addColorStop(0.75, '#94a3b8');
        discGrad.addColorStop(1, '#64748b');

        ctx.fillStyle = discGrad;
        ctx.beginPath();
        ctx.arc(0, 0, discR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Ventilation holes (rotate with disc)
        for (let i = 0; i < 6; i++) {
            const angle = (s.discAngle + i * 60) * Math.PI / 180;
            const hx = Math.cos(angle) * 35;
            const hy = Math.sin(angle) * 35;
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(hx, hy, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center hub
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center bolt
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Disc label
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BRAKE DISC', discCX, discCY + discR + 20);

        // Speed indicator
        ctx.fillStyle = s.discSpeed > 1 ? '#22c55e' : s.discSpeed > 0.3 ? '#eab308' : '#ef4444';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(s.discSpeed > 0.1 ? 'SPINNING' : 'STOPPED', discCX, discCY + discR + 34);

        // === SPARKS ===
        if (s.sparkLife > 0.1) {
            for (let i = 0; i < 6; i++) {
                const sx = padX + 12 + Math.random() * 10;
                const sy = cy - 20 + Math.random() * 40;
                const sr = 1 + Math.random() * 3;
                ctx.fillStyle = `rgba(251, 191, 36, ${s.sparkLife * Math.random()})`;
                ctx.beginPath();
                ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // === DATA PANEL (bottom) ===
        const panelY = H - 100;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        roundRect(ctx, 15, panelY, W - 30, 90, 10);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        roundRect(ctx, 15, panelY, W - 30, 90, 10);
        ctx.stroke();

        // Panel sections — 5 equal columns
        const colW = (W - 50) / 5;
        const workIn = force1 * s.d1 * 10;
        const workOut = force2 * s.d2 * 10;

        // Col 1: Input
        drawDataCell(ctx, 25, panelY + 8, colW - 10, 'INPUT F₁', `${force1} N`, '#94a3b8', '#f59e0b');
        // Col 2: Output
        drawDataCell(ctx, 25 + colW, panelY + 8, colW - 10, 'OUTPUT F₂', `${force2.toFixed(0)} N`, '#94a3b8', '#10b981');
        // Col 3: Multiplier
        drawDataCell(ctx, 25 + colW * 2, panelY + 8, colW - 10, 'MULTIPLIER', `× ${mechanicalAdv.toFixed(1)}`, '#94a3b8', '#8b5cf6');
        // Col 4: Work In
        drawDataCell(ctx, 25 + colW * 3, panelY + 8, colW - 10, 'WORK IN', `${workIn.toFixed(0)} J`, '#94a3b8', '#3b82f6');
        // Col 5: Work Out
        drawDataCell(ctx, 25 + colW * 4, panelY + 8, colW - 10, 'WORK OUT', `${workOut.toFixed(0)} J`, '#94a3b8', isLiquid ? '#06b6d4' : '#ef4444');

        // Energy status row
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        if (isLiquid) {
            ctx.fillStyle = '#10b981';
            ctx.fillText('Energy Conserved ✓', W / 2, panelY + 80);
        } else {
            ctx.fillStyle = '#fca5a5';
            ctx.fillText('⚠ Gas Mode — Energy lost to compression', W / 2, panelY + 80);
        }

        // === INSTRUCTION (top) ===
        if (!isPedal) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('👆 Click & Hold anywhere to apply brakes', 15, 25);
        } else {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(isLiquid ? '🛑 Braking! Pressure transmitting...' : '⚠️ Gas compressing — no braking!', 15, 25);
        }

        animRef.current = requestAnimationFrame(draw);
    }, [force1, area1, area2, fluidType, pressure, force2, mechanicalAdv]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [draw]);

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-full cursor-pointer"
            onMouseDown={() => setPedalDown(true)}
            onMouseUp={() => setPedalDown(false)}
            onMouseLeave={() => setPedalDown(false)}
            onTouchStart={() => setPedalDown(true)}
            onTouchEnd={() => setPedalDown(false)}
        />
    );
};

// Helper: rounded rectangle path
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// Helper: draw a labeled data cell
function drawDataCell(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, value: string, labelColor: string, valueColor: string) {
    ctx.fillStyle = labelColor;
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + 12);
    ctx.fillStyle = valueColor;
    ctx.font = 'bold 15px monospace';
    ctx.fillText(value, x + w / 2, y + 34);
}

export default HydraulicBrakeLab;
