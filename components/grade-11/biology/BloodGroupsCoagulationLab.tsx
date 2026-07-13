import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Droplets, Pause, Play, RotateCcw, Scissors, Shield } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface BloodGroupsCoagulationLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Tab = 'transfusion' | 'cascade';
type ABO = 'A' | 'B' | 'AB' | 'O';
type CascadeStep = 'idle' | 'platelets' | 'thrombokinase' | 'thrombin' | 'fibrin' | 'clotted';

const ABO_META: Record<ABO, { antigens: string[]; antibodies: string[]; donors: ABO[] }> = {
  A:  { antigens: ['A'],      antibodies: ['anti-B'],         donors: ['A', 'O'] },
  B:  { antigens: ['B'],      antibodies: ['anti-A'],         donors: ['B', 'O'] },
  AB: { antigens: ['A', 'B'], antibodies: [],                 donors: ['AB', 'A', 'B', 'O'] },
  O:  { antigens: [],         antibodies: ['anti-A', 'anti-B'], donors: ['O'] },
};

interface RBC { x: number; y: number; vx: number; vy: number; clumped: boolean; partner?: number }
interface Ab { x: number; y: number; vx: number; vy: number; targetAg: 'A' | 'B' }

const BloodGroupsCoagulationLab: React.FC<BloodGroupsCoagulationLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  const [paused, setPaused] = useState(false);
  const [tab, setTab] = useState<Tab>('transfusion');

  // Transfusion state
  const [donor, setDonor] = useState<ABO>('O');
  const [recipient, setRecipient] = useState<ABO>('AB');
  const [donorRh, setDonorRh] = useState<'+' | '-'>('+');
  const [recipientRh, setRecipientRh] = useState<'+' | '-'>('+');
  const [transfused, setTransfused] = useState(false);
  const rbcsRef = useRef<RBC[]>([]);
  const absRef = useRef<Ab[]>([]);

  // Cascade state
  const [cascadeStep, setCascadeStep] = useState<CascadeStep>('idle');
  const [platelets, setPlatelets] = useState(100); // %
  const [stepMode, setStepMode] = useState(false);
  const cascadeProgressRef = useRef(0);
  const bleedDropsRef = useRef<{ x: number; y: number; vy: number; alpha: number }[]>([]);

  const compatible = ABO_META[recipient].donors.includes(donor) && !(recipientRh === '-' && donorRh === '+');

  const handleReset = useCallback(() => {
    rbcsRef.current = [];
    absRef.current = [];
    setTransfused(false);
    setCascadeStep('idle');
    cascadeProgressRef.current = 0;
    bleedDropsRef.current = [];
  }, []);

  const initTransfusion = () => {
    handleReset();
    // recipient RBCs
    for (let i = 0; i < 14; i++) {
      rbcsRef.current.push({
        x: 800 + Math.random() * 280,
        y: 240 + Math.random() * 280,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        clumped: false,
      });
    }
    // antibodies in recipient plasma
    for (const ab of ABO_META[recipient].antibodies) {
      const targetAg = ab.endsWith('A') ? 'A' : 'B';
      for (let i = 0; i < 12; i++) {
        absRef.current.push({
          x: 800 + Math.random() * 280,
          y: 240 + Math.random() * 280,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14,
          targetAg: targetAg as 'A' | 'B',
        });
      }
    }
    setTransfused(true);
  };

  const startCut = () => {
    handleReset();
    setCascadeStep('platelets');
  };

  useEffect(() => {
    const tick = (now: number) => {
      const dt = Math.min(60, now - (lastRef.current || now));
      lastRef.current = now;
      if (!paused) step(dt / 1000);
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, tab, donor, recipient, donorRh, recipientRh, transfused, cascadeStep, platelets, stepMode]);

  const step = (dt: number) => {
    if (tab === 'transfusion' && transfused) {
      // add donor RBCs over time (spawn flux)
      if (Math.random() < 0.5 && rbcsRef.current.length < 50) {
        const ag = ABO_META[donor].antigens;
        rbcsRef.current.push({
          x: 200 + Math.random() * 120,
          y: 240 + Math.random() * 280,
          vx: 30 + Math.random() * 20,
          vy: (Math.random() - 0.5) * 10,
          clumped: false,
          // donor RBC carries donor antigens — store as marker via x position trick: we'll check clumping later
        });
        // tag donor RBC with antigen via an external map (use array index)
        (rbcsRef.current[rbcsRef.current.length - 1] as any).antigen = ag;
      }
      // move RBCs
      for (const r of rbcsRef.current) {
        if (r.clumped) continue;
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        if (r.x < 30 || r.x > W - 30) r.vx *= -1;
        if (r.y < 220 || r.y > 560) r.vy *= -1;
      }
      // antibody movement + collision detection with donor RBCs
      for (const a of absRef.current) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.x < 30 || a.x > W - 30) a.vx *= -1;
        if (a.y < 220 || a.y > 560) a.vy *= -1;
        // check collision with RBCs carrying matching antigen
        for (const r of rbcsRef.current) {
          if (r.clumped) continue;
          const ag = (r as any).antigen as string[] | undefined;
          if (!ag) continue;
          if (!ag.includes(a.targetAg)) continue;
          if (Math.hypot(r.x - a.x, r.y - a.y) < 18) {
            r.clumped = true;
            r.vx = 0; r.vy = 0;
            // pull antibody into the clump
            a.x = r.x;
            a.y = r.y;
            a.vx = 0; a.vy = 0;
          }
        }
      }
    } else if (tab === 'cascade' && cascadeStep !== 'idle') {
      cascadeProgressRef.current += dt * (platelets / 100) * (stepMode ? 0 : 0.6);
      const order: CascadeStep[] = ['platelets', 'thrombokinase', 'thrombin', 'fibrin', 'clotted'];
      const idx = order.indexOf(cascadeStep);
      if (cascadeProgressRef.current >= 1 && idx < order.length - 1) {
        cascadeProgressRef.current = 0;
        setCascadeStep(order[idx + 1]);
      }
      // bleed drops until clot
      if (cascadeStep !== 'clotted' && Math.random() < 0.6) {
        bleedDropsRef.current.push({ x: 640 + (Math.random() - 0.5) * 30, y: 380, vy: 80, alpha: 1 });
      }
      bleedDropsRef.current = bleedDropsRef.current
        .map(d => ({ ...d, y: d.y + d.vy * dt, alpha: d.alpha - dt * 0.4 }))
        .filter(d => d.alpha > 0);
    }
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    if (tab === 'transfusion') drawTransfusion(ctx);
    else drawCascade(ctx);
  };

  // ---- shared cell helpers ----
  const drawRBCdisc = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, clumped: boolean, antigens?: string[]) => {
    const bg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
    bg.addColorStop(0, clumped ? '#b91c1c' : '#fecaca');
    bg.addColorStop(1, clumped ? '#7f1d1d' : '#ef4444');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = clumped ? '#7f1d1d' : '#dc2626';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // biconcave dimple
    ctx.fillStyle = clumped ? 'rgba(70,10,10,0.55)' : 'rgba(185,28,28,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.45, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // surface antigens
    if (antigens && antigens.length) {
      antigens.forEach((ag, i) => {
        const ang = -0.7 + i * 1.3;
        const ax = x + Math.cos(ang) * r, ay = y + Math.sin(ang) * r;
        ctx.fillStyle = ag === 'A' ? '#0891b2' : '#7c3aed';
        ctx.beginPath();
        ctx.arc(ax, ay, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '700 6px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(ag, ax, ay + 2);
        ctx.textAlign = 'left';
      });
    }
  };

  const drawAntibody = (ctx: CanvasRenderingContext2D, x: number, y: number, target: 'A' | 'B') => {
    ctx.strokeStyle = target === 'A' ? '#0891b2' : '#7c3aed';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(x, y);
    ctx.moveTo(x, y);
    ctx.lineTo(x - 6, y - 8);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 6, y - 8);
    ctx.stroke();
    ctx.lineCap = 'butt';
  };

  const drawTransfusion = (ctx: CanvasRenderingContext2D) => {
    // banner
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 18px Inter';
    ctx.fillText('Transfusion bench — pour donor blood into the recipient', 30, 46);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#64748b';
    ctx.fillText('NCERT §15.1.3 Table 15.1 — matching antigen meets antibody → agglutination (clumping).', 30, 66);

    // recipient plasma chamber (rounded, pale amber)
    const CH = { x: 360, y: 210, w: 700, h: 360 };
    const chGrad = ctx.createLinearGradient(0, CH.y, 0, CH.y + CH.h);
    chGrad.addColorStop(0, '#fffdf5');
    chGrad.addColorStop(1, '#fef3c7');
    ctx.fillStyle = chGrad;
    roundRectPath(ctx, CH.x, CH.y, CH.w, CH.h, 22);
    ctx.fill();
    ctx.strokeStyle = '#e2c98a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#a16207';
    ctx.font = '600 12px Inter';
    ctx.fillText(`Recipient ${recipient}${recipientRh} — plasma + RBCs`, CH.x + 16, CH.y + 24);

    // donor vial (left) with a pour stream when transfusing
    drawGlassVial(ctx, 165, 250, 90, 250, `Donor ${donor}${donorRh}`, donor);
    if (transfused) {
      const streamGrad = ctx.createLinearGradient(210, 360, 360, 420);
      streamGrad.addColorStop(0, '#dc2626');
      streamGrad.addColorStop(1, 'rgba(220,38,38,0.25)');
      ctx.strokeStyle = streamGrad;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(210, 380);
      ctx.quadraticCurveTo(300, 360, CH.x + 20, 430);
      ctx.stroke();
      ctx.lineCap = 'butt';
    }

    // antibodies (drift in plasma)
    for (const a of absRef.current) drawAntibody(ctx, a.x, a.y, a.targetAg);

    // agglutination bridges between nearby clumped cells
    const clumped = rbcsRef.current.filter(r => r.clumped);
    ctx.strokeStyle = 'rgba(124,58,237,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < clumped.length; i++) {
      for (let j = i + 1; j < clumped.length; j++) {
        const d = Math.hypot(clumped[i].x - clumped[j].x, clumped[i].y - clumped[j].y);
        if (d < 46) {
          ctx.beginPath();
          ctx.moveTo(clumped[i].x, clumped[i].y);
          ctx.lineTo(clumped[j].x, clumped[j].y);
          ctx.stroke();
        }
      }
    }

    // RBCs
    for (const r of rbcsRef.current) {
      const ag = (r as any).antigen as string[] | undefined;
      drawRBCdisc(ctx, r.x, r.y, 12, r.clumped, ag);
    }

    // verdict badge — determined by the ABO donor rule + Rh (not by how many
    // collisions have happened yet), so it is correct the instant you transfuse.
    if (transfused) {
      const aboReaction = !ABO_META[recipient].donors.includes(donor);
      const rhReaction = recipientRh === '-' && donorRh === '+';
      const hasReaction = aboReaction || rhReaction;
      const x = 420, y = 596, w = 580, h = 74;
      ctx.fillStyle = hasReaction ? '#fef2f2' : '#f0fdf4';
      ctx.strokeStyle = hasReaction ? '#dc2626' : '#16a34a';
      ctx.lineWidth = 2;
      roundRectPath(ctx, x, y, w, h, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hasReaction ? '#991b1b' : '#166534';
      ctx.font = '800 19px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(
        aboReaction ? '⚠ CLUMPING — RBCs agglutinate & are destroyed'
                    : rhReaction ? '⚠ Rh INCOMPATIBLE — sensitises the recipient'
                    : '✓ SAFE — compatible transfusion',
        x + w / 2, y + 30,
      );
      ctx.font = '500 11px Inter';
      ctx.fillText(
        aboReaction
          ? `Recipient ${recipient} carries ${ABO_META[recipient].antibodies.join(' & ')} — they attack donor ${donor}'s antigen${ABO_META[donor].antigens.length > 1 ? 's' : ''} ${ABO_META[donor].antigens.join(', ')}.`
          : rhReaction
          ? `Rh⁻ recipient receiving Rh⁺ blood makes anti-Rh antibodies (danger on the next exposure).`
          : `Recipient ${recipient} accepts donor ${donor}. Compatible donors: ${ABO_META[recipient].donors.join(', ')}.`,
        x + w / 2, y + 52,
      );
      ctx.textAlign = 'left';
    }
  };

  // realistic glass test-tube with blood fill + meniscus + highlight
  const drawGlassVial = (ctx: CanvasRenderingContext2D, x: number, topY: number, w: number, h: number, label: string, group: ABO) => {
    const r = w / 2;
    // glass body (rounded bottom)
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, topY + h - r);
    ctx.arc(x + r, topY + h - r, r, Math.PI, 0, true);
    ctx.lineTo(x + w, topY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(226,232,240,0.35)';
    ctx.fill();
    // blood fill (lower ~65%)
    const fillTop = topY + h * 0.35;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, fillTop);
    ctx.lineTo(x, topY + h - r);
    ctx.arc(x + r, topY + h - r, r, Math.PI, 0, true);
    ctx.lineTo(x + w, fillTop);
    ctx.closePath();
    ctx.clip();
    const bg = ctx.createLinearGradient(x, fillTop, x, topY + h);
    bg.addColorStop(0, '#ef4444');
    bg.addColorStop(1, '#991b1b');
    ctx.fillStyle = bg;
    ctx.fillRect(x, fillTop, w, h);
    ctx.restore();
    // meniscus
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + r, fillTop, r, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    // glass outline + highlight
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, topY + h - r);
    ctx.arc(x + r, topY + h - r, r, Math.PI, 0, true);
    ctx.lineTo(x + w, topY);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 9, topY + 12);
    ctx.lineTo(x + 9, topY + h - r - 6);
    ctx.stroke();
    // rubber cap
    ctx.fillStyle = '#334155';
    roundRectPath(ctx, x - 4, topY - 14, w + 8, 16, 4);
    ctx.fill();
    // label
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 13px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + r, topY + h + 26);
    // antigen/antibody caption
    const ag = ABO_META[group].antigens;
    ctx.font = '600 10px Inter';
    ctx.fillStyle = '#64748b';
    ctx.fillText(ag.length ? `antigens: ${ag.join(', ')}` : 'no A/B antigens', x + r, topY + h + 42);
    ctx.textAlign = 'left';
  };

  const drawCascade = (ctx: CanvasRenderingContext2D) => {
    // banner
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 18px Inter';
    ctx.fillText('Cut & cascade — how a wound stops bleeding', 30, 46);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#64748b';
    ctx.fillText('NCERT §15.1.4 — platelets → thrombokinase → prothrombin→thrombin → fibrinogen→fibrin → clot', 30, 66);

    // ---- skin cross-section ----
    const skinTop = 120, dermisBot = 430, woundX = 640;
    const epi = ctx.createLinearGradient(0, skinTop, 0, skinTop + 34);
    epi.addColorStop(0, '#f9c9a4'); epi.addColorStop(1, '#f0a97a');
    ctx.fillStyle = epi;
    ctx.fillRect(160, skinTop, 960, 34);
    const derm = ctx.createLinearGradient(0, skinTop + 34, 0, dermisBot);
    derm.addColorStop(0, '#fde7dd'); derm.addColorStop(1, '#f8d3c6');
    ctx.fillStyle = derm;
    ctx.fillRect(160, skinTop + 34, 960, dermisBot - skinTop - 34);
    ctx.fillStyle = '#9a6a52';
    ctx.font = '600 11px Inter';
    ctx.fillText('Skin (epidermis / dermis)', 172, skinTop + 22);

    // ---- blood vessel (tube) ----
    const vTop = 300, vBot = 400, vCy = (vTop + vBot) / 2;
    const wall = 9;
    // vessel wall
    ctx.fillStyle = '#b91c1c';
    roundRectPath(ctx, 175, vTop - wall, 930, (vBot - vTop) + wall * 2, 22);
    ctx.fill();
    // lumen with blood gradient
    const lum = ctx.createLinearGradient(0, vTop, 0, vBot);
    lum.addColorStop(0, '#f87171'); lum.addColorStop(0.5, '#dc2626'); lum.addColorStop(1, '#b91c1c');
    ctx.fillStyle = lum;
    roundRectPath(ctx, 175 + wall, vTop, 930 - wall * 2, vBot - vTop, 16);
    ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    ctx.font = '600 11px Inter';
    ctx.fillText('Blood vessel (lumen)', 200, vTop - 16);

    // flowing RBC discs inside the lumen (decorative)
    for (let i = 0; i < 10; i++) {
      const rx = 240 + i * 78;
      if (Math.abs(rx - woundX) < 40) continue;
      drawRBCdisc(ctx, rx, vCy + Math.sin(i * 1.7) * 18, 10, false);
    }

    if (cascadeStep !== 'idle') {
      const closed = cascadeStep === 'clotted';
      // ---- wound gash through skin into the vessel ----
      ctx.save();
      ctx.fillStyle = closed ? '#7f1d1d' : '#fee2e2';
      ctx.beginPath();
      ctx.moveTo(woundX - 34, skinTop - 2);
      ctx.lineTo(woundX - 10, vTop + 6);
      ctx.lineTo(woundX + 10, vTop + 6);
      ctx.lineTo(woundX + 34, skinTop - 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // platelets massing at the tear
      const plateletGlow = cascadeStep === 'platelets' || cascadeStep === 'thrombokinase';
      for (let i = 0; i < 14; i++) {
        const px = woundX + (Math.random() - 0.5) * 54;
        const py = vTop + 4 + Math.random() * 20;
        ctx.fillStyle = plateletGlow ? '#f59e0b' : '#d4a017';
        ctx.beginPath();
        ctx.ellipse(px, py, 4, 2.6, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!closed) {
        // bleeding out of the gash
        for (const d of bleedDropsRef.current) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(185, 28, 28, ${d.alpha})`;
          ctx.fill();
        }
      } else {
        // ---- fibrin clot: woven mesh + trapped RBCs, dark reddish-brown ----
        ctx.strokeStyle = 'rgba(120,53,15,0.75)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 16; i++) {
          const gx = woundX - 40 + i * 5;
          ctx.beginPath();
          ctx.moveTo(gx, vTop);
          ctx.lineTo(gx + (i % 2 ? 10 : -10), vBot);
          ctx.stroke();
        }
        for (let i = 0; i < 9; i++) {
          const gy = vTop + 6 + i * 10;
          ctx.beginPath();
          ctx.moveTo(woundX - 42, gy);
          ctx.lineTo(woundX + 42, gy + (i % 2 ? 6 : -6));
          ctx.stroke();
        }
        // trapped cells
        for (let i = 0; i < 6; i++) drawRBCdisc(ctx, woundX - 30 + i * 12, vCy + Math.sin(i) * 16, 8, true);
        ctx.fillStyle = '#78350f';
        ctx.font = '700 13px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Fibrin clot — the dark reddish-brown "scum"', woundX, vBot + 34);
        ctx.textAlign = 'left';
      }
    }

    // ---- cascade step flow (vertical, below the vessel) ----
    const stages: { step: CascadeStep; label: string; color: string }[] = [
      { step: 'platelets',     label: 'Platelets activated at the injury', color: '#f59e0b' },
      { step: 'thrombokinase', label: 'Factors form thrombokinase complex', color: '#ea580c' },
      { step: 'thrombin',      label: 'Prothrombin → Thrombin', color: '#7c3aed' },
      { step: 'fibrin',        label: 'Fibrinogen → Fibrin threads', color: '#16a34a' },
      { step: 'clotted',       label: 'Fibrin mesh traps cells → clot', color: '#475569' },
    ];
    const order: CascadeStep[] = ['idle', 'platelets', 'thrombokinase', 'thrombin', 'fibrin', 'clotted'];
    const curIdx = order.indexOf(cascadeStep);
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      const sIdx = order.indexOf(s.step);
      const active = sIdx === curIdx;
      const done = sIdx < curIdx;
      const y = 480 + i * 46;
      // connector arrow to next
      if (i < stages.length - 1) {
        ctx.strokeStyle = done ? '#94a3b8' : '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(285, y + 15);
        ctx.lineTo(285, y + 31);
        ctx.stroke();
      }
      // node
      ctx.fillStyle = active ? s.color : done ? '#94a3b8' : '#e2e8f0';
      if (active) { ctx.shadowColor = s.color; ctx.shadowBlur = 14; }
      ctx.beginPath();
      ctx.arc(285, y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = '700 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, 285, y + 4);
      ctx.textAlign = 'left';
      // label
      ctx.fillStyle = active ? s.color : done ? '#475569' : '#94a3b8';
      ctx.font = active ? '700 14px Inter' : '600 14px Inter';
      ctx.fillText(s.label, 312, y + 5);
      // progress bar for the active step
      if (active) {
        roundRectPath(ctx, 720, y - 8, 220, 16, 8);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = s.color;
        roundRectPath(ctx, 720, y - 8, Math.max(6, 220 * cascadeProgressRef.current), 16, 8);
        ctx.fill();
      }
    }

    // low-platelet warning
    if (platelets < 30) {
      ctx.fillStyle = '#fef2f2';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      roundRectPath(ctx, 800, 150, 300, 92, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#991b1b';
      ctx.font = '700 14px Inter';
      ctx.fillText('⚠ Low platelets — cascade stalls', 818, 178);
      ctx.font = '500 11px Inter';
      ctx.fillStyle = '#7f1d1d';
      ctx.fillText('Haemophilia-like bleeding: the wound', 818, 200);
      ctx.fillText('keeps bleeding. Normal: 1.5–3.5 lakh /mm³.', 818, 218);
    }
  };

  const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const advanceStep = () => {
    const order: CascadeStep[] = ['idle', 'platelets', 'thrombokinase', 'thrombin', 'fibrin', 'clotted'];
    const idx = order.indexOf(cascadeStep);
    if (idx < order.length - 1) {
      cascadeProgressRef.current = 0;
      setCascadeStep(order[idx + 1]);
    }
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">ABO Compatibility</div>
          <div className="text-xs font-semibold text-slate-500">NCERT Table 15.1</div>
          <table className="w-full mt-2 text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="text-left font-bold pb-1">Recipient</th>
                <th className="text-left font-bold pb-1">Donors</th>
              </tr>
            </thead>
            <tbody>
              {(['A', 'B', 'AB', 'O'] as ABO[]).map(r => (
                <tr key={r} className={r === recipient ? 'bg-amber-50' : ''}>
                  <td className="py-1 font-bold">{r}</td>
                  <td className="py-1 font-mono">{ABO_META[r].donors.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-500 mt-2">
            <b>O</b> = universal donor · <b>AB</b> = universal recipient
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Rh Grouping</div>
          <p className="text-[11px] text-slate-600 mt-2 leading-snug">
            ~80% of humans are <b>Rh⁺</b>. If an Rh⁻ person receives Rh⁺ blood, they develop anti-Rh antibodies. <b>Erythroblastosis foetalis</b>: Rh⁻ mother carrying Rh⁺ foetus — second pregnancy attack. Prevented by anti-Rh injection after first delivery.
          </p>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-rose-900">Coagulation Cascade</div>
          <div className="text-xs font-semibold text-rose-700 mt-0.5">NCERT §15.1.4</div>
          <ol className="mt-2 text-sm leading-snug text-rose-950 list-decimal pl-5 space-y-0.5">
            <li>Injury → <b>platelets</b> activated</li>
            <li>Cascade → <b>thrombokinase</b> complex</li>
            <li>Thrombokinase: <b>prothrombin → thrombin</b></li>
            <li>Thrombin: <b>fibrinogen → fibrin</b></li>
            <li>Fibrin mesh traps cells → <b>clot</b></li>
          </ol>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Active tab" value={tab === 'transfusion' ? 'Transfusion' : 'Cascade'} />
            {tab === 'transfusion' ? (
              <>
                <Cell label="Donor" value={`${donor}${donorRh}`} />
                <Cell label="Recipient" value={`${recipient}${recipientRh}`} />
                <Cell label="Compatibility" value={<span className={compatible ? 'text-emerald-700' : 'text-red-700'}>{compatible ? 'Compatible' : 'Incompatible'}</span>} />
                <Cell label="Clumped RBCs" value={rbcsRef.current.filter(r => r.clumped).length} />
              </>
            ) : (
              <>
                <Cell label="Cascade step" value={cascadeStep} />
                <Cell label="Platelet count" value={`${platelets} %`} />
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" />
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-auto">
          <button onClick={() => setPaused(p => !p)} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50">
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button onClick={handleReset} className="p-2 rounded-lg bg-white/90 border border-slate-200 shadow text-slate-700 hover:bg-slate-50">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      {graphPanel}
      {valuesPanel}
    </div>
  );

  const controlsComponent = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
      <div className="flex items-center gap-2 mb-3">
        <Droplets size={18} className="text-rose-600" />
        <h3 className="text-sm font-bold text-slate-800">Blood Groups & Coagulation Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Tab</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['transfusion', 'cascade'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-bold rounded-md ${tab === t ? 'bg-white text-rose-700 shadow' : 'text-slate-600 hover:text-slate-800'}`}>
                {t === 'transfusion' ? '1 · Transfusion Bench' : '2 · Cut & Cascade'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'transfusion' ? (
          <>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Donor blood</label>
              <div className="mt-1.5 flex gap-1">
                {(['A', 'B', 'AB', 'O'] as ABO[]).map(g => (
                  <button key={g} onClick={() => setDonor(g)} className={`px-3 py-1.5 text-xs font-bold rounded-md border ${donor === g ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-600'}`}>{g}</button>
                ))}
                <button onClick={() => setDonorRh(r => r === '+' ? '-' : '+')} className="ml-2 px-3 py-1.5 text-xs font-bold rounded-md border bg-white border-slate-200">Rh {donorRh}</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Recipient blood</label>
              <div className="mt-1.5 flex gap-1">
                {(['A', 'B', 'AB', 'O'] as ABO[]).map(g => (
                  <button key={g} onClick={() => setRecipient(g)} className={`px-3 py-1.5 text-xs font-bold rounded-md border ${recipient === g ? 'bg-cyan-50 border-cyan-300 text-cyan-700' : 'bg-white border-slate-200 text-slate-600'}`}>{g}</button>
                ))}
                <button onClick={() => setRecipientRh(r => r === '+' ? '-' : '+')} className="ml-2 px-3 py-1.5 text-xs font-bold rounded-md border bg-white border-slate-200">Rh {recipientRh}</button>
              </div>
            </div>
            <div className="md:col-span-2">
              <button onClick={initTransfusion} className="px-4 py-2 text-sm font-bold rounded-md bg-rose-600 text-white hover:bg-rose-700">
                <Droplets size={14} className="inline mr-1" /> Transfuse
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
                <span><Shield size={11} className="inline" /> Platelet count</span>
                <span className="font-mono text-slate-700">{platelets}%</span>
              </label>
              <input type="range" min={0} max={150} step={5} value={platelets} onChange={e => setPlatelets(parseInt(e.target.value))} className="w-full mt-1 accent-amber-600" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Cascade controls</label>
              <div className="mt-1.5 flex gap-2 flex-wrap">
                <button onClick={startCut} className="px-3 py-1.5 text-xs font-bold rounded-md bg-rose-600 text-white"><Scissors size={11} className="inline" /> Make cut</button>
                <button onClick={() => setStepMode(s => !s)} className={`px-3 py-1.5 text-xs font-bold rounded-md border ${stepMode ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-600'}`}>Step mode {stepMode ? 'ON' : 'OFF'}</button>
                {stepMode && <button onClick={advanceStep} className="px-3 py-1.5 text-xs font-bold rounded-md bg-slate-800 text-white">▶ Next step</button>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <TopicLayoutContainer
      topic={topic}
      onExit={onExit}
      SimulationComponent={simulationCombo}
      ControlsComponent={controlsComponent}
    />
  );
};

const Cell: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-rose-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-extrabold text-rose-700">{value}</div>
  </div>
);

export default BloodGroupsCoagulationLab;
