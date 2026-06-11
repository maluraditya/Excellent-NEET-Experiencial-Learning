import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Flame, ArrowRight, Scale, FlaskConical, CheckCircle2, AlertTriangle, Calculator } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

/*
 *  Liebig combustion — NCERT §8.10.1 (Class 11 Chemistry, Unit 8)
 *  CₓHᵧ + (x + y/4) O₂  ⟶  x CO₂ + (y/2) H₂O
 *  %C = 12·m₂·100 / (44·m)        %H = 2·m₁·100 / (18·m)        %O = 100 − %C − %H
 *  Apparatus (Fig 8.14): O₂ → combustion tube w/ sample-boat + CuO pellets → anhyd CaCl₂ U-tube → KOH U-tube → vent
 *  CRITICAL ORDER: CaCl₂ MUST come first; KOH absorbs both CO₂ and H₂O, so any water reaching KOH inflates %C.
 *
 *  Sample: 0.5000 g of unknown — actually ethanol C₂H₆O (52.17% C, 13.04% H, 34.78% O).
 */

interface Props { topic: Topic; onExit: () => void; }
type Phase = 1 | 2 | 3 | 4;
const CANVAS_W = 1280;
const CANVAS_H = 760;

const SAMPLE_MASS = 0.5000;
const TRUE_PERCENT_C = 52.17;
const TRUE_PERCENT_H = 13.04;
const MASS_CO2 = +(TRUE_PERCENT_C / 100 * SAMPLE_MASS * 44 / 12).toFixed(4); // ≈ 0.9565
const MASS_H2O = +(TRUE_PERCENT_H / 100 * SAMPLE_MASS * 18 / 2).toFixed(4);  // ≈ 0.5868
const TUBE_CACL2_INITIAL = 45.3200;
const TUBE_KOH_INITIAL = 62.1500;
const TUBE_CACL2_FINAL = +(TUBE_CACL2_INITIAL + MASS_H2O).toFixed(4);
const TUBE_KOH_FINAL = +(TUBE_KOH_INITIAL + MASS_CO2).toFixed(4);
const DELTA_CACL2 = +(TUBE_CACL2_FINAL - TUBE_CACL2_INITIAL).toFixed(4);
const DELTA_KOH = +(TUBE_KOH_FINAL - TUBE_KOH_INITIAL).toFixed(4);
const PERCENT_H = +(2 / 18 * DELTA_CACL2 / SAMPLE_MASS * 100).toFixed(2);
const PERCENT_C = +(12 / 44 * DELTA_KOH / SAMPLE_MASS * 100).toFixed(2);
const PERCENT_O = +(100 - PERCENT_C - PERCENT_H).toFixed(2);

const QuantitativeAnalysisCanvas: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(performance.now());
    const phaseStartRef = useRef<number>(performance.now());

    const [phase, setPhase] = useState<Phase>(1);
    const [paused, setPaused] = useState(false);

    // Phase 1 — assembly
    const [tube1Weighed, setTube1Weighed] = useState(false);
    const [tube2Weighed, setTube2Weighed] = useState(false);
    const [assemblyOrder, setAssemblyOrder] = useState<('cacl2' | 'koh')[]>([]);
    const [assemblyError, setAssemblyError] = useState(false);
    const [assemblyCorrect, setAssemblyCorrect] = useState(false);

    // Phase 2 — combustion
    const [combustionStarted, setCombustionStarted] = useState(false);
    const [combustionProgress, setCombustionProgress] = useState(0);
    const [combustionComplete, setCombustionComplete] = useState(false);

    // Phase 3 — final weighing
    const [tube1FinalWeighed, setTube1FinalWeighed] = useState(false);
    const [tube2FinalWeighed, setTube2FinalWeighed] = useState(false);

    // Phase 4 — calculation
    const [calcStep, setCalcStep] = useState(0);

    const [message, setMessage] = useState('Phase 1: weigh both empty U-tubes, then assemble combustion → CaCl₂ → KOH.');

    const handleReset = () => {
        setPhase(1);
        setTube1Weighed(false); setTube2Weighed(false);
        setAssemblyOrder([]); setAssemblyError(false); setAssemblyCorrect(false);
        setCombustionStarted(false); setCombustionProgress(0); setCombustionComplete(false);
        setTube1FinalWeighed(false); setTube2FinalWeighed(false);
        setCalcStep(0);
        setMessage('Reset. Phase 1: weigh both empty U-tubes, then assemble combustion → CaCl₂ → KOH.');
        phaseStartRef.current = performance.now();
        if (weighStartRef.current) weighStartRef.current = { cacl2: 0, koh: 0, cacl2Final: 0, kohFinal: 0 };
        if (slotFillRef.current) slotFillRef.current = { slot1: 0, slot2: 0 };
        if (calcStepTimeRef.current) calcStepTimeRef.current = [0, 0, 0, 0, 0];
    };

    // Refs that the canvas reads (keeps render loop stable)
    const stateRef = useRef({ phase, tube1Weighed, tube2Weighed, assemblyOrder, assemblyError, assemblyCorrect, combustionStarted, combustionProgress, combustionComplete, tube1FinalWeighed, tube2FinalWeighed, calcStep, paused, message });
    useEffect(() => { stateRef.current = { phase, tube1Weighed, tube2Weighed, assemblyOrder, assemblyError, assemblyCorrect, combustionStarted, combustionProgress, combustionComplete, tube1FinalWeighed, tube2FinalWeighed, calcStep, paused, message }; });

    // Animation timestamps for slide-in and digit-count effects
    const weighStartRef = useRef<{ cacl2: number; koh: number; cacl2Final: number; kohFinal: number }>({ cacl2: 0, koh: 0, cacl2Final: 0, kohFinal: 0 });
    const slotFillRef = useRef<{ slot1: number; slot2: number }>({ slot1: 0, slot2: 0 });
    const calcStepTimeRef = useRef<number[]>([0, 0, 0, 0, 0]);
    useEffect(() => { if (tube1Weighed && !weighStartRef.current.cacl2) weighStartRef.current.cacl2 = performance.now(); }, [tube1Weighed]);
    useEffect(() => { if (tube2Weighed && !weighStartRef.current.koh) weighStartRef.current.koh = performance.now(); }, [tube2Weighed]);
    useEffect(() => { if (tube1FinalWeighed && !weighStartRef.current.cacl2Final) weighStartRef.current.cacl2Final = performance.now(); }, [tube1FinalWeighed]);
    useEffect(() => { if (tube2FinalWeighed && !weighStartRef.current.kohFinal) weighStartRef.current.kohFinal = performance.now(); }, [tube2FinalWeighed]);
    useEffect(() => { if (assemblyOrder[0] && !slotFillRef.current.slot1) slotFillRef.current.slot1 = performance.now(); if (assemblyOrder[1] && !slotFillRef.current.slot2) slotFillRef.current.slot2 = performance.now(); }, [assemblyOrder]);
    useEffect(() => { if (calcStep > 0 && !calcStepTimeRef.current[calcStep]) calcStepTimeRef.current[calcStep] = performance.now(); }, [calcStep]);

    /* Phase 1 handlers */
    const handleWeighTube = (tube: 'cacl2' | 'koh') => {
        if (tube === 'cacl2') { setTube1Weighed(true); setMessage(`CaCl₂ tube empty mass: ${TUBE_CACL2_INITIAL.toFixed(4)} g recorded.`); }
        else { setTube2Weighed(true); setMessage(`KOH tube empty mass: ${TUBE_KOH_INITIAL.toFixed(4)} g recorded.`); }
    };
    const handleConnect = (tube: 'cacl2' | 'koh') => {
        if (assemblyCorrect || assemblyError) return;
        const next = [...assemblyOrder, tube];
        setAssemblyOrder(next);
        if (next.length === 1 && next[0] === 'koh') {
            setAssemblyError(true);
            setMessage('Wrong order! KOH absorbs BOTH CO₂ and H₂O. If placed first it would inflate %C. CaCl₂ must come first.');
        } else if (next.length === 1 && next[0] === 'cacl2') {
            setMessage('CaCl₂ connected — it selectively absorbs only water vapour. Now connect KOH.');
        } else if (next.length === 2 && next[0] === 'cacl2' && next[1] === 'koh') {
            setAssemblyCorrect(true);
            setMessage('Train assembled: combustion tube → CaCl₂ (traps H₂O) → KOH (traps CO₂) → vent. Ready to ignite.');
        }
    };
    const handleResetAssembly = () => { setAssemblyOrder([]); setAssemblyError(false); setMessage('Assembly reset. Connect CaCl₂ first, then KOH.'); };

    /* Phase 2 handlers */
    const handleIgnite = () => {
        setCombustionStarted(true);
        setMessage('Furnace ignited. O₂ flowing, CuO oxidising sample. H₂O → CaCl₂, CO₂ → KOH.');
        let p = 0;
        const id = window.setInterval(() => {
            p += 2; setCombustionProgress(p);
            if (p >= 100) { window.clearInterval(id); setCombustionComplete(true); setMessage('Combustion complete. All gases trapped. Proceed to final weighing.'); }
        }, 80);
    };

    /* Phase 3 handlers */
    const handleWeighFinal = (tube: 'cacl2' | 'koh') => {
        if (tube === 'cacl2') { setTube1FinalWeighed(true); setMessage(`CaCl₂ tube final: ${TUBE_CACL2_FINAL.toFixed(4)} g (Δm₁ = ${DELTA_CACL2.toFixed(4)} g of H₂O).`); }
        else { setTube2FinalWeighed(true); setMessage(`KOH tube final: ${TUBE_KOH_FINAL.toFixed(4)} g (Δm₂ = ${DELTA_KOH.toFixed(4)} g of CO₂).`); }
    };

    /* Phase 4 handlers */
    const handleCalcStep = () => {
        const next = calcStep + 1;
        setCalcStep(next);
        if (next === 1) setMessage(`%H = (2/18) × (${DELTA_CACL2.toFixed(4)}/${SAMPLE_MASS}) × 100 = ${PERCENT_H.toFixed(2)}%`);
        else if (next === 2) setMessage(`%C = (12/44) × (${DELTA_KOH.toFixed(4)}/${SAMPLE_MASS}) × 100 = ${PERCENT_C.toFixed(2)}%`);
        else if (next === 3) setMessage(`%O = 100 − %C − %H = ${PERCENT_O.toFixed(2)}% (by difference, NCERT §8.10.6).`);
        else if (next === 4) setMessage('Mole ratio C : H : O = 2 : 6 : 1 → empirical formula C₂H₆O (ethanol).');
    };

    /* ─── Canvas render loop ─────────────────────────────────── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        const render = (time: number) => {
            const rawDt = (time - lastTimeRef.current) / 1000;
            const dt = stateRef.current.paused ? 0 : Math.min(rawDt, 0.1);
            lastTimeRef.current = time;
            drawScene(ctx, dt, time);
            animRef.current = requestAnimationFrame(render);
        };
        animRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    useEffect(() => { phaseStartRef.current = performance.now(); }, [phase]);

    const drawScene = (ctx: CanvasRenderingContext2D, _dt: number, time: number) => {
        const s = stateRef.current;
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.strokeStyle = 'rgba(15,23,42,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
        for (let y = 0; y <= CANVAS_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

        drawTitle(ctx, s.phase);
        if (s.phase === 1) drawPhase1(ctx, time, s);
        else if (s.phase === 2) drawPhase2(ctx, time, s);
        else if (s.phase === 3) drawPhase3(ctx, time, s);
        else drawPhase4(ctx, time, s);

        drawHint(ctx, s.message);
    };

    const drawTitle = (ctx: CanvasRenderingContext2D, ph: Phase) => {
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 22px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText("Liebig's Combustion Method", 60, 60);
        ctx.fillStyle = '#475569';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.fillText('NCERT §8.10.1 · Estimation of carbon and hydrogen', 60, 84);
        const phaseNames = ['', 'Phase 1 — Assembly', 'Phase 2 — Combustion', 'Phase 3 — Final weighing', 'Phase 4 — Calculation'];
        ctx.fillStyle = '#f59e0b';
        ctx.font = '800 16px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(phaseNames[ph], CANVAS_W - 60, 60);
    };

    const drawHint = (ctx: CanvasRenderingContext2D, msg: string) => {
        // Subtle hint bar with chip — sits in the safe zone (y=680–710) clear of the bottom info strip (y=605–651)
        const barY = 680;
        const barH = 32;
        ctx.fillStyle = '#fefce8';
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1;
        roundRectPath(ctx, 80, barY, 1120, barH, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#92400e';
        ctx.font = '800 10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('HINT', 100, barY + 21);
        ctx.fillStyle = '#475569';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillText(msg, 140, barY + 21);
    };

    const wrapText = (ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];
        for (const w of words) {
            const test = line ? line + ' ' + w : w;
            if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
            else line = test;
        }
        if (line) lines.push(line);
        const startY = cy - (lines.length - 1) * lineHeight;
        lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight));
    };

    /* ─── Phase 1 — weighing balance + animated train assembly ─── */
    const drawPhase1 = (ctx: CanvasRenderingContext2D, time: number, s: typeof stateRef.current) => {
        // ── Left column: balance ──
        drawAnalyticalBalance(ctx, 340, 340, time, s);

        // ── Right column: two stacked cards ──
        // Card A — train assembly (animated)
        drawInfoCard(ctx, 700, 110, 520, 240, 'Combustion train assembly', '#fef3c7', '#92400e');
        // Recorded masses inline (under header, two rows)
        let y = 158;
        drawWeightRow(ctx, 720, y, 'CaCl₂ tube (empty)', s.tube1Weighed ? `${TUBE_CACL2_INITIAL.toFixed(4)} g` : '— g', s.tube1Weighed); y += 30;
        drawWeightRow(ctx, 720, y, 'KOH tube (empty)', s.tube2Weighed ? `${TUBE_KOH_INITIAL.toFixed(4)} g` : '— g', s.tube2Weighed);

        // Animated train slots
        drawTrainStripAnimated(ctx, 720, 240, s.assemblyOrder, time);

        // Card B — why CaCl₂ first
        drawInfoCard(ctx, 700, 370, 520, 200, 'Why CaCl₂ must come first', '#fee2e2', '#7f1d1d');
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 13px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('KOH absorbs BOTH CO₂ and H₂O.', 720, 430);
        ctx.fillStyle = '#475569';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillText('• Place CaCl₂ first — it traps only the water vapour.', 720, 454);
        ctx.fillText('• KOH then catches only the carbon dioxide.', 720, 474);
        ctx.fillText('• Reversed: KOH would steal water → %C inflates.', 720, 494);

        // Mini cause-and-effect diagram inside card B
        const diagY = 525;
        drawTinyTube(ctx, 740, diagY, '#3b82f6', 'CaCl₂', '+H₂O');
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(778, diagY); ctx.lineTo(818, diagY); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(818, diagY); ctx.lineTo(810, diagY - 5); ctx.lineTo(810, diagY + 5); ctx.closePath(); ctx.fill();
        drawTinyTube(ctx, 856, diagY, '#ef4444', 'KOH', '+CO₂');
        ctx.fillStyle = '#16a34a';
        ctx.font = '800 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('✓ correct order', 920, diagY + 4);

        // Bottom strip — sample info (positioned so it doesn't collide with hint)
        drawBottomInfoStrip(ctx, [
            { label: 'Sample mass m', value: `${SAMPLE_MASS.toFixed(4)} g`, color: '#0f172a' },
            { label: 'Sample', value: 'Unknown CₓHᵧOᵤ', color: '#475569' },
            { label: 'Atmosphere', value: 'excess pure dry O₂', color: '#16a34a' },
        ]);
    };

    // Tiny stylised tube for inline diagrams
    const drawTinyTube = (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, name: string, sub: string) => {
        ctx.fillStyle = color + '33';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(cx - 18, cy - 14, 36, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '800 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, cx, cy);
        ctx.fillStyle = '#475569';
        ctx.font = '600 9px Inter, sans-serif';
        ctx.fillText(sub, cx, cy + 24);
    };

    /* ─── Phase 2 — full combustion train animated ─── */
    const drawPhase2 = (ctx: CanvasRenderingContext2D, time: number, s: typeof stateRef.current) => {
        drawCombustionTrain(ctx, time, s);

        drawInfoCard(ctx, 60, 440, 1160, 150, 'What is happening', '#fef3c7', '#92400e');
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 14px Inter, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('CₓHᵧ  +  (x + y/4) O₂   ⟶   x CO₂  +  (y/2) H₂O', 80, 495);
        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('Sample heated with CuO pellets in pure dry oxygen — all C → CO₂, all H → H₂O.', 80, 520);
        ctx.fillStyle = '#1d4ed8';
        ctx.font = '800 13px Inter, sans-serif';
        ctx.fillText('• Anhydrous CaCl₂ traps water vapour (blue particles)', 80, 545);
        ctx.fillStyle = '#dc2626';
        ctx.fillText('• KOH solution traps carbon dioxide (grey particles)', 80, 568);

        // Progress strip in bottom info-strip zone
        drawProgressBar(ctx, 200, 622, 880, 16, s.combustionProgress);
    };

    /* ─── Phase 3 — re-weigh tubes ─── */
    const drawPhase3 = (ctx: CanvasRenderingContext2D, time: number, s: typeof stateRef.current) => {
        drawAnalyticalBalance(ctx, 340, 340, time, s, true);

        drawInfoCard(ctx, 700, 110, 520, 480, 'Mass gained by each tube', '#dbeafe', '#1e3a8a');
        let y = 170;
        ctx.fillStyle = '#1f2937';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('The difference between final and initial', 720, y); y += 20;
        ctx.fillText('mass is the mass of trapped product.', 720, y); y += 32;

        drawWeightRow(ctx, 720, y, 'CaCl₂ tube (final)', s.tube1FinalWeighed ? `${TUBE_CACL2_FINAL.toFixed(4)} g` : '— g', s.tube1FinalWeighed); y += 30;
        drawWeightRow(ctx, 720, y, 'CaCl₂ tube (empty)', `${TUBE_CACL2_INITIAL.toFixed(4)} g`, true); y += 30;
        if (s.tube1FinalWeighed) {
            ctx.fillStyle = '#1d4ed8';
            ctx.font = '800 16px Inter, monospace';
            ctx.fillText(`Δm₁ (H₂O) = ${DELTA_CACL2.toFixed(4)} g`, 720, y);
        }
        y += 50;

        drawWeightRow(ctx, 720, y, 'KOH tube (final)', s.tube2FinalWeighed ? `${TUBE_KOH_FINAL.toFixed(4)} g` : '— g', s.tube2FinalWeighed); y += 30;
        drawWeightRow(ctx, 720, y, 'KOH tube (empty)', `${TUBE_KOH_INITIAL.toFixed(4)} g`, true); y += 30;
        if (s.tube2FinalWeighed) {
            ctx.fillStyle = '#dc2626';
            ctx.font = '800 16px Inter, monospace';
            ctx.fillText(`Δm₂ (CO₂) = ${DELTA_KOH.toFixed(4)} g`, 720, y);
        }

        drawBottomInfoStrip(ctx, [
            { label: 'm (sample)', value: `${SAMPLE_MASS.toFixed(4)} g`, color: '#0f172a' },
            { label: 'Δm₁ (H₂O)', value: s.tube1FinalWeighed ? `${DELTA_CACL2.toFixed(4)} g` : '—', color: '#1d4ed8' },
            { label: 'Δm₂ (CO₂)', value: s.tube2FinalWeighed ? `${DELTA_KOH.toFixed(4)} g` : '—', color: '#dc2626' },
        ]);
    };

    /* ─── Phase 4 — calculation ─── */
    const drawPhase4 = (ctx: CanvasRenderingContext2D, time: number, s: typeof stateRef.current) => {
        // Left — pie chart of composition (reveals as calc progresses)
        drawCompositionPie(ctx, 360, 350, 160, s.calcStep, time);

        // Right — NCERT formulas
        drawInfoCard(ctx, 700, 110, 520, 380, 'NCERT formulas (§8.10.1, §8.10.6)', '#fef3c7', '#92400e');
        let y = 170;
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 14px Inter, monospace';
        ctx.textAlign = 'left';

        drawCalcStepRow(ctx, 720, y, 1, s.calcStep, '%H = (2/18) × (Δm₁/m) × 100',
            `= (2/18) × (${DELTA_CACL2.toFixed(4)}/${SAMPLE_MASS}) × 100 = ${PERCENT_H.toFixed(2)}%`, '#1d4ed8');
        y += 76;
        drawCalcStepRow(ctx, 720, y, 2, s.calcStep, '%C = (12/44) × (Δm₂/m) × 100',
            `= (12/44) × (${DELTA_KOH.toFixed(4)}/${SAMPLE_MASS}) × 100 = ${PERCENT_C.toFixed(2)}%`, '#dc2626');
        y += 76;
        drawCalcStepRow(ctx, 720, y, 3, s.calcStep, '%O = 100 − %C − %H',
            `= 100 − ${PERCENT_C.toFixed(2)} − ${PERCENT_H.toFixed(2)} = ${PERCENT_O.toFixed(2)}%`, '#f59e0b');
        y += 76;
        drawCalcStepRow(ctx, 720, y, 4, s.calcStep, 'Mole ratio  C : H : O',
            `= ${(PERCENT_C / 12).toFixed(2)} : ${(PERCENT_H / 1).toFixed(2)} : ${(PERCENT_O / 16).toFixed(2)}  ≈  2 : 6 : 1`, '#16a34a');

        // Final empirical formula badge — animate scale-in
        if (s.calcStep >= 4) {
            const t = calcStepTimeRef.current[4] ? Math.min(1, (time - calcStepTimeRef.current[4]) / 600) : 1;
            const scale = 1 - Math.pow(1 - t, 3);
            ctx.save();
            ctx.shadowColor = '#16a34a';
            ctx.shadowBlur = 30 + 10 * Math.sin(time / 300);
            const bx = 220, by = 540, bw = 280, bh = 60;
            ctx.translate(bx + bw / 2, by + bh / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(bx + bw / 2), -(by + bh / 2));
            ctx.fillStyle = '#dcfce7';
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(bx + 16, by);
            ctx.lineTo(bx + bw - 16, by);
            ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + 16);
            ctx.lineTo(bx + bw, by + bh - 16);
            ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - 16, by + bh);
            ctx.lineTo(bx + 16, by + bh);
            ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - 16);
            ctx.lineTo(bx, by + 16);
            ctx.quadraticCurveTo(bx, by, bx + 16, by);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            ctx.fillStyle = '#15803d';
            ctx.font = '700 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('EMPIRICAL FORMULA', bx + bw / 2, by + 22);
            ctx.fillStyle = '#14532d';
            ctx.font = '900 26px Inter, monospace';
            ctx.fillText('C₂H₆O  (ethanol)', bx + bw / 2, by + 52);
        }
    };

    /* ─── Component-level drawing helpers ─────────────────────── */

    const drawAnalyticalBalance = (ctx: CanvasRenderingContext2D, cx: number, cy: number, time: number, s: typeof stateRef.current, isFinal: boolean = false) => {
        // Determine which tube is currently being measured, and what value should display
        let currentTube: 'cacl2' | 'koh' | null = null;
        let targetMass = 0;
        let animStart = 0;
        if (isFinal) {
            if (!s.tube1FinalWeighed) { currentTube = 'cacl2'; targetMass = 0; }
            else if (!s.tube2FinalWeighed) { currentTube = 'cacl2'; targetMass = TUBE_CACL2_FINAL; animStart = weighStartRef.current.cacl2Final; }
            else { currentTube = 'koh'; targetMass = TUBE_KOH_FINAL; animStart = weighStartRef.current.kohFinal; }
        } else {
            if (!s.tube1Weighed) { currentTube = 'cacl2'; targetMass = 0; }
            else if (!s.tube2Weighed) { currentTube = 'cacl2'; targetMass = TUBE_CACL2_INITIAL; animStart = weighStartRef.current.cacl2; }
            else { currentTube = 'koh'; targetMass = TUBE_KOH_INITIAL; animStart = weighStartRef.current.koh; }
        }

        // Geometry — vertical bands (top to bottom):
        //   display | chamber (with tube) | base | feet
        const bodyW = 400;
        const bodyX = cx - bodyW / 2;
        const displayTop = cy - 200;
        const displayH = 80;
        const displayBot = displayTop + displayH;          // = cy-120
        const chamberTop = displayBot + 4;                 // = cy-116
        const chamberH = 180;
        const chamberBot = chamberTop + chamberH;          // = cy+68
        const baseTop = chamberBot + 4;                    // = cy+72
        const baseH = 50;
        const baseBot = baseTop + baseH;                   // = cy+122
        const panY = chamberBot - 8;                       // pan sits at the bottom of the chamber

        // ─── DISPLAY BLOCK (top) ───
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        roundRectPath(ctx, bodyX, displayTop, bodyW, displayH, 14);
        ctx.fill();
        ctx.stroke();
        // Brand label
        ctx.fillStyle = '#475569';
        ctx.font = '700 10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('METTLER · 0.0001 g', bodyX + 18, displayTop + 18);
        // LCD screen
        const lcdX = bodyX + 30;
        const lcdY = displayTop + 24;
        const lcdW = bodyW - 60;
        const lcdH = 48;
        ctx.fillStyle = '#0f172a';
        roundRectPath(ctx, lcdX, lcdY, lcdW, lcdH, 6);
        ctx.fill();
        // Animated digits
        const animDuration = 1.2;
        const animElapsed = animStart ? (time - animStart) / 1000 : 0;
        const animT = Math.min(1, animElapsed / animDuration);
        const easeAnim = animT < 1 ? 1 - Math.pow(1 - animT, 3) : 1;
        const displayedMass = animStart ? targetMass * easeAnim : targetMass;
        ctx.fillStyle = '#22d3ee';
        ctx.font = '900 30px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(displayedMass.toFixed(4), lcdX + lcdW - 44, lcdY + 36);
        ctx.fillStyle = '#0891b2';
        ctx.font = '800 20px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('g', lcdX + lcdW - 34, lcdY + 36);
        // Stable indicator
        ctx.fillStyle = animT >= 1 ? '#22c55e' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(lcdX + 14, lcdY + 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(animT >= 1 ? 'STABLE' : 'WEIGHING…', lcdX + 24, lcdY + 18);

        // ─── GLASS CHAMBER (middle) — open box with side posts ───
        // Side posts (frame)
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(bodyX, chamberTop, 16, chamberH);
        ctx.fillRect(bodyX + bodyW - 16, chamberTop, 16, chamberH);
        // Glass panes (translucent blue-tint)
        ctx.fillStyle = 'rgba(186,230,253,0.25)';
        ctx.fillRect(bodyX + 16, chamberTop, bodyW - 32, chamberH);
        // Glass outline
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bodyX + 16, chamberTop, bodyW - 32, chamberH);
        // Top crossbar (connects to display)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(bodyX, chamberTop, bodyW, 6);
        // Subtle vertical glass reflections
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bodyX + 40, chamberTop + 12);
        ctx.lineTo(bodyX + 40, chamberBot - 12);
        ctx.moveTo(bodyX + bodyW - 40, chamberTop + 12);
        ctx.lineTo(bodyX + bodyW - 40, chamberBot - 12);
        ctx.stroke();

        // ─── PAN (inside chamber, at bottom) ───
        const panW = 200;
        // Support post from base up to pan
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx - 6, panY, 12, chamberBot - panY);
        // Pan plate (oval)
        ctx.fillStyle = '#f1f5f9';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, panY, panW / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Pan sheen
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(cx - 22, panY - 2, panW / 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // ─── U-TUBE on pan (clipped to chamber so it never overlaps the display) ───
        if (currentTube) {
            const slideDuration = 0.7;
            const slideT = animStart ? Math.min(1, (time - animStart) / 1000 / slideDuration) : (targetMass > 0 ? 1 : 0);
            const easeSlide = 1 - Math.pow(1 - slideT, 4);
            const fromY = chamberTop - 30;       // start above the chamber (out of frame)
            const toY = panY - 4;
            const tubeY = animStart ? fromY + (toY - fromY) * easeSlide : (targetMass > 0 ? toY : toY);
            // Clip to inside the chamber so the tube can never overflow into the display
            ctx.save();
            ctx.beginPath();
            ctx.rect(bodyX + 16, chamberTop, bodyW - 32, chamberH);
            ctx.clip();
            drawUTubeOnPan(ctx, cx, tubeY, currentTube);
            ctx.restore();
        }

        // ─── BASE (bottom) ───
        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        roundRectPath(ctx, bodyX, baseTop, bodyW, baseH, 8);
        ctx.fill();
        ctx.stroke();
        // Spirit level
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(bodyX + 36, baseTop + 24, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(bodyX + 36, baseTop + 24, 3, 0, Math.PI * 2);
        ctx.fill();
        // Tare/Zero buttons
        ctx.fillStyle = '#94a3b8';
        roundRectPath(ctx, bodyX + 64, baseTop + 14, 50, 20, 4);
        ctx.fill();
        roundRectPath(ctx, bodyX + 122, baseTop + 14, 50, 20, 4);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TARE', bodyX + 89, baseTop + 27);
        ctx.fillText('ZERO', bodyX + 147, baseTop + 27);
        // Model badge on the right
        ctx.fillStyle = '#475569';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('XS204 ANALYTICAL', bodyX + bodyW - 18, baseTop + 32);

        // Feet
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(bodyX + 24, baseBot + 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bodyX + bodyW - 24, baseBot + 6, 5, 0, Math.PI * 2);
        ctx.fill();

        // Caption below
        ctx.fillStyle = '#475569';
        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Analytical balance · accuracy 0.0001 g', cx, baseBot + 32);

        // ─── WEIGHING LOG below the balance (fills the empty space) ───
        const logY = baseBot + 56;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        roundRectPath(ctx, bodyX - 20, logY, bodyW + 40, 90, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.font = '700 10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('WEIGHING LOG', bodyX - 8, logY + 18);
        // Column headings
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText('TUBE', bodyX - 4, logY + 36);
        ctx.fillText('READING', bodyX + 160, logY + 36);
        ctx.fillText('STATUS', bodyX + 280, logY + 36);
        // Rows
        const recordedCaCl2 = isFinal ? s.tube1FinalWeighed : s.tube1Weighed;
        const recordedKOH = isFinal ? s.tube2FinalWeighed : s.tube2Weighed;
        const valCaCl2 = isFinal ? (s.tube1FinalWeighed ? `${TUBE_CACL2_FINAL.toFixed(4)} g` : '—') : (s.tube1Weighed ? `${TUBE_CACL2_INITIAL.toFixed(4)} g` : '—');
        const valKOH = isFinal ? (s.tube2FinalWeighed ? `${TUBE_KOH_FINAL.toFixed(4)} g` : '—') : (s.tube2Weighed ? `${TUBE_KOH_INITIAL.toFixed(4)} g` : '—');
        ctx.font = '800 12px Inter, sans-serif';
        ctx.fillStyle = '#1d4ed8';
        ctx.fillText('CaCl₂', bodyX - 4, logY + 56);
        ctx.fillStyle = recordedCaCl2 ? '#0f172a' : '#cbd5e1';
        ctx.font = '800 12px monospace';
        ctx.fillText(valCaCl2, bodyX + 160, logY + 56);
        ctx.fillStyle = recordedCaCl2 ? '#16a34a' : '#cbd5e1';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.fillText(recordedCaCl2 ? '✓ recorded' : 'pending', bodyX + 280, logY + 56);
        ctx.fillStyle = '#dc2626';
        ctx.font = '800 12px Inter, sans-serif';
        ctx.fillText('KOH', bodyX - 4, logY + 76);
        ctx.fillStyle = recordedKOH ? '#0f172a' : '#cbd5e1';
        ctx.font = '800 12px monospace';
        ctx.fillText(valKOH, bodyX + 160, logY + 76);
        ctx.fillStyle = recordedKOH ? '#16a34a' : '#cbd5e1';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.fillText(recordedKOH ? '✓ recorded' : 'pending', bodyX + 280, logY + 76);
    };

    // Helper: rounded-rect path (no fill/stroke applied)
    const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
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
    };

    // Robust U-tube — two vertical glass arms + semicircular bottom that RESTS on the pan
    const drawUTubeOnPan = (ctx: CanvasRenderingContext2D, cx: number, baseY: number, kind: 'cacl2' | 'koh') => {
        // baseY = lowest point of the tube (rests on the pan)
        const color = kind === 'cacl2' ? '#3b82f6' : '#ef4444';
        const colorLight = kind === 'cacl2' ? '#bfdbfe' : '#fecaca';
        const name = kind === 'cacl2' ? 'CaCl₂' : 'KOH';
        const armW = 22;
        const armH = 90;
        const span = 38;
        const bottomR = span + armW / 2;                  // semicircle radius reaches outer arm edges
        const armBottomY = baseY - bottomR;               // arms END at the arc-centre height
        const topY = armBottomY - armH;                   // arms TOP
        const leftX = cx - span;
        const rightX = cx + span;

        // Left arm (glass shell)
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.fillRect(leftX - armW / 2, topY, armW, armH);
        ctx.strokeRect(leftX - armW / 2, topY, armW, armH);
        // Right arm (glass shell)
        ctx.fillRect(rightX - armW / 2, topY, armW, armH);
        ctx.strokeRect(rightX - armW / 2, topY, armW, armH);

        // Bottom semicircle — centred at armBottomY, opens DOWNWARD so bottom touches baseY
        ctx.beginPath();
        ctx.arc(cx, armBottomY, bottomR, 0, Math.PI);     // 0→π goes right→down→left (lower half)
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();

        // Granule fill — inside arms (top 70% empty, bottom 70% filled granules)
        ctx.fillStyle = colorLight;
        ctx.fillRect(leftX - armW / 2 + 2, topY + armH * 0.25, armW - 4, armH * 0.74);
        ctx.fillRect(rightX - armW / 2 + 2, topY + armH * 0.25, armW - 4, armH * 0.74);
        // Granule fill in the bottom curve
        ctx.beginPath();
        ctx.arc(cx, armBottomY, bottomR - 3, 0, Math.PI);
        ctx.fill();

        // Granule dots
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
            const offX = (i % 2 === 0 ? -3 : 3);
            ctx.beginPath();
            ctx.arc(leftX + offX, topY + 36 + i * 10, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rightX + offX, topY + 36 + i * 10, 1.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Species label — placed in the open gap BETWEEN the arms near the top, fully inside chamber
        ctx.fillStyle = color;
        ctx.font = '800 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, cx, topY + 16);
    };

    const drawUTubeMini = (ctx: CanvasRenderingContext2D, cx: number, cy: number, kind: 'cacl2' | 'koh' | null) => {
        if (!kind) return;
        const color = kind === 'cacl2' ? '#3b82f6' : '#ef4444';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        const r = 18;
        const span = 50;
        // Two vertical arms + bottom curve
        ctx.beginPath();
        ctx.moveTo(cx - span, cy - 60);
        ctx.lineTo(cx - span, cy);
        ctx.arc(cx - span + r, cy, r, Math.PI, 0, true);
        ctx.moveTo(cx - span + 2 * r, cy);
        ctx.lineTo(cx + span - 2 * r, cy);
        ctx.arc(cx + span - r, cy, r, Math.PI, 0, false);
        ctx.moveTo(cx + span, cy);
        ctx.lineTo(cx + span, cy - 60);
        ctx.stroke();
        // Fill
        ctx.fillStyle = color + '55';
        ctx.fillRect(cx - span - 8, cy - 50, 16, 50);
        ctx.fillRect(cx + span - 8, cy - 50, 16, 50);
        // Label
        ctx.fillStyle = color;
        ctx.font = '800 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(kind === 'cacl2' ? 'CaCl₂' : 'KOH', cx, cy - 8);
    };

    const drawUTubeLabel = (ctx: CanvasRenderingContext2D, cx: number, cy: number, label: string, color: string, weighed: boolean) => {
        ctx.fillStyle = weighed ? color + '22' : '#f8fafc';
        ctx.strokeStyle = weighed ? color : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(cx - 40, cy - 30, 80, 70);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '800 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy + 8);
        ctx.fillStyle = '#475569';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText(weighed ? '✓ weighed' : 'not weighed', cx, cy + 56);
    };

    // Animated train slots — bounce/glow when correctly filled
    const drawTrainStripAnimated = (ctx: CanvasRenderingContext2D, x: number, y: number, order: ('cacl2' | 'koh')[], time: number) => {
        const slots = [
            { label: 'Furnace', color: '#f97316', fixed: true, filled: true, animStart: 0 },
            {
                label: order[0] === 'cacl2' ? 'CaCl₂' : order[0] === 'koh' ? 'KOH' : 'Slot 1',
                color: order[0] === 'cacl2' ? '#1d4ed8' : order[0] === 'koh' ? '#dc2626' : '#94a3b8',
                fixed: false,
                filled: !!order[0],
                animStart: slotFillRef.current.slot1,
            },
            {
                label: order[1] === 'cacl2' ? 'CaCl₂' : order[1] === 'koh' ? 'KOH' : 'Slot 2',
                color: order[1] === 'cacl2' ? '#1d4ed8' : order[1] === 'koh' ? '#dc2626' : '#94a3b8',
                fixed: false,
                filled: !!order[1],
                animStart: slotFillRef.current.slot2,
            },
            { label: 'Vent', color: '#64748b', fixed: true, filled: true, animStart: 0 },
        ];
        const boxW = 96, boxH = 56, gap = 16;
        slots.forEach((slot, i) => {
            const bx = x + i * (boxW + gap);
            // Bounce-in animation for newly filled slots
            let scale = 1;
            let glow = 0;
            if (slot.animStart) {
                const t = Math.min(1.4, (time - slot.animStart) / 1000);
                if (t < 0.45) {
                    const bt = t / 0.45;
                    scale = 0.6 + 0.5 * (1 - Math.pow(1 - bt, 3));
                } else if (t < 0.7) {
                    const bt = (t - 0.45) / 0.25;
                    scale = 1.1 - 0.1 * (1 - Math.cos(bt * Math.PI)) / 2;
                }
                glow = Math.max(0, 1 - t / 1.2) * 18;
            }
            ctx.save();
            ctx.translate(bx + boxW / 2, y + boxH / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(bx + boxW / 2), -(y + boxH / 2));
            if (glow > 0) {
                ctx.shadowColor = slot.color;
                ctx.shadowBlur = glow;
            }
            ctx.fillStyle = slot.filled ? slot.color + '22' : '#ffffff';
            ctx.strokeStyle = slot.filled ? slot.color : '#cbd5e1';
            ctx.lineWidth = slot.filled ? 2.5 : 1.5;
            if (!slot.filled) ctx.setLineDash([5, 4]);
            roundRectPath(ctx, bx, y, boxW, boxH, 8);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
            // Label (outside transform so text stays crisp)
            ctx.fillStyle = slot.filled ? slot.color : '#94a3b8';
            ctx.font = '800 13px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(slot.label, bx + boxW / 2, y + boxH / 2 + 5);
            // Step number for slots
            if (!slot.fixed) {
                ctx.fillStyle = slot.filled ? slot.color + 'aa' : '#cbd5e1';
                ctx.font = '700 9px Inter, sans-serif';
                ctx.fillText(i === 1 ? 'STEP 1' : 'STEP 2', bx + boxW / 2, y - 6);
            }
            // Arrow to next slot
            if (i < slots.length - 1) {
                ctx.fillStyle = slot.filled && slots[i + 1].filled ? '#64748b' : '#cbd5e1';
                ctx.font = '800 18px Inter, sans-serif';
                ctx.fillText('→', bx + boxW + gap / 2, y + boxH / 2 + 6);
            }
        });
    };

    const drawTrainStrip = (ctx: CanvasRenderingContext2D, x: number, y: number, order: ('cacl2' | 'koh')[]) => {
        const slots = [
            { label: 'Combustion', color: '#f97316', fixed: true },
            { label: order[0] === 'cacl2' ? 'CaCl₂' : order[0] === 'koh' ? 'KOH' : 'Slot 1', color: order[0] === 'cacl2' ? '#1d4ed8' : order[0] === 'koh' ? '#dc2626' : '#94a3b8', fixed: false },
            { label: order[1] === 'cacl2' ? 'CaCl₂' : order[1] === 'koh' ? 'KOH' : 'Slot 2', color: order[1] === 'cacl2' ? '#1d4ed8' : order[1] === 'koh' ? '#dc2626' : '#94a3b8', fixed: false },
            { label: 'Vent', color: '#64748b', fixed: true },
        ];
        const boxW = 80, gap = 16;
        slots.forEach((slot, i) => {
            const bx = x + i * (boxW + gap);
            const filled = slot.fixed || slot.label !== 'Slot 1' && slot.label !== 'Slot 2';
            ctx.fillStyle = filled ? slot.color + '22' : '#ffffff';
            ctx.strokeStyle = filled ? slot.color : '#cbd5e1';
            ctx.lineWidth = filled ? 2 : 1.5;
            if (!filled) ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.rect(bx, y, boxW, 56);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = filled ? slot.color : '#64748b';
            ctx.font = '700 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(slot.label, bx + boxW / 2, y + 32);
            if (i < slots.length - 1) {
                ctx.fillStyle = '#94a3b8';
                ctx.font = '700 16px Inter, sans-serif';
                ctx.fillText('→', bx + boxW + gap / 2, y + 34);
            }
        });
    };

    const drawWeightRow = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string, recorded: boolean) => {
        const w = 480;
        ctx.fillStyle = recorded ? '#f0fdf4' : '#f8fafc';
        ctx.strokeStyle = recorded ? '#86efac' : '#e2e8f0';
        ctx.lineWidth = 1.5;
        roundRectPath(ctx, x, y - 14, w, 26, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#334155';
        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, x + 10, y + 5);
        ctx.fillStyle = recorded ? '#15803d' : '#94a3b8';
        ctx.font = '800 13px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(value, x + w - 10, y + 5);
    };

    const drawCombustionTrain = (ctx: CanvasRenderingContext2D, time: number, s: typeof stateRef.current) => {
        // Horizontal train across canvas: O₂ cylinder → combustion tube w/ sample boat → CaCl₂ U-tube → KOH U-tube → vent
        const baseY = 320;

        // O₂ cylinder
        const oxX = 100;
        drawO2Cylinder(ctx, oxX, baseY, s.combustionStarted);

        // Combustion tube
        const ctX = 280;
        const ctW = 280;
        drawCombustionTube(ctx, ctX, baseY, ctW, time, s.combustionStarted, s.combustionComplete);

        // CaCl2 U-tube
        const u1X = 660;
        drawUTube(ctx, u1X, baseY, '#3b82f6', 'CaCl₂', 'traps H₂O', s.combustionComplete);

        // KOH U-tube
        const u2X = 870;
        drawUTube(ctx, u2X, baseY, '#ef4444', 'KOH', 'traps CO₂', s.combustionComplete);

        // Vent
        const ventX = 1080;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(ventX, baseY - 8, 40, 16);
        ctx.fillStyle = '#475569';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Vent', ventX + 20, baseY + 32);
        // Up arrow
        if (s.combustionComplete) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '700 16px Inter, sans-serif';
            ctx.fillText('↑', ventX + 20, baseY - 14);
        }

        // Connecting tubes
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(oxX + 26, baseY);
        ctx.lineTo(ctX, baseY);
        ctx.moveTo(ctX + ctW, baseY);
        ctx.lineTo(u1X - 50, baseY);
        ctx.moveTo(u1X + 50, baseY);
        ctx.lineTo(u2X - 50, baseY);
        ctx.moveTo(u2X + 50, baseY);
        ctx.lineTo(ventX, baseY);
        ctx.stroke();

        // Animated particles between stages
        if (s.combustionStarted && !s.combustionComplete) {
            // After combustion tube → CaCl₂ (blue = H₂O, grey = CO₂)
            const stages: [number, number][] = [
                [ctX + ctW, u1X - 50],
                [u1X + 50, u2X - 50],
                [u2X + 50, ventX],
            ];
            stages.forEach((seg, segIdx) => {
                for (let i = 0; i < 6; i++) {
                    const t = (time / 600 + i * 0.25 + segIdx * 0.1) % 1.4;
                    if (t > 1) continue;
                    const x = seg[0] + (seg[1] - seg[0]) * t;
                    // Stage 1 carries both H₂O and CO₂; stage 2 carries only CO₂ (H₂O already trapped); stage 3 just air
                    if (segIdx === 0) {
                        const isWater = i % 2 === 0;
                        ctx.fillStyle = isWater ? '#3b82f6' : '#64748b';
                        ctx.beginPath();
                        ctx.arc(x, baseY + (i % 3 - 1) * 3, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                    } else if (segIdx === 1) {
                        ctx.fillStyle = '#64748b';
                        ctx.beginPath();
                        ctx.arc(x, baseY + (i % 3 - 1) * 3, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });
        }

        // Stage labels above
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('O₂ supply', oxX + 13, baseY - 100);
        ctx.fillText('Combustion tube (sample boat + CuO)', ctX + ctW / 2, baseY - 100);
        ctx.fillText('Anhyd. CaCl₂', u1X, baseY - 100);
        ctx.fillText('KOH solution', u2X, baseY - 100);
    };

    const drawO2Cylinder = (ctx: CanvasRenderingContext2D, cx: number, cy: number, on: boolean) => {
        ctx.fillStyle = on ? '#bae6fd' : '#e0f2fe';
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx + 13, cy - 60, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillRect(cx - 5, cy - 60, 36, 80);
        ctx.strokeRect(cx - 5, cy - 60, 36, 80);
        ctx.beginPath();
        ctx.ellipse(cx + 13, cy + 20, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Valve
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx + 8, cy - 80, 10, 16);
        // Label
        ctx.fillStyle = '#0891b2';
        ctx.font = '800 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('O₂', cx + 13, cy - 15);
    };

    const drawCombustionTube = (ctx: CanvasRenderingContext2D, x: number, cy: number, w: number, time: number, on: boolean, complete: boolean) => {
        // Glass tube (long horizontal)
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.fillRect(x, cy - 22, w, 44);
        ctx.strokeRect(x, cy - 22, w, 44);
        // CuO pellets pattern (right half)
        ctx.fillStyle = '#1f2937';
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.arc(x + w * 0.55 + (i % 4) * 18, cy + ((i % 2) - 0.5) * 14, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#64748b';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CuO pellets', x + w * 0.72, cy + 36);

        // Sample boat (left half)
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(x + 40, cy + 4);
        ctx.lineTo(x + 130, cy + 4);
        ctx.lineTo(x + 120, cy + 14);
        ctx.lineTo(x + 50, cy + 14);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Sample inside
        if (!complete) {
            ctx.fillStyle = on ? '#f59e0b' : '#94a3b8';
            ctx.fillRect(x + 60, cy - 2, 50, 8);
        } else {
            ctx.fillStyle = '#475569';
            ctx.fillRect(x + 60, cy + 4, 50, 2);
        }
        ctx.fillStyle = '#64748b';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText('platinum sample boat', x + 85, cy + 36);

        // Bunsen burner under the tube
        const burnerX = x + w / 2;
        ctx.fillStyle = '#64748b';
        ctx.fillRect(burnerX - 10, cy + 50, 20, 40);
        ctx.fillStyle = '#475569';
        ctx.fillRect(burnerX - 26, cy + 90, 52, 10);
        if (on) {
            const flicker = 1 + 0.12 * Math.sin(time / 100);
            ctx.fillStyle = 'rgba(251,146,60,0.6)';
            ctx.beginPath();
            ctx.ellipse(burnerX, cy + 32, 22 * flicker, 36 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(250,204,21,0.85)';
            ctx.beginPath();
            ctx.ellipse(burnerX, cy + 38, 12 * flicker, 24 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(59,130,246,0.7)';
            ctx.beginPath();
            ctx.ellipse(burnerX, cy + 44, 5 * flicker, 14 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // O₂ flow particles inside the tube (left → right)
        if (on && !complete) {
            for (let i = 0; i < 5; i++) {
                const t = (time / 800 + i * 0.2) % 1;
                const px = x + 10 + t * (w - 20);
                ctx.fillStyle = `rgba(8,145,178,${1 - t})`;
                ctx.beginPath();
                ctx.arc(px, cy + (i % 3 - 1) * 6, 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    const drawUTube = (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, label: string, sub: string, filled: boolean) => {
        // U-tube shape (drawn as path)
        const span = 60, h = 80, r = 30;
        ctx.fillStyle = color + (filled ? '55' : '25');
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - span / 2 - 15, cy - h);
        ctx.lineTo(cx - span / 2 - 15, cy + 10);
        ctx.arc(cx - span / 2 + r - 15, cy + 10, r, Math.PI, 0, true);
        ctx.lineTo(cx + span / 2 + 15 - r, cy + 10);
        ctx.arc(cx + span / 2 - r + 15, cy + 10, r, Math.PI, 0, false);
        ctx.lineTo(cx + span / 2 + 15, cy + 10);
        ctx.lineTo(cx + span / 2 + 15, cy - h);
        ctx.stroke();
        // Liquid in legs (after combustion complete = darker)
        const liquidY = filled ? cy - h * 0.45 : cy - h * 0.65;
        ctx.fillStyle = color + 'aa';
        ctx.fillRect(cx - span / 2 - 13, liquidY, 26, cy + 10 - liquidY);
        ctx.fillRect(cx + span / 2 - 13, liquidY, 26, cy + 10 - liquidY);
        // Bottom curve fill
        ctx.fillStyle = color + 'aa';
        ctx.beginPath();
        ctx.arc(cx, cy + 10, r - 2, 0, Math.PI, false);
        ctx.lineTo(cx - span / 2 + 13, cy + 10);
        ctx.closePath();
        ctx.fill();
        // Label
        ctx.fillStyle = color;
        ctx.font = '800 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy - h / 2 + 5);
        ctx.fillStyle = '#475569';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillText(sub, cx, cy - h / 2 + 22);
    };

    const drawProgressBar = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, progress: number) => {
        ctx.fillStyle = '#f1f5f9';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
        const grad = ctx.createLinearGradient(x, 0, x + w, 0);
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(1, '#facc15');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, (w * progress) / 100, h);
        ctx.fillStyle = '#475569';
        ctx.font = '700 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Combustion progress  ${progress}%`, x + w / 2, y - 6);
    };

    const drawCalcStepRow = (ctx: CanvasRenderingContext2D, x: number, y: number, step: number, currentStep: number, formula: string, result: string, color: string) => {
        const active = currentStep >= step;
        // Number badge
        ctx.fillStyle = active ? color : '#cbd5e1';
        ctx.beginPath();
        ctx.arc(x + 14, y + 14, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${step}`, x + 14, y + 19);
        // Formula
        ctx.fillStyle = active ? '#0f172a' : '#94a3b8';
        ctx.font = '700 13px Inter, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(formula, x + 36, y + 14);
        // Result
        ctx.fillStyle = active ? color : '#cbd5e1';
        ctx.font = '700 13px Inter, monospace';
        ctx.fillText(result, x + 36, y + 36);
    };

    const drawCompositionPie = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, step: number, time: number) => {
        const slices = [
            { value: PERCENT_H, color: '#1d4ed8', label: 'H', revealStep: 1 },
            { value: PERCENT_C, color: '#dc2626', label: 'C', revealStep: 2 },
            { value: PERCENT_O, color: '#f59e0b', label: 'O', revealStep: 3 },
        ];
        // Outer ring shadow
        ctx.save();
        ctx.shadowColor = 'rgba(15,23,42,0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Background ring
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Animated slices — sweep in over 0.6s
        let angle = -Math.PI / 2;
        slices.forEach(sl => {
            const a = (sl.value / 100) * Math.PI * 2;
            const startT = calcStepTimeRef.current[sl.revealStep] || 0;
            let progress = 0;
            if (step >= sl.revealStep) {
                if (!startT) progress = 1;
                else progress = Math.min(1, (time - startT) / 600);
                progress = 1 - Math.pow(1 - progress, 3);
            }
            if (progress > 0) {
                ctx.fillStyle = sl.color;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, r, angle, angle + a * progress);
                ctx.closePath();
                ctx.fill();
                if (progress === 1) {
                    const lblAngle = angle + a / 2;
                    const lx = cx + Math.cos(lblAngle) * (r * 0.62);
                    const ly = cy + Math.sin(lblAngle) * (r * 0.62);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 22px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${sl.label}`, lx, ly);
                    ctx.font = '800 12px Inter, monospace';
                    ctx.fillText(`${sl.value.toFixed(1)}%`, lx, ly + 18);
                }
            }
            angle += a;
        });

        // Inner hole donut effect
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Center totals
        if (step >= 1) {
            const total = (step >= 1 ? PERCENT_H : 0) + (step >= 2 ? PERCENT_C : 0) + (step >= 3 ? PERCENT_O : 0);
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 22px Inter, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${total.toFixed(1)}%`, cx, cy + 2);
            ctx.fillStyle = '#64748b';
            ctx.font = '700 10px Inter, sans-serif';
            ctx.fillText('REVEALED', cx, cy + 18);
        }

        // Title
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Elemental composition', cx, cy - r - 20);

        // Legend below
        const lgY = cy + r + 30;
        slices.forEach((sl, i) => {
            const lx = cx - 110 + i * 95;
            const shown = step >= sl.revealStep;
            ctx.fillStyle = shown ? sl.color : '#e2e8f0';
            roundRectPath(ctx, lx, lgY, 16, 16, 3);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = shown ? '#0f172a' : '#94a3b8';
            ctx.font = '800 13px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${sl.label}  ${shown ? sl.value.toFixed(1) + '%' : '—'}`, lx + 22, lgY + 13);
        });
    };

    const drawInfoCard = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, bgColor: string, titleColor: string) => {
        const r = 16;
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = titleColor + '44';
        ctx.lineWidth = 1.5;
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
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = titleColor;
        ctx.font = '800 17px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title, x + 20, y + 32);
        ctx.strokeStyle = titleColor + '55';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 42);
        ctx.lineTo(x + w - 20, y + 42);
        ctx.stroke();
    };

    const drawBottomInfoStrip = (ctx: CanvasRenderingContext2D, items: { label: string; value: string; color: string }[]) => {
        const stripY = 605;
        const stripH = 46;
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        roundRectPath(ctx, 80, stripY, 1120, stripH, 10);
        ctx.fill();
        ctx.stroke();
        const cellW = 1120 / items.length;
        items.forEach((it, i) => {
            const x = 80 + i * cellW + 20;
            ctx.fillStyle = '#64748b';
            ctx.font = '700 10px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(it.label.toUpperCase(), x, stripY + 16);
            ctx.fillStyle = it.color;
            ctx.font = '800 15px monospace';
            ctx.fillText(it.value, x, stripY + 36);
            // Divider between cells
            if (i < items.length - 1) {
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(80 + (i + 1) * cellW, stripY + 8);
                ctx.lineTo(80 + (i + 1) * cellW, stripY + stripH - 8);
                ctx.stroke();
            }
        });
    };

    /* ─── Left aside — flowchart + reactions ─────────────────── */
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-950">Procedure flow</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">Four-phase NCERT workflow</div>
                    <ol className="mt-3 space-y-2">
                        {[
                            { p: 1, label: 'Weigh empty tubes · assemble' },
                            { p: 2, label: 'Combustion under O₂' },
                            { p: 3, label: 'Re-weigh tubes (Δm₁, Δm₂)' },
                            { p: 4, label: 'Calculate %C, %H, %O · formula' },
                        ].map(({ p, label }) => {
                            const done = (
                                (p === 1 && assemblyCorrect) ||
                                (p === 2 && combustionComplete) ||
                                (p === 3 && tube1FinalWeighed && tube2FinalWeighed) ||
                                (p === 4 && calcStep >= 4) ||
                                (p < phase)
                            );
                            const active = p === phase;
                            return (
                                <li key={p} className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-all ${active ? 'border-amber-300 bg-amber-50' : done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${active ? 'bg-amber-500 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
                                        {done ? '✓' : p}
                                    </span>
                                    <span className={`text-sm font-bold ${active ? 'text-amber-900' : done ? 'text-emerald-900' : 'text-slate-700'}`}>{label}</span>
                                </li>
                            );
                        })}
                    </ol>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-950">Key formulas</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">NCERT §8.10.1, §8.10.6</div>
                    <div className="mt-3 space-y-2 font-mono text-[12px] leading-snug text-slate-700">
                        <p className="text-blue-700">%H = (2 × m₁ × 100) / (18 × m)</p>
                        <p className="text-red-700">%C = (12 × m₂ × 100) / (44 × m)</p>
                        <p className="text-amber-700">%O = 100 − %C − %H</p>
                        <p className="mt-2 text-slate-500">where:</p>
                        <p>m  = mass of sample</p>
                        <p>m₁ = mass of H₂O trapped (Δ CaCl₂)</p>
                        <p>m₂ = mass of CO₂ trapped (Δ KOH)</p>
                    </div>
                </div>
            </div>
        </aside>
    );

    /* ─── Right aside — theory + live values ─────────────────── */
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">Liebig's method</div>
                    <div className="mt-0.5 text-xs font-semibold text-amber-700">NCERT §8.10.1, Fig 8.14</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-amber-900">
                        <p>An accurate mass of organic compound is burnt in excess O₂ over hot CuO.</p>
                        <p>All C → CO₂, all H → H₂O.</p>
                        <p>Order is critical: <b>CaCl₂ first</b> traps water; <b>KOH second</b> traps CO₂. Reversing would let KOH absorb both — inflating %C.</p>
                        <p>%O is found by difference (§8.10.6).</p>
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
                        <ValueChip label="Sample m" value={`${SAMPLE_MASS.toFixed(4)} g`} tone="slate" />
                        <ValueChip label="Δm₁ (H₂O)" value={tube1FinalWeighed ? `${DELTA_CACL2.toFixed(4)} g` : '— g'} tone="blue" />
                        <ValueChip label="Δm₂ (CO₂)" value={tube2FinalWeighed ? `${DELTA_KOH.toFixed(4)} g` : '— g'} tone="red" />
                        <ValueChip label="% H" value={calcStep >= 1 ? `${PERCENT_H.toFixed(2)} %` : '— %'} tone="blue" />
                        <ValueChip label="% C" value={calcStep >= 2 ? `${PERCENT_C.toFixed(2)} %` : '— %'} tone="red" />
                        <ValueChip label="% O" value={calcStep >= 3 ? `${PERCENT_O.toFixed(2)} %` : '— %'} tone="amber" />
                        <div className="col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Empirical formula</div>
                            <div className="mt-1 font-mono text-base font-extrabold text-emerald-700">{calcStep >= 4 ? 'C₂H₆O (ethanol)' : '—'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="absolute inset-0 h-full w-full" />
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors" title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors" title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    /* ─── Controls — phase tabs + per-phase actions ─────────── */
    const phaseTabs = (
        <div className="flex flex-wrap gap-2">
            {[
                { p: 1 as Phase, label: 'Assembly' },
                { p: 2 as Phase, label: 'Combustion' },
                { p: 3 as Phase, label: 'Weighing' },
                { p: 4 as Phase, label: 'Calculation' },
            ].map(({ p, label }) => {
                const active = phase === p;
                return (
                    <button key={p} onClick={() => setPhase(p)} className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition-colors ${active ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        Phase {p} · {label}
                    </button>
                );
            })}
        </div>
    );

    const renderPhaseActions = () => {
        switch (phase) {
            case 1:
                return (
                    <div className="space-y-2">
                        <div className="grid gap-2 md:grid-cols-2">
                            <ActionButton onClick={() => handleWeighTube('cacl2')} disabled={tube1Weighed} icon={<Scale size={15} />} label="Weigh CaCl₂ tube" tone="blue" />
                            <ActionButton onClick={() => handleWeighTube('koh')} disabled={tube2Weighed} icon={<Scale size={15} />} label="Weigh KOH tube" tone="red" />
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                            <ActionButton onClick={() => handleConnect('cacl2')} disabled={!tube1Weighed || !tube2Weighed || assemblyOrder.includes('cacl2') || assemblyCorrect} icon={<ArrowRight size={15} />} label="Connect CaCl₂" tone="blue" />
                            <ActionButton onClick={() => handleConnect('koh')} disabled={!tube1Weighed || !tube2Weighed || assemblyOrder.includes('koh') || assemblyCorrect} icon={<ArrowRight size={15} />} label="Connect KOH" tone="red" />
                            <ActionButton onClick={handleResetAssembly} disabled={assemblyOrder.length === 0 || assemblyCorrect} icon={<RotateCcw size={15} />} label="Reset assembly" tone="amber" />
                        </div>
                        {assemblyError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
                                <AlertTriangle size={14} className="mr-1 inline" /> KOH absorbs both CO₂ and H₂O — order is wrong. Reset assembly and put CaCl₂ first.
                            </div>
                        )}
                    </div>
                );
            case 2:
                return (
                    <div className="grid gap-2 md:grid-cols-2">
                        <ActionButton onClick={handleIgnite} disabled={combustionStarted} icon={<Flame size={15} />} label={combustionStarted ? (combustionComplete ? '✓ Combustion complete' : 'Combustion in progress…') : 'Ignite furnace'} tone="amber" />
                    </div>
                );
            case 3:
                return (
                    <div className="grid gap-2 md:grid-cols-2">
                        <ActionButton onClick={() => handleWeighFinal('cacl2')} disabled={tube1FinalWeighed} icon={<Scale size={15} />} label={tube1FinalWeighed ? `✓ CaCl₂ ${TUBE_CACL2_FINAL.toFixed(4)} g` : 'Re-weigh CaCl₂'} tone="blue" />
                        <ActionButton onClick={() => handleWeighFinal('koh')} disabled={tube2FinalWeighed} icon={<Scale size={15} />} label={tube2FinalWeighed ? `✓ KOH ${TUBE_KOH_FINAL.toFixed(4)} g` : 'Re-weigh KOH'} tone="red" />
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-2">
                        <ActionButton onClick={handleCalcStep} disabled={calcStep >= 4} icon={<Calculator size={15} />} label={['Calculate %H', 'Calculate %C', 'Deduce %O', 'Derive empirical formula', '✓ Analysis complete'][calcStep]} tone="violet" />
                        {calcStep >= 4 && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                                <CheckCircle2 size={14} className="mr-1 inline" /> Empirical formula: C₂H₆O (ethanol).
                            </div>
                        )}
                    </div>
                );
        }
    };

    const controlsCombo = (
        <div className="w-full p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
                <FlaskConical size={18} className="text-amber-600" />
                <span className="text-sm font-extrabold uppercase tracking-wide">Liebig Combustion Bench</span>
            </div>
            {phaseTabs}
            {renderPhaseActions()}
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

/* Sub-components */
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

function ActionButton({ onClick, disabled, icon, label, tone }: { onClick: () => void; disabled?: boolean; icon: React.ReactNode; label: string; tone: 'amber' | 'blue' | 'red' | 'violet' | 'emerald' }) {
    const palette: Record<string, string> = {
        amber: 'border-amber-300 bg-white text-amber-800 hover:bg-amber-100',
        blue: 'border-blue-300 bg-white text-blue-800 hover:bg-blue-100',
        red: 'border-red-300 bg-white text-red-800 hover:bg-red-100',
        violet: 'border-violet-300 bg-white text-violet-800 hover:bg-violet-100',
        emerald: 'border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100',
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-extrabold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${palette[tone]}`}>
            {icon}{label}
        </button>
    );
}

export default QuantitativeAnalysisCanvas;
