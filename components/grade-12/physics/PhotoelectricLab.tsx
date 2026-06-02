import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Pause, Play, RotateCcw, Target, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PhotoelectricLabProps {
    topic: any;
    onExit: () => void;
}

const HC_EV_NM = 1240;
const C_MS = 2.998e8;
const H_EV_S = 4.135667696e-15;
const MIN_WAVELENGTH = 150;
const MAX_WAVELENGTH = 750;
const MIN_VOLTAGE = -10;
const MAX_VOLTAGE = 10;

const MATERIALS = [
    { id: 'cs', symbol: 'Cs', name: 'Cesium', workFunction: 2.14, color: '#f59e0b' },
    { id: 'k', symbol: 'K', name: 'Potassium', workFunction: 2.30, color: '#a3e635' },
    { id: 'na', symbol: 'Na', name: 'Sodium', workFunction: 2.75, color: '#facc15' },
    { id: 'zn', symbol: 'Zn', name: 'Zinc', workFunction: 4.31, color: '#94a3b8' },
    { id: 'pt', symbol: 'Pt', name: 'Platinum', workFunction: 5.65, color: '#c4b5fd' }
] as const;

type MaterialId = typeof MATERIALS[number]['id'];
type GraphMode = 'vnu' | 'iv';

interface Photon {
    id: number;
    x: number;
    y: number;
    targetY: number;
    speed: number;
}

interface Electron {
    id: number;
    x: number;
    y: number;
    vy: number;
    kInitial: number;
    returning: boolean;
    trail: { x: number; y: number }[];
}

interface Flash {
    id: number;
    x: number;
    y: number;
    age: number;
    duration: number;
    color: string;
    radius: number;
}

interface Snapshot {
    wavelength: number;
    intensity: number;
    voltage: number;
    material: typeof MATERIALS[number];
    photonEnergy: number;
    kMax: number;
    thresholdWavelength: number;
    thresholdFrequency: number;
    frequency: number;
    isAboveThreshold: boolean;
    measuredCurrent: number;
    smoothedCurrent: number;
    graphVisible: boolean;
    isPlaying: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatFrequency = (frequency: number) => `${(frequency / 1e14).toFixed(2)} x 10^14 Hz`;

const wavelengthToRgb = (wavelength: number) => {
    if (wavelength < 380) return { r: 168, g: 85, b: 247, a: 1 };

    let r = 0;
    let g = 0;
    let b = 0;

    if (wavelength < 440) {
        r = -(wavelength - 440) / 60;
        b = 1;
    } else if (wavelength < 490) {
        g = (wavelength - 440) / 50;
        b = 1;
    } else if (wavelength < 510) {
        g = 1;
        b = -(wavelength - 510) / 20;
    } else if (wavelength < 580) {
        r = (wavelength - 510) / 70;
        g = 1;
    } else if (wavelength < 645) {
        r = 1;
        g = -(wavelength - 645) / 65;
    } else {
        r = 1;
    }

    const edgeFade = wavelength < 420
        ? 0.35 + 0.65 * ((wavelength - 380) / 40)
        : wavelength > 700
            ? 0.35 + 0.65 * ((780 - wavelength) / 80)
            : 1;

    return {
        r: Math.round(clamp(r, 0, 1) * 255),
        g: Math.round(clamp(g, 0, 1) * 255),
        b: Math.round(clamp(b, 0, 1) * 255),
        a: clamp(edgeFade, 0.35, 1)
    };
};

const wavelengthColor = (wavelength: number, alpha = 1) => {
    const rgb = wavelengthToRgb(wavelength);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * rgb.a})`;
};

const drawRoundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};

const drawLabel = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color = '#cbd5e1',
    align: CanvasTextAlign = 'center',
    font = '12px Inter, ui-sans-serif, system-ui'
) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
};

const PhotoelectricLab: React.FC<PhotoelectricLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const photonsRef = useRef<Photon[]>([]);
    const electronsRef = useRef<Electron[]>([]);
    const flashesRef = useRef<Flash[]>([]);
    const spawnAccumulatorRef = useRef(0);
    const photonIdRef = useRef(0);
    const electronIdRef = useRef(0);
    const flashIdRef = useRef(0);
    const smoothedCurrentRef = useRef(0);
    const lastDisplayUpdateRef = useRef(0);

    const [isPlaying, setIsPlaying] = useState(true);
    const [wavelength, setWavelength] = useState(400);
    const [intensity, setIntensity] = useState(55);
    const [materialId, setMaterialId] = useState<MaterialId>('na');
    const [voltage, setVoltage] = useState(0);
    const [graphVisible, setGraphVisible] = useState(true);
    const [displayCurrent, setDisplayCurrent] = useState(0);

    const material = useMemo(
        () => MATERIALS.find(item => item.id === materialId) ?? MATERIALS[2],
        [materialId]
    );

    const photonEnergy = HC_EV_NM / wavelength;
    const kMax = Math.max(0, photonEnergy - material.workFunction);
    const thresholdWavelength = HC_EV_NM / material.workFunction;
    const frequency = C_MS / (wavelength * 1e-9);
    const thresholdFrequency = C_MS / (thresholdWavelength * 1e-9);
    const isAboveThreshold = photonEnergy > material.workFunction;
    const saturationCurrent = isAboveThreshold ? intensity * 0.72 : 0;
    const collectionFraction = isAboveThreshold
        ? voltage >= 0
            ? 1
            : clamp((kMax + voltage) / Math.max(kMax, 0.001), 0, 1)
        : 0;
    const measuredCurrent = saturationCurrent * collectionFraction;

    const snapshotRef = useRef<Snapshot>({
        wavelength,
        intensity,
        voltage,
        material,
        photonEnergy,
        kMax,
        thresholdWavelength,
        thresholdFrequency,
        frequency,
        isAboveThreshold,
        measuredCurrent,
        smoothedCurrent: 0,
        graphVisible,
        isPlaying
    });

    useEffect(() => {
        snapshotRef.current = {
            wavelength,
            intensity,
            voltage,
            material,
            photonEnergy,
            kMax,
            thresholdWavelength,
            thresholdFrequency,
            frequency,
            isAboveThreshold,
            measuredCurrent,
            smoothedCurrent: smoothedCurrentRef.current,
            graphVisible,
            isPlaying
        };
    }, [
        frequency,
        graphVisible,
        intensity,
        isAboveThreshold,
        isPlaying,
        kMax,
        material,
        measuredCurrent,
        photonEnergy,
        thresholdFrequency,
        thresholdWavelength,
        voltage,
        wavelength
    ]);

    const clearParticles = useCallback(() => {
        photonsRef.current = [];
        electronsRef.current = [];
        flashesRef.current = [];
        spawnAccumulatorRef.current = 0;
        smoothedCurrentRef.current = 0;
        lastDisplayUpdateRef.current = 0;
        setDisplayCurrent(0);
    }, []);

    const handleReset = useCallback(() => {
        setWavelength(400);
        setIntensity(55);
        setVoltage(0);
        setMaterialId('na');
        setGraphVisible(true);
        setIsPlaying(true);
        clearParticles();
    }, [clearParticles]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        if (!canvas || !parent) return;

        const resizeCanvas = () => {
            const rect = parent.getBoundingClientRect();
            canvas.width = Math.max(1, Math.round(rect.width));
            canvas.height = Math.max(1, Math.round(rect.height));
        };

        resizeCanvas();

        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', resizeCanvas);
            return () => window.removeEventListener('resize', resizeCanvas);
        }

        const observer = new ResizeObserver(resizeCanvas);
        observer.observe(parent);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        let lastTime = performance.now();

        const render = (timeMs: number) => {
            const snapshot = snapshotRef.current;
            const width = canvas.width;
            const height = canvas.height;
            const dt = Math.min((timeMs - lastTime) / 1000, 0.1);
            lastTime = timeMs;

            if (width <= 1 || height <= 1) {
                animationRef.current = requestAnimationFrame(render);
                return;
            }

            if (snapshot.isPlaying) updateSimulation(dt, width, height, snapshot);
            smoothedCurrentRef.current = smoothedCurrentRef.current * 0.92 + snapshot.measuredCurrent * 0.08;
            snapshotRef.current.smoothedCurrent = smoothedCurrentRef.current;
            if (timeMs - lastDisplayUpdateRef.current > 100) {
                lastDisplayUpdateRef.current = timeMs;
                setDisplayCurrent(smoothedCurrentRef.current);
            }

            drawScene(ctx, width, height, timeMs / 1000, snapshot);

            if (snapshotRef.current.isPlaying) {
                animationRef.current = requestAnimationFrame(render);
            } else {
                animationRef.current = null;
            }
        };

        if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(render);

        return () => {
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        };
    }, [isPlaying]);

    const updateSimulation = (dt: number, width: number, height: number, snapshot: Snapshot) => {
        const geometry = getGeometry(width, height);
        const photonRate = 5 + (snapshot.intensity / 100) * 34;
        spawnAccumulatorRef.current += photonRate * dt;

        while (spawnAccumulatorRef.current >= 1) {
            spawnAccumulatorRef.current -= 1;
            const targetY = geometry.tubeY + 80 + Math.random() * (geometry.tubeH - 160);
            photonsRef.current.push({
                id: photonIdRef.current++,
                x: geometry.tubeX - 130 - Math.random() * 70,
                y: targetY + (Math.random() - 0.5) * 26,
                targetY,
                speed: 520 + Math.random() * 110
            });
        }

        for (let i = photonsRef.current.length - 1; i >= 0; i--) {
            const photon = photonsRef.current[i];
            const dx = geometry.emitterX - 8 - photon.x;
            const dy = photon.targetY - photon.y;
            const distance = Math.max(1, Math.hypot(dx, dy));

            photon.x += (dx / distance) * photon.speed * dt;
            photon.y += (dy / distance) * photon.speed * dt;

            if (photon.x >= geometry.emitterX - 9) {
                flashesRef.current.push({
                    id: flashIdRef.current++,
                    x: geometry.emitterX - 12,
                    y: photon.y,
                    age: 0,
                    duration: 0.2,
                    color: snapshot.isAboveThreshold ? 'rgba(250, 204, 21, 0.9)' : 'rgba(148, 163, 184, 0.55)',
                    radius: snapshot.isAboveThreshold ? 38 : 24
                });

                if (snapshot.isAboveThreshold) {
                    const kInitial = Math.max(0.035, Math.random() * snapshot.kMax);
                    electronsRef.current.push({
                        id: electronIdRef.current++,
                        x: geometry.emitterX + 12,
                        y: photon.y + (Math.random() - 0.5) * 12,
                        vy: (Math.random() - 0.5) * 48,
                        kInitial,
                        returning: false,
                        trail: []
                    });
                }

                photonsRef.current.splice(i, 1);
            }
        }

        const gap = geometry.collectorX - geometry.emitterX;
        for (let i = electronsRef.current.length - 1; i >= 0; i--) {
            const electron = electronsRef.current[i];
            const progress = clamp((electron.x - geometry.emitterX) / gap, 0, 1);
            const kineticAtPosition = electron.kInitial + snapshot.voltage * progress;

            if (!electron.returning && snapshot.voltage < 0 && kineticAtPosition <= 0.018 && progress > 0.02) {
                electron.returning = true;
            }

            const direction = electron.returning ? -1 : 1;
            const effectiveKinetic = Math.max(0.035, electron.kInitial + snapshot.voltage * progress);
            const speed = 105 + Math.sqrt(effectiveKinetic) * 225;

            electron.x += direction * speed * dt;
            electron.y += electron.vy * dt;
            electron.vy *= 0.993;
            electron.trail.push({ x: electron.x, y: electron.y });
            if (electron.trail.length > 12) electron.trail.shift();

            if (electron.x >= geometry.collectorX - 4 && !electron.returning) {
                flashesRef.current.push({
                    id: flashIdRef.current++,
                    x: geometry.collectorX - 7,
                    y: electron.y,
                    age: 0,
                    duration: 0.18,
                    color: 'rgba(96, 165, 250, 0.88)',
                    radius: 30
                });
                electronsRef.current.splice(i, 1);
                continue;
            }

            if (
                (electron.returning && electron.x <= geometry.emitterX + 2) ||
                electron.y < geometry.tubeY + 24 ||
                electron.y > geometry.tubeY + geometry.tubeH - 24 ||
                electron.x > geometry.tubeX + geometry.tubeW + 70
            ) {
                electronsRef.current.splice(i, 1);
            }
        }

        for (let i = flashesRef.current.length - 1; i >= 0; i--) {
            flashesRef.current[i].age += dt;
            if (flashesRef.current[i].age >= flashesRef.current[i].duration) {
                flashesRef.current.splice(i, 1);
            }
        }
    };

    const getGeometry = (width: number, height: number) => {
        const tubeW = width * 0.72;
        const tubeH = height * 0.43;
        const tubeX = width * 0.135;
        const tubeY = height * 0.15;
        const emitterX = tubeX + tubeW * 0.19;
        const collectorX = tubeX + tubeW * 0.82;
        return {
            tubeX,
            tubeY,
            tubeW,
            tubeH,
            emitterX,
            collectorX,
            plateTop: tubeY + tubeH * 0.19,
            plateH: tubeH * 0.62,
            circuitY: tubeY + tubeH + height * 0.16,
            centerY: tubeY + tubeH / 2
        };
    };

    const drawScene = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        time: number,
        snapshot: Snapshot
    ) => {
        const geometry = getGeometry(width, height);

        ctx.clearRect(0, 0, width, height);
        drawBackground(ctx, width, height);
        drawApparatus(ctx, width, height, time, geometry, snapshot);
        drawParticles(ctx, snapshot);
        drawCircuit(ctx, width, height, geometry, snapshot);
    };

    const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += 48) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += 48) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        const glow = ctx.createRadialGradient(width * 0.18, height * 0.16, 0, width * 0.18, height * 0.16, width * 0.6);
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.10)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
    };

    const drawApparatus = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        time: number,
        geometry: ReturnType<typeof getGeometry>,
        snapshot: Snapshot
    ) => {
        const { tubeX, tubeY, tubeW, tubeH, emitterX, collectorX, plateTop, plateH, centerY } = geometry;

        ctx.save();
        const glassGradient = ctx.createLinearGradient(tubeX, tubeY, tubeX, tubeY + tubeH);
        glassGradient.addColorStop(0, 'rgba(226, 232, 240, 0.18)');
        glassGradient.addColorStop(0.5, 'rgba(125, 211, 252, 0.05)');
        glassGradient.addColorStop(1, 'rgba(226, 232, 240, 0.12)');
        drawRoundRect(ctx, tubeX, tubeY, tubeW, tubeH, 42);
        ctx.fillStyle = glassGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.62)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        const highlightX = tubeX + ((time * 28) % (tubeW + 120)) - 60;
        const highlight = ctx.createLinearGradient(highlightX - 80, tubeY, highlightX + 80, tubeY);
        highlight.addColorStop(0, 'rgba(255,255,255,0)');
        highlight.addColorStop(0.5, 'rgba(255,255,255,0.15)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');
        drawRoundRect(ctx, tubeX + 12, tubeY + 16, tubeW - 24, 28, 14);
        ctx.fillStyle = highlight;
        ctx.fill();

        const windowX = tubeX + 24;
        const windowY = centerY - 74;
        drawRoundRect(ctx, windowX, windowY, 76, 148, 22);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.16)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        drawLabel(ctx, 'Quartz window', windowX + 38, windowY + 170, '#7dd3fc', 'center', '11px Inter, ui-sans-serif');

        const plateGradient = ctx.createLinearGradient(0, plateTop, 0, plateTop + plateH);
        plateGradient.addColorStop(0, '#f8fafc');
        plateGradient.addColorStop(0.42, '#94a3b8');
        plateGradient.addColorStop(1, '#e2e8f0');

        ctx.fillStyle = plateGradient;
        drawRoundRect(ctx, emitterX - 10, plateTop, 22, plateH, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.stroke();

        ctx.fillStyle = plateGradient;
        drawRoundRect(ctx, collectorX - 10, plateTop, 22, plateH, 7);
        ctx.fill();
        ctx.stroke();

        drawLabel(ctx, `Emitter C: ${snapshot.material.name} (${snapshot.material.symbol})`, emitterX, plateTop + plateH + 28, '#0f172a', 'center', 'bold 13px Inter, ui-sans-serif');
        drawLabel(ctx, `Φ0 = ${snapshot.material.workFunction.toFixed(2)} eV`, emitterX, plateTop + plateH + 48, '#fbbf24', 'center', '12px Inter, ui-sans-serif');
        drawLabel(ctx, 'Collector (A)', collectorX, plateTop + plateH + 34, '#1d4ed8', 'center', 'bold 13px Inter, ui-sans-serif');

        const beamColor = wavelengthColor(snapshot.wavelength, 0.45);
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([8, 8]);
        for (let y = centerY - 58; y <= centerY + 58; y += 29) {
            ctx.beginPath();
            ctx.moveTo(tubeX - 100, y);
            ctx.lineTo(emitterX - 14, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        drawLabel(ctx, 'Incident light', tubeX - 72, centerY - 86, wavelengthColor(snapshot.wavelength, 0.95), 'left', '12px Inter, ui-sans-serif');

        if (snapshot.isAboveThreshold) {
            const emitterGlow = ctx.createRadialGradient(emitterX - 10, centerY, 4, emitterX - 10, centerY, 92);
            emitterGlow.addColorStop(0, 'rgba(250, 204, 21, 0.25)');
            emitterGlow.addColorStop(1, 'rgba(250, 204, 21, 0)');
            ctx.fillStyle = emitterGlow;
            ctx.beginPath();
            ctx.arc(emitterX - 10, centerY, 92, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    const drawParticles = (ctx: CanvasRenderingContext2D, snapshot: Snapshot) => {
        const photonColor = wavelengthColor(snapshot.wavelength, 1);

        for (const photon of photonsRef.current) {
            ctx.save();
            ctx.shadowColor = photonColor;
            ctx.shadowBlur = 14;
            for (let i = 4; i >= 1; i--) {
                ctx.fillStyle = wavelengthColor(snapshot.wavelength, 0.11 * (5 - i));
                ctx.beginPath();
                ctx.arc(photon.x - i * 10, photon.y, 3.5 - i * 0.35, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = photonColor;
            ctx.beginPath();
            ctx.arc(photon.x, photon.y, 4.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        for (const electron of electronsRef.current) {
            ctx.save();
            for (let i = 1; i < electron.trail.length; i++) {
                const point = electron.trail[i];
                const opacity = i / electron.trail.length;
                ctx.fillStyle = `rgba(254, 240, 138, ${0.09 + opacity * 0.32})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 1.1 + opacity * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowColor = '#fde047';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(electron.x, electron.y, 2.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        for (const flash of flashesRef.current) {
            const t = clamp(flash.age / flash.duration, 0, 1);
            const radius = flash.radius * (0.35 + t);
            const gradient = ctx.createRadialGradient(flash.x, flash.y, 1, flash.x, flash.y, radius);
            gradient.addColorStop(0, flash.color.replace('0.9', `${0.55 * (1 - t)}`).replace('0.88', `${0.5 * (1 - t)}`).replace('0.55', `${0.35 * (1 - t)}`));
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const drawCircuit = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        geometry: ReturnType<typeof getGeometry>,
        snapshot: Snapshot
    ) => {
        const { emitterX, collectorX, plateTop, plateH, circuitY } = geometry;
        const wireColor = 'rgba(51, 65, 85, 0.72)';
        const ammeterX = width * 0.39;
        const batteryX = width * 0.55;
        const commutatorX = width * 0.66;
        const voltmeterX = width * 0.78;

        ctx.save();
        ctx.strokeStyle = wireColor;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(emitterX, plateTop + plateH);
        ctx.lineTo(emitterX, circuitY);
        ctx.lineTo(ammeterX - 46, circuitY);
        ctx.moveTo(ammeterX + 46, circuitY);
        ctx.lineTo(batteryX - 54, circuitY);
        ctx.moveTo(batteryX + 54, circuitY);
        ctx.lineTo(commutatorX - 42, circuitY);
        ctx.moveTo(commutatorX + 42, circuitY);
        ctx.lineTo(collectorX, circuitY);
        ctx.lineTo(collectorX, plateTop + plateH);
        ctx.stroke();

        drawGauge(ctx, ammeterX, circuitY, 45, 'µA', smoothedCurrentRef.current, 72, '#fbbf24');
        drawGauge(ctx, voltmeterX, circuitY, 38, 'V', Math.abs(snapshot.voltage), 10, snapshot.voltage < 0 ? '#fb7185' : '#34d399');

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(batteryX - 18, circuitY - 26);
        ctx.lineTo(batteryX - 18, circuitY + 26);
        ctx.moveTo(batteryX + 10, circuitY - 15);
        ctx.lineTo(batteryX + 10, circuitY + 15);
        ctx.stroke();
        drawLabel(ctx, 'Variable battery', batteryX, circuitY + 48, '#cbd5e1', 'center', '11px Inter, ui-sans-serif');
        drawLabel(ctx, `${snapshot.voltage >= 0 ? '+' : ''}${snapshot.voltage.toFixed(1)} V`, batteryX, circuitY - 48, snapshot.voltage < 0 ? '#fb7185' : '#34d399', 'center', 'bold 13px Inter, ui-sans-serif');

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(commutatorX, circuitY, 31, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(commutatorX - 19, circuitY + 15);
        ctx.lineTo(commutatorX + 20, circuitY - 14);
        ctx.stroke();
        drawLabel(ctx, 'Commutator', commutatorX, circuitY + 48, '#cbd5e1', 'center', '11px Inter, ui-sans-serif');

        const collectorPolarity = snapshot.voltage >= 0 ? '+' : '-';
        const emitterPolarity = snapshot.voltage >= 0 ? '-' : '+';
        drawLabel(ctx, emitterPolarity, emitterX - 28, plateTop + plateH + 14, '#e2e8f0', 'center', 'bold 16px Inter, ui-sans-serif');
        drawLabel(ctx, collectorPolarity, collectorX + 28, plateTop + plateH + 14, snapshot.voltage < 0 ? '#fb7185' : '#34d399', 'center', 'bold 16px Inter, ui-sans-serif');
        ctx.restore();
    };

    const drawGauge = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        radius: number,
        label: string,
        value: number,
        max: number,
        needleColor: string
    ) => {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius - 13, Math.PI * 0.78, Math.PI * 2.22);
        ctx.stroke();

        const ratio = clamp(value / max, 0, 1);
        const angle = Math.PI * 0.78 + ratio * Math.PI * 1.44;
        ctx.strokeStyle = needleColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * (radius - 15), y + Math.sin(angle) * (radius - 15));
        ctx.stroke();
        ctx.fillStyle = needleColor;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        drawLabel(ctx, label, x, y + 18, '#f8fafc', 'center', 'bold 13px Inter, ui-sans-serif');
        drawLabel(ctx, value.toFixed(label === 'V' ? 1 : 1), x, y - 15, needleColor, 'center', 'bold 11px Inter, ui-sans-serif');
        ctx.restore();
    };

    const sliderPercent = (value: number, min: number, max: number) => `${clamp(((value - min) / (max - min)) * 100, 0, 100)}%`;
    const thresholdMarkerPercent = sliderPercent(thresholdWavelength, MIN_WAVELENGTH, MAX_WAVELENGTH);
    const stoppingMarkerPercent = sliderPercent(-kMax, MIN_VOLTAGE, MAX_VOLTAGE);
    const photonSwatch = wavelengthColor(wavelength, 1);
    const readoutItems = [
        { label: 'Photon Energy', value: `${photonEnergy.toFixed(2)} eV`, color: 'text-sky-500', bg: 'bg-sky-50' },
        { label: 'Work Function', value: `${material.workFunction.toFixed(2)} eV`, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Max K.E.', value: `${kMax.toFixed(2)} eV`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: '|V0|', value: `${kMax.toFixed(2)} V`, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Threshold λ0', value: `${thresholdWavelength.toFixed(0)} nm`, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Photocurrent', value: `${displayCurrent.toFixed(1)} µA`, color: 'text-yellow-700', bg: 'bg-yellow-50' }
    ];

    const renderGraph = (mode: GraphMode) => {
        const graphW = 284;
        const graphH = 180;
        const xMin = 3;
        const xMax = 22;
        const vMin = -6.5;
        const vMax = 16;
        const mapX = (nu14: number) => ((nu14 - xMin) / (xMax - xMin)) * graphW;
        const mapY = (value: number) => graphH - ((value - vMin) / (vMax - vMin)) * graphH;
        const selectedNu14 = frequency / 1e14;
        const thresholdNu14 = thresholdFrequency / 1e14;
        const currentPoint = { x: mapX(selectedNu14), y: mapY(kMax) };
        const thresholdX = mapX(thresholdNu14);
        const workY = mapY(-material.workFunction);

        if (mode === 'iv') {
            const mapVoltageX = (value: number) => ((value - MIN_VOLTAGE) / (MAX_VOLTAGE - MIN_VOLTAGE)) * graphW;
            const mapCurrentY = (value: number) => graphH - (value / 74) * graphH;
            const makeCurve = (sampleIntensity: number) => {
                const sat = isAboveThreshold ? sampleIntensity * 0.72 : 0;
                return Array.from({ length: 74 }, (_, index) => {
                    const sampleVoltage = MIN_VOLTAGE + ((MAX_VOLTAGE - MIN_VOLTAGE) * index) / 73;
                    const fraction = sampleVoltage >= 0 ? 1 : clamp((kMax + sampleVoltage) / Math.max(kMax, 0.001), 0, 1);
                    return `${index === 0 ? 'M' : 'L'} ${mapVoltageX(sampleVoltage).toFixed(1)} ${mapCurrentY(sat * fraction).toFixed(1)}`;
                }).join(' ');
            };

            return (
                <svg viewBox={`0 0 ${graphW + 58} ${graphH + 58}`} className="h-[238px] w-full">
                    <g transform="translate(38 12)">
                        <path d={`M0 0V${graphH}H${graphW}`} fill="none" stroke="rgba(15,23,42,0.48)" strokeWidth="1.4" />
                        {[1, 2, 3].map(line => (
                            <line key={line} x1="0" x2={graphW} y1={(graphH * line) / 4} y2={(graphH * line) / 4} stroke="rgba(15,23,42,0.10)" />
                        ))}
                        {[30, 60, 100].map(sampleIntensity => (
                            <path
                                key={sampleIntensity}
                                d={makeCurve(sampleIntensity)}
                                fill="none"
                                stroke={sampleIntensity === 60 ? '#facc15' : 'rgba(125,211,252,0.68)'}
                                strokeWidth={sampleIntensity === 60 ? 3 : 1.8}
                            />
                        ))}
                        <line x1={mapVoltageX(-kMax)} x2={mapVoltageX(-kMax)} y1="0" y2={graphH} stroke="#fb7185" strokeDasharray="6 7" strokeWidth="1.3" />
                        <text x={mapVoltageX(-kMax)} y={graphH + 18} textAnchor="middle" className="fill-rose-300 text-[11px] font-bold">-V0</text>
                        <text x={graphW / 2} y={graphH + 39} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">Applied voltage V</text>
                        <text x="-30" y="-3" className="fill-slate-700 text-[11px] font-semibold">I</text>
                    </g>
                </svg>
            );
        }

        const makeLine = (item: typeof MATERIALS[number]) => Array.from({ length: 74 }, (_, index) => {
            const nu14 = xMin + ((xMax - xMin) * index) / 73;
            const stopping = H_EV_S * (nu14 * 1e14) - item.workFunction;
            return `${index === 0 ? 'M' : 'L'} ${mapX(nu14).toFixed(1)} ${mapY(stopping).toFixed(1)}`;
        }).join(' ');

        return (
                <svg viewBox={`0 0 ${graphW + 58} ${graphH + 58}`} className="h-[238px] w-full">
                <g transform="translate(38 12)">
                    <path d={`M0 0V${graphH}H${graphW}`} fill="none" stroke="rgba(15,23,42,0.48)" strokeWidth="1.4" />
                    {[1, 2, 3].map(line => (
                        <line key={line} x1="0" x2={graphW} y1={(graphH * line) / 4} y2={(graphH * line) / 4} stroke="rgba(15,23,42,0.10)" />
                    ))}
                    {MATERIALS.map(item => (
                        <path
                            key={item.id}
                            d={makeLine(item)}
                            fill="none"
                            stroke={item.id === material.id ? '#facc15' : `${item.color}88`}
                            strokeWidth={item.id === material.id ? 3.2 : 1.8}
                        />
                    ))}
                    <line x1={thresholdX} x2={thresholdX} y1="0" y2={graphH} stroke="#fb7185" strokeDasharray="6 7" strokeWidth="1.3" />
                    <line x1="0" x2={graphW} y1={workY} y2={workY} stroke="#fb7185" strokeDasharray="6 7" strokeWidth="1.3" />
                    <circle cx={currentPoint.x} cy={currentPoint.y} r="5" className="fill-slate-900" />
                    <text x={thresholdX} y={graphH + 18} textAnchor="middle" className="fill-rose-300 text-[11px] font-bold">ν0</text>
                    <text x="3" y={workY - 7} className="fill-rose-300 text-[11px]">-Φ0/e</text>
                    <text x={graphW / 2} y={graphH + 39} textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">ν (x10^14 Hz)</text>
                    <text x="-31" y="-3" className="fill-slate-700 text-[11px] font-semibold">V0</text>
                </g>
            </svg>
        );
    };

    const equationPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-4 z-20 hidden w-[292px] xl:block">
            <div className="rounded-xl border border-purple-200 bg-purple-50/95 p-3 text-purple-950 shadow-xl backdrop-blur">
                <div className="text-sm font-bold">Einstein's equation</div>
                <div className="mt-1 font-mono text-lg font-bold">Kmax = hν - Φ0</div>
                <div className="mt-2 space-y-1 text-[11px] leading-snug text-purple-900">
                    <p>• Emission only if hν &gt; Φ0.</p>
                    <p>• Intensity changes current, not maximum energy.</p>
                    <p className="font-semibold text-purple-700">Hertz observed the effect in 1887.</p>
                </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white/95 p-3 text-slate-900 shadow-xl backdrop-blur">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Real-time values</h3>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Live</span>
                </div>
                <div className="grid gap-2">
                    {readoutItems.map(item => (
                        <div key={item.label} className={`rounded-lg border border-slate-100 ${item.bg} px-3 py-2`}>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
                            <div className={`mt-0.5 font-mono text-sm font-bold ${item.color}`}>{item.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-4 z-20 hidden w-[340px] xl:block">
            {graphVisible && (
                <div className="flex flex-col gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                        <div className="mb-1">
                            <div className="text-sm font-extrabold text-slate-950">
                                Stopping potential vs frequency
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-slate-600">
                                Parallel lines: slope = h/e
                            </div>
                        </div>
                        {renderGraph('vnu')}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
                        <div className="mb-1">
                            <div className="text-sm font-extrabold text-slate-950">
                                Photocurrent vs voltage
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-slate-600">
                                Same V0, different saturation current
                            </div>
                        </div>
                        {renderGraph('iv')}
                    </div>
                </div>
            )}
        </aside>
    );

    const simulationCombo = (
        <div className="relative flex h-full w-full flex-col overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            </div>

            <div className="absolute right-4 top-4 flex gap-2">
                <button
                    type="button"
                    onClick={() => setIsPlaying(value => !value)}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                    title="Reset"
                >
                    <RotateCcw size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => setGraphVisible(value => !value)}
                    className={`rounded-lg border p-2 shadow transition-colors ${
                        graphVisible
                            ? 'border-sky-300 bg-sky-50 text-sky-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    title="Toggle graph"
                >
                    <BarChart3 size={18} />
                </button>
            </div>

            {graphPanel}
            {equationPanel}
        </div>
    );

    const controlsCombo = (
        <div className="flex h-full w-full flex-col gap-4 text-slate-900">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                        <span className="flex items-center gap-2"><Target size={14} /> Target material</span>
                        <span className="text-amber-600">Φ0 = {material.workFunction.toFixed(2)} eV</span>
                    </label>
                    <select
                        value={materialId}
                        onChange={(event) => {
                            setMaterialId(event.target.value as MaterialId);
                            clearParticles();
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-purple-400"
                    >
                        {MATERIALS.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name} ({item.symbol}) - Φ0 = {item.workFunction.toFixed(2)} eV
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                        <span className="flex items-center gap-2"><Zap size={14} /> Wavelength λ</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-800" style={{ color: photonSwatch }}>{wavelength} nm</span>
                    </label>
                    <div className="relative pt-3">
                        <div
                            className="pointer-events-none absolute top-0 h-5 w-px -translate-x-1/2 bg-violet-600"
                            style={{ left: thresholdMarkerPercent }}
                            title="Threshold wavelength"
                        >
                            <span className="absolute left-1 top-[-2px] whitespace-nowrap rounded bg-violet-50 px-1 text-[9px] font-bold text-violet-700">λ0</span>
                        </div>
                        <input
                            type="range"
                            min={MIN_WAVELENGTH}
                            max={MAX_WAVELENGTH}
                            step={5}
                            value={wavelength}
                            onChange={(event) => {
                                setWavelength(Number(event.target.value));
                                clearParticles();
                            }}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg"
                            style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb, #16a34a, #eab308, #dc2626)' }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                        <span>UV (Higher Energy)</span>
                        <span>Red (Lower Energy)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">ν = {formatFrequency(frequency)} · λ0 = {thresholdWavelength.toFixed(0)} nm</p>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                        <span>Light intensity</span>
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-amber-700">{intensity}%</span>
                    </label>
                    <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={intensity}
                        onChange={(event) => setIntensity(Number(event.target.value))}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-500"
                    />
                    <p className="text-[11px] text-slate-500">Intensity ∝ number of photons. It changes saturation current but not stopping potential.</p>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                        <span>Applied voltage</span>
                        <span className={`rounded-md px-2 py-0.5 font-mono ${voltage < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {voltage >= 0 ? '+' : ''}{voltage.toFixed(1)} V
                        </span>
                    </label>
                    <div className="relative pt-3">
                        <div
                            className="pointer-events-none absolute top-0 h-5 w-px -translate-x-1/2 bg-rose-600"
                            style={{ left: stoppingMarkerPercent }}
                            title="Stopping potential"
                        >
                            <span className="absolute left-1 top-[-2px] whitespace-nowrap rounded bg-rose-50 px-1 text-[9px] font-bold text-rose-700">-V0</span>
                        </div>
                        <input
                            type="range"
                            min={MIN_VOLTAGE}
                            max={MAX_VOLTAGE}
                            step={0.1}
                            value={voltage}
                            onChange={(event) => setVoltage(Number(event.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg"
                            style={{ background: 'linear-gradient(to right, #e11d48 0%, #fda4af 49%, #cbd5e1 50%, #86efac 51%, #16a34a 100%)' }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                        <span>Retarding (-)</span>
                        <span>Accelerating (+)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">At V = -V0, electrons are still emitted but even the fastest turn back.</p>
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

export default PhotoelectricLab;
