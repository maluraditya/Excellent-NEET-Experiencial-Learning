import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw } from 'lucide-react';

interface TranscriptionCanvasProps {
    mode: 'prokaryote' | 'eukaryote';
}

const TranscriptionCanvas: React.FC<TranscriptionCanvasProps> = ({ mode }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        setIsPlaying(false);
                        return 100;
                    }
                    return prev + 0.5;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const reset = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    return (
        <div className="relative w-full h-full bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute top-4 left-4 bg-white/80 p-2 rounded shadow backdrop-blur-sm z-10">
                <h3 className="font-bold text-slate-700">
                    {mode === 'prokaryote' ? 'Prokaryotic Transcription' : 'Eukaryotic Processing'}
                </h3>
                <p className="text-xs text-slate-500">
                    {mode === 'prokaryote' ? 'Coupled Transcription-Translation' : 'Splicing, Capping & Tailing'}
                </p>
            </div>

            {mode === 'prokaryote' ? (
                <ProkaryoteView progress={progress} />
            ) : (
                <EukaryoteView progress={progress} />
            )}

            {/* Controls */}
            <div className="absolute bottom-6 flex gap-4">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-2 px-6 py-2 bg-brand-primary text-white rounded-full hover:bg-brand-primary/90 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    <span className="font-bold">{isPlaying ? 'Pause' : 'Start Process'}</span>
                </button>
                <button
                    onClick={reset}
                    className="p-2 bg-white text-slate-600 rounded-full hover:bg-slate-100 shadow-md border border-slate-200"
                >
                    <RefreshCw size={20} />
                </button>
            </div>
        </div>
    );
};

// --- Prokaryote Visualization ---
const ProkaryoteView = ({ progress }: { progress: number }) => {
    // Simulating coupled transcription/translation
    const dnaLength = 300;
    const mrnaLength = (progress / 100) * dnaLength;

    return (
        <div className="relative w-[600px] h-[300px] bg-sky-50 rounded-xl border-4 border-sky-200 overflow-hidden">
            <div className="absolute top-2 right-2 text-sky-800 font-bold opacity-20 text-4xl">BACTERIA</div>

            {/* Bacterial DNA Loop segment */}
            <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full" viewBox="0 0 600 300">
                <path d="M 50 100 Q 300 150 550 100" fill="none" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" />
                <path d="M 50 100 Q 300 150 550 100" fill="none" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 5" />

                {/* RNA Polymerase moving */}
                <circle cx={50 + (progress / 100) * 500} cy={100 + Math.sin((progress / 100) * Math.PI) * 25} r="15" fill="#f59e0b" />

                {/* Growing mRNA */}
                <path
                    d={`M ${50 + (progress / 100) * 500} ${100 + Math.sin((progress / 100) * Math.PI) * 25} q -20 50 -${mrnaLength / 2} ${mrnaLength}`}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="4"
                />

                {/* Ribosomes jumping on mRNA (Coupled Translation) */}
                {progress > 10 && (
                    <circle cx={50 + (progress / 100) * 500 - 20} cy={100 + 40} r="8" fill="#8b5cf6">
                        <animate attributeName="r" values="8;10;8" dur="1s" repeatCount="indefinite" />
                    </circle>
                )}
                {progress > 30 && (
                    <circle cx={50 + (progress / 100) * 500 - 40} cy={100 + 80} r="8" fill="#8b5cf6" />
                )}
            </svg>

            {progress > 10 && (
                <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded text-xs text-sky-800 shadow border border-sky-100">
                    Translation starts <strong>immediately</strong>!
                </div>
            )}
        </div>
    );
};

// --- Eukaryote Visualization ---
const EukaryoteView = ({ progress }: { progress: number }) => {
    // Stages: 0-30 Transcription, 30-60 Splicing, 60-80 Cap/Tail, 80-100 Export

    return (
        <div className="relative w-[600px] h-[350px] bg-rose-50 rounded-xl border-4 border-rose-200 overflow-hidden flex items-center justify-center">
            {/* Nucleus Boundary */}
            <div className="absolute inset-4 rounded-full border-4 border-rose-300 border-dashed bg-rose-100/50"></div>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-rose-800 font-bold opacity-30 text-2xl">NUCLEUS</div>

            {/* DNA Template */}
            <div className="absolute top-20 w-[400px] h-4 bg-slate-300 rounded-full overflow-hidden">
                <div className="w-full h-full bg-slate-400 opacity-50" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 20px)' }}></div>
            </div>

            {/* Pre-mRNA */}
            {progress > 0 && progress < 80 && (
                <div className="absolute top-32 flex items-center transition-all duration-500" style={{ width: Math.min(progress * 3, 300) }}>
                    {/* Exon 1 */}
                    <div className="h-4 bg-green-500 rounded-l transition-all" style={{ width: '30%' }}></div>
                    {/* Intron 1 (gets removed) */}
                    <div className={`h-2 bg-yellow-400 transition-all ${progress > 30 && progress < 60 ? 'scale-y-0 opacity-0' : 'w-[20%]'}`}></div>
                    {/* Exon 2 */}
                    <div className="h-4 bg-green-500 transition-all" style={{ width: '30%' }}></div>
                    {/* Intron 2 */}
                    <div className={`h-2 bg-yellow-400 transition-all ${progress > 30 && progress < 60 ? 'scale-y-0 opacity-0' : 'w-[20%]'}`}></div>
                    {/* Exon 3 */}
                    <div className="h-4 bg-green-500 rounded-r transition-all" style={{ width: '30%' }}></div>
                </div>
            )}

            {/* Processing Indicators */}
            {progress > 30 && progress < 60 && (
                <div className="absolute top-40 text-rose-600 font-bold animate-pulse">
                    ✂️ SPLICING INTRONS
                </div>
            )}

            {/* Mature mRNA with Cap/Tail */}
            {progress >= 60 && (
                <div className={`absolute top-32 flex items-center transition-all duration-1000 ${progress > 80 ? 'translate-y-40 opacity-0' : ''}`}>
                    {/* 5' Cap */}
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] font-bold text-white z-10 -mr-2">CAP</div>
                    {/* Spliced Exons */}
                    <div className="h-4 w-[200px] bg-green-600 flex"></div>
                    {/* Poly-A Tail */}
                    <div className="text-[10px] tracking-widest text-slate-500 font-mono ml-1">AAAAAAA...</div>
                </div>
            )}

            {/* Exported mRNA */}
            {progress > 85 && (
                <div className="absolute bottom-4 flex items-center animate-bounce">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 -mr-2"></div>
                    <div className="h-4 w-[200px] bg-green-600"></div>
                    <div className="text-[10px] tracking-widest text-slate-500 font-mono ml-1">AAAAAAA</div>
                    <div className="ml-4 text-green-700 font-bold">EXPORTED TO CYTOPLASM!</div>
                </div>
            )}

        </div>
    );
};

export default TranscriptionCanvas;
