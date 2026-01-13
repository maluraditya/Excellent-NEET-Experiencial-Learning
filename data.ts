
import { Topic } from './types';

export const TOPICS: Topic[] = [
  // UNIT 1: SOLID STATE
  {
    id: 'solids_classification',
    subject: 'Chemistry',
    chapter: 'The Solid State',
    branch: 'Physical Chemistry',
    unit: 'Unit 1',
    title: 'Classification of Solids',
    description: 'Distinguish between Molecular, Ionic, Metallic, and Covalent solids. Test their properties like conductivity, malleability, and brittleness in a virtual lab.',
    thumbnailIcon: 'cuboid',
    youtubeVideoIds: ['7b34XYgADlM']
  },
  {
    id: 'unit_cells',
    subject: 'Chemistry',
    chapter: 'The Solid State',
    branch: 'Physical Chemistry',
    unit: 'Unit 1',
    title: 'Unit Cells & Atomic Count',
    description: 'Visualize Simple Cubic, BCC, and FCC lattices. Use the "Slicer" tool to see how atoms are shared between adjacent cells and calculate Z.',
    thumbnailIcon: 'grid',
    youtubeVideoIds: ['7b34XYgADlM']
  },
  {
    id: 'packing',
    subject: 'Chemistry',
    chapter: 'The Solid State',
    branch: 'Physical Chemistry',
    unit: 'Unit 1',
    title: 'Packing Efficiency',
    description: 'Compare void spaces in SCC, BCC, and FCC lattices. Derive the radius relationships and understand why FCC is the most efficient structure.',
    thumbnailIcon: 'percent',
    youtubeVideoIds: ['7b34XYgADlM']
  },
  {
    id: 'defects',
    subject: 'Chemistry',
    chapter: 'The Solid State',
    branch: 'Physical Chemistry',
    unit: 'Unit 1',
    title: 'Point Defects',
    description: 'Create Frenkel and Schottky defects in an ionic crystal grid. Observe the effects on density and electrical neutrality.',
    thumbnailIcon: 'alert',
    youtubeVideoIds: ['7b34XYgADlM']
  },

  // UNIT 2: ELECTROCHEMISTRY
  {
    id: 'electrochemistry',
    subject: 'Chemistry',
    chapter: 'Electrochemistry',
    branch: 'Physical Chemistry',
    unit: 'Unit 2',
    title: 'Galvanic vs. Electrolytic Cells',
    description: 'Visualize the flow of ions and electrons in spontaneous and non-spontaneous electrochemical cells. Control the voltage to reverse the reaction.',
    thumbnailIcon: 'zap',
    youtubeVideoIds: ['7b34XYgADlM']
  },

  // UNIT 3: KINETICS
  {
    id: 'kinetics',
    subject: 'Chemistry',
    chapter: 'Chemical Kinetics',
    branch: 'Physical Chemistry',
    unit: 'Unit 3',
    title: 'Collision Theory & Activation Energy',
    description: 'Explore the microscopic criteria for chemical reactions: energy barriers and molecular orientation. Visualize how temperature affects reaction rates.',
    thumbnailIcon: 'activity',
    youtubeVideoIds: ['7b34XYgADlM']
  },

  // UNIT 4: INORGANIC & POLYMERS
  {
    id: 'dblock',
    subject: 'Chemistry',
    chapter: 'The d- and f-Block Elements',
    branch: 'Inorganic Chemistry',
    unit: 'Unit 4',
    title: 'Magnetic Properties & Color',
    description: 'Connect electron configuration to bulk properties. Visualize Crystal Field Splitting, d-d transitions, and calculate Magnetic Moment.',
    thumbnailIcon: 'magnet', 
    youtubeVideoIds: ['7b34XYgADlM']
  },
  {
    id: 'polymers',
    subject: 'Chemistry',
    chapter: 'Polymers & Catalysis',
    branch: 'Organic Chemistry',
    unit: 'Unit 4',
    title: 'Polymerization & Conductivity',
    description: 'Understand Ziegler-Natta catalysis for chain growth and explore how conjugated organic polymers can conduct electricity like metals.',
    thumbnailIcon: 'layers',
    youtubeVideoIds: ['7b34XYgADlM']
  },

  // UNIT 5: COORDINATION
  {
    id: 'stereochemistry',
    subject: 'Chemistry',
    chapter: 'Coordination Chemistry',
    branch: 'Inorganic Chemistry',
    unit: 'Unit 5',
    title: 'Stereoisomerism in Complexes',
    description: 'Master 3D molecular geometry. Visualize Cis/Trans, Fac/Mer isomers and perform the Mirror Test to understand Optical Isomerism and Chirality.',
    thumbnailIcon: 'box',
    youtubeVideoIds: ['7b34XYgADlM']
  },

  // UNIT 6: HALOALKANES
  {
    id: 'haloalkanes',
    subject: 'Chemistry',
    chapter: 'Haloalkanes and Haloarenes',
    branch: 'Organic Chemistry',
    unit: 'Unit 6',
    title: 'SN1 vs SN2 Reactions',
    description: 'Compare nucleophilic substitution mechanisms. Visualize the backside attack, Walden inversion, and carbocation intermediates.',
    thumbnailIcon: 'flask',
    youtubeVideoIds: ['7b34XYgADlM']
  }
];
