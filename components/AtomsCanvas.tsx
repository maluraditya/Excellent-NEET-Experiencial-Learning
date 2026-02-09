import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Info, Atom, Microscope, RotateCcw } from 'lucide-react';

// --- Constants ---
const AU_Z = 79;
const AL_Z = 13;

interface AlphaParticle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    impactB: number; // Distance from center axis
    trail: { x: number; y: number }[];
}

interface MacroParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
}

const AtomsCanvas: React.FC = () => {
    // --- State ---
    const [viewMode, setViewMode] = useState<'MACRO' | 'MICRO'>('MICRO');
    const [isPlaying, setIsPlaying] = useState(true);
    const [targetZ, setTargetZ] = useState(AU_Z);
    const [energyMev, setEnergyMev] = useState(5.5);
    const [beamSpread, setBeamSpread] = useState(120);
    const [detectorAngle, setDetectorAngle] = useState(30);
    const [showAnalogy, setShowAnalogy] = useState(false);
    const [showLabels, setShowLabels] = useState(true);

    // Canvas
    const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);

    // Particles
    const particlesRef = useRef<AlphaParticle[]>([]);
    const macroParticlesRef = useRef<MacroParticle[]>([]);
    const frameRef = useRef(0);

    // --- Resize ---
    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                setDimensions({ width: clientWidth || 1000, height: clientHeight || 700 });
            }
        };
        update();
        const obs = new ResizeObserver(update);
        if (containerRef.current) obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    // --- Reset ---
    const reset = useCallback(() => {
        particlesRef.current = [];
        macroParticlesRef.current = [];
        frameRef.current = 0;
    }, []);

    // --- Animation ---
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = dimensions;
        const nucX = width * 0.6; // Nucleus position
        const nucY = height / 2;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        if (viewMode === 'MACRO') {
            renderMacro(ctx, width, height, nucX, nucY);
        } else {
            renderMicro(ctx, width, height, nucX, nucY);
        }

        frameRef.current++;
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        }
    }, [viewMode, isPlaying, targetZ, energyMev, beamSpread, detectorAngle, dimensions, showLabels]);

    useEffect(() => {
        if (isPlaying) requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [animate, isPlaying]);

    // ========================================
    // MICROSCOPIC VIEW
    // ========================================
    const renderMicro = (ctx: CanvasRenderingContext2D, W: number, H: number, nucX: number, nucY: number) => {
        const nucRadius = targetZ === AU_Z ? 10 : 7;
        const speed = 4 + energyMev * 0.3; // Base horizontal speed

        // The key physics parameter: how close must particle be to feel strong force
        // In reality, nucleus is ~10^-15 m, atom is ~10^-10 m, so ratio is 1:100000
        // For visualization, we use a "deflection radius" around nucleus
        const deflectionRadius = 80; // Pixels - only within this zone do particles deflect significantly
        const forceScale = (targetZ / AU_Z) * 2000 * (5.5 / energyMev);

        // --- Background Grid ---
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (let y = 0; y < H; y += 60) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }

        // --- Source Box ---
        const srcX = 30;
        ctx.fillStyle = '#475569';
        ctx.fillRect(5, nucY - beamSpread - 20, 40, 20);
        ctx.fillRect(5, nucY + beamSpread, 40, 20);
        ctx.fillStyle = '#334155';
        ctx.fillRect(5, nucY - beamSpread, 40, beamSpread * 2);

        // Collimator slits
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(35, nucY - beamSpread, 15, beamSpread * 2);

        if (showLabels) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('α Source', 25, nucY - beamSpread - 28);
        }

        // --- Draw Gold Foil (thin vertical line where nucleus is) ---
        ctx.fillStyle = 'rgba(250, 204, 21, 0.15)';
        ctx.fillRect(nucX - 1, 0, 2, H);

        if (showLabels) {
            ctx.fillStyle = '#fde047';
            ctx.font = '9px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Gold Foil', nucX, 15);
        }

        // --- Draw Nucleus ---
        // Glow
        const grad = ctx.createRadialGradient(nucX, nucY, 0, nucX, nucY, deflectionRadius);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0.25)');
        grad.addColorStop(0.5, 'rgba(250, 204, 21, 0.05)');
        grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nucX, nucY, deflectionRadius, 0, Math.PI * 2);
        ctx.fill();

        // --- Draw Electron Shells ---
        // Gold (Au, Z=79): 1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 4f¹⁴ 5s² 5p⁶ 5d¹⁰ 6s¹
        // Shell distribution: K(2), L(8), M(18), N(32), O(18), P(1) = 79
        // Aluminum (Al, Z=13): 1s² 2s² 2p⁶ 3s² 3p¹
        // Shell distribution: K(2), L(8), M(3) = 13
        // Showing simplified shells for visual clarity

        const electronShells = targetZ === AU_Z
            ? [
                { radius: 25, electrons: 2, color: 'rgba(59, 130, 246, 0.8)', speed: 0.03, label: 'K (2)' },     // K shell: 1s²
                { radius: 40, electrons: 8, color: 'rgba(59, 130, 246, 0.7)', speed: 0.022, label: 'L (8)' },    // L shell: 2s² 2p⁶
                { radius: 55, electrons: 18, color: 'rgba(59, 130, 246, 0.6)', speed: 0.016, label: 'M (18)' },  // M shell: 3s² 3p⁶ 3d¹⁰
                { radius: 75, electrons: 18, color: 'rgba(59, 130, 246, 0.5)', speed: 0.012, label: 'N (32)*' }, // N shell (showing 18 of 32 for visibility)
                { radius: 92, electrons: 18, color: 'rgba(59, 130, 246, 0.4)', speed: 0.009, label: 'O (18)' },  // O shell: 5s² 5p⁶ 5d¹⁰
                { radius: 108, electrons: 1, color: 'rgba(250, 204, 21, 0.9)', speed: 0.006, label: 'P (1)' },   // P shell: 6s¹ (valence - gold color)
            ]
            : [
                { radius: 25, electrons: 2, color: 'rgba(147, 197, 253, 0.8)', speed: 0.03, label: 'K (2)' },   // K shell: 1s²
                { radius: 45, electrons: 8, color: 'rgba(147, 197, 253, 0.6)', speed: 0.02, label: 'L (8)' },   // L shell: 2s² 2p⁶
                { radius: 65, electrons: 3, color: 'rgba(250, 204, 21, 0.8)', speed: 0.015, label: 'M (3)' },   // M shell: 3s² 3p¹ (valence - gold color)
            ];

        // Draw orbital paths (dotted circles) with labels
        electronShells.forEach((shell, index) => {
            ctx.strokeStyle = shell.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 6]);
            ctx.beginPath();
            ctx.arc(nucX, nucY, shell.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Add shell label on the right side
            if (showLabels) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(shell.label, nucX + shell.radius + 5, nucY - 3);
            }
        });
        ctx.setLineDash([]);

        // Draw electrons orbiting
        const time = frameRef.current * 0.016; // Time in seconds (assuming ~60fps)
        electronShells.forEach(shell => {
            for (let i = 0; i < shell.electrons; i++) {
                const baseAngle = (2 * Math.PI * i) / shell.electrons;
                const angle = baseAngle + time * shell.speed * 60; // Orbiting animation

                const eX = nucX + shell.radius * Math.cos(angle);
                const eY = nucY + shell.radius * Math.sin(angle);

                // Check if any alpha particle is near this electron (ionization effect)
                let isDisturbed = false;
                particlesRef.current.forEach(p => {
                    const distToElectron = Math.sqrt((p.x - eX) ** 2 + (p.y - eY) ** 2);
                    if (distToElectron < 15) {
                        isDisturbed = true;
                    }
                });

                // Draw electron
                ctx.beginPath();
                if (isDisturbed) {
                    // Electron gets knocked/disturbed when alpha passes nearby
                    ctx.fillStyle = '#fbbf24'; // Flash yellow when disturbed
                    ctx.arc(eX + (Math.random() - 0.5) * 8, eY + (Math.random() - 0.5) * 8, 4, 0, Math.PI * 2);
                } else {
                    ctx.fillStyle = '#60a5fa'; // Normal blue electron
                    ctx.arc(eX, eY, 3, 0, Math.PI * 2);
                }
                ctx.fill();

                // Small glow for electrons
                if (!isDisturbed) {
                    ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
                    ctx.beginPath();
                    ctx.arc(eX, eY, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        // Core nucleus
        ctx.fillStyle = targetZ === AU_Z ? '#facc15' : '#a1a1aa';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(nucX, nucY, nucRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // + sign on nucleus
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', nucX, nucY);

        if (showLabels) {
            ctx.fillStyle = '#fde047';
            ctx.font = '11px Inter';
            ctx.textBaseline = 'top';
            ctx.fillText(targetZ === AU_Z ? 'Au (Z=79)' : 'Al (Z=13)', nucX, nucY + nucRadius + 8);

            // Add electron shell label
            ctx.fillStyle = '#60a5fa';
            ctx.font = '9px Inter';
            ctx.fillText('e⁻ shells', nucX, nucY - (targetZ === AU_Z ? 105 : 80));
        }

        // --- Spawn Particles ---
        // Create evenly spaced beams across the spread
        if (isPlaying && frameRef.current % 6 === 0 && particlesRef.current.length < 80) {
            // Spawn 3-4 particles at different Y positions
            const numSpawn = 4;
            for (let i = 0; i < numSpawn; i++) {
                const yOffset = (Math.random() - 0.5) * beamSpread * 2;
                particlesRef.current.push({
                    id: Math.random(),
                    x: srcX + 15,
                    y: nucY + yOffset,
                    vx: speed,
                    vy: 0,
                    impactB: Math.abs(yOffset),
                    trail: []
                });
            }
        }

        // --- Update & Draw Particles ---
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];

            // Calculate distance to nucleus
            const dx = p.x - nucX;
            const dy = p.y - nucY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Only apply force if CLOSE to nucleus
            if (dist < deflectionRadius && dist > nucRadius) {
                // Coulomb force: F = k * q1 * q2 / r^2
                // Force magnitude drops with r^2
                const forceMag = forceScale / (dist * dist);

                // Force direction: repulsive (away from nucleus)
                const fx = (dx / dist) * forceMag;
                const fy = (dy / dist) * forceMag;

                p.vx += fx;
                p.vy += fy;
            }

            // Move particle
            p.x += p.vx;
            p.y += p.vy;

            // Add to trail
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 100) p.trail.shift();

            // Draw trail
            if (p.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(p.trail[0].x, p.trail[0].y);
                for (let j = 1; j < p.trail.length; j++) {
                    ctx.lineTo(p.trail[j].x, p.trail[j].y);
                }

                // Color by how close it passed to nucleus
                let color: string;
                if (p.impactB < 15) {
                    color = '#fbbf24'; // Gold - head-on
                } else if (p.impactB < 40) {
                    color = '#ef4444'; // Red - close pass, large deflection
                } else {
                    color = '#22c55e'; // Green - passes through
                }

                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Draw particle head
            ctx.beginPath();
            ctx.fillStyle = '#ef4444';
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Remove if off-screen
            if (p.x > W + 20 || p.x < -50 || p.y < -50 || p.y > H + 50) {
                particlesRef.current.splice(i, 1);
            }
        }

        // --- Static beam guide lines (showing expected paths) ---
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        const numLines = 9;
        for (let i = 0; i < numLines; i++) {
            const y = nucY - beamSpread + (beamSpread * 2 * i) / (numLines - 1);
            ctx.beginPath();
            ctx.moveTo(srcX + 15, y);
            // Lines going straight through
            ctx.lineTo(W, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // --- Legend ---
        if (showLabels) {
            const lx = W - 170, ly = 20;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.fillRect(lx - 10, ly - 5, 170, 130);
            ctx.strokeStyle = '#334155';
            ctx.strokeRect(lx - 10, ly - 5, 170, 130);

            ctx.font = '10px Inter';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            // Legend items - deflection types
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(lx, ly + 10, 18, 3);
            ctx.fillText('Head-on (θ ≈ 180°)', lx + 25, ly + 12);

            ctx.fillStyle = '#ef4444';
            ctx.fillRect(lx, ly + 28, 18, 3);
            ctx.fillText('Close pass (large θ)', lx + 25, ly + 30);

            ctx.fillStyle = '#22c55e';
            ctx.fillRect(lx, ly + 46, 18, 3);
            ctx.fillText('Far pass (straight)', lx + 25, ly + 48);

            // Electron info
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.arc(lx + 9, ly + 68, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Electrons (no deflection)', lx + 25, ly + 68);

            // Physics note
            ctx.fillStyle = '#64748b';
            ctx.font = 'italic 8px Inter';
            ctx.fillText('α mass ≈ 7300 × e⁻ mass', lx, ly + 90);
            ctx.fillText('→ e⁻ cannot deflect α particles', lx, ly + 102);

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'italic 9px Inter';
            ctx.fillText('F ∝ 1/r² (Coulomb)', lx + 30, ly + 118);
        }
    };

    // ========================================
    // MACROSCOPIC VIEW
    // ========================================
    const renderMacro = (ctx: CanvasRenderingContext2D, W: number, H: number, cx: number, cy: number) => {
        const chamberR = Math.min(W, H) * 0.4;

        // Chamber
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, chamberR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(30, 41, 59, 0.3)';
        ctx.fill();

        // Source
        const srcX = cx - chamberR - 20;
        ctx.fillStyle = '#64748b';
        ctx.fillRect(srcX - 10, cy - 15, 40, 30);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(srcX + 20, cy - 2, 15, 4);

        if (showLabels) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '9px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Source', srcX + 10, cy - 22);
        }

        // Beam to center
        ctx.beginPath();
        ctx.moveTo(srcX + 30, cy);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Foil
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cx - 1, cy - 30, 2, 60);
        if (showLabels) {
            ctx.fillStyle = '#fde047';
            ctx.font = '9px Inter';
            ctx.fillText('Au Foil', cx, cy + 45);
        }

        // Scattered particles
        if (isPlaying && macroParticlesRef.current.length < 200) {
            for (let i = 0; i < 3; i++) {
                let ang = 0;
                const r = Math.random();
                if (r < 0.9) ang = (Math.random() - 0.5) * 25;
                else if (r < 0.99) ang = (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 90);
                else ang = (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 80);

                const rad = (ang * Math.PI) / 180;
                const spd = 2 + Math.random();
                macroParticlesRef.current.push({
                    x: cx, y: cy,
                    vx: Math.cos(rad) * spd,
                    vy: Math.sin(rad) * spd,
                    life: 1
                });
            }
        }

        for (let i = macroParticlesRef.current.length - 1; i >= 0; i--) {
            const p = macroParticlesRef.current[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.007;

            const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
            if (p.life <= 0 || dist > chamberR) {
                macroParticlesRef.current.splice(i, 1);
                continue;
            }

            ctx.fillStyle = `rgba(239, 68, 68, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Detector
        const aRad = (detectorAngle * Math.PI) / 180;
        const dR = chamberR - 10;
        const dX = cx + dR * Math.cos(aRad);
        const dY = cy + dR * Math.sin(aRad);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(dX, dY);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.save();
        ctx.translate(dX, dY);
        ctx.rotate(aRad + Math.PI / 2);
        ctx.fillStyle = '#a3e635';
        ctx.fillRect(-12, -4, 24, 8);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-6, 4, 12, 10);

        const theta = Math.max(detectorAngle, 3);
        const prob = 80 / Math.pow(Math.sin((theta * Math.PI) / 360), 4);
        if (Math.random() * 5000 < prob) {
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 4, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();

        if (showLabels) {
            ctx.fillStyle = '#a3e635';
            ctx.font = '9px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(`${detectorAngle}°`, dX + 15, dY + 4);
        }

        // Graph
        const gW = 160, gH = 100, gX = W - gW - 15, gY = 15;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(gX, gY, gW, gH);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(gX, gY, gW, gH);

        const aX = gX + 20, aY = gY + gH - 20;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(aX, gY + 8);
        ctx.lineTo(aX, aY);
        ctx.lineTo(gX + gW - 10, aY);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        const eX = gX + gW - 10;
        for (let x = 0; x <= eX - aX; x += 2) {
            const a = (x / (eX - aX)) * 180;
            if (a < 3) continue;
            const v = 1 / Math.pow(Math.sin((a * Math.PI) / 360), 4);
            const py = aY - Math.min(v * 0.03, gH - 35);
            if (x < 5) ctx.moveTo(aX + x, py);
            else ctx.lineTo(aX + x, py);
        }
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(aX + (detectorAngle / 180) * (eX - aX), aY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('0°', aX, aY + 10);
        ctx.fillText('180°', eX - 5, aY + 10);
        ctx.fillText('N(θ)', aX - 10, gY + 15);
    };

    return (
        <div className="flex flex-col w-full h-full min-h-[650px] bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between p-2.5 bg-slate-800 border-b border-slate-700 shrink-0 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Atom size={18} className="text-blue-400" />
                    <h2 className="text-sm font-bold text-slate-200">Rutherford α-Scattering</h2>
                </div>

                <div className="flex gap-1.5">
                    <button onClick={() => setShowLabels(!showLabels)} className={`px-2 py-1 rounded text-xs ${showLabels ? 'bg-green-600/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>Labels</button>
                    <button onClick={reset} className="p-1.5 hover:bg-slate-700 rounded"><RotateCcw size={16} /></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 hover:bg-slate-700 rounded">{isPlaying ? <Pause size={16} /> : <Play size={16} />}</button>
                </div>
            </div>

            {/* Canvas */}
            <div ref={containerRef} className="relative flex-1 bg-slate-950 overflow-hidden min-h-[500px]">
                <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="block w-full h-full" />
                {showAnalogy && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-indigo-600/95 to-purple-700/95 text-white p-4 rounded-xl shadow-2xl max-w-md text-sm z-10 border border-white/20">
                        <h4 className="font-bold text-base flex items-center gap-2 mb-3 text-yellow-300">
                            <Info size={16} /> Atoms: The Nuclear Model
                        </h4>

                        <p className="text-xs leading-relaxed mb-3 text-white/90">
                            The atom is mostly <span className="text-yellow-300 font-semibold">empty space</span>. Rutherford discovered this by firing alpha particles at gold foil.
                        </p>

                        <div className="bg-white/10 rounded-lg p-2.5 mb-3">
                            <h5 className="font-bold text-xs text-green-300 mb-2">🔬 Alpha Scattering Observations:</h5>
                            <ul className="text-xs space-y-1 text-white/90">
                                <li><span className="text-green-400">▸</span> <strong>Most particles</strong> went straight through → Atom is hollow</li>
                                <li><span className="text-yellow-400">▸</span> <strong>Some deflected</strong> slightly → Passed near something positive</li>
                                <li><span className="text-red-400">▸</span> <strong>1 in 20,000</strong> bounced BACK → Nucleus is tiny, heavy & positive!</li>
                            </ul>
                        </div>

                        <div className="bg-white/10 rounded-lg p-2.5">
                            <h5 className="font-bold text-xs text-blue-300 mb-2">🏟️ The Football Stadium Analogy:</h5>
                            <p className="text-xs text-white/90 mb-1.5">If an Atom were the size of a football stadium:</p>
                            <ul className="text-xs space-y-1 text-white/80">
                                <li>• <span className="text-yellow-300">Nucleus</span> = marble at center kickoff spot</li>
                                <li>• <span className="text-blue-300">Electrons</span> = tiny flies buzzing in top stands</li>
                                <li>• <span className="text-slate-300">Everything else?</span> Empty space!</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-2.5 bg-slate-800 border-t border-slate-700 shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-semibold text-slate-400 uppercase">Target</label>
                        <div className="flex bg-slate-900 rounded p-0.5 border border-slate-700">
                            <button onClick={() => setTargetZ(AU_Z)} className={`flex-1 py-1 px-2 rounded text-xs ${targetZ === AU_Z ? 'bg-yellow-600/20 text-yellow-400' : 'text-slate-400'}`}>Gold</button>
                            <button onClick={() => setTargetZ(AL_Z)} className={`flex-1 py-1 px-2 rounded text-xs ${targetZ === AL_Z ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'}`}>Al</button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="flex justify-between text-[9px] font-semibold text-slate-400"><span>Beam Width</span><span className="text-green-400">{beamSpread}px</span></label>
                        <input type="range" min="40" max="200" value={beamSpread} onChange={e => setBeamSpread(+e.target.value)} className="w-full h-1.5 bg-slate-700 rounded cursor-pointer accent-green-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="flex justify-between text-[9px] font-semibold text-slate-400"><span>α Energy</span><span className="text-red-400">{energyMev} MeV</span></label>
                        <input type="range" min="2" max="10" step="0.5" value={energyMev} onChange={e => setEnergyMev(+e.target.value)} className="w-full h-1.5 bg-slate-700 rounded cursor-pointer accent-red-500" />
                    </div>

                    <div className="flex items-end justify-end">
                        <button onMouseEnter={() => setShowAnalogy(true)} onMouseLeave={() => setShowAnalogy(false)} onClick={() => setShowAnalogy(!showAnalogy)} className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-800/50">
                            <Info size={12} /> Analogy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AtomsCanvas;
