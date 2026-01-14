import React, { useState, useEffect } from 'react';
import { Scissors, Repeat } from 'lucide-react';

const ReplicationCanvas: React.FC = () => {
    const [forkPosition, setForkPosition] = useState(0); // 0 to 100%

    return (
        <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center overflow-hidden text-white">
            <div className="absolute top-4 left-4 bg-black/50 p-2 rounded backdrop-blur z-10 border border-slate-700">
                <h3 className="font-bold text-emerald-400">Replication Fork Simulator</h3>
                <p className="text-xs text-slate-400">Drag slider to unzip DNA</p>
            </div>

            <div className="relative w-[600px] h-[400px]">
                {/* Main DNA Strands (Y Shape) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Parent Helix (Left) */}
                    <line x1="0" y1="200" x2={forkPosition * 6} y2="200" stroke="#475569" strokeWidth="20" strokeLinecap="round" />

                    {/* Unzipped Top Strand (Leading Template) - goes UP */}
                    <path
                        d={`M ${forkPosition * 6} 200 Q ${forkPosition * 6 + 100} 200 ${600} 50`}
                        fill="none" stroke="#475569" strokeWidth="8"
                    />

                    {/* Unzipped Bottom Strand (Lagging Template) - goes DOWN */}
                    <path
                        d={`M ${forkPosition * 6} 200 Q ${forkPosition * 6 + 100} 200 ${600} 350`}
                        fill="none" stroke="#475569" strokeWidth="8"
                    />

                    {/* HELICASE (The Unzipper) */}
                    <circle cx={forkPosition * 6} cy="200" r="20" fill="#3b82f6" opacity="0.8" />
                    <text x={forkPosition * 6 - 15} y="205" fontSize="10" fill="white" fontWeight="bold">HEL</text>

                    {/* Leading Strand Synthesis (Continuous) */}
                    {/* Grows from LEFT to RIGHT towards fork */}
                    <path
                        d={`M 0 190 L ${Math.max(0, forkPosition * 6 - 30)} 190`}
                        fill="none" stroke="#ef4444" strokeWidth="6" strokeDasharray="4 2"
                    />

                    {/* Lagging Strand Synthesis (Okazaki Fragments) */}
                    {/* Loops appearing on the bottom strand */}
                    {[1, 2, 3, 4].map(i => {
                        const startX = 600 - i * 120;
                        if (startX < forkPosition * 6 + 50) return null; // Only show if unwound
                        return (
                            <path
                                key={i}
                                d={`M ${startX} 320 Q ${Math.max(startX - 50, forkPosition * 6 + 50)} 280 ${Math.max(startX - 100, forkPosition * 6)} 250`}
                                fill="none" stroke="#eab308" strokeWidth="6"
                            />
                        );
                    })}
                </svg>

                {/* Labels */}
                <div className="absolute top-10 right-10 text-emerald-400 font-bold">5'</div>
                <div className="absolute bottom-10 right-10 text-emerald-400 font-bold">3'</div>
            </div>

            {/* Slider Control */}
            <div className="w-[500px] mt-8 bg-slate-800 p-4 rounded-full border border-slate-700 flex gap-4 items-center z-20">
                <Scissors className="text-blue-400" size={24} />
                <input
                    type="range"
                    min="0"
                    max="80"
                    value={forkPosition}
                    onChange={(e) => setForkPosition(parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
            </div>

            <div className="mt-4 flex gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-red-500"></div>
                    <span className="text-xs">Leading Strand (Continuous)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-yellow-500"></div>
                    <span className="text-xs">Lagging/Okazaki (Discontinuous)</span>
                </div>
            </div>
        </div>
    );
};

export default ReplicationCanvas;
