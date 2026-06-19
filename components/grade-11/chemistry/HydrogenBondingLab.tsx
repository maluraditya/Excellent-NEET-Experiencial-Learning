import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atom, Link as LinkIcon, Pause, Play, RotateCcw, Thermometer } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface HydrogenBondingLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'inter' | 'intra';
type Mol = 'H2O' | 'HF' | 'EtOH' | 'NH3';

interface MolConfig {
    id: Mol;
    label: string;
    analogueLabel: string;
    hasHBond: true;
    analogueHasHBond: false;
    color: string;
    analogueColor: string;
    // Donor: the H atom; Acceptor: the F/O/N atom
}

const MOLS: Record<Mol, MolConfig> = {
    H2O:  { id: 'H2O',  label: 'H₂O',  analogueLabel: 'H₂S (no F/O/N)',  hasHBond: true, analogueHasHBond: false, color: '#0891b2', analogueColor: '#94a3b8' },
    HF:   { id: 'HF',   label: 'HF',   analogueLabel: 'HCl (Cl not F/O/N)', hasHBond: true, analogueHasHBond: false, color: '#dc2626', analogueColor: '#94a3b8' },
    EtOH: { id: 'EtOH', label: 'CH₃CH₂-OH', analogueLabel: 'CH₃-O-CH₃ (no O-H)', hasHBond: true, analogueHasHBond: false, color: '#16a34a', analogueColor: '#94a3b8' },
    NH3:  { id: 'NH3',  label: 'NH₃',  analogueLabel: 'PH₃ (P not F/O/N)', hasHBond: true, analogueHasHBond: false, color: '#6d28d9', analogueColor: '#94a3b8' }
};

const W = 1280;
const H = 760;

interface MolInst {
    x: number; y: number;
    vx: number; vy: number;
    rot: number;
    seed: number;
}

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function dist(ax: number, ay: number, bx: number, by: number) { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx*dx + dy*dy); }

function phaseFromTemp(t: number): 'Solid' | 'Liquid' | 'Gas' {
    if (t < 0.33) return 'Solid';
    if (t < 0.67) return 'Liquid';
    return 'Gas';
}
function strengthFromTemp(t: number): 'Strong' | 'Moderate' | 'Weak' {
    if (t < 0.33) return 'Strong';
    if (t < 0.67) return 'Moderate';
    return 'Weak';
}

const HydrogenBondingLab: React.FC<HydrogenBondingLabProps> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('inter');
    const [molId, setMolId] = useState<Mol>('H2O');
    const [temp, setTemp] = useState(0.4);
    const [showHBonds, setShowHBonds] = useState(true);
    const [showPartial, setShowPartial] = useState(true);
    const [paused, setPaused] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | undefined>(undefined);
    const leftMolsRef = useRef<MolInst[]>([]);
    const rightMolsRef = useRef<MolInst[]>([]);
    const intraAngleRef = useRef(0);
    const hbondCountRef = useRef(0);
    const clockRef = useRef(0);
    const lastTsRef = useRef<number | undefined>(undefined);
    const [hbondCount, setHbondCount] = useState(0);

    const mol = MOLS[molId];

    const handleReset = useCallback(() => {
        setMode('inter'); setMolId('H2O'); setTemp(0.4); setShowHBonds(true); setShowPartial(true);
        intraAngleRef.current = 0;
    }, []);

    // Initialize molecule instances for both panes
    useEffect(() => {
        if (mode !== 'inter') return;
        const initPane = (xMin: number, xMax: number, count: number) => {
            const arr: MolInst[] = [];
            for (let i = 0; i < count; i++) {
                arr.push({
                    x: xMin + 40 + Math.random() * (xMax - xMin - 80),
                    y: 140 + Math.random() * (H - 280),
                    vx: (Math.random() - 0.5) * 1.0,
                    vy: (Math.random() - 0.5) * 1.0,
                    rot: Math.random() * Math.PI * 2,
                    seed: Math.random()
                });
            }
            return arr;
        };
        leftMolsRef.current  = initPane(40, 620, 9);
        rightMolsRef.current = initPane(660, 1240, 9);
    }, [mode, molId]);

    // Draw a molecule schematic at (cx, cy) with rotation
    const drawMoleculeOnCtx = (ctx: CanvasRenderingContext2D, id: Mol | 'analogue', cx: number, cy: number, rot: number, baseColor: string, isAnalogue: boolean) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);

        const central = isAnalogue ? '#475569' : baseColor;
        const hCol = '#0f172a';

        if (id === 'H2O' || (id === 'analogue' && molId === 'H2O')) {
            // H2O / H2S — central O/S, two H atoms
            const centralLabel = isAnalogue ? 'S' : 'O';
            ctx.fillStyle = central;
            ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
            // Two H atoms
            const angles = [-0.9, 0.9];
            for (const a of angles) {
                const hx = Math.cos(a) * 20;
                const hy = Math.sin(a) * 20;
                ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(hx, hy); ctx.stroke();
                ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = hCol;
                ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = hCol; ctx.font = 'bold 8px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('H', hx, hy);
            }
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(centralLabel, 0, 0);
            if (showPartial && !isAnalogue) {
                ctx.fillStyle = '#1d4ed8'; ctx.font = '700 9px ui-sans-serif, system-ui';
                ctx.fillText('δ−', 0, -18);
                for (const a of angles) {
                    ctx.fillStyle = '#dc2626';
                    ctx.fillText('δ+', Math.cos(a) * 28, Math.sin(a) * 28);
                }
            }
        } else if (id === 'HF' || (id === 'analogue' && molId === 'HF')) {
            const centralLabel = isAnalogue ? 'Cl' : 'F';
            ctx.fillStyle = central;
            ctx.beginPath(); ctx.arc(8, 0, 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(centralLabel, 8, 0);
            // H
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-14, 0); ctx.stroke();
            ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = hCol;
            ctx.beginPath(); ctx.arc(-14, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = hCol; ctx.font = 'bold 8px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('H', -14, 0);
            if (showPartial && !isAnalogue) {
                ctx.fillStyle = '#1d4ed8'; ctx.font = '700 9px ui-sans-serif, system-ui';
                ctx.fillText('δ−', 8, -18);
                ctx.fillStyle = '#dc2626';
                ctx.fillText('δ+', -14, -14);
            }
        } else if (id === 'EtOH' || (id === 'analogue' && molId === 'EtOH')) {
            // ethanol vs dimethyl ether — simplified
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
            // chain
            ctx.beginPath();
            ctx.moveTo(-22, 0); ctx.lineTo(-8, 0); ctx.lineTo(6, 0); ctx.stroke();
            // Cs
            for (const cx of [-22, -8]) {
                ctx.fillStyle = '#475569';
                ctx.beginPath(); ctx.arc(cx, 0, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 9px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('C', cx, 0);
            }
            if (isAnalogue) {
                // O in middle, C-O-C
                ctx.fillStyle = '#475569';
                ctx.beginPath(); ctx.arc(6, 0, 9, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 9px ui-sans-serif, system-ui'; ctx.fillText('O', 6, 0);
                // Another C extending
                ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(20, 0); ctx.stroke();
                ctx.fillStyle = '#475569';
                ctx.beginPath(); ctx.arc(20, 0, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.fillText('C', 20, 0);
            } else {
                // O at end + H
                ctx.fillStyle = central;
                ctx.beginPath(); ctx.arc(6, 0, 9, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 9px ui-sans-serif, system-ui'; ctx.fillText('O', 6, 0);
                ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(22, -4); ctx.stroke();
                ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = hCol;
                ctx.beginPath(); ctx.arc(22, -4, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = hCol; ctx.font = 'bold 8px ui-sans-serif, system-ui'; ctx.fillText('H', 22, -4);
                if (showPartial) {
                    ctx.fillStyle = '#1d4ed8'; ctx.font = '700 9px ui-sans-serif, system-ui';
                    ctx.fillText('δ−', 6, -16);
                    ctx.fillStyle = '#dc2626';
                    ctx.fillText('δ+', 22, -18);
                }
            }
        } else if (id === 'NH3' || (id === 'analogue' && molId === 'NH3')) {
            const centralLabel = isAnalogue ? 'P' : 'N';
            ctx.fillStyle = central;
            ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(centralLabel, 0, 0);
            const angles = [-Math.PI/2, Math.PI - 0.6, Math.PI + 0.6];
            for (const a of angles) {
                const hx = Math.cos(a) * 22;
                const hy = Math.sin(a) * 22;
                ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(hx, hy); ctx.stroke();
                ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = hCol;
                ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.fillStyle = hCol; ctx.font = 'bold 8px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('H', hx, hy);
            }
            if (showPartial && !isAnalogue) {
                ctx.fillStyle = '#1d4ed8'; ctx.font = '700 9px ui-sans-serif, system-ui';
                ctx.fillText('δ−', 0, -18);
                for (const a of angles) {
                    ctx.fillStyle = '#dc2626';
                    ctx.fillText('δ+', Math.cos(a) * 30, Math.sin(a) * 30);
                }
            }
        }
        ctx.restore();
    };

    // Compute donor (H) and acceptor (F/O/N) world-space positions for a molecule
    const getHBondAnchors = (id: Mol, cx: number, cy: number, rot: number) => {
        // For each molecule we list one acceptor offset and one donor (H) offset
        const cos = Math.cos(rot), sin = Math.sin(rot);
        const xform = (lx: number, ly: number) => ({ x: cx + lx * cos - ly * sin, y: cy + lx * sin + ly * cos });
        if (id === 'H2O') {
            const acc = xform(0, 0);
            const don = xform(Math.cos(-0.9) * 20, Math.sin(-0.9) * 20);
            return { acceptor: acc, donor: don };
        }
        if (id === 'HF') {
            return { acceptor: xform(8, 0), donor: xform(-14, 0) };
        }
        if (id === 'EtOH') {
            return { acceptor: xform(6, 0), donor: xform(22, -4) };
        }
        // NH3
        return { acceptor: xform(0, 0), donor: xform(Math.cos(-Math.PI/2) * 22, Math.sin(-Math.PI/2) * 22) };
    };

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;

        const drawTempBadge = () => {
            const phase = phaseFromTemp(temp);
            const colorMap: Record<string, string> = { Solid: '#1e40af', Liquid: '#0e7490', Gas: '#92400e' };
            const bgMap: Record<string, string> = { Solid: '#dbeafe', Liquid: '#cffafe', Gas: '#fef3c7' };
            ctx.fillStyle = bgMap[phase];
            ctx.strokeStyle = colorMap[phase];
            ctx.lineWidth = 1.5;
            const bx = 36, by = 24, bw = 150, bh = 36;
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = colorMap[phase];
            ctx.font = 'bold 13px ui-sans-serif, system-ui';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText('Phase · ' + phase, bx + 14, by + bh/2);
        };

        const drawBPBar = () => {
            // Boiling-point qualitative comparison bar (kept clear of the bottom edge)
            const bx = 36, by = H - 112, bw = W - 72, bh = 26;
            // gradient track: low (left) → high (right)
            const trackGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
            trackGrad.addColorStop(0, '#e0f2fe');
            trackGrad.addColorStop(1, '#fee2e2');
            ctx.fillStyle = trackGrad;
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill();
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.stroke();
            // Markers
            const markH = bx + bw * 0.78; // H-bonded molecule: higher bp
            const markA = bx + bw * 0.32; // analogue: lower bp
            const drawDot = (mx: number, col: string) => {
                ctx.save();
                ctx.shadowColor = col; ctx.shadowBlur = 8;
                ctx.fillStyle = col;
                ctx.beginPath(); ctx.arc(mx, by + bh / 2, 9, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            };
            drawDot(markA, '#94a3b8');
            drawDot(markH, mol.color);
            // Axis labels
            ctx.fillStyle = '#475569'; ctx.font = 'bold 11px ui-sans-serif, system-ui';
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText('Low boiling point', bx + 6, by + bh + 6);
            ctx.textAlign = 'right';
            ctx.fillText('High boiling point', bx + bw - 6, by + bh + 6);
            // Above markers
            ctx.fillStyle = '#0f172a'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.font = '700 11px ui-sans-serif, system-ui';
            ctx.fillText(mol.label + ' (H-bonded)', markH, by - 7);
            ctx.fillText(mol.analogueLabel.split(' ')[0] + ' (analogue)', markA, by - 7);
            ctx.font = '600 10px ui-sans-serif, system-ui'; ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('NCERT §4.9: H-bonds raise the boiling point — more energy is needed to separate H-bonded molecules.', bx + bw / 2, by + bh + 22);
        };

        const drawSplitter = () => {
            ctx.strokeStyle = '#cbd5e1'; ctx.setLineDash([8, 6]); ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(640, 90); ctx.lineTo(640, H - 90); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#0f172a'; ctx.font = '800 14px ui-sans-serif, system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(mol.label + ' — H-bonded', 320, 80);
            ctx.fillText(mol.analogueLabel + ' — analogue', 960, 80);
        };

        const drawPane = (mols: MolInst[], xMin: number, xMax: number, isAnalogue: boolean, speedFactor: number) => {
            const yMin = 130, yMax = H - 150;
            // Update positions
            if (!paused) {
                for (const m of mols) {
                    m.x += m.vx * speedFactor;
                    m.y += m.vy * speedFactor;
                    m.rot += 0.005 * speedFactor;
                    if (m.x < xMin + 30) { m.x = xMin + 30; m.vx *= -1; }
                    if (m.x > xMax - 30) { m.x = xMax - 30; m.vx *= -1; }
                    if (m.y < yMin)      { m.y = yMin;      m.vy *= -1; }
                    if (m.y > yMax - 20) { m.y = yMax - 20; m.vy *= -1; }
                }
            }
            // Draw H-bonds first (under molecules) — only for H-bonded pane
            if (!isAnalogue && showHBonds) {
                // strength scales: cold => more bonds, warm => fewer
                const maxDist = 70 - temp * 35; // 70 (solid) → 35 (gas)
                const phaseFactor = 1 - temp; // 1 solid → 0 gas
                let count = 0;
                const pulse = 0.55 + 0.45 * Math.sin(clockRef.current * 2.4);
                const drawBond = (x1: number, y1: number, x2: number, y2: number) => {
                    const d = dist(x1, y1, x2, y2);
                    const strength = clamp(1 - d / maxDist, 0, 1); // closer = stronger/brighter
                    ctx.save();
                    ctx.strokeStyle = `rgba(8,145,178,${0.35 + 0.5 * strength})`;
                    ctx.shadowColor = 'rgba(8,145,178,0.6)';
                    ctx.shadowBlur = 4 + 6 * strength * pulse;
                    ctx.lineWidth = 1.3 + phaseFactor + strength;
                    ctx.setLineDash([5, 4]);
                    ctx.lineDashOffset = -clockRef.current * 16; // dashes flow along the bond
                    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                    ctx.restore();
                };
                for (let i = 0; i < mols.length; i++) {
                    for (let j = i + 1; j < mols.length; j++) {
                        const a = mols[i], b = mols[j];
                        const an = getHBondAnchors(molId, a.x, a.y, a.rot);
                        const bn = getHBondAnchors(molId, b.x, b.y, b.rot);
                        const d1 = dist(an.donor.x, an.donor.y, bn.acceptor.x, bn.acceptor.y);
                        const d2 = dist(bn.donor.x, bn.donor.y, an.acceptor.x, an.acceptor.y);
                        if (d1 < maxDist) { drawBond(an.donor.x, an.donor.y, bn.acceptor.x, bn.acceptor.y); count++; }
                        if (d2 < maxDist) { drawBond(bn.donor.x, bn.donor.y, an.acceptor.x, an.acceptor.y); count++; }
                    }
                }
                hbondCountRef.current = count;
            }
            // Draw molecules
            const color = isAnalogue ? mol.analogueColor : mol.color;
            for (const m of mols) {
                drawMoleculeOnCtx(ctx, isAnalogue ? 'analogue' : molId, m.x, m.y, m.rot, color, isAnalogue);
            }
        };

        const drawIntra = () => {
            // o-nitrophenol — single zoomed molecule centred
            const cx = W/2, cy = H/2 - 20;
            ctx.fillStyle = '#0f172a'; ctx.font = '800 18px ui-sans-serif, system-ui';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('o-nitrophenol — intramolecular hydrogen bond (NCERT Fig 4.22)', cx, 90);
            ctx.fillStyle = '#64748b'; ctx.font = '600 12px ui-sans-serif, system-ui';
            ctx.fillText('Hydrogen sits between two oxygen atoms within the same molecule.', cx, 116);

            // Benzene ring centred at (cx, cy)
            const ringR = 90;
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5;
            ctx.beginPath();
            const ringAngles: number[] = [];
            for (let i = 0; i < 6; i++) {
                const a = -Math.PI/2 + i * Math.PI/3;
                ringAngles.push(a);
                const x = cx + Math.cos(a) * ringR;
                const y = cy + Math.sin(a) * ringR;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath(); ctx.stroke();
            // Inner circle (aromatic)
            ctx.beginPath(); ctx.arc(cx, cy, ringR - 14, 0, Math.PI * 2); ctx.stroke();

            // OH at top (ortho to NO2)
            const ohA = ringAngles[0]; // top vertex
            const ohX = cx + Math.cos(ohA) * ringR;
            const ohY = cy + Math.sin(ohA) * ringR;
            const oX = ohX + Math.cos(ohA - 0.4) * 36;
            const oY = ohY + Math.sin(ohA - 0.4) * 36;
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(ohX, ohY); ctx.lineTo(oX, oY); ctx.stroke();
            ctx.fillStyle = '#dc2626';
            ctx.beginPath(); ctx.arc(oX, oY, 12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px ui-sans-serif, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('O', oX, oY);
            // H on the OH
            const hX = oX + Math.cos(ohA + 1.2) * 24;
            const hY = oY + Math.sin(ohA + 1.2) * 24;
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(oX, oY); ctx.lineTo(hX, hY); ctx.stroke();
            ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#0f172a';
            ctx.beginPath(); ctx.arc(hX, hY, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#0f172a'; ctx.font = 'bold 9px ui-sans-serif, system-ui';
            ctx.fillText('H', hX, hY);

            // NO2 at ortho position (next vertex clockwise)
            const noA = ringAngles[1];
            const noX = cx + Math.cos(noA) * ringR;
            const noY = cy + Math.sin(noA) * ringR;
            const nX = noX + Math.cos(noA + 0.3) * 36;
            const nY = noY + Math.sin(noA + 0.3) * 36;
            ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(noX, noY); ctx.lineTo(nX, nY); ctx.stroke();
            ctx.fillStyle = '#1d4ed8';
            ctx.beginPath(); ctx.arc(nX, nY, 12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px ui-sans-serif, system-ui'; ctx.fillText('N', nX, nY);
            // Two O on the N
            const o1X = nX + Math.cos(noA - 0.5) * 32;
            const o1Y = nY + Math.sin(noA - 0.5) * 32;
            const o2X = nX + Math.cos(noA + 0.9) * 32;
            const o2Y = nY + Math.sin(noA + 0.9) * 32;
            for (const [px, py] of [[o1X, o1Y], [o2X, o2Y]]) {
                ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(nX, nY); ctx.lineTo(px, py); ctx.stroke();
                ctx.fillStyle = '#dc2626';
                ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 10px ui-sans-serif, system-ui'; ctx.fillText('O', px, py);
            }

            // Intramolecular H-bond between OH's H and the nearest O of NO2
            if (showHBonds) {
                const pulse = 0.55 + 0.45 * Math.sin(clockRef.current * 2.4);
                ctx.save();
                ctx.strokeStyle = '#0891b2';
                ctx.shadowColor = 'rgba(8,145,178,0.7)';
                ctx.shadowBlur = 6 + 8 * pulse;
                ctx.setLineDash([6, 4]);
                ctx.lineDashOffset = -clockRef.current * 16;
                ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(hX, hY); ctx.lineTo(o1X, o1Y); ctx.stroke();
                ctx.restore();
                ctx.fillStyle = '#0891b2'; ctx.font = '700 11px ui-sans-serif, system-ui';
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText('intramolecular H-bond', (hX + o1X) / 2 + 10, (hY + o1Y) / 2);
                hbondCountRef.current = 1;
            } else {
                hbondCountRef.current = 0;
            }

            // Partial charges
            if (showPartial) {
                ctx.fillStyle = '#dc2626'; ctx.font = '700 10px ui-sans-serif, system-ui';
                ctx.fillText('δ+', hX, hY - 14);
                ctx.fillStyle = '#1d4ed8';
                ctx.fillText('δ−', o1X, o1Y - 14);
            }
        };

        const draw = (ts: number) => {
            const last = lastTsRef.current ?? ts;
            let dt = ts - last;
            lastTsRef.current = ts;
            if (dt > 100) dt = 100;
            if (!paused) clockRef.current += dt / 1000;
            const s = dt / 16.67; // motion scaled to 60fps baseline

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, W, H);

            drawTempBadge();

            if (mode === 'inter') {
                drawSplitter();
                // Speed factor: hot → fast, cold → slow, scaled by frame delta
                const speed = (0.2 + temp * 1.4) * s;
                drawPane(leftMolsRef.current, 40, 620, false, speed);
                drawPane(rightMolsRef.current, 660, 1240, true, speed);
                drawBPBar();
            } else {
                drawIntra();
            }

            // Sync H-bond count to state occasionally
            if (Math.random() < 0.08) setHbondCount(hbondCountRef.current);

            rafRef.current = requestAnimationFrame(draw);
        };

        draw(performance.now()); // immediate first frame, then keep animating
        return () => { if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current); };
    }, [mode, molId, temp, showHBonds, showPartial, paused, mol]);

    const phase = phaseFromTemp(temp);
    const strength = strengthFromTemp(temp);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Hydrogen bond — definition</div>
                    <div className="text-xs font-semibold text-slate-500">NCERT §4.9</div>
                    <div className="mt-2 text-[12px] leading-snug text-slate-700">
                        "Attractive force which binds hydrogen atom of one molecule with the electronegative atom (F, O or N) of another molecule."
                    </div>
                    <svg viewBox="0 0 300 60" className="mt-2 w-full">
                        <text x="20" y="34" fontSize="12" fontWeight="800" fill="#0f172a">H</text>
                        <text x="32" y="22" fontSize="9" fontWeight="800" fill="#dc2626">δ+</text>
                        <line x1="38" y1="32" x2="58" y2="32" stroke="#0f172a" strokeWidth="2" />
                        <text x="64" y="34" fontSize="12" fontWeight="800" fill="#0f172a">X</text>
                        <text x="76" y="22" fontSize="9" fontWeight="800" fill="#1d4ed8">δ−</text>
                        <line x1="88" y1="32" x2="128" y2="32" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />
                        <text x="134" y="34" fontSize="12" fontWeight="800" fill="#0f172a">H</text>
                        <text x="146" y="22" fontSize="9" fontWeight="800" fill="#dc2626">δ+</text>
                        <line x1="152" y1="32" x2="172" y2="32" stroke="#0f172a" strokeWidth="2" />
                        <text x="178" y="34" fontSize="12" fontWeight="800" fill="#0f172a">X</text>
                        <text x="190" y="22" fontSize="9" fontWeight="800" fill="#1d4ed8">δ−</text>
                        <line x1="202" y1="32" x2="242" y2="32" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" />
                        <text x="248" y="34" fontSize="12" fontWeight="800" fill="#0f172a">H</text>
                        <text x="260" y="22" fontSize="9" fontWeight="800" fill="#dc2626">δ+</text>
                        <text x="20" y="52" fontSize="10" fontWeight="700" fill="#64748b">— solid line = covalent · dotted = H-bond</text>
                    </svg>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Cause of formation</div>
                    <div className="text-xs font-semibold text-slate-500">NCERT §4.9.1</div>
                    <ol className="mt-2 list-decimal pl-4 text-[12px] leading-snug text-slate-700 space-y-1">
                        <li>H is covalently bonded to F, O or N.</li>
                        <li>Electron pair shifts toward the more electronegative atom.</li>
                        <li>H becomes δ+, the other atom becomes δ−.</li>
                        <li>Electrostatic attraction with neighbour molecule = H-bond.</li>
                    </ol>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">NCERT examples</div>
                    <div className="mt-2 space-y-1.5 text-[12px]">
                        <div className="rounded-lg bg-cyan-50 px-3 py-1.5 font-bold text-cyan-900">HF · alcohols · water → intermolecular</div>
                        <div className="rounded-lg bg-violet-50 px-3 py-1.5 font-bold text-violet-900">o-nitrophenol → intramolecular (Fig 4.22)</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Bond strength vs state</div>
                    <div className="mt-2 text-[12px] text-slate-700 leading-snug">
                        NCERT: "magnitude is maximum in the solid state and minimum in the gaseous state."
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px] font-bold text-center">
                        <div className={`rounded-lg px-2 py-1 ${phase === 'Solid' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-600'}`}>Solid · Strong</div>
                        <div className={`rounded-lg px-2 py-1 ${phase === 'Liquid' ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-100 text-slate-600'}`}>Liquid · Moderate</div>
                        <div className={`rounded-lg px-2 py-1 ${phase === 'Gas' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>Gas · Weak</div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">NCERT focus</div>
                    <div className="text-xs font-semibold text-amber-700">Class 11 Chemistry, Ch 4 §4.9</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-900">
                        <div>H-bond: H of one molecule attracted to F/O/N of another.</div>
                        <div>Weaker than covalent bond, shown as dotted line.</div>
                        <div>Inter: between molecules. Intra: within one molecule.</div>
                        <div>Strength: solid &gt; liquid &gt; gas.</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</div>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Molecule', value: mode === 'inter' ? mol.label : 'o-nitrophenol' },
                            { label: 'Bond mode', value: mode === 'inter' ? 'Intermolecular' : 'Intramolecular' },
                            { label: 'Phase', value: phase },
                            { label: 'H-bond strength', value: strength },
                            { label: 'Active H-bonds (live)', value: String(hbondCount) },
                            { label: 'Analogue (no H-bond)', value: mode === 'inter' ? mol.analogueLabel : '—' }
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
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
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

    const controlsComponent = (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <LinkIcon size={18} className="text-cyan-600" />
                Hydrogen Bonding Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Mode</div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setMode('inter')}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${mode === 'inter' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >Intermolecular</button>
                        <button
                            onClick={() => setMode('intra')}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${mode === 'intra' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >Intramolecular</button>
                    </div>

                    {mode === 'inter' && (
                        <>
                            <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Molecule</div>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                {(Object.values(MOLS) as MolConfig[]).map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMolId(m.id)}
                                        className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${molId === m.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                                <Thermometer size={13} /> Temperature
                            </label>
                            <div className="flex items-center gap-1.5">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${phase === 'Solid' ? 'bg-blue-100 text-blue-800' : phase === 'Liquid' ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'}`}>{phase}</span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">H-bond: {strength}</span>
                            </div>
                        </div>
                        <input
                            type="range" min={0} max={1} step={0.01} value={temp}
                            onChange={e => setTemp(Number(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none"
                            style={{ background: 'linear-gradient(to right, #2563eb 0%, #06b6d4 50%, #f59e0b 100%)' }}
                        />
                        <div className="mt-1 flex justify-between text-[10px] font-bold text-slate-400">
                            <span>Solid</span><span>Liquid</span><span>Gas</span>
                        </div>
                    </div>
                    <div>
                        <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Overlays</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setShowHBonds(v => !v)}
                                aria-pressed={showHBonds}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${showHBonds ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                            >
                                <LinkIcon size={13} /> H-bonds
                            </button>
                            <button
                                onClick={() => setShowPartial(v => !v)}
                                aria-pressed={showPartial}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${showPartial ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                            >
                                δ+ / δ−
                            </button>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600 flex items-center gap-2">
                        <Atom size={14} className="text-cyan-600 shrink-0" />
                        {mode === 'inter' ? 'Left cluster = H-bonded; right = analogue with no F/O/N.' : 'H sits between two O atoms within one molecule.'}
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

export default HydrogenBondingLab;
