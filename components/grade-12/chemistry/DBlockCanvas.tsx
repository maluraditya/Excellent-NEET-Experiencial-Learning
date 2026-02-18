import React, { useRef, useEffect, useState } from 'react';

interface DBlockCanvasProps {
  metalIon: string; // e.g. 'Ti3+', 'Mn2+', etc.
}

const IONS: Record<string, { d: number, color: string, absorbed: string, absorbedWavelength: string }> = {
  'Sc3+': { d: 0, color: '#ffffff', absorbed: 'None', absorbedWavelength: '' }, // Colorless
  'Ti3+': { d: 1, color: '#a78bfa', absorbed: '#22c55e', absorbedWavelength: '498 nm (Blue-Green)' }, // Violet (Absorbs Green)
  'V3+':  { d: 2, color: '#22c55e', absorbed: '#dc2626', absorbedWavelength: 'Why red?' }, // Green
  'Cr3+': { d: 3, color: '#a855f7', absorbed: '#eab308', absorbedWavelength: 'Yellow' }, // Violet
  'Mn3+': { d: 4, color: '#ef4444', absorbed: '#3b82f6', absorbedWavelength: 'Blue' }, // Violet/Red
  'Mn2+': { d: 5, color: '#fbcfe8', absorbed: 'None', absorbedWavelength: 'Pale Pink (Weak)' }, // Pale Pink
  'Fe2+': { d: 6, color: '#22c55e', absorbed: '#dc2626', absorbedWavelength: 'Red' }, // Green
  'Co2+': { d: 7, color: '#ec4899', absorbed: '#3b82f6', absorbedWavelength: 'Blue' }, // Pink
  'Ni2+': { d: 8, color: '#22c55e', absorbed: '#dc2626', absorbedWavelength: 'Red' }, // Green
  'Cu2+': { d: 9, color: '#3b82f6', absorbed: '#f59e0b', absorbedWavelength: 'Orange' }, // Blue
  'Zn2+': { d: 10,color: '#ffffff', absorbed: 'None', absorbedWavelength: '' }, // Colorless
};

const DBlockCanvas: React.FC<DBlockCanvasProps> = ({ metalIon }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const ionData = IONS[metalIon] || IONS['Ti3+'];

  // Animation State for Electron Jump
  const jumpProgress = useRef(0);
  const isJumping = useRef(false);

  // Trigger jump occasionally
  useEffect(() => {
    const interval = setInterval(() => {
        if (!isJumping.current && ionData.d > 0 && ionData.d < 10) {
            isJumping.current = true;
            jumpProgress.current = 0;
        }
    }, 3000);
    return () => clearInterval(interval);
  }, [ionData]);

  // Calculations
  const unpairedElectrons = () => {
     // High Spin Complex Assumption for simplicity (Weak Field Ligand H2O)
     const d = ionData.d;
     if (d <= 3) return d;
     if (d <= 5) return d;
     if (d === 6) return 4; // 2,1,1,1,1 -> Pair up 1 -> 2 paired, 4 unpaired
     if (d === 7) return 3;
     if (d === 8) return 2;
     if (d === 9) return 1;
     return 0;
  };

  const magneticMoment = () => {
    const n = unpairedElectrons();
    return Math.sqrt(n * (n + 2)).toFixed(2);
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

    // Clear
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    
    // --- 1. TITLE & INFO ---
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px Poppins';
    ctx.textAlign = 'left';
    ctx.fillText(`Crystal Field Splitting (Octahedral): [M(H₂O)₆]ⁿ⁺`, 30, 40);

    // --- 2. ENERGY DIAGRAM ---
    const startX = 100;
    const groundY = 380; // t2g level
    const excitedY = 180; // eg level
    
    // Draw Axis
    ctx.beginPath();
    ctx.moveTo(80, 420);
    ctx.lineTo(80, 100);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Arrow head
    ctx.moveTo(75, 110); ctx.lineTo(80, 100); ctx.lineTo(85, 110); ctx.stroke();
    
    ctx.save();
    ctx.translate(50, 260);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px Roboto';
    ctx.fillText("Energy", 0, 0);
    ctx.restore();

    // Draw Levels
    ctx.lineWidth = 3;
    
    // t2g (Lower, 3 orbitals)
    const orbW = 40;
    const gap = 15;
    const t2gX = 160;
    
    // Draw 3 lines for t2g
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(t2gX + i*(orbW+gap), groundY);
        ctx.lineTo(t2gX + i*(orbW+gap) + orbW, groundY);
        ctx.strokeStyle = '#3b82f6'; // Blue
        ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3b82f6';
    ctx.font = '16px sans-serif';
    ctx.fillText("t₂g", t2gX + 1.5*(orbW+gap) - gap/2, groundY + 30);

    // eg (Upper, 2 orbitals)
    const egX = 190; // Centered roughly above
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(egX + i*(orbW+gap), excitedY);
        ctx.lineTo(egX + i*(orbW+gap) + orbW, excitedY);
        ctx.strokeStyle = '#ef4444'; // Red
        ctx.stroke();
    }
    ctx.fillStyle = '#ef4444';
    ctx.fillText("e₉", egX + 1*(orbW+gap) - gap, excitedY - 15);

    // Splitting Energy Delta_o
    ctx.beginPath();
    ctx.moveTo(350, groundY);
    ctx.lineTo(350, excitedY);
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#64748b';
    ctx.fillText("Δₒ", 370, (groundY + excitedY)/2 + 5);


    // --- 3. ELECTRON POPULATION (High Spin) ---
    const electrons = ionData.d;
    
    const drawElectron = (x: number, y: number, spin: 'up'|'down', isAnimated: boolean = false) => {
        const dir = spin === 'up' ? -1 : 1;
        const offset = 20; // Center in orbital
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset, y + (25 * dir));
        ctx.moveTo(x + offset, y + (25 * dir));
        ctx.lineTo(x + offset - 5, y + (20 * dir)); // arrow head
        
        ctx.strokeStyle = isAnimated ? '#fbbf24' : '#0f172a'; // Gold if jumping
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    // Calculate positions
    const t2gPos = [0,1,2].map(i => ({x: t2gX + i*(orbW+gap), y: groundY}));
    const egPos = [0,1].map(i => ({x: egX + i*(orbW+gap), y: excitedY}));

    // Distribute Logic
    const electronPositions: {x: number, y: number, spin: 'up'|'down', id: number}[] = [];
    
    for(let i=0; i<electrons; i++) {
        if (i < 3) electronPositions.push({ ...t2gPos[i], spin: 'up', id: i }); 
        else if (i < 5) electronPositions.push({ ...egPos[i-3], spin: 'up', id: i });
        else if (i < 8) electronPositions.push({ ...t2gPos[i-5], spin: 'down', id: i });
        else electronPositions.push({ ...egPos[i-8], spin: 'down', id: i });
    }

    // Animation Logic
    let jumpingElectronIndex = -1;
    let jumpY = 0;

    if (isJumping.current) {
        if (electrons > 0) {
             jumpingElectronIndex = 0; 
             jumpProgress.current += 0.02;
             if (jumpProgress.current >= 1) {
                 if (jumpProgress.current > 1.5) { 
                     isJumping.current = false;
                     jumpProgress.current = 0;
                 }
             }
             if (jumpProgress.current <= 1) {
                jumpY = groundY + (excitedY - groundY) * Math.sin(jumpProgress.current * Math.PI / 2);
             } else {
                 jumpY = excitedY;
             }
        } else {
            isJumping.current = false;
        }
    }

    // Draw Electrons
    electronPositions.forEach((e, idx) => {
        if (idx === jumpingElectronIndex && isJumping.current) {
            drawElectron(e.x, jumpY, e.spin, true);
            // Draw Photon
            if (jumpProgress.current < 0.5) {
                ctx.beginPath();
                const waveY = (groundY + excitedY)/2;
                ctx.strokeStyle = ionData.absorbed !== 'None' ? ionData.absorbed : 'grey';
                ctx.lineWidth = 3;
                ctx.moveTo(e.x - 40, waveY);
                for(let k=0; k<20; k++) {
                   ctx.lineTo(e.x - 40 + k*3, waveY + Math.sin(k)*5);
                }
                ctx.stroke();
                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = '12px Arial';
                ctx.fillText("hv", e.x - 45, waveY - 10);
            }
        } else {
            drawElectron(e.x, e.y, e.spin);
        }
    });


    // --- 4. COLOR SWATCHES ---
    // Observed Color (Circle)
    const centerX = 600;
    const centerY = 180;
    const radius = 70;
    
    ctx.fillStyle = ionData.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(centerX - 25, centerY - 25, radius/3, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 16px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText("Observed Color", centerX, centerY + radius + 25);
    ctx.font = '14px Roboto';
    ctx.fillStyle = '#64748b';
    ctx.fillText(metalIon === 'Sc3+' || metalIon === 'Zn2+' ? "Colorless" : "Complementary", centerX, centerY + radius + 45);

    // --- 5. MAGNETISM DISPLAY ---
    const magX = 480;
    const magY = 340; // Base Y position for the box top
    const boxW = 280; 
    const boxH = 130; 

    // Draw Box Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(magX, magY, boxW, boxH);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(magX, magY, boxW, boxH);

    const n = unpairedElectrons();
    const mu = magneticMoment();
    
    // Label: Magnetic Property
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px Poppins';
    ctx.fillStyle = '#64748b'; 
    ctx.fillText("MAGNETIC PROPERTY", magX + 20, magY + 25);
    
    // Value: Paramagnetic / Diamagnetic
    if (n > 0) {
        ctx.fillStyle = '#ef4444'; // Red
        ctx.font = 'bold 18px Roboto';
        ctx.fillText("PARAMAGNETIC", magX + 20, magY + 60);
    } else {
        ctx.fillStyle = '#0f172a'; // Dark
        ctx.font = 'bold 18px Roboto';
        ctx.fillText("DIAMAGNETIC", magX + 20, magY + 60);
    }
    
    // Stats: Electrons and Moment
    ctx.font = '14px Roboto';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Unpaired e⁻ (n): ${n}`, magX + 20, magY + 90);
    ctx.fillText(`Magnetic Moment (μ): ${mu} BM`, magX + 20, magY + 110);

  };

  const animate = () => {
    draw();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  });

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded-xl bg-white shadow-inner border border-slate-200"
    />
  );
};

export default DBlockCanvas;