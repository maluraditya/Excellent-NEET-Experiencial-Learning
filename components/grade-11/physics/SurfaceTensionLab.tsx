import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Droplet, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface SurfaceTensionLabProps {
    topic: any;
    onExit: () => void;
}

type LiquidKey = 'water' | 'mercury' | 'soap';

interface LiquidData {
    name: string;
    color: string;
    surfaceTension: number;
    density: number;
    contactAngle: number;
    note: string;
}

const G = 9.8;
const ATM_KPA = 101.3;

const LIQUIDS: Record<LiquidKey, LiquidData> = {
    water: {
        name: 'Water',
        color: '#2563eb',
        surfaceTension: 0.072,
        density: 1000,
        contactAngle: 20,
        note: 'Wets glass. Concave meniscus and capillary rise.',
    },
    mercury: {
        name: 'Mercury',
        color: '#64748b',
        surfaceTension: 0.465,
        density: 13600,
        contactAngle: 140,
        note: 'Does not wet glass. Convex meniscus and capillary fall.',
    },
    soap: {
        name: 'Soap Solution',
        color: '#38bdf8',
        surfaceTension: 0.025,
        density: 1000,
        contactAngle: 10,
        note: 'Lower surface tension than water, so capillary rise is smaller.',
    },
};

const PRESET_RADII = [0.5, 1.0, 2.0];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w <= 0 || h <= 0) return;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
) {
    const words = text.split(' ');
    let line = '';
    let lineIndex = 0;
    for (let i = 0; i < words.length; i++) {
        const test = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(line, x, y + lineHeight * lineIndex);
            line = words[i];
            lineIndex += 1;
        } else {
            line = test;
        }
    }
    if (line) ctx.fillText(line, x, y + lineHeight * lineIndex);
}

function capillaryHeightMeters(surfaceTension: number, thetaDeg: number, radiusMm: number, density: number) {
    const radiusM = radiusMm / 1000;
    const cosTheta = Math.cos((thetaDeg * Math.PI) / 180);
    return (2 * surfaceTension * cosTheta) / (radiusM * density * G);
}

function pressureInsideKPa(surfaceTension: number, thetaDeg: number, radiusMm: number) {
    const radiusM = radiusMm / 1000;
    const deltaP = (2 * surfaceTension * Math.cos((thetaDeg * Math.PI) / 180)) / radiusM;
    return ATM_KPA - deltaP / 1000;
}

const SurfaceTensionLab: React.FC<SurfaceTensionLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    const [liquidKey, setLiquidKey] = useState<LiquidKey>('water');
    const [tubeRadiusMm, setTubeRadiusMm] = useState(1.0);
    const [detergentAdded, setDetergentAdded] = useState(false);
    const [manualContactAngle, setManualContactAngle] = useState<number | null>(null);

    const dragRef = useRef({
        active: false,
        cx: 0,
        cy: 0,
        radius: 1,
        canvasRect: { left: 0, top: 0 },
    });

    const currentLiquid: LiquidData =
        liquidKey === 'water' && detergentAdded
            ? {
                  name: 'Water + Detergent',
                  color: '#38bdf8',
                  surfaceTension: 0.03,
                  density: 1000,
                  contactAngle: 12,
                  note: 'Detergent reduces surface tension and flattens the meniscus.',
              }
            : LIQUIDS[liquidKey];

    const contactAngleDeg = manualContactAngle ?? currentLiquid.contactAngle;

    const stateRef = useRef({
        liquid: currentLiquid,
        liquidKey,
        tubeRadiusMm,
        contactAngleDeg,
    });

    useEffect(() => {
        stateRef.current = {
            liquid: currentLiquid,
            liquidKey,
            tubeRadiusMm,
            contactAngleDeg,
        };
    }, [currentLiquid, liquidKey, tubeRadiusMm, contactAngleDeg]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        const resizeObserver = new ResizeObserver(() => {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        });
        resizeObserver.observe(parent);
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const getPoint = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
                rect,
            };
        };

        const updateAngleFromPoint = (x: number, y: number) => {
            const { cx, cy } = dragRef.current;
            const vx = x - cx;
            const vy = y - cy;
            const magnitude = Math.sqrt(vx * vx + vy * vy);
            if (magnitude < 4) return;
            const angle = Math.acos(Math.max(-1, Math.min(1, -vy / magnitude))) * 180 / Math.PI;
            setManualContactAngle(Math.max(5, Math.min(170, angle)));
        };

        const handlePointerDown = (event: PointerEvent) => {
            const point = getPoint(event);
            const { cx, cy, radius } = dragRef.current;
            const dx = point.x - cx;
            const dy = point.y - cy;
            if (Math.sqrt(dx * dx + dy * dy) <= radius + 12) {
                dragRef.current.active = true;
                dragRef.current.canvasRect = point.rect;
                updateAngleFromPoint(point.x, point.y);
            }
        };

        const handlePointerMove = (event: PointerEvent) => {
            if (!dragRef.current.active) return;
            const point = getPoint(event);
            updateAngleFromPoint(point.x, point.y);
        };

        const handlePointerUp = () => {
            dragRef.current.active = false;
        };

        canvas.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            canvas.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, []);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        if (W < 10 || H < 10) {
            animRef.current = requestAnimationFrame(draw);
            return;
        }

        const { liquid, tubeRadiusMm: activeRadius, contactAngleDeg: thetaDeg } = stateRef.current;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, W, H);

        const scale = W < 1000 ? 1 : (W > 1500 ? 1.22 : 1 + (W - 1000) * 0.00045);
        const fs = (base: number) => Math.max(10, Math.min(base * scale, W * 0.025, H * 0.04));
        const pad = Math.min(W * 0.03, H * 0.035, scale * 22);

        const topY = pad * 2.2;
        const topH = H - topY - pad;
        const macroW = W * 0.58;
        const microX = pad + macroW + pad;
        const microW = W - microX - pad;

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${fs(18)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('Surface Tension and Capillarity Lab', pad + 150 * scale, pad * 1.2);

        drawCard(ctx, pad, topY, macroW, topH, '#ffffff', '#e2e8f0');
        drawCard(ctx, microX, topY, microW, topH, '#ffffff', '#e2e8f0');

        drawMacroView(ctx, {
            x: pad,
            y: topY,
            w: macroW,
            h: topH,
            pad,
            fs,
            liquid,
            activeRadius,
            thetaDeg,
        });

        drawMicroscopeView(ctx, {
            x: microX,
            y: topY,
            w: microW,
            h: topH,
            pad,
            fs,
            liquid,
            thetaDeg,
            dragRef,
        });



        animRef.current = requestAnimationFrame(draw);
    }, []);

    useEffect(() => {
        animRef.current = requestAnimationFrame(draw);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [draw]);

    const handleLiquidChange = (key: LiquidKey) => {
        setLiquidKey(key);
        setManualContactAngle(null);
        if (key !== 'water') setDetergentAdded(false);
    };

    const handleDetergent = () => {
        if (liquidKey !== 'water') return;
        setDetergentAdded((prev) => !prev);
        setManualContactAngle(null);
    };

    const reset = () => {
        setLiquidKey('water');
        setTubeRadiusMm(1.0);
        setDetergentAdded(false);
        setManualContactAngle(null);
    };

    const liveHeightCm = capillaryHeightMeters(currentLiquid.surfaceTension, contactAngleDeg, tubeRadiusMm, currentLiquid.density) * 100;
    const livePressureInside = pressureInsideKPa(currentLiquid.surfaceTension, contactAngleDeg, tubeRadiusMm);

    const simulationCombo = (
        <div className="w-full h-full relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
            <div className="flex-1 relative min-h-[380px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
            </div>
        </div>
    );

    const controlsCombo = (
        <div className="flex flex-col gap-4 w-full text-slate-700 p-1 md:p-2">
            <div className="flex flex-wrap gap-2 md:gap-3">
                {(Object.keys(LIQUIDS) as LiquidKey[]).map((key) => (
                    <button
                        key={key}
                        onClick={() => handleLiquidChange(key)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all shadow-sm active:scale-95 ${
                            liquidKey === key && !(key === 'soap' && detergentAdded)
                                ? 'text-white border-transparent shadow-lg'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                        style={liquidKey === key && !(key === 'soap' && detergentAdded) ? { backgroundColor: LIQUIDS[key].color } : {}}
                    >
                        <Droplet size={16} />
                        {LIQUIDS[key].name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                <StatCard label="Surface Tension" value={`${currentLiquid.surfaceTension.toFixed(3)} N/m`} color="text-blue-600" />
                <StatCard label="Contact Angle" value={`${contactAngleDeg.toFixed(0)} deg`} color="text-amber-600" />
                <StatCard label="Capillary Height" value={`${liveHeightCm.toFixed(2)} cm`} color={liveHeightCm >= 0 ? 'text-emerald-600' : 'text-red-600'} />
                <StatCard label="P inside" value={`${livePressureInside.toFixed(2)} kPa`} color="text-slate-700" />
            </div>

            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 md:gap-6">
                <div className="space-y-4 p-4 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <SliderRow
                        label="Capillary Radius (Adjustable Middle Tube)"
                        valueLabel={`${tubeRadiusMm.toFixed(2)} mm`}
                        minLabel="0.50 mm"
                        maxLabel="2.50 mm"
                    >
                        <input
                            type="range"
                            min="0.5"
                            max="2.5"
                            step="0.05"
                            value={tubeRadiusMm}
                            onChange={(e) => setTubeRadiusMm(parseFloat(e.target.value))}
                            className="w-full accent-blue-600 h-2 md:h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                        />
                    </SliderRow>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4 text-sm text-slate-600 leading-relaxed">
                        Drag the <strong>orange handle</strong> in the molecular microscope to change the angle of contact manually.
                        This directly changes <strong>cos theta</strong> in the capillary rise formula.
                    </div>
                </div>

                <div className="space-y-3 p-4 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={handleDetergent}
                        disabled={liquidKey !== 'water'}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                            liquidKey !== 'water'
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : detergentAdded
                                    ? 'bg-emerald-600 text-white border-transparent shadow-lg'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {detergentAdded ? 'Remove Detergent' : 'Add Detergent'}
                    </button>

                    <button
                        onClick={() => setManualContactAngle(null)}
                        className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-all font-bold text-sm"
                    >
                        Reset Contact Angle
                    </button>

                    <button
                        onClick={reset}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all font-bold text-sm"
                    >
                        <RotateCcw size={16} />
                        Reset Experiment
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
        />
    );
};

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <div className="bg-white rounded-xl p-3 md:p-4 text-center border border-slate-200 shadow-sm">
        <div className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
        <div className={`text-sm md:text-lg font-bold font-mono tracking-tight ${color}`}>{value}</div>
    </div>
);

const SliderRow = ({
    label,
    valueLabel,
    minLabel,
    maxLabel,
    children,
}: {
    label: string;
    valueLabel: string;
    minLabel: string;
    maxLabel: string;
    children: React.ReactNode;
}) => (
    <div className="space-y-2">
        <label className="text-sm md:text-base font-bold text-slate-700 flex justify-between items-center">
            <span>{label}</span>
            <span className="text-slate-700 font-mono text-sm bg-slate-50 border border-slate-200 px-3 py-1 rounded shadow-sm">{valueLabel}</span>
        </label>
        {children}
        <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-400 uppercase">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
        </div>
    </div>
);

function drawCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    stroke: string
) {
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 16);
    ctx.stroke();
}

function drawMacroView(
    ctx: CanvasRenderingContext2D,
    params: {
        x: number;
        y: number;
        w: number;
        h: number;
        pad: number;
        fs: (base: number) => number;
        liquid: LiquidData;
        activeRadius: number;
        thetaDeg: number;
    }
) {
    const { x, y, w, h, pad, fs, liquid, activeRadius, thetaDeg } = params;
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(14)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Macro View: Beaker + Capillary Tubes', x + pad * 0.8, y + pad * 1.0);

    const beakerX = x + pad * 0.8;
    const beakerY = y + h * 0.28;
    const beakerW = w * 0.68;
    const beakerH = h * 0.58;
    const liquidLevelY = beakerY + beakerH * 0.46;

    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, beakerX, beakerY, beakerW, beakerH, 14);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    roundRect(ctx, beakerX, beakerY, beakerW, beakerH, 14);
    ctx.stroke();

    ctx.fillStyle = `${liquid.color}35`;
    ctx.fillRect(beakerX + 2, liquidLevelY, beakerW - 4, beakerY + beakerH - liquidLevelY - 2);
    ctx.strokeStyle = liquid.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(beakerX + 4, liquidLevelY);
    ctx.lineTo(beakerX + beakerW - 4, liquidLevelY);
    ctx.stroke();

    const tubeXs = [beakerX + beakerW * 0.15, beakerX + beakerW * 0.38, beakerX + beakerW * 0.61];
    const tubeRadii = [PRESET_RADII[0], activeRadius, PRESET_RADII[2]];
    const tubeLabels = ['Thin', 'Adjustable', 'Thick'];
    const tubeTopY = y + h * 0.16;
    const tubeBottomY = beakerY + beakerH * 0.86;
    const tubeHeight = tubeBottomY - tubeTopY;

    const heightsCm = tubeRadii.map((radius) => capillaryHeightMeters(liquid.surfaceTension, thetaDeg, radius, liquid.density) * 100);
    const maxAbsCm = Math.max(1.2, ...heightsCm.map((value) => Math.abs(value)));
    const cmToPx = (h * 0.22) / maxAbsCm;

    tubeRadii.forEach((radius, index) => {
        const centerX = tubeXs[index];
        const outerW = Math.max(12, radius * 18);
        const innerW = outerW - 4;
        const capillaryCm = heightsCm[index];
        const capillaryPx = capillaryCm * cmToPx;
        const meniscusY = liquidLevelY - capillaryPx;
        const isActive = index === 1;

        ctx.strokeStyle = isActive ? '#f59e0b' : '#cbd5e1';
        ctx.lineWidth = isActive ? 3 : 2;
        ctx.strokeRect(centerX - outerW / 2, tubeTopY, outerW, tubeHeight);

        ctx.fillStyle = `${liquid.color}55`;
        if (capillaryPx >= 0) {
            ctx.fillRect(centerX - innerW / 2, meniscusY, innerW, liquidLevelY - meniscusY);
        } else {
            ctx.fillRect(centerX - innerW / 2, liquidLevelY, innerW, Math.abs(capillaryPx));
        }

        drawMeniscus(ctx, centerX, meniscusY, innerW, liquid.contactAngle, liquid.color, capillaryPx >= 0);

        ctx.fillStyle = isActive ? '#f59e0b' : '#475569';
        ctx.font = `bold ${fs(10)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`${tubeLabels[index]} (${radius.toFixed(2)} mm)`, centerX, tubeTopY - 10);
        ctx.fillText(`${capillaryCm >= 0 ? '+' : ''}${capillaryCm.toFixed(2)} cm`, centerX, beakerY + beakerH + 18);
    });

    const rulerX = beakerX + beakerW * 0.88;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rulerX, liquidLevelY - maxAbsCm * cmToPx - 10);
    ctx.lineTo(rulerX, liquidLevelY + maxAbsCm * cmToPx + 10);
    ctx.stroke();

    for (let cm = -Math.ceil(maxAbsCm); cm <= Math.ceil(maxAbsCm); cm++) {
        const tickY = liquidLevelY - cm * cmToPx;
        ctx.beginPath();
        ctx.moveTo(rulerX - (cm === 0 ? 12 : 8), tickY);
        ctx.lineTo(rulerX + 8, tickY);
        ctx.stroke();
        ctx.fillStyle = '#64748b';
        ctx.font = `${fs(9)}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`${cm}`, rulerX + 12, tickY + 3);
    }
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(10)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Height Scale (cm)', rulerX, tubeTopY - 10);

    const pressureInside = pressureInsideKPa(liquid.surfaceTension, thetaDeg, activeRadius);
    drawGaugeBox(ctx, x + w - pad - w * 0.2, beakerY + 10, w * 0.2, 52, fs, 'P outside', `${ATM_KPA.toFixed(2)} kPa`, '#475569');
    drawGaugeBox(ctx, x + w - pad - w * 0.2, beakerY + 74, w * 0.2, 52, fs, 'P inside', `${pressureInside.toFixed(2)} kPa`, pressureInside < ATM_KPA ? '#2563eb' : '#dc2626');

    ctx.fillStyle = '#64748b';
    ctx.font = `${fs(10)}px sans-serif`;
    ctx.textAlign = 'left';
    wrapText(ctx, liquid.note, x + pad * 0.8, y + h - 22, w - pad * 1.6, fs(10) * 1.35);
}

function drawMeniscus(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    y: number,
    width: number,
    thetaDeg: number,
    color: string,
    isRise: boolean
) {
    const curve = Math.max(3, Math.min(width * 0.45, 12));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - width / 2, y);
    if (thetaDeg < 90 || isRise) {
        ctx.quadraticCurveTo(centerX, y + curve, centerX + width / 2, y);
    } else {
        ctx.quadraticCurveTo(centerX, y - curve, centerX + width / 2, y);
    }
    ctx.stroke();
}

function drawGaugeBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    fs: (base: number) => number,
    label: string,
    value: string,
    valueColor: string
) {
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 10);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = `bold ${fs(9)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label.toUpperCase(), x + w / 2, y + 16);
    ctx.fillStyle = valueColor;
    ctx.font = `bold ${fs(13)}px monospace`;
    ctx.fillText(value, x + w / 2, y + h * 0.7);
}

function drawMicroscopeView(
    ctx: CanvasRenderingContext2D,
    params: {
        x: number;
        y: number;
        w: number;
        h: number;
        pad: number;
        fs: (base: number) => number;
        liquid: LiquidData;
        thetaDeg: number;
        dragRef: React.MutableRefObject<{ active: boolean; cx: number; cy: number; radius: number; canvasRect: { left: number; top: number } }>;
    }
) {
    const { x, y, w, h, pad, fs, liquid, thetaDeg, dragRef } = params;
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${fs(14)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('Molecular Microscope', x + pad * 0.8, y + pad * 1.0);

    const viewX = x + pad * 0.7;
    const viewY = y + pad * 1.6;
    const viewW = w - pad * 1.4;
    const viewH = h - pad * 2.4;

    ctx.fillStyle = '#0f172a';
    roundRect(ctx, viewX, viewY, viewW, viewH, 14);
    ctx.fill();

    const interfaceY = viewY + viewH * 0.56;
    ctx.fillStyle = `${liquid.color}25`;
    ctx.fillRect(viewX + 12, interfaceY, viewW - 24, viewH - (interfaceY - viewY) - 12);

    const cols = 7;
    const rows = 4;
    const moleculeR = Math.min(8, viewW * 0.028);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const mx = viewX + 34 + col * ((viewW * 0.48) / (cols - 1));
            const my = interfaceY + 18 + row * ((viewH * 0.28) / (rows - 1));

            ctx.fillStyle = liquid.color;
            ctx.beginPath();
            ctx.arc(mx, my, moleculeR, 0, Math.PI * 2);
            ctx.fill();

            if (row === 0) {
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(mx, my + moleculeR + 2);
                ctx.lineTo(mx, my + moleculeR + 16);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(mx, my + moleculeR + 16);
                ctx.lineTo(mx - 4, my + moleculeR + 10);
                ctx.lineTo(mx + 4, my + moleculeR + 10);
                ctx.closePath();
                ctx.fillStyle = '#ef4444';
                ctx.fill();
            }
        }
    }

    ctx.strokeStyle = liquid.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(viewX + 18, interfaceY + 2);
    ctx.lineTo(viewX + viewW * 0.52, interfaceY + 2);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${fs(10)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Surface molecules have a net inward pull', viewX + viewW * 0.27, viewY + 22);

    const wallX = viewX + viewW * 0.78;
    const contactY = interfaceY - 10;
    const arcRadius = Math.min(46, viewW * 0.12);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(wallX, viewY + 30);
    ctx.lineTo(wallX, viewY + viewH - 22);
    ctx.stroke();

    ctx.strokeStyle = liquid.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wallX - 100, contactY + (thetaDeg < 90 ? 8 : -8));
    ctx.quadraticCurveTo(wallX - 52, contactY + (thetaDeg < 90 ? 12 : -12), wallX, contactY);
    ctx.stroke();

    const thetaRad = (thetaDeg * Math.PI) / 180;
    const handleX = wallX - arcRadius * Math.sin(thetaRad);
    const handleY = contactY - arcRadius * Math.cos(thetaRad);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallX, contactY);
    ctx.lineTo(handleX, handleY);
    ctx.stroke();

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(wallX, contactY, arcRadius, -Math.PI / 2, -Math.PI / 2 + thetaRad, false);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(handleX, handleY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    dragRef.current.cx = handleX;
    dragRef.current.cy = handleY;
    dragRef.current.radius = 8;

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fs(11)}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`theta = ${thetaDeg.toFixed(0)} deg`, wallX - 84, contactY - arcRadius - 12);
    ctx.font = `${fs(10)}px sans-serif`;
    wrapText(ctx, 'Drag the orange handle to change the angle of contact.', viewX + viewW * 0.58, viewY + viewH - 54, viewW * 0.34, fs(10) * 1.25);
}



export default SurfaceTensionLab;
