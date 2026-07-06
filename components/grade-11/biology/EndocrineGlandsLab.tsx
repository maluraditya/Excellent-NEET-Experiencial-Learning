import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface EndocrineGlandsLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Gland = 'hypothalamus' | 'pituitary' | 'pineal' | 'thyroid' | 'parathyroid' | 'thymus' | 'adrenal' | 'pancreas' | 'testis' | 'ovary' | 'heart' | 'kidney';
type Scenario = 'rest' | 'stress' | 'fed' | 'fasting' | 'cold' | 'puberty';

const GLAND_META: Record<Gland, { label: string; hormones: string[]; targets: string[]; color: string }> = {
  hypothalamus: { label: 'Hypothalamus', hormones: ['GnRH', 'TRH', 'CRH', 'GHRH', 'Somatostatin'], targets: ['Pituitary'], color: '#7c3aed' },
  pituitary:    { label: 'Pituitary',    hormones: ['GH', 'PRL', 'TSH', 'ACTH', 'LH', 'FSH', 'MSH', 'Oxytocin', 'ADH'], targets: ['Thyroid', 'Adrenal', 'Gonads'], color: '#0891b2' },
  pineal:       { label: 'Pineal',       hormones: ['Melatonin'], targets: ['Sleep/wake cycle'], color: '#1e40af' },
  thyroid:      { label: 'Thyroid',      hormones: ['T3', 'T4', 'Thyrocalcitonin'], targets: ['All tissues — BMR'], color: '#dc2626' },
  parathyroid:  { label: 'Parathyroid',  hormones: ['PTH'], targets: ['Bones, kidney — ↑ blood Ca²⁺'], color: '#b91c1c' },
  thymus:       { label: 'Thymus',       hormones: ['Thymosins'], targets: ['T-lymphocytes'], color: '#a16207' },
  adrenal:      { label: 'Adrenal',      hormones: ['Epinephrine', 'Norepinephrine', 'Cortisol', 'Aldosterone'], targets: ['Heart, blood vessels, metabolism'], color: '#ea580c' },
  pancreas:     { label: 'Pancreas',     hormones: ['Insulin', 'Glucagon'], targets: ['Liver, muscle — glucose'], color: '#16a34a' },
  testis:       { label: 'Testis',       hormones: ['Androgens (Testosterone)'], targets: ['Male accessory organs'], color: '#0c4a6e' },
  ovary:        { label: 'Ovary',        hormones: ['Estrogen', 'Progesterone'], targets: ['Female accessory organs'], color: '#be185d' },
  heart:        { label: 'Heart (atrial)', hormones: ['ANF'], targets: ['↓ Blood pressure'], color: '#7f1d1d' },
  kidney:       { label: 'Kidney (JG)',  hormones: ['Erythropoietin'], targets: ['Bone marrow — RBCs'], color: '#92400e' },
};

const GLAND_POS: Record<Gland, { x: number; y: number }> = {
  hypothalamus: { x: 540, y: 140 },
  pituitary:    { x: 540, y: 180 },
  pineal:       { x: 595, y: 130 },
  thyroid:      { x: 540, y: 240 },
  parathyroid:  { x: 580, y: 250 },
  thymus:       { x: 540, y: 320 },
  adrenal:      { x: 480, y: 410 },
  pancreas:     { x: 580, y: 430 },
  testis:       { x: 510, y: 600 },
  ovary:        { x: 580, y: 540 },
  heart:        { x: 470, y: 340 },
  kidney:       { x: 600, y: 410 },
};

type Pulse = { id: number; from: { x: number; y: number }; to: { x: number; y: number }; progress: number; color: string; label: string };

const EndocrineGlandsLab: React.FC<EndocrineGlandsLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const pulsesRef = useRef<Pulse[]>([]);
  const idRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [focusGland, setFocusGland] = useState<Gland>('pituitary');
  const [scenario, setScenario] = useState<Scenario>('rest');
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [autoFire, setAutoFire] = useState(true);
  const scenarioTimerRef = useRef(0);

  const handleReset = useCallback(() => {
    pulsesRef.current = [];
    scenarioTimerRef.current = 0;
  }, []);

  const fireHormone = (from: Gland, to: { x: number; y: number }, color: string, label: string) => {
    pulsesRef.current.push({
      id: ++idRef.current,
      from: GLAND_POS[from],
      to,
      progress: 0,
      color,
      label,
    });
  };

  const runScenario = () => {
    if (scenario === 'stress') {
      fireHormone('hypothalamus', GLAND_POS.pituitary, '#7c3aed', 'CRH');
      setTimeout(() => fireHormone('pituitary', GLAND_POS.adrenal, '#0891b2', 'ACTH'), 800);
      setTimeout(() => fireHormone('adrenal', { x: 900, y: 400 }, '#ea580c', 'Cortisol'), 1600);
      setTimeout(() => fireHormone('adrenal', { x: 900, y: 340 }, '#dc2626', 'Adrenaline'), 1800);
    } else if (scenario === 'fed') {
      fireHormone('pancreas', { x: 900, y: 430 }, '#16a34a', 'Insulin');
    } else if (scenario === 'fasting') {
      fireHormone('pancreas', { x: 900, y: 430 }, '#f59e0b', 'Glucagon');
    } else if (scenario === 'cold') {
      fireHormone('hypothalamus', GLAND_POS.pituitary, '#7c3aed', 'TRH');
      setTimeout(() => fireHormone('pituitary', GLAND_POS.thyroid, '#0891b2', 'TSH'), 800);
      setTimeout(() => fireHormone('thyroid', { x: 900, y: 250 }, '#dc2626', 'T4 (heat ↑)'), 1600);
    } else if (scenario === 'puberty') {
      fireHormone('hypothalamus', GLAND_POS.pituitary, '#7c3aed', 'GnRH');
      setTimeout(() => fireHormone('pituitary', sex === 'M' ? GLAND_POS.testis : GLAND_POS.ovary, '#0891b2', sex === 'M' ? 'LH/FSH' : 'LH/FSH'), 800);
      setTimeout(() => fireHormone(sex === 'M' ? 'testis' : 'ovary', { x: 900, y: sex === 'M' ? 600 : 540 }, sex === 'M' ? '#0c4a6e' : '#be185d', sex === 'M' ? 'Testosterone' : 'Estrogen/Progesterone'), 1600);
    } else {
      // rest — random gland samples
      const glands: Gland[] = ['pituitary', 'thyroid', 'pancreas'];
      const g = glands[Math.floor(Math.random() * glands.length)];
      fireHormone(g, { x: 900, y: GLAND_POS[g].y }, GLAND_META[g].color, GLAND_META[g].hormones[0]);
    }
  };

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
  }, [paused, focusGland, scenario, sex, autoFire]);

  const step = (dt: number) => {
    scenarioTimerRef.current += dt;
    if (autoFire && scenarioTimerRef.current > 4) {
      runScenario();
      scenarioTimerRef.current = 0;
    }
    pulsesRef.current = pulsesRef.current
      .map(p => ({ ...p, progress: p.progress + dt * 0.6 }))
      .filter(p => p.progress < 1.2);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (const g of Object.keys(GLAND_POS) as Gland[]) {
      const p = GLAND_POS[g];
      if (Math.hypot(p.x - x, p.y - y) < 18) {
        setFocusGland(g);
        // fire hormones to a target zone
        const meta = GLAND_META[g];
        fireHormone(g, { x: 900, y: p.y }, meta.color, meta.hormones[0]);
        break;
      }
    }
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
    ctx.fillText('Human Endocrine System — click any gland to release its hormones', 30, 40);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT Ch 19 §19.1-19.3 — Ductless glands → hormones → distant target organs', 30, 60);

    drawSilhouette(ctx);

    // glands
    for (const g of Object.keys(GLAND_POS) as Gland[]) {
      drawGland(ctx, g);
    }

    // pulses
    for (const p of pulsesRef.current) {
      const x = p.from.x + (p.to.x - p.from.x) * p.progress;
      const y = p.from.y + (p.to.y - p.from.y) * p.progress;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = p.color;
      ctx.font = '700 11px Inter';
      ctx.fillText(p.label, x + 12, y + 4);
      // trail
      ctx.strokeStyle = p.color + '66';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.from.x, p.from.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // focused gland info card
    drawGlandInfoCard(ctx);
  };

  const drawSilhouette = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    // head
    ctx.beginPath();
    ctx.arc(540, 130, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // torso
    ctx.beginPath();
    ctx.moveTo(490, 180);
    ctx.lineTo(590, 180);
    ctx.lineTo(610, 480);
    ctx.lineTo(470, 480);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // legs
    ctx.beginPath();
    ctx.moveTo(490, 480);
    ctx.lineTo(500, 680);
    ctx.lineTo(540, 680);
    ctx.lineTo(545, 480);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(545, 480);
    ctx.lineTo(550, 680);
    ctx.lineTo(590, 680);
    ctx.lineTo(595, 480);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const drawGland = (ctx: CanvasRenderingContext2D, g: Gland) => {
    if ((g === 'testis' && sex === 'F') || (g === 'ovary' && sex === 'M')) return;
    const p = GLAND_POS[g];
    const meta = GLAND_META[g];
    const focused = focusGland === g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, focused ? 14 : 10, 0, Math.PI * 2);
    ctx.fillStyle = meta.color;
    ctx.shadowColor = meta.color;
    ctx.shadowBlur = focused ? 18 : 6;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // label
    ctx.fillStyle = '#1e293b';
    ctx.font = focused ? '700 11px Inter' : '600 10px Inter';
    ctx.fillText(meta.label, p.x + 18, p.y + 4);
  };

  const drawGlandInfoCard = (ctx: CanvasRenderingContext2D) => {
    const meta = GLAND_META[focusGland];
    const x = 30, y = 90;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, 290, 180);
    ctx.strokeRect(x, y, 290, 180);
    ctx.fillStyle = meta.color;
    ctx.font = '800 16px Inter';
    ctx.fillText(meta.label, x + 12, y + 24);
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 11px Inter';
    ctx.fillText('Hormones:', x + 12, y + 50);
    ctx.font = '500 11px Inter';
    let yy = y + 66;
    for (const h of meta.hormones) {
      ctx.fillText(`• ${h}`, x + 18, yy);
      yy += 14;
    }
    yy += 4;
    ctx.font = '700 11px Inter';
    ctx.fillText('Targets:', x + 12, yy);
    yy += 14;
    ctx.font = '500 10px Inter';
    for (const t of meta.targets) {
      ctx.fillText(`→ ${t}`, x + 18, yy);
      yy += 12;
    }
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Gland Library</div>
          <div className="text-xs font-semibold text-slate-500">Click to focus</div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {(Object.keys(GLAND_META) as Gland[]).map(g => (
              <button key={g} onClick={() => setFocusGland(g)} className={`px-2 py-1 text-[11px] font-bold rounded border ${focusGland === g ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                {GLAND_META[g].label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-cyan-900">Endocrine System</div>
          <div className="text-xs font-semibold text-cyan-700 mt-0.5">NCERT Ch 19</div>
          <p className="text-sm text-cyan-950 mt-2 leading-snug">
            Ductless glands secrete hormones — "non-nutrient chemicals which act as intercellular messengers and are produced in trace amounts" (NCERT §19.1).
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Focused gland</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Gland" value={GLAND_META[focusGland].label} />
            <Cell label="Hormones" value={GLAND_META[focusGland].hormones.slice(0, 3).join(', ')} />
            <Cell label="Scenario" value={scenario} />
            <Cell label="Active pulses" value={pulsesRef.current.length} />
          </div>
        </div>
      </div>
    </aside>
  );

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" onClick={handleCanvasClick} />
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
        <Activity size={18} className="text-cyan-600" />
        <h3 className="text-sm font-bold text-slate-800">Endocrine System Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Scenario</label>
          <div className="mt-1.5 inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
            {(['rest', 'stress', 'fed', 'fasting', 'cold', 'puberty'] as Scenario[]).map(s => (
              <button key={s} onClick={() => setScenario(s)} className={`px-2.5 py-1 text-xs font-bold rounded-md ${scenario === s ? 'bg-white text-cyan-700 shadow' : 'text-slate-600'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Sex (for gonads)</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['M', 'F'] as const).map(s => (
              <button key={s} onClick={() => setSex(s)} className={`px-3 py-1.5 text-xs font-bold rounded-md ${sex === s ? 'bg-white text-cyan-700 shadow' : 'text-slate-600'}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={runScenario} className="px-3 py-2 text-xs font-bold rounded-md bg-cyan-600 text-white">▶ Run scenario</button>
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <input type="checkbox" checked={autoFire} onChange={e => setAutoFire(e.target.checked)} /> Auto-replay
          </label>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-2 italic">Tip: click any gland icon on the silhouette to release its hormones to target tissues.</p>
    </div>
  );

  return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsComponent} />;
};

const Cell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-cyan-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-extrabold text-cyan-700">{value}</div>
  </div>
);

export default EndocrineGlandsLab;
