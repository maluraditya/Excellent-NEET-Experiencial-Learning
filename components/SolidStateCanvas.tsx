import React, { useRef, useEffect, useState } from 'react';

interface SolidStateCanvasProps {
  topic: 'classification' | 'unit_cells' | 'packing' | 'defects';
  // Props for Classification
  solidType?: 'ionic' | 'metallic' | 'molecular' | 'covalent';
  action?: 'none' | 'hammer' | 'heat' | 'battery';
  // Props for Unit Cells / Packing
  cellType?: 'scc' | 'bcc' | 'fcc';
  showSlicer?: boolean;
  // Props for Defects
  defectMode?: 'schottky' | 'frenkel';
}

const SolidStateCanvas: React.FC<SolidStateCanvasProps> = ({ 
  topic, 
  solidType = 'ionic', 
  action = 'none',
  cellType = 'scc',
  showSlicer = false,
  defectMode = 'schottky'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const startTime = useRef(Date.now());
  
  // State for Manual Rotation (3D)
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.5 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  
  // State for Defects Simulation
  const gridRef = useRef<Array<{id: number, type: 'cation'|'anion', x: number, y: number, originalX: number, originalY: number, removed: boolean, interstitial: boolean}>>([]);
  const [density, setDensity] = useState(100);

  // Initialize Defect Grid
  useEffect(() => {
    if (topic === 'defects') {
        const grid = [];
        const rows = 6;
        const cols = 8;
        const spacing = 60;
        const startX = 180;
        const startY = 100;
        let id = 0;
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                grid.push({
                    id: id++,
                    type: (r+c)%2 === 0 ? 'cation' : 'anion' as const,
                    x: startX + c * spacing,
                    y: startY + r * spacing,
                    originalX: startX + c * spacing,
                    originalY: startY + r * spacing,
                    removed: false,
                    interstitial: false
                });
            }
        }
        gridRef.current = grid;
        setDensity(100);
    }
  }, [topic]);

  // Mouse Handlers for Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Check if we are clicking an ion in defects mode first
    if (topic === 'defects') {
       handleClick(e);
       return; 
    }

    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    if (topic === 'unit_cells' || topic === 'packing') {
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        // Adjust sensitivity
        setRotation(prev => ({ x: prev.x + dx * 0.01, y: prev.y + dy * 0.01 }));
        lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI Scaling
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

    // ---------------------------------------------------------
    // MODE 1: CLASSIFICATION OF SOLIDS
    // ---------------------------------------------------------
    if (topic === 'classification') {
        const spacing = 60;
        const startX = 250;
        const startY = 150;
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px Poppins';
        ctx.textAlign = 'left';
        ctx.fillText(`Solid Type: ${solidType?.toUpperCase()}`, 30, 40);

        // REAL-TIME EXPLANATION OVERLAY
        let explanation = "";
        if (action === 'hammer') {
            if (solidType === 'ionic') explanation = "Ionic solids are BRITTLE. Force aligns like charges -> Repulsion -> Fracture.";
            if (solidType === 'metallic') explanation = "Metallic solids are MALLEABLE. Electron sea allows layers to slide without breaking.";
            if (solidType === 'molecular') explanation = "Molecular solids are SOFT. Weak intermolecular forces are easily overcome.";
            if (solidType === 'covalent') explanation = "Covalent networks are extremely HARD. Strong bonds resist deformation (Diamond-like).";
        } else if (action === 'battery') {
             if (solidType === 'ionic') explanation = "INSULATOR in solid state. Ions are fixed in position.";
             if (solidType === 'metallic') explanation = "CONDUCTOR. Free delocalized electrons carry the charge.";
             if (solidType === 'molecular') explanation = "INSULATOR. No free ions or electrons.";
             if (solidType === 'covalent') explanation = "INSULATOR. Electrons are held tightly in bonds (except Graphite).";
        } else if (action === 'heat') {
             if (solidType === 'molecular') explanation = "Low Melting Point. Weak dispersion/dipole forces break easily.";
             if (solidType === 'ionic') explanation = "High Melting Point. Strong electrostatic forces.";
             if (solidType === 'metallic') explanation = "High Melting Point. Strong metallic bonds.";
             if (solidType === 'covalent') explanation = "Very High Melting Point. Network bonds must be broken.";
        }

        if (explanation) {
            ctx.fillStyle = 'rgba(255, 247, 237, 0.9)'; // Orange-50
            ctx.fillRect(logicalWidth/2 - 250, 430, 500, 40);
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 1;
            ctx.strokeRect(logicalWidth/2 - 250, 430, 500, 40);
            
            ctx.fillStyle = '#c2410c'; // Orange-700
            ctx.textAlign = 'center';
            ctx.font = 'bold 14px Roboto';
            ctx.fillText(explanation, logicalWidth/2, 455);
        }

        // Draw Particles
        for(let r=0; r<4; r++) {
            for(let c=0; c<5; c++) {
                let x = startX + c*spacing;
                let y = startY + r*spacing;
                let color = '#94a3b8';
                let radius = 20;
                let label = '';

                // --- ACTION PHYSICS LOGIC ---

                // HAMMER (Stress)
                if (action === 'hammer') {
                    const impactTime = time % 2 > 1; // Hit every 2 seconds
                    if (solidType === 'ionic') {
                        // Brittle: Shift one row -> Repel -> Fly away
                        if (r === 1 && impactTime) x += 30; // Shift
                        if (r === 1 && time % 2 > 1.2) {
                             y += (time%2 - 1.2) * 200; // Fly away (shatter)
                             x += (Math.random()-0.5) * 50; // Scatter
                        }
                    } else if (solidType === 'metallic') {
                        // Malleable: Layers slide smoothly
                        if (r === 1 && impactTime) x += (time%2 - 1) * 30; 
                    } else if (solidType === 'molecular') {
                        // Soft: Squish/Displace randomly but don't fly away like ionic
                        if (impactTime) {
                            x += Math.sin(time*20 + r)*5; 
                            y += Math.cos(time*20 + c)*5;
                        }
                    } else if (solidType === 'covalent') {
                        // Hard: Rigid vibration only
                        if (impactTime) {
                            x += Math.sin(time * 50) * 2; // High freq vibration
                        }
                    }
                }

                // HEAT (Melting)
                if (action === 'heat') {
                    // Base Vibration
                    const vib = solidType === 'covalent' ? 1 : (solidType === 'molecular' ? 5 : 2);
                    x += Math.sin(time * 20 + r*c) * vib;
                    y += Math.cos(time * 20 + r*c) * vib;
                    
                    // Melt Logic
                    const meltStart = 3; 
                    if (time % 5 > meltStart) { 
                        // Molecular melts fast, Covalent stays solid longer (conceptually)
                        if (solidType !== 'covalent') {
                            y += (time%5 - meltStart) * (solidType === 'molecular' ? 80 : 40);
                            x += Math.sin(y * 0.1) * 20;
                        }
                    }
                }

                // --- DRAWING PARTICLES ---

                if (solidType === 'ionic') {
                    color = (r+c)%2===0 ? '#22c55e' : '#3b82f6'; // + / -
                    label = (r+c)%2===0 ? '+' : '-';
                    // Force field lines
                    if (c < 4 && action !== 'hammer') {
                        ctx.beginPath();
                        ctx.moveTo(x + radius, y);
                        ctx.lineTo(x + spacing - radius, y);
                        ctx.strokeStyle = '#cbd5e1';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                } else if (solidType === 'metallic') {
                    color = '#f59e0b'; // Kernel
                    label = '+';
                    // Sea of electrons
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
                    ctx.beginPath();
                    ctx.arc(x, y, 35, 0, Math.PI*2);
                    ctx.fill();
                } else if (solidType === 'molecular') {
                    color = '#94a3b8'; // Neutral
                    label = 'H₂O';
                    radius = 18;
                    // Weak bonds (dotted)
                    if (c < 4) {
                        ctx.beginPath();
                        ctx.setLineDash([2, 4]);
                        ctx.moveTo(x + radius, y);
                        ctx.lineTo(x + spacing - radius, y);
                        ctx.strokeStyle = '#94a3b8';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                } else if (solidType === 'covalent') {
                    color = '#475569';
                    label = 'C';
                    radius = 15;
                    // Strong Network bonds
                     if (c < 4) {
                        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+spacing, y); ctx.strokeStyle = 'white'; ctx.lineWidth = 4; ctx.stroke();
                    }
                    if (r < 3) {
                         ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y+spacing); ctx.strokeStyle = 'white'; ctx.lineWidth = 4; ctx.stroke();
                    }
                }

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI*2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, x, y);
            }
        }

        // Action Visuals (Tools)
        if (action === 'battery') {
            // Draw Battery Circuit
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 4;
            ctx.strokeRect(startX - 20, startY - 20, 5*spacing, 4*spacing);
            
            // Bulb
            ctx.beginPath();
            ctx.arc(startX + 2.5*spacing, startY - 60, 20, 0, Math.PI*2);
            const isConducting = solidType === 'metallic';
            ctx.fillStyle = isConducting ? '#fbbf24' : '#475569';
            if (isConducting) {
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 20;
            }
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Electrons Flowing (only for metallic)
            if (isConducting) {
                 const eSize = 4;
                 const pathLen = (5*spacing + 4*spacing) * 2;
                 const eCount = 10;
                 ctx.fillStyle = '#fbbf24';
                 for(let i=0; i<eCount; i++) {
                     const p = ((time * 0.5) + i/eCount) % 1;
                     // Simple path trace rect
                     let ex=0, ey=0;
                     if (p < 0.3) { ex = startX - 20 + p/0.3 * (5*spacing); ey = startY - 20; }
                     else if (p < 0.5) { ex = startX - 20 + 5*spacing; ey = startY - 20 + (p-0.3)/0.2 * (4*spacing); }
                     else if (p < 0.8) { ex = startX - 20 + 5*spacing - (p-0.5)/0.3 * (5*spacing); ey = startY - 20 + 4*spacing; }
                     else { ex = startX - 20; ey = startY - 20 + 4*spacing - (p-0.8)/0.2 * (4*spacing); }
                     
                     ctx.beginPath(); ctx.arc(ex, ey, eSize, 0, Math.PI*2); ctx.fill();
                 }
            }

            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.font = 'bold 16px Poppins';
            ctx.fillText(isConducting ? "CONDUCTOR" : "INSULATOR", startX + 2.5*spacing, startY - 90);
        }

        if (action === 'hammer') {
            const hammerX = startX - 80 + Math.sin(time * 10)*20;
            const hammerY = startY + 60;
            ctx.fillStyle = '#475569';
            ctx.fillRect(hammerX, hammerY, 60, 40);
            ctx.fillRect(hammerX - 40, hammerY + 15, 40, 10);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("STRESS TEST", hammerX + 30, hammerY - 10);
        }
    }

    // ---------------------------------------------------------
    // MODE 2 & 3: UNIT CELLS & PACKING
    // ---------------------------------------------------------
    else if (topic === 'unit_cells' || topic === 'packing') {
        const cx = logicalWidth / 2;
        const cy = logicalHeight / 2;
        const size = 150;
        
        // Manual Rotation
        const rx = rotation.x;
        const ry = rotation.y;

        // Helper to project 3D point
        const project = (x: number, y: number, z: number) => {
            let x1 = x * Math.cos(rx) - z * Math.sin(rx);
            let z1 = x * Math.sin(rx) + z * Math.cos(rx);
            let y1 = y * Math.cos(ry) - z1 * Math.sin(ry);
            // let z2 = y * Math.sin(ry) + z1 * Math.cos(ry);
            const scale = 500 / (500 - (y * Math.sin(ry) + z1 * Math.cos(ry))); // perspective
            return { x: cx + x1 * scale, y: cy + y1 * scale, scale };
        };

        // Draw Drag Hint
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText("Drag to Rotate 360°", 20, 30);

        // Draw Cube Edges
        const corners = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];
        const projCorners = corners.map(c => project(c[0]*size/2, c[1]*size/2, c[2]*size/2));

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        const edges = [
            [0,1], [1,2], [2,3], [3,0], // back
            [4,5], [5,6], [6,7], [7,4], // front
            [0,4], [1,5], [2,6], [3,7]  // connect
        ];
        edges.forEach(e => {
            ctx.beginPath();
            ctx.moveTo(projCorners[e[0]].x, projCorners[e[0]].y);
            ctx.lineTo(projCorners[e[1]].x, projCorners[e[1]].y);
            ctx.stroke();
        });

        // Atoms Logic
        const atoms: {x: number, y: number, z: number, type: 'corner'|'face'|'body', color: string}[] = [];
        const r = topic === 'packing' ? size/2.5 : 20; // Large for packing, small for unit cell view

        // Corners (All types have corners)
        corners.forEach(c => atoms.push({x: c[0]*size/2, y: c[1]*size/2, z: c[2]*size/2, type: 'corner', color: '#3b82f6'}));

        // Body Center (BCC)
        if (cellType === 'bcc') {
             atoms.push({x: 0, y: 0, z: 0, type: 'body', color: '#ef4444'});
        }

        // Face Centers (FCC)
        if (cellType === 'fcc') {
             const faces = [
                 [0,0,-1], [0,0,1], [0,-1,0], [0,1,0], [-1,0,0], [1,0,0]
             ];
             faces.forEach(f => atoms.push({x: f[0]*size/2, y: f[1]*size/2, z: f[2]*size/2, type: 'face', color: '#22c55e'}));
        }

        // Sort by depth (painter's algorithm - simple z sort)
        // Recalculate z for sorting
        const atomsWithDepth = atoms.map(a => {
             let x1 = a.x * Math.cos(rx) - a.z * Math.sin(rx);
             let z1 = a.x * Math.sin(rx) + a.z * Math.cos(rx);
             let z2 = a.y * Math.sin(ry) + z1 * Math.cos(ry); // actual depth
             return { ...a, depth: z2, proj: project(a.x, a.y, a.z) };
        });
        atomsWithDepth.sort((a, b) => a.depth - b.depth);

        // Draw Atoms
        atomsWithDepth.forEach(a => {
            ctx.beginPath();
            
            // Slicer Logic: If showSlicer is on, we clip the spheres
            let radius = topic === 'packing' ? (cellType === 'scc' ? size/2 : cellType === 'bcc' ? size/2.3 : size/2.8) : 25;
            
            if (showSlicer && topic === 'unit_cells') {
                 // Visualize cut atoms
                 // Draw full sphere but clipped? 
                 // Simple simulation: Reduce radius or draw arc
                 if (a.type === 'corner') {
                     // 1/8th - Draw smaller wedge
                     ctx.arc(a.proj.x, a.proj.y, radius, 0, Math.PI/2);
                     ctx.lineTo(a.proj.x, a.proj.y);
                 } else if (a.type === 'face') {
                     // 1/2 - Draw half
                     ctx.arc(a.proj.x, a.proj.y, radius, 0, Math.PI);
                 } else {
                     ctx.arc(a.proj.x, a.proj.y, radius, 0, Math.PI*2);
                 }
            } else {
                ctx.arc(a.proj.x, a.proj.y, radius * a.proj.scale, 0, Math.PI*2);
            }
            
            ctx.fillStyle = a.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.stroke();

            // Packing Efficiency Overlay
            if (topic === 'packing' && a.depth > 0) {
                 // Draw void indication?
            }
        });

        // Packing Overlay Text
        if (topic === 'packing') {
             ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
             ctx.fillRect(logicalWidth - 250, 20, 230, 120);
             ctx.fillStyle = '#1e293b';
             ctx.font = 'bold 16px Poppins';
             ctx.textAlign = 'left';
             const eff = cellType === 'fcc' ? '74%' : cellType === 'bcc' ? '68%' : '52.4%';
             const voidP = cellType === 'fcc' ? '26%' : cellType === 'bcc' ? '32%' : '47.6%';
             ctx.fillText(`Efficiency: ${eff}`, logicalWidth - 230, 50);
             ctx.fillText(`Void Space: ${voidP}`, logicalWidth - 230, 80);
             
             // Draw relation
             ctx.font = 'italic 14px Roboto';
             const rel = cellType === 'fcc' ? '4r = √2a' : cellType === 'bcc' ? '4r = √3a' : '2r = a';
             ctx.fillText(`Relation: ${rel}`, logicalWidth - 230, 110);
        }

        // Unit Cell Count Overlay
        if (topic === 'unit_cells') {
             ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
             ctx.fillRect(20, 35, 200, 100);
             ctx.fillStyle = '#1e293b';
             ctx.font = 'bold 16px Poppins';
             ctx.textAlign = 'left';
             const z = cellType === 'fcc' ? 4 : cellType === 'bcc' ? 2 : 1;
             ctx.fillText(`Total Atoms (Z): ${z}`, 40, 65);
             ctx.font = '12px Roboto';
             if (cellType === 'scc') ctx.fillText("8 Corners × 1/8 = 1", 40, 95);
             if (cellType === 'bcc') ctx.fillText("8 Corners × 1/8 + 1 Body = 2", 40, 95);
             if (cellType === 'fcc') ctx.fillText("8 Corners × 1/8 + 6 Faces × 1/2 = 4", 40, 95);
        }
    }

    // ---------------------------------------------------------
    // MODE 4: DEFECTS
    // ---------------------------------------------------------
    else if (topic === 'defects') {
        const grid = gridRef.current;
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px Poppins';
        ctx.textAlign = 'left';
        ctx.fillText(`Defect Type: ${defectMode === 'schottky' ? 'Schottky (Vacancy)' : 'Frenkel (Dislocation)'}`, 30, 40);

        // Calculate Density
        const totalOriginal = 48;
        const currentCount = grid.filter(i => !i.removed).length;
        // Frenkel doesn't remove atoms, just moves them, so density stays same technically, 
        // but in our sim we might remove for Schottky.
        // Schottky: Remove pair.
        
        grid.forEach(ion => {
            if (ion.removed) {
                // Draw ghost
                ctx.beginPath();
                ctx.arc(ion.originalX, ion.originalY, 20, 0, Math.PI*2);
                ctx.fillStyle = 'rgba(0,0,0,0.05)';
                ctx.fill();
                ctx.strokeStyle = '#cbd5e1';
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
                return;
            }

            ctx.beginPath();
            let x = ion.x;
            let y = ion.y;
            
            // Draw Ion
            ctx.arc(x, y, ion.type === 'cation' ? 15 : 25, 0, Math.PI*2);
            ctx.fillStyle = ion.type === 'cation' ? '#3b82f6' : '#22c55e';
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(ion.type === 'cation' ? '+' : '-', x, y);

            // Draw original spot if interstitial
            if (ion.interstitial) {
                ctx.beginPath();
                ctx.arc(ion.originalX, ion.originalY, 15, 0, Math.PI*2);
                ctx.strokeStyle = '#cbd5e1';
                ctx.stroke();
            }
        });

        // Density Meter
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(logicalWidth - 100, 100, 60, 300);
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px Arial';
        ctx.fillText("Density", logicalWidth - 70, 90);
        
        const densityH = (currentCount / totalOriginal) * 300;
        ctx.fillStyle = defectMode === 'schottky' ? '#ef4444' : '#22c55e';
        ctx.fillRect(logicalWidth - 100, 100 + (300 - densityH), 60, densityH);

        // Interactive Hint
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 14px Roboto';
        ctx.textAlign = 'center';
        ctx.fillText("Click ions to create defects", logicalWidth/2, logicalHeight - 30);
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

  // Handle Interaction (Click for defects)
  const handleClick = (e: React.MouseEvent) => {
      // Logic for defects mode
      if (topic !== 'defects') return;
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Calculate logical coordinates from click
      const dpr = window.devicePixelRatio || 1;
      const scaleX = 800 / rect.width;
      const scaleY = 500 / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Find clicked ion
      const clickedIon = gridRef.current.find(i => Math.hypot(i.x - x, i.y - y) < 30 && !i.removed);
      
      if (clickedIon) {
          if (defectMode === 'schottky') {
              // Remove Pair (find nearest opposite neighbor to maintain neutrality conceptually, 
              // but for sim ease just remove clicked + nearest neighbor)
              clickedIon.removed = true;
              const neighbor = gridRef.current.find(i => !i.removed && i.type !== clickedIon.type && Math.hypot(i.x - clickedIon.x, i.y - clickedIon.y) < 70);
              if (neighbor) neighbor.removed = true;
          } else {
              // Frenkel: Move Cation to Interstitial
              if (clickedIon.type === 'cation' && !clickedIon.interstitial) {
                  clickedIon.x += 30; // Move into void
                  clickedIon.y += 30;
                  clickedIon.interstitial = true;
              }
          }
      }
  };

  return (
    <canvas 
      ref={canvasRef} 
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`w-full h-full rounded-xl bg-white shadow-inner border border-slate-200 ${topic === 'defects' ? 'cursor-pointer' : 'cursor-move'}`}
    />
  );
};

export default SolidStateCanvas;