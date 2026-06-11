import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Activity,
    Atom,
    Beaker,
    Dna,
    Droplets,
    FlaskConical,
    Layers,
    Microscope,
    Pause,
    Play,
    PieChart,
    RotateCcw,
    ScanEye,
    Shuffle,
    Sprout,
    Tag,
    Waves,
    Zap,
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface BiomoleculesLabProps { topic: any; onExit: () => void }

type Mode = 'carbs' | 'lipids' | 'proteins' | 'nucleic' | 'composition';
type CarbSub = 'glucose' | 'ribose' | 'fructose' | 'starch' | 'cellulose' | 'glycogen' | 'inulin' | 'chitin';
type LipidSub = 'palmitic' | 'arachidonic' | 'glycerol' | 'mono' | 'di' | 'triglyceride' | 'phospholipid' | 'cholesterol';
type AminoSub = 'glycine' | 'alanine' | 'serine' | 'glutamic' | 'lysine' | 'valine' | 'tyrosine' | 'tryptophan';
type ProteinLevel = 'primary' | 'secondary' | 'tertiary' | 'quaternary';
type BaseSub = 'adenine' | 'guanine' | 'cytosine' | 'thymine' | 'uracil';
type SugarSub = 'ribose' | 'deoxyribose';
type CompositionSub = 'water' | 'protein' | 'nucleic' | 'carb' | 'lipid' | 'ion';

const W = 1280;
const H = 760;

const MODE_META: Record<Mode, { label: string; color: string; light: string; section: string; figure: string }> = {
    carbs: { label: 'Carbohydrates', color: '#d97706', light: '#fffbeb', section: 'Ch 9 - Section 9.5', figure: 'Fig 9.2' },
    lipids: { label: 'Lipids', color: '#059669', light: '#ecfdf5', section: 'Ch 9 - Section 9.3', figure: 'Fig 9.1' },
    proteins: { label: 'Proteins', color: '#4f46e5', light: '#eef2ff', section: 'Ch 9 - Sections 9.4, 9.7', figure: 'Fig 9.3' },
    nucleic: { label: 'Nucleic Acids', color: '#7c3aed', light: '#f5f3ff', section: 'Ch 9 - Section 9.6', figure: 'Fig 9.1' },
    composition: { label: 'Cell Composition', color: '#475569', light: '#f8fafc', section: 'Ch 9 - Table 9.4', figure: 'Table 9.4' },
};

const CARB_INFO: Record<CarbSub, { label: string; formula: string; className: string; mw: string; narration: string }> = {
    glucose: { label: 'Glucose', formula: 'C6H12O6', className: 'Micromolecule', mw: '180 Da - micro', narration: 'Glucose is a hexose monosaccharide shown in NCERT Fig 9.1 as a small molecular weight sugar.' },
    ribose: { label: 'Ribose', formula: 'C5H10O5', className: 'Micromolecule', mw: '150 Da - micro', narration: 'Ribose is a pentose sugar; nucleic acids use ribose or 2-deoxyribose as their sugar component.' },
    fructose: { label: 'Fructose', formula: 'C6H12O6', className: 'Micromolecule', mw: '180 Da - micro', narration: 'Fructose is shown here because NCERT names inulin as a polymer of fructose units.' },
    starch: { label: 'Starch', formula: 'glucose polymer', className: 'Biomacromolecule', mw: '>10,000 Da - macro', narration: 'Starch stores energy in plants. Its helical secondary structure can hold I2, producing the blue starch-iodine complex.' },
    cellulose: { label: 'Cellulose', formula: 'glucose homopolymer', className: 'Biomacromolecule', mw: '>10,000 Da - macro', narration: 'Cellulose is a glucose homopolymer in plant cell walls, paper, and cotton. It lacks helices and cannot hold iodine.' },
    glycogen: { label: 'Glycogen', formula: 'branched glucose polymer', className: 'Biomacromolecule', mw: '>10,000 Da - macro', narration: 'Glycogen stores energy in animals and is branched. NCERT Fig 9.2 marks a non-reducing end and a reducing end.' },
    inulin: { label: 'Inulin', formula: 'fructose polymer', className: 'Biomacromolecule', mw: '>10,000 Da - macro', narration: 'Inulin is identified by NCERT as a polymer of fructose, so the chain uses pentose-like fructose units here.' },
    chitin: { label: 'Chitin', formula: 'amino-sugar polymer', className: 'Biomacromolecule', mw: '>10,000 Da - macro', narration: 'Chitin is a complex polysaccharide in arthropod exoskeletons, built from amino-sugars and modified sugars.' },
};

const LIPID_INFO: Record<LipidSub, { label: string; className: string; mw: string; narration: string }> = {
    palmitic: { label: 'Palmitic acid', className: 'Micromolecule lipid', mw: '256 Da - lipid', narration: 'Palmitic acid has 16 carbons including the carboxyl carbon and is saturated: no C=C double bond.' },
    arachidonic: { label: 'Arachidonic acid', className: 'Micromolecule lipid', mw: '304 Da - lipid', narration: 'Arachidonic acid has 20 carbons and is unsaturated, so kinks are drawn at double-bond positions.' },
    glycerol: { label: 'Glycerol', className: 'Micromolecule lipid unit', mw: '92 Da - micro', narration: 'Glycerol is trihydroxy propane, drawn with three -OH sockets that can esterify fatty acids.' },
    mono: { label: 'Monoglyceride', className: 'Lipid', mw: '<800 Da - lipid', narration: 'One fatty acid is esterified with glycerol; one water molecule is released during condensation.' },
    di: { label: 'Diglyceride', className: 'Lipid', mw: '<800 Da - lipid', narration: 'Two fatty acids are esterified with glycerol; the molecule is moving toward a triglyceride.' },
    triglyceride: { label: 'Triglyceride', className: 'Lipid', mw: '<800 Da - lipid', narration: 'Three fatty acids esterified to glycerol form a triglyceride, a fat or oil depending on melting point.' },
    phospholipid: { label: 'Phospholipid - lecithin', className: 'Membrane-associated lipid', mw: '<800 Da - lipid exception', narration: 'Phospholipids contain phosphorus and a phosphorylated organic compound. Lecithin is the NCERT example.' },
    cholesterol: { label: 'Cholesterol', className: 'Lipid', mw: '386 Da - lipid', narration: 'Cholesterol is shown in NCERT Fig 9.1 and also appears as a membrane lipid in Class 11 cell biology.' },
};

const AMINO_INFO: Record<AminoSub, { label: string; r: string; group: string; color: string; narration: string }> = {
    glycine: { label: 'Glycine', r: '-H', group: 'Fig 9.1 amino acid', color: '#06b6d4', narration: 'Glycine is one of the amino acid examples shown in NCERT Fig 9.1.' },
    alanine: { label: 'Alanine', r: '-CH3', group: 'Fig 9.1 amino acid', color: '#f59e0b', narration: 'Alanine changes the same amino acid backbone by replacing R with -CH3.' },
    serine: { label: 'Serine', r: '-CH2OH', group: 'Fig 9.1 amino acid', color: '#22c55e', narration: 'Serine carries a hydroxyl-bearing side chain on the common amino acid backbone.' },
    glutamic: { label: 'Glutamic acid', r: '-acidic side chain', group: 'Acidic', color: '#ef4444', narration: 'NCERT names glutamic acid as an acidic amino acid example.' },
    lysine: { label: 'Lysine', r: '-basic side chain', group: 'Basic', color: '#8b5cf6', narration: 'NCERT names lysine as a basic amino acid example.' },
    valine: { label: 'Valine', r: '-aliphatic', group: 'Neutral', color: '#64748b', narration: 'NCERT names valine as a neutral amino acid example.' },
    tyrosine: { label: 'Tyrosine', r: '-aromatic', group: 'Aromatic', color: '#0ea5e9', narration: 'NCERT names tyrosine as an aromatic amino acid example.' },
    tryptophan: { label: 'Tryptophan', r: '-aromatic', group: 'Aromatic', color: '#db2777', narration: 'Tryptophan is another NCERT-named aromatic amino acid.' },
};

const BASE_INFO: Record<BaseSub, { label: string; symbol: string; family: string; color: string; pair: string; nucleoside: string; nucleotide: string }> = {
    adenine: { label: 'Adenine', symbol: 'A', family: 'Purine', color: '#6366f1', pair: 'T or U', nucleoside: 'Adenosine', nucleotide: 'Adenylic acid' },
    guanine: { label: 'Guanine', symbol: 'G', family: 'Purine', color: '#4f46e5', pair: 'C', nucleoside: 'Guanosine', nucleotide: 'Guanylic acid' },
    cytosine: { label: 'Cytosine', symbol: 'C', family: 'Pyrimidine', color: '#f43f5e', pair: 'G', nucleoside: 'Cytidine', nucleotide: 'Cytidylic acid' },
    thymine: { label: 'Thymine', symbol: 'T', family: 'Pyrimidine', color: '#e11d48', pair: 'A', nucleoside: 'Thymidine', nucleotide: 'Thymidylic acid' },
    uracil: { label: 'Uracil', symbol: 'U', family: 'Pyrimidine', color: '#fb7185', pair: 'A', nucleoside: 'Uridine', nucleotide: 'Uridylic acid' },
};

const COMPOSITION = [
    { id: 'water' as CompositionSub, label: 'Water', value: 80, range: '70-90%', color: '#38bdf8' },
    { id: 'protein' as CompositionSub, label: 'Proteins', value: 12, range: '10-15%', color: '#6366f1' },
    { id: 'nucleic' as CompositionSub, label: 'Nucleic acids', value: 6, range: '5-7%', color: '#a855f7' },
    { id: 'carb' as CompositionSub, label: 'Carbohydrates', value: 3, range: '3%', color: '#f59e0b' },
    { id: 'lipid' as CompositionSub, label: 'Lipids', value: 2, range: '2%', color: '#10b981' },
    { id: 'ion' as CompositionSub, label: 'Ions', value: 1, range: '1%', color: '#64748b' },
];

const PROTEIN_LEVELS: ProteinLevel[] = ['primary', 'secondary', 'tertiary', 'quaternary'];

const BiomoleculesLab: React.FC<BiomoleculesLabProps> = ({ topic, onExit }) => {
    const rafRef = useRef<number | null>(null);
    const lastRef = useRef<number>(0);
    const [time, setTime] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [mode, setMode] = useState<Mode>('carbs');
    const [modeStamp, setModeStamp] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [labels, setLabels] = useState(true);
    const [callouts, setCallouts] = useState(true);
    const [carbSub, setCarbSub] = useState<CarbSub>('starch');
    const [iodineAdded, setIodineAdded] = useState(false);
    const [lipidSub, setLipidSub] = useState<LipidSub>('palmitic');
    const [fattyAcids, setFattyAcids] = useState(1);
    const [aminoSub, setAminoSub] = useState<AminoSub>('glycine');
    const [proteinLevel, setProteinLevel] = useState<ProteinLevel>('primary');
    const [proteinProgress, setProteinProgress] = useState(0);
    const [pH, setPH] = useState(7);
    const [baseSub, setBaseSub] = useState<BaseSub>('adenine');
    const [sugarSub, setSugarSub] = useState<SugarSub>('deoxyribose');
    const [phosphateAttached, setPhosphateAttached] = useState(false);
    const [nucleotideLength, setNucleotideLength] = useState(4);
    const [compositionSub, setCompositionSub] = useState<CompositionSub>('water');
    const [monomerCount, setMonomerCount] = useState(3);
    const [waterReleased, setWaterReleased] = useState(0);
    const [actionStamp, setActionStamp] = useState(-10);

    useEffect(() => {
        const tick = (t: number) => {
            const last = lastRef.current || t;
            let dt = (t - last) / 1000;
            if (dt > 0.1) dt = 0.1;
            lastRef.current = t;
            if (playing) {
                setTime((prev) => prev + dt * speed);
                const target = PROTEIN_LEVELS.indexOf(proteinLevel);
                setProteinProgress((prev) => {
                    const next = prev + (target - prev) * Math.min(1, dt * 3.2);
                    return Math.abs(next - target) < 0.01 ? target : next;
                });
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            lastRef.current = 0;
        };
    }, [playing, proteinLevel, speed]);

    const triggerCondensation = useCallback(() => {
        setActionStamp(time);
        setWaterReleased((n) => n + 1);
    }, [time]);

    const handleMode = useCallback((next: Mode) => {
        setMode(next);
        setModeStamp(time);
        setPlaying(true);
    }, [time]);

    const setSubByMode = useCallback((id: string) => {
        if (mode === 'carbs') setCarbSub(id as CarbSub);
        if (mode === 'lipids') {
            const lipid = id as LipidSub;
            setLipidSub(lipid);
            if (lipid === 'mono') setFattyAcids(1);
            if (lipid === 'di') setFattyAcids(2);
            if (lipid === 'triglyceride') setFattyAcids(3);
        }
        if (mode === 'proteins') setAminoSub(id as AminoSub);
        if (mode === 'nucleic') setBaseSub(id as BaseSub);
        if (mode === 'composition') setCompositionSub(id as CompositionSub);
    }, [mode]);

    const handleAction = useCallback((action: string) => {
        if (action === 'polymerise') {
            setMonomerCount((n) => Math.min(12, n + 1));
            triggerCondensation();
        }
        if (action === 'iodine') setIodineAdded(true);
        if (action === 'hydrolyse') {
            setMonomerCount((n) => Math.max(1, n - 1));
            setFattyAcids((n) => Math.max(0, n - 1));
        }
        if (action === 'esterify') {
            setFattyAcids((n) => Math.min(3, n + 1));
            setLipidSub((prev) => {
                const next = Math.min(3, fattyAcids + 1);
                if (next === 1) return 'mono';
                if (next === 2) return 'di';
                if (next === 3) return 'triglyceride';
                return prev;
            });
            triggerCondensation();
        }
        if (action === 'peptide') {
            setMonomerCount((n) => Math.min(12, n + 1));
            triggerCondensation();
        }
        if (action === 'assemble') {
            setPhosphateAttached(true);
            setActionStamp(time);
        }
        if (action === 'nucleotide-poly') {
            setNucleotideLength((n) => Math.min(8, n + 1));
            triggerCondensation();
        }
        if (action === 'rna-dna') {
            setSugarSub((s) => s === 'ribose' ? 'deoxyribose' : 'ribose');
            setBaseSub((b) => b === 'thymine' ? 'uracil' : b === 'uracil' ? 'thymine' : b);
        }
    }, [fattyAcids, time, triggerCondensation]);

    const resetLab = useCallback(() => {
        setTime(0);
        setPlaying(true);
        setMode('carbs');
        setSpeed(1);
        setLabels(true);
        setCallouts(true);
        setCarbSub('starch');
        setIodineAdded(false);
        setLipidSub('palmitic');
        setFattyAcids(1);
        setAminoSub('glycine');
        setProteinLevel('primary');
        setProteinProgress(0);
        setPH(7);
        setBaseSub('adenine');
        setSugarSub('deoxyribose');
        setPhosphateAttached(false);
        setNucleotideLength(4);
        setCompositionSub('water');
        setMonomerCount(3);
        setWaterReleased(0);
        setActionStamp(-10);
        setModeStamp(0);
    }, []);

    const active = useMemo(() => {
        if (mode === 'carbs') return {
            sub: CARB_INFO[carbSub].label,
            formula: CARB_INFO[carbSub].formula,
            className: CARB_INFO[carbSub].className,
            mw: CARB_INFO[carbSub].mw,
            narration: CARB_INFO[carbSub].narration,
            significance: ['Polysaccharides are long chains of sugars.', 'Storage forms: starch in plants, glycogen in animals.', 'Cellulose and chitin are structural polysaccharides.'],
        };
        if (mode === 'lipids') return {
            sub: LIPID_INFO[lipidSub].label,
            formula: lipidSub === 'phospholipid' ? 'lecithin model' : lipidSub === 'cholesterol' ? 'four-ring sterol' : 'R-COOH / glyceride',
            className: LIPID_INFO[lipidSub].className,
            mw: LIPID_INFO[lipidSub].mw,
            narration: LIPID_INFO[lipidSub].narration,
            significance: ['Lipids are generally water-insoluble.', 'They appear in the acid-insoluble fraction because membrane pieces separate with that pellet.', 'Fats and oils are glycerides.'],
        };
        if (mode === 'proteins') return {
            sub: AMINO_INFO[aminoSub].label,
            formula: aminoCharge(pH).formula,
            className: 'Heteropolymer of amino acids',
            mw: '>10,000 Da - macro',
            narration: `${AMINO_INFO[aminoSub].narration} Proteins are polypeptides linked by peptide bonds and organised into primary, secondary, tertiary and quaternary levels.`,
            significance: ['Collagen: intercellular ground substance.', 'Trypsin: enzyme; insulin: hormone.', 'Adult haemoglobin has 2 alpha + 2 beta subunits.'],
        };
        if (mode === 'nucleic') {
            const base = BASE_INFO[baseSub];
            return {
                sub: phosphateAttached ? base.nucleotide : base.nucleoside,
                formula: `${sugarSub === 'ribose' ? 'Ribose' : '2-deoxyribose'} + ${base.symbol}${phosphateAttached ? ' + PO4' : ''}`,
                className: 'Polynucleotide building block',
                mw: phosphateAttached ? 'nucleotide - micro' : 'nucleoside - micro',
                narration: `${base.label} is a ${base.family.toLowerCase()}. Base + sugar forms a nucleoside; adding phosphate makes a nucleotide.`,
                significance: ['DNA and RNA consist of nucleotides only.', 'DNA contains 2-deoxyribose; RNA contains ribose.', 'Nucleic acids serve as genetic material.'],
            };
        }
        const item = COMPOSITION.find((entry) => entry.id === compositionSub) ?? COMPOSITION[0];
        return {
            sub: item.label,
            formula: item.range,
            className: 'Average cellular composition',
            mw: 'Table 9.4',
            narration: `NCERT Table 9.4 summarises the average composition of cells. ${item.label} is highlighted at ${item.range}.`,
            significance: ['Water is the most abundant chemical in living organisms.', 'Proteins, nucleic acids, polysaccharides and lipids appear in the acid-insoluble fraction.', 'Micromolecules are below 1000 Da; biomacromolecules are about 10,000 Da and above.'],
        };
    }, [aminoSub, baseSub, carbSub, compositionSub, lipidSub, mode, pH, phosphateAttached, sugarSub]);

    const bondGrow = Math.max(0, Math.min(1, (time - actionStamp) * 2.5));
    const waterAlpha = Math.max(0, 1 - (time - actionStamp) * 1.6);
    const modeAlpha = Math.max(0.25, Math.min(1, 0.35 + (time - modeStamp) * 4));

    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+12px)] top-0 bottom-0 z-20 hidden w-[300px] 2xl:block overflow-y-auto overflow-x-hidden pr-1">
            <div className="flex flex-col gap-2.5">
                <AsideCard title="NCERT Fig 9.1" subtitle="Small organic compounds" icon={<Microscope size={15} className="text-cyan-700" />}>
                    <svg viewBox="0 0 250 116" className="h-[116px] w-full">
                        <Ring cx={42} cy={54} sides={6} r={28} fill="#fef3c7" stroke="#d97706" label="Glucose" />
                        <path d="M92 72 C125 30 150 82 183 42 S224 62 236 38" fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" />
                        <text x="166" y="101" textAnchor="middle" fontSize="12" fontWeight="800" fill="#92400e">Palmitic chain</text>
                        <circle cx="112" cy="28" r="17" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
                        <text x="112" y="33" textAnchor="middle" fontSize="11" fontWeight="900" fill="#075985">AA</text>
                        <BaseShape x={206} y={86} purine color="#6366f1" label="A" small />
                    </svg>
                </AsideCard>
                <AsideCard title="Macromolecule Classes" subtitle="NCERT Section 9.3" icon={<Layers size={15} className="text-indigo-700" />}>
                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                        <MiniLine color="#4f46e5" label="Proteins" text="heteropolymers of 20 amino acids" />
                        <MiniLine color="#7c3aed" label="Nucleic acids" text="polynucleotides: DNA and RNA" />
                        <MiniLine color="#d97706" label="Polysaccharides" text="sugar polymers, true biomacromolecules" />
                        <MiniLine color="#059669" label="Lipids" text="<=800 Da but membrane associated" />
                    </div>
                </AsideCard>
                <AsideCard title="NCERT Fig 9.2 - Glycogen" subtitle="Branched energy store" icon={<Sprout size={15} className="text-amber-700" />}>
                    <svg viewBox="0 0 250 116" className="h-[116px] w-full">
                        <GlycogenMini x={22} y={20} />
                    </svg>
                </AsideCard>
                <AsideCard title="NCERT Fig 9.3" subtitle="Protein hierarchy" icon={<Activity size={15} className="text-indigo-700" />}>
                    <svg viewBox="0 0 250 122" className="h-[122px] w-full">
                        <ProteinMini />
                    </svg>
                </AsideCard>
            </div>
        </aside>
    );

    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+12px)] top-0 bottom-0 z-20 hidden w-[300px] 2xl:block overflow-y-auto overflow-x-hidden pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border p-4 shadow-xl" style={{ background: MODE_META[mode].light, borderColor: `${MODE_META[mode].color}40` }}>
                    <div className="mb-1 flex items-center gap-2 text-base font-extrabold" style={{ color: MODE_META[mode].color }}>
                        <ScanEye size={16} />
                        {MODE_META[mode].label}
                    </div>
                    <div className="mb-3 text-xs font-semibold" style={{ color: MODE_META[mode].color }}>{MODE_META[mode].section}</div>
                    <p className="text-sm font-semibold leading-snug text-slate-800">{active.narration}</p>
                    <div className="mt-3 space-y-1.5">
                        {active.significance.map((line) => (
                            <div key={line} className="rounded-lg border border-white bg-white/80 px-2.5 py-1.5 text-xs font-bold text-slate-700">{line}</div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="text-base font-extrabold text-slate-900">Real-time values</div>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">LIVE</span>
                    </div>
                    <div className="grid gap-2">
                        <ValueRow label="Mode" value={MODE_META[mode].label} tint="#f8fafc" color="#334155" />
                        <ValueRow label="Sub-molecule" value={active.sub} tint={MODE_META[mode].light} color={MODE_META[mode].color} />
                        <ValueRow label="Class" value={active.className} tint="#f8fafc" color="#334155" />
                        <ValueRow label="Molecular weight" value={active.mw} tint="#f8fafc" color="#334155" />
                        <ValueRow label="Monomer count" value={`${monomerCount}`} tint="#fff7ed" color="#c2410c" />
                        <ValueRow label="H2O released" value={`${waterReleased}`} tint="#ecfeff" color="#0891b2" />
                        <ValueRow label="NCERT figure" value={MODE_META[mode].figure} tint="#f8fafc" color="#334155" />
                    </div>
                </div>
            </div>
        </aside>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="NCERT biomolecules interactive simulation">
                    <defs>
                        <filter id="goldGlow" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="helixBlue" x1="0" x2="1">
                            <stop offset="0%" stopColor="#1d4ed8" />
                            <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                    </defs>
                    <rect width={W} height={H} fill="#ffffff" />
                    <text x="40" y="30" fontSize="18" fontStyle="italic" fontWeight="800" fill="#0f172a">Biomolecules - NCERT Ch 9 - Fig 9.1 / 9.2 / 9.3</text>
                    <text x="40" y="56" fontSize="12" fontWeight="700" fill="#64748b">{MODE_META[mode].label} - {active.sub} - {active.formula}</text>
                    <rect x="970" y="18" width="230" height="34" rx="17" fill={MODE_META[mode].light} stroke={MODE_META[mode].color} strokeWidth="1.5" />
                    <text x="1085" y="40" textAnchor="middle" fontSize="13" fontWeight="900" fill={MODE_META[mode].color}>{MODE_META[mode].label}</text>
                    <g opacity={modeAlpha}>
                        {mode === 'carbs' && <CarbohydrateStage sub={carbSub} time={time} labels={labels} iodineAdded={iodineAdded} monomerCount={monomerCount} bondGrow={bondGrow} waterAlpha={waterAlpha} />}
                        {mode === 'lipids' && <LipidStage sub={lipidSub} fattyAcids={fattyAcids} time={time} labels={labels} bondGrow={bondGrow} waterAlpha={waterAlpha} />}
                        {mode === 'proteins' && <ProteinStage amino={aminoSub} pH={pH} level={proteinLevel} progress={proteinProgress} labels={labels} bondGrow={bondGrow} waterAlpha={waterAlpha} />}
                        {mode === 'nucleic' && <NucleicStage base={baseSub} sugar={sugarSub} phosphate={phosphateAttached} length={nucleotideLength} time={time} labels={labels} bondGrow={bondGrow} waterAlpha={waterAlpha} />}
                        {mode === 'composition' && <CompositionStage selected={compositionSub} time={time} onSelect={setCompositionSub} />}
                    </g>
                    {callouts && (
                        <g>
                            <rect x="38" y="704" width="220" height="32" rx="16" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                            <text x="148" y="724" textAnchor="middle" fontSize="11" fontWeight="900" fill="#475569">Ref: {MODE_META[mode].figure}</text>
                        </g>
                    )}
                </svg>
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={() => setPlaying((p) => !p)}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title={playing ? 'Pause' : 'Play'}
                        type="button"
                    >
                        {playing ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                    <button
                        onClick={resetLab}
                        className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow transition-colors hover:bg-slate-50"
                        title="Reset"
                        type="button"
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    const controlsCombo = (
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain bg-white text-slate-900">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-800">
                <Beaker size={16} className="text-indigo-700" />
                Biomolecules Bench
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                <ControlGroup icon={<Atom size={14} className="text-slate-700" />} label="Topic mode">
                    <div className="grid grid-cols-1 gap-1.5">
                        {(Object.keys(MODE_META) as Mode[]).map((item) => (
                            <SegmentButton key={item} active={mode === item} color={MODE_META[item].color} onClick={() => handleMode(item)}>
                                {MODE_META[item].label}
                            </SegmentButton>
                        ))}
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Tag size={14} className="text-slate-700" />} label="Sub-molecule">
                    <div className="grid grid-cols-2 gap-1.5">
                        {subOptions(mode).map((item) => (
                            <SegmentButton key={item.id} active={activeSubId(mode, carbSub, lipidSub, aminoSub, baseSub, compositionSub) === item.id} color={MODE_META[mode].color} onClick={() => setSubByMode(item.id)}>
                                {item.label}
                            </SegmentButton>
                        ))}
                    </div>
                    {mode === 'nucleic' && (
                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                            {(['ribose', 'deoxyribose'] as SugarSub[]).map((item) => (
                                <SegmentButton key={item} active={sugarSub === item} color="#7c3aed" onClick={() => setSugarSub(item)}>
                                    {item === 'ribose' ? 'Ribose' : 'Deoxy'}
                                </SegmentButton>
                            ))}
                            <SegmentButton active={phosphateAttached} color="#ca8a04" onClick={() => setPhosphateAttached((p) => !p)}>
                                Phosphate
                            </SegmentButton>
                        </div>
                    )}
                </ControlGroup>
                <ControlGroup icon={<Zap size={14} className="text-slate-700" />} label="Action">
                    <div className="grid gap-1.5">
                        {mode === 'carbs' && (
                            <>
                                <ActionButton icon={<Sprout size={13} />} onClick={() => handleAction('polymerise')}>Polymerise</ActionButton>
                                <ActionButton icon={<FlaskConical size={13} />} onClick={() => handleAction('iodine')}>Add I2</ActionButton>
                                <ActionButton icon={<Droplets size={13} />} onClick={() => handleAction('hydrolyse')}>Hydrolyse</ActionButton>
                            </>
                        )}
                        {mode === 'lipids' && (
                            <>
                                <ActionButton icon={<Shuffle size={13} />} onClick={() => handleAction('esterify')}>Esterify</ActionButton>
                                <ActionButton icon={<Droplets size={13} />} onClick={() => handleAction('hydrolyse')}>Hydrolyse</ActionButton>
                            </>
                        )}
                        {mode === 'proteins' && (
                            <>
                                <ActionButton icon={<Zap size={13} />} onClick={() => handleAction('peptide')}>Peptide bond</ActionButton>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {PROTEIN_LEVELS.map((item) => (
                                        <SegmentButton key={item} active={proteinLevel === item} color="#4f46e5" onClick={() => setProteinLevel(item)}>
                                            {item.slice(0, 4)}
                                        </SegmentButton>
                                    ))}
                                </div>
                            </>
                        )}
                        {mode === 'nucleic' && (
                            <>
                                <ActionButton icon={<Dna size={13} />} onClick={() => handleAction('assemble')}>Assemble</ActionButton>
                                <ActionButton icon={<Zap size={13} />} onClick={() => handleAction('nucleotide-poly')}>Polymerise</ActionButton>
                                <ActionButton icon={<Shuffle size={13} />} onClick={() => handleAction('rna-dna')}>RNA / DNA</ActionButton>
                            </>
                        )}
                        {mode === 'composition' && (
                            <ActionButton icon={<PieChart size={13} />} onClick={() => handleMode('carbs')}>Explore molecules</ActionButton>
                        )}
                    </div>
                </ControlGroup>
                <ControlGroup icon={<Waves size={14} className="text-slate-700" />} label="Slider">
                    {mode === 'proteins' ? (
                        <SliderControl label="pH" value={pH.toString()} min="1" max="14" step="1" onChange={(value) => setPH(Number(value))} />
                    ) : (
                        <SliderControl label="Speed" value={speed.toFixed(2)} min="0.25" max="2" step="0.05" onChange={(value) => setSpeed(Number(value))} />
                    )}
                </ControlGroup>
                <ControlGroup icon={<ScanEye size={14} className="text-slate-700" />} label="Display">
                    <div className="grid gap-1.5">
                        <SegmentButton active={labels} color="#0f766e" onClick={() => setLabels((s) => !s)}>Labels</SegmentButton>
                        <SegmentButton active={callouts} color="#475569" onClick={() => setCallouts((s) => !s)}>NCERT callout</SegmentButton>
                        <SegmentButton active={mode === 'composition'} color="#64748b" onClick={() => handleMode('composition')}>Composition</SegmentButton>
                    </div>
                </ControlGroup>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">
                Ref: Ch 9 - Fig 9.1 / 9.2 / 9.3 - Table 9.4
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
            simulationStageWidth={W}
            simulationStageHeight={H}
            controlsAreaFlex="0 0 clamp(240px, 31%, 300px)"
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1320px)] overflow-y-auto overscroll-contain bg-white border border-slate-200 shadow-2xl rounded-2xl p-4"
            contentToggleClassName="bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
        />
    );
};

const subOptions = (mode: Mode) => {
    if (mode === 'carbs') return [
        { id: 'glucose', label: 'Glucose' }, { id: 'ribose', label: 'Ribose' }, { id: 'fructose', label: 'Fructose' }, { id: 'starch', label: 'Starch' },
        { id: 'cellulose', label: 'Cellulose' }, { id: 'glycogen', label: 'Glycogen' }, { id: 'inulin', label: 'Inulin' }, { id: 'chitin', label: 'Chitin' },
    ];
    if (mode === 'lipids') return [
        { id: 'palmitic', label: 'Palmitic' }, { id: 'arachidonic', label: 'Arachidonic' }, { id: 'glycerol', label: 'Glycerol' }, { id: 'mono', label: 'Mono' },
        { id: 'di', label: 'Di' }, { id: 'triglyceride', label: 'Tri' }, { id: 'phospholipid', label: 'Lecithin' }, { id: 'cholesterol', label: 'Cholesterol' },
    ];
    if (mode === 'proteins') return Object.entries(AMINO_INFO).map(([id, info]) => ({ id, label: info.label.replace(' acid', '') }));
    if (mode === 'nucleic') return Object.entries(BASE_INFO).map(([id, info]) => ({ id, label: info.label }));
    return COMPOSITION.map((item) => ({ id: item.id, label: item.label.replace('Carbohydrates', 'Carb').replace('Nucleic acids', 'NA') }));
};

const activeSubId = (mode: Mode, carb: CarbSub, lipid: LipidSub, amino: AminoSub, base: BaseSub, composition: CompositionSub) => {
    if (mode === 'carbs') return carb;
    if (mode === 'lipids') return lipid;
    if (mode === 'proteins') return amino;
    if (mode === 'nucleic') return base;
    return composition;
};

const aminoCharge = (pH: number) => {
    if (pH <= 3) return { left: 'H3N+', right: 'COOH', label: 'acidic form', formula: 'H3N+-CH(R)-COOH', color: '#dc2626' };
    if (pH >= 10) return { left: 'H2N', right: 'COO-', label: 'basic form', formula: 'H2N-CH(R)-COO-', color: '#7c3aed' };
    return { left: 'H3N+', right: 'COO-', label: 'ZWITTERION', formula: 'H3N+-CH(R)-COO-', color: '#0f766e' };
};

const CarbohydrateStage: React.FC<{ sub: CarbSub; time: number; labels: boolean; iodineAdded: boolean; monomerCount: number; bondGrow: number; waterAlpha: number }> = ({
    sub,
    time,
    labels,
    iodineAdded,
    monomerCount,
    bondGrow,
    waterAlpha,
}) => {
    const isBlue = sub === 'starch' && iodineAdded;
    return (
        <g>
            <StageFrame stroke="#fbbf24" />
            <text x="640" y="118" textAnchor="middle" fontSize="24" fontWeight="900" fill="#92400e">Carbohydrates: sugars to polysaccharide threads</text>
            <RingMolecule x={320} y={236} sides={6} label="Glucose" formula="C6H12O6" color="#f59e0b" active={sub === 'glucose'} labels={labels} />
            <RingMolecule x={640} y={236} sides={5} label="Ribose" formula="C5H10O5" color="#10b981" active={sub === 'ribose'} labels={labels} />
            <RingMolecule x={960} y={236} sides={5} label="Fructose" formula="C6H12O6" color="#fb7185" active={sub === 'fructose'} labels={labels} />
            <rect x="205" y="380" width="870" height="230" rx="30" fill="#ffffff" stroke="#fde68a" strokeWidth="2" />
            <text x="640" y="414" textAnchor="middle" fontSize="16" fontWeight="900" fill="#78350f">{CARB_INFO[sub].label} ribbon view</text>
            {sub === 'starch' && <StarchHelix iodineAdded={iodineAdded} time={time} isBlue={isBlue} />}
            {sub === 'cellulose' && <CelluloseChain iodineAdded={iodineAdded} time={time} />}
            {sub === 'glycogen' && <GlycogenStage />}
            {sub === 'inulin' && <PolyRingChain sides={5} color="#fb7185" label="fructose units" />}
            {sub === 'chitin' && <ChitinChain />}
            {(['glucose', 'ribose', 'fructose'] as CarbSub[]).includes(sub) && <SucroseCameo bondGrow={bondGrow} />}
            <WaterBurst x={670} y={385} alpha={waterAlpha} time={time} count={monomerCount} />
            {labels && (
                <text x="640" y="652" textAnchor="middle" fontSize="14" fontWeight="900" fill="#92400e">
                    Condensation grows glycosidic bonds and releases H2O
                </text>
            )}
        </g>
    );
};

const LipidStage: React.FC<{ sub: LipidSub; fattyAcids: number; time: number; labels: boolean; bondGrow: number; waterAlpha: number }> = ({ sub, fattyAcids, time, labels, bondGrow, waterAlpha }) => {
    const isPhospholipid = sub === 'phospholipid';
    const chainKind = sub === 'arachidonic' ? 'unsaturated' : 'saturated';
    const mpHeight = sub === 'arachidonic' ? 66 : 138;
    return (
        <g>
            <StageFrame stroke="#34d399" />
            <text x="640" y="118" textAnchor="middle" fontSize="24" fontWeight="900" fill="#065f46">Lipids: fatty acids, glycerides, membranes</text>
            <rect x="160" y="166" width="382" height="420" rx="28" fill="#ffffff" stroke="#bbf7d0" strokeWidth="2" />
            <text x="350" y="202" textAnchor="middle" fontSize="17" fontWeight="900" fill="#047857">Fatty acid pool</text>
            {[0, 1, 2].map((i) => (
                <FattyAcid key={i} x={230} y={270 + i * 82} unsaturated={chainKind === 'unsaturated'} phase={time + i * 0.5} />
            ))}
            <rect x="620" y="166" width="380" height="420" rx="28" fill="#ffffff" stroke="#bbf7d0" strokeWidth="2" />
            <text x="810" y="202" textAnchor="middle" fontSize="17" fontWeight="900" fill="#047857">{isPhospholipid ? 'Lecithin phospholipid' : 'Glycerol backbone'}</text>
            {[0, 1, 2].map((i) => {
                const attached = isPhospholipid ? i < 2 : i < fattyAcids;
                return (
                    <g key={i}>
                        <rect x="665" y={255 + i * 78} width="104" height="40" rx="14" fill="#ecfdf5" stroke="#059669" strokeWidth="2" />
                        <text x="717" y={280 + i * 78} textAnchor="middle" fontSize="13" fontWeight="900" fill="#047857">C{i + 1}-OH</text>
                        {attached && (
                            <g>
                                <line x1="770" y1={275 + i * 78} x2={810 + 120 * bondGrow} y2={275 + i * 78} stroke="#059669" strokeWidth="6" strokeLinecap="round" />
                                <FattyAcid x={822} y={275 + i * 78} unsaturated={chainKind === 'unsaturated'} phase={time} compact />
                            </g>
                        )}
                        {isPhospholipid && i === 2 && (
                            <g filter={bondGrow > 0.2 ? 'url(#goldGlow)' : undefined}>
                                <circle cx="850" cy={275 + i * 78} r="28" fill="#fef9c3" stroke="#ca8a04" strokeWidth="3" />
                                <text x="850" y={280 + i * 78} textAnchor="middle" fontSize="13" fontWeight="900" fill="#854d0e">PO4</text>
                                <text x="908" y={280 + i * 78} fontSize="13" fontWeight="900" fill="#047857">choline</text>
                            </g>
                        )}
                    </g>
                );
            })}
            <WaterBurst x={790} y={225} alpha={waterAlpha} time={time} count={fattyAcids + 1} />
            <g>
                <rect x="1032" y="206" width="92" height="300" rx="22" fill="#ffffff" stroke="#d1fae5" strokeWidth="2" />
                <text x="1078" y="238" textAnchor="middle" fontSize="12" fontWeight="900" fill="#047857">Melting</text>
                <text x="1078" y="254" textAnchor="middle" fontSize="12" fontWeight="900" fill="#047857">point</text>
                <rect x="1065" y="292" width="26" height="150" rx="13" fill="#f1f5f9" stroke="#94a3b8" />
                <rect x="1065" y={442 - mpHeight} width="26" height={mpHeight} rx="13" fill={chainKind === 'unsaturated' ? '#38bdf8' : '#ef4444'} opacity="0.82" />
                <text x="1078" y="476" textAnchor="middle" fontSize="11" fontWeight="900" fill="#475569">{chainKind}</text>
            </g>
            <CholesterolThumb x={1080} y={150} />
            {labels && <text x="640" y="652" textAnchor="middle" fontSize="14" fontWeight="900" fill="#047857">Lipids are small, water-insoluble, and membrane-associated in the insoluble fraction</text>}
        </g>
    );
};

const ProteinStage: React.FC<{ amino: AminoSub; pH: number; level: ProteinLevel; progress: number; labels: boolean; bondGrow: number; waterAlpha: number }> = ({ amino, pH, level, progress, labels, bondGrow, waterAlpha }) => {
    const charge = aminoCharge(pH);
    const info = AMINO_INFO[amino];
    return (
        <g>
            <StageFrame stroke="#818cf8" />
            <text x="640" y="118" textAnchor="middle" fontSize="24" fontWeight="900" fill="#3730a3">Proteins: amino acid chain to haemoglobin assembly</text>
            <ProteinPanel x={72} y={160} title="(a) Primary" active={level === 'primary'}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <g key={i}>
                        <circle cx={38 + i * 28} cy={94 + Math.sin(i + progress) * 6} r="11" fill={i % 2 ? info.color : '#c7d2fe'} stroke="#312e81" strokeWidth="1.5" />
                        {i < 7 && <line x1={50 + i * 28} y1={94} x2={54 + i * 28} y2={94} stroke="#111827" strokeWidth="5" />}
                    </g>
                ))}
                <text x="32" y="136" fontSize="11" fontWeight="900" fill="#2563eb">N-terminal</text>
                <text x="166" y="136" fontSize="11" fontWeight="900" fill="#be123c">C-terminal</text>
            </ProteinPanel>
            <ProteinPanel x={368} y={160} title="(b) Secondary" active={level === 'secondary'}>
                <path d={helixPath(35, 65, 185, 18, 6)} fill="none" stroke="#4f46e5" strokeWidth="9" strokeLinecap="round" />
                {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={58 + i * 28} y1="54" x2={70 + i * 28} y2="92" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 5" />)}
                <path d="M36 135 L78 116 L120 135 L162 116 L204 135" fill="none" stroke="#0ea5e9" strokeWidth="8" strokeLinejoin="round" />
                <text x="118" y="169" textAnchor="middle" fontSize="11" fontWeight="900" fill="#4f46e5">right-handed helix + beta sheet</text>
            </ProteinPanel>
            <ProteinPanel x={664} y={160} title="(c) Tertiary" active={level === 'tertiary'}>
                <path d="M50 92 C30 42 112 34 136 68 C188 46 215 104 172 130 C124 174 46 150 50 92Z" fill="#eef2ff" stroke="#4f46e5" strokeWidth="4" />
                <path d="M58 94 C100 50 164 70 132 110 S84 154 172 122" fill="none" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" />
                <line x1="86" y1="70" x2="150" y2="138" stroke="#eab308" strokeWidth="5" strokeDasharray="8 5" />
                <text x="118" y="169" textAnchor="middle" fontSize="11" fontWeight="900" fill="#854d0e">S-S disulphide bond</text>
            </ProteinPanel>
            <ProteinPanel x={960} y={160} title="(d) Quaternary" active={level === 'quaternary'}>
                <ellipse cx="82" cy="78" rx="48" ry="36" fill="#fee2e2" stroke="#dc2626" strokeWidth="3" />
                <ellipse cx="154" cy="78" rx="48" ry="36" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
                <ellipse cx="82" cy="132" rx="48" ry="36" fill="#fee2e2" stroke="#dc2626" strokeWidth="3" />
                <ellipse cx="154" cy="132" rx="48" ry="36" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
                <text x="82" y="83" textAnchor="middle" fontSize="16" fontWeight="900" fill="#b91c1c">alpha</text>
                <text x="154" y="83" textAnchor="middle" fontSize="16" fontWeight="900" fill="#1d4ed8">beta</text>
                <text x="118" y="185" textAnchor="middle" fontSize="11" fontWeight="900" fill="#3730a3">Hb = 2 alpha + 2 beta</text>
            </ProteinPanel>
            <g>
                <rect x="272" y="452" width="736" height="126" rx="28" fill="#ffffff" stroke="#c7d2fe" strokeWidth="2" />
                <text x="640" y="486" textAnchor="middle" fontSize="16" fontWeight="900" fill="#3730a3">Amino acid pH form and peptide-bond cameo</text>
                <line x1="420" y1="532" x2={420 + 180 * bondGrow} y2="532" stroke="#111827" strokeWidth="5" />
                <AminoAcidCameo x={344} y={532} info={info} charge={charge} />
                <AminoAcidCameo x={650} y={532} info={info} charge={charge} />
                <WaterBurst x={564} y={506} alpha={waterAlpha} time={progress + waterAlpha} count={3} />
                <text x="872" y="538" textAnchor="middle" fontSize="18" fontWeight="900" fill={charge.color}>{charge.label}</text>
                <text x="872" y="562" textAnchor="middle" fontSize="12" fontWeight="800" fill="#475569">{charge.formula}</text>
            </g>
            {labels && <text x="640" y="652" textAnchor="middle" fontSize="14" fontWeight="900" fill="#3730a3">Protein hierarchy moves from sequence to folds to subunit assembly</text>}
        </g>
    );
};

const NucleicStage: React.FC<{ base: BaseSub; sugar: SugarSub; phosphate: boolean; length: number; time: number; labels: boolean; bondGrow: number; waterAlpha: number }> = ({ base, sugar, phosphate, length, time, labels, bondGrow, waterAlpha }) => {
    const baseInfo = BASE_INFO[base];
    const isRna = sugar === 'ribose';
    return (
        <g>
            <StageFrame stroke="#a78bfa" />
            <text x="640" y="118" textAnchor="middle" fontSize="24" fontWeight="900" fill="#5b21b6">Nucleic acids: nucleoside to nucleotide to polynucleotide</text>
            <rect x="150" y="154" width="980" height="152" rx="28" fill="#ffffff" stroke="#ddd6fe" strokeWidth="2" />
            <Socket x={290} y={230} label={sugar === 'ribose' ? 'Ribose' : '2-deoxyribose'} color="#22c55e" />
            <text x="405" y="236" fontSize="24" fontWeight="900" fill="#64748b">+</text>
            <BaseShape x={510} y={230} purine={baseInfo.family === 'Purine'} color={baseInfo.color} label={baseInfo.symbol} />
            <text x="625" y="236" fontSize="24" fontWeight="900" fill="#64748b">+</text>
            <g opacity={phosphate ? 1 : 0.28} filter={phosphate && bondGrow > 0.1 ? 'url(#goldGlow)' : undefined}>
                <polygon points={polygonPoints(735, 230, 46, 6)} fill="#fef9c3" stroke="#ca8a04" strokeWidth="3" />
                <text x="735" y="236" textAnchor="middle" fontSize="16" fontWeight="900" fill="#854d0e">PO4</text>
            </g>
            <text x="930" y="226" textAnchor="middle" fontSize="18" fontWeight="900" fill="#5b21b6">{phosphate ? baseInfo.nucleotide : baseInfo.nucleoside}</text>
            <text x="930" y="250" textAnchor="middle" fontSize="13" fontWeight="800" fill="#64748b">{baseInfo.family}; pairs visually with {baseInfo.pair}</text>
            <rect x="184" y="350" width="912" height="110" rx="26" fill="#ffffff" stroke="#ddd6fe" strokeWidth="2" />
            {[0, 1, 2, 3, 4, 5, 6, 7].slice(0, length).map((i) => (
                <g key={i}>
                    <circle cx={250 + i * 106} cy="405" r="21" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                    <text x={250 + i * 106} y="410" textAnchor="middle" fontSize="12" fontWeight="900" fill="#166534">S</text>
                    <polygon points={polygonPoints(288 + i * 106, 405, 22, 6)} fill="#fef9c3" stroke="#ca8a04" strokeWidth="2" />
                    <BaseShape x={326 + i * 106} y={405 + Math.sin(time + i) * 3} purine={i % 2 === 0} color={i % 2 === 0 ? '#6366f1' : '#f43f5e'} label={i % 2 === 0 ? (isRna ? 'U' : 'T') : 'G'} small />
                    {i < length - 1 && <line x1={344 + i * 106} y1="405" x2={229 + (i + 1) * 106} y2="405" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeDasharray="9 6" />}
                </g>
            ))}
            <rect x="216" y="500" width="848" height="114" rx="28" fill="#ffffff" stroke="#ddd6fe" strokeWidth="2" />
            {isRna ? <RnaPreview time={time} /> : <DnaPreview time={time} />}
            <WaterBurst x={762} y={332} alpha={waterAlpha} time={time} count={length} />
            {labels && <text x="640" y="652" textAnchor="middle" fontSize="14" fontWeight="900" fill="#5b21b6">{isRna ? 'RNA uses ribose and U in this visual preview' : 'DNA uses 2-deoxyribose and a paired double helix preview'}</text>}
        </g>
    );
};

const CompositionStage: React.FC<{ selected: CompositionSub; time: number; onSelect: (id: CompositionSub) => void }> = ({ selected, time, onSelect }) => {
    const total = COMPOSITION.reduce((sum, item) => sum + item.value, 0);
    const radius = 150;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const progress = Math.min(1, time);
    return (
        <g>
            <StageFrame stroke="#cbd5e1" />
            <text x="640" y="118" textAnchor="middle" fontSize="24" fontWeight="900" fill="#334155">Cell composition: NCERT Table 9.4</text>
            <g transform="translate(0 10)">
                {COMPOSITION.map((item) => {
                    const dash = circumference * (item.value / total) * progress;
                    const gap = circumference - dash;
                    const currentOffset = offset;
                    offset += circumference * (item.value / total);
                    return (
                        <circle
                            key={item.id}
                            cx="510"
                            cy="390"
                            r={radius}
                            fill="none"
                            stroke={item.color}
                            strokeWidth={selected === item.id ? 82 : 68}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-currentOffset}
                            transform="rotate(-90 510 390)"
                            opacity={selected === item.id ? 1 : 0.68}
                            onClick={() => onSelect(item.id)}
                            className="cursor-pointer"
                        />
                    );
                })}
                <circle cx="510" cy="390" r="91" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                <text x="510" y="382" textAnchor="middle" fontSize="18" fontWeight="900" fill="#0f172a">Average</text>
                <text x="510" y="410" textAnchor="middle" fontSize="16" fontWeight="900" fill="#475569">living cell</text>
            </g>
            <g>
                {COMPOSITION.map((item, i) => (
                    <g key={item.id} transform={`translate(760 ${236 + i * 56})`} onClick={() => onSelect(item.id)} className="cursor-pointer">
                        <rect width="308" height="40" rx="14" fill={selected === item.id ? '#f8fafc' : '#ffffff'} stroke={selected === item.id ? item.color : '#e2e8f0'} strokeWidth={selected === item.id ? 3 : 1.5} />
                        <circle cx="24" cy="20" r="9" fill={item.color} />
                        <text x="46" y="25" fontSize="14" fontWeight="900" fill="#0f172a">{item.label}</text>
                        <text x="284" y="25" textAnchor="end" fontSize="14" fontWeight="900" fill={item.color}>{item.range}</text>
                    </g>
                ))}
            </g>
            <text x="640" y="652" textAnchor="middle" fontSize="14" fontWeight="900" fill="#475569">Water is the most abundant chemical in living organisms</text>
        </g>
    );
};

const StageFrame: React.FC<{ stroke: string }> = ({ stroke }) => (
    <rect x="56" y="82" width="1168" height="622" rx="34" fill="#ffffff" stroke={stroke} strokeWidth="2.5" opacity="0.95" />
);

const AsideCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, subtitle, icon, children }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
        <div className="mb-2 flex items-center gap-2">
            {icon}
            <div>
                <div className="text-base font-extrabold text-slate-900">{title}</div>
                <div className="text-xs font-semibold text-slate-500">{subtitle}</div>
            </div>
        </div>
        {children}
    </div>
);

const MiniLine: React.FC<{ color: string; label: string; text: string }> = ({ color, label, text }) => (
    <div className="rounded-lg border border-slate-100 bg-white px-2 py-1.5">
        <span className="font-black" style={{ color }}>{label}</span>
        <span className="text-slate-500"> - {text}</span>
    </div>
);

const ValueRow: React.FC<{ label: string; value: string; tint: string; color: string }> = ({ label, value, tint, color }) => (
    <div className="rounded-lg border border-slate-100 px-3 py-2.5" style={{ background: tint }}>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 break-words font-mono text-sm font-extrabold" style={{ color }}>{value}</div>
    </div>
);

const ControlGroup: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-600">
            {icon}
            {label}
        </div>
        {children}
    </div>
);

const SegmentButton: React.FC<{ active: boolean; color: string; onClick: () => void; children: React.ReactNode }> = ({ active, color, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="min-h-[34px] rounded-lg border px-2 py-1.5 text-[11px] font-black leading-tight transition-colors"
        style={{
            background: active ? color : '#ffffff',
            borderColor: active ? color : '#e2e8f0',
            color: active ? '#ffffff' : '#334155',
        }}
    >
        {children}
    </button>
);

const ActionButton: React.FC<{ icon: React.ReactNode; onClick: () => void; children: React.ReactNode }> = ({ icon, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-black leading-tight text-slate-700 transition-colors hover:bg-slate-50"
    >
        {icon}
        {children}
    </button>
);

const SliderControl: React.FC<{ label: string; value: string; min: string; max: string; step: string; onChange: (value: string) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-600">{label}</span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-black text-slate-700">{value}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="w-full accent-indigo-700" />
    </div>
);

const RingMolecule: React.FC<{ x: number; y: number; sides: number; label: string; formula: string; color: string; active: boolean; labels: boolean }> = ({ x, y, sides, label, formula, color, active, labels }) => (
    <g filter={active ? 'url(#goldGlow)' : undefined}>
        <polygon points={polygonPoints(x, y, 56, sides)} fill={`${color}22`} stroke={active ? '#0f172a' : color} strokeWidth={active ? 3 : 2.5} />
        <text x={x} y={y + 6} textAnchor="middle" fontSize="18" fontWeight="900" fill={color}>{sides === 6 ? 'hexose' : 'pentose'}</text>
        {labels && (
            <>
                <text x={x} y={y + 86} textAnchor="middle" fontSize="14" fontWeight="900" fill="#0f172a">{label}</text>
                <text x={x} y={y + 106} textAnchor="middle" fontSize="12" fontWeight="800" fill="#64748b">{formula}</text>
            </>
        )}
        {[0, 1, 2].map((i) => (
            <text key={i} x={x + Math.cos(i * 2.1) * 82} y={y + Math.sin(i * 2.1) * 78} textAnchor="middle" fontSize="11" fontWeight="900" fill="#475569">OH</text>
        ))}
    </g>
);

const Ring: React.FC<{ cx: number; cy: number; sides: number; r: number; fill: string; stroke: string; label: string }> = ({ cx, cy, sides, r, fill, stroke, label }) => (
    <g>
        <polygon points={polygonPoints(cx, cy, r, sides)} fill={fill} stroke={stroke} strokeWidth="2" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="900" fill={stroke}>{label}</text>
    </g>
);

const StarchHelix: React.FC<{ iodineAdded: boolean; time: number; isBlue: boolean }> = ({ iodineAdded, time, isBlue }) => (
    <g>
        <path d={helixPath(330, 500, 600, 42 + Math.sin(time) * 4, 8)} fill="none" stroke={isBlue ? 'url(#helixBlue)' : '#d97706'} strokeWidth="13" strokeLinecap="round" />
        {iodineAdded && [0, 1, 2, 3, 4, 5, 6].map((i) => {
            const pocket = Math.min(1, Math.max(0, time * 1.2 - i * 0.18));
            return <circle key={i} cx={360 + i * 82} cy={500 + Math.sin(time * 1.8 + i) * 26 * pocket} r="11" fill="#6d28d9" opacity={pocket} />;
        })}
        <text x="640" y="586" textAnchor="middle" fontSize="15" fontWeight="900" fill={isBlue ? '#1d4ed8' : '#92400e'}>{isBlue ? 'Starch-I2 complex - blue' : 'Helical starch can hold I2'}</text>
    </g>
);

const CelluloseChain: React.FC<{ iodineAdded: boolean; time: number }> = ({ iodineAdded, time }) => (
    <g>
        <polyline points="315,500 382,462 449,500 516,462 583,500 650,462 717,500 784,462 851,500 918,462" fill="none" stroke="#15803d" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        {iodineAdded && [0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={280 + ((time * 80 + i * 104) % 690)} cy={440 + (i % 2) * 96} r="10" fill="#6d28d9" opacity="0.45" />)}
        <text x="640" y="586" textAnchor="middle" fontSize="15" fontWeight="900" fill="#166534">Cellulose has no helix - iodine passes through</text>
    </g>
);

const GlycogenStage: React.FC = () => (
    <g>
        <path d="M320 510 H885" stroke="#b45309" strokeWidth="12" strokeLinecap="round" />
        <path d="M430 510 C450 460 500 440 536 405" stroke="#b45309" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M570 510 C612 468 650 450 690 418" stroke="#b45309" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M720 510 C760 548 804 562 850 588" stroke="#b45309" strokeWidth="12" strokeLinecap="round" fill="none" />
        {[320, 390, 460, 530, 600, 670, 740, 810, 885].map((x, i) => <circle key={i} cx={x} cy="510" r="16" fill="#fed7aa" stroke="#b45309" strokeWidth="3" />)}
        <text x="318" y="470" textAnchor="middle" fontSize="12" fontWeight="900" fill="#92400e">non-reducing end</text>
        <text x="890" y="470" textAnchor="middle" fontSize="12" fontWeight="900" fill="#92400e">reducing end</text>
        <text x="604" y="454" textAnchor="middle" fontSize="12" fontWeight="900" fill="#92400e">alpha-1,6 branch</text>
    </g>
);

const PolyRingChain: React.FC<{ sides: number; color: string; label: string }> = ({ sides, color, label }) => (
    <g>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <g key={i}>
                <polygon points={polygonPoints(360 + i * 90, 500 + Math.sin(i) * 24, 32, sides)} fill={`${color}24`} stroke={color} strokeWidth="3" />
                {i < 6 && <line x1={392 + i * 90} y1={500 + Math.sin(i) * 24} x2={328 + (i + 1) * 90} y2={500 + Math.sin(i + 1) * 24} stroke="#475569" strokeWidth="3" />}
            </g>
        ))}
        <text x="640" y="586" textAnchor="middle" fontSize="15" fontWeight="900" fill={color}>{label}</text>
    </g>
);

const ChitinChain: React.FC = () => (
    <g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i}>
                <polygon points={polygonPoints(385 + i * 92, 500 + (i % 2) * 18, 32, 6)} fill="#ecfdf5" stroke="#059669" strokeWidth="3" />
                <rect x={365 + i * 92} y={448 + (i % 2) * 18} width="40" height="22" rx="8" fill="#dbeafe" stroke="#2563eb" />
                <text x={385 + i * 92} y={464 + (i % 2) * 18} textAnchor="middle" fontSize="10" fontWeight="900" fill="#1d4ed8">NH</text>
                {i < 5 && <line x1={417 + i * 92} y1={500 + (i % 2) * 18} x2={353 + (i + 1) * 92} y2={500 + ((i + 1) % 2) * 18} stroke="#475569" strokeWidth="3" />}
            </g>
        ))}
        <text x="640" y="586" textAnchor="middle" fontSize="15" fontWeight="900" fill="#047857">Chitin: amino-sugar polymer in arthropod exoskeleton</text>
    </g>
);

const SucroseCameo: React.FC<{ bondGrow: number }> = ({ bondGrow }) => (
    <g>
        <Ring cx={470} cy={500} sides={6} r={34} fill="#fef3c7" stroke="#d97706" label="Glu" />
        <line x1="506" y1="500" x2={506 + 92 * bondGrow} y2="500" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        <Ring cx={640} cy={500} sides={5} r={34} fill="#ffe4e6" stroke="#fb7185" label="Fru" />
        <text x="556" y="456" textAnchor="middle" fontSize="13" fontWeight="900" fill="#92400e">sucrose example</text>
    </g>
);

const FattyAcid: React.FC<{ x: number; y: number; unsaturated: boolean; phase: number; compact?: boolean }> = ({ x, y, unsaturated, phase, compact }) => {
    const step = compact ? 28 : 36;
    const count = compact ? 5 : 7;
    const points = Array.from({ length: count }, (_, i) => `${x + i * step},${y + (i % 2 ? -20 : 20) + Math.sin(phase + i) * 2}`).join(' ');
    return (
        <g>
            <circle cx={x - 30} cy={y} r={compact ? 15 : 19} fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
            <text x={x - 30} y={y + 4} textAnchor="middle" fontSize={compact ? 9 : 11} fontWeight="900" fill="#b91c1c">COOH</text>
            <polyline points={points} fill="none" stroke="#f59e0b" strokeWidth={compact ? 8 : 10} strokeLinecap="round" strokeLinejoin="round" />
            {unsaturated && (
                <>
                    <circle cx={x + step * 2.5} cy={y - 28} r="6" fill="#0f172a" />
                    <circle cx={x + step * 2.9} cy={y - 6} r="6" fill="#0f172a" />
                </>
            )}
        </g>
    );
};

const CholesterolThumb: React.FC<{ x: number; y: number }> = ({ x, y }) => (
    <g>
        {[0, 1, 2, 3].map((i) => <polygon key={i} points={polygonPoints(x + i * 22, y + (i % 2) * 10, 18, 6)} fill="#f8fafc" stroke="#475569" strokeWidth="2" />)}
        <text x={x + 34} y={y + 55} textAnchor="middle" fontSize="11" fontWeight="900" fill="#475569">cholesterol</text>
    </g>
);

const ProteinPanel: React.FC<{ x: number; y: number; title: string; active: boolean; children: React.ReactNode }> = ({ x, y, title, active, children }) => (
    <g transform={`translate(${x} ${y})`} filter={active ? 'url(#goldGlow)' : undefined}>
        <rect width="248" height="222" rx="24" fill="#ffffff" stroke={active ? '#0f172a' : '#c7d2fe'} strokeWidth={active ? 3 : 2} />
        <text x="124" y="30" textAnchor="middle" fontSize="15" fontWeight="900" fill="#3730a3">{title}</text>
        {children}
    </g>
);

const AminoAcidCameo: React.FC<{ x: number; y: number; info: { r: string; color: string }; charge: { left: string; right: string; color: string } }> = ({ x, y, info, charge }) => (
    <g>
        <circle cx={x} cy={y} r="24" fill="#111827" />
        <text x={x} y={y + 6} textAnchor="middle" fontSize="17" fontWeight="900" fill="#ffffff">C</text>
        <rect x={x - 128} y={y - 18} width="82" height="36" rx="14" fill="#e0f2fe" stroke="#0284c7" />
        <text x={x - 87} y={y + 5} textAnchor="middle" fontSize="12" fontWeight="900" fill="#075985">{charge.left}</text>
        <rect x={x + 46} y={y - 18} width="88" height="36" rx="14" fill="#fee2e2" stroke="#dc2626" />
        <text x={x + 90} y={y + 5} textAnchor="middle" fontSize="12" fontWeight="900" fill="#b91c1c">{charge.right}</text>
        <rect x={x - 48} y={y + 40} width="96" height="28" rx="11" fill="#ffffff" stroke={info.color} />
        <text x={x} y={y + 59} textAnchor="middle" fontSize="11" fontWeight="900" fill={info.color}>{info.r}</text>
    </g>
);

const Socket: React.FC<{ x: number; y: number; label: string; color: string }> = ({ x, y, label, color }) => (
    <g filter="url(#goldGlow)">
        <rect x={x - 62} y={y - 34} width="124" height="68" rx="22" fill="#ffffff" stroke={color} strokeWidth="3" />
        <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="900" fill={color}>{label}</text>
    </g>
);

const BaseShape: React.FC<{ x: number; y: number; purine: boolean; color: string; label: string; small?: boolean }> = ({ x, y, purine, color, label, small }) => {
    const r = small ? 17 : 32;
    return (
        <g>
            <polygon points={polygonPoints(x - (purine ? r * 0.55 : 0), y, r, 6)} fill={`${color}22`} stroke={color} strokeWidth={small ? 2 : 3} />
            {purine && <polygon points={polygonPoints(x + r * 0.65, y, r * 0.82, 5)} fill={`${color}22`} stroke={color} strokeWidth={small ? 2 : 3} />}
            <text x={x + (purine ? r * 0.05 : 0)} y={y + (small ? 4 : 7)} textAnchor="middle" fontSize={small ? 14 : 24} fontWeight="900" fill={color}>{label}</text>
        </g>
    );
};

const DnaPreview: React.FC<{ time: number }> = ({ time }) => (
    <g>
        <path d={helixPath(300, 556, 660, 38 + Math.sin(time) * 2, 6)} fill="none" stroke="#7c3aed" strokeWidth="5" />
        <path d={helixPath(300, 556, 660, -38 - Math.sin(time) * 2, 6)} fill="none" stroke="#a78bfa" strokeWidth="5" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={330 + i * 118} y1={526 + Math.sin(i) * 18} x2={330 + i * 118} y2={586 - Math.sin(i) * 18} stroke={i % 2 ? '#22c55e' : '#2563eb'} strokeWidth="6" strokeLinecap="round" />
        ))}
        <text x="640" y="606" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5b21b6">DNA - 2-deoxyribose backbone - genetic material</text>
    </g>
);

const RnaPreview: React.FC<{ time: number }> = ({ time }) => (
    <g>
        <path d={helixPath(310, 556, 640, 34 + Math.sin(time) * 2, 5)} fill="none" stroke="#7c3aed" strokeWidth="7" />
        {[0, 1, 2, 3, 4, 5].map((i) => <BaseShape key={i} x={350 + i * 104} y={556 + Math.sin(time + i) * 24} purine={i % 2 === 0} color={i % 2 === 0 ? '#6366f1' : '#f43f5e'} label={i % 2 === 0 ? 'A' : 'U'} small />)}
        <text x="640" y="606" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5b21b6">RNA - ribose strand - U replaces T in this preview</text>
    </g>
);

const WaterBurst: React.FC<{ x: number; y: number; alpha: number; time: number; count: number }> = ({ x, y, alpha, time, count }) => {
    if (alpha <= 0) return null;
    return (
        <g opacity={alpha}>
            {[0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${x + i * 22 - 22} ${y - (1 - alpha) * (58 + i * 8) + Math.sin(time + count + i) * 5})`}>
                    <circle r="9" fill="#67e8f9" stroke="#0891b2" strokeWidth="2" />
                    <text y="4" textAnchor="middle" fontSize="7" fontWeight="900" fill="#075985">H2O</text>
                </g>
            ))}
        </g>
    );
};

const GlycogenMini: React.FC<{ x: number; y: number }> = ({ x, y }) => (
    <g transform={`translate(${x} ${y})`}>
        <path d="M12 55 H210" stroke="#b45309" strokeWidth="7" strokeLinecap="round" />
        <path d="M74 55 C90 22 126 20 145 8" stroke="#b45309" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M126 55 C148 80 176 86 206 98" stroke="#b45309" strokeWidth="7" strokeLinecap="round" fill="none" />
        {[12, 48, 84, 120, 156, 192].map((cx) => <circle key={cx} cx={cx} cy="55" r="8" fill="#fed7aa" stroke="#b45309" strokeWidth="2" />)}
        <text x="10" y="28" fontSize="9" fontWeight="900" fill="#92400e">non-red.</text>
        <text x="184" y="28" fontSize="9" fontWeight="900" fill="#92400e">red.</text>
    </g>
);

const ProteinMini: React.FC = () => (
    <g>
        <path d="M14 32 H70" stroke="#4f46e5" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 6" />
        <path d={helixPath(92, 32, 48, 10, 3)} fill="none" stroke="#4f46e5" strokeWidth="5" />
        <path d="M162 32 C148 8 202 8 190 42 C182 65 144 56 162 32Z" fill="#eef2ff" stroke="#4f46e5" strokeWidth="2" />
        <circle cx="55" cy="88" r="18" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
        <circle cx="95" cy="88" r="18" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
        <circle cx="135" cy="88" r="18" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
        <circle cx="175" cy="88" r="18" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
        <text x="125" y="116" textAnchor="middle" fontSize="10" fontWeight="900" fill="#3730a3">primary to secondary to tertiary to Hb</text>
    </g>
);

const polygonPoints = (cx: number, cy: number, r: number, sides: number) => (
    Array.from({ length: sides }, (_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
        return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
    }).join(' ')
);

const helixPath = (x: number, y: number, width: number, amp: number, turns: number) => {
    const steps = turns * 24;
    return Array.from({ length: steps + 1 }, (_, i) => {
        const t = i / steps;
        const px = x + width * t;
        const py = y + Math.sin(t * Math.PI * turns * 2) * amp;
        return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(' ');
};

export default BiomoleculesLab;
