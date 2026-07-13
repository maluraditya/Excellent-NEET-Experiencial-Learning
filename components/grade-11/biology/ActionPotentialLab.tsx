import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ActionPotentialLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Block = 'none' | 'na' | 'k' | 'pump';

// Axon segments along x: each tracks state (-70 = resting, +30 = depolarised, undershoot to -80, refractory)
const SEGMENTS = 60;
const AXON_X0 = 90;
const AXON_X1 = 1190;
const AXON_Y = 452;      // membrane band centre
const BAND_H = 58;       // half-height of the membrane band (band = 394..510)
const EXTRA_TOP = 330;   // top of the extracellular strip above the axon

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
  // stable ion positions (initialised once) so ions don't teleport each frame
  const naIonsRef = useRef<{ x: number; y: number }[]>([]);
  const kIonsRef = useRef<{ x: number; y: number }[]>([]);
  if (naIonsRef.current.length === 0) {
    const rand = (seed: number) => (Math.sin(seed * 12.9898) * 43758.5453) % 1;
    for (let i = 0; i < 54; i++) {
      naIonsRef.current.push({
        x: AXON_X0 + Math.abs(rand(i + 1)) * (AXON_X1 - AXON_X0),
        y: EXTRA_TOP + 20 + Math.abs(rand(i + 7)) * (AXON_Y - BAND_H - EXTRA_TOP - 34),
      });
    }
    for (let i = 0; i < 34; i++) {
      kIonsRef.current.push({
        x: AXON_X0 + Math.abs(rand(i + 3)) * (AXON_X1 - AXON_X0),
        y: AXON_Y - BAND_H + 16 + Math.abs(rand(i + 5)) * (BAND_H * 2 - 32),
      });
    }
  }

  // membrane-potential → colour (indigo hyperpolarised · blue resting · red depolarised)
  const vColor = (v: number, alpha = 1) => {
    if (v < -70) return `rgba(99,102,241,${alpha})`;
    const t = Math.max(0, Math.min(1, (v + 70) / 100));
    const r = Math.round(147 + t * (239 - 147));
    const g = Math.round(197 + t * (68 - 197));
    const b = Math.round(253 + t * (68 - 253));
    return `rgba(${r},${g},${b},${alpha})`;
  };

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
    if (y > AXON_Y - BAND_H - 30 && y < AXON_Y + BAND_H + 30) {
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

    ctx.fillStyle = '#0f172a';
    ctx.font = '800 22px Inter';
    ctx.fillText('Action Potential — generation & conduction along an axon', 30, 38);
    ctx.font = '600 13px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §18.3.1 — click the axon to fire an impulse.  Na⁺ influx depolarises · K⁺ efflux repolarises · Na⁺–K⁺ pump resets the gradient.', 30, 60);

    drawVoltageTrace(ctx);
    drawAxon(ctx);
    drawPump(ctx);
    drawPhasePanel(ctx);
  };

  const drawVoltageTrace = (ctx: CanvasRenderingContext2D) => {
    const x0 = 96, y0 = 92, w = W - 200, h = 150;
    // title (own line, above the box)
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '800 15px Inter';
    ctx.fillText(`Membrane potential recorded at the probe (segment ${probeSeg})`, x0, y0 - 10);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeRect(x0, y0, w, h);
    const vy = (v: number) => y0 + h * (1 - (v + 80) / 110) * 0.9 + h * 0.05;
    // zero line
    ctx.strokeStyle = '#cbd5e1'; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x0, vy(0)); ctx.lineTo(x0 + w, vy(0)); ctx.stroke();
    // resting -70
    ctx.strokeStyle = '#a3a3a3'; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(x0, vy(-70)); ctx.lineTo(x0 + w, vy(-70)); ctx.stroke();
    // threshold -55
    ctx.strokeStyle = '#f59e0b'; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(x0, vy(-55)); ctx.lineTo(x0 + w, vy(-55)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '700 12px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('+30 mV', x0 - 62, vy(30) + 4);
    ctx.fillText('0', x0 - 20, vy(0) + 4);
    ctx.fillText('-70 mV', x0 - 62, vy(-70) + 4);
    ctx.fillStyle = '#b45309';
    ctx.fillText('-55 mV threshold', x0 + w - 118, vy(-55) - 6);
    // trace
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const trace = traceRef.current;
    for (let i = 0; i < trace.length; i++) {
      const px = x0 + (i / 600) * w;
      if (i === 0) ctx.moveTo(px, vy(trace[i]));
      else ctx.lineTo(px, vy(trace[i]));
    }
    ctx.stroke();
    // phase key on its own line BELOW the box (no overlap with the title)
    ctx.font = '700 12px Inter';
    const phases: [string, string][] = [
      ['#3b82f6', '1 Resting (-70 mV)'],
      ['#ef4444', '2 Depolarisation — Na⁺ in'],
      ['#f59e0b', '3 Repolarisation — K⁺ out'],
      ['#6366f1', '4 Hyperpolarisation'],
    ];
    let px = x0;
    const ky = y0 + h + 22;
    phases.forEach(([c, label]) => {
      ctx.fillStyle = c; ctx.fillRect(px, ky - 11, 14, 14);
      ctx.fillStyle = '#334155'; ctx.fillText(label, px + 20, ky);
      px += ctx.measureText(label).width + 56;
    });
  };

  const drawAxon = (ctx: CanvasRenderingContext2D) => {
    const top = AXON_Y - BAND_H, bot = AXON_Y + BAND_H;
    const spanW = AXON_X1 - AXON_X0;
    const wSeg = spanW / SEGMENTS;

    // ---- extracellular fluid (outside, above) ----
    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(AXON_X0 - 20, EXTRA_TOP, spanW + 40, top - EXTRA_TOP);
    ctx.fillStyle = '#1d4ed8';
    ctx.font = '800 14px Inter';
    ctx.fillText('OUTSIDE — extracellular fluid (high Na⁺)', AXON_X0, EXTRA_TOP + 22);

    // ---- axoplasm base ----
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(AXON_X0, top, spanW, bot - top);

    // ---- per-segment membrane potential colour ----
    for (let i = 0; i < SEGMENTS; i++) {
      const x = AXON_X0 + i * wSeg;
      ctx.fillStyle = vColor(segStateRef.current[i], 0.9);
      ctx.fillRect(x, top, wSeg + 0.5, bot - top);
    }

    // ---- inside label ----
    ctx.fillStyle = '#7c2d12';
    ctx.font = '800 14px Inter';
    ctx.fillText('INSIDE — axoplasm (high K⁺, negatively charged)', AXON_X0 + 6, bot + 26);

    // ---- phospholipid bilayer (top & bottom membranes) ----
    const bilayer = (y: number, dir: number) => {
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      for (let x = AXON_X0; x <= AXON_X1; x += 13) {
        ctx.beginPath();
        ctx.arc(x, y - dir * 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y - dir * 4);
        ctx.lineTo(x, y + dir * 4);
        ctx.stroke();
      }
    };
    bilayer(top, 1);
    bilayer(bot, -1);

    // ---- myelin sheath + Nodes of Ranvier ----
    if (myelin) {
      const nodeSpacing = 8;
      for (let i = 0; i < SEGMENTS; i += nodeSpacing) {
        const x = AXON_X0 + (i / SEGMENTS) * spanW;
        const xNext = AXON_X0 + (Math.min(SEGMENTS, i + nodeSpacing - 1) / SEGMENTS) * spanW;
        const g = ctx.createLinearGradient(0, top - 12, 0, bot + 12);
        g.addColorStop(0, '#fde9b8'); g.addColorStop(1, '#e9b872');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse((x + xNext) / 2, AXON_Y, (xNext - x) / 2 - 4, BAND_H + 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#78350f';
      ctx.font = '700 12px Inter';
      ctx.fillText('myelin sheath', AXON_X0 + 50, top - 12);
    }

    // ---- stable ions ----
    naIonsRef.current.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0ea5e9'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 8px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Na', p.x, p.y + 3); ctx.textAlign = 'left';
    });
    kIonsRef.current.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 8px Inter'; ctx.textAlign = 'center';
      ctx.fillText('K', p.x, p.y + 3); ctx.textAlign = 'left';
    });

    // ---- open channels + directional ion flow at the travelling wave ----
    const depolXs: number[] = [], repolXs: number[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const x = AXON_X0 + (i + 0.5) * wSeg;
      const v = segStateRef.current[i];
      if (v > 0) depolXs.push(x);
      else if (refractRef.current[i] > 0 && v < -10) repolXs.push(x);
    }
    const mid = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    const depX = mid(depolXs), repX = mid(repolXs);
    ctx.textAlign = 'center';
    if (depX != null) {
      ctx.strokeStyle = '#0284c7'; ctx.fillStyle = '#0284c7'; ctx.lineWidth = 4;
      for (let k = -1; k <= 1; k++) {
        const ax = depX + k * 20;
        ctx.beginPath(); ctx.moveTo(ax, top - 28); ctx.lineTo(ax, top + 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax, top + 22); ctx.lineTo(ax - 6, top + 12); ctx.lineTo(ax + 6, top + 12); ctx.closePath(); ctx.fill();
      }
      ctx.font = '800 13px Inter';
      ctx.fillText('Na⁺ IN', depX, top - 34);
    }
    if (repX != null) {
      ctx.strokeStyle = '#d97706'; ctx.fillStyle = '#d97706'; ctx.lineWidth = 4;
      for (let k = -1; k <= 1; k++) {
        const ax = repX + k * 20;
        ctx.beginPath(); ctx.moveTo(ax, top + 22); ctx.lineTo(ax, top - 28); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax, top - 28); ctx.lineTo(ax - 6, top - 18); ctx.lineTo(ax + 6, top - 18); ctx.closePath(); ctx.fill();
      }
      ctx.font = '800 13px Inter';
      ctx.fillText('K⁺ OUT', repX, top - 34);
    }
    ctx.textAlign = 'left';

    // ---- probe marker ----
    const probeX = AXON_X0 + (probeSeg / SEGMENTS) * spanW;
    ctx.strokeStyle = '#7c3aed';
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(probeX, top - 26);
    ctx.lineTo(probeX, bot + 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#7c3aed';
    ctx.font = '800 13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('probe ↓', probeX, top - 32);
    ctx.textAlign = 'left';

    // ---- membrane-potential colour key ----
    const kx = AXON_X0 + 470, ky = bot + 20;
    ctx.font = '700 12px Inter';
    ([['#6366f1', 'hyperpolarised'], ['#93c5fd', 'resting −70'], ['#ef4444', 'depolarised +30']] as [string, string][]).forEach(([c, label], i) => {
      ctx.fillStyle = c;
      ctx.fillRect(kx + i * 240, ky, 16, 14);
      ctx.fillStyle = '#334155';
      ctx.fillText(label, kx + i * 240 + 22, ky + 12);
    });
  };

  const drawPump = (ctx: CanvasRenderingContext2D) => {
    // embedded in the membrane near the right end of the axon
    const x = AXON_X1 - 70, top = AXON_Y - BAND_H, bot = AXON_Y + BAND_H;
    // pump body straddling the membrane
    ctx.fillStyle = pumpActive ? '#bbf7d0' : '#fecaca';
    ctx.strokeStyle = pumpActive ? '#16a34a' : '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 22, top - 6);
    ctx.lineTo(x + 22, top - 6);
    ctx.lineTo(x + 14, bot + 6);
    ctx.lineTo(x - 14, bot + 6);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    if (pumpActive) {
      // 3 Na⁺ out (up)
      ctx.strokeStyle = '#0ea5e9'; ctx.fillStyle = '#0ea5e9'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x, top - 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, top - 22); ctx.lineTo(x - 4, top - 14); ctx.lineTo(x + 4, top - 14); ctx.closePath(); ctx.fill();
      ctx.font = '700 10px Inter'; ctx.textAlign = 'center';
      ctx.fillText('3 Na⁺ out', x, top - 26);
      // 2 K⁺ in (down)
      ctx.strokeStyle = '#f59e0b'; ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.moveTo(x + 30, top); ctx.lineTo(x + 30, bot + 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 30, bot + 20); ctx.lineTo(x + 26, bot + 12); ctx.lineTo(x + 34, bot + 12); ctx.closePath(); ctx.fill();
      ctx.fillText('2 K⁺ in', x + 30, bot + 34);
    }
    ctx.fillStyle = pumpActive ? '#14532d' : '#7f1d1d';
    ctx.font = '700 11px Inter'; ctx.textAlign = 'center';
    ctx.fillText(pumpActive ? 'Na⁺–K⁺ pump' : '⛔ pump OFF', x, bot + 50);
    ctx.textAlign = 'left';
  };

  // large always-on panel in the lower space: current phase + steps + status
  const drawPhasePanel = (ctx: CanvasRenderingContext2D) => {
    const x = 96, y = 588, w = W - 192, h = 150;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 14, y); ctx.arcTo(x + w, y, x + w, y + h, 14);
    ctx.arcTo(x + w, y + h, x, y + h, 14); ctx.arcTo(x, y + h, x, y, 14);
    ctx.arcTo(x, y, x + w, y, 14); ctx.closePath();
    ctx.fill(); ctx.stroke();

    // current phase at the probe
    const v = segStateRef.current[probeSeg];
    const refr = refractRef.current[probeSeg];
    let idx: number, name: string, color: string, desc: string;
    if (block === 'na') { idx = 0; name = 'No impulse'; color = '#dc2626'; desc = 'Na⁺ channels are blocked — the membrane cannot depolarise, so no action potential forms.'; }
    else if (v > -20) { idx = 1; name = 'DEPOLARISATION'; color = '#dc2626'; desc = 'Na⁺ channels are open — Na⁺ floods IN and the inside swings to about +30 mV.'; }
    else if (refr > 0 && v <= -20) { idx = 2; name = 'REPOLARISATION'; color = '#d97706'; desc = 'Na⁺ channels shut, K⁺ channels open — K⁺ moves OUT and the potential falls back down.'; }
    else if (v < -70) { idx = 3; name = 'HYPERPOLARISATION'; color = '#6366f1'; desc = 'K⁺ efflux briefly overshoots below −70 mV (refractory period) before the pump restores rest.'; }
    else { idx = 0; name = 'RESTING'; color = '#2563eb'; desc = 'The Na⁺–K⁺ pump holds the inside at about −70 mV. Click the axon to fire an impulse.'; }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.font = '700 14px Inter';
    ctx.fillText('What is happening at the probe right now', x + 22, y + 30);
    ctx.fillStyle = color;
    ctx.font = '800 30px Inter';
    ctx.fillText(name, x + 22, y + 68);
    ctx.fillStyle = '#334155';
    ctx.font = '600 15px Inter';
    ctx.fillText(desc, x + 22, y + 98);

    // status line
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px Inter';
    let msg = `${apCount} impulses fired  ·  conduction: ${myelin ? 'FAST — saltatory (jumps node to node)' : 'slow — continuous'}`;
    if (block === 'k') msg += '  ·  ⛔ K⁺ blocked — cannot repolarise';
    if (!pumpActive) msg += '  ·  ⚠ pump off — gradients draining';
    ctx.fillText(msg, x + 22, y + 130);

    // step tracker chips (right side)
    const steps = ['1 Resting', '2 Depolarise', '3 Repolarise', '4 Hyperpolarise'];
    const stepCol = ['#2563eb', '#dc2626', '#d97706', '#6366f1'];
    const cw = 150, cx0 = x + w - cw - 20;
    steps.forEach((s, i) => {
      const cyc = y + 22 + i * 30;
      const on = i === idx;
      ctx.fillStyle = on ? stepCol[i] : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(cx0, cyc + 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = on ? stepCol[i] : '#94a3b8';
      ctx.font = on ? '800 14px Inter' : '600 14px Inter';
      ctx.fillText(s, cx0 + 16, cyc + 11);
    });
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
