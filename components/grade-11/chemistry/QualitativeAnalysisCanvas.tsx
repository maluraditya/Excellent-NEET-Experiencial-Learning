import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ArrowRight, CheckCircle2, AlertTriangle, FlaskConical, Droplet, Flame } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

/*
 * Lassaigne's Test — Qualitative Analysis of Elements in Organic Compounds (NCERT §8.9)
 *
 * Phases:
 *   1. TRAP    — direct AgNO₃ test fails on covalent R–Cl (no free Cl⁻)
 *   2. FUSION  — heat Na in ignition tube → add organic compound → red-hot fusion → plunge in water → SFE
 *   3. NITROGEN — boil SFE with FeSO₄, then conc. H₂SO₄ → Prussian blue
 *   4. SULPHUR — (a) acetic acid + lead acetate → black PbS; (b) sodium nitroprusside → violet
 *   5. HALOGEN — boil SFE with conc. HNO₃ to remove CN⁻/S²⁻; add AgNO₃ → AgX (Cl white, Br pale yellow, I yellow)
 */

type Phase = 1 | 2 | 3 | 4 | 5;
type Halogen = 'Cl' | 'Br' | 'I';

interface Props { topic: Topic; onExit: () => void; }

const CANVAS_W = 1280;
const CANVAS_H = 760;

const QualitativeAnalysisCanvas: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(performance.now());
    const phaseStartRef = useRef<number>(performance.now());

    const [phase, setPhase] = useState<Phase>(1);
    const [paused, setPaused] = useState(false);

    // Per-phase state
    const [phase1Tested, setPhase1Tested] = useState(false);
    const [fusionStep, setFusionStep] = useState<0 | 1 | 2 | 3>(0);
    const [nitrogenStep, setNitrogenStep] = useState<0 | 1 | 2>(0);
    const [sulphurTest, setSulphurTest] = useState<'none' | 'lead-acetate' | 'nitroprusside'>('none');
    const [halogenStep, setHalogenStep] = useState<0 | 1 | 2 | 3>(0);
    const [halogen, setHalogen] = useState<Halogen>('Cl');

    const [message, setMessage] = useState('An unknown organic compound contains C, H, N, S, and a halogen. Begin by testing for chlorine directly with AgNO₃.');

    // Findings tracker
    const [foundN, setFoundN] = useState(false);
    const [foundS, setFoundS] = useState(false);
    const [foundX, setFoundX] = useState<Halogen | null>(null);

    const handleReset = () => {
        setPhase(1);
        setPhase1Tested(false);
        setFusionStep(0); setNitrogenStep(0); setHalogenStep(0);
        setSulphurTest('none'); setHalogen('Cl');
        setFoundN(false); setFoundS(false); setFoundX(null);
        setMessage('Reset. Begin Phase 1 — test directly with AgNO₃.');
        phaseStartRef.current = performance.now();
    };

    /* ─── Phase actions ─────────────────────────────────────────── */
    const handleDirectTest = () => {
        setPhase1Tested(true);
        setMessage('No precipitate. R–Cl is covalent; Ag⁺ cannot find free Cl⁻. The compound must first be fused with sodium.');
    };
    const handleFusion = (step: 'heat-na' | 'heat-compound' | 'extract') => {
        if (step === 'heat-na' && fusionStep === 0) { setFusionStep(1); setMessage('Sodium melted to a shiny silvery ball. Now add the organic compound and continue heating to red-hot.'); }
        else if (step === 'heat-compound' && fusionStep === 1) { setFusionStep(2); setMessage('Compound fused with Na at red heat. Covalent bonds are broken — N, S, X are converted to NaCN, Na₂S, NaX.'); }
        else if (step === 'extract' && fusionStep === 2) { setFusionStep(3); setMessage('Hot tube plunged into distilled water. The ionic salts dissolve — this filtrate is the Sodium Fusion Extract (SFE). Proceed to test for elements.'); }
    };
    const handleNitrogen = (step: 'feso4' | 'h2so4') => {
        if (step === 'feso4' && nitrogenStep === 0) { setNitrogenStep(1); setMessage('SFE + FeSO₄ boiled. 6 CN⁻ + Fe²⁺ → [Fe(CN)₆]⁴⁻. Now acidify with conc. H₂SO₄.'); }
        else if (step === 'h2so4' && nitrogenStep === 1) { setNitrogenStep(2); setFoundN(true); setMessage('Prussian blue formed — Fe₄[Fe(CN)₆]₃·xH₂O. ✓ Nitrogen confirmed.'); }
    };
    const handleSulphur = (kind: 'lead-acetate' | 'nitroprusside') => {
        setSulphurTest(kind); setFoundS(true);
        setMessage(kind === 'lead-acetate' ? 'Black precipitate of PbS — S²⁻ + Pb²⁺ → PbS. ✓ Sulphur confirmed.' : 'Violet complex [Fe(CN)₅NOS]⁴⁻. ✓ Sulphur confirmed.');
    };
    const handleHalogen = (step: 'direct' | 'hno3' | 'agno3') => {
        if (step === 'direct' && halogenStep === 0) { setHalogenStep(1); setMessage('Dirty mixed precipitate of AgCN and Ag₂S — CN⁻ and S²⁻ interfere. The SFE must first be boiled with conc. HNO₃ to expel them as HCN and H₂S.'); }
        else if (step === 'hno3' && (halogenStep === 0 || halogenStep === 1)) { setHalogenStep(2); setMessage('Boiling with conc. HNO₃: NaCN → HCN↑, Na₂S → H₂S↑. Interfering ions are gone. Now add AgNO₃.'); }
        else if (step === 'agno3' && halogenStep === 2) {
            setHalogenStep(3); setFoundX(halogen);
            const txt = halogen === 'Cl' ? 'White precipitate AgCl — soluble in NH₄OH. ✓ Chlorine confirmed.' :
                halogen === 'Br' ? 'Pale-yellow precipitate AgBr — sparingly soluble in NH₄OH. ✓ Bromine confirmed.' :
                    'Yellow precipitate AgI — insoluble in NH₄OH. ✓ Iodine confirmed.';
            setMessage(txt);
        }
    };

    /* ─── Canvas render ─────────────────────────────────────────── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;

        const render = (time: number) => {
            const rawDt = (time - lastTimeRef.current) / 1000;
            const dt = paused ? 0 : Math.min(rawDt, 0.1);
            lastTimeRef.current = time;
            drawScene(ctx, dt, time);
            animRef.current = requestAnimationFrame(render);
        };
        animRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, phase1Tested, fusionStep, nitrogenStep, sulphurTest, halogenStep, halogen, paused, message]);

    useEffect(() => { phaseStartRef.current = performance.now(); }, [phase]);

    const drawScene = (ctx: CanvasRenderingContext2D, dt: number, time: number) => {
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.strokeStyle = 'rgba(15,23,42,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
        for (let y = 0; y <= CANVAS_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

        drawTitle(ctx);
        drawPhaseLabel(ctx);
        drawApparatus(ctx, time);
        drawHint(ctx);
    };

    const drawTitle = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 22px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText("Lassaigne's Test — Qualitative Analysis", 60, 60);
        ctx.fillStyle = '#475569';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.fillText('NCERT §8.9 · Detection of N, S, and halogens in organic compounds', 60, 84);
    };

    const drawPhaseLabel = (ctx: CanvasRenderingContext2D) => {
        const names = ['', 'Phase 1 — Why direct testing fails', 'Phase 2 — Sodium Fusion (preparing SFE)', 'Phase 3 — Test for Nitrogen', 'Phase 4 — Test for Sulphur', 'Phase 5 — Test for Halogens'];
        ctx.fillStyle = '#f59e0b';
        ctx.font = '800 16px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(names[phase], CANVAS_W - 60, 60);
    };

    const drawHint = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#475569';
        ctx.font = '500 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        // Wrap long messages
        wrapText(ctx, message, CANVAS_W / 2, 718, CANVAS_W - 120, 16);
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

    const drawApparatus = (ctx: CanvasRenderingContext2D, time: number) => {
        switch (phase) {
            case 1: drawPhase1(ctx, time); break;
            case 2: drawPhase2(ctx, time); break;
            case 3: drawPhase3(ctx, time); break;
            case 4: drawPhase4(ctx, time); break;
            case 5: drawPhase5(ctx, time); break;
        }
    };

    /* ───── Phase 1 — Direct AgNO₃ on raw compound ───── */
    const drawPhase1 = (ctx: CanvasRenderingContext2D, time: number) => {
        const cx = 380, cy = 380;
        drawBench(ctx, cx, cy + 240);
        drawBeaker(ctx, cx, cy, 200, 260, '#fde68a', 'Raw organic compound (R–Cl, covalent)');

        // R–Cl molecules drifting inside beaker
        const mols = 6;
        for (let i = 0; i < mols; i++) {
            const t = (time / 1000 + i * 0.7) % 4;
            const mx = cx - 70 + ((i * 31) % 140) + Math.sin(t * 1.2 + i) * 8;
            const my = cy + 20 + ((i * 27) % 100) + Math.cos(t * 0.9 + i) * 6;
            drawRClMolecule(ctx, mx, my);
        }

        // Dropper bringing AgNO₃ down
        if (phase1Tested) {
            drawDropper(ctx, cx, cy - 220, '#60a5fa', 'AgNO₃');
            const t = ((time - phaseStartRef.current) / 1000) % 1.8;
            if (t < 1) {
                ctx.fillStyle = '#60a5fa';
                ctx.beginPath();
                ctx.arc(cx, cy - 220 + 40 + t * 200, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            // Ag⁺ bouncing off R–Cl
            const bt = ((time - phaseStartRef.current) / 1000) % 2.4;
            const bp = bt < 1.2 ? bt / 1.2 : 1 - (bt - 1.2) / 1.2;
            const bx = cx - 100 + bp * 200;
            ctx.save();
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(bx, cy + 60, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#1e40af';
            ctx.font = '800 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Ag⁺', bx, cy + 64);
        }

        // Right info panel — molecular reasoning
        drawInfoCard(ctx, 760, 130, 450, 470, 'Why the direct test fails', '#fef3c7', '#92400e');
        let y = 200;
        ctx.fillStyle = '#1f2937';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('• In R–Cl, chlorine is covalently bonded.', 780, y); y += 26;
        ctx.fillText('• No free Cl⁻ ion is available in solution.', 780, y); y += 26;
        ctx.fillText('• Ag⁺ has no Cl⁻ to combine with — no AgCl ppt.', 780, y); y += 36;

        // Molecular illustration: R-Cl with Ag+ being repelled
        ctx.font = '900 22px Inter, monospace';
        ctx.fillStyle = '#0f172a';
        ctx.fillText('R — Cl', 800, y + 16);
        // Force arrow
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(900, y + 10);
        ctx.lineTo(960, y + 10);
        ctx.stroke();
        // Bounce arrow
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(900, y + 10);
        ctx.lineTo(912, y + 4);
        ctx.lineTo(912, y + 16);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1e40af';
        ctx.font = '800 18px Inter, sans-serif';
        ctx.fillText('Ag⁺', 970, y + 16);
        ctx.fillStyle = '#dc2626';
        ctx.font = '700 12px Inter, sans-serif';
        ctx.fillText('bounces away', 880, y + 38);
        y += 76;

        ctx.fillStyle = '#0f172a';
        ctx.font = '800 14px Inter, sans-serif';
        ctx.fillText('Conclusion', 780, y); y += 22;
        ctx.fillStyle = '#475569';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillText('Heteroatoms must first be converted into', 780, y); y += 20;
        ctx.fillText('ionic form. This is achieved by Lassaigne\'s', 780, y); y += 20;
        ctx.fillText('sodium fusion (next phase).', 780, y);

        // Bottom equation strip
        drawBottomEqStrip(ctx, [
            { eq: 'R–Cl  +  Ag⁺  ⟶  ✗  no reaction', color: '#b91c1c', active: phase1Tested },
        ]);
    };

    /* ───── Phase 2 — Sodium fusion ───── */
    const drawPhase2 = (ctx: CanvasRenderingContext2D, time: number) => {
        const cx = 380, cy = 380;
        drawBench(ctx, cx, cy + 240);

        if (fusionStep < 3) {
            drawIgnitionTube(ctx, cx, cy, fusionStep);
            drawBunsenBurner(ctx, cx, cy + 170, fusionStep > 0, time);
            // Step pill above apparatus
            const stepLabels = ['Step 0 — empty ignition tube', 'Step 1 — Na heated to silvery ball', 'Step 2 — compound added, red-hot fusion'];
            drawStepPill(ctx, cx, cy - 220, stepLabels[fusionStep], fusionStep > 0 ? '#f97316' : '#94a3b8');
        } else {
            // Step 3: SFE beaker with full ion soup
            drawBeaker(ctx, cx, cy, 220, 270, '#fef3c7', 'Sodium Fusion Extract (SFE)');
            const ions = [
                { sym: 'Na⁺', color: '#475569' },
                { sym: 'CN⁻', color: '#7c3aed' },
                { sym: 'S²⁻', color: '#dc2626' },
                { sym: 'Cl⁻', color: '#16a34a' },
                { sym: 'Na⁺', color: '#475569' },
                { sym: 'Na⁺', color: '#475569' },
                { sym: 'CN⁻', color: '#7c3aed' },
                { sym: 'Na⁺', color: '#475569' },
                { sym: 'S²⁻', color: '#dc2626' },
                { sym: 'Na⁺', color: '#475569' },
            ];
            ions.forEach((ion, i) => {
                const t = (time / 1000 + i * 0.35) % 4;
                const x = cx - 80 + ((i * 37) % 160) + Math.sin(t * 1.3 + i) * 12;
                const y = cy + 30 + ((i * 23) % 120) + Math.cos(t * 0.9 + i) * 10;
                ctx.fillStyle = ion.color;
                ctx.font = '800 15px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(ion.sym, x, y);
            });
            drawStepPill(ctx, cx, cy - 220, 'Step 3 — Plunged in water · SFE ready', '#16a34a');
        }

        // Right info panel — molecular transformation
        drawInfoCard(ctx, 760, 130, 450, 470, 'Covalent → ionic transformation', '#fef3c7', '#92400e');
        let y = 200;
        ctx.fillStyle = '#1f2937';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Sodium metal at red heat shatters', 780, y); y += 22;
        ctx.fillText('covalent bonds. Each heteroatom is', 780, y); y += 22;
        ctx.fillText('captured by Na to form an ionic salt:', 780, y); y += 30;

        // Three reaction rows
        const rxn = [
            { left: 'Na + C + N', right: 'NaCN', color: '#7c3aed', active: fusionStep >= 2 },
            { left: '2 Na + S', right: 'Na₂S', color: '#dc2626', active: fusionStep >= 2 },
            { left: 'Na + X', right: 'NaX  (X=Cl,Br,I)', color: '#16a34a', active: fusionStep >= 2 },
        ];
        rxn.forEach((r) => {
            ctx.fillStyle = r.active ? '#0f172a' : '#94a3b8';
            ctx.font = '700 15px Inter, monospace';
            ctx.fillText(r.left, 780, y);
            // Arrow
            ctx.strokeStyle = r.active ? r.color : '#cbd5e1';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(880, y - 5);
            ctx.lineTo(930, y - 5);
            ctx.stroke();
            ctx.fillStyle = r.active ? r.color : '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(930, y - 5);
            ctx.lineTo(920, y - 11);
            ctx.lineTo(920, y + 1);
            ctx.closePath();
            ctx.fill();
            // Heat above arrow
            if (r.active) {
                ctx.fillStyle = '#dc2626';
                ctx.font = '700 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Δ', 905, y - 12);
                ctx.textAlign = 'left';
            }
            ctx.fillStyle = r.active ? r.color : '#94a3b8';
            ctx.font = '800 16px Inter, monospace';
            ctx.fillText(r.right, 940, y);
            y += 36;
        });

        y += 10;
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 14px Inter, sans-serif';
        ctx.fillText('Then: plunge in water', 780, y); y += 20;
        ctx.fillStyle = '#475569';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillText('Salts dissolve → SFE — a clear ionic', 780, y); y += 20;
        ctx.fillText('solution ready for the three tests.', 780, y);

        // Bottom equation strip
        drawBottomEqStrip(ctx, [
            { eq: 'Na + C + N  ⟶  NaCN', color: '#7c3aed', active: fusionStep >= 2 },
            { eq: '2 Na + S  ⟶  Na₂S', color: '#dc2626', active: fusionStep >= 2 },
            { eq: 'Na + X  ⟶  NaX', color: '#16a34a', active: fusionStep >= 2 },
        ]);
    };

    /* ───── Phase 3 — Nitrogen / Prussian blue ───── */
    const drawPhase3 = (ctx: CanvasRenderingContext2D, time: number) => {
        const cx = 380, cy = 380;
        drawBench(ctx, cx, cy + 240);

        let liquid = '#fef3c7';
        let label = 'SFE (yellowish)';
        if (nitrogenStep === 1) { liquid = '#86efac'; label = 'Pale green — [Fe(CN)₆]⁴⁻ forming'; }
        else if (nitrogenStep === 2) { liquid = '#1d4ed8'; label = 'Prussian blue — Fe₄[Fe(CN)₆]₃'; }

        drawTestTube(ctx, cx, cy, liquid, label, undefined, 80, 260);
        // Heat indicator (boiling animation)
        if (nitrogenStep >= 1) {
            for (let i = 0; i < 5; i++) {
                const t = (time / 600 + i * 0.4) % 2;
                const bx = cx - 20 + (i % 3) * 18 - 8;
                const by = cy + 70 - t * 130;
                ctx.fillStyle = `rgba(148,163,184,${1 - t / 2})`;
                ctx.beginPath();
                ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (nitrogenStep === 2) {
            ctx.save();
            ctx.shadowColor = '#1d4ed8';
            ctx.shadowBlur = 40 + 12 * Math.sin(time / 250);
            ctx.fillStyle = 'rgba(29,78,216,0.05)';
            ctx.beginPath(); ctx.arc(cx, cy, 90, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        // Step pill
        const stepLabels3 = ['Step 0 — SFE in tube', 'Step 1 — FeSO₄ added & boiled', 'Step 2 — H₂SO₄ added → Prussian blue'];
        drawStepPill(ctx, cx, cy - 220, stepLabels3[nitrogenStep], nitrogenStep === 2 ? '#1d4ed8' : '#94a3b8');

        // Right panel — Prussian blue lattice diagram
        drawInfoCard(ctx, 760, 130, 450, 470, 'Prussian-blue formation', '#dbeafe', '#1e3a8a');
        let y = 200;
        ctx.fillStyle = '#1f2937';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Step A — cyanide binds Fe²⁺:', 780, y); y += 26;
        ctx.fillStyle = nitrogenStep >= 1 ? '#0f172a' : '#94a3b8';
        ctx.font = '700 15px Inter, monospace';
        ctx.fillText('6 CN⁻  +  Fe²⁺  ⟶  [Fe(CN)₆]⁴⁻', 800, y); y += 36;

        ctx.fillStyle = '#1f2937';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.fillText('Step B — H₂SO₄ oxidises some Fe²⁺ → Fe³⁺:', 780, y); y += 26;
        ctx.fillStyle = nitrogenStep === 2 ? '#0f172a' : '#94a3b8';
        ctx.font = '700 14px Inter, monospace';
        ctx.fillText('3[Fe(CN)₆]⁴⁻ + 4 Fe³⁺  ⟶  Fe₄[Fe(CN)₆]₃·xH₂O', 780, y); y += 36;

        // Mini lattice diagram
        const lcx = 985, lcy = y + 60;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const px = lcx - 60 + i * 60;
                const py = lcy - 60 + j * 60;
                const isFe = (i + j) % 2 === 0;
                ctx.fillStyle = nitrogenStep === 2 ? (isFe ? '#1d4ed8' : '#7c3aed') : '#cbd5e1';
                ctx.beginPath();
                ctx.arc(px, py, isFe ? 10 : 7, 0, Math.PI * 2);
                ctx.fill();
                if (i < 2) {
                    ctx.strokeStyle = nitrogenStep === 2 ? '#1d4ed8' : '#e2e8f0';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(px + 10, py);
                    ctx.lineTo(px + 50, py);
                    ctx.stroke();
                }
                if (j < 2) {
                    ctx.beginPath();
                    ctx.moveTo(px, py + 10);
                    ctx.lineTo(px, py + 50);
                    ctx.stroke();
                }
            }
        }
        ctx.fillStyle = '#475569';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Prussian-blue Fe–CN–Fe network', lcx, lcy + 80);
        ctx.fillStyle = '#1d4ed8';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.fillText('Fe', lcx - 60, lcy + 96);
        ctx.fillStyle = '#7c3aed';
        ctx.fillText('CN', lcx, lcy + 96);

        drawBottomEqStrip(ctx, [
            { eq: '6 CN⁻ + Fe²⁺  ⟶  [Fe(CN)₆]⁴⁻', color: '#7c3aed', active: nitrogenStep >= 1 },
            { eq: '3[Fe(CN)₆]⁴⁻ + 4 Fe³⁺  ⟶  Fe₄[Fe(CN)₆]₃', color: '#1d4ed8', active: nitrogenStep >= 2 },
        ]);
    };

    /* ───── Phase 4 — Sulphur ───── */
    const drawPhase4 = (ctx: CanvasRenderingContext2D, time: number) => {
        const xL = 230, xR = 510, cy = 380;
        drawBench(ctx, 370, cy + 240);

        // Left: lead acetate tube
        const leadColor = sulphurTest === 'lead-acetate' ? '#0f172a' : '#fef3c7';
        drawTestTube(ctx, xL, cy, leadColor, 'Lead acetate test', undefined, 76, 240);
        ctx.fillStyle = '#475569';
        ctx.font = '700 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sulphurTest === 'lead-acetate' ? 'Black PbS precipitate' : '+ CH₃COOH + (CH₃COO)₂Pb', xL, cy + 200);

        // Right: nitroprusside tube
        const npColor = sulphurTest === 'nitroprusside' ? '#7c3aed' : '#fef3c7';
        drawTestTube(ctx, xR, cy, npColor, 'Sodium nitroprusside test', undefined, 76, 240);
        ctx.fillStyle = '#475569';
        ctx.fillText(sulphurTest === 'nitroprusside' ? 'Violet complex [Fe(CN)₅NOS]⁴⁻' : '+ Na₂[Fe(CN)₅NO]', xR, cy + 200);

        // Glow when reaction triggered
        if (sulphurTest === 'lead-acetate') {
            ctx.save(); ctx.shadowColor = '#0f172a'; ctx.shadowBlur = 30; ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.beginPath(); ctx.arc(xL, cy, 80, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        if (sulphurTest === 'nitroprusside') {
            ctx.save(); ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 30 + 10 * Math.sin(time / 250); ctx.fillStyle = 'rgba(124,58,237,0.05)';
            ctx.beginPath(); ctx.arc(xR, cy, 80, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }

        // Right info panel — both reactions explained
        drawInfoCard(ctx, 760, 130, 450, 470, 'Two tests for S²⁻', '#f3e8ff', '#6b21a8');
        let y = 200;
        ctx.fillStyle = '#1f2937';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('A · Lead acetate test', 780, y); y += 24;
        ctx.fillStyle = sulphurTest === 'lead-acetate' ? '#0f172a' : '#94a3b8';
        ctx.font = '700 15px Inter, monospace';
        ctx.fillText('S²⁻ + Pb²⁺  ⟶  PbS', 800, y); y += 22;
        ctx.fillStyle = '#475569';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillText('Acidify SFE with CH₃COOH first.', 800, y); y += 18;
        ctx.fillText('Black precipitate confirms sulphur.', 800, y); y += 30;

        // Small black ppt swatch
        ctx.fillStyle = sulphurTest === 'lead-acetate' ? '#0f172a' : '#e2e8f0';
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
        ctx.fillRect(780, y - 8, 24, 24); ctx.strokeRect(780, y - 8, 24, 24);
        ctx.fillStyle = '#475569';
        ctx.font = '700 12px Inter, sans-serif';
        ctx.fillText('Black PbS', 814, y + 8);
        y += 40;

        ctx.fillStyle = '#1f2937';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.fillText('B · Sodium-nitroprusside test', 780, y); y += 24;
        ctx.fillStyle = sulphurTest === 'nitroprusside' ? '#0f172a' : '#94a3b8';
        ctx.font = '700 14px Inter, monospace';
        ctx.fillText('S²⁻ + [Fe(CN)₅NO]²⁻ ⟶', 800, y); y += 20;
        ctx.fillText('              [Fe(CN)₅NOS]⁴⁻', 800, y); y += 24;
        ctx.fillStyle = '#475569';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillText('Violet colour confirms sulphur.', 800, y); y += 30;

        ctx.fillStyle = sulphurTest === 'nitroprusside' ? '#7c3aed' : '#e2e8f0';
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
        ctx.fillRect(780, y - 8, 24, 24); ctx.strokeRect(780, y - 8, 24, 24);
        ctx.fillStyle = '#475569';
        ctx.font = '700 12px Inter, sans-serif';
        ctx.fillText('Violet complex', 814, y + 8);
        y += 38;

        ctx.fillStyle = '#92400e';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.fillText('NCERT note: if N and S coexist,', 780, y); y += 16;
        ctx.fillText('NaSCN forms — gives blood-red [Fe(SCN)]²⁺.', 780, y);

        drawBottomEqStrip(ctx, [
            { eq: 'S²⁻ + Pb²⁺  ⟶  PbS  (black)', color: '#0f172a', active: sulphurTest === 'lead-acetate' },
            { eq: 'S²⁻ + [Fe(CN)₅NO]²⁻  ⟶  violet', color: '#7c3aed', active: sulphurTest === 'nitroprusside' },
        ]);
    };

    /* ───── Phase 5 — Halogens ───── */
    const drawPhase5 = (ctx: CanvasRenderingContext2D, time: number) => {
        const cx = 380, cy = 380;
        drawBench(ctx, cx, cy + 240);

        let liquid = '#fef3c7';
        let label = 'SFE';
        let pptColor: string | null = null;
        if (halogenStep === 1) { liquid = '#78716c'; label = 'Dirty AgCN + Ag₂S (interference)'; }
        else if (halogenStep === 2) { liquid = '#fef3c7'; label = 'SFE — boiled with HNO₃, CN⁻/S²⁻ expelled'; }
        else if (halogenStep === 3) {
            liquid = '#fef3c7';
            if (halogen === 'Cl') { pptColor = '#ffffff'; label = 'AgCl — white'; }
            else if (halogen === 'Br') { pptColor = '#fde68a'; label = 'AgBr — pale yellow'; }
            else { pptColor = '#facc15'; label = 'AgI — yellow'; }
        }

        drawTestTube(ctx, cx, cy, liquid, label, pptColor || undefined, 80, 260);

        if (halogenStep === 2) {
            for (let i = 0; i < 8; i++) {
                const t = (time / 600 + i * 0.3) % 2;
                const bx = cx - 22 + (i % 4) * 14;
                const by = cy + 70 - t * 140;
                ctx.fillStyle = `rgba(148,163,184,${1 - t / 2})`;
                ctx.beginPath();
                ctx.arc(bx, by, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#dc2626';
            ctx.font = '800 15px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('HCN ↑   H₂S ↑', cx, cy - 150);
        }

        // Step pill
        const stepLabels5 = ['Step 0 — SFE ready', 'Step 1 — interference!', 'Step 2 — boiling with HNO₃', 'Step 3 — AgX precipitated'];
        const pillColors = ['#94a3b8', '#dc2626', '#f97316', '#16a34a'];
        drawStepPill(ctx, cx, cy - 220, stepLabels5[halogenStep], pillColors[halogenStep]);

        // Right panel — halogen comparison palette + NH₄OH solubility table
        drawInfoCard(ctx, 760, 130, 450, 470, 'Halogen identification', '#dcfce7', '#14532d');
        let y = 200;
        ctx.fillStyle = '#1f2937';
        ctx.font = '700 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Three halides — three colours:', 780, y); y += 30;

        // Three swatches with NH₄OH solubility
        const samples: { h: Halogen; color: string; name: string; sol: string; solColor: string }[] = [
            { h: 'Cl', color: '#ffffff', name: 'AgCl', sol: 'soluble', solColor: '#16a34a' },
            { h: 'Br', color: '#fde68a', name: 'AgBr', sol: 'sparingly sol.', solColor: '#f59e0b' },
            { h: 'I', color: '#facc15', name: 'AgI', sol: 'insoluble', solColor: '#b91c1c' },
        ];
        samples.forEach((s) => {
            const isActive = halogen === s.h && halogenStep === 3;
            // Swatch
            ctx.fillStyle = s.color;
            ctx.strokeStyle = isActive ? '#0f172a' : '#cbd5e1';
            ctx.lineWidth = isActive ? 3 : 1.5;
            ctx.beginPath();
            ctx.arc(810, y + 8, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Name
            ctx.fillStyle = isActive ? '#0f172a' : '#475569';
            ctx.font = '800 16px Inter, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(s.name, 840, y + 4);
            ctx.font = '600 11px Inter, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(`(X⁻ = ${s.h}⁻)`, 840, y + 20);
            // NH4OH solubility chip
            ctx.fillStyle = s.solColor + '33';
            ctx.fillRect(960, y - 6, 130, 28);
            ctx.strokeStyle = s.solColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(960, y - 6, 130, 28);
            ctx.fillStyle = s.solColor;
            ctx.font = '700 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`NH₄OH: ${s.sol}`, 1025, y + 11);
            y += 50;
        });

        y += 14;
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 13px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Why boil with HNO₃ first?', 780, y); y += 22;
        ctx.fillStyle = '#475569';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.fillText('If N or S is present, CN⁻ and S²⁻ would form', 780, y); y += 18;
        ctx.fillText('AgCN and Ag₂S, ruining the test. Conc. HNO₃', 780, y); y += 18;
        ctx.fillText('expels them as HCN↑ and H₂S↑ gases.', 780, y);

        drawBottomEqStrip(ctx, [
            { eq: 'NaCN + HNO₃  ⟶  NaNO₃ + HCN ↑', color: '#f97316', active: halogenStep >= 2 },
            { eq: 'Na₂S + 2 HNO₃  ⟶  2 NaNO₃ + H₂S ↑', color: '#f97316', active: halogenStep >= 2 },
            { eq: `X⁻ + Ag⁺  ⟶  Ag${halogen}`, color: '#16a34a', active: halogenStep === 3 },
        ]);
    };

    /* ───── Primitive draw helpers ─────────────────────────── */
    const drawBench = (ctx: CanvasRenderingContext2D, cx: number, y: number) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(cx - 280, y, 560, 6);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 280, y + 6, 560, 4);
    };

    const drawBeaker = (ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, liquidColor: string, label: string) => {
        const x = cx - w / 2;
        const y = cy - h / 2;
        // Glass body
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h - 20);
        ctx.quadraticCurveTo(x, y + h, x + 20, y + h);
        ctx.lineTo(x + w - 20, y + h);
        ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - 20);
        ctx.lineTo(x + w, y);
        ctx.stroke();
        // Liquid
        const liqTop = y + h * 0.3;
        ctx.fillStyle = liquidColor;
        ctx.beginPath();
        ctx.moveTo(x + 2, liqTop);
        ctx.lineTo(x + 2, y + h - 20);
        ctx.quadraticCurveTo(x + 2, y + h - 2, x + 20, y + h - 2);
        ctx.lineTo(x + w - 20, y + h - 2);
        ctx.quadraticCurveTo(x + w - 2, y + h - 2, x + w - 2, y + h - 20);
        ctx.lineTo(x + w - 2, liqTop);
        ctx.closePath();
        ctx.fill();
        // Meniscus
        ctx.strokeStyle = `rgba(15,23,42,0.18)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 2, liqTop);
        ctx.lineTo(x + w - 2, liqTop);
        ctx.stroke();
        // Label
        ctx.fillStyle = '#334155';
        ctx.font = '700 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, y + h + 28);
    };

    const drawTestTube = (ctx: CanvasRenderingContext2D, cx: number, cy: number, liquidColor: string, label: string, pptColor?: string, customW?: number, customH?: number) => {
        const w = customW ?? 56, h = customH ?? 180;
        const x = cx - w / 2;
        const y = cy - h / 2;
        // Tube body
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h - w / 2);
        ctx.arc(cx, y + h - w / 2, w / 2, Math.PI, 0, true);
        ctx.lineTo(x + w, y);
        ctx.stroke();
        // Liquid
        const liqTop = y + h * 0.25;
        ctx.fillStyle = liquidColor;
        ctx.beginPath();
        ctx.moveTo(x + 2, liqTop);
        ctx.lineTo(x + 2, y + h - w / 2);
        ctx.arc(cx, y + h - w / 2, w / 2 - 2, Math.PI, 0, true);
        ctx.lineTo(x + w - 2, liqTop);
        ctx.closePath();
        ctx.fill();
        // Precipitate at bottom
        if (pptColor) {
            ctx.fillStyle = pptColor;
            ctx.beginPath();
            ctx.arc(cx, y + h - w / 2, w / 2 - 4, Math.PI, 0, true);
            ctx.lineTo(x + w - 4, y + h - w / 2 - 14);
            ctx.lineTo(x + 4, y + h - w / 2 - 14);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.fillStyle = '#334155';
        ctx.font = '700 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, y + h + 26);
    };

    const drawIgnitionTube = (ctx: CanvasRenderingContext2D, cx: number, cy: number, step: number) => {
        // Smaller, held diagonally
        const w = 28, h = 130;
        const x = cx - w / 2;
        const y = cy - h / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-Math.PI / 12);
        ctx.translate(-cx, -cy);
        // Glass
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h - w / 2);
        ctx.arc(cx, y + h - w / 2, w / 2, Math.PI, 0, true);
        ctx.lineTo(x + w, y);
        ctx.stroke();
        // Contents per step
        if (step === 0) {
            // Empty
        } else {
            // Na ball or red-hot mass at bottom
            let color = '#cbd5e1';
            let glow = '#cbd5e1';
            if (step === 1) { color = '#e2e8f0'; glow = '#94a3b8'; }
            else if (step >= 2) { color = '#ef4444'; glow = '#fbbf24'; }
            ctx.save();
            ctx.shadowColor = glow;
            ctx.shadowBlur = step === 1 ? 8 : 18;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, y + h - w / 2 - 4, w / 2 - 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
        // Label
        ctx.fillStyle = '#334155';
        ctx.font = '700 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(['Ignition tube', 'Sodium melted', 'Red-hot fusion', 'Plunged in water'][step], cx, cy + h / 2 + 30);
    };

    const drawFlame = (ctx: CanvasRenderingContext2D, cx: number, cy: number, on: boolean, time: number) => {
        if (!on) return;
        const flicker = 1 + 0.15 * Math.sin(time / 100);
        // Outer
        ctx.fillStyle = 'rgba(251,146,60,0.65)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 22 * flicker, 36 * flicker, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner
        ctx.fillStyle = 'rgba(250,204,21,0.9)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 12 * flicker, 22 * flicker, 0, 0, Math.PI * 2);
        ctx.fill();
        // Burner stem
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx - 8, cy + 30, 16, 30);
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx - 18, cy + 60, 36, 10);
    };

    const drawInfoCard = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, bgColor: string, titleColor: string) => {
        // Background card with rounded corners
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
        // Title bar
        ctx.fillStyle = titleColor;
        ctx.font = '800 17px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(title, x + 20, y + 32);
        // Underline
        ctx.strokeStyle = titleColor + '55';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 42);
        ctx.lineTo(x + w - 20, y + 42);
        ctx.stroke();
    };

    const drawBottomEqStrip = (ctx: CanvasRenderingContext2D, rows: { eq: string; color: string; active: boolean }[]) => {
        const stripY = 620;
        const stripH = 64;
        // Background
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(80, stripY);
        ctx.lineTo(1200, stripY);
        ctx.lineTo(1200, stripY + stripH);
        ctx.lineTo(80, stripY + stripH);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Title
        ctx.fillStyle = '#64748b';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('REACTIONS', 100, stripY + 18);
        // Equations
        const totalW = 1200 - 80 - 40;
        const cellW = totalW / rows.length;
        ctx.font = '700 14px Inter, monospace';
        rows.forEach((r, i) => {
            const cx = 100 + i * cellW;
            // Status dot
            ctx.fillStyle = r.active ? r.color : '#cbd5e1';
            ctx.beginPath();
            ctx.arc(cx + 8, stripY + 42, 6, 0, Math.PI * 2);
            ctx.fill();
            // Equation
            ctx.fillStyle = r.active ? r.color : '#94a3b8';
            ctx.textAlign = 'left';
            ctx.fillText(r.eq, cx + 24, stripY + 47);
        });
    };

    const drawStepPill = (ctx: CanvasRenderingContext2D, cx: number, cy: number, label: string, color: string) => {
        ctx.font = '800 13px Inter, sans-serif';
        const w = ctx.measureText(label).width + 36;
        const x = cx - w / 2;
        const y = cy - 14;
        ctx.fillStyle = color + '22';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 14, y);
        ctx.lineTo(x + w - 14, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + 14);
        ctx.quadraticCurveTo(x + w, y + 28, x + w - 14, y + 28);
        ctx.lineTo(x + 14, y + 28);
        ctx.quadraticCurveTo(x, y + 28, x, y + 14);
        ctx.quadraticCurveTo(x, y, x + 14, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, y + 19);
    };

    const drawRClMolecule = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
        // Simple R—Cl: small dark circle (R) connected by line to green circle (Cl)
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy);
        ctx.lineTo(cx + 8, cy);
        ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(cx - 10, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(cx + 10, cy, 5, 0, Math.PI * 2);
        ctx.fill();
    };

    const drawBunsenBurner = (ctx: CanvasRenderingContext2D, cx: number, cy: number, on: boolean, time: number) => {
        // Flame
        if (on) {
            const flicker = 1 + 0.12 * Math.sin(time / 90);
            const fy = cy - 50;
            // Outer envelope
            ctx.fillStyle = 'rgba(251,146,60,0.55)';
            ctx.beginPath();
            ctx.ellipse(cx, fy, 26 * flicker, 50 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
            // Middle
            ctx.fillStyle = 'rgba(250,204,21,0.85)';
            ctx.beginPath();
            ctx.ellipse(cx, fy + 6, 16 * flicker, 36 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
            // Inner blue cone
            ctx.fillStyle = 'rgba(59,130,246,0.7)';
            ctx.beginPath();
            ctx.ellipse(cx, fy + 14, 6 * flicker, 16 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        // Barrel
        ctx.fillStyle = '#64748b';
        ctx.fillRect(cx - 10, cy, 20, 50);
        // Base
        ctx.fillStyle = '#475569';
        ctx.fillRect(cx - 28, cy + 50, 56, 14);
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx - 32, cy + 64, 64, 6);
        // Gas tube
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + 32, cy + 60);
        ctx.lineTo(cx + 90, cy + 60);
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Bunsen burner', cx, cy + 84);
    };

    const drawDropper = (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, label: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 28, 14, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 4, cy - 4, 8, 28);
        ctx.fillStyle = '#334155';
        ctx.font = '700 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy - 56);
    };

    /* ─── Left aside — progress + reactions ─────────────────────── */
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-950">Procedure Flow</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">Five-phase NCERT workflow</div>
                    <ol className="mt-3 space-y-2">
                        {[
                            { p: 1, label: 'Why direct AgNO₃ fails' },
                            { p: 2, label: 'Sodium fusion → SFE' },
                            { p: 3, label: 'Nitrogen (Prussian blue)' },
                            { p: 4, label: 'Sulphur (PbS / violet)' },
                            { p: 5, label: 'Halogen (AgX)' },
                        ].map(({ p, label }) => {
                            const done = p < phase || (p === 5 && halogenStep === 3) || (p === phase && (
                                (p === 1 && phase1Tested) ||
                                (p === 2 && fusionStep === 3) ||
                                (p === 3 && nitrogenStep === 2) ||
                                (p === 4 && sulphurTest !== 'none') ||
                                (p === 5 && halogenStep === 3)
                            ));
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
                    <div className="text-base font-extrabold text-slate-950">Key reactions</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">From NCERT §8.9.2</div>
                    <div className="mt-3 space-y-2 font-mono text-[12px] leading-snug text-slate-700">
                        <p>Na + C + N → NaCN</p>
                        <p>2 Na + S → Na₂S</p>
                        <p>Na + X → NaX</p>
                        <p className="mt-2 text-slate-500">After fusion:</p>
                        <p>6 CN⁻ + Fe²⁺ → [Fe(CN)₆]⁴⁻</p>
                        <p>3[Fe(CN)₆]⁴⁻ + 4 Fe³⁺ → Fe₄[Fe(CN)₆]₃ <span className="text-blue-700">(Prussian blue)</span></p>
                        <p>S²⁻ + Pb²⁺ → PbS <span className="text-slate-900">(black)</span></p>
                        <p>S²⁻ + [Fe(CN)₅NO]²⁻ → [Fe(CN)₅NOS]⁴⁻ <span className="text-violet-700">(violet)</span></p>
                        <p>X⁻ + Ag⁺ → AgX</p>
                    </div>
                </div>
            </div>
        </aside>
    );

    /* ─── Right aside — theory + findings ─────────────────────── */
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">Lassaigne's test</div>
                    <div className="mt-0.5 text-xs font-semibold text-amber-700">NCERT §8.9.2</div>
                    <div className="mt-2 space-y-1.5 text-sm leading-snug text-amber-900">
                        <p>Covalent N, S, and X cannot be detected directly. Fusing the compound with Na converts them to ionic NaCN, Na₂S, NaX.</p>
                        <p>The aqueous extract (SFE) is then tested:</p>
                        <p>• <b>N</b> → FeSO₄ + H₂SO₄ → Prussian blue.</p>
                        <p>• <b>S</b> → PbS (black) or violet nitroprusside complex.</p>
                        <p>• <b>X</b> → boil with HNO₃ first, then AgNO₃ → AgX.</p>
                        <p className="text-xs">If N and S coexist, NaSCN forms; with Fe³⁺ it gives blood-red [Fe(SCN)]²⁺, not Prussian blue. Excess Na breaks SCN⁻ back into CN⁻ and S²⁻.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="text-base font-extrabold text-slate-900">Findings</div>
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> LIVE
                        </span>
                    </div>
                    <div className="space-y-2">
                        <FindingRow label="Nitrogen" found={foundN} colorWhenFound="text-blue-700" detail={foundN ? 'Prussian blue confirmed' : 'pending'} />
                        <FindingRow label="Sulphur" found={foundS} colorWhenFound="text-violet-700" detail={foundS ? (sulphurTest === 'lead-acetate' ? 'PbS — black' : 'Violet complex') : 'pending'} />
                        <FindingRow label="Halogen" found={!!foundX} colorWhenFound={foundX === 'Cl' ? 'text-slate-700' : foundX === 'Br' ? 'text-amber-700' : 'text-yellow-700'} detail={foundX ? `Ag${foundX} confirmed` : 'pending'} />
                    </div>
                </div>
            </div>
        </aside>
    );

    /* ─── Simulation wrapper ──────────────────────────────────── */
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

    /* ─── Bottom controls ─────────────────────────────────────── */
    const phaseTabs = (
        <div className="flex flex-wrap gap-2">
            {[
                { p: 1 as Phase, label: 'Trap' },
                { p: 2 as Phase, label: "Lassaigne's fusion" },
                { p: 3 as Phase, label: 'Nitrogen' },
                { p: 4 as Phase, label: 'Sulphur' },
                { p: 5 as Phase, label: 'Halogens' },
            ].map(({ p, label }) => {
                const active = phase === p;
                const reachable = p <= phase || true; // allow free navigation
                return (
                    <button key={p} disabled={!reachable} onClick={() => setPhase(p)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition-colors ${active ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
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
                    <div className="grid gap-2 md:grid-cols-2">
                        <ActionButton onClick={handleDirectTest} disabled={phase1Tested} icon={<Droplet size={15} />} label="Add AgNO₃ directly" tone="blue" />
                        <ActionButton onClick={() => setPhase(2)} disabled={!phase1Tested} icon={<ArrowRight size={15} />} label="Proceed: sodium fusion" tone="amber" />
                    </div>
                );
            case 2:
                return (
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        <ActionButton onClick={() => handleFusion('heat-na')} disabled={fusionStep !== 0} icon={<Flame size={15} />} label="1. Heat Na" tone="amber" />
                        <ActionButton onClick={() => handleFusion('heat-compound')} disabled={fusionStep !== 1} icon={<Flame size={15} />} label="2. Add compound + heat" tone="amber" />
                        <ActionButton onClick={() => handleFusion('extract')} disabled={fusionStep !== 2} icon={<FlaskConical size={15} />} label="3. Plunge in water" tone="cyan" />
                        <ActionButton onClick={() => setPhase(3)} disabled={fusionStep !== 3} icon={<ArrowRight size={15} />} label="Proceed: nitrogen" tone="emerald" />
                    </div>
                );
            case 3:
                return (
                    <div className="grid gap-2 md:grid-cols-3">
                        <ActionButton onClick={() => handleNitrogen('feso4')} disabled={nitrogenStep !== 0} icon={<Droplet size={15} />} label="Add FeSO₄ & boil" tone="emerald" />
                        <ActionButton onClick={() => handleNitrogen('h2so4')} disabled={nitrogenStep !== 1} icon={<Droplet size={15} />} label="Add conc. H₂SO₄" tone="blue" />
                        <ActionButton onClick={() => setPhase(4)} disabled={nitrogenStep !== 2} icon={<ArrowRight size={15} />} label="Proceed: sulphur" tone="violet" />
                    </div>
                );
            case 4:
                return (
                    <div className="grid gap-2 md:grid-cols-3">
                        <ActionButton onClick={() => handleSulphur('lead-acetate')} icon={<Droplet size={15} />} label="Lead acetate test" tone="slate" />
                        <ActionButton onClick={() => handleSulphur('nitroprusside')} icon={<Droplet size={15} />} label="Nitroprusside test" tone="violet" />
                        <ActionButton onClick={() => setPhase(5)} disabled={sulphurTest === 'none'} icon={<ArrowRight size={15} />} label="Proceed: halogens" tone="amber" />
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">Sample halogen:</span>
                            {(['Cl', 'Br', 'I'] as Halogen[]).map(h => (
                                <button key={h} onClick={() => setHalogen(h)} disabled={halogenStep === 3}
                                    className={`rounded-md border px-3 py-1 text-xs font-extrabold transition-colors ${halogen === h ? 'border-amber-400 bg-amber-100 text-amber-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'} disabled:opacity-50`}>{h}</button>
                            ))}
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                            <ActionButton onClick={() => handleHalogen('direct')} disabled={halogenStep !== 0} icon={<AlertTriangle size={15} />} label="Try direct AgNO₃" tone="red" />
                            <ActionButton onClick={() => handleHalogen('hno3')} disabled={halogenStep > 1} icon={<Flame size={15} />} label="Boil with conc. HNO₃" tone="amber" />
                            <ActionButton onClick={() => handleHalogen('agno3')} disabled={halogenStep !== 2} icon={<Droplet size={15} />} label="Add AgNO₃" tone="blue" />
                        </div>
                        {halogenStep === 3 && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                                <CheckCircle2 size={14} className="mr-1 inline" /> Analysis complete. Detected: {foundN ? 'N, ' : ''}{foundS ? 'S, ' : ''}Ag{foundX}.
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
                <span className="text-sm font-extrabold uppercase tracking-wide">Qualitative Analysis Bench</span>
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

/* ─── Sub-components ────────────────────────────────────────── */

function FindingRow({ label, found, colorWhenFound, detail }: { label: string; found: boolean; colorWhenFound: string; detail: string }) {
    return (
        <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${found ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center gap-2">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold ${found ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                    {found ? '✓' : '?'}
                </span>
                <span className={`text-sm font-extrabold ${found ? 'text-emerald-900' : 'text-slate-700'}`}>{label}</span>
            </div>
            <span className={`text-xs font-mono font-bold ${found ? colorWhenFound : 'text-slate-400'}`}>{detail}</span>
        </div>
    );
}

function ActionButton({ onClick, disabled, icon, label, tone }: { onClick: () => void; disabled?: boolean; icon: React.ReactNode; label: string; tone: 'amber' | 'blue' | 'emerald' | 'slate' | 'violet' | 'cyan' | 'red' }) {
    const palette: Record<string, string> = {
        amber: 'border-amber-300 bg-white text-amber-800 hover:bg-amber-100',
        blue: 'border-blue-300 bg-white text-blue-800 hover:bg-blue-100',
        emerald: 'border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100',
        slate: 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100',
        violet: 'border-violet-300 bg-white text-violet-800 hover:bg-violet-100',
        cyan: 'border-cyan-300 bg-white text-cyan-800 hover:bg-cyan-100',
        red: 'border-red-300 bg-white text-red-800 hover:bg-red-100',
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-extrabold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${palette[tone]}`}>
            {icon}{label}
        </button>
    );
}

export default QualitativeAnalysisCanvas;
