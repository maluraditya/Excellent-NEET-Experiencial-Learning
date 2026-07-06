import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Atom, Battery, Droplets, Pause, Play, RotateCcw, Sparkles, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ElectronTransportChainLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Substrate = 'nadh' | 'fadh2' | 'mixed';
type Inhibitor = 'none' | 'rotenone' | 'antimycin' | 'cyanide' | 'uncoupler';

interface Electron { id: number; complex: 0 | 1 | 2 | 3 | 4; progress: number; source: 'nadh' | 'fadh2' }
interface Proton { id: number; x: number; y: number; vy: number; phase: 'pumping' | 'space' | 'returning' }
interface Water { id: number; x: number; y: number; vy: number; alpha: number }
interface AtpToken { id: number; x: number; y: number; alpha: number }

const COMPLEX_X = [200, 400, 620, 870, 1090];
const MEMBRANE_Y = 420;
const MEMBRANE_TOP = 380;
const MEMBRANE_BOT = 460;
const COMPLEX_W = 80;
const COMPLEX_H = 100;

const COMPLEX_META = [
  { id: 'I',   name: 'NADH dehydrogenase',     color: '#0891b2', pumps: true  },
  { id: 'II',  name: 'Succinate dehydrogenase', color: '#16a34a', pumps: false },
  { id: 'III', name: 'Cytochrome bc₁ complex',  color: '#7c3aed', pumps: true  },
  { id: 'IV',  name: 'Cytochrome c oxidase',    color: '#dc2626', pumps: true  },
  { id: 'V',   name: 'ATP synthase',            color: '#d97706', pumps: false },
];

const ElectronTransportChainLab: React.FC<ElectronTransportChainLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const spawnAccumRef = useRef<number>(0);
  const rotorRef = useRef<number>(0);
  const protonsRef = useRef<Proton[]>([]);
  const electronsRef = useRef<Electron[]>([]);
  const watersRef = useRef<Water[]>([]);
  const atpsRef = useRef<AtpToken[]>([]);
  const idCounterRef = useRef<number>(0);

  const [paused, setPaused] = useState(false);
  const [substrate, setSubstrate] = useState<Substrate>('mixed');
  const [inhibitor, setInhibitor] = useState<Inhibitor>('none');
  const [oxygenLevel, setOxygenLevel] = useState(100); // %
  const [speed, setSpeed] = useState(1);
  const [protonGradient, setProtonGradient] = useState(0); // 0-100
  const [atpCount, setAtpCount] = useState(0);
  const [nadhConsumed, setNadhConsumed] = useState(0);
  const [fadh2Consumed, setFadh2Consumed] = useState(0);
  const [h2oProduced, setH2oProduced] = useState(0);
  const [showInhibitorInfo, setShowInhibitorInfo] = useState(false);

  const handleReset = useCallback(() => {
    protonsRef.current = [];
    electronsRef.current = [];
    watersRef.current = [];
    atpsRef.current = [];
    spawnAccumRef.current = 0;
    rotorRef.current = 0;
    setProtonGradient(0);
    setAtpCount(0);
    setNadhConsumed(0);
    setFadh2Consumed(0);
    setH2oProduced(0);
  }, []);

  const nextId = () => ++idCounterRef.current;

  // ---------- ANIMATION LOOP ----------
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
  }, [paused, substrate, inhibitor, oxygenLevel, speed]);

  const step = (dt: number) => {
    const sp = speed;
    // ---- spawn electrons from substrate ----
    spawnAccumRef.current += dt * sp;
    const spawnInterval = 0.45;
    while (spawnAccumRef.current >= spawnInterval) {
      spawnAccumRef.current -= spawnInterval;
      const source: 'nadh' | 'fadh2' =
        substrate === 'nadh' ? 'nadh' :
        substrate === 'fadh2' ? 'fadh2' :
        Math.random() < 0.7 ? 'nadh' : 'fadh2';
      // FADH2 starts at Complex II (index 1), NADH at Complex I (index 0)
      const startComplex = source === 'nadh' ? 0 : 1;
      // skip if inhibitor blocks the entry
      if (inhibitor === 'rotenone' && startComplex === 0) continue;
      electronsRef.current.push({
        id: nextId(),
        complex: startComplex as 0 | 1,
        progress: 0,
        source,
      });
    }

    // ---- electrons traverse complexes ----
    const remainingElectrons: Electron[] = [];
    for (const e of electronsRef.current) {
      e.progress += dt * sp * 0.7;
      const blocked =
        (inhibitor === 'antimycin' && e.complex === 2) ||
        (inhibitor === 'cyanide' && e.complex === 3);

      if (blocked) {
        e.progress = Math.min(e.progress, 0.5); // stall inside complex
        remainingElectrons.push(e);
        continue;
      }

      if (e.progress >= 1) {
        // pump protons at I, III, IV (if not blocked)
        const c = COMPLEX_META[e.complex];
        if (c.pumps && inhibitor !== 'uncoupler') {
          // already pumped on entry; pump on exit too
          for (let i = 0; i < 2; i++) {
            protonsRef.current.push({
              id: nextId(),
              x: COMPLEX_X[e.complex] + (Math.random() - 0.5) * 30,
              y: MEMBRANE_Y - 10,
              vy: -50 - Math.random() * 30,
              phase: 'pumping',
            });
          }
        }
        // advance to next complex
        if (e.complex === 3) {
          // Complex IV — combine with O2 if available
          if (oxygenLevel > 5) {
            // produce water
            watersRef.current.push({
              id: nextId(),
              x: COMPLEX_X[3] + 50,
              y: MEMBRANE_Y + 40,
              vy: 40,
              alpha: 1,
            });
            setH2oProduced(c0 => c0 + 1);
            if (e.source === 'nadh') setNadhConsumed(c0 => c0 + 1);
            else setFadh2Consumed(c0 => c0 + 1);
          } else {
            // can't be accepted, electron stalls
            e.progress = 0.6;
            remainingElectrons.push(e);
            continue;
          }
        } else {
          const next = (e.complex + 1) as 0 | 1 | 2 | 3 | 4;
          // skip Complex I if FADH2-source already at II; otherwise advance
          if (e.source === 'fadh2' && e.complex === 1) {
            e.complex = 2;
          } else {
            e.complex = next;
          }
          e.progress = 0;
          if (e.complex < 4) remainingElectrons.push(e);
        }
      } else {
        remainingElectrons.push(e);
      }
    }
    electronsRef.current = remainingElectrons;

    // ---- protons rise & accumulate in intermembrane space ----
    const remainingProtons: Proton[] = [];
    for (const p of protonsRef.current) {
      if (p.phase === 'pumping') {
        p.y += p.vy * dt;
        if (p.y < 80 + Math.random() * 40) {
          p.phase = 'space';
          p.vy = 0;
        }
      } else if (p.phase === 'space') {
        // drift slightly
        p.x += Math.sin(p.id + lastRef.current * 0.001) * 0.4;
        p.y += Math.cos(p.id * 0.7) * 0.2;
        // chance to return through ATP synthase (Complex V) if gradient sufficient
        const distToV = Math.abs(p.x - COMPLEX_X[4]);
        if (distToV < 70 && Math.random() < 0.012 * sp && inhibitor !== 'uncoupler') {
          p.phase = 'returning';
          p.x = COMPLEX_X[4] + (Math.random() - 0.5) * 20;
          p.vy = 200;
        }
        // uncoupler: protons leak back anywhere
        if (inhibitor === 'uncoupler' && Math.random() < 0.02 * sp) {
          p.phase = 'returning';
          p.vy = 150;
        }
      } else if (p.phase === 'returning') {
        p.y += p.vy * dt;
        if (p.y > MEMBRANE_Y + 10) continue; // consumed
        // every 4th proton -> spin rotor and produce ATP
        if (inhibitor !== 'uncoupler' && Math.abs(p.x - COMPLEX_X[4]) < 30) {
          rotorRef.current += 90 * dt * 1.2;
          if (Math.random() < 0.06) {
            atpsRef.current.push({ id: nextId(), x: COMPLEX_X[4] + (Math.random() - 0.5) * 20, y: MEMBRANE_Y + 60, alpha: 1 });
            setAtpCount(c => c + 1);
          }
        }
      }
      if (p.y > -5 && p.y < H) remainingProtons.push(p);
    }
    protonsRef.current = remainingProtons.slice(-220);

    // ---- gradient meter ----
    const spaceCount = remainingProtons.filter(p => p.phase === 'space').length;
    setProtonGradient(Math.min(100, spaceCount / 1.4));

    // ---- decay waters & atps ----
    watersRef.current = watersRef.current
      .map(w => ({ ...w, y: w.y + w.vy * dt, alpha: w.alpha - dt * 0.4 }))
      .filter(w => w.alpha > 0);
    atpsRef.current = atpsRef.current
      .map(a => ({ ...a, y: a.y + 30 * dt, alpha: a.alpha - dt * 0.35 }))
      .filter(a => a.alpha > 0);
  };

  // ---------- DRAW ----------
  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    // background — matrix below, intermembrane space above
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // intermembrane space (pale amber)
    const gradTop = ctx.createLinearGradient(0, 0, 0, MEMBRANE_TOP);
    gradTop.addColorStop(0, '#fffbeb');
    gradTop.addColorStop(1, '#fef3c7');
    ctx.fillStyle = gradTop;
    ctx.fillRect(0, 0, W, MEMBRANE_TOP);

    // matrix (pale teal)
    const gradBot = ctx.createLinearGradient(0, MEMBRANE_BOT, 0, H);
    gradBot.addColorStop(0, '#ecfeff');
    gradBot.addColorStop(1, '#cffafe');
    ctx.fillStyle = gradBot;
    ctx.fillRect(0, MEMBRANE_BOT, W, H - MEMBRANE_BOT);

    // labels
    ctx.fillStyle = '#475569';
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.fillText('Intermembrane space  (H⁺ accumulates here)', 20, 30);
    ctx.fillText('Matrix  (NADH, FADH₂, ADP+Pi)', 20, H - 20);

    // membrane bilayer
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(0, MEMBRANE_TOP, W, MEMBRANE_BOT - MEMBRANE_TOP);
    // lipid head rows
    for (let x = 10; x < W; x += 18) {
      ctx.beginPath();
      ctx.arc(x, MEMBRANE_TOP + 6, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fcd34d';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 9, MEMBRANE_BOT - 6, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // complexes
    COMPLEX_META.forEach((meta, i) => {
      const x = COMPLEX_X[i];
      const blocked =
        (inhibitor === 'rotenone' && i === 0) ||
        (inhibitor === 'antimycin' && i === 2) ||
        (inhibitor === 'cyanide' && i === 3);
      drawComplex(ctx, x, MEMBRANE_Y, meta.id, meta.color, blocked, i === 4);
    });

    // electron path arcs (faint guide)
    ctx.strokeStyle = 'rgba(8, 145, 178, 0.18)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(COMPLEX_X[0], MEMBRANE_Y);
    for (let i = 1; i < 4; i++) {
      const mx = (COMPLEX_X[i - 1] + COMPLEX_X[i]) / 2;
      ctx.quadraticCurveTo(mx, MEMBRANE_Y - 38, COMPLEX_X[i], MEMBRANE_Y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // cytochrome c label (between III and IV)
    const cytX = (COMPLEX_X[2] + COMPLEX_X[3]) / 2;
    ctx.beginPath();
    ctx.arc(cytX, MEMBRANE_Y - 28, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#fda4af';
    ctx.fill();
    ctx.strokeStyle = '#be123c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#be123c';
    ctx.font = '600 10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('cyt c', cytX, MEMBRANE_Y - 25);
    ctx.textAlign = 'left';

    // NADH / FADH2 sources in matrix
    drawSubstrateSource(ctx, 60, MEMBRANE_Y + 120, 'NADH', '#0e7490', substrate !== 'fadh2');
    drawSubstrateSource(ctx, 180, MEMBRANE_Y + 120, 'FADH₂', '#16a34a', substrate !== 'nadh');

    // O2 supply on the right
    drawOxygenSource(ctx, W - 80, 70, oxygenLevel);

    // electrons
    for (const e of electronsRef.current) {
      const baseX = COMPLEX_X[e.complex];
      let nextX = COMPLEX_X[Math.min(e.complex + 1, 4)];
      // electrons travelling between complexes — draw along arc
      const t = e.progress;
      const x = baseX + (nextX - baseX) * t;
      const arc = Math.sin(t * Math.PI) * 30;
      const y = MEMBRANE_Y - 10 - arc;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      // trail
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(baseX + (nextX - baseX) * Math.max(0, t - 0.2),
                 MEMBRANE_Y - 10 - Math.sin(Math.max(0, t - 0.2) * Math.PI) * 30);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // protons
    for (const p of protonsRef.current) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = p.phase === 'returning' ? '#16a34a' : '#f97316';
      ctx.shadowColor = ctx.fillStyle as string;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      // tiny '+' badge for space protons
      if (p.phase === 'space') {
        ctx.fillStyle = '#fff7ed';
        ctx.font = '700 6px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('+', p.x, p.y + 2);
        ctx.textAlign = 'left';
      }
    }

    // water droplets falling into matrix
    for (const w of watersRef.current) {
      ctx.beginPath();
      ctx.arc(w.x, w.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(14, 165, 233, ${w.alpha})`;
      ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${w.alpha * 0.6})`;
      ctx.fillText('H₂O', w.x - 10, w.y + 22);
    }

    // ATP tokens
    for (const a of atpsRef.current) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(217, 119, 6, ${a.alpha})`;
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255, 255, 255, ${a.alpha})`;
      ctx.font = '700 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ATP', a.x, a.y + 3);
      ctx.textAlign = 'left';
    }

    // ATP synthase rotor on top of Complex V — visual rotation
    const rotorX = COMPLEX_X[4];
    const rotorY = MEMBRANE_Y + 30;
    ctx.save();
    ctx.translate(rotorX, rotorY);
    ctx.rotate((rotorRef.current * Math.PI) / 180);
    ctx.fillStyle = '#fcd34d';
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 2) * i);
      ctx.fillRect(-3, -22, 6, 22);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#d97706';
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Caption banner — bottom of canvas (NCERT phrase)
    ctx.fillStyle = '#64748b';
    ctx.font = '500 12px Inter, system-ui, sans-serif';
    if (inhibitor === 'none' && oxygenLevel > 5) {
      ctx.fillText('Oxygen is the final hydrogen acceptor — it drives the whole process by removing hydrogen from the system.', 20, H - 50);
    } else if (oxygenLevel <= 5) {
      ctx.fillStyle = '#dc2626';
      ctx.fillText('⚠ No O₂ — electrons cannot exit Complex IV. Gradient collapses, ATP synthesis halts.', 20, H - 50);
    } else if (inhibitor === 'uncoupler') {
      ctx.fillStyle = '#ea580c';
      ctx.fillText('⚠ Uncoupler — H⁺ leaks back through the membrane (not through ATP synthase). Rotor stops.', 20, H - 50);
    } else {
      ctx.fillStyle = '#dc2626';
      const labelMap: Record<Inhibitor, string> = {
        none: '', uncoupler: '',
        rotenone:  'Rotenone blocks Complex I — NADH cannot enter ETS. FADH₂ entry still works.',
        antimycin: 'Antimycin A blocks Complex III — electrons stall, downstream halts.',
        cyanide:   'Cyanide blocks Complex IV — electrons cannot reach O₂; whole chain backs up.',
      };
      ctx.fillText(`⚠ ${labelMap[inhibitor]}`, 20, H - 50);
    }
  };

  const drawComplex = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, label: string, color: string, blocked: boolean, isSynthase: boolean,
  ) => {
    const w = COMPLEX_W;
    const h = COMPLEX_H;
    // glass-morphism tower
    const grad = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    grad.addColorStop(0, color + 'cc');
    grad.addColorStop(1, color + '66');
    ctx.fillStyle = blocked ? '#94a3b8' : grad;
    ctx.strokeStyle = blocked ? '#475569' : color;
    ctx.lineWidth = 2;
    const r = 12;
    roundRect(ctx, x - w / 2, y - h / 2, w, h, r);
    ctx.fill();
    ctx.stroke();
    // label
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 20px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 7);
    ctx.textAlign = 'left';
    // blocked icon
    if (blocked) {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - w / 4, y - h / 4);
      ctx.lineTo(x + w / 4, y + h / 4);
      ctx.moveTo(x + w / 4, y - h / 4);
      ctx.lineTo(x - w / 4, y + h / 4);
      ctx.stroke();
    }
    // ATP synthase channel beneath — visible F0/F1 indication
    if (isSynthase) {
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.5;
      ctx.fillRect(x - 14, y - h / 2 - 14, 28, 16);
      ctx.strokeRect(x - 14, y - h / 2 - 14, 28, 16);
      ctx.fillStyle = '#92400e';
      ctx.font = '600 9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('F₀', x, y - h / 2 - 3);
      ctx.fillText('F₁', x, y + h / 2 + 50);
      ctx.textAlign = 'left';
    }
  };

  const drawSubstrateSource = (ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string, active: boolean) => {
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fillStyle = active ? color : '#cbd5e1';
    ctx.shadowColor = active ? color : 'transparent';
    ctx.shadowBlur = active ? 12 : 0;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 4);
    ctx.textAlign = 'left';
  };

  const drawOxygenSource = (ctx: CanvasRenderingContext2D, x: number, y: number, level: number) => {
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fillStyle = level > 5 ? '#0ea5e9' : '#cbd5e1';
    ctx.shadowColor = level > 5 ? '#0ea5e9' : 'transparent';
    ctx.shadowBlur = level > 5 ? 14 : 0;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('O₂', x, y + 5);
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 10px Inter';
    ctx.fillText(`${level}%`, x, y + 42);
    ctx.textAlign = 'left';
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

  // ---------- THEORETICAL YIELD ----------
  const theoreticalAtp = useMemo(() => nadhConsumed * 3 + fadh2Consumed * 2, [nadhConsumed, fadh2Consumed]);

  // ---------- PANELS ----------
  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        {/* ATP yield bar chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-extrabold text-slate-900">ATP Yield</div>
              <div className="text-xs font-semibold text-slate-500">NCERT: NADH→3, FADH₂→2</div>
            </div>
            <Battery size={20} className="text-amber-600" />
          </div>
          <div className="mt-3 space-y-2.5">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>From NADH (×3)</span>
                <span className="font-mono text-cyan-700">{nadhConsumed * 3} ATP</span>
              </div>
              <div className="h-3 mt-1 bg-cyan-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 transition-[width] duration-300" style={{ width: `${Math.min(100, (nadhConsumed * 3) * 1.5)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>From FADH₂ (×2)</span>
                <span className="font-mono text-emerald-700">{fadh2Consumed * 2} ATP</span>
              </div>
              <div className="h-3 mt-1 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${Math.min(100, (fadh2Consumed * 2) * 2)}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between text-sm font-bold text-slate-700">
                <span>Theoretical Total</span>
                <span className="font-mono text-amber-700">{theoreticalAtp} ATP</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-0.5">
                <span>Actually produced</span>
                <span className="font-mono">{atpCount} ATP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proton gradient meter */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-extrabold text-slate-900">Proton Gradient</div>
              <div className="text-xs font-semibold text-slate-500">H⁺ in intermembrane space</div>
            </div>
            <Sparkles size={20} className="text-orange-600" />
          </div>
          <div className="mt-3 relative h-32 bg-gradient-to-t from-orange-50 to-orange-200 rounded-lg border border-orange-200 overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-500 to-orange-400 transition-all duration-200"
              style={{ height: `${protonGradient}%` }}
            />
            <div className="absolute top-2 right-2 font-mono text-xs font-bold text-orange-900">{Math.round(protonGradient)}%</div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-snug">
            For each ATP, <b>4 H⁺</b> pass through F₀ down the electrochemical gradient (NCERT §12.4.2).
          </p>
        </div>

        {/* H2O production */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="flex items-center justify-between text-sm font-bold text-slate-700">
            <span className="flex items-center gap-1"><Droplets size={14} className="text-sky-600" /> H₂O produced</span>
            <span className="font-mono text-sky-700">{h2oProduced}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">O₂ is reduced to H₂O at Complex IV.</p>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        {/* Theory card */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-amber-900">Electron Transport System</div>
          <div className="text-xs font-semibold text-amber-700 mt-0.5">NCERT Ch 12 · §12.4.2</div>
          <ul className="mt-2.5 text-sm leading-snug text-amber-950 space-y-1.5">
            <li>• <b>Complex I</b> (NADH dehydrogenase) — passes e⁻ to ubiquinone.</li>
            <li>• <b>Complex II</b> (Succinate dehydrogenase) — accepts e⁻ from FADH₂.</li>
            <li>• <b>Complex III</b> (Cytochrome bc₁) — passes e⁻ via cytochrome c.</li>
            <li>• <b>Complex IV</b> (Cytochrome c oxidase) — O₂ is the final acceptor → H₂O.</li>
            <li>• <b>Complex V</b> (ATP synthase) — F₀/F₁; 4 H⁺ per ATP.</li>
          </ul>
        </div>
        {/* Live values */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Row label="NADH consumed" value={nadhConsumed} color="cyan" />
            <Row label="FADH₂ consumed" value={fadh2Consumed} color="emerald" />
            <Row label="ATP produced" value={atpCount} color="amber" />
            <Row label="H⁺ in space" value={protonsRef.current.filter(p => p.phase === 'space').length} color="orange" />
          </div>
        </div>
      </div>
    </aside>
  );

  // ---------- SIM COMBO ----------
  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setPaused(p => !p)}
            className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50"
            title={paused ? 'Play' : 'Pause'}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50"
            title="Reset"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      {graphPanel}
      {valuesPanel}
    </div>
  );

  // ---------- CONTROLS ----------
  const controlsComponent = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
      <div className="flex items-center gap-2 mb-3">
        <Atom size={18} className="text-amber-600" />
        <h3 className="text-sm font-bold text-slate-800">Electron Transport Chain Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {/* Substrate selector */}
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Substrate</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['nadh', 'fadh2', 'mixed'] as Substrate[]).map(s => (
              <button
                key={s}
                onClick={() => setSubstrate(s)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  substrate === s ? 'bg-white text-amber-700 shadow' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {s === 'nadh' ? 'NADH only' : s === 'fadh2' ? 'FADH₂ only' : 'Mixed'}
              </button>
            ))}
          </div>
        </div>

        {/* Speed slider */}
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Flow speed</span>
            <span className="font-mono text-slate-700">{speed.toFixed(1)}×</span>
          </label>
          <input
            type="range" min={0.2} max={3} step={0.1} value={speed}
            onChange={e => setSpeed(parseFloat(e.target.value))}
            className="w-full mt-1 accent-amber-600"
          />
        </div>

        {/* O2 supply */}
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>O₂ supply</span>
            <span className="font-mono text-slate-700">{oxygenLevel}%</span>
          </label>
          <input
            type="range" min={0} max={100} step={5} value={oxygenLevel}
            onChange={e => setOxygenLevel(parseInt(e.target.value))}
            className="w-full mt-1 accent-sky-600"
          />
        </div>

        {/* Inhibitor toggles */}
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
            <Zap size={11} /> Inhibitor
          </label>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(['none', 'rotenone', 'antimycin', 'cyanide', 'uncoupler'] as Inhibitor[]).map(inh => (
              <button
                key={inh}
                onClick={() => setInhibitor(inh)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-colors ${
                  inhibitor === inh
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title={inh === 'none' ? 'No inhibitor' :
                       inh === 'rotenone' ? 'Blocks Complex I' :
                       inh === 'antimycin' ? 'Blocks Complex III' :
                       inh === 'cyanide' ? 'Blocks Complex IV' :
                       'Proton leak (e.g. DNP)'}
              >
                {inh === 'none' ? 'None' :
                 inh === 'rotenone' ? '⛔ Rotenone (I)' :
                 inh === 'antimycin' ? '⛔ Antimycin (III)' :
                 inh === 'cyanide' ? '⛔ Cyanide (IV)' :
                 '⛔ Uncoupler'}
              </button>
            ))}
          </div>
        </div>
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

const Row: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const bg: Record<string, string> = {
    cyan: 'bg-cyan-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50', orange: 'bg-orange-50',
  };
  const text: Record<string, string> = {
    cyan: 'text-cyan-700', emerald: 'text-emerald-700', amber: 'text-amber-700', orange: 'text-orange-700',
  };
  return (
    <div className={`rounded-lg border border-slate-100 ${bg[color] || 'bg-slate-50'} px-3 py-2.5`}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-0.5 font-mono text-base font-extrabold ${text[color] || 'text-slate-700'}`}>{value}</div>
    </div>
  );
};

export default ElectronTransportChainLab;
