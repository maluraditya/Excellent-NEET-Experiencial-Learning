
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
  chapter: string;
  description: string;
  thumbnailIcon: string; 
  imageUrl?: string; // For AI generated image
  youtubeVideoIds: string[]; // For embedded videos
  
  // Tags
  branch: 'Physical Chemistry' | 'Inorganic Chemistry' | 'Organic Chemistry' | 'Mechanics' | 'Electromagnetism' | 'Genetics' | 'Botany' | 'Zoology';
  unit: string;
}
