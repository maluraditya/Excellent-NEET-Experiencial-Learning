
import { Topic } from '../../../types';

export const TOPICS: Topic[] = [
  // --- PHYSICS UNIT VI & VII & VIII & IX ---
  {
    id: 'emi',
    subject: 'Physics',
    chapter: 'Electromagnetic Induction',
    branch: 'Electromagnetism',
    grade: '12th',
    unit: 'Unit VI',
    title: 'Faraday’s Law & AC Generator',
    description: 'Visualize a rotating coil in a magnetic field. See how changing flux induces an EMF (ϵ = -dΦ/dt) and generates sinusoidal AC voltage.',
    thumbnailIcon: 'magnet',
    youtubeVideoIds: ['F5vcvOA3Bbg'],
    coverImage: '/images/emi_cover.png'
  },
  {
    id: 'ac',
    subject: 'Physics',
    chapter: 'Alternating Current',
    branch: 'Electromagnetism',
    grade: '12th',
    unit: 'Unit VI',
    title: 'The Transformer',
    description: 'Experiment with Step-up and Step-down transformers. Adjust primary/secondary turns to change voltage/current ratios while conserving power.',
    thumbnailIcon: 'zap',
    youtubeVideoIds: ['ZJWEnIyVRUw'],
    coverImage: '/images/transformer_cover.png'
  },
  {
    id: 'em_waves',
    subject: 'Physics',
    chapter: 'Electromagnetic Waves',
    branch: 'Electromagnetism',
    grade: '12th',
    unit: 'Unit VII',
    title: 'EM Wave Propagation',
    description: 'See how an oscillating charge generates self-sustaining Electric and Magnetic fields. Visualize the transverse nature of EM waves in 3D.',
    thumbnailIcon: 'activity',
    youtubeVideoIds: ['8y9v1bM71fI'],
    coverImage: '/images/em_waves_cover.png'
  },
  {
    id: 'ray_optics',
    subject: 'Physics',
    chapter: 'Ray Optics',
    branch: 'Optics',
    grade: '12th',
    unit: 'Unit VI',
    title: 'Lenses, Prisms & Instruments',
    description: 'Ray tracing for convex/concave lenses and prisms. Explore image formation in Microscopes and Telescopes.',
    thumbnailIcon: 'microscope', // Need to ensure Dashboard handles this, or falls back
    youtubeVideoIds: ['jM3Zc6xYyVk'],
    coverImage: '/images/ray_optics_cover.png'
  },
  {
    id: 'wave_optics',
    subject: 'Physics',
    chapter: 'Wave Optics',
    branch: 'Optics',
    grade: '12th',
    unit: 'Unit VI',
    title: 'Interference & Diffraction',
    description: 'Observe the wave nature of light. Simulate Young’s Double Slit Experiment (YDSE) fringes and Diffraction patterns.',
    thumbnailIcon: 'layers',
    youtubeVideoIds: ['n2y7nWXr5q8'],
    coverImage: '/images/wave_optics_cover.png'
  },
  {
    id: 'dual_nature',
    subject: 'Physics',
    chapter: 'Dual Nature of Radiation',
    branch: 'Modern Physics',
    grade: '12th',
    unit: 'Unit VII',
    title: 'Photoelectric Effect',
    description: 'Prove the particle nature of light. Hit metals with photons of different frequencies to eject electrons (if hν > Φ).',
    thumbnailIcon: 'sun',
    youtubeVideoIds: ['kYJjI4T8Z3I', 'i9YyI-d_4-k'],
    coverImage: '/images/photoelectric_cover.png'
  },
  {
    id: 'atoms',
    subject: 'Physics',
    chapter: 'Atoms',
    branch: 'Modern Physics',
    grade: '12th',
    unit: 'Unit VIII',
    title: 'Alpha Scattering Experiment',
    description: 'Recreate Rutherford’s gold foil experiment. Fire alpha particles at a nucleus and observe deflection angles based on impact parameter.',
    thumbnailIcon: 'atom',
    youtubeVideoIds: ['WEPMwhNsLbU'],
    coverImage: '/images/atoms_cover.png'
  },
  {
    id: 'semiconductors',
    subject: 'Physics',
    chapter: 'Semiconductor Electronics',
    branch: 'Electronics',
    grade: '12th',
    unit: 'Unit IX',
    title: 'Formation of P-N Junction',
    description: 'Join p-type and n-type materials. Watch diffusion create a Depletion Region and Barrier Potential that controls current flow.',
    thumbnailIcon: 'grid',
    youtubeVideoIds: ['BHA4teZmwT0'],
    coverImage: '/images/semiconductors_cover.png'
  },

  // UNIT 1: SOLID STATE
  {
    id: 'solids_classification',
    subject: 'Chemistry',
    chapter: 'The Solid State',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit I',
    title: 'Classification of Solids',
    description: 'Distinguish between Molecular, Ionic, Metallic, and Covalent solids. Test their properties like conductivity, malleability, and brittleness in a virtual lab.',
    thumbnailIcon: 'cuboid',
    youtubeVideoIds: ['O82d8aiIS5Y'],
    coverImage: '/images/solids_classification.png'
  },
  {
    id: 'unit_cells',
    subject: 'Chemistry',
    chapter: 'The Solid State',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit I',
    title: 'Unit Cells & Atomic Count',
    description: 'Visualize Simple Cubic, BCC, and FCC lattices. Use the "Slicer" tool to see how atoms are shared between adjacent cells and calculate Z.',
    thumbnailIcon: 'grid',
    youtubeVideoIds: ['tUkj8UNzbyA'],
    coverImage: '/images/unit_cells.png'
  },
  {
    id: 'packing',
    subject: 'Chemistry',
    chapter: 'The Solid State',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit I',
    title: 'Packing Efficiency',
    description: 'Compare void spaces in SCC, BCC, and FCC lattices. Derive the radius relationships and understand why FCC is the most efficient structure.',
    thumbnailIcon: 'percent',
    youtubeVideoIds: ['HCWwRh5CXYU'],
    coverImage: '/images/packing.png'
  },
  {
    id: 'defects',
    subject: 'Chemistry',
    chapter: 'The Solid State',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit I',
    title: 'Point Defects',
    description: 'Create Frenkel and Schottky defects in an ionic crystal grid. Observe the effects on density and electrical neutrality.',
    thumbnailIcon: 'alert',
    youtubeVideoIds: ['tfG9gr_skxA'],
    coverImage: '/images/defects.png'
  },

  // UNIT 2: ELECTROCHEMISTRY
  {
    id: 'electrochemistry',
    subject: 'Chemistry',
    chapter: 'Electrochemistry',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit II',
    title: 'Galvanic vs. Electrolytic Cells',
    description: 'Visualize the flow of ions and electrons in spontaneous and non-spontaneous electrochemical cells. Control the voltage to reverse the reaction.',
    thumbnailIcon: 'zap',
    youtubeVideoIds: ['HVV1KNmJWh4'],
    coverImage: '/images/electrochemistry.png'
  },

  // UNIT 3: KINETICS
  {
    id: 'kinetics',
    subject: 'Chemistry',
    chapter: 'Chemical Kinetics',
    branch: 'Physical Chemistry',
    grade: '12th',
    unit: 'Unit III',
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
    unit: 'Unit IV',
    title: 'Magnetic Properties & Color',
    description: 'Connect electron configuration to bulk properties. Visualize Crystal Field Splitting, d-d transitions, and calculate Magnetic Moment.',
    thumbnailIcon: 'magnet',
    youtubeVideoIds: ['dAMUQg6h2bg'],
    coverImage: '/images/dblock.png'
  },
  {
    id: 'polymers',
    subject: 'Chemistry',
    chapter: 'Polymers & Catalysis',
    branch: 'Organic Chemistry',
    grade: '12th',
    unit: 'Unit IV',
    title: 'Polymerization & Conductivity',
    description: 'Understand Ziegler-Natta catalysis for chain growth and explore how conjugated organic polymers can conduct electricity like metals.',
    thumbnailIcon: 'layers',
    youtubeVideoIds: ['FnmL0NuoClQ'],
    coverImage: '/images/polymers.png'
  },

  // UNIT 5: COORDINATION
  {
    id: 'stereochemistry',
    subject: 'Chemistry',
    chapter: 'Coordination Chemistry',
    branch: 'Inorganic Chemistry',
    grade: '12th',
    unit: 'Unit V',
    title: 'Stereoisomerism in Complexes',
    description: 'Master 3D molecular geometry. Visualize Cis/Trans, Fac/Mer isomers and perform the Mirror Test to understand Optical Isomerism and Chirality.',
    thumbnailIcon: 'box',
    youtubeVideoIds: ['gNcczQRR0WQ'],
    coverImage: '/images/stereochemistry.png'
  },

  // UNIT 6: HALOALKANES
  {
    id: 'haloalkanes',
    subject: 'Chemistry',
    chapter: 'Haloalkanes and Haloarenes',
    branch: 'Organic Chemistry',
    grade: '12th',
    unit: 'Unit VI',
    title: 'SN1 vs SN2 Reactions',
    description: 'Compare nucleophilic substitution mechanisms. Visualize the backside attack, Walden inversion, and carbocation intermediates.',
    thumbnailIcon: 'flask',
    youtubeVideoIds: ['yrvV85H737o'],
    coverImage: '/images/haloalkanes.png'
  },

  // UNIT 7: GENETICS (BIOLOGY)
  {
    id: 'genetics_assortment',
    subject: 'Biology',
    chapter: 'Genetics and Evolution',
    branch: 'Genetics',
    grade: '12th',
    unit: 'Unit VII',
    title: 'Mendel’s Law of Independent Assortment',
    description: 'Explore the Dihybrid Cross (Peas) and probabilities. Visualize the 9:3:3:1 ratio with an interactive Punnett Square.',
    thumbnailIcon: 'grid',
    youtubeVideoIds: ['7b34XYgADlM'],
    coverImage: '/images/genetics_independent_assortment.png'
  },
  {
    id: 'genetics_linkage',
    subject: 'Biology',
    category: 'Genetics',
    grade: '12th',
    unit: 'Unit VII',
    chapter: 'Principles of Inheritance and Variation',
    branch: 'Zoology', // Drosophila usually falls under Zoology context, or just general Genetics
    title: 'Linkage and Crossing Over',
    description: 'Discover how physical association of genes on a chromosome violates Mendel’s laws. Experiment with Morgan’s Drosophila crosses and genetic mapping.',
    thumbnailIcon: 'activity',
    coverImage: '/images/genetics_linkage.png',
    youtubeVideoIds: ['8vj9e1DQ3aA']
  },
  {
    id: 'transcription',
    subject: 'Biology',
    category: 'Genetics',
    grade: '12th',
    unit: 'Unit VII',
    chapter: 'Molecular Basis of Inheritance',
    branch: 'Genetics',
    title: 'Transcription: Prokaryotes vs Eukaryotes',
    description: 'Compare the simplicity of Prokaryotic transcription with the complexity of Eukaryotic "Post-transcriptional Processing" (Splicing, Capping, Tailing).',
    thumbnailIcon: 'file-text',
    coverImage: '/images/transcription.png',
    youtubeVideoIds: ['JQP_yTeK-s']
  },
  {
    id: 'lac_operon',
    subject: 'Biology',
    category: 'Genetics',
    grade: '12th',
    unit: 'Unit VII',
    chapter: 'Molecular Basis of Inheritance',
    branch: 'Genetics',
    title: 'Lac Operon',
    description: 'Understand gene regulation in E. coli. See how the Repressor and Inducer (Lactose) act like a "Master Key" to switch genes on and off.',
    thumbnailIcon: 'lock',
    coverImage: '/images/lac_operon.png',
    youtubeVideoIds: ['h_1QLdtF8d0']
  },
  {
    id: 'replication_fork',
    subject: 'Biology',
    category: 'Genetics',
    grade: '12th',
    unit: 'Unit VII',
    chapter: 'Molecular Basis of Inheritance',
    branch: 'Genetics',
    title: 'Machinery of Transcription (Replication Fork)',
    description: 'Visualize the unzipping of DNA. Compare the continuous "Leading Strand" with the discontinuous "Lagging Strand" (Okazaki fragments).',
    thumbnailIcon: 'git-branch',
    coverImage: '/images/replication_fork.png',
    youtubeVideoIds: ['TNKWgcFPHqw']
  },
  {
    id: 'rnai',
    subject: 'Biology',
    category: 'Biotechnology',
    grade: '12th',
    unit: 'Unit IX',
    chapter: 'Biotechnology and Its Applications',
    branch: 'Botany', // Often applied in plants (tobacco)
    title: 'RNA Interference (RNAi)',
    description: 'Explore this cellular defense mechanism. Use dsRNA as a "Censor Tape" to silence parasitic mRNA and protect the host.',
    thumbnailIcon: 'shield-off',
    coverImage: '/images/rnai.png',
    youtubeVideoIds: ['cK-OGB1_ELE']
  },
  {
    id: 'ti_plasmid',
    subject: 'Biology',
    category: 'Biotechnology',
    grade: '12th',
    unit: 'Unit IX',
    chapter: 'Principles and Processes',
    branch: 'Botany',
    title: 'Agrobacterium & Ti Plasmid',
    description: 'The natural genetic engineer. Learn how scientists disarm the Ti Plasmid to deliver beneficial genes like a "Trojan Horse".',
    thumbnailIcon: 'truck',
    coverImage: '/images/ti_plasmid.png',
    youtubeVideoIds: ['U-i2f_J4z9g']
  }
];
