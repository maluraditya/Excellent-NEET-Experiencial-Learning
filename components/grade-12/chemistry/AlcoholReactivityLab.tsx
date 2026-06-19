import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Beaker,
    Droplet,
    Eye,
    EyeOff,
    FlaskConical,
    Link2,
    Pause,
    Play,
    RotateCcw,
    Thermometer,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface AlcoholReactivityLabProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'properties' | 'reactivity';
type AlcClass = 'primary' | 'secondary' | 'tertiary';
type ReagentId = 'lucas' | 'h2so4' | 'pcc' | 'kmno4' | 'cu573';
type Outcome = 'fast' | 'slow' | 'none' | 'dehydrate';

interface Molecule {
    id: string;
    label: string;
    formula: string;
    cls?: AlcClass;
    Mr: number;
    bp: number | null; // NCERT-stated K; null if not numerically given
    bpNote?: string;
    isAlcohol: boolean;
    family: 'alcohol' | 'ether' | 'alkane';
    color: string;
}

interface Reagent {
    id: ReagentId;
    label: string;
    short: string;
    color: string;
    note: string;
}

const W = 1280;
const H = 760;

// NCERT-stated boiling points (§7.4.3 + §7.5.1). For molecules without explicit numbers
// the simulation shows a qualitative chip ("higher than ethanol", etc.) per NCERT trend rules.
const MOLECULES: Molecule[] = [
    { id: 'methanol',     label: 'Methanol',      formula: 'CH₃OH',          cls: 'primary',  Mr: 32,  bp: 337, isAlcohol: true,  family: 'alcohol', color: '#22c55e' },
    { id: 'ethanol',      label: 'Ethanol',       formula: 'CH₃CH₂OH',       cls: 'primary',  Mr: 46,  bp: 351, isAlcohol: true,  family: 'alcohol', color: '#16a34a' },
    { id: 'propan1ol',    label: 'Propan-1-ol',   formula: 'CH₃CH₂CH₂OH',    cls: 'primary',  Mr: 60,  bp: null, bpNote: 'higher than ethanol (chain ↑)', isAlcohol: true, family: 'alcohol', color: '#15803d' },
    { id: 'propan2ol',    label: 'Propan-2-ol',   formula: '(CH₃)₂CHOH',     cls: 'secondary',Mr: 60,  bp: null, bpNote: 'lower than propan-1-ol (branching ↓)', isAlcohol: true, family: 'alcohol', color: '#0ea5e9' },
    { id: 'tertbutanol',  label: 'tert-Butanol',  formula: '(CH₃)₃COH',      cls: 'tertiary', Mr: 74,  bp: null, bpNote: 'higher Mr but heavy branching → modest bp', isAlcohol: true, family: 'alcohol', color: '#a855f7' },
    { id: 'methoxymethane',label:'Methoxymethane',formula: 'CH₃OCH₃',        Mr: 46,  bp: 248, isAlcohol: false, family: 'ether',   color: '#f59e0b' },
    { id: 'propane',      label: 'Propane',       formula: 'CH₃CH₂CH₃',      Mr: 44,  bp: 231, isAlcohol: false, family: 'alkane',  color: '#64748b' },
];

const ALCOHOL_TUBES: Record<AlcClass, string> = {
    primary: 'ethanol',
    secondary: 'propan2ol',
    tertiary: 'tertbutanol',
};

const REAGENTS: Reagent[] = [
    { id: 'lucas',  label: 'Lucas reagent',         short: 'HCl + ZnCl₂',          color: '#0ea5e9', note: '3°: turbidity immediately · 2°: 5–10 min · 1°: none at RT' },
    { id: 'h2so4',  label: 'Conc H₂SO₄, 443 K',     short: 'H₂SO₄ + Δ',            color: '#dc2626', note: 'Dehydration to alkene. 3° fastest; 1° needs 443 K' },
    { id: 'pcc',    label: 'PCC (CrO₃·py·HCl)',     short: 'PCC',                  color: '#f59e0b', note: 'Mild oxidation: 1° → aldehyde, 2° → ketone, 3° resists' },
    { id: 'kmno4',  label: 'KMnO₄ / H⁺',            short: 'KMnO₄/H⁺',             color: '#7c3aed', note: 'Strong oxidation: 1° → carboxylic acid, 2° → ketone, 3° resists' },
    { id: 'cu573',  label: 'Cu, 573 K',             short: 'Cu / 573 K',           color: '#ea580c', note: '1° → aldehyde, 2° → ketone, 3° → dehydration to alkene' },
];

// NCERT-verbatim outcome table per {reagent, class}.
const OUTCOMES: Record<ReagentId, Record<AlcClass, { outcome: Outcome; product: string; tint: string }>> = {
    lucas: {
        primary:   { outcome: 'none', product: 'no turbidity at RT', tint: '#f8fafc' },
        secondary: { outcome: 'slow', product: 'turbidity in 5–10 min', tint: '#cbd5e1' },
        tertiary:  { outcome: 'fast', product: 'turbidity immediately', tint: '#94a3b8' },
    },
    h2so4: {
        primary:   { outcome: 'slow', product: 'ethene only at 443 K', tint: '#fee2e2' },
        secondary: { outcome: 'fast', product: 'alkene at 440 K', tint: '#fecaca' },
        tertiary:  { outcome: 'fast', product: 'alkene at 358 K', tint: '#fca5a5' },
    },
    pcc: {
        primary:   { outcome: 'fast', product: 'aldehyde', tint: '#fef3c7' },
        secondary: { outcome: 'fast', product: 'ketone', tint: '#fde68a' },
        tertiary:  { outcome: 'none', product: 'no reaction', tint: '#f8fafc' },
    },
    kmno4: {
        primary:   { outcome: 'fast', product: 'carboxylic acid', tint: '#ddd6fe' },
        secondary: { outcome: 'fast', product: 'ketone', tint: '#e9d5ff' },
        tertiary:  { outcome: 'none', product: 'resists (C–C cleavage at high T)', tint: '#f8fafc' },
    },
    cu573: {
        primary:   { outcome: 'fast', product: 'aldehyde (dehydrogenation)', tint: '#fed7aa' },
        secondary: { outcome: 'fast', product: 'ketone (dehydrogenation)', tint: '#fdba74' },
        tertiary:  { outcome: 'dehydrate', product: 'alkene (dehydration)', tint: '#fb923c' },
    },
};

const RANKING_LABEL: Record<ReagentId, string> = {
    lucas:  'C–O cleavage:   3° > 2° > 1°',
    h2so4:  'Dehydration:    3° > 2° > 1°',
    pcc:    'Oxidation:      1°, 2° react · 3° resists',
    kmno4:  'Strong ox:      1° → COOH, 2° → ketone, 3° resists',
    cu573:  'Cu/573 K:       1° → CHO, 2° → C=O, 3° → alkene',
};

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    moleculeId: string;
}

const AlcoholReactivityLab: React.FC<AlcoholReactivityLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    const [mode, setMode] = useState<Mode>('properties');
    const [moleculeId, setMoleculeId] = useState('ethanol');
    const [reagentId, setReagentId] = useState<ReagentId>('lucas');
    const [showHBonds, setShowHBonds] = useState(true);
    const [running, setRunning] = useState(false);
    const [runProgress, setRunProgress] = useState(0); // 0..1
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);

    const molecule = useMemo(() => MOLECULES.find((m) => m.id === moleculeId)!, [moleculeId]);
    const reagent = useMemo(() => REAGENTS.find((r) => r.id === reagentId)!, [reagentId]);

    const handleReset = useCallback(() => {
        setRunProgress(0);
        setRunning(false);
        particlesRef.current = [];
    }, []);

    const handleRunReaction = useCallback(() => {
        setRunProgress(0);
        setRunning(true);
    }, []);

    // particle pool for the central beaker (Properties mode)
    useEffect(() => {
        if (mode !== 'properties') {
            particlesRef.current = [];
            return;
        }
        const total = 16;
        const cur = particlesRef.current;
        cur.length = 0;
        const bx0 = 360, bx1 = 740, by0 = 210, by1 = 600;
        for (let i = 0; i < total; i += 1) {
            cur.push({
                x: bx0 + 30 + Math.random() * (bx1 - bx0 - 60),
                y: by0 + 30 + Math.random() * (by1 - by0 - 60),
                vx: (Math.random() - 0.5) * (molecule.family === 'alkane' ? 1.6 : molecule.family === 'ether' ? 1.0 : 0.7),
                vy: (Math.random() - 0.5) * (molecule.family === 'alkane' ? 1.6 : molecule.family === 'ether' ? 1.0 : 0.7),
                rot: Math.random() * Math.PI * 2,
                moleculeId: molecule.id,
            });
        }
    }, [mode, molecule]);

    // run-reaction progress
    useEffect(() => {
        if (!running) return;
        let id = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const dt = (now - start) / 1000;
            const t = Math.min(1, dt / 3.5);
            setRunProgress(t);
            if (t < 1) id = requestAnimationFrame(tick);
            else setRunning(false);
        };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [running]);

    // ============ DRAW ============
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // ---- helpers ----
        const drawAlcoholStick = (cx: number, cy: number, mol: Molecule, scale = 1) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.lineWidth = 2 * scale;
            ctx.strokeStyle = '#0f172a';
            ctx.fillStyle = mol.color;
            // Backbone: small dot trail
            const carbons = Math.min(4, Math.max(1, Math.round(mol.Mr / 14)));
            const step = 14 * scale;
            for (let i = 0; i < carbons; i += 1) {
                const px = -((carbons - 1) * step) / 2 + i * step;
                ctx.beginPath();
                ctx.arc(px, 0, 4 * scale, 0, Math.PI * 2);
                ctx.fill();
                if (i > 0) {
                    ctx.beginPath();
                    ctx.moveTo(px - step, 0);
                    ctx.lineTo(px, 0);
                    ctx.stroke();
                }
            }
            // OH at one end
            if (mol.isAlcohol) {
                const px = -((carbons - 1) * step) / 2 + (carbons - 1) * step;
                // O
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(px + step, 0, 5 * scale, 0, Math.PI * 2);
                ctx.fill();
                // bond C-O
                ctx.beginPath();
                ctx.moveTo(px, 0);
                ctx.lineTo(px + step - 4, 0);
                ctx.stroke();
                // H
                ctx.fillStyle = '#e2e8f0';
                ctx.strokeStyle = '#94a3b8';
                ctx.beginPath();
                ctx.arc(px + step + 12 * scale, -6 * scale, 4 * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(px + step + 4, 0);
                ctx.lineTo(px + step + 12 * scale - 2, -6 * scale);
                ctx.stroke();
            } else if (mol.family === 'ether') {
                // central O
                const px = 0;
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(px, -12 * scale, 5 * scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#0f172a';
                ctx.beginPath();
                ctx.moveTo(px, -12 * scale + 4);
                ctx.lineTo(px, -2);
                ctx.stroke();
            }
            ctx.restore();
        };

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);

            // brief caption (single line — allowed)
            ctx.fillStyle = '#64748b';
            ctx.font = '600 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(
                mode === 'properties'
                    ? 'Hydrogen bonding raises boiling point — compare equal-mass molecules'
                    : 'Add a reagent to compare 1° / 2° / 3° alcohol reactivity',
                60, 60,
            );

            if (mode === 'properties') {
                // ============ BEAKER ============
                const bx0 = 360, bx1 = 740, by0 = 200, by1 = 620;
                ctx.fillStyle = '#f8fafc';
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(bx0 - 18, by0 - 8);
                ctx.lineTo(bx0, by0);
                ctx.lineTo(bx0, by1);
                ctx.quadraticCurveTo((bx0 + bx1) / 2, by1 + 30, bx1, by1);
                ctx.lineTo(bx1, by0);
                ctx.lineTo(bx1 + 18, by0 - 8);
                ctx.stroke();
                // liquid
                const fillTop = by0 + 30;
                ctx.beginPath();
                ctx.moveTo(bx0 + 2, fillTop);
                ctx.lineTo(bx0 + 2, by1 - 2);
                ctx.quadraticCurveTo((bx0 + bx1) / 2, by1 + 24, bx1 - 2, by1 - 2);
                ctx.lineTo(bx1 - 2, fillTop);
                ctx.closePath();
                ctx.fillStyle = `${molecule.color}22`;
                ctx.fill();

                // labels
                ctx.fillStyle = '#0f172a';
                ctx.font = '800 18px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${molecule.label}  ·  ${molecule.formula}`, (bx0 + bx1) / 2, by0 - 20);
                ctx.font = '700 12px Inter, system-ui, sans-serif';
                ctx.fillStyle = '#64748b';
                ctx.fillText(`Mr = ${molecule.Mr} g mol⁻¹  ·  family: ${molecule.family}`, (bx0 + bx1) / 2, by1 + 56);

                // particles + motion
                const parts = particlesRef.current;
                const liquidTop = fillTop + 6;
                const liquidBottom = by1 + 8;
                for (const p of parts) {
                    if (!paused) {
                        p.x += p.vx * speed;
                        p.y += p.vy * speed;
                        if (p.x < bx0 + 22) { p.x = bx0 + 22; p.vx = Math.abs(p.vx); }
                        if (p.x > bx1 - 22) { p.x = bx1 - 22; p.vx = -Math.abs(p.vx); }
                        if (p.y < liquidTop + 8) { p.y = liquidTop + 8; p.vy = Math.abs(p.vy); }
                        if (p.y > liquidBottom - 8) { p.y = liquidBottom - 8; p.vy = -Math.abs(p.vy); }
                    }
                }
                // draw H-bonds (only between alcohol -OH groups within range)
                if (showHBonds && molecule.isAlcohol) {
                    ctx.save();
                    ctx.strokeStyle = '#06b6d4';
                    ctx.shadowColor = '#06b6d4';
                    ctx.shadowBlur = 6;
                    ctx.setLineDash([3, 4]);
                    ctx.lineDashOffset = -(performance.now() / 1000 * 18) % 14; // dashes flow
                    ctx.lineWidth = 1.8;
                    for (let i = 0; i < parts.length; i += 1) {
                        for (let j = i + 1; j < parts.length; j += 1) {
                            const a = parts[i], b = parts[j];
                            const dx = a.x - b.x, dy = a.y - b.y;
                            const d = Math.sqrt(dx * dx + dy * dy);
                            if (d < 60) {
                                ctx.globalAlpha = Math.min(1, (60 - d) / 60);
                                ctx.beginPath();
                                ctx.moveTo(a.x + 10, a.y);
                                ctx.lineTo(b.x - 10, b.y);
                                ctx.stroke();
                            }
                        }
                    }
                    ctx.restore();
                    ctx.globalAlpha = 1;
                    ctx.setLineDash([]);
                    // legend
                    ctx.fillStyle = '#06b6d4';
                    ctx.font = '700 11px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('cyan dashes = O–H ··· O hydrogen bonds', bx0, by0 - 4);
                } else if (molecule.family === 'ether') {
                    ctx.fillStyle = '#f59e0b';
                    ctx.font = '700 11px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('ether O can accept H-bonds but cannot donate', bx0, by0 - 4);
                } else {
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '700 11px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('no -OH, no -O- · only weak van der Waals', bx0, by0 - 4);
                }

                // draw molecules on top
                for (const p of parts) {
                    drawAlcoholStick(p.x, p.y, molecule, 0.9);
                }

                // ============ THERMOMETER ============
                const thX = 920;
                const thTop = 130;
                const thBot = 640;
                const T_MIN = 200;
                const T_MAX = 400;
                const tempToY = (tK: number) => thTop + ((T_MAX - tK) / (T_MAX - T_MIN)) * (thBot - thTop);
                ctx.fillStyle = '#f1f5f9';
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(thX - 18, thTop - 8, 36, thBot - thTop + 16, 12);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(thX, thBot + 36, 28, 0, Math.PI * 2);
                ctx.fillStyle = '#fecaca';
                ctx.fill();
                ctx.strokeStyle = '#cbd5e1';
                ctx.stroke();
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(thX - 6, thBot - 8, 12, 16);
                ctx.beginPath();
                ctx.arc(thX, thBot + 36, 18, 0, Math.PI * 2);
                ctx.fill();
                // ticks
                ctx.strokeStyle = '#94a3b8';
                ctx.fillStyle = '#475569';
                ctx.font = '600 11px Inter, system-ui, sans-serif';
                ctx.textAlign = 'right';
                for (let t = T_MIN; t <= T_MAX; t += 20) {
                    const y = tempToY(t);
                    ctx.beginPath();
                    ctx.moveTo(thX - 22, y);
                    ctx.lineTo(thX - 26, y);
                    ctx.stroke();
                    if (t % 40 === 0) ctx.fillText(`${t}`, thX - 30, y + 3);
                }
                ctx.textAlign = 'left';
                ctx.fillText('K', thX + 28, thTop - 14);
                // room temperature reference
                {
                    const y = tempToY(298);
                    ctx.strokeStyle = '#94a3b8';
                    ctx.setLineDash([3, 3]);
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(thX + 24, y);
                    ctx.lineTo(thX + 230, y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '600 11px Inter, system-ui, sans-serif';
                    ctx.fillText('room temperature (298 K)', thX + 28, y - 6);
                }
                // bp marker
                if (molecule.bp != null) {
                    const y = tempToY(molecule.bp);
                    const fillColor = molecule.bp >= 298 ? '#1d4ed8' : '#dc2626';
                    const bgColor = molecule.bp >= 298 ? '#dbeafe' : '#fee2e2';
                    ctx.fillStyle = bgColor;
                    ctx.strokeStyle = fillColor;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.roundRect(thX + 30, y - 24, 240, 48, 12);
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(thX + 30, y);
                    ctx.lineTo(thX + 14, y - 8);
                    ctx.lineTo(thX + 14, y + 8);
                    ctx.closePath();
                    ctx.fillStyle = fillColor;
                    ctx.fill();
                    ctx.font = '700 11px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillStyle = fillColor;
                    ctx.fillText('Boiling point', thX + 44, y - 6);
                    ctx.font = '800 20px Inter, system-ui, sans-serif';
                    ctx.fillText(`${molecule.bp} K`, thX + 44, y + 16);
                    ctx.font = '700 10px Inter, system-ui, sans-serif';
                    ctx.fillStyle = '#475569';
                    ctx.fillText(molecule.bp >= 298 ? '→ liquid at RT' : '→ gas at RT', thX + 160, y + 16);
                } else {
                    // qualitative chip
                    const y = tempToY(320);
                    ctx.fillStyle = '#fef3c7';
                    ctx.strokeStyle = '#d97706';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(thX + 30, y - 36, 250, 72, 12);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = '#92400e';
                    ctx.font = '700 11px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText('Boiling point (qualitative — NCERT trend)', thX + 44, y - 16);
                    ctx.font = '700 13px Inter, system-ui, sans-serif';
                    // wrap simple
                    const words = (molecule.bpNote || '').split(' ');
                    let line = '';
                    let yy = y + 4;
                    for (const w of words) {
                        const test = line + w + ' ';
                        if (ctx.measureText(test).width > 230) {
                            ctx.fillText(line, thX + 44, yy);
                            line = w + ' ';
                            yy += 16;
                        } else line = test;
                    }
                    if (line) ctx.fillText(line, thX + 44, yy);
                }
            } else {
                // ============ REACTIVITY MODE — 3 test tubes ============
                const tubeXs = [320, 640, 960];
                const tubeY0 = 200;
                const tubeY1 = 580;
                const classes: AlcClass[] = ['primary', 'secondary', 'tertiary'];
                const classLabel: Record<AlcClass, string> = { primary: '1°', secondary: '2°', tertiary: '3°' };
                const classColor: Record<AlcClass, string> = { primary: '#16a34a', secondary: '#0ea5e9', tertiary: '#a855f7' };

                ctx.fillStyle = '#0f172a';
                ctx.font = '700 14px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Reagent: ${reagent.label}`, W / 2, 110);
                ctx.fillStyle = '#475569';
                ctx.font = '600 12px Inter, system-ui, sans-serif';
                ctx.fillText(reagent.note, W / 2, 132);

                for (let i = 0; i < 3; i += 1) {
                    const cls = classes[i];
                    const cx = tubeXs[i];
                    const alc = MOLECULES.find((m) => m.id === ALCOHOL_TUBES[cls])!;
                    const result = OUTCOMES[reagent.id][cls];

                    // class chip
                    ctx.fillStyle = classColor[cls];
                    ctx.beginPath();
                    ctx.roundRect(cx - 60, tubeY0 - 50, 120, 32, 10);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '800 14px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${classLabel[cls]}  ${alc.label}`, cx, tubeY0 - 28);

                    // tube body
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(cx - 35, tubeY0);
                    ctx.lineTo(cx - 35, tubeY1);
                    ctx.arc(cx, tubeY1, 35, Math.PI, 0, true);
                    ctx.lineTo(cx + 35, tubeY0);
                    ctx.stroke();
                    // base alcohol fill
                    ctx.fillStyle = `${alc.color}22`;
                    ctx.beginPath();
                    ctx.moveTo(cx - 33, tubeY0 + 30);
                    ctx.lineTo(cx - 33, tubeY1);
                    ctx.arc(cx, tubeY1, 33, Math.PI, 0, true);
                    ctx.lineTo(cx + 33, tubeY0 + 30);
                    ctx.closePath();
                    ctx.fill();

                    // outcome animation based on progress
                    const t = runProgress; // 0..1
                    const reacted = result.outcome === 'fast' ? t
                                  : result.outcome === 'slow' ? Math.max(0, t * 0.55)
                                  : result.outcome === 'dehydrate' ? t
                                  : 0;
                    if (reacted > 0 && result.outcome !== 'none') {
                        // overlay coloured product
                        ctx.globalAlpha = Math.min(0.9, reacted);
                        ctx.fillStyle = result.tint;
                        ctx.beginPath();
                        ctx.moveTo(cx - 33, tubeY0 + 30);
                        ctx.lineTo(cx - 33, tubeY1);
                        ctx.arc(cx, tubeY1, 33, Math.PI, 0, true);
                        ctx.lineTo(cx + 33, tubeY0 + 30);
                        ctx.closePath();
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                    // bubbles for dehydration / alkene
                    if (running && (reagent.id === 'h2so4' || (reagent.id === 'cu573' && cls === 'tertiary')) && result.outcome !== 'none') {
                        const bubCount = result.outcome === 'fast' ? 8 : result.outcome === 'slow' ? 3 : result.outcome === 'dehydrate' ? 8 : 0;
                        for (let b = 0; b < bubCount; b += 1) {
                            const bx = cx - 25 + Math.random() * 50;
                            const by = tubeY1 - 10 - Math.random() * 200 * t;
                            ctx.beginPath();
                            ctx.arc(bx, by, 2 + Math.random() * 3, 0, Math.PI * 2);
                            ctx.fillStyle = '#94a3b8';
                            ctx.fill();
                        }
                    }
                    // "no reaction" cross
                    if (runProgress > 0.5 && result.outcome === 'none') {
                        ctx.strokeStyle = '#dc2626';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.moveTo(cx - 22, tubeY0 + 80);
                        ctx.lineTo(cx + 22, tubeY0 + 120);
                        ctx.moveTo(cx + 22, tubeY0 + 80);
                        ctx.lineTo(cx - 22, tubeY0 + 120);
                        ctx.stroke();
                    }
                    // outcome chip
                    const chipY = tubeY1 + 60;
                    const chipColor =
                        result.outcome === 'fast' ? '#16a34a' :
                        result.outcome === 'slow' ? '#f59e0b' :
                        result.outcome === 'dehydrate' ? '#ea580c' : '#94a3b8';
                    ctx.fillStyle = chipColor;
                    ctx.beginPath();
                    ctx.roundRect(cx - 90, chipY, 180, 56, 10);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '800 12px Inter, system-ui, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(
                        result.outcome === 'fast' ? 'REACTS  ✓' :
                        result.outcome === 'slow' ? 'SLOW  ○' :
                        result.outcome === 'dehydrate' ? 'DEHYDRATES  ⤴' : 'NO REACTION  ✗',
                        cx, chipY + 22,
                    );
                    ctx.font = '700 11px Inter, system-ui, sans-serif';
                    ctx.fillText(result.product, cx, chipY + 42);

                    // rate bar
                    const rate = result.outcome === 'fast' ? 1 : result.outcome === 'slow' ? 0.5 : result.outcome === 'dehydrate' ? 1 : 0;
                    ctx.fillStyle = '#e2e8f0';
                    ctx.fillRect(cx - 60, chipY + 70, 120, 8);
                    ctx.fillStyle = chipColor;
                    ctx.fillRect(cx - 60, chipY + 70, 120 * rate, 8);
                }
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        draw(); // immediate first paint (does not depend on rAF firing)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [mode, molecule, reagent, showHBonds, paused, speed, runProgress, running]);

    // ===== Left aside: bp comparison + ranking + trends =====
    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Boiling-point comparison</h3>
                    <p className="text-xs font-semibold text-slate-500">NCERT §7.4.3 — same-mass molecules</p>
                    {(() => {
                        const trio = ['ethanol', 'methoxymethane', 'propane'];
                        const items = trio.map((id) => MOLECULES.find((m) => m.id === id)!);
                        const maxBp = 400;
                        return (
                            <div className="mt-2 space-y-2 text-[11px] font-bold">
                                {items.map((m) => {
                                    const active = molecule.id === m.id;
                                    return (
                                        <div key={m.id}>
                                            <div className="flex items-center justify-between">
                                                <span className={active ? 'text-slate-900' : 'text-slate-600'}>{m.label}  (Mr {m.Mr})</span>
                                                <span className="font-mono text-slate-900">{m.bp} K</span>
                                            </div>
                                            <div className="mt-0.5 h-2.5 w-full rounded-full bg-slate-100">
                                                <div
                                                    className="h-2.5 rounded-full"
                                                    style={{ width: `${((m.bp || 0) / maxBp) * 100}%`, background: active ? m.color : `${m.color}99` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {molecule.id === 'methanol' && (
                                    <div className="mt-2 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-800">
                                        Currently loaded: <strong>methanol</strong> bp <strong>337 K</strong> (NCERT §7.5.1)
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Reactivity ranking</h3>
                    <p className="text-xs font-semibold text-slate-500">NCERT §7.4.4 verdict for the chosen reagent</p>
                    <div className="mt-2 rounded-xl bg-slate-50 p-3 font-mono text-[12px] font-bold text-slate-800">
                        {RANKING_LABEL[reagent.id]}
                    </div>
                    {mode === 'reactivity' && (
                        <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px] font-black uppercase tracking-wide">
                            {(['primary', 'secondary', 'tertiary'] as AlcClass[]).map((cls) => {
                                const r = OUTCOMES[reagent.id][cls];
                                const tint = r.outcome === 'fast' ? 'bg-emerald-100 text-emerald-800'
                                          : r.outcome === 'slow' ? 'bg-amber-100 text-amber-800'
                                          : r.outcome === 'dehydrate' ? 'bg-orange-100 text-orange-800'
                                          : 'bg-slate-100 text-slate-500';
                                return (
                                    <div key={cls} className={`rounded px-2 py-1.5 text-center ${tint}`}>
                                        {cls[0] === 'p' ? '1°' : cls[0] === 's' ? '2°' : '3°'}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">NCERT trends</h3>
                    <ul className="mt-2 space-y-1.5 text-[12px] font-semibold leading-snug text-slate-700">
                        <li>• b.p. <strong>↑</strong> with number of C atoms (van der Waals ↑)</li>
                        <li>• b.p. <strong>↓</strong> with branching (surface area ↓)</li>
                        <li>• Solubility in water <strong>↓</strong> as alkyl chain grows</li>
                        <li>• Small alcohols are miscible with water in all proportions</li>
                    </ul>
                </div>
            </div>
        </aside>
    ), [molecule, reagent, mode]);

    // ===== Right aside: theory + values + examples =====
    const valuesPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="flex items-start gap-2">
                        <FlaskConical size={19} className="mt-0.5 text-amber-800" />
                        <div>
                            <h3 className="text-base font-extrabold text-amber-950">Alcohols — Properties & Reactions</h3>
                            <p className="text-xs font-semibold text-amber-700">NCERT Class 12 · Unit 7 · §7.4.3 + §7.4.4</p>
                        </div>
                    </div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-950">
                        <p>-OH group sets the rules: H-bond donor + acceptor → high b.p., water solubility.</p>
                        <p>Boiling-point order at same mass: <strong>alcohol &gt; ether &gt; hydrocarbon</strong>.</p>
                        <p>C–O cleavage (Lucas, dehydration): rank <strong>3° &gt; 2° &gt; 1°</strong> (carbocation stability).</p>
                        <p>Oxidation needs α-H on the -OH carbon — <strong>3° resists</strong>; 1° → aldehyde / acid; 2° → ketone.</p>
                        <p>Hot Cu (573 K): 1° → aldehyde, 2° → ketone, 3° → alkene (dehydration).</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wide text-emerald-700">LIVE</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Loaded molecule', value: `${molecule.label}  ${molecule.formula}`, tint: 'bg-slate-50', color: 'text-slate-800' },
                            { label: 'Class', value: molecule.cls ? (molecule.cls === 'primary' ? '1° (primary)' : molecule.cls === 'secondary' ? '2° (secondary)' : '3° (tertiary)') : '— (not an alcohol)', tint: 'bg-slate-50', color: 'text-slate-700' },
                            { label: 'Molecular mass', value: `${molecule.Mr} g/mol`, tint: 'bg-slate-50', color: 'text-slate-700' },
                            { label: 'Boiling point', value: molecule.bp != null ? `${molecule.bp} K` : '— qualitative', tint: 'bg-amber-50', color: 'text-amber-700' },
                            ...(mode === 'reactivity' ? [{ label: 'Reagent', value: `${reagent.label}`, tint: 'bg-cyan-50', color: 'text-cyan-800' }] : []),
                        ].map((row) => (
                            <div key={row.label} className={`rounded-lg border border-slate-100 ${row.tint} px-3 py-2.5`}>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                                <div className={`mt-1 font-mono text-base font-extrabold ${row.color}`}>{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </aside>
    ), [molecule, reagent, mode]);

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        onClick={() => setPaused((v) => !v)}
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Beaker size={18} className="text-amber-600" />
                Alcohol Reactivity &amp; H-Bonding Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                    <div>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Mode</div>
                        <div className="grid grid-cols-2 gap-2">
                            {([
                                { id: 'properties', label: 'Properties' },
                                { id: 'reactivity', label: 'Reactivity' },
                            ] as Array<{ id: Mode; label: string }>).map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${mode === m.id ? 'border-amber-500 bg-amber-500 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {mode === 'properties' ? (
                        <div>
                            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Molecule</div>
                            <div className="grid grid-cols-2 gap-2">
                                {MOLECULES.map((m) => {
                                    const active = moleculeId === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setMoleculeId(m.id)}
                                            className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left text-[11px] font-extrabold transition ${active ? 'text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                            style={{ backgroundColor: active ? m.color : '#ffffff', borderColor: active ? m.color : '#e2e8f0' }}
                                        >
                                            <span className="leading-tight">{m.label}</span>
                                            <span className={`text-[9px] font-bold ${active ? 'text-white/80' : 'text-slate-400'}`}>
                                                {m.cls ? (m.cls === 'primary' ? '1°' : m.cls === 'secondary' ? '2°' : '3°') : m.family}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Reagent</div>
                            <div className="grid grid-cols-2 gap-2">
                                {REAGENTS.map((r) => {
                                    const active = reagentId === r.id;
                                    return (
                                        <button
                                            key={r.id}
                                            onClick={() => { setReagentId(r.id); setRunProgress(0); setRunning(false); }}
                                            className={`rounded-xl border px-3 py-2 text-[11px] font-extrabold transition ${active ? 'text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                            style={{ backgroundColor: active ? r.color : '#ffffff', borderColor: active ? r.color : '#e2e8f0' }}
                                        >
                                            {r.short}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    {mode === 'properties' ? (
                        <button
                            onClick={() => setShowHBonds((v) => !v)}
                            className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition ${showHBonds ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                        >
                            {showHBonds ? <Eye size={14} /> : <EyeOff size={14} />} Show hydrogen bonds
                        </button>
                    ) : (
                        <button
                            onClick={handleRunReaction}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-600 px-3 py-2.5 text-xs font-extrabold text-white shadow hover:bg-emerald-700"
                        >
                            <Droplet size={14} /> Add reagent to all tubes
                        </button>
                    )}
                    <div>
                        <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                            <span>Animation speed</span>
                            <span className="font-mono text-slate-700">{speed.toFixed(1)}×</span>
                        </div>
                        <input className="w-full accent-violet-600" type="range" min={0.2} max={2.5} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
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

export default AlcoholReactivityLab;
