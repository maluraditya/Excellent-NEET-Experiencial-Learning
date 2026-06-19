import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Atom, Beaker, Eye, EyeOff, FlaskConical, Pause, Play, RotateCcw, Sparkles, Target } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface AldehydeKetoneReactivityLabProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'mechanism' | 'steric' | 'electronic' | 'resonance' | 'bisulphite';
type CarbonylKind = 'aldehyde' | 'ketone';
type NucleophileId = 'cyanide' | 'bisulphite' | 'amine';

interface Nucleophile {
    id: NucleophileId;
    label: string;
    product: string;
    color: string;
    note: string;
}

const W = 1280;
const H = 760;

const NUCLEOPHILES: Nucleophile[] = [
    {
        id: 'cyanide',
        label: 'CN-',
        product: 'cyanohydrin',
        color: '#dc2626',
        note: 'HCN is base-catalysed; CN- is the stronger nucleophile.'
    },
    {
        id: 'bisulphite',
        label: 'HSO3-',
        product: 'bisulphite compound',
        color: '#0891b2',
        note: 'Equilibrium lies largely right for most aldehydes.'
    },
    {
        id: 'amine',
        label: 'H2N-Z',
        product: '>C=N-Z derivative',
        color: '#7c3aed',
        note: 'Ammonia derivatives add, then dehydrate to C=N-Z.'
    }
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
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
    const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 700);
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

function drawAtom(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string, stroke: string, text: string, textColor = '#0f172a') {
    const grad = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.35, 2, x, y, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, fill);
    ctx.fillStyle = grad;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, Math.max(10, radius * 0.48), 900, textColor);
}

function drawBond(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = '#94a3b8', width = 5, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    if (dashed) ctx.setLineDash([9, 8]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, dashed = false) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
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
    ctx.lineTo(x2 - 12 * Math.cos(angle - Math.PI / 6), y2 - 12 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 12 * Math.cos(angle + Math.PI / 6), y2 - 12 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, stroke: string, color: string) {
    const width = Math.max(90, text.length * 7.6 + 28);
    roundRect(ctx, x - width / 2, y - 17, width, 34, 17);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.6;
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, 12, 900, color);
}

const AldehydeKetoneReactivityLab: React.FC<AldehydeKetoneReactivityLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastRef = useRef<number | null>(null);
    const timeRef = useRef(0);

    const [mode, setMode] = useState<Mode>('mechanism');
    const [selectedKind, setSelectedKind] = useState<CarbonylKind>('aldehyde');
    const [nucleophileId, setNucleophileId] = useState<NucleophileId>('cyanide');
    const [showPolarity, setShowPolarity] = useState(true);
    const [showSteric, setShowSteric] = useState(true);
    const [showIntermediate, setShowIntermediate] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);

    const modeRef = useRef(mode);
    const kindRef = useRef(selectedKind);
    const nucleophileRef = useRef(nucleophileId);
    const polarityRef = useRef(showPolarity);
    const stericRef = useRef(showSteric);
    const intermediateRef = useRef(showIntermediate);
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);

    const activeNu = NUCLEOPHILES.find((item) => item.id === nucleophileId) ?? NUCLEOPHILES[0];
    const aldehydeScore = activeNu.id === 'bisulphite' ? 0.9 : 0.84;
    const ketoneScore = activeNu.id === 'bisulphite' ? 0.28 : 0.48;
    const selectedScore = selectedKind === 'aldehyde' ? aldehydeScore : ketoneScore;

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { kindRef.current = selectedKind; }, [selectedKind]);
    useEffect(() => { nucleophileRef.current = nucleophileId; }, [nucleophileId]);
    useEffect(() => { polarityRef.current = showPolarity; }, [showPolarity]);
    useEffect(() => { stericRef.current = showSteric; }, [showSteric]);
    useEffect(() => { intermediateRef.current = showIntermediate; }, [showIntermediate]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    const handleReset = useCallback(() => {
        setMode('mechanism');
        setSelectedKind('aldehyde');
        setNucleophileId('cyanide');
        setShowPolarity(true);
        setShowSteric(true);
        setShowIntermediate(true);
        setPaused(false);
        setSpeed(1);
        timeRef.current = 0;
        lastRef.current = null;
    }, []);

    const drawCarbonyl = useCallback((
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        kind: CarbonylKind,
        progress: number,
        nucleophile: Nucleophile,
        compact = false
    ) => {
        const scale = compact ? 0.78 : 1;
        const success = kind === 'aldehyde' ? aldehydeScore : ketoneScore;
        const activeProgress = clamp(progress / Math.max(0.22, 1.08 - success * 0.55), 0, 1);
        const attack = ease(clamp(activeProgress / 0.48, 0, 1));
        const intermediate = activeProgress > 0.42 && activeProgress < 0.72;
        const product = ease(clamp((activeProgress - 0.68) / 0.32, 0, 1));
        const nuX = lerp(cx - 250 * scale, cx - 54 * scale, attack);
        const nuY = lerp(cy + 154 * scale, cy + 54 * scale, attack);
        const cColor = kind === 'aldehyde' ? '#fde68a' : '#fed7aa';
        const glow = kind === 'aldehyde' ? '#f59e0b' : '#f97316';

        if (stericRef.current) {
            const shieldAlpha = kind === 'aldehyde' ? 0.14 : 0.31;
            const shieldSize = kind === 'aldehyde' ? 74 : 116;
            ctx.save();
            ctx.globalAlpha = shieldAlpha;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.ellipse(cx + 86 * scale, cy + 78 * scale, shieldSize * scale, 52 * scale, -0.15, 0, Math.PI * 2);
            ctx.fill();
            if (kind === 'ketone') {
                ctx.beginPath();
                ctx.ellipse(cx - 72 * scale, cy + 106 * scale, shieldSize * 0.82 * scale, 48 * scale, 0.25, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        ctx.save();
        if (polarityRef.current) {
            ctx.shadowColor = glow;
            ctx.shadowBlur = kind === 'aldehyde' ? 28 : 16;
        }
        drawAtom(ctx, cx, cy, 42 * scale, cColor, glow, 'C', '#78350f');
        ctx.restore();

        const oX = cx;
        const oY = cy - 118 * scale;
        drawBond(ctx, cx - 8 * scale, cy - 38 * scale, oX - 8 * scale, oY + 32 * scale, intermediate || product ? '#cbd5e1' : '#475569', 4 * scale, intermediate);
        drawBond(ctx, cx + 8 * scale, cy - 38 * scale, oX + 8 * scale, oY + 32 * scale, product ? '#cbd5e1' : '#475569', 4 * scale, intermediate || product > 0.02);
        drawAtom(ctx, oX, oY, 34 * scale, '#fecaca', '#dc2626', product > 0.45 ? 'OH' : intermediate ? 'O-' : 'O', '#7f1d1d');

        if (intermediate) {
            const protonX = lerp(cx + 238 * scale, cx + 72 * scale, ease(clamp((activeProgress - 0.42) / 0.3, 0, 1)));
            const protonY = lerp(cy - 190 * scale, oY - 18 * scale, ease(clamp((activeProgress - 0.42) / 0.3, 0, 1)));
            drawAtom(ctx, protonX, protonY, 22 * scale, '#ddd6fe', '#7c3aed', 'H+', '#4c1d95');
            drawArrow(ctx, protonX - 26 * scale, protonY, oX + 35 * scale, oY - 4 * scale, '#7c3aed', true);
        }

        drawBond(ctx, cx + 38 * scale, cy + 15 * scale, cx + 134 * scale, cy + 78 * scale, '#94a3b8', 5 * scale);
        drawAtom(ctx, cx + 166 * scale, cy + 100 * scale, kind === 'aldehyde' ? 31 * scale : 38 * scale, kind === 'aldehyde' ? '#e2e8f0' : '#fbbf24', kind === 'aldehyde' ? '#64748b' : '#d97706', kind === 'aldehyde' ? 'H' : 'R');

        drawBond(ctx, cx - 38 * scale, cy + 15 * scale, cx - 134 * scale, cy + 78 * scale, '#94a3b8', 5 * scale);
        drawAtom(ctx, cx - 166 * scale, cy + 100 * scale, 38 * scale, '#fbbf24', '#d97706', 'R');

        drawAtom(ctx, nuX, nuY, 34 * scale, nucleophile.color, nucleophile.color, nucleophile.label, '#ffffff');
        drawBond(ctx, nuX + 28 * scale, nuY - 14 * scale, cx - 32 * scale, cy + 30 * scale, nucleophile.color, 3 * scale, !product);

        if (intermediate && intermediateRef.current) {
            ctx.save();
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 20;
            drawPill(ctx, 'sp2 -> sp3', cx, cy + 192 * scale, '#dcfce7', '#86efac', '#166534');
            drawPill(ctx, 'tetrahedral intermediate', cx, cy + 230 * scale, '#ffffff', '#bbf7d0', '#166534');
            ctx.restore();
        }

        if (product > 0.45 && intermediateRef.current) {
            drawPill(ctx, 'H+ captured: neutral addition product', cx, cy + 226 * scale, '#ede9fe', '#c4b5fd', '#5b21b6');
        }

        if (polarityRef.current) {
            drawPill(ctx, kind === 'aldehyde' ? 'more electrophilic C' : 'less electrophilic C', cx, cy - 202 * scale, kind === 'aldehyde' ? '#fef3c7' : '#ffedd5', kind === 'aldehyde' ? '#f59e0b' : '#fb923c', kind === 'aldehyde' ? '#92400e' : '#9a3412');
            label(ctx, 'delta+', cx + 58 * scale, cy - 24 * scale, 13, 900, '#dc2626');
            label(ctx, 'delta-', oX + 46 * scale, oY - 6 * scale, 13, 900, '#2563eb');
        }

        if (!compact) {
            label(ctx, kind === 'aldehyde' ? 'Aldehyde: one R and one H' : 'Ketone: two R groups', cx, cy + 310 * scale, 20, 900, kind === 'aldehyde' ? '#92400e' : '#9a3412');
            label(ctx, kind === 'aldehyde' ? 'Less crowded attack path' : 'More crowded attack path', cx, cy + 342 * scale, 14, 900, '#475569');
        }

        if (activeProgress < 0.5) {
            drawArrow(ctx, nuX + 45 * scale, nuY - 28 * scale, cx - 44 * scale, cy + 14 * scale, nucleophile.color, true);
        }
    }, [aldehydeScore, ketoneScore]);

    const drawMechanism = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
        const nu = NUCLEOPHILES.find((item) => item.id === nucleophileRef.current) ?? NUCLEOPHILES[0];
        const progress = (time % 5.6) / 5.6;
        drawBackground(ctx);
        label(ctx, 'Nucleophilic addition to the carbonyl group', W / 2, 68, 29, 900, '#0f172a');
        label(ctx, 'Nu- attacks approximately perpendicular to the sp2 carbonyl plane', W / 2, 102, 15, 800, '#475569');

        if (kindRef.current === 'aldehyde') {
            drawCarbonyl(ctx, 640, 360, 'aldehyde', progress, nu);
        } else {
            drawCarbonyl(ctx, 640, 360, 'ketone', progress, nu);
        }

        drawPill(ctx, nu.product, 640, 705, '#ffffff', '#cbd5e1', '#334155');
    }, [drawCarbonyl]);

    const drawComparison = useCallback((ctx: CanvasRenderingContext2D, time: number, comparisonMode: 'steric' | 'electronic') => {
        const nu = NUCLEOPHILES.find((item) => item.id === nucleophileRef.current) ?? NUCLEOPHILES[0];
        const progress = (time % 5.6) / 5.6;
        drawBackground(ctx);
        label(ctx, comparisonMode === 'steric' ? 'Steric reason: ketones block nucleophile approach' : 'Electronic reason: two alkyl groups reduce electrophilicity', W / 2, 68, 28, 900, '#0f172a');
        label(ctx, 'NCERT: aldehydes are generally more reactive than ketones in nucleophilic addition', W / 2, 102, 15, 800, '#475569');

        drawCarbonyl(ctx, 355, 360, 'aldehyde', progress, nu, true);
        drawCarbonyl(ctx, 925, 360, 'ketone', progress, nu, true);
        drawPill(ctx, 'Aldehyde faster', 355, 655, '#dcfce7', '#86efac', '#166534');
        drawPill(ctx, 'Ketone slower', 925, 655, '#fee2e2', '#fca5a5', '#991b1b');

        if (comparisonMode === 'electronic') {
            const rows = [
                { x: 355, value: 84, label: 'higher delta+', color: '#f59e0b' },
                { x: 925, value: 48, label: 'lower delta+', color: '#f97316' }
            ];
            rows.forEach((row) => {
                roundRect(ctx, row.x - 120, 170, 240, 24, 12);
                ctx.fillStyle = '#f1f5f9';
                ctx.fill();
                roundRect(ctx, row.x - 120, 170, row.value * 2.4, 24, 12);
                ctx.fillStyle = row.color;
                ctx.fill();
                label(ctx, row.label, row.x, 210, 13, 900, '#475569');
            });
        }
    }, [drawCarbonyl]);

    const drawBisulphite = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
        const nu = NUCLEOPHILES[1];
        const progress = (time % 5.6) / 5.6;
        drawBackground(ctx);
        label(ctx, 'Bisulphite addition: aldehydes vs ketones', W / 2, 68, 29, 900, '#0f172a');
        label(ctx, 'NCERT: equilibrium lies largely right for most aldehydes and left for most ketones due to steric reasons', W / 2, 102, 14, 800, '#475569');
        drawCarbonyl(ctx, 355, 355, 'aldehyde', progress, nu, true);
        drawCarbonyl(ctx, 925, 355, 'ketone', progress, nu, true);

        const rows = [
            { x: 355, width: 230, label: 'product side favoured', color: '#16a34a' },
            { x: 925, width: 82, label: 'reactant side favoured', color: '#dc2626' }
        ];
        rows.forEach((row) => {
            roundRect(ctx, row.x - 150, 612, 300, 28, 14);
            ctx.fillStyle = '#f1f5f9';
            ctx.fill();
            roundRect(ctx, row.x - 150, 612, row.width, 28, 14);
            ctx.fillStyle = row.color;
            ctx.fill();
            label(ctx, row.label, row.x, 665, 16, 900, row.color);
        });
        label(ctx, 'Crystalline, water-soluble adduct; dilute mineral acid or alkali regenerates the carbonyl compound', W / 2, 714, 13, 800, '#475569');
    }, [drawCarbonyl]);

    const drawResonance = useCallback((ctx: CanvasRenderingContext2D) => {
        drawBackground(ctx);
        label(ctx, 'NCERT Example 8.3: benzaldehyde vs propanal', W / 2, 68, 29, 900, '#0f172a');
        label(ctx, 'Resonance reduces carbonyl polarity in benzaldehyde, so its carbonyl carbon is less electrophilic', W / 2, 102, 14, 800, '#475569');

        const cards = [
            { x: 130, title: 'Propanal', formula: 'CH3CH2-CHO', detail: 'No aryl resonance donation', result: 'more reactive', color: '#16a34a' },
            { x: 680, title: 'Benzaldehyde', formula: 'C6H5-CHO', detail: 'Carbonyl conjugated with benzene ring', result: 'less reactive', color: '#dc2626' }
        ];
        cards.forEach((card) => {
            roundRect(ctx, card.x, 180, 470, 390, 28);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = card.color;
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();
            label(ctx, card.title, card.x + 235, 230, 26, 900, '#0f172a');
            drawPill(ctx, card.formula, card.x + 235, 292, '#f8fafc', '#cbd5e1', '#334155');
            label(ctx, 'O is delta-; carbonyl C is delta+', card.x + 235, 362, 17, 800, '#475569');
            label(ctx, card.detail, card.x + 235, 414, 16, 800, '#475569');
            if (card.title === 'Benzaldehyde') {
                drawArrow(ctx, card.x + 130, 468, card.x + 340, 468, '#7c3aed');
                label(ctx, 'resonance delocalisation', card.x + 235, 500, 14, 900, '#6d28d9');
            }
            drawPill(ctx, card.result, card.x + 235, 538, card.result === 'more reactive' ? '#dcfce7' : '#fee2e2', card.result === 'more reactive' ? '#86efac' : '#fca5a5', card.color);
        });
        drawPill(ctx, 'Propanal > benzaldehyde in nucleophilic addition reactivity', W / 2, 650, '#fef3c7', '#fbbf24', '#92400e');
    }, []);

    useEffect(() => {
        const draw = (now: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            const last = lastRef.current ?? now;
            const dt = Math.min((now - last) / 1000, 0.08);
            lastRef.current = now;
            if (!pausedRef.current) timeRef.current += dt * speedRef.current;

            if (modeRef.current === 'steric') drawComparison(ctx, timeRef.current, 'steric');
            else if (modeRef.current === 'electronic') drawComparison(ctx, timeRef.current, 'electronic');
            else if (modeRef.current === 'resonance') drawResonance(ctx);
            else if (modeRef.current === 'bisulphite') drawBisulphite(ctx, timeRef.current);
            else drawMechanism(ctx, timeRef.current);

            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [drawBisulphite, drawComparison, drawMechanism, drawResonance]);

    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Relative reactivity</h3>
                    <p className="text-xs font-semibold text-slate-500">Qualitative NCERT comparison</p>
                    <div className="mt-4 space-y-3">
                        {[
                            { label: 'Aldehyde', value: aldehydeScore, color: '#16a34a' },
                            { label: 'Ketone', value: ketoneScore, color: '#dc2626' }
                        ].map((row) => (
                            <div key={row.label}>
                                <div className="flex justify-between text-xs font-black text-slate-700">
                                    <span>{row.label}</span>
                                    <span>{row.label === 'Aldehyde' ? 'higher' : 'lower'}</span>
                                </div>
                                <div className="mt-1 h-3 rounded-full bg-slate-100">
                                    <div className="h-3 rounded-full" style={{ width: `${row.value * 100}%`, backgroundColor: row.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Attack path</h3>
                    <p className="text-xs font-semibold text-slate-500">Steric crowding cue</p>
                    <svg viewBox="0 0 320 160" className="mt-2 h-[160px] w-full">
                        <circle cx="95" cy="78" r="30" fill="#fde68a" stroke="#d97706" strokeWidth="3" />
                        <circle cx="72" cy="118" r="24" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
                        <circle cx="120" cy="120" r="18" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
                        <path d="M22 125 L66 92" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
                        <text x="95" y="24" textAnchor="middle" fontSize="12" fontWeight="900" fill="#166534">aldehyde open</text>
                        <circle cx="235" cy="78" r="30" fill="#fed7aa" stroke="#f97316" strokeWidth="3" />
                        <circle cx="207" cy="118" r="28" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
                        <circle cx="265" cy="118" r="28" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
                        <path d="M168 128 L206 96" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 7" />
                        <text x="235" y="24" textAnchor="middle" fontSize="12" fontWeight="900" fill="#991b1b">ketone crowded</text>
                    </svg>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">NCERT sequence</h3>
                    <div className="mt-2 space-y-2 text-sm font-bold leading-snug text-slate-700">
                        <p>1. Nu- attacks electrophilic carbonyl carbon.</p>
                        <p>2. Carbon changes from sp2 to sp3.</p>
                        <p>3. Tetrahedral alkoxide intermediate captures H+.</p>
                    </div>
                </div>
            </div>
        </aside>
    ), [aldehydeScore, ketoneScore]);

    const valuesPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/95 p-4 shadow-xl backdrop-blur">
                    <h3 className="text-base font-extrabold text-cyan-950">Carbonyl Reactivity</h3>
                    <p className="text-xs font-semibold text-cyan-700">NCERT Class 12 Chemistry, Ch. Aldehydes, Ketones and Carboxylic Acids</p>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-cyan-950">
                        <p>Aldehydes and ketones both possess the carbonyl functional group.</p>
                        <p>They undergo nucleophilic addition reactions.</p>
                        <p>Aldehydes are generally more reactive due to steric and electronic reasons.</p>
                        <p>Ketones have two relatively large substituents.</p>
                        <p>Two alkyl groups reduce carbonyl-carbon electrophilicity more effectively.</p>
                        <p>The carbonyl carbon is sp2 hybridised, trigonal coplanar, with bond angles near 120 degrees.</p>
                        <p>Attack produces a tetrahedral alkoxide; proton capture gives a neutral product.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Substrate', value: selectedKind === 'aldehyde' ? 'Aldehyde' : 'Ketone', tone: 'bg-slate-50 text-slate-900' },
                            { label: 'Nucleophile', value: activeNu.label, tone: 'bg-red-50 text-red-800' },
                            { label: 'Product cue', value: activeNu.product, tone: 'bg-cyan-50 text-cyan-800' },
                            { label: 'Reactivity cue', value: selectedKind === 'aldehyde' ? 'generally higher' : 'generally lower', tone: selectedKind === 'aldehyde' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800' },
                            { label: 'NCERT reason', value: selectedKind === 'aldehyde' ? 'less steric hindrance' : 'less electrophilic C', tone: 'bg-violet-50 text-violet-800' }
                        ].map((row) => (
                            <div key={row.label} className={`rounded-lg border border-slate-100 px-3 py-2.5 ${row.tone}`}>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                                <div className="mt-1 font-mono text-sm font-extrabold">{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Selected reaction</h3>
                    <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">{activeNu.note}</p>
                </div>
            </div>
        </aside>
    ), [activeNu, selectedKind, selectedScore]);

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="absolute inset-0 h-full w-full"
                    aria-label="Aldehyde and ketone nucleophilic addition simulation"
                />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        onClick={() => setPaused((value) => !value)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50"
                        title={paused ? 'Play' : 'Pause'}
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button
                        onClick={handleReset}
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

    const modeButtons: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
        { id: 'mechanism', label: 'Mechanism', icon: <Target size={15} /> },
        { id: 'steric', label: 'Steric', icon: <Atom size={15} /> },
        { id: 'electronic', label: 'Electronic', icon: <Sparkles size={15} /> },
        { id: 'resonance', label: 'Resonance', icon: <Activity size={15} /> },
        { id: 'bisulphite', label: 'Bisulphite', icon: <Beaker size={15} /> }
    ];

    const controls = (
        <div className="grid min-h-0 auto-rows-min grid-cols-12 content-start gap-2.5 text-slate-900">
            <div className="col-span-12 flex min-w-0 items-center gap-2 lg:col-span-3">
                <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                    <FlaskConical size={18} />
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900">Carbonyl Reactivity Bench</div>
                    <div className="truncate text-[11px] font-black text-slate-500">aldehyde vs ketone</div>
                </div>
            </div>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:col-span-6">
                <div className="grid grid-cols-5 gap-1.5">
                    {modeButtons.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setMode(item.id)}
                            className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 text-[10px] font-black leading-tight transition ${
                                mode === item.id ? 'border-cyan-500 bg-cyan-50 text-cyan-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            title={item.label}
                        >
                            {item.icon}
                            <span className="w-full truncate text-center">{item.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:col-span-3">
                <div className="grid grid-cols-2 gap-1.5">
                    {(['aldehyde', 'ketone'] as CarbonylKind[]).map((item) => (
                        <button
                            key={item}
                            onClick={() => setSelectedKind(item)}
                            className={`min-h-[42px] rounded-xl border px-2 text-xs font-black capitalize ${
                                selectedKind === item ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-3">
                <label className="block">
                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Nucleophile</span>
                    <select value={nucleophileId} onChange={(event) => setNucleophileId(event.target.value as NucleophileId)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800">
                        {NUCLEOPHILES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                </label>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-3">
                <label className="block">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Animation speed</span>
                        <output>{speed.toFixed(1)}x</output>
                    </div>
                    <input className="w-full accent-cyan-600" type="range" min={0.2} max={2.5} step={0.1} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
                </label>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-4">
                <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Display toggles</div>
                <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => setShowPolarity((value) => !value)} className={`rounded-xl border px-2 py-2 text-xs font-black ${showPolarity ? 'border-red-300 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show carbonyl polarity">
                        {showPolarity ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} Polarity
                    </button>
                    <button onClick={() => setShowSteric((value) => !value)} className={`rounded-xl border px-2 py-2 text-xs font-black ${showSteric ? 'border-orange-300 bg-orange-50 text-orange-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show steric shields">
                        <Activity size={15} className="mx-auto" /> Steric
                    </button>
                    <button onClick={() => setShowIntermediate((value) => !value)} className={`rounded-xl border px-2 py-2 text-xs font-black ${showIntermediate ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show tetrahedral intermediate">
                        <Sparkles size={15} className="mx-auto" /> Intermediate
                    </button>
                </div>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-2">
                <button
                    onClick={() => setPaused((value) => !value)}
                    className={`flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-black ${paused ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    title={paused ? 'Play' : 'Pause'}
                >
                    {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? 'Paused' : 'Running'}
                </button>
            </section>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controls}
            controlsAreaFlex="0 0 250px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1100px)] overflow-y-auto overscroll-contain bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default AldehydeKetoneReactivityLab;
