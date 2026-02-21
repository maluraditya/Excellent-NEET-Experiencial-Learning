import { Topic } from '../../../types';

export const TOPICS_11TH: Topic[] = [
    {
        id: 'mechanical-properties-solids',
        title: 'Mechanical Properties of Solids',
        subject: 'Physics',
        unit: 'Chapter 8',
        chapter: 'Mechanical Properties of Solids',
        description: 'Explore elasticity, stress-strain curves, and Young\'s Modulus through interactive tensile testing of various materials.',
        thumbnailIcon: 'Activity', // Lucide icon name to be matched in Dashboard
        branch: 'Mechanics',
        grade: '11th',
        youtubeVideoIds: ['video1', 'video2'] // Placeholders as none provided yet
    },
    {
        id: 'fluid-dynamics',
        title: 'Bernoulli’s Principle and its Applications',
        subject: 'Physics',
        unit: 'Chapter 9',
        chapter: 'Mechanical Properties of Fluids',
        description: 'Explore the Equation of Continuity and Bernoulli\'s Principle with an interactive Venturi tube and virtual wind tunnel.',
        thumbnailIcon: 'wind', // Will map to 'wind' icon in Dashboard
        branch: 'Mechanics',
        grade: '11th',
        youtubeVideoIds: [] // Add videos later if needed
    },
    {
        id: 'pascals-law',
        title: 'Pascal\'s Law and Hydraulic Machines',
        subject: 'Physics',
        unit: 'Chapter 9',
        chapter: 'Mechanical Properties of Fluids',
        description: 'Experience Pascal\'s Law through an interactive hydraulic disc brake. Learn about force multiplication, pressure transmission, and the conservation of energy.',
        thumbnailIcon: 'Activity',
        branch: 'Mechanics',
        grade: '11th',
        youtubeVideoIds: []
    },
    {
        id: 'carnot-engine',
        title: 'Carnot Engine and Carnot Cycle',
        subject: 'Physics',
        unit: 'Chapter 11',
        chapter: 'Thermodynamics',
        description: 'Build the Carnot Cycle step-by-step on a P-V diagram. Explore isothermal and adiabatic processes, and understand the theoretical maximum efficiency of heat engines.',
        thumbnailIcon: 'Activity',
        branch: 'Thermodynamics',
        grade: '11th',
        youtubeVideoIds: []
    },
    {
        id: 'thermodynamic-processes',
        title: 'First Law of Thermodynamics and Thermodynamic Processes',
        subject: 'Physics',
        unit: 'Chapter 11',
        chapter: 'Thermodynamics',
        description: 'Perform isothermal, adiabatic, isobaric, and isochoric processes on an interactive gas cylinder. Observe how Heat (Q), Work (W), and Internal Energy (ΔU) relate through the First Law.',
        thumbnailIcon: 'Activity',
        branch: 'Thermodynamics',
        grade: '11th',
        youtubeVideoIds: []
    },
    {
        id: 'kinetic-theory',
        title: 'Pressure of an Ideal Gas (Kinetic Theory)',
        subject: 'Physics',
        unit: 'Chapter 12',
        chapter: 'Kinetic Theory',
        description: 'Visualize how billions of molecular collisions create gas pressure. Adjust Temperature, Volume, and molecule count to validate P = ⅓nm⟨v²⟩.',
        thumbnailIcon: 'Activity',
        branch: 'Statistical Mechanics',
        grade: '11th',
        youtubeVideoIds: []
    },
    {
        id: 'equipartition',
        title: 'Degrees of Freedom and Equipartition of Energy',
        subject: 'Physics',
        unit: 'Chapter 12',
        chapter: 'Kinetic Theory',
        description: 'Switch between Monatomic, Diatomic, and Polyatomic gases. Watch how energy partitions equally across translation, rotation, and vibration — explaining why complex gases have higher specific heats.',
        thumbnailIcon: 'Activity',
        branch: 'Statistical Mechanics',
        grade: '11th',
        youtubeVideoIds: []
    }
];
