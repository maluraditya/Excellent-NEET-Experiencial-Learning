import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Dna,
    Eye,
    EyeOff,
    Layers,
    Microscope,
    Pause,
    Play,
    RotateCcw,
    SkipForward,
    SkipBack,
    Shuffle,
    Sprout,
    Tag,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Mode = 'mitosis' | 'meiosis' | 'compare';
type Cytokinesis = 'animal' | 'plant';
type MeiosisStage = 'I' | 'interkinesis' | 'II';

interface Props {
    topic: any;
    onExit: () => void;
}

const MITOSIS_PHASES = ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'] as const;
const MEIOSIS_I_PHASES = ['Prophase I', 'Metaphase I', 'Anaphase I', 'Telophase I'] as const;
const MEIOSIS_II_PHASES = ['Prophase II', 'Metaphase II', 'Anaphase II', 'Telophase II'] as const;
const PROPHASE_I_SUBS = ['Leptotene', 'Zygotene', 'Pachytene', 'Diplotene', 'Diakinesis'] as const;

const PAIR_COLORS = [
    { mat: '#dc2626', pat: '#f87171' },
    { mat: '#2563eb', pat: '#60a5fa' },
    { mat: '#16a34a', pat: '#4ade80' },
    { mat: '#9333ea', pat: '#c084fc' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Root component
// ═══════════════════════════════════════════════════════════════════════════
const MitosisMeiosisStagesLab: React.FC<Props> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('mitosis');
    const [cytokinesis, setCytokinesis] = useState<Cytokinesis>('animal');
    const [pairs, setPairs] = useState<2 | 3 | 4>(2);
    const [mitosisPhase, setMitosisPhase] = useState(0);
    const [meiosisStage, setMeiosisStage] = useState<MeiosisStage>('I');
    const [meiosisIPhase, setMeiosisIPhase] = useState(0);
    const [meiosisIIPhase, setMeiosisIIPhase] = useState(0);
    const [prophaseISub, setProphaseISub] = useState(0);
    const [chiasmata, setChiasmata] = useState(1);
    const [assortSeed, setAssortSeed] = useState(0);
    const [showLabels, setShowLabels] = useState(true);
    const [showInterphase, setShowInterphase] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [progress, setProgress] = useState(0);

    const rafRef = useRef<number | null>(null);
    const lastTRef = useRef<number>(0);

    // Phase advancement
    const advance = useCallback(() => {
        if (mode === 'mitosis') {
            setMitosisPhase((p) => (p + 1) % 4);
        } else if (mode === 'meiosis') {
            if (meiosisStage === 'I') {
                if (meiosisIPhase === 0 && prophaseISub < 4) {
                    setProphaseISub((s) => s + 1);
                    return;
                }
                if (meiosisIPhase < 3) {
                    setMeiosisIPhase((p) => p + 1);
                } else {
                    setMeiosisStage('interkinesis');
                }
            } else if (meiosisStage === 'interkinesis') {
                setMeiosisStage('II');
                setMeiosisIIPhase(0);
            } else {
                if (meiosisIIPhase < 3) {
                    setMeiosisIIPhase((p) => p + 1);
                } else {
                    // reset to start of meiosis
                    setMeiosisStage('I');
                    setMeiosisIPhase(0);
                    setProphaseISub(0);
                    setMeiosisIIPhase(0);
                    setAssortSeed((s) => s + 1);
                }
            }
        } else {
            // compare: cycle both
            setMitosisPhase((p) => (p + 1) % 4);
            if (meiosisStage === 'I') {
                if (meiosisIPhase === 0 && prophaseISub < 4) {
                    setProphaseISub((s) => s + 1);
                } else if (meiosisIPhase < 3) {
                    setMeiosisIPhase((p) => p + 1);
                } else {
                    setMeiosisStage('interkinesis');
                }
            } else if (meiosisStage === 'interkinesis') {
                setMeiosisStage('II');
            } else if (meiosisIIPhase < 3) {
                setMeiosisIIPhase((p) => p + 1);
            } else {
                setMeiosisStage('I');
                setMeiosisIPhase(0);
                setProphaseISub(0);
                setMeiosisIIPhase(0);
            }
        }
    }, [mode, meiosisStage, meiosisIPhase, prophaseISub, meiosisIIPhase]);

    const stepBack = useCallback(() => {
        setProgress(0);
        if (mode === 'mitosis' || mode === 'compare') {
            setMitosisPhase((p) => (p > 0 ? p - 1 : 0));
        }
        if (mode === 'meiosis') {
            if (meiosisStage === 'II') {
                if (meiosisIIPhase > 0) setMeiosisIIPhase((p) => p - 1);
                else {
                    setMeiosisStage('interkinesis');
                }
            } else if (meiosisStage === 'interkinesis') {
                setMeiosisStage('I');
                setMeiosisIPhase(3);
            } else if (meiosisStage === 'I') {
                if (meiosisIPhase === 0 && prophaseISub > 0) {
                    setProphaseISub((s) => s - 1);
                } else if (meiosisIPhase > 0) {
                    setMeiosisIPhase((p) => p - 1);
                }
            }
        }
    }, [mode, meiosisStage, meiosisIPhase, meiosisIIPhase, prophaseISub]);

    const stepForward = useCallback(() => {
        setProgress(0);
        advance();
    }, [advance]);

    useEffect(() => {
        const tick = (t: number) => {
            const last = lastTRef.current || t;
            let dt = (t - last) / 1000;
            lastTRef.current = t;
            if (dt > 0.1) dt = 0.1;
            if (playing) {
                // ~6s per phase at 1x → much slower than before so the user can read
                setProgress((p) => {
                    const next = p + dt * 0.17 * speed;
                    if (next >= 1) {
                        advance();
                        return 0;
                    }
                    return next;
                });
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastTRef.current = 0;
        };
    }, [playing, speed, advance]);

    const resetLab = useCallback(() => {
        setMode('mitosis');
        setCytokinesis('animal');
        setPairs(2);
        setMitosisPhase(0);
        setMeiosisStage('I');
        setMeiosisIPhase(0);
        setMeiosisIIPhase(0);
        setProphaseISub(0);
        setChiasmata(1);
        setAssortSeed(0);
        setShowLabels(true);
        setShowInterphase(false);
        setPlaying(false);
        setSpeed(1);
        setProgress(0);
    }, []);

    // ────────────── Live values ──────────────
    const currentPhaseName = useMemo(() => {
        if (showInterphase) return 'Interphase (G₁ · S · G₂)';
        if (mode === 'mitosis') return MITOSIS_PHASES[mitosisPhase];
        if (mode === 'compare')
            return `${MITOSIS_PHASES[mitosisPhase]} || ${
                meiosisStage === 'I'
                    ? MEIOSIS_I_PHASES[meiosisIPhase]
                    : meiosisStage === 'II'
                    ? MEIOSIS_II_PHASES[meiosisIIPhase]
                    : 'Interkinesis'
            }`;
        if (meiosisStage === 'I') return MEIOSIS_I_PHASES[meiosisIPhase];
        if (meiosisStage === 'interkinesis') return 'Interkinesis';
        return MEIOSIS_II_PHASES[meiosisIIPhase];
    }, [mode, mitosisPhase, meiosisStage, meiosisIPhase, meiosisIIPhase, showInterphase]);

    const subStageLabel = useMemo(() => {
        if (mode === 'mitosis') return null;
        if (meiosisStage === 'I' && meiosisIPhase === 0) return PROPHASE_I_SUBS[prophaseISub];
        return null;
    }, [mode, meiosisStage, meiosisIPhase, prophaseISub]);

    const divisionType = useMemo(() => {
        if (mode === 'mitosis') return 'Equational (2n → 2n)';
        if (meiosisStage === 'I') return 'Reductional (2n → n)';
        if (meiosisStage === 'II') return 'Equational (n → n)';
        return 'Interkinesis';
    }, [mode, meiosisStage]);

    const ploidy = useMemo(() => {
        if (mode === 'mitosis') {
            if (mitosisPhase < 3) return '2n / 4C';
            return '2n / 2C (each)';
        }
        if (meiosisStage === 'I') {
            if (meiosisIPhase < 3) return '2n / 4C';
            return 'n / 2C (each)';
        }
        if (meiosisStage === 'interkinesis') return 'n / 2C';
        if (meiosisIIPhase < 3) return 'n / 2C';
        return 'n / 1C (each)';
    }, [mode, mitosisPhase, meiosisStage, meiosisIPhase, meiosisIIPhase]);

    const daughterCount = useMemo(() => {
        if (mode === 'mitosis') return mitosisPhase === 3 ? 2 : 0;
        if (meiosisStage === 'I') return meiosisIPhase === 3 ? 2 : 0;
        if (meiosisStage === 'interkinesis') return 2;
        return meiosisIIPhase === 3 ? 4 : 2;
    }, [mode, mitosisPhase, meiosisStage, meiosisIPhase, meiosisIIPhase]);

    const dnaReplicates = useMemo(() => {
        if (mode === 'mitosis') return 'Yes — S phase';
        if (meiosisStage === 'interkinesis') return 'No — interkinesis';
        return 'Yes — once before Meiosis I';
    }, [mode, meiosisStage]);

    const liveNarration = useMemo(() => {
        if (showInterphase)
            return 'Interphase = G₁ (growth) + S (DNA replication & chromosome duplication — each chromosome → 2 sister chromatids) + G₂ (cytoplasmic growth, centrosome duplicated). Cell prepares for division.';
        if (mode === 'mitosis' || (mode === 'compare' && true)) {
            // overrides below for meiosis specifics
        }
        if (mode === 'mitosis') {
            const p = MITOSIS_PHASES[mitosisPhase];
            if (p === 'Prophase')
                return 'Prophase: chromatin condenses into compact mitotic chromosomes (2 sister chromatids joined at the centromere). Duplicated centrosomes migrate to opposite poles radiating asters → mitotic apparatus. By the end, Golgi, ER, nucleolus, and nuclear envelope disappear.';
            if (p === 'Metaphase')
                return 'Metaphase: all chromosomes align SINGLE-FILE at the equator (metaphase plate). Kinetochores on each centromere bind spindle fibres from opposite poles — best stage to study chromosome morphology.';
            if (p === 'Anaphase')
                return 'Anaphase: centromeres of every chromosome split SIMULTANEOUSLY. Sister chromatids become daughter chromosomes and move to opposite poles, centromere leading and arms trailing.';
            return 'Telophase: chromosomes decondense at the poles; nuclear envelope reforms; nucleolus, Golgi, ER reappear. Cytokinesis follows — animal: cleavage furrow; plant: cell plate. → 2 identical 2n daughter cells.';
        }
        if (meiosisStage === 'I' && meiosisIPhase === 0) {
            const s = PROPHASE_I_SUBS[prophaseISub];
            if (s === 'Leptotene')
                return 'Leptotene: chromosomes become gradually visible under the light microscope. Compaction continues throughout this stage.';
            if (s === 'Zygotene')
                return 'Zygotene: homologous chromosomes pair (SYNAPSIS), forming bivalents (tetrads). A ladder-like synaptonemal complex zips the homologues together.';
            if (s === 'Pachytene')
                return 'Pachytene (longest sub-stage): the 4 chromatids of each bivalent are distinct. Recombination nodules appear; CROSSING OVER between non-sister chromatids exchanges genetic material — enzyme RECOMBINASE. Recombination is completed by the end of pachytene.';
            if (s === 'Diplotene')
                return 'Diplotene: the synaptonemal complex dissolves. Homologues partially separate but remain linked at sites of crossover — these X-shaped junctions are CHIASMATA.';
            return 'Diakinesis: chiasmata undergo TERMINALISATION (move toward chromosome ends). Chromosomes fully condense; meiotic spindle assembles; nucleolus disappears; nuclear envelope breaks down → transition to Metaphase I.';
        }
        if (meiosisStage === 'I') {
            const p = MEIOSIS_I_PHASES[meiosisIPhase];
            if (p === 'Metaphase I')
                return 'Metaphase I: BIVALENTS align on the equatorial plate (paired, not single-file). Spindle microtubules from opposite poles attach to the kinetochores of HOMOLOGUES.';
            if (p === 'Anaphase I')
                return 'Anaphase I: homologous chromosomes move to opposite poles — each carrying BOTH of its sister chromatids. Sister chromatids remain associated at their centromeres (centromeres INTACT). This is the reductional step.';
            return 'Telophase I: nuclear membrane and nucleolus reappear; cytokinesis follows → DYAD of cells (two haploid cells, each chromosome still has 2 chromatids).';
        }
        if (meiosisStage === 'interkinesis')
            return 'Interkinesis: short-lived stage between Meiosis I and Meiosis II. NO DNA replication occurs here.';
        const p = MEIOSIS_II_PHASES[meiosisIIPhase];
        if (p === 'Prophase II')
            return 'Prophase II: much simpler than Prophase I. Nuclear membrane disappears by its end; chromosomes recompact.';
        if (p === 'Metaphase II')
            return 'Metaphase II: chromosomes align single-file at the equator (like mitosis); microtubules attach to kinetochores of SISTER CHROMATIDS.';
        if (p === 'Anaphase II')
            return 'Anaphase II: centromere of each chromosome splits simultaneously; sister chromatids separate and move to opposite poles via shortening kinetochore microtubules.';
        return 'Telophase II: nuclear envelopes reform; cytokinesis follows → TETRAD of cells (4 haploid daughter cells). Crossing-over makes each of the four cells genetically unique.';
    }, [
        showInterphase,
        mode,
        mitosisPhase,
        meiosisStage,
        meiosisIPhase,
        meiosisIIPhase,
        prophaseISub,
    ]);

    // ────────────── Left aside: NCERT figure cards ──────────────
    const graphPanel = (
        <aside
            className="pointer-events-auto absolute right-[calc(100%+12px)] top-0 bottom-0 z-20
                       hidden w-[300px] 2xl:block overflow-y-auto overflow-x-hidden pr-1"
        >
            <div className="flex flex-col gap-2.5">
                <FigCard title="NCERT Fig 10.2" subtitle="stages of mitosis">
                    <MitosisFigStrip activePhase={mode === 'meiosis' ? -1 : mitosisPhase} />
                </FigCard>
                <FigCard title="NCERT Fig 10.3" subtitle="stages of meiosis I">
                    <MeiosisIFigStrip
                        activePhase={
                            mode === 'mitosis' || meiosisStage !== 'I' ? -1 : meiosisIPhase
                        }
                    />
                </FigCard>
                <FigCard title="NCERT Fig 10.4" subtitle="stages of meiosis II → tetrad">
                    <MeiosisIIFigStrip
                        activePhase={
                            mode === 'mitosis' || meiosisStage !== 'II' ? -1 : meiosisIIPhase
                        }
                    />
                </FigCard>
                <FigCard title="Prophase I sub-stages" subtitle="long & complex (Pg 126)">
                    <ProphaseISubStrip
                        active={
                            mode !== 'mitosis' && meiosisStage === 'I' && meiosisIPhase === 0
                                ? prophaseISub
                                : -1
                        }
                    />
                </FigCard>
            </div>
        </aside>
    );

    // ────────────── Right aside: Theory + Live values ──────────────
    const theoryTone = mode === 'mitosis' ? 'indigo' : mode === 'meiosis' ? 'emerald' : 'slate';
    const valuesPanel = (
        <aside
            className="pointer-events-auto absolute left-[calc(100%+12px)] top-0 bottom-0 z-20
                       hidden w-[300px] 2xl:block overflow-y-auto overflow-x-hidden pl-1"
        >
            <div className="flex flex-col gap-3">
                {/* Theory card */}
                <div
                    className={`rounded-2xl border p-4 shadow-xl backdrop-blur ${
                        theoryTone === 'indigo'
                            ? 'border-indigo-200 bg-indigo-50/95'
                            : theoryTone === 'emerald'
                            ? 'border-emerald-200 bg-emerald-50/95'
                            : 'border-slate-200 bg-slate-50/95'
                    }`}
                >
                    <div
                        className={`text-base font-extrabold ${
                            theoryTone === 'indigo'
                                ? 'text-indigo-900'
                                : theoryTone === 'emerald'
                                ? 'text-emerald-900'
                                : 'text-slate-900'
                        }`}
                    >
                        {mode === 'mitosis'
                            ? 'Mitosis'
                            : mode === 'meiosis'
                            ? 'Meiosis'
                            : 'Mitosis vs Meiosis'}
                    </div>
                    <div
                        className={`text-xs font-semibold mt-0.5 ${
                            theoryTone === 'indigo'
                                ? 'text-indigo-700'
                                : theoryTone === 'emerald'
                                ? 'text-emerald-700'
                                : 'text-slate-600'
                        }`}
                    >
                        NCERT Ch 10 · {mode === 'mitosis' ? '§10.2' : '§10.4 + §10.5'}
                    </div>
                    {mode !== 'compare' ? (
                        <p
                            className={`mt-2 text-sm leading-snug ${
                                theoryTone === 'indigo' ? 'text-indigo-900' : 'text-emerald-900'
                            }`}
                        >
                            {liveNarration}
                        </p>
                    ) : (
                        <ComparisonTable />
                    )}
                    <div className="mt-3 border-t border-slate-200/70 pt-2">
                        <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-600 mb-1">
                            Significance (§10.5)
                        </div>
                        <ul className="text-[11.5px] text-slate-700 space-y-1 leading-relaxed">
                            <li>• Conserves species chromosome number across generations.</li>
                            <li>• Increases genetic variability via crossing over + independent assortment.</li>
                            <li>• Variations drive evolution.</li>
                        </ul>
                    </div>
                </div>

                {/* Real-time values card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <ValueRow
                            label="Mode"
                            value={mode === 'mitosis' ? 'Mitosis' : mode === 'meiosis' ? `Meiosis ${meiosisStage}` : 'Compare'}
                            tint="bg-slate-50"
                            tone="text-slate-700"
                        />
                        <ValueRow label="Phase" value={currentPhaseName} tint={mode === 'mitosis' ? 'bg-indigo-50' : 'bg-emerald-50'} tone={mode === 'mitosis' ? 'text-indigo-700' : 'text-emerald-700'} />
                        {subStageLabel && (
                            <ValueRow label="Prophase-I sub-stage" value={subStageLabel} tint="bg-emerald-50" tone="text-emerald-700" />
                        )}
                        <ValueRow label="Division type" value={divisionType} tint="bg-amber-50" tone="text-amber-700" />
                        <ValueRow label="Ploidy · DNA" value={ploidy} tint="bg-cyan-50" tone="text-cyan-700" />
                        <ValueRow label="Daughter cells" value={`${daughterCount}`} tint="bg-emerald-50" tone="text-emerald-700" />
                        {mode === 'meiosis' && meiosisStage === 'I' && meiosisIPhase === 0 && prophaseISub >= 2 && (
                            <ValueRow label="Chiasmata" value={`${chiasmata}`} tint="bg-amber-50" tone="text-amber-700" />
                        )}
                        <ValueRow label="Cytokinesis" value={cytokinesis === 'animal' ? 'Cleavage furrow' : 'Cell plate'} tint="bg-slate-50" tone="text-slate-700" />
                        <ValueRow label="DNA replication" value={dnaReplicates} tint="bg-violet-50" tone="text-violet-700" />
                        <ValueRow label="Chromosome pairs (n)" value={`${pairs}`} tint="bg-rose-50" tone="text-rose-700" />
                    </div>
                </div>
            </div>
        </aside>
    );

    // ────────────── Simulation canvas ──────────────
    // Ease progress so motion feels organic (smooth in/out) instead of linear
    const easedProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    const arenaContext: ArenaContext = {
        mode,
        cytokinesis,
        pairs,
        mitosisPhase,
        meiosisStage,
        meiosisIPhase,
        meiosisIIPhase,
        prophaseISub,
        chiasmata,
        assortSeed,
        showLabels,
        showInterphase,
        progress: easedProgress,
    };

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg
                    viewBox="0 0 1280 760"
                    className="absolute inset-0 h-full w-full"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <SvgDefs />
                    <text x="40" y="48" fontSize="18" fontWeight="900" fontStyle="italic" fill="#0f172a">
                        Mitosis vs Meiosis · NCERT Ch 10 · §10.2 &amp; §10.4
                    </text>
                    <text x="40" y="70" fontSize="12" fontWeight="700" fill="#64748b">
                        {currentPhaseName}
                        {subStageLabel ? ` · ${subStageLabel}` : ''}
                        {mode === 'meiosis' && meiosisStage === 'I' && meiosisIPhase === 0 && prophaseISub === 2
                            ? ' · enzyme: recombinase'
                            : ''}
                    </text>

                    {showInterphase ? (
                        <InterphasePreview cx={640} cy={400} />
                    ) : mode === 'compare' ? (
                        <>
                            <ArenaLabel x={350} y={110} label="Mitosis · equational" tone="#4f46e5" />
                            <Arena cx={350} cy={420} r={240} which="mitosis" ctx={arenaContext} />
                            <ArenaLabel x={930} y={110} label="Meiosis · reductional" tone="#059669" />
                            <Arena cx={930} cy={420} r={240} which="meiosis" ctx={arenaContext} />
                        </>
                    ) : (
                        <Arena cx={640} cy={420} r={300} which={mode} ctx={arenaContext} />
                    )}
                </svg>

                {/* Pause / Play / Step / Reset — canvas top-right ONLY */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={stepBack}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Previous phase"
                    >
                        <SkipBack size={15} />
                    </button>
                    <button
                        onClick={() => setPlaying((p) => !p)}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title={playing ? 'Pause' : 'Play (auto-advance)'}
                    >
                        {playing ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                        onClick={stepForward}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Next phase"
                    >
                        <SkipForward size={15} />
                    </button>
                    <button
                        onClick={resetLab}
                        className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50 transition-colors"
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

    // ────────────── Controls (bottom) ──────────────
    const phaseScrubMax =
        mode === 'mitosis'
            ? 3
            : meiosisStage === 'I'
            ? 3
            : meiosisStage === 'II'
            ? 3
            : 0;
    const phaseScrubValue =
        mode === 'mitosis' || mode === 'compare'
            ? mitosisPhase
            : meiosisStage === 'I'
            ? meiosisIPhase
            : meiosisStage === 'II'
            ? meiosisIIPhase
            : 0;

    const controlsCombo = (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full overflow-y-auto max-h-[34vh]">
            <div className="p-4 grid grid-cols-12 gap-4">
                <div className="col-span-12 flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                    <Microscope size={16} className="text-indigo-700" />
                    Cell Division Bench
                </div>

                <div className="col-span-12 lg:col-span-3">
                    <SectionLabel icon={<Layers size={12} />}>View mode</SectionLabel>
                    <div className="grid grid-cols-3 gap-1.5">
                        {(['mitosis', 'meiosis', 'compare'] as Mode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => {
                                    setMode(m);
                                    setProgress(0);
                                }}
                                className={`rounded-lg py-2 text-[11px] font-bold border transition ${
                                    mode === m
                                        ? m === 'mitosis'
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : m === 'meiosis'
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                            : 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                                }`}
                            >
                                {m === 'mitosis' ? 'Mitosis' : m === 'meiosis' ? 'Meiosis' : 'Compare'}
                            </button>
                        ))}
                    </div>

                    <SectionLabel className="mt-3" icon={<Sprout size={12} />}>
                        Cytokinesis
                    </SectionLabel>
                    <div className="grid grid-cols-2 gap-1.5">
                        {(['animal', 'plant'] as Cytokinesis[]).map((c) => (
                            <button
                                key={c}
                                onClick={() => setCytokinesis(c)}
                                className={`rounded-lg py-2 text-[11px] font-bold border transition ${
                                    cytokinesis === c
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-700 border-slate-200'
                                }`}
                            >
                                {c === 'animal' ? 'Animal · furrow' : 'Plant · cell plate'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-3">
                    <SectionLabel icon={<Dna size={12} />}>Chromosome pairs (n)</SectionLabel>
                    <div className="grid grid-cols-3 gap-1.5">
                        {([2, 3, 4] as const).map((n) => (
                            <button
                                key={n}
                                onClick={() => setPairs(n)}
                                className={`rounded-lg py-2 text-[11px] font-bold border transition ${
                                    pairs === n
                                        ? 'bg-rose-600 text-white border-rose-600'
                                        : 'bg-white text-slate-700 border-slate-200'
                                }`}
                            >
                                n = {n}
                            </button>
                        ))}
                    </div>

                    {mode !== 'mitosis' && meiosisStage === 'I' && meiosisIPhase === 0 && prophaseISub >= 2 && (
                        <>
                            <SectionLabel className="mt-3" icon={<Activity size={12} />}>
                                Chiasmata count
                            </SectionLabel>
                            <div className="grid grid-cols-3 gap-1.5">
                                {[1, 2, 3].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setChiasmata(n)}
                                        className={`rounded-lg py-2 text-[11px] font-bold border transition ${
                                            chiasmata === n
                                                ? 'bg-amber-600 text-white border-amber-600'
                                                : 'bg-white text-slate-700 border-slate-200'
                                        }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="col-span-12 lg:col-span-4">
                    {mode === 'meiosis' && (
                        <>
                            <SectionLabel icon={<Layers size={12} />}>Meiotic stage</SectionLabel>
                            <div className="grid grid-cols-3 gap-1.5">
                                {(['I', 'interkinesis', 'II'] as MeiosisStage[]).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            setMeiosisStage(s);
                                            setProgress(0);
                                        }}
                                        className={`rounded-lg py-2 text-[10px] font-bold border transition ${
                                            meiosisStage === s
                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                : 'bg-white text-slate-700 border-slate-200'
                                        }`}
                                    >
                                        {s === 'I' ? 'Meiosis I' : s === 'II' ? 'Meiosis II' : 'Interkinesis'}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    <SectionLabel className={mode === 'meiosis' ? 'mt-3' : ''} icon={<Activity size={12} />}>
                        Phase scrubber · {currentPhaseName}
                    </SectionLabel>
                    <input
                        type="range"
                        min={0}
                        max={phaseScrubMax}
                        value={phaseScrubValue}
                        onChange={(e) => {
                            const v = parseInt(e.target.value);
                            setProgress(0);
                            if (mode === 'mitosis' || mode === 'compare') setMitosisPhase(v);
                            if (mode === 'meiosis') {
                                if (meiosisStage === 'I') setMeiosisIPhase(v);
                                else if (meiosisStage === 'II') setMeiosisIIPhase(v);
                            }
                        }}
                        className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9.5px] font-bold text-slate-500 mt-0.5">
                        {(mode === 'mitosis' || mode === 'compare'
                            ? MITOSIS_PHASES
                            : meiosisStage === 'I'
                            ? MEIOSIS_I_PHASES
                            : meiosisStage === 'II'
                            ? MEIOSIS_II_PHASES
                            : ['Interkinesis']
                        ).map((p) => (
                            <span key={p}>{p}</span>
                        ))}
                    </div>

                    {mode !== 'mitosis' && meiosisStage === 'I' && meiosisIPhase === 0 && (
                        <>
                            <SectionLabel className="mt-2" icon={<Dna size={12} />}>
                                Prophase I sub-stages · {PROPHASE_I_SUBS[prophaseISub]}
                            </SectionLabel>
                            <div className="grid grid-cols-5 gap-1">
                                {PROPHASE_I_SUBS.map((s, i) => (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            setProphaseISub(i);
                                            setProgress(0);
                                        }}
                                        className={`rounded px-1 py-1 text-[9px] font-bold border transition ${
                                            prophaseISub === i
                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="col-span-12 lg:col-span-2 flex flex-col gap-2">
                    <SectionLabel icon={<Tag size={12} />}>Display</SectionLabel>
                    <button
                        onClick={() => setShowLabels((p) => !p)}
                        className={`w-full rounded-lg py-2 text-[11px] font-bold border transition ${
                            showLabels ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                        }`}
                    >
                        Labels: {showLabels ? 'ON' : 'OFF'}
                    </button>
                    <button
                        onClick={() => setShowInterphase((p) => !p)}
                        className={`w-full rounded-lg py-2 text-[11px] font-bold border transition flex items-center justify-center gap-1 ${
                            showInterphase ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-700 border-slate-200'
                        }`}
                    >
                        {showInterphase ? <Eye size={12} /> : <EyeOff size={12} />}
                        Interphase
                    </button>
                    {mode !== 'mitosis' &&
                        ((meiosisStage === 'I' && meiosisIPhase === 1) || mode === 'compare') && (
                            <button
                                onClick={() => setAssortSeed((s) => s + 1)}
                                className="w-full rounded-lg py-2 text-[11px] font-bold border bg-amber-500 text-white border-amber-500 hover:bg-amber-600 flex items-center justify-center gap-1"
                            >
                                <Shuffle size={12} />
                                Shuffle assortment
                            </button>
                        )}
                </div>

                <div className="col-span-12 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase mb-1">
                        <span>Animation speed</span>
                        <span className="text-slate-800">{speed.toFixed(2)}×</span>
                    </div>
                    <input
                        type="range"
                        min={0.25}
                        max={2}
                        step={0.05}
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600"
                    />
                    <div className="text-[10px] text-slate-500 mt-0.5">
                        Phase length at 1× ≈ 6 s · pause + step for full control.
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
            ControlsComponent={controlsCombo}
        />
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SVG Defs
// ═══════════════════════════════════════════════════════════════════════════
const SvgDefs: React.FC = () => (
    <defs>
        <radialGradient id="cellInside" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
        </radialGradient>
        <radialGradient id="centroFlash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>
);

// ═══════════════════════════════════════════════════════════════════════════
// Arena (the main cell, drives all phase rendering)
// ═══════════════════════════════════════════════════════════════════════════
interface ArenaContext {
    mode: Mode;
    cytokinesis: Cytokinesis;
    pairs: 2 | 3 | 4;
    mitosisPhase: number;
    meiosisStage: MeiosisStage;
    meiosisIPhase: number;
    meiosisIIPhase: number;
    prophaseISub: number;
    chiasmata: number;
    assortSeed: number;
    showLabels: boolean;
    showInterphase: boolean;
    progress: number;
}

const Arena: React.FC<{ cx: number; cy: number; r: number; which: 'mitosis' | 'meiosis'; ctx: ArenaContext }> = ({
    cx,
    cy,
    r,
    which,
    ctx,
}) => {
    const isMitosis = which === 'mitosis';
    // Determine cell state
    const phase = isMitosis
        ? MITOSIS_PHASES[ctx.mitosisPhase]
        : ctx.meiosisStage === 'I'
        ? MEIOSIS_I_PHASES[ctx.meiosisIPhase]
        : ctx.meiosisStage === 'II'
        ? MEIOSIS_II_PHASES[ctx.meiosisIIPhase]
        : 'Interkinesis';

    const inMeiosisI = !isMitosis && ctx.meiosisStage === 'I';
    const inMeiosisII = !isMitosis && ctx.meiosisStage === 'II';
    const inInterkinesis = !isMitosis && ctx.meiosisStage === 'interkinesis';

    // Cell membrane envelope fade
    const envelopeOpacity = (() => {
        if (phase === 'Prophase' || phase === 'Prophase I' || phase === 'Prophase II') {
            return 1 - ctx.progress;
        }
        if (phase === 'Telophase' || phase === 'Telophase I' || phase === 'Telophase II') {
            return ctx.progress;
        }
        if (phase === 'Interkinesis') return 1;
        return 0;
    })();

    // After Telophase I (meiosis), show 2 cells
    const showDyad = !isMitosis && (phase === 'Telophase I' || inInterkinesis || ctx.meiosisStage === 'II');
    const showTetrad = !isMitosis && inMeiosisII && phase === 'Telophase II' && ctx.progress > 0.5;

    if (showTetrad) {
        return (
            <g>
                <Tetrad cx={cx} cy={cy} r={r} ctx={ctx} />
                {ctx.showLabels && (
                    <text x={cx} y={cy + r + 30} textAnchor="middle" fontSize="12" fontWeight="800" fill="#059669">
                        Tetrad of cells · 4 haploid daughter cells (recombinant)
                    </text>
                )}
            </g>
        );
    }

    if (showDyad) {
        return (
            <g>
                <Dyad cx={cx} cy={cy} r={r} ctx={ctx} phase={phase} />
                {ctx.showLabels && (
                    <text x={cx} y={cy + r + 30} textAnchor="middle" fontSize="12" fontWeight="800" fill="#059669">
                        {inInterkinesis ? 'Interkinesis · no DNA replication' : phase === 'Telophase I' ? 'Dyad of cells (haploid)' : 'Meiosis II underway in both haploid cells'}
                    </text>
                )}
            </g>
        );
    }

    return (
        <g>
            {/* Membrane */}
            <circle cx={cx} cy={cy} r={r} fill="url(#cellInside)" stroke="#cbd5e1" strokeWidth="2" />
            {/* Cytoplasm texture */}
            <CytoplasmTexture cx={cx} cy={cy} r={r} />
            {/* Equator dashed line */}
            <line x1={cx - r + 20} y1={cy} x2={cx + r - 20} y2={cy} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 6" opacity={0.55} />
            {ctx.showLabels && (
                <text x={cx + r - 24} y={cy - 6} textAnchor="end" fontSize="10" fontWeight="700" fill="#64748b">
                    metaphase plate
                </text>
            )}

            {/* Nuclear envelope + nucleolus */}
            {envelopeOpacity > 0.05 && (
                <g opacity={envelopeOpacity}>
                    <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={cx} cy={cy} r={r * 0.5 - 4} fill="none" stroke="#64748b" strokeWidth="1" />
                    <circle cx={cx - 12} cy={cy - 6} r="10" fill="#cbd5e1" />
                    {ctx.showLabels && <text x={cx + 4} y={cy - r * 0.5 + 14} fontSize="9" fontWeight="700" fill="#64748b">nuclear envelope</text>}
                </g>
            )}

            {/* Centrosomes & asters (drift from center toward poles during prophase, anchored at poles otherwise) */}
            <Centrosomes cx={cx} cy={cy} r={r} phase={phase} progress={ctx.progress} showLabels={ctx.showLabels} />

            {/* Spindle fibres (visible from prometaphase through anaphase) */}
            <Spindle cx={cx} cy={cy} r={r} phase={phase} pairs={ctx.pairs} progress={ctx.progress} />

            {/* Chromosomes */}
            <Chromosomes cx={cx} cy={cy} r={r} which={which} ctx={ctx} phase={phase} />

            {/* Cytokinesis */}
            {(phase === 'Telophase' || phase === 'Telophase I' || phase === 'Telophase II') && (
                <Cytokinesis cx={cx} cy={cy} r={r} style={ctx.cytokinesis} progress={ctx.progress} />
            )}

            {/* Spindle pole labels */}
            {ctx.showLabels && (phase === 'Metaphase' || phase === 'Metaphase I' || phase === 'Metaphase II' || phase.startsWith('Anaphase')) && (
                <>
                    <text x={cx - r + 4} y={cy + 14} fontSize="9" fontWeight="800" fill="#475569">spindle pole</text>
                    <text x={cx + r - 4} y={cy + 14} textAnchor="end" fontSize="9" fontWeight="800" fill="#475569">spindle pole</text>
                </>
            )}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Cytoplasm faint texture
// ═══════════════════════════════════════════════════════════════════════════
const CytoplasmTexture: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
    <g opacity={0.35} clipPath={`circle(${r}px at ${cx}px ${cy}px)`}>
        {Array.from({ length: 18 }).map((_, i) => {
            const ang = (i / 18) * Math.PI * 2;
            const rad = (i % 4) * (r / 5) + 30;
            return <circle key={i} cx={cx + Math.cos(ang) * rad} cy={cy + Math.sin(ang) * rad} r="1.5" fill="#94a3b8" />;
        })}
    </g>
);

// ═══════════════════════════════════════════════════════════════════════════
// Centrosomes + asters
// ═══════════════════════════════════════════════════════════════════════════
const Centrosomes: React.FC<{ cx: number; cy: number; r: number; phase: string; progress: number; showLabels: boolean }> = ({
    cx,
    cy,
    r,
    phase,
    progress,
    showLabels,
}) => {
    const isProphase = phase === 'Prophase' || phase === 'Prophase I' || phase === 'Prophase II';
    const isTelophase = phase === 'Telophase' || phase === 'Telophase I' || phase === 'Telophase II';
    let t = 1;
    if (isProphase) t = progress;
    if (isTelophase) t = 1; // still at poles
    const poleX = (r - 30) * t;
    const positions = [
        { x: cx - poleX, y: cy },
        { x: cx + poleX, y: cy },
    ];
    return (
        <g>
            {positions.map((p, i) => (
                <g key={i}>
                    {Array.from({ length: 10 }).map((_, k) => {
                        const ang = (k / 10) * Math.PI * 2;
                        return (
                            <line
                                key={k}
                                x1={p.x}
                                y1={p.y}
                                x2={p.x + Math.cos(ang) * 22}
                                y2={p.y + Math.sin(ang) * 22}
                                stroke="#a78bfa"
                                strokeWidth="1"
                                opacity="0.6"
                            />
                        );
                    })}
                    <circle cx={p.x} cy={p.y} r="5" fill="#6366f1" />
                    {showLabels && isProphase && (
                        <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="8" fontWeight="800" fill="#4338ca">
                            aster
                        </text>
                    )}
                </g>
            ))}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Spindle fibres
// ═══════════════════════════════════════════════════════════════════════════
const Spindle: React.FC<{ cx: number; cy: number; r: number; phase: string; pairs: 2 | 3 | 4; progress: number }> = ({
    cx,
    cy,
    r,
    phase,
    pairs,
}) => {
    const visible =
        phase === 'Metaphase' ||
        phase === 'Metaphase I' ||
        phase === 'Metaphase II' ||
        phase === 'Anaphase' ||
        phase === 'Anaphase I' ||
        phase === 'Anaphase II';
    if (!visible) return null;
    const lp = cx - (r - 30);
    const rp = cx + (r - 30);
    const n = pairs * 2;
    return (
        <g opacity="0.7">
            {Array.from({ length: n }).map((_, i) => {
                const t = (i / Math.max(1, n - 1)) - 0.5;
                const y = cy + t * 60;
                return (
                    <g key={i}>
                        <line x1={lp} y1={cy} x2={cx + t * 10} y2={y} stroke="#6366f1" strokeWidth="1" />
                        <line x1={rp} y1={cy} x2={cx + t * 10} y2={y} stroke="#6366f1" strokeWidth="1" />
                    </g>
                );
            })}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Chromosomes (the heart of the simulation)
// ═══════════════════════════════════════════════════════════════════════════
const Chromosomes: React.FC<{
    cx: number;
    cy: number;
    r: number;
    which: 'mitosis' | 'meiosis';
    ctx: ArenaContext;
    phase: string;
}> = ({ cx, cy, r, which, ctx, phase }) => {
    const pairs = ctx.pairs;
    const pairList = Array.from({ length: pairs }).map((_, i) => PAIR_COLORS[i]);

    // Build positions per phase
    const positions: Array<{ kind: 'pair' | 'single'; pIndex: number; mat: { x: number; y: number; rot: number; split: boolean }; pat: { x: number; y: number; rot: number; split: boolean }; bivalent?: boolean }> = [];

    const equatorY = cy;
    const spacing = 80;
    const offsetTotal = (pairs - 1) * spacing;
    // Independent assortment orientation: each pair flipped or not by seed
    const orient = (i: number) => {
        // pseudo random from assortSeed
        const v = Math.sin(ctx.assortSeed * 7.3 + i * 2.1);
        return v > 0;
    };

    if (which === 'mitosis') {
        // Mitosis: all pairs single-file
        for (let i = 0; i < pairs; i++) {
            const x = cx - offsetTotal / 2 + i * spacing;
            const p = ctx.mitosisPhase;
            const progress = ctx.progress;
            if (phase === 'Prophase') {
                // chromosomes scatter inside nucleus, condensing
                const ang = (i / pairs) * Math.PI * 2;
                const rad = (1 - progress) * (r * 0.3);
                positions.push({
                    kind: 'pair',
                    pIndex: i,
                    mat: { x: cx + Math.cos(ang) * (rad + 20), y: cy + Math.sin(ang) * (rad + 10) - 15, rot: 0, split: false },
                    pat: { x: cx + Math.cos(ang) * (rad + 20), y: cy + Math.sin(ang) * (rad + 10) + 15, rot: 0, split: false },
                });
            } else if (phase === 'Metaphase') {
                // single file at equator: each chromosome is a duplicated pair (sister chromatids) stacked vertically
                positions.push({
                    kind: 'pair',
                    pIndex: i,
                    mat: { x: x - 8, y: equatorY, rot: 0, split: false },
                    pat: { x: x + 8, y: equatorY, rot: 0, split: false },
                });
            } else if (phase === 'Anaphase') {
                const t = progress;
                const dx = (r - 60) * t;
                positions.push({
                    kind: 'pair',
                    pIndex: i,
                    mat: { x: x - 8 - dx, y: equatorY + (i - (pairs - 1) / 2) * 20, rot: 0, split: true },
                    pat: { x: x + 8 + dx, y: equatorY + (i - (pairs - 1) / 2) * 20, rot: 0, split: true },
                });
            } else if (phase === 'Telophase') {
                const dx = r - 60;
                positions.push({
                    kind: 'pair',
                    pIndex: i,
                    mat: { x: cx - dx, y: equatorY + (i - (pairs - 1) / 2) * 30, rot: 0, split: true },
                    pat: { x: cx + dx, y: equatorY + (i - (pairs - 1) / 2) * 30, rot: 0, split: true },
                });
            }
        }
    } else {
        // Meiosis
        if (ctx.meiosisStage === 'I') {
            const sub = ctx.prophaseISub;
            for (let i = 0; i < pairs; i++) {
                const x = cx - offsetTotal / 2 + i * spacing;
                if (phase === 'Prophase I') {
                    if (sub === 0) {
                        // Leptotene: thin threads, scattered
                        const ang = (i / pairs) * Math.PI * 2;
                        const rad = r * 0.25;
                        positions.push({
                            kind: 'pair',
                            pIndex: i,
                            mat: { x: cx + Math.cos(ang) * rad - 20, y: cy + Math.sin(ang) * rad, rot: 0, split: false },
                            pat: { x: cx + Math.cos(ang) * rad + 20, y: cy + Math.sin(ang) * rad, rot: 0, split: false },
                        });
                    } else {
                        // Zygotene onward: paired bivalents
                        positions.push({
                            kind: 'pair',
                            pIndex: i,
                            mat: { x: x - 12, y: cy - 80 + i * 50, rot: 0, split: false },
                            pat: { x: x + 12, y: cy - 80 + i * 50, rot: 0, split: false },
                            bivalent: true,
                        });
                    }
                } else if (phase === 'Metaphase I') {
                    // bivalents at equator, paired
                    const flip = orient(i);
                    positions.push({
                        kind: 'pair',
                        pIndex: i,
                        mat: { x: x - 8, y: equatorY + (flip ? -16 : 16), rot: 0, split: false },
                        pat: { x: x + 8, y: equatorY + (flip ? -16 : 16), rot: 0, split: false },
                        bivalent: true,
                    });
                    // The "other" homologue faces opposite pole — we represent: mat above, pat below; bivalent pair shown.
                } else if (phase === 'Anaphase I') {
                    const flip = orient(i);
                    const t = ctx.progress;
                    const dx = (r - 60) * t;
                    // homologues separate; centromeres intact (sisters stay together)
                    positions.push({
                        kind: 'pair',
                        pIndex: i,
                        mat: { x: x - (flip ? dx : -dx) - 14, y: equatorY + (i - (pairs - 1) / 2) * 30, rot: 0, split: false },
                        pat: { x: x - (flip ? -dx : dx) + 14, y: equatorY + (i - (pairs - 1) / 2) * 30, rot: 0, split: false },
                    });
                } else {
                    // Telophase I
                    const flip = orient(i);
                    const dx = r - 60;
                    positions.push({
                        kind: 'pair',
                        pIndex: i,
                        mat: { x: cx + (flip ? -dx : dx), y: equatorY + (i - (pairs - 1) / 2) * 30, rot: 0, split: false },
                        pat: { x: cx + (flip ? dx : -dx), y: equatorY + (i - (pairs - 1) / 2) * 30, rot: 0, split: false },
                    });
                }
            }
        } else if (ctx.meiosisStage === 'II') {
            // Meiosis II — n=pairs but each chromosome is a single chromatid pair (sisters)
            for (let i = 0; i < pairs; i++) {
                const x = cx - offsetTotal / 2 + i * spacing;
                if (phase === 'Prophase II') {
                    const ang = (i / pairs) * Math.PI;
                    const rad = (1 - ctx.progress) * r * 0.2;
                    positions.push({
                        kind: 'single',
                        pIndex: i,
                        mat: { x: cx + Math.cos(ang) * rad - 10, y: cy + Math.sin(ang) * rad, rot: 0, split: false },
                        pat: { x: cx + Math.cos(ang) * rad + 10, y: cy + Math.sin(ang) * rad, rot: 0, split: false },
                    });
                } else if (phase === 'Metaphase II') {
                    positions.push({
                        kind: 'single',
                        pIndex: i,
                        mat: { x: x - 8, y: equatorY, rot: 0, split: false },
                        pat: { x: x + 8, y: equatorY, rot: 0, split: false },
                    });
                } else if (phase === 'Anaphase II') {
                    const t = ctx.progress;
                    const dx = (r - 60) * t;
                    positions.push({
                        kind: 'single',
                        pIndex: i,
                        mat: { x: x - 8 - dx, y: equatorY + (i - (pairs - 1) / 2) * 20, rot: 0, split: true },
                        pat: { x: x + 8 + dx, y: equatorY + (i - (pairs - 1) / 2) * 20, rot: 0, split: true },
                    });
                } else {
                    const dx = r - 60;
                    positions.push({
                        kind: 'single',
                        pIndex: i,
                        mat: { x: cx - dx, y: equatorY + (i - (pairs - 1) / 2) * 30, rot: 0, split: true },
                        pat: { x: cx + dx, y: equatorY + (i - (pairs - 1) / 2) * 30, rot: 0, split: true },
                    });
                }
            }
        }
    }

    return (
        <g>
            {positions.map((pos, i) => {
                const col = pairList[pos.pIndex] || pairList[0];
                return (
                    <g key={i}>
                        {/* Bivalent linker (Prophase I zygotene+) */}
                        {pos.bivalent && (
                            <SynaptonemalComplex
                                x1={pos.mat.x}
                                y1={pos.mat.y}
                                x2={pos.pat.x}
                                y2={pos.pat.y}
                                stage={ctx.prophaseISub}
                                chiasmata={ctx.chiasmata}
                                colMat={col.mat}
                                colPat={col.pat}
                            />
                        )}
                        <Chromosome x={pos.mat.x} y={pos.mat.y} rot={pos.mat.rot} color={col.mat} split={pos.mat.split} progress={ctx.progress} />
                        <Chromosome x={pos.pat.x} y={pos.pat.y} rot={pos.pat.rot} color={col.pat} split={pos.pat.split} progress={ctx.progress} />
                    </g>
                );
            })}

            {/* Labels for first chromosome */}
            {ctx.showLabels && positions.length > 0 && phase === 'Metaphase' && (
                <>
                    <Annotate x={positions[0].mat.x + 26} y={positions[0].mat.y - 10} text="centromere" color="#475569" />
                    <Annotate x={positions[0].mat.x + 26} y={positions[0].mat.y + 12} text="kinetochore" color="#a16207" />
                </>
            )}
            {/* Centromere split flash during anaphase / anaphase II */}
            {(phase === 'Anaphase' || phase === 'Anaphase II') && ctx.progress < 0.25 && (
                <g opacity={1 - ctx.progress * 4}>
                    {positions.map((p, i) => (
                        <circle key={i} cx={(p.mat.x + p.pat.x) / 2} cy={(p.mat.y + p.pat.y) / 2} r={18 + ctx.progress * 30} fill="url(#centroFlash)" />
                    ))}
                </g>
            )}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// A single chromosome (two sister chromatid rods + centromere + kinetochore)
// ═══════════════════════════════════════════════════════════════════════════
const Chromosome: React.FC<{ x: number; y: number; rot: number; color: string; split: boolean; progress: number }> = ({
    x,
    y,
    color,
    split,
}) => {
    if (split) {
        // single chromatid (after centromere split)
        return (
            <g transform={`translate(${x} ${y})`}>
                <rect x="-7" y="-32" width="14" height="64" rx="7" fill={color} stroke="#0f172a" strokeWidth="1.5" />
                <rect x="-4" y="-26" width="3" height="12" rx="1.5" fill="white" opacity="0.4" />
                <circle cx="0" cy="0" r="6" fill="#0f172a" />
                <circle cx="0" cy="0" r="3" fill="white" />
            </g>
        );
    }
    return (
        <g transform={`translate(${x} ${y})`}>
            {/* sister chromatids — fatter, more legible */}
            <rect x="-13" y="-32" width="11" height="64" rx="5.5" fill={color} stroke="#0f172a" strokeWidth="1.5" />
            <rect x="2" y="-32" width="11" height="64" rx="5.5" fill={color} stroke="#0f172a" strokeWidth="1.5" />
            {/* sister highlight stripe */}
            <rect x="-11" y="-28" width="2.5" height="16" rx="1" fill="white" opacity="0.45" />
            <rect x="4" y="-28" width="2.5" height="16" rx="1" fill="white" opacity="0.45" />
            {/* centromere */}
            <circle cx="0" cy="0" r="7" fill="#0f172a" />
            <circle cx="0" cy="0" r="3.5" fill="white" />
            {/* kinetochore disc */}
            <circle cx="0" cy="-3" r="2.6" fill="#fbbf24" stroke="#a16207" strokeWidth="0.8" />
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Synaptonemal complex + chiasmata animation across Prophase I sub-stages
// ═══════════════════════════════════════════════════════════════════════════
const SynaptonemalComplex: React.FC<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    stage: number;
    chiasmata: number;
    colMat: string;
    colPat: string;
}> = ({ x1, y1, x2, y2, stage, chiasmata, colMat, colPat }) => {
    const mx = (x1 + x2) / 2;
    // stage 1 = zygotene (full complex), 2 = pachytene (complex + nodules), 3 = diplotene (chiasmata X), 4 = diakinesis (terminalising)
    return (
        <g>
            {/* Ladder/zip between homologues — Zygotene & Pachytene */}
            {stage <= 2 && (
                <g opacity={stage === 0 ? 0 : 0.85}>
                    <line x1={x1 + 4} y1={y1 - 18} x2={x2 - 4} y2={y2 - 18} stroke="#94a3b8" strokeWidth="1" />
                    <line x1={x1 + 4} y1={y1 + 18} x2={x2 - 4} y2={y2 + 18} stroke="#94a3b8" strokeWidth="1" />
                    {[-12, -4, 4, 12].map((dy) => (
                        <line key={dy} x1={x1 + 4} y1={y1 + dy} x2={x2 - 4} y2={y2 + dy} stroke="#cbd5e1" strokeWidth="0.8" />
                    ))}
                </g>
            )}
            {/* Recombination nodules — Pachytene */}
            {stage === 2 &&
                Array.from({ length: chiasmata }).map((_, i) => {
                    const ty = y1 - 10 + ((i + 1) / (chiasmata + 1)) * 20;
                    return <circle key={i} cx={mx} cy={ty} r="4" fill="#fbbf24" stroke="#a16207" strokeWidth="1.2" />;
                })}
            {/* Chiasmata X-shapes — Diplotene */}
            {stage === 3 &&
                Array.from({ length: chiasmata }).map((_, i) => {
                    const ty = y1 - 10 + ((i + 1) / (chiasmata + 1)) * 20;
                    return (
                        <g key={i}>
                            <line x1={x1 + 6} y1={ty - 5} x2={x2 - 6} y2={ty + 5} stroke={colMat} strokeWidth="2.5" />
                            <line x1={x1 + 6} y1={ty + 5} x2={x2 - 6} y2={ty - 5} stroke={colPat} strokeWidth="2.5" />
                        </g>
                    );
                })}
            {/* Terminalisation — Diakinesis (chiasmata at ends) */}
            {stage === 4 && (
                <g>
                    <line x1={x1 + 4} y1={y1 - 20} x2={x2 - 4} y2={y2 - 20} stroke={colMat} strokeWidth="2" />
                    <line x1={x1 + 4} y1={y1 + 20} x2={x2 - 4} y2={y2 + 20} stroke={colPat} strokeWidth="2" />
                </g>
            )}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Cytokinesis: cleavage furrow (animal) or cell plate (plant)
// ═══════════════════════════════════════════════════════════════════════════
const Cytokinesis: React.FC<{ cx: number; cy: number; r: number; style: Cytokinesis; progress: number }> = ({
    cx,
    cy,
    r,
    style,
    progress,
}) => {
    if (style === 'animal') {
        // cleavage furrow: indents from top and bottom
        const indent = progress * 30;
        return (
            <g>
                <path
                    d={`M${cx},${cy - r} q-${indent} ${r * 0.6} 0 ${r * 1.2 + indent * 0.5}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                />
                <path
                    d={`M${cx},${cy - r} q${indent} ${r * 0.6} 0 ${r * 1.2 + indent * 0.5}`}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                />
                <text x={cx + 8} y={cy + r - 10} fontSize="9" fontWeight="800" fill="#475569">
                    cleavage furrow
                </text>
            </g>
        );
    }
    // plant: cell plate growing across the middle
    const grow = progress;
    return (
        <g>
            <line x1={cx - r * 0.85 * grow} y1={cy} x2={cx + r * 0.85 * grow} y2={cy} stroke="#16a34a" strokeWidth="3" />
            {Array.from({ length: Math.round(grow * 14) }).map((_, i) => (
                <circle key={i} cx={cx - r * 0.85 + (i / 14) * r * 1.7} cy={cy} r="3" fill="#16a34a" />
            ))}
            <text x={cx + 8} y={cy - 8} fontSize="9" fontWeight="800" fill="#15803d">
                cell plate
            </text>
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Dyad of cells (after Telophase I) — two adjacent haploid cells
// ═══════════════════════════════════════════════════════════════════════════
const Dyad: React.FC<{ cx: number; cy: number; r: number; ctx: ArenaContext; phase: string }> = ({ cx, cy, r, ctx, phase }) => {
    const subR = r * 0.55;
    const gap = subR * 1.05;
    const renderCell = (ox: number, side: 'left' | 'right') => (
        <g>
            <circle cx={ox} cy={cy} r={subR} fill="url(#cellInside)" stroke="#cbd5e1" strokeWidth="2" />
            <DyadContents cx={ox} cy={cy} r={subR} ctx={ctx} phase={phase} side={side} />
        </g>
    );
    return (
        <g>
            {renderCell(cx - gap / 2, 'left')}
            {renderCell(cx + gap / 2, 'right')}
        </g>
    );
};

const DyadContents: React.FC<{ cx: number; cy: number; r: number; ctx: ArenaContext; phase: string; side: 'left' | 'right' }> = ({
    cx,
    cy,
    r,
    ctx,
    phase,
    side,
}) => {
    // Each daughter cell has n chromosomes (haploid). In Meiosis II, advance with current ctx.meiosisIIPhase.
    const pairs = ctx.pairs;
    const equatorY = cy;
    const spacing = 36;
    const offsetTotal = (pairs - 1) * spacing;
    const stage = ctx.meiosisStage;
    const sub = ctx.meiosisIIPhase;
    const phase2 = MEIOSIS_II_PHASES[sub];

    // Which homologue ended up in this cell? Use side & orient seed
    const homologue = (i: number) => {
        const v = Math.sin(ctx.assortSeed * 7.3 + i * 2.1);
        const left = v > 0;
        return side === 'left' ? (left ? 'mat' : 'pat') : left ? 'pat' : 'mat';
    };

    const chromosomes: Array<{ x: number; y: number; color: string; split: boolean }> = [];

    for (let i = 0; i < pairs; i++) {
        const x = cx - offsetTotal / 2 + i * spacing;
        const col = PAIR_COLORS[i] || PAIR_COLORS[0];
        const color = homologue(i) === 'mat' ? col.mat : col.pat;
        if (stage === 'interkinesis' || (stage === 'II' && phase2 === 'Prophase II')) {
            const ang = (i / pairs) * Math.PI;
            const rad = (stage === 'II' && phase2 === 'Prophase II' ? (1 - ctx.progress) : 0.4) * r * 0.3;
            chromosomes.push({
                x: cx + Math.cos(ang) * rad,
                y: cy + Math.sin(ang) * rad - 6,
                color,
                split: false,
            });
        } else if (phase2 === 'Metaphase II') {
            chromosomes.push({ x, y: equatorY, color, split: false });
        } else if (phase2 === 'Anaphase II') {
            const t = ctx.progress;
            const dx = (r - 18) * t;
            chromosomes.push({ x: x - dx, y: equatorY + (i - (pairs - 1) / 2) * 12, color, split: true });
            chromosomes.push({ x: x + dx, y: equatorY + (i - (pairs - 1) / 2) * 12, color, split: true });
        } else if (phase2 === 'Telophase II') {
            const dx = r - 18;
            chromosomes.push({ x: cx - dx, y: equatorY + (i - (pairs - 1) / 2) * 14, color, split: true });
            chromosomes.push({ x: cx + dx, y: equatorY + (i - (pairs - 1) / 2) * 14, color, split: true });
        } else if (phase === 'Telophase I') {
            // After Telophase I, chromosomes settle in each cell
            chromosomes.push({ x, y: equatorY + (i - (pairs - 1) / 2) * 14, color, split: false });
        }
    }

    return (
        <g>
            {/* Equator dashed (only when M-II is doing its alignment) */}
            {stage === 'II' && (phase2 === 'Metaphase II' || phase2 === 'Anaphase II') && (
                <line x1={cx - r + 10} y1={cy} x2={cx + r - 10} y2={cy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" opacity="0.55" />
            )}
            {/* Spindle in Meiosis II */}
            {stage === 'II' && (phase2 === 'Metaphase II' || phase2 === 'Anaphase II') && (
                <g opacity="0.6">
                    <line x1={cx - r + 8} y1={cy} x2={cx} y2={cy} stroke="#6366f1" strokeWidth="1" />
                    <line x1={cx + r - 8} y1={cy} x2={cx} y2={cy} stroke="#6366f1" strokeWidth="1" />
                </g>
            )}
            {/* Nuclear envelope during interkinesis & telophase II */}
            {(stage === 'interkinesis' || (stage === 'II' && phase2 === 'Telophase II')) && (
                <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
            )}
            {chromosomes.map((c, i) => (
                <g key={i} transform={`scale(0.6) translate(${c.x / 0.6 - cx * 0.667} ${c.y / 0.6 - cy * 0.667})`}>
                    <Chromosome x={cx} y={cy} rot={0} color={c.color} split={c.split} progress={ctx.progress} />
                </g>
            ))}
            {/* Simplified: just render at given coords scaled */}
            {chromosomes.map((c, i) => (
                <g key={`c-${i}`} transform={`translate(${c.x} ${c.y}) scale(0.65)`}>
                    {c.split ? (
                        <>
                            <rect x="-5" y="-22" width="10" height="44" rx="5" fill={c.color} stroke="#1f2937" strokeWidth="1" />
                            <circle cx="0" cy="0" r="4" fill="#1f2937" />
                        </>
                    ) : (
                        <>
                            <rect x="-9" y="-22" width="8" height="44" rx="4" fill={c.color} stroke="#1f2937" strokeWidth="1" />
                            <rect x="1" y="-22" width="8" height="44" rx="4" fill={c.color} stroke="#1f2937" strokeWidth="1" />
                            <circle cx="0" cy="0" r="5" fill="#1f2937" />
                            <circle cx="0" cy="0" r="2.5" fill="white" />
                        </>
                    )}
                </g>
            ))}
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Tetrad — final 4 haploid cells
// ═══════════════════════════════════════════════════════════════════════════
const Tetrad: React.FC<{ cx: number; cy: number; r: number; ctx: ArenaContext }> = ({ cx, cy, r, ctx }) => {
    const subR = r * 0.4;
    const off = subR * 1.05;
    const positions = [
        { x: cx - off, y: cy - off, side: 'tl' },
        { x: cx + off, y: cy - off, side: 'tr' },
        { x: cx - off, y: cy + off, side: 'bl' },
        { x: cx + off, y: cy + off, side: 'br' },
    ];
    return (
        <g>
            {positions.map((p, idx) => (
                <g key={idx}>
                    <circle cx={p.x} cy={p.y} r={subR} fill="url(#cellInside)" stroke="#cbd5e1" strokeWidth="1.8" />
                    <circle cx={p.x} cy={p.y} r={subR * 0.55} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                    {Array.from({ length: ctx.pairs }).map((_, i) => {
                        const col = PAIR_COLORS[i] || PAIR_COLORS[0];
                        // Determine which parental chromatid this cell ended up with — vary across positions to show recombinants
                        const variantA = (idx + i) % 2 === 0;
                        const variantB = (idx + i + 1) % 2 === 0;
                        const color = variantA ? col.mat : col.pat;
                        // Add a "recombinant stripe" on some chromosomes to show crossover effect
                        const cx2 = p.x - 18 + i * 18;
                        const cy2 = p.y;
                        return (
                            <g key={i} transform={`translate(${cx2} ${cy2}) scale(0.55)`}>
                                <rect x="-5" y="-20" width="10" height="40" rx="5" fill={color} stroke="#1f2937" strokeWidth="1" />
                                {variantB && (
                                    <rect x="-5" y="-2" width="10" height="14" fill={variantA ? col.pat : col.mat} opacity="0.85" />
                                )}
                                <circle cx="0" cy="0" r="3.5" fill="#1f2937" />
                            </g>
                        );
                    })}
                </g>
            ))}
            <text x={cx} y={cy} textAnchor="middle" fontSize="10" fontWeight="800" fill="#94a3b8">
                4 haploid · recombinant
            </text>
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Interphase preview (G1/S/G2)
// ═══════════════════════════════════════════════════════════════════════════
const InterphasePreview: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
    <g>
        <circle cx={cx} cy={cy} r="260" fill="url(#cellInside)" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="120" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" />
        {/* Fuzzy chromatin */}
        {Array.from({ length: 40 }).map((_, i) => {
            const ang = (i / 40) * Math.PI * 2 + (i % 3) * 0.4;
            const rad = 30 + (i % 5) * 18;
            const x = cx + Math.cos(ang) * rad;
            const y = cy + Math.sin(ang) * rad;
            return <path key={i} d={`M${x} ${y} q4 -8 10 -4 t14 -2`} stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.6" />;
        })}
        {/* G1/S/G2 chips */}
        {['G₁ growth', 'S DNA replicates', 'G₂ centrosome dup.'].map((t, i) => (
            <g key={t} transform={`translate(${cx - 200 + i * 200} ${cy + 200})`}>
                <rect x="-90" y="-16" width="180" height="32" rx="16" fill="white" stroke="#94a3b8" strokeWidth="1.5" />
                <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f172a">
                    {t}
                </text>
            </g>
        ))}
        <text x={cx} y={cy - 200} textAnchor="middle" fontSize="14" fontWeight="900" fill="#0f172a">
            Interphase (preparation for M phase)
        </text>
    </g>
);

// ═══════════════════════════════════════════════════════════════════════════
// Mini diagrams for left aside (NCERT Figs 10.2 / 10.3 / 10.4)
// ═══════════════════════════════════════════════════════════════════════════
const MitosisFigStrip: React.FC<{ activePhase: number }> = ({ activePhase }) => (
    <svg viewBox="0 0 240 82" className="w-full mt-2">
        {MITOSIS_PHASES.map((p, i) => {
            const x = 22 + i * 55;
            const active = activePhase === i;
            return (
                <g key={p}>
                    <circle cx={x} cy={32} r="22" fill={active ? '#e0e7ff' : 'white'} stroke={active ? '#4f46e5' : '#cbd5e1'} strokeWidth={active ? 2.5 : 1.5} />
                    <MiniMitosisGlyph cx={x} cy={32} phase={i} />
                    <text x={x} y={72} textAnchor="middle" fontSize="8" fontWeight={active ? 800 : 600} fill={active ? '#4338ca' : '#475569'}>
                        {p}
                    </text>
                </g>
            );
        })}
    </svg>
);

const MiniMitosisGlyph: React.FC<{ cx: number; cy: number; phase: number }> = ({ cx, cy, phase }) => {
    if (phase === 0)
        return (
            <g>
                <rect x={cx - 8} y={cy - 12} width="3" height="20" fill="#dc2626" />
                <rect x={cx + 5} y={cy - 12} width="3" height="20" fill="#2563eb" />
            </g>
        );
    if (phase === 1)
        return (
            <g>
                <rect x={cx - 6} y={cy - 12} width="3" height="20" fill="#dc2626" />
                <rect x={cx - 1} y={cy - 12} width="3" height="20" fill="#dc2626" />
                <rect x={cx + 5} y={cy - 12} width="3" height="20" fill="#2563eb" />
                <line x1={cx - 22} y1={cy} x2={cx + 22} y2={cy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
            </g>
        );
    if (phase === 2)
        return (
            <g>
                <rect x={cx - 22} y={cy - 8} width="3" height="14" fill="#dc2626" />
                <rect x={cx + 18} y={cy - 8} width="3" height="14" fill="#dc2626" />
                <rect x={cx - 18} y={cy + 2} width="3" height="14" fill="#2563eb" />
                <rect x={cx + 14} y={cy + 2} width="3" height="14" fill="#2563eb" />
            </g>
        );
    return (
        <g>
            <ellipse cx={cx - 14} cy={cy} rx="8" ry="10" fill="none" stroke="#64748b" strokeWidth="1" />
            <ellipse cx={cx + 14} cy={cy} rx="8" ry="10" fill="none" stroke="#64748b" strokeWidth="1" />
            <circle cx={cx - 14} cy={cy} r="3" fill="#dc2626" opacity="0.7" />
            <circle cx={cx + 14} cy={cy} r="3" fill="#2563eb" opacity="0.7" />
        </g>
    );
};

const MeiosisIFigStrip: React.FC<{ activePhase: number }> = ({ activePhase }) => (
    <svg viewBox="0 0 240 82" className="w-full mt-2">
        {MEIOSIS_I_PHASES.map((p, i) => {
            const x = 22 + i * 55;
            const active = activePhase === i;
            return (
                <g key={p}>
                    <circle cx={x} cy={32} r="22" fill={active ? '#d1fae5' : 'white'} stroke={active ? '#059669' : '#cbd5e1'} strokeWidth={active ? 2.5 : 1.5} />
                    <MiniMeiosisIGlyph cx={x} cy={32} phase={i} />
                    <text x={x} y={72} textAnchor="middle" fontSize="8" fontWeight={active ? 800 : 600} fill={active ? '#047857' : '#475569'}>
                        {p}
                    </text>
                </g>
            );
        })}
    </svg>
);

const MiniMeiosisIGlyph: React.FC<{ cx: number; cy: number; phase: number }> = ({ cx, cy, phase }) => {
    if (phase === 0)
        return (
            <g>
                <rect x={cx - 8} y={cy - 12} width="3" height="20" fill="#dc2626" />
                <rect x={cx - 3} y={cy - 12} width="3" height="20" fill="#f87171" />
                <line x1={cx - 8} y1={cy - 4} x2={cx - 0} y2={cy + 4} stroke="#fbbf24" strokeWidth="1.5" />
            </g>
        );
    if (phase === 1)
        return (
            <g>
                <rect x={cx - 8} y={cy - 12} width="3" height="20" fill="#dc2626" />
                <rect x={cx - 3} y={cy - 12} width="3" height="20" fill="#f87171" />
                <line x1={cx - 22} y1={cy} x2={cx + 22} y2={cy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
            </g>
        );
    if (phase === 2)
        return (
            <g>
                <rect x={cx - 22} y={cy - 8} width="3" height="14" fill="#dc2626" />
                <rect x={cx - 18} y={cy - 8} width="3" height="14" fill="#dc2626" />
                <rect x={cx + 16} y={cy - 8} width="3" height="14" fill="#f87171" />
                <rect x={cx + 20} y={cy - 8} width="3" height="14" fill="#f87171" />
            </g>
        );
    return (
        <g>
            <ellipse cx={cx - 12} cy={cy} rx="9" ry="11" fill="none" stroke="#64748b" strokeWidth="1" />
            <ellipse cx={cx + 12} cy={cy} rx="9" ry="11" fill="none" stroke="#64748b" strokeWidth="1" />
        </g>
    );
};

const MeiosisIIFigStrip: React.FC<{ activePhase: number }> = ({ activePhase }) => (
    <svg viewBox="0 0 240 82" className="w-full mt-2">
        {MEIOSIS_II_PHASES.map((p, i) => {
            const x = 22 + i * 55;
            const active = activePhase === i;
            return (
                <g key={p}>
                    <circle cx={x} cy={32} r="22" fill={active ? '#d1fae5' : 'white'} stroke={active ? '#059669' : '#cbd5e1'} strokeWidth={active ? 2.5 : 1.5} />
                    <MiniMitosisGlyph cx={x} cy={32} phase={i} />
                    <text x={x} y={72} textAnchor="middle" fontSize="8" fontWeight={active ? 800 : 600} fill={active ? '#047857' : '#475569'}>
                        {p}
                    </text>
                </g>
            );
        })}
    </svg>
);

const ProphaseISubStrip: React.FC<{ active: number }> = ({ active }) => (
    <svg viewBox="0 0 240 76" className="w-full mt-2">
        {PROPHASE_I_SUBS.map((s, i) => {
            const x = 18 + i * 46;
            const on = active === i;
            return (
                <g key={s}>
                    <circle cx={x} cy={26} r="17" fill={on ? '#d1fae5' : 'white'} stroke={on ? '#059669' : '#cbd5e1'} strokeWidth={on ? 2 : 1.5} />
                    <MiniProphaseGlyph cx={x} cy={26} stage={i} />
                    <text x={x} y={60} textAnchor="middle" fontSize="7" fontWeight={on ? 800 : 600} fill={on ? '#047857' : '#475569'}>
                        {s}
                    </text>
                </g>
            );
        })}
    </svg>
);

const MiniProphaseGlyph: React.FC<{ cx: number; cy: number; stage: number }> = ({ cx, cy, stage }) => {
    if (stage === 0)
        return (
            <g stroke="#dc2626" strokeWidth="1" fill="none">
                <path d={`M${cx - 12} ${cy - 8} q6 4 12 0`} />
                <path d={`M${cx - 12} ${cy + 2} q6 4 12 0`} />
            </g>
        );
    if (stage === 1)
        return (
            <g>
                <rect x={cx - 4} y={cy - 10} width="3" height="20" fill="#dc2626" />
                <rect x={cx + 1} y={cy - 10} width="3" height="20" fill="#f87171" />
                {[-6, 0, 6].map((dy) => (
                    <line key={dy} x1={cx - 4} y1={cy + dy} x2={cx + 4} y2={cy + dy} stroke="#94a3b8" strokeWidth="0.7" />
                ))}
            </g>
        );
    if (stage === 2)
        return (
            <g>
                <rect x={cx - 6} y={cy - 10} width="2.5" height="20" fill="#dc2626" />
                <rect x={cx - 2} y={cy - 10} width="2.5" height="20" fill="#dc2626" />
                <rect x={cx + 2} y={cy - 10} width="2.5" height="20" fill="#f87171" />
                <rect x={cx + 6} y={cy - 10} width="2.5" height="20" fill="#f87171" />
                <circle cx={cx} cy={cy} r="2" fill="#fbbf24" />
            </g>
        );
    if (stage === 3)
        return (
            <g stroke="#dc2626" strokeWidth="1.5">
                <line x1={cx - 6} y1={cy - 4} x2={cx + 6} y2={cy + 4} />
                <line x1={cx - 6} y1={cy + 4} x2={cx + 6} y2={cy - 4} stroke="#f87171" />
            </g>
        );
    return (
        <g>
            <ellipse cx={cx} cy={cy} rx="10" ry="6" fill="none" stroke="#64748b" strokeWidth="1" />
            <rect x={cx - 2} y={cy - 10} width="4" height="20" fill="#dc2626" opacity="0.6" />
        </g>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════
const ArenaLabel: React.FC<{ x: number; y: number; label: string; tone: string }> = ({ x, y, label, tone }) => (
    <g>
        <rect x={x - 100} y={y - 16} width="200" height="32" rx="16" fill="white" stroke={tone} strokeWidth="2" />
        <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fontWeight="900" fill={tone}>
            {label}
        </text>
    </g>
);

const Annotate: React.FC<{ x: number; y: number; text: string; color: string }> = ({ x, y, text, color }) => (
    <g>
        <line x1={x - 18} y1={y} x2={x - 4} y2={y} stroke={color} strokeWidth="1" opacity="0.6" />
        <text x={x} y={y + 3} fontSize="9" fontWeight="800" fill={color}>
            {text}
        </text>
    </g>
);

const FigCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
        <div className="text-base font-extrabold">{title}</div>
        <div className="text-xs font-semibold text-slate-500">{subtitle}</div>
        {children}
    </div>
);

const ValueRow: React.FC<{ label: string; value: string; tint: string; tone: string }> = ({ label, value, tint, tone }) => (
    <div className={`rounded-lg border border-slate-100 ${tint} px-3 py-2`}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className={`mt-0.5 font-mono text-[13px] font-extrabold truncate ${tone}`}>{value}</div>
    </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode; icon?: React.ReactNode; className?: string }> = ({ children, icon, className = '' }) => (
    <div className={`text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1 ${className}`}>
        {icon}
        {children}
    </div>
);

const ComparisonTable: React.FC = () => (
    <div className="mt-2 text-[10.5px] leading-snug text-slate-800">
        <table className="w-full table-fixed">
            <colgroup>
                <col className="w-[28%]" />
                <col className="w-[32%]" />
                <col className="w-[40%]" />
            </colgroup>
            <thead>
                <tr>
                    <th className="text-left font-extrabold pb-1">Feature</th>
                    <th className="text-left font-extrabold pb-1 text-indigo-700">Mitosis</th>
                    <th className="text-left font-extrabold pb-1 text-emerald-700">Meiosis</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
                {[
                    ['Type', 'Equational', 'Reductional + Equational'],
                    ['Site', 'Somatic cells', 'Gametogenic diploid cells'],
                    ['Cycles', '1', '2 (I & II)'],
                    ['DNA replication', 'Once', 'Once (none in interkinesis)'],
                    ['Homologue pairing', 'No', 'Yes (bivalents)'],
                    ['Metaphase', 'Single file', 'M-I: bivalents; M-II: single'],
                    ['Anaphase', 'Centromeres split', 'A-I: homologues; A-II: split'],
                    ['Daughters', '2 diploid', '4 haploid'],
                    ['Variability', 'Identical', 'Recombinant'],
                ].map(([f, m1, m2]) => (
                    <tr key={f} className="align-top">
                        <td className="py-1 pr-1 font-semibold text-slate-700 break-words">{f}</td>
                        <td className="py-1 pr-1 text-indigo-700 break-words">{m1}</td>
                        <td className="py-1 text-emerald-700 break-words">{m2}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default MitosisMeiosisStagesLab;
