import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atom, Beaker, FlaskConical, Gauge, Pause, Play, RotateCcw, Sparkles, Waves, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface BasicityOfAminesLabProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'gas' | 'aqueous' | 'aromatic';
type Family = 'methyl' | 'ethyl';
type AromaticSub = 'h' | 'methyl' | 'methoxy' | 'nitro' | 'sulfonic' | 'carboxyl' | 'halogen';

interface ModeInfo {
    id: Mode;
    label: string;
    icon: React.ReactNode;
    color: string;
}

interface AminePoint {
    id: string;
    label: string;
    short: string;
    classLabel: string;
    pKb: number;
    gasRank: number;
    aqueousRank: number;
    inductive: number;
    solvation: number;
    steric: number;
    color: string;
}

interface AromaticPoint {
    id: AromaticSub;
    label: string;
    cue: string;
    effect: 'increase' | 'reference' | 'decrease';
    color: string;
}

const W = 1280;
const H = 760;

const MODES: ModeInfo[] = [
    { id: 'gas', label: 'Gas phase', icon: <Zap size={15} />, color: '#d97706' },
    { id: 'aqueous', label: 'Aqueous phase', icon: <Waves size={15} />, color: '#0891b2' },
    { id: 'aromatic', label: 'Aromatic amines', icon: <Atom size={15} />, color: '#7c3aed' }
];

const AMMONIA: AminePoint = {
    id: 'nh3',
    label: 'Ammonia',
    short: 'NH3',
    classLabel: 'NH3',
    pKb: 4.75,
    gasRank: 1,
    aqueousRank: 1,
    inductive: 0.16,
    solvation: 0.86,
    steric: 0.05,
    color: '#94a3b8'
};

const SERIES: Record<Family, AminePoint[]> = {
    methyl: [
        AMMONIA,
        { id: 'methyl-1', label: 'Methanamine', short: 'CH3NH2', classLabel: '1st', pKb: 3.38, gasRank: 2, aqueousRank: 3, inductive: 0.42, solvation: 0.78, steric: 0.12, color: '#16a34a' },
        { id: 'methyl-2', label: 'N-Methylmethanamine', short: '(CH3)2NH', classLabel: '2nd', pKb: 3.27, gasRank: 3, aqueousRank: 4, inductive: 0.68, solvation: 0.57, steric: 0.2, color: '#0891b2' },
        { id: 'methyl-3', label: 'N,N-Dimethylmethanamine', short: '(CH3)3N', classLabel: '3rd', pKb: 4.22, gasRank: 4, aqueousRank: 2, inductive: 0.9, solvation: 0.32, steric: 0.33, color: '#dc2626' }
    ],
    ethyl: [
        AMMONIA,
        { id: 'ethyl-1', label: 'Ethanamine', short: 'C2H5NH2', classLabel: '1st', pKb: 3.29, gasRank: 2, aqueousRank: 2, inductive: 0.48, solvation: 0.7, steric: 0.28, color: '#16a34a' },
        { id: 'ethyl-2', label: 'N-Ethylethanamine', short: '(C2H5)2NH', classLabel: '2nd', pKb: 3.0, gasRank: 3, aqueousRank: 4, inductive: 0.74, solvation: 0.48, steric: 0.46, color: '#0891b2' },
        { id: 'ethyl-3', label: 'N,N-Diethylethanamine', short: '(C2H5)3N', classLabel: '3rd', pKb: 3.25, gasRank: 4, aqueousRank: 3, inductive: 0.96, solvation: 0.24, steric: 0.68, color: '#dc2626' }
    ]
};

const AROMATICS: AromaticPoint[] = [
    { id: 'h', label: 'Aniline', cue: 'pKb 9.38', effect: 'reference', color: '#7c3aed' },
    { id: 'methyl', label: '-CH3', cue: 'NCERT: increases basicity', effect: 'increase', color: '#16a34a' },
    { id: 'methoxy', label: '-OCH3', cue: 'NCERT: increases basicity', effect: 'increase', color: '#22c55e' },
    { id: 'halogen', label: '-X', cue: 'NCERT: decreases basicity', effect: 'decrease', color: '#f59e0b' },
    { id: 'carboxyl', label: '-COOH', cue: 'NCERT: decreases basicity', effect: 'decrease', color: '#ea580c' },
    { id: 'sulfonic', label: '-SO3H', cue: 'NCERT: decreases basicity', effect: 'decrease', color: '#be123c' },
    { id: 'nitro', label: '-NO2', cue: 'NCERT: decreases basicity', effect: 'decrease', color: '#dc2626' }
];

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
    const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 720);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(1, '#f8fafc');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(15,23,42,0.045)';
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

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 3, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
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
    ctx.lineTo(x2 - 13 * Math.cos(angle - Math.PI / 6), y2 - 13 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 13 * Math.cos(angle + Math.PI / 6), y2 - 13 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, stroke: string, color = '#0f172a') {
    const width = Math.max(88, text.length * 8.2 + 28);
    roundRect(ctx, x - width / 2, y - 19, width, 38, 19);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, 13, 900, color);
}

function drawAtom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke: string, text: string, textColor = '#0f172a') {
    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, fill);
    ctx.fillStyle = grad;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, Math.max(12, r * 0.55), 900, textColor);
}

function drawBenzene(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.48, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(124,58,237,0.35)';
    ctx.stroke();
    ctx.restore();
}

const BasicityOfAminesLab: React.FC<BasicityOfAminesLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastRef = useRef<number | null>(null);
    const timeRef = useRef(0);
    const [mode, setMode] = useState<Mode>('aqueous');
    const [family, setFamily] = useState<Family>('methyl');
    const [aromaticSub, setAromaticSub] = useState<AromaticSub>('h');
    const [showSolvation, setShowSolvation] = useState(true);
    const [showSteric, setShowSteric] = useState(true);
    const [showResonance, setShowResonance] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);

    const modeRef = useRef(mode);
    const familyRef = useRef(family);
    const aromaticSubRef = useRef(aromaticSub);
    const showSolvationRef = useRef(showSolvation);
    const showStericRef = useRef(showSteric);
    const showResonanceRef = useRef(showResonance);
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { familyRef.current = family; }, [family]);
    useEffect(() => { aromaticSubRef.current = aromaticSub; }, [aromaticSub]);
    useEffect(() => { showSolvationRef.current = showSolvation; }, [showSolvation]);
    useEffect(() => { showStericRef.current = showSteric; }, [showSteric]);
    useEffect(() => { showResonanceRef.current = showResonance; }, [showResonance]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    const activeMode = useMemo(() => MODES.find(item => item.id === mode)!, [mode]);
    const activeAromatic = useMemo(() => AROMATICS.find(item => item.id === aromaticSub)!, [aromaticSub]);
    const activeSeries = useMemo(() => SERIES[family], [family]);
    const strongestShown = useMemo(() => {
        const rankKey = mode === 'gas' ? 'gasRank' : 'aqueousRank';
        return [...activeSeries].sort((a, b) => b[rankKey] - a[rankKey])[0];
    }, [activeSeries, mode]);

    const handleReset = useCallback(() => {
        setMode('aqueous');
        setFamily('methyl');
        setAromaticSub('h');
        setShowSolvation(true);
        setShowSteric(true);
        setShowResonance(true);
        setPaused(false);
        setSpeed(1);
        timeRef.current = 0;
        lastRef.current = null;
    }, []);

    const drawAmine = useCallback((ctx: CanvasRenderingContext2D, item: AminePoint, x: number, y: number, score: number, color: string, progress: number) => {
        const lift = -score * 0.55;
        const glow = 0.55 + Math.sin(timeRef.current * 3 + x * 0.01) * 0.18;
        ctx.save();
        ctx.globalAlpha = 0.08 + score / 1300;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y + 50, 74, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        drawAtom(ctx, x, y + lift, 36, '#ccfbf1', color, 'N', '#134e4a');
        drawPill(ctx, item.short, x, y + lift + 70, '#ffffff', '#cbd5e1', '#0f172a');
        label(ctx, item.classLabel, x, y + lift - 54, 15, 900, color);

        const protonX = lerp(x - 88, x - 30, progress);
        const protonY = lerp(y - 70, y + lift - 4, progress);
        drawAtom(ctx, protonX, protonY, 15, '#fee2e2', '#dc2626', 'H+', '#991b1b');
        drawArrow(ctx, x - 70, y - 48, x - 34, y + lift - 10, '#dc2626', 2.4, true);

        ctx.save();
        ctx.globalAlpha = glow;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(x + 12, y + lift - 8, 24, -0.4, 1.6);
        ctx.stroke();
        ctx.restore();

        if (modeRef.current === 'aqueous' && showSolvationRef.current) {
            ctx.save();
            ctx.globalAlpha = 0.15 + item.solvation * 0.22;
            ctx.strokeStyle = '#0891b2';
            ctx.lineWidth = 3;
            for (let i = 0; i < 5; i += 1) {
                const angle = (Math.PI * 2 * i) / 5 + timeRef.current * 0.45;
                const r = 54 + item.solvation * 32;
                const wx = x + Math.cos(angle) * r;
                const wy = y + lift + Math.sin(angle) * r;
                ctx.beginPath();
                ctx.arc(wx, wy, 8, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        if (modeRef.current === 'aqueous' && showStericRef.current && item.steric > 0.22) {
            ctx.save();
            ctx.globalAlpha = item.steric * 0.38;
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.ellipse(x + 44, y + lift + 4, 52, 28, -0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }, []);

    const drawBasicityTrack = useCallback((ctx: CanvasRenderingContext2D, series: AminePoint[], modeNow: Mode, progress: number) => {
        const left = 155;
        const top = 575;
        const width = 970;
        roundRect(ctx, left, top, width, 32, 16);
        const grad = ctx.createLinearGradient(left, 0, left + width, 0);
        grad.addColorStop(0, '#cbd5e1');
        grad.addColorStop(0.4, '#38bdf8');
        grad.addColorStop(1, '#16a34a');
        ctx.fillStyle = grad;
        ctx.fill();
        label(ctx, 'weaker base', left + 55, top + 55, 14, 900, '#475569');
        label(ctx, 'stronger base', left + width - 62, top + 55, 14, 900, '#166534');

        series.forEach((item, index) => {
            const rank = modeNow === 'gas' ? item.gasRank : item.aqueousRank;
            const target = left + (rank / 4) * width - 48;
            const x = lerp(left + 92 + index * 240, target, ease(progress));
            drawArrow(ctx, x, top - 92, x, top - 8, item.color, 3);
            drawPill(ctx, item.short, x, top - 110, '#ffffff', item.color, item.color);
        });
    }, []);

    const drawAliphatic = useCallback((ctx: CanvasRenderingContext2D, modeNow: Mode, series: AminePoint[], progress: number) => {
        const rankKey = modeNow === 'gas' ? 'gasRank' : 'aqueousRank';
        label(ctx, modeNow === 'gas' ? 'Gas phase: +I effect dominates' : 'Aqueous phase: +I, solvation and steric effects compete', 640, 112, 18, 900, modeNow === 'gas' ? '#92400e' : '#155e75');
        const sorted = [...series].sort((a, b) => (a[rankKey] as number) - (b[rankKey] as number));
        sorted.forEach((item, index) => {
            const score = item[rankKey] as number;
            const x = 230 + index * 270;
            const y = 365;
            drawAmine(ctx, item, x, y, score * 60, item.color, progress);
            if (modeNow === 'gas') {
                const h = item.inductive * 130;
                roundRect(ctx, x - 48, 472 - h, 26, h, 8);
                ctx.fillStyle = item.color;
                ctx.fill();
                label(ctx, '+I', x - 35, 492, 12, 900, item.color);
            } else {
                const solH = item.solvation * 110;
                const stericH = item.steric * 110;
                roundRect(ctx, x - 60, 492 - solH, 20, solH, 8);
                ctx.fillStyle = '#0891b2';
                ctx.fill();
                roundRect(ctx, x - 32, 492 - stericH, 20, stericH, 8);
                ctx.fillStyle = '#f97316';
                ctx.fill();
            }
        });
        drawBasicityTrack(ctx, series, modeNow, progress);
    }, [drawAmine, drawBasicityTrack]);

    const drawAromatic = useCallback((ctx: CanvasRenderingContext2D, sub: AromaticPoint, progress: number) => {
        label(ctx, 'Aromatic amines: nitrogen lone pair is less available', 640, 112, 18, 900, '#5b21b6');
        drawBenzene(ctx, 500, 340, 96, '#7c3aed');
        drawAtom(ctx, 500, 206, 36, '#ccfbf1', '#7c3aed', 'NH2', '#4c1d95');
        drawArrow(ctx, 500, 246, 500, 282, '#7c3aed', 4);
        if (showResonanceRef.current) {
            for (let i = 0; i < 5; i += 1) {
                const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 5 + timeRef.current * 0.35;
                const x = 500 + Math.cos(angle) * 145;
                const y = 340 + Math.sin(angle) * 145;
                drawArrow(ctx, 500, 246, x, y, 'rgba(124,58,237,0.55)', 2, true);
            }
            label(ctx, 'lone pair delocalised into ring', 500, 515, 16, 900, '#5b21b6');
        }

        drawPill(ctx, sub.label, 795, 236, '#ffffff', sub.color, sub.color);
        drawArrow(ctx, 740, 260, 610, 308, sub.color, 4);
        const protonEase = ease(progress);
        const effectProgress = sub.effect === 'increase' ? 0.9 : sub.effect === 'reference' ? 0.65 : 0.4;
        const protonX = lerp(930, 562, protonEase * effectProgress);
        drawAtom(ctx, protonX, 382, 20, '#fee2e2', '#dc2626', 'H+', '#991b1b');
        drawPill(ctx, sub.cue, 820, 455, '#ffffff', sub.color, sub.color);

        const left = 720;
        const top = 585;
        const width = 390;
        roundRect(ctx, left, top, width, 30, 15);
        const basicityGradient = ctx.createLinearGradient(left, 0, left + width, 0);
        basicityGradient.addColorStop(0, '#fee2e2');
        basicityGradient.addColorStop(0.5, '#ede9fe');
        basicityGradient.addColorStop(1, '#dcfce7');
        ctx.fillStyle = basicityGradient;
        ctx.fill();
        const markerX = left + effectProgress * width;
        drawArrow(ctx, markerX, top - 46, markerX, top - 5, sub.color, 3);
        label(ctx, 'decreases', left + 45, top + 58, 12, 900, '#991b1b');
        label(ctx, 'aniline', left + width / 2, top + 58, 12, 900, '#5b21b6');
        label(ctx, 'increases', left + width - 45, top + 58, 12, 900, '#166534');
        drawPill(ctx, 'Aniline pKb 9.38', 305, 620, '#f5f3ff', '#7c3aed', '#5b21b6');
        drawPill(ctx, 'Ammonia pKb 4.75', 305, 672, '#f8fafc', '#64748b', '#334155');
    }, []);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const modeNow = modeRef.current;
        const familyNow = familyRef.current;
        const series = SERIES[familyNow];
        const aromatic = AROMATICS.find(item => item.id === aromaticSubRef.current) || AROMATICS[0];
        const progress = (timeRef.current % 5.8) / 5.8;
        const current = MODES.find(item => item.id === modeNow) || MODES[1];
        drawBackground(ctx);
        label(ctx, 'Basicity of Amines', 640, 58, 25, 900, '#0f172a');
        drawPill(ctx, current.label, 640, 100, '#ffffff', current.color, current.color);

        if (modeNow === 'gas' || modeNow === 'aqueous') drawAliphatic(ctx, modeNow, series, progress);
        if (modeNow === 'aromatic') drawAromatic(ctx, aromatic, progress);
        label(ctx, modeNow === 'aromatic' ? 'resonance lowers proton acceptability' : 'smaller pKb means stronger base', 640, 722, 15, 900, current.color);
    }, [drawAliphatic, drawAromatic]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animate = (timestamp: number) => {
            if (lastRef.current === null) lastRef.current = timestamp;
            const delta = Math.min(0.05, (timestamp - lastRef.current) / 1000);
            lastRef.current = timestamp;
            if (!pausedRef.current) timeRef.current += delta * speedRef.current;
            draw(ctx);
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current !== undefined) cancelAnimationFrame(requestRef.current);
        };
    }, [draw]);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Aqueous pKb ladder</div>
                    <div className="text-xs font-semibold text-slate-500">Lower pKb means stronger base</div>
                    <svg viewBox="0 0 310 170" className="mt-2 h-[170px] w-full">
                        {[...SERIES[family]].sort((a, b) => a.pKb - b.pKb).map((item, index) => {
                            const y = 28 + index * 34;
                            const width = Math.max(35, (10 - item.pKb) * 25);
                            return (
                                <g key={item.id}>
                                    <rect x="84" y={y - 11} width={width} height="22" rx="8" fill={item.color} opacity="0.9" />
                                    <text x="78" y={y + 4} textAnchor="end" fontSize="10" fontWeight="800" fill="#334155">{item.short}</text>
                                    <text x={88 + width} y={y + 4} fontSize="10" fontWeight="900" fill="#0f172a">{item.pKb.toFixed(2)}</text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Phase order</div>
                    <div className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">Gas: 3rd &gt; 2nd &gt; 1st &gt; NH3</div>
                        <div className="rounded-lg bg-cyan-50 px-3 py-2 text-cyan-800">Methyl aq: 2nd &gt; 1st &gt; 3rd &gt; NH3</div>
                        <div className="rounded-lg bg-blue-50 px-3 py-2 text-blue-800">Ethyl aq: 2nd &gt; 3rd &gt; 1st &gt; NH3</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Three effects</div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-black">
                        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-800">+I</div>
                        <div className="rounded-lg bg-cyan-50 p-2 text-cyan-800">Solvation</div>
                        <div className="rounded-lg bg-orange-50 p-2 text-orange-800">Steric</div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-violet-950">NCERT focus</div>
                    <div className="text-xs font-semibold text-violet-700">Class 12 Chemistry, Amines, Table 9.3</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-violet-900">
                        <div>Basicity depends on ease of cation formation.</div>
                        <div>Gas phase follows the +I effect order.</div>
                        <div>Aqueous phase depends on +I, solvation and steric effects.</div>
                        <div>Aniline is weaker because the lone pair is conjugated with the ring.</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</div>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Mode', value: activeMode.label, tone: 'bg-violet-50 text-violet-700' },
                            { label: 'Family', value: mode === 'aromatic' ? 'Aniline series' : family, tone: 'bg-cyan-50 text-cyan-700' },
                            { label: 'Strongest shown', value: mode === 'aromatic' ? 'Qualitative category' : strongestShown.short, tone: 'bg-emerald-50 text-emerald-700' },
                            { label: 'Rule cue', value: mode === 'aromatic' ? activeAromatic.cue : 'smaller pKb = stronger', tone: 'bg-amber-50 text-amber-700' }
                        ].map(row => (
                            <div key={row.label} className={`rounded-lg border border-slate-100 px-3 py-2.5 ${row.tone}`}>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                                <div className="mt-1 font-mono text-sm font-extrabold">{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" aria-label="Basicity of amines simulation" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        onClick={() => setPaused(value => !value)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title={paused ? 'Play' : 'Pause'}
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
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

    const controlsComponent = (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <FlaskConical size={18} className="text-violet-600" />
                Basicity of Amines Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Mode</div>
                    <div className="grid grid-cols-3 gap-2">
                        {MODES.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setMode(item.id)}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-extrabold transition ${mode === item.id ? 'border-violet-300 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {mode !== 'aromatic' ? (
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="amine-family">
                                Alkyl family
                            </label>
                            <select
                                id="amine-family"
                                value={family}
                                onChange={event => setFamily(event.target.value as Family)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-violet-500"
                            >
                                <option value="methyl">Methyl series</option>
                                <option value="ethyl">Ethyl series</option>
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="aromatic-sub">
                                Aromatic substituent
                            </label>
                            <select
                                id="aromatic-sub"
                                value={aromaticSub}
                                onChange={event => setAromaticSub(event.target.value as AromaticSub)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-violet-500"
                            >
                                {AROMATICS.map(item => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="speed-slider">
                            Animation speed
                        </label>
                        <input
                            id="speed-slider"
                            type="range"
                            min="0.4"
                            max="1.8"
                            step="0.1"
                            value={speed}
                            onChange={event => setSpeed(Number(event.target.value))}
                            className="w-full accent-violet-600"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <label className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700">
                            <input type="checkbox" checked={showSolvation} onChange={event => setShowSolvation(event.target.checked)} className="accent-violet-600" />
                            Solvation
                        </label>
                        <label className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700">
                            <input type="checkbox" checked={showSteric} onChange={event => setShowSteric(event.target.checked)} className="accent-violet-600" />
                            Steric
                        </label>
                        <label className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700">
                            <input type="checkbox" checked={showResonance} onChange={event => setShowResonance(event.target.checked)} className="accent-violet-600" />
                            Resonance
                        </label>
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
            ControlsComponent={controlsComponent}
            controlsAreaFlex="0 0 220px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default BasicityOfAminesLab;
