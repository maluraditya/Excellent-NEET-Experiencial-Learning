import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Droplets, Pause, Play, RotateCcw, Waves } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface CountercurrentMultiplierLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Scenario = 'normal' | 'dehydrated' | 'overhydrated' | 'marathon';
type LoopLen = 'short' | 'long' | 'desert';

const SCENARIO_META: Record<Scenario, { label: string; adh: number }> = {
  normal:       { label: 'Normal',       adh: 50  },
  dehydrated:   { label: 'Dehydrated',   adh: 95  },
  overhydrated: { label: 'Overhydrated', adh: 5   },
  marathon:     { label: 'Marathon',     adh: 85  },
};

const LOOP_LEN: Record<LoopLen, { label: string; maxOsm: number }> = {
  short:  { label: 'Cortical (short)',     maxOsm: 600  },
  long:   { label: 'Juxta-medullary',      maxOsm: 1200 },
  desert: { label: 'Desert mammal (extra)', maxOsm: 2400 },
};

interface FiltrateDrop { y: number; conc: number; phase: 'desc' | 'asc' | 'duct' }

const CountercurrentMultiplierLab: React.FC<CountercurrentMultiplierLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const dropsRef = useRef<FiltrateDrop[]>([]);
  const spawnAccumRef = useRef(0);
  const beakerVolRef = useRef(0);
  const beakerConcAccumRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [adhOverride, setAdhOverride] = useState<number | null>(null);
  const [loopLen, setLoopLen] = useState<LoopLen>('long');
  const [countercurrentOn, setCountercurrentOn] = useState(true);
  const [urineVolume, setUrineVolume] = useState(0);
  const [urineConc, setUrineConc] = useState(300);

  const adh = adhOverride !== null ? adhOverride : SCENARIO_META[scenario].adh;
  const maxOsm = countercurrentOn ? LOOP_LEN[loopLen].maxOsm : 300;

  const handleReset = useCallback(() => {
    dropsRef.current = [];
    beakerVolRef.current = 0;
    beakerConcAccumRef.current = 0;
    setUrineVolume(0);
    setUrineConc(300);
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
  }, [paused, scenario, adhOverride, loopLen, countercurrentOn]);

  const loopTop = 200;
  const loopBottom = 580;
  const descX = 480;
  const ascX = 560;
  const ductX = 740;

  const step = (dt: number) => {
    spawnAccumRef.current += dt;
    while (spawnAccumRef.current >= 0.4) {
      spawnAccumRef.current -= 0.4;
      dropsRef.current.push({ y: loopTop, conc: 300, phase: 'desc' });
    }
    for (const d of dropsRef.current) {
      const depthFrac = (d.y - loopTop) / (loopBottom - loopTop);
      const interstitiumOsm = 300 + (maxOsm - 300) * Math.max(0, Math.min(1, depthFrac));
      if (d.phase === 'desc') {
        d.y += 60 * dt;
        // water leaves → concentration rises toward interstitium osm
        d.conc += (interstitiumOsm - d.conc) * dt * 0.8;
        if (d.y >= loopBottom) d.phase = 'asc';
      } else if (d.phase === 'asc') {
        d.y -= 60 * dt;
        // salt actively pumped out — filtrate dilutes
        const target = 100;
        d.conc += (target - d.conc) * dt * 0.6;
        if (d.y <= loopTop + 20) d.phase = 'duct';
      } else if (d.phase === 'duct') {
        d.y += 80 * dt;
        // collecting duct — water reabsorption scales with ADH × interstitiumOsm
        const reabsorbFactor = (adh / 100) * (maxOsm / 1200);
        d.conc += (interstitiumOsm - d.conc) * dt * reabsorbFactor * 1.2;
        if (d.y > loopBottom + 100) {
          // exit to beaker
          beakerVolRef.current += 1;
          beakerConcAccumRef.current += d.conc;
          continue;
        }
      }
    }
    dropsRef.current = dropsRef.current.filter(d => d.y < loopBottom + 100);

    setUrineVolume(beakerVolRef.current);
    if (beakerVolRef.current > 0) setUrineConc(beakerConcAccumRef.current / beakerVolRef.current);
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
    ctx.fillText('Countercurrent Multiplier — Loop of Henle & Collecting Duct', 30, 40);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §16.4 — medullary gradient 300 → 1200 mOsmolL⁻¹ via NaCl + urea', 30, 60);

    // medulla gradient strip on left
    drawMedullaStrip(ctx, 150, 100, 60, 600);

    // Loop of Henle
    drawLoop(ctx);

    // Collecting duct
    drawDuct(ctx);

    // Vasa recta
    drawVasaRecta(ctx);

    // beaker
    drawBeaker(ctx);

    // drops
    for (const d of dropsRef.current) {
      const x = d.phase === 'desc' ? descX : d.phase === 'asc' ? ascX : ductX;
      ctx.beginPath();
      ctx.arc(x, d.y, 6, 0, Math.PI * 2);
      const sat = Math.min(1, (d.conc - 300) / 900);
      ctx.fillStyle = `rgba(${30 + sat * 100}, ${130 - sat * 50}, ${200 - sat * 80}, 0.95)`;
      ctx.fill();
      ctx.strokeStyle = '#0c4a6e';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ADH meter
    drawAdhMeter(ctx);
  };

  const drawMedullaStrip = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, '#dbeafe');
    grad.addColorStop(0.5, '#60a5fa');
    grad.addColorStop(1, countercurrentOn ? '#1e1b4b' : '#dbeafe');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    // labels
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 11px Inter';
    ctx.fillText('Cortex', x + w + 6, y + 12);
    ctx.fillText('Outer medulla', x + w + 6, y + h / 3);
    ctx.fillText('Inner medulla', x + w + 6, y + 2 * h / 3);
    ctx.font = '700 10px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('300 mOsm/L', x - 90, y + 12);
    ctx.fillText(`${maxOsm} mOsm/L`, x - 90, y + h - 6);
  };

  const drawLoop = (ctx: CanvasRenderingContext2D) => {
    // descending limb
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(descX, loopTop);
    ctx.lineTo(descX, loopBottom);
    ctx.stroke();
    // ascending limb
    ctx.beginPath();
    ctx.moveTo(ascX, loopBottom);
    ctx.lineTo(ascX, loopTop);
    ctx.stroke();
    // curve at bottom
    ctx.beginPath();
    ctx.arc((descX + ascX) / 2, loopBottom, (ascX - descX) / 2, 0, Math.PI, false);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // direction arrows
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '700 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('↓ Descending', descX, loopTop - 10);
    ctx.fillText('↑ Ascending', ascX, loopTop - 10);
    ctx.font = '500 10px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('water out', descX - 50, 400);
    ctx.fillText('NaCl out (active)', ascX + 60, 400);
    ctx.textAlign = 'left';

    // permeability indicators
    for (let i = 0; i < 8; i++) {
      const y = loopTop + 40 + i * 60;
      // water arrows out of descending
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(descX - 15, y);
      ctx.lineTo(descX - 30, y);
      ctx.stroke();
      // NaCl arrows out of ascending
      ctx.strokeStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(ascX + 15, y);
      ctx.lineTo(ascX + 30, y);
      ctx.stroke();
    }
  };

  const drawDuct = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ductX, loopTop + 30);
    ctx.lineTo(ductX, loopBottom + 60);
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '700 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Collecting', ductX, loopTop + 10);
    ctx.fillText('Duct', ductX, loopTop + 24);
    ctx.fillStyle = '#475569';
    ctx.font = '500 10px Inter';
    ctx.fillText(`ADH ${adh}%`, ductX, loopTop + 200);
    ctx.fillText(adh > 50 ? 'permeable' : 'impermeable', ductX, loopTop + 215);
    ctx.textAlign = 'left';
  };

  const drawVasaRecta = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = countercurrentOn ? '#fca5a5' : '#fecaca';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(880, loopTop);
    ctx.lineTo(880, loopBottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(940, loopBottom);
    ctx.lineTo(940, loopTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(910, loopBottom, 30, 0, Math.PI, false);
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#7f1d1d';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Vasa', 910, loopTop - 18);
    ctx.fillText('recta', 910, loopTop - 4);
    if (!countercurrentOn) {
      ctx.fillStyle = '#dc2626';
      ctx.font = '700 12px Inter';
      ctx.fillText('⚠ counter-current OFF', 910, loopTop - 35);
    }
    ctx.textAlign = 'left';
  };

  const drawBeaker = (ctx: CanvasRenderingContext2D) => {
    const bx = 1020, by = 600;
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.fillRect(bx, by, 130, 100);
    ctx.strokeRect(bx, by, 130, 100);
    const fillH = Math.min(95, urineVolume * 0.5);
    const sat = Math.min(1, (urineConc - 300) / 900);
    ctx.fillStyle = `rgb(${250 - sat * 70}, ${220 - sat * 80}, ${30 + sat * 60})`;
    ctx.fillRect(bx + 3, by + 100 - fillH, 124, fillH);
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '700 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Urine', bx + 65, by - 8);
    ctx.font = '500 11px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText(`${urineConc.toFixed(0)} mOsm/L`, bx + 65, by + 120);
    ctx.fillText(`vol ${urineVolume}`, bx + 65, by + 138);
    ctx.textAlign = 'left';
  };

  const drawAdhMeter = (ctx: CanvasRenderingContext2D) => {
    const x = 230, y = 100;
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 12px Inter';
    ctx.fillText('ADH', x, y);
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#475569';
    ctx.fillRect(x, y + 6, 22, 100);
    ctx.strokeRect(x, y + 6, 22, 100);
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(x + 1, y + 106 - adh, 20, adh);
    ctx.fillStyle = '#475569';
    ctx.font = '600 10px Inter';
    ctx.fillText(`${adh}%`, x, y + 120);
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Medullary Gradient</div>
          <div className="text-xs font-semibold text-slate-500">NCERT §16.4</div>
          <div className="mt-2 font-mono text-base font-extrabold text-indigo-700">300 → {maxOsm} mOsm/L</div>
          <p className="text-[11px] text-slate-500 mt-1">Built by NaCl (active pump) + urea (recycling). Vasa recta counter-current preserves it.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">ADH Action</div>
          <ul className="mt-2 text-xs space-y-1">
            <li>Made in hypothalamus, released from neurohypophysis</li>
            <li>Acts on <b>DCT + collecting duct</b> → water permeable</li>
            <li>↑ ADH → concentrated urine · ↓ ADH → dilute urine</li>
            <li>Also constricts blood vessels → ↑ BP → ↑ GFR</li>
          </ul>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-indigo-900">Counter-Current Principle</div>
          <div className="text-xs font-semibold text-indigo-700 mt-0.5">NCERT §16.4</div>
          <p className="text-sm text-indigo-950 mt-2 leading-snug">
            Flow in two limbs of Henle's loop is in opposite directions. Vasa recta blood follows the same counter-current pattern. This "traps" the gradient → DCT + collecting duct can concentrate urine ~4×.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Scenario" value={SCENARIO_META[scenario].label} />
            <Cell label="ADH" value={`${adh}%`} />
            <Cell label="Max medulla osm" value={`${maxOsm} mOsm/L`} />
            <Cell label="Urine concentration" value={`${urineConc.toFixed(0)} mOsm/L`} />
            <Cell label="Urine volume (units)" value={urineVolume} />
            <Cell label="Counter-current" value={countercurrentOn ? 'ON' : 'OFF'} />
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
        <Waves size={18} className="text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-800">Countercurrent Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Hydration scenario</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(Object.keys(SCENARIO_META) as Scenario[]).map(s => (
              <button key={s} onClick={() => { setScenario(s); setAdhOverride(null); }} className={`px-2.5 py-1.5 text-xs font-bold rounded-md ${scenario === s && adhOverride === null ? 'bg-white text-indigo-700 shadow' : 'text-slate-600'}`}>
                {SCENARIO_META[s].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Loop length</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(Object.keys(LOOP_LEN) as LoopLen[]).map(l => (
              <button key={l} onClick={() => setLoopLen(l)} className={`px-2.5 py-1.5 text-xs font-bold rounded-md ${loopLen === l ? 'bg-white text-indigo-700 shadow' : 'text-slate-600'}`}>
                {LOOP_LEN[l].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>ADH override</span><span className="font-mono">{adhOverride !== null ? `${adhOverride}%` : 'auto'}</span>
          </label>
          <input type="range" min={0} max={100} step={5} value={adhOverride ?? adh} onChange={e => setAdhOverride(parseInt(e.target.value))} className="w-full mt-1 accent-violet-600" />
          {adhOverride !== null && <button onClick={() => setAdhOverride(null)} className="text-[10px] text-violet-600 underline">reset to scenario</button>}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Vasa recta</label>
          <button onClick={() => setCountercurrentOn(c => !c)} className={`mt-1.5 w-full px-3 py-2 text-xs font-bold rounded-md border ${countercurrentOn ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
            Counter-current {countercurrentOn ? 'ON' : 'OFF (gradient collapses)'}
          </button>
        </div>
      </div>
    </div>
  );

  return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsComponent} />;
};

const Cell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-indigo-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-extrabold text-indigo-700">{value}</div>
  </div>
);

export default CountercurrentMultiplierLab;
