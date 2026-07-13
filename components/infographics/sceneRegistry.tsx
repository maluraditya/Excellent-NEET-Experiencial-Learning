import React from 'react';
import ImageScene from './scenes/ImageScene';
import { GENERATED_TOPIC_INFOGRAPHICS } from './generatedTopicInfographics';

export interface InfographicSceneEntry {
  id: string;
  label: string;
  description: string;
  node: React.ReactNode;
}

/**
 * Full-screen "scene" infographics: one image per topic that fills the
 * smartboard (as opposed to the legacy sidebar block panels). Keyed by topic.id.
 * Each entry points at a static image placed in /public/infographics/.
 * TopicLayoutContainer prefers a scene over the legacy panel when one exists.
 */
const imageEntry = (id: string, label: string, description: string, src: string, alt: string): InfographicSceneEntry => ({
  id,
  label,
  description,
  node: <ImageScene src={src} alt={alt} />,
});

const class11PhysicsEntries = [
  ['dimensional-analysis', 'Dimensional Analysis', 'Units, dimensions, homogeneity checks, and formula consistency.'],
  ['position-velocity-acceleration-graphs', 'Motion Graphs', 'Position-time, velocity-time, acceleration-time graphs, slopes, and areas.'],
  ['projectile-motion', 'Projectile Motion', 'Vector resolution, parabolic path, range, time of flight, and maximum height.'],
  ['static-kinetic-friction', 'Friction', 'Static friction, kinetic friction, limiting friction, and angle of repose.'],
  ['newtons-laws-of-motion', "Newton's Laws", 'Inertia, force as rate of change of momentum, impulse, and action-reaction.'],
  ['conservation-of-momentum', 'Momentum', 'Vector momentum conservation, collisions, recoil, and impulse.'],
  ['work-energy-theorem', 'Work-Energy', 'Work, kinetic energy, power, and the work-energy theorem.'],
  ['conservation-mechanical-energy', 'Mechanical Energy', 'Kinetic energy, potential energy, conservative forces, and K + U conservation.'],
  ['conservation-of-angular-momentum', 'Angular Momentum', 'Angular momentum, torque, moment of inertia, and conservation when external torque is zero.'],
  ['centre-of-mass-torque', 'COM & Torque', 'Centre of mass, lever arm, torque, and equilibrium conditions.'],
  ['moment-of-inertia', 'Moment of Inertia', 'Mass distribution, rotational inertia, radius of gyration, and rotational kinetic energy.'],
  ['keplers-laws-planetary-motion', "Kepler's Laws", 'Elliptical orbits, equal areas, period-radius relation, and gravitation links.'],
  ['mechanical-properties-solids', 'Solids', 'Stress, strain, Young modulus, elastic limit, and stress-strain behaviour.'],
  ['stokes-law', "Stokes' Law", 'Viscous drag, buoyancy, and terminal velocity of a sphere in a fluid.'],
  ['fluid-dynamics', "Bernoulli's Principle", 'Continuity, Bernoulli equation, streamlines, and ideal-flow applications.'],
  ['pascals-law', "Pascal's Law", 'Fluid pressure, hydraulic multiplication, depth pressure, and enclosed-fluid transmission.'],
  ['surface-tension', 'Surface Tension', 'Surface tension, angle of contact, capillarity, drops, and wetting.'],
  ['thermal-expansion-calorimetry', 'Thermal Properties', 'Thermal expansion, calorimetry, heat balance, and phase-change ideas.'],
  ['heat-transfer-blackbody-radiation', 'Heat Transfer', 'Conduction, convection, radiation, blackbody ideas, and thermal applications.'],
  ['zeroth-law', 'Zeroth Law', 'Thermal equilibrium, temperature measurement, and thermometer logic.'],
  ['thermodynamic-processes', 'First Law', 'First law, internal energy, work, heat, and thermodynamic processes.'],
  ['carnot-engine', 'Carnot Engine', 'Carnot cycle, heat-engine efficiency, reservoirs, and second-law limit.'],
  ['kinetic-theory', 'Kinetic Theory', 'Ideal gas equation, molecular collisions, gas pressure, and rms speed.'],
  ['mean-free-path', 'Mean Free Path', 'Molecular collisions, number density, collision path length, and diffusion.'],
  ['equipartition', 'Equipartition', 'Degrees of freedom, energy modes, specific heats, and gamma.'],
  ['shm-spring', 'Spring SHM', 'Spring-mass SHM, restoring force, phase, period, and energy exchange.'],
  ['simple-pendulum', 'Simple Pendulum', 'Small-angle SHM, length dependence, gravity dependence, and period.'],
  ['wave-motion', 'Wave Motion', 'Progressive waves, transverse and longitudinal waves, speed, wavelength, and frequency.'],
  ['standing-waves', 'Standing Waves', 'Superposition, reflection, nodes, antinodes, resonance, and normal modes.'],
] as const;

const SCENES: Record<string, InfographicSceneEntry[]> = {
  ...Object.fromEntries(
    GENERATED_TOPIC_INFOGRAPHICS.map((entry) => [
      entry.topicId,
      [
        imageEntry(
          `${entry.topicId}-generated-overview`,
          entry.label,
          entry.description,
          entry.src,
          entry.alt
        ),
      ],
    ])
  ),
  ...Object.fromEntries(
    class11PhysicsEntries.map(([topicId, label, description]) => [
      topicId,
      [
        imageEntry(
          `${topicId}-overview`,
          label,
          description,
          `/infographics/11th-physics/${topicId}.png`,
          `${label} infographic`
        ),
      ],
    ])
  ),
  'magnetism-and-matter': [
    imageEntry(
      'magnetism-matter-overview',
      'Magnetism & Matter',
      'Bar magnets, magnetic dipoles, torque, Gauss law for magnetism, and magnetic materials.',
      '/infographics/magnetism-and-matter.png',
      'Magnetism and Matter infographic'
    ),
  ],
  'moving-charges-magnetism': [
    imageEntry(
      'moving-charges-overview',
      'Moving Charges',
      'Magnetic force, right-hand rule, circular motion, velocity selector, and cyclotron ideas.',
      '/infographics/moving-charges-magnetism.png',
      'Moving Charges and Magnetism infographic'
    ),
  ],
  'electric-charges-fields': [
    imageEntry(
      'charges-fields-overview',
      'Charges & Fields',
      'Coulomb law, field lines, flux, Gauss law, and dipoles.',
      '/infographics/electric-charges-fields.png',
      'Electric Charges and Fields infographic'
    ),
  ],
  'electrostatic-potential-capacitance': [
    imageEntry(
      'potential-capacitance-overview',
      'Potential & Capacitance',
      'Potential energy, equipotentials, capacitors, dielectrics, and stored energy.',
      '/infographics/electrostatic-potential-capacitance.png',
      'Electrostatic Potential and Capacitance infographic'
    ),
  ],
  'current-electricity': [
    imageEntry(
      'current-electricity-overview',
      'Current Electricity',
      'Ohm law, drift velocity, resistivity, Kirchhoff rules, and bridges.',
      '/infographics/current-electricity.png',
      'Current Electricity infographic'
    ),
  ],
  emi: [
    imageEntry(
      'faraday-lenz-overview',
      'Faraday & Lenz',
      'Magnetic flux, induced emf, Lenz law, and AC generator.',
      '/infographics/emi-faraday.png',
      "Faraday's Law of Electromagnetic Induction and Lenz's Law infographic"
    ),
  ],
  ac: [
    imageEntry(
      'ac-transformer-overview',
      'AC & Transformer',
      'RMS values, reactance, impedance, resonance, power factor, and transformer law.',
      '/infographics/alternating-current-transformer.png',
      'Alternating Current and Transformer infographic'
    ),
  ],
  em_waves: [
    imageEntry(
      'em-waves-overview',
      'EM Waves',
      'Displacement current, transverse electric and magnetic fields, wave speed, and EM spectrum.',
      '/infographics/electromagnetic-waves.png',
      'Electromagnetic Waves infographic'
    ),
  ],
  ray_optics: [
    imageEntry(
      'ray-optics-overview',
      'Ray Optics',
      'Reflection, refraction, total internal reflection, lenses, prisms, and optical instruments.',
      '/infographics/ray-optics.png',
      'Ray Optics infographic'
    ),
  ],
  wave_optics: [
    imageEntry(
      'wave-optics-overview',
      'Wave Optics',
      'Huygens principle, coherent sources, YDSE, interference, fringe width, and diffraction.',
      '/infographics/wave-optics.png',
      'Wave Optics infographic'
    ),
  ],
  polarisation: [
    imageEntry(
      'polarisation-overview',
      'Polarisation',
      'Transverse light waves, polaroids, analyser rotation, Malus law, and real-world uses.',
      '/infographics/polarisation.png',
      'Polarisation of Light infographic'
    ),
  ],
  dual_nature: [
    imageEntry(
      'photoelectric-effect',
      'Photoelectric Effect',
      'Threshold frequency, stopping potential, photon energy, and Einstein equation.',
      '/infographics/photoelectric-effect.png',
      'Photoelectric Effect infographic'
    ),
  ],
  atoms: [
    imageEntry(
      'alpha-scattering',
      'Alpha Scattering',
      'Geiger-Marsden experiment, Rutherford nuclear model, and empty-space conclusion.',
      '/infographics/alpha-scattering.png',
      'Rutherford Alpha Particle Scattering infographic'
    ),
    imageEntry(
      'bohr-model',
      'Bohr Model',
      'Stationary orbits, quantized energy levels, and photon transitions.',
      '/infographics/bohr-atom.png',
      'Bohr Atom infographic'
    ),
    imageEntry(
      'hydrogen-spectrum',
      'Hydrogen Spectrum',
      'Lyman, Balmer, Paschen series and emission/absorption lines.',
      '/infographics/hydrogen-spectrum.png',
      'Hydrogen Spectrum infographic'
    ),
  ],
  nuclei: [
    imageEntry(
      'nuclei-overview',
      'Nuclei',
      'Nuclear size, binding energy, radioactivity, fission, and fusion.',
      '/infographics/nuclei.png',
      'Nuclei, Radioactivity, and Nuclear Energy infographic'
    ),
  ],
  semiconductors: [
    imageEntry(
      'semiconductors-overview',
      'Semiconductors',
      'Intrinsic/extrinsic semiconductors, p-n junctions, diode bias, and rectification.',
      '/infographics/semiconductors.png',
      'Semiconductors and P-N Junction Diode infographic'
    ),
  ],
};

export const getInfographicScenes = (topicId: string): InfographicSceneEntry[] => {
  return SCENES[topicId] ?? [];
};

export const getInfographicScene = (topicId: string): React.ReactNode | null => {
  return getInfographicScenes(topicId)[0]?.node ?? null;
};
