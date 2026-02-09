import React, { useState, useMemo, useEffect } from 'react';
import { Screen, SimulationConfig, Subject } from './types';
import Dashboard from './components/Dashboard';
import TextbookContent from './components/TextbookContent';
import CollisionCanvas from './components/CollisionCanvas';
import ElectrochemistryCanvas from './components/ElectrochemistryCanvas';
import StereochemistryCanvas from './components/StereochemistryCanvas';
import DBlockCanvas from './components/DBlockCanvas';
import HaloalkaneCanvas from './components/HaloalkaneCanvas';
import PolymerCanvas from './components/PolymerCanvas';
import SolidStateCanvas from './components/SolidStateCanvas';
import GeneticsCanvas from './components/GeneticsCanvas';
import LinkageCanvas from './components/LinkageCanvas';
import TranscriptionCanvas from './components/TranscriptionCanvas';
import LacOperonCanvas from './components/LacOperonCanvas';
import ReplicationCanvas from './components/ReplicationCanvas';
import RNAiCanvas from './components/RNAiCanvas';
import TiPlasmidCanvas from './components/TiPlasmidCanvas';
import ElectromagneticInductionCanvas from './components/ElectromagneticInductionCanvas';
import AlternatingCurrentCanvas from './components/AlternatingCurrentCanvas';
import EMWavesCanvas from './components/EMWavesCanvas';
import RayOpticsCanvas from './components/RayOpticsCanvas';
import WaveOpticsCanvas from './components/WaveOpticsCanvas';
import PhotoelectricCanvas from './components/PhotoelectricCanvas';
import AtomsCanvas from './components/AtomsCanvas';
import SemiconductorCanvas from './components/SemiconductorCanvas';
import { MaxwellBoltzmannChart, PotentialEnergyDiagram } from './components/Charts';
import Assistant from './components/Assistant';
import Breadcrumbs from './components/Breadcrumbs';
import { RotateCcw, Activity, ArrowLeft, Home, Battery, Box, Magnet, FlaskConical, Layers, Cuboid, Grid, Percent, AlertTriangle, Info } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<Screen>('DASHBOARD');
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject>('Chemistry');

  // --- SCROLL TO TOP ON NAVIGATION ---
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen, activeTopicId]);

  // --- DASHBOARD IMAGE CACHE ---
  // Lifted state to persist generated images across screen navigation
  const [topicImages, setTopicImages] = useState<Record<string, string>>({});

  // --- KINETICS STATE ---
  const [kineticsConfig, setKineticsConfig] = useState<SimulationConfig>({
    temperature: 300,
    activationEnergy: 120,
    stericFactor: 0.5,
    moleculeCount: 25
  });
  const [reactionCount, setReactionCount] = useState(0);

  // --- ELECTROCHEMISTRY STATE ---
  const [externalVoltage, setExternalVoltage] = useState(0.0); // Starts at 0, acting as pure Galvanic

  // --- STEREOCHEMISTRY STATE ---
  const [isomerConfig, setIsomerConfig] = useState<{
    type: 'cis-trans-sq' | 'fac-mer' | 'optical',
    subType: 'A' | 'B',
    showMirror: boolean
  }>({
    type: 'cis-trans-sq',
    subType: 'A',
    showMirror: false
  });

  // --- D-BLOCK STATE ---
  const [selectedIon, setSelectedIon] = useState<string>('Ti3+');

  // --- HALOALKANES STATE ---
  const [haloConfig, setHaloConfig] = useState<{ substrate: 'primary' | 'tertiary', mechanism: 'SN1' | 'SN2' }>({
    substrate: 'primary',
    mechanism: 'SN2'
  });

  // --- POLYMER STATE ---
  const [polyMode, setPolyMode] = useState<'synthesis' | 'conductivity'>('synthesis');

  // --- SOLID STATE ---
  const [solidClassConfig, setSolidClassConfig] = useState<{ type: 'ionic' | 'metallic' | 'molecular' | 'covalent', action: 'none' | 'hammer' | 'heat' | 'battery' }>({
    type: 'ionic',
    action: 'none'
  });
  const [unitCellConfig, setUnitCellConfig] = useState<{ type: 'scc' | 'bcc' | 'fcc', slicer: boolean }>({
    type: 'scc',
    slicer: false
  });
  const [defectMode, setDefectMode] = useState<'schottky' | 'frenkel'>('schottky');

  // --- PHYSICS STATE ---
  const [emiSpeed, setEmiSpeed] = useState(2);
  const [transformerConfig, setTransformerConfig] = useState({ np: 100, ns: 200 });
  const [opticsDevice, setOpticsDevice] = useState<'convex_lens' | 'concave_lens' | 'prism'>('convex_lens');
  const [photoelectricConfig, setPhotoelectricConfig] = useState({ frequency: 2, intensity: 5 });


  // Handlers
  const handleTopicSelect = (topicId: string) => {
    setActiveTopicId(topicId);
    setCurrentScreen('TOPIC_VIEW');
  };

  const goHome = () => {
    setCurrentScreen('DASHBOARD');
    setActiveTopicId(null);
  };

  // --- AI CONTEXT GENERATION ---
  const aiContext = useMemo(() => {
    if (activeTopicId === 'kinetics') {
      return `
        Topic: Chemical Kinetics (Collision Theory)
        State: Temperature ${kineticsConfig.temperature}K, Ea ${kineticsConfig.activationEnergy}, Steric Factor ${kineticsConfig.stericFactor}.
        Reactions: ${reactionCount}.
        Concept: Molecules need Threshold Energy and Correct Orientation.
      `;
    } else if (activeTopicId === 'electrochemistry') {
      return `
        Topic: Electrochemistry (Galvanic vs Electrolytic)
        State: External Voltage ${externalVoltage}V. Cell Standard Potential is 1.1V.
        Mode: ${externalVoltage < 1.1 ? 'Galvanic (Spontaneous)' : (externalVoltage > 1.1 ? 'Electrolytic (Non-spontaneous)' : 'Equilibrium')}.
        Concept: Galvanic makes power (Zn->Cu). Electrolytic consumes power (Cu->Zn).
      `;
    } else if (activeTopicId === 'stereochemistry') {
      return `
        Topic: Stereoisomerism
        Mode: ${isomerConfig.type}. Subtype: ${isomerConfig.subType === 'A' ? 'Cis/Fac/Enantiomer 1' : 'Trans/Mer/Enantiomer 2'}.
        Mirror Mode: ${isomerConfig.showMirror ? 'ON' : 'OFF'}.
        Concept: 3D arrangement of atoms. Cis/Trans in Square Planar, Fac/Mer in Octahedral, Chirality in Optical.
      `;
    } else if (activeTopicId === 'dblock') {
      return `
        Topic: Transition Metals (Crystal Field Theory)
        Selected Ion: ${selectedIon}.
        Concept: d-orbital splitting, d-d transition leads to color, unpaired electrons lead to paramagnetism.
      `;
    } else if (activeTopicId === 'haloalkanes') {
      return `
        Topic: Haloalkanes (SN1 vs SN2)
        Substrate: ${haloConfig.substrate}. Mechanism: ${haloConfig.mechanism}.
        Concept: Primary favors SN2 (Backside attack, Inversion). Tertiary favors SN1 (Carbocation, Racemization). Tertiary blocks SN2 via Steric Hindrance.
      `;
    } else if (activeTopicId === 'polymers') {
      return `
        Topic: Polymers
        Mode: ${polyMode}.
        Concept: Ziegler-Natta catalysis grows chains. Conjugated polymers (Polyacetylene) conduct electricity via delocalized electrons.
      `;
    } else if (activeTopicId === 'solids_classification') {
      return `
        Topic: Classification of Solids
        Type: ${solidClassConfig.type}. Action: ${solidClassConfig.action}.
        Concept: Ionic are brittle/insulators (unless molten). Metallic are malleable/conductors.
      `;
    } else if (activeTopicId === 'unit_cells') {
      return `
        Topic: Unit Cells
        Type: ${unitCellConfig.type}. Slicer: ${unitCellConfig.slicer ? 'ON' : 'OFF'}.
        Concept: Atoms per cell: SCC=1, BCC=2, FCC=4.
      `;
    } else if (activeTopicId === 'packing') {
      return `
        Topic: Packing Efficiency
        Concept: FCC is 74% efficient. BCC is 68%. SCC is 52.4%.
      `;
    } else if (activeTopicId === 'defects') {
      return `
        Topic: Point Defects
        Mode: ${defectMode}.
        Concept: Schottky reduces density (Vacancy). Frenkel maintains density (Dislocation).
      `;
    }
    return "User is on the curriculum dashboard.";
  }, [activeTopicId, kineticsConfig, reactionCount, externalVoltage, isomerConfig, selectedIon, haloConfig, polyMode, solidClassConfig, unitCellConfig, defectMode]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-gray font-sans text-slate-900">

      {/* --- HEADER --- */}
      <header className="bg-brand-primary sticky top-0 z-20 shadow-md border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={goHome}>
            {/* Brand Logo */}
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-white transform hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Excellent Academy" className="w-full h-full object-cover" />
            </div>
            {/* Brand Text */}
            <div className="flex flex-col">
              <h1 className="text-xl font-display font-bold text-white tracking-wide leading-tight">Excellent Academy</h1>
              <p className="text-[10px] text-brand-secondary font-bold uppercase tracking-widest">Digital Learning Series</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/90">
            <button onClick={goHome} className="hover:text-brand-secondary transition-colors flex items-center gap-2">
              <Home size={16} /> Dashboard
            </button>
            <span className="opacity-20">|</span>
            <div className="flex items-center gap-2">
              <span className="bg-brand-dark px-3 py-1 rounded-full text-xs text-brand-secondary border border-brand-secondary/20 shadow-sm">
                Class 12 • {activeSubject}
              </span>
            </div>
          </nav>
        </div>
      </header>

      {/* --- BREADCRUMBS --- */}
      <Breadcrumbs
        screen={currentScreen}
        topicId={activeTopicId}
        onNavigate={() => {
          setCurrentScreen('DASHBOARD');
          setActiveTopicId(null);
        }}
        activeSubject={activeSubject}
        onNavigateSubject={(subject) => {
          setActiveSubject(subject);
          setCurrentScreen('DASHBOARD');
          setActiveTopicId(null);
        }}
      />

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto">

        {currentScreen === 'DASHBOARD' && (
          <Dashboard
            onSelectTopic={handleTopicSelect}
            activeSubject={activeSubject}
            setActiveSubject={setActiveSubject}
            images={topicImages}
            setImages={setTopicImages}
          />
        )}

        {/* ================== SOLID STATE (4 TOPICS) ================== */}

        {/* 1. CLASSIFICATION */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'solids_classification' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>

              {/* Instructions Banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-900">
                  <p className="font-bold mb-1">How to use this simulation:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Select a <strong>Solid Type</strong> (e.g., Ionic) to load the lattice structure.</li>
                    <li>Apply a <strong>Stress Test (Hammer)</strong> to see if it breaks (Brittle) or bends (Malleable).</li>
                    <li>Connect a <strong>Battery</strong> to test for electrical conductivity.</li>
                    <li>Apply <strong>Heat</strong> to observe melting points and bond strength.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Cuboid size={18} className="text-brand-secondary" /> Virtual Lab: Solids Properties
                  </h3>
                </div>
                <div className="relative h-[400px] bg-slate-100">
                  <SolidStateCanvas
                    topic="classification"
                    solidType={solidClassConfig.type}
                    action={solidClassConfig.action}
                  />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex flex-col gap-4">
                    {/* Type Selector */}
                    <div className="flex justify-center gap-2">
                      {['ionic', 'metallic', 'covalent', 'molecular'].map(t => (
                        <button
                          key={t}
                          onClick={() => setSolidClassConfig(p => ({ ...p, type: t as any, action: 'none' }))}
                          className={`px-4 py-2 rounded-lg text-sm font-bold uppercase ${solidClassConfig.type === t ? 'bg-brand-primary text-white shadow-lg' : 'bg-white border text-slate-500'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <hr className="border-slate-200" />
                    {/* Tools */}
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setSolidClassConfig(p => ({ ...p, action: 'hammer' }))} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold border-2 ${solidClassConfig.action === 'hammer' ? 'border-brand-primary text-brand-primary bg-brand-primary/10' : 'border-slate-300 text-slate-500'}`}>
                        Hammer (Stress)
                      </button>
                      <button onClick={() => setSolidClassConfig(p => ({ ...p, action: 'battery' }))} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold border-2 ${solidClassConfig.action === 'battery' ? 'border-brand-primary text-brand-primary bg-brand-primary/10' : 'border-slate-300 text-slate-500'}`}>
                        Battery (Conductivity)
                      </button>
                      <button onClick={() => setSolidClassConfig(p => ({ ...p, action: 'heat' }))} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold border-2 ${solidClassConfig.action === 'heat' ? 'border-brand-primary text-brand-primary bg-brand-primary/10' : 'border-slate-300 text-slate-500'}`}>
                        Burner (Heat)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="solids_classification" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. UNIT CELLS */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'unit_cells' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Grid size={18} className="text-brand-secondary" /> Unit Cell Visualizer
                  </h3>
                </div>
                <div className="relative h-[400px] bg-slate-100">
                  <SolidStateCanvas
                    topic="unit_cells"
                    cellType={unitCellConfig.type}
                    showSlicer={unitCellConfig.slicer}
                  />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex flex-col gap-4 items-center">
                    <div className="flex gap-4">
                      {['scc', 'bcc', 'fcc'].map(t => (
                        <button
                          key={t}
                          onClick={() => setUnitCellConfig(p => ({ ...p, type: t as any }))}
                          className={`px-6 py-2 rounded-lg font-bold uppercase ${unitCellConfig.type === t ? 'bg-brand-primary text-white shadow-lg' : 'bg-white border text-slate-500'}`}
                        >
                          {t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="slicer"
                        checked={unitCellConfig.slicer}
                        onChange={(e) => setUnitCellConfig(p => ({ ...p, slicer: e.target.checked }))}
                        className="w-5 h-5 accent-brand-primary"
                      />
                      <label htmlFor="slicer" className="font-bold text-slate-700 cursor-pointer">Activate Atom Slicer (Show Contributions)</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="unit_cells" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. PACKING */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'packing' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Percent size={18} className="text-brand-secondary" /> Packing Efficiency
                  </h3>
                </div>
                <div className="relative h-[400px] bg-slate-100">
                  <SolidStateCanvas
                    topic="packing"
                    cellType={unitCellConfig.type}
                  />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex gap-4 justify-center">
                    {['scc', 'bcc', 'fcc'].map(t => (
                      <button
                        key={t}
                        onClick={() => setUnitCellConfig(p => ({ ...p, type: t as any }))}
                        className={`px-6 py-2 rounded-lg font-bold uppercase ${unitCellConfig.type === t ? 'bg-brand-primary text-white shadow-lg' : 'bg-white border text-slate-500'}`}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="packing" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. DEFECTS */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'defects' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <AlertTriangle size={18} className="text-brand-secondary" /> Crystal Defect Lab
                  </h3>
                </div>
                <div className="relative h-[400px] bg-slate-100">
                  <SolidStateCanvas
                    topic="defects"
                    defectMode={defectMode}
                  />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex gap-4 justify-center">
                    <button onClick={() => setDefectMode('schottky')} className={`px-6 py-3 rounded-xl font-bold border-2 ${defectMode === 'schottky' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-300 text-slate-500'}`}>
                      Schottky (Vacancy)
                    </button>
                    <button onClick={() => setDefectMode('frenkel')} className={`px-6 py-3 rounded-xl font-bold border-2 ${defectMode === 'frenkel' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-300 text-slate-500'}`}>
                      Frenkel (Dislocation)
                    </button>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-4 italic">
                    Click on ions in the grid to manually create defects!
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="defects" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== KINETICS SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'kinetics' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Virtual Lab: Molecular Collisions
                  </h3>
                  <div className="text-xs font-mono text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Reactions: {reactionCount}
                  </div>
                </div>
                <div className="relative h-[400px] bg-slate-100">
                  <CollisionCanvas config={kineticsConfig} onReactionCountChange={setReactionCount} />
                  <button
                    onClick={() => {
                      setReactionCount(0);
                      setKineticsConfig(p => ({ ...p, moleculeCount: p.moleculeCount === 25 ? 26 : 25 }));
                      setTimeout(() => setKineticsConfig(p => ({ ...p, moleculeCount: 25 })), 50);
                    }}
                    className="absolute bottom-4 right-4 bg-white hover:bg-slate-50 text-brand-primary p-2 rounded-full shadow-lg border border-slate-200 transition-transform active:scale-95"
                    title="Reset Simulation"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                        <span>Temperature (T)</span> <span className="text-brand-primary">{kineticsConfig.temperature} K</span>
                      </label>
                      <input
                        type="range" min="100" max="600" step="10"
                        value={kineticsConfig.temperature}
                        onChange={(e) => setKineticsConfig(p => ({ ...p, temperature: Number(e.target.value) }))}
                        className="w-full accent-brand-primary h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                        <span>Activation Energy (Ea)</span> <span className="text-brand-primary">{kineticsConfig.activationEnergy}</span>
                      </label>
                      <input
                        type="range" min="50" max="250" step="10"
                        value={kineticsConfig.activationEnergy}
                        onChange={(e) => setKineticsConfig(p => ({ ...p, activationEnergy: Number(e.target.value) }))}
                        className="w-full accent-brand-secondary h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                        <span>Steric Factor (P)</span> <span className="text-brand-primary">{kineticsConfig.stericFactor}</span>
                      </label>
                      <input
                        type="range" min="0.1" max="1" step="0.1"
                        value={kineticsConfig.stericFactor}
                        onChange={(e) => setKineticsConfig(p => ({ ...p, stericFactor: Number(e.target.value) }))}
                        className="w-full accent-green-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <MaxwellBoltzmannChart temperature={kineticsConfig.temperature} activationEnergy={kineticsConfig.activationEnergy} />
                <PotentialEnergyDiagram hasReactionOccurred={reactionCount > 0} />
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="kinetics" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== ELECTROCHEMISTRY SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'electrochemistry' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Battery size={18} className="text-brand-secondary" /> Virtual Lab: Electrochemical Cells
                  </h3>
                  <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${externalVoltage < 1.1 ? 'bg-green-100 text-green-700' : (externalVoltage > 1.1 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700')}`}>
                    {externalVoltage < 1.1 ? 'GALVANIC MODE' : (externalVoltage > 1.1 ? 'ELECTROLYTIC MODE' : 'EQUILIBRIUM')}
                  </div>
                </div>
                <div className="relative h-[450px] bg-white">
                  <ElectrochemistryCanvas externalVoltage={externalVoltage} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="font-bold text-brand-primary flex flex-col">
                        <span className="text-xs uppercase text-slate-500 mb-1">External Voltage Source (E<sub>ext</sub>)</span>
                        <span className="text-2xl font-mono">{externalVoltage.toFixed(2)} V</span>
                      </label>
                      <div className="text-right text-xs text-slate-500">
                        Standard Cell Potential: <strong>1.10 V</strong>
                      </div>
                    </div>
                    <div className="relative h-12 flex items-center">
                      <div className="absolute w-full h-4 rounded-full overflow-hidden flex opacity-30">
                        <div className="w-[44%] bg-green-500"></div> {/* 0 to 1.1 */}
                        <div className="w-[1%] bg-slate-800"></div> {/* 1.1 */}
                        <div className="w-[55%] bg-red-500"></div> {/* 1.1 to 2.5 */}
                      </div>
                      <input
                        type="range" min="0" max="2.5" step="0.05"
                        value={externalVoltage}
                        onChange={(e) => setExternalVoltage(Number(e.target.value))}
                        className="relative w-full accent-brand-primary h-4 bg-transparent appearance-none cursor-pointer z-10"
                      />
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>0V (Spontaneous)</span>
                      <span className="text-brand-dark">1.1V (Stop)</span>
                      <span>2.5V (Driven)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="electrochemistry" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== STEREOCHEMISTRY SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'stereochemistry' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Box size={18} className="text-brand-secondary" /> 3D Molecular Geometry
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded flex items-center gap-2">
                    <span className="animate-pulse w-2 h-2 rounded-full bg-green-500"></span> Live 3D Render
                  </div>
                </div>
                <div className="relative h-[450px] bg-slate-900">
                  <StereochemistryCanvas
                    isomerType={isomerConfig.type}
                    subType={isomerConfig.subType}
                    showMirror={isomerConfig.showMirror}
                  />
                  <div className="absolute top-4 left-4 text-white/50 text-xs pointer-events-none">
                    Drag to Rotate
                  </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex p-1 bg-slate-200 rounded-lg mb-6 max-w-xl mx-auto">
                    <button
                      onClick={() => setIsomerConfig({ type: 'cis-trans-sq', subType: 'A', showMirror: false })}
                      className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isomerConfig.type === 'cis-trans-sq' ? 'bg-white shadow text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Square Planar
                    </button>
                    <button
                      onClick={() => setIsomerConfig({ type: 'fac-mer', subType: 'A', showMirror: false })}
                      className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isomerConfig.type === 'fac-mer' ? 'bg-white shadow text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Octahedral
                    </button>
                    <button
                      onClick={() => setIsomerConfig({ type: 'optical', subType: 'A', showMirror: true })}
                      className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isomerConfig.type === 'optical' ? 'bg-white shadow text-brand-primary' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Optical (Chiral)
                    </button>
                  </div>
                  <div className="flex justify-center gap-8 items-center">
                    {isomerConfig.type === 'cis-trans-sq' && (
                      <div className="flex gap-4">
                        <button onClick={() => setIsomerConfig(p => ({ ...p, subType: 'A' }))} className={`px-4 py-2 rounded-lg font-bold border-2 ${isomerConfig.subType === 'A' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-300 text-slate-500'}`}>Cis Isomer</button>
                        <button onClick={() => setIsomerConfig(p => ({ ...p, subType: 'B' }))} className={`px-4 py-2 rounded-lg font-bold border-2 ${isomerConfig.subType === 'B' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-300 text-slate-500'}`}>Trans Isomer</button>
                      </div>
                    )}
                    {isomerConfig.type === 'fac-mer' && (
                      <div className="flex gap-4">
                        <button onClick={() => setIsomerConfig(p => ({ ...p, subType: 'A' }))} className={`px-4 py-2 rounded-lg font-bold border-2 ${isomerConfig.subType === 'A' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-300 text-slate-500'}`}>Facial (fac)</button>
                        <button onClick={() => setIsomerConfig(p => ({ ...p, subType: 'B' }))} className={`px-4 py-2 rounded-lg font-bold border-2 ${isomerConfig.subType === 'B' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-300 text-slate-500'}`}>Meridional (mer)</button>
                      </div>
                    )}
                    {isomerConfig.type === 'optical' && (
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={isomerConfig.showMirror} onChange={(e) => setIsomerConfig(p => ({ ...p, showMirror: e.target.checked }))} className="w-5 h-5 accent-brand-primary" />
                          <span className="font-bold text-slate-700">Mirror Test Mode</span>
                        </label>
                        {!isomerConfig.showMirror && (
                          <button onClick={() => setIsomerConfig(p => ({ ...p, subType: p.subType === 'A' ? 'B' : 'A' }))} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">
                            Switch Enantiomer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="stereochemistry" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== D-BLOCK SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'dblock' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Magnet size={18} className="text-brand-secondary" /> Crystal Field Theory Lab
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Octahedral Field
                  </div>
                </div>
                <div className="relative h-[450px] bg-white">
                  <DBlockCanvas metalIon={selectedIon} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="max-w-xl mx-auto">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2 text-center">Select Metal Ion (Aqueous Complex)</label>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Sc3+', 'Ti3+', 'V3+', 'Cr3+', 'Mn2+', 'Fe2+', 'Co2+', 'Ni2+', 'Cu2+', 'Zn2+'].map(ion => (
                        <button
                          key={ion}
                          onClick={() => setSelectedIon(ion)}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border-2 ${selectedIon === ion ? 'border-brand-primary bg-brand-primary text-white shadow-lg scale-105' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50'}`}
                        >
                          {ion}
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-4 italic">
                      Selecting different ions changes the number of d-electrons. Note how the color and magnetism change.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="dblock" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== HALOALKANES SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'haloalkanes' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <FlaskConical size={18} className="text-brand-secondary" /> Organic Mechanism Simulator
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    {haloConfig.mechanism} Reaction
                  </div>
                </div>
                <div className="relative h-[400px] bg-white">
                  <HaloalkaneCanvas mechanism={haloConfig.mechanism} substrate={haloConfig.substrate} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Substrate Type</label>
                      <div className="flex gap-2">
                        <button onClick={() => setHaloConfig(p => ({ ...p, substrate: 'primary' }))} className={`flex-1 py-2 px-3 rounded text-sm font-bold border-2 ${haloConfig.substrate === 'primary' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-200 text-slate-500'}`}>Primary (1°)</button>
                        <button onClick={() => setHaloConfig(p => ({ ...p, substrate: 'tertiary' }))} className={`flex-1 py-2 px-3 rounded text-sm font-bold border-2 ${haloConfig.substrate === 'tertiary' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-200 text-slate-500'}`}>Tertiary (3°)</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Mechanism</label>
                      <div className="flex gap-2">
                        <button onClick={() => setHaloConfig(p => ({ ...p, mechanism: 'SN2' }))} className={`flex-1 py-2 px-3 rounded text-sm font-bold border-2 ${haloConfig.mechanism === 'SN2' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-200 text-slate-500'}`}>SN2</button>
                        <button onClick={() => setHaloConfig(p => ({ ...p, mechanism: 'SN1' }))} className={`flex-1 py-2 px-3 rounded text-sm font-bold border-2 ${haloConfig.mechanism === 'SN1' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-200 text-slate-500'}`}>SN1</button>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-4 italic">
                    Tip: Try combining Tertiary Substrate with SN2 to see Steric Hindrance!
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="haloalkanes" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== POLYMERS SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'polymers' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Layers size={18} className="text-brand-secondary" /> Polymer Labs
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    {polyMode === 'synthesis' ? 'Ziegler-Natta Catalysis' : 'Conducting Polymers'}
                  </div>
                </div>
                <div className="relative h-[450px] bg-white">
                  <PolymerCanvas mode={polyMode} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setPolyMode('synthesis')}
                      className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${polyMode === 'synthesis' ? 'border-brand-primary bg-white text-brand-primary shadow-lg' : 'border-slate-200 text-slate-400 hover:bg-white'}`}
                    >
                      <span className="text-sm">Part I</span>
                      <span>Synthesis (Catalysis)</span>
                    </button>
                    <button
                      onClick={() => setPolyMode('conductivity')}
                      className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${polyMode === 'conductivity' ? 'border-brand-primary bg-white text-brand-primary shadow-lg' : 'border-slate-200 text-slate-400 hover:bg-white'}`}
                    >
                      <span className="text-sm">Part II</span>
                      <span>Conductivity</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="polymers" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== GENETICS SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'genetics_assortment' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Grid size={18} className="text-brand-secondary" /> Interactive Punnett Square
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Unit VII: Genetics
                  </div>
                </div>
                <div className="relative h-[520px] bg-slate-100">
                  <GeneticsCanvas mode={solidClassConfig.type === 'ionic' ? 'punnett' : 'meiosis'} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setSolidClassConfig(p => ({ ...p, type: 'ionic' }))}
                      className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${solidClassConfig.type === 'ionic' ? 'border-brand-primary bg-white text-brand-primary shadow-lg' : 'border-slate-200 text-slate-400 hover:bg-white'}`}
                    >
                      <span className="text-sm">Calculator</span>
                      <span>Punnett Square (9:3:3:1)</span>
                    </button>
                    <button
                      onClick={() => setSolidClassConfig(p => ({ ...p, type: 'metallic' }))}
                      className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${solidClassConfig.type === 'metallic' ? 'border-brand-primary bg-white text-brand-primary shadow-lg' : 'border-slate-200 text-slate-400 hover:bg-white'}`}
                    >
                      <span className="text-sm">Mechanism</span>
                      <span>Meiosis Animation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="genetics_assortment" />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ================== LINKAGE SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'genetics_linkage' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Chromosomal Crossover Lab
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Unit VII: Genetics
                  </div>
                </div>
                <div className="relative h-[550px] bg-slate-100">
                  {/* Using a local state for mode switching would be better, but for now reuse solidClassConfig hack or just create a new state variable quickly? 
                      Cleaner to add a new state. Let's add 'linkageMode' to App state. 
                      Wait, I haven't added 'linkageMode' to App.tsx top level state yet. 
                      I will use the 'polyMode' state variable as a temporary proxy like before? NO, that's bad practice.
                      I will add 'linkageMode' state in the next edit or now?
                      I'll add the state variable definition at the top of the file in the same tool call if possible, or just default to 'crossover' and use a local toggle?
                      Since I can't edit non-contiguous lines easily without multi-replace, I'll use a local state wrapper or just misuse an existing one?
                      Actually, look at 'App.tsx'. I can use 'solidClassConfig' type again? No, that's messy.
                      Let's just use 'polyMode' (synthesis/conductivity) mapping to (crossover/mapping) temporarily?
                      'synthesis' -> 'crossover'
                      'conductivity' -> 'mapping'
                      Yes, that works without breaking 800 line limit.
                  */}
                  <LinkageCanvas mode={polyMode === 'synthesis' ? 'crossover' : 'mapping'} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setPolyMode('synthesis')}
                      className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${polyMode === 'synthesis' ? 'border-brand-primary bg-white text-brand-primary shadow-lg' : 'border-slate-200 text-slate-400 hover:bg-white'}`}
                    >
                      <span className="text-sm">Animation</span>
                      <span>Crossing Over</span>
                    </button>
                    <button
                      onClick={() => setPolyMode('conductivity')}
                      className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${polyMode === 'conductivity' ? 'border-brand-primary bg-white text-brand-primary shadow-lg' : 'border-slate-200 text-slate-400 hover:bg-white'}`}
                    >
                      <span className="text-sm">Interactive Map</span>
                      <span>Distance vs Recombination</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="genetics_linkage" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== TRANSCRIPTION SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'transcription' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Transcription Simulation
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Molecular Biology
                  </div>
                </div>
                <div className="relative h-[500px] bg-slate-100">
                  <TranscriptionCanvas mode={polyMode === 'synthesis' ? 'prokaryote' : 'eukaryote'} />
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center gap-4">
                  <button onClick={() => setPolyMode('synthesis')} className={`px-4 py-2 rounded-lg font-bold ${polyMode === 'synthesis' ? 'bg-brand-primary text-white' : 'bg-white text-slate-500 shadow-sm border'}`}>Prokaryote</button>
                  <button onClick={() => setPolyMode('conductivity')} className={`px-4 py-2 rounded-lg font-bold ${polyMode === 'conductivity' ? 'bg-brand-primary text-white' : 'bg-white text-slate-500 shadow-sm border'}`}>Eukaryote</button>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="transcription" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== LAC OPERON SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'lac_operon' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Lac Operon Simulator
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Gene Regulation
                  </div>
                </div>
                <div className="relative h-[550px] bg-slate-100">
                  <LacOperonCanvas />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="lac_operon" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== REPLICATION FORK SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'replication_fork' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Replication Fork Simulator
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    DNA Replication
                  </div>
                </div>
                <div className="relative h-[550px] bg-slate-900">
                  <ReplicationCanvas />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="replication_fork" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== PHYSICS SIMULATIONS ================== */}

        {/* 1. EMI */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'emi' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Magnet size={18} className="text-brand-secondary" /> AC Generator
                  </h3>
                </div>
                <div className="relative h-[400px] bg-slate-900">
                  <ElectromagneticInductionCanvas angularSpeed={emiSpeed} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Angular Speed (ω)</label>
                  <input
                    type="range" min="1" max="10" step="0.5"
                    value={emiSpeed}
                    onChange={(e) => setEmiSpeed(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="emi" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. AC */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'ac' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Transformer Lab
                  </h3>
                </div>
                <div className="relative h-[400px] bg-white">
                  <AlternatingCurrentCanvas primaryTurns={transformerConfig.np} secondaryTurns={transformerConfig.ns} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Primary Turns (Np): {transformerConfig.np}</label>
                    <input
                      type="range" min="50" max="300" step="10"
                      value={transformerConfig.np}
                      onChange={(e) => setTransformerConfig(p => ({ ...p, np: Number(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Secondary Turns (Ns): {transformerConfig.ns}</label>
                    <input
                      type="range" min="50" max="300" step="10"
                      value={transformerConfig.ns}
                      onChange={(e) => setTransformerConfig(p => ({ ...p, ns: Number(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="ac" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. EM WAVES */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'em_waves' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> EM Wave Propagation
                  </h3>
                </div>
                <div className="relative h-[400px] bg-slate-50">
                  <EMWavesCanvas />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="em_waves" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. RAY OPTICS */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'ray_optics' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Layers size={18} className="text-brand-secondary" /> Optics Workbench
                  </h3>
                </div>
                <div className="relative h-[400px] bg-white">
                  <RayOpticsCanvas device={opticsDevice} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-center gap-4">
                  {['convex_lens', 'concave_lens', 'prism'].map(d => (
                    <button
                      key={d}
                      onClick={() => setOpticsDevice(d as any)}
                      className={`px-4 py-2 rounded-lg font-bold capitalize ${opticsDevice === d ? 'bg-brand-primary text-white shadow' : 'bg-white border text-slate-500'}`}
                    >
                      {d.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="ray_optics" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. WAVE OPTICS */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'wave_optics' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Layers size={18} className="text-brand-secondary" /> Wave Optics (YDSE)
                  </h3>
                </div>
                <div className="relative h-[400px] bg-slate-900">
                  <WaveOpticsCanvas />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="wave_optics" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. PHOTOELECTRIC EFFECT */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'dual_nature' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Photoelectric Effect
                  </h3>
                </div>
                <div className="relative h-[400px] bg-slate-900">
                  <PhotoelectricCanvas frequency={photoelectricConfig.frequency} intensity={photoelectricConfig.intensity} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Frequency (ν)</label>
                    <input
                      type="range" min="1" max="10" step="0.5"
                      value={photoelectricConfig.frequency}
                      onChange={(e) => setPhotoelectricConfig(p => ({ ...p, frequency: Number(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Intensity</label>
                    <input
                      type="range" min="1" max="10"
                      value={photoelectricConfig.intensity}
                      onChange={(e) => setPhotoelectricConfig(p => ({ ...p, intensity: Number(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="dual_nature" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. ATOMS */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'atoms' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Box size={18} className="text-brand-secondary" /> Alpha Scattering (Rutherford)
                  </h3>
                </div>
                <div className="relative h-[700px] bg-slate-900">
                  <AtomsCanvas />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <TextbookContent topicId="atoms" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. SEMICONDUCTORS */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'semiconductors' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Grid size={18} className="text-brand-secondary" /> P-N Junction
                  </h3>
                </div>
                <div className="relative h-[400px] bg-slate-50">
                  <SemiconductorCanvas />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="semiconductors" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== ASSISTANT ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'rnai' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> RNA Interference Game
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Cell Defense
                  </div>
                </div>
                <div className="relative h-[550px] bg-slate-900">
                  <RNAiCanvas />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="rnai" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== Ti PLASMID SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'ti_plasmid' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Agrobacterium Transformation
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Biotechnology
                  </div>
                </div>
                <div className="relative h-[550px] bg-emerald-50">
                  <TiPlasmidCanvas />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topicId="ti_plasmid" />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* AI Assistant */}
      <Assistant contextData={aiContext} />

      {/* --- FOOTER --- */}
      <footer className="bg-brand-dark text-slate-400 py-8 mt-12 border-t border-slate-800">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">
            &copy; 2024 Excellent Academy. All Rights Reserved.
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;