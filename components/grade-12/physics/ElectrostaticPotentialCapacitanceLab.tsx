import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Battery, Layers, Minus, Pause, Play, Plus, RotateCcw, Sparkles, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ElectrostaticPotentialCapacitanceLabProps {
    topic: any;
    onExit: () => void;
}

type Scene = 'potential' | 'capacitor';
type BatteryState = 'connected' | 'disconnected';

interface Charge {
    id: number;
    x: number;
    y: number;
    q: number; // nC, signed
}

const W = 1280;
const H = 760;

const K_COULOMB = 9e9;
const EPS_0 = 8.854e-12;
const M_PER_PX = 1 / 120;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const pxDist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

// Compute potential (V) at canvas pixel due to charges (in nC).
const potentialAt = (px: number, py: number, charges: Charge[]) => {
    let V = 0;
    for (const c of charges) {
        const rPx = Math.hypot(px - c.x, py - c.y);
        if (rPx < 4) return c.q > 0 ? 1e9 : -1e9;
        const rM = rPx * M_PER_PX;
        V += (K_COULOMB * c.q * 1e-9) / rM;
    }
    return V;
};

// Map signed V (range +/- VMAX) → RGB. Warm = +V, cool = -V, white near zero.
const vToColor = (V: number, vmax: number) => {
    const t = clamp(V / vmax, -1, 1);
    // Smooth-step away from zero so the white band is narrow.
    const a = Math.sign(t) * Math.pow(Math.abs(t), 0.55);
    if (a >= 0) {
        // white → amber → red
        const r = Math.round(255);
        const g = Math.round(255 - a * (255 - 119));
        const b = Math.round(255 - a * (255 - 6));
        return `rgb(${r},${g},${b})`;
    }
    const u = -a;
    // white → cyan → indigo
    const r = Math.round(255 - u * (255 - 30));
    const g = Math.round(255 - u * (255 - 64));
    const b = Math.round(255 - u * (255 - 175));
    return `rgb(${r},${g},${b})`;
};

const ElectrostaticPotentialCapacitanceLab: React.FC<ElectrostaticPotentialCapacitanceLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragRef = useRef<{ kind: 'probe' | 'charge'; id?: number; dx: number; dy: number } | null>(null);

    const [scene, setScene] = useState<Scene>('potential');
    const [paused, setPaused] = useState(false);

    // ===== Potential scene state =====
    const [q1, setQ1] = useState(30);     // nC, signed
    const [q2, setQ2] = useState(-20);
    const [twoCharges, setTwoCharges] = useState(true);
    const [showContours, setShowContours] = useState(true);
    const [probePos, setProbePos] = useState({ x: W / 2 + 220, y: H / 2 - 60 });
    const [chargePos1, setChargePos1] = useState({ x: W / 2 - 180, y: H / 2 });
    const [chargePos2, setChargePos2] = useState({ x: W / 2 + 180, y: H / 2 });

    // ===== Capacitor scene state =====
    const [plateArea, setPlateArea] = useState(0.04);  // m²
    const [plateGap, setPlateGap] = useState(0.005);   // m  (5 mm)
    const [batteryV, setBatteryV] = useState(12);      // V
    const [dielectricK, setDielectricK] = useState(1); // K
    const [slabFrac, setSlabFrac] = useState(0);       // 0..1 (fraction inserted)
    const [battery, setBattery] = useState<BatteryState>('connected');
    const [storedQ, setStoredQ] = useState(0);         // C — only relevant when disconnected
    const [storedV, setStoredV] = useState(0);         // V — only relevant when disconnected

    // ===== Derived: potential scene charges =====
    const charges: Charge[] = useMemo(() => {
        const list: Charge[] = [{ id: 0, x: chargePos1.x, y: chargePos1.y, q: q1 }];
        if (twoCharges) list.push({ id: 1, x: chargePos2.x, y: chargePos2.y, q: q2 });
        return list;
    }, [q1, q2, twoCharges, chargePos1, chargePos2]);

    // ===== Derived: capacitor numbers =====
    const cap = useMemo(() => {
        // Effective K when slab inserted partially: parallel combination of (vacuum part) and (dielectric part)
        // Area split: vacuum (1-f) and dielectric (f), with d unchanged → C = ε₀A(1-f)/d + ε₀KA·f/d = ε₀A/d · (1 + f(K-1))
        const Keff = 1 + slabFrac * (dielectricK - 1);
        const C = EPS_0 * Keff * plateArea / plateGap; // farads
        let V: number;
        let Q: number;
        if (battery === 'connected') {
            V = batteryV;
            Q = C * V;
        } else {
            // charge frozen at last "connected" snapshot; re-derive V from Q/C
            Q = storedQ;
            V = C > 0 ? Q / C : 0;
        }
        const U = 0.5 * C * V * V; // J
        const E = plateGap > 0 ? V / plateGap : 0; // N/C
        const energyDensity = 0.5 * EPS_0 * E * E; // J/m³ (vacuum approximation for display)
        return { Keff, C, V, Q, U, E, energyDensity };
    }, [plateArea, plateGap, batteryV, dielectricK, slabFrac, battery, storedQ]);

    // When user disconnects, freeze current Q & V.
    useEffect(() => {
        if (battery === 'disconnected') {
            setStoredQ(cap.Q);
            setStoredV(cap.V);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [battery]);

    // ===== Reset =====
    const handleReset = useCallback(() => {
        setScene('potential');
        setPaused(false);
        setQ1(30); setQ2(-20); setTwoCharges(true); setShowContours(true);
        setProbePos({ x: W / 2 + 220, y: H / 2 - 60 });
        setChargePos1({ x: W / 2 - 180, y: H / 2 });
        setChargePos2({ x: W / 2 + 180, y: H / 2 });
        setPlateArea(0.04);
        setPlateGap(0.005);
        setBatteryV(12);
        setDielectricK(1);
        setSlabFrac(0);
        setBattery('connected');
        setStoredQ(0); setStoredV(0);
    }, []);

    // ===== Draw =====
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);

            // faint grid
            ctx.strokeStyle = '#eef2f7';
            ctx.lineWidth = 1;
            for (let x = 0; x <= W; x += 64) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
            }
            for (let y = 0; y <= H; y += 64) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }

            // Title
            ctx.fillStyle = '#0f172a';
            ctx.font = '600 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(scene === 'potential' ? 'Electrostatic potential — V heat-map & equipotentials' : 'Parallel-plate capacitor — geometry, dielectric & energy', 24, 28);

            if (scene === 'potential') drawPotentialScene(ctx);
            else drawCapacitorScene(ctx);

            // Hint
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            const hint = scene === 'potential'
                ? 'Drag the green probe — it reads V at its position. Drag the ± charges to reshape the field.'
                : 'Slide the dielectric in/out and watch C, Q, V, U respond. Toggle battery to lock Q.';
            ctx.fillText(hint, 24, 736);
        };

        const drawPotentialScene = (ctx: CanvasRenderingContext2D) => {
            // Heat-map (block-rendered for performance)
            const block = 10;
            // Determine vmax from current charges at a reference distance (avoid auto-blow-up near sources)
            const vmax = Math.max(
                ...charges.map(c => Math.abs((K_COULOMB * c.q * 1e-9) / (60 * M_PER_PX))),
                1
            );
            for (let y = 32; y < H - 28; y += block) {
                for (let x = 0; x < W; x += block) {
                    const V = potentialAt(x + block / 2, y + block / 2, charges);
                    ctx.fillStyle = vToColor(V, vmax);
                    ctx.fillRect(x, y, block, block);
                }
            }

            // Equipotential contours via marching-squares-lite: sample on a grid, threshold cells.
            if (showContours) {
                const grid = 16;
                const cols = Math.ceil(W / grid);
                const rows = Math.ceil((H - 60) / grid);
                const yOff = 32;
                const samples = new Float32Array(cols * rows);
                for (let j = 0; j < rows; j++) {
                    for (let i = 0; i < cols; i++) {
                        samples[j * cols + i] = potentialAt(i * grid, j * grid + yOff, charges);
                    }
                }
                const levels = [-vmax * 0.6, -vmax * 0.3, -vmax * 0.1, vmax * 0.1, vmax * 0.3, vmax * 0.6];
                ctx.lineWidth = 1.2;
                for (const L of levels) {
                    ctx.strokeStyle = L >= 0 ? 'rgba(124,45,18,0.55)' : 'rgba(30,64,175,0.55)';
                    for (let j = 0; j < rows - 1; j++) {
                        for (let i = 0; i < cols - 1; i++) {
                            const a = samples[j * cols + i];
                            const b = samples[j * cols + (i + 1)];
                            const c = samples[(j + 1) * cols + i];
                            const d = samples[(j + 1) * cols + (i + 1)];
                            const idx = (a > L ? 1 : 0) | (b > L ? 2 : 0) | (c > L ? 4 : 0) | (d > L ? 8 : 0);
                            if (idx === 0 || idx === 15) continue;
                            // Compute edge crossings linearly
                            const interp = (v1: number, v2: number, p1: [number, number], p2: [number, number]) => {
                                const t = (L - v1) / (v2 - v1);
                                return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t] as [number, number];
                            };
                            const TL: [number, number] = [i * grid, j * grid + yOff];
                            const TR: [number, number] = [(i + 1) * grid, j * grid + yOff];
                            const BL: [number, number] = [i * grid, (j + 1) * grid + yOff];
                            const BR: [number, number] = [(i + 1) * grid, (j + 1) * grid + yOff];
                            const segs: [[number, number], [number, number]][] = [];
                            const top = () => interp(a, b, TL, TR);
                            const right = () => interp(b, d, TR, BR);
                            const bottom = () => interp(c, d, BL, BR);
                            const left = () => interp(a, c, TL, BL);
                            switch (idx) {
                                case 1: case 14: segs.push([left(), top()]); break;
                                case 2: case 13: segs.push([top(), right()]); break;
                                case 3: case 12: segs.push([left(), right()]); break;
                                case 4: case 11: segs.push([left(), bottom()]); break;
                                case 5: segs.push([top(), right()]); segs.push([left(), bottom()]); break;
                                case 6: case 9: segs.push([top(), bottom()]); break;
                                case 7: case 8: segs.push([right(), bottom()]); break;
                                case 10: segs.push([left(), top()]); segs.push([right(), bottom()]); break;
                            }
                            for (const [p, q] of segs) {
                                ctx.beginPath();
                                ctx.moveTo(p[0], p[1]);
                                ctx.lineTo(q[0], q[1]);
                                ctx.stroke();
                            }
                        }
                    }
                }
            }

            // Source charges
            for (const c of charges) drawCharge(ctx, c);

            // Probe
            const Vprobe = potentialAt(probePos.x, probePos.y, charges);
            drawProbe(ctx, probePos, Vprobe);
        };

        const drawCharge = (ctx: CanvasRenderingContext2D, c: Charge) => {
            const r = 22 + Math.min(14, Math.abs(c.q) * 0.25);
            const grad = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.3, r * 0.2, c.x, c.y, r);
            if (c.q > 0) { grad.addColorStop(0, '#fecaca'); grad.addColorStop(1, '#dc2626'); }
            else { grad.addColorStop(0, '#bfdbfe'); grad.addColorStop(1, '#1d4ed8'); }
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = `700 ${Math.round(r * 1.1)}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(c.q >= 0 ? '+' : '−', c.x, c.y + 1);
            ctx.font = '600 12px Inter, system-ui, sans-serif';
            ctx.fillStyle = '#0f172a'; ctx.textBaseline = 'top';
            ctx.fillText(`${c.q >= 0 ? '+' : ''}${c.q.toFixed(0)} nC`, c.x, c.y + r + 6);
            ctx.textBaseline = 'alphabetic';
        };

        const drawProbe = (ctx: CanvasRenderingContext2D, pos: { x: number; y: number }, V: number) => {
            const r = 14;
            ctx.fillStyle = '#16a34a';
            ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('V', pos.x, pos.y + 1);
            // V readout chip
            const label = `V = ${Math.abs(V) > 9999 ? V.toExponential(2) : V.toFixed(0)} V`;
            ctx.font = '700 13px Inter, system-ui, sans-serif';
            const w = ctx.measureText(label).width + 16;
            const bx = pos.x - w / 2;
            const by = pos.y - r - 28;
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(bx, by, w, 22, 6);
            ctx.fill();
            ctx.fillStyle = '#fde68a';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, pos.x, by + 12);
            ctx.textBaseline = 'alphabetic';
        };

        const drawCapacitorScene = (ctx: CanvasRenderingContext2D) => {
            const cx = W / 2;
            const cy = H / 2 + 20;
            const visW = clamp(380 + (Math.sqrt(plateArea) - Math.sqrt(0.005)) * 1800, 320, 880);
            const visGap = clamp(40 + (plateGap - 0.001) * 12000, 36, 280);
            const topPlateY = cy - visGap / 2 - 16;
            const botPlateY = cy + visGap / 2;
            const plateThick = 16;

            // ---------- Battery (proper symbol) ----------
            const bx = 130, by = cy;
            const live = battery === 'connected';
            ctx.strokeStyle = live ? '#0f172a' : '#cbd5e1';
            ctx.fillStyle = live ? '#0f172a' : '#cbd5e1';
            ctx.lineWidth = 4;
            // Long line (+) top, short line (−) bottom of the battery symbol
            ctx.beginPath();
            ctx.moveTo(bx - 26, by - 18); ctx.lineTo(bx + 26, by - 18); // long +
            ctx.moveTo(bx - 14, by - 4); ctx.lineTo(bx + 14, by - 4);   // short −
            ctx.moveTo(bx - 26, by + 12); ctx.lineTo(bx + 26, by + 12); // long +
            ctx.moveTo(bx - 14, by + 26); ctx.lineTo(bx + 14, by + 26); // short −
            ctx.stroke();
            ctx.font = '700 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(live ? `${batteryV.toFixed(0)} V` : `${batteryV.toFixed(0)} V  (open)`, bx, by + 50);
            ctx.fillStyle = '#dc2626'; ctx.font = '800 16px Inter, system-ui, sans-serif';
            ctx.fillText('+', bx - 38, by - 12);
            ctx.fillStyle = '#1d4ed8';
            ctx.fillText('−', bx - 38, by + 32);

            // ---------- Wires from battery to plates ----------
            ctx.strokeStyle = live ? '#0f172a' : '#cbd5e1';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(bx + 26, by - 12);
            ctx.lineTo(cx - visW / 2 - 28, by - 12);
            ctx.lineTo(cx - visW / 2 - 28, topPlateY + plateThick / 2);
            ctx.lineTo(cx - visW / 2, topPlateY + plateThick / 2);

            ctx.moveTo(bx + 26, by + 22);
            ctx.lineTo(cx - visW / 2 - 46, by + 22);
            ctx.lineTo(cx - visW / 2 - 46, botPlateY + plateThick / 2);
            ctx.lineTo(cx - visW / 2, botPlateY + plateThick / 2);
            ctx.stroke();

            // ---------- Animated current pulse on wires when connected ----------
            if (live) {
                const t = performance.now() / 1000;
                const phase = (t * 1.5) % 1;
                ctx.fillStyle = '#facc15';
                // Top wire (+): pulses flow from battery to plate
                const pts: [number, number][] = [
                    [bx + 26, by - 12], [cx - visW / 2 - 28, by - 12],
                    [cx - visW / 2 - 28, topPlateY + plateThick / 2], [cx - visW / 2, topPlateY + plateThick / 2],
                ];
                drawPulseAlong(ctx, pts, phase, '#facc15');
                const pts2: [number, number][] = [
                    [cx - visW / 2, botPlateY + plateThick / 2], [cx - visW / 2 - 46, botPlateY + plateThick / 2],
                    [cx - visW / 2 - 46, by + 22], [bx + 26, by + 22],
                ];
                drawPulseAlong(ctx, pts2, phase, '#facc15');
            }

            // ---------- Slab geometry (slides in from right) ----------
            const fieldXStart = cx - visW / 2 + 8;
            const fieldXEnd = cx + visW / 2 - 8;
            const innerW = fieldXEnd - fieldXStart;
            const slabPxW = innerW * slabFrac;
            const slabX0 = fieldXEnd - slabPxW;
            const yTop = topPlateY + plateThick;
            const yBot = botPlateY;

            // background tint for vacuum vs dielectric
            ctx.fillStyle = 'rgba(248,250,252,0.6)';
            ctx.fillRect(fieldXStart, yTop, innerW, visGap);
            if (slabPxW > 1) {
                const grad = ctx.createLinearGradient(slabX0, 0, fieldXEnd, 0);
                grad.addColorStop(0, 'rgba(125,211,252,0.55)');
                grad.addColorStop(1, 'rgba(56,189,248,0.65)');
                ctx.fillStyle = grad;
                ctx.fillRect(slabX0, yTop, slabPxW, visGap);
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 2;
                ctx.strokeRect(slabX0, yTop, slabPxW, visGap);
                ctx.fillStyle = '#0c4a6e';
                ctx.font = '800 16px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`Dielectric  K = ${dielectricK.toFixed(1)}`, slabX0 + slabPxW / 2, cy + 5);
                // Induced charges on slab surfaces (bound charges)
                if (dielectricK > 1.05) {
                    ctx.fillStyle = '#1d4ed8'; ctx.font = '700 12px Inter, system-ui, sans-serif';
                    for (let i = 0; i < Math.max(3, slabPxW / 30); i++) {
                        const px = slabX0 + 8 + i * 22;
                        if (px > fieldXEnd - 6) break;
                        ctx.fillText('−', px, yTop + 11);
                    }
                    ctx.fillStyle = '#dc2626';
                    for (let i = 0; i < Math.max(3, slabPxW / 30); i++) {
                        const px = slabX0 + 8 + i * 22;
                        if (px > fieldXEnd - 6) break;
                        ctx.fillText('+', px, yBot - 1);
                    }
                }
            }

            // ---------- E-field arrows (length & count scale with E) ----------
            const Enorm = clamp(cap.E / 8000, 0, 1);
            const arrows = Math.round(8 + Enorm * 12);
            const baseLen = visGap - 20;
            ctx.lineWidth = 2;
            for (let i = 0; i < arrows; i++) {
                const ax = fieldXStart + ((i + 0.5) / arrows) * innerW;
                const inSlab = ax >= slabX0 && slabPxW > 1;
                const lenScale = (0.5 + Enorm * 0.5);
                const len = (inSlab ? baseLen / Math.max(dielectricK, 0.01) : baseLen) * lenScale;
                const yStart = yTop + (visGap - len) / 2;
                const color = inSlab ? '#0ea5e9' : '#1d4ed8';
                drawArrow(ctx, ax, yStart, ax, yStart + len, color, 2 + Enorm * 1.5);
            }

            // ---------- Plates ----------
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(cx - visW / 2, topPlateY, visW, plateThick);
            ctx.fillStyle = '#1d4ed8';
            ctx.fillRect(cx - visW / 2, botPlateY, visW, plateThick);

            // surface-charge symbols — density scales with |Q|
            const Qnorm = clamp(Math.abs(cap.Q) / 5e-9, 0.15, 1);
            const dotCount = Math.max(4, Math.round(visW / (40 - Qnorm * 26)));
            ctx.font = `${700 + Math.round(Qnorm * 200)} ${12 + Math.round(Qnorm * 6)}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fef3c7';
            for (let i = 0; i < dotCount; i++) {
                const px = cx - visW / 2 + (visW / dotCount) * (i + 0.5);
                ctx.fillText('+', px, topPlateY + plateThick / 2);
            }
            ctx.fillStyle = '#dbeafe';
            for (let i = 0; i < dotCount; i++) {
                const px = cx - visW / 2 + (visW / dotCount) * (i + 0.5);
                ctx.fillText('−', px, botPlateY + plateThick / 2);
            }
            ctx.textBaseline = 'alphabetic';

            // ---------- Plate labels ----------
            ctx.fillStyle = '#dc2626';
            ctx.font = '800 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`+Q  (${formatQ(cap.Q)})`, cx + visW / 2 + 14, topPlateY + 11);
            ctx.fillStyle = '#1d4ed8';
            ctx.fillText(`−Q  (${formatQ(cap.Q)})`, cx + visW / 2 + 14, botPlateY + 11);

            // d arrow on the right
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx + visW / 2 + 8, topPlateY + plateThick);
            ctx.lineTo(cx + visW / 2 + 8, botPlateY);
            ctx.stroke();
            ctx.fillStyle = '#475569';
            ctx.font = '700 12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`d = ${(plateGap * 1000).toFixed(1)} mm`, cx + visW / 2 + 14, cy + 28);

            // A label below
            ctx.fillStyle = '#475569';
            ctx.font = '700 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`A = ${(plateArea * 1e4).toFixed(0)} cm²`, cx, botPlateY + 42);

            // ---------- Live formula footer ----------
            const fy = H - 90;
            ctx.fillStyle = '#fff7ed';
            ctx.strokeStyle = '#fdba74';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(40, fy - 28, W - 80, 64, 12);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#9a3412';
            ctx.font = '800 15px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('C = K · ε₀ · A / d', 64, fy - 6);
            ctx.fillStyle = '#7c2d12';
            ctx.font = '700 14px monospace';
            ctx.fillText(
                `= ${cap.Keff.toFixed(2)} · (8.85×10⁻¹²) · ${plateArea.toFixed(4)} / ${plateGap.toFixed(4)}  =  ${formatF(cap.C)}`,
                64, fy + 18
            );
            ctx.textAlign = 'right';
            ctx.fillStyle = '#0f172a';
            ctx.font = '800 14px Inter, system-ui, sans-serif';
            ctx.fillText(`Q = CV = ${formatQ(cap.Q)}    ·    U = ½CV² = ${formatJ(cap.U)}    ·    E = V/d = ${formatE(cap.E)}V/m`, W - 64, fy + 18);

            // ---------- "Energy stored" mini-bar above battery ----------
            const Ubar = clamp(cap.U / 5e-7, 0, 1);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(bx - 34, by - 110, 68, 12);
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(bx - 34, by - 110, 68 * Ubar, 12);
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Energy U', bx, by - 118);
        };

        const drawPulseAlong = (
            ctx: CanvasRenderingContext2D, pts: [number, number][], phase: number, color: string
        ) => {
            // total length
            const segs: number[] = [];
            let total = 0;
            for (let i = 1; i < pts.length; i++) {
                const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
                segs.push(L); total += L;
            }
            // place 3 pulses spaced out
            for (let p = 0; p < 3; p++) {
                const u = ((phase + p / 3) % 1) * total;
                let acc = 0;
                for (let i = 1; i < pts.length; i++) {
                    if (acc + segs[i - 1] >= u) {
                        const f = (u - acc) / segs[i - 1];
                        const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f;
                        const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
                        ctx.fillStyle = color;
                        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
                        break;
                    }
                    acc += segs[i - 1];
                }
            }
        };

        const drawArrow = (
            ctx: CanvasRenderingContext2D,
            x1: number, y1: number, x2: number, y2: number,
            color: string, width = 2
        ) => {
            const ang = Math.atan2(y2 - y1, x2 - x1);
            const head = Math.max(6, width * 3);
            ctx.strokeStyle = color; ctx.fillStyle = color;
            ctx.lineWidth = width; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
            ctx.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
            ctx.closePath(); ctx.fill();
        };

        let raf = 0;
        const tick = () => {
            draw();
            if (!paused) raf = requestAnimationFrame(tick);
        };
        tick();
        if (paused) draw();
        return () => cancelAnimationFrame(raf);
    }, [scene, charges, showContours, twoCharges, probePos, paused,
        plateArea, plateGap, batteryV, dielectricK, slabFrac, battery]);

    // ===== Pointer handling =====
    const toCanvas = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const c = canvasRef.current!;
        const rect = c.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * W;
        const y = ((e.clientY - rect.top) / rect.height) * H;
        return { x, y };
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (scene !== 'potential') return;
        const { x, y } = toCanvas(e);
        if (pxDist(x, y, probePos.x, probePos.y) < 26) {
            dragRef.current = { kind: 'probe', dx: x - probePos.x, dy: y - probePos.y };
            (e.target as Element).setPointerCapture?.(e.pointerId);
            return;
        }
        for (const c of charges) {
            if (pxDist(x, y, c.x, c.y) < 32) {
                dragRef.current = { kind: 'charge', id: c.id, dx: x - c.x, dy: y - c.y };
                (e.target as Element).setPointerCapture?.(e.pointerId);
                return;
            }
        }
    }, [scene, toCanvas, probePos, charges]);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const d = dragRef.current;
        if (!d) return;
        const { x, y } = toCanvas(e);
        const nx = clamp(x - d.dx, 30, W - 30);
        const ny = clamp(y - d.dy, 50, H - 60);
        if (d.kind === 'probe') {
            setProbePos({ x: nx, y: ny });
        } else if (d.kind === 'charge') {
            if (d.id === 0) setChargePos1({ x: nx, y: ny });
            else if (d.id === 1) setChargePos2({ x: nx, y: ny });
        }
    }, [toCanvas]);

    const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

    // ===== Side panels =====
    const graphPanel = (
        <aside
            className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20
                       hidden w-[340px] 2xl:block overflow-y-auto pr-1"
        >
            <div className="flex flex-col gap-2.5">
                {scene === 'potential' ? (
                    <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">V vs distance r</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">Point charge — V = kq/r</div>
                            <InverseRGraph qNC={q1} />
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Equipotential rules</div>
                            <ul className="text-xs leading-snug text-slate-700 list-disc pl-4 space-y-1 mt-1">
                                <li>V is <b>constant</b> on each contour line.</li>
                                <li><b>E</b> ⟂ equipotential, points toward lower V.</li>
                                <li>Closer contours ⇒ stronger field.</li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Colour key</div>
                            <div className="mt-2 h-3 rounded-full" style={{
                                background: 'linear-gradient(90deg,#1e40af 0%,#ffffff 50%,#d97706 100%)'
                            }} />
                            <div className="flex justify-between text-[10px] font-semibold text-slate-500 mt-1">
                                <span>− V</span><span>0</span><span>+ V</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Capacitance formula</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">Parallel plate · NCERT §2.12–§2.13</div>
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center font-mono text-sm text-amber-900">
                                C = K · ε₀ · A / d
                            </div>
                            <ul className="text-xs leading-snug text-slate-700 list-disc pl-4 space-y-1 mt-2">
                                <li>A ↑ → C ↑ (more area, more charge per volt)</li>
                                <li>d ↑ → C ↓ (farther plates, weaker pull)</li>
                                <li>K ↑ → C ↑ (dielectric reduces internal field)</li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Energy stored</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §2.15</div>
                            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center font-mono text-sm text-emerald-900">
                                U = ½ Q V = ½ C V² = ½ Q² / C
                            </div>
                            <p className="text-xs leading-snug text-slate-700 mt-2">Energy density in the field: u = ½ ε₀ E².</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Battery mode</div>
                            <p className="text-xs leading-snug text-slate-700 mt-1">
                                <b>Connected:</b> V is fixed; Q = CV changes when C changes.
                            </p>
                            <p className="text-xs leading-snug text-slate-700 mt-1">
                                <b>Disconnected:</b> Q is locked; V = Q/C changes when C changes.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside
            className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20
                       hidden w-[310px] 2xl:block overflow-y-auto pl-1"
        >
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">
                        {scene === 'potential' ? 'Electrostatic Potential' : 'Capacitance & Energy'}
                    </div>
                    <div className="text-xs font-semibold text-amber-700 mb-2">
                        {scene === 'potential' ? 'NCERT Ch 2 · §2.2–§2.6' : 'NCERT Ch 2 · §2.11–§2.15'}
                    </div>
                    {scene === 'potential' ? (
                        <>
                            <p className="text-sm leading-snug text-amber-950">
                                V at a point = work done by an external agency to bring a unit positive charge from ∞ to that point (no acceleration). Scalar.
                            </p>
                            <p className="text-sm leading-snug text-amber-950 mt-2">
                                Point charge: V = (1/4πε₀)·q/r.&nbsp; Many charges: scalar sum.
                            </p>
                            <p className="text-xs text-amber-800 mt-2">E is perpendicular to equipotentials, pointing toward decreasing V.</p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm leading-snug text-amber-950">
                                C = Q/V is set <b>by geometry</b> (A, d, K) — not by the charge you put on the plates.
                            </p>
                            <p className="text-sm leading-snug text-amber-950 mt-2">
                                Insert dielectric (K) ⇒ C → K·C₀ (NCERT §2.13).
                            </p>
                            <p className="text-xs text-amber-800 mt-2">Energy lives in the field between the plates: u = ½ε₀E².</p>
                        </>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-extrabold text-slate-900">Real-time values</div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE
                        </span>
                    </div>
                    <div className="space-y-2">
                        {scene === 'potential' ? (
                            <>
                                <ValueRow label="V at probe" value={`${formatV(potentialAt(probePos.x, probePos.y, charges))} V`} />
                                <ValueRow label="Source 1" value={`${q1 >= 0 ? '+' : ''}${q1.toFixed(0)} nC`} />
                                {twoCharges && <ValueRow label="Source 2" value={`${q2 >= 0 ? '+' : ''}${q2.toFixed(0)} nC`} />}
                            </>
                        ) : (
                            <>
                                <ValueRow label="Capacitance C" value={`${formatF(cap.C)}`} />
                                <ValueRow label="Charge Q" value={`${formatQ(cap.Q)}`} />
                                <ValueRow label="Voltage V" value={`${cap.V.toFixed(2)} V`} />
                                <ValueRow label="Energy U" value={`${formatJ(cap.U)}`} />
                                <ValueRow label="Field E" value={`${formatE(cap.E)} V/m`} />
                                <ValueRow label="Effective K" value={`${cap.Keff.toFixed(2)}`} />
                            </>
                        )}
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
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    className="absolute inset-0 h-full w-full cursor-pointer touch-none"
                />
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={() => setPaused(p => !p)}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50"
                        title={paused ? 'Play' : 'Pause'}
                    >{paused ? <Play size={15} /> : <Pause size={15} />}</button>
                    <button
                        onClick={handleReset}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50"
                        title="Reset"
                    ><RotateCcw size={15} /></button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-3 text-slate-800">
                <Zap size={18} className="text-amber-600" />
                <span className="font-extrabold text-base">Potential & Capacitance Bench</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Scene</div>
                    <div className="grid grid-cols-2 gap-1">
                        <ModeButton active={scene === 'potential'} onClick={() => setScene('potential')} icon={<Sparkles size={14} />} label="Potential map" />
                        <ModeButton active={scene === 'capacitor'} onClick={() => setScene('capacitor')} icon={<Layers size={14} />} label="Capacitor" />
                    </div>
                </div>

                {scene === 'potential' ? (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Display</div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none mb-2">
                                <input type="checkbox" checked={twoCharges} onChange={e => setTwoCharges(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                                Two charges
                            </label>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none">
                                <input type="checkbox" checked={showContours} onChange={e => setShowContours(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                                Show equipotential lines
                            </label>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="Charge q₁" value={q1} min={-60} max={60} step={1} unit="nC" onChange={setQ1} />
                        </div>
                        {twoCharges && (
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                <SliderRow label="Charge q₂" value={q2} min={-60} max={60} step={1} unit="nC" onChange={setQ2} />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-2"><Battery size={14} />Battery</div>
                            <div className="grid grid-cols-2 gap-1 mb-2">
                                <ModeButton active={battery === 'connected'} onClick={() => setBattery('connected')} icon={<Plus size={14} />} label="Connected" />
                                <ModeButton active={battery === 'disconnected'} onClick={() => setBattery('disconnected')} icon={<Minus size={14} />} label="Disconnected" />
                            </div>
                            <SliderRow label="Battery V" value={batteryV} min={1} max={50} step={1} unit="V" onChange={setBatteryV} disabled={battery === 'disconnected'} />
                            <p className="mt-2 text-[11px] leading-snug text-slate-500">
                                {battery === 'connected' ? 'V fixed → Q follows C.' : 'Q frozen → V follows 1/C.'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Plate geometry</div>
                            <SliderRow label="Area A" value={Number((plateArea * 1e4).toFixed(0))} min={5} max={1000} step={5} unit="cm²" onChange={(v) => setPlateArea(v / 1e4)} />
                            <div className="h-2" />
                            <SliderRow label="Gap d" value={Number((plateGap * 1000).toFixed(1))} min={1} max={20} step={0.5} unit="mm" onChange={(v) => setPlateGap(v / 1000)} />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Dielectric slab</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <SliderRow label="Dielectric constant K" value={dielectricK} min={1} max={10} step={0.5} unit="" onChange={setDielectricK} />
                                <SliderRow label="Slab inserted" value={Number((slabFrac * 100).toFixed(0))} min={0} max={100} step={5} unit="%" onChange={(v) => setSlabFrac(v / 100)} />
                            </div>
                            <p className="mt-2 text-[11px] leading-snug text-slate-500">
                                K = 1 (vacuum) · 2.25 (paper) · 4.7 (mica) · 80 (water). Slide in to see C grow and field weaken inside the slab.
                            </p>
                        </div>
                    </>
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
        />
    );
};

// ============ formatting helpers ============
const formatV = (v: number) => Math.abs(v) >= 1e4 ? v.toExponential(2) : v.toFixed(0);
const formatF = (C: number) => {
    if (C >= 1e-6) return `${(C * 1e6).toFixed(2)} µF`;
    if (C >= 1e-9) return `${(C * 1e9).toFixed(2)} nF`;
    return `${(C * 1e12).toFixed(2)} pF`;
};
const formatQ = (Q: number) => {
    if (Math.abs(Q) >= 1e-6) return `${(Q * 1e6).toFixed(2)} µC`;
    if (Math.abs(Q) >= 1e-9) return `${(Q * 1e9).toFixed(2)} nC`;
    return `${(Q * 1e12).toFixed(2)} pC`;
};
const formatJ = (U: number) => {
    if (Math.abs(U) >= 1) return `${U.toFixed(2)} J`;
    if (Math.abs(U) >= 1e-3) return `${(U * 1e3).toFixed(2)} mJ`;
    if (Math.abs(U) >= 1e-6) return `${(U * 1e6).toFixed(2)} µJ`;
    return `${(U * 1e9).toFixed(2)} nJ`;
};
const formatE = (E: number) => {
    if (Math.abs(E) >= 1e3) return `${(E / 1e3).toFixed(2)} k`;
    return `${E.toFixed(0)} `;
};

// ============ subcomponents ============
const ValueRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 font-mono text-base font-extrabold text-amber-700">{value}</div>
    </div>
);

const ModeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-semibold transition-colors ${active ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
    >
        {icon}<span>{label}</span>
    </button>
);

interface SliderRowProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    onChange: (v: number) => void;
    disabled?: boolean;
}
const SliderRow: React.FC<SliderRowProps> = ({ label, value, min, max, step, unit, onChange, disabled }) => (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className="font-mono text-sm font-bold text-amber-700">{value} {unit}</span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step} value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 accent-amber-500"
        />
    </div>
);

const InverseRGraph: React.FC<{ qNC: number }> = ({ qNC }) => {
    const w = 300, h = 160;
    const padL = 32, padB = 26, padT = 8, padR = 8;
    const xMin = 0.3, xMax = 6;
    const yMax = Math.abs(qNC) * 1e-9 * K_COULOMB / xMin;
    const x = (r: number) => padL + ((r - xMin) / (xMax - xMin)) * (w - padL - padR);
    const y = (V: number) => h - padB - (V / yMax) * (h - padT - padB);
    const pts: string[] = [];
    for (let i = 0; i <= 80; i++) {
        const r = xMin + (i / 80) * (xMax - xMin);
        const V = Math.abs(qNC) * 1e-9 * K_COULOMB / r;
        pts.push(`${x(r).toFixed(1)},${y(V).toFixed(1)}`);
    }
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[160px]">
            <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#475569" strokeWidth={1} />
            <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#475569" strokeWidth={1} />
            <polyline fill="none" stroke="#0891b2" strokeWidth={2.2} points={pts.join(' ')} />
            <text x={w - padR} y={h - 8} fontSize={10} textAnchor="end" fill="#64748b">r (m)</text>
            <text x={padL + 4} y={padT + 10} fontSize={10} fill="#64748b">|V| (V)</text>
            <text x={w - padR} y={padT + 12} fontSize={10} textAnchor="end" fill="#0891b2">V ∝ 1 / r</text>
        </svg>
    );
};

export default ElectrostaticPotentialCapacitanceLab;
