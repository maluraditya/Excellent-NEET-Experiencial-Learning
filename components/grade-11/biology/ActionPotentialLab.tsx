import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ActionPotentialLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Block = 'none' | 'na' | 'k' | 'pump';

// Axon segments along x: each tracks state (-70 = resting, +30 = depolarised, undershoot to -80, refractory)
const SEGMENTS = 60;
const AXON_X0 = 100;
const AXON_X1 = 1180;
const AXON_Y = 420;

interface AP { startTime: number; pos: number /* segment index */ }

const ActionPotentialLab: React.FC<ActionPotentialLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const tRef = useRef<number>(0);
  const apsRef = useRef<AP[]>([]);
  const traceRef = useRef<number[]>([]);
  const segStateRef = useRef<number[]>(Array(SEGMENTS).fill(-70));
  const refractRef = useRef<number[]>(Array(SEGMENTS).fill(0));

  const [paused, setPaused] = useState(false);
  const [block, setBlock] = useState<Block>('none');
  const [pumpActive, setPumpActive] = useState(true);
  const [myelin, setMyelin] = useState(false);
  const [probeSeg, setProbeSeg] = useState(40); // probe location
  const [stimStrength, setStimStrength] = useState(100); // %
  const [apCount, setApCount] = useState(0);

  const handleReset = useCallback(() => {
    apsRef.current = [];
    traceRef.current = [];
    segStateRef.current = Array(SEGMENTS).fill(-70);
    refractRef.current = Array(SEGMENTS).fill(0);
    tRef.current = 0;
    setApCount(0);
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
  }, [paused, block, pumpActive, myelin, probeSeg, stimStrength]);

  const step = (dt: number) => {
    tRef.current += dt;
    // pump degradation if disabled
    if (!pumpActive) {
      // resting potential drifts toward 0 over time
      for (let i = 0; i < SEGMENTS; i++) {
        if (refractRef.current[i] <= 0 && segStateRef.current[i] === -70) {
          segStateRef.current[i] = Math.min(0, segStateRef.current[i] + dt * 6);
        }
      }
    }

    // propagate APs
    const speed = myelin ? 80 : 25; // segments per second
    const newAps: AP[] = [];
    for (const ap of apsRef.current) {
      const dPos = speed * dt;
      const newPos = ap.pos + dPos;
      // light up segments along the way
      const startSeg = Math.floor(ap.pos);
      const endSeg = Math.floor(newPos);
      for (let s = startSeg; s <= endSeg && s < SEGMENTS; s++) {
        if (refractRef.current[s] > 0) continue;
        if (block === 'na') continue; // can't depolarise
        segStateRef.current[s] = 30;
        refractRef.current[s] = 0.4;
      }
      if (newPos < SEGMENTS) newAps.push({ ...ap, pos: newPos });
    }
    apsRef.current = newAps;

    // refractory decay and repolarisation
    for (let i = 0; i < SEGMENTS; i++) {
      if (refractRef.current[i] > 0) {
        refractRef.current[i] -= dt;
        if (refractRef.current[i] <= 0) {
          // repolarise (unless K+ blocked)
          if (block !== 'k') {
            segStateRef.current[i] = -70;
          } else {
            // stays high (no K+ efflux)
            segStateRef.current[i] = 20;
          }
        } else {
          // smooth transition
          const phase = refractRef.current[i] / 0.4;
          segStateRef.current[i] = block === 'k' ? 20 : (30 * phase + (-70) * (1 - phase));
        }
      }
    }

    // sample voltage at probe
    traceRef.current.push(segStateRef.current[probeSeg]);
    if (traceRef.current.length > 600) traceRef.current.shift();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (y > AXON_Y - 40 && y < AXON_Y + 40) {
      const seg = Math.floor(((x - AXON_X0) / (AXON_X1 - AXON_X0)) * SEGMENTS);
      if (seg >= 0 && seg < SEGMENTS) {
        const threshold = stimStrength >= 50;
        if (threshold) {
          apsRef.current.push({ startTime: tRef.current, pos: seg });
          setApCount(c => c + 1);
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

    ctx.fillStyle = '#1e293b';
    ctx.font = '700 18px Inter';
    ctx.fillText('Axon — Action Potential Generation & Conduction', 30, 40);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §18.3.1 — Click axon to fire AP · 3 Na⁺ out / 2 K⁺ in via Na-K pump · Na⁺ influx depolarises, K⁺ efflux repolarises', 30, 60);

    // voltage trace top
    drawVoltageTrace(ctx);

    // axon
    drawAxon(ctx);

    // pump animation
    drawPump(ctx);

    // status
    drawStatus(ctx);
  };

  const drawVoltageTrace = (ctx: CanvasRenderingContext2D) => {
    const x0 = 80, y0 = 100, w = W - 160, h = 130;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeRect(x0, y0, w, h);
    // zero line
    const zeroY = y0 + h * 0.4;
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x0, zeroY);
    ctx.lineTo(x0 + w, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
    // resting line at -70 mV
    const restY = y0 + h * 0.78;
    ctx.strokeStyle = '#a3a3a3';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(x0, restY);
    ctx.lineTo(x0 + w, restY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#475569';
    ctx.font = '600 10px Inter';
    ctx.fillText('+30 mV', x0 - 50, y0 + 10);
    ctx.fillText('0', x0 - 18, zeroY + 4);
    ctx.fillText('-70 mV', x0 - 50, restY + 4);
    // trace
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const trace = traceRef.current;
    for (let i = 0; i < trace.length; i++) {
      const px = x0 + (i / 600) * w;
      const v = trace[i]; // -70..+30
      const py = y0 + h * (1 - (v + 80) / 110) * 0.9 + h * 0.05;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '700 14px Inter';
    ctx.fillText(`Voltage at probe (segment ${probeSeg})`, x0 + 10, y0 - 5);
  };

  const drawAxon = (ctx: CanvasRenderingContext2D) => {
    // axon body
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 60;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(AXON_X0, AXON_Y);
    ctx.lineTo(AXON_X1, AXON_Y);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // myelin nodes
    if (myelin) {
      const nodeSpacing = 8;
      for (let i = nodeSpacing; i < SEGMENTS; i += nodeSpacing) {
        const x = AXON_X0 + (i / SEGMENTS) * (AXON_X1 - AXON_X0);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - 3, AXON_Y - 35, 6, 70);
      }
      // myelin sheaths
      for (let i = 0; i < SEGMENTS; i += nodeSpacing) {
        const x = AXON_X0 + (i / SEGMENTS) * (AXON_X1 - AXON_X0);
        const xNext = AXON_X0 + (Math.min(SEGMENTS, i + nodeSpacing - 1) / SEGMENTS) * (AXON_X1 - AXON_X0);
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1.5;
        ctx.fillRect(x + 4, AXON_Y - 28, xNext - x - 8, 56);
        ctx.strokeRect(x + 4, AXON_Y - 28, xNext - x - 8, 56);
      }
    }

    // segment polarity colour
    for (let i = 0; i < SEGMENTS; i++) {
      const x0 = AXON_X0 + (i / SEGMENTS) * (AXON_X1 - AXON_X0);
      const wSeg = (AXON_X1 - AXON_X0) / SEGMENTS;
      const v = segStateRef.current[i];
      const t = (v + 80) / 110; // 0..1
      const r = Math.round(180 + t * 60);
      const g = Math.round(180 - t * 100);
      const b = Math.round(220 - t * 100);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
      ctx.fillRect(x0, AXON_Y - 28, wSeg, 56);
    }

    // ion particles (Na+ outside, K+ inside)
    for (let i = 0; i < 30; i++) {
      const x = AXON_X0 + Math.random() * (AXON_X1 - AXON_X0);
      // Na+ outside (above axon)
      ctx.beginPath();
      ctx.arc(x, AXON_Y - 50 - Math.random() * 30, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#0ea5e9';
      ctx.fill();
      // K+ inside (we'll show some)
      if (i < 15) {
        ctx.beginPath();
        ctx.arc(x, AXON_Y + 10 + Math.random() * 15, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
      }
    }

    // probe marker
    const probeX = AXON_X0 + (probeSeg / SEGMENTS) * (AXON_X1 - AXON_X0);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(probeX, AXON_Y - 50);
    ctx.lineTo(probeX, AXON_Y + 50);
    ctx.stroke();
    ctx.fillStyle = '#7c3aed';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('probe', probeX, AXON_Y - 55);
    ctx.textAlign = 'left';
  };

  const drawPump = (ctx: CanvasRenderingContext2D) => {
    const x = 1200, y = 540;
    ctx.fillStyle = pumpActive ? '#dcfce7' : '#fee2e2';
    ctx.strokeStyle = pumpActive ? '#16a34a' : '#dc2626';
    ctx.lineWidth = 2;
    ctx.fillRect(x - 80, y - 30, 160, 60);
    ctx.strokeRect(x - 80, y - 30, 160, 60);
    ctx.fillStyle = pumpActive ? '#14532d' : '#7f1d1d';
    ctx.font = '700 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Na-K Pump', x, y - 10);
    ctx.font = '600 11px Inter';
    ctx.fillText(pumpActive ? '3 Na⁺ out / 2 K⁺ in' : '⛔ DISABLED', x, y + 8);
    ctx.textAlign = 'left';
  };

  const drawStatus = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#475569';
    ctx.font = '600 12px Inter';
    let msg = `${apCount} APs fired · Conduction velocity ${myelin ? 'fast (saltatory)' : 'slow (continuous)'}`;
    if (block === 'na') msg += ' · ⛔ Na⁺ channels blocked — no AP possible';
    if (block === 'k') msg += ' · ⛔ K⁺ channels blocked — no repolarisation';
    if (!pumpActive) msg += ' · ⚠ Na-K pump off — gradients draining';
    ctx.fillText(msg, 30, H - 30);
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Phase Map</div>
          <ul className="mt-2 text-xs space-y-1">
            <li><b className="text-cyan-700">Resting</b> — Na-K pump maintains polarity (~-70 mV)</li>
            <li><b className="text-rose-700">Depolarisation</b> — Na⁺ rushes in (+30 mV)</li>
            <li><b className="text-amber-700">Repolarisation</b> — K⁺ rushes out</li>
            <li><b className="text-slate-700">Refractory</b> — recovery period</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Ion Distribution</div>
          <div className="mt-2 text-xs space-y-1">
            <div className="flex justify-between"><span><span className="text-sky-600">●</span> Na⁺</span><span>High outside, low inside</span></div>
            <div className="flex justify-between"><span><span className="text-amber-600">●</span> K⁺</span><span>Low outside, high inside</span></div>
            <div className="flex justify-between"><span>Negative proteins</span><span>Only inside</span></div>
          </div>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-cyan-900">Action Potential</div>
          <div className="text-xs font-semibold text-cyan-700 mt-0.5">NCERT §18.3.1</div>
          <p className="text-sm text-cyan-950 mt-2 leading-snug">
            Stimulus makes membrane freely permeable to Na⁺ → influx → polarity reverses → AP. Sequence repeats along axon → impulse conducted. K⁺ efflux restores resting potential.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Probe voltage" value={`${segStateRef.current[probeSeg]?.toFixed(0) ?? -70} mV`} />
            <Cell label="APs fired" value={apCount} />
            <Cell label="Conduction" value={myelin ? 'Saltatory (fast)' : 'Continuous (slow)'} />
            <Cell label="Na-K pump" value={pumpActive ? 'Active' : 'Disabled'} />
            <Cell label="Channel block" value={block} />
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
        <Zap size={18} className="text-cyan-600" />
        <h3 className="text-sm font-bold text-slate-800">Action Potential Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Stimulus strength</span><span className="font-mono">{stimStrength}%</span>
          </label>
          <input type="range" min={0} max={100} step={5} value={stimStrength} onChange={e => setStimStrength(parseInt(e.target.value))} className="w-full mt-1 accent-cyan-600" />
          <p className="text-[10px] text-slate-500">≥50% = threshold (all-or-none)</p>
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Probe location</span><span className="font-mono">seg {probeSeg}</span>
          </label>
          <input type="range" min={0} max={SEGMENTS - 1} step={1} value={probeSeg} onChange={e => setProbeSeg(parseInt(e.target.value))} className="w-full mt-1 accent-violet-600" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Channel block</label>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(['none', 'na', 'k'] as Block[]).map(b => (
              <button key={b} onClick={() => setBlock(b)} className={`px-2.5 py-1 text-[11px] font-bold rounded-md border ${block === b ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-slate-200'}`}>
                {b === 'none' ? 'None' : b === 'na' ? '⛔ Na⁺' : '⛔ K⁺'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <input type="checkbox" checked={pumpActive} onChange={e => setPumpActive(e.target.checked)} /> Na-K pump
          </label>
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <input type="checkbox" checked={myelin} onChange={e => setMyelin(e.target.checked)} /> Myelin sheath (saltatory)
          </label>
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-2 italic">Click anywhere on the axon to fire an action potential (if stimulus ≥ threshold).</p>
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

export default ActionPotentialLab;
