import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCcw, Divide, Sparkles, Flame, HelpCircle } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props {
    topic: Topic;
    onExit: () => void;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    compartment: 'left' | 'right';
}

const propertyStyles = {
    volume: { color: '#ef4444', labelColor: 'text-red-400', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
    mass: { color: '#f97316', labelColor: 'text-orange-400', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)' },
    moles: { color: '#eab308', labelColor: 'text-yellow-400', bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)' },
    energy: { color: '#a855f7', labelColor: 'text-purple-400', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)' },
    temperature: { color: '#3b82f6', labelColor: 'text-blue-400', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
    pressure: { color: '#10b981', labelColor: 'text-emerald-400', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' },
    density: { color: '#14b8a6', labelColor: 'text-teal-400', bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.3)' },
    molarVolume: { color: '#c084fc', labelColor: 'text-fuchsia-400', bg: 'rgba(192, 132, 252, 0.1)', border: 'rgba(192, 132, 252, 0.3)' }
};

const ExtensiveIntensivePropertiesLab: React.FC<Props> = ({ topic, onExit }) => {
    const [partitioned, setPartitioned] = useState(false);
    const [moles, setMoles] = useState(4);        // n in mol (range 1–8)
    const [temperature, setTemperature] = useState(300); // T in Kelvin (range 200–600)
    const [selectedSubsystem, setSelectedSubsystem] = useState<'FULL' | 'LEFT' | 'RIGHT'>('FULL');
    const [showMolarDerivation, setShowMolarDerivation] = useState(false);
    const [systemMessage, setSystemMessage] = useState('Observe the initial state. All properties are at their baseline values.');

    const R = 8.314;   // J/(mol·K)
    const M = 28;      // molar mass g/mol (N₂)
    const baseVolume = 100; // L

    // Canvas references
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const partitionProgressRef = useRef<number>(0);
    const pumpAnimationRef = useRef<number>(0);
    const particlesToInjectRef = useRef<number>(0);

    // Coordinate definitions for drawing
    const xMin = 100;
    const xMax = 420;
    const yMin = 40;
    const yMax = 260;
    const xMid = 260;

    // Reset subsystem selection when partition is removed
    useEffect(() => {
        if (!partitioned) {
            setSelectedSubsystem('FULL');
        } else if (selectedSubsystem === 'FULL') {
            setSelectedSubsystem('LEFT');
        }
    }, [partitioned, selectedSubsystem]);

    // Effective system values based on subsystem selected
    const systemVolume = selectedSubsystem === 'FULL' ? baseVolume : baseVolume / 2;
    const systemMoles = selectedSubsystem === 'FULL' ? moles : moles / 2;
    const systemMass = systemMoles * M;

    // Derived properties
    const pressure = (systemMoles * R * temperature) / systemVolume; // in kPa
    const density = systemMass / systemVolume; // g/L
    const internalEnergy = systemMoles * 1.5 * R * temperature; // J
    const molarVolume = systemVolume / systemMoles; // L/mol

    const handlePartition = () => {
        const next = !partitioned;
        setPartitioned(next);
        setShowMolarDerivation(false);
        if (next) {
            setSelectedSubsystem('LEFT');
            setSystemMessage('Partition inserted! Note that Extensive properties (Volume, Mass, Moles, Internal Energy) are halved. Intensive properties remain unchanged — they are size-independent.');
        } else {
            setSelectedSubsystem('FULL');
            setSystemMessage('Partition removed. The system is whole again. Observe how extensive properties restored to full values.');
        }
    };

    const handleMolesChange = (newMoles: number) => {
        if (partitioned) {
            setPartitioned(false);
        }
        setShowMolarDerivation(false);

        if (newMoles > moles) {
            // Trigger pump handle animation
            pumpAnimationRef.current = 1.0;
            // Queue particles to inject
            const diff = (newMoles - moles) * 8;
            particlesToInjectRef.current += diff;
            setSystemMessage('Gas pumped in! Total Mass, Moles, and Internal Energy increase. Density and Pressure also increase, but Temperature remains constant.');
        } else {
            // Remove particles instantly
            const diff = (moles - newMoles) * 8;
            particlesRef.current.splice(0, diff);
            setSystemMessage('Gas removed. Extensive properties decrease. Observe how pressure and density decrease proportionally.');
        }
        setMoles(newMoles);
    };

    const handleTemperatureChange = (newTemp: number) => {
        setTemperature(newTemp);
        if (newTemp > 300) {
            setSystemMessage('Burner heating the gas! Molecules speed up (higher kinetic energy). Temperature and Pressure increase. Density and Volume remain unchanged.');
        } else if (newTemp < 300) {
            setSystemMessage('Cooling the gas! Molecules slow down (lower kinetic energy). Temperature and Pressure decrease.');
        } else {
            setSystemMessage('Temperature set back to standard room temperature (300 K).');
        }
    };

    const handleReset = () => {
        setPartitioned(false);
        setMoles(4);
        setTemperature(300);
        setSelectedSubsystem('FULL');
        setShowMolarDerivation(false);
        particlesRef.current = [];
        particlesToInjectRef.current = 0;
        pumpAnimationRef.current = 0;
        setSystemMessage('System reset to baseline state.');
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!partitioned || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        // Scale mouse coords to canvas internal coordinate system (500x300)
        const scaleX = 500 / rect.width;
        const scaleY = 300 / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Check if inside container
        if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
            if (x < xMid) {
                setSelectedSubsystem('LEFT');
                setSystemMessage('Inspecting LEFT compartment: Volume, mass, moles, and internal energy are halved. Temperature, pressure, and density are identical to the full system.');
            } else {
                setSelectedSubsystem('RIGHT');
                setSystemMessage('Inspecting RIGHT compartment: Note that all intensive parameters match the left compartment exactly.');
            }
        }
    };

    // Canvas rendering loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;

        let animationFrameId: number;

        // Initialize particles if empty
        if (particlesRef.current.length === 0) {
            const count = moles * 8;
            const initialParticles: Particle[] = [];
            for (let i = 0; i < count; i++) {
                const isLeft = Math.random() < 0.5;
                const pxMin = xMin + 12;
                const pxMax = xMax - 12;
                const pxMid = xMid;
                const x = isLeft
                    ? pxMin + Math.random() * (pxMid - pxMin - 12)
                    : pxMid + 12 + Math.random() * (pxMax - pxMid - 12);
                const y = yMin + 12 + Math.random() * (yMax - yMin - 24);

                const speed = Math.sqrt(temperature) * 0.12;
                const angle = Math.random() * 2 * Math.PI;
                initialParticles.push({
                    id: i,
                    x,
                    y,
                    vx: speed * Math.cos(angle),
                    vy: speed * Math.sin(angle),
                    radius: 5,
                    color: '#34d399',
                    compartment: x < xMid ? 'left' : 'right'
                });
            }
            particlesRef.current = initialParticles;
        }

        const render = () => {
            const rect = canvas.getBoundingClientRect();
            const targetWidth = Math.max(500, Math.round(rect.width));
            const targetHeight = Math.max(300, Math.round(rect.height));
            const pixelWidth = Math.round(targetWidth * dpr);
            const pixelHeight = Math.round(targetHeight * dpr);

            if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
                canvas.width = pixelWidth;
                canvas.height = pixelHeight;
            }

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, targetWidth, targetHeight);
            const simulationScale = Math.min(targetWidth / 500, targetHeight / 300) * 0.86;
            ctx.save();
            ctx.translate(targetWidth / 2, targetHeight / 2);
            ctx.scale(simulationScale, simulationScale);
            ctx.translate(-250, -150);

            // Update partition progress towards state (0 = removed, 1 = inserted)
            const targetProgress = partitioned ? 1 : 0;
            const progressSpeed = 0.05;
            if (partitionProgressRef.current < targetProgress) {
                partitionProgressRef.current = Math.min(targetProgress, partitionProgressRef.current + progressSpeed);
            } else if (partitionProgressRef.current > targetProgress) {
                partitionProgressRef.current = Math.max(targetProgress, partitionProgressRef.current - progressSpeed);
            }

            const currentPartitionY = yMin + (yMax - yMin) * partitionProgressRef.current;

            // Handle pump animation cooldown
            if (pumpAnimationRef.current > 0) {
                pumpAnimationRef.current -= 0.04;
                if (pumpAnimationRef.current < 0) pumpAnimationRef.current = 0;
            }

            // Spawn queued particles
            if (particlesToInjectRef.current > 0 && Math.random() < 0.3) {
                const speed = Math.sqrt(temperature) * 0.12;
                const angle = (Math.random() - 0.5) * 0.6; // pointing right, with spreading
                particlesRef.current.push({
                    id: Date.now() + Math.random(),
                    x: xMin + 6,
                    y: 150,
                    vx: speed * Math.cos(angle),
                    vy: speed * Math.sin(angle),
                    radius: 5,
                    color: '#34d399',
                    compartment: 'left'
                });
                particlesToInjectRef.current--;
            }

            // Update positions & handle collisions
            const speedMultiplier = Math.sqrt(temperature) * 0.12;
            particlesRef.current.forEach(p => {
                const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (Math.abs(currentSpeed - speedMultiplier) > 0.01 && currentSpeed > 0) {
                    p.vx = (p.vx / currentSpeed) * speedMultiplier;
                    p.vy = (p.vy / currentSpeed) * speedMultiplier;
                }

                p.x += p.vx;
                p.y += p.vy;

                // Y collision
                if (p.y < yMin + p.radius) {
                    p.y = yMin + p.radius;
                    p.vy = -p.vy;
                } else if (p.y > yMax - p.radius) {
                    p.y = yMax - p.radius;
                    p.vy = -p.vy;
                }

                // X collision
                if (partitionProgressRef.current === 1) {
                    // Fully partitioned - strict confinement
                    if (!p.compartment) {
                        p.compartment = p.x < xMid ? 'left' : 'right';
                    }

                    if (p.compartment === 'left') {
                        if (p.x < xMin + p.radius) {
                            p.x = xMin + p.radius;
                            p.vx = -p.vx;
                        } else if (p.x > xMid - p.radius) {
                            p.x = xMid - p.radius;
                            p.vx = -p.vx;
                        }
                    } else {
                        if (p.x < xMid + p.radius) {
                            p.x = xMid + p.radius;
                            p.vx = -p.vx;
                        } else if (p.x > xMax - p.radius) {
                            p.x = xMax - p.radius;
                            p.vx = -p.vx;
                        }
                    }
                } else {
                    // No partition or partition sliding
                    if (p.x < xMin + p.radius) {
                        p.x = xMin + p.radius;
                        p.vx = -p.vx;
                    } else if (p.x > xMax - p.radius) {
                        p.x = xMax - p.radius;
                        p.vx = -p.vx;
                    }

                    // Sliding blade collision (if particle is in the path of the sliding partition)
                    if (partitionProgressRef.current > 0) {
                        if (p.y < currentPartitionY) {
                            const distToBlade = p.x - xMid;
                            if (Math.abs(distToBlade) < p.radius + 2) {
                                p.vx = -p.vx;
                                p.x = distToBlade < 0 ? xMid - p.radius - 2 : xMid + p.radius + 2;
                            }
                        }
                    }
                }
            });

            // --- DRAWING PIPELINE ---

            // Container background gradient
            const containerGrad = ctx.createLinearGradient(xMin, yMin, xMin, yMax);
            containerGrad.addColorStop(0, '#ffffff');
            containerGrad.addColorStop(1, '#f8fafc');
            ctx.fillStyle = containerGrad;
            ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);

            // Container grid
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
            ctx.lineWidth = 1;
            for (let x = xMin + 20; x < xMax; x += 20) {
                ctx.beginPath(); ctx.moveTo(x, yMin); ctx.lineTo(x, yMax); ctx.stroke();
            }
            for (let y = yMin + 20; y < yMax; y += 20) {
                ctx.beginPath(); ctx.moveTo(xMin, y); ctx.lineTo(xMax, y); ctx.stroke();
            }

            // Draw ice or fire burner
            drawBurner(ctx, xMin, xMax, yMax, temperature);

            // Draw thermometer
            drawThermometer(ctx, 450, yMin, yMax, temperature);

            // Draw gas pump
            drawPump(ctx, 35, 80, 220, pumpAnimationRef.current, particlesToInjectRef.current);

            // Fading excluded parts when partition is active
            if (partitionProgressRef.current === 1) {
                ctx.font = '900 12px sans-serif';
                ctx.textAlign = 'center';
                if (selectedSubsystem === 'LEFT') {
                    ctx.fillStyle = 'rgba(226, 232, 240, 0.78)';
                    ctx.fillRect(xMid + 2, yMin + 2, xMax - xMid - 4, yMax - yMin - 4);
                    ctx.fillStyle = 'rgba(71, 85, 105, 0.72)';
                    ctx.fillText('EXCLUDED COMPARTMENT', xMid + (xMax - xMid)/2, yMin + (yMax - yMin)/2);
                } else if (selectedSubsystem === 'RIGHT') {
                    ctx.fillStyle = 'rgba(226, 232, 240, 0.78)';
                    ctx.fillRect(xMin + 2, yMin + 2, xMid - xMin - 4, yMax - yMin - 4);
                    ctx.fillStyle = 'rgba(71, 85, 105, 0.72)';
                    ctx.fillText('EXCLUDED COMPARTMENT', xMin + (xMid - xMin)/2, yMin + (yMax - yMin)/2);
                }
            }

            // Draw particles
            particlesRef.current.forEach(p => {
                let opacity = 0.85;
                if (partitionProgressRef.current === 1) {
                    if (selectedSubsystem === 'LEFT' && p.compartment === 'right') opacity = 0.12;
                    else if (selectedSubsystem === 'RIGHT' && p.compartment === 'left') opacity = 0.12;
                }

                ctx.beginPath();
                const radGrad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.radius * 1.6);
                radGrad.addColorStop(0, '#ecfeff');
                radGrad.addColorStop(0.35, `rgba(20, 184, 166, ${opacity})`);
                radGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
                ctx.fillStyle = radGrad;
                ctx.arc(p.x, p.y, p.radius * 1.6, 0, Math.PI * 2);
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.fillStyle = `rgba(13, 148, 136, ${opacity * 1.1})`;
                ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw partition blade
            if (partitionProgressRef.current > 0) {
                ctx.beginPath();
                const bladeGrad = ctx.createLinearGradient(xMid - 4, yMin, xMid + 4, yMin);
                bladeGrad.addColorStop(0, '#94a3b8');
                bladeGrad.addColorStop(0.5, '#f8fafc');
                bladeGrad.addColorStop(1, '#64748b');
                ctx.fillStyle = bladeGrad;
                ctx.fillRect(xMid - 3.5, yMin, 7, currentPartitionY - yMin);

                // Blade handle details
                ctx.beginPath();
                ctx.fillStyle = '#64748b';
                ctx.arc(xMid, yMin - 1, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 1;
                ctx.stroke();

                if (partitionProgressRef.current === 1) {
                    ctx.strokeStyle = 'rgba(71, 85, 105, 0.28)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(xMid, yMin);
                    ctx.lineTo(xMid, yMax);
                    ctx.stroke();
                }
            }

            // Draw container walls
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.72)';
            ctx.lineWidth = 3;
            ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);

            // Double border / highlight line
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
            ctx.lineWidth = 1;
            ctx.strokeRect(xMin - 3.5, yMin - 3.5, xMax - xMin + 7, yMax - yMin + 7);

            // Click zone highlights for classroom projection
            if (partitionProgressRef.current === 1) {
                ctx.font = 'bold 9px monospace';
                ctx.fillStyle = selectedSubsystem === 'LEFT' ? '#0f766e' : '#64748b';
                ctx.fillText('ACTIVE SYSTEM', xMin + (xMid - xMin) / 2, yMin + 20);
                
                ctx.fillStyle = selectedSubsystem === 'RIGHT' ? '#0f766e' : '#64748b';
                ctx.fillText(selectedSubsystem === 'RIGHT' ? 'ACTIVE SYSTEM' : 'CLICK TO VIEW', xMid + (xMax - xMid) / 2, yMin + 20);
            }

            ctx.restore();
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [partitioned, moles, temperature, selectedSubsystem]);

    // Drawing helpers
    const drawBurner = (ctx: CanvasRenderingContext2D, xMin: number, xMax: number, yMax: number, T: number) => {
        const burnerY = yMax + 9;
        
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(xMin + 15, burnerY);
        ctx.lineTo(xMax - 15, burnerY);
        ctx.stroke();

        if (T > 300) {
            const intensity = (T - 300) / 300;
            const flames = 14;
            const step = (xMax - xMin - 30) / (flames - 1);
            
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'; // orange outer glow
            for (let i = 0; i < flames; i++) {
                const fx = xMin + 15 + i * step;
                const h = 4 + intensity * 24 * (0.8 + Math.random() * 0.4);
                ctx.beginPath();
                ctx.moveTo(fx - 7, burnerY);
                ctx.quadraticCurveTo(fx, burnerY - h * 1.15, fx + 7, burnerY);
                ctx.fill();
            }

            ctx.fillStyle = 'rgba(245, 158, 11, 0.65)'; // yellow inner core
            for (let i = 0; i < flames; i++) {
                const fx = xMin + 15 + i * step;
                const h = 2 + intensity * 15 * (0.8 + Math.random() * 0.4);
                ctx.beginPath();
                ctx.moveTo(fx - 4, burnerY);
                ctx.quadraticCurveTo(fx, burnerY - h * 1.1, fx + 4, burnerY);
                ctx.fill();
            }
        } else if (T < 300) {
            const intensity = (300 - T) / 100;
            ctx.fillStyle = `rgba(186, 230, 253, ${0.15 + intensity * 0.35})`;
            ctx.fillRect(xMin + 2, yMax - 6 * intensity, xMax - xMin - 4, 6 * intensity);

            ctx.fillStyle = 'rgba(224, 242, 254, 0.55)';
            const shards = 7;
            const step = (xMax - xMin) / shards;
            for (let i = 0; i < shards; i++) {
                const sx = xMin + i * step + 4;
                ctx.beginPath();
                ctx.moveTo(sx, yMax);
                ctx.lineTo(sx + 6, yMax - 5 * intensity);
                ctx.lineTo(sx + 12, yMax);
                ctx.closePath();
                ctx.fill();
            }
        }
    };

    const drawThermometer = (ctx: CanvasRenderingContext2D, x: number, yMin: number, yMax: number, T: number) => {
        // Outer tube
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(x - 4, yMin, 8, yMax - yMin, 4);
        ctx.fill();
        ctx.stroke();

        // Bulb
        ctx.beginPath();
        ctx.arc(x, yMax + 4, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.stroke();

        // Mercury level
        const scaleRange = yMax - yMin - 15;
        const fraction = (T - 200) / 400;
        const height = fraction * scaleRange;
        const mercuryY = yMax - height;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(x - 1.5, mercuryY, 3, yMax - mercuryY, 1.5);
        ctx.fill();

        // Ticks
        ctx.fillStyle = '#475569';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.24)';

        const ticks = [200, 300, 400, 500, 600];
        ticks.forEach(t => {
            const tf = (t - 200) / 400;
            const ty = yMax - tf * scaleRange;
            ctx.beginPath();
            ctx.moveTo(x + 5, ty);
            ctx.lineTo(x + 9, ty);
            ctx.stroke();
            ctx.fillText(`${t}K`, x + 12, ty + 3);
        });
    };

    const drawPump = (ctx: CanvasRenderingContext2D, x: number, yMin: number, yMax: number, stroke: number, queue: number) => {
        // Cylinder
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(x - 7, yMin, 14, yMax - yMin);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 7, yMin, 14, yMax - yMin);

        // Foot plate
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 12, yMax, 24, 5);
        ctx.strokeRect(x - 12, yMax, 24, 5);

        // Piston handle
        const rodTop = yMin - 24 + stroke * 24;
        const rodBottom = yMin + stroke * (yMax - yMin - 10);

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, rodTop);
        ctx.lineTo(x, rodBottom);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 14, rodTop - 4, 28, 5);
        ctx.strokeRect(x - 14, rodTop - 4, 28, 5);

        // Connector tube
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, yMax - 8);
                    ctx.quadraticCurveTo(x + 20, yMax + 15, xMin, 150);
        ctx.stroke();

        if (queue > 0) {
            ctx.strokeStyle = 'rgba(20, 184, 166, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x, yMax - 8);
            ctx.quadraticCurveTo(x + 20, yMax + 15, xMin, 150);
            ctx.stroke();
        }
    };

    // Subsystem Tabs component
    const SubsystemTabs = () => {
        if (!partitioned) return null;
        return (
            <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 w-full max-w-lg mb-2">
                <button
                    onClick={() => {
                        setSelectedSubsystem('LEFT');
                        setSystemMessage('Inspecting LEFT compartment: Volume = 50 L, Moles = 2 mol, Mass = 56 g. Intensive properties (T, P, d) are unchanged.');
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedSubsystem === 'LEFT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Left Compartment (50 L)
                </button>
                <button
                    onClick={() => {
                        setSelectedSubsystem('RIGHT');
                        setSystemMessage('Inspecting RIGHT compartment: Note that all intensive values match the Left compartment perfectly.');
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedSubsystem === 'RIGHT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Right Compartment (50 L)
                </button>
            </div>
        );
    };

    // Meter component
    const Meter = ({ label, value, unit, propertyKey, changed, direction }: {
        label: string; value: string; unit: string; propertyKey: keyof typeof propertyStyles; changed?: boolean; direction?: 'up' | 'down' | 'same';
    }) => {
        const style = propertyStyles[propertyKey];
        return (
            <div
                className="relative rounded-2xl p-3 border-2 transition-all duration-500 flex flex-col justify-between min-h-0 h-full w-full overflow-hidden bg-white shadow-sm"
                style={{
                    backgroundColor: '#ffffff',
                    borderColor: changed ? style.color : style.border,
                    transform: 'scale(1)'
                }}
            >
                <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-start justify-between gap-2 leading-tight">
                    <span className="min-w-0 break-words pr-1">{label}</span>
                    {direction && direction !== 'same' && (
                        <span className={`shrink-0 text-[9px] font-black leading-tight ${direction === 'down' ? 'text-red-400' : 'text-green-400'}`}>
                            {direction === 'down' ? '↓ 50%' : '↑'}
                        </span>
                    )}
                    {direction === 'same' && (
                        <span className="text-[10px] font-bold text-blue-400">═ same</span>
                    )}
                </div>
                <div className="flex items-baseline gap-1 mt-1 min-w-0 whitespace-nowrap">
                    <span className="text-lg sm:text-xl font-black font-mono leading-none" style={{ color: style.color }}>{value}</span>
                    <span className="text-xs text-slate-500 font-semibold">{unit}</span>
                </div>
            </div>
        );
    };

    const extDir = partitioned && selectedSubsystem !== 'FULL' ? 'down' : undefined;
    const intDir = undefined;

    const controlsCombo = (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Partition toggle */}
            <div className="bg-white p-4 flex flex-col justify-between rounded-2xl border border-slate-200 shadow-sm">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Partition Control</label>
                <button
                    onClick={handlePartition}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        partitioned 
                            ? 'bg-red-600 border-red-700 text-white shadow-[0_8px_20px_rgba(220,38,38,0.22)] hover:bg-red-700' 
                            : 'bg-red-600 border-red-700 text-white shadow-[0_8px_20px_rgba(220,38,38,0.22)] hover:bg-red-700'
                    }`}
                >
                    <Divide size={16} />
                    {partitioned ? 'Remove Partition' : 'Insert Partition'}
                </button>
            </div>

            {/* Gas pump slider */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sm:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between mb-3">
                    <span>Gas Quantity (n)</span>
                    <span className="text-emerald-400 font-mono font-bold">{moles} mol</span>
                </label>
                <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={moles}
                    onChange={e => handleMolesChange(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-2 uppercase font-black tracking-widest">
                    <span>1 mol (vacuum)</span>
                    <span>8 mol (high mass)</span>
                </div>
            </div>

            {/* Temperature Slider */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sm:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between mb-3">
                    <span>Burner Temp (T)</span>
                    <span className="text-blue-400 font-mono font-bold">{temperature} K</span>
                </label>
                <input
                    type="range"
                    min="200"
                    max="600"
                    step="25"
                    value={temperature}
                    onChange={e => handleTemperatureChange(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-2 uppercase font-black tracking-widest">
                    <span>200 K (Ice)</span>
                    <span>300 K (Room)</span>
                    <span>600 K (Fire)</span>
                </div>
            </div>

            {/* Derive molar property */}
            <div className="bg-white p-4 flex flex-col justify-between rounded-2xl border border-slate-200 shadow-sm">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Math Relation</label>
                <button
                    onClick={() => {
                        setShowMolarDerivation(!showMolarDerivation);
                        if (!showMolarDerivation) {
                            setSystemMessage('Extensive ÷ Extensive = Intensive! Molar Volume (Vm = V/n) and Density (d = m/V) are size-independent intensive parameters.');
                        }
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        showMolarDerivation 
                            ? 'bg-purple-600 border-purple-700 text-white shadow-[0_8px_20px_rgba(147,51,234,0.2)] hover:bg-purple-700' 
                            : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                >
                    <Sparkles size={14} />
                    Vm = V ÷ n
                </button>
            </div>

            {/* Reset */}
            <div className="bg-white p-4 flex flex-col justify-between rounded-2xl border border-slate-200 shadow-sm">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Controls Reset</label>
                <button
                    onClick={handleReset}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-black text-slate-700 transition-colors cursor-pointer"
                >
                    <RefreshCcw size={14} />
                    Reset
                </button>
            </div>
        </div>
    );

    const simulationCombo = (
        <div className="w-full h-full flex flex-col items-center justify-start p-1 sm:p-2 gap-3 relative bg-transparent overflow-hidden min-h-0">
            {/* Grid background */}
            <div className="absolute inset-0 transition-opacity duration-1000 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)'
            }} />

            {/* Subsystem tabs (Only visible when partitioned) */}
            <SubsystemTabs />

            {/* Main Interactive Screen layout */}
            <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-3 z-10 min-h-0 flex-1">
                
                {/* ---- LEFT PANEL: EXTENSIVE PROPERTIES ---- */}
                <div className="lg:flex-[0.75] flex flex-col gap-2 min-h-0">
                    <div className="text-xs font-black text-red-500 uppercase tracking-widest text-center py-2 rounded-xl bg-white border border-red-200 shadow-sm flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        Extensive Properties
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-4 gap-2 flex-1 min-h-0">
                        <Meter label="Volume (V)" value={`${systemVolume.toFixed(1)}`} unit="L" propertyKey="volume" changed={partitioned} direction={extDir} />
                        <Meter label="Mass (m)" value={`${systemMass.toFixed(1)}`} unit="g" propertyKey="mass" changed={partitioned} direction={extDir} />
                        <Meter label="Moles (n)" value={`${systemMoles.toFixed(1)}`} unit="mol" propertyKey="moles" changed={partitioned} direction={extDir} />
                        <Meter label="Internal Energy (U)" value={`${(internalEnergy / 1000).toFixed(2)}`} unit="kJ" propertyKey="energy" changed={partitioned} direction={extDir} />
                    </div>
                </div>

                {/* ---- CENTER: CANVAS CONTAINER ---- */}
                <div className="lg:flex-[4.2] flex flex-col items-center justify-start gap-3 min-h-0">
                    {/* Glass box wrapper */}
                    <div className="relative w-full aspect-[5/3] rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-200">
                        <canvas
                            ref={canvasRef}
                            onClick={handleCanvasClick}
                            className={`w-full h-full block ${partitioned ? 'cursor-pointer' : ''}`}
                        />
                        
                        {/* Interactive floating label inside box */}
                        {partitioned && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-[10px] text-yellow-300 font-extrabold uppercase px-3 py-1 rounded-full border border-yellow-500/20 flex items-center gap-1.5 shadow-lg pointer-events-none">
                                <HelpCircle size={12} />
                                Click a compartment to view properties
                            </div>
                        )}
                    </div>

                    {/* Molar derivation panel */}
                    {showMolarDerivation && (
                        <div className="w-full p-4 bg-purple-950/20 rounded-2xl border border-purple-500/20 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-[10px] text-purple-300 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Sparkles size={14} />
                                Molar Property Ratio (Extensive ÷ Extensive = Intensive)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 font-mono text-xs text-left">
                                    <div className="text-slate-400 font-bold mb-1 text-[9px] uppercase">Molar Volume:</div>
                                    <span className="text-purple-300 font-bold">Vm = V / n</span> = {systemVolume.toFixed(1)} L / {systemMoles.toFixed(1)} mol = <span className="text-purple-400 font-black">{molarVolume.toFixed(2)} L/mol</span>
                                </div>
                                <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 font-mono text-xs text-left">
                                    <div className="text-slate-400 font-bold mb-1 text-[9px] uppercase">Density (Ratio of Mass & Vol):</div>
                                    <span className="text-teal-300 font-bold">d = m / V</span> = {systemMass.toFixed(1)} g / {systemVolume.toFixed(1)} L = <span className="text-teal-400 font-black">{density.toFixed(3)} g/L</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ---- RIGHT PANEL: INTENSIVE PROPERTIES ---- */}
                <div className="lg:flex-[0.75] flex flex-col gap-2 min-h-0">
                    <div className="text-xs font-black text-blue-500 uppercase tracking-widest text-center py-2 rounded-xl bg-white border border-blue-200 shadow-sm flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        Intensive Properties
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-4 gap-2 flex-1 min-h-0">
                        <Meter label="Temperature (T)" value={`${temperature}`} unit="K" propertyKey="temperature" changed={partitioned} direction={intDir} />
                        <Meter label="Pressure (p)" value={`${(pressure).toFixed(2)}`} unit="kPa" propertyKey="pressure" changed={partitioned} direction={intDir} />
                        <Meter label="Density (d)" value={`${density.toFixed(3)}`} unit="g/L" propertyKey="density" changed={partitioned} direction={intDir} />
                        <Meter label="Molar Volume (Vₘ)" value={`${molarVolume.toFixed(2)}`} unit="L/mol" propertyKey="molarVolume" changed={partitioned} direction={intDir} />
                    </div>
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
            simulationStageWidth={900}
            simulationStageHeight={430}
        />
    );
};

export default ExtensiveIntensivePropertiesLab;
