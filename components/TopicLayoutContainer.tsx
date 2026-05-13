import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Info, ArrowLeft, Play } from 'lucide-react';
import { Topic } from '../types';
import TextbookContent from './TextbookContent';

interface TopicLayoutContainerProps {
    topic: Topic;
    onExit: () => void;
    SimulationComponent: React.ReactNode;
    ControlsComponent?: React.ReactNode;
    // Optional floating top nav specific to the simulation (e.g., view modes)
    FloatingNavComponent?: React.ReactNode;
    // Optional status badge (e.g., staggered/eclipsed warning)
    StatusBadgeComponent?: React.ReactNode;
}

const DESIGN_STAGE_WIDTH = 1280;
const DESIGN_STAGE_HEIGHT = 760;

const DynamicSimulationStage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const updateSize = () => {
            const rect = viewport.getBoundingClientRect();
            setSize({
                width: Math.max(0, rect.width),
                height: Math.max(0, rect.height)
            });
        };

        updateSize();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', updateSize);
            return () => window.removeEventListener('resize', updateSize);
        }

        const observer = new ResizeObserver(updateSize);
        observer.observe(viewport);
        return () => observer.disconnect();
    }, []);

    const scale = useMemo(() => {
        if (!size.width || !size.height) return 1;
        return Math.min(size.width / DESIGN_STAGE_WIDTH, size.height / DESIGN_STAGE_HEIGHT);
    }, [size.height, size.width]);

    return (
        <div ref={viewportRef} className="relative w-full h-full min-h-0 overflow-hidden">
            <div
                className="absolute left-1/2 top-1/2 origin-center"
                style={{
                    width: DESIGN_STAGE_WIDTH,
                    height: DESIGN_STAGE_HEIGHT,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    ['--simulation-scale' as string]: scale
                }}
            >
                {children}
            </div>
        </div>
    );
};

const TopicLayoutContainer: React.FC<TopicLayoutContainerProps> = ({
    topic,
    onExit,
    SimulationComponent,
    ControlsComponent,
    FloatingNavComponent,
    StatusBadgeComponent
}) => {
    return (
        <div className="fixed inset-0 z-[100] bg-[#0f172a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black text-slate-100 font-sans overflow-hidden flex flex-col lg:flex-row animate-in fade-in duration-500">

            {/* Back button sitting strictly on top */}
            <div
                className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md rounded-2xl text-white cursor-pointer border border-white/10 shadow-xl transition-all"
                onClick={onExit}
            >
                <ArrowLeft size={18} /> <span className="text-sm font-bold">Back to Curriculum</span>
            </div>

            {/* 1. Main Interaction Area (Left Side Desktop / Top Half Mobile) */}
            <div className="relative h-[64dvh] min-h-[420px] max-h-[78dvh] flex-none lg:h-full lg:min-h-0 lg:max-h-none lg:flex-1 flex flex-col items-center justify-start shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden bg-slate-900/50" id="tour-simulation">

                {/* Optional Floating Top Nav */}
                {FloatingNavComponent && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto">
                        {FloatingNavComponent}
                    </div>
                )}

                {/* Optional Floating Status Badge */}
                {StatusBadgeComponent && (
                    <div className="absolute top-20 lg:top-4 lg:right-4 left-1/2 -translate-x-1/2 lg:translate-x-0 z-20 pointer-events-auto">
                        {StatusBadgeComponent}
                    </div>
                )}

                {/* Visual Canvas containing the Simulation element */}
                <div className="w-full flex items-center justify-center pointer-events-auto z-10 p-3 sm:p-4 lg:p-6 relative min-h-0" style={{ flex: ControlsComponent ? '3 1 0' : '1 1 100%' }}>
                    <div className="w-full h-full max-w-[1800px] max-h-[1200px] relative flex items-center justify-center min-h-0">
                        <DynamicSimulationStage>
                            {SimulationComponent}
                        </DynamicSimulationStage>
                    </div>
                </div>

                {/* Bottom Control Bar / Overlay naturally flowing at the bottom */}
                {ControlsComponent && (
                    <div className="w-full min-h-0 px-3 pb-3 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6 flex justify-center z-30 pointer-events-auto" style={{ flex: '1 1 0' }}>
                        <div className="w-full h-full max-w-[min(100%,800px)] overflow-y-auto overscroll-contain bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl md:rounded-3xl p-3 md:p-5 flex flex-col gap-3 md:gap-4">
                            {ControlsComponent}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Content Explorer Panel (Right Side Desktop / Bottom Half Mobile) */}
            <div className="flex-1 lg:flex-none w-full lg:w-[450px] xl:w-[500px] 2xl:w-[600px] shrink-0 bg-slate-50 lg:bg-white text-slate-900 overflow-y-auto custom-scrollbar lg:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40 relative" id="tour-content">

                {/* Sticky Header with Navigation Breadcrumbs */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-8 py-4">
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span>{topic.subject}</span>
                        <span className="text-slate-300">•</span>
                        <span>{topic.branch}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-brand-primary/80 truncate">{topic.unit}</span>
                    </div>
                </div>

                {/* Main Content Body */}
                <div className="p-8 pb-32 flex flex-col gap-8">

                    {/* The Legacy Textbook Content Component */}
                    <div className="prose prose-slate prose-lg max-w-none font-sans">
                        <TextbookContent topic={topic} layout="unified" />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TopicLayoutContainer;
