import React, { useState, useMemo } from 'react';
import { RefreshCcw, Plus, Minus, Type, Zap } from 'lucide-react';

interface VSEPRTheoryLabProps { }

const VSEPRTheoryLab: React.FC<VSEPRTheoryLabProps> = () => {
    const [bondPairs, setBondPairs] = useState(2);
    const [lonePairs, setLonePairs] = useState(0);

    const totalPairs = bondPairs + lonePairs;

    const handleAddBp = () => {
        if (totalPairs < 6) setBondPairs(bondPairs + 1);
    };
    const handleAddLp = () => {
        if (totalPairs < 6) setLonePairs(lonePairs + 1);
    };
    const handleMorphLp = () => {
        if (bondPairs > 0) {
            setBondPairs(bondPairs - 1);
            setLonePairs(lonePairs + 1);
        }
    };
    const handleReset = () => {
        setBondPairs(2);
        setLonePairs(0);
    };

    const geometryData = useMemo(() => {
        const t = totalPairs;
        const b = bondPairs;
        const l = lonePairs;

        let shape = "Unknown";
        let angle = "N/A";
        let lpRepulsion = 0;
        let bpRepulsion = 0;

        if (t === 2) {
            if (b === 2) { shape = "Linear"; angle = "180°"; bpRepulsion = 20; lpRepulsion = 0; }
        } else if (t === 3) {
            if (b === 3) { shape = "Trigonal Planar"; angle = "120°"; bpRepulsion = 40; lpRepulsion = 0; }
            else if (b === 2) { shape = "Bent (V-shape)"; angle = "< 120° (env 119°)"; bpRepulsion = 30; lpRepulsion = 60; }
        } else if (t === 4) {
            if (b === 4) { shape = "Tetrahedral"; angle = "109.5°"; bpRepulsion = 60; lpRepulsion = 0; }
            else if (b === 3) { shape = "Trigonal Pyramidal"; angle = "107°"; bpRepulsion = 40; lpRepulsion = 70; }
            else if (b === 2) { shape = "Bent (V-shape)"; angle = "104.5°"; bpRepulsion = 20; lpRepulsion = 100; }
        } else if (t === 5) {
            if (b === 5) { shape = "Trigonal Bipyramidal"; angle = "90°, 120°"; bpRepulsion = 80; lpRepulsion = 0; }
            else if (b === 4) { shape = "See-saw"; angle = "<90°, <120°"; bpRepulsion = 60; lpRepulsion = 80; }
            else if (b === 3) { shape = "T-shaped"; angle = "<90°"; bpRepulsion = 40; lpRepulsion = 90; }
            else if (b === 2) { shape = "Linear"; angle = "180°"; bpRepulsion = 20; lpRepulsion = 100; }
        } else if (t === 6) {
            if (b === 6) { shape = "Octahedral"; angle = "90°"; bpRepulsion = 100; lpRepulsion = 0; }
            else if (b === 5) { shape = "Square Pyramidal"; angle = "<90°"; bpRepulsion = 80; lpRepulsion = 80; }
            else if (b === 4) { shape = "Square Planar"; angle = "90°"; bpRepulsion = 60; lpRepulsion = 100; }
        }

        // fallback mapping if 0 or 1 bond pairs which aren't typical valid shapes
        if (b <= 1) shape = b === 1 ? "Diatomic Linear" : "Bare Atom";

        return { shape, angle, bpRepulsion, lpRepulsion };
    }, [bondPairs, lonePairs, totalPairs]);

    // Visual Generation
    const renderMolecule = () => {
        const t = totalPairs;
        const b = bondPairs;
        const l = lonePairs;

        // Assign angles depending on shape based on standard positions (simple 2D projection for pseudo-3D)
        let positions: { type: 'bp' | 'lp', rotX: number, rotY: number, rotZ: number }[] = [];

        // Helper to push items
        const place = (type: 'bp' | 'lp', rx: number, ry: number, rz: number) => {
            positions.push({ type, rotX: rx, rotY: ry, rotZ: rz });
        };

        if (t === 2) {
            if (b === 2) { place('bp', 0, 0, 0); place('bp', 0, 0, 180); }
            else { place('bp', 0, 0, 0); place('lp', 0, 0, 180); }
        } else if (t === 3) {
            if (b === 3) {
                place('bp', 0, 0, 30); place('bp', 0, 0, 150); place('bp', 0, 0, 270);
            } else if (b === 2) {
                // Squeezed Bent
                place('bp', 0, 0, 45); place('bp', 0, 0, 135); place('lp', 0, 0, 270);
            } else {
                place('bp', 0, 0, 90); place('lp', 0, 0, 225); place('lp', 0, 0, 315);
            }
        } else if (t === 4) {
            if (b === 4) {
                place('bp', 0, 0, -90);
                place('bp', 19.47, 0, 90);
                place('bp', -19.47, 60, 90);
                place('bp', -19.47, -60, 90);
            } else if (b === 3) { // 1 LP -> Pyramidal, base bp squished
                place('lp', 0, 0, -90);
                place('bp', 25, 0, 90);
                place('bp', -25, 60, 90);
                place('bp', -25, -60, 90);
            } else if (b === 2) { // 2 LP -> Bent, put bp in explicit V shape to make it clear
                place('lp', 45, 90, -90);
                place('lp', -45, 90, -90);
                place('bp', 0, 0, 35);
                place('bp', 0, 0, 145);
            } else {
                place('lp', 0, 0, -90);
                place('lp', 19.47, 0, 90);
                place('lp', -19.47, 60, 90);
                place('bp', -19.47, -60, 90);
            }
        } else if (t === 5) {
            if (b === 5) {
                place('bp', 90, 0, 0); place('bp', -90, 0, 0);
                place('bp', 0, 0, 0); place('bp', 0, 120, 0); place('bp', 0, 240, 0);
            } else if (b === 4) { // See-saw, LPs go Equatorial
                place('bp', 90, 0, -10); place('bp', -90, 0, -10); // squished axials
                place('lp', 0, 0, 0);
                place('bp', 0, 130, 0); place('bp', 0, 230, 0); // squished equatorials
            } else if (b === 3) { // T-shaped
                place('bp', 90, 0, -15); place('bp', -90, 0, -15);
                place('lp', 0, 60, 0); place('lp', 0, 300, 0);
                place('bp', 0, 180, 0);
            } else if (b === 2) { // Linear
                place('bp', 90, 0, 0); place('bp', -90, 0, 0);
                place('lp', 0, 0, 0); place('lp', 0, 120, 0); place('lp', 0, 240, 0);
            } else {
                place('bp', 90, 0, 0); place('lp', -90, 0, 0);
                place('lp', 0, 0, 0); place('lp', 0, 120, 0); place('lp', 0, 240, 0);
            }
        } else if (t === 6) {
            if (b === 6) {
                place('bp', 0, 0, 0); place('bp', 0, 180, 0);
                place('bp', 90, 0, 0); place('bp', -90, 0, 0);
                place('bp', 0, 90, 0); place('bp', 0, -90, 0);
            } else if (b === 5) { // Square Pyramidal
                place('lp', 0, 180, 0); place('bp', 0, 0, 0);
                place('bp', 95, 0, 0); place('bp', -95, 0, 0);
                place('bp', 0, 95, 0); place('bp', 0, -95, 0);
            } else if (b === 4) { // Square Planar
                place('lp', 0, 180, 0); place('lp', 0, 0, 0);
                place('bp', 90, 0, 0); place('bp', -90, 0, 0);
                place('bp', 0, 90, 0); place('bp', 0, -90, 0);
            } else if (b === 3) { // T-Shape
                place('lp', 0, 180, 0); place('lp', 0, 0, 0); place('lp', 0, 90, 0);
                place('bp', 90, 0, 0); place('bp', -90, 0, 0); place('bp', 0, -90, 0);
            } else if (b === 2) { // Linear
                place('lp', 0, 180, 0); place('lp', 0, 0, 0); place('lp', 0, 90, 0); place('lp', 0, -90, 0);
                place('bp', 90, 0, 0); place('bp', -90, 0, 0);
            } else {
                place('bp', 90, 0, 0); place('lp', -90, 0, 0);
                place('lp', 0, 0, 0); place('lp', 0, 180, 0); place('lp', 0, 90, 0); place('lp', 0, -90, 0);
            }
        } else if (t <= 1) {
            if (b === 1) place('bp', 0, 0, 90);
            if (l === 1) place('lp', 0, 0, 270);
        }

        return (
            <div className="relative w-64 h-64 mx-auto perspective-1000">
                <div className="absolute inset-0 preserve-3d animate-spin-slow">
                    {/* Central Atom */}
                    <div className="absolute top-1/2 left-1/2 w-12 h-12 -ml-6 -mt-6 bg-gradient-to-br from-slate-400 to-slate-700 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] z-10 
            flex items-center justify-center text-xs font-bold text-white/50">
                        A
                    </div>

                    {/* Bonds and Lone Pairs */}
                    {positions.map((pos, idx) => (
                        <div key={idx}
                            className="absolute top-1/2 left-1/2 origin-left"
                            style={{
                                transform: `rotateX(${pos.rotX}deg) rotateY(${pos.rotY}deg) rotateZ(${pos.rotZ}deg)`
                            }}>
                            {pos.type === 'bp' ? (
                                // Bond Pair
                                <div className="flex items-center">
                                    <div className="w-16 h-2 bg-gradient-to-r from-white/80 to-slate-300 ml-6 rounded-full shadow-lg"></div>
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-700 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]
                    flex items-center justify-center text-[10px] font-bold text-white/80 -ml-2">
                                        B
                                    </div>
                                </div>
                            ) : (
                                // Lone Pair Lobe
                                <div className="flex items-center ml-2">
                                    <div className="w-[80px] h-[40px] bg-gradient-to-r from-yellow-500/50 to-yellow-600/10 rounded-[60px_20px_20px_60px] border border-yellow-300/40 shadow-[0_0_15px_rgba(250,204,21,0.5)] backdrop-blur-[2px] relative flex items-center justify-end pr-3">
                                        <div className="flex flex-col gap-1.5 -mr-1">
                                            <div className="w-2.5 h-2.5 bg-yellow-100 rounded-full shadow-[0_0_5px_rgba(255,255,255,1)]"></div>
                                            <div className="w-2.5 h-2.5 bg-yellow-100 rounded-full shadow-[0_0_5px_rgba(255,255,255,1)]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex items-stretch text-slate-100 font-sans">

            {/* LEFT PANEL: 3D SANDBOX */}
            <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
                {/* Background Grid Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none"></div>

                {renderMolecule()}

                {/* Floating Protractor / Angle Info */}
                <div className="absolute bottom-10 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
                    <Zap className="text-yellow-400" size={20} />
                    <span className="text-xl font-mono text-emerald-400 font-bold">{geometryData.angle}</span>
                    <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Bond Angle</span>
                </div>
            </div>

            {/* RIGHT PANEL: DASHBOARD & CONTROLS */}
            <div className="w-80 bg-slate-800/80 backdrop-blur-sm border-l border-slate-700 flex flex-col overflow-y-auto">
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <h3 className="font-bold text-lg text-white">Geometry Dashboard</h3>
                    <button onClick={handleReset} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-300 hover:text-white" title="Reset Molecule">
                        <RefreshCcw size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-6">
                    {/* Primary Data */}
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Pairs</div>
                        <div className="text-2xl font-bold text-white">{totalPairs} <span className="text-sm font-normal text-slate-400">(Max 6)</span></div>
                    </div>

                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Molecular Shape</div>
                        <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            {geometryData.shape}
                        </div>
                    </div>

                    <div className="h-px bg-slate-700 my-4"></div>

                    {/* Repulsion Meter */}
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Repulsion Meter</div>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-300">Bond Pair - Bond Pair (bp-bp)</span>
                                    <span className="text-blue-400 font-mono">{geometryData.bpRepulsion}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${geometryData.bpRepulsion}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-300">Lone Pair Effect (lp-lp & lp-bp)</span>
                                    <span className="text-yellow-400 font-mono">{geometryData.lpRepulsion}%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${geometryData.lpRepulsion}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-700 my-4"></div>

                    {/* Controls */}
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Build Controls</div>

                        <button
                            onClick={handleAddBp}
                            disabled={totalPairs >= 6}
                            className="w-full py-2.5 px-4 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-blue-300 font-medium flex items-center justify-between transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>Add Bond Pair</span>
                            <Plus size={16} />
                        </button>

                        <button
                            onClick={handleAddLp}
                            disabled={totalPairs >= 6}
                            className="w-full py-2.5 px-4 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/30 rounded-lg text-yellow-300 font-medium flex items-center justify-between transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>Add Lone Pair</span>
                            <Plus size={16} />
                        </button>

                        <button
                            onClick={handleMorphLp}
                            disabled={bondPairs === 0}
                            className="w-full py-2.5 px-4 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-purple-300 font-medium flex items-center justify-between transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            <span>Morph BP → LP</span>
                            <Type size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .preserve-3d { transform-style: preserve-3d; }
                .perspective-1000 { perspective: 1000px; }
                @keyframes spin-slow {
                  0% { transform: rotateY(0deg) rotateX(20deg); }
                  100% { transform: rotateY(360deg) rotateX(20deg); }
                }
                .animate-spin-slow {
                  animation: spin-slow 20s linear infinite;
                }
            `}} />
        </div>
    );
};

export default VSEPRTheoryLab;
