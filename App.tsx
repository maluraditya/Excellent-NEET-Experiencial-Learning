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

// Grade 11 - Biology
import BinomialNomenclatureLab from './components/grade-11/biology/BinomialNomenclatureLab';
import FiveKingdomClassificationLab from './components/grade-11/biology/FiveKingdomClassificationLab';
import AlgaeLab from './components/grade-11/biology/AlgaeLab';
import BryophytesPteridophytesLab from './components/grade-11/biology/BryophytesPteridophytesLab';
import AnimalKingdomLab from './components/grade-11/biology/AnimalKingdomLab';
import AnimalTissuesLab from './components/grade-11/biology/AnimalTissuesLab';
import ChordataLab from './components/grade-11/biology/ChordataLab';
import FrogsLab from './components/grade-11/biology/FrogsLab';
import CellMembraneLab from './components/grade-11/biology/CellMembraneLab';
import BiomoleculesLab from './components/grade-11/biology/BiomoleculesLab';
import EnzymesLab from './components/grade-11/biology/EnzymesLab';
import CellCycleLab from './components/grade-11/biology/CellCycleLab';
import MitosisMeiosisStagesLab from './components/grade-11/biology/MitosisMeiosisStagesLab';
import PhotosynthesisLightReactionLab from './components/grade-11/biology/PhotosynthesisLightReactionLab';
import CalvinCycleC3C4Lab from './components/grade-11/biology/CalvinCycleC3C4Lab';
import RespirationInPlantsLab from './components/grade-11/biology/RespirationInPlantsLab';
import MorphologyFloweringPlantsLab from './components/grade-11/biology/MorphologyFloweringPlantsLab';
import AnatomyFloweringPlantsLab from './components/grade-11/biology/AnatomyFloweringPlantsLab';
import GymnospermsAngiospermsLab from './components/grade-11/biology/GymnospermsAngiospermsLab';


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


// Grade 12 - Biology
import DoubleFertilisationSeedDevelopmentLab from './components/grade-12/biology/DoubleFertilisationSeedDevelopmentLab';
import GametogenesisHormonalRegulationLab from './components/grade-12/biology/GametogenesisHormonalRegulationLab';
import PregnancyRhIncompatibilityLab from './components/grade-12/biology/PregnancyRhIncompatibilityLab';

// Shared / Utils
import { MaxwellBoltzmannChart, PotentialEnergyDiagram } from './components/Charts';
import Assistant from './components/Assistant';
import ReloadPrompt from './components/ReloadPrompt';
import Breadcrumbs from './components/Breadcrumbs';
import { startDashboardTour, startTopicTour } from './components/TourGuide';
import { RotateCcw, ArrowLeft, Home, Battery, Box, Magnet, FlaskConical, Layers, Cuboid, Percent, AlertTriangle, Info, GraduationCap, HelpCircle } from 'lucide-react';

const getInitialState = () => {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  
  let initialGrade: Grade = '12th';
  let initialSubject: Subject = 'Physics';
  let initialTopicId: string | null = null;
  let initialScreen: Screen = 'DASHBOARD';

  if (parts.length >= 1) {
    if (parts[0] === '11th' || parts[0] === '12th') initialGrade = parts[0] as Grade;
  }
  if (parts.length >= 2) {
    const subj = parts[1].toLowerCase();
    if (subj === 'physics') initialSubject = 'Physics';
    else if (subj === 'chemistry') initialSubject = 'Chemistry';
    else if (subj === 'biology') initialSubject = 'Biology';
  }
  if (parts.length >= 3) {
    initialTopicId = parts[2];
    initialScreen = 'TOPIC_VIEW';
  }

  return { initialGrade, initialSubject, initialTopicId, initialScreen };
};

const App: React.FC = () => {
  const initialState = useMemo(getInitialState, []);

  // Navigation State
  const [activeGrade, setActiveGrade] = useState<Grade>(initialState.initialGrade);
  const [currentScreen, setCurrentScreen] = useState<Screen>(initialState.initialScreen);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(initialState.initialTopicId);
  const [activeSubject, setActiveSubject] = useState<Subject>(initialState.initialSubject);

  const currentTopics = useMemo(() => getTopics(activeGrade), [activeGrade]);

  // --- URL SYNCHRONIZATION ---
  useEffect(() => {
    let newPath = '/';
    if (currentScreen === 'TOPIC_VIEW' && activeTopicId) {
      newPath = `/${activeGrade}/${activeSubject.toLowerCase()}/${activeTopicId}`;
    } else {
      newPath = `/${activeGrade}/${activeSubject.toLowerCase()}`;
    }
    
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  }, [activeGrade, activeSubject, activeTopicId, currentScreen]);

  useEffect(() => {
    const handlePopState = () => {
      const state = getInitialState();
      setActiveGrade(state.initialGrade);
      setActiveSubject(state.initialSubject);
      setActiveTopicId(state.initialTopicId);
      setCurrentScreen(state.initialScreen);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // --- SOLID STATE ---
  const [unitCellConfig, setUnitCellConfig] = useState<{ type: 'scc' | 'bcc' | 'fcc', slicer: boolean }>({
    type: 'scc',
    slicer: false
  });
  const [defectMode, setDefectMode] = useState<'schottky' | 'frenkel'>('schottky');
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
    } else if (activeTopicId === 'binomial-nomenclature') {
      return `
        Topic: Binomial Nomenclature & Taxonomic Hierarchy (NCERT Class 11 Biology, Unit 1)
        Concept: Scientific names consist of Genus and specific epithet. Classification uses ranks: Kingdom, Phylum, Class, Order, Family, Genus, Species.
        Simulation: Sort animals into the taxonomic hierarchy and type correctly formatted Latin names.
      `;
    } else if (activeTopicId === 'five-kingdom-classification') {
      return `
        Topic: Five Kingdom Classification (NCERT Class 11 Biology, Unit 1)
        Concept: R.H. Whittaker's five kingdoms: Monera, Protista, Fungi, Plantae, Animalia. Classification based on cell structure, body organisation, mode of nutrition, reproduction, and phylogenetic relationships.
        Simulation: Scan mystery organisms for their traits and place them into the correct kingdom portals.
      `;
    } else if (activeTopicId === 'algae') {
      return `
        Topic: Algae (Plant Kingdom) (NCERT Class 11 Biology, Unit 1)
        Concept: Algae are classified into Chlorophyceae (Green), Phaeophyceae (Brown), and Rhodophyceae (Red) based on pigments and stored food. Motility of spores varies.
        Simulation: Compare cellular structure, pigments, stored food, and reproductive motility across the three classes.
      `;
    } else if (activeTopicId === 'bryophytes-pteridophytes') {
      return `
        Topic: Bryophytes and Pteridophytes (NCERT Class 11 Biology, Unit 1)
        Concept: Bryophytes have a dominant gametophyte and no vascular tissue, so they remain small and depend on water for reproduction. Pteridophytes are the first vascular land plants with a dominant sporophyte and true roots, stem, and leaves.
        Simulation: Compare moss and fern growth, test height limits, observe water transport, and track the phase shift from gametophyte dominance to sporophyte dominance.
      `;
    } else if (activeTopicId === 'gymnosperms-angiosperms') {
      return `
        Topic: Gymnosperms and Angiosperms (NCERT Class 11 Biology, Unit 1)
        Concept: Gymnosperms have naked seeds on cones. Angiosperms have seeds enclosed in fruits and undergo Double Fertilisation (Syngamy + Triple Fusion).
        Simulation: Compare the unprotected ovule of a pine cone with the enclosed ovary of a flower. Trigger pollination and track two male gametes to see double fertilisation in action.
      `;
    } else if (activeTopicId === 'animal-kingdom-non-chordates') {
      return `
        Topic: Animal Kingdom (NCERT Class 11 Biology, Unit 1)
        Concept: Porifera survive through a canal system driven by choanocytes, while Cnidaria show polymorphism with polyp and medusa forms. In Obelia, the life cycle shows metagenesis.
        Simulation: Turn the sponge pump on and off, inject particles to trace water flow, and advance Obelia through polyp, medusa, and gamete stages.
      `;
    } else if (activeTopicId === 'animal-tissues') {
      return `
        Topic: Animal Tissues (NCERT Class 11 Biology, Unit 2, Chapter 7)
        Concept: Epithelial tissues cover and line body surfaces. Simple epithelium (1 layer) is for diffusion; compound epithelium (2+ layers) is for protection. Connective tissues link and support. Cartilage has a pliable chondroitin matrix (shock absorber). Bone has a rigid calcium matrix (load bearer).
        Simulation: Toggle Simple vs Compound epithelium, apply the friction scraper or chemical dropper to see which survives. Switch to Bone vs Cartilage, increase weight to 100 kg — cartilage compresses and springs back, bone stays rigid (or cracks). Zoom into the microscopic matrix view to see calcium lattice vs chondroitin chains.
      `;
    } else if (activeTopicId === 'frogs') {
      return `
        Topic: Frogs (NCERT Class 11 Biology, Unit 2, Chapter 7, Section 7.2.2)
        Concept: Frogs are amphibians with well-developed digestive, respiratory, circulatory, nervous, and reproductive systems. Key ideas include cutaneous and pulmonary respiration, a three-chambered heart, cloaca, and external fertilisation.
        Simulation: Switch organ overlays, move between Land and Water to observe respiration changes, feed an insect to trace digestion, inspect the three-chambered heart, and compare male and female reproductive anatomy.
      `;
    } else if (activeTopicId === 'cell-membrane-transport') {
      return `
        Topic: Cell Membrane - Fluid Mosaic Model and Transport (NCERT Class 11 Biology, Unit 3, Chapter 8, Section 8.5.1)
        Concept: The plasma membrane is a quasi-fluid phospholipid bilayer with peripheral and integral proteins. It is selectively permeable and supports simple diffusion, osmosis, facilitated diffusion, and ATP-driven active transport.
        Simulation: Tug membrane fluidity, change concentrations, choose neutral/polar/ion particles, toggle carrier proteins and active pumps, and observe when ATP is required.
      `;
    } else if (activeTopicId === 'biomolecules') {
      return `
        Topic: Biomolecules (NCERT Class 11 Biology, Unit 3, Chapter 9)
        Concept: Living tissues contain micromolecules and macromolecules. Amino acids are substituted methanes, triglycerides form by esterification of fatty acids with glycerol, sugars build polysaccharides, and nucleotides build nucleic acids.
        Simulation: Assemble amino acids around an alpha-carbon, switch R groups to identify glycine, alanine, and serine, adjust pH to form a zwitterion, and attach fatty acids to glycerol to make a triglyceride.
      `;
    } else if (activeTopicId === 'enzymes') {
      return `
        Topic: Enzymes - Nature of Enzyme Action and Factors Affecting Activity (NCERT Class 11 Biology, Unit 3, Chapter 9, Section 9.8)
        Concept: Enzymes are mostly proteins with active sites that bind substrates, form ES and EP complexes, lower activation energy, and show Vmax saturation when active sites are fully occupied.
        Simulation: Inject substrate, observe induced fit and product release, plot velocity vs substrate concentration, add enzyme to raise Vmax, and use inhibitors to block active sites.
      `;
    } else if (activeTopicId === 'cell-cycle-regulation') {
      return `
        Topic: Cell Cycle and Cell Division - Regulation and Phases (NCERT Class 11 Biology, Unit 3, Chapter 10)
        Concept: The cell cycle is genetically controlled and coordinated. G1 decides whether to divide or enter G0, S doubles DNA content from 2C to 4C while chromosome number remains 2n, G2 checks genome integrity, and M phase restores nucleo-cytoplasmic ratio.
        Simulation: Control environment request, nutrients, DNA repair, and proceed gates to discover G1/S and G2/M checkpoint logic.
      `;
    } else if (activeTopicId === 'mitosis-vs-meiosis-stages') {
      return `
        Topic: Mitosis vs Meiosis Stages (NCERT Class 11 Biology, Unit 3, Chapter 10)
        Concept: Mitosis is equational division where centromeres split and sister chromatids separate. Meiosis I is reductional division where homologous chromosomes separate while sister chromatids remain joined.
        Simulation: Switch between mitosis and meiosis I, move through prophase to telophase, use crossing over in meiosis prophase I, and use scissors only in mitosis anaphase to compare centromere behaviour.
      `;
    } else if (activeTopicId === 'photosynthesis-light-reaction') {
      return `
        Topic: Photosynthesis in Higher Plants - Light Reaction (NCERT Class 11 Biology, Unit 4, Chapter 11)
        Concept: Light reactions occur on thylakoid membranes. PS II (P680) starts electron flow and water splitting, PS I (P700) helps reduce NADP+ to NADPH, and the proton gradient across the membrane drives ATP synthase.
        Simulation: Adjust wavelength and light intensity, build H+ in the lumen, open the CF0 channel, and observe CF1 forming ATP from ADP and Pi.
      `;
    } else if (activeTopicId === 'calvin-cycle-c3-c4-pathways') {
      return `
        Topic: Calvin Cycle and C3-C4 Pathways (NCERT Class 11 Biology, Unit 4, Chapter 11)
        Concept: The Calvin cycle uses ATP and NADPH to fix CO2 into sugars. C3 plants fix CO2 directly with RuBisCO, while C4 plants first use PEPcase and bundle sheath cells to concentrate CO2 and reduce photorespiration.
        Simulation: Compare C3 and C4 plants, change temperature and oxygen level with buttons, add CO2 pulses, and observe sugar output, ATP use, waste, and yield.
      `;
    } else if (activeTopicId === 'respiration-in-plants') {
      return `
        Topic: Respiration in Plants (NCERT Class 11 Biology, Unit 4, Chapter 12)
        Concept: Glycolysis splits glucose into pyruvate in the cytoplasm. Without oxygen, pyruvate enters fermentation to regenerate NAD+. With oxygen, pyruvate enters the mitochondrion for link reaction and TCA cycle oxidation.
        Simulation: Start glycolysis, toggle oxygen, run fermentation or drag pyruvate into the mitochondrion, and track ATP, NADH, FADH2, and CO2.
      `;
    } else if (activeTopicId === 'angiosperms-double-fertilisation-seed-development') {
      return `
        Topic: Angiosperms - Double Fertilisation and Seed Development (NCERT Class 11 Biology, Unit 1 and Unit 2)
        Concept: Angiosperms show double fertilisation. One male gamete fuses with the egg to form a zygote, while the other fuses with the secondary nucleus to form PEN and then endosperm.
        Simulation: Grow the pollen tube, guide the two gametes to their targets, and compare maize endosperm persistence with pea cotyledon development.
      `;
    } else if (activeTopicId === 'gametogenesis-hormonal-regulation') {
      return `
        Topic: Gametogenesis and Hormonal Regulation (NCERT Class 11 Biology, Unit 2 and Unit 5)
        Concept: Pituitary FSH and LH act as gonadotrophins. In males, LH stimulates Leydig cells to secrete androgens, and FSH with androgens supports spermatogenesis. In females, FSH grows follicles and LH triggers ovulation.
        Simulation: Release FSH and LH along the hormone highway, watch testis or ovary responses, adjust hormone levels, and observe gamete production progress.
      `;
    } else if (activeTopicId === 'pregnancy-hormonal-control-rh-incompatibility') {
      return `
        Topic: Hormonal Control of Pregnancy and Rh Incompatibility (NCERT Class 11 Biology, Unit 5)
        Concept: Progesterone supports pregnancy by maintaining a suitable uterine environment. The placenta normally keeps maternal and foetal blood separated, but Rh exposure during delivery can create antibody memory in an Rh-negative mother carrying an Rh-positive foetus.
        Simulation: Adjust progesterone, set Rh types, simulate delivery exposure, observe antibody formation, start a second pregnancy, and use anti-Rh cleanup.
      `;
    } else if (activeTopicId === 'chordata') {
      return `
        Topic: Phylum – Chordata (NCERT Class 11 Biology, Unit 1, Chapter 4)
        Concept: Four defining features — notochord, dorsal hollow nerve cord, pharyngeal gill slits, post-anal tail. Vertebrata replaces notochord with vertebral column. Heart chambers: 2 (fish), 3 (amphibia/reptilia), 4 (birds/mammals).
        Simulation: Toggle subphyla, slide embryo to adult to see notochord-to-vertebral-column transformation, highlight individual chordate features, compare heart chambers across classes.
      `;
    } else if (activeTopicId === 'morphology-flowering-plants') {
      return `
        Topic: Morphology of Flowering Plants (NCERT Class 11 Biology, Unit 2)
        Concept: Compare tap root and fibrous root systems, observe alternate/opposite/whorled phyllotaxy, and see how tendrils and spines are modifications for support and protection.
        Simulation: Select mustard or wheat for root growth, rotate a phyllotaxy dial on the stem, and test how trellis or goat stress changes the importance of tendrils and spines.
      `;
    } else if (activeTopicId === 'anatomy-flowering-plants') {
      return `
        Topic: Anatomy of Flowering Plants: Tissue Systems and Secondary Growth (NCERT Class 11 Biology, Unit 2)
        Concept: Understand epidermal, ground, and vascular tissue systems, and see how vascular cambium converts a thin primary stem into a thicker woody stem by forming secondary xylem and secondary phloem.
        Simulation: Compare a young primary stem and an aged secondary stem, move the age slider, adjust cambium activity, and observe differentiation from meristematic cells to permanent wood cells.
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
  }, [activeTopicId, kineticsConfig, reactionCount, externalVoltage, isomerConfig, selectedIon, haloConfig, unitCellConfig, defectMode]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-gray font-sans text-slate-900 overflow-x-hidden">

      {/* --- HEADER --- */}
      <header className="bg-gradient-to-r from-brand-primary via-brand-primary to-rose-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={goHome}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/80 transform hover:scale-105 transition-transform">
              <img src="/logo1.webp" alt="Excellent Group of Institutions" className="w-full h-full object-contain p-0.5" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-display font-bold text-white tracking-wide leading-none">
                <span className="block text-xl !leading-none sm:text-2xl">Excellent</span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase leading-none tracking-widest text-white/85 sm:text-[11px]">Group of Institutions</span>
              </h1>
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
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/15 text-xs font-bold uppercase tracking-wider hover:shadow-md"
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

            <span className="bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-xl text-xs text-white border border-white/15 shadow-sm flex items-center gap-2">
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

        {/* ================== BINOMIAL NOMENCLATURE ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'binomial-nomenclature' && (
          <BinomialNomenclatureLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== FIVE KINGDOM CLASSIFICATION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'five-kingdom-classification' && (
          <FiveKingdomClassificationLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== ALGAE ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'algae' && (
          <AlgaeLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== BRYOPHYTES AND PTERIDOPHYTES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'bryophytes-pteridophytes' && (
          <BryophytesPteridophytesLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== GYMNOSPERMS AND ANGIOSPERMS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'gymnosperms-angiosperms' && (
          <GymnospermsAngiospermsLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== ANIMAL KINGDOM ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'animal-kingdom-non-chordates' && (
          <AnimalKingdomLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== ANIMAL TISSUES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'animal-tissues' && (
          <AnimalTissuesLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== FROGS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'frogs' && (
          <FrogsLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== CELL MEMBRANE ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'cell-membrane-transport' && (
          <CellMembraneLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== BIOMOLECULES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'biomolecules' && (
          <BiomoleculesLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== ENZYMES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'enzymes' && (
          <EnzymesLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== CELL CYCLE ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'cell-cycle-regulation' && (
          <CellCycleLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== MITOSIS VS MEIOSIS STAGES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'mitosis-vs-meiosis-stages' && (
          <MitosisMeiosisStagesLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== PHOTOSYNTHESIS LIGHT REACTION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'photosynthesis-light-reaction' && (
          <PhotosynthesisLightReactionLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== CALVIN CYCLE C3 C4 PATHWAYS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'calvin-cycle-c3-c4-pathways' && (
          <CalvinCycleC3C4Lab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== RESPIRATION IN PLANTS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'respiration-in-plants' && (
          <RespirationInPlantsLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== CHORDATA ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'chordata' && (
          <ChordataLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== ANATOMY OF FLOWERING PLANTS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'anatomy-flowering-plants' && (
          <AnatomyFloweringPlantsLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== MORPHOLOGY OF FLOWERING PLANTS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'morphology-flowering-plants' && (
          <MorphologyFloweringPlantsLab
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


        {/* ================== ANGIOSPERMS DOUBLE FERTILISATION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'angiosperms-double-fertilisation-seed-development' && (
          <DoubleFertilisationSeedDevelopmentLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== GAMETOGENESIS HORMONAL REGULATION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'gametogenesis-hormonal-regulation' && (
          <GametogenesisHormonalRegulationLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== PREGNANCY RH INCOMPATIBILITY ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'pregnancy-hormonal-control-rh-incompatibility' && (
          <PregnancyRhIncompatibilityLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
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
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/15 shadow-lg bg-white flex items-center justify-center">
              <img src="/logo1.webp" alt="Excellent Group of Institutions" className="w-full h-full object-contain p-0.5" />
            </div>
            <span className="text-white font-display font-bold text-lg tracking-wide">Excellent Group of Institutions</span>
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
