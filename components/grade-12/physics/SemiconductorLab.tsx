import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, FastForward, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface SemiconductorLabProps {
    topic: any;
    onExit: () => void;
}

type MaterialKey = 'Si' | 'Ge';
type Mode = 'formation' | 'forward' | 'reverse';
type Phase = 'initial' | 'diffusion' | 'depletion' | 'efield' | 'equilibrium';
type CarrierType = 'hole' | 'electron';

interface MaterialInfo {
    key: MaterialKey;
    name: string;
    barrier: number;
    cutIn: number;
    breakdown: number;
}

interface Carrier {
    id: number;
    type: CarrierType;
    x: number;
    y: number;
    vx: number;
    vy: number;
    role: 'majority' | 'minority' | 'injected';
    trail: { x: number; y: number }[];
    life: number;
}

interface Flash {
    x: number;
    y: number;
    age: number;
    duration: number;
}

interface SimState {
    carriers: Carrier[];
    flashes: Flash[];
    exposedPairs: number;
    depletionWidth: number;
    ammeter: number;
    spawnAccum: number;
    minorityAccum: number;
    time: number;
}

const MATERIALS: Record<MaterialKey, MaterialInfo> = {
    Si: { key: 'Si', name: 'Silicon', barrier: 0.7, cutIn: 0.7, breakdown: 42 },
    Ge: { key: 'Ge', name: 'Germanium', barrier: 0.3, cutIn: 0.2, breakdown: 28 }
};

const MAX_FORMATION_WIDTH = 92;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const forwardCurrentMA = (voltage: number, material: MaterialInfo) => {
    if (voltage <= 0) return 0;
    if (voltage < material.cutIn) return 0.02 * Math.exp((voltage - material.cutIn) * 3);
    return clamp(0.08 * Math.exp((voltage - material.cutIn) * 4.3), 0, 75);
};

const reverseCurrentMicroA = (reverseVoltage: number, material: MaterialInfo) => {
    if (reverseVoltage <= 0) return 0;
    if (reverseVoltage < material.breakdown) {
        return 2.2 * (1 - Math.exp(-reverseVoltage / 0.9));
    }
    return clamp(8 + Math.pow(reverseVoltage - material.breakdown, 2) * 1.2, 0, 85);
};

const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};

const SemiconductorLab: React.FC<SemiconductorLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number | null>(null);
    const carrierIdRef = useRef(0);
    const lastTimeRef = useRef(0);
    const simRef = useRef<SimState>({
        carriers: [],
        flashes: [],
        exposedPairs: 0,
        depletionWidth: 0,
        ammeter: 0,
        spawnAccum: 0,
        minorityAccum: 0,
        time: 0
    });

    const [isPlaying, setIsPlaying] = useState(true);
    const [materialKey, setMaterialKey] = useState<MaterialKey>('Si');
    const [mode, setMode] = useState<Mode>('formation');
    const [phase, setPhase] = useState<Phase>('initial');
    const [joined, setJoined] = useState(false);
    const [voltage, setVoltage] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [showForces, setShowForces] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [displayCurrent, setDisplayCurrent] = useState(0);

    const material = MATERIALS[materialKey];
    const effectiveBarrier = useMemo(() => {
        if (mode === 'forward') return Math.max(0, material.barrier - voltage);
        if (mode === 'reverse') return material.barrier + Math.abs(voltage);
        return material.barrier;
    }, [material.barrier, mode, voltage]);

    const diodeCurrent = useMemo(() => {
        if (mode === 'forward') {
            return forwardCurrentMA(voltage, material);
        }
        if (mode === 'reverse') {
            const reverseV = Math.abs(voltage);
            return reverseCurrentMicroA(reverseV, material);
        }
        return 0;
    }, [material, mode, voltage]);

    const displayedBarrier = mode === 'formation'
        ? material.barrier * clamp(simRef.current.depletionWidth / MAX_FORMATION_WIDTH, 0, 1)
        : effectiveBarrier;

    const resetSimulation = useCallback((nextMode: Mode = mode) => {
        simRef.current = {
            carriers: [],
            flashes: [],
            exposedPairs: nextMode === 'formation' ? 0 : 55,
            depletionWidth: nextMode === 'formation' ? 0 : MAX_FORMATION_WIDTH,
            ammeter: 0,
            spawnAccum: 0,
            minorityAccum: 0,
            time: 0
        };
        carrierIdRef.current = 0;
        setJoined(nextMode !== 'formation');
        setPhase(nextMode === 'formation' ? 'initial' : 'equilibrium');
        setVoltage(0);
        setIsPlaying(true);
        setDisplayCurrent(0);
    }, [mode]);

    const handleModeChange = (nextMode: Mode) => {
        setMode(nextMode);
        resetSimulation(nextMode);
    };

    const handleReset = () => {
        resetSimulation(mode);
    };

    const handleJoin = () => {
        if (mode !== 'formation' || joined) return;
        setJoined(true);
        setPhase('diffusion');
        setIsPlaying(true);
    };

    const handleNextPhase = () => {
        if (mode !== 'formation') return;
        if (!joined) {
            handleJoin();
            return;
        }
        const sim = simRef.current;
        if (phase === 'diffusion') {
            sim.exposedPairs = Math.max(sim.exposedPairs, 18);
            setPhase('depletion');
        } else if (phase === 'depletion') {
            sim.exposedPairs = Math.max(sim.exposedPairs, 34);
            setPhase('efield');
        } else if (phase === 'efield') {
            sim.exposedPairs = Math.max(sim.exposedPairs, 55);
            setPhase('equilibrium');
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        if (!canvas || !parent) return;

        const resize = () => {
            const rect = parent.getBoundingClientRect();
            canvas.width = Math.max(1, Math.round(rect.width));
            canvas.height = Math.max(1, Math.round(rect.height));
        };

        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(parent);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const animate = (timeMs: number) => {
            const dt = Math.min((timeMs - (lastTimeRef.current || timeMs)) / 1000, 0.1) * speed;
            lastTimeRef.current = timeMs;

            if (isPlaying) {
                updateSimulation(dt, canvas.width, canvas.height);
            }

            drawScene(ctx, canvas.width, canvas.height, timeMs / 1000);
            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        };
    }, [isPlaying, mode, phase, joined, materialKey, voltage, speed, showForces, showLabels, effectiveBarrier, diodeCurrent]);

    const getLayout = (width: number, height: number) => {
        const pad = 26;
        const statusH = 54;
        return {
            pad,
            statusH,
            main: { x: pad, y: statusH + pad, w: width - pad * 2, h: height - statusH - pad * 2 }
        };
    };

    const addCarrier = (
        type: CarrierType,
        x: number,
        y: number,
        role: Carrier['role'],
        vx = 0,
        vy = 0
    ) => {
        simRef.current.carriers.push({
            id: carrierIdRef.current++,
            type,
            x,
            y,
            vx,
            vy,
            role,
            trail: [],
            life: 0
        });
    };

    const seedCarriers = (width: number, height: number) => {
        const sim = simRef.current;
        if (sim.carriers.length > 0) return;
        const { main } = getLayout(width, height);
        const junctionX = main.x + main.w * 0.5;
        const top = main.y + 80;
        const bottom = main.y + main.h - 122;

        for (let i = 0; i < 42; i++) {
            addCarrier('hole', main.x + 44 + Math.random() * (junctionX - main.x - 90), top + Math.random() * (bottom - top), 'majority', (Math.random() - 0.5) * 36, (Math.random() - 0.5) * 36);
            addCarrier('electron', junctionX + 44 + Math.random() * (main.x + main.w - junctionX - 90), top + Math.random() * (bottom - top), 'majority', (Math.random() - 0.5) * 36, (Math.random() - 0.5) * 36);
        }

        for (let i = 0; i < 7; i++) {
            addCarrier('electron', main.x + 50 + Math.random() * (junctionX - main.x - 110), top + Math.random() * (bottom - top), 'minority');
            addCarrier('hole', junctionX + 50 + Math.random() * (main.x + main.w - junctionX - 110), top + Math.random() * (bottom - top), 'minority');
        }
    };

    const updateSimulation = (dt: number, width: number, height: number) => {
        if (width < 10 || height < 10) return;
        seedCarriers(width, height);

        const sim = simRef.current;
        const { main } = getLayout(width, height);
        const junctionX = main.x + main.w * 0.5;
        const top = main.y + 82;
        const bottom = main.y + main.h - (mode === 'formation' ? 112 : 154);
        const maxWidth = mode === 'forward'
            ? clamp(MAX_FORMATION_WIDTH * (1 - voltage / Math.max(material.barrier, 0.1)), 20, MAX_FORMATION_WIDTH)
            : mode === 'reverse'
                ? clamp(MAX_FORMATION_WIDTH + Math.abs(voltage) * 2.8, MAX_FORMATION_WIDTH, 185)
                : clamp((sim.exposedPairs / 55) * MAX_FORMATION_WIDTH, 0, MAX_FORMATION_WIDTH);

        sim.time += dt;
        sim.depletionWidth = lerp(sim.depletionWidth, maxWidth, 1 - Math.pow(0.001, dt));
        sim.ammeter = sim.ammeter * 0.92 + diodeCurrent * 0.08;
        setDisplayCurrent(sim.ammeter);

        if (mode === 'formation' && joined) {
            if (sim.exposedPairs >= 12 && phase === 'diffusion') setPhase('depletion');
            if (sim.exposedPairs >= 28 && phase === 'depletion') setPhase('efield');
            if (sim.exposedPairs >= 50 && phase === 'efield') setPhase('equilibrium');
            if (phase !== 'equilibrium') sim.exposedPairs = Math.min(55, sim.exposedPairs + dt * 7.5);
        }

        const depLeft = junctionX - sim.depletionWidth;
        const depRight = junctionX + sim.depletionWidth;

        if (mode === 'forward') {
            sim.spawnAccum += dt * (voltage < material.cutIn ? 4 : 10 + diodeCurrent * 1.2);
            while (sim.spawnAccum > 1) {
                sim.spawnAccum -= 1;
                addCarrier('hole', main.x + 46, top + Math.random() * (bottom - top), 'injected', 185 + Math.random() * 80, (Math.random() - 0.5) * 28);
                addCarrier('electron', main.x + main.w - 46, top + Math.random() * (bottom - top), 'injected', -185 - Math.random() * 80, (Math.random() - 0.5) * 28);
            }
        }

        if (mode === 'reverse') {
            sim.minorityAccum += dt * (Math.abs(voltage) > material.breakdown ? 18 : 0.9);
            while (sim.minorityAccum > 1) {
                sim.minorityAccum -= 1;
                addCarrier('electron', depLeft - 28, top + Math.random() * (bottom - top), 'minority', 150 + Math.random() * 80, (Math.random() - 0.5) * 20);
                addCarrier('hole', depRight + 28, top + Math.random() * (bottom - top), 'minority', -150 - Math.random() * 80, (Math.random() - 0.5) * 20);
            }
        }

        for (let i = sim.carriers.length - 1; i >= 0; i--) {
            const c = sim.carriers[i];
            c.life += dt;
            c.vx += (Math.random() - 0.5) * 70 * dt;
            c.vy += (Math.random() - 0.5) * 70 * dt;

            if (mode === 'formation') {
                if (!joined) {
                    if (c.type === 'hole' && c.x > junctionX - 16) c.vx -= 120 * dt;
                    if (c.type === 'electron' && c.x < junctionX + 16) c.vx += 120 * dt;
                } else if (phase === 'diffusion' || phase === 'depletion') {
                    if (c.type === 'hole' && c.role === 'majority') c.vx += 74 * dt;
                    if (c.type === 'electron' && c.role === 'majority') c.vx -= 74 * dt;
                } else {
                    const field = clamp(sim.depletionWidth / MAX_FORMATION_WIDTH, 0, 1);
                    if (c.type === 'hole' && c.x > depLeft && c.x < depRight) c.vx -= 140 * field * dt;
                    if (c.type === 'electron' && c.x > depLeft && c.x < depRight) c.vx += 140 * field * dt;
                    if (c.type === 'hole' && c.role === 'minority' && c.x > junctionX) c.vx -= 80 * field * dt;
                    if (c.type === 'electron' && c.role === 'minority' && c.x < junctionX) c.vx += 80 * field * dt;
                }
            }

            if (mode === 'forward' && c.role === 'injected') {
                if (c.type === 'hole') c.vx += 160 * dt;
                if (c.type === 'electron') c.vx -= 160 * dt;
            }

            if (mode === 'reverse' && c.role === 'minority') {
                if (c.type === 'electron') c.vx += 260 * dt;
                if (c.type === 'hole') c.vx -= 260 * dt;
            }

            c.vx = clamp(c.vx, -320, 320);
            c.vy = clamp(c.vy, -120, 120);
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.trail.push({ x: c.x, y: c.y });
            if (c.trail.length > 10) c.trail.shift();

            if (c.y < top) {
                c.y = top;
                c.vy = Math.abs(c.vy);
            }
            if (c.y > bottom) {
                c.y = bottom;
                c.vy = -Math.abs(c.vy);
            }

            const leftBound = main.x + 24;
            const rightBound = main.x + main.w - 24;
            if (mode === 'formation' && c.role !== 'injected') {
                if (c.x < leftBound) {
                    c.x = leftBound;
                    c.vx = Math.abs(c.vx);
                }
                if (c.x > rightBound) {
                    c.x = rightBound;
                    c.vx = -Math.abs(c.vx);
                }
            } else if (c.x < leftBound - 70 || c.x > rightBound + 70 || c.life > 10) {
                sim.carriers.splice(i, 1);
            }
        }

        if (mode === 'formation' && joined && phase !== 'equilibrium') {
            for (let i = sim.carriers.length - 1; i >= 0; i--) {
                const a = sim.carriers[i];
                if (a.type !== 'hole' || Math.abs(a.x - junctionX) > 125) continue;
                for (let j = sim.carriers.length - 1; j >= 0; j--) {
                    if (i === j) continue;
                    const b = sim.carriers[j];
                    if (b.type !== 'electron' || Math.abs(b.x - junctionX) > 125) continue;
                    if (Math.hypot(a.x - b.x, a.y - b.y) < 13) {
                        sim.flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, age: 0, duration: 0.3 });
                        sim.exposedPairs = Math.min(55, sim.exposedPairs + 2.4);
                        sim.carriers.splice(Math.max(i, j), 1);
                        sim.carriers.splice(Math.min(i, j), 1);
                        break;
                    }
                }
            }
        }

        sim.flashes = sim.flashes.filter(flash => {
            flash.age += dt;
            return flash.age < flash.duration;
        });
    };

    const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
        const sim = simRef.current;
        const layout = getLayout(width, height);
        const { main } = layout;
        const junctionX = main.x + main.w * 0.5;
        const depLeft = junctionX - sim.depletionWidth;
        const depRight = junctionX + sim.depletionWidth;

        ctx.clearRect(0, 0, width, height);
        drawBackground(ctx, width, height);
        drawStatus(ctx, width);
        drawJunction(ctx, main, junctionX, depLeft, depRight, time);
        drawCarriers(ctx);
        drawCircuit(ctx, main);
    };

    const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
        for (let x = 0; x < width; x += 34) {
            for (let y = 0; y < height; y += 34) {
                ctx.beginPath();
                ctx.arc(x, y, 0.9, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    const drawStatus = (ctx: CanvasRenderingContext2D, width: number) => {
        const phaseText = mode === 'formation'
            ? phase === 'initial'
                ? 'Ready: Separate P and N regions'
                : phase === 'diffusion'
                    ? 'Phase 1: Diffusion'
                    : phase === 'depletion'
                        ? 'Phase 2: Depletion forms'
                        : phase === 'efield'
                            ? 'Phase 3: E-field and drift'
                            : 'Phase 4: Equilibrium'
            : mode === 'forward'
                ? voltage > 0 ? 'Forward Bias: barrier reduced' : 'Forward Bias selected: increase voltage'
                : voltage < 0 ? 'Reverse Bias: barrier increased' : 'Reverse Bias selected: decrease voltage';

        const badgeX = 34;
        const badgeW = Math.max(220, Math.min(520, width - badgeX * 2));
        drawRoundRect(ctx, badgeX, 18, badgeW, 36, 18);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)';
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px Inter, ui-sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(phaseText, badgeX + badgeW / 2, 36);
    };

    const drawJunction = (
        ctx: CanvasRenderingContext2D,
        main: { x: number; y: number; w: number; h: number },
        junctionX: number,
        depLeft: number,
        depRight: number,
        time: number
    ) => {
        const sim = simRef.current;
        const regionY = main.y;
        const regionH = mode === 'formation' ? main.h - 92 : main.h - 132;
        const centerY = regionY + regionH * 0.5;

        drawRoundRect(ctx, main.x, regionY, main.w, regionH, 22);
        ctx.fillStyle = 'rgba(248, 250, 252, 0.88)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.save();
        drawRoundRect(ctx, main.x, regionY, main.w / 2, regionH, 22);
        ctx.clip();
        ctx.fillStyle = 'rgba(251, 207, 232, 0.17)';
        ctx.fillRect(main.x, regionY, main.w / 2, regionH);
        ctx.restore();

        ctx.save();
        drawRoundRect(ctx, junctionX, regionY, main.w / 2, regionH, 22);
        ctx.clip();
        ctx.fillStyle = 'rgba(191, 219, 254, 0.17)';
        ctx.fillRect(junctionX, regionY, main.w / 2, regionH);
        ctx.restore();

        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(junctionX, regionY + 18);
        ctx.lineTo(junctionX, regionY + regionH - 18);
        ctx.stroke();
        ctx.setLineDash([]);

        if (sim.depletionWidth > 2) {
            const depletionGradient = ctx.createLinearGradient(depLeft, 0, depRight, 0);
            depletionGradient.addColorStop(0, 'rgba(51, 65, 85, 0.35)');
            depletionGradient.addColorStop(0.5, 'rgba(148, 163, 184, 0.32)');
            depletionGradient.addColorStop(1, 'rgba(51, 65, 85, 0.35)');
            ctx.fillStyle = depletionGradient;
            ctx.fillRect(depLeft, regionY, depRight - depLeft, regionH);
            ctx.strokeStyle = 'rgba(203, 213, 225, 0.62)';
            ctx.setLineDash([6, 7]);
            ctx.beginPath();
            ctx.moveTo(depLeft, regionY);
            ctx.lineTo(depLeft, regionY + regionH);
            ctx.moveTo(depRight, regionY);
            ctx.lineTo(depRight, regionY + regionH);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        drawIonLattice(ctx, main, junctionX, depLeft, depRight, regionH);

        if (sim.depletionWidth > 12) {
            ctx.strokeStyle = '#f87171';
            ctx.fillStyle = '#f87171';
            ctx.lineWidth = 4;
            const arrowY = centerY - 22;
            const arrowLen = clamp(sim.depletionWidth * 1.55, 42, 250);
            ctx.beginPath();
            ctx.moveTo(junctionX + arrowLen / 2, arrowY);
            ctx.lineTo(junctionX - arrowLen / 2, arrowY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(junctionX - arrowLen / 2, arrowY);
            ctx.lineTo(junctionX - arrowLen / 2 + 16, arrowY - 9);
            ctx.lineTo(junctionX - arrowLen / 2 + 16, arrowY + 9);
            ctx.closePath();
            ctx.fill();
            ctx.font = 'bold 18px Inter, ui-sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('E field', junctionX, arrowY - 20);
        }

        if (showForces && joined) drawForceOverlay(ctx, main, junctionX);
        if (showLabels) drawLabels(ctx, main, junctionX, depLeft, depRight, regionH, time);

        for (const flash of sim.flashes) {
            const t = flash.age / flash.duration;
            ctx.strokeStyle = `rgba(250, 204, 21, ${1 - t})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(flash.x, flash.y, 8 + t * 26, 0, Math.PI * 2);
            ctx.stroke();
            const glow = ctx.createRadialGradient(flash.x, flash.y, 1, flash.x, flash.y, 36);
            glow.addColorStop(0, `rgba(250, 204, 21, ${0.45 * (1 - t)})`);
            glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(flash.x, flash.y, 36, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const drawIonLattice = (
        ctx: CanvasRenderingContext2D,
        main: { x: number; y: number; w: number; h: number },
        junctionX: number,
        depLeft: number,
        depRight: number,
        regionH: number
    ) => {
        const spacingX = 54;
        const spacingY = 46;
        const top = main.y + 68;
        const bottom = main.y + regionH - 52;
        ctx.font = 'bold 13px Inter, ui-sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let x = main.x + 38; x < junctionX - 16; x += spacingX) {
            for (let y = top; y < bottom; y += spacingY) {
                const exposed = x > depLeft && x < junctionX;
                drawIon(ctx, x, y, '-', exposed ? '#0284c7' : 'rgba(15, 23, 42, 0.24)', exposed);
            }
        }
        for (let x = junctionX + 38; x < main.x + main.w - 22; x += spacingX) {
            for (let y = top; y < bottom; y += spacingY) {
                const exposed = x < depRight && x > junctionX;
                drawIon(ctx, x, y, '+', exposed ? '#ea580c' : 'rgba(15, 23, 42, 0.24)', exposed);
            }
        }
    };

    const drawIon = (ctx: CanvasRenderingContext2D, x: number, y: number, sign: string, color: string, exposed: boolean) => {
        ctx.save();
        if (exposed) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
        }
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = exposed ? 1.8 : 1.1;
        ctx.beginPath();
        ctx.arc(x, y, exposed ? 10 : 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText(sign, x, y + 0.5);
        ctx.restore();
    };

    const drawLabels = (
        ctx: CanvasRenderingContext2D,
        main: { x: number; y: number; w: number; h: number },
        junctionX: number,
        depLeft: number,
        depRight: number,
        regionH: number,
        time: number
    ) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fb7185';
        ctx.font = 'bold 24px Inter, ui-sans-serif';
        ctx.fillText('P-Type', main.x + 28, main.y + 34);
        ctx.font = 'bold 14px Inter, ui-sans-serif';
        ctx.fillText('Acceptor doped, holes = majority', main.x + 28, main.y + 58);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 24px Inter, ui-sans-serif';
        ctx.fillText('N-Type', main.x + main.w - 28, main.y + 34);
        ctx.font = 'bold 14px Inter, ui-sans-serif';
        ctx.fillText('Donor doped, electrons = majority', main.x + main.w - 28, main.y + 58);

        if (simRef.current.depletionWidth > 18) {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#334155';
            ctx.font = 'bold 15px Inter, ui-sans-serif';
            ctx.fillText('Depletion Region (schematic, W ~ 0.1 micrometre)', junctionX, main.y + regionH - 26);
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
            ctx.lineWidth = 1.5;
            const y = main.y + regionH - 48;
            ctx.beginPath();
            ctx.moveTo(depLeft, y);
            ctx.lineTo(depRight, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(depLeft, y);
            ctx.lineTo(depLeft + 10, y - 5);
            ctx.lineTo(depLeft + 10, y + 5);
            ctx.moveTo(depRight, y);
            ctx.lineTo(depRight - 10, y - 5);
            ctx.lineTo(depRight - 10, y + 5);
            ctx.stroke();
            ctx.fillText('W', junctionX, y - 12);
        }

        if (mode === 'formation' && !joined) {
            ctx.fillStyle = `rgba(45, 212, 191, ${0.55 + 0.35 * Math.sin(time * 3)})`;
            ctx.font = 'bold 12px Inter, ui-sans-serif';
            ctx.fillText('Click JOIN P-N JUNCTION to begin diffusion', junctionX, main.y + regionH - 18);
        }
    };

    const drawForceOverlay = (
        ctx: CanvasRenderingContext2D,
        main: { x: number; y: number; w: number; h: number },
        junctionX: number
    ) => {
        const sim = simRef.current;
        const x = junctionX - 166;
        const y = main.y + 84;
        drawRoundRect(ctx, x, y, 332, 82, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
        ctx.stroke();

        const diffusion = mode === 'forward' ? 1 : mode === 'reverse' ? 0.28 : phase === 'equilibrium' ? 0.72 : 0.95;
        const drift = mode === 'forward' ? 0.32 : mode === 'reverse' ? 1 : phase === 'equilibrium' ? 0.72 : clamp(sim.depletionWidth / MAX_FORMATION_WIDTH, 0.22, 1);

        drawArrow(ctx, x + 36, y + 28, x + 36 + 112 * diffusion, y + 28, '#22c55e');
        ctx.fillStyle = '#86efac';
        ctx.font = 'bold 11px Inter, ui-sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Diffusion current', x + 172, y + 32);

        drawArrow(ctx, x + 296, y + 58, x + 296 - 112 * drift, y + 58, '#ef4444');
        ctx.fillStyle = '#fca5a5';
        ctx.textAlign = 'right';
        ctx.fillText('Drift current', x + 158, y + 62);

        if (phase === 'equilibrium' && mode === 'formation') {
            ctx.fillStyle = '#6d28d9';
            ctx.textAlign = 'center';
            ctx.fillText('Equal currents -> net current = 0', junctionX, y + 76);
        }
    };

    const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - Math.cos(angle - 0.55) * 14, y2 - Math.sin(angle - 0.55) * 14);
        ctx.lineTo(x2 - Math.cos(angle + 0.55) * 14, y2 - Math.sin(angle + 0.55) * 14);
        ctx.closePath();
        ctx.fill();
    };

    const drawCarriers = (ctx: CanvasRenderingContext2D) => {
        for (const carrier of simRef.current.carriers) {
            const color = carrier.type === 'hole' ? '#fb7185' : '#60a5fa';
            ctx.save();
            for (let i = 0; i < carrier.trail.length; i++) {
                const p = carrier.trail[i];
                const alpha = (i + 1) / carrier.trail.length;
                ctx.globalAlpha = alpha * 0.22;
                if (carrier.type === 'hole') {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = carrier.role === 'minority' ? 0.78 : 1;
            ctx.shadowColor = color;
            ctx.shadowBlur = carrier.role === 'injected' ? 16 : 8;
            if (carrier.type === 'hole') {
                ctx.strokeStyle = color;
                ctx.lineWidth = carrier.role === 'minority' ? 1.7 : 2.4;
                ctx.beginPath();
                ctx.arc(carrier.x, carrier.y, carrier.role === 'minority' ? 4 : 6, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(carrier.x, carrier.y, carrier.role === 'minority' ? 3.2 : 5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    };

    const drawCircuit = (ctx: CanvasRenderingContext2D, main: { x: number; y: number; w: number; h: number }) => {
        if (mode === 'formation') {
            drawEnergyBands(ctx, main);
            return;
        }

        const y = main.y + main.h - 92;
        const pContact = main.x + 110;
        const nContact = main.x + main.w - 110;
        const batteryX = main.x + main.w * 0.49;
        const meterX = main.x + main.w * 0.72;

        ctx.strokeStyle = 'rgba(203, 213, 225, 0.72)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(pContact, main.y + main.h - 132);
        ctx.lineTo(pContact, y);
        ctx.lineTo(batteryX - 58, y);
        ctx.moveTo(batteryX + 58, y);
        ctx.lineTo(meterX - 46, y);
        ctx.moveTo(meterX + 46, y);
        ctx.lineTo(nContact, y);
        ctx.lineTo(nContact, main.y + main.h - 132);
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 16px Inter, ui-sans-serif';
        ctx.textAlign = 'center';
        const pSign = mode === 'forward' ? '+' : '-';
        const nSign = mode === 'forward' ? '-' : '+';
        ctx.fillText(pSign, pContact - 18, main.y + main.h - 136);
        ctx.fillText(nSign, nContact + 18, main.y + main.h - 136);

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(batteryX - 16, y - 28);
        ctx.lineTo(batteryX - 16, y + 28);
        ctx.moveTo(batteryX + 14, y - 16);
        ctx.lineTo(batteryX + 14, y + 16);
        ctx.stroke();
        ctx.fillStyle = mode === 'forward' ? '#34d399' : '#fb7185';
        ctx.font = 'bold 13px Inter, ui-sans-serif';
        ctx.fillText(`${voltage.toFixed(mode === 'forward' ? 2 : 1)} V`, batteryX, y - 44);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px Inter, ui-sans-serif';
        ctx.fillText('Battery', batteryX, y + 48);

        drawGauge(ctx, meterX, y, mode === 'forward' ? 'mA' : 'microA', displayCurrent, mode === 'forward' ? 75 : 90);
    };

    const drawGauge = (ctx: CanvasRenderingContext2D, x: number, y: number, unit: string, value: number, max: number) => {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.48)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const ratio = clamp(value / max, 0, 1);
        const angle = Math.PI * 0.78 + ratio * Math.PI * 1.44;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * 24, y + Math.sin(angle) * 24);
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px Inter, ui-sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit, x, y + 20);
        ctx.fillText(value.toFixed(unit === 'mA' ? 1 : 2), x, y - 14);
        ctx.restore();
    };

    const drawEnergyBands = (ctx: CanvasRenderingContext2D, main: { x: number; y: number; w: number; h: number }) => {
        const x = main.x + 24;
        const y = main.y + main.h - 82;
        const w = main.w - 48;
        drawRoundRect(ctx, x, y, w, 64, 12);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.15)';
        ctx.stroke();

        const mid = x + w / 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 28, y + 18);
        ctx.lineTo(mid - 28, y + 18);
        ctx.moveTo(mid + 28, y + 18);
        ctx.lineTo(x + w - 28, y + 18);
        ctx.stroke();
        ctx.strokeStyle = '#fb7185';
        ctx.beginPath();
        ctx.moveTo(x + 28, y + 46);
        ctx.lineTo(mid - 28, y + 46);
        ctx.moveTo(mid + 28, y + 46);
        ctx.lineTo(x + w - 28, y + 46);
        ctx.stroke();
        ctx.strokeStyle = '#facc15';
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(mid + 60, y + 25);
        ctx.lineTo(x + w - 42, y + 25);
        ctx.moveTo(x + 42, y + 39);
        ctx.lineTo(mid - 60, y + 39);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px Inter, ui-sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('p-type: acceptor level EA just above EV', x + 34, y + 60);
        ctx.textAlign = 'right';
        ctx.fillText('n-type: donor level ED just below EC', x + w - 34, y + 12);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('EC', x + w - 8, y + 21);
        ctx.fillStyle = '#fb7185';
        ctx.fillText('EV', x + w - 8, y + 49);
    };

    const drawGraphs = (ctx: CanvasRenderingContext2D, graph: { x: number; y: number; w: number; h: number }) => {
        drawRoundRect(ctx, graph.x, graph.y, graph.w, graph.h, 18);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.14)';
        ctx.stroke();

        const top = { x: graph.x + 20, y: graph.y + 44, w: graph.w - 40, h: graph.h * 0.38 };
        const bottom = { x: graph.x + 20, y: graph.y + graph.h * 0.55, w: graph.w - 40, h: graph.h * 0.36 };

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 14px Inter, ui-sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Barrier Potential vs Position', graph.x + 20, graph.y + 26);
        drawBarrierGraph(ctx, top);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 14px Inter, ui-sans-serif';
        ctx.fillText('V-I Characteristics', graph.x + 20, bottom.y - 18);
        drawIVGraph(ctx, bottom);
    };

    const drawGraphAxes = (ctx: CanvasRenderingContext2D, g: { x: number; y: number; w: number; h: number }) => {
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x, g.y + g.h);
        ctx.lineTo(g.x + g.w, g.y + g.h);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(g.x, g.y + (g.h * i) / 4);
            ctx.lineTo(g.x + g.w, g.y + (g.h * i) / 4);
            ctx.stroke();
        }
    };

    const drawBarrierGraph = (ctx: CanvasRenderingContext2D, g: { x: number; y: number; w: number; h: number }) => {
        drawGraphAxes(ctx, g);
        const barrier = displayedBarrier;
        const maxV = mode === 'reverse' ? material.barrier + material.breakdown : Math.max(material.barrier, 1);
        const curveH = clamp(barrier / maxV, 0, 1) * (g.h - 18);
        ctx.strokeStyle = '#a78bfa';
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const x = g.x + (g.w * i) / 100;
            const s = 1 / (1 + Math.exp(-(i - 50) / 7));
            const y = g.y + g.h - 10 - s * curveH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#c4b5fd';
        ctx.font = 'bold 11px Inter, ui-sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Barrier = ${barrier.toFixed(2)} V (${material.key})`, g.x + 8, g.y + 16);
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('P | depletion | N', g.x + g.w / 2, g.y + g.h + 14);
    };

    const drawIVGraph = (ctx: CanvasRenderingContext2D, g: { x: number; y: number; w: number; h: number }) => {
        drawGraphAxes(ctx, g);
        const midX = g.x + g.w * 0.45;
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.42)';
        ctx.beginPath();
        ctx.moveTo(midX, g.y);
        ctx.lineTo(midX, g.y + g.h);
        ctx.stroke();

        const mapForwardX = (v: number) => midX + (v / 2) * (g.w * 0.52);
        const mapForwardY = (current: number) => g.y + g.h - clamp(current / 75, 0, 1) * (g.h - 16) - 8;
        const mapReverseX = (v: number) => midX - (Math.abs(v) / Math.max(material.breakdown + 8, 1)) * (g.w * 0.42);
        const mapReverseY = (current: number) => {
            const value = Math.abs(current);
            return g.y + g.h - clamp(value / 90, 0, 1) * (g.h - 18) - 8;
        };

        ctx.strokeStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const v = (2 * i) / 100;
            const current = forwardCurrentMA(v, material);
            const x = mapForwardX(v);
            const y = mapForwardY(current);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#fb7185';
        ctx.shadowColor = '#fb7185';
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const v = -((material.breakdown + 8) * i) / 100;
            const rv = Math.abs(v);
            const current = reverseCurrentMicroA(rv, material);
            const x = mapReverseX(v);
            const y = mapReverseY(current);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#facc15';
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(mapForwardX(material.cutIn), g.y + 6);
        ctx.lineTo(mapForwardX(material.cutIn), g.y + g.h);
        ctx.moveTo(mapReverseX(-material.breakdown), g.y + 6);
        ctx.lineTo(mapReverseX(-material.breakdown), g.y + g.h);
        ctx.stroke();
        ctx.setLineDash([]);

        const pointX = mode === 'reverse' ? mapReverseX(voltage) : mapForwardX(mode === 'forward' ? voltage : 0);
        const pointY = mode === 'reverse' ? mapReverseY(diodeCurrent) : mapForwardY(mode === 'forward' ? diodeCurrent : 0);
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(pointX, pointY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, ui-sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Reverse: microamp scale', g.x + 4, g.y + 12);
        ctx.textAlign = 'right';
        ctx.fillText('Forward: mA scale', g.x + g.w - 4, g.y + 12);
    };

    const renderBarrierSvg = () => {
        const graphW = 318;
        const graphH = 176;
        const maxV = mode === 'reverse' ? material.barrier + 50 : Math.max(material.barrier, 1);
        const curveH = clamp(displayedBarrier / maxV, 0, 1) * (graphH - 22);
        const curve = Array.from({ length: 90 }, (_, index) => {
            const x = (graphW * index) / 89;
            const s = 1 / (1 + Math.exp(-(index - 44) / 6));
            const y = graphH - 14 - s * curveH;
            return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(' ');

        return (
            <svg viewBox={`0 0 ${graphW + 60} ${graphH + 62}`} className="h-[250px] w-full">
                <g transform="translate(38 12)">
                    <path d={`M0 0V${graphH}H${graphW}`} fill="none" stroke="rgba(15,23,42,0.48)" strokeWidth="1.4" />
                    {[1, 2, 3].map(line => (
                        <line key={line} x1="0" x2={graphW} y1={(graphH * line) / 4} y2={(graphH * line) / 4} stroke="rgba(15,23,42,0.10)" />
                    ))}
                    <rect x={graphW * 0.42} y="0" width={graphW * 0.18} height={graphH} fill="rgba(148,163,184,0.13)" />
                    <path d={curve} fill="none" stroke="#a78bfa" strokeWidth="3.2" />
                    <text x="8" y="18" className="fill-violet-700 text-[13px] font-bold">
                        Barrier = {displayedBarrier.toFixed(2)} V ({material.key})
                    </text>
                    <text x={graphW / 2} y={graphH + 34} textAnchor="middle" className="fill-slate-700 text-[12px] font-semibold">
                        Position across junction
                    </text>
                    <text x="-32" y="-3" className="fill-slate-700 text-[12px] font-semibold">V</text>
                    <text x={graphW * 0.5} y={graphH + 15} textAnchor="middle" className="fill-slate-500 text-[11px]">
                        P | depletion | N
                    </text>
                </g>
            </svg>
        );
    };

    const renderIvSvg = () => {
        const graphW = 318;
        const graphH = 190;
        const midX = graphW * 0.45;
        const mapForwardX = (v: number) => midX + (v / 2) * (graphW * 0.52);
        const mapForwardY = (current: number) => graphH - clamp(current / 75, 0, 1) * (graphH - 18) - 8;
        const mapReverseX = (v: number) => midX - (Math.abs(v) / Math.max(material.breakdown + 8, 1)) * (graphW * 0.42);
        const mapReverseY = (current: number) => graphH - clamp(Math.abs(current) / 90, 0, 1) * (graphH - 20) - 8;

        const forwardPath = Array.from({ length: 95 }, (_, index) => {
            const v = (2 * index) / 94;
            const current = forwardCurrentMA(v, material);
            return `${index === 0 ? 'M' : 'L'} ${mapForwardX(v).toFixed(1)} ${mapForwardY(current).toFixed(1)}`;
        }).join(' ');

        const reversePath = Array.from({ length: 95 }, (_, index) => {
            const v = -((material.breakdown + 8) * index) / 94;
            const rv = Math.abs(v);
            const current = reverseCurrentMicroA(rv, material);
            return `${index === 0 ? 'M' : 'L'} ${mapReverseX(v).toFixed(1)} ${mapReverseY(current).toFixed(1)}`;
        }).join(' ');

        const pointX = mode === 'reverse' ? mapReverseX(voltage) : mapForwardX(mode === 'forward' ? voltage : 0);
        const pointY = mode === 'reverse' ? mapReverseY(diodeCurrent) : mapForwardY(mode === 'forward' ? diodeCurrent : 0);

        return (
            <svg viewBox={`0 0 ${graphW + 60} ${graphH + 62}`} className="h-[264px] w-full">
                <g transform="translate(38 12)">
                    <path d={`M0 0V${graphH}H${graphW}`} fill="none" stroke="rgba(15,23,42,0.48)" strokeWidth="1.4" />
                    {[1, 2, 3].map(line => (
                        <line key={line} x1="0" x2={graphW} y1={(graphH * line) / 4} y2={(graphH * line) / 4} stroke="rgba(15,23,42,0.10)" />
                    ))}
                    <line x1={midX} x2={midX} y1="0" y2={graphH} stroke="rgba(15,23,42,0.30)" />
                    <path d={reversePath} fill="none" stroke="#fb7185" strokeWidth="3" />
                    <path d={forwardPath} fill="none" stroke="#22c55e" strokeWidth="3" />
                    <line x1={mapForwardX(material.cutIn)} x2={mapForwardX(material.cutIn)} y1="0" y2={graphH} stroke="#facc15" strokeDasharray="5 6" />
                    <line x1={mapReverseX(-material.breakdown)} x2={mapReverseX(-material.breakdown)} y1="0" y2={graphH} stroke="#facc15" strokeDasharray="5 6" />
                    <circle cx={pointX} cy={pointY} r="5.2" fill="#0f172a" />
                    <text x={mapForwardX(material.cutIn)} y={graphH + 17} textAnchor="middle" className="fill-yellow-700 text-[11px] font-bold">
                        cut-in
                    </text>
                    <text x={mapReverseX(-material.breakdown)} y={graphH + 17} textAnchor="middle" className="fill-yellow-700 text-[11px] font-bold">
                        Vbr
                    </text>
                    <text x="4" y="14" className="fill-rose-700 text-[11px] font-semibold">Reverse: microamp scale</text>
                    <text x={graphW - 4} y="14" textAnchor="end" className="fill-emerald-700 text-[11px] font-semibold">Forward: mA scale</text>
                    <text x={graphW / 2} y={graphH + 39} textAnchor="middle" className="fill-slate-700 text-[12px] font-semibold">
                        Applied voltage
                    </text>
                    <text x="-32" y="-3" className="fill-slate-700 text-[12px] font-semibold">I</text>
                </g>
            </svg>
        );
    };

    const readoutItems = [
        { label: 'Material', value: `${material.name} (${material.key})`, color: 'text-teal-700', bg: 'bg-teal-50' },
        { label: 'Built-in V0', value: `${material.barrier.toFixed(1)} V`, color: 'text-violet-700', bg: 'bg-violet-50' },
        { label: 'Effective Barrier', value: `${displayedBarrier.toFixed(2)} V`, color: 'text-indigo-700', bg: 'bg-indigo-50' },
        { label: 'Depletion Width', value: `${simRef.current.depletionWidth.toFixed(0)} px schematic`, color: 'text-slate-700', bg: 'bg-slate-50' },
        { label: 'Applied Voltage', value: `${voltage.toFixed(mode === 'forward' ? 2 : 1)} V`, color: mode === 'reverse' ? 'text-rose-700' : 'text-emerald-700', bg: mode === 'reverse' ? 'bg-rose-50' : 'bg-emerald-50' },
        { label: 'Current', value: `${displayCurrent.toFixed(mode === 'forward' ? 2 : 2)} ${mode === 'forward' ? 'mA' : mode === 'reverse' ? 'microA' : 'A'}`, color: 'text-yellow-700', bg: 'bg-yellow-50' }
    ];

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 z-20 hidden w-[380px] 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="mb-2">
                        <div className="text-lg font-extrabold text-slate-950">Barrier Potential vs Position</div>
                        <div className="mt-1 text-sm font-semibold text-slate-600">Updates with built-in and applied voltage</div>
                    </div>
                    {renderBarrierSvg()}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="mb-2">
                        <div className="text-lg font-extrabold text-slate-950">V-I Characteristics</div>
                        <div className="mt-1 text-sm font-semibold text-slate-600">Cut-in, reverse saturation, and breakdown</div>
                    </div>
                    {renderIvSvg()}
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 z-20 hidden w-[310px] 2xl:block">
            <div className="rounded-xl border border-teal-200 bg-teal-50/95 p-4 text-teal-950 shadow-xl backdrop-blur">
                <div className="text-base font-extrabold">P-N junction formation</div>
                <div className="mt-2 space-y-1.5 text-sm leading-snug text-teal-900">
                    <p>Majority carriers diffuse because of concentration gradient.</p>
                    <p>Fixed ions form a depletion region and internal E-field.</p>
                    <p>Physical slab joining is not practical at atomic scale; real junctions are made by doping one crystal region.</p>
                    <p className="font-semibold">Equilibrium: diffusion current = drift current, so net current is zero.</p>
                </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">Live</span>
                </div>
                <div className="grid gap-2">
                    {readoutItems.map(item => (
                        <div key={item.label} className={`rounded-lg border border-slate-100 ${item.bg} px-3 py-2.5`}>
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
                            <div className={`mt-1 font-mono text-base font-extrabold ${item.color}`}>{item.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const voltageMax = mode === 'forward' ? 2 : 0;
    const voltageMin = mode === 'reverse' ? -50 : 0;
    const voltageStep = mode === 'forward' ? 0.05 : 0.5;
    const showVoltage = mode !== 'formation';
    const reverseWarning = mode === 'reverse' && Math.abs(voltage) >= material.breakdown * 0.82;

    const controlsCombo = (
        <div className="flex h-full w-full flex-col gap-4 text-slate-900">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Material</label>
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
                        {(['Si', 'Ge'] as MaterialKey[]).map(key => (
                            <button
                                key={key}
                                type="button"
                                disabled={joined && mode === 'formation'}
                                onClick={() => {
                                    setMaterialKey(key);
                                    resetSimulation(mode);
                                }}
                                className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                                    materialKey === key
                                        ? 'bg-white text-teal-700 shadow'
                                        : 'text-slate-500 hover:text-slate-800'
                                } ${joined && mode === 'formation' ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                {MATERIALS[key].name} (V0 ~ {MATERIALS[key].barrier.toFixed(1)} V)
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Mode</label>
                    <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                        {[
                            { key: 'formation', label: 'Formation' },
                            { key: 'forward', label: 'Forward Bias' },
                            { key: 'reverse', label: 'Reverse Bias' }
                        ].map(item => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => handleModeChange(item.key as Mode)}
                                className={`rounded-lg px-2 py-2 text-xs font-bold transition ${
                                    mode === item.key ? 'bg-white text-indigo-700 shadow' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {showVoltage && (
                    <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                            <span>{mode === 'forward' ? 'Forward Bias Voltage' : 'Reverse Bias Voltage'}</span>
                            <span className={`rounded-md px-2 py-1 font-mono ${mode === 'forward' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {voltage.toFixed(mode === 'forward' ? 2 : 1)} V
                            </span>
                        </label>
                        <input
                            type="range"
                            min={voltageMin}
                            max={voltageMax}
                            step={voltageStep}
                            value={voltage}
                            onChange={(event) => setVoltage(Number(event.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                        />
                        <p className={`text-[11px] ${reverseWarning ? 'font-bold text-rose-700' : 'text-slate-500'}`}>
                            {mode === 'forward'
                                ? voltage > 0
                                    ? `Barrier reduced to (V0 - V). Current rises exponentially near ${material.cutIn.toFixed(1)} V.`
                                    : `Increase forward bias to reduce the barrier; current rises exponentially near ${material.cutIn.toFixed(1)} V.`
                                : voltage === 0
                                    ? 'Decrease the slider below 0 V to apply reverse bias across the depletion region.'
                                    : reverseWarning
                                    ? `Breakdown zone: Vbr for ${material.key} is about ${material.breakdown} V. Reverse current spikes.`
                                    : 'Barrier increased to (V0 + V). Only tiny minority-carrier reverse saturation current flows.'}
                        </p>
                    </div>
                )}

                {mode === 'formation' && (
                    <button
                        type="button"
                        onClick={handleJoin}
                        disabled={joined}
                        className={`rounded-xl px-4 py-3 font-bold shadow transition md:col-span-2 ${
                            joined
                                ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                                : 'animate-pulse bg-gradient-to-r from-teal-500 to-indigo-600 text-white hover:from-teal-400 hover:to-indigo-500'
                        }`}
                    >
                        {joined ? 'Junction formed' : 'Join P-N Junction'}
                    </button>
                )}

                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setIsPlaying(value => !value)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100"
                    >
                        <RotateCcw size={15} />
                        Reset
                    </button>
                    <button
                        type="button"
                        onClick={handleNextPhase}
                        disabled={mode !== 'formation'}
                        className="flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <SkipForward size={15} />
                        Next
                    </button>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                        <span className="flex items-center gap-2"><FastForward size={14} /> Speed</span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-slate-700">{speed.toFixed(1)}x</span>
                    </label>
                    <input
                        type="range"
                        min={0.1}
                        max={2}
                        step={0.1}
                        value={speed}
                        onChange={(event) => setSpeed(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-teal-600"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setShowForces(value => !value)}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold shadow-sm ${
                            showForces ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                    >
                        {showForces ? <Eye size={15} /> : <EyeOff size={15} />}
                        Forces
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowLabels(value => !value)}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold shadow-sm ${
                            showLabels ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                    >
                        {showLabels ? <Eye size={15} /> : <EyeOff size={15} />}
                        Labels
                    </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 md:col-span-2">
                    <div className="mb-2 font-bold text-slate-900">Particle legend</div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-rose-400" /> Hole (h+)</span>
                        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-400" /> Electron (e-)</span>
                        <span className="flex items-center gap-2"><span className="font-bold text-sky-500">-</span> Ionized acceptor</span>
                        <span className="flex items-center gap-2"><span className="font-bold text-orange-500">+</span> Ionized donor</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
        />
    );
};

export default SemiconductorLab;
