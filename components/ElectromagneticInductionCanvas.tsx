import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff, HelpCircle, X, Zap, Activity } from 'lucide-react';

type SimulationMode = 'faraday' | 'acgenerator';

const ElectromagneticInductionCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const graphCanvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    const [mode, setMode] = useState<SimulationMode>('faraday');
    const [isPlaying, setIsPlaying] = useState(true);
    const [showFieldLines, setShowFieldLines] = useState(true);
    const [showAnalogy, setShowAnalogy] = useState(false);

    // Faraday mode state
    const [magnetX, setMagnetX] = useState(100);
    const [magnetVelocity, setMagnetVelocity] = useState(0);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const lastMouseX = useRef(0);
    const [galvanometerAngle, setGalvanometerAngle] = useState(0);
    const [bulbBrightness, setBulbBrightness] = useState(0);

    // AC Generator mode state
    const [angularSpeed, setAngularSpeed] = useState(1);
    const [coilAngle, setCoilAngle] = useState(0);
    const fluxHistory = useRef<number[]>([]);
    const emfHistory = useRef<number[]>([]);

    // Constants
    const COIL_CENTER_X = 450;
    const COIL_LEFT = 380;
    const COIL_RIGHT = 520;

    // Reset simulation
    const handleReset = useCallback(() => {
        setMagnetX(100);
        setMagnetVelocity(0);
        setGalvanometerAngle(0);
        setBulbBrightness(0);
        setCoilAngle(0);
        fluxHistory.current = [];
        emfHistory.current = [];
    }, []);

    // Mouse handlers for dragging magnet
    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'faraday') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);

        // Check if clicking on magnet
        if (mouseX >= magnetX && mouseX <= magnetX + 120) {
            setIsDragging(true);
            lastMouseX.current = mouseX;
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || mode !== 'faraday') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);

        const delta = (mouseX - lastMouseX.current) * speedMultiplier;
        setMagnetVelocity(delta);
        setMagnetX(prev => Math.max(20, Math.min(prev + delta, 600)));
        lastMouseX.current = mouseX;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setMagnetVelocity(0);
    };

    // Main animation loop
    useEffect(() => {
        if (!isPlaying) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            if (mode === 'faraday') {
                renderFaradayMode(ctx, width, height);
            } else {
                renderACGeneratorMode(ctx, width, height);
                // Render graphs only if graphCanvas exists
                const graphCanvas = graphCanvasRef.current;
                if (graphCanvas) {
                    const graphCtx = graphCanvas.getContext('2d');
                    if (graphCtx) {
                        renderGraphs(graphCtx, graphCanvas.width, graphCanvas.height);
                    }
                }
            }

            animationRef.current = requestAnimationFrame(render);
        };

        const renderFaradayMode = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            const centerY = h / 2;

            // Background gradient
            const bg = ctx.createLinearGradient(0, 0, w, 0);
            bg.addColorStop(0, '#f8fafc');
            bg.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, w, h);

            // Calculate EMF based on magnet position relative to coil
            const magnetRight = magnetX + 120;
            const magnetCenter = magnetX + 60;
            let flux = 0;

            // Flux calculation based on overlap with coil
            if (magnetRight > COIL_LEFT && magnetX < COIL_RIGHT) {
                const overlap = Math.min(magnetRight, COIL_RIGHT) - Math.max(magnetX, COIL_LEFT);
                flux = overlap / (COIL_RIGHT - COIL_LEFT);
            }

            // EMF = -dΦ/dt (proportional to velocity when in/near coil)
            const proximityFactor = magnetCenter > COIL_LEFT - 100 && magnetCenter < COIL_RIGHT + 100 ? 1 : 0.3;
            const emf = -magnetVelocity * proximityFactor * 2;

            // Update galvanometer (smooth decay)
            const targetAngle = Math.max(-45, Math.min(45, emf * 3));
            setGalvanometerAngle(prev => prev * 0.85 + targetAngle * 0.15);

            // Update bulb brightness
            const targetBrightness = Math.min(1, Math.abs(emf) / 15);
            setBulbBrightness(prev => prev * 0.9 + targetBrightness * 0.1);

            // --- Draw Solenoid Coil ---
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 4;
            const coilY = centerY;
            const coilRadius = 50;
            const numTurns = 12;

            // Draw helix
            for (let i = 0; i < numTurns; i++) {
                const x = COIL_LEFT + (i / numTurns) * (COIL_RIGHT - COIL_LEFT);
                ctx.beginPath();
                ctx.ellipse(x, coilY, 8, coilRadius, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Coil outline
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(COIL_LEFT, coilY - coilRadius);
            ctx.lineTo(COIL_RIGHT, coilY - coilRadius);
            ctx.moveTo(COIL_LEFT, coilY + coilRadius);
            ctx.lineTo(COIL_RIGHT, coilY + coilRadius);
            ctx.stroke();

            // Wires from coil
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(COIL_LEFT, coilY + coilRadius);
            ctx.lineTo(COIL_LEFT, h - 60);
            ctx.lineTo(620, h - 60);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(COIL_RIGHT, coilY + coilRadius);
            ctx.lineTo(COIL_RIGHT, h - 100);
            ctx.lineTo(700, h - 100);
            ctx.lineTo(700, h - 60);
            ctx.stroke();

            // --- Draw Galvanometer ---
            const galvoX = 660;
            const galvoY = h - 60;
            const galvoRadius = 40;

            // Body
            ctx.fillStyle = '#fef3c7';
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(galvoX, galvoY, galvoRadius, Math.PI, 0);
            ctx.fill();
            ctx.stroke();

            // Scale markings
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('-', galvoX - 30, galvoY - 10);
            ctx.fillText('0', galvoX, galvoY - 30);
            ctx.fillText('+', galvoX + 30, galvoY - 10);

            // Needle
            ctx.save();
            ctx.translate(galvoX, galvoY);
            ctx.rotate((galvanometerAngle * Math.PI) / 180);
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-3, -35);
            ctx.lineTo(3, -35);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Center dot
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(galvoX, galvoY, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillText('Galvanometer', galvoX, galvoY + 25);

            // --- Draw Light Bulb ---
            const bulbX = 750;
            const bulbY = h - 80;

            // Glow effect
            if (bulbBrightness > 0.05) {
                const glow = ctx.createRadialGradient(bulbX, bulbY - 15, 0, bulbX, bulbY - 15, 50 * bulbBrightness);
                glow.addColorStop(0, `rgba(250, 204, 21, ${bulbBrightness})`);
                glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(bulbX, bulbY - 15, 50, 0, Math.PI * 2);
                ctx.fill();
            }

            // Bulb glass
            ctx.fillStyle = bulbBrightness > 0.1 ? `rgba(250, 204, 21, ${0.3 + bulbBrightness * 0.7})` : '#fef9c3';
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(bulbX, bulbY - 15, 18, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Filament
            ctx.strokeStyle = bulbBrightness > 0.1 ? '#f59e0b' : '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bulbX - 8, bulbY + 5);
            ctx.lineTo(bulbX - 4, bulbY - 15);
            ctx.lineTo(bulbX + 4, bulbY - 5);
            ctx.lineTo(bulbX + 8, bulbY - 20);
            ctx.stroke();

            // Base
            ctx.fillStyle = '#475569';
            ctx.fillRect(bulbX - 12, bulbY + 8, 24, 15);

            ctx.fillStyle = '#0f172a';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Bulb', bulbX, bulbY + 40);

            // --- Draw Field Lines (if toggled) ---
            if (showFieldLines) {
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 4]);

                for (let i = -2; i <= 2; i++) {
                    const y = centerY + i * 25;
                    ctx.beginPath();
                    // Lines from magnet N pole
                    ctx.moveTo(magnetX + 120, y);
                    // Curve through coil
                    ctx.bezierCurveTo(
                        magnetX + 200, y,
                        COIL_CENTER_X - 50, y + i * 10,
                        COIL_CENTER_X + 100, y
                    );
                    ctx.stroke();
                }
                ctx.setLineDash([]);

                // Flux highlight inside coil
                if (flux > 0) {
                    ctx.fillStyle = `rgba(250, 204, 21, ${flux * 0.4})`;
                    ctx.fillRect(COIL_LEFT + 10, centerY - 45, COIL_RIGHT - COIL_LEFT - 20, 90);
                }
            }

            // --- Draw Bar Magnet ---
            const magnetY = centerY - 25;
            const magnetH = 50;
            const magnetW = 120;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(magnetX + 4, magnetY + 4, magnetW, magnetH);

            // North pole (Red)
            const nGrad = ctx.createLinearGradient(magnetX, magnetY, magnetX, magnetY + magnetH);
            nGrad.addColorStop(0, '#fca5a5');
            nGrad.addColorStop(0.5, '#ef4444');
            nGrad.addColorStop(1, '#b91c1c');
            ctx.fillStyle = nGrad;
            ctx.fillRect(magnetX + magnetW / 2, magnetY, magnetW / 2, magnetH);

            // South pole (Blue)
            const sGrad = ctx.createLinearGradient(magnetX, magnetY, magnetX, magnetY + magnetH);
            sGrad.addColorStop(0, '#93c5fd');
            sGrad.addColorStop(0.5, '#3b82f6');
            sGrad.addColorStop(1, '#1d4ed8');
            ctx.fillStyle = sGrad;
            ctx.fillRect(magnetX, magnetY, magnetW / 2, magnetH);

            // Labels
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('S', magnetX + magnetW / 4, centerY + 7);
            ctx.fillText('N', magnetX + (3 * magnetW) / 4, centerY + 7);

            // Drag hint
            if (!isDragging && magnetX < 200) {
                ctx.fillStyle = '#64748b';
                ctx.font = '12px sans-serif';
                ctx.fillText('← Drag magnet →', magnetX + magnetW / 2, magnetY - 15);
            }

            // --- Status Labels ---
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('P-Type', 20, 30);

            // Velocity indicator
            const velText = magnetVelocity === 0 ? 'Stationary (v=0)' :
                magnetVelocity > 0 ? `Moving Right (v > 0)` : `Moving Left (v < 0)`;
            ctx.fillStyle = magnetVelocity === 0 ? '#64748b' : magnetVelocity > 0 ? '#16a34a' : '#dc2626';
            ctx.fillText(velText, 20, 55);
        };

        const renderACGeneratorMode = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            const centerX = w / 2;
            const centerY = h / 2 - 30;

            // Update coil angle
            setCoilAngle(prev => prev + angularSpeed * 0.005);

            // Calculate flux and EMF
            const flux = Math.cos(coilAngle);
            const emf = Math.sin(coilAngle);

            // Store history for graphs
            fluxHistory.current.push(flux);
            emfHistory.current.push(emf);
            if (fluxHistory.current.length > 200) {
                fluxHistory.current.shift();
                emfHistory.current.shift();
            }

            // Background
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(0, 0, w, h);

            // --- Draw Stator Magnets ---
            const poleWidth = 50;
            const poleHeight = 180;
            const gap = 180;

            // North Pole (Left)
            const nGrad = ctx.createLinearGradient(centerX - gap / 2 - poleWidth, 0, centerX - gap / 2, 0);
            nGrad.addColorStop(0, '#fca5a5');
            nGrad.addColorStop(1, '#ef4444');
            ctx.fillStyle = nGrad;
            ctx.beginPath();
            ctx.moveTo(centerX - gap / 2 - poleWidth, centerY - poleHeight / 2);
            ctx.quadraticCurveTo(centerX - gap / 2 + 20, centerY, centerX - gap / 2 - poleWidth, centerY + poleHeight / 2);
            ctx.lineTo(centerX - gap / 2 - poleWidth - 30, centerY + poleHeight / 2);
            ctx.lineTo(centerX - gap / 2 - poleWidth - 30, centerY - poleHeight / 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('N', centerX - gap / 2 - poleWidth - 10, centerY + 10);

            // South Pole (Right)
            const sGrad = ctx.createLinearGradient(centerX + gap / 2, 0, centerX + gap / 2 + poleWidth, 0);
            sGrad.addColorStop(0, '#3b82f6');
            sGrad.addColorStop(1, '#93c5fd');
            ctx.fillStyle = sGrad;
            ctx.beginPath();
            ctx.moveTo(centerX + gap / 2 + poleWidth, centerY - poleHeight / 2);
            ctx.quadraticCurveTo(centerX + gap / 2 - 20, centerY, centerX + gap / 2 + poleWidth, centerY + poleHeight / 2);
            ctx.lineTo(centerX + gap / 2 + poleWidth + 30, centerY + poleHeight / 2);
            ctx.lineTo(centerX + gap / 2 + poleWidth + 30, centerY - poleHeight / 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.fillText('S', centerX + gap / 2 + poleWidth + 10, centerY + 10);

            // --- Draw B-Field Arrows ---
            if (showFieldLines) {
                ctx.strokeStyle = '#3b82f6';
                ctx.fillStyle = '#3b82f6';
                ctx.lineWidth = 2;

                for (let i = -2; i <= 2; i++) {
                    const y = centerY + i * 35;
                    ctx.beginPath();
                    ctx.moveTo(centerX - gap / 2, y);
                    ctx.lineTo(centerX + gap / 2 - 20, y);
                    ctx.stroke();

                    // Arrow head
                    ctx.beginPath();
                    ctx.moveTo(centerX + gap / 2 - 10, y);
                    ctx.lineTo(centerX + gap / 2 - 25, y - 6);
                    ctx.lineTo(centerX + gap / 2 - 25, y + 6);
                    ctx.closePath();
                    ctx.fill();
                }

                ctx.font = 'bold 14px sans-serif';
                ctx.fillText('B', centerX, centerY - 80);
            }

            // --- Draw Rotating Coil ---
            const coilW = 100;
            const coilH = 120;
            const cosA = Math.cos(coilAngle);

            // 3D effect - compress width based on rotation
            const projectedW = coilW * Math.abs(cosA);

            // Coil rectangle
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 8;
            ctx.strokeRect(centerX - projectedW / 2, centerY - coilH / 2, projectedW, coilH);

            // Area vector (red arrow, perpendicular to coil)
            if (showFieldLines) {
                const aVecLen = 60;
                const aVecX = centerX + aVecLen * cosA;
                const aVecY = centerY;

                ctx.strokeStyle = '#dc2626';
                ctx.fillStyle = '#dc2626';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(aVecX, aVecY);
                ctx.stroke();

                // Arrow head
                const angle = cosA >= 0 ? 0 : Math.PI;
                ctx.save();
                ctx.translate(aVecX, aVecY);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-5, -6);
                ctx.lineTo(-5, 6);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                ctx.font = 'bold 14px sans-serif';
                ctx.fillText('A', aVecX + (cosA >= 0 ? 15 : -15), aVecY);
            }

            // --- Slip Rings & Brushes ---
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(centerX - 15, centerY + coilH / 2, 30, 20);

            ctx.fillStyle = '#475569';
            ctx.fillRect(centerX - 25, centerY + coilH / 2 + 18, 10, 25);
            ctx.fillRect(centerX + 15, centerY + coilH / 2 + 18, 10, 25);

            // Wires to lamp
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX - 20, centerY + coilH / 2 + 40);
            ctx.lineTo(centerX - 20, h - 40);
            ctx.lineTo(centerX + 60, h - 40);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(centerX + 20, centerY + coilH / 2 + 40);
            ctx.lineTo(centerX + 20, h - 60);
            ctx.lineTo(centerX + 100, h - 60);
            ctx.lineTo(centerX + 100, h - 40);
            ctx.stroke();

            // --- Lamp ---
            const lampX = centerX + 80;
            const lampY = h - 40;
            const brightness = Math.abs(emf);

            // Glow
            if (brightness > 0.1) {
                const glow = ctx.createRadialGradient(lampX, lampY - 15, 0, lampX, lampY - 15, 40 * brightness);
                glow.addColorStop(0, `rgba(250, 204, 21, ${brightness})`);
                glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(lampX, lampY - 15, 40, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = brightness > 0.1 ? `rgba(250, 204, 21, ${0.3 + brightness * 0.7})` : '#fef9c3';
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(lampX, lampY - 15, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // --- State Indicator ---
            const stateText = Math.abs(cosA) > 0.95 ? 'Coil Vertical: Φ=MAX, ε=0' :
                Math.abs(cosA) < 0.1 ? 'Coil Horizontal: Φ=0, ε=MAX' :
                    'Rotating...';
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(stateText, centerX, 25);
        };

        const renderGraphs = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.clearRect(0, 0, w, h);

            // Background
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, w, h);

            const graphH = h / 2 - 15;
            const padding = 40;

            // --- Flux Graph (Top) ---
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Φ = BA cos(ωt)', 10, 15);

            // Axis
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, graphH / 2 + 10);
            ctx.lineTo(w - 10, graphH / 2 + 10);
            ctx.stroke();

            // Plot flux
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            fluxHistory.current.forEach((val, i) => {
                const x = padding + (i / 200) * (w - padding - 10);
                const y = graphH / 2 + 10 - val * (graphH / 2 - 10);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // --- EMF Graph (Bottom) ---
            const offsetY = graphH + 20;
            ctx.fillStyle = '#0f172a';
            ctx.fillText('ε = ε₀ sin(ωt)', 10, offsetY + 5);

            // Axis
            ctx.strokeStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(padding, offsetY + graphH / 2);
            ctx.lineTo(w - 10, offsetY + graphH / 2);
            ctx.stroke();

            // Plot EMF
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            emfHistory.current.forEach((val, i) => {
                const x = padding + (i / 200) * (w - padding - 10);
                const y = offsetY + graphH / 2 - val * (graphH / 2 - 10);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Labels
            ctx.fillStyle = '#8b5cf6';
            ctx.fillText('Flux', w - 35, 15);
            ctx.fillStyle = '#f59e0b';
            ctx.fillText('EMF', w - 35, offsetY + 5);
        };

        render();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, mode, magnetX, magnetVelocity, showFieldLines, angularSpeed, coilAngle, galvanometerAngle, bulbBrightness]);

    return (
        <div className="relative w-full h-full flex flex-col bg-slate-900 overflow-hidden">
            {/* Top Control Bar */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    {/* Mode Tabs */}
                    <button
                        onClick={() => { setMode('faraday'); handleReset(); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${mode === 'faraday'
                            ? 'bg-white text-amber-700'
                            : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                    >
                        <Zap size={14} className="inline mr-1" />
                        Magnet & Coil
                    </button>
                    <button
                        onClick={() => { setMode('acgenerator'); handleReset(); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${mode === 'acgenerator'
                            ? 'bg-white text-amber-700'
                            : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                    >
                        <Activity size={14} className="inline mr-1" />
                        AC Generator
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white"
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button
                        onClick={() => setShowFieldLines(!showFieldLines)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${showFieldLines ? 'bg-blue-500 text-white' : 'bg-white/20 text-white'
                            }`}
                    >
                        {showFieldLines ? <Eye size={14} /> : <EyeOff size={14} />}
                        Field Lines
                    </button>
                    <button
                        onClick={() => setShowAnalogy(!showAnalogy)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 rounded-full text-yellow-900 text-xs font-bold"
                    >
                        <HelpCircle size={14} />
                        Analogy
                    </button>
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative min-h-0">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={mode === 'acgenerator' ? 320 : 400}
                    className="w-full bg-white"
                    style={{ height: mode === 'acgenerator' ? '65%' : '100%' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />

                {/* Graph Panel for AC Generator */}
                {mode === 'acgenerator' && (
                    <div className="h-[35%] bg-slate-50 border-t border-slate-300">
                        <canvas
                            ref={graphCanvasRef}
                            width={800}
                            height={150}
                            className="w-full h-full"
                        />
                    </div>
                )}

                {/* Analogy Popup */}
                {showAnalogy && (
                    <div className="absolute inset-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 overflow-y-auto z-20">
                        <button onClick={() => setShowAnalogy(false)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                        {mode === 'faraday' ? (
                            <>
                                <h4 className="font-bold text-xl text-amber-600 mb-4 flex items-center gap-2">
                                    <HelpCircle size={20} /> The Reluctant Roommate
                                </h4>
                                <div className="text-sm text-slate-700 space-y-3">
                                    <p><strong>Nature hates change!</strong> Imagine a roommate who hates changing temperatures:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>If you <strong>open the window</strong> (magnet enters), they rush to <strong>turn on the heater</strong> (current pushes back).</li>
                                        <li>If you <strong>close the window</strong> (magnet leaves), they rush to <strong>turn on the AC</strong>.</li>
                                        <li>If the window <strong>stays still</strong> (stationary magnet), they do <strong>nothing</strong>.</li>
                                    </ul>
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-4">
                                        <strong className="text-amber-800">Key Insight:</strong>
                                        <p className="text-xs mt-1">The reaction only happens during the <em>change</em>. Faster change = stronger reaction!</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h4 className="font-bold text-xl text-amber-600 mb-4 flex items-center gap-2">
                                    <HelpCircle size={20} /> The Pedaling Cyclist
                                </h4>
                                <div className="text-sm text-slate-700 space-y-3">
                                    <p>Imagine riding a bike where the pedals pump an air bellows:</p>
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>As you <strong>pedal</strong> (mechanical energy), your feet go up and down in a circle.</li>
                                        <li>The air pressure produced isn't a steady stream; it <strong>pushes out and pulls in rhythmically</strong> (Alternating Current).</li>
                                        <li><strong>Pedaling faster</strong> (ω) creates more frequent and stronger puffs of air (Higher Frequency and Voltage).</li>
                                    </ul>
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-4">
                                        <strong className="text-amber-800">Phase Relationship:</strong>
                                        <p className="text-xs mt-1">When flux is maximum (coil vertical), EMF is zero. When flux is zero (coil horizontal), EMF is maximum!</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
                {mode === 'faraday' ? (
                    <div className="flex items-center gap-4 w-full">
                        <label className="text-white text-xs font-bold">Speed Multiplier:</label>
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.5"
                            value={speedMultiplier}
                            onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                            className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <span className="text-amber-400 font-bold text-sm w-10">{speedMultiplier}x</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 w-full">
                        <label className="text-white text-xs font-bold">Angular Speed (ω):</label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="0.5"
                            value={angularSpeed}
                            onChange={(e) => setAngularSpeed(Number(e.target.value))}
                            className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <span className="text-amber-400 font-bold text-sm w-20">{angularSpeed} rad/s</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ElectromagneticInductionCanvas;
