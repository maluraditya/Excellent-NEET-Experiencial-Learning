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

  // --- UNIT VI-IX: PHYSICS TOPICS ---

  if (topicId === 'emi') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Electromagnetic Induction: Faraday’s Law & AC Generator</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Changing magnetic fields can create electric currents. This phenomenon, discovered by Michael Faraday, is the basis for how we generate almost all electricity today.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Faraday's Law</h3>
        <p>
          The induced EMF (Electromotive Force) in a coil is equal to the negative rate of change of magnetic flux through it.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">ϵ = -dΦ<sub>B</sub> / dt</p>
          <p className="text-sm text-slate-600 mt-2 text-center">The negative sign (Lenz's Law) means the induced current opposes the change that produced it.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The AC Generator</h3>
        <p>
          A coil rotating in a uniform magnetic field continuously changes the angle (θ) between the area vector and magnetic field lines.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Magnetic Flux:</strong> Φ = BA cos(ωt)</li>
          <li><strong>Induced EMF:</strong> ϵ = NBAω sin(ωt)</li>
          <li>This produces a sinusoidal alternating voltage.</li>
        </ul>

        <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500 my-6">
          <h4 className="font-bold text-blue-900 mb-2">Analogy: The Water Pump</h4>
          <p className="text-sm">
            Imagine a water pump handle (the Coil) that you push up and down (Rotation).
            <br /><br />
            - <strong>DC (Battery):</strong> Like a river flowing one way.
            <br />
            - <strong>AC (Generator):</strong> Like water sloshing back and forth in a pipe as you pump. The electrons vibrate in place, transmitting energy without flowing to the end of the wire!
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Wireless Charging</h4>
            <p className="text-slate-600">
              Your phone's wireless charger uses a coil to create a rapidly changing magnetic field. A second coil inside your phone "catches" this field, inducing a current that charges the battery—transferring energy through thin air!
            </p>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'ac') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Alternating Current & The Transformer</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Transformers allow us to transport electricity over vast distances efficiently by stepping voltage up or down.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Working Principle: Mutual Induction</h3>
        <p>
          A transformer has two coils wound on a soft iron core. Changing current in the <strong>Primary Coil</strong> creates a changing magnetic flux, which is linked to the <strong>Secondary Coil</strong>, inducing a voltage in it.
        </p>

        <div className="my-6 p-4 bg-yellow-50 rounded-xl border border-yellow-300">
          <h4 className="font-bold text-yellow-900 mb-2">Transformation Ratio (k)</h4>
          <p className="font-mono text-lg text-slate-800">V<sub>s</sub>/V<sub>p</sub> = N<sub>s</sub>/N<sub>p</sub> = I<sub>p</sub>/I<sub>s</sub> = k</p>
          <ul className="list-disc ml-6 mt-2 text-sm text-slate-700">
            <li><strong>Step Up (k &gt; 1):</strong> Increases Voltage, Decreases Current.</li>
            <li><strong>Step Down (k &lt; 1):</strong> Decreases Voltage, Increases Current.</li>
          </ul>
        </div>

        <div className="bg-orange-50 p-6 rounded-xl border-l-4 border-orange-500 my-6">
          <h4 className="font-bold text-orange-900 mb-2">Analogy: The Gear System</h4>
          <p className="text-sm">
            Think of a bicycle's gears.
            <br /><br />
            - <strong>High Voltage (Low Current):</strong> Like a big gear turning slowly but with huge force (Torque).
            <br />
            - <strong>Low Voltage (High Current):</strong> Like a small gear turning very fast.
            <br />
            You can trade speed for force (Current for Voltage), but the total power (Input Energy) remains the same!
          </p>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'em_waves') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Electromagnetic Waves</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Light is just a tiny part of the spectrum. From radio waves to gamma rays, these are all self-propagating electric and magnetic fields.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Source of EM Waves</h3>
        <p>
          An <strong>accelerating charge</strong> produces oscillating electric and magnetic fields. These fields regenerate each other and travel through space at the speed of light ($c = 3 \times 10^8$ m/s).
        </p>

        <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-500 my-6">
          <h4 className="font-bold text-purple-900 mb-2">Analogy: The Infinite Ripple</h4>
          <p className="text-sm">
            Throw a stone in a pond. The splash (accelerating charge) creates ripples (waves) that move outward.
            <br />
            Now imagine the ripples are made of two invisible fabrics (Electricity and Magnetism) weaving into each other at 90 degrees. They don't need water (medium) to travel—they can move through empty space!
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Microwave Ovens</h4>
            <p className="text-slate-600">
              Microwaves are tuned to the resonant frequency of water molecules. The wave's oscillating electric field grabs the positive and negative ends of water molecules in your food and shakes them billions of times a second. This friction creates heat!
            </p>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'ray_optics') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Ray Optics: Lenses & Instruments</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          By treating light as a straight line (Ray), we can design lenses to bend light exactly where we want it.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Key Principles</h3>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Refraction:</strong> Bending of light when passing between mediums (Snell's Law: $n_1 \sin i = n_2 \sin r$).</li>
          <li><strong>Total Internal Reflection (TIR):</strong> When light tries to leave a dense medium at a steep angle, it gets trapped inside.</li>
        </ul>

        <div className="bg-cyan-50 p-6 rounded-xl border-l-4 border-cyan-500 my-6">
          <h4 className="font-bold text-cyan-900 mb-2">Analogy: The Muddy Patch</h4>
          <p className="text-sm">
            Imagine marching soldiers (Light Ray) hitting a patch of mud (Glass) at an angle.
            The soldiers who hit the mud first slow down, while the others keep moving fast. This causes the entire column to TURN (Bend).
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topicId === 'wave_optics') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Wave Optics: Interference</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When we look closely, light behaves like a wave. It can bend around corners (Diffraction) and overlap to cancel itself out (Interference).
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Young's Double Slit Experiment (YDSE)</h3>
        <p>
          Thomas Young proved light is a wave. He shone light through two tiny slits. Instead of two bright spots, he saw a pattern of bright and dark fringes.
        </p>

        <div className="bg-indigo-50 p-6 rounded-xl border-l-4 border-indigo-500 my-6">
          <h4 className="font-bold text-indigo-900 mb-2">Analogy: Noise Cancelling Headphones</h4>
          <p className="text-sm">
            Sound is also a wave.
            <br />
            - <strong>Constructive Interference:</strong> Peak meets Peak = Louder Sound (Bright Fringe).
            <br />
            - <strong>Destructive Interference:</strong> Peak meets Trough = Silence (Dark Fringe).
            <br /><br />
            Your headphones verify this by playing an "anti-noise" wave that cancels out the outside noise!
          </p>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'dual_nature') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Dual Nature: The Photoelectric Effect</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Light is confusing. It's a wave (Interference), but it's also a particle (Photon). Einstein won his Nobel Prize for explaining the latter.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Photoelectric Effect</h3>
        <p>
          When you shine light on metal, electrons pop out. But there's a catch:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Intensity (Brightness)</strong> increases the NUMBER of electrons.</li>
          <li><strong>Frequency (Color)</strong> increases the SPEED (Kinetic Energy) of electrons.</li>
          <li>If frequency is too low (Red light), <strong>zero</strong> electrons come out, no matter how bright the light is!</li>
        </ul>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">Analogy: The Vending Machine</h4>
          <p className="text-sm">
            Electrons are stuck in the metal like a soda in a vending machine.
            <br /><br />
            - <strong>Wave Theory:</strong> Throwing 100 pennies (Low Freq, High Intensity) should eventually work. (It fails).
            <br />
            - <strong>Particle Theory:</strong> You need a Quarter (High Freq Photon) to trigger the mechanism.
            If you use a solid gold coin (X-Ray), the soda flies out at bullet speed!
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Solar Panels & Automatic Doors</h4>
            <p className="text-slate-600">
              Solar panels turn light photons into a flow of electrons (Current).
              Automatic doors use a beam of invisible light; when you walk through, you block the photons, the current stops, and the motor triggers the door to open.
            </p>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'atoms') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Atoms: The Nuclear Model</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The atom is mostly empty space. Rutherford's groundbreaking experiment in 1911 shattered the "Plum Pudding" model and revealed the true structure of matter.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Historical Context</h3>
        <p>
          Before Rutherford, J.J. Thomson proposed that atoms were a uniform sphere of positive charge with electrons embedded like "plums in a pudding." This model couldn't explain why some alpha particles bounced BACK from thin gold foil.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Alpha Scattering Experiment (Geiger-Marsden, 1909)</h3>
        <p>
          Hans Geiger and Ernest Marsden, under Rutherford's direction, fired high-energy alpha particles (He²⁺, from radioactive Bismuth-214) at an extremely thin gold foil (~400 atoms thick).
        </p>

        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <h4 className="font-bold text-slate-800 mb-3">Experimental Setup</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Alpha Source:</strong> Radioactive material emitting α-particles at ~5.5 MeV</li>
            <li><strong>Target:</strong> Thin gold foil (Au, Z=79) or Aluminum (Al, Z=13)</li>
            <li><strong>Detector:</strong> ZnS screen that produces scintillations when hit</li>
            <li><strong>Collimator:</strong> Lead shield with narrow slit for parallel beam</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Key Observations</h3>
        <div className="grid md:grid-cols-1 gap-4 my-6">
          <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
            <h4 className="font-bold text-green-900">Observation 1: ~99% passed straight through</h4>
            <p className="text-sm text-green-800 mt-1">
              <strong>Conclusion:</strong> The atom is mostly empty space. Electrons are too light to deflect the heavy α-particles.
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500">
            <h4 className="font-bold text-yellow-900">Observation 2: Some deflected at small angles (1-10°)</h4>
            <p className="text-sm text-yellow-800 mt-1">
              <strong>Conclusion:</strong> There's a concentrated positive charge somewhere that repels the positive α-particles. Closer passes = larger deflection.
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500">
            <h4 className="font-bold text-red-900">Observation 3: ~1 in 20,000 bounced back (θ &gt; 90°)</h4>
            <p className="text-sm text-red-800 mt-1">
              <strong>Conclusion:</strong> A tiny, dense, positively charged nucleus exists at the center. Head-on collisions cause 180° backscattering!
            </p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. The Physics: Coulomb Scattering</h3>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h4 className="font-bold text-blue-900 mb-2">Rutherford Scattering Formula</h4>
          <p className="font-mono text-lg text-blue-800 text-center my-3">
            N(θ) ∝ 1 / sin⁴(θ/2)
          </p>
          <ul className="list-disc ml-6 text-sm text-blue-800">
            <li><strong>Force:</strong> Coulomb repulsion F = kq₁q₂/r² between α⁺² and nucleus⁺ᶻ</li>
            <li><strong>Impact Parameter (b):</strong> Distance of closest approach determines scattering angle</li>
            <li><strong>Small b:</strong> Particle passes close to nucleus → Large deflection</li>
            <li><strong>Large b:</strong> Particle is far from nucleus → Passes through undeflected</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Why Electrons Don't Deflect Alpha Particles</h3>
        <p>
          Despite passing through electron clouds, alpha particles are NOT deflected by electrons because:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Mass Ratio:</strong> α-particle mass ≈ 7,300 × electron mass</li>
          <li><strong>Analogy:</strong> Like a bowling ball hitting ping-pong balls—the electrons scatter, but the alpha continues straight</li>
          <li>Electrons get ionized (knocked out), but the α-particle's trajectory is essentially unchanged</li>
        </ul>

        <div className="bg-rose-50 p-6 rounded-xl border-l-4 border-rose-500 my-6">
          <h4 className="font-bold text-rose-900 mb-2">🏟️ Analogy: The Football Stadium</h4>
          <p className="text-sm text-rose-800">
            If an Atom were the size of a football stadium:
            <br /><br />
            • The <strong>Nucleus</strong> would be a marble at the center kickoff spot<br />
            • The <strong>Electrons</strong> would be tiny flies buzzing in the upper stands<br />
            • <strong>Everything else?</strong> Completely empty space!
            <br /><br />
            This explains why most α-particles pass through—they're shooting through the stands where there's nothing but flies!
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. The Nuclear Model of the Atom</h3>
        <p>Rutherford concluded:</p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Nucleus:</strong> Tiny (10⁻¹⁵ m), dense, positively charged center containing protons (and later, neutrons)</li>
          <li><strong>Electrons:</strong> Orbit the nucleus at relatively large distances (10⁻¹⁰ m)</li>
          <li><strong>Size Ratio:</strong> Nucleus : Atom ≈ 1 : 100,000 (like a marble in a stadium!)</li>
          <li><strong>Mass:</strong> 99.9% of atom's mass is in the nucleus</li>
        </ul>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Applications
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Rutherford Backscattering Spectrometry (RBS)</h4>
            <p className="text-slate-600">
              Scientists today use the same principle! By firing ion beams at materials and measuring scattering angles, they can determine the elemental composition and thickness of thin films—essential for semiconductor manufacturing and materials science research.
            </p>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'semiconductors') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Semiconductors: The P-N Junction</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Semiconductors are the brain of modern electronics. By joining P-type (Holes) and N-type (Electrons) materials, we create a device that controls current direction.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Diode Valve</h3>
        <p>
          A P-N junction acts as a one-way valve for electricity.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Forward Bias:</strong> Current flows easily (Switch ON).</li>
          <li><strong>Reverse Bias:</strong> Current is blocked (Switch OFF).</li>
        </ul>

        <div className="bg-teal-50 p-6 rounded-xl border-l-4 border-teal-500 my-6">
          <h4 className="font-bold text-teal-900 mb-2">Analogy: The Turnstile</h4>
          <p className="text-sm">
            A Diode is like a subway turnstile.
            <br />
            - <strong>Forward Bias:</strong> You push the correct way. The bar moves. You pass.
            <br />
            - <strong>Reverse Bias:</strong> You try to push the wrong way. The bar locks. You are stuck (Depletion Region widens).
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">LEDs (Light Emitting Diodes)</h4>
            <p className="text-slate-600">
              When electrons fall into holes at the junction, they release energy. In Silicon, this energy is heat. In Gallium Arsenide (GaAs), this energy is released as visible Light!
            </p>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

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
            <strong>Simple Cubic (SCC):</strong> Atoms at 8 corners only.<br />
            <em>Calculation:</em> 8 × (1/8) = <strong>1 Atom</strong>.
          </li>
          <li>
            <strong>Body-Centered Cubic (BCC):</strong> 8 Corners + 1 Body Center.<br />
            <em>Calculation:</em> (8 × 1/8) + 1 = <strong>2 Atoms</strong>.
          </li>
          <li>
            <strong>Face-Centered Cubic (FCC):</strong> 8 Corners + 6 Face Centers.<br />
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
            <strong>Key Concept:</strong> If External Voltage (E<sub>ext</sub>) &gt; 1.1V (Cell Potential), the reaction reverses!
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
          <li><strong>Reactivity:</strong> Methyl &gt; Primary &gt; Secondary &gt; Tertiary (Due to Steric Hindrance).</li>
        </ul>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">II. SN1 (Substitution Nucleophilic Unimolecular)</h3>
        <p>
          A two-step reaction involving a stable intermediate.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Step 1:</strong> Loss of Leaving Group to form a planar Carbocation (Slow, Rate Determining).</li>
          <li><strong>Step 2:</strong> Nucleophile attacks the carbocation (Fast).</li>
          <li><strong>Stereochemistry:</strong> Since the carbocation is planar, attack occurs from both sides, leading to <strong>Racemization</strong> (Retention + Inversion).</li>
          <li><strong>Reactivity:</strong> Tertiary &gt; Secondary &gt; Primary (Due to Carbocation Stability).</li>
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

  // --- BIOLOGY TOPICS ---

  if (topicId === 'genetics_linkage') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Linkage & Recombination</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Why do some traits always seem to travel together? The answer lies in the physical geography of chromosomes.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Exception to Mendel's Law</h3>
        <p>
          Mendel's Law of Independent Assortment states that genes for different traits segregate independently.
          However, Thomas Hunt Morgan discovered that this isn't always true. Genes located on the <strong>same chromosome</strong> are physically connected and tend to be inherited together. This is called <strong>Linkage</strong>.
        </p>

        <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500 my-6">
          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            Roleplay Analogy: The Crowded Mall
          </h4>
          <div className="flex flex-col gap-4">
            <p className="text-slate-600">Imagine two friends walking through a very crowded mall.</p>
            <div className="flex gap-4">
              <div className="flex-1 bg-green-50 p-4 rounded border border-green-200">
                <span className="font-bold text-green-800 block mb-1">Tightly Linked (Holding Hands)</span>
                <p className="text-xs">If they hold hands, the crowd cannot separate them. They stay together (Parental Type).</p>
              </div>
              <div className="flex-1 bg-red-50 p-4 rounded border border-red-200">
                <span className="font-bold text-red-800 block mb-1">Loosely Linked (Walking Apart)</span>
                <p className="text-xs">If they walk far apart, a group of people (Crossover) can easily come between them, separating them into different groups (Recombinant Type).</p>
              </div>
            </div>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'transcription') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Transcription: Prokaryotes vs Eukaryotes</h1>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mb-8 flex gap-4 items-start">
          <div>
            <h4 className="font-bold text-orange-900">Core Concept</h4>
            <p className="text-sm text-orange-800">Bacteria run a "Live Broadcast" (simultaneous transcription/translation), while Eukaryotes produce a "Movie" (filmed, edited, then released).</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Prokaryotes: Efficiency First</h3>
        <p>
          In bacteria (prokaryotes), there is no nucleus. DNA is in the cytoplasm. This means ribosomes can attach to mRNA <em>while it is still being made</em>.
        </p>
        <ul className="list-disc pl-5 my-4 space-y-2">
          <li><strong>Polycistronic mRNA:</strong> One mRNA file contains recipes for multiple proteins.</li>
          <li><strong>No Processing:</strong> The mRNA is ready to use immediately. No splicing needed.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Eukaryotes: Quality Control</h3>
        <p>
          In humans (eukaryotes), DNA is locked in the library (nucleus). mRNA must be processed before it can leave.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="bg-white p-4 rounded shadow border border-slate-200">
            <div className="font-bold text-indigo-600 mb-2">1. Capping (5')</div>
            <p className="text-xs text-slate-500">Adding a safety helmet to the start so the ribosome recognizes it.</p>
          </div>
          <div className="bg-white p-4 rounded shadow border border-slate-200">
            <div className="font-bold text-indigo-600 mb-2">2. Splicing</div>
            <p className="text-xs text-slate-500">Cutting out "ads" (Introns) and gluing the movie scenes (Exons) together.</p>
          </div>
          <div className="bg-white p-4 rounded shadow border border-slate-200">
            <div className="font-bold text-indigo-600 mb-2">3. Tailing (3')</div>
            <p className="text-xs text-slate-500">Adding a long tail (Poly-A) to prevent degradation in the cytoplasm.</p>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'lac_operon') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Gene Regulation: The Lac Operon</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Bacteria don't waste energy. They only build lactose-digesting tools when lactose is actually present.
        </p>

        <div className="bg-yellow-50 p-6 rounded-xl border-l-4 border-yellow-500 my-6">
          <h4 className="font-bold text-yellow-900 mb-2">Analogy: The Motion Sensor Light</h4>
          <p className="text-sm">
            Imagine a hallway light (the Genes) that you want on ONLY when someone is there (Lactose).
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> <strong>Repressor (The Switch Guard):</strong> Normally blocks the switch so the light stays OFF.</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> <strong>Lactose (The Person):</strong> When present, it bumps into the Guard, distracting them. The switch is free!</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> <strong>RNA Polymerase (The Electrician):</strong> Sees the switch is free and turns the light ON.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Logic Gate</h3>
        <p>The system is a simple negative feedback loop:</p>
        <ul className="list-disc pl-5">
          <li><strong>No Lactose:</strong> Repressor binds Operator &rarr; No RNA made.</li>
          <li><strong>Lactose Present:</strong> Lactose binds Repressor &rarr; Repressor falls off &rarr; RNA is made!</li>
        </ul>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'replication_fork') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">The Machinery of Replication</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Copying 3 billion letters without mistakes requires a specialized construction crew.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-bold text-slate-800">Helicase</h4>
            <p className="text-sm text-slate-600">The "Zipper Buster". Unzips the double helix.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-bold text-slate-800">DNA Polymerase</h4>
            <p className="text-sm text-slate-600">The "Builder". Adds new nucleotides.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-bold text-slate-800">Primase</h4>
            <p className="text-sm text-slate-600">The "Flag Planter". Marks where to start.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-bold text-slate-800">Ligase</h4>
            <p className="text-sm text-slate-600">The "Gluer". Connects the fragments.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Directionality Problem</h3>
        <p>DNA Polymerase can only build in one direction (5' to 3'). This creates a traffic problem!</p>

        <div className="flex flex-col gap-4 mt-4">
          <div className="bg-green-100 p-4 rounded border-l-4 border-green-500">
            <h5 className="font-bold text-green-800">Leading Strand (Easy Mode)</h5>
            <p className="text-sm">Follows the Helicase smoothly. Like driving on an empty highway.</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded border-l-4 border-yellow-500">
            <h5 className="font-bold text-yellow-800">Lagging Strand (Hard Mode)</h5>
            <p className="text-sm">Must be built backwards in chunks (Okazaki Fragments). Like paving a road while driving effectively in reverse!</p>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'rnai') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">RNA Interference: The Cell's Antivirus</h1>

        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 mb-8">
          <h3 className="text-lg font-bold text-sky-900 flex items-center gap-2 mb-2">
            Key Concept: Silencing
          </h3>
          <p>RNAi is a natural system that destroys <strong>double-stranded RNA</strong>. Why? Because eukaryotes don't make double-stranded RNA! If the cell sees it, it assumes it's a virus.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">How it Works (The RISC Complex)</h3>
        <ol className="list-decimal pl-5 space-y-4">
          <li><strong>Detection:</strong> Cell spots dsRNA (common in viral replication).</li>
          <li><strong>Dicing:</strong> An enzyme called Dicer cuts the dsRNA into small chunks (siRNA).</li>
          <li><strong>Loading:</strong> These chunks are loaded into the RISC complex (a protein weapon).</li>
          <li><strong>Targeting:</strong> RISC uses the siRNA as a "Wanted Poster". If it finds any matching mRNA, it slices it up!</li>
        </ol>

        <div className="mt-8 p-4 bg-slate-900 text-slate-300 rounded-lg font-mono text-sm">
          <p className="text-green-400 mb-2">// SECURITY ALERT</p>
          <p>Scanning for viral signatures...</p>
          <p>MATCH FOUND: viral_gene_expression.exe</p>
          <p>ACTION: DICER initiated.</p>
          <p>STATUS: Threat Neutralized.</p>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topicId === 'ti_plasmid') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Agrobacterium: Nature's Genetic Engineer</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Long before humans invented CRISPR, this bacteria figured out how to insert its own DNA into plants.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Trojan Horse Mechanism</h3>
        <p><em>Agrobacterium tumifaciens</em> infects plants. But unlike other germs that just steal food, Agrobacterium forces the plant to <strong>build a house for it</strong>.</p>

        <div className="my-8 relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
          <div className="ml-8 space-y-8">
            <div className="relative">
              <div className="absolute -left-[39px] bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <h5 className="font-bold">Ti Plasmid</h5>
              <p className="text-sm text-slate-500">The bacteria carries a special ring of DNA called the Tumor-Inducing (Ti) Plasmid.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[39px] bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <h5 className="font-bold">T-DNA Transfer</h5>
              <p className="text-sm text-slate-500">A specific section (T-DNA) is cut out and shot into the plant cell.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[39px] bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <h5 className="font-bold">Integration</h5>
              <p className="text-sm text-slate-500">The T-DNA inserts itself RANDOMLY into the plant's own chromosomes!</p>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <h4 className="font-bold text-emerald-900 mb-2">Biotech Application</h4>
          <p className="text-sm">Scientists disable the tumor-causing genes in the Ti Plasmid and swap them for useful genes (like pest resistance). The bacteria then delivers OUR gene instead of its own!</p>
        </div>
        <VideoSection />
      </div>
    );
  }

  return <div>Topic Content Not Found</div>;
};

export default TextbookContent;