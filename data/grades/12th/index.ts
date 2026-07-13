
import { Topic } from '../../../types';

export const TOPICS: Topic[] = [
  // --- PHYSICS UNIT III - MAGNETIC EFFECTS OF CURRENT AND MAGNETISM ---
  {
    id: 'magnetism-and-matter',
    subject: 'Physics',
    chapter: 'Magnetism and Matter',
    branch: 'Magnetism',
    grade: '12th',
    unit: 'Unit 3',
    title: 'Magnetism & Matter',
    description: 'Bar-magnet field lines as closed loops, the m × B torque with a live U(θ) curve, and a slab of bismuth / aluminium / iron responding to an external B₀ — dia, para, ferro on Table 5.2.',
    thumbnailIcon: 'magnet',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_magnetism_matter.png',
    youtubeVideoIds: ['IlbtaGL0ymU'],
    coverImage: ''
  },
  {
    id: 'moving-charges-magnetism',
    subject: 'Physics',
    chapter: 'Moving Charges and Magnetism',
    branch: 'Magnetism',
    grade: '12th',
    unit: 'Unit 3',
    title: 'Moving Charges & Magnetism',
    description: 'Apply the right-hand rule to moving charges and current-carrying conductors, explore circular and helical trajectories, and balance crossed electric and magnetic fields in a velocity selector.',
    thumbnailIcon: 'magnet',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_moving_charges_magnetism.png',
    youtubeVideoIds: ['zZLix447wrU'],
    coverImage: ''
  },
  // --- PHYSICS UNIT II — CURRENT ELECTRICITY ---
  {
    id: 'current-electricity',
    subject: 'Physics',
    chapter: 'Current Electricity',
    branch: 'Electromagnetism',
    grade: '12th',
    unit: 'Unit 2',
    title: 'Current Electricity',
    description: 'Sweep the battery on a V–I trace to see Ohmic vs non-Ohmic (resistor / filament / diode), combine real cells in series and parallel with internal r, and balance a Wheatstone bridge with a live galvanometer needle.',
    thumbnailIcon: 'zap',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_current_electricity.png',
    youtubeVideoIds: ['AlDeY2m3RPM'],
    coverImage: ''
  },
  // --- PHYSICS UNIT I — ELECTROSTATICS ---
  {
    id: 'electrostatic-potential-capacitance',
    subject: 'Physics',
    chapter: 'Electrostatic Potential and Capacitance',
    branch: 'Electrostatics',
    grade: '12th',
    unit: 'Unit 1',
    title: 'Electrostatic Potential & Capacitance',
    description: 'Build a live V heat-map with equipotential contours, then switch to a parallel-plate capacitor — slide a dielectric in, toggle battery, and watch C, Q, V and U respond to A, d and K.',
    thumbnailIcon: 'layers',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_electrostatic_potential_capacitance.png',
    youtubeVideoIds: ['8DARK51eJXY'],
    coverImage: ''
  },
  {
    id: 'electric-charges-fields',
    subject: 'Physics',
    chapter: 'Electric Charges and Fields',
    branch: 'Electrostatics',
    grade: '12th',
    unit: 'Unit 1',
    title: 'Electric Charges & Fields',
    description: 'Drag point charges on a white field, switch between vector arrows and field lines, and probe |E| with a +1 nC test charge — Coulomb’s 1/r² law, superposition, and the dipole field made visible.',
    thumbnailIcon: 'zap',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_electric_charges_fields.png',
    youtubeVideoIds: ['nN9n3quiJto'],
    coverImage: ''
  },
  // --- PHYSICS UNIT VI & VII & VIII & IX ---
  {
    id: 'emi',
    subject: 'Physics',
    chapter: 'Electromagnetic Induction',
    branch: 'Electromagnetism',
    grade: '12th',
    unit: 'Unit 6',
    title: 'Faraday’s Law & AC Generator',
    description: 'Visualize a rotating coil in a magnetic field. See how changing flux induces an EMF (ϵ = -dΦ/dt) and generates sinusoidal AC voltage.',
    thumbnailIcon: 'magnet',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_emi_ac_generator.png',
    youtubeVideoIds: ['K95wcRVwh80'],
    coverImage: ''
  },
  {
    id: 'ac',
    subject: 'Physics',
    chapter: 'Alternating Current',
    branch: 'Electromagnetism',
    grade: '12th',
    unit: 'Unit 7',
    title: 'The Transformer',
    description: 'Experiment with Step-up and Step-down transformers. Adjust primary/secondary turns to change voltage/current ratios while conserving power.',
    thumbnailIcon: 'zap',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_transformer.png',
    youtubeVideoIds: ['zf8vnCcETqM'],
    coverImage: ''
  },
  {
    id: 'em_waves',
    subject: 'Physics',
    chapter: 'Electromagnetic Waves',
    branch: 'EM Waves',
    grade: '12th',
    unit: 'Unit 8',
    title: 'EM Wave Propagation',
    description: 'See how an oscillating charge generates self-sustaining Electric and Magnetic fields. Visualize the transverse nature of EM waves in 3D.',
    thumbnailIcon: 'activity',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_em_waves.png',
    youtubeVideoIds: ['p0AwOTqgTTk'],
    coverImage: ''
  },
  {
    id: 'ray_optics',
    subject: 'Physics',
    chapter: 'Ray Optics',
    branch: 'Optics',
    grade: '12th',
    unit: 'Unit 9',
    title: 'Lenses, Prisms & Instruments',
    description: 'Ray tracing for convex/concave lenses and prisms. Explore image formation in Microscopes and Telescopes.',
    thumbnailIcon: 'microscope', // Need to ensure Dashboard handles this, or falls back
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_ray_optics.png',
    youtubeVideoIds: ['1R5vH6KIpIk'],
    coverImage: ''
  },
  {
    id: 'wave_optics',
    subject: 'Physics',
    chapter: 'Wave Optics',
    branch: 'Optics',
    grade: '12th',
    unit: 'Unit 10',
    title: 'Interference & Diffraction',
    description: 'Observe the wave nature of light. Simulate Young’s Double Slit Experiment (YDSE) fringes and Diffraction patterns.',
    thumbnailIcon: 'layers',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_wave_optics.png',
    youtubeVideoIds: ['X_NMkbbb974'],
    coverImage: ''
  },
  {
    id: 'polarisation',
    subject: 'Physics',
    chapter: 'Wave Optics',
    branch: 'Optics',
    grade: '12th',
    unit: 'Unit 10',
    title: 'Polarisation of Light',
    description: 'Rotate polaroids to reveal the transverse nature of light. Test Malus\' law, crossed axes, and the surprising transmission through a third middle polaroid.',
    thumbnailIcon: 'sun',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_polarisation.png',
    youtubeVideoIds: ['8YkfEft4p-w'],
    coverImage: ''
  },
  {
    id: 'dual_nature',
    subject: 'Physics',
    chapter: 'Dual Nature of Radiation',
    branch: 'Modern Physics',
    grade: '12th',
    unit: 'Unit 11',
    title: 'Photoelectric Effect',
    description: 'Prove the particle nature of light. Hit metals with photons of different frequencies to eject electrons (if hν > Φ).',
    thumbnailIcon: 'sun',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_photoelectric_effect.png',
    youtubeVideoIds: ['SgXW4foFGpw'],
    coverImage: ''
  },
  {
    id: 'atoms',
    subject: 'Physics',
    chapter: 'Atoms',
    branch: 'Modern Physics',
    grade: '12th',
    unit: 'Unit 12',
    title: 'Alpha Scattering Experiment',
    description: 'Recreate Rutherford’s gold foil experiment. Fire alpha particles at a nucleus and observe deflection angles based on impact parameter.',
    thumbnailIcon: 'atom',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_rutherford_scattering.png',
    youtubeVideoIds: ['QmRFtM08F4A'],
    coverImage: ''
  },
  {
    id: 'nuclei',
    subject: 'Physics',
    chapter: 'Nuclei',
    branch: 'Modern Physics',
    grade: '12th',
    unit: 'Unit 13',
    title: 'Nuclei: Stability, Decay & Reactions',
    description: 'Explore the binding-energy curve, model exponential radioactive decay and half-life, and compare energy release in nuclear fission and fusion.',
    thumbnailIcon: 'atom',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_nuclei.png',
    youtubeVideoIds: ['UtZw9jfIxXM'],
    coverImage: ''
  },
  {
    id: 'semiconductors',
    subject: 'Physics',
    chapter: 'Semiconductor Electronics',
    branch: 'Electronics',
    grade: '12th',
    unit: 'Unit 14',
    title: 'Formation of P-N Junction',
    description: 'Join p-type and n-type materials. Watch diffusion create a Depletion Region and Barrier Potential that controls current flow.',
    thumbnailIcon: 'grid',
    thumbnailUrl: '/images/thumbnails/12th-physics/thumb_semiconductors_pn_junction.png',
    youtubeVideoIds: ['qu9reCzzrco'],
    coverImage: ''
  },

  // UNIT 2: ELECTROCHEMISTRY
  {
    id: 'electrochemistry',
    subject: 'Chemistry',
    chapter: 'Electrochemistry',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit 2',
    title: 'Galvanic vs. Electrolytic Cells',
    description: 'Visualize the flow of ions and electrons in spontaneous and non-spontaneous electrochemical cells. Control the voltage to reverse the reaction.',
    thumbnailIcon: 'zap',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_electrochemistry_cells.png',
    youtubeVideoIds: ['cNs7CPevcYs'],
    coverImage: ''
  },

  // UNIT 3: KINETICS
  {
    id: 'kinetics',
    subject: 'Chemistry',
    chapter: 'Chemical Kinetics',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit 3',
    title: 'Collision Theory & Activation Energy',
    description: 'Explore the microscopic criteria for chemical reactions: energy barriers and molecular orientation. Visualize how temperature affects reaction rates.',
    thumbnailIcon: 'activity',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_collision_activation_energy.png',
    youtubeVideoIds: ['wbGgIfHsx-I'],
    coverImage: ''
  },

  // UNIT 1: SOLUTIONS
  {
    id: 'solution-colligative',
    subject: 'Chemistry',
    chapter: 'Solutions',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit 1',
    title: 'Solution Concentration & Colligative Effect',
    description: 'Prepare solutions at different molarity and molality and watch the freezing point fall and boiling point rise live on a shared thermometer, driven by ΔT = i·K·m.',
    thumbnailIcon: 'beaker',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_colligative_properties.svg',
    youtubeVideoIds: ['yrermv51ZMI'],
    coverImage: ''
  },
  // UNIT 1: SOLUTIONS — IDEAL VS NON-IDEAL
  {
    id: 'ideal-nonideal-solutions',
    subject: 'Chemistry',
    chapter: 'Solutions',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit 1',
    title: 'Ideal vs Non‑ideal Solutions',
    description: 'Pick a binary liquid system and drag the composition slider to see the actual P–x curve bow above (positive deviation) or below (negative deviation) the dashed Raoult ideal line, with azeotrope markers for ethanol–water and HNO₃–water.',
    thumbnailIcon: 'flask',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_ideal_nonideal_solutions.svg',
    youtubeVideoIds: ['vYa7f6WpTxk'],
    coverImage: ''
  },
  // UNIT 14: BIOMOLECULES
  {
    id: 'glucose-conformations',
    subject: 'Chemistry',
    chapter: 'Biomolecules',
    branch: 'Organic Chemistry',
    grade: '12th',
    unit: 'Unit 14',
    title: 'Biomolecules – Glucose Conformations',
    description: 'Switch between the open-chain (Fischer) and cyclic (Haworth pyranose) forms of glucose, flip the α / β anomer at the anomeric carbon, and watch mutarotation interconvert them through the open chain in water.',
    thumbnailIcon: 'hexagon',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_glucose_conformations.svg',
    youtubeVideoIds: ['6u0jHuG3kgc'],
    coverImage: ''
  },
  // UNIT 4: INORGANIC
  {
    id: 'dblock',
    subject: 'Chemistry',
    chapter: 'The d- and f-Block Elements',
    branch: 'Inorganic Chemistry',
    grade: '12th',
    unit: 'Unit 8',
    title: 'Magnetic Properties & Color',
    description: 'Connect electron configuration to bulk properties. Visualize Crystal Field Splitting, d-d transitions, and calculate Magnetic Moment.',
    thumbnailIcon: 'magnet',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_dblock_magnetic_color.png',
    youtubeVideoIds: ['LzZWHSdYaxw'],
    coverImage: ''
  },
  {
    id: 'variable-oxidation-states-dblock',
    subject: 'Chemistry',
    chapter: 'The d- and f-Block Elements',
    branch: 'Inorganic Chemistry',
    grade: '12th',
    unit: 'Unit 8',
    title: 'Variable Oxidation States in d-block',
    description: 'Explore selected 3d transition elements, showing how incomplete d-orbital filling creates variable oxidation states, why manganese has the widest range, and how oxygen or carbonyl ligands stabilise special states.',
    thumbnailIcon: 'activity',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_variable_oxidation_states.svg',
    youtubeVideoIds: ['gPHJr2xijYs'],
    coverImage: ''
  },
  // UNIT 5: COORDINATION
  {
    id: 'stereochemistry',
    subject: 'Chemistry',
    chapter: 'Coordination Compounds',
    branch: 'Inorganic Chemistry',
    grade: '12th',
    unit: 'Unit 9',
    title: 'Stereoisomerism in Complexes',
    description: 'Master 3D molecular geometry. Visualize Cis/Trans, Fac/Mer isomers and perform the Mirror Test to understand Optical Isomerism and Chirality.',
    thumbnailIcon: 'box',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_coordination_stereoisomerism.png',
    youtubeVideoIds: ['CGpGpQ3bzLI'],
    coverImage: ''
  },

  // UNIT 2: ELECTROCHEMISTRY — CONDUCTANCE
  {
    id: 'conductance-concentration',
    subject: 'Chemistry',
    chapter: 'Electrochemistry',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit 2',
    title: 'Conductance vs Concentration',
    description: 'Drag the concentration slider and watch Λm rise steeply for weak CH₃COOH but gently for strong KCl/NaCl/HCl — tracing the NCERT Fig 2.6 Λm vs √c plot with live α and Ka from Kohlrausch equations.',
    thumbnailIcon: 'activity',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_conductance_concentration.svg',
    youtubeVideoIds: ['C26pH8kC_Wk'],
    coverImage: ''
  },

  // UNIT 2: ELECTROCHEMISTRY — NERNST
  {
    id: 'nernst-cell-potential',
    subject: 'Chemistry',
    chapter: 'Electrochemistry',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit 2',
    title: 'Cell Potential & Nernst Equation',
    description: 'Adjust ion concentrations in Daniell, Cu-Ag, Ni-Ag or Mg-Ag cells and watch E_cell update live via E = E° − (0.059/n)logQ, with ΔrG and Kc from NCERT Eqs 2.13–2.15.',
    thumbnailIcon: 'zap',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_nernst_potential.svg',
    youtubeVideoIds: ['sYLv5CLDgsE'],
    coverImage: ''
  },

  // UNIT 3: CHEMICAL KINETICS — RATE LAWS
  {
    id: 'rate-law-half-life',
    subject: 'Chemistry',
    chapter: 'Chemical Kinetics',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit 3',
    title: 'Rate Laws & Half-life',
    description: 'Animate zero-order ([R] = [R]₀−kt) and first-order ([R] = [R]₀e^−kt) decay curves. Watch successive half-lives shrink for zero order but stay constant for first order — NCERT Table 3.4 Eqs 3.6 and 3.14.',
    thumbnailIcon: 'activity',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_rate_law_half_life.svg',
    youtubeVideoIds: ['1MzZ12lV9rE'],
    coverImage: ''
  },

  // UNIT 7: ALCOHOLS, PHENOLS & ETHERS
  {
    id: 'alcohol-reactivity-hbonding',
    subject: 'Chemistry',
    chapter: 'Alcohols, Phenols and Ethers',
    branch: 'Organic Chemistry',
    grade: '12th',
    unit: 'Unit 7',
    title: 'Alcohol Reactivity & Hydrogen Bonding',
    description: 'Compare 1°/2°/3° alcohols in Lucas, dehydration, oxidation and Cu/573 K reactions side-by-side, and watch H-bonds explain why ethanol boils at 351 K while propane is a gas at room temperature.',
    thumbnailIcon: 'flask',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_alcohol_reactivity.svg',
    youtubeVideoIds: ['3N8aCwu4RbA'],
    coverImage: ''
  },

  // NCERT UNIT 8: ALDEHYDES, KETONES AND CARBOXYLIC ACIDS
  {
    id: 'aldehyde-ketone-reactivity',
    subject: 'Chemistry',
    chapter: 'Aldehydes, Ketones and Carboxylic Acids',
    branch: 'Organic Chemistry',
    grade: '12th',
    unit: 'Unit 8',
    title: 'Aldehyde vs Ketone Reactivity',
    description: 'Compare aldehydes and ketones in nucleophilic addition, watching steric crowding and alkyl-group electron donation explain why aldehydes are generally more reactive.',
    thumbnailIcon: 'flask',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_aldehyde_ketone.svg',
    youtubeVideoIds: ['hWmnXbfBnhc'],
    coverImage: ''
  },
  {
    id: 'carboxylic-acids-reactions-acidity',
    subject: 'Chemistry',
    chapter: 'Aldehydes, Ketones and Carboxylic Acids',
    branch: 'Organic Chemistry',
    grade: '12th',
    unit: 'Unit 8',
    title: 'Carboxylic Acids - Key Reactions and Acidity',
    description: 'Explore carboxylic acid acidity through carboxylate resonance and substituent effects, then connect the -COOH group to bicarbonate test, esterification, acid chloride formation, reduction, and decarboxylation.',
    thumbnailIcon: 'flask',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_carboxylic_acids.svg',
    youtubeVideoIds: ['sTaI7Hir1CE'],
    coverImage: ''
  },
  {
    id: 'basicity-of-amines',
    subject: 'Chemistry',
    chapter: 'Amines',
    branch: 'Organic Chemistry',
    grade: '12th',
    unit: 'Unit 9',
    title: 'Basicity of Amines',
    description: 'Compare gas-phase and aqueous-phase basicity trends of methyl and ethyl amines, then see why aniline is weaker through resonance and why pKb values reorder the amine series.',
    thumbnailIcon: 'flask',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_basicity_amines.svg',
    youtubeVideoIds: ['S2qlsxDX50o'],
    coverImage: ''
  },

  // UNIT 6: HALOALKANES
  {
    id: 'haloalkanes',
    subject: 'Chemistry',
    chapter: 'Haloalkanes and Haloarenes',
    branch: 'Organic Chemistry',
    grade: '12th',
    unit: 'Unit 10',
    title: 'SN1 vs SN2 Reactions',
    description: 'Compare nucleophilic substitution mechanisms. Visualize the backside attack, Walden inversion, and carbocation intermediates.',
    thumbnailIcon: 'flask',
    thumbnailUrl: '/images/thumbnails/12th-chemistry/thumb_haloalkanes_sn1_sn2.png',
    youtubeVideoIds: ['yAjEqu--LVs'],
    coverImage: ''
  },

  // BIOLOGY: ANGIOSPERMS
  {
    id: 'angiosperms-double-fertilisation-seed-development',
    subject: 'Biology',
    category: 'Plant Kingdom',
    chapter: 'Plant Kingdom; Morphology of Flowering Plants',
    branch: 'Botany',
    grade: '12th',
    unit: 'Unit 1',
    title: 'Double Fertilisation & Endosperm Formation',
    description: 'Visualize pollen tube growth, the two fusion events of angiosperms, and how endosperm supports seed development in maize and pea.',
    thumbnailIcon: 'activity',
    thumbnailUrl: '/images/thumbnails/12th-biology/thumb_angiosperms_double_fertilisation.png',
    youtubeVideoIds: ['bUjVHUf4d1I'],
    coverImage: ''
  },
  {
    id: 'gametogenesis-hormonal-regulation',
    subject: 'Biology',
    category: 'Human Physiology',
    chapter: 'Structural Organisation in Animals; Chemical Coordination and Integration',
    branch: 'Human Physiology',
    grade: '12th',
    unit: 'Unit 2',
    title: 'Spermatogenesis & Oogenesis',
    description: 'Explore how pituitary FSH and LH regulate sperm formation, follicle maturation, ovulation, and reproductive hormone levels.',
    thumbnailIcon: 'activity',
    thumbnailUrl: '/images/thumbnails/12th-biology/thumb_gametogenesis_hormonal_regulation.png',
    youtubeVideoIds: ['OUB92jUjsq8'],
    coverImage: ''
  },
  {
    id: 'pregnancy-hormonal-control-rh-incompatibility',
    subject: 'Biology',
    category: 'Human Physiology',
    chapter: 'Body Fluids and Circulation; Chemical Coordination and Integration',
    branch: 'Human Physiology',
    grade: '12th',
    unit: 'Unit 2',
    title: 'Implantation & Placenta Formation',
    description: 'Explore progesterone support of pregnancy, placental blood separation, Rh exposure at delivery, antibody memory, and anti-Rh prevention.',
    thumbnailIcon: 'activity',
    thumbnailUrl: '/images/thumbnails/12th-biology/thumb_pregnancy_rh_incompatibility.png',
    youtubeVideoIds: ['s-Xpa5UZAZs'],
    coverImage: ''
  }

];
