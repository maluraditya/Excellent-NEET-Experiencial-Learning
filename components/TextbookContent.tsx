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
          <strong>Stress (Ïƒ)</strong> = Restoring Force / Area (F/A)
          <br />
          <strong>Strain (Îµ)</strong> = Change in Dimension / Original Dimension (Î”L/L)
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">Hooke's Law: Ïƒ = Y Ã— Îµ</p>
          <p className="text-sm text-slate-600 mt-2 text-center">For small deformations, stress is directly proportional to strain. Y is Young's Modulus.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Stress-Strain Curve</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Proportional Limit (A):</strong> Hooke's Law is valid. Linear region.</li>
          <li><strong>Yield Point (B):</strong> Max stress for elastic recovery. Beyond this, permanent set occurs.</li>
          <li><strong>Ultimate Tensile Strength (D):</strong> Max stress the material can withstand.</li>
          <li><strong>Fracture Point (E):</strong> Material breaks.</li>
        </ul>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-6" id="tour-real-world">
          <h4 className="font-bold text-amber-900 mb-2">ðŸ—ï¸ Real-World Analogy: Cranes & Mountains</h4>
          <p className="text-sm">
            <strong>Cranes:</strong> Use steel ropes because steel has a high Yield Strength. If the load exceeds this limit, the rope stretches permanently and becomes unsafe.
            <br /><br />
            <strong>Mountains:</strong> Why aren't mountains higher than 10km? Because the sheer weight of the rock would exceed its elastic limit at the base, causing it to flow and sink!
          </p>
        </div>

        {/* MERGED */}







        <h3 className="text-2xl font-display font-bold text-brand-primary mt-12 mb-6 border-t border-slate-200 pt-8">Young's Modulus</h3>
        <p className="lead text-xl text-slate-600 mb-8">
          Young's Modulus (Y) is the ratio of tensile stress to longitudinal strain within the elastic limit. It quantifies a material's <strong>stiffness</strong> â€” its resistance to being stretched or compressed.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Concept Foundation â€” Hooke's Law</h3>
        <p>
          Robert Hooke observed that for small deformations, the <strong>stress developed in a body is directly proportional to the strain produced</strong>. Young's Modulus is the proportionality constant specifically for materials undergoing changes in length.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">Hooke's Law: Ïƒ = Y Ã— Îµ</p>
          <p className="text-sm text-slate-600 mt-2 text-center">Valid only in the linear (elastic) region of the stress-strain curve.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Formulas</h3>
        <div className="my-6 p-5 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
          <p className="font-mono text-lg text-brand-primary text-center">Tensile Stress (Ïƒ) = F / A</p>
          <p className="font-mono text-lg text-brand-primary text-center">Longitudinal Strain (Îµ) = Î”L / L</p>
          <div className="border-t border-blue-200 pt-3">
            <p className="font-mono text-xl text-brand-primary text-center font-bold">Y = Ïƒ / Îµ = (F Ã— L) / (A Ã— Î”L)</p>
          </div>
          <ul className="list-disc ml-6 mt-3 text-sm text-slate-700">
            <li><strong>F:</strong> Applied force (N)</li>
            <li><strong>A:</strong> Cross-sectional area = Ï€rÂ² (mÂ²)</li>
            <li><strong>L:</strong> Original length (m)</li>
            <li><strong>Î”L:</strong> Elongation or compression (m)</li>
          </ul>
          <p className="text-sm text-slate-600 mt-2 text-center">
            <strong>SI Unit:</strong> Nmâ»Â² or Pascal (Pa) â€” since strain is dimensionless.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Graph Explanation</h3>
        <p>
          On a stress-strain curve, the region from the origin (O) to the proportional limit (A) is a <strong>straight line</strong> where Hooke's Law is obeyed. The <strong>slope</strong> of this linear portion represents the Young's Modulus of the material.
        </p>
        <p className="mt-2">
          A steeper slope means a higher Young's Modulus â€” the material is <em>stiffer</em> and resists deformation more effectively. Beyond the yield point, the material undergoes permanent plastic deformation, and Y is no longer applicable.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Molecular Level Understanding</h3>
        <p>
          When a wire is stretched, work is done against internal <strong>inter-atomic forces</strong>. This work is stored as elastic potential energy within the molecular lattice. The tighter the coupling between atoms, the higher the Young's Modulus.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. NCERT Table 8.1 â€” Young's Modulus Values</h3>
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Material</th>
              <th className="text-center">Y (10â¹ Pa)</th>
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

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸ”© Steel vs. Rubber â€” Who's More Elastic?</h4>
          <p className="text-sm">
            In daily language, rubber seems "more elastic." But in physics, <strong>Steel is far more elastic</strong> (Y = 200 GPa vs. ~0.01 GPa for rubber). Why? A steel wire resists stretching far more effectively â€” it requires a significantly larger force to produce a small change in length. That resistance is what physics calls "elasticity."
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸ—ï¸ Engineering: Bridge Design</h4>
          <p className="text-sm">
            Bridges use steel beams because of their high Young's Modulus. The sagging (Î´) of a beam under a load is <strong>inversely proportional to Y</strong>. A high Y ensures the bridge remains stiff and safe under heavy traffic loads.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸ¦´ Nature: Human Thighbone (Femur)</h4>
          <p className="text-sm">
            The femur has Y = 9.4 Ã— 10â¹ Pa. This allows it to support the weight of the upper body with a compression of only about <strong>0.0091%</strong>, maintaining skeletal integrity under heavy loads.
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm my-4">
          <h4 className="font-bold text-purple-900 mb-2">ðŸ—ï¸ Industrial: Crane Ropes</h4>
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
              <span className="text-slate-500">â†’ Observe: Î”L â‰ˆ 1.59 mm. Stress is 318 MPa.</span>
            </li>
            <li>
              <strong>Step 2:</strong> Keep Force constant, change material to "Copper."<br />
              <span className="text-slate-500">â†’ The rod stretches significantly more! Copper has Y = 110 GPa vs. Steel's 200 GPa.</span>
            </li>
            <li>
              <strong>Step 3:</strong> Double the Radius to 20 mm (keeping Copper).<br />
              <span className="text-slate-500">â†’ Î”L drops to one-fourth! Area = Ï€rÂ² means doubling r quadruples A.</span>
            </li>
          </ol>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-3">
            <p className="text-sm text-blue-800 text-center">
              <strong>Learning Outcome:</strong> Î”L is <em>directly proportional</em> to Force and Length, but <em>inversely proportional</em> to Area and Young's Modulus.
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
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Stokesâ€™ Law and Terminal Velocity</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When an object falls through a fluid, it doesn't accelerate forever. It reaches a maximum constant speed called
          <strong> terminal velocity</strong>. Stokes' Law explains the invisible frictional force from the fluid that makes this happen.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Viscosity & Stokes' Law</h3>
        <p>
          When a body moves through a fluid, it drags the layers of fluid in contact with it. This creates relative motion between different layers of the fluid, resulting in an internal frictional force known as <strong>viscosity</strong>.
        </p>
        <p>
          In 1851, George Gabriel Stokes stated that the viscous drag force (F) on a spherical body of radius <em>a</em> moving with velocity <em>v</em> through a fluid of viscosity <em>Î·</em> is:
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">F = 6Ï€Î·av</p>
          <p className="text-sm text-slate-600 mt-2 text-center">This is known as <strong>Stokesâ€™ Law</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Forces in Play</h3>
        <p>
          Consider a small sphere dropped into a tall column of a viscous liquid. Three forces act on it:
        </p>
        <div className="grid gap-4 my-6">
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 shadow-sm ">
            <p className="text-sm font-bold text-red-700">1. Gravity (W = mg)</p>
            <p className="text-sm text-red-600 mt-1">Acting vertically downwards, trying to accelerate the sphere.</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-100 shadow-sm ">
            <p className="text-sm font-bold text-green-700">2. Buoyant Force (Fâ™­)</p>
            <p className="text-sm text-green-600 mt-1">Acting upwards, equal to the weight of the liquid displaced by the sphere.</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm ">
            <p className="text-sm font-bold text-blue-700">3. Viscous Drag (F_d)</p>
            <p className="text-sm text-blue-600 mt-1">Acting upwards (opposing motion). Crucially, this force <strong>increases</strong> as the sphere speeds up.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Reaching Terminal Velocity</h3>
        <p>
          Initially, the sphere accelerates. As its speed increases, the upward viscous drag also increases (since F âˆ v).
          Eventually, the sum of upward forces (buoyancy + drag) exactly equals the downward weight.
        </p>
        <p className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center font-bold text-amber-800 italic">
          Net Force = 0 â†’ Acceleration = 0 â†’ Constant Velocity
        </p>
        <p>
          This maximum constant velocity is called <strong>terminal velocity (vâ‚œ)</strong>.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. The Formula</h3>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-600 text-center mb-3">At equilibrium: W = Fâ™­ + 6Ï€Î·avâ‚œ</p>
          <p className="font-mono text-2xl text-brand-primary text-center">vâ‚œ = 2aÂ²(Ï - Ïƒ)g / 9Î·</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500 font-mono">
            <span>a: Radius of sphere</span>
            <span>Î·: Viscosity coefficient</span>
            <span>Ï: Density of sphere</span>
            <span>Ïƒ: Density of fluid</span>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="grid gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-brand-primary">ðŸŒ§ï¸ Raindrops</p>
            <p className="text-sm text-slate-600 mt-1">
              Without air viscosity, raindrops falling from 1km high would hit you at 500 km/h! Because of Stokes' Law,
              they reach a safe terminal velocity (~20-30 km/h) before hitting the ground.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-brand-primary">ðŸŒ¬ï¸ Dust & Mist</p>
            <p className="text-sm text-slate-600 mt-1">
              Very fine particles have a tiny radius (a). Since vâ‚œ âˆ aÂ², they reach terminal velocity almost immediately
              at extremely slow speeds, which is why dust appears to "float" in a room.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-brand-primary">ðŸ§ª Falling Ball Viscometer</p>
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
              <span className="text-slate-500">â†’ Observation: The ball slows down almost immediately. The blue "Drag" arrow reaches equilibrium with weight/buoyancy much faster.</span>
            </li>
            <li>
              <strong>Step 3:</strong> Increase the "Radius" slider while in Glycerin.<br />
              <span className="text-slate-500">â†’ Observation: Even in thick liquid, larger balls fall significantly faster because vâ‚œ depends on the square of the radius (aÂ²).</span>
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
          <p className="font-mono text-xl text-brand-primary text-center">Equation of Continuity: A Ã— v = constant</p>
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
          <p className="font-mono text-lg text-brand-primary text-center">P + Â½ÏvÂ² + Ïgh = constant</p>
          <ul className="list-disc ml-6 mt-4 text-sm text-slate-700">
            <li><strong>P:</strong> Pressure energy per unit volume</li>
            <li><strong>Â½ÏvÂ²:</strong> Kinetic energy per unit volume</li>
            <li><strong>Ïgh:</strong> Potential energy per unit volume</li>
          </ul>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-6">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸŒ¬ï¸ Real-World Application: The Airplane Wing</h4>
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
          <p className="font-mono text-xl text-brand-primary text-center">Pâ‚ = Pâ‚‚  =&gt;  Fâ‚/Aâ‚ = Fâ‚‚/Aâ‚‚</p>
          <ul className="list-disc ml-6 mt-4 text-sm text-slate-700">
            <li><strong>Fâ‚ / Aâ‚:</strong> Input Force and Area (Master Cylinder)</li>
            <li><strong>Fâ‚‚ / Aâ‚‚:</strong> Output Force and Area (Wheel Cylinder)</li>
          </ul>
        </div>
        <p>
          Because liquids are nearly incompressible, the volume pushed down on one side must equal the volume pushed up on the other. This means a small force pushing a small area a <em>long</em> distance can create a massive force pushing a large area a <em>short</em> distance.
        </p>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-6">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸš— Real-World Application: Hydraulic Brakes</h4>
          <p className="text-sm">
            When you press the brake pedal in a car, you push a small piston connected to the master cylinder. The pressure is transmitted instantly through the brake fluid to a much larger wheel cylinder.
            Because the wheel cylinder has a larger area, it multiplies your initial foot force by up to 10 or 20 times, providing enough power to clamp the brake pads against the spinning disc and stop a heavily moving vehicle!
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'surface-tension') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Surface Tension and Capillarity</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Surface tension is the property of a liquid surface by which it behaves like a <strong>stretched elastic membrane</strong>. It explains why some insects can walk on water and why raindrops are spherical.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Why it Exists (Molecular Foundation)</h3>
        <p>
          A liquid stays together because of attractive forces between molecules.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Inside the Liquid:</strong> A molecule is attracted by neighbors from all sides equally, resulting in a net force of zero.</li>
          <li><strong>At the Surface:</strong> A molecule is only surrounded by liquid molecules on its lower side. This creates a <strong>net inward attraction</strong> toward the bulk.</li>
        </ul>
        <p className="mt-4">
          Because surface molecules have fewer neighbors, they possess higher potential energy. To reach the lowest energy state, a liquid always tends to <strong>minimize its surface area</strong>.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Formulas</h3>
        <div className="my-6 p-5 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
          <p className="font-mono text-lg text-brand-primary text-center">Surface Tension (S) = F / l (or Work / Î”Area)</p>
          <p className="text-sm text-slate-600 text-center">SI Units: N mâ»Â¹ or J mâ»Â²</p>
          <div className="border-t border-blue-200 pt-3">
            <p className="font-bold text-brand-dark text-center mb-2">Excess Pressure (Î”P):</p>
            <p className="font-mono text-lg text-brand-primary text-center">Liquid Drop (1 interface): Páµ¢ âˆ’ Pâ‚’ = 2S / r</p>
            <p className="font-mono text-lg text-brand-primary text-center">Soap Bubble (2 interfaces): Páµ¢ âˆ’ Pâ‚’ = 4S / r</p>
          </div>
          <div className="border-t border-blue-200 pt-3">
            <p className="font-bold text-brand-dark text-center mb-2">Capillary Rise (h):</p>
            <p className="font-mono text-xl text-brand-primary text-center font-bold">h = (2S cos Î¸) / (a Ï g)</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Angle of Contact (Î¸)</h3>
        <p>
          This is the angle between the tangent to the liquid surface and the solid surface at the point of contact, measured <em>inside</em> the liquid.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-brand-primary">Acute (Î¸ &lt; 90Â°)</p>
            <p className="text-sm">Liquid is strongly attracted to the solid (e.g., Water on Glass). The liquid <strong>"wets"</strong> the surface and rises in a tube.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-brand-primary">Obtuse (Î¸ &gt; 90Â°)</p>
            <p className="text-sm">Molecules attracted more to each other than to the solid (e.g., Mercury on Glass). It <strong>"does not wet"</strong> and falls in a tube.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Applications</h3>
        <div className="grid gap-4">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
            <h4 className="font-bold text-amber-900 mb-2">Washing (Wetting Agents)</h4>
            <p className="text-sm">Detergents reduce water's surface tension and angle of contact. This allows water to penetrate deep into fabric pores to remove dirt more effectively.</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm">
            <h4 className="font-bold text-emerald-900 mb-2">Waterproofing</h4>
            <p className="text-sm">Waterproofing agents create a large (obtuse) angle of contact between water and fabric fibers, causing rain to bead up and roll off rather than soaking in.</p>
          </div>
          <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 shadow-sm">
            <h4 className="font-bold text-sky-900 mb-2">Nature's Spheres</h4>
            <p className="text-sm">Small water droplets and bubbles are spherical because the sphere is the shape with the minimum surface area for a given volume â€” representing the lowest energy state.</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 shadow-sm">
            <h4 className="font-bold text-purple-900 mb-2">Paint Brushes</h4>
            <p className="text-sm">Dry brush hairs stay apart. When taken out of water, the surface film of water tries to minimize its area, pulling the hairs together into a fine tip for precision painting.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Simulation Guide</h3>
        <div className="my-6 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <p className="text-sm font-bold text-brand-primary">Step-by-Step Discovery:</p>
          <ol className="list-decimal pl-6 space-y-3 text-sm text-slate-700">
            <li><strong>Step 1:</strong> Select <strong>Water</strong>. Look at the "Molecular Microscope" to see surface molecules being pulled inward.</li>
            <li><strong>Step 2:</strong> Observe the 3 tubes. Water rises highest in the <strong>thinnest tube</strong> (h âˆ 1/a).</li>
            <li><strong>Step 3:</strong> Switch to <strong>Mercury</strong>. Notice the level drops below the outside surface because the angle of contact is obtuse.</li>
            <li><strong>Step 4:</strong> Click <strong>"Add Detergent"</strong> while using water. Watch the rise height drop as surface tension is reduced.</li>
          </ol>
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
          The Carnot Engine is a theoretical, perfectly reversible heat engine that operates between a hot reservoir (Tâ‚) and a cold reservoir (Tâ‚‚), defining the absolute maximum efficiency any heat engine can achieve.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Four Steps of the Carnot Cycle</h3>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Isothermal Expansion (1â†’2):</strong> Gas absorbs heat Qâ‚ from the hot source at Tâ‚. Temperature stays constant, gas expands.</li>
          <li><strong>Adiabatic Expansion (2â†’3):</strong> Gas is insulated. It continues expanding, using its own internal energy. Temperature drops from Tâ‚ to Tâ‚‚.</li>
          <li><strong>Isothermal Compression (3â†’4):</strong> Gas rejects heat Qâ‚‚ to the cold sink at Tâ‚‚. Temperature stays constant, gas is compressed.</li>
          <li><strong>Adiabatic Compression (4â†’1):</strong> Gas is insulated again. It is compressed back to its original state. Temperature rises from Tâ‚‚ back to Tâ‚.</li>
        </ol>

        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-lg text-brand-primary text-center">Î· = 1 âˆ’ Tâ‚‚/Tâ‚</p>
          <p className="text-sm text-slate-600 mt-3 text-center">
            The efficiency depends <strong>only</strong> on the temperatures of the two reservoirs, completely independent of the working substance.
          </p>
        </div>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-6">
          <h4 className="font-bold text-amber-900 mb-2">ðŸ­ Real-World Application: Steam Power Plants</h4>
          <p className="text-sm">
            Modern thermal power plants heat water in a boiler (Hot Reservoir, Tâ‚ â‰ˆ 600K) and cool steam in a condenser (Cold Reservoir, Tâ‚‚ â‰ˆ 300K). The Carnot limit says their efficiency can never exceed 1 âˆ’ 300/600 = <strong>50%</strong>. In practice, due to irreversibilities, real efficiencies are significantly lower.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-6">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸ§Š Carnot Refrigerator</h4>
          <p className="text-sm">
            A Carnot cycle run in reverse is a <strong>Carnot refrigerator</strong>. It takes heat Qâ‚‚ from a cold space, requires input work W, and exhausts Qâ‚ = Qâ‚‚ + W to a warm environment. This sets the theoretical maximum for the Coefficient of Performance (COP) of all cooling devices.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'zeroth-law') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Zeroth Law of Thermodynamics</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The Zeroth Law states: <strong>"Two systems in thermal equilibrium with a third system separately are in thermal equilibrium with each other."</strong> This simple principle is the foundation of temperature measurement.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Thermal Equilibrium and Walls</h3>
        <p>
          To understand this law, we must first understand how systems interact through boundaries:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-300">
            <p className="font-bold text-slate-800 mb-2">Adiabatic Wall (Insulating)</p>
            <p className="text-sm text-slate-600">A thick insulating wall that does <strong>NOT</strong> allow heat to flow between systems. Example: Thermos flask walls.</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="font-bold text-amber-800 mb-2">Diathermic Wall (Conducting)</p>
            <p className="text-sm text-slate-600">A thin conducting wall that <strong>ALLOWS</strong> heat to flow until both systems reach the same temperature.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. What is Thermal Equilibrium?</h3>
        <p>
          In mechanics, equilibrium means net force is zero. In thermodynamics, <strong>Thermal Equilibrium</strong> is reached when two systems in contact through a diathermic wall stop exchanging heat. Their macroscopic variables (Pressure P, Volume V) stop changing.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Step-by-Step Logic of the Zeroth Law</h3>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Stage 1:</strong> Two systems A and B are separated by an adiabatic wall. They cannot exchange heat and are independent.</li>
          <li><strong>Stage 2:</strong> Both A and B are connected to a third system C via diathermic walls.</li>
          <li><strong>Stage 3:</strong> Heat flows until A reaches equilibrium with C, and B reaches equilibrium with C.</li>
          <li><strong>Stage 4:</strong> Now replace the adiabatic wall between A and B with a diathermic wall.</li>
          <li><strong>Observation:</strong> No heat flows between A and B! They are already in thermal equilibrium.</li>
        </ol>

        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-lg text-brand-primary text-center">If T<sub>A</sub> = T<sub>C</sub> and T<sub>B</sub> = T<sub>C</sub>, then T<sub>A</sub> = T<sub>B</sub></p>
          <p className="text-sm text-slate-600 mt-3 text-center">
            Temperature (T) is the thermodynamic variable that is equal for all systems in thermal equilibrium.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Applications</h3>
        <div className="grid gap-4">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
            <h4 className="font-bold text-amber-900 mb-2">Daily Life: The Hot Tea</h4>
            <p className="text-sm">Leave a cup of hot tea in a room. Heat flows from the tea to the environment until both reach the same temperature â€” thermal equilibrium.</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm">
            <h4 className="font-bold text-emerald-900 mb-2">Engineering: The Thermometer</h4>
            <p className="text-sm">When a thermometer (System C) touches a human body (System A), it reaches thermal equilibrium. The thermometer reading tells us the body temperature â€” this works because of the Zeroth Law.</p>
          </div>
          <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 shadow-sm">
            <h4 className="font-bold text-sky-900 mb-2">Nature: Lake and Air</h4>
            <p className="text-sm">A lake and the air above it tend toward thermal equilibrium. If air stays at 25Â°C for a long time, the surface water eventually reaches the same temperature.</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 shadow-sm">
            <h4 className="font-bold text-purple-900 mb-2">Industrial: Thermacole Icebox</h4>
            <p className="text-sm">We prevent thermal equilibrium between ice (inside) and hot air (outside) using an adiabatic (insulating) wall â€” keeping food cold.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Simulation Guide</h3>
        <div className="my-6 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <p className="text-sm font-bold text-brand-primary">Step-by-Step Discovery:</p>
          <ol className="list-decimal pl-6 space-y-3 text-sm text-slate-700">
            <li><strong>Step 1:</strong> Set Chamber A to high temperature and B to low temperature using the sliders.</li>
            <li><strong>Step 2:</strong> Connect A-C and B-C with diathermic walls. Watch molecules exchange energy.</li>
            <li><strong>Step 3:</strong> Observe T<sub>A</sub>, T<sub>B</sub>, and T<sub>C</sub> equalize.</li>
            <li><strong>Step 4:</strong> Now connect A-B directly with a diathermic wall. Notice no further change!</li>
          </ol>
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
          <p className="font-mono text-lg text-brand-primary text-center">Î”Q = Î”U + Î”W</p>
          <p className="text-sm text-slate-600 mt-3 text-center">
            Heat (Î”Q) = Change in Internal Energy (Î”U) + Work Done by gas (Î”W = PÎ”V)
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Four Special Thermodynamic Processes</h3>
        <ol className="list-decimal pl-6 space-y-4">
          <li><strong>Isothermal (T = const):</strong> Temperature doesn't change â†’ Î”U = 0 â†’ Î”Q = Î”W. All heat converts to work. The P-V curve follows PV = nRT = constant (Boyle's Law).</li>
          <li><strong>Adiabatic (Q = 0):</strong> No heat enters or leaves (insulated) â†’ Î”U = âˆ’Î”W. Expansion cools the gas; compression heats it. Follows PV<sup>Î³</sup> = constant, a steeper curve than isothermal.</li>
          <li><strong>Isochoric (V = const):</strong> Volume doesn't change â†’ Î”W = 0 â†’ Î”Q = Î”U. All heat goes to changing internal energy. The P-V "curve" is a vertical line.</li>
          <li><strong>Isobaric (P = const):</strong> Pressure stays constant. Heat goes partly to work (PÎ”V) and partly to Î”U. The P-V curve is a horizontal line.</li>
        </ol>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-6">
          <h4 className="font-bold text-amber-900 mb-2">â˜ï¸ Nature: Cloud Formation (Adiabatic Cooling)</h4>
          <p className="text-sm">
            Rising warm air expands as atmospheric pressure drops. Since this happens quickly and air is a poor conductor, the process is nearly adiabatic (Î”Q â‰ˆ 0). The expanding air does work on its surroundings, its internal energy drops, and temperature falls until water vapour condenses â€” forming clouds.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-6">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸš— Engineering: Internal Combustion Engine</h4>
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
          <li><strong>Linear Expansion:</strong> The fractional change in length (Î”l/l) is proportional to the change in temperature (Î”T): Î”l = Î±<sub>l</sub> l Î”T, where Î±<sub>l</sub> is the coefficient of linear expansion.</li>
          <li><strong>Area Expansion:</strong> The change in area (Î”A) is related to temperature change by Î”A = 2Î±<sub>l</sub> A Î”T.</li>
          <li><strong>Volume Expansion:</strong> The fractional change in volume (Î”V/V) is Î”V = Î±<sub>v</sub> V Î”T. For solids, Î±<sub>v</sub> = 3Î±<sub>l</sub>.</li>
          <li><strong>Anomalous Expansion of Water:</strong> Water contracts on heating between 0 Â°C and 4 Â°C. It reaches its maximum density at 4 Â°C.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Specific Heat Capacity (s)</h3>
        <p>Every substance has a unique value for the amount of heat absorbed or rejected to change the temperature of unit mass by one unit. The formula is s = (1/m)(Î”Q/Î”T). Its SI unit is J kgâ»Â¹ Kâ»Â¹. Water has the highest specific heat capacity among common substances, making it an excellent coolant.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Calorimetry and Change of State</h3>
        <p>Calorimetry is the measurement of heat. In an isolated system, heat lost by a hot body equals heat gained by a colder body. Matter changes state (solid to liquid, liquid to gas) when heat is exchanged with surroundings. During these transitions, the temperature remains constant.</p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">Latent Heat (L): Q = mL</p>
          <ul className="list-disc ml-6 mt-4 text-sm text-slate-700">
            <li><strong>Latent Heat of Fusion (L<sub>f</sub>):</strong> Heat needed for solid-to-liquid transition.</li>
            <li><strong>Latent Heat of Vaporisation (L<sub>v</sub>):</strong> Heat needed for liquid-to-gas transition.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Heat Transfer Mechanisms</h3>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Conduction:</strong> Heat transfer between adjacent parts of a body via molecular collisions without bulk motion of matter. The rate of flow H = KA(T_C - T_D)/L, where K is thermal conductivity.</li>
          <li><strong>Convection:</strong> Heat transfer by actual motion of matter, occurring only in fluids. It can be natural (driven by buoyancy/gravity) or forced (driven by a pump).</li>
          <li><strong>Radiation:</strong> Transfer of energy via electromagnetic waves, requiring no medium.
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Stefan-Boltzmann Law:</strong> The energy emitted per unit time is H = ÏƒAeTâ´, where Ïƒ is the Stefan-Boltzmann constant, A is area, e is emissivity, and T is absolute temperature.</li>
              <li><strong>Wien's Displacement Law:</strong> The wavelength (Î»_m) of maximum emission decreases as temperature increases: Î»_m T = constant.</li>
            </ul>
          </li>
        </ol>

        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-lg text-brand-primary text-center">Newtonâ€™s Law of Cooling</p>
          <p className="text-sm text-slate-600 mt-2 text-center">The rate of loss of heat (â€“ dQ/dt) of a body is directly proportional to the difference in temperature between the body and its surroundings (Î”T = Tâ‚‚ â€“ Tâ‚). This holds for small temperature differences.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Analogy and Applications</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm">
            <h4 className="font-bold text-amber-900 mb-2">âš™ï¸ Daily Life (Engineering)</h4>
            <p className="text-sm">Blacksmiths heat an iron ring before fitting it onto the wooden rim of a horse cart. Because the iron ring's diameter is slightly smaller than the rim at room temperature, heating causes it to expand (linear/area expansion), allowing it to slip onto the rim. As it cools, it contracts and grips the wheel tightly.</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm">
            <h4 className="font-bold text-emerald-900 mb-2">â„ï¸ Nature (Environmental)</h4>
            <p className="text-sm">Anomalous expansion of water allows lakes to freeze at the top first. Since water at 4 Â°C is densest, it sinks, while colder water (less than 4 Â°C) stays on top and freezes. This preserves animal and plant life at the bottom of the lake.</p>
          </div>
          <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm">
            <h4 className="font-bold text-sky-900 mb-2">â˜€ï¸ Daily Life (Heat Transfer)</h4>
            <p className="text-sm">We wear white clothes in summer because they reflect radiation, and dark clothes in winter because they absorb heat better. Cooking pot bottoms are often blackened to maximize heat absorption from the fire.</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm">
            <h4 className="font-bold text-purple-900 mb-2">ðŸš— Engineering (Specific Heat)</h4>
            <p className="text-sm">Water is used in automobile radiators as a coolant because its high specific heat allows it to absorb a large amount of heat with a relatively small rise in its own temperature.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Simulation Guide</h3>
        <div className="my-6 p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <p className="text-sm font-bold text-brand-primary">Step-by-Step Discovery in the Virtual Lab:</p>
          <ol className="list-decimal pl-6 space-y-3 text-sm">
            <li><strong>Step 1:</strong> Select the Copper rod. Turn the burner to 100W. Observe the Temperature rise and the rod length increase simultaneously. <em>Logic: Heat addition increases internal kinetic energy and causes expansion.</em></li>
            <li><strong>Step 2:</strong> Switch to the Glass rod. Notice for the same time interval, the expansion is significantly less. <em>Logic: Glass has a much smaller coefficient of linear expansion than Copper.</em></li>
            <li><strong>Step 3:</strong> Select the Ice block. Start heating. Observe that the temperature stays at 0 Â°C for several minutes while the ice visibly turns to water. <em>Logic: Energy is being used for the Latent Heat of Fusion to break molecular bonds, not to increase temperature.</em></li>
            <li><strong>Step 4:</strong> Heat the resulting Water. Observe the temperature rise until 100 Â°C. Notice the graph flatlines again. <em>Logic: Water is reaching its boiling point and absorbing Latent Heat of Vaporisation.</em></li>
          </ol>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-3">
            <p className="text-sm text-blue-800 text-center">
              <strong>Learning Outcome:</strong> Thermal properties are material-specific (different Î±_l, s). Heat causes macroscopic expansion and microscopic vibration. Phase changes require significant energy without temperature change.
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

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">Cooking Utensils</h4>
          <p className="text-sm">
            Copper-bottomed utensils spread heat quickly and uniformly because copper has very high thermal conductivity.
            This improves conduction from the flame to the food.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">Thermos Flask</h4>
          <p className="text-sm">
            A vacuum flask reduces conduction and convection by placing a vacuum between two walls.
            Silvered surfaces reflect thermal radiation, so all three modes of heat transfer are minimized together.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">Sea Breeze</h4>
          <p className="text-sm">
            Land heats faster than water during the day. Air above land warms, expands, and rises, while cooler air from the sea moves in.
            This is a classic natural example of convection.
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm my-4">
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
          Gas pressure is not a static force â€” it is the macroscopic manifestation of billions of microscopic elastic collisions of gas molecules against the container walls.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Derivation Summary</h3>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Elastic collision:</strong> A molecule of mass m hits the wall and rebounds. Momentum transferred to wall = 2mv<sub>x</sub>.</li>
          <li><strong>Number of collisions:</strong> In time Î”t, molecules within distance v<sub>x</sub>Î”t from the wall can reach it. Count = Â½ n A v<sub>x</sub> Î”t.</li>
          <li><strong>Total force:</strong> F = n m A âŸ¨v<sub>x</sub>Â²âŸ©. Since gas is isotropic, âŸ¨v<sub>x</sub>Â²âŸ© = â…“âŸ¨vÂ²âŸ©.</li>
        </ol>

        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-lg text-brand-primary text-center">P = â…“ n m âŸ¨vÂ²âŸ©</p>
          <p className="text-sm text-slate-600 mt-3 text-center">
            n = N/V (number density), m = molecular mass, âŸ¨vÂ²âŸ© = mean square speed
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Kinetic Interpretation of Temperature</h3>
        <p>Comparing PV = â…”E with PV = Nk<sub>B</sub>T gives:</p>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="font-mono text-lg text-emerald-700 text-center">Â½ m âŸ¨vÂ²âŸ© = 3/2 k<sub>B</sub> T</p>
          <p className="text-sm text-slate-600 mt-2 text-center">
            Absolute temperature is simply a measure of the average random kinetic energy of gas molecules.
          </p>
        </div>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-6">
          <h4 className="font-bold text-amber-900 mb-2">ðŸŽˆ Daily Life: Why Balloons Stay Inflated</h4>
          <p className="text-sm">
            Air molecules inside a balloon are in continuous random motion, colliding with the rubber walls. More molecules = more collisions per second = outward push that keeps the balloon inflated.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-6">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸš— Engineering: Tyre Pressure Increase While Driving</h4>
          <p className="text-sm">
            Road friction heats tyres, raising air temperature inside. By Â½mâŸ¨vÂ²âŸ© = 3/2 k<sub>B</sub>T, molecules move faster, hit walls harder, and tyre pressure rises â€” which is why it's recommended to check tyre pressure when cold.
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
          Gas molecules travel at very high speeds (~500 m/s for nitrogen at room temperature) yet a perfume scent takes minutes to cross a room. This paradox is resolved by the mean free path â€” molecules constantly collide with each other, following a chaotic zig-zag path rather than a straight line.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Derivation â€” The Collision Cylinder</h3>
        <p className="text-sm">Consider a single molecule of diameter <strong>d</strong> moving with average speed <strong>âŸ¨vâŸ©</strong>:</p>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>In time Î”t, it sweeps out a <strong>collision cylinder</strong> of volume <strong>Ï€dÂ²âŸ¨vâŸ©Î”t</strong></li>
          <li>Any molecule whose centre lies within this cylinder will be hit</li>
          <li>Number of collisions = <strong>n Â· Ï€dÂ²âŸ¨vâŸ©Î”t</strong>, where n is the number density</li>
          <li>Collision rate = <strong>n Â· Ï€dÂ²âŸ¨vâŸ©</strong></li>
          <li>Accounting for the relative motion of all molecules introduces the factor âˆš2</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Formula</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="font-mono text-xl text-brand-primary">l = 1 / (âˆš2 Â· n Â· Ï€ Â· dÂ²)</p>
          <p className="text-sm text-slate-600 mt-2">where n = N/V (number density, mâ»Â³), d = molecular diameter (m)</p>
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
                <td className="p-3 border border-slate-200">n â†‘</td>
                <td className="p-3 border border-slate-200 font-bold text-red-600">l â†“  (l âˆ 1/n)</td>
                <td className="p-3 border border-slate-200">More targets per unit volume</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-3 border border-slate-200 font-bold text-red-700">Diameter (d)</td>
                <td className="p-3 border border-slate-200">d â†‘</td>
                <td className="p-3 border border-slate-200 font-bold text-red-600">l â†“  (l âˆ 1/dÂ²)</td>
                <td className="p-3 border border-slate-200">Larger cross-section Ï€dÂ²</td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-200 font-bold text-green-700">Temperature (T)</td>
                <td className="p-3 border border-slate-200">T â†‘ (const. P)</td>
                <td className="p-3 border border-slate-200 font-bold text-green-600">l â†‘</td>
                <td className="p-3 border border-slate-200">Gas expands â†’ n decreases</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-500 mt-1">Note: Increasing temperature at <em>constant volume</em> does not change l (n stays constant).</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸ³ Cooking Smells &amp; Perfume</h4>
          <p className="text-sm">
            Despite molecules moving at ~500 m/s, the scent takes several minutes to cross a room. Nitrogen molecules in air collide ~5 billion times per second, making the mean free path just ~70 nm at atmospheric pressure.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸ’¡ Vacuum Tubes &amp; Electronics</h4>
          <p className="text-sm">
            In highly evacuated vacuum tubes, the number density n is so small that the mean free path becomes comparable to the size of the tube itself. Electrons or gas molecules can travel end-to-end without any collision â€” essential for CRT screens and electron microscopes.
          </p>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm my-4">
          <h4 className="font-bold text-slate-900 mb-2">ðŸ­ Industrial Gas Separation</h4>
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
          <li><strong>Monatomic (He, Ar):</strong> Single atom â€” only translational motion in x, y, z. <strong>f = 3</strong>.</li>
          <li><strong>Rigid Diatomic (Oâ‚‚, Nâ‚‚):</strong> 3 translational + 2 rotational axes (perpendicular to bond axis). <strong>f = 5</strong>.</li>
          <li><strong>Vibrating Diatomic (CO at high T):</strong> Atoms oscillate along the bond axis like a spring â€” adds 2 vibrational modes (KE + PE). <strong>f = 7</strong>.</li>
          <li><strong>Polyatomic (CHâ‚„):</strong> 3 translational + 3 rotational + f<sub>vib</sub> vibrational modes. <strong>f = 6 + f<sub>vib</sub></strong>.</li>
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
          <p className="font-mono text-lg text-brand-primary text-center">Each translational &amp; rotational DOF â†’ Â½k<sub>B</sub>T</p>
          <p className="font-mono text-lg text-brand-primary text-center">Each vibrational mode â†’ k<sub>B</sub>T (KE + PE)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Internal Energy &amp; Specific Heat</h3>
        <p className="text-sm mb-4">Using R = k<sub>B</sub>N<sub>A</sub>, for one mole of gas:</p>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="text-left py-2">Gas</th><th>U</th><th>C<sub>v</sub></th><th>C<sub>p</sub></th><th>Î³</th></tr></thead>
          <tbody>
            <tr><td className="py-1"><strong>Monatomic</strong></td><td className="text-center">3/2 RT</td><td className="text-center">3/2 R</td><td className="text-center">5/2 R</td><td className="text-center font-bold">1.67</td></tr>
            <tr><td className="py-1"><strong>Rigid Diatomic</strong></td><td className="text-center">5/2 RT</td><td className="text-center">5/2 R</td><td className="text-center">7/2 R</td><td className="text-center font-bold">1.40</td></tr>
            <tr><td className="py-1"><strong>Vibrating Diatomic</strong></td><td className="text-center">7/2 RT</td><td className="text-center">7/2 R</td><td className="text-center">9/2 R</td><td className="text-center font-bold">1.29</td></tr>
            <tr><td className="py-1"><strong>Polyatomic (f<sub>v</sub> modes)</strong></td><td className="text-center">(3+f<sub>v</sub>)RT</td><td className="text-center">(3+f<sub>v</sub>)R</td><td className="text-center">(4+f<sub>v</sub>)R</td><td className="text-center font-bold">{'<'}1.33</td></tr>
          </tbody>
        </table>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Real-World Analogies</h3>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸ’¼ Corporate Budgeting Analogy</h4>
          <p className="text-sm">
            Imagine a company (the gas) with a fixed budget (thermal energy). Equipartition says the budget must be distributed <em>equally</em> among all departments (DOF). A simple company (monatomic) has 3 departments, so each gets a large slice. A complex company (polyatomic) has many departments â€” the same budget is split thinner. To raise overall activity (temperature) of a complex company by 1 degree, you need much more total money (heat), because every department demands its equal share. This is why C<sub>v</sub> is higher for complex molecules.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸ­ Engine Coolants &amp; Gas Turbines</h4>
          <p className="text-sm">
            Engineers select specific gases for thermodynamic cycles. Diatomic gases like Nâ‚‚ and Oâ‚‚ have C<sub>p</sub> = 7/2 R (higher than monatomic He with 5/2 R) because supplied heat is partitioned into rotational modes. This affects the adiabatic ratio Î³ = C<sub>p</sub>/C<sub>v</sub>, which directly dictates engine efficiency. Monatomic gases (Î³ = 1.67) undergo steeper adiabatic curves than diatomic gases (Î³ = 1.40).
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸŒ Atmospheric Warming</h4>
          <p className="text-sm">
            Our atmosphere&apos;s specific heat is dictated by the diatomic nature of Nâ‚‚ and Oâ‚‚. When sunlight heats the Earth, thermal energy causes air molecules not only to move faster (translation) but also to tumble and spin (rotation). This effectively stores more heat without increasing temperature as drastically as a monatomic atmosphere would â€” a natural temperature buffer for our planet.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'position-velocity-acceleration-graphs') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Position, Velocity and Acceleration Graphs</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          A single motion can be read in three connected ways. Choose an origin and a positive direction first; in this simulation, positions to the right are positive and positions to the left are negative.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Slope Connects the Graphs</h3>
        <div className="my-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center"><strong className="text-blue-800">v = dx/dt</strong><br /><span className="text-sm text-slate-600">Velocity is the slope of the tangent to the x-t graph.</span></div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"><strong className="text-emerald-800">a = dv/dt</strong><br /><span className="text-sm text-slate-600">Acceleration is the slope of the tangent to the v-t graph.</span></div>
        </div>
        <p className="text-sm">A positive slope means a positive velocity or acceleration; a negative slope means a negative value. A horizontal graph has zero slope.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Area Under the Velocity-Time Graph</h3>
        <p>The <strong>signed area</strong> between the v-t curve and the time axis from t<sub>1</sub> to t<sub>2</sub> equals displacement during that interval. Area below the time axis is negative. Distance travelled is not generally the same as displacement when velocity changes sign.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Uniformly Accelerated Motion</h3>
        <div className="my-5 rounded-xl border border-violet-200 bg-violet-50 p-5 text-center font-mono text-base text-violet-900">
          <p>v = v<sub>0</sub> + at</p>
          <p>x = x<sub>0</sub> + v<sub>0</sub>t + ½at²</p>
          <p>v² = v<sub>0</sub>² + 2a(x - x<sub>0</sub>)</p>
        </div>
        <p className="text-sm">These kinematic equations apply to rectilinear motion with <strong>constant acceleration</strong>. Then the x-t graph is a parabola, the v-t graph is a straight inclined line, and the a-t graph is horizontal.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Read Motion Without Guessing</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>Velocity and acceleration with the same sign mean the object speeds up.</li>
          <li>Velocity and acceleration with opposite signs mean the object slows down.</li>
          <li>At v = 0, the object may be momentarily at rest and reverse direction; acceleration need not be zero.</li>
          <li>For uniform motion, x-t is a straight line, v-t is horizontal, and acceleration is zero.</li>
        </ul>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>NCERT graph caution:</strong> Real changes in velocity and acceleration are continuous. Sharp kinks used in idealised graphs imply a non-differentiable instant and are approximations.</div>
        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'centre-of-mass-torque') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Centre of Mass and Torque</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          A system of particles can translate as though all its mass were concentrated at one mass-weighted point. Torque describes how a force changes rotational motion about a chosen origin.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Centre of Mass</h3>
        <p>For two particles on the x-axis, NCERT defines the centre-of-mass coordinate as the mass-weighted mean:</p>
        <div className="my-5 rounded-xl border border-cyan-200 bg-cyan-50 p-5 text-center font-mono text-lg font-bold text-cyan-900">
          X = (m<sub>1</sub>x<sub>1</sub> + m<sub>2</sub>x<sub>2</sub>) / (m<sub>1</sub> + m<sub>2</sub>)
        </div>
        <p className="text-sm">For n particles, X = sum(m<sub>i</sub>x<sub>i</sub>)/M, with analogous expressions for Y and Z and total mass M = sum(m<sub>i</sub>). Equal masses place the centre exactly midway; unequal masses place it nearer the heavier particle.</p>
        <p className="text-sm">In the simulation the origin is chosen at the centre of mass, so x<sub>1</sub> = -d<sub>1</sub> and x<sub>2</sub> = d<sub>2</sub>. The condition m<sub>1</sub>d<sub>1</sub> = m<sub>2</sub>d<sub>2</sub> keeps X = 0 while both particles move internally.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Torque: The Moment of a Force</h3>
        <div className="my-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center"><strong className="font-mono text-amber-900">tau = r x F</strong><br /><span className="text-sm text-slate-600">NCERT Eq. 6.23; direction follows the right-hand screw rule.</span></div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center"><strong className="font-mono text-rose-900">|tau| = rF sin(theta) = r<sub>perp</sub>F</strong><br /><span className="text-sm text-slate-600">NCERT Eqs. 6.24a-b.</span></div>
        </div>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>Torque is a vector; its SI unit is newton metre (N m). It is not work, even though the units have the same dimensions.</li>
          <li>Torque vanishes when r = 0, F = 0, or theta is 0 degrees or 180 degrees.</li>
          <li>For fixed r and F, torque magnitude is greatest at theta = 90 degrees.</li>
          <li>Reversing the force reverses the direction of torque.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Rotation and Equilibrium</h3>
        <p className="text-sm">The time rate of change of angular momentum equals torque: <strong>dl/dt = tau</strong> (NCERT Eq. 6.27), the rotational analogue of F = dp/dt.</p>
        <div className="my-5 rounded-xl border border-violet-200 bg-violet-50 p-5 text-sm text-violet-950">
          <p><strong>Translational equilibrium:</strong> sum F = 0</p>
          <p><strong>Rotational equilibrium:</strong> sum tau = 0</p>
          <p className="mt-2">Mechanical equilibrium requires both conditions, so the body has neither linear nor angular acceleration.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Using the Simulation</h3>
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li>In Centre of Mass mode, compare equal and unequal masses and watch the orbital radii adjust automatically.</li>
          <li>In Torque mode, set theta to 0, 90 and 180 degrees to test the sine dependence.</li>
          <li>Change r or F independently and observe that torque changes in direct proportion.</li>
          <li>Reverse the direction to compare clockwise and anticlockwise turning effects.</li>
        </ol>
        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'moment-of-inertia') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Moment of Inertia</h1>
        <p className="lead text-xl text-slate-600 mb-8">Moment of inertia is the rotational analogue of mass. It measures how strongly a rigid body resists a change in rotational motion about a specified fixed axis.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Definition</h3>
        <div className="my-5 rounded-xl border border-violet-200 bg-violet-50 p-5 text-center font-mono text-xl font-bold text-violet-900">I = sum(m<sub>i</sub>r<sub>i</sub>²)</div>
        <p className="text-sm">Here r<sub>i</sub> is the perpendicular distance of the i-th mass element from the axis. Moment of inertia depends on mass, shape, size, mass distribution, and the position and orientation of the axis. It does not depend on angular velocity. Its SI unit is kg m² and its dimensions are [ML²].</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">NCERT Table 6.1</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-100"><tr><th className="p-3 text-left">Body</th><th className="p-3 text-left">Specified axis</th><th className="p-3 text-left">I</th></tr></thead>
            <tbody>
              <tr className="border-t"><td className="p-3">Thin circular ring</td><td className="p-3">Perpendicular to plane at centre</td><td className="p-3 font-mono">MR²</td></tr>
              <tr className="border-t"><td className="p-3">Circular disc</td><td className="p-3">Perpendicular to disc at centre</td><td className="p-3 font-mono">MR²/2</td></tr>
              <tr className="border-t"><td className="p-3">Thin rod</td><td className="p-3">Perpendicular at midpoint</td><td className="p-3 font-mono">ML²/12</td></tr>
              <tr className="border-t"><td className="p-3">Solid sphere</td><td className="p-3">About a diameter</td><td className="p-3 font-mono">2MR²/5</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Rotational Dynamics</h3>
        <div className="my-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center"><strong className="font-mono text-amber-900">tau = I alpha</strong><br /><span className="text-sm text-slate-600">For the same torque, larger I means smaller angular acceleration.</span></div>
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-center"><strong className="font-mono text-cyan-900">K = ½I omega²</strong><br /><span className="text-sm text-slate-600">Rotational kinetic energy for fixed-axis rotation.</span></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Radius of Gyration</h3>
        <p className="text-sm">NCERT writes <strong>I = Mk²</strong>. The radius of gyration k is the distance from the axis at which a single point mass equal to the whole body's mass would have the same moment of inertia.</p>

        <div className="my-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><strong>Practical connection:</strong> A flywheel deliberately has a large moment of inertia. It resists sudden speed changes and helps engines deliver smoother motion.</div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Using the Simulation</h3>
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li>Keep M, size and torque fixed while switching shapes; compare their spin-up rates.</li>
          <li>Double the size parameter and observe the square dependence of I.</li>
          <li>Increase mass and note that both I and resistance to angular acceleration increase.</li>
          <li>Reverse torque to verify the change in angular-acceleration direction.</li>
        </ol>
        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'keplers-laws-planetary-motion') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Kepler&apos;s Laws of Planetary Motion</h1>
        <p className="lead text-xl text-slate-600 mb-8">Johannes Kepler extracted three laws from Tycho Brahe&apos;s observations. These empirical laws later helped Newton formulate universal gravitation.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">1. Law of Orbits</h3>
        <div className="my-5 rounded-xl border border-cyan-200 bg-cyan-50 p-5 text-center font-semibold text-cyan-950">All planets move in elliptical orbits with the Sun situated at one focus.</div>
        <p className="text-sm">For every point on an ellipse, the sum of its distances from the two foci is constant. Half the longest diameter is the semi-major axis a. A circle is the special case in which both foci merge and a becomes the radius.</p>
        <ul className="list-disc pl-6 space-y-2 text-sm"><li><strong>Perihelion P:</strong> closest orbital point to the Sun.</li><li><strong>Aphelion A:</strong> farthest orbital point from the Sun.</li></ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">2. Law of Areas</h3>
        <div className="my-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center font-semibold text-amber-950">The line joining a planet to the Sun sweeps equal areas in equal intervals of time.</div>
        <p className="text-sm">For a short time interval, NCERT gives ΔA = ½(r × vΔt), and therefore:</p>
        <div className="my-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-center font-mono text-lg font-bold text-violet-900">ΔA / Δt = L / (2m) = constant</div>
        <p className="text-sm">Gravitation acts along the Sun-planet radius and is therefore a central force. Its torque about the Sun is zero, so angular momentum L is conserved. Consequently, the planet moves faster near perihelion and slower near aphelion. At the two ends, r<sub>P</sub>v<sub>P</sub> = r<sub>A</sub>v<sub>A</sub>.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">3. Law of Periods</h3>
        <div className="my-5 rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-center font-mono text-lg font-bold text-indigo-900">T² ∝ a³</div>
        <p className="text-sm">The square of a planet&apos;s orbital period is proportional to the cube of the semi-major axis. For planets around the Sun:</p>
        <div className="my-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-center font-mono text-lg font-bold text-blue-900">T² = 4π²a³ / (GM<sub>S</sub>)</div>
        <p className="text-sm">Thus every planet orbiting the same central mass has the same value of T²/a³. More distant planets take longer to complete an orbit.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Using the Simulation</h3>
        <ol className="list-decimal pl-6 space-y-2 text-sm">
          <li>In Orbits mode, increase eccentricity and observe the Sun remain at one focus rather than the ellipse centre.</li>
          <li>In Areas mode, compare equal-time coloured sectors and the changing velocity arrow.</li>
          <li>Set eccentricity to zero to recover a circular orbit with constant orbital speed.</li>
          <li>In Periods mode, vary the test planet&apos;s semi-major axis and compare its revolution with Earth&apos;s one-year orbit.</li>
        </ol>
        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'conservation-mechanical-energy') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Conservation of Mechanical Energy</h1>
        <p className="lead text-xl text-slate-600 mb-8">Kinetic and potential energies may change from point to point, but their sum remains constant when the forces doing work are conservative.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Conservation Principle</h3>
        <div className="my-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"><strong className="font-mono text-emerald-900">ΔK + ΔV = 0</strong><br /><span className="text-sm text-slate-600">Any gain in one form equals the loss in the other.</span></div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-center"><strong className="font-mono text-violet-900">K + V = constant</strong><br /><span className="text-sm text-slate-600">Total mechanical energy E is conserved.</span></div>
        </div>
        <p className="text-sm">Over a complete motion from x<sub>i</sub> to x<sub>f</sub>, NCERT Eq. 5.11 gives K<sub>i</sub> + V(x<sub>i</sub>) = K<sub>f</sub> + V(x<sub>f</sub>).</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Conservative Forces</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>A one-dimensional conservative force can be written F(x) = -dV/dx.</li>
          <li>Its work depends only on the initial and final positions, not the path.</li>
          <li>Its work over a closed path is zero.</li>
          <li>Gravity and the ideal spring force are conservative.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Free Fall Near Earth</h3>
        <p className="text-sm">For constant g and gravitational potential V(h) = mgh, a ball released from rest at height H passes through these energy states:</p>
        <div className="my-5 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm"><thead className="bg-slate-100"><tr><th className="p-3 text-left">Position</th><th className="p-3 text-left">Mechanical energy</th></tr></thead><tbody><tr className="border-t"><td className="p-3">Release height H</td><td className="p-3 font-mono">E<sub>H</sub> = mgH</td></tr><tr className="border-t"><td className="p-3">Intermediate height h</td><td className="p-3 font-mono">E<sub>h</sub> = mgh + ½mv<sub>h</sub>²</td></tr><tr className="border-t"><td className="p-3">Ground level</td><td className="p-3 font-mono">E<sub>0</sub> = ½mv<sub>f</sub>²</td></tr></tbody></table>
        </div>
        <p className="text-sm">Since E<sub>H</sub> = E<sub>0</sub>, mgH = ½mv<sub>f</sub>² and therefore v<sub>f</sub> = √(2gH). At height h, v<sub>h</sub>² = 2g(H-h).</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Ideal Spring-Block System</h3>
        <div className="my-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center font-mono text-lg font-bold text-amber-900">½kA² = ½kx² + ½mv²</div>
        <p className="text-sm">The spring potential energy V(x) = ½kx² is maximum at x = ±A, where the block stops momentarily. Kinetic energy is maximum at equilibrium x = 0. The two curves are complementary and total E = ½kA² remains constant.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">When Mechanical Energy Is Not Conserved</h3>
        <div className="my-5 rounded-xl border border-red-200 bg-red-50 p-5 text-center font-mono text-lg font-bold text-red-900">E<sub>f</sub> - E<sub>i</sub> = W<sub>nc</sub></div>
        <p className="text-sm">NCERT notes that friction and viscous resistance are non-conservative. Their work depends on the path, so K + V decreases. Energy itself is not destroyed: the simulation&apos;s red loss curve accounts for mechanical energy transferred to internal energy. The real-loss mode is a comparison model; use NCERT ideal mode for Fig. 5.5 and Fig. 5.7.</p>
        <p className="text-sm">The zero of potential energy is a choice, but it must remain fixed throughout a calculation. This lab uses V = 0 at ground level for free fall and at x = 0 for the spring.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Using the Simulation</h3>
        <ol className="list-decimal pl-6 space-y-2 text-sm"><li>Choose NCERT ideal, then compare energy at release height H, H/2 and ground level.</li><li>Change mass or height and verify K + V remains mgH until the instant just before impact.</li><li>In Spring-block mode, watch K peak at x = 0 and V peak at x = ±A.</li><li>Choose Real losses and observe K + V fall while K + V + transferred energy remains equal to the initial energy.</li></ol>
        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'shm-spring') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Spring-Mass System and Simple Harmonic Motion</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          SHM arises when a restoring force is <strong>directly proportional</strong> to displacement and always directed towards the equilibrium position: <strong>F = âˆ’kx</strong>.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">The Force Law &amp; Angular Frequency</h3>
        <p className="text-sm">From Hooke&apos;s Law and Newton&apos;s Second Law:</p>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="font-mono text-lg text-brand-primary">F = âˆ’kx â†’ a = âˆ’(k/m)x â†’ Ï‰ = âˆš(k/m)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Kinematics of SHM</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Displacement:</strong> x(t) = A cos(Ï‰t + Ï•) â€” maximum at extreme positions</li>
          <li><strong>Velocity:</strong> v(t) = âˆ’Ï‰A sin(Ï‰t + Ï•) â€” maximum at mean position (x = 0), phase shift of Ï€/2</li>
          <li><strong>Acceleration:</strong> a(t) = âˆ’Ï‰Â²A cos(Ï‰t + Ï•) = âˆ’Ï‰Â²x â€” maximum at extremes, phase shift of Ï€</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Time Period</h3>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="font-mono text-lg text-emerald-700">T = 2Ï€âˆš(m/k)</p>
          <p className="text-sm text-slate-600 mt-1">Critical: T depends only on m and k â€” <strong>independent of amplitude!</strong></p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Energy in SHM</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>KE</strong> = Â½mvÂ² = Â½kAÂ² sinÂ²(Ï‰t) â€” maximum at mean position</li>
          <li><strong>PE</strong> = Â½kxÂ² = Â½kAÂ² cosÂ²(Ï‰t) â€” maximum at extreme positions</li>
          <li><strong>Total E</strong> = Â½kAÂ² â€” <em>constant</em>, continuously transforms KE â†” PE</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸš— Automobile Suspension</h4>
          <p className="text-sm">
            Car shock absorbers use heavy springs. When the car hits a bump, the mass compresses the spring which then oscillates as a spring-mass SHM system. Oil-based damping prevents the car from bouncing forever.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸ”¬ Atoms in a Crystal Lattice</h4>
          <p className="text-sm">
            In crystalline solids, atoms sit in equilibrium positions held by interatomic forces. If displaced, they experience restoring forces exactly like a microscopic spring-mass system, leading to lattice vibrations (phonons).
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸŒ Seismographs</h4>
          <p className="text-sm">
            Earthquake detectors use a heavy mass suspended by a spring. Due to inertia, the mass stays relatively stationary while the ground moves during a quake â€” the relative SHM of the system records the earth&apos;s tremors.
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
        <p className="text-sm">In its equilibrium position, the bob hangs vertically at rest. When displaced by an angle Î¸, the forces acting on it are:</p>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Tension (T)</strong> â€” along the string, toward the pivot</li>
          <li><strong>Weight (mg)</strong> â€” vertically downward</li>
        </ul>
        <p className="text-sm mt-2">The tangential component of gravity (<strong>mgsinÎ¸</strong>) acts as the restoring force.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Equation of Motion</h3>
        <p className="text-sm">Using torque equation Ï„ = IÎ±:</p>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="font-mono text-lg text-brand-primary">Ï„ = âˆ’L(mg sinÎ¸) = IÎ±</p>
          <p className="text-sm text-slate-600 mt-1">where I = mLÂ² (moment of inertia of a point mass)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Small Angle Approximation</h3>
        <p className="text-sm">For small angles (Î¸ &lt; 20Â°), sinÎ¸ â‰ˆ Î¸ (in radians). This gives:</p>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="font-mono text-lg text-emerald-700">Î± â‰ˆ âˆ’(g/L)Î¸</p>
          <p className="text-sm text-slate-600 mt-1">This is the defining condition for Simple Harmonic Motion!</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Time Period &amp; Angular Frequency</h3>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
          <p className="font-mono text-lg text-purple-700">T = 2Ï€âˆš(L/g)</p>
          <p className="font-mono text-md text-purple-600 mt-1">Ï‰ = âˆš(g/L)</p>
        </div>
        <p className="text-sm"><strong>Key Insight:</strong> The period depends ONLY on length L and gravity g â€” it is independent of the mass of the bob and (for small angles) the amplitude!</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸŽ¢ Playground Swing</h4>
          <p className="text-sm">
            A child on a swing acts as a pendulum. Pushing the swing provides energy to overcome friction (damping), while gravity acts as the restoring force.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸ• Grandfather Clock</h4>
          <p className="text-sm">
            These clocks use a pendulum to maintain a precise period. The length is often adjustable to &quot;tune&quot; the clock to T = 2 seconds (a &quot;seconds pendulum&quot;).
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">â›°ï¸ Geological Survey</h4>
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
          When two identical waves travel in opposite directions, their superposition creates a <strong>standing wave</strong> â€” a pattern that oscillates in place, with fixed nodes and vibrating antinodes.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Principle of Superposition</h3>
        <p className="text-sm">The net displacement at any point is the algebraic sum of individual wave displacements: <strong>y = yâ‚ + yâ‚‚</strong>. Each wave travels as if the others are not present.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Reflection of Waves</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Fixed end:</strong> Phase change of Ï€ â€” reflected wave is inverted. y<sub>r</sub> = âˆ’a sin(kx + Ï‰t)</li>
          <li><strong>Free end:</strong> No phase change â€” reflected wave is upright. y<sub>r</sub> = a sin(kx + Ï‰t)</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Standing Wave Equation</h3>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200 text-center">
          <p className="font-mono text-lg text-purple-700">y(x,t) = [2a sin(kx)] cos(Ï‰t)</p>
          <p className="text-sm text-slate-600 mt-1">Amplitude varies with position â€” kx and Ï‰t are separate!</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Nodes &amp; Antinodes</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li><strong>Nodes:</strong> sin(kx) = 0 â†’ x = 0, Î»/2, Î», ... (particles never move). Distance = Î»/2.</li>
          <li><strong>Antinodes:</strong> |sin(kx)| = 1 â†’ x = Î»/4, 3Î»/4, ... (maximum amplitude 2a). Distance = Î»/2.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Normal Modes (Harmonics)</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="font-mono text-lg text-brand-primary">Î½<sub>n</sub> = nv/(2L)   where v = âˆš(T/Î¼)</p>
          <p className="text-sm text-slate-600 mt-1">n = 1 (fundamental), 2, 3, ... Each gives n loops with n+1 nodes.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Real-World Applications</h3>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸŽ¸ Musical Instruments</h4>
          <p className="text-sm">Guitar and sitar strings vibrate in standing wave patterns. The combination of fundamental and higher harmonics determines the instrument&apos;s timbre (tonal quality).</p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸŒŠ Resonance in Bays</h4>
          <p className="text-sm">Tides entering a partially enclosed bay reflect off the coast, creating standing water waves. When the bay&apos;s natural frequency matches the tidal frequency, massive resonant antinodes form.</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸŽµ Organ Pipes</h4>
          <p className="text-sm">Wind instruments use standing waves in air columns. A pipe closed at one end creates a displacement node there, restricting frequencies to odd harmonics: Î½<sub>n</sub> = nv/(4L) for n = 1, 3, 5...</p>
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
          <p className="font-mono text-xl text-brand-primary text-center pb-2">E<sub>n</sub> = -2.18 Ã— 10<sup>-18</sup> (1/nÂ²) J</p>
          <p className="font-mono text-xl text-brand-primary text-center">Î”E = E<sub>f</sub> - E<sub>i</sub></p>
          <p className="text-sm text-slate-600 mt-2 text-center border-t border-slate-300 pt-2">The energy of the emitted photon equals the difference between the higher and lower orbits.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Hydrogen Emission Series</h3>
        <p>
          The energy gap between orbits is massive at the bottom and gets progressively smaller higher up.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Lyman Series (n_final = 1):</strong> Huge energy drops â†’ Ultraviolet (UV) light.</li>
          <li><strong>Balmer Series (n_final = 2):</strong> Moderate energy drops â†’ Visible light (Red to Violet).</li>
          <li><strong>Paschen/Brackett/Pfund (n_final â‰¥ 3):</strong> Small energy drops â†’ Infrared (IR) light.</li>
        </ul>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-6">
          <h4 className="font-bold text-amber-900 mb-2">ðŸŽ† Real-World Analogy: Fireworks & Neon Signs</h4>
          <p className="text-sm">
            When electricity passes through neon gas, electrons are excited. When they drop down, they emit specific wavelengths, giving Neon its red-orange glow.
            Similarly, fireworks' colors depend on the metal salts used (strontium for red, copper for blue); heat excites electrons, and atomic "falling down" transitions dictate the color we see!
          </p>
        </div>

        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-sm my-6">
          <h4 className="font-bold text-indigo-900 mb-2">ðŸ”­ Astrophysics: Stellar Spectroscopy</h4>
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
          Heisenberg's Uncertainty Principle states we cannot know both the exact position and momentum of an electron. Instead, we use SchrÃ¶dinger's wave equation (Ïˆ) to find the probability density (ÏˆÂ²).
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
            <strong>d-orbitals (l = 2):</strong> Four of the five d-orbitals have a "double-dumbbell" or clover shape (d<sub>xy</sub>, d<sub>yz</sub>, d<sub>xz</sub>, d<sub>xÂ²-yÂ²</sub>). The fifth (d<sub>zÂ²</sub>) looks like a dumbbell with a doughnut-shaped ring around the center.
          </li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Nodes: Zones of Zero Probability</h3>
        <p>
          A node is a region where the probability density (ÏˆÂ²) drops to absolute zero.
        </p>
        <div className="my-6 p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <p><strong>Radial Nodes:</strong> Spherical shells of zero probability. <br /><span className="font-mono text-brand-primary">Formula: n - l - 1</span></p>
          <p><strong>Angular Nodes (Nodal Planes):</strong> Flat planes slicing through the nucleus with zero probability. <br /><span className="font-mono text-brand-secondary">Formula: l</span></p>
          <p><strong>Total Nodes:</strong> <span className="font-mono text-slate-700">Formula: n - 1</span></p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-6">
          <h4 className="font-bold text-sky-900 mb-2">ðŸ Real-World Analogy: A Swarm of Bees</h4>
          <p className="text-sm">
            Imagine a beehive as the nucleus. A single bee flies around it incredibly fast. A photograph won't show the bee; a time-lapse reveals a blurry "cloud." The cloud is thickest near the hive. This is electron probability density (ÏˆÂ²). A region where a repelling scent keeps bees away is a "node."
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-6">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸŽ¸ Nature Example: Standing Waves</h4>
          <p className="text-sm">
            When you pluck a guitar string, points vibrate violently (antinodes) while others remain perfectly still (nodes). Electron wave functions (Ïˆ) are essentially 3D standing waves, and orbital nodes are the 3D equivalent of those motionless vibrational points.
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
            <strong>Ideal Geometry:</strong> Only bond pairs. Perfect symmetry (e.g., CHâ‚„ is perfectly Tetrahedral at 109.5Â°).
          </li>
          <li>
            <strong>One Lone Pair (e.g., NHâ‚ƒ):</strong> Nitrogen has 3 bond pairs, 1 lone pair. The strong LP-BP repulsion squeezes N-H bonds. Shape: <i>Trigonal Pyramidal</i> (Angle drops from 109.5Â° to 107Â°).
          </li>
          <li>
            <strong>Two Lone Pairs (e.g., Hâ‚‚O):</strong> Oxygen has 2 bond pairs, 2 lone pairs. Massive LP-LP repulsion brutally squishes O-H bonds. Shape: <i>Bent</i> (Angle drops further to 104.5Â°).
          </li>
          <li>
            <strong>Equatorial Preference (e.g., SFâ‚„):</strong> In a 5-pair Trigonal Bipyramidal setup, lone pairs occupy equatorial positions, minimizing 90Â° repulsions. This forms a <i>See-saw</i> shape.
          </li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸŽˆ Daily Life Analogy: Tied Balloons</h4>
          <p className="text-sm">
            Imagine tying 4 elongated balloons together. They naturally fan out into a tetrahedral shape giving maximum space. Now attach one significantly fatter balloon (a lone pair). It forces the three thinner balloons to squeeze closer together!
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm my-4">
          <h4 className="font-bold text-blue-900 mb-2">ðŸ’§ Nature: Water's Unique Properties</h4>
          <p className="text-sm">
            Because Hâ‚‚O has two lone pairs, it is distinctly bent (not linear). This asymmetry creates a dipole moment. This precise polarity is why water is the universal solvent, liquid at room temperature, and why ice floatsâ€”fundamental to life!
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸŒ¡ï¸ Industrial: Microwave Ovens</h4>
          <p className="text-sm">
            Microwaves work exactly by interacting with water's dipole moment. VSEPR theory's lone pair dictates the bent geometry allowing the water molecule to align with the oscillating electromagnetic field, generating heat.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸ’Š Pharmaceutical Engineering</h4>
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
          Orbital wave functions (Ïˆ) have <strong>positive (+)</strong> and <strong>negative (âˆ’)</strong> regions representing the phase of the wave â€” <em>not</em> electrical charge. Two overlapping orbitals must have the <strong>same phase</strong> and proper orientation to produce a <strong>constructive overlap</strong> (bonding). Opposite phases give <strong>destructive interference</strong> (no bond).
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Sigma (Ïƒ) Bond â€” Head-on Overlap</h3>
        <p>
          Formed by <strong>end-to-end</strong> overlap along the internuclear axis. The electron cloud is <strong>cylindrically symmetrical</strong> around the bond axis.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-6">
          <li><strong>sâ€“s overlap:</strong> Two half-filled s-orbitals merge (e.g., Hâ‚‚ molecule).</li>
          <li><strong>sâ€“p overlap:</strong> One s-orbital overlaps with one p-orbital head-on.</li>
          <li><strong>pâ€“p axial overlap:</strong> Two p-orbitals overlap head-on along the z-axis (p<sub>z</sub>â€“p<sub>z</sub>).</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Pi (Ï€) Bond â€” Sideways Overlap</h3>
        <p>
          Formed when <strong>parallel p-orbitals</strong> overlap laterally, perpendicular to the internuclear axis. The electron cloud sits in two lobes <strong>above and below</strong> the molecular plane.
        </p>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800 text-center"><strong>Key Rule:</strong> A Ï€ bond is <em>never</em> formed alone â€” it always accompanies an existing Ïƒ bond in double or triple bonds.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Strength: Ïƒ vs. Ï€</h3>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">Sigma (Ïƒ) Bond &gt; Pi (Ï€) Bond</p>
          <p className="text-sm text-slate-600 mt-2 text-center">Head-on approach â†’ greater overlap extent â†’ stronger bond.<br />Sideways approach â†’ less overlap â†’ weaker, more reactive bond.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸ¤ Daily Life Analogy: Handshake vs. High-Five</h4>
          <p className="text-sm">
            A Ïƒ bond is a firm, direct handshake â€” strong and head-on. A Ï€ bond is like adding a sideways high-five while maintaining the handshake. The high-five is weaker and easier to break.
          </p>
        </div>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸ­ Industrial: Plastics Manufacturing</h4>
          <p className="text-sm">
            Polythene is made by breaking ethene's weak Ï€ bond under heat and pressure. The freed electrons form new Ïƒ bonds, linking thousands of molecules into long, strong polymer chains.
          </p>
        </div>

        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸ‘ï¸ Biological: Vision</h4>
          <p className="text-sm">
            Retinal in our eyes has alternating Ïƒ and (Ïƒ+Ï€) bonds. Light energy breaks the weaker Ï€ bond, allowing rotation around the remaining Ïƒ bond. This shape change triggers the nerve impulse that lets us see!
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
          When a gas expands or compresses at constant temperature, the amount of work it performs depends crucially on <strong>how</strong> the process is carried out â€” reversibly (infinitely slowly) or irreversibly (sudden).
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The First Law of Thermodynamics</h3>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">Î”U = q + W</p>
          <p className="text-sm text-slate-600 mt-2 text-center">For an isothermal process of an ideal gas: Î”U = 0, so <strong>q = âˆ’W</strong></p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Reversible Isothermal Expansion</h3>
        <p>
          The gas expands in <strong>infinitesimally small steps</strong>, with the external pressure always just slightly less than the gas pressure. At each step, the system is virtually at equilibrium.
        </p>
        <div className="my-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="font-mono text-lg text-emerald-700 text-center">W<sub>rev</sub> = âˆ’nRT ln(Vâ‚‚/Vâ‚)</p>
          <p className="text-sm text-emerald-600 mt-2 text-center">This gives the <strong>maximum work</strong> obtainable from expansion.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Irreversible Isothermal Expansion</h3>
        <p>
          The external pressure drops suddenly to a constant value P<sub>ext</sub> (e.g., the final pressure). The gas rushes outward doing less total work than the reversible case.
        </p>
        <div className="my-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="font-mono text-lg text-amber-700 text-center">W<sub>irr</sub> = âˆ’P<sub>ext</sub>(Vâ‚‚ âˆ’ Vâ‚)</p>
          <p className="text-sm text-amber-600 mt-2 text-center">Always less than reversible work: |W<sub>irr</sub>| &lt; |W<sub>rev</sub>|</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Why Does It Matter?</h3>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            <strong>Key Insight (Pâ€“V Diagram):</strong> The work done equals the <strong>area under the curve</strong> on the Pâ€“V graph. The reversible curve (along the isotherm) always encloses more area than the irreversible rectangle.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸš— Automobile Engines</h4>
          <p className="text-sm">
            Internal combustion engines approximate thermodynamic cycles. Engineers strive to make expansion strokes as close to reversible as possible to extract maximum useful work from fuel combustion.
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm my-4">
          <h4 className="font-bold text-purple-900 mb-2">ðŸ”‹ Fuel Cells</h4>
          <p className="text-sm">
            Fuel cells convert chemical energy to electrical energy nearly reversibly, which is why they can achieve much higher efficiencies (60â€“80%) compared to combustion engines (25â€“40%).
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'heat-work-energy-changes') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Heat, Work, and Energy Changes</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Thermodynamics tracks how energy enters or leaves a system as <strong>heat</strong> and <strong>work</strong>, and how their combined effect changes the system&apos;s internal energy.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Internal Energy Is a State Function</h3>
        <p>
          Internal energy, U, is characteristic of the state of a system. We usually cannot assign an absolute value of U, but we can measure its change, &Delta;U, between initial and final states.
        </p>
        <div className="my-6 rounded-xl border border-slate-300 bg-slate-100 p-4">
          <p className="text-center font-mono text-lg text-brand-primary">&Delta;U = U<sub>final</sub> - U<sub>initial</sub></p>
          <p className="mt-2 text-center text-sm text-slate-600">The value of &Delta;U depends only on the initial and final states, not on the path.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Heat and Work Are Path Functions</h3>
        <p>
          Heat, q, is energy transfer caused by a temperature difference. Work, w, is energy transfer by any other mechanical mode, such as moving a piston. Their individual values depend on how the change is carried out.
        </p>
        <div className="grid gap-4 md:grid-cols-2 my-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <h4 className="mb-2 font-bold text-red-900">Heat q</h4>
            <p className="text-sm text-red-800">q &gt; 0 when heat enters the system. q &lt; 0 when heat leaves the system.</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 font-bold text-blue-900">Work w</h4>
            <p className="text-sm text-blue-800">w &gt; 0 when work is done on the system. w &lt; 0 when work is done by the system.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. First Law of Thermodynamics</h3>
        <div className="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-center font-mono text-lg text-emerald-700">&Delta;U = q + w</p>
          <p className="mt-2 text-center text-sm text-emerald-700">Energy is conserved: heat and work added to the system appear as a change in internal energy.</p>
        </div>
        <p>
          If q = 0 and w = 0, the system is isolated and &Delta;U = 0. This is the conservation of energy applied to thermodynamic systems.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Pressure-Volume Work</h3>
        <p>
          For gas expansion or compression against an external pressure, the chemistry convention writes pressure-volume work as:
        </p>
        <div className="my-6 rounded-xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-center font-mono text-lg text-purple-700">w = -P<sub>ext</sub>&Delta;V</p>
          <p className="mt-2 text-center text-sm text-purple-700">Expansion: &Delta;V &gt; 0, so w &lt; 0. Compression: &Delta;V &lt; 0, so w &gt; 0.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Common Exam Trap</h3>
        <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            Chemistry and physics books may use different signs for work. In NCERT Chemistry, use the IUPAC convention: energy added to the system is positive. That is why compression work is positive and expansion work is negative.
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
          <p className="text-sm text-red-800"><strong>Extensive Properties</strong> depend on the <em>quantity or size</em> of matter. More substance â†’ larger value.</p>
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
          <p className="text-sm text-slate-700 mb-1">ðŸ”ª <strong>Volume?</strong> Each half has V/2. Volume <em>changed</em> â†’ <span className="text-red-600 font-bold">Extensive</span></p>
          <p className="text-sm text-slate-700">ðŸŒ¡ï¸ <strong>Temperature?</strong> Still T in both halves. Temperature <em>didn't change</em> â†’ <span className="text-blue-600 font-bold">Intensive</span></p>
        </div>
        <p className="text-sm text-slate-600 italic">The key test: "If I cut this system in half, does this number change?" If yes â†’ extensive. If no â†’ intensive.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Molar Properties: Extensive â†’ Intensive</h3>
        <div className="my-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="font-mono text-lg text-purple-700 text-center">Ï‡<sub>m</sub> = Ï‡ / n</p>
          <p className="text-sm text-purple-600 mt-2 text-center"><strong>Extensive Ã· Extensive = Intensive!</strong> Dividing any extensive property by moles gives a molar property that is intensive.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Applications</h3>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">â˜• Boiling Water Analogy</h4>
          <p className="text-sm">A teacup and a bathtub of boiling water both read 100Â°C (intensive). But the bathtub has far more mass, volume, and stored heat energy (all extensive).</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">âœˆï¸ Aerospace Engineering</h4>
          <p className="text-sm">Engineers select aluminum for aircraft wings based on its density (intensive). A small block and a massive sheet of aluminum share the same low density â€” it's predictable regardless of size.</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm my-4">
          <h4 className="font-bold text-red-900 mb-2">ðŸ­ Chemical Manufacturing Risk</h4>
          <p className="text-sm">Scaling a reaction from a test tube to a 10,000 L reactor means enthalpy (extensive) scales 1,000Ã—. Without proportional cooling, this poses a severe explosion risk.</p>
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
          <p className="text-sm text-orange-700 mt-1">Example: CHâ‚ƒCOOH + CHâ‚ƒCOONa â†’ buffers around pH 4.75</p>
        </div>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Basic Buffer:</strong> Weak base + its salt with a strong acid.</p>
          <p className="text-sm text-blue-700 mt-1">Example: NHâ‚„OH + NHâ‚„Cl â†’ buffers around pH 9.25</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. How Buffer Action Works</h3>
        <p className="text-sm">
          In an acidic buffer (CHâ‚ƒCOOH / CHâ‚ƒCOOâ»):
        </p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-700 mb-2">ðŸ”´ <strong>Add HCl:</strong> Extra Hâº is consumed by CHâ‚ƒCOOâ» â†’ CHâ‚ƒCOOH. pH barely changes.</p>
          <p className="text-sm text-slate-700">ðŸ”µ <strong>Add NaOH:</strong> Extra OHâ» is consumed by CHâ‚ƒCOOH â†’ CHâ‚ƒCOOâ» + Hâ‚‚O. pH barely changes.</p>
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
          <p className="text-sm text-red-800">A buffer has a <strong>finite capacity</strong>. If enough acid is added to completely consume the conjugate base (Aâ»), the buffer <strong>breaks</strong> and pH crashes.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm my-4">
          <h4 className="font-bold text-red-900 mb-2">ðŸ©¸ Human Blood</h4>
          <p className="text-sm">Blood is buffered at pH 7.4 by the Hâ‚‚COâ‚ƒ/HCOâ‚ƒâ» system. Deviations below 7.0 or above 7.8 are fatal. The bicarbonate buffer neutralizes lactic acid from exercise.</p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸ§´ Cosmetics &amp; Skincare</h4>
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

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. How It Works (Qêœ€ vs Kêœ€)</h3>
        <p className="text-sm">For the reaction FeÂ³âº + SCNâ» â‡Œ [Fe(SCN)]Â²âº:</p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-700 mb-2">ðŸ”¶ <strong>Add reactant (FeÂ³âº or SCNâ»):</strong> Qêœ€ drops below Kêœ€ â†’ system shifts <span className="text-amber-600 font-bold">forward</span> â†’ more red product forms.</p>
          <p className="text-sm text-slate-700">ðŸ”· <strong>Remove reactant:</strong> Qêœ€ rises above Kêœ€ â†’ system shifts <span className="text-blue-600 font-bold">backward</span> â†’ red product decomposes, color fades to yellow.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. The Reaction Quotient</h3>
        <div className="my-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="font-mono text-lg text-purple-700 text-center">Qêœ€ = [Fe(SCN)Â²âº] / ([FeÂ³âº][SCNâ»])</p>
          <p className="text-sm text-purple-600 mt-2 text-center">
            Qêœ€ &lt; Kêœ€ â†’ forward shift &nbsp;|&nbsp; Qêœ€ &gt; Kêœ€ â†’ backward shift &nbsp;|&nbsp; Qêœ€ = Kêœ€ â†’ equilibrium
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Applications</h3>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸ­ Haber Process (NHâ‚ƒ)</h4>
          <p className="text-sm">NHâ‚ƒ is continuously liquefied and removed from the reactor. By removing product, Qêœ€ stays below Kêœ€, forcing Nâ‚‚ + 3Hâ‚‚ to keep reacting forward.</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸ”¥ Quicklime from Limestone</h4>
          <p className="text-sm">CaCOâ‚ƒ â‡Œ CaO + COâ‚‚. Blowing air through the kiln removes COâ‚‚, driving the decomposition to completion.</p>
        </div>

        <VideoSection />
      </div>
    );
  }
  if (topic?.id === 'mole-concept-limiting-reagent') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Mole Concept and Limiting Reagent</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The mole is the chemist's counting unit. It connects the macroscopic mass of a substance to the number of individual particles it contains. Together with the limiting reagent idea, it powers every stoichiometric calculation. <span className="text-sm text-slate-500">NCERT Class 11 · Ch 1 Some Basic Concepts of Chemistry · §1.8 – §1.10</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Mole &amp; Avogadro Constant</h3>
        <p>One mole of any substance contains exactly <strong>6.0221367 × 10²³</strong> entities (atoms, molecules, ions or formula units). This is the <strong>Avogadro constant</strong>, N<sub>A</sub>.</p>
        <div className="my-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="font-mono text-lg text-purple-700 text-center">1 mol = 6.022 × 10²³ entities</p>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>1 mol of H atoms = 6.022 × 10²³ atoms</li>
          <li>1 mol of H₂O molecules = 6.022 × 10²³ water molecules</li>
          <li>1 mol of NaCl = 6.022 × 10²³ formula units</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Molar Mass</h3>
        <p>The molar mass of a substance is the mass of one mole, in grams. Numerically it equals the atomic / molecular / formula mass expressed in u.</p>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-900">Molar mass of H₂O = <strong>18.02 g mol⁻¹</strong></p>
          <p className="text-sm text-amber-900 mt-1">Molar mass of NaCl = <strong>58.5 g mol⁻¹</strong></p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Stoichiometry</h3>
        <p>From the Greek <em>stoicheion</em> (element) + <em>metron</em> (measure). A balanced chemical equation supplies <strong>molar ratios</strong> — the bridge between reactants and products.</p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-base text-slate-800 text-center">CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(g)</p>
          <p className="text-sm text-slate-700 text-center mt-2">1 mol CH₄ reacts with 2 mol O₂ to give 1 mol CO₂ and 2 mol H₂O.</p>
        </div>
        <p className="text-sm">Interconvert via:</p>
        <div className="my-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
          <p className="font-mono text-sm text-purple-800 text-center">mass ⇌ moles ⇌ number of molecules &nbsp;|&nbsp; mass / volume = density</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Limiting Reagent (§1.10.1)</h3>
        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-900">The reactant <strong>consumed first</strong> in a non-stoichiometric mixture is the <strong>limiting reagent</strong>. It fixes the maximum amount of product; once exhausted, the reaction stops regardless of how much of the other reactant is left.</p>
        </div>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm font-bold text-slate-800">NCERT worked example — Haber process</p>
          <p className="text-sm text-slate-700 mt-2">Need 5.36 × 10³ mol H₂ to react with 1.786 × 10³ mol N₂; only 4.96 × 10³ mol H₂ available ⇒ <strong>H₂ is limiting</strong>. NH₃ produced = (4.96 × 10³) × (2/3) = 3.30 × 10³ mol = <strong>56.1 kg NH₃</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">Industrial NH₃ Manufacture</h4>
          <p className="text-sm">Fertiliser plants must feed the Haber reactor in <strong>exactly the 1 : 3 N₂ : H₂ ratio</strong>. Run rich in H₂ and you waste hydrogen; run lean and N₂ becomes limiting — output crashes.</p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">Combustion Air-Fuel Ratio</h4>
          <p className="text-sm">An engine running rich (too much fuel) wastes hydrocarbons; running lean (too much air) drops power. Both are limiting-reagent failures in mol terms.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'solution-concentration-dilution') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Solution Concentration and Dilution</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          NCERT defines four distinct ways to express how much solute sits in a given amount of solvent — and one master relation that governs dilution. <span className="text-sm text-slate-500">NCERT Class 11 · Ch 1 Some Basic Concepts of Chemistry · §1.10.2</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Four NCERT Units</h3>

        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm font-bold text-amber-900">1 · Mass per cent (w/w %)</p>
          <p className="font-mono text-sm text-amber-800 text-center mt-2">Mass % = (Mass of solute / Mass of solution) × 100</p>
          <p className="text-xs text-amber-700 mt-2"><strong>NCERT Problem 1.6.</strong> 2 g solute in 18 g water ⇒ 2 / 20 × 100 = <strong>10 %</strong>.</p>
        </div>

        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm font-bold text-emerald-900">2 · Mole fraction (x)</p>
          <p className="font-mono text-sm text-emerald-800 text-center mt-2">x<sub>A</sub> = n<sub>A</sub> / (n<sub>A</sub> + n<sub>B</sub>) &nbsp; x<sub>A</sub> + x<sub>B</sub> = 1</p>
          <p className="text-xs text-emerald-700 mt-2">Dimensionless; unaffected by temperature.</p>
        </div>

        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="text-sm font-bold text-purple-900">3 · Molarity (M)</p>
          <p className="font-mono text-sm text-purple-800 text-center mt-2">M = moles of solute / volume of solution (L)</p>
          <p className="text-xs text-purple-700 mt-2"><strong>NCERT Problem 1.7.</strong> 4 g NaOH in 250 mL ⇒ (4/40) / 0.250 = <strong>0.4 M</strong>. Note: M is <em>temperature-dependent</em> because volume changes with T.</p>
        </div>

        <div className="my-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
          <p className="text-sm font-bold text-teal-900">4 · Molality (m)</p>
          <p className="font-mono text-sm text-teal-800 text-center mt-2">m = moles of solute / mass of solvent (kg)</p>
          <p className="text-xs text-teal-700 mt-2"><strong>NCERT Problem 1.8.</strong> 3 M NaCl, density 1.25 g mL⁻¹ ⇒ 175.5 g NaCl in 1250 g solution ⇒ 1074.5 g solvent ⇒ m = 3 / 1.0745 = <strong>2.79 m</strong>. Mass is T-independent, so <strong>m is also T-independent</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Dilution Master Relation</h3>
        <p>Adding solvent leaves the <strong>moles of solute unchanged</strong>. So for two molarities of the same solute:</p>
        <div className="my-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
          <p className="font-mono text-xl text-violet-800 text-center"><strong>M₁ × V₁ = M₂ × V₂</strong></p>
          <p className="text-sm text-violet-700 text-center mt-2">M₁, V₁ = stock · M₂, V₂ = diluted</p>
        </div>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm font-bold text-slate-800">Worked example (NCERT)</p>
          <p className="text-sm text-slate-700 mt-2">Need 1 L of 0.2 M NaOH from 1 M stock. <span className="font-mono">0.2 × 1000 = 1.0 × V₁</span> ⇒ V₁ = <strong>200 mL</strong>. Take 200 mL of 1 M and add water to 1 L.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Why It Matters — Molarity vs Molality</h3>
        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-900"><strong>Molarity</strong> is convenient for volumetric work in the lab (titrations, dilutions). <strong>Molality</strong> is the right choice for studies where temperature changes (boiling-point elevation, freezing-point depression) — because volume drifts with T but mass does not.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Applications</h3>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">IV Saline (0.9 % NaCl)</h4>
          <p className="text-sm">Hospital "normal saline" is 0.9 % w/v — isotonic with blood plasma. Outside that window, red blood cells crenate or burst.</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">Coolants &amp; Antifreeze</h4>
          <p className="text-sm">Ethylene glycol is specified in <strong>molality</strong>, not molarity — because the radiator runs from −40 °C to +120 °C, where any volume-based unit would drift.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'glucose-conformations') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Biomolecules – Glucose Conformations</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Glucose looks simple — C₆H₁₂O₆ — but it lives a double life: an open-chain aldehyde and a six-membered ring that exists as two anomers in constant interconversion. <span className="text-sm text-slate-500">NCERT Class 12 · Unit 14 Biomolecules · Structure of Glucose</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Open-Chain Structure</h3>
        <p>Glucose is an <strong>aldohexose</strong> (an aldehyde + six carbons), also called dextrose, written as <strong>D-(+)-glucose</strong>. Its Fischer structure was deduced from experiments:</p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
            <li>Heating with <strong>HI</strong> gives <strong>n-hexane</strong> ⇒ six carbons in a straight chain.</li>
            <li>Forms an <strong>oxime</strong> and a <strong>cyanohydrin</strong> ⇒ a carbonyl group (&gt;C=O).</li>
            <li>Bromine water gives <strong>gluconic acid</strong> ⇒ the carbonyl is an <strong>aldehyde (–CHO)</strong>.</li>
            <li>Acetic anhydride gives <strong>glucose pentaacetate</strong> ⇒ <strong>five –OH</strong> groups.</li>
            <li>Nitric acid gives <strong>saccharic acid</strong> ⇒ one of them is a <strong>primary –OH</strong>.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Why a Ring? The Cyclic Hemiacetal</h3>
        <p>The open chain cannot explain some facts: glucose gives <strong>no Schiff's test</strong>, forms <strong>no NaHSO₃ adduct</strong>, its pentaacetate does <strong>not react with hydroxylamine</strong> (no free –CHO), and it exists in <strong>two crystalline forms</strong> (α and β).</p>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm text-emerald-900">So the <strong>–OH on C5 adds to the –CHO on C1</strong>, forming a six-membered <strong>cyclic hemiacetal</strong>. This ring is called the <strong>pyranose</strong> structure (by analogy with pyran — one O and five C in the ring) and is best drawn as a <strong>Haworth structure</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Anomers: α vs β</h3>
        <p>On ring closure, C1 becomes the <strong>anomeric carbon</strong> (it was the aldehyde carbon). The two ring forms differ <em>only</em> in the orientation of the C1–OH — such isomers are called <strong>anomers</strong>.</p>
        <div className="my-4 grid gap-3 md:grid-cols-2">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="font-bold text-amber-900">α-D-(+)-Glucopyranose</p>
            <p className="text-sm text-amber-800 mt-1">C1–OH is <strong>below</strong> the ring (opposite the CH₂OH at C6).</p>
          </div>
          <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
            <p className="font-bold text-teal-900">β-D-(+)-Glucopyranose</p>
            <p className="text-sm text-teal-800 mt-1">C1–OH is <strong>above</strong> the ring (same side as the CH₂OH at C6).</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Mutarotation</h3>
        <div className="my-4 p-4 bg-violet-50 rounded-xl border border-violet-200">
          <p className="text-sm text-violet-900">In water the two cyclic forms are in equilibrium with the open chain: <strong>α-D-glucose ⇌ open chain ⇌ β-D-glucose</strong>. When either pure anomer is dissolved, its specific rotation gradually changes until it reaches a constant value — this is <strong>mutarotation</strong>. The equilibrium mixture is roughly <strong>36% α and 64% β</strong> (with a trace of open chain).</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Connection</h3>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">🍞 Starch vs cellulose</h4>
          <p className="text-sm">Whether glucose links through its α or β anomer changes everything: α-linkages build <strong>starch</strong> (digestible energy store), while β-linkages build <strong>cellulose</strong> (rigid plant fibre humans cannot digest). The same monomer, a different anomer.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'rate-law-half-life') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Rate Laws &amp; Half-life</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Integrated rate equations link concentration directly to time, so a single graph reveals a reaction's order — and the half-life tells you how fast it disappears. <span className="text-sm text-slate-500">NCERT Class 12 · Ch 3 Chemical Kinetics · §3.3 (Table 3.4)</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Zero-Order Reactions</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm font-bold text-blue-900">Rate is independent of concentration: Rate = k[R]⁰ = k</p>
          <p className="font-mono text-sm text-blue-800 text-center mt-2">[R] = [R]₀ − kt &nbsp;(Eq 3.6) &nbsp;·&nbsp; k = ([R]₀ − [R]) / t &nbsp;(Eq 3.7)</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-blue-900 mt-2">
            <li>A plot of <strong>[R] vs t is a straight line</strong>, slope = −k, intercept = [R]₀.</li>
            <li>Half-life: <strong>t½ = [R]₀ / 2k</strong> — proportional to [R]₀ (successive half-lives shorten).</li>
            <li>Units of k: <strong>mol L⁻¹ s⁻¹</strong>. Example: decomposition of NH₃ on hot Pt at high pressure.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. First-Order Reactions</h3>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm font-bold text-emerald-900">Rate ∝ first power of concentration: Rate = k[R]</p>
          <p className="font-mono text-sm text-emerald-800 text-center mt-2">[R] = [R]₀·e^(−kt) &nbsp;(Eq 3.14) &nbsp;·&nbsp; k = (2.303/t)·log([R]₀/[R]) &nbsp;(Eq 3.10)</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-emerald-900 mt-2">
            <li>A plot of <strong>ln[R] vs t is a straight line</strong>, slope = −k.</li>
            <li>Half-life: <strong>t½ = 0.693 / k</strong> — <em>independent</em> of [R]₀ (constant).</li>
            <li>Units of k: <strong>s⁻¹</strong>. Examples: N₂O₅ decomposition, all radioactive decay.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Comparing the Two Orders</h3>
        <div className="my-4 overflow-x-auto">
          <table className="w-full text-sm border border-slate-200">
            <thead><tr className="bg-slate-100"><th className="p-2 text-left">Feature</th><th className="p-2">Zero order</th><th className="p-2">First order</th></tr></thead>
            <tbody>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">Integrated law</td><td className="p-2 text-center font-mono">[R]=[R]₀−kt</td><td className="p-2 text-center font-mono">[R]=[R]₀e^(−kt)</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">Straight-line plot</td><td className="p-2 text-center">[R] vs t</td><td className="p-2 text-center">ln[R] vs t</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">Half-life t½</td><td className="p-2 text-center font-mono">[R]₀ / 2k</td><td className="p-2 text-center font-mono">0.693 / k</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">t½ vs [R]₀</td><td className="p-2 text-center">∝ [R]₀</td><td className="p-2 text-center">independent</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">Units of k</td><td className="p-2 text-center">mol L⁻¹ s⁻¹</td><td className="p-2 text-center">s⁻¹</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Worked Examples (NCERT)</h3>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-700"><strong>Example 3.7:</strong> First-order k = 5.5×10⁻¹⁴ s⁻¹ ⇒ t½ = 0.693 / (5.5×10⁻¹⁴) = <strong>1.26×10¹³ s</strong>.</p>
          <p className="text-sm text-slate-700 mt-2"><strong>99.9% completion</strong> of a first-order reaction takes t = 6.909/k = <strong>10 × t½</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Connection</h3>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">🕰️ Carbon-14 dating</h4>
          <p className="text-sm">Radioactive decay is first-order with a constant half-life (¹⁴C: 5730 years). Measuring how much ¹⁴C remains in wood or bone lets archaeologists estimate its age — exactly the t½ = 0.693/k relationship in action.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'alcohol-reactivity-hbonding') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Alcohol Reactivity &amp; Hydrogen Bonding</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The −OH group controls everything about an alcohol: it raises boiling points through hydrogen bonding, dissolves small alcohols in water, and dictates how 1°, 2° and 3° alcohols react with reagents. <span className="text-sm text-slate-500">NCERT Class 12 · Unit 7 Alcohols, Phenols &amp; Ethers · §7.4.3–§7.4.4</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Hydrogen Bonding &amp; Boiling Point</h3>
        <p>The −OH group is both a hydrogen-bond <strong>donor</strong> and <strong>acceptor</strong>, so alcohol molecules cling to each other — boiling points are far higher than ethers or hydrocarbons of similar mass.</p>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm font-bold text-emerald-900">Same mass, very different boiling points (NCERT §7.4.3)</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-white px-2 py-2"><div className="font-bold text-emerald-800">Ethanol</div><div className="font-mono text-xs">Mr 46 · 351 K</div></div>
            <div className="rounded-lg bg-white px-2 py-2"><div className="font-bold text-amber-800">Methoxymethane</div><div className="font-mono text-xs">Mr 46 · 248 K</div></div>
            <div className="rounded-lg bg-white px-2 py-2"><div className="font-bold text-slate-700">Propane</div><div className="font-mono text-xs">Mr 44 · 231 K</div></div>
          </div>
          <p className="text-xs text-emerald-700 mt-2">Only ethanol has an −OH to hydrogen-bond, so it boils ~100 K higher.</p>
        </div>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-800"><strong>Trends:</strong> b.p. <strong>increases</strong> with chain length (more van der Waals area) and <strong>decreases</strong> with branching (less surface area). Lower alcohols are miscible with water in all proportions; solubility falls as the alkyl chain grows.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Lucas Test (1° vs 2° vs 3°)</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-900">Lucas reagent = conc. HCl + anhydrous ZnCl₂. The alkyl chloride formed is immiscible → <strong>turbidity</strong>.</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-blue-900 mt-2">
            <li><strong>3°</strong> — turbidity <strong>immediately</strong> (stable 3° carbocation).</li>
            <li><strong>2°</strong> — turbidity in <strong>~5 min</strong>.</li>
            <li><strong>1°</strong> — <strong>no turbidity</strong> at room temperature.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Dehydration to Alkenes</h3>
        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="font-mono text-sm text-red-800 text-center">CH₃CH₂OH —(conc. H₂SO₄, 443 K)→ CH₂=CH₂ + H₂O</p>
          <p className="text-sm text-red-700 mt-2">Ease of dehydration: <strong>3° &gt; 2° &gt; 1°</strong> (carbocation stability). 3° dehydrates under milder conditions (~358 K), 1° needs 443 K.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Oxidation &amp; Dehydrogenation</h3>
        <div className="my-4 overflow-x-auto">
          <table className="w-full text-sm border border-slate-200">
            <thead><tr className="bg-slate-100"><th className="p-2 text-left">Reagent</th><th className="p-2">1°</th><th className="p-2">2°</th><th className="p-2">3°</th></tr></thead>
            <tbody>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">PCC (mild)</td><td className="p-2 text-center">aldehyde</td><td className="p-2 text-center">ketone</td><td className="p-2 text-center">no reaction</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">KMnO₄ / H⁺ (strong)</td><td className="p-2 text-center">carboxylic acid</td><td className="p-2 text-center">ketone</td><td className="p-2 text-center">resists</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">Cu, 573 K</td><td className="p-2 text-center">aldehyde</td><td className="p-2 text-center">ketone</td><td className="p-2 text-center">alkene (dehydration)</td></tr>
            </tbody>
          </table>
        </div>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="text-sm text-purple-900"><strong>Why 3° resists oxidation:</strong> it has no α-hydrogen on the −OH carbon, so the C=O double bond cannot form. Only strong agents at high T cleave C–C bonds.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Connection</h3>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">⚠️ Methanol poisoning</h4>
          <p className="text-sm">In the body methanol is oxidised to methanal then methanoic acid, which can cause blindness or death. Treatment is intravenous dilute ethanol — it occupies the enzyme so the kidneys can excrete methanol (NCERT note).</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'basicity-of-amines') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Basicity of Amines</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Amines act as bases because the nitrogen lone pair can accept a proton. Their basic strength depends on how available that lone pair is and how stable the protonated cation is relative to the neutral amine. <span className="text-sm text-slate-500">NCERT Class 12 Chemistry, Unit 9 Amines, Table 9.3 and structure-basicity relationship</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. K<sub>b</sub>, pK<sub>b</sub>, and Proton Acceptance</h3>
        <div className="my-4 p-4 bg-violet-50 rounded-xl border border-violet-200">
          <p className="font-mono text-sm text-violet-900 text-center">RNH<sub>2</sub> + H<sub>2</sub>O &#8652; RNH<sub>3</sub><sup>+</sup> + OH<sup>-</sup></p>
          <p className="font-mono text-sm text-violet-900 text-center mt-2">K<sub>b</sub> = [RNH<sub>3</sub><sup>+</sup>][OH<sup>-</sup>] / [RNH<sub>2</sub>] &nbsp;&nbsp; pK<sub>b</sub> = -log K<sub>b</sub></p>
          <p className="text-sm text-violet-800 mt-3"><strong>Larger K<sub>b</sub> or smaller pK<sub>b</sub> means a stronger base.</strong> The easier it is to form a stable cation by proton acceptance, the more basic the amine.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. NCERT Table 9.3: Aqueous pK<sub>b</sub> Values</h3>
        <div className="my-4 overflow-x-auto">
          <table className="w-full text-sm border border-slate-200">
            <thead><tr className="bg-slate-100"><th className="p-2 text-left">Base</th><th className="p-2 text-left">Formula</th><th className="p-2">pK<sub>b</sub></th></tr></thead>
            <tbody>
              <tr className="border-t border-slate-200"><td className="p-2">Ammonia</td><td className="p-2 font-mono">NH<sub>3</sub></td><td className="p-2 text-center font-mono">4.75</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">Methanamine</td><td className="p-2 font-mono">CH<sub>3</sub>NH<sub>2</sub></td><td className="p-2 text-center font-mono">3.38</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">N-Methylmethanamine</td><td className="p-2 font-mono">(CH<sub>3</sub>)<sub>2</sub>NH</td><td className="p-2 text-center font-mono">3.27</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">N,N-Dimethylmethanamine</td><td className="p-2 font-mono">(CH<sub>3</sub>)<sub>3</sub>N</td><td className="p-2 text-center font-mono">4.22</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">Ethanamine</td><td className="p-2 font-mono">C<sub>2</sub>H<sub>5</sub>NH<sub>2</sub></td><td className="p-2 text-center font-mono">3.29</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">N-Ethylethanamine</td><td className="p-2 font-mono">(C<sub>2</sub>H<sub>5</sub>)<sub>2</sub>NH</td><td className="p-2 text-center font-mono">3.00</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">N,N-Diethylethanamine</td><td className="p-2 font-mono">(C<sub>2</sub>H<sub>5</sub>)<sub>3</sub>N</td><td className="p-2 text-center font-mono">3.25</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">Benzenamine (aniline)</td><td className="p-2 font-mono">C<sub>6</sub>H<sub>5</sub>NH<sub>2</sub></td><td className="p-2 text-center font-mono">9.38</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">Phenylmethanamine</td><td className="p-2 font-mono">C<sub>6</sub>H<sub>5</sub>CH<sub>2</sub>NH<sub>2</sub></td><td className="p-2 text-center font-mono">4.70</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">N-Methylaniline</td><td className="p-2 font-mono">C<sub>6</sub>H<sub>5</sub>NHCH<sub>3</sub></td><td className="p-2 text-center font-mono">9.30</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">N,N-Dimethylaniline</td><td className="p-2 font-mono">C<sub>6</sub>H<sub>5</sub>N(CH<sub>3</sub>)<sub>2</sub></td><td className="p-2 text-center font-mono">8.92</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm">NCERT notes that aliphatic amines have pK<sub>b</sub> values from 3.00 to 4.22 and are stronger bases than ammonia because alkyl groups release electrons by the +I effect.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Gas-Phase Order</h3>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="font-mono text-base text-amber-900 text-center">tertiary amine &gt; secondary amine &gt; primary amine &gt; NH<sub>3</sub></p>
          <p className="text-sm text-amber-800 mt-3">In the gas phase, the +I effect dominates. More alkyl groups push more electron density toward nitrogen and stabilise the positive charge of the protonated amine.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Aqueous-Phase Order</h3>
        <p>In water, three effects compete: the alkyl-group +I effect, solvation of the substituted ammonium ion, and steric hindrance to hydrogen bonding.</p>
        <div className="grid gap-4 my-6 sm:grid-cols-3">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200"><h4 className="font-bold text-emerald-900">+I effect</h4><p className="text-sm text-emerald-800">Raises electron density and stabilises positive charge.</p></div>
          <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200"><h4 className="font-bold text-cyan-900">Solvation</h4><p className="text-sm text-cyan-800">Hydrogen-bond stabilisation decreases in the order primary &gt; secondary &gt; tertiary ammonium ion.</p></div>
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200"><h4 className="font-bold text-orange-900">Steric effect</h4><p className="text-sm text-orange-800">Groups larger than methyl hinder water from solvating the cation.</p></div>
        </div>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300 space-y-3">
          <div><p className="text-sm font-bold text-slate-800">Methyl-substituted amines:</p><p className="font-mono text-sm text-slate-700">(CH<sub>3</sub>)<sub>2</sub>NH &gt; CH<sub>3</sub>NH<sub>2</sub> &gt; (CH<sub>3</sub>)<sub>3</sub>N &gt; NH<sub>3</sub></p></div>
          <div><p className="text-sm font-bold text-slate-800">Ethyl-substituted amines:</p><p className="font-mono text-sm text-slate-700">(C<sub>2</sub>H<sub>5</sub>)<sub>2</sub>NH &gt; (C<sub>2</sub>H<sub>5</sub>)<sub>3</sub>N &gt; C<sub>2</sub>H<sub>5</sub>NH<sub>2</sub> &gt; NH<sub>3</sub></p></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Why Aniline Is a Weak Base</h3>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <ul className="list-disc pl-5 space-y-2 text-sm text-purple-900">
            <li>The nitrogen lone pair in aniline is conjugated with the benzene ring and is therefore less available for protonation.</li>
            <li>Aniline is represented by five resonance structures, while the anilinium ion has only two Kekule structures.</li>
            <li>The neutral aniline molecule is therefore stabilised relative to its cation, reducing proton acceptability.</li>
            <li>Numerically, aniline has pK<sub>b</sub> 9.38 while ammonia has pK<sub>b</sub> 4.75, so aniline is much weaker.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Substituted Anilines</h3>
        <div className="grid gap-4 my-6 sm:grid-cols-2">
          <div className="bg-green-50 p-5 rounded-xl border border-green-200"><h4 className="font-bold text-green-900 mb-2">Increase basicity</h4><p className="text-sm text-green-900">Electron-releasing groups: -OCH<sub>3</sub> and -CH<sub>3</sub>.</p></div>
          <div className="bg-red-50 p-5 rounded-xl border border-red-200"><h4 className="font-bold text-red-900 mb-2">Decrease basicity</h4><p className="text-sm text-red-900">Electron-withdrawing groups: -NO<sub>2</sub>, -SO<sub>3</sub>H, -COOH, and -X.</p></div>
        </div>
        <p className="text-sm">NCERT gives these as qualitative categories here; it does not assign a universal numerical order among these substituents without specifying their ring positions.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. NCERT Example 9.4</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm font-bold text-blue-900">Decreasing basic strength:</p>
          <p className="font-mono text-sm text-blue-800 mt-2">(C<sub>2</sub>H<sub>5</sub>)<sub>2</sub>NH &gt; C<sub>2</sub>H<sub>5</sub>NH<sub>2</sub> &gt; NH<sub>3</sub> &gt; C<sub>6</sub>H<sub>5</sub>NH<sub>2</sub></p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'carboxylic-acids-reactions-acidity') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Carboxylic Acids: Key Reactions and Acidity</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Carboxylic acids react through O-H cleavage, C-OH cleavage, the complete -COOH group, and substitution in the hydrocarbon part. Their acidity follows directly from the stability of the carboxylate ion. <span className="text-sm text-slate-500">NCERT Class 12 Chemistry, Unit 8, Sections 8.9.1-8.10</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Acid Dissociation and pK<sub>a</sub></h3>
        <div className="my-4 p-4 bg-rose-50 rounded-xl border border-rose-200">
          <p className="font-mono text-sm text-rose-900 text-center">RCOOH + H<sub>2</sub>O &#8652; RCOO<sup>-</sup> + H<sub>3</sub>O<sup>+</sup></p>
          <p className="font-mono text-sm text-rose-900 text-center mt-2">K<sub>a</sub> = [H<sub>3</sub>O<sup>+</sup>][RCOO<sup>-</sup>] / [RCOOH] &nbsp;&nbsp; pK<sub>a</sub> = -log K<sub>a</sub></p>
          <p className="text-sm text-rose-800 mt-3"><strong>Smaller pK<sub>a</sub> means a stronger acid.</strong> NCERT classifies pK<sub>a</sub> &lt; 1 as strong, 1-5 as moderately strong, 5-15 as weak, and &gt;15 as extremely weak.</p>
        </div>
        <div className="my-4 overflow-x-auto">
          <table className="w-full text-sm border border-slate-200">
            <thead><tr className="bg-slate-100"><th className="p-2 text-left">Acid</th><th className="p-2">NCERT pK<sub>a</sub></th><th className="p-2 text-left">Comparison</th></tr></thead>
            <tbody>
              <tr className="border-t border-slate-200"><td className="p-2">Hydrochloric acid</td><td className="p-2 text-center font-mono">-7.0</td><td className="p-2">Mineral acid reference</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">Trifluoroacetic acid</td><td className="p-2 text-center font-mono">0.23</td><td className="p-2">Strongest carboxylic acid cited</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">4-Nitrobenzoic acid</td><td className="p-2 text-center font-mono">3.41</td><td className="p-2">EWG increases acidity</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">Benzoic acid</td><td className="p-2 text-center font-mono">4.19</td><td className="p-2">Aromatic reference</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">4-Methoxybenzoic acid</td><td className="p-2 text-center font-mono">4.46</td><td className="p-2">EDG decreases acidity</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">Ethanoic acid</td><td className="p-2 text-center font-mono">4.76</td><td className="p-2">Aliphatic reference</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2">Phenol / ethanol</td><td className="p-2 text-center font-mono">~10 / ~16</td><td className="p-2">Both weaker than carboxylic acids</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Why Carboxylic Acids Are Acidic</h3>
        <p>The carboxylate ion has two equivalent resonance structures. Its negative charge is delocalised over two electronegative oxygen atoms, so it is more stable than a phenoxide ion, whose resonance structures are non-equivalent and place charge partly on carbon.</p>
        <div className="grid gap-4 my-6 sm:grid-cols-2">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200"><h4 className="font-bold text-blue-900 mb-2">Electron-withdrawing groups</h4><p className="text-sm text-blue-900">Stabilise RCOO<sup>-</sup> by inductive and/or resonance effects and therefore increase acidity.</p></div>
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200"><h4 className="font-bold text-amber-900 mb-2">Electron-donating groups</h4><p className="text-sm text-amber-900">Destabilise RCOO<sup>-</sup> and therefore decrease acidity.</p></div>
        </div>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm font-bold text-slate-800">Increasing electron-withdrawing effect:</p>
          <p className="font-mono text-xs text-slate-700 mt-2">Ph &lt; I &lt; Br &lt; Cl &lt; F &lt; CN &lt; NO<sub>2</sub> &lt; CF<sub>3</sub></p>
          <p className="text-sm font-bold text-slate-800 mt-3">Decreasing acid strength:</p>
          <p className="font-mono text-xs leading-relaxed text-slate-700 mt-2">CF<sub>3</sub>COOH &gt; CCl<sub>3</sub>COOH &gt; CHCl<sub>2</sub>COOH &gt; NO<sub>2</sub>CH<sub>2</sub>COOH &gt; NC-CH<sub>2</sub>COOH &gt; FCH<sub>2</sub>COOH &gt; ClCH<sub>2</sub>COOH &gt; BrCH<sub>2</sub>COOH &gt; HCOOH &gt; ClCH<sub>2</sub>CH<sub>2</sub>COOH &gt; C<sub>6</sub>H<sub>5</sub>COOH &gt; C<sub>6</sub>H<sub>5</sub>CH<sub>2</sub>COOH &gt; CH<sub>3</sub>COOH &gt; CH<sub>3</sub>CH<sub>2</sub>COOH</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Reactions Involving O-H Cleavage</h3>
        <div className="my-4 p-4 bg-cyan-50 rounded-xl border border-cyan-200 space-y-2">
          <p className="font-mono text-sm text-cyan-900">2RCOOH + 2Na &rarr; 2RCOONa + H<sub>2</sub></p>
          <p className="font-mono text-sm text-cyan-900">RCOOH + NaOH &rarr; RCOONa + H<sub>2</sub>O</p>
          <p className="font-mono text-sm text-cyan-900">RCOOH + NaHCO<sub>3</sub> &rarr; RCOONa + H<sub>2</sub>O + CO<sub>2</sub></p>
          <p className="text-sm text-cyan-800">Unlike phenols, carboxylic acids react with carbonates and hydrogencarbonates. CO<sub>2</sub> effervescence detects the carboxyl group.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Reactions Involving C-OH Cleavage</h3>
        <ul className="list-disc pl-5 space-y-3 text-sm">
          <li><strong>Anhydride formation:</strong> heating carboxylic acids with a mineral acid such as H<sub>2</sub>SO<sub>4</sub>, or with P<sub>2</sub>O<sub>5</sub>, gives the corresponding anhydride.</li>
          <li><strong>Esterification:</strong> RCOOH + R&apos;OH &#8652; RCOOR&apos; + H<sub>2</sub>O, catalysed by concentrated H<sub>2</sub>SO<sub>4</sub> or HCl gas. Protonation activates the carbonyl, alcohol adds, proton transfer makes water a good leaving group, and deprotonation gives the ester.</li>
          <li><strong>Amide formation:</strong> RCOOH + NH<sub>3</sub> first gives an ammonium carboxylate; heating at high temperature removes water and gives RCONH<sub>2</sub>.</li>
        </ul>
        <div className="my-4 p-4 bg-orange-50 rounded-xl border border-orange-200 space-y-2">
          <p className="font-mono text-xs text-orange-900">RCOOH + PCl<sub>5</sub> &rarr; RCOCl + POCl<sub>3</sub> + HCl</p>
          <p className="font-mono text-xs text-orange-900">3RCOOH + PCl<sub>3</sub> &rarr; 3RCOCl + H<sub>3</sub>PO<sub>3</sub></p>
          <p className="font-mono text-xs text-orange-900">RCOOH + SOCl<sub>2</sub> &rarr; RCOCl + SO<sub>2</sub> + HCl</p>
          <p className="text-sm text-orange-800">SOCl<sub>2</sub> is preferred because SO<sub>2</sub> and HCl are gases and escape, making purification easier.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Reactions of the Complete -COOH Group</h3>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="font-mono text-sm text-emerald-900">RCOOH &mdash;(i) LiAlH<sub>4</sub>/ether or B<sub>2</sub>H<sub>6</sub>; (ii) H<sub>3</sub>O<sup>+</sup>&rarr; RCH<sub>2</sub>OH</p>
          <p className="text-sm text-emerald-800 mt-2">Diborane is better because it does not easily reduce ester, nitro, or halo groups. NaBH<sub>4</sub> does not reduce the carboxyl group.</p>
        </div>
        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="font-mono text-sm text-red-900">RCOONa &mdash;(NaOH : CaO = 3 : 1, heat)&rarr; RH + Na<sub>2</sub>CO<sub>3</sub></p>
          <p className="text-sm text-red-800 mt-2">This is soda-lime decarboxylation. The product hydrocarbon has one carbon fewer than the original acid. Electrolysis of aqueous alkali-metal carboxylates instead gives a hydrocarbon with twice the number of carbon atoms in the acid&apos;s alkyl group (Kolbe electrolysis).</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Substitution in the Hydrocarbon Part</h3>
        <div className="my-4 p-4 bg-violet-50 rounded-xl border border-violet-200">
          <p className="text-sm text-violet-900"><strong>Hell-Volhard-Zelinsky reaction:</strong> acids containing an alpha-hydrogen react with Cl<sub>2</sub> or Br<sub>2</sub> in the presence of a small amount of red phosphorus, followed by water, to form alpha-halocarboxylic acids.</p>
          <p className="font-mono text-xs text-violet-800 mt-2">RCH<sub>2</sub>COOH &mdash;(i) X<sub>2</sub>/red P; (ii) H<sub>2</sub>O&rarr; RCHXCOOH &nbsp; (X = Cl or Br)</p>
        </div>
        <p>Aromatic carboxylic acids undergo electrophilic substitution with -COOH acting as a <strong>deactivating, meta-directing group</strong>. They do not undergo Friedel-Crafts reaction because the ring is deactivated and AlCl<sub>3</sub> bonds to the carboxyl group.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. NCERT Uses</h3>
        <p className="text-sm">Methanoic acid is used in rubber, textile, dyeing, leather, and electroplating industries; ethanoic acid is a solvent and vinegar component; hexanedioic acid is used for nylon-6,6; benzoate esters are used in perfumery; and sodium benzoate is a food preservative.</p>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'aldehyde-ketone-reactivity') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Aldehyde vs Ketone Reactivity</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Aldehydes and ketones undergo nucleophilic addition at the polar carbonyl group. Aldehydes are generally more reactive because their carbonyl carbon is less crowded and more electrophilic. <span className="text-sm text-slate-500">NCERT Class 12 Chemistry, Aldehydes, Ketones and Carboxylic Acids, Figs. 8.1-8.2 and Example 8.3</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Structure and Polarity of the Carbonyl Group</h3>
        <div className="my-4 p-4 bg-cyan-50 rounded-xl border border-cyan-200">
          <ul className="list-disc pl-5 space-y-2 text-sm text-cyan-950">
            <li>The carbonyl carbon is <strong>sp<sup>2</sup> hybridised</strong> and trigonal coplanar; bond angles are approximately <strong>120 degrees</strong>.</li>
            <li>The pi-electron cloud lies above and below the plane, and oxygen has two non-bonding electron pairs.</li>
            <li>Because oxygen is more electronegative, carbon is <strong>delta+</strong> and electrophilic (Lewis acid), while oxygen is <strong>delta-</strong> and nucleophilic (Lewis base).</li>
            <li>An aldehyde has one carbon group and one H on the carbonyl carbon; a ketone has two carbon groups.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. NCERT Nucleophilic Addition Mechanism</h3>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <ol className="list-decimal pl-5 space-y-2 text-sm text-emerald-950">
            <li>Nu<sup>-</sup> approaches the electrophilic carbon approximately perpendicular to the plane of its sp<sup>2</sup> orbitals.</li>
            <li>The carbon changes from sp<sup>2</sup> to sp<sup>3</sup>, forming a <strong>tetrahedral alkoxide intermediate</strong>.</li>
            <li>The alkoxide rapidly captures H<sup>+</sup> from the medium to form the electrically neutral addition product.</li>
          </ol>
          <p className="font-mono text-sm text-emerald-800 text-center mt-3">&gt;C=O + Nu<sup>-</sup> + H<sup>+</sup> -&gt; &gt;C(OH)(Nu)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Why Aldehydes Are Generally More Reactive</h3>
        <div className="grid gap-4 my-6 sm:grid-cols-2">
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Steric reason</h4>
            <p className="text-sm text-amber-900">A ketone's two relatively large substituents hinder nucleophile approach more than the single large substituent in an aldehyde.</p>
          </div>
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-200">
            <h4 className="font-bold text-violet-900 mb-2">Electronic reason</h4>
            <p className="text-sm text-violet-900">Two electron-donating alkyl groups reduce the electrophilicity of ketone carbonyl carbon more effectively than the one alkyl group of an aldehyde.</p>
          </div>
        </div>
        <div className="my-4 p-4 bg-rose-50 rounded-xl border border-rose-200">
          <p className="text-sm text-rose-900"><strong>NCERT Example 8.3:</strong> benzaldehyde is less reactive than propanal. Conjugation with the benzene ring reduces carbonyl polarity by resonance, so benzaldehyde's carbonyl carbon is less electrophilic.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Important Addition Reactions</h3>
        <div className="my-4 overflow-x-auto">
          <table className="w-full text-sm border border-slate-200">
            <thead><tr className="bg-slate-100"><th className="p-2 text-left">Reagent</th><th className="p-2 text-left">NCERT observation</th></tr></thead>
            <tbody>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">HCN / base</td><td className="p-2">Pure HCN reacts very slowly. Base generates the stronger nucleophile CN<sup>-</sup>, giving cyanohydrins, useful synthetic intermediates.</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">NaHSO<sub>3</sub></td><td className="p-2">Forms crystalline, water-soluble bisulphite adducts. Equilibrium lies largely right for most aldehydes and left for most ketones due to steric reasons.</td></tr>
              <tr className="border-t border-slate-200"><td className="p-2 font-bold">H<sub>2</sub>N-Z</td><td className="p-2">Acid-catalysed reversible addition followed by rapid dehydration gives &gt;C=N-Z derivatives.</td></tr>
            </tbody>
          </table>
        </div>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-900"><strong>Separation and purification:</strong> treating a bisulphite adduct with dilute mineral acid or alkali regenerates the original carbonyl compound. NCERT therefore uses these water-soluble adducts for separation and purification of aldehydes.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. What to Explore</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
          <li>Compare the open attack path of an aldehyde with the crowded path of a ketone.</li>
          <li>Follow carbonyl carbon from planar sp<sup>2</sup> geometry to the tetrahedral sp<sup>3</sup> intermediate, then watch proton capture.</li>
          <li>Use Resonance mode to compare propanal with benzaldehyde.</li>
          <li>Use Bisulphite mode to connect steric hindrance with equilibrium position and purification.</li>
        </ul>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'conductance-concentration') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Conductance vs Concentration</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          How well an electrolyte solution conducts depends on how many ions are present and how freely they move. Tracking conductivity and molar conductivity as a solution is diluted reveals the difference between strong and weak electrolytes — and lets us measure a weak acid's dissociation. <span className="text-sm text-slate-500">NCERT Class 12 · Ch 2 Electrochemistry · §2.4</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Conductivity (κ) and Molar Conductivity (Λm)</h3>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm font-bold text-amber-900">Conductivity κ</p>
          <p className="text-sm text-amber-800 mt-1">Conductance of unit volume of solution between electrodes 1 cm apart with 1 cm² area. <strong>κ always decreases on dilution</strong> — fewer ions per unit volume to carry current.</p>
        </div>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm font-bold text-emerald-900">Molar conductivity Λm</p>
          <p className="font-mono text-sm text-emerald-800 text-center mt-2">Λm = κ × 1000 / c &nbsp;(S cm² mol⁻¹)</p>
          <p className="text-sm text-emerald-700 mt-2"><strong>Λm increases on dilution</strong> — the same one mole of electrolyte spreads through more volume, so more ions conduct.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Strong vs Weak Electrolytes</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm font-bold text-blue-900">Strong electrolytes (KCl, NaCl, HCl)</p>
          <p className="font-mono text-sm text-blue-800 text-center mt-2">Λm = Λ°m − A·√c &nbsp;(Eq 2.23)</p>
          <p className="text-sm text-blue-700 mt-2">A plot of Λm vs √c is a <strong>straight line</strong>; the y-intercept gives Λ°m (limiting molar conductivity) and the slope is −A. For KCl, Λ°m = 150.0 and A = 87.46.</p>
        </div>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="text-sm font-bold text-purple-900">Weak electrolytes (CH₃COOH)</p>
          <p className="text-sm text-purple-800 mt-1">Λm rises <strong>steeply</strong> at low concentration because the degree of dissociation α grows toward 1. Λ°m <em>cannot</em> be found by extrapolation — it is obtained from Kohlrausch's law instead.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Kohlrausch's Law of Independent Migration</h3>
        <div className="my-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
          <p className="font-mono text-lg text-violet-800 text-center"><strong>Λ°m = ν₊·λ°₊ + ν₋·λ°₋</strong> &nbsp;(Eq 2.25)</p>
          <p className="text-sm text-violet-700 text-center mt-2">Each ion contributes its own fixed λ° at infinite dilution.</p>
        </div>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm font-bold text-slate-800">Worked example (NCERT 2.8)</p>
          <p className="text-sm text-slate-700 mt-2">Λ°m(HAc) = Λ°m(HCl) + Λ°m(NaAc) − Λ°m(NaCl) = 425.9 + 91.0 − 126.4 = <strong>390.5 S cm² mol⁻¹</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Weak-Acid Dissociation from Conductivity</h3>
        <div className="my-4 p-4 bg-rose-50 rounded-xl border border-rose-200">
          <p className="font-mono text-sm text-rose-800 text-center">α = Λm / Λ°m &nbsp;(Eq 2.26) &nbsp;·&nbsp; Ka = cα²/(1−α) = c·Λm² / [Λ°m(Λ°m − Λm)] &nbsp;(Eq 2.27)</p>
          <p className="text-sm text-rose-700 mt-2"><strong>NCERT 2.9:</strong> 0.001028 M acetic acid, κ = 4.95×10⁻⁵ ⇒ Λm = 48.15, α = 0.1233, Ka = <strong>1.78×10⁻⁵</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">💧 Water purity &amp; sensors</h4>
          <p className="text-sm">Conductivity meters check the purity of drinking and distilled water (pure water conducts almost nothing) and monitor industrial process streams.</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">🧪 Conductometric titration</h4>
          <p className="text-sm">Following conductivity during a titration pinpoints the equivalence point even in coloured or dilute solutions, where indicators fail.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'ideal-nonideal-solutions') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Ideal vs Non-ideal Solutions</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When two volatile liquids mix, their combined vapour pressure either follows Raoult's straight-line prediction (ideal) or bows above/below it (non-ideal) — and the molecular reason is the balance of A–A, B–B and A–B forces. <span className="text-sm text-slate-500">NCERT Class 12 · Ch 1 Solutions · §1.4–§1.5</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Raoult's Law for Two Volatile Liquids</h3>
        <div className="my-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
          <p className="font-mono text-lg text-violet-800 text-center"><strong>p₁ = p₁°·x₁ &nbsp; p₂ = p₂°·x₂ &nbsp; p_total = x₁p₁° + x₂p₂°</strong></p>
          <p className="text-sm text-violet-700 text-center mt-2">Each component's partial pressure = its pure vapour pressure × its mole fraction in the liquid.</p>
        </div>
        <p>The vapour is always richer in the more volatile component (Dalton's law: yᵢ = pᵢ / p_total).</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Ideal Solutions</h3>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-800">Obey Raoult's law over the <strong>entire</strong> composition range because A–B forces ≈ A–A ≈ B–B.</p>
          <p className="font-mono text-sm text-slate-700 text-center mt-2">Δmix H = 0 &nbsp;·&nbsp; Δmix V = 0</p>
          <p className="text-xs text-slate-600 mt-2">No heat change, no volume change on mixing. Examples: benzene + toluene, n-hexane + n-heptane, bromoethane + chloroethane.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Non-ideal Solutions — Two Deviations</h3>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm font-bold text-amber-900">Positive deviation (P higher than Raoult)</p>
          <p className="text-sm text-amber-800 mt-1">A–B forces <strong>weaker</strong> than A–A/B–B ⇒ molecules escape more easily ⇒ vapour pressure rises. <span className="font-mono">Δmix H &gt; 0, Δmix V &gt; 0</span> (endothermic, expands).</p>
          <p className="text-xs text-amber-700 mt-2">Example: ethanol + acetone (acetone breaks ethanol's H-bonds); also CS₂ + acetone.</p>
        </div>
        <div className="my-4 p-4 bg-cyan-50 rounded-xl border border-cyan-200">
          <p className="text-sm font-bold text-cyan-900">Negative deviation (P lower than Raoult)</p>
          <p className="text-sm text-cyan-800 mt-1">A–B forces <strong>stronger</strong> than A–A/B–B ⇒ molecules held back ⇒ vapour pressure falls. <span className="font-mono">Δmix H &lt; 0, Δmix V &lt; 0</span> (exothermic, contracts).</p>
          <p className="text-xs text-cyan-700 mt-2">Example: chloroform + acetone (new H-bond between CHCl₃–H and acetone C=O); also phenol + aniline.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Azeotropes</h3>
        <p>Large deviations create <strong>azeotropes</strong> — mixtures with the <em>same composition in liquid and vapour</em>, boiling at a constant temperature, so they cannot be separated by fractional distillation.</p>
        <div className="my-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
          <p className="text-sm font-bold text-orange-900">Minimum-boiling azeotrope</p>
          <p className="text-sm text-orange-800 mt-1">From large <strong>positive</strong> deviation. Boils below both components. <strong>Ethanol–water at ≈ 95% v/v ethanol</strong> — why pure (100%) ethanol cannot be obtained by distillation.</p>
        </div>
        <div className="my-4 p-4 bg-rose-50 rounded-xl border border-rose-200">
          <p className="text-sm font-bold text-rose-900">Maximum-boiling azeotrope</p>
          <p className="text-sm text-rose-800 mt-1">From large <strong>negative</strong> deviation. Boils above both components. <strong>Nitric acid–water at ≈ 68% HNO₃ by mass, bp 393.5 K</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Worked Check (NCERT Intext 1.8)</h3>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm text-emerald-800">Pure A and B have p° = 450 and 700 mm Hg at 350 K. If p_total = 600 mm Hg, then <span className="font-mono">600 = 450·x_A + 700·(1−x_A)</span> ⇒ x_A = 0.4, x_B = 0.6. Vapour: y_B = (700×0.6)/600 = <strong>0.7</strong>, y_A = 0.3 — vapour is richer in the more volatile B.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'solution-colligative') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Solution Concentration &amp; Colligative Effect</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Some properties of a solution depend only on the <strong>number</strong> of dissolved solute particles, not on what they are. These are the colligative properties — and they let chemists weigh a molecule without a balance. <span className="text-sm text-slate-500">NCERT Class 12 · Ch 1 Solutions · §1.6</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Concentration — Molality is the Key Unit</h3>
        <p>Colligative formulas use <strong>molality (m)</strong>, not molarity, because mass does not change with temperature while volume does.</p>
        <div className="my-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
          <p className="font-mono text-sm text-teal-800 text-center">molality (m) = moles of solute / mass of solvent (in kg)</p>
          <p className="text-xs text-teal-700 mt-2 text-center">Mole fraction and mass % are also temperature-independent; molarity (mol/L) is not.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Four Colligative Properties</h3>

        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm font-bold text-slate-800">1 · Relative lowering of vapour pressure</p>
          <p className="font-mono text-sm text-slate-700 text-center mt-2">(p°₁ − p₁) / p°₁ = i · n₂ / n₁</p>
          <p className="text-xs text-slate-600 mt-2">A non-volatile solute lowers the solvent's vapour pressure; the relative lowering equals the mole fraction of solute (Raoult's law).</p>
        </div>

        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm font-bold text-red-900">2 · Elevation of boiling point (ΔT_b)</p>
          <p className="font-mono text-sm text-red-800 text-center mt-2">ΔT_b = i · K_b · m</p>
          <p className="text-xs text-red-700 mt-2">K_b = molal elevation (ebullioscopic) constant of the solvent. For water K_b = 0.52, benzene 2.53 K kg mol⁻¹ (Table 1.3).</p>
        </div>

        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm font-bold text-blue-900">3 · Depression of freezing point (ΔT_f)</p>
          <p className="font-mono text-sm text-blue-800 text-center mt-2">ΔT_f = i · K_f · m</p>
          <p className="text-xs text-blue-700 mt-2">K_f = molal depression (cryoscopic) constant. For water K_f = 1.86, benzene 5.12 K kg mol⁻¹. The solution freezes when its vapour pressure equals that of the pure solid solvent.</p>
        </div>

        <div className="my-4 p-4 bg-violet-50 rounded-xl border border-violet-200">
          <p className="text-sm font-bold text-violet-900">4 · Osmotic pressure (π)</p>
          <p className="font-mono text-sm text-violet-800 text-center mt-2">π = i · C · R · T</p>
          <p className="text-xs text-violet-700 mt-2">Solvent flows through a semipermeable membrane into the solution; π is the pressure needed to stop it. Best for macromolecules because it is measurable at room temperature.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. van't Hoff Factor (i)</h3>
        <p>Colligative properties count <em>particles</em>. The van't Hoff factor corrects for solutes that split apart or clump together:</p>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="font-mono text-sm text-amber-800 text-center">i = (observed colligative effect) / (effect if no dissociation/association)</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-amber-900 mt-3">
            <li><strong>i = 1</strong> — non-electrolytes (urea, glucose).</li>
            <li><strong>i &gt; 1</strong> — dissociation: NaCl, KCl → i ≈ 2; K₂SO₄ → i ≈ 3 (Table 1.4).</li>
            <li><strong>i &lt; 1</strong> — association: ethanoic acid in benzene → i ≈ 0.5 (dimerises).</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Finding Molar Mass</h3>
        <div className="my-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="font-mono text-lg text-emerald-800 text-center"><strong>M₂ = (K_f · w₂ · 1000) / (ΔT_f · w₁)</strong></p>
          <p className="text-sm text-emerald-700 text-center mt-2">w₂ = mass of solute, w₁ = mass of solvent (g). A matching form uses K_b and ΔT_b.</p>
        </div>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm font-bold text-slate-800">Worked example (NCERT 1.8)</p>
          <p className="text-sm text-slate-700 mt-2">1.80 g of a non-volatile solute in 90 g benzene raises the boiling point by 0.88 K (K_b = 2.53). <span className="font-mono">M₂ = (2.53 × 1.80 × 1000) / (0.88 × 90) = 58 g mol⁻¹</span>.</p>
        </div>
        <div className="my-4 p-4 bg-rose-50 rounded-xl border border-rose-200">
          <p className="text-sm font-bold text-rose-900">Abnormal molar mass</p>
          <p className="text-sm text-rose-800 mt-2"><strong>Dissociation</strong> ⇒ more particles ⇒ <em>lower</em> apparent molar mass. <strong>Association</strong> ⇒ fewer particles ⇒ <em>higher</em> apparent molar mass. The factor i corrects both.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">❄️ Salt on icy roads &amp; antifreeze</h4>
          <p className="text-sm">NaCl depresses the freezing point of water (i ≈ 2), melting ice below 0 °C. Ethylene glycol in a car radiator both lowers the freezing point and raises the boiling point (NCERT Ex 1.9).</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">🩸 Osmosis in biology &amp; medicine</h4>
          <p className="text-sm">Cells live in isotonic fluid; IV fluids must match blood's osmotic pressure. Reverse osmosis (pressure &gt; π) purifies sea water.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'periodic-trends-explorer') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Periodic Trends in Properties of Elements</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Four fundamental properties — <strong>atomic radius</strong>, <strong>ionisation enthalpy</strong>, <strong>electronegativity</strong>, and <strong>metallic character</strong> — all flow from one root cause: the trade-off between nuclear charge and shell number. <span className="text-sm text-slate-500">NCERT Class 11 · Ch 3 Classification of Elements &amp; Periodicity · §3.7 + Fig 3.7</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Atomic Radius</h3>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-900"><strong>Across a period (→):</strong> decreases. Effective nuclear charge rises while shell number stays constant — valence electrons are pulled in closer.</p>
          <p className="text-sm text-amber-900 mt-2"><strong>Down a group (↓):</strong> increases. Each row adds a new shell; outer electrons move farther from the nucleus.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Ionisation Enthalpy</h3>
        <p>The energy needed to remove the outermost electron from a gaseous atom: X(g) → X⁺(g) + e⁻.</p>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm text-emerald-900"><strong>Across (→):</strong> increases — smaller radius + larger Z<sub>eff</sub> ⇒ tighter grip on the outer electron.</p>
          <p className="text-sm text-emerald-900 mt-2"><strong>Down (↓):</strong> decreases — outer electron is farther and more shielded.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Electronegativity (Pauling Scale)</h3>
        <p>The tendency of an atom in a bond to attract shared electrons.</p>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="text-sm text-purple-900"><strong>Across (→):</strong> increases — same reason as IE.</p>
          <p className="text-sm text-purple-900 mt-2"><strong>Down (↓):</strong> decreases — atomic radius grows.</p>
        </div>
        <p className="text-sm font-bold text-slate-800 mt-4">NCERT Table 3.8(a) — Period 2 Pauling values</p>
        <div className="my-2 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-purple-50 text-purple-900">
              <tr><th className="px-3 py-2">Li</th><th className="px-3 py-2">Be</th><th className="px-3 py-2">B</th><th className="px-3 py-2">C</th><th className="px-3 py-2">N</th><th className="px-3 py-2">O</th><th className="px-3 py-2">F</th></tr>
            </thead>
            <tbody className="text-slate-700 text-center font-mono">
              <tr className="border-t border-slate-100"><td>1.0</td><td>1.5</td><td>2.0</td><td>2.5</td><td>3.0</td><td>3.5</td><td>4.0</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm font-bold text-slate-800 mt-4">Group 17 — going down</p>
        <div className="my-2 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-purple-50 text-purple-900">
              <tr><th className="px-3 py-2">F</th><th className="px-3 py-2">Cl</th><th className="px-3 py-2">Br</th><th className="px-3 py-2">I</th><th className="px-3 py-2">At</th></tr>
            </thead>
            <tbody className="text-slate-700 text-center font-mono">
              <tr className="border-t border-slate-100"><td>4.0</td><td>3.0</td><td>2.8</td><td>2.5</td><td>2.2</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Metallic Character</h3>
        <div className="my-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
          <p className="text-sm text-teal-900"><strong>Inversely related to electronegativity.</strong> Across a period metallic character <em>decreases</em>; down a group it <em>increases</em>.</p>
          <p className="text-sm text-teal-900 mt-2">Hence reactivity peaks at the <strong>two extremes</strong> (Group 1 metals by losing e⁻ ; Group 17 non-metals by gaining e⁻) and is lowest in the centre.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Oxide Character</h3>
        <p className="text-sm">From NCERT summary: oxides of left-block elements are <strong>basic</strong>, right-block oxides are <strong>acidic</strong>, central elements give <strong>amphoteric or neutral</strong> oxides. Direct consequence of electronegativity trend.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Real-World Applications</h3>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">Alkali Metals in Sodium-Vapour Lamps</h4>
          <p className="text-sm">Na's low IE (496 kJ mol⁻¹) is why the bulb glows yellow at modest voltage — outer electrons jump easily.</p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">Why F₂ Bleaches and I₂ Barely Reacts</h4>
          <p className="text-sm">F has the highest electronegativity (4.0) and smallest radius — it rips electrons off almost anything. I (2.5) is mild enough to colour starch but not strip pigments.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'hydrogen-bonding-molecular-interaction') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Hydrogen Bonding and Molecular Interaction</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When H is covalently bonded to F, O, or N, the electron pair shifts toward the electronegative atom. The hydrogen acquires δ⁺ and the other atom δ⁻ — and the resulting electrostatic attraction <strong>between</strong> molecules is the <strong>hydrogen bond</strong>. <span className="text-sm text-slate-500">NCERT Class 11 · Ch 4 Chemical Bonding &amp; Molecular Structure · §4.9</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. NCERT Definition</h3>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-900"><strong>Hydrogen bond:</strong> the attractive force that binds the hydrogen atom of one molecule with an electronegative atom (F, O or N) of another molecule. It is <strong>weaker than a covalent bond</strong> and is drawn as a <strong>dotted line</strong>; covalent bonds use a solid line.</p>
        </div>
        <p className="text-sm">Example chain in HF (NCERT):</p>
        <div className="my-2 p-3 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-sm text-slate-800 text-center">H<sup>δ+</sup>—F<sup>δ−</sup> · · · H<sup>δ+</sup>—F<sup>δ−</sup> · · · H<sup>δ+</sup>—F<sup>δ−</sup></p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Cause of Formation (§4.9.1)</h3>
        <p>When H is bonded to a strongly electronegative element X, the shared electron pair moves toward X. The hydrogen ends up <strong>electropositive (δ⁺)</strong>, X ends up <strong>electronegative (δ⁻)</strong>. The H<sup>δ+</sup> of one molecule electrostatically attracts the X<sup>δ−</sup> of a neighbour.</p>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="text-sm text-purple-900"><strong>State dependence:</strong> magnitude is <strong>maximum in the solid state</strong> and <strong>minimum in the gaseous state</strong> — H-bonding strongly influences both structure and properties of these compounds.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Two Types of H-Bonds (§4.9.2)</h3>
        <div className="my-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
          <p className="text-sm text-teal-900"><strong>1 · Intermolecular H-bond</strong> — between two different molecules of the same or different compounds. Examples: HF, alcohols, water.</p>
        </div>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm text-emerald-900"><strong>2 · Intramolecular H-bond</strong> — H sits between two electronegative atoms in the <em>same</em> molecule. Canonical example: <strong>o-nitrophenol</strong> (NCERT Fig 4.22), where H sits between the phenol-O and the NO₂-O.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Why H-Bonding Matters</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>Anomalously high boiling points</strong> of H₂O, HF, NH₃ vs their heavier group-mates (H₂S, HCl, PH₃) — heavier molecules <em>without</em> H-bonding boil lower.</li>
          <li><strong>Ice less dense than water</strong> — open H-bonded lattice in the solid state.</li>
          <li><strong>Solubility</strong> of small alcohols and amines in water — they swap into the H-bond network.</li>
          <li><strong>Lower b.p. of o-nitrophenol vs m- and p-nitrophenol</strong> — intramolecular H-bond "uses up" the H, so it cannot link to neighbours.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">Water of Life</h4>
          <p className="text-sm">Water's huge specific heat, surface tension and unique density profile all trace back to H-bonding. Without it, oceans would freeze solid from the bottom up and life as we know it would not exist.</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">DNA Double Helix</h4>
          <p className="text-sm">A–T pairs share <strong>2</strong> H-bonds; G–C pairs share <strong>3</strong>. The whole genetic code is held by H-bonds weak enough to be peeled apart by enzymes, strong enough to keep the strands together.</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">Cotton vs Silk</h4>
          <p className="text-sm">Cellulose chains in cotton are stitched together by H-bonds between OH groups; silk proteins are stitched by H-bonds between N–H and C=O. Both fabrics get their strength from this tiny dotted line.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'weak-acid-base-ionization') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Ionization of Weak Acids/Bases and Equilibrium K</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Weak acids and bases do <strong>not</strong> ionize completely in water. They set up an <strong>equilibrium</strong> between the undissociated molecule and its ions, governed by the ionization constant K<sub>a</sub> (acids) or K<sub>b</sub> (bases). <span className="text-sm text-slate-500">NCERT Class 11 · Ch 6 Equilibrium · §6.11.3 – §6.11.5</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Ionization of a Weak Acid</h3>
        <p>For a generic weak acid HX in water:</p>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="font-mono text-lg text-amber-800 text-center">HX(aq) + H<sub>2</sub>O(l) ⇌ H<sub>3</sub>O<sup>+</sup>(aq) + X<sup>−</sup>(aq)</p>
        </div>
        <p>If <em>c</em> is the initial concentration and <em>α</em> the degree (extent) of ionization, the equilibrium concentrations are HX = c(1−α), H<sub>3</sub>O<sup>+</sup> = cα, X<sup>−</sup> = cα. Substituting into the equilibrium expression:</p>
        <div className="my-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="font-mono text-lg text-purple-700 text-center">K<sub>a</sub> = [H<sub>3</sub>O<sup>+</sup>][X<sup>−</sup>] / [HX] = cα² / (1 − α) &nbsp; <span className="text-sm">(Eqn 6.30)</span></p>
          <p className="font-mono text-base text-purple-700 text-center mt-2">pK<sub>a</sub> = − log K<sub>a</sub> &nbsp; <span className="text-sm">(Eqn 6.31)</span></p>
        </div>
        <p className="text-sm">A <strong>larger K<sub>a</sub></strong> ⇒ stronger acid. K<sub>a</sub> is dimensionless (standard-state 1 M). Per-cent dissociation:</p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-base text-slate-700 text-center">% dissociation = [HA]<sub>dissociated</sub> / [HA]<sub>initial</sub> × 100% &nbsp; <span className="text-sm">(Eqn 6.32)</span></p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Selected K<sub>a</sub> Values (NCERT Table 6.6, 298 K)</h3>
        <div className="my-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 text-amber-900">
              <tr><th className="px-3 py-2 text-left">Acid</th><th className="px-3 py-2 text-left">K<sub>a</sub></th><th className="px-3 py-2 text-left">pK<sub>a</sub></th></tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-t border-slate-100"><td className="px-3 py-1.5">HF</td><td className="font-mono">6.8 × 10⁻⁴</td><td className="font-mono">3.17</td></tr>
              <tr className="border-t border-slate-100 bg-slate-50"><td className="px-3 py-1.5">HCOOH (formic)</td><td className="font-mono">1.8 × 10⁻⁴</td><td className="font-mono">3.74</td></tr>
              <tr className="border-t border-slate-100"><td className="px-3 py-1.5">HOCl</td><td className="font-mono">2.5 × 10⁻⁵</td><td className="font-mono">4.60</td></tr>
              <tr className="border-t border-slate-100 bg-slate-50"><td className="px-3 py-1.5">CH<sub>3</sub>COOH (acetic)</td><td className="font-mono">1.8 × 10⁻⁵</td><td className="font-mono">4.74</td></tr>
              <tr className="border-t border-slate-100"><td className="px-3 py-1.5">HCN</td><td className="font-mono">4.9 × 10⁻¹⁰</td><td className="font-mono">9.31</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Ionization of a Weak Base</h3>
        <p>For a weak base B (or MOH) in water:</p>
        <div className="my-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
          <p className="font-mono text-lg text-teal-800 text-center">B(aq) + H<sub>2</sub>O(l) ⇌ BH<sup>+</sup>(aq) + OH<sup>−</sup>(aq)</p>
        </div>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="font-mono text-lg text-purple-700 text-center">K<sub>b</sub> = [BH<sup>+</sup>][OH<sup>−</sup>] / [B] = cα² / (1 − α) &nbsp; <span className="text-sm">(Eqn 6.33)</span></p>
          <p className="font-mono text-base text-purple-700 text-center mt-2">pK<sub>b</sub> = − log K<sub>b</sub> &nbsp; <span className="text-sm">(Eqn 6.34)</span></p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Selected K<sub>b</sub> Values (NCERT Table 6.7, 298 K)</h3>
        <div className="my-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-teal-50 text-teal-900">
              <tr><th className="px-3 py-2 text-left">Base</th><th className="px-3 py-2 text-left">K<sub>b</sub></th></tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-t border-slate-100"><td className="px-3 py-1.5">(CH<sub>3</sub>)<sub>2</sub>NH (dimethylamine)</td><td className="font-mono">5.4 × 10⁻⁴</td></tr>
              <tr className="border-t border-slate-100 bg-slate-50"><td className="px-3 py-1.5">(C<sub>2</sub>H<sub>5</sub>)<sub>3</sub>N (triethylamine)</td><td className="font-mono">6.45 × 10⁻⁵</td></tr>
              <tr className="border-t border-slate-100"><td className="px-3 py-1.5">NH<sub>3</sub> (ammonia)</td><td className="font-mono">1.77 × 10⁻⁵</td></tr>
              <tr className="border-t border-slate-100 bg-slate-50"><td className="px-3 py-1.5">C<sub>5</sub>H<sub>5</sub>N (pyridine)</td><td className="font-mono">1.77 × 10⁻⁹</td></tr>
              <tr className="border-t border-slate-100"><td className="px-3 py-1.5">C<sub>6</sub>H<sub>5</sub>NH<sub>2</sub> (aniline)</td><td className="font-mono">4.27 × 10⁻¹⁰</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Relation between K<sub>a</sub> and K<sub>b</sub> (§6.11.5)</h3>
        <p>For a conjugate acid–base pair (e.g., NH<sub>4</sub><sup>+</sup> and NH<sub>3</sub>), the two ionization constants are not independent:</p>
        <div className="my-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
          <p className="font-mono text-xl text-violet-800 text-center"><strong>K<sub>a</sub> × K<sub>b</sub> = K<sub>w</sub> = 1.0 × 10⁻¹⁴</strong> at 298 K &nbsp; <span className="text-sm">(Eqn 6.36)</span></p>
          <p className="font-mono text-base text-violet-700 text-center mt-2"><strong>pK<sub>a</sub> + pK<sub>b</sub> = pK<sub>w</sub> = 14</strong></p>
        </div>
        <p className="text-sm">Knowing one fixes the other. A <strong>strong acid has a weak conjugate base</strong>, and vice-versa.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Worked NCERT Example</h3>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-700"><strong>Problem 6.20 (NCERT).</strong> 0.08 M HOCl, K<sub>a</sub> = 2.5 × 10⁻⁵. Find pH and % dissociation.</p>
          <p className="text-sm text-slate-700 mt-2">Apply K<sub>a</sub> ≈ x²/0.08 ⇒ x = [H<sup>+</sup>] = 1.41 × 10⁻³ M. <strong>pH = 2.85</strong>. % dissociation = 1.41 × 10⁻³ / 0.08 × 100 = <strong>1.76 %</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. Real-World Applications</h3>
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm my-4">
          <h4 className="font-bold text-red-900 mb-2">Blood pH</h4>
          <p className="text-sm">Human blood is held at pH 7.4 by the H<sub>2</sub>CO<sub>3</sub>/HCO<sub>3</sub><sup>−</sup> weak-acid couple — K<sub>a</sub> × K<sub>b</sub> = K<sub>w</sub> governs how it absorbs metabolic H<sup>+</sup>.</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">Vinegar and Soft Drinks</h4>
          <p className="text-sm">Acetic acid (K<sub>a</sub> = 1.8 × 10⁻⁵) only ~1 % ionizes — that's why vinegar tangs without burning. Carbonic and citric acids do the same in soft drinks; a strong acid at the same M would etch the can.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'redox-oxidation-number') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Redox Reactions and Oxidation Number</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          A <strong>redox</strong> reaction is one where the oxidation number of at least one element changes. Oxidation and reduction always occur together. <span className="text-sm text-slate-500">NCERT Class 11 · Unit 7 Redox Reactions · §7.2 – §7.5</span>
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Three Layered Definitions</h3>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-700"><strong>1 · Classical (§7.1):</strong> oxidation = gain of O / loss of H / gain of electronegative element / loss of electropositive element. Reduction = the reverse.</p>
          <p className="text-sm text-slate-700 mt-2"><strong>2 · Electron-transfer (§7.2):</strong> <span className="text-amber-700 font-bold">Oxidation = loss of electrons</span> · <span className="text-teal-700 font-bold">Reduction = gain of electrons</span>.</p>
          <p className="text-sm text-slate-700 mt-2"><strong>3 · Oxidation-number (§7.3):</strong> assign each atom an ON; an <em>increase</em> = oxidation, a <em>decrease</em> = reduction.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The 7 Rules for Assigning Oxidation Number (§7.3)</h3>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <ol className="list-decimal pl-5 space-y-2 text-sm text-amber-900">
            <li><strong>Free element</strong> (H<sub>2</sub>, O<sub>2</sub>, Cl<sub>2</sub>, O<sub>3</sub>, P<sub>4</sub>, S<sub>8</sub>, Na, Mg, Al) ⇒ ON = <strong>0</strong>.</li>
            <li><strong>Monoatomic ion</strong> ⇒ ON = charge (Na<sup>+</sup> = +1, Mg<sup>2+</sup> = +2, Cl<sup>−</sup> = −1, O<sup>2−</sup> = −2).</li>
            <li><strong>Alkali</strong> = +1, <strong>alkaline earth</strong> = +2, <strong>Al</strong> = +3 in compounds.</li>
            <li><strong>Oxygen</strong> = −2 normally; <strong>−1 in peroxides</strong> (H<sub>2</sub>O<sub>2</sub>, Na<sub>2</sub>O<sub>2</sub>); <strong>−½ in superoxides</strong> (KO<sub>2</sub>, RbO<sub>2</sub>); <strong>+2 in OF<sub>2</sub>, +1 in O<sub>2</sub>F<sub>2</sub></strong>.</li>
            <li><strong>Hydrogen</strong> = +1 normally; <strong>−1 in metallic hydrides</strong> (LiH, NaH, CaH<sub>2</sub>).</li>
            <li><strong>Fluorine always −1.</strong> Cl, Br, I = −1 as halides, but positive when bonded to O.</li>
            <li><strong>Sum of ON</strong> = 0 for neutral compound; = charge for polyatomic ion.</li>
          </ol>
        </div>
        <p className="text-sm">For molecules with two or more atoms of the same element (e.g., Na<sub>2</sub>S<sub>4</sub>O<sub>6</sub>) the calculated ON is the <strong>average</strong> — hence the "fractional ON paradox".</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Definitions (§7.3 boxed)</h3>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="text-sm text-purple-900"><strong>Oxidation:</strong> an <em>increase</em> in the ON of an element.</p>
          <p className="text-sm text-purple-900 mt-1"><strong>Reduction:</strong> a <em>decrease</em> in the ON of an element.</p>
          <p className="text-sm text-purple-900 mt-1"><strong>Oxidant (oxidising agent):</strong> a reagent that increases the ON of another element (itself reduced).</p>
          <p className="text-sm text-purple-900 mt-1"><strong>Reductant (reducing agent):</strong> a reagent that lowers the ON of another element (itself oxidised).</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Classification of Redox Reactions (§7.4)</h3>
        <div className="grid gap-3 my-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200"><strong className="text-blue-900">Combination:</strong> <span className="font-mono text-sm">N<sub>2</sub> + O<sub>2</sub> → 2 NO</span></div>
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-200"><strong className="text-orange-900">Decomposition:</strong> <span className="font-mono text-sm">2 Pb(NO<sub>3</sub>)<sub>2</sub> → 2 PbO + 4 NO<sub>2</sub> + O<sub>2</sub></span></div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200"><strong className="text-emerald-900">Displacement:</strong> <span className="font-mono text-sm">NaH + H<sub>2</sub>O → NaOH + H<sub>2</sub></span></div>
          <div className="p-3 bg-violet-50 rounded-xl border border-violet-200"><strong className="text-violet-900">Disproportionation:</strong> same element oxidised AND reduced. <span className="font-mono text-sm">2 H<sub>2</sub>O<sub>2</sub> → 2 H<sub>2</sub>O + O<sub>2</sub></span>; <span className="font-mono text-sm">Cl<sub>2</sub> + 2 OH<sup>−</sup> → ClO<sup>−</sup> + Cl<sup>−</sup> + H<sub>2</sub>O</span></div>
        </div>
        <p className="text-sm"><strong>Fluorine cannot disproportionate</strong> (no positive ON) and <strong>ClO<sub>4</sub><sup>−</sup> cannot</strong> (Cl already at +7).</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Balancing Redox Equations (§7.5)</h3>
        <p className="text-sm font-bold text-slate-800">Method A · Oxidation-Number method (5 steps)</p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700">
            <li>Write the skeletal equation.</li>
            <li>Assign ON to every atom; identify which change.</li>
            <li>Multiply species so that <strong>total increase = total decrease</strong>.</li>
            <li>Balance ionic charges by adding <strong>H<sup>+</sup></strong> (acidic) or <strong>OH<sup>−</sup></strong> (basic).</li>
            <li>Balance H and O by adding <strong>H<sub>2</sub>O</strong>.</li>
          </ol>
        </div>
        <p className="text-sm font-bold text-slate-800">Worked Problem 7.8 — Cr<sub>2</sub>O<sub>7</sub><sup>2−</sup> + SO<sub>3</sub><sup>2−</sup> in acidic medium</p>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="font-mono text-sm text-amber-900">Cr<sub>2</sub>O<sub>7</sub><sup>2−</sup> + 3 SO<sub>3</sub><sup>2−</sup> + 8 H<sup>+</sup> → 2 Cr<sup>3+</sup> + 3 SO<sub>4</sub><sup>2−</sup> + 4 H<sub>2</sub>O</p>
          <p className="text-xs text-amber-800 mt-2">Cr ↓ +6 → +3 (×2 = decrease 6) · S ↑ +4 → +6 (×3 = increase 6) · 8 H<sup>+</sup> balances charges · 4 H<sub>2</sub>O balances H and O.</p>
        </div>
        <p className="text-sm font-bold text-slate-800 mt-4">Method B · Half-Reaction (ion-electron) method (7 steps)</p>
        <div className="my-4 p-4 bg-teal-50 rounded-xl border border-teal-200">
          <p className="font-mono text-sm text-teal-900">6 Fe<sup>2+</sup> + Cr<sub>2</sub>O<sub>7</sub><sup>2−</sup> + 14 H<sup>+</sup> → 6 Fe<sup>3+</sup> + 2 Cr<sup>3+</sup> + 7 H<sub>2</sub>O</p>
          <p className="text-xs text-teal-800 mt-2">OX half: Fe<sup>2+</sup> → Fe<sup>3+</sup> + e<sup>−</sup>. RED half: Cr<sub>2</sub>O<sub>7</sub><sup>2−</sup> + 14 H<sup>+</sup> + 6 e<sup>−</sup> → 2 Cr<sup>3+</sup> + 7 H<sub>2</sub>O. Multiply OX by 6 to equalise e<sup>−</sup>, add the halves.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Worked NCERT Example (Problem 7.4)</h3>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-sm text-slate-800">2 Cu<sub>2</sub>O(s) + Cu<sub>2</sub>S(s) → 6 Cu(s) + SO<sub>2</sub>(g)</p>
          <p className="text-sm text-slate-700 mt-2">Cu in Cu<sub>2</sub>O: +1 → 0 (reduction). S in Cu<sub>2</sub>S: −2 → +4 (oxidation). <strong>Cu<sub>2</sub>O is the oxidant</strong>, <strong>Cu<sub>2</sub>S is the reductant</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. Real-World Applications</h3>
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm my-4">
          <h4 className="font-bold text-red-900 mb-2">Household Bleach</h4>
          <p className="text-sm">Cl<sub>2</sub> + 2 OH<sup>−</sup> → ClO<sup>−</sup> + Cl<sup>−</sup> + H<sub>2</sub>O (Eqn 7.48). The same Cl atom disproportionates into +1 (the colour-killing hypochlorite) and −1 (harmless chloride).</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">Thermite Welding of Rails</h4>
          <p className="text-sm">3 Fe<sub>3</sub>O<sub>4</sub> + 8 Al → 9 Fe + 4 Al<sub>2</sub>O<sub>3</sub>. Al is oxidised (0 → +3), Fe is reduced (+8/3 → 0). Used to weld railway tracks on site.</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">Cellular Respiration</h4>
          <p className="text-sm">A controlled redox cascade in every living cell — carbon in glucose is oxidised toward CO<sub>2</sub>, oxygen is reduced to H<sub>2</sub>O. All the energy that powers you flows through ON changes.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  // --- UNIT VIII: ORGANIC CHEMISTRY ---

  if (topic?.id === 'qualitative-analysis-organic') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Detection of Elements â€” Qualitative Analysis (Lassaigne's Test)</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Organic compounds are predominantly <strong>covalent</strong>. Standard inorganic qualitative tests rely on ionic reactions. To detect heteroatoms (N, S, Halogens, P), we must first <strong>convert them from covalent form into ionic form</strong>.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Detection of Carbon and Hydrogen</h3>
        <p>
          The organic compound is heated with <strong>Copper(II) oxide (CuO)</strong>, which acts as an oxidizing agent.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">C + 2CuO â†’ 2Cu + COâ‚‚</p>
          <p className="font-mono text-lg text-brand-primary text-center">2H + CuO â†’ Cu + Hâ‚‚O</p>
          <p className="text-sm text-slate-600 mt-2 text-center">COâ‚‚ turns lime water milky (CaCOâ‚ƒ). Hâ‚‚O turns anhydrous CuSOâ‚„ blue.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Lassaigne&apos;s Test (Sodium Fusion)</h3>
        <p>
          The organic compound is <strong>fused with metallic sodium</strong> at high temperature. Sodium is highly electropositive â€” at red heat, it breaks the covalent bonds and reacts with heteroatoms to form stable, water-soluble <strong>ionic sodium salts</strong>.
        </p>
        <div className="my-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
          <p className="font-mono text-sm text-emerald-700">For Nitrogen: Na + C + N â†’ NaCN (Sodium cyanide)</p>
          <p className="font-mono text-sm text-emerald-700">For Sulphur: 2Na + S â†’ Naâ‚‚S (Sodium sulphide)</p>
          <p className="font-mono text-sm text-emerald-700">For Halogen: Na + X â†’ NaX (Sodium halide)</p>
        </div>
        <p className="text-sm text-slate-600 italic">The fused mass is extracted with boiling distilled water. This clear filtrate is the <strong>Sodium Fusion Extract (SFE)</strong>.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Test for Nitrogen (Prussian Blue)</h3>
        <p>
          The SFE is boiled with <strong>FeSOâ‚„</strong> and then acidified with <strong>conc. Hâ‚‚SOâ‚„</strong>.
        </p>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="font-mono text-sm text-blue-700">6CNâ» + FeÂ²âº â†’ [Fe(CN)â‚†]â´â»</p>
          <p className="font-mono text-sm text-blue-700">3[Fe(CN)â‚†]â´â» + 4FeÂ³âº â†’ Feâ‚„[Fe(CN)â‚†]â‚ƒ Â· xHâ‚‚O</p>
          <p className="text-sm text-blue-600 mt-2 font-bold text-center">Result: Brilliant Prussian Blue color</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Test for Sulphur</h3>
        <ul className="list-disc pl-5 space-y-4 mb-6">
          <li>
            <strong>Lead Acetate Test:</strong> SFE + acetic acid + lead acetate â†’ <strong>Black precipitate</strong> of PbS.
            <span className="font-mono text-sm ml-2">SÂ²â» + PbÂ²âº â†’ PbSâ†“</span>
          </li>
          <li>
            <strong>Nitroprusside Test:</strong> SFE + sodium nitroprusside â†’ <strong>Violet color</strong>.
            <span className="font-mono text-sm ml-2">SÂ²â» + [Fe(CN)â‚…NO]Â²â» â†’ [Fe(CN)â‚…NOS]â´â»</span>
          </li>
        </ul>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-800"><strong>Special Case (N and S both present):</strong> NaSCN forms instead of NaCN and Naâ‚‚S. Adding FeÂ³âº gives a <strong>blood red</strong> color: FeÂ³âº + SCNâ» â†’ [Fe(SCN)]Â²âº. No Prussian blue appears since free CNâ» is absent.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Test for Halogens</h3>
        <p>
          The SFE is acidified with <strong>HNOâ‚ƒ</strong> (to remove CNâ» and SÂ²â» interference) and treated with <strong>AgNOâ‚ƒ</strong>.
        </p>
        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-800"><strong>âš ï¸ Critical:</strong> Must boil with HNOâ‚ƒ first to expel HCN and Hâ‚‚S. Otherwise, AgCN or Agâ‚‚S precipitates interfere!</p>
        </div>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300 space-y-1">
          <p className="text-sm text-slate-700"><strong>White ppt</strong> (soluble in NHâ‚„OH) = Chlorine (AgCl)</p>
          <p className="text-sm text-slate-700"><strong>Yellowish ppt</strong> (sparingly soluble) = Bromine (AgBr)</p>
          <p className="text-sm text-slate-700"><strong>Yellow ppt</strong> (insoluble in NHâ‚„OH) = Iodine (AgI)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Test for Phosphorus</h3>
        <p className="text-sm">
          The compound is heated with Naâ‚‚Oâ‚‚, converting P â†’ POâ‚„Â³â». Boiling with HNOâ‚ƒ and adding ammonium molybdate yields a <strong>yellow precipitate</strong> of (NHâ‚„)â‚ƒPOâ‚„Â·12MoOâ‚ƒ.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. Real-World Applications</h3>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸ¥œ The Walnut Shell Analogy</h4>
          <p className="text-sm">
            An organic compound is a tough walnut (covalent bonds), and the elements inside (N, S, Cl) are the nutmeat. Fusing with Na is like smashing the walnut â€” it breaks the covalent &ldquo;shell&rdquo; and releases elements as free ions your reagents can detect.
          </p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸ” Forensic Toxicology</h4>
          <p className="text-sm">
            Toxicologists use elemental analysis to identify unknown synthetic drugs. Detecting chlorine points to chloroform or sedatives; nitrogen suggests alkaloids or amphetamines.
          </p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸ’Š Pharmaceutical Industry</h4>
          <p className="text-sm">
            When a new drug is synthesized, chemists perform these elemental tests to verify that the desired heteroatoms were successfully incorporated into the molecular structure.
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm my-4">
          <h4 className="font-bold text-purple-900 mb-2">ðŸŒ¾ Agricultural Chemistry</h4>
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
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Estimation of C, H, N, S & Halogens â€” Quantitative Analysis (Liebig's Method)</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Once an organic compound is purified and its elements are <strong>qualitatively identified</strong>, the next step is to determine the <strong>exact mass percentage</strong> of each element. This data is the foundation for calculating empirical and molecular formulas.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Estimation of Carbon and Hydrogen (Liebig&apos;s Combustion)</h3>
        <p>
          A known mass (<strong>m</strong>) of the compound is burnt in excess pure oxygen with heated <strong>CuO</strong> (oxidizing agent). All Carbon &rarr; COâ‚‚ and all Hydrogen &rarr; Hâ‚‚O.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">C<sub>x</sub>H<sub>y</sub> + (x + y/4) Oâ‚‚ &rarr; x COâ‚‚ + (y/2) Hâ‚‚O</p>
        </div>
        <p className="text-sm"><strong>Trapping the Gases:</strong> The mixture passes through two weighed U-tubes connected <em>in series</em>:</p>
        <ul className="list-disc pl-5 space-y-2 mb-6">
          <li><strong>Tube 1 â€” Anhydrous CaClâ‚‚:</strong> Absorbs only Hâ‚‚O vapour. Mass increase = mâ‚.</li>
          <li><strong>Tube 2 â€” Conc. KOH:</strong> Absorbs COâ‚‚ gas (forms Kâ‚‚COâ‚ƒ). Mass increase = mâ‚‚.</li>
        </ul>

        <div className="my-4 p-4 bg-red-50 rounded-xl border border-red-200">
          <p className="text-sm text-red-800"><strong>âš ï¸ Critical Order:</strong> CaClâ‚‚ must come <em>before</em> KOH. If KOH is placed first, it absorbs both Hâ‚‚O and COâ‚‚, making the Carbon calculation artificially high!</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Formulas</h3>
        <div className="my-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
          <p className="font-mono text-lg text-emerald-700 text-center">%H = (2/18) &times; (mâ‚/m) &times; 100</p>
          <p className="text-sm text-emerald-600 text-center">1 mol Hâ‚‚O (18g) contains 2g of Hydrogen</p>
        </div>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
          <p className="font-mono text-lg text-blue-700 text-center">%C = (12/44) &times; (mâ‚‚/m) &times; 100</p>
          <p className="text-sm text-blue-600 text-center">1 mol COâ‚‚ (44g) contains 12g of Carbon</p>
        </div>
        <div className="my-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <p className="text-sm text-purple-800"><strong>If %C + %H &lt; 100%:</strong> The difference is attributed to <strong>Oxygen</strong> (by difference method).</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Estimation of Nitrogen</h3>
        <ul className="list-disc pl-5 space-y-4 mb-6">
          <li>
            <strong>Dumas Method:</strong> Compound heated with CuO in COâ‚‚ atmosphere. Nitrogen &rarr; Nâ‚‚ gas. Oxides of nitrogen reduced by heated copper gauze. Nâ‚‚ collected over KOH (absorbs COâ‚‚) and measured by volume.
          </li>
          <li>
            <strong>Kjeldahl&apos;s Method:</strong> Compound boiled with conc. Hâ‚‚SOâ‚„ &rarr; (NHâ‚„)â‚‚SOâ‚„. Heated with excess NaOH &rarr; NHâ‚ƒ gas. NHâ‚ƒ absorbed in standard Hâ‚‚SOâ‚„ and back-titrated.
            <div className="my-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800"><strong>Limitation:</strong> Not applicable for compounds with nitro groups, azo groups, or ring nitrogen (e.g., pyridine), as they don&apos;t convert to (NHâ‚„)â‚‚SOâ‚„.</p>
            </div>
          </li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Estimation of Halogens and Sulphur (Carius Method)</h3>
        <ul className="list-disc pl-5 space-y-4 mb-6">
          <li>
            <strong>Halogens:</strong> Heated with fuming HNOâ‚ƒ + AgNOâ‚ƒ in a sealed Carius tube. Halogen &rarr; AgX precipitate (filtered, dried, weighed).
          </li>
          <li>
            <strong>Sulphur:</strong> Heated with fuming HNOâ‚ƒ or Naâ‚‚Oâ‚‚. S &rarr; Hâ‚‚SOâ‚„ &rarr; add BaClâ‚‚ &rarr; <strong>BaSOâ‚„ precipitate</strong> (weighed).
          </li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Applications</h3>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸª™ The Coin Sorter Analogy</h4>
          <p className="text-sm">
            Imagine a sealed piggy bank (the compound) filled with dimes (Carbon) and pennies (Hydrogen). You break it open (combust with CuO), and the contents flow down a chute. The first slot catches only pennies (CaClâ‚‚ traps Hâ‚‚O), the second catches dimes (KOH traps COâ‚‚). Weighing each slot gives you the exact percentage.
          </p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸ›¢ï¸ Petrochemical Engineering</h4>
          <p className="text-sm">
            Petroleum engineers determine the exact C:H ratio of crude oil. A higher hydrogen-to-carbon ratio means cleaner burning fuel and higher-grade gasoline. Automated CHN analyzers are based on these combustion principles.
          </p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4">
          <h4 className="font-bold text-emerald-900 mb-2">ðŸŒ¾ Food &amp; Agriculture (Kjeldahl Method)</h4>
          <p className="text-sm">
            The Kjeldahl method is the global standard for determining protein content in food, grains, and fertilizers. Since proteins contain a specific percentage of nitrogen, finding %N directly reveals nutritional protein value.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'purification-techniques') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Purification Techniques</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          After an organic compound is prepared or isolated, it must be purified before its properties or structure can be studied. NCERT groups the common methods by the physical property used for separation.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Sublimation</h3>
        <p>
          Sublimation separates a <strong>sublimable solid</strong> from non-sublimable impurities. On heating, the pure compound changes directly from solid to vapour and then deposits again on a cool surface.
        </p>
        <div className="my-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800"><strong>Use when:</strong> one component sublimes, while impurity does not. Example type: camphor or naphthalene mixed with sand.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Crystallisation</h3>
        <p>
          Crystallisation purifies solids using solubility differences. The compound should be sparingly soluble at room temperature but appreciably soluble at higher temperature. On cooling the nearly saturated hot solution, pure crystals separate.
        </p>
        <div className="my-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">The filtrate, or mother liquor, retains impurities and a small amount of the compound. Coloured impurities can be removed using activated charcoal.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Distillation</h3>
        <p>
          Distillation separates volatile liquids from non-volatile impurities, or liquids with sufficiently different boiling points. Vapour of the lower-boiling component forms first, condenses, and is collected separately.
        </p>
        <div className="my-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
          <p className="text-sm text-cyan-800"><strong>Fractional distillation:</strong> use a fractionating column when boiling points are close, so vapours become richer in the more volatile component as they rise.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Differential Extraction</h3>
        <p>
          Differential extraction is used when a compound is more soluble in an organic solvent than in water. The aqueous mixture is shaken with an immiscible organic solvent, and the compound transfers into the solvent layer.
        </p>
        <div className="my-6 rounded-xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm text-violet-800">Repeated extraction improves recovery. If solubility is low, continuous extraction uses the same solvent repeatedly.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Chromatography</h3>
        <p>
          Chromatography separates, purifies, and tests purity by distributing components between a stationary phase and a mobile phase. Components move at different rates because they interact differently with the two phases.
        </p>
        <div className="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800"><strong>Two NCERT categories:</strong> adsorption chromatography, based on different adsorption on silica gel or alumina; and partition chromatography, based on partition between stationary and mobile phases.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Fast Selection Rule</h3>
        <div className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700"><strong>Sublimes?</strong> sublimation. <strong>Solid with solubility difference?</strong> crystallisation. <strong>Liquid b.p. difference?</strong> distillation. <strong>Different solubility in immiscible solvents?</strong> extraction. <strong>Mixture with different adsorption/partition?</strong> chromatography.</p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'structural-isomerism-molecular-properties') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Structural Isomerism and Molecular Properties</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Isomerism is the existence of two or more compounds with the <strong>same molecular formula</strong> but different properties. In structural isomerism, the atoms are linked in different ways.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Chain Isomerism</h3>
        <p>
          Chain isomers have the same molecular formula but different carbon skeletons. For C<sub>5</sub>H<sub>12</sub>, NCERT lists pentane, 2-methylbutane, and 2,2-dimethylpropane.
        </p>
        <div className="my-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">Property clue: greater branching lowers surface area, weakens dispersion forces, and generally lowers boiling point.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Position Isomerism</h3>
        <p>
          Position isomers differ in the position of a substituent atom or functional group on the same carbon skeleton. C<sub>3</sub>H<sub>8</sub>O gives propan-1-ol and propan-2-ol.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Functional Group Isomerism</h3>
        <p>
          Functional group isomers have the same molecular formula but different functional groups. C<sub>3</sub>H<sub>6</sub>O can represent propanal, an aldehyde, and propanone, a ketone.
        </p>
        <div className="my-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Property clue: changing the functional group changes reactivity, polarity, intermolecular forces, and many physical properties.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Metamerism</h3>
        <p>
          Metamerism arises when different alkyl groups lie on either side of a polyvalent functional group. For C<sub>4</sub>H<sub>10</sub>O, NCERT gives methoxypropane and ethoxyethane.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Why Same Formula Gives Different Properties</h3>
        <div className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            Molecular formula tells only the number of atoms. Structure tells how atoms are connected. Changing connectivity changes molecular shape, surface area, polarity, functional group behaviour, and therefore melting point, boiling point, solubility, and reactivity.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Quick Classification Rule</h3>
        <div className="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">
            Different carbon skeleton: chain. Same skeleton, group moved: position. Different functional group: functional group isomerism. Different alkyl groups around a linking functional group: metamerism.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'ethane-conformations') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Conformations of Ethane â€” Torsional Strain &amp; Newman Projections</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The Câ€“C single bond (&sigma; bond) in ethane allows <strong>almost free rotation</strong>. The different spatial arrangements produced by this rotation are called <strong>conformations</strong> (or conformers/rotamers).
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Why Rotation is &ldquo;Almost&rdquo; Free</h3>
        <p>
          Although the &sigma; bond is cylindrically symmetric, rotation is not perfectly free. The electron clouds of Câ€“H bonds on adjacent carbons <strong>repel each other</strong>. This repulsive interaction is called <strong>torsional strain</strong>.
        </p>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-sm text-amber-800">The energy barrier for ethane is only <strong>12.5 kJ/mol</strong> â€” small enough that room-temperature kinetic energy easily overcomes it. Individual conformers cannot be isolated.</p>
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
            <strong>Skew:</strong> Any intermediate angle â€” partially staggered, with intermediate energy.
          </li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Newman Projection</h3>
        <p>
          View the molecule <strong>head-on</strong>, looking directly down the Câ€“C axis. The front carbon is a <strong>dot</strong>; the rear carbon is a <strong>circle</strong>. Bonds radiate outward at 120&deg; angles.
        </p>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800"><strong>Key insight:</strong> In the staggered Newman projection, rear bonds bisect the angles between front bonds. In eclipsed, they align exactly behind front bonds.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Sawhorse Projection</h3>
        <p>
          The molecule is viewed from a tilted angle. The Câ€“C bond is drawn diagonally with the front carbon at the lower end and the rear carbon at the upper end.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Energy Diagram</h3>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">E = (12.5/2) &times; (1 &minus; cos 3&theta;)</p>
          <p className="text-sm text-slate-600 mt-2 text-center">A perfect sinusoidal curve with 3 maxima (eclipsed) and 3 minima (staggered) per 360&deg; rotation.</p>
        </div>
        <p className="text-sm text-slate-600 italic">
          Note: Throughout all rotations, bond lengths (Câ€“C = 1.54 &Aring;, Câ€“H = 1.09 &Aring;) and bond angles (109.5&deg;) remain <strong>fixed</strong>. Only the dihedral (torsional) angle changes.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Real-World Analogies</h3>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">â˜‚ï¸ Two Umbrellas on a Pole</h4>
          <p className="text-sm">
            Imagine two open umbrellas stacked on a single pole. If the spokes align perfectly (eclipsed), they crowd each other. Rotate one by 60&deg; so spokes fit in gaps (staggered), and they have maximum breathing room.
          </p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">âš™ï¸ Gears Face-to-Face</h4>
          <p className="text-sm">
            Two gears placed face-to-face: if teeth align (eclipsed), they clash (high strain). If teeth align with gaps (staggered), they nestle comfortably (low strain).
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm my-4">
          <h4 className="font-bold text-purple-900 mb-2">ðŸ’Š Drug-Receptor Binding</h4>
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
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm font-bold">
            <div className="rounded-lg bg-emerald-100 border border-emerald-300 py-2 text-emerald-900">
              <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-1">Dipole moment</div>
              <span className="font-mono text-base">&mu; = 0.33 D</span>
            </div>
            <div className="rounded-lg bg-emerald-100 border border-emerald-300 py-2 text-emerald-900">
              <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-1">Boiling point</div>
              <span className="font-mono text-base">277 K</span>
            </div>
          </div>
          <p className="text-xs text-emerald-500 text-center mt-1">NCERT Class 11 Chemistry, Sec. 9.3.3</p>
        </div>
        <div className="my-6 p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
          <p className="font-mono text-lg text-amber-700 text-center"><strong>Trans:</strong> Bond dipoles CANCEL &rarr; &mu; &asymp; 0 (Non-polar)</p>
          <p className="text-sm text-amber-600 text-center">Higher <strong>melting point</strong> due to symmetrical crystal packing; lower boiling point</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm font-bold">
            <div className="rounded-lg bg-amber-100 border border-amber-300 py-2 text-amber-900">
              <div className="text-[10px] uppercase tracking-widest text-amber-600 font-bold mb-1">Dipole moment</div>
              <span className="font-mono text-base">&mu; &asymp; 0</span>
            </div>
            <div className="rounded-lg bg-amber-100 border border-amber-300 py-2 text-amber-900">
              <div className="text-[10px] uppercase tracking-widest text-amber-600 font-bold mb-1">Boiling point</div>
              <span className="font-mono text-base">274 K</span>
            </div>
          </div>
          <p className="text-xs text-amber-500 text-center mt-1">NCERT Class 11 Chemistry, Sec. 9.3.3</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Analogies</h3>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">ðŸ“Œ Cardboard &amp; Nails</h4>
          <p className="text-sm">One nail (single bond) = free rotation. Two nails (double bond) = locked. Whatever is attached is permanently fixed in position.</p>
        </div>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 shadow-sm my-4">
          <h4 className="font-bold text-sky-900 mb-2">ðŸš£ Rowboat Oars</h4>
          <p className="text-sm">Both oars on the same side = cis. One oar left, one right = trans. The boat behaves completely differently in each configuration.</p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm my-4">
          <h4 className="font-bold text-red-900 mb-2">ðŸ³ Trans Fats &amp; Health</h4>
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
          <p className="font-mono text-xl text-brand-primary text-center">Îµ = -dÎ¦<sub>B</sub> / dt</p>
          <p className="text-sm text-slate-600 mt-2 text-center">The negative sign (Lenz's Law) means induced current <strong>opposes</strong> the change.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 my-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-2">â¸ï¸ Stationary (v=0)</h4>
            <p className="text-sm">No flux change â†’ No EMF â†’ No current</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
            <h4 className="font-bold text-green-800 mb-2">â†’ Approaching (v&gt;0)</h4>
            <p className="text-sm">Flux increasing â†’ Current opposes (pushes back)</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200">
            <h4 className="font-bold text-red-800 mb-2">â† Receding (v&lt;0)</h4>
            <p className="text-sm">Flux decreasing â†’ Current reverses direction</p>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-6" id="tour-real-world">
          <h4 className="font-bold text-amber-900 mb-2">ðŸ  The Reluctant Roommate Analogy</h4>
          <p className="text-sm">
            Nature hates change! Imagine a roommate who hates temperature changes:
            <br /><br />
            <strong>â€¢ Open window (magnet enters):</strong> They turn on the heater (current pushes back)
            <br />
            <strong>â€¢ Close window (magnet leaves):</strong> They turn on the AC (current reverses)
            <br />
            <strong>â€¢ Window still (magnet stationary):</strong> They do nothing!
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
              <p className="font-mono text-lg">Î¦ = BA cos(Ï‰t)</p>
              <p className="text-xs text-purple-600 mt-1">Cosine wave - MAX when coil is vertical</p>
            </div>
            <div>
              <h4 className="font-bold text-purple-800 mb-2">Induced EMF</h4>
              <p className="font-mono text-lg">Îµ = Îµâ‚€ sin(Ï‰t)</p>
              <p className="text-xs text-purple-600 mt-1">Sine wave - ZERO when coil is vertical</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg">
            <h5 className="font-bold text-slate-700 text-sm">âš¡ Phase Relationship</h5>
            <p className="text-xs text-slate-600">Flux and EMF are 90Â° out of phase. When rate of flux change is maximum, EMF is maximum!</p>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm my-6">
          <h4 className="font-bold text-blue-900 mb-2">ðŸš´ The Pedaling Cyclist Analogy</h4>
          <p className="text-sm">
            Imagine pedals pumping an air bellows:
            <br /><br />
            <strong>â€¢ Circular motion:</strong> Your feet go up and down as you pedal
            <br />
            <strong>â€¢ Air pressure:</strong> Not steady - pushes out and pulls in rhythmically (AC!)
            <br />
            <strong>â€¢ Faster pedaling (Ï‰):</strong> More frequent and stronger puffs
            <br /><br />
            <em>Higher Ï‰ = Higher frequency AND higher voltage!</em>
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">â˜…</span>
            Real World Applications
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">ðŸ“± Wireless Charging</h4>
              <p className="text-sm text-slate-600">
                Your phone's charger creates a rapidly changing magnetic field. A coil inside your phone catches this field, inducing current to charge the battery!
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">ðŸ”Œ Power Grids</h4>
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

        <div className="bg-orange-50 p-6 rounded-xl border border-orange-200 shadow-sm my-6">
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

        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm my-6">
          <h4 className="font-bold text-purple-900 mb-2">Analogy: The Infinite Ripple</h4>
          <p className="text-sm">
            Throw a stone in a pond. The splash (accelerating charge) creates ripples (waves) that move outward.
            <br />
            Now imagine the ripples are made of two invisible fabrics (Electricity and Magnetism) weaving into each other at 90 degrees. They don't need water (medium) to travelâ€”they can move through empty space!
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">â˜…</span>
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

        <div className="bg-cyan-50 p-6 rounded-xl border border-cyan-200 shadow-sm my-6">
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

  if (topic?.id === 'polarisation') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Polarisation of Light</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Polarisation demonstrates that light is a transverse wave: its electric field oscillates perpendicular to the direction in which the light travels.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Unpolarised and plane-polarised light</h3>
        <p>
          In natural light, the electric vector rapidly takes every possible direction in the transverse plane. A polaroid transmits only the component parallel to its pass axis, producing linearly or plane-polarised light. The intensity after this first polaroid is half the incident intensity.
        </p>

        <div className="my-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-center font-mono text-xl font-bold text-indigo-950">I = I<sub>0</sub> cos<sup>2</sup> theta</p>
          <p className="mt-2 text-center text-sm text-indigo-800">Malus' law, NCERT Eq. 10.18. Here I<sub>0</sub> is the polarised intensity incident on the analyser.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">What rotation reveals</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Parallel pass axes transmit the full intensity emerging from the first polaroid.</li>
          <li>Perpendicular pass axes are crossed and transmit nearly zero intensity.</li>
          <li>Over a full rotation of the analyser, two maxima and two minima are observed.</li>
          <li>A middle sheet between crossed polaroids restores light: I = (I<sub>0</sub>/4) sin<sup>2</sup>(2 theta), with maximum transmission at 45 degrees.</li>
        </ul>

        <div className="mt-8 rounded-xl border border-cyan-200 bg-cyan-50 p-5">
          <h4 className="font-bold text-cyan-950">NCERT applications</h4>
          <p className="mt-2 text-sm text-cyan-900">Polaroids control light intensity in sunglasses and windowpanes, and are used in photographic and 3D movie cameras.</p>
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

        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 shadow-sm my-6">
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

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-6">
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
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">â˜…</span>
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
          Hans Geiger and Ernest Marsden, under Rutherford's direction, fired high-energy alpha particles (HeÂ²âº, from radioactive Bismuth-214) at an extremely thin gold foil (~400 atoms thick).
        </p>

        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <h4 className="font-bold text-slate-800 mb-3">Experimental Setup</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Alpha Source:</strong> Radioactive material emitting Î±-particles at ~5.5 MeV</li>
            <li><strong>Target:</strong> Thin gold foil (Au, Z=79) or Aluminum (Al, Z=13)</li>
            <li><strong>Detector:</strong> ZnS screen that produces scintillations when hit</li>
            <li><strong>Collimator:</strong> Lead shield with narrow slit for parallel beam</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Key Observations</h3>
        <div className="grid md:grid-cols-1 gap-4 my-6">
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
            <h4 className="font-bold text-green-900">Observation 1: ~99% passed straight through</h4>
            <p className="text-sm text-green-800 mt-1">
              <strong>Conclusion:</strong> The atom is mostly empty space. Electrons are too light to deflect the heavy Î±-particles.
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
            <h4 className="font-bold text-yellow-900">Observation 2: Some deflected at small angles (1-10Â°)</h4>
            <p className="text-sm text-yellow-800 mt-1">
              <strong>Conclusion:</strong> There's a concentrated positive charge somewhere that repels the positive Î±-particles. Closer passes = larger deflection.
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
            <h4 className="font-bold text-red-900">Observation 3: ~1 in 20,000 bounced back (Î¸ &gt; 90Â°)</h4>
            <p className="text-sm text-red-800 mt-1">
              <strong>Conclusion:</strong> A tiny, dense, positively charged nucleus exists at the center. Head-on collisions cause 180Â° backscattering!
            </p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. The Physics: Coulomb Scattering</h3>
        <div className="my-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h4 className="font-bold text-blue-900 mb-2">Rutherford Scattering Formula</h4>
          <p className="font-mono text-lg text-blue-800 text-center my-3">
            N(Î¸) âˆ 1 / sinâ´(Î¸/2)
          </p>
          <ul className="list-disc ml-6 text-sm text-blue-800">
            <li><strong>Force:</strong> Coulomb repulsion F = kqâ‚qâ‚‚/rÂ² between Î±âºÂ² and nucleusâºá¶»</li>
            <li><strong>Impact Parameter (b):</strong> Distance of closest approach determines scattering angle</li>
            <li><strong>Small b:</strong> Particle passes close to nucleus â†’ Large deflection</li>
            <li><strong>Large b:</strong> Particle is far from nucleus â†’ Passes through undeflected</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Why Electrons Don't Deflect Alpha Particles</h3>
        <p>
          Despite passing through electron clouds, alpha particles are NOT deflected by electrons because:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Mass Ratio:</strong> Î±-particle mass â‰ˆ 7,300 Ã— electron mass</li>
          <li><strong>Analogy:</strong> Like a bowling ball hitting ping-pong ballsâ€”the electrons scatter, but the alpha continues straight</li>
          <li>Electrons get ionized (knocked out), but the Î±-particle's trajectory is essentially unchanged</li>
        </ul>

        <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 shadow-sm my-6" id="tour-real-world">
          <h4 className="font-bold text-rose-900 mb-2">ðŸŸï¸ Analogy: The Football Stadium</h4>
          <p className="text-sm text-rose-800">
            If an Atom were the size of a football stadium:
            <br /><br />
            â€¢ The <strong>Nucleus</strong> would be a marble at the center kickoff spot<br />
            â€¢ The <strong>Electrons</strong> would be tiny flies buzzing in the upper stands<br />
            â€¢ <strong>Everything else?</strong> Completely empty space!
            <br /><br />
            This explains why most Î±-particles pass throughâ€”they're shooting through the stands where there's nothing but flies!
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. The Nuclear Model of the Atom</h3>
        <p>Rutherford concluded:</p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Nucleus:</strong> Tiny (10â»Â¹âµ m), dense, positively charged center containing protons (and later, neutrons)</li>
          <li><strong>Electrons:</strong> Orbit the nucleus at relatively large distances (10â»Â¹â° m)</li>
          <li><strong>Size Ratio:</strong> Nucleus : Atom â‰ˆ 1 : 100,000 (like a marble in a stadium!)</li>
          <li><strong>Mass:</strong> 99.9% of atom's mass is in the nucleus</li>
        </ul>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">â˜…</span>
            Real World Applications
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Rutherford Backscattering Spectrometry (RBS)</h4>
            <p className="text-slate-600">
              Scientists today use the same principle! By firing ion beams at materials and measuring scattering angles, they can determine the elemental composition and thickness of thin filmsâ€”essential for semiconductor manufacturing and materials science research.
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
          <li><strong>Electrons</strong> from N-side diffuse towards P-side (n -&gt; p) because of concentration gradient.</li>
          <li><strong>Holes</strong> from P-side diffuse towards N-side (p -&gt; n) because of concentration gradient.</li>
          <li>When electrons meet holes near the junction, they <strong>recombine</strong>.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Phase B: Depletion Region Formation</h3>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">P-Side Border</h4>
            <p className="text-sm">Holes leave, so immobile <strong>negative acceptor ions (-)</strong> are exposed.</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
            <h4 className="font-bold text-pink-800 mb-2">N-Side Border</h4>
            <p className="text-sm">Electrons leave, so immobile <strong>positive donor ions (+)</strong> are exposed.</p>
          </div>
        </div>
        <p>
          This creates the <strong>depletion region</strong>, a space-charge region depleted of free mobile carriers and containing fixed ions.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">Phase C: Electric Field & Drift Current</h3>
        <p>
          The exposed ions create an <strong>internal electric field (E)</strong> pointing from the positive N-side space-charge region to the negative P-side space-charge region.
        </p>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm my-4">
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
          <li><strong>Diffusion current</strong> decreases as the barrier grows.</li>
          <li><strong>Drift current</strong> due to the electric field opposes diffusion current.</li>
          <li>At equilibrium: <strong>Net current = 0</strong></li>
        </ul>

        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 shadow-sm my-6">
          <h4 className="font-bold text-purple-900 mb-2">Barrier Potential (V0)</h4>
          <p className="text-sm">
            The potential difference across the depletion region is called the <strong>Barrier Potential</strong>:
          </p>
          <ul className="text-sm mt-2 list-disc pl-5">
            <li>Silicon: V0 approx. 0.7 V</li>
            <li>Germanium: V0 approx. 0.3 V; cut-in voltage is about 0.2 V.</li>
          </ul>
          <p className="text-sm mt-2 italic">
            "Electrons must climb this energy hill to diffuse; the hill is now too high to cross without extra energy."
          </p>
        </div>

        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm my-6">
          <h4 className="font-bold text-yellow-900 mb-2">Analogy: Robots & Balloons</h4>
          <p className="text-sm">
            <strong>N-Room:</strong> Full of Robots (Electrons) on movable carpets.<br />
            <strong>P-Room:</strong> Full of Balloons (Holes) tied to heavy chairs.<br /><br />
            When the wall opens, Robots rush to P-room, Balloons float to N-room (<strong>Diffusion</strong>).
            But each Robot leaves behind a heavy <strong>+</strong> ion, and each Balloon leaves behind a heavy <strong>-</strong> ion.
            Soon, the doorway is blocked by ions (<strong>depletion region</strong>); the barrier potential prevents further net crossing.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">*</span>
            Real World Applications
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">LEDs</h4>
              <p className="text-sm text-slate-600">
                When electrons recombine with holes, they release energy. In GaAs, this is visible light!
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">Solar Cells</h4>
              <p className="text-sm text-slate-600">
                Light creates electron-hole pairs; the E-field in the depletion region separates them to produce electricity.
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
            <em>Calculation:</em> 8 Ã— (1/8) = <strong>1 Atom</strong>.
          </li>
          <li>
            <strong>Body-Centered Cubic (BCC):</strong> 8 Corners + 1 Body Center.<br />
            <em>Calculation:</em> (8 Ã— 1/8) + 1 = <strong>2 Atoms</strong>.
          </li>
          <li>
            <strong>Face-Centered Cubic (FCC):</strong> 8 Corners + 6 Face Centers.<br />
            <em>Calculation:</em> (8 Ã— 1/8) + (6 Ã— 1/2) = <strong>4 Atoms</strong>.
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
              <td className="px-6 py-4">r = âˆš3a / 4</td>
              <td className="px-6 py-4">68%</td>
              <td className="px-6 py-4 text-yellow-600">32%</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-bold text-green-700">FCC / CCP</td>
              <td className="px-6 py-4">r = a / 2âˆš2</td>
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
          The Collision Theory, developed by Max Trautz and William Lewis (1916â€“18), assumes reactant molecules are hard spheres.
          Reaction occurs only when these molecules <strong>collide</strong> with each other. However, not all collisions are successful.
        </p>

        <div className="my-8 p-6 bg-yellow-50 -secondary rounded-xl">
          <h4 className="font-bold text-brand-primary mb-2 font-display">Mathematical Formulation</h4>
          <p className="font-mono text-lg text-slate-800">Rate = P Ã— Z<sub>AB</sub> Ã— e<sup>-Ea/RT</sup></p>
          <ul className="list-disc ml-6 mt-2 text-sm text-slate-700">
            <li><strong>Z<sub>AB</sub></strong>: Collision frequency</li>
            <li><strong>e<sup>-Ea/RT</sup></strong>: Fraction of molecules with Energy â‰¥ Ea</li>
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
          For example, in the formation of Methanol from Bromoethane, the OHâ» ion must attack the carbon from the back side.
          Improper orientation leads to no reaction (bounce back).
        </p>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">â˜…</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Automotive Catalytic Converters</h4>
            <p className="text-slate-600">
              In cars, catalytic converters use metals like Platinum to lower the <strong>Activation Energy</strong> of harmful exhaust gases
              (CO, NOx). By providing a surface with correct orientation sites, the catalyst allows these gases to react at lower temperatures,
              converting them into harmless COâ‚‚ and Nâ‚‚ efficiently.
            </p>
          </div>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'nernst-cell-potential') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Cell Potential and the Nernst Equation</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          A galvanic cell converts the chemical energy of a spontaneous redox reaction into electrical energy.
          Its cell potential is the potential difference between the cathode and anode. The Nernst equation shows
          how this potential changes when the reacting species are not under standard conditions.
        </p>

        <div className="my-6 rounded-xl border border-sky-200 bg-sky-50 p-5">
          <h3 className="mt-0 text-xl font-bold text-sky-950">NCERT foundation</h3>
          <ul className="mb-0 space-y-2 text-sm text-sky-900">
            <li><strong>Standard conditions:</strong> solutes at 1 M, gases at 1 bar, and temperature 298 K.</li>
            <li><strong>Standard cell potential:</strong> E<sup>0</sup><sub>cell</sub> = E<sup>0</sup><sub>cathode</sub> - E<sup>0</sup><sub>anode</sub>.</li>
            <li><strong>Constants:</strong> R = 8.314 J K<sup>-1</sup> mol<sup>-1</sup> and F = 96487 C mol<sup>-1</sup>.</li>
          </ul>
        </div>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">1. Nernst equation</h3>
        <p>For a general reaction aA + bB &rarr; cC + dD, the reaction quotient is:</p>
        <div className="my-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="m-0 font-mono text-lg font-bold text-slate-900">Q = [C]<sup>c</sup>[D]<sup>d</sup> / [A]<sup>a</sup>[B]<sup>b</sup></p>
          <p className="mt-3 mb-0 font-mono text-lg font-bold text-brand-primary">E<sub>cell</sub> = E<sup>0</sup><sub>cell</sub> - (RT / nF) ln Q</p>
          <p className="mt-2 mb-0 text-sm text-slate-600">NCERT Eq. 2.13</p>
        </div>
        <p>At 298 K, conversion from natural logarithm to base-10 logarithm gives:</p>
        <div className="my-5 rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
          <p className="m-0 font-mono text-xl font-bold text-blue-900">E<sub>cell</sub> = E<sup>0</sup><sub>cell</sub> - (0.059 / n) log Q</p>
          <p className="mt-2 mb-0 text-sm text-blue-700">n is the number of electrons transferred in the balanced cell reaction.</p>
        </div>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">2. Daniell cell</h3>
        <p className="font-mono text-center">Zn(s) | Zn<sup>2+</sup>(aq) || Cu<sup>2+</sup>(aq) | Cu(s)</p>
        <div className="grid gap-3 sm:grid-cols-2 my-5 not-prose">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs font-black uppercase tracking-wide text-amber-700">Anode: oxidation</div>
            <div className="mt-2 font-mono font-bold text-slate-900">Zn &rarr; Zn<sup>2+</sup> + 2e<sup>-</sup></div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-black uppercase tracking-wide text-emerald-700">Cathode: reduction</div>
            <div className="mt-2 font-mono font-bold text-slate-900">Cu<sup>2+</sup> + 2e<sup>-</sup> &rarr; Cu</div>
          </div>
        </div>
        <p>
          E<sup>0</sup><sub>Zn2+/Zn</sub> = -0.76 V and E<sup>0</sup><sub>Cu2+/Cu</sub> = +0.34 V, so
          E<sup>0</sup><sub>cell</sub> = 0.34 - (-0.76) = <strong>1.10 V</strong>. For this cell:
        </p>
        <div className="my-5 rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="m-0 font-mono text-lg font-bold text-slate-900">E<sub>cell</sub> = 1.10 - (0.059 / 2) log([Zn<sup>2+</sup>] / [Cu<sup>2+</sup>])</p>
          <p className="mt-2 mb-0 text-sm text-slate-500">NCERT Eq. 2.12</p>
        </div>
        <p>
          Increasing [Cu<sup>2+</sup>] or decreasing [Zn<sup>2+</sup>] increases E<sub>cell</sub>. As the cell operates,
          [Zn<sup>2+</sup>] rises, [Cu<sup>2+</sup>] falls, and the voltmeter reading decreases.
        </p>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">3. Equilibrium and Gibbs energy</h3>
        <p>
          At equilibrium, E<sub>cell</sub> = 0 and Q = K<sub>c</sub>. Therefore, at 298 K:
        </p>
        <div className="my-5 space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-5 text-center">
          <p className="m-0 font-mono text-lg font-bold text-violet-950">E<sup>0</sup><sub>cell</sub> = (0.059 / n) log K<sub>c</sub> <span className="text-sm font-normal">(Eq. 2.14)</span></p>
          <p className="m-0 font-mono text-lg font-bold text-violet-950">&Delta;<sub>r</sub>G = -nFE<sub>cell</sub> <span className="text-sm font-normal">(Eq. 2.15)</span></p>
          <p className="m-0 font-mono text-lg font-bold text-violet-950">&Delta;<sub>r</sub>G<sup>0</sup> = -nFE<sup>0</sup><sub>cell</sub> <span className="text-sm font-normal">(Eq. 2.16)</span></p>
        </div>
        <p>
          E<sub>cell</sub> is intensive, while &Delta;<sub>r</sub>G is extensive and depends on n. A positive cell potential
          corresponds to a negative Gibbs energy change for the forward reaction.
        </p>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">4. Use the simulation</h3>
        <ol className="space-y-3">
          <li>Select the Daniell cell and confirm that 1 M solutions give E<sub>cell</sub> = 1.10 V.</li>
          <li>Increase [Zn<sup>2+</sup>] and observe Q rise while E<sub>cell</sub> falls.</li>
          <li>Increase [Cu<sup>2+</sup>] and observe Q fall while E<sub>cell</sub> rises.</li>
          <li>Run the reaction to watch oxidation add anode ions, reduction remove cathode ions, and the voltage decrease.</li>
          <li>Try the Mg-Ag preset from NCERT Example 2.1: 0.130 M Mg<sup>2+</sup> and 0.0001 M Ag<sup>+</sup> gives approximately 2.96 V.</li>
        </ol>

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
          <li><strong>Example:</strong> Daniell Cell (Zn + CuÂ²âº â†’ ZnÂ²âº + Cu)</li>
          <li><strong>Anode (Negative):</strong> Zinc oxidizes (Zn â†’ ZnÂ²âº + 2eâ»). The electrode shrinks.</li>
          <li><strong>Cathode (Positive):</strong> Copper reduces (CuÂ²âº + 2eâ» â†’ Cu). The electrode grows.</li>
          <li><strong>Electron Flow:</strong> Anode â†’ Cathode.</li>
        </ul>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">II. Electrolytic Cells</h3>
        <p>
          Uses external electrical energy to drive a <strong>non-spontaneous</strong> reaction.
        </p>
        <div className="my-4 p-4 bg-red-50 -primary rounded-xl">
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
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">â˜…</span>
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
          In complexes like [Pt(NHâ‚ƒ)â‚‚Clâ‚‚]:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Cis Isomer:</strong> Identical ligands are adjacent (90Â°). e.g., "Cis-platin" (Anti-cancer drug).</li>
          <li><strong>Trans Isomer:</strong> Identical ligands are opposite (180Â°).</li>
        </ul>

        <h4 className="font-bold text-brand-primary mt-4">2. Fac vs Mer (Octahedral)</h4>
        <p>
          In complexes like [Co(NHâ‚ƒ)â‚ƒ(NOâ‚‚)â‚ƒ]:
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Facial (fac):</strong> Three identical ligands occupy the corners of one triangular face of the octahedron.</li>
          <li><strong>Meridional (mer):</strong> Three identical ligands occupy positions around the meridian (a plane passing through center).</li>
        </ul>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">II. Optical Isomerism (Chirality)</h3>
        <p>
          Optical isomers are mirror images that cannot be superimposed on one another. These are called <strong>Enantiomers</strong>.
        </p>
        <div className="my-4 p-4 bg-purple-50 -primary rounded-xl">
          <p className="text-purple-900 font-medium">
            <strong>The Mirror Test:</strong> To check for chirality, imagine placing the molecule in front of a mirror. If the reflection cannot be rotated to perfectly overlap the original, the molecule is Chiral.
          </p>
        </div>
        <p>
          Common in octahedral complexes involving didentate ligands (e.g., [Co(en)â‚ƒ]Â³âº).
        </p>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">â˜…</span>
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
          The unique properties of transition metalsâ€”their magnetic behavior and vibrant colorsâ€”are fundamentally linked to the electronic arrangement within the partially filled d orbitals.
        </p>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">I. Magnetic Properties</h3>
        <p>
          Transition metals frequently exhibit <strong>paramagnetism</strong> due to the presence of unpaired electrons in their d orbitals.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li><strong>Paramagnetic:</strong> Attracted by magnetic fields (Has unpaired eâ»). e.g., MnÂ²âº.</li>
          <li><strong>Diamagnetic:</strong> Repelled by magnetic fields (All eâ» paired). e.g., ZnÂ²âº (dÂ¹â°).</li>
        </ul>

        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <h4 className="font-bold text-slate-800 mb-2">Magnetic Moment Formula (Spin Only)</h4>
          <p className="font-mono text-xl text-brand-primary">Î¼ = âˆš[n(n+2)] BM</p>
          <p className="text-sm text-slate-600 mt-2">Where <em>n</em> is the number of unpaired electrons and BM is Bohr Magneton.</p>
        </div>

        <h3 className="text-xl font-bold text-brand-dark mt-8 mb-4">II. Formation of Colored Ions</h3>
        <p>
          Most transition metal ions form colored compounds. This is explained by <strong>Crystal Field Theory (CFT)</strong>.
        </p>

        <h4 className="font-bold text-brand-primary mt-4">d-d Transitions</h4>
        <p>
          When ligands approach the metal ion, the 5 degenerate d-orbitals split into two sets: lower energy <strong>tâ‚‚g</strong> and higher energy <strong>eâ‚‰</strong>.
        </p>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>An electron absorbs light energy to jump from tâ‚‚g to eâ‚‰.</li>
          <li>The color observed is the <strong>complementary color</strong> of the light absorbed.</li>
          <li>Example: [Ti(Hâ‚‚O)â‚†]Â³âº absorbs blue-green light to excite its dÂ¹ electron, making it appear <strong>Violet</strong>.</li>
        </ul>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4 flex items-center">
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">â˜…</span>
            Real World Application
          </h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Gemstones & Pigments</h4>
            <p className="text-slate-600">
              The distinct red color of <strong>Ruby</strong> comes from CrÂ³âº impurities in Alâ‚‚Oâ‚ƒ. The crystal field of the oxide ions causes the d-electrons of Chromium to absorb green light and transmit red. Similarly, Emeralds get their green color from the same ion (CrÂ³âº) in a different crystal environment (Beryl), which changes the splitting energy (Î”â‚€).
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
            <span className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center mr-3 text-brand-dark text-sm">â˜…</span>
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

  // --- BIOLOGY TOPICS ---

  if (topic?.id === 'angiosperms-double-fertilisation-seed-development') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Angiosperms: Double Fertilisation and Seed Development</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Angiosperms are flowering plants. Their ovules are enclosed inside the ovary, and after fertilisation the ovule becomes a seed while the ovary develops into a fruit.
        </p>

        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 mb-8">
          <h3 className="text-lg font-bold text-emerald-900 mb-2">NCERT Reference</h3>
          <p className="text-sm text-emerald-900">
            Class 11 Biology, Unit 1: Diversity in the Living World, Chapter 3: Plant Kingdom, Section 3.5 Angiosperms. Also connected to Unit 2, Chapter 5: Morphology of Flowering Plants, Sections 5.7 The Seed and 5.7.2 Structure of Monocotyledonous Seed.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">1. Pollen Tube Growth</h3>
        <p>
          After pollination, the pollen grain lands on the stigma and germinates. It forms a <strong>pollen tube</strong> that grows through the style and reaches the ovule. This tube delivers the two male gametes directly into the embryo sac.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">2. The Double Fertilisation Event</h3>
        <p>
          Double fertilisation is a special feature of angiosperms. The pollen tube releases <strong>two male gametes</strong> inside the embryo sac.
        </p>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
            <h4 className="font-bold text-pink-900 mb-2">Syngamy</h4>
            <p className="text-sm text-slate-700">One male gamete fuses with the egg cell. This forms a diploid <strong>zygote</strong>, which later develops into the embryo.</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Triple Fusion</h4>
            <p className="text-sm text-slate-700">The second male gamete fuses with the secondary nucleus. This forms the triploid <strong>Primary Endosperm Nucleus (PEN)</strong>.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">3. Endosperm: The Food Bank</h3>
        <p>
          The PEN develops into the <strong>endosperm</strong>. Endosperm stores reserve food and nourishes the developing embryo. This is why double fertilisation is efficient: the plant forms the embryo and its food supply at the same time.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">4. Seed Maturation</h3>
        <p>
          After fertilisation, the ovule becomes the seed. A typical seed has a <strong>seed coat</strong> for protection and an embryo with a radicle, embryonal axis, and cotyledons.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Maize and cereals:</strong> Endosperm remains bulky. The aleurone layer separates it from the embryo.</li>
          <li><strong>Castor:</strong> Endosperm persists in the mature seed, so it is an endospermic seed.</li>
          <li><strong>Pea and bean:</strong> Endosperm is used up during development, and cotyledons become fleshy. These are non-endospermic seeds.</li>
        </ul>

        <div className="mt-10 pt-8 border-t border-slate-200">
          <h3 className="text-2xl font-display font-bold text-brand-primary mb-4">Real World Examples</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">Tender Coconut</h4>
              <p className="text-sm text-slate-600">Coconut water is liquid endosperm. The white malai is solid endosperm.</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">Rice and Wheat</h4>
              <p className="text-sm text-slate-600">The grain we eat is mostly stored endosperm, which was made to feed the young embryo.</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">Castor Oil</h4>
              <p className="text-sm text-slate-600">Castor seeds store rich reserves in the endosperm. Oil is extracted from these stored reserves.</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-2">Seed as a Life-Support Capsule</h4>
              <p className="text-sm text-slate-600">The seed coat protects, the embryo is the young plant, and the endosperm is the packed food supply.</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl mt-8">
          <h3 className="text-lg font-bold text-white mb-2">Learning Outcome</h3>
          <p className="text-sm text-slate-300">
            Double fertilisation is a two-in-one process: one fusion makes the embryo, and the second fusion makes the lunchbox called endosperm.
          </p>
        </div>
      </div>
    );
  }

  if (topic?.id === 'gametogenesis-hormonal-regulation') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Gametogenesis and Hormonal Regulation</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Gametogenesis is the formation of haploid gametes: sperms in males and ova in females. It is not an isolated event. It is controlled by hormones released from the pituitary gland.
        </p>

        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 mb-8">
          <h3 className="text-lg font-bold text-indigo-900 mb-2">NCERT Reference</h3>
          <p className="text-sm text-indigo-900">
            Class 11 Biology, Unit 2: Structural Organisation in Plants and Animals, Chapter 7, Section 7.2.2 Anatomy. Also connected to Unit 5: Human Physiology, Chapter 19, Sections 19.2.1 Pituitary Gland, 19.2.9 Testis, and 19.2.10 Ovary.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">1. The Control Center: Pituitary Gland</h3>
        <p>
          The pituitary gland releases two important gonadotrophins: <strong>FSH</strong> and <strong>LH</strong>. These hormones travel in blood and act on the gonads: testis in males and ovary in females.
        </p>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">FSH</h4>
            <p className="text-sm text-slate-700">Follicle Stimulating Hormone supports spermatogenesis in males and follicle growth in females.</p>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">LH</h4>
            <p className="text-sm text-slate-700">Luteinizing Hormone stimulates Leydig cells in males and triggers ovulation in females.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">2. In Males</h3>
        <p>
          In the testis, <strong>LH</strong> acts on Leydig cells. These cells secrete androgens, mainly testosterone. <strong>FSH and androgens together</strong> regulate spermatogenesis inside seminiferous tubules.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">LH &rarr; Leydig cells &rarr; Androgens</p>
          <p className="font-mono text-lg text-brand-primary text-center mt-2">FSH + Androgens &rarr; Spermatogenesis</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">3. In Females</h3>
        <p>
          In the ovary, <strong>FSH</strong> stimulates growth and development of ovarian follicles. Growing follicles secrete estrogen. A high <strong>LH</strong> pulse induces ovulation, and the remaining follicle becomes the corpus luteum, which secretes progesterone.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">FSH &rarr; Follicle growth &rarr; Estrogen</p>
          <p className="font-mono text-lg text-brand-primary text-center mt-2">LH surge &rarr; Ovulation &rarr; Corpus luteum &rarr; Progesterone</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">4. Why Meiosis Matters</h3>
        <p>
          Gametes are haploid. This means chromosome number is reduced from <strong>2n to n</strong> by meiosis. During fertilisation, two haploid gametes fuse and restore the diploid condition in the zygote.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">5. Real World Examples</h3>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">School Principal Analogy</h4>
            <p className="text-sm text-slate-600">The pituitary is like the principal. FSH and LH are permission slips that allow the gonads to begin work.</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Production Systems</h4>
            <p className="text-sm text-slate-600">Spermatogenesis is continuous mass production. Oogenesis prepares one high-quality ovum periodically.</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Indian Bullfrog</h4>
            <p className="text-sm text-slate-600">During monsoon, male frogs use vocal sacs and copulatory pads to support successful external fertilisation in water.</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Medical Application</h4>
            <p className="text-sm text-slate-600">Understanding hormone action helps explain hormone therapy for reproductive imbalance, just as insulin therapy helps diabetes.</p>
          </div>
        </div>

        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl mt-8">
          <h3 className="text-lg font-bold text-white mb-2">Learning Outcome</h3>
          <p className="text-sm text-slate-300">
            Students should understand that gamete formation is controlled by a brain-to-gonad hormone pathway. FSH and LH are the key signals that unlock sperm formation, follicle maturation, and ovulation.
          </p>
        </div>
      </div>
    );
  }

  if (topic?.id === 'pregnancy-hormonal-control-rh-incompatibility') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Hormonal Control of Pregnancy and Rh Incompatibility</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          A successful pregnancy needs chemical support from hormones and a secure placental barrier that keeps maternal and foetal blood properly separated.
        </p>

        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 mb-8">
          <h3 className="text-lg font-bold text-indigo-900 mb-2">NCERT Reference</h3>
          <p className="text-sm text-indigo-900">
            Class 11 Biology, Unit 5: Human Physiology. Chapter 15: Body Fluids and Circulation, Section 15.1.3.2 Rh Grouping. Chapter 19: Chemical Coordination and Integration, Sections 19.2.10 Ovary and 19.2.1 Pituitary.
          </p>
          <p className="text-sm text-indigo-900 mt-2">
            Note: detailed blastocyst attachment and chorionic villi anatomy are mainly handled in Class 12. This lab focuses on Class 11 components: progesterone support, oxytocin role, placental blood separation, and Rh incompatibility logic.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">1. Hormonal Maintenance of Pregnancy</h3>
        <p>
          <strong>Progesterone</strong> is secreted by the corpus luteum after ovulation. Its major role is to support pregnancy by maintaining a suitable uterine environment for the developing foetus.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Progesterone:</strong> supports pregnancy and keeps the uterine environment stable.</li>
          <li><strong>Estrogens:</strong> support growth and activity of female secondary sex organs.</li>
          <li><strong>Oxytocin:</strong> stimulates strong uterine contractions during childbirth.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">2. Placental Barrier Principle</h3>
        <p>
          The placenta is a selective interface between mother and foetus. Under normal conditions, maternal blood and foetal blood are <strong>well separated</strong>. This separation is important because the two blood systems may carry different antigens.
        </p>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 my-6">
          <h4 className="font-bold text-blue-900 mb-2">Simple idea</h4>
          <p className="text-sm text-blue-900">Nutrients and oxygen can pass through controlled exchange, but maternal and foetal RBCs should not directly mix.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">3. Rh Incompatibility</h3>
        <p>
          Rh incompatibility becomes important when the mother is <strong>Rh-negative</strong> and the foetus is <strong>Rh-positive</strong>. During the first pregnancy, the blood is normally separated. But during delivery, a small amount of foetal Rh-positive blood may enter the mother.
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Rh-positive foetal RBCs enter the Rh-negative mother's blood during delivery.</li>
          <li>The mother's immune system starts making antibodies against Rh antigen.</li>
          <li>In a later Rh-positive pregnancy, these antibodies may cross the placenta.</li>
          <li>The antibodies can destroy foetal RBCs, a condition called <strong>erythroblastosis foetalis</strong>.</li>
        </ol>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">4. Prevention Logic</h3>
        <p>
          Anti-Rh antibodies can be given to an Rh-negative mother after delivery to remove leaked Rh-positive foetal cells before the mother's immune system forms long-term memory against them.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">Rh+ foetal cells leak &rarr; Anti-Rh cleanup &rarr; No immune memory</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">5. Real World Analogies</h3>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Security Fence</h4>
            <p className="text-sm text-slate-600">The placenta is like a guarded border. Useful materials pass, but the two blood-cell populations should not mix.</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Selective Membrane</h4>
            <p className="text-sm text-slate-600">Like a water purifier membrane, the placenta permits selected exchange while blocking direct mixing of cells.</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Pregnancy Glue</h4>
            <p className="text-sm text-slate-600">Progesterone acts like support glue that keeps the uterine environment ready for pregnancy.</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Immune Memory</h4>
            <p className="text-sm text-slate-600">The danger is usually not the first exposure itself, but the antibodies remembered for a later Rh-positive pregnancy.</p>
          </div>
        </div>

        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl mt-8">
          <h3 className="text-lg font-bold text-white mb-2">Learning Outcome</h3>
          <p className="text-sm text-slate-300">
            Students should understand that pregnancy depends on constant hormonal support and that Rh incompatibility is dangerous because immune memory from the first delivery can affect a later pregnancy.
          </p>
        </div>
      </div>
    );
  }

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

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm my-6">
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

        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm my-6">
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
          <div className="bg-green-100 p-4 rounded border border-green-200 shadow-sm">
            <h5 className="font-bold text-green-800">Leading Strand (Easy Mode)</h5>
            <p className="text-sm">Follows the Helicase smoothly. Like driving on an empty highway.</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded border border-yellow-200 shadow-sm">
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
          <p className="font-mono text-xl text-brand-primary">y(x, t) = A sin(kx - Ï‰t + Ï†)</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-mono">
            <span>A: Amplitude</span>
            <span>k: Wave number (2Ï€/Î»)</span>
            <span>Ï‰: Angular frequency (2Ï€v)</span>
            <span>Ï†: Phase constant</span>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Wave Speed</h3>
        <p className="text-sm">
          The speed (v) of a wave depends on the interaction between two medium properties: <strong>Elasticity</strong> (restoring force) and <strong>Inertia</strong> (mass).
        </p>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm my-4">
          <h4 className="font-bold text-amber-900 mb-2">å¼¦ (String) Wave Speed</h4>
          <p className="text-sm">
            For a transverse wave on a string under tension (T) and linear mass density (Î¼):
            <br />
            <strong className="text-lg">v = âˆš(T/Î¼)</strong>
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Insight</h3>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm my-4 font-medium">
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

  if (topic?.id === 'binomial-nomenclature') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Binomial Nomenclature & Taxonomic Hierarchy</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          With millions of plant and animal species on Earth, common names create confusion. Biologists need a universally accepted system to name and organize organisms.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Binomial Nomenclature</h3>
        <p>
          Introduced by <strong>Carolus Linnaeus</strong>, this system provides every recognized species with a two-part scientific name.
        </p>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 my-6">
          <p className="font-mono text-xl text-emerald-800 text-center font-bold">
            <i>Mangifera indica</i>
          </p>
          <ul className="text-sm mt-4 space-y-2 text-emerald-900 list-disc ml-6">
            <li><strong>Generic name (Genus):</strong> <span className="font-mono">Mangifera</span> (Always starts with a Capital letter)</li>
            <li><strong>Specific epithet (Species):</strong> <span className="font-mono">indica</span> (Always starts with a small letter)</li>
          </ul>
        </div>
        
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <h4 className="font-bold text-slate-800 mb-2">Universal Rules of Nomenclature:</h4>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
            <li>Biological names are generally in Latin and written in <i>italics</i>. They are Latinised or derived from Latin irrespective of their origin.</li>
            <li>The first word in a biological name represents the genus while the second component denotes the specific epithet.</li>
            <li>Both the words in a biological name, when handwritten, are separately underlined, or printed in italics to indicate their Latin origin.</li>
            <li>The first word denoting the genus starts with a capital letter while the specific epithet starts with a small letter.</li>
          </ol>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Taxonomic Hierarchy</h3>
        <p>
          Taxonomy is not a single step process but involves a hierarchy of steps in which each step represents a rank or category. Since the category is a part of the overall taxonomic arrangement, it is called the taxonomic category and all categories together constitute the taxonomic hierarchy.
        </p>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 my-6">
          <div className="flex flex-col-reverse items-center justify-center space-y-reverse space-y-2 font-mono text-sm">
            <div className="bg-rose-100 border border-rose-300 w-64 text-center py-2 font-bold text-rose-900 rounded-lg">Kingdom (Broadest)</div>
            <div className="text-slate-400">â†‘</div>
            <div className="bg-orange-100 border border-orange-300 w-56 text-center py-2 font-bold text-orange-900 rounded-lg">Phylum / Division</div>
            <div className="text-slate-400">â†‘</div>
            <div className="bg-amber-100 border border-amber-300 w-48 text-center py-2 font-bold text-amber-900 rounded-lg">Class</div>
            <div className="text-slate-400">â†‘</div>
            <div className="bg-yellow-100 border border-yellow-300 w-40 text-center py-2 font-bold text-yellow-900 rounded-lg">Order</div>
            <div className="text-slate-400">â†‘</div>
            <div className="bg-lime-100 border border-lime-300 w-32 text-center py-2 font-bold text-lime-900 rounded-lg">Family</div>
            <div className="text-slate-400">â†‘</div>
            <div className="bg-green-100 border border-green-300 w-24 text-center py-2 font-bold text-green-900 rounded-lg">Genus</div>
            <div className="text-slate-400">â†‘</div>
            <div className="bg-emerald-100 border border-emerald-300 w-16 text-center py-2 font-bold text-emerald-900 rounded-lg">Species</div>
          </div>
          <p className="text-xs text-center text-slate-500 mt-6">As we go higher from species to kingdom, the number of common characteristics goes on decreasing.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Simulation Guide</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-4">
          <h4 className="font-bold text-blue-900 mb-2">What to explore in this lab:</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-800">
            <li><strong>Naming Challenge:</strong> Drag the correct genus and species names, ensuring capitalization rules are met. Try toggling italics to see if the name validates.</li>
            <li><strong>Classification Pyramid:</strong> Drag cards into the correct ranks of the hierarchy to build a complete classification from Species up to Kingdom.</li>
            <li>Observe how traits become more general and inclusive as you climb higher in the taxonomic ranks.</li>
          </ul>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'five-kingdom-classification') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Five Kingdom Classification</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The Five Kingdom Classification is a system proposed by R.H. Whittaker (1969) that divides all living organisms into five broad categories: Monera, Protista, Fungi, Plantae, and Animalia.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Concept Foundation & Criteria</h3>
        <p>
          Whittaker did not use just one character for classification. He used five specific scientific criteria:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
          <li><strong>Cell Structure:</strong> Whether the cells are Prokaryotic (primitive, no nuclear membrane) or Eukaryotic (advanced, with a nuclear membrane).</li>
          <li><strong>Body Organisation:</strong> Whether the organism is a single cell (Unicellular) or has many cells (Multicellular/Tissue/Organ systems).</li>
          <li><strong>Mode of Nutrition:</strong> How the organism gets its foodâ€”making it themselves (Autotrophic) or eating others (Heterotrophic).</li>
          <li><strong>Reproduction:</strong> The method by which they produce offspring.</li>
          <li><strong>Phylogenetic Relationships:</strong> Their evolutionary history and how they are related to ancestors.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. How it Works (The Five Kingdoms)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
            <h4 className="font-bold text-emerald-600">Kingdom Monera</h4>
            <p className="text-xs text-slate-500 mt-2">
              The most primitive. Prokaryotic and Unicellular. Cell wall is non-cellulosic. Bacteria are the sole members.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-sky-500">
            <h4 className="font-bold text-sky-600">Kingdom Protista</h4>
            <p className="text-xs text-slate-500 mt-2">
              All single-celled Eukaryotes. Primarily aquatic and form a link between plants, animals, and fungi.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
            <h4 className="font-bold text-amber-600">Kingdom Fungi</h4>
            <p className="text-xs text-slate-500 mt-2">
              Multicellular (except yeast) heterotrophic organisms. Unique feature is a cell wall made of chitin.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-green-600">
            <h4 className="font-bold text-green-700">Kingdom Plantae</h4>
            <p className="text-xs text-slate-500 mt-2">
              Eukaryotic chlorophyll-containing organisms. Cellulosic cell wall and autotrophic mode of nutrition.
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm border-t-4 border-t-rose-500 md:col-span-2">
            <h4 className="font-bold text-rose-600">Kingdom Animalia</h4>
            <p className="text-xs text-slate-500 mt-2">
              Multicellular, heterotrophic eukaryotes that lack cell walls. Depend directly or indirectly on plants for food.
            </p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Why This Concept Exists</h3>
        <p>
          Earlier systems like the Two Kingdom system (Plantae and Animalia) were inadequate because they put prokaryotes (bacteria) and eukaryotes (fungi/mosses) together simply because they had cell walls. Whittaker's system resolved this by looking at the internal structure and how they eat.
        </p>

        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-8">
          <h4 className="font-bold text-indigo-900 mb-2">Real-World Analogy (The Indian Pond):</h4>
          <p className="text-sm text-indigo-800">
            In a typical Indian village pond, you find many kingdoms interacting. The green scum on the water surface (Algae - Plantae), the bacteria in the mud (Monera), the tiny swimming organisms you see under a lens (Protista), the mushrooms on the damp bank (Fungi), and the fish (Animalia) all represent these five distinct categories living together.
          </p>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'bryophytes-pteridophytes') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Bryophytes and Pteridophytes</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Bryophytes and pteridophytes show two important stages in plant evolution. Bryophytes are small, non-vascular plants, while pteridophytes are the first land plants with vascular tissues.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Bryophytes: Gametophyte Dominance</h3>
        <p>
          Bryophytes are often called the <strong>amphibians of the plant kingdom</strong> because they grow on land but depend on water for sexual reproduction. Their main plant body is the <strong>gametophyte (n)</strong>, which is green, photosynthetic, and independent.
        </p>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">Important Features of Bryophytes</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-emerald-900">
            <li>No true roots, stems, or leaves are present.</li>
            <li>Rhizoids help in attachment and absorption.</li>
            <li>The sporophyte (2n) remains attached to the gametophyte for nourishment.</li>
            <li>Water is essential for transfer of male gametes during fertilisation.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Pteridophytes: Sporophyte Dominance</h3>
        <p>
          Pteridophytes are the <strong>first vascular land plants</strong>. They have xylem and phloem, which help in transport of water and minerals. Their dominant plant body is the <strong>sporophyte (2n)</strong>, which has true roots, stems, and leaves.
        </p>
        <div className="bg-sky-50 p-6 rounded-xl border border-sky-200 my-6">
          <h4 className="font-bold text-sky-900 mb-2">Important Features of Pteridophytes</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-sky-900">
            <li>They contain vascular tissues: xylem and phloem.</li>
            <li>The main plant body is large, independent, and differentiated into organs.</li>
            <li>The gametophyte is small, usually heart-shaped, and called a <strong>prothallus</strong>.</li>
            <li>Water is still required for fertilisation, but the sporophyte becomes the dominant phase.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Major Differences</h3>
        <div className="overflow-x-auto my-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Feature</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Bryophytes</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Pteridophytes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-3 font-semibold">Dominant phase</td>
                <td className="border border-slate-300 p-3">Gametophyte (n)</td>
                <td className="border border-slate-300 p-3">Sporophyte (2n)</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3 font-semibold">Vascular tissue</td>
                <td className="border border-slate-300 p-3">Absent</td>
                <td className="border border-slate-300 p-3">Present</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3 font-semibold">Plant body</td>
                <td className="border border-slate-300 p-3">No true roots, stems, leaves</td>
                <td className="border border-slate-300 p-3">True roots, stems, leaves</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3 font-semibold">Sporophyte nutrition</td>
                <td className="border border-slate-300 p-3">Dependent on gametophyte</td>
                <td className="border border-slate-300 p-3">Independent and free-living</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3 font-semibold">Examples</td>
                <td className="border border-slate-300 p-3">Funaria, Marchantia</td>
                <td className="border border-slate-300 p-3">Dryopteris, Selaginella, Equisetum</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Simple Analogy</h3>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 my-6">
          <h4 className="font-bold text-amber-900 mb-2">Water Bucket vs Pipe System</h4>
          <p className="text-sm text-amber-900">
            A bryophyte is like a small house that depends on carrying water by bucket, so it must remain small and near moisture. A pteridophyte is like a building with proper water pipes, so water can travel higher and the plant can grow taller.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Increase the height challenge and compare how moss and fern respond.</li>
            <li>Turn on vascular view to see that bryophytes lack xylem and phloem, while pteridophytes have them.</li>
            <li>Move through the life cycle steps to observe the shift from gametophyte dominance to sporophyte dominance.</li>
            <li>Change soil moisture and notice why water is important for fertilisation in both groups.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'algae') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Algae (Plant Kingdom)</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Algae are chlorophyll-bearing, simple, thalloid, autotrophic, and largely aquatic (freshwater and marine) organisms. They exist in various forms, from unicellular (Chlamydomonas) to colonial (Volvox) and filamentous (Ulothrix, Spirogyra).
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Three Main Classes</h3>
        <p>
          The classification of Algae into three main classes is primarily based on their <strong>pigment composition</strong> and <strong>stored food</strong>.
        </p>

        <div className="grid gap-6 my-6">
          <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm ">
            <h4 className="font-bold text-green-900 mb-2">1. Chlorophyceae (Green Algae)</h4>
            <ul className="list-disc pl-5 text-sm space-y-1 text-green-800">
              <li><strong>Pigments:</strong> Dominated by chlorophyll a and b, giving them a grass-green colour.</li>
              <li><strong>Stored Food:</strong> Stored in pyrenoids (located in chloroplasts), which contain protein and starch. Some store food as oil droplets.</li>
              <li><strong>Cell Wall:</strong> Rigid, with an inner layer of cellulose and an outer layer of pectose.</li>
              <li><strong>Reproduction:</strong> Asexual by flagellated zoospores. Sexual can be isogamous, anisogamous, or oogamous.</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm ">
            <h4 className="font-bold text-yellow-900 mb-2">2. Phaeophyceae (Brown Algae)</h4>
            <ul className="list-disc pl-5 text-sm space-y-1 text-yellow-800">
              <li><strong>Pigments:</strong> Chlorophyll a, c, carotenoids, and xanthophylls (specifically fucoxanthin, which determines the shade of brown).</li>
              <li><strong>Stored Food:</strong> Complex carbohydrates like laminarin or mannitol.</li>
              <li><strong>Cell Wall:</strong> Cellulosic wall covered by a gelatinous coating of algin.</li>
              <li><strong>Reproduction:</strong> Asexual via biflagellate, pear-shaped (pyriform) zoospores with two unequal lateral flagella.</li>
            </ul>
          </div>

          <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 shadow-sm ">
            <h4 className="font-bold text-rose-900 mb-2">3. Rhodophyceae (Red Algae)</h4>
            <ul className="list-disc pl-5 text-sm space-y-1 text-rose-800">
              <li><strong>Pigments:</strong> Predominance of the red pigment r-phycoerythrin.</li>
              <li><strong>Stored Food:</strong> Floridean starch (structurally similar to amylopectin and glycogen).</li>
              <li><strong>Cell Wall:</strong> Cellulose, pectin, and polysulphate esters.</li>
              <li><strong>Reproduction:</strong> Asexual by non-motile spores. Sexual is exclusively oogamous with non-motile gametes.</li>
            </ul>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Real-World Applications</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-1">ðŸŒŠ Nature (The Oxygen Factory)</h4>
            <p className="text-sm">At least half of the total carbon dioxide fixation on earth is carried out by algae. Like a giant underwater lung, they increase dissolved oxygen levels, supporting all aquatic life.</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-1">ðŸ® Daily Life (The Kitchen Thickener)</h4>
            <p className="text-sm">Agar (from Gelidium and Gracilaria) is used in making Indian desserts, ice creams, and jellies. Carrageen (from red algae) and Algin (from brown algae) are hydrocolloids used as thickening agents in various industries.</p>
          </div>
          <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-1">ðŸš€ Space & Engineering (Space Food)</h4>
            <p className="text-sm">Chlorella, a unicellular green alga, is so rich in proteins that it is used as a food supplement for space travellers where traditional farming is impossible.</p>
          </div>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'gymnosperms-angiosperms') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Gymnosperms and Angiosperms</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The seed-bearing plants are divided into two major groups: Gymnosperms and Angiosperms. The fundamental difference lies in whether the seeds are "naked" or enclosed within a fruit.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Gymnosperms: The Naked Seed Plants</h3>
        <p>
          In Gymnosperms (Greek: <em>gymnos</em> = naked, <em>sperma</em> = seeds), the ovules are not enclosed by any ovary wall. They remain exposed both before and after fertilisation.
        </p>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">Key Features of Gymnosperms</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-emerald-900">
            <li><strong>Seeds:</strong> Naked seeds developed on the surface of scales or leaves (sporophylls).</li>
            <li><strong>Reproductive Organs:</strong> Produced in compact structures called <strong>cones</strong> or strobili.</li>
            <li><strong>Habit:</strong> Mostly medium to large-sized trees (e.g., <em>Sequoia</em>, the giant redwood).</li>
            <li><strong>Examples:</strong> <em>Cycas</em>, <em>Pinus</em>, <em>Cedrus</em> (Deodar).</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Angiosperms: The Flowering Plants</h3>
        <p>
          Angiosperms are the most dominant group of plants. Here, the pollen grains and ovules are developed in specialised structures called <strong>flowers</strong>.
        </p>
        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 my-6">
          <h4 className="font-bold text-amber-900 mb-2">Key Features of Angiosperms</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-amber-900">
            <li><strong>Seeds:</strong> Enclosed within fruits (matured ovaries).</li>
            <li><strong>Diversity:</strong> Range from tiny <em>Wolffia</em> to tall <em>Eucalyptus</em> (over 100m).</li>
            <li><strong>Classes:</strong> Divided into <strong>Dicotyledons</strong> (two cotyledons) and <strong>Monocotyledons</strong> (one cotyledon).</li>
            <li><strong>Pollination:</strong> Occurs via wind, water, and often animals (insects, birds).</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Double Fertilisation</h3>
        <p>
          A unique event occurs in Angiosperms that is not found anywhere else in the plant kingdom. Each pollen grain produces <strong>two male gametes</strong>.
        </p>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <h4 className="font-bold text-blue-900 mb-2">The "Two-Event" Process</h4>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="p-3 bg-white/50 rounded-lg border border-blue-100">
              <strong>1. Syngamy:</strong> One male gamete + Egg cell â†’ <strong>Zygote (2n)</strong>
            </div>
            <div className="p-3 bg-white/50 rounded-lg border border-blue-100">
              <strong>2. Triple Fusion:</strong> Second male gamete + Diploid Secondary Nucleus â†’ <strong>Primary Endosperm Nucleus (3n)</strong>
            </div>
            <p className="mt-2 font-semibold italic text-center">Because two fusions occur, it is called Double Fertilisation.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Major Comparison</h3>
        <div className="overflow-x-auto my-6">
          <table className="min-w-full border-collapse border border-slate-300 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-300 p-2">Feature</th>
                <th className="border border-slate-300 p-2">Gymnosperms</th>
                <th className="border border-slate-300 p-2">Angiosperms</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Ovule/Seed</td>
                <td className="border border-slate-300 p-2">Naked (exposed)</td>
                <td className="border border-slate-300 p-2">Enclosed in ovary/fruit</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Flower</td>
                <td className="border border-slate-300 p-2">Absent (Cones instead)</td>
                <td className="border border-slate-300 p-2">Present</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Fertilisation</td>
                <td className="border border-slate-300 p-2">Single fertilisation</td>
                <td className="border border-slate-300 p-2">Double fertilisation</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Endosperm</td>
                <td className="border border-slate-300 p-2">Haploid (n), formed before fertilisation</td>
                <td className="border border-slate-300 p-2">Triploid (3n), formed after fertilisation</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Analogy</h3>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
            <h4 className="font-bold text-indigo-900 mb-1">ðŸŽ The Gift Box</h4>
            <p className="text-sm">A Gymnosperm seed is like a toy on a shelf. An Angiosperm seed is like a toy inside a gift box (the fruit). You must open the box to find the seed!</p>
          </div>
          <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-1">ðŸŒ² Pine vs ðŸ¥­ Mango</h4>
            <p className="text-sm">In Manali, Pine seeds are exposed on woody cones. In the plains, Mango seeds are hidden deep inside the fleshy fruit.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 my-4">
          <ul className="list-decimal pl-5 space-y-2 text-sm text-slate-700 font-medium">
            <li>Select <strong>"Gymnosperm"</strong> and click Pollination. Notice the pollen lands directly on the exposed ovule.</li>
            <li>Select <strong>"Angiosperm"</strong>. Use the <strong>X-Ray Slider</strong> to see the ovules hidden inside the thick ovary wall.</li>
            <li>Trigger Pollination in Angiosperm and watch the pollen tube grow a long path down the style.</li>
            <li>In <strong>Slow-Mo mode</strong>, witness Double Fertilisation: see one gamete create the Zygote and the other create the Endosperm.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'animal-kingdom-non-chordates') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Animal Kingdom</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The earliest non-chordate animals show simple but highly effective body plans. In this topic, we focus on the canal system of sponges and the polyp-medusa life cycle in cnidarians.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Porifera: The Canal System</h3>
        <p>
          Sponges are the most primitive multicellular animals. Their body works like a living filter because water continuously moves through a canal system.
        </p>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">Water Pathway in a Sponge</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-emerald-900">
            <li>Water enters through tiny pores called <strong>ostia</strong>.</li>
            <li>It moves into the central cavity called the <strong>spongocoel</strong>.</li>
            <li>Finally, it exits through the large opening called the <strong>osculum</strong>.</li>
            <li><strong>Choanocytes</strong> or collar cells create the water current by beating their flagella.</li>
          </ul>
        </div>
        <p>
          This one current helps the sponge in three ways: <strong>food collection</strong>, <strong>gas exchange</strong>, and <strong>waste removal</strong>. Because the sponge is sessile, this flow-through design is essential for survival.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Cnidaria: Polyp, Medusa and Metagenesis</h3>
        <p>
          Cnidarians have tissue-level organisation and can show two body forms:
        </p>
        <div className="grid gap-4 my-6">
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">Polyp</h4>
            <p className="text-sm text-sky-900">A sessile, cylindrical form fixed to a surface. Hydra and sea anemone are familiar examples.</p>
          </div>
          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200">
            <h4 className="font-bold text-indigo-900 mb-2">Medusa</h4>
            <p className="text-sm text-indigo-900">A free-swimming, umbrella-shaped form. Jellyfish is the common example.</p>
          </div>
        </div>
        <p>
          In <strong>Obelia</strong>, both forms appear in the life cycle. This alternation is called <strong>metagenesis</strong>.
        </p>
        <div className="bg-violet-50 p-6 rounded-xl border border-violet-200 my-6">
          <h4 className="font-bold text-violet-900 mb-2">Metagenesis in Simple Language</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-violet-900">
            <li>The <strong>polyp</strong> produces medusae asexually.</li>
            <li>The <strong>medusa</strong> produces gametes sexually.</li>
            <li>After fertilisation, a new polyp stage begins again.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Simple Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Sponge as a Water Filter</h4>
            <p className="text-sm text-amber-900">A sponge behaves like a household filter. Water enters through many tiny openings, useful particles are trapped, and water leaves from the top.</p>
          </div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">Cnidaria as a Shape-Shifter</h4>
            <p className="text-sm text-rose-900">The polyp form is like a fixed station, while the medusa form is like a mobile drone. One body form is good for staying and growing, the other for moving and reproduction.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. What to Explore in the Simulation</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Turn the sponge pump on and off and observe whether particles enter through ostia.</li>
            <li>Use the cut-away view to identify spongocoel and choanocytes.</li>
            <li>Advance the Obelia life cycle from polyp to medusa.</li>
            <li>Observe how the asexual stage leads to the sexual stage and then back to a new polyp.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'morphology-flowering-plants') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Morphology of Flowering Plants</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The external form of roots, stems, and leaves helps a flowering plant absorb water, capture sunlight, climb, and protect itself. This topic studies those visible structures and their modifications.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Root Systems</h3>
        <p>
          The root is usually the underground part of the plant and develops from the radicle. Different plants show different root systems.
        </p>
        <div className="grid gap-4 my-6">
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">Tap Root System</h4>
            <p className="text-sm text-emerald-900">Common in dicot plants like mustard. The primary root persists and gives rise to secondary and tertiary roots.</p>
          </div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">Fibrous Root System</h4>
            <p className="text-sm text-sky-900">Common in monocot plants like wheat. The primary root becomes short-lived, and many roots arise from the base of the stem.</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Adventitious Roots</h4>
            <p className="text-sm text-amber-900">These arise from plant parts other than the radicle, as seen in banyan and many grasses.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Phyllotaxy</h3>
        <p>
          Phyllotaxy is the arrangement of leaves on the stem or branch. It helps leaves receive better sunlight by reducing shading.
        </p>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li><strong>Alternate:</strong> One leaf arises at each node, for example mustard and China rose.</li>
            <li><strong>Opposite:</strong> Two leaves arise at each node and lie opposite each other, for example guava and Calotropis.</li>
            <li><strong>Whorled:</strong> More than two leaves arise at a node and form a circle, for example Alstonia.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Modifications for Support and Defense</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-lime-50 p-5 rounded-xl border border-lime-200">
            <h4 className="font-bold text-lime-900 mb-2">Tendrils</h4>
            <p className="text-sm text-lime-900">Tendrils are slender, coiled structures that help weak plants climb by holding nearby support. In peas, leaves are modified into tendrils.</p>
          </div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">Spines and Thorns</h4>
            <p className="text-sm text-rose-900">Spines and thorns protect plants from grazing animals. In cacti, leaves become spines, which also help reduce water loss.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Everyday Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Anchor vs Mat</h4>
            <p className="text-sm text-slate-700">A tap root acts like a deep anchor, while a fibrous root system spreads like a floor mat over the surface.</p>
          </div>
          <div className="bg-cyan-50 p-5 rounded-xl border border-cyan-200">
            <h4 className="font-bold text-cyan-900 mb-2">Solar Panel Arrangement</h4>
            <p className="text-sm text-cyan-900">Phyllotaxy is like careful placement of solar panels so one does not block light from another.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. What to Explore in the Simulation</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Select mustard and wheat to compare tap root and fibrous root systems.</li>
            <li>Increase growth level to see how the root system extends over time.</li>
            <li>Change the phyllotaxy dial to alternate, opposite, and whorled.</li>
            <li>Place a trellis or goat and observe how tendrils or spines improve survival.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'animal-tissues') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Animal Tissues</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          A tissue is a group of cells that share a similar structure and perform a common function. In animals, four fundamental tissue types â€” epithelial, connective, muscular, and neural â€” build every organ in the body. This topic focuses on the two most testable: epithelial and connective.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Epithelial Tissue</h3>
        <p>
          Epithelial tissues form a continuous sheet that covers all body surfaces, lines body cavities, and forms the lining of ducts and tubes. Their cells are tightly packed with very little intercellular matrix between them, and they always rest on a <strong>basement membrane</strong>.
        </p>

        <div className="grid gap-4 my-6">
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">Simple Epithelium â€” One Cell Thick</h4>
            <p className="text-sm text-sky-900">
              Composed of a <strong>single layer</strong> of cells resting on the basement membrane. Because it is only one cell thick, it is highly suited for processes that require substances to pass through easily â€” such as <strong>diffusion, filtration, and secretion</strong>.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1 text-sm text-sky-800">
              <li><strong>Squamous:</strong> Flat, tile-like cells. Found in walls of blood vessels and air sacs (alveoli) of the lungs.</li>
              <li><strong>Cuboidal:</strong> Cube-shaped cells. Found in kidney tubules and salivary gland ducts.</li>
              <li><strong>Columnar:</strong> Tall, column-shaped cells. Found in the lining of the stomach and intestines.</li>
              <li><strong>Ciliated:</strong> Columnar cells with hair-like cilia. Found in the respiratory tract to move mucus.</li>
            </ul>
          </div>
          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200">
            <h4 className="font-bold text-indigo-900 mb-2">Compound (Stratified) Epithelium â€” Multiple Layers</h4>
            <p className="text-sm text-indigo-900">
              Consists of <strong>two or more layers</strong> of cells. The primary function is <strong>protection</strong> against mechanical abrasion, chemical stress, and desiccation. Secretion and absorption are limited due to the thickness.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1 text-sm text-indigo-800">
              <li>Found on the <strong>dry surface of the skin</strong> (stratified squamous, keratinised).</li>
              <li>Found on the <strong>moist surface of the buccal cavity</strong>, oesophagus, and pharynx (non-keratinised).</li>
              <li>As the top layers wear off, the lower layers regenerate and push upward.</li>
            </ul>
          </div>
        </div>

        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm font-bold text-slate-800 text-center mb-2">Simple vs Compound â€” The Core Rule</p>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-700 text-center">
            <div><strong>Simple</strong><br />1 layer â†’ easy diffusion â†’ filter</div>
            <div><strong>Compound</strong><br />2+ layers â†’ physical barrier â†’ armour</div>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Connective Tissue</h3>
        <p>
          Connective tissues are the most <strong>abundant and widely distributed</strong> tissues in the body. They link, support, and anchor other tissues and organs. Unlike epithelial tissue, they have abundant <strong>intercellular matrix</strong> (ground substance + fibres) with cells scattered within it.
        </p>
        <p className="mt-3">
          Cartilage and Bone are classified as <strong>Specialised Connective Tissues</strong>.
        </p>

        <div className="grid gap-4 my-6">
          <div className="bg-teal-50 p-5 rounded-xl border border-teal-200">
            <h4 className="font-bold text-teal-900 mb-2">Cartilage â€” Solid but Pliable Matrix</h4>
            <p className="text-sm text-teal-900">
              The intercellular matrix is <strong>solid and pliable</strong>, resisting compression without being brittle. This flexibility comes from <strong>chondroitin sulphate</strong> â€” a gel-like compound that traps water and acts as a natural shock absorber.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1 text-sm text-teal-800">
              <li>Cells: <strong>Chondrocytes</strong>, housed in fluid-filled spaces called <strong>lacunae</strong>.</li>
              <li>Found at the <strong>tip of the nose</strong>, outer ear, between vertebrae, and at joint surfaces of long bones.</li>
              <li>Provides a smooth gliding surface and cushions vertebral discs.</li>
            </ul>
          </div>
          <div className="bg-slate-100 p-5 rounded-xl border border-slate-300">
            <h4 className="font-bold text-slate-800 mb-2">Bone â€” Very Hard, Non-Pliable Matrix</h4>
            <p className="text-sm text-slate-700">
              The matrix is <strong>very hard and non-pliable</strong> due to <strong>calcium phosphate salts</strong> deposited around a framework of <strong>collagen fibres</strong>. This gives bone exceptional strength.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1 text-sm text-slate-700">
              <li>Cells: <strong>Osteocytes</strong>, also housed in lacunae.</li>
              <li>Provides the <strong>skeletal frame</strong>, protects vital organs, supports body weight, and anchors muscles.</li>
              <li>Matrix is organised in concentric rings around a central <strong>Haversian canal</strong> containing blood vessels.</li>
            </ul>
          </div>
        </div>

        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Feature</th>
                <th className="border border-slate-300 p-3 text-left font-bold text-teal-700">Cartilage</th>
                <th className="border border-slate-300 p-3 text-left font-bold text-slate-700">Bone</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-300 p-3">Matrix</td><td className="border border-slate-300 p-3 text-teal-700">Solid and pliable</td><td className="border border-slate-300 p-3">Very hard, non-pliable</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3">Key compound</td><td className="border border-slate-300 p-3 text-teal-700">Chondroitin salts</td><td className="border border-slate-300 p-3">Calcium salts + collagen</td></tr>
              <tr><td className="border border-slate-300 p-3">Cells</td><td className="border border-slate-300 p-3 text-teal-700">Chondrocytes</td><td className="border border-slate-300 p-3">Osteocytes</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3">Blood supply</td><td className="border border-slate-300 p-3 text-teal-700">Avascular</td><td className="border border-slate-300 p-3">Highly vascular (Haversian canals)</td></tr>
              <tr><td className="border border-slate-300 p-3">Function</td><td className="border border-slate-300 p-3 text-teal-700">Shock absorption, joint smoothness</td><td className="border border-slate-300 p-3">Support, protection, movement</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3">Location</td><td className="border border-slate-300 p-3 text-teal-700">Nose tip, ear, vertebral discs</td><td className="border border-slate-300 p-3">Skull, ribs, limb bones</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Real-World Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Glass Pane vs Brick Wall (Epithelium)</h4>
            <p className="text-sm text-amber-900">
              Simple epithelium is like a <strong>thin glass pane</strong> â€” allows gases and nutrients through easily but offers no protection. Compound epithelium is like a <strong>brick wall</strong> â€” multiple layers thick, blocks mechanical and chemical attack.
            </p>
          </div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">Rubber Pad vs Steel Girder (Connective)</h4>
            <p className="text-sm text-rose-900">
              Cartilage behaves like <strong>industrial rubber pads under a bridge</strong> â€” absorbs shock, allows slight movement. Bone behaves like a <strong>steel I-beam</strong> â€” completely rigid, bears the full structural load.
            </p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">Bubble Wrap vs Wooden Crate (Packaging)</h4>
            <p className="text-sm text-emerald-900">
              Cartilage is like <strong>bubble wrap</strong> â€” compresses and bounces back. Bone is like a <strong>wooden crate</strong> â€” does not deform, prevents crushing.
            </p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. What to Explore in the Simulation</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Select <strong>Simple Epithelium</strong> and move the Friction Slider to 50% â€” watch the layer tear and expose the interior.</li>
            <li>Switch to <strong>Compound Epithelium</strong> with the same friction â€” only the top layer wears; lower layers stay intact.</li>
            <li>Apply the <strong>Chemical Dropper</strong> to Simple Epithelium â€” acid reaches the interior instantly. Apply to Compound â€” top layers neutralise it.</li>
            <li>Select <strong>Cartilage</strong> and increase Weight Dial to 100 kg â€” the block compresses and springs back.</li>
            <li>Switch to <strong>Bone</strong> at 100 kg â€” zero compression. Push to 90+ kg to see the bone crack.</li>
            <li>Use the <strong>Zoom button</strong> to enter the microscopic view â€” compare calcium crystal lattice (Bone) vs chondroitin chain network (Cartilage).</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'frogs') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Frog Organ Systems & Anatomy</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Frogs are amphibians, so they are adapted for life both in water and on land. Their body cavity contains well-developed organ systems for digestion, respiration, circulation, coordination, and reproduction.
        </p>

        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">NCERT Reference</h4>
          <p className="text-sm text-emerald-900">
            Class 11 Biology, Unit 2: Structural Organisation in Plants and Animals, Chapter 7: Structural Organisation in Animals, Section 7.2.2 Anatomy.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Digestive System</h3>
        <p>
          Frogs are carnivorous. Because animal food is easier to digest than plant fibre, the alimentary canal is comparatively short. Food is captured by the <strong>bilobed tongue</strong> and passes through this path:
        </p>
        <div className="my-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-center text-sm font-bold text-amber-900">
          Mouth &rarr; Buccal cavity &rarr; Pharynx &rarr; Oesophagus &rarr; Stomach &rarr; Duodenum &rarr; Intestine &rarr; Rectum &rarr; Cloaca
        </div>
        <p>
          In the stomach, hydrochloric acid and gastric juice convert food into <strong>chyme</strong>. Chyme enters the duodenum, where bile from the gall bladder and pancreatic juice reach through a common bile duct. Digested food is absorbed by <strong>villi</strong> and <strong>microvilli</strong> in the intestine.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Respiratory System</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">In Water: Cutaneous Respiration</h4>
            <p className="text-sm text-sky-900">Dissolved oxygen diffuses through the moist, highly vascular skin. This is called cutaneous respiration.</p>
          </div>
          <div className="bg-lime-50 p-5 rounded-xl border border-lime-200">
            <h4 className="font-bold text-lime-900 mb-2">On Land: Pulmonary Respiration</h4>
            <p className="text-sm text-lime-900">The frog uses a pair of elongated, pink, sac-like lungs for breathing. Skin can still help in gas exchange.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Circulatory System</h3>
        <p>
          Frogs have a <strong>closed vascular system</strong> and a lymphatic system. The heart is muscular and has <strong>three chambers</strong>: two atria and one ventricle. A triangular <strong>sinus venosus</strong> receives deoxygenated blood from the vena cava and sends it to the right atrium. The ventricle opens into the <strong>conus arteriosus</strong>.
        </p>
        <div className="grid gap-4 my-6">
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">Portal Systems</h4>
            <p className="text-sm text-rose-900">The hepatic portal system connects intestine and liver. The renal portal system connects the lower body and kidneys.</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Blood Cells</h4>
            <p className="text-sm text-slate-700">Blood contains nucleated RBCs with haemoglobin, WBCs, and platelets.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Nervous System and Sense Organs</h3>
        <p>
          The nervous system has three parts: <strong>CNS</strong> (brain and spinal cord), <strong>PNS</strong> (10 pairs of cranial nerves and spinal nerves), and <strong>ANS</strong>. The brain is protected by the bony <strong>cranium</strong>.
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Brain Part</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Main Structures</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-300 p-3 font-bold">Forebrain</td><td className="border border-slate-300 p-3">Olfactory lobes and cerebral hemispheres</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3 font-bold">Midbrain</td><td className="border border-slate-300 p-3">Optic lobes</td></tr>
              <tr><td className="border border-slate-300 p-3 font-bold">Hindbrain</td><td className="border border-slate-300 p-3">Cerebellum and medulla oblongata</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Sense organs include sensory papillae for touch, taste buds, nasal epithelium for smell, simple eyes for vision, and tympanum with internal ears for hearing and balance.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Reproductive System</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">Male Frog</h4>
            <p className="text-sm text-emerald-900">A pair of yellowish ovoid testes is attached to the kidneys by mesorchium. Around 10-12 vasa efferentia enter the kidney and open into Bidder's canal, which communicates with the urinogenital duct and then the cloaca.</p>
          </div>
          <div className="bg-teal-50 p-5 rounded-xl border border-teal-200">
            <h4 className="font-bold text-teal-900 mb-2">Female Frog</h4>
            <p className="text-sm text-teal-900">A pair of ovaries lies near the kidneys, but there is no functional connection with the kidneys. Oviducts open separately into the cloaca. A female can lay about 2500-3000 ova at one time.</p>
          </div>
        </div>
        <p>
          Fertilisation is <strong>external</strong> and occurs in water. The larva is called a <strong>tadpole</strong>, which later undergoes metamorphosis to become an adult frog.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Real-World Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">Hybrid Vehicle</h4>
            <p className="text-sm text-sky-900">A frog changes its breathing method like a hybrid vehicle changes power source: skin in water, lungs on land.</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Common Terminal</h4>
            <p className="text-sm text-slate-700">The cloaca is like one shared exit terminal where digestive waste, urine, and reproductive cells pass out through a common opening.</p>
          </div>
          <div className="bg-lime-50 p-5 rounded-xl border border-lime-200">
            <h4 className="font-bold text-lime-900 mb-2">Natural Pest Control</h4>
            <p className="text-sm text-lime-900">By eating insects in fields, frogs help farmers reduce pests and maintain ecological balance.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. What to Explore in the Simulation</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Use <strong>Land</strong> mode and observe the lungs as the main respiratory organ.</li>
            <li>Switch to <strong>Water</strong> mode and notice the skin glow for cutaneous respiration.</li>
            <li>Move the food trigger to follow insect capture, stomach digestion, duodenum action, and intestinal absorption.</li>
            <li>Select the circulatory overlay and identify the sinus venosus, conus arteriosus, and three-chambered heart.</li>
            <li>Use the gender selector to compare male vasa efferentia and Bidder's canal with female ovaries and oviducts.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'cell-membrane-transport') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Cell Membrane: Fluid Mosaic Model and Transport</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The cell membrane is not a rigid wall. It is a flexible, selectively permeable boundary that controls what enters and leaves the cell.
        </p>

        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 my-6">
          <h4 className="font-bold text-indigo-900 mb-2">NCERT Reference</h4>
          <p className="text-sm text-indigo-900">
            Class 11 Biology, Unit 3: Cell: Structure and Functions, Chapter 8: Cell: The Unit of Life, Section 8.5.1 Cell Membrane.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Fluid Mosaic Model</h3>
        <p>
          Singer and Nicolson proposed the <strong>Fluid Mosaic Model</strong> in 1972. According to this model, the membrane is a <strong>quasi-fluid</strong> structure made mainly of lipids and proteins.
        </p>
        <div className="grid gap-4 my-6">
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">Phospholipid Bilayer</h4>
            <p className="text-sm text-sky-900">
              Each phospholipid has a polar hydrophilic head and non-polar hydrophobic tails. Heads face the watery outside and inside of the cell. Tails remain tucked inside, away from water.
            </p>
          </div>
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-200">
            <h4 className="font-bold text-violet-900 mb-2">Membrane Proteins</h4>
            <p className="text-sm text-violet-900">
              <strong>Peripheral proteins</strong> lie on the membrane surface. <strong>Integral proteins</strong> are partly or completely buried in the membrane and often work as channels, carriers, or pumps.
            </p>
          </div>
        </div>
        <p>
          Membrane fluidity allows proteins to move laterally. This is important for cell growth, secretion, endocytosis, cell division, and membrane repair.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Selective Permeability</h3>
        <p>
          The membrane is <strong>selectively permeable</strong>. It allows some substances to pass easily, slows some down, and blocks others unless a protein helps.
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Substance</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Can it cross directly?</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-300 p-3">Small neutral solutes like O2 and CO2</td><td className="border border-slate-300 p-3 text-emerald-700 font-bold">Yes</td><td className="border border-slate-300 p-3">They dissolve through the lipid bilayer.</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3">Polar molecules like glucose</td><td className="border border-slate-300 p-3 text-amber-700 font-bold">Need help</td><td className="border border-slate-300 p-3">Hydrophobic tails block them, so carrier proteins are required.</td></tr>
              <tr><td className="border border-slate-300 p-3">Ions like Na+ and K+</td><td className="border border-slate-300 p-3 text-red-700 font-bold">No direct crossing</td><td className="border border-slate-300 p-3">Charge cannot pass through the non-polar core easily.</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Transport Across Membrane</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">Passive Transport</h4>
            <p className="text-sm text-emerald-900">Movement from high concentration to low concentration without ATP. Simple diffusion and osmosis are examples.</p>
          </div>
          <div className="bg-pink-50 p-5 rounded-xl border border-pink-200">
            <h4 className="font-bold text-pink-900 mb-2">Facilitated Diffusion</h4>
            <p className="text-sm text-pink-900">Polar molecules move down their concentration gradient using carrier proteins. ATP is not used.</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Active Transport</h4>
            <p className="text-sm text-amber-900">Molecules or ions move against the concentration gradient, from low to high concentration. This requires ATP and membrane pumps such as the Na+/K+ pump.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Delhi Metro Gate</h4>
            <p className="text-sm text-slate-700">Simple diffusion is like an open passage. Facilitated diffusion is like an entry gate that allows selected passengers. Active transport is like a powered gate pushing people against the crowd flow.</p>
          </div>
          <div className="bg-cyan-50 p-5 rounded-xl border border-cyan-200">
            <h4 className="font-bold text-cyan-900 mb-2">RO Water Filter</h4>
            <p className="text-sm text-cyan-900">A semi-permeable RO membrane allows water to pass while blocking many contaminants, similar to selective permeability.</p>
          </div>
          <div className="bg-lime-50 p-5 rounded-xl border border-lime-200">
            <h4 className="font-bold text-lime-900 mb-2">Oil in Water</h4>
            <p className="text-sm text-lime-900">Oil avoids mixing with water. Similarly, hydrophobic phospholipid tails hide inside the bilayer, away from the watery surroundings.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. What to Explore in the Simulation</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Use the <strong>Fluidity Tug</strong> to see proteins and lipids shift laterally.</li>
            <li>Select <strong>Neutral</strong> molecules and run transport through the simple bilayer.</li>
            <li>Select <strong>Polar</strong> molecules and observe that the bilayer blocks them until a carrier protein is added.</li>
            <li>Select <strong>Ion</strong>, choose Active Pump, and use ATP to move ions against the concentration gradient.</li>
            <li>Change inside and outside concentration sliders to compare passive movement with active transport.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'biomolecules') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Biomolecules</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Biomolecules are carbon compounds obtained from living tissues. They may be small micromolecules in the acid-soluble pool or large macromolecules in the acid-insoluble fraction.
        </p>

        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">NCERT Reference</h4>
          <p className="text-sm text-emerald-900">
            Class 11 Biology, Unit 3: Cell: Structure and Functions, Chapter 9: Biomolecules. Relevant sections: 9.1, 9.4, 9.5, and 9.6.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Amino Acids</h3>
        <p>
          Amino acids are organic compounds with an amino group and an acidic carboxyl group attached to the same <strong>alpha-carbon</strong>. They are the building blocks of proteins.
        </p>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <h4 className="font-bold text-indigo-900 mb-2">Substituted Methane Logic</h4>
          <p className="text-sm text-indigo-900">
            Think of methane, CH4. Around the central carbon, four positions are occupied by H, COOH, NH2, and a variable R group. The R group decides the amino acid identity.
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-1 text-sm text-indigo-900">
            <li>R = H gives <strong>Glycine</strong>.</li>
            <li>R = CH3 gives <strong>Alanine</strong>.</li>
            <li>R = CH2OH gives <strong>Serine</strong>.</li>
          </ul>
        </div>
        <p>
          Because amino and carboxyl groups are ionisable, amino acids can exist as <strong>zwitterions</strong>, carrying both positive and negative charges in the same molecule.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Lipids and Triglycerides</h3>
        <p>
          Lipids are water-insoluble organic compounds. A triglyceride forms when <strong>three fatty acids are esterified with glycerol</strong>.
        </p>
        <div className="grid gap-4 my-6">
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Glycerol</h4>
            <p className="text-sm text-amber-900">Glycerol is trihydroxy propane. It has three hydroxyl groups, so three fatty acid chains can attach.</p>
          </div>
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
            <h4 className="font-bold text-orange-900 mb-2">Fatty Acids</h4>
            <p className="text-sm text-orange-900">A fatty acid has a carboxyl group attached to a hydrocarbon chain. Palmitic acid, for example, has 16 carbon atoms.</p>
          </div>
        </div>
        <p>
          Based on melting point, lipids may behave as fats or oils. Oils have lower melting points and remain liquid more easily.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Sugars and Polysaccharides</h3>
        <p>
          Monosaccharides are small sugars that act as building blocks for larger carbohydrates. <strong>Glucose</strong> and <strong>ribose</strong> are important examples. When many sugar units join, they form polysaccharides such as starch, glycogen, or cellulose.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Nucleotides and Nucleic Acids</h3>
        <p>
          Nucleotides are the building blocks of DNA and RNA. Each nucleotide has three parts:
        </p>
        <div className="grid gap-4 my-6">
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">Nitrogen Base</h4>
            <p className="text-sm text-sky-900">Adenine, guanine, cytosine, thymine, or uracil.</p>
          </div>
          <div className="bg-cyan-50 p-5 rounded-xl border border-cyan-200">
            <h4 className="font-bold text-cyan-900 mb-2">Sugar</h4>
            <p className="text-sm text-cyan-900">Ribose in RNA and 2-deoxyribose in DNA.</p>
          </div>
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-200">
            <h4 className="font-bold text-violet-900 mb-2">Phosphate</h4>
            <p className="text-sm text-violet-900">When phosphate is added to a nucleoside, it becomes a nucleotide.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Biomolecule Summary</h3>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Group</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Building Unit</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Larger Molecule</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Main Role</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-300 p-3">Proteins</td><td className="border border-slate-300 p-3">Amino acids</td><td className="border border-slate-300 p-3">Polypeptides</td><td className="border border-slate-300 p-3">Structure, enzymes, transport</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3">Carbohydrates</td><td className="border border-slate-300 p-3">Monosaccharides</td><td className="border border-slate-300 p-3">Polysaccharides</td><td className="border border-slate-300 p-3">Energy and structure</td></tr>
              <tr><td className="border border-slate-300 p-3">Lipids</td><td className="border border-slate-300 p-3">Fatty acids + glycerol</td><td className="border border-slate-300 p-3">Triglycerides</td><td className="border border-slate-300 p-3">Energy storage and membranes</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3">Nucleic acids</td><td className="border border-slate-300 p-3">Nucleotides</td><td className="border border-slate-300 p-3">DNA and RNA</td><td className="border border-slate-300 p-3">Hereditary information</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Real-World Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Lego Bricks</h4>
            <p className="text-sm text-slate-700">Amino acids and monosaccharides are like small bricks. When joined in different ways, they form large structures with special functions.</p>
          </div>
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">Computer Code</h4>
            <p className="text-sm text-blue-900">Nucleotide sequences work like biological code. Their order stores hereditary instructions.</p>
          </div>
          <div className="bg-lime-50 p-5 rounded-xl border border-lime-200">
            <h4 className="font-bold text-lime-900 mb-2">Energy Storehouse</h4>
            <p className="text-sm text-lime-900">Starch stores energy in plants, like a battery stores power for later use.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. What to Explore in the Simulation</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Use <strong>Amino Acid Mode</strong> and switch the R group to identify glycine, alanine, and serine.</li>
            <li>Move the <strong>pH slider</strong> and observe how NH2 and COOH change charge to form a zwitterion.</li>
            <li>Switch to <strong>Lipid Mode</strong> and attach fatty acids to glycerol.</li>
            <li>Watch water molecules appear as ester bonds form during triglyceride assembly.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'enzymes') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Enzymes: Nature of Enzyme Action and Factors Affecting Activity</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Enzymes are biological catalysts. They make reactions faster without being consumed in the reaction.
        </p>

        <div className="bg-violet-50 p-5 rounded-xl border border-violet-200 my-6">
          <h4 className="font-bold text-violet-900 mb-2">NCERT Reference</h4>
          <p className="text-sm text-violet-900">
            Class 11 Biology, Unit 3: Cell: Structure and Functions, Chapter 9: Biomolecules. Relevant sections: 9.8, 9.8.2, 9.8.3, and 9.8.4.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Active Site and ES Complex</h3>
        <p>
          Most enzymes are proteins with a specific three-dimensional shape. A small crevice or pocket in this shape is called the <strong>active site</strong>. The molecule on which an enzyme acts is called the <strong>substrate</strong>.
        </p>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <p className="text-sm text-indigo-900">
            When the substrate enters the active site, a temporary <strong>enzyme-substrate complex</strong> or <strong>ES complex</strong> forms. This is the first major step in enzyme action.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Catalytic Cycle</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">1. Binding</h4>
            <p className="text-sm text-sky-900">The substrate diffuses toward the enzyme and binds to the active site.</p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">2. Induced Fit</h4>
            <p className="text-sm text-emerald-900">The enzyme slightly changes shape and holds the substrate more tightly.</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">3. Catalysis</h4>
            <p className="text-sm text-amber-900">The active site helps break or form bonds, converting substrate into product.</p>
          </div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">4. Release</h4>
            <p className="text-sm text-rose-900">Products leave the active site. The enzyme is free to catalyse another reaction.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Activation Energy</h3>
        <p>
          Every reaction must pass through a high-energy <strong>transition state</strong>. The energy required to reach this state is called <strong>activation energy</strong>. Enzymes lower this energy barrier, so the reaction happens much faster.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Substrate Concentration, Vmax and Km</h3>
        <p>
          At low substrate concentration, increasing substrate increases reaction velocity because more ES complexes form. But after a point, all active sites become occupied. The reaction reaches a maximum velocity called <strong>Vmax</strong>.
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Term</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-300 p-3 font-bold">Vmax</td><td className="border border-slate-300 p-3">Maximum velocity when all enzyme active sites are saturated.</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3 font-bold">Km</td><td className="border border-slate-300 p-3">Substrate concentration at which velocity is half of Vmax.</td></tr>
              <tr><td className="border border-slate-300 p-3 font-bold">Saturation</td><td className="border border-slate-300 p-3">Condition where adding more substrate does not significantly increase rate.</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Lock and Key</h4>
            <p className="text-sm text-slate-700">Only the correctly shaped substrate fits into the active site, just as only the right key opens a lock.</p>
          </div>
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">Assembly Line</h4>
            <p className="text-sm text-blue-900">An enzyme is like a factory worker. When all workers are busy, adding more raw material does not increase production. This is Vmax.</p>
          </div>
          <div className="bg-red-50 p-5 rounded-xl border border-red-200">
            <h4 className="font-bold text-red-900 mb-2">Competitive Inhibitor</h4>
            <p className="text-sm text-red-900">Some drugs imitate substrate shape and block bacterial enzyme active sites, slowing bacterial growth.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Use low substrate concentration and observe the reaction velocity increasing sharply.</li>
            <li>Increase substrate concentration until the velocity graph flattens into a Vmax plateau.</li>
            <li>Turn on slow motion to see the enzyme clamp around the substrate during induced fit.</li>
            <li>Click <strong>Add Enzyme</strong> and observe the Vmax line move higher.</li>
            <li>Trigger the inhibitor and observe how fake substrates reduce the reaction rate.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'cell-cycle-regulation') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Cell Cycle and Cell Division: Regulation and Phases</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The cell cycle is a coordinated sequence of events in which a cell grows, duplicates its DNA, and divides. Its control ensures that daughter cells receive correct genetic material.
        </p>

        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 my-6">
          <h4 className="font-bold text-indigo-900 mb-2">NCERT Reference</h4>
          <p className="text-sm text-indigo-900">
            Class 11 Biology, Unit 3: Cell: Structure and Functions, Chapter 10: Cell Cycle and Cell Division. Relevant sections: 10.1, 10.1.1, and 10.3.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Coordination and Control</h3>
        <p>
          NCERT describes cell-cycle events as being under <strong>genetic control</strong>. This means the cell does not divide casually. It checks whether growth, DNA duplication, and preparation are complete before moving forward.
        </p>
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 my-6">
          <p className="text-sm text-slate-700">
            If control fails, chromosomes may be incorrectly distributed, causing genomic instability in daughter cells.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Phases of Cell Cycle</h3>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Phase</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Main Event</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Key Logic</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-300 p-3 font-bold">G1</td><td className="border border-slate-300 p-3">Cell grows and remains metabolically active.</td><td className="border border-slate-300 p-3">Decision: divide or enter G0.</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3 font-bold">S</td><td className="border border-slate-300 p-3">DNA replication occurs.</td><td className="border border-slate-300 p-3">DNA content doubles from 2C to 4C; chromosome number remains 2n.</td></tr>
              <tr><td className="border border-slate-300 p-3 font-bold">G2</td><td className="border border-slate-300 p-3">Cell grows and prepares proteins for mitosis.</td><td className="border border-slate-300 p-3">Genome integrity must be checked before M phase.</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3 font-bold">M</td><td className="border border-slate-300 p-3">Mitosis and cytokinesis occur.</td><td className="border border-slate-300 p-3">Genetic material is distributed to daughter cells.</td></tr>
              <tr><td className="border border-slate-300 p-3 font-bold">G0</td><td className="border border-slate-300 p-3">Quiescent stage.</td><td className="border border-slate-300 p-3">Cell remains metabolically active but does not proliferate.</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Important Control Points</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">G1 Decision</h4>
            <p className="text-sm text-emerald-900">A cell checks whether division is needed and whether metabolic conditions are suitable. If not, it can enter G0.</p>
          </div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">S Phase Accuracy</h4>
            <p className="text-sm text-sky-900">DNA content doubles, but chromosome number remains the same because each chromosome now has sister chromatids.</p>
          </div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">G2 Genome Check</h4>
            <p className="text-sm text-rose-900">The cell should not enter M phase if DNA replication errors or breaks remain unrepaired.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Nucleo-Cytoplasmic Ratio</h3>
        <p>
          As a cell grows, the ratio between nucleus and cytoplasm becomes disturbed. Mitosis helps restore this <strong>nucleo-cytoplasmic ratio</strong> by forming daughter cells.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Board Exam Entry</h4>
            <p className="text-sm text-amber-900">Before entering the exam hall, hall ticket, stationery, and seat number are checked. Similarly, the cell checks requirements before entering S and M phases.</p>
          </div>
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">Assembly Line Sensor</h4>
            <p className="text-sm text-blue-900">A factory line stops when a part is damaged. A cell also delays division if DNA is damaged.</p>
          </div>
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-200">
            <h4 className="font-bold text-violet-900 mb-2">Software Update</h4>
            <p className="text-sm text-violet-900">A computer checks battery and system requirements before updating. A cell checks growth, DNA status, and division signals before moving ahead.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Start in <strong>G1</strong> and watch the nucleo-cytoplasmic ratio increase with growth.</li>
            <li>Turn off environment request and pull Proceed to see the cell enter <strong>G0</strong>.</li>
            <li>Turn on environment request and raise nutrients to pass the <strong>G1/S gate</strong>.</li>
            <li>Observe DNA content changing from <strong>2C to 4C</strong> in S phase while chromosome number stays <strong>2n</strong>.</li>
            <li>Repair DNA in G2 before entering M phase and completing division.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'mitosis-vs-meiosis-stages') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Mitosis vs Meiosis Stages</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Cell division forms daughter cells from a parent cell. The important question is whether the chromosome number stays the same, as in mitosis, or becomes half, as in meiosis I.
        </p>

        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 my-6">
          <h4 className="font-bold text-indigo-900 mb-2">NCERT Reference</h4>
          <p className="text-sm text-indigo-900">
            Class 11 Biology, Unit 3: Cell: Structure and Functions, Chapter 10: Cell Cycle and Cell Division. Relevant sections: 10.2 M Phase, 10.2.1 to 10.2.4 Mitosis Stages, 10.4 Meiosis, and 10.4.1 to 10.4.2 Meiosis I and II.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Equational and Reductional Division</h3>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">Mitosis: Equational Division</h4>
            <p className="text-sm text-emerald-900">The chromosome number remains the same. A diploid parent cell forms diploid daughter cells: <strong>2n to 2n</strong>.</p>
          </div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">Meiosis I: Reductional Division</h4>
            <p className="text-sm text-sky-900">Homologous chromosomes separate and chromosome number becomes half: <strong>2n to n</strong>.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Stage-by-Stage Comparison</h3>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Stage</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Mitosis</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Meiosis I</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-3 font-bold">Prophase</td>
                <td className="border border-slate-300 p-3">Chromosomes condense. Each chromosome has two sister chromatids joined at the centromere. Nuclear envelope and nucleolus disappear.</td>
                <td className="border border-slate-300 p-3">Homologous chromosomes pair by synapsis. Crossing over can exchange segments between non-sister chromatids.</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-3 font-bold">Metaphase</td>
                <td className="border border-slate-300 p-3">Chromosomes align singly at the metaphase plate.</td>
                <td className="border border-slate-300 p-3">Bivalents, or paired homologous chromosomes, align at the equatorial plate.</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3 font-bold">Anaphase</td>
                <td className="border border-slate-300 p-3">Centromeres split and sister chromatids move to opposite poles.</td>
                <td className="border border-slate-300 p-3">Homologous chromosomes separate, but sister chromatids remain joined at their centromeres.</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-3 font-bold">Telophase</td>
                <td className="border border-slate-300 p-3">Two identical daughter cells form after cytokinesis.</td>
                <td className="border border-slate-300 p-3">Two haploid cells form after meiosis I, each still containing duplicated chromosomes.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. DNA Content and Chromosome Number</h3>
        <p>
          In G1, DNA content is <strong>2C</strong>. After S phase, DNA content becomes <strong>4C</strong>. In mitosis, chromosome number remains <strong>2n</strong>. In meiosis, chromosome number becomes <strong>n</strong> after meiosis I.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real-World Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Photocopy Machine</h4>
            <p className="text-sm text-amber-900">Mitosis is like making an exact photocopy. The daughter cells receive the same chromosome set as the parent cell.</p>
          </div>
          <div className="bg-green-50 p-5 rounded-xl border border-green-200">
            <h4 className="font-bold text-green-900 mb-2">Indian Mango Tree</h4>
            <p className="text-sm text-green-900">A mango tree uses mitosis to grow new leaves, but meiosis to produce haploid pollen and ovules for seeds.</p>
          </div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">Wound Healing</h4>
            <p className="text-sm text-rose-900">When skin is scraped, mitosis replaces lost cells and helps close the wound.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. What to Explore in the Simulation</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Select <strong>Mitosis</strong> and move to metaphase. Notice the single-file chromosome alignment.</li>
            <li>Move to anaphase and use the <strong>Scissors</strong> tool. Centromeres split and chromatids separate.</li>
            <li>Select <strong>Meiosis I</strong> and go to prophase. Turn on crossing over to see recombination.</li>
            <li>Move to metaphase I. Notice paired bivalents at the equator.</li>
            <li>Move to anaphase I. The X-shaped chromosomes stay intact, but homologous pairs separate.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'photosynthesis-light-reaction') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Photosynthesis in Higher Plants: Light Reaction</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The light reaction is the photochemical phase of photosynthesis. It converts light energy into chemical energy in the form of <strong>ATP</strong> and <strong>NADPH</strong>, and releases oxygen from water.
        </p>

        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">NCERT Reference</h4>
          <p className="text-sm text-emerald-900">
            Class 11 Biology, Unit 4: Plant Physiology, Chapter 11: Photosynthesis in Higher Plants. Relevant sections: 11.5 What is Light Reaction?, 11.6 The Electron Transport, 11.6.1 Splitting of Water, 11.6.2 Cyclic and Non-cyclic Photophosphorylation, and 11.6.3 Chemiosmotic Hypothesis.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. What Happens in the Light Reaction?</h3>
        <p>
          Light reaction occurs on the <strong>thylakoid membrane</strong> of chloroplasts. Pigments absorb light, electrons move through carriers, water is split, oxygen is released, and a proton gradient is formed across the membrane.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-xl text-brand-primary text-center">{'2H2O -> 4H+ + O2 + 4e-'}</p>
          <p className="text-sm text-slate-600 mt-2 text-center">This water-splitting step supplies electrons to PS II and releases oxygen.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. PS II and PS I</h3>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Photosystem</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Reaction Centre</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Main Role</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-3 font-bold">PS II</td>
                <td className="border border-slate-300 p-3">P680</td>
                <td className="border border-slate-300 p-3">Absorbs light near 680 nm, starts electron flow, and replaces electrons by splitting water.</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-3 font-bold">PS I</td>
                <td className="border border-slate-300 p-3">P700</td>
                <td className="border border-slate-300 p-3">Absorbs light near 700 nm and helps reduce NADP+ to NADPH.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Electron Transport and Photophosphorylation</h3>
        <p>
          In <strong>non-cyclic photophosphorylation</strong>, electrons move from PS II to PS I and finally to NADP+. This produces <strong>ATP, NADPH, and oxygen</strong>. The path is often shown as a <strong>Z-scheme</strong> because of the rise and fall of electron energy.
        </p>
        <p>
          In <strong>cyclic photophosphorylation</strong>, only PS I is used. Electrons return to the transport chain instead of reducing NADP+. This mainly produces <strong>ATP only</strong>.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Chemiosmotic Hypothesis</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">1. Proton Build-up</h4>
            <p className="text-sm text-amber-900">Water splitting and electron transport increase H+ concentration inside the thylakoid lumen. This makes the lumen more acidic than the stroma.</p>
          </div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">2. ATP Synthase</h4>
            <p className="text-sm text-sky-900">ATP synthase has a membrane channel called CF0 and a head called CF1 facing the stroma.</p>
          </div>
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-200">
            <h4 className="font-bold text-violet-900 mb-2">3. ATP Formation</h4>
            <p className="text-sm text-violet-900">When H+ flows from the lumen to the stroma through CF0, CF1 changes shape and forms ATP from ADP and inorganic phosphate.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Simple Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">Hydroelectric Dam</h4>
            <p className="text-sm text-blue-900">The lumen is like a water reservoir. H+ ions are like stored water. ATP synthase is the turbine that uses the flow to make ATP.</p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">Solar Panel</h4>
            <p className="text-sm text-emerald-900">Light harvesting complexes work like solar panels. Many pigments collect light and pass the energy to a reaction centre.</p>
          </div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">Chemical Battery</h4>
            <p className="text-sm text-rose-900">ATP and NADPH are like charged batteries. They carry energy to the next stage of photosynthesis, where sugar is made.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Select <strong>680 nm</strong> light and press Shine Light to activate PS II, split water, and supply electrons forward.</li>
            <li>Increase light intensity to add more H+ ions into the lumen and lower the lumen pH.</li>
            <li>Switch to <strong>700 nm</strong> after PS II has supplied electrons. PS I then helps form NADPH.</li>
            <li>Keep the CF0 gate closed first. ATP does not form unless H+ can flow through ATP synthase.</li>
            <li>Open the CF0 gate and keep ADP + Pi available. H+ flows through the channel and ATP forms near CF1.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'calvin-cycle-c3-c4-pathways') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Calvin Cycle & C3-C4 Pathways</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          The Calvin cycle is the sugar-making phase of photosynthesis. It uses ATP and NADPH from the light reaction to fix carbon dioxide and form carbohydrates.
        </p>

        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">NCERT Reference</h4>
          <p className="text-sm text-emerald-900">
            Class 11 Biology, Unit 4: Plant Physiology, Chapter 11: Photosynthesis in Higher Plants. Relevant sections: 11.7 Where are the ATP and NADPH used?, 11.8 The C4 Pathway, and 11.9 Photorespiration.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Biosynthetic Phase</h3>
        <p>
          The light reaction produces <strong>ATP</strong> and <strong>NADPH</strong>. These molecules are then used in the stroma of the chloroplast to reduce carbon dioxide into sugar. This stage is often called the dark reaction, but it still depends on products made in light.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Calvin Cycle: C3 Pathway</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">1. Carboxylation</h4>
            <p className="text-sm text-sky-900">CO2 combines with RuBP, a 5-carbon acceptor. The enzyme RuBisCO catalyses this step and forms two molecules of 3-PGA.</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">2. Reduction</h4>
            <p className="text-sm text-amber-900">ATP and NADPH reduce 3-PGA into sugar-forming molecules. This is where light reaction energy is used.</p>
          </div>
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-200">
            <h4 className="font-bold text-violet-900 mb-2">3. Regeneration</h4>
            <p className="text-sm text-violet-900">RuBP is regenerated so the cycle can continue fixing more CO2.</p>
          </div>
        </div>

        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-bold text-center text-brand-primary">For one glucose molecule</p>
          <p className="text-sm text-slate-700 text-center mt-2">6 turns of the Calvin cycle use <strong>18 ATP</strong> and <strong>12 NADPH</strong>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. C4 Pathway</h3>
        <p>
          C4 plants are common in hot tropical regions. They have <strong>Kranz anatomy</strong>, where large bundle sheath cells surround vascular bundles. This arrangement helps concentrate CO2 near RuBisCO.
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Step</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Cell Type</th>
                <th className="border border-slate-300 p-3 text-left font-bold">What Happens</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-3 font-bold">Primary fixation</td>
                <td className="border border-slate-300 p-3">Mesophyll cell</td>
                <td className="border border-slate-300 p-3">PEPcase fixes CO2 with PEP to form a 4-carbon acid.</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-3 font-bold">Transport</td>
                <td className="border border-slate-300 p-3">Mesophyll to bundle sheath</td>
                <td className="border border-slate-300 p-3">The 4-carbon acid moves into bundle sheath cells.</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3 font-bold">Calvin cycle</td>
                <td className="border border-slate-300 p-3">Bundle sheath cell</td>
                <td className="border border-slate-300 p-3">CO2 is released near RuBisCO, and the Calvin cycle makes sugar.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Photorespiration</h3>
        <p>
          RuBisCO can bind both CO2 and O2. In C3 plants, high temperature and high oxygen can make RuBisCO bind O2. This causes <strong>photorespiration</strong>, where ATP is consumed, CO2 is released, and sugar is not made efficiently.
        </p>
        <p>
          C4 plants reduce photorespiration because PEPcase first captures CO2, and the bundle sheath cell keeps CO2 concentration high around RuBisCO.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Simple Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">Crowded Counter</h4>
            <p className="text-sm text-blue-900">RuBisCO is like a cashier. CO2 is a real customer, but O2 distracts the cashier. C4 plants create a protected counter where CO2 gets priority.</p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">Tropical Crops</h4>
            <p className="text-sm text-emerald-900">Maize and sorghum are C4 plants. They can keep producing well in hot Indian field conditions because photorespiration is reduced.</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Greenhouse CO2</h4>
            <p className="text-sm text-amber-900">Adding CO2 in a greenhouse helps RuBisCO choose CO2 over O2, so crop yield can improve.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Select <strong>C3 Plant</strong> at 25 C and observe steady sugar formation.</li>
            <li>Increase temperature to 40 C or 45 C. Watch photorespiration reduce sugar output in C3.</li>
            <li>Set O2 to High and notice how RuBisCO becomes more likely to waste energy in C3.</li>
            <li>Switch to <strong>C4 Plant</strong>. Observe PEPcase capture CO2 and send it to the bundle sheath cell.</li>
            <li>Compare the sugar bin and waste meter for C3 and C4 under hot conditions.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'respiration-in-plants') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Respiration in Plants</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Cellular respiration breaks down food inside the cell and traps released energy for ATP synthesis.
        </p>

        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 my-6">
          <h4 className="font-bold text-emerald-900 mb-2">NCERT Reference</h4>
          <p className="text-sm text-emerald-900">
            Class 11 Biology, Unit 4: Plant Physiology, Chapter 12: Respiration in Plants. Relevant sections: 12.2 Glycolysis, 12.3 Fermentation, 12.4 Aerobic Respiration, and 12.4.1 Tricarboxylic Acid Cycle.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Glycolysis: EMP Pathway</h3>
        <p>
          Glycolysis occurs in the <strong>cytoplasm</strong> and is present in all living organisms. One molecule of glucose is partially oxidised into two molecules of pyruvic acid.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">Glucose &rarr; 2 Pyruvate + 2 ATP + 2 NADH</p>
          <p className="text-sm text-slate-600 mt-2 text-center">Two ATP are used first, four ATP are produced later, so the net ATP gain is two.</p>
        </div>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Glucose is phosphorylated using ATP.</li>
          <li>Fructose-6-phosphate is phosphorylated again using ATP.</li>
          <li>The 6-carbon compound splits into two 3-carbon sugars.</li>
          <li>PGAL is oxidised and NAD+ becomes NADH + H+.</li>
          <li>ATP is formed by substrate-level phosphorylation.</li>
          <li>PEP finally becomes pyruvic acid, producing more ATP.</li>
        </ol>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Fermentation: Anaerobic Fate</h3>
        <p>
          When oxygen is absent, pyruvate remains in the cytoplasm. Fermentation reoxidises NADH to NAD+ so glycolysis can continue.
        </p>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Alcoholic Fermentation</h4>
            <p className="text-sm text-slate-700">In yeast, pyruvate forms ethanol and CO2. This helps idli or dosa batter rise.</p>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">Lactic Acid Fermentation</h4>
            <p className="text-sm text-slate-700">In muscle cells during hard exercise, pyruvate forms lactic acid and fatigue may occur.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Aerobic Respiration and TCA Cycle</h3>
        <p>
          When oxygen is available, pyruvate enters the mitochondrial matrix. It first forms <strong>Acetyl CoA</strong> through oxidative decarboxylation, releasing CO2 and NADH.
        </p>
        <p>
          Acetyl CoA enters the TCA cycle by combining with oxaloacetic acid. The cycle releases CO2 and loads high-energy electron carriers like NADH and FADH2.
        </p>
        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="font-mono text-lg text-brand-primary text-center">For one glucose: 6 CO2 + 10 NADH + 2 FADH2 + 4 ATP/GTP shown across the model</p>
          <p className="text-sm text-slate-600 mt-2 text-center">NCERT emphasizes that TCA extracts high-energy electrons, which later feed the ETS.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Real World Connections</h3>
        <div className="grid md:grid-cols-2 gap-4 my-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Idli and Dosa Batter</h4>
            <p className="text-sm text-slate-600">Microbes ferment sugars and release CO2, which helps the batter rise.</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Sprint Fatigue</h4>
            <p className="text-sm text-slate-600">When oxygen supply is low, muscles rely more on lactic acid fermentation.</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Distillery</h4>
            <p className="text-sm text-slate-600">Yeast converts sugars into ethanol, but high alcohol concentration becomes toxic to yeast.</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Power Turbine</h4>
            <p className="text-sm text-slate-600">The TCA cycle processes fuel and loads NADH/FADH2 for the main energy-generating ETS.</p>
          </div>
        </div>

        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl mt-8">
          <h3 className="text-lg font-bold text-white mb-2">Learning Outcome</h3>
          <p className="text-sm text-slate-300">
            Glycolysis is the universal entry pathway. Oxygen decides whether pyruvate enters low-yield fermentation or high-yield mitochondrial oxidation.
          </p>
        </div>
      </div>
    );
  }

  if (topic?.id === 'chordata') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Phylum â€“ Chordata</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Chordata is the phylum that includes fish, frogs, reptiles, birds, and mammals â€” including humans. Every chordate shares four key structural features at some point in its life. Understanding these features is the foundation of vertebrate biology.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Four Defining Features</h3>
        <p>
          All chordates possess the following four features at least during their embryonic or larval stage:
        </p>
        <div className="grid gap-4 my-6">
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">1. Notochord</h4>
            <p className="text-sm text-amber-900">
              A solid, rod-like structure made of mesodermal tissue. It runs along the length of the body and provides the first internal support system. In vertebrates, this is later replaced by a bony or cartilaginous <strong>vertebral column</strong>.
            </p>
          </div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">2. Dorsal Hollow Nerve Cord</h4>
            <p className="text-sm text-sky-900">
              A single, hollow tube running along the <strong>dorsal (back) side</strong>, just above the notochord. This is fundamentally different from non-chordates, which have a ventral, solid, double nerve cord. In vertebrates, this develops into the brain and spinal cord.
            </p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">3. Pharyngeal Gill Slits</h4>
            <p className="text-sm text-emerald-900">
              Paired openings in the throat region (pharynx). In aquatic chordates, they function for <strong>filter-feeding and gas exchange</strong>. In higher terrestrial vertebrates, they appear only in the embryo and disappear before birth.
            </p>
          </div>
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-200">
            <h4 className="font-bold text-violet-900 mb-2">4. Post-Anal Tail</h4>
            <p className="text-sm text-violet-900">
              A muscular extension of the body that extends <strong>beyond the anus</strong>. It is primarily used for locomotion and balance. In humans, it appears as the coccyx (tailbone) during embryonic development.
            </p>
          </div>
        </div>

        <div className="my-6 p-4 bg-slate-100 rounded-xl border border-slate-300">
          <p className="text-sm text-slate-700 text-center font-bold">Key Rule to Remember</p>
          <p className="text-sm text-slate-600 text-center mt-2">
            These four features need <strong>not all be present at the same time</strong>. They just need to appear at <em>some stage</em> of the life cycle.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Chordata vs Non-Chordata â€” Key Differences</h3>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Feature</th>
                <th className="border border-slate-300 p-3 text-left font-bold text-teal-700">Chordata</th>
                <th className="border border-slate-300 p-3 text-left font-bold text-slate-700">Non-Chordata</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-3">Notochord</td>
                <td className="border border-slate-300 p-3 text-teal-700">Present (at some stage)</td>
                <td className="border border-slate-300 p-3">Absent</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-3">Nerve Cord</td>
                <td className="border border-slate-300 p-3 text-teal-700">Dorsal, hollow, single</td>
                <td className="border border-slate-300 p-3">Ventral, solid, double</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3">Pharyngeal Gill Slits</td>
                <td className="border border-slate-300 p-3 text-teal-700">Present (at some stage)</td>
                <td className="border border-slate-300 p-3">Absent</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-3">Heart</td>
                <td className="border border-slate-300 p-3 text-teal-700">Ventral (if present)</td>
                <td className="border border-slate-300 p-3">Dorsal (if present)</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3">Post-Anal Tail</td>
                <td className="border border-slate-300 p-3 text-teal-700">Present (at some stage)</td>
                <td className="border border-slate-300 p-3">Absent</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Subphyla of Chordata</h3>
        <p>
          Phylum Chordata is divided into three subphyla. The first two lack a true vertebral column and are therefore called <strong>Protochordata</strong> (invertebrate chordates).
        </p>
        <div className="grid gap-4 my-6">
          <div className="bg-teal-50 p-5 rounded-xl border border-teal-200">
            <h4 className="font-bold text-teal-900 mb-2">Urochordata (Tunicata)</h4>
            <p className="text-sm text-teal-900">
              Example: <em>Herdmania</em>. Notochord is present <strong>only in the larval (tadpole) stage</strong> and disappears in the adult. The adult becomes sessile and retains only gill slits. This is called <strong>retrogressive metamorphosis</strong>.
            </p>
          </div>
          <div className="bg-cyan-50 p-5 rounded-xl border border-cyan-200">
            <h4 className="font-bold text-cyan-900 mb-2">Cephalochordata</h4>
            <p className="text-sm text-cyan-900">
              Example: <em>Amphioxus</em> (Branchiostoma). The notochord extends from head to tail and <strong>persists throughout life</strong>, making this the closest known invertebrate relative of vertebrates.
            </p>
          </div>
          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200">
            <h4 className="font-bold text-indigo-900 mb-2">Vertebrata</h4>
            <p className="text-sm text-indigo-900">
              The notochord is <strong>replaced by a vertebral column</strong> made of cartilage or bone in the adult. This subphylum includes all the familiar animals â€” fish, frogs, snakes, birds, and mammals.
            </p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Vertebrata â€” Classes and Heart Chambers</h3>
        <p>
          Vertebrates are classified into seven classes. One of the most important evolutionary trends within vertebrates is the increasing complexity of the heart:
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-3 text-left font-bold">Class</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Examples</th>
                <th className="border border-slate-300 p-3 text-center font-bold">Heart</th>
                <th className="border border-slate-300 p-3 text-left font-bold">Habitat</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-slate-300 p-3 font-bold text-slate-700">Cyclostomata</td><td className="border border-slate-300 p-3"><em>Petromyzon</em> (Lamprey)</td><td className="border border-slate-300 p-3 text-center">2-chambered</td><td className="border border-slate-300 p-3">Aquatic, parasitic</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3 font-bold text-sky-700">Chondrichthyes</td><td className="border border-slate-300 p-3"><em>Scoliodon</em> (Shark)</td><td className="border border-slate-300 p-3 text-center">2-chambered</td><td className="border border-slate-300 p-3">Marine</td></tr>
              <tr><td className="border border-slate-300 p-3 font-bold text-blue-700">Osteichthyes</td><td className="border border-slate-300 p-3"><em>Labeo</em> (Rohu)</td><td className="border border-slate-300 p-3 text-center">2-chambered</td><td className="border border-slate-300 p-3">Fresh/saltwater</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3 font-bold text-emerald-700">Amphibia</td><td className="border border-slate-300 p-3"><em>Rana</em> (Frog)</td><td className="border border-slate-300 p-3 text-center">3-chambered</td><td className="border border-slate-300 p-3">Aquatic + Terrestrial</td></tr>
              <tr><td className="border border-slate-300 p-3 font-bold text-orange-700">Reptilia</td><td className="border border-slate-300 p-3"><em>Calotes</em> (Garden lizard)</td><td className="border border-slate-300 p-3 text-center">3-chambered*</td><td className="border border-slate-300 p-3">Mainly terrestrial</td></tr>
              <tr className="bg-slate-50"><td className="border border-slate-300 p-3 font-bold text-amber-700">Aves</td><td className="border border-slate-300 p-3"><em>Columba</em> (Pigeon)</td><td className="border border-slate-300 p-3 text-center">4-chambered</td><td className="border border-slate-300 p-3">Aerial + Terrestrial</td></tr>
              <tr><td className="border border-slate-300 p-3 font-bold text-rose-700">Mammalia</td><td className="border border-slate-300 p-3"><em>Homo sapiens</em></td><td className="border border-slate-300 p-3 text-center">4-chambered</td><td className="border border-slate-300 p-3">All habitats</td></tr>
            </tbody>
          </table>
          <p className="text-xs text-slate-500 mt-2">* Crocodiles are exceptional among reptiles â€” they have a 4-chambered heart.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Analogies</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Notochord â€” Temporary Scaffolding</h4>
            <p className="text-sm text-amber-900">
              Think of a building under construction. The bamboo scaffolding (notochord) provides support while the permanent structure is built. Once the RCC pillars and beams (vertebral column) are ready, the scaffolding is removed. In vertebrates, the notochord serves as a developmental scaffold before being replaced.
            </p>
          </div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">Nerve Cord â€” Fibre-Optic Cable</h4>
            <p className="text-sm text-sky-900">
              The dorsal hollow nerve cord is like the main fibre-optic cable of a city, running through a protected underground duct. The hollow inside carries the signals; the surrounding vertebrae (in vertebrates) act as the protective conduit.
            </p>
          </div>
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">Pharyngeal Gill Slits â€” Tea Strainer</h4>
            <p className="text-sm text-emerald-900">
              In aquatic chordates, gill slits work like the mesh of a chai strainer. Water (the tea) passes through while food particles are trapped and absorbed.
            </p>
          </div>
          <div className="bg-violet-50 p-5 rounded-xl border border-violet-200">
            <h4 className="font-bold text-violet-900 mb-2">Post-Anal Tail â€” The Last Coach</h4>
            <p className="text-sm text-violet-900">
              A metro train has coaches extending beyond the last set of wheels. Similarly, the post-anal tail extends beyond the digestive system's endpoint (anus), serving balance and locomotion in many animals.
            </p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Select <strong>Urochordata</strong> and toggle to "Adult" â€” observe the notochord and tail disappearing. This is retrogressive metamorphosis.</li>
            <li>Select <strong>Cephalochordata</strong> â€” notice the notochord persists in both embryo and adult.</li>
            <li>Select <strong>Vertebrata</strong> and switch to "Adult" â€” watch the yellow notochord rod break into grey vertebral segments.</li>
            <li>Use the <strong>Feature Highlighter</strong> buttons to individually glow each of the four chordate features on the diagram.</li>
            <li>Change the <strong>Heart Class</strong> selector from Pisces to Amphibia to Mammalia and observe the heart growing from 2 to 3 to 4 chambers.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'anatomy-flowering-plants') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Anatomy of Flowering Plants</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Plant anatomy explains how cells are organised into tissues and how those tissues work together to build a stem, root, or leaf. In dicot stems, anatomy also explains how the plant becomes thicker through secondary growth.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. From Meristematic to Permanent Tissue</h3>
        <p>
          Meristematic tissues contain cells that actively divide. When these cells stop dividing and become specialised, they form <strong>permanent tissues</strong>. This process is called <strong>differentiation</strong>.
        </p>
        <div className="bg-violet-50 p-6 rounded-xl border border-violet-200 my-6">
          <p className="text-sm text-violet-900">
            A meristematic cell is small, thin-walled, and actively dividing. A permanent cell may become thick-walled, elongated, and specialised for support, storage, or transport.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Three Tissue Systems</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 mb-2">Epidermal Tissue System</h4>
            <p className="text-sm text-emerald-900">The outer protective covering of the plant body. It includes epidermal cells, stomata, and hairs or trichomes. A cuticle is usually present to reduce water loss.</p>
          </div>
          <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 mb-2">Ground Tissue System</h4>
            <p className="text-sm text-amber-900">This forms the bulk of the plant and includes parenchyma, collenchyma, and sclerenchyma. In leaves, this tissue is called mesophyll.</p>
          </div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 mb-2">Vascular Tissue System</h4>
            <p className="text-sm text-sky-900">This system includes xylem and phloem. In dicot stems, the presence of cambium makes the vascular bundles open and capable of secondary growth.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Secondary Growth</h3>
        <p>
          Secondary growth increases the <strong>girth</strong> of the plant body. It is common in dicotyledons and gymnosperms.
        </p>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <h4 className="font-bold text-blue-900 mb-2">Role of Vascular Cambium</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>The vascular cambium is a lateral meristem present between xylem and phloem.</li>
            <li>It cuts off new cells towards the inside to form <strong>secondary xylem</strong>.</li>
            <li>It cuts off new cells towards the outside to form <strong>secondary phloem</strong>.</li>
            <li>Secondary xylem is produced in much greater amount and gradually forms wood.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Everyday Understanding</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">Building Thickness</h4>
            <p className="text-sm text-slate-700">Making a pillar taller is like primary growth, but adding material around the sides to make it thicker is like secondary growth.</p>
          </div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200">
            <h4 className="font-bold text-rose-900 mb-2">Timber and Wood</h4>
            <p className="text-sm text-rose-900">The wood used in furniture is mainly the secondary xylem produced by vascular cambium over years.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Identify epidermal, ground, and vascular tissue systems in a young stem.</li>
            <li>Move the age slider to see the stem become thicker with secondary growth.</li>
            <li>Increase cambium activity and compare secondary xylem and secondary phloem production.</li>
            <li>Use the differentiation strip to understand how meristematic cells become permanent tissues.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'dimensional-analysis') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Dimensional Analysis and Consistency</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Every physical quantity can be expressed in terms of the base quantities — mass <strong>[M]</strong>, length <strong>[L]</strong> and time <strong>[T]</strong>. The <strong>dimensions</strong> of a quantity are the powers to which these base quantities are raised to represent it. Comparing dimensions lets us test whether an equation can possibly be correct.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Dimensional Formula &amp; Dimensional Equation</h3>
        <p className="text-sm">
          The <strong>dimensional formula</strong> shows how and which of the base quantities represent a physical quantity. A <strong>dimensional equation</strong> equates a quantity with its dimensional formula.
        </p>
        <div className="my-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center"><strong className="text-blue-800">[V] = [M⁰L³T⁰]</strong><br /><span className="text-sm text-slate-600">Volume</span></div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"><strong className="text-emerald-800">[F] = [M L T⁻²]</strong><br /><span className="text-sm text-slate-600">Force</span></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Dimensional Formula Key (NCERT)</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100">
              <tr><th className="p-2 text-left">Quantity</th><th className="p-2 text-left">Dimensional formula</th></tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100"><td className="p-2">Length / distance</td><td className="p-2 font-mono">[M⁰ L¹ T⁰]</td></tr>
              <tr className="border-t border-slate-100"><td className="p-2">Mass</td><td className="p-2 font-mono">[M¹ L⁰ T⁰]</td></tr>
              <tr className="border-t border-slate-100"><td className="p-2">Time</td><td className="p-2 font-mono">[M⁰ L⁰ T¹]</td></tr>
              <tr className="border-t border-slate-100"><td className="p-2">Velocity, speed</td><td className="p-2 font-mono">[M⁰ L¹ T⁻¹]</td></tr>
              <tr className="border-t border-slate-100"><td className="p-2">Acceleration</td><td className="p-2 font-mono">[M⁰ L¹ T⁻²]</td></tr>
              <tr className="border-t border-slate-100"><td className="p-2">Force</td><td className="p-2 font-mono">[M¹ L¹ T⁻²]</td></tr>
              <tr className="border-t border-slate-100"><td className="p-2">Work, energy</td><td className="p-2 font-mono">[M¹ L² T⁻²]</td></tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. The Principle of Homogeneity</h3>
        <div className="my-5 rounded-xl border border-violet-200 bg-violet-50 p-5 text-violet-900">
          <p className="text-sm">
            Only physical quantities with the <strong>same dimensions</strong> can be added or subtracted. Therefore, in any correct physical equation, the dimensions of <strong>all terms on both sides must be identical</strong>. This is the <strong>principle of homogeneity of dimensions</strong>.
          </p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Application 1 — Checking Consistency</h3>
        <p className="text-sm">For the kinematic equation <span className="font-mono">x = x<sub>0</sub> + v<sub>0</sub>t + ½at²</span>, each term reduces to length <span className="font-mono">[L]</span>:</p>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li><span className="font-mono">[x] = [x<sub>0</sub>] = [L]</span></li>
          <li><span className="font-mono">[v<sub>0</sub>t] = [L T⁻¹][T] = [L]</span></li>
          <li><span className="font-mono">[½at²] = [L T⁻²][T²] = [L]</span></li>
        </ul>
        <p className="text-sm">All terms match, so the equation is <strong>dimensionally correct</strong>. Similarly <span className="font-mono">½mv² = mgh</span> is consistent (both sides <span className="font-mono">[M L² T⁻²]</span>, <em>Example 1.3</em>), while <span className="font-mono">K = m³v³</span> and <span className="font-mono">K = ma</span> are ruled out because their dimensions are not those of energy <span className="font-mono">[M L² T⁻²]</span> (<em>Example 1.4</em>).</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Application 2 — Deducing a Relation</h3>
        <p className="text-sm">Assume the time period of a simple pendulum depends on length <span className="font-mono">l</span>, gravity <span className="font-mono">g</span> and mass <span className="font-mono">m</span>: <span className="font-mono">T = k l<sup>x</sup> g<sup>y</sup> m<sup>z</sup></span>. Equating dimensions:</p>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center font-mono text-sm text-emerald-900">
          <p>[M⁰L⁰T¹] = [L]<sup>x</sup> [L T⁻²]<sup>y</sup> [M]<sup>z</sup></p>
          <p>x + y = 0 ; −2y = 1 ; z = 0 → x = ½, y = −½, z = 0</p>
          <p className="text-base mt-2">T = 2π √(l / g)</p>
        </div>
        <p className="text-sm">The dimensionless constant <span className="font-mono">k = 2π</span> cannot be found from dimensions — it comes from experiment or full theory.</p>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>NCERT caution — necessary, not sufficient:</strong> If an equation fails the consistency test it is proved wrong, but if it passes it is <em>not</em> proved right. Dimensional analysis cannot fix dimensionless constants (the ½, the 2π) and cannot distinguish two quantities that share the same dimensions.
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Real-World Understanding</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200"><h4 className="font-bold text-slate-900 mb-2">Daily life</h4><p className="text-sm text-slate-700">You cannot add &ldquo;3 hours + 5 kilometres&rdquo; — quantities must share dimensions to be added, exactly like terms in an equation.</p></div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200"><h4 className="font-bold text-sky-900 mb-2">Nature</h4><p className="text-sm text-sky-900">A swinging pendulum or pendulum-like motion has its period form fixed entirely by what <span className="font-mono">T</span> must equal dimensionally: <span className="font-mono">√(l/g)</span>.</p></div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200"><h4 className="font-bold text-rose-900 mb-2">Industry &amp; technology</h4><p className="text-sm text-rose-900">Engineers dimensionally sanity-check rocket, bridge and circuit equations before trusting a derivation — a dimension mismatch flags a wrong formula instantly.</p></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Load each equation and watch the balance sit level and glow emerald when consistent.</li>
            <li>Use <strong>Tamper</strong> to break a correct term and see the beam tilt to red, with the offending M, L or T exponent flagged.</li>
            <li>Pick the ruled-out formulas (<span className="font-mono">K = m³v³</span>, <span className="font-mono">K = ma</span>) to see inconsistency directly.</li>
            <li>Switch to <strong>Derive a Relation</strong> and balance the M, L, T bars to recover <span className="font-mono">T = k√(l/g)</span>.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'projectile-motion') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Projectile Motion &amp; Vector Resolution</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          A projectile is an object thrown into the air that then moves under gravity alone. Its motion looks complicated — a curving arc — but it is simply two <strong>independent</strong> straight-line motions happening at once: a steady horizontal motion and a gravity-driven vertical motion.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Resolving the Launch Velocity</h3>
        <p className="text-sm">A vector can be split into rectangular components along the x- and y-axes:</p>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center font-mono text-base text-blue-900">
          <p>A = Aₓ î + Aᵧ ĵ</p>
          <p>Aₓ = A cos θ &nbsp;·&nbsp; Aᵧ = A sin θ</p>
          <p>A = √(Aₓ² + Aᵧ²) &nbsp;·&nbsp; θ = tan⁻¹(Aᵧ / Aₓ)</p>
        </div>
        <p className="text-sm">For a projectile launched with speed <strong>v₀</strong> at angle <strong>θ₀</strong>, this gives a horizontal part <strong>v₀ₓ = v₀cosθ₀</strong> and a vertical part <strong>v₀ᵧ = v₀sinθ₀</strong>. The unit vectors î, ĵ have magnitude 1 and only point a direction.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Independence of the Two Motions</h3>
        <div className="my-5 rounded-xl border border-violet-200 bg-violet-50 p-5 text-violet-900">
          <p className="text-sm">
            After launch, the only acceleration is gravity, directed downward: <strong>aₓ = 0, aᵧ = −g</strong>. So the horizontal velocity never changes while the vertical velocity steadily decreases, stops at the top, then reverses. <strong>Galileo</strong> first stated this independence of horizontal and vertical motion.
          </p>
        </div>
        <div className="my-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"><strong className="text-emerald-800">vₓ = v₀cosθ₀</strong><br /><span className="text-sm text-slate-600">constant — uniform horizontal motion</span></div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center"><strong className="text-amber-800">vᵧ = v₀sinθ₀ − gt</strong><br /><span className="text-sm text-slate-600">changes — free-fall-like vertical motion</span></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. The Path is a Parabola</h3>
        <p className="text-sm">Combining x = (v₀cosθ₀)t and y = (v₀sinθ₀)t − ½gt² and eliminating t:</p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300 text-center">
          <p className="font-mono text-lg text-brand-primary">y = (tan θ₀)x − [ g / 2(v₀cosθ₀)² ] x²</p>
          <p className="text-sm text-slate-600 mt-1">This has the form y = ax + bx² — the equation of a parabola.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Key Results</h3>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center font-mono text-base text-emerald-900">
          <p>Time to apex: tₘ = v₀sinθ₀ / g</p>
          <p>Time of flight: T_f = 2v₀sinθ₀ / g = 2tₘ</p>
          <p>Max height: hₘ = (v₀sinθ₀)² / 2g</p>
          <p>Range: R = v₀²sin2θ₀ / g</p>
        </div>
        <p className="text-sm">At the apex the vertical velocity is zero (vᵧ = 0). The range is greatest when sin2θ₀ = 1, i.e. at <strong>θ₀ = 45°</strong>, giving R_m = v₀²/g. Because sin2θ₀ is symmetric about 45°, complementary angles such as 30° and 60° give the <strong>same range</strong> (Galileo).</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Understanding</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200"><h4 className="font-bold text-slate-900 mb-2">Daily life</h4><p className="text-sm text-slate-700">A thrown ball or a basketball shot follows a parabola; for maximum distance on level ground you launch near 45°.</p></div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200"><h4 className="font-bold text-sky-900 mb-2">Nature</h4><p className="text-sm text-sky-900">A water-fountain jet and a leaping dolphin both trace parabolic arcs for the same reason.</p></div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200"><h4 className="font-bold text-rose-900 mb-2">Technology &amp; sport</h4><p className="text-sm text-rose-900">Sports analytics, fountains and sprinkler design all use the range and maximum-height formulas.</p></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Watch the velocity vector split into its green (horizontal) and amber (vertical) components.</li>
            <li>Follow the two shadow dots — the ground dot moves at constant speed while the vertical dot slows to a stop at the apex.</li>
            <li>Sweep the launch angle and watch the range graph peak exactly at 45°.</li>
            <li>Turn on the complementary-angle ghost to see 30° and 60° land at the same range.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'static-kinetic-friction') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Static &amp; Kinetic Friction</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Friction is the force, parallel to the surfaces in contact, that opposes an applied force — or opposes relative motion once a body is already sliding. It is why a heavy box resists your push, and why it suddenly becomes easier to move once it breaks free.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Static Friction Self-Adjusts</h3>
        <p className="text-sm">
          When you push a resting body with a force <strong>F</strong> that is too small to move it, a frictional force <strong>fₛ</strong> appears that is exactly equal and opposite to <strong>F</strong>, keeping the body at rest. As you push harder, fₛ grows to match — it is <strong>self-adjusting</strong>. It opposes <em>impending motion</em> (the motion that would happen if friction were absent).
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Limiting Value</h3>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
          <p className="font-mono text-lg text-amber-900">(fₛ)ₘₐₓ = μₛN &nbsp;·&nbsp; fₛ ≤ μₛN</p>
          <p className="text-sm text-slate-600 mt-1">Static friction can only grow up to the limiting value (fₛ)ₘₐₓ = μₛN.</p>
        </div>
        <p className="text-sm">The constant <strong>μₛ</strong> is the <strong>coefficient of static friction</strong>. It depends only on the nature of the two surfaces and is independent of the area of contact.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Kinetic (Sliding) Friction</h3>
        <p className="text-sm">The instant the applied force exceeds the limiting value, the body slides and the friction <strong>drops</strong> to the kinetic value:</p>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="font-mono text-lg text-emerald-900">fₖ = μₖN &nbsp;·&nbsp; μₖ &lt; μₛ</p>
        </div>
        <p className="text-sm">Kinetic friction is also independent of contact area and nearly independent of velocity. Once moving, Newton's second law gives the acceleration <strong>a = (F − fₖ)/m</strong>; the body moves at constant velocity when <strong>F = fₖ</strong>.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Angle of Repose (Incline)</h3>
        <p className="text-sm">On a plane tilted by angle θ, resolving the weight gives mg sinθ = fₛ and mg cosθ = N. The block slips when fₛ reaches its limit, i.e. at the angle of repose:</p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300 text-center">
          <p className="font-mono text-lg text-brand-primary">tan θₘₐₓ = μₛ</p>
          <p className="text-sm text-slate-600 mt-1">This angle depends only on μₛ — it is independent of the mass of the block.</p>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>NCERT caution:</strong> The laws of friction (fₛ ≤ μₛN, fₖ = μₖN) are <em>empirical</em> relations that are only approximately true — they are not fundamental laws like gravitation. Yet they are very useful in practical calculations.
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Understanding</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200"><h4 className="font-bold text-slate-900 mb-2">Daily life</h4><p className="text-sm text-slate-700">A heavy box won't budge until you push hard enough, then suddenly slides more easily — because μₛ &gt; μₖ.</p></div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200"><h4 className="font-bold text-sky-900 mb-2">Nature</h4><p className="text-sm text-sky-900">A book on a slowly tilting plank stays put until the tilt reaches the angle of repose, then it slips.</p></div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200"><h4 className="font-bold text-rose-900 mb-2">Technology</h4><p className="text-sm text-rose-900">Anti-lock brakes and tyre grip rely on static (gripping) friction being larger than kinetic (skidding) friction.</p></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>In Flat-push mode, raise the applied force and watch the red friction arrow grow to match it while the block stays at rest.</li>
            <li>Cross the limiting value and see the friction drop to the constant kinetic plateau as the block breaks free and accelerates.</li>
            <li>Change μₛ and μₖ independently and watch the peak and plateau of the friction graph move.</li>
            <li>Switch to Incline mode and tilt until the block slips — confirm tanθₘₐₓ = μₛ and that it doesn't change with mass.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'newtons-laws-of-motion') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Newton's Laws of Motion</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Three laws answer the question: what governs the motion of bodies? Together they are the foundation of classical mechanics — connecting force, mass, momentum and acceleration.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. First Law — Inertia</h3>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm text-emerald-900">"Everybody continues to be in its state of rest or of uniform motion in a straight line, unless compelled by some external force to act otherwise." In short: <strong>if the net external force is zero, the acceleration is zero.</strong></p>
        </div>
        <p className="text-sm"><strong>Inertia</strong> is the inherent property of a body to resist changes in its state of motion. Galileo's inclined-plane observations led to this law; Aristotle's idea that a force is needed to keep a body moving is wrong — that force is only needed in practice to counter friction.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Second Law — F = ma</h3>
        <p className="text-sm">"The rate of change of momentum of a body is proportional to the applied force and takes place in the direction in which the force acts." With momentum <strong>p = mv</strong>:</p>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center font-mono text-base text-blue-900">
          <p>F = k · dp/dt &nbsp;(k = 1 in SI)&nbsp; → &nbsp;F = dp/dt = ma</p>
          <p>1 N = 1 kg·m·s⁻²</p>
        </div>
        <p className="text-sm">It is a <strong>vector</strong> law and is consistent with the first law (F = 0 ⇒ a = 0). The related quantity <strong>impulse</strong> is J = F·Δt = Δp — useful when a large force acts for a very short time.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Third Law — Action &amp; Reaction</h3>
        <div className="my-4 p-4 bg-rose-50 rounded-xl border border-rose-200">
          <p className="text-sm text-rose-900">"To every action there is always an equal and opposite reaction." The force on body A by body B is equal and opposite to the force on B by A.</p>
        </div>
        <p className="text-sm">Action and reaction are <strong>simultaneous</strong>, occur between <strong>pairs of bodies</strong>, and act on <strong>different bodies</strong> — which is why they never cancel each other.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Conservation of Momentum</h3>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300 text-center">
          <p className="font-mono text-lg text-brand-primary">total momentum of an isolated system = constant</p>
          <p className="text-sm text-slate-600 mt-1">It follows from the second and third laws; for two bodies, m₁v₁ = −m₂v₂.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Understanding</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200"><h4 className="font-bold text-slate-900 mb-2">Daily life</h4><p className="text-sm text-slate-700">A seat belt restrains you when a car suddenly stops (inertia); a loaded trolley needs more force than an empty one for the same acceleration (F = ma).</p></div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200"><h4 className="font-bold text-sky-900 mb-2">Nature</h4><p className="text-sm text-sky-900">A swimmer pushes water backward; the water pushes the swimmer forward (third law).</p></div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200"><h4 className="font-bold text-rose-900 mb-2">Technology</h4><p className="text-sm text-rose-900">A rocket expels gas backward and is thrust forward — third law plus conservation of momentum.</p></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>First-law mode: let the puck glide, then toggle friction to see what actually changes its motion.</li>
            <li>Second-law mode: raise the force (a doubles) and the mass (a halves) — watch the a-vs-F line and live a = F/m.</li>
            <li>Third-law mode: release the spring between two carts and see equal-opposite forces send the lighter cart off faster.</li>
            <li>Compare the momentum bars — they stay equal and opposite, so total momentum is conserved.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'conservation-of-momentum') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Conservation of Momentum</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When bodies interact, their individual momenta can change — but the <strong>total</strong> momentum of an isolated system never does. This single idea explains collisions, recoil and rocket propulsion.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. The Law</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-900">"The total momentum of an <strong>isolated system</strong> of interacting particles is conserved." An isolated system has no external force, so internal equal-and-opposite forces (third law) make the momentum changes cancel in pairs.</p>
        </div>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300 text-center">
          <p className="font-mono text-lg text-brand-primary">m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂</p>
          <p className="text-sm text-slate-600 mt-1">Momentum p = mv is a vector — direction matters.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Why It Holds (2nd + 3rd Laws)</h3>
        <p className="text-sm">For two bodies in contact for a common time Δt: F₍AB₎Δt = p′₍A₎ − p₍A₎ and F₍BA₎Δt = p′₍B₎ − p₍B₎. Since F₍AB₎ = −F₍BA₎, the changes are equal and opposite:</p>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center font-mono text-base text-emerald-900">
          <p>Δp₍A₎ = −Δp₍B₎ → p′₍A₎ + p′₍B₎ = p₍A₎ + p₍B₎</p>
          <p>In general dP/dt = F₍ext₎; if F₍ext₎ = 0 then P = constant.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Recoil of a Gun</h3>
        <p className="text-sm">Before firing, the gun and bullet are at rest, so total momentum is zero. After firing, p₍bullet₎ + p₍gun₎ = 0, i.e. <strong>p₍gun₎ = −p₍bullet₎</strong> — the gun recoils backward to keep the total momentum zero.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Collisions: Elastic vs Inelastic</h3>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>Total momentum is conserved <strong>whether the collision is elastic or inelastic</strong>.</li>
          <li>In an <strong>elastic</strong> collision the total kinetic energy is <strong>also conserved</strong>.</li>
          <li>In an <strong>inelastic</strong> collision some kinetic energy is lost (to heat and sound); in a <strong>completely inelastic</strong> collision the bodies move together afterwards, with common velocity (m₁u₁ + m₂u₂)/(m₁ + m₂).</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Understanding</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200"><h4 className="font-bold text-slate-900 mb-2">Daily life</h4><p className="text-sm text-slate-700">A Newton's cradle and a carrom striker pass momentum from one body to the next.</p></div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200"><h4 className="font-bold text-sky-900 mb-2">Nature</h4><p className="text-sm text-sky-900">A skater or diver pushing off gains momentum equal and opposite to what they push away.</p></div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200"><h4 className="font-bold text-rose-900 mb-2">Technology</h4><p className="text-sm text-rose-900">Gun recoil and rocket exhaust: backward momentum balances forward momentum.</p></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Collide two pucks and watch the "total momentum before" bar always equal the "after" bar.</li>
            <li>Switch between Elastic and Inelastic — the kinetic-energy bar stays equal only for the elastic case.</li>
            <li>Change the masses and initial velocities and confirm m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂ every time.</li>
            <li>Use Recoil mode to fire the pucks apart from rest and see equal-and-opposite momenta (total stays zero).</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'work-energy-theorem') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Work-Energy Theorem</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          When forces act on a moving body, the bookkeeping is simple: the <strong>net work</strong> done on it equals the <strong>change in its kinetic energy</strong>. This one statement ties force and displacement to motion.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Work Done by a Force</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="font-mono text-lg text-blue-900">W = (F cos θ) d = F · d</p>
          <p className="text-sm text-slate-600 mt-1">Component of force along the displacement × the displacement. Unit: joule (J).</p>
        </div>
        <p className="text-sm">Work is a <strong>scalar</strong> and can be positive, negative or zero. If there is no displacement there is no work (pushing a rigid wall does zero work). A force <strong>perpendicular</strong> to the motion (θ = 90°) does no work, and <strong>friction</strong> does negative work.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Kinetic Energy</h3>
        <div className="my-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
          <p className="font-mono text-lg text-amber-900">K = ½ m v²</p>
          <p className="text-sm text-slate-600 mt-1">The energy of motion — a scalar, and always positive.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. The Theorem</h3>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="font-mono text-lg text-emerald-900">W_net = K_f − K_i = ½mv² − ½mu²</p>
          <p className="text-sm text-slate-600 mt-1">The change in kinetic energy of a particle equals the work done on it by the net force.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Derivation</h3>
        <p className="text-sm">For constant acceleration along a line, kinematics gives v² − u² = 2as. Multiplying both sides by m/2:</p>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300 text-center font-mono text-base text-brand-primary">
          <p>½mv² − ½mu² = mas = Fs &nbsp;(Newton's 2nd law)</p>
          <p>⇒ K_f − K_i = W</p>
        </div>
        <p className="text-sm">In vector form ½mv² − ½mu² = <strong>F·d</strong>; for a variable force, K_f − K_i = ∫F dx. The theorem is the integral (scalar) form of Newton's second law.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Understanding</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200"><h4 className="font-bold text-slate-900 mb-2">Daily life</h4><p className="text-sm text-slate-700">Pushing a trolley: your push does positive work and speeds it up, while friction does negative work.</p></div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200"><h4 className="font-bold text-sky-900 mb-2">Nature</h4><p className="text-sm text-sky-900">A falling raindrop: gravity does positive work, air resistance negative; the net work equals its gain in kinetic energy.</p></div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200"><h4 className="font-bold text-rose-900 mb-2">Technology</h4><p className="text-sm text-rose-900">Braking a vehicle: friction does negative work equal to the kinetic energy that must be removed to stop.</p></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Push the block and watch the net-work bar rise in lock-step with the change-in-KE bar.</li>
            <li>Tilt the force toward 90° and see the work (and speed gain) fall to zero.</li>
            <li>Increase friction to make the net work negative — the block slows down.</li>
            <li>Change the mass and confirm the same work produces a different speed gain (K = ½mv²).</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'conservation-of-angular-momentum') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Conservation of Angular Momentum</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Just as linear momentum is conserved when no external force acts, <strong>angular momentum is conserved when no external torque acts</strong>. This is why a spinning skater speeds up the instant she pulls her arms in.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Angular Momentum</h3>
        <div className="my-4 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
          <p className="font-mono text-lg text-blue-900">L = I ω</p>
          <p className="text-sm text-slate-600 mt-1">For rotation about a fixed axis: moment of inertia × angular velocity (for a symmetric body, L = L_z = Iω).</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Torque Changes Angular Momentum</h3>
        <div className="my-4 p-4 bg-slate-100 rounded-xl border border-slate-300 text-center font-mono text-base text-brand-primary">
          <p>dL/dt = τ<sub>ext</sub> &nbsp;(rotational analogue of dP/dt = F<sub>ext</sub>)</p>
          <p>If I is constant: τ = I α</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. The Conservation Law</h3>
        <div className="my-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
          <p className="font-mono text-lg text-emerald-900">τ<sub>ext,z</sub> = 0 ⇒ L<sub>z</sub> = Iω = constant ⇒ I₁ω₁ = I₂ω₂</p>
          <p className="text-sm text-slate-600 mt-1">With zero external torque, a change in moment of inertia forces an opposite change in angular speed.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. The Spinning Skater</h3>
        <p className="text-sm">With arms outstretched the skater has a large moment of inertia I₁. Pulling the arms in reduces it to I₂. Since there is no external torque (friction neglected), L = Iω stays constant, so the angular speed <strong>increases</strong>. Stretching the arms out again slows her down. Acrobats, divers and dancers all use this principle.</p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Note:</strong> angular momentum L is conserved, but rotational kinetic energy (½Iω²) is <em>not</em> — the skater's muscles do work pulling the arms in, which increases the kinetic energy.
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Understanding</h3>
        <div className="grid gap-4 my-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200"><h4 className="font-bold text-slate-900 mb-2">Daily life</h4><p className="text-sm text-slate-700">The swivel-chair experiment: spin with arms out, then fold them in to speed up.</p></div>
          <div className="bg-sky-50 p-5 rounded-xl border border-sky-200"><h4 className="font-bold text-sky-900 mb-2">Nature / sport</h4><p className="text-sm text-sky-900">A diver tucks to spin faster and opens up to slow down before entering the water.</p></div>
          <div className="bg-rose-50 p-5 rounded-xl border border-rose-200"><h4 className="font-bold text-rose-900 mb-2">Performance</h4><p className="text-sm text-rose-900">Ice-skaters and dancers performing a pirouette control their spin by drawing the arms in or out.</p></div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Slide the arms in and watch the figure visibly spin faster.</li>
            <li>See the moment-of-inertia bar fall while the angular-speed bar rises — and the L = Iω bar stay constant.</li>
            <li>Notice the rotational-KE bar changes, showing energy is not conserved here.</li>
            <li>Changing arm mass or starting spin resets the reference state at r = 2 m; then posture changes obey I₁ω₁ = I₂ω₂.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'nuclei') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Nuclei</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Nuclear physics connects a nucleus's mass defect with its stability and energy. Radioactive change is random for one nucleus but follows a precise exponential law for a large sample.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Nuclear Size and Composition</h3>
        <p>A nuclide contains Z protons and N neutrons, so its mass number is A = Z + N. Nuclear size follows R = R0 A^(1/3), showing that nuclear density is approximately constant.</p>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">R = R0 A^(1/3), &nbsp; R0 about 1.2 fm</div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Mass Defect and Binding Energy</h3>
        <p>The bound nucleus has less mass than its separated nucleons. This mass defect appears as binding energy. Greater binding energy per nucleon generally means greater stability.</p>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 my-4 text-center font-mono text-lg text-blue-900">Delta E = Delta m c^2</div>
        <p>The binding-energy-per-nucleon curve peaks near iron. Light nuclei can release energy by fusion, while very heavy nuclei can release energy by fission because both products move toward higher binding energy per nucleon.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Radioactive Decay</h3>
        <p>Radioactive decay is spontaneous and is unaffected by ordinary temperature, pressure, or chemical state. The decay constant lambda is the probability of decay per unit time.</p>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">N = N0 e^(-lambda t), &nbsp; T1/2 = ln(2)/lambda, &nbsp; activity = lambda N</div>
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800">
            <li>Alpha decay lowers A by 4 and Z by 2.</li>
            <li>Beta-minus decay leaves A unchanged and raises Z by 1.</li>
            <li>Gamma emission changes neither A nor Z.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Fission and Fusion</h3>
        <p>In fission, a heavy nucleus such as U-235 splits into medium-mass fragments and neutrons, permitting a chain reaction. Fusion combines light nuclei and powers stars, but requires extremely high temperature to overcome electrostatic repulsion.</p>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Move along the binding-energy curve and locate the most stable region.</li>
            <li>Advance time by one half-life and verify that N becomes N0/2.</li>
            <li>Compare fission and fusion through their movement toward larger binding energy per nucleon.</li>
          </ul>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'moving-charges-magnetism') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Moving Charges and Magnetism</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          A magnetic field acts on moving charge. Its force is perpendicular to both the velocity and the field, so it bends a trajectory without changing the particle's speed or kinetic energy.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Magnetic Force on a Charge</h3>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          F = q(v x B) &nbsp;&nbsp; |F| = |q|vB sin(theta)
        </div>
        <p>
          The right-hand rule gives the force direction for a positive charge; reverse it for a negative charge. The force vanishes when velocity is parallel to the field and is maximum when they are perpendicular.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Circular and Helical Motion</h3>
        <p>
          For velocity perpendicular to a uniform field, magnetic force supplies the centripetal force. A velocity component parallel to the field remains unchanged and turns the circular path into a helix.
        </p>
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 my-4 text-center font-mono text-lg text-blue-900">
          r = mv_perpendicular / (|q|B) &nbsp;&nbsp; T = 2 pi m / (|q|B)
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Current-Carrying Conductor</h3>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          F = I(L x B) &nbsp;&nbsp; |F| = ILB sin(theta)
        </div>
        <p>
          This macroscopic force is the sum of magnetic forces on the moving charge carriers. Its direction follows the same cross-product rule using conventional current.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Velocity Selector</h3>
        <p>
          In crossed electric and magnetic fields, a charged particle passes undeflected when the opposing forces balance: qE = qvB, so the selected speed is v = E/B.
        </p>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li>Reverse the charge to see the magnetic-force direction reverse.</li>
            <li>Set theta to zero and confirm that magnetic force vanishes.</li>
            <li>Increase mass or speed and watch the circular-orbit radius grow.</li>
            <li>Balance crossed fields and identify the one speed that travels straight.</li>
          </ul>
        </div>
        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'current-electricity') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Current Electricity</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          NCERT Chapter 3 builds the working toolkit for circuits: how a real cell drives current, where Ohm's law applies and where it doesn't, how to combine cells, and how Kirchhoff's two simple rules and the Wheatstone bridge let you analyse — and measure — any resistor network.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Current, Ohm's Law &amp; Resistance</h3>
        <p>
          Electric current I is the rate of flow of charge. The SI unit is the ampere (A), and current is a scalar (it does <em>not</em> obey vector addition).
        </p>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          R = V / I &nbsp;&nbsp;·&nbsp;&nbsp; R = ρ · ℓ / A &nbsp;&nbsp;·&nbsp;&nbsp; σ = 1 / ρ
        </div>
        <p>
          Ohm's law (V ∝ I) is obeyed by many substances but is <strong>not a fundamental law of nature</strong>. NCERT lists three ways it fails:
        </p>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>V depends on I <strong>non-linearly</strong> (e.g. a filament bulb whose ρ rises with current).</li>
            <li>The V–I relation depends on the <strong>sign of V</strong> for the same |V| (e.g. a diode).</li>
            <li>The V–I relation is <strong>non-unique</strong> (e.g. GaAs).</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Drift Velocity</h3>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          v_d = e E τ / m
        </div>
        <p>
          Conduction electrons drift slowly along the field at v_d, where e is the electronic charge, E is the field in the conductor, τ is the relaxation time and m is the electron mass.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. EMF and Internal Resistance</h3>
        <p>
          A real cell has electromotive force ε and an internal resistance r. When the cell drives an external resistance R, the terminal voltage across R is:
        </p>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          V_ext = I R = ε · R / (R + r)
        </div>
        <p>This is why a battery's terminal voltage <em>sags</em> as the load draws more current.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Cells in Series and Parallel</h3>
        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 my-4">
          <p className="text-emerald-900 font-semibold mb-2">Series (NCERT §3.11):</p>
          <p className="font-mono text-sm text-emerald-900">ε_eq = ε₁ + ε₂ + … + ε_n,&nbsp;&nbsp;&nbsp; r_eq = r₁ + r₂ + … + r_n</p>
          <p className="text-xs text-emerald-800 mt-1">If a cell is reversed, its ε enters with a minus sign: e.g. ε_eq = ε₁ − ε₂.</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 my-4">
          <p className="text-emerald-900 font-semibold mb-2">Two cells in parallel:</p>
          <p className="font-mono text-sm text-emerald-900">ε_eq = (ε₁ r₂ + ε₂ r₁) / (r₁ + r₂),&nbsp;&nbsp; r_eq = r₁ r₂ / (r₁ + r₂)</p>
          <p className="text-xs text-emerald-800 mt-1">Generalised: 1/r_eq = Σ 1/rᵢ,&nbsp; ε_eq / r_eq = Σ εᵢ / rᵢ.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Kirchhoff's Rules</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li><strong>Junction rule:</strong> at any junction, Σ I_in = Σ I_out (conservation of charge).</li>
            <li><strong>Loop rule:</strong> around any closed loop, the algebraic sum of changes in potential is zero (conservation of energy).</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Wheatstone Bridge</h3>
        <p>
          Four resistances R₁, R₂, R₃, R₄ arranged in a diamond with a battery on one diagonal and a galvanometer on the other. The galvanometer reads zero when the bridge is <em>balanced</em>:
        </p>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          R₁ / R₂ = R₃ / R₄
        </div>
        <p>At balance, an unknown resistance can be found purely from the three known resistances — independent of the EMF of the cell.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. Real-World Touchpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Daily life</div>
            <p className="text-sm text-slate-600">A torch's batteries are in series for the voltage; old cells dim because their internal r has grown.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Natural</div>
            <p className="text-sm text-slate-600">An electric eel stacks thousands of biological "cells" in series to deliver a high-voltage stun.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Technology</div>
            <p className="text-sm text-slate-600">Strain gauges and bridge circuits use the Wheatstone null method to detect tiny resistance changes.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VIII. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li><strong>Ohm scene:</strong> swap element between Resistor, Bulb and Diode — watch the V–I trace turn from a straight line into a curve and then a sharp diode kink.</li>
            <li><strong>Cells scene:</strong> series adds EMF, parallel cuts internal r. Reverse cell-2 and see ε_eq become a difference (and the current direction flip when ε₂ &gt; ε₁).</li>
            <li><strong>Wheatstone scene:</strong> nudge R₄ slowly — the galvanometer needle whips through zero at R₁/R₂ = R₃/R₄. The "balance R₄" readout tells you the target.</li>
            <li><strong>Internal resistance:</strong> raise r in the cells scene and watch V_ext sag below ε — that's why short, fat wires and fresh batteries matter.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'electrostatic-potential-capacitance') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Electrostatic Potential and Capacitance</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          NCERT Chapter 2 introduces a scalar quantity — the <strong>electrostatic potential V</strong> — that captures the work needed to move a charge through an electric field, and uses it to build the <strong>capacitor</strong>: a geometric device that stores electrical energy in the field between two conductors.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Electrostatic Potential</h3>
        <p>
          The electrostatic potential V at a point in an electric field is the work done by an external agency in bringing a unit positive test charge from infinity to that point, without acceleration. It is a scalar. The SI unit is the <strong>volt (V)</strong>. <em>Potential difference</em> between two points is the physically significant quantity.
        </p>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          V<sub>point charge</sub> = (1 / 4πε₀) · q / r
        </div>
        <p>For a system of charges, the net potential is the algebraic (scalar) sum of the individual contributions — much easier than vector-summing fields.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Potential Due to a Dipole</h3>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          V<sub>dipole</sub> = (1 / 4πε₀) · (p cos θ) / r²
        </div>
        <p>
          Here p = q·2a is the dipole moment and θ is the angle between <strong>p</strong> and the position vector. Note the <strong>1/r²</strong> fall-off — steeper than the 1/r of a point charge, but gentler than the 1/r³ of the dipole field.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Equipotential Surfaces</h3>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>An equipotential surface is a surface over which V has a constant value.</li>
            <li>For a point charge, equipotential surfaces are concentric spheres centred at the charge.</li>
            <li><strong>E</strong> at any point is <em>perpendicular</em> to the equipotential surface through that point.</li>
            <li><strong>E</strong> points in the direction of the steepest decrease of V.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Capacitors and Capacitance</h3>
        <p>
          A capacitor is a system of two conductors separated by an insulator. Its <strong>capacitance</strong> is defined as
        </p>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          C = Q / V
        </div>
        <p>where Q is the charge on either conductor and V is the potential difference between them. The SI unit is the <strong>farad (F = C·V⁻¹)</strong>. Critically, C is determined <em>purely by geometry</em> — the shapes, sizes and relative positions of the two conductors — not by what charge you put on them.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Parallel-Plate Capacitor &amp; Dielectrics</h3>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          C₀ = ε₀ · A / d &nbsp;&nbsp;·&nbsp;&nbsp; C = K · C₀ (with dielectric)
        </div>
        <p>
          When a dielectric of dielectric constant K fills the gap, the induced polarization sets up a field opposing the plate field. The net field — and hence the potential difference at fixed Q — is reduced, so the capacitance rises by the factor K (NCERT §2.13).
        </p>
        <p>
          <strong>Combinations (§2.14):</strong> series 1/C = 1/C₁ + 1/C₂ + …;&nbsp; parallel C = C₁ + C₂ + …
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Energy Stored in a Capacitor</h3>
        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 my-4">
          <p className="text-emerald-900 font-semibold mb-2">Three equivalent forms (NCERT §2.15):</p>
          <p className="font-mono text-sm text-emerald-900">U = ½ Q V = ½ C V² = ½ Q² / C</p>
          <p className="text-xs text-emerald-800 mt-2">The energy is stored in the <em>field</em> between the plates, with energy density&nbsp;<span className="font-mono">u = ½ ε₀ E²</span>.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. Real-World Touchpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Daily life</div>
            <p className="text-sm text-slate-600">Camera flash — a capacitor charges slowly from a small battery and dumps its energy in a millisecond pulse.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Natural</div>
            <p className="text-sm text-slate-600">A thundercloud and the ground act as a giant capacitor; breakdown of the air discharges it as lightning.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Technology</div>
            <p className="text-sm text-slate-600">Capacitive touchscreens detect a finger because your skin acts as a dielectric and changes the local capacitance.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VIII. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li><strong>Potential scene:</strong> drag the probe — V at its position reads out live. With two opposite charges, find the zero-potential line where the two contributions cancel.</li>
            <li><strong>Equipotentials are perpendicular to E:</strong> watch how closely-packed contours mark strong-field regions.</li>
            <li><strong>Capacitor scene:</strong> change A and d — see C ∝ A and C ∝ 1/d directly in the readout.</li>
            <li><strong>Dielectric:</strong> slide the slab in. With the battery <em>connected</em>, V is held constant and Q (= CV) grows. With the battery <em>disconnected</em>, Q is locked and V drops to Q/C.</li>
            <li><strong>Energy:</strong> notice U scales as V² at fixed C — the field region between the plates is where the energy lives, with density ½ε₀E².</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'electric-charges-fields') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Electric Charges and Fields</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          Charges exert forces on each other across empty space. NCERT Chapter 1 explains <em>how</em>: a charge fills the space around it with an <strong>electric field</strong>, and any other charge placed in that field feels a force — set by Coulomb’s inverse-square law.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Coulomb’s Law</h3>
        <p>
          The mutual electrostatic force between two point charges q₁ and q₂ separated by a distance r is proportional to the product of the charges and inversely proportional to the square of the distance:
        </p>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          F = k · q₁q₂ / r² &nbsp;&nbsp;·&nbsp;&nbsp; k = 1 / (4πε₀) ≈ 9 × 10⁹ N·m²·C⁻²
        </div>
        <p>
          where ε₀ = 8.854 × 10⁻¹² C²·N⁻¹·m⁻² is the permittivity of free space. The force on q₂ acts along the line joining the charges, repulsive for like signs and attractive for unlike signs.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. The Electric Field</h3>
        <p>
          The electric field <strong>E</strong> at a point due to a charge configuration is the force on a small positive test charge q′ placed at that point, divided by q′:
        </p>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 my-4 text-center font-mono text-lg text-amber-900">
          E = F / q′ &nbsp;&nbsp;⇒&nbsp;&nbsp; |E| = |q| / (4πε₀ r²)
        </div>
        <p>
          The field points <em>radially outward</em> from a positive charge and <em>radially inward</em> toward a negative charge. Like Coulomb’s force, electric field obeys the <strong>superposition principle</strong> — the net field at a point is the vector sum of the fields due to each individual source charge.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Electric Field Lines</h3>
        <p>An electric field line is a curve drawn so that its tangent at every point gives the direction of <strong>E</strong> at that point. The density of lines pictures the field’s strength.</p>
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900">
            <li>Field lines are continuous curves without any breaks.</li>
            <li>Two field lines can <strong>never cross</strong> each other.</li>
            <li>They <strong>start on positive charges and end on negative charges</strong>; they never form closed loops.</li>
            <li>In a region of constant field, the lines are uniformly spaced parallel straight lines.</li>
          </ul>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Electric Dipole</h3>
        <p>
          An electric dipole is a pair of equal and opposite charges +q and −q separated by a distance 2a. Its <strong>dipole moment</strong> is a vector
          <span className="font-mono"> p = q × 2a</span>, directed from −q to +q.
        </p>
        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 my-4">
          <p className="text-emerald-900 font-semibold mb-2">Field of a dipole at large distance (r ≫ a):</p>
          <p className="font-mono text-sm text-emerald-900">On the axis:&nbsp;&nbsp; E = 2p / (4πε₀ r³)</p>
          <p className="font-mono text-sm text-emerald-900">On the equatorial plane:&nbsp;&nbsp; E = −p / (4πε₀ r³)</p>
          <p className="text-xs text-emerald-800 mt-2">Note the <strong>1/r³</strong> dependence of the dipole field — sharper fall-off than the 1/r² field of a single point charge.</p>
        </div>
        <p>
          In a <em>uniform</em> external field <strong>E</strong>, a dipole experiences a torque <span className="font-mono">τ = p × E</span> but no net force — the equal and opposite forces on +q and −q cancel.
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Real-World Touchpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Daily life</div>
            <p className="text-sm text-slate-600">A plastic comb rubbed on hair picks up tiny bits of paper — frictional charging plus attraction.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Natural</div>
            <p className="text-sm text-slate-600">Charge separation in storm clouds creates fields strong enough to ionize air — a lightning bolt.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">Technology</div>
            <p className="text-sm text-slate-600">A photocopier’s charged drum uses electric fields to pull toner powder along field lines onto paper.</p>
          </div>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. What to Explore in the Simulation</h3>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 my-6">
          <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-900">
            <li><strong>Single-charge mode:</strong> raise the charge — arrows everywhere grow and redden. Move the test charge outward and watch |E| fall off as 1/r² on the side graph.</li>
            <li><strong>Pair mode:</strong> set unlike signs and switch to “Lines” — field lines run from + to −. Set like signs — lines repel and never cross. Drag a source to change separation; the field on the test charge changes sharply (inverse-square).</li>
            <li><strong>Dipole mode:</strong> see the classic dipole pattern, the p-vector pointing from −q to +q, and compare axial vs equatorial field magnitudes — both with 1/r³ tails.</li>
            <li><strong>Superposition:</strong> drag the test charge anywhere; the red force arrow is the vector sum of contributions from every source — exactly what NCERT §1.6 prescribes.</li>
          </ul>
        </div>

        <VideoSection />
      </div>
    );
  }

  if (topic?.id === 'magnetism-and-matter') {
    return (
      <div className="prose prose-slate prose-lg max-w-none font-sans" id="tour-content">
        <h1 className="font-display text-3xl font-bold text-brand-primary mb-6">Magnetism and Matter</h1>
        <p className="lead text-xl text-slate-600 mb-8">
          From the iron filings around a bar magnet to the difference between bismuth, aluminium and iron, this chapter
          treats magnetism as a subject in its own right — built entirely on the idea that the simplest magnetic element is
          a <b>dipole</b>, never a monopole. (NCERT Class 12 Physics, Chapter 5.)
        </p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">I. Bar Magnet and Field Lines</h3>
        <p>
          Iron filings sprinkled around a short bar magnet form a pattern identical to that of a current-carrying solenoid —
          the magnet behaves as a <b>magnetic dipole</b>. Freely suspended, the N pole points roughly to Earth's geographic
          north. Like poles repel, unlike poles attract. <b>Magnetic monopoles do not exist</b>: cut the magnet in two,
          you get two smaller bar magnets, each with its own N and S.
        </p>
        <p>NCERT properties of magnetic field lines (§5.2.1):</p>
        <ul>
          <li>They form <b>continuous closed loops</b> (unlike electric field lines, which begin on +q and end on −q).</li>
          <li>The tangent at any point gives the direction of <b>B</b>.</li>
          <li>The line density indicates field strength.</li>
          <li>Lines never intersect.</li>
          <li>They do <i>not</i> indicate the direction of force on a moving charge.</li>
        </ul>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 my-4">
          <p className="m-0 text-amber-900"><b>Axial field</b> (r ≫ l):&nbsp; B<sub>A</sub> = (μ₀/4π)·(2m/r³) &nbsp;(eq. 5.5)</p>
          <p className="m-0 text-amber-900"><b>Equatorial field</b> (r ≫ l):&nbsp; B<sub>E</sub> = −(μ₀/4π)·(m/r³) &nbsp;(eq. 5.4)</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">II. Dipole in a Uniform Field — Torque and Potential Energy</h3>
        <p>
          A bar magnet of dipole moment <b>m</b> placed in a uniform external field <b>B</b> feels <b>no net force</b>, but
          it does feel a torque (eq. 5.2):
        </p>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 my-4">
          <p className="m-0 text-blue-900 font-mono text-center text-lg"><b>τ = m × B</b>,&nbsp; |τ| = mB sin θ</p>
        </div>
        <p>Integrating this restoring torque gives the magnetic potential energy (eq. 5.3):</p>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 my-4">
          <p className="m-0 text-blue-900 font-mono text-center text-lg"><b>U = −m·B = −mB cos θ</b></p>
        </div>
        <ul>
          <li>U is <b>minimum (−mB)</b> at θ = 0° → <b>stable</b> equilibrium (m aligned with B).</li>
          <li>U is <b>maximum (+mB)</b> at θ = 180° → <b>unstable</b> equilibrium.</li>
          <li>Zero of U is chosen at θ = 90° (m perpendicular to B).</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">III. Gauss's Law for Magnetism</h3>
        <p>Because field lines are closed loops, every line that enters a closed surface must also leave it. The net magnetic flux through any closed surface is zero (eq. 5.6):</p>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 my-4">
          <p className="m-0 text-emerald-900 font-mono text-center text-lg"><b>Φ<sub>B</sub> = Σ B · ΔS = 0</b></p>
        </div>
        <p>This is the direct mathematical consequence of the non-existence of magnetic monopoles — there are no sources or sinks of <b>B</b>. Contrast with electrostatics, where Σ E·ΔS = q/ε₀.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">IV. Magnetisation, H, and Susceptibility</h3>
        <p>For a sample placed in an external field <b>B₀</b>:</p>
        <ul>
          <li><b>Magnetic intensity</b>:&nbsp; H = B₀/μ₀ &nbsp; (units: A m⁻¹)</li>
          <li><b>Magnetisation M</b>:&nbsp; dipole moment per unit volume.</li>
          <li>For a linear material:&nbsp; <b>M = χH</b> &nbsp;(χ = magnetic susceptibility, dimensionless).</li>
          <li>Total field inside:&nbsp; <b>B = μ₀(H + M) = μ₀(1+χ)H = μ<sub>r</sub>μ₀H = μH</b>.</li>
          <li>Relative permeability:&nbsp; <b>μ<sub>r</sub> = 1 + χ</b>;&nbsp; permeability:&nbsp; μ = μ₀μ<sub>r</sub>.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">V. Classification of Materials (Table 5.2)</h3>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm border border-slate-200">
            <thead className="bg-slate-100">
              <tr><th className="p-2 text-left">Class</th><th className="p-2 text-left">χ</th><th className="p-2 text-left">μ<sub>r</sub></th><th className="p-2 text-left">Behaviour</th></tr>
            </thead>
            <tbody>
              <tr><td className="p-2 border-t">Diamagnetic</td><td className="p-2 border-t">−1 ≤ χ &lt; 0</td><td className="p-2 border-t">0 ≤ μ<sub>r</sub> &lt; 1</td><td className="p-2 border-t">Weakly <b>repelled</b>; field lines expelled. Superconductors: χ = −1 (Meissner effect).</td></tr>
              <tr><td className="p-2 border-t">Paramagnetic</td><td className="p-2 border-t">0 &lt; χ &lt; ε</td><td className="p-2 border-t">1 &lt; μ<sub>r</sub> &lt; 1+ε</td><td className="p-2 border-t">Weakly <b>attracted</b>; dipoles align at low T / strong field.</td></tr>
              <tr><td className="p-2 border-t">Ferromagnetic</td><td className="p-2 border-t">χ ≫ 1</td><td className="p-2 border-t">μ<sub>r</sub> ≫ 1</td><td className="p-2 border-t">Strongly magnetised, domain structure; <b>retains magnetisation as a permanent magnet</b>. Above a critical temperature, becomes paramagnetic.</td></tr>
            </tbody>
          </table>
        </div>
        <p>NCERT-named ferromagnets: <b>iron, cobalt, nickel, gadolinium</b>. Soft iron loses magnetisation when the external field is removed; lodestone and steel retain it.</p>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VI. Worked Examples (from NCERT Ch 5)</h3>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 my-3">
          <p className="m-0"><b>Ex 5.1.</b> A short bar magnet placed with its axis at 30° to a uniform field of 0.25 T experiences a torque of 4.5 × 10⁻² N·m. Find its magnetic moment.</p>
          <p className="m-0 mt-2"><b>Solution.</b>&nbsp; τ = mB sin θ &nbsp;⇒&nbsp; m = τ / (B sin θ) = (4.5 × 10⁻²) / (0.25 × 0.5) = <b>0.36 J T⁻¹</b>.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 my-3">
          <p className="m-0"><b>Ex 5.5 (solenoid with iron core).</b> A solenoid with relative permeability 400, n = 1000 turns/m, carries I = 2 A. Then H = nI = 2×10³ A/m, B = μ<sub>r</sub>μ₀H = 1.0 T, and magnetisation M ≈ (μ<sub>r</sub>−1)H ≈ 8×10⁵ A/m.</p>
        </div>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VII. Real-World Touchpoints</h3>
        <ul>
          <li><b>Compass</b> — a freely suspended bar magnet aligning with Earth's field.</li>
          <li><b>Lodestone</b> — naturally magnetised mineral, the first compasses.</li>
          <li><b>Maglev trains</b> — exploit perfect diamagnetism (Meissner effect) in superconductors.</li>
        </ul>

        <h3 className="text-xl font-display font-bold text-brand-dark mt-8 mb-4">VIII. What to Explore in the Simulation</h3>
        <ul>
          <li><b>Dipole scene:</b> watch the closed-loop field lines; press <b>Cut it!</b> — each half still has both poles. No isolated North.</li>
          <li><b>Torque scene:</b> slide θ from 0° → 90° → 180°. The torque arc peaks at 90°; the U(θ) dot dips to −mB at 0° (stable) and rises to +mB at 180° (unstable). Toggle the <b>Gaussian surface</b> — count lines in vs out.</li>
          <li><b>Materials scene:</b> switch Bi → Al → Fe. Watch lines expel (dia) → mildly concentrate (para) → flood (ferro). Switch the solenoid OFF; only iron remains magnetised — that is what makes it a permanent magnet.</li>
        </ul>

        <VideoSection />
      </div>
    );
  }

  return <div>Topic Content Not Found</div>;
};

export default TextbookContent;
