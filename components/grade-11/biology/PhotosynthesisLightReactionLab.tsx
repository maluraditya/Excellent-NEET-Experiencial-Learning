import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Droplets, Gauge, Leaf, RefreshCcw, Sun, Zap } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type Wavelength = 680 | 700 | 'both';

interface PhotosynthesisLightReactionLabProps {
  topic: any;
  onExit: () => void;
}

/* ─────────────────────────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────────────────────── */
const PhotosynthesisLightReactionLab: React.FC<PhotosynthesisLightReactionLabProps> = ({ topic, onExit }) => {
  const [wavelength, setWavelength] = useState<Wavelength>(680);
  const [intensity, setIntensity] = useState(60);
  const [cf0Open, setCf0Open] = useState(false);
  const [adpQueue, setAdpQueue] = useState(3);          // how many ADP+Pi units available
  const [lumenProtons, setLumenProtons] = useState(0);  // 0–20
  const [atpCount, setAtpCount] = useState(0);
  const [nadphCount, setNadphCount] = useState(0);
  const [oxygenCount, setOxygenCount] = useState(0);
  const [cyclicMode, setCyclicMode] = useState(false);
  const [makeAttempted, setMakeAttempted] = useState(false); // gate-closed failure flash
  const [lightOn, setLightOn] = useState(false);

  const ps2Active = wavelength === 680 || wavelength === 'both';
  const ps1Active = wavelength === 700 || wavelength === 'both' || cyclicMode;
  const pH = Math.max(4.0, 7.0 - lumenProtons * 0.15);

  // ── Auto-accumulate H+ while light is on ──────────────────
  const accumIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (lightOn) {
      accumIntervalRef.current = setInterval(() => {
        const rate = Math.round(intensity / 25) + (ps2Active ? 1 : 0);
        setLumenProtons(p => Math.min(20, p + rate));
        if (ps2Active) {
          setOxygenCount(o => Math.min(8, o + 1));
          if (!cyclicMode) setNadphCount(n => Math.min(8, n + (ps1Active ? 1 : 0)));
        }
      }, 900);
    } else {
      if (accumIntervalRef.current) clearInterval(accumIntervalRef.current);
    }
    return () => { if (accumIntervalRef.current) clearInterval(accumIntervalRef.current); };
  }, [lightOn, intensity, ps2Active, ps1Active, cyclicMode]);

  // ── Progressive ATP production when gate open ────────────
  const atpIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (cf0Open && lumenProtons > 0 && adpQueue > 0) {
      atpIntervalRef.current = setInterval(() => {
        setLumenProtons(p => {
          if (p <= 0) return 0;
          return p - 1;
        });
        setAtpCount(a => a + 1);
        setAdpQueue(q => Math.max(0, q - 1));
      }, 600);
    } else {
      if (atpIntervalRef.current) clearInterval(atpIntervalRef.current);
    }
    return () => { if (atpIntervalRef.current) clearInterval(atpIntervalRef.current); };
  }, [cf0Open, lumenProtons, adpQueue]);

  // Flash for 1.5s then clear
  useEffect(() => {
    if (makeAttempted) {
      const t = setTimeout(() => setMakeAttempted(false), 1500);
      return () => clearTimeout(t);
    }
  }, [makeAttempted]);

  const handleMakeAtp = useCallback(() => {
    if (!cf0Open) { setMakeAttempted(true); return; }
    // gate already open — synthesis handled by interval
  }, [cf0Open]);

  const resetLab = useCallback(() => {
    setWavelength(680); setIntensity(60); setCf0Open(false);
    setAdpQueue(3); setLumenProtons(0); setAtpCount(0);
    setNadphCount(0); setOxygenCount(0); setCyclicMode(false);
    setMakeAttempted(false); setLightOn(false);
  }, []);

  const observation = useMemo(() => {
    if (makeAttempted) return '❌ Gate closed — protons cannot flow. No ATP without gradient breakdown. Open the CF₀ gate first!';
    if (cf0Open && lumenProtons === 0) return 'Gate is open but lumen is empty. Shine light first to build up the H⁺ gradient.';
    if (cf0Open && adpQueue === 0) return 'Protons are flowing but ADP + Pᵢ has run out. Add more ADP + Pᵢ to continue ATP synthesis.';
    if (cf0Open && lumenProtons > 0) return `✅ CF₀ open! H⁺ flows down gradient → CF₁ rotates → ATP forms. Lumen pH rising back toward neutral. (${atpCount} ATP made so far)`;
    if (ps2Active && !lightOn) return 'Wavelength 680 nm selected (P680, PS II). Press "Shine Light" to start water splitting and electron flow.';
    if (ps2Active && lightOn) return `P680 excited! Water splits at OEC: 2H₂O → 4H⁺ + O₂ + 4e⁻. Electrons travel Z-scheme: PS II → PQ → Cyt b₆f → PC → PS I. H⁺ pumped into lumen by Cyt b₆f. Lumen pH: ${pH.toFixed(1)}`;
    if (cyclicMode) return 'Cyclic electron flow: PS I → Fd → PQ → Cyt b₆f → PC → PS I. H⁺ pumped, ATP made. No O₂ or NADPH produced.';
    if (ps1Active && !ps2Active) return 'P700 (PS I) active. Needs electrons supplied from PS II first (non-cyclic). Switch to 680 nm or enable Cyclic mode.';
    return 'Select wavelength and shine light to begin. 680 nm activates PS II; 700 nm activates PS I.';
  }, [makeAttempted, cf0Open, lumenProtons, adpQueue, atpCount, ps2Active, ps1Active, lightOn, cyclicMode, pH]);

  /* ── SIMULATION PANEL — full canvas, no scroll, no side cards ── */
  const simulationCombo = (
    <div className="w-full h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Thin header strip */}
      <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1 shrink-0">
        <div>
          <div className="text-sm font-bold text-slate-900">Thylakoid Membrane — Light Reactions</div>
          <div className="text-[11px] text-slate-500">PS II · Z-scheme · Chemiosmosis · ATP Synthase</div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold text-white shrink-0 ${lightOn ? 'bg-amber-500' : 'bg-slate-400'}`}>
          {lightOn ? `Light ON · ${wavelength === 'both' ? '680+700' : wavelength} nm` : 'Light OFF'}
        </span>
      </div>

      {/* SVG takes all remaining height */}
      <div className="flex-1 min-h-0 px-2 pb-1">
        <LightReactionSVG
          wavelength={wavelength}
          intensity={intensity}
          cf0Open={cf0Open}
          lumenProtons={lumenProtons}
          atpCount={atpCount}
          oxygenCount={oxygenCount}
          nadphCount={nadphCount}
          cyclicMode={cyclicMode}
          lightOn={lightOn}
          makeAttempted={makeAttempted}
          ps2Active={ps2Active}
          ps1Active={ps1Active}
          pH={pH}
        />
      </div>

      {/* Metric strip pinned at bottom */}
      <div className="grid grid-cols-4 gap-2 px-3 pb-2 shrink-0">
        <MetricCard label="Lumen pH" value={pH.toFixed(1)} tone={pH <= 5 ? 'text-red-700' : 'text-emerald-700'} />
        <MetricCard label="H⁺ in Lumen" value={`${lumenProtons}/20`} tone="text-amber-700" />
        <MetricCard label="ATP Made" value={`${atpCount}`} tone="text-indigo-700" />
        <MetricCard label="NADPH" value={`${cyclicMode ? 0 : nadphCount}`} tone="text-sky-700" />
      </div>
    </div>
  );

  /* ── CONTROLS PANEL — compact with scroll ── */
  const controlsCombo = (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full overflow-y-auto max-h-[34vh]">
      <div className="p-3 flex flex-col gap-3">

        {/* Goal banner */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
          <strong>Goal:</strong> Build a proton gradient by shining light → open CF₀ gate → watch CF₁ spin and make ATP.
        </div>

        {/* Controls row 1: wavelength + intensity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Wavelength</div>
            <div className="grid grid-cols-3 gap-1">
              {([680, 700, 'both'] as Wavelength[]).map(w => (
                <button key={String(w)} onClick={() => setWavelength(w)}
                  className={`rounded-lg border px-1 py-2 text-[10px] font-bold transition-all ${wavelength === w
                    ? (w === 680 ? 'bg-orange-500 text-white border-orange-500' : w === 700 ? 'bg-red-700 text-white border-red-700' : 'bg-purple-600 text-white border-purple-600')
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                  {w === 680 ? 'P680' : w === 700 ? 'P700' : 'Both'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Intensity</span>
              <span className="text-[10px] font-bold text-amber-700">{intensity}%</span>
            </div>
            <input type="range" min="10" max="100" value={intensity}
              onChange={e => setIntensity(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500" />
            <div className="flex justify-between text-[9px] font-bold text-slate-400">
              <span>Dim</span><span>Bright</span>
            </div>
          </div>
        </div>

        {/* Controls row 2: action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setLightOn(v => !v)}
            className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1 ${lightOn ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-50'}`}>
            <Sun size={13} /> {lightOn ? 'ON' : 'Light'}
          </button>
          <button onClick={() => setCf0Open(v => !v)}
            className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1 ${cf0Open ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}>
            <Droplets size={13} /> CF₀ {cf0Open ? '✓' : '✗'}
          </button>
          <button onClick={handleMakeAtp}
            className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1 ${makeAttempted ? 'bg-red-100 text-red-700 border-red-400' : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'}`}>
            <Zap size={13} /> ATP
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setAdpQueue(q => Math.min(10, q + 3))}
            className="rounded-lg border border-sky-300 bg-sky-50 px-2 py-2 text-xs font-bold text-sky-900 hover:bg-sky-100 transition-colors flex items-center justify-center gap-1">
            <Leaf size={13} /> ADP ({adpQueue})
          </button>
          <button onClick={() => setCyclicMode(v => !v)}
            className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1 ${cyclicMode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'}`}>
            ↻ Cyclic {cyclicMode ? 'ON' : 'OFF'}
          </button>
          <button onClick={resetLab}
            className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1">
            <RefreshCcw size={13} /> Reset
          </button>
        </div>

        {/* Live observation */}
        <InfoCard title="Live Observation" icon={<Activity size={14} className="text-emerald-600" />}>
          <p className={`text-xs ${makeAttempted ? 'text-red-700 font-bold' : ''}`}>{observation}</p>
        </InfoCard>

        {/* Step guide */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <div className="text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-widest">Steps</div>
          <ol className="text-[10px] text-slate-600 space-y-0.5 list-decimal list-inside">
            <li>Select <strong>P680</strong> and press <strong>Light</strong>. Watch H₂O split, H⁺ fill lumen.</li>
            <li>Watch <strong>pH meter</strong> drop from 7.0 → 4.0.</li>
            <li>Click <strong>ATP</strong> with CF₀ closed — see failure message!</li>
            <li>Open <strong>CF₀</strong> — protons rush through, CF₁ spins, ATP forms.</li>
            <li>Add <strong>ADP</strong> — watch pH recover toward 7.</li>
            <li>Try <strong>Cyclic</strong> flow — ATP without O₂ or NADPH.</li>
          </ol>
        </div>

        {/* Info cards */}
        <InfoCard title="NCERT Key Principle" icon={<Zap size={14} className="text-amber-600" />}>
          <p className="text-xs">Light drives electron flow → H⁺ gradient in lumen → CF₁ rotation → ATP. Light does NOT make ATP directly.</p>
        </InfoCard>
        <InfoCard title="Dam Analogy" icon={<Gauge size={14} className="text-sky-600" />}>
          <p className="text-xs">Lumen = dam. H⁺ = stored water. CF₀ = gate. CF₁ = turbine → ATP.</p>
        </InfoCard>
        <InfoCard title="Products Summary" icon={<Leaf size={14} className="text-lime-600" />}>
          <ul className="text-xs list-disc list-inside space-y-0.5">
            <li><strong>O₂</strong> — H₂O photolysis at OEC (PS II)</li>
            <li><strong>ATP</strong> — chemiosmosis via CF₁</li>
            <li><strong>NADPH</strong> — non-cyclic only (PS I → Fd → reductase)</li>
          </ul>
        </InfoCard>
      </div>
    </div>
  );

  return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsCombo} />;
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN SVG   880 × 500
   Band 1:  y   0– 42   Dark header
   Band 2:  y  42– 98   Sun + photon sources (stroma top)
   Band 3:  y  98– 198  Stroma compartment (light blue)
   Band 4:  y 198– 282  Thylakoid membrane (lipid bilayer with complexes)
   Band 5:  y 282– 430  Lumen compartment (amber)
   Band 6:  y 430– 500  Output meters
═══════════════════════════════════════════════════════════════════════ */
const LightReactionSVG = ({
  wavelength, intensity, cf0Open, lumenProtons, atpCount,
  oxygenCount, nadphCount, cyclicMode, lightOn, makeAttempted,
  ps2Active, ps1Active, pH,
}: {
  wavelength: Wavelength; intensity: number; cf0Open: boolean;
  lumenProtons: number; atpCount: number; oxygenCount: number;
  nadphCount: number; cyclicMode: boolean; lightOn: boolean;
  makeAttempted: boolean; ps2Active: boolean; ps1Active: boolean; pH: number;
}) => {
  const photonCount = Math.max(2, Math.round(intensity / 18));
  const protonCount = Math.min(lumenProtons, 18);
  const flowing = cf0Open && lumenProtons > 0;
  // Speeds (lower = faster animation)
  const photonDur = intensity > 70 ? 0.9 : intensity > 40 ? 1.4 : 2.0;
  const electronDur = 2.2;
  const cf1SpinDur = flowing ? Math.max(0.8, 3 - lumenProtons * 0.1) : 999;

  return (
    <svg viewBox="0 0 880 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet"
      aria-label="Thylakoid light reaction simulation">

      {/* ── DEFS ── */}
      <defs>
        <marker id="lrArrG" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#15803d" />
        </marker>
        <marker id="lrArrB" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#2563eb" />
        </marker>
        <marker id="lrArrO" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#d97706" />
        </marker>
        <filter id="lrGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="lrSoftGlow">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Z-scheme master path: H2O(OEC) → PS II → PQ → Cyt b6f → PC → PS I → Fd → NADP-R */}
        <path id="zSchemePath"
          d="M 178 270 L 178 240 L 178 210 C 178 195 210 188 248 188 C 286 188 310 178 348 170 C 386 162 420 158 450 158 C 480 158 520 168 548 178 C 576 188 600 196 628 196 C 656 196 680 188 710 168 C 740 148 760 138 790 130 C 810 125 830 122 850 118"
          fill="none" stroke="none" />
        {/* Cyclic path: PS I → Fd → PQ → Cyt b6f → PC → PS I */}
        <path id="cyclicPath"
          d="M 790 130 C 810 115 830 108 845 105 C 860 102 865 110 855 130 C 840 158 800 170 750 175 C 700 180 640 185 600 192 C 560 200 530 208 500 215 C 470 222 448 228 440 240 C 432 252 445 265 465 268 C 490 272 530 265 570 255 C 610 245 660 230 710 215 C 740 205 770 195 790 185 C 810 175 820 160 810 148 C 800 136 790 130 790 130"
          fill="none" stroke="none" />
      </defs>

      {/* ════════ BAND 1 – HEADER ════════ */}
      <rect width="880" height="42" rx="14" fill="#0f4c2a" />
      <rect y="28" width="880" height="14" fill="#0f4c2a" />
      <text x="440" y="27" textAnchor="middle" fontSize="16" fontWeight="900" fill="#ffffff" letterSpacing="0.4">
        Light Reactions in Thylakoid Membrane — Z-Scheme &amp; Chemiosmosis
      </text>

      {/* ════════ BAND 3 – STROMA (y 42–198) ════════ */}
      <rect x="0" y="42" width="880" height="156" fill="#dbeafe" opacity="0.55" />
      <rect x="0" y="42" width="880" height="156" fill="none" />
      <text x="12" y="62" fontSize="13" fontWeight="900" fill="#1e3a8a">STROMA</text>
      <text x="12" y="76" fontSize="9" fontWeight="700" fill="#3b82f6">(low H⁺ · high pH)</text>

      {/* ════════ BAND 4 – THYLAKOID MEMBRANE (y 198–282) ════════ */}
      {/* Lipid bilayer */}
      <rect x="0" y="198" width="880" height="84" fill="#86efac" stroke="#15803d" strokeWidth="2" />
      {/* Outer leaflet */}
      <rect x="0" y="198" width="880" height="16" fill="#bbf7d0" opacity="0.9" />
      {/* Inner leaflet */}
      <rect x="0" y="268" width="880" height="14" fill="#bbf7d0" opacity="0.9" />
      <text x="12" y="243" fontSize="11" fontWeight="900" fill="#166534">THYLAKOID MEMBRANE</text>

      {/* ════════ BAND 5 – LUMEN (y 282–430) ════════ */}
      <rect x="0" y="282" width="880" height="148" fill="#fef3c7" opacity="0.85" />
      <text x="12" y="302" fontSize="13" fontWeight="900" fill="#92400e">LUMEN</text>
      <text x="12" y="316" fontSize="9" fontWeight="700" fill="#b45309">(high H⁺ · low pH)</text>

      {/* ════════ EMBEDDED COMPLEXES IN MEMBRANE ════════ */}
      {/* --- PS II (x=120-220) --- */}
      <PSIIComplex x={120} y={198} ps2Active={ps2Active} lightOn={lightOn} />

      {/* --- PQ mobile carrier (x=248 in membrane) --- */}
      <PQCarrier x={295} y={222} active={ps2Active && lightOn} electronDur={electronDur} />

      {/* --- Cyt b6f (x=360-440) --- */}
      <CytB6fComplex x={368} y={198} active={ps2Active && lightOn} electronDur={electronDur} />

      {/* --- PC mobile carrier --- */}
      <PCCarrier x={488} y={268} active={(ps2Active || cyclicMode) && lightOn} electronDur={electronDur} />

      {/* --- PS I (x=540-640) --- */}
      <PSIComplex x={548} y={198} ps1Active={ps1Active} lightOn={lightOn} />

      {/* --- Fd in stroma --- */}
      <FerredoxinNode x={670} y={148} active={ps1Active && lightOn && !cyclicMode} />

      {/* --- NADP+ reductase --- */}
      {!cyclicMode && <NadpReductase x={740} y={100} active={ps1Active && lightOn} nadphCount={nadphCount} />}

      {/* --- ATP Synthase (CF0+CF1) --- */}
      <AtpSynthaseComplex x={818} y={198} cf0Open={cf0Open} flowing={flowing} cf1SpinDur={cf1SpinDur} atpCount={atpCount} adpPresent={true} />

      {/* ════════ Z-SCHEME ELECTRON PATH ════════ */}
      {/* Base path line (always visible as guide) */}
      <path d="M 178 255 C 178 230 200 210 248 205 C 310 198 360 178 420 165 C 480 152 520 158 560 168 C 600 178 640 192 680 170 C 720 148 760 134 800 122"
        fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.35" markerEnd="url(#lrArrB)" />

      {/* Electron sparks along the Z-path */}
      {(ps2Active && lightOn) && Array.from({ length: Math.min(photonCount + 1, 5) }).map((_, i) => (
        <React.Fragment key={`e-${i}`}>
          <circle r="7" fill="#93c5fd" stroke="#2563eb" strokeWidth="2" filter="url(#lrGlow)" opacity="0.95">
            <animateMotion dur={`${electronDur + i * 0.35}s`} begin={`${i * 0.55}s`} repeatCount="indefinite">
              <mpath href="#zSchemePath" />
            </animateMotion>
          </circle>
          <text fontSize="7" fontWeight="900" fill="#1e3a8a" textAnchor="middle" dy="2.5">
            e⁻
            <animateMotion dur={`${electronDur + i * 0.35}s`} begin={`${i * 0.55}s`} repeatCount="indefinite">
              <mpath href="#zSchemePath" />
            </animateMotion>
          </text>
        </React.Fragment>
      ))}

      {/* Cyclic electron loop */}
      {cyclicMode && lightOn && Array.from({ length: 3 }).map((_, i) => (
        <React.Fragment key={`ce-${i}`}>
          <circle r="6" fill="#c084fc" stroke="#7c3aed" strokeWidth="2" filter="url(#lrGlow)" opacity="0.9">
            <animateMotion dur={`${3.2 + i * 0.4}s`} begin={`${i * 0.9}s`} repeatCount="indefinite">
              <mpath href="#cyclicPath" />
            </animateMotion>
          </circle>
        </React.Fragment>
      ))}

      {/* ════════ PHOTON BEAMS ════════ */}
      {/* Sun */}
      <SunIcon x={28} y={52} lightOn={lightOn} />

      {/* PS II photon beams */}
      {(ps2Active && lightOn) && Array.from({ length: photonCount }).map((_, i) => (
        <React.Fragment key={`ph2-${i}`}>
          <PhotonBeam
            x1={80 + i * 22} y1={58}
            x2={145 + (i % 3) * 18} y2={198}
            color={wavelength === 680 ? '#f97316' : '#fb923c'}
            dur={photonDur + i * 0.18}
            begin={i * (photonDur / photonCount)}
          />
        </React.Fragment>
      ))}

      {/* PS I photon beams */}
      {(ps1Active && lightOn) && Array.from({ length: Math.max(1, photonCount - 1) }).map((_, i) => (
        <React.Fragment key={`ph1-${i}`}>
          <PhotonBeam
            x1={560 + i * 22} y1={58}
            x2={575 + (i % 3) * 18} y2={198}
            color="#dc2626"
            dur={photonDur + i * 0.2}
            begin={i * (photonDur / photonCount) + 0.3}
          />
        </React.Fragment>
      ))}

      {/* ════════ WATER SPLITTING / O2 BUBBLES ════════ */}
      {ps2Active && lightOn && (
        <WaterSplitter x={168} y={335} oxygenCount={oxygenCount} />
      )}

      {/* ════════ H+ PROTON POOL IN LUMEN ════════ */}
      <ProtonPool lumenProtons={protonCount} flowing={flowing} />

      {/* ════════ PROTON FLOW THROUGH CF0 ════════ */}
      {flowing && Array.from({ length: 4 }).map((_, i) => (
        <React.Fragment key={`pf-${i}`}>
          <circle r="7" fill="#fbbf24" stroke="#92400e" strokeWidth="2" filter="url(#lrGlow)">
            <animateMotion dur={`${0.9 + i * 0.2}s`} begin={`${i * 0.22}s`} repeatCount="indefinite"
              path="M 826 380 C 826 350 826 320 826 290 C 826 270 826 250 826 230" />
          </circle>
          <text fontSize="6" fontWeight="900" fill="#92400e" textAnchor="middle" dy="2.5">
            H⁺
            <animateMotion dur={`${0.9 + i * 0.2}s`} begin={`${i * 0.22}s`} repeatCount="indefinite"
              path="M 826 380 C 826 350 826 320 826 290 C 826 270 826 250 826 230" />
          </text>
        </React.Fragment>
      ))}

      {/* ════════ BAND 2 – LABELS IN STROMA ════════ */}
      {/* Light wavelength chip */}
      <rect x="220" y="48" width="130" height="22" rx="8" fill="white" stroke="#d97706" strokeWidth="1.5" />
      <text x="285" y="63" textAnchor="middle" fontSize="10" fontWeight="800" fill="#92400e">
        {wavelength === 'both' ? '680 + 700 nm' : `${wavelength} nm light`}
      </text>

      {/* Cyclic mode label */}
      {cyclicMode && (
        <g>
          <rect x="370" y="48" width="130" height="22" rx="8" fill="#f3e8ff" stroke="#7c3aed" strokeWidth="1.5" />
          <text x="435" y="63" textAnchor="middle" fontSize="10" fontWeight="800" fill="#7c3aed">↻ Cyclic Flow ON</text>
        </g>
      )}

      {/* ════════ pH METER (embedded in lumen) ════════ */}
      <EmbeddedPHMeter x={14} y={370} pH={pH} />

      {/* ════════ MAKE ATP FAILURE FLASH ════════ */}
      {makeAttempted && (
        <g>
          <rect x="220" y="148" width="300" height="36" rx="12" fill="#fee2e2" stroke="#ef4444" strokeWidth="2.5">
            <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="3" />
          </rect>
          <text x="370" y="170" textAnchor="middle" fontSize="12" fontWeight="900" fill="#991b1b">
            ❌ Gate closed — no H⁺ flow — no ATP!
            <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="3" />
          </text>
        </g>
      )}

      {/* ════════ BAND 6 – OUTPUT METERS (y 430–500) ════════ */}
      <rect x="0" y="430" width="880" height="70" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />

      {/* O2 meter */}
      <text x="20" y="450" fontSize="10" fontWeight="900" fill="#0369a1">O₂ released</text>
      <rect x="20" y="454" width="160" height="14" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.5" />
      <rect x="22" y="456" width={Math.max(0, (oxygenCount / 8) * 156)} height="10" rx="5" fill="#38bdf8">
        <animate attributeName="width" values={`${Math.max(0, (oxygenCount / 8) * 156)};${Math.max(4, (oxygenCount / 8) * 156 + 4)};${Math.max(0, (oxygenCount / 8) * 156)}`} dur="1.6s" repeatCount="indefinite" />
      </rect>
      <text x="185" y="464" fontSize="9" fontWeight="800" fill="#0369a1">{oxygenCount} O₂</text>

      {/* H+ meter */}
      <text x="220" y="450" fontSize="10" fontWeight="900" fill="#b45309">H⁺ in Lumen</text>
      <rect x="220" y="454" width="160" height="14" rx="6" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1.5" />
      <rect x="222" y="456" width={Math.max(0, (lumenProtons / 20) * 156)} height="10" rx="5" fill="#f59e0b">
        <animate attributeName="opacity" values="1;0.7;1" dur="1.2s" repeatCount="indefinite" />
      </rect>
      <text x="385" y="464" fontSize="9" fontWeight="800" fill="#b45309">{lumenProtons}/20</text>

      {/* ATP meter */}
      <text x="420" y="450" fontSize="10" fontWeight="900" fill="#4c1d95">ATP synthesized</text>
      <rect x="420" y="454" width="160" height="14" rx="6" fill="#ede9fe" stroke="#a78bfa" strokeWidth="1.5" />
      <rect x="422" y="456" width={Math.min(156, atpCount * 14)} height="10" rx="5" fill="#8b5cf6">
        <animate attributeName="width" values={`${Math.min(156, atpCount * 14)};${Math.min(160, atpCount * 14 + 4)};${Math.min(156, atpCount * 14)}`} dur="1.8s" repeatCount="indefinite" />
      </rect>
      <text x="585" y="464" fontSize="9" fontWeight="800" fill="#4c1d95">{atpCount} ATP</text>

      {/* NADPH meter */}
      <text x="620" y="450" fontSize="10" fontWeight="900" fill="#0369a1">NADPH</text>
      <rect x="620" y="454" width="160" height="14" rx="6" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
      <rect x="622" y="456" width={Math.min(156, (cyclicMode ? 0 : nadphCount) * 18)} height="10" rx="5" fill="#3b82f6">
        <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
      </rect>
      <text x="785" y="464" fontSize="9" fontWeight="800" fill="#0369a1">{cyclicMode ? 0 : nadphCount} NADPH</text>

      {/* pH readout */}
      <text x="20" y="488" fontSize="10" fontWeight="900" fill={pH <= 5 ? '#dc2626' : '#166534'}>
        Lumen pH: {pH.toFixed(1)}  {pH <= 5 ? '⚠ Very acidic — gradient built!' : pH >= 6.5 ? '✓ Neutral — gradient discharged' : 'pH dropping...'}
      </text>
      <text x="440" y="488" fontSize="10" fontWeight="900" fill="#64748b">
        {cf0Open ? '✓ CF₀ open — H⁺ flowing through ATP synthase' : '✗ CF₀ closed — H⁺ cannot flow'}
      </text>
    </svg>
  );
};

/* ══════════════════════════════════════════════════════
   PS II COMPLEX  (embedded in membrane, with OEC below)
══════════════════════════════════════════════════════ */
const PSIIComplex = ({ x, y, ps2Active, lightOn }: { x: number; y: number; ps2Active: boolean; lightOn: boolean }) => {
  const active = ps2Active && lightOn;
  return (
    <g>
      {/* Main body in membrane */}
      <rect x={x} y={y} width="100" height="84" rx="14" fill={active ? '#fef3c7' : '#dcfce7'} stroke={active ? '#f59e0b' : '#16a34a'} strokeWidth="2.5" />
      <text x={x + 50} y={y + 20} textAnchor="middle" fontSize="11" fontWeight="900" fill="#166534">PS II</text>
      {/* P680 reaction center */}
      <circle cx={x + 50} cy={y + 44} r="18" fill={active ? '#fde68a' : '#bbf7d0'} stroke={active ? '#f59e0b' : '#22c55e'} strokeWidth="2">
        {active && <animate attributeName="r" values="18;21;18" dur="0.8s" repeatCount="indefinite" />}
      </circle>
      <text x={x + 50} y={y + 48} textAnchor="middle" fontSize="10" fontWeight="900" fill="#14532d">P680</text>
      {/* Glow when active */}
      {active && <circle cx={x + 50} cy={y + 44} r="22" fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.4">
        <animate attributeName="r" values="22;28;22" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.8s" repeatCount="indefinite" />
      </circle>}
      {/* OEC on lumen side */}
      <rect x={x + 20} y={y + 84} width="60" height="28" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" />
      <text x={x + 50} y={y + 97} textAnchor="middle" fontSize="9" fontWeight="900" fill="#1e3a8a">OEC</text>
      <text x={x + 50} y={y + 108} textAnchor="middle" fontSize="7" fontWeight="700" fill="#2563eb">(Mn cluster)</text>
      {/* Label below */}
      <text x={x + 50} y={y + 75} textAnchor="middle" fontSize="8" fontWeight="800" fill="#166534">P680→e⁻+H⁺</text>
    </g>
  );
};

/* ══════════════════════════════════════════════════════
   PQ MOBILE CARRIER
══════════════════════════════════════════════════════ */
const PQCarrier = ({ x, y, active, electronDur }: { x: number; y: number; active: boolean; electronDur: number }) => (
  <g>
    <ellipse cx={x} cy={y} rx="22" ry="14" fill={active ? '#fef08a' : '#e2e8f0'} stroke={active ? '#ca8a04' : '#94a3b8'} strokeWidth="2">
      {active && <animate attributeName="cx" values={`${x};${x + 30};${x}`} dur={`${electronDur * 0.9}s`} repeatCount="indefinite" />}
    </ellipse>
    <text x={x} y={y + 4} textAnchor="middle" fontSize="8" fontWeight="900" fill="#78350f">PQ</text>
    {active && <text x={x} y={y + 4} textAnchor="middle" fontSize="8" fontWeight="900" fill="#78350f">
      <animate attributeName="x" values={`${x};${x + 30};${x}`} dur={`${electronDur * 0.9}s`} repeatCount="indefinite" />
      PQ
    </text>}
  </g>
);

/* ══════════════════════════════════════════════════════
   CYT B6F COMPLEX  (the H+ pump)
══════════════════════════════════════════════════════ */
const CytB6fComplex = ({ x, y, active, electronDur }: { x: number; y: number; active: boolean; electronDur: number }) => (
  <g>
    <rect x={x} y={y} width="90" height="84" rx="12" fill={active ? '#fef9c3' : '#dcfce7'} stroke={active ? '#ca8a04' : '#16a34a'} strokeWidth="2.5" />
    <text x={x + 45} y={y + 18} textAnchor="middle" fontSize="10" fontWeight="900" fill="#166534">Cyt b₆f</text>
    <text x={x + 45} y={y + 32} textAnchor="middle" fontSize="8" fontWeight="800" fill="#b45309">H⁺ PUMP</text>
    {/* pump arrow */}
    <path d={`M ${x + 45} ${y + 78} L ${x + 45} ${y + 50}`} fill="none" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#lrArrO)" />
    {/* animated H+ being pumped */}
    {active && (
      <circle r="6" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5">
        <animateMotion dur={`${electronDur * 0.7}s`} begin="0s" repeatCount="indefinite"
          path={`M ${x + 45} ${y + 78} C ${x + 45} ${y + 60} ${x + 45} ${y + 48} ${x + 45} ${y + 40}`} />
      </circle>
    )}
    <text x={x + 45} y={y + 75} textAnchor="middle" fontSize="8" fontWeight="700" fill="#1a7a3a">stroma→lumen</text>
  </g>
);

/* ══════════════════════════════════════════════════════
   PC MOBILE CARRIER
══════════════════════════════════════════════════════ */
const PCCarrier = ({ x, y, active, electronDur }: { x: number; y: number; active: boolean; electronDur: number }) => (
  <g>
    <ellipse cx={x} cy={y} rx="20" ry="12" fill={active ? '#bfdbfe' : '#e2e8f0'} stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="1.5">
      {active && <animate attributeName="cx" values={`${x};${x + 40};${x}`} dur={`${electronDur * 0.8}s`} repeatCount="indefinite" />}
    </ellipse>
    <text x={x} y={y + 4} textAnchor="middle" fontSize="8" fontWeight="900" fill="#1e3a8a">PC</text>
  </g>
);

/* ══════════════════════════════════════════════════════
   PS I COMPLEX
══════════════════════════════════════════════════════ */
const PSIComplex = ({ x, y, ps1Active, lightOn }: { x: number; y: number; ps1Active: boolean; lightOn: boolean }) => {
  const active = ps1Active && lightOn;
  return (
    <g>
      <rect x={x} y={y} width="100" height="84" rx="14" fill={active ? '#fdf4ff' : '#dcfce7'} stroke={active ? '#a855f7' : '#16a34a'} strokeWidth="2.5" />
      <text x={x + 50} y={y + 20} textAnchor="middle" fontSize="11" fontWeight="900" fill="#166534">PS I</text>
      <circle cx={x + 50} cy={y + 44} r="18" fill={active ? '#e9d5ff' : '#bbf7d0'} stroke={active ? '#a855f7' : '#22c55e'} strokeWidth="2">
        {active && <animate attributeName="r" values="18;21;18" dur="1.0s" repeatCount="indefinite" />}
      </circle>
      <text x={x + 50} y={y + 48} textAnchor="middle" fontSize="10" fontWeight="900" fill="#14532d">P700</text>
      {active && <circle cx={x + 50} cy={y + 44} r="22" fill="none" stroke="#a855f7" strokeWidth="3" opacity="0.4">
        <animate attributeName="r" values="22;28;22" dur="1.0s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.0s" repeatCount="indefinite" />
      </circle>}
      <text x={x + 50} y={y + 75} textAnchor="middle" fontSize="8" fontWeight="800" fill="#166534">P700→Fd</text>
    </g>
  );
};

/* ══════════════════════════════════════════════════════
   FERREDOXIN
══════════════════════════════════════════════════════ */
const FerredoxinNode = ({ x, y, active }: { x: number; y: number; active: boolean }) => (
  <g>
    <ellipse cx={x} cy={y} rx="26" ry="18" fill={active ? '#dbeafe' : '#f1f5f9'} stroke={active ? '#2563eb' : '#94a3b8'} strokeWidth="2">
      {active && <animate attributeName="ry" values="18;22;18" dur="1.3s" repeatCount="indefinite" />}
    </ellipse>
    <text x={x} y={y - 4} textAnchor="middle" fontSize="9" fontWeight="900" fill="#1e3a8a">Fd</text>
    <text x={x} y={y + 8} textAnchor="middle" fontSize="7" fontWeight="700" fill="#2563eb">(Ferredoxin)</text>
    {active && <line x1={x} y1={y + 18} x2={x + 44} y2={y + 10} stroke="#2563eb" strokeWidth="2" strokeDasharray="3 2" markerEnd="url(#lrArrB)" />}
  </g>
);

/* ══════════════════════════════════════════════════════
   NADP+ REDUCTASE
══════════════════════════════════════════════════════ */
const NadpReductase = ({ x, y, active, nadphCount }: { x: number; y: number; active: boolean; nadphCount: number }) => (
  <g>
    <rect x={x} y={y} width="90" height="50" rx="10" fill={active ? '#d1fae5' : '#f1f5f9'} stroke={active ? '#059669' : '#94a3b8'} strokeWidth="2" />
    <text x={x + 45} y={y + 16} textAnchor="middle" fontSize="9" fontWeight="900" fill="#065f46">NADP⁺</text>
    <text x={x + 45} y={y + 28} textAnchor="middle" fontSize="9" fontWeight="900" fill="#065f46">reductase</text>
    {/* NADP+ → NADPH conversion indicator */}
    <rect x={x} y={y + 36} width={Math.min(88, nadphCount * 11)} height="10" rx="4" fill="#34d399">
      {active && <animate attributeName="width" values={`${Math.min(88, nadphCount * 11)};${Math.min(88, nadphCount * 11 + 6)};${Math.min(88, nadphCount * 11)}`} dur="1.8s" repeatCount="indefinite" />}
    </rect>
    <text x={x + 45} y={y + 44} textAnchor="middle" fontSize="7" fontWeight="800" fill="#065f46">{nadphCount} NADPH</text>
    {/* NADPH product label */}
    {active && <text x={x + 45} y={y - 6} textAnchor="middle" fontSize="8" fontWeight="800" fill="#059669">NADP⁺→NADPH+H⁺</text>}
  </g>
);

/* ══════════════════════════════════════════════════════
   ATP SYNTHASE  (CF0 in membrane + CF1 head in stroma)
══════════════════════════════════════════════════════ */
const AtpSynthaseComplex = ({ x, y, cf0Open, flowing, cf1SpinDur, atpCount, adpPresent }: {
  x: number; y: number; cf0Open: boolean; flowing: boolean; cf1SpinDur: number; atpCount: number; adpPresent: boolean;
}) => {
  const cx = x + 16; // center x of stalk
  // CF1 head center
  const cf1X = x + 16, cf1Y = y - 52;
  return (
    <g>
      {/* CF0 channel (in membrane) */}
      <rect x={x} y={y} width="32" height="84" rx="12" fill={cf0Open ? '#c4b5fd' : '#ddd6fe'} stroke="#6d28d9" strokeWidth="2.5" />
      <text x={cx} y={y + 28} textAnchor="middle" fontSize="9" fontWeight="900" fill="#4c1d95">CF₀</text>
      <text x={cx} y={y + 42} textAnchor="middle" fontSize="7" fontWeight="800" fill={cf0Open ? '#5b21b6' : '#7c3aed'}>{cf0Open ? 'OPEN' : 'closed'}</text>
      {/* Gate door visual */}
      <rect x={x + 4} y={y + 52} width="24" height="6" rx="2" fill={cf0Open ? '#a78bfa' : '#7c3aed'}>
        {cf0Open && <animate attributeName="y" values={`${y + 52};${y + 58};${y + 52}`} dur="1s" repeatCount="1" />}
      </rect>
      <text x={cx} y={y + 70} textAnchor="middle" fontSize="7" fontWeight="800" fill="#6d28d9">H⁺ channel</text>

      {/* CF0 label below */}
      <text x={cx} y={y + 94} textAnchor="middle" fontSize="9" fontWeight="900" fill="#4c1d95">ATP synthase</text>

      {/* Stalk */}
      <rect x={cx - 4} y={y - 36} width="8" height="36" rx="3" fill="#8b5cf6" />

      {/* CF1 head — rotating gear when flowing */}
      <g transform={`translate(${cf1X} ${cf1Y})`}>
        {/* Gear body */}
        <polygon
          points="-30,0 -24,-15 -10,-28 10,-28 24,-15 30,0 24,15 10,28 -10,28 -24,15"
          fill={flowing ? '#ede9fe' : '#f5f3ff'}
          stroke="#6d28d9" strokeWidth="2.5">
          {flowing && (
            <animateTransform attributeName="transform" type="rotate"
              from="0 0 0" to="360 0 0"
              dur={`${cf1SpinDur}s`} repeatCount="indefinite" />
          )}
        </polygon>
        {/* Inner hub */}
        <circle cx="0" cy="0" r="16" fill="white" stroke="#6d28d9" strokeWidth="2" />
        {/* Three beta subunit sites (T→L→O conformational change) */}
        {[0, 120, 240].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const bx = Math.cos(rad) * 10;
          const by = Math.sin(rad) * 10;
          const colors = ['#fbbf24', '#34d399', '#f87171'];
          const labels = ['T', 'L', 'O'];
          return (
            <g key={i}>
              <circle cx={bx} cy={by} r="5" fill={flowing ? colors[i] : '#e2e8f0'} stroke="#6d28d9" strokeWidth="1">
                {flowing && <animate attributeName="fill" values={`${colors[i]};${colors[(i + 1) % 3]};${colors[(i + 2) % 3]};${colors[i]}`}
                  dur={`${cf1SpinDur * 1}s`} repeatCount="indefinite" />}
              </circle>
              <text x={bx} y={by + 3} textAnchor="middle" fontSize="4" fontWeight="900" fill="#4c1d95">{labels[i]}</text>
            </g>
          );
        })}
        {/* CF1 label */}
        <text x="0" y="0" textAnchor="middle" fontSize="8" fontWeight="900" fill="#4c1d95" dy="3">CF₁</text>
      </g>

      {/* ADP + Pi token near CF1 head */}
      {adpPresent && (
        <g>
          <rect x={x + 36} y={cf1Y - 14} width="52" height="20" rx="8" fill="#ecfeff" stroke="#0891b2" strokeWidth="1.5" />
          <text x={x + 62} y={cf1Y - 1} textAnchor="middle" fontSize="8" fontWeight="900" fill="#155e75">ADP + Pᵢ</text>
        </g>
      )}

      {/* ATP product bubble */}
      {atpCount > 0 && (
        <g>
          <circle cx={x + 70} cy={cf1Y - 26} r="14" fill="#a7f3d0" stroke="#047857" strokeWidth="2">
            <animate attributeName="r" values="14;17;14" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.7;1" dur="1.4s" repeatCount="indefinite" />
          </circle>
          <text x={x + 70} y={cf1Y - 22} textAnchor="middle" fontSize="9" fontWeight="900" fill="#064e3b">ATP</text>
          <text x={x + 70} y={cf1Y - 12} textAnchor="middle" fontSize="8" fontWeight="700" fill="#065f46">×{Math.min(atpCount, 99)}</text>
        </g>
      )}
    </g>
  );
};

/* ══════════════════════════════════════════════════════
   PHOTON BEAM  (animated streak)
══════════════════════════════════════════════════════ */
const PhotonBeam = ({ x1, y1, x2, y2, color, dur, begin }: {
  x1: number; y1: number; x2: number; y2: number; color: string; dur: number; begin: number;
}) => (
  <g>
    <circle r="5" fill={color} opacity="0.95" filter="url(#lrSoftGlow)">
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite"
        path={`M ${x1} ${y1} L ${x2} ${y2}`} />
    </circle>
    {/* Trail */}
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" opacity="0.15" strokeDasharray="4 4" />
  </g>
);

/* ══════════════════════════════════════════════════════
   SUN ICON
══════════════════════════════════════════════════════ */
const SunIcon = ({ x, y, lightOn }: { x: number; y: number; lightOn: boolean }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="0" cy="0" r="22" fill={lightOn ? '#fde68a' : '#e2e8f0'} stroke={lightOn ? '#f59e0b' : '#94a3b8'} strokeWidth="2.5">
      {lightOn && <animate attributeName="r" values="22;26;22" dur="1.2s" repeatCount="indefinite" />}
    </circle>
    {lightOn && [0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      return (
        <line key={i}
          x1={Math.cos(rad) * 24} y1={Math.sin(rad) * 24}
          x2={Math.cos(rad) * 32} y2={Math.sin(rad) * 32}
          stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
          <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" begin={`${i * 0.15}s`} repeatCount="indefinite" />
        </line>
      );
    })}
    <text x="0" y="5" textAnchor="middle" fontSize="10" fontWeight="900" fill={lightOn ? '#92400e' : '#64748b'}>☀</text>
  </g>
);

/* ══════════════════════════════════════════════════════
   WATER SPLITTER / OEC
══════════════════════════════════════════════════════ */
const WaterSplitter = ({ x, y, oxygenCount }: { x: number; y: number; oxygenCount: number }) => (
  <g>
    {/* H2O molecules */}
    {[0, 1].map(i => (
      <g key={i}>
        <circle cx={x + i * 30} cy={y} r="14" fill="#bfdbfe" stroke="#2563eb" strokeWidth="2">
          <animate attributeName="r" values="14;11;14" dur={`${1.2 + i * 0.3}s`} begin={`${i * 0.5}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.6;1" dur={`${1.2 + i * 0.3}s`} begin={`${i * 0.5}s`} repeatCount="indefinite" />
        </circle>
        <text x={x + i * 30} y={y + 4} textAnchor="middle" fontSize="9" fontWeight="900" fill="#1e3a8a">H₂O</text>
      </g>
    ))}
    {/* Splitting arrow */}
    <text x={x + 70} y={y + 5} fontSize="14" fontWeight="900" fill="#2563eb">→</text>
    <text x={x + 90} y={y - 6} fontSize="9" fontWeight="800" fill="#b45309">4H⁺</text>
    <text x={x + 90} y={y + 6} fontSize="9" fontWeight="800" fill="#0369a1">+ O₂</text>
    <text x={x + 90} y={y + 16} fontSize="9" fontWeight="800" fill="#2563eb">+ 4e⁻</text>
    {/* O2 bubbles */}
    {Array.from({ length: Math.min(oxygenCount, 5) }).map((_, i) => (
      <React.Fragment key={`o2-${i}`}>
        <circle r="8" fill="#bfdbfe" stroke="#0369a1" strokeWidth="1.5" opacity="0.85">
          <animateMotion dur={`${1.4 + i * 0.2}s`} begin={`${i * 0.35}s`} repeatCount="indefinite"
            path={`M ${x + 152 + i * 16} ${y} C ${x + 148 + i * 16} ${y - 30} ${x + 145 + i * 16} ${y - 55} ${x + 142 + i * 16} ${y - 80}`} />
        </circle>
        <text fontSize="7" fontWeight="900" fill="#0369a1" textAnchor="middle" dy="2.5">
          O₂
          <animateMotion dur={`${1.4 + i * 0.2}s`} begin={`${i * 0.35}s`} repeatCount="indefinite"
            path={`M ${x + 152 + i * 16} ${y} C ${x + 148 + i * 16} ${y - 30} ${x + 145 + i * 16} ${y - 55} ${x + 142 + i * 16} ${y - 80}`} />
        </text>
      </React.Fragment>
    ))}
    {/* H+ ions moving toward lumen */}
    {[0, 1, 2].map(i => (
      <React.Fragment key={`wh-${i}`}>
        <circle r="6" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5">
          <animateMotion dur={`${0.9 + i * 0.25}s`} begin={`${i * 0.3}s`} repeatCount="indefinite"
            path={`M ${x + i * 22} ${y + 14} L ${x + i * 22 + 10} ${y + 50}`} />
        </circle>
        <text fontSize="6" fontWeight="900" fill="#92400e" textAnchor="middle" dy="2.5">
          H⁺
          <animateMotion dur={`${0.9 + i * 0.25}s`} begin={`${i * 0.3}s`} repeatCount="indefinite"
            path={`M ${x + i * 22} ${y + 14} L ${x + i * 22 + 10} ${y + 50}`} />
        </text>
      </React.Fragment>
    ))}
  </g>
);

/* ══════════════════════════════════════════════════════
   PROTON POOL  (Brownian H+ in lumen)
══════════════════════════════════════════════════════ */
const ProtonPool = ({ lumenProtons, flowing }: { lumenProtons: number; flowing: boolean }) => {
  const positions = useMemo(() => Array.from({ length: lumenProtons }, (_, i) => ({
    x: 350 + (i % 9) * 52,
    y: 318 + Math.floor(i / 9) * 36,
    dx: (Math.random() - 0.5) * 18,
    dy: (Math.random() - 0.5) * 12,
    dur: 0.8 + (i % 5) * 0.22,
  })), [lumenProtons]);

  return (
    <g>
      {positions.map((p, i) => (
        <React.Fragment key={`h-${i}`}>
          <circle cx={p.x} cy={p.y} r="10" fill="#fbbf24" stroke="#92400e" strokeWidth="1.5" filter="url(#lrGlow)" opacity="0.9">
            <animate attributeName="cx" values={`${p.x};${p.x + p.dx};${p.x - p.dx * 0.5};${p.x}`} dur={`${p.dur}s`} repeatCount="indefinite" />
            <animate attributeName="cy" values={`${p.y};${p.y + p.dy};${p.y - p.dy * 0.5};${p.y}`} dur={`${p.dur}s`} repeatCount="indefinite" />
            {flowing && <animate attributeName="opacity" values="0.9;0.5;0.9" dur="0.6s" repeatCount="indefinite" />}
          </circle>
          <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="8" fontWeight="900" fill="#78350f">
            H⁺
            <animate attributeName="x" values={`${p.x};${p.x + p.dx};${p.x - p.dx * 0.5};${p.x}`} dur={`${p.dur}s`} repeatCount="indefinite" />
            <animate attributeName="y" values={`${p.y + 4};${p.y + p.dy + 4};${p.y - p.dy * 0.5 + 4};${p.y + 4}`} dur={`${p.dur}s`} repeatCount="indefinite" />
          </text>
        </React.Fragment>
      ))}
    </g>
  );
};

/* ══════════════════════════════════════════════════════
   EMBEDDED pH METER  (digital LCD in lumen)
══════════════════════════════════════════════════════ */
const EmbeddedPHMeter = ({ x, y, pH }: { x: number; y: number; pH: number }) => {
  const critical = pH <= 5;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* LCD screen */}
      <rect x="0" y="0" width="120" height="52" rx="8" fill={critical ? '#1a0000' : '#001a00'} stroke={critical ? '#ef4444' : '#22c55e'} strokeWidth="2">
        {critical && <animate attributeName="stroke" values="#ef4444;#fca5a5;#ef4444" dur="0.8s" repeatCount="indefinite" />}
      </rect>
      <text x="8" y="14" fontSize="9" fontWeight="900" fill="#6ee7b7">pH METER (Lumen)</text>
      {/* Digital readout */}
      <text x="60" y="38" textAnchor="middle" fontSize="22" fontWeight="900"
        fill={critical ? '#ef4444' : '#4ade80'} fontFamily="monospace">
        {pH.toFixed(1)}
        {critical && <animate attributeName="fill" values="#ef4444;#fca5a5;#ef4444" dur="0.8s" repeatCount="indefinite" />}
      </text>
      {/* Status text */}
      <text x="60" y="50" textAnchor="middle" fontSize="7" fontWeight="800" fill={critical ? '#fca5a5' : '#86efac'}>
        {critical ? '▼ ACIDIC — gradient built!' : '● normal'}
      </text>
    </g>
  );
};

/* ══════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════ */
const MetricCard = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
    <div className={`mt-1 text-xs md:text-sm font-bold break-words ${tone}`}>{value}</div>
  </div>
);

const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-xs md:text-sm text-slate-600 leading-relaxed">
    <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">{icon}{title}</div>
    {children}
  </div>
);

export default PhotosynthesisLightReactionLab;
