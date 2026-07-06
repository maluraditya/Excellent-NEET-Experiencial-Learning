import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Battery, CircuitBoard, Gauge, Pause, Play, RotateCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface CurrentElectricityLabProps {
    topic: any;
    onExit: () => void;
}

type Scene = 'ohm' | 'cells' | 'wheatstone';
type ElementType = 'resistor' | 'bulb' | 'diode';
type Combo = 'series' | 'parallel';

const W = 1280;
const H = 760;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ----- Element I–V models (NCERT-faithful behaviours) -----
const currentThroughElement = (V: number, type: ElementType, R: number) => {
    if (type === 'resistor') return V / R;
    if (type === 'bulb') {
        let I = V / R;
        for (let k = 0; k < 12; k++) {
            const Reff = R * (1 + 0.6 * I * I);
            I = V / Reff;
        }
        return I;
    }
    const VT = 0.7;
    if (V <= VT && V > -10) return Math.max(0, (V - VT) / Math.max(R, 0.5)) * 0.001;
    if (V > VT) return (V - VT) / Math.max(R, 0.5);
    return 0;
};

// 4-band colour code helper for realistic resistor body
const BAND_COLOURS = ['#0f172a', '#92400e', '#dc2626', '#ea580c', '#facc15', '#16a34a', '#2563eb', '#7c3aed', '#6b7280', '#f8fafc'];
const resistorBands = (R: number): string[] => {
    if (R <= 0) return ['#0f172a', '#0f172a', '#0f172a', '#ca8a04'];
    const exp = Math.max(0, Math.floor(Math.log10(R)) - 1);
    const sig = R / Math.pow(10, exp);
    const d1 = clamp(Math.floor(sig / 10), 0, 9);
    const d2 = clamp(Math.floor(sig) % 10, 0, 9);
    const mult = clamp(exp, 0, 9);
    return [BAND_COLOURS[d1], BAND_COLOURS[d2], BAND_COLOURS[mult], '#ca8a04'];
};

const CurrentElectricityLab: React.FC<CurrentElectricityLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scene, setScene] = useState<Scene>('ohm');
    const [paused, setPaused] = useState(false);

    // ----- Ohm scene state -----
    const [ohmEMF, setOhmEMF] = useState(6);
    const [ohmR, setOhmR] = useState(10);
    const [element, setElement] = useState<ElementType>('resistor');
    const [traceMode, setTraceMode] = useState(true);
    const traceRef = useRef<Array<{ V: number; I: number }>>([]);

    // ----- Cells scene state -----
    const [combo, setCombo] = useState<Combo>('series');
    const [emf1, setEmf1] = useState(6);
    const [emf2, setEmf2] = useState(6);
    const [r1, setR1] = useState(1);
    const [r2, setR2] = useState(1);
    const [reverse2, setReverse2] = useState(false);
    const [loadR, setLoadR] = useState(10);

    // ----- Wheatstone scene state -----
    const [R1w, setR1w] = useState(100);
    const [R2w, setR2w] = useState(100);
    const [R3w, setR3w] = useState(100);
    const [R4w, setR4w] = useState(100);
    const [bridgeEMF, setBridgeEMF] = useState(6);

    const tRef = useRef(0);

    // ----- Derived numbers -----
    const ohm = useMemo(() => {
        const traceCurve: Array<{ V: number; I: number }> = [];
        const range = Math.max(2, Math.abs(ohmEMF) + 2);
        for (let i = 0; i <= 80; i++) {
            const V = -range + (i / 80) * (2 * range);
            traceCurve.push({ V, I: currentThroughElement(V, element, ohmR) });
        }
        const Iop = currentThroughElement(ohmEMF, element, ohmR);
        const Vop = ohmEMF;
        const P = Vop * Iop;
        return { traceCurve, Iop, Vop, P, range };
    }, [ohmEMF, ohmR, element]);

    const cellCombo = useMemo(() => {
        const e2 = reverse2 ? -emf2 : emf2;
        if (combo === 'series') {
            const eEq = emf1 + e2;
            const rEq = r1 + r2;
            const I = eEq / (rEq + loadR);
            const Vext = I * loadR;
            return { eEq, rEq, I, Vext, I1: I, I2: I };
        }
        const invR = 1 / r1 + 1 / r2;
        const rEq = 1 / invR;
        const eEq = (emf1 / r1 + e2 / r2) / invR;
        const I = eEq / (rEq + loadR);
        const Vext = I * loadR;
        const I1 = (emf1 - Vext) / r1;
        const I2 = (e2 - Vext) / r2;
        return { eEq, rEq, I, Vext, I1, I2 };
    }, [combo, emf1, emf2, r1, r2, reverse2, loadR]);

    const bridge = useMemo(() => {
        const I_top = bridgeEMF / (R1w + R2w);
        const I_bot = bridgeEMF / (R3w + R4w);
        const Vb = bridgeEMF - I_top * R1w;
        const Vd = bridgeEMF - I_bot * R3w;
        const dV = Vb - Vd;
        const deflection = clamp(dV / (bridgeEMF * 0.5), -1, 1);
        const balanced = Math.abs(deflection) < 0.005;
        const balanceR4 = (R2w * R3w) / R1w;
        return { I_top, I_bot, Vb, Vd, dV, deflection, balanced, balanceR4 };
    }, [R1w, R2w, R3w, R4w, bridgeEMF]);

    useEffect(() => {
        if (scene !== 'ohm' || !traceMode) return;
        traceRef.current.push({ V: ohm.Vop, I: ohm.Iop });
        if (traceRef.current.length > 220) traceRef.current.shift();
    }, [scene, traceMode, ohm.Vop, ohm.Iop]);

    useEffect(() => { traceRef.current = []; }, [element]);

    const handleReset = useCallback(() => {
        setScene('ohm');
        setPaused(false);
        setOhmEMF(6); setOhmR(10); setElement('resistor'); setTraceMode(true); traceRef.current = [];
        setCombo('series'); setEmf1(6); setEmf2(6); setR1(1); setR2(1); setReverse2(false); setLoadR(10);
        setR1w(100); setR2w(100); setR3w(100); setR4w(100); setBridgeEMF(6);
    }, []);

    // ============= DRAW LOOP =============
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = (t: number) => {
            // soft white background
            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#fbfcfe');
            bg.addColorStop(1, '#f3f6fb');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            ctx.strokeStyle = 'rgba(148,163,184,0.14)';
            ctx.lineWidth = 1;
            for (let x = 0; x <= W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (let y = 0; y <= H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

            // title
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 20px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(
                scene === 'ohm' ? 'Ohm’s Law & V–I Behaviour'
                    : scene === 'cells' ? 'Cells in Series & Parallel — Terminal Voltage'
                        : 'Wheatstone Bridge — Balance Condition',
                32, 38
            );

            if (scene === 'ohm') drawOhmScene(ctx, t);
            else if (scene === 'cells') drawCellsScene(ctx, t);
            else drawBridgeScene(ctx, t);

            // bottom hint
            ctx.fillStyle = '#64748b';
            ctx.font = '13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            const hint =
                scene === 'ohm' ? 'Sweep EMF on the bench → watch the live V–I trace bend (resistor straight, bulb curves, diode one-way).'
                    : scene === 'cells' ? 'Toggle Series ↔ Parallel; reverse cell 2 to make ε’s oppose; load slider sets V_ext.'
                        : 'Slide R₄ until the galvanometer needle pins to zero — bridge is balanced.';
            ctx.fillText(hint, 32, H - 16);
        };

        // ============= SCENE: OHM =============
        const drawOhmScene = (ctx: CanvasRenderingContext2D, t: number) => {
            const cx = W / 2;
            const cy = H / 2 + 30;
            const loopW = 860;
            const loopH = 340;
            const left = cx - loopW / 2;
            const right = cx + loopW / 2;
            const top = cy - loopH / 2;
            const bot = cy + loopH / 2;

            // wires (drawn beneath components)
            drawWire(ctx, [
                { x: left, y: top }, { x: right, y: top },
                { x: right, y: bot }, { x: left, y: bot },
                { x: left, y: top },
            ]);

            // flow dots animated along the loop
            const dir = ohm.Iop >= 0 ? 1 : -1;
            const speed = clamp(Math.abs(ohm.Iop) * 60, 8, 220);
            drawFlowDots(ctx, [
                { ax: left, ay: top, bx: right, by: top },
                { ax: right, ay: top, bx: right, by: bot },
                { ax: right, ay: bot, bx: left, by: bot },
                { ax: left, ay: bot, bx: left, by: top },
            ], t, speed, dir);

            // Battery on the left wire (big AA cell, vertical)
            drawCellBattery(ctx, left, cy, ohmEMF, 'vertical');

            // Element on the top wire (centre)
            drawElement(ctx, cx, top, element, ohm.Iop, ohmR);

            // Ammeter on the right wire
            drawAnalogMeter(ctx, right, cy, 'A', ohm.Iop, Math.max(0.1, Math.abs(ohm.Vop / Math.max(1, ohmR)) * 1.5), '#dc2626');

            // Voltmeter spans the element (above) via dashed leads
            drawAnalogMeter(ctx, cx, top - 110, 'V', ohm.Vop, Math.max(2, Math.abs(ohm.Vop) + 1), '#1d4ed8');
            drawDashedLead(ctx, cx - 90, top, cx - 90, top - 70);
            drawDashedLead(ctx, cx + 90, top, cx + 90, top - 70);

            // tiny element label badge above its body
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            const lbl = element === 'resistor' ? `Resistor · ${ohmR.toFixed(0)} Ω`
                : element === 'bulb' ? `Filament bulb · ${ohmR.toFixed(0)} Ω cold`
                    : 'Si diode · cut-in 0.7 V';
            ctx.fillText(lbl, cx, top + 84);
        };

        // ============= SCENE: CELLS =============
        const drawCellsScene = (ctx: CanvasRenderingContext2D, t: number) => {
            const cx = W / 2;
            const cy = H / 2 + 30;
            const loopW = 860;
            const loopH = 360;
            const left = cx - loopW / 2;
            const right = cx + loopW / 2;
            const top = cy - loopH / 2;
            const bot = cy + loopH / 2;

            drawWire(ctx, [
                { x: left, y: top }, { x: right, y: top },
                { x: right, y: bot }, { x: left, y: bot },
                { x: left, y: top },
            ]);

            const dir = cellCombo.I >= 0 ? 1 : -1;
            const speed = Math.abs(cellCombo.I) < 1e-6 ? 0 : clamp(Math.abs(cellCombo.I) * 60, 6, 200);
            drawFlowDots(ctx, [
                { ax: left, ay: top, bx: right, by: top },
                { ax: right, ay: top, bx: right, by: bot },
                { ax: right, ay: bot, bx: left, by: bot },
                { ax: left, ay: bot, bx: left, by: top },
            ], t, speed, dir);

            if (combo === 'series') {
                // two AA cells stacked vertically on left wire
                drawCellBattery(ctx, left, cy - 100, emf1, 'vertical', `ε₁ ${emf1.toFixed(1)} V · r₁ ${r1.toFixed(1)} Ω`);
                drawCellBattery(ctx, left, cy + 100, reverse2 ? -emf2 : emf2, 'vertical',
                    `ε₂ ${emf2.toFixed(1)} V · r₂ ${r2.toFixed(1)} Ω${reverse2 ? ' (reversed)' : ''}`);
            } else {
                // two parallel branches dropped from left wire
                const branchLx = left - 70;
                const branchRx = left + 70;
                drawWire(ctx, [
                    { x: left, y: cy - loopH / 2 }, { x: branchLx, y: cy - loopH / 2 },
                    { x: branchLx, y: cy - 120 },
                ]);
                drawWire(ctx, [
                    { x: branchLx, y: cy + 120 }, { x: branchLx, y: cy + loopH / 2 },
                    { x: left, y: cy + loopH / 2 },
                ]);
                drawWire(ctx, [
                    { x: branchRx, y: cy - 120 }, { x: branchRx, y: cy - loopH / 2 },
                ]);
                drawWire(ctx, [
                    { x: branchRx, y: cy + loopH / 2 }, { x: branchRx, y: cy + 120 },
                ]);
                drawCellBattery(ctx, branchLx, cy, emf1, 'vertical', `ε₁ ${emf1.toFixed(1)} V · r₁ ${r1.toFixed(1)} Ω`);
                drawCellBattery(ctx, branchRx, cy, reverse2 ? -emf2 : emf2, 'vertical',
                    `ε₂ ${emf2.toFixed(1)} V · r₂ ${r2.toFixed(1)} Ω${reverse2 ? ' (rev)' : ''}`);
            }

            // Load resistor on right wire (big, with colour bands)
            drawElement(ctx, right, cy, 'resistor', cellCombo.I, loadR, `Load ${loadR.toFixed(0)} Ω`);

            // Ammeter on the top wire
            drawAnalogMeter(ctx, cx, top, 'A', cellCombo.I, Math.max(0.3, Math.abs(cellCombo.I) * 1.5), '#dc2626');

            // Voltmeter across the load (right of it)
            drawAnalogMeter(ctx, right + 100, cy, 'V', cellCombo.Vext, Math.max(2, Math.abs(cellCombo.Vext) + 1), '#1d4ed8');
            drawDashedLead(ctx, right + 36, cy - 50, right + 70, cy - 50);
            drawDashedLead(ctx, right + 36, cy + 50, right + 70, cy + 50);
        };

        // ============= SCENE: WHEATSTONE =============
        const drawBridgeScene = (ctx: CanvasRenderingContext2D, _t: number) => {
            const cx = W / 2;
            const cy = H / 2 - 20;
            const size = 240;
            const A = { x: cx - size, y: cy };
            const C = { x: cx + size, y: cy };
            const B = { x: cx, y: cy - size * 0.7 };
            const D = { x: cx, y: cy + size * 0.7 };

            // diamond edges
            drawWire(ctx, [A, B, C, D, A]);

            // Resistors at midpoints
            drawResistorOnEdge(ctx, A, B, R1w, 'R₁');
            drawResistorOnEdge(ctx, B, C, R2w, 'R₂');
            drawResistorOnEdge(ctx, A, D, R3w, 'R₃');
            drawResistorOnEdge(ctx, D, C, R4w, 'R₄');

            // Galvanometer on B–D diagonal
            drawWire(ctx, [B, D]);
            drawGalvanometer(ctx, (B.x + D.x) / 2, (B.y + D.y) / 2, bridge.deflection, bridge.balanced);

            // Battery A–C below
            const by = D.y + 90;
            drawWire(ctx, [
                { x: A.x, y: A.y }, { x: A.x, y: by }, { x: cx - 60, y: by },
            ]);
            drawWire(ctx, [
                { x: C.x, y: C.y }, { x: C.x, y: by }, { x: cx + 60, y: by },
            ]);
            drawCellBattery(ctx, cx, by, bridgeEMF, 'horizontal');

            // node labels A, B, C, D (bold, large)
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 22px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            drawNodeBadge(ctx, A.x - 36, A.y, 'A');
            drawNodeBadge(ctx, B.x, B.y - 32, 'B');
            drawNodeBadge(ctx, C.x + 36, C.y, 'C');
            drawNodeBadge(ctx, D.x, D.y + 32, 'D');
            ctx.textBaseline = 'alphabetic';
        };

        // ============= PRIMITIVES =============

        // Smooth wire path with rounded joins
        function drawWire(ctx: CanvasRenderingContext2D, pts: Array<{ x: number; y: number }>) {
            ctx.save();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            pts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
            ctx.stroke();
            // inner highlight for "metallic" feel
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        function drawDashedLead(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        }

        // Realistic AA-cell battery: cylinder body, terminal nub, label ribbon
        function drawCellBattery(
            ctx: CanvasRenderingContext2D,
            x: number, y: number,
            emf: number,
            orient: 'vertical' | 'horizontal',
            label?: string
        ) {
            const sign = emf >= 0 ? 1 : -1;
            ctx.save();
            ctx.translate(x, y);
            if (orient === 'horizontal') ctx.rotate(Math.PI / 2);
            // body: tall capsule, vertical orientation
            const w = 56, h = 118;
            // shadow
            ctx.shadowColor = 'rgba(15,23,42,0.18)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 3;
            // shell
            const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
            g.addColorStop(0, '#94a3b8');
            g.addColorStop(0.45, '#e2e8f0');
            g.addColorStop(0.55, '#f8fafc');
            g.addColorStop(1, '#475569');
            ctx.fillStyle = g;
            roundRect(ctx, -w / 2, -h / 2, w, h, 10);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.stroke();
            // terminal nub on the + end (top if sign > 0, bottom otherwise)
            const nubY = sign > 0 ? -h / 2 : h / 2;
            ctx.fillStyle = '#cbd5e1';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.8;
            const nubH = 12;
            ctx.beginPath();
            ctx.rect(-12, nubY - (sign > 0 ? nubH : 0), 24, nubH);
            ctx.fill(); ctx.stroke();
            // label ribbon
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(-w / 2 + 3, -22, w - 6, 44);
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 1;
            ctx.strokeRect(-w / 2 + 3, -22, w - 6, 44);
            // EMF text on ribbon
            ctx.fillStyle = '#7c2d12';
            ctx.font = '900 18px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${Math.abs(emf).toFixed(1)} V`, 0, 0);
            // + / - badges
            ctx.font = '900 16px Inter, system-ui, sans-serif';
            ctx.fillStyle = sign > 0 ? '#dc2626' : '#1d4ed8';
            ctx.fillText('+', 0, -h / 2 + 16);
            ctx.fillStyle = sign > 0 ? '#1d4ed8' : '#dc2626';
            ctx.fillText('−', 0, h / 2 - 14);
            ctx.textBaseline = 'alphabetic';
            ctx.restore();
            // external label below
            if (label) {
                ctx.fillStyle = '#334155';
                ctx.font = '700 12px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(label, x, y + (orient === 'vertical' ? 82 : 0));
            }
        }

        // Element body: resistor with colour bands / filament bulb / diode schematic
        function drawElement(
            ctx: CanvasRenderingContext2D,
            x: number, y: number,
            type: ElementType,
            I: number, R: number,
            labelOverride?: string
        ) {
            if (type === 'resistor') drawResistorBody(ctx, x, y, R, labelOverride);
            else if (type === 'bulb') drawBulb(ctx, x, y, I, R);
            else drawDiode(ctx, x, y, I);
        }

        function drawResistorBody(
            ctx: CanvasRenderingContext2D,
            x: number, y: number,
            R: number,
            labelOverride?: string
        ) {
            ctx.save();
            ctx.translate(x, y);
            const w = 180, h = 56;
            // lead wires already covered by main wire; draw end caps
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(-w / 2 - 10, -8, 10, 16);
            ctx.fillRect(w / 2, -8, 10, 16);
            // ceramic body
            ctx.shadowColor = 'rgba(15,23,42,0.18)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 3;
            const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
            g.addColorStop(0, '#fde68a');
            g.addColorStop(0.5, '#f59e0b');
            g.addColorStop(1, '#b45309');
            ctx.fillStyle = g;
            roundRect(ctx, -w / 2, -h / 2, w, h, 26);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 2;
            ctx.stroke();
            // colour bands
            const bands = resistorBands(R);
            const bandX = [-w / 2 + 24, -w / 2 + 50, -w / 2 + 76, w / 2 - 24];
            bands.forEach((c, i) => {
                ctx.fillStyle = c;
                ctx.fillRect(bandX[i] - 7, -h / 2 + 4, 14, h - 8);
            });
            ctx.restore();
            // label below
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labelOverride ?? `Resistor · ${R.toFixed(0)} Ω`, x, y + h / 2 + 22);
        }

        function drawBulb(ctx: CanvasRenderingContext2D, x: number, y: number, I: number, R: number) {
            ctx.save();
            const glow = clamp(Math.abs(I * I * R) / 4, 0, 1);
            // glow halo first
            if (glow > 0.03) {
                const grd = ctx.createRadialGradient(x, y - 14, 6, x, y - 14, 130);
                grd.addColorStop(0, `rgba(254,240,138,${0.95 * glow})`);
                grd.addColorStop(0.4, `rgba(251,191,36,${0.55 * glow})`);
                grd.addColorStop(1, 'rgba(251,191,36,0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(x, y - 14, 130, 0, Math.PI * 2);
                ctx.fill();
            }
            // glass envelope
            ctx.translate(x, y);
            ctx.shadowColor = 'rgba(15,23,42,0.18)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 3;
            const g = ctx.createRadialGradient(-10, -14, 4, 0, -14, 64);
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.5, '#fef3c7');
            g.addColorStop(1, '#fde68a');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, -14, 56, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 2;
            ctx.stroke();
            // tungsten coil
            ctx.strokeStyle = glow > 0.05 ? '#dc2626' : '#475569';
            ctx.lineWidth = glow > 0.05 ? 3 : 2;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const px = -22 + i * 6;
                const py = -14 + (i % 2 === 0 ? 6 : -6);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
            // brass screw base
            const g2 = ctx.createLinearGradient(0, 32, 0, 64);
            g2.addColorStop(0, '#fbbf24');
            g2.addColorStop(1, '#92400e');
            ctx.fillStyle = g2;
            roundRect(ctx, -28, 32, 56, 22, 4);
            ctx.fill();
            ctx.strokeStyle = '#7c2d12';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // screw threads
            ctx.strokeStyle = 'rgba(120,53,15,0.5)';
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(-26, 37 + i * 5);
                ctx.lineTo(26, 37 + i * 5);
                ctx.stroke();
            }
            ctx.restore();
            // label below
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Filament bulb · ${R.toFixed(0)} Ω cold`, x, y + 80);
        }

        function drawDiode(ctx: CanvasRenderingContext2D, x: number, y: number, I: number) {
            ctx.save();
            ctx.translate(x, y);
            const w = 170, h = 56;
            // body (matte black package)
            ctx.shadowColor = 'rgba(15,23,42,0.22)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 3;
            const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
            g.addColorStop(0, '#334155');
            g.addColorStop(0.5, '#0f172a');
            g.addColorStop(1, '#1e293b');
            ctx.fillStyle = g;
            roundRect(ctx, -w / 2, -h / 2, w, h, 12);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            // cathode ring (right side) — white band
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(w / 2 - 24, -h / 2 + 2, 12, h - 4);
            // schematic triangle + bar (anode on left, cathode on right)
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(-40, -18); ctx.lineTo(20, 0); ctx.lineTo(-40, 18); ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(20, -20); ctx.lineTo(20, 20);
            ctx.stroke();
            // current indicator
            if (Math.abs(I) > 0.005) {
                ctx.fillStyle = I > 0 ? '#16a34a' : '#dc2626';
                ctx.font = '900 14px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(I > 0 ? 'FORWARD' : 'BLOCKED', 0, h / 2 - 6);
            }
            ctx.restore();
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Si diode · cut-in 0.7 V', x, y + h / 2 + 22);
        }

        // Big analog dial meter with swinging needle
        function drawAnalogMeter(
            ctx: CanvasRenderingContext2D,
            x: number, y: number,
            kind: 'A' | 'V',
            value: number, range: number,
            colour: string
        ) {
            const r = 58;
            ctx.save();
            ctx.translate(x, y);
            // shadow
            ctx.shadowColor = 'rgba(15,23,42,0.22)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 4;
            // case
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.stroke();
            // inner bezel
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, r - 8, 0, Math.PI * 2);
            ctx.stroke();
            // scale arc — from 210° to 330° around top (i.e. from -150° to -30°)
            const A0 = Math.PI * 1.15; // 207°
            const A1 = Math.PI * 1.85; // 333°
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, r - 18, A0, A1);
            ctx.stroke();
            // tick marks
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            for (let i = 0; i <= 10; i++) {
                const a = A0 + (i / 10) * (A1 - A0);
                const x1 = (r - 18) * Math.cos(a);
                const y1 = (r - 18) * Math.sin(a);
                const x2 = (r - (i % 5 === 0 ? 32 : 26)) * Math.cos(a);
                const y2 = (r - (i % 5 === 0 ? 32 : 26)) * Math.sin(a);
                ctx.beginPath();
                ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            // green safe zone (centre)
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, r - 12, A0 + (A1 - A0) * 0.4, A0 + (A1 - A0) * 0.6);
            ctx.stroke();
            // needle
            const norm = clamp(value / range, -1, 1);
            const ang = A0 + ((norm + 1) / 2) * (A1 - A0);
            ctx.save();
            ctx.rotate(ang);
            ctx.strokeStyle = colour;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(r - 22, 0);
            ctx.stroke();
            // counter-weight
            ctx.fillStyle = colour;
            ctx.beginPath();
            ctx.arc(-10, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            // pivot
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            // kind badge at bottom of dial
            ctx.fillStyle = colour;
            ctx.font = '900 22px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(kind, 0, r - 38);
            // digital readout below
            ctx.fillStyle = '#0f172a';
            ctx.font = '800 14px Inter, system-ui, sans-serif';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(`${value.toFixed(kind === 'A' ? 3 : 2)} ${kind === 'A' ? 'A' : 'V'}`, 0, r + 22);
            ctx.restore();
        }

        // Glowing electron flow dots (large, with arrow chevrons)
        function drawFlowDots(
            ctx: CanvasRenderingContext2D,
            segments: Array<{ ax: number; ay: number; bx: number; by: number }>,
            t: number, speed: number, dir: number
        ) {
            if (speed <= 0.01) return;
            ctx.save();
            const phase = ((t * speed * 0.0005) * dir) % 1;
            const perSeg = 8;
            // dots
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 18;
            for (let s = 0; s < segments.length; s++) {
                const seg = segments[s];
                for (let k = 0; k < perSeg; k++) {
                    const u = (k / perSeg + phase + 100) % 1;
                    const x = seg.ax + (seg.bx - seg.ax) * u;
                    const y = seg.ay + (seg.by - seg.ay) * u;
                    ctx.beginPath();
                    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.shadowColor = 'transparent';
            // direction chevrons (sparse, brighter)
            ctx.fillStyle = '#dc2626';
            for (let s = 0; s < segments.length; s++) {
                const seg = segments[s];
                const ang = Math.atan2(seg.by - seg.ay, seg.bx - seg.ax) + (dir > 0 ? 0 : Math.PI);
                for (let k = 0; k < 2; k++) {
                    const u = (k * 0.5 + ((phase * 2) % 0.5) + 1) % 1;
                    const x = seg.ax + (seg.bx - seg.ax) * u;
                    const y = seg.ay + (seg.by - seg.ay) * u;
                    ctx.save();
                    ctx.translate(x, y); ctx.rotate(ang);
                    ctx.beginPath();
                    ctx.moveTo(8, 0); ctx.lineTo(-4, 6); ctx.lineTo(-4, -6); ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            }
            ctx.restore();
        }

        // Wheatstone: rotated zig-zag resistor on a diamond edge
        function drawResistorOnEdge(
            ctx: CanvasRenderingContext2D,
            P: { x: number; y: number }, Q: { x: number; y: number },
            R: number, label: string
        ) {
            const mx = (P.x + Q.x) / 2;
            const my = (P.y + Q.y) / 2;
            const ang = Math.atan2(Q.y - P.y, Q.x - P.x);
            ctx.save();
            ctx.translate(mx, my);
            ctx.rotate(ang);
            const w = 120, h = 36;
            ctx.shadowColor = 'rgba(15,23,42,0.18)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 2;
            const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
            g.addColorStop(0, '#fde68a');
            g.addColorStop(0.5, '#f59e0b');
            g.addColorStop(1, '#b45309');
            ctx.fillStyle = g;
            roundRect(ctx, -w / 2, -h / 2, w, h, 18);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 2;
            ctx.stroke();
            // colour bands
            const bands = resistorBands(R);
            const bandX = [-w / 2 + 18, -w / 2 + 36, -w / 2 + 54, w / 2 - 18];
            bands.forEach((c, i) => {
                ctx.fillStyle = c;
                ctx.fillRect(bandX[i] - 4, -h / 2 + 2, 8, h - 4);
            });
            ctx.restore();
            // label outside diamond — always upright
            const nx = (Q.y - P.y) / Math.hypot(Q.x - P.x, Q.y - P.y);
            const ny = -(Q.x - P.x) / Math.hypot(Q.x - P.x, Q.y - P.y);
            const lx = mx + nx * 34;
            const ly = my + ny * 34;
            ctx.fillStyle = '#0f172a';
            ctx.font = '800 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${label} ${R.toFixed(0)}Ω`, lx, ly);
            ctx.textBaseline = 'alphabetic';
        }

        function drawGalvanometer(ctx: CanvasRenderingContext2D, x: number, y: number, deflection: number, balanced: boolean) {
            const r = 50;
            ctx.save();
            ctx.translate(x, y);
            ctx.shadowColor = 'rgba(15,23,42,0.22)';
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 3;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.stroke();
            // scale arc with negative-zero-positive zones
            const A0 = Math.PI * 1.15;
            const A1 = Math.PI * 1.85;
            const Amid = (A0 + A1) / 2;
            ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(0, 0, r - 12, A0, Amid - 0.04); ctx.stroke();
            ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(0, 0, r - 12, Amid - 0.04, Amid + 0.04); ctx.stroke();
            ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(0, 0, r - 12, Amid + 0.04, A1); ctx.stroke();
            // ticks
            for (let i = 0; i <= 10; i++) {
                const a = A0 + (i / 10) * (A1 - A0);
                const x1 = (r - 12) * Math.cos(a);
                const y1 = (r - 12) * Math.sin(a);
                const x2 = (r - (i === 5 ? 26 : 20)) * Math.cos(a);
                const y2 = (r - (i === 5 ? 26 : 20)) * Math.sin(a);
                ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            }
            // needle
            const ang = Amid + deflection * ((A1 - A0) / 2.4);
            ctx.save();
            ctx.rotate(ang);
            ctx.strokeStyle = balanced ? '#16a34a' : '#dc2626';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(r - 18, 0);
            ctx.stroke();
            ctx.restore();
            // pivot
            ctx.fillStyle = '#0f172a';
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
            // G label
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 24px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('G', 0, r - 28);
            ctx.textBaseline = 'alphabetic';
            ctx.restore();
        }

        function drawNodeBadge(ctx: CanvasRenderingContext2D, x: number, y: number, letter: string) {
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 18px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, x, y + 1);
            ctx.textBaseline = 'alphabetic';
            ctx.restore();
        }

        function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        let raf = 0;
        let previous = performance.now();
        const tick = (now = performance.now()) => {
            const dt = Math.min(100, Math.max(0, now - previous));
            previous = now;
            tRef.current += dt;
            draw(tRef.current);
            if (!paused) raf = requestAnimationFrame(tick);
        };
        tick();
        if (paused) draw(tRef.current);
        return () => cancelAnimationFrame(raf);
    }, [scene, paused, ohm, cellCombo, bridge, element, combo, emf1, emf2, r1, r2, reverse2, loadR, R1w, R2w, R3w, R4w, bridgeEMF, ohmR, ohmEMF]);

    // ===== Panels =====
    const graphPanel = (
        <aside
            className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20
                       hidden w-[340px] 2xl:block overflow-y-auto pr-1"
        >
            <div className="flex flex-col gap-2.5">
                {scene === 'ohm' && (
                    <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Live V–I trace</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §3.4 · operating point</div>
                            <OhmVIPlot
                                curve={ohm.traceCurve}
                                trace={traceRef.current}
                                range={ohm.range}
                                Vop={ohm.Vop}
                                Iop={ohm.Iop}
                                element={element}
                            />
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Element behaviour</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §3.4 · §3.6</div>
                            <ul className="text-xs leading-snug text-slate-700 list-disc pl-4 space-y-1">
                                <li><b className="text-cyan-700">Resistor</b>: straight V–I line → Ohm’s law.</li>
                                <li><b className="text-amber-700">Filament bulb</b>: bends as R rises with current (heating).</li>
                                <li><b className="text-red-700">Diode</b>: sign-dependent, non-linear V–I curve.</li>
                            </ul>
                        </div>
                    </>
                )}
                {scene === 'cells' && (
                    <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Cell combinations</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §3.11</div>
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center font-mono text-xs text-amber-900">
                                Series: ε_eq = ε₁ + ε₂,&nbsp; r_eq = r₁ + r₂
                            </div>
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center font-mono text-xs text-amber-900 mt-2">
                                Parallel: ε_eq = (ε₁r₂ + ε₂r₁)/(r₁ + r₂),&nbsp; r_eq = r₁r₂/(r₁+r₂)
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Operating point</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">ε_eq vs V_ext</div>
                            <CellsBars eEq={cellCombo.eEq} Vext={cellCombo.Vext} I={cellCombo.I} />
                        </div>
                    </>
                )}
                {scene === 'wheatstone' && (
                    <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Balance condition</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §3.13</div>
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center font-mono text-sm text-amber-900">
                                R₁ / R₂ = R₃ / R₄
                            </div>
                            <BalanceGauge dV={bridge.dV} EMF={bridgeEMF} balanced={bridge.balanced} />
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Kirchhoff's rules</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §3.12</div>
                            <ul className="text-xs leading-snug text-slate-700 list-disc pl-4 space-y-1">
                                <li><b>Junction:</b> Σ I_in = Σ I_out.</li>
                                <li><b>Loop:</b> Σ ΔV around closed loop = 0.</li>
                            </ul>
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
                        {scene === 'ohm' ? 'Ohm’s Law & V–I' : scene === 'cells' ? 'Cells & Terminal Voltage' : 'Wheatstone Bridge'}
                    </div>
                    <div className="text-xs font-semibold text-amber-700 mb-2">
                        {scene === 'ohm' ? 'NCERT Ch 3 · §3.4–§3.6'
                            : scene === 'cells' ? 'NCERT Ch 3 · §3.9–§3.11'
                                : 'NCERT Ch 3 · §3.12–§3.13'}
                    </div>
                    {scene === 'ohm' && (
                        <>
                            <p className="text-sm leading-snug text-amber-950">V = IR holds for an Ohmic resistor — a straight V–I line.</p>
                            <p className="text-sm leading-snug text-amber-950 mt-2">Filament bulb and diode are <b>non-Ohmic</b> — the I–V relation is not linear / not unique / sign-dependent.</p>
                        </>
                    )}
                    {scene === 'cells' && (
                        <>
                            <p className="text-sm leading-snug text-amber-950">A real cell has internal resistance r. Connected to load R:&nbsp; V_ext = ε·R/(R+r).</p>
                            <p className="text-sm leading-snug text-amber-950 mt-2">Series boosts ε. Parallel cuts r (raises current capacity).</p>
                        </>
                    )}
                    {scene === 'wheatstone' && (
                        <>
                            <p className="text-sm leading-snug text-amber-950">Four resistors form a diamond, with battery on one diagonal and a galvanometer on the other.</p>
                            <p className="text-sm leading-snug text-amber-950 mt-2">At balance R₁/R₂ = R₃/R₄, the galvanometer reads zero — an EMF-independent way to measure an unknown R.</p>
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
                        {scene === 'ohm' && (
                            <>
                                <ValueRow label="V across element" value={`${ohm.Vop.toFixed(2)} V`} />
                                <ValueRow label="Current I" value={`${ohm.Iop.toFixed(3)} A`} />
                                <ValueRow label="Power P = VI" value={`${ohm.P.toFixed(2)} W`} />
                                <ValueRow label="Element" value={element[0].toUpperCase() + element.slice(1)} />
                            </>
                        )}
                        {scene === 'cells' && (
                            <>
                                <ValueRow label="ε_eq" value={`${cellCombo.eEq.toFixed(2)} V`} />
                                <ValueRow label="r_eq" value={`${cellCombo.rEq.toFixed(2)} Ω`} />
                                <ValueRow label="Loop current I" value={`${cellCombo.I.toFixed(3)} A`} />
                                <ValueRow label="Terminal V across load" value={`${cellCombo.Vext.toFixed(2)} V`} />
                                {combo === 'parallel' && <ValueRow label="Cell 1 branch current" value={`${cellCombo.I1.toFixed(3)} A`} />}
                                {combo === 'parallel' && <ValueRow label="Cell 2 branch current" value={`${cellCombo.I2.toFixed(3)} A`} />}
                                <ValueRow label="Combination" value={combo === 'series' ? 'Series' : 'Parallel'} />
                                {combo === 'parallel' && (cellCombo.I1 < 0 || cellCombo.I2 < 0) && (
                                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">
                                        A negative branch current means that cell is being charged by the other cell.
                                    </div>
                                )}
                            </>
                        )}
                        {scene === 'wheatstone' && (
                            <>
                                <ValueRow label="V_B − V_D" value={`${bridge.dV.toFixed(3)} V`} />
                                <ValueRow label="I_top branch" value={`${bridge.I_top.toFixed(3)} A`} />
                                <ValueRow label="I_bot branch" value={`${bridge.I_bot.toFixed(3)} A`} />
                                <ValueRow label="R₄ for balance" value={`${bridge.balanceR4.toFixed(1)} Ω`} />
                                <ValueRow label="Status" value={bridge.balanced ? 'BALANCED' : 'unbalanced'} />
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
                    className="absolute inset-0 h-full w-full"
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
                <span className="font-extrabold text-base">Current Electricity Bench</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:col-span-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Scene</div>
                    <div className="grid grid-cols-3 gap-1">
                        <ModeButton active={scene === 'ohm'} onClick={() => setScene('ohm')} icon={<Gauge size={14} />} label="Ohm / V–I" />
                        <ModeButton active={scene === 'cells'} onClick={() => setScene('cells')} icon={<Battery size={14} />} label="Cells" />
                        <ModeButton active={scene === 'wheatstone'} onClick={() => setScene('wheatstone')} icon={<CircuitBoard size={14} />} label="Wheatstone" />
                    </div>
                </div>

                {scene === 'ohm' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Element</div>
                            <div className="grid grid-cols-3 gap-1 mb-2">
                                <ModeButton active={element === 'resistor'} onClick={() => setElement('resistor')} icon={<span className="text-[12px]">/\/</span>} label="Resistor" />
                                <ModeButton active={element === 'bulb'} onClick={() => setElement('bulb')} icon={<span className="text-[12px]">💡</span>} label="Bulb" />
                                <ModeButton active={element === 'diode'} onClick={() => setElement('diode')} icon={<span className="text-[12px]">▷|</span>} label="Diode" />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none">
                                <input type="checkbox" checked={traceMode} onChange={e => { setTraceMode(e.target.checked); traceRef.current = []; }} className="w-4 h-4 accent-amber-600" />
                                Build live V–I trace
                            </label>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="Battery EMF" value={ohmEMF} min={-10} max={10} step={0.1} unit="V" onChange={setOhmEMF} />
                            <div className="h-2" />
                            <SliderRow label="Resistance R" value={ohmR} min={1} max={100} step={1} unit="Ω" onChange={setOhmR} />
                        </div>
                    </>
                )}

                {scene === 'cells' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Combination</div>
                            <div className="grid grid-cols-2 gap-1 mb-2">
                                <ModeButton active={combo === 'series'} onClick={() => setCombo('series')} icon={<span className="text-[12px]">⎓⎓</span>} label="Series" />
                                <ModeButton active={combo === 'parallel'} onClick={() => setCombo('parallel')} icon={<span className="text-[12px]">⫴</span>} label="Parallel" />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 select-none">
                                <input type="checkbox" checked={reverse2} onChange={e => setReverse2(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                                Reverse cell 2
                            </label>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="Load R" value={loadR} min={0.5} max={50} step={0.5} unit="Ω" onChange={setLoadR} />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="ε₁" value={emf1} min={0.5} max={12} step={0.1} unit="V" onChange={setEmf1} />
                            <div className="h-2" />
                            <SliderRow label="r₁" value={r1} min={0.1} max={5} step={0.1} unit="Ω" onChange={setR1} />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="ε₂" value={emf2} min={0.5} max={12} step={0.1} unit="V" onChange={setEmf2} />
                            <div className="h-2" />
                            <SliderRow label="r₂" value={r2} min={0.1} max={5} step={0.1} unit="Ω" onChange={setR2} />
                        </div>
                    </>
                )}

                {scene === 'wheatstone' && (
                    <>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="Battery EMF" value={bridgeEMF} min={1} max={12} step={0.5} unit="V" onChange={setBridgeEMF} />
                            <button
                                type="button"
                                disabled={bridge.balanceR4 < 10 || bridge.balanceR4 > 500}
                                onClick={() => setR4w(Math.round(bridge.balanceR4))}
                                className="mt-3 w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                Balance bridge automatically
                            </button>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="R₁" value={R1w} min={10} max={500} step={5} unit="Ω" onChange={setR1w} />
                            <div className="h-2" />
                            <SliderRow label="R₂" value={R2w} min={10} max={500} step={5} unit="Ω" onChange={setR2w} />
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <SliderRow label="R₃" value={R3w} min={10} max={500} step={5} unit="Ω" onChange={setR3w} />
                            <div className="h-2" />
                            <SliderRow label="R₄ (unknown)" value={R4w} min={10} max={500} step={1} unit="Ω" onChange={setR4w} />
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

// ===== Subcomponents (panels & SVG cards) =====
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

interface SliderRowProps {
    label: string; value: number; min: number; max: number; step: number; unit: string;
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
            min={min} max={max} step={step} value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 accent-amber-500"
        />
    </div>
);

// V–I plot in the left aside (replaces the on-canvas overlay)
const OhmVIPlot: React.FC<{
    curve: Array<{ V: number; I: number }>;
    trace: Array<{ V: number; I: number }>;
    range: number; Vop: number; Iop: number;
    element: ElementType;
}> = ({ curve, trace, range, Vop, Iop, element }) => {
    const w = 320, h = 200;
    const x0 = w / 2, y0 = h / 2;
    const maxI = Math.max(0.1, ...curve.map(p => Math.abs(p.I)));
    const xs = (V: number) => x0 + (V / range) * (w / 2 - 22);
    const ys = (I: number) => y0 - (I / maxI) * (h / 2 - 18);
    const stroke = element === 'resistor' ? '#0891b2' : element === 'bulb' ? '#d97706' : '#dc2626';
    const path = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs(p.V).toFixed(1)} ${ys(p.I).toFixed(1)}`).join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[200px]">
            <line x1="12" y1={y0} x2={w - 12} y2={y0} stroke="#94a3b8" strokeWidth="1" />
            <line x1={x0} y1="12" x2={x0} y2={h - 12} stroke="#94a3b8" strokeWidth="1" />
            <text x={w - 18} y={y0 - 6} fontSize="10" fill="#64748b" fontWeight="700">V</text>
            <text x={x0 + 6} y="20" fontSize="10" fill="#64748b" fontWeight="700">I</text>
            <path d={path} stroke={stroke} strokeWidth="2.5" fill="none" />
            {trace.map((p, i) => (
                <circle key={i} cx={xs(p.V)} cy={ys(p.I)} r="1.6" fill="#16a34a" />
            ))}
            <circle cx={xs(Vop)} cy={ys(Iop)} r="6" fill="#dc2626" stroke="#fff" strokeWidth="2" />
        </svg>
    );
};

// Cells: ε_eq vs V_ext bar comparison
const CellsBars: React.FC<{ eEq: number; Vext: number; I: number }> = ({ eEq, Vext, I }) => {
    const w = 320, h = 130;
    const scale = Math.max(0.5, Math.max(Math.abs(eEq), Math.abs(Vext)) + 1);
    const barH = 30;
    const xZero = 30;
    const xMax = w - 18;
    const bar = (v: number) => ((v / scale) * (xMax - xZero));
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[130px]">
            <text x="0" y="22" fontSize="11" fill="#475569" fontWeight="700">ε_eq</text>
            <rect x={xZero} y="10" width={bar(eEq)} height={barH} rx="4" fill="#1d4ed8" />
            <text x={xZero + bar(eEq) + 6} y="30" fontSize="11" fill="#1d4ed8" fontWeight="800">{eEq.toFixed(2)} V</text>
            <text x="0" y="66" fontSize="11" fill="#475569" fontWeight="700">V_ext</text>
            <rect x={xZero} y="54" width={bar(Vext)} height={barH} rx="4" fill="#16a34a" />
            <text x={xZero + bar(Vext) + 6} y="74" fontSize="11" fill="#16a34a" fontWeight="800">{Vext.toFixed(2)} V</text>
            <text x="0" y="110" fontSize="11" fill="#475569" fontWeight="700">I</text>
            <rect x={xZero} y="98" width={Math.min(xMax - xZero, Math.abs(I) * 80)} height={barH - 8} rx="4" fill="#dc2626" />
            <text x={xZero + Math.min(xMax - xZero, Math.abs(I) * 80) + 6} y="115" fontSize="11" fill="#dc2626" fontWeight="800">{I.toFixed(3)} A</text>
        </svg>
    );
};

// Wheatstone: null-pointer-style balance gauge
const BalanceGauge: React.FC<{ dV: number; EMF: number; balanced: boolean }> = ({ dV, EMF, balanced }) => {
    const w = 320, h = 120;
    const cx = w / 2, cy = h - 18;
    const r = 90;
    const norm = clamp(dV / (EMF * 0.5), -1, 1);
    const ang = -Math.PI / 2 + norm * Math.PI / 3;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[120px] mt-2">
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#cbd5e1" strokeWidth="3" />
            <path d={`M ${cx - r * 0.13} ${cy - Math.sqrt(r * r - (r * 0.13) ** 2)} A ${r} ${r} 0 0 1 ${cx + r * 0.13} ${cy - Math.sqrt(r * r - (r * 0.13) ** 2)}`} fill="none" stroke="#16a34a" strokeWidth="4" />
            <line x1={cx} y1={cy} x2={cx + (r - 8) * Math.cos(ang)} y2={cy + (r - 8) * Math.sin(ang)}
                stroke={balanced ? '#16a34a' : '#dc2626'} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="5" fill="#0f172a" />
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fontWeight="800"
                fill={balanced ? '#16a34a' : '#0f172a'}>
                {balanced ? '✓ BALANCED' : `ΔV = ${dV.toFixed(3)} V`}
            </text>
        </svg>
    );
};

export default CurrentElectricityLab;
