import React, { useRef, useEffect } from 'react';

interface ElectrochemistryCanvasProps {
  externalVoltage: number; // 0 to 2.5V
}

const ElectrochemistryCanvas: React.FC<ElectrochemistryCanvasProps> = ({ externalVoltage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const ionsRef = useRef<Array<{x: number, y: number, type: 'anion' | 'cation', offset: number}>>([]);

  const CELL_POTENTIAL = 1.10; 
  const isElectrolytic = externalVoltage > CELL_POTENTIAL;
  const isEquilibrium = Math.abs(externalVoltage - CELL_POTENTIAL) < 0.05;
  const netVoltage = externalVoltage - CELL_POTENTIAL; 
  const flowSpeed = isEquilibrium ? 0 : Math.abs(netVoltage) * 2;
  const flowDirection = isEquilibrium ? 0 : (externalVoltage < CELL_POTENTIAL ? 1 : -1);

  useEffect(() => {
    const ions = [];
    for(let i=0; i<15; i++) {
        ions.push({
            x: 0,
            y: 0,
            type: Math.random() > 0.5 ? 'anion' : 'cation' as const,
            offset: Math.random() 
        });
    }
    ionsRef.current = ions;
  }, []);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- HIGH DPI SCALING ---
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = 800; // Increased logic space
    const logicalHeight = 500;
    
    if (canvas.width !== logicalWidth * dpr || canvas.height !== logicalHeight * dpr) {
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        ctx.scale(dpr, dpr);
    }
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    
    // Use logical width/height for drawing commands
    const width = logicalWidth;
    const height = logicalHeight;
    const time = Date.now() / 1000;

    // Clear
    ctx.clearRect(0, 0, width, height);
    
    const beakerY = 180;
    const beakerW = 140;
    const beakerH = 200;
    const leftBeakerX = 200;
    const rightBeakerX = 600;
    const liquidLevel = beakerY + 40;

    // --- DRAW BEAKERS ---
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#cbd5e1'; 
    ctx.fillStyle = 'rgba(255,255,255,0.5)';

    // Left
    ctx.beginPath();
    ctx.rect(leftBeakerX - beakerW/2, beakerY, beakerW, beakerH);
    ctx.stroke();
    ctx.fillStyle = '#f1f5f9'; 
    ctx.fillRect(leftBeakerX - beakerW/2 + 2, liquidLevel, beakerW - 4, beakerH - (liquidLevel - beakerY) - 2);

    // Right
    ctx.beginPath();
    ctx.rect(rightBeakerX - beakerW/2, beakerY, beakerW, beakerH);
    ctx.stroke();
    ctx.fillStyle = '#dbeafe'; 
    ctx.fillRect(rightBeakerX - beakerW/2 + 2, liquidLevel, beakerW - 4, beakerH - (liquidLevel - beakerY) - 2);

    // --- ELECTRODES ---
    const electrodeW = 25;
    const electrodeH = 180;
    
    // Left (Zinc)
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(leftBeakerX - electrodeW/2, beakerY - 40, electrodeW, electrodeH);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 16px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText("Zn (s)", leftBeakerX, beakerY + beakerH + 25);

    // Right (Copper)
    ctx.fillStyle = '#b45309';
    ctx.fillRect(rightBeakerX - electrodeW/2, beakerY - 40, electrodeW, electrodeH);
    ctx.fillText("Cu (s)", rightBeakerX, beakerY + beakerH + 25);

    // --- SALT BRIDGE ---
    ctx.beginPath();
    ctx.lineWidth = 30; 
    ctx.strokeStyle = '#fef08a';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const bridgePath = new Path2D();
    bridgePath.moveTo(leftBeakerX + 30, liquidLevel + 60);
    bridgePath.lineTo(leftBeakerX + 60, liquidLevel + 60);
    bridgePath.lineTo(leftBeakerX + 60, beakerY + 10);
    bridgePath.lineTo(rightBeakerX - 60, beakerY + 10);
    bridgePath.lineTo(rightBeakerX - 60, liquidLevel + 60);
    bridgePath.lineTo(rightBeakerX - 30, liquidLevel + 60);
    
    ctx.stroke(bridgePath);
    ctx.lineWidth = 1; 

    // --- IONS ---
    if (!isEquilibrium) {
        const bridgeY = beakerY + 10;
        const bridgeLeftX = leftBeakerX + 60;
        const bridgeRightX = rightBeakerX - 60;
        
        ionsRef.current.forEach((ion, i) => {
            let progress = ((time * 0.2 + ion.offset) % 1);
            let x = 0;
            let y = bridgeY + (Math.sin(time * 5 + i) * 6); 

            if (ion.type === 'anion') {
                const p = (time * 0.5 + ion.offset) % 1;
                const effectiveP = flowDirection === 1 ? (1 - p) : p; 
                x = bridgeLeftX + effectiveP * (bridgeRightX - bridgeLeftX);
                
                ctx.fillStyle = '#ef4444'; 
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = 'bold 10px Arial';
                ctx.fillText("-", x, y + 3);

            } else {
                const p = (time * 0.5 + ion.offset + 0.5) % 1;
                const effectiveP = flowDirection === 1 ? p : (1 - p);
                x = bridgeLeftX + effectiveP * (bridgeRightX - bridgeLeftX);

                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = 'bold 10px Arial';
                ctx.fillText("+", x, y + 3);
            }
        });
    }

    // --- WIRING ---
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(leftBeakerX, beakerY - 40);
    ctx.lineTo(leftBeakerX, 60);
    ctx.lineTo(rightBeakerX, 60);
    ctx.lineTo(rightBeakerX, beakerY - 40);
    ctx.stroke();

    // Source/Load
    const centerX = (leftBeakerX + rightBeakerX) / 2;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(centerX - 50, 40, 100, 50);
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 50, 40, 100, 50);
    
    ctx.fillStyle = isEquilibrium ? '#64748b' : (isElectrolytic ? '#B3202F' : '#22c55e');
    ctx.font = 'bold 18px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText(isElectrolytic ? "Power" : "Load", centerX, 72);

    // --- ELECTRONS ---
    if (!isEquilibrium) {
      const eSpeed = flowSpeed * 2;
      ctx.fillStyle = '#FFC748'; 
      for(let i=0; i<8; i++) {
        let progress = (time * eSpeed + i/8) % 1;
        if (flowDirection === -1) progress = 1 - progress;
        
        const x = leftBeakerX + progress * (rightBeakerX - leftBeakerX);
        const y = 60;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.fillText("e-", x, y - 10);
        ctx.fillStyle = '#FFC748';
      }
    }

    // --- LABELS ---
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    
    // Mode
    ctx.font = 'bold 24px Poppins';
    ctx.fillStyle = '#B3202F'; 
    let modeText = "Equilibrium (No Reaction)";
    if (!isEquilibrium) {
        modeText = isElectrolytic ? "Electrolytic Cell (Consumes Energy)" : "Galvanic Cell (Produces Energy)";
    }
    ctx.fillText(modeText, centerX, 30);

    // Description
    ctx.font = 'italic 16px Roboto';
    ctx.fillStyle = '#475569'; 
    if (isElectrolytic) {
      ctx.fillText("Reduction (Cathode)", leftBeakerX, beakerY + beakerH + 50);
      ctx.fillText("Oxidation (Anode)", rightBeakerX, beakerY + beakerH + 50);
      ctx.fillStyle = '#B3202F'; 
      ctx.fillText("← e⁻ flow driven by external V", centerX, 110);
    } else if (!isEquilibrium) {
      ctx.fillText("Oxidation (Anode)", leftBeakerX, beakerY + beakerH + 50);
      ctx.fillText("Reduction (Cathode)", rightBeakerX, beakerY + beakerH + 50);
      ctx.fillStyle = '#22c55e';
      ctx.fillText("e⁻ flow spontaneous →", centerX, 110);
    }
  };

  const animate = () => {
    draw();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [externalVoltage]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded-xl bg-white shadow-inner border border-slate-200"
    />
  );
};

export default ElectrochemistryCanvas;