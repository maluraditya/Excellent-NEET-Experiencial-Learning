import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RotateCcw, Play } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface StokesLawLabProps {
    topic: any;
    onExit: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   FLUID & SPHERE DATA
   ═══════════════════════════════════════════════════════════════ */
interface FluidData {
    name: string;
    color: string;
    bgColor: string;
    eta: number;      // viscosity Pa·s
    sigma: number;     // density kg/m³
    etaLabel: string;
}

const FLUIDS: Record<string, FluidData> = {
    water: { name: 'Water', color: '#3b82f6', bgColor: '#dbeafe80', eta: 1.0e-3, sigma: 1000, etaLabel: '0.001' },
    oil: { name: 'Oil', color: '#f59e0b', bgColor: '#fef3c780', eta: 0.25, sigma: 900, etaLabel: '0.25' },
    glycerin: { name: 'Glycerin', color: '#d97706', bgColor: '#fde68a80', eta: 1.5, sigma: 1260, etaLabel: '1.5' },
};

interface SphereData {
    name: string;
    color: string;
    rho: number;    // density kg/m³
}

const SPHERES: Record<string, SphereData> = {
    steel: { name: 'Steel', color: '#64748b', rho: 7800 },
    lead: { name: 'Lead', color: '#475569', rho: 11340 },
    aluminum: { name: 'Aluminum', color: '#94a3b8', rho: 2700 },
};

const G = 9.81;

/* ─── Canvas Helpers ─── */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

/* ════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════ */
const StokesLawLab: React.FC<StokesLawLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);

    // Controls
    const [fluidKey, setFluidKey] = useState<string>('water');
    const [sphereKey, setSphereKey] = useState<string>('steel');
    const [radiusMm, setRadiusMm] = useState(0.05);      // mm

    // Simulation state
    const [isRunning, setIsRunning] = useState(false);
    const [simTime, setSimTime] = useState(0);          // seconds elapsed
    const [currentVelocity, setCurrentVelocity] = useState(0);
    const [ballY, setBallY] = useState(0);              // fraction 0..1 of cylinder travel

    // History for the graph
    const historyRef = useRef<{ t: number, v: number }[]>([]);

    // Derived physics
    const fluid = FLUIDS[fluidKey];
    const sphere = SPHERES[sphereKey];
    const a = radiusMm / 1000;  // radius in meters
    const rho = sphere.rho;
    const sigma = fluid.sigma;
    const eta = fluid.eta;

    // Terminal velocity: vt = 2a²(ρ-σ)g / (9η)
    const vt = (rho > sigma) ? (2 * a * a * (rho - sigma) * G) / (9 * eta) : 0;
    const reynoldsNumber = eta > 0 ? (sigma * vt * a) / eta : 0;
    const isStokesInvalid = reynoldsNumber > 1;

    // Forces at current velocity
    const mass = (4 / 3) * Math.PI * a * a * a * rho;
    const weight = mass * G;
    const buoyancy = (4 / 3) * Math.PI * a * a * a * sigma * G;
    const dragForce = 6 * Math.PI * eta * a * currentVelocity;

    // Time constant for exponential approach: τ = m / (6πηa)
    const tau = mass / (6 * Math.PI * eta * a);

    // Scaling heuristics moved to draw() for better reactivity

    // Simulation ref
    const simRef = useRef({ isRunning: false, simTime: 0, velocity: 0, ballY: 0 });
    const lastFrameRef = useRef(0);

    const resetSim = useCallback(() => {
        setIsRunning(false);
        setSimTime(0);
        setCurrentVelocity(0);
        setBallY(0);
        historyRef.current = [];
        simRef.current = { isRunning: false, simTime: 0, velocity: 0, ballY: 0 };
        lastFrameRef.current = 0;
    }, []);

    const startSim = useCallback(() => {
        resetSim();
        setTimeout(() => {
            setIsRunning(true);
            simRef.current.isRunning = true;
            lastFrameRef.current = performance.now();
        }, 50);
    }, [resetSim]);

    // Physics simulation loop
    useEffect(() => {
        if (!isRunning) return;
        let raf = 0;
        const step = (now: number) => {
            if (!simRef.current.isRunning) return;
            const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05); // cap at 50ms
            lastFrameRef.current = now;

            // Velocity approach: v(t) = vt * (1 - e^(-t/τ))
            simRef.current.simTime += dt;
            const t = simRef.current.simTime;

            // Use analytical solution for smooth behavior
            const v = vt * (1 - Math.exp(-t / tau));
            simRef.current.velocity = v;

            // Ball position: integrate velocity (analytical: y = vt*t + vt*τ*(e^(-t/τ) - 1))
            const yMeters = vt * t + vt * tau * (Math.exp(-t / tau) - 1);
            const cylinderHeight = 0.5; // 50cm virtual cylinder
            const yFrac = Math.min(yMeters / cylinderHeight, 1.0);
            simRef.current.ballY = yFrac;

            // Record history (every ~30ms)
            if (historyRef.current.length === 0 || t - historyRef.current[historyRef.current.length - 1].t > 0.03) {
                historyRef.current.push({ t, v });
            }

            setSimTime(t);
            setCurrentVelocity(v);
            setBallY(yFrac);

            // Stop if ball reached the bottom
            if (yFrac >= 1.0) {
                simRef.current.isRunning = false;
                setIsRunning(false);
                return;
            }

            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [isRunning, vt, tau]);

    // Resize canvas
    useEffect(() => {
        const c = canvasRef.current; if (!c) return;
        const p = c.parentElement; if (!p) return;
        const ro = new ResizeObserver(() => { c.width = p.clientWidth; c.height = p.clientHeight; });
        ro.observe(p); c.width = p.clientWidth; c.height = p.clientHeight;
        return () => ro.disconnect();
    }, []);

    // Drawing state ref
    const drawStateRef = useRef({ fluidKey, sphereKey, radiusMm, simTime: 0, currentVelocity: 0, ballY: 0, vt, weight, buoyancy, dragForce, tau, reynoldsNumber, isStokesInvalid, isRunning: false });
    useEffect(() => {
        drawStateRef.current = { fluidKey, sphereKey, radiusMm, simTime, currentVelocity, ballY, vt, weight, buoyancy, dragForce, tau, reynoldsNumber, isStokesInvalid, isRunning };
    }, [fluidKey, sphereKey, radiusMm, simTime, currentVelocity, ballY, vt, weight, buoyancy, dragForce, tau, reynoldsNumber, isStokesInvalid, isRunning]);

    /* ════════════════════════════════════════════════════════
       DRAW
       ════════════════════════════════════════════════════════ */
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }
        const s = drawStateRef.current;
        const nowFluid = FLUIDS[s.fluidKey];
        const nowSphere = SPHERES[s.sphereKey];

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        const sc = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);

        // ═══ TITLE ═══
        const titleX = Math.max(30, W * 0.025);
        const titleY = Math.max(65, H * 0.06);
        ctx.fillStyle = '#1a1a2e';
        const titleSize = Math.max(16, W * 0.016);
        ctx.font = `bold ${titleSize}px "Inter", "Segoe UI", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText("Stokes' Law — Terminal Velocity Lab", titleX, titleY);
        ctx.fillStyle = '#6b7280';
        const subSize = Math.max(11, W * 0.011);
        ctx.font = `600 ${subSize}px "Inter", sans-serif`;
        ctx.fillText(`${nowFluid.name}  ·  η = ${nowFluid.etaLabel} Pa·s  ·  ${nowSphere.name} (ρ = ${nowSphere.rho} kg/m³)  ·  r = ${s.radiusMm.toFixed(2)} mm`, titleX, titleY + titleSize + 8);

        // ═══ CYLINDER (left ~28%) ═══
        const cylCX = Math.max(120, W * 0.15);
        const cylTop = Math.max(titleY + titleSize + 40 * sc, H * 0.16);
        const cylBot = H * 0.92;
        const cylH = cylBot - cylTop;
        const cylW = Math.max(60, Math.min(100, W * 0.08)) * sc;

        // Cylinder body
        ctx.fillStyle = nowFluid.bgColor;
        rr(ctx, cylCX - cylW / 2, cylTop, cylW, cylH, 6);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        rr(ctx, cylCX - cylW / 2, cylTop, cylW, cylH, 6);
        ctx.stroke();

        // Fluid fill label
        ctx.fillStyle = `${nowFluid.color}40`;
        ctx.font = `bold ${Math.max(10, W * 0.01)}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(nowFluid.name, cylCX, cylBot - 8);

        // Graduation marks
        ctx.strokeStyle = '#cbd5e180';
        ctx.lineWidth = 1;
        for (let i = 1; i < 10; i++) {
            const gy = cylTop + (cylH / 10) * i;
            const gw = i % 5 === 0 ? cylW * 0.3 : cylW * 0.15;
            ctx.beginPath();
            ctx.moveTo(cylCX - cylW / 2 + 2, gy);
            ctx.lineTo(cylCX - cylW / 2 + gw, gy);
            ctx.stroke();
        }

        // ─── SPHERE ───
        const sphereRadius = Math.max(8, Math.min(s.radiusMm * 5 * sc, cylW * 0.35));
        const sphereY = cylTop + 10 + s.ballY * (cylH - 20 - sphereRadius * 2) + sphereRadius;

        // Sphere shadow/glow
        const sGrad = ctx.createRadialGradient(cylCX, sphereY, sphereRadius * 0.3, cylCX, sphereY, sphereRadius * 1.8);
        sGrad.addColorStop(0, `${nowSphere.color}30`);
        sGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(cylCX, sphereY, sphereRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Sphere body
        const sphereGrad = ctx.createRadialGradient(cylCX - sphereRadius * 0.3, sphereY - sphereRadius * 0.3, sphereRadius * 0.1, cylCX, sphereY, sphereRadius);
        sphereGrad.addColorStop(0, '#e2e8f0');
        sphereGrad.addColorStop(0.5, nowSphere.color);
        sphereGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(cylCX, sphereY, sphereRadius, 0, Math.PI * 2);
        ctx.fill();

        // ─── FORCE ARROWS ───
        if (s.isRunning || s.simTime > 0) {
            const maxArrowLen = cylH * 0.2;
            const maxF = s.weight * 1.2;

            // Gravity (red, down)
            const gLen = (s.weight / maxF) * maxArrowLen;
            ctx.strokeStyle = '#ef4444';
            ctx.fillStyle = '#ef4444';
            ctx.lineWidth = 3 * sc;
            ctx.beginPath();
            ctx.moveTo(cylCX, sphereY + sphereRadius + 4);
            ctx.lineTo(cylCX, sphereY + sphereRadius + 4 + gLen);
            ctx.stroke();
            // Arrowhead
            ctx.beginPath();
            ctx.moveTo(cylCX, sphereY + sphereRadius + 4 + gLen + 8);
            ctx.lineTo(cylCX - 5, sphereY + sphereRadius + 4 + gLen);
            ctx.lineTo(cylCX + 5, sphereY + sphereRadius + 4 + gLen);
            ctx.fill();
            ctx.font = `bold ${Math.max(9, W * 0.009)}px "Inter", sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText('W', cylCX + 8, sphereY + sphereRadius + 4 + gLen / 2 + 4);

            // Buoyancy (green, up)
            const bLen = (s.buoyancy / maxF) * maxArrowLen;
            ctx.strokeStyle = '#22c55e';
            ctx.fillStyle = '#22c55e';
            ctx.lineWidth = 3 * sc;
            ctx.beginPath();
            ctx.moveTo(cylCX - 12, sphereY - sphereRadius - 4);
            ctx.lineTo(cylCX - 12, sphereY - sphereRadius - 4 - bLen);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cylCX - 12, sphereY - sphereRadius - 4 - bLen - 8);
            ctx.lineTo(cylCX - 17, sphereY - sphereRadius - 4 - bLen);
            ctx.lineTo(cylCX - 7, sphereY - sphereRadius - 4 - bLen);
            ctx.fill();
            ctx.textAlign = 'right';
            ctx.fillText('Fb', cylCX - 18, sphereY - sphereRadius - 4 - bLen / 2 + 4);

            // Drag (blue, up) — grows with velocity
            const dLen = Math.min((s.dragForce / maxF) * maxArrowLen, maxArrowLen);
            if (dLen > 2) {
                ctx.strokeStyle = '#3b82f6';
                ctx.fillStyle = '#3b82f6';
                ctx.lineWidth = 3 * sc;
                ctx.beginPath();
                ctx.moveTo(cylCX + 12, sphereY - sphereRadius - 4);
                ctx.lineTo(cylCX + 12, sphereY - sphereRadius - 4 - dLen);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cylCX + 12, sphereY - sphereRadius - 4 - dLen - 8);
                ctx.lineTo(cylCX + 7, sphereY - sphereRadius - 4 - dLen);
                ctx.lineTo(cylCX + 17, sphereY - sphereRadius - 4 - dLen);
                ctx.fill();
                ctx.textAlign = 'left';
                ctx.fillText('Fd', cylCX + 20, sphereY - sphereRadius - 4 - dLen / 2 + 4);
            }
        }

        // ═══ GRAPH — Velocity vs Time — right 65% ═══
        const gOuter = { x: W * 0.32, y: H * 0.04, w: W * 0.66, h: H * 0.92 };

        ctx.fillStyle = '#ffffff';
        rr(ctx, gOuter.x, gOuter.y, gOuter.w, gOuter.h, 14); ctx.fill();
        ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
        rr(ctx, gOuter.x, gOuter.y, gOuter.w, gOuter.h, 14); ctx.stroke();

        const mL = gOuter.w * 0.12;
        const mR = gOuter.w * 0.06;
        const mT = gOuter.h * 0.08;
        const mB = gOuter.h * 0.14;

        const ax = gOuter.x + mL;
        const ay = gOuter.y + mT;
        const aw = gOuter.w - mL - mR;
        const ah = gOuter.h - mT - mB;

        // Graph ranges - Re-calculate per frame for maximum reliability
        const gPrime = Math.max(G * (1 - nowFluid.sigma / nowSphere.rho), 0.1);
        const tFreeFall = Math.sqrt((2 * 0.5) / gPrime);
        const tTerminal = s.vt > 0 ? (0.5 / s.vt) : 10;
        const tEnd = Math.max(tFreeFall, tTerminal);
        const vAtEnd = s.vt * (1 - Math.exp(-tEnd / s.tau));
        const shouldShowVt = s.vt > 0 && (s.vt < 10 * vAtEnd);

        const maxTimeGraph = Math.max(tEnd * 1.25, 2);
        const maxVelGraph = Math.max(vAtEnd, shouldShowVt ? s.vt : 0, 0.01) * 1.2;

        const pX = (t: number) => ax + (Math.min(t, maxTimeGraph) / maxTimeGraph) * aw;
        const pY = (v: number) => ay + ah - (Math.min(v, maxVelGraph) / maxVelGraph) * ah;

        // Gridlines
        ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const ly = ay + ah - (ah / 4) * i;
            ctx.beginPath(); ctx.moveTo(ax, ly); ctx.lineTo(ax + aw, ly); ctx.stroke();
            ctx.fillStyle = '#9ca3af';
            ctx.font = `600 ${Math.max(10, gOuter.w * 0.016)}px "Inter", sans-serif`;
            ctx.textAlign = 'right';
            const velLabel = (maxVelGraph / 4 * i);
            ctx.fillText(velLabel < 0.01 ? velLabel.toExponential(1) : velLabel.toFixed(2), ax - 8, ly + 4);
        }
        for (let i = 1; i <= 5; i++) {
            const lx = ax + (aw / 5) * i;
            ctx.beginPath(); ctx.moveTo(lx, ay); ctx.lineTo(lx, ay + ah); ctx.stroke();
            ctx.fillStyle = '#9ca3af';
            ctx.textAlign = 'center';
            ctx.fillText(`${(maxTimeGraph / 5 * i).toFixed(1)}s`, lx, ay + ah + 16);
        }

        // Axes
        ctx.strokeStyle = '#111827'; ctx.lineWidth = 2.5;
        ctx.fillStyle = '#111827';
        ctx.beginPath(); ctx.moveTo(ax, ay + ah); ctx.lineTo(ax + aw + 14, ay + ah); ctx.stroke();
        // X arrowhead
        ctx.beginPath(); ctx.moveTo(ax + aw + 14, ay + ah); ctx.lineTo(ax + aw + 6, ay + ah - 5); ctx.lineTo(ax + aw + 6, ay + ah + 5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ax, ay + ah); ctx.lineTo(ax, ay - 14); ctx.stroke();
        // Y arrowhead
        ctx.beginPath(); ctx.moveTo(ax, ay - 14); ctx.lineTo(ax - 5, ay - 6); ctx.lineTo(ax + 5, ay - 6); ctx.fill();

        // Axis labels
        const axisFont = Math.max(14, gOuter.w * 0.026);
        ctx.fillStyle = '#111827';
        ctx.font = `bold ${axisFont}px "Inter", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Time (t)  →', ax + aw / 2, ay + ah + mB * 0.72);
        ctx.save();
        ctx.translate(gOuter.x + mL * 0.22, ay + ah / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Velocity (v)  →', 0, 0);
        ctx.restore();

        // Origin
        ctx.font = `bold ${Math.max(13, gOuter.w * 0.022)}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('0', ax - 14, ay + ah + 18);

        // --- CLIP PLOT AREA ---
        ctx.save();
        ctx.beginPath();
        ctx.rect(ax, ay, aw, ah);
        ctx.clip();

        // ─── Terminal velocity dashed line ───
        if (s.vt > 0) {
            const vtY = pY(s.vt);
            // Only draw if line is within visible vertical range
            if (vtY > ay && vtY < ay + ah) {
                ctx.strokeStyle = '#ef444460';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 6]);
                ctx.beginPath();
                ctx.moveTo(ax, vtY);
                ctx.lineTo(ax + aw, vtY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#ef4444';
                ctx.font = `bold ${Math.max(12, gOuter.w * 0.018)}px "Inter", sans-serif`;
                ctx.textAlign = 'right';
                const vtText = `${s.vt.toFixed(4)} m/s`;
                ctx.fillText(`vₜ = ${vtText}`, ax + aw - 10, vtY - 8);
            }
        }

        // ─── Theoretical curve (faint) ───
        ctx.strokeStyle = `${nowFluid.color}25`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
            const t = (i / 200) * maxTimeGraph;
            const v = s.vt * (1 - Math.exp(-t / s.tau));
            const curX = pX(t), curY = pY(v);
            if (i === 0) ctx.moveTo(curX, curY); else ctx.lineTo(curX, curY);
        }
        ctx.stroke();

        // ─── Live data line ───
        const hist = historyRef.current;
        if (hist.length > 1) {
            ctx.strokeStyle = nowFluid.color;
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            let started = false;
            for (let i = 0; i < hist.length; i++) {
                const curX = pX(hist[i].t), curY = pY(hist[i].v);
                if (!started) { ctx.moveTo(curX, curY); started = true; } 
                else ctx.lineTo(curX, curY);
                if (hist[i].t >= maxTimeGraph) break; // Don't draw beyond plot boundary
            }
            ctx.stroke();
            ctx.lineCap = 'butt';

            // Tracker dot - only if within chart
            const last = hist[hist.length - 1];
            if (last.t <= maxTimeGraph) {
                ctx.fillStyle = `${nowFluid.color}40`;
                ctx.beginPath(); ctx.arc(pX(last.t), pY(last.v), 12, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = nowFluid.color;
                ctx.beginPath(); ctx.arc(pX(last.t), pY(last.v), 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(pX(last.t), pY(last.v), 2, 0, Math.PI * 2); ctx.fill();
            }
        }

        ctx.restore(); // END CLIP

        // ─── Info badge — bottom-right of graph (includes formula, vt, and tau) ───
        {
            const energyText = `${s.vt.toFixed(4)} m/s`;
            const badgeFont = Math.max(12, gOuter.w * 0.018);
            const padX = 12, padY = 8;

            const line1 = `vₜ = 2a²(ρ−σ)g / 9η`;
            const line2 = `Terminal Velocity = ${energyText}`;
            const line3 = `Re = ${s.reynoldsNumber.toFixed(2)}  ·  τ = ${s.tau < 0.01 ? s.tau.toExponential(2) : s.tau.toFixed(3)} s`;

            ctx.font = `bold ${badgeFont}px "Inter", sans-serif`;
            const w1 = ctx.measureText(line1).width;
            const w2 = ctx.measureText(line2).width;
            const w3 = ctx.measureText(line3).width;

            const boxW = Math.max(w1, w2, w3) + padX * 2;
            const lineH = badgeFont + 5;
            const boxH = lineH * 3 + padY * 2;

            // Position box at bottom-right of plot area (usually under the curve)
            const badgePadding = 20 * sc;
            const badgeX = ax + aw - boxW - badgePadding;
            const badgeY = ay + ah - boxH - badgePadding; 

            ctx.shadowColor = 'rgba(0,0,0,0.05)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = `#ffffff`; // Solid white background
            rr(ctx, badgeX, badgeY, boxW, boxH, 8); ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = `${nowFluid.color}15`; // Light tint
            rr(ctx, badgeX, badgeY, boxW, boxH, 8); ctx.fill();
            ctx.strokeStyle = `${nowFluid.color}30`; ctx.lineWidth = 1.5;
            rr(ctx, badgeX, badgeY, boxW, boxH, 8); ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = `${nowFluid.color}90`;
            ctx.fillText(line1, badgeX + padX, badgeY + padY + badgeFont * 0.82);
            ctx.fillStyle = nowFluid.color;
            ctx.font = `bold ${badgeFont + 1}px "Inter", sans-serif`;
            ctx.fillText(line2, badgeX + padX, badgeY + padY + lineH + badgeFont * 0.82);
            ctx.fillStyle = '#6b7280';
            ctx.font = `600 ${badgeFont}px "Inter", sans-serif`;
            ctx.fillText(line3, badgeX + padX, badgeY + padY + lineH * 2 + badgeFont * 0.82);
        }

        // ─── Formula watermark ───
        ctx.fillStyle = '#cbd5e180';
        ctx.font = `bold italic ${Math.max(13, gOuter.w * 0.026)}px "Inter", serif`;
        ctx.textAlign = 'left';
        ctx.fillText('Fᵥ = 6πηav', ax + 20 * sc, ay + 30 * sc); // Moved to top-left area

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    /* ════════ JSX ════════ */
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const vtDisplay = `${vt.toFixed(4)} m/s`;
    const velDisplay = currentVelocity.toFixed(4);

    const controlsCombo = (
        <div className="flex gap-3 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            <div className="flex-1 flex flex-col gap-2 md:gap-3 min-w-0">
                {/* Fluid Selector */}
                <div className="p-2.5 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Fluid / Medium</span>
                    <div className="flex bg-slate-100 p-0.5 md:p-1 rounded-lg border border-slate-200">
                        {Object.keys(FLUIDS).map(f => (
                            <button key={f} onClick={() => { setFluidKey(f); resetSim(); }}
                                className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-bold rounded-md transition-all ${fluidKey === f
                                    ? 'bg-white text-slate-800 shadow border border-slate-200'
                                    : 'text-slate-400 hover:text-slate-600'}`}>
                                {FLUIDS[f].name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sphere Material */}
                <div className="p-2.5 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Sphere Material (ρ)</span>
                    <div className="flex bg-slate-100 p-0.5 md:p-1 rounded-lg border border-slate-200">
                        {Object.keys(SPHERES).map(sp => (
                            <button key={sp} onClick={() => { setSphereKey(sp); resetSim(); }}
                                className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-bold rounded-md transition-all ${sphereKey === sp
                                    ? 'bg-white text-slate-800 shadow border border-slate-200'
                                    : 'text-slate-400 hover:text-slate-600'}`}>
                                {SPHERES[sp].name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Radius slider */}
                <div className="p-3 md:p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs md:text-sm font-bold text-slate-700">Radius (a)</span>
                        <span className="font-mono text-xs md:text-sm px-3 py-1 rounded-lg border text-blue-700 bg-blue-50 border-blue-100 font-bold">{radiusMm.toFixed(2)} mm</span>
                    </div>
                    <input type="range" min="0.05" max="10" step="0.05" value={radiusMm}
                        onChange={e => { setRadiusMm(Number(e.target.value)); resetSim(); }}
                        className="w-full h-2.5 md:h-3 rounded-full appearance-none cursor-pointer bg-slate-100"
                        style={{ accentColor: fluid.color }} />
                    <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">0.05 mm</span>
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">10 mm</span>
                    </div>
                </div>
                {isStokesInvalid && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs md:text-sm font-bold text-amber-700">
                        ⚠️ Re &gt; 1: Stokes Law approximation invalid at this size/speed
                    </div>
                )}

                {/* Drop / Reset */}
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={startSim} disabled={isRunning}
                        className={`flex items-center justify-center gap-1.5 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm shadow-sm active:scale-95 transition-all ${isRunning
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white border border-blue-400'}`}>
                        <Play size={16} /> DROP
                    </button>
                    <button onClick={resetSim}
                        className="flex items-center justify-center gap-1.5 py-2.5 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 font-bold text-xs md:text-sm shadow-sm active:scale-95">
                        <RotateCcw size={16} /> RESET
                    </button>
                </div>
            </div>

            {/* RIGHT: Live gauges */}
            <div className="w-[100px] md:w-[120px] flex flex-col gap-2 md:gap-2.5 shrink-0">
                <div className="flex-1 p-2.5 md:p-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Velocity</span>
                    <span className="text-sm md:text-base font-bold text-blue-600 font-mono leading-tight">{velDisplay}</span>
                    <span className="text-[9px] md:text-[10px] text-blue-400 font-bold">m/s</span>
                </div>
                <div className="flex-1 p-2.5 md:p-3 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-red-400 uppercase tracking-widest mb-0.5">vₜ</span>
                    <span className="text-xs md:text-sm font-bold text-red-600 font-mono leading-tight">{vtDisplay}</span>
                </div>
                <div className="flex-1 p-2.5 md:p-3 bg-green-50 rounded-xl border border-green-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-green-400 uppercase tracking-widest mb-0.5">Time</span>
                    <span className="text-sm md:text-base font-bold text-green-600 font-mono leading-tight">{simTime.toFixed(2)}</span>
                    <span className="text-[9px] md:text-[10px] text-green-400 font-bold">sec</span>
                </div>
                <div className="flex-1 p-2.5 md:p-3 bg-amber-50 rounded-xl border border-amber-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Drag Fd</span>
                    <span className="text-xs md:text-sm font-bold text-amber-700 font-mono leading-tight">{dragForce < 0.001 ? (dragForce * 1e6).toFixed(1) : dragForce < 1 ? (dragForce * 1000).toFixed(2) : dragForce.toFixed(3)}</span>
                    <span className="text-[9px] md:text-[10px] text-amber-500 font-bold">{dragForce < 0.001 ? 'μN' : dragForce < 1 ? 'mN' : 'N'}</span>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

export default StokesLawLab;
