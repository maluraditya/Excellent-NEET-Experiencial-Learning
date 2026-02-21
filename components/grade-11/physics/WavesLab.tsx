import React, { useRef, useEffect, useCallback } from 'react';

const WavesLab: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);
    const stateRef = useRef({
        freq: 5.0,       // Hz (driving frequency)
        tension: 50,     // N
        mu: 0.01,        // kg/m (linear mass density)
        amplitude: 30,   // px
        fixedEnd: true,  // true = rigid, false = free
        running: true,
        slowMotion: false,
        time: 0,
    });
    const frameRef = useRef(0);

    // String length in px
    const STRING_L = 420;
    const STRING_Y = 120;
    const STRING_X0 = 50;
    const N_PARTICLES = 120;

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        const s = stateRef.current;
        frameRef.current++;

        if (s.running) {
            s.time += s.slowMotion ? 0.0008 : 0.004;
        }

        // Physics
        const v = Math.sqrt(s.tension / s.mu); // wave speed m/s
        const lambda = v / s.freq; // wavelength in "meters"
        const omega = 2 * Math.PI * s.freq;
        const k = 2 * Math.PI / lambda;

        // How many half-wavelengths fit in L? Resonance when L = n*λ/2
        const L_meters = STRING_L * 0.01; // scale: 1px = 0.01m
        const n_harmonic = Math.round(2 * L_meters * s.freq / v);
        const resonantFreq = n_harmonic > 0 ? n_harmonic * v / (2 * L_meters) : 0;
        const isResonant = n_harmonic > 0 && Math.abs(s.freq - resonantFreq) < 0.3;

        // ===== CLEAR =====
        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#1e293b');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // ===== LAYOUT =====
        const dx = 505, dy = 20, dw = 285;

        // ===== OSCILLATOR (left) =====
        const oscY = STRING_Y + Math.sin(omega * s.time) * s.amplitude * 0.6;
        ctx.fillStyle = '#475569';
        roundRect(ctx, STRING_X0 - 25, STRING_Y - 30, 25, 60, 4); ctx.fill();
        ctx.fillStyle = '#64748b'; ctx.beginPath();
        ctx.arc(STRING_X0 - 12, oscY, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(STRING_X0 - 12, oscY, 6, 0, Math.PI * 2); ctx.stroke();

        // ===== CLAMP (right) =====
        const clampX = STRING_X0 + STRING_L;
        ctx.fillStyle = '#475569';
        if (s.fixedEnd) {
            ctx.fillRect(clampX, STRING_Y - 30, 12, 60);
            // Hatch marks for wall
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.5;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(clampX + 10, STRING_Y - 25 + i * 10);
                ctx.lineTo(clampX + 2, STRING_Y - 17 + i * 10);
                ctx.stroke();
            }
        } else {
            // Free end: ring
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(clampX + 6, STRING_Y, 8, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(clampX + 6, STRING_Y, 6, 0, Math.PI * 2); ctx.fill();
        }

        // Labels
        ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Oscillator', STRING_X0 - 12, STRING_Y + 45);
        ctx.fillText(s.fixedEnd ? 'Fixed End' : 'Free End', clampX + 6, STRING_Y + 45);

        // ===== DRAW STRING WITH SUPERPOSITION =====
        const points: { x: number; y: number }[] = [];
        for (let i = 0; i <= N_PARTICLES; i++) {
            const px = STRING_X0 + (i / N_PARTICLES) * STRING_L;
            const x_m = (i / N_PARTICLES) * L_meters; // position in meters

            // Incident wave
            const y_inc = s.amplitude * Math.sin(k * x_m - omega * s.time);
            // Reflected wave (phase depends on boundary)
            const y_ref = s.fixedEnd
                ? -s.amplitude * Math.sin(k * (2 * L_meters - x_m) - omega * s.time)
                : s.amplitude * Math.sin(k * (2 * L_meters - x_m) - omega * s.time);
            const y_total = y_inc + y_ref;

            points.push({ x: px, y: STRING_Y + y_total });
        }

        // Draw string line
        ctx.strokeStyle = isResonant ? '#22c55e' : '#94a3b8';
        ctx.lineWidth = isResonant ? 2.5 : 1.5;
        ctx.beginPath();
        points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Draw particles
        const particleStep = Math.max(1, Math.floor(N_PARTICLES / 40));
        for (let i = 0; i <= N_PARTICLES; i += particleStep) {
            const p = points[i];
            const disp = Math.abs(p.y - STRING_Y);
            const bright = Math.min(1, disp / (s.amplitude * 1.5));
            const color = isResonant
                ? `rgba(34, 197, 94, ${0.4 + bright * 0.6})`
                : `rgba(148, 163, 184, ${0.3 + bright * 0.5})`;
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2.5 + bright * 1.5, 0, Math.PI * 2); ctx.fill();
        }

        // Mark nodes and antinodes at resonance
        if (isResonant && n_harmonic > 0) {
            const lambdaRes = 2 * L_meters / n_harmonic;
            // Nodes: every λ/2 from x=0
            for (let nn = 0; nn <= n_harmonic; nn++) {
                const nodeX = STRING_X0 + (nn * lambdaRes / 2 / L_meters) * STRING_L;
                ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
                ctx.beginPath(); ctx.arc(nodeX, STRING_Y, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ef4444'; ctx.font = 'bold 7px Inter, sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('N', nodeX, STRING_Y + 18);
            }
            // Antinodes: at λ/4, 3λ/4, etc from start
            for (let an = 0; an < n_harmonic; an++) {
                const antiX = STRING_X0 + ((an + 0.5) * lambdaRes / 2 / L_meters) * STRING_L;
                ctx.strokeStyle = 'rgba(59,130,246,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
                ctx.beginPath(); ctx.moveTo(antiX, STRING_Y - s.amplitude * 1.8); ctx.lineTo(antiX, STRING_Y + s.amplitude * 1.8); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 7px Inter, sans-serif';
                ctx.fillText('A', antiX, STRING_Y - s.amplitude * 1.8 - 5);
            }
        }

        // ===== WAVE GRAPHS (bottom) =====
        const gy0 = 190, gw = 220, gh = 50;
        const waveGraphs = [
            { label: 'Incident', color: '#3b82f6', yOff: gy0 },
            { label: 'Reflected', color: '#ef4444', yOff: gy0 + 63 },
            { label: 'Resultant', color: '#8b5cf6', yOff: gy0 + 126 },
        ];

        waveGraphs.forEach(g => {
            const gy = g.yOff;
            ctx.fillStyle = 'rgba(15,23,42,0.6)'; roundRect(ctx, 20, gy, gw, gh, 6); ctx.fill();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 0.5; roundRect(ctx, 20, gy, gw, gh, 6); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(20, gy + gh / 2); ctx.lineTo(20 + gw, gy + gh / 2); ctx.stroke();
            ctx.fillStyle = g.color; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'left';
            ctx.fillText(g.label, 25, gy + 11);
        });

        // Plot graphs
        for (let i = 0; i <= N_PARTICLES; i++) {
            const px = 20 + (i / N_PARTICLES) * gw;
            const x_m = (i / N_PARTICLES) * L_meters;
            const y_inc = Math.sin(k * x_m - omega * s.time);
            const y_ref = s.fixedEnd
                ? -Math.sin(k * (2 * L_meters - x_m) - omega * s.time)
                : Math.sin(k * (2 * L_meters - x_m) - omega * s.time);
            const y_res = y_inc + y_ref;

            const drawDot = (gy: number, val: number, color: string) => {
                const py = gy + gh / 2 - val * (gh / 2 - 4);
                ctx.fillStyle = color;
                if (i % 3 === 0) { ctx.fillRect(px, py, 1.5, 1.5); }
            };
            drawDot(waveGraphs[0].yOff, y_inc, '#3b82f6');
            drawDot(waveGraphs[1].yOff, y_ref, '#ef4444');
            drawDot(waveGraphs[2].yOff, y_res * 0.5, '#8b5cf6');
        }

        // ===== RESONANCE / HARMONIC INDICATOR (center-bottom) =====
        const resY = gy0 + 126 + gh + 10;
        if (isResonant && n_harmonic > 0) {
            ctx.fillStyle = 'rgba(34,197,94,0.15)'; roundRect(ctx, 20, resY, gw, 40, 8); ctx.fill();
            ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5; roundRect(ctx, 20, resY, gw, 40, 8); ctx.stroke();
            ctx.fillStyle = '#22c55e'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(`🎵 RESONANCE! Harmonic #${n_harmonic}`, 20 + gw / 2, resY + 16);
            ctx.fillStyle = '#94a3b8'; ctx.font = '8px Inter, sans-serif';
            ctx.fillText(`${n_harmonic} loop${n_harmonic > 1 ? 's' : ''}  |  ${n_harmonic + 1} nodes  |  ${n_harmonic} antinodes`, 20 + gw / 2, resY + 30);
        } else {
            ctx.fillStyle = 'rgba(30,41,59,0.5)'; roundRect(ctx, 20, resY, gw, 40, 8); ctx.fill();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, 20, resY, gw, 40, 8); ctx.stroke();
            ctx.fillStyle = '#64748b'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('Adjust frequency to find resonance...', 20 + gw / 2, resY + 24);
        }

        // ===== RIGHT PANEL =====
        ctx.fillStyle = 'rgba(30,41,59,0.7)'; roundRect(ctx, dx, dy, dw, 90, 8); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, dy, dw, 90, 8); ctx.stroke();

        ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`ν = ${s.freq.toFixed(1)} Hz`, dx + dw / 4, dy + 22);
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 14px monospace';
        ctx.fillText(`v = ${v.toFixed(1)} m/s`, dx + 3 * dw / 4, dy + 22);

        ctx.fillStyle = '#94a3b8'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`λ = ${lambda.toFixed(3)} m  |  k = ${k.toFixed(1)} rad/m  |  ω = ${omega.toFixed(1)} rad/s`, dx + dw / 2, dy + 40);
        ctx.fillText(`v = √(T/μ) = √(${s.tension}/${s.mu})  |  L = ${L_meters.toFixed(2)} m`, dx + dw / 2, dy + 54);

        if (isResonant && n_harmonic > 0) {
            ctx.fillStyle = '#22c55e'; ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillText(`Harmonic n = ${n_harmonic}  |  νₙ = n·v/(2L)`, dx + dw / 2, dy + 72);
        } else {
            ctx.fillStyle = '#64748b'; ctx.font = '9px Inter, sans-serif';
            ctx.fillText('Not at resonance — adjust frequency', dx + dw / 2, dy + 72);
        }
        ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif';
        ctx.fillText(`ν₁ = ${(v / (2 * L_meters)).toFixed(1)} Hz (fundamental)`, dx + dw / 2, dy + 85);

        // ===== CONTROLS =====
        const ctrlY = dy + 100;
        const slW = dw - 20;

        // Frequency slider
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`🎵 Frequency: ${s.freq.toFixed(1)} Hz`, dx + 10, ctrlY + 10);
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, ctrlY + 16, slW, 12, 6); ctx.fill();
        const fNorm = (s.freq - 1) / 49;
        ctx.fillStyle = '#3b82f6'; roundRect(ctx, dx + 10, ctrlY + 16, fNorm * slW, 12, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx + 10 + fNorm * slW, ctrlY + 22, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx + 10 + fNorm * slW, ctrlY + 22, 8, 0, Math.PI * 2); ctx.stroke();

        // Tension slider
        const tslY = ctrlY + 38;
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`🔧 Tension: ${Math.round(s.tension)} N`, dx + 10, tslY + 10);
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, tslY + 16, slW, 12, 6); ctx.fill();
        const tNorm = (s.tension - 10) / 190;
        ctx.fillStyle = '#f59e0b'; roundRect(ctx, dx + 10, tslY + 16, tNorm * slW, 12, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx + 10 + tNorm * slW, tslY + 22, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx + 10 + tNorm * slW, tslY + 22, 8, 0, Math.PI * 2); ctx.stroke();

        // Boundary toggle
        const bndY = tslY + 40;
        ctx.fillStyle = s.fixedEnd ? '#1e293b' : '#8b5cf6';
        roundRect(ctx, dx + 10, bndY, slW / 2 - 3, 26, 8); ctx.fill();
        ctx.strokeStyle = s.fixedEnd ? '#22c55e' : '#64748b'; ctx.lineWidth = 1.5;
        roundRect(ctx, dx + 10, bndY, slW / 2 - 3, 26, 8); ctx.stroke();
        ctx.fillStyle = s.fixedEnd ? '#22c55e' : '#fff'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🔒 Fixed End', dx + 10 + (slW / 2 - 3) / 2, bndY + 17);

        ctx.fillStyle = !s.fixedEnd ? '#1e293b' : '#8b5cf6';
        const fbx = dx + 10 + slW / 2 + 3;
        roundRect(ctx, fbx, bndY, slW / 2 - 3, 26, 8); ctx.fill();
        ctx.strokeStyle = !s.fixedEnd ? '#22c55e' : '#64748b'; ctx.lineWidth = 1.5;
        roundRect(ctx, fbx, bndY, slW / 2 - 3, 26, 8); ctx.stroke();
        ctx.fillStyle = !s.fixedEnd ? '#22c55e' : '#fff'; ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText('🔓 Free End', fbx + (slW / 2 - 3) / 2, bndY + 17);

        // Play/Pause and Slow Motion
        const pbY = bndY + 34;
        const pbW = slW / 2 - 3;

        ctx.fillStyle = s.running ? '#1e293b' : '#22c55e';
        roundRect(ctx, dx + 10, pbY, pbW, 26, 8); ctx.fill();
        ctx.strokeStyle = s.running ? '#64748b' : '#22c55e'; ctx.lineWidth = 1.5; roundRect(ctx, dx + 10, pbY, pbW, 26, 8); ctx.stroke();
        ctx.fillStyle = s.running ? '#94a3b8' : '#fff'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(s.running ? '⏸ Pause' : '▶ Play', dx + 10 + pbW / 2, pbY + 17);

        const smX = dx + 10 + pbW + 6;
        ctx.fillStyle = s.slowMotion ? '#3b82f6' : '#1e293b';
        roundRect(ctx, smX, pbY, pbW, 26, 8); ctx.fill();
        ctx.strokeStyle = s.slowMotion ? '#3b82f6' : '#64748b'; ctx.lineWidth = 1.5; roundRect(ctx, smX, pbY, pbW, 26, 8); ctx.stroke();
        ctx.fillStyle = s.slowMotion ? '#fff' : '#94a3b8';
        ctx.fillText('🐢 Slow Mo', smX + pbW / 2, pbY + 17);

        // Reset
        const rstY = pbY + 34;
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, rstY, slW, 26, 8); ctx.fill();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; roundRect(ctx, dx + 10, rstY, slW, 26, 8); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('↺ Reset', dx + 10 + slW / 2, rstY + 17);

        // ===== DESCRIPTION BOX =====
        const descY = 280, descW2 = 240, descH2 = 100;
        ctx.fillStyle = 'rgba(30,41,59,0.85)'; roundRect(ctx, 250, descY, descW2, descH2, 10); ctx.fill();
        ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2; roundRect(ctx, 250, descY, descW2, descH2, 10); ctx.stroke();
        ctx.fillStyle = '#8b5cf6'; roundRect(ctx, 262, descY + 10, 6, 20, 3); ctx.fill();
        ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Standing Wave Equation', 276, descY + 22);
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 10px monospace';
        ctx.fillText('y = [2a sin(kx)] cos(ωt)', 262, descY + 42);
        ctx.fillStyle = '#94a3b8'; ctx.font = '8px Inter, sans-serif';
        wrapText(ctx, 'Nodes: sin(kx)=0 → x = nλ/2. Antinodes: |sin(kx)|=1 → x = (2n+1)λ/4. Resonance: L = nλ/2.', 262, descY + 58, descW2 - 25, 12);

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
                ['1.', 'Slide frequency — find resonance (green)'],
                ['2.', 'Count loops = harmonic number n'],
                ['3.', 'Change tension — resonance shifts'],
                ['4.', 'Toggle Fixed/Free boundary type'],
                ['5.', 'Watch graphs: blue + red = purple'],
            ];
            steps.forEach((st, i) => {
                const sy = guideY + 30 + i * 14;
                if (sy + 10 < guideY + guideH) {
                    ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 8.5px monospace'; ctx.fillText(st[0], dx + 12, sy);
                    ctx.fillStyle = '#94a3b8'; ctx.font = '8.5px Inter, sans-serif'; ctx.fillText(st[1], dx + 26, sy);
                }
            });
        }

        // Top status
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`Waves  |  ν=${s.freq.toFixed(1)}Hz  v=${v.toFixed(1)}m/s  λ=${lambda.toFixed(3)}m  |  ${isResonant ? `RESONANCE n=${n_harmonic}` : 'No resonance'}`, 10, 14);

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

        // Freq slider
        if (x >= dx + 2 && x <= dx + dw && y >= ctrlY + 10 && y <= ctrlY + 34) {
            draggingRef.current = 'freq';
            const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
            stateRef.current.freq = 1 + val * 49;
            return;
        }
        // Tension slider
        const tslY = ctrlY + 38;
        if (x >= dx + 2 && x <= dx + dw && y >= tslY + 10 && y <= tslY + 34) {
            draggingRef.current = 'tension';
            const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
            stateRef.current.tension = 10 + val * 190;
            return;
        }
        // Boundary toggle
        const bndY = tslY + 40;
        if (y >= bndY && y <= bndY + 26) {
            if (x >= dx + 10 && x <= dx + 10 + slW / 2 - 3) { stateRef.current.fixedEnd = true; return; }
            if (x >= dx + 10 + slW / 2 + 3 && x <= dx + 10 + slW) { stateRef.current.fixedEnd = false; return; }
        }
        // Play/Pause & Slow mo
        const pbY = bndY + 34;
        const pbW = slW / 2 - 3;
        if (y >= pbY && y <= pbY + 26) {
            if (x >= dx + 10 && x <= dx + 10 + pbW) {
                stateRef.current.running = !stateRef.current.running;
                return;
            }
            if (x >= dx + 10 + pbW + 6 && x <= dx + 10 + slW) {
                stateRef.current.slowMotion = !stateRef.current.slowMotion;
                return;
            }
        }

        // Reset
        const rstY = pbY + 34;
        if (x >= dx + 10 && x <= dx + 10 + slW && y >= rstY && y <= rstY + 26) {
            stateRef.current = { freq: 5.0, tension: 50, mu: 0.01, amplitude: 30, fixedEnd: true, running: true, slowMotion: false, time: 0 };
        }
    }, [getCoords]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!draggingRef.current) return;
        const { x } = getCoords(e);
        const dx = 505, dw = 285, slW = dw - 20;
        const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
        if (draggingRef.current === 'freq') stateRef.current.freq = 1 + val * 49;
        else if (draggingRef.current === 'tension') stateRef.current.tension = 10 + val * 190;
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

export default WavesLab;
