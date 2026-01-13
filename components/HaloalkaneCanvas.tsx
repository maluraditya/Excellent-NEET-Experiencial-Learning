import React, { useRef, useEffect } from 'react';

interface HaloalkaneCanvasProps {
  mechanism: 'SN1' | 'SN2';
  substrate: 'primary' | 'tertiary'; // Primary favors SN2, Tertiary favors SN1
}

const HaloalkaneCanvas: React.FC<HaloalkaneCanvasProps> = ({ mechanism, substrate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const startTime = useRef(Date.now());

  // Define Colors
  const COLOR_C = '#334155';
  const COLOR_H = '#94a3b8';
  const COLOR_X = '#22c55e'; // Halogen (Leaving Group)
  const COLOR_NU = '#ef4444'; // Nucleophile

  // Logic: 
  // If Primary & SN2 -> Fast, Smooth Inversion
  // If Tertiary & SN2 -> Blocked (Steric Hindrance)
  // If Primary & SN1 -> Slow Carbocation (Unstable)
  // If Tertiary & SN1 -> Stable Carbocation, Racemization

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
    
    const t = (Date.now() - startTime.current) / 1000;
    const cycle = 6; // seconds per reaction cycle
    const progress = (t % cycle) / cycle;

    const centerX = logicalWidth / 2;
    const centerY = logicalHeight / 2;

    // --- DRAW HELPERS ---
    const drawAtom = (x: number, y: number, r: number, color: string, label?: string) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Specular highlight
      ctx.beginPath();
      ctx.arc(x - r/3, y - r/3, r/3, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();

      if (label) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
      }
    };

    const drawBond = (x1: number, y1: number, x2: number, y2: number, thickness: number = 4) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    // --- SCENARIO LOGIC ---
    
    if (mechanism === 'SN2') {
        // SN2 ANIMATION: Concerted Backside Attack
        
        let nuX = 0;
        let cX = centerX;
        let lgX = 0;
        let umbrellaInversion = 0; // -1 (Left) to 1 (Right)
        
        // If Tertiary, SN2 is blocked by sterics
        const isBlocked = substrate === 'tertiary';

        if (isBlocked) {
            // Nu bounces off
            const approach = Math.min(progress * 2, 1);
            const retreat = Math.max(0, progress * 2 - 1);
            nuX = 100 + approach * 200 - retreat * 200; // Come close then bounce
            lgX = centerX + 60; // LG stays put
            umbrellaInversion = -1; // No inversion
            
            // Text Feedback
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 24px Poppins';
            ctx.textAlign = 'center';
            // Adjusted Y position to 80 to avoid overlap with phase label
            ctx.fillText("STERIC HINDRANCE! REACTION BLOCKED", centerX, 80);
            
        } else {
            // Successful SN2 (Primary)
            // Phase 1: Approach (0 - 0.4)
            // Phase 2: Transition State (0.4 - 0.6)
            // Phase 3: Departure (0.6 - 1.0)
            
            if (progress < 0.4) {
               nuX = 100 + (progress/0.4) * (centerX - 100 - 40);
               lgX = centerX + 40;
               umbrellaInversion = -1; 
            } else if (progress < 0.6) {
               // Transition State
               nuX = centerX - 40;
               lgX = centerX + 40 + (progress - 0.4) * 50; 
               // Inversion happens here
               umbrellaInversion = -1 + ((progress - 0.4)/0.2) * 2; // -1 to 1
            } else {
               nuX = centerX - 40;
               lgX = centerX + 50 + (progress - 0.6) * 300; // LG leaves
               umbrellaInversion = 1;
            }
        }

        const tilt = isBlocked ? 20 : (20 * -umbrellaInversion); // +/- 20 pixels x-offset
        
        // Draw Bonds to Groups
        // Group 1 (Up)
        drawBond(cX, centerY, cX + tilt, centerY - 60);
        drawAtom(cX + tilt, centerY - 60, substrate === 'tertiary' ? 25 : 15, substrate === 'tertiary' ? COLOR_C : COLOR_H, substrate === 'tertiary' ? 'CH3' : 'H');

        // Group 2 (Down)
        drawBond(cX, centerY, cX + tilt, centerY + 60);
        drawAtom(cX + tilt, centerY + 60, substrate === 'tertiary' ? 25 : 15, substrate === 'tertiary' ? COLOR_C : COLOR_H, substrate === 'tertiary' ? 'CH3' : 'H');
        
        // Draw C-Nu Bond (forming)
        if (progress > 0.4 && !isBlocked) {
             // Dashed if TS
             ctx.setLineDash([5,5]);
             drawBond(nuX, centerY, cX, centerY, 2);
             ctx.setLineDash([]);
        }
        
        // Draw C-LG Bond (breaking)
        if (progress < 0.8) {
             if (progress > 0.4) ctx.setLineDash([5,5]);
             drawBond(cX, centerY, lgX, centerY, 2);
             ctx.setLineDash([]);
        } else if (isBlocked) {
             drawBond(cX, centerY, lgX, centerY, 4);
        }

        // Draw Atoms
        drawAtom(cX, centerY, 30, COLOR_C, "C"); // Carbon
        drawAtom(nuX, centerY, 25, COLOR_NU, "Nu⁻"); // Nucleophile
        drawAtom(lgX, centerY, 25, COLOR_X, "X"); // Leaving Group
        
        // Label Phase
        ctx.fillStyle = '#1e293b';
        ctx.font = '20px Poppins';
        ctx.textAlign = 'left';
        let phaseText = "Phase 1: Nucleophile Approach";
        if (isBlocked) phaseText = "Steric Hindrance (Blocked)";
        else if (progress > 0.4 && progress < 0.6) phaseText = "Phase 2: Transition State (Pentacoordinate)";
        else if (progress >= 0.6) phaseText = "Phase 3: Inversion & Product";
        
        ctx.fillText(phaseText, 30, 40);

    } else {
        // SN1 ANIMATION: Two Step
        // Step 1: LG leaves. Carbocation forms (Planar).
        // Step 2: Nu attacks (Front or Back).
        
        // Tertiary favors this. Primary hates this (Unstable C+).
        const isUnstable = substrate === 'primary';
        
        let cX = centerX;
        let lgX = centerX + 40;
        let nuX = 50;
        
        // Phase 1: Ionization (0 - 0.5)
        // Phase 2: Attack (0.5 - 1.0)
        
        let step1Progress = Math.min(progress * 2, 1);
        let step2Progress = Math.max(0, progress * 2 - 1);
        
        if (isUnstable && progress > 0.3) {
             // Primary C+ is too unstable, reaction fails/reverts
             step1Progress = Math.max(0, 0.3 - (progress - 0.3)); // Go back
             // Text
             ctx.fillStyle = '#ef4444';
             ctx.font = 'bold 24px Poppins';
             ctx.textAlign = 'center';
             ctx.fillText("PRIMARY CARBOCATION UNSTABLE!", centerX, 50);
        }

        // Move LG
        lgX = centerX + 40 + step1Progress * 200;
        
        // Move Nu (only in step 2)
        if (!isUnstable) {
            // Nu attacks from Left (could be Right too for Racemization, visualizing one side)
            nuX = 50 + step2Progress * (centerX - 50 - 40);
        }

        // Draw Groups
        // Planar Intermediate means Groups are Vertical (x-offset 0)
        // Initial: Tetrahedral (Groups Left)
        const tilt = 20 * (1 - step1Progress); // Goes to 0 (Planar)
        
        // Group 1
        drawBond(cX, centerY, cX - tilt, centerY - 60);
        drawAtom(cX - tilt, centerY - 60, substrate === 'tertiary' ? 25 : 15, substrate === 'tertiary' ? COLOR_C : COLOR_H, substrate === 'tertiary' ? 'CH3' : 'H');
        // Group 2
        drawBond(cX, centerY, cX - tilt, centerY + 60);
        drawAtom(cX - tilt, centerY + 60, substrate === 'tertiary' ? 25 : 15, substrate === 'tertiary' ? COLOR_C : COLOR_H, substrate === 'tertiary' ? 'CH3' : 'H');

        // Draw C-LG
        if (step1Progress < 0.8) {
            if (step1Progress > 0.1) ctx.setLineDash([5,5]);
            drawBond(cX, centerY, lgX, centerY, 2);
            ctx.setLineDash([]);
        }

        // Draw C-Nu
        if (step2Progress > 0.1 && !isUnstable) {
            if (step2Progress < 0.9) ctx.setLineDash([5,5]);
            drawBond(nuX, centerY, cX, centerY, 2);
            ctx.setLineDash([]);
        }

        // Carbocation Charge
        if (step1Progress > 0.2 && step2Progress < 0.8 && !isUnstable) {
             ctx.fillStyle = '#3b82f6';
             ctx.font = 'bold 20px Arial';
             ctx.fillText("+", cX + 15, centerY - 15);
             
             // p-orbital lobes (visualizing empty orbital)
             ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
             ctx.beginPath();
             ctx.ellipse(cX, centerY - 50, 15, 40, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.beginPath();
             ctx.ellipse(cX, centerY + 50, 15, 40, 0, 0, Math.PI*2);
             ctx.fill();
        }

        drawAtom(cX, centerY, 30, COLOR_C, "C");
        drawAtom(lgX, centerY, 25, COLOR_X, "X⁻");
        drawAtom(nuX, centerY, 25, COLOR_NU, "Nu⁻");

        if (!isUnstable) {
            ctx.fillStyle = '#1e293b';
            ctx.font = '20px Poppins';
            ctx.textAlign = 'left';
            if (step1Progress < 1) ctx.fillText("Step 1: Leaving Group departs (Rate Determining)", 30, 40);
            else ctx.fillText("Step 2: Nucleophilic Attack (Fast)", 30, 40);
        }
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
  }, [mechanism, substrate]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded-xl bg-white shadow-inner border border-slate-200"
    />
  );
};

export default HaloalkaneCanvas;