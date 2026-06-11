import React, { useMemo, useState } from 'react';
import {
    ArrowLeftRight,
    Award,
    BookOpen,
    CheckCircle,
    ChevronRight,
    Eye,
    EyeOff,
    FlaskConical,
    Layers,
    PenTool,
    RotateCcw,
    Search,
    Type,
    Users,
    XCircle
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Mode = 'naming' | 'ladder' | 'table' | 'compare' | 'quiz';
type Filter = 'all' | 'animals' | 'plants';
type FormatMode = 'printed' | 'handwritten';
type QuizMode = 'typography' | 'sequence' | 'match';

interface Organism {
    id: string;
    common: string;
    symbol: string;
    kingdom: 'Animalia' | 'Plantae';
    biological: string;
    genus: string;
    epithet: string;
    family: string;
    order: string;
    className: string;
    phylumDivision: string;
    author: string;
    ncCanonical?: boolean;
}

const W = 1640;
const H = 600;

const ORGANISMS: Organism[] = [
    { id: 'man', common: 'Man', symbol: 'MAN', kingdom: 'Animalia', biological: 'Homo sapiens', genus: 'Homo', epithet: 'sapiens', family: 'Hominidae', order: 'Primata', className: 'Mammalia', phylumDivision: 'Chordata', author: 'Linn.', ncCanonical: true },
    { id: 'housefly', common: 'Housefly', symbol: 'FLY', kingdom: 'Animalia', biological: 'Musca domestica', genus: 'Musca', epithet: 'domestica', family: 'Muscidae', order: 'Diptera', className: 'Insecta', phylumDivision: 'Arthropoda', author: 'Linn.', ncCanonical: true },
    { id: 'mango', common: 'Mango', symbol: 'MNG', kingdom: 'Plantae', biological: 'Mangifera indica', genus: 'Mangifera', epithet: 'indica', family: 'Anacardiaceae', order: 'Sapindales', className: 'Dicotyledonae', phylumDivision: 'Angiospermae', author: 'Linn.', ncCanonical: true },
    { id: 'wheat', common: 'Wheat', symbol: 'WHT', kingdom: 'Plantae', biological: 'Triticum aestivum', genus: 'Triticum', epithet: 'aestivum', family: 'Poaceae', order: 'Poales', className: 'Monocotyledonae', phylumDivision: 'Angiospermae', author: 'Linn.', ncCanonical: true },
    { id: 'lion', common: 'Lion', symbol: 'LEO', kingdom: 'Animalia', biological: 'Panthera leo', genus: 'Panthera', epithet: 'leo', family: 'Felidae', order: 'Carnivora', className: 'Mammalia', phylumDivision: 'Chordata', author: 'Linn.' },
    { id: 'tiger', common: 'Tiger', symbol: 'TIG', kingdom: 'Animalia', biological: 'Panthera tigris', genus: 'Panthera', epithet: 'tigris', family: 'Felidae', order: 'Carnivora', className: 'Mammalia', phylumDivision: 'Chordata', author: 'Linn.' },
    { id: 'leopard', common: 'Leopard', symbol: 'LPD', kingdom: 'Animalia', biological: 'Panthera pardus', genus: 'Panthera', epithet: 'pardus', family: 'Felidae', order: 'Carnivora', className: 'Mammalia', phylumDivision: 'Chordata', author: 'Linn.' },
    { id: 'cat', common: 'Cat', symbol: 'CAT', kingdom: 'Animalia', biological: 'Felis catus', genus: 'Felis', epithet: 'catus', family: 'Felidae', order: 'Carnivora', className: 'Mammalia', phylumDivision: 'Chordata', author: 'Linn.' },
    { id: 'dog', common: 'Dog', symbol: 'DOG', kingdom: 'Animalia', biological: 'Canis familiaris', genus: 'Canis', epithet: 'familiaris', family: 'Canidae', order: 'Carnivora', className: 'Mammalia', phylumDivision: 'Chordata', author: 'Linn.' },
    { id: 'potato', common: 'Potato', symbol: 'POT', kingdom: 'Plantae', biological: 'Solanum tuberosum', genus: 'Solanum', epithet: 'tuberosum', family: 'Solanaceae', order: 'Polymoniales', className: 'Dicotyledonae', phylumDivision: 'Angiospermae', author: 'Linn.' },
    { id: 'brinjal', common: 'Brinjal', symbol: 'BRN', kingdom: 'Plantae', biological: 'Solanum melongena', genus: 'Solanum', epithet: 'melongena', family: 'Solanaceae', order: 'Polymoniales', className: 'Dicotyledonae', phylumDivision: 'Angiospermae', author: 'Linn.' },
    { id: 'nightshade', common: 'Black nightshade', symbol: 'NGT', kingdom: 'Plantae', biological: 'Solanum nigrum', genus: 'Solanum', epithet: 'nigrum', family: 'Solanaceae', order: 'Polymoniales', className: 'Dicotyledonae', phylumDivision: 'Angiospermae', author: 'Linn.' },
    { id: 'datura', common: 'Datura', symbol: 'DAT', kingdom: 'Plantae', biological: 'Datura stramonium', genus: 'Datura', epithet: 'stramonium', family: 'Solanaceae', order: 'Polymoniales', className: 'Dicotyledonae', phylumDivision: 'Angiospermae', author: 'Linn.' },
    { id: 'petunia', common: 'Petunia', symbol: 'PET', kingdom: 'Plantae', biological: 'Petunia hybrida', genus: 'Petunia', epithet: 'hybrida', family: 'Solanaceae', order: 'Polymoniales', className: 'Dicotyledonae', phylumDivision: 'Angiospermae', author: 'Vilm.' }
];

const RANKS = ['Species', 'Genus', 'Family', 'Order', 'Class', 'Phylum/Division', 'Kingdom'] as const;
type Rank = typeof RANKS[number];

const MODE_INFO: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
    { id: 'naming', label: 'Naming', icon: <Type size={15} /> },
    { id: 'ladder', label: 'Ladder', icon: <Layers size={15} /> },
    { id: 'table', label: 'Table 1.1', icon: <BookOpen size={15} /> },
    { id: 'compare', label: 'Compare', icon: <ArrowLeftRight size={15} /> },
    { id: 'quiz', label: 'Quiz', icon: <Award size={15} /> }
];

const RULES = [
    'Rule 1: Biological names are generally Latin or Latinised and written in italics.',
    'Rule 2: The first word is the generic name; the second is the specific epithet.',
    'Rule 3: Printed names are italicised; handwritten names are separately underlined.',
    'Rule 4: Genus starts with a capital letter; specific epithet starts with a small letter.',
    "Rule 5: Author's name appears after the specific epithet in abbreviated form."
];

const TABLE_ROWS = ORGANISMS.filter((organism) => organism.ncCanonical);

const TABLE_NOTES: Record<string, string> = {
    Hominidae: 'Family of humans and great apes; includes Homo and related primates.',
    Angiospermae: 'Flowering plants division. NCERT uses Division for plants instead of Phylum.',
    Felidae: 'Cat family; includes Panthera and Felis.',
    Canidae: 'Dog family; distinct from Felidae though both belong to Carnivora.',
    Solanaceae: 'Plant family containing Solanum, Petunia and Datura.',
    Polymoniales: 'NCERT spelling is Polymoniales; modern spelling is often Polemoniales. It includes Convolvulaceae and Solanaceae.',
    Chordata: 'Phylum sharing notochord and dorsal hollow neural system.',
    Arthropoda: 'Phylum with jointed appendages; housefly belongs here.'
};

function rankValue(organism: Organism, rank: Rank) {
    if (rank === 'Species') return organism.biological;
    if (rank === 'Genus') return organism.genus;
    if (rank === 'Family') return organism.family;
    if (rank === 'Order') return organism.order;
    if (rank === 'Class') return organism.className;
    if (rank === 'Phylum/Division') return organism.phylumDivision;
    return organism.kingdom;
}

function firstDifferentRank(a: Organism, b: Organism) {
    return RANKS.find((rank) => rankValue(a, rank) !== rankValue(b, rank)) ?? 'Species';
}

function sharedCounter(rank: Rank) {
    return 7 - RANKS.indexOf(rank);
}

function validateName(value: string, organism: Organism, format: FormatMode, styled: boolean, includeAuthor: boolean) {
    const authorless = value.replace(/\s+(Linn\.|Vilm\.)$/i, '').trim();
    const parts = authorless.split(/\s+/).filter(Boolean);
    const messages: string[] = [];
    if (parts.length !== 2) messages.push('Rule 2: A binomial name must have exactly two words.');
    const [genus = '', species = ''] = parts;
    if (genus !== organism.genus) messages.push('Rule 4: Genus must match and start with a capital letter.');
    if (species !== organism.epithet) messages.push('Rule 4: Specific epithet must be lowercase and correct.');
    if (format === 'printed' && !styled) messages.push('Rule 3: Printed names must be italicised.');
    if (format === 'handwritten' && !styled) messages.push('Rule 3: Handwritten names must be separately underlined.');
    if (includeAuthor && !new RegExp(`${organism.author.replace('.', '\\.')}$`, 'i').test(value.trim())) messages.push("Rule 5: Add the author's abbreviated name after the specific epithet.");
    if (parts.length === 2 && genus && genus[0] !== genus[0].toUpperCase()) messages.push('Rule 4: Genus must start with a capital letter.');
    if (species && species !== species.toLowerCase()) messages.push('Rule 4: Specific epithet must start with a small letter.');
    return messages;
}

const BinomialNomenclatureLab: React.FC<{ topic: any; onExit: () => void }> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('naming');
    const [filter, setFilter] = useState<Filter>('all');
    const [selectedId, setSelectedId] = useState('mango');
    const [typedName, setTypedName] = useState('Mangifera indica');
    const [formatMode, setFormatMode] = useState<FormatMode>('printed');
    const [styledName, setStyledName] = useState(true);
    const [showRuleNumbers, setShowRuleNumbers] = useState(true);
    const [showCodes, setShowCodes] = useState(true);
    const [includeAuthor, setIncludeAuthor] = useState(false);
    const [showAllRows, setShowAllRows] = useState(false);
    const [selectedCell, setSelectedCell] = useState('Hominidae');
    const [compareA, setCompareA] = useState('lion');
    const [compareB, setCompareB] = useState('tiger');
    const [quizMode, setQuizMode] = useState<QuizMode>('typography');
    const [quizAnswer, setQuizAnswer] = useState('');
    const [sequence, setSequence] = useState<Rank[]>(['Species', 'Genus', 'Order', 'Phylum/Division', 'Kingdom']);
    const [matchCommon, setMatchCommon] = useState('Mango');
    const [matchName, setMatchName] = useState('Mangifera indica');

    const selected = ORGANISMS.find((organism) => organism.id === selectedId) ?? ORGANISMS[2];
    const compareOrgA = ORGANISMS.find((organism) => organism.id === compareA) ?? ORGANISMS[4];
    const compareOrgB = ORGANISMS.find((organism) => organism.id === compareB) ?? ORGANISMS[5];
    const validation = validateName(typedName, selected, formatMode, styledName, includeAuthor);
    const isValidName = validation.length === 0;
    const displayedRows = showAllRows ? ORGANISMS : TABLE_ROWS;
    const firstDiff = firstDifferentRank(compareOrgA, compareOrgB);
    const highestMatch = [...RANKS].reverse().find((rank) => rankValue(compareOrgA, rank) === rankValue(compareOrgB, rank)) ?? 'none';

    const filteredOrganisms = useMemo(() => ORGANISMS.filter((organism) => {
        if (filter === 'animals') return organism.kingdom === 'Animalia';
        if (filter === 'plants') return organism.kingdom === 'Plantae';
        return true;
    }), [filter]);

    const handleReset = () => {
        setMode('naming');
        setFilter('all');
        setSelectedId('mango');
        setTypedName('Mangifera indica');
        setFormatMode('printed');
        setStyledName(true);
        setShowRuleNumbers(true);
        setShowCodes(true);
        setIncludeAuthor(false);
        setShowAllRows(false);
        setSelectedCell('Hominidae');
        setCompareA('lion');
        setCompareB('tiger');
        setQuizMode('typography');
        setQuizAnswer('');
        setSequence(['Species', 'Genus', 'Order', 'Phylum/Division', 'Kingdom']);
        setMatchCommon('Mango');
        setMatchName('Mangifera indica');
    };

    const organismCard = (organism: Organism) => (
        <button
            key={organism.id}
            onClick={() => {
                setSelectedId(organism.id);
                setTypedName(`${organism.biological}${includeAuthor ? ` ${organism.author}` : ''}`);
            }}
            className={`rounded-xl border p-2.5 text-left transition-all duration-300 ${selectedId === organism.id ? 'border-violet-400 bg-violet-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className={`rounded-lg px-2 py-1 text-xs font-black text-white ${organism.kingdom === 'Plantae' ? 'bg-emerald-600' : 'bg-red-500'}`}>{organism.symbol}</span>
                {organism.ncCanonical && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">NCERT</span>}
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">{organism.common}</div>
            <div className="text-xs font-semibold italic text-slate-600">{organism.biological}</div>
        </button>
    );

    const namingMode = (
        <div className="grid h-full grid-cols-[360px_minmax(0,1fr)_410px] gap-5 p-6">
            <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="flex items-center gap-2">
                    <Search size={18} className="text-violet-700" />
                    <h3 className="text-lg font-extrabold text-slate-900">Organism Grid</h3>
                </div>
                <div className="mt-3 grid flex-1 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {filteredOrganisms.map(organismCard)}
                </div>
            </div>
            <div className="flex min-h-0 flex-col rounded-2xl border border-violet-200 bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm font-black uppercase tracking-wide text-violet-700">Naming workstation</div>
                        <h2 className="mt-1 text-5xl font-black text-slate-950">{selected.common}</h2>
                        <p className="mt-2 text-base font-bold text-slate-500">Target: <span className="italic text-slate-800">{selected.biological}</span>{includeAuthor ? ` ${selected.author}` : ''}</p>
                    </div>
                    <div className={`rounded-2xl px-6 py-4 text-center text-white ${selected.kingdom === 'Plantae' ? 'bg-emerald-600' : 'bg-red-500'}`}>
                        <div className="text-4xl font-black">{selected.symbol}</div>
                        <div className="text-xs font-black uppercase">{selected.kingdom}</div>
                    </div>
                </div>
                <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex gap-2">
                        <button onClick={() => { setFormatMode('printed'); setStyledName(false); }} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-base font-black ${formatMode === 'printed' ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}><Type size={18} /> Printed</button>
                        <button onClick={() => { setFormatMode('handwritten'); setStyledName(false); }} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-base font-black ${formatMode === 'handwritten' ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}><PenTool size={18} /> Handwritten</button>
                    </div>
                    <input
                        value={typedName}
                        onChange={(event) => setTypedName(event.target.value)}
                        className={`mt-5 w-full rounded-xl border bg-white px-5 py-5 text-3xl font-black text-slate-900 outline-none transition-all duration-300 ${isValidName ? 'border-emerald-300 ring-4 ring-emerald-50' : 'border-red-300 ring-4 ring-red-50'} ${formatMode === 'printed' && styledName ? 'italic' : ''} ${formatMode === 'handwritten' && styledName ? 'underline decoration-2 underline-offset-4' : ''}`}
                        placeholder="Genus species"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => setStyledName((value) => !value)} className={`rounded-lg border px-3 py-2 text-xs font-black ${styledName ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                            {formatMode === 'printed' ? 'I Italic applied' : 'U Separate underline'}
                        </button>
                        <span className={`rounded-lg px-3 py-2 text-xs font-black ${styledName ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>Latin origin badge</span>
                        <span className="rounded-lg bg-violet-100 px-3 py-2 text-xs font-black text-violet-800">Carolus Linnaeus</span>
                    </div>
                    <div className="mt-4 space-y-2">
                        {isValidName ? (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-base font-bold text-emerald-800">
                                <CheckCircle size={18} /> All NCERT naming rules satisfied.
                            </div>
                        ) : validation.map((message) => (
                            <div key={message} className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-base font-bold text-red-800">
                                <XCircle size={18} className="mt-0.5 shrink-0" /> {showRuleNumbers ? message : message.replace(/^Rule \d: /, '')}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-xl">
                    <h3 className="text-lg font-extrabold text-violet-950">Five NCERT Rules</h3>
                    <div className="mt-3 space-y-2">
                        {RULES.map((rule) => <p key={rule} className="text-base font-semibold leading-snug text-violet-950">{showRuleNumbers ? rule : rule.replace(/^Rule \d: /, '')}</p>)}
                    </div>
                </div>
                {showCodes && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                        <h3 className="text-lg font-extrabold text-slate-900">International Codes</h3>
                        <p className="mt-2 text-base font-bold text-slate-700">ICBN: International Code for Botanical Nomenclature for plants.</p>
                        <p className="mt-2 text-base font-bold text-slate-700">ICZN: International Code of Zoological Nomenclature for animals.</p>
                        <p className="mt-2 text-base font-bold text-slate-700">Each organism gets one name recognised worldwide.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const ladderMode = (
        <div className="grid h-full grid-cols-[400px_1fr_400px] gap-5 p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <h3 className="text-base font-extrabold text-slate-900">Choose Organism</h3>
                <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800">
                    {ORGANISMS.map((organism) => <option key={organism.id} value={organism.id}>{organism.common}</option>)}
                </select>
                <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-sm font-extrabold leading-snug text-violet-950">"As we go higher from species to kingdom, the number of common characteristics decreases."</p>
                    <p className="mt-2 text-xs font-bold text-violet-700">NCERT Sec 1.2.7</p>
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700">
                    Sub-categories such as super-, sub- and infra- exist, but NCERT focuses on the seven main ranks.
                </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-violet-50 to-white" />
                <div className="relative mx-auto flex h-full max-w-[860px] flex-col-reverse justify-between">
                    {RANKS.map((rank, index) => (
                        <div key={rank} className="group flex items-center gap-4 transition-all duration-300">
                            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg ${index < 2 ? 'bg-blue-600' : index < 4 ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                                {sharedCounter(rank)}
                            </div>
                            <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black uppercase tracking-wide text-slate-500">{rank}</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">shared chars: {sharedCounter(rank)}</span>
                                </div>
                                <div className="mt-1 text-xl font-black text-slate-950">{rankValue(selected, rank)}</div>
                            </div>
                            {index < RANKS.length - 1 && <ChevronRight className="rotate-90 text-violet-500" size={22} />}
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <h3 className="text-base font-extrabold text-slate-900">Rank Detail</h3>
                <div className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                    <p>Species: group with fundamental similarities, distinguished by morphological differences.</p>
                    <p>Genus: aggregate of closely related species, such as Panthera or Solanum.</p>
                    <p>Family: related genera; Felidae differs from Canidae.</p>
                    <p>Order: Carnivora includes Felidae and Canidae.</p>
                    <p>Class Mammalia includes Primata and Carnivora.</p>
                    <p>Plants use Division; animals use Phylum.</p>
                    <p>Kingdom: Animalia or Plantae.</p>
                </div>
            </div>
        </div>
    );

    const tableMode = (
        <div className="flex h-full flex-col gap-5 p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-950">NCERT Table 1.1</h3>
                        <p className="text-sm font-bold text-slate-500">Canonical rows: Man, Housefly, Mango and Wheat.</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{showAllRows ? 'Extension rows visible' : 'NCERT only'}</span>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-7 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600">
                        <span>Common</span><span>Biological</span><span>Genus</span><span>Family</span><span>Order</span><span>Class</span><span>Phylum/Division</span>
                    </div>
                    {displayedRows.map((row) => (
                        <div key={row.id} className={`grid grid-cols-7 border-t border-slate-100 px-3 py-2 text-xs font-bold ${row.kingdom === 'Plantae' ? 'bg-emerald-50/55' : 'bg-red-50/45'}`}>
                            {[row.common, row.biological, row.genus, row.family, row.order, row.className, row.phylumDivision].map((cell) => (
                                <button key={`${row.id}-${cell}`} onClick={() => setSelectedCell(cell)} className={`truncate rounded px-1 py-1 text-left ${selectedCell === cell ? 'bg-violet-100 text-violet-900' : 'text-slate-700 hover:bg-white'}`}>{cell}</button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid flex-1 grid-cols-[1fr_420px] gap-5 overflow-hidden">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Drill-down</h3>
                    <p className="mt-2 text-3xl font-black text-violet-800">{selectedCell}</p>
                    <p className="mt-3 text-sm font-bold leading-snug text-slate-700">{TABLE_NOTES[selectedCell] ?? 'Taxon from NCERT Table 1.1 or extension row. Click another cell to inspect its rank.'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                    <h3 className="text-base font-extrabold text-slate-900">Kingdom Split</h3>
                    <div className="mt-3 space-y-3">
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                            <div className="text-sm font-black text-red-800">Animalia</div>
                            <p className="text-xs font-bold text-red-700">Man and Housefly are animals.</p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <div className="text-sm font-black text-emerald-800">Plantae</div>
                            <p className="text-xs font-bold text-emerald-700">Mango and Wheat are plants.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const compareMode = (
        <div className="grid h-full grid-cols-[420px_1fr] gap-5 p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <h3 className="text-base font-extrabold text-slate-900">Compare Presets</h3>
                {[
                    ['lion', 'tiger', 'Lion vs Tiger'],
                    ['cat', 'dog', 'Cat vs Dog'],
                    ['mango', 'wheat', 'Mango vs Wheat'],
                    ['lion', 'housefly', 'Lion vs Housefly']
                ].map(([a, b, labelText]) => (
                    <button key={labelText} onClick={() => { setCompareA(a); setCompareB(b); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-black text-slate-700 hover:bg-slate-50">{labelText}</button>
                ))}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <select value={compareA} onChange={(event) => setCompareA(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold">{ORGANISMS.map((o) => <option key={o.id} value={o.id}>{o.common}</option>)}</select>
                    <select value={compareB} onChange={(event) => setCompareB(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold">{ORGANISMS.map((o) => <option key={o.id} value={o.id}>{o.common}</option>)}</select>
                </div>
                <p className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm font-bold text-violet-900">First differing rank: {firstDiff}. Highest matching rank: {highestMatch}.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="grid grid-cols-3 gap-3 border-b border-slate-200 pb-3 text-sm font-black text-slate-600">
                    <span>Rank</span><span>{compareOrgA.common}</span><span>{compareOrgB.common}</span>
                </div>
                <div className="mt-3 space-y-2">
                    {RANKS.map((rank) => {
                        const same = rankValue(compareOrgA, rank) === rankValue(compareOrgB, rank);
                        const diverge = rank === firstDiff;
                        return (
                            <div key={rank} className={`grid grid-cols-3 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-bold ${same ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'} ${diverge ? 'ring-4 ring-amber-100' : ''}`}>
                                <span className="font-black">{rank}{diverge ? ' - diverge here' : ''}</span>
                                <span>{rankValue(compareOrgA, rank)}</span>
                                <span>{rankValue(compareOrgB, rank)}</span>
                            </div>
                        );
                    })}
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700">NCERT insight: related organisms share many characters at lower taxa; common characters decrease at higher ranks.</p>
            </div>
        </div>
    );

    const quizModeView = (
        <div className="grid h-full grid-cols-[420px_1fr] gap-5 p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <h3 className="text-base font-extrabold text-slate-900">Quiz Set</h3>
                {(['typography', 'sequence', 'match'] as QuizMode[]).map((q) => (
                    <button key={q} onClick={() => { setQuizMode(q); setQuizAnswer(''); }} className={`mt-2 w-full rounded-xl border px-3 py-2 text-left text-sm font-black capitalize ${quizMode === q ? 'border-violet-300 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-700'}`}>{q}</button>
                ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                {quizMode === 'typography' && (
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-950">NCERT Exercise 5</h3>
                        <p className="mt-1 text-sm font-bold text-slate-600">Which is correctly written?</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {['Mangifera Indica', 'mangifera indica', 'MANGIFERA INDICA', 'Mangifera indica'].map((option) => (
                                <button key={option} onClick={() => setQuizAnswer(option)} className={`rounded-xl border px-4 py-5 text-xl font-black ${quizAnswer === option ? option === 'Mangifera indica' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'} ${option === 'Mangifera indica' ? 'italic' : ''}`}>{option}</button>
                            ))}
                        </div>
                        {quizAnswer && <p className={`mt-4 rounded-xl p-3 text-sm font-bold ${quizAnswer === 'Mangifera indica' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{quizAnswer === 'Mangifera indica' ? 'Correct: genus capitalized, species lowercase, printed name italic.' : 'Wrong: check Rule 3 and Rule 4 for format and capitalization.'}</p>}
                    </div>
                )}
                {quizMode === 'sequence' && (
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-950">NCERT Exercise 7</h3>
                        <p className="mt-1 text-sm font-bold text-slate-600">Click ranks to rotate them into the correct ascending sequence.</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {sequence.map((rank, index) => (
                                <button key={`${rank}-${index}`} onClick={() => setSequence((prev) => prev.map((item, i) => i === index ? prev[(i + 1) % prev.length] : i === (index + 1) % prev.length ? prev[index] : item))} className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-900">{rank}</button>
                            ))}
                        </div>
                        <p className={`mt-4 rounded-xl p-3 text-sm font-bold ${sequence.join('>') === 'Species>Genus>Order>Phylum/Division>Kingdom' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>Correct NCERT option: Species - Genus - Order - Phylum - Kingdom.</p>
                    </div>
                )}
                {quizMode === 'match' && (
                    <div>
                        <h3 className="text-xl font-extrabold text-slate-950">Match Name</h3>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <select value={matchCommon} onChange={(event) => setMatchCommon(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 font-bold">{ORGANISMS.slice(0, 8).map((o) => <option key={o.id}>{o.common}</option>)}</select>
                            <select value={matchName} onChange={(event) => setMatchName(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 font-bold italic">{ORGANISMS.slice(0, 8).map((o) => <option key={o.id}>{o.biological}</option>)}</select>
                        </div>
                        <p className={`mt-4 rounded-xl p-3 text-sm font-bold ${ORGANISMS.find((o) => o.common === matchCommon)?.biological === matchName ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{ORGANISMS.find((o) => o.common === matchCommon)?.biological === matchName ? 'Correct pair.' : 'Not a match yet.'}</p>
                    </div>
                )}
            </div>
        </div>
    );

    const simulationCombo = (
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-inner">
            {mode === 'naming' && namingMode}
            {mode === 'ladder' && ladderMode}
            {mode === 'table' && tableMode}
            {mode === 'compare' && compareMode}
            {mode === 'quiz' && quizModeView}
        </div>
    );

    const controlsCombo = (
        <div className="grid h-full min-h-0 grid-cols-[220px_1.2fr_1fr_360px] gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm">
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3">
                <div className="rounded-lg bg-violet-100 p-2 text-violet-700"><BookOpen size={18} /></div>
                <div className="min-w-0">
                    <div className="truncate text-base font-black text-slate-900">Taxonomy Bench</div>
                    <div className="text-xs font-bold capitalize text-slate-500">{mode}</div>
                </div>
            </div>
            <div className="grid min-h-0 grid-cols-5 gap-2">
                {MODE_INFO.map((item) => (
                    <button key={item.id} onClick={() => setMode(item.id)} className={`flex min-h-[70px] flex-col items-center justify-center gap-1 rounded-xl border text-xs font-black ${mode === item.id ? 'border-violet-400 bg-violet-100 text-violet-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </div>
            <div className="min-h-0 rounded-xl border border-slate-200 bg-slate-50 p-2">
                {mode === 'naming' && (
                    <div className="grid h-full grid-cols-2 gap-2">
                        {(['all', 'animals', 'plants'] as Filter[]).map((next) => <button key={next} onClick={() => setFilter(next)} className={`rounded-lg border px-2 py-2 text-sm font-black capitalize ${filter === next ? 'border-violet-300 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-600'}`}>{next}</button>)}
                        <button onClick={() => setFormatMode(formatMode === 'printed' ? 'handwritten' : 'printed')} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-black text-slate-700">{formatMode}</button>
                    </div>
                )}
                {mode === 'ladder' && (
                    <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="h-full w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800">{ORGANISMS.map((o) => <option key={o.id} value={o.id}>{o.common}</option>)}</select>
                )}
                {mode === 'table' && (
                    <button onClick={() => setShowAllRows((value) => !value)} className={`h-full w-full rounded-lg border px-3 py-2 text-sm font-black ${showAllRows ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700'}`}>{showAllRows ? 'Show all rows' : 'Show 4 NCERT'}</button>
                )}
                {mode === 'compare' && (
                    <div className="grid h-full grid-cols-2 gap-2">
                        {[
                            ['lion', 'tiger', 'Lion-Tiger'],
                            ['cat', 'dog', 'Cat-Dog'],
                            ['mango', 'wheat', 'Mango-Wheat'],
                            ['lion', 'housefly', 'Lion-Fly']
                        ].map(([a, b, text]) => <button key={text} onClick={() => { setCompareA(a); setCompareB(b); }} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-black text-slate-700">{text}</button>)}
                    </div>
                )}
                {mode === 'quiz' && (
                    <div className="grid h-full grid-cols-3 gap-2">
                        {(['typography', 'sequence', 'match'] as QuizMode[]).map((q) => <button key={q} onClick={() => setQuizMode(q)} className={`rounded-lg border px-2 py-2 text-xs font-black capitalize ${quizMode === q ? 'border-violet-300 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-600'}`}>{q}</button>)}
                    </div>
                )}
            </div>
            <div className="grid min-h-0 grid-cols-4 gap-2">
                <button onClick={() => setShowRuleNumbers((value) => !value)} className={`rounded-xl border p-2 text-sm font-black ${showRuleNumbers ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500'}`}>{showRuleNumbers ? <Eye size={18} className="mx-auto" /> : <EyeOff size={18} className="mx-auto" />} Rules</button>
                <button onClick={() => setShowCodes((value) => !value)} className={`rounded-xl border p-2 text-sm font-black ${showCodes ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`}><FlaskConical size={18} className="mx-auto" /> Codes</button>
                <button onClick={() => setIncludeAuthor((value) => !value)} className={`rounded-xl border p-2 text-sm font-black ${includeAuthor ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-500'}`}><Users size={18} className="mx-auto" /> Auth</button>
                <button onClick={handleReset} className="rounded-xl border border-slate-200 bg-white p-2 text-sm font-black text-slate-700"><RotateCcw size={18} className="mx-auto" /> Reset</button>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
            simulationAreaFlex="1 1 auto"
            controlsAreaFlex="0 0 170px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            controlsWrapperClassName="w-full h-full max-w-[min(100%,1540px)] overflow-hidden overscroll-contain bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-2xl md:rounded-3xl p-3 md:p-4 flex flex-col"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default BinomialNomenclatureLab;
