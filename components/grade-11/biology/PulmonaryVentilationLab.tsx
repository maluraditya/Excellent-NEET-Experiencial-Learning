import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Mountain, Pause, Play, RotateCcw, Wind } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PulmonaryVentilationLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Altitude = 'sea' | '3000' | '5000' | 'everest';
type Activity_ = 'rest' | 'walk' | 'sprint';

const ALT_META: Record<Altitude, { label: string; atmosphericPO2: number }> = {
  sea:     { label: 'Sea level',  atmosphericPO2: 100 },
  '3000':  { label: '3,000 m',    atmosphericPO2: 70  },
  '5000':  { label: '5,000 m',    atmosphericPO2: 53  },
  everest: { label: 'Everest',    atmosphericPO2: 36  },
};
const ACT_META: Record<Activity_, { label: string; tissuePO2: number; tissuePCO2: number }> = {
  rest:   { label: 'Rest',     tissuePO2: 40, tissuePCO2: 45 },
  walk:   { label: 'Walking',  tissuePO2: 30, tissuePCO2: 55 },
  sprint: { label: 'Sprinting', tissuePO2: 15, tissuePCO2: 75 },
};

interface Particle { x: number; y: number; vx: number; vy: number; kind: 'o2' | 'co2'; age: number }

const PulmonaryVentilationLab: React.FC<PulmonaryVentilationLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const breathPhaseRef = useRef<number>(0); // 0..1 in/out
  const particlesRef = useRef<Particle[]>([]);

  const [paused, setPaused] = useState(false);
  const [tidalVolume, setTidalVolume] = useState(500); // mL
  const [breathRate, setBreathRate] = useState(12);    // /min
  const [altitude, setAltitude] = useState<Altitude>('sea');
  const [activity, setActivity] = useState<Activity_>('rest');
  const [showBicarbonate, setShowBicarbonate] = useState(false);
  const [breathCount, setBreathCount] = useState(0);

  const handleReset = useCallback(() => {
    particlesRef.current = [];
    breathPhaseRef.current = 0;
    setBreathCount(0);
  }, []);

  // saturation calculation
  const alveolarPO2 = ALT_META[altitude].atmosphericPO2;
  const tissuePO2 = ACT_META[activity].tissuePO2;
  const sigmoid = (po2: number, shift: number) => {
    const k = 0.1;
    const mid = 27 + shift;
    return 100 / (1 + Math.exp(-k * (po2 - mid)));
  };
  // right-shift for high pCO2 / activity
  const shiftAmount = activity === 'rest' ? 0 : activity === 'walk' ? 5 : 12;
  const alveolarSat = Math.min(99, sigmoid(alveolarPO2, 0));
  const tissueSat = Math.max(5, sigmoid(tissuePO2, shiftAmount));
  const delivery = alveolarSat - tissueSat; // % delivered to tissues

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
  }, [paused, tidalVolume, breathRate, altitude, activity, showBicarbonate]);

  const step = (dt: number) => {
    // breath cycle
    const period = 60 / Math.max(1, breathRate); // s per breath
    const prevPhase = breathPhaseRef.current;
    breathPhaseRef.current = (prevPhase + dt / period) % 1;
    if (prevPhase > 0.95 && breathPhaseRef.current < 0.05) setBreathCount(c => c + 1);

    // spawn O2 particles flowing into alveolus during inspiration (0..0.5)
    if (breathPhaseRef.current < 0.5 && Math.random() < 0.7) {
      // O2 abundance scales with atmospheric PO2
      if (Math.random() * 100 < alveolarPO2) {
        particlesRef.current.push({
          x: 280 + (Math.random() - 0.5) * 30,
          y: 200 + (Math.random() - 0.5) * 30,
          vx: 80 + Math.random() * 40,
          vy: 30 + (Math.random() - 0.5) * 30,
          kind: 'o2',
          age: 0,
        });
      }
    }
    // spawn CO2 particles leaving tissue capillary
    if (Math.random() < 0.5) {
      particlesRef.current.push({
        x: 920 + (Math.random() - 0.5) * 40,
        y: 440 + (Math.random() - 0.5) * 40,
        vx: -60 - Math.random() * 40,
        vy: -25 + (Math.random() - 0.5) * 20,
        kind: 'co2',
        age: 0,
      });
    }

    // advance & cull particles
    particlesRef.current = particlesRef.current
      .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, age: p.age + dt }))
      .filter(p => p.age < 3 && p.x > -20 && p.x < W + 20);
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // diaphragm strip at top
    const dia = breathPhaseRef.current < 0.5 ? breathPhaseRef.current * 2 : (1 - breathPhaseRef.current) * 2;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 60);
    for (let x = 40; x <= 1240; x += 30) {
      ctx.lineTo(x, 60 + Math.sin((x / 60) + dia * 0.8) * 6 * (1 - dia));
    }
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = '600 13px Inter';
    ctx.fillText(`Breath: ${breathPhaseRef.current < 0.5 ? '⬇ Inspiration' : '⬆ Expiration'}  ·  Cycle ${breathCount}  ·  Rate ${breathRate}/min  ·  TV ${tidalVolume} mL`, 50, 40);

    // Left half — alveolus
    drawAlveolus(ctx);
    // Right half — tissue
    drawTissue(ctx);

    // particles
    for (const p of particlesRef.current) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      if (p.kind === 'o2') {
        ctx.fillStyle = `rgba(14, 165, 233, ${1 - p.age / 3})`;
        ctx.shadowColor = '#0ea5e9';
      } else {
        ctx.fillStyle = `rgba(217, 119, 6, ${1 - p.age / 3})`;
        ctx.shadowColor = '#d97706';
      }
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // bicarbonate inset
    if (showBicarbonate) drawBicarbonateInset(ctx);

    // banner
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '700 14px Inter';
    ctx.fillText('NCERT §14.4 — O₂ as oxyhaemoglobin · CO₂ as 70% bicarbonate + 20-25% carbamino + plasma', 50, H - 30);
  };

  const drawAlveolus = (ctx: CanvasRenderingContext2D) => {
    // alveolus (left)
    const ax = 280, ay = 240;
    const inflate = breathPhaseRef.current < 0.5 ? breathPhaseRef.current * 2 : (1 - breathPhaseRef.current) * 2;
    const scale = 1 + inflate * 0.25 * (tidalVolume / 500);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, 90, 0, Math.PI * 2);
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#92400e';
    ctx.font = '700 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Alveolus', ax, ay + 4);
    ctx.fillStyle = '#475569';
    ctx.font = '600 11px Inter';
    ctx.fillText(`PO₂ ${alveolarPO2} mmHg · Sat ${alveolarSat.toFixed(0)}%`, ax, ay + 130);

    // capillary around it
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax - 200, ay + 200);
    ctx.bezierCurveTo(ax - 80, ay + 220, ax + 50, ay + 150, ax + 250, ay + 220);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Hb cells
    drawHb(ctx, ax - 130, ay + 215, alveolarSat / 100);
    drawHb(ctx, ax - 40, ay + 200, alveolarSat / 100);
    drawHb(ctx, ax + 80, ay + 195, alveolarSat / 100);
    drawHb(ctx, ax + 200, ay + 220, alveolarSat / 100);
  };

  const drawTissue = (ctx: CanvasRenderingContext2D) => {
    const tx = 940, ty = 440;
    ctx.fillStyle = '#fce7f3';
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(tx - 100, ty - 60, 200, 120, 18) : ctx.rect(tx - 100, ty - 60, 200, 120);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#831843';
    ctx.font = '700 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Tissue cell', tx, ty - 10);
    ctx.font = '600 11px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText(`PO₂ ${tissuePO2} · pCO₂ ${ACT_META[activity].tissuePCO2}`, tx, ty + 20);

    // capillary
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tx - 250, ty + 140);
    ctx.bezierCurveTo(tx - 80, ty + 150, tx + 50, ty + 90, tx + 250, ty + 140);
    ctx.stroke();
    ctx.lineCap = 'butt';

    drawHb(ctx, tx - 170, ty + 145, tissueSat / 100);
    drawHb(ctx, tx - 60, ty + 130, tissueSat / 100);
    drawHb(ctx, tx + 60, ty + 120, tissueSat / 100);
    drawHb(ctx, tx + 180, ty + 145, tissueSat / 100);

    ctx.fillStyle = '#475569';
    ctx.font = '600 11px Inter';
    ctx.fillText(`Hb saturation ${tissueSat.toFixed(0)}%  ·  Delivered ${delivery.toFixed(0)}%`, tx, ty + 200);
    ctx.textAlign = 'left';
  };

  const drawHb = (ctx: CanvasRenderingContext2D, x: number, y: number, sat: number) => {
    // 4 pockets
    const pockets = Math.round(sat * 4);
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i - Math.PI / 4;
      const px = x + Math.cos(angle) * 9;
      const py = y + Math.sin(angle) * 9;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = i < pockets ? '#16a34a' : '#fecaca';
      ctx.fill();
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.stroke();
  };

  const drawBicarbonateInset = (ctx: CanvasRenderingContext2D) => {
    const x = 540, y = 580;
    ctx.fillStyle = '#fff7ed';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x, y, 220, 130);
    ctx.strokeRect(x, y, 220, 130);
    ctx.fillStyle = '#9a3412';
    ctx.font = '700 12px Inter';
    ctx.fillText('CO₂ transport pathways', x + 10, y + 18);
    ctx.font = '600 11px Inter';
    ctx.fillStyle = '#475569';
    ctx.fillText('• 70% as HCO₃⁻ (carbonic anhydrase in RBC)', x + 10, y + 40);
    ctx.fillText('• 20-25% as carbamino-Hb', x + 10, y + 60);
    ctx.fillText('• ~5% dissolved in plasma', x + 10, y + 80);
    ctx.font = '500 10px Inter';
    ctx.fillStyle = '#92400e';
    ctx.fillText('CO₂ + H₂O ⇌ H₂CO₃ ⇌ HCO₃⁻ + H⁺', x + 10, y + 110);
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Oxygen Dissociation Curve</div>
          <div className="text-xs font-semibold text-slate-500">% Hb saturation vs PO₂ (mmHg)</div>
          <svg viewBox="0 0 280 180" className="mt-2 w-full">
            {/* axes */}
            <line x1="40" y1="160" x2="270" y2="160" stroke="#475569" strokeWidth="1" />
            <line x1="40" y1="160" x2="40" y2="10" stroke="#475569" strokeWidth="1" />
            {/* tick labels */}
            {[20, 40, 60, 80, 100].map(p => (
              <text key={p} x={40 + p * 2.2} y="172" fontSize="9" textAnchor="middle" fill="#64748b">{p}</text>
            ))}
            <text x="155" y="175" fontSize="10" textAnchor="middle" fill="#475569">PO₂ (mmHg)</text>
            {/* base curve */}
            <path
              d={Array.from({ length: 51 }, (_, i) => {
                const po2 = i * 2;
                const sat = sigmoid(po2, 0);
                const x = 40 + po2 * 2.2;
                const y = 160 - sat * 1.5;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none" stroke="#0891b2" strokeWidth="2"
            />
            {/* shifted curve */}
            {shiftAmount > 0 && (
              <path
                d={Array.from({ length: 51 }, (_, i) => {
                  const po2 = i * 2;
                  const sat = sigmoid(po2, shiftAmount);
                  const x = 40 + po2 * 2.2;
                  const y = 160 - sat * 1.5;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3"
              />
            )}
            {/* cursors */}
            <circle cx={40 + alveolarPO2 * 2.2} cy={160 - alveolarSat * 1.5} r="5" fill="#0891b2" />
            <text x={40 + alveolarPO2 * 2.2} y={160 - alveolarSat * 1.5 - 8} fontSize="9" textAnchor="middle" fill="#0891b2" fontWeight="700">Alveolus</text>
            <circle cx={40 + tissuePO2 * 2.2} cy={160 - tissueSat * 1.5} r="5" fill="#dc2626" />
            <text x={40 + tissuePO2 * 2.2} y={160 - tissueSat * 1.5 + 14} fontSize="9" textAnchor="middle" fill="#dc2626" fontWeight="700">Tissue</text>
          </svg>
          {shiftAmount > 0 && (
            <p className="text-[11px] text-slate-500 mt-1">Dashed = right-shifted by high pCO₂ / H⁺ / T at tissues — more O₂ unloads.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Tidal Volume</div>
          <div className="text-xs font-semibold text-slate-500">NCERT: TV ≈ 500 mL</div>
          <div className="mt-2 h-4 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-200" style={{ width: `${Math.min(100, tidalVolume / 1500 * 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-[11px] text-slate-600 font-mono">
            <span>0</span>
            <span className="font-bold">{tidalVolume} mL</span>
            <span>1500</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="text-xs font-bold text-slate-700">Delivery to tissues</div>
          <div className="font-mono text-2xl font-extrabold text-emerald-600 mt-1">{delivery.toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500">NCERT: 100 mL oxygenated blood delivers ~5 mL O₂</div>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-sky-200 bg-sky-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-sky-900">Five Steps of Respiration</div>
          <div className="text-xs font-semibold text-sky-700 mt-0.5">NCERT Ch 14 · §14.1</div>
          <ol className="mt-2 text-sm leading-snug text-sky-950 list-decimal pl-5 space-y-0.5">
            <li>Pulmonary ventilation (inspiration / expiration)</li>
            <li>O₂ / CO₂ exchange at alveoli</li>
            <li>Gas transport by blood</li>
            <li>O₂ / CO₂ exchange at tissues</li>
            <li>Cellular utilisation of O₂</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Altitude" value={ALT_META[altitude].label} />
            <Cell label="Atmospheric PO₂" value={`${alveolarPO2} mmHg`} />
            <Cell label="Alveolar Hb sat" value={`${alveolarSat.toFixed(0)} %`} />
            <Cell label="Tissue Hb sat" value={`${tissueSat.toFixed(0)} %`} />
            <Cell label="Activity" value={ACT_META[activity].label} />
            <Cell label="Breaths counted" value={breathCount} />
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
        <Wind size={18} className="text-sky-600" />
        <h3 className="text-sm font-bold text-slate-800">Pulmonary Ventilation Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Tidal volume</span>
            <span className="font-mono text-slate-700">{tidalVolume} mL</span>
          </label>
          <input type="range" min={200} max={1500} step={50} value={tidalVolume} onChange={e => setTidalVolume(parseInt(e.target.value))} className="w-full mt-1 accent-amber-600" />
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Breath rate</span>
            <span className="font-mono text-slate-700">{breathRate} /min</span>
          </label>
          <input type="range" min={4} max={30} step={1} value={breathRate} onChange={e => setBreathRate(parseInt(e.target.value))} className="w-full mt-1 accent-sky-600" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1"><Mountain size={11} /> Altitude</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(Object.keys(ALT_META) as Altitude[]).map(a => (
              <button key={a} onClick={() => setAltitude(a)} className={`px-2.5 py-1.5 text-xs font-bold rounded-md ${altitude === a ? 'bg-white text-sky-700 shadow' : 'text-slate-600 hover:text-slate-800'}`}>
                {ALT_META[a].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1"><Activity size={11} /> Tissue activity</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(Object.keys(ACT_META) as Activity_[]).map(a => (
              <button key={a} onClick={() => setActivity(a)} className={`px-3 py-1.5 text-xs font-bold rounded-md ${activity === a ? 'bg-white text-rose-700 shadow' : 'text-slate-600 hover:text-slate-800'}`}>
                {ACT_META[a].label}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input type="checkbox" checked={showBicarbonate} onChange={e => setShowBicarbonate(e.target.checked)} />
            Show CO₂ transport inset (bicarbonate / carbamino / plasma split)
          </label>
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

const Cell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-sky-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-extrabold text-sky-700">{value}</div>
  </div>
);

export default PulmonaryVentilationLab;
