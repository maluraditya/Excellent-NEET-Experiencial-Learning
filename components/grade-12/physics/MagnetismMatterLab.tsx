import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atom, Compass, Magnet, Pause, Play, RotateCcw, Scissors, Sparkles } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface MagnetismMatterLabProps {
    topic: any;
    onExit: () => void;
}

type Scene = 'dipole' | 'torque' | 'material';
type Material = 'dia' | 'para' | 'ferro';

const W = 1280;
const H = 760;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const deg = (r: number) => (r * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

const MATERIAL_META: Record<Material, { name: string; sample: string; chi: number; mu_r: number; tint: string; accent: string }> = {
    dia: { name: 'Diamagnetic', sample: 'Bismuth (Bi)', chi: -1.66e-5, mu_r: 0.99998, tint: '#cbd5e1', accent: '#475569' },
    para: { name: 'Paramagnetic', sample: 'Aluminium (Al)', chi: 2.2e-5, mu_r: 1.000022, tint: '#fde68a', accent: '#b45309' },
    ferro: { name: 'Ferromagnetic', sample: 'Iron (Fe)', chi: 5000, mu_r: 5001, tint: '#fecaca', accent: '#b91c1c' },
};

const MagnetismMatterLab: React.FC<MagnetismMatterLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scene, setScene] = useState<Scene>('dipole');
    const [paused, setPaused] = useState(false);

    // Scene A — Dipole
    const [showFilings, setShowFilings] = useState(true);
    const [pieces, setPieces] = useState<1 | 2 | 4>(1);
    const [dipoleAngle, setDipoleAngle] = useState(0); // degrees

    // Scene B — Torque
    const [theta, setTheta] = useState(45);     // degrees
    const [m, setM] = useState(1.0);            // J/T
    const [B, setB] = useState(0.25);           // T
    const [showGauss, setShowGauss] = useState(false);

    // Scene C — Material
    const [material, setMaterial] = useState<Material>('para');
    const [B0, setB0] = useState(0.25);
    const [solenoidOn, setSolenoidOn] = useState(true);
    const [ferroRemanent, setFerroRemanent] = useState(false);

    const tRef = useRef(0);

    // ----- Derived (NCERT formulas) -----
    const torqueValues = useMemo(() => {
        const th = rad(theta);
        const tau = m * B * Math.sin(th);
        const U = -m * B * Math.cos(th);
        // axial / equatorial field at r = 2 (display only)
        const r = 2.0;
        const BA = (1e-7) * (2 * m) / Math.pow(r, 3);
        const BE = -(1e-7) * m / Math.pow(r, 3);
        return { tau, U, BA, BE };
    }, [theta, m, B]);

    const matVals = useMemo(() => {
        const meta = MATERIAL_META[material];
        const Heff = (solenoidOn ? B0 : 0) / (4 * Math.PI * 1e-7);
        const M = meta.chi * Heff;
        const Beff = solenoidOn ? B0 * meta.mu_r : (material === 'ferro' && ferroRemanent ? 0.4 * B0 || 0.05 : 0);
        return { ...meta, Heff, M, Beff };
    }, [material, B0, solenoidOn, ferroRemanent]);

    const handleReset = useCallback(() => {
        setScene('dipole'); setPaused(false);
        setShowFilings(true); setPieces(1); setDipoleAngle(0);
        setTheta(45); setM(1.0); setB(0.25); setShowGauss(false);
        setMaterial('para'); setB0(0.25); setSolenoidOn(true); setFerroRemanent(false);
    }, []);

    // Lock remanence to ferro+off only
    useEffect(() => {
        if (material !== 'ferro') setFerroRemanent(false);
        if (solenoidOn) setFerroRemanent(false);
    }, [material, solenoidOn]);

    // ============= DRAW LOOP =============
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let raf = 0;

        const draw = (now: number) => {
            if (!paused) tRef.current = now / 1000;
            const t = tRef.current;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, W, H);

            // faint grid
            ctx.strokeStyle = '#eef2f7';
            ctx.lineWidth = 1;
            for (let x = 0; x <= W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (let y = 0; y <= H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

            // title
            ctx.fillStyle = '#0f172a';
            ctx.font = '600 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(
                scene === 'dipole' ? 'Bar magnet as a dipole — closed-loop field lines (NCERT §5.2)'
                    : scene === 'torque' ? 'Dipole in a uniform field — τ = m × B, U = −m·B  (NCERT §5.2.3)'
                        : 'Magnetic properties of materials — dia / para / ferro  (NCERT §5.5)',
                24, 30
            );

            if (scene === 'dipole') drawDipole(ctx, t);
            else if (scene === 'torque') drawTorque(ctx, t);
            else drawMaterial(ctx, t);

            // hint
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Inter, system-ui, sans-serif';
            ctx.fillText(
                scene === 'dipole' ? 'Closed loops everywhere — no magnetic monopoles. Press “Cut” → two magnets, never an isolated pole.'
                    : scene === 'torque' ? 'Rotate θ: torque peaks at 90°, U is minimum at 0° (stable) and maximum at 180° (unstable).'
                        : 'Switch material: dia repels lines, para concentrates them weakly, ferro floods — and remains when B₀ is switched off.',
                24, 740
            );

            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene, paused, showFilings, pieces, dipoleAngle, theta, m, B, showGauss, material, B0, solenoidOn, ferroRemanent]);

    // ============= SCENE A — Dipole =============
    const drawDipole = (ctx: CanvasRenderingContext2D, t: number) => {
        const cy = H / 2 + 10;
        const ang = rad(dipoleAngle);
        const cosA = Math.cos(ang), sinA = Math.sin(ang);

        if (pieces === 1) {
            drawBarMagnet(ctx, W / 2, cy, ang, 260, 56);
            drawFieldLines(ctx, W / 2, cy, ang, 260, 12);
            if (showFilings) drawFilings(ctx, W / 2, cy, ang, 260, t);
        } else if (pieces === 2) {
            const off = 170;
            const x1 = W / 2 - off * cosA, y1 = cy - off * sinA;
            const x2 = W / 2 + off * cosA, y2 = cy + off * sinA;
            drawBarMagnet(ctx, x1, y1, ang, 130, 56);
            drawFieldLines(ctx, x1, y1, ang, 130, 9);
            drawBarMagnet(ctx, x2, y2, ang, 130, 56);
            drawFieldLines(ctx, x2, y2, ang, 130, 9);
            if (showFilings) {
                drawFilings(ctx, x1, y1, ang, 130, t);
                drawFilings(ctx, x2, y2, ang, 130, t);
            }
            ctx.fillStyle = '#475569';
            ctx.font = '600 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Each half has BOTH a N and a S pole — monopoles do not exist.', W / 2, H - 60);
        } else {
            // four pieces
            const offs = [-255, -85, 85, 255];
            offs.forEach(o => {
                const x = W / 2 + o * cosA, y = cy + o * sinA;
                drawBarMagnet(ctx, x, y, ang, 70, 50);
                drawFieldLines(ctx, x, y, ang, 70, 6);
                if (showFilings) drawFilings(ctx, x, y, ang, 70, t);
            });
            ctx.fillStyle = '#475569';
            ctx.font = '600 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Cut again and again — every fragment is still a complete dipole.', W / 2, H - 60);
        }
    };

    const drawBarMagnet = (ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, h: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        // South half (blue) — left
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(-len / 2, -h / 2, len / 2, h);
        // North half (red) — right
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, -h / 2, len / 2, h);
        // outline
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-len / 2, -h / 2, len, h);
        // labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 22px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', -len / 4, 0);
        ctx.fillText('N', len / 4, 0);
        ctx.restore();
    };

    // Closed-loop dipole field lines — analytic streamlines from a point dipole
    const drawFieldLines = (ctx: CanvasRenderingContext2D, cx: number, cy: number, ang: number, magLen: number, count: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        const a = magLen / 2 * 0.85; // pole offset
        for (let i = 1; i <= count; i++) {
            const k = i / (count + 1);
            const rMax = 60 + k * 280; // family of loops
            ctx.beginPath();
            const N = 160;
            for (let j = 0; j <= N; j++) {
                const ph = (j / N) * Math.PI * 2;
                // closed loop above and below — parametric ellipse that wraps both poles
                const x = (a + rMax * 0.55) * Math.cos(ph);
                const y = rMax * 0.7 * Math.sin(ph);
                if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
            // arrow marker at top
            const ax = (a + rMax * 0.55) * Math.cos(Math.PI * 0.5);
            const ay = rMax * 0.7 * Math.sin(Math.PI * 0.5);
            drawArrowHead(ctx, ax, ay, 0); // pointing left (S→N around top) — N is on right
            const bx = (a + rMax * 0.55) * Math.cos(-Math.PI * 0.5);
            const by = rMax * 0.7 * Math.sin(-Math.PI * 0.5);
            drawArrowHead(ctx, bx, by, Math.PI); // pointing right at bottom
        }
        ctx.restore();
    };

    const drawArrowHead = (ctx: CanvasRenderingContext2D, x: number, y: number, a: number) => {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-6, 4); ctx.lineTo(-6, -4); ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    const drawFilings = (ctx: CanvasRenderingContext2D, cx: number, cy: number, ang: number, magLen: number, t: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(71,85,105,0.45)';
        // jittered dots along field lines (visual)
        const a = magLen / 2 * 0.85;
        for (let r = 70; r < 340; r += 18) {
            for (let phDeg = 0; phDeg < 360; phDeg += 12) {
                const ph = rad(phDeg) + Math.sin(t + r) * 0.01;
                const x = (a + r * 0.55) * Math.cos(ph);
                const y = r * 0.7 * Math.sin(ph);
                if (Math.abs(x) < magLen / 2 - 4 && Math.abs(y) < 24) continue; // skip inside magnet
                ctx.fillRect(x - 1, y - 1, 2, 2);
            }
        }
        ctx.restore();
    };

    // ============= SCENE B — Torque =============
    const drawTorque = (ctx: CanvasRenderingContext2D, _t: number) => {
        const cx = W / 2;
        const cy = H / 2 + 10;

        // Uniform B field — density & opacity scale with |B| (0.05 → 0.5)
        const bNorm = clamp((B - 0.05) / 0.45, 0, 1);          // 0..1
        const rows = Math.round(5 + bNorm * 8);                 // 5..13 rows
        const cols = Math.round(4 + bNorm * 4);                 // 4..8 cols
        const intensity = 60 + Math.round(bNorm * 140);         // 60..200 grey
        const stroke = `rgba(${100 - Math.round(bNorm * 40)},${116 - Math.round(bNorm * 40)},${139 - Math.round(bNorm * 40)},${0.45 + bNorm * 0.45})`;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1 + bNorm * 1.8;
        const arrowLen = 90 + bNorm * 80;                       // 90..170 px
        const xSpan = W - 80;
        const ySpan = 540;
        const yTop = cy - ySpan / 2;
        for (let i = 0; i < rows; i++) {
            const y = yTop + (i * ySpan) / (rows - 1);
            for (let j = 0; j < cols; j++) {
                const x = 40 + (j * (xSpan - arrowLen)) / (cols - 1);
                ctx.beginPath();
                ctx.moveTo(x, y); ctx.lineTo(x + arrowLen, y);
                ctx.stroke();
                ctx.fillStyle = stroke;
                ctx.beginPath();
                ctx.moveTo(x + arrowLen, y);
                ctx.lineTo(x + arrowLen - 9, y - 5);
                ctx.lineTo(x + arrowLen - 9, y + 5);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.fillStyle = `rgb(${71 - Math.round(bNorm * 30)},${85 - Math.round(bNorm * 30)},${105 - Math.round(bNorm * 30)})`;
        ctx.font = '700 15px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Uniform B → (${B.toFixed(2)} T)`, 32, cy - 250);
        void intensity;

        // Bar magnet at angle θ — size scales with m (0.1 → 2.0)
        const mNorm = clamp((m - 0.1) / 1.9, 0, 1);
        const magLen = 180 + mNorm * 180;   // 180..360
        const magH = 40 + mNorm * 40;        // 40..80
        drawBarMagnet(ctx, cx, cy, rad(theta), magLen, magH);

        // Torque arc (NCERT eq 5.2)
        const tauSign = Math.sign(Math.sin(rad(theta)));
        if (Math.abs(torqueValues.tau) > 1e-3) {
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 4;
            ctx.beginPath();
            const r0 = 200;
            const start = rad(theta);
            const end = start - tauSign * 0.85;
            ctx.arc(cx, cy, r0, Math.min(start, end), Math.max(start, end));
            ctx.stroke();
            // arrow at end
            const ex = cx + r0 * Math.cos(end);
            const ey = cy + r0 * Math.sin(end);
            ctx.save();
            ctx.translate(ex, ey);
            ctx.rotate(end - tauSign * Math.PI / 2);
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(-10, 6); ctx.lineTo(-10, -6); ctx.closePath();
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#dc2626';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.fillText('τ (restoring)', cx + r0 + 14, cy - 4);
        }

        // m vector indicator — length scales with m
        const mLen = 90 + mNorm * 200; // 90..290 px
        const mx = cx + mLen * Math.cos(rad(theta));
        const my = cy + mLen * Math.sin(rad(theta));
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3 + mNorm * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(mx, my);
        ctx.stroke();
        // arrow head on m
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(rad(theta));
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-12, 7); ctx.lineTo(-12, -7); ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 18px Inter, system-ui, sans-serif';
        ctx.fillText(`m=${m.toFixed(2)}`, mx + 14, my + 4);

        // Gaussian surface overlay (NCERT §5.3)
        if (showGauss) {
            ctx.strokeStyle = 'rgba(16,185,129,0.85)';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(cx, cy, 230, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#047857';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Closed Gaussian surface: Φ_B = ∮ B·dS = 0', cx - 220, cy - 250);
        }

        // θ readout in canvas
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 14px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`θ = ${theta.toFixed(0)}°`, W - 32, cy - 250);
    };

    // ============= SCENE C — Material =============
    const drawMaterial = (ctx: CanvasRenderingContext2D, t: number) => {
        const cx = W / 2;
        const cy = H / 2 + 10;
        const meta = MATERIAL_META[material];

        // Solenoid windings (left and right vertical lines representing coils)
        const coilL = 200, coilR = W - 200;
        ctx.strokeStyle = solenoidOn ? '#b45309' : '#cbd5e1';
        ctx.lineWidth = 3;
        for (let y = cy - 200; y <= cy + 200; y += 20) {
            ctx.beginPath();
            ctx.arc(coilL, y, 6, Math.PI * 0.5, Math.PI * 1.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(coilR, y, 6, -Math.PI * 0.5, Math.PI * 0.5);
            ctx.stroke();
        }
        ctx.fillStyle = solenoidOn ? '#b45309' : '#94a3b8';
        ctx.font = '700 13px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(solenoidOn ? `Solenoid ON · B₀ = ${B0.toFixed(2)} T` : 'Solenoid OFF', cx, cy - 240);

        // External B0 arrows (between coils, behind slab)
        const drawing = solenoidOn || (material === 'ferro' && ferroRemanent);
        const slabL = cx - 220, slabR = cx + 220, slabT = cy - 130, slabB = cy + 130;

        // Field lines (3-state response: dia=expel, para=mild concentrate, ferro=strong concentrate / remain)
        if (drawing) {
            ctx.lineWidth = 2;
            const lines = 7;
            for (let i = 0; i < lines; i++) {
                const y0 = cy - 180 + (i * 360) / (lines - 1);
                ctx.beginPath();
                // straight on the left
                ctx.moveTo(coilL + 30, y0);
                ctx.lineTo(slabL, y0);
                // bend through slab
                let yInSlabL = y0, yInSlabR = y0;
                if (material === 'dia') {
                    // expelled: bow OUTSIDE slab (curve up/down away from centre)
                    const offset = (y0 - cy) === 0 ? 0 : Math.sign(y0 - cy) * 28;
                    ctx.lineTo(slabL, y0 + offset * 0.4);
                    ctx.bezierCurveTo(slabL + 50, y0 + offset, slabR - 50, y0 + offset, slabR, y0 + offset * 0.4);
                    yInSlabR = y0;
                    ctx.strokeStyle = '#64748b';
                } else if (material === 'para') {
                    // mild concentrate: gentle pull toward centre
                    const offset = -Math.sign(y0 - cy) * 6;
                    ctx.bezierCurveTo(slabL + 60, y0, cx, y0 + offset, slabR, y0);
                    ctx.strokeStyle = '#b45309';
                } else {
                    // ferro: strong concentrate toward centre
                    const offset = -Math.sign(y0 - cy) * Math.min(60, Math.abs(y0 - cy));
                    ctx.bezierCurveTo(slabL + 40, y0, cx, y0 + offset * 1.2, slabR, y0);
                    ctx.strokeStyle = '#b91c1c';
                    ctx.lineWidth = 3;
                }
                ctx.lineTo(coilR - 30, yInSlabR);
                ctx.stroke();
                ctx.lineWidth = 2;
                // arrowhead near right
                drawArrowHead(ctx, coilR - 35, yInSlabR, 0);
                drawArrowHead(ctx, slabL - 4, y0, 0);
            }
        }

        // Slab
        ctx.fillStyle = meta.tint;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(slabL, slabT, slabR - slabL, slabB - slabT);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = meta.accent;
        ctx.lineWidth = 3;
        ctx.strokeRect(slabL, slabT, slabR - slabL, slabB - slabT);
        ctx.fillStyle = meta.accent;
        ctx.font = '800 22px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(meta.sample, cx, slabT - 16);
        ctx.font = '600 14px Inter, system-ui, sans-serif';
        ctx.fillText(`χ = ${meta.chi.toExponential(2)}   ·   μ_r = ${meta.mu_r}`, cx, slabB + 30);

        // Animated arrows along the lines if active
        if (drawing && !paused) {
            const tt = (t % 2) / 2;
            ctx.fillStyle = meta.accent;
            const xPos = slabL + tt * (slabR - slabL);
            for (let i = 1; i < 6; i++) {
                const y0 = cy - 160 + (i * 320) / 6;
                ctx.beginPath();
                ctx.arc(xPos, y0, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Remanence note
        if (!solenoidOn && material === 'ferro' && ferroRemanent) {
            ctx.fillStyle = '#b91c1c';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Permanent magnetisation retained — this is a permanent magnet (NCERT §5.5.3)', cx, cy + 230);
        } else if (!solenoidOn && (material === 'dia' || material === 'para')) {
            ctx.fillStyle = '#475569';
            ctx.font = '600 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No external field → magnetisation vanishes for dia and para.', cx, cy + 230);
        }
    };

    // ============= GRAPH PANEL (left aside) =============
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">U(θ) = −mB cos θ</div>
                    <div className="text-xs font-semibold text-slate-500 mb-1">NCERT eq. 5.3 · stable at 0°, unstable at 180°</div>
                    <svg viewBox="0 0 320 170" className="w-full h-[170px]">
                        <line x1="20" y1="85" x2="310" y2="85" stroke="#94a3b8" strokeWidth="1" />
                        <line x1="165" y1="10" x2="165" y2="160" stroke="#94a3b8" strokeWidth="1" />
                        {Array.from({ length: 73 }, (_, i) => {
                            const th = (i / 72) * 360 - 180;
                            const u = -Math.cos(rad(th));
                            return [165 + (th / 180) * 145, 85 + u * 60] as [number, number];
                        }).map((p, i, arr) => i === 0 ? null : (
                            <line key={i} x1={arr[i - 1][0]} y1={arr[i - 1][1]} x2={p[0]} y2={p[1]} stroke="#6d28d9" strokeWidth="2" />
                        ))}
                        {(() => {
                            const ux = 165 + (theta / 180) * 145;
                            const uy = 85 - Math.cos(rad(theta)) * 60;
                            return <circle cx={ux} cy={uy} r="6" fill="#dc2626" stroke="#fff" strokeWidth="2" />;
                        })()}
                        <text x="20" y="22" fill="#475569" fontSize="10" fontWeight="700">+mB</text>
                        <text x="20" y="155" fill="#475569" fontSize="10" fontWeight="700">−mB</text>
                        <text x="285" y="100" fill="#475569" fontSize="10" fontWeight="700">θ</text>
                    </svg>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">χ axis (Table 5.2)</div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">−1 ≤ χ &lt; 0 dia · 0 &lt; χ &lt; ε para · χ ≫ 1 ferro</div>
                    <svg viewBox="0 0 320 110" className="w-full h-[110px]">
                        <rect x="20" y="48" width="290" height="14" rx="6" fill="#f1f5f9" />
                        <rect x="20" y="48" width="95" height="14" rx="6" fill="#cbd5e1" />
                        <rect x="115" y="48" width="95" height="14" rx="6" fill="#fde68a" />
                        <rect x="210" y="48" width="100" height="14" rx="6" fill="#fecaca" />
                        <text x="55" y="40" fill="#475569" fontSize="11" fontWeight="800" textAnchor="middle">Dia</text>
                        <text x="162" y="40" fill="#92400e" fontSize="11" fontWeight="800" textAnchor="middle">Para</text>
                        <text x="260" y="40" fill="#7f1d1d" fontSize="11" fontWeight="800" textAnchor="middle">Ferro</text>
                        {scene === 'material' && (() => {
                            const mark = material === 'dia' ? 55 : material === 'para' ? 162 : 260;
                            return <>
                                <circle cx={mark} cy={55} r="8" fill="#0f172a" />
                                <text x={mark} y={88} fill="#0f172a" fontSize="11" fontWeight="800" textAnchor="middle">{MATERIAL_META[material].sample}</text>
                            </>;
                        })()}
                    </svg>
                </div>
            </div>
        </aside>
    );

    // ============= VALUES PANEL (right aside) =============
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">
                        {scene === 'dipole' ? 'Bar magnet & field lines' : scene === 'torque' ? 'Torque & potential energy' : 'Material classification'}
                    </div>
                    <div className="text-xs font-semibold text-amber-700 mb-2">
                        {scene === 'dipole' ? 'NCERT §5.2 · §5.3' : scene === 'torque' ? 'NCERT §5.2.3 · eqs 5.2 / 5.3' : 'NCERT §5.4 · §5.5 · Table 5.2'}
                    </div>
                    {scene === 'dipole' && (
                        <p className="text-sm leading-snug text-amber-950">Field lines form <b>continuous closed loops</b>. There are no magnetic monopoles — cut the magnet anywhere and you get two complete dipoles.</p>
                    )}
                    {scene === 'torque' && (
                        <>
                            <p className="text-sm leading-snug text-amber-950"><b>τ = m × B</b>;  magnitude <b>mB sin θ</b>.</p>
                            <p className="text-sm leading-snug text-amber-950 mt-2"><b>U = −m·B = −mB cos θ.</b>  Min −mB at θ=0° (stable), max +mB at θ=180° (unstable).</p>
                        </>
                    )}
                    {scene === 'material' && (
                        <>
                            <p className="text-sm leading-snug text-amber-950"><b>H = B₀/μ₀</b>,  <b>M = χH</b>,  <b>B = μ₀(H+M) = μH</b>.</p>
                            <p className="text-sm leading-snug text-amber-950 mt-2">Classification by χ — dia repels field, para weakly attracts, ferro strongly attracts and <b>retains magnetisation</b> (permanent magnet).</p>
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
                        {scene === 'dipole' && (
                            <>
                                <ValueRow label="Configuration" value={pieces === 1 ? 'ONE bar magnet' : pieces === 2 ? 'TWO bar magnets' : 'FOUR bar magnets'} />
                                <ValueRow label="Orientation" value={`${dipoleAngle.toFixed(0)}°`} />
                                <ValueRow label="Field lines" value="closed loops (S → N inside)" />
                                <ValueRow label="Net flux through any closed S" value="Φ_B = 0" />
                                <ValueRow label="Monopoles" value="do not exist" />
                            </>
                        )}
                        {scene === 'torque' && (
                            <>
                                <ValueRow label="m (magnetic moment)" value={`${m.toFixed(2)} J T⁻¹`} />
                                <ValueRow label="B (uniform field)" value={`${B.toFixed(3)} T`} />
                                <ValueRow label="θ" value={`${theta.toFixed(1)}°`} />
                                <ValueRow label="τ = mB sin θ" value={`${torqueValues.tau.toFixed(4)} N·m`} />
                                <ValueRow label="U = −mB cos θ" value={`${torqueValues.U.toFixed(4)} J`} />
                                <ValueRow label="B_axial (r=2 m)" value={`${torqueValues.BA.toExponential(2)} T`} />
                                <ValueRow label="B_equatorial (r=2 m)" value={`${torqueValues.BE.toExponential(2)} T`} />
                            </>
                        )}
                        {scene === 'material' && (
                            <>
                                <ValueRow label="Material" value={matVals.sample} />
                                <ValueRow label="Class" value={matVals.name} />
                                <ValueRow label="χ" value={matVals.chi.toExponential(2)} />
                                <ValueRow label="μ_r = 1 + χ" value={String(matVals.mu_r)} />
                                <ValueRow label="H = B₀/μ₀" value={`${matVals.Heff.toExponential(2)} A m⁻¹`} />
                                <ValueRow label="M = χH" value={`${matVals.M.toExponential(2)} A m⁻¹`} />
                                <ValueRow label="State" value={solenoidOn ? 'Solenoid ON' : (material === 'ferro' && ferroRemanent ? 'OFF — remanent' : 'OFF — demagnetised')} />
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
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50" title="Reset">
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
                <Magnet size={18} className="text-amber-600" />
                <span className="font-extrabold text-base">Magnetism &amp; Matter Bench</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Scene</div>
                    <div className="grid grid-cols-3 gap-1">
                        <ModeButton active={scene === 'dipole'} onClick={() => setScene('dipole')} icon={<Compass size={14} />} label="Dipole & Field lines" />
                        <ModeButton active={scene === 'torque'} onClick={() => setScene('torque')} icon={<Sparkles size={14} />} label="Torque · U(θ)" />
                        <ModeButton active={scene === 'material'} onClick={() => setScene('material')} icon={<Atom size={14} />} label="Materials" />
                    </div>
                </div>

                {scene === 'dipole' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Split the magnet</div>
                            <div className="grid grid-cols-3 gap-1 mb-2">
                                <ModeButton active={pieces === 1} onClick={() => setPieces(1)} icon={<Magnet size={14} />} label="Whole" />
                                <ModeButton active={pieces === 2} onClick={() => setPieces(2)} icon={<Scissors size={14} />} label="Cut ×2" />
                                <ModeButton active={pieces === 4} onClick={() => setPieces(4)} icon={<Scissors size={14} />} label="Cut ×4" />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none">
                                <input type="checkbox" checked={showFilings} onChange={e => setShowFilings(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                                Show iron filings
                            </label>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="Rotate magnet" value={dipoleAngle} min={-180} max={180} step={1} unit="°" onChange={setDipoleAngle} />
                            <p className="mt-2 text-xs text-slate-500 leading-snug">Every fragment carries both N and S — there are no magnetic monopoles (NCERT Ex 5.1).</p>
                        </div>
                    </>
                )}

                {scene === 'torque' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="θ (angle of m with B)" value={theta} min={-180} max={180} step={1} unit="°" onChange={setTheta} />
                            <div className="h-2" />
                            <SliderRow label="m (magnetic moment)" value={m} min={0.1} max={2.0} step={0.05} unit="J T⁻¹" onChange={setM} />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="B (uniform field)" value={B} min={0.05} max={0.5} step={0.01} unit="T" onChange={setB} />
                            <div className="h-2" />
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none">
                                <input type="checkbox" checked={showGauss} onChange={e => setShowGauss(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                                Show Gaussian surface (Φ_B = 0)
                            </label>
                        </div>
                    </>
                )}

                {scene === 'material' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Material sample</div>
                            <div className="grid grid-cols-3 gap-1">
                                <ModeButton active={material === 'dia'} onClick={() => setMaterial('dia')} icon={<span className="text-[11px]">Bi</span>} label="Dia" />
                                <ModeButton active={material === 'para'} onClick={() => setMaterial('para')} icon={<span className="text-[11px]">Al</span>} label="Para" />
                                <ModeButton active={material === 'ferro'} onClick={() => setMaterial('ferro')} icon={<span className="text-[11px]">Fe</span>} label="Ferro" />
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="External field B₀" value={B0} min={0.05} max={0.5} step={0.01} unit="T" onChange={setB0} />
                            <div className="h-2" />
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none">
                                <input type="checkbox" checked={solenoidOn} onChange={e => setSolenoidOn(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                                Solenoid current ON
                            </label>
                            {material === 'ferro' && !solenoidOn && (
                                <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-rose-700 select-none">
                                    <input type="checkbox" checked={ferroRemanent} onChange={e => setFerroRemanent(e.target.checked)} className="w-4 h-4 accent-rose-600" />
                                    Iron retains magnetisation (permanent magnet)
                                </label>
                            )}
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

const ValueRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 font-mono text-base font-extrabold text-amber-700">{value}</div>
    </div>
);

const ModeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-semibold transition-colors ${active ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
    >
        {icon}<span>{label}</span>
    </button>
);

interface SliderRowProps { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void; }
const SliderRow: React.FC<SliderRowProps> = ({ label, value, min, max, step, unit, onChange }) => (
    <div>
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className="font-mono text-sm font-bold text-amber-700">{typeof value === 'number' ? value.toFixed(value < 1 && value > -1 ? 2 : 1) : value} {unit}</span>
        </div>
        <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-2 accent-amber-500"
        />
    </div>
);

export default MagnetismMatterLab;
