import React, { useRef, useEffect } from 'react';
import { Particle, MoleculeState, SimulationConfig } from '../types';

interface CollisionCanvasProps {
  config: SimulationConfig;
  onReactionCountChange: (count: number) => void;
}

const CollisionCanvas: React.FC<CollisionCanvasProps> = ({ config, onReactionCountChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const reactionCountRef = useRef<number>(0);

  // Initialize particles
  useEffect(() => {
    // We use a fixed logical coordinate system for physics to be independent of screen size
    const logicalWidth = 800;
    const logicalHeight = 500;
    
    const count = config.moleculeCount;
    const newParticles: Particle[] = [];
    reactionCountRef.current = 0;
    onReactionCountChange(0);

    for (let i = 0; i < count; i++) {
      const speed = (Math.random() * 0.5 + 0.5) * Math.sqrt(config.temperature / 100); 
      const angle = Math.random() * Math.PI * 2;

      newParticles.push({
        id: i,
        x: Math.random() * logicalWidth,
        y: Math.random() * logicalHeight,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 10, // slightly larger for visibility
        state: MoleculeState.REACTANT,
        angle: Math.random() * Math.PI * 2,
        energy: speed * speed * 50
      });
    }
    particlesRef.current = newParticles;
  }, [config.moleculeCount, config.temperature, onReactionCountChange]); 

  const updatePhysics = (width: number, height: number) => {
    const particles = particlesRef.current;
    
    // 1. Move
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += 0.05;

      if (p.x < p.radius) { p.x = p.radius; p.vx *= -1; }
      if (p.x > width - p.radius) { p.x = width - p.radius; p.vx *= -1; }
      if (p.y < p.radius) { p.y = p.radius; p.vy *= -1; }
      if (p.y > height - p.radius) { p.y = height - p.radius; p.vy *= -1; }
    });

    // 2. Collision
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < p1.radius + p2.radius) {
          const overlap = (p1.radius + p2.radius - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          
          p1.x -= nx * overlap;
          p1.y -= ny * overlap;
          p2.x += nx * overlap;
          p2.y += ny * overlap;

          const dvx = p2.vx - p1.vx;
          const dvy = p2.vy - p1.vy;
          const velAlongNormal = dvx * nx + dvy * ny;

          if (velAlongNormal > 0) continue; 

          const impulse = velAlongNormal;
          p1.vx += impulse * nx;
          p1.vy += impulse * ny;
          p2.vx -= impulse * nx;
          p2.vy -= impulse * ny;

          // Reaction Logic
          const collisionEnergy = p1.energy + p2.energy;
          const orientationSuccess = Math.random() < config.stericFactor;

          if (
            p1.state === MoleculeState.REACTANT && 
            p2.state === MoleculeState.REACTANT &&
            collisionEnergy >= config.activationEnergy &&
            orientationSuccess
          ) {
            p1.state = MoleculeState.PRODUCT;
            p2.state = MoleculeState.PRODUCT;
            reactionCountRef.current += 1;
            onReactionCountChange(reactionCountRef.current);
          }
        }
      }
    }
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

    // Physics update uses logical dimensions
    updatePhysics(logicalWidth, logicalHeight);

    // Clear
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, logicalHeight);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // Particles
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Molecule Shape
      ctx.beginPath();
      if (p.state === MoleculeState.PRODUCT) {
        ctx.fillStyle = '#ef4444'; // Red
        ctx.strokeStyle = '#b91c1c';
      } else {
        ctx.fillStyle = '#3b82f6'; // Blue
        ctx.strokeStyle = '#1d4ed8';
      }
      
      // Draw Dumbbell
      ctx.arc(-5, 0, p.radius, 0, Math.PI * 2);
      ctx.arc(5, 0, p.radius * 0.8, 0, Math.PI * 2);
      
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();

      // Activated Complex Glow
      if (p.state === MoleculeState.REACTANT && p.energy > config.activationEnergy * 0.9) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fbbf24';
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();
      }

      ctx.restore();
    });
  };

  const animate = () => {
    draw();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }); // Run always

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded-xl shadow-inner border border-slate-200 bg-slate-50 touch-none"
    />
  );
};

export default CollisionCanvas;