import React from 'react';
import { TOPICS } from '../data';

interface TextbookContentProps {
  topicId: string;
}

const TextbookContent: React.FC<TextbookContentProps> = ({ topicId }) => {
  
  // Find topic to get video IDs
  const topicData = TOPICS.find(t => t.id === topicId);
  
  const VideoSection = () => (
    <div className="mt-12 mb-12">
      <h3 className="text-xl font-display font-bold text-brand-primary mb-6 flex items-center">
        <span className="w-1 h-8 bg-brand-secondary mr-3 rounded-full"></span>
        Video Resources
      </h3>
      <div className="grid gap-8">
        {topicData?.youtubeVideoIds.map((vid) => (
          <div key={vid} className="rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-black aspect-video relative">
            <iframe 
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${vid}?rel=0&modestbranding=1`} 
              title="Educational Video" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        ))}
      </div>
    </div>
  );

  // --- UNIT 1: SOLID STATE TOPICS ---

  if (topicId === 'solids_classification') {
      return (
        <div className="prose prose-slate prose-lg max-w-none font-sans">
          <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Classification of Crystalline Solids</h1>
          <p className="lead text-xl text-slate-600 mb-8">
            Solids are classified based on the nature of intermolecular forces operating between their constituent particles.
          </p>

          <div className="grid md:grid-cols-2 gap-6 my-8">
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold text-brand-dark mb-2">1. Molecular Solids</h3>
                <p className="text-sm">Held by weak dispersion or dipole forces. Soft, insulators, low melting points. (e.g., Ice, Ar, Dry Ice).</p>
             </div>
             <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <h3 className="font-bold text-brand-primary mb-2">2. Ionic Solids</h3>
                <p className="text-sm">Ions held by strong electrostatic forces. Hard, brittle, high MP. Conductors only in molten/aqueous state. (e.g., NaCl).</p>
             </div>
             <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
                <h3 className="font-bold text-yellow-800 mb-2">3. Metallic Solids</h3>
                <p className="text-sm">Positive kernels in a sea of electrons. Hard, malleable, ductile. Good conductors. (e.g., Fe, Cu).</p>
             </div>
             <div className="bg-gray-100 p-6 rounded-xl border border-gray-300">
                <h3 className="font-bold text-slate-800 mb-2">4. Covalent Solids</h3>
                <p className="text-sm">Atoms linked by continuous covalent bonds. Extremely hard, very high MP. (e.g., Diamond, Quartz).</p>
             </div>
          </div>
          <VideoSection />
        </div>
      );
  }

  if (topicId === 'unit_cells') {
      return (
        <div className="prose prose-slate prose-lg max-w-none font-sans">
          <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Unit Cells & Atomic Calculation</h1>
          <p className="lead text-xl text-slate-600 mb-8">
            A crystal lattice is built by repeating unit cells. The number of atoms (Z) within a cell depends on particle sharing.
          </p>
          
          <h3 className="font-bold text-brand-dark mt-8">Calculation of 'Z'</h3>
          <ul className="list-disc pl-5 space-y-4 mb-8">
            <li>
                <strong>Simple Cubic (SCC):</strong> Atoms at 8 corners only.<br/>
                <em>Calculation:</em> 8 × (1/8) = <strong>1 Atom</strong>.
            </li>
            <li>
                <strong>Body-Centered Cubic (BCC):</strong> 8 Corners + 1 Body Center.<br/>
                <em>Calculation:</em> (8 × 1/8) + 1 = <strong>2 Atoms</strong>.
            </li>
            <li>
                <strong>Face-Centered Cubic (FCC):</strong> 8 Corners + 6 Face Centers.<br/>
                <em>Calculation:</em> (8 × 1/8) + (6 × 1/2) = <strong>4 Atoms</strong>.
            </li>
          </ul>
          <VideoSection />
        </div>
      );
  }

  if (topicId === 'packing') {
      return (
        <div className="prose prose-slate prose-lg max-w-none font-sans">
          <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Packing Efficiency</h1>
          <p className="lead text-xl text-slate-600 mb-8">
             Packing efficiency determines how closely particles are packed. FCC is the most efficient structure.
          </p>

          <table className="w-full text-sm text-left border rounded-lg overflow-hidden my-8">
            <thead className="bg-slate-100 uppercase">
                <tr>
                    <th className="px-6 py-3">Lattice</th>
                    <th className="px-6 py-3">Relation (r vs a)</th>
                    <th className="px-6 py-3">Efficiency</th>
                    <th className="px-6 py-3">Void Space</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b">
                    <td className="px-6 py-4 font-bold">Simple Cubic</td>
                    <td className="px-6 py-4">r = a / 2</td>
                    <td className="px-6 py-4">52.4%</td>
                    <td className="px-6 py-4 text-red-500">47.6%</td>
                </tr>
                <tr className="border-b">
                    <td className="px-6 py-4 font-bold">BCC</td>
                    <td className="px-6 py-4">r = √3a / 4</td>
                    <td className="px-6 py-4">68%</td>
                    <td className="px-6 py-4 text-yellow-600">32%</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 font-bold text-green-700">FCC / CCP</td>
                    <td className="px-6 py-4">r = a / 2√2</td>
                    <td className="px-6 py-4 font-bold text-green-700">74%</td>
                    <td className="px-6 py-4 text-green-700">26%</td>
                </tr>
            </tbody>
          </table>
          <VideoSection />
        </div>
      );
  }

  if (topicId === 'defects') {
      return (
        <div className="prose prose-slate prose-lg max-w-none font-sans">
          <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Point Defects in Solids</h1>
          <p className="lead text-xl text-slate-600 mb-8">
            Crystals are rarely perfect. Point defects occur around an atom or lattice site.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 my-8">
             <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                 <h3 className="font-bold text-xl text-brand-primary mb-4">Schottky Defect</h3>
                 <p><strong>Type:</strong> Vacancy Defect.</p>
                 <p className="mt-2">Equal number of Cations and Anions are missing. Electrical neutrality is maintained, but <strong>Density Decreases</strong>.</p>
                 <p className="mt-2 text-sm text-slate-500">Example: NaCl, KCl, AgBr.</p>
             </div>
             <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                 <h3 className="font-bold text-xl text-green-700 mb-4">Frenkel Defect</h3>
                 <p><strong>Type:</strong> Dislocation Defect.</p>
                 <p className="mt-2">The smaller ion (cation) is dislocated to an interstitial site. Creates a vacancy and an interstitial defect. <strong>Density remains same</strong>.</p>
                 <p className="mt-2 text-sm text-slate-500">Example: AgCl, ZnS, AgBr.</p>
             </div>
          </div>
          <VideoSection />
        </div>
      );
  }

  // --- EXISTING TOPICS ---

  if (topicId === 'kinetics') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Collision Theory and Activation Energy</h1>
        
        <p className="lead text-xl text-slate-600 mb-8">
          The study of reaction rates and mechanisms falls under the branch of chemistry called <strong>Chemical Kinetics</strong>. 
          While thermodynamics tells us if a reaction is feasible, chemical kinetics informs us about the speed of that reaction.
        </p>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">I. The Basis of Collision Theory</h3>
        <p>
          The Collision Theory, developed by Max Trautz and William Lewis (1916–18), assumes reactant molecules are hard spheres. 
          Reaction occurs only when these molecules <strong>collide</strong> with each other. However, not all collisions are successful.
        </p>

        <div className="my-8 p-6 bg-yellow-50 border-l-4 border-brand-secondary rounded-r-xl">
          <h4 className="font-bold text-brand-primary mb-2 font-display">Mathematical Formulation</h4>
          <p className="font-mono text-lg text-slate-800">Rate = P × Z<sub>AB</sub> × e<sup>-Ea/RT</sup></p>
          <ul className="list-disc ml-6 mt-2 text-sm text-slate-700">
            <li><strong>Z<sub>AB</sub></strong>: Collision frequency</li>
            <li><strong>e<sup>-Ea/RT</sup></strong>: Fraction of molecules with Energy ≥ Ea</li>
            <li><strong>P</strong>: Steric factor (Orientation)</li>
          </ul>
        </div>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">II. Barriers to Reaction</h3>
        
        <h4 className="font-bold text-brand-primary mt-4">1. Energy Barrier (Activation Energy, E<sub>a</sub>)</h4>
        <p>
          Colliding molecules must possess a minimum <strong>Threshold Energy</strong>. The extra energy required by reactants to form the 
          intermediate <em>Activated Complex</em> is called Activation Energy.
        </p>

        <h4 className="font-bold text-brand-primary mt-4">2. Orientation Barrier (Steric Factor, P)</h4>
        <p>
          Molecules must collide with proper orientation to break old bonds and form new ones.
          For example, in the formation of Methanol from Bromoethane, the OH⁻ ion must attack the carbon from the back side. 
          Improper orientation leads to no reaction (bounce back).
        </p>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Automotive Catalytic Converters</h4>
            <p className="text-slate-600">
              In cars, catalytic converters use metals like Platinum to lower the <strong>Activation Energy</strong> of harmful exhaust gases 
              (CO, NOx). By providing a surface with correct orientation sites, the catalyst allows these gases to react at lower temperatures, 
              converting them into harmless CO₂ and N₂ efficiently.
            </p>
          </div>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topicId === 'electrochemistry') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Functioning of Galvanic and Electrolytic Cells</h1>
        
        <p className="lead text-xl text-slate-600 mb-8">
          <strong>Electrochemistry</strong> links chemical reactions and electricity. The critical concept is understanding how spontaneous reactions 
          can generate power (Galvanic), and how external power can drive non-spontaneous reactions (Electrolytic).
        </p>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">I. Galvanic (Voltaic) Cells</h3>
        <p>
          Converts chemical energy from a <strong>spontaneous</strong> redox reaction into electrical energy.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Example:</strong> Daniell Cell (Zn + Cu²⁺ → Zn²⁺ + Cu)</li>
          <li><strong>Anode (Negative):</strong> Zinc oxidizes (Zn → Zn²⁺ + 2e⁻). The electrode shrinks.</li>
          <li><strong>Cathode (Positive):</strong> Copper reduces (Cu²⁺ + 2e⁻ → Cu). The electrode grows.</li>
          <li><strong>Electron Flow:</strong> Anode → Cathode.</li>
        </ul>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">II. Electrolytic Cells</h3>
        <p>
          Uses external electrical energy to drive a <strong>non-spontaneous</strong> reaction.
        </p>
        <div className="my-4 p-4 bg-red-50 border-l-4 border-brand-primary rounded-r-xl">
          <p className="text-red-900 font-medium">
            <strong>Key Concept:</strong> If External Voltage (E<sub>ext</sub>) > 1.1V (Cell Potential), the reaction reverses!
          </p>
        </div>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>The Zinc electrode becomes the Cathode (Reduction).</li>
          <li>The Copper electrode becomes the Anode (Oxidation).</li>
          <li>Current flows in the opposite direction.</li>
        </ul>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">III. The Electrochemical Continuum</h3>
        <table className="w-full text-sm text-left rtl:text-right text-slate-500 border rounded-lg overflow-hidden">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                <tr>
                    <th scope="col" className="px-6 py-3">External Voltage (E<sub>ext</sub>)</th>
                    <th scope="col" className="px-6 py-3">Cell Type</th>
                    <th scope="col" className="px-6 py-3">Reaction Status</th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-white border-b">
                    <td className="px-6 py-4">&lt; 1.1 V</td>
                    <td className="px-6 py-4 font-bold text-green-600">Galvanic</td>
                    <td className="px-6 py-4">Spontaneous (Zn dissolves)</td>
                </tr>
                <tr className="bg-white border-b">
                    <td className="px-6 py-4">= 1.1 V</td>
                    <td className="px-6 py-4">Equilibrium</td>
                    <td className="px-6 py-4">No Reaction (I = 0)</td>
                </tr>
                <tr className="bg-white">
                    <td className="px-6 py-4">&gt; 1.1 V</td>
                    <td className="px-6 py-4 font-bold text-brand-primary">Electrolytic</td>
                    <td className="px-6 py-4">Non-spontaneous (Cu dissolves)</td>
                </tr>
            </tbody>
        </table>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Rechargeable Batteries (Li-ion)</h4>
            <p className="text-slate-600">
              Your smartphone battery operates on this exact principle. When you use the phone, it acts as a <strong>Galvanic cell</strong> (discharging). 
              When you plug it into the wall charger, the external voltage forces electrons back, turning it into an <strong>Electrolytic cell</strong> to 
              restore the chemical potential (recharging).
            </p>
          </div>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topicId === 'stereochemistry') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Stereoisomerism in Coordination Compounds</h1>
        
        <p className="lead text-xl text-slate-600 mb-8">
          <strong>Isomerism</strong> describes two compounds with the same chemical formula but different arrangements of atoms. 
          <strong>Stereoisomers</strong> have the same chemical bonds but differ in 3D spatial arrangement.
        </p>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">I. Geometrical Isomerism</h3>
        <p>
           This arises in heteroleptic complexes due to different possible geometric arrangements of the ligands.
        </p>
        
        <h4 className="font-bold text-brand-primary mt-4">1. Cis vs Trans (Square Planar)</h4>
        <p>
          In complexes like [Pt(NH₃)₂Cl₂]:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Cis Isomer:</strong> Identical ligands are adjacent (90°). e.g., "Cis-platin" (Anti-cancer drug).</li>
          <li><strong>Trans Isomer:</strong> Identical ligands are opposite (180°).</li>
        </ul>

        <h4 className="font-bold text-brand-primary mt-4">2. Fac vs Mer (Octahedral)</h4>
        <p>
          In complexes like [Co(NH₃)₃(NO₂)₃]:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Facial (fac):</strong> Three identical ligands occupy the corners of one triangular face of the octahedron.</li>
          <li><strong>Meridional (mer):</strong> Three identical ligands occupy positions around the meridian (a plane passing through center).</li>
        </ul>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">II. Optical Isomerism (Chirality)</h3>
        <p>
          Optical isomers are mirror images that cannot be superimposed on one another. These are called <strong>Enantiomers</strong>.
        </p>
        <div className="my-4 p-4 bg-purple-50 border-l-4 border-brand-primary rounded-r-xl">
          <p className="text-purple-900 font-medium">
            <strong>The Mirror Test:</strong> To check for chirality, imagine placing the molecule in front of a mirror. If the reflection cannot be rotated to perfectly overlap the original, the molecule is Chiral.
          </p>
        </div>
        <p>
          Common in octahedral complexes involving didentate ligands (e.g., [Co(en)₃]³⁺).
        </p>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Medical Significance: Thalidomide</h4>
            <p className="text-slate-600">
              The tragic case of Thalidomide in the 1960s highlighted stereochemistry's importance. One enantiomer cured morning sickness, 
              but its mirror image caused severe birth defects. Today, drug manufacturers must separate and test <strong>stereoisomers</strong> individually 
              to ensure safety.
            </p>
          </div>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topicId === 'dblock') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Magnetic Properties and Color Formation</h1>
        
        <p className="lead text-xl text-slate-600 mb-8">
          The unique properties of transition metals—their magnetic behavior and vibrant colors—are fundamentally linked to the electronic arrangement within the partially filled d orbitals.
        </p>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">I. Magnetic Properties</h3>
        <p>
          Transition metals frequently exhibit <strong>paramagnetism</strong> due to the presence of unpaired electrons in their d orbitals.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Paramagnetic:</strong> Attracted by magnetic fields (Has unpaired e⁻). e.g., Mn²⁺.</li>
          <li><strong>Diamagnetic:</strong> Repelled by magnetic fields (All e⁻ paired). e.g., Zn²⁺ (d¹⁰).</li>
        </ul>

        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <h4 className="font-bold text-slate-800 mb-2">Magnetic Moment Formula (Spin Only)</h4>
          <p className="font-mono text-xl text-brand-primary">μ = √[n(n+2)] BM</p>
          <p className="text-sm text-slate-600 mt-2">Where <em>n</em> is the number of unpaired electrons and BM is Bohr Magneton.</p>
        </div>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">II. Formation of Colored Ions</h3>
        <p>
          Most transition metal ions form colored compounds. This is explained by <strong>Crystal Field Theory (CFT)</strong>.
        </p>
        
        <h4 className="font-bold text-brand-primary mt-4">d-d Transitions</h4>
        <p>
          When ligands approach the metal ion, the 5 degenerate d-orbitals split into two sets: lower energy <strong>t₂g</strong> and higher energy <strong>e₉</strong>.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
           <li>An electron absorbs light energy to jump from t₂g to e₉.</li>
           <li>The color observed is the <strong>complementary color</strong> of the light absorbed.</li>
           <li>Example: [Ti(H₂O)₆]³⁺ absorbs blue-green light to excite its d¹ electron, making it appear <strong>Violet</strong>.</li>
        </ul>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Gemstones & Pigments</h4>
            <p className="text-slate-600">
               The distinct red color of <strong>Ruby</strong> comes from Cr³⁺ impurities in Al₂O₃. The crystal field of the oxide ions causes the d-electrons of Chromium to absorb green light and transmit red. Similarly, Emeralds get their green color from the same ion (Cr³⁺) in a different crystal environment (Beryl), which changes the splitting energy (Δ₀).
            </p>
          </div>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topicId === 'haloalkanes') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Haloalkanes and Haloarenes: SN1 vs SN2</h1>
        
        <p className="lead text-xl text-slate-600 mb-8">
          Nucleophilic substitution reactions involve a nucleophile attacking the electron-deficient carbon atom of a haloalkane, causing the halogen atom (the leaving group) to depart. The mechanism depends on the substrate structure.
        </p>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">I. SN2 (Substitution Nucleophilic Bimolecular)</h3>
        <p>
          A single-step reaction where bond formation and bond breaking occur simultaneously.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Kinetics:</strong> Rate = k[Substrate][Nucleophile] (Second Order).</li>
          <li><strong>Mechanism:</strong> Concerted "Backside Attack". No intermediate.</li>
          <li><strong>Stereochemistry:</strong> 100% Inversion of configuration (Walden Inversion), like an umbrella turning inside out.</li>
          <li><strong>Reactivity:</strong> Methyl > Primary > Secondary > Tertiary (Due to Steric Hindrance).</li>
        </ul>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">II. SN1 (Substitution Nucleophilic Unimolecular)</h3>
        <p>
          A two-step reaction involving a stable intermediate.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Step 1:</strong> Loss of Leaving Group to form a planar Carbocation (Slow, Rate Determining).</li>
          <li><strong>Step 2:</strong> Nucleophile attacks the carbocation (Fast).</li>
          <li><strong>Stereochemistry:</strong> Since the carbocation is planar, attack occurs from both sides, leading to <strong>Racemization</strong> (Retention + Inversion).</li>
          <li><strong>Reactivity:</strong> Tertiary > Secondary > Primary (Due to Carbocation Stability).</li>
        </ul>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Pharmaceutical Synthesis</h4>
            <p className="text-slate-600">
              For optically active drugs (chiral molecules), synthesizing a product via the <strong>SN2</strong> pathway is often preferred because it ensures a specific single stereoisomer (Inversion). SN1 would produce a racemic mixture (50% active drug, 50% potentially inactive or harmful isomer), requiring costly separation.
            </p>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'polymers') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Polymerization and Conductive Polymers</h1>
        
        <p className="lead text-xl text-slate-600 mb-8">
          Polymers are large molecules made of repeating structural units (monomers). While traditional polymers like plastic are insulators, modern chemistry has created organic polymers that conduct electricity.
        </p>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">I. Addition Polymerization (Ziegler-Natta Catalysis)</h3>
        <p>
          Polyethylene is produced by adding ethylene monomers together. 
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Catalyst:</strong> Ziegler-Natta catalysts (e.g., TiCl₄ + Al(C₂H₅)₃) provide an active site that lowers the activation energy.</li>
          <li><strong>Mechanism:</strong> The monomer inserts itself into the metal-carbon bond, allowing the chain to grow efficiently and with high linearity (High Density Polyethylene - HDPE).</li>
        </ul>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">II. Conducting Polymers</h3>
        <p>
          Typically, organic polymers are electrical insulators. However, polymers with <strong>conjugated double bonds</strong> (alternating single and double bonds) can conduct electricity.
        </p>
        <div className="my-4 p-4 bg-blue-50 border-l-4 border-brand-primary rounded-r-xl">
          <p className="text-blue-900 font-medium">
            <strong>Key Example: Polyacetylene.</strong> When "doped" (oxidized or reduced), its conductivity increases billion-fold, approaching that of copper!
          </p>
        </div>
        <p>
          The delocalized pi-electrons in the conjugated system can move freely along the polymer backbone, similar to the "sea of electrons" in metals.
        </p>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Nobel Prize Winning Discovery
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Flexible Electronics</h4>
            <p className="text-slate-600">
               The discovery of conducting polymers (Nobel Prize 2000) revolutionized materials science. They are now used in <strong>OLED screens</strong> (like on your phone), flexible solar cells, and light-weight batteries that can bend without breaking.
            </p>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }
  
  return <div>Topic Content Not Found</div>;
};

export default TextbookContent;