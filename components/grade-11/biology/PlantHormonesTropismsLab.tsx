import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Apple, Pause, Play, RotateCcw, Scissors, Sprout, Sun } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PlantHormonesTropismsLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Stage = 'coleoptile' | 'apical' | 'ripening';
type Hormone = 'auxin' | 'gibberellin' | 'cytokinin' | 'ethylene' | 'aba';

interface Fruit { id: number; x: number; y: number; ripeness: number; ripe: boolean; emitting: boolean }
interface EthMol { id: number; x: number; y: number; r: number; alpha: number }
interface AuxinMol { id: number; x: number; y: number; alpha: number }

const HORMONE_META: Record<Hormone, { label: string; color: string; light: string; effect: string }> = {
  auxin:       { label: 'Auxin (IAA)',   color: '#0891b2', light: '#cffafe', effect: 'Apical dominance, phototropism, rooting, parthenocarpy' },
  gibberellin: { label: 'Gibberellin',   color: '#7c3aed', light: '#ede9fe', effect: 'Stem elongation, bolting, grape stalk growth' },
  cytokinin:   { label: 'Cytokinin',     color: '#16a34a', light: '#dcfce7', effect: 'Cell division, lateral shoots, delay leaf senescence' },
  ethylene:    { label: 'Ethylene (C₂H₄)', color: '#d97706', light: '#fef3c7', effect: 'Fruit ripening, abscission, climacteric rise' },
  aba:         { label: 'Abscisic Acid', color: '#dc2626', light: '#fee2e2', effect: 'Stress response, abscission, dormancy' },
};

const PlantHormonesTropismsLab: React.FC<PlantHormonesTropismsLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const ethMolsRef = useRef<EthMol[]>([]);
  const auxinMolsRef = useRef<AuxinMol[]>([]);
  const fruitsRef = useRef<Fruit[]>([
    { id: 1, x: 540, y: 480, ripeness: 0, ripe: false, emitting: false },
    { id: 2, x: 620, y: 470, ripeness: 0, ripe: false, emitting: false },
    { id: 3, x: 700, y: 480, ripeness: 0, ripe: false, emitting: false },
    { id: 4, x: 460, y: 490, ripeness: 0, ripe: false, emitting: false },
    { id: 5, x: 780, y: 490, ripeness: 0, ripe: false, emitting: false },
  ]);
  const idCounterRef = useRef<number>(0);

  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState<Stage>('coleoptile');
  const [selectedHormone, setSelectedHormone] = useState<Hormone>('auxin');
  const [sunAngle, setSunAngle] = useState(0); // -1 = left, 1 = right
  const [hormoneDose, setHormoneDose] = useState(50);
  const [decapitated, setDecapitated] = useState(false);
  const [bagSealed, setBagSealed] = useState(false);
  const [coleoptileBend, setColeoptileBend] = useState(0);

  const handleReset = useCallback(() => {
    ethMolsRef.current = [];
    auxinMolsRef.current = [];
    fruitsRef.current = fruitsRef.current.map(f => ({ ...f, ripeness: 0, ripe: false, emitting: false }));
    setSunAngle(0);
    setHormoneDose(50);
    setDecapitated(false);
    setBagSealed(false);
    setColeoptileBend(0);
  }, []);

  // animation loop
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
  }, [paused, stage, selectedHormone, sunAngle, hormoneDose, decapitated, bagSealed]);

  const step = (dt: number) => {
    if (stage === 'coleoptile') {
      // bend toward sun smoothly
      const targetBend = sunAngle * 35;
      setColeoptileBend(b => b + (targetBend - b) * dt * 1.5);
      // spawn auxin molecules on shaded side
      if (Math.random() < 0.6) {
        const cx = 640 + sunAngle * -40;
        auxinMolsRef.current.push({
          id: ++idCounterRef.current,
          x: cx + (Math.random() - 0.5) * 30,
          y: 280 + Math.random() * 200,
          alpha: 1,
        });
      }
      auxinMolsRef.current = auxinMolsRef.current
        .map(a => ({ ...a, alpha: a.alpha - dt * 0.6 }))
        .filter(a => a.alpha > 0);
    } else if (stage === 'ripening') {
      // emit ethylene from emitting fruits
      for (const f of fruitsRef.current) {
        if (f.emitting && Math.random() < 0.4) {
          ethMolsRef.current.push({
            id: ++idCounterRef.current,
            x: f.x,
            y: f.y,
            r: 0,
            alpha: 1,
          });
        }
        if (f.ripe && !f.emitting) {
          f.emitting = true;
        }
      }
      // ethylene molecules expand
      ethMolsRef.current = ethMolsRef.current
        .map(e => ({ ...e, r: e.r + 80 * dt, alpha: e.alpha - dt * 0.3 }))
        .filter(e => e.alpha > 0);
      // ripen neighbours within ethylene radius
      const speed = bagSealed ? 2.5 : 1.2;
      for (const e of ethMolsRef.current) {
        for (const f of fruitsRef.current) {
          if (f.ripeness >= 1) continue;
          const d = Math.hypot(f.x - e.x, f.y - e.y);
          if (d < e.r && d > e.r - 30) {
            f.ripeness = Math.min(1, f.ripeness + dt * speed * 0.4);
            if (f.ripeness >= 1) f.ripe = true;
          }
        }
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

    if (stage === 'coleoptile') drawColeoptile(ctx);
    else if (stage === 'apical') drawApical(ctx);
    else drawRipening(ctx);
  };

  const drawColeoptile = (ctx: CanvasRenderingContext2D) => {
    // soil
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 600, W, H - 600);
    ctx.fillStyle = '#a16207';
    ctx.font = '600 13px Inter';
    ctx.fillText('Soil', 30, 640);

    // sun
    const sunX = 640 + sunAngle * 480;
    const sunY = 110;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 38, 0, Math.PI * 2);
    ctx.fillStyle = '#fde68a';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 22;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
    // light cone
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.beginPath();
    ctx.moveTo(sunX, sunY + 30);
    ctx.lineTo(640 - 120, 600);
    ctx.lineTo(640 + 120, 600);
    ctx.closePath();
    ctx.fill();

    // coleoptile — curved stem
    const baseX = 640;
    const baseY = 600;
    const tipX = baseX + coleoptileBend;
    const tipY = 280;
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(baseX + coleoptileBend * 0.5, (baseY + tipY) / 2, tipX, tipY);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // shading cells on dark side
    ctx.fillStyle = 'rgba(20, 83, 45, 0.4)';
    const darkX = sunAngle > 0 ? baseX - 8 : baseX + 8;
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(darkX - 4, baseY - 60 - i * 50, 8, 36);
    }

    // tip glow
    ctx.beginPath();
    ctx.arc(tipX, tipY, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 16;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0e7490';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('tip', tipX, tipY + 3);
    ctx.textAlign = 'left';

    // auxin molecules
    for (const a of auxinMolsRef.current) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(8, 145, 178, ${a.alpha})`;
      ctx.fill();
    }

    // labels
    ctx.fillStyle = '#0e7490';
    ctx.font = '600 14px Inter';
    ctx.fillText('Auxin (IAA) — produced at tip, migrates DOWN the shaded side', 320, 60);
    ctx.fillStyle = '#475569';
    ctx.font = '500 12px Inter';
    ctx.fillText("Darwin (1880): tip of coleoptile is the source of the 'transmittable influence' (NCERT Fig 13.10)", 320, 78);

    // bend angle indicator
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 16px Inter';
    ctx.fillText(`Bend: ${Math.round(Math.abs(coleoptileBend) / 35 * 30)}° toward light`, 30, 30);
  };

  const drawApical = (ctx: CanvasRenderingContext2D) => {
    // ground
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 620, W, H - 620);
    ctx.fillStyle = '#a16207';
    ctx.font = '600 13px Inter';
    ctx.fillText('Soil', 30, 660);

    // main stem
    const baseX = 640;
    const baseY = 620;
    const apexY = decapitated ? 350 : 220;
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(baseX, apexY);
    ctx.stroke();

    // apical bud (or cut)
    if (decapitated) {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(baseX - 18, apexY - 6, 36, 6);
      ctx.fillStyle = '#dc2626';
      ctx.font = '700 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('✂ Decapitated', baseX, apexY - 12);
      ctx.textAlign = 'left';
    } else {
      ctx.beginPath();
      ctx.arc(baseX, apexY, 24, 0, Math.PI * 2);
      ctx.fillStyle = selectedHormone === 'cytokinin'
        ? '#16a34a'
        : `rgba(8, 145, 178, ${0.35 + hormoneDose / 200})`;
      ctx.shadowColor = '#0891b2';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('apical', baseX, apexY - 2);
      ctx.fillText('bud', baseX, apexY + 10);
      ctx.textAlign = 'left';
    }

    // determine lateral bud activity
    const auxinHigh = !decapitated && selectedHormone === 'auxin' && hormoneDose > 30;
    const cytokininActive = selectedHormone === 'cytokinin' && hormoneDose > 30;
    const lateralsBloom = decapitated || cytokininActive || (selectedHormone !== 'auxin' && !auxinHigh);

    // lateral buds at three heights
    const heights = [320, 420, 520];
    for (const ly of heights) {
      // bud
      const bloom = lateralsBloom && (cytokininActive || decapitated || ly < 500);
      const branchLen = bloom ? 90 : 28;
      // left
      ctx.strokeStyle = bloom ? '#16a34a' : '#86efac';
      ctx.lineWidth = bloom ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(baseX - 6, ly);
      ctx.lineTo(baseX - branchLen, ly - (bloom ? 25 : 0));
      ctx.stroke();
      // right
      ctx.beginPath();
      ctx.moveTo(baseX + 6, ly);
      ctx.lineTo(baseX + branchLen, ly - (bloom ? 25 : 0));
      ctx.stroke();
      // leaves
      if (bloom) {
        drawLeaf(ctx, baseX - branchLen - 8, ly - 25, -1);
        drawLeaf(ctx, baseX + branchLen + 8, ly - 25, 1);
      } else {
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.arc(baseX - branchLen - 4, ly, 5, 0, Math.PI * 2);
        ctx.arc(baseX + branchLen + 4, ly, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // status banner
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 16px Inter';
    if (decapitated) {
      ctx.fillText('Apical bud removed → lateral buds bloom (apical dominance lifted)', 30, 30);
    } else if (cytokininActive) {
      ctx.fillText('Cytokinin antagonises auxin → laterals bloom despite intact tip', 30, 30);
    } else if (auxinHigh) {
      ctx.fillText('High auxin from apical bud → lateral buds suppressed', 30, 30);
    } else {
      ctx.fillText('Adjust hormone or decapitate to see apical dominance change', 30, 30);
    }
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §13.4.3.1 — decapitation widely applied in tea plantations and hedge-making', 30, 48);
  };

  const drawLeaf = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number) => {
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(x, y, 20, 9, dir > 0 ? -0.4 : 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawRipening = (ctx: CanvasRenderingContext2D) => {
    // bowl
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.ellipse(640, 540, 280, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.ellipse(640, 540, 270, 40, 0, Math.PI, 2 * Math.PI);
    ctx.fill();

    // bag overlay if sealed
    if (bagSealed) {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.5)';
      roundRect(ctx, 350, 380, 580, 200, 30);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#0c4a6e';
      ctx.font = '700 13px Inter';
      ctx.fillText('🛍 Sealed — ethylene trapped, ripening accelerated', 360, 405);
    }

    // ethylene molecules (rings)
    for (const e of ethMolsRef.current) {
      ctx.strokeStyle = `rgba(217, 119, 6, ${e.alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // fruits
    for (const f of fruitsRef.current) {
      drawFruit(ctx, f);
    }

    // banner
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 16px Inter';
    ctx.fillText('Ethylene (gaseous PGR) — fruit ripening & climacteric respiratory rise', 30, 30);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §13.4.3.4 — click any fruit to make it ripe. Toggle the sealed bag to trap the gas.', 30, 48);
  };

  const drawFruit = (ctx: CanvasRenderingContext2D, f: Fruit) => {
    // colour interpolation green → yellow → red
    let r: number, g: number, b: number;
    if (f.ripeness < 0.5) {
      const t = f.ripeness * 2;
      r = Math.round(34 + (252 - 34) * t);
      g = Math.round(197 + (211 - 197) * t);
      b = Math.round(94 + (77 - 94) * t);
    } else {
      const t = (f.ripeness - 0.5) * 2;
      r = Math.round(252 + (220 - 252) * t);
      g = Math.round(211 + (38 - 211) * t);
      b = Math.round(77 + (38 - 77) * t);
    }
    ctx.beginPath();
    ctx.arc(f.x, f.y, 30, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // stem
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(f.x - 2, f.y - 36, 4, 8);
    // leaf
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(f.x + 5, f.y - 34, 6, 3, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // pulse if emitting
    if (f.emitting) {
      ctx.strokeStyle = `rgba(217, 119, 6, ${0.4 + Math.sin(performance.now() / 200) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 38, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // click handler for ripening fruits
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stage !== 'ripening') return;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (const f of fruitsRef.current) {
      if (Math.hypot(f.x - x, f.y - y) < 32) {
        f.ripeness = 1;
        f.ripe = true;
        f.emitting = true;
        break;
      }
    }
  };

  // PANELS
  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Discovery Timeline</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">NCERT §13.4.2</div>
          <ul className="mt-3 text-xs space-y-2 leading-snug">
            <li><b className="text-cyan-700">1880 · Darwin</b> — Coleoptile bends toward light. Tip is the source.</li>
            <li><b className="text-violet-700">1926 · Kurosawa</b> — <i>Gibberella fujikuroi</i> filtrate → "bakanae" / gibberellins.</li>
            <li><b className="text-emerald-700">1955 · Miller</b> — Kinetin from autoclaved DNA → cytokinins.</li>
            <li><b className="text-amber-700">1910 · Cousins</b> — Ripe oranges hasten banana ripening → ethylene.</li>
            <li><b className="text-red-700">1960s</b> — Inhibitor-B / abscission II / dormin → all = ABA.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Hormone Cheat Sheet</div>
          <div className="mt-2 space-y-1.5">
            {(Object.keys(HORMONE_META) as Hormone[]).map(h => (
              <div key={h} className="rounded-md px-2 py-1.5 text-xs" style={{ background: HORMONE_META[h].light, color: HORMONE_META[h].color }}>
                <div className="font-extrabold">{HORMONE_META[h].label}</div>
                <div className="text-[10.5px] opacity-80 mt-0.5">{HORMONE_META[h].effect}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-emerald-900">Plant Growth Regulators</div>
          <div className="text-xs font-semibold text-emerald-700 mt-0.5">NCERT Ch 13 · §13.4</div>
          <p className="text-sm leading-snug text-emerald-950 mt-2">
            "Small, simple molecules of diverse chemical composition" — also called plant hormones / phytohormones.
            Two groups: <b>promoters</b> (auxin, GA, cytokinin) and <b>inhibitors</b> (ABA; ethylene fits either but is "largely an inhibitor").
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg border border-slate-100 bg-cyan-50 px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Stage</div>
              <div className="mt-0.5 font-mono text-sm font-extrabold text-cyan-700">
                {stage === 'coleoptile' ? 'Darwin Coleoptile' : stage === 'apical' ? 'Apical Dominance' : 'Fruit Ripening'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Selected hormone</div>
              <div className="mt-0.5 font-mono text-sm font-extrabold" style={{ color: HORMONE_META[selectedHormone].color }}>
                {HORMONE_META[selectedHormone].label}
              </div>
            </div>
            {stage === 'ripening' && (
              <div className="rounded-lg border border-slate-100 bg-emerald-50 px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ripe fruits</div>
                <div className="mt-0.5 font-mono text-base font-extrabold text-emerald-700">
                  {fruitsRef.current.filter(f => f.ripeness >= 1).length} / {fruitsRef.current.length}
                </div>
              </div>
            )}
            {stage === 'coleoptile' && (
              <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Sun position</div>
                <div className="mt-0.5 font-mono text-sm font-extrabold text-amber-700">
                  {sunAngle < -0.1 ? '◀ Left' : sunAngle > 0.1 ? 'Right ▶' : 'Centre'}
                </div>
              </div>
            )}
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
        <Sprout size={18} className="text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-800">Plant Hormones & Tropisms Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Stage</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['coleoptile', 'apical', 'ripening'] as Stage[]).map(s => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  stage === s ? 'bg-white text-emerald-700 shadow' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {s === 'coleoptile' ? 'A · Coleoptile' : s === 'apical' ? 'B · Apical' : 'C · Ripening'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Hormone palette</label>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(Object.keys(HORMONE_META) as Hormone[]).map(h => (
              <button
                key={h}
                onClick={() => setSelectedHormone(h)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-colors ${
                  selectedHormone === h ? 'shadow-inner' : 'hover:opacity-80'
                }`}
                style={{
                  background: selectedHormone === h ? HORMONE_META[h].color : HORMONE_META[h].light,
                  color: selectedHormone === h ? '#ffffff' : HORMONE_META[h].color,
                  borderColor: HORMONE_META[h].color,
                }}
              >
                {HORMONE_META[h].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {stage === 'coleoptile' && (
          <div className="md:col-span-2">
            <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
              <span><Sun size={11} className="inline" /> Sun direction</span>
              <span className="font-mono text-slate-700">{sunAngle < 0 ? `${Math.round(sunAngle * -100)}% Left` : sunAngle > 0 ? `${Math.round(sunAngle * 100)}% Right` : 'Centre'}</span>
            </label>
            <input
              type="range" min={-1} max={1} step={0.05} value={sunAngle}
              onChange={e => setSunAngle(parseFloat(e.target.value))}
              className="w-full mt-1 accent-amber-500"
            />
          </div>
        )}

        {stage === 'apical' && (
          <>
            <div>
              <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
                <span>Hormone dose</span>
                <span className="font-mono text-slate-700">{hormoneDose}%</span>
              </label>
              <input
                type="range" min={0} max={100} step={5} value={hormoneDose}
                onChange={e => setHormoneDose(parseInt(e.target.value))}
                className="w-full mt-1 accent-cyan-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Apical bud</label>
              <button
                onClick={() => setDecapitated(d => !d)}
                className={`mt-1.5 w-full px-3 py-2 text-xs font-bold rounded-md border ${
                  decapitated ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Scissors size={12} className="inline mr-1" /> {decapitated ? 'Restore tip' : 'Decapitate'}
              </button>
            </div>
          </>
        )}

        {stage === 'ripening' && (
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Ethylene containment</label>
            <button
              onClick={() => setBagSealed(b => !b)}
              className={`mt-1.5 w-full px-3 py-2 text-xs font-bold rounded-md border ${
                bagSealed ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Apple size={12} className="inline mr-1" /> {bagSealed ? '🛍 Sealed bag — release' : 'Seal in bag'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <TopicLayoutContainer
      topic={topic}
      onExit={onExit}
      SimulationComponent={simulationCombo}
      ControlsComponent={controlsComponent}
    />
  );
};

export default PlantHormonesTropismsLab;
