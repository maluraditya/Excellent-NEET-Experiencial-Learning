import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlaskConical, Pause, Play, RotateCcw } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

const FARADAY = 96487;
const GAS_CONSTANT = 8.314;
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 760;

type CellId = 'daniell' | 'cuAg' | 'niAg' | 'mgAg';

interface CellPreset {
  label: string;
  shortLabel: string;
  anode: string;
  cathode: string;
  anodeIon: string;
  cathodeIon: string;
  cathodeCoefficient: number;
  e0: number;
  n: number;
  initialAnodeConcentration: number;
  initialCathodeConcentration: number;
  source: string;
  anodeColor: string;
  cathodeColor: string;
  solutionA: string;
  solutionC: string;
}

const CELLS: Record<CellId, CellPreset> = {
  daniell: {
    label: 'Daniell cell', shortLabel: 'Zn-Cu', anode: 'Zn', cathode: 'Cu',
    anodeIon: 'Zn2+', cathodeIon: 'Cu2+', cathodeCoefficient: 1,
    e0: 1.10, n: 2, initialAnodeConcentration: 1, initialCathodeConcentration: 1,
    source: 'NCERT Eq. 2.12', anodeColor: '#94a3b8', cathodeColor: '#d97706',
    solutionA: '#dbeafe', solutionC: '#60a5fa'
  },
  cuAg: {
    label: 'Copper-silver', shortLabel: 'Cu-Ag', anode: 'Cu', cathode: 'Ag',
    anodeIon: 'Cu2+', cathodeIon: 'Ag+', cathodeCoefficient: 2,
    e0: 0.46, n: 2, initialAnodeConcentration: 1, initialCathodeConcentration: 1,
    source: 'NCERT Example 2.2', anodeColor: '#d97706', cathodeColor: '#d1d5db',
    solutionA: '#60a5fa', solutionC: '#e2e8f0'
  },
  niAg: {
    label: 'Nickel-silver', shortLabel: 'Ni-Ag', anode: 'Ni', cathode: 'Ag',
    anodeIon: 'Ni2+', cathodeIon: 'Ag+', cathodeCoefficient: 2,
    e0: 1.05, n: 2, initialAnodeConcentration: 0.160, initialCathodeConcentration: 0.002,
    source: 'NCERT Intext 2.5', anodeColor: '#64748b', cathodeColor: '#d1d5db',
    solutionA: '#86efac', solutionC: '#e2e8f0'
  },
  mgAg: {
    label: 'Magnesium-silver', shortLabel: 'Mg-Ag', anode: 'Mg', cathode: 'Ag',
    anodeIon: 'Mg2+', cathodeIon: 'Ag+', cathodeCoefficient: 2,
    e0: 3.17, n: 2, initialAnodeConcentration: 0.130, initialCathodeConcentration: 0.0001,
    source: 'NCERT Example 2.1', anodeColor: '#cbd5e1', cathodeColor: '#d1d5db',
    solutionA: '#ddd6fe', solutionC: '#e2e8f0'
  }
};

const CELL_ORDER: CellId[] = ['daniell', 'cuAg', 'niAg', 'mgAg'];

function reactionQuotient(cell: CellPreset, anodeConcentration: number, cathodeConcentration: number) {
  return anodeConcentration / Math.pow(cathodeConcentration, cell.cathodeCoefficient);
}

function calculateCell(cell: CellPreset, anodeConcentration: number, cathodeConcentration: number) {
  const q = reactionQuotient(cell, anodeConcentration, cathodeConcentration);
  const logQ = Math.log10(q);
  const potential = cell.e0 - (0.059 / cell.n) * logQ;
  return { q, logQ, potential };
}

function formatConcentration(value: number) {
  return value < 0.01 ? value.toExponential(1) : value.toFixed(value < 1 ? 3 : 2);
}

interface Props {
  topic: any;
  onExit: () => void;
}

interface IonParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  side: 'left' | 'right';
  phase: number;
}

const NernstCellPotentialLab: React.FC<Props> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<IonParticle[]>([]);
  const electronPhaseRef = useRef(0);
  const lastFrameRef = useRef(0);
  const reactionTimerRef = useRef<number | undefined>(undefined);

  const [cellId, setCellId] = useState<CellId>('daniell');
  const [anodeConcentration, setAnodeConcentration] = useState(1);
  const [cathodeConcentration, setCathodeConcentration] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  const cell = CELLS[cellId];
  const values = useMemo(
    () => calculateCell(cell, anodeConcentration, cathodeConcentration),
    [cell, anodeConcentration, cathodeConcentration]
  );
  const equilibriumConstant = Math.pow(10, cell.e0 * cell.n / 0.059);
  const gibbsEnergy = -cell.n * FARADAY * values.potential / 1000;

  const initialiseParticles = useCallback(() => {
    particlesRef.current = Array.from({ length: 30 }, (_, index) => ({
      x: (index % 2 === 0 ? 250 : 770) + Math.random() * 250,
      y: 335 + Math.random() * 250,
      vx: (Math.random() - 0.5) * 24,
      vy: (Math.random() - 0.5) * 24,
      side: index % 2 === 0 ? 'left' : 'right',
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useEffect(() => initialiseParticles(), [cellId, initialiseParticles]);

  const resetCell = useCallback((nextCellId: CellId = cellId) => {
    const preset = CELLS[nextCellId];
    setAnodeConcentration(preset.initialAnodeConcentration);
    setCathodeConcentration(preset.initialCathodeConcentration);
    setIsReacting(false);
    setIsPaused(false);
  }, [cellId]);

  useEffect(() => {
    if (!isReacting || isPaused) return;
    reactionTimerRef.current = window.setInterval(() => {
      setAnodeConcentration(previous => Math.min(5, previous + 0.004));
      setCathodeConcentration(previous => {
        const next = previous - 0.004 * cell.cathodeCoefficient;
        if (next <= 0.0001) {
          setIsReacting(false);
          return 0.0001;
        }
        return next;
      });
    }, 140);
    return () => window.clearInterval(reactionTimerRef.current);
  }, [cell.cathodeCoefficient, isPaused, isReacting]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrame = 0;

    const roundedRect = (x: number, y: number, width: number, height: number, radius: number, fill: string, stroke?: string) => {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const text = (value: string, x: number, y: number, size = 16, color = '#334155', weight = 500, align: CanvasTextAlign = 'left') => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
      ctx.textAlign = align;
      ctx.fillText(value, x, y);
    };

    const drawHalfCell = (
      x: number, solutionColor: string, metalColor: string, metal: string, ion: string,
      role: string, halfReaction: string, isAnode: boolean
    ) => {
      roundedRect(x, 268, 322, 356, 24, '#ffffff', '#cbd5e1');
      text(role, x + 161, 296, 15, isAnode ? '#b45309' : '#047857', 800, 'center');
      text(halfReaction, x + 161, 320, 13, '#475569', 650, 'center');

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + 24, 332, 274, 252, 18);
      ctx.clip();
      const liquid = ctx.createLinearGradient(0, 332, 0, 584);
      liquid.addColorStop(0, solutionColor + '88');
      liquid.addColorStop(1, solutionColor + 'dd');
      ctx.fillStyle = liquid;
      ctx.fillRect(x + 24, 332, 274, 252);
      ctx.restore();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 24, 332);
      ctx.lineTo(x + 24, 584);
      ctx.quadraticCurveTo(x + 161, 620, x + 298, 584);
      ctx.lineTo(x + 298, 332);
      ctx.stroke();

      const electrodeX = isAnode ? x + 67 : x + 243;
      const electrodeGradient = ctx.createLinearGradient(electrodeX, 0, electrodeX + 28, 0);
      electrodeGradient.addColorStop(0, metalColor);
      electrodeGradient.addColorStop(0.5, '#f8fafc');
      electrodeGradient.addColorStop(1, metalColor);
      ctx.fillStyle = electrodeGradient;
      ctx.fillRect(electrodeX, 218, 28, 318);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(electrodeX, 218, 28, 318);
      text(metal, electrodeX + 14, 558, 15, '#0f172a', 800, 'center');

      text(`${ion}(aq)`, x + 161, 606, 13, '#334155', 700, 'center');
    };

    const draw = (time: number) => {
      const dt = Math.min((time - (lastFrameRef.current || time)) / 1000, 0.1);
      lastFrameRef.current = time;
      if (!isPaused) electronPhaseRef.current += dt * (isReacting ? 125 : 52);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = 0; x <= STAGE_WIDTH; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, STAGE_HEIGHT); ctx.stroke();
      }
      for (let y = 0; y <= STAGE_HEIGHT; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(STAGE_WIDTH, y); ctx.stroke();
      }

      text('GALVANIC CELL', 640, 52, 13, '#0369a1', 800, 'center');
      text(`${cell.anode}(s) | ${cell.anodeIon}(aq) || ${cell.cathodeIon}(aq) | ${cell.cathode}(s)`, 640, 83, 23, '#0f172a', 750, 'center');
      text(cell.source, 640, 109, 13, '#64748b', 600, 'center');

      drawHalfCell(220, cell.solutionA, cell.anodeColor, cell.anode, cell.anodeIon,
        'ANODE (-)  OXIDATION', `${cell.anode} -> ${cell.anodeIon} + ${cell.n}e-`, true);
      const cathodeHalfReaction = cell.cathodeCoefficient === 1
        ? `${cell.cathodeIon} + ${cell.n}e- -> ${cell.cathode}`
        : `${cell.cathodeCoefficient}${cell.cathodeIon} + ${cell.n}e- -> ${cell.cathodeCoefficient}${cell.cathode}`;
      drawHalfCell(740, cell.solutionC, cell.cathodeColor, cell.cathode, cell.cathodeIon,
        'CATHODE (+)  REDUCTION', cathodeHalfReaction, false);

      // Wire and voltmeter.
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(301, 218); ctx.lineTo(301, 164); ctx.lineTo(584, 164);
      ctx.moveTo(696, 164); ctx.lineTo(997, 164); ctx.lineTo(997, 218);
      ctx.stroke();
      roundedRect(584, 128, 112, 72, 16, '#f8fafc', '#94a3b8');
      text('VOLTMETER', 640, 149, 9, '#64748b', 800, 'center');
      text(`${values.potential.toFixed(3)} V`, 640, 181, 23, values.potential >= 0 ? '#15803d' : '#be123c', 800, 'center');

      // Electron packets move from anode to cathode while the forward reaction is spontaneous.
      const wireStart = 324;
      const wireEnd = 974;
      const electronDirection = values.potential >= 0 ? 1 : -1;
      for (let index = 0; index < 7; index++) {
        const raw = (electronPhaseRef.current + index * 86) % (wireEnd - wireStart);
        const x = electronDirection > 0 ? wireStart + raw : wireEnd - raw;
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath(); ctx.arc(x, 164, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      text(values.potential >= 0 ? 'electron flow ->' : '<- reverse tendency', 820, 145, 12, '#0369a1', 700, 'center');

      // Salt bridge and ion migration.
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(502, 370); ctx.bezierCurveTo(502, 230, 800, 230, 800, 370); ctx.stroke();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2;
      ctx.stroke();
      text('SALT BRIDGE', 651, 239, 10, '#78350f', 800, 'center');
      text('anions -> anode', 651, 257, 10, '#92400e', 600, 'center');

      if (!isPaused) {
        particlesRef.current.forEach(particle => {
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          particle.phase += dt * 2;
          const minX = particle.side === 'left' ? 250 : 770;
          const maxX = particle.side === 'left' ? 510 : 1030;
          if (particle.x < minX || particle.x > maxX) particle.vx *= -1;
          if (particle.y < 350 || particle.y > 568) particle.vy *= -1;
        });
      }
      particlesRef.current.forEach((particle, index) => {
        const ion = particle.side === 'left' ? cell.anodeIon : cell.cathodeIon;
        const concentration = particle.side === 'left' ? anodeConcentration : cathodeConcentration;
        const visibleFraction = Math.min(1, 0.35 + Math.log10(1 + concentration * 9) * 0.65);
        if ((index % 15) / 15 > visibleFraction) return;
        ctx.fillStyle = particle.side === 'left' ? '#bfdbfe' : '#fef3c7';
        ctx.globalAlpha = 0.78 + Math.sin(particle.phase) * 0.12;
        ctx.beginPath(); ctx.arc(particle.x, particle.y, 11, 0, Math.PI * 2); ctx.fill();
        text(ion, particle.x, particle.y + 3, 8, '#0f172a', 800, 'center');
        ctx.globalAlpha = 1;
      });

      animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrame);
  }, [anodeConcentration, cathodeConcentration, cell, equilibriumConstant, gibbsEnergy, isPaused, isReacting, values]);

  const selectCell = (nextCellId: CellId) => {
    setCellId(nextCellId);
    resetCell(nextCellId);
  };

  const graphMinLog = Math.min(-4, Math.floor(values.logQ) - 2);
  const graphMaxLog = Math.max(4, Math.ceil(values.logQ) + 2);
  const graphMaxE = cell.e0 - (0.059 / cell.n) * graphMinLog + 0.08;
  const graphMinE = cell.e0 - (0.059 / cell.n) * graphMaxLog - 0.08;
  const graphX = (logQ: number) => 38 + ((logQ - graphMinLog) / (graphMaxLog - graphMinLog)) * 244;
  const graphY = (potential: number) => 186 - ((potential - graphMinE) / (graphMaxE - graphMinE)) * 142;

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] overflow-y-auto pr-1 2xl:block">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
        <h3 className="text-base font-extrabold text-slate-900">Ecell versus log Q</h3>
        <p className="text-xs font-semibold text-slate-500">Nernst line at 298 K</p>
        <svg viewBox="0 0 320 220" className="mt-3 h-[240px] w-full" role="img" aria-label="Cell potential against logarithm of reaction quotient">
          {[0, 1, 2, 3, 4].map(index => (
            <line key={index} x1="38" x2="282" y1={44 + index * 35.5} y2={44 + index * 35.5} stroke="#e2e8f0" />
          ))}
          <line x1="38" x2="38" y1="40" y2="186" stroke="#475569" strokeWidth="1.5" />
          <line x1="38" x2="286" y1="186" y2="186" stroke="#475569" strokeWidth="1.5" />
          <line
            x1={graphX(graphMinLog)} y1={graphY(cell.e0 - (0.059 / cell.n) * graphMinLog)}
            x2={graphX(graphMaxLog)} y2={graphY(cell.e0 - (0.059 / cell.n) * graphMaxLog)}
            stroke="#1d4ed8" strokeWidth="3"
          />
          <circle cx={graphX(values.logQ)} cy={graphY(values.potential)} r="7" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
          <text x="160" y="210" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="700">log Q</text>
          <text x="14" y="115" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="700" transform="rotate(-90 14 115)">Ecell (V)</text>
          <text x={Math.min(260, Math.max(65, graphX(values.logQ)))} y={Math.max(53, graphY(values.potential) - 12)} textAnchor="middle" fill="#92400e" fontSize="10" fontWeight="700">current state</text>
        </svg>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] overflow-y-auto pl-1 2xl:block">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
          <h3 className="text-base font-extrabold text-amber-950">Nernst equation</h3>
          <p className="text-xs font-semibold text-amber-700">NCERT Class 12, Ch 2, Sec 2.3</p>
          <div className="mt-3 space-y-2 text-sm font-semibold leading-snug text-amber-950">
            <p>Ecell = E&deg;cell - (0.059/n) log Q</p>
            <p>Q = [{cell.anodeIon}] / [{cell.cathodeIon}]{cell.cathodeCoefficient === 2 ? <sup>2</sup> : null}</p>
            <p>At equilibrium: Ecell = 0 and Q = Kc</p>
            <p>&Delta;rG = -nFEcell</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">Real-time values</h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            {[
              ['Anode ion', `${formatConcentration(anodeConcentration)} M`, 'bg-sky-50 text-sky-700'],
              ['Cathode ion', `${formatConcentration(cathodeConcentration)} M`, 'bg-amber-50 text-amber-700'],
              ['Reaction quotient Q', values.q.toExponential(2), 'bg-violet-50 text-violet-700'],
              ['Cell potential', `${values.potential.toFixed(3)} V`, values.potential >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'],
              ['Gibbs energy', `${gibbsEnergy.toFixed(1)} kJ mol^-1`, gibbsEnergy <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'],
              ['Equilibrium constant', equilibriumConstant.toExponential(2), 'bg-slate-50 text-slate-700']
            ].map(([label, value, tint]) => (
              <div key={label} className={`rounded-lg border border-slate-100 px-3 py-2 ${tint}`}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
                <div className="mt-1 font-mono text-sm font-extrabold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );

  const controls = (
    <div className="grid h-full min-h-0 grid-cols-12 items-stretch gap-3 text-slate-900">
      <div className="col-span-2 flex min-w-0 items-center gap-2 px-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><FlaskConical size={18} /></div>
        <div className="truncate text-sm font-black text-slate-900">Nernst Bench</div>
      </div>

      <section className="col-span-4 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Cell preset</div>
        <div className="grid grid-cols-4 gap-1.5">
          {CELL_ORDER.map(id => {
            const preset = CELLS[id];
            const active = id === cellId;
            return (
              <button key={id} type="button" onClick={() => selectCell(id)}
                className={`min-w-0 rounded-xl border px-1 py-2 text-center transition ${active ? 'border-sky-500 bg-sky-600 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-sky-50'}`}>
                <span className="block truncate text-[11px] font-black">{preset.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </section>

      <label className="col-span-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-black text-slate-700">
        <span className="flex items-center justify-between gap-2"><span>[{cell.anodeIon}] concentration</span><span className="rounded bg-sky-50 px-1.5 py-0.5 font-mono text-sky-700">{formatConcentration(anodeConcentration)} M</span></span>
        <input aria-label={`${cell.anodeIon} concentration`} className="mt-3 w-full accent-sky-600" type="range" min={-4} max={0.699} step={0.01}
          value={Math.log10(anodeConcentration)} onChange={event => setAnodeConcentration(Math.pow(10, Number(event.target.value)))} />
        <span className="mt-1 flex justify-between text-[9px] font-bold text-slate-500"><span>10^-4 M</span><span>5 M</span></span>
      </label>

      <label className="col-span-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-black text-slate-700">
        <span className="flex items-center justify-between gap-2"><span>[{cell.cathodeIon}] concentration</span><span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-amber-700">{formatConcentration(cathodeConcentration)} M</span></span>
        <input aria-label={`${cell.cathodeIon} concentration`} className="mt-3 w-full accent-amber-500" type="range" min={-4} max={0.699} step={0.01}
          value={Math.log10(cathodeConcentration)} onChange={event => setCathodeConcentration(Math.pow(10, Number(event.target.value)))} />
        <span className="mt-1 flex justify-between text-[9px] font-bold text-slate-500"><span>10^-4 M</span><span>5 M</span></span>
      </label>

      <button type="button" aria-pressed={isReacting} onClick={() => { setIsReacting(value => !value); setIsPaused(false); }}
        className={`col-span-2 rounded-2xl border px-3 py-2 text-xs font-black transition ${isReacting ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50'}`}>
        {isReacting ? 'Reaction motion: On' : 'Reaction motion: Off'}
      </button>
    </div>
  );

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} width={STAGE_WIDTH} height={STAGE_HEIGHT} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-1.5">
          <button type="button" title={isPaused ? 'Play' : 'Pause'} aria-label={isPaused ? 'Play animation' : 'Pause animation'}
            onClick={() => setIsPaused(value => !value)} className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50">
            {isPaused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button type="button" title="Reset" aria-label="Reset simulation" onClick={() => resetCell()}
            className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      {graphPanel}
      {valuesPanel}
    </div>
  );

  return (
    <TopicLayoutContainer
      topic={topic}
      onExit={onExit}
      SimulationComponent={simulationCombo}
      ControlsComponent={controls}
      controlsAreaFlex="0 0 172px"
      simulationStageWidth={STAGE_WIDTH}
      simulationStageHeight={STAGE_HEIGHT}
      rootClassName="bg-white text-slate-900"
      simulationClassName="overflow-hidden bg-white"
      controlsWrapperClassName="w-full h-full max-w-[1180px] overflow-hidden bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-xl rounded-3xl p-3"
      contentToggleClassName="bg-sky-600 text-white border border-sky-500 hover:bg-sky-700"
    />
  );
};

export default NernstCellPotentialLab;
