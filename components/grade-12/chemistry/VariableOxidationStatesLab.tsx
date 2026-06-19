import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atom, Eye, EyeOff, FlaskConical, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface VariableOxidationStatesLabProps {
    topic: Topic;
    onExit: () => void;
}

type ViewMode = 'series' | 'focus' | 'stabilise';

interface ElementRow {
    symbol: string;
    name: string;
    z: number;
    states: number[];
    stableNote: string;
    reason: string;
    example: string;
    color: string;
}

const W = 1280;
const H = 760;

const ELEMENTS: ElementRow[] = [
    { symbol: 'Sc', name: 'Scandium', z: 21, states: [3], stableNote: 'Only +3 in this NCERT discussion', reason: 'Too few electrons to lose or share', example: 'Sc(II) virtually unknown', color: '#94a3b8' },
    { symbol: 'Ti', name: 'Titanium', z: 22, states: [2, 3, 4], stableNote: 'Ti(IV) more stable', reason: 'Early-series element with fewer available d electrons', example: 'TiO2, TiO2+', color: '#38bdf8' },
    { symbol: 'V', name: 'Vanadium', z: 23, states: [2, 3, 4, 5], stableNote: 'States differ by unity', reason: 'Incomplete d orbitals allow variable participation', example: 'VO2+, VO2+', color: '#22c55e' },
    { symbol: 'Cr', name: 'Chromium', z: 24, states: [2, 3, 4, 5, 6], stableNote: 'High state can be oxidising', reason: 'Middle-series variety increases', example: 'CrO4^2-', color: '#a855f7' },
    { symbol: 'Mn', name: 'Manganese', z: 25, states: [2, 3, 4, 5, 6, 7], stableNote: 'Largest range: +2 to +7', reason: 'Near the middle of the 3d series', example: 'MnO4-', color: '#ec4899' },
    { symbol: 'Fe', name: 'Iron', z: 26, states: [2, 3, 4, 5, 6], stableNote: 'Higher states less stable after Mn', reason: 'Abrupt fall in high-state stability', example: 'FeO4^2- in alkaline medium', color: '#f97316' },
    { symbol: 'Co', name: 'Cobalt', z: 27, states: [2, 3, 4], stableNote: 'Fewer high states', reason: 'Later-series d orbitals limit higher valence', example: 'CoF3, CoX2', color: '#0ea5e9' },
    { symbol: 'Ni', name: 'Nickel', z: 28, states: [2, 3, 4], stableNote: 'Commonly +2 in NCERT table', reason: 'Later-series element with fewer high-state options', example: 'NiX2, Ni(CO)4', color: '#10b981' },
    { symbol: 'Cu', name: 'Copper', z: 29, states: [1, 2], stableNote: 'Cu(I) and Cu(II)', reason: 'Too many d electrons for many higher states', example: 'Cu+ disproportionation', color: '#f59e0b' },
    { symbol: 'Zn', name: 'Zinc', z: 30, states: [2], stableNote: 'Only +2', reason: 'No d electrons are involved', example: 'ZnX2', color: '#64748b' }
];

const OXYGEN_EXAMPLES = [
    { label: 'Ti(IV)', species: 'TiO2 / TiO2+', state: 4, x: 245 },
    { label: 'V(V)', species: 'VO2+', state: 5, x: 420 },
    { label: 'Cr(VI)', species: 'CrO4^2-', state: 6, x: 595 },
    { label: 'Mn(VII)', species: 'MnO4-', state: 7, x: 770 },
    { label: 'Fe(VI)', species: 'FeO4^2-', state: 6, x: 945 }
];

const LOW_STATE_EXAMPLES = [
    { label: 'Ni(0)', species: 'Ni(CO)4', x: 440 },
    { label: 'Fe(0)', species: 'Fe(CO)5', x: 740 }
];

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
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

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.045)';
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

function drawPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, stroke: string, color: string) {
    const width = Math.max(72, text.length * 8 + 28);
    roundRect(ctx, x - width / 2, y - 17, width, 34, 17);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, 13, 900, color);
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
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

const VariableOxidationStatesLab: React.FC<VariableOxidationStatesLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const lastRef = useRef<number | null>(null);
    const timeRef = useRef(0);
    const [mode, setMode] = useState<ViewMode>('series');
    const [selectedIndex, setSelectedIndex] = useState(4);
    const [showOxygen, setShowOxygen] = useState(true);
    const [showLowState, setShowLowState] = useState(true);
    const [showReasons, setShowReasons] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);

    const modeRef = useRef(mode);
    const selectedRef = useRef(selectedIndex);
    const oxygenRef = useRef(showOxygen);
    const lowStateRef = useRef(showLowState);
    const reasonRef = useRef(showReasons);
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);

    const selectedElement = ELEMENTS[selectedIndex] ?? ELEMENTS[4];
    const maxStateCount = Math.max(...ELEMENTS.map((element) => element.states.length));
    const highestState = Math.max(...selectedElement.states);
    const isMiddlePeak = selectedElement.symbol === 'Mn';

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { selectedRef.current = selectedIndex; }, [selectedIndex]);
    useEffect(() => { oxygenRef.current = showOxygen; }, [showOxygen]);
    useEffect(() => { lowStateRef.current = showLowState; }, [showLowState]);
    useEffect(() => { reasonRef.current = showReasons; }, [showReasons]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    const handleReset = useCallback(() => {
        setMode('series');
        setSelectedIndex(4);
        setShowOxygen(true);
        setShowLowState(true);
        setShowReasons(true);
        setPaused(false);
        setSpeed(1);
        timeRef.current = 0;
        lastRef.current = null;
    }, []);

    const drawSeries = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
        drawBackground(ctx);
        label(ctx, 'Variable oxidation states across the first transition series', W / 2, 70, 28, 900, '#0f172a');
        label(ctx, 'NCERT Table 4.3: greatest variety appears in or near the middle of the series', W / 2, 103, 15, 800, '#475569');

        const baseX = 96;
        const gap = 120;
        const baseY = 610;
        const levelGap = 54;
        const selected = selectedRef.current;

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(72, baseY + 10);
        ctx.lineTo(1210, baseY + 10);
        ctx.stroke();

        ELEMENTS.forEach((element, index) => {
            const x = baseX + index * gap;
            const active = index === selected;
            const pulse = active ? 1 + Math.sin(time * 4) * 0.06 : 1;

            roundRect(ctx, x - 44, baseY - 30, 88, 64, 16);
            ctx.fillStyle = active ? '#fef3c7' : '#ffffff';
            ctx.strokeStyle = active ? '#d97706' : '#cbd5e1';
            ctx.lineWidth = active ? 4 : 2;
            ctx.fill();
            ctx.stroke();

            label(ctx, element.symbol, x, baseY - 7, active ? 25 : 22, 900, active ? '#92400e' : '#0f172a');
            label(ctx, `Z=${element.z}`, x, baseY + 19, 11, 900, '#64748b');

            element.states.forEach((state, stateIndex) => {
                const y = baseY - 76 - stateIndex * levelGap;
                const radius = state === highestState && active ? 18 * pulse : 16;
                ctx.save();
                if (active) {
                    ctx.shadowColor = element.color;
                    ctx.shadowBlur = 16;
                }
                ctx.fillStyle = state >= 5 ? '#fee2e2' : state <= 1 ? '#e0f2fe' : '#dcfce7';
                ctx.strokeStyle = element.color;
                ctx.lineWidth = active ? 3 : 2;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                label(ctx, `+${state}`, x, y, 12, 900, state >= 5 ? '#991b1b' : '#166534');

                if (stateIndex > 0) {
                    ctx.strokeStyle = active ? element.color : '#cbd5e1';
                    ctx.lineWidth = active ? 3 : 2;
                    ctx.beginPath();
                    ctx.moveTo(x, y + 18);
                    ctx.lineTo(x, y + levelGap - 18);
                    ctx.stroke();
                }
            });

            if (element.symbol === 'Mn') {
                drawPill(ctx, 'maximum variety', x, 158, '#fce7f3', '#f9a8d4', '#9d174d');
                drawArrow(ctx, x, 180, x, 255, '#db2777');
            }
        });

        drawPill(ctx, 'Few states at the ends', 202, 710, '#f1f5f9', '#cbd5e1', '#334155');
        drawPill(ctx, 'Many states near the middle', 640, 710, '#ecfdf5', '#86efac', '#166534');
        drawPill(ctx, 'Few high states at the end', 1068, 710, '#f1f5f9', '#cbd5e1', '#334155');

        if (reasonRef.current) {
            roundRect(ctx, 376, 178, 528, 68, 18);
            ctx.fillStyle = 'rgba(255,255,255,0.94)';
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            label(ctx, 'Incomplete d orbitals allow oxidation states to differ by unity', 640, 207, 18, 900, '#0f172a');
            label(ctx, 'Non-transition elements usually vary by two units in the NCERT comparison', 640, 232, 13, 800, '#64748b');
        }
    }, [highestState]);

    const drawFocus = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
        drawBackground(ctx);
        const element = ELEMENTS[selectedRef.current] ?? ELEMENTS[4];
        const centerX = 640;
        const centerY = 375;
        const pulse = 1 + Math.sin(time * 3.8) * 0.04;

        label(ctx, `${element.name} (${element.symbol})`, centerX, 72, 32, 900, '#0f172a');
        label(ctx, `Atomic number ${element.z} - ${element.stableNote}`, centerX, 107, 15, 800, '#475569');

        const ring = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 245);
        ring.addColorStop(0, '#ffffff');
        ring.addColorStop(0.62, `${element.color}33`);
        ring.addColorStop(1, '#ffffff');
        ctx.fillStyle = ring;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 245, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.shadowColor = element.color;
        ctx.shadowBlur = 28;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = element.color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 78 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        label(ctx, element.symbol, centerX, centerY - 10, 48, 900, '#0f172a');
        label(ctx, `Z=${element.z}`, centerX, centerY + 34, 16, 900, '#64748b');

        const startAngle = -Math.PI * 0.82;
        const endAngle = Math.PI * 0.82;
        element.states.forEach((state, index) => {
            const t = element.states.length === 1 ? 0.5 : index / (element.states.length - 1);
            const angle = lerp(startAngle, endAngle, t);
            const x = centerX + Math.cos(angle) * 245;
            const y = centerY + Math.sin(angle) * 210;
            ctx.strokeStyle = element.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX + Math.cos(angle) * 93, centerY + Math.sin(angle) * 83);
            ctx.lineTo(x - Math.cos(angle) * 28, y - Math.sin(angle) * 28);
            ctx.stroke();

            ctx.save();
            ctx.shadowColor = state >= 5 ? '#ef4444' : element.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = state >= 5 ? '#fee2e2' : state <= 1 ? '#e0f2fe' : '#dcfce7';
            ctx.strokeStyle = state >= 5 ? '#ef4444' : element.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            label(ctx, `+${state}`, x, y, 18, 900, state >= 5 ? '#991b1b' : '#166534');
        });

        roundRect(ctx, 98, 188, 300, 120, 22);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        label(ctx, 'NCERT reason', 122, 218, 15, 900, '#0f172a', 'left');
        label(ctx, element.reason, 122, 250, 13, 800, '#475569', 'left');
        label(ctx, element.symbol === 'Mn' ? 'Middle-series peak' : 'Position matters', 122, 282, 13, 900, element.color, 'left');

        roundRect(ctx, 882, 188, 300, 120, 22);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        label(ctx, 'Example species', 906, 218, 15, 900, '#0f172a', 'left');
        label(ctx, element.example, 906, 251, 16, 900, element.color, 'left');
        label(ctx, 'Use only as NCERT-linked cue', 906, 282, 12, 800, '#64748b', 'left');
    }, []);

    const drawStabilise = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
        drawBackground(ctx);
        label(ctx, 'How NCERT stabilises high and low oxidation states', W / 2, 72, 29, 900, '#0f172a');
        label(ctx, 'Oxygen stabilises high states; pi-acceptor ligands allow low states in carbonyls', W / 2, 105, 15, 800, '#475569');

        roundRect(ctx, 132, 150, 1016, 236, 28);
        ctx.fillStyle = '#fff7ed';
        ctx.strokeStyle = '#fed7aa';
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        label(ctx, 'Oxygen and oxocations stabilise high oxidation states', 640, 184, 21, 900, '#9a3412');

        OXYGEN_EXAMPLES.forEach((item, index) => {
            const glow = oxygenRef.current ? 18 + Math.sin(time * 4 + index) * 7 : 0;
            ctx.save();
            ctx.shadowColor = oxygenRef.current ? '#f97316' : 'transparent';
            ctx.shadowBlur = glow;
            ctx.fillStyle = oxygenRef.current ? '#ffedd5' : '#ffffff';
            ctx.strokeStyle = oxygenRef.current ? '#f97316' : '#cbd5e1';
            ctx.lineWidth = oxygenRef.current ? 3 : 2;
            ctx.beginPath();
            ctx.arc(item.x, 278, 48, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            label(ctx, item.label, item.x, 263, 17, 900, '#9a3412');
            label(ctx, item.species, item.x, 291, 13, 900, '#7c2d12');
            drawPill(ctx, `+${item.state}`, item.x, 342, '#ffffff', '#fed7aa', '#9a3412');
        });

        roundRect(ctx, 252, 448, 776, 192, 28);
        ctx.fillStyle = '#eef2ff';
        ctx.strokeStyle = '#c4b5fd';
        ctx.lineWidth = 3;
        ctx.fill();
        ctx.stroke();
        label(ctx, 'Low oxidation states in carbonyl complexes', 640, 482, 21, 900, '#4c1d95');
        label(ctx, 'Ligands with pi-acceptor character in addition to sigma bonding', 640, 512, 14, 800, '#6d28d9');

        LOW_STATE_EXAMPLES.forEach((item, index) => {
            const wave = lowStateRef.current ? Math.sin(time * 5 + index) * 5 : 0;
            ctx.save();
            ctx.shadowColor = lowStateRef.current ? '#7c3aed' : 'transparent';
            ctx.shadowBlur = lowStateRef.current ? 20 : 0;
            ctx.fillStyle = lowStateRef.current ? '#f5f3ff' : '#ffffff';
            ctx.strokeStyle = lowStateRef.current ? '#7c3aed' : '#cbd5e1';
            ctx.lineWidth = 3;
            roundRect(ctx, item.x - 92, 545 + wave, 184, 64, 18);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            label(ctx, item.label, item.x, 565 + wave, 17, 900, '#4c1d95');
            label(ctx, item.species, item.x, 592 + wave, 15, 900, '#6d28d9');
        });
    }, []);

    useEffect(() => {
        const draw = (now: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;

            const last = lastRef.current ?? now;
            const dt = Math.min(0.05, (now - last) / 1000);
            lastRef.current = now;
            if (!pausedRef.current) {
                timeRef.current += dt * speedRef.current;
            }

            const currentMode = modeRef.current;
            if (currentMode === 'series') drawSeries(ctx, timeRef.current);
            if (currentMode === 'focus') drawFocus(ctx, timeRef.current);
            if (currentMode === 'stabilise') drawStabilise(ctx, timeRef.current);

            requestRef.current = requestAnimationFrame(draw);
        };

        requestRef.current = requestAnimationFrame(draw);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [drawFocus, drawSeries, drawStabilise]);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Oxidation-state count</h3>
                    <p className="text-xs font-semibold text-slate-500">NCERT Table 4.3 pattern</p>
                    <svg viewBox="0 0 320 170" className="mt-2 h-[170px] w-full">
                        <line x1="32" y1="136" x2="300" y2="136" stroke="#94a3b8" strokeWidth="2" />
                        <line x1="32" y1="24" x2="32" y2="136" stroke="#94a3b8" strokeWidth="2" />
                        {ELEMENTS.map((element, index) => {
                            const x = 42 + index * 27;
                            const height = (element.states.length / maxStateCount) * 100;
                            const active = index === selectedIndex;
                            return (
                                <g key={element.symbol}>
                                    <rect x={x} y={136 - height} width="16" height={height} rx="4" fill={active ? '#d97706' : '#0891b2'} />
                                    <text x={x + 8} y="154" textAnchor="middle" fontSize="9" fontWeight="800" fill="#475569">{element.symbol}</text>
                                </g>
                            );
                        })}
                        <text x="174" y="18" textAnchor="middle" fontSize="11" fontWeight="900" fill="#9d174d">Mn has the peak</text>
                    </svg>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Selected element</h3>
                    <p className="text-xs font-semibold text-slate-500">Live Table 4.3 reading</p>
                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <div className="text-3xl font-black text-amber-800">{selectedElement.symbol}</div>
                        <div className="mt-1 text-sm font-bold text-slate-700">{selectedElement.name}, Z={selectedElement.z}</div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {selectedElement.states.map((state) => (
                                <span key={state} className="rounded-full border border-amber-200 bg-white px-2 py-1 text-xs font-black text-amber-800">+{state}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Series logic</h3>
                    <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">
                        Ends show fewer states; the middle has more because more d electrons can participate before high-state stability drops after manganese.
                    </p>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <h3 className="text-base font-extrabold text-amber-950">Variable Oxidation States</h3>
                    <p className="text-xs font-semibold text-amber-700">NCERT Class 12 Chemistry, Ch 8, Sec. 4.3.4</p>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-950">
                        <p>Transition elements show a great variety of oxidation states.</p>
                        <p>Variability arises from incomplete filling of d orbitals.</p>
                        <p>Oxidation states often differ by unity, as in vanadium states.</p>
                        <p>Elements near the middle, especially Mn, show the greatest number.</p>
                        <p>Oxygen stabilises high states in oxides and oxocations.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Element', value: `${selectedElement.symbol} (${selectedElement.name})`, tone: 'bg-slate-50 text-slate-900' },
                            { label: 'Oxidation states', value: selectedElement.states.map((state) => `+${state}`).join(', '), tone: 'bg-amber-50 text-amber-800' },
                            { label: 'Number of states', value: `${selectedElement.states.length}`, tone: isMiddlePeak ? 'bg-pink-50 text-pink-800' : 'bg-cyan-50 text-cyan-800' },
                            { label: 'Highest state shown', value: `+${highestState}`, tone: highestState >= 5 ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800' },
                            { label: 'NCERT cue', value: selectedElement.stableNote, tone: 'bg-violet-50 text-violet-800' }
                        ].map((row) => (
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
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="absolute inset-0 h-full w-full"
                    aria-label="Variable oxidation states in d-block elements simulation"
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

    const viewModes: Array<{ id: ViewMode; label: string }> = [
        { id: 'series', label: 'Series View' },
        { id: 'focus', label: 'Element Focus' },
        { id: 'stabilise', label: 'Stabilisation' }
    ];

    const controls = (
        <div className="grid h-full auto-rows-min grid-cols-12 gap-3 overflow-y-auto text-slate-900">
            <div className="col-span-12 flex min-w-0 items-center gap-2 lg:col-span-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                    <Atom size={18} />
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900">Oxidation States Bench</div>
                    <div className="truncate text-[11px] font-black text-slate-500">NCERT Table 4.3 controls</div>
                </div>
            </div>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:col-span-4">
                <div className="grid grid-cols-3 gap-1.5">
                    {viewModes.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setMode(item.id)}
                            className={`min-h-[42px] rounded-xl border px-2 text-xs font-black transition ${
                                mode === item.id ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-3">
                <label className="block">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Animation speed</span>
                        <output>{speed.toFixed(1)}x</output>
                    </div>
                    <input className="w-full accent-amber-600" type="range" min={0.2} max={2.5} step={0.1} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
                </label>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-2">
                <button
                    onClick={() => setPaused((value) => !value)}
                    className={`flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-black ${paused ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    title={paused ? 'Play' : 'Pause'}
                >
                    {paused ? <Play size={14} /> : <Pause size={14} />} {paused ? 'Paused' : 'Running'}
                </button>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-6">
                <label className="block">
                    <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-500">
                        <span>Element selector</span>
                        <output className="text-amber-700">{selectedElement.symbol}</output>
                    </div>
                    <input className="w-full accent-amber-600" type="range" min={0} max={ELEMENTS.length - 1} step={1} value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))} />
                </label>
                <div className="mt-2 grid grid-cols-10 gap-1">
                    {ELEMENTS.map((element, index) => (
                        <button
                            key={element.symbol}
                            onClick={() => setSelectedIndex(index)}
                            className={`min-h-[32px] rounded-lg border text-[11px] font-black ${selectedIndex === index ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            {element.symbol}
                        </button>
                    ))}
                </div>
            </section>

            <section className="col-span-12 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-6">
                <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Display toggles</div>
                <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => setShowOxygen((value) => !value)} className={`rounded-xl border px-2 py-2 text-xs font-black ${showOxygen ? 'border-orange-300 bg-orange-50 text-orange-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Oxygen stabilisation">
                        <Sparkles size={15} className="mx-auto" /> Oxygen
                    </button>
                    <button onClick={() => setShowLowState((value) => !value)} className={`rounded-xl border px-2 py-2 text-xs font-black ${showLowState ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Low-state examples">
                        <FlaskConical size={15} className="mx-auto" /> Carbonyls
                    </button>
                    <button onClick={() => setShowReasons((value) => !value)} className={`rounded-xl border px-2 py-2 text-xs font-black ${showReasons ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show NCERT reason">
                        {showReasons ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} Reason
                    </button>
                </div>
            </section>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controls}
            controlsAreaFlex="0 0 220px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default VariableOxidationStatesLab;
