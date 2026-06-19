import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Beaker, Droplet, FlaskConical, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface SolutionConcentrationDilutionLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'prepare' | 'dilute';
type SoluteId = 'NaOH' | 'NaCl' | 'KCl' | 'Glucose';

interface Solute {
    id: SoluteId;
    label: string;
    molarMass: number;
    color: string;
}

const W = 1280;
const H = 760;
const WATER_MM = 18.015;

const SOLUTES: Record<SoluteId, Solute> = {
    NaOH:    { id: 'NaOH',    label: 'NaOH',    molarMass: 40.0,  color: '#0891b2' },
    NaCl:    { id: 'NaCl',    label: 'NaCl',    molarMass: 58.5,  color: '#d97706' },
    KCl:     { id: 'KCl',     label: 'KCl',     molarMass: 74.5,  color: '#7c3aed' },
    Glucose: { id: 'Glucose', label: 'Glucose', molarMass: 180.0, color: '#16a34a' }
};

const PREPARE_PRESETS = [
    { name: 'NCERT 1.6 — 2 g A in 18 g water', solute: 'NaOH' as SoluteId, mass: 2, volume: 20, density: 1.0 },
    { name: 'NCERT 1.7 — 4 g NaOH → 250 mL',   solute: 'NaOH' as SoluteId, mass: 4, volume: 250, density: 1.0 },
    { name: 'NCERT 1.8 — 3 M NaCl, ρ=1.25',    solute: 'NaCl' as SoluteId, mass: 175.5, volume: 1000, density: 1.25 }
];

const DILUTE_PRESET = { m1: 1.0, v1: 200, v2: 1000 };

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function fmt(v: number, d = 3) {
    if (!isFinite(v)) return '—';
    if (v === 0) return '0';
    const abs = Math.abs(v);
    if (abs >= 1000 || abs < 0.001) return v.toExponential(2);
    return v.toFixed(d);
}

interface Particle { x: number; y: number; vx: number; vy: number; r: number; }

const SolutionConcentrationDilutionLab: React.FC<SolutionConcentrationDilutionLabProps> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('prepare');
    const [soluteId, setSoluteId] = useState<SoluteId>('NaOH');
    const [massG, setMassG] = useState(4);
    const [volMl, setVolMl] = useState(250);
    const [density, setDensity] = useState(1.0);

    const [m1, setM1] = useState(DILUTE_PRESET.m1);
    const [v1Ml, setV1Ml] = useState(DILUTE_PRESET.v1);
    const [v2Ml, setV2Ml] = useState(DILUTE_PRESET.v2);

    const [paused, setPaused] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | undefined>(undefined);
    const particlesRef = useRef<Particle[]>([]);
    const stockParticlesRef = useRef<Particle[]>([]);
    const targetParticlesRef = useRef<Particle[]>([]);
    const tRef = useRef(0);
    const lastTsRef = useRef<number | undefined>(undefined);
    const prepFillRef = useRef(0.6);
    const dilFillRef = useRef(0.5);
    const dropletRef = useRef(0);
    const streamRef = useRef(0);

    const solute = SOLUTES[soluteId];

    const prep = useMemo(() => {
        const n = massG / solute.molarMass;
        const volL = volMl / 1000;
        const massSolutionG = density * volMl;
        const massSolventG = Math.max(0, massSolutionG - massG);
        const massSolventKg = massSolventG / 1000;
        const nSolvent = massSolventG / WATER_MM;
        const massPct = massSolutionG > 0 ? (massG / massSolutionG) * 100 : 0;
        const xSolute = (n + nSolvent) > 0 ? n / (n + nSolvent) : 0;
        const xSolvent = 1 - xSolute;
        const M = volL > 0 ? n / volL : 0;
        const m = massSolventKg > 0 ? n / massSolventKg : 0;
        return { n, volL, massSolutionG, massSolventG, nSolvent, massPct, xSolute, xSolvent, M, m };
    }, [massG, volMl, density, solute]);

    const dil = useMemo(() => {
        const v1L = v1Ml / 1000;
        const v2L = v2Ml / 1000;
        const nStock = m1 * v1L;
        const M2 = v2L > 0 ? nStock / v2L : 0;
        const product1 = m1 * v1Ml;
        const product2 = M2 * v2Ml;
        return { v1L, v2L, nStock, M2, product1, product2 };
    }, [m1, v1Ml, v2Ml]);

    const handleReset = useCallback(() => {
        if (mode === 'prepare') {
            setSoluteId('NaOH'); setMassG(4); setVolMl(250); setDensity(1.0);
        } else {
            setM1(DILUTE_PRESET.m1); setV1Ml(DILUTE_PRESET.v1); setV2Ml(DILUTE_PRESET.v2);
        }
        tRef.current = 0;
    }, [mode]);

    // Reinit particles when batch changes
    useEffect(() => {
        if (mode !== 'prepare') return;
        const flaskX = 300, flaskY = 200, flaskW = 230, flaskH = 470;
        const count = Math.min(160, Math.max(8, Math.round(prep.M * 38)));
        const arr: Particle[] = [];
        for (let i = 0; i < count; i++) {
            arr.push({
                x: flaskX + 30 + Math.random() * (flaskW - 60),
                y: flaskY + 80 + Math.random() * (flaskH - 110),
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                r: 3 + Math.random() * 1.4
            });
        }
        particlesRef.current = arr;
    }, [mode, prep.M, soluteId]);

    useEffect(() => {
        if (mode !== 'dilute') return;
        const count = Math.max(8, Math.round(dil.nStock * 110));
        const stockX = 190, stockY = 210, stockW = 210, stockH = 380;
        const arr: Particle[] = [];
        for (let i = 0; i < count; i++) {
            arr.push({
                x: stockX + 25 + Math.random() * (stockW - 50),
                y: stockY + 40 + Math.random() * (stockH - 70),
                vx: (Math.random() - 0.5) * 0.7,
                vy: (Math.random() - 0.5) * 0.7,
                r: 3 + Math.random() * 1.3
            });
        }
        stockParticlesRef.current = arr;
        targetParticlesRef.current = [];
        tRef.current = 0;
    }, [mode, dil.nStock, m1, v1Ml]);

    // Canvas draw loop
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        lastTsRef.current = undefined;

        // ---- A clean graduated lab container with glass, gradient liquid + meniscus ----
        const drawContainer = (
            x: number, y: number, w: number, h: number,
            fillFrac: number, liquid: string,
            label: string, volLabel: string
        ) => {
            const r = 18;
            const bodyPath = () => {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + h - r);
                ctx.quadraticCurveTo(x, y + h, x + r, y + h);
                ctx.lineTo(x + w - r, y + h);
                ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
                ctx.lineTo(x + w, y);
            };

            // glass back fill
            bodyPath();
            ctx.fillStyle = 'rgba(241,245,249,0.55)';
            ctx.fill();

            // liquid
            const ff = clamp(fillFrac, 0, 1);
            const surfaceY = y + (1 - ff) * h;
            ctx.save();
            bodyPath();
            ctx.clip();
            const grad = ctx.createLinearGradient(0, surfaceY, 0, y + h);
            grad.addColorStop(0, liquid + '2E');
            grad.addColorStop(1, liquid + '5E');
            ctx.fillStyle = grad;
            ctx.fillRect(x, surfaceY, w, y + h - surfaceY);
            // meniscus surface
            ctx.fillStyle = liquid + '4D';
            ctx.beginPath(); ctx.ellipse(x + w / 2, surfaceY, w / 2, 7, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = liquid + 'AA'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.ellipse(x + w / 2, surfaceY, w / 2, 7, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        };

        const drawContainerGlass = (x: number, y: number, w: number, h: number) => {
            const r = 18;
            const bodyPath = () => {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + h - r);
                ctx.quadraticCurveTo(x, y + h, x + r, y + h);
                ctx.lineTo(x + w - r, y + h);
                ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
                ctx.lineTo(x + w, y);
            };
            // graduation ticks
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
            for (let i = 1; i < 6; i++) {
                const ty = y + h * (i / 6);
                ctx.beginPath(); ctx.moveTo(x + 6, ty); ctx.lineTo(x + 20, ty); ctx.stroke();
            }
            // glossy highlight stripe
            ctx.save();
            bodyPath(); ctx.clip();
            const gl = ctx.createLinearGradient(x, 0, x + w, 0);
            gl.addColorStop(0, '#ffffff00');
            gl.addColorStop(0.10, '#ffffff66');
            gl.addColorStop(0.22, '#ffffff00');
            ctx.fillStyle = gl;
            ctx.fillRect(x, y, w, h);
            ctx.restore();
            // glass outline
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3;
            bodyPath(); ctx.stroke();
            // rim
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath(); ctx.ellipse(x + w / 2, y, w / 2, 7, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(x + w / 2, y, w / 2, 7, 0, 0, Math.PI * 2); ctx.stroke();
        };

        const drawLabels = (x: number, w: number, bottomY: number, label: string, volLabel: string) => {
            ctx.fillStyle = '#334155';
            ctx.font = 'bold 14px ui-sans-serif, system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, bottomY + 26);
            ctx.fillStyle = '#64748b';
            ctx.font = '600 12px ui-sans-serif, system-ui';
            ctx.fillText(volLabel, x + w / 2, bottomY + 44);
        };

        const drawParticles = (arr: Particle[], color: string) => {
            for (const p of arr) {
                ctx.save();
                ctx.shadowColor = color;
                ctx.shadowBlur = 7;
                ctx.fillStyle = color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.beginPath(); ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.4, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        };

        const stepParticles = (arr: Particle[], x: number, y: number, w: number, h: number, s: number) => {
            for (const p of arr) {
                p.x += p.vx * s; p.y += p.vy * s;
                if (p.x < x + p.r)     { p.x = x + p.r;     p.vx = Math.abs(p.vx); }
                if (p.x > x + w - p.r) { p.x = x + w - p.r; p.vx = -Math.abs(p.vx); }
                if (p.y < y + p.r)     { p.y = y + p.r;     p.vy = Math.abs(p.vy); }
                if (p.y > y + h - p.r) { p.y = y + h - p.r; p.vy = -Math.abs(p.vy); }
                p.vx += (Math.random() - 0.5) * 0.05 * s;
                p.vy += (Math.random() - 0.5) * 0.05 * s;
                p.vx = clamp(p.vx, -1.1, 1.1);
                p.vy = clamp(p.vy, -1.1, 1.1);
            }
        };

        const drawTemperatureBadge = () => {
            const bw = 150, bh = 34, bx = W - bw - 132, by = 22;
            ctx.fillStyle = '#fef3c7';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#92400e';
            ctx.font = 'bold 13px ui-sans-serif, system-ui';
            ctx.textAlign = 'center';
            ctx.fillText('T = 25 °C  (fixed)', bx + bw / 2, by + 22);
        };

        const draw = (ts: number) => {
            const last = lastTsRef.current ?? ts;
            let dt = ts - last;
            lastTsRef.current = ts;
            if (dt > 100) dt = 100;
            const s = dt / 16.67;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, W, H);

            // Title strip
            ctx.fillStyle = '#0f172a';
            ctx.font = '800 19px ui-sans-serif, system-ui';
            ctx.textAlign = 'left';
            ctx.fillText(mode === 'prepare' ? 'Prepare a solution' : 'Dilute a stock solution', 36, 40);
            ctx.fillStyle = '#64748b';
            ctx.font = '600 12px ui-sans-serif, system-ui';
            ctx.fillText(mode === 'prepare'
                ? 'Add solute to the volumetric flask — the four NCERT concentration units update live.'
                : 'Pipette stock into a flask, top up with water to V₂. Moles of solute are conserved.', 36, 60);

            drawTemperatureBadge();

            if (mode === 'prepare') {
                const flaskX = 300, flaskY = 200, flaskW = 230, flaskH = 470;
                const flaskBottom = flaskY + flaskH;

                // animated fill level scales with prepared volume (visual cue)
                const targetFill = clamp(volMl / 1000, 0.18, 0.96);
                prepFillRef.current += (targetFill - prepFillRef.current) * Math.min(1, 0.08 * s);
                const ff = prepFillRef.current;
                const surfaceY = flaskY + (1 - ff) * flaskH;

                // Solute card above flask
                ctx.fillStyle = '#475569';
                ctx.font = 'bold 13px ui-sans-serif, system-ui';
                ctx.textAlign = 'center';
                ctx.fillText('Solute: ' + solute.label + '   (M = ' + solute.molarMass + ' g/mol)', flaskX + flaskW / 2, 108);
                ctx.fillStyle = solute.color;
                ctx.beginPath(); ctx.roundRect(flaskX + flaskW / 2 - 46, 122, 92, 26, 7); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px ui-sans-serif, system-ui';
                ctx.fillText(massG.toFixed(2) + ' g', flaskX + flaskW / 2, 140);
                // arrow down
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(flaskX + flaskW / 2, 152); ctx.lineTo(flaskX + flaskW / 2, 188);
                ctx.moveTo(flaskX + flaskW / 2 - 6, 180); ctx.lineTo(flaskX + flaskW / 2, 188);
                ctx.lineTo(flaskX + flaskW / 2 + 6, 180);
                ctx.stroke();

                // liquid + glass
                drawContainer(flaskX, flaskY, flaskW, flaskH, ff, solute.color, '', '');
                if (!paused) stepParticles(particlesRef.current, flaskX, surfaceY + 8, flaskW, flaskBottom - surfaceY - 12, s);
                ctx.save();
                ctx.beginPath();
                ctx.rect(flaskX, surfaceY, flaskW, flaskH);
                ctx.clip();
                drawParticles(particlesRef.current, solute.color);
                ctx.restore();
                drawContainerGlass(flaskX, flaskY, flaskW, flaskH);
                drawLabels(flaskX, flaskW, flaskBottom, 'Volumetric flask', volMl.toFixed(0) + ' mL');

                // Concentration units panel (clear of the flask)
                const bx = 720, by = 200, bw = 480, bh = 470;
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 16); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#0f172a';
                ctx.font = '800 17px ui-sans-serif, system-ui';
                ctx.textAlign = 'left';
                ctx.fillText('Same batch · four concentration units', bx + 22, by + 34);
                ctx.fillStyle = '#64748b';
                ctx.font = '600 11px ui-sans-serif, system-ui';
                ctx.fillText('Bar lengths scaled to a readable range — values are exact.', bx + 22, by + 54);

                const rows = [
                    { label: 'Mass %',            value: prep.massPct, unit: '%',      max: 30,  color: '#0891b2' },
                    { label: 'Mole fraction (x)', value: prep.xSolute, unit: '',       max: 0.2, color: '#7c3aed' },
                    { label: 'Molarity (M)',      value: prep.M,       unit: 'mol/L',  max: 6,   color: '#d97706' },
                    { label: 'Molality (m)',      value: prep.m,       unit: 'mol/kg', max: 6,   color: '#16a34a' }
                ];
                rows.forEach((r, i) => {
                    const ry = by + 96 + i * 84;
                    ctx.fillStyle = '#334155';
                    ctx.font = 'bold 14px ui-sans-serif, system-ui';
                    ctx.textAlign = 'left';
                    ctx.fillText(r.label, bx + 22, ry);
                    const barX = bx + 22, barY = ry + 12, barW = bw - 44, barH = 26;
                    ctx.fillStyle = '#f1f5f9';
                    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 9); ctx.fill();
                    const frac = clamp(r.value / r.max, 0, 1);
                    const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
                    fillGrad.addColorStop(0, r.color);
                    fillGrad.addColorStop(1, r.color + 'AA');
                    ctx.fillStyle = fillGrad;
                    ctx.beginPath(); ctx.roundRect(barX, barY, Math.max(4, barW * frac), barH, 9); ctx.fill();
                    ctx.fillStyle = '#0f172a';
                    ctx.font = 'bold 14px ui-monospace, monospace';
                    ctx.textAlign = 'right';
                    ctx.fillText(fmt(r.value) + (r.unit ? ' ' + r.unit : ''), barX + barW - 10, barY + 18);
                    ctx.textAlign = 'left';
                });
            } else {
                // ---- Dilute mode ----
                const stockX = 190, stockY = 210, stockW = 210, stockH = 380;
                const targetX = 620, targetY = 170, targetW = 250, targetH = 470;
                const stockBottom = stockY + stockH;
                const targetBottom = targetY + targetH;

                // Stock (full) + label above
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 13px ui-sans-serif, system-ui';
                ctx.textAlign = 'center';
                ctx.fillText('M₁ = ' + fmt(m1, 2) + ' mol/L', stockX + stockW / 2, stockY - 24);
                drawContainer(stockX, stockY, stockW, stockH, 1, '#0891b2', '', '');
                if (!paused) stepParticles(stockParticlesRef.current, stockX, stockY + 8, stockW, stockH - 14, s);
                ctx.save(); ctx.beginPath(); ctx.rect(stockX, stockY, stockW, stockH); ctx.clip();
                drawParticles(stockParticlesRef.current, '#0891b2');
                ctx.restore();
                drawContainerGlass(stockX, stockY, stockW, stockH);
                drawLabels(stockX, stockW, stockBottom, 'Stock solution', v1Ml.toFixed(0) + ' mL');

                // Target — animated fill toward V₂/2000
                const targetFill = clamp(v2Ml / 2000, 0.18, 1);
                dilFillRef.current += (targetFill - dilFillRef.current) * Math.min(1, 0.08 * s);
                const tff = dilFillRef.current;
                const tSurfaceY = targetY + (1 - tff) * targetH;
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 13px ui-sans-serif, system-ui';
                ctx.textAlign = 'center';
                ctx.fillText('M₂ = ' + fmt(dil.M2, 3) + ' mol/L', targetX + targetW / 2, targetY - 24);
                drawContainer(targetX, targetY, targetW, targetH, tff, '#0891b2', '', '');
                if (!paused) stepParticles(targetParticlesRef.current, targetX, tSurfaceY + 8, targetW, targetBottom - tSurfaceY - 12, s);
                ctx.save(); ctx.beginPath(); ctx.rect(targetX, tSurfaceY, targetW, targetH); ctx.clip();
                drawParticles(targetParticlesRef.current, '#0891b2');
                ctx.restore();
                drawContainerGlass(targetX, targetY, targetW, targetH);
                drawLabels(targetX, targetW, targetBottom, 'Diluted solution', v2Ml.toFixed(0) + ' mL');

                // Pipette arc with a travelling droplet
                const p0 = { x: stockX + stockW, y: stockY + 70 };
                const c1 = { x: stockX + stockW + 90, y: 120 };
                const c2 = { x: targetX - 90, y: 120 };
                const p3 = { x: targetX, y: targetY + 60 };
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
                ctx.setLineDash([6, 5]);
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p3.x, p3.y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#0ea5e9';
                ctx.font = 'bold 12px ui-sans-serif, system-ui';
                ctx.textAlign = 'center';
                ctx.fillText('pipette · transfer V₁', (p0.x + p3.x) / 2, 96);

                if (!paused) dropletRef.current = (dropletRef.current + 0.006 * s) % 1;
                const u = dropletRef.current, iu = 1 - u;
                const dx = iu * iu * iu * p0.x + 3 * iu * iu * u * c1.x + 3 * iu * u * u * c2.x + u * u * u * p3.x;
                const dy = iu * iu * iu * p0.y + 3 * iu * iu * u * c1.y + 3 * iu * u * u * c2.y + u * u * u * p3.y;
                ctx.save();
                ctx.shadowColor = '#0891b2'; ctx.shadowBlur = 8;
                ctx.fillStyle = '#0891b2';
                ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
                ctx.restore();

                // Water stream into target (animated dashes)
                const wx = targetX + targetW + 34;
                ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
                if (!paused) streamRef.current = (streamRef.current + 0.5 * s) % 16;
                ctx.setLineDash([7, 9]);
                ctx.lineDashOffset = -streamRef.current;
                ctx.beginPath();
                ctx.moveTo(wx, 150);
                ctx.lineTo(wx, targetY + 24);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.lineDashOffset = 0;
                ctx.fillStyle = '#0369a1';
                ctx.font = 'bold 12px ui-sans-serif, system-ui';
                ctx.textAlign = 'center';
                ctx.fillText('water', wx, 142);

                // Particle transfer from stock → target (visual conservation)
                if (!paused) {
                    tRef.current += s;
                    const cap = Math.max(8, Math.round(dil.nStock * 110));
                    if (tRef.current > 18 && stockParticlesRef.current.length > 0 && targetParticlesRef.current.length < cap) {
                        tRef.current = 0;
                        const moved = stockParticlesRef.current.pop();
                        if (moved) {
                            targetParticlesRef.current.push({
                                x: targetX + 30 + Math.random() * (targetW - 60),
                                y: tSurfaceY + 20 + Math.random() * Math.max(20, targetBottom - tSurfaceY - 40),
                                vx: (Math.random() - 0.5) * 0.6,
                                vy: (Math.random() - 0.5) * 0.6,
                                r: 3 + Math.random() * 1.3
                            });
                        }
                    }
                    if (stockParticlesRef.current.length < 6) {
                        for (let i = 0; i < 6; i++) {
                            stockParticlesRef.current.push({
                                x: stockX + 25 + Math.random() * (stockW - 50),
                                y: stockY + 40 + Math.random() * (stockH - 70),
                                vx: (Math.random() - 0.5) * 0.6,
                                vy: (Math.random() - 0.5) * 0.6,
                                r: 3 + Math.random() * 1.3
                            });
                        }
                    }
                }

                // Conservation card — bottom-right, fully clear of both flasks
                const cw = 320, ch = 150, cardX = W - cw - 40, cardY = H - ch - 36;
                const ok = Math.abs(dil.product1 - dil.product2) < 0.01 * Math.max(dil.product1, 1);
                ctx.fillStyle = ok ? '#ecfdf5' : '#fef2f2';
                ctx.strokeStyle = ok ? '#10b981' : '#ef4444';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.roundRect(cardX, cardY, cw, ch, 14); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#0f172a';
                ctx.font = '800 15px ui-sans-serif, system-ui';
                ctx.textAlign = 'left';
                ctx.fillText('Conservation check', cardX + 18, cardY + 30);
                ctx.fillStyle = ok ? '#047857' : '#b91c1c';
                ctx.font = '900 22px ui-sans-serif, system-ui';
                ctx.textAlign = 'right';
                ctx.fillText(ok ? '✓' : '!', cardX + cw - 18, cardY + 32);
                ctx.fillStyle = '#475569';
                ctx.font = 'bold 13px ui-sans-serif, system-ui';
                ctx.textAlign = 'left';
                ctx.fillText('M₁·V₁ = M₂·V₂', cardX + 18, cardY + 56);
                ctx.font = 'bold 14px ui-monospace, monospace';
                ctx.fillStyle = '#334155';
                ctx.fillText('M₁·V₁ = ' + fmt(dil.product1, 2) + '  M·mL', cardX + 18, cardY + 90);
                ctx.fillText('M₂·V₂ = ' + fmt(dil.product2, 2) + '  M·mL', cardX + 18, cardY + 116);
            }

            rafRef.current = requestAnimationFrame(draw);
        };

        draw(performance.now()); // paint an immediate first frame, then keep animating
        return () => { if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current); };
    }, [mode, paused, soluteId, massG, volMl, density, m1, v1Ml, v2Ml, prep, dil, solute]);

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Concentration units</div>
                    <div className="text-xs font-semibold text-slate-500">NCERT §1.10.2</div>
                    <div className="mt-3 space-y-2 text-xs">
                        <div className="rounded-lg bg-cyan-50 px-3 py-2">
                            <div className="font-extrabold text-cyan-900">Mass %</div>
                            <div className="font-mono text-[11px] text-cyan-800">mass solute / mass solution × 100</div>
                        </div>
                        <div className="rounded-lg bg-violet-50 px-3 py-2">
                            <div className="font-extrabold text-violet-900">Mole fraction</div>
                            <div className="font-mono text-[11px] text-violet-800">x_A = n_A / (n_A + n_B)</div>
                        </div>
                        <div className="rounded-lg bg-amber-50 px-3 py-2">
                            <div className="font-extrabold text-amber-900">Molarity (M)</div>
                            <div className="font-mono text-[11px] text-amber-800">n_solute / V_solution (L)</div>
                        </div>
                        <div className="rounded-lg bg-emerald-50 px-3 py-2">
                            <div className="font-extrabold text-emerald-900">Molality (m)</div>
                            <div className="font-mono text-[11px] text-emerald-800">n_solute / mass_solvent (kg)</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">NCERT presets</div>
                    <div className="text-xs font-semibold text-slate-500">Worked problems 1.6 – 1.8 + dilution</div>
                    <div className="mt-2 flex flex-col gap-1.5">
                        {PREPARE_PRESETS.map(p => (
                            <button
                                key={p.name}
                                onClick={() => {
                                    setMode('prepare');
                                    setSoluteId(p.solute); setMassG(p.mass); setVolMl(p.volume); setDensity(p.density);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                            >
                                {p.name}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setMode('dilute');
                                setM1(DILUTE_PRESET.m1); setV1Ml(DILUTE_PRESET.v1); setV2Ml(DILUTE_PRESET.v2);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                        >
                            NCERT dilution — 1 M, take 200 mL → 1 L
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Dilution rule</div>
                    <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900">
                        M₁V₁ = M₂V₂ — moles of solute stay the same when only solvent is added.
                    </div>
                </div>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">NCERT focus</div>
                    <div className="text-xs font-semibold text-amber-700">Class 11 Chemistry, Ch 1 §1.10.2</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-900">
                        <div>Four ways to state concentration: mass %, mole fraction, molarity, molality.</div>
                        <div>Molarity depends on temperature (volume changes with T).</div>
                        <div>Molality is independent of temperature (mass is invariant).</div>
                        <div>On dilution, moles of solute are conserved → M₁V₁ = M₂V₂.</div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</div>
                    </div>
                    {mode === 'prepare' ? (
                        <div className="mt-3 space-y-2">
                            {[
                                { label: 'n solute', value: fmt(prep.n) + ' mol' },
                                { label: 'mass solute', value: massG.toFixed(2) + ' g' },
                                { label: 'mass solvent', value: fmt(prep.massSolventG, 2) + ' g' },
                                { label: 'mass solution', value: fmt(prep.massSolutionG, 2) + ' g' },
                                { label: 'volume', value: volMl.toFixed(0) + ' mL' },
                                { label: 'mass %', value: fmt(prep.massPct, 3) + ' %' },
                                { label: 'x_solute', value: fmt(prep.xSolute, 4) },
                                { label: 'x_solvent', value: fmt(prep.xSolvent, 4) },
                                { label: 'molarity M', value: fmt(prep.M, 3) + ' mol/L' },
                                { label: 'molality m', value: fmt(prep.m, 3) + ' mol/kg' },
                                { label: 'density', value: density.toFixed(2) + ' g/mL' }
                            ].map(r => (
                                <div key={r.label} className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{r.label}</div>
                                    <div className="mt-0.5 font-mono text-sm font-extrabold text-amber-700">{r.value}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {[
                                { label: 'M₁ (stock)', value: fmt(m1, 3) + ' mol/L' },
                                { label: 'V₁ (stock)', value: v1Ml.toFixed(0) + ' mL' },
                                { label: 'n solute (constant)', value: fmt(dil.nStock, 4) + ' mol' },
                                { label: 'V₂ (target)', value: v2Ml.toFixed(0) + ' mL' },
                                { label: 'M₂ (computed)', value: fmt(dil.M2, 3) + ' mol/L' },
                                { label: 'M₁·V₁', value: fmt(dil.product1, 2) + ' M·mL' },
                                { label: 'M₂·V₂', value: fmt(dil.product2, 2) + ' M·mL' },
                                { label: 'dilution factor V₂/V₁', value: fmt(v2Ml / Math.max(1, v1Ml), 2) + '×' }
                            ].map(r => (
                                <div key={r.label} className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{r.label}</div>
                                    <div className="mt-0.5 font-mono text-sm font-extrabold text-amber-700">{r.value}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button
                        onClick={() => setPaused(v => !v)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title={paused ? 'Play' : 'Pause'}
                    >
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button
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

    const controlsComponent = (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <FlaskConical size={18} className="text-cyan-600" />
                Solution Concentration &amp; Dilution Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Mode</div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setMode('prepare')}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${mode === 'prepare' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Beaker size={15} /> Prepare
                        </button>
                        <button
                            onClick={() => setMode('dilute')}
                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-extrabold transition ${mode === 'dilute' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Droplet size={15} /> Dilute
                        </button>
                    </div>

                    {mode === 'prepare' && (
                        <>
                            <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Solute</div>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                {(Object.values(SOLUTES) as Solute[]).map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSoluteId(s.id)}
                                        className={`rounded-xl border px-3 py-2 text-xs font-extrabold transition ${soluteId === s.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        {s.label} <span className="text-[10px] opacity-70">· {s.molarMass} g/mol</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="space-y-3">
                    {mode === 'prepare' ? (
                        <>
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Mass of solute ({massG.toFixed(2)} g)
                                </label>
                                <input type="range" min={0.2} max={200} step={0.1} value={massG}
                                    onChange={e => setMassG(Number(e.target.value))}
                                    className="w-full accent-cyan-600" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Volume of solution ({volMl.toFixed(0)} mL)
                                </label>
                                <input type="range" min={20} max={1000} step={5} value={volMl}
                                    onChange={e => setVolMl(Number(e.target.value))}
                                    className="w-full accent-amber-600" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Density ({density.toFixed(2)} g/mL)
                                </label>
                                <input type="range" min={0.95} max={1.40} step={0.01} value={density}
                                    onChange={e => setDensity(Number(e.target.value))}
                                    className="w-full accent-emerald-600" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Stock M₁ ({m1.toFixed(2)} mol/L)
                                </label>
                                <input type="range" min={0.1} max={3.0} step={0.05} value={m1}
                                    onChange={e => setM1(Number(e.target.value))}
                                    className="w-full accent-cyan-600" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Stock V₁ ({v1Ml.toFixed(0)} mL)
                                </label>
                                <input type="range" min={10} max={500} step={5} value={v1Ml}
                                    onChange={e => { const v = Number(e.target.value); setV1Ml(v); if (v2Ml < v) setV2Ml(v); }}
                                    className="w-full accent-amber-600" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Target V₂ ({v2Ml.toFixed(0)} mL)
                                </label>
                                <input type="range" min={v1Ml} max={2000} step={10} value={v2Ml}
                                    onChange={e => setV2Ml(Number(e.target.value))}
                                    className="w-full accent-emerald-600" />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsComponent}
            controlsAreaFlex="0 0 220px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default SolutionConcentrationDilutionLab;
