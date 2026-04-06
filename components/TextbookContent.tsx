import React from 'react';
import { Topic } from '../types';

interface TextbookContentProps {
  topic: Topic | undefined;
  layout?: 'legacy' | 'unified';
}

const TextbookContent: React.FC<TextbookContentProps> = ({ topic, layout = 'legacy' }) => {

  const VideoSection = () => (
    <div className="mt-12 mb-12" id="tour-videos">
      <h3 className="text-xl font-display font-bold text-brand-primary mb-6 flex items-center">
        <span className="w-1 h-8 bg-brand-secondary mr-3 rounded-full"></span>
        Video Sections
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

        {/* MERGED */}







        <h3 className="text-2xl font-display font-bold text-brand-primary mt-12 mb-6 border-t border-slate-200 pt-8">Young's Modulus</h3>
        <p className="lead text-xl text-slate-600 mb-8">
          Young's Modulus (Y) is the ratio of tensile stress to longitudinal strain within the elastic limit. It quantifies a material's <strong>stiffness</strong> — its resistance to being stretched or compressed.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Concept Foundation — Hooke's Law</h3>
        <p>
          Robert Hooke observed that for small deformations, the <strong>stress developed in a body is directly proportional to the strain produced</strong>. Young's Modulus is the proportionality constant specifically for materials undergoing changes in length.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">Hooke's Law: σ = Y × ε</p>
          <p className="text-sm text-slate-600 mt-2 text-center">Valid only in the linear (elastic) region of the stress-strain curve.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Formulas</h3>
        <div className="my-6 p-5 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
          <p className="font-mono text-lg text-brand-primary text-center">Tensile Stress (σ) = F / A</p>
          <p className="font-mono text-lg text-brand-primary text-center">Longitudinal Strain (ε) = ΔL / L</p>
          <div className="border-t border-blue-200 pt-3">
            <p className="font-mono text-xl text-brand-primary text-center font-bold">Y = σ / ε = (F × L) / (A × ΔL)</p>
          </div>
          <ul className="list-disc ml-6 mt-3 text-sm text-slate-700">
            <li><strong>F:</strong> Applied force (N)</li>
            <li><strong>A:</strong> Cross-sectional area = πr² (m²)</li>
            <li><strong>L:</strong> Original length (m)</li>
            <li><strong>ΔL:</strong> Elongation or compression (m)</li>
          </ul>
          <p className="text-sm text-slate-600 mt-2 text-center">
            <strong>SI Unit:</strong> Nm⁻² or Pascal (Pa) — since strain is dimensionless.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Graph Explanation</h3>
        <p>
          On a stress-strain curve, the region from the origin (O) to the proportional limit (A) is a <strong>straight line</strong> where Hooke's Law is obeyed. The <strong>slope</strong> of this linear portion represents the Young's Modulus of the material.
        </p>
        <p className="mt-2">
          A steeper slope means a higher Young's Modulus — the material is <em>stiffer</em> and resists deformation more effectively. Beyond the yield point, the material undergoes permanent plastic deformation, and Y is no longer applicable.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Molecular Level Understanding</h3>
        <p>
          When a wire is stretched, work is done against internal <strong>inter-atomic forces</strong>. This work is stored as elastic potential energy within the molecular lattice. The tighter the coupling between atoms, the higher the Young's Modulus.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. NCERT Table 8.1 — Young's Modulus Values</h3>
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Material</th>
              <th className="text-center">Y (10⁹ Pa)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="py-1"><strong>Steel</strong></td><td className="text-center">200</td></tr>
            <tr><td className="py-1"><strong>Copper</strong></td><td className="text-center">110</td></tr>
            <tr><td className="py-1"><strong>Brass</strong></td><td className="text-center">100</td></tr>
            <tr><td className="py-1"><strong>Aluminum</strong></td><td className="text-center">70</td></tr>
            <tr><td className="py-1"><strong>Bone (Femur)</strong></td><td className="text-center">9.4</td></tr>
          </tbody>
        </table>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">🔩 Steel vs. Rubber — Who's More Elastic?</h4>
          <p className="text-sm">
            In daily language, rubber seems "more elastic." But in physics, <strong>Steel is far more elastic</strong> (Y = 200 GPa vs. ~0.01 GPa for rubber). Why? A steel wire resists stretching far more effectively — it requires a significantly larger force to produce a small change in length. That resistance is what physics calls "elasticity."
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4">
          <h4 className="font-bold text-emerald-900 mb-2">🏗️ Engineering: Bridge Design</h4>
          <p className="text-sm">
            Bridges use steel beams because of their high Young's Modulus. The sagging (δ) of a beam under a load is <strong>inversely proportional to Y</strong>. A high Y ensures the bridge remains stiff and safe under heavy traffic loads.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🦴 Nature: Human Thighbone (Femur)</h4>
          <p className="text-sm">
            The femur has Y = 9.4 × 10⁹ Pa. This allows it to support the weight of the upper body with a compression of only about <strong>0.0091%</strong>, maintaining skeletal integrity under heavy loads.
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-500 my-4">
          <h4 className="font-bold text-purple-900 mb-2">🏗️ Industrial: Crane Ropes</h4>
          <p className="text-sm">
            Cranes use thick ropes made of braided steel wires. By calculating the required cross-sectional area based on the material's yield strength and Y, engineers ensure the rope doesn't permanently stretch while lifting 10-tonne loads.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. Simulation Guide</h3>
        <div className="my-6 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <p className="text-sm font-bold text-brand-primary">Step-by-Step Discovery:</p>
          <ol className="list-decimal pl-6 space-y-3 text-sm">
            <li>
              <strong>Step 1:</strong> Select "Steel," set Length to 1 m and Radius to 10 mm. Add 100 kN force.<br />
              <span className="text-slate-500">→ Observe: ΔL ≈ 1.59 mm. Stress is 318 MPa.</span>
            </li>
            <li>
              <strong>Step 2:</strong> Keep Force constant, change material to "Copper."<br />
              <span className="text-slate-500">→ The rod stretches significantly more! Copper has Y = 110 GPa vs. Steel's 200 GPa.</span>
            </li>
            <li>
              <strong>Step 3:</strong> Double the Radius to 20 mm (keeping Copper).<br />
              <span className="text-slate-500">→ ΔL drops to one-fourth! Area = πr² means doubling r quadruples A.</span>
            </li>
          </ol>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-3">
            <p className="text-sm text-blue-800 text-center">
              <strong>Learning Outcome:</strong> ΔL is <em>directly proportional</em> to Force and Length, but <em>inversely proportional</em> to Area and Young's Modulus.
            </p>
          </div>
        </div>

        <VideoSection />
      </div>
    );
  }



  if (topic?.id === 'stokes-law') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Stokes’ Law and Terminal Velocity</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When an object falls through a fluid, it doesn't accelerate forever. It reaches a maximum constant speed called
          <strong> terminal velocity</strong>. Stokes' Law explains the invisible frictional force from the fluid that makes this happen.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Viscosity & Stokes' Law</h3>
        <p>
          When a body moves through a fluid, it drags the layers of fluid in contact with it. This creates relative motion between different layers of the fluid, resulting in an internal frictional force known as <strong>viscosity</strong>.
        </p>
        <p>
          In 1851, George Gabriel Stokes stated that the viscous drag force (F) on a spherical body of radius <em>a</em> moving with velocity <em>v</em> through a fluid of viscosity <em>η</em> is:
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">F = 6πηav</p>
          <p className="text-sm text-slate-600 mt-2 text-center">This is known as <strong>Stokes’ Law</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Forces in Play</h3>
        <p>
          Consider a small sphere dropped into a tall column of a viscous liquid. Three forces act on it:
        </p>
        <div className="grid gap-4 my-6">
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 shadow-sm border-l-4 border-l-red-500">
            <p className="text-sm font-bold text-red-700">1. Gravity (W = mg)</p>
            <p className="text-sm text-red-600 mt-1">Acting vertically downwards, trying to accelerate the sphere.</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-100 shadow-sm border-l-4 border-l-green-500">
            <p className="text-sm font-bold text-green-700">2. Buoyant Force (F♭)</p>
            <p className="text-sm text-green-600 mt-1">Acting upwards, equal to the weight of the liquid displaced by the sphere.</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm border-l-4 border-l-blue-500">
            <p className="text-sm font-bold text-blue-700">3. Viscous Drag (F_d)</p>
            <p className="text-sm text-blue-600 mt-1">Acting upwards (opposing motion). Crucially, this force <strong>increases</strong> as the sphere speeds up.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Reaching Terminal Velocity</h3>
        <p>
          Initially, the sphere accelerates. As its speed increases, the upward viscous drag also increases (since F ∝ v).
          Eventually, the sum of upward forces (buoyancy + drag) exactly equals the downward weight.
        </p>
        <p className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center font-bold text-amber-800 italic">
          Net Force = 0 → Acceleration = 0 → Constant Velocity
        </p>
        <p>
          This maximum constant velocity is called <strong>terminal velocity (vₜ)</strong>.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. The Formula</h3>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-600 text-center mb-3">At equilibrium: W = F♭ + 6πηavₜ</p>
          <p className="font-mono text-2xl text-brand-primary text-center">vₜ = 2a²(ρ - σ)g / 9η</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500 font-mono">
            <span>a: Radius of sphere</span>
            <span>η: Viscosity coefficient</span>
            <span>ρ: Density of sphere</span>
            <span>σ: Density of fluid</span>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="grid gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-brand-primary">🌧️ Raindrops</p>
            <p className="text-sm text-slate-600 mt-1">
              Without air viscosity, raindrops falling from 1km high would hit you at 500 km/h! Because of Stokes' Law,
              they reach a safe terminal velocity (~20-30 km/h) before hitting the ground.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-brand-primary">🌬️ Dust & Mist</p>
            <p className="text-sm text-slate-600 mt-1">
              Very fine particles have a tiny radius (a). Since vₜ ∝ a², they reach terminal velocity almost immediately
              at extremely slow speeds, which is why dust appears to "float" in a room.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-brand-primary">🧪 Falling Ball Viscometer</p>
            <p className="text-sm text-slate-600 mt-1">
              In industry, the viscosity of oils is often measured by dropping a calibrated sphere and timing how long it
              takes to travel a certain distance at terminal velocity.
            </p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Simulation Guide</h3>
        <div className="my-6 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <p className="text-sm font-bold text-brand-primary">Step-by-Step Discovery:</p>
          <ol className="list-decimal pl-6 space-y-3 text-sm">
            <li>
              <strong>Step 1:</strong> Select "Water" and "Steel." Drop the ball. Note how quickly it hits the bottom and the high terminal velocity on the graph.
            </li>
            <li>
              <strong>Step 2:</strong> Change fluid to "Glycerin" (high viscosity). Drop the same ball.<br />
              <span className="text-slate-500">→ Observation: The ball slows down almost immediately. The blue "Drag" arrow reaches equilibrium with weight/buoyancy much faster.</span>
            </li>
            <li>
              <strong>Step 3:</strong> Increase the "Radius" slider while in Glycerin.<br />
              <span className="text-slate-500">→ Observation: Even in thick liquid, larger balls fall significantly faster because vₜ depends on the square of the radius (a²).</span>
            </li>
          </ol>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-3">
            <p className="text-sm text-blue-800 text-center">
              <strong>Learning Outcome:</strong> Terminal velocity is directly proportional to the square of the radius and inversely proportional to the fluid's viscosity.
            </p>
          </div>
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
  }  if (topic?.id === 'thermal-expansion-calorimetry') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Thermal Properties of Matter</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Temperature is a relative measure or indication of the "hotness" or "coldness" of a body. While we can perceive it by touch, this sense is unreliable for scientific purposes. Heat is the form of energy transferred between two or more systems (or a system and its surroundings) by virtue of a temperature difference. Heat flows from a body at a higher temperature to one at a lower temperature until thermal equilibrium is reached.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Thermal Expansion</h3>
        <p>Most substances expand on heating and contract on cooling. This change in dimensions due to temperature increase is called thermal expansion.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Linear Expansion:</strong> The fractional change in length (Δl/l) is proportional to the change in temperature (ΔT): Δl = α_l l ΔT, where α_l is the coefficient of linear expansion.</li>
          <li><strong>Area Expansion:</strong> The change in area (ΔA) is related to temperature change by ΔA = 2α_l A ΔT.</li>
          <li><strong>Volume Expansion:</strong> The fractional change in volume (ΔV/V) is ΔV = α_v V ΔT. For solids, α_v = 3α_l.</li>
          <li><strong>Anomalous Expansion of Water:</strong> Water contracts on heating between 0 °C and 4 °C. It reaches its maximum density at 4 °C.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Specific Heat Capacity (s)</h3>
        <p>Every substance has a unique value for the amount of heat absorbed or rejected to change the temperature of unit mass by one unit. The formula is s = (1/m)(ΔQ/ΔT). Its SI unit is J kg⁻¹ K⁻¹. Water has the highest specific heat capacity among common substances, making it an excellent coolant.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Calorimetry and Change of State</h3>
        <p>Calorimetry is the measurement of heat. In an isolated system, heat lost by a hot body equals heat gained by a colder body. Matter changes state (solid to liquid, liquid to gas) when heat is exchanged with surroundings. During these transitions, the temperature remains constant.</p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">Latent Heat (L): Q = mL</p>
          <ul className="list-disc ml-6 mt-4 text-sm text-slate-700">
            <li><strong>Latent Heat of Fusion (L_f):</strong> Heat needed for solid-to-liquid transition.</li>
            <li><strong>Latent Heat of Vaporisation (L_v):</strong> Heat needed for liquid-to-gas transition.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Heat Transfer Mechanisms</h3>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Conduction:</strong> Heat transfer between adjacent parts of a body via molecular collisions without bulk motion of matter. The rate of flow H = KA(T_C - T_D)/L, where K is thermal conductivity.</li>
          <li><strong>Convection:</strong> Heat transfer by actual motion of matter, occurring only in fluids. It can be natural (driven by buoyancy/gravity) or forced (driven by a pump).</li>
          <li><strong>Radiation:</strong> Transfer of energy via electromagnetic waves, requiring no medium.
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Stefan-Boltzmann Law:</strong> The energy emitted per unit time is H = σAeT⁴, where σ is the Stefan-Boltzmann constant, A is area, e is emissivity, and T is absolute temperature.</li>
              <li><strong>Wien's Displacement Law:</strong> The wavelength (λ_m) of maximum emission decreases as temperature increases: λ_m T = constant.</li>
            </ul>
          </li>
        </ol>

        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-lg text-brand-primary text-center">Newton’s Law of Cooling</p>
          <p className="text-sm text-slate-600 mt-2 text-center">The rate of loss of heat (– dQ/dt) of a body is directly proportional to the difference in temperature between the body and its surroundings (ΔT = T₂ – T₁). This holds for small temperature differences.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Analogy and Applications</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500">
            <h4 className="font-bold text-amber-900 mb-2">⚙️ Daily Life (Engineering)</h4>
            <p className="text-sm">Blacksmiths heat an iron ring before fitting it onto the wooden rim of a horse cart. Because the iron ring's diameter is slightly smaller than the rim at room temperature, heating causes it to expand (linear/area expansion), allowing it to slip onto the rim. As it cools, it contracts and grips the wheel tightly.</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500">
            <h4 className="font-bold text-emerald-900 mb-2">❄️ Nature (Environmental)</h4>
            <p className="text-sm">Anomalous expansion of water allows lakes to freeze at the top first. Since water at 4 °C is densest, it sinks, while colder water (less than 4 °C) stays on top and freezes. This preserves animal and plant life at the bottom of the lake.</p>
          </div>
          <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500">
            <h4 className="font-bold text-sky-900 mb-2">☀️ Daily Life (Heat Transfer)</h4>
            <p className="text-sm">We wear white clothes in summer because they reflect radiation, and dark clothes in winter because they absorb heat better. Cooking pot bottoms are often blackened to maximize heat absorption from the fire.</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-500">
            <h4 className="font-bold text-purple-900 mb-2">🚗 Engineering (Specific Heat)</h4>
            <p className="text-sm">Water is used in automobile radiators as a coolant because its high specific heat allows it to absorb a large amount of heat with a relatively small rise in its own temperature.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Simulation Guide</h3>
        <div className="my-6 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <p className="text-sm font-bold text-brand-primary">Step-by-Step Discovery in the Virtual Lab:</p>
          <ol className="list-decimal pl-6 space-y-3 text-sm">
            <li><strong>Step 1:</strong> Select the Copper rod. Turn the burner to 100W. Observe the Temperature rise and the rod length increase simultaneously. <em>Logic: Heat addition increases internal kinetic energy and causes expansion.</em></li>
            <li><strong>Step 2:</strong> Switch to the Glass rod. Notice for the same time interval, the expansion is significantly less. <em>Logic: Glass has a much smaller coefficient of linear expansion than Copper.</em></li>
            <li><strong>Step 3:</strong> Select the Ice block. Start heating. Observe that the temperature stays at 0 °C for several minutes while the ice visibly turns to water. <em>Logic: Energy is being used for the Latent Heat of Fusion to break molecular bonds, not to increase temperature.</em></li>
            <li><strong>Step 4:</strong> Heat the resulting Water. Observe the temperature rise until 100 °C. Notice the graph flatlines again. <em>Logic: Water is reaching its boiling point and absorbing Latent Heat of Vaporisation.</em></li>
          </ol>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-3">
            <p className="text-sm text-blue-800 text-center">
              <strong>Learning Outcome:</strong> Thermal properties are material-specific (different α_l, s). Heat causes macroscopic expansion and microscopic vibration. Phase changes require significant energy without temperature change.
            </p>
          </div>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'heat-transfer-blackbody-radiation') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Heat Transfer and Blackbody Radiation</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Heat transfer is the flow of energy from a body at higher temperature to a body at lower temperature until thermal equilibrium is reached.
          In NCERT Class 11, this appears in <strong>Thermal Properties of Matter</strong> through three modes: conduction, convection, and radiation.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Three Modes of Heat Transfer</h3>
        <ol className="list-decimal pl-6 space-y-4">
          <li>
            <strong>Conduction:</strong> Heat passes through adjacent particles without bulk motion of matter. It is dominant in solids where neighboring atoms and electrons transfer energy by collision.
          </li>
          <li>
            <strong>Convection:</strong> Heat is carried by the actual motion of fluid. Warm fluid rises because its density falls, while cooler and denser fluid sinks to replace it.
          </li>
          <li>
            <strong>Radiation:</strong> Heat travels through electromagnetic waves. No material medium is required, so radiation is the only mode possible in vacuum.
          </li>
        </ol>

        <div className="my-6 p-5 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
          <p className="font-mono text-lg text-brand-primary text-center">Conduction: H = kA Delta T / L</p>
          <p className="font-mono text-lg text-brand-primary text-center">Radiation: H = sigma A T^4</p>
          <ul className="list-disc ml-6 mt-3 text-sm text-slate-700">
            <li><strong>k:</strong> thermal conductivity of the material</li>
            <li><strong>A:</strong> cross-sectional area</li>
            <li><strong>L:</strong> length or thickness</li>
            <li><strong>Delta T:</strong> temperature difference between hot and cold ends</li>
            <li><strong>sigma:</strong> Stefan-Boltzmann constant for a perfect blackbody</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Blackbody Radiation</h3>
        <p>
          A <strong>blackbody</strong> is an ideal absorber that takes in all incident radiation and emits energy depending only on its temperature.
          Real hot objects approximate blackbody behavior, which is why the color of a glowing filament or star changes with temperature.
        </p>

        <div className="my-6 p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
          <p className="font-mono text-lg text-rose-700 text-center">Wien&apos;s Law: lambda_max T = constant</p>
          <p className="text-sm text-slate-600 text-center">
            As temperature increases, the wavelength of maximum intensity shifts toward shorter wavelengths.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Conceptual Insights</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>Conduction is strongest in good conductors like copper because energy moves more easily through the material.</li>
          <li>Convection is limited to liquids and gases because the medium itself must move.</li>
          <li>Radiation does not stop in vacuum, which is why the Sun can heat the Earth across space.</li>
          <li>The Stefan-Boltzmann law explains why emitted power rises very rapidly as temperature increases.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">Cooking Utensils</h4>
          <p className="text-sm">
            Copper-bottomed utensils spread heat quickly and uniformly because copper has very high thermal conductivity.
            This improves conduction from the flame to the food.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4">
          <h4 className="font-bold text-emerald-900 mb-2">Thermos Flask</h4>
          <p className="text-sm">
            A vacuum flask reduces conduction and convection by placing a vacuum between two walls.
            Silvered surfaces reflect thermal radiation, so all three modes of heat transfer are minimized together.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">Sea Breeze</h4>
          <p className="text-sm">
            Land heats faster than water during the day. Air above land warms, expands, and rises, while cooler air from the sea moves in.
            This is a classic natural example of convection.
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-500 my-4">
          <h4 className="font-bold text-purple-900 mb-2">Stellar Temperatures</h4>
          <p className="text-sm">
            Astronomers estimate the surface temperature of stars using Wien&apos;s displacement law.
            A star whose spectrum peaks at shorter wavelengths is hotter than one peaking in the red or infrared region.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Simulation Guide</h3>
        <div className="my-6 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <p className="text-sm font-bold text-brand-primary">What to explore in this lab:</p>
          <ol className="list-decimal pl-6 space-y-3 text-sm">
            <li>
              <strong>Conduction station:</strong> keep temperature fixed and increase the area of the rod.
              <span className="text-slate-500"> The heat flow rises because more cross-section allows more energy transfer per second.</span>
            </li>
            <li>
              <strong>Convection station:</strong> switch the environment between air, water, and vacuum.
              <span className="text-slate-500"> Circulation becomes stronger in fluids and vanishes in vacuum.</span>
            </li>
            <li>
              <strong>Radiation station:</strong> raise temperature from around 1000 K toward 6000 K.
              <span className="text-slate-500"> The blackbody glows brighter, total power shoots upward, and the Wien peak shifts left toward visible light.</span>
            </li>
          </ol>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-3">
            <p className="text-sm text-blue-800 text-center">
              <strong>Learning Outcome:</strong> Students can compare all three heat-transfer modes and connect blackbody color, intensity, and peak wavelength directly to temperature.
            </p>
          </div>
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

  if (topic?.id === 'mean-free-path') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Mean Free Path of Gas Molecules</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The <strong>mean free path (l)</strong> is the average distance a molecule travels between two successive collisions. It explains why gases diffuse slowly despite molecules moving at the speed of sound.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Zig-Zag Path Problem</h3>
        <p className="text-sm">
          Gas molecules travel at very high speeds (~500 m/s for nitrogen at room temperature) yet a perfume scent takes minutes to cross a room. This paradox is resolved by the mean free path — molecules constantly collide with each other, following a chaotic zig-zag path rather than a straight line.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Derivation — The Collision Cylinder</h3>
        <p className="text-sm">Consider a single molecule of diameter <strong>d</strong> moving with average speed <strong>⟨v⟩</strong>:</p>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>In time Δt, it sweeps out a <strong>collision cylinder</strong> of volume <strong>πd²⟨v⟩Δt</strong></li>
          <li>Any molecule whose centre lies within this cylinder will be hit</li>
          <li>Number of collisions = <strong>n · πd²⟨v⟩Δt</strong>, where n is the number density</li>
          <li>Collision rate = <strong>n · πd²⟨v⟩</strong></li>
          <li>Accounting for the relative motion of all molecules introduces the factor √2</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Formula</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="font-mono text-xl text-brand-primary">l = 1 / (√2 · n · π · d²)</p>
          <p className="text-sm text-slate-600 mt-2">where n = N/V (number density, m⁻³), d = molecular diameter (m)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Cause and Effect</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3 text-left border border-slate-200">Parameter</th>
                <th className="p-3 text-left border border-slate-200">Change</th>
                <th className="p-3 text-left border border-slate-200">Effect on l</th>
                <th className="p-3 text-left border border-slate-200">Why?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border border-slate-200 font-bold text-blue-700">Density (n)</td>
                <td className="p-3 border border-slate-200">n ↑</td>
                <td className="p-3 border border-slate-200 font-bold text-red-600">l ↓  (l ∝ 1/n)</td>
                <td className="p-3 border border-slate-200">More targets per unit volume</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-3 border border-slate-200 font-bold text-red-700">Diameter (d)</td>
                <td className="p-3 border border-slate-200">d ↑</td>
                <td className="p-3 border border-slate-200 font-bold text-red-600">l ↓  (l ∝ 1/d²)</td>
                <td className="p-3 border border-slate-200">Larger cross-section πd²</td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-200 font-bold text-green-700">Temperature (T)</td>
                <td className="p-3 border border-slate-200">T ↑ (const. P)</td>
                <td className="p-3 border border-slate-200 font-bold text-green-600">l ↑</td>
                <td className="p-3 border border-slate-200">Gas expands → n decreases</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-500 mt-1">Note: Increasing temperature at <em>constant volume</em> does not change l (n stays constant).</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">🍳 Cooking Smells &amp; Perfume</h4>
          <p className="text-sm">
            Despite molecules moving at ~500 m/s, the scent takes several minutes to cross a room. Nitrogen molecules in air collide ~5 billion times per second, making the mean free path just ~70 nm at atmospheric pressure.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">💡 Vacuum Tubes &amp; Electronics</h4>
          <p className="text-sm">
            In highly evacuated vacuum tubes, the number density n is so small that the mean free path becomes comparable to the size of the tube itself. Electrons or gas molecules can travel end-to-end without any collision — essential for CRT screens and electron microscopes.
          </p>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-slate-500 my-4">
          <h4 className="font-bold text-slate-900 mb-2">🏭 Industrial Gas Separation</h4>
          <p className="text-sm">
            In Knudsen diffusion, gases pass through porous membranes whose pore size is smaller than the mean free path. Under these conditions, each molecule moves independently, allowing separation based on molecular mass.
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

  if (topic?.id === 'simple-pendulum') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">The Simple Pendulum</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          A simple pendulum is an idealized system consisting of a small bob of mass <strong>m</strong> tied to an inextensible, massless string of length <strong>L</strong> that is fixed to a rigid support. It demonstrates the interplay between gravity and inertia.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Definition &amp; Physical Setup</h3>
        <p className="text-sm">In its equilibrium position, the bob hangs vertically at rest. When displaced by an angle θ, the forces acting on it are:</p>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Tension (T)</strong> — along the string, toward the pivot</li>
          <li><strong>Weight (mg)</strong> — vertically downward</li>
        </ul>
        <p className="text-sm mt-2">The tangential component of gravity (<strong>mgsinθ</strong>) acts as the restoring force.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Equation of Motion</h3>
        <p className="text-sm">Using torque equation τ = Iα:</p>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="font-mono text-lg text-brand-primary">τ = −L(mg sinθ) = Iα</p>
          <p className="text-sm text-slate-600 mt-1">where I = mL² (moment of inertia of a point mass)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Small Angle Approximation</h3>
        <p className="text-sm">For small angles (θ &lt; 20°), sinθ ≈ θ (in radians). This gives:</p>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="font-mono text-lg text-emerald-700">α ≈ −(g/L)θ</p>
          <p className="text-sm text-slate-600 mt-1">This is the defining condition for Simple Harmonic Motion!</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Time Period &amp; Angular Frequency</h3>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
          <p className="font-mono text-lg text-purple-700">T = 2π√(L/g)</p>
          <p className="font-mono text-md text-purple-600 mt-1">ω = √(g/L)</p>
        </div>
        <p className="text-sm"><strong>Key Insight:</strong> The period depends ONLY on length L and gravity g — it is independent of the mass of the bob and (for small angles) the amplitude!</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">🎢 Playground Swing</h4>
          <p className="text-sm">
            A child on a swing acts as a pendulum. Pushing the swing provides energy to overcome friction (damping), while gravity acts as the restoring force.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🕐 Grandfather Clock</h4>
          <p className="text-sm">
            These clocks use a pendulum to maintain a precise period. The length is often adjustable to &quot;tune&quot; the clock to T = 2 seconds (a &quot;seconds pendulum&quot;).
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4">
          <h4 className="font-bold text-emerald-900 mb-2">⛰️ Geological Survey</h4>
          <p className="text-sm">
            By measuring the time period of a pendulum of known length, scientists can calculate the local value of g to detect underground mineral deposits or variations in the Earth&apos;s crust.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Conditions &amp; Limits</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>The motion is only <strong>strictly simple harmonic</strong> for small angular displacements</li>
          <li>Large angles result in &quot;non-linear&quot; oscillations where the period depends on the amplitude</li>
          <li>The string should be inextensible and massless (idealized)</li>
        </ul>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'standing-waves') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Superposition, Reflection &amp; Standing Waves</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When two identical waves travel in opposite directions, their superposition creates a <strong>standing wave</strong> — a pattern that oscillates in place, with fixed nodes and vibrating antinodes.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Principle of Superposition</h3>
        <p className="text-sm">The net displacement at any point is the algebraic sum of individual wave displacements: <strong>y = y₁ + y₂</strong>. Each wave travels as if the others are not present.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Reflection of Waves</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Fixed end:</strong> Phase change of π — reflected wave is inverted. y<sub>r</sub> = −a sin(kx + ωt)</li>
          <li><strong>Free end:</strong> No phase change — reflected wave is upright. y<sub>r</sub> = a sin(kx + ωt)</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Standing Wave Equation</h3>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
          <p className="font-mono text-lg text-purple-700">y(x,t) = [2a sin(kx)] cos(ωt)</p>
          <p className="text-sm text-slate-600 mt-1">Amplitude varies with position — kx and ωt are separate!</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Nodes &amp; Antinodes</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Nodes:</strong> sin(kx) = 0 → x = 0, λ/2, λ, ... (particles never move). Distance = λ/2.</li>
          <li><strong>Antinodes:</strong> |sin(kx)| = 1 → x = λ/4, 3λ/4, ... (maximum amplitude 2a). Distance = λ/2.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Normal Modes (Harmonics)</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="font-mono text-lg text-brand-primary">ν<sub>n</sub> = nv/(2L)   where v = √(T/μ)</p>
          <p className="text-sm text-slate-600 mt-1">n = 1 (fundamental), 2, 3, ... Each gives n loops with n+1 nodes.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Real-World Applications</h3>
        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">🎸 Musical Instruments</h4>
          <p className="text-sm">Guitar and sitar strings vibrate in standing wave patterns. The combination of fundamental and higher harmonics determines the instrument&apos;s timbre (tonal quality).</p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🌊 Resonance in Bays</h4>
          <p className="text-sm">Tides entering a partially enclosed bay reflect off the coast, creating standing water waves. When the bay&apos;s natural frequency matches the tidal frequency, massive resonant antinodes form.</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4">
          <h4 className="font-bold text-emerald-900 mb-2">🎵 Organ Pipes</h4>
          <p className="text-sm">Wind instruments use standing waves in air columns. A pipe closed at one end creates a displacement node there, restricting frequencies to odd harmonics: ν<sub>n</sub> = nv/(4L) for n = 1, 3, 5...</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'hydrogen-spectrum') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Line Spectrum of Hydrogen and Bohr's Model</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The hydrogen spectrum is the set of discrete wavelengths of light emitted or absorbed when an electron transitions between fixed energy levels.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Quantization of Energy</h3>
        <p>
          Classical physics predicted atoms should collapse. Niels Bohr postulated that electrons can only revolve in specific "stationary orbits" without losing energy. Thus, the energy of an electron is <strong>quantized</strong>.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Ground State (<span className="font-mono">n=1</span>):</strong> The lowest possible energy state and the most stable.</li>
          <li><strong>Excitation (Absorption):</strong> If supplied with exact packets of energy, the electron absorbs a photon and "jumps" to a higher orbit (<span className="font-mono">n=2, 3, 4...</span>).</li>
          <li><strong>De-excitation (Emission):</strong> The electron quickly falls back down, discarding excess energy by emitting a single photon of specific wavelength.</li>
        </ul>

        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center pb-2">E<sub>n</sub> = -2.18 × 10<sup>-18</sup> (1/n²) J</p>
          <p className="font-mono text-xl text-brand-primary text-center">ΔE = E<sub>f</sub> - E<sub>i</sub></p>
          <p className="text-sm text-slate-600 mt-2 text-center border-t border-slate-300 pt-2">The energy of the emitted photon equals the difference between the higher and lower orbits.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Hydrogen Emission Series</h3>
        <p>
          The energy gap between orbits is massive at the bottom and gets progressively smaller higher up.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Lyman Series (n_final = 1):</strong> Huge energy drops → Ultraviolet (UV) light.</li>
          <li><strong>Balmer Series (n_final = 2):</strong> Moderate energy drops → Visible light (Red to Violet).</li>
          <li><strong>Paschen/Brackett/Pfund (n_final ≥ 3):</strong> Small energy drops → Infrared (IR) light.</li>
        </ul>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-6">
          <h4 className="font-bold text-amber-900 mb-2">🎆 Real-World Analogy: Fireworks & Neon Signs</h4>
          <p className="text-sm">
            When electricity passes through neon gas, electrons are excited. When they drop down, they emit specific wavelengths, giving Neon its red-orange glow.
            Similarly, fireworks' colors depend on the metal salts used (strontium for red, copper for blue); heat excites electrons, and atomic "falling down" transitions dictate the color we see!
          </p>
        </div>

        <div className="bg-indigo-50 p-6 rounded-xl border-l-4 border-indigo-500 my-6">
          <h4 className="font-bold text-indigo-900 mb-2">🔭 Astrophysics: Stellar Spectroscopy</h4>
          <p className="text-sm">
            Astronomers know the chemical composition of stars millions of lightyears away. Cooler gases absorb specific wavelengths from starlight. By looking at the missing black lines (absorption spectra), they compare them to known energy levels on Earth to identify the star's elements.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'atomic-orbitals') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Shapes of Atomic Orbitals</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Unlike planets orbiting the sun, electrons exist in 3D "probability clouds." An orbital represents the region in space where the probability of finding an electron is maximum.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Quantum Mechanical Model</h3>
        <p>
          Heisenberg's Uncertainty Principle states we cannot know both the exact position and momentum of an electron. Instead, we use Schrödinger's wave equation (ψ) to find the probability density (ψ²).
          A boundary surface diagram connects points of constant probability to visualize the "shape" of these clouds.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Shapes of Orbitals (s, p, d)</h3>
        <ul className="list-disc pl-5 space-y-4 mb-6">
          <li>
            <strong>s-orbitals (l = 0):</strong> Spherically symmetric. The probability of finding the electron is identical in all directions at a given distance. Size increases with <i>n</i> (1s &lt; 2s &lt; 3s).
          </li>
          <li>
            <strong>p-orbitals (l = 1):</strong> Consists of two lobes separated by a plane (dumbbell shape). There are three mutually perpendicular p-orbitals: p<sub>x</sub>, p<sub>y</sub>, and p<sub>z</sub>.
          </li>
          <li>
            <strong>d-orbitals (l = 2):</strong> Four of the five d-orbitals have a "double-dumbbell" or clover shape (d<sub>xy</sub>, d<sub>yz</sub>, d<sub>xz</sub>, d<sub>x²-y²</sub>). The fifth (d<sub>z²</sub>) looks like a dumbbell with a doughnut-shaped ring around the center.
          </li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Nodes: Zones of Zero Probability</h3>
        <p>
          A node is a region where the probability density (ψ²) drops to absolute zero.
        </p>
        <div className="my-6 p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <p><strong>Radial Nodes:</strong> Spherical shells of zero probability. <br /><span className="font-mono text-brand-primary">Formula: n - l - 1</span></p>
          <p><strong>Angular Nodes (Nodal Planes):</strong> Flat planes slicing through the nucleus with zero probability. <br /><span className="font-mono text-brand-secondary">Formula: l</span></p>
          <p><strong>Total Nodes:</strong> <span className="font-mono text-slate-700">Formula: n - 1</span></p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-6">
          <h4 className="font-bold text-sky-900 mb-2">🐝 Real-World Analogy: A Swarm of Bees</h4>
          <p className="text-sm">
            Imagine a beehive as the nucleus. A single bee flies around it incredibly fast. A photograph won't show the bee; a time-lapse reveals a blurry "cloud." The cloud is thickest near the hive. This is electron probability density (ψ²). A region where a repelling scent keeps bees away is a "node."
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">🎸 Nature Example: Standing Waves</h4>
          <p className="text-sm">
            When you pluck a guitar string, points vibrate violently (antinodes) while others remain perfectly still (nodes). Electron wave functions (ψ) are essentially 3D standing waves, and orbital nodes are the 3D equivalent of those motionless vibrational points.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  // --- UNIT IV: CHEMICAL BONDING ---

  if (topic?.id === 'vsepr-theory') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">The Valence Shell Electron Pair Repulsion (VSEPR) Theory</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The Lewis concept of chemical bonding helps us write the structure of molecules in 2D, but it completely fails to explain the actual 3-dimensional shapes. VSEPR theory overcomes this limitation.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Physical Meaning & Postulates</h3>
        <p>
          The core physical meaning of the VSEPR theory is that electron pairs (being negatively charged) inherently repel each other and will arrange themselves in 3D space to maximize their distance apart, thereby minimizing repulsion and stabilizing the molecule.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-6">
          <li>The overall shape of a molecule depends entirely on the total number of valence shell electron pairs (both bonded and lone pairs).</li>
          <li>Pairs of electrons repel one another because their electron clouds are negatively charged.</li>
          <li>To minimize this repulsion, these electron pairs occupy spatial positions that maximize the distance between them.</li>
          <li>The valence shell is considered as a sphere, with pairs localizing on its surface.</li>
          <li>A multiple bond (double or triple) is treated as if it is a single electron pair (a single super pair) for predicting geometry.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Role of Lone Pairs (Scientific Logic)</h3>
        <p>
          Not all electron pairs are equal. While bond pairs are shared between two atomic nuclei, lone pairs are localized on the central atom. Under the influence of only one nucleus, a lone pair's electron cloud occupies more spatial volume, exerting a stronger repulsive force.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">Repulsion Order: LP-LP &gt; LP-BP &gt; BP-BP</p>
          <p className="text-sm text-slate-600 mt-2 text-center">Lone Pair (LP) - Bond Pair (BP)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Cause and Effect: Geometric Distortion</h3>
        <ul className="list-disc pl-5 space-y-4 mb-6">
          <li>
            <strong>Ideal Geometry:</strong> Only bond pairs. Perfect symmetry (e.g., CH₄ is perfectly Tetrahedral at 109.5°).
          </li>
          <li>
            <strong>One Lone Pair (e.g., NH₃):</strong> Nitrogen has 3 bond pairs, 1 lone pair. The strong LP-BP repulsion squeezes N-H bonds. Shape: <i>Trigonal Pyramidal</i> (Angle drops from 109.5° to 107°).
          </li>
          <li>
            <strong>Two Lone Pairs (e.g., H₂O):</strong> Oxygen has 2 bond pairs, 2 lone pairs. Massive LP-LP repulsion brutally squishes O-H bonds. Shape: <i>Bent</i> (Angle drops further to 104.5°).
          </li>
          <li>
            <strong>Equatorial Preference (e.g., SF₄):</strong> In a 5-pair Trigonal Bipyramidal setup, lone pairs occupy equatorial positions, minimizing 90° repulsions. This forms a <i>See-saw</i> shape.
          </li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">🎈 Daily Life Analogy: Tied Balloons</h4>
          <p className="text-sm">
            Imagine tying 4 elongated balloons together. They naturally fan out into a tetrahedral shape giving maximum space. Now attach one significantly fatter balloon (a lone pair). It forces the three thinner balloons to squeeze closer together!
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500 my-4">
          <h4 className="font-bold text-blue-900 mb-2">💧 Nature: Water's Unique Properties</h4>
          <p className="text-sm">
            Because H₂O has two lone pairs, it is distinctly bent (not linear). This asymmetry creates a dipole moment. This precise polarity is why water is the universal solvent, liquid at room temperature, and why ice floats—fundamental to life!
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🌡️ Industrial: Microwave Ovens</h4>
          <p className="text-sm">
            Microwaves work exactly by interacting with water's dipole moment. VSEPR theory's lone pair dictates the bent geometry allowing the water molecule to align with the oscillating electromagnetic field, generating heat.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4">
          <h4 className="font-bold text-emerald-900 mb-2">💊 Pharmaceutical Engineering</h4>
          <p className="text-sm">
            Receptors in our body are locks. VSEPR theory is actively used to predict exact 3D molecular geometry of synthetic drugs to ensure perfectly shaped "keys" that fit into viral or bacterial receptors.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'sigma-pi-bonds') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Types of Overlapping and Nature of Covalent Bonds</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          In Valence Bond theory, a covalent bond forms when two atomic orbitals partially merge (overlap), pairing electrons with opposite spins and lowering the system's potential energy.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Phases of Orbitals</h3>
        <p>
          Orbital wave functions (ψ) have <strong>positive (+)</strong> and <strong>negative (−)</strong> regions representing the phase of the wave — <em>not</em> electrical charge. Two overlapping orbitals must have the <strong>same phase</strong> and proper orientation to produce a <strong>constructive overlap</strong> (bonding). Opposite phases give <strong>destructive interference</strong> (no bond).
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Sigma (σ) Bond — Head-on Overlap</h3>
        <p>
          Formed by <strong>end-to-end</strong> overlap along the internuclear axis. The electron cloud is <strong>cylindrically symmetrical</strong> around the bond axis.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-6">
          <li><strong>s–s overlap:</strong> Two half-filled s-orbitals merge (e.g., H₂ molecule).</li>
          <li><strong>s–p overlap:</strong> One s-orbital overlaps with one p-orbital head-on.</li>
          <li><strong>p–p axial overlap:</strong> Two p-orbitals overlap head-on along the z-axis (p<sub>z</sub>–p<sub>z</sub>).</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Pi (π) Bond — Sideways Overlap</h3>
        <p>
          Formed when <strong>parallel p-orbitals</strong> overlap laterally, perpendicular to the internuclear axis. The electron cloud sits in two lobes <strong>above and below</strong> the molecular plane.
        </p>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800 text-center"><strong>Key Rule:</strong> A π bond is <em>never</em> formed alone — it always accompanies an existing σ bond in double or triple bonds.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Strength: σ vs. π</h3>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">Sigma (σ) Bond &gt; Pi (π) Bond</p>
          <p className="text-sm text-slate-600 mt-2 text-center">Head-on approach → greater overlap extent → stronger bond.<br />Sideways approach → less overlap → weaker, more reactive bond.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">🤝 Daily Life Analogy: Handshake vs. High-Five</h4>
          <p className="text-sm">
            A σ bond is a firm, direct handshake — strong and head-on. A π bond is like adding a sideways high-five while maintaining the handshake. The high-five is weaker and easier to break.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4">
          <h4 className="font-bold text-emerald-900 mb-2">🏭 Industrial: Plastics Manufacturing</h4>
          <p className="text-sm">
            Polythene is made by breaking ethene's weak π bond under heat and pressure. The freed electrons form new σ bonds, linking thousands of molecules into long, strong polymer chains.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">👁️ Biological: Vision</h4>
          <p className="text-sm">
            Retinal in our eyes has alternating σ and (σ+π) bonds. Light energy breaks the weaker π bond, allowing rotation around the remaining σ bond. This shape change triggers the nerve impulse that lets us see!
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'isothermal-work') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Isothermal Reversible &amp; Irreversible Work</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When a gas expands or compresses at constant temperature, the amount of work it performs depends crucially on <strong>how</strong> the process is carried out — reversibly (infinitely slowly) or irreversibly (sudden).
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The First Law of Thermodynamics</h3>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">ΔU = q + W</p>
          <p className="text-sm text-slate-600 mt-2 text-center">For an isothermal process of an ideal gas: ΔU = 0, so <strong>q = −W</strong></p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Reversible Isothermal Expansion</h3>
        <p>
          The gas expands in <strong>infinitesimally small steps</strong>, with the external pressure always just slightly less than the gas pressure. At each step, the system is virtually at equilibrium.
        </p>
        <div className="my-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="font-mono text-lg text-emerald-700 text-center">W<sub>rev</sub> = −nRT ln(V₂/V₁)</p>
          <p className="text-sm text-emerald-600 mt-2 text-center">This gives the <strong>maximum work</strong> obtainable from expansion.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Irreversible Isothermal Expansion</h3>
        <p>
          The external pressure drops suddenly to a constant value P<sub>ext</sub> (e.g., the final pressure). The gas rushes outward doing less total work than the reversible case.
        </p>
        <div className="my-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="font-mono text-lg text-amber-700 text-center">W<sub>irr</sub> = −P<sub>ext</sub>(V₂ − V₁)</p>
          <p className="text-sm text-amber-600 mt-2 text-center">Always less than reversible work: |W<sub>irr</sub>| &lt; |W<sub>rev</sub>|</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Why Does It Matter?</h3>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            <strong>Key Insight (P–V Diagram):</strong> The work done equals the <strong>area under the curve</strong> on the P–V graph. The reversible curve (along the isotherm) always encloses more area than the irreversible rectangle.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🚗 Automobile Engines</h4>
          <p className="text-sm">
            Internal combustion engines approximate thermodynamic cycles. Engineers strive to make expansion strokes as close to reversible as possible to extract maximum useful work from fuel combustion.
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-500 my-4">
          <h4 className="font-bold text-purple-900 mb-2">🔋 Fuel Cells</h4>
          <p className="text-sm">
            Fuel cells convert chemical energy to electrical energy nearly reversibly, which is why they can achieve much higher efficiencies (60–80%) compared to combustion engines (25–40%).
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'extensive-intensive-properties') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Extensive &amp; Intensive Properties</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Thermodynamic properties fall into two distinct categories based on how they respond to the <strong>quantity of matter</strong> present in the system.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Definitions</h3>
        <div className="my-6 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-800"><strong>Extensive Properties</strong> depend on the <em>quantity or size</em> of matter. More substance → larger value.</p>
          <p className="text-sm text-red-700 mt-1">Examples: Mass (m), Volume (V), Internal Energy (U), Enthalpy (H), Heat Capacity (C)</p>
        </div>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Intensive Properties</strong> do <em>not</em> depend on the quantity or size of matter. They are inherent characteristics of the substance.</p>
          <p className="text-sm text-blue-700 mt-1">Examples: Temperature (T), Density (d), Pressure (p), Molar Volume (V<sub>m</sub>)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Partition Thought Experiment</h3>
        <p>
          Imagine a gas in a container of volume <strong>V</strong> at temperature <strong>T</strong>. Now insert a partition down the middle:
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-700 mb-1">🔪 <strong>Volume?</strong> Each half has V/2. Volume <em>changed</em> → <span className="text-red-600 font-bold">Extensive</span></p>
          <p className="text-sm text-slate-700">🌡️ <strong>Temperature?</strong> Still T in both halves. Temperature <em>didn't change</em> → <span className="text-blue-600 font-bold">Intensive</span></p>
        </div>
        <p className="text-sm text-slate-600 italic">The key test: "If I cut this system in half, does this number change?" If yes → extensive. If no → intensive.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Molar Properties: Extensive → Intensive</h3>
        <div className="my-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="font-mono text-lg text-purple-700 text-center">χ<sub>m</sub> = χ / n</p>
          <p className="text-sm text-purple-600 mt-2 text-center"><strong>Extensive ÷ Extensive = Intensive!</strong> Dividing any extensive property by moles gives a molar property that is intensive.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Applications</h3>
        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">☕ Boiling Water Analogy</h4>
          <p className="text-sm">A teacup and a bathtub of boiling water both read 100°C (intensive). But the bathtub has far more mass, volume, and stored heat energy (all extensive).</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">✈️ Aerospace Engineering</h4>
          <p className="text-sm">Engineers select aluminum for aircraft wings based on its density (intensive). A small block and a massive sheet of aluminum share the same low density — it's predictable regardless of size.</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border-l-4 border-red-500 my-4">
          <h4 className="font-bold text-red-900 mb-2">🏭 Chemical Manufacturing Risk</h4>
          <p className="text-sm">Scaling a reaction from a test tube to a 10,000 L reactor means enthalpy (extensive) scales 1,000×. Without proportional cooling, this poses a severe explosion risk.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'buffer-solutions') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Buffer Solutions &amp; Designing Buffers</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Solutions that <strong>resist changes in pH</strong> upon dilution or addition of small amounts of acid or alkali are called <strong>buffer solutions</strong>. They are critical in biology, medicine, and industry.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Types of Buffer Solutions</h3>
        <div className="my-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
          <p className="text-sm text-orange-800"><strong>Acidic Buffer:</strong> Weak acid + its salt with a strong base.</p>
          <p className="text-sm text-orange-700 mt-1">Example: CH₃COOH + CH₃COONa → buffers around pH 4.75</p>
        </div>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Basic Buffer:</strong> Weak base + its salt with a strong acid.</p>
          <p className="text-sm text-blue-700 mt-1">Example: NH₄OH + NH₄Cl → buffers around pH 9.25</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. How Buffer Action Works</h3>
        <p className="text-sm">
          In an acidic buffer (CH₃COOH / CH₃COO⁻):
        </p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-700 mb-2">🔴 <strong>Add HCl:</strong> Extra H⁺ is consumed by CH₃COO⁻ → CH₃COOH. pH barely changes.</p>
          <p className="text-sm text-slate-700">🔵 <strong>Add NaOH:</strong> Extra OH⁻ is consumed by CH₃COOH → CH₃COO⁻ + H₂O. pH barely changes.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Henderson-Hasselbalch Equation</h3>
        <div className="my-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="font-mono text-lg text-purple-700 text-center">pH = pK<sub>a</sub> + log([Salt] / [Acid])</p>
          <p className="text-sm text-purple-600 mt-2 text-center">When [Salt] = [Acid], log(1) = 0, so <strong>pH = pK<sub>a</sub></strong> (maximum buffer capacity).</p>
        </div>
        <div className="my-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
          <p className="font-mono text-lg text-indigo-700 text-center">pOH = pK<sub>b</sub> + log([Base] / [Conjugate Acid])</p>
          <p className="text-sm text-indigo-600 mt-2 text-center">For basic buffers. Use pH + pOH = 14 to find pH.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Buffer Capacity &amp; Limits</h3>
        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-800">A buffer has a <strong>finite capacity</strong>. If enough acid is added to completely consume the conjugate base (A⁻), the buffer <strong>breaks</strong> and pH crashes.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="bg-red-50 p-6 rounded-xl border-l-4 border-red-500 my-4">
          <h4 className="font-bold text-red-900 mb-2">🩸 Human Blood</h4>
          <p className="text-sm">Blood is buffered at pH 7.4 by the H₂CO₃/HCO₃⁻ system. Deviations below 7.0 or above 7.8 are fatal. The bicarbonate buffer neutralizes lactic acid from exercise.</p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🧴 Cosmetics &amp; Skincare</h4>
          <p className="text-sm">Shampoos and baby lotions are buffered to pH ~5.5 to match the skin's acid mantle, preventing bacterial growth and irritation.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'le-chatelier-equilibrium') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Le Chatelier's Principle: Effect of Concentration Change</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When a system at equilibrium is disturbed by changing the concentration of a reactant or product, it <strong>shifts to counteract the change</strong> and restore equilibrium.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Principle</h3>
        <div className="my-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-800"><strong>Le Chatelier's Principle:</strong> If a change is imposed on a system at equilibrium, the system adjusts to partially oppose the imposed change.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. How It Works (Q꜀ vs K꜀)</h3>
        <p className="text-sm">For the reaction Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺:</p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-700 mb-2">🔶 <strong>Add reactant (Fe³⁺ or SCN⁻):</strong> Q꜀ drops below K꜀ → system shifts <span className="text-amber-600 font-bold">forward</span> → more red product forms.</p>
          <p className="text-sm text-slate-700">🔷 <strong>Remove reactant:</strong> Q꜀ rises above K꜀ → system shifts <span className="text-blue-600 font-bold">backward</span> → red product decomposes, color fades to yellow.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. The Reaction Quotient</h3>
        <div className="my-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="font-mono text-lg text-purple-700 text-center">Q꜀ = [Fe(SCN)²⁺] / ([Fe³⁺][SCN⁻])</p>
          <p className="text-sm text-purple-600 mt-2 text-center">
            Q꜀ &lt; K꜀ → forward shift &nbsp;|&nbsp; Q꜀ &gt; K꜀ → backward shift &nbsp;|&nbsp; Q꜀ = K꜀ → equilibrium
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Applications</h3>
        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🏭 Haber Process (NH₃)</h4>
          <p className="text-sm">NH₃ is continuously liquefied and removed from the reactor. By removing product, Q꜀ stays below K꜀, forcing N₂ + 3H₂ to keep reacting forward.</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">🔥 Quicklime from Limestone</h4>
          <p className="text-sm">CaCO₃ ⇌ CaO + CO₂. Blowing air through the kiln removes CO₂, driving the decomposition to completion.</p>
        </div>

        <VideoSection />
      </div>
    );
  }
  // --- UNIT VIII: ORGANIC CHEMISTRY ---

  if (topic?.id === 'qualitative-analysis-organic') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Detection of Elements — Qualitative Analysis (Lassaigne's Test)</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Organic compounds are predominantly <strong>covalent</strong>. Standard inorganic qualitative tests rely on ionic reactions. To detect heteroatoms (N, S, Halogens, P), we must first <strong>convert them from covalent form into ionic form</strong>.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Detection of Carbon and Hydrogen</h3>
        <p>
          The organic compound is heated with <strong>Copper(II) oxide (CuO)</strong>, which acts as an oxidizing agent.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">C + 2CuO → 2Cu + CO₂</p>
          <p className="font-mono text-lg text-brand-primary text-center">2H + CuO → Cu + H₂O</p>
          <p className="text-sm text-slate-600 mt-2 text-center">CO₂ turns lime water milky (CaCO₃). H₂O turns anhydrous CuSO₄ blue.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Lassaigne&apos;s Test (Sodium Fusion)</h3>
        <p>
          The organic compound is <strong>fused with metallic sodium</strong> at high temperature. Sodium is highly electropositive — at red heat, it breaks the covalent bonds and reacts with heteroatoms to form stable, water-soluble <strong>ionic sodium salts</strong>.
        </p>
        <div className="my-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
          <p className="font-mono text-sm text-emerald-700">For Nitrogen: Na + C + N → NaCN (Sodium cyanide)</p>
          <p className="font-mono text-sm text-emerald-700">For Sulphur: 2Na + S → Na₂S (Sodium sulphide)</p>
          <p className="font-mono text-sm text-emerald-700">For Halogen: Na + X → NaX (Sodium halide)</p>
        </div>
        <p className="text-sm text-slate-600 italic">The fused mass is extracted with boiling distilled water. This clear filtrate is the <strong>Sodium Fusion Extract (SFE)</strong>.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Test for Nitrogen (Prussian Blue)</h3>
        <p>
          The SFE is boiled with <strong>FeSO₄</strong> and then acidified with <strong>conc. H₂SO₄</strong>.
        </p>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-sm text-blue-700">6CN⁻ + Fe²⁺ → [Fe(CN)₆]⁴⁻</p>
          <p className="font-mono text-sm text-blue-700">3[Fe(CN)₆]⁴⁻ + 4Fe³⁺ → Fe₄[Fe(CN)₆]₃ · xH₂O</p>
          <p className="text-sm text-blue-600 mt-2 font-bold text-center">Result: Brilliant Prussian Blue color</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Test for Sulphur</h3>
        <ul className="list-disc pl-5 space-y-4 mb-6">
          <li>
            <strong>Lead Acetate Test:</strong> SFE + acetic acid + lead acetate → <strong>Black precipitate</strong> of PbS.
            <span className="font-mono text-sm ml-2">S²⁻ + Pb²⁺ → PbS↓</span>
          </li>
          <li>
            <strong>Nitroprusside Test:</strong> SFE + sodium nitroprusside → <strong>Violet color</strong>.
            <span className="font-mono text-sm ml-2">S²⁻ + [Fe(CN)₅NO]²⁻ → [Fe(CN)₅NOS]⁴⁻</span>
          </li>
        </ul>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-800"><strong>Special Case (N and S both present):</strong> NaSCN forms instead of NaCN and Na₂S. Adding Fe³⁺ gives a <strong>blood red</strong> color: Fe³⁺ + SCN⁻ → [Fe(SCN)]²⁺. No Prussian blue appears since free CN⁻ is absent.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Test for Halogens</h3>
        <p>
          The SFE is acidified with <strong>HNO₃</strong> (to remove CN⁻ and S²⁻ interference) and treated with <strong>AgNO₃</strong>.
        </p>
        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-800"><strong>⚠️ Critical:</strong> Must boil with HNO₃ first to expel HCN and H₂S. Otherwise, AgCN or Ag₂S precipitates interfere!</p>
        </div>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300 space-y-1">
          <p className="text-sm text-slate-700"><strong>White ppt</strong> (soluble in NH₄OH) = Chlorine (AgCl)</p>
          <p className="text-sm text-slate-700"><strong>Yellowish ppt</strong> (sparingly soluble) = Bromine (AgBr)</p>
          <p className="text-sm text-slate-700"><strong>Yellow ppt</strong> (insoluble in NH₄OH) = Iodine (AgI)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Test for Phosphorus</h3>
        <p className="text-sm">
          The compound is heated with Na₂O₂, converting P → PO₄³⁻. Boiling with HNO₃ and adding ammonium molybdate yields a <strong>yellow precipitate</strong> of (NH₄)₃PO₄·12MoO₃.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. Real-World Applications</h3>
        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">🥜 The Walnut Shell Analogy</h4>
          <p className="text-sm">
            An organic compound is a tough walnut (covalent bonds), and the elements inside (N, S, Cl) are the nutmeat. Fusing with Na is like smashing the walnut — it breaks the covalent &ldquo;shell&rdquo; and releases elements as free ions your reagents can detect.
          </p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🔍 Forensic Toxicology</h4>
          <p className="text-sm">
            Toxicologists use elemental analysis to identify unknown synthetic drugs. Detecting chlorine points to chloroform or sedatives; nitrogen suggests alkaloids or amphetamines.
          </p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4">
          <h4 className="font-bold text-emerald-900 mb-2">💊 Pharmaceutical Industry</h4>
          <p className="text-sm">
            When a new drug is synthesized, chemists perform these elemental tests to verify that the desired heteroatoms were successfully incorporated into the molecular structure.
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-500 my-4">
          <h4 className="font-bold text-purple-900 mb-2">🌾 Agricultural Chemistry</h4>
          <p className="text-sm">
            Detecting organic phosphorus is crucial for evaluating soil quality and pesticide residues. The yellow ammonium phosphomolybdate test is a standard method for organophosphates.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'quantitative-analysis-organic') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Estimation of C, H, N, S & Halogens — Quantitative Analysis (Liebig's Method)</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Once an organic compound is purified and its elements are <strong>qualitatively identified</strong>, the next step is to determine the <strong>exact mass percentage</strong> of each element. This data is the foundation for calculating empirical and molecular formulas.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Estimation of Carbon and Hydrogen (Liebig&apos;s Combustion)</h3>
        <p>
          A known mass (<strong>m</strong>) of the compound is burnt in excess pure oxygen with heated <strong>CuO</strong> (oxidizing agent). All Carbon &rarr; CO₂ and all Hydrogen &rarr; H₂O.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">C<sub>x</sub>H<sub>y</sub> + (x + y/4) O₂ &rarr; x CO₂ + (y/2) H₂O</p>
        </div>
        <p className="text-sm"><strong>Trapping the Gases:</strong> The mixture passes through two weighed U-tubes connected <em>in series</em>:</p>
        <ul className="list-disc pl-5 space-y-2 mb-6">
          <li><strong>Tube 1 — Anhydrous CaCl₂:</strong> Absorbs only H₂O vapour. Mass increase = m₁.</li>
          <li><strong>Tube 2 — Conc. KOH:</strong> Absorbs CO₂ gas (forms K₂CO₃). Mass increase = m₂.</li>
        </ul>

        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-800"><strong>⚠️ Critical Order:</strong> CaCl₂ must come <em>before</em> KOH. If KOH is placed first, it absorbs both H₂O and CO₂, making the Carbon calculation artificially high!</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Formulas</h3>
        <div className="my-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
          <p className="font-mono text-lg text-emerald-700 text-center">%H = (2/18) &times; (m₁/m) &times; 100</p>
          <p className="text-sm text-emerald-600 text-center">1 mol H₂O (18g) contains 2g of Hydrogen</p>
        </div>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
          <p className="font-mono text-lg text-blue-700 text-center">%C = (12/44) &times; (m₂/m) &times; 100</p>
          <p className="text-sm text-blue-600 text-center">1 mol CO₂ (44g) contains 12g of Carbon</p>
        </div>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="text-sm text-purple-800"><strong>If %C + %H &lt; 100%:</strong> The difference is attributed to <strong>Oxygen</strong> (by difference method).</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Estimation of Nitrogen</h3>
        <ul className="list-disc pl-5 space-y-4 mb-6">
          <li>
            <strong>Dumas Method:</strong> Compound heated with CuO in CO₂ atmosphere. Nitrogen &rarr; N₂ gas. Oxides of nitrogen reduced by heated copper gauze. N₂ collected over KOH (absorbs CO₂) and measured by volume.
          </li>
          <li>
            <strong>Kjeldahl&apos;s Method:</strong> Compound boiled with conc. H₂SO₄ &rarr; (NH₄)₂SO₄. Heated with excess NaOH &rarr; NH₃ gas. NH₃ absorbed in standard H₂SO₄ and back-titrated.
            <div className="my-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800"><strong>Limitation:</strong> Not applicable for compounds with nitro groups, azo groups, or ring nitrogen (e.g., pyridine), as they don&apos;t convert to (NH₄)₂SO₄.</p>
            </div>
          </li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Estimation of Halogens and Sulphur (Carius Method)</h3>
        <ul className="list-disc pl-5 space-y-4 mb-6">
          <li>
            <strong>Halogens:</strong> Heated with fuming HNO₃ + AgNO₃ in a sealed Carius tube. Halogen &rarr; AgX precipitate (filtered, dried, weighed).
          </li>
          <li>
            <strong>Sulphur:</strong> Heated with fuming HNO₃ or Na₂O₂. S &rarr; H₂SO₄ &rarr; add BaCl₂ &rarr; <strong>BaSO₄ precipitate</strong> (weighed).
          </li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">🪙 The Coin Sorter Analogy</h4>
          <p className="text-sm">
            Imagine a sealed piggy bank (the compound) filled with dimes (Carbon) and pennies (Hydrogen). You break it open (combust with CuO), and the contents flow down a chute. The first slot catches only pennies (CaCl₂ traps H₂O), the second catches dimes (KOH traps CO₂). Weighing each slot gives you the exact percentage.
          </p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🛢️ Petrochemical Engineering</h4>
          <p className="text-sm">
            Petroleum engineers determine the exact C:H ratio of crude oil. A higher hydrogen-to-carbon ratio means cleaner burning fuel and higher-grade gasoline. Automated CHN analyzers are based on these combustion principles.
          </p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4">
          <h4 className="font-bold text-emerald-900 mb-2">🌾 Food &amp; Agriculture (Kjeldahl Method)</h4>
          <p className="text-sm">
            The Kjeldahl method is the global standard for determining protein content in food, grains, and fertilizers. Since proteins contain a specific percentage of nitrogen, finding %N directly reveals nutritional protein value.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'ethane-conformations') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Conformations of Ethane — Torsional Strain &amp; Newman Projections</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The C–C single bond (&sigma; bond) in ethane allows <strong>almost free rotation</strong>. The different spatial arrangements produced by this rotation are called <strong>conformations</strong> (or conformers/rotamers).
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Why Rotation is &ldquo;Almost&rdquo; Free</h3>
        <p>
          Although the &sigma; bond is cylindrically symmetric, rotation is not perfectly free. The electron clouds of C–H bonds on adjacent carbons <strong>repel each other</strong>. This repulsive interaction is called <strong>torsional strain</strong>.
        </p>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-800">The energy barrier for ethane is only <strong>12.5 kJ/mol</strong> — small enough that room-temperature kinetic energy easily overcomes it. Individual conformers cannot be isolated.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Extreme Conformations</h3>
        <ul className="list-disc pl-5 space-y-4 mb-6">
          <li>
            <strong>Staggered (60&deg;, 180&deg;, 300&deg;):</strong> H atoms are as far apart as possible. <em>Minimum</em> torsional strain, <em>maximum</em> stability, <em>lowest</em> potential energy.
          </li>
          <li>
            <strong>Eclipsed (0&deg;, 120&deg;, 240&deg;):</strong> H atoms are directly behind each other. <em>Maximum</em> torsional strain (12.5 kJ/mol), <em>minimum</em> stability, <em>highest</em> potential energy.
          </li>
          <li>
            <strong>Skew:</strong> Any intermediate angle — partially staggered, with intermediate energy.
          </li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Newman Projection</h3>
        <p>
          View the molecule <strong>head-on</strong>, looking directly down the C–C axis. The front carbon is a <strong>dot</strong>; the rear carbon is a <strong>circle</strong>. Bonds radiate outward at 120&deg; angles.
        </p>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Key insight:</strong> In the staggered Newman projection, rear bonds bisect the angles between front bonds. In eclipsed, they align exactly behind front bonds.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Sawhorse Projection</h3>
        <p>
          The molecule is viewed from a tilted angle. The C–C bond is drawn diagonally with the front carbon at the lower end and the rear carbon at the upper end.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Energy Diagram</h3>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">E = (12.5/2) &times; (1 &minus; cos 3&theta;)</p>
          <p className="text-sm text-slate-600 mt-2 text-center">A perfect sinusoidal curve with 3 maxima (eclipsed) and 3 minima (staggered) per 360&deg; rotation.</p>
        </div>
        <p className="text-sm text-slate-600 italic">
          Note: Throughout all rotations, bond lengths (C–C = 1.54 &Aring;, C–H = 1.09 &Aring;) and bond angles (109.5&deg;) remain <strong>fixed</strong>. Only the dihedral (torsional) angle changes.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Real-World Analogies</h3>
        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">☂️ Two Umbrellas on a Pole</h4>
          <p className="text-sm">
            Imagine two open umbrellas stacked on a single pole. If the spokes align perfectly (eclipsed), they crowd each other. Rotate one by 60&deg; so spokes fit in gaps (staggered), and they have maximum breathing room.
          </p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">⚙️ Gears Face-to-Face</h4>
          <p className="text-sm">
            Two gears placed face-to-face: if teeth align (eclipsed), they clash (high strain). If teeth align with gaps (staggered), they nestle comfortably (low strain).
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-500 my-4">
          <h4 className="font-bold text-purple-900 mb-2">💊 Drug-Receptor Binding</h4>
          <p className="text-sm">
            A drug molecule must adopt a specific low-energy conformation to dock into the active site of a target protein. Understanding conformational preferences is crucial for rational drug design.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'stereoisomerism-geometrical') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Geometrical Isomerism &mdash; Cis-Trans Configuration &amp; Dipole Moments</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Stereoisomers have the <strong>same connectivity</strong> of atoms but differ in their <strong>3D spatial arrangement</strong>. Geometrical isomerism arises when rotation around a C=C double bond is <strong>restricted</strong>.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Why is Rotation Restricted?</h3>
        <p>
          A C=C double bond consists of one <strong>&sigma; bond</strong> (head-on overlap) and one <strong>&pi; bond</strong> (lateral overlap of parallel p-orbitals). Rotating one carbon would break the parallel alignment of the p-orbitals, <em>destroying the &pi; bond</em>. Therefore, rotation is <strong>strictly forbidden</strong>.
        </p>
        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-800"><strong>Key Rule:</strong> Free rotation is possible around C&ndash;C single bonds (alkanes), but NOT around C=C double bonds (alkenes). This restriction creates permanent geometric isomers.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Cis and Trans Isomers</h3>
        <ul className="list-disc pl-5 space-y-4 mb-6">
          <li><strong>Cis:</strong> Identical groups on the <em>same side</em> of the double bond.</li>
          <li><strong>Trans:</strong> Identical groups on <em>opposite sides</em> of the double bond.</li>
        </ul>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Condition:</strong> Geometrical isomerism requires that each doubly bonded carbon has <strong>two different substituents</strong>. If either carbon has two identical groups, no cis/trans isomers exist.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Dipole Moment &amp; Physical Properties</h3>
        <div className="my-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
          <p className="font-mono text-lg text-emerald-700 text-center"><strong>Cis:</strong> Bond dipoles ADD UP &rarr; &mu; &gt; 0 (Polar)</p>
          <p className="text-sm text-emerald-600 text-center">Higher boiling point due to stronger dipole-dipole interactions</p>
        </div>
        <div className="my-6 p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
          <p className="font-mono text-lg text-amber-700 text-center"><strong>Trans:</strong> Bond dipoles CANCEL &rarr; &mu; = 0 (Non-polar)</p>
          <p className="text-sm text-amber-600 text-center">Higher melting point due to symmetrical crystal packing</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Analogies</h3>
        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">📌 Cardboard &amp; Nails</h4>
          <p className="text-sm">One nail (single bond) = free rotation. Two nails (double bond) = locked. Whatever is attached is permanently fixed in position.</p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border-l-4 border-sky-500 my-4">
          <h4 className="font-bold text-sky-900 mb-2">🚣 Rowboat Oars</h4>
          <p className="text-sm">Both oars on the same side = cis. One oar left, one right = trans. The boat behaves completely differently in each configuration.</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border-l-4 border-red-500 my-4">
          <h4 className="font-bold text-red-900 mb-2">🍳 Trans Fats &amp; Health</h4>
          <p className="text-sm">Natural fats are <strong>cis</strong> (bent chains, liquid oils). Artificial hydrogenation creates <strong>trans</strong> fats (straight chains, solid margarine). Our bodies cannot process the unnatural trans geometry, leading to cardiovascular disease.</p>
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
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
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

        <div className="bg-rose-50 p-6 rounded-xl border-l-4 border-rose-500 my-6" id="tour-real-world">
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


  if (topic?.id === 'wave-motion') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Wave Motion: Transverse and Longitudinal</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          A wave is a pattern of disturbance that moves through a medium without the actual physical transfer or flow of matter as a whole. It acts as a carrier of energy and information from one point to another.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Nature of Waves</h3>
        <p>
          Wave motion is intimately connected to harmonic oscillations. While oscillations involve a single object moving to and fro, a wave describes what happens in a system of such objects coupled together by elastic forces.
          In a wave, it is the <strong>disturbance</strong> that travels, not the particles of the medium themselves.
        </p>

        <div className="my-6 p-5 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-bold text-blue-800 mb-2 underline">Key Differential:</p>
          <ul className="text-sm space-y-2 list-disc ml-5 text-slate-700 font-medium">
             <li><strong>Particle Motion:</strong> Localized oscillation about equilibrium.</li>
             <li><strong>Wave Motion:</strong> Continuous progression through space.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Categorization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-brand-primary">
            <h4 className="font-bold text-brand-primary">Transverse Waves</h4>
            <p className="text-xs text-slate-500 mt-2">
              Particles move <strong>perpendicular</strong> to the direction of wave propagation.
              <br /><br />
              <em>Examples:</em> Waves on a plucked string, light waves (EM), sea waves.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-indigo-600">
            <h4 className="font-bold text-indigo-600">Longitudinal Waves</h4>
            <p className="text-xs text-slate-500 mt-2">
              Particles move <strong>parallel</strong> to the direction of wave propagation, creating regions of compression and rarefaction.
              <br /><br />
              <em>Examples:</em> Sound waves in air, P-waves in earthquakes, compression in a slinky.
            </p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Mathematical Description</h3>
        <p className="text-sm">
          A harmonic wave traveling in the +x direction is described by the displacement relation:
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300 text-center">
          <p className="font-mono text-xl text-brand-primary">y(x, t) = A sin(kx - ωt + φ)</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono">
            <span>A: Amplitude</span>
            <span>k: Wave number (2π/λ)</span>
            <span>ω: Angular frequency (2πv)</span>
            <span>φ: Phase constant</span>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Wave Speed</h3>
        <p className="text-sm">
          The speed (v) of a wave depends on the interaction between two medium properties: <strong>Elasticity</strong> (restoring force) and <strong>Inertia</strong> (mass).
        </p>
        <div className="bg-amber-50 p-6 rounded-xl border-l-4 border-amber-500 my-4">
          <h4 className="font-bold text-amber-900 mb-2">弦 (String) Wave Speed</h4>
          <p className="text-sm">
            For a transverse wave on a string under tension (T) and linear mass density (μ):
            <br />
            <strong className="text-lg">v = √(T/μ)</strong>
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Insight</h3>
        <div className="bg-emerald-50 p-6 rounded-xl border-l-4 border-emerald-500 my-4 font-medium">
          <h4 className="font-bold text-emerald-900 mb-2">Why can't sound travel in space?</h4>
          <p className="text-sm">
             Mechanical waves like sound require a medium to provide the elastic restoring force. In the vacuum of space, there are no particles to compress or displace, so the 'disturbance' cannot propagate. In contrast, Light is an Electromagnetic wave and carries its own fields, needing no medium!
          </p>
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
