import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface YoungsModulusLabProps {
    topic: any;
    onExit: () => void;
    mode?: 'tensile' | 'youngs';
    setMode?: (m: 'tensile' | 'youngs') => void;
}

/* ═══════════════════════════════════════════════════════════════
   NCERT TABLE 8.1 — Material Properties
   ═══════════════════════════════════════════════════════════════ */
interface MaterialData {
    name: string;
    color: string;
    Y: number;            // Young's Modulus in Pa
    yGPa: number;         // Young's Modulus in GPa (display)
    ultimateStrength: number; // Pa
    ultimateMPa: number;  // MPa (display)
}

const MATERIALS: Record<string, MaterialData> = {
    steel: {
        name: 'Steel', color: '#3b82f6',
        Y: 2.0e11, yGPa: 200,
        ultimateStrength: 5.0e8, ultimateMPa: 500,
    },
    copper: {
        name: 'Copper', color: '#f59e0b',
        Y: 1.1e11, yGPa: 110,
        ultimateStrength: 2.2e8, ultimateMPa: 220,
    },
    brass: {
        name: 'Brass', color: '#10b981',
        Y: 1.0e11, yGPa: 100,
        ultimateStrength: 3.5e8, ultimateMPa: 350,
    },
    aluminum: {
        name: 'Aluminum', color: '#8b5cf6',
        Y: 0.7e11, yGPa: 70,
        ultimateStrength: 1.1e8, ultimateMPa: 110,
    },
};

/* ─── Helpers ─── */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function arrowLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    const hl = 10;
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(a - Math.PI / 6), y2 - hl * Math.sin(a - Math.PI / 6));
    ctx.lineTo(x2 - hl * Math.cos(a + Math.PI / 6), y2 - hl * Math.sin(a + Math.PI / 6));
    ctx.closePath(); ctx.fill();
}

function formatSci(val: number, decimals = 2): string {
    if (val === 0) return '0';
    const exp = Math.floor(Math.log10(Math.abs(val)));
    const mantissa = val / Math.pow(10, exp);
    return `${mantissa.toFixed(decimals)}×10^${exp}`;
}

/* ════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════ */
const YoungsModulusLab: React.FC<YoungsModulusLabProps> = ({ topic, onExit, mode, setMode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);

    // Controls
    const [matKey, setMatKey] = useState<string>('steel');
    const [force, setForce] = useState(100000);       // N
    const [length, setLength] = useState(1.0);         // m
    const [radiusMm, setRadiusMm] = useState(10);      // mm

    // Derived computations
    const mat = MATERIALS[matKey];
    const radiusM = radiusMm / 1000;
    const area = Math.PI * radiusM * radiusM;
    const stress = force / area;
    const isFractured = stress > mat.ultimateStrength;
    const deltaL = isFractured ? NaN : (force * length) / (area * mat.Y);
    const strain = isFractured ? NaN : deltaL / length;

    // Stress-strain history for graph (tracks as force changes)
    const graphPoints = useMemo(() => {
        const pts: { stress: number; strain: number }[] = [];
        const r = radiusMm / 1000;
        const a = Math.PI * r * r;
        const maxF = 500000;
        const steps = 200;
        for (let i = 0; i <= steps; i++) {
            const f = (i / steps) * maxF;
            const s = f / a;
            if (s > mat.ultimateStrength) break;
            const dl = (f * length) / (a * mat.Y);
            const e = dl / length;
            pts.push({ stress: s, strain: e });
        }
        return pts;
    }, [matKey, length, radiusMm, mat]);

    // Ref for animation state
    const stateRef = useRef({ matKey, force, length, radiusMm, stress, strain, deltaL, isFractured, area });
    useEffect(() => {
        stateRef.current = { matKey, force, length, radiusMm, stress, strain: strain ?? 0, deltaL: deltaL ?? 0, isFractured, area };
    }, [matKey, force, length, radiusMm, stress, strain, deltaL, isFractured, area]);

    // Resize
    useEffect(() => {
        const c = canvasRef.current; if (!c) return;
        const p = c.parentElement; if (!p) return;
        const ro = new ResizeObserver(() => { c.width = p.clientWidth; c.height = p.clientHeight; });
        ro.observe(p); c.width = p.clientWidth; c.height = p.clientHeight;
        return () => ro.disconnect();
    }, []);

    /* ════════════════════════════════════════════════════════
       DRAW
       ════════════════════════════════════════════════════════ */
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }
        const s = stateRef.current;
        const nowMat = MATERIALS[s.matKey];

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        const sc = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);

        // ═══ TITLE ═══
        // Using explicit minimums to avoid colliding with the floating "Back to Curriculum" button
        const titleX = Math.max(30, W * 0.025);
        const titleY = Math.max(65, H * 0.06); 
        ctx.fillStyle = '#1a1a2e';
        const titleSize = Math.max(16, W * 0.016);
        ctx.font = `bold ${titleSize}px "Inter", "Segoe UI", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText("Young's Modulus Testing Rig", titleX, titleY);
        
        ctx.fillStyle = '#6b7280';
        const subSize = Math.max(11, W * 0.011);
        ctx.font = `600 ${subSize}px "Inter", sans-serif`;
        ctx.fillText(`${nowMat.name}  ·  Y = ${nowMat.yGPa} GPa  ·  r = ${s.radiusMm} mm  ·  A = ${(s.area * 1e6).toFixed(2)} mm²`, titleX, titleY + titleSize + 8);

        // ═══ APPARATUS (left 25%) ═══
        const appCX = Math.max(120, W * 0.15); // Ensure it's not squished to the edge
        const appTopY = Math.max(titleY + titleSize + 35 * sc, H * 0.15); // Move closer to title
        
        // Dynamically calculate wire length so the loading pan and weights never get cut off at the bottom
        const reservedBottomSpace = 160 * sc; // Space needed below wire for clamps, 5 weights, and text
        const maxWireHeight = (H - appTopY - reservedBottomSpace) / 1.2; // 1.2 factor to account for max visual stretch (20%)
        const wireBaseLen = Math.max(60, Math.min(H * 0.35, maxWireHeight)); 
        // Visual stretch: scale deltaL relative to length for visual. Cap at 0.2*wireBaseLen
        const visualStretch = s.isFractured ? wireBaseLen * 0.2 : Math.min((s.deltaL / s.length) * wireBaseLen * 30, wireBaseLen * 0.2);
        const wireLen = wireBaseLen + visualStretch;
        const wireW = Math.max(Math.min(s.radiusMm * 2.0 * sc, 50), 4);

        // Frame
        ctx.fillStyle = '#334155';
        ctx.fillRect(appCX - 45 * sc, appTopY - 28 * sc, 90 * sc, 8 * sc);
        ctx.fillRect(appCX - 45 * sc, appTopY - 28 * sc, 7 * sc, 40 * sc);
        ctx.fillRect(appCX + 38 * sc, appTopY - 28 * sc, 7 * sc, 40 * sc);
        // Upper clamp
        ctx.fillStyle = '#475569';
        rr(ctx, appCX - 18 * sc, appTopY + 2 * sc, 36 * sc, 14 * sc, 4); ctx.fill();

        if (!s.isFractured) {
            // Wire gradient
            const grad = ctx.createLinearGradient(appCX - wireW, 0, appCX + wireW, 0);
            grad.addColorStop(0, nowMat.color);
            grad.addColorStop(0.5, '#e3f2fd');
            grad.addColorStop(1, nowMat.color);
            ctx.fillStyle = grad;

            // Wire — slight necking near middle when stress is high
            const neckFactor = Math.max(0.5, 1 - (s.stress / nowMat.ultimateStrength) * 0.5);
            const topW = wireW;
            const midW = wireW * neckFactor;

            // Top segment
            ctx.fillRect(appCX - topW / 2, appTopY + 14 * sc, topW, wireLen * 0.35);
            // Middle (necked)
            ctx.fillRect(appCX - midW / 2, appTopY + 14 * sc + wireLen * 0.35, midW, wireLen * 0.3);
            // Bottom
            ctx.fillRect(appCX - topW / 2, appTopY + 14 * sc + wireLen * 0.65, topW, wireLen * 0.35);

            // Bottom clamp
            const hY = appTopY + 14 * sc + wireLen;
            ctx.fillStyle = '#475569';
            rr(ctx, appCX - 28 * sc, hY, 56 * sc, 18 * sc, 4); ctx.fill();

            // Loading pan
            ctx.fillStyle = '#64748b';
            ctx.fillRect(appCX - 2, hY + 18 * sc, 4, 20 * sc);
            rr(ctx, appCX - 30 * sc, hY + 36 * sc, 60 * sc, 10 * sc, 3); ctx.fill();

            // Weight blocks on pan
            const numBlocks = Math.min(Math.ceil(s.force / 100000), 5);
            for (let i = 0; i < numBlocks; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#94a3b8' : '#cbd5e1';
                const bY = hY + 46 * sc + i * 12 * sc;
                rr(ctx, appCX - 22 * sc, bY, 44 * sc, 10 * sc, 2); ctx.fill();
                ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
                rr(ctx, appCX - 22 * sc, bY, 44 * sc, 10 * sc, 2); ctx.stroke();
            }

            // Force arrow
            if (s.force > 0) {
                const aY = hY + 50 * sc + numBlocks * 12 * sc;
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3 * sc;
                ctx.fillStyle = '#ef4444';
                arrowLine(ctx, appCX, aY, appCX, aY + 22 * sc);
                ctx.font = `bold ${Math.max(12, W * 0.013)}px monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(`F = ${(s.force / 1000).toFixed(0)} kN`, appCX, aY + 40 * sc);
            }

            // ΔL measurement line
            if (s.deltaL > 0) {
                const mX = appCX + 50 * sc;
                const mTopY = appTopY + 14 * sc + wireBaseLen;
                const mBotY = mTopY + visualStretch;
                ctx.strokeStyle = '#059669'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
                ctx.beginPath(); ctx.moveTo(mX, mTopY); ctx.lineTo(mX, mBotY); ctx.stroke();
                ctx.setLineDash([]);
                // Arrows
                ctx.fillStyle = '#059669';
                ctx.beginPath(); ctx.moveTo(mX - 4, mTopY + 6); ctx.lineTo(mX + 4, mTopY + 6); ctx.lineTo(mX, mTopY); ctx.fill();
                ctx.beginPath(); ctx.moveTo(mX - 4, mBotY - 6); ctx.lineTo(mX + 4, mBotY - 6); ctx.lineTo(mX, mBotY); ctx.fill();
                ctx.font = `bold ${Math.max(11, W * 0.012)}px monospace`;
                ctx.textAlign = 'left'; ctx.fillStyle = '#059669';
                const dlText = s.deltaL < 0.001 ? `${(s.deltaL * 1000).toFixed(3)} mm` : `${(s.deltaL * 100).toFixed(4)} cm`;
                ctx.fillText(`ΔL = ${dlText}`, mX + 8, (mTopY + mBotY) / 2 + 4);
            }
        } else {
            // FRACTURED STATE
            const bkFrac = 0.45;
            const bkY = appTopY + 14 * sc + wireLen * bkFrac;
            ctx.fillStyle = nowMat.color;
            ctx.fillRect(appCX - wireW / 2, appTopY + 14 * sc, wireW, wireLen * bkFrac);
            // Jagged break
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3 * sc;
            ctx.beginPath();
            ctx.moveTo(appCX - wireW * 1.5, bkY);
            for (let jx = -wireW * 1.5; jx < wireW * 1.5; jx += 4) {
                ctx.lineTo(appCX + jx, bkY + (Math.random() - 0.5) * 8 * sc);
            }
            ctx.stroke();
            // Dangling bottom
            ctx.fillStyle = nowMat.color;
            ctx.fillRect(appCX - wireW / 2, bkY + 20 * sc, wireW, wireLen * 0.25);

            ctx.fillStyle = '#ef4444';
            ctx.font = `bold ${Math.max(15, W * 0.016)}px "Inter", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('⚠ FRACTURED', appCX, appTopY + wireLen + 80 * sc);
            ctx.font = `600 ${Math.max(11, W * 0.011)}px "Inter", sans-serif`;
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(`Stress exceeded ${nowMat.ultimateMPa} MPa`, appCX, appTopY + wireLen + 100 * sc);
        }

        // ═══ GRAPH (right 70%) ═══
        const gOuter = { x: W * 0.30, y: H * 0.04, w: W * 0.68, h: H * 0.92 };

        ctx.fillStyle = '#ffffff';
        rr(ctx, gOuter.x, gOuter.y, gOuter.w, gOuter.h, 14); ctx.fill();
        ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
        rr(ctx, gOuter.x, gOuter.y, gOuter.w, gOuter.h, 14); ctx.stroke();

        // Inner plot area
        const mL = gOuter.w * 0.12;
        const mR = gOuter.w * 0.06;
        const mT = gOuter.h * 0.08;
        const mB = gOuter.h * 0.14;

        const ax = gOuter.x + mL;
        const ay = gOuter.y + mT;
        const aw = gOuter.w - mL - mR;
        const ah = gOuter.h - mT - mB;

        // Determine graph ranges — show all materials faintly for comparison
        let maxGraphStress = 0;
        let maxGraphStrain = 0;
        const r = s.radiusMm / 1000;
        const a = Math.PI * r * r;
        for (const mk of Object.keys(MATERIALS)) {
            const m = MATERIALS[mk];
            const maxStress = m.ultimateStrength;
            const maxStrain = (500000 * s.length) / (a * m.Y * s.length); // simplifies to 500000/(a*Y)
            if (maxStress > maxGraphStress) maxGraphStress = maxStress;
            // strain at max force or at ultimate
            const strainAtUlt = m.ultimateStrength / m.Y;
            if (strainAtUlt > maxGraphStrain) maxGraphStrain = strainAtUlt;
        }
        maxGraphStress *= 1.2;
        maxGraphStrain *= 1.3;

        const pX = (strain: number) => ax + (strain / maxGraphStrain) * aw;
        const pY = (stress: number) => ay + ah - (stress / maxGraphStress) * ah;

        // Light gridlines
        ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            const ly = ay + ah - (ah / 4) * i;
            ctx.beginPath(); ctx.moveTo(ax, ly); ctx.lineTo(ax + aw, ly); ctx.stroke();
        }
        for (let i = 1; i <= 5; i++) {
            const lx = ax + (aw / 5) * i;
            ctx.beginPath(); ctx.moveTo(lx, ay); ctx.lineTo(lx, ay + ah); ctx.stroke();
        }

        // Axes
        ctx.strokeStyle = '#111827'; ctx.lineWidth = 2.5;
        ctx.fillStyle = '#111827';
        arrowLine(ctx, ax, ay + ah, ax + aw + 14, ay + ah);
        arrowLine(ctx, ax, ay + ah, ax, ay - 14);

        // Axis labels
        const axisFont = Math.max(14, gOuter.w * 0.028);
        ctx.fillStyle = '#111827';
        ctx.font = `bold ${axisFont}px "Inter", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Strain (ε)  →', ax + aw / 2, ay + ah + mB * 0.65);

        ctx.save();
        ctx.translate(gOuter.x + mL * 0.22, ay + ah / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Stress (σ)  →', 0, 0);
        ctx.restore();

        // Origin
        ctx.font = `bold ${Math.max(13, gOuter.w * 0.022)}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('0', ax - 14, ay + ah + 18);

        // ─── Ghost lines for ALL materials + endpoint labels ───
        const matKeys = Object.keys(MATERIALS);
        // Sort so labels at endpoints are stacked consistently (highest Y on top)
        const sortedKeys = [...matKeys].sort((a, b) => MATERIALS[b].Y - MATERIALS[a].Y);

        for (const mk of matKeys) {
            const m = MATERIALS[mk];
            const isActive = mk === s.matKey;
            ctx.strokeStyle = isActive ? `${m.color}20` : `${m.color}15`;
            ctx.lineWidth = isActive ? 5 : 2;
            ctx.setLineDash(isActive ? [] : [6, 6]);
            ctx.beginPath();
            const maxStr = m.ultimateStrength / m.Y; // max strain at ultimate
            ctx.moveTo(pX(0), pY(0));
            ctx.lineTo(pX(maxStr), pY(m.ultimateStrength));
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw endpoint labels for ghost materials (at the TOP end of each line)
        const labelFont = Math.max(11, gOuter.w * 0.019);
        for (let i = 0; i < sortedKeys.length; i++) {
            const mk = sortedKeys[i];
            const m = MATERIALS[mk];
            const isActive = mk === s.matKey;
            const maxStr = m.ultimateStrength / m.Y;
            const endX = pX(maxStr);
            const endY = pY(m.ultimateStrength);

            // Place label to the right of the line endpoint, stacked vertically
            ctx.font = `${isActive ? 'bold' : '600'} ${labelFont}px "Inter", sans-serif`;
            ctx.fillStyle = isActive ? m.color : `${m.color}70`;
            ctx.textAlign = 'left';
            ctx.fillText(`${m.name} (${m.yGPa})`, endX + 10, endY + 4);
        }

        // ─── Active material bold line ───
        const currentStrain = s.isFractured ? (nowMat.ultimateStrength / nowMat.Y) : s.strain;
        const currentStress = s.isFractured ? nowMat.ultimateStrength : s.stress;

        if (currentStrain > 0 && currentStress > 0) {
            // Glow
            ctx.strokeStyle = `${nowMat.color}30`;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(pX(0), pY(0));
            ctx.lineTo(pX(currentStrain), pY(currentStress));
            ctx.stroke();

            // Main line
            ctx.strokeStyle = nowMat.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(pX(0), pY(0));
            ctx.lineTo(pX(currentStrain), pY(currentStress));
            ctx.stroke();
            ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';

            // Tracker dot
            if (!s.isFractured) {
                ctx.fillStyle = `${nowMat.color}40`;
                ctx.beginPath(); ctx.arc(pX(currentStrain), pY(currentStress), 14, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = nowMat.color;
                ctx.beginPath(); ctx.arc(pX(currentStrain), pY(currentStress), 6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(pX(currentStrain), pY(currentStress), 2.5, 0, Math.PI * 2); ctx.fill();
            } else {
                // Fracture X marker
                const fx = pX(currentStrain), fy = pY(currentStress);
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(fx - 10, fy - 10); ctx.lineTo(fx + 10, fy + 10); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(fx + 10, fy - 10); ctx.lineTo(fx - 10, fy + 10); ctx.stroke();
            }
        }

        // ─── Slope badge — fixed position in graph, never overlaps lines ───
        {
            const badgeText = `slope = Y = ${nowMat.yGPa} GPa  (${nowMat.name})`;
            const badgeFont = Math.max(13, gOuter.w * 0.022);
            ctx.font = `bold ${badgeFont}px "Inter", sans-serif`;
            const textWidth = ctx.measureText(badgeText).width;
            const badgeX = ax + 16;
            const badgeY = ay + 16;
            const padX = 12, padY = 8;

            // Badge background
            ctx.fillStyle = `${nowMat.color}15`;
            rr(ctx, badgeX, badgeY, textWidth + padX * 2, badgeFont + padY * 2, 8); ctx.fill();
            ctx.strokeStyle = `${nowMat.color}30`; ctx.lineWidth = 1.5;
            rr(ctx, badgeX, badgeY, textWidth + padX * 2, badgeFont + padY * 2, 8); ctx.stroke();

            // Badge text
            ctx.fillStyle = nowMat.color;
            ctx.textAlign = 'left';
            ctx.fillText(badgeText, badgeX + padX, badgeY + padY + badgeFont * 0.82);
        }

        // ─── Key Formula Watermark ───
        ctx.fillStyle = '#e2e8f080';
        ctx.font = `bold ${Math.max(16, gOuter.w * 0.032)}px "Inter", serif`;
        ctx.textAlign = 'right';
        ctx.fillText('Y = σ / ε = FL / AΔL', gOuter.x + gOuter.w - mR - 10, gOuter.y + mT + 28);

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    /* ════════ JSX ════════ */
    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex gap-3 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            {/* LEFT: Controls */}
            <div className="flex-1 flex flex-col gap-2 md:gap-3 min-w-0">
                {/* Material Selector */}
                <div className="p-2.5 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Material (NCERT Table 8.1)</span>
                    <div className="flex bg-slate-100 p-0.5 md:p-1 rounded-lg border border-slate-200">
                        {Object.keys(MATERIALS).map(m => (
                            <button key={m} onClick={() => setMatKey(m)}
                                className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-bold rounded-md transition-all ${matKey === m
                                    ? 'bg-white text-slate-800 shadow border border-slate-200'
                                    : 'text-slate-400 hover:text-slate-600'}`}>
                                {MATERIALS[m].name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Force Slider */}
                <div className="p-3 md:p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs md:text-sm font-bold text-slate-700">⬇ Applied Force (F)</span>
                        <span className={`font-mono text-xs md:text-sm px-3 py-1 rounded-lg border font-bold ${isFractured
                            ? 'text-white bg-red-500 border-red-400'
                            : 'text-blue-700 bg-blue-50 border-blue-100'}`}>
                            {isFractured ? '⚠ FRACTURED' : `${(force / 1000).toFixed(0)} kN`}
                        </span>
                    </div>
                    <input type="range" min="0" max="500000" step="1000" value={force}
                        onChange={e => setForce(Number(e.target.value))}
                        className="w-full h-2.5 md:h-3 rounded-full appearance-none cursor-pointer bg-slate-100"
                        style={{ accentColor: isFractured ? '#ef4444' : mat.color }} />
                    <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">0 N</span>
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">500 kN</span>
                    </div>
                </div>

                {/* Length + Radius row */}
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="p-2.5 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Length (L)</span>
                        <select value={length}
                            onChange={e => setLength(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2 px-2.5 rounded-lg cursor-pointer outline-none focus:border-blue-400 text-sm">
                            {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0].map(l => (
                                <option key={l} value={l}>{l.toFixed(1)} m</option>
                            ))}
                        </select>
                    </div>
                    <div className="p-2.5 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Radius (r)</span>
                        <select value={radiusMm}
                            onChange={e => setRadiusMm(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2 px-2.5 rounded-lg cursor-pointer outline-none focus:border-blue-400 text-sm">
                            {[1, 2, 3, 5, 8, 10, 12, 15, 20].map(r => (
                                <option key={r} value={r}>{r} mm</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Reset */}
                <button onClick={() => { setForce(0); setLength(1.0); setRadiusMm(10); setMatKey('steel'); }}
                    className="flex items-center justify-center gap-1.5 py-2.5 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 font-bold text-xs md:text-sm shadow-sm active:scale-95">
                    <RotateCcw size={16} /> RESET ALL
                </button>
            </div>

            {/* RIGHT: Live data */}
            <div className="w-[100px] md:w-[120px] flex flex-col gap-2 md:gap-2.5 shrink-0">
                <div className="flex-1 p-2.5 md:p-3 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-red-400 uppercase tracking-widest mb-0.5">Stress σ</span>
                    <span className="text-sm md:text-base font-bold text-red-600 font-mono leading-tight">{isFractured ? '—' : (stress / 1e6).toFixed(1)}</span>
                    <span className="text-[9px] md:text-[10px] text-red-400 font-bold">MPa</span>
                </div>
                <div className="flex-1 p-2.5 md:p-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Strain ε</span>
                    <span className="text-sm md:text-base font-bold text-blue-600 font-mono leading-tight">{isFractured ? '—' : (strain ?? 0).toExponential(2)}</span>
                </div>
                <div className="flex-1 p-2.5 md:p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">ΔL</span>
                    <span className="text-sm md:text-base font-bold text-emerald-600 font-mono leading-tight">{isFractured ? '—' : deltaL !== undefined ? (deltaL * 1000).toFixed(3) : '0'}</span>
                    <span className="text-[9px] md:text-[10px] text-emerald-400 font-bold">mm</span>
                </div>
                <div className="flex-1 p-2.5 md:p-3 bg-purple-50 rounded-xl border border-purple-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-0.5">Y</span>
                    <span className="text-sm md:text-base font-bold text-purple-600 font-mono leading-tight">{mat.yGPa}</span>
                    <span className="text-[9px] md:text-[10px] text-purple-400 font-bold">GPa</span>
                </div>
            </div>
        </div>
    );

    const floatingNav = setMode ? (
        <div className="flex bg-slate-800/80 backdrop-blur rounded-xl p-1 shadow-lg border border-slate-700/50 relative z-[200]">
            <button onClick={() => setMode('tensile')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'tensile' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>Stress-Strain Curve</button>
            <button onClick={() => setMode('youngs')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'youngs' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>Young's Modulus</button>
        </div>
    ) : undefined;

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} FloatingNavComponent={floatingNav} />
    );
};

export default YoungsModulusLab;
