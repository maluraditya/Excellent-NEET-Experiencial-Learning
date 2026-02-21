import React, { useRef, useEffect, useCallback } from 'react';

const SHMLab: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);
    const stateRef = useRef({
        mass: 1.0,    // kg
        k: 100,       // N/m spring constant
        A: 60,        // amplitude in px (max displacement)
        running: true,
        time: 0,
    });
    const graphRef = useRef<{ t: number; x: number; v: number; a: number }[]>([]);
    const frameRef = useRef(0);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        const s = stateRef.current;
        frameRef.current++;

        // Physics
        const omega = Math.sqrt(s.k / s.mass);
        const T = 2 * Math.PI / omega;
        const freq = 1 / T;

        if (s.running) s.time += 0.025;

        const x = s.A * Math.cos(omega * s.time); // displacement (px)
        const v = -omega * s.A * Math.sin(omega * s.time); // velocity (px/s scaled)
        const a = -omega * omega * s.A * Math.cos(omega * s.time); // acceleration

        // Normalized for display
        const vMax = omega * s.A;
        const aMax = omega * omega * s.A;

        // Store graph data
        if (s.running && frameRef.current % 2 === 0) {
            graphRef.current.push({ t: s.time, x: x / s.A, v: v / vMax, a: a / aMax });
            if (graphRef.current.length > 200) graphRef.current.shift();
        }

        // ===== CLEAR =====
        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#1e293b');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // ===== LAYOUT =====
        const tableY = 95, tableH = 70;
        const wallX = 30, wallH = 100;
        const equilibX = 260; // mean position on canvas
        const blockW = 40, blockH = 40;
        const dx = 500, dy = 20, dw = 290; // right panel

        // ===== TABLE =====
        ctx.fillStyle = '#334155';
        roundRect(ctx, wallX, tableY, W * 0.55, tableH, 6); ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
        roundRect(ctx, wallX, tableY, W * 0.55, tableH, 6); ctx.stroke();
        ctx.fillStyle = '#1e293b'; ctx.fillRect(wallX, tableY, 20, tableH); // wall

        // Wall pattern
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(wallX + 18, tableY + 5 + i * 18);
            ctx.lineTo(wallX + 2, tableY + 14 + i * 18);
            ctx.stroke();
        }

        // ===== SPRING =====
        const springStartX = wallX + 20;
        const blockCX = equilibX + x; // block center x
        const springEndX = blockCX - blockW / 2;
        const springY = tableY + 18;
        const springLen = springEndX - springStartX;
        const coils = 12;
        const coilW = springLen / coils;
        const coilH = 10 + (s.k - 10) / 490 * 8; // thicker for higher k

        // Draw spring as zigzag
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5 + (s.k - 10) / 490 * 2; // thicker for stiffer spring
        ctx.beginPath();
        ctx.moveTo(springStartX, springY);
        for (let i = 0; i < coils; i++) {
            const cx = springStartX + (i + 0.25) * coilW;
            const cx2 = springStartX + (i + 0.75) * coilW;
            ctx.lineTo(cx, springY - coilH);
            ctx.lineTo(cx2, springY + coilH);
        }
        ctx.lineTo(springEndX, springY);
        ctx.stroke();

        // ===== BLOCK =====
        const blockX = blockCX - blockW / 2;
        const blockY = tableY + 2;
        const massNorm = (s.mass - 0.1) / 4.9;

        // Block with mass-dependent color
        const bR = Math.round(80 + massNorm * 120);
        const bG = Math.round(120 - massNorm * 60);
        const bB = Math.round(200 - massNorm * 150);
        ctx.fillStyle = `rgb(${bR},${bG},${bB})`;
        roundRect(ctx, blockX, blockY, blockW, blockH, 4); ctx.fill();
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
        roundRect(ctx, blockX, blockY, blockW, blockH, 4); ctx.stroke();

        // Mass label on block
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${s.mass.toFixed(1)}`, blockCX, blockY + blockH / 2 + 3);
        ctx.fillText('kg', blockCX, blockY + blockH / 2 + 13);

        // ===== VELOCITY VECTOR (green) =====
        const vScale = v / vMax * 50;
        if (Math.abs(vScale) > 2) {
            ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(blockCX, blockY - 5);
            ctx.lineTo(blockCX + vScale, blockY - 5); ctx.stroke();
            // Arrow head
            const dir = vScale > 0 ? 1 : -1;
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.moveTo(blockCX + vScale + dir * 8, blockY - 5);
            ctx.lineTo(blockCX + vScale - dir * 3, blockY - 10);
            ctx.lineTo(blockCX + vScale - dir * 3, blockY);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#22c55e'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('v', blockCX + vScale / 2, blockY - 14);
        }

        // ===== ACCELERATION VECTOR (yellow) =====
        const aScale = a / aMax * 50;
        if (Math.abs(aScale) > 2) {
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(blockCX, blockY + blockH + 8);
            ctx.lineTo(blockCX + aScale, blockY + blockH + 8); ctx.stroke();
            const dir2 = aScale > 0 ? 1 : -1;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(blockCX + aScale + dir2 * 7, blockY + blockH + 8);
            ctx.lineTo(blockCX + aScale - dir2 * 3, blockY + blockH + 3);
            ctx.lineTo(blockCX + aScale - dir2 * 3, blockY + blockH + 13);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('a', blockCX + aScale / 2, blockY + blockH + 22);
        }

        // Equilibrium line
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(equilibX, tableY - 5); ctx.lineTo(equilibX, tableY + tableH + 5); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('x = 0', equilibX, tableY + tableH + 15);

        // ===== 3 SYNC GRAPHS (bottom-left) =====
        const gx = 20, gw = 220, gh = 55;
        const graphs = [
            { label: 'x(t)', color: '#3b82f6', key: 'x' as const, yOff: 185 },
            { label: 'v(t)', color: '#22c55e', key: 'v' as const, yOff: 252 },
            { label: 'a(t)', color: '#f59e0b', key: 'a' as const, yOff: 319 },
        ];

        graphs.forEach(g => {
            const gy = g.yOff;
            // Background
            ctx.fillStyle = 'rgba(15,23,42,0.6)'; roundRect(ctx, gx, gy, gw, gh, 6); ctx.fill();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 0.5; roundRect(ctx, gx, gy, gw, gh, 6); ctx.stroke();

            // Centerline
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke();

            // Label
            ctx.fillStyle = g.color; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
            ctx.fillText(g.label, gx + 5, gy + 12);

            // Plot
            const gd = graphRef.current;
            if (gd.length > 1) {
                ctx.strokeStyle = g.color; ctx.lineWidth = 1.5;
                ctx.beginPath();
                gd.forEach((d, i) => {
                    const px = gx + (i / (gd.length - 1)) * gw;
                    const py = gy + gh / 2 - d[g.key] * (gh / 2 - 4);
                    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                });
                ctx.stroke();
            }
        });

        // Phase labels
        ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Phase: 0°', gx + gw + 5, 195);
        ctx.fillText('Phase: 90° (π/2)', gx + gw + 5, 262);
        ctx.fillText('Phase: 180° (π)', gx + gw + 5, 329);

        // ===== ENERGY BARS (center-bottom) =====
        const ebX = 265, ebY = 185, ebW = 215, ebH = 190;
        ctx.fillStyle = 'rgba(30,41,59,0.7)'; roundRect(ctx, ebX, ebY, ebW, ebH, 8); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, ebX, ebY, ebW, ebH, 8); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('ENERGY IN SHM', ebX + ebW / 2, ebY + 14);

        // KE = ½mv² = ½kA²sin²(ωt), PE = ½kx² = ½kA²cos²(ωt)
        const totalE = 0.5 * s.k * (s.A * s.A) / 3600; // scale A from px to normalized
        const KE_frac = Math.pow(Math.sin(omega * s.time), 2);
        const PE_frac = Math.pow(Math.cos(omega * s.time), 2);

        const barW = 45, barGap = 15;
        const barMaxH = ebH - 55;
        const barBtm = ebY + ebH - 20;
        const bars = [
            { label: 'KE', val: KE_frac, color: '#22c55e' },
            { label: 'PE', val: PE_frac, color: '#ef4444' },
            { label: 'Total', val: 1.0, color: '#f59e0b' },
        ];
        const totalBarsW = bars.length * barW + (bars.length - 1) * barGap;
        const barsStartX = ebX + (ebW - totalBarsW) / 2;

        bars.forEach((b, i) => {
            const bx = barsStartX + i * (barW + barGap);
            const fh = b.val * barMaxH;
            // Background
            ctx.fillStyle = '#1e293b'; roundRect(ctx, bx, barBtm - barMaxH, barW, barMaxH, 4); ctx.fill();
            // Fill
            ctx.fillStyle = b.color;
            if (fh > 2) { roundRect(ctx, bx, barBtm - fh, barW, fh, 4); ctx.fill(); }
            // Value
            ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
            ctx.fillText(`${(b.val * 100).toFixed(0)}%`, bx + barW / 2, barBtm - fh - 5);
            // Label
            ctx.fillStyle = b.color; ctx.font = 'bold 9px Inter, sans-serif';
            ctx.fillText(b.label, bx + barW / 2, barBtm + 12);
        });

        // Total energy line
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(barsStartX - 5, barBtm - barMaxH);
        ctx.lineTo(barsStartX + totalBarsW + 5, barBtm - barMaxH);
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b'; ctx.font = '7px Inter, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText('E = ½kA²', barsStartX - 8, barBtm - barMaxH + 4);

        // Formula
        ctx.fillStyle = '#94a3b8'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`KE = ½kA²sin²(ωt)  PE = ½kA²cos²(ωt)`, ebX + ebW / 2, ebY + 26);

        // ===== RIGHT PANEL =====
        // State readouts
        ctx.fillStyle = 'rgba(30,41,59,0.7)'; roundRect(ctx, dx, dy, dw, 80, 8); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, dy, dw, 80, 8); ctx.stroke();

        ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`T = ${T.toFixed(3)} s`, dx + dw / 2, dy + 22);
        ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif';
        ctx.fillText(`T = 2π√(m/k)  |  f = ${freq.toFixed(2)} Hz  |  ω = ${omega.toFixed(1)} rad/s`, dx + dw / 2, dy + 36);

        // Current state
        ctx.fillStyle = '#94a3b8'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`x = ${(x / s.A).toFixed(2)}A   v = ${(v / vMax).toFixed(2)}v꜀   a = ${(a / aMax).toFixed(2)}a꜀`, dx + dw / 2, dy + 54);
        ctx.fillText(`KE = ${(KE_frac * 100).toFixed(0)}%   PE = ${(PE_frac * 100).toFixed(0)}%   Total = const`, dx + dw / 2, dy + 68);

        // ===== CONTROLS =====
        const ctrlY = dy + 90;
        const slW = dw - 20;

        // Mass slider
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`⚖️ Mass: ${s.mass.toFixed(1)} kg`, dx + 10, ctrlY + 10);
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, ctrlY + 16, slW, 12, 6); ctx.fill();
        const mNorm = (s.mass - 0.1) / 4.9;
        ctx.fillStyle = '#3b82f6'; roundRect(ctx, dx + 10, ctrlY + 16, mNorm * slW, 12, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx + 10 + mNorm * slW, ctrlY + 22, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx + 10 + mNorm * slW, ctrlY + 22, 8, 0, Math.PI * 2); ctx.stroke();

        // Spring constant slider
        const kslY = ctrlY + 38;
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`🔩 Spring k: ${Math.round(s.k)} N/m`, dx + 10, kslY + 10);
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, kslY + 16, slW, 12, 6); ctx.fill();
        const kNorm = (s.k - 10) / 490;
        ctx.fillStyle = '#8b5cf6'; roundRect(ctx, dx + 10, kslY + 16, kNorm * slW, 12, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx + 10 + kNorm * slW, kslY + 22, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx + 10 + kNorm * slW, kslY + 22, 8, 0, Math.PI * 2); ctx.stroke();

        // Amplitude slider
        const aslY = kslY + 38;
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`📏 Amplitude: ${Math.round(s.A)} px`, dx + 10, aslY + 10);
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, aslY + 16, slW, 12, 6); ctx.fill();
        const aNorm = (s.A - 10) / 110;
        ctx.fillStyle = '#ef4444'; roundRect(ctx, dx + 10, aslY + 16, aNorm * slW, 12, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx + 10 + aNorm * slW, aslY + 22, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx + 10 + aNorm * slW, aslY + 22, 8, 0, Math.PI * 2); ctx.stroke();

        // Reset + Play/Pause buttons
        const btnY = aslY + 38;
        const btnHW = slW / 2 - 3;
        // Play/Pause
        ctx.fillStyle = s.running ? '#1e293b' : '#22c55e';
        roundRect(ctx, dx + 10, btnY, btnHW, 28, 8); ctx.fill();
        ctx.strokeStyle = s.running ? '#64748b' : '#22c55e'; ctx.lineWidth = 1.5;
        roundRect(ctx, dx + 10, btnY, btnHW, 28, 8); ctx.stroke();
        ctx.fillStyle = s.running ? '#94a3b8' : '#fff'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(s.running ? '⏸ Pause' : '▶ Play', dx + 10 + btnHW / 2, btnY + 18);
        // Reset
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10 + btnHW + 6, btnY, btnHW, 28, 8); ctx.fill();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
        roundRect(ctx, dx + 10 + btnHW + 6, btnY, btnHW, 28, 8); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText('↺ Reset', dx + 10 + btnHW + 6 + btnHW / 2, btnY + 18);

        // ===== DESCRIPTION BOX =====
        const descY = 390, descW2 = 476, descH2 = 80;
        ctx.fillStyle = 'rgba(30,41,59,0.85)'; roundRect(ctx, 15, descY, descW2, descH2, 10); ctx.fill();
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; roundRect(ctx, 15, descY, descW2, descH2, 10); ctx.stroke();
        ctx.fillStyle = '#3b82f6'; roundRect(ctx, 27, descY + 10, 6, 22, 3); ctx.fill();
        ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Spring-Mass SHM  |  F = −kx  |  x(t) = A cos(ωt)', 42, descY + 22);
        ctx.fillStyle = '#94a3b8'; ctx.font = '9px Inter, sans-serif';
        wrapText(ctx, `ω = √(k/m) = ${omega.toFixed(1)} rad/s  |  T = 2π√(m/k) = ${T.toFixed(3)} s  |  Velocity peaks at x=0, acceleration peaks at x=±A. Total energy E = ½kA² stays constant — KE↔PE transforms continuously.`, 42, descY + 42, descW2 - 60, 13);

        // ===== HOW TO USE =====
        const guideY = btnY + 38;
        const guideH = H - guideY - 8;
        if (guideH > 50) {
            ctx.fillStyle = 'rgba(30,41,59,0.5)'; roundRect(ctx, dx, guideY, dw, guideH, 8); ctx.fill();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, guideY, dw, guideH, 8); ctx.stroke();
            ctx.fillStyle = '#64748b'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('💡 HOW TO USE', dx + dw / 2, guideY + 16);
            ctx.textAlign = 'left';
            const steps = [
                ['1.', 'Adjust mass — heavier = slower period'],
                ['2.', 'Adjust k — stiffer spring = faster period'],
                ['3.', 'Change amplitude — period stays the same!'],
                ['4.', 'Green arrow = velocity, Yellow = acceleration'],
                ['5.', 'Watch KE↔PE bars swap at mean/extreme'],
            ];
            steps.forEach((st, i) => {
                const sy = guideY + 30 + i * 14;
                if (sy + 10 < guideY + guideH) {
                    ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 8.5px monospace'; ctx.fillText(st[0], dx + 12, sy);
                    ctx.fillStyle = '#94a3b8'; ctx.font = '8.5px Inter, sans-serif'; ctx.fillText(st[1], dx + 26, sy);
                }
            });
        }

        // Top status
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`SHM  |  m=${s.mass.toFixed(1)}kg  k=${Math.round(s.k)}N/m  A=${Math.round(s.A)}px  |  T=${T.toFixed(3)}s  ω=${omega.toFixed(1)}rad/s`, 10, 14);

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
        const dx = 500, dw = 290, dy = 20, slW = dw - 20;
        const ctrlY = dy + 90;

        // Mass slider
        if (x >= dx + 2 && x <= dx + dw && y >= ctrlY + 10 && y <= ctrlY + 34) {
            draggingRef.current = 'mass';
            const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
            stateRef.current.mass = 0.1 + val * 4.9;
            stateRef.current.time = 0; graphRef.current = [];
            return;
        }
        // K slider
        const kslY = ctrlY + 38;
        if (x >= dx + 2 && x <= dx + dw && y >= kslY + 10 && y <= kslY + 34) {
            draggingRef.current = 'k';
            const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
            stateRef.current.k = 10 + val * 490;
            stateRef.current.time = 0; graphRef.current = [];
            return;
        }
        // Amplitude slider
        const aslY = kslY + 38;
        if (x >= dx + 2 && x <= dx + dw && y >= aslY + 10 && y <= aslY + 34) {
            draggingRef.current = 'amp';
            const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
            stateRef.current.A = 10 + val * 110;
            stateRef.current.time = 0; graphRef.current = [];
            return;
        }

        // Play/Pause
        const btnY = aslY + 38;
        const btnHW = slW / 2 - 3;
        if (x >= dx + 10 && x <= dx + 10 + btnHW && y >= btnY && y <= btnY + 28) {
            stateRef.current.running = !stateRef.current.running;
            return;
        }
        // Reset
        if (x >= dx + 10 + btnHW + 6 && x <= dx + 10 + slW && y >= btnY && y <= btnY + 28) {
            stateRef.current = { mass: 1.0, k: 100, A: 60, running: true, time: 0 };
            graphRef.current = [];
        }
    }, [getCoords]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!draggingRef.current) return;
        const { x } = getCoords(e);
        const dx = 500, dw = 290, slW = dw - 20;
        const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));

        if (draggingRef.current === 'mass') {
            stateRef.current.mass = 0.1 + val * 4.9;
            stateRef.current.time = 0; graphRef.current = [];
        } else if (draggingRef.current === 'k') {
            stateRef.current.k = 10 + val * 490;
            stateRef.current.time = 0; graphRef.current = [];
        } else if (draggingRef.current === 'amp') {
            stateRef.current.A = 10 + val * 110;
            stateRef.current.time = 0; graphRef.current = [];
        }
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

export default SHMLab;
