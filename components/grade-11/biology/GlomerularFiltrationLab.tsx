import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Droplets, Filter, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface GlomerularFiltrationLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Particle = {
  id: number;
  kind: 'plasma' | 'protein' | 'glucose' | 'aa' | 'na' | 'urea';
  x: number; y: number;
  state: 'glom' | 'filtered' | 'pct' | 'reabsorbed' | 'urine' | 'escaped';
  age: number;
};

const KIND_META: Record<Particle['kind'], { label: string; color: string; size: number; filterable: boolean; activeReabs: boolean }> = {
  plasma:  { label: 'H₂O',    color: '#bae6fd', size: 3, filterable: true,  activeReabs: false },
  protein: { label: 'Protein', color: '#fbbf24', size: 8, filterable: false, activeReabs: false },
  glucose: { label: 'Glu',    color: '#16a34a', size: 4, filterable: true,  activeReabs: true  },
  aa:      { label: 'AA',     color: '#7c3aed', size: 4, filterable: true,  activeReabs: true  },
  na:      { label: 'Na⁺',    color: '#0ea5e9', size: 3, filterable: true,  activeReabs: true  },
  urea:    { label: 'Urea',   color: '#94a3b8', size: 3, filterable: true,  activeReabs: false },
};

const GlomerularFiltrationLab: React.FC<GlomerularFiltrationLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const idCounterRef = useRef(0);
  const spawnAccumRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [bloodPressure, setBloodPressure] = useState(80); // mmHg → GFR
  const [jgaEnabled, setJgaEnabled] = useState(true);
  const [plasmaGlucose, setPlasmaGlucose] = useState(100); // % (normal 100, diabetic 250+)
  const [secretionView, setSecretionView] = useState(true);
  const [stats, setStats] = useState({ filtered: 0, reabsorbed: 0, urineGlucose: 0 });

  const handleReset = useCallback(() => {
    particlesRef.current = [];
    setStats({ filtered: 0, reabsorbed: 0, urineGlucose: 0 });
  }, []);

  // GFR is BP-driven; JGA pulls it back toward 125
  const effectiveGfr = jgaEnabled
    ? 125 - Math.abs(bloodPressure - 80) * 0.2
    : 125 * (bloodPressure / 80);

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
  }, [paused, bloodPressure, jgaEnabled, plasmaGlucose, secretionView]);

  const step = (dt: number) => {
    spawnAccumRef.current += dt * (effectiveGfr / 60);
    while (spawnAccumRef.current >= 0.06) {
      spawnAccumRef.current -= 0.06;
      // spawn at afferent arteriole
      const r = Math.random();
      let kind: Particle['kind'];
      if (r < 0.15) kind = 'protein';
      else if (r < 0.55) kind = 'plasma';
      else if (r < 0.65) kind = 'glucose';
      else if (r < 0.72) kind = 'aa';
      else if (r < 0.88) kind = 'na';
      else kind = 'urea';
      particlesRef.current.push({
        id: ++idCounterRef.current,
        kind,
        x: 150 + Math.random() * 30,
        y: 200 + Math.random() * 60,
        state: 'glom',
        age: 0,
      });
    }

    const remaining: Particle[] = [];
    for (const p of particlesRef.current) {
      p.age += dt;
      if (p.state === 'glom') {
        // drift through glomerulus
        p.x += 50 * dt;
        if (p.x > 420) {
          if (KIND_META[p.kind].filterable) {
            p.state = 'filtered';
            p.y = 340 + (Math.random() - 0.5) * 30;
          } else {
            // escapes into efferent
            p.state = 'escaped';
            p.x = 500;
            p.y = 200;
          }
        }
      } else if (p.state === 'filtered') {
        // move into PCT
        p.x += 80 * dt;
        p.y += 30 * dt;
        if (p.x > 500) {
          p.state = 'pct';
          setStats(s => ({ ...s, filtered: s.filtered + 1 }));
        }
      } else if (p.state === 'pct') {
        p.x += 90 * dt;
        // active reabsorption near pct centre
        if (p.x > 600 && p.x < 950) {
          const meta = KIND_META[p.kind];
          const isDiabetic = plasmaGlucose > 200 && p.kind === 'glucose';
          if (meta.activeReabs && !isDiabetic && Math.random() < 0.045) {
            p.state = 'reabsorbed';
            setStats(s => ({ ...s, reabsorbed: s.reabsorbed + 1 }));
          }
          // passive water reabsorption
          if (p.kind === 'plasma' && Math.random() < 0.025) {
            p.state = 'reabsorbed';
          }
        }
        if (p.x > 1080) {
          p.state = 'urine';
          if (p.kind === 'glucose') {
            setStats(s => ({ ...s, urineGlucose: s.urineGlucose + 1 }));
          }
        }
      } else if (p.state === 'reabsorbed') {
        // pass down through the tubule wall into the peritubular capillary
        p.y += 90 * dt;
        if (p.y > 618) continue; // returned to blood
      } else if (p.state === 'urine') {
        p.x += 100 * dt;
        if (p.x > W) continue;
      } else if (p.state === 'escaped') {
        p.y -= 50 * dt;
        p.x += 30 * dt;
        if (p.y < -20) continue;
      }
      if (p.age < 25) remaining.push(p);
    }
    particlesRef.current = remaining.slice(-400);

    // Secretion: spawn H+/K+ from peritubular capillary INTO filtrate
    if (secretionView && Math.random() < 0.4) {
      const k = Math.random() < 0.5 ? 'na' : 'urea'; // use na/urea as proxies for H+/K+ secretion visual
      particlesRef.current.push({
        id: ++idCounterRef.current,
        kind: k,
        x: 700 + Math.random() * 300,
        y: 600,
        state: 'pct',
        age: 0,
      });
    }
  };

  const roundRectG = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // banner
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 18px Inter';
    ctx.fillText('Nephron — Glomerular Filtration, Reabsorption & Secretion', 30, 40);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §16.2–16.3 — GFR ~125 mL/min, ~99% of 180 L/day reabsorbed', 30, 60);

    // ===== renal corpuscle =====
    const gx = 310, gy = 232;
    ctx.lineCap = 'round';
    // Bowman's capsule — cup with pale capsular space (drawn first, behind tuft)
    ctx.beginPath();
    ctx.arc(gx, gy, 108, -Math.PI * 0.62, Math.PI * 0.62, false);
    ctx.arc(gx, gy, 90, Math.PI * 0.62, -Math.PI * 0.62, true);
    ctx.closePath();
    ctx.fillStyle = '#eef2ff';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // capsular space fill
    ctx.beginPath();
    ctx.arc(gx, gy, 90, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    // afferent arteriole (WIDE — high pressure in) from the left
    const affGrad = ctx.createLinearGradient(50, 0, gx, 0);
    affGrad.addColorStop(0, '#f87171'); affGrad.addColorStop(1, '#dc2626');
    ctx.strokeStyle = affGrad;
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(48, 150);
    ctx.quadraticCurveTo(150, 150, gx - 46, gy - 26);
    ctx.stroke();
    // efferent arteriole (NARROW — raises glomerular pressure) leaving upper-right
    const effGrad = ctx.createLinearGradient(gx, 0, 560, 0);
    effGrad.addColorStop(0, '#dc2626'); effGrad.addColorStop(1, '#ef4444');
    ctx.strokeStyle = effGrad;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(gx + 44, gy - 30);
    ctx.quadraticCurveTo(470, 150, 545, 150);
    ctx.stroke();

    // glomerular capillary tuft — tangle of looping capillaries
    ctx.save();
    ctx.beginPath();
    ctx.arc(gx, gy, 84, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 7; i++) {
      const off = (i - 3) * 20;
      ctx.strokeStyle = i % 2 ? '#ef4444' : '#dc2626';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(gx - 70, gy + off * 0.5);
      ctx.bezierCurveTo(gx - 20, gy + off - 40, gx + 40, gy + off + 40, gx + 70, gy + off * 0.5);
      ctx.stroke();
    }
    ctx.restore();

    ctx.lineCap = 'butt';
    ctx.fillStyle = '#7f1d1d';
    ctx.font = '700 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Glomerulus (capillary tuft)', gx, gy - 116);
    ctx.fillStyle = '#334155';
    ctx.font = '600 11px Inter';
    ctx.fillText("Bowman's capsule", gx, gy + 128);
    ctx.font = '600 10px Inter';
    ctx.fillStyle = '#b91c1c';
    ctx.textAlign = 'left';
    ctx.fillText('afferent (wide)', 60, 130);
    ctx.textAlign = 'right';
    ctx.fillText('efferent (narrow) →', 560, 132);
    ctx.textAlign = 'left';

    // ===== PCT tubule (dimensional, with epithelial lining + brush border) =====
    const tubeTop = 400, tubeBot = 560;
    const tubePath = () => {
      ctx.beginPath();
      ctx.moveTo(420, 340);
      ctx.lineTo(420, tubeTop);
      ctx.quadraticCurveTo(560, tubeTop + 60, 720, tubeTop + 30);
      ctx.quadraticCurveTo(890, tubeTop, 1010, tubeTop + 70);
      ctx.lineTo(1100, tubeBot - 50);
      ctx.lineTo(1100, tubeBot);
      ctx.lineTo(420, tubeBot);
      ctx.closePath();
    };
    tubePath();
    const lumen = ctx.createLinearGradient(0, tubeTop - 20, 0, tubeBot);
    lumen.addColorStop(0, '#fffbeb');
    lumen.addColorStop(1, '#fde9b8');
    ctx.fillStyle = lumen;
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.stroke();
    // epithelial cell divisions along the lower wall
    ctx.strokeStyle = 'rgba(180,83,9,0.35)';
    ctx.lineWidth = 1;
    for (let x = 440; x < 1090; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, tubeBot);
      ctx.lineTo(x, tubeBot - 26);
      ctx.stroke();
    }
    // brush border (microvilli) along the luminal side
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1.5;
    for (let x = 436; x < 1092; x += 8) {
      const yb = tubeBot - 26;
      ctx.beginPath();
      ctx.moveTo(x, yb);
      ctx.lineTo(x + 2, yb - 9);
      ctx.stroke();
    }
    ctx.fillStyle = '#92400e';
    ctx.font = '700 13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('PCT — brush-border epithelium (bulk reabsorption)', 720, tubeTop + 8);
    ctx.textAlign = 'left';

    // ===== peritubular capillary (shaded vessel with RBCs) =====
    const pcap = ctx.createLinearGradient(0, 600, 0, 650);
    pcap.addColorStop(0, '#f87171'); pcap.addColorStop(1, '#b91c1c');
    ctx.fillStyle = pcap;
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2;
    roundRectG(ctx, 420, 600, 700, 50, 16);
    ctx.fill(); ctx.stroke();
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = 'rgba(127,29,29,0.55)';
      ctx.beginPath();
      ctx.ellipse(455 + i * 74, 625, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = '600 11px Inter';
    ctx.fillText('Peritubular capillary (reabsorbed solutes return to blood)', 440, 642);

    // urine outlet
    ctx.fillStyle = '#fde9b8';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    roundRectG(ctx, 1100, tubeBot - 50, 140, 50, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#92400e';
    ctx.font = '700 12px Inter';
    ctx.fillText('→ to loop / urine', 1112, tubeBot - 20);

    // ===== particle legend (top-right) =====
    const lx = 980, ly = 150;
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    roundRectG(ctx, lx, ly, 250, 132, 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 11px Inter';
    ctx.fillText('What flows through', lx + 12, ly + 18);
    (Object.keys(KIND_META) as Particle['kind'][]).forEach((k, i) => {
      const cy = ly + 34 + i * 16;
      ctx.fillStyle = KIND_META[k].color;
      ctx.beginPath();
      ctx.arc(lx + 18, cy, KIND_META[k].size + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.font = '600 10px Inter';
      const note = k === 'protein' ? 'too big — not filtered'
        : k === 'urea' ? 'filtered, stays → urine'
        : k === 'plasma' ? 'water — mostly reabsorbed'
        : 'filtered, actively reabsorbed';
      ctx.fillText(`${KIND_META[k].label} — ${note}`, lx + 32, cy + 3.5);
    });

    // particles
    for (const p of particlesRef.current) {
      const meta = KIND_META[p.kind];
      ctx.beginPath();
      ctx.arc(p.x, p.y, meta.size, 0, Math.PI * 2);
      ctx.fillStyle = meta.color;
      ctx.shadowColor = meta.color;
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // JGA indicator
    if (jgaEnabled) {
      ctx.fillStyle = '#0c4a6e';
      ctx.font = '700 11px Inter';
      ctx.fillText('JGA autoregulation ON', 50, 100);
    }

    // glucose spill warning
    if (plasmaGlucose > 200) {
      ctx.fillStyle = '#dc2626';
      ctx.font = '700 13px Inter';
      ctx.fillText('⚠ Hyperglycaemia — PCT transport saturated; glucose spills into urine (glucosuria)', 400, 100);
    }
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">GFR / Reabsorption</div>
          <div className="text-xs font-semibold text-slate-500">NCERT: 125 mL/min · 180 L/day</div>
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex justify-between"><span>Daily filtrate</span><span className="font-mono">180 L</span></div>
            <div className="flex justify-between"><span>Daily urine</span><span className="font-mono">1.5 L</span></div>
            <div className="flex justify-between font-bold"><span>% reabsorbed</span><span className="font-mono text-emerald-600">~99%</span></div>
          </div>
          <div className="mt-3 h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: '99%' }} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Filtration Membrane</div>
          <div className="text-xs font-semibold text-slate-500">3 layers (NCERT §16.2)</div>
          <ol className="mt-2 text-xs space-y-0.5 list-decimal pl-5">
            <li>Endothelium of glomerular blood vessels</li>
            <li>Basement membrane</li>
            <li>Bowman's capsule epithelium (<b>podocytes</b>) with <b>slit pores</b></li>
          </ol>
          <p className="text-[11px] mt-2 italic text-slate-500">All plasma components pass except proteins → "ultrafiltration"</p>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-amber-900">Three Processes</div>
          <div className="text-xs font-semibold text-amber-700 mt-0.5">NCERT §16.2</div>
          <ol className="mt-2 text-sm leading-snug text-amber-950 list-decimal pl-5 space-y-0.5">
            <li><b>Filtration</b> — non-selective, BP-driven, in glomerulus</li>
            <li><b>Reabsorption</b> — PCT does most (active for glu/aa/Na⁺)</li>
            <li><b>Secretion</b> — H⁺/K⁺/NH₃ pumped INTO filtrate</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Effective GFR" value={`${effectiveGfr.toFixed(0)} mL/min`} />
            <Cell label="Particles filtered" value={stats.filtered} />
            <Cell label="Particles reabsorbed" value={stats.reabsorbed} />
            <Cell label="Glucose in urine" value={stats.urineGlucose} />
            <Cell label="Plasma glucose" value={`${plasmaGlucose}%`} />
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
        <Filter size={18} className="text-amber-600" />
        <h3 className="text-sm font-bold text-slate-800">Glomerular Filtration Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Blood pressure</span><span className="font-mono">{bloodPressure} mmHg</span>
          </label>
          <input type="range" min={40} max={130} step={5} value={bloodPressure} onChange={e => setBloodPressure(parseInt(e.target.value))} className="w-full mt-1 accent-rose-600" />
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Plasma glucose</span><span className="font-mono">{plasmaGlucose}%</span>
          </label>
          <input type="range" min={50} max={300} step={10} value={plasmaGlucose} onChange={e => setPlasmaGlucose(parseInt(e.target.value))} className="w-full mt-1 accent-emerald-600" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <input type="checkbox" checked={jgaEnabled} onChange={e => setJgaEnabled(e.target.checked)} /> JGA autoregulation
          </label>
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <input type="checkbox" checked={secretionView} onChange={e => setSecretionView(e.target.checked)} /> Show tubular secretion
          </label>
        </div>
      </div>
    </div>
  );

  return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsComponent} />;
};

const Cell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-extrabold text-amber-700">{value}</div>
  </div>
);

export default GlomerularFiltrationLab;
