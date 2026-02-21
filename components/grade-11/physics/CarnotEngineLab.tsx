import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CarnotEngineLabProps {
    t1: number;
    t2: number;
}

const R = 8.314;
const gamma = 1.4;
const n = 1;

function isothermP(V: number, T: number) { return (n * R * T) / V; }
function adiabaticP(V: number, P0: number, V0: number) { return P0 * Math.pow(V0 / V, gamma); }

const STEP_INFO = [
    { title: 'Ready', short: 'Set temperatures and press Start.', detail: '' },
    {
        title: 'Step 1: Isothermal Expansion',
        short: 'Gas absorbs heat Q₁ from hot source at T₁.',
        detail: 'The gas is in contact with the HOT reservoir. It expands slowly. Temperature stays constant (isothermal), so all the heat absorbed (Q₁) converts to work done BY the gas. On the P-V graph, this traces a shallow curve going RIGHT.',
    },
    {
        title: 'Step 2: Adiabatic Expansion',
        short: 'Gas expands further, temperature drops to T₂.',
        detail: 'The gas is now INSULATED — no heat enters or leaves. It keeps expanding, but uses its own internal energy to do work. Temperature falls from T₁ down to T₂. On the P-V graph, this is a STEEPER curve going RIGHT and DOWN.',
    },
    {
        title: 'Step 3: Isothermal Compression',
        short: 'Gas rejects heat Q₂ to cold sink at T₂.',
        detail: 'The gas is placed on the COLD reservoir. It is compressed slowly. The work done ON the gas generates heat, which is immediately rejected to the cold sink (Q₂), keeping temperature constant at T₂. The P-V curve goes LEFT.',
    },
    {
        title: 'Step 4: Adiabatic Compression',
        short: 'Gas compressed back to start, temperature rises to T₁.',
        detail: 'INSULATED again. The gas is compressed to its original volume. All work done on the gas becomes internal energy, raising temperature back to T₁. The P-V loop closes perfectly!',
    },
    {
        title: '✓ Cycle Complete!',
        short: 'The green area = Net Work = Q₁ − Q₂.',
        detail: 'The engine absorbed Q₁, rejected Q₂, and produced net work W = Q₁ − Q₂. The efficiency η = 1 − T₂/T₁ is the absolute maximum for ANY engine between these temperatures. Click any step below to replay it.',
    },
];

const CarnotEngineLab: React.FC<CarnotEngineLabProps> = ({ t1, t2 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    const [phase, setPhase] = useState(0); // 0=idle, 1-4 steps, 5=done
    const phaseRef = useRef(0);
    phaseRef.current = phase;

    const globalProgRef = useRef(0);
    const autoPlayRef = useRef(false);
    const replayStepRef = useRef(0); // which step to replay (0=none)

    // Volumes at corner points
    const V1 = 1.0, V2 = 2.5;
    const P1 = isothermP(V1, t1), P2 = isothermP(V2, t1);
    const V3 = V2 * Math.pow(t1 / t2, 1 / (gamma - 1));
    const V4 = V1 * Math.pow(t1 / t2, 1 / (gamma - 1));
    const P3 = isothermP(V3, t2), P4 = isothermP(V4, t2);

    const Q1 = n * R * t1 * Math.log(V2 / V1);
    const Q2 = n * R * t2 * Math.log(V3 / V4);
    const W_net = Q1 - Q2;
    const efficiency = 1 - t2 / t1;

    const startCycle = useCallback(() => {
        globalProgRef.current = 0; autoPlayRef.current = true; replayStepRef.current = 0; setPhase(1);
    }, []);
    const resetCycle = useCallback(() => {
        globalProgRef.current = 0; autoPlayRef.current = false; replayStepRef.current = 0; setPhase(0);
    }, []);
    const replayStep = useCallback((s: number) => {
        replayStepRef.current = s;
        globalProgRef.current = s - 1; // start from beginning of that step
        autoPlayRef.current = true;
        setPhase(s);
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width, H = canvas.height;
        const currentPhase = phaseRef.current;
        const isReplay = replayStepRef.current > 0;

        // Auto-advance
        if (autoPlayRef.current && currentPhase >= 1 && currentPhase <= 4) {
            globalProgRef.current += 0.006;
            const sp = globalProgRef.current - (currentPhase - 1);
            if (sp >= 1) {
                if (isReplay) {
                    // Replay just one step, then stop at done state
                    autoPlayRef.current = false;
                    setPhase(5);
                } else if (currentPhase < 4) {
                    setPhase(currentPhase + 1);
                } else {
                    autoPlayRef.current = false;
                    setPhase(5);
                }
            }
        }

        const gp = globalProgRef.current;
        const stepProg = (s: number) => {
            if (isReplay && replayStepRef.current !== s) return s < replayStepRef.current ? 1 : 0;
            return Math.max(0, Math.min(1, gp - (s - 1)));
        };

        // --- CLEAR ---
        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#1e293b');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // For replay mode: always show all curves up to the replay step
        const showUpTo = isReplay ? 5 : currentPhase; // show all completed curves

        // ===== LAYOUT =====
        const cylX = 30, cylY = 45, cylW = 150, cylH = 170;
        const gx = 215, gy = 35, gw = 250, gh = 190;
        const dx = 500, dy = 30, dw = 292;

        // Current animated values
        let currentV = V1, currentT = t1;
        const p1 = stepProg(1), p2 = stepProg(2), p3 = stepProg(3), p4 = stepProg(4);

        if (currentPhase === 0) { currentV = V1; currentT = t1; }
        else if (currentPhase === 1) { currentV = V1 + (V2 - V1) * p1; currentT = t1; }
        else if (currentPhase === 2) { currentV = V2 + (V3 - V2) * p2; currentT = t1 + (t2 - t1) * p2; }
        else if (currentPhase === 3) { currentV = V3 + (V4 - V3) * p3; currentT = t2; }
        else if (currentPhase === 4) { currentV = V4 + (V1 - V4) * p4; currentT = t2 + (t1 - t2) * p4; }
        else {
            // Phase 5 (done) — keep cylinder at end position of last replayed step
            const rs = replayStepRef.current;
            if (rs === 1) { currentV = V2; currentT = t1; }
            else if (rs === 2) { currentV = V3; currentT = t2; }
            else if (rs === 3) { currentV = V4; currentT = t2; }
            else { currentV = V1; currentT = t1; } // step 4 or full cycle => back to start
        }

        // ===== GAS CYLINDER (Left) =====
        const maxV = Math.max(V3, V4, V2) * 1.1;
        const pistonNorm = Math.max(0, Math.min(1, (currentV - V1) / (maxV - V1)));
        const pistonY = cylY + cylH - 14 - pistonNorm * (cylH - 40);

        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.strokeRect(cylX, cylY, cylW, cylH);

        // Stand
        let standColor = '#475569', standLabel = 'STANDBY';
        const displayPhase = (currentPhase >= 1 && currentPhase <= 4) ? currentPhase : currentPhase === 5 ? 5 : 0;
        if (displayPhase === 1) { standColor = '#dc2626'; standLabel = `HOT ${t1}K`; }
        else if (displayPhase === 2) { standColor = '#475569'; standLabel = 'INSULATED'; }
        else if (displayPhase === 3) { standColor = '#2563eb'; standLabel = `COLD ${t2}K`; }
        else if (displayPhase === 4) { standColor = '#475569'; standLabel = 'INSULATED'; }
        else if (displayPhase === 5) { standColor = '#16a34a'; standLabel = 'DONE'; }

        ctx.fillStyle = standColor; roundRect(ctx, cylX - 3, cylY + cylH + 2, cylW + 6, 22, 5); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(standLabel, cylX + cylW / 2, cylY + cylH + 17);

        // Gas fill
        const tempNorm = Math.max(0, Math.min(1, (currentT - t2) / Math.max(1, t1 - t2)));
        const gasR = Math.round(40 + tempNorm * 180), gasB = Math.round(200 - tempNorm * 150);
        ctx.fillStyle = `rgba(${gasR}, 60, ${gasB}, 0.35)`;
        ctx.fillRect(cylX + 2, pistonY + 3, cylW - 4, cylY + cylH - pistonY - 4);

        // Piston
        ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
        roundRect(ctx, cylX + 2, pistonY - 7, cylW - 4, 10, 3); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cylX + cylW / 2, pistonY - 7); ctx.lineTo(cylX + cylW / 2, cylY - 6); ctx.stroke();

        // Thermometer
        const thX = cylX + cylW - 18, thH = 60, thY = cylY + cylH - 24 - thH;
        ctx.fillStyle = '#0f172a'; roundRect(ctx, thX, thY, 8, thH, 3); ctx.fill();
        ctx.fillStyle = `rgb(${gasR}, 60, ${gasB})`; ctx.fillRect(thX + 1, thY + thH - tempNorm * thH, 6, tempNorm * thH);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(currentT)}K`, thX + 4, thY - 4);

        // Heat arrows
        if (currentPhase === 1 && p1 > 0.05) {
            for (let i = 0; i < 3; i++) {
                const ay = cylY + cylH + 2 - ((gp * 4 + i * 0.3) % 1) * 30;
                ctx.fillStyle = `rgba(239,68,68,${0.7 - ((gp * 4 + i * 0.3) % 1) * 0.7})`;
                ctx.beginPath(); ctx.moveTo(cylX + 20 + i * 40, ay + 7); ctx.lineTo(cylX + 27 + i * 40, ay); ctx.lineTo(cylX + 34 + i * 40, ay + 7); ctx.fill();
            }
        }
        if (currentPhase === 3 && p3 > 0.05) {
            for (let i = 0; i < 3; i++) {
                const ay = cylY + cylH + ((gp * 4 + i * 0.3) % 1) * 30;
                ctx.fillStyle = `rgba(59,130,246,${0.7 - ((gp * 4 + i * 0.3) % 1) * 0.7})`;
                ctx.beginPath(); ctx.moveTo(cylX + 20 + i * 40, ay); ctx.lineTo(cylX + 27 + i * 40, ay + 7); ctx.lineTo(cylX + 34 + i * 40, ay); ctx.fill();
            }
        }

        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('GAS CYLINDER', cylX + cylW / 2, cylY - 12);

        // ===== P-V GRAPH (Center) =====
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Volume (V) →', gx + gw / 2, gy + gh + 14);
        ctx.save(); ctx.translate(gx - 12, gy + gh / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('Pressure (P) →', 0, 0); ctx.restore();

        const vMax = Math.max(V1, V2, V3, V4) * 1.15;
        const pMax = Math.max(P1, P2, P3, P4) * 1.15;
        const sv = (v: number) => gx + (v / vMax) * gw;
        const sp2 = (p: number) => gy + gh - (p / pMax) * gh;

        ctx.lineWidth = 3;

        // Draw curves — always show completed, animate current
        // For replay: show all 4 curves (dim the ones not being replayed), highlight the active one
        const drawCurve = (stepNum: number, vStart: number, vEnd: number, pFn: (v: number) => number, color: string, isReverse: boolean) => {
            const prog = stepProg(stepNum);
            const isActiveReplay = isReplay && replayStepRef.current === stepNum;
            const shouldShow = isReplay ? true : showUpTo >= stepNum;
            if (!shouldShow && prog <= 0) return;

            const endV = shouldShow && prog >= 1 ? vEnd : (isReverse ? vStart + (vEnd - vStart) * prog : vStart + (vEnd - vStart) * prog);

            // Dim non-replayed curves in replay mode
            ctx.globalAlpha = (isReplay && !isActiveReplay && currentPhase === 5) ? 0.25 : 1;
            ctx.strokeStyle = color;
            ctx.lineWidth = isActiveReplay ? 4 : 3;
            ctx.beginPath();
            const step = isReverse ? -0.015 : 0.015;
            let first = true;
            for (let v = vStart; isReverse ? v >= endV : v <= endV; v += step) {
                const px = sv(v), py = sp2(pFn(v));
                first ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                first = false;
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        drawCurve(1, V1, V2, (v) => isothermP(v, t1), '#ef4444', false);
        drawCurve(2, V2, V3, (v) => adiabaticP(v, P2, V2), '#f59e0b', false);
        drawCurve(3, V3, V4, (v) => isothermP(v, t2), '#3b82f6', true);
        drawCurve(4, V4, V1, (v) => adiabaticP(v, P4, V4), '#a855f7', true);

        // Fill green area when done (and not replaying a single step)
        if (currentPhase === 5 && !isReplay) {
            ctx.fillStyle = 'rgba(34,197,94,0.2)'; ctx.beginPath();
            for (let v = V1; v <= V2; v += 0.02) { const p = isothermP(v, t1); v <= V1 + 0.01 ? ctx.moveTo(sv(v), sp2(p)) : ctx.lineTo(sv(v), sp2(p)); }
            for (let v = V2; v <= V3; v += 0.02) ctx.lineTo(sv(v), sp2(adiabaticP(v, P2, V2)));
            for (let v = V3; v >= V4; v -= 0.02) ctx.lineTo(sv(v), sp2(isothermP(v, t2)));
            for (let v = V4; v >= V1; v -= 0.02) ctx.lineTo(sv(v), sp2(adiabaticP(v, P4, V4)));
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#22c55e'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'center';
            const cV = (V1 + V3) / 2;
            ctx.fillText('W net', sv(cV), sp2((isothermP(cV, t1) + isothermP(cV, t2)) / 2) + 3);
        }

        // Corner dots
        const showDotFor = (s: number) => isReplay ? true : (showUpTo >= s || stepProg(s) > 0.95);
        if (showDotFor(1)) drawDot(ctx, sv(V1), sp2(P1), '1', '#ef4444');
        if (showDotFor(1) && stepProg(1) > 0.95) drawDot(ctx, sv(V2), sp2(P2), '2', '#f59e0b');
        if (showDotFor(2) && stepProg(2) > 0.95) drawDot(ctx, sv(V3), sp2(P3), '3', '#3b82f6');
        if (showDotFor(3) && stepProg(3) > 0.95) drawDot(ctx, sv(V4), sp2(P4), '4', '#a855f7');

        // Tracer dot
        if (currentPhase >= 1 && currentPhase <= 4) {
            let dotP = P1;
            if (currentPhase === 1) dotP = isothermP(currentV, t1);
            else if (currentPhase === 2) dotP = adiabaticP(currentV, P2, V2);
            else if (currentPhase === 3) dotP = isothermP(currentV, t2);
            else if (currentPhase === 4) dotP = adiabaticP(currentV, P4, V4);
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sv(currentV), sp2(dotP), 5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(sv(currentV), sp2(dotP), 9, 0, Math.PI * 2); ctx.stroke();
        }

        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('P-V DIAGRAM', gx + gw / 2, gy - 6);

        // Legend row
        const legY = gy + gh + 20;
        [['#ef4444', '1. Isotherm T\u2081'], ['#f59e0b', '2. Adiabat \u2193'], ['#3b82f6', '3. Isotherm T\u2082'], ['#a855f7', '4. Adiabat \u2191']].forEach(([c, l], i) => {
            ctx.fillStyle = c; ctx.fillRect(gx + i * 64, legY, 7, 7);
            ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(l, gx + 10 + i * 64, legY + 6);
        });

        // ===== RIGHT PANEL: Dashboard only =====
        ctx.fillStyle = 'rgba(30,41,59,0.7)'; roundRect(ctx, dx, dy, dw, 120, 8); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, dy, dw, 120, 8); ctx.stroke();

        const dCols = 3, dRowH = 36;
        const vals = [
            ['T\u2081', `${t1} K`, '#ef4444'], ['Q\u2081 In', `${Q1.toFixed(0)} J`, '#f59e0b'], ['W net', `${W_net.toFixed(0)} J`, '#22c55e'],
            ['T\u2082', `${t2} K`, '#3b82f6'], ['Q\u2082 Out', `${Q2.toFixed(0)} J`, '#60a5fa'], [`\u03b7`, `${(efficiency * 100).toFixed(1)}%`, '#22c55e'],
        ];
        vals.forEach((v, i) => {
            const col = i % dCols, row = Math.floor(i / dCols);
            const cx = dx + 10 + col * ((dw - 20) / dCols) + (dw - 20) / dCols / 2;
            const cy = dy + 20 + row * dRowH;
            ctx.fillStyle = '#64748b'; ctx.font = '8px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(v[0], cx, cy);
            ctx.fillStyle = v[2]; ctx.font = 'bold 14px monospace'; ctx.fillText(v[1], cx, cy + 16);
        });

        const eY = dy + 95;
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, eY, dw - 20, 12, 4); ctx.fill();
        ctx.fillStyle = '#22c55e'; roundRect(ctx, dx + 10, eY, (dw - 20) * efficiency, 12, 4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`\u03b7 = 1 \u2212 ${t2}/${t1} = ${(efficiency * 100).toFixed(1)}%`, dx + dw / 2, eY + 10);

        // ===== REPLAY BUTTONS (Right, under dashboard) =====
        const rY = dy + 125;
        if (currentPhase === 5) {
            const rbW = (dw - 20) / 4 - 4;
            const rbLabels = ['Step 1', 'Step 2', 'Step 3', 'Step 4'];
            const rbColors = ['#ef4444', '#f59e0b', '#3b82f6', '#a855f7'];
            for (let i = 0; i < 4; i++) {
                const bx = dx + 10 + i * (rbW + 5);
                const isActiveR = isReplay && replayStepRef.current === i + 1;
                ctx.fillStyle = isActiveR ? rbColors[i] : '#1e293b';
                roundRect(ctx, bx, rY, rbW, 28, 6); ctx.fill();
                ctx.strokeStyle = rbColors[i]; ctx.lineWidth = 1.5;
                roundRect(ctx, bx, rY, rbW, 28, 6); ctx.stroke();
                ctx.fillStyle = isActiveR ? '#fff' : rbColors[i]; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText(rbLabels[i], bx + rbW / 2, rY + 17);
            }
            ctx.fillStyle = isReplay ? '#1e293b' : '#16a34a';
            roundRect(ctx, dx + 10, rY + 34, dw / 2 - 15, 26, 6); ctx.fill();
            ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1;
            roundRect(ctx, dx + 10, rY + 34, dw / 2 - 15, 26, 6); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('\u25b6 Replay Full Cycle', dx + 10 + (dw / 2 - 15) / 2, rY + 51);

            ctx.fillStyle = '#1e293b';
            roundRect(ctx, dx + dw / 2 + 5, rY + 34, dw / 2 - 15, 26, 6); ctx.fill();
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
            roundRect(ctx, dx + dw / 2 + 5, rY + 34, dw / 2 - 15, 26, 6); ctx.stroke();
            ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif';
            ctx.fillText('\u21ba Reset', dx + dw / 2 + 5 + (dw / 2 - 15) / 2, rY + 51);
        }

        // ===== STEP DESCRIPTION BOX (Bottom-left, under cylinder + graph) =====
        const descX = 15, descY = 260, descW = 470, descH = 160;
        const info = STEP_INFO[currentPhase];
        const stepColors = ['#64748b', '#ef4444', '#f59e0b', '#3b82f6', '#a855f7', '#22c55e'];

        // Show the correct step info when replaying
        const displayInfo = (isReplay && replayStepRef.current > 0 && currentPhase === 5) ? STEP_INFO[replayStepRef.current] : info;
        const displayColor = (isReplay && replayStepRef.current > 0 && currentPhase === 5) ? stepColors[replayStepRef.current] : stepColors[currentPhase];

        ctx.fillStyle = 'rgba(30,41,59,0.85)'; roundRect(ctx, descX, descY, descW, descH, 10); ctx.fill();
        ctx.strokeStyle = displayColor; ctx.lineWidth = 2;
        roundRect(ctx, descX, descY, descW, descH, 10); ctx.stroke();

        // Step badge
        ctx.fillStyle = displayColor;
        roundRect(ctx, descX + 12, descY + 12, 8, 30, 3); ctx.fill();

        // Title
        ctx.fillStyle = displayColor; ctx.font = 'bold 13px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(displayInfo.title, descX + 28, descY + 26);

        // Short description
        ctx.fillStyle = '#e2e8f0'; ctx.font = '11px Inter, sans-serif';
        ctx.fillText(displayInfo.short, descX + 28, descY + 46);

        // Detail
        if (displayInfo.detail) {
            ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter, sans-serif';
            wrapText(ctx, displayInfo.detail, descX + 28, descY + 66, descW - 48, 15);
        }

        // Step progress dots inside description box
        const dotBarX = descX + descW - 100, dotBarY = descY + 16;
        for (let i = 1; i <= 4; i++) {
            const ddx = dotBarX + (i - 1) * 22;
            const done = (!isReplay && currentPhase > i) || currentPhase === 5;
            const active = currentPhase === i || (isReplay && replayStepRef.current === i && currentPhase === 5);
            ctx.fillStyle = active ? stepColors[i] : done ? '#22c55e' : '#334155';
            ctx.beginPath(); ctx.arc(ddx, dotBarY, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(active ? `${i}` : done ? '\u2713' : `${i}`, ddx, dotBarY + 3);
            if (i < 4) {
                ctx.strokeStyle = done ? '#22c55e' : '#334155'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(ddx + 8, dotBarY); ctx.lineTo(ddx + 14, dotBarY); ctx.stroke();
            }
        }

        // ===== CARNOT'S THEOREM (Right, under replay buttons) =====
        if (currentPhase === 5) {
            const rpY = rY + 80;
            ctx.fillStyle = 'rgba(30,41,59,0.6)'; roundRect(ctx, dx, rpY, dw, 90, 8); ctx.fill();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, rpY, dw, 90, 8); ctx.stroke();
            ctx.fillStyle = '#64748b'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('CARNOT\'S THEOREM', dx + dw / 2, rpY + 16);
            ctx.fillStyle = '#94a3b8'; ctx.font = '9px Inter, sans-serif';
            wrapText(ctx, 'No engine between T\u2081 and T\u2082 can exceed Carnot efficiency. It depends ONLY on temperatures, not on the working substance.', dx + 12, rpY + 32, dw - 24, 13);
        }

        // ===== MAIN ACTION BUTTON =====
        const btnY = H - 48;
        if (currentPhase === 0) {
            const bw = 190, bx = 30;
            ctx.fillStyle = '#22c55e'; roundRect(ctx, bx, btnY, bw, 36, 10); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('\u25b6  Start Carnot Cycle', bx + bw / 2, btnY + 23);
        }

        // Top instruction
        ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'left';
        if (currentPhase === 0) { ctx.fillStyle = '#f59e0b'; ctx.fillText('Press \u25b6 Start to watch the Carnot Cycle build automatically.', 10, 16); }
        else if (currentPhase <= 4) { ctx.fillStyle = '#94a3b8'; ctx.fillText(`\u23f3 ${STEP_INFO[currentPhase].title}`, 10, 16); }
        else { ctx.fillStyle = '#22c55e'; ctx.fillText('\ud83c\udf89 Complete! Click any Step button to replay and explain it.', 10, 16); }

        animRef.current = requestAnimationFrame(draw);
    }, [t1, t2, V1, V2, V3, V4, P1, P2, P3, P4, Q1, Q2, W_net, efficiency, phase]);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * sx, y = (e.clientY - rect.top) * sy;
        const H = canvas.height, cW = canvas.width;

        // Start button
        if (phaseRef.current === 0) {
            if (x >= 30 && x <= 220 && y >= H - 48 && y <= H - 12) startCycle();
        }

        // Step replay buttons (when done)
        if (phaseRef.current === 5) {
            const dx = 500, dw = 292, rY = 30 + 125;
            const rbW = (dw - 20) / 4 - 4;
            for (let i = 0; i < 4; i++) {
                const bx = dx + 10 + i * (rbW + 5);
                if (x >= bx && x <= bx + rbW && y >= rY && y <= rY + 28) {
                    replayStep(i + 1);
                    return;
                }
            }
            if (x >= dx + 10 && x <= dx + 10 + dw / 2 - 15 && y >= rY + 34 && y <= rY + 60) {
                startCycle();
                return;
            }
            if (x >= dx + dw / 2 + 5 && x <= dx + dw - 5 && y >= rY + 34 && y <= rY + 60) {
                resetCycle();
                return;
            }
        }
    }, [startCycle, resetCycle, replayStep]);

    useEffect(() => { resetCycle(); }, [t1, t2, resetCycle]);

    return (
        <canvas ref={canvasRef} width={800} height={480} className="w-full h-full cursor-pointer" onClick={handleClick} />
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

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 9);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
    ctx.textAlign = 'left';
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line.trim(), x, curY);
            line = word + ' ';
            curY += lineH;
        } else {
            line = test;
        }
    }
    if (line.trim()) ctx.fillText(line.trim(), x, curY);
}

export default CarnotEngineLab;
