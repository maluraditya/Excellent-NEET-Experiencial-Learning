import React, { useRef, useEffect } from 'react';

interface PolymerCanvasProps {
  mode: 'synthesis' | 'conductivity';
}

const PolymerCanvas: React.FC<PolymerCanvasProps> = ({ mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const startTime = useRef(Date.now());

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
    const time = (Date.now() - startTime.current) / 1000;

    if (mode === 'synthesis') {
        // ZIEGLER-NATTA CATALYSIS VISUALIZATION
        // Catalyst Site (Ti center)
        const catX = 200;
        const catY = 250;
        
        // Draw Catalyst Surface
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(100, 300);
        ctx.lineTo(300, 300);
        ctx.lineTo(250, 400);
        ctx.lineTo(150, 400);
        ctx.fill();
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 14px Arial';
        ctx.fillText("Catalyst Surface", 160, 350);

        // Active Site (Ti)
        ctx.beginPath();
        ctx.arc(catX, catY, 20, 0, Math.PI*2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText("Ti", catX, catY + 5);

        // Growing Chain (Polymer)
        // Moves Up and Right
        // Number of units grows with time
        const unitCount = Math.floor(time * 2) % 15 + 1; // 1 to 15 units
        
        ctx.beginPath();
        ctx.moveTo(catX, catY);
        
        for (let i = 0; i < unitCount; i++) {
            const x = catX + i * 30;
            const y = catY - i * 10 - Math.sin(i)*10;
            ctx.lineTo(x, y);
            
            // Draw Monomer Unit on Chain
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI*2);
            ctx.fillStyle = i === 0 ? '#ef4444' : '#3b82f6'; // Red for newest
            ctx.fill();
            ctx.moveTo(x, y); // reset path
        }
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Floating Monomers (Ethylene)
        // Move towards Catalyst
        const monoProgress = (time * 2) % 1; 
        const monoX = 600 - monoProgress * 400;
        const monoY = 100 + monoProgress * 150;
        
        if (monoProgress < 0.9) {
            ctx.beginPath();
            ctx.arc(monoX, monoY, 12, 0, Math.PI*2);
            ctx.fillStyle = '#ef4444'; // Incoming monomer
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText("C2H4", monoX, monoY + 3);
        }

        ctx.fillStyle = '#1e293b';
        ctx.font = '20px Poppins';
        ctx.textAlign = 'left';
        ctx.fillText("Addition Polymerization (Ziegler-Natta)", 30, 40);
        ctx.font = '14px Roboto';
        ctx.fillStyle = '#64748b';
        ctx.fillText("Active site inserts monomer into growing chain", 30, 65);

    } else {
        // CONDUCTING POLYMERS VISUALIZATION
        // Two Chains: Polyethylene (Insulator) vs Polyacetylene (Conductor)
        
        const drawChain = (y: number, type: 'insulator' | 'conductor', label: string) => {
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 16px Poppins';
            ctx.textAlign = 'left';
            ctx.fillText(label, 50, y - 40);

            // Draw Backbone (ZigZag)
            const startX = 50;
            const segLen = 40;
            const count = 16;
            
            ctx.beginPath();
            ctx.moveTo(startX, y);
            for(let i=0; i<count; i++) {
                ctx.lineTo(startX + (i+1)*segLen, y + (i%2 === 0 ? -20 : 20));
            }
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#94a3b8';
            ctx.stroke();

            // Draw Bonds
            for(let i=0; i<count; i++) {
                const x1 = startX + i*segLen;
                const y1 = y + (i%2 === 0 ? 0 : 0); // approx logic for simplification
                // Actually midpoints of segments
                const segX = startX + i*segLen + segLen/2;
                const segY = y + (i%2 === 0 ? -10 : 10);
                
                if (type === 'conductor') {
                    // Double Bonds every other segment
                    if (i % 2 === 0) {
                        ctx.beginPath();
                        ctx.moveTo(segX - 10, segY - 5);
                        ctx.lineTo(segX + 10, segY + 5); // visual artifact for double bond
                        ctx.strokeStyle = '#f59e0b';
                        ctx.lineWidth = 2;
                        // ctx.stroke();
                        // simpler: Just draw a parallel line
                        const p1x = startX + i*segLen;
                        const p1y = y + (i%2 === 0 ? 0 : 0) + (i%2 === 0 ? -20 : 20); // prev point? No, just hack a parallel line
                        // Draw overlay line
                        ctx.beginPath();
                        ctx.moveTo(startX + i*segLen, y + (i%2===0?-20:20) + 5);
                        ctx.lineTo(startX + (i+1)*segLen, y + ((i+1)%2===0?-20:20) + 5);
                        ctx.strokeStyle = '#f59e0b'; // Gold bond
                        ctx.stroke();
                    }
                }
            }

            // Draw Electrons
            if (type === 'conductor') {
                 // Electrons flow
                 const eCount = 8;
                 for(let k=0; k<eCount; k++) {
                     const p = ((time * 0.5) + (k/eCount)) % 1;
                     const totalLen = count * segLen;
                     const ex = startX + p * totalLen;
                     // Find Y
                     const segIdx = Math.floor(p * count);
                     const localP = (p * count) % 1;
                     const yBase = (segIdx % 2 === 0) ? -20 : 20;
                     const yNext = (segIdx % 2 === 0) ? 20 : -20;
                     const ey = y + yBase + localP * (yNext - yBase);

                     ctx.beginPath();
                     ctx.arc(ex, ey, 6, 0, Math.PI*2);
                     ctx.fillStyle = '#fbbf24'; // Electron Gold
                     ctx.fill();
                     ctx.shadowColor = '#fbbf24';
                     ctx.shadowBlur = 10;
                     ctx.stroke();
                     ctx.shadowBlur = 0;
                 }
                 ctx.fillStyle = '#22c55e';
                 ctx.font = 'bold 14px Arial';
                 ctx.fillText("Conducting! (Delocalized e⁻)", 600, y);
            } else {
                // Static electrons (bonded)
                 ctx.fillStyle = '#ef4444';
                 ctx.font = 'bold 14px Arial';
                 ctx.fillText("Insulator (Localized e⁻)", 600, y);
            }
        };

        drawChain(150, 'insulator', 'Polyethylene (Saturated - No Double Bonds)');
        drawChain(350, 'conductor', 'Polyacetylene (Conjugated - Alternating Double Bonds)');
    }
  };

  const animate = () => {
    draw();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    startTime.current = Date.now();
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [mode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded-xl bg-white shadow-inner border border-slate-200"
    />
  );
};

export default PolymerCanvas;