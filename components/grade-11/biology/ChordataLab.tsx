import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Eye, EyeOff, HeartPulse, Layers, Microscope, Pause, Play, RotateCcw, SlidersHorizontal } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type ViewMode = 'features' | 'subphyla' | 'vertebrate' | 'heart';
type Subphylum = 'urochordata' | 'cephalochordata' | 'vertebrata';
type FeatureKey = 'all' | 'notochord' | 'nerveCord' | 'gillSlits' | 'tail';
type HeartClass = 'fish' | 'amphibia' | 'reptilia' | 'aves' | 'mammalia';

interface ChordataLabProps {
    topic: any;
    onExit: () => void;
}

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 760;

const VIEW_MODES: Array<{ id: ViewMode; label: string }> = [
    { id: 'features', label: 'Features' },
    { id: 'subphyla', label: 'Subphyla' },
    { id: 'heart', label: 'Heart' },
];

const SUBPHYLA: Array<{ id: Subphylum; label: string; short: string; example: string; tone: string }> = [
    { id: 'urochordata', label: 'Urochordata', short: 'Larval tail only', example: 'Ascidia, Salpa, Doliolum', tone: '#0f766e' },
    { id: 'cephalochordata', label: 'Cephalochordata', short: 'Head-to-tail, lifelong', example: 'Branchiostoma', tone: '#0369a1' },
    { id: 'vertebrata', label: 'Vertebrata', short: 'Embryo to vertebral column', example: 'Fishes to mammals', tone: '#7c3aed' },
];

const FEATURES: Array<{ id: FeatureKey; label: string; color: string }> = [
    { id: 'all', label: 'All', color: '#334155' },
    { id: 'notochord', label: 'Notochord', color: '#d97706' },
    { id: 'nerveCord', label: 'Nerve Cord', color: '#0284c7' },
    { id: 'gillSlits', label: 'Gill Slits', color: '#059669' },
    { id: 'tail', label: 'Post-anal Tail', color: '#7c3aed' },
];

const HEART_CLASSES: Array<{ id: HeartClass; label: string; chambers: number; chamberText: string; note: string; color: string }> = [
    { id: 'fish', label: 'Fish', chambers: 2, chamberText: '1 atrium + 1 ventricle', note: 'Single circulation through gills', color: '#0891b2' },
    { id: 'amphibia', label: 'Amphibia', chambers: 3, chamberText: '2 atria + 1 ventricle', note: 'Blood mixes in one ventricle', color: '#d97706' },
    { id: 'reptilia', label: 'Reptilia', chambers: 3, chamberText: 'Usually 3; crocodiles 4', note: 'Crocodiles are the NCERT exception', color: '#16a34a' },
    { id: 'aves', label: 'Aves', chambers: 4, chamberText: '2 atria + 2 ventricles', note: 'Complete separation', color: '#dc2626' },
    { id: 'mammalia', label: 'Mammalia', chambers: 4, chamberText: '2 atria + 2 ventricles', note: 'Complete separation', color: '#be123c' },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ChordataLab: React.FC<ChordataLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);

    const [mode, setMode] = useState<ViewMode>('features');
    const [subphylum, setSubphylum] = useState<Subphylum>('vertebrata');
    const [stage, setStage] = useState(35);
    const [feature, setFeature] = useState<FeatureKey>('all');
    const [heartClass, setHeartClass] = useState<HeartClass>('fish');
    const [speed, setSpeed] = useState(1);
    const [showLabels, setShowLabels] = useState(true);
    const [paused, setPaused] = useState(false);
    const [time, setTime] = useState(0);

    useEffect(() => {
        const animate = (now: number) => {
            if (lastTimeRef.current === null) lastTimeRef.current = now;
            const dt = clamp((now - lastTimeRef.current) / 1000, 0, 0.1);
            lastTimeRef.current = now;
            if (!paused) setTime((previous) => previous + dt * speed);
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [paused, speed]);

    const subphylumData = useMemo(
        () => SUBPHYLA.find((item) => item.id === subphylum) ?? SUBPHYLA[2],
        [subphylum]
    );

    const heartData = useMemo(
        () => HEART_CLASSES.find((item) => item.id === heartClass) ?? HEART_CLASSES[0],
        [heartClass]
    );

    const liveValues = useMemo(() => {
        const stageLabel = stage < 45 ? 'Embryo / larva' : stage < 70 ? 'Transition' : 'Adult';
        const notochordStatus =
            subphylum === 'urochordata'
                ? stage < 45
                    ? 'Larval tail only'
                    : 'Not shown in adult body'
                : subphylum === 'cephalochordata'
                    ? 'Persistent head-to-tail'
                    : stage < 65
                        ? 'Embryonic rod'
                        : 'Replaced by vertebral column';

        return {
            stageLabel,
            notochordStatus,
            subphylum: subphylumData.label,
            heart: `${heartData.chambers} chambers`,
            cue: mode === 'heart' ? heartData.note : subphylumData.short,
        };
    }, [heartData, mode, stage, subphylum, subphylumData]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const focus = (key: FeatureKey) => feature === 'all' || feature === key;
        const alpha = (key: FeatureKey, active = 1, inactive = 0.18) => focus(key) ? active : inactive;

        const drawText = (text: string, x: number, y: number, color = '#334155', size = 18, align: CanvasTextAlign = 'center', weight = 700) => {
            if (!showLabels) return;
            ctx.save();
            ctx.font = `${weight} ${size}px Inter, ui-sans-serif, system-ui`;
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x, y);
            ctx.restore();
        };

        const roundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
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

        const drawBackground = () => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.save();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            for (let x = 80; x <= CANVAS_WIDTH - 80; x += 80) {
                ctx.globalAlpha = x % 160 === 0 ? 0.55 : 0.28;
                ctx.beginPath();
                ctx.moveTo(x, 70);
                ctx.lineTo(x, CANVAS_HEIGHT - 70);
                ctx.stroke();
            }
            for (let y = 80; y <= CANVAS_HEIGHT - 80; y += 80) {
                ctx.globalAlpha = y % 160 === 0 ? 0.55 : 0.28;
                ctx.beginPath();
                ctx.moveTo(80, y);
                ctx.lineTo(CANVAS_WIDTH - 80, y);
                ctx.stroke();
            }
            ctx.restore();

            ctx.save();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            roundedRect(92, 72, CANVAS_WIDTH - 184, CANVAS_HEIGHT - 144, 34);
            ctx.stroke();
            ctx.restore();
        };

        const drawParticles = () => {
            ctx.save();
            for (let i = 0; i < 32; i += 1) {
                const lane = i % 4;
                const x = 300 + ((time * 70 + i * 39) % 520);
                const y = 410 + lane * 18 + Math.sin(time * 2 + i) * 3;
                ctx.globalAlpha = 0.25 + 0.25 * Math.sin(time * 2.3 + i);
                ctx.fillStyle = lane % 2 === 0 ? '#67e8f9' : '#86efac';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        };

        const drawFeatureBody = (centerX = 640, centerY = 376, scale = 1) => {
            const morph = subphylum === 'vertebrata' ? clamp((stage - 40) / 45, 0, 1) : 0;
            const uroAdult = subphylum === 'urochordata' && stage >= 52;
            const ceph = subphylum === 'cephalochordata';
            const bodyColor = ceph ? '#e0f2fe' : subphylum === 'urochordata' ? '#ccfbf1' : '#ede9fe';
            const strokeColor = ceph ? '#38bdf8' : subphylum === 'urochordata' ? '#2dd4bf' : '#a78bfa';

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(scale, scale);

            ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
            ctx.shadowBlur = 16;
            ctx.fillStyle = bodyColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            if (uroAdult) {
                ctx.moveTo(-130, -105);
                ctx.bezierCurveTo(-190, -50, -178, 120, -58, 145);
                ctx.bezierCurveTo(60, 170, 180, 92, 136, -44);
                ctx.bezierCurveTo(98, -162, -54, -176, -130, -105);
            } else {
                ctx.ellipse(-25, 0, 295, 92, Math.sin(time * 0.7) * 0.02, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            if (uroAdult) {
                ctx.save();
                ctx.globalAlpha = alpha('gillSlits', 0.95, 0.14);
                ctx.strokeStyle = '#059669';
                ctx.lineWidth = 8;
                for (let i = 0; i < 6; i += 1) {
                    const y = -42 + i * 22;
                    ctx.beginPath();
                    ctx.moveTo(-62, y);
                    ctx.quadraticCurveTo(-16, y + 10, 36, y);
                    ctx.stroke();
                }
                drawText('pharyngeal gill slits', -12, 132, '#047857', 18);
                ctx.restore();

                ctx.save();
                ctx.globalAlpha = 0.75;
                ctx.fillStyle = '#64748b';
                drawText('adult Urochordata', 0, -172, '#0f766e', 22);
                drawText('notochord only in larval tail', 0, 190, '#64748b', 17);
                ctx.restore();
                ctx.restore();
                return;
            }

            const breathing = Math.sin(time * 2.2) * 2;
            ctx.save();
            ctx.globalAlpha = alpha('notochord', 0.98, 0.16);
            ctx.lineCap = 'round';
            if (morph > 0.52) {
                const count = 16;
                for (let i = 0; i < count; i += 1) {
                    const x = -222 + i * 29;
                    const h = 22 + Math.sin(time * 3 + i) * 1.8;
                    ctx.fillStyle = '#cbd5e1';
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 2;
                    roundedRect(x, -10 - h / 2, 21, h, 6);
                    ctx.fill();
                    ctx.stroke();
                }
                drawText('vertebral column', 0, -45, '#475569', 18);
            } else {
                ctx.strokeStyle = '#d97706';
                ctx.lineWidth = 15;
                ctx.beginPath();
                ctx.moveTo(-242, 6);
                ctx.quadraticCurveTo(0, breathing, 245, 8);
                ctx.stroke();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(-242, 6);
                ctx.quadraticCurveTo(0, breathing, 245, 8);
                ctx.stroke();
                drawText('notochord', 0, -32, '#92400e', 18);
            }
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = alpha('nerveCord', 0.96, 0.16);
            ctx.strokeStyle = '#0369a1';
            ctx.lineWidth = 17;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-240, -54);
            ctx.quadraticCurveTo(0, -68 + Math.sin(time * 1.7) * 3, 238, -56);
            ctx.stroke();
            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(-240, -54);
            ctx.quadraticCurveTo(0, -68 + Math.sin(time * 1.7) * 3, 238, -56);
            ctx.stroke();
            for (let i = 0; i < 5; i += 1) {
                const px = -218 + ((time * 112 + i * 90) % 446);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px, -59 + Math.sin(time * 2 + i) * 2, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            drawText('dorsal hollow nerve cord', -8, -100, '#075985', 18);
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = alpha('gillSlits', 0.96, 0.16);
            ctx.strokeStyle = subphylum === 'vertebrata' && stage > 70 ? '#94a3b8' : '#059669';
            ctx.lineWidth = 7;
            ctx.lineCap = 'round';
            for (let i = 0; i < 5; i += 1) {
                const x = -188 + i * 25;
                ctx.beginPath();
                ctx.moveTo(x, 33);
                ctx.lineTo(x + 6, 77);
                ctx.stroke();
            }
            drawText(subphylum === 'vertebrata' && stage > 70 ? 'gill slits: embryonic cue' : 'pharyngeal gill slits', -136, 108, '#047857', 17);
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = alpha('tail', 0.96, 0.16);
            ctx.strokeStyle = '#7c3aed';
            ctx.fillStyle = '#ddd6fe';
            ctx.lineWidth = 4;
            ctx.setLineDash([7, 7]);
            ctx.beginPath();
            ctx.moveTo(192, -62);
            ctx.lineTo(192, 76);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(196, 0);
            ctx.bezierCurveTo(260, -50, 328, -28, 360, 2);
            ctx.bezierCurveTo(326, 34, 260, 50, 196, 0);
            ctx.fill();
            ctx.stroke();
            drawText('anus', 192, 98, '#6d28d9', 15);
            drawText('post-anal tail', 294, -56, '#5b21b6', 18);
            ctx.restore();

            if (subphylum === 'vertebrata') {
                ctx.save();
                ctx.globalAlpha = clamp((stage - 28) / 60, 0, 1);
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-8, 76);
                ctx.lineTo(-54, 132);
                ctx.moveTo(36, 76);
                ctx.lineTo(96, 132);
                ctx.stroke();
                drawText('paired appendages', 20, 162, '#334155', 15);
                ctx.restore();
            }

            ctx.restore();
        };

        const drawSubphylaTriptych = () => {
            drawText('Subphyla of Chordata', 640, 184, '#0f172a', 25);
            drawText('Urochordata and Cephalochordata are protochordates; Vertebrata forms the vertebral column', 640, 214, '#64748b', 16, 'center', 600);

            SUBPHYLA.forEach((item, index) => {
                const x = 255 + index * 385;
                const selected = item.id === subphylum;
                ctx.save();
                ctx.globalAlpha = selected ? 1 : 0.55;
                ctx.strokeStyle = selected ? item.tone : '#cbd5e1';
                ctx.fillStyle = '#ffffff';
                ctx.lineWidth = selected ? 4 : 2;
                roundedRect(x - 160, 242, 320, 370, 28);
                ctx.fill();
                ctx.stroke();
                drawText(item.label, x, 278, item.tone, selected ? 22 : 20);
                drawText(item.short, x, 306, '#64748b', 14);
                drawText(item.example, x, 582, '#475569', 14);
                ctx.restore();
            });

            const bodyConfigs: Array<{ sub: Subphylum; st: number; x: number }> = [
                { sub: 'urochordata', st: stage, x: 255 },
                { sub: 'cephalochordata', st: 20, x: 640 },
                { sub: 'vertebrata', st: stage, x: 1025 },
            ];

            bodyConfigs.forEach((config) => {
                const localSub = config.sub;
                const localStage = config.st;
                const morph = localSub === 'vertebrata' ? clamp((localStage - 40) / 45, 0, 1) : 0;
                const uroAdult = localSub === 'urochordata' && localStage >= 52;

                ctx.save();
                ctx.beginPath();
                roundedRect(config.x - 145, 330, 290, 210, 24);
                ctx.clip();
                ctx.translate(config.x, 430);
                ctx.scale(0.43, 0.43);
                const bodyColor = localSub === 'cephalochordata' ? '#e0f2fe' : localSub === 'urochordata' ? '#ccfbf1' : '#ede9fe';
                const strokeColor = localSub === 'cephalochordata' ? '#38bdf8' : localSub === 'urochordata' ? '#2dd4bf' : '#a78bfa';
                ctx.fillStyle = bodyColor;
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 5;
                ctx.beginPath();
                if (uroAdult) {
                    ctx.ellipse(0, 0, 112, 154, 0.1, 0, Math.PI * 2);
                } else {
                    ctx.ellipse(-18, 0, 245, 82, 0, 0, Math.PI * 2);
                }
                ctx.fill();
                ctx.stroke();

                ctx.lineCap = 'round';
                if (!uroAdult) {
                    if (morph > 0.52) {
                        for (let i = 0; i < 12; i += 1) {
                            ctx.fillStyle = '#cbd5e1';
                            ctx.strokeStyle = '#64748b';
                            roundedRect(-176 + i * 29, -8, 20, 21, 5);
                            ctx.fill();
                            ctx.stroke();
                        }
                    } else {
                        ctx.strokeStyle = '#d97706';
                        ctx.lineWidth = 13;
                        ctx.beginPath();
                        ctx.moveTo(-195, 6);
                        ctx.lineTo(198, 7);
                        ctx.stroke();
                    }
                    ctx.strokeStyle = '#0284c7';
                    ctx.lineWidth = 13;
                    ctx.beginPath();
                    ctx.moveTo(-194, -48);
                    ctx.lineTo(195, -48);
                    ctx.stroke();
                    ctx.strokeStyle = '#059669';
                    ctx.lineWidth = 7;
                    for (let i = 0; i < 4; i += 1) {
                        ctx.beginPath();
                        ctx.moveTo(-142 + i * 24, 33);
                        ctx.lineTo(-136 + i * 24, 76);
                        ctx.stroke();
                    }
                } else {
                    ctx.strokeStyle = '#059669';
                    ctx.lineWidth = 10;
                    for (let i = 0; i < 5; i += 1) {
                        ctx.beginPath();
                        ctx.moveTo(-62, -44 + i * 23);
                        ctx.quadraticCurveTo(-14, -34 + i * 23, 42, -44 + i * 23);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            });
        };

        const drawVertebrateTimeline = () => {
            drawFeatureBody(640, 395, 1.05);
        };

        const drawHeart = () => {
            ctx.save();
            ctx.translate(640, 400);

            ctx.fillStyle = '#fff1f2';
            ctx.strokeStyle = '#fecdd3';
            ctx.lineWidth = 3;
            roundedRect(-420, -238, 840, 488, 34);
            ctx.fill();
            ctx.stroke();

            drawText(`${heartData.label}: ${heartData.chambers}-chambered heart`, 0, -198, heartData.color, 28);
            drawText(heartData.chamberText, 0, -160, '#475569', 19);

            ctx.lineWidth = 4;
            ctx.strokeStyle = heartData.color;
            ctx.fillStyle = heartData.color;
            ctx.shadowColor = `${heartData.color}55`;
            ctx.shadowBlur = 14;

            if (heartData.chambers === 2) {
                roundedRect(-112, -86, 224, 100, 26);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                drawText('Atrium', 0, -36, '#ffffff', 23);
                ctx.fillStyle = heartData.color;
                ctx.beginPath();
                ctx.moveTo(-128, 52);
                ctx.lineTo(128, 52);
                ctx.lineTo(76, 164);
                ctx.lineTo(0, 196);
                ctx.lineTo(-76, 164);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                drawText('Ventricle', 0, 122, '#ffffff', 23);
            } else if (heartData.chambers === 3) {
                roundedRect(-196, -92, 160, 98, 24);
                ctx.fill();
                ctx.stroke();
                roundedRect(36, -92, 160, 98, 24);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-142, 48);
                ctx.lineTo(142, 48);
                ctx.lineTo(88, 182);
                ctx.lineTo(0, 212);
                ctx.lineTo(-88, 182);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                drawText('L. atrium', -116, -42, '#ffffff', 19);
                drawText('R. atrium', 116, -42, '#ffffff', 19);
                drawText('one ventricle', 0, 116, '#ffffff', 21);
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i += 1) {
                    ctx.globalAlpha = 0.35 + i * 0.12;
                    ctx.beginPath();
                    ctx.arc(0, 116, 26 + i * 8, Math.PI * 0.12, Math.PI * 1.42);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                drawText('mixing in common ventricle', 0, 228, '#9a3412', 17);
            } else {
                roundedRect(-206, -100, 172, 92, 24);
                ctx.fill();
                ctx.stroke();
                roundedRect(34, -100, 172, 92, 24);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-202, 38);
                ctx.lineTo(0, 38);
                ctx.lineTo(-24, 202);
                ctx.lineTo(-128, 184);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, 38);
                ctx.lineTo(202, 38);
                ctx.lineTo(128, 184);
                ctx.lineTo(24, 202);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(0, -104);
                ctx.lineTo(0, 208);
                ctx.stroke();
                drawText('L. atrium', -120, -54, '#ffffff', 18);
                drawText('R. atrium', 120, -54, '#ffffff', 18);
                drawText('L. ventricle', -104, 116, '#ffffff', 18);
                drawText('R. ventricle', 104, 116, '#ffffff', 18);
                drawText('complete separation', 0, 228, '#166534', 17);
            }

            ctx.restore();

            drawHeartComparisonStrip();
        };

        const drawHeartComparisonStrip = () => {
            const items = [
                { label: 'Fish', value: '2', note: '1 atr. + 1 vent.', color: '#0891b2' },
                { label: 'Amphibia', value: '3', note: '2 atria + 1 vent.', color: '#d97706' },
                { label: 'Reptilia', value: '3*', note: 'crocodiles: 4', color: '#16a34a' },
                { label: 'Aves', value: '4', note: '2 atria + 2 vent.', color: '#dc2626' },
                { label: 'Mammalia', value: '4', note: '2 atria + 2 vent.', color: '#be123c' },
            ];

            ctx.save();
            drawText('NCERT chamber pattern', 640, 650, '#334155', 17);
            items.forEach((item, index) => {
                const x = 150 + index * 196;
                roundedRect(x, 670, 176, 48, 14);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 2.2;
                ctx.stroke();
                ctx.fillStyle = item.color;
                ctx.font = '900 20px Inter, ui-sans-serif, system-ui';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.value, x + 14, 694);
                ctx.font = '900 12px Inter, ui-sans-serif, system-ui';
                ctx.fillText(item.label, x + 50, 686);
                ctx.fillStyle = '#64748b';
                ctx.font = '700 10px Inter, ui-sans-serif, system-ui';
                ctx.fillText(item.note, x + 50, 704);
            });
            ctx.restore();
        };

        drawBackground();
        drawText('Chordata characteristics', 640, 94, '#0f172a', 30);
        drawText('NCERT Class 11 Biology: Animal Kingdom, Figure 4.16 and vertebrate classification', 640, 126, '#64748b', 15, 'center', 600);

        if (mode === 'heart') {
            drawHeart();
        } else if (mode === 'subphyla') {
            drawSubphylaTriptych();
        } else if (mode === 'vertebrate') {
            drawVertebrateTimeline();
        } else {
            drawParticles();
            drawFeatureBody(640, 390, 1.05);
        }
    }, [feature, heartData, mode, showLabels, stage, subphylum, time, liveValues]);

    const handleReset = () => {
        setMode('features');
        setSubphylum('vertebrata');
        setStage(35);
        setFeature('all');
        setHeartClass('fish');
        setSpeed(1);
        setShowLabels(true);
        setPaused(false);
        setTime(0);
        lastTimeRef.current = null;
    };

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
            <div className="flex flex-col gap-2.5">
                <AsideCard title="NCERT Fig 4.16" subtitle="Chordata characteristics">
                    <svg viewBox="0 0 300 158" className="mt-2 h-[158px] w-full">
                        <rect width="300" height="158" rx="18" fill="#f8fafc" />
                        <ellipse cx="145" cy="82" rx="104" ry="34" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2" />
                        <line x1="62" y1="68" x2="228" y2="68" stroke="#0284c7" strokeWidth="6" strokeLinecap="round" />
                        <line x1="58" y1="88" x2="232" y2="88" stroke="#d97706" strokeWidth="8" strokeLinecap="round" />
                        {[86, 101, 116, 131].map((x) => (
                            <line key={x} x1={x} y1="101" x2={x + 4} y2="126" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
                        ))}
                        <path d="M230 82 C258 62 282 67 294 83 C278 99 256 101 230 82Z" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="2" />
                        <text x="150" y="22" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">Notochord + dorsal hollow nerve cord</text>
                        <text x="148" y="146" textAnchor="middle" fontSize="12" fontWeight="700" fill="#475569">gill slits and post-anal tail</text>
                    </svg>
                </AsideCard>

                <AsideCard title="Subphyla Logic" subtitle="NCERT Ch 4">
                    <div className="mt-3 space-y-2 text-sm">
                        {SUBPHYLA.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setMode('subphyla');
                                    setSubphylum(item.id);
                                }}
                                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${subphylum === item.id ? 'border-teal-300 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                            >
                                <div className="font-extrabold" style={{ color: item.tone }}>{item.label}</div>
                                <div className="text-xs font-semibold text-slate-600">{item.short}</div>
                            </button>
                        ))}
                    </div>
                </AsideCard>

                <AsideCard title="Heart Chambers" subtitle="NCERT circulation pathway">
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {HEART_CLASSES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setMode('heart');
                                    setHeartClass(item.id);
                                }}
                                className={`rounded-xl border px-2.5 py-2 text-left transition-colors ${heartClass === item.id ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                            >
                                <div className="text-[11px] font-extrabold leading-tight text-slate-900">{item.label}</div>
                                <div className="mt-1 font-mono text-lg font-black leading-none" style={{ color: item.color }}>{item.chambers}</div>
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                        Amphibians and reptiles usually share a 3-chamber pattern; crocodiles, birds and mammals are 4-chambered.
                    </div>
                </AsideCard>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-teal-200 bg-teal-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-teal-950">NCERT Anchor</div>
                    <div className="mt-0.5 text-xs font-semibold text-teal-700">Animal Kingdom, Section 4.2.11</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-teal-900">
                        <p>Chordates have a notochord, dorsal hollow single nerve cord, paired pharyngeal gill slits and post-anal tail.</p>
                        <p>Urochordata and Cephalochordata are protochordates; Vertebrata replaces the embryonic notochord with a vertebral column.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">LIVE</span>
                    </div>
                    <ValueRow label="View" value={VIEW_MODES.find((item) => item.id === mode)?.label ?? mode} tone="slate" />
                    <ValueRow label="Subphylum" value={liveValues.subphylum} tone="cyan" />
                    <ValueRow label="Notochord" value={liveValues.notochordStatus} tone="amber" />
                    <ValueRow label="Heart" value={`${heartData.label}: ${liveValues.heart}`} tone="rose" />
                    <ValueRow label="NCERT cue" value={liveValues.cue} tone="emerald" />
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="absolute inset-0 h-full w-full"
                />

                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setPaused((value) => !value)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title={paused ? 'Play' : 'Pause'}
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title="Reset"
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="flex h-full min-h-0 flex-col gap-3 text-slate-900">
            <div className="flex items-center gap-2">
                <SlidersHorizontal size={17} className="text-teal-700" />
                <div className="text-sm font-extrabold text-slate-900">Chordate Bench</div>
            </div>

            <div className="grid min-h-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ControlGroup title="View Mode" icon={<Layers size={14} className="text-teal-700" />}>
                    <div className="grid grid-cols-2 gap-1.5">
                        {VIEW_MODES.map((item) => (
                            <SegmentButton
                                key={item.id}
                                active={mode === item.id}
                                label={item.label}
                                onClick={() => setMode(item.id)}
                            />
                        ))}
                    </div>
                </ControlGroup>

                {mode !== 'heart' && (
                    <ControlGroup title="Subphylum" icon={<Microscope size={14} className="text-sky-700" />}>
                        <div className="grid grid-cols-1 gap-1.5">
                            {SUBPHYLA.map((item) => (
                                <SegmentButton
                                    key={item.id}
                                    active={subphylum === item.id}
                                    label={item.label}
                                    onClick={() => setSubphylum(item.id)}
                                />
                            ))}
                        </div>
                    </ControlGroup>
                )}

                {(mode === 'features' || mode === 'subphyla' || mode === 'vertebrate') && (
                    <ControlGroup title="Development" icon={<Activity size={14} className="text-violet-700" />}>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>Embryo / larva</span>
                            <span>Adult</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={stage}
                            onChange={(event) => setStage(Number(event.target.value))}
                            className="mt-2 w-full accent-violet-600"
                        />
                    </ControlGroup>
                )}

                {(mode === 'features' || mode === 'subphyla') && (
                    <ControlGroup title="Highlight" icon={<Eye size={14} className="text-amber-700" />}>
                        <div className="grid grid-cols-2 gap-1.5">
                            {FEATURES.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setFeature(item.id)}
                                    className={`rounded-lg border px-2 py-2 text-xs font-extrabold transition-colors ${feature === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </ControlGroup>
                )}

                {mode === 'heart' && (
                    <ControlGroup title="Heart Class" icon={<HeartPulse size={14} className="text-rose-700" />}>
                        <div className="grid grid-cols-2 gap-1.5">
                            {HEART_CLASSES.map((item) => (
                                <SegmentButton
                                    key={item.id}
                                    active={heartClass === item.id}
                                    label={item.label}
                                    onClick={() => setHeartClass(item.id)}
                                />
                            ))}
                        </div>
                    </ControlGroup>
                )}

                {mode !== 'heart' && (
                    <ControlGroup title="Motion" icon={<Activity size={14} className="text-emerald-700" />}>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>Slow</span>
                            <span>{speed.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min={0.4}
                            max={2}
                            step={0.1}
                            value={speed}
                            onChange={(event) => setSpeed(Number(event.target.value))}
                            className="mt-2 w-full accent-emerald-600"
                        />
                    </ControlGroup>
                )}

                <ControlGroup title="Labels" icon={showLabels ? <Eye size={14} className="text-slate-700" /> : <EyeOff size={14} className="text-slate-700" />}>
                    <button
                        type="button"
                        onClick={() => setShowLabels((value) => !value)}
                        className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-extrabold transition-colors ${showLabels ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                        {showLabels ? 'Labels On' : 'Labels Off'}
                    </button>
                </ControlGroup>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
            simulationStageWidth={CANVAS_WIDTH}
            simulationStageHeight={CANVAS_HEIGHT}
            controlsAreaFlex="0 0 clamp(205px, 28%, 260px)"
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1320px)] overflow-y-auto overscroll-contain bg-white border border-slate-200 shadow-2xl rounded-2xl p-4"
            contentToggleClassName="bg-white text-teal-700 border border-teal-200 hover:bg-teal-50"
        />
    );
};

const AsideCard = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
        <div className="text-base font-extrabold text-slate-900">{title}</div>
        <div className="text-xs font-semibold text-slate-500">{subtitle}</div>
        {children}
    </div>
);

const ValueRow = ({ label, value, tone }: { label: string; value: string; tone: 'amber' | 'cyan' | 'emerald' | 'rose' | 'slate' }) => {
    const toneClass = {
        amber: 'bg-amber-50 text-amber-700',
        cyan: 'bg-cyan-50 text-cyan-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        rose: 'bg-rose-50 text-rose-700',
        slate: 'bg-slate-50 text-slate-700',
    }[tone];

    return (
        <div className={`mb-2 rounded-lg border border-slate-100 px-3 py-2.5 ${toneClass}`}>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 font-mono text-sm font-extrabold leading-tight">{value}</div>
        </div>
    );
};

const ControlGroup = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
            {icon}
            {title}
        </div>
        {children}
    </div>
);

interface SegmentButtonProps {
    active: boolean;
    label: string;
    onClick: () => void;
}

const SegmentButton: React.FC<SegmentButtonProps> = ({ active, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`min-h-9 rounded-lg border px-2 py-2 text-xs font-extrabold leading-tight transition-colors ${active ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50'}`}
    >
        {label}
    </button>
);

export default ChordataLab;
