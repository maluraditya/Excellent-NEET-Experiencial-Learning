import React, { useState } from 'react';
import { Search, Info, CheckCircle, XCircle, Table as TableIcon, Activity, RotateCcw, Eye } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

type Kingdom = 'Monera' | 'Protista' | 'Fungi' | 'Plantae' | 'Animalia';

interface Organism {
  id: string;
  name: string;
  emoji: string;
  kingdom: Kingdom;
  traits: {
    cellType: string;
    cellWall: string;
    nuclearMembrane: string;
    bodyOrganisation: string;
    nutrition: string;
  };
  rejectionHint: string;
}

const MYSTERY_ORGANISMS: Organism[] = [
  { 
      id: 'bacterium', 
      name: 'Glowing Rod (Bacterium)', 
      emoji: '🦠', 
      kingdom: 'Monera', 
      traits: { 
          cellType: 'Prokaryotic', 
          cellWall: 'Non-cellulosic (Polysaccharide + amino acid)', 
          nuclearMembrane: 'Absent', 
          bodyOrganisation: 'Cellular', 
          nutrition: 'Autotrophic / Heterotrophic' 
      },
      rejectionHint: 'Error: Nuclear membrane is absent. It is prokaryotic!'
  },
  { 
      id: 'amoeba', 
      name: 'Moving Blob (Amoeba)', 
      emoji: '💧', 
      kingdom: 'Protista', 
      traits: { 
          cellType: 'Eukaryotic', 
          cellWall: 'Absent in Amoeba (Present in some Protists)', 
          nuclearMembrane: 'Present', 
          bodyOrganisation: 'Cellular (Unicellular)', 
          nutrition: 'Heterotrophic' 
      },
      rejectionHint: 'Error: It is Eukaryotic but strictly Unicellular!'
  },
  { 
      id: 'mushroom', 
      name: 'Spotted Umbrella (Mushroom)', 
      emoji: '🍄', 
      kingdom: 'Fungi', 
      traits: { 
          cellType: 'Eukaryotic', 
          cellWall: 'Present (Chitin)', 
          nuclearMembrane: 'Present', 
          bodyOrganisation: 'Multicellular / Loose tissue', 
          nutrition: 'Heterotrophic (Saprophytic)' 
      },
      rejectionHint: 'Error: Autotrophic trait not detected. Chitin cell wall present.'
  },
  { 
      id: 'mango-leaf', 
      name: 'Mango Leaf', 
      emoji: '🌿', 
      kingdom: 'Plantae', 
      traits: { 
          cellType: 'Eukaryotic', 
          cellWall: 'Present (Cellulose)', 
          nuclearMembrane: 'Present', 
          bodyOrganisation: 'Tissue / Organ', 
          nutrition: 'Autotrophic (Photosynthetic)' 
      },
      rejectionHint: 'Error: Cellulose cell wall and Photosynthetic capability detected.'
  },
  { 
      id: 'housefly', 
      name: 'Housefly', 
      emoji: '🪰', 
      kingdom: 'Animalia', 
      traits: { 
          cellType: 'Eukaryotic', 
          cellWall: 'Absent', 
          nuclearMembrane: 'Present', 
          bodyOrganisation: 'Organ system', 
          nutrition: 'Heterotrophic (Holozoic)' 
      },
      rejectionHint: 'Error: No cell wall detected. Highly organised tissue/organs.'
  },
  {
      id: 'cyanobacteria',
      name: 'Blue-Green Patch (Cyanobacteria)',
      emoji: '🧫',
      kingdom: 'Monera',
      traits: {
          cellType: 'Prokaryotic',
          cellWall: 'Non-cellulosic',
          nuclearMembrane: 'Absent',
          bodyOrganisation: 'Cellular (Unicellular/Colonial)',
          nutrition: 'Autotrophic'
      },
      rejectionHint: 'Error: It has no true nucleus, so it belongs with prokaryotes.'
  },
  {
      id: 'euglena',
      name: 'Green Whip Cell (Euglena)',
      emoji: '🦠',
      kingdom: 'Protista',
      traits: {
          cellType: 'Eukaryotic',
          cellWall: 'Pellicle present, rigid wall absent',
          nuclearMembrane: 'Present',
          bodyOrganisation: 'Cellular (Unicellular)',
          nutrition: 'Autotrophic / Heterotrophic'
      },
      rejectionHint: 'Error: It is a unicellular eukaryote, so it fits Protista.'
  },
  {
      id: 'yeast',
      name: 'Baker Yeast',
      emoji: '🧬',
      kingdom: 'Fungi',
      traits: {
          cellType: 'Eukaryotic',
          cellWall: 'Present (Chitin)',
          nuclearMembrane: 'Present',
          bodyOrganisation: 'Cellular (Unicellular)',
          nutrition: 'Heterotrophic (Saprophytic)'
      },
      rejectionHint: 'Error: Chitin wall and absorptive nutrition indicate Fungi.'
  },
  {
      id: 'fern',
      name: 'Fern Frond',
      emoji: '🌿',
      kingdom: 'Plantae',
      traits: {
          cellType: 'Eukaryotic',
          cellWall: 'Present (Cellulose)',
          nuclearMembrane: 'Present',
          bodyOrganisation: 'Tissue / Organ',
          nutrition: 'Autotrophic (Photosynthetic)'
      },
      rejectionHint: 'Error: Cellulose wall and photosynthesis place it in Plantae.'
  },
  {
      id: 'earthworm',
      name: 'Earthworm',
      emoji: '🪱',
      kingdom: 'Animalia',
      traits: {
          cellType: 'Eukaryotic',
          cellWall: 'Absent',
          nuclearMembrane: 'Present',
          bodyOrganisation: 'Organ system',
          nutrition: 'Heterotrophic (Holozoic)'
      },
      rejectionHint: 'Error: It has no cell wall and shows organ-system level organisation.'
  }
];

const KINGDOMS: Kingdom[] = ['Monera', 'Protista', 'Fungi', 'Plantae', 'Animalia'];
const EMPTY_PLACED_ORGANISMS: Record<Kingdom, Organism[]> = {
    Monera: [],
    Protista: [],
    Fungi: [],
    Plantae: [],
    Animalia: [],
};

const FiveKingdomClassificationLab: React.FC<{ topic: any, onExit: () => void }> = ({ topic, onExit }) => {
  const [unplacedOrganisms, setUnplacedOrganisms] = useState<Organism[]>(MYSTERY_ORGANISMS);
  const [placedOrganisms, setPlacedOrganisms] = useState<Record<Kingdom, Organism[]>>(EMPTY_PLACED_ORGANISMS);
  
  const [scannerItem, setScannerItem] = useState<Organism | null>(null);
  const [scannedTraits, setScannedTraits] = useState<Record<string, boolean>>({
      cellType: false, cellWall: false, nuclearMembrane: false, bodyOrganisation: false, nutrition: false
  });
  
  const [feedback, setFeedback] = useState<{ message: string, type: 'error' | 'success' | null }>({ message: '', type: null });
  const [showTableRef, setShowTableRef] = useState(false);

  const handleSelectToScan = (org: Organism) => {
      setScannerItem(org);
      setScannedTraits({ cellType: false, cellWall: false, nuclearMembrane: false, bodyOrganisation: false, nutrition: false });
      setFeedback({ message: '', type: null });
  };

  const handleScanTrait = (trait: keyof Organism['traits']) => {
      if (scannerItem) {
          setScannedTraits(prev => ({ ...prev, [trait]: true }));
      }
  };

  const handlePlaceInKingdom = (kingdom: Kingdom) => {
      if (!scannerItem) return;

      // Check if all traits are scanned (optional but good for learning)
      const allScanned = Object.values(scannedTraits).every(v => v === true);
      if (!allScanned) {
          setFeedback({ message: 'Warning: You should scan all criteria before placing!', type: 'error' });
          // We let them fail or succeed anyway, but warn them.
      }

      if (scannerItem.kingdom === kingdom) {
          // Success
          setFeedback({ message: `Correct! ${scannerItem.name} belongs to ${kingdom}.`, type: 'success' });
          setPlacedOrganisms(prev => ({ ...prev, [kingdom]: [...prev[kingdom], scannerItem] }));
          setUnplacedOrganisms(prev => prev.filter(o => o.id !== scannerItem.id));
          setScannerItem(null);
          setScannedTraits({ cellType: false, cellWall: false, nuclearMembrane: false, bodyOrganisation: false, nutrition: false });
      } else {
          // Failure
          setFeedback({ message: scannerItem.rejectionHint, type: 'error' });
      }
  };

  const handleReturnToHolding = (organism: Organism, kingdom: Kingdom) => {
      setPlacedOrganisms(prev => ({
          ...prev,
          [kingdom]: prev[kingdom].filter(item => item.id !== organism.id),
      }));
      setUnplacedOrganisms(prev => {
          const restored = [...prev, organism];
          return MYSTERY_ORGANISMS.filter(candidate => restored.some(item => item.id === candidate.id));
      });
      if (scannerItem?.id === organism.id) {
          setScannerItem(null);
          setScannedTraits({ cellType: false, cellWall: false, nuclearMembrane: false, bodyOrganisation: false, nutrition: false });
      }
      setFeedback({ message: `${organism.name} returned to the Holding Area.`, type: 'success' });
  };

  const handleReset = () => {
      setUnplacedOrganisms(MYSTERY_ORGANISMS);
      setPlacedOrganisms({
          Monera: [],
          Protista: [],
          Fungi: [],
          Plantae: [],
          Animalia: [],
      });
      setScannerItem(null);
      setScannedTraits({ cellType: false, cellWall: false, nuclearMembrane: false, bodyOrganisation: false, nutrition: false });
      setFeedback({ message: 'Classification lab reset. All organisms are back in the Holding Area.', type: 'success' });
      setShowTableRef(false);
  };

  const handleRevealAll = () => {
      const allPlaced: Record<Kingdom, Organism[]> = {
          Monera: [],
          Protista: [],
          Fungi: [],
          Plantae: [],
          Animalia: [],
      };
      
      MYSTERY_ORGANISMS.forEach(org => {
          allPlaced[org.kingdom].push(org);
      });
      
      setPlacedOrganisms(allPlaced);
      setUnplacedOrganisms([]);
      setScannerItem(null);
      setScannedTraits({ cellType: false, cellWall: false, nuclearMembrane: false, bodyOrganisation: false, nutrition: false });
      setFeedback({ message: 'All organisms have been revealed and sorted into their respective kingdoms.', type: 'success' });
  };

  const successfulClassifications = (Object.values(placedOrganisms) as Organism[][]).reduce((count, organisms) => count + organisms.length, 0);

  const simulationCombo = (
    <div className="w-full h-full flex gap-5 p-5 pt-10 bg-slate-900 rounded-2xl border border-slate-700 font-sans text-slate-200 overflow-hidden shadow-2xl">
      
      {/* Left Column: Mystery Organisms & Scanner */}
      <div className="w-[34%] min-w-0 min-h-0 flex flex-col gap-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-600 shadow-lg flex-1 min-h-0 flex flex-col">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                  <Activity size={18} className="text-cyan-400" /> Holding Area
              </h3>
              <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 min-h-0">
                  {unplacedOrganisms.filter(o => o.id !== scannerItem?.id).map(org => (
                      <button 
                          key={org.id}
                          onClick={() => handleSelectToScan(org)}
                          className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg border border-slate-500 flex flex-col items-center justify-center gap-2 transition-all min-h-[92px]"
                      >
                          <span className="text-4xl">{org.emoji}</span>
                          <span className="text-sm font-semibold text-center leading-tight">{org.name}</span>
                      </button>
                  ))}
                  {unplacedOrganisms.length === 0 && !scannerItem && (
                      <div className="col-span-2 text-center text-emerald-400 font-bold p-4">
                          All organisms classified successfully!
                      </div>
                  )}
              </div>
          </div>

          {/* Scanner Area */}
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-600 shadow-lg min-h-0 flex-1 relative overflow-hidden flex flex-col">
               <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
                  <Search size={18} className="text-cyan-400" /> Info-Scanner
              </h3>
              
              {scannerItem ? (
                  <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pr-1 animate-in zoom-in duration-300">
                      <div className="flex items-start gap-3 mb-4">
                          <div className="w-16 h-16 shrink-0 bg-slate-900 rounded-full flex items-center justify-center text-4xl border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                              {scannerItem.emoji}
                          </div>
                          <div className="font-bold text-base leading-snug text-cyan-50 break-words">{scannerItem.name}</div>
                      </div>

                      <div className="space-y-2 flex-1 min-h-0">
                          <ScannerRow label="Cell Type" value={scannerItem.traits.cellType} isScanned={scannedTraits.cellType} onScan={() => handleScanTrait('cellType')} />
                          <ScannerRow label="Cell Wall" value={scannerItem.traits.cellWall} isScanned={scannedTraits.cellWall} onScan={() => handleScanTrait('cellWall')} />
                          <ScannerRow label="Nuclear Memb." value={scannerItem.traits.nuclearMembrane} isScanned={scannedTraits.nuclearMembrane} onScan={() => handleScanTrait('nuclearMembrane')} />
                          <ScannerRow label="Body Org." value={scannerItem.traits.bodyOrganisation} isScanned={scannedTraits.bodyOrganisation} onScan={() => handleScanTrait('bodyOrganisation')} />
                          <ScannerRow label="Nutrition" value={scannerItem.traits.nutrition} isScanned={scannedTraits.nutrition} onScan={() => handleScanTrait('nutrition')} />
                      </div>
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                      <Search size={48} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium text-center">Select a mystery organism to scan its characteristics.</p>
                  </div>
              )}
          </div>
      </div>

      {/* Right Column: Kingdom Portals & Feedback */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-4">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-600 shadow-lg flex justify-between items-center gap-3">
              <div className="text-base font-medium text-slate-300">
                  Successful Classifications: <span className="font-bold text-emerald-400 text-xl ml-2">{successfulClassifications}/{MYSTERY_ORGANISMS.length}</span>
              </div>
              <div className="flex items-center gap-2">
                  <button
                      onClick={handleReset}
                      className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors border border-slate-500"
                  >
                      <RotateCcw size={16} /> Reset
                  </button>
                  <button 
                      onClick={handleRevealAll}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors border border-emerald-500"
                  >
                      <Eye size={16} /> Reveal All
                  </button>
                  <button 
                      onClick={() => setShowTableRef(true)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                      <TableIcon size={16} /> NCERT Table 2.1 Ref
                  </button>
              </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 min-h-0">
              {KINGDOMS.map(kingdom => (
                  <div key={kingdom} className="bg-slate-800 rounded-xl border border-slate-600 flex flex-col overflow-hidden shadow-lg relative">
                      <div className="bg-slate-700 py-2 px-3 border-b border-slate-600 flex justify-between items-center">
                          <span className="font-bold tracking-wide text-lg text-indigo-200">{kingdom}</span>
                          <span className="text-xs bg-slate-900 px-2 py-0.5 rounded-full">{placedOrganisms[kingdom].length}</span>
                      </div>
                      <div className="flex-1 p-3 flex flex-wrap gap-2 content-start min-h-[100px]">
                          {placedOrganisms[kingdom].map(org => (
                              <button
                                  key={org.id}
                                  onClick={() => handleReturnToHolding(org, kingdom)}
                                  className="w-10 h-10 bg-slate-900 rounded border border-slate-600 flex items-center justify-center text-xl hover:bg-slate-700 hover:border-cyan-400 transition-colors"
                                  title={`${org.name} - click to return to Holding Area`}
                              >
                                  {org.emoji}
                              </button>
                          ))}
                      </div>
                      <div className="p-2 border-t border-slate-700 bg-slate-800/50">
                          <button 
                              onClick={() => handlePlaceInKingdom(kingdom)}
                              disabled={!scannerItem}
                              className={`w-full py-3 rounded font-bold text-base transition-all ${scannerItem ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-600 hover:text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                          >
                              Place Here
                          </button>
                      </div>
                  </div>
              ))}
          </div>

          {/* Feedback Area */}
          <div className={`min-h-16 rounded-xl border flex items-center px-4 py-3 shadow-lg transition-colors ${feedback.type === 'error' ? 'bg-rose-950/50 border-rose-800 text-rose-300' : feedback.type === 'success' ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
              {feedback.type === 'error' && <XCircle className="mr-3" />}
              {feedback.type === 'success' && <CheckCircle className="mr-3" />}
              {!feedback.type && <Info className="mr-3" />}
              <span className="font-medium text-base">
                  {feedback.message || 'Scan characteristics carefully before assigning an organism to a kingdom.'}
              </span>
          </div>
      </div>

      {/* NCERT Table 2.1 Modal Overlay */}
      {showTableRef && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
              <div className="bg-slate-800 rounded-2xl border border-slate-600 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-full">
                  <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900">
                      <h3 className="font-bold text-lg text-white">Table 2.1 Characteristics of the Five Kingdoms</h3>
                      <button onClick={() => setShowTableRef(false)} className="text-slate-400 hover:text-white">
                          <XCircle size={24} />
                      </button>
                  </div>
                  <div className="p-6 overflow-auto text-sm text-slate-300">
                      <table className="w-full text-left border-collapse border border-slate-600">
                          <thead>
                              <tr className="bg-slate-700">
                                  <th className="border border-slate-600 p-2 font-bold text-white">Characters</th>
                                  <th className="border border-slate-600 p-2 font-bold text-white">Monera</th>
                                  <th className="border border-slate-600 p-2 font-bold text-white">Protista</th>
                                  <th className="border border-slate-600 p-2 font-bold text-white">Fungi</th>
                                  <th className="border border-slate-600 p-2 font-bold text-white">Plantae</th>
                                  <th className="border border-slate-600 p-2 font-bold text-white">Animalia</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr>
                                  <td className="border border-slate-600 p-2 font-bold bg-slate-750">Cell type</td>
                                  <td className="border border-slate-600 p-2">Prokaryotic</td>
                                  <td className="border border-slate-600 p-2">Eukaryotic</td>
                                  <td className="border border-slate-600 p-2">Eukaryotic</td>
                                  <td className="border border-slate-600 p-2">Eukaryotic</td>
                                  <td className="border border-slate-600 p-2">Eukaryotic</td>
                              </tr>
                              <tr>
                                  <td className="border border-slate-600 p-2 font-bold bg-slate-750">Cell wall</td>
                                  <td className="border border-slate-600 p-2">Noncellulosic (Polysaccharide + amino acid)</td>
                                  <td className="border border-slate-600 p-2">Present in some</td>
                                  <td className="border border-slate-600 p-2">Present (without cellulose)</td>
                                  <td className="border border-slate-600 p-2">Present (cellulose)</td>
                                  <td className="border border-slate-600 p-2">Absent</td>
                              </tr>
                              <tr>
                                  <td className="border border-slate-600 p-2 font-bold bg-slate-750">Nuclear membrane</td>
                                  <td className="border border-slate-600 p-2">Absent</td>
                                  <td className="border border-slate-600 p-2">Present</td>
                                  <td className="border border-slate-600 p-2">Present</td>
                                  <td className="border border-slate-600 p-2">Present</td>
                                  <td className="border border-slate-600 p-2">Present</td>
                              </tr>
                              <tr>
                                  <td className="border border-slate-600 p-2 font-bold bg-slate-750">Body organisation</td>
                                  <td className="border border-slate-600 p-2">Cellular</td>
                                  <td className="border border-slate-600 p-2">Cellular</td>
                                  <td className="border border-slate-600 p-2">Multicellular / loose tissue</td>
                                  <td className="border border-slate-600 p-2">Tissue/organ</td>
                                  <td className="border border-slate-600 p-2">Tissue/organ/organ system</td>
                              </tr>
                              <tr>
                                  <td className="border border-slate-600 p-2 font-bold bg-slate-750">Mode of nutrition</td>
                                  <td className="border border-slate-600 p-2">Autotrophic & Heterotrophic</td>
                                  <td className="border border-slate-600 p-2">Autotrophic & Heterotrophic</td>
                                  <td className="border border-slate-600 p-2">Heterotrophic (Saprophytic / Parasitic)</td>
                                  <td className="border border-slate-600 p-2">Autotrophic (Photosynthetic)</td>
                                  <td className="border border-slate-600 p-2">Heterotrophic (Holozoic / Saprophytic etc.)</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

    </div>
  );

  const controlsCombo = (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
        <h3 className="font-bold text-slate-800 mb-1">Instructions</h3>
        <p className="text-sm text-slate-600">
            1. Select a mystery organism from the <strong>Holding Area</strong> to load it into the Info-Scanner.<br/>
            2. Click on the <strong>Scan</strong> buttons to reveal its biological characteristics based on Whittaker's 5 criteria.<br/>
            3. Deduce which of the five kingdoms it belongs to using the <strong>NCERT Table 2.1 Ref</strong>.<br/>
            4. Click <strong>Place Here</strong> on the correct Kingdom Portal to classify it.<br/>
            5. Click any placed organism to return it to the <strong>Holding Area</strong>, or use <strong>Reset</strong> to restart the full activity.
        </p>
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
        simulationStageWidth={900}
        simulationStageHeight={560}
    />
  );
};

const ScannerRow: React.FC<{ label: string, value: string, isScanned: boolean, onScan: () => void }> = ({ label, value, isScanned, onScan }) => {
    return (
        <div className="flex items-center justify-between bg-slate-900 rounded p-2 border border-slate-700">
            <span className="text-sm font-bold text-slate-400 w-28">{label}:</span>
            {isScanned ? (
                <span className="text-sm font-medium text-emerald-300 flex-1 ml-2 animate-in slide-in-from-right-2 duration-300">
                    {value}
                </span>
            ) : (
                <button 
                    onClick={onScan}
                    className="flex-1 ml-2 bg-slate-700 hover:bg-cyan-600 text-cyan-200 text-sm font-bold py-1.5 px-2 rounded transition-colors text-left"
                >
                    [ Click to Scan ]
                </button>
            )}
        </div>
    );
};

export default FiveKingdomClassificationLab;
