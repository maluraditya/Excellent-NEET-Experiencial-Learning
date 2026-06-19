import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atom, Layers, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PeriodicTrendsExplorerLabProps {
    topic: any;
    onExit: () => void;
}

type Lens = 'radius' | 'ie' | 'en' | 'metallic';
type View = 'table' | 'iso';
type HL = 'off' | 'p2' | 'p3' | 'g1' | 'g17';
type RadiusKind = 'atom' | 'ion';

interface Elem {
    sym: string;
    name: string;
    z: number;
    row: number; // grid row (1..6)
    col: number; // grid col (1..18 short-form), we use 1..18 but only some cells used
    radius?: number;          // pm — NCERT
    en?: number;              // Pauling — NCERT
    ieRank?: number;          // 1..7 across period (qualitative), undefined for unknown
    group: number;
    period: number;
}

// NCERT §3.7.1, Tables 3.6(a/b) and 3.8(a/b)
const ELEMENTS: Elem[] = [
    { sym: 'H',  name: 'Hydrogen',  z: 1,  row: 1, col: 1,  group: 1,  period: 1 },
    { sym: 'He', name: 'Helium',    z: 2,  row: 1, col: 18, group: 18, period: 1 },

    { sym: 'Li', name: 'Lithium',   z: 3,  row: 2, col: 1,  radius: 152, en: 1.0, ieRank: 1, group: 1,  period: 2 },
    { sym: 'Be', name: 'Beryllium', z: 4,  row: 2, col: 2,  radius: 111, en: 1.5, ieRank: 2, group: 2,  period: 2 },
    { sym: 'B',  name: 'Boron',     z: 5,  row: 2, col: 13, radius: 88,  en: 2.0, ieRank: 3, group: 13, period: 2 },
    { sym: 'C',  name: 'Carbon',    z: 6,  row: 2, col: 14, radius: 77,  en: 2.5, ieRank: 4, group: 14, period: 2 },
    { sym: 'N',  name: 'Nitrogen',  z: 7,  row: 2, col: 15, radius: 74,  en: 3.0, ieRank: 5, group: 15, period: 2 },
    { sym: 'O',  name: 'Oxygen',    z: 8,  row: 2, col: 16, radius: 66,  en: 3.5, ieRank: 6, group: 16, period: 2 },
    { sym: 'F',  name: 'Fluorine',  z: 9,  row: 2, col: 17, radius: 64,  en: 4.0, ieRank: 7, group: 17, period: 2 },
    { sym: 'Ne', name: 'Neon',      z: 10, row: 2, col: 18, group: 18, period: 2 },

    { sym: 'Na', name: 'Sodium',    z: 11, row: 3, col: 1,  radius: 186, en: 0.9, ieRank: 1, group: 1,  period: 3 },
    { sym: 'Mg', name: 'Magnesium', z: 12, row: 3, col: 2,  radius: 160, en: 1.2, ieRank: 2, group: 2,  period: 3 },
    { sym: 'Al', name: 'Aluminium', z: 13, row: 3, col: 13, radius: 143, en: 1.5, ieRank: 3, group: 13, period: 3 },
    { sym: 'Si', name: 'Silicon',   z: 14, row: 3, col: 14, radius: 117, en: 1.8, ieRank: 4, group: 14, period: 3 },
    { sym: 'P',  name: 'Phosphorus',z: 15, row: 3, col: 15, radius: 110, en: 2.1, ieRank: 5, group: 15, period: 3 },
    { sym: 'S',  name: 'Sulfur',    z: 16, row: 3, col: 16, radius: 104, en: 2.5, ieRank: 6, group: 16, period: 3 },
    { sym: 'Cl', name: 'Chlorine',  z: 17, row: 3, col: 17, radius: 99,  en: 3.0, ieRank: 7, group: 17, period: 3 },
    { sym: 'Ar', name: 'Argon',     z: 18, row: 3, col: 18, group: 18, period: 3 },

    { sym: 'K',  name: 'Potassium', z: 19, row: 4, col: 1,  radius: 231, en: 0.8, group: 1,  period: 4 },
    { sym: 'Br', name: 'Bromine',   z: 35, row: 4, col: 17, radius: 114, en: 2.8, group: 17, period: 4 },
    { sym: 'Rb', name: 'Rubidium',  z: 37, row: 5, col: 1,  radius: 244, en: 0.8, group: 1,  period: 5 },
    { sym: 'I',  name: 'Iodine',    z: 53, row: 5, col: 17, radius: 133, en: 2.5, group: 17, period: 5 },
    { sym: 'Cs', name: 'Caesium',   z: 55, row: 6, col: 1,  radius: 262, en: 0.7, group: 1,  period: 6 },
    { sym: 'At', name: 'Astatine',  z: 85, row: 6, col: 17, radius: 140, en: 2.2, group: 17, period: 6 }
];

// Ionic radii (pm) — NCERT-listed values only
const ION_RADIUS: Record<string, { value: number; charge: string }> = {
    'Na': { value: 95,  charge: '+' },
    'F':  { value: 136, charge: '−' }
};

// Isoelectronic species (10 e⁻) — NCERT §3.7.1(b)
const ISO_SPECIES = [
    { label: 'O²⁻',  z: 8,  r: 140, color: '#dc2626' },
    { label: 'F⁻',   z: 9,  r: 136, color: '#d97706' },
    { label: 'Na⁺',  z: 11, r: 95,  color: '#0891b2' },
    { label: 'Mg²⁺', z: 12, r: 65,  color: '#6d28d9' }
];

const W = 1280;
const H = 760;

const LENS_META: Record<Lens, { label: string; unit: string; trendAcross: string; trendDown: string; explain: string; lo: string; hi: string }> = {
    radius: {
        label: 'Atomic / Ionic Radius',
        unit: 'pm',
        trendAcross: 'Decreases ← → across period',
        trendDown: 'Increases ↓ down group',
        explain: 'Across a period nuclear charge ↑ but the shell is the same — electrons are pulled closer. Down a group, new shells push the outermost electrons farther out.',
        lo: '#1d4ed8', hi: '#dc2626'
    },
    ie: {
        label: 'Ionisation Enthalpy',
        unit: 'qualitative',
        trendAcross: 'Increases ← → across period',
        trendDown: 'Decreases ↓ down group',
        explain: 'X(g) → X⁺(g) + e⁻. As radius shrinks across a period, more energy is needed to remove an electron. Down a group, the outer electron is farther and easier to remove.',
        lo: '#0e7490', hi: '#b91c1c'
    },
    en: {
        label: 'Electronegativity (Pauling)',
        unit: 'Pauling',
        trendAcross: 'Increases ← → across period',
        trendDown: 'Decreases ↓ down group',
        explain: 'Electronegativity is the tendency of an atom in a bond to attract shared electrons. Smaller radius + higher nuclear charge → stronger pull.',
        lo: '#fde68a', hi: '#6d28d9'
    },
    metallic: {
        label: 'Metallic Character',
        unit: '∝ (4.1 − EN)',
        trendAcross: 'Decreases ← → across period',
        trendDown: 'Increases ↓ down group',
        explain: 'Electronegativity is inversely related to metallic character. Low EN = easy electron loss = metallic.',
        lo: '#e5e7eb', hi: '#16a34a'
    }
};

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function hexToRgb(h: string) {
    const x = h.replace('#', '');
    return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
}
function rgbToCss([r, g, b]: number[]) { return `rgb(${r|0},${g|0},${b|0})`; }
function mix(loHex: string, hiHex: string, t: number) {
    const lo = hexToRgb(loHex), hi = hexToRgb(hiHex);
    return rgbToCss([lerp(lo[0], hi[0], t), lerp(lo[1], hi[1], t), lerp(lo[2], hi[2], t)]);
}

function lensValue(e: Elem, lens: Lens, radiusKind: RadiusKind): number | null {
    if (lens === 'radius') {
        if (radiusKind === 'ion') {
            const ion = ION_RADIUS[e.sym];
            return ion ? ion.value : null;
        }
        return e.radius ?? null;
    }
    if (lens === 'en') return e.en ?? null;
    if (lens === 'metallic') return e.en !== undefined ? +(4.1 - e.en).toFixed(2) : null;
    if (lens === 'ie') return e.ieRank ?? null;
    return null;
}

function lensRange(lens: Lens, radiusKind: RadiusKind): [number, number] {
    if (lens === 'radius') return radiusKind === 'ion' ? [60, 140] : [60, 270];
    if (lens === 'en') return [0.5, 4.2];
    if (lens === 'metallic') return [0.1, 3.7];
    if (lens === 'ie') return [1, 7];
    return [0, 1];
}

const PeriodicTrendsExplorerLab: React.FC<PeriodicTrendsExplorerLabProps> = ({ topic, onExit }) => {
    const [lens, setLens] = useState<Lens>('radius');
    const [view, setView] = useState<View>('table');
    const [highlight, setHighlight] = useState<HL>('off');
    const [radiusKind, setRadiusKind] = useState<RadiusKind>('atom');
    const [selectedSym, setSelectedSym] = useState<string>('Na');
    const [paused, setPaused] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | undefined>(undefined);
    const hoverRef = useRef<{ x: number; y: number } | null>(null);
    const animRef = useRef(0);
    const clockRef = useRef(0);       // seconds, advances only while running
    const transRef = useRef(1);       // 0→1 entrance transition on lens/view change
    const lastTsRef = useRef<number | undefined>(undefined);

    const selected = useMemo(() => ELEMENTS.find(e => e.sym === selectedSym) || ELEMENTS[10], [selectedSym]);
    const meta = LENS_META[lens];

    const handleReset = useCallback(() => {
        setLens('radius'); setView('table'); setHighlight('off'); setRadiusKind('atom'); setSelectedSym('Na');
    }, []);

    // Tile layout — short-form periodic table.
    // 18 columns must fit inside W=1280 with room for the P-labels (left) and the
    // down-group arrow (right): 64 + 18*(58+4) − 4 = 1176, arrow ends ≈ 1232 < 1280.
    const tableRect = { x: 64, y: 116, cellW: 58, cellH: 58, gap: 4 };

    const tileXY = useCallback((row: number, col: number) => {
        const x = tableRect.x + (col - 1) * (tableRect.cellW + tableRect.gap);
        const y = tableRect.y + (row - 1) * (tableRect.cellH + tableRect.gap);
        return { x, y };
    }, []);

    const onCanvasClick = useCallback((ev: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width) * W;
        const y = ((ev.clientY - rect.top) / rect.height) * H;
        if (view !== 'table') return;
        for (const e of ELEMENTS) {
            const { x: tx, y: ty } = tileXY(e.row, e.col);
            if (x >= tx && x <= tx + tableRect.cellW && y >= ty && y <= ty + tableRect.cellH) {
                setSelectedSym(e.sym);
                return;
            }
        }
    }, [view, tileXY]);

    const onCanvasMove = useCallback((ev: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        hoverRef.current = {
            x: ((ev.clientX - rect.left) / rect.width) * W,
            y: ((ev.clientY - rect.top) / rect.height) * H
        };
    }, []);

    // Restart the entrance transition whenever the lens / view / radius kind changes
    useEffect(() => { transRef.current = 0; }, [lens, view, radiusKind]);

    // Draw loop
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        lastTsRef.current = undefined;
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

        const drawTile = (e: Elem, tp: number) => {
            const { x, y } = tileXY(e.row, e.col);
            const v = lensValue(e, lens, radiusKind);
            const [lo, hi] = lensRange(lens, radiusKind);
            let bg = '#f1f5f9';
            let txt = '#94a3b8';
            let scale = 1;
            if (v !== null) {
                const t = clamp((v - lo) / (hi - lo), 0, 1);
                bg = mix(meta.lo, meta.hi, t);
                txt = '#0f172a';
                if (lens === 'radius') {
                    // Tile size visually scales with radius (60% .. 100%)
                    scale = 0.6 + 0.4 * t;
                }
            }
            // Entrance transition: tiles ripple in (scale + fade), staggered by column
            const stagger = clamp(tp * 1.25 - e.col * 0.018, 0, 1);
            const entrance = 0.88 + 0.12 * stagger;
            scale *= entrance;
            const cw = tableRect.cellW * scale;
            const ch = tableRect.cellH * scale;
            const dx = x + (tableRect.cellW - cw) / 2;
            const dy = y + (tableRect.cellH - ch) / 2;

            const isSelected = e.sym === selectedSym;
            // Pulsing ring behind the selected tile
            if (isSelected && v !== null) {
                const pulse = 0.5 + 0.5 * Math.sin(clockRef.current * 3);
                ctx.save();
                ctx.strokeStyle = '#0f172a';
                ctx.globalAlpha = 0.18 + 0.22 * pulse;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(dx - 5 - 3 * pulse, dy - 5 - 3 * pulse, cw + 10 + 6 * pulse, ch + 10 + 6 * pulse, 11);
                ctx.stroke();
                ctx.restore();
            }

            // Highlight stripe
            let borderColor = '#cbd5e1'; let borderWidth = 1.5;
            if (highlight === 'p2' && e.period === 2) { borderColor = '#0891b2'; borderWidth = 3; }
            if (highlight === 'p3' && e.period === 3) { borderColor = '#0891b2'; borderWidth = 3; }
            if (highlight === 'g1' && e.group === 1)  { borderColor = '#d97706'; borderWidth = 3; }
            if (highlight === 'g17' && e.group === 17){ borderColor = '#d97706'; borderWidth = 3; }
            if (isSelected) { borderColor = '#0f172a'; borderWidth = 4; }

            ctx.save();
            ctx.globalAlpha = 0.35 + 0.65 * stagger;
            ctx.fillStyle = bg;
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = borderWidth;
            ctx.beginPath();
            ctx.roundRect(dx, dy, cw, ch, 8);
            ctx.fill(); ctx.stroke();
            ctx.restore();

            // Z (top-left)
            ctx.fillStyle = txt === '#0f172a' ? '#475569' : '#94a3b8';
            ctx.font = '700 9px ui-sans-serif, system-ui';
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(String(e.z), dx + 5, dy + 4);

            // Symbol (center)
            ctx.fillStyle = txt;
            ctx.font = '900 22px ui-sans-serif, system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(e.sym, dx + cw / 2, dy + ch / 2 - 2);

            // Value (bottom)
            if (v !== null) {
                ctx.font = '700 10px ui-mono, monospace';
                ctx.textBaseline = 'bottom';
                const display = lens === 'ie' ? `rank ${v}` : v.toString();
                ctx.fillText(display, dx + cw / 2, dy + ch - 4);
            }
        };

        const drawPeriodicTable = (tp: number) => {
            // Faint stripe
            if (highlight !== 'off') {
                ctx.fillStyle = 'rgba(8,145,178,0.06)';
                if (highlight === 'p2') {
                    const { y } = tileXY(2, 1);
                    ctx.fillRect(tableRect.x - 6, y - 6, 18 * (tableRect.cellW + tableRect.gap) - tableRect.gap + 12, tableRect.cellH + 12);
                }
                if (highlight === 'p3') {
                    const { y } = tileXY(3, 1);
                    ctx.fillRect(tableRect.x - 6, y - 6, 18 * (tableRect.cellW + tableRect.gap) - tableRect.gap + 12, tableRect.cellH + 12);
                }
                if (highlight === 'g1') {
                    const { x } = tileXY(1, 1);
                    ctx.fillRect(x - 6, tableRect.y - 6, tableRect.cellW + 12, 6 * (tableRect.cellH + tableRect.gap) - tableRect.gap + 12);
                }
                if (highlight === 'g17') {
                    const { x } = tileXY(1, 17);
                    ctx.fillRect(x - 6, tableRect.y - 6, tableRect.cellW + 12, 6 * (tableRect.cellH + tableRect.gap) - tableRect.gap + 12);
                }
            }

            for (const e of ELEMENTS) drawTile(e, tp);

            // Period and Group labels
            ctx.fillStyle = '#94a3b8';
            ctx.font = '700 11px ui-sans-serif, system-ui';
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            for (let p = 1; p <= 6; p++) {
                const { y } = tileXY(p, 1);
                ctx.fillText('P ' + p, tableRect.x - 10, y + tableRect.cellH / 2);
            }
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            for (let g of [1, 2, 13, 14, 15, 16, 17, 18]) {
                const { x } = tileXY(1, g);
                ctx.fillText('G' + g, x + tableRect.cellW / 2, tableRect.y - 6);
            }

            // Direction arrows — dashes flow in the trend direction to convey motion
            const flow = clockRef.current * 22;
            const tableRightX = tableRect.x + 18 * (tableRect.cellW + tableRect.gap) - tableRect.gap;
            const tableBottomY = tableRect.y + 6 * (tableRect.cellH + tableRect.gap) - tableRect.gap;

            // Across arrow under the table (flowing left → right)
            const arrowY = tableBottomY + 34;
            ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.lineDashOffset = -flow;
            ctx.beginPath();
            ctx.moveTo(tableRect.x, arrowY); ctx.lineTo(tableRightX - 10, arrowY);
            ctx.stroke();
            ctx.setLineDash([]); ctx.lineDashOffset = 0;
            // arrowhead
            ctx.fillStyle = '#0891b2';
            ctx.beginPath();
            ctx.moveTo(tableRightX, arrowY); ctx.lineTo(tableRightX - 12, arrowY - 5);
            ctx.lineTo(tableRightX - 12, arrowY + 5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#475569';
            ctx.font = '700 12px ui-sans-serif, system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('Across a period →  ' + meta.trendAcross.replace('←', '').replace('→', '').trim(),
                (tableRect.x + tableRightX) / 2, arrowY + 10);

            // Down group arrow on the right (flowing top → bottom)
            const downX = tableRightX + 20;
            ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.lineDashOffset = -flow;
            ctx.beginPath();
            ctx.moveTo(downX, tableRect.y); ctx.lineTo(downX, tableBottomY - 10);
            ctx.stroke();
            ctx.setLineDash([]); ctx.lineDashOffset = 0;
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.moveTo(downX, tableBottomY); ctx.lineTo(downX - 5, tableBottomY - 12);
            ctx.lineTo(downX + 5, tableBottomY - 12); ctx.closePath(); ctx.fill();
            ctx.save();
            ctx.translate(downX + 16, (tableRect.y + tableBottomY) / 2);
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = '#475569';
            ctx.font = '700 12px ui-sans-serif, system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('Down a group ↓  ' + meta.trendDown.replace('↓', '').replace('→', '').trim(), 0, 0);
            ctx.restore();
        };

        const drawIsoView = (tp: number) => {
            ctx.fillStyle = '#0f172a';
            ctx.font = '800 22px ui-sans-serif, system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
            ctx.fillText('Isoelectronic species — 10 electrons each', W / 2, 120);
            ctx.fillStyle = '#64748b';
            ctx.font = '600 14px ui-sans-serif, system-ui';
            ctx.fillText('Same electron count, different nuclear charge → radius shrinks as Z grows', W / 2, 148);

            const centers = [W * 0.2, W * 0.4, W * 0.6, W * 0.8];
            const cy = 330;
            const pulse = 0.5 + 0.5 * Math.sin(clockRef.current * 2);
            ISO_SPECIES.forEach((sp, i) => {
                const cx = centers[i];
                // entrance grows the spheres in, then a gentle breathing pulse
                const grow = clamp(tp * 1.3 - i * 0.12, 0, 1);
                const r = sp.r * 0.62 * grow * (1 + 0.015 * pulse);
                // Soft halo
                ctx.fillStyle = sp.color + '22';
                ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, Math.PI * 2); ctx.fill();
                // sphere with radial shading
                const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
                g.addColorStop(0, sp.color + 'FF');
                g.addColorStop(1, sp.color + 'AA');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = '900 24px ui-sans-serif, system-ui';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(sp.label, cx, cy);
                ctx.fillStyle = '#0f172a';
                ctx.font = '700 14px ui-sans-serif, system-ui';
                ctx.textBaseline = 'top';
                ctx.fillText('Z = ' + sp.z + ' · r = ' + sp.r + ' pm', cx, cy + 96);
            });

            // "Z increases →" flowing arrow above the spheres
            const ax0 = centers[0], ax1 = centers[3], ay = cy - 116;
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]); ctx.lineDashOffset = -clockRef.current * 22;
            ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(ax1 - 12, ay); ctx.stroke();
            ctx.setLineDash([]); ctx.lineDashOffset = 0;
            ctx.fillStyle = '#0f172a';
            ctx.beginPath(); ctx.moveTo(ax1, ay); ctx.lineTo(ax1 - 13, ay - 5); ctx.lineTo(ax1 - 13, ay + 5); ctx.closePath(); ctx.fill();
            ctx.font = '700 12px ui-sans-serif, system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText('nuclear charge Z increases  →  ionic radius decreases', (ax0 + ax1) / 2, ay - 8);

            // Bar chart below — bars ease up with the transition
            const bx = 160, by = 660, bw = W - 320, bh = 90;
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
            ctx.textAlign = 'center';
            ISO_SPECIES.forEach((sp, i) => {
                const cx = bx + (i + 0.5) * (bw / ISO_SPECIES.length);
                const h = (sp.r / 150) * bh * clamp(tp * 1.3, 0, 1);
                ctx.fillStyle = sp.color;
                ctx.beginPath(); ctx.roundRect(cx - 22, by + bh - h, 44, h, 6); ctx.fill();
                ctx.fillStyle = '#0f172a';
                ctx.font = '700 12px ui-monospace, monospace';
                ctx.textBaseline = 'bottom';
                ctx.fillText(sp.r + '', cx, by + bh - h - 4);
                ctx.fillStyle = '#475569';
                ctx.font = '700 12px ui-sans-serif, system-ui';
                ctx.textBaseline = 'top';
                ctx.fillText(sp.label, cx, by + bh + 6);
            });
        };

        const drawCaption = () => {
            ctx.fillStyle = '#0f172a';
            ctx.font = '800 18px ui-sans-serif, system-ui';
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText('Lens · ' + meta.label, 36, 30);
            ctx.fillStyle = '#475569';
            ctx.font = '600 12px ui-sans-serif, system-ui';
            ctx.fillText(meta.trendAcross + '   ·   ' + meta.trendDown, 36, 56);
            // Radius/Ion badge
            if (lens === 'radius') {
                ctx.fillStyle = '#ecfeff';
                ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 1.5;
                const bw = 156, bh = 30, bx = W - bw - 130, by = 20; // left of the play/reset buttons
                ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#0e7490';
                ctx.font = 'bold 12px ui-sans-serif, system-ui';
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText((radiusKind === 'ion' ? 'Ionic radius' : 'Atomic radius') + ' · pm', bx + 12, by + bh / 2 + 1);
            }
        };

        const draw = (ts: number) => {
            const last = lastTsRef.current ?? ts;
            let dt = ts - last;
            lastTsRef.current = ts;
            if (dt > 100) dt = 100;
            if (!paused) {
                clockRef.current += dt / 1000;
                transRef.current = Math.min(1, transRef.current + dt / 1000 / 0.55); // ~0.55s entrance
            }
            const tp = easeOut(transRef.current);

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, W, H);
            drawCaption();
            if (view === 'table') drawPeriodicTable(tp);
            else drawIsoView(tp);

            animRef.current += 1;
            rafRef.current = requestAnimationFrame(draw);
        };

        draw(performance.now()); // immediate first frame, then keep animating
        return () => { if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current); };
    }, [lens, view, highlight, radiusKind, selectedSym, paused, meta, tileXY]);

    // Trend line helpers
    const periodTrend = useMemo(() => {
        const p = selected.period;
        return ELEMENTS.filter(e => e.period === p && e.col >= 1 && e.col <= 18).sort((a, b) => a.col - b.col);
    }, [selected]);
    const groupTrend = useMemo(() => {
        const g = selected.group;
        return ELEMENTS.filter(e => e.group === g).sort((a, b) => a.period - b.period);
    }, [selected]);

    const renderTrendSvg = (els: Elem[], width: number, height: number, kind: 'period' | 'group') => {
        const [lo, hi] = lensRange(lens, radiusKind);
        const vals = els.map(e => ({ e, v: lensValue(e, lens, radiusKind) }));
        const pad = 30;
        const xs = (i: number) => pad + (i * (width - 2 * pad)) / Math.max(1, vals.length - 1);
        const ys = (v: number | null) => v === null ? height - pad : height - pad - ((v - lo) / (hi - lo)) * (height - 2 * pad);
        const pts = vals.map((d, i) => ({ x: xs(i), y: ys(d.v), label: d.e.sym, sel: d.e.sym === selectedSym, v: d.v }));
        return (
            <svg width={width} height={height}>
                <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#cbd5e1" strokeWidth={1} />
                <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#cbd5e1" strokeWidth={1} />
                <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={meta.hi} strokeWidth={2} />
                {pts.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r={p.sel ? 6 : 3.5} fill={p.sel ? meta.hi : '#475569'} />
                        <text x={p.x} y={height - pad + 14} fontSize={10} fontWeight={700} textAnchor="middle" fill={p.sel ? '#0f172a' : '#64748b'}>{p.label}</text>
                        {p.v !== null && <text x={p.x} y={p.y - 8} fontSize={9} fontWeight={800} textAnchor="middle" fill="#0f172a">{p.v}</text>}
                    </g>
                ))}
                <text x={width / 2} y={14} fontSize={11} fontWeight={800} textAnchor="middle" fill="#0f172a">
                    {kind === 'period' ? `Across Period ${selected.period}` : `Down Group ${selected.group}`}
                </text>
            </svg>
        );
    };

    const ncertTable: { rows: string[][]; head: string[] } = useMemo(() => {
        if (lens === 'radius') {
            return {
                head: ['Element', 'r (pm)'],
                rows: ELEMENTS.filter(e => e.period === selected.period && e.radius !== undefined)
                    .map(e => [e.sym, String(e.radius)])
            };
        }
        if (lens === 'en') {
            return {
                head: ['Element', 'EN'],
                rows: ELEMENTS.filter(e => e.period === selected.period && e.en !== undefined)
                    .map(e => [e.sym, e.en!.toFixed(1)])
            };
        }
        return { head: ['Element', 'Trend'], rows: ELEMENTS.filter(e => e.period === selected.period && e.ieRank !== undefined).map(e => [e.sym, 'rank ' + e.ieRank]) };
    }, [lens, selected]);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Period trend</div>
                    <div className="text-xs font-semibold text-slate-500">{meta.label}</div>
                    <div className="mt-1">{renderTrendSvg(periodTrend, 310, 170, 'period')}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Group trend</div>
                    <div className="text-xs font-semibold text-slate-500">{meta.label}</div>
                    <div className="mt-1">{renderTrendSvg(groupTrend, 310, 170, 'group')}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">NCERT data — Period {selected.period}</div>
                    <div className="text-xs font-semibold text-slate-500">Tables 3.6 / 3.8</div>
                    <table className="mt-2 w-full text-left text-[11px]">
                        <thead><tr className="text-slate-500"><th className="py-1">{ncertTable.head[0]}</th><th>{ncertTable.head[1]}</th></tr></thead>
                        <tbody>
                            {ncertTable.rows.map(r => (
                                <tr key={r[0]} className={r[0] === selectedSym ? 'bg-amber-50 font-extrabold text-amber-900' : 'text-slate-700'}>
                                    <td className="py-1">{r[0]}</td><td className="font-mono">{r[1]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </aside>
    );

    const selectedVal = lensValue(selected, lens, radiusKind);

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">NCERT focus</div>
                    <div className="text-xs font-semibold text-amber-700">Class 11 Chemistry, Ch 3 §3.7.1</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-900">
                        <div>{meta.trendAcross}</div>
                        <div>{meta.trendDown}</div>
                        <div className="text-[12px] font-normal italic text-amber-800">{meta.explain}</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">Selected element</div>
                        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</div>
                    </div>
                    <div className="mt-3 rounded-xl border border-slate-100 bg-amber-50 p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{selected.name}</div>
                        <div className="font-mono text-2xl font-extrabold text-amber-700">{selected.sym} <span className="text-base text-slate-500">· Z = {selected.z}</span></div>
                        <div className="mt-1 text-[11px] font-bold text-slate-600">Period {selected.period} · Group {selected.group}</div>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: meta.label, value: selectedVal === null ? '— (no NCERT value)' : (selectedVal + ' ' + meta.unit) },
                            { label: 'Atomic radius', value: selected.radius ? selected.radius + ' pm' : '—' },
                            { label: 'Electronegativity', value: selected.en !== undefined ? selected.en.toFixed(1) + ' (Pauling)' : '—' },
                            { label: 'Ionic radius', value: ION_RADIUS[selected.sym] ? ION_RADIUS[selected.sym].value + ' pm (' + selected.sym + ION_RADIUS[selected.sym].charge + ')' : '—' }
                        ].map(r => (
                            <div key={r.label} className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{r.label}</div>
                                <div className="mt-0.5 font-mono text-sm font-extrabold text-amber-700">{r.value}</div>
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
                    onClick={onCanvasClick}
                    onMouseMove={onCanvasMove}
                    className="absolute inset-0 h-full w-full cursor-pointer"
                />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        onClick={() => setPaused(v => !v)}
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

    const lensButtons: Array<{ id: Lens; label: string; icon: React.ReactNode }> = [
        { id: 'radius',   label: 'Atomic Radius', icon: <Atom size={15} /> },
        { id: 'ie',       label: 'Ionisation E',  icon: <Sparkles size={15} /> },
        { id: 'en',       label: 'Electronegativity', icon: <Layers size={15} /> },
        { id: 'metallic', label: 'Metallic Character', icon: <Atom size={15} /> }
    ];

    const controlsComponent = (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Layers size={18} className="text-cyan-600" />
                Periodic Trends Explorer
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Lens</div>
                    <div className="grid grid-cols-2 gap-2">
                        {lensButtons.map(b => (
                            <button
                                key={b.id}
                                onClick={() => setLens(b.id)}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${lens === b.id ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                {b.icon}{b.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">View</div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setView('table')}
                            className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${view === 'table' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >Periodic Table</button>
                        <button
                            onClick={() => setView('iso')}
                            className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${view === 'iso' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >Isoelectronic</button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Highlight</div>
                        <div className="grid grid-cols-5 gap-1.5">
                            {(['off','p2','p3','g1','g17'] as HL[]).map(h => (
                                <button
                                    key={h}
                                    onClick={() => setHighlight(h)}
                                    className={`rounded-lg border px-1.5 py-1.5 text-[11px] font-extrabold transition ${highlight === h ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {h === 'off' ? 'Off' : h === 'p2' ? 'P2' : h === 'p3' ? 'P3' : h === 'g1' ? 'G1' : 'G17'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {lens === 'radius' && (
                        <div>
                            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Radius kind</div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setRadiusKind('atom')}
                                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${radiusKind === 'atom' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                >Atomic</button>
                                <button
                                    onClick={() => setRadiusKind('ion')}
                                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${radiusKind === 'ion' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                >Ionic (Na⁺, F⁻)</button>
                            </div>
                        </div>
                    )}
                    <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Quick pick</div>
                        <div className="grid grid-cols-6 gap-1">
                            {['Li','Na','K','F','Cl','Br'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedSym(s)}
                                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-extrabold transition ${selectedSym === s ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                >{s}</button>
                            ))}
                        </div>
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
            controlsAreaFlex="0 0 240px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default PeriodicTrendsExplorerLab;
