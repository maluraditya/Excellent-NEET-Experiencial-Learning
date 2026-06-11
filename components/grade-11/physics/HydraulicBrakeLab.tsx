import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Anchor,
    Car,
    Droplet,
    Eye,
    EyeOff,
    FlaskConical,
    Gauge,
    Pause,
    Play,
    RotateCcw,
    Wind
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface HydraulicBrakeLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'depth' | 'paradox' | 'lift' | 'brake' | 'barometer' | 'manometer';
type FluidId = 'water' | 'seawater' | 'mercury';
type ManometerLiquid = 'oil' | 'mercury';

interface SparkParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
}

const W = 1280;
const H = 760;
const PA = 1.013e5;
const G = 9.8;
const ATM = 1.013e5;

const FLUIDS: Record<FluidId, { label: string; rho: number; top: string; bottom: string }> = {
    water: { label: 'Water', rho: 1000, top: '#38bdf8', bottom: '#075985' },
    seawater: { label: 'Seawater', rho: 1030, top: '#2dd4bf', bottom: '#115e59' },
    mercury: { label: 'Mercury', rho: 13600, top: '#cbd5e1', bottom: '#475569' }
};

const MANO_LIQUIDS: Record<ManometerLiquid, { label: string; rho: number; top: string; bottom: string }> = {
    oil: { label: 'Oil', rho: 800, top: '#fde68a', bottom: '#d97706' },
    mercury: { label: 'Mercury', rho: 13600, top: '#cbd5e1', bottom: '#475569' }
};

const MODES: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
    { id: 'depth', label: 'Depth', icon: <Droplet size={15} /> },
    { id: 'paradox', label: 'Paradox', icon: <FlaskConical size={15} /> },
    { id: 'lift', label: 'Lift', icon: <Car size={15} /> },
    { id: 'brake', label: 'Brake', icon: <Gauge size={15} /> },
    { id: 'barometer', label: 'Barometer', icon: <Anchor size={15} /> },
    { id: 'manometer', label: 'Manometer', icon: <Wind size={15} /> }
];

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function atmText(pa: number) {
    return `${(pa / ATM).toFixed(pa / ATM >= 10 ? 0 : 2)} atm`;
}

function sci(value: number) {
    if (Math.abs(value) >= 1e5) return `${(value / 1e5).toFixed(2)} x 10^5`;
    if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)} x 10^3`;
    return value.toFixed(0);
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

function softShadow(ctx: CanvasRenderingContext2D, color = 'rgba(15,23,42,0.16)', blur = 22, x = 0, y = 12) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = x;
    ctx.shadowOffsetY = y;
}

function clearShadow(ctx: CanvasRenderingContext2D) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function glassSheen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 18) {
    ctx.save();
    roundRect(ctx, x, y, w, h, r);
    ctx.clip();
    const sheen = ctx.createLinearGradient(x, y, x + w, y + h);
    sheen.addColorStop(0, 'rgba(255,255,255,0.55)');
    sheen.addColorStop(0.32, 'rgba(255,255,255,0.08)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
}

function drawWave(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, amp: number, t: number, color: string) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= w; i += 8) {
        const yy = y + Math.sin(t * 2.5 + i * 0.045) * amp;
        if (i === 0) ctx.moveTo(x + i, yy);
        else ctx.lineTo(x + i, yy);
    }
    ctx.stroke();
    ctx.restore();
}

function fluidParticles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, color: string, count = 16) {
    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < count; i += 1) {
        const px = x + ((i * 37 + t * 42) % w);
        const py = y + 18 + ((i * 53 + Math.sin(t + i) * 18) % Math.max(20, h - 36));
        const r = 2.2 + (i % 3) * 0.8;
        ctx.globalAlpha = 0.28 + 0.18 * Math.sin(t * 2 + i);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}

function pressureDots(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, t: number, color = '#f59e0b', count = 12) {
    ctx.save();
    for (let i = 0; i < count; i += 1) {
        const p = ((t * 0.55 + i / count) % 1);
        const x = lerp(x1, x2, p);
        const y = lerp(y1, y2, p);
        const glow = 0.25 + 0.45 * Math.sin((p + t) * Math.PI * 2) ** 2;
        ctx.globalAlpha = glow;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
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
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 12 * Math.cos(angle - Math.PI / 6), y2 - 12 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 12 * Math.cos(angle + Math.PI / 6), y2 - 12 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function cylinder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = '#64748b') {
    ctx.save();
    softShadow(ctx, 'rgba(15,23,42,0.14)', 20, 0, 10);
    roundRect(ctx, x, y, w, h, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    clearShadow(ctx);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
    roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 12);
    ctx.fillStyle = fill;
    ctx.fill();
    glassSheen(ctx, x + 8, y + 8, w - 16, h - 16, 12);
    ctx.restore();
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, 40, 112, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    const body = ctx.createLinearGradient(-92, -58, 92, 26);
    body.addColorStop(0, '#60a5fa');
    body.addColorStop(0.35, '#1d4ed8');
    body.addColorStop(1, '#1e40af');
    ctx.fillStyle = body;
    roundRect(ctx, -92, -26, 184, 42, 12);
    ctx.fill();
    ctx.fillStyle = '#60a5fa';
    roundRect(ctx, -48, -58, 96, 38, 12);
    ctx.fill();
    ctx.fillStyle = '#dbeafe';
    roundRect(ctx, -36, -51, 28, 25, 6);
    ctx.fill();
    roundRect(ctx, 8, -51, 28, 25, 6);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(88, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    [-58, 58].forEach((cx) => {
        ctx.beginPath();
        ctx.arc(cx, 18, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(cx, 18, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
    });
    ctx.restore();
}

function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const metal = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 5, 0, 0, r);
    metal.addColorStop(0, '#ffffff');
    metal.addColorStop(0.42, '#e2e8f0');
    metal.addColorStop(1, '#94a3b8');
    ctx.fillStyle = metal;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 5;
    ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.cos(i * Math.PI / 3) * r * 0.62, Math.sin(i * Math.PI / 3) * r * 0.62, 7, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.68)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

const HydraulicBrakeLab: React.FC<HydraulicBrakeLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>();
    const lastRef = useRef<number>();
    const timeRef = useRef(0);
    const liftRef = useRef({ left: 0, right: 0 });
    const brakeRef = useRef({ pressure: 0, discAngle: 0, discSpeed: 7, mercuryCm: 76, manoCm: 0, sparks: [] as SparkParticle[] });

    const [mode, setMode] = useState<Mode>('lift');
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [showPressure, setShowPressure] = useState(true);
    const [showForces, setShowForces] = useState(true);
    const [showEquations, setShowEquations] = useState(true);
    const [depth, setDepth] = useState(10);
    const [fluid, setFluid] = useState<FluidId>('water');
    const [vesselScale, setVesselScale] = useState(60);
    const [force1, setForce1] = useState(150);
    const [r1, setR1] = useState(5);
    const [r2, setR2] = useState(15);
    const [loadMass, setLoadMass] = useState(1350);
    const [pedalForce, setPedalForce] = useState(260);
    const [fourWheels, setFourWheels] = useState(true);
    const [liquidBrake, setLiquidBrake] = useState(true);
    const [atmKpa, setAtmKpa] = useState(101.3);
    const [systemKpa, setSystemKpa] = useState(130);
    const [manoLiquid, setManoLiquid] = useState<ManometerLiquid>('mercury');

    const modeRef = useRef(mode);
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);
    const pressureRef = useRef(showPressure);
    const forcesRef = useRef(showForces);
    const equationsRef = useRef(showEquations);
    const depthRef = useRef(depth);
    const fluidRef = useRef(fluid);
    const vesselScaleRef = useRef(vesselScale);
    const force1Ref = useRef(force1);
    const r1Ref = useRef(r1);
    const r2Ref = useRef(r2);
    const loadMassRef = useRef(loadMass);
    const pedalForceRef = useRef(pedalForce);
    const fourWheelsRef = useRef(fourWheels);
    const liquidBrakeRef = useRef(liquidBrake);
    const atmKpaRef = useRef(atmKpa);
    const systemKpaRef = useRef(systemKpa);
    const manoLiquidRef = useRef(manoLiquid);

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { pressureRef.current = showPressure; }, [showPressure]);
    useEffect(() => { forcesRef.current = showForces; }, [showForces]);
    useEffect(() => { equationsRef.current = showEquations; }, [showEquations]);
    useEffect(() => { depthRef.current = depth; }, [depth]);
    useEffect(() => { fluidRef.current = fluid; }, [fluid]);
    useEffect(() => { vesselScaleRef.current = vesselScale; }, [vesselScale]);
    useEffect(() => { force1Ref.current = force1; }, [force1]);
    useEffect(() => { r1Ref.current = r1; }, [r1]);
    useEffect(() => { r2Ref.current = r2; }, [r2]);
    useEffect(() => { loadMassRef.current = loadMass; }, [loadMass]);
    useEffect(() => { pedalForceRef.current = pedalForce; }, [pedalForce]);
    useEffect(() => { fourWheelsRef.current = fourWheels; }, [fourWheels]);
    useEffect(() => { liquidBrakeRef.current = liquidBrake; }, [liquidBrake]);
    useEffect(() => { atmKpaRef.current = atmKpa; }, [atmKpa]);
    useEffect(() => { systemKpaRef.current = systemKpa; }, [systemKpa]);
    useEffect(() => { manoLiquidRef.current = manoLiquid; }, [manoLiquid]);

    const liftValues = useMemo(() => {
        const a1 = Math.PI * (r1 / 100) ** 2;
        const a2 = Math.PI * (r2 / 100) ** 2;
        const pressure = force1 / a1;
        const force2 = pressure * a2;
        const advantage = a2 / a1;
        const load = loadMass * G;
        const l1 = 10;
        const l2 = l1 / advantage;
        return { a1, a2, pressure, force2, advantage, load, l1, l2 };
    }, [force1, loadMass, r1, r2]);

    const depthValues = useMemo(() => {
        const rho = FLUIDS[fluid].rho;
        const gauge = rho * G * depth;
        const absolute = PA + gauge;
        return { rho, gauge, absolute };
    }, [depth, fluid]);

    const manometerValues = useMemo(() => {
        const rho = MANO_LIQUIDS[manoLiquid].rho;
        const gauge = (systemKpa - atmKpa) * 1000;
        const h = Math.abs(gauge) / (rho * G);
        return { rho, gauge, hCm: h * 100, systemPa: systemKpa * 1000, atmPa: atmKpa * 1000 };
    }, [atmKpa, manoLiquid, systemKpa]);

    const handleReset = useCallback(() => {
        setMode('lift');
        setPaused(false);
        setSpeed(1);
        setShowPressure(true);
        setShowForces(true);
        setShowEquations(true);
        setDepth(10);
        setFluid('water');
        setVesselScale(60);
        setForce1(150);
        setR1(5);
        setR2(15);
        setLoadMass(1350);
        setPedalForce(260);
        setFourWheels(true);
        setLiquidBrake(true);
        setAtmKpa(101.3);
        setSystemKpa(130);
        setManoLiquid('mercury');
        liftRef.current = { left: 0, right: 0 };
        brakeRef.current = { pressure: 0, discAngle: 0, discSpeed: 7, mercuryCm: 76, manoCm: 0, sparks: [] };
        timeRef.current = 0;
    }, []);

    const title = useCallback((ctx: CanvasRenderingContext2D, heading: string, subheading: string) => {
        label(ctx, heading, W / 2, 62, 29, 900);
        label(ctx, subheading, W / 2, 96, 15, 800, '#475569');
    }, []);

    const drawDepthMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const fluidData = FLUIDS[fluidRef.current];
        const h = depthRef.current;
        const gauge = fluidData.rho * G * h;
        const absolute = PA + gauge;
        title(ctx, 'Pressure With Depth', 'Pressure increases linearly with depth and is the same at one level');

        const x = 500;
        const y = 145;
        const w = 280;
        const ch = 520;
        roundRect(ctx, x, y, w, ch, 26);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.stroke();

        const grad = ctx.createLinearGradient(0, y, 0, y + ch);
        grad.addColorStop(0, fluidData.top);
        grad.addColorStop(1, fluidData.bottom);
        roundRect(ctx, x + 14, y + 42, w - 28, ch - 56, 18);
        ctx.fillStyle = grad;
        ctx.fill();
        glassSheen(ctx, x + 14, y + 42, w - 28, ch - 56, 18);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 8; i += 1) ctx.fillRect(x + 34 + i * 30, y + 58, 8, ch - 90);
        ctx.globalAlpha = 1;
        drawWave(ctx, x + 34, y + 42, w - 68, 4, timeRef.current, 'rgba(255,255,255,0.88)');
        fluidParticles(ctx, x + 26, y + 64, w - 52, ch - 98, timeRef.current, '#e0f2fe', 26);

        const yPos = y + 42 + (ch - 56) * Math.log10(1 + h) / Math.log10(1001);
        if (pressureRef.current) {
            const pulse = 0.18 + 0.08 * Math.sin(timeRef.current * 3);
            const fieldGrad = ctx.createLinearGradient(0, yPos, 0, y + ch);
            fieldGrad.addColorStop(0, `rgba(14,165,233,${pulse})`);
            fieldGrad.addColorStop(1, `rgba(14,165,233,${pulse + 0.12})`);
            roundRect(ctx, x + 22, yPos, w - 44, y + ch - yPos - 22, 12);
            ctx.fillStyle = fieldGrad;
            ctx.fill();
        }
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 14, yPos);
        ctx.lineTo(x + w - 14, yPos);
        ctx.stroke();
        label(ctx, `${h} m`, x + w + 48, yPos, 16, 900, '#ca8a04', 'left');

        arrow(ctx, x - 68, y + 52, x - 68, yPos, '#475569');
        label(ctx, 'depth h', x - 88, (y + 52 + yPos) / 2, 13, 900, '#475569', 'right');
        label(ctx, 'free surface', x + w / 2, y + 35, 13, 900, '#0f172a');
        label(ctx, 'same horizontal level: same pressure', W / 2, 704, 14, 900, '#0f172a');

        const swimmerY = y + 42 + (ch - 56) * Math.log10(11) / Math.log10(1001);
        label(ctx, 'swimmer 10 m', 875, swimmerY, 14, 900, '#0f172a', 'left');
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(840, swimmerY, 12, 0, Math.PI * 2);
        ctx.fill();
        const subY = y + 42 + (ch - 56);
        label(ctx, 'submarine 1000 m', 875, subY, 14, 900, '#0f172a', 'left');
        roundRect(ctx, 805, subY - 20, 52, 28, 14);
        ctx.fillStyle = '#334155';
        ctx.fill();

        if (pressureRef.current) {
            const barH = clamp((absolute / (104 * ATM)) * 420, 8, 420);
            roundRect(ctx, 930, 205, 46, 420, 14);
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();
            roundRect(ctx, 936, 625 - barH, 34, barH, 10);
            ctx.fillStyle = '#0ea5e9';
            ctx.fill();
            label(ctx, 'pressure', 953, 655, 13, 900, '#0369a1');
            pressureDots(ctx, x + w - 18, yPos, 930, 625 - barH, timeRef.current, '#0ea5e9', 8);
        }
        if (equationsRef.current) label(ctx, `P = Pa + rho g h = ${sci(absolute)} Pa`, W / 2, 730, 13, 900, '#64748b');
    }, [title]);

    const drawParadoxMode = useCallback((ctx: CanvasRenderingContext2D) => {
        title(ctx, 'Hydrostatic Paradox', 'Different shapes, same liquid height, same bottom pressure');
        const baseY = 600;
        const levelY = 250;
        const xs = [300, 575, 850];
        const widths = [130, 180, 240];
        const volume = vesselScaleRef.current;
        xs.forEach((x, i) => {
            const w = widths[i] + (i - 1) * volume * 0.35;
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 4;
            ctx.beginPath();
            if (i === 0) {
                ctx.moveTo(x - 95, baseY);
                ctx.lineTo(x - 40, levelY);
                ctx.lineTo(x + 40, levelY);
                ctx.lineTo(x + 95, baseY);
            } else if (i === 1) {
                ctx.moveTo(x - 75, baseY);
                ctx.lineTo(x - 75, levelY);
                ctx.lineTo(x + 75, levelY);
                ctx.lineTo(x + 75, baseY);
            } else {
                ctx.moveTo(x - 55, baseY);
                ctx.lineTo(x - w / 2, levelY);
                ctx.lineTo(x + w / 2, levelY);
                ctx.lineTo(x + 55, baseY);
            }
            ctx.stroke();
            ctx.globalAlpha = 0.72;
            ctx.fillStyle = '#0ea5e9';
            ctx.beginPath();
            if (i === 0) {
                ctx.moveTo(x - 88, baseY);
                ctx.lineTo(x - 36, levelY + 12);
                ctx.lineTo(x + 36, levelY + 12);
                ctx.lineTo(x + 88, baseY);
            } else if (i === 1) {
                ctx.rect(x - 68, levelY + 12, 136, baseY - levelY - 12);
            } else {
                ctx.moveTo(x - 48, baseY);
                ctx.lineTo(x - w / 2 + 12, levelY + 12);
                ctx.lineTo(x + w / 2 - 12, levelY + 12);
                ctx.lineTo(x + 48, baseY);
            }
            ctx.closePath();
            ctx.fill();
            ctx.save();
            ctx.globalAlpha = 0.75;
            drawWave(ctx, x - Math.max(64, w / 2 - 12), levelY + 12, Math.max(128, w - 24), 3, timeRef.current + i * 0.7, 'rgba(255,255,255,0.88)');
            fluidParticles(ctx, x - 58, levelY + 46, 116, baseY - levelY - 82, timeRef.current + i, '#e0f2fe', 10);
            ctx.restore();
            ctx.globalAlpha = 1;
            label(ctx, String.fromCharCode(65 + i), x, baseY + 38, 22, 900, '#0f172a');
        });
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(185, levelY + 12);
        ctx.lineTo(985, levelY + 12);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, 'same height h', 1010, levelY + 12, 15, 900, '#d97706', 'left');

        ctx.fillStyle = '#0ea5e9';
        roundRect(ctx, 240, baseY - 16, 620, 32, 16);
        ctx.fill();
        glassSheen(ctx, 240, baseY - 16, 620, 32, 16);
        pressureDots(ctx, 260, baseY, 840, baseY, timeRef.current, '#e0f2fe', 18);
        label(ctx, 'connected bottom pipe: equal bottom pressure', 550, 660, 15, 900, '#0f172a');
        if (equationsRef.current) label(ctx, 'P depends on depth, density and g, not on vessel shape or volume', W / 2, 725, 14, 900, '#64748b');
    }, [title]);

    const drawLiftMode = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
        const f1 = force1Ref.current;
        const rSmall = r1Ref.current;
        const rLarge = r2Ref.current;
        const mass = loadMassRef.current;
        const a1 = Math.PI * (rSmall / 100) ** 2;
        const a2 = Math.PI * (rLarge / 100) ** 2;
        const advantage = a2 / a1;
        const f2 = f1 * advantage;
        const load = mass * G;
        const target = clamp(f2 / Math.max(load, 1), 0, 1);
        liftRef.current.left = lerp(liftRef.current.left, target, Math.min(1, dt * 8));
        liftRef.current.right = lerp(liftRef.current.right, target, Math.min(1, dt * 5));
        title(ctx, 'Pascal Law: Hydraulic Lift', 'Pressure applied to an enclosed liquid is transmitted undiminished');

        const y = 430;
        const smallX = 315;
        const largeX = 805;
        const smallW = 130;
        const largeW = 250;
        const leftTravel = liftRef.current.left * 95;
        const rightLift = liftRef.current.right * 86;
        const oil = `rgba(245,158,11,${pressureRef.current ? 0.44 + 0.14 * Math.sin(timeRef.current * 3) : 0.34})`;

        cylinder(ctx, smallX, y - 170, smallW, 240, oil);
        cylinder(ctx, largeX, y - 235, largeW, 305, oil);
        ctx.save();
        ctx.globalAlpha = 0.13;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(largeX + largeW / 2, y + 90, 190, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = oil;
        ctx.fillRect(smallX + smallW, y - 15, largeX - smallX - smallW, 30);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.strokeRect(smallX + smallW, y - 15, largeX - smallX - smallW, 30);
        glassSheen(ctx, smallX + smallW, y - 15, largeX - smallX - smallW, 30, 8);
        if (pressureRef.current) {
            pressureDots(ctx, smallX + smallW + 20, y, largeX - 20, y, timeRef.current, '#f59e0b', 16);
            ctx.strokeStyle = `rgba(245,158,11,${0.24 + 0.12 * Math.sin(timeRef.current * 3)})`;
            ctx.lineWidth = 5;
            [smallX + smallW / 2, largeX + largeW / 2].forEach((cx, index) => {
                ctx.beginPath();
                ctx.arc(cx, y - (index ? 78 : 54), 58 + 10 * Math.sin(timeRef.current * 2 + index), 0, Math.PI * 2);
                ctx.stroke();
            });
        }

        ctx.fillStyle = '#334155';
        roundRect(ctx, smallX + 12, y - 170 + leftTravel, smallW - 24, 28, 8);
        ctx.fill();
        roundRect(ctx, largeX + 18, y - 235 - rightLift, largeW - 36, 30, 8);
        ctx.fill();
        ctx.fillStyle = '#475569';
        roundRect(ctx, largeX - 8, y - 214 - rightLift, largeW + 16, 18, 9);
        ctx.fill();
        drawCar(ctx, largeX + largeW / 2, y - 278 - rightLift, 0.78);

        if (forcesRef.current) {
            arrow(ctx, smallX + smallW / 2, y - 240, smallX + smallW / 2, y - 150 + leftTravel, '#dc2626');
            label(ctx, 'F1', smallX + smallW / 2 + 38, y - 205, 17, 900, '#dc2626');
            arrow(ctx, largeX + largeW / 2, y - 230, largeX + largeW / 2, y - 310 - rightLift, '#16a34a');
            label(ctx, 'F2', largeX + largeW / 2 + 45, y - 282 - rightLift, 17, 900, '#16a34a');
        }

        label(ctx, `A1, r=${rSmall} cm`, smallX + smallW / 2, y + 110, 16, 900, '#0f172a');
        label(ctx, `A2, r=${rLarge} cm`, largeX + largeW / 2, y + 110, 16, 900, '#0f172a');
        label(ctx, 'L1 A1 = L2 A2', W / 2, 680, 17, 900, '#0f172a');
        if (equationsRef.current) label(ctx, `mechanical advantage = A2/A1 = ${advantage.toFixed(1)}x`, W / 2, 724, 14, 900, '#64748b');
    }, [title]);

    const drawBrakeMode = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
        const brake = brakeRef.current;
        const isLiquid = liquidBrakeRef.current;
        const pedal = pedalForceRef.current / 500;
        const target = pedal * (isLiquid ? 1 : 0.45);
        brake.pressure = lerp(brake.pressure, target, Math.min(1, dt * 7));
        const contact = brake.pressure > 0.64 && isLiquid;
        brake.discSpeed = clamp(brake.discSpeed + (contact ? -pedal * 6 * dt : 1.2 * dt), 0.2, 7);
        brake.discAngle += brake.discSpeed * dt;
        if (contact && brake.discSpeed > 2.5 && brake.sparks.length < 35) {
            brake.sparks.push({ x: 1000, y: 355, vx: 90 + Math.random() * 130, vy: -80 - Math.random() * 90, life: 0.55, maxLife: 0.55 });
        }
        brake.sparks.forEach((spark) => {
            spark.x += spark.vx * dt;
            spark.y += spark.vy * dt;
            spark.vy += 200 * dt;
            spark.life -= dt;
        });
        brake.sparks = brake.sparks.filter((spark) => spark.life > 0);

        title(ctx, 'Hydraulic Brake: Equal Pressure To Four Wheels', 'Brake oil transmits pressure simultaneously through every wheel cylinder');
        const oil = `rgba(245,158,11,${0.35 + brake.pressure * 0.35})`;
        const masterX = 210;
        const masterY = 355;
        cylinder(ctx, masterX, masterY - 58, 175, 116, oil);
        ctx.fillStyle = '#334155';
        roundRect(ctx, masterX + 22 + brake.pressure * 90, masterY - 52, 18, 104, 6);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(masterX + 20, masterY);
        ctx.lineTo(135, masterY + 70);
        ctx.stroke();
        ctx.save();
        ctx.translate(128, masterY + 78);
        ctx.rotate(-0.38 * pedal);
        ctx.fillStyle = '#dc2626';
        roundRect(ctx, -14, -60, 28, 120, 8);
        ctx.fill();
        ctx.restore();
        label(ctx, 'master cylinder', masterX + 88, masterY - 88, 14, 900, '#0f172a');

        const lineY = 355;
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(masterX + 175, lineY);
        ctx.lineTo(1080, lineY);
        ctx.stroke();
        ctx.strokeStyle = oil;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(masterX + 175, lineY);
        ctx.lineTo(1080, lineY);
        ctx.stroke();
        pressureDots(ctx, masterX + 190, lineY, 1060, lineY, timeRef.current * (isLiquid ? 1.4 : 0.55), isLiquid ? '#f59e0b' : '#fbbf24', isLiquid ? 20 : 10);

        if (pressureRef.current && isLiquid) {
            ctx.strokeStyle = `rgba(245,158,11,${0.25 + 0.18 * Math.sin(timeRef.current * 3)})`;
            ctx.lineWidth = 5;
            for (let i = 0; i < 4; i += 1) {
                ctx.beginPath();
                ctx.arc(masterX + 220 + ((timeRef.current * 160 + i * 160) % 670), lineY, 22 + i * 4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        const wheelPoints = fourWheelsRef.current ? [[740, 235], [1000, 235], [740, 535], [1000, 535]] : [[1000, 355]];
        wheelPoints.forEach(([x, y], i) => {
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(x, lineY);
            ctx.lineTo(x, y);
            ctx.stroke();
            pressureDots(ctx, x, lineY, x, y, timeRef.current + i * 0.2, isLiquid ? '#f59e0b' : '#fbbf24', 5);
            if (contact) {
                ctx.save();
                ctx.strokeStyle = `rgba(220,38,38,${0.16 + 0.12 * Math.sin(timeRef.current * 8 + i)})`;
                ctx.lineWidth = 7;
                ctx.beginPath();
                ctx.arc(x, y, 72, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            disc(ctx, x, y, 58, brake.discAngle + i);
            const padShift = brake.pressure * (isLiquid ? 30 : 16);
            ctx.fillStyle = '#7c2d12';
            roundRect(ctx, x - 86 + padShift, y - 35, 18, 70, 5);
            ctx.fill();
            roundRect(ctx, x + 68 - padShift, y - 35, 18, 70, 5);
            ctx.fill();
            if (!isLiquid) {
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = '#fde68a';
                for (let b = 0; b < 4; b += 1) {
                    ctx.beginPath();
                    ctx.arc(x - 36 + b * 23, y - 24 + Math.sin(timeRef.current * 2 + b + i) * 18, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }
        });
        brake.sparks.forEach((spark) => {
            ctx.globalAlpha = clamp(spark.life / spark.maxLife, 0, 1);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(spark.x, spark.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        label(ctx, isLiquid ? 'liquid: pressure reaches every wheel' : 'gas comparison: compression weakens braking', W / 2, 690, 16, 900, isLiquid ? '#16a34a' : '#d97706');
        if (equationsRef.current) label(ctx, 'Pascal law: external pressure is transmitted undiminished and equally in all directions', W / 2, 724, 13, 900, '#64748b');
    }, [title]);

    const drawBarometerMode = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
        const targetCm = (atmKpaRef.current * 1000) / (13600 * G) * 100;
        brakeRef.current.mercuryCm = lerp(brakeRef.current.mercuryCm, targetCm, Math.min(1, dt * 6));
        const cm = brakeRef.current.mercuryCm;
        title(ctx, 'Mercury Barometer', 'Atmospheric pressure supports a mercury column in an inverted tube');
        const troughX = 340;
        const troughY = 600;
        const tubeX = 600;
        const tubeTop = 135;
        const tubeBottom = troughY + 8;
        roundRect(ctx, troughX, troughY - 44, 560, 90, 24);
        ctx.fillStyle = '#cbd5e1';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#64748b';
        ctx.fillRect(troughX + 20, troughY - 18, 520, 48);
        ctx.globalAlpha = 1;
        glassSheen(ctx, troughX, troughY - 44, 560, 90, 24);
        drawWave(ctx, troughX + 30, troughY - 18, 500, 3, timeRef.current, 'rgba(255,255,255,0.52)');

        roundRect(ctx, tubeX - 38, tubeTop, 76, tubeBottom - tubeTop, 28);
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.stroke();
        glassSheen(ctx, tubeX - 38, tubeTop, 76, tubeBottom - tubeTop, 28);
        const pxPerCm = 5.2;
        const mercuryTop = tubeBottom - cm * pxPerCm;
        const metal = ctx.createLinearGradient(tubeX - 28, mercuryTop, tubeX + 28, tubeBottom);
        metal.addColorStop(0, '#cbd5e1');
        metal.addColorStop(0.48, '#64748b');
        metal.addColorStop(1, '#334155');
        ctx.fillStyle = metal;
        roundRect(ctx, tubeX - 28, mercuryTop, 56, tubeBottom - mercuryTop, 18);
        ctx.fill();
        drawWave(ctx, tubeX - 23, mercuryTop + 4, 46, 2, timeRef.current * 1.7, 'rgba(255,255,255,0.58)');
        label(ctx, 'vacuum', tubeX, mercuryTop - 28, 14, 900, '#475569');
        label(ctx, 'Hg vapour approx 0 Pa', tubeX + 108, mercuryTop - 6, 13, 900, '#64748b', 'left');
        arrow(ctx, troughX + 500, troughY - 120, troughX + 500, troughY - 48, '#475569');
        arrow(ctx, troughX + 430, troughY - 100 + Math.sin(timeRef.current * 2) * 4, troughX + 430, troughY - 48, '#64748b');
        arrow(ctx, troughX + 570, troughY - 100 + Math.cos(timeRef.current * 2) * 4, troughX + 570, troughY - 48, '#64748b');
        label(ctx, 'atmospheric pressure', troughX + 500, troughY - 140, 14, 900, '#475569');
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tubeX + 70, mercuryTop);
        ctx.lineTo(tubeX + 70, tubeBottom);
        ctx.stroke();
        label(ctx, `${cm.toFixed(1)} cm Hg`, tubeX + 86, (mercuryTop + tubeBottom) / 2, 15, 900, '#d97706', 'left');
        label(ctx, 'Torricelli 1608-1647', W / 2, 690, 17, 900, '#0f172a');
        if (equationsRef.current) label(ctx, 'Pa = rho_Hg g h; 76 cm Hg = 1 atm', W / 2, 724, 14, 900, '#64748b');
    }, [title]);

    const drawManometerMode = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
        const liquid = MANO_LIQUIDS[manoLiquidRef.current];
        const gauge = (systemKpaRef.current - atmKpaRef.current) * 1000;
        const hCm = Math.abs(gauge) / (liquid.rho * G) * 100;
        brakeRef.current.manoCm = lerp(brakeRef.current.manoCm, hCm, Math.min(1, dt * 6));
        const displayCm = brakeRef.current.manoCm;
        title(ctx, 'Open-Tube Manometer', 'Gauge pressure is proportional to the liquid height difference');

        roundRect(ctx, 260, 235, 260, 190, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.stroke();
        glassSheen(ctx, 260, 235, 260, 190, 24);
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = systemKpaRef.current >= atmKpaRef.current ? '#0ea5e9' : '#f59e0b';
        for (let i = 0; i < 14; i += 1) {
            const px = 292 + ((i * 41 + timeRef.current * 28) % 196);
            const py = 270 + ((i * 31 + Math.sin(timeRef.current + i) * 10) % 112);
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        label(ctx, 'gas vessel', 390, 215, 16, 900, '#0f172a');

        const ux = 660;
        const uy = 185;
        const armH = 420;
        const baseY = uy + armH;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ux, uy);
        ctx.lineTo(ux, baseY);
        ctx.quadraticCurveTo(ux, baseY + 70, ux + 190, baseY);
        ctx.lineTo(ux + 190, uy);
        ctx.stroke();

        const levelOffset = clamp(displayCm * 2.4, 0, 180);
        const leftLevel = gauge >= 0 ? 405 + levelOffset / 2 : 405 - levelOffset / 2;
        const rightLevel = gauge >= 0 ? 405 - levelOffset / 2 : 405 + levelOffset / 2;
        ctx.strokeStyle = liquid.bottom;
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(ux, leftLevel);
        ctx.lineTo(ux, baseY);
        ctx.quadraticCurveTo(ux, baseY + 58, ux + 190, baseY);
        ctx.lineTo(ux + 190, rightLevel);
        ctx.stroke();
        drawWave(ctx, ux - 8, leftLevel, 16, 2.2, timeRef.current * 2.2, 'rgba(255,255,255,0.72)');
        drawWave(ctx, ux + 182, rightLevel, 16, 2.2, timeRef.current * 2.2 + 1, 'rgba(255,255,255,0.72)');
        pressureDots(ctx, 520, 330, ux - 10, 330, timeRef.current, gauge >= 0 ? '#0ea5e9' : '#f59e0b', 7);

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ux + 235, leftLevel);
        ctx.lineTo(ux + 235, rightLevel);
        ctx.stroke();
        label(ctx, `h = ${displayCm.toFixed(1)} cm`, ux + 252, (leftLevel + rightLevel) / 2, 15, 900, '#d97706', 'left');
        label(ctx, 'open to atmosphere', ux + 190, uy - 24, 14, 900, '#475569');
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(520, 330);
        ctx.lineTo(ux, 330);
        ctx.stroke();
        if (equationsRef.current) label(ctx, 'Gauge pressure: P - Pa = rho g h', W / 2, 724, 14, 900, '#64748b');
    }, [title]);

    useEffect(() => {
        const draw = (now: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            const last = lastRef.current ?? now;
            const dt = Math.min((now - last) / 1000, 0.1);
            lastRef.current = now;
            if (!pausedRef.current) timeRef.current += dt * speedRef.current;

            background(ctx);
            const effectiveDt = pausedRef.current ? 0 : dt * speedRef.current;
            if (modeRef.current === 'depth') drawDepthMode(ctx);
            else if (modeRef.current === 'paradox') drawParadoxMode(ctx);
            else if (modeRef.current === 'brake') drawBrakeMode(ctx, effectiveDt);
            else if (modeRef.current === 'barometer') drawBarometerMode(ctx, effectiveDt);
            else if (modeRef.current === 'manometer') drawManometerMode(ctx, effectiveDt);
            else drawLiftMode(ctx, effectiveDt);
            rafRef.current = requestAnimationFrame(draw);
        };
        rafRef.current = requestAnimationFrame(draw);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [drawBarometerMode, drawBrakeMode, drawDepthMode, drawLiftMode, drawManometerMode, drawParadoxMode]);

    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Pressure Depth Graph</h3>
                    <p className="text-xs font-semibold text-slate-500">P = Pa + rho g h is linear in h.</p>
                    <svg viewBox="0 0 300 160" className="mt-2 h-[160px] w-full">
                        <line x1="34" y1="130" x2="282" y2="130" stroke="#64748b" strokeWidth="2" />
                        <line x1="34" y1="18" x2="34" y2="130" stroke="#64748b" strokeWidth="2" />
                        <path d="M34 124 L272 30" fill="none" stroke="#0891b2" strokeWidth="5" strokeLinecap="round" />
                        <circle cx="58" cy="115" r="5" fill="#f59e0b" />
                        <text x="64" y="112" fontSize="12" fontWeight="800" fill="#0f172a">10 m: about 2 atm</text>
                        <text x="150" y="32" fontSize="12" fontWeight="800" fill="#0f172a">1000 m: 104 atm</text>
                        <text x="42" y="148" fontSize="11" fontWeight="800" fill="#64748b">depth</text>
                        <text x="4" y="22" fontSize="11" fontWeight="800" fill="#64748b">P</text>
                    </svg>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">NCERT Examples</h3>
                    <div className="mt-2 space-y-1.5 text-xs font-bold text-slate-700">
                        <p>Ex 9.2: swimmer 10 m deep gives 2.01 x 10^5 Pa, about 2 atm.</p>
                        <p>Ex 9.3: atmosphere height estimate = 7989 m, about 8 km.</p>
                        <p>Ex 9.4: submarine 1000 m gives 104 atm absolute, 103 atm gauge.</p>
                        <p>20 x 20 cm window force = 4.12 x 10^5 N.</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Pascal Machines</h3>
                    <div className="mt-2 space-y-1.5 text-xs font-bold text-slate-700">
                        <p>Ex 9.5: syringe diameters 1 cm and 3 cm, 10 N input gives 90 N output.</p>
                        <p>Small piston 6 cm gives large piston 0.67 cm by volume conservation.</p>
                        <p>Ex 9.6: 1.5 kN lifts a 1350 kg car with r1 = 5 cm and r2 = 15 cm.</p>
                    </div>
                </div>
            </div>
        </aside>
    ), []);

    const valuesPanel = useMemo(() => {
        const fluidData = FLUIDS[fluid];
        const modeHint: Record<Mode, string> = {
            depth: 'P increases linearly with depth and is independent of container shape.',
            paradox: 'Three shapes at the same height have the same bottom pressure.',
            lift: 'Pressure transmitted undiminished gives mechanical advantage A2/A1.',
            brake: 'Brake oil sends equal pressure to all four wheel cylinders.',
            barometer: '76 cm Hg corresponds to 1 atm at sea level.',
            manometer: 'Gauge pressure is proportional to column height difference.'
        };
        const rows = mode === 'depth' ? [
            ['Depth', `${depth} m`, 'bg-sky-50', 'text-sky-700'],
            ['Fluid density', `${fluidData.rho} kg/m3`, 'bg-cyan-50', 'text-cyan-700'],
            ['Gauge P', `${sci(depthValues.gauge)} Pa`, 'bg-amber-50', 'text-amber-700'],
            ['Absolute P', `${sci(depthValues.absolute)} Pa`, 'bg-emerald-50', 'text-emerald-700'],
            ['In atm', atmText(depthValues.absolute), 'bg-violet-50', 'text-violet-700']
        ] : mode === 'lift' ? [
            ['A1', `${(liftValues.a1 * 1e4).toFixed(1)} cm2`, 'bg-sky-50', 'text-sky-700'],
            ['A2', `${(liftValues.a2 * 1e4).toFixed(1)} cm2`, 'bg-cyan-50', 'text-cyan-700'],
            ['Pressure', `${sci(liftValues.pressure)} Pa`, 'bg-amber-50', 'text-amber-700'],
            ['Output F2', `${liftValues.force2.toFixed(0)} N`, 'bg-emerald-50', 'text-emerald-700'],
            ['A2/A1', `${liftValues.advantage.toFixed(1)}x`, 'bg-violet-50', 'text-violet-700']
        ] : mode === 'barometer' ? [
            ['Atmosphere', `${atmKpa.toFixed(1)} kPa`, 'bg-slate-50', 'text-slate-700'],
            ['Hg column', `${((atmKpa * 1000) / (13600 * G) * 100).toFixed(1)} cm`, 'bg-slate-50', 'text-slate-700'],
            ['Sea level', '76 cm Hg', 'bg-amber-50', 'text-amber-700'],
            ['Pressure', '1.013 x 10^5 Pa', 'bg-emerald-50', 'text-emerald-700'],
            ['Storm note', atmKpa < 100 ? 'approaching storm' : 'steady', 'bg-violet-50', 'text-violet-700']
        ] : mode === 'manometer' ? [
            ['System P', `${systemKpa.toFixed(1)} kPa`, 'bg-sky-50', 'text-sky-700'],
            ['Atmosphere', `${atmKpa.toFixed(1)} kPa`, 'bg-slate-50', 'text-slate-700'],
            ['Gauge P', `${sci(manometerValues.gauge)} Pa`, 'bg-amber-50', 'text-amber-700'],
            ['Height diff', `${manometerValues.hCm.toFixed(1)} cm`, 'bg-emerald-50', 'text-emerald-700']
        ] : mode === 'brake' ? [
            ['Pedal force', `${pedalForce} N`, 'bg-red-50', 'text-red-700'],
            ['Medium', liquidBrake ? 'liquid' : 'gas compare', 'bg-amber-50', 'text-amber-700'],
            ['Wheel cylinders', fourWheels ? '4 wheels' : '1 wheel', 'bg-sky-50', 'text-sky-700'],
            ['Transmission', liquidBrake ? 'equal' : 'compressed', 'bg-emerald-50', 'text-emerald-700']
        ] : [
            ['Fluid', FLUIDS[fluid].label, 'bg-sky-50', 'text-sky-700'],
            ['Vessel scale', `${vesselScale}%`, 'bg-amber-50', 'text-amber-700'],
            ['Bottom pressure', 'same level', 'bg-emerald-50', 'text-emerald-700']
        ];

        return (
            <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
                <div className="flex flex-col gap-3">
                    <div className="rounded-2xl border border-sky-200 bg-sky-50/95 p-4 shadow-xl backdrop-blur">
                        <div className="flex items-start gap-2">
                            <Droplet size={19} className="mt-0.5 text-sky-800" />
                            <div>
                                <h3 className="text-base font-extrabold text-sky-950">Fluid Pressure</h3>
                                <p className="text-xs font-semibold text-sky-700">NCERT Class 11 Physics Sec 9.2</p>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-sky-950">
                            <p>P = F / A; unit: Pascal = N/m2. Pressure is a scalar.</p>
                            <p>Surface force comes from molecular collisions with the boundary.</p>
                            <p>P = Pa + rho g h. Pa is the weight of the air column above unit area; Pa = 1.013 x 10^5 Pa = 1 atm.</p>
                            <p>Pascal law: external pressure on an enclosed fluid is transmitted undiminished equally in all directions.</p>
                            <p>Hydraulic lift: F2 = (A2 / A1) F1, L1 A1 = L2 A2, and F1 L1 = F2 L2.</p>
                            <p>Barometer: Pa = rho_Hg g h; 76 cm Hg = 760 mm Hg = 760 torr = 1.013 bar.</p>
                            <p>1 torr = 133 Pa; 1 bar = 10^5 Pa. Torricelli 1608-1647.</p>
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
                        <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">{modeHint[mode]}</p>
                        <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">Canonical values shown: Ex 9.2, Ex 9.3, Ex 9.4, Ex 9.5 and Ex 9.6.</p>
                    </div>
                </div>
            </aside>
        );
    }, [atmKpa, depth, depthValues, fluid, fourWheels, liftValues, liquidBrake, manometerValues, mode, pedalForce, systemKpa, vesselScale]);

    const controls = (
        <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                    <Droplet size={17} />
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900">Fluid Pressure Bench</div>
                    <div className="text-[11px] font-bold text-slate-500">{mode}</div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
                {MODES.map((item) => (
                    <button key={item.id} onClick={() => setMode(item.id)} className={`flex min-h-[40px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-black ${mode === item.id ? 'border-sky-400 bg-sky-100 text-sky-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </div>
            {mode === 'depth' && (
                <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>Depth</span><output>{depth} m</output></div>
                        <input type="range" min={0} max={1000} step={10} value={depth} onChange={(event) => setDepth(Number(event.target.value))} className="w-full accent-sky-600" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs font-black text-slate-700">Fluid</span>
                        <select value={fluid} onChange={(event) => setFluid(event.target.value as FluidId)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold">
                            <option value="water">water</option>
                            <option value="seawater">seawater</option>
                            <option value="mercury">mercury</option>
                        </select>
                    </label>
                </div>
            )}
            {mode === 'paradox' && (
                <label className="space-y-1.5">
                    <div className="flex justify-between text-xs font-black text-slate-700"><span>Shape spread</span><output>{vesselScale}%</output></div>
                    <input type="range" min={0} max={100} step={5} value={vesselScale} onChange={(event) => setVesselScale(Number(event.target.value))} className="w-full accent-sky-600" />
                </label>
            )}
            {mode === 'lift' && (
                <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>F1</span><output>{force1} N</output></div>
                        <input type="range" min={10} max={500} step={10} value={force1} onChange={(event) => setForce1(Number(event.target.value))} className="w-full accent-red-600" />
                    </label>
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>Mass</span><output>{loadMass} kg</output></div>
                        <input type="range" min={250} max={2000} step={50} value={loadMass} onChange={(event) => setLoadMass(Number(event.target.value))} className="w-full accent-emerald-600" />
                    </label>
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>r1</span><output>{r1} cm</output></div>
                        <input type="range" min={1} max={10} step={1} value={r1} onChange={(event) => setR1(Number(event.target.value))} className="w-full accent-amber-600" />
                    </label>
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>r2</span><output>{r2} cm</output></div>
                        <input type="range" min={5} max={30} step={1} value={r2} onChange={(event) => setR2(Number(event.target.value))} className="w-full accent-violet-600" />
                    </label>
                </div>
            )}
            {mode === 'brake' && (
                <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>Pedal</span><output>{pedalForce} N</output></div>
                        <input type="range" min={0} max={500} step={10} value={pedalForce} onChange={(event) => setPedalForce(Number(event.target.value))} className="w-full accent-red-600" />
                    </label>
                    <button onClick={() => setFourWheels((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${fourWheels ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600'}`}>{fourWheels ? '4 wheels' : '1 wheel'}</button>
                    <button onClick={() => setLiquidBrake((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${liquidBrake ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>{liquidBrake ? 'Liquid' : 'Gas compare'}</button>
                </div>
            )}
            {mode === 'barometer' && (
                <label className="space-y-1.5">
                    <div className="flex justify-between text-xs font-black text-slate-700"><span>Atmosphere</span><output>{atmKpa.toFixed(1)} kPa</output></div>
                    <input type="range" min={80} max={110} step={0.5} value={atmKpa} onChange={(event) => setAtmKpa(Number(event.target.value))} className="w-full accent-slate-600" />
                </label>
            )}
            {mode === 'manometer' && (
                <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5">
                        <div className="flex justify-between text-xs font-black text-slate-700"><span>System</span><output>{systemKpa} kPa</output></div>
                        <input type="range" min={50} max={200} step={1} value={systemKpa} onChange={(event) => setSystemKpa(Number(event.target.value))} className="w-full accent-sky-600" />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs font-black text-slate-700">Liquid</span>
                        <select value={manoLiquid} onChange={(event) => setManoLiquid(event.target.value as ManometerLiquid)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold">
                            <option value="oil">oil</option>
                            <option value="mercury">mercury</option>
                        </select>
                    </label>
                </div>
            )}
            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setShowPressure((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showPressure ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-500'}`}>{showPressure ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} Field</button>
                <button onClick={() => setShowForces((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showForces ? 'border-red-300 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-500'}`}><Activity size={15} className="mx-auto" /> Force</button>
                <button onClick={() => setShowEquations((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showEquations ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-500'}`}><Gauge size={15} className="mx-auto" /> Eqn</button>
                <label className="rounded-lg border border-slate-200 bg-white p-2 text-xs font-black text-slate-700">
                    Speed
                    <input type="range" min={0.3} max={2} step={0.1} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="mt-1 w-full accent-slate-600" />
                </label>
            </div>
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

export default HydraulicBrakeLab;
