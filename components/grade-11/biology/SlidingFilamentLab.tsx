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

  const advanceStep = () => {
    setStepIdx(i => {
      const next = (i + 1) % 6;
      // sync state to step
      if (next === 0) { setState('rest'); setContraction(0); caLevelRef.current = 0; }
      if (next === 1) { setState('fire'); caLevelRef.current = 1; }
      if (next >= 2) setState('contracting');
      if (next === 3) setContraction(0.3);
      if (next === 4) setContraction(0.5);
      if (next === 5) { setContraction(0); setState('rest'); caLevelRef.current = 0; }
      return next;
    });
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
    ctx.fillText('Sarcomere — Sliding Filament Theory', 30, 40);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §17.2.2 — Ca²⁺ exposes actin sites · ATP powers cross-bridge cycle · A-band retains, I-band shortens', 30, 60);

    drawMotorNeuron(ctx);
    drawSarcomere(ctx);
    drawSarcoplasmicCisternae(ctx);
    drawCascadeSteps(ctx);
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
    const y = 380;
    const fullW = 700;
    const shorten = contraction;
    const sarcoW = fullW * (1 - shorten * 0.35);
    const cx = 640;
    const left = cx - sarcoW / 2;
    const right = cx + sarcoW / 2;

    // Z lines
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(left - 4, y - 70, 6, 140);
    ctx.fillRect(right - 2, y - 70, 6, 140);
    ctx.font = '700 13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Z', left, y - 80);
    ctx.fillText('Z', right, y - 80);

    // thin filaments (actin) from Z lines
    const thinLen = (sarcoW - 100) / 2 + 80;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(left, y - 30); ctx.lineTo(left + thinLen, y - 30);
    ctx.moveTo(left, y + 30); ctx.lineTo(left + thinLen, y + 30);
    ctx.moveTo(right, y - 30); ctx.lineTo(right - thinLen, y - 30);
    ctx.moveTo(right, y + 30); ctx.lineTo(right - thinLen, y + 30);
    ctx.stroke();

    // tropomyosin
    ctx.strokeStyle = state === 'rest' ? '#ec4899' : '#fbcfe8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, y - 27); ctx.lineTo(left + thinLen, y - 27);
    ctx.moveTo(left, y + 33); ctx.lineTo(left + thinLen, y + 33);
    ctx.moveTo(right, y - 27); ctx.lineTo(right - thinLen, y - 27);
    ctx.moveTo(right, y + 33); ctx.lineTo(right - thinLen, y + 33);
    ctx.stroke();

    // troponin
    for (let i = 0; i < 6; i++) {
      const tx = left + 30 + i * 50;
      const ty = y - 27;
      if (tx > left + thinLen - 10) break;
      ctx.beginPath();
      ctx.arc(tx, ty, 4, 0, Math.PI * 2);
      ctx.fillStyle = caLevelRef.current > 0.3 ? '#fbbf24' : '#06b6d4';
      ctx.fill();
    }

    // thick filament (myosin) in centre
    const thickStart = cx - 120;
    const thickEnd = cx + 120;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(thickStart, y); ctx.lineTo(thickEnd, y);
    ctx.stroke();

    // myosin heads
    const exposed = caLevelRef.current > 0.3 && atpLevel > 5;
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const hx = thickStart + t * (thickEnd - thickStart);
      const hy = y + (i % 2 === 0 ? -7 : 7);
      const dir = i % 2 === 0 ? -1 : 1;
      const phase = headPhasesRef.current[i];
      const tilt = exposed ? Math.sin(phase * Math.PI * 2) * 0.4 : 0;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(dir * (Math.PI / 4 + tilt));
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, dir * 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, dir * 24, 6, 0, Math.PI * 2);
      ctx.fillStyle = state === 'rigor' ? '#dc2626' : exposed ? '#16a34a' : '#94a3b8';
      ctx.fill();
      ctx.restore();
    }

    // band labels
    ctx.fillStyle = '#475569';
    ctx.font = '600 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('I band', left + thinLen / 4, y + 80);
    ctx.fillText('A band', cx, y + 80);
    ctx.fillText('I band', right - thinLen / 4, y + 80);
    ctx.textAlign = 'left';

    // band width measurements
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '700 12px Inter';
    ctx.fillText(`A band: ${(thickEnd - thickStart).toFixed(0)} px (unchanged)`, 30, 280);
    ctx.fillText(`I band: ${((sarcoW - (thickEnd - thickStart)) / 2).toFixed(0)} px (shrinks!)`, 30, 300);
    ctx.fillText(`Sarcomere: ${sarcoW.toFixed(0)} px → ${(shorten * 100).toFixed(0)}% contracted`, 30, 320);

    if (state === 'rigor') {
      ctx.fillStyle = '#dc2626';
      ctx.font = '800 16px Inter';
      ctx.fillText('💀 RIGOR MORTIS — no ATP to break cross-bridges', 30, 250);
    }
  };

  const drawSarcoplasmicCisternae = (ctx: CanvasRenderingContext2D) => {
    const cx = 640, y = 540;
    ctx.fillStyle = '#fce7f3';
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 200, y, 400, 60);
    ctx.strokeRect(cx - 200, y, 400, 60);
    ctx.fillStyle = '#831843';
    ctx.font = '700 12px Inter';
    ctx.fillText('Sarcoplasmic cisternae (Ca²⁺ store)', cx - 190, y + 20);
    // Ca ions
    const out = caLevelRef.current;
    for (let i = 0; i < 14; i++) {
      const r = Math.random();
      const cax = cx - 180 + i * 28;
      const cay = out > 0.3 ? y - 30 - Math.random() * 50 : y + 30 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(cax, cay, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = '#475569';
    ctx.font = '500 11px Inter';
    ctx.fillText(`Ca²⁺ in sarcoplasm: ${(caLevelRef.current * 100).toFixed(0)}%`, cx - 180, y + 90);
  };

  const drawCascadeSteps = (ctx: CanvasRenderingContext2D) => {
    if (!stepMode) return;
    const steps = ['Resting', 'AP arrives + Ca²⁺ release', 'Ca²⁺ binds troponin', 'Cross-bridges form', 'Power stroke (sliding)', 'Relaxation (Ca²⁺ pumped back)'];
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#475569';
    ctx.fillRect(1020, 200, 240, 250);
    ctx.strokeRect(1020, 200, 240, 250);
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 13px Inter';
    ctx.fillText('NCERT step-by-step', 1035, 220);
    for (let i = 0; i < steps.length; i++) {
      const y = 245 + i * 32;
      const active = stepIdx === i;
      ctx.fillStyle = active ? '#0ea5e9' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(1040, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = active ? '#0c4a6e' : '#64748b';
      ctx.font = active ? '700 11px Inter' : '500 11px Inter';
      ctx.fillText(`${i + 1}. ${steps[i]}`, 1055, y + 4);
    }
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
        <Activity size={18} className="text-rose-600" />
        <h3 className="text-sm font-bold text-slate-800">Sliding Filament Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Stimulation rate</span><span className="font-mono">{stimRate} Hz</span>
          </label>
          <input type="range" min={0.5} max={20} step={0.5} value={stimRate} onChange={e => setStimRate(parseFloat(e.target.value))} className="w-full mt-1 accent-rose-600" />
          <p className="text-[10px] text-slate-500">High rate → tetanus (sustained contraction)</p>
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>ATP available</span><span className="font-mono">{atpLevel}%</span>
          </label>
          <input type="range" min={0} max={100} step={5} value={atpLevel} onChange={e => setAtpLevel(parseInt(e.target.value))} className="w-full mt-1 accent-amber-600" />
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
