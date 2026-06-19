import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Pause, Play, RotateCcw, FlaskConical } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

// ── NCERT Ch 2, §2.4 — Table 2.4 + Examples 2.6, 2.8, 2.9 ─────────────────
const EL_DATA = {
  KCl:  { label: 'KCl',     type: 'strong' as const, lam0: 150.0, A: 87.46, Ka: 0,       color: '#2563eb', cation: 'K⁺',     anion: 'Cl⁻',     lp: 73.5,  lm: 76.3,  ncert: 'Example 2.6' },
  NaCl: { label: 'NaCl',    type: 'strong' as const, lam0: 126.4, A: 87.0,  Ka: 0,       color: '#16a34a', cation: 'Na⁺',    anion: 'Cl⁻',     lp: 50.1,  lm: 76.3,  ncert: 'Example 2.8' },
  HCl:  { label: 'HCl',     type: 'strong' as const, lam0: 425.9, A: 87.0,  Ka: 0,       color: '#dc2626', cation: 'H⁺',     anion: 'Cl⁻',     lp: 349.6, lm: 76.3,  ncert: 'Example 2.8' },
  HAc:  { label: 'CH₃COOH', type: 'weak'   as const, lam0: 390.5, A: 0,     Ka: 1.78e-5, color: '#9333ea', cation: 'H⁺',     anion: 'CH₃COO⁻', lp: 349.6, lm: 40.9,  ncert: 'Example 2.9' },
} as const;
type ELId = keyof typeof EL_DATA;
const EL_ORDER: ELId[] = ['KCl', 'NaCl', 'HCl', 'HAc'];

function computeLam(id: ELId, c: number) {
  const el = EL_DATA[id];
  const sqrtC = Math.sqrt(Math.max(1e-9, c));
  if (el.type === 'strong') {
    const lam = Math.max(0, el.lam0 - el.A * sqrtC);
    return { lam, kappa: lam * c / 1000, alpha: undefined as number | undefined };
  }
  const Ka = el.Ka;
  const alpha = Math.min(1, (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / (2 * c));
  const lam = alpha * el.lam0;
  return { lam, kappa: lam * c / 1000, alpha };
}

const W = 1280, H = 760;
const GX1 = 70, GX2 = 800, GY1 = 50, GY2 = 700;
const GW = GX2 - GX1, GH = GY2 - GY1;
const SC_MAX = 0.5, LAM_MAX = 450;
const toGX = (sc: number) => GX1 + (sc / SC_MAX) * GW;
const toGY = (lam: number) => GY2 - (lam / LAM_MAX) * GH;

// Cell area
const CX1 = 850, CX2 = 1240, CY1 = 110, CY2 = 650;
const EX1 = CX1 + 18, EX2 = CX2 - 18;

interface Ion { x: number; y: number; type: '+' | '-'; vy: number; }
interface Props { topic: any; onExit: () => void; }

const ConductanceConcentrationLab: React.FC<Props> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const ionsRef = useRef<Ion[]>([]);

  const [elId, setElId] = useState<ELId>('KCl');
  const [cVal, setCVal] = useState(0.01);
  const [showAll, setShowAll] = useState(true);
  const [paused, setPaused] = useState(false);

  const el = EL_DATA[elId];
  const { lam, kappa, alpha } = computeLam(elId, cVal);
  const sqrtC = Math.sqrt(cVal);

  // Ion init
  const initIons = useCallback((n: number) => {
    ionsRef.current = Array.from({ length: n }, (_, i) => ({
      x: EX1 + Math.random() * (EX2 - EX1),
      y: CY1 + 20 + Math.random() * (CY2 - CY1 - 40),
      type: (i % 2 === 0 ? '+' : '-') as '+' | '-',
      vy: (Math.random() - 0.5) * 0.5,
    }));
  }, []);

  useEffect(() => {
    const ionFrac = el.type === 'weak' ? Math.max(0.12, alpha ?? 0.12) : 1.0;
    const n = 2 * Math.max(2, Math.round(10 * ionFrac));
    initIons(n);
  }, [elId, cVal, alpha, el.type, initIons]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const ionSpeed = Math.min(3.5, (lam / 150) * 1.6);
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // ── Graph background ──────────────────────────────────
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.roundRect(GX1 - 12, GY1 - 12, GW + 24, GH + 24, 14); ctx.fill();
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.stroke();

      // Grid
      for (let i = 0; i <= 5; i++) {
        ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(toGX((i / 5) * SC_MAX), GY1); ctx.lineTo(toGX((i / 5) * SC_MAX), GY2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(GX1, toGY((i / 5) * LAM_MAX)); ctx.lineTo(GX2, toGY((i / 5) * LAM_MAX)); ctx.stroke();
      }
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(GX1, GY1); ctx.lineTo(GX1, GY2); ctx.lineTo(GX2, GY2); ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('√c  /  (mol L⁻¹)^½', (GX1 + GX2) / 2, GY2 + 36);
      ctx.save(); ctx.translate(GX1 - 48, (GY1 + GY2) / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText('Λm  /  S cm² mol⁻¹', 0, 0); ctx.restore();

      ctx.font = '11px Inter, system-ui, sans-serif'; ctx.fillStyle = '#64748b';
      for (let i = 0; i <= 5; i++) {
        ctx.textAlign = 'center';
        ctx.fillText(((i / 5) * SC_MAX).toFixed(2), toGX((i / 5) * SC_MAX), GY2 + 16);
        ctx.textAlign = 'right';
        ctx.fillText(((i / 5) * LAM_MAX).toFixed(0), GX1 - 6, toGY((i / 5) * LAM_MAX) + 4);
      }

      // Curves
      const drawCurve = (id: ELId, highlight: boolean) => {
        const e = EL_DATA[id];
        ctx.strokeStyle = highlight ? e.color : e.color + '44';
        ctx.lineWidth = highlight ? 3 : 1.5;
        ctx.beginPath();
        let first = true;
        for (let sc = 0.002; sc <= SC_MAX; sc += 0.003) {
          const { lam: lv } = computeLam(id, sc * sc);
          const px = toGX(sc), py = toGY(lv);
          first ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          first = false;
        }
        ctx.stroke();
        if (highlight) {
          const { lam: lamEnd } = computeLam(id, SC_MAX * SC_MAX);
          ctx.fillStyle = e.color; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'left';
          ctx.fillText(e.label, GX2 + 5, toGY(lamEnd) + 4);
        }
      };

      if (showAll) EL_ORDER.filter(id => id !== elId).forEach(id => drawCurve(id, false));
      drawCurve(elId, true);

      // Current point with pulsing ring
      const px = toGX(sqrtC), py = toGY(lam);
      const pulseR = 10 + 5 * (0.5 + 0.5 * Math.sin(performance.now() / 1000 * 3));
      ctx.strokeStyle = el.color + '66'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, pulseR, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = el.color;
      ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      // Λ°m intercept tick
      ctx.strokeStyle = el.color + '88'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(GX1, toGY(el.lam0)); ctx.lineTo(GX2, toGY(el.lam0)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = el.color; ctx.font = '10px Inter'; ctx.textAlign = 'left';
      ctx.fillText(`Λ°m=${el.lam0}`, GX1 + 4, toGY(el.lam0) - 4);

      // ── Conductance Cell ──────────────────────────────────
      ctx.fillStyle = '#eff6ff'; ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(EX1, CY1, EX2 - EX1, CY2 - CY1, 6); ctx.fill(); ctx.stroke();

      // Electrodes
      ctx.fillStyle = '#334155';
      ctx.fillRect(EX1 - 2, CY1 - 10, 12, CY2 - CY1 + 20);
      ctx.fillRect(EX2 - 10, CY1 - 10, 12, CY2 - CY1 + 20);

      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
      ctx.fillText('(+)', EX1 + 4, CY1 - 18);
      ctx.fillText('(−)', EX2 - 4, CY1 - 18);
      ctx.fillText('Conductance Cell', (EX1 + EX2) / 2, CY1 - 18);

      // faint electric-field guide lines (+ → −), animated dashes
      const nowS = performance.now() / 1000;
      ctx.save();
      ctx.strokeStyle = 'rgba(59,130,246,0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 10]);
      ctx.lineDashOffset = -(nowS * 30) % 16;
      for (let fy = CY1 + 40; fy < CY2; fy += 60) {
        ctx.beginPath(); ctx.moveTo(EX1 + 14, fy); ctx.lineTo(EX2 - 14, fy); ctx.stroke();
      }
      ctx.restore();
      ctx.setLineDash([]);

      // Update ions
      if (!paused) {
        for (const ion of ionsRef.current) {
          ion.x += (ion.type === '+' ? 1 : -1) * ionSpeed;
          ion.y += ion.vy;
          if (ion.x > EX2 - 8) ion.x = EX1 + 8;
          if (ion.x < EX1 + 8) ion.x = EX2 - 8;
          if (ion.y < CY1 + 8 || ion.y > CY2 - 8) ion.vy *= -1;
        }
      }
      for (const ion of ionsRef.current) {
        const col = ion.type === '+' ? el.color : '#dc2626';
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = 8;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(ion.x, ion.y, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center';
        ctx.fillText(ion.type === '+' ? '+' : '−', ion.x, ion.y + 3);
      }

      // Cell readout
      ctx.fillStyle = '#0f172a'; ctx.font = 'bold 15px Inter'; ctx.textAlign = 'center';
      ctx.fillText(`Λm = ${lam.toFixed(1)} S cm² mol⁻¹`, (EX1 + EX2) / 2, CY2 + 26);
      ctx.fillStyle = '#64748b'; ctx.font = '12px Inter';
      ctx.fillText(`κ = ${kappa.toExponential(2)} S cm⁻¹`, (EX1 + EX2) / 2, CY2 + 46);
      if (el.type === 'weak' && alpha !== undefined) {
        ctx.fillStyle = '#9333ea'; ctx.font = 'bold 12px Inter';
        ctx.fillText(`α = ${alpha.toFixed(4)}  →  ${Math.round(ionsRef.current.length / 2)} ion pairs`, (EX1 + EX2) / 2, CY2 + 68);
      }

      if (!paused) animId = requestAnimationFrame(draw);
    };

    draw(); // immediate first paint (does not depend on rAF firing)
    return () => cancelAnimationFrame(animId);
  }, [paused, elId, cVal, lam, kappa, sqrtC, showAll, alpha, el.color, el.cation, el.anion, el.type, el.lam0]);

  const graphPanel = useMemo(() => (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[330px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <h3 className="text-sm font-extrabold text-slate-900">κ vs c — conductivity</h3>
          <p className="text-[11px] font-semibold text-slate-500">κ decreases on dilution (NCERT §2.4)</p>
          <svg viewBox="0 0 300 140" className="mt-2 w-full">
            <line x1="38" y1="8" x2="38" y2="122" stroke="#94a3b8" />
            <line x1="38" y1="122" x2="290" y2="122" stroke="#94a3b8" />
            <text x="164" y="137" fontSize="10" fill="#475569" textAnchor="middle">c (mol/L) →</text>
            <text x="33" y="12" fontSize="10" fill="#475569" textAnchor="end">κ</text>
            {EL_ORDER.map(id => {
              const e = EL_DATA[id];
              const pts = [];
              for (let ci = 0.001; ci <= 0.25; ci += 0.003) {
                const { kappa: kv } = computeLam(id, ci);
                pts.push(`${38 + (ci / 0.25) * 252},${122 - Math.min(110, (kv / 0.04) * 110)}`);
              }
              return <polyline key={id} points={pts.join(' ')} fill="none" stroke={e.color} strokeWidth={id === elId ? 2.5 : 1} opacity={id === elId ? 1 : 0.3} />;
            })}
            <circle cx={38 + (cVal / 0.25) * 252} cy={122 - Math.min(110, (kappa / 0.04) * 110)} r={5} fill={el.color} />
          </svg>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <h3 className="text-sm font-extrabold text-slate-900">NCERT Table 2.4 — λ° at 298 K</h3>
          <p className="text-[11px] font-semibold text-slate-500">Limiting molar conductivities (S cm² mol⁻¹)</p>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-semibold">
            {[['H⁺','349.6'],['OH⁻','199.1'],['K⁺','73.5'],['Cl⁻','76.3'],['Na⁺','50.1'],['Br⁻','78.1'],['Ca²⁺','119.0'],['CH₃COO⁻','40.9'],['Mg²⁺','106.0'],['SO₄²⁻','160.0']].map(([ion, val]) => (
              <div key={ion} className="flex justify-between rounded bg-slate-50 px-2 py-1">
                <span className="text-slate-600">{ion}</span>
                <span className="font-mono text-slate-900">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {elId === 'HAc' && alpha !== undefined && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-3 shadow-xl">
            <h3 className="text-sm font-extrabold text-purple-950">Weak Acid Dissociation</h3>
            <p className="text-[11px] font-semibold text-purple-700">α = Λm/Λ°m (Eq 2.26) · Ka = cα²/(1−α) (Eq 2.27)</p>
            <div className="mt-2 space-y-1 text-[12px] font-bold text-purple-900">
              <div className="flex justify-between"><span>Λ°m</span><span className="font-mono">{EL_DATA.HAc.lam0} S cm² mol⁻¹</span></div>
              <div className="flex justify-between"><span>Λm</span><span className="font-mono">{lam.toFixed(1)} S cm² mol⁻¹</span></div>
              <div className="flex justify-between"><span>α</span><span className="font-mono">{alpha.toFixed(4)}</span></div>
              <div className="flex justify-between"><span>Ka</span><span className="font-mono">{(cVal * alpha * alpha / (1 - alpha)).toExponential(2)} mol/L</span></div>
            </div>
          </div>
        )}
      </div>
    </aside>
  ), [elId, cVal, kappa, lam, alpha, el.color]);

  const valuesPanel = useMemo(() => (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[300px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-blue-950">Kohlrausch Law — NCERT Ch 2</h3>
          <p className="text-[11px] font-semibold text-blue-700">§2.4 Conductance of Electrolytic Solutions</p>
          <div className="mt-2 space-y-1 text-[12px] font-semibold text-blue-950">
            <p>Λm = κ/c × 1000 &nbsp;(Eq 2.22)</p>
            <p>Strong: Λm = Λ°m − A√c &nbsp;(Eq 2.23)</p>
            <p>Λ°m = ν₊λ°₊ + ν₋λ°₋ &nbsp;(Eq 2.25)</p>
            <p>Weak: α = Λm / Λ°m &nbsp;(Eq 2.26)</p>
            <p>Ka = cΛm² / [Λ°m(Λ°m−Λm)] &nbsp;(Eq 2.27)</p>
          </div>
          <div className="mt-3 rounded-lg bg-blue-100 px-3 py-2 text-[11px] font-bold text-blue-800">
            Strong electrolytes: nearly linear Λm vs √c (NCERT Fig 2.6 top). Weak (CH₃COOH): steep rise at low c as α→1.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">Real-time values</h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</span>
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              { label: 'Electrolyte', value: `${el.label} (${el.type})`, tint: 'bg-slate-50', col: 'text-slate-800' },
              { label: 'c (mol/L)', value: cVal.toExponential(3), tint: 'bg-blue-50', col: 'text-blue-700' },
              { label: '√c  (mol/L)^½', value: sqrtC.toFixed(4), tint: 'bg-blue-50', col: 'text-blue-700' },
              { label: 'κ  (S cm⁻¹)', value: kappa.toExponential(3), tint: 'bg-amber-50', col: 'text-amber-700' },
              { label: 'Λm  (S cm² mol⁻¹)', value: lam.toFixed(2), tint: 'bg-emerald-50', col: 'text-emerald-700' },
              { label: 'Λ°m  (S cm² mol⁻¹)', value: el.lam0.toFixed(1), tint: 'bg-slate-50', col: 'text-slate-600' },
              ...(elId === 'HAc' && alpha !== undefined ? [
                { label: 'α (degree of diss.)', value: alpha.toFixed(4), tint: 'bg-purple-50', col: 'text-purple-700' },
                { label: 'Ka  (mol/L)', value: (cVal * alpha * alpha / (1 - alpha)).toExponential(2), tint: 'bg-purple-50', col: 'text-purple-700' },
              ] : []),
            ].map(row => (
              <div key={row.label} className={`rounded-lg border border-slate-100 ${row.tint} px-3 py-2`}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{row.label}</div>
                <div className={`mt-0.5 font-mono text-sm font-extrabold ${row.col}`}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <h3 className="text-sm font-extrabold text-slate-900">λ° of selected ions</h3>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[12px] font-bold">
            <div className="rounded bg-slate-50 px-2 py-1.5">
              <div className="text-slate-500">{el.cation}</div>
              <div className="font-mono text-slate-900">{el.lp} S cm² mol⁻¹</div>
            </div>
            <div className="rounded bg-slate-50 px-2 py-1.5">
              <div className="text-slate-500">{el.anion}</div>
              <div className="font-mono text-slate-900">{el.lm} S cm² mol⁻¹</div>
            </div>
            <div className="col-span-2 rounded bg-emerald-50 px-2 py-1.5">
              <div className="text-slate-500">Λ°m = ν₊λ°₊ + ν₋λ°₋</div>
              <div className="font-mono text-emerald-700">{el.lp + el.lm} S cm² mol⁻¹</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  ), [elId, cVal, sqrtC, kappa, lam, alpha, el]);

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
          <button onClick={() => setPaused(v => !v)} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50" title={paused ? 'Play' : 'Pause'}>
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button onClick={() => { setPaused(false); setCVal(0.01); setElId('KCl'); setShowAll(true); }}
            className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50" title="Reset">
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
        <FlaskConical size={18} className="text-blue-600" />
        Conductance vs Concentration Bench
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Electrolyte</div>
          <div className="grid grid-cols-2 gap-2">
            {EL_ORDER.map(id => {
              const e = EL_DATA[id];
              const active = elId === id;
              return (
                <button key={id} onClick={() => setElId(id)}
                  className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left text-xs font-extrabold transition ${active ? 'text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                  style={{ backgroundColor: active ? e.color : '#ffffff', borderColor: active ? e.color : '#e2e8f0' }}>
                  <span>{e.label}</span>
                  <span className={`text-[9px] font-bold ${active ? 'text-white/80' : 'text-slate-400'}`}>{e.type} electrolyte</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>Concentration c</span>
              <span className="font-mono text-slate-700">{cVal.toExponential(2)} mol/L</span>
            </div>
            <input className="w-full accent-blue-600" type="range" min={0.0001} max={0.25} step={0.0005}
              value={cVal} onChange={e => setCVal(Number(e.target.value))} />
            <div className="mt-0.5 flex justify-between text-[10px] font-semibold text-slate-400">
              <span>0.0001 (dilute)</span><span>0.25 mol/L</span>
            </div>
          </div>
          <button onClick={() => setShowAll(v => !v)}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${showAll ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
            Compare all electrolyte curves
          </button>
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

export default ConductanceConcentrationLab;
