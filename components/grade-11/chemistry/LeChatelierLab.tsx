import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, RotateCcw, FlaskConical, Beaker, Droplet } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

/* ───────── Equilibrium solver ─────────────────────────────────────────────
   Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺,  Kc = x / ((F−x)(S−x))
   Quadratic: Kc·x² − (Kc·F + Kc·S + 1)·x + Kc·F·S = 0
─────────────────────────────────────────────────────────────────────────── */
const Kc = 200;

function solveEquilibrium(totalFe: number, totalSCN: number) {
    const F = Math.max(0, totalFe);
    const S = Math.max(0, totalSCN);
    const a = Kc;
    const b = -(Kc * F + Kc * S + 1);
    const c = Kc * F * S;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return { fe: F, scn: S, product: 0 };
    const x1 = (-b - Math.sqrt(disc)) / (2 * a);
    const x2 = (-b + Math.sqrt(disc)) / (2 * a);
    const maxX = Math.min(F, S);
    let x = x1;
    if (x < 0 || x > maxX) x = x2;
    if (x < 0 || x > maxX) x = 0;
    return { fe: F - x, scn: S - x, product: x };
}

/* ───────── Component ─────────────────────────────────────────────────── */
interface Props {
    topic: Topic;
    onExit: () => void;
}

const CANVAS_W = 1280;
const CANVAS_H = 760;

interface Particle { x: number; y: number; vx: number; vy: number; type: 'fe' | 'scn' | 'product'; r: number; }

const LeChatelierLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    const lastTimeRef = useRef<number>(performance.now());

    const [totalFe, setTotalFe] = useState(0.005);
    const [totalSCN, setTotalSCN] = useState(0.005);
    const [paused, setPaused] = useState(false);

    // Animated (eased) concentrations
    const [fe, setFe] = useState(0);
    const [scn, setScn] = useState(0);
    const [product, setProduct] = useState(0);
    const [message, setMessage] = useState('System at equilibrium. Add a reagent to disturb it.');
    const [lastAction, setLastAction] = useState<string | null>(null);
    const [flash, setFlash] = useState<{ id: string; t: number } | null>(null);

    const eqTarget = useMemo(() => solveEquilibrium(totalFe, totalSCN), [totalFe, totalSCN]);

    // Refs the render loop reads — keeps the canvas useEffect stable (no teardown per frame)
    const feRef = useRef(0);
    const scnRef = useRef(0);
    const productRef = useRef(0);
    const pausedRef = useRef(false);
    const messageRef = useRef('System at equilibrium. Add a reagent to disturb it.');
    const lastActionRef = useRef<string | null>(null);
    const flashRef = useRef<{ id: string; t: number } | null>(null);

    useEffect(() => { feRef.current = fe; }, [fe]);
    useEffect(() => { scnRef.current = scn; }, [scn]);
    useEffect(() => { productRef.current = product; }, [product]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);
    useEffect(() => { messageRef.current = message; }, [message]);
    useEffect(() => { lastActionRef.current = lastAction; }, [lastAction]);
    useEffect(() => { flashRef.current = flash; }, [flash]);

    // Tween toward equilibrium target — runs in its own RAF loop, writes state once per frame
    const tweenStartRef = useRef<number>(0);
    const fromRef = useRef({ fe: 0, scn: 0, product: 0 });
    const toRef = useRef({ fe: 0, scn: 0, product: 0 });
    const tweeningRef = useRef(false);
    const tweenRafRef = useRef<number>(0);

    useEffect(() => {
        // Baseline equilibrium on mount
        const eq = solveEquilibrium(0.005, 0.005);
        feRef.current = eq.fe; scnRef.current = eq.scn; productRef.current = eq.product;
        setFe(eq.fe); setScn(eq.scn); setProduct(eq.product);
    }, []);

    useEffect(() => {
        fromRef.current = { fe: feRef.current, scn: scnRef.current, product: productRef.current };
        toRef.current = eqTarget;
        tweenStartRef.current = performance.now();
        tweeningRef.current = true;
        const tick = (now: number) => {
            if (!tweeningRef.current) return;
            const t = Math.min(1, (now - tweenStartRef.current) / 1800);
            const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            const f = fromRef.current, to = toRef.current;
            const nf = f.fe + (to.fe - f.fe) * ease;
            const ns = f.scn + (to.scn - f.scn) * ease;
            const np = f.product + (to.product - f.product) * ease;
            feRef.current = nf; scnRef.current = ns; productRef.current = np;
            setFe(nf); setScn(ns); setProduct(np);
            if (t < 1) tweenRafRef.current = requestAnimationFrame(tick);
            else tweeningRef.current = false;
        };
        tweenRafRef.current = requestAnimationFrame(tick);
        return () => { tweeningRef.current = false; cancelAnimationFrame(tweenRafRef.current); };
    }, [eqTarget]);

    const Qc = (fe > 1e-8 && scn > 1e-8) ? product / (fe * scn) : 0;
    const qcStatus: 'equilibrium' | 'forward' | 'backward' = Math.abs(Qc - Kc) < 5 ? 'equilibrium' : Qc < Kc ? 'forward' : 'backward';

    // (Solution colour & name are computed inside the canvas render via liveColour())

    /* ──── Reagent actions ──── */
    const triggerFlash = (id: string) => setFlash({ id, t: performance.now() });
    const addFe = () => { triggerFlash('fe'); setLastAction('fe'); setTotalFe(p => p + 0.003); setMessage('Fe(NO₃)₃ added — Fe³⁺ ↑ → Q꜀ < K꜀ → shifts FORWARD → solution deepens red.'); };
    const addSCN = () => { triggerFlash('scn'); setLastAction('scn'); setTotalSCN(p => p + 0.003); setMessage('KSCN added — SCN⁻ ↑ → Q꜀ < K꜀ → shifts FORWARD → solution deepens red.'); };
    const removeFe = () => { triggerFlash('oxalic'); setLastAction('oxalic'); setTotalFe(p => Math.max(0.001, p - 0.003)); setMessage('Oxalic acid added — binds Fe³⁺ → Q꜀ > K꜀ → shifts BACKWARD → colour fades toward yellow.'); };
    const removeSCN = () => { triggerFlash('hgcl'); setLastAction('hgcl'); setTotalSCN(p => Math.max(0.001, p - 0.003)); setMessage('HgCl₂ added — binds SCN⁻ → Q꜀ > K꜀ → shifts BACKWARD → colour fades toward yellow.'); };
    const handleReset = () => { setTotalFe(0.005); setTotalSCN(0.005); setLastAction(null); setFlash(null); setMessage('System reset to baseline equilibrium.'); };

    /* ──── Canvas particles ──── */
    const FLASK_CX = 540;
    const FLASK_CY = 440;
    const FLASK_BODY_R = 180;          // body radius
    const FLASK_NECK_W = 80;
    const FLASK_NECK_H = 110;
    const LIQUID_TOP_Y = FLASK_CY - FLASK_BODY_R * 0.55;
    const LIQUID_BOTTOM_Y = FLASK_CY + FLASK_BODY_R * 0.9;

    // Maintain particle pool sized to current concentrations
    useEffect(() => {
        const wantFe = Math.max(2, Math.round(fe * 3500));
        const wantScn = Math.max(2, Math.round(scn * 3500));
        const wantProd = Math.max(0, Math.round(product * 3500));
        const pool = particlesRef.current;
        const count = (t: 'fe' | 'scn' | 'product') => pool.filter(p => p.type === t).length;
        const spawn = (t: 'fe' | 'scn' | 'product', n: number) => {
            for (let i = 0; i < n; i++) {
                const angle = Math.random() * Math.PI * 2;
                const rad = Math.random() * (FLASK_BODY_R - 24);
                pool.push({
                    x: FLASK_CX + Math.cos(angle) * rad,
                    y: FLASK_CY + Math.sin(angle) * rad * 0.85,
                    vx: (Math.random() - 0.5) * 40,
                    vy: (Math.random() - 0.5) * 40,
                    type: t,
                    r: t === 'product' ? 5 : 4,
                });
            }
        };
        const trim = (t: 'fe' | 'scn' | 'product', n: number) => {
            let removed = 0;
            for (let i = pool.length - 1; i >= 0 && removed < n; i--) {
                if (pool[i].type === t) { pool.splice(i, 1); removed++; }
            }
        };
        const dFe = wantFe - count('fe'); if (dFe > 0) spawn('fe', dFe); else if (dFe < 0) trim('fe', -dFe);
        const dSc = wantScn - count('scn'); if (dSc > 0) spawn('scn', dSc); else if (dSc < 0) trim('scn', -dSc);
        const dPr = wantProd - count('product'); if (dPr > 0) spawn('product', dPr); else if (dPr < 0) trim('product', -dPr);
    }, [fe, scn, product]);

    /* ──── Render loop — runs once, reads refs ──── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;

        const render = (time: number) => {
            const rawDt = (time - lastTimeRef.current) / 1000;
            const dt = pausedRef.current ? 0 : Math.min(rawDt, 0.1);
            lastTimeRef.current = time;
            drawScene(ctx, dt, time);
            animRef.current = requestAnimationFrame(render);
        };

        animRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Computes the live colour fields from the current productRef value
    const liveColour = () => {
        const p = productRef.current;
        const pR = Math.min(1, p / 0.012);
        const r = Math.round(255 - pR * 40);
        const g = Math.round(230 - pR * 200);
        const b = Math.round(160 - pR * 140);
        const name = pR < 0.15 ? 'Pale Yellow' : pR < 0.35 ? 'Light Orange' : pR < 0.55 ? 'Orange' : pR < 0.75 ? 'Reddish Orange' : 'Deep Blood Red';
        return { r, g, b, pR, name, css: `rgb(${r}, ${g}, ${b})` };
    };

    const drawScene = (ctx: CanvasRenderingContext2D, dt: number, time: number) => {
        const col = liveColour();
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Subtle grid
        ctx.strokeStyle = 'rgba(15,23,42,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
        for (let y = 0; y <= CANVAS_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

        drawFlask(ctx, col);
        updateAndDrawParticles(ctx, dt);
        drawReagentRow(ctx, time);
        drawLegend(ctx);
        drawTitle(ctx);
        drawHint(ctx);
    };

    const drawFlask = (ctx: CanvasRenderingContext2D, col: { r: number; g: number; b: number; pR: number; name: string; css: string }) => {
        // Neck
        const neckX = FLASK_CX - FLASK_NECK_W / 2;
        const neckY = FLASK_CY - FLASK_BODY_R - FLASK_NECK_H + 20;
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(neckX, neckY);
        ctx.lineTo(neckX, neckY + FLASK_NECK_H);
        ctx.lineTo(neckX + FLASK_NECK_W, neckY + FLASK_NECK_H);
        ctx.lineTo(neckX + FLASK_NECK_W, neckY);
        ctx.stroke();
        // Opening rim
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.ellipse(FLASK_CX, neckY, FLASK_NECK_W / 2 + 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Body outline
        ctx.beginPath();
        ctx.moveTo(neckX, neckY + FLASK_NECK_H);
        ctx.lineTo(neckX - 30, FLASK_CY - FLASK_BODY_R + 30);
        ctx.arc(FLASK_CX, FLASK_CY, FLASK_BODY_R, Math.PI * 1.1, Math.PI * 1.9, true);
        // Smooth body — instead use ellipse
        ctx.closePath();
        // Reset for clean body
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(FLASK_CX, FLASK_CY, FLASK_BODY_R, FLASK_BODY_R * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Liquid (clipped to body ellipse)
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(FLASK_CX, FLASK_CY, FLASK_BODY_R - 4, FLASK_BODY_R * 0.95 - 4, 0, 0, Math.PI * 2);
        ctx.clip();
        const grad = ctx.createLinearGradient(FLASK_CX, LIQUID_TOP_Y, FLASK_CX, LIQUID_BOTTOM_Y);
        grad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, 0.65)`);
        grad.addColorStop(1, `rgba(${col.r}, ${col.g}, ${col.b}, 0.95)`);
        ctx.fillStyle = grad;
        ctx.fillRect(FLASK_CX - FLASK_BODY_R, LIQUID_TOP_Y, FLASK_BODY_R * 2, LIQUID_BOTTOM_Y - LIQUID_TOP_Y + 10);
        // Meniscus
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, 0.95)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(FLASK_CX, LIQUID_TOP_Y, FLASK_BODY_R - 4, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(FLASK_CX - FLASK_BODY_R * 0.55, FLASK_CY - 30, 60, Math.PI * 0.85, Math.PI * 1.15);
        ctx.stroke();

        // Colour swatch + name below flask
        const swatchY = FLASK_CY + FLASK_BODY_R + 26;
        ctx.fillStyle = col.css;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(FLASK_CX - 84, swatchY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 17px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(col.name, FLASK_CX - 60, swatchY + 6);
        ctx.font = '500 13px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`[Fe(SCN)²⁺] = ${(productRef.current * 1000).toFixed(2)} mM`, FLASK_CX - 60, swatchY + 26);
    };

    const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, dt: number) => {
        const pool = particlesRef.current;
        const left = FLASK_CX - FLASK_BODY_R + 14;
        const right = FLASK_CX + FLASK_BODY_R - 14;
        const top = LIQUID_TOP_Y + 8;
        const bot = LIQUID_BOTTOM_Y - 10;

        // Clip particles to liquid region (body ellipse)
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(FLASK_CX, FLASK_CY, FLASK_BODY_R - 6, FLASK_BODY_R * 0.95 - 6, 0, 0, Math.PI * 2);
        ctx.clip();

        for (const p of pool) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            // Mild jitter
            p.vx += (Math.random() - 0.5) * 12;
            p.vy += (Math.random() - 0.5) * 12;
            // Damping
            p.vx *= 0.97; p.vy *= 0.97;
            // Soft bounds
            if (p.x < left) { p.x = left; p.vx = Math.abs(p.vx); }
            if (p.x > right) { p.x = right; p.vx = -Math.abs(p.vx); }
            if (p.y < top) { p.y = top; p.vy = Math.abs(p.vy); }
            if (p.y > bot) { p.y = bot; p.vy = -Math.abs(p.vy); }

            ctx.save();
            if (p.type === 'product') {
                ctx.shadowColor = '#dc2626';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r + 1, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'fe') {
                // Fe³⁺: bright yellow core with dark amber ring — visible against pale-yellow solution
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r + 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#854d0e';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            } else {
                // SCN⁻: dark slate dot
                ctx.fillStyle = '#334155';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        ctx.restore();
    };

    const drawReagentRow = (ctx: CanvasRenderingContext2D, time: number) => {
        // Four reagent indicators on canvas — visual only; clickable buttons are in controls
        const baseY = 130;
        const reagents = [
            { id: 'fe', label: 'Fe(NO₃)₃', sub: '↑ Fe³⁺', color: '#eab308' },
            { id: 'scn', label: 'KSCN', sub: '↑ SCN⁻', color: '#475569' },
            { id: 'oxalic', label: 'Oxalic acid', sub: '↓ Fe³⁺', color: '#a855f7' },
            { id: 'hgcl', label: 'HgCl₂', sub: '↓ SCN⁻', color: '#06b6d4' },
        ];
        const startX = 940;
        const spacing = 64;
        ctx.textAlign = 'center';
        reagents.forEach((r, i) => {
            const x = startX + i * spacing;
            const y = baseY;
            const active = lastActionRef.current === r.id;
            // Bottle
            ctx.fillStyle = r.color + '20';
            ctx.strokeStyle = r.color;
            ctx.lineWidth = active ? 3 : 1.8;
            ctx.beginPath();
            ctx.rect(x - 16, y - 6, 32, 46);
            ctx.fill();
            ctx.stroke();
            // Neck
            ctx.fillStyle = r.color;
            ctx.fillRect(x - 5, y - 16, 10, 10);
            // Label
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 11px Inter, sans-serif';
            ctx.fillText(r.label, x, y + 60);
            ctx.fillStyle = r.color;
            ctx.font = '600 10px Inter, sans-serif';
            ctx.fillText(r.sub, x, y + 74);

            // Active drop travels along a curve from the bottle nozzle to the flask opening
            const fl = flashRef.current;
            if (active && fl && fl.id === r.id) {
                const elapsed = (time - fl.t) / 1000;
                const DUR = 1.0;
                // Start of arc: bottom of bottle (where the liquid exits)
                const x0 = x;
                const y0 = y + 42;
                // End of arc: just inside the flask opening (top of liquid surface)
                const x1 = FLASK_CX;
                const y1 = LIQUID_TOP_Y + 4;
                if (elapsed < DUR) {
                    const prog = elapsed / DUR;
                    // Parabolic arc — bottle to flask, curving outward (over the top)
                    const px = x0 + (x1 - x0) * prog;
                    // Vertical motion eases in (gravity); add upward arc bump
                    const arcBump = -60 * Math.sin(Math.PI * prog);
                    const py = y0 + (y1 - y0) * prog * prog + arcBump;
                    // Trail (3 fading droplets behind the head)
                    for (let s = 0; s < 4; s++) {
                        const tProg = Math.max(0, prog - s * 0.05);
                        const tx = x0 + (x1 - x0) * tProg;
                        const ty = y0 + (y1 - y0) * tProg * tProg + (-60 * Math.sin(Math.PI * tProg));
                        ctx.fillStyle = r.color;
                        ctx.globalAlpha = (1 - s * 0.25) * (1 - prog * 0.3);
                        ctx.beginPath();
                        ctx.arc(tx, ty, 4 - s * 0.6, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.globalAlpha = 1;
                    // Head droplet — pulsing
                    ctx.save();
                    ctx.shadowColor = r.color;
                    ctx.shadowBlur = 12;
                    ctx.fillStyle = r.color;
                    ctx.beginPath();
                    ctx.arc(px, py, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } else if (elapsed < DUR + 0.45) {
                    // Splash ripple at flask opening
                    const rp = (elapsed - DUR) / 0.45;
                    ctx.strokeStyle = r.color;
                    ctx.lineWidth = 2 * (1 - rp);
                    ctx.globalAlpha = 1 - rp;
                    ctx.beginPath();
                    ctx.ellipse(x1, y1, 6 + rp * 28, 2 + rp * 6, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        });
    };

    const drawLegend = (ctx: CanvasRenderingContext2D) => {
        const items = [
            { color: '#eab308', label: 'Fe³⁺ (yellow)' },
            { color: '#475569', label: 'SCN⁻ (colourless)' },
            { color: '#dc2626', label: '[Fe(SCN)]²⁺ (deep red)' },
        ];
        const x0 = 80; const y0 = 690;
        ctx.font = '600 13px Inter, sans-serif';
        ctx.textAlign = 'left';
        items.forEach((it, i) => {
            const x = x0 + i * 220;
            ctx.fillStyle = it.color;
            ctx.beginPath();
            ctx.arc(x, y0, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#334155';
            ctx.fillText(it.label, x + 14, y0 + 5);
        });
    };

    const drawTitle = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 22px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Iron(III)–Thiocyanate Equilibrium', 60, 60);
        ctx.fillStyle = '#475569';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.fillText('Fe³⁺(aq) + SCN⁻(aq) ⇌ [Fe(SCN)]²⁺(aq)   (NCERT Eq. 6.24)', 60, 84);
    };

    const drawHint = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(messageRef.current, CANVAS_W / 2, 735);
    };

    /* ───── Left aside: graph cards ────────────────────────────────────── */
    const maxBar = 0.015;
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
                {/* Qc vs Kc card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-950">Q꜀ vs K꜀</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">Comparing the reaction quotient to the constant predicts the shift.</div>
                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 font-mono text-xs text-slate-700">
                        Q꜀ = [FeSCN²⁺] / ([Fe³⁺]·[SCN⁻])
                    </div>
                    <div className="mt-3 grid grid-cols-3 items-end gap-2">
                        <div className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-2 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Q꜀</div>
                            <div className={`mt-0.5 font-mono text-lg font-extrabold ${qcStatus === 'equilibrium' ? 'text-emerald-700' : qcStatus === 'forward' ? 'text-amber-700' : 'text-blue-700'}`}>{Qc.toFixed(0)}</div>
                        </div>
                        <div className="flex items-center justify-center pb-1">
                            <span className={`text-2xl font-extrabold ${qcStatus === 'equilibrium' ? 'text-emerald-600' : qcStatus === 'forward' ? 'text-amber-600' : 'text-blue-600'}`}>
                                {qcStatus === 'equilibrium' ? '=' : qcStatus === 'forward' ? '<' : '>'}
                            </span>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-2 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">K꜀ (fixed)</div>
                            <div className="mt-0.5 font-mono text-lg font-extrabold text-emerald-700">{Kc}</div>
                        </div>
                    </div>
                    <div className={`mt-3 rounded-lg px-3 py-2 text-center text-xs font-extrabold ${qcStatus === 'equilibrium' ? 'bg-emerald-100 text-emerald-800' : qcStatus === 'forward' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {qcStatus === 'equilibrium' ? 'At equilibrium — no net shift' : qcStatus === 'forward' ? '→ Shifting forward (making product)' : '← Shifting backward (consuming product)'}
                    </div>
                </div>

                {/* Concentrations bar card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-950">Concentrations</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">Live species concentrations in the flask.</div>
                    <div className="mt-3 space-y-2.5">
                        <ConcBar label="Fe³⁺" value={fe} max={maxBar} color="#eab308" />
                        <ConcBar label="SCN⁻" value={scn} max={maxBar} color="#475569" />
                        <ConcBar label="[Fe(SCN)]²⁺" value={product} max={maxBar} color="#dc2626" />
                    </div>
                </div>
            </div>
        </aside>
    );

    /* ───── Right aside: theory + live values ──────────────────────────── */
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">Le Chatelier's Principle</div>
                    <div className="mt-0.5 text-xs font-semibold text-amber-700">NCERT §6.8.1</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-amber-900">
                        <p>A change in concentration shifts equilibrium so as to counteract the change.</p>
                        <p>• Adding a reactant or removing a product → Q꜀ &lt; K꜀ → forward shift.</p>
                        <p>• Removing a reactant or adding a product → Q꜀ &gt; K꜀ → reverse shift.</p>
                        <p>Oxalic acid binds Fe³⁺ as [Fe(C₂O₄)₃]³⁻; HgCl₂ binds SCN⁻ as [Hg(SCN)₄]²⁻.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <ValueChip label="[Fe³⁺]" value={`${(fe * 1000).toFixed(2)} mM`} tone="amber" />
                        <ValueChip label="[SCN⁻]" value={`${(scn * 1000).toFixed(2)} mM`} tone="slate" />
                        <ValueChip label="[FeSCN²⁺]" value={`${(product * 1000).toFixed(2)} mM`} tone="red" />
                        <ValueChip label="Q꜀" value={Qc.toFixed(0)} tone={qcStatus === 'equilibrium' ? 'emerald' : qcStatus === 'forward' ? 'amber' : 'blue'} />
                        <ValueChip label="K꜀" value={`${Kc}`} tone="emerald" />
                        <ValueChip label="Shift" value={qcStatus === 'equilibrium' ? '— none —' : qcStatus === 'forward' ? '→ forward' : '← reverse'} tone={qcStatus === 'equilibrium' ? 'emerald' : qcStatus === 'forward' ? 'amber' : 'blue'} />
                    </div>
                </div>
            </div>
        </aside>
    );

    /* ───── Simulation wrapper ───────────────────────────────────────── */
    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    className="absolute inset-0 h-full w-full"
                />
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={() => setPaused(p => !p)}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title={paused ? 'Play' : 'Pause'}
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
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

    /* ───── Bottom controls: reagent buttons + initial sliders ─────────── */
    const controlsCombo = (
        <div className="w-full p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
                <FlaskConical size={18} className="text-amber-600" />
                <span className="text-sm font-extrabold uppercase tracking-wide">Le Chatelier Equilibrium Bench</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-amber-800">Forward shift — add reactant</div>
                    <div className="grid grid-cols-2 gap-2">
                        <ReagentButton icon={<Droplet size={14} />} label="Fe(NO₃)₃" sub="↑ [Fe³⁺]" onClick={addFe} color="amber" />
                        <ReagentButton icon={<Droplet size={14} />} label="KSCN" sub="↑ [SCN⁻]" onClick={addSCN} color="slate" />
                    </div>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-blue-800">Reverse shift — remove reactant</div>
                    <div className="grid grid-cols-2 gap-2">
                        <ReagentButton icon={<Beaker size={14} />} label="Oxalic acid" sub="↓ [Fe³⁺]" onClick={removeFe} color="violet" />
                        <ReagentButton icon={<Beaker size={14} />} label="HgCl₂" sub="↓ [SCN⁻]" onClick={removeSCN} color="cyan" />
                    </div>
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <SliderRow label="Initial [Fe³⁺]" value={`${(totalFe * 1000).toFixed(1)} mM`} min={0.001} max={0.015} step={0.0005} current={totalFe} onChange={setTotalFe} accent="accent-amber-500" />
                <SliderRow label="Initial [SCN⁻]" value={`${(totalSCN * 1000).toFixed(1)} mM`} min={0.001} max={0.015} step={0.0005} current={totalSCN} onChange={setTotalSCN} accent="accent-slate-500" />
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

/* ───── Sub-components ───────────────────────────────────────────────── */

function ConcBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span style={{ color }}>{label}</span>
                <span className="font-mono text-slate-700">{(value * 1000).toFixed(2)} mM</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

function ValueChip({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'slate' | 'red' | 'emerald' | 'blue' }) {
    const palette: Record<string, { bg: string; text: string }> = {
        amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
        slate: { bg: 'bg-slate-50', text: 'text-slate-800' },
        red: { bg: 'bg-red-50', text: 'text-red-700' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
    };
    const p = palette[tone];
    return (
        <div className={`rounded-lg border border-slate-100 ${p.bg} px-3 py-2.5`}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className={`mt-1 font-mono text-sm font-extrabold ${p.text}`}>{value}</div>
        </div>
    );
}

function ReagentButton({ icon, label, sub, onClick, color }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void; color: 'amber' | 'slate' | 'violet' | 'cyan' }) {
    const palette: Record<string, string> = {
        amber: 'border-amber-300 bg-white text-amber-800 hover:bg-amber-100',
        slate: 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100',
        violet: 'border-violet-300 bg-white text-violet-800 hover:bg-violet-100',
        cyan: 'border-cyan-300 bg-white text-cyan-800 hover:bg-cyan-100',
    };
    return (
        <button onClick={onClick} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-extrabold transition-all active:scale-95 ${palette[color]}`}>
            <span className="flex items-center gap-2">{icon}{label}</span>
            <span className="font-mono text-[11px] font-bold opacity-80">{sub}</span>
        </button>
    );
}

function SliderRow({ label, value, min, max, step, current, onChange, accent }: { label: string; value: string; min: number; max: number; step: number; current: number; onChange: (v: number) => void; accent: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">{label}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">{value}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={current} onChange={(e) => onChange(Number(e.target.value))} className={`h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 ${accent}`} />
        </div>
    );
}

export default LeChatelierLab;
