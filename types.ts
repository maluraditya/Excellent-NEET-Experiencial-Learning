
export enum MoleculeState {
  REACTANT = 'REACTANT',
  ACTIVATED_COMPLEX = 'ACTIVATED_COMPLEX',
  PRODUCT = 'PRODUCT'
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  state: MoleculeState;
  angle: number; // For orientation
  energy: number;
}

export interface SimulationConfig {
  temperature: number; // Kelvin, affects speed
  activationEnergy: number; // Threshold for reaction
  stericFactor: number; // Probability factor (0-1)
  moleculeCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// Navigation Types
export type Screen = 'DASHBOARD' | 'TOPIC_VIEW';
export type Subject = 'Physics' | 'Chemistry' | 'Biology';

export interface Topic {
  id: string;
  title: string;
  subject: Subject;
  category?: string; // Optional sub-category
  chapter: string;
  description: string;
  thumbnailIcon: string;
  thumbnailUrl?: string; // Optional URL for custom thumbnail images
  imageUrl?: string; // For AI generated image
  coverImage?: string; // Static override
  youtubeVideoIds: string[]; // For embedded videos

  // Tags
  branch: 'Physical Chemistry' | 'Inorganic Chemistry' | 'Organic Chemistry' | 'Mechanics' | 'Electromagnetism' | 'Thermodynamics' | 'Statistical Mechanics' | 'Oscillations' | 'Genetics' | 'Botany' | 'Zoology' | 'Optics' | 'Modern Physics' | 'Electronics';
  unit: string;
  grade: '11th' | '12th';
}

export type Grade = '11th' | '12th';
