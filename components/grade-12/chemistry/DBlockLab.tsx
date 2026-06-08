import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Atom,
    Beaker,
    Eye,
    EyeOff,
    FlaskConical,
    Magnet,
    Palette,
    Pause,
    Play,
    RotateCcw,
    Sparkles,
    Zap
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface DBlockLabProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'splitting' | 'magnetism' | 'colour' | 'ligand' | 'spin';
type Geometry = 'oct' | 'tet' | 'square';

interface IonRow {
    id: string;
    label: string;
    config: string;
    d: number;
    n: number;
    muCalc: string;
    muObs: string;
    swatch: string;
}

interface Ligand {
    label: string;
    strength: number;
    short: string;
}

interface ColourExample {
    id: string;
    complex: string;
    wavelength: number;
    absorbed: string;
    observed: string;
    observedHex: string;
    absorbedHex: string;
}

interface Burst {
    x: number;
    y: number;
    life: number;
    maxLife: number;
    color: string;
}

const W = 1280;
const H = 760;
const PAIRING_ENERGY = 8.2;

const MODES: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
    { id: 'splitting', label: 'Splitting', icon: <Atom size={15} /> },
    { id: 'magnetism', label: 'Magnetism', icon: <Magnet size={15} /> },
    { id: 'colour', label: 'Colour', icon: <Palette size={15} /> },
    { id: 'ligand', label: 'Ligand', icon: <Beaker size={15} /> },
    { id: 'spin', label: 'Hi/Lo Spin', icon: <Zap size={15} /> }
];

const ION_TABLE: IonRow[] = [
    { id: 'Sc3+', label: 'Sc³⁺', config: '3d⁰', d: 0, n: 0, muCalc: '0.00', muObs: '0', swatch: '#ffffff' },
    { id: 'Ti3+', label: 'Ti³⁺', config: '3d¹', d: 1, n: 1, muCalc: '1.73', muObs: '1.75', swatch: '#a78bfa' },
    { id: 'Ti2+', label: 'Ti²⁺', config: '3d²', d: 2, n: 2, muCalc: '2.84', muObs: '2.76', swatch: '#93c5fd' },
    { id: 'V2+', label: 'V²⁺', config: '3d³', d: 3, n: 3, muCalc: '3.87', muObs: '3.86', swatch: '#86efac' },
    { id: 'Cr2+', label: 'Cr²⁺', config: '3d⁴', d: 4, n: 4, muCalc: '4.90', muObs: '4.80', swatch: '#c084fc' },
    { id: 'Mn2+', label: 'Mn²⁺', config: '3d⁵', d: 5, n: 5, muCalc: '5.92', muObs: '5.96', swatch: '#f9a8d4' },
    { id: 'Fe2+', label: 'Fe²⁺', config: '3d⁶', d: 6, n: 4, muCalc: '4.90', muObs: '5.3-5.5', swatch: '#4ade80' },
    { id: 'Co2+', label: 'Co²⁺', config: '3d⁷', d: 7, n: 3, muCalc: '3.87', muObs: '4.4-5.2', swatch: '#f472b6' },
    { id: 'Ni2+', label: 'Ni²⁺', config: '3d⁸', d: 8, n: 2, muCalc: '2.84', muObs: '2.9-3.4', swatch: '#22c55e' },
    { id: 'Cu2+', label: 'Cu²⁺', config: '3d⁹', d: 9, n: 1, muCalc: '1.73', muObs: '1.8-2.2', swatch: '#3b82f6' },
    { id: 'Zn2+', label: 'Zn²⁺', config: '3d¹⁰', d: 10, n: 0, muCalc: '0.00', muObs: '—', swatch: '#ffffff' }
];

const LIGANDS: Ligand[] = [
    { label: 'I⁻', strength: 1, short: 'I' },
    { label: 'Br⁻', strength: 2, short: 'Br' },
    { label: 'SCN⁻', strength: 3, short: 'SCN' },
    { label: 'Cl⁻', strength: 4, short: 'Cl' },
    { label: 'S²⁻', strength: 5, short: 'S' },
    { label: 'F⁻', strength: 6, short: 'F' },
    { label: 'OH⁻', strength: 7, short: 'OH' },
    { label: 'C₂O₄²⁻', strength: 8, short: 'ox' },
    { label: 'H₂O', strength: 9, short: 'H2O' },
    { label: 'NCS⁻', strength: 10, short: 'NCS' },
    { label: 'edta⁴⁻', strength: 11, short: 'edta' },
    { label: 'NH₃', strength: 12, short: 'NH3' },
    { label: 'en', strength: 13, short: 'en' },
    { label: 'CN⁻', strength: 14, short: 'CN' },
    { label: 'CO', strength: 15, short: 'CO' }
];

const COLOUR_EXAMPLES: ColourExample[] = [
    { id: 'cocl', complex: '[CoCl(NH₃)₅]²⁺', wavelength: 535, absorbed: 'Yellow', observed: 'Violet', observedHex: '#8b5cf6', absorbedHex: '#eab308' },
    { id: 'coh2o', complex: '[Co(NH₃)₅(H₂O)]³⁺', wavelength: 500, absorbed: 'Blue-Green', observed: 'Red', observedHex: '#ef4444', absorbedHex: '#14b8a6' },
    { id: 'coammine', complex: '[Co(NH₃)₆]³⁺', wavelength: 475, absorbed: 'Blue', observed: 'Yellow-Orange', observedHex: '#f59e0b', absorbedHex: '#2563eb' },
    { id: 'cocn', complex: '[Co(CN)₆]³⁻', wavelength: 310, absorbed: 'UV', observed: 'Pale Yellow', observedHex: '#fef08a', absorbedHex: '#7c3aed' },
    { id: 'cuaqua', complex: '[Cu(H₂O)₄]²⁺', wavelength: 600, absorbed: 'RED', observed: 'Blue', observedHex: '#3b82f6', absorbedHex: '#dc2626' },
    { id: 'tiaqua', complex: '[Ti(H₂O)₆]³⁺', wavelength: 498, absorbed: 'Blue-Green', observed: 'Violet', observedHex: '#8b5cf6', absorbedHex: '#14b8a6' }
];

const NI_PROGRESS = [
    { label: '[Ni(H₂O)₆]²⁺', note: 'pale blue', color: '#bfdbfe', strength: 8.2 },
    { label: '[Ni(H₂O)₄(en)]²⁺', note: 'blue', color: '#60a5fa', strength: 9.8 },
    { label: '[Ni(H₂O)₂(en)₂]²⁺', note: 'blue/purple', color: '#818cf8', strength: 11.2 },
    { label: '[Ni(en)₃]²⁺', note: 'violet', color: '#8b5cf6', strength: 13 }
];

const SPIN_PAIRS = [
    { id: 'mn', left: '[MnCl₆]³⁻', right: '[Mn(CN)₆]³⁻', leftN: 4, rightN: 2, leftLigand: 'Cl weak', rightLigand: 'CN strong' },
    { id: 'fe', left: '[FeF₆]³⁻', right: '[Fe(CN)₆]³⁻', leftN: 5, rightN: 1, leftLigand: 'F weak', rightLigand: 'CN strong' },
    { id: 'co', left: '[CoF₆]³⁻', right: '[Co(C₂O₄)₃]³⁻', leftN: 4, rightN: 0, leftLigand: 'F weak', rightLigand: 'oxalate' },
    { id: 'ni', left: '[NiCl₄]²⁻', right: '[Ni(CN)₄]²⁻', leftN: 2, rightN: 0, leftLigand: 'tetrahedral', rightLigand: 'square planar' }
];

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function muFromN(n: number) {
    return Math.sqrt(n * (n + 2));
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
    const bg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 580);
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

function drawSphere(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, stroke = '#475569', text = '') {
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
    if (text) label(ctx, text, x, y, Math.max(10, r * 0.58), 900, '#0f172a');
}

function colourAtWavelength(wavelength: number) {
    if (wavelength < 380) return '#7c3aed';
    if (wavelength < 450) return '#6d28d9';
    if (wavelength < 495) return '#2563eb';
    if (wavelength < 535) return '#14b8a6';
    if (wavelength < 570) return '#22c55e';
    if (wavelength < 590) return '#eab308';
    if (wavelength < 620) return '#f97316';
    return '#dc2626';
}

function splitElectrons(d: number, geometry: Geometry, strongField: boolean) {
    if (geometry === 'tet') {
        const lower = Math.min(d, 4);
        const upper = Math.max(0, d - 4);
        return { lower, upper };
    }
    if (strongField) {
        const lower = Math.min(d, 6);
        const upper = Math.max(0, d - 6);
        return { lower, upper };
    }
    const firstLower = Math.min(d, 3);
    const firstUpper = Math.min(Math.max(0, d - 3), 2);
    const pairedLower = Math.max(0, d - 5);
    return { lower: firstLower + pairedLower, upper: firstUpper };
}

function unpairedFor(d: number, geometry: Geometry, strongField: boolean) {
    if (geometry === 'tet') {
        if (d <= 5) return d;
        return 10 - d;
    }
    if (strongField) {
        const map: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 2, 5: 1, 6: 0, 7: 1, 8: 2, 9: 1, 10: 0 };
        return map[d] ?? 0;
    }
    return ION_TABLE.find((ion) => ion.d === d)?.n ?? 0;
}

const DBlockLab: React.FC<DBlockLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const lastRef = useRef<number>();
    const timeRef = useRef(0);
    const visualDeltaRef = useRef(9);
    const exciteRef = useRef(0);
    const burstsRef = useRef<Burst[]>([]);

    const [mode, setMode] = useState<Mode>('splitting');
    const [selectedIon, setSelectedIon] = useState('Co2+');
    const [selectedLigand, setSelectedLigand] = useState('H₂O');
    const [geometry, setGeometry] = useState<Geometry>('oct');
    const [colourExampleId, setColourExampleId] = useState('cuaqua');
    const [spinPairId, setSpinPairId] = useState('mn');
    const [niIndex, setNiIndex] = useState(0);
    const [hydratedCopper, setHydratedCopper] = useState(true);
    const [showOrbitals, setShowOrbitals] = useState(true);
    const [showPhoton, setShowPhoton] = useState(true);
    const [showCFSE, setShowCFSE] = useState(true);
    const [showTable, setShowTable] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);

    const modeRef = useRef(mode);
    const ionRef = useRef(selectedIon);
    const ligandRef = useRef(selectedLigand);
    const geomRef = useRef(geometry);
    const colourRef = useRef(colourExampleId);
    const spinPairRef = useRef(spinPairId);
    const showOrbitalsRef = useRef(showOrbitals);
    const showPhotonRef = useRef(showPhoton);
    const showCFSERef = useRef(showCFSE);
    const showTableRef = useRef(showTable);
    const hydratedRef = useRef(hydratedCopper);
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);

    const activeIon = ION_TABLE.find((ion) => ion.id === selectedIon) ?? ION_TABLE[7];
    const activeLigand = LIGANDS.find((ligand) => ligand.label === selectedLigand) ?? LIGANDS[8];
    const activeColour = COLOUR_EXAMPLES.find((entry) => entry.id === colourExampleId) ?? COLOUR_EXAMPLES[4];
    const activePair = SPIN_PAIRS.find((pair) => pair.id === spinPairId) ?? SPIN_PAIRS[0];
    const strongField = activeLigand.strength >= 12 || geometry === 'square';
    const activeUnpaired = unpairedFor(activeIon.d, geometry, strongField);
    const activeMu = muFromN(activeUnpaired);
    const isDiamagnetic = activeUnpaired === 0;
    const targetDelta = geometry === 'tet' ? activeLigand.strength * 0.42 : geometry === 'square' ? activeLigand.strength * 1.18 : activeLigand.strength;
    const split = splitElectrons(activeIon.d, geometry, strongField);
    const cfse = geometry === 'tet'
        ? (-0.6 * split.lower + 0.4 * split.upper) * targetDelta
        : (-0.4 * split.lower + 0.6 * split.upper) * targetDelta;

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { ionRef.current = selectedIon; }, [selectedIon]);
    useEffect(() => { ligandRef.current = selectedLigand; }, [selectedLigand]);
    useEffect(() => { geomRef.current = geometry; }, [geometry]);
    useEffect(() => { colourRef.current = colourExampleId; }, [colourExampleId]);
    useEffect(() => { spinPairRef.current = spinPairId; }, [spinPairId]);
    useEffect(() => { showOrbitalsRef.current = showOrbitals; }, [showOrbitals]);
    useEffect(() => { showPhotonRef.current = showPhoton; }, [showPhoton]);
    useEffect(() => { showCFSERef.current = showCFSE; }, [showCFSE]);
    useEffect(() => { showTableRef.current = showTable; }, [showTable]);
    useEffect(() => { hydratedRef.current = hydratedCopper; }, [hydratedCopper]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = speed; }, [speed]);

    const triggerExcitation = useCallback(() => {
        exciteRef.current = 1;
        burstsRef.current.push({ x: 610, y: 315, life: 0.35, maxLife: 0.35, color: activeColour.absorbedHex });
    }, [activeColour.absorbedHex]);

    const handleReset = useCallback(() => {
        setMode('splitting');
        setSelectedIon('Co2+');
        setSelectedLigand('H₂O');
        setGeometry('oct');
        setColourExampleId('cuaqua');
        setSpinPairId('mn');
        setNiIndex(0);
        setHydratedCopper(true);
        setShowOrbitals(true);
        setShowPhoton(true);
        setShowCFSE(true);
        setShowTable(true);
        setPaused(false);
        setSpeed(1);
        timeRef.current = 0;
        exciteRef.current = 0;
        burstsRef.current = [];
    }, []);

    const drawElectronArrow = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, direction: 'up' | 'down', color = '#0f172a') => {
        const dy = direction === 'up' ? -18 : 18;
        drawArrow(ctx, x, y - dy * 0.45, x, y + dy * 0.45, color);
    }, []);

    const drawOrbitalLevel = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, count: number, electrons: number, labelText: string, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        const gap = 72;
        const start = x - ((count - 1) * gap) / 2;
        for (let i = 0; i < count; i += 1) {
            const lx = start + i * gap;
            ctx.beginPath();
            ctx.moveTo(lx - 24, y);
            ctx.lineTo(lx + 24, y);
            ctx.stroke();
            const first = Math.min(electrons, count);
            const second = Math.max(0, electrons - count);
            if (i < first) drawElectronArrow(ctx, lx - 8, y - 22, 'up');
            if (i < second) drawElectronArrow(ctx, lx + 8, y - 22, 'down', '#475569');
        }
        label(ctx, labelText, x + count * 42 + 34, y, 17, 900, color, 'left');
    }, [drawElectronArrow]);

    const drawGeometryView = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, geometryValue: Geometry, ion: IonRow, deltaValue: number) => {
        label(ctx, geometryValue === 'tet' ? 'Tetrahedral field' : geometryValue === 'square' ? 'Square planar field' : 'Octahedral field', cx, cy - 245, 22, 900, '#0f172a');
        const spin = timeRef.current * 0.75;
        const ligands = geometryValue === 'tet'
            ? [[1, 1, 1], [-1, -1, 1], [1, -1, -1], [-1, 1, -1]]
            : geometryValue === 'square'
                ? [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]]
                : [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        const projected = ligands.map(([x, y, z]) => {
            const rx = x * Math.cos(spin) - z * Math.sin(spin);
            const rz = x * Math.sin(spin) + z * Math.cos(spin);
            return { x: cx + rx * 160, y: cy + y * 145 + rz * 34, z: rz, label: activeLigand.short };
        }).sort((a, b) => a.z - b.z);

        if (showOrbitalsRef.current) {
            const lobes = [
                { label: 'dz²', color: 'rgba(239,68,68,0.20)', a: Math.PI / 2, high: true },
                { label: 'dx²-y²', color: 'rgba(239,68,68,0.20)', a: 0, high: true },
                { label: 'dxy', color: 'rgba(59,130,246,0.18)', a: Math.PI / 4, high: false },
                { label: 'dyz', color: 'rgba(59,130,246,0.14)', a: -Math.PI / 4, high: false }
            ];
            lobes.forEach((lobe, index) => {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(lobe.a + Math.sin(spin + index) * 0.14);
                ctx.fillStyle = lobe.color;
                ctx.beginPath();
                ctx.ellipse(58, 0, lobe.high ? 82 : 62, 22, 0, 0, Math.PI * 2);
                ctx.ellipse(-58, 0, lobe.high ? 82 : 62, 22, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                label(ctx, lobe.label, cx + (index - 1.5) * 86, cy + 205, 12, 900, lobe.high ? '#dc2626' : '#1d4ed8');
            });
        }

        projected.forEach((point) => {
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            drawSphere(ctx, point.x, point.y, point.z > 0 ? 25 : 20, '#e0f2fe', '#0891b2', point.label);
        });

        ctx.save();
        if (ion.n > 0) {
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 24 + deltaValue;
        }
        drawSphere(ctx, cx, cy, 48, ion.swatch, ion.n > 0 ? '#0891b2' : '#64748b', ion.label);
        ctx.restore();
        label(ctx, 'on-axis → high E', cx - 178, cy - 192, 13, 900, '#dc2626', 'left');
        label(ctx, 'off-axis → low E', cx - 178, cy - 166, 13, 900, '#1d4ed8', 'left');
    }, [activeLigand.short]);

    const drawSplitting = useCallback((ctx: CanvasRenderingContext2D) => {
        const ion = ION_TABLE.find((row) => row.id === ionRef.current) ?? ION_TABLE[7];
        const ligand = LIGANDS.find((row) => row.label === ligandRef.current) ?? LIGANDS[8];
        const geom = geomRef.current;
        const deltaValue = visualDeltaRef.current;
        const strong = ligand.strength >= 12 || geom === 'square';
        const electronSplit = splitElectrons(ion.d, geom, strong);
        drawBackground(ctx);
        label(ctx, 'Crystal Field Splitting', W / 2, 68, 30, 900, '#0f172a');
        label(ctx, `${ion.label} · ${ion.config} · ${ligand.label} · ${geom === 'tet' ? 'tetrahedral' : geom === 'square' ? 'square planar' : 'octahedral'}`, W / 2, 101, 15, 800, '#475569');

        drawArrow(ctx, 90, 650, 90, 170, '#334155');
        label(ctx, 'Energy', 48, 405, 16, 900, '#334155');
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        for (let i = 0; i < 5; i += 1) {
            ctx.beginPath();
            ctx.moveTo(170 + i * 55, 400);
            ctx.lineTo(210 + i * 55, 400);
            ctx.stroke();
        }
        label(ctx, 'Free ion', 260, 445, 15, 900, '#475569');
        label(ctx, '5 degenerate d orbitals', 260, 470, 13, 700, '#64748b');
        drawArrow(ctx, 420, 400, 505, 400, '#64748b');
        label(ctx, 'spherical field', 464, 370, 13, 800, '#64748b');

        const highY = geom === 'tet' ? 292 : 280;
        const lowY = geom === 'tet' ? 475 : 462;
        const upperCount = geom === 'tet' ? 3 : 2;
        const lowerCount = geom === 'tet' ? 2 : 3;
        drawOrbitalLevel(ctx, 620, highY, upperCount, electronSplit.upper, geom === 'tet' ? 't₂' : 'e_g', '#ef4444');
        drawOrbitalLevel(ctx, 620, lowY, lowerCount, electronSplit.lower, geom === 'tet' ? 'e' : 't₂g', '#3b82f6');

        drawArrow(ctx, 820, lowY, 820, highY, '#475569', true);
        label(ctx, geom === 'tet' ? 'Δ_t = (4/9) Δ_o' : 'Δ_o = hν', 842, (highY + lowY) / 2, 16, 900, '#475569', 'left');
        if (geom === 'oct') {
            label(ctx, 'raised by (3/5)Δo', 520, highY - 42, 12, 900, '#dc2626');
            label(ctx, 'lowered by (2/5)Δo', 520, lowY + 42, 12, 900, '#1d4ed8');
        }

        if (showPhotonRef.current && ion.d > 0 && ion.d < 10) {
            const excitation = exciteRef.current;
            const waveX = lerp(120, 605, clamp(1 - excitation, 0, 1));
            ctx.strokeStyle = colourAtWavelength(activeColour.wavelength);
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 90; i += 1) {
                const x = waveX + i * 4;
                const y = 220 + Math.sin(i * 0.7 + timeRef.current * 8) * 12;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            label(ctx, 'hν', waveX + 190, 190, 17, 900, colourAtWavelength(activeColour.wavelength));
        }

        const jump = exciteRef.current > 0 ? Math.sin((1 - exciteRef.current) * Math.PI) : 0;
        if (jump > 0.05) drawElectronArrow(ctx, 636, lerp(lowY - 22, highY - 22, jump), 'up', '#fbbf24');

        burstsRef.current.forEach((burst) => {
            const alpha = burst.life / burst.maxLife;
            const grad = ctx.createRadialGradient(burst.x, burst.y, 2, burst.x, burst.y, 95 * (1 - alpha + 0.2));
            grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
            grad.addColorStop(0.4, burst.color);
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.globalAlpha = alpha;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(burst.x, burst.y, 90, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        drawGeometryView(ctx, 1030, 405, geom, ion, deltaValue);
        if (showCFSERef.current) label(ctx, `CFSE ${cfse.toFixed(1)} Δ units`, 260, 615, 16, 900, '#0369a1');
    }, [activeColour.wavelength, cfse, drawElectronArrow, drawGeometryView, drawOrbitalLevel]);

    const drawMagnetism = useCallback((ctx: CanvasRenderingContext2D) => {
        const ion = ION_TABLE.find((row) => row.id === ionRef.current) ?? ION_TABLE[7];
        const n = unpairedFor(ion.d, geomRef.current, (LIGANDS.find((row) => row.label === ligandRef.current)?.strength ?? 9) >= 12);
        const mu = muFromN(n);
        drawBackground(ctx);
        label(ctx, 'Magnetic Properties', W / 2, 68, 30, 900, '#0f172a');
        label(ctx, n === 0 ? 'Diamagnetic: all electrons paired' : 'Paramagnetic: one or more unpaired electrons', W / 2, 101, 15, 800, n === 0 ? '#475569' : '#dc2626');

        ctx.fillStyle = '#ef4444';
        roundRect(ctx, 115, 205, 110, 330, 24);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, 158, 285, 86, 170, 18);
        ctx.fill();
        label(ctx, 'N', 170, 250, 34, 900, '#ffffff');
        label(ctx, 'S', 170, 492, 34, 900, '#ffffff');
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        for (let i = 0; i < 7; i += 1) {
            const y = 240 + i * 42;
            ctx.beginPath();
            ctx.bezierCurveTo(235, y, 375 + Math.sin(timeRef.current * 2 + i) * 18, y - 36, 520, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        const pull = n === 0 ? 70 : -58;
        const bx = 665 + pull + Math.sin(timeRef.current * 3) * (n === 0 ? -3 : 6);
        ctx.save();
        ctx.shadowColor = n === 0 ? '#64748b' : '#ef4444';
        ctx.shadowBlur = n === 0 ? 10 : 26;
        drawSphere(ctx, bx, 365, 66, ion.swatch, n === 0 ? '#64748b' : '#dc2626', ion.label);
        ctx.restore();
        drawArrow(ctx, bx + (n === 0 ? -70 : 70), 365, bx + (n === 0 ? 55 : -55), 365, n === 0 ? '#64748b' : '#dc2626');

        const chips = [
            `n = ${n} unpaired e⁻`,
            `μ = ${mu.toFixed(2)} BM`,
            n === 0 ? 'DIAMAGNETIC' : n >= 4 ? 'STRONGLY PARAMAGNETIC' : 'PARAMAGNETIC'
        ];
        chips.forEach((chip, index) => {
            roundRect(ctx, 490 + index * 210, 605, 190, 58, 16);
            ctx.fillStyle = index === 2 ? (n === 0 ? '#f1f5f9' : '#fee2e2') : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();
            label(ctx, chip, 585 + index * 210, 634, index === 2 ? 15 : 18, 900, index === 2 && n > 0 ? '#b91c1c' : '#0f172a');
        });

        if (showTableRef.current) {
            const x = 895;
            const y = 145;
            label(ctx, 'NCERT Table 4.7', x + 145, y - 26, 18, 900, '#4c1d95');
            ION_TABLE.forEach((row, index) => {
                const yy = y + index * 42;
                roundRect(ctx, x, yy, 285, 34, 8);
                ctx.fillStyle = row.id === ion.id ? '#ede9fe' : '#ffffff';
                ctx.fill();
                ctx.strokeStyle = '#e2e8f0';
                ctx.stroke();
                label(ctx, row.label, x + 30, yy + 17, 12, 900, '#0f172a');
                label(ctx, row.config, x + 80, yy + 17, 12, 800, '#475569');
                label(ctx, `n ${row.n}`, x + 130, yy + 17, 12, 800, '#475569');
                label(ctx, row.muCalc, x + 185, yy + 17, 12, 900, '#6d28d9');
                label(ctx, row.muObs, x + 247, yy + 17, 12, 900, '#0891b2');
            });
        }
    }, []);

    const drawColourMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const entry = COLOUR_EXAMPLES.find((row) => row.id === colourRef.current) ?? COLOUR_EXAMPLES[4];
        drawBackground(ctx);
        label(ctx, 'Colour of Complexes', W / 2, 68, 30, 900, '#0f172a');
        label(ctx, 'd-d transition absorbs hν = Δo; observed colour is complementary', W / 2, 101, 15, 800, '#475569');

        const grad = ctx.createLinearGradient(120, 0, 960, 0);
        grad.addColorStop(0, '#6d28d9');
        grad.addColorStop(0.18, '#2563eb');
        grad.addColorStop(0.35, '#14b8a6');
        grad.addColorStop(0.52, '#22c55e');
        grad.addColorStop(0.66, '#eab308');
        grad.addColorStop(0.78, '#f97316');
        grad.addColorStop(1, '#dc2626');
        roundRect(ctx, 120, 160, 840, 46, 18);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();
        label(ctx, '380 nm', 125, 232, 13, 900, '#475569', 'left');
        label(ctx, '780 nm', 960, 232, 13, 900, '#475569', 'right');
        const markerX = 120 + clamp((entry.wavelength - 380) / 400, 0, 1) * 840;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(markerX, 150);
        ctx.lineTo(markerX - 12, 130);
        ctx.lineTo(markerX + 12, 130);
        ctx.closePath();
        ctx.fill();
        label(ctx, `${entry.wavelength} nm`, markerX, 115, 14, 900, '#0f172a');

        drawSphere(ctx, 275, 380, 74, entry.absorbedHex, '#475569', '');
        drawSphere(ctx, 525, 380, 74, entry.observedHex, '#475569', '');
        label(ctx, 'Absorbed', 275, 488, 18, 900, '#0f172a');
        label(ctx, entry.absorbed, 275, 518, 15, 900, '#475569');
        label(ctx, 'Observed', 525, 488, 18, 900, '#0f172a');
        label(ctx, entry.observed, 525, 518, 15, 900, '#475569');

        const cx = 800;
        const cy = 398;
        const colours = ['#dc2626', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#2563eb', '#4f46e5', '#7c3aed', '#c026d3', '#db2777'];
        colours.forEach((colour, index) => {
            ctx.fillStyle = colour;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, 98, (index / 12) * Math.PI * 2, ((index + 1) / 12) * Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        });
        drawArrow(ctx, cx - 70, cy - 70, cx + 70, cy + 70, '#0f172a');
        label(ctx, 'Complementary wheel', cx, cy + 130, 15, 900, '#334155');

        roundRect(ctx, 1030, 150, 155, 430, 22);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.stroke();
        label(ctx, 't₂g → e_g', 1108, 198, 20, 900, '#0f172a');
        drawOrbitalLevel(ctx, 1108, 280, 2, exciteRef.current > 0.35 ? 1 : 0, 'e_g', '#ef4444');
        drawOrbitalLevel(ctx, 1108, 430, 3, 1, 't₂g', '#3b82f6');
        if (showPhotonRef.current) {
            const x = lerp(1045, 1110, clamp(1 - exciteRef.current, 0, 1));
            ctx.strokeStyle = entry.absorbedHex;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i < 35; i += 1) {
                const px = x + i * 2;
                const py = 360 + Math.sin(i * 0.9 + timeRef.current * 8) * 8;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
    }, [drawOrbitalLevel]);

    const drawLigandMode = useCallback((ctx: CanvasRenderingContext2D) => {
        drawBackground(ctx);
        label(ctx, 'Spectrochemical Series and Ligand Field Strength', W / 2, 68, 28, 900, '#0f172a');
        drawArrow(ctx, 105, 205, 1160, 205, '#475569');
        label(ctx, 'weak field · small Δo · high spin · long λ absorbed', 120, 148, 14, 900, '#475569', 'left');
        label(ctx, 'strong field · large Δo · low spin · short λ absorbed', 1160, 148, 14, 900, '#6d28d9', 'right');
        LIGANDS.forEach((ligand, index) => {
            const x = 125 + index * 72;
            const y = 195 - Math.sin(index * 0.7) * 28;
            roundRect(ctx, x - 29, y - 22, 58, 35, 9);
            ctx.fillStyle = ligand.label === ligandRef.current ? '#ede9fe' : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = ligand.label === ligandRef.current ? '#7c3aed' : '#cbd5e1';
            ctx.lineWidth = ligand.label === ligandRef.current ? 3 : 2;
            ctx.stroke();
            label(ctx, ligand.label, x, y - 4, 12, 900, ligand.label === ligandRef.current ? '#5b21b6' : '#334155');
        });

        label(ctx, 'NCERT Fig 5.11: Ni(II) colour progression as en replaces H₂O', W / 2, 330, 18, 900, '#0f172a');
        NI_PROGRESS.forEach((step, index) => {
            const x = 115 + index * 300;
            roundRect(ctx, x, 385, 250, 155, 22);
            ctx.fillStyle = step.color;
            ctx.fill();
            ctx.strokeStyle = index === niIndex ? '#7c3aed' : '#cbd5e1';
            ctx.lineWidth = index === niIndex ? 5 : 2;
            ctx.stroke();
            label(ctx, step.label, x + 125, 438, 16, 900, '#0f172a');
            label(ctx, step.note, x + 125, 480, 15, 900, '#334155');
            label(ctx, `Δo ${step.strength.toFixed(1)}`, x + 125, 516, 13, 900, '#5b21b6');
        });

        roundRect(ctx, 180, 610, 440, 70, 18);
        ctx.fillStyle = hydratedRef.current ? '#dbeafe' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
        label(ctx, hydratedRef.current ? 'CuSO₄·5H₂O = BLUE' : 'Anhydrous CuSO₄ = WHITE', 400, 645, 20, 900, hydratedRef.current ? '#1d4ed8' : '#475569');
        roundRect(ctx, 690, 610, 440, 70, 18);
        ctx.fillStyle = '#ede9fe';
        ctx.fill();
        ctx.stroke();
        label(ctx, 'Cr³⁺: ruby in Al₂O₃, emerald in beryl', 910, 645, 18, 900, '#5b21b6');
    }, [niIndex]);

    const drawSpinDiagram = useCallback((ctx: CanvasRenderingContext2D, x: number, title: string, n: number, strong: boolean, ligand: string) => {
        roundRect(ctx, x, 145, 520, 500, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = strong ? '#7c3aed' : '#94a3b8';
        ctx.lineWidth = 3;
        ctx.stroke();
        label(ctx, title, x + 260, 185, 22, 900, '#0f172a');
        label(ctx, ligand, x + 260, 218, 15, 900, strong ? '#6d28d9' : '#475569');
        drawOrbitalLevel(ctx, x + 250, strong ? 270 : 315, 2, strong ? Math.max(0, 6 - n) : Math.min(2, n), 'e_g', '#ef4444');
        drawOrbitalLevel(ctx, x + 250, strong ? 470 : 470, 3, strong ? 6 : Math.max(3, 6 - n), 't₂g', '#3b82f6');
        drawArrow(ctx, x + 430, 470, x + 430, strong ? 270 : 315, strong ? '#7c3aed' : '#64748b', true);
        drawArrow(ctx, x + 470, 470, x + 470, 360, '#d97706', true);
        label(ctx, 'Δo', x + 448, strong ? 350 : 386, 15, 900, strong ? '#7c3aed' : '#64748b', 'left');
        label(ctx, 'P', x + 488, 417, 15, 900, '#d97706', 'left');
        label(ctx, strong ? 'Δo > P · low spin' : 'Δo < P · high spin', x + 260, 555, 18, 900, strong ? '#6d28d9' : '#b45309');
        label(ctx, `n = ${n} · μ = ${muFromN(n).toFixed(2)} BM · ${n === 0 ? 'diamagnetic' : 'paramagnetic'}`, x + 260, 596, 16, 900, n === 0 ? '#475569' : '#dc2626');
    }, [drawOrbitalLevel]);

    const drawSpinMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const pair = SPIN_PAIRS.find((row) => row.id === spinPairRef.current) ?? SPIN_PAIRS[0];
        drawBackground(ctx);
        label(ctx, 'High-Spin vs Low-Spin Complexes', W / 2, 68, 30, 900, '#0f172a');
        label(ctx, 'Pairing depends on whether Δo is greater or smaller than pairing energy P', W / 2, 101, 15, 800, '#475569');
        drawSpinDiagram(ctx, 80, pair.left, pair.leftN, false, pair.leftLigand);
        drawSpinDiagram(ctx, 700, pair.right, pair.rightN, true, pair.rightLigand);
    }, [drawSpinDiagram]);

    const drawFrame = useCallback((now: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const last = lastRef.current ?? now;
        const dt = Math.min((now - last) / 1000, 0.1);
        lastRef.current = now;

        if (!pausedRef.current) {
            timeRef.current += dt * speedRef.current;
            const ligand = LIGANDS.find((row) => row.label === ligandRef.current) ?? LIGANDS[8];
            const geom = geomRef.current;
            const target = geom === 'tet' ? ligand.strength * 0.42 : geom === 'square' ? ligand.strength * 1.18 : ligand.strength;
            visualDeltaRef.current += (target - visualDeltaRef.current) * Math.min(1, dt * 5);
            if (exciteRef.current > 0) exciteRef.current = Math.max(0, exciteRef.current - dt * 0.75);
            burstsRef.current = burstsRef.current
                .map((burst) => ({ ...burst, life: burst.life - dt }))
                .filter((burst) => burst.life > 0);
        }

        if (modeRef.current === 'magnetism') drawMagnetism(ctx);
        else if (modeRef.current === 'colour') drawColourMode(ctx);
        else if (modeRef.current === 'ligand') drawLigandMode(ctx);
        else if (modeRef.current === 'spin') drawSpinMode(ctx);
        else drawSplitting(ctx);
        requestRef.current = requestAnimationFrame(drawFrame);
    }, [drawColourMode, drawLigandMode, drawMagnetism, drawSpinMode, drawSplitting]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(drawFrame);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [drawFrame]);

    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">NCERT Table 4.7</h3>
                    <p className="text-xs font-semibold text-slate-500">Magnetic moments of first-row transition ions</p>
                    <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 text-[11px] font-bold">
                        <div className="grid grid-cols-[45px_48px_28px_48px_60px] bg-slate-50 px-2 py-1.5 text-slate-700">
                            <span>Ion</span><span>Config</span><span>n</span><span>μ_calc</span><span>μ_obs</span>
                        </div>
                        {ION_TABLE.map((row) => (
                            <button
                                key={row.id}
                                onClick={() => setSelectedIon(row.id)}
                                className={`grid w-full grid-cols-[45px_48px_28px_48px_60px] px-2 py-1.5 text-left ${row.id === selectedIon ? 'bg-violet-100 text-violet-950' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span>{row.label}</span><span>{row.config}</span><span>{row.n}</span><span>{row.muCalc}</span><span>{row.muObs}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Spectrochemical Scale</h3>
                    <p className="text-xs font-semibold text-slate-500">Weak field to strong field</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {LIGANDS.map((ligand) => (
                            <button
                                key={ligand.label}
                                onClick={() => setSelectedLigand(ligand.label)}
                                className={`rounded-lg border px-2 py-1 text-xs font-black ${selectedLigand === ligand.label ? 'border-violet-500 bg-violet-100 text-violet-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                {ligand.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-slate-300 via-cyan-300 to-violet-600" />
                    <div className="mt-1 flex justify-between text-[11px] font-bold text-slate-600">
                        <span>high spin</span><span>low spin</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Colour Examples</h3>
                    <p className="text-xs font-semibold text-slate-500">NCERT Table 5.3</p>
                    <div className="mt-2 space-y-1.5">
                        {COLOUR_EXAMPLES.map((entry) => (
                            <button
                                key={entry.id}
                                onClick={() => {
                                    setColourExampleId(entry.id);
                                    setMode('colour');
                                }}
                                className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[11px] font-bold ${colourExampleId === entry.id ? 'border-violet-400 bg-violet-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
                            >
                                <span className="h-4 w-4 shrink-0 rounded-full border border-slate-300" style={{ backgroundColor: entry.observedHex }} />
                                <span className="min-w-0 flex-1 truncate">{entry.complex}</span>
                                <span className="text-slate-600">{entry.wavelength} nm</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    ), [colourExampleId, selectedIon, selectedLigand]);

    const valuesPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="flex items-start gap-2">
                        <FlaskConical size={19} className="mt-0.5 text-violet-800" />
                        <div>
                            <h3 className="text-base font-extrabold text-violet-950">Magnetic Properties & Colour</h3>
                            <p className="text-xs font-semibold text-violet-700">NCERT Class 12 · Unit 8 Sec 4.3.9; Unit 9 Sec 5.5</p>
                        </div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-violet-950">
                        <p>Diamagnetic: repelled by a field; all electrons paired.</p>
                        <p>Paramagnetic: attracted by a field; one or more unpaired electrons. Ferromagnetic is extreme paramagnetism.</p>
                        <p>μ = √(n(n+2)) BM; for first-row ions orbital contribution is quenched.</p>
                        <p>Octahedral: e_g raised by (3/5)Δo; t₂g lowered by (2/5)Δo.</p>
                        <p>Tetrahedral: e lower, t₂ higher; Δ_t = (4/9) Δ_o; no g subscript.</p>
                        <p>Δo &gt; P gives low spin; Δo &lt; P gives high spin.</p>
                        <p>d-d transition absorbs hν = Δo; observed colour is complementary.</p>
                        <p>d⁰ and d¹⁰ complexes are colourless when no d-d transition occurs.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Ion', value: `${activeIon.label} · ${activeIon.config}`, tint: 'bg-slate-50', color: 'text-slate-800' },
                            { label: 'Unpaired electrons', value: `${activeUnpaired}`, tint: 'bg-red-50', color: activeUnpaired ? 'text-red-700' : 'text-slate-700' },
                            { label: 'Magnetic moment', value: `${activeMu.toFixed(2)} BM`, tint: 'bg-violet-50', color: 'text-violet-700' },
                            { label: 'Field splitting', value: geometry === 'tet' ? `Δt ${(targetDelta).toFixed(1)}` : `Δo ${targetDelta.toFixed(1)}`, tint: 'bg-cyan-50', color: 'text-cyan-700' },
                            { label: 'Absorbed colour', value: `${activeColour.wavelength} nm ${activeColour.absorbed}`, tint: 'bg-amber-50', color: 'text-amber-700' },
                            { label: 'Observed colour', value: activeColour.observed, tint: 'bg-blue-50', color: 'text-blue-700' }
                        ].map((row) => (
                            <div key={row.label} className={`rounded-lg border border-slate-100 ${row.tint} px-3 py-2.5`}>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                                <div className={`mt-1 font-mono text-base font-extrabold ${row.color}`}>{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">NCERT Examples</h3>
                    <div className="mt-2 space-y-2 text-sm font-semibold leading-snug text-slate-700">
                        <p>Example 4.8: Co²⁺ d⁷ has 3 unpaired electrons, μ = √(3·5) = 3.87 BM.</p>
                        <p>[Cu(H₂O)₄]²⁺ absorbs 600 nm RED and appears blue.</p>
                        <p>[Mn(CN)₆]³⁻ has 2 unpaired; [MnCl₆]³⁻ has 4 unpaired.</p>
                        <p>[Fe(CN)₆]³⁻ has 1; [FeF₆]³⁻ has 5; [CoF₆]³⁻ has 4; [Co(C₂O₄)₃]³⁻ has 0.</p>
                        <p>[Ni(CN)₄]²⁻ is diamagnetic square planar; [NiCl₄]²⁻ is paramagnetic tetrahedral.</p>
                        <p>Anhydrous CuSO₄ is white; CuSO₄·5H₂O is blue. Removing water from [Ti(H₂O)₆]Cl₃ makes it colourless.</p>
                    </div>
                </div>
            </div>
        </aside>
    ), [activeColour, activeIon, activeMu, activeUnpaired, geometry, targetDelta]);

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

    const controls = (
        <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="rounded-lg bg-violet-100 p-2 text-violet-700">
                        <Atom size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">d-Block Crystal Field Bench</div>
                        <div className={`text-[11px] font-black ${isDiamagnetic ? 'text-slate-600' : 'text-red-700'}`}>{isDiamagnetic ? 'diamagnetic' : 'paramagnetic'}</div>
                    </div>
                </div>
                <button
                    onClick={triggerExcitation}
                    className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700 hover:bg-amber-100"
                    title="Excite electron"
                >
                    <Sparkles size={16} />
                </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
                {MODES.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setMode(item.id)}
                        className={`flex min-h-[38px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-black transition ${
                            mode === item.id ? 'border-violet-400 bg-violet-100 text-violet-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-11 gap-1">
                {ION_TABLE.map((ion) => (
                    <button
                        key={ion.id}
                        onClick={() => setSelectedIon(ion.id)}
                        className={`min-h-[30px] rounded-md border text-[10px] font-black ${selectedIon === ion.id ? 'border-violet-400 bg-violet-100 text-violet-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        {ion.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
                <label className="space-y-1">
                    <span className="text-xs font-black text-slate-700">Ligand</span>
                    <select value={selectedLigand} onChange={(event) => setSelectedLigand(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800">
                        {LIGANDS.map((ligand) => <option key={ligand.label} value={ligand.label}>{ligand.label}</option>)}
                    </select>
                </label>
                <label className="space-y-1">
                    <span className="text-xs font-black text-slate-700">Colour</span>
                    <select value={colourExampleId} onChange={(event) => setColourExampleId(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800">
                        {COLOUR_EXAMPLES.map((entry) => <option key={entry.id} value={entry.id}>{entry.complex}</option>)}
                    </select>
                </label>
                <label className="space-y-1">
                    <span className="text-xs font-black text-slate-700">Spin Pair</span>
                    <select value={spinPairId} onChange={(event) => setSpinPairId(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800">
                        {SPIN_PAIRS.map((pair) => <option key={pair.id} value={pair.id}>{pair.left} / {pair.right}</option>)}
                    </select>
                </label>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
                {[
                    { id: 'oct' as Geometry, label: 'Octahedral' },
                    { id: 'tet' as Geometry, label: 'Tetrahedral' },
                    { id: 'square' as Geometry, label: 'Square planar' }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setGeometry(item.id)}
                        className={`rounded-lg border px-2 py-2 text-xs font-black ${geometry === item.id ? 'border-cyan-400 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Speed</span>
                        <output>{speed.toFixed(1)}x</output>
                    </div>
                    <input className="w-full accent-violet-600" type="range" min={0.2} max={2.5} step={0.1} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
                </label>
                <label className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Ni-en</span>
                        <output>{niIndex + 1}/4</output>
                    </div>
                    <input className="w-full accent-blue-600" type="range" min={0} max={3} step={1} value={niIndex} onChange={(event) => setNiIndex(Number(event.target.value))} />
                </label>
            </div>

            <div className="grid grid-cols-5 gap-2">
                <button onClick={() => setShowOrbitals((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showOrbitals ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show orbital lobes">
                    {showOrbitals ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} Lobes
                </button>
                <button onClick={() => setShowPhoton((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showPhoton ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show photon">
                    {showPhoton ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} Photon
                </button>
                <button onClick={() => setShowCFSE((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showCFSE ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show CFSE">
                    <Activity size={15} className="mx-auto" /> CFSE
                </button>
                <button onClick={() => setShowTable((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showTable ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show Table 4.7">
                    <FlaskConical size={15} className="mx-auto" /> Table
                </button>
                <button onClick={() => setHydratedCopper((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${hydratedCopper ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500'}`} title="CuSO4 hydration">
                    <Palette size={15} className="mx-auto" /> CuSO₄
                </button>
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

export default DBlockLab;
