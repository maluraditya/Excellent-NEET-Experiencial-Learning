import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, FlaskConical, Pause, Play, RotateCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface ElectrochemistryLabProps {
    topic: Topic;
    onExit: () => void;
}

type CellMode = 'galvanic' | 'equilibrium' | 'electrolytic';
type TransferKind = 'zn-out' | 'cu-in' | 'zn-in' | 'cu-out';

interface TransferParticle {
    kind: TransferKind;
    life: number;
    maxLife: number;
    seed: number;
}

interface FlashParticle {
    x: number;
    y: number;
    color: string;
    life: number;
    maxLife: number;
}

const W = 1280;
const H = 760;
const CELL_POTENTIAL = 1.10;
const CU_POTENTIAL = 0.34;
const ZN_POTENTIAL = -0.76;
const LEFT_X = 330;
const RIGHT_X = 950;
const BEAKER_Y = 205;
const BEAKER_W = 280;
const BEAKER_H = 445;
const LIQUID_Y = 300;

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function getMode(externalVoltage: number): CellMode {
    if (Math.abs(externalVoltage - CELL_POTENTIAL) < 0.02) return 'equilibrium';
    return externalVoltage > CELL_POTENTIAL + 0.005 ? 'electrolytic' : 'galvanic';
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

function labelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size = 14, weight = 800, color = '#0f172a', align: CanvasTextAlign = 'center') {
    ctx.font = `${weight} ${size}px sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, size = 10) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * Math.cos(angle - Math.PI / 6), y - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x - size * Math.cos(angle + Math.PI / 6), y - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

function pointOnPolyline(points: Array<[number, number]>, t: number) {
    const segments: Array<{ a: [number, number]; b: [number, number]; length: number }> = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i];
        const b = points[i + 1];
        const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        segments.push({ a, b, length });
        total += length;
    }
    let distance = clamp(t, 0, 1) * total;
    for (const segment of segments) {
        if (distance <= segment.length) {
            const p = segment.length === 0 ? 0 : distance / segment.length;
            return {
                x: lerp(segment.a[0], segment.b[0], p),
                y: lerp(segment.a[1], segment.b[1], p),
                angle: Math.atan2(segment.b[1] - segment.a[1], segment.b[0] - segment.a[0])
            };
        }
        distance -= segment.length;
    }
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    return { x: last[0], y: last[1], angle: Math.atan2(last[1] - prev[1], last[0] - prev[0]) };
}

function drawBackground(ctx: CanvasRenderingContext2D) {
    const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.7);
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

function drawBeaker(ctx: CanvasRenderingContext2D, cx: number, label: string, solutionNote: string, liquid: 'zinc' | 'copper', surfaceY: number, showLabels: boolean) {
    const x = cx - BEAKER_W / 2;
    roundRect(ctx, x, BEAKER_Y, BEAKER_W, BEAKER_H, 18);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.save();
    roundRect(ctx, x + 4, surfaceY, BEAKER_W - 8, BEAKER_Y + BEAKER_H - surfaceY - 5, 14);
    ctx.clip();
    const g = ctx.createLinearGradient(0, surfaceY, 0, BEAKER_Y + BEAKER_H);
    if (liquid === 'zinc') {
        g.addColorStop(0, 'rgba(241,245,249,0.5)');
        g.addColorStop(1, 'rgba(226,232,240,0.85)');
    } else {
        g.addColorStop(0, 'rgba(186,230,253,0.7)');
        g.addColorStop(1, 'rgba(14,116,144,0.95)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(x + 4, surfaceY, BEAKER_W - 8, BEAKER_Y + BEAKER_H - surfaceY);
    ctx.restore();

    ctx.fillStyle = liquid === 'zinc' ? 'rgba(255,255,255,0.72)' : 'rgba(219,234,254,0.45)';
    ctx.beginPath();
    ctx.ellipse(cx, surfaceY, BEAKER_W / 2 - 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = liquid === 'zinc' ? 'rgba(148,163,184,0.35)' : 'rgba(14,116,144,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (showLabels) {
        labelText(ctx, label, cx, BEAKER_Y + BEAKER_H - 96, 18, 900, liquid === 'zinc' ? '#334155' : '#e0f2fe');
        labelText(ctx, solutionNote, cx, BEAKER_Y + BEAKER_H - 68, 11, 800, liquid === 'zinc' ? '#64748b' : '#bae6fd');
    }
}

function drawElectrode(ctx: CanvasRenderingContext2D, cx: number, top: number, height: number, thickness: number, metal: 'Zn' | 'Cu', showLabels: boolean) {
    const grad = ctx.createLinearGradient(cx - thickness / 2, 0, cx + thickness / 2, 0);
    if (metal === 'Zn') {
        grad.addColorStop(0, '#475569');
        grad.addColorStop(0.52, '#94a3b8');
        grad.addColorStop(1, '#475569');
    } else {
        grad.addColorStop(0, '#78350f');
        grad.addColorStop(0.52, '#f97316');
        grad.addColorStop(1, '#b45309');
    }
    ctx.save();
    ctx.shadowColor = 'rgba(15,23,42,0.2)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
    roundRect(ctx, cx - thickness / 2, top, thickness, height, 6);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
    if (showLabels) {
        labelText(ctx, metal, cx, top + 28, 18, 900, metal === 'Zn' ? '#e2e8f0' : '#fff7ed');
    }
}

function drawSaltBridge(ctx: CanvasRenderingContext2D, time: number, mode: CellMode, showIons: boolean, active: boolean, showLabels: boolean) {
    const points: Array<[number, number]> = [[470, 386], [470, 176], [810, 176], [810, 386]];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(point => ctx.lineTo(point[0], point[1]));
    ctx.strokeStyle = 'rgba(254,240,138,0.35)';
    ctx.lineWidth = 38;
    ctx.stroke();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 26;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    [[470, 386], [810, 386]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });
    if (showLabels) {
        labelText(ctx, 'Salt bridge (KCl in agar gel)', 640, 202, 14, 900, '#854d0e');
        labelText(ctx, 'cotton plugs', 640, 418, 11, 800, '#92400e');
    }

    if (showIons && active) {
        const cathodeRight = mode === 'galvanic';
        for (let i = 0; i < 16; i += 1) {
            const cation = i % 2 === 0;
            const base = (time * 0.12 + i / 16) % 1;
            const targetRight = cation ? cathodeRight : !cathodeRight;
            const p = targetRight ? base : 1 - base;
            const point = pointOnPolyline(points, p);
            const y = point.y + Math.sin(time * 5 + i) * 5;
            ctx.save();
            ctx.shadowColor = cation ? '#ef4444' : '#2563eb';
            ctx.shadowBlur = 10;
            ctx.fillStyle = cation ? '#ef4444' : '#2563eb';
            ctx.beginPath();
            ctx.arc(point.x, y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            labelText(ctx, cation ? '+' : '-', point.x, y + 0.5, 11, 900, '#ffffff');
        }
        if (showLabels) {
            labelText(ctx, mode === 'galvanic' ? 'K+ -> cathode, Cl- -> anode' : 'ion directions reverse', 640, 446, 12, 800, '#475569');
        }
    }
    ctx.restore();
}

function drawWireAndMeter(ctx: CanvasRenderingContext2D, time: number, mode: CellMode, externalVoltage: number, netVoltage: number, circuitClosed: boolean, active: boolean, showElectrons: boolean, needleRef: React.MutableRefObject<number>) {
    const wire: Array<[number, number]> = [[LEFT_X, 192], [LEFT_X, 76], [512, 76], [560, 76], [720, 76], [RIGHT_X, 76], [RIGHT_X, 192]];
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(wire[0][0], wire[0][1]);
    wire.slice(1).forEach(point => ctx.lineTo(point[0], point[1]));
    ctx.stroke();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    const stateColor = mode === 'galvanic' ? '#16a34a' : mode === 'electrolytic' ? '#dc2626' : '#64748b';
    if (externalVoltage <= 0.005) {
        const targetNeedle = mode === 'galvanic' ? -Math.PI / 4 : mode === 'electrolytic' ? Math.PI / 4 : 0;
        needleRef.current += (targetNeedle - needleRef.current) * 0.12;
        ctx.save();
        ctx.shadowColor = 'rgba(15,23,42,0.2)';
        ctx.shadowBlur = 22;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(640, 76, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 5;
        ctx.stroke();
        labelText(ctx, 'V', 640, 71, 22, 900, '#0f172a');
        ctx.strokeStyle = stateColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(640, 88);
        ctx.lineTo(640 + Math.sin(needleRef.current) * 28, 88 - Math.cos(needleRef.current) * 28);
        ctx.stroke();
        labelText(ctx, `E = ${Math.abs(netVoltage).toFixed(2)} V`, 640, 130, 13, 900, stateColor);
        ctx.restore();
    } else {
        ctx.save();
        ctx.shadowColor = 'rgba(15,23,42,0.18)';
        ctx.shadowBlur = 22;
        roundRect(ctx, 548, 28, 184, 76, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = stateColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        labelText(ctx, 'External source', 640, 48, 13, 900, '#334155');
        labelText(ctx, `E_ext = ${externalVoltage.toFixed(2)} V`, 640, 74, 18, 900, stateColor);
        labelText(ctx, mode === 'electrolytic' ? '+ Cu side / - Zn side' : '+ Zn side / - Cu side', 640, 94, 10, 900, '#64748b');
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        roundRect(ctx, 586, 58, 22, 20, 4);
        ctx.stroke();
        ctx.fillStyle = stateColor;
        ctx.fillRect(608, 64, 4, 8);
        ctx.restore();
    }

    ctx.save();
    const switchX = 784;
    const switchY = 76;
    ctx.strokeStyle = circuitClosed ? '#16a34a' : '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(switchX - 16, switchY, 5, 0, Math.PI * 2);
    ctx.arc(switchX + 18, switchY, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(switchX - 12, switchY - 1);
    ctx.lineTo(circuitClosed ? switchX + 14 : switchX + 10, circuitClosed ? switchY - 1 : switchY - 22);
    ctx.stroke();
    ctx.restore();

    if (mode === 'galvanic' && circuitClosed) {
        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 16 + Math.sin(time * 4) * 12;
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(510, 126, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.stroke();
        labelText(ctx, 'bulb/load', 510, 158, 11, 900, '#92400e');
        ctx.restore();
    }

    if (active && showElectrons) {
        const electronDirection = mode === 'galvanic' ? 1 : -1;
        for (let i = 0; i < 12; i += 1) {
            const base = (time * 0.22 * Math.max(0.5, Math.abs(netVoltage)) + i / 12) % 1;
            const p = electronDirection === 1 ? base : 1 - base;
            const pos = pointOnPolyline(wire, p);
            const wiggle = Math.sin(time * 8 + i) * 2;
            const x = pos.x - Math.sin(pos.angle) * wiggle;
            const y = pos.y + Math.cos(pos.angle) * wiggle;
            ctx.save();
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 14;
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            labelText(ctx, 'e-', x, y + 0.5, 9, 900, '#78350f');
        }
    }

    if (active) {
        const currentRight = mode !== 'galvanic';
        const arrowColor = currentRight ? '#dc2626' : '#16a34a';
        for (let i = 0; i < 6; i += 1) {
            const x = 520 + i * 54 + ((time * 60) % 18);
            const y = 226;
            const angle = currentRight ? 0 : Math.PI;
            ctx.save();
            ctx.globalAlpha = 0.72;
            drawArrowHead(ctx, currentRight ? x : x + 14, y, angle, arrowColor, 12);
            ctx.restore();
        }
        labelText(ctx, currentRight ? 'I ->' : '<- I', 640, 230, 13, 900, arrowColor);
    }
}

function drawTransferParticles(ctx: CanvasRenderingContext2D, particles: TransferParticle[], flashes: FlashParticle[], showIons: boolean) {
    if (!showIons) return;
    particles.forEach(particle => {
        const p = clamp(particle.life / particle.maxLife, 0, 1);
        const s = particle.seed;
        let x = 0;
        let y = 0;
        let alpha = 1;
        let label = '';
        let fill = '';
        if (particle.kind === 'zn-out') {
            x = lerp(LEFT_X + Math.sin(s * 8) * 12, LEFT_X + Math.cos(s * 7) * 72, p);
            y = lerp(350 + Math.sin(s * 5) * 80, 470 + Math.cos(s * 9) * 54, p);
            alpha = 1 - p * 0.75;
            label = 'Zn²⁺';
            fill = '#94a3b8';
        } else if (particle.kind === 'zn-in') {
            x = lerp(LEFT_X + Math.cos(s * 7) * 72, LEFT_X + Math.sin(s * 8) * 12, p);
            y = lerp(470 + Math.cos(s * 9) * 54, 350 + Math.sin(s * 5) * 80, p);
            alpha = 1 - p * 0.55;
            label = 'Zn²⁺';
            fill = '#94a3b8';
        } else if (particle.kind === 'cu-in') {
            x = lerp(RIGHT_X + Math.cos(s * 7) * 76, RIGHT_X + Math.sin(s * 8) * 12, p);
            y = lerp(475 + Math.sin(s * 9) * 52, 350 + Math.cos(s * 6) * 82, p);
            alpha = 1 - p * 0.7;
            label = 'Cu²⁺';
            fill = '#0284c7';
        } else {
            x = lerp(RIGHT_X + Math.sin(s * 8) * 12, RIGHT_X + Math.cos(s * 7) * 76, p);
            y = lerp(350 + Math.cos(s * 6) * 82, 475 + Math.sin(s * 9) * 52, p);
            alpha = 1 - p * 0.55;
            label = 'Cu²⁺';
            fill = '#0284c7';
        }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = fill;
        ctx.shadowBlur = 12;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(x, y - Math.sin(p * Math.PI) * 18, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        labelText(ctx, label, x, y - Math.sin(p * Math.PI) * 18 + 0.5, 8, 900, '#ffffff');
    });

    flashes.forEach(flash => {
        const p = clamp(flash.life / flash.maxLife, 0, 1);
        const radius = 24 * (1 - p);
        const g = ctx.createRadialGradient(flash.x, flash.y, 1, flash.x, flash.y, radius);
        g.addColorStop(0, `rgba(255,255,255,${p})`);
        g.addColorStop(1, flash.color);
        ctx.save();
        ctx.globalAlpha = p;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawRoleBadges(ctx: CanvasRenderingContext2D, mode: CellMode) {
    const galvanic = mode !== 'electrolytic';
    const left = galvanic
        ? { text: 'ANODE  Oxidation', fill: '#fee2e2', stroke: '#fca5a5', color: '#991b1b' }
        : { text: 'CATHODE  Reduction', fill: '#dcfce7', stroke: '#86efac', color: '#166534' };
    const right = galvanic
        ? { text: 'CATHODE  Reduction', fill: '#dcfce7', stroke: '#86efac', color: '#166534' }
        : { text: 'ANODE  Oxidation', fill: '#fee2e2', stroke: '#fca5a5', color: '#991b1b' };

    [
        { x: LEFT_X, ...left },
        { x: RIGHT_X, ...right }
    ].forEach(badge => {
        ctx.save();
        roundRect(ctx, badge.x - 118, 666, 236, 34, 17);
        ctx.fillStyle = badge.fill;
        ctx.fill();
        ctx.strokeStyle = badge.stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        labelText(ctx, badge.text, badge.x, 684, 13, 900, badge.color);
        ctx.restore();
    });
}

const ElectrochemistryLab: React.FC<ElectrochemistryLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const timeRef = useRef(0);
    const lastRef = useRef<number | null>(null);
    const massRef = useRef({ zn: 50, cu: 50 });
    const smoothMassRef = useRef({ zn: 50, cu: 50 });
    const needleRef = useRef(0);
    const spawnRef = useRef(0);
    const transfersRef = useRef<TransferParticle[]>([]);
    const flashesRef = useRef<FlashParticle[]>([]);

    const [externalVoltage, setExternalVoltage] = useState(0);
    const [circuitClosed, setCircuitClosed] = useState(true);
    const [showElectrons, setShowElectrons] = useState(true);
    const [showIons, setShowIons] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [showSeries, setShowSeries] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [massSnapshot, setMassSnapshot] = useState({ zn: 50, cu: 50 });

    const voltageRef = useRef(externalVoltage);
    const switchRef = useRef(circuitClosed);
    const electronRef = useRef(showElectrons);
    const ionRef = useRef(showIons);
    const labelRef = useRef(showLabels);
    const seriesRef = useRef(showSeries);
    const playingRef = useRef(isPlaying);

    useEffect(() => { voltageRef.current = externalVoltage; }, [externalVoltage]);
    useEffect(() => { switchRef.current = circuitClosed; }, [circuitClosed]);
    useEffect(() => { electronRef.current = showElectrons; }, [showElectrons]);
    useEffect(() => { ionRef.current = showIons; }, [showIons]);
    useEffect(() => { labelRef.current = showLabels; }, [showLabels]);
    useEffect(() => { seriesRef.current = showSeries; }, [showSeries]);
    useEffect(() => { playingRef.current = isPlaying; }, [isPlaying]);

    const mode = useMemo(() => getMode(externalVoltage), [externalVoltage]);

    const handleReset = useCallback(() => {
        setExternalVoltage(0);
        setCircuitClosed(true);
        setIsPlaying(true);
        massRef.current = { zn: 50, cu: 50 };
        smoothMassRef.current = { zn: 50, cu: 50 };
        setMassSnapshot({ zn: 50, cu: 50 });
        timeRef.current = 0;
        lastRef.current = null;
        spawnRef.current = 0;
        transfersRef.current = [];
        flashesRef.current = [];
        needleRef.current = 0;
    }, []);

    const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * W;
        const y = ((event.clientY - rect.top) / rect.height) * H;
        if (x >= 712 && x <= 786 && y >= 92 && y <= 164) {
            setCircuitClosed(value => !value);
        }
    }, []);

    useEffect(() => {
        let snapshotTimer = 0;
        const draw = (now: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;

            const last = lastRef.current ?? now;
            const dt = Math.min((now - last) / 1000, 0.1);
            lastRef.current = now;

            const external = voltageRef.current;
            const currentMode = getMode(external);
            const net = CELL_POTENTIAL - external;
            const active = playingRef.current && switchRef.current && currentMode !== 'equilibrium';
            const speed = playingRef.current ? 1 : 0;
            timeRef.current += dt * speed;
            const time = timeRef.current;

            if (active) {
                const rate = Math.abs(net) * 0.5;
                if (currentMode === 'galvanic') {
                    massRef.current.zn = clamp(massRef.current.zn - rate * dt, 35, 65);
                    massRef.current.cu = clamp(massRef.current.cu + rate * dt, 35, 65);
                } else {
                    massRef.current.zn = clamp(massRef.current.zn + rate * dt, 35, 65);
                    massRef.current.cu = clamp(massRef.current.cu - rate * dt, 35, 65);
                }
                spawnRef.current += dt * Math.max(0.45, Math.abs(net) * 2.2);
                while (spawnRef.current >= 0.14) {
                    spawnRef.current -= 0.14;
                    const seed = Math.random();
                    transfersRef.current.push({
                        kind: currentMode === 'galvanic' ? 'zn-out' : 'zn-in',
                        life: 0,
                        maxLife: 1.25,
                        seed
                    });
                    transfersRef.current.push({
                        kind: currentMode === 'galvanic' ? 'cu-in' : 'cu-out',
                        life: 0,
                        maxLife: 1.25,
                        seed: Math.random()
                    });
                }
            }

            transfersRef.current.forEach(particle => {
                particle.life += dt;
                if (particle.life >= particle.maxLife) {
                    if (particle.kind === 'cu-in') flashesRef.current.push({ x: RIGHT_X, y: 352, color: 'rgba(249,115,22,0.9)', life: 0.35, maxLife: 0.35 });
                    if (particle.kind === 'zn-in') flashesRef.current.push({ x: LEFT_X,  y: 352, color: 'rgba(148,163,184,0.9)', life: 0.35, maxLife: 0.35 });
                }
            });
            transfersRef.current = transfersRef.current.filter(particle => particle.life < particle.maxLife);
            flashesRef.current.forEach(flash => { flash.life -= dt; });
            flashesRef.current = flashesRef.current.filter(flash => flash.life > 0);

            smoothMassRef.current.zn += (massRef.current.zn - smoothMassRef.current.zn) * Math.min(1, dt * 6);
            smoothMassRef.current.cu += (massRef.current.cu - smoothMassRef.current.cu) * Math.min(1, dt * 6);

            snapshotTimer += dt;
            if (snapshotTimer > 0.25) {
                snapshotTimer = 0;
                setMassSnapshot({ ...smoothMassRef.current });
            }

            ctx.clearRect(0, 0, W, H);
            drawBackground(ctx);
            const bob = Math.sin(time * 0.6) * 4;
            drawBeaker(ctx, LEFT_X, 'ZnSO4(aq) 1 M', 'Solution containing salt of Zinc', 'zinc', LIQUID_Y + bob, labelRef.current);
            drawBeaker(ctx, RIGHT_X, 'CuSO4(aq) 1 M', 'Solution containing salt of Copper', 'copper', LIQUID_Y - bob, labelRef.current);

            const znThickness = clamp(20 + (smoothMassRef.current.zn - 50) * 0.3, 14, 34);
            const cuThickness = clamp(20 + (smoothMassRef.current.cu - 50) * 0.3, 14, 34);
            drawElectrode(ctx, LEFT_X, 170, 360, znThickness, 'Zn', labelRef.current);
            drawElectrode(ctx, RIGHT_X, 170, 360, cuThickness, 'Cu', labelRef.current);
            drawWireAndMeter(ctx, time, currentMode, external, net, switchRef.current, active, electronRef.current, needleRef);
            drawSaltBridge(ctx, time, currentMode, ionRef.current, active, labelRef.current);
            drawTransferParticles(ctx, transfersRef.current, flashesRef.current, ionRef.current);
            if (labelRef.current) {
                drawRoleBadges(ctx, currentMode);
            }

            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const netVoltage = CELL_POTENTIAL - externalVoltage;
    const modeChip = mode === 'galvanic' ? 'GALVANIC' : mode === 'equilibrium' ? 'EQUILIBRIUM' : 'ELECTROLYTIC';
    const currentValue = circuitClosed && mode !== 'equilibrium' ? netVoltage * 1.8 : 0;
    const hint = mode === 'galvanic'
        ? 'Zn dissolves, Cu deposits. ΔG° < 0, spontaneous.'
        : mode === 'equilibrium'
            ? 'I = 0. No reaction. (NCERT Fig. 2.2b)'
            : 'Reverse: Zn deposits, Cu dissolves. External work needed.';

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Eext vs E°cell</h3>
                    <p className="text-xs font-semibold text-slate-500">NCERT Fig. 2.2 regimes</p>
                    <svg viewBox="0 0 320 160" className="mt-2 h-[160px] w-full">
                        <rect x="20" y="48" width="280" height="32" rx="16" fill="#dcfce7" />
                        <rect x="158" y="48" width="8" height="32" fill="#e2e8f0" />
                        <rect x="166" y="48" width="134" height="32" rx="16" fill="#fee2e2" />
                        <line x1="160" y1="32" x2="160" y2="96" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 4" />
                        <text x="160" y="24" textAnchor="middle" fontSize="11" fontWeight="800" fill="#334155">E°cell 1.10 V</text>
                        <circle cx={20 + (externalVoltage / 2.2) * 280} cy="64" r="9" fill={mode === 'galvanic' ? '#16a34a' : mode === 'electrolytic' ? '#dc2626' : '#64748b'} />
                        <text x="20" y="110" fontSize="11" fontWeight="800" fill="#166534">Galvanic</text>
                        <text x="138" y="110" fontSize="11" fontWeight="800" fill="#475569">I = 0</text>
                        <text x="222" y="110" fontSize="11" fontWeight="800" fill="#991b1b">Electrolytic</text>
                        <text x="20" y="144" fontSize="12" fontWeight="900" fill="#0f172a">Eext = {externalVoltage.toFixed(2)} V</text>
                    </svg>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Electrode Mass</h3>
                    <p className="text-xs font-semibold text-slate-500">Rod masses start at 50.0 g</p>
                    <div className="mt-3 space-y-3">
                        {[
                            { label: 'Zn rod', value: massSnapshot.zn, color: '#475569' },
                            { label: 'Cu rod', value: massSnapshot.cu, color: '#f97316' }
                        ].map(row => (
                            <div key={row.label}>
                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                    <span>{row.label}</span>
                                    <span className="font-mono">{row.value.toFixed(1)} g</span>
                                </div>
                                <div className="mt-1 h-3 rounded-full bg-slate-100">
                                    <div
                                        className="h-3 rounded-full"
                                        style={{
                                            width: `${clamp((row.value - 35) / 30, 0, 1) * 100}%`,
                                            backgroundColor: row.color
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Ion Direction</h3>
                    <p className="text-xs font-semibold text-slate-500">Salt bridge maintains electrical neutrality</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
                        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-red-700">K⁺ → cathode</div>
                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-blue-700">Cl⁻ → anode</div>
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-snug text-slate-600">
                        In electrolytic mode both ion directions reverse because electrode roles reverse.
                    </p>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/95 p-4 shadow-xl backdrop-blur">
                    <h3 className="text-base font-extrabold text-cyan-950">Daniell Cell Theory</h3>
                    <p className="text-xs font-semibold text-cyan-700">NCERT Class 12 Chemistry, Unit 2, Sec. 2.1-2.2.1</p>
                    <ul className="mt-3 space-y-2 text-sm font-semibold leading-snug text-cyan-950">
                        <li>Zn(s) | Zn²⁺(aq, 1 M) ‖ Cu²⁺(aq, 1 M) | Cu(s)</li>
                        <li>Galvanic cell converts chemical energy of a spontaneous redox reaction into electrical energy.</li>
                        <li>Electrolytic cell uses external electrical energy for a non-spontaneous reaction.</li>
                        <li>E°cell = E°cathode - E°anode = 0.34 - (-0.76) = +1.10 V.</li>
                        <li>SHE: Pt(s)|H₂(g, 1 bar)|H⁺(aq, 1 M), E° = 0.00 V.</li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">LIVE</span>
                    </div>
                    <div className="mt-3 grid gap-2">
                        {[
                            { label: 'Mode', value: modeChip, tone: 'bg-slate-50 text-slate-900' },
                            { label: 'Eext', value: `${externalVoltage.toFixed(2)} V`, tone: 'bg-cyan-50 text-cyan-800' },
                            { label: 'Net Ecell - Eext', value: `${netVoltage >= 0 ? '+' : ''}${netVoltage.toFixed(2)} V`, tone: netVoltage >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800' },
                            { label: 'Current I', value: `~${currentValue.toFixed(1)} A`, tone: currentValue >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800' },
                            { label: 'Zn rod mass', value: `${massSnapshot.zn.toFixed(1)} g`, tone: 'bg-slate-50 text-slate-800' },
                            { label: 'Cu rod mass', value: `${massSnapshot.cu.toFixed(1)} g`, tone: 'bg-amber-50 text-amber-800' }
                        ].map(row => (
                            <div key={row.label} className={`rounded-lg border border-slate-100 px-3 py-2.5 ${row.tone}`}>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                                <div className="mt-1 font-mono text-base font-extrabold">{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl">
                    <h3 className="text-base font-extrabold text-amber-950">Mode Hint</h3>
                    <p className="mt-2 text-sm font-semibold leading-snug text-amber-950">{hint}</p>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    onClick={handleCanvasClick}
                    className="absolute inset-0 h-full w-full cursor-pointer touch-none"
                    aria-label="Daniell cell galvanic and electrolytic simulation"
                />

                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        onClick={() => setIsPlaying(value => !value)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                        onClick={handleReset}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title="Reset"
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const presetButtonClass = (active: boolean, tone: 'emerald' | 'slate' | 'red') => {
        const activeClass = tone === 'emerald'
            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
            : tone === 'red'
                ? 'border-red-500 bg-red-50 text-red-800 shadow-sm'
                : 'border-slate-500 bg-slate-100 text-slate-900 shadow-sm';
        return `min-h-[40px] rounded-xl border px-3 text-xs font-black transition ${active ? activeClass : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`;
    };

    const toggleButtonClass = (active: boolean, tone: 'emerald' | 'amber' | 'blue' | 'slate' | 'orange') => {
        const activeClass = {
            emerald: 'border-emerald-300 bg-emerald-50 text-emerald-800',
            amber: 'border-amber-300 bg-amber-50 text-amber-800',
            blue: 'border-blue-300 bg-blue-50 text-blue-800',
            slate: 'border-slate-300 bg-slate-50 text-slate-800',
            orange: 'border-orange-300 bg-orange-50 text-orange-800'
        }[tone];
        return `flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-black transition ${active ? activeClass : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`;
    };

    const controlsCombo = (
        <div className="grid h-full w-full grid-rows-[auto_1fr] gap-3 text-slate-800">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700">
                        <FlaskConical size={17} />
                    </div>
                    <div className="min-w-0">
                        <div className="font-display text-base font-bold leading-tight text-slate-900">Daniell Cell Bench</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Voltage, circuit, and visibility</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest ${mode === 'galvanic' ? 'bg-emerald-100 text-emerald-700' : mode === 'electrolytic' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                        {modeChip}
                    </span>
                </div>
            </div>

            <div className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-[1.15fr_0.85fr]">
                <section className="flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                        <label htmlFor="external-voltage" className="text-xs font-black uppercase tracking-widest text-slate-500">External opposing voltage</label>
                        <output htmlFor="external-voltage" className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-black text-slate-800">{externalVoltage.toFixed(2)} V</output>
                    </div>
                    <input
                            id="external-voltage"
                            type="range"
                            min={0}
                            max={2.2}
                            step={0.01}
                            value={externalVoltage}
                            onChange={event => setExternalVoltage(Number(event.target.value))}
                            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full accent-red-600"
                            style={{ background: 'linear-gradient(90deg,#10b981 0%,#10b981 49%,#94a3b8 49%,#94a3b8 51%,#ef4444 51%,#ef4444 100%)' }}
                        />
                    <div className="mt-1 grid grid-cols-5 text-center text-[10px] font-bold text-slate-500">
                        {[0, 0.55, 1.1, 1.65, 2.2].map(value => <span key={value}>{value.toFixed(2)}</span>)}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                        <button onClick={() => setExternalVoltage(0)} className={presetButtonClass(mode === 'galvanic' && externalVoltage < 0.02, 'emerald')}>Eext &lt; 1.1</button>
                        <button onClick={() => setExternalVoltage(1.1)} className={presetButtonClass(mode === 'equilibrium', 'slate')}>Eext = 1.1</button>
                        <button onClick={() => setExternalVoltage(2)} className={presetButtonClass(mode === 'electrolytic' && externalVoltage > 1.9, 'red')}>Eext &gt; 1.1</button>
                    </div>

                </section>

                <section className="flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Display toggles</div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <button onClick={() => setCircuitClosed(value => !value)} className={toggleButtonClass(circuitClosed, 'emerald')}>
                            <Zap size={14} /> Switch {circuitClosed ? 'ON' : 'OFF'}
                        </button>
                        <button onClick={() => setShowElectrons(value => !value)} className={toggleButtonClass(showElectrons, 'amber')}>
                            {showElectrons ? <Eye size={14} /> : <EyeOff size={14} />} Electrons
                        </button>
                        <button onClick={() => setShowIons(value => !value)} className={toggleButtonClass(showIons, 'blue')}>
                            Ions
                        </button>
                        <button onClick={() => setShowLabels(value => !value)} className={toggleButtonClass(showLabels, 'slate')}>
                            Labels
                        </button>
                        <button onClick={() => setShowSeries(value => !value)} className={`${toggleButtonClass(showSeries, 'orange')} col-span-2`}>
                            E° series
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
            controlsAreaFlex="0 0 240px"
        />
    );
};

export default ElectrochemistryLab;
