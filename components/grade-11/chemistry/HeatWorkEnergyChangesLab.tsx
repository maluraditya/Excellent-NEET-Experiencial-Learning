import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import { Topic } from '../../../types';

interface Props { topic: Topic; onExit: () => void; }

const W_CV = 1280;
const H_CV = 760;
const L_BAR_TO_J = 100;       // 1 L·bar ≈ 100 J (NCERT-scale)
const HEAT_CAPACITY = 24;

type PresetId = 'heating' | 'cooling' | 'expansion' | 'compression' | 'engine' | 'pump';

interface Preset {
    id: PresetId;
    label: string;
    q: number;
    dV: number;
    pExt: number;
    color: string;
    note: string;
}

const PRESETS: Preset[] = [
    { id: 'heating',     label: 'Heat in',         q: 1800,  dV: 0,    pExt: 1,   color: '#dc2626', note: 'Constant volume: heat directly raises internal energy (ΔU = q_v).' },
    { id: 'cooling',     label: 'Heat out',        q: -1500, dV: 0,    pExt: 1,   color: '#2563eb', note: 'Heat leaves the system, so q is negative.' },
    { id: 'expansion',   label: 'Expansion',       q: 0,     dV: 3,    pExt: 1.2, color: '#7c3aed', note: 'Gas pushes the surroundings: work is done by the system, so w is negative.' },
    { id: 'compression', label: 'Compression',     q: 0,     dV: -2.6, pExt: 1.5, color: '#0891b2', note: 'Surroundings push the gas: work is done on the system, so w is positive.' },
    { id: 'engine',      label: 'Heat + expand',   q: 2400,  dV: 3.8,  pExt: 1,   color: '#ea580c', note: 'Some supplied heat becomes expansion work; the rest remains as ΔU.' },
    { id: 'pump',        label: 'Cool + compress', q: -1000, dV: -3,   pExt: 1.4, color: '#0f766e', note: 'Cooling removes energy while compression adds energy through work.' },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const formatJ = (value: number) => `${Math.round(value) >= 0 ? '+' : ''}${Math.round(value)} J`;

interface Mol { nx: number; ny: number; vx: number; vy: number; }

const HeatWorkEnergyChangesLab: React.FC<Props> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const pulseRef = useRef(0);
    const animPRef = useRef(0);
    const dtRef = useRef(0);
    const molsRef = useRef<Mol[]>([]);

    const [q, setQ] = useState(1800);
    const [dV, setDV] = useState(0);
    const [pExt, setPExt] = useState(1);
    const [presetId, setPresetId] = useState<PresetId>('heating');
    const [paused, setPaused] = useState(false);

    const preset = useMemo(() => PRESETS.find(p => p.id === presetId)!, [presetId]);
    const w = useMemo(() => -pExt * dV * L_BAR_TO_J, [dV, pExt]);
    const dU = q + w;
    const tempFinal = clamp(300 + dU / HEAT_CAPACITY, 170, 620);
    const vInitial = 4.2;
    const vFinal = clamp(vInitial + dV, 1.1, 8);

    if (molsRef.current.length === 0) {
        molsRef.current = Array.from({ length: 46 }, () => ({
            nx: Math.random(), ny: Math.random(),
            vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.6,
        }));
    }

    const setPreset = useCallback((next: Preset) => {
        setPresetId(next.id);
        setQ(next.q);
        setDV(next.dV);
        setPExt(next.pExt);
    }, []);

    const handleReset = useCallback(() => setPreset(PRESETS[0]), [setPreset]);

    useEffect(() => { animPRef.current = 0; }, [q, dV, pExt]);

    // ---- Canvas: apparatus only (centred piston, thermometer, heat/work arrows) ----
    const drawFrame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, W_CV, H_CV);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W_CV, H_CV);

        ctx.strokeStyle = 'rgba(100,116,139,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W_CV; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H_CV); ctx.stroke(); }
        for (let y = 0; y <= H_CV; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W_CV, y); ctx.stroke(); }

        const animP = easeOut(animPRef.current);
        const activeVol = lerp(vInitial, vFinal, animP);
        const activeTemp = lerp(300, tempFinal, animP);
        const tempNorm = clamp((activeTemp - 170) / 450, 0, 1);

        // brief caption (single line — allowed)
        ctx.fillStyle = '#64748b';
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Ideal gas in a piston — observe how heat (q) and work (w) change the internal energy (ΔU)', W_CV / 2, 46);

        drawApparatus(ctx, activeVol, tempNorm, activeTemp, q, dV, pExt, preset.color, pulseRef.current, dtRef.current, paused, molsRef.current);
    }, [dV, pExt, preset, q, tempFinal, vFinal, paused]);

    useEffect(() => {
        let last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            dtRef.current = dt;
            if (!paused) {
                pulseRef.current += dt;
                animPRef.current = Math.min(1, animPRef.current + dt / 0.7);
            }
            drawFrame();
            rafRef.current = requestAnimationFrame(loop);
        };
        drawFrame();
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, [drawFrame, paused]);

    /* ---------------- Left aside — balance chart + sign convention ---------------- */
    const balance = [
        { label: 'q', value: q, color: '#dc2626' },
        { label: 'w', value: w, color: '#2563eb' },
        { label: 'ΔU', value: dU, color: '#16a34a' },
    ];
    const maxAbs = Math.max(1000, ...balance.map(b => Math.abs(b.value))) * 1.15;
    const baseY = 112;
    const barScale = 78 / maxAbs;

    const signRows = [
        { title: q >= 0 ? 'q  positive' : 'q  negative', text: q >= 0 ? 'heat absorbed by system' : 'heat released by system', color: q >= 0 ? '#dc2626' : '#2563eb' },
        { title: dV >= 0 ? 'ΔV  positive' : 'ΔV  negative', text: dV >= 0 ? 'expansion (volume ↑)' : 'compression (volume ↓)', color: dV >= 0 ? '#7c3aed' : '#0891b2' },
        { title: w >= 0 ? 'w  positive' : 'w  negative', text: w >= 0 ? 'work done on the system' : 'work done by the system', color: w >= 0 ? '#15803d' : '#be123c' },
    ];

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">First-law balance</div>
                    <div className="text-xs font-semibold text-slate-500">ΔU = q + w</div>
                    <svg viewBox="0 0 300 200" className="mt-1 w-full">
                        <line x1={28} y1={baseY} x2={288} y2={baseY} stroke="#cbd5e1" strokeWidth={1.5} />
                        <text x={20} y={baseY - 4} fontSize={9} fontWeight={700} fill="#94a3b8">0</text>
                        {balance.map((b, i) => {
                            const cx = 64 + i * 88;
                            const h = Math.abs(b.value) * barScale;
                            const y = b.value >= 0 ? baseY - h : baseY;
                            return (
                                <g key={b.label}>
                                    <rect x={cx - 26} y={y} width={52} height={h} rx={6} fill={b.color} />
                                    <text x={cx} y={188} fontSize={15} fontWeight={800} textAnchor="middle" fill="#0f172a">{b.label}</text>
                                    <text x={cx} y={b.value >= 0 ? y - 6 : y + h + 14} fontSize={11} fontWeight={800} textAnchor="middle" fill={b.value >= 0 ? '#15803d' : '#be123c'}>{formatJ(b.value)}</text>
                                </g>
                            );
                        })}
                    </svg>
                    <div className="text-[11px] leading-snug text-slate-500">Bars above 0 add energy to the system; bars below 0 remove it.</div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold text-slate-900">Sign convention</div>
                    <div className="text-xs font-semibold text-slate-500">IUPAC · positive when added to system</div>
                    <div className="mt-2 flex flex-col gap-1.5">
                        {signRows.map(r => (
                            <div key={r.title} className="rounded-lg px-3 py-1.5" style={{ backgroundColor: r.color + '18', border: `1px solid ${r.color}55` }}>
                                <div className="text-[13px] font-extrabold" style={{ color: r.color }}>{r.title}</div>
                                <div className="text-[11px] font-semibold text-slate-600">{r.text}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 rounded-lg bg-slate-50 px-3 py-1.5 text-center font-mono text-[13px] font-bold text-slate-800">w = − Pₑₓₜ · ΔV</div>
                </div>
            </div>
        </aside>
    );

    /* ---------------- Right aside — theory + live values ---------------- */
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">First law of thermodynamics</div>
                    <div className="text-xs font-semibold text-amber-700">Class 11 Chemistry, Ch 5 §5.1–5.2</div>
                    <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-900">
                        <div>ΔU = q + w. Energy of an isolated system is constant.</div>
                        <div>q &gt; 0: heat absorbed · q &lt; 0: heat released.</div>
                        <div>w &gt; 0: work on system · w &lt; 0: work by system.</div>
                        <div>Expansion work: w = − Pₑₓₜ·ΔV. At constant V, w = 0 and ΔU = q_v.</div>
                    </div>
                    <div className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-[12px] font-semibold leading-snug" style={{ color: preset.color }}>
                        {preset.note}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-900">Real-time values</div>
                        <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</div>
                    </div>
                    <div className="mt-3 space-y-2">
                        {[
                            { label: 'Heat q', value: formatJ(q), tint: 'bg-rose-50', fg: 'text-rose-700' },
                            { label: 'Work w', value: formatJ(w), tint: 'bg-blue-50', fg: 'text-blue-700' },
                            { label: 'Internal energy ΔU', value: formatJ(dU), tint: 'bg-emerald-50', fg: 'text-emerald-700' },
                            { label: 'Volume change ΔV', value: `${dV.toFixed(1)} L`, tint: 'bg-violet-50', fg: 'text-violet-700' },
                            { label: 'External pressure', value: `${pExt.toFixed(1)} bar`, tint: 'bg-cyan-50', fg: 'text-cyan-700' },
                            { label: 'Final temperature', value: `${Math.round(tempFinal)} K`, tint: 'bg-amber-50', fg: 'text-amber-700' },
                        ].map(r => (
                            <div key={r.label} className={`rounded-lg border border-slate-100 ${r.tint} px-3 py-2.5`}>
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{r.label}</div>
                                <div className={`mt-0.5 font-mono text-base font-extrabold ${r.fg}`}>{r.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W_CV} height={H_CV} className="absolute inset-0 h-full w-full" />
                <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
                    <button onClick={() => setPaused(p => !p)} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <button onClick={handleReset} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50" title="Reset">
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Flame size={18} className="text-rose-600" />
                Heat, Work &amp; Energy Bench
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Process</div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {PRESETS.map(option => (
                            <button
                                key={option.id}
                                onClick={() => setPreset(option)}
                                className={`rounded-xl border px-2 py-2 text-xs font-extrabold transition-all active:scale-95 ${presetId === option.id ? 'text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                style={{ backgroundColor: presetId === option.id ? option.color : '#ffffff', borderColor: presetId === option.id ? option.color : '#e2e8f0' }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-3">
                    <SliderBlock label="Heat q" value={q} valueText={formatJ(q)} min={-3000} max={3000} step={100} color="accent-rose-600" onChange={setQ} />
                    <SliderBlock label="Volume change ΔV" value={dV} valueText={`${dV.toFixed(1)} L`} min={-3.5} max={3.8} step={0.1} color="accent-violet-600" onChange={setDV} />
                    <SliderBlock label="External pressure" value={pExt} valueText={`${pExt.toFixed(1)} bar`} min={0} max={3} step={0.1} color="accent-cyan-600" onChange={setPExt} />
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
            controlsAreaFlex="0 0 220px"
            simulationStageWidth={W_CV}
            simulationStageHeight={H_CV}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

interface SliderBlockProps {
    label: string; value: number; valueText: string;
    min: number; max: number; step: number; color: string;
    onChange: (value: number) => void;
}

const SliderBlock: React.FC<SliderBlockProps> = ({ label, value, valueText, min, max, step, color, onChange }) => (
    <div>
        <div className="mb-1 flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
            <span className="rounded bg-slate-50 px-2 font-mono text-xs font-bold text-slate-800">{valueText}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className={`h-1.5 w-full cursor-pointer ${color}`} />
    </div>
);

/* ----------------------------- Apparatus drawing ----------------------------- */

function drawApparatus(
    ctx: CanvasRenderingContext2D,
    volume: number, tempNorm: number, tempK: number,
    q: number, dV: number, pExt: number, color: string,
    pulse: number, dt: number, paused: boolean, mols: Mol[],
) {
    const cx = 600;
    const cylW = 240;
    const cylTop = 170;
    const cylBottom = 588;
    const cylH = cylBottom - cylTop;
    const frac = clamp((volume - 1) / 7, 0.06, 0.95);
    const pistonY = cylBottom - frac * cylH;

    // cylinder walls (U-shape, open top)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - cylW / 2, cylTop);
    ctx.lineTo(cx - cylW / 2, cylBottom);
    ctx.lineTo(cx + cylW / 2, cylBottom);
    ctx.lineTo(cx + cylW / 2, cylTop);
    ctx.stroke();

    // gas fill (colour tracks temperature)
    const red = Math.round(70 + tempNorm * 190);
    const blue = Math.round(230 - tempNorm * 150);
    const gasGrad = ctx.createLinearGradient(cx, pistonY, cx, cylBottom);
    gasGrad.addColorStop(0, `rgba(${red},80,${blue},0.30)`);
    gasGrad.addColorStop(1, `rgba(${red},80,${blue},0.12)`);
    ctx.fillStyle = gasGrad;
    ctx.fillRect(cx - cylW / 2 + 3, pistonY + 1, cylW - 6, cylBottom - pistonY - 4);

    // molecules — continuous jitter inside the gas box, speed ∝ temperature
    const gx0 = cx - cylW / 2 + 14, gx1 = cx + cylW / 2 - 14;
    const gy0 = pistonY + 14, gy1 = cylBottom - 10;
    const speed = 0.10 + tempNorm * 0.55;
    const count = clamp(Math.round(volume * 6), 16, mols.length);
    for (let i = 0; i < count; i++) {
        const m = mols[i];
        if (!paused) {
            m.nx += m.vx * speed * dt;
            m.ny += m.vy * speed * dt;
            if (m.nx < 0.02) { m.nx = 0.02; m.vx = Math.abs(m.vx); }
            if (m.nx > 0.98) { m.nx = 0.98; m.vx = -Math.abs(m.vx); }
            if (m.ny < 0.02) { m.ny = 0.02; m.vy = Math.abs(m.vy); }
            if (m.ny > 0.98) { m.ny = 0.98; m.vy = -Math.abs(m.vy); }
        }
        const px = gx0 + m.nx * (gx1 - gx0);
        const py = gy0 + m.ny * (gy1 - gy0);
        ctx.save();
        ctx.shadowColor = color; ctx.shadowBlur = 6;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // piston slab + rod + handle
    ctx.fillStyle = '#cbd5e1';
    roundRect(ctx, cx - cylW / 2 + 2, pistonY - 15, cylW - 4, 16, 3); ctx.fill();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
    roundRect(ctx, cx - cylW / 2 + 2, pistonY - 15, cylW - 4, 16, 3); ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 8, cylTop - 52, 16, pistonY - 15 - (cylTop - 52));
    ctx.fillStyle = '#64748b';
    roundRect(ctx, cx - 40, cylTop - 66, 80, 16, 4); ctx.fill();

    // expansion / compression arrows beside the piston
    if (Math.abs(dV) > 0.05) {
        const ec = dV > 0 ? '#7c3aed' : '#0891b2';
        ctx.strokeStyle = ec; ctx.fillStyle = ec; ctx.lineWidth = 4;
        const ay = pistonY - 7;
        if (dV > 0) {
            arrow(ctx, cx - cylW / 2 - 10, ay, cx - cylW / 2 - 48, ay);
            arrow(ctx, cx + cylW / 2 + 10, ay, cx + cylW / 2 + 48, ay);
        } else {
            arrow(ctx, cx - cylW / 2 - 48, ay, cx - cylW / 2 - 12, ay);
            arrow(ctx, cx + cylW / 2 + 48, ay, cx + cylW / 2 + 12, ay);
        }
        ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(dV > 0 ? 'expansion · w < 0' : 'compression · w > 0', cx, cylTop - 84);
    }

    // live thermometer to the right of the cylinder
    const tubeX = cx + cylW / 2 + 86;
    const tubeTop = cylTop + 10, tubeBot = cylBottom - 16;
    const tubeH = tubeBot - tubeTop;
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2;
    roundRect(ctx, tubeX - 10, tubeTop, 20, tubeH, 10); ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.arc(tubeX, tubeBot + 10, 16, 0, Math.PI * 2); ctx.fill();
    const fillH = tubeH * tempNorm;
    const thermColor = `rgb(${Math.round(60 + tempNorm * 195)},${Math.round(120 - tempNorm * 70)},${Math.round(220 - tempNorm * 160)})`;
    ctx.fillStyle = thermColor;
    ctx.beginPath(); ctx.arc(tubeX, tubeBot + 10, 12, 0, Math.PI * 2); ctx.fill();
    roundRect(ctx, tubeX - 6, tubeBot - fillH, 12, fillH, 6); ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(tempK)} K`, tubeX, tubeTop - 14);

    // flowing heat arrows beneath the cylinder
    if (q !== 0) {
        const hc = q > 0 ? '#dc2626' : '#2563eb';
        const inward = q > 0;
        const top = cylBottom + 22, bottom = cylBottom + 82;
        const phase = (pulse * 0.9) % 1;
        for (let i = 0; i < 3; i++) {
            const ax = cx - 72 + i * 72;
            for (let k = 0; k < 3; k++) {
                const f = (phase + k / 3) % 1;
                const cyp = inward ? bottom - f * (bottom - top) : top + f * (bottom - top);
                ctx.fillStyle = hc;
                ctx.globalAlpha = 0.4 + 0.6 * (1 - Math.abs(f - 0.5) * 2);
                chevron(ctx, ax, cyp, inward);
            }
        }
        ctx.globalAlpha = 1;
        ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = hc; ctx.textAlign = 'center';
        ctx.fillText(q > 0 ? 'heat enters · q > 0' : 'heat leaves · q < 0', cx, bottom + 26);
    } else {
        ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#64748b'; ctx.textAlign = 'center';
        ctx.fillText('q = 0 (no heat flow)', cx, cylBottom + 50);
    }

    // short readout labels (volume / pressure)
    ctx.fillStyle = '#0f172a'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`V = ${volume.toFixed(1)} L      Pₑₓₜ = ${pExt.toFixed(1)} bar`, cx, 712);
    ctx.textAlign = 'left';
}

/* ----------------------------- helpers ----------------------------- */

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 12 * Math.cos(angle - Math.PI / 6), y2 - 12 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - 12 * Math.cos(angle + Math.PI / 6), y2 - 12 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle.toString();
    ctx.fill();
}

function chevron(ctx: CanvasRenderingContext2D, cx: number, cy: number, up: boolean) {
    const s = 10, d = up ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy + d * s);
    ctx.lineTo(cx, cy - d * s);
    ctx.lineTo(cx + s, cy + d * s);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

export default HeatWorkEnergyChangesLab;
