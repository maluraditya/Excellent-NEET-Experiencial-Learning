import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Beaker, FlaskConical, Gauge, Pause, Play, RotateCcw, TestTube2, Thermometer, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface CarboxylicAcidsReactionsAcidityLabProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'acidity' | 'bicarbonate' | 'esterification' | 'acidChloride' | 'reduction' | 'decarboxylation';
type SubstituentId = 'ethyl' | 'methyl' | 'phenylmethyl' | 'benzoic' | 'formic' | 'chloro' | 'fluoro' | 'nitro' | 'trichloro' | 'trifluoro';

interface ModeInfo {
    id: Mode;
    label: string;
    icon: React.ReactNode;
    color: string;
    short: string;
}

interface Substituent {
    id: SubstituentId;
    label: string;
    formula: string;
    cue: string;
    ladderPosition: number;
    effect: 'EDG' | 'EWG' | 'reference' | 'sp2';
    pKa?: number;
}

const W = 1280;
const H = 760;

const MODES: ModeInfo[] = [
    { id: 'acidity', label: 'Acidity', icon: <Gauge size={15} />, color: '#dc2626', short: 'RCOO-' },
    { id: 'bicarbonate', label: 'NaHCO3 Test', icon: <TestTube2 size={15} />, color: '#0891b2', short: 'CO2' },
    { id: 'esterification', label: 'Esterification', icon: <FlaskConical size={15} />, color: '#7c3aed', short: 'Ester' },
    { id: 'acidChloride', label: 'Acid Chloride', icon: <Zap size={15} />, color: '#d97706', short: 'RCOCl' },
    { id: 'reduction', label: 'Reduction', icon: <Beaker size={15} />, color: '#16a34a', short: 'RCH2OH' },
    { id: 'decarboxylation', label: 'Decarboxylation', icon: <Thermometer size={15} />, color: '#ea580c', short: 'RH' }
];

const SUBSTITUENTS: Substituent[] = [
    { id: 'ethyl', label: 'CH3CH2COOH', formula: 'CH3CH2-', cue: 'alkyl weakens', ladderPosition: 12, effect: 'EDG' },
    { id: 'methyl', label: 'CH3COOH', formula: 'CH3-', cue: 'pKa 4.76', ladderPosition: 20, effect: 'EDG', pKa: 4.76 },
    { id: 'phenylmethyl', label: 'C6H5CH2COOH', formula: 'C6H5CH2-', cue: 'weaker than benzoic acid', ladderPosition: 29, effect: 'reference' },
    { id: 'benzoic', label: 'C6H5COOH', formula: 'C6H5-', cue: 'pKa 4.19', ladderPosition: 38, effect: 'sp2', pKa: 4.19 },
    { id: 'formic', label: 'HCOOH', formula: 'H-', cue: 'stronger than benzoic acid', ladderPosition: 46, effect: 'reference' },
    { id: 'chloro', label: 'ClCH2COOH', formula: 'ClCH2-', cue: 'EWG stabilises ion', ladderPosition: 56, effect: 'EWG' },
    { id: 'fluoro', label: 'FCH2COOH', formula: 'FCH2-', cue: 'F withdraws more than Cl', ladderPosition: 65, effect: 'EWG' },
    { id: 'nitro', label: 'NO2CH2COOH', formula: 'NO2CH2-', cue: 'NO2 withdraws strongly', ladderPosition: 76, effect: 'EWG' },
    { id: 'trichloro', label: 'CCl3COOH', formula: 'CCl3-', cue: 'three Cl substituents', ladderPosition: 87, effect: 'EWG' },
    { id: 'trifluoro', label: 'CF3COOH', formula: 'CF3-', cue: 'pKa 0.23', ladderPosition: 96, effect: 'EWG', pKa: 0.23 }
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
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
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
    if (dashed) ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 14 * Math.cos(angle - Math.PI / 6), y2 - 14 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 14 * Math.cos(angle + Math.PI / 6), y2 - 14 * Math.sin(angle + Math.PI / 6));
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
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, Math.max(12, r * 0.65), 900, textColor);
}

function drawBond(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = '#94a3b8', width = 5, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    if (dashed) ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function drawPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, stroke: string, color = '#0f172a') {
    const width = Math.max(92, text.length * 9 + 30);
    roundRect(ctx, x - width / 2, y - 20, width, 40, 20);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, 14, 900, color);
}

const CarboxylicAcidsReactionsAcidityLab: React.FC<CarboxylicAcidsReactionsAcidityLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastRef = useRef<number | null>(null);
    const timeRef = useRef(0);
    const [mode, setMode] = useState<Mode>('acidity');
    const [substituentId, setSubstituentId] = useState<SubstituentId>('fluoro');
    const [showResonance, setShowResonance] = useState(true);
    const [showProducts, setShowProducts] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);

    const pausedRef = useRef(paused);
    const modeRef = useRef(mode);
    const substituentRef = useRef(substituentId);
    const resonanceRef = useRef(showResonance);
    const productsRef = useRef(showProducts);
    const speedRef = useRef(speed);

    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { substituentRef.current = substituentId; }, [substituentId]);
    useEffect(() => { resonanceRef.current = showResonance; }, [showResonance]);
    useEffect(() => { productsRef.current = showProducts; }, [showProducts]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    const activeMode = useMemo(() => MODES.find(item => item.id === mode)!, [mode]);
    const activeSub = useMemo(() => SUBSTITUENTS.find(item => item.id === substituentId)!, [substituentId]);

    const handleReset = useCallback(() => {
        setMode('acidity');
        setSubstituentId('fluoro');
        setShowResonance(true);
        setShowProducts(true);
        setPaused(false);
        setSpeed(1);
        timeRef.current = 0;
        lastRef.current = null;
    }, []);

    const drawCarboxylHub = useCallback((ctx: CanvasRenderingContext2D, sub: Substituent, color: string, pulse: number) => {
        const cx = 395;
        const cy = 360;
        drawBond(ctx, cx - 135, cy + 72, cx - 55, cy + 30, '#94a3b8', 6);
        drawBond(ctx, cx + 42, cy - 24, cx + 42, cy - 116, '#475569', 5);
        drawBond(ctx, cx + 58, cy - 20, cx + 58, cy - 112, '#475569', 5);
        drawBond(ctx, cx + 50, cy + 38, cx + 128, cy + 102, '#94a3b8', 6);

        drawAtom(ctx, cx - 165, cy + 88, 38, sub.effect === 'EWG' ? '#dbeafe' : '#fef3c7', sub.effect === 'EWG' ? '#2563eb' : '#d97706', 'R');
        label(ctx, sub.formula, cx - 165, cy + 145, 15, 800, '#334155');
        drawAtom(ctx, cx, cy, 46 + pulse * 3, '#fde68a', color, 'C');
        drawAtom(ctx, cx + 50, cy - 150, 38, '#fecaca', '#dc2626', 'O', '#7f1d1d');
        drawAtom(ctx, cx + 158, cy + 126, 36, '#fecaca', '#dc2626', 'O', '#7f1d1d');
        drawAtom(ctx, cx + 216, cy + 160, 25, '#e0f2fe', '#0284c7', 'H', '#075985');
        drawBond(ctx, cx + 184, cy + 140, cx + 199, cy + 149, '#94a3b8', 4);

        label(ctx, 'carboxyl group', cx + 82, cy + 215, 15, 900, '#475569');
        if (resonanceRef.current) {
            drawArrow(ctx, cx + 240, cy + 26, cx + 410, cy + 26, '#dc2626', 3, true);
            label(ctx, 'O-H cleavage', cx + 322, cy - 3, 14, 900, '#991b1b');
            drawAtom(ctx, cx + 470, cy - 26, 34, '#fecaca', '#dc2626', 'O-', '#7f1d1d');
            drawAtom(ctx, cx + 546, cy - 26, 34, '#fecaca', '#dc2626', 'O-', '#7f1d1d');
            drawBond(ctx, cx + 504, cy - 26, cx + 512, cy - 26, '#94a3b8', 5);
            label(ctx, 'RCOO- charge shared', cx + 508, cy + 35, 16, 900, '#991b1b');
        }
    }, []);

    const drawAcidity = useCallback((ctx: CanvasRenderingContext2D, sub: Substituent, progress: number) => {
        const t = ease(progress);
        drawCarboxylHub(ctx, sub, '#dc2626', Math.sin(timeRef.current * 2) * 0.5 + 0.5);
        const left = 190;
        const top = 625;
        const width = 900;
        roundRect(ctx, left, top, width, 28, 14);
        const grad = ctx.createLinearGradient(left, 0, left + width, 0);
        grad.addColorStop(0, '#fbbf24');
        grad.addColorStop(0.5, '#38bdf8');
        grad.addColorStop(1, '#dc2626');
        ctx.fillStyle = grad;
        ctx.fill();
        label(ctx, 'weaker acid', left + 52, top + 52, 14, 900, '#92400e');
        label(ctx, 'stronger acid', left + width - 58, top + 52, 14, 900, '#991b1b');
        const marker = left + (sub.ladderPosition / 100) * width;
        drawArrow(ctx, marker, top - 72 + 22 * t, marker, top - 4, '#0f172a', 3);
        drawPill(ctx, sub.label, marker, top - 94 + 22 * t, '#ffffff', '#cbd5e1', '#0f172a');
        if (sub.pKa !== undefined) {
            drawPill(ctx, `NCERT pKa = ${sub.pKa.toFixed(2)}`, 1035, 170, '#fff1f2', '#fb7185', '#9f1239');
        }
        if (sub.effect === 'EWG') {
            drawArrow(ctx, 195, 420, 305, 389, '#2563eb', 4);
            label(ctx, 'electron withdrawing group', 214, 366, 15, 900, '#1d4ed8', 'left');
        } else if (sub.effect === 'EDG') {
            drawArrow(ctx, 305, 389, 195, 420, '#d97706', 4);
            label(ctx, 'electron donating group', 214, 366, 15, 900, '#92400e', 'left');
        }
    }, [drawCarboxylHub]);

    const drawBicarbonate = useCallback((ctx: CanvasRenderingContext2D, sub: Substituent, progress: number) => {
        const t = ease(progress);
        drawCarboxylHub(ctx, sub, '#0891b2', 0.5);
        drawPill(ctx, 'NaHCO3', 820, 265, '#ecfeff', '#0891b2', '#155e75');
        drawArrow(ctx, 735, 285, 590, 340, '#0891b2', 4);
        if (productsRef.current) {
            drawPill(ctx, 'RCOONa', 760, 450, '#f0fdf4', '#16a34a', '#166534');
            drawPill(ctx, 'H2O', 935, 450, '#eff6ff', '#2563eb', '#1d4ed8');
            for (let i = 0; i < 9; i += 1) {
                const phase = (t + i * 0.13) % 1;
                const x = 690 + i * 43;
                const y = 530 - phase * 145;
                ctx.globalAlpha = 1 - phase * 0.55;
                drawAtom(ctx, x, y, 17 + phase * 8, '#e0f2fe', '#0891b2', 'CO2', '#155e75');
                ctx.globalAlpha = 1;
            }
            label(ctx, 'CO2 effervescence detects -COOH', 820, 650, 17, 900, '#155e75');
        }
    }, [drawCarboxylHub]);

    const drawEsterification = useCallback((ctx: CanvasRenderingContext2D, sub: Substituent, progress: number) => {
        const t = ease(progress);
        drawCarboxylHub(ctx, sub, '#7c3aed', 0.3 + t * 0.6);
        drawPill(ctx, "R'OH", lerp(980, 675, t), lerp(235, 320, t), '#f5f3ff', '#7c3aed', '#5b21b6');
        drawPill(ctx, 'H+', 900, 170, '#fff7ed', '#ea580c', '#9a3412');
        drawArrow(ctx, 870, 225, 590, 322, '#7c3aed', 4);
        if (t > 0.36) {
            drawPill(ctx, 'tetrahedral intermediate', 840, 392, '#ffffff', '#c4b5fd', '#5b21b6');
        }
        if (productsRef.current && t > 0.62) {
            drawArrow(ctx, 740, 450, 930, 450, '#7c3aed', 4);
            drawPill(ctx, 'RCOOR', 1015, 450, '#f5f3ff', '#7c3aed', '#5b21b6');
            drawPill(ctx, 'H2O leaves', 925, 535, '#eff6ff', '#2563eb', '#1d4ed8');
        }
    }, [drawCarboxylHub]);

    const drawAcidChloride = useCallback((ctx: CanvasRenderingContext2D, sub: Substituent, progress: number) => {
        const t = ease(progress);
        drawCarboxylHub(ctx, sub, '#d97706', 0.4);
        drawPill(ctx, 'SOCl2', 850, 250, '#fff7ed', '#d97706', '#92400e');
        drawPill(ctx, 'PCl5 / PCl3', 1010, 250, '#ffffff', '#f59e0b', '#92400e');
        drawArrow(ctx, 780, 290, 590, 342, '#d97706', 4);
        if (productsRef.current) {
            drawPill(ctx, 'RCOCl', 820, 450, '#fff7ed', '#d97706', '#92400e');
            ['SO2', 'HCl'].forEach((gas, i) => {
                const phase = (t + i * 0.24) % 1;
                drawPill(ctx, gas, 930 + i * 105, 525 - phase * 120, '#f8fafc', '#94a3b8', '#334155');
            });
            label(ctx, 'gaseous by-products escape with SOCl2', 930, 650, 16, 900, '#92400e');
        }
    }, [drawCarboxylHub]);

    const drawReduction = useCallback((ctx: CanvasRenderingContext2D, sub: Substituent, progress: number) => {
        const t = ease(progress);
        drawCarboxylHub(ctx, sub, '#16a34a', 0.4);
        drawPill(ctx, 'LiAlH4 / ether', 820, 258, '#f0fdf4', '#16a34a', '#166534');
        drawPill(ctx, 'or B2H6', 990, 258, '#f0fdf4', '#16a34a', '#166534');
        drawPill(ctx, 'then H3O+', 910, 325, '#eff6ff', '#2563eb', '#1d4ed8');
        drawArrow(ctx, 760, 360, 610, 380, '#16a34a', 4);
        if (productsRef.current) {
            const x = lerp(900, 820, t);
            drawPill(ctx, 'RCH2OH', x, 480, '#f0fdf4', '#16a34a', '#166534');
            label(ctx, 'primary alcohol', x, 535, 16, 900, '#166534');
            drawPill(ctx, 'NaBH4: no reduction', 980, 610, '#fff1f2', '#fb7185', '#9f1239');
        }
    }, [drawCarboxylHub]);

    const drawDecarboxylation = useCallback((ctx: CanvasRenderingContext2D, sub: Substituent, progress: number) => {
        drawCarboxylHub(ctx, sub, '#ea580c', 0.5);
        drawPill(ctx, 'RCOONa', 730, 255, '#fff7ed', '#ea580c', '#9a3412');
        drawPill(ctx, 'NaOH : CaO = 3 : 1', 900, 255, '#fff7ed', '#ea580c', '#9a3412');
        drawPill(ctx, 'Heat', 1050, 255, '#fef2f2', '#dc2626', '#991b1b');
        drawArrow(ctx, 770, 330, 615, 380, '#ea580c', 4);
        if (productsRef.current) {
            drawPill(ctx, 'RH', 820, 455, '#fff7ed', '#ea580c', '#9a3412');
            drawPill(ctx, 'Na2CO3', 985, 455, '#ffffff', '#cbd5e1', '#334155');
            drawArrow(ctx, 760, 540, 930, 490, '#ea580c', 3, true);
            label(ctx, 'carboxyl carbon is retained in carbonate', 860, 650, 16, 900, '#9a3412');
        }
    }, [drawCarboxylHub]);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const currentMode = modeRef.current;
        const sub = SUBSTITUENTS.find(item => item.id === substituentRef.current) || SUBSTITUENTS[5];
        const current = MODES.find(item => item.id === currentMode) || MODES[0];
        const progress = (timeRef.current % 5.2) / 5.2;
        drawBackground(ctx);
        label(ctx, 'Carboxylic Acids: Key Reactions and Acidity', 640, 58, 24, 900, '#0f172a');
        drawPill(ctx, current.label, 640, 100, '#ffffff', current.color, current.color);

        if (currentMode === 'acidity') drawAcidity(ctx, sub, progress);
        if (currentMode === 'bicarbonate') drawBicarbonate(ctx, sub, progress);
        if (currentMode === 'esterification') drawEsterification(ctx, sub, progress);
        if (currentMode === 'acidChloride') drawAcidChloride(ctx, sub, progress);
        if (currentMode === 'reduction') drawReduction(ctx, sub, progress);
        if (currentMode === 'decarboxylation') drawDecarboxylation(ctx, sub, progress);

        label(ctx, current.short, 640, 720, 15, 900, current.color);
    }, [drawAcidChloride, drawAcidity, drawBicarbonate, drawDecarboxylation, drawEsterification, drawReduction]);

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
                    <div className="text-base font-extrabold text-slate-900">NCERT acidity ladder</div>
                    <div className="text-xs font-semibold text-slate-500">Relative order from lower to higher acid strength</div>
                    <svg viewBox="0 0 310 170" className="mt-2 h-[170px] w-full">
                        <line x1="22" y1="134" x2="288" y2="134" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                        <line x1="22" y1="134" x2="288" y2="134" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
                        {SUBSTITUENTS.map((item, index) => {
                            const x = 28 + (item.ladderPosition / 100) * 254;
                            const selected = item.id === substituentId;
                            return (
                                <g key={item.id}>
                                    <circle cx={x} cy={134 - index * 6} r={selected ? 8 : 5} fill={selected ? '#dc2626' : '#94a3b8'} />
                                    {selected && <text x={x} y={112 - index * 6} textAnchor="middle" fontSize="10" fontWeight="800" fill="#991b1b">{item.formula}</text>}
                                </g>
                            );
                        })}
                        <text x="22" y="160" fontSize="11" fontWeight="800" fill="#92400e">weak</text>
                        <text x="255" y="160" fontSize="11" fontWeight="800" fill="#991b1b">strong</text>
                    </svg>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Reaction map</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {MODES.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setMode(item.id)}
                                className={`rounded-xl border px-2 py-2 text-left text-xs font-extrabold transition ${mode === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Gas cues</div>
                    <div className="mt-2 space-y-2 text-sm font-semibold text-slate-700">
                        <div className="rounded-lg bg-cyan-50 px-3 py-2 text-cyan-800">NaHCO3 test: CO2 bubbles</div>
                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">SOCl2: SO2 and HCl escape</div>
                        <div className="rounded-lg bg-orange-50 px-3 py-2 text-orange-800">Soda lime: carboxyl C becomes carbonate</div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-950">NCERT focus</div>
                    <div className="text-xs font-semibold text-amber-700">Class 12 Chemistry, Ch 8, Sec. 8.9.1-8.10</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-900">
                        <div>Carboxylate ion is resonance stabilised.</div>
                        <div>EWG strengthens acid; EDG weakens acid.</div>
                        <div>pKa: CF3COOH 0.23; C6H5COOH 4.19; CH3COOH 4.76.</div>
                        <div>SOCl2 is preferred because gaseous products escape.</div>
                        <div>Soda lime (NaOH : CaO = 3 : 1) gives a hydrocarbon.</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</div>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Selected acid', value: activeSub.label, tone: 'bg-red-50 text-red-700' },
                            { label: 'Exact pKa', value: activeSub.pKa !== undefined ? activeSub.pKa.toFixed(2) : 'NCERT order only', tone: 'bg-violet-50 text-violet-700' },
                            { label: 'Substituent effect', value: activeSub.cue, tone: 'bg-blue-50 text-blue-700' },
                            { label: 'NCERT mode', value: activeMode.label, tone: 'bg-amber-50 text-amber-700' },
                            { label: 'Product cue', value: activeMode.short, tone: 'bg-emerald-50 text-emerald-700' }
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
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" aria-label="Carboxylic acid reactions and acidity simulation" />
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
                <FlaskConical size={18} className="text-amber-600" />
                Carboxylic Acids Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Mode</div>
                    <div className="grid grid-cols-2 gap-2">
                        {MODES.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setMode(item.id)}
                                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${mode === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="substituent-select">
                            Acid / substituent
                        </label>
                        <select
                            id="substituent-select"
                            value={substituentId}
                            onChange={event => setSubstituentId(event.target.value as SubstituentId)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
                        >
                            {SUBSTITUENTS.map(item => (
                                <option key={item.id} value={item.id}>{item.label}</option>
                            ))}
                        </select>
                    </div>
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
                            className="w-full accent-amber-600"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700">
                            <input type="checkbox" checked={showResonance} onChange={event => setShowResonance(event.target.checked)} className="accent-amber-600" />
                            Resonance
                        </label>
                        <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700">
                            <input type="checkbox" checked={showProducts} onChange={event => setShowProducts(event.target.checked)} className="accent-amber-600" />
                            Products
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

export default CarboxylicAcidsReactionsAcidityLab;
