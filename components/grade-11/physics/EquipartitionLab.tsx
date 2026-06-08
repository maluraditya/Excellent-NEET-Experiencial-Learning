import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Atom,
    Box,
    Eye,
    EyeOff,
    FlaskConical,
    Pause,
    Play,
    RotateCcw,
    Sparkles,
    Zap
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface EquipartitionLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'molecule' | 'bars' | 'tables' | 'solids' | 'example' | 'summary';
type GasId = 'He' | 'Ne' | 'Ar' | 'H2' | 'O2' | 'N2' | 'H2O' | 'CO' | 'CH4';
type UnitMode = 'molecule' | 'mole';

interface GasData {
    id: GasId;
    name: string;
    formula: string;
    color: string;
    atoms: Array<{ label: string; x: number; y: number; color: string; r: number }>;
    trans: number;
    rot: number;
    vibModes: number;
    defaultVib: boolean;
    type: 'monatomic' | 'diatomic' | 'triatomic' | 'polyatomic';
    measured?: { cv: number; cp: number; diff: number; gamma: number };
}

const W = 1280;
const H = 760;
const R = 8.314;
const KB = 1.38e-23;

const MODES: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
    { id: 'molecule', label: 'Molecule', icon: <Atom size={15} /> },
    { id: 'bars', label: 'Bars', icon: <Activity size={15} /> },
    { id: 'tables', label: 'Tables', icon: <Box size={15} /> },
    { id: 'solids', label: 'Solids', icon: <Sparkles size={15} /> },
    { id: 'example', label: 'Ex 12.8', icon: <FlaskConical size={15} /> },
    { id: 'summary', label: 'Summary', icon: <Zap size={15} /> }
];

const GASES: GasData[] = [
    { id: 'He', name: 'Helium', formula: 'He', color: '#d97706', atoms: [{ label: 'He', x: 0, y: 0, color: '#d97706', r: 34 }], trans: 3, rot: 0, vibModes: 0, defaultVib: false, type: 'monatomic', measured: { cv: 12.5, cp: 20.8, diff: 8.30, gamma: 1.66 } },
    { id: 'Ne', name: 'Neon', formula: 'Ne', color: '#f59e0b', atoms: [{ label: 'Ne', x: 0, y: 0, color: '#f59e0b', r: 34 }], trans: 3, rot: 0, vibModes: 0, defaultVib: false, type: 'monatomic', measured: { cv: 12.7, cp: 20.8, diff: 8.12, gamma: 1.64 } },
    { id: 'Ar', name: 'Argon', formula: 'Ar', color: '#f97316', atoms: [{ label: 'Ar', x: 0, y: 0, color: '#f97316', r: 34 }], trans: 3, rot: 0, vibModes: 0, defaultVib: false, type: 'monatomic', measured: { cv: 12.5, cp: 20.8, diff: 8.30, gamma: 1.67 } },
    { id: 'H2', name: 'Hydrogen', formula: 'H₂', color: '#94a3b8', atoms: [{ label: 'H', x: -62, y: 0, color: '#cbd5e1', r: 24 }, { label: 'H', x: 62, y: 0, color: '#cbd5e1', r: 24 }], trans: 3, rot: 2, vibModes: 1, defaultVib: false, type: 'diatomic', measured: { cv: 20.4, cp: 28.8, diff: 8.45, gamma: 1.41 } },
    { id: 'O2', name: 'Oxygen', formula: 'O₂', color: '#ef4444', atoms: [{ label: 'O', x: -62, y: 0, color: '#ef4444', r: 28 }, { label: 'O', x: 62, y: 0, color: '#ef4444', r: 28 }], trans: 3, rot: 2, vibModes: 1, defaultVib: false, type: 'diatomic', measured: { cv: 21.0, cp: 29.3, diff: 8.32, gamma: 1.40 } },
    { id: 'N2', name: 'Nitrogen', formula: 'N₂', color: '#3b82f6', atoms: [{ label: 'N', x: -62, y: 0, color: '#3b82f6', r: 28 }, { label: 'N', x: 62, y: 0, color: '#3b82f6', r: 28 }], trans: 3, rot: 2, vibModes: 1, defaultVib: false, type: 'diatomic', measured: { cv: 20.8, cp: 29.1, diff: 8.32, gamma: 1.40 } },
    { id: 'H2O', name: 'Steam', formula: 'H₂O', color: '#0891b2', atoms: [{ label: 'O', x: 0, y: 0, color: '#ef4444', r: 30 }, { label: 'H', x: -72, y: 58, color: '#cbd5e1', r: 20 }, { label: 'H', x: 72, y: 58, color: '#cbd5e1', r: 20 }], trans: 3, rot: 3, vibModes: 3, defaultVib: false, type: 'triatomic', measured: { cv: 27.0, cp: 35.4, diff: 8.35, gamma: 1.31 } },
    { id: 'CO', name: 'Carbon monoxide', formula: 'CO', color: '#7c3aed', atoms: [{ label: 'C', x: -58, y: 0, color: '#0f172a', r: 27 }, { label: 'O', x: 58, y: 0, color: '#ef4444', r: 28 }], trans: 3, rot: 2, vibModes: 1, defaultVib: true, type: 'diatomic' },
    { id: 'CH4', name: 'Methane', formula: 'CH₄', color: '#16a34a', atoms: [{ label: 'C', x: 0, y: 0, color: '#0f172a', r: 30 }, { label: 'H', x: -78, y: -55, color: '#cbd5e1', r: 19 }, { label: 'H', x: 78, y: -55, color: '#cbd5e1', r: 19 }, { label: 'H', x: -72, y: 70, color: '#cbd5e1', r: 19 }, { label: 'H', x: 72, y: 70, color: '#cbd5e1', r: 19 }], trans: 3, rot: 3, vibModes: 9, defaultVib: false, type: 'polyatomic', measured: { cv: 27.1, cp: 35.4, diff: 8.36, gamma: 1.31 } }
];

const TABLE_12_1 = [
    { type: 'Monatomic', cv: 12.5, cp: 20.8, diff: 8.31, gamma: 1.67 },
    { type: 'Diatomic', cv: 20.8, cp: 29.1, diff: 8.31, gamma: 1.40 },
    { type: 'Triatomic', cv: 24.93, cp: 33.24, diff: 8.31, gamma: 1.33 }
];

const TABLE_12_2 = [
    { type: 'Monatomic', gas: 'He', cv: 12.5, cp: 20.8, diff: 8.30, gamma: 1.66 },
    { type: 'Monatomic', gas: 'Ne', cv: 12.7, cp: 20.8, diff: 8.12, gamma: 1.64 },
    { type: 'Monatomic', gas: 'Ar', cv: 12.5, cp: 20.8, diff: 8.30, gamma: 1.67 },
    { type: 'Diatomic', gas: 'H₂', cv: 20.4, cp: 28.8, diff: 8.45, gamma: 1.41 },
    { type: 'Diatomic', gas: 'O₂', cv: 21.0, cp: 29.3, diff: 8.32, gamma: 1.40 },
    { type: 'Diatomic', gas: 'N₂', cv: 20.8, cp: 29.1, diff: 8.32, gamma: 1.40 },
    { type: 'Triatomic', gas: 'H₂O', cv: 27.0, cp: 35.4, diff: 8.35, gamma: 1.31 },
    { type: 'Polyatomic', gas: 'CH₄', cv: 27.1, cp: 35.4, diff: 8.36, gamma: 1.31 }
];

const SOLIDS = [
    { element: 'Aluminium', symbol: 'Al', c: 24.4 },
    { element: 'Carbon', symbol: 'C', c: 6.1 },
    { element: 'Copper', symbol: 'Cu', c: 24.5 },
    { element: 'Lead', symbol: 'Pb', c: 26.5 },
    { element: 'Silver', symbol: 'Ag', c: 25.5 },
    { element: 'Tungsten', symbol: 'W', c: 24.9 }
];

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function getDof(gas: GasData, includeVib: boolean) {
    const vib = includeVib && gas.vibModes > 0 ? gas.vibModes * 2 : 0;
    return {
        trans: gas.trans,
        rot: gas.rot,
        vib,
        total: gas.trans + gas.rot + vib
    };
}

function thermo(f: number, temperature: number) {
    const cv = (f / 2) * R;
    const cp = cv + R;
    return {
        u: (f / 2) * R * temperature,
        cv,
        cp,
        gamma: cp / cv
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

function background(ctx: CanvasRenderingContext2D) {
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

function atom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, text: string) {
    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    label(ctx, text, x, y, Math.max(10, r * 0.55), 900, text === 'C' ? '#ffffff' : '#0f172a');
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, dashed = false) {
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

function spring(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, coils = 9) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 1; i <= coils * 2; i += 1) {
        const x = (i / (coils * 2)) * len;
        const y = (i % 2 === 0 ? -7 : 7);
        ctx.lineTo(x, y);
    }
    ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.restore();
}

const EquipartitionLab: React.FC<EquipartitionLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const lastRef = useRef<number>();
    const timeRef = useRef(0);
    const displayRef = useRef({ u: 0, cv: 0, cp: 0, gamma: 1 });

    const [mode, setMode] = useState<Mode>('molecule');
    const [gasId, setGasId] = useState<GasId>('O2');
    const [temperature, setTemperature] = useState(300);
    const [includeVib, setIncludeVib] = useState(false);
    const [unitMode, setUnitMode] = useState<UnitMode>('mole');
    const [showArrows, setShowArrows] = useState(true);
    const [showTerms, setShowTerms] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [solid, setSolid] = useState('Al');
    const [deltaT, setDeltaT] = useState(15);

    const modeRef = useRef(mode);
    const gasRef = useRef(gasId);
    const tempRef = useRef(temperature);
    const vibRef = useRef(includeVib);
    const unitRef = useRef(unitMode);
    const showArrowsRef = useRef(showArrows);
    const showTermsRef = useRef(showTerms);
    const pausedRef = useRef(paused);
    const speedRef = useRef(speed);
    const solidRef = useRef(solid);
    const deltaTRef = useRef(deltaT);

    const activeGas = GASES.find((gas) => gas.id === gasId) ?? GASES[4];
    const activeDof = getDof(activeGas, includeVib);
    const activeThermo = thermo(activeDof.total, temperature);
    const halfUnit = unitMode === 'mole' ? 0.5 * R * temperature : 0.5 * KB * temperature;

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { gasRef.current = gasId; }, [gasId]);
    useEffect(() => { tempRef.current = temperature; }, [temperature]);
    useEffect(() => { vibRef.current = includeVib; }, [includeVib]);
    useEffect(() => { unitRef.current = unitMode; }, [unitMode]);
    useEffect(() => { showArrowsRef.current = showArrows; }, [showArrows]);
    useEffect(() => { showTermsRef.current = showTerms; }, [showTerms]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { solidRef.current = solid; }, [solid]);
    useEffect(() => { deltaTRef.current = deltaT; }, [deltaT]);

    const handleReset = useCallback(() => {
        setMode('molecule');
        setGasId('O2');
        setTemperature(300);
        setIncludeVib(false);
        setUnitMode('mole');
        setShowArrows(true);
        setShowTerms(true);
        setPaused(false);
        setSpeed(1);
        setSolid('Al');
        setDeltaT(15);
        timeRef.current = 0;
    }, []);

    const drawMoleculeAt = useCallback((ctx: CanvasRenderingContext2D, gas: GasData, cx: number, cy: number, t: number, temp: number, scale = 1) => {
        const vib = vibRef.current && gas.vibModes > 0;
        const tempScale = Math.sqrt(temp / 300);
        const rot = t * 1.6 * tempScale;
        const vibAmp = vib ? Math.sin(t * 6) * 20 * tempScale : 0;
        const atoms = gas.atoms.map((a) => {
            let x = a.x;
            let y = a.y;
            if (gas.type === 'diatomic') {
                const sign = a.x < 0 ? -1 : 1;
                x += sign * vibAmp;
            } else if (gas.id === 'H2O' && a.label === 'H') {
                y += Math.sin(t * 6 + a.x * 0.02) * 10 * tempScale;
            } else if (gas.id === 'CH4' && a.label === 'H') {
                x += Math.sin(t * 6 + a.y * 0.02) * 8 * tempScale;
                y += Math.cos(t * 6 + a.x * 0.02) * 8 * tempScale;
            }
            const rx = x * Math.cos(rot) - y * Math.sin(rot);
            const ry = x * Math.sin(rot) + y * Math.cos(rot);
            return { ...a, sx: cx + rx * scale, sy: cy + ry * scale };
        });

        ctx.lineCap = 'round';
        if (gas.atoms.length > 1) {
            for (let i = 1; i < atoms.length; i += 1) {
                if (vib && gas.type === 'diatomic') spring(ctx, atoms[0].sx, atoms[0].sy, atoms[i].sx, atoms[i].sy);
                else {
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 5 * scale;
                    ctx.beginPath();
                    ctx.moveTo(atoms[0].sx, atoms[0].sy);
                    ctx.lineTo(atoms[i].sx, atoms[i].sy);
                    ctx.stroke();
                }
            }
        }
        atoms.forEach((a) => atom(ctx, a.sx, a.sy, a.r * scale, a.color, a.label));

        if (showArrowsRef.current) {
            arrow(ctx, cx - 150 * scale, cy - 135 * scale, cx - 70 * scale, cy - 135 * scale, '#16a34a');
            arrow(ctx, cx - 150 * scale, cy - 135 * scale, cx - 150 * scale, cy - 55 * scale, '#16a34a');
            arrow(ctx, cx - 150 * scale, cy - 135 * scale, cx - 96 * scale, cy - 188 * scale, '#16a34a');
            label(ctx, '3 translational', cx - 115 * scale, cy - 215 * scale, 13, 900, '#16a34a');

            if (gas.rot > 0) {
                ctx.strokeStyle = '#d97706';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(cx, cy, 120 * scale, -0.8, 1.2);
                ctx.stroke();
                label(ctx, `${gas.rot} rotational`, cx + 140 * scale, cy - 112 * scale, 13, 900, '#d97706');
                if (gas.type === 'diatomic') label(ctx, 'bond axis: I≈0', cx + 118 * scale, cy + 135 * scale, 12, 900, '#64748b');
            }
            if (vib) label(ctx, 'vibration = KE + PE = 2 DOF', cx, cy + 190 * scale, 14, 900, '#dc2626');
        }
    }, []);

    const drawMoleculeMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const gas = GASES.find((item) => item.id === gasRef.current) ?? GASES[4];
        const temp = tempRef.current;
        background(ctx);
        label(ctx, 'Molecule: Degrees of Freedom', W / 2, 68, 29, 900);
        label(ctx, 'Each quadratic term contributes ½kBT per molecule or ½RT per mole', W / 2, 101, 15, 800, '#475569');

        roundRect(ctx, 95, 130, 560, 510, 26);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.stroke();
        for (let x = 125; x < 635; x += 40) {
            ctx.strokeStyle = 'rgba(15,23,42,0.04)';
            ctx.beginPath();
            ctx.moveTo(x, 150);
            ctx.lineTo(x, 620);
            ctx.stroke();
        }

        const tempNorm = clamp((temp - 100) / 900, 0, 1);
        const motionTime = timeRef.current * 0.85;
        const main = {
            x: 375 + Math.sin(motionTime) * (18 + tempNorm * 28) + Math.sin(motionTime * 0.43) * 10,
            y: 385 + Math.cos(motionTime * 0.8) * (14 + tempNorm * 24)
        };
        drawMoleculeAt(ctx, gas, main.x, main.y, timeRef.current, temp, 0.78);
        label(ctx, `${gas.name} (${gas.formula})`, 375, 665, 22, 900, gas.color);
        if (gas.type === 'diatomic') label(ctx, 'NCERT Fig 12.6: only two perpendicular rotation axes count', 375, 700, 14, 800, '#64748b');
    }, [drawMoleculeAt]);

    const drawBarsMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const gas = GASES.find((item) => item.id === gasRef.current) ?? GASES[4];
        const dof = getDof(gas, vibRef.current);
        const temp = tempRef.current;
        const halfRT = 0.5 * R * temp;
        background(ctx);
        label(ctx, 'Energy Bars: Count the Quadratic Terms', W / 2, 68, 29, 900);
        label(ctx, 'Maxwell equipartition: each DOF tile = ½RT per mole', W / 2, 101, 15, 800, '#475569');
        const groups = [
            { name: 'Trans', count: dof.trans, color: '#16a34a' },
            { name: 'Rot', count: dof.rot, color: '#d97706' },
            { name: 'Vib', count: dof.vib, color: '#dc2626' }
        ];
        groups.forEach((group, i) => {
            const x = 210 + i * 250;
            label(ctx, group.name, x, 165, 20, 900, group.color);
            for (let j = 0; j < group.count; j += 1) {
                roundRect(ctx, x - 62, 560 - j * 48, 124, 34, 8);
                ctx.fillStyle = group.color;
                ctx.globalAlpha = 0.85;
                ctx.fill();
                ctx.globalAlpha = 1;
                label(ctx, '½RT', x, 577 - j * 48, 13, 900, '#ffffff');
            }
            label(ctx, `${group.count} DOF`, x, 620, 16, 900, '#334155');
        });
        ctx.strokeStyle = '#475569';
        ctx.setLineDash([8, 7]);
        ctx.beginPath();
        ctx.moveTo(145, 560);
        ctx.lineTo(870, 560);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, `½RT = ${(halfRT / 1000).toFixed(2)} kJ mol⁻¹`, 900, 560, 14, 900, '#475569', 'left');
        roundRect(ctx, 985, 210, 170, 340, 18);
        ctx.fillStyle = '#e0f2fe';
        ctx.fill();
        ctx.strokeStyle = '#0891b2';
        ctx.stroke();
        label(ctx, 'Total U', 1070, 250, 20, 900, '#075985');
        label(ctx, `${(dof.total * halfRT / 1000).toFixed(2)}`, 1070, 370, 34, 900, '#0369a1');
        label(ctx, 'kJ mol⁻¹', 1070, 410, 16, 900, '#075985');
    }, []);

    function tableRow(ctx: CanvasRenderingContext2D, x: number, y: number, cols: string[], widths: number[], active = false) {
        roundRect(ctx, x, y, widths.reduce((a, b) => a + b, 0), 34, 8);
        ctx.fillStyle = active ? '#ede9fe' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();
        let cx = x;
        cols.forEach((col, i) => {
            label(ctx, col, cx + widths[i] / 2, y + 17, 12, i === 0 ? 900 : 800, active ? '#4c1d95' : '#334155');
            cx += widths[i];
        });
    }

    const drawTablesMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const gas = GASES.find((item) => item.id === gasRef.current) ?? GASES[4];
        background(ctx);
        label(ctx, 'NCERT Tables 12.1 and 12.2', W / 2, 62, 29, 900);
        label(ctx, 'Predicted values ignore vibrations; measured values show experiment', W / 2, 94, 15, 800, '#475569');
        const widths = [118, 86, 86, 86, 72];
        label(ctx, 'Table 12.1 Predicted', 350, 135, 18, 900, '#0f172a');
        tableRow(ctx, 120, 160, ['Gas type', 'Cv', 'Cp', 'Cp-Cv', 'γ'], widths, false);
        TABLE_12_1.forEach((row, i) => tableRow(ctx, 120, 202 + i * 40, [row.type, `${row.cv}`, `${row.cp}`, `${row.diff}`, `${row.gamma}`], widths, row.type.toLowerCase() === gas.type));
        label(ctx, 'Table 12.2 Measured', 350, 360, 18, 900, '#0f172a');
        tableRow(ctx, 95, 385, ['Type', 'Gas', 'Cv', 'Cp', 'Cp-Cv', 'γ'], [105, 60, 65, 65, 70, 55], false);
        TABLE_12_2.forEach((row, i) => tableRow(ctx, 95, 425 + i * 34, [row.type, row.gas, `${row.cv}`, `${row.cp}`, `${row.diff}`, `${row.gamma}`], [105, 60, 65, 65, 70, 55], row.gas.replace('₂', '2') === gas.id));
        label(ctx, 'γ comparison', 940, 150, 22, 900, '#0f172a');
        TABLE_12_2.forEach((row, i) => {
            const y = 190 + i * 54;
            label(ctx, row.gas, 780, y, 13, 900, '#334155', 'right');
            roundRect(ctx, 805, y - 12, 280 * (row.gamma / 1.75), 24, 8);
            ctx.fillStyle = row.gas.replace('₂', '2') === gas.id ? '#7c3aed' : '#94a3b8';
            ctx.fill();
            label(ctx, `${row.gamma}`, 1110, y, 13, 900, '#334155', 'left');
        });
        label(ctx, 'Cp − Cv = R holds for all ideal gases', 940, 675, 16, 900, '#16a34a');
    }, []);

    const drawSolidsMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const active = SOLIDS.find((item) => item.symbol === solidRef.current) ?? SOLIDS[0];
        background(ctx);
        label(ctx, 'Specific Heat of Solids: Dulong-Petit Law', W / 2, 66, 29, 900);
        label(ctx, 'Each atom oscillates in 3D: 3 dimensions × (KE + PE) → 3kBT per atom', W / 2, 100, 15, 800, '#475569');
        const startX = 190;
        const startY = 185;
        for (let i = 0; i < 6; i += 1) {
            for (let j = 0; j < 5; j += 1) {
                const x = startX + i * 82;
                const y = startY + j * 76;
                const wobble = Math.sin(timeRef.current * 8 + i + j) * (active.symbol === 'C' ? 4 : 12);
                if (i < 5) {
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + 82, y);
                    ctx.stroke();
                }
                if (j < 4) {
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + 76);
                    ctx.stroke();
                }
                atom(ctx, x + wobble, y - wobble * 0.4, 20, active.symbol === 'C' ? '#0f172a' : '#94a3b8', active.symbol);
            }
        }
        roundRect(ctx, 760, 160, 360, 210, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
        label(ctx, 'Dulong-Petit prediction', 940, 205, 20, 900);
        label(ctx, 'U = 3RT', 940, 255, 28, 900, '#7c3aed');
        label(ctx, 'C = 3R = 24.93 J mol⁻¹ K⁻¹', 940, 305, 18, 900, '#334155');
        label(ctx, `${active.element}: measured C = ${active.c}`, 940, 345, 17, 900, active.symbol === 'C' ? '#dc2626' : '#16a34a');
        SOLIDS.forEach((item, i) => {
            const x = 760 + (i % 2) * 190;
            const y = 430 + Math.floor(i / 2) * 70;
            roundRect(ctx, x, y, 165, 48, 12);
            ctx.fillStyle = item.symbol === active.symbol ? '#ede9fe' : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();
            label(ctx, `${item.symbol}  ${item.c}`, x + 82, y + 24, 15, 900, item.symbol === 'C' ? '#dc2626' : '#334155');
        });
    }, []);

    const drawExampleMode = useCallback((ctx: CanvasRenderingContext2D) => {
        const dT = deltaTRef.current;
        const q = 2 * (1.5 * R) * dT;
        background(ctx);
        label(ctx, 'NCERT Example 12.8: Helium Cylinder', W / 2, 66, 29, 900);
        label(ctx, '44.8 L at STP = 2 mol He; fixed volume heating', W / 2, 100, 15, 800, '#475569');
        roundRect(ctx, 210, 175, 360, 430, 42);
        ctx.fillStyle = '#eff6ff';
        ctx.fill();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 4;
        ctx.stroke();
        for (let i = 0; i < 26; i += 1) {
            const x = 245 + ((i * 53 + timeRef.current * 22) % 285);
            const y = 215 + ((i * 71 + timeRef.current * 16) % 335);
            atom(ctx, x, y, 13, '#d97706', 'He');
        }
        label(ctx, 'V = 44.8 L', 390, 635, 18, 900, '#1d4ed8');
        roundRect(ctx, 680, 175, 430, 430, 24);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
        label(ctx, `ΔT = ${dT} °C`, 895, 235, 26, 900, '#0f172a');
        label(ctx, 'Q = n Cv ΔT', 895, 300, 24, 900, '#7c3aed');
        label(ctx, `Q = 2 · (3/2)R · ${dT}`, 895, 355, 20, 900, '#334155');
        label(ctx, `Q = ${q.toFixed(0)} J`, 895, 430, 42, 900, '#16a34a');
        label(ctx, dT === 15 ? 'NCERT exact: 45R = 374 J' : 'Set ΔT = 15 °C for NCERT value', 895, 500, 17, 900, dT === 15 ? '#16a34a' : '#64748b');
    }, []);

    const drawSummaryMode = useCallback((ctx: CanvasRenderingContext2D) => {
        background(ctx);
        label(ctx, 'Summary: Atomicity → DOF → Specific Heat', W / 2, 62, 29, 900);
        const nodes = [
            ['GAS', 555, 130, 170, 50, '#ede9fe'],
            ['Monatomic\nHe, Ne, Ar\nf=3, γ=5/3=1.67', 100, 260, 290, 100, '#fff7ed'],
            ['Diatomic rigid\nH₂, O₂, N₂\nf=5, γ=7/5=1.40', 420, 260, 300, 100, '#eff6ff'],
            ['Diatomic + vibration\nCO at high T\nf=7, γ=9/7≈1.29', 760, 260, 330, 100, '#fef2f2'],
            ['Polyatomic\nH₂O, CH₄ predicted\nf=6, γ=1.33', 250, 470, 330, 100, '#ecfdf5'],
            ['Polyatomic + vibration\nCH₄, NH₃ at high T\nf>6, γ→1.0', 700, 470, 360, 100, '#f5f3ff']
        ];
        nodes.forEach(([text, x, y, w, h, color]) => {
            roundRect(ctx, Number(x), Number(y), Number(w), Number(h), 18);
            ctx.fillStyle = String(color);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.stroke();
            String(text).split('\n').forEach((line, i, arr) => label(ctx, line, Number(x) + Number(w) / 2, Number(y) + Number(h) / 2 + (i - (arr.length - 1) / 2) * 20, i === 0 ? 16 : 13, 900));
        });
        arrow(ctx, 640, 180, 245, 260, '#64748b');
        arrow(ctx, 640, 180, 570, 260, '#64748b');
        arrow(ctx, 640, 180, 925, 260, '#64748b');
        arrow(ctx, 570, 360, 415, 470, '#64748b');
        arrow(ctx, 925, 360, 880, 470, '#64748b');
        label(ctx, 'Maxwell first proved the law of equipartition of energy', W / 2, 680, 17, 900, '#7c3aed');
    }, []);

    useEffect(() => {
        const draw = (now: number) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;
            const last = lastRef.current ?? now;
            const dt = Math.min((now - last) / 1000, 0.1);
            lastRef.current = now;
            if (!pausedRef.current) timeRef.current += dt * speedRef.current;

            const gas = GASES.find((item) => item.id === gasRef.current) ?? GASES[4];
            const dof = getDof(gas, vibRef.current);
            const target = thermo(dof.total, tempRef.current);
            displayRef.current.u += (target.u - displayRef.current.u) * Math.min(1, dt * 6);
            displayRef.current.cv += (target.cv - displayRef.current.cv) * Math.min(1, dt * 6);
            displayRef.current.cp += (target.cp - displayRef.current.cp) * Math.min(1, dt * 6);
            displayRef.current.gamma += (target.gamma - displayRef.current.gamma) * Math.min(1, dt * 6);

            if (modeRef.current === 'bars') drawBarsMode(ctx);
            else if (modeRef.current === 'tables') drawTablesMode(ctx);
            else if (modeRef.current === 'solids') drawSolidsMode(ctx);
            else if (modeRef.current === 'example') drawExampleMode(ctx);
            else if (modeRef.current === 'summary') drawSummaryMode(ctx);
            else drawMoleculeMode(ctx);
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
                    <h3 className="text-base font-extrabold text-slate-900">DOF Breakdown</h3>
                    <p className="text-xs font-semibold text-slate-500">Each quadratic term is one degree of freedom</p>
                    {[
                        ['Translational', activeDof.trans, '#16a34a'],
                        ['Rotational', activeDof.rot, '#d97706'],
                        ['Vibrational', activeDof.vib, '#dc2626'],
                        ['Total', activeDof.total, '#7c3aed']
                    ].map(([name, value, color]) => (
                        <div key={String(name)} className="mt-2 rounded-lg border border-slate-100 bg-white px-3 py-2">
                            <div className="flex items-center justify-between text-sm font-black">
                                <span style={{ color: String(color) }}>{name}</span>
                                <span>{value as number}</span>
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-slate-100">
                                <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Number(value) * 12)}%`, backgroundColor: String(color) }} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">NCERT Table 12.1</h3>
                    <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 text-xs font-bold">
                        <div className="grid grid-cols-5 bg-slate-50 px-2 py-1.5 text-slate-700">
                            <span>Type</span><span>Cv</span><span>Cp</span><span>Cp-Cv</span><span>γ</span>
                        </div>
                        {TABLE_12_1.map((row) => (
                            <div key={row.type} className="grid grid-cols-5 px-2 py-1.5 text-slate-700">
                                <span>{row.type}</span><span>{row.cv}</span><span>{row.cp}</span><span>{row.diff}</span><span>{row.gamma}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">NCERT Table 12.3</h3>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs font-bold text-slate-700">
                        {SOLIDS.map((item) => (
                            <button key={item.symbol} onClick={() => setSolid(item.symbol)} className={`rounded-lg border px-2 py-1.5 ${solid === item.symbol ? 'border-violet-400 bg-violet-50 text-violet-900' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                                {item.symbol} {item.c}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    ), [activeDof, solid]);

    const valuesPanel = useMemo(() => {
        const hint = {
            molecule: 'Diatomic has 2 rotational DOF; rotation along the bond axis has I≈0 and is quantum forbidden.',
            bars: 'Each quadratic term = 1 DOF = ½RT per mole, as Maxwell equipartition states.',
            tables: 'Cp − Cv = R holds for all ideal gases.',
            solids: 'Dulong-Petit: C = 3R ≈ 24.93 J mol⁻¹ K⁻¹.',
            example: 'He, 2 mol, ΔT = 15 °C gives Q = 45R = 374 J.',
            summary: 'Atomicity determines DOF, which determines Cv, Cp and γ.'
        }[mode];
        return (
            <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
                <div className="flex flex-col gap-3">
                    <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl backdrop-blur">
                        <div className="flex items-start gap-2">
                            <FlaskConical size={19} className="mt-0.5 text-violet-800" />
                            <div>
                                <h3 className="text-base font-extrabold text-violet-950">Equipartition</h3>
                                <p className="text-xs font-semibold text-violet-700">NCERT Class 11 Physics · Sec 12.5-12.6</p>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-violet-950">
                            <p>Law first proved by Maxwell: each possible energy mode has average energy ½k_B T.</p>
                            <p>Per molecule: ½ k_B T. Per mole: ½ R T.</p>
                            <p>One translational or rotational DOF is one squared term.</p>
                            <p>One vibrational mode has KE + PE, so it contributes k_B T and 2 DOF.</p>
                            <p>U = (f/2)RT; Cv = (f/2)R; Cp = (f/2+1)R; γ = (f+2)/f.</p>
                            <p>Eqs 12.27-12.36 cover monatomic, diatomic, vibrational and polyatomic gases.</p>
                            <p>Polyatomic NCERT predictions ignore vibrations, giving f = 6 and γ = 1.33.</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                        </div>
                        <div className="mt-3 space-y-2">
                            {[
                                ['Gas', `${activeGas.formula} · f=${activeDof.total}`, 'bg-violet-50', 'text-violet-700'],
                                ['Temperature', `${temperature} K`, 'bg-red-50', 'text-red-700'],
                                ['U molar', `${(activeThermo.u / 1000).toFixed(2)} kJ`, 'bg-cyan-50', 'text-cyan-700'],
                                ['Cv', `${activeThermo.cv.toFixed(2)} J/mol·K`, 'bg-emerald-50', 'text-emerald-700'],
                                ['Cp', `${activeThermo.cp.toFixed(2)} J/mol·K`, 'bg-amber-50', 'text-amber-700'],
                                ['Gamma', activeThermo.gamma.toFixed(2), 'bg-slate-50', 'text-slate-800'],
                                [unitMode === 'mole' ? '½RT' : '½kBT', unitMode === 'mole' ? `${halfUnit.toFixed(0)} J/mol` : `${halfUnit.toExponential(2)} J`, 'bg-blue-50', 'text-blue-700']
                            ].map(([name, value, tint, color]) => (
                                <div key={String(name)} className={`rounded-lg border border-slate-100 ${tint} px-3 py-2.5`}>
                                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{name}</div>
                                    <div className={`mt-1 font-mono text-base font-extrabold ${color}`}>{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                        <h3 className="text-base font-extrabold text-slate-900">NCERT Hint</h3>
                        <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">{hint}</p>
                        <p className="mt-2 text-sm font-semibold leading-snug text-slate-700">Example 12.8: 44.8 L He at STP = 2 mol; ΔT = 15 °C, fixed V, Q = 374 J.</p>
                    </div>
                </div>
            </aside>
        );
    }, [activeDof.total, activeGas.formula, activeThermo, halfUnit, mode, temperature, unitMode]);

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
            <div className="flex items-center gap-2">
                <div className="rounded-lg bg-violet-100 p-2 text-violet-700">
                    <Activity size={18} />
                </div>
                <div>
                    <div className="text-sm font-black text-slate-900">Equipartition Bench</div>
                    <div className="text-[11px] font-bold text-slate-500">{mode}</div>
                </div>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
                {MODES.map((item) => (
                    <button key={item.id} onClick={() => setMode(item.id)} className={`flex min-h-[40px] flex-col items-center justify-center gap-0.5 rounded-lg border text-[10px] font-black ${mode === item.id ? 'border-violet-400 bg-violet-100 text-violet-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-9 gap-1">
                {GASES.map((gas) => (
                    <button key={gas.id} onClick={() => setGasId(gas.id)} className={`min-h-[30px] rounded-md border text-[10px] font-black ${gasId === gas.id ? 'border-violet-400 bg-violet-100 text-violet-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {gas.formula}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Temperature</span>
                        <output>{temperature} K</output>
                    </div>
                    <input className="w-full accent-red-600" type="range" min={100} max={1000} step={5} value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} />
                </label>
                <label className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Speed</span>
                        <output>{speed.toFixed(1)}x</output>
                    </div>
                    <input className="w-full accent-violet-600" type="range" min={0.3} max={2} step={0.1} value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
                </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>Example ΔT</span>
                        <output>{deltaT} °C</output>
                    </div>
                    <input className="w-full accent-emerald-600" type="range" min={0} max={30} step={1} value={deltaT} onChange={(event) => setDeltaT(Number(event.target.value))} />
                </label>
                <label className="space-y-1">
                    <span className="text-xs font-black text-slate-700">Unit</span>
                    <select value={unitMode} onChange={(event) => setUnitMode(event.target.value as UnitMode)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-800">
                        <option value="mole">per mole</option>
                        <option value="molecule">per molecule</option>
                    </select>
                </label>
            </div>
            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setIncludeVib((value) => !value)} disabled={activeGas.vibModes === 0} className={`rounded-lg border p-2 text-xs font-black ${includeVib ? 'border-red-300 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-500'} disabled:opacity-40`}>
                    <Sparkles size={15} className="mx-auto" /> Vib
                </button>
                <button onClick={() => setShowArrows((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showArrows ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`}>
                    {showArrows ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} Arrows
                </button>
                <button onClick={() => setShowTerms((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showTerms ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500'}`}>
                    <Box size={15} className="mx-auto" /> Terms
                </button>
                <button onClick={handleReset} className="rounded-lg border border-slate-200 bg-white p-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                    <RotateCcw size={15} className="mx-auto" /> Reset
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

export default EquipartitionLab;
