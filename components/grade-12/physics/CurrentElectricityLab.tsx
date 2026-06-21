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
        // R rises with current (heating). Iteratively solve: R_eff = R(1 + α·I²) ; α visualization-tuned
        let I = V / R;
        for (let k = 0; k < 12; k++) {
            const Reff = R * (1 + 0.6 * I * I);
            I = V / Reff;
        }
        return I;
    }
    // Qualitative diode curve used by NCERT to illustrate a non-ohmic device.
    // A smooth knee avoids a discontinuity while reverse breakdown is out of scope.
    const knee = 0.7;
    if (V <= 0) return -0.00002 * (1 - Math.exp(Math.max(V, -10) / 2));
    if (V < knee) return 0.00002 * (Math.exp((V / knee) * 5) - 1);
    return (V - knee) / Math.max(R, 0.5) + 0.003;
};

const CurrentElectricityLab: React.FC<CurrentElectricityLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scene, setScene] = useState<Scene>('ohm');
    const [paused, setPaused] = useState(false);

    // ----- Ohm scene state -----
    const [ohmEMF, setOhmEMF] = useState(6);            // V
    const [ohmR, setOhmR] = useState(10);               // Ω
    const [element, setElement] = useState<ElementType>('resistor');
    const [traceMode, setTraceMode] = useState(true);   // build live V–I trace
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
        // For the V–I curve: vary V across element from -ohmEMF to +ohmEMF
        const traceCurve: Array<{ V: number; I: number }> = [];
        const range = Math.max(2, Math.abs(ohmEMF) + 2);
        for (let i = 0; i <= 80; i++) {
            const V = -range + (i / 80) * (2 * range);
            traceCurve.push({ V, I: currentThroughElement(V, element, ohmR) });
        }
        // Operating point: actual circuit has battery ohmEMF and (element + R_internal small). Use element response with full applied V (assume negligible series wire R).
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
        // NCERT Eqs. 3.56-3.57, including an opposed cell via e2 < 0.
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
        // Two parallel branches: top branch R1 then R2, bottom branch R3 then R4 (between A and C through B and D).
        // For diagnostic, we compute potentials at B and D when no current flows through galvanometer (assume open galvanometer).
        const I_top = bridgeEMF / (R1w + R2w);
        const I_bot = bridgeEMF / (R3w + R4w);
        // V_A = bridgeEMF, V_C = 0
        const Vb = bridgeEMF - I_top * R1w;
        const Vd = bridgeEMF - I_bot * R3w;
        const dV = Vb - Vd;
        // Galvanometer needle deflection 0..1 mapped from dV
        const deflection = clamp(dV / (bridgeEMF * 0.5), -1, 1);
        const balanced = Math.abs(deflection) < 0.005;
        const balanceR4 = (R2w * R3w) / R1w;
        return { I_top, I_bot, Vb, Vd, dV, deflection, balanced, balanceR4 };
    }, [R1w, R2w, R3w, R4w, bridgeEMF]);

    // Append to live V–I trace (Ohm scene)
    useEffect(() => {
        if (scene !== 'ohm' || !traceMode) return;
        traceRef.current.push({ V: ohm.Vop, I: ohm.Iop });
        if (traceRef.current.length > 220) traceRef.current.shift();
    }, [scene, traceMode, ohm.Vop, ohm.Iop]);

    // Reset trace when element changes
    useEffect(() => { traceRef.current = []; }, [element]);

    const handleReset = useCallback(() => {
        setScene('ohm');
        setPaused(false);
        setOhmEMF(6); setOhmR(10); setElement('resistor'); setTraceMode(true); traceRef.current = [];
        setCombo('series'); setEmf1(6); setEmf2(6); setR1(1); setR2(1); setReverse2(false); setLoadR(10);
        setR1w(100); setR2w(100); setR3w(100); setR4w(100); setBridgeEMF(6);
    }, []);

    // ----- Draw -----
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = (t: number) => {
            const background = ctx.createLinearGradient(0, 0, W, H);
            background.addColorStop(0, '#f8fafc');
            background.addColorStop(0.55, '#fffdf5');
            background.addColorStop(1, '#eff6ff');
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, W, H);

            ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
            ctx.lineWidth = 1;
            for (let x = 0; x <= W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (let y = 0; y <= H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

            ctx.fillStyle = '#0f172a';
            ctx.font = '600 16px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(
                scene === 'ohm' ? 'Ohm’s law & V–I behaviour (resistor · filament · diode)'
                    : scene === 'cells' ? 'Cells in series / parallel — EMF, internal r, terminal V'
                        : 'Wheatstone bridge — balance condition R₁/R₂ = R₃/R₄',
                24, 28
            );

            if (scene === 'ohm') drawOhmScene(ctx, t);
            else if (scene === 'cells') drawCellsScene(ctx, t);
            else drawBridgeScene(ctx, t);

            // Hint
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            const hint =
                scene === 'ohm' ? 'Watch the V–I trace. Switch element to see Ohm-obeying vs non-Ohmic behaviour.'
                    : scene === 'cells' ? 'Toggle series ↔ parallel; reverse cell-2 to see ε_eq subtract.'
                        : 'Slide R₄ until the galvanometer needle hits zero — balance!';
            ctx.fillText(hint, 24, 736);
        };

        // ===== Ohm scene =====
        const drawOhmScene = (ctx: CanvasRenderingContext2D, t: number) => {
            // Simple loop circuit
            const cx = W / 2;
            const cy = H / 2 + 20;
            const loopW = 720;
            const loopH = 260;
            const left = cx - loopW / 2;
            const right = cx + loopW / 2;
            const top = cy - loopH / 2;
            const bot = cy + loopH / 2;

            // Wires
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(left, top); ctx.lineTo(right, top);
            ctx.moveTo(right, top); ctx.lineTo(right, bot);
            ctx.moveTo(right, bot); ctx.lineTo(left, bot);
            ctx.moveTo(left, bot); ctx.lineTo(left, top);
            ctx.stroke();

            // Battery on left edge
            drawBattery(ctx, left, cy, ohmEMF, 'vertical');

            // Element on top edge (centre)
            drawElement(ctx, cx, top, element, ohm.Iop, ohmR);

            // Ammeter on right edge
            drawMeter(ctx, right, cy, 'A', ohm.Iop.toFixed(2) + ' A', '#dc2626');

            // Voltmeter across element (above)
            drawMeter(ctx, cx, top - 90, 'V', ohm.Vop.toFixed(2) + ' V', '#1d4ed8');
            ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(cx - 50, top); ctx.lineTo(cx - 50, top - 70);
            ctx.moveTo(cx + 50, top); ctx.lineTo(cx + 50, top - 70);
            ctx.stroke();
            ctx.setLineDash([]);

            // Animated conventional-current markers, with direction set by the sign of I.
            const dir = ohm.Iop >= 0 ? 1 : -1;
            const speed = Math.abs(ohm.Iop) < 1e-6 ? 0 : clamp(Math.abs(ohm.Iop) * 60, 8, 220);
            drawFlowDots(ctx, [
                { ax: left, ay: top, bx: right, by: top },
                { ax: right, ay: top, bx: right, by: bot },
                { ax: right, ay: bot, bx: left, by: bot },
                { ax: left, ay: bot, bx: left, by: top },
            ], t, speed, dir);

            // Live V–I plot overlay (bottom-left corner of canvas)
            drawVIPlot(ctx, ohm.traceCurve, traceRef.current, ohm.range, ohm.Iop, ohm.Vop);
        };

        // ===== Cells scene =====
        const drawCellsScene = (ctx: CanvasRenderingContext2D, t: number) => {
            const cx = W / 2;
            const cy = H / 2 + 10;
            const loopW = 760;
            const loopH = 280;
            const left = cx - loopW / 2;
            const right = cx + loopW / 2;
            const top = cy - loopH / 2;
            const bot = cy + loopH / 2;

            // Wires
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(left, top); ctx.lineTo(right, top);
            ctx.moveTo(right, top); ctx.lineTo(right, bot);
            ctx.moveTo(right, bot); ctx.lineTo(left, bot);
            ctx.moveTo(left, bot); ctx.lineTo(left, top);
            ctx.stroke();

            if (combo === 'series') {
                // Two cells on left edge stacked
                drawBattery(ctx, left, cy - 70, emf1, 'vertical', `ε₁=${emf1.toFixed(1)} r₁=${r1.toFixed(1)}Ω`);
                drawBattery(ctx, left, cy + 70, reverse2 ? -emf2 : emf2, 'vertical', `ε₂=${emf2.toFixed(1)} r₂=${r2.toFixed(1)}Ω${reverse2 ? ' ↺' : ''}`);
            } else {
                // Two cells in parallel — each on its own branch above and below the central wire
                drawBattery(ctx, left - 60, cy - 70, emf1, 'vertical', `ε₁=${emf1.toFixed(1)} r₁=${r1.toFixed(1)}Ω`);
                drawBattery(ctx, left + 60, cy - 70, reverse2 ? -emf2 : emf2, 'vertical', `ε₂=${emf2.toFixed(1)} r₂=${r2.toFixed(1)}Ω${reverse2 ? ' ↺' : ''}`);
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(left, top); ctx.lineTo(left - 60, top); ctx.lineTo(left - 60, cy - 100);
                ctx.moveTo(left, bot); ctx.lineTo(left - 60, bot); ctx.lineTo(left - 60, cy - 40);
                ctx.moveTo(left + 60, cy - 100); ctx.lineTo(left + 60, top);
                ctx.moveTo(left + 60, cy - 40); ctx.lineTo(left + 60, bot);
                ctx.stroke();
            }

            // Load resistor on right edge
            drawElement(ctx, right, cy, 'resistor', cellCombo.I, loadR, 'load');

            // Ammeter top
            drawMeter(ctx, cx, top, 'A', cellCombo.I.toFixed(2) + ' A', '#dc2626');
            // Voltmeter across load (right side)
            drawMeter(ctx, right + 100, cy, 'V', cellCombo.Vext.toFixed(2) + ' V', '#1d4ed8');
            ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(right + 18, cy - 30); ctx.lineTo(right + 80, cy - 30);
            ctx.moveTo(right + 18, cy + 30); ctx.lineTo(right + 80, cy + 30);
            ctx.stroke();
            ctx.setLineDash([]);

            // Flow dots
            const dir = cellCombo.I >= 0 ? 1 : -1;
            const speed = Math.abs(cellCombo.I) < 1e-6 ? 0 : clamp(Math.abs(cellCombo.I) * 60, 6, 200);
            drawFlowDots(ctx, [
                { ax: left, ay: top, bx: right, by: top },
                { ax: right, ay: top, bx: right, by: bot },
                { ax: right, ay: bot, bx: left, by: bot },
                { ax: left, ay: bot, bx: left, by: top },
            ], t, speed, dir);

            // Equivalent cell card on canvas (small)
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`ε_eq = ${cellCombo.eEq.toFixed(2)} V`, 24, 60);
            ctx.fillText(`r_eq = ${cellCombo.rEq.toFixed(2)} Ω`, 24, 80);
            ctx.font = '600 12px Inter, system-ui, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(`Load R = ${loadR.toFixed(1)} Ω`, 24, 98);
        };

        // ===== Wheatstone scene =====
        const drawBridgeScene = (ctx: CanvasRenderingContext2D, _t: number) => {
            const cx = W / 2;
            const cy = H / 2 + 10;
            const size = 260;
            const A = { x: cx - size, y: cy };       // left vertex
            const C = { x: cx + size, y: cy };       // right vertex
            const B = { x: cx, y: cy - size * 0.75 };// top
            const D = { x: cx, y: cy + size * 0.75 };// bottom

            // Edges
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
            ctx.lineTo(C.x, C.y);
            ctx.lineTo(D.x, D.y);
            ctx.lineTo(A.x, A.y);
            ctx.stroke();

            // Resistors at midpoints
            drawResistorOnEdge(ctx, A, B, `R₁=${R1w.toFixed(0)}Ω`, '#dc2626');
            drawResistorOnEdge(ctx, B, C, `R₂=${R2w.toFixed(0)}Ω`, '#d97706');
            drawResistorOnEdge(ctx, A, D, `R₃=${R3w.toFixed(0)}Ω`, '#0891b2');
            drawResistorOnEdge(ctx, D, C, `R₄=${R4w.toFixed(0)}Ω`, '#16a34a');

            // Galvanometer on B–D diagonal
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(B.x, B.y); ctx.lineTo(D.x, D.y);
            ctx.stroke();
            drawGalvanometer(ctx, (B.x + D.x) / 2, (B.y + D.y) / 2, bridge.deflection, bridge.balanced);

            // Battery A–C (below the bridge)
            const bx = cx;
            const by = cy + size + 40;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(A.x, A.y); ctx.lineTo(A.x, by); ctx.lineTo(bx - 40, by);
            ctx.moveTo(C.x, C.y); ctx.lineTo(C.x, by); ctx.lineTo(bx + 40, by);
            ctx.stroke();
            drawBattery(ctx, bx, by, bridgeEMF, 'horizontal', `EMF = ${bridgeEMF.toFixed(1)} V`);

            // Labels for A, B, C, D
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('A', A.x - 16, A.y + 5);
            ctx.fillText('B', B.x, B.y - 12);
            ctx.fillText('C', C.x + 16, C.y + 5);
            ctx.fillText('D', D.x, D.y + 22);

            // Balance hint on canvas
            ctx.fillStyle = bridge.balanced ? '#16a34a' : '#0f172a';
            ctx.font = '700 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(
                bridge.balanced
                    ? '✓ BALANCED: R₁/R₂ = R₃/R₄ → I_g = 0'
                    : `Imbalance: V_B − V_D = ${bridge.dV.toFixed(3)} V  (try R₄ ≈ ${bridge.balanceR4.toFixed(1)} Ω)`,
                24, 60
            );
        };

        // ===== drawing primitives =====
        const drawBattery = (
            ctx: CanvasRenderingContext2D,
            x: number, y: number,
            emf: number,
            orient: 'vertical' | 'horizontal',
            label?: string
        ) => {
            const sign = emf >= 0 ? 1 : -1;
            ctx.fillStyle = '#f1f5f9';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            if (orient === 'vertical') {
                ctx.beginPath();
                ctx.roundRect(x - 22, y - 28, 44, 56, 6);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = sign > 0 ? '#dc2626' : '#1d4ed8';
                ctx.font = '900 18px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('+', x, y - 10);
                ctx.fillStyle = sign > 0 ? '#1d4ed8' : '#dc2626';
                ctx.fillText('−', x, y + 18);
            } else {
                ctx.beginPath();
                ctx.roundRect(x - 28, y - 22, 56, 44, 6);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = sign > 0 ? '#dc2626' : '#1d4ed8';
                ctx.font = '900 18px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('+', x - 12, y + 6);
                ctx.fillStyle = sign > 0 ? '#1d4ed8' : '#dc2626';
                ctx.fillText('−', x + 12, y + 6);
            }
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            const lbl = label ?? `${Math.abs(emf).toFixed(1)} V`;
            if (orient === 'vertical') ctx.fillText(lbl, x, y + 50);
            else ctx.fillText(lbl, x, y + 42);
        };

        const drawElement = (
            ctx: CanvasRenderingContext2D,
            x: number, y: number,
            type: ElementType,
            I: number,
            R: number,
            tagOverride?: string
        ) => {
            const w = 110, h = 30;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x - w / 2, y - h / 2, w, h, 8);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 13px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                tagOverride
                    ? `${tagOverride} R=${R.toFixed(1)}Ω`
                    : type === 'resistor' ? `Resistor R=${R.toFixed(1)}Ω`
                        : type === 'bulb' ? `Filament bulb (≈${R.toFixed(1)}Ω cold)`
                            : 'Diode (schematic knee)',
                x, y + 5
            );
            // glow if bulb and current is high
            if (type === 'bulb') {
                const glow = clamp(Math.abs(I) / 0.8, 0, 1);
                if (glow > 0.05) {
                    const grd = ctx.createRadialGradient(x, y - 24, 4, x, y - 24, 50);
                    grd.addColorStop(0, `rgba(253,224,71,${0.85 * glow})`);
                    grd.addColorStop(1, 'rgba(253,224,71,0)');
                    ctx.fillStyle = grd;
                    ctx.beginPath();
                    ctx.arc(x, y - 24, 50, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        };

        const drawMeter = (
            ctx: CanvasRenderingContext2D,
            x: number, y: number,
            kind: 'A' | 'V',
            readout: string,
            colour: string
        ) => {
            const r = 30;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = colour;
            ctx.font = '900 18px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(kind, x, y - 2);
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 12px Inter, system-ui, sans-serif';
            ctx.fillText(readout, x, y + r + 14);
        };

        const drawFlowDots = (
            ctx: CanvasRenderingContext2D,
            segments: Array<{ ax: number; ay: number; bx: number; by: number }>,
            t: number, speed: number, dir: number
        ) => {
            if (speed <= 0.01) return;
            ctx.save();
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 12;
            const total = segments.length;
            const phase = (t * speed * 0.001) % 1;
            const perSeg = 6;
            for (let s = 0; s < total; s++) {
                const seg = segments[s];
                for (let k = 0; k < perSeg; k++) {
                    const u = (k / perSeg + phase * dir + 100) % 1;
                    const x = seg.ax + (seg.bx - seg.ax) * u;
                    const y = seg.ay + (seg.by - seg.ay) * u;
                    ctx.beginPath();
                    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        };

        const drawVIPlot = (
            ctx: CanvasRenderingContext2D,
            curve: Array<{ V: number; I: number }>,
            trace: Array<{ V: number; I: number }>,
            range: number,
            Iop: number, Vop: number
        ) => {
            const px = 32;
            const py = H - 200;
            const pw = 360;
            const ph = 160;
            // panel
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(px, py, pw, ph, 10);
            ctx.fill(); ctx.stroke();

            // axes
            const x0 = px + pw / 2;
            const y0 = py + ph / 2;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px + 10, y0); ctx.lineTo(px + pw - 10, y0);
            ctx.moveTo(x0, py + 24); ctx.lineTo(x0, py + ph - 10);
            ctx.stroke();
            ctx.fillStyle = '#64748b';
            ctx.font = '11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('I', x0 - 5, py + 22);
            ctx.textAlign = 'left';
            ctx.fillText('V', px + pw - 20, y0 - 6);
            ctx.fillStyle = '#0f172a';
            ctx.font = '700 12px Inter, system-ui, sans-serif';
            ctx.fillText('Live V–I trace', px + 12, py + 16);

            const xs = (v: number) => x0 + (v / range) * (pw / 2 - 18);
            const maxI = Math.max(0.1, ...curve.map(p => Math.abs(p.I)));
            const ys = (I: number) => y0 - (I / maxI) * (ph / 2 - 14);

            // theoretical curve
            ctx.save();
            ctx.beginPath();
            ctx.rect(px + 2, py + 24, pw - 4, ph - 26);
            ctx.clip();
            ctx.strokeStyle = element === 'resistor' ? '#0891b2' : element === 'bulb' ? '#d97706' : '#dc2626';
            ctx.lineWidth = 2;
            ctx.beginPath();
            curve.forEach((p, i) => {
                const x = xs(p.V); const y = ys(p.I);
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // live trace dots
            ctx.fillStyle = '#16a34a';
            trace.forEach(p => {
                ctx.beginPath();
                ctx.arc(xs(p.V), ys(p.I), 2, 0, Math.PI * 2);
                ctx.fill();
            });

            // operating-point marker
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(xs(Vop), ys(Iop), 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        const drawResistorOnEdge = (
            ctx: CanvasRenderingContext2D,
            P: { x: number; y: number }, Q: { x: number; y: number },
            label: string, colour: string
        ) => {
            const mx = (P.x + Q.x) / 2;
            const my = (P.y + Q.y) / 2;
            ctx.save();
            ctx.translate(mx, my);
            const ang = Math.atan2(Q.y - P.y, Q.x - P.x);
            ctx.rotate(ang);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = colour;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(-40, -12, 80, 24, 6);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = colour;
            ctx.font = '700 12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, 0, 1);
            ctx.textBaseline = 'alphabetic';
            ctx.restore();
        };

        const drawGalvanometer = (
            ctx: CanvasRenderingContext2D,
            x: number, y: number,
            deflection: number, balanced: boolean
        ) => {
            const r = 36;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
            // scale arc
            ctx.strokeStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.arc(x, y, r - 6, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
            // needle
            const angle = -Math.PI / 2 + deflection * Math.PI / 3;
            ctx.strokeStyle = balanced ? '#16a34a' : '#dc2626';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * (r - 8), y + Math.sin(angle) * (r - 8));
            ctx.stroke();
            // label
            ctx.fillStyle = '#0f172a';
            ctx.font = '900 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('G', x, y + r + 14);
        };

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
    }, [scene, paused, ohm, cellCombo, bridge, element, combo, emf1, emf2, r1, r2, reverse2, loadR, R1w, R2w, R3w, R4w, bridgeEMF]);

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
                            <div className="text-base font-extrabold text-slate-900">Element behaviour</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §3.4 · §3.6</div>
                            <ul className="text-xs leading-snug text-slate-700 list-disc pl-4 space-y-1">
                                <li><b className="text-cyan-700">Resistor</b>: straight V–I line → Ohm’s law.</li>
                                <li><b className="text-amber-700">Filament bulb</b>: bends as R rises with current (heating).</li>
                                <li><b className="text-red-700">Diode</b>: sign-dependent, non-linear V–I curve (qualitative, not to scale).</li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Geometry of R</div>
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center font-mono text-sm text-amber-900 mt-1">R = ρ · ℓ / A</div>
                            <p className="text-xs leading-snug text-slate-700 mt-2">Longer/thinner wire → higher R. σ = 1/ρ.</p>
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
                            <p className="text-xs leading-snug text-slate-700 mt-2">Reverse a cell → its ε enters with a minus sign.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Real cell, real load</div>
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center font-mono text-sm text-amber-900 mt-1">
                                V_ext = ε · R / (R + r)
                            </div>
                            <p className="text-xs leading-snug text-slate-700 mt-2">Internal r causes terminal V to sag as current rises.</p>
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
                            <p className="text-xs leading-snug text-slate-700 mt-2">When balanced, no current flows through the galvanometer (I_g = 0) — the bridge "nulls".</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                            <div className="text-base font-extrabold text-slate-900">Kirchhoff's rules</div>
                            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT §3.12</div>
                            <ul className="text-xs leading-snug text-slate-700 list-disc pl-4 space-y-1">
                                <li><b>Junction:</b> Σ I_in = Σ I_out (charge conserved).</li>
                                <li><b>Loop:</b> Σ ΔV around closed loop = 0 (energy conserved).</li>
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

// ----- subcomponents -----
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

export default CurrentElectricityLab;
