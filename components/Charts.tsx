import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area } from 'recharts';

interface BoltzmannProps {
  temperature: number;
  activationEnergy: number;
}

export const MaxwellBoltzmannChart: React.FC<BoltzmannProps> = ({ temperature, activationEnergy }) => {
  // Generate curve data based on Maxwell-Boltzmann distribution formula approx
  const data = [];
  const R = 8.314;
  const T = temperature; // Kelvin
  
  for (let E = 0; E <= 200; E += 5) {
    // f(E) ~ sqrt(E) * exp(-E/RT)
    // Simplified model for visualization
    const prob = 1000 * Math.sqrt(E) * Math.exp(-E * 150 / (R * T)); 
    data.push({ energy: E, probability: prob });
  }

  // Find the index where Energy > Activation Energy to shade the area
  const thresholdIndex = data.findIndex(d => d.energy >= activationEnergy);
  const shadedData = data.map(d => ({
    ...d,
    effective: d.energy >= activationEnergy ? d.probability : 0
  }));

  return (
    <div className="h-64 w-full bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-sm font-semibold text-slate-600 mb-2">Molecular Energy Distribution (Maxwell-Boltzmann)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={shadedData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="energy" 
            label={{ value: 'Kinetic Energy', position: 'insideBottomRight', offset: -5 }} 
            tick={{fontSize: 10}}
          />
          <YAxis hide />
          <Tooltip />
          <ReferenceLine x={activationEnergy} stroke="red" label={{ value: 'Ea', fill: 'red', fontSize: 12 }} strokeDasharray="3 3" />
          <Line type="monotone" dataKey="probability" stroke="#0284c7" strokeWidth={2} dot={false} />
          {/* Visualizing the fraction of effective molecules */}
          <Area type="monotone" dataKey="effective" stroke="none" fill="#ef4444" fillOpacity={0.3} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-2">
        Red Area: Fraction of molecules with Energy &gt; Ea. Increasing T shifts curve right.
      </p>
    </div>
  );
};

export const PotentialEnergyDiagram: React.FC<{ hasReactionOccurred: boolean }> = ({ hasReactionOccurred }) => {
  const data = [
    { progress: 0, energy: 20, label: "Reactants" },
    { progress: 50, energy: 80, label: "Activated Complex" },
    { progress: 100, energy: 10, label: "Products" },
  ];

  return (
    <div className="h-64 w-full bg-white p-4 rounded-lg shadow-sm">
      <h3 className="text-sm font-semibold text-slate-600 mb-2">Potential Energy vs Reaction Coordinate</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="progress" type="number" hide />
          <YAxis label={{ value: 'Potential Energy', angle: -90, position: 'insideLeft' }} hide />
          <Line type="monotone" dataKey="energy" stroke="#475569" strokeWidth={3} dot={{r: 4}} />
          
          {/* Animated dot representing reaction progress if reaction occurred */}
           {hasReactionOccurred && (
             <ReferenceLine x={100} stroke="green" strokeDasharray="3 3" label="Reaction Complete" />
           )}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs text-slate-500 px-4">
        <span>Reactants (H₂ + I₂)</span>
        <span>Activated Complex</span>
        <span>Products (2HI)</span>
      </div>
    </div>
  );
};
