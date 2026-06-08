import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Beaker,
    Eye,
    EyeOff,
    FlaskConical,
    Pause,
    Play,
    RotateCcw,
    Shuffle,
    Thermometer,
    TrendingUp,
    Zap
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface CollisionTheoryLabProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'chamber' | 'profile' | 'orientation' | 'catalyst';
type MoleculeKind = 'H2' | 'I2' | 'HI';

interface Particle {
    id: number;
    kind: MoleculeKind;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    angle: number;
    angularVelocity: number;
    energy: number;
}

interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
}

interface Flash {
    x: number;
    y: number;
    life: number;
    maxLife: number;
    label: string;
}

interface HistoryPoint {
    temperature: number;
    activationEnergy: number;
    lnK: number;
    invT: number;
}

const W = 1280;
const H = 760;
const R = 8.314;
const CHAMBER = { x: 100, y: 120, w: 1080, h: 560 };
const BASE_A = 1.2e10;

const MODES: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
    { id: 'chamber', label: 'Chamber', icon: <Beaker size={15} /> },
    { id: 'profile', label: 'Energy Profile', icon: <TrendingUp size={15} /> },
    { id: 'orientation', label: 'Orientation', icon: <Shuffle size={15} /> },
    { id: 'catalyst', label: 'Catalyst', icon: <Zap size={15} /> }
];

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function arrheniusFraction(eaKj: number, temperature: number) {
    return Math.exp(-(eaKj * 1000) / (R * temperature));
}

function rateConstant(temperature: number, eaKj: number, stericFactor: number, catalystOn: boolean) {
    const effectiveEa = catalystOn ? eaKj * 0.58 : eaKj;
    return BASE_A * stericFactor * arrheniusFraction(effectiveEa, temperature);
}

function formatSci(value: number, digits = 2) {
    if (!Number.isFinite(value) || value <= 0) return '0';
    const exponent = Math.floor(Math.log10(value));
    const mantissa = value / Math.pow(10, exponent);
    return `${mantissa.toFixed(digits)} x 10^${exponent}`;
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

function drawBackground(ctx: CanvasRenderingContext2D) {
    const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 580);
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

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    if (dashed) ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(angle - Math.PI / 6), y2 - 10 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 10 * Math.cos(angle + Math.PI / 6), y2 - 10 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawAtom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke: string, text: string, textColor = '#0f172a') {
    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, fill);
    ctx.fillStyle = grad;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y + 0.5, Math.max(10, r * 0.75), 900, textColor);
}

function drawMolecule(ctx: CanvasRenderingContext2D, particle: Particle, showLabels: boolean) {
    const high = particle.energy >= 120;
    const near = particle.energy >= 72;
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.angle);
    if (high || near) {
        ctx.shadowBlur = high ? 18 : 12;
        ctx.shadowColor = high ? '#f97316' : '#fbbf24';
    }

    if (particle.kind === 'H2') {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-11, 0);
        ctx.lineTo(11, 0);
        ctx.stroke();
        drawAtom(ctx, -13, 0, 12, '#cbd5e1', '#475569', showLabels ? 'H' : '', '#334155');
        drawAtom(ctx, 13, 0, 12, '#e2e8f0', '#64748b', showLabels ? 'H' : '', '#334155');
    } else if (particle.kind === 'I2') {
        ctx.strokeStyle = '#6d28d9';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);
        ctx.stroke();
        drawAtom(ctx, -15, 0, 14, '#c4b5fd', '#5b21b6', showLabels ? 'I' : '', '#3b0764');
        drawAtom(ctx, 15, 0, 14, '#a78bfa', '#5b21b6', showLabels ? 'I' : '', '#3b0764');
    } else {
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
        drawAtom(ctx, -12, 0, 12, '#e2e8f0', '#64748b', showLabels ? 'H' : '', '#334155');
        drawAtom(ctx, 15, 0, 14, '#fdba74', '#92400e', showLabels ? 'I' : '', '#7c2d12');
    }
    ctx.restore();
}

function createParticles(temperature: number) {
    const particles: Particle[] = [];
    const kinds: MoleculeKind[] = [...Array(16).fill('H2'), ...Array(16).fill('I2')] as MoleculeKind[];
    kinds.forEach((kind, index) => {
        const speed = (1.2 + Math.random() * 1.5) * Math.sqrt(temperature / 300);
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            id: index,
            kind,
            x: CHAMBER.x + 55 + Math.random() * (CHAMBER.w - 110),
            y: CHAMBER.y + 55 + Math.random() * (CHAMBER.h - 110),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: kind === 'H2' ? 18 : 21,
            angle: Math.random() * Math.PI * 2,
            angularVelocity: (Math.random() - 0.5) * 0.07,
            energy: 0
        });
    });
    return particles;
}

function drawProfileCurve(ctx: CanvasRenderingContext2D, peakY: number, color: string, width = 5, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    if (dashed) ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(210, 455);
    ctx.bezierCurveTo(370, 452, 420, peakY, 620, peakY);
    ctx.bezierCurveTo(790, peakY, 850, 505, 1070, 505);
    ctx.stroke();
    ctx.restore();
}

function energyPoint(time: number, enoughEnergy: boolean) {
    const p = (time * 0.14) % 1;
    const progress = enoughEnergy ? p : Math.abs(((p * 2) % 2) - 1) * 0.52;
    const x = lerp(210, 1070, progress);
    const base = lerp(455, 505, progress);
    const hill = Math.sin(progress * Math.PI) * 250;
    return { x, y: base - hill };
}

function mbPath(width: number, height: number, temperature: number, maxE: number) {
    const points: string[] = [];
    const values: number[] = [];
    for (let i = 0; i <= 100; i += 1) {
        const e = (i / 100) * maxE;
        values.push(Math.sqrt(Math.max(e, 0.001)) * Math.exp(-(e * 1000) / (R * temperature)));
    }
    const max = Math.max(...values);
    values.forEach((v, i) => {
        const x = (i / 100) * width;
        const y = height - (v / max) * (height - 16) - 4;
        points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    });
    return points.join(' ');
}

const CollisionTheoryLab: React.FC<CollisionTheoryLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const lastRef = useRef<number>();
    const timeRef = useRef(0);
    const particlesRef = useRef<Particle[]>([]);
    const sparksRef = useRef<Spark[]>([]);
    const flashesRef = useRef<Flash[]>([]);
    const historyRef = useRef<HistoryPoint[]>([]);

    const [mode, setMode] = useState<Mode>('chamber');
    const [temperature, setTemperature] = useState(310);
    const [activationEnergy, setActivationEnergy] = useState(75);
    const [stericFactor, setStericFactor] = useState(0.45);
    const [speed, setSpeed] = useState(1);
    const [catalystOn, setCatalystOn] = useState(false);
    const [showMB, setShowMB] = useState(true);
    const [showArrhenius, setShowArrhenius] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [paused, setPaused] = useState(false);
    const [reactionCount, setReactionCount] = useState(0);
    const [lastTenRise, setLastTenRise] = useState(false);

    const modeRef = useRef(mode);
    const temperatureRef = useRef(temperature);
    const activationEnergyRef = useRef(activationEnergy);
    const stericFactorRef = useRef(stericFactor);
    const speedRef = useRef(speed);
    const catalystOnRef = useRef(catalystOn);
    const showLabelsRef = useRef(showLabels);
    const pausedRef = useRef(paused);
    const reactionCountRef = useRef(reactionCount);
    const lastTempRef = useRef(temperature);

    const effectiveEa = catalystOn ? activationEnergy * 0.58 : activationEnergy;
    const fraction = arrheniusFraction(effectiveEa, temperature);
    const k = rateConstant(temperature, activationEnergy, stericFactor, catalystOn);
    const lnK = Math.log(Math.max(k, 1e-30));

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { activationEnergyRef.current = activationEnergy; }, [activationEnergy]);
    useEffect(() => { stericFactorRef.current = stericFactor; }, [stericFactor]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { catalystOnRef.current = catalystOn; }, [catalystOn]);
    useEffect(() => { showLabelsRef.current = showLabels; }, [showLabels]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { reactionCountRef.current = reactionCount; }, [reactionCount]);

    useEffect(() => {
        const factor = Math.sqrt(temperature / temperatureRef.current);
        particlesRef.current.forEach((particle) => {
            particle.vx *= factor;
            particle.vy *= factor;
        });
        const delta = temperature - lastTempRef.current;
        setLastTenRise(Math.abs(delta - 10) <= 1.5);
        lastTempRef.current = temperature;
        temperatureRef.current = temperature;
        historyRef.current = [
            ...historyRef.current.slice(-3),
            {
                temperature,
                activationEnergy,
                lnK: Math.log(Math.max(rateConstant(temperature, activationEnergy, stericFactor, catalystOn), 1e-30)),
                invT: 1 / temperature
            }
        ];
    }, [activationEnergy, catalystOn, stericFactor, temperature]);

    const resetSimulation = useCallback((resetControls = false) => {
        if (resetControls) {
            setMode('chamber');
            setTemperature(310);
            setActivationEnergy(75);
            setStericFactor(0.45);
            setSpeed(1);
            setCatalystOn(false);
            setShowMB(true);
            setShowArrhenius(true);
            setShowLabels(true);
        }
        particlesRef.current = createParticles(temperatureRef.current);
        sparksRef.current = [];
        flashesRef.current = [];
        reactionCountRef.current = 0;
        setReactionCount(0);
        timeRef.current = 0;
    }, []);

    useEffect(() => {
        particlesRef.current = createParticles(temperature);
        historyRef.current = [{
            temperature,
            activationEnergy,
            lnK: Math.log(Math.max(k, 1e-30)),
            invT: 1 / temperature
        }];
    }, []);

    const updateParticles = useCallback((dt: number) => {
        const particles = particlesRef.current;
        const temp = temperatureRef.current;
        const ea = catalystOnRef.current ? activationEnergyRef.current * 0.58 : activationEnergyRef.current;
        const pFactor = stericFactorRef.current;

        for (const particle of particles) {
            const thermalKick = 0.018 * Math.sqrt(temp / 300);
            particle.vx += (Math.random() - 0.5) * thermalKick * dt * 60;
            particle.vy += (Math.random() - 0.5) * thermalKick * dt * 60;
            const maxSpeed = 4.6 * Math.sqrt(temp / 300);
            const speedNow = Math.hypot(particle.vx, particle.vy);
            if (speedNow > maxSpeed) {
                particle.vx = (particle.vx / speedNow) * maxSpeed;
                particle.vy = (particle.vy / speedNow) * maxSpeed;
            }
            particle.x += particle.vx * dt * 60;
            particle.y += particle.vy * dt * 60;
            particle.angle += particle.angularVelocity * dt * 60;
            particle.energy = 0.5 * (particle.vx * particle.vx + particle.vy * particle.vy) * 18 * (temp / 300);

            const left = CHAMBER.x + particle.radius;
            const right = CHAMBER.x + CHAMBER.w - particle.radius;
            const top = CHAMBER.y + particle.radius;
            const bottom = CHAMBER.y + CHAMBER.h - particle.radius;
            if (particle.x < left || particle.x > right) {
                particle.x = clamp(particle.x, left, right);
                particle.vx *= -1;
            }
            if (particle.y < top || particle.y > bottom) {
                particle.y = clamp(particle.y, top, bottom);
                particle.vy *= -1;
            }
        }

        for (let i = 0; i < particles.length; i += 1) {
            for (let j = i + 1; j < particles.length; j += 1) {
                const a = particles[i];
                const b = particles[j];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.hypot(dx, dy);
                const minDist = a.radius + b.radius;
                if (dist <= minDist && dist > 0.01) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const overlap = (minDist - dist) / 2;
                    a.x -= nx * overlap;
                    a.y -= ny * overlap;
                    b.x += nx * overlap;
                    b.y += ny * overlap;

                    const relVx = b.vx - a.vx;
                    const relVy = b.vy - a.vy;
                    const speedAlongNormal = relVx * nx + relVy * ny;
                    if (speedAlongNormal < 0) {
                        const impulse = speedAlongNormal;
                        a.vx += impulse * nx;
                        a.vy += impulse * ny;
                        b.vx -= impulse * nx;
                        b.vy -= impulse * ny;
                    }

                    const reactantPair = (a.kind === 'H2' && b.kind === 'I2') || (a.kind === 'I2' && b.kind === 'H2');
                    const combinedEnergy = a.energy + b.energy;
                    if (reactantPair && combinedEnergy >= ea && Math.random() < pFactor * 0.12) {
                        const mx = (a.x + b.x) / 2;
                        const my = (a.y + b.y) / 2;
                        a.kind = 'HI';
                        b.kind = 'HI';
                        a.radius = 20;
                        b.radius = 20;
                        a.vx = -ny * 2.2;
                        a.vy = nx * 2.2;
                        b.vx = ny * 2.2;
                        b.vy = -nx * 2.2;
                        flashesRef.current.push({ x: mx, y: my, life: 0.48, maxLife: 0.48, label: '[H...I...H...I]‡' });
                        for (let s = 0; s < 8; s += 1) {
                            const angle = (Math.PI * 2 * s) / 8 + Math.random() * 0.4;
                            sparksRef.current.push({
                                x: mx,
                                y: my,
                                vx: Math.cos(angle) * (2 + Math.random() * 2),
                                vy: Math.sin(angle) * (2 + Math.random() * 2),
                                life: 0.5,
                                maxLife: 0.5,
                                color: s % 2 ? '#f97316' : '#fbbf24'
                            });
                        }
                        reactionCountRef.current += 1;
                        setReactionCount(reactionCountRef.current);
                    }
                }
            }
        }

        sparksRef.current = sparksRef.current
            .map((spark) => ({
                ...spark,
                x: spark.x + spark.vx * dt * 60,
                y: spark.y + spark.vy * dt * 60,
                life: spark.life - dt
            }))
            .filter((spark) => spark.life > 0);
        flashesRef.current = flashesRef.current
            .map((flash) => ({ ...flash, life: flash.life - dt }))
            .filter((flash) => flash.life > 0);
    }, []);

    const drawChamber = useCallback((ctx: CanvasRenderingContext2D) => {
        drawBackground(ctx);
        label(ctx, 'H₂(g) + I₂(g) → 2 HI(g)', W / 2, 76, 28, 900, '#0f172a');
        label(ctx, 'Effective collision: enough kinetic energy plus proper orientation', W / 2, 105, 15, 700, '#475569');

        const chamberGrad = ctx.createLinearGradient(CHAMBER.x, CHAMBER.y, CHAMBER.x, CHAMBER.y + CHAMBER.h);
        chamberGrad.addColorStop(0, '#ffffff');
        chamberGrad.addColorStop(1, '#f8fafc');
        roundRect(ctx, CHAMBER.x, CHAMBER.y, CHAMBER.w, CHAMBER.h, 28);
        ctx.fillStyle = chamberGrad;
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        roundRect(ctx, CHAMBER.x, CHAMBER.y, CHAMBER.w, CHAMBER.h, 28);
        ctx.clip();
        particlesRef.current.forEach((particle) => drawMolecule(ctx, particle, showLabelsRef.current));
        for (const flash of flashesRef.current) {
            const alpha = flash.life / flash.maxLife;
            const radius = 34 * (1.3 - alpha);
            const grad = ctx.createRadialGradient(flash.x, flash.y, 1, flash.x, flash.y, radius);
            grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
            grad.addColorStop(0.45, `rgba(251,191,36,${0.75 * alpha})`);
            grad.addColorStop(1, 'rgba(251,191,36,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
            ctx.fill();
            if (showLabelsRef.current) label(ctx, flash.label, flash.x, flash.y - 38, 13, 900, '#92400e');
        }
        for (const spark of sparksRef.current) {
            const alpha = spark.life / spark.maxLife;
            ctx.fillStyle = spark.color.replace(')', `,${alpha})`).replace('#f97316', `rgba(249,115,22,${alpha})`).replace('#fbbf24', `rgba(251,191,36,${alpha})`);
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, 4 * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        label(ctx, 'Hard-sphere molecular collisions', CHAMBER.x + 210, CHAMBER.y + CHAMBER.h + 28, 15, 800, '#334155');
        label(ctx, 'Above threshold glows orange; near threshold glows yellow', CHAMBER.x + CHAMBER.w - 310, CHAMBER.y + CHAMBER.h + 28, 15, 800, '#b45309');
    }, []);

    const drawEnergyProfile = useCallback((ctx: CanvasRenderingContext2D) => {
        drawBackground(ctx);
        label(ctx, 'Potential Energy vs Reaction Coordinate', W / 2, 72, 28, 900, '#0f172a');
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        drawArrow(ctx, 150, 600, 1125, 600, '#334155');
        drawArrow(ctx, 150, 600, 150, 135, '#334155');
        label(ctx, 'Reaction coordinate', W / 2, 638, 16, 800, '#334155');
        label(ctx, 'Potential energy', 70, 360, 16, 800, '#334155');

        drawProfileCurve(ctx, 205, '#3b82f6', 6);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(190, 455);
        ctx.lineTo(1085, 455);
        ctx.moveTo(190, 505);
        ctx.lineTo(1085, 505);
        ctx.stroke();
        ctx.setLineDash([]);

        drawArrow(ctx, 510, 455, 510, 208, '#dc2626', true);
        drawArrow(ctx, 955, 455, 955, 505, '#16a34a', true);
        label(ctx, 'Ea', 535, 330, 18, 900, '#dc2626', 'left');
        label(ctx, 'ΔH', 980, 480, 18, 900, '#16a34a', 'left');
        label(ctx, 'H₂ + I₂', 245, 430, 18, 900, '#1d4ed8');
        label(ctx, '2 HI', 1070, 475, 18, 900, '#dc2626');
        label(ctx, 'Activated complex', 640, 170, 16, 900, '#6d28d9');
        label(ctx, 'H...H...I...I‡', 640, 202, 20, 900, '#6d28d9');

        const enoughEnergy = activationEnergyRef.current <= 95 || catalystOnRef.current;
        const point = energyPoint(timeRef.current, enoughEnergy);
        ctx.shadowColor = '#2563eb';
        ctx.shadowBlur = 18;
        drawAtom(ctx, point.x, point.y, 18, enoughEnergy ? '#60a5fa' : '#f87171', enoughEnergy ? '#1d4ed8' : '#b91c1c', '', '#0f172a');
        ctx.shadowBlur = 0;
        label(ctx, enoughEnergy ? 'marble crosses the barrier' : 'not enough KE: rolls back', W / 2, 700, 16, 900, enoughEnergy ? '#1d4ed8' : '#b91c1c');
    }, []);

    const drawOrientation = useCallback((ctx: CanvasRenderingContext2D) => {
        drawBackground(ctx);
        label(ctx, 'Steric Factor: Proper vs Improper Orientation', W / 2, 62, 28, 900, '#0f172a');
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, 378);
        ctx.lineTo(1200, 378);
        ctx.stroke();

        const phase = (Math.sin(timeRef.current * 1.6) + 1) / 2;
        const drawCh3Br = (cx: number, cy: number) => {
            drawAtom(ctx, cx, cy, 28, '#a7f3d0', '#047857', 'C');
            drawAtom(ctx, cx - 60, cy - 48, 18, '#e2e8f0', '#64748b', 'H');
            drawAtom(ctx, cx - 70, cy + 6, 18, '#e2e8f0', '#64748b', 'H');
            drawAtom(ctx, cx - 52, cy + 54, 18, '#e2e8f0', '#64748b', 'H');
            drawAtom(ctx, cx + 85, cy, 30, '#c4b5fd', '#5b21b6', 'Br');
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 4;
            [[cx - 48, cy - 38], [cx - 52, cy + 5], [cx - 40, cy + 42], [cx + 58, cy]].forEach(([x, y]) => {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(x, y);
                ctx.stroke();
            });
        };

        drawCh3Br(620, 222);
        const ohX = lerp(315, 560, phase);
        drawArrow(ctx, 320, 222, 540, 222, '#16a34a');
        drawAtom(ctx, ohX, 222, 24, '#bae6fd', '#0891b2', 'OH⁻');
        label(ctx, 'PROPER orientation', 170, 148, 18, 900, '#15803d', 'left');
        label(ctx, 'CH₃Br + OH⁻ → CH₃OH + Br⁻ ✓', 960, 222, 18, 900, '#15803d');
        label(ctx, 'Back attack forms C-O bond while Br leaves', 960, 254, 14, 800, '#166534');

        drawCh3Br(620, 545);
        const bounce = phase < 0.65 ? lerp(1000, 700, phase / 0.65) : lerp(700, 1000, (phase - 0.65) / 0.35);
        drawArrow(ctx, 1010, 545, 735, 545, '#dc2626');
        drawAtom(ctx, bounce, 545, 24, '#bae6fd', '#0891b2', 'OH⁻');
        label(ctx, 'IMPROPER orientation', 170, 472, 18, 900, '#b91c1c', 'left');
        label(ctx, 'Same-side attack → bounce, no product', 950, 545, 18, 900, '#b91c1c');
        label(ctx, 'P is the probability factor for correct geometry', 948, 585, 15, 900, '#475569');
    }, []);

    const drawCatalyst = useCallback((ctx: CanvasRenderingContext2D) => {
        drawBackground(ctx);
        label(ctx, 'Catalyst Compare: Alternate Lower-Ea Pathway', W / 2, 65, 28, 900, '#0f172a');
        drawArrow(ctx, 120, 600, 780, 600, '#334155');
        drawArrow(ctx, 120, 600, 120, 130, '#334155');
        drawProfileCurve(ctx, 190, '#94a3b8', 6);
        if (catalystOnRef.current) drawProfileCurve(ctx, 310, '#16a34a', 6);
        label(ctx, 'No catalyst', 350, 230, 16, 900, '#64748b');
        if (catalystOnRef.current) label(ctx, 'With catalyst', 520, 333, 16, 900, '#15803d');
        drawArrow(ctx, 620, 190, 620, catalystOnRef.current ? 310 : 190, '#16a34a', true);
        label(ctx, catalystOnRef.current ? 'lowered Ea' : 'turn catalyst ON', 650, 255, 16, 900, catalystOnRef.current ? '#15803d' : '#64748b', 'left');

        const drawMiniBox = (x: number, y: number, title: string, count: number, color: string) => {
            roundRect(ctx, x, y, 260, 190, 18);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
            label(ctx, title, x + 130, y + 28, 16, 900, color);
            for (let i = 0; i < 12; i += 1) {
                const px = x + 38 + ((i * 47 + timeRef.current * (i + 3) * 6) % 190);
                const py = y + 62 + ((i * 31 + timeRef.current * (i + 5) * 4) % 92);
                drawAtom(ctx, px, py, i % 2 ? 11 : 9, i % 2 ? '#c4b5fd' : '#e2e8f0', i % 2 ? '#5b21b6' : '#64748b', '');
            }
            label(ctx, `${count} reactions in 10 s`, x + 130, y + 160, 15, 900, color);
        };

        const baseCount = Math.max(1, Math.round(reactionCountRef.current * 0.35 + 4));
        drawMiniBox(875, 185, 'No catalyst', baseCount, '#64748b');
        drawMiniBox(875, 440, 'Catalyst', catalystOnRef.current ? baseCount * 5 + 7 : baseCount, '#16a34a');
        label(ctx, 'Does not change ΔG, K_eq, or thermodynamics', 1005, 690, 16, 900, '#92400e');
    }, []);

    const drawFrame = useCallback((now: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const last = lastRef.current ?? now;
        const dt = Math.min((now - last) / 1000, 0.1);
        lastRef.current = now;

        if (!pausedRef.current) {
            timeRef.current += dt * speedRef.current;
            if (modeRef.current === 'chamber' || modeRef.current === 'catalyst') updateParticles(dt * speedRef.current);
        }

        if (modeRef.current === 'profile') drawEnergyProfile(ctx);
        else if (modeRef.current === 'orientation') drawOrientation(ctx);
        else if (modeRef.current === 'catalyst') drawCatalyst(ctx);
        else drawChamber(ctx);

        requestRef.current = requestAnimationFrame(drawFrame);
    }, [drawCatalyst, drawChamber, drawEnergyProfile, drawOrientation, updateParticles]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(drawFrame);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [drawFrame]);

    const graphPanel = useMemo(() => {
        const maxE = 170;
        const eaX = clamp((effectiveEa / maxE) * 260, 0, 260);
        const currentPath = mbPath(260, 138, temperature, maxE);
        const plusTenPath = mbPath(260, 138, temperature + 10, maxE);
        const history = historyRef.current.slice(-4);
        const invMin = 1 / 650;
        const invMax = 1 / 250;
        const lnMin = -8;
        const lnMax = 13;
        const points = history.map((point) => ({
            x: 34 + ((point.invT - invMin) / (invMax - invMin)) * 238,
            y: 146 - ((point.lnK - lnMin) / (lnMax - lnMin)) * 118
        }));

        return (
            <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
                <div className="flex flex-col gap-2.5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">Maxwell-Boltzmann</h3>
                                <p className="text-xs font-semibold text-slate-500">Fig 3.8 and 3.9 · fraction N_E/N_T vs E</p>
                            </div>
                            <Thermometer size={18} className="text-cyan-700" />
                        </div>
                        {showMB ? (
                            <svg viewBox="0 0 300 170" className="mt-2 h-[170px] w-full">
                                <path d="M28 148 H286 M30 150 V16" fill="none" stroke="#475569" strokeWidth="2" />
                                <path d={`M ${30 + eaX} 20 V148`} stroke="#dc2626" strokeWidth="2" strokeDasharray="6 5" />
                                <path d={`M ${30 + eaX} 148 H290 V20`} fill="#fecaca" opacity="0.45" />
                                <path d={plusTenPath} transform="translate(30 10)" fill="none" stroke="#94a3b8" strokeWidth="3" opacity="0.55" />
                                <path d={currentPath} transform="translate(30 10)" fill="none" stroke="#0891b2" strokeWidth="4" />
                                <text x={34 + eaX} y="18" fill="#dc2626" fontSize="12" fontWeight="800">Ea</text>
                                <text x="42" y="31" fill="#0891b2" fontSize="12" fontWeight="800">{temperature} K</text>
                                <text x="205" y="47" fill="#64748b" fontSize="12" fontWeight="800">T + 10 K</text>
                                <text x="154" y="166" fill="#475569" fontSize="12" fontWeight="800">Kinetic energy E</text>
                                <text x="2" y="92" fill="#475569" fontSize="12" fontWeight="800" transform="rotate(-90 10 92)">N_E/N_T</text>
                            </svg>
                        ) : (
                            <div className="mt-3 flex h-[170px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm font-bold text-slate-500">
                                MB curve hidden
                            </div>
                        )}
                        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
                            Area beyond Ea = e^(−Ea/RT) = {formatSci(fraction, 2)}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900">Arrhenius Plot</h3>
                                <p className="text-xs font-semibold text-slate-500">Fig 3.10 · ln k vs 1/T</p>
                            </div>
                            <TrendingUp size={18} className="text-blue-700" />
                        </div>
                        {showArrhenius ? (
                            <svg viewBox="0 0 300 170" className="mt-2 h-[160px] w-full">
                                <path d="M32 148 H286 M34 150 V18" fill="none" stroke="#475569" strokeWidth="2" />
                                <path d="M44 126 L268 34" fill="none" stroke="#1d4ed8" strokeWidth="4" />
                                {points.map((point, index) => (
                                    <circle key={`${point.x}-${index}`} cx={clamp(point.x, 36, 280)} cy={clamp(point.y, 24, 146)} r={index === points.length - 1 ? 6 : 4} fill={index === points.length - 1 ? '#d97706' : '#94a3b8'} />
                                ))}
                                <text x="138" y="166" fill="#475569" fontSize="12" fontWeight="800">1/T</text>
                                <text x="4" y="84" fill="#475569" fontSize="12" fontWeight="800" transform="rotate(-90 10 84)">ln k</text>
                                <text x="118" y="38" fill="#1d4ed8" fontSize="12" fontWeight="800">slope = −Ea/R</text>
                            </svg>
                        ) : (
                            <div className="mt-3 flex h-[160px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm font-bold text-slate-500">
                                Arrhenius plot hidden
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                        <h3 className="text-base font-extrabold text-slate-900">NCERT Figures</h3>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                            {['3.6 H₂ + I₂', '3.7 Ea profile', '3.8 MB curve', '3.9 T + 10 K', '3.10 ln k plot', '3.11 catalyst', '3.12 orientation'].map((item) => (
                                <div key={item} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">{item}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        );
    }, [effectiveEa, fraction, showArrhenius, showMB, temperature]);

    const valuesPanel = useMemo(() => {
        const valueRows = [
            { label: 'Temperature', value: `${temperature} K`, tint: 'bg-cyan-50', color: 'text-cyan-700' },
            { label: 'Activation energy', value: `${effectiveEa.toFixed(1)} kJ mol⁻¹`, tint: 'bg-amber-50', color: 'text-amber-700' },
            { label: 'Rate constant k', value: `${formatSci(k, 2)} s⁻¹`, tint: 'bg-emerald-50', color: 'text-emerald-700' },
            { label: 'Steric factor P', value: stericFactor.toFixed(2), tint: 'bg-violet-50', color: 'text-violet-700' },
            { label: 'Reactions completed', value: `${reactionCount}`, tint: 'bg-slate-50', color: 'text-slate-800' }
        ];

        return (
            <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
                <div className="flex flex-col gap-3">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                        <div className="flex items-start gap-2">
                            <FlaskConical size={19} className="mt-0.5 text-amber-800" />
                            <div>
                                <h3 className="text-base font-extrabold text-amber-950">Collision Theory</h3>
                                <p className="text-xs font-semibold text-amber-700">NCERT Class 12 Chemistry · Unit 3, Sec 3.4-3.5</p>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-950">
                            <p>(3.18) k = A · e^(−Ea/RT)</p>
                            <p>(3.19) ln k = −Ea/(RT) + ln A</p>
                            <p>(3.22) log(k₂/k₁) = Ea/(2.303 R) · [(T₂ − T₁)/(T₁ T₂)]</p>
                            <p>(3.23) Rate = Z_AB · e^(−Ea/RT); Rate = P · Z_AB · e^(−Ea/RT)</p>
                            <p>k is the rate constant; A is the pre-exponential/frequency factor; Z_AB is collision frequency; P is the orientation factor.</p>
                            <p>Activated complex is the unstable transition state at the peak.</p>
                            <p>Threshold Energy = Activation Energy + energy already possessed by reactants.</p>
                            <p>Effective collision needs KE ≥ threshold and proper orientation.</p>
                            <p>Van't Hoff proposed the equation; Arrhenius justified it. Trautz and Lewis developed collision theory in 1916-18.</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                        </div>
                        <div className="mt-3 space-y-2">
                            {valueRows.map((row) => (
                                <div key={row.label} className={`rounded-lg border border-slate-100 ${row.tint} px-3 py-2.5`}>
                                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                                    <div className={`mt-1 font-mono text-base font-extrabold ${row.color}`}>{row.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                        <h3 className="text-base font-extrabold text-slate-900">NCERT Anchors</h3>
                        <div className="mt-2 space-y-2 text-sm font-semibold leading-snug text-slate-700">
                            <p>R = 8.314 J K⁻¹ mol⁻¹; A is the pre-exponential or frequency factor.</p>
                            <p>T is absolute temperature; Ea is displayed in kJ mol⁻¹; ΔH is the reactant-product enthalpy difference.</p>
                            <p>10 K rise in T roughly doubles k. {lastTenRise ? 'Current change demonstrates this.' : ''}</p>
                            <p>N₂O₅: 10 days @ 0°C, 5 h @ 25°C, 12 min @ 50°C.</p>
                            <p>2 HI → H₂ + I₂ has Ea = 209.5 kJ mol⁻¹ at 581 K; C₂H₅I decomposition has Ea = 209 kJ mol⁻¹.</p>
                            <p>Catalyst lowers Ea by an alternate path; it does not change ΔG, K_eq, or thermodynamics. Inhibitor decreases rate.</p>
                        </div>
                    </div>
                </div>
            </aside>
        );
    }, [effectiveEa, k, lastTenRise, reactionCount, stericFactor, temperature]);

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        onClick={() => setPaused((value) => !value)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50"
                        title={paused ? 'Play' : 'Pause'}
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button
                        onClick={() => resetSimulation(false)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50"
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

    const controls = (
        <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                        <Activity size={18} />
                    </div>
                    <div>
                        <div className="text-sm font-black text-slate-900">Collision Theory Bench</div>
                        <div className="text-[11px] font-bold text-slate-500">Chemical kinetics</div>
                    </div>
                </div>
                <button
                    onClick={() => resetSimulation(true)}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
                    title="Restore defaults"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
                {MODES.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setMode(item.id)}
                        className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-black transition ${
                            mode === item.id
                                ? 'border-amber-400 bg-amber-100 text-amber-900'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Temperature</span>
                        <output>{temperature} K</output>
                    </div>
                    <input className="w-full accent-cyan-600" type="range" min={250} max={650} step={5} value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} />
                </label>
                <label className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Ea</span>
                        <output>{activationEnergy} kJ</output>
                    </div>
                    <input className="w-full accent-amber-600" type="range" min={25} max={160} step={1} value={activationEnergy} onChange={(event) => setActivationEnergy(Number(event.target.value))} />
                </label>
                <label className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Steric P</span>
                        <output>{stericFactor.toFixed(2)}</output>
                    </div>
                    <input className="w-full accent-violet-600" type="range" min={0.05} max={1} step={0.01} value={stericFactor} onChange={(event) => setStericFactor(Number(event.target.value))} />
                </label>
                <label className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Speed</span>
                        <output>{speed.toFixed(1)}x</output>
                    </div>
                    <input className="w-full accent-slate-700" type="range" min={0.2} max={2.5} step={0.1} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
                </label>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: 'Catalyst', active: catalystOn, set: setCatalystOn, icon: <Zap size={15} /> },
                    { label: 'MB', active: showMB, set: setShowMB, icon: showMB ? <Eye size={15} /> : <EyeOff size={15} /> },
                    { label: 'Arrhenius', active: showArrhenius, set: setShowArrhenius, icon: <TrendingUp size={15} /> },
                    { label: 'Labels', active: showLabels, set: setShowLabels, icon: showLabels ? <Eye size={15} /> : <EyeOff size={15} /> }
                ].map((item) => (
                    <button
                        key={item.label}
                        onClick={() => item.set((value) => !value)}
                        className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] font-black ${
                            item.active
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </div>
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

export default CollisionTheoryLab;
