import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, Zap, X } from 'lucide-react';

// Energy level calculations (eV) based on E_n = -13.6 / n^2
const calculateEnergy = (n: number) => -13.6 / (n * n);

// Calculate wavelength in nm: lambda = hc / Delta E
// hc approx 1240 eV nm
const calculateWavelength = (deltaE: number) => Math.abs(1240 / deltaE);

// Determine color based on wavelength
const getWavelengthColor = (lambda: number) => {
    if (lambda < 400) return '#a855f7'; // Purple/UV
    if (lambda >= 400 && lambda < 440) return '#8b5cf6'; // Violet
    if (lambda >= 440 && lambda < 490) return '#3b82f6'; // Blue
    if (lambda >= 490 && lambda < 510) return '#06b6d4'; // Cyan
    if (lambda >= 510 && lambda < 580) return '#22c55e'; // Green
    if (lambda >= 580 && lambda < 600) return '#eab308'; // Yellow
    if (lambda >= 600 && lambda < 650) return '#f97316'; // Orange
    if (lambda >= 650 && lambda <= 750) return '#ef4444'; // Red
    return '#94a3b8'; // Infrared/Gray
};

const getSeriesName = (finalN: number) => {
    switch (finalN) {
        case 1: return 'Lyman Series (UV)';
        case 2: return 'Balmer Series (Visible)';
        case 3: return 'Paschen Series (IR)';
        case 4: return 'Brackett Series (IR)';
        case 5: return 'Pfund Series (IR)';
        default: return 'Infrared';
    }
};

interface SpectralLine {
    id: number;
    wavelength: number;
    color: string;
    series: string;
    initialN: number;
    finalN: number;
}

const HydrogenSpectrumLab: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentN, setCurrentN] = useState<number>(1);
    const [targetEnergy, setTargetEnergy] = useState<string>('');
    const [spectralLines, setSpectralLines] = useState<SpectralLine[]>([]);
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);

    // Radii for orbits (Bohr model r_n propto n^2, but we scale it non-linearly for UI)
    const maxN = 6;
    const getOrbitRadius = (n: number, maxRadius: number) => {
        // scale to fit visually
        return (maxRadius * Math.pow(n, 1.2)) / Math.pow(maxN, 1.2);
    };

    const drawModel = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // We don't want to clear the whole canvas if we're just drawing over it every frame, but we have to.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.9;

        // Draw Nucleus
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#facc15'; // yellow nucleus
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#facc15';
        ctx.closePath();
        ctx.shadowBlur = 0;

        // Draw Orbits
        for (let n = 1; n <= maxN; n++) {
            const radius = getOrbitRadius(n, maxRadius);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = n === currentN ? '#38bdf8' : '#334155';
            ctx.lineWidth = n === currentN ? 2 : 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.closePath();

            // Label
            if (n === 1 || n === maxN || n === currentN) {
                ctx.fillStyle = n === currentN ? '#38bdf8' : '#64748b';
                ctx.font = '12px monospace';
                ctx.fillText(`n=${n}`, centerX + radius + 4, centerY);
            }
        }
        ctx.setLineDash([]); // reset

        // Draw Electron
        const electronRadius = getOrbitRadius(currentN, maxRadius);
        const time = Date.now() / 1000;
        const angle = time * (3 / currentN); // slower rotation for higher orbits
        const electronX = centerX + electronRadius * Math.cos(angle);
        const electronY = centerY + electronRadius * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(electronX, electronY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#38bdf8';
        ctx.closePath();
        ctx.shadowBlur = 0;
    };

    useEffect(() => {
        let animationFrameId: number;
        const render = () => {
            drawModel();
            animationFrameId = requestAnimationFrame(render);
        };
        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [currentN]);

    // Make sure canvas size is responsive
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                const parent = canvasRef.current.parentElement;
                if (parent) {
                    canvasRef.current.width = parent.clientWidth;
                    canvasRef.current.height = parent.clientHeight;
                }
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleFirePhoton = () => {
        if (isAnimating) return;

        const energyInput = parseFloat(targetEnergy);
        if (isNaN(energyInput) || energyInput <= 0) {
            showAlert("Please enter a valid positive energy value in eV.");
            return;
        }

        const currentE = calculateEnergy(currentN);
        let matchedN = -1;

        // Look for a higher energy level that exactly matches currentE + energyInput
        for (let n = currentN + 1; n <= maxN; n++) {
            const possibleE = calculateEnergy(n);
            const diff = possibleE - currentE;
            // Allow a small floating-point margin of error (0.05 eV)
            if (Math.abs(diff - energyInput) < 0.05) {
                matchedN = n;
                break;
            }
        }

        if (matchedN !== -1) {
            // Success! Electron jumps up
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentN(matchedN);
                setTargetEnergy('');
                setIsAnimating(false);
            }, 500); // UI feedback delay
        } else {
            // Missed quantization
            showAlert(`A photon with ${energyInput} eV passes straight through. It doesn't match an exact energy gap!`);
        }
    };

    const handleDeexcite = (targetN: number) => {
        if (isAnimating || targetN >= currentN) return;

        setIsAnimating(true);
        const initialE = calculateEnergy(currentN);
        const finalE = calculateEnergy(targetN);
        const deltaE = initialE - finalE;
        const wavelength = calculateWavelength(deltaE);
        const color = getWavelengthColor(wavelength);

        const newLine: SpectralLine = {
            id: Date.now(),
            wavelength: Math.round(wavelength),
            color,
            series: getSeriesName(targetN),
            initialN: currentN,
            finalN: targetN
        };

        setTimeout(() => {
            setSpectralLines(prev => [...prev, newLine]);
            setCurrentN(targetN);
            setIsAnimating(false);
        }, 500);
    };

    const showAlert = (msg: string) => {
        setAlertMessage(msg);
        setIsAlertVisible(true);
        setTimeout(() => setIsAlertVisible(false), 4000);
    };

    const clearSpectrum = () => setSpectralLines([]);

    return (
        <div className="w-full flex-1 flex flex-col h-full bg-slate-900 text-slate-200 font-sans relative overflow-hidden">

            {isAlertVisible && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-xl backdrop-blur flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <Zap size={20} />
                    <span className="font-semibold text-sm">{alertMessage}</span>
                </div>
            )}

            {/* Split Screen Layout */}
            <div className="flex flex-1 min-h-[400px]">
                {/* Left Side: Controls & Data HUD */}
                <div className="w-1/3 bg-slate-800 border-r border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto">

                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-brand-primary font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                            Current State
                        </h3>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm text-slate-400">Position</p>
                                <p className="text-3xl font-mono font-bold text-white">n={currentN}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-400">Energy (eV)</p>
                                <p className="text-xl font-mono text-emerald-400">{calculateEnergy(currentN).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Photon Blaster */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-3">
                            Photon Blaster (Absorption)
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Fire exact energy packets to excite the electron. Try standard gaps like 10.2 eV (n=1→2) or 12.09 eV (n=1→3).
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Energy (eV)"
                                value={targetEnergy}
                                onChange={(e) => setTargetEnergy(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                            <button
                                onClick={handleFirePhoton}
                                disabled={isAnimating || currentN === maxN}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title={currentN === maxN ? "At max energy" : ""}
                            >
                                FIRE
                            </button>
                        </div>
                    </div>

                    {/* De-excitation Controls */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex-1">
                        <h3 className="text-brand-secondary font-bold text-sm uppercase tracking-wider mb-3">
                            De-Excitation (Emission)
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Drop the electron to a lower level to emit a photon.
                        </p>
                        <div className="flex flex-col gap-2">
                            {[...Array(maxN - 1)].map((_, i) => {
                                const targetN = i + 1;
                                if (targetN >= currentN) return null;
                                const dropE = Math.abs(calculateEnergy(currentN) - calculateEnergy(targetN)).toFixed(2);
                                return (
                                    <button
                                        key={targetN}
                                        onClick={() => handleDeexcite(targetN)}
                                        disabled={isAnimating}
                                        className="flex justify-between items-center group bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-lg border border-slate-600 transition-all font-mono text-sm"
                                    >
                                        <span className="flex items-center gap-2 text-slate-300">
                                            n={currentN} <ArrowDown size={14} className="group-hover:text-brand-secondary" /> n={targetN}
                                        </span>
                                        <span className="text-emerald-400">+{dropE} eV</span>
                                    </button>
                                );
                            })}
                            {currentN === 1 && (
                                <p className="text-sm text-slate-500 text-center py-4 italic">Electron is in ground state (stable).</p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Side: Atomic Canvas */}
                <div className="w-2/3 relative bg-black flex-1">
                    {/* Faint grid background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block"
                    />
                </div>
            </div>

            {/* Spectrometer Console */}
            <div className="bg-black border-t-2 border-slate-700 h-32 flex flex-col relative shrink-0">
                <div className="absolute top-2 right-4 z-10">
                    <button
                        onClick={clearSpectrum}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded border border-slate-600 shadow-sm"
                    >
                        Clear Spectrum
                    </button>
                </div>

                {/* Spectrum display area */}
                <div className="flex-1 relative mx-[10%] border-x border-slate-800 bg-slate-900/50 mt-4 mb-2 overflow-visible">
                    {/* Background rainbow guide */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ background: 'linear-gradient(to right, transparent 0%, #a855f7 15%, #3b82f6 30%, #22c55e 50%, #eab308 65%, #ef4444 80%, transparent 100%)' }}>
                    </div>

                    {/* Ticks and labels */}
                    <div className="absolute bottom-0 w-full flex justify-between px-2 text-[10px] text-slate-500 pb-1">
                        <span>Ultraviolet (~100nm)</span>
                        <span>Visible (~400-700nm)</span>
                        <span>Infrared (~1000nm+)</span>
                    </div>

                    {spectralLines.map((line, idx) => {
                        // Rough mapping of wavelength to percentage position for UI effect (100nm to 1200nm)
                        let leftPos = 0;
                        const minWl = 90;
                        const maxWl = 1500;
                        leftPos = ((Math.max(minWl, Math.min(maxWl, line.wavelength)) - minWl) / (maxWl - minWl)) * 100;

                        return (
                            <div
                                key={line.id}
                                className="absolute top-0 bottom-0 w-1 pt-1 opacity-100 z-10 animate-pulse"
                                style={{
                                    left: `${leftPos}%`,
                                    backgroundColor: line.color,
                                    boxShadow: `0 0 10px ${line.color}, 0 0 15px ${line.color}`
                                }}
                            >
                                <div className="absolute top-0 -translate-x-1/2 -mt-6 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap" style={{ color: line.color }}>
                                    {line.wavelength}nm
                                    <span className="block text-[8px] text-slate-400 text-center">{line.series}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default HydrogenSpectrumLab;
