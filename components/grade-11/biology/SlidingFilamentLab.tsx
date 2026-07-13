import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Pause, Play, RotateCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface SlidingFilamentLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type State = 'rest' | 'fire' | 'contracting' | 'rigor';

const SlidingFilamentLab: React.FC<SlidingFilamentLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);
  const headPhasesRef = useRef<number[]>(Array.from({ length: 8 }, () => Math.random()));
  const caLevelRef = useRef<number>(0);
  // stable Ca²⁺ ion positions (no per-frame flicker)
  const caIonsRef = useRef<{ x: number; storedY: number; freeY: number }[]>([]);
  if (caIonsRef.current.length === 0) {
    for (let i = 0; i < 16; i++) {
      caIonsRef.current.push({
        x: 470 + i * 22,
        storedY: 556 + (i % 2) * 14,
        freeY: 470 - (i % 4) * 16,
      });
    }
  }

  const [paused, setPaused] = useState(false);
  const [stimRate, setStimRate] = useState(2); // Hz
  const [atpLevel, setAtpLevel] = useState(100);
  const [stepMode, setStepMode] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [contraction, setContraction] = useState(0); // 0..1
  const [state, setState] = useState<State>('rest');

  const handleReset = useCallback(() => {
    phaseRef.current = 0;
    caLevelRef.current = 0;
    setContraction(0);
    setStepIdx(0);
    setState('rest');
  }, []);

  const fireTwitch = useCallback(() => {
    setStepMode(false);   // resume live sim so the twitch actually plays
    setState('fire');
    caLevelRef.current = 1;
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
  }, [paused, stimRate, atpLevel, stepMode, stepIdx]);

  const step = (dt: number) => {
    if (stepMode) return;

    // Tetanus / repeated stimulation
    phaseRef.current += dt * stimRate;
    if (phaseRef.current >= 1) {
      phaseRef.current -= 1;
      caLevelRef.current = 1;
      setState('fire');
    }

    // Ca decay (pumped back)
    caLevelRef.current = Math.max(0, caLevelRef.current - dt * 0.5);

    // contraction follows Ca, modulated by ATP
    const atpFactor = atpLevel / 100;
    if (atpLevel < 5) {
      // rigor — locked
      setState('rigor');
      setContraction(c => Math.max(c, 0.5));
    } else {
      const target = caLevelRef.current * 0.55 * atpFactor;
      setContraction(c => c + (target - c) * dt * 3);
      if (caLevelRef.current < 0.1) setState('rest');
      else setState('contracting');
    }

    // myosin heads cycle when ATP available
    if (atpLevel > 5) {
      for (let i = 0; i < headPhasesRef.current.length; i++) {
        headPhasesRef.current[i] = (headPhasesRef.current[i] + dt * 1.2 * (caLevelRef.current > 0.1 ? 1 : 0.1)) % 1;
      }
    }
  };

  // freeze the sim at a chosen stage of the cross-bridge cycle
  const setStage = (i: number) => {
    const ca = [0.15, 1, 1, 1, 1, 0][i];
    const con = [0, 0, 0, 0.12, 0.45, 0][i];
    const st: State[] = ['fire', 'fire', 'contracting', 'contracting', 'contracting', 'rest'];
    setStepMode(true);
    setStepIdx(i);
    caLevelRef.current = ca;
    setContraction(con);
    setState(st[i]);
  };

  const advanceStep = () => {
    const next = (stepIdx + 1) % 6;
    setStage(next);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * W;
    const cy = ((e.clientY - rect.top) / rect.height) * H;
    // step panel geometry (matches drawStepPanel)
    const panelX = 96, panelY = 610, panelW = W - 192, panelH = 120;
    if (cy >= panelY && cy <= panelY + panelH && cx >= panelX && cx <= panelX + panelW) {
      const cw = (panelW - 40) / 6;
      const col = Math.round((cx - (panelX + 30)) / cw);
      if (col >= 0 && col < 6) setStage(col);
    }
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
    ctx.fillText('Sliding Filament Theory — how a sarcomere shortens', 30, 38);
    ctx.font = '600 13px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §17.2.2 — Ca²⁺ exposes actin binding sites, ATP-powered myosin heads pull actin inward. The A-band stays constant; the I-band & H-zone shrink.', 30, 60);

    drawMotorNeuron(ctx);
    drawSarcomere(ctx);
    drawSarcoplasmicCisternae(ctx);
    drawStepPanel(ctx);
  };

  const drawMotorNeuron = (ctx: CanvasRenderingContext2D) => {
    // axon terminal at top
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;
    ctx.fillRect(50, 110, 250, 60);
    ctx.strokeRect(50, 110, 250, 60);
    ctx.fillStyle = '#92400e';
    ctx.font = '700 12px Inter';
    ctx.fillText('Motor neuron axon terminal', 60, 130);
    // synaptic vesicles
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(100 + i * 35, 150, 6, 0, Math.PI * 2);
      ctx.fillStyle = state === 'fire' && i === Math.floor(phaseRef.current * 5) ? '#16a34a' : '#86efac';
      ctx.fill();
    }
    ctx.fillStyle = '#475569';
    ctx.font = '500 10px Inter';
    ctx.fillText('synaptic vesicles', 350, 145);
    ctx.fillText('(ACh)', 350, 158);
    // sarcolemma below
    ctx.strokeStyle = state !== 'rest' ? '#0ea5e9' : '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 200);
    ctx.lineTo(450, 200);
    ctx.stroke();
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '600 11px Inter';
    ctx.fillText('Sarcolemma', 460, 205);
  };

  const drawSarcomere = (ctx: CanvasRenderingContext2D) => {
    const cx = 640, y = 350;
    const sarcoW = 760 * (1 - contraction * 0.32);
    const left = cx - sarcoW / 2, right = cx + sarcoW / 2;
    const thickStart = cx - 150, thickEnd = cx + 150;   // A-band (constant)
    const actinLen = 250;
    const leftTip = left + actinLen, rightTip = right - actinLen;
    const exposed = caLevelRef.current > 0.3 && atpLevel > 5;
    const rowY = [y - 30, y + 30];

    // ---- band brackets above ----
    const bracket = (x1: number, x2: number, yb: number, label: string, color: string) => {
      ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, yb + 6); ctx.lineTo(x1, yb); ctx.lineTo(x2, yb); ctx.lineTo(x2, yb + 6);
      ctx.stroke();
      ctx.font = '700 12px Inter'; ctx.textAlign = 'center';
      ctx.fillText(label, (x1 + x2) / 2, yb - 6);
      ctx.textAlign = 'left';
    };
    bracket(left, thickStart, y - 96, 'I band ↓', '#be185d');
    bracket(thickEnd, right, y - 96, 'I band ↓', '#be185d');
    bracket(thickStart, thickEnd, y - 96, 'A band (constant)', '#1e3a8a');
    if (rightTip > leftTip) bracket(leftTip, rightTip, y - 126, 'H zone ↓', '#7c3aed');

    // ---- thin filaments (actin) : bead strands + tropomyosin + troponin ----
    const drawActin = (x0: number, x1: number, ay: number) => {
      const dir = x1 > x0 ? 1 : -1;
      // backbone
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, ay); ctx.lineTo(x1, ay); ctx.stroke();
      // G-actin beads
      for (let bx = x0; dir > 0 ? bx <= x1 : bx >= x1; bx += dir * 12) {
        ctx.beginPath(); ctx.arc(bx, ay, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24'; ctx.fill();
      }
      // tropomyosin strand (covers sites when relaxed)
      ctx.strokeStyle = exposed ? '#f9a8d4' : '#ec4899'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, ay + (ay < y ? -5 : 5)); ctx.lineTo(x1, ay + (ay < y ? -5 : 5)); ctx.stroke();
      // troponin
      for (let bx = x0 + dir * 20; dir > 0 ? bx < x1 : bx > x1; bx += dir * 46) {
        ctx.beginPath(); ctx.arc(bx, ay + (ay < y ? -5 : 5), 4, 0, Math.PI * 2);
        ctx.fillStyle = caLevelRef.current > 0.3 ? '#22c55e' : '#06b6d4'; ctx.fill();
      }
    };
    rowY.forEach(ay => { drawActin(left, leftTip, ay); drawActin(right, rightTip, ay); });
    ctx.lineCap = 'butt';

    // ---- thick filament (myosin) ----
    const mg = ctx.createLinearGradient(0, y - 8, 0, y + 8);
    mg.addColorStop(0, '#475569'); mg.addColorStop(1, '#1e293b');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.moveTo(thickStart, y);
    ctx.roundRect ? ctx.roundRect(thickStart, y - 8, thickEnd - thickStart, 16, 8) : ctx.rect(thickStart, y - 8, thickEnd - thickStart, 16);
    ctx.fill();
    // M-line
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, y - 44); ctx.lineTo(cx, y + 44); ctx.stroke();

    // ---- myosin cross-bridge heads reaching toward actin ----
    for (let i = 0; i < 14; i++) {
      const hx = thickStart + 20 + i * ((thickEnd - thickStart - 40) / 13);
      if (Math.abs(hx - cx) < 32) continue; // bare central zone
      const overlaps = hx <= leftTip || hx >= rightTip;
      [-1, 1].forEach(dir => {
        const targetY = y + dir * 24;
        const phase = headPhasesRef.current[i % 8];
        const power = exposed && overlaps ? Math.sin(phase * Math.PI * 2) * 6 : 0;
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(hx, y + dir * 6); ctx.lineTo(hx - power, targetY); ctx.stroke();
        ctx.beginPath(); ctx.arc(hx - power, targetY, 5, 0, Math.PI * 2);
        ctx.fillStyle = state === 'rigor' ? '#dc2626' : (exposed && overlaps) ? '#16a34a' : '#94a3b8';
        ctx.fill();
      });
    }

    // ---- Z-discs ----
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(left - 4, y - 72, 8, 144);
    ctx.fillRect(right - 4, y - 72, 8, 144);
    ctx.font = '800 15px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Z', left, y + 92);
    ctx.fillText('Z', right, y + 92);
    ctx.font = '600 11px Inter'; ctx.fillStyle = '#475569';
    ctx.fillText('Z-disc', left, y + 108);
    ctx.fillText('Z-disc', right, y + 108);
    ctx.textAlign = 'left';

    // ---- legend + measurements ----
    ctx.font = '700 13px Inter'; ctx.fillStyle = '#334155';
    ctx.fillText(`Contraction: ${(contraction * 100).toFixed(0)}%`, 40, 150);
    ctx.font = '600 12px Inter';
    ctx.fillStyle = '#1e3a8a'; ctx.fillText('■ myosin (thick)', 40, 174);
    ctx.fillStyle = '#f59e0b'; ctx.fillText('● actin (thin)', 40, 194);
    ctx.fillStyle = caLevelRef.current > 0.3 ? '#22c55e' : '#06b6d4';
    ctx.fillText('● troponin', 40, 214);
    ctx.fillStyle = state === 'rigor' ? '#dc2626' : exposed ? '#16a34a' : '#94a3b8';
    ctx.fillText('● myosin head', 40, 234);

    if (state === 'rigor') {
      ctx.fillStyle = '#dc2626'; ctx.font = '800 16px Inter'; ctx.textAlign = 'center';
      ctx.fillText('RIGOR — no ATP to detach the heads, so they stay locked', cx, y + 138);
      ctx.textAlign = 'left';
    }
  };

  const drawSarcoplasmicCisternae = (ctx: CanvasRenderingContext2D) => {
    const cx = 640, y = 512;
    ctx.fillStyle = '#fce7f3';
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(cx - 200, y, 400, 56, 12) : ctx.rect(cx - 200, y, 400, 56);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#831843';
    ctx.font = '800 13px Inter';
    ctx.fillText('Sarcoplasmic reticulum — Ca²⁺ store', cx - 190, y + 22);
    // stable Ca²⁺ ions (in store when relaxed, released into sarcoplasm when firing)
    const released = caLevelRef.current > 0.3;
    caIonsRef.current.forEach(ion => {
      const cay = released ? ion.freeY : ion.storedY;
      ctx.beginPath(); ctx.arc(ion.x, cay, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 6px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Ca', ion.x, cay + 2); ctx.textAlign = 'left';
    });
    ctx.fillStyle = '#475569'; ctx.font = '700 12px Inter';
    ctx.fillText(`Ca²⁺ released into sarcoplasm: ${(caLevelRef.current * 100).toFixed(0)}%`, cx - 190, y + 78);
  };

  // bottom step panel — always visible, highlights the current stage
  const drawStepPanel = (ctx: CanvasRenderingContext2D) => {
    const x = 96, y = 610, w = W - 192, h = 120;
    ctx.fillStyle = '#fff1f2'; ctx.strokeStyle = '#fecdd3'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 14, y); ctx.arcTo(x + w, y, x + w, y + h, 14);
    ctx.arcTo(x + w, y + h, x, y + h, 14); ctx.arcTo(x, y + h, x, y, 14);
    ctx.arcTo(x, y, x + w, y, 14); ctx.closePath();
    ctx.fill(); ctx.stroke();

    const shortSteps = ['AP arrives', 'Ca²⁺ released', 'Ca²⁺ binds troponin', 'Cross-bridge forms', 'Power stroke', 'Relax (Ca²⁺ back)'];
    // derive active step
    let active: number;
    if (stepMode) active = stepIdx;
    else if (state === 'rigor') active = 3;
    else if (caLevelRef.current > 0.7) active = 1;
    else if (caLevelRef.current > 0.3) active = contraction > 0.15 ? 4 : 2;
    else if (contraction > 0.1) active = 4;
    else active = 0;

    ctx.fillStyle = '#9f1239'; ctx.font = '700 13px Inter';
    ctx.fillText('Cross-bridge cycle (NCERT §17.2.2):', x + 20, y + 26);
    ctx.fillStyle = '#be185d'; ctx.font = '600 11px Inter';
    ctx.fillText('click a stage to jump to it', x + 250, y + 26);
    const cols = shortSteps.length, cw = (w - 40) / cols;
    shortSteps.forEach((s, i) => {
      const nx = x + 30 + i * cw, on = i === active, done = i < active;
      ctx.fillStyle = on ? '#e11d48' : done ? '#fda4af' : '#e2e8f0';
      if (on) { ctx.shadowColor = '#e11d48'; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(nx, y + 66, 15, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '800 14px Inter'; ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, nx, y + 71);
      ctx.fillStyle = on ? '#9f1239' : '#64748b'; ctx.font = on ? '800 12px Inter' : '600 12px Inter';
      ctx.fillText(s, nx, y + 96);
      ctx.textAlign = 'left';
      if (i < cols - 1) {
        ctx.strokeStyle = done ? '#fb7185' : '#cbd5e1'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(nx + 18, y + 66); ctx.lineTo(nx + cw - 18, y + 66); ctx.stroke();
      }
    });
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Band Measurements</div>
          <div className="text-xs font-semibold text-slate-500">NCERT key: A retains, I shrinks</div>
          <div className="mt-2 text-xs space-y-1.5">
            <div className="flex justify-between"><span>Sarcomere length</span><span className="font-mono">{((1 - contraction * 0.35) * 100).toFixed(0)}%</span></div>
            <div className="flex justify-between"><span>I band</span><span className="font-mono text-rose-600">{((1 - contraction) * 100).toFixed(0)}%</span></div>
            <div className="flex justify-between"><span>A band</span><span className="font-mono text-emerald-600">100% (constant)</span></div>
          </div>
          <div className="mt-3 h-3 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
          </div>
          <div className="mt-1 h-3 bg-rose-100 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 transition-all" style={{ width: `${(1 - contraction) * 100}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Ca²⁺ Concentration</div>
          <div className="mt-2 h-4 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${caLevelRef.current * 100}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-rose-900">Cross-Bridge Cycle</div>
          <div className="text-xs font-semibold text-rose-700 mt-0.5">NCERT §17.2.2</div>
          <ol className="mt-2 text-sm leading-snug text-rose-950 list-decimal pl-5 space-y-0.5">
            <li>AP → Ca²⁺ released into sarcoplasm</li>
            <li>Ca²⁺ binds troponin → unmasks actin</li>
            <li>Myosin head binds actin (ATP-powered)</li>
            <li>Power stroke pulls actin → sarcomere shortens</li>
            <li>New ATP detaches head → cycle repeats</li>
            <li>Ca²⁺ pumped back → troponin re-masks → relax</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="State" value={state} />
            <Cell label="Contraction" value={`${(contraction * 100).toFixed(0)}%`} />
            <Cell label="Ca²⁺ level" value={`${(caLevelRef.current * 100).toFixed(0)}%`} />
            <Cell label="ATP available" value={`${atpLevel}%`} />
            <Cell label="Stim rate" value={`${stimRate} Hz`} />
          </div>
        </div>
      </div>
    </aside>
  );

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} width={W} height={H} onClick={handleCanvasClick} className="absolute inset-0 h-full w-full cursor-pointer" />
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
        <Activity size={18} className="text-rose-600" />
        <h3 className="text-sm font-bold text-slate-800">Sliding Filament Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Stimulation rate</span><span className="font-mono">{stimRate} Hz</span>
          </label>
          <input type="range" min={0.5} max={20} step={0.5} value={stimRate} onChange={e => { setStimRate(parseFloat(e.target.value)); setStepMode(false); }} className="w-full mt-1 accent-rose-600" />
          <p className="text-[10px] text-slate-500">High rate → tetanus (sustained contraction)</p>
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>ATP available</span><span className="font-mono">{atpLevel}%</span>
          </label>
          <input type="range" min={0} max={100} step={5} value={atpLevel} onChange={e => { setAtpLevel(parseInt(e.target.value)); setStepMode(false); }} className="w-full mt-1 accent-amber-600" />
          <p className="text-[10px] text-slate-500">0% = rigor mortis (heads locked)</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={fireTwitch} className="px-3 py-2 text-xs font-bold rounded-md bg-rose-600 text-white">
            <Zap size={12} className="inline mr-1" /> Fire single twitch
          </button>
          <button onClick={() => setStepMode(s => !s)} className={`px-3 py-2 text-xs font-bold rounded-md border ${stepMode ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200'}`}>
            Step mode {stepMode ? 'ON' : 'OFF'}
          </button>
          {stepMode && <button onClick={advanceStep} className="px-3 py-2 text-xs font-bold rounded-md bg-slate-800 text-white">▶ Next step</button>}
        </div>
      </div>
    </div>
  );

  return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsComponent} />;
};

const Cell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-rose-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-extrabold text-rose-700">{value}</div>
  </div>
);

export default SlidingFilamentLab;
