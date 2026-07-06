import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface HormoneActionAxisLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Hormone = 'insulin' | 'glucagon' | 'adrenaline' | 'cortisol' | 'testosterone' | 'estrogen' | 'thyroxine' | 'ACTH' | 'TSH' | 'LH' | 'FSH' | 'GH';
type Axis = 'hpa' | 'hpt' | 'hpg';
type Disorder = 'none' | 'diabetes' | 'goitre' | 'cretinism' | 'dwarfism' | 'gigantism' | 'acromegaly';

const HORMONE_META: Record<Hormone, { class: 'peptide' | 'steroid' | 'iodo' | 'amine'; color: string }> = {
  insulin:      { class: 'peptide', color: '#16a34a' },
  glucagon:     { class: 'peptide', color: '#f59e0b' },
  adrenaline:   { class: 'amine',   color: '#dc2626' },
  cortisol:     { class: 'steroid', color: '#7c3aed' },
  testosterone: { class: 'steroid', color: '#0c4a6e' },
  estrogen:     { class: 'steroid', color: '#be185d' },
  thyroxine:    { class: 'iodo',    color: '#dc2626' },
  ACTH:         { class: 'peptide', color: '#0891b2' },
  TSH:          { class: 'peptide', color: '#0891b2' },
  LH:           { class: 'peptide', color: '#0891b2' },
  FSH:          { class: 'peptide', color: '#0891b2' },
  GH:           { class: 'peptide', color: '#0891b2' },
};

const AXIS_META: Record<Axis, { label: string; chain: { from: string; to: string; hormone: string }[] }> = {
  hpa: {
    label: 'HPA — Stress Axis',
    chain: [
      { from: 'Hypothalamus', to: 'Pituitary',    hormone: 'CRH' },
      { from: 'Pituitary',    to: 'Adrenal cortex', hormone: 'ACTH' },
      { from: 'Adrenal cortex', to: 'Body tissues', hormone: 'Cortisol' },
    ],
  },
  hpt: {
    label: 'HPT — Thyroid Axis',
    chain: [
      { from: 'Hypothalamus', to: 'Pituitary', hormone: 'TRH' },
      { from: 'Pituitary',    to: 'Thyroid',   hormone: 'TSH' },
      { from: 'Thyroid',      to: 'Body tissues', hormone: 'T3 / T4' },
    ],
  },
  hpg: {
    label: 'HPG — Gonadal Axis',
    chain: [
      { from: 'Hypothalamus', to: 'Pituitary', hormone: 'GnRH' },
      { from: 'Pituitary',    to: 'Gonads',    hormone: 'LH / FSH' },
      { from: 'Gonads',       to: 'Body tissues', hormone: 'Testosterone / Estrogen' },
    ],
  },
};

const HormoneActionAxisLab: React.FC<HormoneActionAxisLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const tRef = useRef(0);
  const cascadeStepRef = useRef(0);
  const axisProgressRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [hormone, setHormone] = useState<Hormone>('insulin');
  const [axis, setAxis] = useState<Axis>('hpa');
  const [disorder, setDisorder] = useState<Disorder>('none');
  const [autoLoop, setAutoLoop] = useState(true);

  const handleReset = useCallback(() => {
    cascadeStepRef.current = 0;
    axisProgressRef.current = 0;
    tRef.current = 0;
  }, []);

  useEffect(() => {
    const tick = (now: number) => {
      const dt = Math.min(60, now - (lastRef.current || now));
      lastRef.current = now;
      if (!paused) step(dt / 1000);
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, hormone, axis, disorder, autoLoop]);

  const step = (dt: number) => {
    tRef.current += dt;
    if (autoLoop) {
      axisProgressRef.current += dt * 0.4;
      if (axisProgressRef.current > 3.5) axisProgressRef.current = 0;
    }
    cascadeStepRef.current = (tRef.current * 0.5) % 1;
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#1e293b';
    ctx.font = '700 18px Inter';
    ctx.fillText('Hormone Action & Tropic Hormone Axis', 30, 40);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §19.4 — peptide via membrane receptor + 2nd messenger · steroid via nuclear receptor + gene expression', 30, 60);

    drawAxisStrip(ctx);
    drawMembraneCell(ctx, 330, 470);
    drawNuclearCell(ctx, 950, 470);
  };

  const drawAxisStrip = (ctx: CanvasRenderingContext2D) => {
    const axisInfo = AXIS_META[axis];
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillRect(50, 90, W - 100, 130);
    ctx.strokeRect(50, 90, W - 100, 130);
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 14px Inter';
    ctx.fillText(axisInfo.label, 70, 115);

    const stepWidth = (W - 200) / axisInfo.chain.length;
    const yLine = 170;
    for (let i = 0; i < axisInfo.chain.length; i++) {
      const step = axisInfo.chain[i];
      const x = 100 + i * stepWidth;
      // gland box
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 2;
      ctx.fillRect(x, yLine - 20, stepWidth - 30, 40);
      ctx.strokeRect(x, yLine - 20, stepWidth - 30, 40);
      ctx.fillStyle = '#0c4a6e';
      ctx.font = '700 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(step.from, x + (stepWidth - 30) / 2, yLine);
      ctx.textAlign = 'left';
      // arrow with hormone label
      if (i < axisInfo.chain.length - 1) {
        const ax = x + stepWidth - 30 + 5;
        const ay = yLine;
        const bx = x + stepWidth - 5;
        // active arrow during this progress phase
        const active = axisProgressRef.current > i && axisProgressRef.current < i + 1;
        ctx.strokeStyle = active ? '#dc2626' : '#94a3b8';
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, ay);
        ctx.stroke();
        // arrowhead
        ctx.beginPath();
        ctx.moveTo(bx, ay);
        ctx.lineTo(bx - 8, ay - 5);
        ctx.lineTo(bx - 8, ay + 5);
        ctx.closePath();
        ctx.fillStyle = active ? '#dc2626' : '#94a3b8';
        ctx.fill();
        // hormone label
        ctx.fillStyle = active ? '#7f1d1d' : '#475569';
        ctx.font = active ? '700 11px Inter' : '600 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(step.hormone, (ax + bx) / 2, ay - 8);
        ctx.textAlign = 'left';
      } else {
        // final → target
        ctx.fillStyle = '#475569';
        ctx.font = '600 11px Inter';
        ctx.fillText(`→ ${step.to}`, x, yLine + 35);
        ctx.fillText(`(${step.hormone})`, x, yLine + 50);
      }
    }

    // disorder break indicator
    if (disorder !== 'none') {
      ctx.fillStyle = '#fee2e2';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.fillRect(W / 2 - 200, 200, 400, 18);
      ctx.strokeRect(W / 2 - 200, 200, 400, 18);
      ctx.fillStyle = '#991b1b';
      ctx.font = '700 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠ ${disorder.toUpperCase()} — axis broken (NCERT-named disorder)`, W / 2, 214);
      ctx.textAlign = 'left';
    }
  };

  const drawMembraneCell = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    const isPep = HORMONE_META[hormone].class === 'peptide' || HORMONE_META[hormone].class === 'amine';
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.fillStyle = '#ecfeff';
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '700 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Cell (membrane receptor)', cx, cy - 160);
    ctx.textAlign = 'left';

    // nucleus
    ctx.beginPath();
    ctx.arc(cx, cy + 30, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#cffafe';
    ctx.strokeStyle = '#0e7490';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('nucleus', cx, cy + 35);
    ctx.textAlign = 'left';

    // membrane receptor
    ctx.fillStyle = '#0891b2';
    ctx.fillRect(cx - 8, cy - 180, 16, 20);

    if (isPep) {
      // hormone docking
      const t = (tRef.current * 0.6) % 1;
      const hy = cy - 250 + t * 70;
      ctx.beginPath();
      ctx.arc(cx, hy, 8, 0, Math.PI * 2);
      ctx.fillStyle = HORMONE_META[hormone].color;
      ctx.fill();

      // 2nd messengers (cyclic AMP)
      if (t > 0.9) {
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2;
          const r = 30 + (t - 0.9) * 400;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(ang) * r, cy - 150 + Math.sin(ang) * r, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#06b6d4';
          ctx.fill();
        }
      }
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('→ cyclic AMP (2nd msg)', cx, cy + 110);
      ctx.fillText('→ enzyme cascade', cx, cy + 125);
      ctx.fillText(`Response: ${hormoneResponse(hormone)}`, cx, cy + 140);
      ctx.textAlign = 'left';
    } else {
      // greyed out
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('(Steroid — uses other cell)', cx, cy + 110);
      ctx.textAlign = 'left';
    }
  };

  const drawNuclearCell = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    const isSteroid = HORMONE_META[hormone].class === 'steroid' || HORMONE_META[hormone].class === 'iodo';
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.fillStyle = '#fdf4ff';
    ctx.strokeStyle = '#a21caf';
    ctx.lineWidth = 4;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#86198f';
    ctx.font = '700 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Cell (nuclear receptor)', cx, cy - 160);
    ctx.textAlign = 'left';

    // nucleus
    ctx.beginPath();
    ctx.arc(cx, cy + 30, 50, 0, Math.PI * 2);
    ctx.fillStyle = isSteroid ? '#fae8ff' : '#fdf4ff';
    ctx.strokeStyle = '#86198f';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#86198f';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('nucleus + DNA', cx, cy + 35);
    ctx.textAlign = 'left';

    if (isSteroid) {
      // hormone enters membrane and travels to nucleus
      const t = (tRef.current * 0.6) % 1;
      const hy = cy - 250 + t * 250;
      ctx.beginPath();
      ctx.arc(cx, hy, 8, 0, Math.PI * 2);
      ctx.fillStyle = HORMONE_META[hormone].color;
      ctx.shadowColor = HORMONE_META[hormone].color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      // gene activation glow when in nucleus
      if (t > 0.7) {
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.arc(cx - 30 + i * 12, cy + 30 + Math.sin(t * Math.PI * 4 + i) * 3, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#a21caf';
          ctx.fill();
        }
      }
      ctx.fillStyle = '#1e293b';
      ctx.font = '700 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('→ binds nuclear receptor', cx, cy + 110);
      ctx.fillText('→ regulates gene expression', cx, cy + 125);
      ctx.fillText(`Response: ${hormoneResponse(hormone)}`, cx, cy + 140);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('(Peptide — uses other cell)', cx, cy + 110);
      ctx.textAlign = 'left';
    }
  };

  const hormoneResponse = (h: Hormone): string => {
    const r: Record<Hormone, string> = {
      insulin: 'glucose uptake ↑',
      glucagon: 'gluconeogenesis ↑',
      adrenaline: 'heart rate ↑',
      cortisol: 'gluconeogenesis, anti-inflammatory',
      testosterone: 'spermatogenesis, 2° sex characters',
      estrogen: 'female 2° sex characters',
      thyroxine: 'BMR ↑',
      ACTH: 'adrenal cortex → cortisol',
      TSH: 'thyroid → T3/T4',
      LH: 'ovulation / androgens',
      FSH: 'follicle / spermatogenesis',
      GH: 'growth ↑',
    };
    return r[h];
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Hormone Library</div>
          <div className="text-xs font-semibold text-slate-500">Click to select</div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {(Object.keys(HORMONE_META) as Hormone[]).map(h => (
              <button key={h} onClick={() => setHormone(h)} className={`px-2 py-1 text-[11px] font-bold rounded border ${hormone === h ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                {h}
              </button>
            ))}
          </div>
          <p className="text-[10px] mt-2 text-slate-500">Class: <b>{HORMONE_META[hormone].class}</b></p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Receptor Pathway</div>
          <ul className="mt-2 text-xs space-y-1">
            <li><b className="text-cyan-700">Peptide / amine</b> → membrane receptor → 2nd messenger (cAMP, IP₃, Ca²⁺)</li>
            <li><b className="text-fuchsia-700">Steroid / iodothyronine</b> → intracellular (nuclear) receptor → gene expression</li>
          </ul>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-fuchsia-900">Mechanism &amp; Axis</div>
          <div className="text-xs font-semibold text-fuchsia-700 mt-0.5">NCERT §19.4 + §19.2</div>
          <p className="text-sm text-fuchsia-950 mt-2 leading-snug">
            Hormones bind specific receptors. Membrane-bound → 2nd messenger. Intracellular → gene expression. Tropic hormones (TSH, ACTH, LH, FSH) drive the hypothalamus → pituitary → target gland axis.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Hormone" value={hormone} />
            <Cell label="Class" value={HORMONE_META[hormone].class} />
            <Cell label="Axis" value={AXIS_META[axis].label} />
            <Cell label="Disorder" value={disorder} />
            <Cell label="Response" value={hormoneResponse(hormone)} />
          </div>
        </div>
      </div>
    </aside>
  );

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
          <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50">
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button onClick={handleReset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      {graphPanel}
      {valuesPanel}
    </div>
  );

  const controlsComponent = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={18} className="text-fuchsia-600" />
        <h3 className="text-sm font-bold text-slate-800">Hormone Action & Axis Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Axis</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(Object.keys(AXIS_META) as Axis[]).map(a => (
              <button key={a} onClick={() => setAxis(a)} className={`px-2.5 py-1.5 text-xs font-bold rounded-md ${axis === a ? 'bg-white text-fuchsia-700 shadow' : 'text-slate-600'}`}>
                {AXIS_META[a].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Disorder gallery</label>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(['none', 'diabetes', 'goitre', 'cretinism', 'dwarfism', 'gigantism', 'acromegaly'] as Disorder[]).map(d => (
              <button key={d} onClick={() => setDisorder(d)} className={`px-2.5 py-1 text-[11px] font-bold rounded-md border ${disorder === d ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-slate-200'}`}>{d}</button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Auto-loop axis animation</label>
          <div className="mt-1.5">
            <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <input type="checkbox" checked={autoLoop} onChange={e => setAutoLoop(e.target.checked)} /> Auto play axis cascade
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsComponent} />;
};

const Cell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-fuchsia-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-extrabold text-fuchsia-700">{value}</div>
  </div>
);

export default HormoneActionAxisLab;
