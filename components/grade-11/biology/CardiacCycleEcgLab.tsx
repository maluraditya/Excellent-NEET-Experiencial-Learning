import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, HeartPulse, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface CardiacCycleEcgLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Scenario = 'rest' | 'exercise' | 'sleep' | 'avblock';

const SCENARIO_META: Record<Scenario, { label: string; bpm: number; sv: number }> = {
  rest:     { label: 'Resting',  bpm: 72,  sv: 70  },
  exercise: { label: 'Exercise', bpm: 150, sv: 95  },
  sleep:    { label: 'Sleep',    bpm: 55,  sv: 65  },
  avblock:  { label: 'AV Block', bpm: 72,  sv: 70  },
};

// ECG phases in fraction of cycle
// P: 0.05-0.13, QRS: 0.20-0.28, T: 0.40-0.55
const phaseAt = (t: number): 'p' | 'pq' | 'qrs' | 'st' | 't' | 'rest' => {
  if (t < 0.05) return 'rest';
  if (t < 0.13) return 'p';
  if (t < 0.20) return 'pq';
  if (t < 0.28) return 'qrs';
  if (t < 0.40) return 'st';
  if (t < 0.55) return 't';
  return 'rest';
};

const CardiacCycleEcgLab: React.FC<CardiacCycleEcgLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const cycleRef = useRef<number>(0); // 0..1
  const ecgTraceRef = useRef<number[]>([]); // y values
  const beatCountRef = useRef<number>(0);

  const [paused, setPaused] = useState(false);
  const [scenario, setScenario] = useState<Scenario>('rest');
  const [bpm, setBpm] = useState(72);
  const [sv, setSv] = useState(70);
  const [showEcg, setShowEcg] = useState(true);
  const [showSounds, setShowSounds] = useState(true);
  const [stepMode, setStepMode] = useState(false);
  const [stepPhase, setStepPhase] = useState(0);
  const [beats, setBeats] = useState(0);

  // sync bpm/sv with scenario
  useEffect(() => {
    setBpm(SCENARIO_META[scenario].bpm);
    setSv(SCENARIO_META[scenario].sv);
  }, [scenario]);

  const handleReset = useCallback(() => {
    cycleRef.current = 0;
    ecgTraceRef.current = [];
    beatCountRef.current = 0;
    setBeats(0);
    setStepPhase(0);
  }, []);

  const co = (bpm * sv) / 1000; // L/min

  useEffect(() => {
    const tick = (now: number) => {
      const dt = Math.min(60, now - (lastRef.current || now));
      lastRef.current = now;
      if (!paused && !stepMode) step(dt / 1000);
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, scenario, bpm, sv, showEcg, showSounds, stepMode, stepPhase]);

  const step = (dt: number) => {
    const period = 60 / bpm;
    const prev = cycleRef.current;
    cycleRef.current = (prev + dt / period) % 1;
    if (prev > 0.95 && cycleRef.current < 0.05) {
      beatCountRef.current += 1;
      setBeats(beatCountRef.current);
    }
    // sample ECG
    const t = cycleRef.current;
    let v = 0;
    if (scenario !== 'avblock' || t < 0.20) {
      if (t > 0.05 && t < 0.13) v = Math.sin(((t - 0.05) / 0.08) * Math.PI) * 0.15;
      if (scenario !== 'avblock') {
        if (t > 0.20 && t < 0.22) v = -(t - 0.20) / 0.02 * 0.3;
        else if (t > 0.22 && t < 0.25) v = -0.3 + ((t - 0.22) / 0.03) * 1.2;
        else if (t > 0.25 && t < 0.28) v = 0.9 - ((t - 0.25) / 0.03) * 1.1;
        else if (t > 0.40 && t < 0.55) v = Math.sin(((t - 0.40) / 0.15) * Math.PI) * 0.3;
      }
    }
    ecgTraceRef.current.push(v);
    if (ecgTraceRef.current.length > 1200) ecgTraceRef.current.shift();
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const t = stepMode ? stepPhase : cycleRef.current;

    // ECG trace at top
    if (showEcg) drawEcg(ctx, t);

    // heart in centre
    drawHeart(ctx, 640, 460, t);

    // phase indicator
    drawPhaseStrip(ctx, t);

    // heart sounds indicator
    if (showSounds) drawSounds(ctx, t);

    // banner
    ctx.fillStyle = '#475569';
    ctx.font = '600 12px Inter';
    ctx.fillText('NCERT §15.3.2-3 — Cardiac cycle 0.8s · SV 70 mL · CO ~5 L/min · lub (AV close) / dub (semilunar close)', 30, H - 20);
  };

  const drawEcg = (ctx: CanvasRenderingContext2D, t: number) => {
    const x0 = 50, y0 = 110, w = W - 100, h = 110;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeRect(x0, y0, w, h);
    // grid
    for (let i = 0; i < w; i += 40) {
      ctx.beginPath();
      ctx.moveTo(x0 + i, y0);
      ctx.lineTo(x0 + i, y0 + h);
      ctx.strokeStyle = '#fee2e2';
      ctx.stroke();
    }
    // trace
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const trace = ecgTraceRef.current;
    for (let i = 0; i < trace.length; i++) {
      const px = x0 + (i / 1200) * w;
      const py = y0 + h / 2 - trace[i] * 50;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // labels
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '700 14px Inter';
    ctx.fillText('ECG trace (Lead II)', x0 + 10, y0 - 5);
    // current phase label
    const p = phaseAt(t);
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 12px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(`Phase: ${p.toUpperCase()}`, x0 + w - 10, y0 - 5);
    ctx.textAlign = 'left';
  };

  const drawHeart = (ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) => {
    const p = phaseAt(t);
    const atriaContract = p === 'p' || p === 'pq';
    const ventContract = p === 'qrs' || p === 'st';

    // heart outline
    ctx.fillStyle = '#fef2f2';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 200, cy - 100);
    ctx.bezierCurveTo(cx - 220, cy - 50, cx - 210, cy + 120, cx - 80, cy + 180);
    ctx.lineTo(cx + 80, cy + 180);
    ctx.bezierCurveTo(cx + 210, cy + 120, cx + 220, cy - 50, cx + 200, cy - 100);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // septum
    ctx.beginPath();
    ctx.moveTo(cx, cy - 100);
    ctx.lineTo(cx, cy + 175);
    ctx.stroke();

    // atria (top half)
    const atriaY = cy - 30;
    const atriaScale = atriaContract ? 0.85 : 1;
    ctx.save();
    ctx.translate(cx, atriaY);
    ctx.scale(atriaScale, atriaScale);
    ctx.fillStyle = atriaContract ? '#fca5a5' : '#fecaca';
    ctx.fillRect(-180, -60, 180, 90);
    ctx.fillRect(0, -60, 180, 90);
    ctx.strokeStyle = '#991b1b';
    ctx.strokeRect(-180, -60, 180, 90);
    ctx.strokeRect(0, -60, 180, 90);
    ctx.fillStyle = '#7f1d1d';
    ctx.font = '700 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Right Atrium', -90, -25);
    ctx.fillText('Left Atrium', 90, -25);
    ctx.restore();

    // ventricles (bottom half)
    const ventScale = ventContract ? 0.75 : 1;
    ctx.save();
    ctx.translate(cx, cy + 80);
    ctx.scale(1, ventScale);
    ctx.fillStyle = ventContract ? '#dc2626' : '#fca5a5';
    ctx.fillRect(-160, -30, 160, 100);
    ctx.fillRect(0, -30, 160, 100);
    ctx.strokeStyle = '#7f1d1d';
    ctx.strokeRect(-160, -30, 160, 100);
    ctx.strokeRect(0, -30, 160, 100);
    ctx.fillStyle = '#fff';
    ctx.font = '700 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Right Ventricle', -80, 25);
    ctx.fillText('Left Ventricle', 80, 25);
    ctx.restore();

    // SAN
    ctx.beginPath();
    ctx.arc(cx - 130, cy - 80, 8, 0, Math.PI * 2);
    ctx.fillStyle = atriaContract ? '#fbbf24' : '#fde68a';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = atriaContract ? 16 : 4;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#a16207';
    ctx.stroke();
    ctx.fillStyle = '#854d0e';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('SAN', cx - 125, cy - 92);

    // AVN
    ctx.beginPath();
    ctx.arc(cx - 20, cy + 20, 7, 0, Math.PI * 2);
    ctx.fillStyle = (p === 'pq' || p === 'qrs') && scenario !== 'avblock' ? '#dc2626' : '#fecaca';
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.stroke();
    ctx.fillStyle = '#7f1d1d';
    ctx.fillText('AVN', cx - 14, cy + 26);

    // AV block X-mark
    if (scenario === 'avblock') {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 35, cy + 5);
      ctx.lineTo(cx - 5, cy + 35);
      ctx.moveTo(cx - 5, cy + 5);
      ctx.lineTo(cx - 35, cy + 35);
      ctx.stroke();
    }
  };

  const drawPhaseStrip = (ctx: CanvasRenderingContext2D, t: number) => {
    const x0 = 50, y0 = 660, w = W - 100, h = 30;
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeRect(x0, y0, w, h);
    // segments
    const phases = [
      { label: 'rest', start: 0,    end: 0.05, color: '#e2e8f0' },
      { label: 'P (atrial)', start: 0.05, end: 0.20, color: '#fef3c7' },
      { label: 'QRS (vent)', start: 0.20, end: 0.40, color: '#fecaca' },
      { label: 'T (relax)',  start: 0.40, end: 0.55, color: '#dbeafe' },
      { label: 'diastole',   start: 0.55, end: 1.0,  color: '#dcfce7' },
    ];
    for (const ph of phases) {
      ctx.fillStyle = ph.color;
      ctx.fillRect(x0 + ph.start * w, y0, (ph.end - ph.start) * w, h);
      ctx.fillStyle = '#475569';
      ctx.font = '600 10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(ph.label, x0 + (ph.start + ph.end) / 2 * w, y0 + 18);
    }
    // current cycle position
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x0 + t * w - 1, y0 - 4, 3, h + 8);
    ctx.textAlign = 'left';
  };

  const drawSounds = (ctx: CanvasRenderingContext2D, t: number) => {
    const x0 = 50, y0 = 250;
    const lub = t > 0.20 && t < 0.24;
    const dub = t > 0.40 && t < 0.44;
    if (lub) {
      ctx.fillStyle = 'rgba(220, 38, 38, 0.8)';
      ctx.font = '900 36px Inter';
      ctx.fillText('🔊 LUB', x0, y0);
    }
    if (dub) {
      ctx.fillStyle = 'rgba(124, 58, 237, 0.8)';
      ctx.font = '900 36px Inter';
      ctx.fillText('🔊 DUB', x0 + 130, y0);
    }
  };

  const advancePhase = () => {
    setStepPhase(p => (p + 0.07) % 1);
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">P-QRS-T Mapping</div>
          <div className="text-xs font-semibold text-slate-500">NCERT §15.3.3</div>
          <ul className="mt-2 text-sm leading-snug space-y-1.5">
            <li><b className="text-amber-700">P wave</b> — atrial depolarisation → atrial contraction</li>
            <li><b className="text-rose-700">QRS complex</b> — ventricular depolarisation → start of systole</li>
            <li><b className="text-blue-700">T wave</b> — ventricular repolarisation → end of systole</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Cardiac Output</div>
          <div className="text-xs font-semibold text-slate-500">CO = SV × HR</div>
          <div className="mt-2 font-mono text-2xl font-extrabold text-rose-600">{co.toFixed(2)} L/min</div>
          <div className="text-[11px] text-slate-500 mt-1">{sv} mL × {bpm} bpm</div>
          <div className="mt-2 text-[11px] text-slate-600 italic">NCERT: ~5 L/min healthy adult</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Heart Sounds</div>
          <ul className="mt-2 text-xs space-y-1">
            <li><b>LUB</b> — tricuspid + bicuspid valves close (start of systole)</li>
            <li><b>DUB</b> — semilunar valves close (start of diastole)</li>
          </ul>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-rose-900">Cardiac Cycle</div>
          <div className="text-xs font-semibold text-rose-700 mt-0.5">NCERT §15.3.2</div>
          <p className="text-sm text-rose-950 mt-2 leading-snug">
            SAN fires → atria contract → blood to ventricles → ventricles contract → blood ejected via pulmonary artery/aorta → ventricles relax → joint diastole → SAN fires again. Duration: <b>0.8 s</b>.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Heart rate" value={`${bpm} bpm`} />
            <Cell label="Stroke volume" value={`${sv} mL`} />
            <Cell label="Cardiac output" value={`${co.toFixed(2)} L/min`} />
            <Cell label="Cycle duration" value={`${(60 / bpm).toFixed(2)} s`} />
            <Cell label="Beats counted" value={beats} />
            <Cell label="Current phase" value={phaseAt(stepMode ? stepPhase : cycleRef.current).toUpperCase()} />
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
        <HeartPulse size={18} className="text-rose-600" />
        <h3 className="text-sm font-bold text-slate-800">Cardiac Cycle & ECG Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Scenario</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(Object.keys(SCENARIO_META) as Scenario[]).map(s => (
              <button key={s} onClick={() => setScenario(s)} className={`px-2.5 py-1.5 text-xs font-bold rounded-md ${scenario === s ? 'bg-white text-rose-700 shadow' : 'text-slate-600'}`}>
                {SCENARIO_META[s].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Heart rate</span><span className="font-mono">{bpm} bpm</span>
          </label>
          <input type="range" min={40} max={180} step={1} value={bpm} onChange={e => setBpm(parseInt(e.target.value))} className="w-full mt-1 accent-rose-600" />
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Stroke volume</span><span className="font-mono">{sv} mL</span>
          </label>
          <input type="range" min={40} max={120} step={1} value={sv} onChange={e => setSv(parseInt(e.target.value))} className="w-full mt-1 accent-amber-600" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <input type="checkbox" checked={showEcg} onChange={e => setShowEcg(e.target.checked)} /> ECG trace
          </label>
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <input type="checkbox" checked={showSounds} onChange={e => setShowSounds(e.target.checked)} /> Heart sounds
          </label>
          <button onClick={() => setStepMode(s => !s)} className={`px-3 py-1 text-xs font-bold rounded-md border ${stepMode ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200'}`}>Step {stepMode ? 'ON' : 'OFF'}</button>
          {stepMode && <button onClick={advancePhase} className="px-3 py-1 text-xs font-bold rounded-md bg-slate-800 text-white">▶ Next</button>}
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

export default CardiacCycleEcgLab;
