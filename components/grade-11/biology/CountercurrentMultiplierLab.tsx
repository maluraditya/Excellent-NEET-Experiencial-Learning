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

  const loopTop = 205;
  const loopBottom = 600;
  const descX = 440;
  const ascX = 540;
  const ductX = 720;
  const MED_X = 110, MED_W = 900, MED_Y = 150, MED_H = 500; // medulla region

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

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 22px Inter';
    ctx.fillText('Countercurrent Multiplier — Loop of Henle & Collecting Duct', 30, 38);
    ctx.font = '600 13px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §16.4 — a 300 → ' + maxOsm + ' mOsm/L medullary gradient (NaCl + urea) lets the duct concentrate urine.', 30, 60);

    drawMedullaGradient(ctx);   // immersive osmotic-gradient background
    drawLoop(ctx);
    drawDuct(ctx);
    drawVasaRecta(ctx);

    // filtrate drops (colour = osmolality)
    for (const d of dropsRef.current) {
      const x = d.phase === 'desc' ? descX : d.phase === 'asc' ? ascX : ductX;
      ctx.beginPath();
      ctx.arc(x, d.y, 7, 0, Math.PI * 2);
      const sat = Math.min(1, (d.conc - 300) / 900);
      ctx.fillStyle = `rgb(${Math.round(96 + sat * 60)}, ${Math.round(165 - sat * 90)}, ${Math.round(250 - sat * 90)})`;
      ctx.fill();
      ctx.strokeStyle = '#0c4a6e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    drawBeaker(ctx);
    drawAdhMeter(ctx);
    drawLegend(ctx);
  };

  // full medulla region with the rising osmotic gradient behind the tubules
  const drawMedullaGradient = (ctx: CanvasRenderingContext2D) => {
    const grad = ctx.createLinearGradient(0, MED_Y, 0, MED_Y + MED_H);
    grad.addColorStop(0, '#eef2ff');
    grad.addColorStop(0.35, '#93c5fd');
    grad.addColorStop(1, countercurrentOn ? '#312e81' : '#93c5fd');
    ctx.fillStyle = grad;
    ctx.fillRect(MED_X, MED_Y, MED_W, MED_H);
    // cortex band above
    ctx.fillStyle = '#fdf2f8';
    ctx.fillRect(MED_X, MED_Y - 42, MED_W, 42);
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
    ctx.strokeRect(MED_X, MED_Y - 42, MED_W, MED_H + 42);
    // region labels
    ctx.fillStyle = '#9d174d'; ctx.font = '700 13px Inter';
    ctx.fillText('CORTEX', MED_X + 10, MED_Y - 16);
    ctx.fillStyle = '#1e3a8a'; ctx.font = '700 13px Inter';
    ctx.fillText('OUTER MEDULLA', MED_X + 10, MED_Y + 60);
    ctx.fillStyle = countercurrentOn ? '#e0e7ff' : '#1e3a8a';
    ctx.fillText('INNER MEDULLA', MED_X + 10, MED_Y + MED_H - 16);
    // osmolality axis on the far left
    ctx.textAlign = 'right';
    ctx.fillStyle = '#334155'; ctx.font = '700 13px Inter';
    ctx.fillText('300', MED_X - 10, MED_Y + 6);
    ctx.font = '600 11px Inter';
    ctx.fillText('mOsm/L', MED_X - 10, MED_Y + 22);
    ctx.font = '700 13px Inter';
    ctx.fillText(`${maxOsm}`, MED_X - 10, MED_Y + MED_H);
    ctx.textAlign = 'left';
    ctx.save();
    ctx.translate(MED_X - 46, MED_Y + MED_H / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#475569'; ctx.font = '700 12px Inter'; ctx.textAlign = 'center';
    ctx.fillText('osmotic gradient  →  more concentrated', 0, 0);
    ctx.restore();
    ctx.textAlign = 'left';
  };

  // draw a tubule as wall + pale lumen along a path fn
  const tubule = (ctx: CanvasRenderingContext2D, path: () => void, wall: string, lumen: string, outerW: number) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = wall; ctx.lineWidth = outerW; path(); ctx.stroke();
    ctx.strokeStyle = lumen; ctx.lineWidth = outerW - 12; path(); ctx.stroke();
    ctx.lineCap = 'butt';
  };

  const drawLoop = (ctx: CanvasRenderingContext2D) => {
    const loopPath = () => {
      ctx.beginPath();
      ctx.moveTo(descX, loopTop);
      ctx.lineTo(descX, loopBottom - (ascX - descX) / 2);
      ctx.arc((descX + ascX) / 2, loopBottom - (ascX - descX) / 2, (ascX - descX) / 2, Math.PI, 0, true);
      ctx.lineTo(ascX, loopTop);
    };
    tubule(ctx, loopPath, '#64748b', '#f8fafc', 32);

    // labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a'; ctx.font = '800 14px Inter';
    ctx.fillText('Loop of Henle', (descX + ascX) / 2, loopTop - 52);
    ctx.font = '700 12px Inter'; ctx.fillStyle = '#1d4ed8';
    ctx.fillText('descending ↓', descX, loopTop - 30);
    ctx.fillStyle = '#15803d';
    ctx.fillText('ascending ↑', ascX, loopTop - 30);
    ctx.font = '600 11px Inter'; ctx.fillStyle = '#1d4ed8';
    ctx.fillText('permeable to water', descX, loopTop - 14);
    ctx.fillStyle = '#15803d';
    ctx.fillText('pumps out NaCl', ascX, loopTop - 14);

    // permeability arrows
    for (let i = 0; i < 7; i++) {
      const y = loopTop + 55 + i * 68;
      if (y > loopBottom - 60) break;
      // water OUT of descending (blue, leftward)
      ctx.strokeStyle = '#3b82f6'; ctx.fillStyle = '#3b82f6'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(descX - 18, y); ctx.lineTo(descX - 44, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(descX - 44, y); ctx.lineTo(descX - 36, y - 4); ctx.lineTo(descX - 36, y + 4); ctx.closePath(); ctx.fill();
      // NaCl OUT of ascending (green, rightward)
      ctx.strokeStyle = '#16a34a'; ctx.fillStyle = '#16a34a';
      ctx.beginPath(); ctx.moveTo(ascX + 18, y); ctx.lineTo(ascX + 44, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ascX + 44, y); ctx.lineTo(ascX + 36, y - 4); ctx.lineTo(ascX + 36, y + 4); ctx.closePath(); ctx.fill();
    }
    ctx.textAlign = 'left';
  };

  const drawDuct = (ctx: CanvasRenderingContext2D) => {
    const ductPath = () => { ctx.beginPath(); ctx.moveTo(ductX, loopTop - 30); ctx.lineTo(ductX, loopBottom + 40); };
    tubule(ctx, ductPath, '#64748b', '#f8fafc', 36);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a'; ctx.font = '800 14px Inter';
    ctx.fillText('Collecting', ductX, loopTop - 50);
    ctx.fillText('duct', ductX, loopTop - 34);
    // ADH-gated water pores
    const permeable = adh > 50;
    for (let i = 0; i < 6; i++) {
      const y = loopTop + 40 + i * 80;
      if (y > loopBottom) break;
      ctx.fillStyle = permeable ? '#3b82f6' : '#cbd5e1';
      ctx.fillRect(ductX + 12, y - 7, 10, 14);
      if (permeable) {
        // water reabsorbed OUT of the duct (rightward into medulla)
        ctx.strokeStyle = '#3b82f6'; ctx.fillStyle = '#3b82f6'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ductX + 24, y); ctx.lineTo(ductX + 48, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ductX + 48, y); ctx.lineTo(ductX + 40, y - 4); ctx.lineTo(ductX + 40, y + 4); ctx.closePath(); ctx.fill();
      }
    }
    ctx.fillStyle = permeable ? '#1d4ed8' : '#64748b'; ctx.font = '700 12px Inter';
    ctx.fillText(permeable ? `ADH ${adh}% → water leaves → concentrated urine` : `ADH ${adh}% → wall stays sealed → dilute urine`, ductX, loopBottom + 62);
    ctx.textAlign = 'left';
  };

  const drawVasaRecta = (ctx: CanvasRenderingContext2D) => {
    const vx0 = 870, vx1 = 930;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(vx0, loopTop);
      ctx.lineTo(vx0, loopBottom - 30);
      ctx.arc((vx0 + vx1) / 2, loopBottom - 30, (vx1 - vx0) / 2, Math.PI, 0, true);
      ctx.lineTo(vx1, loopTop);
    };
    tubule(ctx, path, countercurrentOn ? '#dc2626' : '#f87171', '#fee2e2', 22);
    // RBCs flowing
    for (let i = 0; i < 5; i++) {
      const y = loopTop + 40 + i * 90;
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath(); ctx.ellipse(vx0, y, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(vx1, y + 30, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#7f1d1d'; ctx.font = '800 14px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Vasa recta', (vx0 + vx1) / 2, loopTop - 34);
    ctx.font = '600 11px Inter';
    ctx.fillText('blood loops down & up', (vx0 + vx1) / 2, loopTop - 18);
    if (!countercurrentOn) {
      ctx.fillStyle = '#dc2626'; ctx.font = '800 13px Inter';
      ctx.fillText('⚠ counter-current OFF —', (vx0 + vx1) / 2, loopBottom + 30);
      ctx.fillText('gradient washed out', (vx0 + vx1) / 2, loopBottom + 46);
    }
    ctx.textAlign = 'left';
  };

  const drawBeaker = (ctx: CanvasRenderingContext2D) => {
    const bx = 1040, bw = 150, by = 470, bh = 170;
    // glass
    ctx.fillStyle = 'rgba(226,232,240,0.4)';
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh - 14);
    ctx.quadraticCurveTo(bx, by + bh, bx + 14, by + bh);
    ctx.lineTo(bx + bw - 14, by + bh);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw, by + bh - 14);
    ctx.lineTo(bx + bw, by); ctx.stroke();
    // urine fill
    const fillH = Math.min(bh - 20, urineVolume * 0.6);
    const sat = Math.min(1, (urineConc - 300) / 900);
    const ug = ctx.createLinearGradient(0, by + bh - fillH, 0, by + bh);
    ug.addColorStop(0, `rgb(${250 - sat * 60}, ${230 - sat * 70}, ${120 - sat * 90})`);
    ug.addColorStop(1, `rgb(${230 - sat * 70}, ${190 - sat * 80}, ${40 + sat * 40})`);
    ctx.fillStyle = ug;
    ctx.fillRect(bx + 3, by + bh - fillH, bw - 6, fillH - 2);
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh - 14);
    ctx.quadraticCurveTo(bx, by + bh, bx + 14, by + bh);
    ctx.lineTo(bx + bw - 14, by + bh);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw, by + bh - 14);
    ctx.lineTo(bx + bw, by); ctx.stroke();
    ctx.fillStyle = '#0f172a'; ctx.font = '800 15px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Urine collected', bx + bw / 2, by - 12);
    ctx.font = '700 13px Inter'; ctx.fillStyle = '#334155';
    ctx.fillText(`${urineConc.toFixed(0)} mOsm/L`, bx + bw / 2, by + bh + 22);
    ctx.font = '600 12px Inter'; ctx.fillStyle = '#64748b';
    ctx.fillText(urineConc > 800 ? 'concentrated' : urineConc < 200 ? 'very dilute' : 'moderate', bx + bw / 2, by + bh + 40);
    ctx.textAlign = 'left';
  };

  const drawAdhMeter = (ctx: CanvasRenderingContext2D) => {
    const x = 1075, y = 150, h = 150;
    ctx.fillStyle = '#0f172a'; ctx.font = '800 14px Inter'; ctx.textAlign = 'center';
    ctx.fillText('ADH', x + 15, y - 10);
    ctx.fillStyle = '#f1f5f9'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.fillRect(x, y, 30, h); ctx.strokeRect(x, y, 30, h);
    const fg = ctx.createLinearGradient(0, y + h, 0, y);
    fg.addColorStop(0, '#a78bfa'); fg.addColorStop(1, '#6d28d9');
    ctx.fillStyle = fg;
    ctx.fillRect(x + 2, y + h - (h * adh / 100), 26, h * adh / 100);
    ctx.fillStyle = '#4c1d95'; ctx.font = '800 15px Inter';
    ctx.fillText(`${adh}%`, x + 15, y + h + 22);
    ctx.font = '600 11px Inter'; ctx.fillStyle = '#64748b';
    ctx.fillText(SCENARIO_META[scenario].label, x + 15, y + h + 40);
    ctx.textAlign = 'left';
  };

  const drawLegend = (ctx: CanvasRenderingContext2D) => {
    const x = 150, y = 672, items: [string, string][] = [
      ['#3b82f6', 'water reabsorbed'],
      ['#16a34a', 'NaCl pumped out'],
      ['#dc2626', 'vasa recta (blood)'],
      ['#93c5fd', 'dilute filtrate'],
      ['#f97316', 'concentrated filtrate'],
    ];
    ctx.font = '700 12px Inter';
    let px = x;
    items.forEach(([c, label]) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#334155'; ctx.fillText(label, px + 14, y + 4);
      px += ctx.measureText(label).width + 46;
    });
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
