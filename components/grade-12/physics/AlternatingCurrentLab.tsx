import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, Activity, Eye, EyeOff } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface ACLabProps {
  topic: any;
  onExit: () => void;
}

type SimulationMode = 'transformer' | 'transmission';

const CANVAS_W = 1280;
const CANVAS_H = 760;
const HISTORY_SIZE = 200;
const OMEGA_VISUAL = 2 * Math.PI * 1.5; // visual angular frequency (not real 50Hz)

// ── Helper utilities ──────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string,
  size: number
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(angle - 0.42), y - size * Math.sin(angle - 0.42));
  ctx.lineTo(x - size * Math.cos(angle + 0.42), y - size * Math.sin(angle + 0.42));
  ctx.closePath();
  ctx.fill();
}

function pushHistory(arr: number[], val: number) {
  arr.push(val);
  if (arr.length > HISTORY_SIZE) arr.shift();
}

// Wire path descriptor – list of [x,y] waypoints
type WirePath = [number, number][];

function wireLength(path: WirePath): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dy = path[i][1] - path[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

function pointOnWire(path: WirePath, t: number): [number, number] {
  const total = wireLength(path);
  let target = clamp(t, 0, 1) * total;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dy = path[i][1] - path[i - 1][1];
    const seg = Math.sqrt(dx * dx + dy * dy);
    if (target <= seg) {
      const frac = seg > 0 ? target / seg : 0;
      return [path[i - 1][0] + dx * frac, path[i - 1][1] + dy * frac];
    }
    target -= seg;
  }
  return path[path.length - 1];
}

function strokeWire(ctx: CanvasRenderingContext2D, path: WirePath, color: string, lw = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  path.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
}

// ── Main Component ─────────────────────────────────────────────────────────────

const AlternatingCurrentLab: React.FC<ACLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const lastTimeRef = useRef<number>(performance.now());

  const [mode, setMode] = useState<SimulationMode>('transformer');
  const [isPlaying, setIsPlaying] = useState(true);

  // Transformer controls
  const [primaryTurns, setPrimaryTurns] = useState(100);
  const [secondaryTurns, setSecondaryTurns] = useState(200);
  const [inputVoltagePeak, setInputVoltagePeak] = useState(220);
  const [showLosses, setShowLosses] = useState(false);

  // Sim time
  const tRef = useRef(0);

  // Waveform ring-buffers (held in refs so canvas reads latest without re-renders)
  const vpHistRef = useRef<number[]>([]);
  const vsHistRef = useRef<number[]>([]);
  const fluxHistRef = useRef<number[]>([]);

  // Current-flow dots – 8 per wire side
  const primaryTopDotsRef = useRef<number[]>(
    Array.from({ length: 8 }, (_, i) => i / 8)
  );
  const primaryBotDotsRef = useRef<number[]>(
    Array.from({ length: 8 }, (_, i) => i / 8)
  );
  const secondaryTopDotsRef = useRef<number[]>(
    Array.from({ length: 8 }, (_, i) => i / 8)
  );
  const secondaryBotDotsRef = useRef<number[]>(
    Array.from({ length: 8 }, (_, i) => i / 8)
  );
  // Transmission dots
  const transDotsRef = useRef<number[]>(
    Array.from({ length: 12 }, (_, i) => i / 12)
  );

  // Smoothed flux for color
  const displayFluxRef = useRef(0);

  // Live data update throttle
  const dataTimerRef = useRef(0);

  const [liveData, setLiveData] = useState({
    vpPeak: 220,
    vpRms: 155.6,
    vsPeak: 440,
    vsRms: 311.1,
    ipRms: 4.55,
    isRms: 2.27,
    ratio: 2.0,
    efficiency: 100,
    ppW: 707.7,
    psW: 707.7,
    transformerType: 'STEP-UP',
  });

  // ── Canvas init (fixed 1280×760, once on mount) ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
  }, []);

  // ── Reset helper ─────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    tRef.current = 0;
    vpHistRef.current = [];
    vsHistRef.current = [];
    fluxHistRef.current = [];
    displayFluxRef.current = 0;
    lastTimeRef.current = performance.now();
  }, []);

  // ── Render loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timeMs: number) => {
      const dt = isPlaying ? Math.min((timeMs - lastTimeRef.current) / 1000, 0.1) : 0;
      lastTimeRef.current = timeMs;

      if (isPlaying) tRef.current += dt;
      const t = tRef.current;
      const omega = OMEGA_VISUAL;

      // Physics
      const ratio = secondaryTurns / primaryTurns;
      const efficiency = showLosses ? 0.92 : 1.0;
      const vpPeak = inputVoltagePeak;
      const vsPeak = vpPeak * ratio;
      const fluxPeak = vpPeak / (primaryTurns * omega);
      const flux = -fluxPeak * Math.cos(omega * t); // lags voltage by 90°
      const vp = vpPeak * Math.sin(omega * t);
      const vs = vsPeak * Math.sin(omega * t);

      // Reference load 1000 W for illustration
      const referenceLoad = Math.max(1, vpPeak * vpPeak / (2 * 1000)); // keep power sensible
      const ipRms = (vpPeak / Math.SQRT2) / referenceLoad;
      const isRms = ipRms * (primaryTurns / secondaryTurns) * efficiency;
      const vpRms = vpPeak / Math.SQRT2;
      const vsRms = vsPeak / Math.SQRT2;
      const ppW = vpRms * ipRms;
      const psW = ppW * efficiency;

      // Smooth flux for color
      displayFluxRef.current = displayFluxRef.current * 0.9 + flux * 0.1;
      const dFlux = displayFluxRef.current;
      const fluxIntensity = clamp(Math.abs(dFlux) / fluxPeak, 0, 1);

      // Push waveform history
      pushHistory(vpHistRef.current, vp);
      pushHistory(vsHistRef.current, vs);
      pushHistory(fluxHistRef.current, flux);

      // Update current-flow dots
      const dotSpeed = 0.18;
      const sign = Math.sin(omega * t) > 0 ? 1 : -1;
      const updateDots = (dots: number[]) => {
        for (let i = 0; i < dots.length; i++) {
          dots[i] = (dots[i] + sign * dotSpeed * dt + 1) % 1;
        }
      };
      if (isPlaying) {
        updateDots(primaryTopDotsRef.current);
        updateDots(primaryBotDotsRef.current);
        updateDots(secondaryTopDotsRef.current);
        updateDots(secondaryBotDotsRef.current);
        const tDots = transDotsRef.current;
        for (let i = 0; i < tDots.length; i++) {
          tDots[i] = (tDots[i] + 0.05 * dt + 1) % 1;
        }
      }

      // Throttled live state update
      dataTimerRef.current += dt;
      if (dataTimerRef.current > 0.05) {
        dataTimerRef.current = 0;
        const transformerType =
          secondaryTurns > primaryTurns
            ? 'STEP-UP'
            : secondaryTurns < primaryTurns
            ? 'STEP-DOWN'
            : 'ISOLATION';
        setLiveData({
          vpPeak,
          vpRms: +vpRms.toFixed(1),
          vsPeak,
          vsRms: +vsRms.toFixed(1),
          ipRms: +ipRms.toFixed(2),
          isRms: +isRms.toFixed(2),
          ratio: +ratio.toFixed(2),
          efficiency: Math.round(efficiency * 100),
          ppW: +ppW.toFixed(1),
          psW: +psW.toFixed(1),
          transformerType,
        });
      }

      // ── Draw ──────────────────────────────────────────────────────────────────
      drawBackground(ctx);

      if (mode === 'transformer') {
        drawTransformerMode(
          ctx, t, omega,
          primaryTurns, secondaryTurns,
          vpPeak, vsPeak, vp, vs,
          fluxIntensity, dFlux, fluxPeak,
          vpHistRef.current, vsHistRef.current, fluxHistRef.current,
          primaryTopDotsRef.current, primaryBotDotsRef.current,
          secondaryTopDotsRef.current, secondaryBotDotsRef.current,
          efficiency, ipRms, isRms, vpRms, vsRms, ppW, psW
        );
      } else {
        drawTransmissionMode(ctx, t, omega, transDotsRef.current);
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [mode, isPlaying, primaryTurns, secondaryTurns, inputVoltagePeak, showLosses]);

  // ── Derived values for controls display ──────────────────────────────────────
  const ratio = (secondaryTurns / primaryTurns).toFixed(2);
  const transformerType =
    secondaryTurns > primaryTurns
      ? 'STEP-UP ▲'
      : secondaryTurns < primaryTurns
      ? 'STEP-DOWN ▼'
      : 'ISOLATION =';
  const vpRmsDisplay = (inputVoltagePeak / Math.SQRT2).toFixed(1);

  // ── Side panels (layout standard) ────────────────────────────────────────────
  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 z-20 hidden w-[360px] 2xl:block">
      <div className="flex flex-col gap-3">
        {mode === 'transformer' && (
          <>
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-xl">
              <div className="text-lg font-extrabold text-white">Voltage Waveforms</div>
              <div className="mt-1 text-sm font-semibold text-slate-300">Vp(t) vs Vs(t) — same phase, scaled by Ns/Np</div>
              <WaveformSvg
                series={[
                  { data: vpHistRef.current, color: '#ef4444', label: 'Vp' },
                  { data: vsHistRef.current, color: '#3b82f6', label: 'Vs' },
                ]}
                amplitude={Math.max(Math.abs(inputVoltagePeak), Math.abs(inputVoltagePeak * secondaryTurns / primaryTurns))}
                readout={`Vp=${liveData.vpRms}V rms  Vs=${liveData.vsRms}V rms`}
              />
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-xl">
              <div className="text-lg font-extrabold text-white">Magnetic Flux Φ(t)</div>
              <div className="mt-1 text-sm font-semibold text-slate-300">Φ lags voltage by 90° (NCERT §7.8)</div>
              <WaveformSvg
                series={[{ data: fluxHistRef.current, color: '#facc15', label: 'Φ' }]}
                amplitude={Math.max(0.0001, inputVoltagePeak / (primaryTurns * OMEGA_VISUAL))}
                readout="Φ = −(Vp/(Np·ω))cos(ωt)"
                phaseAnnotation
              />
            </div>
          </>
        )}
        {mode === 'transmission' && (
          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-xl">
            <div className="text-lg font-extrabold text-white">Power Loss Analysis</div>
            <div className="mt-1 text-sm font-semibold text-slate-300">Pc = I²Rc — minimized at high V, low I</div>
            <svg viewBox="0 0 340 220" className="mt-2 w-full">
              <rect x="0" y="0" width="340" height="220" fill="#020617" rx="8" />
              {[11, 33, 132].map((v, i) => {
                const barH = Math.max(4, (1 / (v * v)) * 18000);
                const x = 30 + i * 90;
                return (
                  <g key={v}>
                    <rect x={x} y={190 - barH} width={60} height={barH} fill={i === 2 ? '#22c55e' : '#ef4444'} rx="3" opacity="0.85" />
                    <text x={x + 30} y={210} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">{v} kV</text>
                    <text x={x + 30} y={190 - barH - 6} textAnchor="middle" fill={i === 2 ? '#22c55e' : '#ef4444'} fontSize="10" fontWeight="bold">
                      {i === 2 ? 'min' : i === 0 ? 'high' : 'med'}
                    </text>
                  </g>
                );
              })}
              <text x="170" y="20" textAnchor="middle" fill="#f1f5f9" fontSize="12" fontWeight="bold">Relative I²R Loss</text>
              <text x="170" y="38" textAnchor="middle" fill="#94a3b8" fontSize="10">Lower voltage = more cable loss</text>
            </svg>
          </div>
        )}
      </div>
    </aside>
  );

  const formulaPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 z-20 hidden w-[310px] 2xl:block">
      <div className="rounded-xl border border-amber-200 bg-amber-50/95 p-4 text-amber-950 shadow-xl backdrop-blur">
        <div className="text-base font-extrabold">
          {mode === 'transformer' ? 'Transformer — NCERT §7.8' : 'Power Transmission — NCERT §7.8 p.196'}
        </div>
        <div className="mt-2 space-y-1.5 text-sm leading-snug text-amber-900">
          {mode === 'transformer' ? (
            <>
              <p>εs = −Ns dΦ/dt (NCERT Eq. 7.31)</p>
              <p>εp = −Np dΦ/dt = vp (Eq. 7.32)</p>
              <p className="font-bold">Vs/Vp = Ns/Np (Eq. 7.33)</p>
              <p className="font-bold">Ip × Vp = Is × Vs (Eq. 7.34)</p>
              <p>Is = (Np/Ns) × Ip (Eq. 7.36)</p>
              <p>Efficiency &gt; 95% (well-designed)</p>
            </>
          ) : (
            <>
              <p>Generator → Step-up → Long line</p>
              <p>→ Sub-station → Homes (240 V)</p>
              <p className="font-bold">Pc = I²Rc (cable power loss)</p>
              <p className="font-bold">Higher V → Lower I → Less loss</p>
              <p>Pc ∝ 1/V² for fixed power P</p>
              <p>India: 11 kV → 132 kV → 33 kV → 240 V</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">Live</span>
        </div>
        {mode === 'transformer' ? (
          <div className="grid gap-2">
            {[
              { label: 'Turns ratio k', value: `${liveData.ratio}`, color: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'Vp (rms)', value: `${liveData.vpRms} V`, color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'Vs (rms)', value: `${liveData.vsRms} V`, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Ip (rms)', value: `${liveData.ipRms} A`, color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'Is (rms)', value: `${liveData.isRms} A`, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Efficiency', value: `${liveData.efficiency}%`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg border border-slate-100 ${item.bg} px-3 py-2.5`}>
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
                <div className={`mt-1 font-mono text-base font-extrabold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-2">
            {[
              { label: 'Generator', value: '11 kV', color: 'text-red-700', bg: 'bg-red-50' },
              { label: 'After step-up', value: '132 kV', color: 'text-amber-700', bg: 'bg-amber-50' },
              { label: 'Area sub-station', value: '33 kV', color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Home supply', value: '240 V', color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Line loss ratio', value: '∝ 1/V²', color: 'text-purple-700', bg: 'bg-purple-50' },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg border border-slate-100 ${item.bg} px-3 py-2.5`}>
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
                <div className={`mt-1 font-mono text-base font-extrabold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-slate-900 shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-900">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {graphPanel}
      {formulaPanel}
    </div>
  );

  // ── Controls ──────────────────────────────────────────────────────────────────
  const controlsCombo = (
    <div className="w-full space-y-4 p-4">
      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { setMode('transformer'); reset(); }}
          className={tabCls(mode === 'transformer')}
        >
          <Zap size={18} /> Transformer
        </button>
        <button
          onClick={() => { setMode('transmission'); reset(); }}
          className={tabCls(mode === 'transmission')}
        >
          <Activity size={18} /> Power Transmission
        </button>
      </div>

      {mode === 'transformer' && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Column 1 — Primary */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 border-b pb-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              Primary Coil (Input)
            </h4>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                <span>Turns (Np)</span>
                <span className="text-red-600 font-mono bg-red-50 px-2 rounded border border-red-200">{primaryTurns}</span>
              </label>
              <input
                type="range" min="20" max="500" step="10"
                value={primaryTurns}
                onChange={(e) => setPrimaryTurns(Number(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                <span>Peak Voltage (Vp)</span>
                <span className="text-red-600 font-mono bg-red-50 px-2 rounded border border-red-200">{inputVoltagePeak} V</span>
              </label>
              <input
                type="range" min="10" max="440" step="10"
                value={inputVoltagePeak}
                onChange={(e) => setInputVoltagePeak(Number(e.target.value))}
                className="w-full accent-red-400"
              />
              <div className="text-xs text-slate-500">Vrms = {vpRmsDisplay} V</div>
            </div>
          </div>

          {/* Column 2 — Secondary */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 border-b pb-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              Secondary Coil (Output)
            </h4>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                <span>Turns (Ns)</span>
                <span className="text-blue-600 font-mono bg-blue-50 px-2 rounded border border-blue-200">{secondaryTurns}</span>
              </label>
              <input
                type="range" min="20" max="500" step="10"
                value={secondaryTurns}
                onChange={(e) => setSecondaryTurns(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
              <span className="text-sm font-bold text-slate-700">k = Ns/Np = {ratio}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                secondaryTurns > primaryTurns
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : secondaryTurns < primaryTurns
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-slate-200 text-slate-600 border border-slate-300'
              }`}>{transformerType}</span>
            </div>

            {/* Loss toggle */}
            <button
              onClick={() => setShowLosses(v => !v)}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
                showLosses
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {showLosses ? <Eye size={16} /> : <EyeOff size={16} />}
              Show Energy Losses
            </button>

            {showLosses && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs space-y-1 text-orange-900">
                <div className="font-bold text-sm border-b border-orange-200 pb-1">Real Transformer Losses (NCERT p.195-196)</div>
                <div>⚡ Flux Leakage: −2%  <span className="text-orange-600">(remedy: coils wound over each other)</span></div>
                <div>🔥 Copper Loss I²R: −3%  <span className="text-orange-600">(remedy: thick wire)</span></div>
                <div>🌀 Eddy Currents: −2%  <span className="text-orange-600">(remedy: laminated core)</span></div>
                <div>↻ Hysteresis: −1%  <span className="text-orange-600">(remedy: low-hysteresis material)</span></div>
                <div className="font-bold text-orange-800 border-t border-orange-200 pt-1">Total efficiency ≈ 92%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'transmission' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900 text-sm space-y-1">
          <p className="font-bold">Step-up at generator → High-V transmission → Step-down at sub-station → 240V homes</p>
          <p>I²R loss is minimized by transmitting at high voltage / low current</p>
          <p className="font-mono text-xs">A 220V, 10A input stepped up to 440V gives only 5A (NCERT example, §7.8 p.195)</p>
        </div>
      )}

      {/* Playback controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsPlaying(v => !v)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RotateCcw size={18} /> Reset
        </button>
      </div>
    </div>
  );

  return (
    <TopicLayoutContainer
      topic={topic}
      onExit={onExit}
      SimulationComponent={simulationCombo}
      ControlsComponent={controlsCombo}
    />
  );
};

// ── Tab helper ────────────────────────────────────────────────────────────────

function tabCls(active: boolean) {
  return `flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-extrabold transition-all ${
    active
      ? 'border-2 border-blue-400 bg-blue-100 text-blue-800 shadow-sm'
      : 'border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
  }`;
}

// ── SVG Waveform component (for side panel) ───────────────────────────────────

function WaveformSvg({
  series,
  amplitude,
  readout,
  phaseAnnotation = false,
}: {
  series: { data: number[]; color: string; label: string }[];
  amplitude: number;
  readout: string;
  phaseAnnotation?: boolean;
}) {
  // Generous height so waveforms are tall and easy to read from a distance
  const W = 320;
  const H = 160;
  const PAD_L = 10;
  const PAD_T = 8;
  const LEGEND_H = phaseAnnotation ? 44 : 36;
  const safe = Math.max(0.0001, amplitude);

  const makePath = (data: number[]) => {
    if (data.length === 0) return `M${PAD_L} ${PAD_T + H / 2}`;
    return data
      .map((v, i) => {
        const x = PAD_L + (i / Math.max(1, HISTORY_SIZE - 1)) * W;
        const y = PAD_T + H / 2 - clamp(v / safe, -1, 1) * (H * 0.46);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const totalH = PAD_T + H + LEGEND_H;
  const totalW = PAD_L + W + 6;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="mt-2 w-full">
      <rect width={totalW} height={totalH} fill="#020617" rx="8" />

      {/* horizontal grid */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={PAD_L} y1={PAD_T + H * f}
          x2={PAD_L + W} y2={PAD_T + H * f}
          stroke={f === 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}
          strokeDasharray={f === 0.5 ? '6 5' : undefined}
        />
      ))}

      {/* Y axis */}
      <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + H} stroke="rgba(255,255,255,0.25)" />
      {/* X axis (bottom of graph) */}
      <line x1={PAD_L} y1={PAD_T + H} x2={PAD_L + W} y2={PAD_T + H} stroke="rgba(255,255,255,0.18)" />

      {/* axis labels */}
      <text x={PAD_L - 2} y={PAD_T + 10} textAnchor="end" fill="#64748b" fontSize="11" fontWeight="bold">+</text>
      <text x={PAD_L - 2} y={PAD_T + H - 4} textAnchor="end" fill="#64748b" fontSize="11" fontWeight="bold">−</text>
      <text x={PAD_L + W / 2} y={PAD_T + H / 2 - 5} textAnchor="middle" fill="rgba(100,116,139,0.5)" fontSize="10">0</text>

      {/* waveforms — thick strokes for far-distance legibility */}
      {series.map((s) => (
        <path
          key={s.label}
          d={makePath(s.data)}
          fill="none"
          stroke={s.color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* legend row — large, high-contrast */}
      <g transform={`translate(${PAD_L} ${PAD_T + H + 10})`}>
        {series.map((s, i) => (
          <g key={s.label} transform={`translate(${i * 130} 0)`}>
            {/* colored line swatch */}
            <line x1="0" y1="7" x2="22" y2="7" stroke={s.color} strokeWidth="4" strokeLinecap="round" />
            <text x="28" y="12" fill="#e2e8f0" fontSize="14" fontWeight="bold">{s.label}</text>
          </g>
        ))}
      </g>

      {/* readout text — larger and brighter */}
      {phaseAnnotation && (
        <text
          x={PAD_L + W / 2} y={PAD_T + H + 32}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="12"
          fontStyle="italic"
          fontWeight="600"
        >
          Φ lags V by 90°
        </text>
      )}

      {/* bottom readout */}
      <text
        x={PAD_L} y={totalH - 2}
        fill="#64748b"
        fontSize="11"
        fontWeight="bold"
      >{readout}</text>
    </svg>
  );
}

// ── Canvas draw: background ───────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }
}

// ── Canvas draw: transformer mode ────────────────────────────────────────────
// Canvas is 1280×760. The schematic is centered across the full width.
// All graphs and data panels are in the SIDE PANELS only (not on canvas).

function drawTransformerMode(
  ctx: CanvasRenderingContext2D,
  t: number,
  omega: number,
  np: number,
  ns: number,
  vpPeak: number,
  vsPeak: number,
  vp: number,
  vs: number,
  fluxIntensity: number,
  dFlux: number,
  fluxPeak: number,
  _vpHist: number[],
  _vsHist: number[],
  _fluxHist: number[],
  primaryTopDots: number[],
  primaryBotDots: number[],
  secondaryTopDots: number[],
  secondaryBotDots: number[],
  efficiency: number,
  ipRms: number,
  isRms: number,
  vpRms: number,
  vsRms: number,
  ppW: number,
  psW: number
) {
  // ── Layout constants ──────────────────────────────────────────────────────
  //
  // NCERT Fig 7.16-style transformer schematic:
  //   Iron core = rectangular frame, centered horizontally on canvas.
  //   Left limb: primary coil loops wrap AROUND it (loops extend leftward).
  //   Right limb: secondary coil loops wrap AROUND it (loops extend rightward).
  //   Wires go: AC source → top of primary coil stack → top of secondary → Load
  //             AC source → bottom of primary coil stack → bottom of secondary → Load
  //
  // Canvas = 1280 × 760 (before bottom strip at y=634).
  // Available schematic height ≈ 634 − 30 (top margin) = 604px.
  // Core centered: midX=640, midY=310

  // ── Core frame ───────────────────────────────────────────────────────────
  //  Outer rect
  const CX = 640;           // horizontal centre of canvas
  const CY = 310;           // vertical centre of schematic area

  const CORE_W  = 320;      // total outer width  of the iron frame
  const CORE_H  = 380;      // total outer height of the iron frame
  const WALL_T  = 60;       // thickness of each wall (top/bottom/left/right)

  const coreX = CX - CORE_W / 2;   // = 480
  const coreY = CY - CORE_H / 2;   // = 120

  // Limb centrelines (where coil ellipses are centred)
  const LEFT_LIMB_CX  = coreX + WALL_T / 2;              // centre of left wall  = 510
  const RIGHT_LIMB_CX = coreX + CORE_W - WALL_T / 2;     // centre of right wall = 770

  // Coil active zone: inside the top/bottom walls
  const COIL_TOP_Y = coreY + WALL_T;                     // = 180
  const COIL_BOT_Y = coreY + CORE_H - WALL_T;            // = 440
  const COIL_H     = COIL_BOT_Y - COIL_TOP_Y;            // = 260

  // Draw iron core
  drawIronCore(ctx, coreX, coreY, CORE_W, CORE_H, WALL_T, dFlux, fluxIntensity);

  // Badge above core
  drawTransformerBadge(ctx, CX, coreY - 32, np, ns);

  // ── Primary coil wrapping the LEFT limb ──────────────────────────────────
  //  Each loop is an ellipse centred on LEFT_LIMB_CX.
  //  rx = WALL_T*0.9 so loops clearly extend outside the limb on both sides.
  //  The left half of the loop extends into the open space left of the core.
  const npVisual = clamp(Math.floor(np / 5), 8, 52);
  drawCoilOnLimb(
    ctx,
    LEFT_LIMB_CX, COIL_TOP_Y, COIL_H,
    npVisual, '#ef4444', np,
    Math.abs(vp / vpPeak), t,
    WALL_T * 0.88   // rx — loops extend well beyond limb edges
  );

  // ── Secondary coil wrapping the RIGHT limb ───────────────────────────────
  const nsVisual = clamp(Math.floor(ns / 5), 8, 52);
  drawCoilOnLimb(
    ctx,
    RIGHT_LIMB_CX, COIL_TOP_Y, COIL_H,
    nsVisual, '#3b82f6', ns,
    Math.abs(vs / (vsPeak || 1)), t,
    WALL_T * 0.88
  );

  // ── Coil labels above the limbs ──────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 15px Inter, monospace';
  ctx.fillText('Primary', LEFT_LIMB_CX, coreY - 8);
  ctx.font = '13px Inter, monospace';
  ctx.fillText(`Np = ${np} turns`, LEFT_LIMB_CX, coreY + 6);

  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 15px Inter, monospace';
  ctx.fillText('Secondary', RIGHT_LIMB_CX, coreY - 8);
  ctx.font = '13px Inter, monospace';
  ctx.fillText(`Ns = ${ns} turns`, RIGHT_LIMB_CX, coreY + 6);

  // Φ symbol in hollow window (between limbs, centre of core)
  ctx.font = 'bold 30px Inter, monospace';
  ctx.fillStyle = '#facc15';
  ctx.textAlign = 'center';
  ctx.fillText('Φ', CX, CY + 11);

  // Flux arrows inside core walls
  drawFluxArrows(ctx, coreX, coreY, CORE_W, CORE_H, WALL_T, dFlux, fluxIntensity, t, omega);

  // ── AC Source and Load ───────────────────────────────────────────────────
  //  Placed at x=110 and x=1170, vertically centred on schematic
  const srcX  = 110;
  const loadX = 1170;
  const midY  = CY;   // 310

  drawACSource(ctx, srcX, midY, vp, vpPeak, t, omega);
  drawLoadVoltmeter(ctx, loadX, midY, vs, vsPeak);

  // ── Wires ────────────────────────────────────────────────────────────────
  //  Primary circuit:
  //    Top wire: source top → run up to COIL_TOP_Y → run right to left limb top
  //    Bot wire: source bot → run down to COIL_BOT_Y → run right to left limb bot
  //  Secondary circuit:
  //    Top wire: right limb top → run right to load top
  //    Bot wire: right limb bot → run right to load bot

  const priTopPath: WirePath = [
    [srcX, midY - 28],
    [srcX, COIL_TOP_Y - 14],
    [LEFT_LIMB_CX, COIL_TOP_Y - 14],
  ];
  const priBotPath: WirePath = [
    [srcX, midY + 28],
    [srcX, COIL_BOT_Y + 14],
    [LEFT_LIMB_CX, COIL_BOT_Y + 14],
  ];
  strokeWire(ctx, priTopPath, '#ef4444', 2.5);
  strokeWire(ctx, priBotPath, '#ef4444', 2.5);

  const secTopPath: WirePath = [
    [RIGHT_LIMB_CX, COIL_TOP_Y - 14],
    [loadX, COIL_TOP_Y - 14],
    [loadX, midY - 28],
  ];
  const secBotPath: WirePath = [
    [RIGHT_LIMB_CX, COIL_BOT_Y + 14],
    [loadX, COIL_BOT_Y + 14],
    [loadX, midY + 28],
  ];
  strokeWire(ctx, secTopPath, '#3b82f6', 2.5);
  strokeWire(ctx, secBotPath, '#3b82f6', 2.5);

  // Current-flow dots
  const normVp = Math.abs(vp / vpPeak);
  const normVs = Math.abs(vs / (vsPeak || 1));
  drawCurrentDots(ctx, priTopPath, primaryTopDots, normVp);
  drawCurrentDots(ctx, priBotPath, primaryBotDots, normVp);
  drawCurrentDots(ctx, secTopPath, secondaryTopDots, normVs);
  drawCurrentDots(ctx, secBotPath, secondaryBotDots, normVs);

  // ── Labels below source / load ───────────────────────────────────────────
  ctx.font = 'bold 14px Inter, monospace';
  ctx.fillStyle = '#ef4444';
  ctx.textAlign = 'center';
  ctx.fillText('AC Source', srcX, midY + 52);
  ctx.font = '13px Inter, monospace';
  ctx.fillText(`Vp = ${vpPeak} V`, srcX, midY + 68);
  ctx.fillText(`Vrms = ${vpRms.toFixed(0)} V`, srcX, midY + 83);

  ctx.font = 'bold 14px Inter, monospace';
  ctx.fillStyle = '#3b82f6';
  ctx.fillText('Load', loadX, midY + 52);
  ctx.font = '13px Inter, monospace';
  ctx.fillText(`Vs = ${Math.round(vsPeak)} V`, loadX, midY + 68);
  ctx.fillText(`Vrms = ${vsRms.toFixed(0)} V`, loadX, midY + 83);

  // Live current badges — placed on horizontal wire segments, not overlapping core
  const badgeMidPriY = COIL_TOP_Y - 14;
  const badgeMidSecY = COIL_TOP_Y - 14;
  drawInstantBadge(ctx, (srcX + LEFT_LIMB_CX) / 2, badgeMidPriY - 16,
    `ip = ${(normVp * ipRms).toFixed(1)} A`, '#ef4444');
  drawInstantBadge(ctx, (RIGHT_LIMB_CX + loadX) / 2, badgeMidSecY - 16,
    `is = ${(normVs * isRms).toFixed(1)} A`, '#3b82f6');

  // ── Bottom strip ─────────────────────────────────────────────────────────
  drawBottomStrip(ctx, np, ns, vpPeak, vsPeak, vpRms, vsRms, ipRms, isRms, ppW, psW, efficiency);
}

// ── Draw: iron core ───────────────────────────────────────────────────────────

function drawIronCore(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, thick: number,
  flux: number, fluxIntensity: number
) {
  // Build gradient color based on flux direction
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  if (flux > 0) {
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, `rgba(239,68,68,${fluxIntensity * 0.3})`);
  } else if (flux < 0) {
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, `rgba(59,130,246,${fluxIntensity * 0.3})`);
  } else {
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#1e293b');
  }

  // outer rect
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  // hollow center
  ctx.clearRect(x + thick, y + thick, w - thick * 2, h - thick * 2);
  // re-draw background inside hole
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + thick, y + thick, w - thick * 2, h - thick * 2);

  // lamination lines across walls
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let lx = x; lx < x + w; lx += 8) {
    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(lx, y + h);
    ctx.stroke();
  }
  // re-clip hole after lamination
  ctx.clearRect(x + thick + 1, y + thick + 1, w - thick * 2 - 2, h - thick * 2 - 2);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + thick + 1, y + thick + 1, w - thick * 2 - 2, h - thick * 2 - 2);
}

// ── Draw: coil on limb ────────────────────────────────────────────────────────

function drawCoilOnLimb(
  ctx: CanvasRenderingContext2D,
  limbCX: number,    // x-centre of the limb the coil wraps around
  startY: number,    // top of the coil active zone
  height: number,    // height of the coil active zone
  visualTurns: number,
  color: string,
  realTurns: number,
  normalizedV: number,
  t: number,
  rx: number = 28    // horizontal radius of each ellipse loop
) {
  const glowBlur = 15 * Math.abs(Math.sin(OMEGA_VISUAL * t));
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glowBlur * clamp(normalizedV, 0.1, 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = realTurns < 150 ? 3.5 : 2;
  ctx.lineCap = 'round';

  const turnSpacing = height / (visualTurns + 1);
  const ry = turnSpacing * 0.46;   // vertical radius — snug but not overlapping

  for (let i = 0; i < visualTurns; i++) {
    const cy = startY + (i + 1) * turnSpacing;
    ctx.beginPath();
    ctx.ellipse(limbCX, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Draw: flux arrows inside core ─────────────────────────────────────────────

function drawFluxArrows(
  ctx: CanvasRenderingContext2D,
  coreX: number, coreY: number, coreW: number, coreH: number, thick: number,
  flux: number, fluxIntensity: number,
  t: number, omega: number
) {
  if (fluxIntensity < 0.05) return;
  const dir = flux >= 0 ? 1 : -1;
  const alpha = fluxIntensity * 0.8;
  const pulse = 0.8 + 0.4 * Math.abs(Math.sin(omega * t));
  const color = `rgba(250,204,21,${alpha})`;

  const draw = (ax: number, ay: number, angle: number) => {
    ctx.save();
    ctx.translate(ax, ay);
    ctx.scale(pulse, pulse);
    drawArrowHead(ctx, 0, 0, angle, color, 11);
    ctx.restore();
  };

  // top wall → rightward (cw) or leftward (ccw)
  draw(coreX + coreW / 2, coreY + thick / 2, dir > 0 ? 0 : Math.PI);
  // right wall → downward (cw) or upward (ccw)
  draw(coreX + coreW - thick / 2, coreY + coreH / 2, dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  // bottom wall → leftward (cw) or rightward (ccw)
  draw(coreX + coreW / 2, coreY + coreH - thick / 2, dir > 0 ? Math.PI : 0);
  // left wall → upward (cw) or downward (ccw)
  draw(coreX + thick / 2, coreY + coreH / 2, dir > 0 ? -Math.PI / 2 : Math.PI / 2);
}

// ── Draw: AC source circle ────────────────────────────────────────────────────

function drawACSource(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  vp: number, vpPeak: number,
  t: number, omega: number
) {
  const glowIntensity = Math.abs(Math.sin(omega * t));
  ctx.save();
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 10 * glowIntensity;
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // small sine wave inside
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const px = x - 10 + i * 2;
    const py = y + Math.sin((i / 10) * Math.PI * 2) * 6;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Draw: load / voltmeter ────────────────────────────────────────────────────

function drawLoadVoltmeter(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  vs: number, vsPeak: number
) {
  const glowIntensity = Math.abs(vs / (vsPeak || 1));
  ctx.save();
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 10 * glowIntensity;
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 18px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('V', x, y + 6);
  ctx.restore();
}

// ── Draw: current-flow dots along wire path ───────────────────────────────────

function drawCurrentDots(
  ctx: CanvasRenderingContext2D,
  path: WirePath,
  dots: number[],
  normalizedI: number
) {
  if (normalizedI < 0.05) return;
  const alpha = clamp(normalizedI, 0.3, 1);
  ctx.save();
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 6;
  ctx.fillStyle = `rgba(251,191,36,${alpha})`;
  for (const pos of dots) {
    const [px, py] = pointOnWire(path, pos);
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Draw: transformer badge ───────────────────────────────────────────────────

function drawTransformerBadge(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  np: number, ns: number
) {
  const label = ns > np ? 'STEP-UP ▲' : ns < np ? 'STEP-DOWN ▼' : 'ISOLATION =';
  const w = 160;
  ctx.fillStyle = 'rgba(245,158,11,0.15)';
  roundRect(ctx, cx - w / 2, cy - 14, w, 28, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,158,11,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 14px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy + 5);
}

// ── Draw: formula overlay (kept for reference, not used on canvas now) ─────────

// ── Draw: instant value badge on wire ────────────────────────────────────────

function drawInstantBadge(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  text: string,
  color: string
) {
  const w = 110;
  const h = 22;
  ctx.fillStyle = 'rgba(15,23,42,0.85)';
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 11px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, cx, cy + 4);
}

// ── Draw: bottom strip (formula + live values across full width) ──────────────

function drawBottomStrip(
  ctx: CanvasRenderingContext2D,
  np: number, ns: number,
  vpPeak: number, vsPeak: number,
  vpRms: number, vsRms: number,
  ipRms: number, isRms: number,
  ppW: number, psW: number,
  efficiency: number
) {
  const y = 634;
  const h = 110;
  const x = 30;
  const w = CANVAS_W - 60;

  ctx.fillStyle = '#1e293b';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(71,85,105,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Left third: NCERT equations ──
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px Inter, monospace';
  ctx.fillText('NCERT §7.8 Equations', x + 20, y + 20);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = '13px Inter, monospace';
  ctx.fillText('εs = −Ns dΦ/dt     εp = −Np dΦ/dt', x + 20, y + 40);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 14px Inter, monospace';
  ctx.fillText('Vs / Vp = Ns / Np', x + 20, y + 62);

  ctx.fillStyle = '#22c55e';
  ctx.font = '13px Inter, monospace';
  ctx.fillText('Ip × Vp = Is × Vs  (power conserved)', x + 20, y + 82);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'italic 11px Inter, monospace';
  ctx.fillText('Frequency = 50 Hz (India)  |  Vrms = Vpeak / √2', x + 20, y + 100);

  // ── Middle: Primary | Secondary columns ──
  const col2 = x + w / 3 + 20;

  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(col2, y + 20, 6, 0, Math.PI * 2); ctx.fill();
  ctx.font = 'bold 13px Inter, monospace';
  ctx.fillText('Primary (Input)', col2 + 12, y + 25);

  const leftRows = [
    `Np = ${np} turns`,
    `Vp peak = ${vpPeak} V  |  Vrms = ${vpRms.toFixed(1)} V`,
    `Ip rms = ${ipRms.toFixed(2)} A`,
  ];
  leftRows.forEach((row, i) => {
    ctx.fillStyle = i === 0 ? '#f1f5f9' : '#ef4444';
    ctx.font = '12px Inter, monospace';
    ctx.fillText(row, col2, y + 44 + i * 20);
  });

  const col3 = x + (w * 2) / 3 + 20;
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath(); ctx.arc(col3, y + 20, 6, 0, Math.PI * 2); ctx.fill();
  ctx.font = 'bold 13px Inter, monospace';
  ctx.fillText('Secondary (Output)', col3 + 12, y + 25);

  const rightRows = [
    `Ns = ${ns} turns  |  k = ${(ns / np).toFixed(2)}`,
    `Vs peak = ${Math.round(vsPeak)} V  |  Vrms = ${vsRms.toFixed(1)} V`,
    `Is rms = ${isRms.toFixed(2)} A`,
  ];
  rightRows.forEach((row, i) => {
    ctx.fillStyle = i === 0 ? '#f1f5f9' : '#3b82f6';
    ctx.font = '12px Inter, monospace';
    ctx.fillText(row, col3, y + 44 + i * 20);
  });

  // Power & efficiency row spanning middle + right
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 13px Inter, monospace';
  ctx.fillText(
    `Pp = ${ppW.toFixed(0)} W   Ps = ${psW.toFixed(0)} W   Efficiency = ${Math.round(efficiency * 100)}%`,
    col2, y + 100
  );
}

// ── Canvas draw: power transmission mode ─────────────────────────────────────

function drawTransmissionMode(
  ctx: CanvasRenderingContext2D,
  t: number,
  omega: number,
  dots: number[]
) {
  // Chain layout: y center = 360, horizontal spread x=40..1240
  const baseY = 340;

  // Transmission wire path (top level)
  const wirePath: WirePath = [
    [140, baseY], [320, baseY], [700, baseY], [840, baseY], [980, baseY], [1040, baseY],
  ];

  // Draw main wire
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  wirePath.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();

  // ── 1. Generator (x=40-140, y=300-420) ───────────────────────────────────
  drawGenerator(ctx, 40, 300, 100, 120, t, omega);

  // ── 2. Step-up transformer (x=180–280) ───────────────────────────────────
  drawSmallTransformer(ctx, 190, 290, 90, 100, '11 kV → 132 kV', 'Step-Up', '#fbbf24', true);

  // ── 3. Transmission towers (x=320-700) ───────────────────────────────────
  for (let tx = 360; tx <= 680; tx += 120) {
    drawTower(ctx, tx, baseY - 80);
  }

  // Transmission line voltage label
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 14px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('132 kV', 510, baseY - 100);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Inter, monospace';
  ctx.fillText('High V, Low I → minimal I²R loss', 510, baseY - 84);

  // I²R loss particles (rising heat)
  for (let px = 360; px <= 680; px += 60) {
    const particleY = baseY - 10 - ((t * 30 + px) % 50);
    const particleAlpha = 1 - ((t * 30 + px) % 50) / 50;
    ctx.fillStyle = `rgba(239,68,68,${particleAlpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(px, particleY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── 4. Area sub-station step-down (x=740–840) ────────────────────────────
  drawSmallTransformer(ctx, 750, 290, 90, 100, '132 kV → 33 kV', 'Area Sub-station', '#3b82f6', false);

  // ── 5. Distribution step-down (x=880–980) ────────────────────────────────
  drawSmallTransformer(ctx, 890, 300, 80, 80, '33 kV → 220 V', 'Distribution', '#3b82f6', false);

  // ── 6. Home (x=1020–1140) ────────────────────────────────────────────────
  drawHome(ctx, 1050, 280, t, omega);

  // ── Animated current dots ─────────────────────────────────────────────────
  // Dot size reflects I (inversely proportional to V)
  const segments = [
    { start: 0.0, end: 0.15, size: 5, color: '#ef4444' },   // gen → step-up (11kV)
    { start: 0.15, end: 0.72, size: 2, color: '#22c55e' },  // 132kV line (high V, low I)
    { start: 0.72, end: 0.87, size: 4, color: '#3b82f6' },  // 33kV
    { start: 0.87, end: 1.0, size: 6, color: '#facc15' },   // 220V (lots of I)
  ];

  for (const dot of dots) {
    const seg = segments.find(s => dot >= s.start && dot < s.end) ?? segments[segments.length - 1];
    const [px, py] = pointOnWire(wirePath, dot);
    ctx.save();
    ctx.shadowColor = seg.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = seg.color;
    ctx.beginPath();
    ctx.arc(px, py, seg.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Bottom info bar ────────────────────────────────────────────────────────
  const infoY = 510;
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, 40, infoY, CANVAS_W - 80, 200, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(71,85,105,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'left';
  const lines = [
    { text: 'Why transmit at high voltage?', color: '#f8fafc', size: '700 15px' },
    { text: 'Power loss in cables:  Pc = I²Rc', color: '#f1f5f9', size: '600 13px' },
    { text: 'For same power P = VI: higher V → lower I → much lower I²R loss', color: '#cbd5e1', size: '600 13px' },
    { text: 'Pc ∝ 1/V²   (NCERT Ch.7 §7.8)', color: '#facc15', size: '700 13px' },
    { text: 'NCERT example: 220V 10A stepped up to 440V → only 5A (Eq.7.35)', color: '#94a3b8', size: '600 12px' },
    { text: 'India supply chain: 11 kV → Step-up → 132 kV → Area sub-station → 33 kV → Distribution → 240 V homes', color: '#94a3b8', size: '600 11px' },
  ];
  lines.forEach((line, i) => {
    ctx.fillStyle = line.color;
    ctx.font = `${line.size} Inter, monospace`;
    ctx.fillText(line.text, 64, infoY + 28 + i * 28);
  });
}

// ── Draw: generator symbol ────────────────────────────────────────────────────

function drawGenerator(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  t: number, omega: number
) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // spinning rotor indication
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(omega * t * 0.5);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(26, 0);
  ctx.moveTo(0, -26);
  ctx.lineTo(0, 26);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 13px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Generator', cx, cy + 62);
  ctx.font = '12px Inter, monospace';
  ctx.fillStyle = '#ef4444';
  ctx.fillText('11 kV', cx, cy + 78);
}

// ── Draw: small transformer icon ──────────────────────────────────────────────

function drawSmallTransformer(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  voltageLabel: string,
  typeLabel: string,
  color: string,
  stepUp: boolean
) {
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // simplified coil loops on two sides
  const limbW = 8;
  const turns = stepUp ? 3 : 5;
  for (let i = 0; i < turns; i++) {
    const ly = y + 14 + i * ((h - 28) / turns);
    ctx.strokeStyle = stepUp ? '#ef4444' : '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x + limbW, ly + (h - 28) / turns / 2, 8, (h - 28) / turns / 2 * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const turns2 = stepUp ? 6 : 3;
  for (let i = 0; i < turns2; i++) {
    const ly = y + 14 + i * ((h - 28) / turns2);
    ctx.strokeStyle = stepUp ? '#3b82f6' : '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x + w - limbW, ly + (h - 28) / turns2 / 2, 8, (h - 28) / turns2 / 2 * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = color;
  ctx.font = 'bold 11px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(typeLabel, x + w / 2, y - 18);
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '10px Inter, monospace';
  ctx.fillText(voltageLabel, x + w / 2, y - 5);
}

// ── Draw: transmission tower ──────────────────────────────────────────────────

function drawTower(
  ctx: CanvasRenderingContext2D,
  x: number,
  topY: number
) {
  const botY = topY + 80;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  // pylon body
  ctx.moveTo(x, topY);
  ctx.lineTo(x - 20, botY);
  ctx.moveTo(x, topY);
  ctx.lineTo(x + 20, botY);
  // cross bar
  ctx.moveTo(x - 28, topY + 20);
  ctx.lineTo(x + 28, topY + 20);
  ctx.stroke();
  // wire hanging lines
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 28, topY + 20);
  ctx.lineTo(x - 28, topY + 38);
  ctx.moveTo(x + 28, topY + 20);
  ctx.lineTo(x + 28, topY + 38);
  ctx.stroke();
}

// ── Draw: home icon ───────────────────────────────────────────────────────────

function drawHome(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  t: number, omega: number
) {
  const cx = x + 40;
  // house body
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(x + 10, y + 50, 60, 50);
  ctx.fill();
  ctx.stroke();
  // roof
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(x, y + 54);
  ctx.lineTo(cx, y + 20);
  ctx.lineTo(x + 80, y + 54);
  ctx.closePath();
  ctx.fill();

  // glowing bulb inside
  const bulbBrightness = 0.5 + 0.5 * Math.abs(Math.sin(omega * t));
  if (bulbBrightness > 0.1) {
    ctx.save();
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 20 * bulbBrightness;
    ctx.fillStyle = `rgba(250,204,21,${bulbBrightness * 0.8})`;
    ctx.beginPath();
    ctx.arc(cx, y + 66, 10 * bulbBrightness, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 12px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('240 V', cx, y + 116);
}

export default AlternatingCurrentLab;
