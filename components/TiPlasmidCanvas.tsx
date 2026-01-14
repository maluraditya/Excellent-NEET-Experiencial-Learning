import React, { useState } from 'react';
import { Truck, CheckCircle, Package } from 'lucide-react';

const TiPlasmidCanvas: React.FC = () => {
    const [step, setStep] = useState(0); // 0: Soil, 1: Infection, 2: Transfer, 3: Integration, 4: GMO

    const nextStep = () => {
        if (step < 4) setStep(step + 1);
    };

    const reset = () => setStep(0);

    return (
        <div className="relative w-full h-full bg-emerald-50 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-4 left-4 bg-white/80 p-2 rounded shadow backdrop-blur-sm z-10">
                <h3 className="font-bold text-emerald-900">Agrobacterium Transformation</h3>
                <p className="text-xs text-emerald-700">The "Natural Genetic Engineer"</p>
            </div>

            {/* Visual Stage */}
            <div className="relative w-[700px] h-[400px] bg-white rounded-xl shadow-xl overflow-hidden border border-emerald-100">

                {/* 1. The Plant Cell (Right Side) */}
                <div className="absolute right-0 top-0 w-1/2 h-full bg-emerald-100 border-l-4 border-emerald-300">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-200 rounded-full border-4 border-emerald-400 flex items-center justify-center">
                        <span className="text-emerald-800 font-bold opacity-30">NUCLEUS</span>
                        {/* Integrated DNA */}
                        {step >= 3 && (
                            <div className="absolute w-32 h-2 bg-yellow-400 rounded animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.6)]"></div>
                        )}
                    </div>
                    <div className="absolute bottom-4 right-4 text-emerald-800 font-bold">PLANT CELL</div>

                    {step === 4 && (
                        <div className="absolute top-10 right-10 bg-white p-3 rounded-lg shadow-lg border border-yellow-400 flex items-center gap-2 animate-bounce">
                            <CheckCircle className="text-green-500" />
                            <span className="text-sm font-bold text-slate-700">GMO Created!</span>
                        </div>
                    )}
                </div>

                {/* 2. The Bacteria (Left Side) */}
                <div className={`absolute left-10 top-1/2 -translate-y-1/2 w-40 h-64 bg-slate-700 rounded-full border-4 border-slate-500 transition-all duration-1000 ${step >= 1 ? 'translate-x-[150px]' : ''}`}>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 font-bold text-xs">Agrobacterium</div>

                    {/* Ti Plasmid Ring */}
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-blue-400"></div>

                    {/* T-DNA (Payload) */}
                    <div className={`absolute top-[108px] left-[65px] w-8 h-2 bg-yellow-400 rotate-45 transition-all duration-1000 ${step >= 2 ? 'translate-x-[200px] rotate-0 w-16' : ''} ${step >= 3 ? 'opacity-0' : ''}`}></div>
                </div>

                {/* Connection Bridge (Pilus) */}
                {step >= 1 && step < 3 && (
                    <div className="absolute left-[280px] top-1/2 -translate-y-1/2 w-20 h-4 bg-slate-500 opacity-50"></div>
                )}

            </div>

            {/* Controls */}
            <div className="absolute bottom-8 w-full flex justify-center gap-4">
                <div className="flex gap-2">
                    {[0, 1, 2, 3, 4].map(s => (
                        <div key={s} className={`w-3 h-3 rounded-full ${step >= s ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                    ))}
                </div>
            </div>

            <button
                onClick={step === 4 ? reset : nextStep}
                className="absolute bottom-12 px-8 py-3 bg-emerald-600 text-white rounded-full font-bold shadow-lg hover:bg-emerald-700 transition"
            >
                {step === 0 && "Step 1: Infect Plant"}
                {step === 1 && "Step 2: Transfer T-DNA"}
                {step === 2 && "Step 3: Integrate into Genome"}
                {step === 3 && "Step 4: Express Gene"}
                {step === 4 && "Reset Simulation"}
            </button>
        </div>
    );
};

export default TiPlasmidCanvas;
