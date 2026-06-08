import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowLeftRight,
    Atom,
    Box,
    Eye,
    EyeOff,
    FlaskConical,
    Layers,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    Sparkles
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface StereochemistryLabProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'square' | 'octa' | 'chelate' | 'facmer' | 'optical' | 'overview';
type SubType = 'cis' | 'trans' | 'fac' | 'mer' | 'delta' | 'lambda';

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

interface Atom3D extends Vec3 {
    color: string;
    stroke: string;
    radius: number;
    label: string;
    role?: string;
}

interface Molecule3D {
    atoms: Atom3D[];
    bonds: Array<[number, number]>;
    chelates?: Array<[number, number]>;
    face?: number[];
    plane?: number[];
}

const W = 1280;
const H = 760;
const METAL = '#94a3b8';
const PT = '#cbd5e1';
const CO = '#db2777';
const CR = '#0891b2';
const CL = '#a3e635';
const NH3 = '#3b82f6';
const NO2 = '#f59e0b';
const EN = '#ec4899';
const OX = '#14b8a6';

const MODE_META: Array<{ id: Mode; label: string; icon: React.ReactNode; chip: string }> = [
    { id: 'square', label: 'Sq-pl', icon: <Box size={15} />, chip: '[MX₂L₂]' },
    { id: 'octa', label: 'Oct A₄B₂', icon: <Layers size={15} />, chip: 'MA₄B₂' },
    { id: 'chelate', label: 'en cis/trans', icon: <Sparkles size={15} />, chip: 'MX₂(en)₂' },
    { id: 'facmer', label: 'fac/mer', icon: <RotateCw size={15} />, chip: 'MA₃B₃' },
    { id: 'optical', label: 'M(en)₃', icon: <ArrowLeftRight size={15} />, chip: 'd/l' },
    { id: 'overview', label: 'Overview', icon: <FlaskConical size={15} />, chip: 'Sec 5.4' }
];

const STRUCTURAL_EXAMPLES = [
    { type: 'Linkage', note: 'ambidentate ligand binds through different donor atom', example: '[Co(NH₃)₅(NO₂)]Cl₂ yellow vs [Co(NH₃)₅(ONO)]Cl₂ red' },
    { type: 'Coordination', note: 'ligands exchange between two metal coordination spheres', example: '[Co(NH₃)₆][Cr(CN)₆] ⇄ [Cr(NH₃)₆][Co(CN)₆]' },
    { type: 'Ionisation', note: 'counter ion swaps with a ligand', example: '[Co(NH₃)₅(SO₄)]Br ⇄ [Co(NH₃)₅Br]SO₄' },
    { type: 'Solvate', note: 'water inside vs outside coordination sphere', example: 'hydrate isomerism: H₂O ligand vs water of crystallisation' }
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

function rotate(v: Vec3, rx: number, ry: number): Vec3 {
    const cy = Math.cos(ry);
    const sy = Math.sin(ry);
    const cx = Math.cos(rx);
    const sx = Math.sin(rx);
    const x1 = v.x * cy + v.z * sy;
    const z1 = -v.x * sy + v.z * cy;
    const y1 = v.y * cx - z1 * sx;
    const z2 = v.y * sx + z1 * cx;
    return { x: x1, y: y1, z: z2 };
}

function project(v: Vec3, cx: number, cy: number, scale = 1) {
    const distance = 650;
    const perspective = distance / (distance - v.z);
    return {
        x: cx + v.x * perspective * scale,
        y: cy + v.y * perspective * scale,
        z: v.z,
        s: perspective * scale
    };
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
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
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

function sphere(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, stroke: string, text: string) {
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
    label(ctx, text, x, y, Math.max(10, r * 0.5), 900, '#0f172a');
}

function squarePlanar(cis: boolean): Molecule3D {
    const pos = [
        { x: 130, y: 0, z: 0 },
        { x: -130, y: 0, z: 0 },
        { x: 0, y: -130, z: 0 },
        { x: 0, y: 130, z: 0 }
    ];
    const atoms: Atom3D[] = [{ x: 0, y: 0, z: 0, color: PT, stroke: '#94a3b8', radius: 34, label: 'Pt' }];
    const clIndices = cis ? [0, 2] : [0, 1];
    pos.forEach((p, index) => {
        const isCl = clIndices.includes(index);
        atoms.push({
            ...p,
            color: isCl ? CL : NH3,
            stroke: isCl ? '#65a30d' : '#1d4ed8',
            radius: isCl ? 24 : 30,
            label: isCl ? 'Cl' : 'NH₃'
        });
    });
    return { atoms, bonds: [[0, 1], [0, 2], [0, 3], [0, 4]] };
}

function octaMA4B2(cis: boolean, metal = 'Co'): Molecule3D {
    const pos = [
        { x: 145, y: 0, z: 0 },
        { x: -145, y: 0, z: 0 },
        { x: 0, y: -145, z: 0 },
        { x: 0, y: 145, z: 0 },
        { x: 0, y: 0, z: 145 },
        { x: 0, y: 0, z: -145 }
    ];
    const clIndices = cis ? [0, 2] : [0, 1];
    const atoms: Atom3D[] = [{ x: 0, y: 0, z: 0, color: metal === 'Co' ? CO : METAL, stroke: '#9f1239', radius: 34, label: metal }];
    pos.forEach((p, index) => {
        const isCl = clIndices.includes(index);
        atoms.push({
            ...p,
            color: isCl ? CL : NH3,
            stroke: isCl ? '#65a30d' : '#1d4ed8',
            radius: isCl ? 24 : 28,
            label: isCl ? 'Cl' : 'NH₃'
        });
    });
    return { atoms, bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]] };
}

function chelateComplex(cis: boolean, mirror = false): Molecule3D {
    const positions = cis
        ? [
            { x: 145, y: 0, z: 0, label: 'Cl' },
            { x: 0, y: -145, z: 0, label: 'Cl' },
            { x: -145, y: 0, z: 0, label: 'en-N' },
            { x: 0, y: 145, z: 0, label: 'en-N' },
            { x: 0, y: 0, z: 145, label: 'en-N' },
            { x: 0, y: 0, z: -145, label: 'en-N' }
        ]
        : [
            { x: 145, y: 0, z: 0, label: 'Cl' },
            { x: -145, y: 0, z: 0, label: 'Cl' },
            { x: 0, y: -145, z: 0, label: 'en-N' },
            { x: 0, y: 145, z: 0, label: 'en-N' },
            { x: 0, y: 0, z: 145, label: 'en-N' },
            { x: 0, y: 0, z: -145, label: 'en-N' }
        ];
    const atoms: Atom3D[] = [{ x: 0, y: 0, z: 0, color: CO, stroke: '#9f1239', radius: 34, label: 'Co' }];
    positions.forEach((p) => {
        const x = mirror ? -p.x : p.x;
        const isCl = p.label === 'Cl';
        atoms.push({ x, y: p.y, z: p.z, color: isCl ? CL : EN, stroke: isCl ? '#65a30d' : '#be185d', radius: isCl ? 24 : 23, label: p.label });
    });
    return {
        atoms,
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
        chelates: cis ? [[3, 4], [5, 6]] : [[3, 5], [4, 6]]
    };
}

function facMer(fac: boolean): Molecule3D {
    const pos = [
        { x: 145, y: 0, z: 0 },
        { x: -145, y: 0, z: 0 },
        { x: 0, y: -145, z: 0 },
        { x: 0, y: 145, z: 0 },
        { x: 0, y: 0, z: 145 },
        { x: 0, y: 0, z: -145 }
    ];
    const aIndices = fac ? [0, 2, 4] : [0, 1, 2];
    const atoms: Atom3D[] = [{ x: 0, y: 0, z: 0, color: CO, stroke: '#9f1239', radius: 34, label: 'Co' }];
    pos.forEach((p, index) => {
        const isA = aIndices.includes(index);
        atoms.push({ ...p, color: isA ? NH3 : NO2, stroke: isA ? '#1d4ed8' : '#b45309', radius: 27, label: isA ? 'NH₃' : 'NO₂' });
    });
    return {
        atoms,
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
        face: fac ? [1, 3, 5] : undefined,
        plane: fac ? undefined : [1, 2, 3]
    };
}

function opticalComplex(mirror = false): Molecule3D {
    const positions = [
        { x: 145, y: 0, z: 0 },
        { x: 0, y: 145, z: 0 },
        { x: -145, y: 0, z: 0 },
        { x: 0, y: -145, z: 0 },
        { x: 0, y: 0, z: 145 },
        { x: 0, y: 0, z: -145 }
    ];
    const atoms: Atom3D[] = [{ x: 0, y: 0, z: 0, color: CO, stroke: '#9f1239', radius: 34, label: 'Co' }];
    positions.forEach((p) => {
        atoms.push({ x: mirror ? -p.x : p.x, y: p.y, z: p.z, color: EN, stroke: '#be185d', radius: 22, label: 'en-N' });
    });
    return {
        atoms,
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
        chelates: mirror ? [[1, 4], [2, 6], [3, 5]] : [[1, 2], [3, 6], [4, 5]]
    };
}

function drawMolecule(
    ctx: CanvasRenderingContext2D,
    molecule: Molecule3D,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    options: { scale?: number; showLabels?: boolean; showChelate?: boolean; highlight?: boolean } = {}
) {
    const scale = options.scale ?? 1;
    const projected = molecule.atoms.map((atom, index) => {
        const r = rotate(atom, rx, ry);
        const p = project(r, cx, cy, scale);
        return { atom, index, ...p };
    });

    const byIndex = new Map(projected.map((p) => [p.index, p]));
    ctx.lineCap = 'round';
    molecule.bonds.forEach(([a, b]) => {
        const pa = byIndex.get(a);
        const pb = byIndex.get(b);
        if (!pa || !pb) return;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 5 * scale;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
    });

    if (options.showChelate && molecule.chelates) {
        molecule.chelates.forEach(([a, b]) => {
            const pa = byIndex.get(a);
            const pb = byIndex.get(b);
            const pm = byIndex.get(0);
            if (!pa || !pb || !pm) return;
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3 * scale;
            ctx.beginPath();
            const c1x = lerp(pa.x, pm.x, 0.35);
            const c1y = lerp(pa.y, pm.y, 0.35) - 35 * scale;
            const c2x = lerp(pb.x, pm.x, 0.35);
            const c2y = lerp(pb.y, pm.y, 0.35) - 35 * scale;
            ctx.moveTo(pa.x, pa.y);
            ctx.bezierCurveTo(c1x, c1y, c2x, c2y, pb.x, pb.y);
            ctx.stroke();
            sphere(ctx, lerp(pa.x, pb.x, 0.38), lerp(pa.y, pb.y, 0.38) - 24 * scale, 12 * scale, '#fce7f3', '#be185d', 'CH₂');
            sphere(ctx, lerp(pa.x, pb.x, 0.62), lerp(pa.y, pb.y, 0.62) - 24 * scale, 12 * scale, '#fce7f3', '#be185d', 'CH₂');
        });
    }

    if (molecule.face) {
        const pts = molecule.face.map((idx) => byIndex.get(idx)).filter(Boolean) as Array<NonNullable<ReturnType<typeof byIndex.get>>>;
        if (pts.length === 3) {
            ctx.fillStyle = 'rgba(245,158,11,0.18)';
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.lineTo(pts[2].x, pts[2].y);
            ctx.closePath();
            ctx.fill();
        }
    }

    if (molecule.plane) {
        const pts = molecule.plane.map((idx) => byIndex.get(idx)).filter(Boolean) as Array<NonNullable<ReturnType<typeof byIndex.get>>>;
        if (pts.length === 3) {
            ctx.fillStyle = 'rgba(99,102,241,0.16)';
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y - 48);
            ctx.lineTo(pts[1].x, pts[1].y - 48);
            ctx.lineTo(pts[1].x, pts[1].y + 48);
            ctx.lineTo(pts[0].x, pts[0].y + 48);
            ctx.closePath();
            ctx.fill();
        }
    }

    projected
        .sort((a, b) => a.z - b.z)
        .forEach((p) => {
            ctx.save();
            if (options.highlight && p.index === 0) {
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 22;
            }
            sphere(ctx, p.x, p.y, p.atom.radius * p.s, p.atom.color, p.atom.stroke, options.showLabels === false ? '' : p.atom.label);
            ctx.restore();
        });
}

const StereochemistryLab: React.FC<StereochemistryLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const lastRef = useRef<number>();
    const timeRef = useRef(0);
    const rotationRef = useRef({ x: -0.32, y: 0.36 });
    const draggingRef = useRef(false);
    const lastMouseRef = useRef({ x: 0, y: 0 });
    const superimposeRef = useRef(0);
    const forceRef = useRef(0);

    const [mode, setMode] = useState<Mode>('square');
    const [subType, setSubType] = useState<SubType>('cis');
    const [showMirror, setShowMirror] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const [showAngles, setShowAngles] = useState(true);
    const [showChelate, setShowChelate] = useState(true);
    const [autoRotate, setAutoRotate] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [activeLeaf, setActiveLeaf] = useState('Linkage');
    const [dragTick, setDragTick] = useState(0);

    const modeRef = useRef(mode);
    const subTypeRef = useRef(subType);
    const showMirrorRef = useRef(showMirror);
    const showLabelsRef = useRef(showLabels);
    const showAnglesRef = useRef(showAngles);
    const showChelateRef = useRef(showChelate);
    const autoRotateRef = useRef(autoRotate);
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);
    const activeLeafRef = useRef(activeLeaf);

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { subTypeRef.current = subType; }, [subType]);
    useEffect(() => { showMirrorRef.current = showMirror; }, [showMirror]);
    useEffect(() => { showLabelsRef.current = showLabels; }, [showLabels]);
    useEffect(() => { showAnglesRef.current = showAngles; }, [showAngles]);
    useEffect(() => { showChelateRef.current = showChelate; }, [showChelate]);
    useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { activeLeafRef.current = activeLeaf; }, [activeLeaf]);

    const selectedMeta = MODE_META.find((item) => item.id === mode) ?? MODE_META[0];
    const isomerCount = mode === 'square' ? '2 isomers' : mode === 'octa' ? '2 isomers' : mode === 'chelate' ? 'cis chiral, trans achiral' : mode === 'facmer' ? 'fac + mer' : mode === 'optical' ? 'd/l enantiomers' : '6-class tree';
    const ncertHint = {
        square: 'Square planar [MX₂L₂] has 2 isomers: cis and trans. [Pt(NH₃)₂Cl₂] is NCERT Fig 5.2.',
        octa: 'Octahedral [MA₄B₂] has cis/trans isomers. [Co(NH₃)₄Cl₂]⁺ is NCERT Fig 5.3.',
        chelate: '[CoCl₂(en)₂]: cis is chiral and optically active; trans is achiral. Also cis-[PtCl₂(en)₂]²⁺, Fig 5.7.',
        facmer: '[Ma₃b₃] octahedral complexes have facial and meridional forms. [Co(NH₃)₃(NO₂)₃] is Fig 5.5.',
        optical: '[Co(en)₃]³⁺ exists as d and l enantiomers: non-superimposable mirror images, Fig 5.6.',
        overview: 'NCERT Sec 5.4: stereoisomerism is geometrical or optical; structural isomerism has linkage, coordination, ionisation and solvate types.'
    }[mode];

    const setModeSafely = useCallback((next: Mode) => {
        setMode(next);
        if (next === 'square' || next === 'octa' || next === 'chelate') setSubType('cis');
        if (next === 'facmer') setSubType('fac');
        if (next === 'optical') {
            setSubType('delta');
            setShowMirror(true);
        }
        if (next === 'overview') setShowMirror(false);
    }, []);

    const handleReset = useCallback(() => {
        setMode('square');
        setSubType('cis');
        setShowMirror(false);
        setShowLabels(true);
        setShowAngles(true);
        setShowChelate(true);
        setAutoRotate(true);
        setPaused(false);
        setSpeed(1);
        setActiveLeaf('Linkage');
        rotationRef.current = { x: -0.32, y: 0.36 };
        superimposeRef.current = 0;
        timeRef.current = 0;
        setDragTick((value) => value + 1);
    }, []);

    const attemptSuperimpose = useCallback(() => {
        superimposeRef.current = 1;
    }, []);

    const onPointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
        draggingRef.current = true;
        lastMouseRef.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
    }, []);

    const onPointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!draggingRef.current) return;
        const dx = event.clientX - lastMouseRef.current.x;
        const dy = event.clientY - lastMouseRef.current.y;
        rotationRef.current = {
            x: clamp(rotationRef.current.x + dy * 0.01, -1.4, 1.4),
            y: rotationRef.current.y + dx * 0.01
        };
        lastMouseRef.current = { x: event.clientX, y: event.clientY };
        forceRef.current += 1;
        setDragTick(forceRef.current);
    }, []);

    const onPointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
        draggingRef.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
    }, []);

    const drawMirrorPlane = useCallback((ctx: CanvasRenderingContext2D, x: number, shimmer: number) => {
        ctx.save();
        ctx.globalAlpha = 0.14 + shimmer * 0.08;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(x - 12, 120, 24, 540);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#94a3b8';
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 120);
        ctx.lineTo(x, 660);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, 'Mirror plane', x, 105, 14, 900, '#64748b');
        ctx.restore();
    }, []);

    const drawAngle = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, color: string) => {
        if (!showAnglesRef.current) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, 68, -Math.PI / 2, 0);
        ctx.stroke();
        label(ctx, text, cx + 78, cy - 78, 16, 900, color);
    }, []);

    const drawSquareMode = useCallback((ctx: CanvasRenderingContext2D) => {
        drawBackground(ctx);
        label(ctx, '[Pt(NH₃)₂Cl₂] Square Planar Geometrical Isomerism', W / 2, 68, 28, 900, '#0f172a');
        label(ctx, 'cis/trans [MX₂L₂] · NCERT Fig 5.2', W / 2, 101, 15, 800, '#475569');
        drawMolecule(ctx, squarePlanar(true), 335, 365, rotationRef.current.x * 0.25, rotationRef.current.y, { scale: 1.08, showLabels: showLabelsRef.current, highlight: true });
        drawMolecule(ctx, squarePlanar(false), 935, 365, rotationRef.current.x * 0.25, rotationRef.current.y, { scale: 1.08, showLabels: showLabelsRef.current });
        label(ctx, 'cis-[Pt(NH₃)₂Cl₂]', 335, 610, 21, 900, '#0f172a');
        label(ctx, "Cl's adjacent (90°)", 335, 642, 16, 900, '#16a34a');
        label(ctx, 'trans-[Pt(NH₃)₂Cl₂]', 935, 610, 21, 900, '#0f172a');
        label(ctx, "Cl's opposite (180°)", 935, 642, 16, 900, '#64748b');
        drawAngle(ctx, 335, 365, '90°', '#16a34a');
        if (showAnglesRef.current) label(ctx, '180°', 935, 243, 16, 900, '#64748b');
        label(ctx, 'MABXL square planar: 3 isomers (two cis + one trans)', W / 2, 704, 15, 900, '#6d28d9');
    }, [drawAngle]);

    const drawOctaMode = useCallback((ctx: CanvasRenderingContext2D) => {
        drawBackground(ctx);
        label(ctx, '[Co(NH₃)₄Cl₂]⁺ Octahedral cis/trans', W / 2, 68, 28, 900, '#0f172a');
        label(ctx, 'MA₄B₂ coordination sphere · NCERT Fig 5.3', W / 2, 101, 15, 800, '#475569');
        drawMolecule(ctx, octaMA4B2(true), 335, 365, rotationRef.current.x, rotationRef.current.y, { scale: 1.06, showLabels: showLabelsRef.current, highlight: true });
        drawMolecule(ctx, octaMA4B2(false), 935, 365, rotationRef.current.x, rotationRef.current.y, { scale: 1.06, showLabels: showLabelsRef.current });
        label(ctx, 'cis-[Co(NH₃)₄Cl₂]⁺', 335, 615, 21, 900, '#0f172a');
        label(ctx, 'Cl-Co-Cl angle = 90°', 335, 646, 16, 900, '#16a34a');
        label(ctx, 'trans-[Co(NH₃)₄Cl₂]⁺', 935, 615, 21, 900, '#0f172a');
        label(ctx, 'Cl-Co-Cl angle = 180°', 935, 646, 16, 900, '#64748b');
        drawAngle(ctx, 335, 365, '90°', '#16a34a');
        if (showAnglesRef.current) label(ctx, '180°', 935, 228, 16, 900, '#64748b');
        label(ctx, 'Example 5.5: [Fe(NH₃)₂(CN)₄]⁻ also shows octahedral cis/trans', W / 2, 704, 15, 900, '#6d28d9');
    }, [drawAngle]);

    const drawChelateMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const cis = subTypeRef.current !== 'trans';
        drawBackground(ctx);
        label(ctx, '[CoCl₂(en)₂] Octahedral Chelate Isomerism', W / 2, 68, 28, 900, '#0f172a');
        label(ctx, 'en = ethylenediamine, N-CH₂-CH₂-N · NCERT Fig 5.4 and Fig 5.7', W / 2, 101, 15, 800, '#475569');
        drawMolecule(ctx, chelateComplex(cis), 355, 365, rotationRef.current.x, rotationRef.current.y, { scale: 1.05, showLabels: showLabelsRef.current, showChelate: showChelateRef.current, highlight: cis });
        label(ctx, cis ? 'cis-[CoCl₂(en)₂]' : 'trans-[CoCl₂(en)₂]', 355, 618, 21, 900, '#0f172a');
        label(ctx, cis ? 'cis is CHIRAL: non-superimposable, d/l forms' : 'trans is ACHIRAL: mirror image superimposes', 355, 650, 16, 900, cis ? '#b45309' : '#64748b');
        if (showMirrorRef.current) {
            drawMirrorPlane(ctx, 640, (Math.sin(timeRef.current * 2.2) + 1) / 2);
            const slide = cis ? 0 : Math.sin(timeRef.current * 1.2) * 18;
            drawMolecule(ctx, chelateComplex(cis, true), 950 - slide, 365, rotationRef.current.x, rotationRef.current.y, { scale: 1.05, showLabels: showLabelsRef.current, showChelate: showChelateRef.current });
            label(ctx, 'Mirror image', 950, 618, 21, 900, '#0f172a');
            label(ctx, cis ? 'not superimposable' : 'slides into place', 950, 650, 16, 900, cis ? '#dc2626' : '#16a34a');
        }
        label(ctx, 'Also: cis-[PtCl₂(en)₂]²⁺ behaves the same; cis-[CrCl₂(ox)₂]³⁻ is chiral, trans is achiral', W / 2, 704, 14, 900, '#6d28d9');
    }, [drawMirrorPlane]);

    const drawFacMerMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const fac = subTypeRef.current !== 'mer';
        drawBackground(ctx);
        label(ctx, '[Co(NH₃)₃(NO₂)₃] Octahedral fac/mer Isomerism', W / 2, 68, 28, 900, '#0f172a');
        label(ctx, 'MA₃B₃ · NCERT Fig 5.5', W / 2, 101, 15, 800, '#475569');
        drawMolecule(ctx, facMer(fac), W / 2, 365, rotationRef.current.x, rotationRef.current.y, { scale: 1.35, showLabels: showLabelsRef.current, highlight: fac });
        label(ctx, fac ? 'facial: 3 NH₃ on one triangular face' : 'meridional: 3 NH₃ around a meridian plane', W / 2, 625, 21, 900, fac ? '#b45309' : '#4f46e5');
        label(ctx, fac ? 'all NH₃-Co-NH₃ angles = 90°' : 'one NH₃ pair is trans (180°), two are 90°', W / 2, 658, 16, 900, '#475569');
        if (showAnglesRef.current) {
            label(ctx, fac ? '90° · 90° · 90°' : '180° + 90° + 90°', W / 2, 704, 18, 900, fac ? '#b45309' : '#4f46e5');
        }
    }, []);

    const drawPolarimeter = useCallback((ctx: CanvasRenderingContext2D) => {
        roundRect(ctx, 165, 645, 990, 58, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();
        const leftA = timeRef.current * 1.4;
        const rightA = -timeRef.current * 1.4;
        drawArrow(ctx, 315, 674, 315 + Math.cos(leftA) * 42, 674 + Math.sin(leftA) * 42, '#2563eb');
        drawArrow(ctx, 960, 674, 960 + Math.cos(rightA) * 42, 674 + Math.sin(rightA) * 42, '#dc2626');
        label(ctx, '+α dextro', 405, 674, 16, 900, '#2563eb');
        label(ctx, '−α laevo', 870, 674, 16, 900, '#dc2626');
        label(ctx, 'Equal magnitude, opposite direction; same mp, bp and refractive index', W / 2, 716, 13, 800, '#475569');
    }, []);

    const drawOpticalMode = useCallback((ctx: CanvasRenderingContext2D) => {
        drawBackground(ctx);
        label(ctx, '[Co(en)₃]³⁺ Optical Isomerism', W / 2, 68, 28, 900, '#0f172a');
        label(ctx, 'd/l enantiomers are non-superimposable mirror images · NCERT Fig 5.6', W / 2, 101, 15, 800, '#475569');
        const phase = superimposeRef.current > 0 ? 1 - superimposeRef.current : 0;
        const travel = phase <= 0.5 ? ease(phase / 0.5) * 300 : ease((1 - phase) / 0.5) * 300;
        drawMolecule(ctx, opticalComplex(false), 355, 350, rotationRef.current.x, rotationRef.current.y, { scale: 1.05, showLabels: showLabelsRef.current, showChelate: showChelateRef.current, highlight: true });
        drawMirrorPlane(ctx, 640, (Math.sin(timeRef.current * 2.2) + 1) / 2);
        drawMolecule(ctx, opticalComplex(true), 950 - travel, 350, rotationRef.current.x, rotationRef.current.y, { scale: 1.05, showLabels: showLabelsRef.current, showChelate: showChelateRef.current, highlight: true });
        label(ctx, 'Δ / d form', 355, 590, 21, 900, '#2563eb');
        label(ctx, 'Λ / l form', 950, 590, 21, 900, '#dc2626');
        if (phase > 0.42 && phase < 0.68) {
            ctx.save();
            ctx.shadowColor = '#dc2626';
            ctx.shadowBlur = 30;
            label(ctx, '✗ Cannot superimpose — chiral!', W / 2, 610, 24, 900, '#dc2626');
            ctx.restore();
        }
        drawPolarimeter(ctx);
    }, [drawMirrorPlane, drawPolarimeter]);

    const drawOverviewMode = useCallback((ctx: CanvasRenderingContext2D) => {
        drawBackground(ctx);
        label(ctx, 'Isomerism in Coordination Compounds', W / 2, 64, 30, 900, '#0f172a');
        label(ctx, 'NCERT Sec 5.4 classification', W / 2, 98, 15, 800, '#475569');
        const boxes = [
            { text: 'ISOMERISM', x: 560, y: 130, w: 160, h: 48, color: '#ede9fe' },
            { text: 'Stereoisomerism', x: 255, y: 250, w: 230, h: 58, color: '#dcfce7' },
            { text: 'Structural isomerism', x: 805, y: 250, w: 230, h: 58, color: '#dbeafe' },
            { text: 'Geometrical\ncis/trans, fac/mer', x: 125, y: 390, w: 260, h: 66, color: '#fef3c7' },
            { text: 'Optical\nd / l enantiomers', x: 405, y: 390, w: 250, h: 66, color: '#fce7f3' }
        ];
        boxes.forEach((box) => {
            roundRect(ctx, box.x, box.y, box.w, box.h, 15);
            ctx.fillStyle = box.color;
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();
            const lines = box.text.split('\n');
            lines.forEach((line, index) => label(ctx, line, box.x + box.w / 2, box.y + box.h / 2 + (index - (lines.length - 1) / 2) * 18, index ? 13 : 16, 900, '#0f172a'));
        });
        drawArrow(ctx, 640, 178, 370, 250, '#64748b');
        drawArrow(ctx, 640, 178, 920, 250, '#64748b');
        drawArrow(ctx, 370, 308, 255, 390, '#64748b');
        drawArrow(ctx, 370, 308, 530, 390, '#64748b');
        STRUCTURAL_EXAMPLES.forEach((item, index) => {
            const x = 780;
            const y = 370 + index * 86;
            roundRect(ctx, x, y, 360, 66, 14);
            ctx.fillStyle = activeLeafRef.current === item.type ? '#dbeafe' : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = activeLeafRef.current === item.type ? '#2563eb' : '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.stroke();
            label(ctx, item.type, x + 18, y + 20, 15, 900, '#1d4ed8', 'left');
            label(ctx, item.note, x + 18, y + 43, 11, 800, '#475569', 'left');
        });
        const active = STRUCTURAL_EXAMPLES.find((item) => item.type === activeLeafRef.current) ?? STRUCTURAL_EXAMPLES[0];
        label(ctx, active.example, W / 2, 690, 15, 900, '#0f172a');
        label(ctx, 'Tetrahedral complexes: no geometrical isomerism for unidentate ligands; relative positions are equivalent', 300, 540, 14, 900, '#6d28d9');
    }, []);

    useEffect(() => {
        const draw = (now: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            const last = lastRef.current ?? now;
            const dt = Math.min((now - last) / 1000, 0.1);
            lastRef.current = now;
            if (!pausedRef.current) {
                timeRef.current += dt * speedRef.current;
                if (autoRotateRef.current && !draggingRef.current) rotationRef.current.y += 0.6 * dt * speedRef.current;
                if (superimposeRef.current > 0) superimposeRef.current = Math.max(0, superimposeRef.current - dt * 0.65);
            }
            const currentMode = modeRef.current;
            if (currentMode === 'octa') drawOctaMode(ctx);
            else if (currentMode === 'chelate') drawChelateMode(ctx);
            else if (currentMode === 'facmer') drawFacMerMode(ctx);
            else if (currentMode === 'optical') drawOpticalMode(ctx);
            else if (currentMode === 'overview') drawOverviewMode(ctx);
            else drawSquareMode(ctx);
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
                    <h3 className="text-base font-extrabold text-slate-900">Mode Map</h3>
                    <p className="text-xs font-semibold text-slate-500">NCERT Sec 5.4 examples</p>
                    <div className="mt-2 space-y-1.5">
                        {MODE_META.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setModeSafely(item.id)}
                                className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-left text-xs font-black ${mode === item.id ? 'border-violet-400 bg-violet-100 text-violet-950' : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                <span>{item.label}</span>
                                <span>{item.chip}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Canonical Complexes</h3>
                    <div className="mt-2 space-y-1.5 text-xs font-bold text-slate-700">
                        {[
                            '[Pt(NH₃)₂Cl₂] · cis/trans',
                            '[Co(NH₃)₄Cl₂]⁺ · cis/trans',
                            '[Fe(NH₃)₂(CN)₄]⁻ · Example 5.5',
                            '[CoCl₂(en)₂] · cis chiral',
                            'cis-[PtCl₂(en)₂]²⁺ · Fig 5.7',
                            'cis-[CrCl₂(ox)₂]³⁻ · Example 5.6',
                            '[Co(NH₃)₃(NO₂)₃] · fac/mer',
                            '[Co(en)₃]³⁺ · d/l'
                        ].map((item) => (
                            <div key={item} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">{item}</div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Structural Types</h3>
                    <p className="text-xs font-semibold text-slate-500">Shown for context; interactive focus is stereoisomerism</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {STRUCTURAL_EXAMPLES.map((item) => (
                            <button
                                key={item.type}
                                onClick={() => {
                                    setActiveLeaf(item.type);
                                    setModeSafely('overview');
                                }}
                                className={`rounded-lg border px-2 py-1.5 text-xs font-black ${activeLeaf === item.type ? 'border-blue-400 bg-blue-50 text-blue-900' : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                {item.type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    ), [activeLeaf, mode, setModeSafely]);

    const valuesPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="flex items-start gap-2">
                        <FlaskConical size={19} className="mt-0.5 text-violet-800" />
                        <div>
                            <h3 className="text-base font-extrabold text-violet-950">Stereoisomerism</h3>
                            <p className="text-xs font-semibold text-violet-700">NCERT Class 12 · Coordination Compounds Sec 5.4</p>
                        </div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-violet-950">
                        <p>Isomers: same formula, different arrangement of atoms.</p>
                        <p>Stereoisomers: same formula and same bonds, different spatial arrangement.</p>
                        <p>Structural isomers: same formula, different bonds.</p>
                        <p>Geometrical isomerism: cis/trans and fac/mer.</p>
                        <p>Optical isomerism: non-superimposable mirror images, called enantiomers.</p>
                        <p>Dextro d rotates polarised light right (+α); laevo l rotates left (−α), equal magnitude.</p>
                        <p>Common in octahedral complexes with bidentate ligands.</p>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Mode', value: selectedMeta.chip, tint: 'bg-violet-50', color: 'text-violet-700' },
                            { label: 'Subtype', value: subType, tint: 'bg-cyan-50', color: 'text-cyan-700' },
                            { label: 'Isomer count', value: isomerCount, tint: 'bg-amber-50', color: 'text-amber-700' },
                            { label: 'Mirror image', value: showMirror ? 'visible' : 'hidden', tint: 'bg-slate-50', color: 'text-slate-800' },
                            { label: 'Rotation', value: `${rotationRef.current.y.toFixed(2)} rad`, tint: 'bg-blue-50', color: 'text-blue-700' }
                        ].map((row) => (
                            <div key={row.label} className={`rounded-lg border border-slate-100 ${row.tint} px-3 py-2.5`}>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                                <div className={`mt-1 font-mono text-base font-extrabold ${row.color}`}>{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">NCERT Hint</h3>
                    <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">{ncertHint}</p>
                    <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">Tetrahedral complexes with unidentate ligands show no geometrical isomerism because relative positions are equivalent.</p>
                </div>
            </div>
        </aside>
    ), [isomerCount, ncertHint, selectedMeta.chip, showMirror, subType, dragTick]);

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
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

    const controls = (
        <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="rounded-lg bg-violet-100 p-2 text-violet-700">
                        <Atom size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">Coordination Stereoisomerism Bench</div>
                        <div className="text-[11px] font-black text-violet-700">{selectedMeta.chip}</div>
                    </div>
                </div>
                <button
                    onClick={attemptSuperimpose}
                    className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"
                    title="Try to superimpose"
                >
                    <ArrowLeftRight size={16} />
                </button>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
                {MODE_META.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setModeSafely(item.id)}
                        className={`flex min-h-[40px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-black transition ${mode === item.id ? 'border-violet-400 bg-violet-100 text-violet-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </div>
            {mode !== 'overview' && (
                <div className="grid grid-cols-2 gap-2">
                    {(mode === 'facmer' ? ['fac', 'mer'] : mode === 'optical' ? ['delta', 'lambda'] : ['cis', 'trans']).map((item) => (
                        <button
                            key={item}
                            onClick={() => setSubType(item as SubType)}
                            className={`rounded-lg border px-2 py-2 text-xs font-black ${subType === item ? 'border-cyan-400 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            {item === 'delta' ? 'Δ (dextro)' : item === 'lambda' ? 'Λ (laevo)' : item}
                        </button>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Speed</span>
                        <output>{speed.toFixed(1)}x</output>
                    </div>
                    <input className="w-full accent-violet-600" type="range" min={0.2} max={2.5} step={0.1} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
                </label>
                <div className="flex items-end">
                    <button
                        onClick={() => {
                            rotationRef.current = { x: -0.32, y: 0.36 };
                            setDragTick((value) => value + 1);
                        }}
                        className="flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50"
                    >
                        <RotateCcw size={14} />
                        Reset view
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
                <button onClick={() => setShowMirror((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showMirror ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show mirror image">
                    {showMirror ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} Mirror
                </button>
                <button onClick={() => setShowLabels((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showLabels ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show labels">
                    {showLabels ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} Labels
                </button>
                <button onClick={() => setShowAngles((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showAngles ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show angles">
                    <Layers size={15} className="mx-auto" /> Angles
                </button>
                <button onClick={() => setShowChelate((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showChelate ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Show chelate ring">
                    <Sparkles size={15} className="mx-auto" /> Ring
                </button>
                <button onClick={() => setAutoRotate((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${autoRotate ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500'}`} title="Auto rotate">
                    <RotateCw size={15} className="mx-auto" /> Auto
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

export default StereochemistryLab;
