import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'public', 'infographics', '11th-physics');

const topics = [
  {
    id: 'dimensional-analysis',
    title: 'DIMENSIONAL ANALYSIS EXPLAINED',
    chapter: 'Units and Measurement',
    visual: 'dimensions',
    focus: 'Use dimensions as a balance test before trusting an equation.',
    formulas: ['[v] = L T^-1', '[a] = L T^-2', 'Principle: dimensions match on both sides'],
    concepts: ['Base dimensions: M, L, T', 'Derived units carry dimensional fingerprints', 'Homogeneity checks consistency, not numerical constants'],
    misconceptions: ['A dimensionally correct equation may still be wrong', 'Angles are dimensionless', 'Constants like 2 pi cannot be found by dimensions'],
    applications: ['Formula checking', 'Unit conversion', 'Scaling estimates']
  },
  {
    id: 'position-velocity-acceleration-graphs',
    title: 'POSITION, VELOCITY & ACCELERATION GRAPHS',
    chapter: 'Motion in a Straight Line',
    visual: 'graphs',
    focus: 'Graphs translate motion into slope and area.',
    formulas: ['v = dx/dt', 'a = dv/dt', 'Area under v-t graph = displacement', 'v = v0 + at'],
    concepts: ['x-t slope gives velocity', 'v-t slope gives acceleration', 'Uniform acceleration gives straight v-t graph'],
    misconceptions: ['A high graph point is not always high speed', 'Negative velocity is direction, not slowness', 'Area can be signed'],
    applications: ['Traffic motion', 'Elevator motion', 'Lab ticker tape data']
  },
  {
    id: 'projectile-motion',
    title: 'PROJECTILE MOTION & VECTOR RESOLUTION',
    chapter: 'Motion in a Plane',
    visual: 'projectile',
    focus: 'Horizontal and vertical motions are independent.',
    formulas: ['x = u cos(theta) t', 'y = u sin(theta) t - 1/2 g t^2', 'R = u^2 sin(2 theta) / g', 'H = u^2 sin^2(theta) / 2g'],
    concepts: ['Horizontal velocity stays constant', 'Vertical motion has acceleration g downward', 'Path is parabolic'],
    misconceptions: ['Acceleration is not along the path', 'Velocity at top is not zero', 'Maximum range occurs at 45 degrees only on level ground'],
    applications: ['Sports throws', 'Water jets', 'Ballistics basics']
  },
  {
    id: 'static-kinetic-friction',
    title: 'STATIC & KINETIC FRICTION EXPLAINED',
    chapter: 'Laws of Motion',
    visual: 'friction',
    focus: 'Static friction adjusts until its limiting value.',
    formulas: ['fs <= mu_s N', 'fk = mu_k N', 'Angle of repose: tan(theta) = mu_s'],
    concepts: ['Static friction prevents relative motion', 'Kinetic friction acts during sliding', 'Normal reaction sets the friction scale'],
    misconceptions: ['Static friction is not always equal to mu_s N', 'Friction can help motion, as in walking', 'mu_s is usually greater than mu_k'],
    applications: ['Walking', 'Braking', 'Inclined planes']
  },
  {
    id: 'newtons-laws-of-motion',
    title: "NEWTON'S LAWS OF MOTION EXPLAINED",
    chapter: 'Laws of Motion',
    visual: 'newton',
    focus: 'Forces change momentum; action-reaction pairs act on different bodies.',
    formulas: ['p = mv', 'F = dp/dt', 'For constant mass: F = ma', 'Impulse = Delta p'],
    concepts: ['First law: inertia', 'Second law: rate of change of momentum', 'Third law: equal and opposite interaction forces'],
    misconceptions: ['Action and reaction do not cancel on the same object', 'Motion does not require a continuing force', 'Mass and weight are different'],
    applications: ['Seat belts', 'Rockets', 'Collision safety']
  },
  {
    id: 'conservation-of-momentum',
    title: 'CONSERVATION OF MOMENTUM EXPLAINED',
    chapter: 'Laws of Motion',
    visual: 'collision',
    focus: 'Total momentum remains constant when external force is zero.',
    formulas: ['p_total before = p_total after', 'm1u1 + m2u2 = m1v1 + m2v2', 'Impulse = change in momentum'],
    concepts: ['Momentum is a vector', 'Internal forces cancel in pairs', 'Kinetic energy is conserved only in elastic collisions'],
    misconceptions: ['Momentum conservation does not require kinetic energy conservation', 'Heavier object can have smaller momentum if speed is low', 'External impulse changes total momentum'],
    applications: ['Recoil', 'Collisions', 'Explosion fragments']
  },
  {
    id: 'work-energy-theorem',
    title: 'WORK-ENERGY THEOREM EXPLAINED',
    chapter: 'Work, Energy and Power',
    visual: 'work',
    focus: 'Net work changes kinetic energy.',
    formulas: ['W = F d cos(theta)', 'K = 1/2 mv^2', 'W_net = Kf - Ki', 'P = dW/dt = F . v'],
    concepts: ['Work is scalar', 'Only force component along displacement does work', 'Positive work speeds up, negative work slows down'],
    misconceptions: ['A force can act but do zero work', 'Work depends on displacement, not path length alone', 'Power measures rate of energy transfer'],
    applications: ['Lifting loads', 'Engines', 'Stopping distance']
  },
  {
    id: 'conservation-mechanical-energy',
    title: 'CONSERVATION OF MECHANICAL ENERGY',
    chapter: 'Work, Energy and Power',
    visual: 'energy',
    focus: 'With only conservative forces, K + U remains constant.',
    formulas: ['E = K + U', 'U_g = mgh', 'U_s = 1/2 kx^2', 'F = -dU/dx'],
    concepts: ['Energy shifts between kinetic and potential forms', 'Conservative force gives path-independent work', 'Non-conservative work changes mechanical energy'],
    misconceptions: ['Energy conservation is broader than mechanical energy conservation', 'Friction converts mechanical energy to thermal energy', 'Zero potential level is a choice'],
    applications: ['Roller coasters', 'Springs', 'Free fall']
  },
  {
    id: 'conservation-of-angular-momentum',
    title: 'CONSERVATION OF ANGULAR MOMENTUM',
    chapter: 'System of Particles and Rotational Motion',
    visual: 'angular',
    focus: 'When external torque is zero, angular momentum stays constant.',
    formulas: ['L = r x p', 'tau = dL/dt', 'For rigid body: L = I omega', 'If tau_ext = 0, L = constant'],
    concepts: ['Angular momentum is a vector', 'Changing I changes omega when L is fixed', 'Torque is the rotational cause of change'],
    misconceptions: ['Higher omega does not always mean higher L', 'Internal torques cannot change total L', 'Direction matters through cross product'],
    applications: ['Skaters', 'Planets', 'Gyroscopes']
  },
  {
    id: 'centre-of-mass-torque',
    title: 'CENTRE OF MASS & TORQUE EXPLAINED',
    chapter: 'System of Particles and Rotational Motion',
    visual: 'torque',
    focus: 'Centre of mass moves as if total mass is concentrated there.',
    formulas: ['R_cm = sum(mi ri) / sum(mi)', 'tau = r x F', '|tau| = rF sin(theta)', 'Equilibrium: sum F = 0, sum tau = 0'],
    concepts: ['Centre of mass depends on mass distribution', 'Torque depends on lever arm and angle', 'Equilibrium needs force and torque balance'],
    misconceptions: ['Centre of mass need not lie inside the body', 'A larger force is not always larger torque', 'Balanced forces alone do not ensure rotational equilibrium'],
    applications: ['Balancing beams', 'Door handles', 'Stability']
  },
  {
    id: 'moment-of-inertia',
    title: 'MOMENT OF INERTIA EXPLAINED',
    chapter: 'System of Particles and Rotational Motion',
    visual: 'inertia',
    focus: 'Rotational inertia depends on how far mass lies from the axis.',
    formulas: ['I = sum mi ri^2', 'K_rot = 1/2 I omega^2', 'tau = I alpha', 'Radius of gyration: I = Mk^2'],
    concepts: ['Same mass can have different I', 'Farther mass contributes more strongly', 'Moment of inertia is axis-dependent'],
    misconceptions: ['Moment of inertia is not just mass', 'Changing axis changes I', 'Ring has larger I than disc of same M and R'],
    applications: ['Flywheels', 'Sports equipment', 'Rolling objects']
  },
  {
    id: 'keplers-laws-planetary-motion',
    title: "KEPLER'S LAWS OF PLANETARY MOTION",
    chapter: 'Gravitation',
    visual: 'kepler',
    focus: 'Planetary motion follows ellipse, equal areas, and T squared proportional to a cubed.',
    formulas: ['T^2 proportional to a^3', 'T^2 = (4 pi^2 / GM) a^3', 'F = GMm / r^2', 'U = -GMm / r'],
    concepts: ['Sun lies at one focus of ellipse', 'Equal areas are swept in equal times', 'Gravity is a central conservative force'],
    misconceptions: ['Planet speed is not constant in an ellipse', 'The Sun is not at the centre of the ellipse', 'Circular orbit is a special case'],
    applications: ['Satellites', 'Planet periods', 'Space missions']
  },
  {
    id: 'mechanical-properties-solids',
    title: 'MECHANICAL PROPERTIES OF SOLIDS',
    chapter: 'Mechanical Properties of Solids',
    visual: 'solids',
    focus: 'Elastic response links stress, strain, and material stiffness.',
    formulas: ['Stress = F/A', 'Strain = Delta L / L', 'Young modulus Y = stress / strain', 'Elastic energy stored in deformation'],
    concepts: ['Elastic limit separates recovery from permanent set', 'Stress-strain curve reveals material behaviour', 'Different moduli describe different deformations'],
    misconceptions: ['Strain has no unit', 'Strong and stiff are not the same idea', 'Hooke law works only in elastic range'],
    applications: ['Bridges', 'Springs', 'Material testing']
  },
  {
    id: 'stokes-law',
    title: "STOKES' LAW & TERMINAL VELOCITY",
    chapter: 'Mechanical Properties of Fluids',
    visual: 'stokes',
    focus: 'Terminal velocity occurs when drag and buoyancy balance weight.',
    formulas: ['Drag F = 6 pi eta a v', 'At terminal speed: net force = 0', 'v_t increases with sphere size and density difference'],
    concepts: ['Viscosity resists relative motion', 'Drag grows with speed in Stokes regime', 'Buoyant force reduces effective weight'],
    misconceptions: ['Terminal velocity is not zero acceleration from the start', 'Stokes law applies only at low Reynolds number', 'Heavier and larger are not the same condition'],
    applications: ['Raindrops', 'Oil drop experiments', 'Sedimentation']
  },
  {
    id: 'fluid-dynamics',
    title: "BERNOULLI'S PRINCIPLE EXPLAINED",
    chapter: 'Mechanical Properties of Fluids',
    visual: 'bernoulli',
    focus: 'Steady ideal flow conserves energy along a streamline.',
    formulas: ['A v = constant', 'P + 1/2 rho v^2 + rho g y = constant', 'Higher speed often means lower pressure'],
    concepts: ['Continuity follows mass conservation', 'Bernoulli applies to non-viscous steady flow approximately', 'Pressure, kinetic, and potential terms trade off'],
    misconceptions: ['Bernoulli is not magic suction', 'Viscosity and turbulence limit the model', 'Pressure is scalar, velocity is vector'],
    applications: ['Venturi meter', 'Sprayers', 'Airflow over wings']
  },
  {
    id: 'pascals-law',
    title: "FLUID PRESSURE & PASCAL'S LAW",
    chapter: 'Mechanical Properties of Fluids',
    visual: 'pascal',
    focus: 'Pressure change in an enclosed fluid transmits undiminished.',
    formulas: ['P = F/A', 'P = P0 + rho g h', 'F2/F1 = A2/A1', 'Hydraulic work roughly conserved'],
    concepts: ['Pressure in a fluid at rest depends on depth', 'Same-height points have same pressure', 'Large area gives force multiplication'],
    misconceptions: ['Hydraulic machines do not create energy', 'Pressure is not the same as force', 'Depth matters in open fluids'],
    applications: ['Hydraulic brakes', 'Lifts', 'Syringes']
  },
  {
    id: 'surface-tension',
    title: 'SURFACE TENSION & CAPILLARITY',
    chapter: 'Mechanical Properties of Fluids',
    visual: 'surface',
    focus: 'Surface tension acts like a stretched skin at the liquid surface.',
    formulas: ['Surface tension = force / length', 'Capillary rise: h = 2S cos(theta) / (rho g r)', 'Surface energy per area = surface tension'],
    concepts: ['Molecular forces make surface area costly', 'Angle of contact sets wetting behaviour', 'Narrow tubes amplify capillary rise'],
    misconceptions: ['Surface tension is not a membrane material', 'Water rise depends on tube radius', 'Wetting and non-wetting liquids behave differently'],
    applications: ['Drops', 'Capillary tubes', 'Detergents']
  },
  {
    id: 'thermal-expansion-calorimetry',
    title: 'THERMAL PROPERTIES OF MATTER',
    chapter: 'Thermal Properties of Matter',
    visual: 'thermal',
    focus: 'Heat changes dimensions, temperature, or phase depending on conditions.',
    formulas: ['Delta L / L = alpha Delta T', 'Delta V / V = gamma Delta T', 'Q = m s Delta T', 'Heat lost = heat gained'],
    concepts: ['Most materials expand on heating', 'Calorimetry uses energy balance', 'Phase change absorbs latent heat at constant temperature'],
    misconceptions: ['Temperature and heat are not the same', 'Expansion coefficients depend on material', 'Water has anomalous expansion near 4 C'],
    applications: ['Thermometers', 'Calorimeters', 'Rail gaps']
  },
  {
    id: 'heat-transfer-blackbody-radiation',
    title: 'HEAT TRANSFER & BLACKBODY RADIATION',
    chapter: 'Thermal Properties of Matter',
    visual: 'heat',
    focus: 'Heat transfers by conduction, convection, and radiation.',
    formulas: ['Conduction: Q/t proportional to Delta T', 'Radiation power proportional to T^4', 'Wien shift: higher T, shorter peak wavelength'],
    concepts: ['Conduction needs particle/electron energy transfer', 'Convection needs bulk fluid motion', 'Radiation can travel through vacuum'],
    misconceptions: ['Radiation is not only harmful rays', 'Blackbody is an ideal absorber/emitter', 'Good absorbers are good emitters'],
    applications: ['Cooking', 'Climate physics', 'Thermal imaging']
  },
  {
    id: 'zeroth-law',
    title: 'ZEROTH LAW OF THERMODYNAMICS',
    chapter: 'Thermodynamics',
    visual: 'zeroth',
    focus: 'Thermal equilibrium makes temperature measurable.',
    formulas: ['If A in equilibrium with C and B with C, then A with B', 'Temperature is the common property at thermal equilibrium'],
    concepts: ['Diathermic wall permits heat exchange', 'Adiabatic wall prevents heat exchange', 'Thermometer works by reaching equilibrium'],
    misconceptions: ['Equal heat content is not required', 'Thermal equilibrium is not mechanical equilibrium', 'Temperature is not total internal energy'],
    applications: ['Thermometers', 'Calibration', 'Thermal contact tests']
  },
  {
    id: 'thermodynamic-processes',
    title: 'FIRST LAW & THERMODYNAMIC PROCESSES',
    chapter: 'Thermodynamics',
    visual: 'thermo',
    focus: 'Heat and work are energy transfers; internal energy is a state variable.',
    formulas: ['Delta Q = Delta U + Delta W', 'At constant P: W = P Delta V', 'Cyclic process: Delta U = 0', 'Isothermal ideal gas: Delta U = 0'],
    concepts: ['Isobaric: pressure constant', 'Isochoric: volume constant', 'Adiabatic: no heat exchange', 'PV diagram area gives work'],
    misconceptions: ['Heat is not stored in a body as a state variable', 'Work depends on path', 'Positive work convention must be tracked'],
    applications: ['Piston engines', 'Gas compression', 'Refrigerators']
  },
  {
    id: 'carnot-engine',
    title: 'CARNOT ENGINE & CARNOT CYCLE',
    chapter: 'Thermodynamics',
    visual: 'carnot',
    focus: 'No engine between two reservoirs is more efficient than a Carnot engine.',
    formulas: ['eta = 1 - T2/T1', 'W = Q1 - Q2', 'eta = W/Q1', 'Temperatures must be in kelvin'],
    concepts: ['Two isothermal and two adiabatic reversible steps', 'Second law limits efficiency', 'Reversibility is an ideal limit'],
    misconceptions: ['100 percent efficiency is impossible for heat engine', 'Efficiency depends on absolute temperatures', 'Carnot cycle is ideal, not a practical engine blueprint'],
    applications: ['Engine limits', 'Refrigerators', 'Heat pumps']
  },
  {
    id: 'kinetic-theory',
    title: 'PRESSURE OF AN IDEAL GAS',
    chapter: 'Kinetic Theory',
    visual: 'gas',
    focus: 'Gas pressure comes from molecular collisions with container walls.',
    formulas: ['PV = mu R T = N kB T', 'P = 1/3 n m <v^2>', '1/2 m <v^2> = 3/2 kB T', 'v_rms = sqrt(3kB T / m)'],
    concepts: ['Temperature measures average molecular kinetic energy', 'Ideal gas assumes negligible molecular size and interactions', 'Pressure exists throughout the gas'],
    misconceptions: ['Molecules do not all move at same speed', 'Higher temperature means higher average kinetic energy', 'Heavier molecules move slower at same T'],
    applications: ['Gas cylinders', 'Tyre pressure', 'Vacuum systems']
  },
  {
    id: 'mean-free-path',
    title: 'MEAN FREE PATH EXPLAINED',
    chapter: 'Kinetic Theory',
    visual: 'meanpath',
    focus: 'Gas molecules move in zig-zag paths because of repeated collisions.',
    formulas: ['l = 1 / (sqrt(2) n pi d^2)', 'Higher n gives smaller l', 'Larger molecular diameter gives smaller l'],
    concepts: ['Mean free path is average distance between collisions', 'Gas diffusion is slow despite high molecular speeds', 'Collision frequency depends on density and size'],
    misconceptions: ['Molecules are not moving straight across a room unhindered', 'Mean free path is much larger than molecular size in gases', 'Average path differs from exact path'],
    applications: ['Diffusion', 'Vacuum physics', 'Transport properties']
  },
  {
    id: 'equipartition',
    title: 'EQUIPARTITION OF ENERGY EXPLAINED',
    chapter: 'Kinetic Theory',
    visual: 'equipartition',
    focus: 'Energy is shared equally among quadratic modes at thermal equilibrium.',
    formulas: ['Each quadratic mode: 1/2 kB T', 'Monatomic U = 3/2 RT per mole', 'Cp - Cv = R', 'gamma = Cp/Cv'],
    concepts: ['Translation, rotation, and vibration are energy modes', 'Vibration contributes kinetic and potential terms', 'Specific heats depend on active degrees of freedom'],
    misconceptions: ['All gases do not have the same Cv', 'Vibrational modes may be inactive at ordinary temperature', 'Equipartition is a thermal equilibrium result'],
    applications: ['Specific heats', 'Molecular gases', 'Thermal modelling']
  },
  {
    id: 'shm-spring',
    title: 'SPRING-MASS SHM EXPLAINED',
    chapter: 'Oscillations',
    visual: 'spring',
    focus: 'A restoring force proportional to displacement gives SHM.',
    formulas: ['F = -kx', 'x(t) = A cos(omega t + phi)', 'omega = sqrt(k/m)', 'T = 2 pi sqrt(m/k)'],
    concepts: ['Acceleration points toward equilibrium', 'Velocity is maximum at mean position', 'Energy swaps between kinetic and spring potential'],
    misconceptions: ['Period is independent of amplitude for ideal SHM', 'Restoring force is opposite displacement', 'Every periodic motion is not SHM'],
    applications: ['Springs', 'Vibrations', 'Seismometers']
  },
  {
    id: 'simple-pendulum',
    title: 'SIMPLE PENDULUM EXPLAINED',
    chapter: 'Oscillations',
    visual: 'pendulum',
    focus: 'Small-angle pendulum motion is approximately SHM.',
    formulas: ['T = 2 pi sqrt(L/g)', 'Restoring torque proportional to sin(theta)', 'Small angle: sin(theta) approx theta'],
    concepts: ['Period depends on length and gravity', 'Mass does not affect ideal pendulum period', 'Approximation works for small angles'],
    misconceptions: ['Large-angle pendulum is not exactly SHM', 'Heavier bob does not swing faster ideally', 'Amplitude affects period only beyond small-angle limit'],
    applications: ['Clocks', 'Measuring g', 'Timing oscillations']
  },
  {
    id: 'wave-motion',
    title: 'WAVE MOTION EXPLAINED',
    chapter: 'Waves',
    visual: 'wave',
    focus: 'Waves transfer energy without transporting matter overall.',
    formulas: ['y(x,t) = a sin(kx - omega t + phi)', 'v = omega/k = lambda/T = f lambda', 'T = 2 pi / omega', 'k = 2 pi / lambda'],
    concepts: ['Transverse: particles oscillate perpendicular to propagation', 'Longitudinal: particles oscillate along propagation', 'Phase tracks the state of oscillation'],
    misconceptions: ['Medium particles do not travel with the wave', 'Wave speed depends on medium properties', 'Amplitude and wavelength are different'],
    applications: ['Sound', 'Strings', 'Water waves']
  },
  {
    id: 'standing-waves',
    title: 'SUPERPOSITION & STANDING WAVES',
    chapter: 'Waves',
    visual: 'standing',
    focus: 'Opposite travelling waves superpose to form nodes and antinodes.',
    formulas: ['y = [2a sin(kx)] cos(omega t)', 'Node spacing = lambda/2', 'String fixed ends: f_n = n v / 2L', 'Closed pipe: f_n = (n + 1/2) v / 2L'],
    concepts: ['Nodes have zero displacement', 'Antinodes have maximum displacement', 'Normal modes occur at resonant frequencies'],
    misconceptions: ['Standing wave pattern does not travel along the string', 'Nodes and antinodes are fixed positions', 'Closed and open ends reflect differently'],
    applications: ['Musical strings', 'Organ pipes', 'Resonance']
  }
];

const palette = {
  ink: '#0f172a',
  muted: '#475569',
  navy: '#0b2f6b',
  blue: '#0ea5e9',
  deepBlue: '#1d4ed8',
  cyan: '#67e8f9',
  red: '#ef4444',
  amber: '#f59e0b',
  green: '#10b981',
  panel: '#f8fafc',
  line: '#cbd5e1'
};

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text, max = 38) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > max && current) {
      lines.push(current);
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

function textLines(lines, x, y, opts = {}) {
  const size = opts.size ?? 28;
  const weight = opts.weight ?? 700;
  const fill = opts.fill ?? palette.ink;
  const gap = opts.gap ?? Math.round(size * 1.35);
  return lines.map((line, i) => (
    `<text x="${x}" y="${y + i * gap}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`
  )).join('\n');
}

function bulletList(items, x, y, maxWidth = 42, size = 23, color = palette.blue) {
  let out = '';
  let cursor = y;
  for (const item of items) {
    const lines = wrap(item, maxWidth);
    out += `<circle cx="${x}" cy="${cursor - 7}" r="${Math.max(3, Math.round(size / 5))}" fill="${color}"/>`;
    out += textLines(lines, x + 18, cursor, { size, weight: 650, fill: palette.ink, gap: Math.round(size * 1.25) });
    cursor += lines.length * Math.round(size * 1.25) + Math.round(size * 0.55);
  }
  return out;
}

function panel(title, items, x, y, w, h, accent = palette.blue, options = {}) {
  const titleSize = options.titleSize ?? 20;
  const bodySize = options.bodySize ?? 16;
  const maxWidth = options.maxWidth ?? Math.max(22, Math.floor((w - 52) / (bodySize * 0.56)));
  const fill = options.fill ?? '#ffffff';
  const stroke = options.stroke ?? accent;
  const icon = options.icon ?? '';
  const titleTextWidth = w - (icon ? 142 : 32);
  const titleLines = wrap(title, Math.max(14, Math.floor(titleTextWidth / (titleSize * 0.6)))).slice(0, icon ? 3 : 2);
  const bodyY = y + (titleLines.length > 2 ? 94 : titleLines.length > 1 ? 78 : 62);
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2.2"/>
      ${icon}
      ${textLines(titleLines, x + (icon ? 54 : 16), y + 30, { size: titleSize, weight: 950, fill: accent, gap: Math.round(titleSize * 1.05) })}
      ${bulletList(items, x + 24, bodyY, maxWidth, bodySize, accent)}
    </g>`;
}

function formulaPanel(items, x, y, w, h) {
  let rows = '';
  let cy = y + 62;
  for (const item of items.slice(0, 4)) {
    const lines = wrap(item, 27);
    const rowHeight = Math.max(42, lines.length * 22 + 14);
    rows += `<rect x="${x + 14}" y="${cy - 26}" width="${w - 28}" height="${rowHeight}" rx="5" fill="#fbfdff" stroke="#1d4ed8" stroke-width="1.5"/>`;
    rows += textLines(lines, x + 28, cy, { size: 18, weight: 850, fill: palette.ink, gap: 22 });
    cy += rowHeight + 9;
  }
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#ffffff" stroke="#1d4ed8" stroke-width="2.2"/>
      <text x="${x + 16}" y="${y + 31}" font-family="Arial Narrow, Arial, sans-serif" font-size="22" font-weight="950" fill="#0b3a8a">FORMULA INSET</text>
      ${rows}
    </g>`;
}

function formulaCard(title, value, x, y, w, h, accent = '#1d4ed8') {
  const lines = wrap(value, Math.floor((w - 34) / 9.6));
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#ffffff" stroke="${accent}" stroke-width="1.8"/>
      <text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-size="17" font-weight="900" fill="${accent}">${esc(title)}</text>
      ${textLines(lines, x + 18, y + 54, { size: 18, weight: 900, fill: palette.ink, gap: 22 })}
    </g>`;
}

function sketchInset(type, x, y, w, h) {
  const cx = x + w / 2;
  const cy = y + h / 2 + 10;
  const arrow = (x1, y1, x2, y2, color = palette.blue) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="4" stroke-linecap="round" marker-end="url(#arrowSmall)"/>`;
  const simple = {
    projectile: `<path d="M${x + 42} ${y + h - 42} Q${cx} ${y + 52} ${x + w - 42} ${y + h - 48}" fill="none" stroke="${palette.blue}" stroke-width="5"/><circle cx="${x + 70}" cy="${y + h - 64}" r="11" fill="${palette.red}"/>${arrow(x + 70, y + h - 64, x + 145, y + h - 105, palette.red)}${arrow(x + 70, y + h - 64, x + 148, y + h - 64, palette.green)}<text x="${cx}" y="${y + h - 18}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800">x motion + y motion</text>`,
    graphs: `<line x1="${x + 38}" y1="${y + h - 38}" x2="${x + w - 34}" y2="${y + h - 38}" stroke="${palette.ink}" stroke-width="3"/><line x1="${x + 45}" y1="${y + h - 32}" x2="${x + 45}" y2="${y + 42}" stroke="${palette.ink}" stroke-width="3"/><path d="M${x + 50} ${y + h - 55} C${x + 95} ${y + 70} ${x + 185} ${y + 90} ${x + w - 42} ${y + 48}" fill="none" stroke="${palette.blue}" stroke-width="4"/><path d="M${x + 50} ${y + h - 72} L${x + w - 44} ${y + 72}" stroke="${palette.red}" stroke-width="4"/>`,
    friction: `<rect x="${x + 48}" y="${y + h - 75}" width="${w - 96}" height="36" fill="#e5e7eb" stroke="#334155" stroke-width="2"/><rect x="${cx - 45}" y="${y + 74}" width="90" height="58" fill="#fde68a" stroke="#b45309" stroke-width="3"/>${arrow(cx - 45, y + 103, x + 55, y + 103, palette.red)}${arrow(cx + 45, y + 103, x + w - 55, y + 103, palette.green)}`,
    newton: `<circle cx="${x + 95}" cy="${cy}" r="34" fill="#dbeafe" stroke="${palette.blue}" stroke-width="3"/><circle cx="${x + w - 95}" cy="${cy}" r="34" fill="#fee2e2" stroke="${palette.red}" stroke-width="3"/>${arrow(x + 130, cy, x + w - 130, cy, palette.green)}${arrow(x + w - 130, cy + 28, x + 130, cy + 28, palette.red)}<text x="${cx}" y="${y + 54}" text-anchor="middle" font-family="Arial" font-size="22" font-weight="900">F = ma</text>`,
    collision: `<circle cx="${x + 90}" cy="${cy}" r="28" fill="#dbeafe" stroke="${palette.blue}" stroke-width="3"/><circle cx="${x + w - 88}" cy="${cy}" r="38" fill="#fee2e2" stroke="${palette.red}" stroke-width="3"/>${arrow(x + 40, cy, x + 118, cy, palette.blue)}${arrow(x + w - 36, cy, x + w - 124, cy, palette.red)}<text x="${cx}" y="${y + h - 22}" text-anchor="middle" font-size="17" font-family="Arial" font-weight="850">p before = p after</text>`,
    torque: `<line x1="${x + 58}" y1="${cy + 18}" x2="${x + w - 44}" y2="${cy + 18}" stroke="#92400e" stroke-width="9" stroke-linecap="round"/><circle cx="${cx}" cy="${cy + 18}" r="14" fill="${palette.ink}"/>${arrow(cx + 82, cy + 18, cx + 82, y + 60, palette.red)}<text x="${cx + 70}" y="${cy + 50}" text-anchor="middle" font-family="Arial" font-size="16" font-weight="850">lever arm</text>`,
    bernoulli: `<path d="M${x + 34} ${cy - 30} C${x + 110} ${cy - 65} ${x + 178} ${cy - 65} ${x + w - 34} ${cy - 30} L${x + w - 34} ${cy + 45} C${x + 145} ${cy + 70} ${x + 108} ${cy + 70} ${x + 34} ${cy + 45} Z" fill="#dbeafe" stroke="${palette.blue}" stroke-width="3"/>${arrow(x + 48, cy + 8, x + w - 52, cy + 8, palette.blue)}`,
    wave: `<path d="M${x + 34} ${cy} C${x + 78} ${cy - 62} ${x + 132} ${cy - 62} ${x + 176} ${cy} S${x + w - 72} ${cy + 62} ${x + w - 34} ${cy}" fill="none" stroke="${palette.blue}" stroke-width="5"/>${arrow(x + 40, y + h - 42, x + w - 42, y + h - 42, palette.green)}`,
    standing: `<path d="M${x + 34} ${cy} C${x + 90} ${cy - 70} ${x + 145} ${cy - 70} ${cx} ${cy} S${x + w - 90} ${cy + 70} ${x + w - 34} ${cy}" fill="none" stroke="${palette.blue}" stroke-width="5"/><path d="M${x + 34} ${cy} C${x + 90} ${cy + 70} ${x + 145} ${cy + 70} ${cx} ${cy} S${x + w - 90} ${cy - 70} ${x + w - 34} ${cy}" fill="none" stroke="${palette.red}" stroke-width="4"/>`
  };
  const fallback = `<circle cx="${cx}" cy="${cy}" r="62" fill="#eff6ff" stroke="${palette.blue}" stroke-width="4"/><path d="M${cx - 90} ${cy + 62} C${cx - 40} ${cy - 65} ${cx + 48} ${cy - 65} ${cx + 94} ${cy + 62}" fill="none" stroke="${palette.blue}" stroke-width="5"/><text x="${cx}" y="${cy + 8}" text-anchor="middle" font-family="Arial" font-size="24" font-weight="900">MODEL</text>`;
  return panel('SCHEMATIC INSET', [], x, y, w, h, palette.blue) + `<g>${simple[type] ?? fallback}</g>`;
}

function applicationsPanel(items, x, y, w, h) {
  const icon = (cx, cy, i) => {
    const colors = [palette.green, palette.blue, palette.amber, palette.red];
    return `<circle cx="${cx}" cy="${cy}" r="16" fill="${colors[i % colors.length]}" opacity="0.18" stroke="${colors[i % colors.length]}" stroke-width="2"/><path d="M${cx - 8} ${cy + 5} L${cx} ${cy - 9} L${cx + 8} ${cy + 5} Z" fill="${colors[i % colors.length]}"/>`;
  };
  const headingLines = wrap('REAL-WORLD APPLICATIONS', Math.max(14, Math.floor((w - 32) / 10.6)));
  let rows = '';
  let cy = y + 42 + headingLines.length * 22;
  for (const [i, item] of items.slice(0, 5).entries()) {
    rows += icon(x + 28, cy - 5, i);
    rows += textLines(wrap(item, Math.floor((w - 72) / 8.5)), x + 55, cy, { size: 15, weight: 700, fill: palette.ink, gap: 19 });
    cy += 36;
  }
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#ffffff" stroke="#15803d" stroke-width="2.2"/>
      ${textLines(headingLines, x + 16, y + 31, { size: 20, weight: 950, fill: '#15803d', gap: 21 })}
      ${rows}
    </g>`;
}

function miniFormulaStrip(topic, x, y, w, h) {
  const formulas = topic.formulas.slice(0, 3);
  const gap = 12;
  const cardW = (w - gap * 2) / 3;
  return formulas.map((formula, i) => formulaCard(i === 0 ? 'KEY EQUATION' : `INSET ${i + 1}`, formula, x + i * (cardW + gap), y, cardW, h, i === 0 ? palette.blue : palette.ink)).join('');
}

function drawVisual(type) {
  const base = `
    <ellipse cx="960" cy="548" rx="360" ry="230" fill="#f8fbff" opacity="0.72"/>
    <path d="M552 300 C720 142 870 152 960 300 C1050 152 1200 142 1368 300" fill="none" stroke="#7dd3fc" stroke-width="4" opacity="0.48"/>
    <path d="M552 650 C720 808 870 798 960 650 C1050 798 1200 808 1368 650" fill="none" stroke="#7dd3fc" stroke-width="4" opacity="0.48"/>
    <path d="M560 232 C760 320 794 424 732 540 C680 638 765 720 900 742" fill="none" stroke="#38bdf8" stroke-width="3" opacity="0.34"/>
    <path d="M1360 232 C1160 320 1126 424 1188 540 C1240 638 1155 720 1020 742" fill="none" stroke="#38bdf8" stroke-width="3" opacity="0.34"/>
    <text x="960" y="178" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-size="24" font-weight="950" fill="${palette.muted}">MAIN SCIENTIFIC DIAGRAM</text>`;
  const axis = `<line x1="650" y1="675" x2="1270" y2="675" stroke="${palette.ink}" stroke-width="4"/><line x1="700" y1="705" x2="700" y2="295" stroke="${palette.ink}" stroke-width="4"/>`;
  const arrow = (x1, y1, x2, y2, color = palette.blue) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="8" stroke-linecap="round" marker-end="url(#arrow)"/>`;
  const sine = `<path d="M650 520 C720 410 790 410 860 520 S1000 630 1070 520 S1210 410 1280 520" fill="none" stroke="${palette.blue}" stroke-width="8"/>`;
  const diagrams = {
    dimensions: `${axis}<rect x="735" y="345" width="450" height="230" rx="20" fill="#f8fafc" stroke="#94a3b8" stroke-width="4"/><text x="960" y="420" text-anchor="middle" font-family="Inter, Arial" font-size="46" font-weight="950" fill="${palette.ink}">M  L  T</text><text x="960" y="495" text-anchor="middle" font-family="Inter, Arial" font-size="34" font-weight="850" fill="${palette.blue}">both sides balance</text>${arrow(760,610,1160,610,palette.green)}`,
    graphs: `${axis}<path d="M700 650 C830 620 930 520 1060 360" fill="none" stroke="${palette.blue}" stroke-width="7"/><line x1="720" y1="600" x2="1200" y2="420" stroke="${palette.red}" stroke-width="5"/><path d="M720 660 L850 600 L980 520 L1110 430 L1240 320" fill="none" stroke="${palette.green}" stroke-width="5" stroke-dasharray="12 10"/><text x="1170" y="360" font-family="Inter, Arial" font-size="28" font-weight="900" fill="${palette.blue}">slope</text>`,
    projectile: `${axis}<path d="M700 650 Q950 250 1230 650" fill="none" stroke="${palette.blue}" stroke-width="8"/><circle cx="760" cy="590" r="18" fill="${palette.red}"/>${arrow(760,590,875,500,palette.red)}${arrow(760,590,900,590,palette.green)}${arrow(760,590,760,690,palette.amber)}<text x="966" y="390" font-family="Inter, Arial" font-size="28" font-weight="900" fill="${palette.blue}">parabolic path</text>`,
    friction: `<rect x="720" y="560" width="430" height="90" rx="12" fill="#e2e8f0" stroke="#64748b" stroke-width="4"/><rect x="835" y="455" width="180" height="105" rx="12" fill="#fde68a" stroke="#f59e0b" stroke-width="4"/>${arrow(830,505,700,505,palette.red)}${arrow(1020,505,1170,505,palette.green)}${arrow(925,455,925,360,palette.blue)}${arrow(925,560,925,660,palette.ink)}<text x="925" y="710" text-anchor="middle" font-family="Inter, Arial" font-size="28" font-weight="900">friction adjusts</text>`,
    newton: `<circle cx="830" cy="520" r="65" fill="#dbeafe" stroke="${palette.blue}" stroke-width="5"/><circle cx="1110" cy="520" r="65" fill="#fee2e2" stroke="${palette.red}" stroke-width="5"/>${arrow(895,520,1045,520,palette.green)}${arrow(1045,560,895,560,palette.red)}<text x="960" y="405" text-anchor="middle" font-family="Inter, Arial" font-size="34" font-weight="950">F = ma</text><text x="960" y="650" text-anchor="middle" font-family="Inter, Arial" font-size="26" font-weight="800">action-reaction on different bodies</text>`,
    collision: `<circle cx="770" cy="540" r="55" fill="#dbeafe" stroke="${palette.blue}" stroke-width="5"/><circle cx="1120" cy="540" r="75" fill="#fee2e2" stroke="${palette.red}" stroke-width="5"/>${arrow(690,540,815,540,palette.blue)}${arrow(1210,540,1090,540,palette.red)}<rect x="815" y="670" width="310" height="22" fill="${palette.green}" rx="11"/><text x="970" y="635" text-anchor="middle" font-family="Inter, Arial" font-size="32" font-weight="950">p total constant</text>`,
    work: `<rect x="705" y="555" width="220" height="95" rx="14" fill="#e0f2fe" stroke="${palette.blue}" stroke-width="4"/>${arrow(925,600,1190,505,palette.green)}<line x1="690" y1="655" x2="1240" y2="655" stroke="${palette.ink}" stroke-width="5"/><path d="M735 455 L1190 455" stroke="${palette.red}" stroke-width="12"/><text x="960" y="420" text-anchor="middle" font-family="Inter, Arial" font-size="36" font-weight="950">work changes K</text>`,
    energy: `<path d="M680 640 C820 350 1060 350 1220 640" fill="none" stroke="${palette.blue}" stroke-width="8"/><circle cx="790" cy="515" r="28" fill="${palette.red}"/><rect x="730" y="705" width="460" height="20" fill="${palette.green}" rx="10"/><text x="960" y="430" text-anchor="middle" font-family="Inter, Arial" font-size="34" font-weight="950">K + U = constant</text>`,
    angular: `<circle cx="960" cy="515" r="160" fill="#f8fafc" stroke="${palette.blue}" stroke-width="6"/><circle cx="960" cy="515" r="22" fill="${palette.red}"/>${arrow(960,515,1115,430,palette.green)}<path d="M830 515 A130 130 0 1 1 1080 570" fill="none" stroke="${palette.blue}" stroke-width="7" marker-end="url(#arrow)"/><text x="960" y="705" text-anchor="middle" font-family="Inter, Arial" font-size="34" font-weight="950">L conserved if tau_ext = 0</text>`,
    torque: `<line x1="710" y1="560" x2="1210" y2="560" stroke="#92400e" stroke-width="18" stroke-linecap="round"/><circle cx="960" cy="560" r="28" fill="${palette.ink}"/>${arrow(1130,560,1130,400,palette.red)}<line x1="960" y1="560" x2="1130" y2="560" stroke="${palette.blue}" stroke-width="6" stroke-dasharray="10 8"/><text x="1045" y="610" text-anchor="middle" font-family="Inter, Arial" font-size="27" font-weight="900">lever arm</text>`,
    inertia: `<circle cx="840" cy="520" r="100" fill="none" stroke="${palette.blue}" stroke-width="18"/><circle cx="1080" cy="520" r="100" fill="#dbeafe" stroke="${palette.blue}" stroke-width="6"/><text x="840" y="665" text-anchor="middle" font-family="Inter, Arial" font-size="28" font-weight="900">ring: mass far</text><text x="1080" y="665" text-anchor="middle" font-family="Inter, Arial" font-size="28" font-weight="900">disc: mass spread</text>`,
    kepler: `<ellipse cx="960" cy="515" rx="260" ry="145" fill="none" stroke="${palette.blue}" stroke-width="7"/><circle cx="850" cy="515" r="28" fill="${palette.amber}"/><circle cx="1160" cy="470" r="16" fill="${palette.red}"/><path d="M850 515 L1160 470 L1005 640 Z" fill="#bae6fd" opacity="0.55"/><text x="960" y="705" text-anchor="middle" font-family="Inter, Arial" font-size="33" font-weight="950">equal areas in equal times</text>`,
    solids: `<rect x="710" y="480" width="500" height="95" rx="16" fill="#e2e8f0" stroke="#64748b" stroke-width="4"/>${arrow(710,528,610,528,palette.red)}${arrow(1210,528,1310,528,palette.red)}<path d="M710 670 L830 640 L950 575 L1100 430 L1210 390" fill="none" stroke="${palette.blue}" stroke-width="8"/><text x="1010" y="450" font-family="Inter, Arial" font-size="28" font-weight="900">stress-strain</text>`,
    stokes: `<rect x="740" y="330" width="440" height="340" rx="24" fill="#cffafe" stroke="${palette.blue}" stroke-width="4"/><circle cx="960" cy="505" r="48" fill="#fca5a5" stroke="${palette.red}" stroke-width="5"/>${arrow(960,455,960,345,palette.green)}${arrow(960,555,960,660,palette.red)}${arrow(1030,505,1130,505,palette.blue)}<text x="960" y="715" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="950">terminal: forces balance</text>`,
    bernoulli: `<path d="M680 480 C820 430 930 430 1040 480 C1130 520 1220 520 1280 480 L1280 620 C1160 675 1010 650 900 620 C800 590 730 590 680 620 Z" fill="#dbeafe" stroke="${palette.blue}" stroke-width="5"/><path d="M700 550 C850 500 1020 610 1260 550" fill="none" stroke="${palette.blue}" stroke-width="8" marker-end="url(#arrow)"/><text x="960" y="390" text-anchor="middle" font-family="Inter, Arial" font-size="34" font-weight="950">P + 1/2 rho v^2 + rho gy</text>`,
    pascal: `<rect x="720" y="515" width="500" height="135" rx="18" fill="#dbeafe" stroke="${palette.blue}" stroke-width="5"/><rect x="760" y="390" width="105" height="125" fill="#bfdbfe" stroke="${palette.ink}" stroke-width="4"/><rect x="1040" y="310" width="145" height="205" fill="#bfdbfe" stroke="${palette.ink}" stroke-width="4"/>${arrow(812,390,812,320,palette.red)}${arrow(1112,310,1112,220,palette.green)}<text x="960" y="710" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="950">same pressure, larger force</text>`,
    surface: `<path d="M690 560 C790 500 850 620 945 560 S1110 500 1230 560" fill="none" stroke="${palette.blue}" stroke-width="9"/><line x1="700" y1="650" x2="1220" y2="650" stroke="#94a3b8" stroke-width="5"/><rect x="925" y="420" width="70" height="230" fill="#e0f2fe" stroke="${palette.ink}" stroke-width="4"/><path d="M925 470 C945 430 975 430 995 470" fill="none" stroke="${palette.red}" stroke-width="6"/><text x="960" y="720" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="950">surface area costs energy</text>`,
    thermal: `<rect x="720" y="560" width="430" height="55" rx="18" fill="#fecaca" stroke="${palette.red}" stroke-width="4"/><line x1="760" y1="560" x2="760" y2="500" stroke="${palette.red}" stroke-width="5"/><line x1="1110" y1="560" x2="1110" y2="500" stroke="${palette.red}" stroke-width="5"/>${arrow(770,500,1110,500,palette.red)}<circle cx="960" cy="360" r="58" fill="#fee2e2" stroke="${palette.red}" stroke-width="5"/><text x="960" y="715" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="950">heat lost = heat gained</text>`,
    heat: `<rect x="710" y="550" width="180" height="85" fill="#fee2e2" stroke="${palette.red}" stroke-width="5"/><rect x="1030" y="550" width="180" height="85" fill="#dbeafe" stroke="${palette.blue}" stroke-width="5"/>${arrow(890,592,1030,592,palette.amber)}<path d="M830 420 C900 360 1040 360 1110 420" fill="none" stroke="${palette.red}" stroke-width="7"/><path d="M760 340 C930 250 1110 250 1260 340" fill="none" stroke="${palette.amber}" stroke-width="6" stroke-dasharray="14 10"/><text x="960" y="715" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="950">conduction + convection + radiation</text>`,
    zeroth: `<circle cx="800" cy="500" r="82" fill="#fee2e2" stroke="${palette.red}" stroke-width="5"/><circle cx="1120" cy="500" r="82" fill="#dbeafe" stroke="${palette.blue}" stroke-width="5"/><circle cx="960" cy="380" r="82" fill="#dcfce7" stroke="${palette.green}" stroke-width="5"/><line x1="860" y1="465" x2="910" y2="420" stroke="${palette.ink}" stroke-width="5"/><line x1="1060" y1="465" x2="1010" y2="420" stroke="${palette.ink}" stroke-width="5"/><text x="960" y="675" text-anchor="middle" font-family="Inter, Arial" font-size="32" font-weight="950">A = C and B = C implies A = B</text>`,
    thermo: `<path d="M735 625 L735 335 L1210 335 L1210 625 Z" fill="none" stroke="${palette.ink}" stroke-width="4"/><path d="M805 590 C900 420 1040 420 1150 500" fill="none" stroke="${palette.blue}" stroke-width="8"/><path d="M805 590 L1150 500 L1150 625 L805 625 Z" fill="${palette.cyan}" opacity="0.45"/><text x="960" y="700" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="950">PV area = work</text>`,
    carnot: `<path d="M780 585 C850 430 1030 405 1150 455" fill="none" stroke="${palette.red}" stroke-width="8"/><path d="M1150 455 C1100 610 900 650 780 585" fill="none" stroke="${palette.blue}" stroke-width="8"/><line x1="780" y1="585" x2="710" y2="655" stroke="${palette.green}" stroke-width="7"/><line x1="1150" y1="455" x2="1220" y2="365" stroke="${palette.green}" stroke-width="7"/><text x="960" y="710" text-anchor="middle" font-family="Inter, Arial" font-size="32" font-weight="950">eta = 1 - T2/T1</text>`,
    gas: `<rect x="720" y="335" width="480" height="320" rx="22" fill="#f8fafc" stroke="${palette.ink}" stroke-width="5"/>${Array.from({ length: 20 }, (_, i) => `<circle cx="${760 + (i * 83) % 410}" cy="${380 + (i * 47) % 230}" r="12" fill="${i % 2 ? palette.blue : palette.red}"/>`).join('')}<path d="M770 390 L1010 570 L1160 410 L880 620" fill="none" stroke="${palette.green}" stroke-width="5" stroke-dasharray="12 10"/><text x="960" y="710" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="950">collisions create pressure</text>`,
    meanpath: `<rect x="720" y="335" width="480" height="320" rx="22" fill="#f8fafc" stroke="${palette.ink}" stroke-width="5"/><path d="M760 610 L850 455 L930 515 L1010 380 L1110 610 L1180 440" fill="none" stroke="${palette.blue}" stroke-width="7" marker-end="url(#arrow)"/>${Array.from({ length: 11 }, (_, i) => `<circle cx="${785 + (i * 43)}" cy="${390 + (i * 73) % 220}" r="18" fill="#fee2e2" stroke="${palette.red}" stroke-width="3"/>`).join('')}<text x="960" y="710" text-anchor="middle" font-family="Inter, Arial" font-size="30" font-weight="950">average distance between collisions</text>`,
    equipartition: `<rect x="730" y="440" width="145" height="150" rx="18" fill="#dbeafe" stroke="${palette.blue}" stroke-width="5"/><rect x="890" y="440" width="145" height="150" rx="18" fill="#dcfce7" stroke="${palette.green}" stroke-width="5"/><rect x="1050" y="440" width="145" height="150" rx="18" fill="#fee2e2" stroke="${palette.red}" stroke-width="5"/><text x="802" y="525" text-anchor="middle" font-family="Inter, Arial" font-size="25" font-weight="900">trans</text><text x="962" y="525" text-anchor="middle" font-family="Inter, Arial" font-size="25" font-weight="900">rot</text><text x="1122" y="525" text-anchor="middle" font-family="Inter, Arial" font-size="25" font-weight="900">vib</text><text x="960" y="695" text-anchor="middle" font-family="Inter, Arial" font-size="32" font-weight="950">1/2 kB T per quadratic mode</text>`,
    spring: `<rect x="1080" y="500" width="120" height="95" rx="14" fill="#dbeafe" stroke="${palette.blue}" stroke-width="5"/><path d="M700 548 l35 -35 l35 70 l35 -70 l35 70 l35 -70 l35 70 l35 -70 l35 35" fill="none" stroke="${palette.ink}" stroke-width="7"/><line x1="700" y1="455" x2="700" y2="640" stroke="${palette.ink}" stroke-width="8"/><path d="M760 680 C850 620 990 620 1130 680" fill="none" stroke="${palette.blue}" stroke-width="7"/><text x="960" y="400" text-anchor="middle" font-family="Inter, Arial" font-size="34" font-weight="950">F = -kx</text>`,
    pendulum: `<line x1="960" y1="320" x2="1080" y2="575" stroke="${palette.ink}" stroke-width="6"/><circle cx="1080" cy="575" r="45" fill="#dbeafe" stroke="${palette.blue}" stroke-width="5"/><path d="M840 575 A180 180 0 0 0 1080 575" fill="none" stroke="${palette.red}" stroke-width="5" stroke-dasharray="12 10"/><circle cx="960" cy="320" r="10" fill="${palette.ink}"/><text x="960" y="705" text-anchor="middle" font-family="Inter, Arial" font-size="32" font-weight="950">T = 2 pi sqrt(L/g)</text>`,
    wave: `${sine}${arrow(640,650,1270,650,palette.green)}<text x="960" y="390" text-anchor="middle" font-family="Inter, Arial" font-size="34" font-weight="950">energy travels, medium oscillates</text><line x1="760" y1="520" x2="760" y2="440" stroke="${palette.red}" stroke-width="6" marker-end="url(#arrow)"/><line x1="760" y1="520" x2="840" y2="520" stroke="${palette.green}" stroke-width="6" marker-end="url(#arrow)"/>`,
    standing: `<path d="M660 520 C760 370 860 370 960 520 S1160 670 1260 520" fill="none" stroke="${palette.blue}" stroke-width="8"/><path d="M660 520 C760 670 860 670 960 520 S1160 370 1260 520" fill="none" stroke="${palette.red}" stroke-width="6" opacity="0.8"/><circle cx="660" cy="520" r="12" fill="${palette.ink}"/><circle cx="960" cy="520" r="12" fill="${palette.ink}"/><circle cx="1260" cy="520" r="12" fill="${palette.ink}"/><text x="960" y="710" text-anchor="middle" font-family="Inter, Arial" font-size="32" font-weight="950">nodes fixed, antinodes oscillate</text>`
  };
  return `${base}\n<g transform="translate(960 500) scale(1.08) translate(-960 -500)">${diagrams[type] ?? diagrams.dimensions}</g>`;
}

function makeSvg(topic) {
  const titleSize = topic.title.length > 42 ? 44 : topic.title.length > 34 ? 50 : 58;
  const whatItems = [topic.focus, ...topic.concepts.slice(0, 2)];
  const checkpointItems = [...topic.concepts, `NCERT chapter: ${topic.chapter}`].slice(0, 4);
  const conceptFlow = [
    topic.formulas[0] ? `Start from ${topic.formulas[0]}` : topic.focus,
    topic.concepts[0] ?? topic.focus,
    topic.misconceptions[0] ? `Avoid: ${topic.misconceptions[0]}` : 'Check assumptions before using the formula',
  ];
  const interpretation = [
    topic.concepts[2] ?? topic.focus,
    topic.formulas[1] ? `Use with: ${topic.formulas[1]}` : 'Read the labelled diagram before substituting values',
    topic.applications[0] ? `Typical use: ${topic.applications[0]}` : 'Connect formula, graph, and observation',
  ];
  const lensIcon = `<circle cx="54" cy="140" r="17" fill="#e0f2fe" stroke="#111827" stroke-width="3"/><circle cx="54" cy="140" r="11" fill="#bae6fd" stroke="#ffffff" stroke-width="3"/><line x1="66" y1="153" x2="84" y2="174" stroke="#111827" stroke-width="5" stroke-linecap="round"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-label="${esc(topic.title)}">
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2,2 L10,6 L2,10 Z" fill="${palette.blue}"/>
    </marker>
    <marker id="arrowSmall" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="strokeWidth">
      <path d="M1.5,1.5 L8,4.5 L1.5,7.5 Z" fill="${palette.blue}"/>
    </marker>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.16"/>
    </filter>
    <linearGradient id="warmSteel" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="55%" stop-color="#dbeafe"/>
      <stop offset="100%" stop-color="#93c5fd"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1920" height="1080" fill="white"/>
  <rect x="3" y="3" width="1914" height="1074" fill="none" stroke="#111827" stroke-width="3"/>
  <text x="960" y="68" text-anchor="middle" font-family="Arial Black, Impact, Arial, sans-serif" font-size="${titleSize}" font-weight="950" letter-spacing="1.15" fill="#050505">${esc(topic.title.toUpperCase())}</text>
  <text x="960" y="109" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-size="24" font-weight="950" fill="#0b3a8a">NCERT CLASS 11 PHYSICS - ${esc(topic.chapter.toUpperCase())}</text>

  ${panel(`WHAT IS ${topic.title.replace(' EXPLAINED', '').replace('&', 'AND')}?`, whatItems, 30, 120, 480, 166, '#0b3a8a', { bodySize: 14, titleSize: 21, icon: lensIcon })}
  ${formulaPanel(topic.formulas, 30, 306, 480, 270)}
  ${sketchInset(topic.visual, 30, 614, 480, 196)}
  ${panel('TEACHER-LED CHECKPOINT', [topic.focus, `Ask students to label the diagram before solving.`], 30, 832, 480, 172, '#0f766e', { bodySize: 15, titleSize: 20 })}

  <text x="960" y="145" text-anchor="middle" font-family="Arial Narrow, Arial, sans-serif" font-size="25" font-weight="950" fill="#0b3a8a">MAIN DIAGRAM WITH LABELLED VARIABLES, DIRECTIONS AND ASSUMPTIONS</text>
  <g filter="url(#shadow)">
    ${drawVisual(topic.visual)}
  </g>
  <line x1="600" y1="752" x2="818" y2="684" stroke="#111827" stroke-width="2"/>
  <circle cx="818" cy="684" r="5" fill="#111827"/>
  <text x="575" y="766" text-anchor="end" font-family="Arial Narrow, Arial, sans-serif" font-size="18" font-weight="950" fill="#111827">LABELLED VARIABLES</text>
  <line x1="1320" y1="735" x2="1105" y2="650" stroke="#111827" stroke-width="2"/>
  <circle cx="1105" cy="650" r="5" fill="#111827"/>
  <text x="1328" y="746" text-anchor="end" font-family="Arial Narrow, Arial, sans-serif" font-size="18" font-weight="950" fill="#111827">MODEL CONDITIONS</text>
  <rect x="570" y="766" width="780" height="38" rx="5" fill="#ffffff" stroke="#1d4ed8" stroke-width="2"/>
  <text x="960" y="791" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="850" fill="#111827">Legend: arrows show directions; labels show variables; equations show model conditions.</text>
  ${miniFormulaStrip(topic, 520, 824, 880, 86)}
  ${panel('INTERPRETATION INSET', interpretation, 520, 924, 880, 118, '#1d4ed8', { bodySize: 13, titleSize: 19, maxWidth: 100 })}

  ${panel('NCERT CHECKPOINTS', checkpointItems, 1410, 120, 480, 198, '#0b3a8a', { bodySize: 14, titleSize: 20 })}
  ${panel('PROCESS / CAUSE-EFFECT FLOW', conceptFlow, 1410, 342, 480, 170, '#1d4ed8', { bodySize: 14, titleSize: 20 })}
  ${panel('COMMON MISCONCEPTIONS', topic.misconceptions, 1410, 536, 236, 286, '#dc2626', { bodySize: 14, titleSize: 19, maxWidth: 23 })}
  ${applicationsPanel(topic.applications, 1660, 536, 230, 286)}
</svg>
`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const topic of topics) {
  const file = path.join(OUT_DIR, `${topic.id}.svg`);
  fs.writeFileSync(file, makeSvg(topic), 'utf8');
}

console.log(`Generated ${topics.length} Class 11 Physics infographics in ${OUT_DIR}`);
