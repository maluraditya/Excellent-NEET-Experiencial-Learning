import React, { useRef, useEffect, useState, useCallback } from 'react';

// ==================== PHYSICS CONSTANTS ====================
const R = 8.314; // J/(mol·K)
const n = 1;     // 1 mole
const gamma = 1.4; // diatomic ideal gas (air-like)
const Cv = R / (gamma - 1); // J/(mol·K) ≈ 20.8

function pressure(V: number, T: number) { return (n * R * T) / V; }

// ==================== STEP INFO ====================
const PROCESS_INFO: Record<string, { title: string; color: string; formula: string; desc: string; constraint: string }> = {
    isothermal: {
        title: 'Isothermal Process',
        color: '#ef4444',
        formula: 'ΔU = 0 → ΔQ = ΔW',
        desc: 'Temperature stays constant. Gas is in thermal contact with a reservoir. All heat absorbed converts to work done by the gas (or vice versa). Internal energy doesn\'t change.',
        constraint: 'T = constant, PV = nRT = constant',
    },
    adiabatic: {
        title: 'Adiabatic Process',
        color: '#f59e0b',
        formula: 'ΔQ = 0 → ΔU = −ΔW',
        desc: 'No heat enters or leaves (insulated). When gas expands, it uses its own internal energy to do work — temperature drops. When compressed, work done on it raises temperature.',
        constraint: 'Q = 0, PV^γ = constant',
    },
    isochoric: {
        title: 'Isochoric Process',
        color: '#8b5cf6',
        formula: 'ΔW = 0 → ΔQ = ΔU',
        desc: 'Volume stays fixed (piston locked). No work is done. All heat absorbed goes entirely to changing the internal energy and temperature of the gas.',
        constraint: 'V = constant, ΔW = 0',
    },
    isobaric: {
        title: 'Isobaric Process',
        color: '#3b82f6',
        formula: 'ΔW = PΔV',
        desc: 'Pressure stays constant. Heat goes partly into work (piston moves) and partly into changing internal energy. The gas expands or contracts at constant pressure.',
        constraint: 'P = constant',
    },
};

// ==================== COMPONENT ====================
const ThermodynamicProcessesLab: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    // State of the gas
    const [gasState, setGasState] = useState({ T: 400, V: 3.0 }); // Kelvin, Liters
    const [process, setProcess] = useState<string>(''); // current selected process
    const [action, setAction] = useState(0.5); // 0=compress/cool, 1=expand/heat, 0.5=neutral

    // History for P-V curve tracing
    const historyRef = useRef<{ V: number; P: number; proc: string }[]>([]);
    const animatingRef = useRef(false);
    const processRef = useRef('');
    processRef.current = process;

    const gasRef = useRef(gasState);
    gasRef.current = gasState;
    const actionRef = useRef(action);
    actionRef.current = action;

    // Cumulative energy tracking
    const energyRef = useRef({ dQ: 0, dU: 0, dW: 0 });

    const reset = useCallback(() => {
        setGasState({ T: 400, V: 3.0 });
        setProcess('');
        setAction(0.5);
        historyRef.current = [];
        energyRef.current = { dQ: 0, dU: 0, dW: 0 };
    }, []);

    // ==================== DRAW LOOP ====================
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width, H = canvas.height;
        const gas = gasRef.current;
        const P = pressure(gas.V, gas.T);
        const proc = processRef.current;
        const act = actionRef.current;
        const e = energyRef.current;

        // ===== ANIMATE GAS STATE =====
        if (proc && act !== 0.5) {
            const dir = act > 0.5 ? 1 : -1; // +1 expand/heat, -1 compress/cool
            const speed = Math.abs(act - 0.5) * 2; // 0-1
            const dt = 0.3 * speed;

            let newV = gas.V, newT = gas.T;
            let ddQ = 0, ddU = 0, ddW = 0;

            if (proc === 'isothermal') {
                // T const, V changes
                const dV = dir * 0.015 * speed;
                newV = Math.max(1.5, Math.min(8, gas.V + dV));
                const Pavg = pressure(gas.V, gas.T);
                ddW = Pavg * (newV - gas.V) * 1000; // scale for display
                ddQ = ddW; // ΔU=0
                ddU = 0;
            } else if (proc === 'adiabatic') {
                // Q=0, PV^γ=const
                const dV = dir * 0.015 * speed;
                newV = Math.max(1.5, Math.min(8, gas.V + dV));
                // T changes: TV^(γ-1) = const → T2 = T1*(V1/V2)^(γ-1)
                newT = gas.T * Math.pow(gas.V / newV, gamma - 1);
                newT = Math.max(150, Math.min(1200, newT));
                ddQ = 0;
                ddU = n * Cv * (newT - gas.T);
                ddW = -ddU;
            } else if (proc === 'isochoric') {
                // V const, T changes
                const dT = dir * dt;
                newT = Math.max(150, Math.min(1200, gas.T + dT));
                ddW = 0;
                ddU = n * Cv * (newT - gas.T);
                ddQ = ddU;
            } else if (proc === 'isobaric') {
                // P const → V/T const → dV/V = dT/T
                const Pcurr = pressure(gas.V, gas.T);
                const dV = dir * 0.015 * speed;
                newV = Math.max(1.5, Math.min(8, gas.V + dV));
                newT = Pcurr * newV / (n * R); // P = nRT/V → T = PV/nR
                newT = Math.max(150, Math.min(1200, newT));
                if (newT < 150 || newT > 1200) newV = gas.V; // clamp
                ddW = Pcurr * (newV - gas.V) * 1000;
                ddU = n * Cv * (newT - gas.T);
                ddQ = ddU + ddW;
            }

            if (newV !== gas.V || newT !== gas.T) {
                energyRef.current = { dQ: e.dQ + ddQ, dU: e.dU + ddU, dW: e.dW + ddW };
                setGasState({ T: newT, V: newV });
                const newP = pressure(newV, newT);
                historyRef.current.push({ V: newV, P: newP, proc });
            }
        }

        // ===== CLEAR =====
        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#1e293b');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // ===== LAYOUT =====
        const cylX = 25, cylY = 38, cylW = 140, cylH = 165;
        const gx = 195, gy = 28, gw = 260, gh = 195;
        const dx = 480, dy = 25, dw = 310;
        const procInfo = proc ? PROCESS_INFO[proc] : null;

        // ===== GAS CYLINDER (Left) =====
        const maxV = 9, minV = 1.5;
        const pistonNorm = (gas.V - minV) / (maxV - minV);
        const pistonY = cylY + cylH - 12 - pistonNorm * (cylH - 36);

        // Cylinder body
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.strokeRect(cylX, cylY, cylW, cylH);

        // Gas fill — color by temp
        const tempNorm = Math.max(0, Math.min(1, (gas.T - 150) / 850));
        const gR = Math.round(40 + tempNorm * 200), gB = Math.round(210 - tempNorm * 160);
        ctx.fillStyle = `rgba(${gR}, 50, ${gB}, 0.3)`;
        ctx.fillRect(cylX + 2, pistonY + 3, cylW - 4, cylY + cylH - pistonY - 4);

        // Animated molecules
        const time = Date.now() * 0.001;
        const molCount = 12;
        const molSpeed = tempNorm * 3 + 0.5;
        ctx.fillStyle = `rgba(${gR + 80}, 120, ${gB + 40}, 0.7)`;
        for (let i = 0; i < molCount; i++) {
            const seed = i * 7.31;
            const mx = cylX + 10 + ((Math.sin(time * molSpeed + seed) * 0.5 + 0.5) * (cylW - 20));
            const my = pistonY + 8 + ((Math.cos(time * molSpeed * 1.3 + seed * 2.17) * 0.5 + 0.5) * (cylY + cylH - pistonY - 16));
            ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, Math.PI * 2); ctx.fill();
        }

        // Piston
        ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
        roundRect(ctx, cylX + 2, pistonY - 6, cylW - 4, 10, 3); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cylX + cylW / 2, pistonY - 6); ctx.lineTo(cylX + cylW / 2, cylY - 6); ctx.stroke();

        // Thermal base
        let baseColor = '#475569', baseLabel = 'SELECT PROCESS';
        if (proc === 'isothermal') {
            if (act > 0.5) { baseColor = '#dc2626'; baseLabel = `HEATER ${Math.round(gas.T)}K`; }
            else if (act < 0.5) { baseColor = '#2563eb'; baseLabel = `COOLER ${Math.round(gas.T)}K`; }
            else { baseColor = '#475569'; baseLabel = `RESERVOIR ${Math.round(gas.T)}K`; }
        } else if (proc === 'adiabatic') {
            baseColor = '#475569'; baseLabel = 'INSULATED';
        } else if (proc === 'isochoric') {
            if (act > 0.5) { baseColor = '#dc2626'; baseLabel = 'HEATING'; }
            else if (act < 0.5) { baseColor = '#2563eb'; baseLabel = 'COOLING'; }
            else { baseColor = '#475569'; baseLabel = 'LOCKED VOLUME'; }
        } else if (proc === 'isobaric') {
            if (act > 0.5) { baseColor = '#dc2626'; baseLabel = 'HEATING (P const)'; }
            else if (act < 0.5) { baseColor = '#2563eb'; baseLabel = 'COOLING (P const)'; }
            else { baseColor = '#475569'; baseLabel = 'CONSTANT P'; }
        }
        ctx.fillStyle = baseColor; roundRect(ctx, cylX - 2, cylY + cylH + 2, cylW + 4, 20, 5); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 7.5px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(baseLabel, cylX + cylW / 2, cylY + cylH + 16);

        // Heat arrows
        if (proc && act !== 0.5 && proc !== 'adiabatic') {
            const isHeating = (proc === 'isochoric' || proc === 'isobaric') ? act > 0.5 : act > 0.5;
            for (let i = 0; i < 3; i++) {
                const ay = isHeating
                    ? cylY + cylH + 2 - ((time * 3 + i * 0.3) % 1) * 28
                    : cylY + cylH + ((time * 3 + i * 0.3) % 1) * 28;
                const alpha = 0.7 - ((time * 3 + i * 0.3) % 1) * 0.7;
                ctx.fillStyle = isHeating ? `rgba(239,68,68,${alpha})` : `rgba(59,130,246,${alpha})`;
                ctx.beginPath();
                const ax = cylX + 18 + i * 38;
                if (isHeating) {
                    ctx.moveTo(ax, ay + 6); ctx.lineTo(ax + 7, ay); ctx.lineTo(ax + 14, ay + 6);
                } else {
                    ctx.moveTo(ax, ay); ctx.lineTo(ax + 7, ay + 6); ctx.lineTo(ax + 14, ay);
                }
                ctx.fill();
            }
        }

        // Thermometer
        const thX = cylX + cylW - 16, thH = 55, thY = cylY + cylH - 22 - thH;
        ctx.fillStyle = '#0f172a'; roundRect(ctx, thX, thY, 7, thH, 3); ctx.fill();
        ctx.fillStyle = `rgb(${gR}, 50, ${gB})`; ctx.fillRect(thX + 1, thY + thH - tempNorm * thH, 5, tempNorm * thH);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(gas.T)}K`, thX + 3, thY - 4);

        // Lock icon for isochoric
        if (proc === 'isochoric') {
            ctx.fillStyle = 'rgba(139,92,246,0.6)'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('🔒', cylX + 20, pistonY - 2);
        }

        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('GAS CYLINDER', cylX + cylW / 2, cylY - 10);

        // ===== P-V GRAPH (Center) =====
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Volume (V) →', gx + gw / 2, gy + gh + 14);
        ctx.save(); ctx.translate(gx - 12, gy + gh / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('Pressure (P) →', 0, 0); ctx.restore();

        const vMin = 1, vMax2 = 9, pMin2 = 0, pMax2 = 5000;
        const sv = (v: number) => gx + ((v - vMin) / (vMax2 - vMin)) * gw;
        const sp = (p: number) => gy + gh - ((p - pMin2) / (pMax2 - pMin2)) * gh;

        // Draw history curves
        const hist = historyRef.current;
        if (hist.length > 1) {
            let prevProc = hist[0].proc;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(sv(hist[0].V), sp(hist[0].P));
            for (let i = 1; i < hist.length; i++) {
                if (hist[i].proc !== prevProc) {
                    ctx.strokeStyle = PROCESS_INFO[prevProc]?.color || '#64748b';
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(sv(hist[i - 1].V), sp(hist[i - 1].P));
                    prevProc = hist[i].proc;
                }
                ctx.lineTo(sv(hist[i].V), sp(hist[i].P));
            }
            ctx.strokeStyle = PROCESS_INFO[prevProc]?.color || '#64748b';
            ctx.stroke();
        }

        // Current state dot
        ctx.fillStyle = procInfo?.color || '#fff';
        ctx.beginPath(); ctx.arc(sv(gas.V), sp(P), 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sv(gas.V), sp(P), 9, 0, Math.PI * 2); ctx.stroke();

        // State label
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`(${gas.V.toFixed(1)}L, ${(P / 1000).toFixed(1)}kPa)`, sv(gas.V) + 12, sp(P) + 3);

        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('P-V DIAGRAM', gx + gw / 2, gy - 6);

        // ===== RIGHT PANEL: Dashboard =====
        // State readouts
        ctx.fillStyle = 'rgba(30,41,59,0.7)'; roundRect(ctx, dx, dy, dw, 75, 8); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, dy, dw, 75, 8); ctx.stroke();

        const stateVals = [
            ['T', `${Math.round(gas.T)} K`, '#ef4444'],
            ['P', `${(P / 1000).toFixed(1)} kPa`, '#f59e0b'],
            ['V', `${gas.V.toFixed(2)} L`, '#3b82f6'],
        ];
        stateVals.forEach((sv2, i) => {
            const cx = dx + 10 + i * (dw / 3) + dw / 6;
            ctx.fillStyle = '#64748b'; ctx.font = '8px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(sv2[0], cx, dy + 18);
            ctx.fillStyle = sv2[2]; ctx.font = 'bold 16px monospace'; ctx.fillText(sv2[1], cx, dy + 38);
        });
        // First law
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('FIRST LAW:  ΔQ = ΔU + ΔW', dx + dw / 2, dy + 62);

        // Energy bars
        const barY = dy + 85;
        ctx.fillStyle = 'rgba(30,41,59,0.7)'; roundRect(ctx, dx, barY, dw, 110, 8); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, barY, dw, 110, 8); ctx.stroke();

        const maxE = Math.max(Math.abs(e.dQ), Math.abs(e.dU), Math.abs(e.dW), 1) * 1.2;
        const bars = [
            { label: 'ΔQ (Heat)', val: e.dQ, color: '#ef4444' },
            { label: 'ΔU (Internal)', val: e.dU, color: '#f59e0b' },
            { label: 'ΔW (Work)', val: e.dW, color: '#3b82f6' },
        ];
        bars.forEach((b, i) => {
            const by = barY + 14 + i * 30;
            ctx.fillStyle = '#64748b'; ctx.font = '8px Inter, sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(b.label, dx + 10, by + 4);
            ctx.fillStyle = b.val >= 0 ? '#334155' : '#334155';
            const barW = dw - 110;
            const barX = dx + 100;
            roundRect(ctx, barX, by - 4, barW, 14, 4); ctx.fill();
            const fillW = (Math.abs(b.val) / maxE) * (barW / 2);
            ctx.fillStyle = b.color;
            if (b.val >= 0) {
                roundRect(ctx, barX + barW / 2, by - 4, Math.min(fillW, barW / 2), 14, 4); ctx.fill();
            } else {
                roundRect(ctx, barX + barW / 2 - Math.min(fillW, barW / 2), by - 4, Math.min(fillW, barW / 2), 14, 4); ctx.fill();
            }
            // Center line
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(barX + barW / 2, by - 5); ctx.lineTo(barX + barW / 2, by + 11); ctx.stroke();
            // Value
            ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'right';
            ctx.fillText(`${b.val >= 0 ? '+' : ''}${b.val.toFixed(0)} J`, barX + barW + 6, by + 5);
        });
        // Balance check
        ctx.fillStyle = '#22c55e'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`ΔQ = ΔU + ΔW → ${e.dQ.toFixed(0)} = ${e.dU.toFixed(0)} + ${e.dW.toFixed(0)}`, dx + dw / 2, barY + 105);

        // ===== PROCESS INFO BOX (bottom-left) =====
        const descY = 250, descW2 = 460, descH2 = 100;
        ctx.fillStyle = 'rgba(30,41,59,0.85)'; roundRect(ctx, 15, descY, descW2, descH2, 10); ctx.fill();
        ctx.strokeStyle = procInfo?.color || '#475569'; ctx.lineWidth = 2;
        roundRect(ctx, 15, descY, descW2, descH2, 10); ctx.stroke();

        if (procInfo) {
            ctx.fillStyle = procInfo.color; roundRect(ctx, 27, descY + 10, 6, 26, 3); ctx.fill();
            ctx.fillStyle = procInfo.color; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(procInfo.title, 40, descY + 22);
            ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 10px monospace';
            ctx.fillText(procInfo.formula, 40, descY + 38);
            ctx.fillStyle = '#94a3b8'; ctx.font = '9px Inter, sans-serif';
            wrapText(ctx, procInfo.desc, 40, descY + 54, descW2 - 60, 13);
            ctx.fillStyle = '#64748b'; ctx.font = 'italic 8px Inter, sans-serif';
            ctx.fillText(`Constraint: ${procInfo.constraint}`, 40, descY + 92);
        } else {
            ctx.fillStyle = '#64748b'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'left';
            ctx.fillText('Select a process mode below to begin.', 40, descY + 30);
            ctx.fillStyle = '#475569'; ctx.font = '9px Inter, sans-serif';
            ctx.fillText('Each mode constrains a different variable (T, Q, V, or P).', 40, descY + 50);
            ctx.fillText('Drag the action slider left (compress/cool) or right (expand/heat).', 40, descY + 66);
        }

        // ===== PROCESS BUTTONS (right, under energy bars) =====
        const btnY2 = barY + 120;
        const modes = ['isothermal', 'adiabatic', 'isochoric', 'isobaric'];
        const modeLabels = ['Isothermal', 'Adiabatic', 'Isochoric', 'Isobaric'];
        const btnW2 = (dw - 20) / 2 - 3;
        modes.forEach((m, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const bx = dx + 10 + col * (btnW2 + 6);
            const by = btnY2 + row * 32;
            const isActive = proc === m;
            const c = PROCESS_INFO[m].color;
            ctx.fillStyle = isActive ? c : '#1e293b';
            roundRect(ctx, bx, by, btnW2, 26, 6); ctx.fill();
            ctx.strokeStyle = c; ctx.lineWidth = 1.5;
            roundRect(ctx, bx, by, btnW2, 26, 6); ctx.stroke();
            ctx.fillStyle = isActive ? '#fff' : c; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(modeLabels[i], bx + btnW2 / 2, by + 16);
        });

        // Action slider (right panel)
        const slY = btnY2 + 72;
        const slW = dw - 20;
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, slY, slW, 10, 5); ctx.fill();
        // Left/right labels
        const slLabel = proc === 'isochoric' ? ['Cool', 'Heat'] : ['Compress', 'Expand'];
        ctx.fillStyle = '#3b82f6'; ctx.font = '7px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`← ${slLabel[0]}`, dx + 10, slY - 3);
        ctx.fillStyle = '#ef4444'; ctx.textAlign = 'right';
        ctx.fillText(`${slLabel[1]} →`, dx + 10 + slW, slY - 3);
        // Thumb
        const thumbX = dx + 10 + act * slW;
        ctx.fillStyle = act > 0.5 ? '#ef4444' : act < 0.5 ? '#3b82f6' : '#94a3b8';
        ctx.beginPath(); ctx.arc(thumbX, slY + 5, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(thumbX, slY + 5, 8, 0, Math.PI * 2); ctx.stroke();

        // Center line
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(dx + 10 + slW / 2, slY - 1); ctx.lineTo(dx + 10 + slW / 2, slY + 11); ctx.stroke();

        // Reset button
        const rstY = slY + 22;
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, rstY, slW, 24, 6); ctx.fill();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
        roundRect(ctx, dx + 10, rstY, slW, 24, 6); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('↺ Reset All', dx + 10 + slW / 2, rstY + 15);

        // Top instruction
        ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        if (!proc) { ctx.fillStyle = '#f59e0b'; ctx.fillText('Select a process mode to begin exploring the First Law of Thermodynamics.', 10, 14); }
        else { ctx.fillStyle = '#94a3b8'; ctx.fillText(`Mode: ${PROCESS_INFO[proc].title} — Drag the slider to apply ${proc === 'isochoric' ? 'heat/cooling' : 'expansion/compression'}.`, 10, 14); }

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    // ===== CLICK / DRAG HANDLERS =====
    const draggingRef = useRef(false);

    const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height),
        };
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasCoords(e);
        const dx = 480, dw = 310, barY = 25 + 85;

        // Process buttons
        const btnY2 = barY + 120 + 110;
        const btnW2 = (dw - 20) / 2 - 3;
        const modes = ['isothermal', 'adiabatic', 'isochoric', 'isobaric'];
        for (let i = 0; i < 4; i++) {
            const col = i % 2, row = Math.floor(i / 2);
            const bx = dx + 10 + col * (btnW2 + 6);
            const by = btnY2 + row * 32;
            if (x >= bx && x <= bx + btnW2 && y >= by && y <= by + 26) {
                setProcess(modes[i]);
                setAction(0.5);
                energyRef.current = { dQ: 0, dU: 0, dW: 0 };
                historyRef.current = [];
                return;
            }
        }

        // Slider
        const slY = btnY2 + 72;
        const slW = dw - 20;
        if (x >= dx + 10 && x <= dx + 10 + slW && y >= slY - 10 && y <= slY + 20) {
            draggingRef.current = true;
            const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
            setAction(val);
        }

        // Reset
        const rstY = slY + 22;
        if (x >= dx + 10 && x <= dx + 10 + slW && y >= rstY && y <= rstY + 24) {
            reset();
        }
    }, [getCanvasCoords, reset]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!draggingRef.current) return;
        const { x } = getCanvasCoords(e);
        const dx = 480, dw = 310, barY = 25 + 85;
        const slW = dw - 20;
        const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
        setAction(val);
    }, [getCanvasCoords]);

    const handleMouseUp = useCallback(() => {
        if (draggingRef.current) {
            draggingRef.current = false;
            setAction(0.5); // spring back to neutral
        }
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={380}
            className="w-full h-full cursor-pointer"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
    ctx.textAlign = 'left';
    const words = text.split(' ');
    let line = '', curY = y;
    for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line.trim(), x, curY);
            line = word + ' '; curY += lineH;
        } else { line = test; }
    }
    if (line.trim()) ctx.fillText(line.trim(), x, curY);
}

export default ThermodynamicProcessesLab;
