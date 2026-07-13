import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';
import SynapticTransmissionInfographic from './infographics/SynapticTransmissionInfographic';

interface SynapticTransmissionLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

// synapse geometry: terminal (left) → cleft → post-synaptic neuron (right)
const PRE_MEM_X = 560;    // pre-synaptic membrane (right edge of terminal)
const POST_MEM_X = 690;   // post-synaptic membrane (left edge of dendrite)
const SYN_Y0 = 150;       // top of the apposed membranes
const SYN_Y1 = 470;       // bottom of the apposed membranes
const RECEPTOR_YS = [200, 248, 296, 344, 392, 440];

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
        x: 170 + Math.random() * 300,
        y: SYN_Y0 + 40 + Math.random() * (SYN_Y1 - SYN_Y0 - 80),
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
    setStepMode(false);   // resume live sim so the impulse plays
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
  }, [paused, synapseType, ntType, firingFreq, reuptake, stepMode, stepIdx]);

  const step = (dt: number) => {
    tRef.current += dt;
    if (stepMode) return;

    // auto-fire APs
    if (tRef.current - lastApRef.current > 1 / firingFreq) {
      fireAp();
    }

    // move docking vesicles to the pre-synaptic membrane, then fuse & release
    for (const v of vesiclesRef.current) {
      if (v.state === 'docking') {
        const targetX = PRE_MEM_X - 16;
        const targetY = Math.max(SYN_Y0 + 20, Math.min(SYN_Y1 - 20, v.y));
        v.x += (targetX - v.x) * dt * 4;
        v.y += (targetY - v.y) * dt * 4;
        if (Math.abs(v.x - targetX) < 6) {
          v.state = 'fused';
          for (let i = 0; i < 8; i++) {
            ntsRef.current.push({
              x: PRE_MEM_X,
              y: v.y + (Math.random() - 0.5) * 10,
              vx: 70 + Math.random() * 40,
              bound: false,
              age: 0,
            });
          }
        }
      } else if (v.state === 'fused') {
        v.state = 'recycling';
        v.x = 170 + Math.random() * 300;
        v.y = SYN_Y0 + 40 + Math.random() * (SYN_Y1 - SYN_Y0 - 80);
        setTimeout(() => { v.state = 'pool'; }, 800);
      }
    }

    // NTs diffuse across the cleft and bind post-synaptic receptors
    const surviving: NtMol[] = [];
    let bound = 0;
    for (const nt of ntsRef.current) {
      nt.age += dt;
      if (!nt.bound) {
        nt.x += nt.vx * dt;
        nt.y += (Math.random() - 0.5) * 8 * dt * 10;
        if (nt.x > POST_MEM_X - 8) {
          if (Math.random() < 0.7) {
            nt.bound = true;
            nt.x = POST_MEM_X - 6;
            // snap to nearest receptor
            nt.y = RECEPTOR_YS.reduce((a, b) => Math.abs(b - nt.y) < Math.abs(a - nt.y) ? b : a, RECEPTOR_YS[0]);
          } else {
            nt.vx = -Math.abs(nt.vx) * 0.4;
          }
        }
      } else {
        bound++;
        if (reuptake && nt.age > 1.5) continue; // re-uptake clears the cleft
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

  // freeze the sim at a chosen stage of the chemical-synapse sequence
  const setStage = (i: number) => {
    setStepMode(true);
    setStepIdx(i);
    ntsRef.current = [];
    for (const v of vesiclesRef.current) v.state = 'pool';
    postPotentialRef.current = -70;
    const exc = ntType === 'excitatory';
    if (i === 0 || i === 1) {
      lastApRef.current = tRef.current;                 // AP arrives / Ca²⁺ enters → channels glow
    } else if (i === 2) {                               // vesicles fuse at the membrane
      lastApRef.current = tRef.current - 0.5;
      let n = 0;
      for (const v of vesiclesRef.current) {
        if (v.state === 'pool' && n < 3) { v.state = 'fused'; v.x = PRE_MEM_X - 16; v.y = SYN_Y0 + 70 + n * 80; n++; }
      }
    } else if (i === 3) {                               // NT released into the cleft
      for (let k = 0; k < 12; k++) {
        ntsRef.current.push({ x: PRE_MEM_X + 20 + Math.random() * (POST_MEM_X - PRE_MEM_X - 40), y: SYN_Y0 + 40 + Math.random() * (SYN_Y1 - SYN_Y0 - 80), vx: 0, bound: false, age: 0 });
      }
    } else if (i === 4) {                               // NT bound to receptors
      RECEPTOR_YS.forEach(ry => ntsRef.current.push({ x: POST_MEM_X - 6, y: ry, vx: 0, bound: true, age: 0 }));
    } else if (i === 5) {                               // EPSP / IPSP produced
      RECEPTOR_YS.forEach(ry => ntsRef.current.push({ x: POST_MEM_X - 6, y: ry, vx: 0, bound: true, age: 0 }));
      postPotentialRef.current = exc ? -42 : -82;
    }
    setBoundReceptors(ntsRef.current.filter(n => n.bound).length);
  };

  const advanceStep = () => setStage((stepIdx + 1) % 6);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * W;
    const cy = ((e.clientY - rect.top) / rect.height) * H;
    // step-panel geometry (matches drawStepPanel)
    const px = 96, py = 640, pw = W - 192, ph = 100;
    if (cy >= py && cy <= py + ph && cx >= px && cx <= px + pw) {
      const cw = (pw - 40) / 6;
      const col = Math.round((cx - (px + 30)) / cw);
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
    ctx.fillText('Synaptic Transmission — how one neuron signals the next', 30, 38);
    ctx.font = '600 13px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT §18.3.2 — AP arrives → Ca²⁺ enters → vesicles fuse → neurotransmitter released → binds receptors → EPSP / IPSP.', 30, 60);

    drawPreSynapticTerminal(ctx);
    drawCleft(ctx);
    drawPostSynaptic(ctx);
    drawPotentialTrace(ctx);
    drawStepPanel(ctx);
  };

  // vertical phospholipid bilayer membrane
  const drawBilayerV = (ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, color: string) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (let y = y0; y <= y1; y += 13) {
      ctx.beginPath(); ctx.arc(x - 4, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 4, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.stroke();
    }
  };

  const drawPreSynapticTerminal = (ctx: CanvasRenderingContext2D) => {
    const bulbTop = 108, bulbBot = 512;
    // terminal bulb
    const g = ctx.createLinearGradient(90, 0, PRE_MEM_X, 0);
    g.addColorStop(0, '#dbeafe'); g.addColorStop(1, '#bfdbfe');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(120, bulbTop);
    ctx.lineTo(PRE_MEM_X, bulbTop);
    ctx.lineTo(PRE_MEM_X, bulbBot);
    ctx.lineTo(120, bulbBot);
    ctx.quadraticCurveTo(70, (bulbTop + bulbBot) / 2, 120, bulbTop);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '800 15px Inter';
    ctx.fillText('Axon terminal (pre-synaptic neuron)', 132, 96);

    // mitochondrion (energy for the process)
    ctx.fillStyle = '#fca5a5'; ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(200, 180, 34, 18, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7f1d1d'; ctx.font = '600 9px Inter'; ctx.fillText('mitochondrion', 168, 214);

    // synaptic vesicles
    for (const v of vesiclesRef.current) {
      const r = 11;
      ctx.beginPath(); ctx.arc(v.x, v.y, r, 0, Math.PI * 2);
      ctx.fillStyle = v.state === 'fused' ? 'rgba(248,113,113,0.35)' : v.state === 'docking' ? '#fde68a' : '#c7d2fe';
      ctx.fill();
      ctx.strokeStyle = v.state === 'docking' ? '#d97706' : '#6366f1';
      ctx.lineWidth = 2; ctx.stroke();
      if (v.state === 'pool' || v.state === 'docking') {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          ctx.beginPath(); ctx.arc(v.x + Math.cos(a) * 4, v.y + Math.sin(a) * 4, 2, 0, Math.PI * 2);
          ctx.fillStyle = ntType === 'excitatory' ? '#0891b2' : '#dc2626'; ctx.fill();
        }
      }
    }
    ctx.fillStyle = '#3730a3'; ctx.font = '700 12px Inter';
    ctx.fillText('synaptic vesicles (packets of neurotransmitter)', 150, bulbBot - 14);

    // pre-synaptic membrane + voltage-gated Ca²⁺ channels
    drawBilayerV(ctx, PRE_MEM_X, SYN_Y0, SYN_Y1, '#1d4ed8');
    ctx.fillStyle = '#1e3a8a'; ctx.font = '700 12px Inter'; ctx.textAlign = 'right';
    ctx.fillText('pre-synaptic membrane', PRE_MEM_X - 10, SYN_Y0 - 8);
    ctx.textAlign = 'left';
    const apRecent = tRef.current - lastApRef.current < 0.4;
    [SYN_Y0 + 40, SYN_Y0 + 120].forEach(cy => {
      ctx.fillStyle = apRecent ? '#f59e0b' : '#93c5fd';
      ctx.fillRect(PRE_MEM_X - 6, cy - 10, 12, 20);
      ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 1.5; ctx.strokeRect(PRE_MEM_X - 6, cy - 10, 12, 20);
      if (apRecent) {
        // Ca²⁺ entering
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(PRE_MEM_X - 22, cy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '700 7px Inter'; ctx.textAlign = 'center';
        ctx.fillText('Ca', PRE_MEM_X - 22, cy + 2); ctx.textAlign = 'left';
      }
    });
    ctx.fillStyle = apRecent ? '#b45309' : '#64748b'; ctx.font = '700 11px Inter';
    ctx.fillText('Ca²⁺ channels', PRE_MEM_X + 8, SYN_Y0 + 40);
  };

  const drawCleft = (ctx: CanvasRenderingContext2D) => {
    if (synapseType === 'chemical') {
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(PRE_MEM_X, SYN_Y0, POST_MEM_X - PRE_MEM_X, SYN_Y1 - SYN_Y0);
      ctx.fillStyle = '#92400e';
      ctx.font = '700 12px Inter'; ctx.textAlign = 'center';
      const midX = (PRE_MEM_X + POST_MEM_X) / 2;
      ctx.fillText('synaptic', midX, SYN_Y0 - 22);
      ctx.fillText('cleft', midX, SYN_Y0 - 8);
      ctx.textAlign = 'left';
      // neurotransmitter molecules
      for (const nt of ntsRef.current) {
        ctx.beginPath(); ctx.arc(nt.x, nt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = ntType === 'excitatory' ? '#0891b2' : '#dc2626';
        ctx.shadowColor = ctx.fillStyle as string; ctx.shadowBlur = nt.bound ? 8 : 4;
        ctx.fill(); ctx.shadowBlur = 0;
      }
    } else {
      // electrical synapse — connexon gap junction bridging both membranes
      ctx.fillStyle = '#dcfce7';
      ctx.fillRect(PRE_MEM_X, SYN_Y0, POST_MEM_X - PRE_MEM_X, SYN_Y1 - SYN_Y0);
      const live = tRef.current - lastApRef.current < 0.25;
      for (let i = 0; i < 5; i++) {
        const cy = SYN_Y0 + 40 + i * 70;
        ctx.fillStyle = live ? '#fcd34d' : '#86efac';
        ctx.strokeStyle = '#15803d'; ctx.lineWidth = 2;
        ctx.fillRect(PRE_MEM_X - 4, cy - 12, POST_MEM_X - PRE_MEM_X + 8, 24);
        ctx.strokeRect(PRE_MEM_X - 4, cy - 12, POST_MEM_X - PRE_MEM_X + 8, 24);
      }
      ctx.fillStyle = '#14532d'; ctx.font = '700 12px Inter'; ctx.textAlign = 'center';
      ctx.fillText('gap junction (connexons)', (PRE_MEM_X + POST_MEM_X) / 2, SYN_Y0 - 8);
      ctx.font = '600 10px Inter';
      ctx.fillText('ions flow directly → instant, no delay', (PRE_MEM_X + POST_MEM_X) / 2, SYN_Y1 + 18);
      ctx.textAlign = 'left';
    }
  };

  const drawPostSynaptic = (ctx: CanvasRenderingContext2D) => {
    const bulbTop = 108, bulbBot = 512;
    const g = ctx.createLinearGradient(POST_MEM_X, 0, 1180, 0);
    g.addColorStop(0, '#ede9fe'); g.addColorStop(1, '#ddd6fe');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#6d28d9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(POST_MEM_X, bulbTop);
    ctx.lineTo(1150, bulbTop);
    ctx.quadraticCurveTo(1210, (bulbTop + bulbBot) / 2, 1150, bulbBot);
    ctx.lineTo(POST_MEM_X, bulbBot);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4c1d95';
    ctx.font = '800 15px Inter'; ctx.textAlign = 'right';
    ctx.fillText('Post-synaptic neuron (dendrite)', 1150, 96);
    ctx.textAlign = 'left';

    // post-synaptic membrane + ligand-gated receptors
    drawBilayerV(ctx, POST_MEM_X, SYN_Y0, SYN_Y1, '#6d28d9');
    const exc = ntType === 'excitatory';
    RECEPTOR_YS.forEach(y => {
      const bound = ntsRef.current.some(n => n.bound && Math.abs(n.y - y) < 12);
      ctx.fillStyle = bound ? (exc ? '#0891b2' : '#dc2626') : '#a78bfa';
      ctx.fillRect(POST_MEM_X - 2, y - 9, 16, 18);
      ctx.strokeStyle = '#6d28d9'; ctx.lineWidth = 1.5; ctx.strokeRect(POST_MEM_X - 2, y - 9, 16, 18);
      if (bound) {
        // ion entering the post-synaptic cell
        ctx.fillStyle = exc ? '#0891b2' : '#dc2626';
        ctx.beginPath(); ctx.arc(POST_MEM_X + 30, y, 4, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.fillStyle = '#4c1d95'; ctx.font = '700 12px Inter';
    ctx.fillText('receptors (ligand-gated ion channels)', POST_MEM_X + 24, SYN_Y1 + 22);

    // large EPSP / IPSP readout
    const v = postPotentialRef.current;
    ctx.fillStyle = '#0f172a'; ctx.font = '800 20px Inter'; ctx.textAlign = 'center';
    ctx.fillText(`Post-synaptic potential: ${v.toFixed(0)} mV`, 940, 150);
    ctx.font = '800 16px Inter';
    if (v > -55) { ctx.fillStyle = '#16a34a'; ctx.fillText('✓ EPSP — threshold reached → new impulse fires', 940, 176); }
    else if (v > -70) { ctx.fillStyle = '#0891b2'; ctx.fillText('EPSP — membrane moving toward threshold', 940, 176); }
    else if (v < -72) { ctx.fillStyle = '#dc2626'; ctx.fillText('IPSP — hyperpolarised, harder to fire', 940, 176); }
    ctx.textAlign = 'left';
  };

  const drawPotentialTrace = (ctx: CanvasRenderingContext2D) => {
    const x0 = 96, y0 = 548, w = W - 192, h = 74;
    ctx.fillStyle = '#0f172a'; ctx.font = '800 14px Inter';
    ctx.fillText('Post-synaptic potential over time', x0, y0 - 8);
    ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
    ctx.fillRect(x0, y0, w, h); ctx.strokeRect(x0, y0, w, h);
    const vy = (v: number) => y0 + h * (1 - (v + 90) / 120);
    // threshold + resting guides
    ctx.setLineDash([5, 4]); ctx.strokeStyle = '#f59e0b';
    ctx.beginPath(); ctx.moveTo(x0, vy(-55)); ctx.lineTo(x0 + w, vy(-55)); ctx.stroke();
    ctx.strokeStyle = '#a3a3a3';
    ctx.beginPath(); ctx.moveTo(x0, vy(-70)); ctx.lineTo(x0 + w, vy(-70)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#b45309'; ctx.font = '600 10px Inter';
    ctx.fillText('-55 threshold', x0 + w - 82, vy(-55) - 3);
    ctx.fillStyle = '#64748b'; ctx.fillText('-70 rest', x0 + 4, vy(-70) - 3);
    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < traceRef.current.length; i++) {
      const px = x0 + (i / 600) * w;
      if (i === 0) ctx.moveTo(px, vy(traceRef.current[i]));
      else ctx.lineTo(px, vy(traceRef.current[i]));
    }
    ctx.stroke();
  };

  // large lower panel: the 6-step sequence with the current stage highlighted
  const drawStepPanel = (ctx: CanvasRenderingContext2D) => {
    const x = 96, y = 640, w = W - 192, h = 100;
    ctx.fillStyle = '#faf5ff'; ctx.strokeStyle = '#e9d5ff'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 14, y); ctx.arcTo(x + w, y, x + w, y + h, 14);
    ctx.arcTo(x + w, y + h, x, y + h, 14); ctx.arcTo(x, y + h, x, y, 14);
    ctx.arcTo(x, y, x + w, y, 14); ctx.closePath();
    ctx.fill(); ctx.stroke();

    // work out the current stage
    const apRecent = tRef.current - lastApRef.current < 0.4;
    const docking = vesiclesRef.current.some(v => v.state === 'docking');
    const unbound = ntsRef.current.some(n => !n.bound);
    const bound = ntsRef.current.some(n => n.bound);
    let active = 0;
    if (apRecent) active = 1;
    if (docking) active = 2;
    if (unbound) active = 3;
    if (bound) active = 4;
    if (Math.abs(postPotentialRef.current + 70) > 4) active = 5;
    if (synapseType === 'electrical') active = apRecent ? 5 : 0;
    if (stepMode) active = stepIdx;   // clicked / stepped stage wins

    const shortSteps = ['AP arrives', 'Ca²⁺ enters', 'Vesicles fuse', 'NT released', 'NT binds receptor', 'EPSP / IPSP'];
    const cols = shortSteps.length;
    const cw = (w - 40) / cols;
    ctx.fillStyle = '#6b21a8'; ctx.font = '700 13px Inter';
    ctx.fillText('What is happening (chemical synapse sequence):', x + 20, y + 26);
    ctx.fillStyle = '#7c3aed'; ctx.font = '600 11px Inter';
    ctx.fillText('click a stage to jump to it', x + 320, y + 26);
    shortSteps.forEach((s, i) => {
      const nx = x + 30 + i * cw;
      const on = i === active;
      const done = i < active;
      ctx.fillStyle = on ? '#7c3aed' : done ? '#c4b5fd' : '#e2e8f0';
      if (on) { ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(nx, y + 62, 15, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '800 14px Inter'; ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, nx, y + 67);
      ctx.fillStyle = on ? '#5b21b6' : '#64748b'; ctx.font = on ? '800 12px Inter' : '600 12px Inter';
      ctx.fillText(s, nx, y + 90);
      ctx.textAlign = 'left';
      if (i < cols - 1) {
        ctx.strokeStyle = done ? '#a78bfa' : '#cbd5e1'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(nx + 18, y + 62); ctx.lineTo(nx + cw - 18, y + 62); ctx.stroke();
      }
    });
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
          <ul className="mt-2 text-xs space-y-1.5 text-slate-700">
            <li><b className="text-violet-700">Chemical</b> — cleft + NTs + receptors. Slower, modifiable, excitatory or inhibitory.</li>
            <li><b className="text-emerald-700">Electrical</b> — close membranes (gap junction). Instant, fast, rare in humans.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">NCERT 6-Step Sequence</div>
          <ol className="mt-2 text-xs space-y-0.5 list-decimal pl-5 text-slate-700">
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
        <Zap size={18} className="text-violet-600" />
        <h3 className="text-sm font-bold text-slate-800">Synapse Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Firing rate</span><span className="font-mono">{firingFreq.toFixed(1)} Hz</span>
          </label>
          <input type="range" min={0.2} max={10} step={0.2} value={firingFreq} onChange={e => { setFiringFreq(parseFloat(e.target.value)); setStepMode(false); }} className="w-full mt-1 accent-violet-600" />
          <p className="text-[10px] text-slate-500">Higher rate → more transmitter released (stronger EPSP)</p>
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Vesicle pool</span><span className="font-mono">{vesiclePool} vesicles</span>
          </label>
          <input type="range" min={5} max={50} step={5} value={vesiclePool} onChange={e => { setVesiclePool(parseInt(e.target.value)); setStepMode(false); }} className="w-full mt-1 accent-emerald-600" />
          <p className="text-[10px] text-slate-500">Fewer vesicles → synapse fatigues, signal weakens</p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Synapse type</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['chemical', 'electrical'] as SynapseType[]).map(t => (
              <button key={t} onClick={() => { setSynapseType(t); setStepMode(false); }} className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize ${synapseType === t ? 'bg-white text-violet-700 shadow' : 'text-slate-600'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Neurotransmitter</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['excitatory', 'inhibitory'] as NtType[]).map(t => (
              <button key={t} onClick={() => { setNtType(t); setStepMode(false); }} className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize ${ntType === t ? 'bg-white text-violet-700 shadow' : 'text-slate-600'}`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-2 items-center">
          <button onClick={fireAp} className="px-3 py-2 text-xs font-bold rounded-md bg-violet-600 text-white hover:bg-violet-700">
            <Zap size={12} className="inline mr-1" /> Fire impulse
          </button>
          <button onClick={() => setReuptake(r => !r)} className={`px-3 py-2 text-xs font-bold rounded-md border ${reuptake ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'}`}>
            NT re-uptake {reuptake ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => (stepMode ? setStepMode(false) : setStage(0))} className={`px-3 py-2 text-xs font-bold rounded-md border ${stepMode ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200'}`}>
            Step mode {stepMode ? 'ON' : 'OFF'}
          </button>
          {stepMode && <button onClick={advanceStep} className="px-3 py-2 text-xs font-bold rounded-md bg-slate-800 text-white">▶ Next step</button>}
        </div>
      </div>
      <p className="text-[10px] text-slate-500 mt-2 italic">Tip: turn Step mode on (or click a numbered stage on the canvas) to freeze and study each stage; move any control to resume.</p>
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
