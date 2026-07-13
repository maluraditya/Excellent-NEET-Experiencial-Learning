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
  const hormoneLevelRef = useRef(25); // blood level of the final hormone (0-100)

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
    cascadeStepRef.current = (tRef.current * 0.5) % 1;

    // negative-feedback dynamics: the axis fires only while the blood level is
    // below the set point; the hormone is then cleared, so the level oscillates.
    const setpoint = 60;
    const targetFails = disorder === 'goitre' || disorder === 'cretinism';   // gland can't make enough
    const overproduce = disorder === 'gigantism' || disorder === 'acromegaly'; // feedback ignored
    let level = hormoneLevelRef.current;
    const axisOn = overproduce ? true : level < setpoint;
    const production = (axisOn ? (targetFails ? 12 : 42) : 0);
    level += (production - level * 0.5) * dt;
    hormoneLevelRef.current = Math.max(0, Math.min(100, level));
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 22px Inter';
    ctx.fillText('Hormone Feedback Regulation — how the body keeps hormones balanced', 30, 38);
    ctx.font = '600 13px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §19.2 — the hypothalamus → pituitary → target-gland axis is switched off by its own product (negative feedback).', 30, 60);

    drawFeedbackLoop(ctx);
    drawHormoneGauge(ctx);
  };

  const roundBox = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  const drawFeedbackLoop = (ctx: CanvasRenderingContext2D) => {
    const info = AXIS_META[axis];
    const level = hormoneLevelRef.current;
    const setpoint = 60;
    const overproduce = disorder === 'gigantism' || disorder === 'acromegaly';
    const axisOn = overproduce ? true : level < setpoint;
    const feedbackOn = !axisOn;
    const finalHormone = info.chain[2].hormone;

    const axisX = 440, boxW = 250, boxH = 62, bx = axisX - boxW / 2;
    const nodes = [
      { label: 'Hypothalamus', sub: `releases ${info.chain[0].hormone}`, y: 132, color: '#7c3aed' },
      { label: 'Pituitary', sub: `releases ${info.chain[1].hormone} (tropic)`, y: 288, color: '#0891b2' },
      { label: info.chain[1].to, sub: `releases ${finalHormone}`, y: 444, color: '#dc2626' },
      { label: 'Body tissues / blood', sub: hormoneResponse(hormone), y: 600, color: '#334155' },
    ];

    // forward stimulation arrows (⊕, down the chain)
    for (let i = 0; i < 3; i++) {
      const y0 = nodes[i].y + boxH, y1 = nodes[i + 1].y;
      ctx.strokeStyle = axisOn ? '#16a34a' : '#cbd5e1';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = axisOn ? 5 : 2.5;
      ctx.beginPath(); ctx.moveTo(axisX, y0); ctx.lineTo(axisX, y1 - 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(axisX, y1); ctx.lineTo(axisX - 8, y1 - 12); ctx.lineTo(axisX + 8, y1 - 12); ctx.closePath(); ctx.fill();
      // ⊕ and hormone name
      ctx.fillStyle = axisOn ? '#15803d' : '#94a3b8';
      ctx.font = '800 14px Inter'; ctx.textAlign = 'center';
      ctx.fillText('⊕ ' + info.chain[i].hormone, axisX - 96, (y0 + y1) / 2 + 4);
      ctx.textAlign = 'left';
    }

    // feedback inhibition arrows (⊖) from the final hormone back up
    const fx = axisX + boxW / 2 + 70;
    [1, 0].forEach(ti => {
      const yTarget = nodes[ti].y + boxH / 2;
      ctx.strokeStyle = feedbackOn ? '#dc2626' : '#e2e8f0';
      ctx.lineWidth = feedbackOn ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(axisX + boxW / 2 - 6, nodes[2].y + boxH / 2);
      ctx.bezierCurveTo(fx + 60, nodes[2].y, fx + 60, yTarget, axisX + boxW / 2 + 2, yTarget);
      ctx.stroke();
      // ⊖ blunt head
      ctx.strokeStyle = feedbackOn ? '#dc2626' : '#e2e8f0'; ctx.lineWidth = feedbackOn ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(axisX + boxW / 2 + 2, yTarget - 8); ctx.lineTo(axisX + boxW / 2 + 2, yTarget + 8); ctx.stroke();
    });
    ctx.fillStyle = feedbackOn ? '#b91c1c' : '#cbd5e1';
    ctx.font = '800 14px Inter'; ctx.textAlign = 'center';
    ctx.save(); ctx.translate(fx + 74, 360); ctx.rotate(Math.PI / 2);
    ctx.fillText(`⊖ ${finalHormone} inhibits the axis (negative feedback)`, 0, 0);
    ctx.restore();
    ctx.textAlign = 'left';

    // nodes
    nodes.forEach(n => {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = n.color; ctx.lineWidth = 3;
      roundBox(ctx, bx, n.y, boxW, boxH, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = n.color; ctx.beginPath(); ctx.arc(bx + 22, n.y + boxH / 2, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.font = '800 16px Inter'; ctx.textAlign = 'left';
      ctx.fillText(n.label, bx + 40, n.y + 26);
      ctx.fillStyle = '#64748b'; ctx.font = '600 11px Inter';
      ctx.fillText(n.sub, bx + 40, n.y + 46);
    });

    // status banner
    ctx.textAlign = 'center';
    if (overproduce) { ctx.fillStyle = '#b91c1c'; ctx.font = '800 16px Inter';
      ctx.fillText(`⚠ ${disorder.toUpperCase()} — pituitary over-secretes, feedback fails`, axisX, 700); }
    else if (axisOn) { ctx.fillStyle = '#15803d'; ctx.font = '800 16px Inter';
      ctx.fillText(`Level LOW → axis switched ON → ${finalHormone} rising`, axisX, 700); }
    else { ctx.fillStyle = '#b91c1c'; ctx.font = '800 16px Inter';
      ctx.fillText(`Level HIGH → ${finalHormone} feeds back → axis switched OFF`, axisX, 700); }
    ctx.textAlign = 'left';

    // legend
    ctx.font = '700 12px Inter'; ctx.textAlign = 'left';
    ctx.fillStyle = '#15803d'; ctx.fillText('⊕ stimulates', 60, 130);
    ctx.fillStyle = '#b91c1c'; ctx.fillText('⊖ inhibits', 60, 150);
  };

  const drawHormoneGauge = (ctx: CanvasRenderingContext2D) => {
    const info = AXIS_META[axis];
    const x = 900, y = 150, w = 70, h = 470;
    const level = hormoneLevelRef.current;
    const setpoint = 60;
    ctx.fillStyle = '#0f172a'; ctx.font = '800 15px Inter'; ctx.textAlign = 'center';
    ctx.fillText(`Blood ${info.chain[2].hormone}`, x + w / 2, y - 26);
    ctx.font = '600 12px Inter'; ctx.fillStyle = '#64748b';
    ctx.fillText('level', x + w / 2, y - 10);
    // tube
    ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    roundBox(ctx, x, y, w, h, 12); ctx.fill(); ctx.stroke();
    // fill
    const fillH = h * level / 100;
    const fg = ctx.createLinearGradient(0, y + h - fillH, 0, y + h);
    const high = level >= setpoint;
    fg.addColorStop(0, high ? '#f87171' : '#4ade80');
    fg.addColorStop(1, high ? '#b91c1c' : '#15803d');
    ctx.fillStyle = fg;
    roundBox(ctx, x + 3, y + h - fillH + 1, w - 6, fillH - 2, 10); ctx.fill();
    // set-point line
    const spY = y + h - h * setpoint / 100;
    ctx.strokeStyle = '#0f172a'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 10, spY); ctx.lineTo(x + w + 60, spY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#0f172a'; ctx.font = '700 12px Inter'; ctx.textAlign = 'left';
    ctx.fillText('set point', x + w + 8, spY - 6);
    // value
    ctx.fillStyle = high ? '#b91c1c' : '#15803d'; ctx.font = '800 20px Inter'; ctx.textAlign = 'center';
    ctx.fillText(`${level.toFixed(0)}%`, x + w / 2, y + h + 30);
    ctx.textAlign = 'left';
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
