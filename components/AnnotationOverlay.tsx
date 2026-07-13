import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, Highlighter, Pencil, RotateCcw, Trash2, X } from 'lucide-react';

type Tool = 'pen' | 'marker' | 'eraser';

interface Stroke {
    tool: 'pen' | 'marker';
    color: string;
    width: number;
    points: { x: number; y: number }[];
}

// One shared 6-colour palette for both pen and marker (marker renders it
// translucent). Every colour reads as opaque ink AND as a highlight on the
// white canvas — high contrast, visible from the back of a classroom
// (simulation-layout-standard.md plot palette).
const INK_COLORS = ['#0f172a', '#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed'];

const PEN_WIDTH = 5;
const MARKER_WIDTH = 20;
const MARKER_ALPHA = 0.4;
// Stroke-eraser hit radius: generous for finger taps on a smartboard.
const ERASER_RADIUS = 24;

/**
 * Smartboard annotation layer: a full-screen canvas the teacher can scribble on
 * over the simulation, infographics, and drawers. Inert (pointer-events: none)
 * until pen mode is on, so it never interferes with the sim when idle.
 *
 * The eraser is a STROKE eraser (OneNote/Excalidraw behaviour): touching any
 * part of a line removes the whole line — much faster for a teacher mid-lesson
 * than pixel scrubbing. Undo restores erased/cleared strokes.
 *
 * Ink is ephemeral screen-space — it stays visible when pen mode is off and is
 * discarded when the topic unmounts.
 */
const AnnotationOverlay: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [tool, setTool] = useState<Tool>('pen');
    const [inkColor, setInkColor] = useState(INK_COLORS[1]);
    const [hasInk, setHasInk] = useState(false);
    const [canUndo, setCanUndo] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const strokesRef = useRef<Stroke[]>([]);
    const liveStrokeRef = useRef<Stroke | null>(null);
    // Snapshot history so undo also restores erased / cleared strokes.
    const undoStackRef = useRef<Stroke[][]>([]);
    const isErasingRef = useRef(false);
    const eraserPosRef = useRef<{ x: number; y: number } | null>(null);

    const activeColor = inkColor;

    const syncFlags = () => {
        setHasInk(strokesRef.current.length > 0);
        setCanUndo(undoStackRef.current.length > 0);
    };

    const pushHistory = () => {
        undoStackRef.current.push([...strokesRef.current]);
        if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    };

    const applyStrokeStyle = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = stroke.width;
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.tool === 'marker' ? MARKER_ALPHA : 1;
        ctx.globalCompositeOperation = 'source-over';
    };

    const drawStrokePath = (ctx: CanvasRenderingContext2D, points: Stroke['points']) => {
        if (points.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        if (points.length === 1) {
            ctx.lineTo(points[0].x + 0.01, points[0].y + 0.01);
        } else {
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
        }
        ctx.stroke();
    };

    const redrawAll = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        for (const stroke of strokesRef.current) {
            applyStrokeStyle(ctx, stroke);
            drawStrokePath(ctx, stroke.points);
        }
        ctx.globalAlpha = 1;
        // Eraser feedback ring so the teacher can see exactly what a tap will hit.
        const eraserPos = eraserPosRef.current;
        if (eraserPos) {
            ctx.beginPath();
            ctx.arc(eraserPos.x, eraserPos.y, ERASER_RADIUS, 0, Math.PI * 2);
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }, []);

    // Keep the canvas bitmap sized to the viewport (and crisp on high-DPI
    // smartboards), replaying strokes after each resize.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const { clientWidth, clientHeight } = canvas;
            canvas.width = Math.max(1, Math.round(clientWidth * dpr));
            canvas.height = Math.max(1, Math.round(clientHeight * dpr));
            redrawAll();
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        return () => observer.disconnect();
    }, [redrawAll]);

    // Escape exits pen mode without discarding ink.
    useEffect(() => {
        if (!isActive) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsActive(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isActive]);

    const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    /** Distance from point p to segment ab — used for stroke-eraser hit tests. */
    const distToSegment = (p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const lenSq = dx * dx + dy * dy;
        const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
        const cx = a.x + t * dx;
        const cy = a.y + t * dy;
        return Math.hypot(p.x - cx, p.y - cy);
    };

    const strokeHit = (stroke: Stroke, p: { x: number; y: number }) => {
        const threshold = ERASER_RADIUS + stroke.width / 2;
        const pts = stroke.points;
        if (pts.length === 1) return Math.hypot(p.x - pts[0].x, p.y - pts[0].y) <= threshold;
        for (let i = 1; i < pts.length; i++) {
            if (distToSegment(p, pts[i - 1], pts[i]) <= threshold) return true;
        }
        return false;
    };

    /** Remove every stroke the eraser touches at p (whole-line erase). */
    const eraseAt = (p: { x: number; y: number }) => {
        const survivors = strokesRef.current.filter(stroke => !strokeHit(stroke, p));
        if (survivors.length !== strokesRef.current.length) {
            strokesRef.current = survivors;
            syncFlags();
        }
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        // Synthetic/lost pointers can make capture throw — never let that
        // abort the stroke.
        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            /* capture is best-effort */
        }
        const p = getPoint(event);
        if (tool === 'eraser') {
            pushHistory();
            isErasingRef.current = true;
            eraserPosRef.current = p;
            eraseAt(p);
            redrawAll();
            return;
        }
        liveStrokeRef.current = {
            tool,
            color: activeColor,
            width: tool === 'marker' ? MARKER_WIDTH : PEN_WIDTH,
            points: [p]
        };
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            applyStrokeStyle(ctx, liveStrokeRef.current);
            drawStrokePath(ctx, liveStrokeRef.current.points);
            ctx.globalAlpha = 1;
        }
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const p = getPoint(event);

        if (tool === 'eraser') {
            eraserPosRef.current = p;
            if (isErasingRef.current) eraseAt(p);
            // Redraw on hover too, so the dashed ring tracks the pointer.
            redrawAll();
            return;
        }

        const stroke = liveStrokeRef.current;
        if (!stroke) return;
        stroke.points.push(p);
        // Markers are translucent: incremental segments would double-stamp at
        // joints, so replay the whole stroke each move. The pen is opaque and
        // can draw just the newest segment.
        if (stroke.tool === 'marker') {
            redrawAll();
            applyStrokeStyle(ctx, stroke);
            drawStrokePath(ctx, stroke.points);
            ctx.globalAlpha = 1;
        } else {
            applyStrokeStyle(ctx, stroke);
            drawStrokePath(ctx, stroke.points.slice(-2));
        }
    };

    const handlePointerUp = () => {
        if (isErasingRef.current) {
            isErasingRef.current = false;
            // If the drag erased nothing, drop the redundant history entry.
            const before = undoStackRef.current[undoStackRef.current.length - 1];
            if (before && before.length === strokesRef.current.length) {
                undoStackRef.current.pop();
            }
            syncFlags();
            return;
        }
        if (!liveStrokeRef.current) return;
        pushHistory();
        strokesRef.current = [...strokesRef.current, liveStrokeRef.current];
        liveStrokeRef.current = null;
        syncFlags();
    };

    const handlePointerLeave = () => {
        if (tool === 'eraser' && !isErasingRef.current) {
            eraserPosRef.current = null;
            redrawAll();
        }
    };

    const undo = () => {
        const prev = undoStackRef.current.pop();
        if (!prev) return;
        strokesRef.current = prev;
        redrawAll();
        syncFlags();
    };

    const clearAll = () => {
        if (strokesRef.current.length === 0) return;
        pushHistory();
        strokesRef.current = [];
        liveStrokeRef.current = null;
        redrawAll();
        syncFlags();
    };

    const selectTool = (next: Tool) => {
        setTool(next);
        if (next !== 'eraser') {
            eraserPosRef.current = null;
            redrawAll();
        }
    };

    // Chunky, labelled tool buttons — smartboard finger targets, readable from
    // the back of the room (instructional-design-framework.md).
    const toolButton = (target: Tool, icon: React.ReactNode, label: string) => (
        <button
            type="button"
            onClick={() => selectTool(target)}
            aria-pressed={tool === target}
            title={label}
            className={`flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                tool === target
                    ? 'border-brand-primary bg-brand-primary text-white shadow-lg scale-105'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-primary/40 hover:bg-slate-50'
            }`}
        >
            {icon}
            <span className="text-[10px] font-extrabold uppercase tracking-wide">{label}</span>
        </button>
    );

    const swatches = INK_COLORS;
    const setSwatch = setInkColor;

    return (
        <>
            {/* Ink layer: above infographic scenes (z-[95]) and drawers (z-[90]),
                below the floating drawer toggles (z-[110]) so those stay usable. */}
            <canvas
                ref={canvasRef}
                onPointerDown={isActive ? handlePointerDown : undefined}
                onPointerMove={isActive ? handlePointerMove : undefined}
                onPointerUp={isActive ? handlePointerUp : undefined}
                onPointerCancel={isActive ? handlePointerUp : undefined}
                onPointerLeave={isActive ? handlePointerLeave : undefined}
                className={`absolute inset-0 z-[105] h-full w-full ${
                    isActive ? (tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair') : 'pointer-events-none'
                }`}
                style={{ touchAction: isActive ? 'none' : undefined }}
                aria-hidden="true"
            />

            {isActive ? (
                <div
                    role="toolbar"
                    aria-label="Smartboard pen tools"
                    className="absolute bottom-6 right-4 z-[115] flex flex-col gap-2 rounded-3xl border-2 border-slate-200 bg-white p-3 shadow-2xl"
                >
                    {/* Tools */}
                    <div className="flex gap-1.5" role="group" aria-label="Tool">
                        {toolButton('pen', <Pencil size={22} />, 'Pen')}
                        {toolButton('marker', <Highlighter size={22} />, 'Marker')}
                        {toolButton('eraser', <Eraser size={22} />, 'Eraser')}
                    </div>

                    <div className="h-0.5 w-full rounded bg-slate-200" />

                    {/* Colours — always shown so the toolbar keeps a stable height.
                        Dimmed while erasing (the pick still sets colour for later). */}
                    <div
                        className={`grid grid-cols-3 place-items-center gap-1.5 transition-opacity ${
                            tool === 'eraser' ? 'opacity-40' : 'opacity-100'
                        }`}
                        role="group"
                        aria-label="Ink colour"
                    >
                        {swatches.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setSwatch(color)}
                                aria-pressed={activeColor === color}
                                title={`Ink colour ${color}`}
                                className={`h-10 w-10 rounded-full border-[3px] transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                                    activeColor === color
                                        ? 'scale-110 border-slate-900 shadow-md'
                                        : 'border-white shadow hover:scale-105'
                                }`}
                                style={{ backgroundColor: color }}
                            >
                                <span className="sr-only">{`Use ink colour ${color}`}</span>
                            </button>
                        ))}
                    </div>

                    <div className="h-0.5 w-full rounded bg-slate-200" />

                    {/* Actions */}
                    <div className="flex gap-1.5" role="group" aria-label="Actions">
                        <button
                            type="button"
                            onClick={undo}
                            disabled={!canUndo}
                            title="Undo (restores erased ink too)"
                            className="flex h-14 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                        >
                            <RotateCcw size={20} />
                            <span className="text-[10px] font-extrabold uppercase tracking-wide">Undo</span>
                        </button>
                        <button
                            type="button"
                            onClick={clearAll}
                            disabled={!hasInk}
                            title="Clear all ink"
                            className="flex h-14 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-slate-200 bg-white text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                        >
                            <Trash2 size={20} />
                            <span className="text-[10px] font-extrabold uppercase tracking-wide">Clear</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsActive(false)}
                            title="Close pen mode (ink stays on screen)"
                            className="flex h-14 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-slate-900 text-white shadow-lg transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                        >
                            <X size={20} />
                            <span className="text-[10px] font-extrabold uppercase tracking-wide">Close</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="absolute bottom-6 right-4 z-[115] flex flex-col items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setIsActive(true)}
                        title="Scribble on the board"
                        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-primary bg-white text-brand-primary shadow-2xl transition-all hover:bg-brand-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                    >
                        <Pencil size={26} />
                        <span className="sr-only">Open pen mode</span>
                    </button>
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700">Pen</span>
                </div>
            )}
        </>
    );
};

export default AnnotationOverlay;
