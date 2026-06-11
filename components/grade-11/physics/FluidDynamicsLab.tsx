import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Anchor,
    Beaker,
    Circle,
    Droplet,
    Eye,
    EyeOff,
    Gauge,
    Pause,
    Plane,
    Play,
    RotateCcw,
    Wind,
    Zap
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface FluidDynamicsLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'continuity' | 'venturi' | 'torricelli' | 'lift' | 'atomizer' | 'turbulent';

interface FlowParticle {
    x: number;
    lane: number;
    seed: number;
}

interface SprayParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
}

interface DrawState {
    mode: Mode;
    showParticles: boolean;
    showStreamlines: boolean;
    showPressure: boolean;
    showEquations: boolean;
    areaP: number;
    areaR: number;
    areaQ: number;
    flowRate: number;
    constriction: number;
    elevated: boolean;
    heightDelta: number;
    holeLevel: number;
    pressurized: boolean;
    tankPressure: number;
    vTop: number;
    vBottom: number;
    wingArea: number;
    spin: number;
    jetVelocity: number;
    liquidDensity: number;
    flowSpeed: number;
}

const W = 1280;
const H = 760;
const RHO_WATER = 1000;
const RHO_AIR = 1.3;
const RHO_HG = 13600;
const PA = 1.013e5;
const G = 9.8;

const MODE_INFO: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
    { id: 'continuity', label: 'Continuity', icon: <Droplet size={15} /> },
    { id: 'venturi', label: 'Venturi', icon: <Gauge size={15} /> },
    { id: 'torricelli', label: 'Efflux', icon: <Anchor size={15} /> },
    { id: 'lift', label: 'Lift', icon: <Plane size={15} /> },
    { id: 'atomizer', label: 'Atomizer', icon: <Beaker size={15} /> },
    { id: 'turbulent', label: 'Turbulent', icon: <Wind size={15} /> }
];

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function sci(value: number) {
    if (Math.abs(value) >= 1e5) return `${(value / 1e5).toFixed(2)} x 10^5`;
    if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)} x 10^3`;
    return value.toFixed(1);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function label(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    size = 14,
    weight = 800,
    color = '#0f172a',
    align: CanvasTextAlign = 'center'
) {
    ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

function background(ctx: CanvasRenderingContext2D) {
    const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 680);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(15,23,42,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }
}

function title(ctx: CanvasRenderingContext2D, heading: string, subheading: string) {
    label(ctx, heading, W / 2, 62, 29, 900);
    label(ctx, subheading, W / 2, 96, 15, 800, '#475569');
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = '#dc2626') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 12 * Math.cos(a - Math.PI / 6), y2 - 12 * Math.sin(a - Math.PI / 6));
    ctx.lineTo(x2 - 12 * Math.cos(a + Math.PI / 6), y2 - 12 * Math.sin(a + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function waterGradient(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#075985');
    return grad;
}

function glassSheen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 16) {
    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    ctx.clip();
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, 'rgba(255,255,255,0.62)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.10)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
}

function drawWave(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, t: number, color = 'rgba(255,255,255,0.84)') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= w; i += 8) {
        const yy = y + Math.sin(t * 2.3 + i * 0.04) * 4;
        if (i === 0) ctx.moveTo(x + i, yy);
        else ctx.lineTo(x + i, yy);
    }
    ctx.stroke();
    ctx.restore();
}

function pipeRadius(norm: number, baseR: number, ratio: number) {
    const narrowR = baseR * Math.sqrt(ratio);
    const left = 0.34;
    const right = 0.52;
    const blend = 0.14;
    if (norm >= left && norm <= right) return narrowR;
    if (norm > left - blend && norm < left) {
        const t = (norm - (left - blend)) / blend;
        const s = t * t * (3 - 2 * t);
        return lerp(baseR, narrowR, s);
    }
    if (norm > right && norm < right + blend) {
        const t = (norm - right) / blend;
        const s = t * t * (3 - 2 * t);
        return lerp(narrowR, baseR, s);
    }
    return baseR;
}

function velocityAt(norm: number, flow: number, ratio: number) {
    const r = pipeRadius(norm, 1, ratio);
    return flow / Math.max(0.05, r * r);
}

function pressureColor(norm: number, flow: number, ratio: number) {
    const v = velocityAt(norm, flow, ratio);
    const vMin = velocityAt(0.05, flow, ratio);
    const vMax = velocityAt(0.44, flow, ratio);
    const n = clamp((v - vMin) / Math.max(0.001, vMax - vMin), 0, 1);
    const r = Math.round(37 + n * 183);
    const g = Math.round(99 - n * 61);
    const b = Math.round(235 - n * 173);
    return `rgba(${r},${g},${b},0.72)`;
}

function drawVenturiPipe(ctx: CanvasRenderingContext2D, state: DrawState, t: number, particles: FlowParticle[]) {
    title(ctx, 'Bernoulli / Venturi Flow', 'Fast flow in a constriction lowers pressure');
    const x0 = 120;
    const x1 = 1080;
    const cy = state.elevated ? 372 : 392;
    const baseR = 118;
    const len = x1 - x0;
    const lift = state.elevated ? state.heightDelta * 3.2 : 0;

    const centerY = (x: number) => {
        const n = (x - x0) / len;
        return cy - lift * clamp((n - 0.30) / 0.40, 0, 1);
    };
    const radiusAtX = (x: number) => pipeRadius((x - x0) / len, baseR, state.constriction);

    ctx.save();
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, centerY(x) - radiusAtX(x));
    for (let x = x1; x >= x0; x -= 8) ctx.lineTo(x, centerY(x) + radiusAtX(x));
    ctx.closePath();
    ctx.clip();
    for (let x = x0; x <= x1; x += 16) {
        ctx.fillStyle = state.showPressure ? pressureColor((x - x0) / len, state.flowRate / 100, state.constriction) : 'rgba(14,165,233,0.45)';
        ctx.fillRect(x, centerY(x) - baseR - 90, 18, baseR * 2 + 180);
    }
    if (state.showStreamlines) {
        for (let lane = -3; lane <= 3; lane += 1) {
            ctx.strokeStyle = 'rgba(224,242,254,0.82)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = x0; x <= x1; x += 10) {
                const n = (x - x0) / len;
                const y = centerY(x) + lane * radiusAtX(x) / 4 + Math.sin(t * 2 + n * 8 + lane) * 2;
                if (x === x0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }
    if (state.showParticles) {
        particles.forEach((p) => {
            const n = ((p.x - x0) / len + 1) % 1;
            const x = x0 + n * len;
            const r = radiusAtX(x);
            const y = centerY(x) + (p.lane / 5) * r + Math.sin(t * 3 + p.seed) * 3;
            const v = velocityAt(n, state.flowRate / 100, state.constriction);
            ctx.strokeStyle = `rgba(${v > 1.4 ? '220,38,38' : '14,165,233'},0.78)`;
            ctx.lineWidth = 3 + clamp(v, 0, 3);
            ctx.beginPath();
            ctx.moveTo(x - 16 * v, y);
            ctx.lineTo(x + 8, y);
            ctx.stroke();
        });
    }
    ctx.restore();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, centerY(x) - radiusAtX(x));
    ctx.stroke();
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, centerY(x) + radiusAtX(x));
    ctx.stroke();

    label(ctx, 'wide: high P', 245, centerY(245) - radiusAtX(245) - 34, 15, 900, '#2563eb');
    label(ctx, 'throat: fast, low P', 550, centerY(550) - radiusAtX(550) - 34, 15, 900, '#dc2626');
    arrow(ctx, 240, 170, 240, centerY(240) - radiusAtX(240), '#2563eb');
    arrow(ctx, 550, 185, 550, centerY(550) - radiusAtX(550), '#dc2626');

    const p1 = PA;
    const v1 = state.flowRate / 100;
    const v2 = v1 / state.constriction;
    const dp = Math.max(0, 0.5 * RHO_WATER * (v2 * v2 - v1 * v1) + RHO_WATER * G * (state.elevated ? state.heightDelta : 0));
    const hHg = clamp(dp / (RHO_HG * G) * 100, 0, 120);
    const ux = 640;
    const uy = 540;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ux - 70, uy - 110);
    ctx.lineTo(ux - 70, uy + 55);
    ctx.quadraticCurveTo(ux - 70, uy + 100, ux + 70, uy + 55);
    ctx.lineTo(ux + 70, uy - 110);
    ctx.stroke();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(ux - 70, uy + 20);
    ctx.lineTo(ux - 70, uy + 55);
    ctx.quadraticCurveTo(ux - 70, uy + 88, ux + 70, uy + 55);
    ctx.lineTo(ux + 70, uy + 20 - hHg);
    ctx.stroke();
    label(ctx, 'U-tube manometer', ux, uy + 128, 14, 900, '#0f172a');
    label(ctx, `${hHg.toFixed(1)} cm Hg`, ux + 102, uy + 18 - hHg / 2, 13, 900, '#d97706', 'left');
    label(ctx, `P1 approx ${sci(p1)} Pa`, 250, 690, 13, 900, '#2563eb');
    label(ctx, `P1 - P2 approx ${sci(dp)} Pa`, 920, 690, 13, 900, '#dc2626');
}

function drawContinuity(ctx: CanvasRenderingContext2D, state: DrawState, t: number, particles: FlowParticle[]) {
    title(ctx, 'Equation of Continuity', 'Narrower cross-section means faster flow: A v = constant');
    const x0 = 120;
    const x1 = 1080;
    const y = 380;
    const stations = [
        { x: 250, a: state.areaP, id: 'P', color: '#2563eb' },
        { x: 560, a: state.areaR, id: 'R', color: '#d97706' },
        { x: 880, a: state.areaQ, id: 'Q', color: '#dc2626' }
    ];
    const maxA = Math.max(state.areaP, state.areaR, state.areaQ);
    const radiusAt = (x: number) => {
        const nearest = stations.reduce((best, s) => Math.abs(s.x - x) < Math.abs(best.x - x) ? s : best, stations[0]);
        return 45 + 105 * Math.sqrt(nearest.a / maxA);
    };
    ctx.save();
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, y - radiusAt(x));
    for (let x = x1; x >= x0; x -= 8) ctx.lineTo(x, y + radiusAt(x));
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = 'rgba(14,165,233,0.52)';
    ctx.fillRect(x0, 170, x1 - x0, 420);
    if (state.showStreamlines) {
        for (let lane = -4; lane <= 4; lane += 1) {
            ctx.strokeStyle = 'rgba(224,242,254,0.85)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = x0; x <= x1; x += 10) {
                const yy = y + lane * radiusAt(x) / 5 + Math.sin(t * 2 + x * 0.02 + lane) * 2;
                if (x === x0) ctx.moveTo(x, yy);
                else ctx.lineTo(x, yy);
            }
            ctx.stroke();
        }
    }
    if (state.showParticles) {
        particles.forEach((p) => {
            const n = ((p.x - x0) / (x1 - x0) + 1) % 1;
            const x = x0 + n * (x1 - x0);
            const r = radiusAt(x);
            const yy = y + (p.lane / 5) * r;
            ctx.fillStyle = 'rgba(255,255,255,0.88)';
            ctx.beginPath();
            ctx.arc(x, yy, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    ctx.restore();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, y - radiusAt(x));
    ctx.stroke();
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, y + radiusAt(x));
    ctx.stroke();
    stations.forEach((s) => {
        const r = radiusAt(s.x);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(s.x, y - r - 18);
        ctx.lineTo(s.x, y + r + 18);
        ctx.stroke();
        label(ctx, `${s.id}: A=${s.a}`, s.x, y + r + 50, 17, 900, s.color);
        label(ctx, `v=${(state.flowRate / s.a).toFixed(2)}`, s.x, y - r - 44, 14, 900, s.color);
    });
    label(ctx, 'A_P v_P = A_R v_R = A_Q v_Q', W / 2, 690, 17, 900, '#0f172a');
}

function drawTorricelli(ctx: CanvasRenderingContext2D, state: DrawState, t: number) {
    title(ctx, 'Torricelli Efflux', 'Efflux speed equals free-fall speed from height h');
    const tankX = 300;
    const tankY = 145;
    const tankW = 285;
    const tankH = 500;
    const surfaceY = tankY + 80;
    const bottomY = tankY + tankH - 20;
    const holeY = lerp(bottomY - 42, surfaceY + 70, state.holeLevel / 100);
    const y1m = (bottomY - holeY) / 46;
    const hm = Math.max(0.2, (holeY - surfaceY) / 46);
    const extra = state.pressurized ? 2 * Math.max(0, state.tankPressure - PA) / RHO_WATER : 0;
    const v = Math.sqrt(2 * G * hm + extra);
    roundRect(ctx, tankX, tankY, tankW, tankH, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.stroke();
    roundRect(ctx, tankX + 18, surfaceY, tankW - 36, bottomY - surfaceY, 20);
    ctx.fillStyle = waterGradient(ctx, tankX, surfaceY, bottomY - surfaceY);
    ctx.fill();
    glassSheen(ctx, tankX + 18, surfaceY, tankW - 36, bottomY - surfaceY, 20);
    drawWave(ctx, tankX + 34, surfaceY, tankW - 68, t);
    ctx.fillStyle = '#075985';
    ctx.beginPath();
    ctx.arc(tankX + tankW - 2, holeY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 95; i += 1) {
        const tt = i / 14;
        const x = tankX + tankW + v * tt * 13;
        const y = holeY + 0.5 * G * tt * tt * 9;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (y > 682) break;
    }
    ctx.stroke();
    if (state.showParticles) {
        for (let i = 0; i < 18; i += 1) {
            const tt = ((t * 1.8 + i * 0.16) % 3.4);
            const x = tankX + tankW + v * tt * 13;
            const y = holeY + 0.5 * G * tt * tt * 9;
            ctx.fillStyle = 'rgba(14,165,233,0.85)';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    arrow(ctx, tankX - 60, surfaceY, tankX - 60, holeY, '#475569');
    label(ctx, 'h', tankX - 78, (surfaceY + holeY) / 2, 17, 900, '#475569', 'right');
    label(ctx, `v = ${v.toFixed(2)} m/s`, 840, 260, 22, 900, '#0ea5e9');
    label(ctx, state.pressurized ? 'pressurized tank' : 'open to atmosphere', tankX + tankW / 2, tankY + 38, 14, 900, '#0f172a');
    label(ctx, `range approx ${(v * Math.sqrt(2 * y1m / G)).toFixed(2)} m`, 840, 310, 16, 900, '#0f172a');
    ctx.strokeStyle = 'rgba(100,116,139,0.55)';
    ctx.setLineDash([8, 7]);
    ctx.beginPath();
    ctx.moveTo(690, surfaceY);
    ctx.lineTo(690, holeY);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, 'free-fall comparison', 730, (surfaceY + holeY) / 2, 14, 900, '#64748b', 'left');
}

function drawLift(ctx: CanvasRenderingContext2D, state: DrawState, t: number) {
    title(ctx, 'Dynamic Lift and Magnus Effect', 'Faster streamlines mean lower pressure');
    const wingX = 650;
    const wingY = 268;
    ctx.save();
    ctx.translate(wingX, wingY);
    ctx.beginPath();
    ctx.moveTo(-265, 20);
    ctx.bezierCurveTo(-90, -72, 180, -56, 300, 4);
    ctx.bezierCurveTo(120, 36, -60, 45, -265, 20);
    ctx.closePath();
    const wingGrad = ctx.createLinearGradient(-260, -70, 300, 45);
    wingGrad.addColorStop(0, '#ffffff');
    wingGrad.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = wingGrad;
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 7; i += 1) {
        const y = 205 + i * 19;
        ctx.strokeStyle = i < 3 ? 'rgba(220,38,38,0.72)' : 'rgba(14,165,233,0.72)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(160, y);
        ctx.bezierCurveTo(360, y - (i < 3 ? 54 : -28), 760, y - (i < 3 ? 48 : -8), 1110, y + Math.sin(t + i) * 5);
        ctx.stroke();
    }
    const dp = 0.5 * RHO_AIR * (state.vTop * state.vTop - state.vBottom * state.vBottom);
    const lift = dp * state.wingArea;
    arrow(ctx, wingX, wingY + 60, wingX, wingY - 112, '#16a34a');
    label(ctx, `lift ${(lift / 1000).toFixed(2)} kN`, wingX + 80, wingY - 80, 18, 900, '#16a34a', 'left');
    label(ctx, `v_top ${state.vTop} m/s`, 230, 165, 14, 900, '#dc2626');
    label(ctx, `v_bottom ${state.vBottom} m/s`, 230, 340, 14, 900, '#0ea5e9');

    const ballX = 430;
    const ballY = 570;
    ctx.strokeStyle = 'rgba(100,116,139,0.40)';
    ctx.setLineDash([8, 7]);
    ctx.beginPath();
    ctx.moveTo(230, 610);
    ctx.quadraticCurveTo(545, 520, 810, 620);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(230, 610);
    ctx.quadraticCurveTo(545, 520 - state.spin * 12, 810, 620 - state.spin * 16);
    ctx.stroke();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(ballX + ((t * 70) % 360), ballY - Math.sin(t * 1.2) * state.spin * 12, 30, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, state.spin >= 0 ? 'spin: upward curve' : 'spin: downward curve', 880, 570, 16, 900, '#d97706', 'left');
}

function drawAtomizer(ctx: CanvasRenderingContext2D, state: DrawState, t: number, droplets: SprayParticle[], dt: number) {
    title(ctx, 'Atomizer / Spray Pump', 'Fast air jet lowers pressure and draws liquid upward');
    const bulbX = 250;
    const bulbY = 340;
    const squeeze = 0.12 + 0.10 * Math.sin(t * 3);
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.ellipse(bulbX, bulbY, 88 * (1 - squeeze), 76 * (1 + squeeze * 0.25), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bulbX + 78, bulbY);
    ctx.lineTo(675, bulbY);
    ctx.stroke();
    for (let i = 0; i < 18; i += 1) {
        const x = 350 + ((t * state.jetVelocity * 1.8 + i * 38) % 360);
        ctx.fillStyle = 'rgba(14,165,233,0.65)';
        ctx.beginPath();
        ctx.arc(x, bulbY + Math.sin(t * 4 + i) * 5, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    const bottleX = 520;
    const bottleY = 430;
    roundRect(ctx, bottleX, bottleY, 150, 185, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#0ea5e9';
    roundRect(ctx, bottleX + 14, bottleY + 72, 122, 98, 16);
    ctx.fill();
    drawWave(ctx, bottleX + 24, bottleY + 72, 102, t);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(bottleX + 75, bottleY + 72);
    ctx.lineTo(bottleX + 75, bulbY - 3);
    ctx.stroke();
    const rise = clamp((state.jetVelocity - 25) / 70, 0, 1);
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(bottleX + 75, bottleY + 72);
    ctx.lineTo(bottleX + 75, lerp(bottleY + 72, bulbY - 3, rise));
    ctx.stroke();
    if (state.jetVelocity > 34 && droplets.length < 70) {
        droplets.push({ x: 675, y: bulbY, vx: 180 + Math.random() * 190, vy: -90 + Math.random() * 80, life: 0.95, maxLife: 0.95 });
    }
    droplets.forEach((d) => {
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.vy += 170 * dt;
        d.life -= dt;
        ctx.globalAlpha = clamp(d.life / d.maxLife, 0, 1);
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    label(ctx, 'low pressure at jet', 710, bulbY - 36, 15, 900, '#2563eb', 'left');
    label(ctx, 'liquid rises', bottleX + 155, bottleY + 92, 14, 900, '#0ea5e9', 'left');
}

function drawTurbulent(ctx: CanvasRenderingContext2D, state: DrawState, t: number) {
    title(ctx, 'Streamline vs Turbulent Flow', 'Beyond critical speed, steady flow becomes chaotic');
    const topY = 235;
    const bottomY = 530;
    const speedNorm = clamp(state.flowSpeed / 100, 0, 1.4);
    [topY, bottomY].forEach((cy, panel) => {
        roundRect(ctx, 160, cy - 92, 960, 184, 28);
        ctx.fillStyle = panel === 0 ? 'rgba(14,165,233,0.16)' : 'rgba(220,38,38,0.10)';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.stroke();
        for (let lane = -4; lane <= 4; lane += 1) {
            ctx.strokeStyle = panel === 0 && speedNorm < 0.75 ? '#38bdf8' : '#f59e0b';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            for (let x = 185; x <= 1090; x += 12) {
                const chaos = panel === 1 || speedNorm > 0.78 ? Math.sin(t * 7 + x * 0.035 + lane) * 18 * speedNorm : 0;
                const y = cy + lane * 17 + chaos;
                if (x === 185) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        if (panel === 1 || speedNorm > 0.78) {
            for (let i = 0; i < 8; i += 1) {
                const x = 260 + i * 95;
                const y = cy + Math.sin(t * 2 + i) * 42;
                ctx.strokeStyle = 'rgba(220,38,38,0.55)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y, 18 + 5 * Math.sin(t * 3 + i), t * 2 + i, t * 2 + i + Math.PI * 1.4);
                ctx.stroke();
            }
        }
    });
    label(ctx, 'laminar: parallel layers', 245, topY - 124, 17, 900, '#0ea5e9');
    label(ctx, 'turbulent: eddies and fluctuating velocity', 330, bottomY - 124, 17, 900, '#dc2626');
    const re = RHO_WATER * (state.flowSpeed / 10) * 0.04 / 0.001;
    label(ctx, `Re approx ${re.toFixed(0)}; critical-speed threshold shown visually`, W / 2, 700, 15, 900, re > 4000 ? '#dc2626' : '#16a34a');
}

const FluidDynamicsLab: React.FC<FluidDynamicsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>();
    const lastRef = useRef<number>();
    const timeRef = useRef(0);
    const particlesRef = useRef<FlowParticle[]>([]);
    const dropletsRef = useRef<SprayParticle[]>([]);
    const manometerRef = useRef(0);

    const [mode, setMode] = useState<Mode>('venturi');
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [showParticles, setShowParticles] = useState(true);
    const [showStreamlines, setShowStreamlines] = useState(true);
    const [showPressure, setShowPressure] = useState(true);
    const [showEquations, setShowEquations] = useState(true);
    const [areaP, setAreaP] = useState(100);
    const [areaR, setAreaR] = useState(60);
    const [areaQ, setAreaQ] = useState(30);
    const [flowRate, setFlowRate] = useState(100);
    const [constriction, setConstriction] = useState(0.45);
    const [elevated, setElevated] = useState(false);
    const [heightDelta, setHeightDelta] = useState(4);
    const [holeLevel, setHoleLevel] = useState(42);
    const [pressurized, setPressurized] = useState(false);
    const [tankPressure, setTankPressure] = useState(180000);
    const [vTop, setVTop] = useState(70);
    const [vBottom, setVBottom] = useState(63);
    const [wingArea, setWingArea] = useState(2.5);
    const [spin, setSpin] = useState(1);
    const [jetVelocity, setJetVelocity] = useState(58);
    const [liquidDensity, setLiquidDensity] = useState(1000);
    const [flowSpeed, setFlowSpeed] = useState(45);

    const stateRef = useRef<DrawState>({
        mode,
        showParticles,
        showStreamlines,
        showPressure,
        showEquations,
        areaP,
        areaR,
        areaQ,
        flowRate,
        constriction,
        elevated,
        heightDelta,
        holeLevel,
        pressurized,
        tankPressure,
        vTop,
        vBottom,
        wingArea,
        spin,
        jetVelocity,
        liquidDensity,
        flowSpeed
    });
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);

    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => {
        stateRef.current = {
            mode,
            showParticles,
            showStreamlines,
            showPressure,
            showEquations,
            areaP,
            areaR,
            areaQ,
            flowRate,
            constriction,
            elevated,
            heightDelta,
            holeLevel,
            pressurized,
            tankPressure,
            vTop,
            vBottom,
            wingArea,
            spin,
            jetVelocity,
            liquidDensity,
            flowSpeed
        };
    }, [areaP, areaQ, areaR, constriction, elevated, flowRate, flowSpeed, heightDelta, holeLevel, jetVelocity, liquidDensity, mode, pressurized, showEquations, showParticles, showPressure, showStreamlines, spin, tankPressure, vBottom, vTop, wingArea]);

    useEffect(() => {
        particlesRef.current = Array.from({ length: 90 }, (_, i) => ({
            x: 120 + Math.random() * 960,
            lane: -4 + (i % 9),
            seed: i * 0.61
        }));
    }, []);

    const handleReset = useCallback(() => {
        setMode('venturi');
        setPaused(false);
        setSpeed(1);
        setShowParticles(true);
        setShowStreamlines(true);
        setShowPressure(true);
        setShowEquations(true);
        setAreaP(100);
        setAreaR(60);
        setAreaQ(30);
        setFlowRate(100);
        setConstriction(0.45);
        setElevated(false);
        setHeightDelta(4);
        setHoleLevel(42);
        setPressurized(false);
        setTankPressure(180000);
        setVTop(70);
        setVBottom(63);
        setWingArea(2.5);
        setSpin(1);
        setJetVelocity(58);
        setLiquidDensity(1000);
        setFlowSpeed(45);
        dropletsRef.current = [];
        manometerRef.current = 0;
        timeRef.current = 0;
    }, []);

    useEffect(() => {
        const draw = (now: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            const last = lastRef.current ?? now;
            const rawDt = Math.min((now - last) / 1000, 0.1);
            lastRef.current = now;
            const dt = pausedRef.current ? 0 : rawDt * speedRef.current;
            if (!pausedRef.current) timeRef.current += dt;
            const t = timeRef.current;
            const state = stateRef.current;

            particlesRef.current.forEach((p) => {
                const regionSpeed = state.mode === 'venturi'
                    ? velocityAt(((p.x - 120) / 960 + 1) % 1, state.flowRate / 100, state.constriction)
                    : state.flowRate / 80;
                p.x += dt * (54 + regionSpeed * 74);
                if (p.x > 1100) p.x = 110;
            });
            dropletsRef.current = dropletsRef.current.filter((d) => d.life > 0);
            const v1 = state.flowRate / 100;
            const v2 = v1 / state.constriction;
            const dp = Math.max(0, 0.5 * RHO_WATER * (v2 * v2 - v1 * v1) + RHO_WATER * G * (state.elevated ? state.heightDelta : 0));
            manometerRef.current = lerp(manometerRef.current, dp / (RHO_HG * G) * 100, Math.min(1, dt * 5));

            background(ctx);
            if (state.mode === 'continuity') drawContinuity(ctx, state, t, particlesRef.current);
            else if (state.mode === 'torricelli') drawTorricelli(ctx, state, t);
            else if (state.mode === 'lift') drawLift(ctx, state, t);
            else if (state.mode === 'atomizer') drawAtomizer(ctx, state, t, dropletsRef.current, dt);
            else if (state.mode === 'turbulent') drawTurbulent(ctx, state, t);
            else drawVenturiPipe(ctx, state, t, particlesRef.current);

            rafRef.current = requestAnimationFrame(draw);
        };
        rafRef.current = requestAnimationFrame(draw);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const values = useMemo(() => {
        const v1 = flowRate / 100;
        const v2 = v1 / constriction;
        const p1 = PA;
        const p2 = p1 - Math.max(0, 0.5 * RHO_WATER * (v2 * v2 - v1 * v1) + RHO_WATER * G * (elevated ? heightDelta : 0));
        const bern1 = p1 + 0.5 * RHO_WATER * v1 * v1;
        const bern2 = p2 + 0.5 * RHO_WATER * v2 * v2 + RHO_WATER * G * (elevated ? heightDelta : 0);
        const h = 4 + (100 - holeLevel) * 0.05;
        const efflux = Math.sqrt(2 * G * h + (pressurized ? 2 * Math.max(0, tankPressure - PA) / RHO_WATER : 0));
        const liftPressure = 0.5 * RHO_AIR * (vTop * vTop - vBottom * vBottom);
        const liftForce = liftPressure * wingArea;
        const atomizerDp = 0.5 * RHO_AIR * jetVelocity * jetVelocity;
        const atomizerRise = atomizerDp / (liquidDensity * G);
        const reynolds = RHO_WATER * (flowSpeed / 10) * 0.04 / 0.001;
        return { v1, v2, p1, p2, bern1, bern2, efflux, liftPressure, liftForce, atomizerDp, atomizerRise, reynolds };
    }, [constriction, elevated, flowRate, flowSpeed, heightDelta, holeLevel, jetVelocity, liquidDensity, pressurized, tankPressure, vBottom, vTop, wingArea]);

    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Energy Terms</h3>
                    <p className="text-xs font-semibold text-slate-500">Bernoulli terms trade along one streamline.</p>
                    <svg viewBox="0 0 300 155" className="mt-2 h-[155px] w-full">
                        <line x1="34" y1="132" x2="282" y2="132" stroke="#64748b" strokeWidth="2" />
                        <line x1="34" y1="22" x2="34" y2="132" stroke="#64748b" strokeWidth="2" />
                        <rect x="72" y="54" width="46" height="78" rx="7" fill="#bfdbfe" />
                        <rect x="130" y="90" width="46" height="42" rx="7" fill="#fed7aa" />
                        <rect x="202" y="82" width="46" height="50" rx="7" fill="#fecaca" />
                        <text x="95" y="146" fontSize="11" fontWeight="800" fill="#2563eb" textAnchor="middle">P</text>
                        <text x="153" y="146" fontSize="11" fontWeight="800" fill="#d97706" textAnchor="middle">1/2rv2</text>
                        <text x="225" y="146" fontSize="11" fontWeight="800" fill="#dc2626" textAnchor="middle">rho gh</text>
                    </svg>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">NCERT Anchors</h3>
                    <div className="mt-2 space-y-1.5 text-xs font-bold text-slate-700">
                        <p>Continuity: A v = constant, Eq 9.11.</p>
                        <p>Bernoulli: P + 1/2 rho v^2 + rho g h = constant, Eq 9.13.</p>
                        <p>Torricelli: v = sqrt(2gh), Eq 9.15.</p>
                        <p>Daniel Bernoulli 1738; assumptions: steady, incompressible, non-viscous.</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Applications</h3>
                    <div className="mt-2 space-y-1.5 text-xs font-bold text-slate-700">
                        <p>Venturimeter measures flow speed from pressure drop.</p>
                        <p>Atomizer: fast air jet lowers pressure and draws liquid upward.</p>
                        <p>Magnus effect: spinning ball curves because one side has lower pressure.</p>
                        <p>Blood stenosis: narrowing speeds flow and drops pressure.</p>
                        <p>Exercise 9.14: 70 m/s, 63 m/s, 2.5 m2, rho_air 1.3 gives lift about 1.51 kN.</p>
                    </div>
                </div>
            </div>
        </aside>
    ), []);

    const valuesPanel = useMemo(() => {
        const hint: Record<Mode, string> = {
            continuity: 'Narrower pipe means faster flow because A v stays constant.',
            venturi: 'Bernoulli: pressure trades with kinetic and gravitational terms along a streamline.',
            torricelli: 'Efflux speed v = sqrt(2gh), the same as a freely falling body from height h.',
            lift: 'Faster flow over the airfoil gives lower pressure above and upward lift.',
            atomizer: 'Fast air jet creates low pressure so atmospheric pressure pushes liquid upward.',
            turbulent: 'Above critical speed, streamlines break into eddies and fluctuating velocity.'
        };
        const rows = mode === 'continuity' ? [
            ['A_P', `${areaP}`, 'bg-blue-50', 'text-blue-700'],
            ['A_R', `${areaR}`, 'bg-amber-50', 'text-amber-700'],
            ['A_Q', `${areaQ}`, 'bg-red-50', 'text-red-700'],
            ['Flux', `${flowRate} unit3/s`, 'bg-emerald-50', 'text-emerald-700']
        ] : mode === 'venturi' ? [
            ['v1', `${values.v1.toFixed(2)} m/s`, 'bg-sky-50', 'text-sky-700'],
            ['v2', `${values.v2.toFixed(2)} m/s`, 'bg-red-50', 'text-red-700'],
            ['P1', `${sci(values.p1)} Pa`, 'bg-blue-50', 'text-blue-700'],
            ['P2', `${sci(values.p2)} Pa`, 'bg-amber-50', 'text-amber-700'],
            ['Sum check', `${Math.abs(values.bern1 - values.bern2).toFixed(1)} Pa`, 'bg-emerald-50', 'text-emerald-700']
        ] : mode === 'torricelli' ? [
            ['Efflux speed', `${values.efflux.toFixed(2)} m/s`, 'bg-sky-50', 'text-sky-700'],
            ['Tank pressure', pressurized ? `${sci(tankPressure)} Pa` : 'Pa', 'bg-amber-50', 'text-amber-700'],
            ['Law', 'v = sqrt(2gh)', 'bg-violet-50', 'text-violet-700']
        ] : mode === 'lift' ? [
            ['v top', `${vTop} m/s`, 'bg-red-50', 'text-red-700'],
            ['v bottom', `${vBottom} m/s`, 'bg-sky-50', 'text-sky-700'],
            ['Delta P', `${values.liftPressure.toFixed(2)} Pa`, 'bg-amber-50', 'text-amber-700'],
            ['Lift', `${(values.liftForce / 1000).toFixed(2)} kN`, 'bg-emerald-50', 'text-emerald-700']
        ] : mode === 'atomizer' ? [
            ['Air jet', `${jetVelocity} m/s`, 'bg-sky-50', 'text-sky-700'],
            ['Pressure drop', `${values.atomizerDp.toFixed(0)} Pa`, 'bg-blue-50', 'text-blue-700'],
            ['Liquid rise', `${values.atomizerRise.toFixed(2)} m`, 'bg-emerald-50', 'text-emerald-700']
        ] : [
            ['Flow speed', `${flowSpeed}`, 'bg-sky-50', 'text-sky-700'],
            ['Reynolds no.', `${values.reynolds.toFixed(0)}`, 'bg-amber-50', 'text-amber-700'],
            ['Regime', values.reynolds > 4000 ? 'turbulent' : 'laminar', values.reynolds > 4000 ? 'bg-red-50' : 'bg-emerald-50', values.reynolds > 4000 ? 'text-red-700' : 'text-emerald-700']
        ];
        return (
            <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
                <div className="flex flex-col gap-3">
                    <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl backdrop-blur">
                        <div className="flex items-start gap-2">
                            <Wind size={19} className="mt-0.5 text-violet-800" />
                            <div>
                                <h3 className="text-base font-extrabold text-violet-950">Bernoulli Bench</h3>
                                <p className="text-xs font-semibold text-violet-700">NCERT Class 11 Physics Sec 9.3-9.4</p>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-violet-950">
                            <p>P + 1/2 rho v^2 + rho g h = constant. Daniel Bernoulli, 1738.</p>
                            <p>A v = constant for incompressible steady flow.</p>
                            <p>v = sqrt(2gh) for Torricelli efflux from an open tank.</p>
                            <p>Assumptions: steady, incompressible, non-viscous; not valid for viscous drag or turbulent flow.</p>
                            <p>When v = 0, Bernoulli reduces to hydrostatic pressure.</p>
                            <p>Applications shown: Venturimeter, Torricelli efflux, dynamic lift, Magnus effect, atomizer, turbulent flow and stenosis analogy.</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                        </div>
                        <div className="mt-3 space-y-2">
                            {rows.map(([name, value, tint, color]) => (
                                <div key={String(name)} className={`rounded-lg border border-slate-100 ${tint} px-3 py-2.5`}>
                                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{name}</div>
                                    <div className={`mt-1 font-mono text-base font-extrabold ${color}`}>{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                        <h3 className="text-base font-extrabold text-slate-900">NCERT Hint</h3>
                        <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">{hint[mode]}</p>
                        <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">Exercise 9.14 default: Delta P = 605.15 Pa and lift = 1513 N = 1.51 kN.</p>
                    </div>
                </div>
            </aside>
        );
    }, [areaP, areaQ, areaR, flowRate, flowSpeed, jetVelocity, mode, pressurized, tankPressure, values, vBottom, vTop]);

    const controls = (
        <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                    <Wind size={17} />
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900">Bernoulli Bench</div>
                    <div className="text-[11px] font-bold text-slate-500">{mode}</div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
                {MODE_INFO.map((item) => (
                    <button key={item.id} onClick={() => setMode(item.id)} className={`flex min-h-[40px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-black ${mode === item.id ? 'border-sky-400 bg-sky-100 text-sky-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </div>
            {mode === 'continuity' && (
                <div className="grid grid-cols-3 gap-2">
                    {[['A_P', areaP, setAreaP], ['A_R', areaR, setAreaR], ['A_Q', areaQ, setAreaQ]].map(([name, value, setter]) => (
                        <label key={String(name)} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-black text-slate-700"><span>{name}</span><output>{Number(value)}</output></div>
                            <input type="range" min={20} max={120} step={5} value={Number(value)} onChange={(event) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(event.target.value))} className="w-full accent-sky-600" />
                        </label>
                    ))}
                </div>
            )}
            {mode === 'venturi' && (
                <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>Flow</span><output>{flowRate}</output></div>
                        <input type="range" min={40} max={180} step={5} value={flowRate} onChange={(event) => setFlowRate(Number(event.target.value))} className="w-full accent-sky-600" />
                    </label>
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>A2/A1</span><output>{constriction.toFixed(2)}</output></div>
                        <input type="range" min={0.25} max={0.95} step={0.05} value={constriction} onChange={(event) => setConstriction(Number(event.target.value))} className="w-full accent-red-600" />
                    </label>
                    <button onClick={() => setElevated((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${elevated ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-600'}`}>{elevated ? 'Elevated on' : 'Elevated off'}</button>
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>dh</span><output>{heightDelta} m</output></div>
                        <input type="range" min={0} max={8} step={1} value={heightDelta} onChange={(event) => setHeightDelta(Number(event.target.value))} className="w-full accent-violet-600" />
                    </label>
                </div>
            )}
            {mode === 'torricelli' && (
                <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>Hole</span><output>{holeLevel}%</output></div>
                        <input type="range" min={10} max={85} step={1} value={holeLevel} onChange={(event) => setHoleLevel(Number(event.target.value))} className="w-full accent-sky-600" />
                    </label>
                    <button onClick={() => setPressurized((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${pressurized ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600'}`}>{pressurized ? 'Pressurized' : 'Open tank'}</button>
                    <label className="col-span-2 space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>Pressure</span><output>{(tankPressure / 1000).toFixed(0)} kPa</output></div>
                        <input type="range" min={101300} max={300000} step={5000} value={tankPressure} onChange={(event) => setTankPressure(Number(event.target.value))} className="w-full accent-amber-600" />
                    </label>
                </div>
            )}
            {mode === 'lift' && (
                <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5"><div className="flex justify-between text-xs font-black text-slate-700"><span>v top</span><output>{vTop}</output></div><input type="range" min={40} max={100} step={1} value={vTop} onChange={(event) => setVTop(Number(event.target.value))} className="w-full accent-red-600" /></label>
                    <label className="space-y-1.5"><div className="flex justify-between text-xs font-black text-slate-700"><span>v bottom</span><output>{vBottom}</output></div><input type="range" min={30} max={95} step={1} value={vBottom} onChange={(event) => setVBottom(Number(event.target.value))} className="w-full accent-sky-600" /></label>
                    <label className="space-y-1.5"><div className="flex justify-between text-xs font-black text-slate-700"><span>Area</span><output>{wingArea.toFixed(1)}</output></div><input type="range" min={0.5} max={5} step={0.1} value={wingArea} onChange={(event) => setWingArea(Number(event.target.value))} className="w-full accent-emerald-600" /></label>
                    <label className="space-y-1.5"><div className="flex justify-between text-xs font-black text-slate-700"><span>Spin</span><output>{spin}</output></div><input type="range" min={-2} max={2} step={1} value={spin} onChange={(event) => setSpin(Number(event.target.value))} className="w-full accent-amber-600" /></label>
                </div>
            )}
            {mode === 'atomizer' && (
                <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5"><div className="flex justify-between text-xs font-black text-slate-700"><span>Jet</span><output>{jetVelocity}</output></div><input type="range" min={10} max={100} step={1} value={jetVelocity} onChange={(event) => setJetVelocity(Number(event.target.value))} className="w-full accent-sky-600" /></label>
                    <label className="space-y-1.5"><div className="flex justify-between text-xs font-black text-slate-700"><span>rho</span><output>{liquidDensity}</output></div><input type="range" min={700} max={1400} step={50} value={liquidDensity} onChange={(event) => setLiquidDensity(Number(event.target.value))} className="w-full accent-emerald-600" /></label>
                </div>
            )}
            {mode === 'turbulent' && (
                <label className="space-y-1.5">
                    <div className="flex justify-between text-xs font-black text-slate-700"><span>Flow speed</span><output>{flowSpeed}</output></div>
                    <input type="range" min={5} max={110} step={1} value={flowSpeed} onChange={(event) => setFlowSpeed(Number(event.target.value))} className="w-full accent-red-600" />
                </label>
            )}
            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setShowParticles((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showParticles ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-500'}`}>{showParticles ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} Part</button>
                <button onClick={() => setShowStreamlines((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showStreamlines ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-500'}`}><Activity size={15} className="mx-auto" /> Lines</button>
                <button onClick={() => setShowPressure((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showPressure ? 'border-red-300 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-500'}`}><Zap size={15} className="mx-auto" /> P</button>
                <button onClick={() => setShowEquations((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showEquations ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-500'}`}><Circle size={15} className="mx-auto" /> Eq</button>
            </div>
            <label className="space-y-1.5">
                <div className="flex justify-between text-xs font-black text-slate-700"><span>Speed</span><output>{speed.toFixed(1)}x</output></div>
                <input type="range" min={0.3} max={2} step={0.1} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="w-full accent-slate-600" />
            </label>
        </div>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button onClick={() => setPaused((value) => !value)} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50" title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controls}
            controlsAreaFlex="0 0 240px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default FluidDynamicsLab;
