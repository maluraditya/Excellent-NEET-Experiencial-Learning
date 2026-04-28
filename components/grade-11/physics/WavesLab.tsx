import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Play, Pause } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface WavesLabProps {
    topic: any;
    onExit: () => void;
}

const WavesLab: React.FC<WavesLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);

    const [freq, setFreq] = useState(5.0);
    const [tension, setTension] = useState(50);
    const [fixedEnd, setFixedEnd] = useState(true);
    const [running, setRunning] = useState(true);

    const stateRef = useRef({
        freq: 5.0, tension: 50, mu: 0.01, amplitude: 35,
        fixedEnd: true, running: true, time: 0,
    });

    const N_PARTICLES = 200;

    useEffect(() => {
        stateRef.current.freq = freq;
        stateRef.current.tension = tension;
        stateRef.current.fixedEnd = fixedEnd;
        stateRef.current.running = running;
    }, [freq, tension, fixedEnd, running]);

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

        if (s.running) s.time += 0.004;

        // Physics
        const v_wave = Math.sqrt(s.tension / s.mu);
        const lambda = v_wave / s.freq;
        const omega = 2 * Math.PI * s.freq;
        const k = 2 * Math.PI / lambda;
        const STRING_L = W * 0.84;
        const L_meters = STRING_L * 0.01;
        const n_harmonic = Math.round(2 * L_meters * s.freq / v_wave);
        const resonantFreq = n_harmonic > 0 ? n_harmonic * v_wave / (2 * L_meters) : 0;
        const isResonant = n_harmonic > 0 && Math.abs(s.freq - resonantFreq) < 0.3;

        // Clear
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        // DYNAMIC VIEWPORT SCALING
        const scale = W < 1000 ? 1.0 : (W > 1500 ? 1.3 : 1.0 + (W - 1000) * 0.0006);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.045));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 24);

        // ═══════════════════════════════════════════
        // LAYOUT: 3 rows — Main string | 3 wave graphs | Info strip
        // ═══════════════════════════════════════════
        const titleH = fs(18) + pad;
        const STRING_AREA_H = H * 0.30;
        const STRING_X0 = pad * 5;
        const STRING_Y = titleH + STRING_AREA_H * 0.5;
        const scaledAmp = Math.min(s.amplitude * 1.2, STRING_AREA_H * 0.35);

        // ─── Title ───
        ctx.fillStyle = '#0f172a'; ctx.font = `bold ${fs(17)}px "Inter", sans-serif`; ctx.textAlign = 'left';
        ctx.fillText('Superposition, Reflection & Standing Waves', pad, titleH * 0.7);

        // Status badge
        if (isResonant) {
            const badgeW = fs(14) * 16;
            const badgeX = W - pad - badgeW;
            ctx.fillStyle = 'rgba(22, 163, 74, 0.12)';
            roundRect(ctx, badgeX, pad * 0.3, badgeW, fs(14) + 12, 8); ctx.fill();
            ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2;
            roundRect(ctx, badgeX, pad * 0.3, badgeW, fs(14) + 12, 8); ctx.stroke();
            ctx.fillStyle = '#16a34a'; ctx.font = `bold ${fs(14)}px "Inter", sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(`🎶 RESONANCE — HARMONIC #${n_harmonic}`, badgeX + badgeW / 2, pad * 0.3 + fs(14) + 2);
        }

        // ═══════════════════════════════════════════
        // ROW 1: MAIN STRING ANIMATION (large, prominent)
        // ═══════════════════════════════════════════
        const stringPanelY = titleH + pad * 0.3;
        const stringPanelH = STRING_AREA_H;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, pad, stringPanelY, W - pad * 2, stringPanelH, 16); ctx.fill();
        ctx.strokeStyle = isResonant ? '#16a34a40' : '#e2e8f0'; ctx.lineWidth = isResonant ? 2.5 : 1.5;
        roundRect(ctx, pad, stringPanelY, W - pad * 2, stringPanelH, 16); ctx.stroke();

        // Equilibrium line
        ctx.strokeStyle = '#e2e8f090'; ctx.lineWidth = 1; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(STRING_X0, STRING_Y); ctx.lineTo(STRING_X0 + STRING_L, STRING_Y); ctx.stroke();
        ctx.setLineDash([]);

        // Oscillator (left)
        const oscY = STRING_Y + Math.sin(omega * s.time) * scaledAmp * 0.6;
        ctx.fillStyle = '#94a3b8';
        roundRect(ctx, STRING_X0 - 36 * scale, STRING_Y - 40 * scale, 36 * scale, 80 * scale, 8); ctx.fill();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
        roundRect(ctx, STRING_X0 - 36 * scale, STRING_Y - 40 * scale, 36 * scale, 80 * scale, 8); ctx.stroke();
        ctx.fillStyle = '#334155'; ctx.beginPath();
        ctx.arc(STRING_X0 - 18 * scale, oscY, 12 * scale, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2 * scale;
        ctx.beginPath(); ctx.arc(STRING_X0 - 18 * scale, oscY, 12 * scale, 0, Math.PI * 2); ctx.stroke();

        // Clamp (right)
        const clampX = STRING_X0 + STRING_L;
        if (s.fixedEnd) {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(clampX, STRING_Y - 40 * scale, 18 * scale, 80 * scale);
            ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
            ctx.strokeRect(clampX, STRING_Y - 40 * scale, 18 * scale, 80 * scale);
            // Hatch marks
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5 * scale;
            for (let i = 0; i < 7; i++) {
                ctx.beginPath();
                ctx.moveTo(clampX + 16 * scale, STRING_Y - 34 * scale + i * 11 * scale);
                ctx.lineTo(clampX + 3 * scale, STRING_Y - 25 * scale + i * 11 * scale);
                ctx.stroke();
            }
        } else {
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 4 * scale;
            ctx.beginPath(); ctx.arc(clampX + 10 * scale, STRING_Y, 14 * scale, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(clampX + 10 * scale, STRING_Y, 9 * scale, 0, Math.PI * 2); ctx.fill();
        }

        // End labels
        ctx.fillStyle = '#475569'; ctx.font = `bold ${fs(11)}px "Inter", sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('OSCILLATOR', STRING_X0 - 18 * scale, STRING_Y + 58 * scale);
        ctx.fillText(s.fixedEnd ? 'FIXED END' : 'FREE END', clampX + 10 * scale, STRING_Y + 58 * scale);

        // Compute wave points
        const pointsInc: { x: number; y: number }[] = [];
        const pointsRef: { x: number; y: number }[] = [];
        const pointsRes: { x: number; y: number }[] = [];

        for (let i = 0; i <= N_PARTICLES; i++) {
            const px = STRING_X0 + (i / N_PARTICLES) * STRING_L;
            const x_m = (i / N_PARTICLES) * L_meters;
            const y_inc = scaledAmp * Math.sin(k * x_m - omega * s.time);
            const y_ref = s.fixedEnd
                ? -scaledAmp * Math.sin(k * (2 * L_meters - x_m) - omega * s.time)
                : scaledAmp * Math.sin(k * (2 * L_meters - x_m) - omega * s.time);
            pointsInc.push({ x: px, y: STRING_Y + y_inc });
            pointsRef.push({ x: px, y: STRING_Y + y_ref });
            pointsRes.push({ x: px, y: STRING_Y + y_inc + y_ref });
        }

        // Standing wave envelope (at resonance)
        if (isResonant && n_harmonic > 0) {
            ctx.fillStyle = `rgba(22, 163, 74, 0.06)`;
            ctx.beginPath();
            for (let i = 0; i <= N_PARTICLES; i++) {
                const x_m = (i / N_PARTICLES) * L_meters;
                const env = 2 * scaledAmp * Math.abs(Math.sin(k * x_m));
                const px = STRING_X0 + (i / N_PARTICLES) * STRING_L;
                i === 0 ? ctx.moveTo(px, STRING_Y - env) : ctx.lineTo(px, STRING_Y - env);
            }
            for (let i = N_PARTICLES; i >= 0; i--) {
                const x_m = (i / N_PARTICLES) * L_meters;
                const env = 2 * scaledAmp * Math.abs(Math.sin(k * x_m));
                const px = STRING_X0 + (i / N_PARTICLES) * STRING_L;
                ctx.lineTo(px, STRING_Y + env);
            }
            ctx.closePath(); ctx.fill();

            // Envelope outline
            ctx.strokeStyle = 'rgba(22, 163, 74, 0.25)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
            ctx.beginPath();
            for (let i = 0; i <= N_PARTICLES; i++) {
                const x_m = (i / N_PARTICLES) * L_meters;
                const env = 2 * scaledAmp * Math.abs(Math.sin(k * x_m));
                const px = STRING_X0 + (i / N_PARTICLES) * STRING_L;
                i === 0 ? ctx.moveTo(px, STRING_Y - env) : ctx.lineTo(px, STRING_Y - env);
            }
            ctx.stroke();
            ctx.beginPath();
            for (let i = 0; i <= N_PARTICLES; i++) {
                const x_m = (i / N_PARTICLES) * L_meters;
                const env = 2 * scaledAmp * Math.abs(Math.sin(k * x_m));
                const px = STRING_X0 + (i / N_PARTICLES) * STRING_L;
                i === 0 ? ctx.moveTo(px, STRING_Y + env) : ctx.lineTo(px, STRING_Y + env);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Individual waves (semi-transparent behind)
        ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)'; ctx.lineWidth = 2.5 * scale;
        ctx.beginPath();
        pointsInc.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();

        ctx.strokeStyle = 'rgba(220, 38, 38, 0.35)'; ctx.lineWidth = 2.5 * scale;
        ctx.beginPath();
        pointsRef.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Resultant wave (bold, prominent)
        if (isResonant) {
            ctx.shadowColor = 'rgba(22, 163, 74, 0.3)'; ctx.shadowBlur = 10;
        }
        ctx.strokeStyle = isResonant ? '#16a34a' : '#1e293b';
        ctx.lineWidth = (isResonant ? 5 : 4) * scale;
        ctx.beginPath();
        pointsRes.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

        // Particles on resultant
        const particleStep = Math.max(1, Math.floor(N_PARTICLES / 50));
        for (let i = 0; i <= N_PARTICLES; i += particleStep) {
            const p = pointsRes[i];
            const disp = Math.abs(p.y - STRING_Y);
            const bright = Math.min(1, disp / (scaledAmp * 1.5));
            ctx.fillStyle = isResonant
                ? `rgba(22, 163, 74, ${0.55 + bright * 0.45})`
                : `rgba(15, 23, 42, ${0.45 + bright * 0.4})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, (3.5 + bright * 2.5) * scale, 0, Math.PI * 2); ctx.fill();
        }

        // Nodes and antinodes (resonance)
        if (isResonant && n_harmonic > 0) {
            const lambdaRes = 2 * L_meters / n_harmonic;
            // Nodes
            for (let nn = 0; nn <= n_harmonic; nn++) {
                const nodeX = STRING_X0 + (nn * lambdaRes / 2 / L_meters) * STRING_L;
                ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
                ctx.beginPath(); ctx.arc(nodeX, STRING_Y, 18 * scale, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#dc2626';
                ctx.beginPath(); ctx.arc(nodeX, STRING_Y, 8 * scale, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(nodeX, STRING_Y, 8 * scale, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#ffffff'; ctx.font = `bold ${fs(11)}px "Inter", sans-serif`; ctx.textAlign = 'center';
                ctx.fillText('N', nodeX, STRING_Y + 4 * scale);
            }
            // Antinodes
            for (let an = 0; an < n_harmonic; an++) {
                const antiX = STRING_X0 + ((an + 0.5) * lambdaRes / 2 / L_meters) * STRING_L;
                ctx.strokeStyle = 'rgba(37, 99, 235, 0.45)'; ctx.lineWidth = 2 * scale; ctx.setLineDash([5, 4]);
                ctx.beginPath(); ctx.moveTo(antiX, STRING_Y - scaledAmp * 2.2); ctx.lineTo(antiX, STRING_Y + scaledAmp * 2.2); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#2563eb'; ctx.font = `bold ${fs(13)}px "Inter", sans-serif`;
                ctx.fillText('A', antiX, STRING_Y - scaledAmp * 2.2 - 8 * scale);
            }
        }

        // Legend for main string
        const legendY = stringPanelY + stringPanelH - pad * 1.2;
        ctx.font = `bold ${fs(11)}px "Inter", sans-serif`; ctx.textAlign = 'left';
        const legendItems = [
            { label: 'Incident', color: '#2563eb' },
            { label: 'Reflected', color: '#dc2626' },
            { label: 'Resultant', color: isResonant ? '#16a34a' : '#1e293b' },
        ];
        let legendX = STRING_X0;
        legendItems.forEach(li => {
            ctx.strokeStyle = li.color; ctx.lineWidth = 3 * scale;
            ctx.beginPath(); ctx.moveTo(legendX, legendY); ctx.lineTo(legendX + 25 * scale, legendY); ctx.stroke();
            ctx.fillStyle = li.color;
            ctx.fillText(li.label, legendX + 30 * scale, legendY + 4);
            legendX += (li.label.length * fs(11) * 0.65) + 45 * scale;
        });

        // ═══════════════════════════════════════════
        // ROW 2: Three individual wave graphs (side by side)
        // ═══════════════════════════════════════════
        const graphRowY = stringPanelY + stringPanelH + pad * 0.8;
        const graphRowH = H * 0.35;
        const graphGap = pad * 0.8;
        const singleGraphW = (W - pad * 2 - graphGap * 2) / 3;

        const waveGraphs = [
            { label: 'INCIDENT WAVE', color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe', data: pointsInc },
            { label: 'REFLECTED WAVE', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca', data: pointsRef },
            { label: 'RESULTANT (SUPERPOSITION)', color: isResonant ? '#16a34a' : '#7c3aed', bgColor: isResonant ? '#f0fdf4' : '#faf5ff', borderColor: isResonant ? '#bbf7d0' : '#e9d5ff', data: pointsRes },
        ];

        waveGraphs.forEach((g, idx) => {
            const gx = pad + idx * (singleGraphW + graphGap);
            const gy = graphRowY;

            // Card
            ctx.fillStyle = g.bgColor;
            roundRect(ctx, gx, gy, singleGraphW, graphRowH, 14); ctx.fill();
            ctx.strokeStyle = g.borderColor; ctx.lineWidth = 2;
            roundRect(ctx, gx, gy, singleGraphW, graphRowH, 14); ctx.stroke();

            // Title
            ctx.fillStyle = g.color; ctx.font = `bold ${fs(12)}px "Inter", sans-serif`; ctx.textAlign = 'center';
            ctx.fillText(g.label, gx + singleGraphW / 2, gy + pad * 1.1);

            // Graph area
            const gInnerX = gx + pad * 1.5;
            const gInnerY = gy + pad * 2;
            const gInnerW = singleGraphW - pad * 3;
            const gInnerH = graphRowH - pad * 4;
            const gMidY = gInnerY + gInnerH / 2;

            // Background
            ctx.fillStyle = '#ffffff';
            roundRect(ctx, gInnerX, gInnerY, gInnerW, gInnerH, 8); ctx.fill();
            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
            roundRect(ctx, gInnerX, gInnerY, gInnerW, gInnerH, 8); ctx.stroke();

            // Equilibrium
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(gInnerX, gMidY); ctx.lineTo(gInnerX + gInnerW, gMidY); ctx.stroke();
            ctx.setLineDash([]);

            // Draw smooth curve
            const maxDispRes = idx === 2 ? scaledAmp * 2 : scaledAmp;
            ctx.strokeStyle = g.color; ctx.lineWidth = 3 * scale;
            ctx.beginPath();
            for (let i = 0; i <= N_PARTICLES; i++) {
                const px = gInnerX + (i / N_PARTICLES) * gInnerW;
                const disp = g.data[i].y - STRING_Y;
                const py = gMidY - (disp / maxDispRes) * (gInnerH / 2 - 4);
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Filled area under curve (subtle)
            ctx.fillStyle = `${g.color}10`;
            ctx.beginPath();
            ctx.moveTo(gInnerX, gMidY);
            for (let i = 0; i <= N_PARTICLES; i++) {
                const px = gInnerX + (i / N_PARTICLES) * gInnerW;
                const disp = g.data[i].y - STRING_Y;
                const py = gMidY - (disp / maxDispRes) * (gInnerH / 2 - 4);
                ctx.lineTo(px, py);
            }
            ctx.lineTo(gInnerX + gInnerW, gMidY);
            ctx.closePath(); ctx.fill();

            // Y labels
            ctx.fillStyle = '#94a3b8'; ctx.font = `${fs(9)}px "Inter", sans-serif`; ctx.textAlign = 'right';
            ctx.fillText('+A', gInnerX - 4, gInnerY + 10);
            ctx.fillText('−A', gInnerX - 4, gInnerY + gInnerH - 2);
        });

        // ═══════════════════════════════════════════
        // ROW 3: Physics info strip
        // ═══════════════════════════════════════════
        const infoY = graphRowY + graphRowH + pad * 0.6;
        const infoH = H - infoY - pad * 0.5;

        if (infoH > 20) {
            ctx.fillStyle = '#ffffff';
            roundRect(ctx, pad, infoY, W - pad * 2, infoH, 12); ctx.fill();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
            roundRect(ctx, pad, infoY, W - pad * 2, infoH, 12); ctx.stroke();

            const infoMidY = infoY + infoH / 2 + 4;
            const colW = (W - pad * 2) / 5;
            ctx.textAlign = 'center';

            // Frequency
            ctx.fillStyle = '#2563eb'; ctx.font = `bold ${fs(18)}px monospace`;
            ctx.fillText(`ν = ${s.freq.toFixed(1)} Hz`, pad + colW * 0.5, infoMidY);

            // Velocity
            ctx.fillStyle = '#d97706'; ctx.font = `bold ${fs(18)}px monospace`;
            ctx.fillText(`v = ${v_wave.toFixed(0)} m/s`, pad + colW * 1.5, infoMidY);

            // Wavelength
            ctx.fillStyle = '#7c3aed'; ctx.font = `bold ${fs(18)}px monospace`;
            ctx.fillText(`λ = ${lambda.toFixed(2)} m`, pad + colW * 2.5, infoMidY);

            // Wave number
            ctx.fillStyle = '#475569'; ctx.font = `bold ${fs(16)}px monospace`;
            ctx.fillText(`k = ${k.toFixed(1)} rad/m`, pad + colW * 3.5, infoMidY);

            // Standing wave equation or resonance info
            if (isResonant && n_harmonic > 0) {
                ctx.fillStyle = '#16a34a'; ctx.font = `bold ${fs(15)}px "Inter", sans-serif`;
                ctx.fillText(`y = 2A sin(kx) cos(ωt)`, pad + colW * 4.5, infoMidY);
            } else {
                ctx.fillStyle = '#94a3b8'; ctx.font = `bold ${fs(13)}px "Inter", sans-serif`;
                ctx.fillText('v = √(T/μ)', pad + colW * 4.5, infoMidY);
            }

            // Sub labels
            ctx.font = `${fs(9)}px "Inter", sans-serif`; ctx.fillStyle = '#94a3b8';
            ctx.fillText('FREQUENCY', pad + colW * 0.5, infoMidY + fs(12) + 2);
            ctx.fillText('WAVE SPEED', pad + colW * 1.5, infoMidY + fs(12) + 2);
            ctx.fillText('WAVELENGTH', pad + colW * 2.5, infoMidY + fs(12) + 2);
            ctx.fillText('WAVE NUMBER', pad + colW * 3.5, infoMidY + fs(12) + 2);
            ctx.fillText(isResonant ? 'STANDING WAVE' : 'FORMULA', pad + colW * 4.5, infoMidY + fs(12) + 2);
        }

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw]);

    const handleReset = () => {
        setFreq(5.0); setTension(50); setFixedEnd(true); setRunning(true);
        stateRef.current = { freq: 5.0, tension: 50, mu: 0.01, amplitude: 35, fixedEnd: true, running: true, time: 0 };
    };

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-2 md:gap-4 w-full text-slate-700 p-1 md:p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🎵 Driver Frequency</span>
                        <span className="text-blue-700 font-mono text-base md:text-lg bg-blue-50 border border-blue-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{freq.toFixed(1)} Hz</span>
                    </label>
                    <input type="range" min="1" max="50" step="0.5" value={freq}
                        onChange={(e) => setFreq(Number(e.target.value))}
                        className="w-full accent-blue-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-400">
                        <span>1 Hz</span><span>50 Hz</span>
                    </div>
                </div>
                <div className="space-y-2 md:space-y-3 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center mb-1">
                        <span>🔧 String Tension</span>
                        <span className="text-amber-700 font-mono text-base md:text-lg bg-amber-50 border border-amber-100 px-3 py-0.5 md:py-1 rounded shadow-sm">{Math.round(tension)} N</span>
                    </label>
                    <input type="range" min="10" max="200" step="5" value={tension}
                        onChange={(e) => setTension(Number(e.target.value))}
                        className="w-full accent-amber-600 h-2 md:h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-400">
                        <span>10 N</span><span>200 N</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 items-center justify-center mt-1 md:mt-2">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto">
                    <button onClick={() => setFixedEnd(true)}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-bold rounded-lg transition-all ${fixedEnd
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>
                        FIXED END
                    </button>
                    <button onClick={() => setFixedEnd(false)}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-bold rounded-lg transition-all ${!fixedEnd
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}>
                        FREE END
                    </button>
                </div>
                <button onClick={() => setRunning(!running)}
                    className={`w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 rounded-xl border font-bold text-sm md:text-base transition-all shadow-md active:scale-95 ${running
                        ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        : 'bg-emerald-600 text-white border-emerald-500 shadow-lg'}`}>
                    {running ? <><Pause size={20} /> PAUSE</> : <><Play size={20} /> RESUME</>}
                </button>
                <button onClick={handleReset}
                    className="w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-all font-bold text-sm md:text-base shadow-sm active:scale-95">
                    <RotateCcw size={20} /> RESET ALL
                </button>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer topic={topic} onExit={onExit}
            SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />
    );
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

export default WavesLab;
