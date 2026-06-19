import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Atom, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ElectronicConfigurationLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'aufbau' | 'hund' | 'exchange' | 'anomalous';

const W = 1280;
const H = 760;

// NCERT Ch 2 §2.6.4: Aufbau fill order — orbitals in energy sequence
const ORBITALS = [
    { name: '1s', nl: 1, boxes: 1 },
    { name: '2s', nl: 2, boxes: 1 },
    { name: '2p', nl: 3, boxes: 3 },
    { name: '3s', nl: 3, boxes: 1 },
    { name: '3p', nl: 4, boxes: 3 },
    { name: '4s', nl: 4, boxes: 1 },
    { name: '3d', nl: 5, boxes: 5 },
];
// group indices:  0     1      2     3     4     5     6

type EPl = { gi: number; bi: number; spin: 'up' | 'down' };

// Build normal Aufbau + Hund's fill sequence for 30 slots (covers Z=1..29)
function buildNormal(): EPl[] {
    const out: EPl[] = [];
    ORBITALS.forEach((o, gi) => {
        for (let bi = 0; bi < o.boxes; bi++) out.push({ gi, bi, spin: 'up' });
        for (let bi = 0; bi < o.boxes; bi++) out.push({ gi, bi, spin: 'down' });
    });
    return out;
}
const NORMAL_FILL = buildNormal();

// NCERT §2.6.6 — Cr (Z=24): [Ar] 3d⁵ 4s¹
// After Ar core + 4s↑ (electrons 1-19), next 5 go to 3d↑ instead of 4s↓ then 3d
function buildCrFill(): EPl[] {
    const f = NORMAL_FILL.slice(0, 19); // Ar core + 4s↑
    for (let bi = 0; bi < 5; bi++) f.push({ gi: 6, bi, spin: 'up' }); // 3d↑×5
    return f; // 24 electrons
}

// NCERT §2.6.6 — Cu (Z=29): [Ar] 3d¹⁰ 4s¹
function buildCuFill(): EPl[] {
    const f = NORMAL_FILL.slice(0, 19); // Ar core + 4s↑
    for (let bi = 0; bi < 5; bi++) f.push({ gi: 6, bi, spin: 'up' });   // 3d↑×5
    for (let bi = 0; bi < 5; bi++) f.push({ gi: 6, bi, spin: 'down' }); // 3d↓×5
    return f; // 29 electrons
}
const CR_FILL = buildCrFill();
const CU_FILL = buildCuFill();

const ELEMENTS: Record<number, string> = {
    1:'H',2:'He',3:'Li',4:'Be',5:'B',6:'C',7:'N',8:'O',9:'F',10:'Ne',
    11:'Na',12:'Mg',13:'Al',14:'Si',15:'P',16:'S',17:'Cl',18:'Ar',
    19:'K',20:'Ca',21:'Sc',22:'Ti',23:'V',24:'Cr',25:'Mn',26:'Fe',27:'Co',28:'Ni',29:'Cu',
};

const ELEMENT_OPTIONS = Object.entries(ELEMENTS).map(([atomicNumber, symbol]) => ({
    atomicNumber: Number(atomicNumber),
    symbol
}));

const D_OPTIONS = Array.from({ length: 11 }, (_, value) => value);

const SUP = ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹','¹⁰'];

function configStr(fill: EPl[], Z: number): string {
    const cnt = new Array(ORBITALS.length).fill(0);
    fill.slice(0, Z).forEach(e => cnt[e.gi]++);
    return ORBITALS.map((o, i) => cnt[i] > 0 ? `${o.name}${SUP[cnt[i]] ?? cnt[i]}` : '')
        .filter(Boolean).join(' ');
}

// Exchange count: same-spin pairs in d subshell
function exchangeCount(d: number): number {
    const up = Math.min(d, 5);
    const dn = Math.max(0, d - 5);
    return (up * (up - 1)) / 2 + (dn * (dn - 1)) / 2;
}

// Canvas constants
const CX = 700;
const BOX_W = 62;
const BOX_H = 46;
const BOX_GAP = 8;
// Y positions for each orbital group (1s at bottom = high y, 3d at top = low y)
const GY = [700, 636, 572, 508, 444, 352, 260];

function boxLeftX(gi: number): number {
    const total = ORBITALS[gi].boxes * BOX_W + (ORBITALS[gi].boxes - 1) * BOX_GAP;
    return CX - total / 2;
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

export default function ElectronicConfigurationLab({ topic, onExit }: ElectronicConfigurationLabProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mode, setMode] = useState<Mode>('aufbau');
    const [Z, setZ] = useState(6);
    const [dCount, setDCount] = useState(5);
    const [paused, setPaused] = useState(false);
    const [anomEl, setAnomEl] = useState<'cr' | 'cu'>('cr');
    const rafRef = useRef<number>(0);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // ── helpers ──────────────────────────────────────────
        function drawBox(x: number, y: number, hasUp: boolean, hasDn: boolean, hl = false) {
            ctx.save();
            ctx.fillStyle = hl ? '#fef3c7' : '#f8fafc';
            ctx.strokeStyle = hl ? '#d97706' : '#94a3b8';
            ctx.lineWidth = hl ? 2 : 1.5;
            rrect(ctx, x, y - BOX_H / 2, BOX_W, BOX_H, 7);
            ctx.fill(); ctx.stroke();
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (hasUp) { ctx.fillStyle = '#ea580c'; ctx.fillText('↑', x + BOX_W * 0.35, y); }
            if (hasDn) { ctx.fillStyle = '#1d4ed8'; ctx.fillText('↓', x + BOX_W * 0.65, y); }
            ctx.restore();
        }

        // ── MODE: AUFBAU ──────────────────────────────────────
        if (mode === 'aufbau') {
            const fill = NORMAL_FILL;
            const cnt = new Array(ORBITALS.length).fill(0);
            const upArr: boolean[][] = ORBITALS.map(o => new Array(o.boxes).fill(false));
            const dnArr: boolean[][] = ORBITALS.map(o => new Array(o.boxes).fill(false));
            fill.slice(0, Z).forEach(e => {
                cnt[e.gi]++;
                if (e.spin === 'up') upArr[e.gi][e.bi] = true;
                else dnArr[e.gi][e.bi] = true;
            });
            let highGi = -1;
            for (let i = ORBITALS.length - 1; i >= 0; i--) { if (cnt[i] > 0) { highGi = i; break; } }

            // energy axis
            ctx.save();
            ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(95, 730); ctx.lineTo(95, 115); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(95, 115); ctx.lineTo(89, 131); ctx.moveTo(95, 115); ctx.lineTo(101, 131); ctx.stroke();
            ctx.save(); ctx.translate(64, 430); ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#475569'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Energy', 0, 0);
            ctx.restore(); ctx.restore();

            ORBITALS.forEach((orb, gi) => {
                const y = GY[gi];
                const hl = gi === highGi;
                ctx.save();
                ctx.font = 'bold 16px monospace'; ctx.fillStyle = hl ? '#d97706' : '#334155';
                ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
                ctx.fillText(orb.name, 163, y);
                ctx.font = '11px sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'left';
                ctx.fillText(`n+l=${orb.nl}`, 170, y);
                // dashed connector
                ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
                ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(168, y); ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
                const lx = boxLeftX(gi);
                for (let bi = 0; bi < orb.boxes; bi++) {
                    drawBox(lx + bi * (BOX_W + BOX_GAP), y, upArr[gi][bi], dnArr[gi][bi], hl);
                }
            });

            // element circle
            ctx.save();
            ctx.beginPath(); ctx.arc(1080, 200, 76, 0, Math.PI * 2);
            ctx.fillStyle = '#eff6ff'; ctx.fill();
            ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#1d4ed8'; ctx.font = 'bold 46px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(ELEMENTS[Z] ?? '', 1080, 194);
            ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#64748b'; ctx.textBaseline = 'alphabetic';
            ctx.fillText(`Z = ${Z}`, 1080, 258);
            ctx.restore();

            // config string
            ctx.save();
            ctx.font = 'bold 16px monospace'; ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(configStr(fill, Z), 600, 18);
            ctx.restore();
        }

        // ── MODE: HUND'S RULE ─────────────────────────────────
        if (mode === 'hund') {
            const pZ = Math.max(5, Math.min(10, Z));
            const pCount = pZ - 4; // B=1 p-electron … Ne=6 p-electrons

            ctx.save();
            ctx.font = 'bold 19px sans-serif'; ctx.fillStyle = '#1e293b'; ctx.textAlign = 'center';
            ctx.fillText("Hund's Rule — 2p subshell filling", 640, 34);
            ctx.restore();

            const BW = 92, BH = 68, BGAP = 18;
            const sx = CX - (3 * BW + 2 * BGAP) / 2;

            // Wrong fill (pair before half-fill)
            ctx.save(); ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#dc2626'; ctx.textAlign = 'center';
            ctx.fillText('✗  Incorrect: pairing before half-fill', CX, 106); ctx.restore();
            const wUp = [false, false, false], wDn = [false, false, false];
            let rem = pCount;
            for (let bi = 0; bi < 3 && rem > 0; bi++) { wUp[bi] = true; rem--; if (rem > 0) { wDn[bi] = true; rem--; } }
            for (let bi = 0; bi < 3; bi++) {
                const bx = sx + bi * (BW + BGAP), by = 120;
                ctx.save();
                ctx.fillStyle = '#fef2f2'; ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 2;
                rrect(ctx, bx, by, BW, BH, 10); ctx.fill(); ctx.stroke();
                ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                if (wUp[bi]) { ctx.fillStyle = '#ea580c'; ctx.fillText('↑', bx + BW * 0.35, by + BH / 2); }
                if (wDn[bi]) { ctx.fillStyle = '#1d4ed8'; ctx.fillText('↓', bx + BW * 0.65, by + BH / 2); }
                ctx.restore();
            }

            // divider arrow
            ctx.save(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(CX, 205); ctx.lineTo(CX, 290); ctx.stroke(); ctx.setLineDash([]);
            ctx.beginPath(); ctx.moveTo(CX, 290); ctx.lineTo(CX - 7, 276); ctx.moveTo(CX, 290); ctx.lineTo(CX + 7, 276); ctx.stroke();
            ctx.restore();

            // Correct fill (Hund's)
            ctx.save(); ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#16a34a'; ctx.textAlign = 'center';
            ctx.fillText("✓  Hund's Rule: each orbital singly occupied with parallel spins first", CX, 312); ctx.restore();
            const cUp = [false, false, false], cDn = [false, false, false];
            let rem2 = pCount;
            for (let bi = 0; bi < 3 && rem2 > 0; bi++) { cUp[bi] = true; rem2--; }
            for (let bi = 0; bi < 3 && rem2 > 0; bi++) { cDn[bi] = true; rem2--; }
            for (let bi = 0; bi < 3; bi++) {
                const bx = sx + bi * (BW + BGAP), by = 325;
                ctx.save();
                ctx.fillStyle = '#f0fdf4'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 2;
                rrect(ctx, bx, by, BW, BH, 10); ctx.fill(); ctx.stroke();
                ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                if (cUp[bi]) { ctx.fillStyle = '#ea580c'; ctx.fillText('↑', bx + BW * 0.35, by + BH / 2); }
                if (cDn[bi]) { ctx.fillStyle = '#1d4ed8'; ctx.fillText('↓', bx + BW * 0.65, by + BH / 2); }
                ctx.restore();
            }

            // exchange lines between up-spin pairs (correct)
            const upBoxes = [0, 1, 2].filter(bi => cUp[bi]);
            if (upBoxes.length >= 2) {
                ctx.save(); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
                for (let a = 0; a < upBoxes.length; a++) {
                    for (let b = a + 1; b < upBoxes.length; b++) {
                        const ax = sx + upBoxes[a] * (BW + BGAP) + BW * 0.35;
                        const bxc = sx + upBoxes[b] * (BW + BGAP) + BW * 0.35;
                        ctx.beginPath(); ctx.moveTo(ax, 318); ctx.lineTo(bxc, 318); ctx.stroke();
                    }
                }
                ctx.setLineDash([]); ctx.restore();
            }

            const upCount = cUp.filter(Boolean).length;
            const exCount = (upCount * (upCount - 1)) / 2;
            ctx.save(); ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#92400e'; ctx.textAlign = 'center';
            ctx.fillText(`Exchange pairs: ${exCount}  (${upCount} parallel-spin electrons → C(${upCount},2) = ${exCount})`, CX, 428); ctx.restore();

            ctx.save(); ctx.font = '14px sans-serif'; ctx.fillStyle = '#475569'; ctx.textAlign = 'center';
            if (pCount <= 3) {
                ctx.fillText('Pairing does not begin until each of the 3 p-orbitals has one electron', CX, 475);
            } else {
                ctx.fillText(`Pairing starts at 4th electron. Each orbital now has ≤ 2 electrons (Pauli's principle).`, CX, 475);
            }
            ctx.restore();

            // element label bottom
            ctx.save(); ctx.font = 'bold 52px sans-serif'; ctx.fillStyle = '#1d4ed8'; ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${ELEMENTS[pZ]} (Z = ${pZ})`, CX, 590);
            ctx.font = 'bold 18px monospace'; ctx.fillStyle = '#475569'; ctx.textBaseline = 'alphabetic';
            ctx.fillText(configStr(NORMAL_FILL, pZ), CX, 660);
            ctx.restore();
        }

        // ── MODE: EXCHANGE ENERGY ─────────────────────────────
        if (mode === 'exchange') {
            const D = dCount;
            const exC = exchangeCount(D);
            const peak = D === 5 || D === 10;

            ctx.save();
            ctx.font = 'bold 19px sans-serif'; ctx.fillStyle = '#1e293b'; ctx.textAlign = 'center';
            ctx.fillText('Exchange Energy — 3d Subshell', 640, 34);
            ctx.font = '13px sans-serif'; ctx.fillStyle = '#64748b';
            ctx.fillText('NCERT §2.6.6: number of exchanges is maximum when 3d is half-filled (d⁵) or fully-filled (d¹⁰)', 640, 60);
            ctx.restore();

            const BW = 98, BH = 74, BGAP = 14;
            const sx = CX - (5 * BW + 4 * BGAP) / 2;
            const BY = 100;
            const upD = [false, false, false, false, false];
            const dnD = [false, false, false, false, false];
            let rem = D;
            for (let bi = 0; bi < 5 && rem > 0; bi++) { upD[bi] = true; rem--; }
            for (let bi = 0; bi < 5 && rem > 0; bi++) { dnD[bi] = true; rem--; }

            const dLabels = ['dxy', 'dyz', 'dzx', 'dx²-y²', 'dz²'];
            for (let bi = 0; bi < 5; bi++) {
                const bx = sx + bi * (BW + BGAP);
                ctx.save();
                ctx.fillStyle = peak ? '#fffbeb' : '#f8fafc';
                ctx.strokeStyle = peak ? '#d97706' : '#cbd5e1';
                ctx.lineWidth = peak ? 2.5 : 1.5;
                rrect(ctx, bx, BY, BW, BH, 10); ctx.fill(); ctx.stroke();
                ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
                ctx.fillText(dLabels[bi], bx + BW / 2, BY + BH + 16);
                ctx.font = 'bold 32px sans-serif'; ctx.textBaseline = 'middle';
                if (upD[bi]) { ctx.fillStyle = '#ea580c'; ctx.textAlign = 'center'; ctx.fillText('↑', bx + BW * 0.35, BY + BH / 2); }
                if (dnD[bi]) { ctx.fillStyle = '#1d4ed8'; ctx.textAlign = 'center'; ctx.fillText('↓', bx + BW * 0.65, BY + BH / 2); }
                ctx.restore();
            }

            // exchange lines — up pairs
            const upIdx = [0,1,2,3,4].filter(bi => upD[bi]);
            ctx.save(); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]);
            for (let a = 0; a < upIdx.length; a++) for (let b = a + 1; b < upIdx.length; b++) {
                const ax = sx + upIdx[a] * (BW + BGAP) + BW * 0.35;
                const bxc = sx + upIdx[b] * (BW + BGAP) + BW * 0.35;
                ctx.beginPath(); ctx.moveTo(ax, BY - 14); ctx.lineTo(bxc, BY - 14); ctx.stroke();
            }
            // exchange lines — down pairs
            const dnIdx = [0,1,2,3,4].filter(bi => dnD[bi]);
            ctx.strokeStyle = '#4f46e5';
            for (let a = 0; a < dnIdx.length; a++) for (let b = a + 1; b < dnIdx.length; b++) {
                const ax = sx + dnIdx[a] * (BW + BGAP) + BW * 0.65;
                const bxc = sx + dnIdx[b] * (BW + BGAP) + BW * 0.65;
                ctx.beginPath(); ctx.moveTo(ax, BY + BH + 26); ctx.lineTo(bxc, BY + BH + 26); ctx.stroke();
            }
            ctx.setLineDash([]); ctx.restore();

            // large exchange badge
            ctx.save();
            ctx.beginPath(); ctx.arc(CX, 350, 56, 0, Math.PI * 2);
            ctx.fillStyle = peak ? '#fef3c7' : '#f8fafc'; ctx.fill();
            ctx.strokeStyle = peak ? '#d97706' : '#cbd5e1'; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = '#92400e'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(String(exC), CX, 348);
            ctx.font = 'bold 11px sans-serif'; ctx.textBaseline = 'top';
            ctx.fillText('exchanges', CX, 406);
            ctx.restore();

            if (peak) {
                ctx.save(); ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#d97706'; ctx.textAlign = 'center';
                ctx.fillText(`★  ${D === 5 ? 'Half-filled 3d⁵' : 'Fully-filled 3d¹⁰'} — maximum exchange energy → extra stability!`, CX, 440);
                ctx.restore();
            }

            // subshell label
            ctx.save(); ctx.font = 'bold 20px monospace'; ctx.fillStyle = '#334155'; ctx.textAlign = 'center';
            ctx.fillText(`3d configuration: 3d${SUP[D] ?? D}`, CX, 490); ctx.restore();

            // bar chart
            const BARS = [0,1,3,6,10,10,11,13,16,20];
            const chartX = CX - 260, chartY = 560, chartH = 140, chartW = 520;
            ctx.save();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(chartX, chartY + chartH); ctx.lineTo(chartX + chartW, chartY + chartH); ctx.stroke();
            const bW2 = 38, bGap2 = 14;
            BARS.forEach((count, i) => {
                const bh = (count / 20) * chartH;
                const bx = chartX + i * (bW2 + bGap2);
                const hl2 = i === 4 || i === 9;
                ctx.fillStyle = hl2 ? '#d97706' : (i < 5 ? '#fdba74' : '#93c5fd');
                ctx.fillRect(bx, chartY + chartH - bh, bW2, bh);
                ctx.font = '10px sans-serif'; ctx.fillStyle = '#475569'; ctx.textAlign = 'center';
                ctx.fillText(`d${i + 1}`, bx + bW2 / 2, chartY + chartH + 13);
                if (hl2 || i + 1 === D) {
                    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = hl2 ? '#d97706' : '#475569';
                    ctx.fillText(String(count), bx + bW2 / 2, chartY + chartH - bh - 4);
                }
                if (i + 1 === D) {
                    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
                    ctx.strokeRect(bx - 1, chartY + chartH - bh - 1, bW2 + 2, bh + 2);
                }
            });
            ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#64748b'; ctx.textAlign = 'left';
            ctx.fillText('← Exchange count vs d-electron fill', chartX, chartY - 6);
            ctx.restore();
        }

        // ── MODE: ANOMALOUS ───────────────────────────────────
        if (mode === 'anomalous') {
            const isCr = anomEl === 'cr';
            const elem = isCr ? 'Cr' : 'Cu';
            const zz = isCr ? 24 : 29;
            const expCfg = isCr ? '3d⁴ 4s²' : '3d⁹ 4s²';
            const actCfg = isCr ? '3d⁵ 4s¹' : '3d¹⁰ 4s¹';
            const expEx = isCr ? 6 : 16;
            const actEx = isCr ? 10 : 20;

            ctx.save();
            ctx.font = 'bold 20px sans-serif'; ctx.fillStyle = '#1e293b'; ctx.textAlign = 'center';
            ctx.fillText(`${elem} (Z = ${zz}) — Anomalous Electronic Configuration`, 640, 34);
            ctx.restore();

            const COL1 = 290, COL2 = 950;
            ctx.save();
            ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
            ctx.fillStyle = '#64748b'; ctx.fillText('Expected (simple Aufbau)', COL1, 82);
            ctx.fillStyle = '#16a34a'; ctx.fillText('Actual (NCERT §2.6.6)', COL2, 82);
            ctx.restore();

            const BW2 = 58, BH2 = 44, BG2 = 7;

            function miniOrbits(colX: number, has4s2: boolean, d_up: number, d_dn: number, isActual = false) {
                const Y4S = 115, Y3D = 215;
                const sdx = colX - (5 * BW2 + 4 * BG2) / 2;
                // 4s label + box
                ctx.save(); ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#475569'; ctx.textAlign = 'right';
                ctx.textBaseline = 'middle'; ctx.fillText('4s', sdx - 10, Y4S + BH2 / 2); ctx.restore();
                const x4 = colX - BW2 / 2;
                ctx.save();
                ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
                rrect(ctx, x4, Y4S, BW2, BH2, 7); ctx.fill(); ctx.stroke();
                ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = '#ea580c'; ctx.fillText('↑', x4 + BW2 * 0.35, Y4S + BH2 / 2);
                if (has4s2) { ctx.fillStyle = '#1d4ed8'; ctx.fillText('↓', x4 + BW2 * 0.65, Y4S + BH2 / 2); }
                ctx.restore();
                // 3d label + boxes
                ctx.save(); ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#475569'; ctx.textAlign = 'right';
                ctx.textBaseline = 'middle'; ctx.fillText('3d', sdx - 10, Y3D + BH2 / 2); ctx.restore();
                for (let bi = 0; bi < 5; bi++) {
                    const bx = sdx + bi * (BW2 + BG2);
                    ctx.save();
                    const hlAct = isActual && d_up === 5;
                    ctx.fillStyle = hlAct ? '#fef3c7' : '#f8fafc';
                    ctx.strokeStyle = hlAct ? '#d97706' : '#94a3b8'; ctx.lineWidth = hlAct ? 2 : 1.5;
                    rrect(ctx, bx, Y3D, BW2, BH2, 7); ctx.fill(); ctx.stroke();
                    ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    if (bi < d_up) { ctx.fillStyle = '#ea580c'; ctx.fillText('↑', bx + BW2 * 0.35, Y3D + BH2 / 2); }
                    if (bi < d_dn) { ctx.fillStyle = '#1d4ed8'; ctx.fillText('↓', bx + BW2 * 0.65, Y3D + BH2 / 2); }
                    ctx.restore();
                }
            }

            if (isCr) {
                miniOrbits(COL1, true, 4, 0, false);
                miniOrbits(COL2, false, 5, 0, true);
            } else {
                miniOrbits(COL1, true, 5, 4, false);
                miniOrbits(COL2, false, 5, 5, true);
            }

            // config labels
            ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 15px monospace';
            ctx.fillStyle = '#64748b'; ctx.fillText(`[Ar] ${expCfg}`, COL1, 300);
            ctx.fillStyle = '#16a34a'; ctx.fillText(`[Ar] ${actCfg}`, COL2, 300);
            ctx.restore();

            // exchange count badges
            [{ cx: COL1, count: expEx, col: '#64748b', bg: '#f1f5f9' },
             { cx: COL2, count: actEx, col: '#d97706', bg: '#fef3c7' }].forEach(({ cx, count, col, bg }) => {
                ctx.save();
                ctx.beginPath(); ctx.arc(cx, 355, 38, 0, Math.PI * 2);
                ctx.fillStyle = bg; ctx.fill();
                ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
                ctx.fillStyle = col; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(String(count), cx, 353);
                ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#64748b'; ctx.textBaseline = 'top';
                ctx.fillText('exchanges', cx, 395);
                ctx.restore();
            });

            // hop arrow
            const arX1 = COL1 + 145, arX2 = COL2 - 145, arY = 430;
            ctx.save();
            ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(arX1, arY); ctx.lineTo(arX2, arY); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(arX2, arY); ctx.lineTo(arX2 - 12, arY - 6); ctx.moveTo(arX2, arY); ctx.lineTo(arX2 - 12, arY + 6); ctx.stroke();
            ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#d97706'; ctx.textAlign = 'center';
            ctx.fillText('1 electron hops 4s → 3d', 640, arY - 11);
            ctx.restore();

            // gain label
            ctx.save(); ctx.font = 'bold 15px sans-serif'; ctx.fillStyle = '#1e293b'; ctx.textAlign = 'center';
            ctx.fillText(`Exchange gain: ${expEx} → ${actEx}  (+${actEx - expEx} pairs) · ${isCr ? 'half-filled' : 'fully-filled'} 3d = extra stability`, 640, 476);
            ctx.restore();

            // NCERT quote
            ctx.save(); ctx.font = 'italic 13px sans-serif'; ctx.fillStyle = '#64748b'; ctx.textAlign = 'center';
            ctx.fillText('"An electron shifts from a subshell of lower energy (4s) to a subshell of higher energy (3d),', 640, 538);
            ctx.fillText('provided such a shift results in all orbitals of the subshell of higher energy getting half/fully filled."', 640, 556);
            ctx.fillText('— NCERT Chemistry Ch 2, §2.6.6', 640, 576);
            ctx.restore();
        }
    }, [mode, Z, dCount, anomEl]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let alive = true;
        const loop = () => {
            if (!alive) return;
            if (!paused) draw(ctx);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => { alive = false; cancelAnimationFrame(rafRef.current); };
    }, [draw, paused]);

    const handleReset = () => { setZ(6); setDCount(5); setAnomEl('cr'); setPaused(false); };

    const currentFill = mode === 'anomalous'
        ? (anomEl === 'cr' ? CR_FILL : CU_FILL)
        : NORMAL_FILL;
    const currentZ = mode === 'anomalous' ? (anomEl === 'cr' ? 24 : 29) : mode === 'hund' ? Math.max(5, Math.min(10, Z)) : Z;
    const dInConfig = currentFill.slice(0, currentZ).filter(e => e.gi === 6).length;
    const liveExchange = mode === 'exchange' ? exchangeCount(dCount) : exchangeCount(dInConfig);

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50">
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>

            {/* Left aside */}
            <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
                <div className="flex flex-col gap-2.5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                        <div className="text-base font-extrabold text-slate-900">Aufbau Fill Order</div>
                        <div className="text-xs font-semibold text-slate-500 mb-2">n+l rule — lower value fills first</div>
                        <svg width="310" height="200" viewBox="0 0 310 200">
                            {ORBITALS.map((o, i) => {
                                const ys = [182, 158, 134, 110, 86, 62, 38];
                                const cols = ['#0891b2','#0891b2','#d97706','#16a34a','#d97706','#dc2626','#d97706'];
                                return (
                                    <g key={o.name}>
                                        <rect x="18" y={ys[i] - 10} width="76" height="18" rx="4" fill={cols[i] + '22'} stroke={cols[i]} strokeWidth="1.2" />
                                        <text x="56" y={ys[i] + 4} textAnchor="middle" fontSize="12" fontWeight="bold" fill={cols[i]} fontFamily="monospace">{o.name}</text>
                                        <text x="104" y={ys[i] + 4} fontSize="11" fill="#64748b" fontFamily="sans-serif">n+l={o.nl} · cap={o.boxes * 2}e</text>
                                    </g>
                                );
                            })}
                            <text x="155" y="197" fontSize="9" fill="#94a3b8" textAnchor="middle">4s (n+l=4) fills before 3d (n+l=5) — key NCERT anomaly</text>
                        </svg>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                        <div className="text-base font-extrabold text-slate-900">3d Exchange Counts</div>
                        <div className="text-xs font-semibold text-slate-500 mb-2">Peaks at d⁵ (10) and d¹⁰ (20)</div>
                        <svg width="310" height="150" viewBox="0 0 310 150">
                            {[0,1,3,6,10,10,11,13,16,20].map((count, i) => {
                                const bh = (count / 20) * 110;
                                const bx = 12 + i * 28;
                                const hl = i === 4 || i === 9;
                                return (
                                    <g key={i}>
                                        <rect x={bx} y={128 - bh} width="20" height={bh} rx="3"
                                            fill={hl ? '#d97706' : (i < 5 ? '#fdba7488' : '#93c5fd88')} />
                                        <text x={bx + 10} y="142" textAnchor="middle" fontSize="9" fill="#475569" fontFamily="sans-serif">d{i+1}</text>
                                        {hl && <text x={bx + 10} y={128 - bh - 3} textAnchor="middle" fontSize="10" fill="#d97706" fontWeight="bold">{count}</text>}
                                    </g>
                                );
                            })}
                            <line x1="8" y1="128" x2="295" y2="128" stroke="#e2e8f0" strokeWidth="1" />
                        </svg>
                    </div>
                </div>
            </aside>

            {/* Right aside */}
            <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
                <div className="flex flex-col gap-3">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl">
                        <div className="text-base font-extrabold text-amber-900">Three Filling Rules</div>
                        <div className="text-xs font-semibold text-amber-700 mb-2">NCERT Ch 2 §2.6.4–2.6.6</div>
                        <ul className="text-sm leading-snug text-amber-950 space-y-1.5">
                            <li><span className="font-bold">Aufbau:</span> Fill in order of increasing energy (n+l rule). 4s fills before 3d.</li>
                            <li><span className="font-bold">Pauli:</span> Max 2 electrons per orbital, opposite spins. Max in shell n = 2n².</li>
                            <li><span className="font-bold">Hund's:</span> Pairing only after each orbital in the subshell is singly occupied with parallel spins.</li>
                            <li className="pt-1 border-t border-amber-200"><span className="font-bold">Extra Stability:</span> Half-filled and fully-filled subshells are stable due to (i) symmetrical electron distribution, (ii) maximum exchange energy.</li>
                            <li><span className="font-bold">Anomalous:</span> Cr = [Ar]3d⁵4s¹ · Cu = [Ar]3d¹⁰4s¹</li>
                        </ul>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="font-bold text-slate-800">Real-time Values</div>
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">LIVE</span>
                        </div>
                        <div className="space-y-2">
                            <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Element</div>
                                <div className="mt-1 font-mono text-base font-extrabold text-amber-700">
                                    {ELEMENTS[currentZ] ?? '—'} (Z = {currentZ})
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Configuration</div>
                                <div className="mt-1 font-mono text-sm font-extrabold text-amber-700 leading-tight">
                                    {mode === 'anomalous'
                                        ? configStr(anomEl === 'cr' ? CR_FILL : CU_FILL, currentZ)
                                        : configStr(NORMAL_FILL, currentZ)}
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">3d Exchange Pairs</div>
                                <div className="mt-1 font-mono text-base font-extrabold text-amber-700">{liveExchange}</div>
                            </div>
                            {(currentZ === 24 || currentZ === 29) && mode !== 'anomalous' && (
                                <div className="rounded-lg border border-amber-300 bg-amber-100 px-3 py-2">
                                    <div className="text-xs font-bold text-amber-900">⚠ Anomalous element</div>
                                    <div className="mt-0.5 text-xs text-amber-800">Switch to Anomalous mode to see the actual vs expected config.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow">
            <div className="flex items-center gap-2">
                <Atom size={18} className="text-blue-600" />
                <span className="font-bold text-slate-800">Electronic Configuration Bench</span>
            </div>
            <div>
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Mode</div>
                <div className="flex gap-2 flex-wrap">
                    {([
                        ['aufbau', 'Aufbau Builder'],
                        ['hund', "Hund's Rule"],
                        ['exchange', 'Exchange Energy'],
                        ['anomalous', 'Anomalous Configs'],
                    ] as [Mode, string][]).map(([m, label]) => (
                        <button key={m} onClick={() => setMode(m)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${mode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
                {(mode === 'aufbau' || mode === 'hund') && (
                    <>
                        <div>
                            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Element selector</div>
                                    <div className="text-sm font-extrabold text-slate-900">
                                        {ELEMENTS[currentZ]} (Z = {currentZ})
                                    </div>
                                </div>
                                <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                                    {mode === 'hund' ? 'Hund examples: B to Ne' : 'Visible range: H to Cu'}
                                </div>
                            </div>
                            <div className="grid grid-cols-[repeat(10,minmax(42px,1fr))] gap-1.5">
                                {ELEMENT_OPTIONS.map(({ atomicNumber, symbol }) => {
                                    const isHundLocked = mode === 'hund' && (atomicNumber < 5 || atomicNumber > 10);
                                    const isSelected = currentZ === atomicNumber;
                                    return (
                                        <button
                                            key={atomicNumber}
                                            type="button"
                                            disabled={isHundLocked}
                                            onClick={() => setZ(atomicNumber)}
                                            className={`h-12 rounded-lg border text-center transition ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-600 text-white shadow'
                                                    : isHundLocked
                                                        ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                                            }`}
                                            title={`${symbol}, Z=${atomicNumber}`}
                                        >
                                            <span className="block text-[10px] font-bold leading-none opacity-75">{atomicNumber}</span>
                                            <span className="mt-0.5 block text-sm font-black leading-none">{symbol}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Current configuration</div>
                            <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm font-extrabold leading-tight text-blue-700">
                                {configStr(NORMAL_FILL, currentZ)}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {[6, 7, 8, 24, 29].map(atomicNumber => (
                                    <button
                                        key={atomicNumber}
                                        type="button"
                                        onClick={() => setZ(atomicNumber)}
                                        disabled={mode === 'hund' && (atomicNumber < 5 || atomicNumber > 10)}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
                                    >
                                        {ELEMENTS[atomicNumber]} (Z={atomicNumber})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                {mode === 'exchange' && (
                    <>
                        <div>
                            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">3d electron selector</div>
                                    <div className="text-sm font-extrabold text-slate-900">
                                        d{dCount} gives {exchangeCount(dCount)} exchange pairs
                                    </div>
                                </div>
                                <div className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                                    Pick d5 or d10 to see maximum stability
                                </div>
                            </div>
                            <div className="grid grid-cols-[repeat(11,minmax(42px,1fr))] gap-1.5">
                                {D_OPTIONS.map(value => {
                                    const isSelected = dCount === value;
                                    const isStable = value === 5 || value === 10;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setDCount(value)}
                                            className={`h-14 rounded-lg border text-center transition ${
                                                isSelected
                                                    ? 'border-amber-500 bg-amber-500 text-white shadow'
                                                    : isStable
                                                        ? 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400'
                                                        : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50'
                                            }`}
                                            title={`d${value}, exchange pairs=${exchangeCount(value)}`}
                                        >
                                            <span className="block text-sm font-black leading-none">d{value}</span>
                                            <span className="mt-1 block text-[10px] font-bold leading-none opacity-80">{exchangeCount(value)} pairs</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Stability cue</div>
                            <div className="mt-2 text-sm font-bold leading-snug text-amber-950">
                                Half-filled d5 and fully-filled d10 arrangements show higher exchange energy and extra stability.
                            </div>
                            <div className="mt-3 rounded-lg bg-white px-3 py-2 font-mono text-sm font-extrabold text-amber-700">
                                Exchanges = {exchangeCount(dCount)}
                            </div>
                        </div>
                    </>
                )}
                {mode === 'anomalous' && (
                    <div className="lg:col-span-2">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Anomalous element</div>
                        <div className="grid max-w-xl grid-cols-2 gap-2">
                            <button onClick={() => setAnomEl('cr')}
                                className={`rounded-xl border px-4 py-3 text-left font-bold ${anomEl === 'cr' ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
                                <span className="block text-base">Cr (Z=24)</span>
                                <span className="block text-xs opacity-80">[Ar] 3d5 4s1</span>
                            </button>
                            <button onClick={() => setAnomEl('cu')}
                                className={`rounded-xl border px-4 py-3 text-left font-bold ${anomEl === 'cu' ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
                                <span className="block text-base">Cu (Z=29)</span>
                                <span className="block text-xs opacity-80">[Ar] 3d10 4s1</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="hidden">
                {(mode === 'aufbau' || mode === 'hund') && (
                    <div className="flex-1 min-w-[220px]">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                            Atomic Number — Z = {mode === 'hund' ? Math.max(5, Math.min(10, Z)) : Z}
                            &nbsp;({mode === 'hund' ? (ELEMENTS[Math.max(5, Math.min(10, Z))] ?? '') : (ELEMENTS[Z] ?? '')})
                        </div>
                        <input type="range" min={mode === 'hund' ? 5 : 1} max={mode === 'hund' ? 10 : 29}
                            value={Z} onChange={e => setZ(Number(e.target.value))}
                            className="w-full accent-blue-600" />
                        <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                            <span>{mode === 'hund' ? 'B (5)' : 'H (1)'}</span>
                            <span>{mode === 'hund' ? 'Ne (10)' : 'Cu (29)'}</span>
                        </div>
                    </div>
                )}
                {mode === 'exchange' && (
                    <div className="flex-1 min-w-[220px]">
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">
                            3d electrons = {dCount} · Exchanges = {exchangeCount(dCount)}
                        </div>
                        <input type="range" min={0} max={10} value={dCount}
                            onChange={e => setDCount(Number(e.target.value))}
                            className="w-full accent-amber-600" />
                        <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                            <span>d⁰</span><span>d⁵ (half-filled)</span><span>d¹⁰ (full)</span>
                        </div>
                    </div>
                )}
                {mode === 'anomalous' && (
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Element</div>
                        <div className="flex gap-2">
                            <button onClick={() => setAnomEl('cr')}
                                className={`px-4 py-2 rounded-lg font-bold border ${anomEl === 'cr' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-300'}`}>
                                Cr (Z=24)
                            </button>
                            <button onClick={() => setAnomEl('cu')}
                                className={`px-4 py-2 rounded-lg font-bold border ${anomEl === 'cu' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-300'}`}>
                                Cu (Z=29)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
            simulationStageWidth={W}
            simulationStageHeight={H}
        />
    );
}
