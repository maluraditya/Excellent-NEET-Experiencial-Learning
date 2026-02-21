import React, { useRef, useEffect, useCallback } from 'react';

const kB = 1.38e-23; // Boltzmann constant
const mMol = 4.65e-26; // mass of N₂ molecule (kg)

interface Molecule { x: number; y: number; vx: number; vy: number; }
interface Flash { x: number; y: number; t: number; wall: string; }

const KineticTheoryLab: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef(0);
    const stateRef = useRef({
        T: 400, // Kelvin
        volFrac: 1.0, // volume fraction (0.4–1.5)
        N: 60, // number of visible molecules
    });
    const molRef = useRef<Molecule[]>([]);
    const flashRef = useRef<Flash[]>([]);
    const collCountRef = useRef(0);
    const pressureRef = useRef(0);
    const graphRef = useRef<{ t: number; P: number }[]>([]);
    const frameRef = useRef(0);

    // Initialize molecules
    const initMols = useCallback((count: number, T: number, volFrac: number) => {
        const speed = Math.sqrt(3 * kB * T / mMol) * 0.00004; // scale to canvas px/frame
        const mols: Molecule[] = [];
        const chamberH = 200 * volFrac;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            mols.push({
                x: 40 + Math.random() * 180,
                y: 50 + (200 - chamberH) + Math.random() * (chamberH - 20),
                vx: Math.cos(angle) * speed * (0.5 + Math.random()),
                vy: Math.sin(angle) * speed * (0.5 + Math.random()),
            });
        }
        return mols;
    }, []);

    // Reset molecules when state changes significantly
    const rescaleMols = useCallback(() => {
        const s = stateRef.current;
        const speed = Math.sqrt(3 * kB * s.T / mMol) * 0.00004;
        const chamberBottom = 50 + 200;
        const chamberTop = chamberBottom - 200 * s.volFrac;
        const mols = molRef.current;

        // Add or remove molecules
        while (mols.length < s.N) {
            const angle = Math.random() * Math.PI * 2;
            mols.push({
                x: 40 + Math.random() * 180,
                y: chamberTop + 10 + Math.random() * (chamberBottom - chamberTop - 20),
                vx: Math.cos(angle) * speed * (0.5 + Math.random()),
                vy: Math.sin(angle) * speed * (0.5 + Math.random()),
            });
        }
        while (mols.length > s.N) mols.pop();

        // Rescale speeds to match temperature
        mols.forEach(m => {
            const curSpeed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
            if (curSpeed > 0.01) {
                const scale = speed / curSpeed;
                m.vx *= scale * (0.7 + Math.random() * 0.6);
                m.vy *= scale * (0.7 + Math.random() * 0.6);
            }
        });
    }, []);

    useEffect(() => {
        molRef.current = initMols(stateRef.current.N, stateRef.current.T, stateRef.current.volFrac);
    }, [initMols]);

    // ==================== DRAW LOOP ====================
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width, H = canvas.height;
        const s = stateRef.current;
        const mols = molRef.current;
        const flashes = flashRef.current;
        frameRef.current++;

        // Clear
        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0f172a'); bg.addColorStop(1, '#1e293b');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // ===== LAYOUT =====
        const chamberX = 30, chamberW = 200, chamberBottom = 260;
        const chamberH = 200 * s.volFrac;
        const chamberTop = chamberBottom - chamberH;
        const dx = 500, dy = 20, dw = 290;

        // ===== GAS CHAMBER =====
        // Chamber background
        ctx.fillStyle = 'rgba(15,23,42,0.6)';
        ctx.fillRect(chamberX, chamberTop, chamberW, chamberH);
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
        ctx.strokeRect(chamberX, chamberTop, chamberW, chamberH);

        // Piston (top wall)
        ctx.fillStyle = '#64748b';
        roundRect(ctx, chamberX - 5, chamberTop - 10, chamberW + 10, 12, 4); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
        roundRect(ctx, chamberX - 5, chamberTop - 10, chamberW + 10, 12, 4); ctx.stroke();
        // Piston rod
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(chamberX + chamberW / 2, chamberTop - 10); ctx.lineTo(chamberX + chamberW / 2, 20); ctx.stroke();

        // Labels
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('GAS CHAMBER', chamberX + chamberW / 2, 16);

        // ===== SIMULATE MOLECULES =====
        let collisions = 0;
        const time = Date.now() * 0.001;

        mols.forEach(m => {
            // Move
            m.x += m.vx; m.y += m.vy;

            // Wall collisions
            if (m.x <= chamberX + 3) { m.x = chamberX + 3; m.vx = Math.abs(m.vx); collisions++; flashes.push({ x: chamberX, y: m.y, t: time, wall: 'left' }); }
            if (m.x >= chamberX + chamberW - 3) { m.x = chamberX + chamberW - 3; m.vx = -Math.abs(m.vx); collisions++; flashes.push({ x: chamberX + chamberW, y: m.y, t: time, wall: 'right' }); }
            if (m.y <= chamberTop + 4) { m.y = chamberTop + 4; m.vy = Math.abs(m.vy); collisions++; flashes.push({ x: m.x, y: chamberTop, t: time, wall: 'top' }); }
            if (m.y >= chamberBottom - 3) { m.y = chamberBottom - 3; m.vy = -Math.abs(m.vy); collisions++; flashes.push({ x: m.x, y: chamberBottom, t: time, wall: 'bottom' }); }
        });

        collCountRef.current += collisions;

        // Calculate pressure: P = ⅓ n m <v²> (scaled for display)
        let sumV2 = 0;
        mols.forEach(m => { sumV2 += m.vx * m.vx + m.vy * m.vy; });
        const avgV2 = mols.length > 0 ? sumV2 / mols.length : 0;
        const n_density = s.N / (chamberW * chamberH);
        const rawP = (1 / 3) * n_density * mMol * avgV2 * 1e15; // scaled
        pressureRef.current = pressureRef.current * 0.95 + rawP * 0.05; // smooth
        const P = pressureRef.current;

        // Store graph data
        if (frameRef.current % 10 === 0) {
            graphRef.current.push({ t: frameRef.current, P });
            if (graphRef.current.length > 100) graphRef.current.shift();
        }

        // ===== DRAW COLLISION FLASHES =====
        const now = Date.now() * 0.001;
        for (let i = flashes.length - 1; i >= 0; i--) {
            const age = now - flashes[i].t;
            if (age > 0.3) { flashes.splice(i, 1); continue; }
            const alpha = 1 - age / 0.3;
            const r = 3 + age * 25;
            ctx.fillStyle = `rgba(251,191,36,${alpha * 0.6})`;
            ctx.beginPath(); ctx.arc(flashes[i].x, flashes[i].y, r, 0, Math.PI * 2); ctx.fill();
        }

        // ===== DRAW MOLECULES =====
        const tempNorm = Math.max(0, Math.min(1, (s.T - 100) / 900));
        const mR = Math.round(60 + tempNorm * 195), mB = Math.round(200 - tempNorm * 150);
        mols.forEach(m => {
            // Trail
            const speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
            const trailLen = Math.min(speed * 4, 12);
            if (trailLen > 1) {
                const ang = Math.atan2(-m.vy, -m.vx);
                ctx.strokeStyle = `rgba(${mR}, 100, ${mB}, 0.25)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(m.x, m.y);
                ctx.lineTo(m.x + Math.cos(ang) * trailLen, m.y + Math.sin(ang) * trailLen);
                ctx.stroke();
            }
            // Dot
            ctx.fillStyle = `rgb(${mR}, 100, ${mB})`;
            ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,0.4)`;
            ctx.beginPath(); ctx.arc(m.x - 0.7, m.y - 0.7, 1.2, 0, Math.PI * 2); ctx.fill();
        });

        // Thermometer inside chamber
        const thX = chamberX + chamberW - 18, thY2 = chamberTop + 15, thH = Math.min(50, chamberH - 30);
        if (thH > 10) {
            ctx.fillStyle = '#0f172a'; roundRect(ctx, thX, thY2, 7, thH, 3); ctx.fill();
            ctx.fillStyle = `rgb(${mR}, 50, ${mB})`;
            ctx.fillRect(thX + 1, thY2 + thH - tempNorm * thH, 5, tempNorm * thH);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(s.T)}K`, thX + 3, thY2 - 5);
        }

        // ===== P-V/P-T GRAPH (center) =====
        const gx = 260, gy = 25, gw = 220, gh = 180;
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('PRESSURE vs TIME', gx + gw / 2, gy - 5);
        ctx.fillText('Time →', gx + gw / 2, gy + gh + 14);
        ctx.save(); ctx.translate(gx - 10, gy + gh / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('P →', 0, 0); ctx.restore();

        // Draw graph line
        const gd = graphRef.current;
        if (gd.length > 1) {
            const maxP = Math.max(...gd.map(d => d.P)) * 1.2 || 1;
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
            ctx.beginPath();
            gd.forEach((d, i) => {
                const px = gx + (i / (gd.length - 1)) * gw;
                const py = gy + gh - (d.P / maxP) * gh;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            });
            ctx.stroke();
            // Current P line
            const curPy = gy + gh - (P / maxP) * gh;
            ctx.strokeStyle = 'rgba(245,158,11,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.moveTo(gx, curPy); ctx.lineTo(gx + gw, curPy); ctx.stroke();
            ctx.setLineDash([]);
        }

        // ===== RIGHT PANEL =====
        // State readouts
        ctx.fillStyle = 'rgba(30,41,59,0.7)'; roundRect(ctx, dx, dy, dw, 80, 8); ctx.fill();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, dy, dw, 80, 8); ctx.stroke();

        const vals = [
            ['T', `${Math.round(s.T)} K`, '#ef4444'],
            ['N', `${s.N}`, '#22c55e'],
            ['P', `${P.toFixed(2)}`, '#f59e0b'],
        ];
        vals.forEach((v, i) => {
            const cx = dx + 10 + i * (dw / 3) + dw / 6;
            ctx.fillStyle = '#64748b'; ctx.font = '8px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(v[0], cx, dy + 18);
            ctx.fillStyle = v[2]; ctx.font = 'bold 16px monospace'; ctx.fillText(v[1], cx, dy + 40);
        });
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 8px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`Volume: ${(s.volFrac * 100).toFixed(0)}%  |  P = ⅓ n m ⟨v²⟩`, dx + dw / 2, dy + 62);
        ctx.fillStyle = '#64748b'; ctx.font = '7px Inter, sans-serif';
        ctx.fillText(`½m⟨v²⟩ = 3/2 kᵦT → T is avg. kinetic energy`, dx + dw / 2, dy + 74);

        // ===== CONTROLS =====
        const ctrlY = dy + 92;
        // Temperature slider
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`🔥 Temperature: ${Math.round(s.T)} K`, dx + 10, ctrlY + 10);
        const slW = dw - 20;
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, ctrlY + 16, slW, 12, 6); ctx.fill();
        const tNorm = (s.T - 100) / 900;
        const tGrad = ctx.createLinearGradient(dx + 10, 0, dx + 10 + slW, 0);
        tGrad.addColorStop(0, '#3b82f6'); tGrad.addColorStop(1, '#ef4444');
        ctx.fillStyle = tGrad; roundRect(ctx, dx + 10, ctrlY + 16, tNorm * slW, 12, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx + 10 + tNorm * slW, ctrlY + 22, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx + 10 + tNorm * slW, ctrlY + 22, 8, 0, Math.PI * 2); ctx.stroke();

        // Volume slider
        const vslY = ctrlY + 40;
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`📦 Volume: ${(s.volFrac * 100).toFixed(0)}%`, dx + 10, vslY + 10);
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, vslY + 16, slW, 12, 6); ctx.fill();
        const vNorm = (s.volFrac - 0.3) / 1.2;
        ctx.fillStyle = '#8b5cf6'; roundRect(ctx, dx + 10, vslY + 16, vNorm * slW, 12, 6); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx + 10 + vNorm * slW, vslY + 22, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx + 10 + vNorm * slW, vslY + 22, 8, 0, Math.PI * 2); ctx.stroke();

        // Molecule buttons
        const mbY = vslY + 42;
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`🧪 Molecules: ${s.N}`, dx + 10, mbY + 10);
        // - button
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, mbY + 16, slW / 2 - 5, 30, 8); ctx.fill();
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; roundRect(ctx, dx + 10, mbY + 16, slW / 2 - 5, 30, 8); ctx.stroke();
        ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('− 20 Molecules', dx + 10 + (slW / 2 - 5) / 2, mbY + 35);
        // + button
        const pbx = dx + 10 + slW / 2 + 5;
        ctx.fillStyle = '#1e293b'; roundRect(ctx, pbx, mbY + 16, slW / 2 - 5, 30, 8); ctx.fill();
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5; roundRect(ctx, pbx, mbY + 16, slW / 2 - 5, 30, 8); ctx.stroke();
        ctx.fillStyle = '#22c55e'; ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText('+ 20 Molecules', pbx + (slW / 2 - 5) / 2, mbY + 35);

        // Reset
        const rstY = mbY + 56;
        ctx.fillStyle = '#1e293b'; roundRect(ctx, dx + 10, rstY, slW, 28, 8); ctx.fill();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; roundRect(ctx, dx + 10, rstY, slW, 28, 8); ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('↺ Reset', dx + 10 + slW / 2, rstY + 18);

        // ===== DESCRIPTION BOX (bottom-left) =====
        const descY = 280, descW2 = 475, descH2 = 140;
        ctx.fillStyle = 'rgba(30,41,59,0.85)'; roundRect(ctx, 15, descY, descW2, descH2, 10); ctx.fill();
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; roundRect(ctx, 15, descY, descW2, descH2, 10); ctx.stroke();
        ctx.fillStyle = '#f59e0b'; roundRect(ctx, 27, descY + 12, 6, 28, 3); ctx.fill();
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Kinetic Theory of Gases', 42, descY + 24);
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 10px monospace';
        ctx.fillText('P = ⅓ n m ⟨v²⟩    |    ½m⟨v²⟩ = 3/2 kᵦT', 42, descY + 42);
        ctx.fillStyle = '#94a3b8'; ctx.font = '9px Inter, sans-serif';
        wrapText(ctx, 'Gas pressure arises from billions of elastic molecular collisions against container walls. Each molecule transfers momentum 2mvₓ upon bouncing. Higher temperature means faster molecules → more momentum per collision → higher pressure. Smaller volume means more collisions per second → higher pressure.', 42, descY + 60, descW2 - 60, 13);

        // ===== HOW TO USE (bottom-right) =====
        const guideY = rstY + 40;
        const guideH = H - guideY - 8;
        if (guideH > 50) {
            ctx.fillStyle = 'rgba(30,41,59,0.5)'; roundRect(ctx, dx, guideY, dw, guideH, 8); ctx.fill();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; roundRect(ctx, dx, guideY, dw, guideH, 8); ctx.stroke();
            ctx.fillStyle = '#64748b'; ctx.font = 'bold 9px Inter, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('💡 HOW TO USE', dx + dw / 2, guideY + 16);
            ctx.textAlign = 'left'; ctx.font = '8.5px Inter, sans-serif';
            const steps = [
                ['1.', 'Drag Temperature slider — watch speed change'],
                ['2.', 'Drag Volume slider — piston moves, density changes'],
                ['3.', 'Add/remove molecules — see pressure respond'],
                ['4.', 'Watch yellow flashes — each is a wall collision'],
                ['5.', 'Graph shows live pressure over time'],
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
        ctx.fillText(`Collisions/frame: ${collisions}  |  Drag sliders or click buttons to explore.`, 10, 12);

        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        molRef.current = initMols(stateRef.current.N, stateRef.current.T, stateRef.current.volFrac);
        animRef.current = requestAnimationFrame(draw);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [draw, initMols]);

    // ===== MOUSE HANDLERS =====
    const draggingRef = useRef<string>('');

    const getCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const c = canvasRef.current;
        if (!c) return { x: 0, y: 0 };
        const r = c.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
    }, []);

    const handleSliderDrag = useCallback((x: number, y: number) => {
        const dx = 500, dw = 290, slW = dw - 20;
        const ctrlY = 20 + 92; // dy + 92

        // Temp slider: ctrlY+16 to ctrlY+28
        if (draggingRef.current === 'temp' || (y >= ctrlY + 10 && y <= ctrlY + 34)) {
            if (x >= dx + 10 && x <= dx + 10 + slW) {
                draggingRef.current = 'temp';
                const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
                stateRef.current.T = 100 + val * 900;
                rescaleMols();
            }
        }

        // Vol slider: vslY = ctrlY+40, range ctrlY+56 to ctrlY+68
        const vslY = ctrlY + 40;
        if (draggingRef.current === 'vol' || (y >= vslY + 10 && y <= vslY + 34)) {
            if (x >= dx + 10 && x <= dx + 10 + slW) {
                draggingRef.current = 'vol';
                const val = Math.max(0, Math.min(1, (x - (dx + 10)) / slW));
                stateRef.current.volFrac = 0.3 + val * 1.2;
                rescaleMols();
            }
        }
    }, [rescaleMols]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCoords(e);
        const dx = 500, dw = 290, slW = dw - 20;
        const ctrlY = 20 + 92;

        // Check sliders first
        if (y >= ctrlY + 10 && y <= ctrlY + 34 && x >= dx + 2 && x <= dx + dw) {
            draggingRef.current = 'temp';
            handleSliderDrag(x, y);
            return;
        }
        const vslY = ctrlY + 40;
        if (y >= vslY + 10 && y <= vslY + 34 && x >= dx + 2 && x <= dx + dw) {
            draggingRef.current = 'vol';
            handleSliderDrag(x, y);
            return;
        }

        // Molecule buttons: mbY = vslY + 42
        const mbY = vslY + 42;
        const bhW = slW / 2 - 5;
        // - button
        if (x >= dx + 10 && x <= dx + 10 + bhW && y >= mbY + 16 && y <= mbY + 46) {
            stateRef.current.N = Math.max(5, stateRef.current.N - 20);
            rescaleMols();
            return;
        }
        // + button
        const pbx = dx + 10 + slW / 2 + 5;
        if (x >= pbx && x <= pbx + bhW && y >= mbY + 16 && y <= mbY + 46) {
            stateRef.current.N = Math.min(200, stateRef.current.N + 20);
            rescaleMols();
            return;
        }

        // Reset
        const rstY = mbY + 56;
        if (x >= dx + 10 && x <= dx + 10 + slW && y >= rstY && y <= rstY + 28) {
            stateRef.current = { T: 400, volFrac: 1.0, N: 60 };
            molRef.current = initMols(60, 400, 1.0);
            graphRef.current = [];
            pressureRef.current = 0;
            collCountRef.current = 0;
        }
    }, [getCoords, handleSliderDrag, rescaleMols, initMols]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!draggingRef.current) return;
        const { x, y } = getCoords(e);
        handleSliderDrag(x, y);
    }, [getCoords, handleSliderDrag]);

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

export default KineticTheoryLab;
