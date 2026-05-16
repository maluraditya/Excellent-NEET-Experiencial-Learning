import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, ChevronRight, PenTool, Type, Search } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface Organism {
  id: string;
  commonName: string;
  genus: string;
  species: string;
  family: string;
  order: string;
  class: string;
  phylum: string;
  kingdom: string;
  traits: string[];
  emoji: string;
}

const ORGANISMS: Organism[] = [
  { id: 'lion', commonName: 'Lion', genus: 'Panthera', species: 'leo', family: 'Felidae', order: 'Carnivora', class: 'Mammalia', phylum: 'Chordata', kingdom: 'Animalia', traits: ['Multicellular', 'Heterotrophic', 'Notochord', 'Mammary Glands', 'Carnivorous', 'Roars', 'Mane'], emoji: '🦁' },
  { id: 'tiger', commonName: 'Tiger', genus: 'Panthera', species: 'tigris', family: 'Felidae', order: 'Carnivora', class: 'Mammalia', phylum: 'Chordata', kingdom: 'Animalia', traits: ['Multicellular', 'Heterotrophic', 'Notochord', 'Mammary Glands', 'Carnivorous', 'Roars', 'Stripes'], emoji: '🐅' },
  { id: 'leopard', commonName: 'Leopard', genus: 'Panthera', species: 'pardus', family: 'Felidae', order: 'Carnivora', class: 'Mammalia', phylum: 'Chordata', kingdom: 'Animalia', traits: ['Multicellular', 'Heterotrophic', 'Notochord', 'Mammary Glands', 'Carnivorous', 'Roars', 'Spots'], emoji: '🐆' },
  { id: 'housefly', commonName: 'Housefly', genus: 'Musca', species: 'domestica', family: 'Muscidae', order: 'Diptera', class: 'Insecta', phylum: 'Arthropoda', kingdom: 'Animalia', traits: ['Multicellular', 'Heterotrophic', 'Jointed Legs', '3 Pairs of Legs', 'Two Wings', 'Sponging Mouthparts'], emoji: '🪰' },
  { id: 'man', commonName: 'Man', genus: 'Homo', species: 'sapiens', family: 'Hominidae', order: 'Primata', class: 'Mammalia', phylum: 'Chordata', kingdom: 'Animalia', traits: ['Multicellular', 'Heterotrophic', 'Notochord', 'Mammary Glands', 'Opposable Thumbs', 'Bipedal', 'Highly Developed Brain'], emoji: '🧑' },
  { id: 'mango', commonName: 'Mango', genus: 'Mangifera', species: 'indica', family: 'Anacardiaceae', order: 'Sapindales', class: 'Dicotyledonae', phylum: 'Angiospermae', kingdom: 'Plantae', traits: ['Multicellular', 'Autotrophic', 'Flowers', 'Two Cotyledons', 'Drupe Fruit', 'Evergreen'], emoji: '🥭' },
  { id: 'wheat', commonName: 'Wheat', genus: 'Triticum', species: 'aestivum', family: 'Poaceae', order: 'Poales', class: 'Monocotyledonae', phylum: 'Angiospermae', kingdom: 'Plantae', traits: ['Multicellular', 'Autotrophic', 'Flowers', 'One Cotyledon', 'Grass Family', 'Cereal Grain'], emoji: '🌾' },
  { id: 'potato', commonName: 'Potato', genus: 'Solanum', species: 'tuberosum', family: 'Solanaceae', order: 'Polemoniales', class: 'Dicotyledonae', phylum: 'Angiospermae', kingdom: 'Plantae', traits: ['Multicellular', 'Autotrophic', 'Flowers', 'Two Cotyledons', 'Stem Tuber', 'Underground Storage'], emoji: '🥔' },
  { id: 'brinjal', commonName: 'Brinjal', genus: 'Solanum', species: 'melongena', family: 'Solanaceae', order: 'Polemoniales', class: 'Dicotyledonae', phylum: 'Angiospermae', kingdom: 'Plantae', traits: ['Multicellular', 'Autotrophic', 'Flowers', 'Two Cotyledons', 'Berry Fruit', 'Purple Skin'], emoji: '🍆' },
  { id: 'datura', commonName: 'Datura', genus: 'Datura', species: 'stramonium', family: 'Solanaceae', order: 'Polemoniales', class: 'Dicotyledonae', phylum: 'Angiospermae', kingdom: 'Plantae', traits: ['Multicellular', 'Autotrophic', 'Flowers', 'Two Cotyledons', 'Trumpet Flowers', 'Poisonous/Medicinal'], emoji: '🌸' }
];

const RANKS = ['Kingdom', 'Phylum/Division', 'Class', 'Order', 'Family', 'Genus', 'Species'] as const;
type Rank = typeof RANKS[number];

interface NomenclatureState {
  organismId: string;
  status: 'unnamed' | 'named';
  namedAs: string; // The correct binomial name
}

const BinomialNomenclatureLab: React.FC<{ topic: any, onExit: () => void }> = ({ topic, onExit }) => {
  const [selectedOrganismId, setSelectedOrganismId] = useState<string | null>(null);
  const [placedOrganisms, setPlacedOrganisms] = useState<NomenclatureState[]>([]);
  const [currentRankView, setCurrentRankView] = useState<Rank>('Species');
  
  // Naming Station State
  const [typedName, setTypedName] = useState('');
  const [formatMode, setFormatMode] = useState<'printed' | 'handwritten'>('printed');
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderlined, setIsUnderlined] = useState(false);
  const [namingError, setNamingError] = useState('');

  const selectedOrganism = ORGANISMS.find(o => o.id === selectedOrganismId);

  const handleOrganismSelect = (id: string) => {
    setSelectedOrganismId(id);
    setTypedName('');
    setIsItalic(false);
    setIsUnderlined(false);
    setNamingError('');
  };

  const validateName = () => {
    if (!selectedOrganism) return;
    setNamingError('');

    const targetGenus = selectedOrganism.genus;
    const targetSpecies = selectedOrganism.species;
    const parts = typedName.trim().split(/\s+/);
    
    if (parts.length !== 2) {
      setNamingError('A binomial name must have exactly two words (Genus and specific epithet).');
      return;
    }

    const [typedGenus, typedSpecies] = parts;

    if (typedGenus.toLowerCase() !== targetGenus.toLowerCase() || typedSpecies.toLowerCase() !== targetSpecies.toLowerCase()) {
      setNamingError(`Incorrect words. Hint: ${targetGenus} ${targetSpecies}`);
      return;
    }

    if (typedGenus[0] !== typedGenus[0].toUpperCase()) {
      setNamingError('The Genus name must start with a capital letter.');
      return;
    }

    if (typedGenus.slice(1) !== typedGenus.slice(1).toLowerCase()) {
        setNamingError('The rest of the Genus name must be lowercase.');
        return;
    }

    if (typedSpecies !== typedSpecies.toLowerCase()) {
      setNamingError('The specific epithet must start with a small letter and be entirely lowercase.');
      return;
    }

    if (formatMode === 'printed' && !isItalic) {
      setNamingError('Printed scientific names must be italicized to indicate Latin origin.');
      return;
    }

    if (formatMode === 'handwritten' && !isUnderlined) {
      setNamingError('Handwritten scientific names must be separately underlined.');
      return;
    }

    // Success! Add to placed organisms
    if (!placedOrganisms.find(p => p.organismId === selectedOrganism.id)) {
      setPlacedOrganisms([...placedOrganisms, { organismId: selectedOrganism.id, status: 'named', namedAs: `${selectedOrganism.genus} ${selectedOrganism.species}` }]);
    }
    
    setSelectedOrganismId(null);
  };

  const getActiveTraits = () => {
    if (placedOrganisms.length === 0) return null;
    
    // Get all placed organism objects
    const placed = placedOrganisms.map(p => ORGANISMS.find(o => o.id === p.organismId)!);
    
    // Group by rank
    const groups: { [key: string]: Organism[] } = {};
    placed.forEach(org => {
      let key = org.species; // default
      if (currentRankView === 'Kingdom') key = org.kingdom;
      if (currentRankView === 'Phylum/Division') key = org.phylum;
      if (currentRankView === 'Class') key = org.class;
      if (currentRankView === 'Order') key = org.order;
      if (currentRankView === 'Family') key = org.family;
      if (currentRankView === 'Genus') key = org.genus;
      if (!groups[key]) groups[key] = [];
      groups[key].push(org);
    });

    // Find intersection of traits for the first group (or show a general list)
    // Actually, to show character abundance logic:
    // If we are viewing a specific rank, we should show common traits of the visible groups.
    // Let's just find common traits of ALL currently visible placed organisms at this rank level.
    // E.g. if we view Kingdom, all placed animals are in Animalia.
    // Let's take the first group as the representative for the sidebar.
    const firstGroupKey = Object.keys(groups)[0];
    if (!firstGroupKey) return null;
    
    let commonTraits = groups[firstGroupKey][0].traits;
    for (let i = 1; i < groups[firstGroupKey].length; i++) {
        commonTraits = commonTraits.filter(t => groups[firstGroupKey][i].traits.includes(t));
    }
    
    return {
      groupName: firstGroupKey,
      traits: commonTraits
    };
  };

  const activeTraitsData = getActiveTraits();

  const groupedOrganisms = useMemo(() => {
    const groups: { [key: string]: Organism[] } = {};
    placedOrganisms.forEach(p => {
        const org = ORGANISMS.find(o => o.id === p.organismId)!;
        let key = org.species;
        if (currentRankView === 'Kingdom') key = org.kingdom;
        if (currentRankView === 'Phylum/Division') key = org.phylum;
        if (currentRankView === 'Class') key = org.class;
        if (currentRankView === 'Order') key = org.order;
        if (currentRankView === 'Family') key = org.family;
        if (currentRankView === 'Genus') key = org.genus;
        
        if (!groups[key]) groups[key] = [];
        groups[key].push(org);
    });
    return groups;
  }, [placedOrganisms, currentRankView]);


  const simulationCombo = (
    <div className="w-full h-full flex gap-5 p-5 pt-10 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl">
      {/* LEFT: Sorting Tray */}
      <div className="w-1/4 min-w-0 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="bg-slate-100 p-4 border-b border-slate-200 font-bold text-base text-slate-700">
          Sorting Tray
        </div>
        <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2">
          {ORGANISMS.map(org => {
            const isPlaced = placedOrganisms.some(p => p.organismId === org.id);
            const isSelected = selectedOrganismId === org.id;
            return (
              <button 
                key={org.id}
                onClick={() => handleOrganismSelect(org.id)}
                disabled={isPlaced}
                className={`p-4 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${isPlaced ? 'opacity-50 bg-slate-50 border-slate-200' : isSelected ? 'ring-2 ring-brand-primary bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-slate-200 bg-white shadow-sm'}`}
              >
                <span className="text-2xl shrink-0">{org.emoji}</span>
                <span className="min-w-0 whitespace-nowrap text-sm font-semibold text-slate-700">{org.commonName}</span>
                {isPlaced && <CheckCircle size={16} className="text-green-500" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* MIDDLE: Hierarchy & View */}
      <div className="flex-1 flex flex-col gap-4">
        {selectedOrganism ? (
            // NAMING STATION
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-brand-primary/30 p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                <div className="text-7xl mb-4">{selectedOrganism.emoji}</div>
                <h2 className="text-3xl font-bold text-slate-800 mb-6">Identify & Name: {selectedOrganism.commonName}</h2>
                
                <div className="w-full max-w-md bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex bg-slate-200 p-1 rounded-lg">
                        <button 
                            onClick={() => setFormatMode('printed')} 
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-base transition-all ${formatMode === 'printed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}
                        >
                            <Type size={16} /> Printed
                        </button>
                        <button 
                            onClick={() => setFormatMode('handwritten')} 
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-base transition-all ${formatMode === 'handwritten' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}
                        >
                            <PenTool size={16} /> Handwritten
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            placeholder="Type scientific name..." 
                            value={typedName}
                            onChange={(e) => setTypedName(e.target.value)}
                            className={`flex-1 px-5 py-4 border rounded-lg focus:ring-2 focus:ring-brand-primary outline-none transition-all text-lg text-slate-900 ${isItalic ? 'italic' : ''} ${isUnderlined ? 'underline underline-offset-4 decoration-2' : ''}`}
                            style={{ 
                                textDecorationStyle: isUnderlined ? 'solid' : 'initial',
                                textDecorationLine: isUnderlined ? 'underline' : 'none'
                            }}
                        />
                    </div>

                    <div className="flex gap-2 justify-center">
                        {formatMode === 'printed' ? (
                            <button 
                                onClick={() => setIsItalic(!isItalic)}
                                className={`px-5 py-3 rounded-lg font-bold border transition-all ${isItalic ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-300'}`}
                            >
                                <span className="italic">I</span> Italicize
                            </button>
                        ) : (
                            <button 
                                onClick={() => setIsUnderlined(!isUnderlined)}
                                className={`px-5 py-3 rounded-lg font-bold border transition-all flex items-center gap-2 ${isUnderlined ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-600 border-slate-300'}`}
                            >
                                <span className="underline decoration-2">U</span> Separate Underline
                            </button>
                        )}
                    </div>

                    {namingError && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-base font-medium flex items-start gap-2">
                            <XCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{namingError}</span>
                        </div>
                    )}

                    <button 
                        onClick={validateName}
                        className="w-full py-4 bg-brand-primary text-white text-lg font-bold rounded-lg shadow-md hover:bg-brand-primary/90 transition-all active:scale-95"
                    >
                        Verify & Add to Hierarchy
                    </button>
                </div>
            </div>
        ) : (
            // HIERARCHY VIEW
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                 <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center gap-3">
                    <span className="font-bold text-lg text-slate-700">Digital Hierarchy Ladder</span>
                    <div className="flex bg-white rounded-lg p-1 border border-slate-300 text-sm font-bold">
                        {RANKS.map(rank => (
                            <button 
                                key={rank}
                                onClick={() => setCurrentRankView(rank)}
                                className={`px-3 py-2 rounded transition-all ${currentRankView === rank ? 'bg-brand-secondary text-brand-dark' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {rank}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-slate-50 flex flex-col gap-4">
                    {placedOrganisms.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Search size={64} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Select an organism from the Sorting Tray to identify it.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(Object.entries(groupedOrganisms) as [string, Organism[]][]).map(([groupName, orgs]) => (
                                <div key={groupName} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 animate-in zoom-in duration-300">
                                    <div className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">{currentRankView}</div>
                                    <div className="text-xl font-bold text-slate-800 mb-4">{groupName}</div>
                                    <div className="flex flex-wrap gap-2">
                                        {orgs.map(org => (
                                            <div key={org.id} className="flex flex-col items-center p-2 bg-slate-50 rounded-lg border border-slate-100" title={org.commonName}>
                                                <span className="text-2xl">{org.emoji}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {currentRankView !== 'Species' && (
                                         <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                                             Contains {orgs.length} identified species
                                         </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* RIGHT: Character List */}
      <div className="w-[18%] min-w-0 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="bg-slate-100 p-4 border-b border-slate-200 font-bold text-base text-slate-700">
          Character List
        </div>
        <div className="p-4 flex-1 overflow-y-auto bg-slate-50">
           {placedOrganisms.length === 0 ? (
               <p className="text-sm text-slate-400 text-center mt-10">No organisms placed yet.</p>
           ) : selectedOrganismId ? (
                <p className="text-sm text-slate-400 text-center mt-10">Name the organism to view traits.</p>
           ) : (
               <div className="animate-in fade-in duration-300">
                   <h3 className="font-bold text-slate-800 mb-2">Common Traits at {currentRankView} Level</h3>
                   {activeTraitsData && activeTraitsData.groupName ? (
                       <>
                        <div className="text-sm text-brand-primary font-bold mb-4">E.g., {activeTraitsData.groupName}</div>
                        <ul className="space-y-2">
                            {activeTraitsData.traits.map(t => (
                                <li key={t} className="flex items-start gap-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-100 shadow-sm">
                                    <ChevronRight size={14} className="mt-0.5 text-brand-secondary shrink-0" />
                                    <span>{t}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800 font-medium">
                            <strong>Note:</strong> As you move to higher ranks (e.g., from Species to Kingdom), the number of shared characteristics decreases.
                        </div>
                       </>
                   ) : (
                       <p className="text-sm text-slate-500">Select a rank to see common traits.</p>
                   )}
               </div>
           )}
        </div>
      </div>
    </div>
  );

  const controlsCombo = (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
            <h3 className="font-bold text-slate-800 mb-1">Instructions</h3>
            <p className="text-sm text-slate-600">
                1. Select an organism from the <strong>Sorting Tray</strong>.<br/>
                2. Enter its correct scientific name applying the rules of <strong>Binomial Nomenclature</strong>. Remember capitalization and formatting!<br/>
                3. Once verified, view how organisms group together as you switch the <strong>Rank View</strong> from Species up to Kingdom.<br/>
                4. Observe the <strong>Character List</strong> to see how shared traits decrease at higher taxonomic categories.
            </p>
        </div>
        <div className="flex flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4 min-w-[200px]">
            <button 
                onClick={() => {
                    const allPlaced = ORGANISMS.map(org => ({
                        organismId: org.id,
                        status: 'named' as const,
                        namedAs: `${org.genus} ${org.species}`
                    }));
                    setPlacedOrganisms(allPlaced);
                    setSelectedOrganismId(null);
                }}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-all text-sm w-full"
            >
                Reveal All Answers
            </button>
            <button 
                onClick={() => {
                    setPlacedOrganisms([]);
                    setSelectedOrganismId(null);
                }}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all text-sm w-full"
            >
                Reset Progress
            </button>
        </div>
    </div>
  );

  return (
    <TopicLayoutContainer 
        topic={topic} 
        onExit={onExit} 
        SimulationComponent={simulationCombo} 
        ControlsComponent={controlsCombo} 
        simulationAreaFlex="5 1 0"
        controlsAreaFlex="0 0 auto"
        simulationStageWidth={1040}
        simulationStageHeight={600}
    />
  );
};

export default BinomialNomenclatureLab;
