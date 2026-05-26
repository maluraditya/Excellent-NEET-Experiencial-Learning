
import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Activity, Zap, PlayCircle, Loader2, Box, Magnet, FlaskConical, Layers, Cuboid, Grid, Percent, AlertTriangle, Atom, Microscope, Wind, Sparkles, Search, SlidersHorizontal, ArrowUpAZ, X } from 'lucide-react';
import { Subject, Topic } from '../types';

interface DashboardProps {
  onSelectTopic: (topicId: string) => void;
  activeSubject: Subject;
  setActiveSubject: (subject: Subject) => void;
  images: Record<string, string>;
  setImages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  topics: Topic[];
}

const CARD_SUMMARIES: Record<string, string> = {
  'mechanical-properties-solids': 'Explore elasticity, stress, strain, and Young modulus through interactive tensile testing.',
  'stokes-law': 'See viscous drag balance gravity and produce terminal velocity in different liquids.',
  'fluid-dynamics': 'Use flow tubes and wind tunnels to connect continuity with Bernoulli principle.',
  'pascals-law': 'Learn pressure transmission, force multiplication, and hydraulic braking through Pascal law.',
  'surface-tension': 'Study molecular forces, contact angle, wetting, and capillary rise in liquids.',
  'carnot-engine': 'Build a Carnot cycle and understand maximum heat-engine efficiency.',
  'zeroth-law': 'Test thermal equilibrium and see why temperature becomes a measurable property.',
  'thermodynamic-processes': 'Compare gas processes and relate heat, work, and internal energy.',
  'thermal-expansion-calorimetry': 'Study expansion, water anomaly, phase change, and calorimetry with heat changes.',
  'heat-transfer-blackbody-radiation': 'Compare conduction, convection, radiation, Wien shift, and blackbody power.',
  'kinetic-theory': 'Connect molecular collisions with ideal-gas pressure using temperature, volume, and count.',
  'mean-free-path': 'Track gas molecules and see how density and size change collision paths.',
  'equipartition': 'Compare gas degrees of freedom and equal energy sharing across molecular motions.',
  'shm-spring': 'Explore spring SHM, phase relations, energy exchange, and period dependence.',
  'simple-pendulum': 'Measure pendulum motion and verify how length and gravity set the period.',
  'wave-motion': 'Compare transverse and longitudinal waves while energy travels without matter transport.',
  'standing-waves': 'Drive waves to form nodes, antinodes, harmonics, and resonance patterns.',
  'hydrogen-spectrum': 'Fire photons at hydrogen and connect electron transitions with spectral lines.',
  'atomic-orbitals': 'Visualize orbital shapes, probability clouds, and radial and angular nodes.',
  'vsepr-theory': 'Build molecules and see how electron-pair repulsion decides molecular geometry.',
  'sigma-pi-bonds': 'Compare head-on and sideways orbital overlap to understand sigma and pi bonds.',
  'isothermal-work': 'Compare reversible and irreversible isothermal expansion using piston and PV graphs.',
  'extensive-intensive-properties': 'Divide a system to identify size-dependent and size-independent thermodynamic properties.',
  'buffer-solutions': 'Build buffers and test how they resist pH changes until capacity breaks.',
  'le-chatelier-equilibrium': 'Change concentration and watch equilibrium shift until Qc matches Kc.',
  'qualitative-analysis-organic': 'Use sodium fusion to detect nitrogen, sulphur, and halogens in organics.',
  'quantitative-analysis-organic': 'Use combustion analysis data to estimate elements and derive empirical formulas.',
  'ethane-conformations': 'Rotate ethane and compare staggered and eclipsed forms with energy changes.',
  'stereoisomerism-geometrical': 'Build cis-trans isomers and compare dipoles, rotation limits, and properties.',
  'binomial-nomenclature': 'Learn scientific naming and organize organisms through taxonomic hierarchy.',
  'five-kingdom-classification': 'Classify organisms by Whittaker criteria and compare kingdom-level characteristics.',
  'algae': 'Compare major algae groups by pigments, food storage, structure, and reproduction.',
  'bryophytes-pteridophytes': 'Compare mosses and ferns through size, vascular tissue, and dominant life stage.',
  'gymnosperms-angiosperms': 'Compare naked and enclosed seeds, pollen tubes, and double fertilisation.',
  'animal-kingdom-non-chordates': 'Study sponge canal flow and cnidarian polyp-medusa life cycles.',
  'morphology-flowering-plants': 'Compare roots, phyllotaxy, tendrils, spines, and plant survival modifications.',
  'anatomy-flowering-plants': 'Explore tissue systems, cambium activity, secondary growth, and wood formation.',
  'animal-tissues': 'Compare epithelial protection, cartilage flexibility, and bone rigidity under load.',
  'chordata': 'Identify chordate features and compare vertebral columns and heart chambers.',
  'frogs': 'Explore frog organs, respiration, digestion, circulation, and reproductive systems.',
  'cell-membrane-transport': 'Test membrane structure and transport by diffusion, channels, and active pumps.',
  'biomolecules': 'Build amino acids, lipids, and polymers to connect monomers with biomolecules.',
  'enzymes': 'Explore active sites, induced fit, activation energy, inhibitors, and saturation.',
  'cell-cycle-regulation': 'Follow G1, S, G2, M, G0, checkpoints, repair, and division control.',
  'mitosis-vs-meiosis-stages': 'Compare mitosis and meiosis through alignment, crossing over, and chromosome number.',
  'photosynthesis-light-reaction': 'Trace light reactions, water splitting, electron transport, ATP, and NADPH formation.',
  'calvin-cycle-c3-c4-pathways': 'Compare carbon fixation pathways and how C4 plants reduce photorespiration.',
  'respiration-in-plants': 'Track glucose breakdown through glycolysis, fermentation, aerobic respiration, and ATP yield.',
  'emi': 'Rotate a coil in a magnetic field to see changing flux induce EMF.',
  'ac': 'Adjust transformer turns to connect voltage, current, and power conservation.',
  'em_waves': 'Visualize electric and magnetic fields forming transverse electromagnetic waves.',
  'ray_optics': 'Trace rays through lenses, prisms, microscopes, and telescopes.',
  'wave_optics': 'Simulate interference and diffraction to understand the wave nature of light.',
  'dual_nature': 'Vary photon frequency and observe electron emission from metals.',
  'atoms': 'Recreate alpha scattering and link deflection to nuclear structure.',
  'semiconductors': 'Join p-type and n-type regions to form depletion layer and barrier potential.',
  'electrochemistry': 'Compare galvanic and electrolytic cells through ion flow and electron direction.',
  'kinetics': 'Connect reaction rate with collision energy, orientation, temperature, and activation barrier.',
  'dblock': 'Link d-electron configuration with colour, magnetism, and crystal field splitting.',
  'polymers': 'Explore chain-growth catalysis and conductivity in conjugated organic polymers.',
  'stereochemistry': 'Compare coordination isomers and test chirality with mirror images.',
  'haloalkanes': 'Compare SN1 and SN2 paths through inversion, intermediates, and attack geometry.',
  'angiosperms-double-fertilisation-seed-development': 'Follow pollen tube growth, double fertilisation, endosperm, and seed development.',
  'gametogenesis-hormonal-regulation': 'Track FSH and LH control of sperm formation, follicles, and ovulation.',
  'pregnancy-hormonal-control-rh-incompatibility': 'Study pregnancy hormones, placental separation, Rh exposure, and anti-Rh prevention.'
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectTopic, activeSubject, setActiveSubject, images, setImages, topics }) => {
  // Using cover images from data.ts, no dynamic generation needed
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOption, setSortOption] = useState('default');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTool, setActiveTool] = useState<'filter' | 'sort' | null>(null);

  useEffect(() => {
    setSearchQuery('');
    setUnitFilter('all');
    setTypeFilter('all');
    setSortOption('default');
    setShowSuggestions(false);
    setActiveTool(null);
  }, [activeSubject, topics]);

  const topicData = useMemo(() => {
    return topics
      .filter(topic => topic.subject === activeSubject)
      .map((topic, index) => ({
        topic,
        topicName: topic.title,
        unitNumber: topic.unit,
        type: topic.branch,
        originalIndex: index
      }));
  }, [activeSubject, topics]);

  const getUnitSortValue = (unit: string) => {
    const match = unit.match(/\d+/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
  };

  const unitOptions = useMemo(() => {
    return Array.from(new Set<string>(topicData.map(item => item.unitNumber)))
      .sort((a, b) => getUnitSortValue(a) - getUnitSortValue(b) || a.localeCompare(b));
  }, [topicData]);

  const typeOptions = useMemo(() => {
    return Array.from(new Set<string>(topicData.map(item => item.type))).sort((a, b) => a.localeCompare(b));
  }, [topicData]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!normalizedSearch) return [];
    return topicData
      .filter(item => item.topicName.toLowerCase().includes(normalizedSearch))
      .slice(0, 6);
  }, [normalizedSearch, topicData]);

  const filteredTopics = useMemo(() => {
    const filtered = topicData.filter(item => {
      const matchesSearch = !normalizedSearch || item.topicName.toLowerCase().includes(normalizedSearch);
      const matchesUnit = unitFilter === 'all' || item.unitNumber === unitFilter;
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesSearch && matchesUnit && matchesType;
    });

    if (sortOption === 'az') {
      filtered.sort((a, b) => a.topicName.localeCompare(b.topicName));
    } else if (sortOption === 'unit') {
      filtered.sort((a, b) => getUnitSortValue(a.unitNumber) - getUnitSortValue(b.unitNumber) || a.topicName.localeCompare(b.topicName));
    } else {
      filtered.sort((a, b) => a.originalIndex - b.originalIndex);
    }

    return filtered.map(item => item.topic);
  }, [normalizedSearch, sortOption, topicData, typeFilter, unitFilter]);

  const getCardDescription = (topic: Topic) => CARD_SUMMARIES[topic.id] ?? topic.description;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'activity': return <Activity size={80} className="text-brand-primary/20" />;
      case 'zap': return <Zap size={80} className="text-brand-secondary/80" />;
      case 'box': return <Box size={80} className="text-brand-primary/20" />;
      case 'magnet': return <Magnet size={80} className="text-brand-secondary/80" />;
      case 'flask': return <FlaskConical size={80} className="text-brand-primary/20" />;
      case 'layers': return <Layers size={80} className="text-brand-secondary/80" />;
      case 'cuboid': return <Cuboid size={80} className="text-brand-primary/20" />;
      case 'grid': return <Grid size={80} className="text-brand-secondary/80" />;
      case 'percent': return <Percent size={80} className="text-brand-primary/20" />;
      case 'alert': return <AlertTriangle size={80} className="text-brand-secondary/80" />;
      default: return <Activity size={80} className="text-brand-primary/20" />;
    }
  };

  const SubjectTab = ({ subject, icon: Icon, color }: { subject: Subject, icon: any, color: string }) => (
    <button
      onClick={() => setActiveSubject(subject)}
      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${activeSubject === subject
        ? `bg-white border-${color} shadow-xl scale-105`
        : 'bg-white/50 border-transparent hover:border-slate-300 opacity-60 hover:opacity-100'
        }`}
    >
      <div className={`p-4 rounded-xl ${activeSubject === subject ? `bg-${color}/10 text-${color}` : 'bg-slate-100 text-slate-400'}`}>
        <Icon size={32} />
      </div>
      <span className={`font-display font-bold text-sm uppercase tracking-widest ${activeSubject === subject ? 'text-slate-900' : 'text-slate-500'}`}>
        {subject}
      </span>
      {activeSubject === subject && (
        <div className={`h-1.5 w-8 rounded-full bg-${color}`}></div>
      )}
    </button>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-3 sm:p-4 md:p-8 lg:p-12 relative min-h-screen overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-brand-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-14 space-y-4 sm:space-y-5 pt-2 sm:pt-6 md:pt-8" id="tour-welcome">
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-slate-900 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
          Don’t Just Study. <br />
          <span className="bg-gradient-to-r from-brand-primary via-indigo-500 to-brand-secondary bg-clip-text text-transparent drop-shadow-sm">
            Experience It.
          </span>
        </h2>
        <p className="text-sm sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-sans leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 px-2">
          Explore every NCERT concept through immersive simulations that make learning intuitive, clear, and unforgettable.
        </p>
      </div>

      {/* Subject Category Layer - Glassmorphism */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200" id="tour-subject-tabs">
        <button
          onClick={() => setActiveSubject('Physics')}
          className={`group relative flex flex-col items-center gap-2 sm:gap-3 px-5 sm:px-8 md:px-10 py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-[2rem] transition-all duration-500 overflow-hidden ${activeSubject === 'Physics'
            ? 'bg-blue-500 text-white shadow-[0_20px_40px_-15px_rgba(59,130,246,0.5)] scale-105 border border-blue-400'
            : 'bg-white/40 backdrop-blur-xl border border-white/60 text-slate-600 hover:bg-white/80 hover:shadow-xl hover:-translate-y-1'
            }`}
        >
          {activeSubject === 'Physics' && <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />}
          <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${activeSubject === 'Physics' ? 'bg-white/20 shadow-inner' : 'bg-slate-100/80 group-hover:bg-blue-100 group-hover:text-blue-500 group-hover:scale-110'}`}>
            <Wind size={28} className="sm:hidden" strokeWidth={activeSubject === 'Physics' ? 2.5 : 2} />
            <Wind size={36} className="hidden sm:block" strokeWidth={activeSubject === 'Physics' ? 2.5 : 2} />
          </div>
          <span className="font-display font-bold text-sm sm:text-lg tracking-wide z-10">Physics</span>
        </button>

        <button
          onClick={() => setActiveSubject('Chemistry')}
          className={`group relative flex flex-col items-center gap-2 sm:gap-3 px-5 sm:px-8 md:px-10 py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-[2rem] transition-all duration-500 overflow-hidden ${activeSubject === 'Chemistry'
            ? 'bg-rose-500 text-white shadow-[0_20px_40px_-15px_rgba(244,63,94,0.5)] scale-105 border border-rose-400'
            : 'bg-white/40 backdrop-blur-xl border border-white/60 text-slate-600 hover:bg-white/80 hover:shadow-xl hover:-translate-y-1'
            }`}
        >
          {activeSubject === 'Chemistry' && <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />}
          <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${activeSubject === 'Chemistry' ? 'bg-white/20 shadow-inner' : 'bg-slate-100/80 group-hover:bg-rose-100 group-hover:text-rose-500 group-hover:scale-110'}`}>
            <FlaskConical size={28} className="sm:hidden" strokeWidth={activeSubject === 'Chemistry' ? 2.5 : 2} />
            <FlaskConical size={36} className="hidden sm:block" strokeWidth={activeSubject === 'Chemistry' ? 2.5 : 2} />
          </div>
          <span className="font-display font-bold text-sm sm:text-lg tracking-wide z-10">Chemistry</span>
        </button>

        <button
          onClick={() => setActiveSubject('Biology')}
          className={`group relative flex flex-col items-center gap-2 sm:gap-3 px-5 sm:px-8 md:px-10 py-4 sm:py-6 md:py-8 rounded-2xl sm:rounded-[2rem] transition-all duration-500 overflow-hidden ${activeSubject === 'Biology'
            ? 'bg-emerald-500 text-white shadow-[0_20px_40px_-15px_rgba(16,185,129,0.5)] scale-105 border border-emerald-400'
            : 'bg-white/40 backdrop-blur-xl border border-white/60 text-slate-600 hover:bg-white/80 hover:shadow-xl hover:-translate-y-1'
            }`}
        >
          {activeSubject === 'Biology' && <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />}
          <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${activeSubject === 'Biology' ? 'bg-white/20 shadow-inner' : 'bg-slate-100/80 group-hover:bg-emerald-100 group-hover:text-emerald-500 group-hover:scale-110'}`}>
            <Microscope size={28} className="sm:hidden" strokeWidth={activeSubject === 'Biology' ? 2.5 : 2} />
            <Microscope size={36} className="hidden sm:block" strokeWidth={activeSubject === 'Biology' ? 2.5 : 2} />
          </div>
          <span className="font-display font-bold text-sm sm:text-lg tracking-wide z-10">Biology</span>
        </button>
      </div>

      {/* Search, Filter, Sort Controls */}
      <div className="relative z-40 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="relative w-[190px] sm:w-[260px]">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                setActiveTool(null);
                setShowSuggestions(true);
              }}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
              placeholder={`Search ${activeSubject}`}
              className="h-9 w-full rounded-full border border-slate-200 bg-white/90 pl-9 pr-8 text-xs font-semibold text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10"
            />
            {searchQuery && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {suggestions.map(({ topic }) => (
                  <button
                    type="button"
                    key={topic.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSearchQuery(topic.title);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="min-w-0 truncate text-xs font-semibold text-slate-800">{topic.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSuggestions(false);
                setActiveTool(activeTool === 'filter' ? null : 'filter');
              }}
              className={`flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold uppercase tracking-widest shadow-sm transition-colors ${activeTool === 'filter'
                ? 'border-brand-primary bg-white text-brand-primary'
                : 'border-slate-200 bg-white/90 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
            >
              <SlidersHorizontal size={14} />
              Filter
            </button>

            {activeTool === 'filter' && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 grid w-[260px] gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl sm:w-[300px]">
                <label>
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Unit</span>
                  <select
                    value={unitFilter}
                    onChange={(event) => setUnitFilter(event.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10"
                  >
                    <option value="all">All Units</option>
                    {unitOptions.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</span>
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10"
                  >
                    <option value="all">All Types</option>
                    {typeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSuggestions(false);
                setActiveTool(activeTool === 'sort' ? null : 'sort');
              }}
              className={`flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-bold uppercase tracking-widest shadow-sm transition-colors ${activeTool === 'sort'
                ? 'border-brand-primary bg-white text-brand-primary'
                : 'border-slate-200 bg-white/90 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
            >
              <ArrowUpAZ size={14} />
              Sort
            </button>

            {activeTool === 'sort' && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                {[
                  { value: 'default', label: 'Default Order' },
                  { value: 'az', label: 'A to Z' },
                  { value: 'unit', label: 'Unit Number' }
                ].map(option => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => {
                      setSortOption(option.value);
                      setActiveTool(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors ${sortOption === option.value
                      ? 'bg-brand-primary/10 text-brand-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    {option.label}
                    {sortOption === option.value && <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {false && (
          <div className="relative ml-auto mt-5 max-w-xl">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
              placeholder={`Search ${activeSubject} topics`}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10"
            />
            {searchQuery && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {suggestions.map(({ topic, unitNumber, type }) => (
                  <button
                    type="button"
                    key={topic.id}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSearchQuery(topic.title);
                      setShowSuggestions(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{topic.title}</span>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">{unitNumber} • {type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Topics Grid */}
      {filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:gap-10" id="tour-topic-grid">
          {filteredTopics.map((topic, index) => {
            // Apply theme colors based on subject
            let themeColor = 'blue';
            if (topic.subject === 'Chemistry') themeColor = 'rose';
            if (topic.subject === 'Biology') themeColor = 'emerald';

            return (
              <div
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                className={`group relative flex h-[460px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] sm:h-[520px] sm:rounded-[2.5rem] md:h-[540px]`}
                style={{ animationFillMode: 'both', animationDelay: `${300 + index * 100}ms` }}
              >
                {/* Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 z-10 pointer-events-none transition-opacity duration-500 opacity-80 group-hover:opacity-100" />

                <div className="relative h-[188px] w-full shrink-0 overflow-hidden bg-slate-100 sm:h-[230px] md:h-[250px]">
                  {topic.coverImage || topic.thumbnailUrl || images[topic.id] ? (
                    <>
                      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                      <img
                        src={topic.coverImage || topic.thumbnailUrl || images[topic.id]}
                        alt={topic.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      {loadingState[topic.id] ? (
                        <div className="flex flex-col items-center text-slate-400 animate-pulse">
                          <Loader2 size={48} className="animate-spin mb-2" />
                          <span className="text-xs font-bold tracking-widest uppercase">Generating...</span>
                        </div>
                      ) : (
                        getIcon(topic.thumbnailIcon)
                      )}
                    </div>
                  )}

                  {/* Floating Tags */}
                  <div className={`absolute top-5 right-5 bg-${themeColor}-500/90 backdrop-blur-md px-4 py-1.5 rounded-xl text-[10px] font-bold text-white uppercase tracking-wider shadow-lg transform transition-transform duration-500 group-hover:scale-105 z-20`}>
                    {topic.branch}
                  </div>
                  <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold text-slate-700 uppercase tracking-wider shadow-lg border border-white/50 transform transition-transform duration-500 group-hover:-translate-y-1 z-20">
                    {topic.unit}
                  </div>
                </div>

                <div className="relative z-20 flex min-h-0 flex-1 flex-col bg-gradient-to-b from-transparent to-white p-5 sm:p-8">
                  <div className="min-h-0">
                    <h3 className="mb-2 line-clamp-2 min-h-[3.1rem] font-display text-xl font-bold leading-tight text-slate-800 transition-colors group-hover:text-slate-900 sm:mb-3 sm:min-h-[4rem] sm:text-2xl">
                      {topic.title}
                    </h3>
                    <p className="h-[4.5rem] overflow-hidden break-normal text-sm leading-relaxed text-slate-500 [hyphens:none] [overflow-wrap:normal] sm:h-[4.75rem]">
                      {getCardDescription(topic)}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100/50 pt-5 sm:pt-6">
                    <div className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors group-hover:text-slate-600">
                      <PlayCircle size={18} className={`text-${themeColor}-500`} />
                      <span className="truncate">{topic.youtubeVideoIds.length} Videos</span>
                    </div>
                    <button className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-300 hover:scale-105 active:scale-95 group-hover:bg-${themeColor}-500 group-hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] sm:px-5 sm:py-2.5 sm:text-sm`}>
                      Launch Lab <Sparkles size={14} className="opacity-70 group-hover:opacity-100" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : topicData.length > 0 ? (
        <div className="text-center py-24 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 relative z-10">
            <Search size={38} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-800 mb-3 relative z-10">No Topics Found</h3>
          <p className="text-base text-slate-500 max-w-md mx-auto relative z-10">Try a different topic name, unit, type, or sort option.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setUnitFilter('all');
              setTypeFilter('all');
              setSortOption('default');
            }}
            className="mt-7 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-primary hover:shadow-lg"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="text-center py-32 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
          <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-8 relative z-10">
            <Atom size={48} className="text-slate-300 animate-[spin_10s_linear_infinite]" />
          </div>
          <h3 className="text-3xl font-display font-bold text-slate-800 mb-3 relative z-10">Coming Soon</h3>
          <p className="text-lg text-slate-500 max-w-md mx-auto relative z-10">We are currently developing next-generation {activeSubject} simulations.</p>
          <button
            onClick={() => setActiveSubject('Chemistry')}
            className="mt-8 text-brand-primary font-bold hover:text-brand-secondary transition-colors relative z-10 px-6 py-3 rounded-full bg-white shadow-sm hover:shadow-md"
          >
            Explore Available Labs
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
