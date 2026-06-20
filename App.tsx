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
import KinematicsGraphsLab from './components/grade-11/physics/KinematicsGraphsLab';
import DimensionalAnalysisLab from './components/grade-11/physics/DimensionalAnalysisLab';
import ProjectileMotionLab from './components/grade-11/physics/ProjectileMotionLab';
import FrictionLab from './components/grade-11/physics/FrictionLab';
import NewtonsLawsLab from './components/grade-11/physics/NewtonsLawsLab';
import MomentumConservationLab from './components/grade-11/physics/MomentumConservationLab';
import WorkEnergyTheoremLab from './components/grade-11/physics/WorkEnergyTheoremLab';
import AngularMomentumLab from './components/grade-11/physics/AngularMomentumLab';
import CentreOfMassTorqueLab from './components/grade-11/physics/CentreOfMassTorqueLab';
import MomentOfInertiaLab from './components/grade-11/physics/MomentOfInertiaLab';
import KeplersLawsLab from './components/grade-11/physics/KeplersLawsLab';
import MechanicalEnergyLab from './components/grade-11/physics/MechanicalEnergyLab';

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
import ElectronicConfigurationLab from './components/grade-11/chemistry/ElectronicConfigurationLab';
import VSEPRTheoryLab from './components/grade-11/chemistry/VSEPRTheoryLab';
import SigmaPiBondsLab from './components/grade-11/chemistry/SigmaPiBondsLab';
import IsothermalWorkLab from './components/grade-11/chemistry/IsothermalWorkLab';
import HeatWorkEnergyChangesLab from './components/grade-11/chemistry/HeatWorkEnergyChangesLab';
import ExtensiveIntensivePropertiesLab from './components/grade-11/chemistry/ExtensiveIntensivePropertiesLab';
import MoleConceptLimitingReagentLab from './components/grade-11/chemistry/MoleConceptLimitingReagentLab';
import SolutionConcentrationDilutionLab from './components/grade-11/chemistry/SolutionConcentrationDilutionLab';
import PeriodicTrendsExplorerLab from './components/grade-11/chemistry/PeriodicTrendsExplorerLab';
import HydrogenBondingLab from './components/grade-11/chemistry/HydrogenBondingLab';
import WeakAcidBaseIonizationLab from './components/grade-11/chemistry/WeakAcidBaseIonizationLab';
import RedoxOxidationNumberLab from './components/grade-11/chemistry/RedoxOxidationNumberLab';
import BufferSolutionsLab from './components/grade-11/chemistry/BufferSolutionsLab';
import LeChatelierLab from './components/grade-11/chemistry/LeChatelierLab';
import QualitativeAnalysisCanvas from './components/grade-11/chemistry/QualitativeAnalysisCanvas';
import QuantitativeAnalysisCanvas from './components/grade-11/chemistry/QuantitativeAnalysisCanvas';
import PurificationTechniquesLab from './components/grade-11/chemistry/PurificationTechniquesLab';
import StructuralIsomerismPropertiesLab from './components/grade-11/chemistry/StructuralIsomerismPropertiesLab';
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
import PolarisationLab from './components/grade-12/physics/PolarisationLab';
import PhotoelectricLab from './components/grade-12/physics/PhotoelectricLab';
import AtomsLab from './components/grade-12/physics/AtomsLab';
import SemiconductorLab from './components/grade-12/physics/SemiconductorLab';

// Grade 12 - Chemistry
import CollisionTheoryLab from './components/grade-12/chemistry/CollisionTheoryLab';
import ElectrochemistryLab from './components/grade-12/chemistry/ElectrochemistryLab';
import StereochemistryLab from './components/grade-12/chemistry/StereochemistryLab';
import DBlockLab from './components/grade-12/chemistry/DBlockLab';
import VariableOxidationStatesLab from './components/grade-12/chemistry/VariableOxidationStatesLab';
import SolutionColligativeLab from './components/grade-12/chemistry/SolutionColligativeLab';
import IdealVsNonIdealSolutionsLab from './components/grade-12/chemistry/IdealVsNonIdealSolutionsLab';
import GlucoseConformationsLab from './components/grade-12/chemistry/GlucoseConformationsLab';
import AlcoholReactivityLab from './components/grade-12/chemistry/AlcoholReactivityLab';
import ConductanceConcentrationLab from './components/grade-12/chemistry/ConductanceConcentrationLab';
import NernstCellPotentialLab from './components/grade-12/chemistry/NernstCellPotentialLab';
import RateLawHalfLifeLab from './components/grade-12/chemistry/RateLawHalfLifeLab';
import AldehydeKetoneReactivityLab from './components/grade-12/chemistry/AldehydeKetoneReactivityLab';
import CarboxylicAcidsReactionsAcidityLab from './components/grade-12/chemistry/CarboxylicAcidsReactionsAcidityLab';
import BasicityOfAminesLab from './components/grade-12/chemistry/BasicityOfAminesLab';
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
    if (activeTopicId === 'conservation-of-angular-momentum') {
      return `
        Topic: Conservation of Angular Momentum (NCERT Class 11 Physics, Unit 6, Chapter 6 System of Particles and Rotational Motion, Sections 6.12–6.12.1)
        Angular momentum: for rotation about a fixed axis, L = Iω (moment of inertia × angular velocity); for symmetric bodies L = L_z = Iω.
        Torque relation: dL/dt = τ_ext, the rotational analogue of Newton's second law dP/dt = F_ext. If the moment of inertia is constant this gives τ = Iα.
        Conservation: if total external torque about the fixed axis is zero, then L_z = Iω = constant. For this symmetric model L = L_z. If moment of inertia changes, angular speed changes so I₁ω₁ = I₂ω₂.
        Skater example: a spinning skater with arms outstretched has a large moment of inertia; pulling the arms in reduces I, so ω increases to conserve L (and stretching them out slows the spin). Acrobats, divers and dancers use this. Note: L is conserved but rotational kinetic energy ½Iω² is not — the skater does work pulling the arms in.
        Simulation: A symmetric spinning figure carries two point arm-masses on massless rods. With τ_ext,z = 0, L_z = Iω and I = I_core + 2mr². Reach changes smoothly within an experiment; changing mass or initial spin resets the reference state at r = 2 m. Fixed-scale bars show I and ω moving inversely, L_z constant and rotational KE changing.
      `;
    } else if (activeTopicId === 'work-energy-theorem') {
      return `
        Topic: Work-Energy Theorem (NCERT Class 11 Physics, Unit 5, Chapter 5 Work, Energy and Power, Sections 5.2–5.3)
        Work: the work done by a constant force is the product of the component of the force along the displacement and the magnitude of the displacement: W = (F cosθ)d = F·d, where θ is the angle between the force and displacement. Work is a scalar (joules) and can be positive, negative or zero — a force perpendicular to motion (θ = 90°) does no work, and friction does negative work.
        Kinetic energy: K = ½mv², a positive scalar.
        Theorem: the change in kinetic energy of a particle equals the work done on it by the net force, K_f − K_i = W_net. Derivation (constant force, rectilinear): from v² − u² = 2as, multiply by m/2 to get ½mv² − ½mu² = mas = Fs, i.e. K_f − K_i = W; generalised by vectors to ½mv² − ½mu² = F·d, and for a variable force K_f − K_i = ∫F dx.
        Simulation: A block on a track is pushed by an adjustable force F at angle θ against friction (μ). As it moves, the applied force does positive work F cosθ·d, friction does negative work −f·d, and the net-work bar rises in lock-step with the change-in-KE bar (W_net = ΔKE). Sliders for F, θ, mass, μ and initial KE; raising θ toward 90° drives the work to zero, and friction can make the net work negative so the block slows.
      `;
    } else if (activeTopicId === 'conservation-of-momentum') {
      return `
        Topic: Conservation of Momentum (NCERT Class 11 Physics, Unit 4, Chapter 4 Laws of Motion, Section 4.7)
        Statement: The total momentum of an isolated system of interacting particles is conserved. An isolated system has no external force; internal mutual forces are equal and opposite (third law) so the momentum changes cancel in pairs and the total stays constant.
        Derivation (from 2nd + 3rd laws): for two bodies over a common contact time Δt, F(AB)Δt = p'A − pA and F(BA)Δt = p'B − pB; since F(AB) = −F(BA), ΔpA = −ΔpB, so p'A + p'B = pA + pB. Generally dP/dt = F_ext; if F_ext = 0 then P = constant. Key relation m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂ (momentum is a vector).
        Examples: recoil of a gun (total p starts at 0 so p_gun = −p_bullet); collision of two bodies — total final momentum equals total initial momentum whether the collision is elastic or inelastic. In an elastic collision kinetic energy is also conserved; in an inelastic collision some KE is lost (to heat/sound), and in a completely inelastic collision the bodies move together afterwards.
        Simulation: Two pucks (masses m₁, m₂) on a 1-D track. The teacher sets masses and initial velocities and picks Elastic, Inelastic (stick), or Recoil (fired apart from rest). The pucks collide and move off with velocities computed from conservation of momentum (and additionally conservation of KE for the elastic case; common velocity (m₁u₁+m₂u₂)/(m₁+m₂) for the inelastic case). Before-vs-after bars show that total momentum is always equal, while the kinetic-energy bar stays equal only for an elastic collision.
      `;
    } else if (activeTopicId === 'newtons-laws-of-motion') {
      return `
        Topic: Newton's Laws of Motion (NCERT Class 11 Physics, Unit 4, Chapter 4 Laws of Motion, Sections 4.4–4.7)
        First law (inertia): A body continues at rest or in uniform motion in a straight line unless acted on by an external force; if net external force = 0 then acceleration = 0. Inertia is the resistance to a change of state of motion (Galileo's inclined-plane observations; Aristotle's view that force is needed to keep uniform motion is wrong — force only counters friction).
        Second law: The rate of change of momentum is proportional to the applied force and in its direction. Momentum p = mv; F = k·dp/dt with k = 1 in SI, so F = dp/dt = ma. SI unit 1 N = 1 kg·m·s⁻². It is a vector law, consistent with the first law (F = 0 ⇒ a = 0). Impulse J = F·Δt = Δp.
        Third law: To every action there is an equal and opposite reaction; the pair acts on two different bodies (so it cannot cancel) and is simultaneous. Conservation of momentum (isolated system) follows from the second and third laws: m₁v₁ = −m₂v₂.
        Simulation: A three-mode bench. First-law mode glides a frictionless puck at constant velocity and lets the teacher toggle friction (an external force) to make it slow down. Second-law mode pushes a mass with an adjustable force F and mass m, showing a = F/m on an a-vs-F line and a-vs-m curve plus live momentum p = mv. Third-law mode releases a compressed spring between two carts (masses m₁, m₂) so they recoil with equal and opposite forces and conserved momentum (|p₁| = |p₂|).
      `;
    } else if (activeTopicId === 'static-kinetic-friction') {
      return `
        Topic: Static & Kinetic Friction (NCERT Class 11 Physics, Unit 4, Chapter 4 Laws of Motion, Section 4.9.1)
        Concept: Friction is the force parallel to the surfaces in contact that opposes an applied force or relative motion. Static friction is self-adjusting — it stays equal and opposite to the applied force, keeping the body at rest, up to a maximum (limiting) value. Once the body slides, kinetic (sliding) friction acts, which is smaller and roughly constant.
        Laws (empirical, only approximately true): static friction fs ≤ μsN; limiting friction (fs)max = μsN; kinetic friction fk = μkN, with μk < μs. The coefficients depend only on the nature of the surfaces and are independent of contact area; kinetic friction is nearly independent of velocity. Normal force on a flat surface N = mg.
        Dynamics: while at rest fs = applied force F; the block breaks free when F exceeds μsN, after which acceleration a = (F − fk)/m, and constant velocity needs F = fk. On an incline the block slips at the angle of repose where tanθmax = μs, independent of mass (mg sinθ = fs, mg cosθ = N).
        Simulation: In Flat-push mode the teacher raises the applied force and watches the red friction arrow grow to match the blue applied-force arrow (block at rest), peak at the limiting value, then drop to the constant kinetic value as the block breaks free and accelerates — shown on a friction-vs-applied-force graph with a static ramp, a peak μsN, and a kinetic plateau μkN. In Incline mode the teacher tilts the surface until the block slips at tanθmax = μs.
      `;
    } else if (activeTopicId === 'projectile-motion') {
      return `
        Topic: Projectile Motion & Vector Resolution (NCERT Class 11 Physics, Unit 3, Chapter 3 Motion in a Plane, Sections 3.4 and 3.8)
        Vector resolution: A vector resolves into rectangular components A = Aₓî + Aᵧĵ, with Aₓ = A cosθ, Aᵧ = A sinθ, magnitude A = √(Aₓ²+Aᵧ²) and direction θ = tan⁻¹(Aᵧ/Aₓ). Unit vectors î, ĵ have magnitude 1 and only specify direction.
        Projectile concept: An object launched with velocity v₀ at angle θ₀ moves under gravity alone (air resistance neglected). Galileo first stated the independence of the horizontal and vertical motions. The launch velocity resolves into v₀ₓ = v₀cosθ₀ (constant, since aₓ = 0) and v₀ᵧ = v₀sinθ₀ (changes under aᵧ = −g).
        Formulas: x = (v₀cosθ₀)t; y = (v₀sinθ₀)t − ½gt²; vₓ = v₀cosθ₀; vᵧ = v₀sinθ₀ − gt. Path is a parabola y = (tanθ₀)x − g x²/2(v₀cosθ₀)². Time to apex tₘ = v₀sinθ₀/g; time of flight T_f = 2tₘ; max height hₘ = (v₀sinθ₀)²/2g; range R = v₀²sin2θ₀/g, maximum at θ₀ = 45° where R_m = v₀²/g. Complementary angles give equal range (Galileo).
        Simulation: The teacher sets launch speed, angle and g and plays the launch. The velocity vector resolves into green horizontal and amber vertical components; two shadow dots (one sliding at constant speed along the ground, one bobbing on a vertical rail) prove the motions are independent. Apex height, range and time of flight update live, a Range-vs-angle graph shows the 45° peak, and a complementary-angle ghost lands at the same range.
      `;
    } else if (activeTopicId === 'dimensional-analysis') {
      return `
        Topic: Dimensional Analysis and Consistency (NCERT Class 11 Physics, Unit 1, Chapter 1 Units and Measurement, Sections 1.5–1.6)
        Concept: The dimensions of a physical quantity are the powers of the base quantities mass [M], length [L] and time [T] used to express it. The dimensional formula shows how the base quantities represent the quantity, e.g. velocity [M⁰LT⁻¹], force [MLT⁻²], energy [ML²T⁻²].
        Principle of homogeneity: only quantities with the same dimensions can be added or subtracted, so every term on both sides of a correct equation must have identical dimensions. If the dimensions of all terms are not the same, the equation is wrong. Consistency is necessary but NOT sufficient (it cannot fix dimensionless constants like ½ or 2π, and cannot distinguish quantities of the same dimensions).
        Applications: (1) checking consistency — e.g. x = x₀ + v₀t + ½at² is consistent because every term is [L]; ½mv² = mgh is consistent at [ML²T⁻²] (Example 1.3); K = m³v³ and K = ma are ruled out (Example 1.4). (2) deducing relations — assuming T = k lˣgʸmᶻ for a simple pendulum gives x+y=0, −2y=1, z=0, so T = k√(l/g) with k=2π supplied externally (Example 1.5).
        Simulation: A dimensional balance scale. In Check mode the teacher picks an equation and the beam stays level and glows emerald when consistent, or tilts and glows red when terms differ; a Tamper toggle breaks a correct term to show homogeneity fail. In Derive mode the teacher drags x, y, z exponents until the M, L, T bars balance, resolving to T = k√(l/g).
      `;
    } else if (activeTopicId === 'kinetics') {
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
    } else if (activeTopicId === 'variable-oxidation-states-dblock') {
      return `
        Topic: Variable Oxidation States in d-block (NCERT Class 12 Chemistry, Unit 8, The d- and f-Block Elements, Sec. 4.3.4)
        Concept: Transition elements show a great variety of oxidation states because incomplete d orbitals allow different numbers of (n-1)d and ns electrons to participate; these states often differ by unity. Elements near the middle of the 3d series show the greatest variety, with manganese showing +2 to +7, while Sc and Zn show limited states at the ends.
        Simulation: The teacher scans Sc to Zn on a white smartboard canvas, watches oxidation-state ladders grow to a Mn peak and shrink toward Zn, then toggles oxygen stabilisation and carbonyl low-state examples to connect the visual pattern to NCERT species such as MnO4-, CrO4^2-, VO2+, Ni(CO)4, and Fe(CO)5.
      `;
    } else if (activeTopicId === 'alcohol-reactivity-hbonding') {
      return `
        Topic: Alcohol Reactivity and Hydrogen Bonding (NCERT Class 12 Chemistry, Unit 7 Alcohols/Phenols/Ethers, §7.4.3 + §7.4.4)
        Concept: The -OH group dominates alcohol behaviour. Intermolecular H-bonding pushes boiling points well above same-mass ethers and hydrocarbons (ethanol 351 K vs methoxymethane 248 K vs propane 231 K; methanol 337 K), and small alcohols are miscible with water (solubility falls as the alkyl chain grows; branching reduces b.p.). Reactivity ranking flips by reaction type. C-O cleavage (Lucas: 3° turbidity immediately, 2° in 5-10 min, 1° none at RT; dehydration: 3° at 358 K, 2° at 440 K, 1° at 443 K) follows 3° > 2° > 1° via carbocation stability. Oxidation needs an alpha-H on the OH carbon: 1° -> aldehyde (PCC) -> carboxylic acid (KMnO4/H+), 2° -> ketone (CrO3), 3° resists; under Cu at 573 K, 1° dehydrogenates to aldehyde, 2° to ketone, 3° dehydrates to alkene.
        Simulation: Two-mode bench. Properties mode shows a beaker with cyan H-bond dashes (live network for alcohols, sparse for ethers, none for alkanes) and a thermometer with the NCERT-stated b.p. marker. Reactivity mode shows three test tubes (1° ethanol, 2° propan-2-ol, 3° tert-butanol) and lets the teacher drop Lucas, conc H2SO4 at 443 K, PCC, KMnO4/H+ or hot Cu at 573 K; each tube shows REACTS / SLOW / NO REACTION / DEHYDRATES with the NCERT-listed product.
      `;
    } else if (activeTopicId === 'aldehyde-ketone-reactivity') {
      return `
        Topic: Aldehyde vs Ketone Reactivity (NCERT Class 12 Chemistry, Aldehydes, Ketones and Carboxylic Acids, Chemical Reactions)
        Concept: Aldehydes and ketones both contain the carbonyl group and undergo nucleophilic addition. A nucleophile attacks the electrophilic carbonyl carbon approximately perpendicular to the sp2 plane, forming a tetrahedral alkoxide intermediate that captures a proton. Aldehydes are generally more reactive than ketones because ketones have two relatively large substituents that hinder attack and two alkyl groups that reduce carbonyl-carbon electrophilicity more effectively.
        Simulation: The teacher compares aldehyde and ketone carbonyls side by side. A nucleophile attacks the carbonyl, the canvas pauses at sp2 to sp3 tetrahedral intermediate formation, then steric shields and electrophilicity meters show why aldehydes react faster. A bisulphite mode shows product-side preference for most aldehydes and reactant-side preference for most ketones.
      `;
    } else if (activeTopicId === 'carboxylic-acids-reactions-acidity') {
      return `
        Topic: Carboxylic Acids - Key Reactions and Acidity (NCERT Class 12 Chemistry, Aldehydes, Ketones and Carboxylic Acids, Sections 8.9.1-8.10)
        Concept: Carboxylic acids contain the -COOH group. They dissociate in water to give resonance-stabilised carboxylate anions and hydronium ions, so acidity is explained through conjugate-base stability and pKa. Electron-withdrawing groups stabilise the carboxylate ion and strengthen the acid, while electron-donating groups weaken it. Key NCERT reactions include salt formation with NaHCO3, esterification, acid chloride formation with PCl5/PCl3/SOCl2, reduction to primary alcohols, and sodalime decarboxylation.
        Simulation: The teacher begins with a large R-COOH hub, toggles substituents to move an acidity marker along the NCERT order, then switches reaction modes. The class sees CO2 bubbles for NaHCO3, ester formation with water loss, SOCl2 producing RCOCl while gaseous products escape, reduction to RCH2OH, and sodium-salt decarboxylation to RH.
      `;
    } else if (activeTopicId === 'basicity-of-amines') {
      return `
        Topic: Basicity of Amines (NCERT Class 12 Chemistry, Amines, Structure-basicity relationship and Table 9.3)
        Concept: Amines behave as bases because nitrogen has an unshared electron pair and can accept a proton. Larger Kb or smaller pKb means a stronger base. In the gaseous phase, aliphatic amine basicity follows the +I effect order: tertiary > secondary > primary > NH3. In aqueous solution, solvation and steric hindrance compete with +I effect, giving methyl order (CH3)2NH > CH3NH2 > (CH3)3N > NH3 and ethyl order (C2H5)2NH > (C2H5)3N > C2H5NH2 > NH3. Aniline is weaker than ammonia because the nitrogen lone pair is conjugated with the benzene ring.
        Simulation: The teacher switches between gas, aqueous and aromatic modes. Molecules race along a basicity track, water halos reveal solvation, orange shields show steric hindrance, pKb bars rank the aqueous series, and aniline mode shows lone-pair delocalisation into the benzene ring.
      `;
    } else if (activeTopicId === 'conductance-concentration') {
      return `
        Topic: Conductance vs Concentration (NCERT Class 12 Chemistry, Ch 2 Electrochemistry, §2.4 Conductance of Electrolytic Solutions)
        Concept: Conductivity κ (S cm⁻¹) decreases with dilution. Molar conductivity Λm = κ/c (Eq 2.22) increases on dilution. Strong electrolytes: Λm = Λ°m − A√c (Eq 2.23) — nearly linear rise in Λm vs √c. Weak electrolytes (CH₃COOH): steep rise because α = Λm/Λ°m (Eq 2.26) approaches 1 at extreme dilution. Kohlrausch law: Λ°m = ν₊λ°₊ + ν₋λ°₋ (Eq 2.25). Ka = cΛm²/[Λ°m(Λ°m−Λm)] (Eq 2.27).
        Simulation: Choose KCl/NaCl/HCl (strong) or CH₃COOH (weak). Drag concentration slider; watch the selected Λm vs √c curve trace NCERT Fig 2.6, ions in the cell speed up/slow down, and α/Ka update live for the weak acid.
      `;
    } else if (activeTopicId === 'nernst-cell-potential') {
      return `
        Topic: Cell Potential & Nernst Equation (NCERT Class 12 Chemistry, Ch 2 Electrochemistry, §2.3 Nernst Equation)
        Concept: E_cell = E°_cell − (RT/nF)lnQ → at 298 K: E°_cell − (0.059/n)logQ (Eq 2.13). At equilibrium E_cell = 0, giving E°_cell = (0.059/n)logKc (Eq 2.14). ΔrG = −nFE_cell (Eq 2.15). ΔrG° = −nFE° (Eq 2.16). Daniell cell E° = 1.10 V; Cu-Ag E° = 0.46 V; Ni-Ag E° = 1.05 V; Mg-Ag E° = 3.17 V.
        Simulation: Pick a cell preset, adjust anode and cathode ion concentrations; the 2-beaker animation shows dissolving/depositing metals, the voltmeter shows live E_cell, and the E vs logQ plot shows the current operating point on the Nernst line. "Run to Eq" animates concentrations drifting toward Kc.
      `;
    } else if (activeTopicId === 'rate-law-half-life') {
      return `
        Topic: Rate Laws & Half-life (NCERT Class 12 Chemistry, Ch 3 Chemical Kinetics, §3.3 Integrated Rate Equations)
        Concept: Zero order (Eq 3.6): [R] = [R]₀ − kt; t½ = [R]₀/(2k) — successive half-lives shrink. First order (Eq 3.14): [R] = [R]₀e^(−kt); t½ = 0.693/k — constant half-life independent of [R]₀. NCERT Table 3.4 summarises differential rate law, integrated rate law, straight-line plot, half-life, and units of k for both orders.
        Simulation: Toggle between zero and first order. Watch the [R] vs t curve animate, with dashed half-life markers showing equal spacing (1st) or shrinking gaps (0th). Toggle to ln[R] vs t to reveal the linear plot for first order. A particle reactor shows molecule count drop as time passes.
      `;
    } else if (activeTopicId === 'ideal-nonideal-solutions') {
      return `
        Topic: Ideal vs Non‑ideal Solutions (NCERT Class 12 Chemistry, Ch 1 Solutions, Sections 1.4 and 1.5)
        Concept: For binary solutions of two volatile liquids, Raoult's law gives p₁ = p₁°·x₁, p₂ = p₂°·x₂ and p_total = x₁p₁° + x₂p₂° — a straight line in P vs x. Ideal solutions obey this over the whole composition range, with ΔmixH = 0 and ΔmixV = 0; A–A, B–B and A–B interactions are all comparable. Non-ideal solutions either bow above the Raoult line (positive deviation: A–B weaker than A–A/B–B, escape easier, ΔmixH > 0; e.g. ethanol+acetone, CS₂+acetone) or below it (negative deviation: A–B stronger, e.g. CHCl₃ H-bonding with acetone C=O; chloroform+acetone, phenol+aniline; ΔmixH < 0). Large positive deviation gives a minimum-boiling azeotrope (ethanol–water at ~95% v/v); large negative deviation gives a maximum-boiling azeotrope (HNO₃–water at ~68% w/w, bp 393.5 K). Vapour-phase mole fractions come from Dalton's law (y_i = p_i / p_total).
        Simulation: Pick one of five NCERT systems (benzene+toluene ideal, ethanol+acetone +ve, chloroform+acetone −ve, ethanol+water +azeotrope, HNO₃+water −azeotrope). A large P–x plot shows the dashed Raoult ideal lines and the solid actual curves; a vertical cursor follows the x₂ slider with live dots on each curve. Live composition card bars show how y differs from x (and become equal at the azeotrope marker). A side flask shows molecules with A–B bond glows that intensify with deviation magnitude.
      `;
    } else if (activeTopicId === 'glucose-conformations') {
      return `
        Topic: Biomolecules – Glucose Conformations (NCERT Class 12 Chemistry, Unit 14 Biomolecules, §14.1 Carbohydrates / Structure of Glucose)
        Concept: Glucose (C₆H₁₂O₆) is an aldohexose, D-(+)-glucose. Its open-chain (Fischer) structure has a –CHO at C1, four –CHOH groups (C2–C5) and a –CH₂OH at C6 (deduced from: HI/Δ → n-hexane; oxime & cyanohydrin → carbonyl; Br₂ water → gluconic acid → aldehyde; pentaacetate → five –OH; HNO₃ → saccharic acid → a 1° –OH). The open chain cannot explain why glucose fails Schiff's test, gives no NaHSO₃ adduct, its pentaacetate is unreactive to hydroxylamine, and it exists as two crystalline forms. So the C5–OH adds to the C1 –CHO forming a six-membered cyclic hemiacetal, the pyranose ring (analogy with pyran). C1 becomes the anomeric carbon; α-D-glucose has its C1–OH below the ring (opposite CH₂OH) and β-D-glucose above the ring (same side as CH₂OH) — these are anomers, shown as Haworth structures. In water the α and β forms interconvert through the open chain (mutarotation), the specific rotation settling to a constant value at an equilibrium of ~36% α and ~64% β.
        Simulation: Three views — Open chain (animated Fischer projection highlighting the carbonyl, the five –OH and the primary –OH in turn), Cyclic (an animated Haworth pyranose with a pulsing anomeric C1 and an α/β toggle that flips only the C1–OH), and Mutarotation (α-pyranose ⇌ open chain ⇌ β-pyranose with flowing equilibrium arrows, a travelling token, and a 36% α / 64% β composition bar).
      `;
    } else if (activeTopicId === 'solution-colligative') {
      return `
        Topic: Solution Concentration & Colligative Effect (NCERT Class 12 Chemistry, Ch 1 Solutions, Sections 1.2 and 1.6)
        Concept: Solutions are expressed in mass %, mole fraction, molarity (T-dependent) and molality (T-independent). Colligative properties depend on the number of solute particles, not their identity. Adding a non-volatile solute lowers vapour pressure, raising boiling point (ΔTb = i·Kb·m) and lowering freezing point (ΔTf = i·Kf·m). Kb and Kf are solvent properties; i is the van't Hoff factor for the solute.
        Simulation: Choose a solvent (water, benzene, cyclohexane, ethanol, acetic acid — auto-loads Kb/Kf from Table 1.3) and a solute (urea/glucose/NaCl/K₂SO₄ — each with its i from Table 1.4). Drag the solute and solvent mass sliders to see the freezing-point marker slide down and the boiling-point marker slide up on a shared thermometer in real time, with live readouts of m, ΔTb, ΔTf, mass %, mole fraction, and molarity.
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

    } else if (activeTopicId === 'conservation-mechanical-energy') {
      return `
        Topic: Conservation of Mechanical Energy (NCERT Class 11, Chapter 5)
        Principle: total mechanical energy K + V remains constant when only conservative forces do work. Delta K + Delta V = 0 and Ki + Vi = Kf + Vf.
        Gravity: V=mgh. For a ball released from height H, EH=mgH, Eh=mgh+1/2 mv^2, E0=1/2 mvf^2 and vf=sqrt(2gH).
        Spring: V=1/2 kx^2. For amplitude A, 1/2 kA^2 = 1/2 kx^2 + 1/2 mv^2.
        Non-conservative comparison: Ef-Ei=Wnc. Friction or resistance reduces K+V, while total energy remains accounted for as transferred internal energy.
        Simulation: Toggle between NCERT ideal and real-loss comparisons for free fall and spring-block motion, with synchronized K, V, transferred energy and balance readouts.
      `;
    } else if (activeTopicId === 'keplers-laws-planetary-motion') {
      return `
        Topic: Kepler's Laws of Planetary Motion (NCERT Class 11, Chapter 7)
        First law: planets move in elliptical orbits with the Sun at one focus. The nearest and farthest points are perihelion and aphelion.
        Second law: the Sun-planet line sweeps equal areas in equal times. Delta A / Delta t = L/(2m) is constant because gravitation is a central force and angular momentum is conserved; planets move faster near perihelion.
        Third law: T^2 is proportional to a^3. For the Sun, T^2 = 4 pi^2 a^3/(G M_s), with a the semi-major axis.
        Simulation: Three views show ellipse geometry, equal-time swept sectors, and an Earth-versus-test-planet period comparison using exact Kepler-equation timing.
      `;
    } else if (activeTopicId === 'moment-of-inertia') {
      return `
        Topic: Moment of Inertia (NCERT Class 11, Chapter 6)
        Definition: I = sum(mi ri^2), where ri is each mass element's perpendicular distance from the chosen axis. I depends on the mass distribution and the position and orientation of the axis.
        Relations: K = 1/2 I omega^2, I = M k^2, and for fixed-axis rotation tau = I alpha.
        NCERT Table 6.1: ring MR^2, disc MR^2/2, midpoint rod ML^2/12, solid sphere 2MR^2/5 for the stated symmetry axes.
        Simulation: Apply the same torque to selectable regular bodies and compare angular acceleration, angular speed, radius of gyration and rotational kinetic energy.
      `;
    } else if (activeTopicId === 'centre-of-mass-torque') {
      return `
        Topic: Centre of Mass and Torque (NCERT Class 11, Chapter 6)
        Centre of mass: X = (sum mi xi)/M. For two particles, X = (m1 x1 + m2 x2)/(m1 + m2); equal masses have their CM at the midpoint.
        Torque: tau = r cross F, with magnitude r F sin(theta) = r_perpendicular F. It is zero when the line of action passes through the pivot and maximum at 90 degrees for fixed r and F.
        Dynamics: dl/dt = tau. Mechanical equilibrium requires both sum F = 0 and sum tau = 0.
        Simulation: Two modes - unequal masses orbit their common CM, and a uniform pivoted beam turns under adjustable force, radius, force angle and direction.
      `;
    } else if (activeTopicId === 'position-velocity-acceleration-graphs') {
      return `
        Topic: Position, Velocity and Acceleration Graphs (NCERT Class 11, Chapter 2)
        Sign convention: right is positive and left is negative. Velocity is the slope of the position-time graph; acceleration is the slope of the velocity-time graph; signed area under velocity-time gives displacement.
        Constant-acceleration equations: v = v0 + at, x = x0 + v0t + 1/2 at^2, v^2 = v0^2 + 2a(x-x0).
        Graph shapes: uniform motion gives a straight x-t line, horizontal v-t line and a = 0. Constant acceleration gives a parabolic x-t graph, straight inclined v-t graph and horizontal a-t graph.
        Simulation: One moving object and three synchronized graphs with a shared time cursor, live tangent, signed area and adjustable x0, v0 and a.
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
    } else if (activeTopicId === 'heat-work-energy-changes') {
      return `
        Topic: Heat, Work, and Energy Changes (NCERT Class 11 Chemistry, Thermodynamics)
        Concept: Internal energy is a state function, while heat q and work w are path functions. Chemistry follows the IUPAC sign convention: q is positive when heat enters the system, w is positive when work is done on the system, and dU = q + w. For pressure-volume work, w = -Pext dV, so expansion gives negative work and compression gives positive work.
        Simulation: A piston-cylinder energy ledger lets students adjust heat, external pressure, and volume change. Live arrows, molecule motion, bar charts, and the equation strip show how q and w combine to produce dU.
      `;
    } else if (activeTopicId === 'extensive-intensive-properties') {
      return `
        Topic: Extensive and Intensive Properties (NCERT Class 11, Unit 5 Thermodynamics)
        Concept: Extensive properties (V, m, U, H) depend on amount of matter. Intensive properties (T, P, d) do not. Molar properties (χm=χ/n) convert extensive to intensive. Partition test: divide system in half - extensive halves, intensive stays same.
        Simulation: Property Lab with gas container, partition toggle, gas pump slider, and molar property derivation.
      `;
    } else if (activeTopicId === 'mole-concept-limiting-reagent') {
      return `
        Topic: Mole Concept and Limiting Reagent (NCERT Class 11 Chemistry, Some Basic Concepts of Chemistry)
        Concept: One mole contains 6.022 x 10^23 entities, and molar mass converts grams to moles. Balanced equation coefficients represent mole ratios. When reactants are not present in stoichiometric amounts, the reactant consumed first is the limiting reagent and fixes maximum product formed.
        Simulation: Reactants can be entered as moles or mass for methane combustion or ammonia synthesis. Mole-ratio packets feed a reaction machine, the limiting reagent is highlighted, product bins fill from the limiting reagent, and excess reactant remains visible.
      `;
    } else if (activeTopicId === 'solution-concentration-dilution') {
      return `
        Topic: Solution Concentration and Dilution (NCERT Class 11 Chemistry, Ch 1 Some Basic Concepts of Chemistry §1.10.2)
        Concept: Four NCERT-defined ways to express concentration — mass % (mass solute / mass solution × 100), mole fraction x_A = n_A/(n_A + n_B), molarity M = n_solute/V_solution(L) (temperature-dependent), molality m = n_solute/mass_solvent(kg) (temperature-independent). Dilution conserves moles of solute: M₁V₁ = M₂V₂.
        Simulation: Two modes — Prepare (volumetric flask with solute scoop, particle density scales with M, side panel shows all four units as bars) and Dilute (stock flask, pipette, target flask, water inflow, on-canvas conservation check). NCERT Problems 1.6/1.7/1.8 + the dilution example are preset chips in the left aside.
      `;
    } else if (activeTopicId === 'redox-oxidation-number') {
      return `
        Topic: Redox and Oxidation Number Visualiser (NCERT Class 11 Chemistry, Ch 7 Redox Reactions, §7.2 electron-transfer, §7.3 oxidation number rules 1-7, §7.4 classification incl. disproportionation, §7.5 balancing)
        Concept: A redox reaction is one in which oxidation numbers change. Oxidation = loss of electrons = ON ↑. Reduction = gain of electrons = ON ↓. Oxidation numbers are assigned with the 7 NCERT rules: (1) free element = 0, (2) monoatomic ion = charge, (3) alkali +1 / alkaline earth +2 / Al +3, (4) O = −2 normally (peroxides −1, superoxides −½, +2/+1 with F), (5) H = +1 (−1 in metallic hydrides), (6) F always −1, halogens −1 except with O, (7) sum = 0 for compound, = charge for ion. Disproportionation: one element is simultaneously oxidised and reduced (H₂O₂, Cl₂/OH⁻). Balanced via the 5-step oxidation-number method or 7-step half-reaction (ion-electron) method.
        Simulation: Four-mode visualiser on a white smartboard. RULES — pick a compound (H₂O, H₂O₂, KO₂, OF₂, NaH, NH₃, CO₂, MnO₄⁻, Cr₂O₇²⁻, SO₄²⁻, CO₃²⁻, Na₂S₂O₃, Na₂S₄O₆) and see each atom's ON badge with the firing rule called out. CLASSIFY — drop in an NCERT-canon reaction (2 Na + Cl₂; H₂S + Cl₂; Fe₃O₄ + Al; 2 Cu₂O + Cu₂S; N₂ + O₂; NaH + H₂O; Pb(NO₃)₂ decomposition) and the ON axis under the equation slides each changing element's dot from reactant ON to product ON. DISPROPORTIONATION — same axis, but the same element splits into two destinations (H₂O₂, Cl₂ + OH⁻ → bleach, P₄ in alkali). BALANCER — step ▶ through NCERT's exact 5 / 7 steps for Problem 7.8 (Cr₂O₇²⁻ + SO₃²⁻ acidic), Problem 7.9 (MnO₄⁻ + Br⁻ basic), and §7.5(b) (Fe²⁺ + Cr₂O₇²⁻ half-reaction). Left aside: rule cheat sheet + period-3 highest-ON strip. Right aside: theory + live oxidant/reductant/Δ ON values.
      `;
    } else if (activeTopicId === 'weak-acid-base-ionization') {
      return `
        Topic: Ionization of Weak Acids/Bases and Equilibrium K (NCERT Class 11 Chemistry, Ch 6 Equilibrium §6.11.3 Ionization Constants of Weak Acids, §6.11.4 Ionization of Weak Bases, §6.11.5 Relation between Ka and Kb)
        Concept: A weak acid HX establishes the equilibrium HX + H₂O ⇌ H₃O⁺ + X⁻ with Ka = [H₃O⁺][X⁻]/[HX] = cα²/(1−α). A weak base B sets up B + H₂O ⇌ BH⁺ + OH⁻ with Kb = cα²/(1−α). pKa = −log Ka, pKb = −log Kb. For a conjugate acid–base pair the constants are locked by Ka × Kb = Kw = 1.0 × 10⁻¹⁴ at 298 K, equivalently pKa + pKb = 14. A larger Ka (or Kb) means a stronger acid (or base); a strong acid has a weak conjugate base and vice versa.
        Simulation: Two beakers side-by-side — left amber "weak acid HA", right teal "weak base B" — with deterministic particle pools sized by the live α from cα²/(1−α). Acid dropdown (HF, HCOOH, HOCl, CH₃COOH, HCN — NCERT Table 6.6) and base dropdown (dimethylamine, triethylamine, NH₃, pyridine, aniline — NCERT Table 6.7). Log-scale concentration slider (0.001–1.0 M). Three modes: Side-by-side, Conjugate pair (locks to NH₄⁺ Ka 5.6×10⁻¹⁰ / NH₃ Kb 1.77×10⁻⁵ and shows Ka × Kb chip turning green at Kw), Dilution sweep (auto-animates c down to show α grow). Left aside: Ka/Kb log-scale strip + α-vs-c curve + pKa+pKb quick-read. Right aside: NCERT theory card + live values (Ka, α, [H⁺], pH, Kb, [OH⁻], pH, Ka·Kb).
      `;
    } else if (activeTopicId === 'hydrogen-bonding-molecular-interaction') {
      return `
        Topic: Hydrogen Bonding and Molecular Interaction (NCERT Class 11 Chemistry, Ch 4 Chemical Bonding and Molecular Structure §4.9)
        Concept: When H is covalently bonded to a highly electronegative atom (F, O, or N), the shared electrons shift toward the electronegative atom, leaving H with δ+ and the other atom with δ−. The resulting electrostatic attraction between molecules is called a hydrogen bond. It is weaker than a covalent bond and is represented by a dotted line. NCERT identifies two types: intermolecular (HF, alcohols, water) and intramolecular (o-nitrophenol). Magnitude of H-bonding is maximum in the solid state and minimum in the gaseous state.
        Simulation: Two-pane intermolecular comparison (H₂O vs H₂S, HF vs HCl, ethanol vs dimethyl ether, NH₃ vs PH₃) with live dotted-line H-bond detection and partial-charge labels, temperature slider that drives bond density and phase chip, qualitative boiling-point comparison band, plus an intramolecular view of o-nitrophenol reproducing NCERT Fig 4.22.
      `;
    } else if (activeTopicId === 'periodic-trends-explorer') {
      return `
        Topic: Periodic Trends Explorer (NCERT Class 11 Chemistry, Ch 3 Classification of Elements and Periodicity in Properties §3.7)
        Concept: Atomic radius decreases across a period (nuclear charge ↑, same shell) and increases down a group (new shells). Ionic radius: cation < parent atom, anion > parent atom; isoelectronic species shrink with increasing nuclear charge (O²⁻ 140, F⁻ 136, Na⁺ 95, Mg²⁺ 65 pm). Ionisation enthalpy ↑ across, ↓ down. Electronegativity (Pauling) ↑ across, ↓ down. Metallic character is inverse to electronegativity.
        Simulation: Interactive periodic table where a lens selector recolours and resizes element tiles by NCERT data (Tables 3.6 and 3.8). Selecting a tile updates period and group trend graphs and exposes the NCERT data table for the selected period. Includes an isoelectronic-species view for O²⁻/F⁻/Na⁺/Mg²⁺.
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
    } else if (activeTopicId === 'purification-techniques') {
      return `
        Topic: Purification Techniques (NCERT Class 11 Chemistry, Organic Chemistry: Some Basic Principles and Techniques)
        Concept: Organic compounds are purified by selecting a method based on physical-property differences. Sublimation separates sublimable solids from non-sublimable impurities. Crystallisation uses solubility differences in hot and cold solvent. Distillation separates volatile liquids or liquids with sufficiently different boiling points; fractional distillation handles closer boiling points. Differential extraction uses unequal solubility in immiscible solvents. Chromatography separates components by different adsorption or partition between stationary and mobile phases.
        Simulation: A five-station purification bench lets students switch methods, tune heat, solvent selectivity, extraction cycles, and sample load, then watch purity, recovery, and apparatus behaviour update live.
      `;
    } else if (activeTopicId === 'structural-isomerism-molecular-properties') {
      return `
        Topic: Structural Isomerism and Molecular Properties (NCERT Class 11 Chemistry, Organic Chemistry: Some Basic Principles and Techniques)
        Concept: Structural isomers have the same molecular formula but different structures, meaning atoms are linked in different ways. NCERT examples include chain isomerism (C5H12: pentane, 2-methylbutane, 2,2-dimethylpropane), position isomerism (C3H8O: propan-1-ol and propan-2-ol), functional group isomerism (C3H6O: propanal and propanone), and metamerism (C4H10O: methoxypropane and ethoxyethane). Different connectivity changes molecular properties such as boiling point, polarity, and intermolecular forces.
        Simulation: Students switch between isomerism types, compare same-formula structures, and use property lenses for boiling point, polarity, branching, and classification clues.
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


        {/* ================== DIMENSIONAL ANALYSIS & CONSISTENCY ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'dimensional-analysis' && (
          <DimensionalAnalysisLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== PROJECTILE MOTION & VECTOR RESOLUTION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'projectile-motion' && (
          <ProjectileMotionLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== STATIC & KINETIC FRICTION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'static-kinetic-friction' && (
          <FrictionLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== NEWTON'S LAWS OF MOTION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'newtons-laws-of-motion' && (
          <NewtonsLawsLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== CONSERVATION OF MOMENTUM ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'conservation-of-momentum' && (
          <MomentumConservationLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== WORK-ENERGY THEOREM ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'work-energy-theorem' && (
          <WorkEnergyTheoremLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== CONSERVATION OF ANGULAR MOMENTUM ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'conservation-of-angular-momentum' && (
          <AngularMomentumLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== CONSERVATION OF MECHANICAL ENERGY ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'conservation-mechanical-energy' && (
          <MechanicalEnergyLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== KEPLER'S LAWS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'keplers-laws-planetary-motion' && (
          <KeplersLawsLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== MOMENT OF INERTIA ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'moment-of-inertia' && (
          <MomentOfInertiaLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== CENTRE OF MASS & TORQUE ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'centre-of-mass-torque' && (
          <CentreOfMassTorqueLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== POSITION, VELOCITY & ACCELERATION GRAPHS ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'position-velocity-acceleration-graphs' && (
          <KinematicsGraphsLab
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

        {/* ================== HEAT, WORK, AND ENERGY CHANGES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'heat-work-energy-changes' && (
          <HeatWorkEnergyChangesLab
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

        {/* ================== MOLE CONCEPT & LIMITING REAGENT ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'mole-concept-limiting-reagent' && (
          <MoleConceptLimitingReagentLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== HYDROGEN BONDING ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'hydrogen-bonding-molecular-interaction' && (
          <HydrogenBondingLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== REDOX & OXIDATION NUMBER ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'redox-oxidation-number' && (
          <RedoxOxidationNumberLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== WEAK ACID/BASE IONIZATION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'weak-acid-base-ionization' && (
          <WeakAcidBaseIonizationLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== PERIODIC TRENDS EXPLORER ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'periodic-trends-explorer' && (
          <PeriodicTrendsExplorerLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== SOLUTION CONCENTRATION & DILUTION ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'solution-concentration-dilution' && (
          <SolutionConcentrationDilutionLab
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

        {/* ================== PURIFICATION TECHNIQUES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'purification-techniques' && (
          <PurificationTechniquesLab
            topic={currentTopics.find(t => t.id === activeTopicId)!}
            onExit={goHome}
          />
        )}

        {/* ================== STRUCTURAL ISOMERISM AND MOLECULAR PROPERTIES ================== */}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'structural-isomerism-molecular-properties' && (
          <StructuralIsomerismPropertiesLab
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
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'variable-oxidation-states-dblock' && (
          <VariableOxidationStatesLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'solution-colligative' && (
          <SolutionColligativeLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'ideal-nonideal-solutions' && (
          <IdealVsNonIdealSolutionsLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'alcohol-reactivity-hbonding' && (
          <AlcoholReactivityLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'aldehyde-ketone-reactivity' && (
          <AldehydeKetoneReactivityLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'glucose-conformations' && (
          <GlucoseConformationsLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'carboxylic-acids-reactions-acidity' && (
          <CarboxylicAcidsReactionsAcidityLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'basicity-of-amines' && (
          <BasicityOfAminesLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'haloalkanes' && (
          <HaloalkaneLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'conductance-concentration' && (
          <ConductanceConcentrationLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'nernst-cell-potential' && (
          <NernstCellPotentialLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
        )}
        {currentScreen === 'TOPIC_VIEW' && activeTopicId === 'rate-law-half-life' && (
          <RateLawHalfLifeLab topic={currentTopics.find(t => t.id === activeTopicId)!} onExit={goHome} />
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

        {/* POLARISATION */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'polarisation' && (
            <PolarisationLab
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

        {/* 12. ELECTRONIC CONFIGURATION AND EXCHANGE ENERGY (CLASS 11) */}
        {
          currentScreen === 'TOPIC_VIEW' && activeTopicId === 'electronic-configuration-exchange-energy' && (
            <ElectronicConfigurationLab
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
