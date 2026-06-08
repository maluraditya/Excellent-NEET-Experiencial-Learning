import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Atom,
    Beaker,
    Eye,
    EyeOff,
    FlaskConical,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    ShieldAlert,
    Target,
    Zap
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface HaloalkaneLabProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'sn2' | 'sn1' | 'compare' | 'energy' | 'stereo';
type SubstrateId = 'methyl' | 'primary' | 'secondary' | 'tertiary';
type LeavingGroup = 'F⁻' | 'Cl⁻' | 'Br⁻' | 'I⁻';
type Solvent = 'protic' | 'aprotic';

interface Substrate {
    id: SubstrateId;
    label: string;
    short: string;
    groups: string[];
    sn2Rate: number;
    sn1Rank: number;
    sn1Label: string;
}

interface Nucleophile {
    label: string;
    strength: number;
}

interface WaterIcon {
    x: number;
    y: number;
    vx: number;
    vy: number;
    seed: number;
}

const W = 1280;
const H = 760;
const C = '#475569';
const HCOL = '#cbd5e1';
const CH3 = '#f59e0b';
const BR = '#a3e635';
const NU = '#dc2626';
const BLUE = '#2563eb';
const EMERALD = '#16a34a';

const MODES: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
    { id: 'sn2', label: 'SN2', icon: <Target size={15} /> },
    { id: 'sn1', label: 'SN1', icon: <ShieldAlert size={15} /> },
    { id: 'compare', label: 'Compare', icon: <Activity size={15} /> },
    { id: 'energy', label: 'Energy', icon: <Zap size={15} /> },
    { id: 'stereo', label: 'Stereo', icon: <Atom size={15} /> }
];

const SUBSTRATES: Substrate[] = [
    { id: 'methyl', label: 'CH₃X (methyl)', short: 'Methyl', groups: ['H', 'H', 'H'], sn2Rate: 30, sn1Rank: 0.03, sn1Label: 'methyl cation not viable' },
    { id: 'primary', label: '1° Ethyl', short: '1° Ethyl', groups: ['H', 'H', 'CH₃'], sn2Rate: 1, sn1Rank: 0.18, sn1Label: 'primary cation unstable' },
    { id: 'secondary', label: '2° iPr', short: '2° iPr', groups: ['H', 'CH₃', 'CH₃'], sn2Rate: 0.02, sn1Rank: 0.58, sn1Label: 'secondary cation moderate' },
    { id: 'tertiary', label: '3° tBu', short: '3° tBu', groups: ['CH₃', 'CH₃', 'CH₃'], sn2Rate: 0, sn1Rank: 1, sn1Label: 'tertiary cation most stable' }
];

const NUCLEOPHILES: Nucleophile[] = [
    { label: 'H₂O', strength: 1 },
    { label: 'ROH', strength: 2 },
    { label: 'F⁻', strength: 3 },
    { label: 'Cl⁻', strength: 4 },
    { label: 'Br⁻', strength: 5 },
    { label: 'OH⁻', strength: 7 },
    { label: 'CN⁻', strength: 8 },
    { label: 'I⁻', strength: 9 }
];

const LG_MULTIPLIER: Record<LeavingGroup, number> = {
    'F⁻': 0.05,
    'Cl⁻': 0.35,
    'Br⁻': 0.75,
    'I⁻': 1
};

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function ease(t: number) {
    return t * t * (3 - 2 * t);
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
    const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 580);
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
    ctx.lineCap = 'round';
    if (dashed) ctx.setLineDash([8, 7]);
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

function atom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, stroke: string, text: string, textColor = '#0f172a') {
    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, Math.max(10, r * 0.52), 900, textColor);
}

function bond(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, dashed = false, width = 5) {
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    if (dashed) ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function wedge(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = '#94a3b8') {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const px = Math.cos(angle + Math.PI / 2) * 12;
    const py = Math.sin(angle + Math.PI / 2) * 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 + px, y2 + py);
    ctx.lineTo(x2 - px, y2 - py);
    ctx.closePath();
    ctx.fill();
}

function dashWedge(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    for (let i = 1; i <= 6; i += 1) {
        const t = i / 7;
        const x = lerp(x1, x2, t);
        const y = lerp(y1, y2, t);
        const w = 2 + i * 1.7;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - w, y);
        ctx.lineTo(x + w, y);
        ctx.stroke();
    }
}

const HaloalkaneLab: React.FC<HaloalkaneLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const lastRef = useRef<number>();
    const timeRef = useRef(0);
    const watersRef = useRef<WaterIcon[]>([]);

    const [mode, setMode] = useState<Mode>('sn2');
    const [substrate, setSubstrate] = useState<SubstrateId>('methyl');
    const [energyMechanism, setEnergyMechanism] = useState<'SN1' | 'SN2'>('SN2');
    const [leavingGroup, setLeavingGroup] = useState<LeavingGroup>('Br⁻');
    const [nucleophile, setNucleophile] = useState('OH⁻');
    const [solvent, setSolvent] = useState<Solvent>('aprotic');
    const [showTS, setShowTS] = useState(true);
    const [showWedges, setShowWedges] = useState(true);
    const [showSolvent, setShowSolvent] = useState(true);
    const [showRate, setShowRate] = useState(true);
    const [showArrows, setShowArrows] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [phaseOffset, setPhaseOffset] = useState(0);

    const modeRef = useRef(mode);
    const substrateRef = useRef(substrate);
    const energyMechanismRef = useRef(energyMechanism);
    const leavingGroupRef = useRef(leavingGroup);
    const nucleophileRef = useRef(nucleophile);
    const solventRef = useRef(solvent);
    const showTSRef = useRef(showTS);
    const showWedgesRef = useRef(showWedges);
    const showSolventRef = useRef(showSolvent);
    const showRateRef = useRef(showRate);
    const showArrowsRef = useRef(showArrows);
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { substrateRef.current = substrate; }, [substrate]);
    useEffect(() => { energyMechanismRef.current = energyMechanism; }, [energyMechanism]);
    useEffect(() => { leavingGroupRef.current = leavingGroup; }, [leavingGroup]);
    useEffect(() => { nucleophileRef.current = nucleophile; }, [nucleophile]);
    useEffect(() => { solventRef.current = solvent; }, [solvent]);
    useEffect(() => { showTSRef.current = showTS; }, [showTS]);
    useEffect(() => { showWedgesRef.current = showWedges; }, [showWedges]);
    useEffect(() => { showSolventRef.current = showSolvent; }, [showSolvent]);
    useEffect(() => { showRateRef.current = showRate; }, [showRate]);
    useEffect(() => { showArrowsRef.current = showArrows; }, [showArrows]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    const activeSubstrate = SUBSTRATES.find((item) => item.id === substrate) ?? SUBSTRATES[0];
    const activeNu = NUCLEOPHILES.find((item) => item.label === nucleophile) ?? NUCLEOPHILES[5];
    const sn2Score = activeSubstrate.sn2Rate * LG_MULTIPLIER[leavingGroup] * activeNu.strength;
    const sn1Score = activeSubstrate.sn1Rank * LG_MULTIPLIER[leavingGroup] * (solvent === 'protic' ? 1.25 : 0.35);
    const currentPhase = ((timeRef.current + phaseOffset) % 6) / 6;

    useEffect(() => {
        watersRef.current = Array.from({ length: 30 }, (_, index) => ({
            x: 80 + Math.random() * 1120,
            y: 130 + Math.random() * 560,
            vx: (Math.random() - 0.5) * 18,
            vy: (Math.random() - 0.5) * 18,
            seed: index * 0.71
        }));
    }, []);

    const handleReset = useCallback(() => {
        setMode('sn2');
        setSubstrate('methyl');
        setEnergyMechanism('SN2');
        setLeavingGroup('Br⁻');
        setNucleophile('OH⁻');
        setSolvent('aprotic');
        setShowTS(true);
        setShowWedges(true);
        setShowSolvent(true);
        setShowRate(true);
        setShowArrows(true);
        setPaused(false);
        setSpeed(1);
        setPhaseOffset(0);
        timeRef.current = 0;
    }, []);

    const stepPhase = useCallback(() => {
        const current = ((timeRef.current + phaseOffset) % 6) / 6;
        const next = current < 0.35 ? 0.36 : current < 0.55 ? 0.56 : 0.02;
        setPhaseOffset(next * 6 - timeRef.current);
    }, [phaseOffset]);

    const drawWaterBath = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
        if (!showSolventRef.current || solventRef.current !== 'protic') return;
        ctx.save();
        const grad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 620);
        grad.addColorStop(0, 'rgba(186,230,253,0.04)');
        grad.addColorStop(1, 'rgba(56,189,248,0.16)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        watersRef.current.forEach((water) => {
            if (!pausedRef.current) {
                water.x += water.vx * dt;
                water.y += water.vy * dt;
                if (water.x < 30) water.x = W - 30;
                if (water.x > W - 30) water.x = 30;
                if (water.y < 90) water.y = H - 50;
                if (water.y > H - 40) water.y = 90;
            }
            const bob = Math.sin(timeRef.current * 2 + water.seed) * 3;
            atom(ctx, water.x, water.y + bob, 12, '#bae6fd', '#38bdf8', 'H₂O', '#075985');
        });
        ctx.restore();
    }, []);

    const drawSubstituents = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, groups: string[], flip = 0, scale = 1) => {
        const coords = [
            { x: cx, y: cy - 120 * scale, kind: 'plain' },
            { x: cx - 92 * scale, y: cy + 78 * scale + flip * 38 * scale, kind: 'dash' },
            { x: cx + 92 * scale, y: cy + 78 * scale - flip * 38 * scale, kind: 'wedge' }
        ];
        coords.forEach((p, index) => {
            const group = groups[index] ?? 'H';
            if (showWedgesRef.current && p.kind === 'wedge') wedge(ctx, cx, cy, p.x, p.y);
            else if (showWedgesRef.current && p.kind === 'dash') dashWedge(ctx, cx, cy, p.x, p.y);
            else bond(ctx, cx, cy, p.x, p.y, false, 4 * scale);
            atom(ctx, p.x, p.y, group === 'H' ? 22 * scale : 30 * scale, group === 'H' ? HCOL : CH3, group === 'H' ? '#64748b' : '#b45309', group);
        });
    }, []);

    const drawSN2Apparatus = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, progress: number, substrateData: Substrate, compact = false) => {
        const blocked = substrateData.id === 'tertiary';
        const approach = ease(clamp(progress / 0.35, 0, 1));
        const ts = progress >= 0.35 && progress < 0.55;
        const product = clamp((progress - 0.55) / 0.45, 0, 1);
        const flip = blocked ? 0 : product;
        const scale = compact ? 0.72 : 1;
        const nuX = blocked ? lerp(cx - 330 * scale, cx - 170 * scale, Math.sin(progress * Math.PI)) : lerp(cx - 330 * scale, cx - 86 * scale, approach);
        const lgX = lerp(cx + 145 * scale, cx + 340 * scale, product);
        const cX = cx + (blocked ? 0 : product * 18 * scale);

        if (ts && !blocked) {
            ctx.save();
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 14 + 8 * Math.sin(timeRef.current * 6);
            atom(ctx, cX, cy, 42 * scale, C, '#334155', 'C');
            ctx.restore();
        } else {
            atom(ctx, cX, cy, 38 * scale, C, '#334155', 'C');
        }
        drawSubstituents(ctx, cX, cy, substrateData.groups, flip, scale);
        bond(ctx, nuX + 30 * scale, cy, cX - 35 * scale, cy, ts && !blocked, 4 * scale);
        bond(ctx, cX + 35 * scale, cy, lgX - 28 * scale, cy, ts || product > 0.15, 4 * scale);
        atom(ctx, nuX, cy, 32 * scale, NU, '#991b1b', nucleophileRef.current, '#ffffff');
        atom(ctx, lgX, cy, 30 * scale, BR, '#65a30d', leavingGroupRef.current, '#1a2e05');

        if (showArrowsRef.current && !blocked) {
            drawArrow(ctx, nuX + 42 * scale, cy - 48 * scale, cX - 48 * scale, cy - 35 * scale, '#dc2626', true);
            drawArrow(ctx, cX + 42 * scale, cy + 42 * scale, lgX - 42 * scale, cy + 48 * scale, '#dc2626', true);
        }
        if (!compact) {
            if (blocked) {
                label(ctx, '✗ STERIC HINDRANCE — blocked', cx, cy + 230, 22, 900, '#dc2626');
                label(ctx, '3° tert-butyl SN2 relative rate = 0', cx, cy + 265, 16, 900, '#991b1b');
            } else if (ts && showTSRef.current) {
                label(ctx, '‡ TRANSITION STATE: C bonded to 5 atoms', cx, cy + 230, 22, 900, '#b45309');
                label(ctx, '3 substituents lie in a plane perpendicular to Nu...C...X', cx, cy + 262, 15, 800, '#92400e');
            } else if (product > 0.4) {
                label(ctx, 'WALDEN INVERSION (100% inverted)', cx, cy + 235, 23, 900, EMERALD);
            } else {
                label(ctx, 'Backside attack opposite the leaving group', cx, cy + 235, 18, 900, '#475569');
            }
        }
    }, [drawSubstituents]);

    const drawSN1Apparatus = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, progress: number, substrateData: Substrate, compact = false) => {
        const viable = substrateData.id === 'tertiary' || substrateData.id === 'secondary';
        const ionise = ease(clamp(progress / 0.45, 0, 1));
        const attack = ease(clamp((progress - 0.45) / 0.55, 0, 1));
        const scale = compact ? 0.72 : 1;
        const brX = viable ? lerp(cx + 135 * scale, cx + 340 * scale, ionise) : lerp(cx + 135 * scale, cx + 190 * scale, Math.sin(progress * Math.PI));
        const planar = viable ? ionise : 0.25 * Math.sin(progress * Math.PI);

        atom(ctx, cx, cy, 38 * scale, C, '#334155', 'C⁺');
        drawSubstituents(ctx, cx, cy, substrateData.groups, planar, scale);
        bond(ctx, cx + 34 * scale, cy, brX - 30 * scale, cy, ionise > 0.15, 4 * scale);
        atom(ctx, brX, cy, 30 * scale, BR, '#65a30d', leavingGroupRef.current, '#1a2e05');

        if (showSolventRef.current && solventRef.current === 'protic' && ionise > 0.35) {
            ctx.strokeStyle = '#38bdf8';
            ctx.setLineDash([5, 6]);
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i += 1) {
                ctx.beginPath();
                ctx.moveTo(brX + 18 * Math.cos(i * 2), cy + 18 * Math.sin(i * 2));
                ctx.lineTo(brX + 74 * Math.cos(i * 2), cy + 74 * Math.sin(i * 2));
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        if (viable && ionise > 0.55) {
            ctx.save();
            ctx.globalAlpha = 0.22 + 0.1 * Math.sin(timeRef.current * 3);
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 68 * scale, 34 * scale, 82 * scale, 0, 0, Math.PI * 2);
            ctx.ellipse(cx, cy + 68 * scale, 34 * scale, 82 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            atom(ctx, cx, cy - lerp(185, 72, attack) * scale, 29 * scale, NU, '#991b1b', nucleophileRef.current, '#ffffff');
            atom(ctx, cx, cy + lerp(185, 72, attack) * scale, 29 * scale, NU, '#991b1b', nucleophileRef.current, '#ffffff');
        }

        if (!compact) {
            if (!viable) {
                label(ctx, 'PRIMARY/METHYL CARBOCATION UNSTABLE — reaction stops', cx, cy + 240, 20, 900, '#dc2626');
            } else if (progress < 0.45) {
                label(ctx, 'Step 1 (SLOW, RDS): C–Br heterolytic cleavage', cx, cy + 235, 20, 900, '#b45309');
            } else {
                label(ctx, 'RACEMIZATION: 50% d + 50% l → optically inactive', cx, cy + 235, 20, 900, '#2563eb');
                atom(ctx, cx - 120, cy + 300, 25, '#dbeafe', '#2563eb', 'd');
                atom(ctx, cx + 120, cy + 300, 25, '#fee2e2', '#dc2626', 'l');
            }
        }
    }, [drawSubstituents]);

    const drawSN2Mode = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
        const sub = SUBSTRATES.find((item) => item.id === substrateRef.current) ?? SUBSTRATES[0];
        const progress = ((timeRef.current + phaseOffset) % 6) / 6;
        drawBackground(ctx);
        drawWaterBath(ctx, dt);
        label(ctx, 'SN2 Mechanism: Backside Attack and Walden Inversion', W / 2, 68, 28, 900, '#0f172a');
        label(ctx, 'CH₃Cl + OH⁻ → CH₃OH + Cl⁻ · Fig 6.2', W / 2, 101, 15, 800, '#475569');
        drawSN2Apparatus(ctx, 640, 370, progress, sub);
    }, [drawSN2Apparatus, drawWaterBath, phaseOffset]);

    const drawSN1Mode = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
        const sub = SUBSTRATES.find((item) => item.id === substrateRef.current) ?? SUBSTRATES[3];
        const progress = ((timeRef.current + phaseOffset) % 6) / 6;
        drawBackground(ctx);
        drawWaterBath(ctx, dt);
        label(ctx, 'SN1 Mechanism: Carbocation and Racemization', W / 2, 68, 28, 900, '#0f172a');
        label(ctx, '(CH₃)₃CBr + OH⁻ → (CH₃)₃COH + Br⁻', W / 2, 101, 15, 800, '#475569');
        drawSN1Apparatus(ctx, 640, 350, progress, sub);
    }, [drawSN1Apparatus, drawWaterBath, phaseOffset]);

    const drawCompareMode = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
        const sub = SUBSTRATES.find((item) => item.id === substrateRef.current) ?? SUBSTRATES[0];
        const progress = ((timeRef.current + phaseOffset) % 6) / 6;
        drawBackground(ctx);
        drawWaterBath(ctx, dt);
        label(ctx, 'SN2 vs SN1: Substrate Trend', W / 2, 66, 28, 900, '#0f172a');
        label(ctx, 'SN2 rate decreases with bulk; SN1 rate increases with carbocation stability', W / 2, 100, 15, 800, '#475569');
        roundRect(ctx, 70, 145, 560, 530, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
        roundRect(ctx, 690, 145, 560, 530, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
        label(ctx, 'SN2 column', 350, 185, 21, 900, '#2563eb');
        label(ctx, 'SN1 column', 970, 185, 21, 900, '#dc2626');
        drawSN2Apparatus(ctx, 350, 380, progress, sub, true);
        drawSN1Apparatus(ctx, 970, 380, progress, sub, true);
        label(ctx, `Active substrate: ${sub.label}`, W / 2, 710, 18, 900, '#0f172a');
    }, [drawSN1Apparatus, drawSN2Apparatus, drawWaterBath, phaseOffset]);

    const drawEnergyMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const mechanism = energyMechanismRef.current;
        const progress = ((timeRef.current + phaseOffset) % 6) / 6;
        drawBackground(ctx);
        label(ctx, 'Energy Profile', W / 2, 68, 30, 900, '#0f172a');
        label(ctx, mechanism === 'SN2' ? 'SN2 = one concerted barrier' : 'SN1 = two barriers with carbocation valley', W / 2, 101, 15, 800, '#475569');
        drawArrow(ctx, 150, 610, 1130, 610, '#334155');
        drawArrow(ctx, 150, 610, 150, 150, '#334155');
        label(ctx, 'Reaction coordinate', W / 2, 650, 16, 900, '#334155');
        label(ctx, 'Energy', 74, 365, 16, 900, '#334155');
        ctx.strokeStyle = mechanism === 'SN2' ? BLUE : NU;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (mechanism === 'SN2') {
            ctx.moveTo(210, 520);
            ctx.bezierCurveTo(390, 520, 470, 205, 640, 205);
            ctx.bezierCurveTo(805, 205, 875, 500, 1080, 500);
        } else {
            ctx.moveTo(210, 520);
            ctx.bezierCurveTo(330, 520, 380, 210, 480, 215);
            ctx.bezierCurveTo(560, 220, 555, 405, 640, 405);
            ctx.bezierCurveTo(730, 405, 745, 285, 825, 285);
            ctx.bezierCurveTo(910, 285, 960, 500, 1080, 500);
        }
        ctx.stroke();
        if (mechanism === 'SN2') {
            label(ctx, '‡ TS (5-coordinate C)', 640, 175, 18, 900, BLUE);
        } else {
            label(ctx, 'Step 1 RDS', 480, 185, 17, 900, NU);
            label(ctx, 'carbocation intermediate', 640, 435, 16, 900, BLUE);
            label(ctx, 'Step 2 fast', 825, 255, 17, 900, NU);
        }
        const x = lerp(210, 1080, progress);
        const hill = mechanism === 'SN2'
            ? Math.sin(progress * Math.PI) * 310
            : Math.sin(progress * Math.PI * 2) * 155 + (progress < 0.52 ? Math.sin(progress * Math.PI) * 170 : 80);
        const y = lerp(520, 500, progress) - Math.max(0, hill);
        atom(ctx, x, y, 18, '#bfdbfe', '#2563eb', '');
    }, [phaseOffset]);

    const drawStereoMode = useCallback((ctx: CanvasRenderingContext2D, dt: number) => {
        const progress = ((timeRef.current + phaseOffset) % 6) / 6;
        drawBackground(ctx);
        drawWaterBath(ctx, dt);
        label(ctx, 'Stereochemistry: Inversion vs Racemization', W / 2, 68, 28, 900, '#0f172a');
        label(ctx, '(-)-2-bromooctane + NaOH → (+)-octan-2-ol · NCERT Sec 6.6.1c', W / 2, 101, 15, 800, '#475569');
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, 380);
        ctx.lineTo(1200, 380);
        ctx.stroke();
        label(ctx, 'SN2 path: 100% inversion', 220, 160, 20, 900, EMERALD, 'left');
        drawSN2Apparatus(ctx, 640, 230, progress, SUBSTRATES[1], true);
        label(ctx, 'Br leaves; OH ends up opposite to where Br was', 850, 322, 16, 900, EMERALD);
        label(ctx, 'SN1 reference: planar cation gives racemic 50:50 d/l', 220, 450, 20, 900, BLUE, 'left');
        drawSN1Apparatus(ctx, 640, 560, progress, SUBSTRATES[3], true);
    }, [drawSN1Apparatus, drawSN2Apparatus, drawWaterBath, phaseOffset]);

    useEffect(() => {
        const draw = (now: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            const last = lastRef.current ?? now;
            const dt = Math.min((now - last) / 1000, 0.1);
            lastRef.current = now;
            if (!pausedRef.current) timeRef.current += dt * speedRef.current;
            if (modeRef.current === 'sn1') drawSN1Mode(ctx, dt);
            else if (modeRef.current === 'compare') drawCompareMode(ctx, dt);
            else if (modeRef.current === 'energy') drawEnergyMode(ctx);
            else if (modeRef.current === 'stereo') drawStereoMode(ctx, dt);
            else drawSN2Mode(ctx, dt);
            requestRef.current = requestAnimationFrame(draw);
        };
        requestRef.current = requestAnimationFrame(draw);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">SN2 Relative Rates</h3>
                    <p className="text-xs font-semibold text-slate-500">NCERT Fig 6.3 · steric effect</p>
                    <div className="mt-3 space-y-2">
                        {SUBSTRATES.map((item) => {
                            const width = item.sn2Rate === 0 ? 2 : Math.max(3, Math.log10(item.sn2Rate + 1) * 95);
                            return (
                                <button key={item.id} onClick={() => setSubstrate(item.id)} className={`w-full rounded-lg border px-2 py-2 text-left ${substrate === item.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                                    <div className="flex justify-between text-xs font-black text-slate-700">
                                        <span>{item.short}</span><span>{item.sn2Rate}</span>
                                    </div>
                                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                                        <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-red-500" style={{ width: `${width}%` }} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">SN1 Cation Stability</h3>
                    <p className="text-xs font-semibold text-slate-500">3° &gt; 2° &gt; 1° &gt; methyl</p>
                    <div className="mt-3 space-y-2">
                        {[...SUBSTRATES].reverse().map((item) => (
                            <button key={item.id} onClick={() => setSubstrate(item.id)} className={`w-full rounded-lg border px-2 py-2 text-left ${substrate === item.id ? 'border-blue-400 bg-blue-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                                <div className="flex justify-between text-xs font-black text-slate-700">
                                    <span>{item.short}</span><span>{item.sn1Label}</span>
                                </div>
                                <div className="mt-1 h-2 rounded-full bg-slate-100">
                                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${item.sn1Rank * 100}%` }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Series</h3>
                    <div className="mt-2 space-y-2 text-sm font-bold text-slate-700">
                        <div className="rounded-lg bg-slate-50 px-3 py-2">Leaving group: R-I &gt; R-Br &gt; R-Cl &gt;&gt; R-F</div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">Nu strength: H₂O &lt; ROH &lt; F⁻ &lt; Cl⁻ &lt; Br⁻ &lt; OH⁻ &lt; CN⁻ &lt; I⁻</div>
                    </div>
                </div>
            </div>
        </aside>
    ), [substrate]);

    const valuesPanel = useMemo(() => {
        const modeHint = {
            sn2: 'Backside attack + Walden inversion. Methyl best, 3° blocked.',
            sn1: 'Slow C-X cleavage → planar carbocation → racemisation. 3° best.',
            compare: 'SN2 falls with steric bulk; SN1 rises with carbocation stability.',
            energy: 'SN2 = 1 barrier. SN1 = 2 barriers plus cation valley.',
            stereo: '(-)-2-bromooctane → (+)-octan-2-ol by Walden inversion.'
        }[mode];
        return (
            <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
                <div className="flex flex-col gap-3">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
                        <div className="flex items-start gap-2">
                            <FlaskConical size={19} className="mt-0.5 text-emerald-800" />
                            <div>
                                <h3 className="text-base font-extrabold text-emerald-950">SN1 vs SN2</h3>
                                <p className="text-xs font-semibold text-emerald-700">NCERT Class 12 · Haloalkanes Sec 6.6.1</p>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-emerald-950">
                            <p>Hughes and Ingold proposed these mechanisms in 1937.</p>
                            <p>SN2: rate = k [R-X] [Nu⁻], second-order and bimolecular.</p>
                            <p>SN1: rate = k [R-X], first-order and unimolecular.</p>
                            <p>SN2 transition state has C bonded to five atoms and cannot be isolated.</p>
                            <p>SN2 gives Walden inversion, like an umbrella turning inside out.</p>
                            <p>SN1 forms a planar sp² carbocation; attack from both faces gives racemisation.</p>
                            <p>Polar protic solvents: water, alcohol, acetic acid favour SN1 by solvating halide.</p>
                            <p>William Nicol developed the first prism for plane polarised light.</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                        </div>
                        <div className="mt-3 space-y-2">
                            {[
                                { label: 'Substrate', value: activeSubstrate.short, tint: 'bg-slate-50', color: 'text-slate-800' },
                                { label: 'SN2 score', value: sn2Score.toFixed(2), tint: 'bg-emerald-50', color: 'text-emerald-700' },
                                { label: 'SN1 score', value: sn1Score.toFixed(2), tint: 'bg-blue-50', color: 'text-blue-700' },
                                { label: 'Leaving group', value: leavingGroup, tint: 'bg-amber-50', color: 'text-amber-700' },
                                { label: 'Nucleophile', value: nucleophile, tint: 'bg-red-50', color: 'text-red-700' },
                                { label: 'Phase', value: currentPhase.toFixed(2), tint: 'bg-violet-50', color: 'text-violet-700' }
                            ].map((row) => (
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
                            <p>{modeHint}</p>
                            <p>SN2 canonical: CH₃Cl + OH⁻ → CH₃OH + Cl⁻.</p>
                            <p>SN1 canonical: (CH₃)₃CBr + OH⁻ → (CH₃)₃COH + Br⁻; 2-bromo-2-methylpropane to 2-methylpropan-2-ol.</p>
                            <p>Stereochemistry: (-)-2-bromooctane + NaOH → (+)-octan-2-ol.</p>
                            <p>Allylic and benzylic halides are highly SN1 reactive due to resonance: H₂C=CH-CH₂⁺ ↔ ⁺CH₂-CH=CH₂.</p>
                        </div>
                    </div>
                </div>
            </aside>
        );
    }, [activeSubstrate.short, currentPhase, leavingGroup, mode, nucleophile, sn1Score, sn2Score]);

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button onClick={() => setPaused((value) => !value)} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50" title="Reset">
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
                <div className="flex min-w-0 items-center gap-2">
                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                        <FlaskConical size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">Nucleophilic Substitution Bench</div>
                        <div className="text-[11px] font-black text-emerald-700">{mode.toUpperCase()}</div>
                    </div>
                </div>
                <button onClick={stepPhase} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50" title="Step to next phase">
                    <RotateCw size={16} />
                </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
                {MODES.map((item) => (
                    <button key={item.id} onClick={() => setMode(item.id)} className={`flex min-h-[40px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-black transition ${mode === item.id ? 'border-emerald-400 bg-emerald-100 text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
                {SUBSTRATES.map((item) => (
                    <button key={item.id} onClick={() => setSubstrate(item.id)} className={`min-h-[36px] rounded-lg border px-1.5 text-[11px] font-black ${substrate === item.id ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {item.short}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
                {(['F⁻', 'Cl⁻', 'Br⁻', 'I⁻'] as LeavingGroup[]).map((item) => (
                    <button key={item} onClick={() => setLeavingGroup(item)} className={`min-h-[32px] rounded-lg border text-xs font-black ${leavingGroup === item ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {item}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
                <label className="space-y-1">
                    <span className="text-xs font-black text-slate-700">Nucleophile</span>
                    <select value={nucleophile} onChange={(event) => setNucleophile(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800">
                        {NUCLEOPHILES.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
                    </select>
                </label>
                <label className="space-y-1">
                    <span className="text-xs font-black text-slate-700">Profile</span>
                    <select value={energyMechanism} onChange={(event) => setEnergyMechanism(event.target.value as 'SN1' | 'SN2')} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800">
                        <option value="SN2">SN2</option>
                        <option value="SN1">SN1</option>
                    </select>
                </label>
                <label className="space-y-1">
                    <span className="text-xs font-black text-slate-700">Speed</span>
                    <input className="mt-1 w-full accent-emerald-600" type="range" min={0.3} max={2} step={0.1} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
                </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setSolvent('protic')} className={`rounded-lg border px-2 py-2 text-xs font-black ${solvent === 'protic' ? 'border-sky-400 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    Polar protic
                </button>
                <button onClick={() => setSolvent('aprotic')} className={`rounded-lg border px-2 py-2 text-xs font-black ${solvent === 'aprotic' ? 'border-violet-400 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    Polar aprotic
                </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
                {[
                    { label: 'TS', active: showTS, set: setShowTS, icon: showTS ? <Eye size={15} /> : <EyeOff size={15} /> },
                    { label: 'Wedges', active: showWedges, set: setShowWedges, icon: <Atom size={15} /> },
                    { label: 'Solvent', active: showSolvent, set: setShowSolvent, icon: <Beaker size={15} /> },
                    { label: 'Rate', active: showRate, set: setShowRate, icon: <Activity size={15} /> },
                    { label: 'Arrows', active: showArrows, set: setShowArrows, icon: <Target size={15} /> }
                ].map((item) => (
                    <button key={item.label} onClick={() => item.set((value) => !value)} className={`rounded-lg border p-2 text-[11px] font-black ${item.active ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`}>
                        <span className="mx-auto block w-fit">{item.icon}</span>
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

export default HaloalkaneLab;
