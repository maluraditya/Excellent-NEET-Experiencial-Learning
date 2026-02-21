import React, { useRef, useEffect, useCallback } from 'react';

// ==================== GAS TYPE DATA ====================
interface GasType {
    name: string; symbol: string; color: string;
    fTrans: number; fRot: number; fVib: number; // degrees of freedom
    atoms: number; // for visual
    molar: number; // molar mass g/mol (for display only)
}

const GAS_TYPES: GasType[] = [
    { name: 'Helium', symbol: 'He', color: '#f59e0b', fTrans: 3, fRot: 0, fVib: 0, atoms: 1, molar: 4 },
    { name: 'Oxygen', symbol: 'O₂', color: '#3b82f6', fTrans: 3, fRot: 2, fVib: 0, atoms: 2, molar: 32 },
    { name: 'Carbon Monoxide', symbol: 'CO', color: '#8b5cf6', fTrans: 3, fRot: 2, fVib: 2, atoms: 2, molar: 28 },
    { name: 'Methane', symbol: 'CH₄', color: '#22c55e', fTrans: 3, fRot: 3, fVib: 9, atoms: 5, molar: 16 },
];

const R = 8.314; // J/(mol·K)

const EquipartitionLab: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);
    const stateRef = useRef({
        gasIdx: 0,
        T: 300, // K
        vibEnabled: false,
        heatAdded: 0,
    });
    const frameRef = useRef(0);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        const s = stateRef.current;
        const gas = GAS_TYPES[s.gasIdx];
        frameRef.current++;
        const time = Date.now() * 0.001;

        // Active degrees of freedom
        const fRot = gas.fRot;
        const fVib = s.vibEnabled ? gas.fVib : 0;
        const fTotal = gas.fTrans + fRot + fVib;
        const kBT_half = 0.5 * R * s.T / 1000; // ½kBT per mode, scaled

        // ===== CLEAR =====
        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#1e293b');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // ===== LAYOUT =====
        const molX = 20, molY = 30, molW = 230, molH = 230;
        const barX = 270, barY = 30, barW = 210, barH = 230;
        const dx = 505, dy = 20, dw = 285;

        // ===== MOLECULE CHAMBER (left) =====
        ctx.fillStyle = 'rgba(15,23,42,0.6)'; roundRect(ctx, molX, molY, molW, molH, 10); ctx.fill();
        ctx.strokeStyle = gas.color; ctx.lineWidth = 2; roundRect(ctx, molX, molY, molW, molH, 10); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('MOLECULE VIEW', molX + molW / 2, molY - 6);

        // Draw molecule
        const cx = molX + molW / 2, cy = molY + molH / 2;
        const tempNorm = Math.max(0, Math.min(1, (s.T - 100) / 900));
        const speed = 0.5 + tempNorm * 5.5; // 0.5–6
        const amplitude = 15 + tempNorm * 70; // 15–85 px (HUGE difference)

        // Translation: molecule drifts around center — amplitude AND speed scale with T
        const tx = Math.sin(time * speed * 0.7) * amplitude * 0.45
            + Math.cos(time * speed * 1.1) * amplitude * 0.35
            + (tempNorm > 0.5 ? Math.sin(time * speed * 3.7) * tempNorm * 8 : 0); // jitter at high T
        const ty = Math.cos(time * speed * 0.5) * amplitude * 0.4
            + Math.sin(time * speed * 0.9) * amplitude * 0.3
            + (tempNorm > 0.5 ? Math.cos(time * speed * 4.3) * tempNorm * 8 : 0);
        const mx = Math.max(molX + 25, Math.min(molX + molW - 25, cx + tx));
        const my = Math.max(molY + 25, Math.min(molY + molH - 45, cy + ty));

        // Rotation angle (for diatomic/polyatomic) — much faster at high T
        const rotSpeed = fRot > 0 ? speed * 3.0 : 0;
        const rotAngle = time * rotSpeed;

        // Vibration offset — bigger and faster at high T
        const vibAmp = (s.vibEnabled && fVib > 0) ? Math.sin(time * speed * 10) * (3 + tempNorm * 10) : 0;

        // Glow intensity scales with T
        const glowR = 10 + tempNorm * 20;
        const glowAlpha = 0.3 + tempNorm * 0.5;

        if (gas.atoms === 1) {
            // Monatomic — single glowing sphere, glow scales with T
            const grad = ctx.createRadialGradient(mx, my, 2, mx, my, glowR);
            grad.addColorStop(0, gas.color); grad.addColorStop(0.4, gas.color + Math.round(glowAlpha * 255).toString(16).padStart(2, '0')); grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(mx, my, glowR, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = gas.color; ctx.beginPath(); ctx.arc(mx, my, 8 + tempNorm * 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(mx - 3, my - 3, 3, 0, Math.PI * 2); ctx.fill();
        } else if (gas.atoms === 2) {
            // Diatomic — dumbbell
            const bondLen = 26 + vibAmp;
            const dx1 = Math.cos(rotAngle) * bondLen;
            const dy1 = Math.sin(rotAngle) * bondLen;
            const x1 = mx - dx1 / 2, y1 = my - dy1 / 2;
            const x2 = mx + dx1 / 2, y2 = my + dy1 / 2;

            // Bond
            ctx.strokeStyle = s.vibEnabled && fVib > 0 ? '#94a3b8' : '#64748b';
            ctx.lineWidth = s.vibEnabled && fVib > 0 ? 2 : 3;
            if (s.vibEnabled && fVib > 0) { ctx.setLineDash([4, 3]); }
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.setLineDash([]);

            // Atoms with T-dependent glow
            [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach((a, i) => {
                const c = i === 0 ? gas.color : (gas.symbol === 'CO' ? '#ef4444' : gas.color);
                // Glow
                const grd = ctx.createRadialGradient(a.x, a.y, 2, a.x, a.y, 8 + tempNorm * 10);
                grd.addColorStop(0, c); grd.addColorStop(1, 'transparent');
                ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(a.x, a.y, 8 + tempNorm * 10, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = c; ctx.beginPath(); ctx.arc(a.x, a.y, 8 + tempNorm * 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(a.x - 2, a.y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
            });

            // Rotation arc indicator — more visible
            if (fRot > 0 && tempNorm > 0.1) {
                ctx.strokeStyle = `rgba(255,255,255,${0.08 + tempNorm * 0.15})`; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(mx, my, 24 + tempNorm * 6, rotAngle - 0.8, rotAngle + 0.8); ctx.stroke();
            }
        } else {
            // Polyatomic — central atom + 4 surrounding
            ctx.fillStyle = gas.color; ctx.beginPath(); ctx.arc(mx, my, 9 + tempNorm * 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(mx - 2, my - 2, 2.5, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < 4; i++) {
                const a = rotAngle + i * Math.PI / 2 + (i % 2 ? 0.3 : 0);
                const bLen = 18 + (s.vibEnabled ? Math.sin(time * speed * 8 + i * 1.5) * (3 + tempNorm * 6) : 0);
                const ax = mx + Math.cos(a) * bLen, ay = my + Math.sin(a) * bLen;
                ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(ax, ay); ctx.stroke();
                const hGrd = ctx.createRadialGradient(ax, ay, 1, ax, ay, 5 + tempNorm * 5);
                hGrd.addColorStop(0, '#e2e8f0'); hGrd.addColorStop(1, 'transparent');
                ctx.fillStyle = hGrd; ctx.beginPath(); ctx.arc(ax, ay, 5 + tempNorm * 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(ax, ay, 5 + tempNorm * 2, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Motion trail — longer and more visible at high T
        const trailLen = Math.round(10 + tempNorm * 40);
        ctx.strokeStyle = `${gas.color}${Math.round(20 + tempNorm * 30).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1 + tempNorm;
        ctx.beginPath();
        for (let t2 = 0; t2 < trailLen; t2++) {
            const pt = time - t2 * 0.015;
            const ptx = cx + Math.sin(pt * speed * 0.7) * amplitude * 0.45 + Math.cos(pt * speed * 1.1) * amplitude * 0.35;
            const pty = cy + Math.cos(pt * speed * 0.5) * amplitude * 0.4 + Math.sin(pt * speed * 0.9) * amplitude * 0.3;
            t2 === 0 ? ctx.moveTo(ptx, pty) : ctx.lineTo(ptx, pty);
        }
        ctx.stroke();

        // Mode labels inside chamber
        ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'left';
        const modes: [string, string, boolean][] = [
            ['↔ Translation', '#22c55e', true],
            ['↻ Rotation', '#f59e0b', fRot > 0],
            ['⟷ Vibration', '#ef4444', fVib > 0],
        ];
        modes.forEach((md, i) => {
            ctx.fillStyle = md[2] ? md[1] : '#334155';
            ctx.fillText(`${md[0]}: ${md[2] ? 'ACTIVE' : 'N/A'}`, molX + 10, molY + molH - 30 + i * 12);
        });

        // ===== ENERGY BAR GRAPHS (center) =====
        ctx.fillStyle = 'rgba(30,41,59,0.7)'; roundRect(ctx, barX, barY, barW, barH, 10); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, barX, barY, barW, barH, 10); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('ENERGY PER MODE (½kᵦT each)', barX + barW / 2, barY - 6);

        // Energy per mode: each DOF gets ½kBT (but vib modes get kBT = 2×½kBT)
        const eTrans = gas.fTrans * kBT_half;
        const eRot = fRot * kBT_half;
        const eVib = fVib * kBT_half; // fVib already counts both KE+PE
        const eTotal = eTrans + eRot + eVib;
        const maxE = Math.max(eTotal * 1.3, 1);

        const bw = 50, gap = 17;
        const bars = [
            { label: 'Trans.', sub: `${gas.fTrans} DOF`, val: eTrans, color: '#22c55e' },
            { label: 'Rotat.', sub: `${fRot} DOF`, val: eRot, color: '#f59e0b' },
            { label: 'Vibrat.', sub: `${fVib} DOF`, val: eVib, color: '#ef4444' },
        ];
        const totalBarW = bars.length * bw + (bars.length - 1) * gap;
        const barStartX = barX + (barW - totalBarW) / 2;
        const barBottom = barY + barH - 30;
        const barMaxH = barH - 65;

        bars.forEach((b, i) => {
            const bx = barStartX + i * (bw + gap);
            const fillH = eTotal > 0 ? (b.val / maxE) * barMaxH : 0;

            // Background
            ctx.fillStyle = '#1e293b'; roundRect(ctx, bx, barBottom - barMaxH, bw, barMaxH, 4); ctx.fill();

            // Fill
            if (fillH > 0) {
                ctx.fillStyle = b.color;
                roundRect(ctx, bx, barBottom - fillH, bw, fillH, 4); ctx.fill();

                // Grid lines showing individual ½kBT quanta
                if (kBT_half > 0) {
                    const quanta = b.val / kBT_half;
                    for (let q = 1; q < quanta; q++) {
                        const qy = barBottom - (q * kBT_half / maxE) * barMaxH;
                        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.5;
                        ctx.beginPath(); ctx.moveTo(bx + 2, qy); ctx.lineTo(bx + bw - 2, qy); ctx.stroke();
                    }
                }
            }

            // Value
            ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
            ctx.fillText(`${b.val.toFixed(1)}`, bx + bw / 2, barBottom - fillH - 6);

            // Label
            ctx.fillStyle = b.color; ctx.font = 'bold 9px Inter, sans-serif';
            ctx.fillText(b.label, bx + bw / 2, barBottom + 12);
            ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif';
            ctx.fillText(b.sub, bx + bw / 2, barBottom + 22);
        });

        // Equipartition line (½kBT level)
        if (kBT_half > 0) {
            const eqY = barBottom - (kBT_half / maxE) * barMaxH;
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
            ctx.beginPath(); ctx.moveTo(barStartX - 5, eqY); ctx.lineTo(barStartX + totalBarW + 5, eqY); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('½kᵦT', barStartX - 8, eqY + 3);
        }

        // ===== RIGHT PANEL =====
        // State readouts
        ctx.fillStyle = 'rgba(30,41,59,0.7)'; roundRect(ctx, dx, dy, dw, 90, 8); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, dy, dw, 90, 8); ctx.stroke();

        // Gas name & symbol
        ctx.fillStyle = gas.color; ctx.font = 'bold 14px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${gas.name} (${gas.symbol})`, dx + dw / 2, dy + 20);
        ctx.fillStyle = '#94a3b8'; ctx.font = '8px Inter, sans-serif';
        ctx.fillText(`${gas.atoms === 1 ? 'Monatomic' : gas.atoms === 2 ? 'Diatomic' : 'Polyatomic'}  |  f = ${fTotal}  |  M = ${gas.molar} g/mol`, dx + dw / 2, dy + 35);

        // T & U
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(s.T)} K`, dx + dw / 4, dy + 60);
        ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif'; ctx.fillText('Temperature', dx + dw / 4, dy + 72);
        const U = (fTotal / 2) * R * s.T; // per mole in J
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 14px monospace';
        ctx.fillText(`${(U / 1000).toFixed(1)} kJ`, dx + 3 * dw / 4, dy + 60);
        ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif'; ctx.fillText('U (per mol)', dx + 3 * dw / 4, dy + 72);

        // Cv, Cp, γ
        const CvCoeff = fTotal / 2;
        const CpCoeff = CvCoeff + 1;
        const gammaVal = CpCoeff / CvCoeff;
        ctx.fillStyle = '#94a3b8'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`Cv = ${CvCoeff.toFixed(1)}R ≈ ${(CvCoeff * R).toFixed(1)}  |  Cp = ${CpCoeff.toFixed(1)}R  |  γ = ${gammaVal.toFixed(2)}`, dx + dw / 2, dy + 86);

        // ===== CONTROLS =====
        const ctrlY = dy + 100;
        const slW = dw - 20;

        // Gas type buttons
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Select Gas Type:', dx + 10, ctrlY + 10);
        const gbW = (slW - 6) / 2;
        GAS_TYPES.forEach((g, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const bx = dx + 10 + col * (gbW + 6);
            const by = ctrlY + 18 + row * 30;
            const isActive = s.gasIdx === i;
            ctx.fillStyle = isActive ? g.color : '#1e293b';
            roundRect(ctx, bx, by, gbW, 24, 6); ctx.fill();
            ctx.strokeStyle = g.color; ctx.lineWidth = 1.5; roundRect(ctx, bx, by, gbW, 24, 6); ctx.stroke();
            ctx.fillStyle = isActive ? '#fff' : g.color; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(`${g.symbol} ${g.name}`, bx + gbW / 2, by + 16);
        });

        // Temperature slider
        const tslY = ctrlY + 84;
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`🔥 Temperature: ${Math.round(s.T)} K`, dx + 10, tslY);
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, tslY + 6, slW, 12, 6); ctx.fill();
        const tNorm = (s.T - 100) / 900;
        const tGrad = ctx.createLinearGradient(dx + 10, 0, dx + 10 + slW, 0);
        tGrad.addColorStop(0, '#3b82f6'); tGrad.addColorStop(1, '#ef4444');
        ctx.fillStyle = tGrad; roundRect(ctx, dx + 10, tslY + 6, tNorm * slW, 12, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx + 10 + tNorm * slW, tslY + 12, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx + 10 + tNorm * slW, tslY + 12, 8, 0, Math.PI * 2); ctx.stroke();

        // Vibration toggle
        const vbY = tslY + 28;
        const canVib = gas.fVib > 0;
        ctx.fillStyle = canVib ? (s.vibEnabled ? '#22c55e' : '#1e293b') : '#0f172a';
        roundRect(ctx, dx + 10, vbY, slW, 26, 8); ctx.fill();
        ctx.strokeStyle = canVib ? (s.vibEnabled ? '#22c55e' : '#64748b') : '#1e293b';
        ctx.lineWidth = 1.5; roundRect(ctx, dx + 10, vbY, slW, 26, 8); ctx.stroke();
        ctx.fillStyle = canVib ? '#fff' : '#334155'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(s.vibEnabled && canVib ? '🔓 Vibration: ON (High T)' : canVib ? '🔒 Vibration: OFF (Low T)' : '— No Vibrational Modes —', dx + 10 + slW / 2, vbY + 17);

        // Reset
        const rstY = vbY + 34;
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, rstY, slW, 26, 8); ctx.fill();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; roundRect(ctx, dx + 10, rstY, slW, 26, 8); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('↺ Reset', dx + 10 + slW / 2, rstY + 17);

        // ===== DESCRIPTION BOX (bottom-left) =====
        const descY = 275, descW2 = 478, descH2 = 145;
        ctx.fillStyle = 'rgba(30,41,59,0.85)'; roundRect(ctx, 15, descY, descW2, descH2, 10); ctx.fill();
        ctx.strokeStyle = gas.color; ctx.lineWidth = 2; roundRect(ctx, 15, descY, descW2, descH2, 10); ctx.stroke();
        ctx.fillStyle = gas.color; roundRect(ctx, 27, descY + 10, 6, 26, 3); ctx.fill();
        ctx.fillStyle = gas.color; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`${gas.name} — ${fTotal} Degrees of Freedom`, 42, descY + 24);
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 10px monospace';
        ctx.fillText(`U = ${CvCoeff.toFixed(1)}RT   Cv = ${CvCoeff.toFixed(1)}R   Cp = ${CpCoeff.toFixed(1)}R   γ = ${gammaVal.toFixed(2)}`, 42, descY + 42);
        ctx.fillStyle = '#94a3b8'; ctx.font = '9px Inter, sans-serif';
        const desc = gas.atoms === 1
            ? 'Monatomic gas: 3 translational DOF only. All thermal energy goes into making the atom move faster — highest γ, lowest Cv. Temperature rises fastest when heated.'
            : gas.fVib === 0
                ? 'Rigid diatomic: 3 translational + 2 rotational DOF. Heat is shared between moving and tumbling. Less temperature rise per joule than monatomic — higher Cv.'
                : gas.atoms === 2
                    ? `Vibrating diatomic: 3 trans + 2 rot${s.vibEnabled ? ' + 2 vib' : ''} = ${fTotal} DOF. ${s.vibEnabled ? 'Vibration absorbs heat into spring-like oscillations.' : 'Toggle vibration to see high-T behavior.'} Energy spreads thin — temperature rises slowly.`
                    : `Polyatomic: 3 trans + 3 rot${s.vibEnabled ? ` + ${gas.fVib} vib` : ''} = ${fTotal} DOF. Complex molecules absorb enormous amounts of heat into many modes. Highest Cv, lowest γ.`;
        wrapText(ctx, desc, 42, descY + 60, descW2 - 60, 13);

        // Equipartition law
        ctx.fillStyle = '#64748b'; ctx.font = 'italic 8px Inter, sans-serif';
        ctx.fillText('Law of Equipartition: Each DOF gets exactly ½kᵦT of energy. Vibration gets kᵦT (KE + PE).', 42, descY + 130);

        // ===== HOW TO USE =====
        const guideY = rstY + 36;
        const guideH = H - guideY - 8;
        if (guideH > 50) {
            ctx.fillStyle = 'rgba(30,41,59,0.5)'; roundRect(ctx, dx, guideY, dw, guideH, 8); ctx.fill();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, guideY, dw, guideH, 8); ctx.stroke();
            ctx.fillStyle = '#64748b'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('💡 HOW TO USE', dx + dw / 2, guideY + 16);
            ctx.textAlign = 'left';
            const steps = [
                ['1.', 'Select a gas type (He, O₂, CO, CH₄)'],
                ['2.', 'Drag temperature — watch energy bars grow'],
                ['3.', 'Toggle vibration ON for diatomic/poly'],
                ['4.', 'Compare Cv & γ across gas types'],
                ['5.', 'Notice: more DOF = more heat to raise T'],
            ];
            steps.forEach((st, i) => {
                const sy = guideY + 30 + i * 14;
                if (sy + 10 < guideY + guideH) {
                    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 8.5px monospace'; ctx.fillText(st[0], dx + 12, sy);
                    ctx.fillStyle = '#94a3b8'; ctx.font = '8.5px Inter, sans-serif'; ctx.fillText(st[1], dx + 26, sy);
                }
            });
        }

        // Top status
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`${gas.name} (${gas.symbol})  |  f = ${fTotal} DOF  |  U = ${(U / 1000).toFixed(1)} kJ/mol  |  Equipartition: each DOF = ½kᵦT`, 10, 14);

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    // ===== MOUSE HANDLERS =====
    const draggingRef = useRef('');
    const getCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const c = canvasRef.current;
        if (!c) return { x: 0, y: 0 };
        const r = c.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCoords(e);
        const dx = 505, dw = 285, dy = 20, slW = dw - 20;
        const ctrlY = dy + 100;
        const gbW = (slW - 6) / 2;

        // Gas type buttons
        for (let i = 0; i < 4; i++) {
            const col = i % 2, row = Math.floor(i / 2);
            const bx = dx + 10 + col * (gbW + 6);
            const by = ctrlY + 18 + row * 30;
            if (x >= bx && x <= bx + gbW && y >= by && y <= by + 24) {
                stateRef.current.gasIdx = i;
                stateRef.current.vibEnabled = false;
                return;
            }
        }

        // Temp slider
        const tslY = ctrlY + 84;
        if (x >= dx + 10 && x <= dx + 10 + slW && y >= tslY && y <= tslY + 24) {
            draggingRef.current = 'temp';
            const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
            stateRef.current.T = 100 + val * 900;
            return;
        }

        // Vibration toggle
        const vbY = tslY + 28;
        if (x >= dx + 10 && x <= dx + 10 + slW && y >= vbY && y <= vbY + 26) {
            const gas = GAS_TYPES[stateRef.current.gasIdx];
            if (gas.fVib > 0) { stateRef.current.vibEnabled = !stateRef.current.vibEnabled; }
            return;
        }

        // Reset
        const rstY = vbY + 34;
        if (x >= dx + 10 && x <= dx + 10 + slW && y >= rstY && y <= rstY + 26) {
            stateRef.current = { gasIdx: 0, T: 300, vibEnabled: false, heatAdded: 0 };
        }
    }, [getCoords]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (draggingRef.current !== 'temp') return;
        const { x } = getCoords(e);
        const dx = 505, dw = 285, slW = dw - 20;
        const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
        stateRef.current.T = 100 + val * 900;
    }, [getCoords]);

    const handleMouseUp = useCallback(() => { draggingRef.current = ''; }, []);

    return (
        <canvas ref={canvasRef} width={800} height={480}
            className="w-full h-full cursor-pointer"
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
    ctx.textAlign = 'left';
    const words = text.split(' '); let line = '', curY = y;
    for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line.trim(), x, curY); line = word + ' '; curY += lineH; } else { line = test; }
    }
    if (line.trim()) ctx.fillText(line.trim(), x, curY);
}

export default EquipartitionLab;
