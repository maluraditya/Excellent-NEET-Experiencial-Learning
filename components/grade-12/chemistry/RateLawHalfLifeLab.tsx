import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Pause, Play, RotateCcw, Activity } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

// ── NCERT Ch 3, §3.3 — Integrated Rate Equations (Table 3.4) ─────────────────
// Zero order (Eq 3.6):  [R] = [R]₀ − kt            t½ = [R]₀/(2k)
// First order (Eq 3.14): [R] = [R]₀·e^(−kt)        t½ = 0.693/k (Table 3.4)

const W = 1280, H = 760;
// Graph area (main [R] vs t plot)
const GX1 = 70, GX2 = 1000, GY1 = 50, GY2 = 700;
const GW = GX2 - GX1, GH = GY2 - GY1;
// Particle reactor (right side)
const PX1 = 1030, PX2 = 1255, PY1 = 55, PY2 = 460;

interface Particle { x: number; y: number; vx: number; vy: number; alive: boolean; }
interface Props { topic: any; onExit: () => void; }

function concentration(order: 0 | 1, R0: number, k: number, t: number): number {
  if (order === 0) return Math.max(0, R0 - k * t);
  return R0 * Math.exp(-k * t);
}

function halfLife(order: 0 | 1, R0: number, k: number): number {
  if (order === 0) return R0 / (2 * k);
  return 0.693 / k;
}

const RateLawHalfLifeLab: React.FC<Props> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const tRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const lastReactorUpdateRef = useRef(0);

  const [order, setOrder] = useState<0 | 1>(1);
  const [R0, setR0] = useState(1.0);      // mol/L
  const [kVal, setKVal] = useState(0.1);   // s⁻¹ for 1st, mol/L/s for 0th
  const [speed, setSpeed] = useState(1.0);
  const [paused, setPaused] = useState(false);
  const [showLn, setShowLn] = useState(false); // toggle ln[R] vs t linearization

  const t12 = halfLife(order, R0, kVal);
  // Total time axis: show ~4 half-lives (1st) or until [R]=0 (0th)
  const tMax = order === 0 ? R0 / kVal * 1.1 : t12 * 5;

  // Init reactor particles
  const initParticles = (n: number) => {
    particlesRef.current = Array.from({ length: n }, () => ({
      x: PX1 + 15 + Math.random() * (PX2 - PX1 - 30),
      y: PY1 + 15 + Math.random() * (PY2 - PY1 - 30),
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      alive: true,
    }));
    tRef.current = 0;
  };

  useEffect(() => { initParticles(40); }, [order, R0, kVal]);

  const toGX = (t: number) => GX1 + (t / tMax) * GW;
  const toGY = (val: number, vMin: number, vMax: number) => GY2 - ((val - vMin) / (vMax - vMin)) * GH;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;

    const draw = (ts: number) => {
      // Advance time
      if (!paused) {
        tRef.current = Math.min(tMax, tRef.current + 0.016 * speed * (tMax / 20));
      }
      const tCur = tRef.current;
      const Rcur = concentration(order, R0, kVal, tCur);
      const frac = R0 > 0 ? Rcur / R0 : 0;

      // Update reactor particles
      if (!paused && ts - lastReactorUpdateRef.current > 30) {
        lastReactorUpdateRef.current = ts;
        const targetAlive = Math.round(frac * 40);
        let aliveCount = particlesRef.current.filter(p => p.alive).length;
        while (aliveCount > targetAlive) {
          const alive = particlesRef.current.filter(p => p.alive);
          if (alive.length === 0) break;
          alive[Math.floor(Math.random() * alive.length)].alive = false;
          aliveCount--;
        }
        while (aliveCount < targetAlive) {
          const dead = particlesRef.current.filter(p => !p.alive);
          if (dead.length === 0) break;
          dead[Math.floor(Math.random() * dead.length)].alive = true;
          aliveCount++;
        }
      }
      for (const p of particlesRef.current) {
        if (!p.alive) continue;
        p.x += p.vx; p.y += p.vy;
        if (p.x < PX1 + 8 || p.x > PX2 - 8) p.vx *= -1;
        if (p.y < PY1 + 8 || p.y > PY2 - 8) p.vy *= -1;
      }

      ctx.clearRect(0, 0, W, H);

      // ── Graph area ─────────────────────────────────────────
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.roundRect(GX1 - 12, GY1 - 12, GW + 24, GH + 24, 14); ctx.fill();
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.stroke();

      // Determine y-axis range
      let yMin: number, yMax: number, yLabel: string;
      if (showLn) {
        yLabel = 'ln[R]';
        yMin = Math.log(R0) - 4; yMax = Math.log(R0) + 0.5;
      } else {
        yLabel = '[R]  /  mol L⁻¹';
        yMin = 0; yMax = R0 * 1.05;
      }

      // Grid
      for (let i = 0; i <= 5; i++) {
        const gx = toGX((i / 5) * tMax);
        const gy = GY1 + (i / 5) * GH;
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(gx, GY1); ctx.lineTo(gx, GY2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(GX1, gy); ctx.lineTo(GX2, gy); ctx.stroke();
      }

      // Axes
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(GX1, GY1); ctx.lineTo(GX1, GY2); ctx.lineTo(GX2, GY2); ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#475569'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Time / s', (GX1 + GX2) / 2, GY2 + 36);
      ctx.save(); ctx.translate(GX1 - 48, (GY1 + GY2) / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText(showLn ? 'ln[R]' : '[R]  /  mol L⁻¹', 0, 0); ctx.restore();

      ctx.font = '11px Inter'; ctx.fillStyle = '#64748b';
      for (let i = 0; i <= 5; i++) {
        ctx.textAlign = 'center';
        ctx.fillText(((i / 5) * tMax).toFixed(1), toGX((i / 5) * tMax), GY2 + 16);
        const yv = yMin + (i / 5) * (yMax - yMin);
        ctx.textAlign = 'right';
        ctx.fillText(yv.toFixed(2), GX1 - 6, toGY(yv, yMin, yMax) + 4);
      }

      // Half-life horizontal dashed markers
      let Rn = R0;
      for (let h = 0; h < 5; h++) {
        const Rhalf = Rn / 2;
        if (Rhalf <= 0) break;
        const yv = showLn ? Math.log(Rhalf) : Rhalf;
        if (yv >= yMin && yv <= yMax) {
          ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.8; ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(GX1, toGY(yv, yMin, yMax));
          ctx.lineTo(GX2, toGY(yv, yMin, yMax));
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter'; ctx.textAlign = 'left';
          ctx.fillText(`[R]₀/${Math.pow(2, h + 1).toFixed(0)}`, GX2 + 4, toGY(yv, yMin, yMax) + 4);
        }

        // Vertical t½ marker
        let t_at_half: number;
        if (order === 0) {
          t_at_half = (R0 - Rhalf) / kVal;
        } else {
          t_at_half = -Math.log(Rhalf / R0) / kVal;
        }
        if (t_at_half <= tMax) {
          ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 0.8; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(toGX(t_at_half), GY1); ctx.lineTo(toGX(t_at_half), GY2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#6366f1'; ctx.font = '9px Inter'; ctx.textAlign = 'center';
          ctx.fillText(`t½${h + 1}`, toGX(t_at_half), GY1 + 12 + h * 1);
        }
        Rn = Rhalf;
      }

      // Full curve (muted)
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      let first = true;
      for (let t = 0; t <= tMax; t += tMax / 500) {
        const Rv = concentration(order, R0, kVal, t);
        if (Rv < 0) break;
        const yv = showLn ? Math.log(Math.max(1e-9, Rv)) : Rv;
        const py = toGY(yv, yMin, yMax);
        if (py < GY1 - 5 || py > GY2 + 5) { first = true; continue; }
        first ? ctx.moveTo(toGX(t), py) : ctx.lineTo(toGX(t), py);
        first = false;
      }
      ctx.stroke();

      // Filled curve up to current time
      ctx.strokeStyle = order === 0 ? '#2563eb' : '#16a34a';
      ctx.lineWidth = 3;
      ctx.beginPath(); first = true;
      for (let t = 0; t <= tCur; t += tCur / 300 + 0.001) {
        const Rv = concentration(order, R0, kVal, t);
        if (Rv < 0) break;
        const yv = showLn ? Math.log(Math.max(1e-9, Rv)) : Rv;
        const py = toGY(yv, yMin, yMax);
        if (py < GY1 - 5 || py > GY2 + 5) { first = true; continue; }
        first ? ctx.moveTo(toGX(t), py) : ctx.lineTo(toGX(t), py);
        first = false;
      }
      ctx.stroke();

      // Current point
      const yCur = showLn ? Math.log(Math.max(1e-9, Rcur)) : Rcur;
      const cPy = toGY(yCur, yMin, yMax);
      if (cPy >= GY1 - 10 && cPy <= GY2 + 10) {
        const cCol = order === 0 ? '#2563eb' : '#16a34a';
        const pr = 12 + 5 * (0.5 + 0.5 * Math.sin(ts / 1000 * 3));
        ctx.strokeStyle = cCol + '66'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(toGX(tCur), cPy, pr, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = cCol;
        ctx.beginPath(); ctx.arc(toGX(tCur), cPy, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      }

      // Order label on canvas
      ctx.fillStyle = order === 0 ? '#2563eb' : '#16a34a';
      ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left';
      ctx.fillText(order === 0 ? 'Zero order: [R] = [R]₀ − kt' : 'First order: [R] = [R]₀e^(−kt)', GX1 + 8, GY1 + 24);
      ctx.font = '12px Inter'; ctx.fillStyle = '#64748b';
      ctx.fillText(`k = ${kVal.toFixed(3)}  ·  t½ = ${t12.toFixed(2)} s  ·  [R]₀ = ${R0.toFixed(2)} mol/L`, GX1 + 8, GY1 + 44);

      // Reset when full time elapsed
      if (!paused && tCur >= tMax) {
        tRef.current = 0;
        initParticles(40);
      }

      // ── Reactor display ───────────────────────────────────
      ctx.fillStyle = '#f0fdf4'; ctx.strokeStyle = '#86efac'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(PX1, PY1, PX2 - PX1, PY2 - PY1, 10); ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#166534'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
      ctx.fillText('Reactor', (PX1 + PX2) / 2, PY1 - 8);
      ctx.font = '10px Inter'; ctx.fillStyle = '#15803d';
      ctx.fillText('[R] molecules', (PX1 + PX2) / 2, PY2 + 14);

      const molColor = order === 0 ? '#2563eb' : '#16a34a';
      for (const p of particlesRef.current) {
        if (!p.alive) continue;
        ctx.save();
        ctx.shadowColor = molColor;
        ctx.shadowBlur = 7;
        ctx.fillStyle = order === 0 ? '#bfdbfe' : '#bbf7d0';
        ctx.strokeStyle = molColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
      }

      const aliveN = particlesRef.current.filter(p => p.alive).length;
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 18px Inter'; ctx.textAlign = 'center';
      ctx.fillText(`${aliveN} / 40`, (PX1 + PX2) / 2, PY2 + 36);

      // Time display below reactor
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 13px Inter';
      ctx.fillText(`t = ${tCur.toFixed(2)} s`, (PX1 + PX2) / 2, PY2 + 56);
      ctx.fillStyle = '#64748b'; ctx.font = '11px Inter';
      ctx.fillText(`[R] = ${Rcur.toFixed(3)} mol/L`, (PX1 + PX2) / 2, PY2 + 74);

      // Stopwatch arc
      const arcCx = (PX1 + PX2) / 2, arcCy = PY2 + 120, arcR = 36;
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(arcCx, arcCy, arcR, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = order === 0 ? '#2563eb' : '#16a34a'; ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(arcCx, arcCy, arcR, -Math.PI / 2, -Math.PI / 2 + (tCur / tMax) * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 11px Inter';
      ctx.fillText(`${((tCur / tMax) * 100).toFixed(0)}%`, arcCx, arcCy + 4);

      if (!paused) animId = requestAnimationFrame(draw);
    };

    draw(performance.now()); // immediate first paint (does not depend on rAF firing)
    return () => cancelAnimationFrame(animId);
  }, [paused, order, R0, kVal, speed, tMax, t12, showLn]);

  const graphPanel = useMemo(() => (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[330px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <h3 className="text-sm font-extrabold text-slate-900">NCERT Table 3.4 Summary</h3>
          <p className="text-[11px] font-semibold text-slate-500">Integrated rate laws — zero & first order</p>
          <div className="mt-2 space-y-2 text-[11px]">
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-2">
              <div className="font-black text-blue-800 mb-1">Zero Order  (Eq 3.6)</div>
              <div className="font-mono text-blue-700">[R] = [R]₀ − kt</div>
              <div className="font-mono text-blue-700">t½ = [R]₀ / 2k</div>
              <div className="font-mono text-blue-600 text-[10px] mt-1">plot: [R] vs t → straight line</div>
              <div className="font-mono text-blue-600 text-[10px]">k units: mol L⁻¹ s⁻¹</div>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-100 p-2">
              <div className="font-black text-green-800 mb-1">First Order  (Eq 3.14)</div>
              <div className="font-mono text-green-700">[R] = [R]₀·e^(−kt)</div>
              <div className="font-mono text-green-700">t½ = 0.693 / k</div>
              <div className="font-mono text-green-600 text-[10px] mt-1">plot: ln[R] vs t → straight line</div>
              <div className="font-mono text-green-600 text-[10px]">k units: s⁻¹</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <h3 className="text-sm font-extrabold text-slate-900">Half-life comparison</h3>
          <p className="text-[11px] font-semibold text-slate-500">Key contrast: t½ dependence on [R]₀</p>
          <div className="mt-2 space-y-2 text-[12px] font-semibold">
            <div className={`rounded p-2 ${order === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
              <span className="font-black text-blue-700">0th order: </span>
              <span className="text-blue-600 font-mono">t½ ∝ [R]₀</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Successive half-lives get shorter (each starts from smaller [R]₀)</p>
            </div>
            <div className={`rounded p-2 ${order === 1 ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
              <span className="font-black text-green-700">1st order: </span>
              <span className="text-green-600 font-mono">t½ = 0.693/k</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Constant — independent of [R]₀. Used in radioactive decay.</p>
            </div>
          </div>
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 p-2 text-[11px] font-semibold text-amber-800">
            NCERT example: t½ for k=5.5×10⁻¹⁴ s⁻¹ → t½ = 0.693/(5.5×10⁻¹⁴) = 1.26×10¹³ s
          </div>
        </div>
      </div>
    </aside>
  ), [order]);

  const valuesPanel = useMemo(() => (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[300px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className={`rounded-2xl border p-4 shadow-xl ${order === 0 ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
          <h3 className={`text-sm font-extrabold ${order === 0 ? 'text-blue-950' : 'text-green-950'}`}>Rate Laws — NCERT Ch 3</h3>
          <p className={`text-[11px] font-semibold ${order === 0 ? 'text-blue-700' : 'text-green-700'}`}>§3.3 Integrated Rate Equations</p>
          <div className={`mt-2 space-y-1 text-[12px] font-semibold ${order === 0 ? 'text-blue-950' : 'text-green-950'}`}>
            {order === 0 ? (
              <>
                <p>Rate = k  (zero power of [R]) </p>
                <p>[R] = [R]₀ − kt &nbsp;(Eq 3.6)</p>
                <p>k = ([R]₀ − [R]) / t &nbsp;(Eq 3.7)</p>
                <p>t½ = [R]₀ / (2k)  &nbsp;→ shrinks</p>
                <p className="text-[10px] text-blue-700 mt-1">Example: NH₃ decomp on Pt at high P (NCERT §3.3.1)</p>
              </>
            ) : (
              <>
                <p>Rate = k[R]  (first power)</p>
                <p>[R] = [R]₀ · e^(−kt) &nbsp;(Eq 3.14)</p>
                <p>k = (2.303/t) log([R]₀/[R]) &nbsp;(Eq 3.10)</p>
                <p>t½ = 0.693/k &nbsp;→ constant</p>
                <p className="text-[10px] text-green-700 mt-1">Example: radioactive decay, N₂O₅ decomp (NCERT §3.3.2)</p>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Real-time values</h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</span>
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              { label: 'Reaction order', value: order === 0 ? 'Zero  (Rate = k)' : 'First  (Rate = k[R])', tint: 'bg-slate-50', col: 'text-slate-800' },
              { label: '[R]₀  (mol/L)', value: R0.toFixed(3), tint: 'bg-slate-50', col: 'text-slate-700' },
              { label: 'k  (rate constant)', value: order === 0 ? `${kVal.toFixed(4)} mol/L/s` : `${kVal.toFixed(4)} s⁻¹`, tint: 'bg-amber-50', col: 'text-amber-700' },
              { label: 't½  (half-life)', value: `${t12.toFixed(3)} s`, tint: order === 0 ? 'bg-blue-50' : 'bg-green-50', col: order === 0 ? 'text-blue-700' : 'text-green-700' },
            ].map(row => (
              <div key={row.label} className={`rounded-lg border border-slate-100 ${row.tint} px-3 py-2`}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                <div className={`mt-0.5 font-mono text-sm font-extrabold ${row.col}`}>{row.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] font-semibold text-slate-600">
            {order === 0
              ? 'Zero order: t½ shrinks each successive half-life because the new [R]₀ is halved.'
              : 'First order: t½ constant — the fraction converted per unit time is always the same.'}
          </div>
        </div>
      </div>
    </aside>
  ), [order, R0, kVal, t12]);

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
          <button onClick={() => setPaused(v => !v)} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50">
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button onClick={() => { tRef.current = 0; initParticles(40); setPaused(false); }}
            className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      {graphPanel}
      {valuesPanel}
    </div>
  );

  const controls = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
        <Activity size={18} className="text-green-600" />
        Rate Laws &amp; Half-life Bench
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Reaction order</div>
            <div className="grid grid-cols-2 gap-2">
              {([0, 1] as const).map(o => (
                <button key={o} onClick={() => { setOrder(o); tRef.current = 0; }}
                  className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 text-sm font-extrabold transition ${order === o ? (o === 0 ? 'border-blue-500 bg-blue-500 text-white' : 'border-green-500 bg-green-500 text-white') : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                  {o === 0 ? '0th order' : '1st order'}
                  <span className={`text-[9px] font-bold ${order === o ? 'text-white/80' : 'text-slate-400'}`}>{o === 0 ? 'Rate = k' : 'Rate = k[R]'}</span>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowLn(v => !v)}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition ${showLn ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
            {showLn ? 'Showing ln[R] vs t  (1st order → straight line)' : 'Linearise: show ln[R] vs t'}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>[R]₀ initial conc.</span><span className="font-mono text-slate-700">{R0.toFixed(2)} mol/L</span>
            </div>
            <input className="w-full accent-slate-600" type="range" min={0.2} max={2.0} step={0.05}
              value={R0} onChange={e => { setR0(Number(e.target.value)); tRef.current = 0; }} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>k rate constant</span><span className="font-mono text-slate-700">{kVal.toFixed(3)} {order === 0 ? 'mol/L/s' : 's⁻¹'}</span>
            </div>
            <input className={`w-full ${order === 0 ? 'accent-blue-600' : 'accent-green-600'}`} type="range"
              min={0.02} max={order === 0 ? 0.2 : 0.5} step={0.005}
              value={kVal} onChange={e => { setKVal(Number(e.target.value)); tRef.current = 0; }} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>Animation speed</span><span className="font-mono text-slate-700">{speed.toFixed(1)}×</span>
            </div>
            <input className="w-full accent-violet-600" type="range" min={0.2} max={4} step={0.1}
              value={speed} onChange={e => setSpeed(Number(e.target.value))} />
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
      ControlsComponent={controls}
      controlsAreaFlex="0 0 200px"
      simulationStageWidth={W}
      simulationStageHeight={H}
      rootClassName="bg-white text-slate-900"
      simulationClassName="overflow-hidden bg-white"
      contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
    />
  );
};

export default RateLawHalfLifeLab;
