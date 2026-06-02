import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Layers, Activity, Sun, Circle, Eye, EyeOff } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface WaveOpticsLabProps {
  topic: any;
  onExit: () => void;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type WaveOpticsMode = 'ydse' | 'diffraction' | 'polarization' | 'huygens';
type HuygensSubMode = 'propagation' | 'refraction' | 'reflection';

// ─── Constants ────────────────────────────────────────────────────────────────
const CW = 1280;
const CH = 760;
const HISTORY = 300;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// NCERT-compatible wavelength → RGB (standard CIE approximation, lines 21-36 preserved)
function wavelengthToRgb(wl: number): { r: number; g: number; b: number; a: number } {
  let R = 0, G = 0, B = 0;
  if (wl >= 380 && wl < 440) { R = -(wl - 440) / (440 - 380); G = 0; B = 1; }
  else if (wl >= 440 && wl < 490) { R = 0; G = (wl - 440) / (490 - 440); B = 1; }
  else if (wl >= 490 && wl < 510) { R = 0; G = 1; B = -(wl - 510) / (510 - 490); }
  else if (wl >= 510 && wl < 580) { R = (wl - 510) / (580 - 510); G = 1; B = 0; }
  else if (wl >= 580 && wl < 645) { R = 1; G = -(wl - 645) / (645 - 580); B = 0; }
  else if (wl >= 645 && wl <= 780) { R = 1; G = 0; B = 0; }
  let a = 1;
  if (wl >= 380 && wl < 420) a = 0.3 + 0.7 * (wl - 380) / 40;
  else if (wl > 700 && wl <= 780) a = 0.3 + 0.7 * (780 - wl) / 80;
  return { r: Math.round(R * 255), g: Math.round(G * 255), b: Math.round(B * 255), a };
}

function wlCss(wl: number, alpha = 1): string {
  const c = wavelengthToRgb(wl);
  return `rgba(${c.r},${c.g},${c.b},${c.a * alpha})`;
}

function sinc(x: number): number { return Math.abs(x) < 1e-10 ? 1 : Math.sin(x) / x; }

function threePolFinalRatioToI0(thetaDeg: number): number {
  const theta = thetaDeg * Math.PI / 180;
  return 0.125 * Math.sin(2 * theta) ** 2;
}

function threePolFinalRatioToI1(thetaDeg: number): number {
  const theta = thetaDeg * Math.PI / 180;
  return Math.cos(theta) ** 2 * Math.sin(theta) ** 2;
}

function snellSnapshot(n1: number, n2: number, incidentDeg: number) {
  const iRad = incidentDeg * Math.PI / 180;
  const sinR = (n1 / n2) * Math.sin(iRad);
  const tir = n1 > n2 && sinR > 1;
  const criticalDeg = n1 > n2 ? Math.asin(clamp(n2 / n1, -1, 1)) * 180 / Math.PI : null;
  return {
    tir,
    criticalDeg,
    rDeg: tir ? Number.NaN : Math.asin(clamp(sinR, -1, 1)) * 180 / Math.PI,
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function tabCls(active: boolean) {
  return `flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
    active ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
  }`;
}

// ─── SVG Intensity graph for side panel ──────────────────────────────────────
interface IntensityPoint { pos: number; val: number }

function IntensitySvg({ points, color, xLabel, yLabel, markers }: {
  points: IntensityPoint[];
  color: string;
  xLabel: string;
  yLabel: string;
  markers?: { pos: number; label: string }[];
}) {
  const W = 310, H = 180, PL = 36, PB = 28, PT = 12;
  const gW = W - PL - 4, gH = H - PB - PT;
  if (points.length === 0) return null;
  const maxV = Math.max(...points.map(p => p.val), 0.001);
  const minPos = points[0].pos, maxPos = points[points.length - 1].pos;
  const span = maxPos - minPos || 1;
  const toX = (p: number) => PL + ((p - minPos) / span) * gW;
  const toY = (v: number) => PT + gH - (v / maxV) * gH;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.pos).toFixed(1)},${toY(p.val).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <rect width={W} height={H} fill="#ffffff" rx="6" />
      {/* grid */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={PL} y1={toY(f * maxV)} x2={PL + gW} y2={toY(f * maxV)}
          stroke="rgba(0,0,0,0.07)" />
      ))}
      {/* axes */}
      <line x1={PL} y1={PT} x2={PL} y2={PT + gH} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <line x1={PL} y1={PT + gH} x2={PL + gW} y2={PT + gH} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      {/* markers */}
      {markers?.map(m => {
        const mx = toX(m.pos);
        return (
          <g key={m.label}>
            <line x1={mx} y1={PT} x2={mx} y2={PT + gH} stroke="#d97706" strokeDasharray="4 4" opacity="0.7" />
            <text x={mx} y={PT - 3} textAnchor="middle" fill="#92400e" fontSize="9" fontWeight="bold">{m.label}</text>
          </g>
        );
      })}
      {/* curve */}
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* labels */}
      <text x={PL - 4} y={PT + 5} fill="#475569" fontSize="9" textAnchor="end">{yLabel}</text>
      <text x={PL + gW} y={PT + gH + 16} fill="#475569" fontSize="9" textAnchor="end">{xLabel}</text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const WaveOpticsLab: React.FC<WaveOpticsLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const lastTimeRef = useRef(performance.now());
  const tRef = useRef(0);

  const [mode, setMode] = useState<WaveOpticsMode>('ydse');
  const [isPlaying, setIsPlaying] = useState(true);

  // YDSE params
  const [wavelength, setWavelength] = useState(550);         // nm
  const [slitSep, setSlitSep] = useState(1.0);               // mm
  const [screenDist, setScreenDist] = useState(1.0);         // m
  const [slitWidth, setSlitWidth] = useState(0.1);           // mm
  const [showEnvelope, setShowEnvelope] = useState(true);

  // Diffraction params
  const [dSlitWidth, setDSlitWidth] = useState(0.3);         // mm
  const [dWavelength, setDWavelength] = useState(550);       // nm
  const [dScreenDist, setDScreenDist] = useState(1.0);       // m
  const [showAngles, setShowAngles] = useState(true);

  // Polarization params
  const [polAngle, setPolAngle] = useState(45);              // degrees
  const [threePol, setThreePol] = useState(false);
  const [midAngle, setMidAngle] = useState(45);              // degrees (middle polaroid)

  // Huygens params
  const [huygensSubMode, setHuygensSubMode] = useState<HuygensSubMode>('propagation');
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.5);
  const [incidentAngle, setIncidentAngle] = useState(45);    // degrees

  // Live readouts
  const [liveData, setLiveData] = useState({
    fringeWidth: 0.55,
    centralWidth: 3.67,
    iRatio: 0.5,
    nMinima: 0,
  });

  // Intensity history for side graphs
  const intensityPtsRef = useRef<IntensityPoint[]>([]);
  const diffPtsRef = useRef<IntensityPoint[]>([]);
  const [graphTick, setGraphTick] = useState(0); // force re-render for graphs

  // Fixed canvas size
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = CW;
    c.height = CH;
  }, []);

  // Recompute intensity curves whenever YDSE/diff params change
  useEffect(() => {
    const lambda_m = wavelength * 1e-9;
    const d_m = slitSep * 1e-3;
    const a_m = slitWidth * 1e-3;
    const D_m = screenDist;
    const pts: IntensityPoint[] = [];
    const yRange = 0.05; // ±50 mm
    for (let y = -yRange; y <= yRange; y += yRange / 150) {
      const sinTh = y / Math.sqrt(y * y + D_m * D_m);
      const beta = Math.PI * a_m * sinTh / lambda_m;
      const delta = Math.PI * d_m * sinTh / lambda_m;
      const envelope = showEnvelope ? sinc(beta) * sinc(beta) : 1;
      const interference = Math.cos(delta) * Math.cos(delta);
      pts.push({ pos: y * 1000, val: envelope * interference }); // pos in mm
    }
    intensityPtsRef.current = pts;

    // YDSE fringe width β = λD/d
    const beta_mm = (lambda_m * D_m / d_m) * 1000;
    setLiveData(prev => ({ ...prev, fringeWidth: beta_mm }));
  }, [wavelength, slitSep, screenDist, slitWidth, showEnvelope]);

  useEffect(() => {
    const lambda_m = dWavelength * 1e-9;
    const a_m = dSlitWidth * 1e-3;
    const D_m = dScreenDist;
    const pts: IntensityPoint[] = [];
    const yRange = 0.06;
    for (let y = -yRange; y <= yRange; y += yRange / 150) {
      const sinTh = y / Math.sqrt(y * y + D_m * D_m);
      const beta = Math.PI * a_m * sinTh / lambda_m;
      pts.push({ pos: y * 1000, val: sinc(beta) * sinc(beta) });
    }
    diffPtsRef.current = pts;
    // Central max linear width = 2λD/a
    const cw_mm = (2 * lambda_m * D_m / a_m) * 1000;
    setLiveData(prev => ({ ...prev, centralWidth: cw_mm }));
  }, [dWavelength, dSlitWidth, dScreenDist]);

  useEffect(() => {
    const theta = polAngle * Math.PI / 180;
    setLiveData(prev => ({ ...prev, iRatio: threePol ? threePolFinalRatioToI0(midAngle) : 0.5 * Math.cos(theta) ** 2 }));
  }, [polAngle, threePol, midAngle]);

  // Force graph re-render
  useEffect(() => { setGraphTick(t => t + 1); }, [intensityPtsRef.current, diffPtsRef.current]);

  const reset = useCallback(() => {
    tRef.current = 0;
    lastTimeRef.current = performance.now();
  }, []);

  // ─── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (ts: number) => {
      const dt = Math.min(ts - lastTimeRef.current, 100);
      lastTimeRef.current = ts;
      if (isPlaying) tRef.current += dt / 1000;
      const t = tRef.current;

      // Background
      ctx.clearRect(0, 0, CW, CH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CW, CH);
      ctx.strokeStyle = 'rgba(0,0,0,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= CW; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
      for (let y = 0; y <= CH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }

      if (mode === 'ydse') drawYDSE(ctx, t, wavelength, slitSep, screenDist, slitWidth, showEnvelope);
      else if (mode === 'diffraction') drawDiffraction(ctx, t, dWavelength, dSlitWidth, dScreenDist, showAngles);
      else if (mode === 'polarization') drawPolarization(ctx, t, polAngle, threePol, midAngle);
      else drawHuygens(ctx, t, huygensSubMode, n1, n2, incidentAngle);

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [mode, isPlaying, wavelength, slitSep, screenDist, slitWidth, showEnvelope,
      dWavelength, dSlitWidth, dScreenDist, showAngles,
      polAngle, threePol, midAngle,
      huygensSubMode, n1, n2, incidentAngle]);

  // ─── Derived display values ─────────────────────────────────────────────────
  const wlColor = wavelengthToRgb(wavelength);
  const snell = snellSnapshot(n1, n2, incidentAngle);

  // ─── YDSE intensity markers ─────────────────────────────────────────────────
  const ydseMarkers = (() => {
    const lm = wavelength * 1e-9, dm = slitSep * 1e-3, Dm = screenDist;
    const beta = lm * Dm / dm * 1000; // mm
    const marks: { pos: number; label: string }[] = [{ pos: 0, label: 'n=0' }];
    for (let n = 1; n <= 3; n++) {
      marks.push({ pos: n * beta, label: `n=${n}` });
      marks.push({ pos: -n * beta, label: `n=-${n}` });
    }
    return marks;
  })();

  const diffMarkers = (() => {
    const lm = dWavelength * 1e-9, am = dSlitWidth * 1e-3, Dm = dScreenDist;
    return [1, 2].flatMap(n => [
      { pos: n * lm * Dm / am * 1000, label: `m${n}` },
      { pos: -n * lm * Dm / am * 1000, label: `-m${n}` },
    ]);
  })();

  const polarizationReadouts = threePol
    ? [
        { label: 'Middle angle theta', value: `${midAngle}°`, color: 'text-blue-700', bg: 'bg-blue-50' },
        { label: 'cos²theta', value: Math.pow(Math.cos(midAngle * Math.PI / 180), 2).toFixed(3), color: 'text-amber-700', bg: 'bg-amber-50' },
        { label: 'sin²theta', value: Math.pow(Math.sin(midAngle * Math.PI / 180), 2).toFixed(3), color: 'text-violet-700', bg: 'bg-violet-50' },
        { label: 'Final I/I0', value: `${(threePolFinalRatioToI0(midAngle) * 100).toFixed(1)}%`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { label: 'Mode', value: '3 Polaroids', color: 'text-slate-700', bg: 'bg-slate-50' },
      ]
    : [
        { label: 'Analyzer angle theta', value: `${polAngle}°`, color: 'text-blue-700', bg: 'bg-blue-50' },
        { label: 'cos²theta', value: Math.pow(Math.cos(polAngle * Math.PI / 180), 2).toFixed(3), color: 'text-amber-700', bg: 'bg-amber-50' },
        { label: 'I/I1', value: `${(Math.pow(Math.cos(polAngle * Math.PI / 180), 2) * 100).toFixed(1)}%`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { label: 'Mode', value: '2 Polaroids', color: 'text-slate-700', bg: 'bg-slate-50' },
      ];

  // ─── Side panels ────────────────────────────────────────────────────────────
  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 z-20 hidden w-[360px] 2xl:block">
      <div className="flex flex-col gap-3">
        {mode === 'ydse' && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
              <div className="text-lg font-extrabold text-slate-900">YDSE Intensity Pattern</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">
                I ∝ sinc²(πa sinθ/λ) · cos²(πd sinθ/λ)
              </div>
              <div className="mt-2" key={graphTick}>
                <IntensitySvg
                  points={intensityPtsRef.current}
                  color={`rgb(${wlColor.r},${wlColor.g},${wlColor.b})`}
                  xLabel="y (mm)"
                  yLabel="I"
                  markers={ydseMarkers.filter(m => Math.abs(m.pos) <= 20)}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Fringe width β = λD/d = <span className="text-amber-700 font-bold">{liveData.fringeWidth.toFixed(2)} mm</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
              <div className="text-lg font-extrabold text-slate-900">Fringe Order vs Position</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">xₙ = nλD/d (bright), (n+½)λD/d (dark)</div>
              <svg viewBox="0 0 310 90" className="mt-2 w-full">
                <rect width="310" height="90" fill="#ffffff" rx="6" />
                <line x1="0" y1="88" x2="310" y2="88" stroke="rgba(0,0,0,0.15)" />
                {[-3,-2,-1,0,1,2,3].map(n => {
                  const lm = wavelength * 1e-9, dm = slitSep * 1e-3, Dm = screenDist;
                  const x = 155 + (n * lm * Dm / dm) * 1000 * 18;
                  if (x < 10 || x > 300) return null;
                  return (
                    <g key={n}>
                      <rect x={x - 3} y={10} width={6} height={70} fill={n === 0 ? `rgb(${wlColor.r},${wlColor.g},${wlColor.b})` : `rgba(${wlColor.r},${wlColor.g},${wlColor.b},0.55)`} rx="2" />
                      <text x={x} y={88} textAnchor="middle" fill="#475569" fontSize="9">{n}</text>
                    </g>
                  );
                })}
                <text x="155" y="8" textAnchor="middle" fill="#64748b" fontSize="9">Fringe order n</text>
              </svg>
            </div>
          </>
        )}

        {mode === 'diffraction' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
            <div className="text-lg font-extrabold text-slate-900">Single Slit Diffraction</div>
            <div className="mt-1 text-sm font-semibold text-slate-500">I = I₀ [sin(β)/β]²  — sinc² function</div>
            <div className="mt-2" key={graphTick + 1000}>
              <IntensitySvg
                points={diffPtsRef.current}
                color={`rgb(${wavelengthToRgb(dWavelength).r},${wavelengthToRgb(dWavelength).g},${wavelengthToRgb(dWavelength).b})`}
                xLabel="y (mm)"
                yLabel="I/I₀"
                markers={diffMarkers.filter(m => Math.abs(m.pos) <= 50)}
              />
            </div>
            <div className="mt-2 space-y-1 text-xs text-slate-500">
              <div>Central max width = <span className="text-amber-700 font-bold">{liveData.centralWidth.toFixed(1)} mm</span></div>
              <div>1st secondary max ≈ 4.5% of central</div>
              <div>2nd secondary max ≈ 1.6% of central</div>
            </div>
          </div>
        )}

        {mode === 'polarization' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
            <div className="text-lg font-extrabold text-slate-900">{threePol ? '3 Polaroids - I vs theta' : "Malus's Law - I vs theta"}</div>
            <div className="mt-1 text-sm font-semibold text-slate-500">{threePol ? 'I/I0 = (1/8) sin²2theta' : 'I/I1 = cos²theta (Malus law)'}</div>
            <svg viewBox="0 0 310 180" className="mt-2 w-full">
              <rect width="310" height="180" fill="#ffffff" rx="6" />
              {/* grid lines */}
              {[0.25, 0.5, 0.75].map(f => (
                <line key={f} x1="20" y1={160 - f * 130} x2="290" y2={160 - f * 130} stroke="rgba(0,0,0,0.07)" />
              ))}
              {/* intensity curve */}
              <path d={
                Array.from({ length: threePol ? 91 : 181 }, (_, i) => {
                  const maxAngle = threePol ? 90 : 180;
                  const x = 20 + (i / maxAngle) * 270;
                  const raw = threePol ? threePolFinalRatioToI0(i) : Math.cos(i * Math.PI / 180) ** 2;
                  const maxI = threePol ? 0.125 : 1;
                  const y = 160 - (raw / maxI) * 130;
                  return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ')
              } fill="none" stroke="#3b82f6" strokeWidth="2.5" />
              {/* current angle dot */}
              {(() => {
                const angle = threePol ? midAngle : polAngle;
                const maxAngle = threePol ? 90 : 180;
                const raw = threePol ? threePolFinalRatioToI0(angle) : Math.cos(angle * Math.PI / 180) ** 2;
                const maxI = threePol ? 0.125 : 1;
                const x = 20 + (angle / maxAngle) * 270;
                const y = 160 - (raw / maxI) * 130;
                return (
                  <>
                    <line x1={x} y1="20" x2={x} y2="160" stroke="#d97706" strokeDasharray="4 4" opacity="0.7" />
                    <circle cx={x} cy={y} r="6" fill="#d97706" />
                    <text x={x + 8} y={y - 6} fill="#92400e" fontSize="11" fontWeight="bold">
                      {threePol ? `${(raw * 100).toFixed(1)}% I0` : `${raw.toFixed(2)} I1`}
                    </text>
                  </>
                );
              })()}
              <line x1="20" y1="160" x2="290" y2="160" stroke="rgba(0,0,0,0.25)" />
              <line x1="20" y1="20" x2="20" y2="160" stroke="rgba(0,0,0,0.25)" />
              <text x="155" y="176" textAnchor="middle" fill="#64748b" fontSize="10">{threePol ? 'theta (0° -> 90°)' : 'theta (0° -> 180°)'}</text>
              <text x="8" y="95" fill="#64748b" fontSize="9" transform="rotate(-90,8,95)">{threePol ? 'I/I0' : 'I/I1'}</text>
              <text x="155" y="172" textAnchor="middle" fill="#94a3b8" fontSize="9">{threePol ? '45°' : '90°'}</text>
            </svg>
          </div>
        )}

        {mode === 'huygens' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
            <div className="text-lg font-extrabold text-slate-900">Snell's Law Diagram</div>
            <div className="mt-1 text-sm font-semibold text-slate-500">n₁ sin i = n₂ sin r (NCERT Eq. 10.6)</div>
            <svg viewBox="0 0 310 200" className="mt-2 w-full">
              <rect width="310" height="200" fill="#ffffff" rx="6" />
              <rect x="0" y="0" width="310" height="100" fill="rgba(219,234,254,0.5)" />
              <rect x="0" y="100" width="310" height="100" fill="rgba(209,250,229,0.5)" />
              <line x1="0" y1="100" x2="310" y2="100" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="155" y1="10" x2="155" y2="190" stroke="#cbd5e1" strokeDasharray="5 4" />
              {(() => {
                const ang = incidentAngle * Math.PI / 180;
                const x0 = 155 - Math.sin(ang) * 80, y0 = 100 - Math.cos(ang) * 80;
                const rAng = snell.tir ? Math.PI / 2 : snell.rDeg * Math.PI / 180;
                const xr = snell.tir ? 155 + Math.sin(ang) * 80 : 155 + Math.sin(rAng) * 80;
                const yr = snell.tir ? 100 - Math.cos(ang) * 80 : 100 + Math.cos(rAng) * 80;
                return (
                  <>
                    <line x1={x0} y1={y0} x2="155" y2="100" stroke="#ef4444" strokeWidth="2.5" />
                    <line x1="155" y1="100" x2={xr} y2={yr} stroke={snell.tir ? '#be123c' : '#16a34a'} strokeWidth="2.5" />
                    <text x="70" y="70" fill="#ef4444" fontSize="10" fontWeight="bold">i = {incidentAngle.toFixed(0)}°</text>
                    <text x="200" y="150" fill={snell.tir ? '#be123c' : '#16a34a'} fontSize="10" fontWeight="bold">{snell.tir ? 'TIR: no r' : `r = ${snell.rDeg.toFixed(1)}°`}</text>
                    <text x="20" y="95" fill="#475569" fontSize="10">n₁ = {n1.toFixed(1)}</text>
                    <text x="20" y="120" fill="#475569" fontSize="10">n₂ = {n2.toFixed(1)}</text>
                  </>
                );
              })()}
            </svg>
          </div>
        )}
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 z-20 hidden w-[310px] 2xl:block">
      {/* Formula card */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/95 p-4 text-indigo-950 shadow-xl backdrop-blur">
        <div className="text-base font-extrabold">
          {mode === 'ydse' ? 'YDSE — NCERT §10.4-10.5'
            : mode === 'diffraction' ? 'Single Slit — NCERT §10.6'
            : mode === 'polarization' ? 'Polarisation — NCERT §10.7'
            : 'Huygens Principle — NCERT §10.2-10.3'}
        </div>
        <div className="mt-2 space-y-1 text-sm leading-snug text-indigo-900">
          {mode === 'ydse' && <>
            <p>Path difference Δ = xd/D</p>
            <p>β = λD/d  (fringe width)</p>
            <p className="font-bold">Bright: xₙ = nλD/d (n = 0,±1,±2…)</p>
            <p className="font-bold">Dark: xₙ = (n+½)λD/d</p>
            <p>I = 4I₀ cos²(φ/2)</p>
            <p>Combined: I ∝ sinc²(πa sinθ/λ)·cos²(πd sinθ/λ)</p>
          </>}
          {mode === 'diffraction' && <>
            <p className="font-bold">Minima: a sinθ = nλ, n=±1,±2…</p>
            <p>Central width = 2λD/a</p>
            <p>I(θ) = I₀[sin(β)/β]², β = πa sinθ/λ</p>
            <p>Secondary maxima lie between successive minima</p>
            <p>I₁/I₀ ≈ 0.045, I₂/I₀ ≈ 0.016</p>
          </>}
          {mode === 'polarization' && <>
            <p>Unpolarised → P₁: I₁ = I₀/2</p>
            <p className="font-bold">Malus's Law: I = I₁ cos²θ (Eq. 10.18)</p>
            <p>θ = 0°: I = I₁ (max)</p>
            <p>θ = 90°: I = 0 (crossed)</p>
            <p>3 polaroids: I = (I₀/8)sin²2θ</p>
          </>}
          {mode === 'huygens' && <>
            <p>Each wavefront point → secondary wavelets</p>
            <p>New wavefront = envelope of wavelets</p>
            <p className="font-bold">Snell's Law: n₁ sin i = n₂ sin r</p>
            <p>Refraction: λ changes, ν constant</p>
            <p>Reflection: angle i = angle r</p>
          </>}
        </div>
      </div>

      {/* Live values card */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-white/95 p-4 text-slate-900 shadow-xl backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold">Real-time values</h3>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">Live</span>
        </div>
        <div className="grid gap-2">
          {mode === 'ydse' && [
            { label: 'Fringe Width β', value: `${liveData.fringeWidth.toFixed(3)} mm`, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Wavelength λ', value: `${wavelength} nm`, color: 'text-violet-700', bg: 'bg-violet-50' },
            { label: 'Slit Sep d', value: `${slitSep.toFixed(1)} mm`, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Screen Dist D', value: `${screenDist.toFixed(1)} m`, color: 'text-slate-700', bg: 'bg-slate-50' },
            { label: 'Slit Width a', value: `${slitWidth.toFixed(2)} mm`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          ].map(item => (
            <div key={item.label} className={`rounded-lg border border-slate-100 ${item.bg} px-3 py-2.5`}>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
              <div className={`mt-1 font-mono text-base font-extrabold ${item.color}`}>{item.value}</div>
            </div>
          ))}
          {mode === 'diffraction' && [
            { label: 'Central Max Width', value: `${liveData.centralWidth.toFixed(2)} mm`, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Wavelength λ', value: `${dWavelength} nm`, color: 'text-violet-700', bg: 'bg-violet-50' },
            { label: 'Slit Width a', value: `${dSlitWidth.toFixed(2)} mm`, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: '1st Minimum θ', value: `${(Math.asin(dWavelength * 1e-9 / (dSlitWidth * 1e-3)) * 180 / Math.PI).toFixed(2)}°`, color: 'text-red-700', bg: 'bg-red-50' },
          ].map(item => (
            <div key={item.label} className={`rounded-lg border border-slate-100 ${item.bg} px-3 py-2.5`}>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
              <div className={`mt-1 font-mono text-base font-extrabold ${item.color}`}>{item.value}</div>
            </div>
          ))}
          {mode === 'polarization' && polarizationReadouts.map(item => (
            <div key={item.label} className={`rounded-lg border border-slate-100 ${item.bg} px-3 py-2.5`}>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
              <div className={`mt-1 font-mono text-base font-extrabold ${item.color}`}>{item.value}</div>
            </div>
          ))}
          {mode === 'huygens' && [
            { label: 'Incident angle i', value: `${incidentAngle}°`, color: 'text-red-700', bg: 'bg-red-50' },
            { label: 'Refracted angle r', value: snell.tir ? 'TIR' : `${snell.rDeg.toFixed(1)}°`, color: snell.tir ? 'text-rose-700' : 'text-emerald-700', bg: snell.tir ? 'bg-rose-50' : 'bg-emerald-50' },
            { label: 'n₁', value: `${n1.toFixed(1)}`, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'n₂', value: `${n2.toFixed(1)}`, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'n1 sin i = n2 sin r', value: snell.tir ? `i > ic ${snell.criticalDeg?.toFixed(1)}°` : `${(n1 * Math.sin(incidentAngle * Math.PI / 180)).toFixed(3)}`, color: 'text-violet-700', bg: 'bg-violet-50' },
          ].map(item => (
            <div key={item.label} className={`rounded-lg border border-slate-100 ${item.bg} px-3 py-2.5`}>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</div>
              <div className={`mt-1 font-mono text-base font-extrabold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );

  const simulationJSX = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
      {graphPanel}
      {valuesPanel}
    </div>
  );

  // ─── Controls ───────────────────────────────────────────────────────────────
  const controlsJSX = (
    <div className="w-full space-y-4 p-4">
      {/* Mode tabs */}
      <div className="grid grid-cols-4 gap-2">
        {([['ydse', <Layers size={15} />, 'YDSE'],
           ['diffraction', <Activity size={15} />, 'Diffraction'],
           ['polarization', <Sun size={15} />, 'Polarization'],
           ['huygens', <Circle size={15} />, "Huygens"]] as const).map(([m, icon, label]) => (
          <button key={m} onClick={() => { setMode(m as WaveOpticsMode); reset(); }} className={tabCls(mode === m)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* YDSE controls */}
      {mode === 'ydse' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <SliderField label="Wavelength λ" value={`${wavelength} nm`} color={`rgb(${wlColor.r},${wlColor.g},${wlColor.b})`}>
              <input type="range" min="380" max="750" step="5" value={wavelength} onChange={e => setWavelength(+e.target.value)}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ background: 'linear-gradient(to right,#7e22ce,#3b82f6,#10b981,#eab308,#ef4444)' }} />
            </SliderField>
            <SliderField label="Slit separation d" value={`${slitSep.toFixed(1)} mm`}>
              <input type="range" min="0.1" max="5.0" step="0.1" value={slitSep} onChange={e => setSlitSep(+e.target.value)} className="w-full accent-indigo-600" />
            </SliderField>
          </div>
          <div className="space-y-3">
            <SliderField label="Screen distance D" value={`${screenDist.toFixed(1)} m`}>
              <input type="range" min="0.5" max="3.0" step="0.1" value={screenDist} onChange={e => setScreenDist(+e.target.value)} className="w-full accent-indigo-600" />
            </SliderField>
            <SliderField label="Slit width a" value={`${slitWidth.toFixed(2)} mm`}>
              <input type="range" min="0.01" max="0.5" step="0.01" value={slitWidth} onChange={e => setSlitWidth(+e.target.value)} className="w-full accent-indigo-600" />
            </SliderField>
            <ToggleBtn active={showEnvelope} onClick={() => setShowEnvelope(v => !v)} label="Diffraction Envelope" />
          </div>
        </div>
      )}

      {/* Diffraction controls */}
      {mode === 'diffraction' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <SliderField label="Wavelength λ" value={`${dWavelength} nm`} color={`rgb(${wavelengthToRgb(dWavelength).r},${wavelengthToRgb(dWavelength).g},${wavelengthToRgb(dWavelength).b})`}>
              <input type="range" min="380" max="750" step="5" value={dWavelength} onChange={e => setDWavelength(+e.target.value)}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ background: 'linear-gradient(to right,#7e22ce,#3b82f6,#10b981,#eab308,#ef4444)' }} />
            </SliderField>
            <SliderField label="Slit width a" value={`${dSlitWidth.toFixed(2)} mm`}>
              <input type="range" min="0.05" max="2.0" step="0.05" value={dSlitWidth} onChange={e => setDSlitWidth(+e.target.value)} className="w-full accent-indigo-600" />
            </SliderField>
          </div>
          <div className="space-y-3">
            <SliderField label="Screen distance D" value={`${dScreenDist.toFixed(1)} m`}>
              <input type="range" min="0.5" max="3.0" step="0.1" value={dScreenDist} onChange={e => setDScreenDist(+e.target.value)} className="w-full accent-indigo-600" />
            </SliderField>
            <ToggleBtn active={showAngles} onClick={() => setShowAngles(v => !v)} label="Angle Annotations" />
          </div>
        </div>
      )}

      {/* Polarization controls */}
      {mode === 'polarization' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            {threePol ? (
              <SliderField label="Middle polaroid angle theta" value={`${midAngle}°`}>
                <input type="range" min="0" max="90" step="1" value={midAngle} onChange={e => setMidAngle(+e.target.value)} className="w-full accent-violet-600" />
              </SliderField>
            ) : (
              <SliderField label="Analyzer angle theta" value={`${polAngle}°`}>
                <input type="range" min="0" max="360" step="1" value={polAngle} onChange={e => setPolAngle(+e.target.value)} className="w-full accent-indigo-600" />
              </SliderField>
            )}
          </div>
          <div className="space-y-3">
            <ToggleBtn active={threePol} onClick={() => setThreePol(v => !v)} label="3 Polaroids (paradox)" />
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2.5 text-sm">
              <div className="font-bold text-indigo-800">
                {threePol
                  ? `I/I0 = (1/8)sin²2theta = ${(threePolFinalRatioToI0(midAngle) * 100).toFixed(1)}%`
                  : `I/I1 = cos²theta = ${(Math.cos(polAngle * Math.PI / 180) ** 2 * 100).toFixed(1)}%`}
              </div>
              {!threePol && (polAngle === 90 || polAngle === 270) && <div className="text-red-600 font-bold text-xs mt-1">Crossed Polaroids - I = 0</div>}
            </div>
          </div>
        </div>
      )}

      {/* Huygens controls */}
      {mode === 'huygens' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1">
              {(['propagation', 'refraction', 'reflection'] as HuygensSubMode[]).map(sm => (
                <button key={sm} onClick={() => setHuygensSubMode(sm)}
                  className={`text-xs px-2 py-2 rounded-lg font-bold capitalize transition-all ${huygensSubMode === sm ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                  {sm}
                </button>
              ))}
            </div>
            {(huygensSubMode === 'refraction' || huygensSubMode === 'reflection') && (
              <SliderField label="Incident angle i" value={`${incidentAngle}°`}>
                <input type="range" min="10" max="80" step="1" value={incidentAngle} onChange={e => setIncidentAngle(+e.target.value)} className="w-full accent-red-500" />
              </SliderField>
            )}
          </div>
          {huygensSubMode === 'refraction' && (
            <div className="space-y-3">
              <SliderField label="n₁ (medium 1)" value={n1.toFixed(1)}>
                <input type="range" min="1.0" max="2.5" step="0.1" value={n1} onChange={e => setN1(+e.target.value)} className="w-full accent-blue-500" />
              </SliderField>
              <SliderField label="n₂ (medium 2)" value={n2.toFixed(1)}>
                <input type="range" min="1.0" max="2.5" step="0.1" value={n2} onChange={e => setN2(+e.target.value)} className="w-full accent-amber-500" />
              </SliderField>
            </div>
          )}
        </div>
      )}

      {/* Playback */}
      <div className="flex gap-3">
        <button onClick={() => setIsPlaying(v => !v)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
          {isPlaying ? <Pause size={16} /> : <Play size={16} />} {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={reset}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </div>
  );

  return (
    <TopicLayoutContainer
      topic={topic}
      onExit={onExit}
      SimulationComponent={simulationJSX}
      ControlsComponent={controlsJSX}
    />
  );
};

// ─── Small UI helpers ─────────────────────────────────────────────────────────
function SliderField({ label, value, color, children }: { label: string; value: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100" style={color ? { color } : {}}>
          {value}
        </span>
      </div>
      {children}
    </div>
  );
}

function ToggleBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold w-full transition-all ${
        active ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
      }`}>
      {active ? <Eye size={15} /> : <EyeOff size={15} />} {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS DRAW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── YDSE ────────────────────────────────────────────────────────────────────
function drawYDSE(
  ctx: CanvasRenderingContext2D, t: number,
  wl: number, d: number, D: number, a: number, envelope: boolean
) {
  const CY = CH / 2;
  const color = wlCss(wl);
  const colorHalf = wlCss(wl, 0.4);

  // ── Layout ──
  const barrierX = 220;
  const screenX  = 960;
  const d_px = clamp(d * 60, 30, 200);   // visual slit separation
  const s1y = CY - d_px / 2;
  const s2y = CY + d_px / 2;

  // ── Incoming plane wavefronts ──
  const waveSpacing = Math.max(20, wl / 20);
  ctx.save();
  ctx.strokeStyle = colorHalf;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  for (let x = (t * 60) % waveSpacing; x < barrierX - 10; x += waveSpacing) {
    ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, CH - 20); ctx.stroke();
  }
  ctx.restore();

  // ── Barrier ──
  const slitH = 12;
  ctx.fillStyle = '#334155';
  ctx.fillRect(barrierX - 6, 0, 12, s1y - slitH / 2);
  ctx.fillRect(barrierX - 6, s1y + slitH / 2, 12, s2y - s1y - slitH);
  ctx.fillRect(barrierX - 6, s2y + slitH / 2, 12, CH - s2y - slitH / 2);
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 13px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('S₁', barrierX - 20, s1y + 4);
  ctx.fillText('S₂', barrierX - 20, s2y + 4);

  // ── Huygens secondary wavelets from each slit ──
  ctx.save();
  ctx.lineWidth = 1.2;
  for (let r = (t * 60) % waveSpacing; r < screenX - barrierX; r += waveSpacing) {
    const alpha = Math.max(0, 1 - r / (screenX - barrierX));
    ctx.strokeStyle = wlCss(wl, alpha * 0.5);
    ctx.shadowColor = color; ctx.shadowBlur = 3;
    for (const sy of [s1y, s2y]) {
      ctx.beginPath();
      ctx.arc(barrierX, sy, r, -Math.PI * 0.55, Math.PI * 0.55);
      ctx.stroke();
    }
  }
  ctx.restore();

  // ── Screen ──
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(screenX, 20); ctx.lineTo(screenX, CH - 20); ctx.stroke();

  // ── Interference pattern on screen + intensity curve ──
  const lambda_m = wl * 1e-9;
  const d_m = d * 1e-3;
  const a_m = a * 1e-3;
  const D_m = D;
  const pxPerM = (CH - 80) / 0.1; // visual scale: ±50mm = full height
  const halfH = (CH - 80) / 2;

  for (let py = 20; py < CH - 20; py += 2) {
    const y_m = ((py - CY) / halfH) * 0.05;
    const sinTh = y_m / Math.sqrt(y_m * y_m + D_m * D_m);
    const beta = Math.PI * a_m * sinTh / lambda_m;
    const delta = Math.PI * d_m * sinTh / lambda_m;
    const env = envelope ? sinc(beta) ** 2 : 1;
    const I = env * Math.cos(delta) ** 2;
    if (I > 0.02) {
      const c = wavelengthToRgb(wl);
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${I * c.a})`;
      ctx.fillRect(screenX - 5, py, 10, 2);
    }
    // Intensity curve fill
    const curveX = screenX + 20 + I * 80;
    ctx.fillStyle = `rgba(30,41,59,${I * 0.55 + 0.05})`;
    ctx.fillRect(curveX, py, 2, 2);
  }

  // ── Intensity curve outline ──
  ctx.save();
  ctx.strokeStyle = 'rgba(15,23,42,0.85)';
  ctx.shadowColor = 'rgba(15,23,42,0.2)'; ctx.shadowBlur = 2;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let first = true;
  for (let py = 20; py < CH - 20; py += 1) {
    const y_m = ((py - CY) / halfH) * 0.05;
    const sinTh = y_m / Math.sqrt(y_m * y_m + D_m * D_m);
    const beta = Math.PI * a_m * sinTh / lambda_m;
    const delta = Math.PI * d_m * sinTh / lambda_m;
    const env = envelope ? sinc(beta) ** 2 : 1;
    const I = env * Math.cos(delta) ** 2;
    const curveX = screenX + 20 + I * 80;
    if (first) { ctx.moveTo(curveX, py); first = false; } else ctx.lineTo(curveX, py);
  }
  ctx.stroke();
  ctx.restore();

  // ── Fringe order labels ──
  for (let n = -3; n <= 3; n++) {
    const y_n_m = n * lambda_m * D_m / d_m;
    const py = CY + y_n_m * halfH / 0.05;
    if (py < 30 || py > CH - 30) continue;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(barrierX, py); ctx.lineTo(screenX + 115, py); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = n === 0 ? '#d97706' : '#64748b';
    ctx.font = n === 0 ? 'bold 12px Inter, monospace' : '11px Inter, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`n=${n}`, screenX + 108, py + 4);
  }

  // ── Central axis ──
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = 'rgba(217,119,6,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(barrierX, CY); ctx.lineTo(screenX, CY); ctx.stroke();
  ctx.restore();

  // ── Labels ──
  ctx.fillStyle = '#475569';
  ctx.font = '12px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`λ = ${wl} nm   d = ${d.toFixed(1)} mm   D = ${D.toFixed(1)} m`, CW / 2, CH - 8);
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';
  ctx.fillText('I(y)', screenX + 110, 18);
}

// ─── Single-slit Diffraction ──────────────────────────────────────────────────
function drawDiffraction(
  ctx: CanvasRenderingContext2D, t: number,
  wl: number, a: number, D: number, showAngles: boolean
) {
  const CY = CH / 2;
  const barrierX = 240;
  const screenX  = 960;
  const color = wlCss(wl);
  const waveSpacing = Math.max(18, wl / 22);
  const halfH = (CH - 80) / 2;

  // Incident wavefronts
  ctx.save();
  ctx.strokeStyle = wlCss(wl, 0.35);
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color; ctx.shadowBlur = 3;
  for (let x = (t * 55) % waveSpacing; x < barrierX - 8; x += waveSpacing) {
    ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, CH - 20); ctx.stroke();
  }
  ctx.restore();

  // Barrier (single slit)
  const slit_px = clamp(a * 200, 8, 160);
  ctx.fillStyle = '#334155';
  ctx.fillRect(barrierX - 6, 0, 12, CY - slit_px / 2);
  ctx.fillRect(barrierX - 6, CY + slit_px / 2, 12, CH - CY - slit_px / 2);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(barrierX - 14, CY - slit_px / 2); ctx.lineTo(barrierX + 14, CY - slit_px / 2);
  ctx.moveTo(barrierX - 14, CY + slit_px / 2); ctx.lineTo(barrierX + 14, CY + slit_px / 2);
  ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`a = ${a.toFixed(2)} mm`, barrierX, CY + slit_px / 2 + 24);

  // Huygens wavelets spreading in all directions from slit
  ctx.save();
  ctx.lineWidth = 1;
  for (let r = (t * 55) % waveSpacing; r < screenX - barrierX; r += waveSpacing) {
    const alpha = Math.max(0, 1 - r / (screenX - barrierX + 80));
    ctx.strokeStyle = wlCss(wl, alpha * 0.45);
    ctx.shadowColor = color; ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.arc(barrierX, CY, r, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.stroke();
  }
  ctx.restore();

  // Screen
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(screenX, 20); ctx.lineTo(screenX, CH - 20); ctx.stroke();

  // Diffraction pattern on screen + sinc² curve
  const lambda_m = wl * 1e-9;
  const a_m = a * 1e-3;
  const D_m = D;

  for (let py = 20; py < CH - 20; py += 2) {
    const y_m = ((py - CY) / halfH) * 0.06;
    const sinTh = y_m / Math.sqrt(y_m * y_m + D_m * D_m);
    const betaV = Math.PI * a_m * sinTh / lambda_m;
    const I = sinc(betaV) ** 2;
    if (I > 0.01) {
      const c = wavelengthToRgb(wl);
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${I * c.a})`;
      ctx.fillRect(screenX - 6, py, 12, 2);
    }
  }

  // sinc² intensity curve
  ctx.save();
  ctx.strokeStyle = 'rgba(15,23,42,0.85)';
  ctx.shadowColor = 'rgba(15,23,42,0.15)'; ctx.shadowBlur = 2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let first = true;
  for (let py = 20; py < CH - 20; py++) {
    const y_m = ((py - CY) / halfH) * 0.06;
    const sinTh = y_m / Math.sqrt(y_m * y_m + D_m * D_m);
    const betaV = Math.PI * a_m * sinTh / lambda_m;
    const I = sinc(betaV) ** 2;
    const cx2 = screenX + 18 + I * 90;
    if (first) { ctx.moveTo(cx2, py); first = false; } else ctx.lineTo(cx2, py);
  }
  ctx.stroke();
  ctx.restore();

  // Minimum markers
  for (let n = -3; n <= 3; n++) {
    if (n === 0) continue;
    const y_n_m = n * lambda_m * D_m / a_m;
    const py = CY + y_n_m * halfH / 0.06;
    if (py < 30 || py > CH - 30) continue;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(239,68,68,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(screenX, py); ctx.lineTo(screenX + 120, py); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ef4444';
    ctx.font = '11px Inter, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`m=${n}`, screenX + 112, py + 4);
  }

  // Central max label
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 12px Inter, monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Central Max', screenX + 18, CY - 6);

  // Angle arc for first minimum
  if (showAngles) {
    const theta1 = Math.asin(lambda_m / a_m);
    const arcLen = 80;
    ctx.save();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(barrierX, CY, arcLen, 0, theta1);
    ctx.stroke();
    ctx.fillStyle = '#22c55e';
    ctx.font = '11px Inter, monospace';
    ctx.fillText(`θ₁ = ${(theta1 * 180 / Math.PI).toFixed(1)}°`, barrierX + arcLen + 4, CY - 10);
    ctx.restore();
  }

  // central axis
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = 'rgba(180,100,6,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(barrierX, CY); ctx.lineTo(screenX + 5, CY); ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#475569';
  ctx.font = '12px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`λ = ${wl} nm   a = ${a.toFixed(2)} mm   D = ${D.toFixed(1)} m`, CW / 2, CH - 8);
}

// ─── Polarization ─────────────────────────────────────────────────────────────
function drawPolarization(
  ctx: CanvasRenderingContext2D, t: number,
  theta: number, threePol: boolean, midTheta: number
) {
  const CY = CH / 2;
  const thetaRad = theta * Math.PI / 180;
  const midRad = midTheta * Math.PI / 180;
  const omega = 2.5;

  // Source (unpolarised light — E arrows in all directions)
  const srcX = 80;
  ctx.fillStyle = '#fef3c7';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(srcX, CY, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 11px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Light', srcX, CY + 42);
  ctx.fillText('Source', srcX, CY + 56);
  // E arrows in all directions
  for (let i = 0; i < 8; i++) {
    const ang = i * Math.PI / 4 + t * 0.8;
    const r = 20;
    ctx.strokeStyle = 'rgba(251,191,36,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(srcX - Math.cos(ang) * r, CY - Math.sin(ang) * r);
    ctx.lineTo(srcX + Math.cos(ang) * r, CY + Math.sin(ang) * r);
    ctx.stroke();
  }

  // First polaroid P₁ (pass axis = vertical = 90°)
  const p1x = 240;
  drawPolaroid(ctx, p1x, CY, 90, '#06b6d4', 'P₁', 'Pass: vertical');

  // Polarised light ray between P₁ and P₂ (or P₁ and mid)
  const p2x = threePol ? 560 : 760;
  const midX = 480;

  // Ray from source to P₁
  ctx.strokeStyle = 'rgba(251,191,36,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(srcX + 28, CY); ctx.lineTo(p1x - 20, CY); ctx.stroke();

  // Polarised ray P₁ → P₂ (or mid): oscillates vertically
  const rayLen = threePol ? midX - p1x - 40 : p2x - p1x - 40;
  drawPolarisedRay(ctx, p1x + 20, CY, rayLen, 0, omega, t, '#06b6d4'); // vertical = 0 to axis

  if (threePol) {
    // Middle polaroid P₂ at midTheta
    drawPolaroid(ctx, midX, CY, midTheta + 90, '#a855f7', 'P₂', `Pass: ${midTheta}°`);
    // Ray P₂ → P₃
    const I_mid = Math.cos(midRad) ** 2;
    drawPolarisedRay(ctx, midX + 20, CY, p2x - midX - 40, midRad, omega, t, '#a855f7', I_mid);
    // Final polaroid P₃ at 90° (crossed with P₁)
    drawPolaroid(ctx, p2x, CY, 180, '#3b82f6', 'P₃', 'Pass: horiz');
    const I_final = I_mid * Math.cos((Math.PI / 2 - midRad)) ** 2;
    const I_finalFromI0 = 0.5 * I_final;
    const afterX = p2x + 20;
    drawPolarisedRay(ctx, afterX, CY, 200, Math.PI / 2, omega, t, '#3b82f6', I_final);
    // Screen
    drawScreen(ctx, afterX + 210, CY, I_finalFromI0);
    // I annotation
    ctx.fillStyle = '#1e293b';
    ctx.font = '11px Inter, monospace';
    ctx.textAlign = 'center';
    ctx.fillText("Malus's Law (3 polaroids): I = (I₀/8)sin²2θ", CW / 2, CH - 24);
    ctx.fillText(`= ${(I_finalFromI0 * 100).toFixed(1)}% of I₀`, CW / 2, CH - 10);
  } else {
    // Second polaroid P₂
    drawPolaroid(ctx, p2x, CY, thetaRad * 180 / Math.PI + 90, '#3b82f6', 'P₂', `θ = ${theta}°`);
    // Ray after P₂
    const I_after = Math.cos(thetaRad) ** 2;
    drawPolarisedRay(ctx, p2x + 20, CY, 240, thetaRad, omega, t, '#3b82f6', I_after);
    // Screen
    drawScreen(ctx, p2x + 270, CY, I_after);
    // Malus's law annotation
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Malus's Law: I = I₁ cos²θ = ${(I_after * 100).toFixed(1)}% of I₁`, CW / 2, CH - 12);
    if (theta === 90 || theta === 270) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 14px Inter, monospace';
      ctx.fillText('Crossed Polaroids — I = 0', CW / 2, CH - 28);
    }
  }

  // Ray from P₁ unpolarised segment label
  ctx.fillStyle = '#475569';
  ctx.font = '11px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Unpolarised', (srcX + p1x) / 2, CY - 40);
  ctx.fillText('Polarised', (p1x + (threePol ? midX : p2x)) / 2, CY - 40);
}

function drawPolaroid(ctx: CanvasRenderingContext2D, cx: number, cy: number, passAxisAngle: number, color: string, label: string, sub: string) {
  const a = passAxisAngle * Math.PI / 180;
  const w = 18, h = 140;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color + '33';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  // Pass axis line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-Math.cos(a) * 50, -Math.sin(a) * 50);
  ctx.lineTo(Math.cos(a) * 50, Math.sin(a) * 50);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = color;
  ctx.font = 'bold 13px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy - 82);
  ctx.font = '11px Inter, monospace';
  ctx.fillText(sub, cx, cy + 90);
}

function drawPolarisedRay(ctx: CanvasRenderingContext2D, x: number, cy: number, len: number, axisAngle: number, omega: number, t: number, color: string, amplitude = 1) {
  if (amplitude < 0.005) return;
  const steps = Math.floor(len / 4);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = clamp(amplitude, 0.1, 1);
  // Propagation direction
  ctx.strokeStyle = 'rgba(148,163,184,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + len, cy); ctx.stroke();
  // E wave oscillation along axis
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color; ctx.shadowBlur = 5;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const px = x + i * 4;
    const phase = (px / 40) * Math.PI * 2 - omega * t;
    const amp = Math.sin(phase) * 30 * amplitude;
    const ey = cy + amp * Math.cos(axisAngle);
    if (i === 0) ctx.moveTo(px, ey); else ctx.lineTo(px, ey);
  }
  ctx.stroke();
  ctx.restore();
}

function drawScreen(ctx: CanvasRenderingContext2D, x: number, cy: number, intensity: number) {
  const h = 180;
  ctx.fillStyle = `rgba(${Math.round(255 * intensity)},${Math.round(200 * intensity)},${Math.round(50 * intensity)},${intensity})`;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  roundRect(ctx, x, cy - h / 2, 18, h, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Screen', x + 9, cy + h / 2 + 18);
  ctx.fillText(`${(intensity * 100).toFixed(0)}%`, x + 9, cy - h / 2 - 8);
}

// ─── Huygens ─────────────────────────────────────────────────────────────────
function drawHuygens(
  ctx: CanvasRenderingContext2D, t: number,
  subMode: HuygensSubMode, n1: number, n2: number, incAngle: number
) {
  if (subMode === 'propagation') drawHuygensPropagation(ctx, t);
  else if (subMode === 'refraction') drawHuygensRefraction(ctx, t, n1, n2, incAngle);
  else drawHuygensReflection(ctx, t, incAngle);
}

function drawHuygensPropagation(ctx: CanvasRenderingContext2D, t: number) {
  const CY = CH / 2;
  // Point source (spherical wavefronts)
  const srcX = 180, srcY = CY;
  const speed = 90; // px/s
  const maxR = 600;
  const waveInterval = 60;

  ctx.fillStyle = '#fef3c7';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(srcX, srcY, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Expanding spherical wavefronts
  for (let i = 0; i < 8; i++) {
    const r = ((t * speed - i * waveInterval) % maxR + maxR) % maxR;
    if (r < 5) continue;
    const alpha = Math.max(0, 1 - r / maxR);
    ctx.save();
    ctx.strokeStyle = `rgba(99,102,241,${alpha * 0.8})`;
    ctx.shadowColor = '#818cf8'; ctx.shadowBlur = 6;
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(srcX, srcY, r, 0, Math.PI * 2); ctx.stroke();

    // Secondary wavelets on this wavefront (8 points)
    for (let j = 0; j < 8; j++) {
      const ang = (j / 8) * Math.PI * 2;
      const wx = srcX + Math.cos(ang) * r;
      const wy = srcY + Math.sin(ang) * r;
      if (wx < 0 || wx > CW || wy < 0 || wy > CH) continue;
      const subR = (t * speed % waveInterval) * 0.5;
      ctx.strokeStyle = `rgba(165,180,252,${alpha * 0.4})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(wx, wy, subR, 0, Math.PI * 2); ctx.stroke();
      // Dot at secondary source
      ctx.fillStyle = `rgba(165,180,252,${alpha * 0.7})`;
      ctx.beginPath(); ctx.arc(wx, wy, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Labels
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 13px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Point Source', srcX, srcY + 30);
  ctx.font = '12px Inter, monospace';
  ctx.fillText('Spherical wavefronts (solid) + secondary wavelets (dashed small circles)', CW / 2, CH - 20);
  ctx.fillText('Each point on wavefront = new secondary source (Huygens, NCERT §10.2)', CW / 2, CH - 6);
}

function drawHuygensRefraction(ctx: CanvasRenderingContext2D, t: number, n1: number, n2: number, incAngle: number) {
  const interfaceY = CH / 2;
  const v1 = 1 / n1; // relative speed
  const v2 = 1 / n2;
  const iRad = incAngle * Math.PI / 180;
  const rawSinR = (n1 / n2) * Math.sin(iRad);
  const tir = n1 > n2 && rawSinR > 1;
  const sinR = clamp(rawSinR, -1, 1);
  const rRad = tir ? Math.PI / 2 : Math.asin(sinR);

  // Medium backgrounds
  ctx.fillStyle = 'rgba(219,234,254,0.35)';
  ctx.fillRect(0, 0, CW, interfaceY);
  ctx.fillStyle = 'rgba(209,250,229,0.35)';
  ctx.fillRect(0, interfaceY, CW, CH - interfaceY);

  // Interface
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, interfaceY); ctx.lineTo(CW, interfaceY); ctx.stroke();

  // Medium labels
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 14px Inter, monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Medium 1  n₁ = ${n1.toFixed(1)}  (${n1 <= n2 ? 'faster, rarer' : 'slower, denser'})`, 30, interfaceY - 20);
  ctx.fillText(`Medium 2  n₂ = ${n2.toFixed(1)}  (${n2 >= n1 ? 'slower, denser' : 'faster, rarer'})`, 30, interfaceY + 36);

  // Normal
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(640, interfaceY - 160); ctx.lineTo(640, interfaceY + 160); ctx.stroke();
  ctx.restore();

  // Incident wavefronts (in medium 1, above interface)
  const waveSpeed = 60 * v1;
  const waveSpacing = 50 * v1;
  const cosI = Math.cos(iRad), sinI = Math.sin(iRad);
  ctx.save();
  ctx.strokeStyle = 'rgba(99,102,241,0.7)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#818cf8'; ctx.shadowBlur = 4;
  for (let i = 0; i < 6; i++) {
    const phase = (t * waveSpeed - i * waveSpacing + 500) % 500;
    const px = 640 - cosI * (phase - 250);
    const py = interfaceY - sinI * 300 + sinI * (phase - 250);
    const wx1 = px - cosI * 300, wy1 = py + sinI * 300;
    const wx2 = px + cosI * 300, wy2 = py - sinI * 300;
    // clip to above interface
    const clip = (y1: number, y2: number, x1: number, x2: number) => {
      if (y1 > interfaceY && y2 > interfaceY) return null;
      if (y1 <= interfaceY && y2 <= interfaceY) return [[x1, y1], [x2, y2]] as [number, number][];
      const frac = (interfaceY - y1) / (y2 - y1);
      const xm = x1 + frac * (x2 - x1);
      return y1 <= interfaceY ? [[x1, y1], [xm, interfaceY]] as [number, number][] : [[xm, interfaceY], [x2, y2]] as [number, number][];
    };
    const seg = clip(wy1, wy2, wx1, wx2);
    if (seg) {
      ctx.beginPath(); ctx.moveTo(seg[0][0], seg[0][1]); ctx.lineTo(seg[1][0], seg[1][1]); ctx.stroke();
    }
  }
  ctx.restore();

  if (!tir) {
    // Refracted wavefronts (in medium 2, below interface)
    const waveSpeed2 = 60 * v2;
    const waveSpacing2 = 50 * v2;
    ctx.save();
    ctx.strokeStyle = 'rgba(34,197,94,0.7)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 4;
    for (let i = 0; i < 6; i++) {
      const phase = (t * waveSpeed2 - i * waveSpacing2 + 500) % 500;
      const cosR = Math.cos(rRad), sinR2 = Math.sin(rRad);
      const px = 640 + sinR2 * (phase - 250);
      const py = interfaceY + cosR * (phase - 250);
      const wx1 = px - cosR * 280, wy1 = py + sinR2 * 280;
      const wx2 = px + cosR * 280, wy2 = py - sinR2 * 280;
      const clip = (y1: number, y2: number, x1: number, x2: number) => {
        if (y1 < interfaceY && y2 < interfaceY) return null;
        if (y1 >= interfaceY && y2 >= interfaceY) return [[x1, y1], [x2, y2]] as [number, number][];
        const frac = (interfaceY - y1) / (y2 - y1);
        const xm = x1 + frac * (x2 - x1);
        return y1 >= interfaceY ? [[x1, y1], [xm, interfaceY]] as [number, number][] : [[xm, interfaceY], [x2, y2]] as [number, number][];
      };
      const seg = clip(wy1, wy2, wx1, wx2);
      if (seg) {
        ctx.beginPath(); ctx.moveTo(seg[0][0], seg[0][1]); ctx.lineTo(seg[1][0], seg[1][1]); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Ray lines
  ctx.save();
  ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.moveTo(640 - Math.sin(iRad) * 200, interfaceY - Math.cos(iRad) * 200);
  ctx.lineTo(640, interfaceY); ctx.stroke();
  ctx.strokeStyle = tir ? '#be123c' : '#22c55e'; ctx.shadowColor = tir ? '#be123c' : '#22c55e';
  ctx.beginPath();
  ctx.moveTo(640, interfaceY);
  ctx.lineTo(640 + Math.sin(tir ? iRad : rRad) * 200, tir ? interfaceY - Math.cos(iRad) * 200 : interfaceY + Math.cos(rRad) * 200);
  ctx.stroke();
  ctx.restore();

  // Angle annotations
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 13px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`i = ${incAngle}°`, 640 - Math.sin(iRad) * 80, interfaceY - Math.cos(iRad) * 80 - 10);
  if (tir) {
    const critical = Math.asin(clamp(n2 / n1, -1, 1)) * 180 / Math.PI;
    ctx.fillStyle = '#be123c';
    ctx.fillText(`TIR: i > ic = ${critical.toFixed(1)}°`, 760, interfaceY - 110);
  } else {
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`r = ${(rRad * 180 / Math.PI).toFixed(1)}°`, 640 + Math.sin(rRad) * 90 + 10, interfaceY + Math.cos(rRad) * 90);
  }

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(tir ? 'Total internal reflection: no refracted wavefront in medium 2' : `n1 sin i = n2 sin r  ->  ${(n1 * Math.sin(iRad)).toFixed(3)} = ${(n2 * sinR).toFixed(3)}`, CW / 2, CH - 12);
}

function drawHuygensReflection(ctx: CanvasRenderingContext2D, t: number, incAngle: number) {
  const surfaceY = CH / 2 + 80;
  const iRad = incAngle * Math.PI / 180;
  const speed = 70;
  const waveSpacing = 55;

  // Reflecting surface
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, surfaceY, CW, 20);
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 13px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Reflecting surface (MN)', CW / 2, surfaceY + 14);

  // Normal
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(640, surfaceY - 200); ctx.lineTo(640, surfaceY); ctx.stroke();
  ctx.restore();

  // Incident wavefronts
  const cosI = Math.cos(iRad), sinI = Math.sin(iRad);
  ctx.save();
  ctx.strokeStyle = 'rgba(99,102,241,0.7)';
  ctx.lineWidth = 2; ctx.shadowColor = '#818cf8'; ctx.shadowBlur = 4;
  for (let i = 0; i < 5; i++) {
    const phase = (t * speed - i * waveSpacing + 400) % 400;
    if (phase < 0) continue;
    const px = 640 - cosI * (phase - 200);
    const py = surfaceY - sinI * 300 + sinI * (phase - 200);
    ctx.beginPath();
    ctx.moveTo(px - cosI * 300, py + sinI * 300);
    ctx.lineTo(px + cosI * 300, py - sinI * 300);
    ctx.stroke();
  }
  ctx.restore();

  // Reflected wavefronts (angle of reflection = angle of incidence)
  ctx.save();
  ctx.strokeStyle = 'rgba(250,204,21,0.7)';
  ctx.lineWidth = 2; ctx.shadowColor = '#facc15'; ctx.shadowBlur = 4;
  for (let i = 0; i < 5; i++) {
    const phase = (t * speed - i * waveSpacing + 400) % 400;
    const px = 640 + cosI * (phase - 200);
    const py = surfaceY - sinI * 300 + sinI * (phase - 200);
    const seg = [[px - cosI * 300, py + sinI * 300], [px + cosI * 300, py - sinI * 300]];
    // Only draw above surface
    ctx.beginPath();
    ctx.moveTo(seg[0][0], Math.min(seg[0][1], surfaceY));
    ctx.lineTo(seg[1][0], Math.min(seg[1][1], surfaceY));
    ctx.stroke();
  }
  ctx.restore();

  // Ray lines
  ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 4;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(640 - sinI * 220, surfaceY - cosI * 220);
  ctx.lineTo(640, surfaceY); ctx.stroke();
  ctx.strokeStyle = '#facc15'; ctx.shadowColor = '#facc15';
  ctx.beginPath();
  ctx.moveTo(640, surfaceY);
  ctx.lineTo(640 + sinI * 220, surfaceY - cosI * 220);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 13px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`i = ${incAngle}°`, 640 - sinI * 100, surfaceY - cosI * 100 - 12);
  ctx.fillStyle = '#b45309';
  ctx.fillText(`r = ${incAngle}° (NCERT: i = r)`, 640 + sinI * 100 + 30, surfaceY - cosI * 100 - 12);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Law of Reflection: angle of incidence = angle of reflection (NCERT §10.3.3)', CW / 2, CH - 12);
}

export default WaveOpticsLab;
