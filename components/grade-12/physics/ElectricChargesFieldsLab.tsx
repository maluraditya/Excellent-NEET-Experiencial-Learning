import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atom, Eye, Minus, Move, Pause, Play, Plus, RotateCcw, Sparkles, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ElectricChargesFieldsLabProps {
    topic: any;
    onExit: () => void;
}

type SceneMode = 'single' | 'pair' | 'dipole' | 'gauss';
type Visualization = 'arrows' | 'lines';

interface Charge {
    id: number;
    x: number; // canvas px
    y: number;
    q: number; // nC, can be negative
}

const W = 1280;
const H = 760;

// Scaling: 1 metre = 120 px. Charge magnitudes in nano-coulombs (NCERT scale).
const M_PER_PX = 1 / 120;
const K_COULOMB = 9e9; // N m^2 C^-2 (NCERT approx.)
const EPSILON_0 = 8.854e-12; // C^2 N^-1 m^-2 (NCERT value)
const Q_TEST = 1e-9; // 1 nC test charge

const ARROW_GRID_STEP = 72; // px between vector samples
const ARROW_MAX_PX = 56; // visual cap

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const pxDist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

// Returns (Ex, Ey) in N/C at canvas-pixel point due to a single charge in nC.
const fieldAt = (px: number, py: number, c: Charge) => {
    const dxPx = px - c.x;
    const dyPx = py - c.y;
    const rPx = Math.hypot(dxPx, dyPx);
    if (rPx < 4) return { Ex: 0, Ey: 0 };
    const rM = rPx * M_PER_PX;
    const qC = c.q * 1e-9;
    const Emag = (K_COULOMB * qC) / (rM * rM); // signed (+ outward for +q)
    return { Ex: Emag * (dxPx / rPx), Ey: Emag * (dyPx / rPx) };
};

const totalField = (px: number, py: number, charges: Charge[]) => {
    let Ex = 0;
    let Ey = 0;
    for (const c of charges) {
        const f = fieldAt(px, py, c);
        Ex += f.Ex;
        Ey += f.Ey;
    }
    return { Ex, Ey };
};

const fieldStrengthColor = (mag: number) => {
    // mag is N/C — map log scale to colour. Cool (weak) → warm (strong).
    const v = clamp(Math.log10(mag + 1), 0, 6) / 6;
    if (v < 0.5) {
        const t = v / 0.5;
        const r = Math.round(56 + t * (217 - 56));
        const g = Math.round(189 + t * (119 - 189));
        const b = Math.round(248 + t * (6 - 248));
        return `rgb(${r},${g},${b})`;
    }
    const t = (v - 0.5) / 0.5;
    const r = Math.round(217 + t * (220 - 217));
    const g = Math.round(119 + t * (38 - 119));
    const b = Math.round(6 + t * (38 - 6));
    return `rgb(${r},${g},${b})`;
};

const ElectricChargesFieldsLab: React.FC<ElectricChargesFieldsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragRef = useRef<{ kind: 'charge' | 'test'; id?: number; dx: number; dy: number } | null>(null);

    const [mode, setMode] = useState<SceneMode>('pair');
    const [viz, setViz] = useState<Visualization>('arrows');
    const [showTest, setShowTest] = useState(true);
    const [paused, setPaused] = useState(false);

    // Single charge magnitude (nC) for single mode
    const [qSingle, setQSingle] = useState(20);

    // Pair mode: q1, q2 magnitudes; signs follow toggles
    const [q1Mag, setQ1Mag] = useState(20);
    const [q2Mag, setQ2Mag] = useState(20);
    const [q1Sign, setQ1Sign] = useState<1 | -1>(1);
    const [q2Sign, setQ2Sign] = useState<1 | -1>(-1);
    const [separationPx, setSeparationPx] = useState(360);

    // Dipole mode: q magnitude, separation
    const [qDipole, setQDipole] = useState(30);
    const [dipoleSepPx, setDipoleSepPx] = useState(160);

    // Point charge enclosed by a spherical Gaussian surface.
    const [qGauss, setQGauss] = useState(30);
    const [gaussRadiusPx, setGaussRadiusPx] = useState(216);

    // Test charge position (canvas px)
    const [testPos, setTestPos] = useState({ x: W / 2 + 240, y: H / 2 - 120 });

    const charges: Charge[] = useMemo(() => {
        if (mode === 'single') {
            return [{ id: 0, x: W / 2, y: H / 2, q: qSingle }];
        }
        if (mode === 'pair') {
            const half = separationPx / 2;
            return [
                { id: 0, x: W / 2 - half, y: H / 2, q: q1Sign * q1Mag },
                { id: 1, x: W / 2 + half, y: H / 2, q: q2Sign * q2Mag }
            ];
        }
        if (mode === 'gauss') {
            return [{ id: 0, x: W / 2, y: H / 2, q: qGauss }];
        }
        // dipole: always +q on right, -q on left
        const half = dipoleSepPx / 2;
        return [
            { id: 0, x: W / 2 - half, y: H / 2, q: -qDipole },
            { id: 1, x: W / 2 + half, y: H / 2, q: qDipole }
        ];
    }, [mode, qSingle, q1Sign, q2Sign, q1Mag, q2Mag, separationPx, qDipole, dipoleSepPx, qGauss]);

    const handleReset = useCallback(() => {
        setMode('pair');
        setViz('arrows');
        setShowTest(true);
        setPaused(false);
        setQSingle(20);
        setQ1Mag(20);
        setQ2Mag(20);
        setQ1Sign(1);
        setQ2Sign(-1);
        setSeparationPx(360);
        setQDipole(30);
        setDipoleSepPx(160);
        setQGauss(30);
        setGaussRadiusPx(216);
        setTestPos({ x: W / 2 + 240, y: H / 2 - 120 });
    }, []);

    // Derived live values
    const live = useMemo(() => {
        const f = totalField(testPos.x, testPos.y, charges);
        const Emag = Math.hypot(f.Ex, f.Ey);
        const Fmag = Emag * Q_TEST;
        const probeSingular = charges.some(c => pxDist(testPos.x, testPos.y, c.x, c.y) < 36 + Math.min(14, Math.abs(c.q) * 0.25));
        const separationM = mode === 'pair'
            ? separationPx * M_PER_PX
            : mode === 'dipole'
                ? dipoleSepPx * M_PER_PX
                : 0;
        const dipoleMoment = mode === 'dipole'
            ? qDipole * 1e-9 * separationM // p = q x 2a (separation already 2a)
            : null;
        const gaussRadiusM = gaussRadiusPx * M_PER_PX;
        const gaussFlux = mode === 'gauss' ? qGauss * 1e-9 / EPSILON_0 : null;
        const gaussSurfaceField = mode === 'gauss'
            ? Math.abs(qGauss) * 1e-9 / (4 * Math.PI * EPSILON_0 * gaussRadiusM * gaussRadiusM)
            : null;
        return { Emag, Fmag, separationM, dipoleMoment, Ex: f.Ex, Ey: f.Ey, probeSingular, gaussRadiusM, gaussFlux, gaussSurfaceField };
    }, [testPos, charges, mode, separationPx, dipoleSepPx, qDipole, gaussRadiusPx, qGauss]);

    // --- Draw loop ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = (t: number) => {
            // Background
            const background = ctx.createLinearGradient(0, 0, W, H);
            background.addColorStop(0, '#f8fafc');
            background.addColorStop(0.5, '#f0f9ff');
            background.addColorStop(1, '#fff7ed');
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, W, H);

            // Faint grid
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
            ctx.lineWidth = 1;
            for (let x = 0; x <= W; x += ARROW_GRID_STEP) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, H);
                ctx.stroke();
            }
            for (let y = 0; y <= H; y += ARROW_GRID_STEP) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(W, y);
                ctx.stroke();
            }

            // Title strip (above y=30)
            ctx.fillStyle = '#0f172a';
            ctx.font = '600 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            const title = mode === 'single' ? 'Single point charge — radial field'
                : mode === 'pair' ? 'Two charges — superposition'
                    : mode === 'dipole' ? 'Electric dipole — axial & equatorial field'
                        : 'Gauss\'s law — flux depends only on enclosed charge';
            ctx.fillText(title, 24, 28);

            // Visualization layer
            if (viz === 'arrows') {
                drawArrows(ctx, charges, t);
            } else {
                drawFieldLines(ctx, charges, t);
            }

            if (mode === 'gauss') drawGaussOverlay(ctx, t);

            // Source charges
            for (const c of charges) {
                drawCharge(ctx, c, t);
            }

            // Test charge + its force vector
            if (showTest && mode !== 'gauss') {
                drawTestCharge(ctx, testPos, charges, t);
            }

            // Mode-specific short labels
            if (mode === 'dipole') {
                const left = charges[0];
                const right = charges[1];
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(left.x, left.y);
                ctx.lineTo(right.x, right.y);
                ctx.stroke();
                // p arrow from -q to +q
                drawArrow(ctx, (left.x + right.x) / 2 - 30, left.y - 36, (left.x + right.x) / 2 + 30, left.y - 36, '#0f766e', 3);
                ctx.fillStyle = '#0f766e';
                ctx.font = '700 14px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('p', (left.x + right.x) / 2 + 44, left.y - 32);
                ctx.fillStyle = '#475569';
                ctx.font = '600 12px Inter, system-ui, sans-serif';
                ctx.fillText('2a', (left.x + right.x) / 2, left.y + 36);
            }

            // Hint line just above y=740 (per layout standard — no filled bar)
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            const hint = mode === 'gauss'
                ? 'Change the Gaussian radius: surface E changes, but total flux q/ε₀ stays constant.'
                : showTest
                    ? 'Drag the green test charge — the red arrow shows the force it feels.'
                    : 'Toggle "Show test charge" to probe the field with a small +1 nC charge.';
            ctx.fillText(hint, 24, 736);
        };

        let raf = 0;
        let elapsed = 0;
        let previous = performance.now();
        const tick = (now = performance.now()) => {
            if (!paused && now - previous < 1000 / 30) {
                raf = requestAnimationFrame(tick);
                return;
            }
            const dt = Math.min(100, Math.max(0, now - previous));
            previous = now;
            elapsed += dt;
            draw(elapsed);
            if (!paused) raf = requestAnimationFrame(tick);
        };
        tick();
        // Always draw once when paused so updates show
        if (paused) draw(elapsed);
        return () => cancelAnimationFrame(raf);
    }, [charges, viz, mode, showTest, testPos, paused, gaussRadiusPx, live.probeSingular]);

    // --- Pointer dragging on canvas (charges + test) ---
    const toCanvas = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const c = canvasRef.current!;
        const rect = c.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * W;
        const y = ((e.clientY - rect.top) / rect.height) * H;
        return { x, y };
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const { x, y } = toCanvas(e);
        // Test charge first (drawn on top)
        if (showTest && pxDist(x, y, testPos.x, testPos.y) < 26) {
            dragRef.current = { kind: 'test', dx: x - testPos.x, dy: y - testPos.y };
            (e.target as Element).setPointerCapture?.(e.pointerId);
            return;
        }
        for (const c of charges) {
            if (pxDist(x, y, c.x, c.y) < 32) {
                // In pair mode the user adjusts separation via slider — allow vertical-only drag? Keep simple: ignore drag on sources.
                dragRef.current = { kind: 'charge', id: c.id, dx: x - c.x, dy: y - c.y };
                (e.target as Element).setPointerCapture?.(e.pointerId);
                return;
            }
        }
    }, [toCanvas, charges, testPos, showTest]);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        const d = dragRef.current;
        if (!d) return;
        const { x, y } = toCanvas(e);
        if (d.kind === 'test') {
            setTestPos({ x: clamp(x - d.dx, 30, W - 30), y: clamp(y - d.dy, 50, H - 60) });
        } else if (d.kind === 'charge' && mode === 'pair' && d.id !== undefined) {
            // Adjust separation by horizontal drag of either charge; mirror about centre
            const newX = clamp(x - d.dx, 100, W - 100);
            const newSep = Math.abs((newX - W / 2) * 2);
            setSeparationPx(clamp(newSep, 80, 900));
        }
    }, [toCanvas, mode]);

    const onPointerUp = useCallback(() => {
        dragRef.current = null;
    }, []);

    // --- Sub-render helpers (closures) ---
    const drawCharge = (ctx: CanvasRenderingContext2D, c: Charge, t: number) => {
        const r = 22 + Math.min(14, Math.abs(c.q) * 0.25);
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.004 + c.id);
        ctx.save();
        ctx.shadowColor = c.q > 0 ? '#ef4444' : c.q < 0 ? '#3b82f6' : '#94a3b8';
        ctx.shadowBlur = 12 + pulse * 16;
        const grad = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.3, r * 0.2, c.x, c.y, r);
        if (c.q > 0) {
            grad.addColorStop(0, '#fecaca');
            grad.addColorStop(1, '#dc2626');
        } else if (c.q < 0) {
            grad.addColorStop(0, '#bfdbfe');
            grad.addColorStop(1, '#1d4ed8');
        } else {
            grad.addColorStop(0, '#e2e8f0');
            grad.addColorStop(1, '#64748b');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${Math.round(r * 1.1)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.q > 0 ? '+' : c.q < 0 ? '−' : '0', c.x, c.y + 1);

        ctx.font = '600 12px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textBaseline = 'top';
        ctx.fillText(`${c.q > 0 ? '+' : ''}${c.q.toFixed(0)} nC`, c.x, c.y + r + 6);
        ctx.textBaseline = 'alphabetic';
    };

    const drawArrow = (
        ctx: CanvasRenderingContext2D,
        x1: number, y1: number, x2: number, y2: number,
        color: string, width = 2
    ) => {
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const head = Math.max(6, width * 3);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
        ctx.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fill();
    };

    const drawArrows = (ctx: CanvasRenderingContext2D, list: Charge[], t: number) => {
        for (let gx = ARROW_GRID_STEP / 2; gx < W; gx += ARROW_GRID_STEP) {
            for (let gy = ARROW_GRID_STEP / 2; gy < H - 30; gy += ARROW_GRID_STEP) {
                // skip near sources
                let skip = false;
                for (const c of list) {
                    if (pxDist(gx, gy, c.x, c.y) < 40) { skip = true; break; }
                }
                if (skip) continue;
                const { Ex, Ey } = totalField(gx, gy, list);
                const mag = Math.hypot(Ex, Ey);
                if (mag < 1) continue;
                // Visual length: log-scaled
                const len = clamp(8 + Math.log10(mag) * 8, 8, ARROW_MAX_PX);
                const nx = Ex / mag;
                const ny = Ey / mag;
                const color = fieldStrengthColor(mag);
                ctx.globalAlpha = 0.62 + 0.3 * Math.sin(t * 0.003 + gx * 0.02 + gy * 0.015);
                drawArrow(ctx, gx - nx * len * 0.4, gy - ny * len * 0.4, gx + nx * len * 0.6, gy + ny * len * 0.6, color, 1.6);
            }
        }
        ctx.globalAlpha = 1;
    };

    const drawFieldLines = (ctx: CanvasRenderingContext2D, list: Charge[], t: number) => {
        // Start at positive sources. If none exist, trace backwards from negatives.
        const hasPositive = list.some(c => c.q > 0);
        for (const c of list) {
            if (Math.abs(c.q) < 0.001) continue;
            if (hasPositive && c.q < 0) continue;
            const startCount = Math.round(clamp(8 + Math.abs(c.q) * 0.35, 8, 30));
            const r0 = 30 + Math.min(14, Math.abs(c.q) * 0.25);
            for (let i = 0; i < startCount; i++) {
                const ang = (i / startCount) * Math.PI * 2 + (c.q > 0 ? 0 : Math.PI / startCount);
                const sx = c.x + Math.cos(ang) * r0;
                const sy = c.y + Math.sin(ang) * r0;
                tracePath(ctx, sx, sy, c.q > 0 ? 1 : -1, list, c, t);
            }
        }
    };

    const tracePath = (
        ctx: CanvasRenderingContext2D,
        sx: number, sy: number,
        dir: 1 | -1,
        list: Charge[],
        seed: Charge,
        t: number
    ) => {
        const step = 8;
        const maxSteps = 260;
        let x = sx;
        let y = sy;
        const points = [{ x, y }];
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([9, 7]);
        ctx.lineDashOffset = -t * 0.025 * dir;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i < maxSteps; i++) {
            const { Ex, Ey } = totalField(x, y, list);
            const mag = Math.hypot(Ex, Ey);
            if (mag < 1e-2) break;
            const dx = (Ex / mag) * step * dir;
            const dy = (Ey / mag) * step * dir;
            x += dx;
            y += dy;
            if (x < 4 || x > W - 4 || y < 32 || y > H - 28) break;
            // Stop if entering another charge
            let hit = false;
            for (const c of list) {
                if (c.id === seed.id) continue;
                if (pxDist(x, y, c.x, c.y) < 24) { hit = true; break; }
            }
            ctx.lineTo(x, y);
            points.push({ x, y });
            if (hit) break;
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Place the arrowhead on the traced curve, not the chord between endpoints.
        const marker = points[Math.floor(points.length * 0.58)];
        const { Ex, Ey } = totalField(marker.x, marker.y, list);
        const mag = Math.hypot(Ex, Ey);
        if (mag > 1) {
            const mx = marker.x;
            const my = marker.y;
            const ang = Math.atan2(Ey, Ex);
            const h = 6;
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(mx + Math.cos(ang) * 4, my + Math.sin(ang) * 4);
            ctx.lineTo(mx - h * Math.cos(ang - 0.5), my - h * Math.sin(ang - 0.5));
            ctx.lineTo(mx - h * Math.cos(ang + 0.5), my - h * Math.sin(ang + 0.5));
            ctx.closePath();
            ctx.fill();
        }
    };

    const drawGaussOverlay = (ctx: CanvasRenderingContext2D, t: number) => {
        const cx = W / 2;
        const cy = H / 2;
        const radius = gaussRadiusPx;
        ctx.save();
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = -t * 0.025;
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        const outward = qGauss >= 0 ? 1 : -1;
        for (let i = 0; i < 16; i++) {
            const angle = i * Math.PI * 2 / 16;
            const phase = (t * 0.00022 + i / 16) % 1;
            const radial = qGauss === 0 ? radius : outward > 0
                ? 36 + phase * (radius + 90)
                : radius + 90 - phase * (radius + 54);
            ctx.fillStyle = qGauss >= 0 ? '#f97316' : '#2563eb';
            ctx.globalAlpha = qGauss === 0 ? 0 : 0.35 + 0.65 * Math.sin(Math.PI * phase);
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle) * radial, cy + Math.sin(angle) * radial, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#6d28d9';
        ctx.font = '700 14px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Gaussian sphere  R = ${(radius * M_PER_PX).toFixed(2)} m`, cx, cy - radius - 16);
        ctx.fillText('same enclosed q at every radius', cx, cy + radius + 28);
        ctx.restore();
    };

    const drawTestCharge = (ctx: CanvasRenderingContext2D, pos: { x: number; y: number }, list: Charge[], t: number) => {
        const { Ex, Ey } = totalField(pos.x, pos.y, list);
        const Emag = Math.hypot(Ex, Ey);
        const singular = list.some(c => pxDist(pos.x, pos.y, c.x, c.y) < 36 + Math.min(14, Math.abs(c.q) * 0.25));
        // Force vector (q' = +1 nC ⇒ F has same direction as E). Scale visually.
        if (!singular && Emag > 1) {
            const len = clamp(20 + Math.log10(Emag) * 14, 24, 160);
            const nx = Ex / Emag;
            const ny = Ey / Emag;
            drawArrow(ctx, pos.x, pos.y, pos.x + nx * len, pos.y + ny * len, '#dc2626', 3);
        }
        // Test charge body
        const r = 14;
        ctx.save();
        ctx.shadowColor = singular ? '#ef4444' : '#22c55e';
        ctx.shadowBlur = 10 + 6 * Math.sin(t * 0.006) ** 2;
        ctx.fillStyle = singular ? '#dc2626' : '#16a34a';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', pos.x, pos.y + 1);
        ctx.font = '600 11px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textBaseline = 'top';
        ctx.fillText(singular ? 'field undefined at source' : 'test +1 nC', pos.x, pos.y + r + 4);
        ctx.textBaseline = 'alphabetic';
    };

    // --- 1/r² graph for left aside ---
    const graphPanel = (
        <aside
            className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20
                       hidden w-[340px] 2xl:block overflow-y-auto pr-1"
        >
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">|E| vs distance r</div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">Point charge — inverse-square fall-off</div>
                    <InverseSquareGraph qNC={mode === 'single' ? qSingle : mode === 'pair' ? q1Mag : mode === 'dipole' ? qDipole : qGauss} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Field-line legend</div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §1.8 properties</div>
                    <ul className="text-xs leading-snug text-slate-700 list-disc pl-4 space-y-1">
                        <li>Tangent = direction of <b>E</b>.</li>
                        <li>Crowded lines = strong field.</li>
                        <li>Start on +, end on −.</li>
                        <li>Never cross. Never closed loops.</li>
                    </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Arrow colour key</div>
                    <div className="mt-2 h-3 rounded-full" style={{
                        background: 'linear-gradient(90deg,#38bdf8 0%,#d97706 50%,#dc2626 100%)'
                    }} />
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 mt-1">
                        <span>weak</span><span>strong</span>
                    </div>
                </div>
            </div>
        </aside>
    );

    // --- Theory + live values ---
    const valuesPanel = (
        <aside
            className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20
                       hidden w-[310px] 2xl:block overflow-y-auto pl-1"
        >
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">Coulomb's Law & Field</div>
                    <div className="text-xs font-semibold text-amber-700 mb-2">NCERT Ch 1 · §1.5–1.8</div>
                    <p className="text-sm leading-snug text-amber-950">
                        <b>F</b> = k·q₁q₂ / r²,&nbsp; k = 1/(4πε₀) ≈ 9 × 10⁹ N·m²/C².
                    </p>
                    <p className="text-sm leading-snug text-amber-950 mt-2">
                        <b>E</b> = F / q′ &nbsp;⇒ for a point charge,&nbsp;
                        |E| = |q| / (4πε₀ r²), radial.
                    </p>
                    {mode === 'dipole' && (
                        <p className="text-sm leading-snug text-amber-950 mt-2">
                            Dipole: <b>p</b> = q·2a. Axial E = 2p / (4πε₀ r³),&nbsp; equatorial E = −p / (4πε₀ r³)&nbsp;(r ≫ a).
                        </p>
                    )}
                    {mode === 'gauss' && (
                        <p className="text-sm leading-snug text-amber-950 mt-2">
                            Gauss's law: <b>Φ</b> = q<sub>enclosed</sub>/ε₀. For a centred point charge, E = k|q|/R² while E(4πR²) stays equal to q/ε₀.
                        </p>
                    )}
                    <p className="text-xs text-amber-800 mt-2">
                        Superposition: net <b>E</b> = vector sum of contributions from every source.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-extrabold text-slate-900">Real-time values</div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE
                        </span>
                    </div>
                    <div className="space-y-2">
                        {showTest && mode !== 'gauss' && (
                            <>
                                <ValueRow label="|E| at test charge" value={live.probeSingular ? 'undefined at source' : `${live.Emag.toExponential(2)} N/C`} />
                                <ValueRow label="|F| on +1 nC test" value={live.probeSingular ? 'undefined at source' : `${live.Fmag.toExponential(2)} N`} />
                            </>
                        )}
                        {(mode === 'pair' || mode === 'dipole') && (
                            <ValueRow label="Source separation" value={`${live.separationM.toFixed(2)} m`} />
                        )}
                        {mode === 'dipole' && live.dipoleMoment !== null && (
                            <ValueRow label="Dipole moment p" value={`${live.dipoleMoment.toExponential(2)} C·m`} />
                        )}
                        {mode === 'gauss' && live.gaussFlux !== null && live.gaussSurfaceField !== null && (
                            <>
                                <ValueRow label="Gaussian radius R" value={`${live.gaussRadiusM.toFixed(2)} m`} />
                                <ValueRow label="|E| on surface" value={`${live.gaussSurfaceField.toExponential(2)} N/C`} />
                                <ValueRow label="Total flux Φ = q/ε₀" value={`${live.gaussFlux.toExponential(2)} N·m²/C`} />
                            </>
                        )}
                        <ValueRow label="Sources" value={`${charges.length}`} />
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
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50"
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

    const controlsCombo = (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-3 text-slate-800">
                <Zap size={18} className="text-amber-600" />
                <span className="font-extrabold text-base">Electric Charges & Fields Bench</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Scene mode */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Scene</div>
                    <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                        <ModeButton active={mode === 'single'} onClick={() => setMode('single')} icon={<Atom size={14} />} label="Single" />
                        <ModeButton active={mode === 'pair'} onClick={() => setMode('pair')} icon={<Move size={14} />} label="Pair" />
                        <ModeButton active={mode === 'dipole'} onClick={() => setMode('dipole')} icon={<Sparkles size={14} />} label="Dipole" />
                        <ModeButton active={mode === 'gauss'} onClick={() => setMode('gauss')} icon={<Atom size={14} />} label="Gauss" />
                    </div>
                </div>

                {/* Visualization + test toggle */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Visualization</div>
                    <div className="grid grid-cols-2 gap-1 mb-2">
                        <ModeButton active={viz === 'arrows'} onClick={() => setViz('arrows')} icon={<Move size={14} />} label="Arrows" />
                        <ModeButton active={viz === 'lines'} onClick={() => setViz('lines')} icon={<Sparkles size={14} />} label="Lines" />
                    </div>
                    {mode !== 'gauss' ? (
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none">
                            <input
                                type="checkbox"
                                checked={showTest}
                                onChange={e => setShowTest(e.target.checked)}
                                className="w-4 h-4 accent-emerald-600"
                            />
                            <Eye size={14} className="text-emerald-600" /> Show +1 nC test charge
                        </label>
                    ) : (
                        <p className="text-xs font-semibold text-violet-700">Animated dots show signed flux crossing the closed surface.</p>
                    )}
                </div>

                {/* Single-mode controls */}
                {mode === 'single' && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
                        <SliderRow
                            label="Charge q"
                            value={qSingle}
                            min={-60}
                            max={60}
                            step={1}
                            unit="nC"
                            onChange={setQSingle}
                        />
                    </div>
                )}

                {/* Pair-mode controls */}
                {mode === 'pair' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Charge q₁ (left)</div>
                            <div className="flex items-center gap-2 mb-2">
                                <SignButton sign={q1Sign} onChange={setQ1Sign} />
                            </div>
                            <SliderRow label="Magnitude" value={q1Mag} min={1} max={60} step={1} unit="nC" onChange={setQ1Mag} />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Charge q₂ (right)</div>
                            <div className="flex items-center gap-2 mb-2">
                                <SignButton sign={q2Sign} onChange={setQ2Sign} />
                            </div>
                            <SliderRow label="Magnitude" value={q2Mag} min={1} max={60} step={1} unit="nC" onChange={setQ2Mag} />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
                            <SliderRow
                                label="Separation r"
                                value={Number((separationPx * M_PER_PX).toFixed(2))}
                                min={0.7}
                                max={7.5}
                                step={0.05}
                                unit="m"
                                onChange={(v) => setSeparationPx(v / M_PER_PX)}
                            />
                        </div>
                    </>
                )}

                {/* Dipole-mode controls */}
                {mode === 'dipole' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow
                                label="Charge magnitude q"
                                value={qDipole}
                                min={5}
                                max={60}
                                step={1}
                                unit="nC"
                                onChange={setQDipole}
                            />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow
                                label="Separation 2a"
                                value={Number((dipoleSepPx * M_PER_PX).toFixed(2))}
                                min={0.5}
                                max={3.5}
                                step={0.05}
                                unit="m"
                                onChange={(v) => setDipoleSepPx(v / M_PER_PX)}
                            />
                        </div>
                    </>
                )}

                {mode === 'gauss' && (
                    <>
                        <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3 shadow-sm">
                            <SliderRow
                                label="Enclosed charge q"
                                value={qGauss}
                                min={-60}
                                max={60}
                                step={1}
                                unit="nC"
                                onChange={setQGauss}
                            />
                        </div>
                        <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3 shadow-sm">
                            <SliderRow
                                label="Gaussian radius R"
                                value={Number((gaussRadiusPx * M_PER_PX).toFixed(2))}
                                min={0.8}
                                max={3}
                                step={0.05}
                                unit="m"
                                onChange={(v) => setGaussRadiusPx(v / M_PER_PX)}
                            />
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

// ---------- small subcomponents ----------

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
        {icon}
        <span>{label}</span>
    </button>
);

const SignButton: React.FC<{ sign: 1 | -1; onChange: (s: 1 | -1) => void }> = ({ sign, onChange }) => (
    <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
        <button
            onClick={() => onChange(1)}
            className={`px-3 py-1.5 text-sm font-bold flex items-center gap-1 ${sign === 1 ? 'bg-red-50 text-red-700' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            title="Positive"
        >
            <Plus size={14} />+
        </button>
        <button
            onClick={() => onChange(-1)}
            className={`px-3 py-1.5 text-sm font-bold flex items-center gap-1 border-l border-slate-200 ${sign === -1 ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            title="Negative"
        >
            <Minus size={14} />−
        </button>
    </div>
);

interface SliderRowProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    onChange: (v: number) => void;
}
const SliderRow: React.FC<SliderRowProps> = ({ label, value, min, max, step, unit, onChange }) => (
    <div>
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className="font-mono text-sm font-bold text-amber-700">{value} {unit}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 accent-amber-500"
        />
    </div>
);

const InverseSquareGraph: React.FC<{ qNC: number }> = ({ qNC }) => {
    const w = 300;
    const h = 160;
    const padL = 32;
    const padB = 26;
    const padT = 8;
    const padR = 8;
    const xMin = 0.3;
    const xMax = 6;
    const yMax = Math.max(1, Math.abs(qNC) * 1e-9 * K_COULOMB / (xMin * xMin));
    const x = (r: number) => padL + ((r - xMin) / (xMax - xMin)) * (w - padL - padR);
    const y = (E: number) => h - padB - (E / yMax) * (h - padT - padB);
    const points: string[] = [];
    for (let i = 0; i <= 80; i++) {
        const r = xMin + (i / 80) * (xMax - xMin);
        const E = Math.abs(qNC) * 1e-9 * K_COULOMB / (r * r);
        points.push(`${x(r).toFixed(1)},${y(E).toFixed(1)}`);
    }
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[160px]">
            {/* axes */}
            <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#475569" strokeWidth={1} />
            <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#475569" strokeWidth={1} />
            {/* curve */}
            <polyline fill="none" stroke="#0891b2" strokeWidth={2.2} points={points.join(' ')} />
            {/* labels */}
            <text x={w - padR} y={h - 8} fontSize={10} textAnchor="end" fill="#64748b">r (m)</text>
            <text x={padL + 4} y={padT + 10} fontSize={10} fill="#64748b">|E| (N/C)</text>
            <text x={w - padR} y={padT + 12} fontSize={10} textAnchor="end" fill="#0891b2">E ∝ 1 / r²</text>
        </svg>
    );
};

export default ElectricChargesFieldsLab;
