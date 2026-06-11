import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Atom, Droplets } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props { topic: Topic; onExit: () => void; }

const W_CV = 1280, H_CV = 760;

type System = 'acetic' | 'ammonia';

interface BufferInfo { id: System; acidName: string; saltName: string; pKa: number; pKb: number; bufferPH: number; color: string; }
const BUFFERS: BufferInfo[] = [
    { id: 'acetic',  acidName: 'CH₃COOH',     saltName: 'CH₃COO⁻ Na⁺', pKa: 4.76, pKb: 9.24, bufferPH: 4.76, color: '#d97706' },
    { id: 'ammonia', acidName: 'NH₄⁺ Cl⁻',     saltName: 'NH₃',         pKa: 9.25, pKb: 4.75, bufferPH: 9.25, color: '#2563eb' },
];

const TOTAL_VOL_L = 1.0;

function waterPH(netMolH: number, totalVol: number = TOTAL_VOL_L): number {
    if (Math.abs(netMolH) < 1e-7) return 7.0;
    const c = Math.abs(netMolH) / totalVol;
    if (netMolH > 0) return Math.max(0.3, -Math.log10(c));
    return Math.min(13.7, 14 + Math.log10(c));
}

function bufferPH(
    sys: System,
    initAcid: number, initSalt: number,
    addedH: number,
    totalVol: number = TOTAL_VOL_L,
): { pH: number; acid: number; salt: number; broken: boolean } {
    const pKa = sys === 'acetic' ? 4.76 : 9.25;
    const acid = initAcid + addedH;
    const salt = initSalt - addedH;
    const broken = acid <= 0 || salt <= 0;

    let pH: number;
    if (broken) {
        if (acid <= 0) {
            const excess = Math.abs(acid) / totalVol;
            pH = excess > 0 ? Math.min(13.7, 14 + Math.log10(excess)) : 13;
        } else {
            const excess = Math.abs(salt) / totalVol;
            pH = excess > 0 ? Math.max(0.3, -Math.log10(excess)) : 1;
        }
    } else {
        pH = pKa + Math.log10(salt / acid);
    }
    return {
        pH: Math.max(0.3, Math.min(13.7, pH)),
        acid: Math.max(0, acid),
        salt: Math.max(0, salt),
        broken,
    };
}

const phColor = (ph: number): string => {
    if (ph < 2)   return '#dc2626';
    if (ph < 4)   return '#ea580c';
    if (ph < 6)   return '#eab308';
    if (ph < 8)   return '#22c55e';
    if (ph < 10)  return '#0891b2';
    if (ph < 12)  return '#7c3aed';
    return '#a855f7';
};

const BufferSolutionsLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);
    const pulseRef  = useRef(0);

    const [system,   setSystem]   = useState<System>('acetic');
    const [acid0,    setAcid0]    = useState(0.5);
    const [salt0,    setSalt0]    = useState(0.5);
    const [waterH,   setWaterH]   = useState(0);
    const [bufferH,  setBufferH]  = useState(0);
    const [paused,   setPaused]   = useState(false);

    const buf = useMemo(() => BUFFERS.find(b => b.id === system)!, [system]);

    const wPH = useMemo(() => waterPH(waterH), [waterH]);
    const bufRes = useMemo(() => bufferPH(system, acid0, salt0, bufferH), [system, acid0, salt0, bufferH]);

    const handleReset = useCallback(() => {
        setSystem('acetic'); setAcid0(0.5); setSalt0(0.5);
        setWaterH(0); setBufferH(0); setPaused(false);
    }, []);

    const addToWater  = (mol: number) => setWaterH(h => h + mol);
    const addToBuffer = (mol: number) => setBufferH(h => h + mol);

    const drawFrame = useCallback(() => {
        const cv = canvasRef.current; if (!cv) return;
        const ctx = cv.getContext('2d'); if (!ctx) return;

        ctx.clearRect(0, 0, W_CV, H_CV);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W_CV, H_CV);

        ctx.strokeStyle = 'rgba(100,116,139,0.06)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W_CV; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H_CV); ctx.stroke(); }
        for (let y = 0; y <= H_CV; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W_CV, y); ctx.stroke(); }

        ctx.font      = '12px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`§6.12 Buffer Solutions · Henderson-Hasselbalch  pH = pKa + log([Salt]/[Acid])`, 30, 76);

        const beaker = (x: number, label: string, sub: string, pH: number, vol_addedH: number,
                        liquidColor: string, ph_change: number, isBuffer: boolean,
                        acidCount: number, saltCount: number, broken: boolean) => {

            const beakerY = 130;
            const beakerW = 200, beakerH = 280;

            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(x - beakerW / 2, beakerY);
            ctx.lineTo(x - beakerW / 2, beakerY + beakerH);
            ctx.lineTo(x + beakerW / 2, beakerY + beakerH);
            ctx.lineTo(x + beakerW / 2, beakerY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x - beakerW / 2 - 12, beakerY);
            ctx.lineTo(x - beakerW / 2 + 10, beakerY);
            ctx.moveTo(x + beakerW / 2 - 10, beakerY);
            ctx.lineTo(x + beakerW / 2 + 12, beakerY);
            ctx.stroke();

            const liqTop = beakerY + 60;
            const liqGrad = ctx.createLinearGradient(x, liqTop, x, beakerY + beakerH);
            liqGrad.addColorStop(0, liquidColor + '30');
            liqGrad.addColorStop(1, liquidColor + '70');
            ctx.fillStyle = liqGrad;
            ctx.fillRect(x - beakerW / 2 + 2, liqTop, beakerW - 4, beakerY + beakerH - liqTop - 2);

            ctx.strokeStyle = liquidColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - beakerW / 2 + 2, liqTop);
            ctx.lineTo(x + beakerW / 2 - 2, liqTop);
            ctx.stroke();

            if (isBuffer) {
                const showAcid = Math.max(2, Math.min(18, Math.round(acidCount * 10)));
                const showSalt = Math.max(2, Math.min(18, Math.round(saltCount * 10)));
                for (let i = 0; i < showAcid; i++) {
                    const wig = Math.sin(pulseRef.current * 2 + i * 0.5) * 5;
                    const px = x - beakerW / 2 + 18 + ((i * 37 + wig) % (beakerW - 36));
                    const py = liqTop + 18 + ((i * 53) % (beakerY + beakerH - liqTop - 36));
                    ctx.beginPath();
                    ctx.arc(px, py, 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#eab308';
                    ctx.shadowColor = '#eab308';
                    ctx.shadowBlur = 4;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
                for (let i = 0; i < showSalt; i++) {
                    const wig = Math.cos(pulseRef.current * 2.4 + i * 0.7) * 5;
                    const px = x - beakerW / 2 + 18 + ((i * 41 + 13 + wig) % (beakerW - 36));
                    const py = liqTop + 28 + ((i * 67) % (beakerY + beakerH - liqTop - 36));
                    ctx.beginPath();
                    ctx.arc(px, py, 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#2563eb';
                    ctx.shadowColor = '#2563eb';
                    ctx.shadowBlur = 4;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            } else {
                for (let i = 0; i < 10; i++) {
                    const wig = Math.sin(pulseRef.current * 2 + i * 0.6) * 4;
                    const px = x - beakerW / 2 + 18 + ((i * 43 + wig) % (beakerW - 36));
                    const py = liqTop + 18 + ((i * 71) % (beakerY + beakerH - liqTop - 36));
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fillStyle = '#94a3b8';
                    ctx.fill();
                }
            }

            if (broken) {
                ctx.fillStyle = 'rgba(220,38,38,0.15)';
                ctx.fillRect(x - beakerW / 2 + 2, liqTop, beakerW - 4, beakerY + beakerH - liqTop - 2);
                ctx.font      = 'bold 11px sans-serif';
                ctx.fillStyle = '#b91c1c';
                ctx.textAlign = 'center';
                ctx.fillText('⚠ BUFFER BROKEN', x, liqTop + 30);
                ctx.fillText('component depleted', x, liqTop + 46);
                ctx.textAlign = 'left';
            }

            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.font      = '9px monospace';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'right';
            for (let i = 1; i <= 4; i++) {
                const ty = beakerY + 60 + ((beakerH - 60) / 4) * i - 4;
                ctx.beginPath();
                ctx.moveTo(x - beakerW / 2 - 8, ty);
                ctx.lineTo(x - beakerW / 2 - 2, ty);
                ctx.stroke();
                ctx.fillText(`${(100 - 25 * (i - 1))}%`, x - beakerW / 2 - 10, ty + 3);
            }
            ctx.textAlign = 'left';

            ctx.font      = 'bold 14px sans-serif';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, beakerY - 24);
            ctx.font      = '11px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText(sub, x, beakerY - 8);
            ctx.textAlign = 'left';

            const phY = beakerY + beakerH + 30;
            ctx.font      = '11px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText('Current pH', x, phY);
            ctx.font      = 'bold 36px monospace';
            ctx.fillStyle = phColor(pH);
            ctx.fillText(pH.toFixed(2), x, phY + 36);

            ctx.font      = '11px monospace';
            ctx.fillStyle = Math.abs(ph_change) > 1 ? '#dc2626' : '#16a34a';
            const sign = ph_change > 0 ? '+' : '';
            ctx.fillText(`Δ = ${sign}${ph_change.toFixed(2)}`, x, phY + 56);
            ctx.textAlign = 'left';

            const barX = x - 110, barY = phY + 76, barW = 220, barH = 14;
            const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            grad.addColorStop(0,    '#dc2626');
            grad.addColorStop(0.25, '#eab308');
            grad.addColorStop(0.5,  '#22c55e');
            grad.addColorStop(0.75, '#0891b2');
            grad.addColorStop(1,    '#a855f7');
            ctx.fillStyle = grad;
            ctx.fillRect(barX, barY, barW, barH);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
            const mx = barX + (pH / 14) * barW;
            ctx.beginPath();
            ctx.moveTo(mx, barY - 4);
            ctx.lineTo(mx - 6, barY - 14);
            ctx.lineTo(mx + 6, barY - 14);
            ctx.closePath();
            ctx.fillStyle = '#0f172a';
            ctx.fill();
            ctx.font      = '8px monospace';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ['0', '7', '14'].forEach((v) => {
                ctx.fillText(v, barX + (Number(v) / 14) * barW, barY + barH + 11);
            });
            ctx.textAlign = 'left';
        };

        beaker(380, 'Beaker A — Pure water', 'control (no buffer)', wPH, waterH * 1000, phColor(wPH), wPH - 7, false, 0, 0, false);
        beaker(900, `Beaker B — ${buf.id === 'acetic' ? 'Acidic' : 'Basic'} buffer`,
               `${buf.acidName} + ${buf.saltName}`,
               bufRes.pH, bufferH * 1000, phColor(bufRes.pH), bufRes.pH - buf.bufferPH, true,
               bufRes.acid, bufRes.salt, bufRes.broken);

        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(500, 230);
        ctx.lineTo(780, 230);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font      = 'bold 12px sans-serif';
        ctx.fillStyle = '#7c3aed';
        ctx.textAlign = 'center';
        ctx.fillText('Compare ΔpH', 640, 220);
        ctx.font      = '10px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('— add same acid/base to both —', 640, 246);
        ctx.textAlign = 'left';

        const stripX = 70, stripY = 540, stripW = W_CV - 140, stripH = 200;
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(stripX, stripY, stripW, stripH);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(stripX, stripY, stripW, stripH);

        ctx.font      = 'bold 12px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText('Titration profile — pH vs net acid added (mol)', stripX + 14, stripY + 18);
        ctx.font      = '10px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('water (grey) crashes immediately · buffer (purple) stays flat near pKa', stripX + 14, stripY + 34);

        const px0 = stripX + 60, px1 = stripX + stripW - 30;
        const py0 = stripY + 56, py1 = stripY + stripH - 24;
        const xMin = -0.5, xMax = 0.5;
        const yMin = 0,    yMax = 14;
        const xOf = (m: number) => px0 + ((m - xMin) / (xMax - xMin)) * (px1 - px0);
        const yOf = (p: number) => py1 - ((p - yMin) / (yMax - yMin)) * (py1 - py0);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(px0, py0, px1 - px0, py1 - py0);
        for (let p = 0; p <= 14; p += 2) {
            const y = yOf(p);
            ctx.beginPath();
            ctx.moveTo(px0, y); ctx.lineTo(px1, y);
            ctx.strokeStyle = 'rgba(100,116,139,0.1)';
            ctx.stroke();
            ctx.font      = '9px monospace';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'right';
            ctx.fillText(`${p}`, px0 - 4, y + 3);
        }
        for (let m = -0.5; m <= 0.5; m += 0.25) {
            const xx = xOf(m);
            ctx.font      = '9px monospace';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText(m.toFixed(2), xx, py1 + 12);
            if (m !== 0) {
                ctx.beginPath();
                ctx.moveTo(xx, py0); ctx.lineTo(xx, py1);
                ctx.strokeStyle = 'rgba(100,116,139,0.08)';
                ctx.stroke();
            }
        }
        ctx.beginPath();
        ctx.moveTo(xOf(0), py0); ctx.lineTo(xOf(0), py1);
        ctx.strokeStyle = 'rgba(71,85,105,0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font      = 'bold 10px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.fillText('net mol HCl (NaOH = negative)', (px0 + px1) / 2, py1 + 22);
        ctx.fillStyle = '#475569';
        ctx.save();
        ctx.translate(px0 - 32, (py0 + py1) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('pH', 0, 0);
        ctx.restore();
        ctx.textAlign = 'left';

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
            const m = xMin + (xMax - xMin) * (i / 100);
            const p = waterPH(m);
            const x = xOf(m), y = yOf(p);
            if (i === 0) ctx.moveTo(x, y);
            else         ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.font      = 'bold 10px sans-serif';
        ctx.fillText('water', xOf(-0.4) - 2, yOf(waterPH(-0.4)) - 6);

        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
            const m = xMin + (xMax - xMin) * (i / 200);
            const p = bufferPH(system, acid0, salt0, m).pH;
            const x = xOf(m), y = yOf(p);
            if (i === 0) ctx.moveTo(x, y);
            else         ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = '#7c3aed';
        ctx.fillText(`buffer (${buf.id})`, xOf(0.15), yOf(buf.bufferPH) - 6);

        ctx.strokeStyle = '#7c3aed40';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px0, yOf(buf.bufferPH));
        ctx.lineTo(px1, yOf(buf.bufferPH));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font      = '9px monospace';
        ctx.fillStyle = '#7c3aed';
        ctx.fillText(`pKa = ${buf.pKa}`, px1 - 60, yOf(buf.bufferPH) - 3);

        ctx.beginPath();
        ctx.arc(xOf(waterH), yOf(wPH), 6, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(xOf(bufferH), yOf(bufRes.pH), 7, 0, Math.PI * 2);
        ctx.fillStyle = '#7c3aed';
        ctx.fill();
        ctx.strokeStyle = '#4c1d95';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }, [system, acid0, salt0, waterH, bufferH, wPH, bufRes, buf]);

    useEffect(() => { drawFrame(); }, [drawFrame]);
    useEffect(() => {
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1);
            last = now;
            if (!paused) pulseRef.current += dt;
            drawFrame();
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, [drawFrame, paused]);

    const equationCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Henderson-Hasselbalch</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">NCERT Eq. 6.40 / 6.42</div>
            <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                <div className="font-mono text-[12px] text-slate-800 text-center">
                    pH = pK<sub>a</sub> + log <span className="text-blue-700">[Salt]</span> / <span className="text-amber-700">[Acid]</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600 text-center mt-1.5">
                    pH = {buf.pKa} + log({bufRes.salt.toFixed(3)} / {bufRes.acid.toFixed(3)})
                </div>
                <div className="font-mono text-[11px] text-slate-600 text-center mt-0.5">
                    pH = {buf.pKa} + ({Math.log10(Math.max(bufRes.salt, 1e-4) / Math.max(bufRes.acid, 1e-4)).toFixed(3)})
                </div>
                <div className="mt-2 font-mono text-base font-extrabold text-center" style={{ color: phColor(bufRes.pH) }}>
                    pH = {bufRes.pH.toFixed(2)}
                </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 italic leading-snug">
                When [Salt] = [Acid], log 1 = 0 ⇒ pH = pK<sub>a</sub>.
            </div>
        </div>
    );

    const ratioCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">Component Ratio</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">Acid (yellow) vs Salt (blue)</div>
            {(() => {
                const total = bufRes.acid + bufRes.salt;
                const aFrac = total > 0 ? bufRes.acid / total : 0.5;
                return (
                    <>
                        <div className="flex h-6 rounded-lg overflow-hidden border border-slate-200">
                            <div className="transition-all duration-300" style={{ width: `${aFrac * 100}%`, backgroundColor: '#eab308' }} />
                            <div className="transition-all duration-300" style={{ width: `${(1 - aFrac) * 100}%`, backgroundColor: '#2563eb' }} />
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] font-mono font-bold">
                            <span className="text-amber-700">{buf.acidName}: {bufRes.acid.toFixed(3)} M</span>
                            <span className="text-blue-700">{buf.saltName}: {bufRes.salt.toFixed(3)} M</span>
                        </div>
                    </>
                );
            })()}
            <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-[10px] font-mono text-slate-700">
                Added net mol acid: <span className="font-bold text-rose-600">{bufferH >= 0 ? '+' : ''}{bufferH.toFixed(3)}</span>
            </div>
        </div>
    );

    const examplesCard = (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="text-base font-extrabold text-slate-900">NCERT Worked Examples</div>
            <div className="text-xs font-semibold text-slate-500 mb-2">Buffer pH from §6.12</div>
            <div className="space-y-1.5">
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-1.5">
                    <div className="text-[9px] font-bold text-amber-700 uppercase">CH₃COOH / CH₃COO⁻ (equimolar)</div>
                    <div className="font-mono text-[10px] text-slate-800">pH = pKa = 4.76</div>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5">
                    <div className="text-[9px] font-bold text-blue-700 uppercase">NH₃ / NH₄Cl (equimolar)</div>
                    <div className="font-mono text-[10px] text-slate-800">pH = pKa(NH₄⁺) = 9.25</div>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5">
                    <div className="text-[9px] font-bold text-emerald-700 uppercase">Problem 6.22 — 0.1 M NH₃ + 0.2 M NH₄Cl</div>
                    <div className="font-mono text-[10px] text-slate-800">pH = 9.25 + log(0.1/0.2) ≈ 8.95</div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                    <div className="text-[9px] font-bold text-slate-600 uppercase">Dilution rule (§6.12.1)</div>
                    <div className="text-[10px] text-slate-700">pH unaffected by dilution — ratio in log stays the same.</div>
                </div>
            </div>
        </div>
    );

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                {equationCard}
                {ratioCard}
                {examplesCard}
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">

                <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl">
                    <div className="text-base font-extrabold text-violet-900">Buffer Solution</div>
                    <div className="text-xs font-semibold text-violet-600 mb-2">NCERT §6.12</div>
                    <p className="text-[12px] text-violet-900 leading-relaxed mb-2">
                        Solution that <strong>resists pH change</strong> on dilution or addition of small amounts of acid/alkali.
                    </p>
                    <div className="space-y-1.5 text-[11px]">
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
                            <div className="font-bold text-amber-700 uppercase text-[9px]">Acidic buffer</div>
                            <div className="text-amber-900">Weak acid + salt with strong base</div>
                            <div className="font-mono text-amber-700 mt-0.5">e.g. CH₃COOH / CH₃COONa  ~ pH 4.75</div>
                        </div>
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-2">
                            <div className="font-bold text-blue-700 uppercase text-[9px]">Basic buffer</div>
                            <div className="text-blue-900">Weak base + salt with strong acid</div>
                            <div className="font-mono text-blue-700 mt-0.5">e.g. NH₃ / NH₄Cl  ~ pH 9.25</div>
                        </div>
                    </div>
                    <div className="mt-2 rounded-lg bg-white/80 border border-violet-300 p-2 text-[10px] text-violet-800">
                        <strong>Why it works:</strong> added H⁺ converts salt → acid; added OH⁻ converts acid → salt. The ratio (and so pH) barely changes.
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">LIVE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold uppercase text-slate-500">Water pH</div>
                            <div className="font-mono text-base font-extrabold" style={{ color: phColor(wPH) }}>{wPH.toFixed(2)}</div>
                            <div className="text-[9px] text-slate-500">Δ {wPH >= 7 ? '+' : ''}{(wPH - 7).toFixed(2)}</div>
                        </div>
                        <div className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1.5 text-center">
                            <div className="text-[9px] font-bold uppercase text-violet-500">Buffer pH</div>
                            <div className="font-mono text-base font-extrabold" style={{ color: phColor(bufRes.pH) }}>{bufRes.pH.toFixed(2)}</div>
                            <div className="text-[9px] text-violet-500">Δ {bufRes.pH >= buf.bufferPH ? '+' : ''}{(bufRes.pH - buf.bufferPH).toFixed(2)}</div>
                        </div>
                    </div>
                    <div className="mt-2 rounded-lg border border-slate-100 bg-amber-50 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-amber-500">{buf.acidName}</div>
                        <div className="font-mono text-sm font-extrabold text-amber-700">{bufRes.acid.toFixed(3)} M</div>
                    </div>
                    <div className="mt-1.5 rounded-lg border border-slate-100 bg-blue-50 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-blue-500">{buf.saltName}</div>
                        <div className="font-mono text-sm font-extrabold text-blue-700">{bufRes.salt.toFixed(3)} M</div>
                    </div>
                    <div className="mt-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">pKa  ·  pKb</div>
                        <div className="font-mono text-sm font-extrabold text-slate-800">{buf.pKa}  ·  {buf.pKb}</div>
                        <div className="text-[9px] text-slate-500">pKa + pKb = 14 at 298 K</div>
                    </div>
                    {bufRes.broken && (
                        <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-rose-500">⚠ Buffer Broken</div>
                            <div className="text-[10px] text-rose-700">A component depleted — pH no longer protected.</div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );

    const inCanvasStatus = (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-md text-xs font-bold"
             style={{ borderColor: buf.color + '60' }}>
            <Atom size={12} style={{ color: buf.color }} />
            <span className="font-mono text-slate-700">{buf.acidName}/{buf.saltName}</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-700">water pH={wPH.toFixed(2)}</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-base font-extrabold" style={{ color: phColor(bufRes.pH) }}>
                buffer pH={bufRes.pH.toFixed(2)}
            </span>
        </div>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W_CV} height={H_CV} className="absolute inset-0 h-full w-full" />
                <div className="absolute top-3 left-3 z-10 pointer-events-auto">{inCanvasStatus}</div>
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button onClick={() => setPaused(p => !p)}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const bufBtn = (b: BufferInfo) => {
        const active = b.id === system;
        return (
            <button key={b.id} onClick={() => { setSystem(b.id); setWaterH(0); setBufferH(0); }}
                className={`flex-1 min-w-[120px] px-2 py-1.5 rounded-lg border transition-all flex flex-col items-center ${
                    active ? 'text-white shadow-md scale-105' : 'bg-white hover:scale-105 hover:shadow'
                }`}
                style={{
                    backgroundColor: active ? b.color : 'white',
                    borderColor:     active ? b.color : (b.color + '60'),
                    color:           active ? 'white' : b.color,
                }}>
                <span className="font-mono text-xs font-extrabold">{b.acidName} / {b.saltName}</span>
                <span className={`text-[9px] mt-0.5 ${active ? 'text-white/85' : 'opacity-70'}`}>
                    pKa = {b.pKa} · buffer ~ pH {b.bufferPH}
                </span>
            </button>
        );
    };

    const reagentBtn = (label: string, mol: number, target: 'water' | 'buffer', color: string) => (
        <button onClick={() => (target === 'water' ? addToWater : addToBuffer)(mol)}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-bold border transition-all"
            style={{ borderColor: color + '80', color, backgroundColor: 'white' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = color + '20')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
            <Droplets size={11} />
            {label}
        </button>
    );

    const controlsCombo = (
        <div className="w-full flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <Atom size={16} className="text-violet-600" />
                <span className="text-sm font-extrabold text-slate-800">Buffer Solution Bench</span>
                <span className="ml-auto font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2 py-0.5">
                    Water pH {wPH.toFixed(2)} · Buffer pH {bufRes.pH.toFixed(2)}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-3">

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Buffer System</div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2 flex flex-wrap gap-1.5">
                        {BUFFERS.map(bufBtn)}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                            [{buf.acidName.split(' ')[0]}]
                        </label>
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 rounded">{acid0.toFixed(2)} M</span>
                    </div>
                    <input type="range" min={0.05} max={1} step={0.05} value={acid0}
                        onChange={e => { setAcid0(Number(e.target.value)); setBufferH(0); }}
                        className="w-full accent-amber-600 h-1.5 cursor-pointer" />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            [{buf.saltName.split(' ')[0]}]
                        </label>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 rounded">{salt0.toFixed(2)} M</span>
                    </div>
                    <input type="range" min={0.05} max={1} step={0.05} value={salt0}
                        onChange={e => { setSalt0(Number(e.target.value)); setBufferH(0); }}
                        className="w-full accent-blue-600 h-1.5 cursor-pointer" />
                </div>

                <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Add Reagent</div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2 grid grid-cols-2 gap-1.5">
                        <div className="col-span-2 text-[9px] font-bold uppercase text-slate-500 text-center">Water Beaker</div>
                        {reagentBtn('+0.01 HCl',  +0.01, 'water', '#dc2626')}
                        {reagentBtn('+0.01 NaOH', -0.01, 'water', '#2563eb')}
                        <div className="col-span-2 text-[9px] font-bold uppercase text-slate-500 text-center mt-1">Buffer Beaker</div>
                        {reagentBtn('+0.01 HCl',  +0.01, 'buffer', '#dc2626')}
                        {reagentBtn('+0.01 NaOH', -0.01, 'buffer', '#2563eb')}
                        <div className="col-span-2 flex gap-1.5 mt-0.5">
                            <button onClick={() => { setWaterH(0); setBufferH(0); }}
                                className="flex-1 text-[10px] font-bold border border-slate-200 rounded px-2 py-1 hover:bg-slate-100">
                                Reset adds
                            </button>
                        </div>
                    </div>
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

export default BufferSolutionsLab;
