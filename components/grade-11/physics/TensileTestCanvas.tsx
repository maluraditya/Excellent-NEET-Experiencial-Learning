import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface TensileTestLabProps {
    topic: any;
    onExit: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   NCERT TEXTBOOK-PROPORTIONED CURVE DATA
   These strain values are chosen to spread the key points
   across the graph exactly like the NCERT diagram: O→A→B→C→D→E
   ═══════════════════════════════════════════════════════════════ */

interface CurvePoint { e: number; s: number; label: string; text: string; }

const MATERIALS: Record<string, {
    name: string; color: string; type: string;
    points: CurvePoint[];
}> = {
    ductile: {
        name: 'Mild Steel', color: '#2196F3', type: 'Ductile',
        points: [
            { e: 0,    s: 0,   label: '',  text: '' },
            { e: 4,    s: 200, label: 'A', text: 'Proportional\nlimit' },
            { e: 6,    s: 230, label: 'B', text: 'Yield point' },
            { e: 9,    s: 240, label: 'C', text: '' },
            { e: 20,   s: 330, label: 'D', text: 'Ultimate Tensile\nStrength (σᵤ)' },
            { e: 28,   s: 280, label: 'E', text: 'Fracture\npoint' },
        ]
    },
    brittle: {
        name: 'Cast Iron', color: '#78909C', type: 'Brittle',
        points: [
            { e: 0,   s: 0,   label: '',  text: '' },
            { e: 3,   s: 180, label: 'A', text: 'Proportional\nlimit' },
            { e: 4.5, s: 220, label: 'D', text: 'Ultimate\nStrength' },
            { e: 5,   s: 210, label: 'E', text: 'Fracture\npoint' },
        ]
    },
    elastomer: {
        name: 'Rubber', color: '#4CAF50', type: 'Elastomer',
        points: [
            { e: 0,    s: 0,   label: '',  text: '' },
            { e: 100,  s: 3,   label: 'A', text: 'Toe region\nend' },
            { e: 400,  s: 15,  label: 'B', text: 'Linear\nregion' },
            { e: 650,  s: 35,  label: 'D', text: 'Ultimate\nStrength' },
            { e: 750,  s: 28,  label: 'E', text: 'Fracture\npoint' },
        ]
    }
};

const WIRE_RADII = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

/* ─── Smooth curve builder ─── */
function buildCurve(points: CurvePoint[], resolution = 600): { e: number; s: number }[] {
    const data: { e: number; s: number }[] = [];
    const maxE = points[points.length - 1].e;
    for (let i = 0; i <= resolution; i++) {
        const e = (i / resolution) * maxE;
        let s = 0;
        for (let j = 0; j < points.length - 1; j++) {
            if (e >= points[j].e && e <= points[j + 1].e) {
                const p1 = points[j], p2 = points[j + 1];
                const seg = p2.e - p1.e;
                if (seg === 0) { s = p1.s; break; }
                const t = (e - p1.e) / seg;
                // Smooth interpolation
                const ease = 3 * t * t - 2 * t * t * t;
                s = p1.s + ease * (p2.s - p1.s);
                break;
            }
        }
        data.push({ e, s });
    }
    return data;
}

function stressAt(curve: { e: number; s: number }[], strain: number): number {
    if (strain <= 0) return 0;
    for (let i = 0; i < curve.length - 1; i++) {
        if (strain >= curve[i].e && strain <= curve[i + 1].e) {
            const t = (strain - curve[i].e) / (curve[i + 1].e - curve[i].e);
            return curve[i].s + t * (curve[i + 1].s - curve[i].s);
        }
    }
    return curve[curve.length - 1].s;
}

/* ════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════ */
const TensileTestCanvas: React.FC<TensileTestLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);

    const [matKey, setMatKey] = useState<string>('ductile');
    const [radius, setRadius] = useState(2.0);
    const [progress, setProgress] = useState(0);
    const [autoPull, setAutoPull] = useState(false);

    const stateRef = useRef({ matKey: 'ductile', radius: 2.0, progress: 0, autoPull: false });
    useEffect(() => {
        stateRef.current = { matKey, radius, progress, autoPull };
    }, [matKey, radius, progress, autoPull]);

    const mat = MATERIALS[matKey];
    const fullCurve = useMemo(() => buildCurve(mat.points), [mat]);
    const maxStrain = mat.points[mat.points.length - 1].e;
    const area = Math.PI * radius * radius;

    const currentStrain = (progress / 100) * maxStrain;
    const currentStress = stressAt(fullCurve, currentStrain);
    const currentLoad = currentStress * area;
    const isFractured = progress >= 100;

    const breakRef = useRef(0.45);
    useEffect(() => { if (isFractured) breakRef.current = 0.35 + Math.random() * 0.3; }, [isFractured]);

    // Auto-pull
    useEffect(() => {
        if (!autoPull) return;
        const iv = setInterval(() => {
            setProgress(p => { if (p >= 100) { setAutoPull(false); return 100; } return Math.min(p + 0.3, 100); });
        }, 30);
        return () => clearInterval(iv);
    }, [autoPull]);

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

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        const sc = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);

        const nowMat = MATERIALS[s.matKey];
        const nowCurve = buildCurve(nowMat.points);
        const nowMaxStrain = nowMat.points[nowMat.points.length - 1].e;
        const nowStrain = (s.progress / 100) * nowMaxStrain;
        const nowStress = stressAt(nowCurve, nowStrain);
        const nowArea = Math.PI * s.radius * s.radius;
        const nowLoad = nowStress * nowArea;
        const nowFractured = s.progress >= 100;

        // ─── LAYOUT SPLIT ───
        // Apparatus: left 25%     Graph: right 73%
        const appCX = W * 0.13;
        const appTopY = H * 0.15;

        // ═══ TITLE ═══
        ctx.fillStyle = '#1a1a2e';
        ctx.font = `bold ${Math.max(14, W * 0.016)}px "Inter", "Segoe UI", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('Stress–Strain Curve', W * 0.025, W * 0.025);
        ctx.fillStyle = '#6b7280';
        ctx.font = `600 ${Math.max(11, W * 0.011)}px "Inter", sans-serif`;
        ctx.fillText(`${nowMat.name}  ·  r = ${s.radius} mm  ·  A = ${nowArea.toFixed(1)} mm²`, W * 0.025, W * 0.025 + Math.max(14, W * 0.016) + 6);

        // ═══ APPARATUS DRAWING ═══
        const wireBaseLen = H * 0.42;
        const stretch = Math.min(nowStrain / nowMaxStrain * H * 0.15, H * 0.2);
        const wireLen = wireBaseLen + stretch;
        const wireW = Math.max(s.radius * 2.8 * sc, 4);

        // Frame
        ctx.fillStyle = '#334155';
        ctx.fillRect(appCX - 45 * sc, appTopY - 28 * sc, 90 * sc, 8 * sc);
        ctx.fillRect(appCX - 45 * sc, appTopY - 28 * sc, 7 * sc, 40 * sc);
        ctx.fillRect(appCX + 38 * sc, appTopY - 28 * sc, 7 * sc, 40 * sc);
        // Clamp
        ctx.fillStyle = '#475569';
        rr(ctx, appCX - 18 * sc, appTopY + 2 * sc, 36 * sc, 14 * sc, 4); ctx.fill();

        if (!nowFractured) {
            // Neck calculation
            const ptDm = nowMat.points.find(p => p.label === 'D');
            const dE = ptDm ? ptDm.e : nowMaxStrain;
            const neck = nowStrain > dE
                ? Math.max(0.3, 1 - ((nowStrain - dE) / (nowMaxStrain - dE)) * 0.7)
                : 1;

            const grad = ctx.createLinearGradient(appCX - wireW, 0, appCX + wireW, 0);
            grad.addColorStop(0, nowMat.color);
            grad.addColorStop(0.5, '#e3f2fd');
            grad.addColorStop(1, nowMat.color);
            ctx.fillStyle = grad;

            ctx.fillRect(appCX - wireW / 2, appTopY + 14 * sc, wireW, wireLen * 0.42);
            const nW = wireW * neck;
            ctx.fillRect(appCX - nW / 2, appTopY + 14 * sc + wireLen * 0.42, nW, wireLen * 0.16);
            ctx.fillRect(appCX - wireW / 2, appTopY + 14 * sc + wireLen * 0.58, wireW, wireLen * 0.42);

            // Bottom clamp
            const hY = appTopY + 14 * sc + wireLen;
            ctx.fillStyle = '#475569';
            rr(ctx, appCX - 28 * sc, hY, 56 * sc, 18 * sc, 4); ctx.fill();

            if (nowLoad > 0) {
                const aY = hY + 24 * sc;
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3 * sc;
                arrowLine(ctx, appCX, aY, appCX, aY + 22 * sc);
                ctx.fillStyle = '#ef4444'; ctx.font = `bold ${Math.max(12, W * 0.013)}px monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.round(nowLoad)} N`, appCX, aY + 40 * sc);
            }
        } else {
            ctx.fillStyle = nowMat.color;
            const bkY = appTopY + 14 * sc + wireLen * breakRef.current;
            ctx.fillRect(appCX - wireW / 2, appTopY + 14 * sc, wireW, wireLen * breakRef.current);
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3 * sc;
            ctx.beginPath();
            ctx.moveTo(appCX - wireW * 2, bkY); ctx.lineTo(appCX + wireW * 2, bkY + 5 * sc);
            ctx.stroke();
            ctx.fillStyle = nowMat.color;
            ctx.fillRect(appCX - wireW / 2, bkY + 22 * sc, wireW, wireLen * 0.3);
            ctx.fillStyle = '#ef4444';
            ctx.font = `bold ${Math.max(15, W * 0.016)}px "Inter", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('FRACTURED', appCX, appTopY + wireLen + 70 * sc);
        }

        // ═══ GRAPH ═══
        const gOuter = { x: W * 0.28, y: H * 0.04, w: W * 0.70, h: H * 0.92 };

        ctx.fillStyle = '#ffffff';
        rr(ctx, gOuter.x, gOuter.y, gOuter.w, gOuter.h, 14); ctx.fill();
        ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
        rr(ctx, gOuter.x, gOuter.y, gOuter.w, gOuter.h, 14); ctx.stroke();

        // INNER PLOTTING AREA with generous margins
        const mL = gOuter.w * 0.10;
        const mR = gOuter.w * 0.06;
        const mT = gOuter.h * 0.08;
        const mB = gOuter.h * 0.14;

        const ax = gOuter.x + mL;
        const ay = gOuter.y + mT;
        const aw = gOuter.w - mL - mR;
        const ah = gOuter.h - mT - mB;

        const maxGS = Math.max(...nowMat.points.map(p => p.s)) * 1.25;
        const maxGE = nowMaxStrain * 1.12;

        const pX = (e: number) => ax + (e / maxGE) * aw;
        const pY = (st: number) => ay + ah - (st / maxGS) * ah;

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

        // AXES — thick, clean
        ctx.strokeStyle = '#111827'; ctx.lineWidth = 2.5;
        ctx.fillStyle = '#111827';
        arrowLine(ctx, ax, ay + ah, ax + aw + 14, ay + ah);
        arrowLine(ctx, ax, ay + ah, ax, ay - 14);

        // Axis labels — BIG, bold
        const axisFont = Math.max(14, gOuter.w * 0.028);
        ctx.fillStyle = '#111827';
        ctx.font = `bold ${axisFont}px "Inter", "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Strain  →', ax + aw / 2, ay + ah + mB * 0.65);

        ctx.save();
        ctx.translate(gOuter.x + mL * 0.28, ay + ah / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Stress  →', 0, 0);
        ctx.restore();

        // Origin label
        ctx.font = `bold ${Math.max(13, gOuter.w * 0.022)}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('0', ax - 14, ay + ah + 18);

        // ─── GHOST CURVE (full path, very faint) ───
        ctx.strokeStyle = `${nowMat.color}18`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        nowCurve.forEach((pt, i) => i === 0 ? ctx.moveTo(pX(pt.e), pY(pt.s)) : ctx.lineTo(pX(pt.e), pY(pt.s)));
        ctx.stroke();

        // ─── ACTIVE BOLD CURVE ───
        const activeIdx = Math.floor((s.progress / 100) * (nowCurve.length - 1));
        if (activeIdx > 0) {
            // Glow behind
            ctx.strokeStyle = `${nowMat.color}30`;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i <= activeIdx; i++) {
                const pt = nowCurve[i];
                i === 0 ? ctx.moveTo(pX(pt.e), pY(pt.s)) : ctx.lineTo(pX(pt.e), pY(pt.s));
            }
            ctx.stroke();

            // Main line
            ctx.strokeStyle = nowMat.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i <= activeIdx; i++) {
                const pt = nowCurve[i];
                i === 0 ? ctx.moveTo(pX(pt.e), pY(pt.s)) : ctx.lineTo(pX(pt.e), pY(pt.s));
            }
            ctx.stroke();
            ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';

            // Tracker dot
            if (!nowFractured) {
                const head = nowCurve[activeIdx];
                ctx.fillStyle = `${nowMat.color}40`;
                ctx.beginPath(); ctx.arc(pX(head.e), pY(head.s), 14, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = nowMat.color;
                ctx.beginPath(); ctx.arc(pX(head.e), pY(head.s), 6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(pX(head.e), pY(head.s), 2.5, 0, Math.PI * 2); ctx.fill();
            }
        }

        // ═══ ANNOTATIONS ═══
        const labelFont = Math.max(16, gOuter.w * 0.032);
        const descFont = Math.max(12, gOuter.w * 0.020);

        nowMat.points.forEach((pt) => {
            if (!pt.label) return;
            if (nowStrain < pt.e && !nowFractured) return;

            const px = pX(pt.e), py = pY(pt.s);

            // Big black dot
            ctx.fillStyle = '#111827';
            ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();

            // White ring highlight
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.stroke();

            // LETTER LABEL — bold, large, well-positioned
            ctx.font = `bold ${labelFont}px "Inter", "Segoe UI", sans-serif`;
            ctx.fillStyle = '#111827';

            let lx = px, ly = py;

            if (pt.label === 'A') {
                lx = px - 8; ly = py + labelFont + 10;
                ctx.textAlign = 'center';
            } else if (pt.label === 'B') {
                lx = px + 14; ly = py + 6;
                ctx.textAlign = 'left';
            } else if (pt.label === 'C') {
                lx = px + 14; ly = py - 10;
                ctx.textAlign = 'left';
            } else if (pt.label === 'D') {
                lx = px; ly = py - 22;
                ctx.textAlign = 'center';
            } else if (pt.label === 'E') {
                lx = px + 14; ly = py - 4;
                ctx.textAlign = 'left';
            }

            ctx.fillText(pt.label, lx, ly);

            // DESCRIPTION TEXT — below/beside the letter
            if (pt.text) {
                ctx.font = `500 ${descFont}px "Inter", sans-serif`;
                ctx.fillStyle = '#4b5563';
                const lines = pt.text.split('\n');

                if (pt.label === 'A') {
                    ctx.textAlign = 'center';
                    lines.forEach((line, idx) => {
                        ctx.fillText(line, px - 8, ly + descFont + 4 + idx * (descFont + 3));
                    });
                } else if (pt.label === 'B') {
                    ctx.textAlign = 'left';
                    lines.forEach((line, idx) => {
                        ctx.fillText(line, px + 14, ly + labelFont + 2 + idx * (descFont + 3));
                    });
                } else if (pt.label === 'D') {
                    ctx.textAlign = 'center';
                    lines.forEach((line, idx) => {
                        ctx.fillText(line, px, ly - labelFont - 2 - (lines.length - 1 - idx) * (descFont + 3));
                    });
                } else if (pt.label === 'E') {
                    ctx.textAlign = 'left';
                    lines.forEach((line, idx) => {
                        ctx.fillText(line, px + 14, ly + labelFont + 2 + idx * (descFont + 3));
                    });
                }
            }
        });

        // ═══ DASHED REFERENCE LINES (Ductile only) ═══
        if (nowMat.type === 'Ductile') {
            const ptB = nowMat.points.find(p => p.label === 'B')!;
            const ptC = nowMat.points.find(p => p.label === 'C');
            const ptA = nowMat.points.find(p => p.label === 'A')!;
            const ptD = nowMat.points.find(p => p.label === 'D')!;

            ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
            const refFont = Math.max(14, gOuter.w * 0.026);
            ctx.font = `bold italic ${refFont}px "Inter", serif`;
            ctx.fillStyle = '#374151';

            // σ_y
            if (nowStrain >= ptB.e || nowFractured) {
                ctx.beginPath(); ctx.moveTo(pX(ptB.e), pY(ptB.s)); ctx.lineTo(ax, pY(ptB.s)); ctx.stroke();
                ctx.textAlign = 'right';
                ctx.fillText('σᵧ', ax - 10, pY(ptB.s) + 5);
            }
            // σ_u
            if (nowStrain >= ptD.e || nowFractured) {
                ctx.beginPath(); ctx.moveTo(pX(ptD.e), pY(ptD.s)); ctx.lineTo(ax, pY(ptD.s)); ctx.stroke();
                ctx.textAlign = 'right';
                ctx.fillText('σᵤ', ax - 10, pY(ptD.s) + 5);
            }

            // Permanent set from C
            if (ptC && (nowStrain >= ptC.e || nowFractured)) {
                const slope = ptA.s / ptA.e;
                const intE = ptC.e - ptC.s / slope;
                ctx.beginPath(); ctx.moveTo(pX(ptC.e), pY(ptC.s)); ctx.lineTo(pX(intE), pY(0)); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#374151';
                ctx.beginPath(); ctx.arc(pX(intE), pY(0), 4, 0, Math.PI * 2); ctx.fill();
                ctx.font = `600 ${Math.max(12, gOuter.w * 0.020)}px "Inter", sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText('Permanent set', pX(intE) + 14, pY(0) - 8);
                ctx.fillText('< 1%', pX(intE) - 6, pY(0) + 18);
            }
            ctx.setLineDash([]);
        }


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
            {/* LEFT: All controls stacked */}
            <div className="flex-1 flex flex-col gap-2 md:gap-3 min-w-0">
                {/* Material + Radius */}
                <div className="grid grid-cols-[1fr_auto] gap-2 md:gap-3">
                    <div className="p-2.5 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Material</span>
                        <div className="flex bg-slate-100 p-0.5 md:p-1 rounded-lg border border-slate-200">
                            {Object.keys(MATERIALS).map(m => (
                                <button key={m} onClick={() => { setMatKey(m); setProgress(0); setAutoPull(false); }}
                                    className={`flex-1 py-1.5 md:py-2 text-xs md:text-sm font-bold rounded-md transition-all ${matKey === m
                                        ? 'bg-white text-slate-800 shadow border border-slate-200'
                                        : 'text-slate-400 hover:text-slate-600'}`}>
                                    {MATERIALS[m].name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-2.5 md:p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1.5 min-w-[120px]">
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Wire Radius</span>
                        <select value={radius}
                            onChange={e => { setRadius(Number(e.target.value)); setProgress(0); setAutoPull(false); }}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2 px-2.5 rounded-lg cursor-pointer outline-none focus:border-blue-400 text-sm">
                            {WIRE_RADII.map(r => <option key={r} value={r}>{r.toFixed(1)} mm</option>)}
                        </select>
                    </div>
                </div>

                {/* Elongation slider */}
                <div className="p-3 md:p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs md:text-sm font-bold text-slate-700">📏 UTM Elongation</span>
                        <span className={`font-mono text-xs md:text-sm px-3 py-1 rounded-lg border font-bold ${isFractured
                            ? 'text-white bg-red-500 border-red-400'
                            : 'text-blue-700 bg-blue-50 border-blue-100'}`}>
                            {isFractured ? '⚠ FRACTURED' : `${progress.toFixed(1)} %`}
                        </span>
                    </div>
                    <input type="range" min="0" max="100" step="0.1" value={progress}
                        onChange={e => { setProgress(Number(e.target.value)); setAutoPull(false); }}
                        className={`w-full h-2.5 md:h-3 rounded-full appearance-none cursor-pointer ${isFractured ? 'bg-red-100' : 'bg-slate-100'}`}
                        style={{ accentColor: isFractured ? '#ef4444' : mat.color }} />
                    <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">Rest</span>
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">Fracture</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 md:gap-3">
                    <button onClick={() => setAutoPull(!autoPull)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all shadow active:scale-95 border ${autoPull
                            ? 'bg-amber-500 text-white border-amber-400'
                            : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'}`}>
                        {autoPull ? <><Pause size={16} /> STOP</> : <><Play size={16} /> AUTO-PULL</>}
                    </button>
                    <button onClick={() => { setProgress(0); setAutoPull(false); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 font-bold text-xs md:text-sm shadow-sm active:scale-95">
                        <RotateCcw size={16} /> RESET
                    </button>
                </div>
            </div>

            {/* RIGHT: Live data vertical sidebar */}
            <div className="w-[100px] md:w-[120px] flex flex-col gap-2 md:gap-2.5 shrink-0">
                <div className="flex-1 p-2.5 md:p-3 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-red-400 uppercase tracking-widest mb-0.5">Stress</span>
                    <span className="text-base md:text-lg font-bold text-red-600 font-mono leading-tight">{currentStress.toFixed(1)}</span>
                    <span className="text-[9px] md:text-[10px] text-red-400 font-bold">MPa</span>
                </div>
                <div className="flex-1 p-2.5 md:p-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Strain</span>
                    <span className="text-base md:text-lg font-bold text-blue-600 font-mono leading-tight">{currentStrain.toFixed(3)}</span>
                </div>
                <div className="flex-1 p-2.5 md:p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Load</span>
                    <span className="text-base md:text-lg font-bold text-slate-700 font-mono leading-tight">{Math.round(currentLoad)}</span>
                    <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">N</span>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

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

export default TensileTestCanvas;
