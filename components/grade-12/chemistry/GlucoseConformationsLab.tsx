import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Hexagon, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface GlucoseConformationsLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'open' | 'cyclic' | 'muta';
type Anomer = 'alpha' | 'beta';

const W = 1280;
const H = 760;

// NCERT Class 12 Chemistry, Unit 14 Biomolecules §10.1.2.1 — equilibrium composition
const PCT_ALPHA = 36;
const PCT_BETA = 64;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

const GlucoseConformationsLab: React.FC<GlucoseConformationsLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const clockRef = useRef(0);
    const lastTsRef = useRef<number | undefined>(undefined);
    const transRef = useRef(0); // 0→1 entrance/ring-closure transition

    const [mode, setMode] = useState<Mode>('open');
    const [anomer, setAnomer] = useState<Anomer>('beta');
    const [showLabels, setShowLabels] = useState(true);
    const [paused, setPaused] = useState(false);
    const [speed, setSpeed] = useState(1);

    useEffect(() => { transRef.current = 0; }, [mode, anomer]);

    const handleReset = () => {
        setMode('open'); setAnomer('beta'); setShowLabels(true); setPaused(false); setSpeed(1);
        transRef.current = 0;
    };

    // ---------- canvas helpers ----------
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        lastTsRef.current = undefined;

        const atom = (x: number, y: number, r: number, fill: string, label: string, txt = '#0f172a') => {
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = fill; ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = '#334155'; ctx.stroke();
            if (showLabels) {
                ctx.fillStyle = txt; ctx.font = `bold ${Math.round(r * 0.9)}px Inter, system-ui, sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(label, x, y + 1);
            }
        };
        const bond = (x1: number, y1: number, x2: number, y2: number, w = 3, col = '#475569') => {
            ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        };
        const tag = (x: number, y: number, text: string, col: string) => {
            if (!showLabels) return;
            ctx.fillStyle = col; ctx.font = 'bold 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(text, x, y);
        };

        // ---- open-chain Fischer projection of D-(+)-glucose (compact form for muta view) ----
        const drawOpenChain = (cx: number, cy: number, scale: number, highlight: number) => {
            const dy = 46 * scale;
            const armX = 52 * scale;
            const y0 = cy - 2.6 * dy;
            bond(cx, y0, cx, y0 + 5 * dy, 3.5 * scale, '#94a3b8');
            const carbonylOn = highlight === 1;
            atom(cx, y0, 17 * scale, carbonylOn ? '#fecaca' : '#fee2e2', '1', '#b91c1c');
            bond(cx, y0, cx + armX, y0 - 12 * scale, 3 * scale, '#b91c1c');
            tag(cx + armX + 14 * scale, y0 - 14 * scale, 'CHO', '#dc2626');
            const config = [{ r: true }, { r: false }, { r: true }, { r: true }];
            config.forEach((c, i) => {
                const cyi = y0 + (i + 1) * dy;
                const ohOn = highlight === 2;
                atom(cx, cyi, 15 * scale, '#e2e8f0', `${i + 2}`);
                const ohX = c.r ? cx + armX : cx - armX;
                bond(cx, cyi, ohX, cyi, 2.5 * scale, ohOn ? '#0e7490' : '#94a3b8');
                tag(ohX + (c.r ? 14 : -14) * scale, cyi, 'OH', ohOn ? '#0891b2' : '#64748b');
                const hX = c.r ? cx - armX : cx + armX;
                bond(cx, cyi, hX, cyi, 2 * scale, '#cbd5e1');
                tag(hX + (c.r ? -10 : 10) * scale, cyi, 'H', '#94a3b8');
            });
            const cy6 = y0 + 5 * dy;
            const primOn = highlight === 3;
            atom(cx, cy6, 16 * scale, primOn ? '#bbf7d0' : '#dcfce7', '6', '#15803d');
            tag(cx, cy6 + 26 * scale, 'CH₂OH', '#16a34a');
        };

        // ---- large open-chain view that fills the canvas, with an animated feature spotlight ----
        const drawOpenChainLarge = (spot: number) => {
            const cx = 430, top = 150, dy = 86, r = 24, armX = 96;
            // backbone
            bond(cx, top, cx, top + 5 * dy, 5, '#94a3b8');
            // C1 CHO
            const c1On = spot === 0;
            ctx.save(); if (c1On) { ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 22; }
            atom(cx, top, r + 2, c1On ? '#fecaca' : '#fee2e2', '1', '#b91c1c'); ctx.restore();
            bond(cx, top, cx + armX, top - 18, 4, '#b91c1c');
            tag(cx + armX + 22, top - 20, 'CHO', '#dc2626');
            // C2..C5
            const config = [{ r: true }, { r: false }, { r: true }, { r: true }];
            const ohYs: number[] = [];
            config.forEach((c, i) => {
                const cyi = top + (i + 1) * dy;
                const ohOn = spot === 1;
                ctx.save(); if (ohOn) { ctx.shadowColor = '#0891b2'; ctx.shadowBlur = 14; }
                atom(cx, cyi, r, '#e2e8f0', `${i + 2}`); ctx.restore();
                const ohX = c.r ? cx + armX : cx - armX;
                bond(cx, cyi, ohX, cyi, 3, ohOn ? '#0891b2' : '#94a3b8');
                tag(ohX + (c.r ? 20 : -20), cyi, 'OH', ohOn ? '#0891b2' : '#64748b');
                const hX = c.r ? cx - armX : cx + armX;
                bond(cx, cyi, hX, cyi, 2.4, '#cbd5e1');
                tag(hX + (c.r ? -16 : 16), cyi, 'H', '#94a3b8');
                ohYs.push(cyi);
            });
            // C6 CH2OH
            const cy6 = top + 5 * dy;
            const c6On = spot === 2;
            ctx.save(); if (c6On) { ctx.shadowColor = '#16a34a'; ctx.shadowBlur = 20; }
            atom(cx, cy6, r + 1, c6On ? '#bbf7d0' : '#dcfce7', '6', '#15803d'); ctx.restore();
            bond(cx, cy6, cx + armX, cy6 + 18, 3, '#15803d');
            tag(cx + armX + 26, cy6 + 18, 'CH₂OH', '#16a34a');

            // molecule title under chain
            ctx.fillStyle = '#0f172a'; ctx.font = '800 20px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('D-(+)-Glucose', cx, cy6 + 64);
            ctx.fillStyle = '#64748b'; ctx.font = '600 13px Inter, system-ui, sans-serif';
            ctx.fillText('open-chain (Fischer) · aldohexose · C₆H₁₂O₆', cx, cy6 + 86);

            // ---- animated feature spotlight panel (right side) ----
            const features = [
                { title: '–CHO  (aldehyde) at C1', sub: 'carbonyl: forms oxime & cyanohydrin', col: '#dc2626', tgt: { x: cx + armX + 22, y: top - 20 } },
                { title: 'Five  –OH  groups', sub: 'acetylation → glucose pentaacetate', col: '#0891b2', tgt: { x: cx + armX + 20, y: ohYs[2] } },
                { title: '–CH₂OH  (1° alcohol) at C6', sub: 'HNO₃ → saccharic acid', col: '#16a34a', tgt: { x: cx + armX + 26, y: cy6 + 18 } },
            ];
            const fx = 820;
            features.forEach((f, i) => {
                const fy = 250 + i * 130;
                const on = spot === i;
                // connector to the spotlighted atom
                if (on) {
                    ctx.save();
                    ctx.strokeStyle = f.col; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
                    ctx.lineDashOffset = -(clockRef.current * 24) % 11;
                    ctx.beginPath(); ctx.moveTo(f.tgt.x + 30, f.tgt.y); ctx.lineTo(fx - 14, fy); ctx.stroke();
                    ctx.restore(); ctx.setLineDash([]);
                }
                // marker dot
                ctx.save();
                if (on) { ctx.shadowColor = f.col; ctx.shadowBlur = 16; }
                ctx.fillStyle = f.col; ctx.globalAlpha = on ? 1 : 0.4;
                ctx.beginPath(); ctx.arc(fx, fy, on ? 13 : 9, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                ctx.globalAlpha = 1;
                ctx.fillStyle = on ? '#0f172a' : '#94a3b8';
                ctx.font = `${on ? '800' : '700'} 18px Inter, system-ui, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText(f.title, fx + 26, fy - 10);
                ctx.fillStyle = on ? '#475569' : '#cbd5e1';
                ctx.font = '600 13px Inter, system-ui, sans-serif';
                ctx.fillText(f.sub, fx + 26, fy + 12);
            });
        };

        // ---- Haworth pyranose ring ----
        // returns ring vertex map; draws ring + substituents; anomer flips only C1-OH
        const drawHaworth = (cx: number, cy: number, scale: number, an: Anomer, pulseAnomeric: boolean) => {
            const r = 92 * scale;
            // hexagon vertices (deg): O upper-right, C1 lower-right, C2 bottom, C3 lower-left, C4 upper-left, C5 top
            const pts: Record<string, { x: number; y: number }> = {};
            const place = (key: string, deg: number) => {
                const a = (deg * Math.PI) / 180;
                pts[key] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
            };
            place('O', -30); place('C1', 30); place('C2', 90); place('C3', 150); place('C4', 210); place('C5', -90);
            const order = ['O', 'C1', 'C2', 'C3', 'C4', 'C5'];

            // ring fill
            ctx.beginPath();
            order.forEach((k, i) => { const p = pts[k]; i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
            ctx.closePath();
            ctx.fillStyle = 'rgba(16,185,129,0.07)'; ctx.fill();
            // front (lower) edge thicker for Haworth perspective: C4-C3-C2-C1
            for (let i = 0; i < order.length; i++) {
                const a = pts[order[i]], b = pts[order[(i + 1) % order.length]];
                const front = (order[i] === 'C4' || order[i] === 'C3' || order[i] === 'C2');
                bond(a.x, a.y, b.x, b.y, front ? 6 : 3, '#475569');
            }
            // ring O
            atom(pts.O.x, pts.O.y, 16 * scale, '#fde68a', 'O', '#92400e');

            // C5 → CH2OH (C6) upward
            atom(pts.C5.x, pts.C5.y, 15 * scale, '#e2e8f0', 'C5');
            bond(pts.C5.x, pts.C5.y, pts.C5.x, pts.C5.y - 40 * scale, 2.5, '#15803d');
            atom(pts.C5.x, pts.C5.y - 52 * scale, 14 * scale, '#dcfce7', '6', '#15803d');
            tag(pts.C5.x, pts.C5.y - 74 * scale, 'CH₂OH', '#16a34a');

            // C2 OH down, C3 OH up, C4 OH down (β-D-glucopyranose Haworth)
            const sub = (key: string, up: boolean, label: string, col = '#64748b') => {
                const p = pts[key];
                const ey = p.y + (up ? -34 : 34) * scale;
                bond(p.x, p.y, p.x, ey, 2.2, '#94a3b8');
                tag(p.x, ey + (up ? -10 : 10) * scale, label, col);
            };
            atom(pts.C2.x, pts.C2.y, 14 * scale, '#e2e8f0', '2'); sub('C2', false, 'OH');
            atom(pts.C3.x, pts.C3.y, 14 * scale, '#e2e8f0', '3'); sub('C3', true, 'OH');
            atom(pts.C4.x, pts.C4.y, 14 * scale, '#e2e8f0', '4'); sub('C4', false, 'OH');

            // C1 anomeric carbon: OH below (α) or above (β); H opposite
            const c1 = pts.C1;
            if (pulseAnomeric) {
                const pulse = 0.5 + 0.5 * Math.sin(clockRef.current * 3);
                ctx.save();
                ctx.strokeStyle = '#7c3aed'; ctx.globalAlpha = 0.25 + 0.4 * pulse; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(c1.x, c1.y, (20 + 5 * pulse) * scale, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();
            }
            atom(c1.x, c1.y, 15 * scale, '#ede9fe', '1', '#6d28d9');
            const ohUp = an === 'beta';
            const ohY = c1.y + (ohUp ? -34 : 34) * scale;
            const hY = c1.y + (ohUp ? 30 : -30) * scale;
            bond(c1.x, c1.y, c1.x, ohY, 3, '#7c3aed');
            tag(c1.x + 18 * scale, ohY, 'OH', '#7c3aed');
            bond(c1.x, c1.y, c1.x, hY, 2, '#cbd5e1');
            tag(c1.x + 12 * scale, hY, 'H', '#94a3b8');

            // labels
            ctx.fillStyle = '#6d28d9'; ctx.font = '700 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('C1 = anomeric carbon', cx, cy + r + 56 * scale);
            ctx.fillStyle = an === 'alpha' ? '#b45309' : '#0f766e';
            ctx.font = '800 16px Inter, system-ui, sans-serif';
            ctx.fillText(an === 'alpha' ? 'α-D-(+)-Glucopyranose' : 'β-D-(+)-Glucopyranose', cx, cy + r + 34 * scale);
            ctx.fillStyle = '#64748b'; ctx.font = '600 11px Inter, system-ui, sans-serif';
            ctx.fillText(an === 'alpha' ? 'C1–OH below ring (opposite CH₂OH)' : 'C1–OH above ring (same side as CH₂OH)', cx, cy + r + 74 * scale);
        };

        const draw = (ts: number) => {
            const last = lastTsRef.current ?? ts;
            let dt = ts - last; lastTsRef.current = ts;
            if (dt > 100) dt = 100;
            if (!paused) {
                clockRef.current += (dt / 1000) * speed;
                transRef.current = Math.min(1, transRef.current + (dt / 1000) * speed / 0.7);
            }

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = 'rgba(100,116,139,0.05)'; ctx.lineWidth = 1;
            for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

            // caption
            ctx.fillStyle = '#64748b'; ctx.font = '600 14px Inter, system-ui, sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(
                mode === 'open' ? 'Open-chain (Fischer) structure of glucose — the aldohexose'
                    : mode === 'cyclic' ? 'Cyclic hemiacetal (Haworth pyranose) — toggle the α / β anomer'
                        : 'Mutarotation — α and β interconvert through the open chain',
                44, 44);

            if (mode === 'open') {
                drawOpenChainLarge(Math.floor(clockRef.current / 1.8) % 3);
            } else if (mode === 'cyclic') {
                // ring-closure caption pinned to the top (clear of the ring/labels)
                ctx.fillStyle = '#0e7490'; ctx.font = '700 15px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('Ring closure: the C5–OH adds to the C1 –CHO → six-membered hemiacetal (pyranose)', 640, 74);
                // big ring filling the canvas
                drawHaworth(640, 400, 1.7, anomer, true);
                // animated closure arc — drawn OUTSIDE the ring on the right (C5 → O → C1), no label overlap
                const ax = 640, ay = 400, rr = 92 * 1.7;
                ctx.save();
                ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 7]);
                ctx.lineDashOffset = -(clockRef.current * 26) % 15;
                ctx.beginPath();
                // from above C5 (top), bow out to the right past O, down to just right of C1
                ctx.moveTo(ax + 24, ay - rr - 18);
                ctx.quadraticCurveTo(ax + rr + 130, ay - rr / 2, ax + rr + 60, ay + rr / 2 + 4);
                ctx.stroke();
                // arrowhead near C1
                ctx.setLineDash([]);
                ctx.fillStyle = '#0891b2';
                ctx.beginPath();
                ctx.moveTo(ax + rr + 60, ay + rr / 2 + 4);
                ctx.lineTo(ax + rr + 72, ay + rr / 2 - 10);
                ctx.lineTo(ax + rr + 78, ay + rr / 2 + 8);
                ctx.closePath(); ctx.fill();
                ctx.restore();
            } else {
                // mutarotation: α ⇌ open ⇌ β — three large structures across the width
                drawHaworth(270, 360, 1.0, 'alpha', false);
                drawHaworth(1010, 360, 1.0, 'beta', false);
                drawOpenChain(640, 360, 0.95, 0);
                ctx.fillStyle = '#64748b'; ctx.font = '700 13px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('open chain', 640, 540);

                // equilibrium arrows (big)
                const drawEq = (x1: number, x2: number, y: number) => {
                    ctx.strokeStyle = '#0891b2'; ctx.lineWidth = 3; ctx.lineCap = 'round';
                    ctx.setLineDash([8, 7]);
                    ctx.lineDashOffset = -(clockRef.current * 24) % 15;
                    ctx.beginPath(); ctx.moveTo(x1, y - 7); ctx.lineTo(x2, y - 7); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(x2, y + 7); ctx.lineTo(x1, y + 7); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#0891b2';
                    ctx.beginPath(); ctx.moveTo(x2, y - 7); ctx.lineTo(x2 - 11, y - 13); ctx.lineTo(x2 - 11, y - 1); ctx.closePath(); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(x1, y + 7); ctx.lineTo(x1 + 11, y + 1); ctx.lineTo(x1 + 11, y + 13); ctx.closePath(); ctx.fill();
                };
                drawEq(415, 545, 360);
                drawEq(735, 865, 360);

                // travelling token α→open→β→open
                const phase = (clockRef.current * 0.4) % 2;
                const tx = phase < 1 ? 270 + phase * (640 - 270) : 640 + (phase - 1) * (1010 - 640);
                ctx.save(); ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 14;
                ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.arc(tx, 360, 9, 0, Math.PI * 2); ctx.fill();
                ctx.restore();

                // composition bar (α 36% / β 64%) — wide, near the bottom
                const bx = 240, by = 632, bw = 800, bh = 34;
                ctx.fillStyle = '#fde68a';
                ctx.beginPath(); ctx.roundRect(bx, by, bw * (PCT_ALPHA / 100), bh, 8); ctx.fill();
                ctx.fillStyle = '#99f6e4';
                ctx.beginPath(); ctx.roundRect(bx + bw * (PCT_ALPHA / 100), by, bw * (PCT_BETA / 100), bh, 8); ctx.fill();
                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.stroke();
                ctx.fillStyle = '#92400e'; ctx.font = 'bold 15px Inter'; ctx.textAlign = 'center';
                ctx.fillText(`α-D-glucose  ${PCT_ALPHA}%`, bx + bw * (PCT_ALPHA / 100) / 2, by + 22);
                ctx.fillStyle = '#0f766e';
                ctx.fillText(`β-D-glucose  ${PCT_BETA}%`, bx + bw * (PCT_ALPHA / 100) + bw * (PCT_BETA / 100) / 2, by + 22);
                ctx.fillStyle = '#64748b'; ctx.font = '600 12px Inter'; ctx.textAlign = 'center';
                ctx.fillText('Equilibrium mixture in water (plus a trace of open chain) — specific rotation settles to a constant value', bx + bw / 2, by + 54);
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        draw(performance.now());
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [mode, anomer, showLabels, paused, speed]);

    // ---------- left aside: structure facts ----------
    const graphPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Evidence for the structure</div>
                    <div className="text-xs font-semibold text-slate-500">NCERT §14 — how the open chain was deduced</div>
                    <ul className="mt-2 space-y-1.5 text-[12px] font-semibold leading-snug text-slate-700">
                        <li>• HI, Δ → <strong>n-hexane</strong> ⇒ straight 6-C chain</li>
                        <li>• forms oxime / cyanohydrin ⇒ <strong>&gt;C=O</strong> carbonyl</li>
                        <li>• Br₂ water → gluconic acid ⇒ <strong>–CHO</strong> aldehyde</li>
                        <li>• acetic anhydride → pentaacetate ⇒ <strong>5 –OH</strong></li>
                        <li>• HNO₃ → saccharic acid ⇒ a <strong>1° –OH</strong></li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Why a ring forms</div>
                    <div className="text-xs font-semibold text-slate-500">anomalies of the open chain</div>
                    <ul className="mt-2 space-y-1.5 text-[12px] font-semibold leading-snug text-slate-700">
                        <li>• no Schiff's test · no NaHSO₃ adduct</li>
                        <li>• pentaacetate unreactive to NH₂OH ⇒ no free –CHO</li>
                        <li>• exists as two crystalline forms (α, β)</li>
                    </ul>
                    <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">
                        C5–OH adds to C1 –CHO → six-membered <strong>cyclic hemiacetal</strong> (pyranose).
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Anomers at a glance</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-bold">
                        <div className="rounded-lg bg-amber-50 px-2 py-2 text-amber-900">
                            <div className="font-extrabold">α-D-glucose</div>
                            <div className="font-normal">C1–OH below ring</div>
                        </div>
                        <div className="rounded-lg bg-teal-50 px-2 py-2 text-teal-900">
                            <div className="font-extrabold">β-D-glucose</div>
                            <div className="font-normal">C1–OH above ring</div>
                        </div>
                    </div>
                    <div className="mt-2 text-[11px] font-semibold text-slate-500">Differ only at the anomeric carbon C1.</div>
                </div>
            </div>
        </aside>
    ), []);

    // ---------- right aside: theory + values ----------
    const valuesPanel = useMemo(() => (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-emerald-900">Glucose — structure &amp; forms</div>
                    <div className="text-xs font-semibold text-emerald-700">Class 12 Chemistry · Unit 14 Biomolecules</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-emerald-900">
                        <div>Glucose (C₆H₁₂O₆) is an <strong>aldohexose</strong>, D-(+)-glucose.</div>
                        <div>Open chain: –CHO at C1, four –CHOH, –CH₂OH at C6.</div>
                        <div>C5–OH + C1–CHO → six-membered <strong>pyranose</strong> hemiacetal.</div>
                        <div><strong>Anomers</strong> α / β differ only at the anomeric carbon C1.</div>
                        <div><strong>Mutarotation:</strong> α ⇌ open chain ⇌ β in water.</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">Live state</div>
                        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</div>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'View', value: mode === 'open' ? 'Open chain (Fischer)' : mode === 'cyclic' ? 'Cyclic (Haworth)' : 'Mutarotation', tint: 'bg-slate-50', fg: 'text-slate-800' },
                            { label: 'Form', value: mode === 'open' ? 'aldehyde –CHO present' : mode === 'cyclic' ? (anomer === 'alpha' ? 'α-D-glucopyranose' : 'β-D-glucopyranose') : 'α ⇌ β equilibrium', tint: 'bg-emerald-50', fg: 'text-emerald-700' },
                            { label: 'Anomeric carbon', value: 'C1', tint: 'bg-violet-50', fg: 'text-violet-700' },
                            { label: 'C1–OH orientation', value: mode === 'cyclic' ? (anomer === 'alpha' ? 'below ring (α)' : 'above ring (β)') : '—', tint: 'bg-amber-50', fg: 'text-amber-700' },
                            { label: 'Equilibrium (water)', value: `α ${PCT_ALPHA}% · β ${PCT_BETA}%`, tint: 'bg-teal-50', fg: 'text-teal-700' },
                        ].map(r => (
                            <div key={r.label} className={`rounded-lg border border-slate-100 ${r.tint} px-3 py-2.5`}>
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{r.label}</div>
                                <div className={`mt-0.5 font-mono text-sm font-extrabold ${r.fg}`}>{r.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    ), [mode, anomer]);

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button onClick={() => setPaused(p => !p)} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50" title="Reset">
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
                <Hexagon size={18} className="text-emerald-600" />
                Glucose Conformations Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">View</div>
                    <div className="grid grid-cols-1 gap-2">
                        {([
                            { id: 'open', label: 'Open chain (Fischer)' },
                            { id: 'cyclic', label: 'Cyclic (Haworth, α/β)' },
                            { id: 'muta', label: 'Mutarotation' },
                        ] as Array<{ id: Mode; label: string }>).map(m => (
                            <button
                                key={m.id}
                                onClick={() => setMode(m.id)}
                                className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${mode === m.id ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-3">
                    {mode === 'cyclic' && (
                        <div>
                            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Anomer</div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setAnomer('alpha')}
                                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${anomer === 'alpha' ? 'border-amber-500 bg-amber-500 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                                    α (C1–OH down)
                                </button>
                                <button onClick={() => setAnomer('beta')}
                                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${anomer === 'beta' ? 'border-teal-500 bg-teal-500 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                                    β (C1–OH up)
                                </button>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setShowLabels(v => !v)}
                        className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition ${showLabels ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                        {showLabels ? 'Hide atom labels' : 'Show atom labels'}
                    </button>
                    <div>
                        <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                            <span>Animation speed</span><span className="font-mono text-slate-700">{speed.toFixed(1)}×</span>
                        </div>
                        <input className="w-full accent-emerald-600" type="range" min={0.2} max={2.5} step={0.1} value={speed} onChange={e => setSpeed(Number(e.target.value))} />
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
            controlsAreaFlex="0 0 220px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default GlucoseConformationsLab;
