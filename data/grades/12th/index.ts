
import { Topic } from '../../../types';

export const TOPICS: Topic[] = [
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
    youtubeVideoIds: ['K95wcRVwh80'],
    coverImage: '/images/emi_cover.png'
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
    youtubeVideoIds: ['zf8vnCcETqM'],
    coverImage: '/images/transformer_cover.png'
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
    youtubeVideoIds: ['p0AwOTqgTTk'],
    coverImage: '/images/em_waves_cover.png'
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
    youtubeVideoIds: ['1R5vH6KIpIk'],
    coverImage: '/images/ray_optics_cover.png'
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
    youtubeVideoIds: ['X_NMkbbb974'],
    coverImage: '/images/wave_optics_cover.png'
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
    youtubeVideoIds: ['SgXW4foFGpw'],
    coverImage: '/images/photoelectric_cover.png'
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
    youtubeVideoIds: ['QmRFtM08F4A'],
    coverImage: '/images/atoms_cover.png'
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
    youtubeVideoIds: ['qu9reCzzrco'],
    coverImage: '/images/semiconductors_cover.png'
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
    youtubeVideoIds: ['cNs7CPevcYs'],
    coverImage: '/images/electrochemistry.png'
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
    youtubeVideoIds: ['wbGgIfHsx-I'],
    coverImage: '/images/kinetics.png'
  },

  // UNIT 4: INORGANIC & POLYMERS
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
    youtubeVideoIds: ['LzZWHSdYaxw'],
    coverImage: '/images/dblock.png'
  },
  {
    id: 'polymers',
    subject: 'Chemistry',
    chapter: 'Polymers',
    branch: 'Organic Chemistry',
    grade: '12th',
    unit: 'Unit 15',
    title: 'Polymerization & Conductivity',
    description: 'Understand Ziegler-Natta catalysis for chain growth and explore how conjugated organic polymers can conduct electricity like metals.',
    thumbnailIcon: 'layers',
    youtubeVideoIds: ['AEGd8Ky9B3U'],
    coverImage: '/images/polymers.png'
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
    youtubeVideoIds: ['CGpGpQ3bzLI'],
    coverImage: '/images/stereochemistry.png'
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
    youtubeVideoIds: ['yAjEqu--LVs'],
    coverImage: '/images/haloalkanes.png'
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
    youtubeVideoIds: [],
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
    youtubeVideoIds: [],
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
    youtubeVideoIds: [],
    coverImage: ''
  }

];
