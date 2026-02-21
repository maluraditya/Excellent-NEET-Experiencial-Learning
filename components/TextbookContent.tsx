import React from 'react';
import { Topic } from '../types';

interface TextbookContentProps {
  topic: Topic | undefined;
}

const TextbookContent: React.FC<TextbookContentProps> = ({ topic }) => {

  const VideoSection = () => (
    <div className="mt-12 mb-12" id="tour-videos">
      <h3 className="text-xl font-display font-bold text-brand-primary mb-6 flex items-center">
        <span className="w-1 h-8 bg-brand-secondary mr-3 rounded-full"></span>
        Video Resources
      </h3>
      <div className="grid gap-8">
        {topic?.youtubeVideoIds.map((vid) => (
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

  // --- CLASS 11 TOPICS ---

  if (topic?.id === 'mechanical-properties-solids') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Mechanical Properties of Solids</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Explore how materials deform under stress and the fundamental laws governing elasticity.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Elasticity & Hooke's Law</h3>
        <p>
          <strong>Elasticity</strong> is the property of a body to regain its original size and shape when a deforming force is removed.
          <br />
          <strong>Stress (σ)</strong> = Restoring Force / Area (F/A)
          <br />
          <strong>Strain (ε)</strong> = Change in Dimension / Original Dimension (ΔL/L)
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">Hooke's Law: σ = Y × ε</p>
          <p className="text-sm text-slate-600 mt-2 text-center">For small deformations, stress is directly proportional to strain. Y is Young's Modulus.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Stress-Strain Curve</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Proportional Limit (A):</strong> Hooke's Law is valid. Linear region.</li>
          <li><strong>Yield Point (B):</strong> Max stress for elastic recovery. Beyond this, permanent set occurs.</li>
          <li><strong>Ultimate Tensile Strength (D):</strong> Max stress the material can withstand.</li>
          <li><strong>Fracture Point (E):</strong> Material breaks.</li>
        </ul>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-6" id="tour-real-world">
          <h4 className="font-bold text-amber-900 mb-2">🏗️ Real-World Analogy: Cranes & Mountains</h4>
          <p className="text-sm">
            <strong>Cranes:</strong> Use steel ropes because steel has a high Yield Strength. If the load exceeds this limit, the rope stretches permanently and becomes unsafe.
            <br /><br />
            <strong>Mountains:</strong> Why aren't mountains higher than 10km? Because the sheer weight of the rock would exceed its elastic limit at the base, causing it to flow and sink!
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'fluid-dynamics') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Bernoulli's Principle and its Applications</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The flow of ideally incompressible fluids follows fundamental conservation laws, leading to surprising phenomena like pressure drops in narrow pipes.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Fluid Dynamics & Streamlines</h3>
        <p>
          When a fluid flows steadily, the path taken by the fluid particles is called a <strong>streamline</strong>. In a pipe with a varying thickness, the fluid must speed up in narrower regions to ensure the same amount of mass passes through every section in a given time.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">Equation of Continuity: A × v = constant</p>
          <p className="text-sm text-slate-600 mt-2 text-center">Where <strong>A</strong> is the cross-sectional area and <strong>v</strong> is the fluid velocity.</p>
        </div>
        <p>
          This means where the streamlines are crowded together (in the narrow constriction), the fluid velocity is higher.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Bernoulli's Principle</h3>
        <p>
          Formulated by Daniel Bernoulli in 1738, this principle applies the law of conservation of energy to flowing fluids. It states that for a steady, incompressible, and non-viscous fluid, the sum of pressure, kinetic energy per unit volume, and potential energy per unit volume remains constant along a streamline.
        </p>

        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-lg text-brand-primary text-center">P + ½ρv² + ρgh = constant</p>
          <ul className="list-disc ml-6 mt-4 text-sm text-slate-700">
            <li><strong>P:</strong> Pressure energy per unit volume</li>
            <li><strong>½ρv²:</strong> Kinetic energy per unit volume</li>
            <li><strong>ρgh:</strong> Potential energy per unit volume</li>
          </ul>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">🌬️ Real-World Application: The Airplane Wing</h4>
          <p className="text-sm">
            An airplane wing (airfoil) is curved on top and relatively flat on the bottom. Air must travel faster over the top surface. According to Bernoulli's principle, this <strong>higher velocity</strong> creates <strong>lower pressure</strong> above the wing.
            <br /><br />
            The higher pressure below the wing pushes up, creating <strong>Lift</strong>! This same principle explains how atomizers and perfume sprays work.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'pascals-law') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Pascal's Law and Hydraulic Machines</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The basic property of a fluid is that it can flow and takes the shape of its container. When a fluid is at rest, it exerts a force perpendicular to the surface of any object submerged in it.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Pressure and Pascal's Law</h3>
        <p>
          The normal force (F) acting per unit area (A) is defined as <strong>pressure (P = F/A)</strong>. The SI unit is the pascal (Pa).
          <br /><br />
          Blaise Pascal observed a fundamental truth about fluids at rest:
          <em>"Whenever external pressure is applied on any part of a fluid contained in a vessel, it is transmitted undiminished and equally in all directions."</em>
        </p>

        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">P₁ = P₂  =&gt;  F₁/A₁ = F₂/A₂</p>
          <ul className="list-disc ml-6 mt-4 text-sm text-slate-700">
            <li><strong>F₁ / A₁:</strong> Input Force and Area (Master Cylinder)</li>
            <li><strong>F₂ / A₂:</strong> Output Force and Area (Wheel Cylinder)</li>
          </ul>
        </div>
        <p>
          Because liquids are nearly incompressible, the volume pushed down on one side must equal the volume pushed up on the other. This means a small force pushing a small area a <em>long</em> distance can create a massive force pushing a large area a <em>short</em> distance.
        </p>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">🚗 Real-World Application: Hydraulic Brakes</h4>
          <p className="text-sm">
            When you press the brake pedal in a car, you push a small piston connected to the master cylinder. The pressure is transmitted instantly through the brake fluid to a much larger wheel cylinder.
            Because the wheel cylinder has a larger area, it multiplies your initial foot force by up to 10 or 20 times, providing enough power to clamp the brake pads against the spinning disc and stop a heavily moving vehicle!
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'carnot-engine') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Carnot Engine and Carnot Cycle</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The Carnot Engine is a theoretical, perfectly reversible heat engine that operates between a hot reservoir (T₁) and a cold reservoir (T₂), defining the absolute maximum efficiency any heat engine can achieve.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Four Steps of the Carnot Cycle</h3>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Isothermal Expansion (1→2):</strong> Gas absorbs heat Q₁ from the hot source at T₁. Temperature stays constant, gas expands.</li>
          <li><strong>Adiabatic Expansion (2→3):</strong> Gas is insulated. It continues expanding, using its own internal energy. Temperature drops from T₁ to T₂.</li>
          <li><strong>Isothermal Compression (3→4):</strong> Gas rejects heat Q₂ to the cold sink at T₂. Temperature stays constant, gas is compressed.</li>
          <li><strong>Adiabatic Compression (4→1):</strong> Gas is insulated again. It is compressed back to its original state. Temperature rises from T₂ back to T₁.</li>
        </ol>

        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-lg text-brand-primary text-center">η = 1 − T₂/T₁</p>
          <p className="text-sm text-slate-600 mt-3 text-center">
            The efficiency depends <strong>only</strong> on the temperatures of the two reservoirs, completely independent of the working substance.
          </p>
        </div>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-6">
          <h4 className="font-bold text-amber-900 mb-2">🏭 Real-World Application: Steam Power Plants</h4>
          <p className="text-sm">
            Modern thermal power plants heat water in a boiler (Hot Reservoir, T₁ ≈ 600K) and cool steam in a condenser (Cold Reservoir, T₂ ≈ 300K). The Carnot limit says their efficiency can never exceed 1 − 300/600 = <strong>50%</strong>. In practice, due to irreversibilities, real efficiencies are significantly lower.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">🧊 Carnot Refrigerator</h4>
          <p className="text-sm">
            A Carnot cycle run in reverse is a <strong>Carnot refrigerator</strong>. It takes heat Q₂ from a cold space, requires input work W, and exhausts Q₁ = Q₂ + W to a warm environment. This sets the theoretical maximum for the Coefficient of Performance (COP) of all cooling devices.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }
  if (topic?.id === 'thermodynamic-processes') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">First Law of Thermodynamics and Thermodynamic Processes</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The First Law of Thermodynamics is the principle of conservation of energy applied to thermodynamic systems: the heat supplied to a system goes partly to increase its internal energy and partly to do work on the environment.
        </p>

        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-lg text-brand-primary text-center">ΔQ = ΔU + ΔW</p>
          <p className="text-sm text-slate-600 mt-3 text-center">
            Heat (ΔQ) = Change in Internal Energy (ΔU) + Work Done by gas (ΔW = PΔV)
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Four Special Thermodynamic Processes</h3>
        <ol className="list-decimal pl-6 space-y-4">
          <li><strong>Isothermal (T = const):</strong> Temperature doesn't change → ΔU = 0 → ΔQ = ΔW. All heat converts to work. The P-V curve follows PV = nRT = constant (Boyle's Law).</li>
          <li><strong>Adiabatic (Q = 0):</strong> No heat enters or leaves (insulated) → ΔU = −ΔW. Expansion cools the gas; compression heats it. Follows PV<sup>γ</sup> = constant, a steeper curve than isothermal.</li>
          <li><strong>Isochoric (V = const):</strong> Volume doesn't change → ΔW = 0 → ΔQ = ΔU. All heat goes to changing internal energy. The P-V "curve" is a vertical line.</li>
          <li><strong>Isobaric (P = const):</strong> Pressure stays constant. Heat goes partly to work (PΔV) and partly to ΔU. The P-V curve is a horizontal line.</li>
        </ol>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-6">
          <h4 className="font-bold text-amber-900 mb-2">☁️ Nature: Cloud Formation (Adiabatic Cooling)</h4>
          <p className="text-sm">
            Rising warm air expands as atmospheric pressure drops. Since this happens quickly and air is a poor conductor, the process is nearly adiabatic (ΔQ ≈ 0). The expanding air does work on its surroundings, its internal energy drops, and temperature falls until water vapour condenses — forming clouds.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">🚗 Engineering: Internal Combustion Engine</h4>
          <p className="text-sm">
            In a car engine, fuel-air mixture is compressed adiabatically (temperature rises), ignited (rapid isochoric heating at near-constant volume), expands adiabatically doing work on the piston, then exhausts at constant volume. Each step demonstrates a different thermodynamic process governed by the First Law.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'kinetic-theory') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Pressure of an Ideal Gas (Kinetic Theory)</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Gas pressure is not a static force — it is the macroscopic manifestation of billions of microscopic elastic collisions of gas molecules against the container walls.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Derivation Summary</h3>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Elastic collision:</strong> A molecule of mass m hits the wall and rebounds. Momentum transferred to wall = 2mv<sub>x</sub>.</li>
          <li><strong>Number of collisions:</strong> In time Δt, molecules within distance v<sub>x</sub>Δt from the wall can reach it. Count = ½ n A v<sub>x</sub> Δt.</li>
          <li><strong>Total force:</strong> F = n m A ⟨v<sub>x</sub>²⟩. Since gas is isotropic, ⟨v<sub>x</sub>²⟩ = ⅓⟨v²⟩.</li>
        </ol>

        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-lg text-brand-primary text-center">P = ⅓ n m ⟨v²⟩</p>
          <p className="text-sm text-slate-600 mt-3 text-center">
            n = N/V (number density), m = molecular mass, ⟨v²⟩ = mean square speed
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Kinetic Interpretation of Temperature</h3>
        <p>Comparing PV = ⅔E with PV = Nk<sub>B</sub>T gives:</p>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="font-mono text-lg text-emerald-700 text-center">½ m ⟨v²⟩ = 3/2 k<sub>B</sub> T</p>
          <p className="text-sm text-slate-600 mt-2 text-center">
            Absolute temperature is simply a measure of the average random kinetic energy of gas molecules.
          </p>
        </div>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-6">
          <h4 className="font-bold text-amber-900 mb-2">🎈 Daily Life: Why Balloons Stay Inflated</h4>
          <p className="text-sm">
            Air molecules inside a balloon are in continuous random motion, colliding with the rubber walls. More molecules = more collisions per second = outward push that keeps the balloon inflated.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">🚗 Engineering: Tyre Pressure Increase While Driving</h4>
          <p className="text-sm">
            Road friction heats tyres, raising air temperature inside. By ½m⟨v²⟩ = 3/2 k<sub>B</sub>T, molecules move faster, hit walls harder, and tyre pressure rises — which is why it's recommended to check tyre pressure when cold.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'equipartition') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Degrees of Freedom and Equipartition of Energy</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The number of independent ways a molecule can absorb energy is termed its <strong>degrees of freedom (f)</strong>. Every independent coordinate or velocity component required to specify the motion of the molecule represents a degree of freedom.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Translational, Rotational &amp; Vibrational DOF</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Monatomic (He, Ar):</strong> Single atom — only translational motion in x, y, z. <strong>f = 3</strong>.</li>
          <li><strong>Rigid Diatomic (O₂, N₂):</strong> 3 translational + 2 rotational axes (perpendicular to bond axis). <strong>f = 5</strong>.</li>
          <li><strong>Vibrating Diatomic (CO at high T):</strong> Atoms oscillate along the bond axis like a spring — adds 2 vibrational modes (KE + PE). <strong>f = 7</strong>.</li>
          <li><strong>Polyatomic (CH₄):</strong> 3 translational + 3 rotational + f<sub>vib</sub> vibrational modes. <strong>f = 6 + f<sub>vib</sub></strong>.</li>
        </ul>

        <table className="w-full text-sm mt-4">
          <thead><tr className="border-b"><th className="text-left py-2">Gas Type</th><th>Trans.</th><th>Rot.</th><th>Vib.</th><th>f</th></tr></thead>
          <tbody>
            <tr><td className="py-1"><strong>Monatomic</strong></td><td className="text-center">3</td><td className="text-center">0</td><td className="text-center">0</td><td className="text-center font-bold">3</td></tr>
            <tr><td className="py-1"><strong>Rigid Diatomic</strong></td><td className="text-center">3</td><td className="text-center">2</td><td className="text-center">0</td><td className="text-center font-bold">5</td></tr>
            <tr><td className="py-1"><strong>Vibrating Diatomic</strong></td><td className="text-center">3</td><td className="text-center">2</td><td className="text-center">2</td><td className="text-center font-bold">7</td></tr>
            <tr><td className="py-1"><strong>Polyatomic</strong></td><td className="text-center">3</td><td className="text-center">3</td><td className="text-center">f<sub>v</sub></td><td className="text-center font-bold">6+f<sub>v</sub></td></tr>
          </tbody>
        </table>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Law of Equipartition of Energy</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-slate-700 text-center mb-2">
            First proved by Maxwell: in thermal equilibrium at temperature T, the total energy is distributed <strong>equally</strong> across all available modes.
          </p>
          <p className="font-mono text-lg text-brand-primary text-center">Each translational &amp; rotational DOF → ½k<sub>B</sub>T</p>
          <p className="font-mono text-lg text-brand-primary text-center">Each vibrational mode → k<sub>B</sub>T (KE + PE)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Internal Energy &amp; Specific Heat</h3>
        <p className="text-sm mb-4">Using R = k<sub>B</sub>N<sub>A</sub>, for one mole of gas:</p>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="text-left py-2">Gas</th><th>U</th><th>C<sub>v</sub></th><th>C<sub>p</sub></th><th>γ</th></tr></thead>
          <tbody>
            <tr><td className="py-1"><strong>Monatomic</strong></td><td className="text-center">3/2 RT</td><td className="text-center">3/2 R</td><td className="text-center">5/2 R</td><td className="text-center font-bold">1.67</td></tr>
            <tr><td className="py-1"><strong>Rigid Diatomic</strong></td><td className="text-center">5/2 RT</td><td className="text-center">5/2 R</td><td className="text-center">7/2 R</td><td className="text-center font-bold">1.40</td></tr>
            <tr><td className="py-1"><strong>Vibrating Diatomic</strong></td><td className="text-center">7/2 RT</td><td className="text-center">7/2 R</td><td className="text-center">9/2 R</td><td className="text-center font-bold">1.29</td></tr>
            <tr><td className="py-1"><strong>Polyatomic (f<sub>v</sub> modes)</strong></td><td className="text-center">(3+f<sub>v</sub>)RT</td><td className="text-center">(3+f<sub>v</sub>)R</td><td className="text-center">(4+f<sub>v</sub>)R</td><td className="text-center font-bold">{'<'}1.33</td></tr>
          </tbody>
        </table>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Real-World Analogies</h3>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">💼 Corporate Budgeting Analogy</h4>
          <p className="text-sm">
            Imagine a company (the gas) with a fixed budget (thermal energy). Equipartition says the budget must be distributed <em>equally</em> among all departments (DOF). A simple company (monatomic) has 3 departments, so each gets a large slice. A complex company (polyatomic) has many departments — the same budget is split thinner. To raise overall activity (temperature) of a complex company by 1 degree, you need much more total money (heat), because every department demands its equal share. This is why C<sub>v</sub> is higher for complex molecules.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4">
          <h4 className="font-bold text-emerald-900 mb-2">🏭 Engine Coolants &amp; Gas Turbines</h4>
          <p className="text-sm">
            Engineers select specific gases for thermodynamic cycles. Diatomic gases like N₂ and O₂ have C<sub>p</sub> = 7/2 R (higher than monatomic He with 5/2 R) because supplied heat is partitioned into rotational modes. This affects the adiabatic ratio γ = C<sub>p</sub>/C<sub>v</sub>, which directly dictates engine efficiency. Monatomic gases (γ = 1.67) undergo steeper adiabatic curves than diatomic gases (γ = 1.40).
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🌍 Atmospheric Warming</h4>
          <p className="text-sm">
            Our atmosphere&apos;s specific heat is dictated by the diatomic nature of N₂ and O₂. When sunlight heats the Earth, thermal energy causes air molecules not only to move faster (translation) but also to tumble and spin (rotation). This effectively stores more heat without increasing temperature as drastically as a monatomic atmosphere would — a natural temperature buffer for our planet.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'shm-spring') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Spring-Mass System and Simple Harmonic Motion</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          SHM arises when a restoring force is <strong>directly proportional</strong> to displacement and always directed towards the equilibrium position: <strong>F = −kx</strong>.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Force Law &amp; Angular Frequency</h3>
        <p className="text-sm">From Hooke&apos;s Law and Newton&apos;s Second Law:</p>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="font-mono text-lg text-brand-primary">F = −kx → a = −(k/m)x → ω = √(k/m)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Kinematics of SHM</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Displacement:</strong> x(t) = A cos(ωt + ϕ) — maximum at extreme positions</li>
          <li><strong>Velocity:</strong> v(t) = −ωA sin(ωt + ϕ) — maximum at mean position (x = 0), phase shift of π/2</li>
          <li><strong>Acceleration:</strong> a(t) = −ω²A cos(ωt + ϕ) = −ω²x — maximum at extremes, phase shift of π</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Time Period</h3>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="font-mono text-lg text-emerald-700">T = 2π√(m/k)</p>
          <p className="text-sm text-slate-600 mt-1">Critical: T depends only on m and k — <strong>independent of amplitude!</strong></p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Energy in SHM</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>KE</strong> = ½mv² = ½kA² sin²(ωt) — maximum at mean position</li>
          <li><strong>PE</strong> = ½kx² = ½kA² cos²(ωt) — maximum at extreme positions</li>
          <li><strong>Total E</strong> = ½kA² — <em>constant</em>, continuously transforms KE ↔ PE</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">🚗 Automobile Suspension</h4>
          <p className="text-sm">
            Car shock absorbers use heavy springs. When the car hits a bump, the mass compresses the spring which then oscillates as a spring-mass SHM system. Oil-based damping prevents the car from bouncing forever.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🔬 Atoms in a Crystal Lattice</h4>
          <p className="text-sm">
            In crystalline solids, atoms sit in equilibrium positions held by interatomic forces. If displaced, they experience restoring forces exactly like a microscopic spring-mass system, leading to lattice vibrations (phonons).
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4">
          <h4 className="font-bold text-emerald-900 mb-2">🌍 Seismographs</h4>
          <p className="text-sm">
            Earthquake detectors use a heavy mass suspended by a spring. Due to inertia, the mass stays relatively stationary while the ground moves during a quake — the relative SHM of the system records the earth&apos;s tremors.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  // --- UNIT VI-IX: PHYSICS TOPICS ---

  if (topic?.id === 'emi') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">The Inductive Spark: Faraday's Law & AC Generator</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Relative motion between a magnet and a coil induces an electric current. This discovery by Michael Faraday powers our modern world.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Faraday's Law of Induction</h3>
        <p>
          The induced EMF in a coil equals the negative rate of change of magnetic flux through it:
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">ε = -dΦ<sub>B</sub> / dt</p>
          <p className="text-sm text-slate-600 mt-2 text-center">The negative sign (Lenz's Law) means induced current <strong>opposes</strong> the change.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 my-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-2">⏸️ Stationary (v=0)</h4>
            <p className="text-sm">No flux change → No EMF → No current</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h4 className="font-bold text-green-800 mb-2">→ Approaching (v&gt;0)</h4>
            <p className="text-sm">Flux increasing → Current opposes (pushes back)</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <h4 className="font-bold text-red-800 mb-2">← Receding (v&lt;0)</h4>
            <p className="text-sm">Flux decreasing → Current reverses direction</p>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-6" id="tour-real-world">
          <h4 className="font-bold text-amber-900 mb-2">🏠 The Reluctant Roommate Analogy</h4>
          <p className="text-sm">
            Nature hates change! Imagine a roommate who hates temperature changes:
            <br /><br />
            <strong>• Open window (magnet enters):</strong> They turn on the heater (current pushes back)
            <br />
            <strong>• Close window (magnet leaves):</strong> They turn on the AC (current reverses)
            <br />
            <strong>• Window still (magnet stationary):</strong> They do nothing!
            <br /><br />
            <em>The faster you change, the stronger their reaction!</em>
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The AC Generator (Dynamo)</h3>
        <p>
          A rotating coil continuously changes the angle between its area vector and the magnetic field.
        </p>

        <div className="my-6 p-4 bg-purple-50 rounded-xl border border-purple-300">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold text-purple-800 mb-2">Magnetic Flux</h4>
              <p className="font-mono text-lg">Φ = BA cos(ωt)</p>
              <p className="text-xs text-purple-600 mt-1">Cosine wave - MAX when coil is vertical</p>
            </div>
            <div>
              <h4 className="font-bold text-purple-800 mb-2">Induced EMF</h4>
              <p className="font-mono text-lg">ε = ε₀ sin(ωt)</p>
              <p className="text-xs text-purple-600 mt-1">Sine wave - ZERO when coil is vertical</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg">
            <h5 className="font-bold text-slate-700 text-sm">⚡ Phase Relationship</h5>
            <p className="text-xs text-slate-600">Flux and EMF are 90° out of phase. When rate of flux change is maximum, EMF is maximum!</p>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500 my-6">
          <h4 className="font-bold text-blue-900 mb-2">🚴 The Pedaling Cyclist Analogy</h4>
          <p className="text-sm">
            Imagine pedals pumping an air bellows:
            <br /><br />
            <strong>• Circular motion:</strong> Your feet go up and down as you pedal
            <br />
            <strong>• Air pressure:</strong> Not steady - pushes out and pulls in rhythmically (AC!)
            <br />
            <strong>• Faster pedaling (ω):</strong> More frequent and stronger puffs
            <br /><br />
            <em>Higher ω = Higher frequency AND higher voltage!</em>
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Applications
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">📱 Wireless Charging</h4>
              <p className="text-sm text-slate-600">
                Your phone's charger creates a rapidly changing magnetic field. A coil inside your phone catches this field, inducing current to charge the battery!
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">🔌 Power Grids</h4>
              <p className="text-sm text-slate-600">
                All power plants use rotating generators (turbines) to convert mechanical energy to electrical. The grid runs on 50Hz AC (50 rotations/sec)!
              </p>
            </div>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'ac') {
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

  if (topic?.id === 'em_waves') {
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

  if (topic?.id === 'ray_optics') {
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

  if (topic?.id === 'wave_optics') {
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

  if (topic?.id === 'dual_nature') {
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

  if (topic?.id === 'atoms') {
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

  if (topic?.id === 'semiconductors') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">The Birth of a Diode: P-N Junction Formation</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When P-type and N-type semiconductors merge, a remarkable phenomenon occurs that forms the foundation of all modern electronics.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Phase A: Diffusion</h3>
        <p>
          When P-type and N-type materials are joined, a <strong>concentration gradient</strong> exists at the junction:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Electrons</strong> from N-side diffuse towards P-side (high → low concentration)</li>
          <li><strong>Holes</strong> from P-side diffuse towards N-side (high → low concentration)</li>
          <li>When electrons meet holes, they <strong>recombine</strong> and annihilate</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Phase B: Depletion Region Formation</h3>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">P-Side Border</h4>
            <p className="text-sm">Holes leave → Immobile <strong>negative acceptor ions (−)</strong> are exposed</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
            <h4 className="font-bold text-pink-800 mb-2">N-Side Border</h4>
            <p className="text-sm">Electrons leave → Immobile <strong>positive donor ions (+)</strong> are exposed</p>
          </div>
        </div>
        <p>
          This creates the <strong>Depletion Region</strong> — a "no-man's land" containing only fixed ions with no mobile carriers.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Phase C: Electric Field & Drift Current</h3>
        <p>
          The exposed ions create an <strong>internal electric field (E)</strong> pointing from N (+) to P (−).
        </p>
        <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500 my-4">
          <p className="text-sm">
            <strong>Drift Current:</strong> If a minority carrier (e.g., a thermally generated hole on N-side)
            wanders into the depletion zone, the E-field "sweeps" it across to the P-side. This is <strong>drift current</strong>.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Phase D: Equilibrium</h3>
        <p>
          The electric field opposes further diffusion. As the depletion region widens:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Diffusion Current</strong> (→) decreases (fewer carriers can cross)</li>
          <li><strong>Drift Current</strong> (←) opposes it due to E-field</li>
          <li>At equilibrium: <strong>Net current = 0</strong></li>
        </ul>

        <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-500 my-6">
          <h4 className="font-bold text-purple-900 mb-2">Barrier Potential (V₀)</h4>
          <p className="text-sm">
            The potential difference across the depletion region is called the <strong>Barrier Potential</strong>:
          </p>
          <ul className="text-sm mt-2 list-disc pl-5">
            <li>Silicon: V₀ ≈ 0.7V</li>
            <li>Germanium: V₀ ≈ 0.3V</li>
          </ul>
          <p className="text-sm mt-2 italic">
            "Electrons must climb this energy hill to diffuse; the hill is now too high to cross without extra energy."
          </p>
        </div>

        <div className="bg-yellow-50 p-6 rounded-xl border-l-4 border-yellow-500 my-6">
          <h4 className="font-bold text-yellow-900 mb-2">🤖 Analogy: Robots & Balloons</h4>
          <p className="text-sm">
            <strong>N-Room:</strong> Full of Robots (Electrons) on movable carpets.<br />
            <strong>P-Room:</strong> Full of Balloons (Holes) tied to heavy chairs.<br /><br />
            When the wall opens, Robots rush to P-room, Balloons float to N-room (<strong>Diffusion</strong>).
            But each Robot leaves behind a heavy <strong>+</strong> ion, each Balloon leaves behind a heavy <strong>−</strong> ion.
            Soon, the doorway is blocked by ions (<strong>Depletion Region</strong>) — the furniture "hill" prevents crossing (<strong>Barrier Potential</strong>).
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">★</span>
            Real World Applications
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">💡 LEDs</h4>
              <p className="text-sm text-slate-600">
                When electrons recombine with holes, they release energy. In GaAs, this is visible light!
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">☀️ Solar Cells</h4>
              <p className="text-sm text-slate-600">
                Light creates electron-hole pairs; the E-field in depletion region separates them → electricity!
              </p>
            </div>
          </div>
        </div>
        <VideoSection />
      </div>
    );
  }

  // --- UNIT 1: SOLID STATE TOPICS ---

  if (topic?.id === 'solids_classification') {
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

  if (topic?.id === 'unit_cells') {
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

  if (topic?.id === 'packing') {
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

  if (topic?.id === 'defects') {
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

  if (topic?.id === 'kinetics') {
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

  if (topic?.id === 'electrochemistry') {
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

  if (topic?.id === 'stereochemistry') {
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

  if (topic?.id === 'dblock') {
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

  if (topic?.id === 'haloalkanes') {
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

  if (topic?.id === 'polymers') {
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

  if (topic?.id === 'genetics_linkage') {
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

  if (topic?.id === 'transcription') {
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

  if (topic?.id === 'lac_operon') {
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

  if (topic?.id === 'replication_fork') {
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

  if (topic?.id === 'rnai') {
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

  if (topic?.id === 'ti_plasmid') {
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