import React, { useState } from 'react';
import { Shield, ShieldAlert, Scissors, Target } from 'lucide-react';

const RNAiCanvas: React.FC = () => {
    const [score, setScore] = useState(0);
    const [silencedCount, setSilencedCount] = useState(0);
    const [selectedMRNA, setSelectedMRNA] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const [mRNAs, setMRNAs] = useState([
        { id: 'virus1', content: 'VIRAL CODE: ATTACK', type: 'bad' },
        { id: 'plant1', content: 'PLANT GENE: GROW', type: 'good' },
        { id: 'virus2', content: 'VIRAL CODE: INFECT', type: 'bad' },
        { id: 'plant2', content: 'PLANT GENE: LEAF', type: 'good' },
    ]);

    const handleMRNAClick = (id: string) => {
        setSelectedMRNA(id);
        setFeedback(null);
    };

    const handleRISCClick = () => {
        if (!selectedMRNA) {
            setFeedback("Select an mRNA first!");
            return;
        }

        const mrna = mRNAs.find(m => m.id === selectedMRNA);
        if (mrna && mrna.type === 'bad') {
            setScore(s => s + 10);
            setSilencedCount(c => c + 1);
            setMRNAs(prev => prev.filter(m => m.id !== selectedMRNA));
            setFeedback("✅ Viral mRNA destroyed!");
        } else if (mrna && mrna.type === 'good') {
            setScore(s => s - 5);
            setFeedback("❌ Oops! You silenced a healthy plant gene!");
        }
        setSelectedMRNA(null);
    };

    const resetGame = () => {
        setScore(0);
        setSilencedCount(0);
        setSelectedMRNA(null);
        setFeedback(null);
        setMRNAs([
            { id: 'virus1', content: 'VIRAL CODE: ATTACK', type: 'bad' },
            { id: 'plant1', content: 'PLANT GENE: GROW', type: 'good' },
            { id: 'virus2', content: 'VIRAL CODE: INFECT', type: 'bad' },
            { id: 'plant2', content: 'PLANT GENE: LEAF', type: 'good' },
        ]);
    };

    return (
        <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center overflow-hidden text-white p-6">
            <div className="absolute top-4 left-4 bg-black/50 p-3 rounded-lg backdrop-blur z-10 border border-slate-700">
                <h3 className="font-bold text-cyan-400">RNAi Defense System</h3>
                <p className="text-xs text-slate-400 mt-1">Click a VIRAL mRNA, then click RISC to destroy it!</p>
            </div>

            <div className="absolute top-4 right-4 text-right">
                <div className="text-2xl font-bold text-yellow-400">Score: {score}</div>
                <div className="text-xs text-slate-400">{silencedCount} Viruses Stopped</div>
                <button
                    onClick={resetGame}
                    className="mt-2 px-3 py-1 bg-slate-700 text-xs rounded hover:bg-slate-600"
                >
                    Reset Game
                </button>
            </div>

            <div className="w-full h-full flex items-center justify-between px-8">

                {/* mRNA Queue */}
                <div className="w-64 min-h-[300px] bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <h4 className="text-center font-bold mb-4 text-slate-300">Cytoplasm Queue</h4>
                    <p className="text-xs text-center text-slate-500 mb-4">Click to select an mRNA</p>
                    {mRNAs.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleMRNAClick(item.id)}
                            className={`p-3 mb-3 rounded-lg font-mono text-xs font-bold shadow-lg flex justify-between items-center cursor-pointer transition-all
                                ${item.type === 'bad'
                                    ? 'bg-red-900/80 border border-red-500 text-red-200 hover:bg-red-800'
                                    : 'bg-green-900/80 border border-green-500 text-green-200 hover:bg-green-800'}
                                ${selectedMRNA === item.id ? 'ring-2 ring-yellow-400 scale-105' : ''}
                            `}
                        >
                            <span>{item.content}</span>
                            {item.type === 'bad' ? <ShieldAlert size={14} /> : <Shield size={14} />}
                        </div>
                    ))}
                    {mRNAs.length === 0 && (
                        <div className="text-center text-green-400 font-bold py-8">
                            🎉 All viruses eliminated!
                        </div>
                    )}
                </div>

                {/* RISC Complex (The Destroyer) */}
                <div
                    onClick={handleRISCClick}
                    className={`w-72 h-72 rounded-full flex flex-col items-center justify-center border-4 cursor-pointer transition-all duration-300
                        ${selectedMRNA
                            ? 'bg-cyan-900/50 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-105'
                            : 'bg-slate-800 border-slate-600 hover:border-slate-500'}
                    `}
                >
                    <Scissors size={64} className="text-cyan-400 mb-2" />
                    <h3 className="text-2xl font-bold text-cyan-500">RISC Complex</h3>
                    <p className="text-xs text-center px-8 text-cyan-200/70 mt-2">
                        {selectedMRNA ? 'Click to DESTROY selected mRNA!' : 'Select an mRNA first'}
                    </p>
                </div>
            </div>

            {/* Feedback */}
            {feedback && (
                <div className={`absolute bottom-6 px-6 py-3 rounded-lg font-bold text-lg animate-pulse
                    ${feedback.includes('✅') ? 'bg-green-600' : feedback.includes('❌') ? 'bg-red-600' : 'bg-yellow-600'}
                `}>
                    {feedback}
                </div>
            )}
        </div>
    );
};

export default RNAiCanvas;
