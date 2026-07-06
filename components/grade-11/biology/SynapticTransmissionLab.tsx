import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import SynapticTransmissionInfographic from './infographics/SynapticTransmissionInfographic';

interface SynapticTransmissionLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type SynapseType = 'chemical' | 'electrical';
type NtType = 'excitatory' | 'inhibitory';

interface Vesicle { x: number; y: number; state: 'pool' | 'docking' | 'fused' | 'recycling' }
interface NtMol { x: number; y: number; vx: number; bound: boolean; age: number }

const SynapticTransmissionLab: React.FC<SynapticTransmissionLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const vesiclesRef = useRef<Vesicle[]>([]);
  const ntsRef = useRef<NtMol[]>([]);
  const tRef = useRef(0);
  const lastApRef = useRef(0);
  const traceRef = useRef<number[]>([]);
  const postPotentialRef = useRef(-70);

  const [paused, setPaused] = useState(false);
  const [synapseType, setSynapseType] = useState<SynapseType>('chemical');
  const [ntType, setNtType] = useState<NtType>('excitatory');
  const [firingFreq, setFiringFreq] = useState(1); // Hz
  const [vesiclePool, setVesiclePool] = useState(20);
  const [reuptake, setReuptake] = useState(true);
  const [stepMode, setStepMode] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [vesiclesReady, setVesiclesReady] = useState(0);
  const [boundReceptors, setBoundReceptors] = useState(0);

  // init vesicles
  useEffect(() => {
    const arr: Vesicle[] = [];
    for (let i = 0; i < vesiclePool; i++) {
      arr.push({
        x: 200 + Math.random() * 200,
        y: 200 + Math.random() * 130,
        state: 'pool',
      });
    }
    vesiclesRef.current = arr;
    setVesiclesReady(vesiclePool);
  }, [vesiclePool]);

  const handleReset = useCallback(() => {
    ntsRef.current = [];
    traceRef.current = [];
    tRef.current = 0;
    lastApRef.current = 0;
    postPotentialRef.current = -70;
    setStepIdx(0);
    setBoundReceptors(0);
    // reset vesicles
    for (const v of vesiclesRef.current) v.state = 'pool';
  }, []);

  const fireAp = () => {
    lastApRef.current = tRef.current;
    if (synapseType === 'chemical') {
      // pick 3 vesicles from pool to dock
      let docked = 0;
      for (const v of vesiclesRef.current) {
        if (v.state === 'pool' && docked < 3) {
          v.state = 'docking';
          docked++;
        }
      }
    } else {
      // electrical synapse — instant post-synaptic response
      postPotentialRef.current = ntType === 'excitatory' ? 20 : -90;
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
  }, [paused, synapseType, ntType, firingFreq, reuptake, stepMode]);

  const step = (dt: number) => {
    tRef.current += dt;
    if (stepMode) return;

    // auto-fire APs
    if (tRef.current - lastApRef.current > 1 / firingFreq) {
      fireAp();
    }

    // move docking vesicles to membrane
    for (const v of vesiclesRef.current) {
      if (v.state === 'docking') {
        const targetY = 320;
        const targetX = 350 + (v.x - 300) * 0.3;
        v.x += (targetX - v.x) * dt * 4;
        v.y += (targetY - v.y) * dt * 4;
        if (Math.abs(v.y - targetY) < 5) {
          v.state = 'fused';
          // release NTs
          for (let i = 0; i < 8; i++) {
            ntsRef.current.push({
              x: v.x,
              y: v.y + 5,
              vx: 80 + Math.random() * 40,
              bound: false,
              age: 0,
            });
          }
        }
      } else if (v.state === 'fused') {
        // recycle
        v.state = 'recycling';
        v.x = 200 + Math.random() * 200;
        v.y = 200 + Math.random() * 130;
        setTimeout(() => { v.state = 'pool'; }, 800);
      }
    }

    // NTs cross cleft and bind receptors
    const cleftEnd = 850;
    const surviving: NtMol[] = [];
    let bound = 0;
    for (const nt of ntsRef.current) {
      nt.age += dt;
      if (!nt.bound) {
        nt.x += nt.vx * dt;
        if (nt.x > cleftEnd) {
          // try to bind a receptor
          if (Math.random() < 0.6) {
            nt.bound = true;
            nt.x = cleftEnd;
            nt.y = 300 + Math.floor(Math.random() * 6) * 22;
          } else {
            // bounce back / drift
            nt.vx = -nt.vx * 0.5;
          }
        }
      } else {
        bound++;
        if (reuptake && nt.age > 1.5) continue; // re-uptake removes it
      }
      if (nt.age < 5) surviving.push(nt);
    }
    ntsRef.current = surviving;
    setBoundReceptors(bound);

    // post-synaptic potential
    const target = ntType === 'excitatory' ? -70 + bound * 8 : -70 - bound * 4;
    postPotentialRef.current += (target - postPotentialRef.current) * dt * 4;

    // ready vesicles
    setVesiclesReady(vesiclesRef.current.filter(v => v.state === 'pool').length);

    // trace
    traceRef.current.push(postPotentialRef.current);
    if (traceRef.current.length > 600) traceRef.current.shift();
  };

  const advanceStep = () => {
    setStepIdx(i => (i + 1) % 6);
    // sync visuals
    if (stepIdx === 0) fireAp();
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
    ctx.fillText('Synaptic Transmission — pre + post neuron + cleft', 30, 40);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §18.3.2 — Chemical synapse: AP → Ca²⁺ → vesicle fusion → NT release → receptor binding → EPSP/IPSP', 30, 60);

    drawPreSynapticTerminal(ctx);
    drawCleft(ctx);
    drawPostSynaptic(ctx);
    drawPotentialTrace(ctx);
  };

  const drawPreSynapticTerminal = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#dbeafe';
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(350, 320, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '700 13px Inter';
    ctx.fillText('Pre-synaptic terminal', 240, 160);
    // vesicles
    for (const v of vesiclesRef.current) {
      ctx.beginPath();
      ctx.arc(v.x, v.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = v.state === 'fused' ? 'rgba(248, 113, 113, 0.4)' : v.state === 'docking' ? '#f59e0b' : '#86efac';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();
      // NT dots inside
      if (v.state === 'pool' || v.state === 'docking') {
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(v.x + (i % 2 - 0.5) * 3, v.y + (Math.floor(i / 2) - 0.5) * 3, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#0c4a6e';
          ctx.fill();
        }
      }
    }
    // Ca channels at membrane
    const apRecent = tRef.current - lastApRef.current < 0.3;
    for (let i = 0; i < 5; i++) {
      const cx = 320 + i * 30;
      ctx.beginPath();
      ctx.arc(cx, 510, 5, 0, Math.PI * 2);
      ctx.fillStyle = apRecent ? '#f59e0b' : '#cbd5e1';
      ctx.fill();
    }
    ctx.fillStyle = '#475569';
    ctx.font = '500 10px Inter';
    ctx.fillText('Ca²⁺ channels', 300, 535);
  };

  const drawCleft = (ctx: CanvasRenderingContext2D) => {
    if (synapseType === 'chemical') {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(540, 230, 280, 320);
      ctx.strokeStyle = '#a16207';
      ctx.strokeRect(540, 230, 280, 320);
      ctx.fillStyle = '#92400e';
      ctx.font = '700 13px Inter';
      ctx.fillText('Synaptic cleft', 600, 250);
      // NTs
      for (const nt of ntsRef.current) {
        ctx.beginPath();
        ctx.arc(nt.x, nt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = ntType === 'excitatory' ? '#0891b2' : '#dc2626';
        ctx.shadowColor = ntType === 'excitatory' ? '#0891b2' : '#dc2626';
        ctx.shadowBlur = nt.bound ? 8 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else {
      // electrical — gap junction
      ctx.fillStyle = '#dcfce7';
      ctx.fillRect(620, 280, 90, 210);
      ctx.strokeStyle = '#16a34a';
      ctx.strokeRect(620, 280, 90, 210);
      ctx.fillStyle = '#14532d';
      ctx.font = '700 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Gap junction', 665, 270);
      ctx.font = '500 10px Inter';
      ctx.fillText('(direct e⁻ flow)', 665, 510);
      ctx.textAlign = 'left';
      // electrical pulse
      if (tRef.current - lastApRef.current < 0.2) {
        ctx.fillStyle = 'rgba(252, 211, 77, 0.7)';
        ctx.fillRect(620, 280, 90, 210);
      }
    }
  };

  const drawPostSynaptic = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#ede9fe';
    ctx.strokeStyle = '#6d28d9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(990, 380, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4c1d95';
    ctx.font = '700 13px Inter';
    ctx.fillText('Post-synaptic neuron', 880, 200);
    // receptors at membrane (left side)
    for (let i = 0; i < 6; i++) {
      const y = 300 + i * 22;
      const bound = ntsRef.current.find(n => n.bound && Math.abs(n.y - y) < 12);
      ctx.fillStyle = bound ? (ntType === 'excitatory' ? '#0891b2' : '#dc2626') : '#94a3b8';
      ctx.fillRect(840, y - 6, 12, 12);
    }
    ctx.fillStyle = '#4c1d95';
    ctx.font = '500 10px Inter';
    ctx.fillText('receptors', 800, 280);

    // post-synaptic potential indicator
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 12px Inter';
    ctx.fillText(`Post-syn V: ${postPotentialRef.current.toFixed(0)} mV`, 920, 580);
    if (postPotentialRef.current > -55) {
      ctx.fillStyle = '#16a34a';
      ctx.fillText('▶ Threshold crossed — new AP fires!', 920, 600);
    } else if (postPotentialRef.current < -75) {
      ctx.fillStyle = '#dc2626';
      ctx.fillText('▼ Hyperpolarised (IPSP)', 920, 600);
    }
  };

  const drawPotentialTrace = (ctx: CanvasRenderingContext2D) => {
    const x0 = 80, y0 = 640, w = W - 160, h = 80;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = '#475569';
    ctx.font = '600 11px Inter';
    ctx.fillText('Post-synaptic potential trace', x0 + 6, y0 - 4);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < traceRef.current.length; i++) {
      const px = x0 + (i / 600) * w;
      const v = traceRef.current[i];
      const py = y0 + h * (1 - (v + 90) / 120);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  };

  const steps = [
    'AP arrives at terminal',
    'Ca²⁺ channels open, Ca²⁺ enters',
    'Vesicles migrate to membrane',
    'Vesicles fuse, release NTs',
    'NTs bind post-synaptic receptors',
    'Ion channels open → EPSP/IPSP',
  ];

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Synapse Comparison</div>
          <ul className="mt-2 text-xs space-y-1.5">
            <li><b className="text-violet-700">Chemical</b> — cleft + NTs + receptors. Slower, modifiable, excitatory or inhibitory.</li>
            <li><b className="text-emerald-700">Electrical</b> — close membranes (gap junction). Instant, fast, rare in humans.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">NCERT 6-Step Sequence</div>
          <ol className="mt-2 text-xs space-y-0.5 list-decimal pl-5">
            {steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-violet-200 bg-violet-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-violet-900">Chemical Synapse</div>
          <div className="text-xs font-semibold text-violet-700 mt-0.5">NCERT §18.3.2</div>
          <p className="text-sm text-violet-950 mt-2 leading-snug">
            Pre- and post-synaptic membranes separated by synaptic cleft. NTs in vesicles → release on AP arrival → bind receptors → open ion channels → new potential (excitatory or inhibitory).
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Synapse type" value={synapseType} />
            <Cell label="Neurotransmitter" value={ntType} />
            <Cell label="Vesicles ready" value={vesiclesReady} />
            <Cell label="Receptors bound" value={boundReceptors} />
            <Cell label="Post-syn potential" value={`${postPotentialRef.current.toFixed(0)} mV`} />
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
        <Zap size={18} className="text-violet-600" />
        <h3 className="text-sm font-bold text-slate-800">Synapse Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Synapse type</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['chemical', 'electrical'] as SynapseType[]).map(t => (
              <button key={t} onClick={() => setSynapseType(t)} className={`px-3 py-1.5 text-xs font-bold rounded-md ${synapseType === t ? 'bg-white text-violet-700 shadow' : 'text-slate-600'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Neurotransmitter</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['excitatory', 'inhibitory'] as NtType[]).map(t => (
              <button key={t} onClick={() => setNtType(t)} className={`px-3 py-1.5 text-xs font-bold rounded-md ${ntType === t ? 'bg-white text-violet-700 shadow' : 'text-slate-600'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Firing frequency</span><span className="font-mono">{firingFreq} Hz</span>
          </label>
          <input type="range" min={0.2} max={10} step={0.2} value={firingFreq} onChange={e => setFiringFreq(parseFloat(e.target.value))} className="w-full mt-1 accent-violet-600" />
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Vesicle pool</span><span className="font-mono">{vesiclePool}</span>
          </label>
          <input type="range" min={5} max={50} step={5} value={vesiclePool} onChange={e => setVesiclePool(parseInt(e.target.value))} className="w-full mt-1 accent-emerald-600" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={fireAp} className="px-3 py-2 text-xs font-bold rounded-md bg-violet-600 text-white">▶ Fire AP</button>
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <input type="checkbox" checked={reuptake} onChange={e => setReuptake(e.target.checked)} /> NT re-uptake
          </label>
          <button onClick={() => setStepMode(s => !s)} className={`px-3 py-1 text-xs font-bold rounded-md border ${stepMode ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200'}`}>Step {stepMode ? 'ON' : 'OFF'}</button>
          {stepMode && <button onClick={advanceStep} className="px-3 py-1 text-xs font-bold rounded-md bg-slate-800 text-white">▶ {steps[stepIdx].slice(0, 28)}…</button>}
        </div>
      </div>
    </div>
  );

  return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsComponent} InfographicComponent={<SynapticTransmissionInfographic />} />;
};

const Cell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-violet-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-extrabold text-violet-700">{value}</div>
  </div>
);

export default SynapticTransmissionLab;
