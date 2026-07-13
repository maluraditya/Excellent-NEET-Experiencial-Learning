import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, GraduationCap, LayoutGrid, X } from 'lucide-react';
import { Topic } from '../types';
import TextbookContent from './TextbookContent';
import AnnotationOverlay from './AnnotationOverlay';
import { getInfographic } from './infographics/registry';
import { getInfographicScenes } from './infographics/sceneRegistry';

interface TopicLayoutContainerProps {
    topic: Topic;
    onExit: () => void;
    SimulationComponent: React.ReactNode;
    ControlsComponent?: React.ReactNode;
    // Optional infographic panel shown in its own drawer (button appears below "Explanation")
    InfographicComponent?: React.ReactNode;
    // Optional floating top nav specific to the simulation (e.g., view modes)
    FloatingNavComponent?: React.ReactNode;
    // Optional status badge (e.g., staggered/eclipsed warning)
    StatusBadgeComponent?: React.ReactNode;
    simulationAreaFlex?: string;
    controlsAreaFlex?: string;
    simulationStageWidth?: number;
    simulationStageHeight?: number;
    contentPanelMode?: 'inline' | 'left-drawer';
    contentDrawerSide?: 'left' | 'right';
    rootClassName?: string;
    simulationClassName?: string;
    controlsWrapperClassName?: string;
    contentToggleClassName?: string;
}

const DESIGN_STAGE_WIDTH = 1280;
const DESIGN_STAGE_HEIGHT = 760;

const DynamicSimulationStage: React.FC<{ children: React.ReactNode; width?: number; height?: number }> = ({
    children,
    width = DESIGN_STAGE_WIDTH,
    height = DESIGN_STAGE_HEIGHT
}) => {
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
        return Math.min(size.width / width, size.height / height);
    }, [height, size.height, size.width, width]);

    return (
        <div ref={viewportRef} className="relative w-full h-full min-h-0 overflow-hidden">
            <div
                className="absolute left-1/2 top-1/2 origin-center"
                style={{
                    width,
                    height,
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
    InfographicComponent,
    FloatingNavComponent,
    StatusBadgeComponent,
    simulationAreaFlex,
    controlsAreaFlex,
    simulationStageWidth,
    simulationStageHeight,
    contentPanelMode = 'left-drawer',
    contentDrawerSide = 'right',
    rootClassName,
    simulationClassName,
    controlsWrapperClassName,
    contentToggleClassName
}) => {
    const [isContentOpen, setIsContentOpen] = useState(false);
    const [isInfographicOpen, setIsInfographicOpen] = useState(false);
    const [selectedInfographicIndex, setSelectedInfographicIndex] = useState(0);
    // Explicit prop wins; otherwise fall back to the id-keyed infographic registry.
    const resolvedInfographic = InfographicComponent ?? getInfographic(topic.id);
    // Full-screen single-image scene (new standard). Preferred over the legacy panel.
    const resolvedScenes = getInfographicScenes(topic.id);
    const resolvedScene = resolvedScenes[selectedInfographicIndex]?.node ?? resolvedScenes[0]?.node ?? null;
    const hasInfographic = Boolean(resolvedScene || resolvedInfographic);

    useEffect(() => {
        setSelectedInfographicIndex(0);
    }, [topic.id]);

    const usesClass11BiologyLayout = topic.grade === '11th' && topic.subject === 'Biology';
    const usesDrawerLayout = contentPanelMode === 'left-drawer';
    const resolvedSimulationAreaFlex = simulationAreaFlex ?? (
        ControlsComponent
            ? usesClass11BiologyLayout
                ? '5 1 0'
                : usesDrawerLayout
                    ? '3 1 0'
                    : '2 1 0'
            : '1 1 100%'
    );
    const resolvedControlsAreaFlex = controlsAreaFlex ?? (
        usesClass11BiologyLayout
            ? '0 0 clamp(170px, 30%, 240px)'
            : usesDrawerLayout
                ? '0 0 clamp(150px, 24%, 230px)'
                : '1 1 0'
    );
    const resolvedSimulationStageWidth = simulationStageWidth ?? (usesClass11BiologyLayout ? 1040 : undefined);
    const resolvedSimulationStageHeight = simulationStageHeight ?? (usesClass11BiologyLayout ? 620 : undefined);
    const rootClasses = rootClassName ?? (
        usesDrawerLayout
            ? 'bg-black text-slate-100'
            : 'bg-[#0f172a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black text-slate-100'
    );
    const simulationClasses = simulationClassName ?? (
        usesDrawerLayout
            ? 'overflow-hidden bg-white'
            : 'border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden bg-slate-900/50'
    );
    const contentToggleClasses = contentToggleClassName ?? 'bg-red-600 text-white border border-red-500 hover:bg-white hover:text-red-600';
    const isRightDrawer = contentDrawerSide === 'right';
    const floatingNavPositionClasses = usesDrawerLayout ? 'top-24' : 'top-4';
    const statusBadgePositionClasses = usesDrawerLayout ? 'top-24 right-4' : 'top-20 lg:top-4 lg:right-4 left-1/2 -translate-x-1/2 lg:translate-x-0';
    const topicBreadcrumbs = (
        <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>{topic.subject}</span>
            <span className="text-slate-300">&bull;</span>
            <span>{topic.branch}</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-brand-primary/80 truncate">{topic.unit}</span>
        </div>
    );
    const secondaryHeader = (
        <header className="absolute inset-x-0 top-0 z-50 bg-gradient-to-r from-brand-primary via-brand-primary to-rose-700 shadow-lg">


            <div className="relative mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex shrink-0 items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/80">
                            <img src="/logo1.webp" alt="Excellent Group of Institutions" className="w-full h-full object-contain p-0.5" />
                        </div>
                        <h1 className="font-display font-bold text-white tracking-wide leading-none md:w-[322px]">
                            <span className="block text-xl !leading-none sm:text-2xl">Excellent</span>
                            <span className="mt-0.5 block text-[10px] font-semibold uppercase leading-none tracking-widest text-white/85 sm:text-[11px]">Group of Institutions</span>
                        </h1>
                    </div>

                </div>

                <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 justify-center px-4 md:flex">
                    <div
                        className="flex max-w-[44vw] items-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 px-5 py-2 font-display text-lg font-bold leading-tight text-white shadow-sm backdrop-blur-sm lg:text-xl 2xl:max-w-[680px]"
                        title={topic.title}
                    >
                        <span className="block truncate">
                            {topic.title}
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm sm:flex">
                        <GraduationCap size={12} className="text-brand-secondary" />
                        {topic.grade} &bull; {topic.subject}
                    </span>
                </div>
            </div>
        </header>
    );

    const contentPanel = (
        <>
            {/* Sticky Header with Navigation Breadcrumbs */}
            <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center gap-4">
                
                {topicBreadcrumbs}
            </div>

            {/* Main Content Body */}
            <div className="p-8 pb-32 flex flex-col gap-8">

                {/* The Legacy Textbook Content Component */}
                <div className="prose prose-slate prose-lg max-w-none font-sans">
                    <TextbookContent topic={topic} layout="unified" />
                </div>

            </div>
        </>
    );

    if (contentPanelMode === 'left-drawer') {
        return (
            <div className={`fixed inset-0 z-[100] ${rootClasses} font-sans overflow-hidden flex flex-col animate-in fade-in duration-500`}>
                
{secondaryHeader}

                {/* Global Back Button */}
                <button
                    onClick={onExit}
                    className="absolute left-4 top-[76px] sm:top-[88px] z-[60] flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>


                <div className={`absolute ${isRightDrawer ? 'right-4' : 'left-4'} top-1/2 z-[110] flex -translate-y-1/2 flex-col items-center gap-4`}>
                    {/* Explanation toggle */}
                    <div className="flex flex-col items-center gap-1.5">
                        <button
                            type="button"
                            aria-expanded={isContentOpen}
                            aria-controls="tour-content"
                            onClick={() => {
                                setIsContentOpen(open => !open);
                                setIsInfographicOpen(false);
                            }}
                            className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${contentToggleClasses}`}
                            title={isContentOpen ? 'Hide explanation' : 'Show explanation'}
                        >
                            {isContentOpen ? <X size={24} /> : <BookOpen size={24} />}
                            <span className="sr-only">{isContentOpen ? 'Hide explanation' : 'Show explanation'}</span>
                        </button>
                        <span className="text-xs font-semibold text-slate-700">
                            {isContentOpen ? 'Close' : 'Explanation'}
                        </span>
                    </div>

                    {/* Infographics toggle */}
                    {hasInfographic && (
                        <div className="flex flex-col items-center gap-1.5">
                            <button
                                type="button"
                                aria-expanded={isInfographicOpen}
                                aria-controls="tour-infographic"
                                onClick={() => {
                                    setIsInfographicOpen(open => !open);
                                    setIsContentOpen(false);
                                }}
                                className="h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all bg-brand-secondary text-brand-dark border border-amber-300 hover:bg-white hover:text-brand-primary"
                                title={isInfographicOpen ? 'Hide infographics' : 'Show infographics'}
                            >
                                {isInfographicOpen ? <X size={24} /> : <LayoutGrid size={24} />}
                                <span className="sr-only">{isInfographicOpen ? 'Hide infographics' : 'Show infographics'}</span>
                            </button>
                            <span className="text-xs font-semibold text-slate-700">
                                {isInfographicOpen ? 'Close' : 'Infographics'}
                            </span>
                        </div>
                    )}
                </div>

                {(isContentOpen || isInfographicOpen) && (
                    <button
                        type="button"
                        className="absolute inset-0 z-30 bg-slate-950/20 lg:hidden"
                        aria-label="Close panel"
                        onClick={() => {
                            setIsContentOpen(false);
                            setIsInfographicOpen(false);
                        }}
                    />
                )}

                {/* Fullscreen Main Interaction Area */}
                <div className={`relative h-full w-full flex-1 flex flex-col items-center justify-start shrink-0 pt-20 ${simulationClasses}`} id="tour-simulation">

                    {/* Optional Floating Top Nav */}
                    {FloatingNavComponent && (
                        <div className={`absolute ${floatingNavPositionClasses} left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto`}>
                            {FloatingNavComponent}
                        </div>
                    )}

                    {/* Optional Floating Status Badge */}
                    {StatusBadgeComponent && (
                        <div className={`absolute ${statusBadgePositionClasses} z-20 pointer-events-auto`}>
                            {StatusBadgeComponent}
                        </div>
                    )}

                    {/* Visual Canvas containing the Simulation element */}
                    <div className="w-full flex items-center justify-center pointer-events-auto z-10 p-3 sm:p-4 lg:p-6 relative min-h-0" style={{ flex: resolvedSimulationAreaFlex }}>
                        <div className="w-full h-full max-w-[1800px] max-h-[1200px] relative flex items-center justify-center min-h-0">
                            <DynamicSimulationStage width={resolvedSimulationStageWidth} height={resolvedSimulationStageHeight}>
                                {SimulationComponent}
                            </DynamicSimulationStage>
                        </div>
                    </div>

                    {/* Bottom Control Bar / Overlay naturally flowing at the bottom */}
                    {ControlsComponent && (
                        <div className="w-full min-h-0 px-3 pb-3 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6 flex justify-center z-30 pointer-events-auto" style={{ flex: resolvedControlsAreaFlex }}>
                            <div className={controlsWrapperClassName ?? "w-full h-full max-w-[min(100%,980px)] overflow-y-auto overscroll-contain bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-2xl md:rounded-3xl p-3 md:p-5 flex flex-col gap-3 md:gap-4"}>
                                {ControlsComponent}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Explorer Drawer */}
                <div
                    className={`absolute ${isRightDrawer ? 'right-0 shadow-[-18px_0_45px_rgba(15,23,42,0.24)]' : 'left-0 shadow-[18px_0_45px_rgba(15,23,42,0.24)]'} top-0 h-full w-[min(88vw,460px)] bg-white text-slate-900 overflow-y-auto custom-scrollbar z-[90] transition-transform duration-300 ease-out ${
                        isContentOpen ? 'translate-x-0' : isRightDrawer ? 'translate-x-full' : '-translate-x-full'
                    }`}
                    id="tour-content"
                >
                    {contentPanel}
                </div>

                {/* Legacy Infographic Drawer (only when no full-screen scene exists) */}
                {!resolvedScene && resolvedInfographic && (
                    <div
                        className={`absolute ${isRightDrawer ? 'right-0 shadow-[-18px_0_45px_rgba(15,23,42,0.24)]' : 'left-0 shadow-[18px_0_45px_rgba(15,23,42,0.24)]'} top-0 h-full w-[min(92vw,520px)] bg-white text-slate-900 overflow-y-auto custom-scrollbar z-[95] transition-transform duration-300 ease-out ${
                            isInfographicOpen ? 'translate-x-0' : isRightDrawer ? 'translate-x-full' : '-translate-x-full'
                        }`}
                        id="tour-infographic"
                    >
                        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-md">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-secondary text-brand-dark">
                                <LayoutGrid size={16} />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Infographic</span>
                                <span className="text-sm font-bold text-slate-800 leading-tight truncate">{topic.title}</span>
                            </div>
                        </div>
                        <div className="p-5 pb-24 sm:p-6">
                            {resolvedInfographic}
                        </div>
                    </div>
                )}

                {/* Full-screen single-image Infographic (new standard).
                    Sits BELOW the floating buttons (z-[95] < z-[110]) so the Infographics
                    toggle stays in place and a second press closes it — like Explanation. */}
                {resolvedScene && isInfographicOpen && (
                    <div
                        className="absolute inset-0 z-[95] flex items-center justify-center bg-slate-50 p-3 sm:p-5 animate-in fade-in duration-200"
                        id="tour-infographic"
                    >
                        {resolvedScenes.length > 1 && (
                            <div className="absolute left-1/2 top-4 z-10 flex max-w-[min(88vw,920px)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur">
                                {resolvedScenes.map((scene, index) => (
                                    <button
                                        key={scene.id}
                                        type="button"
                                        onClick={() => setSelectedInfographicIndex(index)}
                                        className={`shrink-0 rounded-xl px-3 py-2 text-left text-xs font-black transition sm:px-4 ${
                                            index === selectedInfographicIndex
                                                ? 'bg-brand-primary text-white shadow'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                                        }`}
                                        title={scene.description}
                                    >
                                        {scene.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className={`h-full w-full ${resolvedScenes.length > 1 ? 'pt-14' : ''}`}>
                            {resolvedScene}
                        </div>
                    </div>
                )}

                {/* Smartboard scribble layer — available on every topic. */}
                <AnnotationOverlay />
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 z-[100] ${rootClasses} font-sans overflow-hidden flex flex-col lg:flex-row animate-in fade-in duration-500`}>
            
{secondaryHeader}

                {/* Global Back Button */}
                <button
                    onClick={onExit}
                    className="absolute left-4 top-[76px] sm:top-[88px] z-[60] flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>


            {/* 1. Main Interaction Area (Left Side Desktop / Top Half Mobile) */}
            <div className={`relative h-[66dvh] min-h-[450px] max-h-[80dvh] flex-none pt-20 lg:h-full lg:min-h-0 lg:max-h-none lg:flex-1 flex flex-col items-center justify-start shrink-0 ${simulationClasses}`} id="tour-simulation">

                {/* Optional Floating Top Nav */}
                {FloatingNavComponent && (
                    <div className={`absolute ${floatingNavPositionClasses} left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl pointer-events-auto`}>
                        {FloatingNavComponent}
                    </div>
                )}

                {/* Optional Floating Status Badge */}
                {StatusBadgeComponent && (
                    <div className={`absolute ${statusBadgePositionClasses} z-20 pointer-events-auto`}>
                        {StatusBadgeComponent}
                    </div>
                )}

                {/* Visual Canvas containing the Simulation element */}
                <div className="w-full flex items-center justify-center pointer-events-auto z-10 p-3 sm:p-4 lg:p-6 relative min-h-0" style={{ flex: resolvedSimulationAreaFlex }}>
                    <div className="w-full h-full max-w-[1800px] max-h-[1200px] relative flex items-center justify-center min-h-0">
                        <DynamicSimulationStage width={resolvedSimulationStageWidth} height={resolvedSimulationStageHeight}>
                            {SimulationComponent}
                        </DynamicSimulationStage>
                    </div>
                </div>

                {/* Bottom Control Bar / Overlay naturally flowing at the bottom */}
                {ControlsComponent && (
                    <div className="w-full min-h-0 px-3 pb-3 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6 flex justify-center z-30 pointer-events-auto" style={{ flex: resolvedControlsAreaFlex }}>
                        <div className={controlsWrapperClassName ?? "w-full h-full max-w-[min(100%,800px)] overflow-y-auto overscroll-contain bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl md:rounded-3xl p-3 md:p-5 flex flex-col gap-3 md:gap-4"}>
                            {ControlsComponent}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Content Explorer Panel (Right Side Desktop / Bottom Half Mobile) */}
            <div className="flex-1 lg:flex-none w-full lg:w-[450px] xl:w-[500px] 2xl:w-[600px] shrink-0 bg-slate-50 lg:bg-white text-slate-900 overflow-y-auto custom-scrollbar lg:shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-[70] relative" id="tour-content">

                {/* Sticky Header with Navigation Breadcrumbs */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-8 py-4 flex items-center gap-4">
                    
                    {topicBreadcrumbs}
                </div>

                {/* Main Content Body */}
                <div className="p-8 pb-32 flex flex-col gap-8">

                    {/* The Legacy Textbook Content Component */}
                    <div className="prose prose-slate prose-lg max-w-none font-sans">
                        <TextbookContent topic={topic} layout="unified" />
                    </div>

                </div>
            </div>

            {/* Smartboard scribble layer — available on every topic. */}
            <AnnotationOverlay />
        </div>
    );
};

export default TopicLayoutContainer;
