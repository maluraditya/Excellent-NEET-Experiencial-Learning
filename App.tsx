import React, { useState, useMemo, useEffect } from 'react';
import { Screen, SimulationConfig, Subject, Grade } from './types';
import { getTopics, ALL_TOPICS } from './data';
import Dashboard from './components/Dashboard';
import TextbookContent from './components/TextbookContent';
import TopicLayoutContainer from './components/TopicLayoutContainer';

// Grade 11 - Physics
import MechanicalPropertiesMaster from './components/grade-11/physics/MechanicalPropertiesMaster';
import FluidDynamicsLab from './components/grade-11/physics/FluidDynamicsLab';
import HydraulicBrakeLab from './components/grade-11/physics/HydraulicBrakeLab';
import CarnotEngineLab from './components/grade-11/physics/CarnotEngineLab';
import ThermodynamicProcessesLab from './components/grade-11/physics/ThermodynamicProcessesLab';
import HeatTransferBlackbodyLab from './components/grade-11/physics/HeatTransferBlackbodyLab';
import ThermalExpansionCalorimetryLab from './components/grade-11/physics/ThermalExpansionCalorimetryLab';
import KineticTheoryLab from './components/grade-11/physics/KineticTheoryLab';
import MeanFreePathLab from './components/grade-11/physics/MeanFreePathLab';
import EquipartitionLab from './components/grade-11/physics/EquipartitionLab';

import SHMLab from './components/grade-11/physics/SHMLab';
import SimplePendulumLab from './components/grade-11/physics/SimplePendulumLab';
import WaveMotionLab from './components/grade-11/physics/WaveMotionLab';
import WavesLab from './components/grade-11/physics/WavesLab';


import StokesLawLab from './components/grade-11/physics/StokesLawLab';
import SurfaceTensionLab from './components/grade-11/physics/SurfaceTensionLab';
import ZerothLawLab from './components/grade-11/physics/ZerothLawLab';

// Grade 11 - Chemistry
import HydrogenSpectrumLab from './components/grade-11/chemistry/HydrogenSpectrumLab';
import AtomicOrbitalsLab from './components/grade-11/chemistry/AtomicOrbitalsLab';
import VSEPRTheoryLab from './components/grade-11/chemistry/VSEPRTheoryLab';
import SigmaPiBondsLab from './components/grade-11/chemistry/SigmaPiBondsLab';
import IsothermalWorkLab from './components/grade-11/chemistry/IsothermalWorkLab';
import ExtensiveIntensivePropertiesLab from './components/grade-11/chemistry/ExtensiveIntensivePropertiesLab';
import BufferSolutionsLab from './components/grade-11/chemistry/BufferSolutionsLab';
import LeChatelierLab from './components/grade-11/chemistry/LeChatelierLab';
import QualitativeAnalysisCanvas from './components/grade-11/chemistry/QualitativeAnalysisCanvas';
import QuantitativeAnalysisCanvas from './components/grade-11/chemistry/QuantitativeAnalysisCanvas';
import EthaneConformationsCanvas from './components/grade-11/chemistry/EthaneConformationsCanvas';
import GeometricalIsomerismCanvas from './components/grade-11/chemistry/GeometricalIsomerismCanvas';


// Grade 12 - Physics
import ElectromagneticInductionLab from './components/grade-12/physics/ElectromagneticInductionLab';
import AlternatingCurrentLab from './components/grade-12/physics/AlternatingCurrentLab';
import EMWavesLab from './components/grade-12/physics/EMWavesLab';
import RayOpticsLab from './components/grade-12/physics/RayOpticsLab';
import WaveOpticsLab from './components/grade-12/physics/WaveOpticsLab';
import PhotoelectricLab from './components/grade-12/physics/PhotoelectricLab';
import AtomsLab from './components/grade-12/physics/AtomsLab';
import SemiconductorLab from './components/grade-12/physics/SemiconductorLab';

// Grade 12 - Chemistry
import CollisionTheoryLab from './components/grade-12/chemistry/CollisionTheoryLab';
import ElectrochemistryLab from './components/grade-12/chemistry/ElectrochemistryLab';
import StereochemistryLab from './components/grade-12/chemistry/StereochemistryLab';
import DBlockLab from './components/grade-12/chemistry/DBlockLab';
import HaloalkaneLab from './components/grade-12/chemistry/HaloalkaneLab';
import PolymerLab from './components/grade-12/chemistry/PolymerLab';

// Grade 12 - Biology
import GeneticsCanvas from './components/grade-12/biology/GeneticsCanvas';
import LinkageCanvas from './components/grade-12/biology/LinkageCanvas';
import TranscriptionCanvas from './components/grade-12/biology/TranscriptionCanvas';
import LacOperonCanvas from './components/grade-12/biology/LacOperonCanvas';
import ReplicationCanvas from './components/grade-12/biology/ReplicationCanvas';
import RNAiCanvas from './components/grade-12/biology/RNAiCanvas';
import TiPlasmidCanvas from './components/grade-12/biology/TiPlasmidCanvas';

// Shared / Utils
import { MaxwellBoltzmannChart, PotentialEnergyDiagram } from './components/Charts';
import Assistant from './components/Assistant';
import ReloadPrompt from './components/ReloadPrompt';
import Breadcrumbs from './components/Breadcrumbs';
import { startDashboardTour, startTopicTour } from './components/TourGuide';
import { RotateCcw, Activity, ArrowLeft, Home, Battery, Box, Magnet, FlaskConical, Layers, Cuboid, Grid, Percent, AlertTriangle, Info, GraduationCap, HelpCircle, Maximize2, Minimize2 } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [activeGrade, setActiveGrade] = useState<Grade>('12th');
  const [currentScreen, setCurrentScreen] = useState<Screen>('DASHBOARD');
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject>('Chemistry');

  const currentTopics = useMemo(() => getTopics(activeGrade), [activeGrade]);

  // --- SCROLL TO TOP ON NAVIGATION ---
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentScreen, activeTopicId]);

  // --- DASHBOARD IMAGE CACHE ---
  // Lifted state to persist generated images across screen navigation
  const [topicImages, setTopicImages] = useState<Record<string, string>>({});

  // --- TOUR STATE ---
  const [pendingTour, setPendingTour] = useState(false);

  useEffect(() => {
    if (pendingTour && currentScreen === 'TOPIC_VIEW') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        startTopicTour();
        setPendingTour(false);
      }, 500);
    }
  }, [pendingTour, currentScreen]);

  const handleDashboardTourFinish = () => {
    setActiveGrade('12th');
    setActiveSubject('Physics');
    setActiveTopicId('atoms');
    setCurrentScreen('TOPIC_VIEW');
    setPendingTour(true);
  };



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





  const [isSimulationFullscreen, setIsSimulationFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  // Handlers
  const handleTopicSelect = (topicId: string) => {
    setActiveTopicId(topicId);
    setCurrentScreen('TOPIC_VIEW');
  };

  const goHome = () => {
    setCurrentScreen('DASHBOARD');
    setActiveTopicId(null);
    setIsSimulationFullscreen(false);
  };

  // --- AI CONTEXT GENERATION ---
  const aiContext = useMemo(() => {
    if (activeTopicId === 'kinetics') {
      return `
        Topic: Chemical Kinetics (Collision Theory)
        Concept: Molecules need Threshold Energy and Correct Orientation.
      `;
    } else if (activeTopicId === 'electrochemistry') {
      return `
        Topic: Electrochemistry (Galvanic vs Electrolytic)
        Concept: Galvanic makes power (Zn->Cu). Electrolytic consumes power (Cu->Zn).
      `;
    } else if (activeTopicId === 'stereochemistry') {
      return `
        Topic: Stereoisomerism
        Concept: 3D arrangement of atoms. Cis/Trans in Square Planar, Fac/Mer in Octahedral, Chirality in Optical.
      `;
    } else if (activeTopicId === 'dblock') {
      return `
        Topic: Transition Metals (Crystal Field Theory)
        Concept: d-orbital splitting, d-d transition leads to color, unpaired electrons lead to paramagnetism.
      `;
    } else if (activeTopicId === 'haloalkanes') {
      return `
        Topic: Haloalkanes (SN1 vs SN2)
        Concept: Primary favors SN2 (Backside attack, Inversion). Tertiary favors SN1 (Carbocation, Racemization). Tertiary blocks SN2 via Steric Hindrance.
      `;
    } else if (activeTopicId === 'polymers') {
      return `
        Topic: Polymers
        Concept: Ziegler-Natta catalysis grows chains. Conjugated polymers (Polyacetylene) conduct electricity via delocalized electrons.
      `;
    } else if (activeTopicId === 'solids_classification') {
      return `
        Topic: Classification of Solids
        Concept: Ionic are brittle/insulators (unless molten). Metallic are malleable/conductors.
      `;
    } else if (activeTopicId === 'unit_cells') {
      return `
        Topic: Unit Cells
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
        Concept: Schottky reduces density (Vacancy). Frenkel maintains density (Dislocation).
      `;
    } else if (activeTopicId === 'fluid-dynamics') {
      return `
        Topic: Mechanical Properties of Fluids (Bernoulli's Principle)
        State: Flow Rate controls fluid velocity; Constriction Area creates pressure drop.
        Concept: Continuity equation (A*v=const) and Bernoulli's Principle (P + 0.5*rho*v^2 = const). As area decreases, velocity increases and pressure drops.
      `;
    } else if (activeTopicId === 'pascals-law') {
      return `
        Topic: Pascal's Law and Hydraulic Machines
        State: Force and Area dictate output force according to Pascal's Law.
        Concept: F2 = F1 * (A2/A1). Demonstrates force multiplication and volume conservation (Distance out is less than distance in). If gas is used, compression wastes energy.
      `;
    } else if (activeTopicId === 'surface-tension') {
      return `
        Topic: Surface Tension and Capillarity (NCERT Class 11, Section 9.6)
        Concept: Surface tension is due to the inward pull on surface molecules.
        Formula: h = (2S cos θ) / (aρg).
        States: Water (rise, concave meniscus), Mercury (fall, convex meniscus). Adding detergent reduces S and changes h.
        Lab: A macro beaker with 3 tubes showing height inverse to radius (h ∝ 1/a) and a molecular microscope showing the inward force vectors.
      `;
    } else if (activeTopicId === 'carnot-engine') {
      return `
        Topic: Carnot Engine and Carnot Cycle (NCERT Class 11, Chapter 11)
        Concept: Carnot cycle has 4 steps: isothermal expansion, adiabatic expansion, isothermal compression, adiabatic compression. Efficiency = 1 - T2/T1. No engine can exceed Carnot efficiency.
      `;
    } else if (activeTopicId === 'zeroth-law') {
      return `
        Topic: Zeroth Law of Thermodynamics (NCERT Class 11, Chapter 11)
        Concept: Two systems in thermal equilibrium with a third system are in equilibrium with each other. If T_A = T_C and T_B = T_C, then T_A = T_B.
        Walls: Adiabatic (insulating, blocks heat) vs Diathermic (conducting, allows heat).
        Simulation: Three chambers A, B, C with particles. Toggle walls between adiabatic and diathermic. Watch temperatures equalize.
        Application: Thermometer works because of the Zeroth Law.
      `;
    } else if (activeTopicId === 'thermodynamic-processes') {
      return `
        Topic: First Law of Thermodynamics and Thermodynamic Processes (NCERT Class 11, Chapter 11)
        Concept: ΔQ = ΔU + ΔW. Four process modes: Isothermal (T const, ΔU=0, ΔQ=ΔW), Adiabatic (Q=0, ΔU=-ΔW), Isochoric (V const, ΔW=0, ΔQ=ΔU), Isobaric (P const, ΔW=PΔV).
        Simulation: Interactive gas cylinder with P-V diagram and energy balance bars.
      `;
    } else if (activeTopicId === 'thermal-expansion-calorimetry') {
      return `
        Topic: Thermal Expansion, Specific Heat capacity, Calorimetry and Latent Heat (NCERT Class 11, Chapter 10)
        Concept: Expansion follows ΔL=αLΔT, ΔA=βAΔT, ΔV=γVΔT. Water behaves anomalously contracting 0-4°C. Calorimetry principle: Heat Lost = Heat Gained. Phase change plateaus at constant temp with Q = mL.
        Simulation: Three-station lab with metal block expansion setup, interactive phase change heating curve, and interactive mixing calorimetry beaker.
      `;
    } else if (activeTopicId === 'heat-transfer-blackbody-radiation') {
      return `
        Topic: Heat Transfer and Blackbody Radiation (NCERT Class 11, Chapter 10 - Thermal Properties of Matter)
        Concept: Heat flows from higher to lower temperature by conduction, convection, or radiation. Conduction follows H = kAΔT/L. Radiation of a blackbody follows H = σAT^4 and Wien's law λmax T = constant.
        Simulation: Three-station thermal lab with a conductive rod, convection tank, and blackbody spectrum viewer.
      `;
    } else if (activeTopicId === 'kinetic-theory') {
      return `
        Topic: Pressure of an Ideal Gas - Kinetic Theory (NCERT Class 11, Chapter 12)
        Concept: P = ⅓ n m ⟨v²⟩. Gas pressure arises from elastic molecular collisions against container walls. Temperature is the avg kinetic energy: ½m⟨v²⟩ = 3/2 kBT.
        Simulation: Interactive gas chamber with bouncing molecules, T/V/N controls, collision flashes, and live pressure graph.
      `;
    } else if (activeTopicId === 'mean-free-path') {
      return `
        Topic: Mean Free Path of Gas Molecules (NCERT Class 11, Chapter 12, Section 12.7)
        Definition: Mean free path (l) is the average distance a molecule travels between two successive collisions.
        Formula: l = 1 / (√2 · n · π · d²) where n = number density (N/V), d = molecular diameter.
        Collision cross-section: πd². Collision cylinder volume in time Δt: πd²⟨v⟩Δt.
        Cause-Effect: l ∝ 1/n (more crowded → shorter path), l ∝ 1/d² (bigger molecules → shorter path).
        Temperature at constant pressure: higher T → lower n → larger l.
        Real-world: explains why perfume diffuses slowly despite high molecular speeds (zig-zag path).
        Simulation: Live 2D gas box, one red tracked molecule with zig-zag trail, collision flashes, measured vs theory MFP readout, collision cylinder shown, density/diameter/temperature sliders.
      `;
    } else if (activeTopicId === 'equipartition') {
      return `
        Topic: Degrees of Freedom and Equipartition of Energy (NCERT Class 11, Chapter 12)
        Concept: Each DOF gets ½kBT. Monatomic: f=3, Rigid Diatomic: f=5, Vibrating Diatomic: f=7, Polyatomic: f=6+(vib modes).
        Formulas: U=(f/2)RT, Cv=(f/2)R, Cp=(f/2+1)R, γ=Cp/Cv.
        Simulation: 4 gas types with animated molecules, energy bar graphs, vibration toggle.
      `;

    } else if (activeTopicId === 'shm-spring') {
      return `
        Topic: Spring-Mass System and Simple Harmonic Motion (NCERT Class 11, Chapter 13)
        Concept: F = −kx, x(t) = A cos(ωt), ω = √(k/m), T = 2π√(m/k).
        Phase: v leads x by π/2, a leads x by π. Energy: KE + PE = ½kA² = constant.
        Simulation: Spring-block on table, velocity/acceleration vectors, 3 sync graphs, energy bars.
      `;
    } else if (activeTopicId === 'simple-pendulum') {
      return `
        Topic: The Simple Pendulum (NCERT Class 11, Chapter 13, Section 13.8)
        Definition: A simple pendulum is an idealized system consisting of a small bob of mass m tied to an inextensible, massless string of length L fixed to a rigid support.
        Concept Foundation: Oscillatory motion where a body moves to and fro about a mean position. SHM is when restoring force ∝ displacement.
        Physics: When displaced by angle θ, forces are tension (T) and weight (mg). Tangential component mgsinθ acts as restoring force.
        Formulas: τ = −L(mg sin θ), Iα = −mgL sin θ, α = −(g/L) sin θ.
        Small Angle Approximation: For θ < 20°, sinθ ≈ θ (radians), then α ≈ −(g/L)θ (SHM condition).
        Angular Frequency: ω = √(g/L), Time Period: T = 2π√(L/g).
        Key Insight: T depends ONLY on length L and gravity g, NOT on mass of bob or amplitude (within small angles).
        Derivation: Using τ = Iα with I = mL², substituting yields T = 2π√(L/g).
        Real Examples: Playground swing (child as bob), Grandfather clock (seconds pendulum T=2s), Tree branches swaying.
        Industrial: Measuring local g to detect underground mineral deposits.
        Simulation: Drag bob to change angle, sliders for length/mass, gravity selector (Earth/Moon/Mars), vector display toggle.
      `;
    } else if (activeTopicId === 'standing-waves') {
      return `
        Topic: Superposition, Reflection & Standing Waves (NCERT Class 11, Chapter 14)
        Concept: y = [2a sin(kx)] cos(ωt). Nodes at sin(kx)=0, antinodes at |sin(kx)|=1.
        Normal modes: νn = nv/(2L), v = √(T/μ). Fixed end → π phase reversal. Free end → no reversal.
        Simulation: Driven string with frequency/tension sliders, node/antinode markers, superposition graphs.
      `;
    } else if (activeTopicId === 'wave-motion') {
      return `
        Topic: Wave Motion (NCERT Class 11, Chapter 14)
        Definition: A wave is a pattern of disturbance that moves through a medium without the actual physical transfer of matter. It acts as a carrier of energy and information.
        Concept: Wave motion is intimately connected to harmonic oscillations. In a transverse wave (e.g., string), particles move perpendicular to propagation. In a longitudinal wave (e.g., sound), particles move parallel to propagation via compression and rarefaction.
        Key Formula: y(x,t) = a sin(kx - ωt + φ), where k = 2π/λ and ω = 2πν.
        Wave Speed: v = ω/k = λν. For a string, v = √(T/μ).
        Simulation: Toggle between transverse and longitudinal modes. Track a single 'Red Bead' to see it oscillates but never travels forward.
      `;
    } else if (activeTopicId === 'atoms') {
      return `
        Topic: Atoms - Rutherford's Alpha Scattering Experiment (NCERT Class 12 Physics, Unit VIII)
        Simulation: Alpha particles being fired at Gold (Au, Z=79) or Aluminum (Al, Z=13) nucleus.

        Key NCERT Concepts:
        1. Geiger-Marsden Experiment (1909): Fired α-particles at thin gold foil
        2. Observations:
           - Most particles passed straight through (atom is mostly empty space)
           - Some deflected at small angles (positive charge concentrated somewhere)
           - ~1 in 20,000 bounced back at θ > 90° (tiny, dense, positive nucleus)
        3. Rutherford Scattering Formula: N(θ) ∝ 1/sin⁴(θ/2)
        4. Why electrons don't deflect α-particles: α mass ≈ 7300 × electron mass
        5. Nuclear Model: Nucleus is 10⁻¹⁵ m, atom is 10⁻¹⁰ m (1:100,000 ratio)
        6. Electron shells visualized - electrons orbit but cannot deflect heavy α-particles
        7. Football Stadium Analogy: Nucleus = marble at center, Electrons = flies in stands

        The student is viewing the alpha scattering simulation with electron shells.
        Answer based on NCERT Class 12 Physics Chapter on Atoms.
      `;
    } else if (activeTopicId === 'vsepr-theory') {
      return `
        Topic: The Valence Shell Electron Pair Repulsion (VSEPR) Theory (NCERT Class 11, Unit 4)
        Concept: Electron pairs arrange in 3D to minimize repulsion: lp-lp > lp-bp > bp-bp. Lone pairs compress bond angles (e.g., NH3 107°, H2O 104.5°).
        Simulation: 3D interactive molecular sandbox with bond pairs, lone pairs, and dynamic angle measurements.
      `;
    } else if (activeTopicId === 'sigma-pi-bonds') {
      return `
        Topic: Types of Overlapping and Nature of Covalent Bonds (Sigma & Pi) (NCERT Class 11, Unit 4)
        Concept: σ bonds form by head-on overlap (s-s, s-p, p-p axial). π bonds form by lateral overlap of parallel p-orbitals. σ > π in strength. Phase (+/−) must match for constructive overlap. Orthogonal orbitals have zero net overlap.
        Simulation: Interactive orbital overlap lab with selectable orbitals, distance slider, phase flip, and live energy graph.
      `;
    } else if (activeTopicId === 'isothermal-work') {
      return `
        Topic: Isothermal Reversible and Irreversible Work (NCERT Class 11, Unit 6 Thermodynamics)
        Concept: For isothermal expansion of ideal gas: W_rev = -nRT ln(V2/V1) (max work); W_irr = -P_ext(V2-V1) (less work). First Law: dU=0 so q=-W. Area under PV curve = work done.
        Simulation: Piston-cylinder with real-time PV graph, reversible vs irreversible mode, gas molecule animation.
      `;
    } else if (activeTopicId === 'extensive-intensive-properties') {
      return `
        Topic: Extensive and Intensive Properties (NCERT Class 11, Unit 5 Thermodynamics)
        Concept: Extensive properties (V, m, U, H) depend on amount of matter. Intensive properties (T, P, d) do not. Molar properties (χm=χ/n) convert extensive to intensive. Partition test: divide system in half - extensive halves, intensive stays same.
        Simulation: Property Lab with gas container, partition toggle, gas pump slider, and molar property derivation.
      `;
    } else if (activeTopicId === 'buffer-solutions') {
      return `
        Topic: Buffer Solutions & Designing Buffer Solutions (NCERT Class 11, Unit 7 Equilibrium)
        Concept: Buffers resist pH changes on adding acid/base. Acidic buffer = weak acid + salt. Basic buffer = weak base + salt. Henderson-Hasselbalch: pH = pKa + log([Salt]/[Acid]). Buffer capacity is finite — breaks when conjugate base/acid exhausted.
        Simulation: Dual beaker lab (water vs buffer), Henderson-Hasselbalch overlay, titration buttons, buffer breaking demo.
      `;
    } else if (activeTopicId === 'le-chatelier-equilibrium') {
      return `
        Topic: Effect of Concentration Change on Equilibrium - Le Chatelier's Principle (NCERT Class 11, Unit 6 Equilibrium)
        Concept: Fe3+ + SCN- ⇌ [Fe(SCN)]2+. Kc is fixed. Adding reactant: Qc<Kc → forward shift → more red product. Removing reactant: Qc>Kc → backward shift → color fades. Quadratic equilibrium solver with animated 3-second shifts.
        Simulation: Colorimetric wet lab with reaction flask, Qc gauge, concentration bars, 4 dropper buttons.
      `;
    } else if (activeTopicId === 'qualitative-analysis-organic') {
      return `
        Topic: Qualitative Analysis of Organic Compounds (NCERT Class 11, Unit 8 Organic Chemistry)
        Concept: Organic compounds are covalent; heteroatoms (N, S, Cl) cannot be detected directly. Lassaigne's Test fuses the compound with Na metal to break covalent bonds and form ionic salts (NaCN, Na2S, NaCl). Tests: Nitrogen → Prussian Blue (Fe4[Fe(CN)6]3), Sulphur → Black PbS or Violet nitroprusside, Halogens → AgCl/AgBr/AgI (must boil with HNO3 first to remove CN-/S2- interference).
        Simulation: 5-phase interactive wet lab covering direct test trap, sodium fusion, nitrogen detection, sulphur detection, and halogen interference lesson.
      `;
    } else if (activeTopicId === 'quantitative-analysis-organic') {
      return `
        Topic: Quantitative Analysis of Organic Compounds (NCERT Class 11, Unit 8 Organic Chemistry)
        Concept: Liebig's Combustion Method — burn organic compound with CuO/O2. All C→CO2, all H→H2O. Pass through CaCl2 (absorbs H2O only), then KOH (absorbs CO2). Mass increases give %H = (2/18)(Δm1/m)×100 and %C = (12/44)(Δm2/m)×100. Order matters: CaCl2 MUST come before KOH. Dumas and Kjeldahl methods for Nitrogen. Carius method for Halogens+Sulphur.
        Simulation: 4-phase interactive combustion lab with tube ordering trap, animated particle combustion, post-combustion weighing, and step-by-step empirical formula deduction.
      `;
    } else if (activeTopicId === 'ethane-conformations') {
      return `
        Topic: Conformations of Ethane (NCERT Class 11, Unit 9 Hydrocarbons)
        Concept: Free rotation around C-C σ bond produces infinite conformations. Staggered (60°/180°/300°) = minimum energy, maximum stability. Eclipsed (0°/120°/240°) = maximum torsional strain (12.5 kJ/mol), minimum stability. Energy follows E = (12.5/2)(1−cos3θ). Newman projection = head-on view down C-C axis. Sawhorse = angled view.
        Simulation: Interactive dihedral angle slider (0°-360°), real-time Newman/Sawhorse/3D projections, live sinusoidal energy graph, electron cloud toggle for visualizing torsional strain.
      `;
    } else if (activeTopicId === 'stereoisomerism-geometrical') {
      return `
        Topic: Geometrical Isomerism / Cis-Trans Isomerism (NCERT Class 11, Unit 8 & 9)
        Concept: Restricted rotation around C=C double bond (π bond prevents rotation). Cis = identical groups on same side (polar, μ>0, higher BP). Trans = identical groups on opposite sides (non-polar, μ=0, higher MP due to crystal packing). Physical properties differ due to dipole moment vector addition/cancellation.
        Simulation: 4-phase simulation — Phase1: free rotation in alkanes (single σ bond). Phase2: restricted rotation in alkenes (π bond barrier). Phase3: cis-isomer with dipole vectors adding. Phase4: trans-isomer with dipole vectors cancelling. Property dashboard shows real dipole, BP, MP data.
      `;
    } else if (activeTopicId === 'responsive-prototype') {
      return `
      Topic: Responsive UI Sandbox
      Concept: Exploring a completely new layout container for future modules.
        Simulation: Edge - to - edge canvas with floating glassmorphic sidebars on desktop and native - feeling bottom sheets on mobile.
      `;
    } else if (activeTopicId === 'stokes-law') {
      return `
        Topic: Stokes’ Law and Terminal Velocity (NCERT Class 11, Section 9.5.1)
        Concept: Viscous drag F = 6πηav. Terminal velocity is reach when Weight = Buoyancy + Viscous Drag.
        Formula: vt = 2a²(ρ-σ)g / 9η.
        Real-world: Raindrops, dust particles, and falling ball viscometers.
        Simulation: Virtual cylinder with different fluids (Water, Oil, Glycerin). Ball of different materials (Steel, Lead, Aluminum). Live force vectors and Velocity vs Time graph.
      `;
    } else if (activeTopicId === 'wave_optics') {
      return `
        Topic: Wave Optics - Interference & Young's Double Slit Experiment (YDSE) (NCERT Class 12, Unit 6)
        Concept: Light behaves as a wave. Interference occurs when waves overlap.
        Formula: Fringe width β = λD/d.
        Simulation: Interactive YDSE setup with wavelength, slit separation, and screen distance controls.
      `;
    }
    return "User is on the curriculum dashboard.";
  }, [activeTopicId, kineticsConfig, reactionCount, externalVoltage, isomerConfig, selectedIon, haloConfig, polyMode, solidClassConfig, unitCellConfig, defectMode]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-gray font-sans text-slate-900 overflow-x-hidden">

      {/* --- HEADER --- */}
      <header className="bg-gradient-to-r from-brand-primary via-brand-primary to-rose-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={goHome}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/80 transform hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Excellent Academy" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-display font-bold text-white tracking-wide leading-tight">Excellent Academy</h1>
            </div>
          </div>

          {/* Mobile: Grade + Tour */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/20">
              <button
                onClick={() => { setActiveGrade('11th'); setActiveTopicId(null); setCurrentScreen('DASHBOARD'); }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${activeGrade === '11th' ? 'bg-brand-secondary text-brand-dark shadow-sm' : 'text-white/70'}`}
              >11th</button>
              <button
                onClick={() => { setActiveGrade('12th'); setActiveTopicId(null); setCurrentScreen('DASHBOARD'); }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${activeGrade === '12th' ? 'bg-brand-secondary text-brand-dark shadow-sm' : 'text-white/70'}`}
              >12th</button>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-white/90">
            <button
              onClick={() => currentScreen === 'DASHBOARD' ? startDashboardTour(handleDashboardTourFinish) : startTopicTour()}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all border border-white/15 text-xs font-bold uppercase tracking-wider hover:shadow-md"
              title="Start Guided Tour"
            >
              <HelpCircle size={14} className="text-brand-secondary" /> Tour
            </button>

            <div className="flex bg-white/10 rounded-xl p-1 border border-white/15 backdrop-blur-sm" id="tour-grade-selector">
              <button
                onClick={() => { setActiveGrade('11th'); setActiveTopicId(null); setCurrentScreen('DASHBOARD'); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeGrade === '11th' ? 'bg-brand-secondary text-brand-dark shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >Class 11</button>
              <button
                onClick={() => { setActiveGrade('12th'); setActiveTopicId(null); setCurrentScreen('DASHBOARD'); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${activeGrade === '12th' ? 'bg-brand-secondary text-brand-dark shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >Class 12</button>
            </div>

            <span className="bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-white border border-white/15 shadow-sm flex items-center gap-2">
              <GraduationCap size={12} className="text-brand-secondary" />
              {activeGrade} • {activeSubject}
            </span>
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
            topics={currentTopics}
          />
        )}

        {/* ================== FLUID DYNAMICS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'fluid-dynamics' && (
          <FluidDynamicsLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== PASCAL'S LAW ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'pascals-law' && (
          <HydraulicBrakeLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== SURFACE TENSION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'surface-tension' && (
          <SurfaceTensionLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== CARNOT ENGINE ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'carnot-engine' && (
          <CarnotEngineLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== ZEROTH LAW OF THERMODYNAMICS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'zeroth-law' && (
          <ZerothLawLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== THERMODYNAMIC PROCESSES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'thermodynamic-processes' && (
          <ThermodynamicProcessesLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== HEAT TRANSFER AND BLACKBODY RADIATION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'heat-transfer-blackbody-radiation' && (
          <HeatTransferBlackbodyLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== THERMAL EXPANSION AND CALORIMETRY ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'thermal-expansion-calorimetry' && (
          <ThermalExpansionCalorimetryLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== KINETIC THEORY ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'kinetic-theory' && (
          <KineticTheoryLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== MEAN FREE PATH ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'mean-free-path' && (
          <MeanFreePathLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== EQUIPARTITION OF ENERGY ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'equipartition' && (
          <EquipartitionLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}


        {/* ================== SHM SPRING-MASS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'shm-spring' && (
          <SHMLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== SIMPLE PENDULUM ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'simple-pendulum' && (
          <SimplePendulumLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== WAVE MOTION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'wave-motion' && (
          <WaveMotionLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== STANDING WAVES ================== */}
        {/* ================== STANDING WAVES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'standing-waves' && (
          <WavesLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== VSEPR THEORY ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'vsepr-theory' && (
          <VSEPRTheoryLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== SIGMA & PI BONDS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'sigma-pi-bonds' && (
          <SigmaPiBondsLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== ISOTHERMAL WORK ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'isothermal-work' && (
          <IsothermalWorkLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== EXTENSIVE & INTENSIVE PROPERTIES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'extensive-intensive-properties' && (
          <ExtensiveIntensivePropertiesLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== BUFFER SOLUTIONS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'buffer-solutions' && (
          <BufferSolutionsLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== LE CHATELIER EQUILIBRIUM ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'le-chatelier-equilibrium' && (
          <LeChatelierLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== QUALITATIVE ANALYSIS OF ORGANIC COMPOUNDS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'qualitative-analysis-organic' && (
          <QualitativeAnalysisCanvas
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== QUANTITATIVE ANALYSIS OF ORGANIC COMPOUNDS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'quantitative-analysis-organic' && (
          <QuantitativeAnalysisCanvas
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== CONFORMATIONS OF ETHANE ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'ethane-conformations' && (
          <EthaneConformationsCanvas
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}



        {/* ================== GEOMETRICAL ISOMERISM ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'stereoisomerism-geometrical' && (
          <GeometricalIsomerismCanvas
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== GRADE 12 CHEMISTRY LABS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'kinetics' && (
          <CollisionTheoryLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'electrochemistry' && (
          <ElectrochemistryLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'stereochemistry' && (
          <StereochemistryLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'dblock' && (
          <DBlockLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'haloalkanes' && (
          <HaloalkaneLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'polymers' && (
          <PolymerLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}

        {/* ================== GENETICS SCREEN ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'genetics_assortment' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
              </div>
              <div className={isSimulationFullscreen ? "fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-y-auto" : "bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden"}>
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Grid size={18} className="text-brand-secondary" /> Interactive Punnett Square
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Unit VII: Genetics
                  </div>

                  <button
                    onClick={() => setIsSimulationFullscreen(!isSimulationFullscreen)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-auto"
                    title={isSimulationFullscreen ? "Minimize" : "Maximize"}
                  >
                    {isSimulationFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
                <div className="relative h-[520px] bg-slate-100">
                  <GeneticsCanvas mode={solidClassConfig.type === 'ionic' ? 'punnett' : 'meiosis'} />
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-200">
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => setSolidClassConfig(p => ({ ...p, type: 'ionic' }))}
                      className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${solidClassConfig.type === 'ionic' ? 'border-brand-primary bg-white text-brand-primary shadow-lg' : 'border-slate-200 text-slate-400 hover:bg-white'} `}
                    >
                      <span className="text-sm">Calculator</span>
                      <span>Punnett Square (9:3:3:1)</span>
                    </button>
                    <button
                      onClick={() => setSolidClassConfig(p => ({ ...p, type: 'metallic' }))}
                      className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${solidClassConfig.type === 'metallic' ? 'border-brand-primary bg-white text-brand-primary shadow-lg' : 'border-slate-200 text-slate-400 hover:bg-white'} `}
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
                  <TextbookContent topic={currentTopics.find(t => t.id === activeTopicId)} />
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
              <div className={isSimulationFullscreen ? "fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-y-auto" : "bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden"}>
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Chromosomal Crossover Lab
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Unit VII: Genetics
                  </div>

                  <button
                    onClick={() => setIsSimulationFullscreen(!isSimulationFullscreen)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-auto"
                    title={isSimulationFullscreen ? "Minimize" : "Maximize"}
                  >
                    {isSimulationFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
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
                      className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${polyMode === 'synthesis' ? 'border-brand-primary bg-white text-brand-primary shadow-lg' : 'border-slate-200 text-slate-400 hover:bg-white'} `}
                    >
                      <span className="text-sm">Animation</span>
                      <span>Crossing Over</span>
                    </button>
                    <button
                      onClick={() => setPolyMode('conductivity')}
                      className={`px-6 py-3 rounded-xl font-bold transition-all border-2 flex flex-col items-center gap-1 ${polyMode === 'conductivity' ? 'border-brand-primary bg-white text-brand-primary shadow-lg' : 'border-slate-200 text-slate-400 hover:bg-white'} `}
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
                  <TextbookContent topic={currentTopics.find(t => t.id === activeTopicId)} />
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
              <div className={isSimulationFullscreen ? "fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-y-auto" : "bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden"}>
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Transcription Simulation
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Molecular Biology
                  </div>

                  <button
                    onClick={() => setIsSimulationFullscreen(!isSimulationFullscreen)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-auto"
                    title={isSimulationFullscreen ? "Minimize" : "Maximize"}
                  >
                    {isSimulationFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
                <div className="relative h-[500px] bg-slate-100">
                  <TranscriptionCanvas mode={polyMode === 'synthesis' ? 'prokaryote' : 'eukaryote'} />
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-center gap-4">
                  <button onClick={() => setPolyMode('synthesis')} className={`px-4 py-2 rounded-lg font-bold ${polyMode === 'synthesis' ? 'bg-brand-primary text-white' : 'bg-white text-slate-500 shadow-sm border'} `}>Prokaryote</button>
                  <button onClick={() => setPolyMode('conductivity')} className={`px-4 py-2 rounded-lg font-bold ${polyMode === 'conductivity' ? 'bg-brand-primary text-white' : 'bg-white text-slate-500 shadow-sm border'} `}>Eukaryote</button>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topic={currentTopics.find(t => t.id === activeTopicId)} />
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
              <div className={isSimulationFullscreen ? "fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-y-auto" : "bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden"}>
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Lac Operon Simulator
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    Gene Regulation
                  </div>

                  <button
                    onClick={() => setIsSimulationFullscreen(!isSimulationFullscreen)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-auto"
                    title={isSimulationFullscreen ? "Minimize" : "Maximize"}
                  >
                    {isSimulationFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
                <div className="relative h-[550px] bg-slate-100">
                  <LacOperonCanvas />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topic={currentTopics.find(t => t.id === activeTopicId)} />
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
              <div className={isSimulationFullscreen ? "fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-y-auto" : "bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden"}>
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-secondary" /> Replication Fork Simulator
                  </h3>
                  <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                    DNA Replication
                  </div>

                  <button
                    onClick={() => setIsSimulationFullscreen(!isSimulationFullscreen)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-auto"
                    title={isSimulationFullscreen ? "Minimize" : "Maximize"}
                  >
                    {isSimulationFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
                <div className="relative h-[550px] bg-slate-900">
                  <ReplicationCanvas />
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                  <TextbookContent topic={currentTopics.find(t => t.id === activeTopicId)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================== PHYSICS SIMULATIONS ================== */}

        {/* 1. ELECTROMAGNETIC INDUCTION */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'emi' && (
          <ElectromagneticInductionLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* 2. AC */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'ac' && (
            <AlternatingCurrentLab
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }

        {/* 3. EM WAVES */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'em_waves' && (
            <EMWavesLab
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }

        {/* 4. RAY OPTICS */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'ray_optics' && (
            <RayOpticsLab
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }

        {/* 5. WAVE OPTICS */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'wave_optics' && (
            <WaveOpticsLab
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }

        {/* 6. PHOTOELECTRIC EFFECT */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'dual_nature' && (
            <PhotoelectricLab
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }

        {/* 7. ATOMS */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'atoms' && (
            <AtomsLab
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }

        {/* 8. SEMICONDUCTORS */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'semiconductors' && (
            <SemiconductorLab
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }

        {/* 9. MECHANICAL PROPERTIES OF SOLIDS (CLASS 11) */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'mechanical-properties-solids' && (
            <MechanicalPropertiesMaster
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }


        {/* 9d. STOKES' LAW (CLASS 11) */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'stokes-law' && (
            <StokesLawLab
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }

        {/* 10. HYDROGEN SPECTRUM (CLASS 11) */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'hydrogen-spectrum' && (
            <HydrogenSpectrumLab
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }

        {/* 11. SHAPES OF ATOMIC ORBITALS (CLASS 11) */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'atomic-orbitals' && (
            <AtomicOrbitalsLab
              topic={currentTopics.find(t => t.id === activeTopicId)!}
              onExit={goHome}
            />
          )
        }

        {/* ================== ASSISTANT ================== */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'rnai' && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                  <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
                </div>
                <div className={isSimulationFullscreen ? "fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-y-auto" : "bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden"}>
                  <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                    <h3 className="font-display font-bold text-white flex items-center gap-2">
                      <Activity size={18} className="text-brand-secondary" /> RNA Interference Game
                    </h3>
                    <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                      Cell Defense
                    </div>

                    <button
                      onClick={() => setIsSimulationFullscreen(!isSimulationFullscreen)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-auto"
                      title={isSimulationFullscreen ? "Minimize" : "Maximize"}
                    >
                      {isSimulationFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                  </div>
                  <div className="relative h-[550px] bg-slate-900">
                    <RNAiCanvas />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 relative">
                <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                    <TextbookContent topic={currentTopics.find(t => t.id === activeTopicId)} />
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* ================== Ti PLASMID SCREEN ================== */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'ti_plasmid' && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center gap-2 mb-2 text-brand-primary/60 hover:text-brand-primary cursor-pointer w-fit" onClick={goHome}>
                  <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Curriculum</span>
                </div>
                <div className={isSimulationFullscreen ? "fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-y-auto" : "bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden"}>
                  <div className="bg-slate-900 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                    <h3 className="font-display font-bold text-white flex items-center gap-2">
                      <Activity size={18} className="text-brand-secondary" /> Agrobacterium Transformation
                    </h3>
                    <div className="text-xs font-mono font-bold text-brand-secondary bg-white/10 px-2 py-1 rounded">
                      Biotechnology
                    </div>

                    <button
                      onClick={() => setIsSimulationFullscreen(!isSimulationFullscreen)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-auto"
                      title={isSimulationFullscreen ? "Minimize" : "Maximize"}
                    >
                      {isSimulationFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                  </div>
                  <div className="relative h-[550px] bg-emerald-50">
                    <TiPlasmidCanvas />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 relative">
                <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-full">
                    <TextbookContent topic={currentTopics.find(t => t.id === activeTopicId)} />
                  </div>
                </div>
              </div>
            </div>
          )
        }

      </main >

      {/* AI Assistant */}
      < Assistant contextData={aiContext} />

      {/* PWA Update Prompt */}
      < ReloadPrompt />

      {/* --- FOOTER --- */}
      < footer className="relative bg-slate-950 py-14 mt-16 overflow-hidden" >
        {/* Subtle gradient glow behind content */}
        < div className="absolute inset-0 bg-gradient-to-t from-brand-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 text-center space-y-5">
          {/* Logo + Brand */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/15 shadow-lg">
              <img src="/logo.png" alt="Excellent Academy" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-display font-bold text-lg tracking-wide">Excellent Academy</span>
          </div>

          {/* Copyright */}
          <p className="text-[13px] text-white/40">&copy; 2026 All Rights Reserved</p>

          {/* Gradient accent divider */}
          <div className="flex justify-center">
            <div className="w-24 h-[2px] rounded-full bg-gradient-to-r from-transparent via-brand-secondary/60 to-transparent" />
          </div>

          {/* Tagline */}
          <p className="text-lg font-display font-medium text-white/70 italic tracking-wide">
            Building the future of education
          </p>
        </div>
      </footer >

    </div >
  );
};

export default App;
