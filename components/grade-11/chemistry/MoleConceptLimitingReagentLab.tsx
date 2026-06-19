import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atom, Beaker, FlaskConical, Pause, Play, RotateCcw, Scale } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface MoleConceptLimitingReagentLabProps {
    topic: any;
    onExit: () => void;
}

type ReactionId = 'methane' | 'ammonia';
type UnitMode = 'moles' | 'mass';

interface Species {
    id: string;
    label: string;
    molarMass: number;
    color: string;
}

interface Reaction {
    id: ReactionId;
    title: string;
    reactants: [Species, Species];
    products: [Species, Species?];
    reactantCoeffs: [number, number];
    productCoeffs: [number, number?];
    note: string;
}

const W = 1280;
const H = 760;
const AVOGADRO = 6.02214076e23;

const REACTIONS: Record<ReactionId, Reaction> = {
    methane: {
        id: 'methane',
        title: 'Methane combustion',
        reactants: [
            { id: 'CH4', label: 'CH4', molarMass: 16, color: '#0891b2' },
            { id: 'O2', label: 'O2', molarMass: 32, color: '#dc2626' }
        ],
        products: [
            { id: 'CO2', label: 'CO2', molarMass: 44, color: '#16a34a' },
            { id: 'H2O', label: 'H2O', molarMass: 18, color: '#2563eb' }
        ],
        reactantCoeffs: [1, 2],
        productCoeffs: [1, 2],
        note: '1 mol CH4 needs 2 mol O2'
    },
    ammonia: {
        id: 'ammonia',
        title: 'Ammonia synthesis',
        reactants: [
            { id: 'N2', label: 'N2', molarMass: 28, color: '#7c3aed' },
            { id: 'H2', label: 'H2', molarMass: 2.016, color: '#f59e0b' }
        ],
        products: [
            { id: 'NH3', label: 'NH3', molarMass: 17, color: '#16a34a' }
        ],
        reactantCoeffs: [1, 3],
        productCoeffs: [2],
        note: '1 mol N2 needs 3 mol H2'
    }
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
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
    const bg = ctx.createRadialGradient(W / 2, H / 2, 70, W / 2, H / 2, 720);
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

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 4, dashed = false) {
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

function drawPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, stroke: string, color = '#0f172a') {
    const width = Math.max(86, text.length * 8.5 + 30);
    roundRect(ctx, x - width / 2, y - 19, width, 38, 19);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, 13, 900, color);
}

function drawParticle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, text: string, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, Math.max(10, r * 0.52), 900, '#ffffff');
    ctx.restore();
}

function format(value: number, digits = 2) {
    if (!Number.isFinite(value)) return '0';
    if (Math.abs(value) >= 100) return value.toFixed(0);
    return value.toFixed(digits).replace(/\.00$/, '');
}

function formatScientific(value: number, digits = 2) {
    if (!Number.isFinite(value) || value === 0) return '0';
    const exponent = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = value / 10 ** exponent;
    return `${mantissa.toFixed(digits)} x 10^${exponent}`;
}

const MoleConceptLimitingReagentLab: React.FC<MoleConceptLimitingReagentLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastRef = useRef<number | null>(null);
    const timeRef = useRef(0);
    const [reactionId, setReactionId] = useState<ReactionId>('methane');
    const [unitMode, setUnitMode] = useState<UnitMode>('moles');
    const [amountA, setAmountA] = useState(3);
    const [amountB, setAmountB] = useState(4);
    const [showExcess, setShowExcess] = useState(true);
    const [showBatches, setShowBatches] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);

    const reactionRef = useRef(reactionId);
    const unitModeRef = useRef(unitMode);
    const amountARef = useRef(amountA);
    const amountBRef = useRef(amountB);
    const showExcessRef = useRef(showExcess);
    const showBatchesRef = useRef(showBatches);
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);

    useEffect(() => { reactionRef.current = reactionId; }, [reactionId]);
    useEffect(() => { unitModeRef.current = unitMode; }, [unitMode]);
    useEffect(() => { amountARef.current = amountA; }, [amountA]);
    useEffect(() => { amountBRef.current = amountB; }, [amountB]);
    useEffect(() => { showExcessRef.current = showExcess; }, [showExcess]);
    useEffect(() => { showBatchesRef.current = showBatches; }, [showBatches]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    const reaction = useMemo(() => REACTIONS[reactionId], [reactionId]);

    const calculated = useMemo(() => {
        const r = reaction;
        const rawA = amountA;
        const rawB = amountB;
        const molA = unitMode === 'moles' ? rawA : rawA / r.reactants[0].molarMass;
        const molB = unitMode === 'moles' ? rawB : rawB / r.reactants[1].molarMass;
        const extA = molA / r.reactantCoeffs[0];
        const extB = molB / r.reactantCoeffs[1];
        const extent = Math.min(extA, extB);
        const limitingIndex = extA <= extB ? 0 : 1;
        const productMolesA = extent * r.productCoeffs[0];
        const productMolesB = r.productCoeffs[1] ? extent * r.productCoeffs[1] : 0;
        const excessA = Math.max(0, molA - extent * r.reactantCoeffs[0]);
        const excessB = Math.max(0, molB - extent * r.reactantCoeffs[1]);
        return { molA, molB, extent, limitingIndex, productMolesA, productMolesB, excessA, excessB };
    }, [amountA, amountB, reaction, unitMode]);

    const handleReset = useCallback(() => {
        setReactionId('methane');
        setUnitMode('moles');
        setAmountA(3);
        setAmountB(4);
        setShowExcess(true);
        setShowBatches(true);
        setPaused(false);
        setSpeed(1);
        timeRef.current = 0;
        lastRef.current = null;
    }, []);

    const handleReactionChange = useCallback((id: ReactionId) => {
        setReactionId(id);
        setAmountA(id === 'methane' ? 3 : 6);
        setAmountB(id === 'methane' ? 4 : 12);
    }, []);

    const getLive = useCallback(() => {
        const r = REACTIONS[reactionRef.current];
        const rawA = amountARef.current;
        const rawB = amountBRef.current;
        const molA = unitModeRef.current === 'moles' ? rawA : rawA / r.reactants[0].molarMass;
        const molB = unitModeRef.current === 'moles' ? rawB : rawB / r.reactants[1].molarMass;
        const extA = molA / r.reactantCoeffs[0];
        const extB = molB / r.reactantCoeffs[1];
        const extent = Math.min(extA, extB);
        const limitingIndex = extA <= extB ? 0 : 1;
        return { r, molA, molB, extent, limitingIndex };
    }, []);

    const drawReservoir = useCallback((
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        species: Species,
        coeff: number,
        moles: number,
        limiting: boolean,
        consumedFraction: number
    ) => {
        roundRect(ctx, x, y, w, h, 24);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = limiting ? '#dc2626' : '#cbd5e1';
        ctx.lineWidth = limiting ? 4 : 2;
        ctx.fill();
        ctx.stroke();

        const fill = clamp(1 - consumedFraction, 0, 1);
        roundRect(ctx, x + 14, y + h - 18 - fill * (h - 72), w - 28, fill * (h - 72), 18);
        ctx.fillStyle = species.color + '33';
        ctx.fill();

        label(ctx, species.label, x + w / 2, y + 36, 26, 900, species.color);
        label(ctx, `${coeff} mol packet`, x + w / 2, y + 68, 14, 800, '#475569');
        label(ctx, `${format(moles)} mol`, x + w / 2, y + h - 28, 15, 900, limiting ? '#dc2626' : '#334155');

        const particleCount = Math.min(16, Math.max(4, Math.round(moles * 2)));
        for (let i = 0; i < particleCount; i += 1) {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const px = x + 42 + col * 42 + Math.sin(timeRef.current * 2 + i) * 3;
            const py = y + 104 + row * 38 + Math.cos(timeRef.current * 1.7 + i) * 3;
            if (py < y + h - 54) drawParticle(ctx, px, py, 14, species.color, species.label, 0.88);
        }

        if (limiting) {
            drawPill(ctx, 'LIMITING', x + w / 2, y - 20, '#fff1f2', '#dc2626', '#991b1b');
        }
    }, []);

    const drawMachine = useCallback((ctx: CanvasRenderingContext2D, r: Reaction, progress: number) => {
        const cx = 610;
        const cy = 385;
        roundRect(ctx, cx - 135, cy - 112, 270, 224, 30);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();

        label(ctx, 'MOLE RATIO', cx, cy - 68, 18, 900, '#0f172a');
        label(ctx, `${r.reactantCoeffs[0]}:${r.reactantCoeffs[1]}`, cx - 48, cy - 18, 30, 900, '#334155');
        label(ctx, '->', cx, cy - 18, 24, 900, '#64748b');
        label(ctx, `${r.productCoeffs[0]}${r.productCoeffs[1] ? `:${r.productCoeffs[1]}` : ''}`, cx + 54, cy - 18, 30, 900, '#16a34a');

        ctx.save();
        ctx.translate(cx, cy + 58);
        ctx.rotate(progress * Math.PI * 2);
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 7;
        for (let i = 0; i < 8; i += 1) {
            const a = (Math.PI * 2 * i) / 8;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
            ctx.lineTo(Math.cos(a) * 49, Math.sin(a) * 49);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }, []);

    const drawProductBin = useCallback((ctx: CanvasRenderingContext2D, r: Reaction, productMolesA: number, productMolesB: number, progress: number) => {
        const x = 900;
        const y = 250;
        const w = 250;
        const h = 270;
        roundRect(ctx, x, y, w, h, 24);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        label(ctx, 'PRODUCT', x + w / 2, y + 34, 19, 900, '#166534');
        label(ctx, r.products[0].label, x + w / 2 - (r.products[1] ? 45 : 0), y + 72, 22, 900, r.products[0].color);
        if (r.products[1]) label(ctx, r.products[1].label, x + w / 2 + 58, y + 72, 22, 900, r.products[1].color);

        const fill = clamp((productMolesA + productMolesB) / 10, 0.12, 1);
        roundRect(ctx, x + 18, y + h - 22 - fill * 132, w - 36, fill * 132, 18);
        ctx.fillStyle = 'rgba(22,163,74,0.16)';
        ctx.fill();

        const count = Math.min(22, Math.max(3, Math.round(productMolesA + productMolesB)));
        for (let i = 0; i < count; i += 1) {
            const px = x + 50 + (i % 5) * 38;
            const py = y + 122 + Math.floor(i / 5) * 34 + Math.sin(progress * 6 + i) * 2;
            const sp = i % 3 === 0 && r.products[1] ? r.products[1] : r.products[0];
            drawParticle(ctx, px, py, 13, sp.color, sp.label, 0.9);
        }

        label(ctx, `${format(productMolesA)} mol ${r.products[0].label}`, x + w / 2, y + h - 45, 14, 900, '#166534');
        if (r.products[1]) label(ctx, `${format(productMolesB)} mol ${r.products[1].label}`, x + w / 2, y + h - 22, 13, 900, '#1d4ed8');
    }, []);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { r, molA, molB, extent, limitingIndex } = getLive();
        const progress = (timeRef.current % 5.5) / 5.5;
        const cycle = ease(progress);
        const reactExtentA = molA / r.reactantCoeffs[0];
        const reactExtentB = molB / r.reactantCoeffs[1];
        const consumedA = extent * r.reactantCoeffs[0] / Math.max(0.001, molA);
        const consumedB = extent * r.reactantCoeffs[1] / Math.max(0.001, molB);
        const productA = extent * r.productCoeffs[0];
        const productB = r.productCoeffs[1] ? extent * r.productCoeffs[1] : 0;

        drawBackground(ctx);
        label(ctx, 'Mole Concept and Limiting Reagent', 640, 58, 25, 900, '#0f172a');
        drawPill(ctx, r.title, 640, 102, '#ffffff', '#0891b2', '#075985');

        const leftX = 110;
        const topY = 170;
        const bottomY = 430;
        const reservoirW = 250;
        const reservoirH = 220;
        const machineLeft = 475;
        const machineRight = 745;
        const machineCenterY = 385;
        const productLeft = 900;

        drawReservoir(ctx, leftX, topY, reservoirW, reservoirH, r.reactants[0], r.reactantCoeffs[0], molA, limitingIndex === 0, consumedA * cycle);
        drawReservoir(ctx, leftX, bottomY, reservoirW, reservoirH, r.reactants[1], r.reactantCoeffs[1], molB, limitingIndex === 1, consumedB * cycle);

        drawArrow(ctx, leftX + reservoirW, topY + 110, machineLeft, machineCenterY - 46, r.reactants[0].color, 4);
        drawArrow(ctx, leftX + reservoirW, bottomY + 82, machineLeft, machineCenterY + 46, r.reactants[1].color, 4);
        drawMachine(ctx, r, progress);
        drawArrow(ctx, machineRight, machineCenterY, productLeft, machineCenterY, '#16a34a', 5);
        drawProductBin(ctx, r, productA, productB, progress);

        if (showBatchesRef.current) {
            const packetY = 685;
            drawPill(ctx, `${r.reactantCoeffs[0]} ${r.reactants[0].label}`, 205, packetY, '#ffffff', r.reactants[0].color, r.reactants[0].color);
            drawPill(ctx, `${r.reactantCoeffs[1]} ${r.reactants[1].label}`, 380, packetY, '#ffffff', r.reactants[1].color, r.reactants[1].color);
            drawArrow(ctx, 465, packetY, 555, packetY, '#64748b', 3);
            drawPill(ctx, `${r.productCoeffs[0]} ${r.products[0].label}${r.products[1] ? ` + ${r.productCoeffs[1]} ${r.products[1].label}` : ''}`, 735, packetY, '#f0fdf4', '#16a34a', '#166534');
        }

        if (showExcessRef.current) {
            const excessA = Math.max(0, molA - extent * r.reactantCoeffs[0]);
            const excessB = Math.max(0, molB - extent * r.reactantCoeffs[1]);
            const excessBadgeX = leftX + reservoirW + 92;
            if (excessA > 0.01) drawPill(ctx, `excess ${format(excessA)} mol`, excessBadgeX, topY + reservoirH - 28, '#f8fafc', '#94a3b8', '#334155');
            if (excessB > 0.01) drawPill(ctx, `excess ${format(excessB)} mol`, excessBadgeX, bottomY + reservoirH - 28, '#f8fafc', '#94a3b8', '#334155');
        }

        const stopY = limitingIndex === 0 ? topY - 38 : bottomY - 38;
        drawArrow(ctx, leftX + reservoirW / 2, stopY, leftX + reservoirW / 2, stopY + 34, '#dc2626', 3);
        label(ctx, reactExtentA <= reactExtentB ? `${r.reactants[0].label} runs out first` : `${r.reactants[1].label} runs out first`, 1040, 585, 16, 900, '#dc2626');
    }, [drawMachine, drawProductBin, drawReservoir, getLive]);

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
                    <div className="text-base font-extrabold text-slate-900">Extent comparison</div>
                    <div className="text-xs font-semibold text-slate-500">Smallest mole/coeff value limits product</div>
                    <svg viewBox="0 0 310 170" className="mt-2 h-[170px] w-full">
                        {[
                            { label: reaction.reactants[0].label, value: calculated.molA / reaction.reactantCoeffs[0], color: reaction.reactants[0].color },
                            { label: reaction.reactants[1].label, value: calculated.molB / reaction.reactantCoeffs[1], color: reaction.reactants[1].color }
                        ].map((bar, i) => {
                            const max = Math.max(calculated.molA / reaction.reactantCoeffs[0], calculated.molB / reaction.reactantCoeffs[1], 1);
                            const width = 210 * (bar.value / max);
                            const y = 50 + i * 48;
                            return (
                                <g key={bar.label}>
                                    <text x="18" y={y + 5} fontSize="12" fontWeight="900" fill="#334155">{bar.label}</text>
                                    <rect x="70" y={y - 13} width="220" height="26" rx="9" fill="#f1f5f9" />
                                    <rect x="70" y={y - 13} width={width} height="26" rx="9" fill={bar.color} />
                                    <text x={76 + width} y={y + 5} fontSize="11" fontWeight="900" fill="#0f172a">{format(bar.value)}</text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Mole bridge</div>
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-xs font-black text-slate-700">
                        <span>mass</span><span>{'->'}</span><span>moles</span><span>{'->'}</span><span>particles</span>
                    </div>
                    <div className="mt-2 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-800">1 mol = 6.02214076 x 10^23 entities</div>
                    <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">moles = mass / molar mass</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Reaction choices</div>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                        {(Object.values(REACTIONS) as Reaction[]).map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleReactionChange(item.id)}
                                className={`rounded-xl border px-3 py-2 text-left text-xs font-extrabold transition ${reactionId === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                {item.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-cyan-950">NCERT focus</div>
                    <div className="text-xs font-semibold text-cyan-700">Class 11 Chemistry, Ch 1, Sec. 1.10.1</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-cyan-900">
                        <div>Balanced coefficients give mole ratios.</div>
                        <div>The consumed-first reactant limits product.</div>
                        <div>Product amount is calculated from limiting reagent.</div>
                        <div>Mass data must first be converted into moles.</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</div>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Limiting reagent', value: reaction.reactants[calculated.limitingIndex].label, tone: 'bg-red-50 text-red-700' },
                            { label: `${reaction.reactants[0].label} moles`, value: `${format(calculated.molA)} mol`, tone: 'bg-cyan-50 text-cyan-700' },
                            { label: `${reaction.reactants[1].label} moles`, value: `${format(calculated.molB)} mol`, tone: 'bg-amber-50 text-amber-700' },
                            { label: `${reaction.products[0].label} formed`, value: `${format(calculated.productMolesA)} mol`, tone: 'bg-emerald-50 text-emerald-700' },
                            { label: 'Particle count cue', value: `${formatScientific(calculated.productMolesA * AVOGADRO)} entities`, tone: 'bg-violet-50 text-violet-700' }
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
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
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
                <FlaskConical size={18} className="text-cyan-600" />
                Mole Concept Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Reaction</div>
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.values(REACTIONS) as Reaction[]).map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleReactionChange(item.id)}
                                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${reactionId === item.id ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                <Beaker size={15} />
                                <span>{item.id === 'methane' ? 'Methane' : 'Ammonia'}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setUnitMode('moles')}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-extrabold transition ${unitMode === 'moles' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Atom size={15} /> Moles
                        </button>
                        <button
                            onClick={() => setUnitMode('mass')}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-extrabold transition ${unitMode === 'mass' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Scale size={15} /> Mass
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="reactant-a-slider">
                            Reactant A amount
                        </label>
                        <input
                            id="reactant-a-slider"
                            type="range"
                            min={unitMode === 'moles' ? 0.5 : 2}
                            max={unitMode === 'moles' ? 12 : 120}
                            step={unitMode === 'moles' ? 0.5 : 2}
                            value={amountA}
                            onChange={event => setAmountA(Number(event.target.value))}
                            className="w-full accent-cyan-600"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="reactant-b-slider">
                            Reactant B amount
                        </label>
                        <input
                            id="reactant-b-slider"
                            type="range"
                            min={unitMode === 'moles' ? 0.5 : 2}
                            max={unitMode === 'moles' ? 18 : 160}
                            step={unitMode === 'moles' ? 0.5 : 2}
                            value={amountB}
                            onChange={event => setAmountB(Number(event.target.value))}
                            className="w-full accent-rose-600"
                        />
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
                            className="w-full accent-slate-700"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700">
                            <input type="checkbox" checked={showExcess} onChange={event => setShowExcess(event.target.checked)} className="accent-cyan-600" />
                            Excess
                        </label>
                        <label className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700">
                            <input type="checkbox" checked={showBatches} onChange={event => setShowBatches(event.target.checked)} className="accent-cyan-600" />
                            Batches
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

export default MoleConceptLimitingReagentLab;
