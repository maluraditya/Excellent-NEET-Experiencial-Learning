import React, { useMemo, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    Award,
    BookOpen,
    Bug,
    CheckCircle,
    Eye,
    EyeOff,
    FlaskConical,
    History,
    Info,
    Layers,
    Leaf,
    Microscope,
    RotateCcw,
    Search,
    Table as TableIcon,
    XCircle
} from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Kingdom = 'Monera' | 'Protista' | 'Fungi' | 'Plantae' | 'Animalia';
type Mode = 'sorter' | 'table' | 'history' | 'sub' | 'change' | 'acellular';
type OrganismFilter = 'All' | Kingdom;
type TableMode = 'compact' | 'expanded';
type Acellular = 'Viruses' | 'Viroids' | 'Prions' | 'Lichens';

interface Organism {
    id: string;
    name: string;
    tag: string;
    kingdom: Kingdom;
    cellType: string;
    cellWall: string;
    nuclearMembrane: string;
    body: string;
    nutrition: string;
    reproduction: string;
    hint: string;
}

interface KingdomProfile {
    name: Kingdom;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    core: string;
    quote: string;
}

const W = 1640;
const H = 650;

const KINGDOMS: KingdomProfile[] = [
    { name: 'Monera', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: <Bug size={20} />, core: 'Prokaryotic, nuclear membrane absent, bacteria are sole members.', quote: 'Most extensive metabolic diversity; bacteria are cosmopolitan.' },
    { name: 'Protista', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', icon: <Microscope size={20} />, core: 'All single-celled eukaryotes with defined nucleus and organelles.', quote: 'Includes chrysophytes, dinoflagellates, euglenoids, slime moulds and protozoans.' },
    { name: 'Fungi', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: <FlaskConical size={20} />, core: 'Eukaryotic heterotrophs with chitin and polysaccharide cell wall.', quote: 'Hyphae form mycelium; yeast is a unicellular exception.' },
    { name: 'Plantae', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <Leaf size={20} />, core: 'Eukaryotic chlorophyll-containing organisms with cellulose cell walls.', quote: 'Shows alternation of generations between gametophyte and sporophyte.' },
    { name: 'Animalia', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Activity size={20} />, core: 'Eukaryotic multicellular organisms lacking cell walls.', quote: 'Holozoic nutrition, glycogen/fat storage and organ-system organisation.' }
];

const TABLE_ROWS = [
    ['Cell type', 'Prokaryotic', 'Eukaryotic', 'Eukaryotic', 'Eukaryotic', 'Eukaryotic'],
    ['Cell wall', 'Non-cellulosic; polysaccharide + amino acid', 'Present in some', 'Present; chitin', 'Present; cellulose', 'Absent'],
    ['Nuclear membrane', 'Absent', 'Present', 'Present', 'Present', 'Present'],
    ['Body organisation', 'Cellular', 'Cellular', 'Multicellular / loose tissue', 'Tissue / organ', 'Tissue / organ / organ-system'],
    ['Mode of nutrition', 'Autotrophic chemo/photo and heterotrophic sapro/parasitic', 'Autotrophic photo or heterotrophic', 'Heterotrophic saprophytic / parasitic', 'Autotrophic photosynthetic', 'Heterotrophic holozoic / saprophytic etc.'],
    ['Reproduction', 'Binary fission; spores in unfavourable conditions; primitive DNA transfer', 'Fission, cell fusion and zygote formation', 'Fragmentation, fission, budding; conidia, sporangiospores, zoospores; sexual spores', 'Alternation of generations', 'Mostly sexual reproduction with embryological development']
];

const CRITERIA = ['Cell structure', 'Body organisation', 'Mode of nutrition', 'Reproduction', 'Phylogenetic relationships'];

const ORGANISMS: Organism[] = [
    { id: 'anabaena', name: 'Anabaena', tag: 'heterocyst N2 fixer', kingdom: 'Monera', cellType: 'Prokaryotic cyanobacterium', cellWall: 'Non-cellulosic', nuclearMembrane: 'Absent', body: 'Cellular / filamentous', nutrition: 'Photosynthetic; chlorophyll a', reproduction: 'Binary fission / fragmentation', hint: 'No nuclear membrane and chlorophyll a cyanobacterium traits place it in Monera.' },
    { id: 'nostoc', name: 'Nostoc', tag: 'cyanobacterium', kingdom: 'Monera', cellType: 'Prokaryotic', cellWall: 'Non-cellulosic', nuclearMembrane: 'Absent', body: 'Colonial / filamentous', nutrition: 'Photosynthetic; heterocysts fix N2', reproduction: 'Fragmentation', hint: 'Cyanobacteria are true bacteria in Monera, not algae in Plantae.' },
    { id: 'mycoplasma', name: 'Mycoplasma', tag: 'smallest cell', kingdom: 'Monera', cellType: 'Prokaryotic', cellWall: 'Absent', nuclearMembrane: 'Absent', body: 'Cellular', nutrition: 'Parasitic / pathogenic', reproduction: 'Binary fission', hint: 'Smallest living cell, no cell wall, no oxygen required: Monera.' },
    { id: 'rhizobium', name: 'Rhizobium', tag: 'legume root N2 fixer', kingdom: 'Monera', cellType: 'Prokaryotic bacterium', cellWall: 'Non-cellulosic', nuclearMembrane: 'Absent', body: 'Cellular', nutrition: 'Heterotrophic symbiont', reproduction: 'Binary fission', hint: 'Nitrogen fixing bacteria in legume roots belong to Monera.' },
    { id: 'methanogen', name: 'Methanogen', tag: 'biogas archaea', kingdom: 'Monera', cellType: 'Prokaryotic archaebacterium', cellWall: 'Non-cellulosic', nuclearMembrane: 'Absent', body: 'Cellular', nutrition: 'Chemosynthetic / anaerobic', reproduction: 'Binary fission', hint: 'Methanogens in marshy areas and ruminant gut are archaebacteria: Monera.' },
    { id: 'paramoecium', name: 'Paramoecium', tag: 'ciliated protozoan', kingdom: 'Protista', cellType: 'Unicellular eukaryote', cellWall: 'Absent', nuclearMembrane: 'Present', body: 'Cellular', nutrition: 'Heterotrophic', reproduction: 'Fission / conjugation', hint: 'Cilia plus unicellular eukaryote body means Protista.' },
    { id: 'amoeba', name: 'Amoeba', tag: 'amoeboid protozoan', kingdom: 'Protista', cellType: 'Unicellular eukaryote', cellWall: 'Absent', nuclearMembrane: 'Present', body: 'Cellular', nutrition: 'Heterotrophic', reproduction: 'Binary fission', hint: 'Amoeboid protozoans are Protista, not Animalia.' },
    { id: 'euglena', name: 'Euglena', tag: 'pellicle + mixotroph', kingdom: 'Protista', cellType: 'Unicellular eukaryote', cellWall: 'Pellicle, no rigid wall', nuclearMembrane: 'Present', body: 'Cellular', nutrition: 'Photosynthetic in light; heterotrophic in dark', reproduction: 'Longitudinal fission', hint: 'Pellicle and mixotrophic unicellular eukaryote traits point to Protista.' },
    { id: 'plasmodium', name: 'Plasmodium', tag: 'malaria sporozoan', kingdom: 'Protista', cellType: 'Unicellular eukaryote', cellWall: 'Absent', nuclearMembrane: 'Present', body: 'Cellular', nutrition: 'Parasitic', reproduction: 'Sporogenic stages', hint: 'Sporozoans such as Plasmodium belong to Protista.' },
    { id: 'gonyaulax', name: 'Gonyaulax', tag: 'red tide dinoflagellate', kingdom: 'Protista', cellType: 'Unicellular eukaryote', cellWall: 'Cellulosic plates', nuclearMembrane: 'Present', body: 'Cellular', nutrition: 'Photosynthetic marine', reproduction: 'Cell division', hint: 'Dinoflagellate red tide organism is Protista.' },
    { id: 'diatom', name: 'Diatom', tag: 'silica wall producer', kingdom: 'Protista', cellType: 'Unicellular eukaryote', cellWall: 'Silica; diatomaceous earth', nuclearMembrane: 'Present', body: 'Cellular', nutrition: 'Photosynthetic chief producer', reproduction: 'Cell division', hint: 'Chrysophyte with silica wall belongs to Protista.' },
    { id: 'slime-mould', name: 'Slime mould', tag: 'plasmodium + spores', kingdom: 'Protista', cellType: 'Eukaryotic', cellWall: 'Absent in plasmodium; spores resistant', nuclearMembrane: 'Present', body: 'Cellular aggregate / plasmodium', nutrition: 'Saprophytic', reproduction: 'Fruiting bodies with spores', hint: 'Saprophytic slime moulds are grouped under Protista in NCERT.' },
    { id: 'rhizopus', name: 'Rhizopus', tag: 'bread mould', kingdom: 'Fungi', cellType: 'Eukaryotic', cellWall: 'Chitin + polysaccharides', nuclearMembrane: 'Present', body: 'Coenocytic hyphae / mycelium', nutrition: 'Saprophytic', reproduction: 'Sporangiospores / zygospores', hint: 'Bread mould with hyphae and chitin wall belongs to Fungi.' },
    { id: 'yeast', name: 'Yeast Saccharomyces', tag: 'unicellular fungus', kingdom: 'Fungi', cellType: 'Eukaryotic', cellWall: 'Chitin + polysaccharides', nuclearMembrane: 'Present', body: 'Cellular exception', nutrition: 'Saprophytic / fermentation', reproduction: 'Budding / fission; ascospores', hint: 'Yeast is the unicellular exception inside Fungi.' },
    { id: 'penicillium', name: 'Penicillium', tag: 'antibiotic fungus', kingdom: 'Fungi', cellType: 'Eukaryotic', cellWall: 'Chitin', nuclearMembrane: 'Present', body: 'Septate branched mycelium', nutrition: 'Saprophytic', reproduction: 'Conidia / ascospores', hint: 'Ascomycete with conidia and chitin wall: Fungi.' },
    { id: 'agaricus', name: 'Agaricus', tag: 'mushroom', kingdom: 'Fungi', cellType: 'Eukaryotic', cellWall: 'Chitin', nuclearMembrane: 'Present', body: 'Basidiocarp; septate mycelium', nutrition: 'Saprophytic', reproduction: 'Basidiospores', hint: 'Mushrooms are basidiomycete fungi.' },
    { id: 'puccinia', name: 'Puccinia', tag: 'wheat rust', kingdom: 'Fungi', cellType: 'Eukaryotic', cellWall: 'Chitin', nuclearMembrane: 'Present', body: 'Septate mycelium', nutrition: 'Parasitic', reproduction: 'Basidiospores', hint: 'Wheat rust is a parasitic basidiomycete fungus.' },
    { id: 'spirogyra', name: 'Spirogyra', tag: 'green alga', kingdom: 'Plantae', cellType: 'Eukaryotic', cellWall: 'Cellulose', nuclearMembrane: 'Present', body: 'Filamentous multicellular alga', nutrition: 'Autotrophic photosynthetic', reproduction: 'Fragmentation / conjugation', hint: 'Multicellular photosynthetic alga with cellulose belongs to Plantae.' },
    { id: 'marchantia', name: 'Marchantia', tag: 'bryophyte', kingdom: 'Plantae', cellType: 'Eukaryotic', cellWall: 'Cellulose', nuclearMembrane: 'Present', body: 'Thalloid plant body', nutrition: 'Autotrophic', reproduction: 'Spores and gametes', hint: 'Bryophytes are plant kingdom members.' },
    { id: 'selaginella', name: 'Selaginella', tag: 'pteridophyte', kingdom: 'Plantae', cellType: 'Eukaryotic', cellWall: 'Cellulose', nuclearMembrane: 'Present', body: 'Tissue / vascular plant', nutrition: 'Autotrophic', reproduction: 'Spores', hint: 'Pteridophyte vascular plant: Plantae.' },
    { id: 'cycas', name: 'Cycas', tag: 'gymnosperm', kingdom: 'Plantae', cellType: 'Eukaryotic', cellWall: 'Cellulose', nuclearMembrane: 'Present', body: 'Seed plant; naked ovules', nutrition: 'Autotrophic', reproduction: 'Seeds / cones', hint: 'Gymnosperms such as Cycas belong to Plantae.' },
    { id: 'hibiscus', name: 'Hibiscus', tag: 'angiosperm', kingdom: 'Plantae', cellType: 'Eukaryotic', cellWall: 'Cellulose', nuclearMembrane: 'Present', body: 'Flowering plant', nutrition: 'Autotrophic', reproduction: 'Flowers, fruits and seeds', hint: 'Flowering angiosperm: Plantae.' },
    { id: 'hydra', name: 'Hydra', tag: 'cnidarian', kingdom: 'Animalia', cellType: 'Eukaryotic', cellWall: 'Absent', nuclearMembrane: 'Present', body: 'Tissue level', nutrition: 'Holozoic', reproduction: 'Budding / sexual', hint: 'No cell wall and holozoic feeding place it in Animalia.' },
    { id: 'earthworm', name: 'Earthworm', tag: 'annelid', kingdom: 'Animalia', cellType: 'Eukaryotic', cellWall: 'Absent', nuclearMembrane: 'Present', body: 'Organ-system', nutrition: 'Holozoic', reproduction: 'Sexual', hint: 'Annelid animal with organ-system body plan: Animalia.' },
    { id: 'cockroach', name: 'Cockroach', tag: 'arthropod', kingdom: 'Animalia', cellType: 'Eukaryotic', cellWall: 'Absent', nuclearMembrane: 'Present', body: 'Organ-system', nutrition: 'Holozoic', reproduction: 'Sexual', hint: 'Jointed appendage animal; no cell wall: Animalia.' },
    { id: 'octopus', name: 'Octopus', tag: 'mollusc', kingdom: 'Animalia', cellType: 'Eukaryotic', cellWall: 'Absent', nuclearMembrane: 'Present', body: 'Organ-system', nutrition: 'Holozoic', reproduction: 'Sexual', hint: 'Molluscan animal with internal digestion: Animalia.' },
    { id: 'frog', name: 'Frog', tag: 'chordate', kingdom: 'Animalia', cellType: 'Eukaryotic', cellWall: 'Absent', nuclearMembrane: 'Present', body: 'Organ-system', nutrition: 'Holozoic', reproduction: 'Sexual with embryological development', hint: 'Chordate animal with no cell wall: Animalia.' },
    { id: 'cat', name: 'Cat', tag: 'mammal', kingdom: 'Animalia', cellType: 'Eukaryotic', cellWall: 'Absent', nuclearMembrane: 'Present', body: 'Organ-system', nutrition: 'Holozoic', reproduction: 'Sexual', hint: 'Mammal with no cell wall and definite adult form: Animalia.' }
];

const SUB_GROUPS: Record<Kingdom, string[]> = {
    Monera: ['Archaebacteria: halophiles, thermoacidophiles, methanogens', 'Eubacteria: true bacteria; cyanobacteria such as Nostoc and Anabaena', 'Heterotrophic bacteria: decomposers, curd formation, antibiotics, N2 fixation', 'Mycoplasma: smallest living cell, no cell wall, pathogenic'],
    Protista: ['Chrysophytes: diatoms and desmids; silica wall forms diatomaceous earth', 'Dinoflagellates: Gonyaulax, red tide, toxins kill marine animals', 'Euglenoids: Euglena, pellicle, two flagella, photosynthetic in light', 'Slime moulds: saprophytic plasmodium, resistant spores', 'Protozoans: Amoeba, Entamoeba, Trypanosoma, Paramoecium, Plasmodium'],
    Fungi: ['Phycomycetes: Mucor, Rhizopus, Albugo; coenocytic hyphae; zygospores', 'Ascomycetes: Aspergillus, Claviceps, Neurospora, Saccharomyces; asci and ascospores', 'Basidiomycetes: Agaricus, Ustilago, Puccinia; basidia and basidiospores', 'Deuteromycetes: Alternaria, Colletotrichum, Trichoderma; imperfect fungi'],
    Plantae: ['Algae: chlorophyllous simple plants', 'Bryophytes: Marchantia and mosses', 'Pteridophytes: Selaginella and ferns', 'Gymnosperms: Cycas and naked seeds', 'Angiosperms: flowering plants such as Hibiscus'],
    Animalia: ['Porifera', 'Coelenterata', 'Ctenophora', 'Platyhelminthes', 'Aschelminthes', 'Annelida', 'Arthropoda', 'Mollusca', 'Echinodermata', 'Chordata']
};

const LIMITATIONS = [
    'Did not distinguish eukaryotes from prokaryotes.',
    'Did not distinguish unicellular and multicellular organisms: Chlamydomonas and Spirogyra were lumped under algae.',
    'Did not distinguish photosynthetic and non-photosynthetic organisms; fungi were grouped with green plants.',
    'Many organisms did not fit either Plantae or Animalia.',
    'Relied mainly on morphology and ignored cell structure, nutrition and reproduction.',
    'Grouped prokaryotic bacteria and cyanobacteria with eukaryotes.'
];

const CHANGE_CASES = [
    { id: 'A', title: 'Chlamydomonas + Spirogyra in old algae', before: 'Both treated as algae in the plant side of two-kingdom classification.', after: 'Chlamydomonas moves toward Protista; Spirogyra stays with Plantae.', reason: 'Unicellular versus multicellular organisation became a classification criterion.' },
    { id: 'B', title: 'Fungi were treated as plants', before: 'Fungi grouped with Plantae because both have cell walls.', after: 'Fungi become a separate kingdom.', reason: 'Fungi have chitin walls and heterotrophic absorptive nutrition; plants have cellulose and photosynthesis.' },
    { id: 'C', title: 'Bacteria + cyanobacteria as plants/algae', before: 'Prokaryotic bacteria and blue-green algae were grouped with eukaryotes.', after: 'They move into Monera.', reason: 'Absent nuclear membrane and prokaryotic cell structure are decisive.' },
    { id: 'D', title: 'Amoeba + Paramoecium as animals', before: 'Movement made them look animal-like.', after: 'They move into Protista.', reason: 'They are unicellular eukaryotes, not multicellular animals.' }
];

const ACELLULAR: Record<Acellular, string[]> = {
    Viruses: ['Acellular; nucleic acid plus protein coat called capsid.', 'Inert outside host; DNA or RNA, never both.', 'Ivanowsky discovered Tobacco Mosaic Virus in 1892; W.M. Stanley crystallised TMV in 1935.', 'Diseases: mumps, smallpox, herpes, influenza, AIDS and common cold.', 'Plant viruses usually ssRNA; animal viruses ssRNA/dsRNA/dsDNA; bacteriophages often dsDNA.'],
    Viroids: ['Discovered by T.O. Diener in 1971.', 'Free RNA with no protein coat.', 'Cause potato spindle tuber disease.'],
    Prions: ['Abnormally folded infectious proteins.', 'Cause Mad Cow Disease or BSE.', 'Also linked to Creutzfeldt-Jakob disease or CJD.'],
    Lichens: ['Symbiotic association of alga and fungus.', 'Algal partner is phycobiont and autotrophic.', 'Fungal partner is mycobiont and heterotrophic.', 'Good pollution indicators.']
};

const MODES: Array<{ id: Mode; label: string; icon: React.ReactNode }> = [
    { id: 'sorter', label: 'Sorter', icon: <Search size={15} /> },
    { id: 'table', label: 'Table 2.1', icon: <TableIcon size={15} /> },
    { id: 'history', label: 'History', icon: <History size={15} /> },
    { id: 'sub', label: 'Sub', icon: <Layers size={15} /> },
    { id: 'change', label: 'Why Change', icon: <AlertTriangle size={15} /> },
    { id: 'acellular', label: 'Acellular', icon: <FlaskConical size={15} /> }
];

const FiveKingdomClassificationLab: React.FC<{ topic: any; onExit: () => void }> = ({ topic, onExit }) => {
    const [mode, setMode] = useState<Mode>('sorter');
    const [filter, setFilter] = useState<OrganismFilter>('All');
    const [selectedId, setSelectedId] = useState('anabaena');
    const [classified, setClassified] = useState<Record<string, Kingdom>>({});
    const [feedback, setFeedback] = useState('Select an organism, read its traits, then assign it to a kingdom.');
    const [showTraits, setShowTraits] = useState(true);
    const [showCitations, setShowCitations] = useState(true);
    const [nameOnly, setNameOnly] = useState(false);
    const [tableMode, setTableMode] = useState<TableMode>('compact');
    const [selectedCell, setSelectedCell] = useState('Cell type');
    const [subKingdom, setSubKingdom] = useState<Kingdom>('Monera');
    const [caseId, setCaseId] = useState('A');
    const [acellular, setAcellular] = useState<Acellular>('Viruses');

    const selected = ORGANISMS.find((item) => item.id === selectedId) ?? ORGANISMS[0];
    const activeKingdom = KINGDOMS.find((item) => item.name === selected.kingdom) ?? KINGDOMS[0];
    const activeCase = CHANGE_CASES.find((item) => item.id === caseId) ?? CHANGE_CASES[0];
    const visibleOrganisms = useMemo(() => ORGANISMS.filter((item) => filter === 'All' || item.kingdom === filter), [filter]);
    const completeCount = Object.keys(classified).length;
    const tableRows = tableMode === 'expanded' ? TABLE_ROWS : TABLE_ROWS.slice(0, 5);

    const reset = () => {
        setMode('sorter');
        setFilter('All');
        setSelectedId('anabaena');
        setClassified({});
        setFeedback('Lab reset. Start with Monera and compare traits using Whittaker criteria.');
        setShowTraits(true);
        setShowCitations(true);
        setNameOnly(false);
        setTableMode('compact');
        setSelectedCell('Cell type');
        setSubKingdom('Monera');
        setCaseId('A');
        setAcellular('Viruses');
    };

    const classify = (kingdom: Kingdom) => {
        if (kingdom === selected.kingdom) {
            setClassified((prev) => ({ ...prev, [selected.id]: kingdom }));
            setFeedback(`Correct: ${selected.name} belongs to ${kingdom}. ${selected.hint}`);
        } else {
            setFeedback(`Try again: ${selected.hint}`);
        }
    };

    const header = (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                    <BookOpen size={15} className="text-violet-700" />
                    NCERT Class 11 Biology Chapter 2
                    {showCitations && <span className="rounded-full bg-violet-100 px-2 py-1 text-violet-800">Sec 2.0-2.6</span>}
                </div>
                <h2 className="mt-1 text-3xl font-black text-slate-950">Five Kingdom Classification</h2>
                <p className="mt-1 text-sm font-bold text-slate-600">R.H. Whittaker (1969): Monera, Protista, Fungi, Plantae and Animalia.</p>
            </div>
            <div className="grid min-w-[500px] grid-cols-5 gap-2">
                {CRITERIA.map((item) => (
                    <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-black text-slate-700">{item}</div>
                ))}
            </div>
        </div>
    );

    const sorterMode = (
        <div className="grid flex-1 grid-cols-[420px_1fr_420px] gap-5 overflow-hidden">
            <div className="flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-slate-900">NCERT Organisms</h3>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">{completeCount} / {ORGANISMS.length}</span>
                </div>
                <div className="mt-3 grid flex-1 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {visibleOrganisms.map((item) => {
                        const done = classified[item.id];
                        const profile = KINGDOMS.find((kingdom) => kingdom.name === item.kingdom) ?? KINGDOMS[0];
                        return (
                            <button
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`rounded-xl border p-3 text-left transition-all ${selectedId === item.id ? `${profile.border} ${profile.bg} shadow-md ring-2 ring-violet-100` : 'border-slate-200 bg-white hover:bg-slate-50'} ${done ? 'opacity-80' : ''}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`rounded-lg px-2 py-1 text-xs font-black ${profile.bg} ${profile.color}`}>{item.kingdom}</span>
                                    {done && <CheckCircle size={16} className="text-emerald-600" />}
                                </div>
                                <div className="mt-2 text-base font-black text-slate-900">{item.name}</div>
                                {!nameOnly && <div className="text-xs font-bold text-slate-500">{item.tag}</div>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex min-h-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${activeKingdom.border} ${activeKingdom.bg} ${activeKingdom.color}`}>
                            {activeKingdom.icon}
                            {selected.kingdom}
                        </div>
                        <h3 className="mt-3 text-4xl font-black text-slate-950">{selected.name}</h3>
                        <p className="mt-1 text-base font-bold text-slate-600">{selected.tag}</p>
                    </div>
                    {classified[selected.id] && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800"><Award size={28} className="mx-auto" /><div className="mt-1 text-xs font-black">classified</div></div>}
                </div>

                {showTraits && (
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            ['Cell type', selected.cellType],
                            ['Cell wall', selected.cellWall],
                            ['Nuclear membrane', selected.nuclearMembrane],
                            ['Body organisation', selected.body],
                            ['Nutrition', selected.nutrition],
                            ['Reproduction', selected.reproduction]
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</div>
                                <div className="mt-1 text-sm font-extrabold text-slate-800">{value}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="grid grid-cols-5 gap-2">
                        {KINGDOMS.map((kingdom) => (
                            <button
                                key={kingdom.name}
                                onClick={() => classify(kingdom.name)}
                                className={`rounded-xl border px-2 py-4 text-sm font-black transition-all ${kingdom.border} ${kingdom.bg} ${kingdom.color} hover:shadow-md`}
                            >
                                <div className="mx-auto mb-1 flex justify-center">{kingdom.icon}</div>
                                {kingdom.name}
                            </button>
                        ))}
                    </div>
                    <div className={`mt-3 flex items-start gap-2 rounded-xl border p-3 text-sm font-bold ${feedback.startsWith('Correct') ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : feedback.startsWith('Try') ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
                        {feedback.startsWith('Correct') ? <CheckCircle size={18} className="shrink-0" /> : feedback.startsWith('Try') ? <XCircle size={18} className="shrink-0" /> : <Info size={18} className="shrink-0" />}
                        {feedback}
                    </div>
                </div>
            </div>

            <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
                {KINGDOMS.map((kingdom) => (
                    <div key={kingdom.name} className={`rounded-2xl border p-4 shadow-lg ${kingdom.border} ${kingdom.bg}`}>
                        <div className={`flex items-center gap-2 text-base font-black ${kingdom.color}`}>{kingdom.icon}{kingdom.name}</div>
                        <p className="mt-2 text-sm font-bold text-slate-700">{kingdom.core}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-600">{kingdom.quote}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const tableModeView = (
        <div className="grid flex-1 grid-cols-[1fr_360px] gap-5 overflow-hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <h3 className="text-2xl font-black text-slate-950">NCERT Table 2.1: Characteristics of Five Kingdoms</h3>
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    <div className="grid grid-cols-6 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-600">
                        {['Character', 'Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia'].map((cell) => <div key={cell} className="border-r border-slate-200 p-3 last:border-r-0">{cell}</div>)}
                    </div>
                    {tableRows.map((row) => (
                        <div key={row[0]} className="grid grid-cols-6 border-t border-slate-100 text-sm font-bold text-slate-700">
                            {row.map((cell, index) => (
                                <button key={`${row[0]}-${index}`} onClick={() => setSelectedCell(`${row[0]}: ${cell}`)} className={`min-h-[74px] border-r border-slate-100 p-3 text-left last:border-r-0 hover:bg-violet-50 ${index === 0 ? 'bg-slate-50 font-black text-slate-900' : ''}`}>{cell}</button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex min-h-0 flex-col gap-4">
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-xl">
                    <h3 className="text-lg font-black text-violet-950">Selected Cell</h3>
                    <p className="mt-3 text-2xl font-black text-violet-800">{selectedCell}</p>
                    <p className="mt-3 text-sm font-bold text-violet-900">Use this table as the canonical five-kingdom comparison for NEET classification questions.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                    <h3 className="text-lg font-black text-slate-900">Whittaker Logic</h3>
                    <p className="mt-2 text-sm font-bold text-slate-700">The system improves on two kingdoms by using cell structure, body organisation, nutrition, reproduction and phylogeny together.</p>
                </div>
            </div>
        </div>
    );

    const historyMode = (
        <div className="grid flex-1 grid-cols-[520px_1fr] gap-5 overflow-hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <h3 className="text-2xl font-black text-slate-950">Classification Timeline</h3>
                {[
                    ['Aristotle', 'Earliest scientific classification using morphology: trees/shrubs/herbs and red-blooded/non-red-blooded animals.'],
                    ['Linnaeus', 'Two-kingdom system: Plantae and Animalia.'],
                    ['Whittaker 1969', 'Five kingdoms based on cell structure, body organisation, nutrition, reproduction and phylogeny.'],
                    ['Three-domain / 6-kingdom', 'Monera split into Archaea and Bacteria; eukaryotic kingdoms form the third domain.']
                ].map(([title, text], index) => (
                    <div key={title} className="mt-4 flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-800">{index + 1}</div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="font-black text-slate-900">{title}</div>
                            <p className="text-sm font-bold text-slate-600">{text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-xl">
                <h3 className="text-2xl font-black text-red-950">Two-Kingdom Limitations</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                    {LIMITATIONS.map((item) => (
                        <div key={item} className="flex items-start gap-2 rounded-xl border border-red-200 bg-white p-3 text-sm font-bold text-red-900">
                            <XCircle size={17} className="mt-0.5 shrink-0" />
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const subMode = (
        <div className="grid flex-1 grid-cols-[360px_1fr] gap-5 overflow-hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <h3 className="text-lg font-black text-slate-900">Choose Kingdom</h3>
                <div className="mt-3 space-y-2">
                    {KINGDOMS.map((kingdom) => (
                        <button key={kingdom.name} onClick={() => setSubKingdom(kingdom.name)} className={`flex w-full items-center gap-2 rounded-xl border p-3 text-left font-black ${subKingdom === kingdom.name ? `${kingdom.border} ${kingdom.bg} ${kingdom.color}` : 'border-slate-200 bg-white text-slate-700'}`}>{kingdom.icon}{kingdom.name}</button>
                    ))}
                </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
                <h3 className="text-3xl font-black text-slate-950">{subKingdom} Sub-classification</h3>
                <div className="mt-5 grid grid-cols-2 gap-4">
                    {SUB_GROUPS[subKingdom].map((item) => (
                        <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-base font-bold text-slate-700">{item}</div>
                    ))}
                </div>
            </div>
        </div>
    );

    const changeMode = (
        <div className="grid flex-1 grid-cols-[360px_1fr] gap-5 overflow-hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <h3 className="text-lg font-black text-slate-900">Interactive Cases</h3>
                {CHANGE_CASES.map((item) => <button key={item.id} onClick={() => setCaseId(item.id)} className={`mt-3 w-full rounded-xl border p-3 text-left font-black ${caseId === item.id ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-700'}`}>Case {item.id}: {item.title}</button>)}
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-xl">
                <h3 className="text-3xl font-black text-amber-950">{activeCase.title}</h3>
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-red-200 bg-white p-5">
                        <div className="text-sm font-black uppercase tracking-wide text-red-700">Before</div>
                        <p className="mt-2 text-xl font-black text-red-950">{activeCase.before}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-white p-5">
                        <div className="text-sm font-black uppercase tracking-wide text-emerald-700">After</div>
                        <p className="mt-2 text-xl font-black text-emerald-950">{activeCase.after}</p>
                    </div>
                </div>
                <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-5 text-lg font-bold text-amber-950">Reason: {activeCase.reason}</div>
            </div>
        </div>
    );

    const acellularMode = (
        <div className="grid flex-1 grid-cols-[360px_1fr] gap-5 overflow-hidden">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <h3 className="text-lg font-black text-slate-900">Not in Five Kingdoms</h3>
                {(['Viruses', 'Viroids', 'Prions', 'Lichens'] as Acellular[]).map((item) => <button key={item} onClick={() => setAcellular(item)} className={`mt-3 w-full rounded-xl border p-3 text-left font-black ${acellular === item ? 'border-violet-300 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-700'}`}>{item}</button>)}
                <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">NCERT Sec 2.6 treats these separately because viruses, viroids and prions are acellular, while lichens are symbiotic associations.</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6 shadow-xl">
                <h3 className="text-4xl font-black text-violet-950">{acellular}</h3>
                <div className="mt-5 grid grid-cols-2 gap-4">
                    {ACELLULAR[acellular].map((item) => (
                        <div key={item} className="rounded-xl border border-violet-200 bg-white p-4 text-base font-bold text-violet-950">{item}</div>
                    ))}
                </div>
            </div>
        </div>
    );

    const simulationCombo = (
        <div className="flex h-full w-full flex-col gap-5 overflow-hidden rounded-2xl bg-white p-5 shadow-inner">
            {header}
            {mode === 'sorter' && sorterMode}
            {mode === 'table' && tableModeView}
            {mode === 'history' && historyMode}
            {mode === 'sub' && subMode}
            {mode === 'change' && changeMode}
            {mode === 'acellular' && acellularMode}
        </div>
    );

    const controlsCombo = (
        <div className="flex h-full flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-sm">
            <div className="flex items-center gap-2">
                <Microscope size={18} className="text-violet-700" />
                <div>
                    <div className="text-sm font-black text-slate-900">Five Kingdom Bench</div>
                    <div className="text-[11px] font-bold capitalize text-slate-500">{mode}</div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {MODES.map((item) => <button key={item.id} onClick={() => setMode(item.id)} className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-black ${mode === item.id ? 'border-violet-300 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{item.icon}{item.label}</button>)}
            </div>
            {mode === 'sorter' && <select value={filter} onChange={(event) => setFilter(event.target.value as OrganismFilter)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold">{(['All', 'Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia'] as OrganismFilter[]).map((item) => <option key={item}>{item}</option>)}</select>}
            {mode === 'table' && <button onClick={() => setTableMode(tableMode === 'compact' ? 'expanded' : 'compact')} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-black text-slate-700">{tableMode === 'compact' ? 'Show reproduction row' : 'Compact table'}</button>}
            {mode === 'sub' && <select value={subKingdom} onChange={(event) => setSubKingdom(event.target.value as Kingdom)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold">{KINGDOMS.map((item) => <option key={item.name}>{item.name}</option>)}</select>}
            {mode === 'change' && <div className="grid grid-cols-4 gap-2">{CHANGE_CASES.map((item) => <button key={item.id} onClick={() => setCaseId(item.id)} className={`rounded-lg border px-2 py-2 text-xs font-black ${caseId === item.id ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-700'}`}>{item.id}</button>)}</div>}
            {mode === 'acellular' && <select value={acellular} onChange={(event) => setAcellular(event.target.value as Acellular)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold">{(['Viruses', 'Viroids', 'Prions', 'Lichens'] as Acellular[]).map((item) => <option key={item}>{item}</option>)}</select>}
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowTraits((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showTraits ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-500'}`}>{showTraits ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} Traits</button>
                <button onClick={() => setShowCitations((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${showCitations ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-500'}`}>{showCitations ? <Eye size={15} className="mx-auto" /> : <EyeOff size={15} className="mx-auto" />} NCERT</button>
                <button onClick={() => setNameOnly((value) => !value)} className={`rounded-lg border p-2 text-xs font-black ${nameOnly ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-500'}`}>Names</button>
                <button onClick={reset} className="rounded-lg border border-slate-200 bg-white p-2 text-xs font-black text-slate-700"><RotateCcw size={15} className="mx-auto" /> Reset</button>
            </div>
        </div>
    );

    return (
        <TopicLayoutContainer
            topic={topic}
            onExit={onExit}
            SimulationComponent={simulationCombo}
            ControlsComponent={controlsCombo}
            controlsAreaFlex="0 0 240px"
            simulationStageWidth={W}
            simulationStageHeight={H}
            rootClassName="bg-white text-slate-900"
            simulationClassName="overflow-hidden bg-white"
            contentToggleClassName="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
        />
    );
};

export default FiveKingdomClassificationLab;
