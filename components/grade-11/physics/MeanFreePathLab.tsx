import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface MeanFreePathLabProps {
    topic: any;
    onExit: () => void;
}

interface Molecule {
    x: number; y: number;
    vx: number; vy: number;
    r: number; // visual radius (tracks diameter slider)
}

interface TrailPoint { x: number; y: number; }
interface CollisionFlash { x: number; y: number; born: number; }

// ─── Physics helper ───────────────────────────────────────────
// mean free path: l = 1 / (√2 · n · π · d²)
// n = number density in simulation units: N / (boxW * boxH)
function calcMFP(N: number, d_px: number, boxW: number, boxH: number): number {
    const n = N / (boxW * boxH);
    const denom = Math.SQRT2 * n * Math.PI * d_px * d_px;
    return denom > 0 ? 1 / denom : Infinity;
}

// Convert temperature to base speed (pixels per frame) – mirrors KineticTheoryLab convention
function tempToSpeed(T: number): number {
    return 1.2 + (T - 100) / 900 * 3.8; // range ~1.2–5.0
}

const MeanFreePathLab: React.FC<MeanFreePathLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef  = useRef(0);

    // ── React State ──
    const [numMols,   setNumMols]   = useState(40);   // 10–120
    const [diamNm,    setDiamNm]    = useState(3);    // 1–8  (visual diameter in nm-scale, maps to px)
    const [tempK,     setTempK]     = useState(400);  // 100–1000 K
    const [showTrace, setShowTrace] = useState(true);

    // ── Mutable Refs (physics engine & drawing) ──
    const sRef = useRef({ N: 40, dNm: 3, T: 400, showTrace: true });
    const molsRef   = useRef<Molecule[]>([]);
    const trailRef  = useRef<TrailPoint[]>([]);
    const flashRef  = useRef<CollisionFlash[]>([]);
    const frameRef  = useRef(0);

    // Stats refs
    const segDistRef   = useRef(0);   // distance since last collision with ANOTHER mol
    const segStartRef  = useRef({ x: 0, y: 0 });
    const mfpSamplesRef = useRef<number[]>([]);  // ring buffer of free-path segments
    const totalCollRef  = useRef(0);
    const mfpDisplayRef = useRef(0);   // smoothed displayed MFP
    const curSegRef     = useRef(0);   // live "current free path"
    // box bounds set each frame from canvas size
    const boxRef = useRef({ x: 0, y: 0, w: 1, h: 1 });

    // ── Sync state → ref ──
    useEffect(() => {
        sRef.current.N          = numMols;
        sRef.current.dNm        = diamNm;
        sRef.current.T          = tempK;
        sRef.current.showTrace  = showTrace;
        rebuildMolecules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [numMols, diamNm, tempK]);

    useEffect(() => {
        sRef.current.showTrace = showTrace;
    }, [showTrace]);

    // ── Molecule builder ──
    const rebuildMolecules = useCallback(() => {
        const s = sRef.current;
        const b = boxRef.current;
        const r = Math.max(4, Math.min(14, 4 + (s.dNm - 1) * 1.4)); // visual radius px
        const spd = tempToSpeed(s.T);
        const existing = molsRef.current;
        const next: Molecule[] = [];

        // Retain tracked molecule (index 0) if possible
        for (let i = 0; i < s.N; i++) {
            if (i === 0 && existing.length > 0) {
                // keep tracked mol, update its radius & speed
                const m = existing[0];
                m.r = r;
                const curSpd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
                if (curSpd > 0.01) { m.vx = (m.vx / curSpd) * spd; m.vy = (m.vy / curSpd) * spd; }
                next.push(m);
            } else if (i < existing.length) {
                const m = existing[i];
                m.r = r;
                const curSpd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
                if (curSpd > 0.01) { m.vx = (m.vx / curSpd) * spd; m.vy = (m.vy / curSpd) * spd; }
                next.push(m);
            } else {
                const angle = Math.random() * Math.PI * 2;
                const v = spd * (0.6 + Math.random() * 0.8);
                next.push({
                    x: b.x + r + Math.random() * Math.max(1, b.w - 2 * r),
                    y: b.y + r + Math.random() * Math.max(1, b.h - 2 * r),
                    vx: Math.cos(angle) * v,
                    vy: Math.sin(angle) * v,
                    r,
                });
            }
        }
        molsRef.current = next;
    }, []);

    // ── Canvas Resize ──
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const ro = new ResizeObserver(() => {
            canvas.width  = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        ro.observe(parent);
        canvas.width  = parent.clientWidth;
        canvas.height = parent.clientHeight;
        return () => ro.disconnect();
    }, []);

    // ── Main Draw/Physics Loop ──
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }

        const s = sRef.current;
        frameRef.current++;
        const now = frameRef.current;

        // ── VIEWPORT SCALING (matches platform standard) ──
        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

        // ── LAYOUT ──
        // Left panel: gas box  (~55% width)
        // Right panel: 3 stacked info cards  (~40% width)
        const titleH  = fs(18) + pad * 1.5;
        const leftW   = W * 0.56;
        const rightW  = W - leftW - pad * 3;
        const rightX  = leftW + pad * 2.5;
        const contentY = titleH;
        const contentH = H - contentY - pad;

        // Box inset inside left panel card
        const boxPad  = pad * 1.8;
        const boxX    = pad + boxPad;
        const boxY    = contentY + boxPad * 0.6;
        const boxW    = leftW - pad - boxPad * 2;
        const boxH    = contentH - boxPad * 1.2;

        boxRef.current = { x: boxX, y: boxY, w: boxW, h: boxH };

        // ── CLEAR & BG ──
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        // ═══════════════════════════════════════════
        // PHYSICS UPDATE
        // ═══════════════════════════════════════════
        const mols = molsRef.current;
        const d_px = mols.length > 0 ? mols[0].r * 2 : 8; // diameter in px

        // Move all molecules
        for (let i = 0; i < mols.length; i++) {
            const m = mols[i];
            m.x += m.vx; m.y += m.vy;
            // Wall bounce
            if (m.x - m.r < boxX)       { m.x = boxX + m.r;        m.vx =  Math.abs(m.vx); }
            if (m.x + m.r > boxX + boxW) { m.x = boxX + boxW - m.r; m.vx = -Math.abs(m.vx); }
            if (m.y - m.r < boxY)        { m.y = boxY + m.r;        m.vy =  Math.abs(m.vy); }
            if (m.y + m.r > boxY + boxH) { m.y = boxY + boxH - m.r; m.vy = -Math.abs(m.vy); }
        }

        // Molecule-molecule collisions (elastic hard sphere)
        for (let i = 0; i < mols.length; i++) {
            for (let j = i + 1; j < mols.length; j++) {
                const a = mols[i], b2 = mols[j];
                const dx = b2.x - a.x, dy = b2.y - a.y;
                const dist2 = dx * dx + dy * dy;
                const minD  = a.r + b2.r;
                if (dist2 < minD * minD && dist2 > 0.0001) {
                    const dist = Math.sqrt(dist2);
                    // Separate
                    const overlap = (minD - dist) * 0.5;
                    const nx = dx / dist, ny = dy / dist;
                    a.x -= nx * overlap; a.y -= ny * overlap;
                    b2.x += nx * overlap; b2.y += ny * overlap;
                    // Exchange velocity components along normal
                    const dvx = a.vx - b2.vx, dvy = a.vy - b2.vy;
                    const dot = dvx * nx + dvy * ny;
                    if (dot > 0) {
                        a.vx  -= dot * nx; a.vy  -= dot * ny;
                        b2.vx += dot * nx; b2.vy += dot * ny;
                    }
                    // Track if tracked mol (index 0) is involved
                    if (i === 0 || j === 0) {
                        // record free path segment
                        const tm = mols[0];
                        const dx2 = tm.x - segStartRef.current.x;
                        const dy2 = tm.y - segStartRef.current.y;
                        const segLen = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                        if (segLen > 0.5) {
                            mfpSamplesRef.current.push(segLen);
                            if (mfpSamplesRef.current.length > 80) mfpSamplesRef.current.shift();
                        }
                        segStartRef.current = { x: tm.x, y: tm.y };
                        segDistRef.current  = 0;
                        totalCollRef.current++;
                        // Flash
                        flashRef.current.push({ x: tm.x, y: tm.y, born: now });
                    }
                }
            }
        }

        // Update tracked molecule trail & current segment
        if (mols.length > 0) {
            const tm = mols[0];
            const dx = tm.x - segStartRef.current.x;
            const dy = tm.y - segStartRef.current.y;
            curSegRef.current = Math.sqrt(dx * dx + dy * dy);
            if (s.showTrace && now % 2 === 0) {
                trailRef.current.push({ x: tm.x, y: tm.y });
                if (trailRef.current.length > 400) trailRef.current.shift();
            }
        }

        // Compute smoothed MFP
        const samples = mfpSamplesRef.current;
        if (samples.length > 0) {
            const avg = samples.reduce((a, b2) => a + b2, 0) / samples.length;
            mfpDisplayRef.current = mfpDisplayRef.current * 0.92 + avg * 0.08;
        }

        // Theory MFP
        const theoryMFP = calcMFP(mols.length, d_px, boxW, boxH);

        // Expire flashes
        flashRef.current = flashRef.current.filter(f => now - f.born < 18);

        // ═══════════════════════════════════════════
        // DRAW – LEFT PANEL (Gas Box)
        // ═══════════════════════════════════════════
        // Panel card
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, pad, contentY, leftW - pad, contentH, 16); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, pad, contentY, leftW - pad, contentH, 16); ctx.stroke();

        // Panel title
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(12)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('GAS CONTAINER — MOLECULAR SIMULATION', pad + (leftW - pad) / 2, contentY + pad * 1.0);

        // Box border (the glass container)
        ctx.fillStyle = 'rgba(241,245,249,0.55)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3 * scale;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Grid lines inside box (very faint)
        ctx.strokeStyle = 'rgba(203,213,225,0.35)'; ctx.lineWidth = 1;
        for (let gx = boxX + boxW / 4; gx < boxX + boxW; gx += boxW / 4) {
            ctx.beginPath(); ctx.moveTo(gx, boxY); ctx.lineTo(gx, boxY + boxH); ctx.stroke();
        }
        for (let gy = boxY + boxH / 4; gy < boxY + boxH; gy += boxH / 4) {
            ctx.beginPath(); ctx.moveTo(boxX, gy); ctx.lineTo(boxX + boxW, gy); ctx.stroke();
        }

        // ── Draw Trail ──
        if (s.showTrace && trailRef.current.length > 1) {
            const trail = trailRef.current;
            ctx.lineWidth = 2 * scale;
            for (let i = 1; i < trail.length; i++) {
                const alpha = 0.12 + 0.55 * (i / trail.length);
                ctx.strokeStyle = `rgba(220,38,38,${alpha})`;
                ctx.beginPath();
                ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
                ctx.lineTo(trail[i].x, trail[i].y);
                ctx.stroke();
            }
        }

        // ── Draw Background Molecules ──
        const tempNorm = Math.max(0, Math.min(1, (s.T - 100) / 900));
        for (let i = 1; i < mols.length; i++) {
            const m = mols[i];
            // Speed-based color (blue slow → amber fast)
            const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
            const spdNorm = Math.min(1, spd / (tempToSpeed(s.T) * 1.4));
            const r2 = Math.round(37 + spdNorm * 187);
            const b2 = Math.round(235 - spdNorm * 180);

            // Glow
            const glow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 2.2);
            glow.addColorStop(0, `rgba(${r2},80,${b2},0.18)`);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 2.2, 0, Math.PI * 2); ctx.fill();

            // Body
            const grad = ctx.createRadialGradient(m.x - m.r * 0.3, m.y - m.r * 0.3, 1, m.x, m.y, m.r);
            grad.addColorStop(0, `rgb(${Math.min(255, r2 + 60)},${Math.min(255, 110)},${Math.min(255, b2 + 40)})`);
            grad.addColorStop(1, `rgb(${r2},60,${b2})`);
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.beginPath(); ctx.arc(m.x - m.r * 0.28, m.y - m.r * 0.28, m.r * 0.38, 0, Math.PI * 2); ctx.fill();
        }

        // ── Draw Collision Flashes ──
        flashRef.current.forEach(f => {
            const age = now - f.born;
            const alpha = Math.max(0, 1 - age / 18);
            const radius = 5 + age * 1.2;
            const flashGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius * scale);
            flashGrad.addColorStop(0, `rgba(255,200,50,${alpha * 0.9})`);
            flashGrad.addColorStop(0.5, `rgba(239,68,68,${alpha * 0.6})`);
            flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = flashGrad;
            ctx.beginPath(); ctx.arc(f.x, f.y, radius * scale, 0, Math.PI * 2); ctx.fill();
        });

        // ── Draw Tracked Molecule (Index 0) ──
        if (mols.length > 0) {
            const tm = mols[0];

            // Outer glow ring
            const tGlow = ctx.createRadialGradient(tm.x, tm.y, tm.r, tm.x, tm.y, tm.r * 3.5);
            tGlow.addColorStop(0, 'rgba(239,68,68,0.25)');
            tGlow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = tGlow;
            ctx.beginPath(); ctx.arc(tm.x, tm.y, tm.r * 3.5, 0, Math.PI * 2); ctx.fill();

            // Body gradient — red tracked molecule
            const tGrad = ctx.createRadialGradient(tm.x - tm.r * 0.3, tm.y - tm.r * 0.3, 1, tm.x, tm.y, tm.r);
            tGrad.addColorStop(0, '#fca5a5');
            tGrad.addColorStop(1, '#dc2626');
            ctx.fillStyle = tGrad;
            ctx.beginPath(); ctx.arc(tm.x, tm.y, tm.r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1.5 * scale;
            ctx.beginPath(); ctx.arc(tm.x, tm.y, tm.r, 0, Math.PI * 2); ctx.stroke();
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath(); ctx.arc(tm.x - tm.r * 0.3, tm.y - tm.r * 0.3, tm.r * 0.35, 0, Math.PI * 2); ctx.fill();

            // Velocity arrow
            const vspd = Math.sqrt(tm.vx * tm.vx + tm.vy * tm.vy);
            if (vspd > 0.01) {
                const arrowLen = 28 * scale;
                const ax = tm.x + (tm.vx / vspd) * (tm.r + arrowLen);
                const ay = tm.y + (tm.vy / vspd) * (tm.r + arrowLen);
                ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.5 * scale;
                drawArrow(ctx, tm.x + (tm.vx / vspd) * tm.r, tm.y + (tm.vy / vspd) * tm.r, ax, ay, 8 * scale);
            }

            // "TRACKED" label
            ctx.fillStyle = '#dc2626'; ctx.font = `bold ${fs(10)}px sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('TRACKED', tm.x, tm.y - tm.r - 6);
        }

        // ── Collision cylinder ghost (pedagogical) ──
        // Draw a faint "sweep cylinder" showing cross-section πd²
        if (mols.length > 0) {
            const tm = mols[0];
            const vspd = Math.sqrt(tm.vx * tm.vx + tm.vy * tm.vy);
            if (vspd > 0.01) {
                const cylinderLen = 55 * scale;
                const nx = tm.vx / vspd, ny = tm.vy / vspd;
                const px = -ny, py = nx; // perpendicular
                const halfW2 = d_px; // = diameter
                ctx.save();
                ctx.translate(tm.x, tm.y);
                ctx.rotate(Math.atan2(tm.vy, tm.vx));
                ctx.strokeStyle = 'rgba(59,130,246,0.30)'; ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 4]);
                ctx.strokeRect(0, -halfW2, cylinderLen, halfW2 * 2);
                ctx.setLineDash([]);
                // label
                ctx.fillStyle = 'rgba(59,130,246,0.55)';
                ctx.font = `bold ${fs(9)}px sans-serif`; ctx.textAlign = 'left';
                ctx.fillText('collision cylinder πd²⟨v⟩Δt', 4, -halfW2 - 4);
                ctx.restore();
                // suppress unused var warnings
                void nx; void ny; void px; void py;
            }
        }

        // Box corner labels
        ctx.fillStyle = '#94a3b8'; ctx.font = `${fs(10)}px monospace`; ctx.textAlign = 'left';
        ctx.fillText(`N = ${mols.length}`, boxX + 6, boxY + 16);
        ctx.textAlign = 'right';
        ctx.fillText(`d = ${s.dNm.toFixed(1)} nm`, boxX + boxW - 6, boxY + 16);
        ctx.textAlign = 'left';
        ctx.fillText(`T = ${s.T} K`, boxX + 6, boxY + boxH - 6);
        ctx.textAlign = 'right';
        ctx.fillText(`Collisions: ${totalCollRef.current}`, boxX + boxW - 6, boxY + boxH - 6);

        // ═══════════════════════════════════════════
        // DRAW – RIGHT PANEL (3 stacked cards)
        // ═══════════════════════════════════════════
        const cardGap = pad * 0.9;
        const card1H  = contentH * 0.28;
        const card2H  = contentH * 0.25;
        const card3H  = contentH - card1H - card2H - cardGap * 2;

        // ── Card 1: Live MFP Meter ──
        const c1Y = contentY;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, rightX, c1Y, rightW, card1H, 14); ctx.fill();
        ctx.strokeStyle = '#2563eb40'; ctx.lineWidth = 2;
        roundRect(ctx, rightX, c1Y, rightW, card1H, 14); ctx.stroke();

        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(11)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('MEAN FREE PATH', rightX + rightW / 2, c1Y + pad * 1.1);

        // Big MFP readout
        const mfpVal = mfpDisplayRef.current;
        ctx.fillStyle = '#2563eb'; ctx.font = `bold ${fs(28)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText(mfpVal < 1 ? '---' : `${mfpVal.toFixed(1)}`, rightX + rightW / 2, c1Y + card1H * 0.54);
        ctx.fillStyle = '#94a3b8'; ctx.font = `bold ${fs(10)}px sans-serif`;
        ctx.fillText('px (measured avg)', rightX + rightW / 2, c1Y + card1H * 0.54 + fs(12) + 4);

        // Theory value
        ctx.fillStyle = '#475569'; ctx.font = `bold ${fs(12)}px monospace`; ctx.textAlign = 'center';
        const theoryStr = isFinite(theoryMFP) ? `${theoryMFP.toFixed(1)} px` : '∞';
        ctx.fillText(`Theory: ${theoryStr}`, rightX + rightW / 2, c1Y + card1H * 0.78);
        ctx.fillStyle = '#94a3b8'; ctx.font = `bold ${fs(10)}px sans-serif`;
        ctx.fillText('l = 1 / (√2 · n · π · d²)', rightX + rightW / 2, c1Y + card1H * 0.93);

        // ── Card 2: Current Segment + Collision counter ──
        const c2Y = c1Y + card1H + cardGap;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, rightX, c2Y, rightW, card2H, 14); ctx.fill();
        ctx.strokeStyle = '#16a34a40'; ctx.lineWidth = 2;
        roundRect(ctx, rightX, c2Y, rightW, card2H, 14); ctx.stroke();

        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(11)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('CURRENT SEGMENT  &  COLLISIONS', rightX + rightW / 2, c2Y + pad * 1.1);

        // Two sub-cells
        const halfCard2 = rightW / 2 - pad * 0.5;
        // Left: current seg
        ctx.fillStyle = '#f0fdf4'; roundRect(ctx, rightX + pad * 0.4, c2Y + pad * 1.8, halfCard2, card2H - pad * 2.5, 10); ctx.fill();
        ctx.fillStyle = '#16a34a'; ctx.font = `bold ${fs(22)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText(`${curSegRef.current.toFixed(1)}`, rightX + pad * 0.4 + halfCard2 / 2, c2Y + card2H * 0.58);
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(10)}px sans-serif`;
        ctx.fillText('current free path (px)', rightX + pad * 0.4 + halfCard2 / 2, c2Y + card2H * 0.78);

        // Right: collisions
        const cellX2 = rightX + rightW / 2 + pad * 0.1;
        ctx.fillStyle = '#fef2f2'; roundRect(ctx, cellX2, c2Y + pad * 1.8, halfCard2, card2H - pad * 2.5, 10); ctx.fill();
        ctx.fillStyle = '#dc2626'; ctx.font = `bold ${fs(22)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText(`${totalCollRef.current}`, cellX2 + halfCard2 / 2, c2Y + card2H * 0.58);
        ctx.fillStyle = '#64748b'; ctx.font = `bold ${fs(10)}px sans-serif`;
        ctx.fillText('mol-mol collisions', cellX2 + halfCard2 / 2, c2Y + card2H * 0.78);

        // ── Card 3: Formula + Cause-Effect summary ──
        const c3Y = c2Y + card2H + cardGap;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, rightX, c3Y, rightW, card3H, 14); ctx.fill();
        ctx.strokeStyle = '#d97706' + '40'; ctx.lineWidth = 2;
        roundRect(ctx, rightX, c3Y, rightW, card3H, 14); ctx.stroke();

        ctx.fillStyle = '#d97706'; ctx.font = `bold ${fs(11)}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('CAUSE & EFFECT SUMMARY', rightX + rightW / 2, c3Y + pad * 1.05);

        // Formula
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(16)}px monospace`; ctx.textAlign = 'center';
        ctx.fillText('l = 1 / (√2 · nπd²)', rightX + rightW / 2, c3Y + pad * 2.4);

        // Three rows: density, size, temperature
        const summaryTop = c3Y + pad * 3.05;
        const summaryBottomPad = pad * 0.45;
        const rowGap = Math.max(6, pad * 0.18);
        const rowX = rightX + pad * 0.45;
        const rowW = rightW - pad * 0.9;
        const rowH = (card3H - (summaryTop - c3Y) - summaryBottomPad - rowGap * 2) / 3;
        const rows = [
            { label: 'Density n ↑', effect: 'l ↓  (l ∝ 1/n)', color: '#2563eb', desc: 'More targets → shorter path' },
            { label: 'Diameter d ↑', effect: 'l ↓  (l ∝ 1/d²)', color: '#dc2626', desc: 'Bigger cross-section → more hits' },
            { label: 'Temperature T ↑', effect: 'l ↑  (at const. P)', color: '#16a34a', desc: 'Volume expands → n decreases' },
        ];
        rows.forEach((row, i) => {
            const ry = summaryTop + i * (rowH + rowGap);
            const innerPadX = pad * 0.35;
            const leftTextX = rowX + innerPadX;
            const rightTextX = rowX + rowW - innerPadX;
            ctx.fillStyle = '#f8fafc';
            roundRect(ctx, rowX, ry, rowW, rowH, 8); ctx.fill();
            ctx.strokeStyle = row.color + '30'; ctx.lineWidth = 1;
            roundRect(ctx, rowX, ry, rowW, rowH, 8); ctx.stroke();

            // Colored label
            ctx.fillStyle = row.color; ctx.font = `bold ${fs(11)}px sans-serif`; ctx.textAlign = 'left';
            ctx.fillText(row.label, leftTextX, ry + rowH * 0.38);
            // Effect
            ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(11)}px monospace`;
            ctx.fillText(row.effect, leftTextX, ry + rowH * 0.76);
            // Desc right
            ctx.fillStyle = '#64748b'; ctx.font = `${fs(9.5)}px sans-serif`; ctx.textAlign = 'right';
            ctx.fillText(row.desc, rightTextX, ry + rowH * 0.57);
        });

        // ── Page Title ──
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(18)}px sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('Mean Free Path — Kinetic Theory Lab', pad, titleH * 0.7);

        animRef.current = requestAnimationFrame(draw);
    }, []);

    // ── Start/Stop Animation ──
    useEffect(() => {
        rebuildMolecules();
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw, rebuildMolecules]);

    const handleReset = () => {
        setNumMols(40); setDiamNm(3); setTempK(400);
        trailRef.current = []; flashRef.current = [];
        mfpSamplesRef.current = []; totalCollRef.current = 0;
        mfpDisplayRef.current = 0; curSegRef.current = 0;
        segDistRef.current = 0;
        sRef.current = { N: 40, dNm: 3, T: 400, showTrace: true };
        rebuildMolecules();
    };

    // ═══════════════════════════════════════════
    // JSX
    // ═══════════════════════════════════════════
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-2 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            {/* ── 3-column slider grid (mirrors SHMLab & KineticTheoryLab) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
                {/* Density */}
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🔵 Density (N)</span>
                        <span className="text-blue-700 font-mono text-base md:text-lg bg-blue-50 border border-blue-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{numMols} mol</span>
                    </label>
                    <input type="range" min="10" max="120" step="5" value={numMols}
                        onChange={e => setNumMols(Number(e.target.value))}
                        className="w-full accent-blue-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[9px] md:text-xs font-bold text-slate-400 uppercase">
                        <span>Low (10)</span><span>High (120)</span>
                    </div>
                </div>

                {/* Molecular Size */}
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>⚛️ Diameter (d)</span>
                        <span className="text-red-700 font-mono text-base md:text-lg bg-red-50 border border-red-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{diamNm.toFixed(1)} nm</span>
                    </label>
                    <input type="range" min="1" max="8" step="0.5" value={diamNm}
                        onChange={e => setDiamNm(Number(e.target.value))}
                        className="w-full accent-red-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[9px] md:text-xs font-bold text-slate-400 uppercase">
                        <span>Small (1 nm)</span><span>Large (8 nm)</span>
                    </div>
                </div>

                {/* Temperature */}
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🌡️ Temperature</span>
                        <span className="text-amber-700 font-mono text-base md:text-lg bg-amber-50 border border-amber-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{tempK} K</span>
                    </label>
                    <input type="range" min="100" max="1000" step="50" value={tempK}
                        onChange={e => setTempK(Number(e.target.value))}
                        className="w-full accent-amber-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[9px] md:text-xs font-bold text-slate-400 uppercase">
                        <span>Cold (100 K)</span><span>Hot (1000 K)</span>
                    </div>
                </div>
            </div>

            {/* ── Button row ── */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-center mt-1 md:mt-2">
                <button
                    onClick={() => setShowTrace(v => !v)}
                    className={`w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 rounded-xl border font-bold text-sm md:text-base transition-all shadow-md active:scale-95 ${
                        showTrace
                            ? 'bg-violet-600 text-white border-violet-500 shadow-lg'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}>
                    {showTrace ? <Eye size={20} /> : <EyeOff size={20} />}
                    {showTrace ? 'HIDE PATH TRACE' : 'SHOW PATH TRACE'}
                </button>
                <button
                    onClick={handleReset}
                    className="w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-10 py-3 md:py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-sm md:text-base shadow-sm active:scale-95">
                    <RotateCcw size={20} /> RESET SYSTEM
                </button>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

// ── Canvas Helpers ──────────────────────────────────────────────
function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, headLen: number) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath(); ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

export default MeanFreePathLab;
