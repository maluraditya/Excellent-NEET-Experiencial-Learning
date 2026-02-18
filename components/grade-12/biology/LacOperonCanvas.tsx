import React, { useState } from 'react';
import { Lock, Zap, RefreshCw } from 'lucide-react';

const LacOperonCanvas: React.FC = () => {
    const [hasLactose, setHasLactose] = useState(false);
    const [repressorBound, setRepressorBound] = useState(true);
    const [polymeraseProgress, setPolymeraseProgress] = useState(0);

    // Effect: If lactose is added, repressor falls off
    React.useEffect(() => {
        if (hasLactose) {
            setRepressorBound(false);
        } else {
            setRepressorBound(true);
            setPolymeraseProgress(0); // Reset polymerase if blocked
        }
    }, [hasLactose]);

    // Effect: Animation loop for polymerase
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!repressorBound && hasLactose) {
            interval = setInterval(() => {
                setPolymeraseProgress(prev => (prev + 1) % 100);
            }, 50);
        }
        return () => clearInterval(interval);
    }, [repressorBound, hasLactose]);

    return (
        <div className="relative w-full h-full bg-amber-50 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-4 left-4 bg-white/80 p-2 rounded shadow backdrop-blur-sm z-10">
                <h3 className="font-bold text-amber-900">Lac Operon Model</h3>
                <p className="text-xs text-amber-700">Add Lactose to unlock transcription</p>
            </div>

            {/* DNA Track */}
            <div className="relative w-[700px] h-24 bg-slate-300 rounded-lg flex items-center border-y-4 border-slate-400">
                {/* Genes */}
                <div className="absolute left-0 w-[15%] h-full bg-purple-200 border-r border-slate-400 flex items-center justify-center font-mono text-purple-800 font-bold">Promoter</div>
                <div className="absolute left-[15%] w-[10%] h-full bg-yellow-200 border-r border-slate-400 flex items-center justify-center font-mono text-yellow-800 font-bold">O</div>
                <div className="absolute left-[25%] w-[25%] h-full bg-blue-200 border-r border-slate-400 flex items-center justify-center font-mono text-blue-800 font-bold">lacZ</div>
                <div className="absolute left-[50%] w-[25%] h-full bg-blue-200 border-r border-slate-400 flex items-center justify-center font-mono text-blue-800 font-bold">lacY</div>
                <div className="absolute left-[75%] w-[25%] h-full bg-blue-200 border-r border-slate-400 flex items-center justify-center font-mono text-blue-800 font-bold">lacA</div>

                {/* Repressor Block */}
                <div
                    className={`absolute left-[16%] -top-12 transition-all duration-700 ease-in-out cursor-pointer z-20 ${repressorBound ? 'translate-y-0' : '-translate-y-32 rotate-12 opacity-50'}`}
                    onClick={() => !hasLactose && alert("Add Lactose first!")}
                >
                    <div className="w-16 h-20 bg-red-500 rounded-lg shadow-xl flex items-center justify-center border-4 border-red-700 relative">
                        <Lock className="text-white" size={32} />
                        {/* Lactose binding site */}
                        <div className="absolute -bottom-2 w-6 h-6 bg-red-800 rounded-full"></div>
                    </div>
                    <div className="text-center font-bold text-red-600 text-xs mt-1">Repressor</div>
                </div>

                {/* RNA Polymerase */}
                <div
                    className="absolute -top-16 transition-all duration-100 ease-linear z-10"
                    style={{ left: `${repressorBound ? 5 : 5 + polymeraseProgress * 0.8}%` }}
                >
                    <div className="w-24 h-16 bg-slate-600 rounded-full opacity-90 flex items-center justify-center shadow-lg border-2 border-slate-500">
                        <span className="text-white font-bold text-xs">RNA Pol</span>
                    </div>
                </div>

                {/* mRNA being produced */}
                {!repressorBound && (
                    <div
                        className="absolute top-24 left-[25%] h-2 bg-green-500 rounded transition-all duration-100 shadow-lg shadow-green-500/50"
                        style={{ width: `${Math.max(0, (polymeraseProgress - 25) * 5)}px` }}
                    ></div>
                )}
            </div>

            {/* Controls */}
            <div className="mt-16 flex gap-6 items-center bg-white p-4 rounded-xl shadow-lg border border-slate-100">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-bold text-slate-600">Environment:</span>
                    <button
                        onClick={() => setHasLactose(!hasLactose)}
                        className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex items-center gap-2 ${hasLactose ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-slate-100 border-slate-300 text-slate-400'}`}
                    >
                        <Zap size={20} className={hasLactose ? 'fill-current' : ''} />
                        {hasLactose ? 'Lactose PRESENT' : 'Lactose ABSENT'}
                    </button>
                </div>

                <div className="h-12 w-px bg-slate-200"></div>

                <div className="text-sm text-slate-500 w-48">
                    {repressorBound
                        ? "Repressor is bound to Operator. Polymerase is BLOCKED."
                        : "Lactose bound to Repressor. Shape changed! Polymerase is FREE."}
                </div>
            </div>

            {/* Legend/Key */}
            {hasLactose && (
                <div className="absolute top-32 left-[18%] animate-bounce">
                    <div className="w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-md"></div>
                    <div className="text-xs font-bold text-orange-600">Lactose Molecule</div>
                </div>
            )}
        </div>
    );
};

export default LacOperonCanvas;
