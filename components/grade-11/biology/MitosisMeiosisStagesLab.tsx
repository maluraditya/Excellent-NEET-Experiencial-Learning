import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Dna, RefreshCcw, Scissors, Split } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

/* ─────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────── */
type DivisionMode = 'mitosis' | 'meiosis';

// Mitosis  0..3  → Prophase / Metaphase / Anaphase / Telophase
// Meiosis  0..7  → PropI / MetI / AnaI / TelI / PropII / MetII / AnaII / TelII
const MITOSIS_PHASES = ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'];
const MEIOSIS_PHASES = [
  'Prophase I', 'Metaphase I', 'Anaphase I', 'Telophase I',
  'Prophase II', 'Metaphase II', 'Anaphase II', 'Telophase II',
];

interface Props { topic: any; onExit: () => void; }

/* ─────────────────────────────────────────────────────
   CHROMOSOME PAIR COLOURS
   pair 0: red/pink   pair 1: blue/cyan
───────────────────────────────────────────────────── */
const PAIR_COLORS = [
  { mat: '#ef4444', pat: '#f472b6' },   // pair 0
  { mat: '#2563eb', pat: '#06b6d4' },   // pair 1
];

/* ─────────────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────────────── */
const MitosisMeiosisStagesLab: React.FC<Props> = ({ topic, onExit }) => {
  const [mode, setMode] = useState<DivisionMode>('mitosis');
  const [phaseIdx, setPhaseIdx] = useState(0);           // index into current phase array
  const [crossoverCount, setCrossoverCount] = useState(1); // 1-3
  const [crossingOver, setCrossingOver] = useState(false);
  const [scissorsUsed, setScissorsUsed] = useState(false);
  const [scissorsBlocked, setScissorsBlocked] = useState(false); // meiosis I flash
  const [autoPlay, setAutoPlay] = useState(false);
  const [showMeiosisII, setShowMeiosisII] = useState(false);

  const phases = mode === 'mitosis' ? MITOSIS_PHASES
    : showMeiosisII ? MEIOSIS_PHASES
    : MEIOSIS_PHASES.slice(0, 4);

  const phaseName = phases[phaseIdx] ?? phases[0];
  const isMitosis = mode === 'mitosis';
  const totalPhases = phases.length;

  // ── auto-play ─────────────────────────────────────
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (autoPlay) {
      autoRef.current = setInterval(() => {
        setPhaseIdx(p => {
          if (p >= totalPhases - 1) { setAutoPlay(false); return p; }
          return p + 1;
        });
        setScissorsUsed(false);
      }, 2200);
    } else {
      if (autoRef.current) clearInterval(autoRef.current);
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [autoPlay, totalPhases]);

  // ── scissors blocked flash ─────────────────────────
  useEffect(() => {
    if (scissorsBlocked) {
      const t = setTimeout(() => setScissorsBlocked(false), 1400);
      return () => clearTimeout(t);
    }
  }, [scissorsBlocked]);

  // ── derived flags ─────────────────────────────────
  const inAnaphaseMitosis = isMitosis && phaseName === 'Anaphase';
  const inAnaI  = !isMitosis && phaseName === 'Anaphase I';
  const inAnaII = !isMitosis && phaseName === 'Anaphase II';
  const scissorsEnabled = inAnaphaseMitosis || inAnaII;

  const ploidyLabel =
    (isMitosis && phaseName === 'Telophase') ? '2n / 2C (each)' :
    (!isMitosis && ['Telophase I','Prophase II','Metaphase II','Anaphase II'].includes(phaseName)) ? 'n / 2C' :
    (!isMitosis && phaseName === 'Telophase II') ? 'n / 1C (each)' :
    '2n / 4C';

  const centromereLabel =
    (inAnaphaseMitosis && scissorsUsed) ? 'Split ✓' :
    (inAnaphaseMitosis) ? 'Ready to split' :
    (inAnaI) ? 'Intact — homologues separate' :
    (inAnaII && scissorsUsed) ? 'Split ✓ (Meiosis II)' :
    'Intact';

  // ── live observation ──────────────────────────────
  const getObservation = () => {
    if (scissorsBlocked) return '❌ Centromeres do NOT split in Meiosis I — homologous chromosomes separate as intact units.';
    if (isMitosis) {
      if (phaseName === 'Prophase')   return 'Chromosomes condense. Each duplicated chromosome (2 sister chromatids) becomes visible. Nuclear envelope dissolves. Spindle fibres form.';
      if (phaseName === 'Metaphase')  return 'All chromosomes line up in SINGLE FILE at the metaphase plate (equator). Each chromosome attached to spindle fibres from both poles.';
      if (phaseName === 'Anaphase' && !scissorsUsed) return 'Centromeres are ready to split. Click the Scissors tool to separate sister chromatids → they become individual daughter chromosomes and migrate to opposite poles.';
      if (phaseName === 'Anaphase')   return '✅ Centromeres split! Sister chromatids separate into daughter chromosomes and move to opposite poles. Each pole receives a complete 2n set.';
      if (phaseName === 'Telophase')  return 'Chromosomes reach poles. Nuclear envelopes reform. Chromosomes decondense. Cytokinesis (cleavage furrow) divides cytoplasm → 2 identical 2n daughter cells.';
    } else {
      if (phaseName === 'Prophase I')  return crossingOver
        ? `Prophase I: Synapsis complete. ${crossoverCount} chiasma${crossoverCount > 1 ? 'ta' : ''} visible — segments exchanged between non-sister chromatids (genetic recombination).`
        : 'Prophase I: Homologous chromosomes pair by synapsis forming bivalents (tetrads). Activate Crossing Over to see chiasmata and genetic recombination.';
      if (phaseName === 'Metaphase I')  return 'Metaphase I: Homologous pairs (bivalents) align at equator — each PAIR faces opposite poles. Unlike mitosis, individual chromosomes are NOT separated yet.';
      if (phaseName === 'Anaphase I')   return 'Anaphase I: Whole homologous chromosomes (each still bearing 2 sister chromatids) move to opposite poles. Centromeres remain INTACT — this is the reductional division.';
      if (phaseName === 'Telophase I')  return 'Telophase I: Two haploid (n) cells form, each with half the chromosome number. Each chromosome still has 2 sister chromatids. Meiosis II will separate them.';
      if (phaseName === 'Prophase II')  return 'Prophase II: Spindle reforms in each haploid cell. Each chromosome (with sister chromatids) prepares for equational division.';
      if (phaseName === 'Metaphase II') return 'Metaphase II: Chromosomes align single-file at the equator — just like mitosis, but in haploid cells (n chromosomes).';
      if (phaseName === 'Anaphase II' && !scissorsUsed) return 'Anaphase II: Now centromeres DO split (like mitosis). Click Scissors to separate sister chromatids → they fly to opposite poles.';
      if (phaseName === 'Anaphase II')  return '✅ Centromeres split in Meiosis II! Sister chromatids separate → final 4 haploid genetically unique cells (recombinant) will form.';
      if (phaseName === 'Telophase II') return 'Telophase II: 4 haploid cells produced. Each has unique genetic combination due to crossing over. Final product: 4 haploid (n/1C) cells.';
    }
    return 'Select a mode and advance through the phases.';
  };

  const reset = useCallback(() => {
    setPhaseIdx(0); setScissorsUsed(false); setCrossingOver(false);
    setCrossoverCount(1); setAutoPlay(false); setScissorsBlocked(false);
    setShowMeiosisII(false);
  }, []);

  const switchMode = useCallback((m: DivisionMode) => {
    setMode(m); setPhaseIdx(0); setScissorsUsed(false);
    setCrossingOver(false); setAutoPlay(false); setScissorsBlocked(false);
    setShowMeiosisII(false);
  }, []);

  const handleScissors = useCallback(() => {
    if (scissorsEnabled) { setScissorsUsed(true); return; }
    if (inAnaI) { setScissorsBlocked(true); }
  }, [scissorsEnabled, inAnaI]);

  /* ── SIMULATION PANEL ────────────────────────────── */
  const simulationCombo = (
    <div className="w-full h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-1 shrink-0">
        <div>
          <div className="text-sm font-bold text-slate-900">Virtual Microscope — Cell Division Arena</div>
          <div className="text-[11px] text-slate-500">Mitosis vs Meiosis · NCERT Ch. 10.2 &amp; 10.4</div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold text-white shrink-0 ${isMitosis ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
          {isMitosis ? 'Mitosis' : 'Meiosis'} — {phaseName}
        </span>
      </div>

      {/* SVG takes all remaining height */}
      <div className="flex-1 min-h-0 px-1 pb-1">
        <DivisionArenaSVG
          mode={mode}
          phaseIdx={phaseIdx}
          totalPhases={totalPhases}
          phaseName={phaseName}
          crossingOver={crossingOver}
          crossoverCount={crossoverCount}
          scissorsUsed={scissorsUsed}
          scissorsBlocked={scissorsBlocked}
          showMeiosisII={showMeiosisII}
        />
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-4 gap-2 px-3 pb-2 shrink-0">
        <MetricCard label="Division" value={isMitosis ? 'Equational' : 'Reductional I'} tone="text-indigo-700" />
        <MetricCard label="Ploidy / DNA" value={ploidyLabel} tone="text-emerald-700" />
        <MetricCard label="Centromere" value={centromereLabel} tone={inAnaphaseMitosis ? 'text-amber-700' : 'text-slate-700'} />
        <MetricCard label="Phase" value={phaseName} tone="text-rose-700" />
      </div>
    </div>
  );

  /* ── CONTROLS PANEL ─────────────────────────────── */
  const controlsCombo = (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full overflow-y-auto max-h-[34vh]">
      <div className="p-3 flex flex-col gap-3">

        {/* Goal */}
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-xs text-indigo-900">
          <strong>Goal:</strong> Observe how alignment at Metaphase and centromere fate at Anaphase determine whether a cell stays diploid or becomes haploid.
        </div>

        {/* Mode + Meiosis II toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => switchMode('mitosis')}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${isMitosis ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'}`}>
            Mitosis
          </button>
          <button onClick={() => switchMode('meiosis')}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${!isMitosis ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'}`}>
            Meiosis I{showMeiosisII ? ' + II' : ''}
          </button>
        </div>

        {!isMitosis && (
          <button onClick={() => setShowMeiosisII(v => !v)}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all w-full ${showMeiosisII ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-purple-300 hover:bg-purple-50'}`}>
            {showMeiosisII ? '✓ Meiosis II ON (8 phases)' : 'Show Meiosis II →'}
          </button>
        )}

        {/* Phase selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phase</span>
            <span className="text-[10px] font-bold text-indigo-700">{phaseName}</span>
          </div>
          <div className={`grid gap-1 ${totalPhases <= 4 ? 'grid-cols-4' : 'grid-cols-4'}`}>
            {phases.map((ph, i) => (
              <button key={ph} onClick={() => { setPhaseIdx(i); setScissorsUsed(false); setAutoPlay(false); }}
                className={`rounded-lg border px-1 py-1.5 text-[9px] font-bold transition-all leading-tight ${phaseIdx === i
                  ? (isMitosis ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-emerald-600 text-white border-emerald-600')
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {ph.replace(' ', '\n')}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-play + progress */}
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoPlay(v => !v)}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all shrink-0 ${autoPlay ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-50'}`}>
            {autoPlay ? '⏸ Pause' : '▶ Auto-Play'}
          </button>
          <div className="flex-1">
            <input type="range" min={0} max={totalPhases - 1} value={phaseIdx}
              onChange={e => { setPhaseIdx(parseInt(e.target.value)); setScissorsUsed(false); setAutoPlay(false); }}
              className="w-full accent-indigo-600" />
          </div>
        </div>

        {/* Tools row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Crossing over */}
          <button onClick={() => setCrossingOver(v => !v)}
            disabled={isMitosis || !phaseName.includes('Prophase I')}
            className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${crossingOver ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-emerald-300 hover:bg-emerald-50'}`}>
            ✕ Cross-Over {crossingOver ? 'ON' : 'OFF'}
          </button>
          {/* Scissors */}
          <button onClick={handleScissors}
            className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1 ${scissorsBlocked ? 'bg-red-100 text-red-700 border-red-400' : scissorsUsed ? 'bg-amber-600 text-white border-amber-600' : scissorsEnabled ? 'bg-white text-slate-700 border-amber-300 hover:bg-amber-50' : 'opacity-40 cursor-not-allowed bg-white text-slate-400 border-slate-200'}`}>
            <Scissors size={12} /> {scissorsUsed ? 'Cut ✓' : 'Scissors'}
          </button>
          {/* Reset */}
          <button onClick={reset}
            className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-1">
            <RefreshCcw size={12} /> Reset
          </button>
        </div>

        {/* Crossover count (only in meiosis prophase I when crossing over ON) */}
        {!isMitosis && crossingOver && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chiasmata Count</span>
              <span className="text-[10px] font-bold text-emerald-700">{crossoverCount}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setCrossoverCount(n)}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-bold transition-all ${crossoverCount === n ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}>
                  {n} {n === 1 ? 'chiasma' : 'chiasmata'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live observation */}
        <InfoCard title="Live Observation" icon={<Activity size={14} className="text-indigo-600" />}>
          <p className={`text-xs ${scissorsBlocked ? 'text-red-700 font-bold' : ''}`}>{getObservation()}</p>
        </InfoCard>

        {/* Steps */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <div className="text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-widest">Steps</div>
          <ol className="text-[10px] text-slate-600 space-y-0.5 list-decimal list-inside">
            <li><strong>Mitosis</strong> → Metaphase: all chromosomes single-file at equator.</li>
            <li>→ Anaphase: click <strong>Scissors</strong> to split centromeres → chromatids fly to poles.</li>
            <li>Switch to <strong>Meiosis</strong> → Prophase I: activate <strong>Crossing Over</strong> (1–3 chiasmata).</li>
            <li>→ Metaphase I: bivalents at equator (paired, not single-file).</li>
            <li>→ Anaphase I: try Scissors — see the block! Centromeres stay intact.</li>
            <li>Enable <strong>Meiosis II →</strong> follow through Anaphase II where centromeres DO split.</li>
            <li>Final: 4 haploid recombinant cells vs 2 identical diploid cells.</li>
          </ol>
        </div>

        {/* NCERT notes */}
        <InfoCard title="NCERT Key Points (Ch. 10.2 & 10.4)" icon={<Dna size={14} className="text-emerald-600" />}>
          <ul className="text-xs list-disc list-inside space-y-0.5">
            <li>Mitosis = equational division: 2n → 2n (chromatids separate).</li>
            <li>Meiosis I = reductional: 2n → n (homologues separate, centromeres intact).</li>
            <li>Meiosis II = equational: n → n (chromatids separate, like mitosis).</li>
            <li>Crossing over in Pachytene (Prophase I) creates genetic diversity.</li>
            <li>Bivalent = pair of homologous chromosomes = tetrad = 4 chromatids.</li>
          </ul>
        </InfoCard>
        <InfoCard title="The Two Critical Decisions" icon={<Split size={14} className="text-amber-600" />}>
          <p className="text-xs"><strong>1. Alignment:</strong> Single file (Mitosis/Meiosis II) vs. paired bivalents (Meiosis I).<br />
          <strong>2. Centromere fate:</strong> Splits (Mitosis / Meiosis II) vs. stays intact (Meiosis I).<br />
          These two choices determine diploid vs. haploid outcome.</p>
        </InfoCard>
      </div>
    </div>
  );

  return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />;
};

/* ═══════════════════════════════════════════════════════
   MAIN SVG  1000 × 600
   Band 1  y   0– 44  Header bar
   Band 2  y  44– 84  Phase timeline strip
   Band 3  y  84–504  Microscope eyepiece (cell arena)
   Band 4  y 504–560  Ploidy ticker + comparison panel
   Band 5  y 560–600  Bottom label bar
═══════════════════════════════════════════════════════ */
const DivisionArenaSVG = ({
  mode, phaseIdx, totalPhases, phaseName,
  crossingOver, crossoverCount, scissorsUsed, scissorsBlocked, showMeiosisII,
}: {
  mode: DivisionMode; phaseIdx: number; totalPhases: number; phaseName: string;
  crossingOver: boolean; crossoverCount: number; scissorsUsed: boolean;
  scissorsBlocked: boolean; showMeiosisII: boolean;
}) => {
  const isMitosis = mode === 'mitosis';
  // Cell arena center
  const CX = 500, CY = 294, R = 195;
  // Poles
  const LP = { x: 80, y: CY };
  const RP = { x: 920, y: CY };

  return (
    <svg viewBox="0 0 1000 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet"
      aria-label="Mitosis and meiosis division arena">

      {/* ── DEFS ── */}
      <defs>
        <radialGradient id="vignetteGrad" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
        </radialGradient>
        <radialGradient id="cellBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#dcfce7" />
        </radialGradient>
        <filter id="mmGlow">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="mmSoftShadow">
          <feDropShadow dx="0" dy="1" stdDeviation="3" floodOpacity="0.25" />
        </filter>
        <marker id="mmArrB" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#4f46e5" />
        </marker>
      </defs>

      {/* ════════ BAND 1 – HEADER ════════ */}
      <rect width="1000" height="44" rx="14" fill={isMitosis ? '#312e81' : '#064e3b'} />
      <rect y="28" width="1000" height="16" fill={isMitosis ? '#312e81' : '#064e3b'} />
      <text x="500" y="28" textAnchor="middle" fontSize="17" fontWeight="900" fill="#fff" letterSpacing="0.3">
        {isMitosis ? 'Mitosis — Equational Division (2n → 2n)' : `Meiosis — Reductional Division${showMeiosisII ? ' I + II' : ' I'} (2n → n${showMeiosisII ? ' → 4 cells' : ''})`}
      </text>

      {/* ════════ BAND 2 – PHASE TIMELINE ════════ */}
      <rect x="0" y="44" width="1000" height="40" fill="#f8fafc" />
      <PhaseTimeline phases={isMitosis ? ['Prophase','Metaphase','Anaphase','Telophase']
        : showMeiosisII ? ['Pro I','Met I','Ana I','Tel I','Pro II','Met II','Ana II','Tel II']
        : ['Prophase I','Metaphase I','Anaphase I','Telophase I']}
        current={phaseIdx} isMitosis={isMitosis} />

      {/* ════════ BAND 3 – CELL ARENA ════════ */}
      {/* Microscope outer chrome ring */}
      <circle cx={CX} cy={CY} r={R + 22} fill="#334155" filter="url(#mmSoftShadow)" />
      <circle cx={CX} cy={CY} r={R + 18} fill="#1e293b" />
      <circle cx={CX} cy={CY} r={R + 12} fill="#0f172a" />

      {/* Cell interior */}
      <circle cx={CX} cy={CY} r={R} fill="url(#cellBg)" />

      {/* Equatorial line (horizontal, standard biology convention) */}
      <line x1={CX - R} y1={CY} x2={CX + R} y2={CY}
        stroke="#94a3b8" strokeWidth="2" strokeDasharray="8 6" opacity="0.55" />
      <text x={CX + R - 4} y={CY - 6} textAnchor="end" fontSize="10" fontWeight="700" fill="#64748b">equator</text>

      {/* Poles */}
      <PoleNode x={LP.x} y={LP.y} label="Left Pole" />
      <PoleNode x={RP.x} y={RP.y} label="Right Pole" />

      {/* Spindle fibres */}
      <SpindleSet mode={mode} phaseName={phaseName} scissorsUsed={scissorsUsed}
        LP={LP} RP={RP} CX={CX} CY={CY} />

      {/* Chromosomes / bivalents */}
      <ChromosomeLayer
        mode={mode} phaseName={phaseName}
        crossingOver={crossingOver} crossoverCount={crossoverCount}
        scissorsUsed={scissorsUsed}
        CX={CX} CY={CY} R={R}
      />

      {/* Scissors animated fly-in */}
      {(scissorsUsed) && (
        <ScissorsAnimation CX={CX} CY={CY} />
      )}

      {/* Scissors blocked flash */}
      {scissorsBlocked && (
        <g>
          <rect x={CX - 170} y={CY - 28} width="340" height="36" rx="12" fill="#fee2e2" stroke="#ef4444" strokeWidth="2">
            <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
          </rect>
          <text x={CX} y={CY - 5} textAnchor="middle" fontSize="13" fontWeight="900" fill="#991b1b">
            ❌ Centromeres do NOT split in Meiosis I
            <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
          </text>
        </g>
      )}

      {/* Nuclear envelope */}
      <NuclearEnvelope phaseName={phaseName} mode={mode} CX={CX} CY={CY} R={R} />

      {/* Vignette overlay (microscope optical feel) */}
      <circle cx={CX} cy={CY} r={R} fill="url(#vignetteGrad)" />

      {/* Magnification badge */}
      <rect x="328" y="88" width="68" height="20" rx="6" fill="#1e293b" opacity="0.75" />
      <text x="362" y="102" textAnchor="middle" fontSize="10" fontWeight="900" fill="#94a3b8">400× obj.</text>

      {/* ════════ BAND 4 – PLOIDY TICKER + COMPARISON ════════ */}
      <PloidyTicker phaseName={phaseName} mode={mode} scissorsUsed={scissorsUsed} />
      <ComparisonPanel y={504} isMitosis={isMitosis} />

      {/* ════════ BAND 5 – BOTTOM LABEL ════════ */}
      <rect x="0" y="572" width="1000" height="28" fill="#f1f5f9" />
      <text x="500" y="590" textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569">
        {getBottomLabel(mode, phaseName, scissorsUsed, crossingOver)}
      </text>
    </svg>
  );
};

function getBottomLabel(mode: DivisionMode, phase: string, scissorsUsed: boolean, crossingOver: boolean): string {
  if (mode === 'mitosis') {
    if (phase === 'Prophase')  return 'Chromosomes condense · Nuclear envelope dissolves · Spindle forms';
    if (phase === 'Metaphase') return '↔ Single-file alignment at metaphase plate — each chromosome faces both poles';
    if (phase === 'Anaphase')  return scissorsUsed ? '↕ Centromeres split → sister chromatids → daughter chromosomes → poles' : 'Use Scissors tool to split centromeres';
    if (phase === 'Telophase') return 'Nuclear envelopes reform · Cytokinesis (cleavage furrow) → 2 identical 2n daughter cells';
  } else {
    if (phase === 'Prophase I')  return crossingOver ? 'Synapsis + Crossing Over · Chiasmata visible · Genetic recombination' : 'Synapsis: homologues pair → bivalents (tetrads) · No crossing over active';
    if (phase === 'Metaphase I') return '↔ Bivalents at equator (pairs!) — each homologue faces ONE pole only';
    if (phase === 'Anaphase I')  return '↕ Whole homologues move to poles · Centromeres remain intact · 2n → n';
    if (phase === 'Telophase I') return '2 haploid (n) cells · Each chromosome still has 2 sister chromatids';
    if (phase === 'Prophase II') return 'Spindle reforms in each haploid cell · Chromosomes re-condense';
    if (phase === 'Metaphase II')return 'Single-file alignment (like mitosis) in each haploid cell';
    if (phase === 'Anaphase II') return scissorsUsed ? '↕ Centromeres split in Meiosis II → final 4 haploid cells' : 'Use Scissors — centromeres DO split in Meiosis II';
    if (phase === 'Telophase II')return '4 haploid (n/1C) genetically unique cells — meiosis complete!';
  }
  return '';
}

/* ══════════════════════════════════════════════
   PHASE TIMELINE (Band 2)
══════════════════════════════════════════════ */
const PhaseTimeline = ({ phases, current, isMitosis }: {
  phases: string[]; current: number; isMitosis: boolean;
}) => {
  const n = phases.length;
  const segW = 1000 / n;
  const activeCol = isMitosis ? '#4f46e5' : '#059669';
  return (
    <g>
      {phases.map((ph, i) => {
        const cx = segW * i + segW / 2;
        const active = i === current;
        const done = i < current;
        return (
          <g key={ph}>
            {/* connector */}
            {i < n - 1 && (
              <line x1={cx + segW / 2} y1={64} x2={cx + segW} y2={64}
                stroke={done ? activeCol : '#cbd5e1'} strokeWidth="2" />
            )}
            {/* bubble */}
            <circle cx={cx} cy={64} r={active ? 11 : 8}
              fill={active ? activeCol : done ? activeCol : '#e2e8f0'}
              stroke={active ? '#fff' : 'none'} strokeWidth="2">
              {active && <animate attributeName="r" values="11;13;11" dur="1s" repeatCount="indefinite" />}
            </circle>
            {/* label */}
            <text x={cx} y={82} textAnchor="middle" fontSize={active ? 9.5 : 8.5}
              fontWeight={active ? '900' : '600'}
              fill={active ? activeCol : done ? '#475569' : '#94a3b8'}>
              {ph}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/* ══════════════════════════════════════════════
   POLE NODE
══════════════════════════════════════════════ */
const PoleNode = ({ x, y, label }: { x: number; y: number; label: string }) => (
  <g>
    <circle cx={x} cy={y} r={22} fill="#fef3c7" stroke="#d97706" strokeWidth="3" filter="url(#mmGlow)" />
    <circle cx={x} cy={y} r={12} fill="#fde68a" stroke="#f59e0b" strokeWidth="2">
      <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite" />
    </circle>
    <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fontWeight="900" fill="#92400e">MTOC</text>
    <text x={x} y={y + 36} textAnchor="middle" fontSize="9" fontWeight="700" fill="#92400e">{label.split(' ')[0]}</text>
    <text x={x} y={y + 46} textAnchor="middle" fontSize="9" fontWeight="700" fill="#92400e">{label.split(' ')[1]}</text>
  </g>
);

/* ══════════════════════════════════════════════
   SPINDLE SET
══════════════════════════════════════════════ */
const SpindleSet = ({ mode, phaseName, scissorsUsed, LP, RP, CX, CY }: {
  mode: DivisionMode; phaseName: string; scissorsUsed: boolean;
  LP: { x: number; y: number }; RP: { x: number; y: number }; CX: number; CY: number;
}) => {
  const isMitosis = mode === 'mitosis';
  const show = !phaseName.includes('Prophase') && !phaseName.includes('Telophase');
  if (!show) return null;

  // Attachment points depend on mode
  const attachY = isMitosis
    ? [CY - 90, CY - 30, CY + 30, CY + 90]   // 4 single chromosomes
    : [CY - 60, CY + 60];                       // 2 bivalents

  // During anaphase, fibres retract toward poles
  const isAna = phaseName.includes('Anaphase');
  const attachL = isAna
    ? attachY.map(ay => ({ x: LP.x + 60, y: ay }))
    : attachY.map(ay => ({ x: CX, y: ay }));
  const attachR = isAna
    ? attachY.map(ay => ({ x: RP.x - 60, y: ay }))
    : attachY.map(ay => ({ x: CX, y: ay }));

  return (
    <g opacity="0.7">
      {attachY.map((_, i) => (
        <g key={i}>
          <line x1={LP.x + 22} y1={LP.y} x2={attachL[i].x} y2={attachL[i].y}
            stroke="#a78bfa" strokeWidth="1.8" strokeDasharray={isAna ? '5 3' : '6 4'} />
          <line x1={RP.x - 22} y1={RP.y} x2={attachR[i].x} y2={attachR[i].y}
            stroke="#a78bfa" strokeWidth="1.8" strokeDasharray={isAna ? '5 3' : '6 4'} />
        </g>
      ))}
    </g>
  );
};

/* ══════════════════════════════════════════════
   NUCLEAR ENVELOPE
══════════════════════════════════════════════ */
const NuclearEnvelope = ({ phaseName, mode, CX, CY, R }: {
  phaseName: string; mode: DivisionMode; CX: number; CY: number; R: number;
}) => {
  const showFull = phaseName === 'Prophase' || phaseName === 'Prophase I' || phaseName === 'Prophase II';
  const showTelophase = phaseName.includes('Telophase');

  if (showFull) return (
    <ellipse cx={CX} cy={CY} rx={R * 0.55} ry={R * 0.48}
      fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.6">
      <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
    </ellipse>
  );

  if (showTelophase) {
    // two small nuclei at daughter cell positions
    const positions = mode === 'mitosis'
      ? [{ cx: CX - 130, cy: CY }, { cx: CX + 130, cy: CY }]
      : mode === 'meiosis' && phaseName === 'Telophase II'
        ? [{ cx: CX - 200, cy: CY - 80 }, { cx: CX - 200, cy: CY + 80 }, { cx: CX + 200, cy: CY - 80 }, { cx: CX + 200, cy: CY + 80 }]
        : [{ cx: CX - 130, cy: CY }, { cx: CX + 130, cy: CY }];
    return (
      <g>
        {positions.map((p, i) => (
          <ellipse key={i} cx={p.cx} cy={p.cy} rx="48" ry="42"
            fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.7">
            <animate attributeName="opacity" values="0;0.7" dur="0.8s" fill="freeze" />
          </ellipse>
        ))}
      </g>
    );
  }
  return null;
};

/* ══════════════════════════════════════════════
   CHROMOSOME LAYER — positions & appearances by phase
══════════════════════════════════════════════ */
const ChromosomeLayer = ({ mode, phaseName, crossingOver, crossoverCount, scissorsUsed, CX, CY, R }: {
  mode: DivisionMode; phaseName: string; crossingOver: boolean; crossoverCount: number;
  scissorsUsed: boolean; CX: number; CY: number; R: number;
}) => {
  const isMitosis = mode === 'mitosis';

  /* ── MITOSIS ── */
  if (isMitosis) {
    if (phaseName === 'Prophase') return (
      <g>
        {/* loose, scattered duplicated chromosomes */}
        <DupChromosome cx={CX - 80} cy={CY - 90} col={PAIR_COLORS[0]} rot={-20} condensed={false} />
        <DupChromosome cx={CX + 70} cy={CY - 60} col={PAIR_COLORS[0]} rot={15} condensed={false} />
        <DupChromosome cx={CX - 60} cy={CY + 70} col={PAIR_COLORS[1]} rot={30} condensed={false} />
        <DupChromosome cx={CX + 90} cy={CY + 80} col={PAIR_COLORS[1]} rot={-10} condensed={false} />
      </g>
    );

    if (phaseName === 'Metaphase') return (
      <g>
        {/* single-file at equator */}
        <DupChromosome cx={CX} cy={CY - 90} col={PAIR_COLORS[0]} rot={0} condensed />
        <DupChromosome cx={CX} cy={CY - 30} col={PAIR_COLORS[0]} rot={0} condensed />
        <DupChromosome cx={CX} cy={CY + 30} col={PAIR_COLORS[1]} rot={0} condensed />
        <DupChromosome cx={CX} cy={CY + 90} col={PAIR_COLORS[1]} rot={0} condensed />
        <text x={CX + 210} y={CY} textAnchor="middle" fontSize="11" fontWeight="900" fill="#312e81">
          ← SINGLE FILE →
        </text>
      </g>
    );

    if (phaseName === 'Anaphase') {
      if (!scissorsUsed) return (
        <g>
          {/* still joined — waiting for scissors */}
          <DupChromosome cx={CX} cy={CY - 80} col={PAIR_COLORS[0]} rot={0} condensed pulse />
          <DupChromosome cx={CX} cy={CY - 20} col={PAIR_COLORS[0]} rot={0} condensed pulse />
          <DupChromosome cx={CX} cy={CY + 30} col={PAIR_COLORS[1]} rot={0} condensed pulse />
          <DupChromosome cx={CX} cy={CY + 90} col={PAIR_COLORS[1]} rot={0} condensed pulse />
        </g>
      );
      // After scissors: chromatids split and migrate
      return (
        <g>
          {/* Pair 0 — left pole: red, right pole: red */}
          <SingleChromatid cx={CX - 170} cy={CY - 80} color={PAIR_COLORS[0].mat} rot={-15} migrating />
          <SingleChromatid cx={CX + 170} cy={CY - 80} color={PAIR_COLORS[0].mat} rot={15} migrating />
          {/* Pair 0 homologue — left: pink, right: pink */}
          <SingleChromatid cx={CX - 170} cy={CY - 30} color={PAIR_COLORS[0].pat} rot={-15} migrating />
          <SingleChromatid cx={CX + 170} cy={CY - 30} color={PAIR_COLORS[0].pat} rot={15} migrating />
          {/* Pair 1 */}
          <SingleChromatid cx={CX - 170} cy={CY + 40} color={PAIR_COLORS[1].mat} rot={-15} migrating />
          <SingleChromatid cx={CX + 170} cy={CY + 40} color={PAIR_COLORS[1].mat} rot={15} migrating />
          <SingleChromatid cx={CX - 170} cy={CY + 90} color={PAIR_COLORS[1].pat} rot={-15} migrating />
          <SingleChromatid cx={CX + 170} cy={CY + 90} color={PAIR_COLORS[1].pat} rot={15} migrating />
        </g>
      );
    }

    if (phaseName === 'Telophase') return (
      <g>
        {/* two daughter clusters */}
        <DaughterCluster cx={CX - 130} cy={CY} colors={[PAIR_COLORS[0].mat, PAIR_COLORS[0].pat, PAIR_COLORS[1].mat, PAIR_COLORS[1].pat]} />
        <DaughterCluster cx={CX + 130} cy={CY} colors={[PAIR_COLORS[0].mat, PAIR_COLORS[0].pat, PAIR_COLORS[1].mat, PAIR_COLORS[1].pat]} />
        <CleavageFurrow CX={CX} CY={CY} R={R} />
        <text x={CX - 130} y={CY + 80} textAnchor="middle" fontSize="10" fontWeight="900" fill="#1d4ed8">2n identical</text>
        <text x={CX + 130} y={CY + 80} textAnchor="middle" fontSize="10" fontWeight="900" fill="#1d4ed8">2n identical</text>
      </g>
    );
  }

  /* ── MEIOSIS ── */
  if (!isMitosis) {
    if (phaseName === 'Prophase I') return (
      <g>
        {/* Two bivalents, loose in nucleus */}
        <BivalentGroup cx={CX - 60} cy={CY - 50} pairIdx={0}
          crossingOver={crossingOver} crossoverCount={crossoverCount} />
        <BivalentGroup cx={CX + 60} cy={CY + 60} pairIdx={1}
          crossingOver={crossingOver} crossoverCount={crossoverCount} />
        {crossingOver && (
          <text x={CX} y={CY + 160} textAnchor="middle" fontSize="11" fontWeight="900" fill="#059669">
            Chiasmata visible — genetic recombination active
          </text>
        )}
      </g>
    );

    if (phaseName === 'Metaphase I') return (
      <g>
        {/* bivalents at equator — PAIRS side-by-side, not single file */}
        <BivalentGroup cx={CX} cy={CY - 65} pairIdx={0}
          crossingOver={crossingOver} crossoverCount={crossoverCount} />
        <BivalentGroup cx={CX} cy={CY + 65} pairIdx={1}
          crossingOver={crossingOver} crossoverCount={crossoverCount} />
        <text x={CX + 215} y={CY} textAnchor="middle" fontSize="11" fontWeight="900" fill="#059669">
          ← BIVALENT PAIRS →
        </text>
      </g>
    );

    if (phaseName === 'Anaphase I') return (
      <g>
        {/* Whole chromosomes (X-shapes) migrate — centromeres intact */}
        {/* Pair 0: mat → left, pat → right */}
        <DupChromosome cx={CX - 160} cy={CY - 60}
          col={crossingOver ? { mat: PAIR_COLORS[0].mat, pat: PAIR_COLORS[0].pat } : PAIR_COLORS[0]}
          rot={-10} condensed migrating />
        <DupChromosome cx={CX + 160} cy={CY - 60}
          col={crossingOver ? { mat: PAIR_COLORS[0].pat, pat: PAIR_COLORS[0].mat } : { mat: PAIR_COLORS[0].pat, pat: PAIR_COLORS[0].pat }}
          rot={10} condensed migrating />
        {/* Pair 1 */}
        <DupChromosome cx={CX - 160} cy={CY + 60}
          col={crossingOver ? { mat: PAIR_COLORS[1].mat, pat: PAIR_COLORS[1].pat } : PAIR_COLORS[1]}
          rot={-10} condensed migrating />
        <DupChromosome cx={CX + 160} cy={CY + 60}
          col={crossingOver ? { mat: PAIR_COLORS[1].pat, pat: PAIR_COLORS[1].mat } : { mat: PAIR_COLORS[1].pat, pat: PAIR_COLORS[1].pat }}
          rot={10} condensed migrating />
        {/* Centromere intact badge */}
        <rect x={CX - 80} y={CY - 18} width="160" height="22" rx="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" />
        <text x={CX} y={CY - 2} textAnchor="middle" fontSize="10" fontWeight="900" fill="#166534">Centromeres INTACT ✓</text>
      </g>
    );

    if (phaseName === 'Telophase I') return (
      <g>
        {/* 2 haploid daughter cells */}
        <DupChromosome cx={CX - 140} cy={CY - 55}
          col={crossingOver ? { mat: PAIR_COLORS[0].mat, pat: PAIR_COLORS[0].pat } : PAIR_COLORS[0]}
          rot={-5} condensed />
        <DupChromosome cx={CX - 140} cy={CY + 55}
          col={crossingOver ? { mat: PAIR_COLORS[1].mat, pat: PAIR_COLORS[1].pat } : PAIR_COLORS[1]}
          rot={5} condensed />
        <DupChromosome cx={CX + 140} cy={CY - 55}
          col={crossingOver ? { mat: PAIR_COLORS[0].pat, pat: PAIR_COLORS[0].mat } : { mat: PAIR_COLORS[0].pat, pat: PAIR_COLORS[0].pat }}
          rot={5} condensed />
        <DupChromosome cx={CX + 140} cy={CY + 55}
          col={crossingOver ? { mat: PAIR_COLORS[1].pat, pat: PAIR_COLORS[1].mat } : { mat: PAIR_COLORS[1].pat, pat: PAIR_COLORS[1].pat }}
          rot={-5} condensed />
        <CleavageFurrow CX={CX} CY={CY} R={R} />
        <text x={CX - 140} y={CY + 120} textAnchor="middle" fontSize="10" fontWeight="900" fill="#059669">n (haploid)</text>
        <text x={CX + 140} y={CY + 120} textAnchor="middle" fontSize="10" fontWeight="900" fill="#059669">n (haploid)</text>
      </g>
    );

    // ── Meiosis II phases ──
    if (phaseName === 'Prophase II') return (
      <g>
        {/* Two haploid cells side by side — chromosomes re-condensing */}
        <DupChromosome cx={CX - 180} cy={CY - 40} col={PAIR_COLORS[0]} rot={-15} condensed={false} />
        <DupChromosome cx={CX - 130} cy={CY + 50} col={PAIR_COLORS[1]} rot={10} condensed={false} />
        <DupChromosome cx={CX + 130} cy={CY - 40} col={crossingOver ? { mat: PAIR_COLORS[0].pat, pat: PAIR_COLORS[0].mat } : { mat: PAIR_COLORS[0].pat, pat: PAIR_COLORS[0].pat }} rot={15} condensed={false} />
        <DupChromosome cx={CX + 180} cy={CY + 50} col={crossingOver ? { mat: PAIR_COLORS[1].pat, pat: PAIR_COLORS[1].mat } : { mat: PAIR_COLORS[1].pat, pat: PAIR_COLORS[1].pat }} rot={-10} condensed={false} />
        {/* dividing line */}
        <line x1={CX} y1={CY - R + 10} x2={CX} y2={CY + R - 10}
          stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
      </g>
    );

    if (phaseName === 'Metaphase II') return (
      <g>
        {/* two cells, each with single-file chromosomes at their equators */}
        <DupChromosome cx={CX - 170} cy={CY - 45} col={PAIR_COLORS[0]} rot={0} condensed />
        <DupChromosome cx={CX - 170} cy={CY + 45} col={PAIR_COLORS[1]} rot={0} condensed />
        <DupChromosome cx={CX + 170} cy={CY - 45}
          col={crossingOver ? { mat: PAIR_COLORS[0].pat, pat: PAIR_COLORS[0].mat } : { mat: PAIR_COLORS[0].pat, pat: PAIR_COLORS[0].pat }}
          rot={0} condensed />
        <DupChromosome cx={CX + 170} cy={CY + 45}
          col={crossingOver ? { mat: PAIR_COLORS[1].pat, pat: PAIR_COLORS[1].mat } : { mat: PAIR_COLORS[1].pat, pat: PAIR_COLORS[1].pat }}
          rot={0} condensed />
        <line x1={CX} y1={CY - R + 10} x2={CX} y2={CY + R - 10}
          stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
      </g>
    );

    if (phaseName === 'Anaphase II') {
      if (!scissorsUsed) return (
        <g>
          <DupChromosome cx={CX - 175} cy={CY - 40} col={PAIR_COLORS[0]} rot={0} condensed pulse />
          <DupChromosome cx={CX - 175} cy={CY + 40} col={PAIR_COLORS[1]} rot={0} condensed pulse />
          <DupChromosome cx={CX + 175} cy={CY - 40}
            col={crossingOver ? { mat: PAIR_COLORS[0].pat, pat: PAIR_COLORS[0].mat } : { mat: PAIR_COLORS[0].pat, pat: PAIR_COLORS[0].pat }}
            rot={0} condensed pulse />
          <DupChromosome cx={CX + 175} cy={CY + 40}
            col={crossingOver ? { mat: PAIR_COLORS[1].pat, pat: PAIR_COLORS[1].mat } : { mat: PAIR_COLORS[1].pat, pat: PAIR_COLORS[1].pat }}
            rot={0} condensed pulse />
          <line x1={CX} y1={CY - R + 10} x2={CX} y2={CY + R - 10}
            stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
        </g>
      );
      // After scissors
      return (
        <g>
          {/* 4 quadrant positions */}
          <SingleChromatid cx={CX - 240} cy={CY - 70} color={PAIR_COLORS[0].mat} rot={-20} migrating />
          <SingleChromatid cx={CX - 100} cy={CY - 70} color={PAIR_COLORS[0].mat} rot={20} migrating />
          <SingleChromatid cx={CX - 240} cy={CY + 60} color={PAIR_COLORS[1].mat} rot={-20} migrating />
          <SingleChromatid cx={CX - 100} cy={CY + 60} color={PAIR_COLORS[1].mat} rot={20} migrating />
          <SingleChromatid cx={CX + 100} cy={CY - 70}
            color={crossingOver ? PAIR_COLORS[0].pat : PAIR_COLORS[0].pat} rot={-20} migrating />
          <SingleChromatid cx={CX + 240} cy={CY - 70}
            color={crossingOver ? PAIR_COLORS[0].pat : PAIR_COLORS[0].pat} rot={20} migrating />
          <SingleChromatid cx={CX + 100} cy={CY + 60}
            color={crossingOver ? PAIR_COLORS[1].pat : PAIR_COLORS[1].pat} rot={-20} migrating />
          <SingleChromatid cx={CX + 240} cy={CY + 60}
            color={crossingOver ? PAIR_COLORS[1].pat : PAIR_COLORS[1].pat} rot={20} migrating />
          <line x1={CX} y1={CY - R + 10} x2={CX} y2={CY + R - 10}
            stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
        </g>
      );
    }

    if (phaseName === 'Telophase II') return (
      <g>
        {/* 4 haploid cells */}
        {[
          { cx: CX - 195, cy: CY - 85, c: PAIR_COLORS[0].mat, label: 'n cell 1' },
          { cx: CX - 195, cy: CY + 85, c: PAIR_COLORS[1].mat, label: 'n cell 2' },
          { cx: CX + 195, cy: CY - 85, c: crossingOver ? PAIR_COLORS[0].pat : PAIR_COLORS[0].pat, label: 'n cell 3' },
          { cx: CX + 195, cy: CY + 85, c: crossingOver ? PAIR_COLORS[1].pat : PAIR_COLORS[1].pat, label: 'n cell 4' },
        ].map((cell, i) => (
          <g key={i}>
            <ellipse cx={cell.cx} cy={cell.cy} rx="52" ry="44"
              fill="#dbeafe" stroke="#2563eb" strokeWidth="2" opacity="0.85">
              <animate attributeName="opacity" values="0;0.85" dur="0.6s" fill="freeze" />
            </ellipse>
            <SingleChromatid cx={cell.cx} cy={cell.cy} color={cell.c} rot={0} />
            <text x={cell.cx} y={cell.cy + 58} textAnchor="middle"
              fontSize="10" fontWeight="900" fill="#059669">{cell.label}</text>
          </g>
        ))}
        <text x={CX} y={CY} textAnchor="middle" fontSize="13" fontWeight="900" fill="#7c3aed">
          4 haploid cells ✓
        </text>
      </g>
    );
  }

  return null;
};

/* ══════════════════════════════════════════════
   DUP CHROMOSOME  (X-shape: 2 sister chromatids)
══════════════════════════════════════════════ */
const DupChromosome = ({ cx, cy, col, rot, condensed, pulse, migrating }: {
  cx: number; cy: number; col: { mat: string; pat: string };
  rot: number; condensed: boolean; pulse?: boolean; migrating?: boolean;
}) => {
  const arm = condensed ? 28 : 38;
  const sw = condensed ? 7 : 4;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      {/* Left chromatid (maternal arm) */}
      <path d={`M -${arm * 0.7} -${arm} C -6 -8 -6 8 -${arm * 0.7} ${arm}`}
        fill="none" stroke={col.mat} strokeWidth={sw} strokeLinecap="round">
        {pulse && <animate attributeName="stroke-width" values={`${sw};${sw + 3};${sw}`} dur="0.7s" repeatCount="indefinite" />}
        {migrating && <animate attributeName="opacity" values="1;0.7;1" dur="0.6s" repeatCount="indefinite" />}
      </path>
      {/* Right chromatid (paternal arm) */}
      <path d={`M ${arm * 0.7} -${arm} C 6 -8 6 8 ${arm * 0.7} ${arm}`}
        fill="none" stroke={col.pat} strokeWidth={sw} strokeLinecap="round">
        {pulse && <animate attributeName="stroke-width" values={`${sw};${sw + 3};${sw}`} dur="0.7s" repeatCount="indefinite" />}
        {migrating && <animate attributeName="opacity" values="1;0.7;1" dur="0.6s" repeatCount="indefinite" />}
      </path>
      {/* Centromere */}
      <circle cx={0} cy={0} r={condensed ? 7 : 5} fill="#facc15" stroke="#92400e" strokeWidth="2">
        {pulse && <animate attributeName="fill" values="#facc15;#ef4444;#facc15" dur="0.7s" repeatCount="indefinite" />}
      </circle>
      {/* Centromere lock icon (small dots) */}
      <circle cx={-3} cy={0} r="1.5" fill="#92400e" opacity="0.7" />
      <circle cx={3} cy={0} r="1.5" fill="#92400e" opacity="0.7" />
    </g>
  );
};

/* ══════════════════════════════════════════════
   SINGLE CHROMATID (post-split)
══════════════════════════════════════════════ */
const SingleChromatid = ({ cx, cy, color, rot, migrating }: {
  cx: number; cy: number; color: string; rot: number; migrating?: boolean;
}) => (
  <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
    <path d="M 0 -30 C 14 -10 14 10 0 30"
      fill="none" stroke={color} strokeWidth={7} strokeLinecap="round">
      {migrating && <animate attributeName="opacity" values="1;0.6;1" dur="0.5s" repeatCount="indefinite" />}
    </path>
    <circle cx={0} cy={0} r={6} fill="#fde68a" stroke="#92400e" strokeWidth="1.5" />
  </g>
);

/* ══════════════════════════════════════════════
   DAUGHTER CELL CLUSTER (Telophase mitosis)
══════════════════════════════════════════════ */
const DaughterCluster = ({ cx, cy, colors }: { cx: number; cy: number; colors: string[] }) => (
  <g>
    {colors.map((c, i) => {
      const offsets = [{ x: -18, y: -28 }, { x: 18, y: -28 }, { x: -18, y: 18 }, { x: 18, y: 18 }];
      return (
        <g key={i} transform={`translate(${cx + offsets[i].x} ${cy + offsets[i].y})`}>
          <path d="M 0 -22 C 10 -8 10 8 0 22"
            fill="none" stroke={c} strokeWidth={6} strokeLinecap="round">
            <animate attributeName="opacity" values="0;1" dur="0.6s" fill="freeze" />
          </path>
          <circle cx={0} cy={0} r={5} fill="#fde68a" stroke="#92400e" strokeWidth="1.5">
            <animate attributeName="opacity" values="0;1" dur="0.6s" fill="freeze" />
          </circle>
        </g>
      );
    })}
  </g>
);

/* ══════════════════════════════════════════════
   BIVALENT GROUP (tetrad with synapsis + chiasmata)
══════════════════════════════════════════════ */
const BivalentGroup = ({ cx, cy, pairIdx, crossingOver, crossoverCount }: {
  cx: number; cy: number; pairIdx: number; crossingOver: boolean; crossoverCount: number;
}) => {
  const col = PAIR_COLORS[pairIdx];
  const arm = 30;
  const sw = 7;
  // Left homologue: mat/mat. Right homologue: pat/pat
  // Crossing over swaps a segment of the inner chromatids
  const innerMatColor = crossingOver ? col.pat : col.mat;  // inner mat chromatid gets pat segment
  const innerPatColor = crossingOver ? col.mat : col.pat;  // inner pat chromatid gets mat segment

  return (
    <g transform={`translate(${cx} ${cy})`}>
      {/* Synapsis connector line */}
      <line x1={-28} y1={0} x2={28} y2={0}
        stroke="#94a3b8" strokeWidth="3" strokeDasharray="4 2" opacity="0.7">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
      </line>

      {/* Left homologue — two chromatids */}
      <path d={`M -${arm + 14} -${arm} C -${arm - 8} -8 -${arm - 8} 8 -${arm + 14} ${arm}`}
        fill="none" stroke={col.mat} strokeWidth={sw} strokeLinecap="round" />
      <path d={`M -${arm - 6} -${arm} C -6 -8 -6 8 -${arm - 6} ${arm}`}
        fill="none" stroke={innerMatColor} strokeWidth={sw} strokeLinecap="round" />
      <circle cx={-arm + 4} cy={0} r={7} fill="#facc15" stroke="#92400e" strokeWidth="2" />

      {/* Right homologue — two chromatids */}
      <path d={`M ${arm - 6} -${arm} C 6 -8 6 8 ${arm - 6} ${arm}`}
        fill="none" stroke={innerPatColor} strokeWidth={sw} strokeLinecap="round" />
      <path d={`M ${arm + 14} -${arm} C ${arm - 8 + 20} -8 ${arm - 8 + 20} 8 ${arm + 14} ${arm}`}
        fill="none" stroke={col.pat} strokeWidth={sw} strokeLinecap="round" />
      <circle cx={arm - 4} cy={0} r={7} fill="#facc15" stroke="#92400e" strokeWidth="2" />

      {/* Chiasmata X-marks */}
      {crossingOver && Array.from({ length: Math.min(crossoverCount, 3) }).map((_, i) => {
        const ypos = -arm + arm * 0.5 + i * (arm * 1.0 / Math.max(crossoverCount, 1));
        return (
          <g key={i}>
            <line x1={-8} y1={ypos - 8} x2={8} y2={ypos + 8}
              stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </line>
            <line x1={8} y1={ypos - 8} x2={-8} y2={ypos + 8}
              stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </line>
            {/* Segment swap colour indicator */}
            <text x={16} y={ypos + 4} fontSize="8" fontWeight="900" fill="#d97706">✕</text>
          </g>
        );
      })}

      {/* Labels */}
      <text x={-(arm + 14) - 10} y={-arm - 8} fontSize="8" fontWeight="800" fill={col.mat}>mat</text>
      <text x={arm + 14 + 2} y={-arm - 8} fontSize="8" fontWeight="800" fill={col.pat}>pat</text>
    </g>
  );
};

/* ══════════════════════════════════════════════
   CLEAVAGE FURROW
══════════════════════════════════════════════ */
const CleavageFurrow = ({ CX, CY, R }: { CX: number; CY: number; R: number }) => (
  <g>
    <path d={`M ${CX} ${CY - R + 8} C ${CX + 20} ${CY - 20} ${CX + 20} ${CY + 20} ${CX} ${CY + R - 8}`}
      fill="none" stroke="#4f46e5" strokeWidth="4" strokeDasharray="6 3" opacity="0.7">
      <animate attributeName="d"
        values={`M ${CX} ${CY - R + 8} C ${CX + 40} ${CY - 20} ${CX + 40} ${CY + 20} ${CX} ${CY + R - 8};
                 M ${CX} ${CY - R + 8} C ${CX + 8} ${CY - 20} ${CX + 8} ${CY + 20} ${CX} ${CY + R - 8}`}
        dur="1.2s" repeatCount="indefinite" />
    </path>
    <text x={CX + 26} y={CY + 4} fontSize="9" fontWeight="800" fill="#4f46e5">cleavage</text>
    <text x={CX + 26} y={CY + 14} fontSize="9" fontWeight="800" fill="#4f46e5">furrow</text>
  </g>
);

/* ══════════════════════════════════════════════
   SCISSORS ANIMATION
══════════════════════════════════════════════ */
const ScissorsAnimation = ({ CX, CY }: { CX: number; CY: number }) => (
  <g>
    {/* Scissors fly in from left */}
    <text fontSize="22" textAnchor="middle" fill="#f59e0b" filter="url(#mmGlow)">
      ✂
      <animateMotion dur="0.5s" fill="freeze"
        path={`M ${CX - 200} ${CY} L ${CX} ${CY}`} />
    </text>
    {/* Flash at centromere */}
    <circle cx={CX} cy={CY} r={14} fill="#ef4444" opacity="0">
      <animate attributeName="opacity" values="0;0.8;0" dur="0.6s" begin="0.45s" />
      <animate attributeName="r" values="14;22;14" dur="0.6s" begin="0.45s" />
    </circle>
  </g>
);

/* ══════════════════════════════════════════════
   PLOIDY TICKER (Band 4 left)
══════════════════════════════════════════════ */
const PloidyTicker = ({ phaseName, mode, scissorsUsed }: {
  phaseName: string; mode: DivisionMode; scissorsUsed: boolean;
}) => {
  const isMitosis = mode === 'mitosis';
  const isReduction = !isMitosis && ['Anaphase I', 'Telophase I'].includes(phaseName);
  const isHaploid = !isMitosis && ['Telophase I', 'Prophase II', 'Metaphase II', 'Anaphase II', 'Telophase II'].includes(phaseName);
  const isFinal = phaseName === 'Telophase II';

  const nLabel = isFinal ? 'n' : isHaploid ? 'n' : '2n';
  const cLabel = isFinal ? '1C' : isHaploid ? '2C' : '4C';
  const col = isReduction ? '#dc2626' : isHaploid ? '#d97706' : '#4f46e5';

  return (
    <g>
      {/* Background */}
      <rect x="16" y="508" width="220" height="60" rx="12" fill="#1e293b" />
      <text x="126" y="526" textAnchor="middle" fontSize="10" fontWeight="800" fill="#94a3b8">PLOIDY / DNA CONTENT</text>
      {/* Big digits */}
      <text x="80" y="558" textAnchor="middle" fontSize="26" fontWeight="900" fill={col} fontFamily="monospace">
        {nLabel}
        {isReduction && <animate attributeName="fill" values="#dc2626;#fbbf24;#dc2626" dur="0.7s" repeatCount="3" />}
      </text>
      <text x="126" y="558" textAnchor="middle" fontSize="20" fontWeight="700" fill="#64748b">/</text>
      <text x="172" y="558" textAnchor="middle" fontSize="26" fontWeight="900" fill={col} fontFamily="monospace">
        {cLabel}
        {isReduction && <animate attributeName="fill" values="#dc2626;#fbbf24;#dc2626" dur="0.7s" repeatCount="3" />}
      </text>
    </g>
  );
};

/* ══════════════════════════════════════════════
   COMPARISON MINI-PANEL (Band 4 right)
══════════════════════════════════════════════ */
const ComparisonPanel = ({ y, isMitosis }: { y: number; isMitosis: boolean }) => (
  <g>
    {/* Mitosis column */}
    <rect x="256" y={y + 4} width="360" height="62" rx="10"
      fill={isMitosis ? '#eef2ff' : '#f8fafc'}
      stroke={isMitosis ? '#4f46e5' : '#e2e8f0'} strokeWidth={isMitosis ? 2.5 : 1.5}>
      {isMitosis && <animate attributeName="stroke-width" values="2.5;4;2.5" dur="1.2s" repeatCount="indefinite" />}
    </rect>
    <text x="436" y={y + 20} textAnchor="middle" fontSize="11" fontWeight="900" fill={isMitosis ? '#4f46e5' : '#94a3b8'}>MITOSIS</text>
    <text x="436" y={y + 36} textAnchor="middle" fontSize="9" fontWeight="700" fill={isMitosis ? '#3730a3' : '#94a3b8'}>Alignment: SINGLE FILE</text>
    <text x="436" y={y + 50} textAnchor="middle" fontSize="9" fontWeight="700" fill={isMitosis ? '#3730a3' : '#94a3b8'}>Centromere: SPLITS → 2n+2n</text>

    {/* Meiosis I column */}
    <rect x="630" y={y + 4} width="360" height="62" rx="10"
      fill={!isMitosis ? '#ecfdf5' : '#f8fafc'}
      stroke={!isMitosis ? '#059669' : '#e2e8f0'} strokeWidth={!isMitosis ? 2.5 : 1.5}>
      {!isMitosis && <animate attributeName="stroke-width" values="2.5;4;2.5" dur="1.2s" repeatCount="indefinite" />}
    </rect>
    <text x="810" y={y + 20} textAnchor="middle" fontSize="11" fontWeight="900" fill={!isMitosis ? '#059669' : '#94a3b8'}>MEIOSIS I</text>
    <text x="810" y={y + 36} textAnchor="middle" fontSize="9" fontWeight="700" fill={!isMitosis ? '#065f46' : '#94a3b8'}>Alignment: BIVALENT PAIRS</text>
    <text x="810" y={y + 50} textAnchor="middle" fontSize="9" fontWeight="700" fill={!isMitosis ? '#065f46' : '#94a3b8'}>Centromere: INTACT → 2n+n</text>
  </g>
);

/* ══════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════ */
const MetricCard = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
    <div className={`mt-1 text-[11px] md:text-xs font-bold break-words leading-tight ${tone}`}>{value}</div>
  </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm text-xs text-slate-600 leading-relaxed">
    <div className="flex items-center gap-2 text-slate-900 font-bold mb-1.5">{icon}{title}</div>
    {children}
  </div>
);

export default MitosisMeiosisStagesLab;
