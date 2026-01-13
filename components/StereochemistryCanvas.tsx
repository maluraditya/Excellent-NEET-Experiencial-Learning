import React, { useRef, useEffect, useState } from 'react';

interface StereochemistryCanvasProps {
  isomerType: 'cis-trans-sq' | 'fac-mer' | 'optical';
  subType: 'A' | 'B'; 
  showMirror: boolean; 
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  color: string;
  radius: number;
  label?: string;
}

interface Bond {
  from: number; 
  to: number;
  isChelate?: boolean; 
}

const StereochemistryCanvas: React.FC<StereochemistryCanvasProps> = ({ isomerType, subType, showMirror }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const generateMolecule = (type: string, sub: string): { atoms: Point3D[], bonds: Bond[] } => {
    const atoms: Point3D[] = [];
    const bonds: Bond[] = [];
    
    atoms.push({ x: 0, y: 0, z: 0, color: '#94a3b8', radius: 30, label: 'M' }); 

    const pos = [
      { x: 120, y: 0, z: 0 },   // 1 Right
      { x: -120, y: 0, z: 0 },  // 2 Left
      { x: 0, y: 120, z: 0 },   // 3 Up
      { x: 0, y: -120, z: 0 },  // 4 Down
      { x: 0, y: 0, z: 120 },   // 5 Front
      { x: 0, y: 0, z: -120 },  // 6 Back
    ];

    if (type === 'cis-trans-sq') {
      if (sub === 'A') { 
        atoms.push({ ...pos[0], color: '#22c55e', radius: 20, label: 'Cl' });
        atoms.push({ ...pos[2], color: '#22c55e', radius: 20, label: 'Cl' });
        atoms.push({ ...pos[1], color: '#3b82f6', radius: 25, label: 'N' });
        atoms.push({ ...pos[3], color: '#3b82f6', radius: 25, label: 'N' });
      } else { 
        atoms.push({ ...pos[0], color: '#22c55e', radius: 20, label: 'Cl' });
        atoms.push({ ...pos[1], color: '#22c55e', radius: 20, label: 'Cl' });
        atoms.push({ ...pos[2], color: '#3b82f6', radius: 25, label: 'N' });
        atoms.push({ ...pos[3], color: '#3b82f6', radius: 25, label: 'N' });
      }
      for(let i=1; i<=4; i++) bonds.push({ from: 0, to: i });
    
    } else if (type === 'fac-mer') {
      const colorA = '#f59e0b'; 
      const colorB = '#6366f1'; 
      if (sub === 'A') { 
        atoms.push({ ...pos[0], color: colorA, radius: 20, label: 'a' });
        atoms.push({ ...pos[2], color: colorA, radius: 20, label: 'a' });
        atoms.push({ ...pos[4], color: colorA, radius: 20, label: 'a' });
        atoms.push({ ...pos[1], color: colorB, radius: 20, label: 'b' });
        atoms.push({ ...pos[3], color: colorB, radius: 20, label: 'b' });
        atoms.push({ ...pos[5], color: colorB, radius: 20, label: 'b' });
      } else { 
        atoms.push({ ...pos[0], color: colorA, radius: 20, label: 'a' });
        atoms.push({ ...pos[1], color: colorA, radius: 20, label: 'a' }); 
        atoms.push({ ...pos[2], color: colorA, radius: 20, label: 'a' }); 
        atoms.push({ ...pos[3], color: colorB, radius: 20, label: 'b' });
        atoms.push({ ...pos[4], color: colorB, radius: 20, label: 'b' });
        atoms.push({ ...pos[5], color: colorB, radius: 20, label: 'b' });
      }
      for(let i=1; i<=6; i++) bonds.push({ from: 0, to: i });

    } else if (type === 'optical') {
      const enColor = '#ec4899'; 
      atoms.push({ ...pos[0], color: enColor, radius: 15, label: 'N' });
      atoms.push({ ...pos[2], color: enColor, radius: 15, label: 'N' });
      atoms.push({ ...pos[1], color: enColor, radius: 15, label: 'N' });
      atoms.push({ ...pos[3], color: enColor, radius: 15, label: 'N' });
      atoms.push({ ...pos[4], color: enColor, radius: 15, label: 'N' });
      atoms.push({ ...pos[5], color: enColor, radius: 15, label: 'N' });
      for(let i=1; i<=6; i++) bonds.push({ from: 0, to: i });

      if (sub === 'A') { 
        bonds.push({ from: 1, to: 5, isChelate: true }); 
        bonds.push({ from: 2, to: 3, isChelate: true }); 
        bonds.push({ from: 4, to: 6, isChelate: true }); 
      } else { 
        bonds.push({ from: 2, to: 5, isChelate: true }); 
        bonds.push({ from: 1, to: 3, isChelate: true }); 
        bonds.push({ from: 4, to: 6, isChelate: true }); 
      }
    }
    return { atoms, bonds };
  };

  const drawMolecule = (
    ctx: CanvasRenderingContext2D, 
    offsetX: number, 
    offsetY: number, 
    atoms: Point3D[], 
    bonds: Bond[],
    currentRotation: {x: number, y: number}
  ) => {
    
    const project = (p: Point3D) => {
      let x = p.x * Math.cos(currentRotation.x) - p.z * Math.sin(currentRotation.x);
      let z = p.x * Math.sin(currentRotation.x) + p.z * Math.cos(currentRotation.x);
      let y = p.y;
      
      let y2 = y * Math.cos(currentRotation.y) - z * Math.sin(currentRotation.y);
      let z2 = y * Math.sin(currentRotation.y) + z * Math.cos(currentRotation.y);
      
      const scale = 500 / (500 - z2);
      return {
        x: x * scale + offsetX,
        y: y2 * scale + offsetY,
        r: p.radius * scale,
        z: z2, 
        color: p.color,
        label: p.label
      };
    };

    const projectedAtoms = atoms.map(project);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 5;
    bonds.forEach(b => {
      const start = projectedAtoms[b.from];
      const end = projectedAtoms[b.to];
      
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      
      if (b.isChelate) {
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        ctx.quadraticCurveTo(cx * 1.2, cy * 1.2, end.x, end.y);
        ctx.strokeStyle = '#f472b6'; 
      } else {
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = '#cbd5e1';
      }
      ctx.stroke();
    });

    projectedAtoms.sort((a, b) => a.z - b.z);

    projectedAtoms.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      
      const grad = ctx.createRadialGradient(a.x - a.r/3, a.y - a.r/3, a.r/4, a.x, a.y, a.r);
      grad.addColorStop(0, '#ffffff'); 
      grad.addColorStop(0.3, a.color);
      grad.addColorStop(1, '#000000'); 
      
      ctx.fillStyle = grad;
      ctx.fill();
      
      if (a.label) {
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.max(10, a.r)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(a.label, a.x, a.y);
      }
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- HIGH DPI SCALING ---
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = 800;
    const logicalHeight = 500;

    if (canvas.width !== logicalWidth * dpr || canvas.height !== logicalHeight * dpr) {
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      ctx.scale(dpr, dpr);
    }
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    const rx = rotation.x;
    const ry = rotation.y;

    if (showMirror && isomerType === 'optical') {
        const mol1 = generateMolecule(isomerType, 'A');
        drawMolecule(ctx, logicalWidth * 0.25, logicalHeight/2, mol1.atoms, mol1.bonds, {x: rx, y: ry});

        ctx.strokeStyle = '#94a3b8';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(logicalWidth/2, 50);
        ctx.lineTo(logicalWidth/2, logicalHeight - 50);
        ctx.stroke();
        ctx.setLineDash([]);

        const mol2 = generateMolecule(isomerType, 'B');
        drawMolecule(ctx, logicalWidth * 0.75, logicalHeight/2, mol2.atoms, mol2.bonds, {x: rx, y: -ry});

    } else {
        const mol = generateMolecule(isomerType, subType);
        drawMolecule(ctx, logicalWidth/2, logicalHeight/2, mol.atoms, mol.bonds, {x: rx, y: ry});
    }
  };

  const animate = () => {
    draw();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    setRotation(prev => ({ x: prev.x + dx * 0.01, y: prev.y + dy * 0.01 }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => { isDragging.current = false; };

  return (
    <canvas 
      ref={canvasRef} 
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-full rounded-xl bg-slate-900 cursor-move shadow-inner"
    />
  );
};

export default StereochemistryCanvas;