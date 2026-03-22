import React, { useRef, useEffect, useCallback, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface EquipartitionLabProps {
    topic: any;
    onExit: () => void;
}

interface GasType {
    name: string; symbol: string; color: string;
    fTrans: number; fRot: number; fVib: number;
    atoms: number; molar: number;
}

const GAS_TYPES: GasType[] = [
    { name: 'Helium', symbol: 'He', color: '#d97706', fTrans: 3, fRot: 0, fVib: 0, atoms: 1, molar: 4 },
    { name: 'Oxygen', symbol: 'O₂', color: '#2563eb', fTrans: 3, fRot: 2, fVib: 0, atoms: 2, molar: 32 },
    { name: 'Carbon Monoxide', symbol: 'CO', color: '#7c3aed', fTrans: 3, fRot: 2, fVib: 2, atoms: 2, molar: 28 },
    { name: 'Methane', symbol: 'CH₄', color: '#16a34a', fTrans: 3, fRot: 3, fVib: 9, atoms: 5, molar: 16 },
];

const R_CONST = 8.314;

const EquipartitionLab: React.FC<EquipartitionLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);

    const [gasIdx, setGasIdx] = useState(0);
    const [temperature, setTemperature] = useState(300);
    const [vibEnabled, setVibEnabled] = useState(false);

    const stateRef = useRef({ gasIdx: 0, T: 300, vibEnabled: false });

    useEffect(() => {
        stateRef.current = { gasIdx, T: temperature, vibEnabled };
    }, [gasIdx, temperature, vibEnabled]);

    // Dynamic canvas resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        resizeObserver.observe(parent);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        return () => resizeObserver.disconnect();
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        if (W < 10 || H < 10) { animRef.current = requestAnimationFrame(draw); return; }

        const s = stateRef.current;
        const gas = GAS_TYPES[s.gasIdx];
        const time = Date.now() * 0.001;

        const fRot = gas.fRot;
        const fVib = s.vibEnabled ? gas.fVib : 0;
        const fTotal = gas.fTrans + fRot + fVib;
        const kBT_half = 0.5 * R_CONST * s.T / 1000;

        // Clear
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc'; // Soft White
        ctx.fillRect(0, 0, W, H);

        // DYNAMIC VIEWPORT SCALING (Laptop vs Smartboard)
        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

        const titleH = fs(18) + pad * 1.5;
        const contentY = titleH + pad * 0.5;
        const contentH = H - contentY - pad;

        const col1W = W * 0.35;
        const col2W = W * 0.25;
        const col3W = W * 0.35;
        const col1X = pad;
        const col2X = col1X + col1W + pad * 0.5;
        const col3X = col2X + col2W + pad * 0.5;

        // ─── Title bar ───
        ctx.fillStyle = '#0f172a'; // High contrast dark
        ctx.font = `bold ${fs(18)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`${gas.name.toUpperCase()} — ${fTotal} DEGREES OF FREEDOM`, pad, titleH * 0.65);

        // ═══════════════════════════════════════════════
        // COLUMN 1: MOLECULE VIEW
        // ═══════════════════════════════════════════════
        const molX = col1X, molY = contentY, molW = col1W, molH = contentH;

        // Panel
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, molX, molY, molW, molH, 14); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, molX, molY, molW, molH, 14); ctx.stroke();

        // Secondary border highlight
        ctx.strokeStyle = `${gas.color}40`; ctx.lineWidth = 2.5;
        ctx.strokeRect(molX + 5, molY + 5, molW - 10, molH - 10);

        // Title
        ctx.fillStyle = '#64748b';
        ctx.font = `bold ${fs(13)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('DYNAMIC MOLECULE VIEW', molX + molW / 2, molY + pad * 1.2);

        // Draw molecule
        const cx = molX + molW / 2;
        const cy = molY + molH * 0.45;
        const tempNorm = Math.max(0, Math.min(1, (s.T - 100) / 900));
        const speed = 0.5 + tempNorm * 5.5;
        const amplitude = Math.min(molW, molH) * 0.15 + tempNorm * Math.min(molW, molH) * 0.2;

        const tx = Math.sin(time * speed * 0.7) * amplitude * 0.45
            + Math.cos(time * speed * 1.1) * amplitude * 0.35;
        const ty = Math.cos(time * speed * 0.5) * amplitude * 0.4
            + Math.sin(time * speed * 0.9) * amplitude * 0.3;
        const mx = Math.max(molX + 40, Math.min(molX + molW - 40, cx + tx));
        const my = Math.max(molY + 50, Math.min(molY + molH - 100, cy + ty));

        const rotSpeed = fRot > 0 ? speed * 3.0 : 0;
        const rotAngle = time * rotSpeed;
        const vibAmp = (s.vibEnabled && fVib > 0) ? Math.sin(time * speed * 10) * (4 + tempNorm * 12) : 0;
        const atomR = Math.max(10, Math.min(18, molW * 0.06));

        // Draw molecule based on type
        if (gas.atoms === 1) {
            const grad = ctx.createRadialGradient(mx, my, 2, mx, my, atomR * 2);
            grad.addColorStop(0, gas.color); grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(mx, my, atomR * 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = gas.color; ctx.beginPath(); ctx.arc(mx, my, atomR * 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(mx - 4, my - 4, atomR * 0.4, 0, Math.PI * 2); ctx.fill();
            
            // Translation (3 DOF)
            ctx.strokeStyle = 'rgba(22, 163, 74, 0.7)'; ctx.lineWidth = 2.5 * scale;
            drawDoubleArrow(ctx, mx - 35 * scale, my, mx + 35 * scale, my);
            drawDoubleArrow(ctx, mx, my - 35 * scale, mx, my + 35 * scale);
            drawDoubleArrow(ctx, mx - 20 * scale, my + 20 * scale, mx + 20 * scale, my - 20 * scale);
        } else if (gas.atoms === 2) {
            const bondLen = atomR * 2.8 + vibAmp;
            const dx1 = Math.cos(rotAngle) * bondLen;
            const dy1 = Math.sin(rotAngle) * bondLen;
            const x1 = mx - dx1 / 2, y1 = my - dy1 / 2;
            const x2 = mx + dx1 / 2, y2 = my + dy1 / 2;

            ctx.strokeStyle = s.vibEnabled && fVib > 0 ? '#475569' : '#94a3b8';
            ctx.lineWidth = s.vibEnabled && fVib > 0 ? 3 * scale : 5 * scale;
            if (s.vibEnabled && fVib > 0) ctx.setLineDash([5 * scale, 4 * scale]);
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.setLineDash([]);

            [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach((a, i) => {
                const c = i === 0 ? gas.color : (gas.symbol === 'CO' ? '#dc2626' : gas.color);
                const grd = ctx.createRadialGradient(a.x, a.y, 2, a.x, a.y, atomR * 1.8);
                grd.addColorStop(0, c); grd.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(a.x, a.y, atomR * 1.8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = c; ctx.beginPath(); ctx.arc(a.x, a.y, atomR * 1.2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(a.x - 3, a.y - 3, atomR * 0.3, 0, Math.PI * 2); ctx.fill();
            });

            // Vibration arrows
            if (s.vibEnabled && fVib > 0) {
                ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)'; ctx.lineWidth = 2.5 * scale;
                const vLen = 25 * scale;
                const vdx = Math.cos(rotAngle) * vLen, vdy = Math.sin(rotAngle) * vLen;
                drawDoubleArrow(ctx, x1 - vdx * 0.9, y1 - vdy * 0.9, x1 - vdx * 0.1, y1 - vdy * 0.1);
                drawDoubleArrow(ctx, x2 + vdx * 0.1, y2 + vdy * 0.1, x2 + vdx * 0.9, y2 + vdy * 0.9);
            }
            // Rotation arrows
            if (fRot > 0) {
                ctx.strokeStyle = 'rgba(217, 119, 6, 0.8)'; ctx.lineWidth = 2.5 * scale;
                const pLen = 20 * scale;
                const pdx = -Math.sin(rotAngle) * pLen, pdy = Math.cos(rotAngle) * pLen;
                drawDoubleArrow(ctx, x1 - pdx, y1 - pdy, x1 + pdx, y1 + pdy);
                drawDoubleArrow(ctx, x2 - pdx, y2 - pdy, x2 + pdx, y2 + pdy);
            }
            // Translation
            ctx.strokeStyle = 'rgba(22, 163, 74, 0.4)'; ctx.lineWidth = 2 * scale;
            drawDoubleArrow(ctx, mx - 45 * scale, my, mx + 45 * scale, my);
            drawDoubleArrow(ctx, mx, my - 45 * scale, mx, my + 45 * scale);
        } else {
            ctx.fillStyle = gas.color; ctx.beginPath(); ctx.arc(mx, my, atomR * 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(mx - 3, my - 3, atomR * 0.3, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < 4; i++) {
                const a = rotAngle + i * Math.PI / 2 + (i % 2 ? 0.3 : 0);
                const bLen = atomR * 2.2 + (s.vibEnabled ? Math.sin(time * speed * 8 + i * 1.5) * (4 + tempNorm * 8) : 0);
                const ax = mx + Math.cos(a) * bLen, ay = my + Math.sin(a) * bLen;
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4 * scale;
                ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(ax, ay); ctx.stroke();
                ctx.fillStyle = '#475569';
                ctx.beginPath(); ctx.arc(ax, ay, atomR * 0.8, 0, Math.PI * 2); ctx.fill();
                
                // Polyatomic Vibration
                if (s.vibEnabled && fVib > 0) {
                    ctx.strokeStyle = 'rgba(220, 38, 38, 0.7)'; ctx.lineWidth = 2 * scale;
                    const vdx = Math.cos(a) * 15 * scale, vdy = Math.sin(a) * 15 * scale;
                    drawDoubleArrow(ctx, ax + vdx * 0.2, ay + vdy * 0.2, ax + vdx, ay + vdy);
                }
            }
            
            // Polyatomic Rotation
            if (fRot > 0) {
                ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)'; ctx.lineWidth = 2.5 * scale;
                ctx.beginPath(); ctx.arc(mx, my, atomR * 3.5, 0, Math.PI * 1.5); ctx.stroke();
                drawArrow(ctx, mx, my - atomR * 3.5, mx - 1, my - atomR * 3.5); 
                ctx.beginPath(); ctx.arc(mx, my, atomR * 2.8, Math.PI * 0.5, Math.PI * 2); ctx.stroke();
                drawArrow(ctx, mx + atomR * 2.8, my, mx + atomR * 2.8, my + 1); 
            }
            
            // Polyatomic Translation
            ctx.strokeStyle = 'rgba(22, 163, 74, 0.4)'; ctx.lineWidth = 2 * scale;
            drawDoubleArrow(ctx, mx - 50 * scale, my, mx + 50 * scale, my);
            drawDoubleArrow(ctx, mx, my - 50 * scale, mx, my + 50 * scale);
        }

        // Motion trail
        const trailLen = Math.round(15 + tempNorm * 50);
        ctx.strokeStyle = `${gas.color}40`;
        ctx.lineWidth = 2.5 + tempNorm * 2;
        ctx.beginPath();
        for (let t2 = 0; t2 < trailLen; t2++) {
            const pt = time - t2 * 0.015;
            const ptx = cx + Math.sin(pt * speed * 0.7) * amplitude * 0.45 + Math.cos(pt * speed * 1.1) * amplitude * 0.35;
            const pty = cy + Math.cos(pt * speed * 0.5) * amplitude * 0.4 + Math.sin(pt * speed * 0.9) * amplitude * 0.3;
            t2 === 0 ? ctx.moveTo(ptx, pty) : ctx.lineTo(ptx, pty);
        }
        ctx.stroke();

        // Mode labels
        const modesY = molY + molH - pad * 4;
        const modes: [string, string, boolean][] = [
            ['↔ Translation', '#16a34a', true],
            ['↻ Rotation', '#d97706', fRot > 0],
            ['⟷ Vibration', '#dc2626', fVib > 0],
        ];
        ctx.font = `bold ${fs(13)}px sans-serif`;
        ctx.textAlign = 'left';
        modes.forEach((md, i) => {
            const isActive = md[2];
            ctx.fillStyle = isActive ? (md[1] as string) : '#cbd5e1';
            ctx.fillText(`${md[0]}: ${isActive ? 'ACTIVE' : 'N/A'}`, molX + pad, modesY + i * (fs(13) + 10));
        });

        // ═══════════════════════════════════════════════
        // COLUMN 2: ENERGY BAR GRAPH
        // ═══════════════════════════════════════════════
        const barPanelX = col2X, barPanelY = contentY, barPanelW = col2W, barPanelH = contentH;

        ctx.fillStyle = '#ffffff';
        roundRect(ctx, barPanelX, barPanelY, barPanelW, barPanelH, 14); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, barPanelX, barPanelY, barPanelW, barPanelH, 14); ctx.stroke();

        // Title
        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${fs(14)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('EQUIPARTITION OF ENERGY', barPanelX + barPanelW / 2, barPanelY + pad * 1.2);
        ctx.fillStyle = '#64748b';
        ctx.font = `bold ${fs(11)}px sans-serif`;
        ctx.fillText('Average Energy per Degree of Freedom', barPanelX + barPanelW / 2, barPanelY + pad * 1.2 + fs(14) + 4);

        const eTrans = gas.fTrans * kBT_half;
        const eRot = fRot * kBT_half;
        const eVib = fVib * kBT_half;
        const eTotal = eTrans + eRot + eVib;
        const maxE = Math.max(eTotal * 1.3, 1);

        const bw = Math.min(barPanelW * 0.25, 70);
        const gap = Math.min(bw * 0.35, 16);
        const bars = [
            { label: 'TRANS.', sub: `${gas.fTrans} DOF`, val: eTrans, color: '#16a34a' },
            { label: 'ROTAT.', sub: `${fRot} DOF`, val: eRot, color: '#d97706' },
            { label: 'VIBRAT.', sub: `${fVib} DOF`, val: eVib, color: '#dc2626' },
        ];
        const totalBarW = bars.length * bw + (bars.length - 1) * gap;
        const barStartX = barPanelX + (barPanelW - totalBarW) / 2;
        const barBottom = barPanelY + barPanelH - pad * 4;
        const barMaxH = barPanelH - pad * 10;

        bars.forEach((b, i) => {
            const bx = barStartX + i * (bw + gap);
            const fillH = eTotal > 0 ? (b.val / maxE) * barMaxH : 0;

            ctx.fillStyle = '#f8fafc';
            roundRect(ctx, bx, barBottom - barMaxH, bw, barMaxH, 6); ctx.fill();
            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1; ctx.strokeRect(bx, barBottom - barMaxH, bw, barMaxH);

            if (fillH > 0) {
                ctx.fillStyle = b.color;
                roundRect(ctx, bx, barBottom - fillH, bw, fillH, 6); ctx.fill();
                if (kBT_half > 0) {
                    const quanta = b.val / kBT_half;
                    for (let q = 1; q < quanta; q++) {
                        const qy = barBottom - (q * kBT_half / maxE) * barMaxH;
                        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.moveTo(bx + 3, qy); ctx.lineTo(bx + bw - 3, qy); ctx.stroke();
                    }
                }
            }

            ctx.fillStyle = '#0f172a';
            ctx.font = `bold ${fs(14)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(`${b.val.toFixed(1)}`, bx + bw / 2, barBottom - fillH - 8);

            ctx.fillStyle = b.color;
            ctx.font = `bold ${fs(12)}px sans-serif`;
            ctx.fillText(b.label, bx + bw / 2, barBottom + fs(12) + 6);
            ctx.fillStyle = '#64748b';
            ctx.font = `bold ${fs(10)}px sans-serif`;
            ctx.fillText(b.sub, bx + bw / 2, barBottom + fs(12) + fs(10) + 10);
        });

        if (kBT_half > 0) {
            const eqY = barBottom - (kBT_half / maxE) * barMaxH;
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
            ctx.beginPath(); ctx.moveTo(barStartX - 10, eqY); ctx.lineTo(barStartX + totalBarW + 10, eqY); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#475569';
            ctx.font = `bold ${fs(11)}px sans-serif`;
            ctx.textAlign = 'right';
            ctx.fillText('½kᵦT', barStartX - 15, eqY + 4);
        }

        // ═══════════════════════════════════════════════
        // COLUMN 3: INFO CARDS
        // ═══════════════════════════════════════════════
        const infoX = col3X, infoY = contentY, infoW = col3W;
        const cardGap = pad * 0.8;
        const card1H = contentH * 0.44;
        const card2H = contentH * 0.44;

        // ── Card 1: Gas Info ──
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, infoX, infoY, infoW, card1H, 14); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
        roundRect(ctx, infoX, infoY, infoW, card1H, 14); ctx.stroke();

        ctx.fillStyle = gas.color;
        ctx.font = `bold ${fs(20)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${gas.name} (${gas.symbol})`, infoX + infoW / 2, infoY + pad * 1.8);

        ctx.fillStyle = '#334155';
        ctx.font = `bold ${fs(12)}px sans-serif`;
        ctx.fillText(`${gas.atoms === 1 ? 'MONATOMIC' : gas.atoms === 2 ? 'DIATOMIC' : 'POLYATOMIC'} | f = ${fTotal} | M = ${gas.molar} g/mol`, infoX + infoW / 2, infoY + pad * 1.8 + fs(15) + 6);

        const readoutY = infoY + card1H * 0.48;
        ctx.fillStyle = '#dc2626';
        ctx.font = `bold ${fs(26)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(s.T)} K`, infoX + infoW / 4, readoutY);
        ctx.fillStyle = '#64748b';
        ctx.font = `bold ${fs(12)}px sans-serif`;
        ctx.fillText('Temperature', infoX + infoW / 4, readoutY + fs(15));

        const U = (fTotal / 2) * R_CONST * s.T;
        ctx.fillStyle = '#d97706';
        ctx.font = `bold ${fs(22)}px monospace`;
        ctx.fillText(`${(U / 1000).toFixed(1)} kJ`, infoX + 3 * infoW / 4, readoutY);
        ctx.fillStyle = '#64748b';
        ctx.font = `bold ${fs(12)}px sans-serif`;
        ctx.fillText('U (per mol)', infoX + 3 * infoW / 4, readoutY + fs(15));

        const CvCoeff = fTotal / 2;
        const CpCoeff = CvCoeff + 1;
        const gammaVal = CpCoeff / CvCoeff;
        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${fs(13)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`Cv = ${CvCoeff.toFixed(1)}R   Cp = ${CpCoeff.toFixed(1)}R   γ = ${gammaVal.toFixed(2)}`, infoX + infoW / 2, infoY + card1H - pad * 1.5);

        // ── Card 2: Equipartition Formulas ──
        const card2Y = infoY + card1H + cardGap;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, infoX, card2Y, infoW, card2H, 14); ctx.fill();
        ctx.strokeStyle = `${gas.color}40`; ctx.lineWidth = 2;
        roundRect(ctx, infoX, card2Y, infoW, card2H, 14); ctx.stroke();

        ctx.fillStyle = gas.color;
        ctx.font = `bold ${fs(15)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('EQUIPARTITION FORMULAS', infoX + infoW / 2, card2Y + pad * 1.5);

        const lineH = fs(16) + 12;
        let fY = card2Y + pad * 1.5 + lineH;
        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${fs(18)}px monospace`;
        ctx.fillText(`U = (f/2)RT = ${CvCoeff.toFixed(1)}RT`, infoX + infoW / 2, fY);

        fY += lineH;
        ctx.fillStyle = '#334155';
        ctx.font = `bold ${fs(13)}px monospace`;
        ctx.fillText(`Cv = ${CvCoeff.toFixed(1)}R ≈ ${(CvCoeff * R_CONST).toFixed(1)} J/mol·K`, infoX + infoW / 2, fY);

        fY += lineH;
        ctx.fillText(`Cp = Cv + R = ${CpCoeff.toFixed(1)}R`, infoX + infoW / 2, fY);

        fY += lineH * 1.4;
        ctx.fillStyle = '#64748b';
        ctx.font = `italic bold ${fs(12)}px sans-serif`;
        ctx.fillText('Each DOF gets ½kᵦT energy', infoX + infoW / 2, fY);
        fY += lineH * 0.8;
        ctx.fillText('Vibration adds 2 DOF (KE+PE)', infoX + infoW / 2, fY);

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const handleReset = () => {
        setGasIdx(0);
        setTemperature(300);
        setVibEnabled(false);
    };

    const gas = GAS_TYPES[gasIdx];

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-contain"
                />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-2 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {GAS_TYPES.map((g, i) => (
                    <button
                        key={g.symbol}
                        onClick={() => { setGasIdx(i); setVibEnabled(false); }}
                        className={`p-2 md:p-4 rounded-xl border-2 font-bold transition-all shadow-sm active:scale-95 ${
                            gasIdx === i
                                ? 'text-white border-transparent'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        style={gasIdx === i ? { backgroundColor: g.color } : {}}
                    >
                        <div className="text-lg md:text-2xl mb-0.5 md:mb-1">{g.symbol}</div>
                        <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-90">{g.name}</div>
                    </button>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-1">
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1 md:mb-2">
                        <span>🔥 Temperature</span>
                        <span className="text-red-700 font-mono text-base md:text-lg bg-red-50 border border-red-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{Math.round(temperature)} K</span>
                    </label>
                    <input
                        type="range" min="100" max="1000" step="10"
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="w-full accent-red-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-tighter">
                        <span>Min (100 K)</span><span>Max (1000 K)</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 md:gap-4 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => { if (gas.fVib > 0) setVibEnabled(!vibEnabled); }}
                        disabled={gas.fVib === 0}
                        className={`w-full py-2.5 md:py-4 rounded-xl text-xs md:text-sm lg:text-base font-bold transition-all border shadow-sm active:scale-95 ${
                            gas.fVib === 0
                                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                : vibEnabled
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg scale-[1.02]'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        {gas.fVib === 0 ? 'NO VIBRATIONAL MODES' : vibEnabled ? '🔓 VIBRATION: ACTIVE' : '🔒 VIBRATION: INACTIVE'}
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center justify-center gap-2 md:gap-3 py-2 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-xs md:text-sm shadow-sm active:scale-95"
                    >
                        <RotateCcw size={16} className="md:w-5 md:h-5" /> RESET SYSTEM
                    </button>
                </div>
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
    const headLen = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function drawDoubleArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke();
    drawArrow(ctx, (fromX+toX)/2, (fromY+toY)/2, toX, toY);
    drawArrow(ctx, (fromX+toX)/2, (fromY+toY)/2, fromX, fromY);
}

export default EquipartitionLab;
