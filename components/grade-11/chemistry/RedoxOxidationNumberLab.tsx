import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Atom, FlaskConical, Layers, Pause, Play, RotateCcw, Sigma, SkipForward, Split, Tag } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface RedoxOxidationNumberLabProps {
    topic: any;
    onExit: () => void;
}

type Mode = 'rules' | 'classify' | 'dispro' | 'balancer';

interface AtomNode {
    el: string;          // element symbol
    on: number;          // oxidation number (use 0.5 for ½ etc.)
    onLabel?: string;    // override pretty print, e.g. '-½'
    count?: number;      // subscript displayed next to element
    ruleHit?: string;    // which NCERT rule applied (rules mode only)
}

interface Species {
    formula: string;     // raw formula text shown big
    charge?: string;     // 2-, +, 3+ ...
    atoms: AtomNode[];   // one per *element type* (averaged ON for repeats)
    structureNote?: string;
}

interface ReactionDef {
    id: string;
    title: string;
    note: string;        // medium hint or NCERT problem citation
    lhs: Species[];
    rhs: Species[];
    medium?: 'acidic' | 'basic' | null;
    klass: 'combination' | 'decomposition' | 'displacement' | 'disproportionation' | 'redox' | 'not';
    diff: { el: string; from: number; to: number; species: string }[]; // atoms whose ON changes
    oxidant?: string;
    reductant?: string;
}

interface BalancerStep { title: string; equation: string; note: string; }
interface BalancerDef {
    id: string;
    method: 'oxidation-number' | 'half-reaction';
    title: string;
    citation: string;
    steps: BalancerStep[];
}

// ===== NCERT Class 11 Chemistry · Unit 7 Redox Reactions =====

const COMPOUNDS: Species[] = [
    { formula: 'H₂O', atoms: [
        { el: 'H', on: +1, count: 2, ruleHit: 'Rule 4 — H = +1 normally' },
        { el: 'O', on: -2, ruleHit: 'Rule 3 — O = −2 normally' }
    ]},
    { formula: 'H₂O₂', atoms: [
        { el: 'H', on: +1, count: 2, ruleHit: 'Rule 4 — H = +1' },
        { el: 'O', on: -1, count: 2, ruleHit: 'Rule 3 — peroxide exception' }
    ]},
    { formula: 'KO₂', atoms: [
        { el: 'K', on: +1, ruleHit: 'Rule 2 — alkali metal = +1' },
        { el: 'O', on: -0.5, onLabel: '−½', count: 2, ruleHit: 'Rule 3 — superoxide exception' }
    ]},
    { formula: 'OF₂', atoms: [
        { el: 'O', on: +2, ruleHit: 'Rule 3 — oxygen bonded to F' },
        { el: 'F', on: -1, count: 2, ruleHit: 'Rule 5 — F always −1' }
    ]},
    { formula: 'NaH', atoms: [
        { el: 'Na', on: +1, ruleHit: 'Rule 2 — alkali metal = +1' },
        { el: 'H', on: -1, ruleHit: 'Rule 4 — metallic hydride exception' }
    ]},
    { formula: 'NH₃', atoms: [
        { el: 'N', on: -3, ruleHit: 'Rule 6 — sum = 0 ⇒ N = −3' },
        { el: 'H', on: +1, count: 3, ruleHit: 'Rule 4 — H = +1' }
    ]},
    { formula: 'CO₂', atoms: [
        { el: 'C', on: +4, ruleHit: 'Rule 6 — C + 2(−2) = 0' },
        { el: 'O', on: -2, count: 2, ruleHit: 'Rule 3 — O = −2' }
    ]},
    { formula: 'MnO₄', charge: '−', atoms: [
        { el: 'Mn', on: +7, ruleHit: 'Rule 6 — Mn + 4(−2) = −1' },
        { el: 'O', on: -2, count: 4, ruleHit: 'Rule 3' }
    ]},
    { formula: 'Cr₂O₇', charge: '2−', atoms: [
        { el: 'Cr', on: +6, count: 2, ruleHit: 'Rule 6 — 2Cr + 7(−2) = −2' },
        { el: 'O', on: -2, count: 7, ruleHit: 'Rule 3' }
    ]},
    { formula: 'SO₄', charge: '2−', atoms: [
        { el: 'S', on: +6, ruleHit: 'Rule 6' },
        { el: 'O', on: -2, count: 4, ruleHit: 'Rule 3' }
    ]},
    { formula: 'CO₃', charge: '2−', atoms: [
        { el: 'C', on: +4, ruleHit: 'Rule 6' },
        { el: 'O', on: -2, count: 3, ruleHit: 'Rule 3' }
    ]},
    { formula: 'Na₂S₂O₃', atoms: [
        { el: 'Na', on: +1, count: 2, ruleHit: 'Rule 2' },
        { el: 'S', on: +2, count: 2, ruleHit: 'Rule 6 — average ON of S' },
        { el: 'O', on: -2, count: 3, ruleHit: 'Rule 3' }
    ]},
    { formula: 'Na₂S₄O₆', structureNote: 'Average S = +2.5; terminal S atoms are +5 and the two central S atoms are 0.', atoms: [
        { el: 'Na', on: +1, count: 2, ruleHit: 'Rule 2' },
        { el: 'S', on: 2.5, onLabel: '+2½', count: 4, ruleHit: 'Average ON — paradox of fractional ON' },
        { el: 'O', on: -2, count: 6, ruleHit: 'Rule 3' }
    ]}
];

const REACTIONS: ReactionDef[] = [
    {
        id: 'na-cl2',
        title: '2 Na + Cl₂ → 2 NaCl',
        note: '§7.2 Eqn 7.12 · electron-transfer redox',
        lhs: [
            { formula: 'Na', atoms: [{ el: 'Na', on: 0 }] },
            { formula: 'Cl₂', atoms: [{ el: 'Cl', on: 0, count: 2 }] }
        ],
        rhs: [{ formula: 'NaCl', atoms: [{ el: 'Na', on: +1 }, { el: 'Cl', on: -1 }] }],
        klass: 'combination',
        diff: [
            { el: 'Na', from: 0, to: +1, species: 'Na → Na⁺' },
            { el: 'Cl', from: 0, to: -1, species: 'Cl → Cl⁻' }
        ],
        oxidant: 'Cl₂',
        reductant: 'Na'
    },
    {
        id: 'h2s-cl2',
        title: 'H₂S + Cl₂ → 2 HCl + S',
        note: '§7.1 Problem 7.1(i)',
        lhs: [
            { formula: 'H₂S', atoms: [{ el: 'H', on: +1, count: 2 }, { el: 'S', on: -2 }] },
            { formula: 'Cl₂', atoms: [{ el: 'Cl', on: 0, count: 2 }] }
        ],
        rhs: [
            { formula: 'HCl', atoms: [{ el: 'H', on: +1 }, { el: 'Cl', on: -1 }] },
            { formula: 'S', atoms: [{ el: 'S', on: 0 }] }
        ],
        klass: 'redox',
        diff: [
            { el: 'S', from: -2, to: 0, species: 'S in H₂S → S' },
            { el: 'Cl', from: 0, to: -1, species: 'Cl in Cl₂ → HCl' }
        ],
        oxidant: 'Cl₂',
        reductant: 'H₂S'
    },
    {
        id: 'fe3o4-al',
        title: '3 Fe₃O₄ + 8 Al → 9 Fe + 4 Al₂O₃',
        note: '§7.1 Problem 7.1(ii) · thermite',
        lhs: [
            { formula: 'Fe₃O₄', atoms: [{ el: 'Fe', on: 8/3, onLabel: '+8⁄3', count: 3 }, { el: 'O', on: -2, count: 4 }] },
            { formula: 'Al', atoms: [{ el: 'Al', on: 0 }] }
        ],
        rhs: [
            { formula: 'Fe', atoms: [{ el: 'Fe', on: 0 }] },
            { formula: 'Al₂O₃', atoms: [{ el: 'Al', on: +3, count: 2 }, { el: 'O', on: -2, count: 3 }] }
        ],
        klass: 'displacement',
        diff: [
            { el: 'Fe', from: 8/3, to: 0, species: 'Fe in Fe₃O₄ → Fe' },
            { el: 'Al', from: 0, to: +3, species: 'Al → Al³⁺' }
        ],
        oxidant: 'Fe₃O₄',
        reductant: 'Al'
    },
    {
        id: 'cu2o-cu2s',
        title: '2 Cu₂O + Cu₂S → 6 Cu + SO₂',
        note: 'Problem 7.4',
        lhs: [
            { formula: 'Cu₂O', atoms: [{ el: 'Cu', on: +1, count: 2 }, { el: 'O', on: -2 }] },
            { formula: 'Cu₂S', atoms: [{ el: 'Cu', on: +1, count: 2 }, { el: 'S', on: -2 }] }
        ],
        rhs: [
            { formula: 'Cu', atoms: [{ el: 'Cu', on: 0 }] },
            { formula: 'SO₂', atoms: [{ el: 'S', on: +4 }, { el: 'O', on: -2, count: 2 }] }
        ],
        klass: 'redox',
        diff: [
            { el: 'Cu', from: +1, to: 0, species: 'Cu → Cu' },
            { el: 'S', from: -2, to: +4, species: 'S in Cu₂S → SO₂' }
        ],
        oxidant: 'Cu₂O',
        reductant: 'Cu₂S'
    },
    {
        id: 'n2-o2',
        title: 'N₂ + O₂ → 2 NO',
        note: 'Problem 7.6(a) · combination redox',
        lhs: [
            { formula: 'N₂', atoms: [{ el: 'N', on: 0, count: 2 }] },
            { formula: 'O₂', atoms: [{ el: 'O', on: 0, count: 2 }] }
        ],
        rhs: [{ formula: 'NO', atoms: [{ el: 'N', on: +2 }, { el: 'O', on: -2 }] }],
        klass: 'combination',
        diff: [
            { el: 'N', from: 0, to: +2, species: 'N → NO' },
            { el: 'O', from: 0, to: -2, species: 'O → NO' }
        ],
        oxidant: 'O₂',
        reductant: 'N₂'
    },
    {
        id: 'nah-h2o',
        title: 'NaH + H₂O → NaOH + H₂',
        note: 'Problem 7.6(c) · displacement redox',
        lhs: [
            { formula: 'NaH', atoms: [{ el: 'Na', on: +1 }, { el: 'H', on: -1 }] },
            { formula: 'H₂O', atoms: [{ el: 'H', on: +1, count: 2 }, { el: 'O', on: -2 }] }
        ],
        rhs: [
            { formula: 'NaOH', atoms: [{ el: 'Na', on: +1 }, { el: 'O', on: -2 }, { el: 'H', on: +1 }] },
            { formula: 'H₂', atoms: [{ el: 'H', on: 0, count: 2 }] }
        ],
        klass: 'displacement',
        diff: [
            { el: 'H', from: -1, to: 0, species: 'H in NaH → H₂' },
            { el: 'H', from: +1, to: 0, species: 'H in H₂O → H₂' }
        ],
        oxidant: 'H₂O',
        reductant: 'NaH'
    },
    {
        id: 'pb-no3',
        title: '2 Pb(NO₃)₂ → 2 PbO + 4 NO₂ + O₂',
        note: 'Problem 7.6(b) · decomposition redox',
        lhs: [{ formula: 'Pb(NO₃)₂', atoms: [{ el: 'Pb', on: +2 }, { el: 'N', on: +5, count: 2 }, { el: 'O', on: -2, count: 6 }] }],
        rhs: [
            { formula: 'PbO', atoms: [{ el: 'Pb', on: +2 }, { el: 'O', on: -2 }] },
            { formula: 'NO₂', atoms: [{ el: 'N', on: +4 }, { el: 'O', on: -2, count: 2 }] },
            { formula: 'O₂', atoms: [{ el: 'O', on: 0, count: 2 }] }
        ],
        klass: 'decomposition',
        diff: [
            { el: 'N', from: +5, to: +4, species: 'N in NO₃⁻ → NO₂' },
            { el: 'O', from: -2, to: 0, species: 'O → O₂' }
        ],
        oxidant: 'NO₃⁻',
        reductant: 'O²⁻'
    },
    {
        id: 'caco3',
        title: 'CaCO₃ → CaO + CO₂',
        note: '§7.4 · decomposition without oxidation-number change',
        lhs: [{ formula: 'CaCO₃', atoms: [{ el: 'Ca', on: +2 }, { el: 'C', on: +4 }, { el: 'O', on: -2, count: 3 }] }],
        rhs: [
            { formula: 'CaO', atoms: [{ el: 'Ca', on: +2 }, { el: 'O', on: -2 }] },
            { formula: 'CO₂', atoms: [{ el: 'C', on: +4 }, { el: 'O', on: -2, count: 2 }] }
        ],
        klass: 'not',
        diff: []
    }
];

const DISPRO_REACTIONS: ReactionDef[] = [
    {
        id: 'h2o2',
        title: '2 H₂O₂ → 2 H₂O + O₂',
        note: 'Eqn 7.45 · oxygen disproportionates',
        lhs: [{ formula: 'H₂O₂', atoms: [{ el: 'H', on: +1, count: 2 }, { el: 'O', on: -1, count: 2 }] }],
        rhs: [
            { formula: 'H₂O', atoms: [{ el: 'H', on: +1, count: 2 }, { el: 'O', on: -2 }] },
            { formula: 'O₂', atoms: [{ el: 'O', on: 0, count: 2 }] }
        ],
        klass: 'disproportionation',
        diff: [
            { el: 'O', from: -1, to: -2, species: 'O (−1) → O in H₂O (−2) · reduction' },
            { el: 'O', from: -1, to: 0,  species: 'O (−1) → O₂ (0) · oxidation' }
        ]
    },
    {
        id: 'cl2-oh',
        title: 'Cl₂ + 2 OH⁻ → ClO⁻ + Cl⁻ + H₂O',
        note: 'Eqn 7.48 · household bleach formation',
        lhs: [
            { formula: 'Cl₂', atoms: [{ el: 'Cl', on: 0, count: 2 }] },
            { formula: 'OH', charge: '−', atoms: [{ el: 'O', on: -2 }, { el: 'H', on: +1 }] }
        ],
        rhs: [
            { formula: 'ClO', charge: '−', atoms: [{ el: 'Cl', on: +1 }, { el: 'O', on: -2 }] },
            { formula: 'Cl', charge: '−', atoms: [{ el: 'Cl', on: -1 }] },
            { formula: 'H₂O', atoms: [{ el: 'H', on: +1, count: 2 }, { el: 'O', on: -2 }] }
        ],
        medium: 'basic',
        klass: 'disproportionation',
        diff: [
            { el: 'Cl', from: 0, to: +1, species: 'Cl (0) → ClO⁻ (+1) · oxidation' },
            { el: 'Cl', from: 0, to: -1, species: 'Cl (0) → Cl⁻ (−1) · reduction' }
        ]
    },
    {
        id: 'p4',
        title: 'P₄ + 3 OH⁻ + 3 H₂O → PH₃ + 3 H₂PO₂⁻',
        note: 'Eqn 7.46',
        lhs: [
            { formula: 'P₄', atoms: [{ el: 'P', on: 0, count: 4 }] },
            { formula: 'OH', charge: '−', atoms: [{ el: 'O', on: -2 }, { el: 'H', on: +1 }] },
            { formula: 'H₂O', atoms: [{ el: 'H', on: +1, count: 2 }, { el: 'O', on: -2 }] }
        ],
        rhs: [
            { formula: 'PH₃', atoms: [{ el: 'P', on: -3 }, { el: 'H', on: +1, count: 3 }] },
            { formula: 'H₂PO₂', charge: '−', atoms: [{ el: 'P', on: +1 }, { el: 'H', on: +1, count: 2 }, { el: 'O', on: -2, count: 2 }] }
        ],
        medium: 'basic',
        klass: 'disproportionation',
        diff: [
            { el: 'P', from: 0, to: -3, species: 'P (0) → PH₃ (−3) · reduction' },
            { el: 'P', from: 0, to: +1, species: 'P (0) → H₂PO₂⁻ (+1) · oxidation' }
        ]
    }
];

const BALANCERS: BalancerDef[] = [
    {
        id: 'cr2o7-so3',
        method: 'oxidation-number',
        title: 'Cr₂O₇²⁻ + SO₃²⁻ in acidic medium',
        citation: 'Problem 7.8 · oxidation-number method (5 steps)',
        steps: [
            { title: 'Step 1 — Skeletal equation',                          equation: 'Cr₂O₇²⁻ + SO₃²⁻ → Cr³⁺ + SO₄²⁻',                          note: 'Write correct formulas for reactants and products.' },
            { title: 'Step 2 — Assign oxidation numbers',                    equation: 'Cr(+6)₂O(−2)₇²⁻ + S(+4)O(−2)₃²⁻ → Cr(+3)³⁺ + S(+6)O(−2)₄²⁻', note: 'Cr decreases +6 → +3; S increases +4 → +6.' },
            { title: 'Step 3 — Equalise increase = decrease',                equation: 'Cr₂O₇²⁻ + 3 SO₃²⁻ → 2 Cr³⁺ + 3 SO₄²⁻',                    note: 'Decrease 6 (2 Cr×3) = Increase 6 (3 S×2). Stamp coefficients 2 and 3.' },
            { title: 'Step 4 — Balance charges with H⁺ (acidic)',            equation: 'Cr₂O₇²⁻ + 3 SO₃²⁻ + 8 H⁺ → 2 Cr³⁺ + 3 SO₄²⁻',             note: 'LHS charge −8, RHS 0 ⇒ add 8 H⁺ on left.' },
            { title: 'Step 5 — Balance H and O with H₂O',                    equation: 'Cr₂O₇²⁻ + 3 SO₃²⁻ + 8 H⁺ → 2 Cr³⁺ + 3 SO₄²⁻ + 4 H₂O',     note: '8 H on left ⇒ add 4 H₂O on right. O count checks out ✓' }
        ]
    },
    {
        id: 'mno4-br',
        method: 'oxidation-number',
        title: 'MnO₄⁻ + Br⁻ in basic medium',
        citation: 'Problem 7.9 · oxidation-number method',
        steps: [
            { title: 'Step 1 — Skeletal equation',                  equation: 'MnO₄⁻ + Br⁻ → MnO₂ + BrO₃⁻',              note: '' },
            { title: 'Step 2 — Assign oxidation numbers',            equation: 'Mn(+7)O₄⁻ + Br(−1)⁻ → Mn(+4)O₂ + Br(+5)O₃⁻', note: 'Mn ↓3, Br ↑6.' },
            { title: 'Step 3 — Equalise change',                     equation: '2 MnO₄⁻ + Br⁻ → 2 MnO₂ + BrO₃⁻',           note: 'Multiply Mn species by 2.' },
            { title: 'Step 4 — Balance charges with OH⁻ (basic)',    equation: '2 MnO₄⁻ + Br⁻ → 2 MnO₂ + BrO₃⁻ + 2 OH⁻',   note: 'Charges balanced.' },
            { title: 'Step 5 — Balance H and O with H₂O',            equation: '2 MnO₄⁻ + Br⁻ + H₂O → 2 MnO₂ + BrO₃⁻ + 2 OH⁻', note: 'Add 1 H₂O on left.' }
        ]
    },
    {
        id: 'fe2-cr2o7',
        method: 'half-reaction',
        title: 'Fe²⁺ + Cr₂O₇²⁻ in acidic medium',
        citation: '§7.5(b) · half-reaction method (Eqn 7.50 – 7.58)',
        steps: [
            { title: 'Step 1 — Unbalanced ionic equation',     equation: 'Fe²⁺ + Cr₂O₇²⁻ → Fe³⁺ + Cr³⁺',                                  note: '' },
            { title: 'Step 2 — Split into half-reactions',     equation: 'OX: Fe²⁺ → Fe³⁺      RED: Cr₂O₇²⁻ → Cr³⁺',                       note: 'Oxidation and reduction halves.' },
            { title: 'Step 3 — Balance non-O/H atoms',         equation: 'OX: Fe²⁺ → Fe³⁺      RED: Cr₂O₇²⁻ → 2 Cr³⁺',                     note: 'Multiply Cr³⁺ by 2.' },
            { title: 'Step 4 — Add H₂O and H⁺ (acidic)',        equation: 'RED: Cr₂O₇²⁻ + 14 H⁺ → 2 Cr³⁺ + 7 H₂O',                          note: '7 H₂O on right; 14 H⁺ on left.' },
            { title: 'Step 5 — Balance charges with e⁻',        equation: 'OX: Fe²⁺ → Fe³⁺ + e⁻        RED: Cr₂O₇²⁻ + 14 H⁺ + 6 e⁻ → 2 Cr³⁺ + 7 H₂O', note: 'OX needs 1 e⁻; RED needs 6 e⁻.' },
            { title: 'Step 6 — Equalise electrons',             equation: 'OX × 6:  6 Fe²⁺ → 6 Fe³⁺ + 6 e⁻',                                note: 'Multiply oxidation half by 6.' },
            { title: 'Step 7 — Add halves and verify',          equation: '6 Fe²⁺ + Cr₂O₇²⁻ + 14 H⁺ → 6 Fe³⁺ + 2 Cr³⁺ + 7 H₂O',              note: 'Atoms and charges balanced ✓' }
        ]
    }
];

const RULES = [
    { n: 1, body: 'Free element (H₂, O₂, Cl₂, Na, S₈ …) ⇒ ON = 0' },
    { n: 2, body: 'Monoatomic ion = charge; alkali +1, alkaline earth +2, Al +3' },
    { n: 3, body: 'O = −2 normally; −1 in peroxide; −½ in superoxide; +2/+1 with F' },
    { n: 4, body: 'H = +1 normally; −1 in metallic hydrides (LiH, NaH, CaH₂)' },
    { n: 5, body: 'F always −1. Cl/Br/I = −1 except with O' },
    { n: 6, body: 'Sum of ON = 0 for compound; = charge for polyatomic ion' }
];

const W = 1280;
const H = 760;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const fmtON = (a: AtomNode) => a.onLabel ?? (a.on > 0 ? `+${a.on}` : `${a.on}`);
const colorForON = (on: number) => on > 0 ? '#d97706' : on < 0 ? '#0d9488' : '#475569';

const KLASS_LABEL: Record<ReactionDef['klass'], string> = {
    combination: 'COMBINATION redox',
    decomposition: 'DECOMPOSITION redox',
    displacement: 'DISPLACEMENT redox',
    disproportionation: 'DISPROPORTIONATION',
    redox: 'REDOX',
    not: 'Not a redox reaction'
};

const RedoxOxidationNumberLab: React.FC<RedoxOxidationNumberLabProps> = ({ topic, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const tRef = useRef(0);
    const phaseRef = useRef(0); // 0..1 reactant→product slide

    const [mode, setMode] = useState<Mode>('rules');
    const [compoundIdx, setCompoundIdx] = useState(1); // start at H₂O₂ — interesting
    const [reactionIdx, setReactionIdx] = useState(0);
    const [disproIdx, setDisproIdx] = useState(0);
    const [balancerIdx, setBalancerIdx] = useState(0);
    const [step, setStep] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [paused, setPaused] = useState(false);

    const compound = COMPOUNDS[compoundIdx];
    const reaction = mode === 'dispro' ? DISPRO_REACTIONS[disproIdx] : REACTIONS[reactionIdx];
    const balancer = BALANCERS[balancerIdx];

    const animationActive = mode === 'classify' || mode === 'dispro';

    // ===== draw =====
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // grid
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // header
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 18px Inter, ui-sans-serif, system-ui';
        ctx.textAlign = 'left';
        const header = mode === 'rules' ? 'Oxidation Number Rule Explorer'
            : mode === 'classify' ? `Redox classifier  ·  ${KLASS_LABEL[reaction.klass]}`
            : mode === 'dispro' ? `Disproportionation  ·  ${reaction.title}`
            : `Balancer  ·  ${balancer.method === 'oxidation-number' ? 'Oxidation-number method' : 'Half-reaction method'}`;
        ctx.fillText(header, 32, 38);

        if (mode === 'rules') drawRules(ctx, compound, tRef.current);
        else if (mode === 'balancer') drawBalancer(ctx, balancer, step);
        else drawReaction(ctx, reaction, animationActive ? phaseRef.current : 0, tRef.current);

        // hint line
        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px Inter';
        ctx.textAlign = 'center';
        const hints: Record<Mode, string> = {
            rules: 'Each preset example shows the matching rule from NCERT’s six-rule sequence.',
            classify: 'Amber = element oxidised (ON ↑) · Teal = element reduced (ON ↓). Slate = unchanged.',
            dispro: 'Same element appears in two products — at higher AND lower oxidation state.',
            balancer: 'Step ▶ follows the NCERT sequence as coefficients, ions and water are added.'
        };
        ctx.fillText(hints[mode], W / 2, 738);
    }, [mode, compound, reaction, balancer, step, animationActive]);

    // ===== anim loop =====
    useEffect(() => {
        let last = performance.now();
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000) * speed;
            last = now;
            if (!paused) {
                tRef.current += dt;
                if (animationActive) {
                    // ping-pong reactant→product
                    const cyc = (tRef.current * 0.35) % 2;
                    phaseRef.current = cyc < 1 ? cyc : 2 - cyc;
                }
            }
            draw();
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
    }, [draw, paused, speed, animationActive]);

    const handleReset = () => {
        tRef.current = 0; phaseRef.current = 0; setStep(0);
        setMode('rules'); setCompoundIdx(1); setReactionIdx(0); setDisproIdx(0); setBalancerIdx(0);
        setSpeed(1); setPaused(false);
    };

    // ===== left aside =====
    const graphPanel = (
        <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
            <div className="flex flex-col gap-2.5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">6 NCERT rules for ON</div>
                    <div className="text-xs font-semibold text-slate-500">§7.3 — apply top-down</div>
                    <ol className="mt-2 space-y-1.5 text-sm text-slate-700">
                        {RULES.map(r => (
                            <li key={r.n} className="flex gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-extrabold text-amber-700">{r.n}</span>
                                <span className="leading-snug">{r.body}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Period-3 highest ON</div>
                    <div className="text-xs font-semibold text-slate-500">NCERT — rises 1 → 7 across the period</div>
                    <div className="mt-2 grid grid-cols-7 gap-1.5">
                        {[
                            { sym: 'Na', n: 1 }, { sym: 'Mg', n: 2 }, { sym: 'Al', n: 3 },
                            { sym: 'Si', n: 4 }, { sym: 'P',  n: 5 }, { sym: 'S',  n: 6 }, { sym: 'Cl', n: 7 }
                        ].map(e => (
                            <div key={e.sym} className="rounded-lg border border-slate-200 bg-amber-50/60 p-1.5 text-center">
                                <div className="text-[11px] font-extrabold text-slate-800">{e.sym}</div>
                                <div className="text-[10px] font-bold text-amber-700">+{e.n}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
                    <div className="text-base font-extrabold">Definitions</div>
                    <div className="text-xs font-semibold text-slate-500">§7.3 boxed terms</div>
                    <ul className="mt-2 space-y-1 text-xs text-slate-700">
                        <li><b className="text-amber-700">Oxidation</b> · increase in ON</li>
                        <li><b className="text-teal-700">Reduction</b> · decrease in ON</li>
                        <li><b>Oxidant</b> · increases ON of another element (itself reduced)</li>
                        <li><b>Reductant</b> · lowers ON of another element (itself oxidised)</li>
                    </ul>
                </div>
            </div>
        </aside>
    );

    // ===== right aside =====
    const valuesPanel = (
        <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
            <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 shadow-xl backdrop-blur">
                    <div className="text-base font-extrabold text-amber-900">Redox & Oxidation Number</div>
                    <div className="text-xs font-semibold text-amber-700">NCERT Class 11 · Ch 7 §7.2 – §7.5</div>
                    <ul className="mt-2 list-disc pl-4 text-sm leading-snug text-amber-950 space-y-1.5">
                        <li><b>Oxidation</b> = loss of e⁻ = ON increases</li>
                        <li><b>Reduction</b> = gain of e⁻ = ON decreases</li>
                        <li>Both halves always occur together — hence "redox"</li>
                        <li><b>Disproportionation:</b> same element oxidised & reduced (H₂O₂, Cl₂/OH⁻)</li>
                        <li>Balance via <b>oxidation-number method</b> (5 steps) or <b>half-reaction method</b> (7 steps)</li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between">
                        <div className="text-base font-extrabold text-slate-900">Selected example</div>
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            NCERT
                        </span>
                    </div>

                    {mode === 'rules' && (
                        <div className="mt-3 grid gap-2">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Compound</div>
                                <div className="mt-0.5 font-mono text-base font-extrabold text-slate-800">
                                    {compound.formula}{compound.charge ? <sup>{compound.charge}</sup> : null}
                                </div>
                            </div>
                            {compound.atoms.map((a, i) => (
                                <div key={i} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-sm font-bold text-slate-800">{a.el}{a.count && a.count > 1 ? <sub>{a.count}</sub> : null}</span>
                                        <span className="rounded-md px-2 py-0.5 text-xs font-extrabold text-white" style={{ background: colorForON(a.on) }}>{fmtON(a)}</span>
                                    </div>
                                    {a.ruleHit && <div className="mt-1 text-[11px] text-slate-500">{a.ruleHit}</div>}
                                </div>
                            ))}
                            {compound.structureNote && (
                                <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] font-semibold leading-snug text-violet-900">
                                    {compound.structureNote}
                                </div>
                            )}
                        </div>
                    )}

                    {(mode === 'classify' || mode === 'dispro') && (
                        <div className="mt-3 grid gap-2">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Reaction class</div>
                                <div className="mt-0.5 text-sm font-extrabold text-slate-800">{KLASS_LABEL[reaction.klass]}</div>
                                <div className="mt-1 text-[11px] text-slate-500">{reaction.note}</div>
                            </div>
                            {reaction.diff.map((d, i) => (
                                <div key={i} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{d.species}</div>
                                    <div className="mt-1 flex items-center gap-2 font-mono text-sm font-extrabold">
                                        <span className="rounded-md px-2 py-0.5 text-white" style={{ background: colorForON(d.from) }}>{d.from > 0 ? `+${d.from}` : d.from}</span>
                                        <span className="text-slate-400">→</span>
                                        <span className="rounded-md px-2 py-0.5 text-white" style={{ background: colorForON(d.to) }}>{d.to > 0 ? `+${d.to}` : d.to}</span>
                                        <span className={`ml-auto text-xs ${d.to > d.from ? 'text-amber-700' : 'text-teal-700'}`}>
                                            {d.to > d.from ? '↑ oxidation' : '↓ reduction'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {reaction.oxidant && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                                    Oxidant: {reaction.oxidant} &nbsp;·&nbsp; Reductant: {reaction.reductant}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'balancer' && (
                        <div className="mt-3 grid gap-2">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Method</div>
                                <div className="mt-0.5 text-sm font-extrabold text-slate-800">
                                    {balancer.method === 'oxidation-number' ? 'Oxidation-number method' : 'Half-reaction (ion-electron) method'}
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500">{balancer.citation}</div>
                            </div>
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                                Step {step + 1} / {balancer.steps.length}
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{balancer.steps[step].title}</div>
                                <div className="mt-1 font-mono text-xs font-extrabold text-slate-800">{balancer.steps[step].equation}</div>
                                {balancer.steps[step].note && <div className="mt-1 text-[11px] text-slate-500">{balancer.steps[step].note}</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );

    // ===== simulation combo =====
    const simulationCombo = (
        <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
                <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
            </div>
            {graphPanel}
            {valuesPanel}
        </div>
    );

    // ===== controls =====
    const controlsComponent = (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <FlaskConical size={18} className="text-amber-600" />
                Redox &amp; Oxidation Number Visualiser
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Demonstration mode</div>
                    <div className="grid grid-cols-4 gap-2">
                        {([
                            { id: 'rules',    label: 'Rules',          icon: <Tag size={14} /> },
                            { id: 'classify', label: 'Classify',       icon: <Layers size={14} /> },
                            { id: 'dispro',   label: 'Disprop.',       icon: <Split size={14} /> },
                            { id: 'balancer', label: 'Balancer',       icon: <Sigma size={14} /> }
                        ] as { id: Mode; label: string; icon: React.ReactNode }[]).map(m => (
                            <button key={m.id}
                                onClick={() => { setMode(m.id); setStep(0); }}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-extrabold transition ${mode === m.id ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                {m.icon}{m.label}
                            </button>
                        ))}
                    </div>

                    {mode === 'rules' && (
                        <>
                            <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Compound</div>
                            <select value={compoundIdx} onChange={e => setCompoundIdx(Number(e.target.value))}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800">
                                {COMPOUNDS.map((c, i) => (
                                    <option key={c.formula} value={i}>{c.formula}{c.charge ? c.charge : ''}</option>
                                ))}
                            </select>
                        </>
                    )}

                    {mode === 'classify' && (
                        <>
                            <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Reaction (NCERT canon)</div>
                            <select value={reactionIdx} onChange={e => setReactionIdx(Number(e.target.value))}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800">
                                {REACTIONS.map((r, i) => <option key={r.id} value={i}>{r.title}</option>)}
                            </select>
                        </>
                    )}

                    {mode === 'dispro' && (
                        <>
                            <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Disproportionation reaction</div>
                            <select value={disproIdx} onChange={e => setDisproIdx(Number(e.target.value))}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800">
                                {DISPRO_REACTIONS.map((r, i) => <option key={r.id} value={i}>{r.title}</option>)}
                            </select>
                        </>
                    )}

                    {mode === 'balancer' && (
                        <>
                            <div className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Worked example</div>
                            <select value={balancerIdx} onChange={e => { setBalancerIdx(Number(e.target.value)); setStep(0); }}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800">
                                {BALANCERS.map((b, i) => <option key={b.id} value={i}>{b.title}</option>)}
                            </select>
                        </>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPaused(p => !p)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                            title={paused ? 'Play animation' : 'Pause animation'}
                            aria-label={paused ? 'Play animation' : 'Pause animation'}
                        >
                            {paused ? <Play size={18} /> : <Pause size={18} />}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                            title="Reset simulation"
                            aria-label="Reset simulation"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <div className="min-w-0 flex-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-700">NCERT focus</div>
                            <div className="truncate text-xs font-extrabold text-amber-950">
                                {mode === 'rules' && `${compound.formula}${compound.charge ?? ''} · six-rule sequence`}
                                {mode === 'classify' && `${KLASS_LABEL[reaction.klass]} · ${reaction.oxidant ? `oxidant ${reaction.oxidant}` : 'no ON change'}`}
                                {mode === 'dispro' && 'Intermediate ON forms both a higher and a lower ON'}
                                {mode === 'balancer' && `${balancer.citation} · step ${step + 1}/${balancer.steps.length}`}
                            </div>
                        </div>
                    </div>

                    {mode === 'balancer' && (
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Walk the steps</div>
                            <div className="mt-2 flex items-center gap-2">
                                <button onClick={() => setStep(s => Math.max(0, s - 1))}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50">
                                    ◀ Back
                                </button>
                                <button onClick={() => setStep(s => Math.min(balancer.steps.length - 1, s + 1))}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-extrabold text-amber-900 hover:bg-amber-100">
                                    Step <SkipForward size={14} />
                                </button>
                                <button onClick={() => setStep(0)}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50">
                                    Restart
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                            Animation speed <span className="font-mono text-slate-700">{speed.toFixed(2)}×</span>
                        </label>
                        <input type="range" min={0.25} max={2.5} step={0.05} value={speed}
                            onChange={e => setSpeed(Number(e.target.value))}
                            className="w-full accent-amber-600" />
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600 flex items-center gap-2">
                        <Atom size={14} className="text-amber-600" />
                        {mode === 'rules' && 'Each element type gets an ON badge — slate for 0, amber for +, teal for −.'}
                        {mode === 'classify' && <span>Use <ArrowRight size={11} className="inline" /> Play to animate species and ON changes.</span>}
                        {mode === 'dispro' && 'Watch the same element split into two destinations.'}
                        {mode === 'balancer' && 'Each Step ▶ follows the next stage of the NCERT method.'}
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
            ControlsComponent={controlsComponent}
            controlsAreaFlex="0 0 240px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

// ===== drawing helpers =====

function drawMoleculeTile(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    sp: Species,
    tileW = 200,
    alpha = 1
) {
    const tileH = 130;
    const x = cx - tileW / 2;
    const y = cy - tileH / 2;
    // tile
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, tileW, tileH, 16);
    ctx.fill();
    ctx.stroke();
    // formula
    ctx.fillStyle = '#0f172a';
    const formulaSize = Math.max(20, Math.min(30, tileW * 0.16));
    ctx.font = `800 ${formulaSize}px Inter, ui-sans-serif, system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = sp.charge ? `${sp.formula}${sp.charge}` : sp.formula;
    ctx.fillText(label, cx, cy + 8);
    // ON badges across top
    const n = sp.atoms.length;
    const slotW = (tileW - 30) / n;
    sp.atoms.forEach((a, i) => {
        const bx = x + 15 + slotW * (i + 0.5);
        const by = y + 22;
        const txt = `${a.el}: ${fmtON(a)}`;
        const badgeSize = tileW < 175 ? 10 : 13;
        ctx.font = `800 ${badgeSize}px Inter`;
        const w = Math.min(slotW - 4, ctx.measureText(txt).width + 12);
        ctx.fillStyle = colorForON(a.on);
        roundRect(ctx, bx - w / 2, by - 11, w, 22, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(txt, bx, by + 1);
    });
    ctx.restore();
}

function drawRules(ctx: CanvasRenderingContext2D, sp: Species, t: number) {
    // central one big molecule with each atom as a glowing ball + ON badge
    const cx = W / 2;
    const cy = 360;
    // big formula
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 96px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fullLabel = sp.charge ? `${sp.formula}${sp.charge}` : sp.formula;
    ctx.fillText(fullLabel, cx, cy);
    ctx.restore();

    // ON badges fanned out
    const n = sp.atoms.length;
    const radius = 230;
    sp.atoms.forEach((a, i) => {
        const ang = -Math.PI / 2 + (i - (n - 1) / 2) * (Math.PI / (n + 2));
        const bx = cx + radius * Math.cos(ang) * 1.1;
        const by = cy + radius * Math.sin(ang) - 60;
        // line from center
        ctx.save();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * 80, cy + Math.sin(ang) * 50);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        // bubble
        ctx.save();
        const pulse = 1 + 0.04 * Math.sin(t * 2 + i);
        const color = colorForON(a.on);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        const rad = 46 * pulse;
        ctx.beginPath();
        ctx.arc(bx, by, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '900 22px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${a.el}${a.count && a.count > 1 ? `×${a.count}` : ''}`, bx, by - 8);
        ctx.font = '900 22px Inter';
        ctx.fillText(fmtON(a), bx, by + 16);
        ctx.restore();
        // rule chip
        if (a.ruleHit) {
            ctx.save();
            ctx.fillStyle = '#fff7ed';
            ctx.strokeStyle = '#fdba74';
            ctx.lineWidth = 1;
            const chipText = a.ruleHit;
            ctx.font = '700 11px Inter';
            const w = ctx.measureText(chipText).width + 16;
            const chipY = by + 60;
            roundRect(ctx, bx - w / 2, chipY - 10, w, 22, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#9a3412';
            ctx.textBaseline = 'middle';
            ctx.fillText(chipText, bx, chipY + 1);
            ctx.restore();
        }
    });
}

function drawReaction(ctx: CanvasRenderingContext2D, r: ReactionDef, phase: number, t: number) {
    const yTop = 200;
    const leftZone = { start: 55, end: 555 };
    const rightZone = { start: 725, end: 1225 };
    const gap = 14;
    const layout = (items: Species[], zone: { start: number; end: number }) => {
        const count = Math.max(1, items.length);
        const available = zone.end - zone.start;
        const tileW = Math.min(210, (available - gap * (count - 1)) / count);
        const total = tileW * count + gap * (count - 1);
        const first = zone.start + (available - total) / 2 + tileW / 2;
        return { tileW, centers: items.map((_, i) => first + i * (tileW + gap)) };
    };
    const lhsLayout = layout(r.lhs, leftZone);
    const rhsLayout = layout(r.rhs, rightZone);
    const lhsShift = phase * 20;
    const rhsShift = (1 - phase) * -20;
    const lhsAlpha = 1 - phase * 0.2;
    const rhsAlpha = 0.45 + phase * 0.55;

    r.lhs.forEach((sp, i) => drawMoleculeTile(ctx, lhsLayout.centers[i] + lhsShift, yTop, sp, lhsLayout.tileW, lhsAlpha));
    r.rhs.forEach((sp, i) => drawMoleculeTile(ctx, rhsLayout.centers[i] + rhsShift, yTop, sp, rhsLayout.tileW, rhsAlpha));

    const drawPlusSigns = (centers: number[], shift: number, alpha: number) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#64748b';
        ctx.font = '900 24px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < centers.length - 1; i += 1) {
            ctx.fillText('+', (centers[i] + centers[i + 1]) / 2 + shift, yTop);
        }
        ctx.restore();
    };
    drawPlusSigns(lhsLayout.centers, lhsShift, lhsAlpha);
    drawPlusSigns(rhsLayout.centers, rhsShift, rhsAlpha);

    // Central reaction arrow always occupies its own fixed lane.
    const arrowY = yTop;
    const arrowX = 590;
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.fillStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX + 80, arrowY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(arrowX + 80, arrowY);
    ctx.lineTo(arrowX + 70, arrowY - 8);
    ctx.lineTo(arrowX + 70, arrowY + 8);
    ctx.closePath();
    ctx.fill();
    if (r.medium) {
        ctx.fillStyle = r.medium === 'acidic' ? '#fef3c7' : '#ccfbf1';
        ctx.strokeStyle = r.medium === 'acidic' ? '#d97706' : '#0d9488';
        ctx.lineWidth = 1.5;
        const txt = r.medium === 'acidic' ? 'H⁺ acidic' : 'OH⁻ basic';
        ctx.font = '800 12px Inter';
        const w = ctx.measureText(txt).width + 16;
        roundRect(ctx, arrowX + 40 - w / 2, arrowY + 14, w, 22, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = r.medium === 'acidic' ? '#92400e' : '#115e59';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, arrowX + 40, arrowY + 26);
    }
    ctx.restore();
    // ON axis below
    if (r.diff.length > 0) {
        drawONAxis(ctx, 80, 480, W - 160, r.diff, phase, t, r.klass === 'disproportionation');
    } else {
        ctx.save();
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        roundRect(ctx, 330, 438, 620, 92, 18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#334155';
        ctx.font = '900 20px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No oxidation-number change', W / 2, 472);
        ctx.font = '600 14px Inter';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Decomposition can occur without being a redox reaction.', W / 2, 502);
        ctx.restore();
    }

    // class stamp
    ctx.save();
    const stampColor = r.klass === 'disproportionation' ? '#7c3aed' : '#0f172a';
    ctx.fillStyle = stampColor;
    ctx.font = '900 28px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(KLASS_LABEL[r.klass], W / 2, 670);
    ctx.font = '600 13px Inter';
    ctx.fillStyle = '#64748b';
    ctx.fillText(r.note, W / 2, 696);
    ctx.restore();
}

function drawONAxis(
    ctx: CanvasRenderingContext2D, x: number, y: number, w: number,
    diff: { el: string; from: number; to: number; species: string }[],
    phase: number, t: number, dispro: boolean
) {
    const min = -4, max = 7;
    const onX = (on: number) => x + ((on - min) / (max - min)) * w;
    ctx.save();
    // axis line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    // ticks
    for (let i = min; i <= max; i++) {
        const xx = onX(i);
        ctx.beginPath();
        ctx.moveTo(xx, y - 6);
        ctx.lineTo(xx, y + 6);
        ctx.stroke();
        ctx.fillStyle = '#475569';
        ctx.font = '700 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(i > 0 ? `+${i}` : `${i}`, xx, y + 22);
    }
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 13px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('Oxidation Number Axis', x, y - 18);
    // 0 line emphasised
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(onX(0), y - 30); ctx.lineTo(onX(0), y + 30);
    ctx.stroke();

    // dots
    diff.forEach((d, i) => {
        const startX = onX(d.from);
        const endX = onX(d.to);
        const curX = startX + (endX - startX) * phase;
        const offset = dispro ? (i === 0 ? -16 : 16) : (i * 22 - (diff.length - 1) * 11);
        const dy = y - 30 + offset;
        const color = d.to > d.from ? '#d97706' : '#0d9488';
        // trail
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, dy);
        ctx.bezierCurveTo(startX, dy - 26, endX, dy - 26, endX, dy);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // ghost end
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(endX, dy, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // moving dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(curX, dy, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.el, curX, dy + 1);
    });
    ctx.restore();
}

function drawBalancer(ctx: CanvasRenderingContext2D, b: BalancerDef, step: number) {
    const cur = b.steps[step];
    // step pill row at top
    const pillY = 200;
    const pillH = 38;
    const totalW = W - 200;
    const each = totalW / b.steps.length;
    b.steps.forEach((s, i) => {
        const x = 100 + i * each + 6;
        ctx.save();
        const active = i === step;
        const done = i < step;
        ctx.fillStyle = active ? '#fde68a' : done ? '#d1fae5' : '#f1f5f9';
        ctx.strokeStyle = active ? '#d97706' : done ? '#10b981' : '#cbd5e1';
        ctx.lineWidth = active ? 2.5 : 1.5;
        roundRect(ctx, x, pillY, each - 12, pillH, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? '#7c2d12' : done ? '#065f46' : '#475569';
        ctx.font = '800 12px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Step ${i + 1}`, x + (each - 12) / 2, pillY + pillH / 2);
        ctx.restore();
    });

    // big equation
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 30px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    wrapText(ctx, cur.equation, W / 2, 360, W - 200, 44);
    ctx.restore();

    // title and note
    ctx.save();
    ctx.fillStyle = '#92400e';
    ctx.font = '800 22px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(cur.title, W / 2, 540);
    ctx.fillStyle = '#475569';
    ctx.font = '500 14px Inter';
    wrapText(ctx, cur.note, W / 2, 580, W - 220, 22);
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 14px Inter';
    ctx.fillText(b.citation, W / 2, 670);
    ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, maxW: number, lineH: number) {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (ctx.measureText(test).width > maxW) {
            if (cur) lines.push(cur);
            cur = w;
        } else cur = test;
    }
    if (cur) lines.push(cur);
    const startY = cy - ((lines.length - 1) * lineH) / 2;
    lines.forEach((ln, i) => ctx.fillText(ln, cx, startY + i * lineH));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, Math.min(w, h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
}

export default RedoxOxidationNumberLab;
