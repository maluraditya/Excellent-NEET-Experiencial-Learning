import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, FlaskConical, Pause, Play, RotateCcw, RotateCw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface GeometricalIsomerismProps {
    topic: Topic;
    onExit: () => void;
}

type Mode = 'map' | 'rotation' | 'but2ene' | 'optical';
type But2eneForm = 'cis' | 'trans';
type SuperimposePhase = 'idle' | 'going' | 'returning';

interface SparkParticle {
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; color: string; r: number;
}

const W = 1280;
const H = 760;

const MODES: { id: Mode; label: string; short: string }[] = [
    { id: 'map',      label: 'Isomerism map',        short: 'Flowchart' },
    { id: 'rotation', label: 'Restricted rotation',  short: 'C=C lock'  },
    { id: 'but2ene',  label: 'But-2-ene cis/trans',  short: 'cis/trans'  },
    { id: 'optical',  label: 'Optical isomerism',    short: 'mirror'     },
];

const flowNodes = [
    { label: 'Isomerism',           x: 640,  y: 110, w: 210, h: 54, tone: '#0f172a' },
    { label: 'Structural',          x: 360,  y: 245, w: 230, h: 54, tone: '#1d4ed8' },
    { label: 'Stereoisomerism',     x: 920,  y: 245, w: 250, h: 54, tone: '#7c3aed' },
    { label: 'Chain',               x: 145,  y: 405, w: 140, h: 48, tone: '#2563eb' },
    { label: 'Position',            x: 315,  y: 405, w: 150, h: 48, tone: '#2563eb' },
    { label: 'Functional group',    x: 500,  y: 405, w: 190, h: 48, tone: '#2563eb' },
    { label: 'Metamerism',          x: 705,  y: 405, w: 160, h: 48, tone: '#2563eb' },
    { label: 'Geometrical',         x: 900,  y: 405, w: 170, h: 48, tone: '#dc2626' },
    { label: 'Optical',             x: 1100, y: 405, w: 140, h: 48, tone: '#16a34a' },
];

const modeText: Record<Mode, { title: string; ncert: string; body: string[] }> = {
    map: {
        title: 'NCERT Isomerism Classification',
        ncert: 'Class 11 Chemistry — Sec. 8.6.1-8.6.2',
        body: [
            'Isomerism branches into structural isomerism and stereoisomerism.',
            'Structural includes chain, position, functional group, and metamerism.',
            'Stereoisomerism: same bond sequence, different relative positions in space.',
            'NCERT places geometrical and optical isomerism under stereoisomerism.',
        ],
    },
    rotation: {
        title: 'Why C=C Restricts Rotation',
        ncert: 'Class 11 Chemistry — Sec. 9.3.3',
        body: [
            'Single bonds (σ only) allow free 360° rotation around the bond axis.',
            'The π bond forms by lateral overlap of parallel p orbitals above/below the σ bond.',
            'Twisting one carbon breaks the parallel p-orbital alignment, destroying the π bond.',
            'Synthesis: Lindlar\'s catalyst → cis-alkene. Na/liq. NH₃ → trans-alkene (NCERT Eq. 9.30-9.31).',
        ],
    },
    but2ene: {
        title: 'Primary NCERT Example: But-2-ene',
        ncert: 'Class 11 Chemistry — Sec. 9.3.3',
        body: [
            'But-2-ene (CH₃–CH=CH–CH₃) is NCERT\'s canonical geometrical isomer example.',
            'cis-But-2-ene: both CH₃ same side → b.p. 277 K, μ = 0.33 D (polar).',
            'trans-But-2-ene: CH₃ opposite sides → b.p. 274 K, μ ≈ 0 (non-polar).',
            'trans has higher melting point due to better crystal packing symmetry.',
        ],
    },
    optical: {
        title: 'Optical Isomerism — Enantiomers',
        ncert: 'Class 11 Sec. 8.6.2  ·  Class 12 preview',
        body: [
            'A carbon bonded to 4 different groups is an asymmetric/chiral carbon (C*).',
            'Enantiomers are non-superimposable mirror images of each other.',
            'They have identical melting point, boiling point, and solubility.',
            'They differ in the direction they rotate plane-polarised light (+/−).',
        ],
    },
};

// ─── MATH HELPERS ──────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function ease(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// ─── DRAW PRIMITIVES ───────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function drawGrid(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(640, 350, 40, 640, 350, 560);
    glow.addColorStop(0, 'rgba(124,58,237,0.07)');
    glow.addColorStop(0.6, 'rgba(14,165,233,0.04)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(15,23,42,0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawAtom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, label: string, fill: string, stroke = '#0f172a', glowCol?: string) {
    if (glowCol) {
        ctx.save();
        ctx.shadowColor = glowCol;
        ctx.shadowBlur = 30;
        ctx.fillStyle = glowCol + '22';
        ctx.beginPath(); ctx.arc(x, y, r + 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.3, fill);
    g.addColorStop(1, fill);
    ctx.save();
    ctx.shadowColor = 'rgba(15,23,42,0.22)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = stroke; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.font = `900 ${Math.max(11, Math.round(r * 0.72))}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = (label === 'C' || label === 'C*') ? '#ffffff' : '#0f172a';
    ctx.fillText(label, x, y + 1);
}

function drawBond(ctx: CanvasRenderingContext2D, a: { x: number; y: number }, b: { x: number; y: number }, color = '#475569', width = 6) {
    ctx.save();
    ctx.shadowColor = 'rgba(15,23,42,0.12)'; ctx.shadowBlur = 6;
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, progress = 1) {
    if (progress <= 0) return;
    const tx = lerp(x1, x2, progress);
    const ty = lerp(y1, y2, progress);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 10;
    ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(tx, ty); ctx.stroke();
    if (progress > 0.8) {
        const a = clamp((progress - 0.8) / 0.2, 0, 1);
        ctx.globalAlpha = a;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - 14 * Math.cos(ang - Math.PI / 6), ty - 14 * Math.sin(ang - Math.PI / 6));
        ctx.lineTo(tx - 14 * Math.cos(ang + Math.PI / 6), ty - 14 * Math.sin(ang + Math.PI / 6));
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
    }
    ctx.restore();
}

function drawCaption(ctx: CanvasRenderingContext2D, title: string, sub: string, tag: string) {
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#0f172a'; ctx.font = '900 24px sans-serif';
    ctx.fillText(title, 34, 48);
    ctx.fillStyle = '#475569'; ctx.font = '600 12px sans-serif';
    ctx.fillText(sub, 35, 70);
    ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
    roundRect(ctx, 35, 86, 196, 30, 15); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#92400e'; ctx.font = '800 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tag, 133, 101);
}

function drawSparks(ctx: CanvasRenderingContext2D, sparks: SparkParticle[]) {
    sparks.forEach(p => {
        const t = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = t * 0.9;
        ctx.shadowColor = p.color; ctx.shadowBlur = 12;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.3 + t * 0.7), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
}

// ─── FLOWCHART ─────────────────────────────────────────────────────────────────

function drawFlowchart(ctx: CanvasRenderingContext2D, activeMode: Mode, time: number) {
    drawCaption(ctx, 'Isomerism flowchart', 'NCERT Class 11 Organic Chemistry — Sec. 8.6.1-8.6.2', 'classification map');

    const dashOff = (time * 55) % 28;

    const drawLine = (from: number, to: number, animated: boolean) => {
        const a = flowNodes[from], b = flowNodes[to];
        const x1 = a.x, y1 = a.y + a.h / 2;
        const x2 = b.x, y2 = b.y - b.h / 2;
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.save();
        if (animated) {
            ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 8;
            ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 3;
            ctx.setLineDash([10, 6]); ctx.lineDashOffset = -dashOff;
        } else {
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.5; ctx.setLineDash([]);
        }
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = animated ? '#a78bfa' : '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 11 * Math.cos(ang - Math.PI / 7), y2 - 11 * Math.sin(ang - Math.PI / 7));
        ctx.lineTo(x2 - 11 * Math.cos(ang + Math.PI / 7), y2 - 11 * Math.sin(ang + Math.PI / 7));
        ctx.closePath(); ctx.fill();
        ctx.restore();
    };

    drawLine(0, 1, false);
    drawLine(0, 2, true);
    [3, 4, 5, 6].forEach(i => drawLine(1, i, false));
    [7, 8].forEach(i => drawLine(2, i, true));

    flowNodes.forEach((node, i) => {
        const isStereo = i === 2 || i === 7 || i === 8;
        const isActive = (activeMode === 'map' && (i === 0 || i === 2 || i === 7 || i === 8))
            || (activeMode === 'but2ene' && i === 7)
            || (activeMode === 'optical' && i === 8);
        const pulse = isActive ? 1 + 0.07 * Math.sin(time * 4 + i) : 1;
        const pw = node.w * pulse, ph = node.h * pulse;
        if (isActive) {
            ctx.save();
            ctx.shadowColor = node.tone;
            ctx.shadowBlur = 22 + 8 * Math.sin(time * 4 + i);
        }
        ctx.fillStyle = isActive ? node.tone : '#f8fafc';
        ctx.strokeStyle = isActive ? node.tone : isStereo ? '#a78bfa' : '#cbd5e1';
        ctx.lineWidth = isActive ? 3 : isStereo ? 2.5 : 1.8;
        roundRect(ctx, node.x - pw / 2, node.y - ph / 2, pw, ph, 14);
        ctx.fill();
        if (isActive) ctx.restore();
        ctx.strokeStyle = isActive ? node.tone : isStereo ? '#a78bfa' : '#cbd5e1';
        ctx.lineWidth = isActive ? 3 : isStereo ? 2.5 : 1.8;
        ctx.stroke();
        ctx.fillStyle = isActive ? '#ffffff' : isStereo ? '#5b21b6' : '#1e293b';
        ctx.font = `${isActive ? 900 : 700} ${isActive ? 18 : 16}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y + 1);
    });

    ctx.fillStyle = '#ecfdf5'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1.5;
    roundRect(ctx, 268, 558, 744, 80, 18); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#14532d'; ctx.font = '800 16px sans-serif'; ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Stereoisomerism: same covalent-bond sequence, different positions in space', 640, 585);
    ctx.fillStyle = '#166534'; ctx.font = '600 12px sans-serif';
    ctx.fillText('Navigate → C=C lock  ·  cis/trans  ·  mirror  to explore each branch', 640, 610);
}

// ─── C=C LOCK ──────────────────────────────────────────────────────────────────

function drawDoubleBondLock(
    ctx: CanvasRenderingContext2D,
    twist: number,
    time: number,
    sparks: SparkParticle[],
) {
    drawCaption(ctx, 'Restricted rotation around C=C', 'The π bond requires parallel p-orbital overlap — twisting destroys it.', 'two-cardboard analogy');

    const broken = twist > 18;
    const breakPct = clamp((twist - 18) / 27, 0, 1);
    const shake = Math.sin(time * 12) * clamp(twist / 45, 0, 1) * 8;
    const left = { x: 470, y: 380 };
    const right = { x: 810, y: 380 };

    // Cardboard panels
    ctx.save(); ctx.translate(640, 380);
    const panelFill = broken ? 'rgba(254,226,226,0.78)' : 'rgba(254,243,199,0.72)';
    const panelStroke = broken ? '#ef4444' : '#f59e0b';
    ctx.fillStyle = panelFill; ctx.strokeStyle = panelStroke; ctx.lineWidth = 2;
    roundRect(ctx, -392, -168, 300, 336, 18); ctx.fill(); ctx.stroke();
    ctx.translate(shake, -shake * 0.7);
    ctx.fillStyle = panelFill; ctx.strokeStyle = panelStroke;
    roundRect(ctx, 92, -168, 300, 336, 18); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Sigma bond
    ctx.save();
    ctx.shadowColor = '#334155'; ctx.shadowBlur = 10;
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(left.x, left.y - 10); ctx.lineTo(right.x, right.y - 10 + shake); ctx.stroke();
    ctx.restore();

    // Pi bond (normal) or cracked
    if (!broken) {
        ctx.save();
        ctx.shadowColor = '#2563eb'; ctx.shadowBlur = 14;
        ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(left.x, left.y + 12); ctx.lineTo(right.x, right.y + 12 - shake); ctx.stroke();
        ctx.restore();
    } else {
        // Animated zigzag crack
        const flashIntensity = 0.5 + 0.5 * Math.sin(time * 22);
        ctx.save();
        ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 18 + 10 * flashIntensity;
        ctx.strokeStyle = `rgba(220,38,38,${0.6 + 0.4 * flashIntensity})`;
        ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.setLineDash([14, 6]); ctx.lineDashOffset = -(time * 50) % 20;
        const py = left.y + 12;
        ctx.beginPath(); ctx.moveTo(left.x, py);
        for (let s = 1; s <= 7; s++) {
            const px = lerp(left.x, right.x, s / 7);
            const dy = (s % 2 === 0 ? -1 : 1) * 14 * breakPct - shake * 0.4;
            ctx.lineTo(px, py + dy);
        }
        ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
        // Energy badge
        ctx.save();
        ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(254,226,226,0.97)'; ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
        roundRect(ctx, 456, 458, 368, 52, 16); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#991b1b'; ctx.font = '900 15px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⚡  Pi bond breaking! Energy ≈ 260 kJ/mol required', 640, 484);
        ctx.restore();
    }

    // p-orbitals with breathing pulse
    const pOrbital = (x: number, flip: number) => {
        const pulse = 1 + (broken ? 0 : 0.06 * Math.sin(time * 3 + x));
        ctx.save();
        if (!broken) { ctx.shadowColor = '#2563eb'; ctx.shadowBlur = 14; }
        ctx.fillStyle = broken ? `rgba(220,38,38,${0.12 + 0.06 * Math.sin(time * 18)})` : 'rgba(37,99,235,0.20)';
        ctx.strokeStyle = broken ? '#dc2626' : '#2563eb'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(x, 280 + flip * shake, 48 * pulse, 112 * pulse, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, 480 - flip * shake, 48 * pulse, 112 * pulse, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.restore();
    };
    pOrbital(left.x, 1); pOrbital(right.x, -1);

    // Substituent dots
    [[left.x, left.y - 10], [right.x, right.y - 10 + shake],
     [left.x, left.y + 12], [right.x, right.y + 12 - shake]].forEach(([x, y]) => {
        ctx.fillStyle = '#475569'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });

    drawAtom(ctx, left.x, left.y, 36, 'C', '#334155');
    drawAtom(ctx, right.x, right.y, 36, 'C', '#334155');

    const lUp = { x: 330, y: 250 }, lDown = { x: 330, y: 510 };
    const rUp = { x: 950, y: 250 + shake }, rDown = { x: 950, y: 510 - shake };
    [lUp, lDown].forEach(p => drawBond(ctx, left, p, '#64748b', 5));
    [rUp, rDown].forEach(p => drawBond(ctx, right, p, '#64748b', 5));
    drawAtom(ctx, lUp.x, lUp.y, 34, 'X', '#fde68a', '#b45309');
    drawAtom(ctx, lDown.x, lDown.y, 28, 'Y', '#e0f2fe', '#0369a1');
    drawAtom(ctx, rUp.x, rUp.y, 34, 'X', '#fde68a', '#b45309');
    drawAtom(ctx, rDown.x, rDown.y, 28, 'Y', '#e0f2fe', '#0369a1');

    // Synthesis link badge (bottom-left)
    ctx.fillStyle = '#f0fdf4'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 1.5;
    roundRect(ctx, 30, 620, 348, 76, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#14532d'; ctx.font = '700 12px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Synthesis link (NCERT Eq. 9.30–9.31):', 46, 632);
    ctx.fillStyle = '#166534'; ctx.font = '600 11px sans-serif';
    ctx.fillText('Alkyne + Lindlar\'s cat.   →  cis-alkene', 46, 652);
    ctx.fillText('Alkyne + Na / liq. NH₃  →  trans-alkene', 46, 670);

    // Status bar
    ctx.fillStyle = broken ? '#fee2e2' : '#dbeafe';
    ctx.strokeStyle = broken ? '#dc2626' : '#2563eb'; ctx.lineWidth = 2;
    roundRect(ctx, 462, 620, 360, 48, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = broken ? '#991b1b' : '#1e40af';
    ctx.font = '800 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(broken ? 'π bond BROKEN — rotation is restricted!' : 'Parallel p-orbitals keep the π bond intact', 642, 644);

    // Twist-resistance arc
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.arc(810, 380, 126, -0.8, 0.8); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#991b1b'; ctx.font = '800 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('twist resisted by π bond', 810, 225);

    // Sparks
    drawSparks(ctx, sparks);
}

// ─── BUT-2-ENE (morphing cis ↔ trans) ─────────────────────────────────────────

function drawBut2ene(
    ctx: CanvasRenderingContext2D,
    morphT: number,        // 0 = cis, 1 = trans (smooth)
    showDipoles: boolean,
    dipoleProgress: number, // 0..1 (animates arrows in)
    time: number,
) {
    const isCis = morphT < 0.5;
    const em = ease(morphT);

    drawCaption(
        ctx,
        isCis ? 'cis-But-2-ene' : 'trans-But-2-ene',
        'NCERT primary example — CH₃–CH=CH–CH₃  (Sec. 9.3.3)',
        isCis ? 'b.p. 277 K  |  μ = 0.33 D' : 'b.p. 274 K  |  μ ≈ 0',
    );

    const c1 = { x: 540, y: 380 };
    const c2 = { x: 740, y: 380 };
    const ch3L = { x: 360, y: 250 };
    const hL   = { x: 360, y: 510 };
    // Right substituents morph: cis → both same side (top); trans → opposite (bottom)
    const ch3R = { x: 920, y: lerp(250, 510, em) };
    const hR   = { x: 920, y: lerp(510, 250, em) };

    // Polarity halo: emerald for polar cis, slate for non-polar trans
    const haloA = lerp(0.20, 0.07, em);
    const haloR1 = lerp(16, 100, em), haloG1 = lerp(185, 116, em), haloB1 = lerp(129, 139, em);
    const halo = ctx.createRadialGradient(640, 380, 60, 640, 380, 360);
    halo.addColorStop(0, `rgba(${Math.round(haloR1)},${Math.round(haloG1)},${Math.round(haloB1)},${haloA})`);
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo; ctx.fillRect(200, 100, 880, 580);

    // Double bond (σ + π)
    ctx.save();
    ctx.shadowColor = '#334155'; ctx.shadowBlur = 10;
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(c1.x, c1.y - 9); ctx.lineTo(c2.x, c2.y - 9); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = '#2563eb'; ctx.shadowBlur = 14;
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(c1.x, c1.y + 11); ctx.lineTo(c2.x, c2.y + 11); ctx.stroke();
    ctx.restore();

    [ch3L, hL].forEach(p => drawBond(ctx, c1, p, '#64748b', 6));
    [ch3R, hR].forEach(p => drawBond(ctx, c2, p, '#64748b', 6));

    drawAtom(ctx, c1.x, c1.y, 36, 'C', '#334155');
    drawAtom(ctx, c2.x, c2.y, 36, 'C', '#334155');
    drawAtom(ctx, ch3L.x, ch3L.y, 50, 'CH₃', '#fde68a', '#b45309');
    drawAtom(ctx, ch3R.x, ch3R.y, 50, 'CH₃', '#fde68a', '#b45309');
    drawAtom(ctx, hL.x,   hL.y,   28, 'H',   '#f8fafc', '#94a3b8');
    drawAtom(ctx, hR.x,   hR.y,   28, 'H',   '#f8fafc', '#94a3b8');

    // Reference axis
    ctx.strokeStyle = 'rgba(148,163,184,0.45)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(260, 380); ctx.lineTo(1020, 380); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8'; ctx.font = '600 11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('reference axis', 266, 374);

    // Dipole arrows (animated in)
    if (showDipoles && dipoleProgress > 0) {
        const dp = dipoleProgress;
        // Left C → CH₃ dipole
        drawArrow(ctx, c1.x - 15, c1.y - 20, ch3L.x + 44, ch3L.y + 30, '#dc2626', dp);
        // Right C → CH₃ dipole (follows morphed position)
        const rightDY = ch3R.y < 380 ? 30 : -30;
        drawArrow(ctx, c2.x + 15, c2.y - 20, ch3R.x - 44, ch3R.y + rightDY, '#dc2626', dp);

        if (isCis) {
            // Net pulsing upward arrow
            const pulse = 1 + 0.13 * Math.sin(time * 3.2);
            const arrowLen = 110 * pulse * dp;
            ctx.save();
            ctx.shadowColor = '#d97706'; ctx.shadowBlur = 20 + 8 * Math.sin(time * 3.2);
            drawArrow(ctx, 640, 385, 640, 385 - arrowLen, '#d97706', dp);
            ctx.restore();
            ctx.globalAlpha = dp;
            ctx.fillStyle = '#92400e'; ctx.font = '900 15px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
            ctx.fillText('net μ = 0.33 D', 640, 375 - arrowLen);
            ctx.globalAlpha = 1;
        } else {
            // Cancellation X
            ctx.save();
            ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 8;
            ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 5 * dp; ctx.lineCap = 'round';
            ctx.globalAlpha = dp;
            ctx.beginPath();
            ctx.moveTo(608, 348); ctx.lineTo(672, 412);
            ctx.moveTo(672, 348); ctx.lineTo(608, 412);
            ctx.stroke();
            ctx.restore();
            ctx.globalAlpha = dp;
            ctx.fillStyle = '#991b1b'; ctx.font = '900 15px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
            ctx.fillText('μ = 0  (dipoles cancel)', 640, 450);
            ctx.globalAlpha = 1;
        }
    }

    // Property badges
    const badges = isCis
        ? [{ label: 'Polar (μ = 0.33 D)', x: 286, y: 175, fill: '#dcfce7', text: '#166534' },
           { label: 'b.p. 277 K (higher)', x: 990, y: 175, fill: '#fef3c7', text: '#92400e' }]
        : [{ label: 'Non-polar (μ ≈ 0)',   x: 286, y: 175, fill: '#fee2e2', text: '#991b1b' },
           { label: 'b.p. 274 K (lower)',  x: 990, y: 175, fill: '#e0f2fe', text: '#075985' }];
    badges.forEach(b => {
        ctx.fillStyle = b.fill; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
        roundRect(ctx, b.x - 82, b.y - 18, 164, 36, 18); ctx.fill(); ctx.stroke();
        ctx.fillStyle = b.text; ctx.font = '800 12px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.label, b.x, b.y + 1);
    });

    // Orientation label
    ctx.fillStyle = '#475569'; ctx.font = '700 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(isCis ? 'CH₃ groups on the same side' : 'CH₃ groups on opposite sides', 640, 592);

    // Condition note (bottom)
    ctx.fillStyle = '#f0f9ff'; ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 1.5;
    roundRect(ctx, 680, 612, 312, 46, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0369a1'; ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Condition: each C of C=C must have two different groups', 836, 635);
    ctx.fillText('e.g. CH₂=CBr₂ fails — two identical groups on one C', 836, 650);
}

// ─── OPTICAL ISOMERISM ─────────────────────────────────────────────────────────

function drawOpticalPreview(
    ctx: CanvasRenderingContext2D,
    showMirror: boolean,
    time: number,
    superimposeT: number, // 0..1..0
    superimposePhase: SuperimposePhase,
) {
    drawCaption(
        ctx,
        'Optical isomerism — enantiomers',
        'Lactic acid: CH₃–C*(H)(OH)–COOH  |  one asymmetric carbon  |  Class 11 Sec. 8.6.2',
        'non-superimposable mirror images',
    );

    // Mirror plane
    if (showMirror) {
        const shimmer = 0.10 + 0.05 * Math.sin(time * 2.2);
        const mg = ctx.createLinearGradient(614, 145, 665, 145);
        mg.addColorStop(0, 'rgba(255,255,255,0)');
        mg.addColorStop(0.5, `rgba(14,165,233,${shimmer})`);
        mg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = mg; ctx.fillRect(614, 145, 51, 465);
        ctx.save();
        ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10 + 5 * Math.sin(time * 2.2);
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 6]); ctx.lineDashOffset = -(time * 28) % 16;
        ctx.beginPath(); ctx.moveTo(640, 145); ctx.lineTo(640, 610); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        ctx.fillStyle = '#0369a1'; ctx.font = '800 13px sans-serif'; ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('mirror plane', 640, 138);
    }

    // Superimpose: right molecule slides left and clashes
    const goingProg   = clamp(superimposeT * 2, 0, 1);
    const returnProg  = clamp((superimposeT - 0.5) * 2, 0, 1);
    const isReturning = superimposePhase === 'returning';
    const rightOffset = isReturning
        ? lerp(-280, 0, ease(returnProg))
        : lerp(0, -280, ease(goingProg));

    // Flash on clash
    if (superimposeT > 0.44 && superimposeT < 0.56) {
        const flashA = clamp(1 - Math.abs(superimposeT - 0.5) * 22, 0, 1);
        ctx.save();
        ctx.globalAlpha = flashA * 0.55;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(640, 395, 130, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = flashA;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10; ctx.lineCap = 'round';
        ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.moveTo(590, 340); ctx.lineTo(690, 450);
        ctx.moveTo(690, 340); ctx.lineTo(590, 450); ctx.stroke();
        ctx.restore();
        if (flashA > 0.3) {
            ctx.fillStyle = '#7f1d1d'; ctx.font = '900 18px sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('✕  Cannot superimpose!', 640, 510);
        }
    }

    const centers: { x: number; y: number; sign: number }[] = [
        { x: 430, y: 400, sign: 1 },
        { x: 850, y: 400, sign: -1 },
    ];

    centers.forEach(({ x, y, sign }, idx) => {
        const bob = Math.sin(time * 2 + idx) * 4;
        const rx = idx === 1 ? x + rightOffset : x;
        const ry = y + bob;
        const alpha = (idx === 1 && superimposeT > 0.45) ? lerp(1, 0.35, ease(clamp((superimposeT - 0.45) / 0.1, 0, 1))) : 1;

        if (idx === 1) { ctx.save(); ctx.globalAlpha = alpha; }

        // Polarized-light rotation arrow (above each molecule)
        const arrowY = ry - 155;
        const arrowR = 26;
        const cwDir = idx === 0 ? 1 : -1; // A = CW (+), B = CCW (-)
        const arrowAngle = time * 1.4 * cwDir;
        const arrowColor = idx === 0 ? '#1d4ed8' : '#dc2626';
        ctx.save();
        ctx.translate(rx, arrowY);
        ctx.shadowColor = arrowColor; ctx.shadowBlur = 12;
        ctx.strokeStyle = arrowColor; ctx.lineWidth = 3;
        ctx.beginPath();
        if (cwDir > 0) ctx.arc(0, 0, arrowR, arrowAngle, arrowAngle + Math.PI * 1.6);
        else           ctx.arc(0, 0, arrowR, arrowAngle, arrowAngle - Math.PI * 1.6, true);
        ctx.stroke();
        // arrowhead
        const headAng = cwDir > 0 ? arrowAngle + Math.PI * 1.6 : arrowAngle - Math.PI * 1.6;
        const hx = arrowR * Math.cos(headAng), hy = arrowR * Math.sin(headAng);
        const tangentAng = headAng + cwDir * Math.PI / 2;
        ctx.fillStyle = arrowColor;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx - 9 * Math.cos(tangentAng - 0.4), hy - 9 * Math.sin(tangentAng - 0.4));
        ctx.lineTo(hx - 9 * Math.cos(tangentAng + 0.4), hy - 9 * Math.sin(tangentAng + 0.4));
        ctx.closePath(); ctx.fill();
        ctx.restore();
        ctx.fillStyle = arrowColor; ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(idx === 0 ? '(+) dextrorotatory' : '(−) laevorotatory', rx, arrowY + arrowR + 18);

        // Lactic acid: H, OH, CH₃, COOH
        const groups = [
            { label: 'H',    dx: -150 * sign, dy: -110, fill: '#f8fafc', stroke: '#94a3b8', r: 27, solid: true  },
            { label: 'OH',   dx:  142 * sign, dy:  -92, fill: '#dcfce7', stroke: '#16a34a', r: 33, solid: true  },
            { label: 'CH₃',  dx: -125 * sign, dy:  122, fill: '#fde68a', stroke: '#b45309', r: 40, solid: false },
            { label: 'COOH', dx:  124 * sign, dy:  128, fill: '#fed7aa', stroke: '#c2410c', r: 42, solid: false },
        ];
        groups.forEach(g => {
            const gx = rx + g.dx, gy = ry + g.dy;
            drawBond(ctx, { x: rx, y: ry }, { x: gx, y: gy }, g.solid ? '#334155' : '#94a3b8', g.solid ? 7 : 4);
            drawAtom(ctx, gx, gy, g.r, g.label, g.fill, g.stroke);
        });

        drawAtom(ctx, rx, ry, 38, 'C*', '#7c3aed', '#5b21b6', '#7c3aed');

        const labelCol = idx === 0 ? '#1d4ed8' : '#dc2626';
        ctx.fillStyle = labelCol; ctx.font = '900 16px sans-serif'; ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        // FIX: both are "enantiomers" (was "mirror image B")
        ctx.fillText(idx === 0 ? 'enantiomer A' : 'enantiomer B', rx, 636);

        if (idx === 1) ctx.restore();
    });

    // Footer note
    const noteFill = (superimposeT > 0.4 && superimposeT < 0.6) ? '#fee2e2' : '#fef2f2';
    ctx.fillStyle = noteFill; ctx.strokeStyle = '#fecaca'; ctx.lineWidth = 1.5;
    roundRect(ctx, 344, 654, 592, 46, 17); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#991b1b'; ctx.font = '800 13px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('C* bonded to 4 different groups → non-superimposable mirror images → optical isomers', 640, 677);
}

// ─── VALUE CHIP ────────────────────────────────────────────────────────────────

interface ValueChipProps {
    label: string;
    value: string;
    tone: 'amber' | 'blue' | 'emerald' | 'red' | 'violet' | 'slate';
}
const ValueChip: React.FC<ValueChipProps> = ({ label, value, tone }) => {
    const palette = {
        amber:   'bg-amber-50 text-amber-700',
        blue:    'bg-blue-50 text-blue-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        red:     'bg-red-50 text-red-700',
        violet:  'bg-violet-50 text-violet-700',
        slate:   'bg-slate-50 text-slate-800',
    }[tone];
    return (
        <div className={`rounded-lg border border-slate-100 px-3 py-2.5 ${palette}`}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 font-mono text-sm font-extrabold">{value}</div>
        </div>
    );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

const GeometricalIsomerismCanvas: React.FC<GeometricalIsomerismProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);

    // React state (what controls render)
    const [mode,           setMode]           = useState<Mode>('map');
    const [but2eneForm,    setBut2eneForm]    = useState<But2eneForm>('cis');
    const [showDipoles,    setShowDipoles]    = useState(true);
    const [showMirror,     setShowMirror]     = useState(true);
    const [twistAttempt,   setTwistAttempt]   = useState(0);
    const speed = 1.3;
    const [paused,         setPaused]         = useState(false);
    const [superimposePhase, setSuperimposePhase] = useState<SuperimposePhase>('idle');

    // Refs for RAF access to latest state (avoid stale closures)
    const modeRef             = useRef(mode);
    const but2eneFormRef      = useRef(but2eneForm);
    const showDipolesRef      = useRef(showDipoles);
    const showMirrorRef       = useRef(showMirror);
    const twistRef            = useRef(twistAttempt);
    const pausedRef           = useRef(paused);
    const superimposePhaseRef = useRef(superimposePhase);

    // Smooth animation refs (updated in RAF)
    const timeRef           = useRef(0);
    const morphRef          = useRef(0);         // 0=cis, 1=trans
    const dipoleRef         = useRef(1);         // dipole arrow progress
    const superimposeProg   = useRef(0);         // 0..1..0
    const sparkParticlesRef = useRef<SparkParticle[]>([]);
    const prevTwistRef      = useRef(0);

    // Keep refs in sync with state
    modeRef.current             = mode;
    but2eneFormRef.current      = but2eneForm;
    showDipolesRef.current      = showDipoles;
    showMirrorRef.current       = showMirror;
    twistRef.current            = twistAttempt;
    pausedRef.current           = paused;
    superimposePhaseRef.current = superimposePhase;

    // Spawn sparks when twist crosses 18°
    const emitSparks = useCallback((cx: number, cy: number) => {
        const colors = ['#ef4444', '#f97316', '#fbbf24', '#f87171'];
        const newSparks: SparkParticle[] = Array.from({ length: 18 }, () => {
            const ang = Math.random() * Math.PI * 2;
            const spd = 80 + Math.random() * 160;
            return {
                x: cx + (Math.random() - 0.5) * 60,
                y: cy + (Math.random() - 0.5) * 30,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 0.8 + Math.random() * 0.6, maxLife: 0.8 + Math.random() * 0.6,
                color: colors[Math.floor(Math.random() * colors.length)],
                r: 4 + Math.random() * 5,
            };
        });
        sparkParticlesRef.current = [...sparkParticlesRef.current, ...newSparks];
    }, []);

    const handleReset = useCallback(() => {
        setMode('map'); setBut2eneForm('cis'); setShowDipoles(true);
        setShowMirror(true); setTwistAttempt(0); setPaused(false);
        setSuperimposePhase('idle');
        timeRef.current = 0; morphRef.current = 0; dipoleRef.current = 1;
        superimposeProg.current = 0; sparkParticlesRef.current = [];
    }, []);

    // RAF loop — runs once, uses refs for all state
    useEffect(() => {
        let last = performance.now();

        const tick = (now: number) => {
            const rawDt = (now - last) / 1000;
            last = now;
            const dt = Math.min(rawDt, 0.1);

            if (!pausedRef.current) {
                timeRef.current += dt * speed;
            }

            // Smooth morph: cis (0) ↔ trans (1)
            const morphTarget = but2eneFormRef.current === 'cis' ? 0 : 1;
            morphRef.current += (morphTarget - morphRef.current) * Math.min(1, dt * 5);

            // Smooth dipole progress
            const dipoleTarget = showDipolesRef.current ? 1 : 0;
            dipoleRef.current += (dipoleTarget - dipoleRef.current) * Math.min(1, dt * 6);

            // Spark particle physics
            const twist = twistRef.current;
            if (!pausedRef.current && twist > 18 && prevTwistRef.current <= 18) {
                emitSparks(640, 392); // emit at bond centre
            }
            prevTwistRef.current = twist;

            sparkParticlesRef.current = sparkParticlesRef.current
                .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + 200 * dt, life: p.life - dt }))
                .filter(p => p.life > 0);

            // Superimpose animation
            const sPhase = superimposePhaseRef.current;
            if (sPhase === 'going') {
                superimposeProg.current = Math.min(superimposeProg.current + dt * 0.9, 1);
                if (superimposeProg.current >= 1) setSuperimposePhase('returning');
            } else if (sPhase === 'returning') {
                superimposeProg.current = Math.max(superimposeProg.current - dt * 0.55, 0);
                if (superimposeProg.current <= 0) { superimposeProg.current = 0; setSuperimposePhase('idle'); }
            }

            // Draw
            const canvas = canvasRef.current;
            if (!canvas) { rafRef.current = requestAnimationFrame(tick); return; }
            const ctx = canvas.getContext('2d');
            if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }

            const t = timeRef.current;
            const m = modeRef.current;

            drawGrid(ctx);
            if (m === 'map')      drawFlowchart(ctx, m, t);
            if (m === 'rotation') drawDoubleBondLock(ctx, twistRef.current, t, sparkParticlesRef.current);
            if (m === 'but2ene')  drawBut2ene(ctx, morphRef.current, showDipolesRef.current, dipoleRef.current, t);
            if (m === 'optical')  drawOpticalPreview(ctx, showMirrorRef.current, t, superimposeProg.current, superimposePhaseRef.current);

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [emitSparks]); // only emitSparks dep (stable ref)

    // ── VALUE CHIPS ────────────────────────────────────────────────────────────
    const currentValues = useMemo(() => {
        if (mode === 'but2ene') {
            return but2eneForm === 'cis'
                ? [
                    { label: 'Example',          value: 'cis-but-2-ene',  tone: 'emerald' as const },
                    { label: 'CH₃ positions',    value: 'same side',      tone: 'emerald' as const },
                    { label: 'Boiling point',    value: '277 K',          tone: 'amber'   as const },
                    { label: 'Dipole moment',    value: 'μ = 0.33 D',     tone: 'blue'    as const },
                ]
                : [
                    { label: 'Example',          value: 'trans-but-2-ene', tone: 'red'    as const },
                    { label: 'CH₃ positions',    value: 'opposite sides',  tone: 'red'    as const },
                    { label: 'Boiling point',    value: '274 K',           tone: 'amber'  as const },
                    { label: 'Dipole moment',    value: 'μ ≈ 0',           tone: 'slate'  as const },
                ];
        }
        if (mode === 'rotation') return [
            { label: 'Bond tested',   value: 'C=C',          tone: 'blue'   as const },
            { label: 'Rotation',      value: 'restricted',   tone: 'red'    as const },
            { label: 'Twist attempt', value: `${twistAttempt}°`, tone: twistAttempt > 18 ? 'red' as const : 'amber' as const },
            { label: 'Cause',         value: 'π overlap',    tone: 'violet' as const },
        ];
        if (mode === 'optical') return [
            { label: 'Type',           value: 'optical',              tone: 'emerald' as const },
            { label: 'Pair',           value: 'enantiomers',          tone: 'violet'  as const },
            { label: 'Mirror images',  value: 'not superimposable',   tone: 'red'     as const },
            { label: 'Key atom',       value: 'asymmetric C*',        tone: 'blue'    as const },
        ];
        return [
            { label: 'Main classes',      value: '2',              tone: 'slate'  as const },
            { label: 'Structural types',  value: '4',              tone: 'blue'   as const },
            { label: 'Stereo branches',   value: '2',              tone: 'violet' as const },
            { label: 'Basis',             value: 'position in 3D', tone: 'emerald' as const },
        ];
    }, [but2eneForm, mode, twistAttempt]);

    // ── SIDEBAR PANELS ─────────────────────────────────────────────────────────
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 min-[1850px]:block">
            <div className="flex flex-col gap-2.5">
                {/* NCERT flowchart mini-map */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-sm font-extrabold text-slate-900">NCERT Flowchart</div>
                    <div className="text-xs font-semibold text-slate-500">Sec. 8.6.1–8.6.2</div>
                    <div className="mt-3 space-y-2 text-xs font-bold">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center text-slate-900">Isomerism</div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-center text-blue-900">Structural</div>
                            <div className="rounded-lg border border-violet-200 bg-violet-50 p-2 text-center text-violet-900">Stereoisomerism</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                {['Chain', 'Position', 'Functional group', 'Metamerism'].map(x => (
                                    <div key={x} className="rounded-md bg-blue-50 px-2 py-1 text-blue-800">{x}</div>
                                ))}
                            </div>
                            <div className="space-y-1">
                                <div className="rounded-md bg-red-50 px-2 py-1 text-red-800">Geometrical</div>
                                <div className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">Optical</div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* But-2-ene bar chart */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-sm font-extrabold text-slate-900">But-2-ene Properties</div>
                    <div className="text-xs font-semibold text-slate-500">NCERT Sec. 9.3.3 exact values</div>
                    <div className="mt-3 h-[160px]">
                        <svg viewBox="0 0 310 160" className="h-full w-full">
                            <line x1="36" y1="126" x2="292" y2="126" stroke="#475569" strokeWidth="1.5" />
                            <line x1="36" y1="20"  x2="36"  y2="126" stroke="#475569" strokeWidth="1.5" />
                            <rect x="75"  y="42" width="58" height="84" rx="5" fill="#bbf7d0" stroke="#16a34a" />
                            <rect x="190" y="52" width="58" height="74" rx="5" fill="#fecaca" stroke="#dc2626" />
                            <text x="104" y="36"  textAnchor="middle" fontSize="11" fontWeight="800" fill="#15803d">277 K</text>
                            <text x="219" y="46"  textAnchor="middle" fontSize="11" fontWeight="800" fill="#b91c1c">274 K</text>
                            <text x="104" y="145" textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569">cis</text>
                            <text x="219" y="145" textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569">trans</text>
                            <text x="8"   y="78"  textAnchor="middle" fontSize="10" fontWeight="800" fill="#475569" transform="rotate(-90 8 78)">boiling point</text>
                        </svg>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-800">cis: μ = 0.33 D</div>
                        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-800">trans: μ ≈ 0</div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 min-[1850px]:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-violet-900">{modeText[mode].title}</div>
                    <div className="mt-0.5 text-xs font-semibold text-violet-700">{modeText[mode].ncert}</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-violet-900">
                        {modeText[mode].body.map(line => <p key={line}>{line}</p>)}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-base font-extrabold text-slate-900">Live values</div>
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {currentValues.map(v => <ValueChip key={v.label} label={v.label} value={v.value} tone={v.tone} />)}
                    </div>
                </div>
            </div>
        </aside>
    );

    // ── SIMULATION WRAPPER ─────────────────────────────────────────────────────
    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button onClick={() => setPaused(p => !p)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    // ── CONTROLS ───────────────────────────────────────────────────────────────
    const controlsCombo = (
        <div className="flex w-full flex-col gap-2">
            {/* Header row */}
            <div className="flex items-center gap-2 text-slate-800">
                <FlaskConical size={17} className="text-violet-600" />
                <span className="text-sm font-extrabold uppercase tracking-wide">Stereoisomerism Bench</span>
            </div>

            {/* Mode selector + contextual buttons */}
            <div className="grid gap-2 md:grid-cols-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-600">Mode:</span>
                    {MODES.map(m => (
                        <button key={m.id} onClick={() => setMode(m.id)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition-colors ${
                                mode === m.id
                                    ? 'border-violet-300 bg-violet-100 text-violet-800'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                            title={m.label}>
                            {m.short}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    {mode === 'but2ene' && (
                        <>
                            <button onClick={() => setBut2eneForm('cis')}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-all ${
                                    but2eneForm === 'cis'
                                        ? 'border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm shadow-emerald-200'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}>
                                cis
                            </button>
                            <button onClick={() => setBut2eneForm('trans')}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-all ${
                                    but2eneForm === 'trans'
                                        ? 'border-red-300 bg-red-100 text-red-800 shadow-sm shadow-red-200'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}>
                                trans
                            </button>
                            <button onClick={() => setShowDipoles(v => !v)}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-colors ${
                                    showDipoles
                                        ? 'border-blue-300 bg-blue-50 text-blue-800'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}>
                                {showDipoles ? <Eye size={13} /> : <EyeOff size={13} />} dipoles
                            </button>
                        </>
                    )}

                    {mode === 'optical' && (
                        <>
                            <button onClick={() => setShowMirror(v => !v)}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-colors ${
                                    showMirror
                                        ? 'border-sky-300 bg-sky-50 text-sky-800'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}>
                                {showMirror ? <Eye size={13} /> : <EyeOff size={13} />} mirror
                            </button>
                            <button
                                onClick={() => { if (superimposePhase === 'idle') setSuperimposePhase('going'); }}
                                disabled={superimposePhase !== 'idle'}
                                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-colors ${
                                    superimposePhase !== 'idle'
                                        ? 'border-red-200 bg-red-50 text-red-500 cursor-not-allowed'
                                        : 'border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100'
                                }`}>
                                <Zap size={13} /> Try Superimpose
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Twist slider — rotation mode only */}
            {mode === 'rotation' && (
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600">Double-bond twist attempt</label>
                        <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs font-extrabold ${
                            twistAttempt > 18 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                            <RotateCw size={12} /> {twistAttempt}°
                        </span>
                    </div>
                    <input type="range" min={0} max={45} step={1} value={twistAttempt}
                        onChange={e => setTwistAttempt(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg accent-red-600" />
                    {twistAttempt > 18 && (
                        <div className="mt-1.5 text-[10px] font-bold text-red-600 text-center animate-pulse">
                            ⚡ π bond breaking — rotation is forbidden!
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
            controlsAreaFlex="0 0 220px"
        />
    );
};

export default GeometricalIsomerismCanvas;
