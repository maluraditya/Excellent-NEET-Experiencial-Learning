import React from 'react';
import { InfographicSpec } from '../types';

/**
 * NCERT-verified infographic specs — Class 12 Physics.
 * Content checked against NCERT Class 12 Physics via the class-12-physics MCP server.
 */

export const grade12Physics: Record<string, InfographicSpec> = {
  // NCERT XII Ch 11 — Dual Nature of Radiation and Matter
  dual_nature: {
    eyebrow: 'Dual Nature of Radiation',
    title: 'Photoelectric Effect',
    ncertRef: 'NCERT XII · Ch 11',
    tagline: 'Light striking a metal ejects electrons — proof of the particle (photon) nature of light.',
    blocks: [
      {
        kind: 'diagram',
        heading: 'The Experiment',
        svg: (
          <svg viewBox="0 0 360 170" className="w-full" role="img" aria-label="Photoelectric effect apparatus">
            {/* incident light */}
            {[0, 1, 2].map((i) => (
              <line key={i} x1={20} y1={40 + i * 14} x2={110} y2={70 + i * 6} stroke="#FFC748" strokeWidth="3" strokeLinecap="round" />
            ))}
            <text x="16" y="32" fontSize="9" fontWeight="700" fill="#B3202F">Incident light (hν)</text>
            {/* emitter plate */}
            <rect x="112" y="45" width="10" height="80" rx="2" fill="#B3202F" />
            <text x="90" y="140" fontSize="9" fill="#7c2d12">Emitter</text>
            {/* ejected electrons */}
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <circle cx={150 + i * 20} cy={70 + i * 12} r="4" fill="#2A0A0E" />
                <text x={147 + i * 20} y={73 + i * 12} fontSize="6" fill="#fff">–</text>
              </g>
            ))}
            <text x="150" y="120" fontSize="9" fill="#334155">photoelectrons</text>
            {/* collector plate */}
            <rect x="238" y="45" width="10" height="80" rx="2" fill="#2A0A0E" opacity="0.7" />
            <text x="228" y="140" fontSize="9" fill="#334155">Collector</text>
            {/* circuit */}
            <path d="M117 130 h150 v-5" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="300" cy="85" r="14" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="293" y="89" fontSize="10" fill="#64748b">A</text>
            <path d="M243 125 h30 v-26" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        kind: 'formula',
        heading: 'Key Relations',
        items: [
          { expr: 'K_max = hν − φ₀', note: "Einstein's photoelectric equation (energy conservation)" },
          { expr: 'ν₀ = φ₀ / h', note: 'Threshold frequency — below it, no emission at any intensity' },
          { expr: 'eV₀ = K_max', note: 'Stopping potential measures the max electron energy' },
        ],
      },
      {
        kind: 'compare',
        heading: 'Why Wave Theory Failed',
        columns: [
          { title: 'Photon picture ✓', tag: 'correct', tone: 'red', points: ['One photon absorbed by one electron', 'K_max rises with frequency', 'Emission is instantaneous'] },
          { title: 'Wave picture ✗', tag: 'fails', tone: 'slate', points: ['Predicts energy builds up slowly', "Can't explain threshold ν₀", "Can't explain intensity independence"] },
        ],
      },
      {
        kind: 'facts',
        heading: 'Remember (NCERT)',
        items: [
          'Stopping potential is independent of intensity',
          'K_max depends on frequency, not intensity',
          'Emission starts in ~10⁻⁹ s (no time lag)',
          'Photon: E = hν, p = h/λ',
        ],
      },
    ],
  },

  // NCERT XII Ch 12 — Atoms (Bohr model)
  atoms: {
    eyebrow: 'Atoms · Bohr Model',
    title: 'The Bohr Atom',
    ncertRef: 'NCERT XII · Ch 12',
    tagline: 'Electrons orbit in fixed energy levels; jumps between them emit or absorb photons.',
    blocks: [
      {
        kind: 'diagram',
        heading: 'Energy Levels',
        svg: (
          <svg viewBox="0 0 360 190" className="w-full" role="img" aria-label="Bohr energy levels of hydrogen">
            <circle cx="60" cy="95" r="7" fill="#B3202F" />
            {[26, 46, 66, 82].map((r, i) => (
              <circle key={i} cx="60" cy="95" r={r} fill="none" stroke="#cbd5e1" strokeWidth="1.4" />
            ))}
            <circle cx="60" cy="49" r="4" fill="#2A0A0E" />
            {/* level ladder */}
            {[
              { y: 40, n: 'n=4', e: '−0.85 eV' },
              { y: 66, n: 'n=3', e: '−1.51 eV' },
              { y: 100, n: 'n=2', e: '−3.40 eV' },
              { y: 160, n: 'n=1', e: '−13.6 eV (ground)' },
            ].map((lv, i) => (
              <g key={i}>
                <line x1="180" y1={lv.y} x2="300" y2={lv.y} stroke="#B3202F" strokeWidth="2" />
                <text x="305" y={lv.y + 3} fontSize="8.5" fill="#334155">{lv.n}</text>
                <text x="180" y={lv.y - 4} fontSize="8" fill="#94a3b8">{lv.e}</text>
              </g>
            ))}
            {/* emission arrow */}
            <line x1="210" y1="100" x2="210" y2="158" stroke="#FFC748" strokeWidth="2.5" markerEnd="url(#adown)" />
            <text x="214" y="135" fontSize="8" fill="#a16207">photon</text>
            <defs>
              <marker id="adown" markerWidth="8" markerHeight="8" refX="3" refY="6" orient="auto"><path d="M0 0 L6 0 L3 6 Z" fill="#FFC748" /></marker>
            </defs>
          </svg>
        ),
        caption: 'Emission when an electron drops to a lower level: hν = Eᵢ − E_f',
      },
      {
        kind: 'points',
        heading: "Bohr's Three Postulates",
        items: [
          { label: 'Stable stationary orbits', sub: 'Electrons revolve without radiating energy' },
          { label: 'Quantised angular momentum', sub: 'L = n·h/2π (n = principal quantum number)' },
          { label: 'Quantum jumps emit/absorb photons', sub: 'hν = Eᵢ − E_f between orbits' },
        ],
      },
      {
        kind: 'formula',
        heading: 'Core Formulae',
        items: [
          { expr: 'Eₙ = −13.6 / n²  eV', note: 'Energy of the n-th level in hydrogen' },
          { expr: 'L = n h / 2π', note: 'Bohr quantisation condition' },
          { expr: 'rₙ ∝ n²', note: 'Orbit radius grows with n²' },
        ],
      },
      {
        kind: 'facts',
        heading: 'Remember (NCERT)',
        items: [
          'Ground state energy = −13.6 eV',
          'Applies only to hydrogenic (1-electron) atoms',
          "Can't explain multi-electron atoms",
          "Can't explain relative line intensities",
        ],
      },
    ],
  },

  // NCERT XII Ch 13 — Nuclei
  nuclei: {
    eyebrow: 'Nuclei',
    title: 'Binding Energy, Fission & Fusion',
    ncertRef: 'NCERT XII · Ch 13',
    tagline: 'A nucleus weighs less than its parts — the missing mass is its binding energy.',
    blocks: [
      {
        kind: 'diagram',
        heading: 'Binding Energy per Nucleon',
        svg: (
          <svg viewBox="0 0 360 180" className="w-full" role="img" aria-label="Binding energy per nucleon curve">
            <line x1="40" y1="150" x2="340" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="40" y1="150" x2="40" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="150" y="170" fontSize="9" fill="#64748b">Mass number A →</text>
            <text x="12" y="80" fontSize="9" fill="#64748b" transform="rotate(-90 12 80)">E_b/A (MeV)</text>
            {/* curve rising to ~8.5 near Fe then slowly falling */}
            <path d="M45 145 Q70 60 110 52 Q160 45 200 55 Q270 70 335 95" fill="none" stroke="#B3202F" strokeWidth="2.5" />
            <line x1="40" y1="60" x2="340" y2="60" stroke="#FFC748" strokeWidth="1" strokeDasharray="4 3" />
            <text x="300" y="56" fontSize="8" fill="#a16207">~8 MeV</text>
            <circle cx="118" cy="51" r="3" fill="#2A0A0E" />
            <text x="102" y="44" fontSize="8" fill="#334155">peak ≈ Fe</text>
            <text x="60" y="120" fontSize="8" fill="#64748b">fusion →</text>
            <text x="270" y="120" fontSize="8" fill="#64748b">← fission</text>
          </svg>
        ),
      },
      {
        kind: 'formula',
        heading: 'Mass Defect & Binding Energy',
        items: [
          { expr: 'ΔM = [Z·mₚ + (A−Z)·mₙ] − M', note: 'Nuclear mass is less than the sum of constituents' },
          { expr: 'E_b = ΔM · c²', note: "Einstein's mass–energy relation" },
        ],
      },
      {
        kind: 'compare',
        heading: 'Two Energy-Releasing Paths',
        columns: [
          { title: 'Fission', tone: 'red', points: ['Heavy nucleus splits (e.g. ²³⁵U)', '≈ 200 MeV per nucleus', 'Powers reactors & atom bombs'] },
          { title: 'Fusion', tone: 'amber', points: ['Light nuclei combine', 'Products more tightly bound', 'Energy source of the Sun & stars'] },
        ],
      },
      {
        kind: 'facts',
        heading: 'Remember (NCERT)',
        items: [
          'E_b/A ≈ 8 MeV for A = 30–170',
          'α-decay: emits a He nucleus (⁴₂He)',
          'β-decay: emits electrons/positrons',
          'γ-decay: high-energy photons',
        ],
      },
    ],
  },

  // NCERT XII Ch 14 — Semiconductor Electronics
  semiconductors: {
    eyebrow: 'Semiconductor Electronics',
    title: 'Semiconductors & the p-n Junction',
    ncertRef: 'NCERT XII · Ch 14',
    tagline: 'Resistivity between metals and insulators — tunable by doping.',
    blocks: [
      {
        kind: 'diagram',
        heading: 'The p-n Junction',
        svg: (
          <svg viewBox="0 0 360 150" className="w-full" role="img" aria-label="p-n junction with depletion region">
            <rect x="40" y="45" width="120" height="60" rx="4" fill="#B3202F" opacity="0.14" stroke="#B3202F" strokeWidth="1.5" />
            <rect x="200" y="45" width="120" height="60" rx="4" fill="#2A0A0E" opacity="0.12" stroke="#2A0A0E" strokeWidth="1.5" />
            <rect x="160" y="45" width="40" height="60" fill="#FFC748" opacity="0.35" />
            <text x="85" y="80" fontSize="16" fontWeight="800" fill="#B3202F">p</text>
            <text x="255" y="80" fontSize="16" fontWeight="800" fill="#2A0A0E">n</text>
            <text x="90" y="122" fontSize="8.5" fill="#7c2d12">holes (+)</text>
            <text x="240" y="122" fontSize="8.5" fill="#334155">electrons (–)</text>
            <text x="140" y="30" fontSize="8.5" fill="#a16207">depletion region</text>
            <line x1="180" y1="35" x2="180" y2="115" stroke="#a16207" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        ),
        caption: 'Formed by doping — diffusion & drift create a depletion layer and barrier potential V₀',
      },
      {
        kind: 'compare',
        heading: 'Doping: Two Types',
        columns: [
          { title: 'n-type', tone: 'red', points: ['Pentavalent donors (As, Sb, P)', 'Electrons are majority carriers', 'nₑ ≫ n_h'] },
          { title: 'p-type', tone: 'amber', points: ['Trivalent acceptors (B, Al, In)', 'Holes are majority carriers', 'n_h ≫ nₑ'] },
        ],
      },
      {
        kind: 'compare',
        heading: 'Biasing the Diode',
        columns: [
          { title: 'Forward bias', tone: 'red', points: ['p to +, n to − terminal', 'Barrier & depletion width shrink', 'Large current (mA)'] },
          { title: 'Reverse bias', tone: 'slate', points: ['p to −, n to + terminal', 'Barrier increases', 'Tiny current (µA)'] },
        ],
      },
      {
        kind: 'facts',
        heading: 'Remember (NCERT)',
        items: [
          'Resistivity: between metals & insulators',
          'Intrinsic: nₑ = n_h (thermal)',
          'nₑ·n_h = nᵢ² always holds',
          'Diode = two-terminal p-n junction',
        ],
      },
    ],
  },

  // NCERT XII Ch 1 — Electric Charges and Fields
  'electric-charges-fields': {
    eyebrow: 'Electric Charges & Fields',
    title: 'Charges, Fields & Gauss’s Law',
    ncertRef: 'NCERT XII · Ch 1',
    tagline: 'Charges exert forces through a field; Gauss’s law links field to enclosed charge.',
    blocks: [
      {
        kind: 'diagram',
        heading: 'Electric Dipole',
        svg: (
          <svg viewBox="0 0 340 120" className="w-full" role="img" aria-label="Electric dipole">
            <circle cx="120" cy="60" r="16" fill="#2A0A0E" opacity="0.75" />
            <text x="115" y="65" fontSize="14" fill="#fff">–q</text>
            <circle cx="220" cy="60" r="16" fill="#B3202F" />
            <text x="216" y="65" fontSize="14" fill="#fff">+q</text>
            <line x1="120" y1="60" x2="220" y2="60" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1="128" y1="88" x2="212" y2="88" stroke="#B3202F" strokeWidth="2" markerEnd="url(#dp)" />
            <text x="150" y="104" fontSize="10" fill="#B3202F">p = 2qa  (−q → +q)</text>
            <text x="160" y="50" fontSize="9" fill="#64748b">2a</text>
            <defs><marker id="dp" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#B3202F" /></marker></defs>
          </svg>
        ),
      },
      {
        kind: 'formula',
        heading: 'Core Laws',
        items: [
          { expr: 'F = (1/4πε₀) · q₁q₂ / r²', note: "Coulomb's law between point charges" },
          { expr: 'Φ = E · ΔS', note: 'Electric flux through an area element' },
          { expr: 'Φ_closed = q_enc / ε₀', note: "Gauss's law — flux depends only on enclosed charge" },
        ],
      },
      {
        kind: 'compare',
        heading: 'Coulomb vs Gravity',
        columns: [
          { title: 'Coulomb force', tone: 'red', points: ['Both signs (±)', 'Attractive or repulsive', 'Can cancel out'] },
          { title: 'Gravity', tone: 'slate', points: ['One sign only', 'Always attractive', 'Never cancels'] },
        ],
      },
      {
        kind: 'facts',
        heading: 'Remember (NCERT)',
        items: [
          'Point charge: E ∝ 1/r²',
          'Dipole: E ∝ 1/r³',
          'Uniform field: τ = p × E, no net force',
          'Field inside a charged shell = 0',
        ],
      },
    ],
  },

  // NCERT XII Ch 2 — Electrostatic Potential and Capacitance
  'electrostatic-potential-capacitance': {
    eyebrow: 'Potential & Capacitance',
    title: 'Electrostatic Potential & Capacitors',
    ncertRef: 'NCERT XII · Ch 2',
    tagline: 'A capacitor stores charge; its capacitance depends only on geometry and the dielectric.',
    blocks: [
      {
        kind: 'diagram',
        heading: 'Parallel-Plate Capacitor',
        svg: (
          <svg viewBox="0 0 320 130" className="w-full" role="img" aria-label="Parallel plate capacitor">
            <rect x="90" y="25" width="12" height="80" fill="#B3202F" />
            <rect x="210" y="25" width="12" height="80" fill="#2A0A0E" opacity="0.7" />
            {[0, 1, 2, 3].map((i) => (
              <text key={i} x="106" y={40 + i * 18} fontSize="12" fill="#B3202F">+</text>
            ))}
            {[0, 1, 2, 3].map((i) => (
              <text key={i} x="198" y={40 + i * 18} fontSize="12" fill="#334155">–</text>
            ))}
            <text x="70" y="120" fontSize="9" fill="#64748b">A</text>
            <line x1="102" y1="115" x2="210" y2="115" stroke="#94a3b8" strokeWidth="1" />
            <text x="145" y="128" fontSize="9" fill="#64748b">d</text>
            <rect x="140" y="25" width="40" height="80" fill="#FFC748" opacity="0.25" />
            <text x="143" y="20" fontSize="8" fill="#a16207">dielectric K</text>
          </svg>
        ),
      },
      {
        kind: 'formula',
        heading: 'Key Relations',
        items: [
          { expr: 'C = Q / V', note: 'Capacitance — set purely by geometry' },
          { expr: 'C = K ε₀ A / d', note: 'Parallel plate with dielectric constant K' },
          { expr: 'U = ½CV² = ½QV = ½Q²/C', note: 'Energy stored' },
        ],
      },
      {
        kind: 'compare',
        heading: 'Combining Capacitors',
        columns: [
          { title: 'Series', tone: 'red', points: ['1/C = Σ 1/Cᵢ', 'Same charge on each', 'C decreases'] },
          { title: 'Parallel', tone: 'amber', points: ['C = Σ Cᵢ', 'Same voltage across each', 'C increases'] },
        ],
      },
      {
        kind: 'facts',
        heading: 'Remember (NCERT)',
        items: [
          'Farad = 1 C V⁻¹ (a very large unit)',
          'Dielectric constant K > 1 always',
          'Energy density = ½ε₀E²',
          'C depends only on geometry & medium',
        ],
      },
    ],
  },

  // NCERT XII Ch 3 — Current Electricity
  'current-electricity': {
    eyebrow: 'Current Electricity',
    title: 'Ohm’s Law, Drift & Circuits',
    ncertRef: 'NCERT XII · Ch 3',
    tagline: 'Current is drifting electrons; Kirchhoff’s rules solve any circuit.',
    blocks: [
      {
        kind: 'formula',
        heading: 'Core Relations',
        items: [
          { expr: 'V = I R', note: "Ohm's law (not a fundamental law of nature)" },
          { expr: 'R = ρ l / A', note: 'Resistance from geometry & resistivity' },
          { expr: 'v_d = eEτ / m', note: 'Drift speed (τ = relaxation time)' },
        ],
      },
      {
        kind: 'points',
        heading: "Kirchhoff's Rules",
        items: [
          { label: 'Junction rule', sub: 'Σ currents in = Σ currents out (charge conservation)' },
          { label: 'Loop rule', sub: 'Σ potential changes around a loop = 0 (energy conservation)' },
        ],
      },
      {
        kind: 'compare',
        heading: 'Ohmic vs Non-Ohmic',
        columns: [
          { title: 'Conductor', tone: 'red', points: ['V–I is linear', 'Obeys V = IR', 'Fixed resistance'] },
          { title: 'Diode', tone: 'slate', points: ['V–I non-linear', "Doesn't obey Ohm's law", 'Direction-dependent'] },
        ],
      },
      {
        kind: 'facts',
        heading: 'Remember (NCERT)',
        items: [
          'EMF is a voltage, not a force',
          'Metals: ρ ≈ 10⁻⁸–10⁻⁶ Ω·m',
          'Conductivity σ = 1/ρ',
          'Drift velocity opposes E',
        ],
      },
    ],
  },

  // NCERT XII Ch 6 — Electromagnetic Induction
  emi: {
    eyebrow: 'Electromagnetic Induction',
    title: 'Faraday & Lenz',
    ncertRef: 'NCERT XII · Ch 6',
    tagline: 'A changing magnetic flux induces an emf that opposes the change.',
    blocks: [
      {
        kind: 'diagram',
        heading: 'Changing Flux → EMF',
        svg: (
          <svg viewBox="0 0 320 130" className="w-full" role="img" aria-label="Magnet moving into a coil">
            <ellipse cx="200" cy="65" rx="14" ry="42" fill="none" stroke="#B3202F" strokeWidth="2" />
            <ellipse cx="215" cy="65" rx="14" ry="42" fill="none" stroke="#B3202F" strokeWidth="2" />
            <ellipse cx="230" cy="65" rx="14" ry="42" fill="none" stroke="#B3202F" strokeWidth="2" />
            <rect x="60" y="52" width="70" height="26" rx="3" fill="#2A0A0E" opacity="0.75" />
            <text x="70" y="70" fontSize="12" fill="#fff">N   S</text>
            <line x1="132" y1="65" x2="175" y2="65" stroke="#FFC748" strokeWidth="2.5" markerEnd="url(#mv)" />
            <text x="130" y="45" fontSize="9" fill="#a16207">move</text>
            <circle cx="275" cy="65" r="12" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="270" y="69" fontSize="9" fill="#64748b">G</text>
            <path d="M244 55 h20 v-3 M244 78 h20 v3" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
            <defs><marker id="mv" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#FFC748" /></marker></defs>
          </svg>
        ),
      },
      {
        kind: 'formula',
        heading: 'Key Relations',
        items: [
          { expr: 'Φ_B = B·A·cosθ', note: 'Magnetic flux (unit: weber)' },
          { expr: 'ε = −N dΦ_B/dt', note: "Faraday's law (− sign = Lenz's law)" },
          { expr: 'ε = B l v', note: 'Motional emf of a rod moving in a field' },
        ],
      },
      {
        kind: 'points',
        heading: 'Two Laws',
        items: [
          { label: "Faraday's law", sub: 'Induced emf = rate of change of flux' },
          { label: "Lenz's law", sub: 'Induced current opposes the flux change (energy conservation)' },
        ],
      },
      {
        kind: 'facts',
        heading: 'Remember (NCERT)',
        items: [
          'Self-inductance: E = −L dI/dt',
          'Inductance = NΦ/I (unit: henry)',
          'Mutual inductance: M₁₂ = M₂₁',
          'Increase emf by increasing turns N',
        ],
      },
    ],
  },
};
