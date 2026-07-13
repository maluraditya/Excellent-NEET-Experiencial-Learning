import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Mountain, Pause, Play, RotateCcw, Wind } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PulmonaryVentilationLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Altitude = 'sea' | '3000' | '5000' | 'everest';
type Activity_ = 'rest' | 'walk' | 'sprint';

const ALT_META: Record<Altitude, { label: string; atmosphericPO2: number }> = {
  sea:     { label: 'Sea level',  atmosphericPO2: 100 },
  '3000':  { label: '3,000 m',    atmosphericPO2: 70  },
  '5000':  { label: '5,000 m',    atmosphericPO2: 53  },
  everest: { label: 'Everest',    atmosphericPO2: 36  },
};
const ACT_META: Record<Activity_, { label: string; tissuePO2: number; tissuePCO2: number }> = {
  rest:   { label: 'Rest',     tissuePO2: 40, tissuePCO2: 45 },
  walk:   { label: 'Walking',  tissuePO2: 30, tissuePCO2: 55 },
  sprint: { label: 'Sprinting', tissuePO2: 15, tissuePCO2: 75 },
};

interface Particle { x: number; y: number; vx: number; vy: number; kind: 'o2' | 'co2'; age: number }

const PulmonaryVentilationLab: React.FC<PulmonaryVentilationLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const breathPhaseRef = useRef<number>(0); // 0..1 in/out
  const particlesRef = useRef<Particle[]>([]);
  const rbcRef = useRef<{ t: number }[]>([]);

  const [paused, setPaused] = useState(false);
  const [tidalVolume, setTidalVolume] = useState(500); // mL
  const [breathRate, setBreathRate] = useState(12);    // /min
  const [altitude, setAltitude] = useState<Altitude>('sea');
  const [activity, setActivity] = useState<Activity_>('rest');
  const [showBicarbonate, setShowBicarbonate] = useState(false);
  const [breathCount, setBreathCount] = useState(0);

  const handleReset = useCallback(() => {
    particlesRef.current = [];
    rbcRef.current = [];
    breathPhaseRef.current = 0;
    setBreathCount(0);
  }, []);

  // ---- scene layout: a blood-vessel racetrack linking lungs ↔ tissue ----
  const LOOP = { left: 340, right: 1000, top: 300, bottom: 470 };
  const EX_Y = (LOOP.top + LOOP.bottom) / 2;       // exchange height
  const ALV = { x: 210, y: EX_Y };                  // alveolar cluster centre
  const TIS = { x: 1110, y: EX_Y };                 // tissue-cell cluster centre
  // Flow order (blood direction): up the left side (oxygenates at lungs) →
  // across the top → down the right side (unloads at tissue) → across bottom.
  const segLen = [
    LOOP.bottom - LOOP.top,   // 0: left side, up
    LOOP.right - LOOP.left,   // 1: top, →
    LOOP.bottom - LOOP.top,   // 2: right side, down
    LOOP.right - LOOP.left,   // 3: bottom, ←
  ];
  const perim = segLen.reduce((a, b) => a + b, 0);
  const loopPoint = (t: number) => {
    let d = ((t % 1) + 1) % 1 * perim;
    if (d < segLen[0]) return { x: LOOP.left, y: LOOP.bottom - d };
    d -= segLen[0];
    if (d < segLen[1]) return { x: LOOP.left + d, y: LOOP.top };
    d -= segLen[1];
    if (d < segLen[2]) return { x: LOOP.right, y: LOOP.top + d };
    d -= segLen[2];
    return { x: LOOP.right - d, y: LOOP.bottom };
  };
  // oxygen fraction of blood along the loop (0 = deoxygenated, 1 = oxygenated)
  const oxyAt = (t: number) => {
    const tt = ((t % 1) + 1) % 1;
    if (tt < 0.25) return tt / 0.25;          // left side: loading O₂
    if (tt < 0.5) return 1;                    // top: oxygenated
    if (tt < 0.75) return 1 - (tt - 0.5) / 0.25; // right side: unloading
    return 0;                                  // bottom: deoxygenated
  };

  // saturation calculation
  const alveolarPO2 = ALT_META[altitude].atmosphericPO2;
  const tissuePO2 = ACT_META[activity].tissuePO2;
  const sigmoid = (po2: number, shift: number) => {
    const k = 0.1;
    const mid = 27 + shift;
    return 100 / (1 + Math.exp(-k * (po2 - mid)));
  };
  // right-shift for high pCO2 / activity
  const shiftAmount = activity === 'rest' ? 0 : activity === 'walk' ? 5 : 12;
  const alveolarSat = Math.min(99, sigmoid(alveolarPO2, 0));
  const tissueSat = Math.max(5, sigmoid(tissuePO2, shiftAmount));
  const delivery = alveolarSat - tissueSat; // % delivered to tissues

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
  }, [paused, tidalVolume, breathRate, altitude, activity, showBicarbonate]);

  const step = (dt: number) => {
    // breath cycle
    const period = 60 / Math.max(1, breathRate); // s per breath
    const prevPhase = breathPhaseRef.current;
    breathPhaseRef.current = (prevPhase + dt / period) % 1;
    if (prevPhase > 0.95 && breathPhaseRef.current < 0.05) setBreathCount(c => c + 1);

    // circulating red blood cells around the vessel loop
    if (rbcRef.current.length === 0) {
      rbcRef.current = Array.from({ length: 18 }, (_, i) => ({ t: i / 18 }));
    }
    const rbcSpeed = 0.045 + breathRate / 900; // faster breathing → faster flow
    rbcRef.current = rbcRef.current.map(r => ({ t: (r.t + dt * rbcSpeed) % 1 }));

    const jitter = (n: number) => (Math.random() - 0.5) * n;

    // ---- ALVEOLUS: O₂ diffuses IN (blood ← air), CO₂ diffuses OUT (air ← blood) ----
    // O₂ inflow scales with atmospheric/alveolar PO₂ and is gated to inspiration.
    if (breathPhaseRef.current < 0.6 && Math.random() * 100 < alveolarPO2 * 0.85) {
      particlesRef.current.push({
        x: ALV.x + 40 + jitter(20), y: ALV.y + jitter(60),
        vx: 90 + Math.random() * 30, vy: jitter(20), kind: 'o2', age: 0,
      });
    }
    // CO₂ leaving the blood into the alveolus (to be exhaled)
    if (Math.random() < 0.45) {
      particlesRef.current.push({
        x: LOOP.left - 10 + jitter(16), y: ALV.y + jitter(70),
        vx: -70 - Math.random() * 30, vy: -20 + jitter(20), kind: 'co2', age: 0,
      });
    }

    // ---- TISSUE: O₂ diffuses OUT to cells (∝ delivery), CO₂ diffuses IN from cells ----
    if (Math.random() * 100 < Math.max(6, delivery) * 1.1) {
      particlesRef.current.push({
        x: LOOP.right + 10 + jitter(16), y: TIS.y + jitter(70),
        vx: 80 + Math.random() * 30, vy: jitter(20), kind: 'o2', age: 0,
      });
    }
    if (Math.random() * 100 < ACT_META[activity].tissuePCO2) {
      particlesRef.current.push({
        x: TIS.x - 40 + jitter(20), y: TIS.y + jitter(60),
        vx: -85 - Math.random() * 30, vy: jitter(20), kind: 'co2', age: 0,
      });
    }

    // advance & cull particles
    particlesRef.current = particlesRef.current
      .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, age: p.age + dt }))
      .filter(p => p.age < 2.2 && p.x > -20 && p.x < W + 20);
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    drawVessels(ctx);
    drawThorax(ctx);
    drawAlveolarCluster(ctx);
    drawTissueCells(ctx);
    drawRBCs(ctx);
    drawDiffusion(ctx);

    if (showBicarbonate) drawBicarbonateInset(ctx);

    // breathing status (top, right of the thorax)
    const inspiring = breathPhaseRef.current < 0.5;
    ctx.textAlign = 'left';
    ctx.fillStyle = inspiring ? '#0369a1' : '#7c2d12';
    ctx.font = '700 15px Inter';
    ctx.fillText(inspiring ? 'Inspiration — diaphragm contracts & flattens, lungs expand'
                           : 'Expiration — diaphragm relaxes & domes up, lungs recoil', 430, 46);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 12px Inter';
    ctx.fillText(`Breaths ${breathCount}  ·  Rate ${breathRate}/min  ·  Tidal volume ${tidalVolume} mL`, 430, 66);

    // banner
    ctx.fillStyle = '#0c4a6e';
    ctx.font = '700 13px Inter';
    ctx.fillText('NCERT §14.4 — O₂ carried as oxyhaemoglobin · CO₂ as ~70% bicarbonate + 20–25% carbamino-Hb + ~5% plasma', 30, H - 22);
    ctx.textAlign = 'left';
  };

  // ---- blood-vessel racetrack (colour encodes oxygenation) ----
  const drawVessels = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = 'round';
    ctx.lineWidth = 26;
    // left side (up): dark → bright as it oxygenates at the lungs
    let g = ctx.createLinearGradient(0, LOOP.bottom, 0, LOOP.top);
    g.addColorStop(0, '#7f1d1d'); g.addColorStop(1, '#ef4444');
    ctx.strokeStyle = g;
    ctx.beginPath(); ctx.moveTo(LOOP.left, LOOP.bottom); ctx.lineTo(LOOP.left, LOOP.top); ctx.stroke();
    // top (oxygenated, bright)
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(LOOP.left, LOOP.top); ctx.lineTo(LOOP.right, LOOP.top); ctx.stroke();
    // right side (down): bright → dark as it unloads at the tissue
    g = ctx.createLinearGradient(0, LOOP.top, 0, LOOP.bottom);
    g.addColorStop(0, '#ef4444'); g.addColorStop(1, '#7f1d1d');
    ctx.strokeStyle = g;
    ctx.beginPath(); ctx.moveTo(LOOP.right, LOOP.top); ctx.lineTo(LOOP.right, LOOP.bottom); ctx.stroke();
    // bottom (deoxygenated, dark)
    ctx.strokeStyle = '#7f1d1d';
    ctx.beginPath(); ctx.moveTo(LOOP.right, LOOP.bottom); ctx.lineTo(LOOP.left, LOOP.bottom); ctx.stroke();
    // inner plasma sheen
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(LOOP.left, LOOP.bottom); ctx.lineTo(LOOP.left, LOOP.top);
    ctx.lineTo(LOOP.right, LOOP.top); ctx.lineTo(LOOP.right, LOOP.bottom);
    ctx.lineTo(LOOP.left, LOOP.bottom);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // flow labels
    ctx.textAlign = 'center';
    ctx.font = '700 12px Inter';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText('oxygenated blood  →  to tissues', (LOOP.left + LOOP.right) / 2, LOOP.top - 14);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillText('←  deoxygenated blood back to lungs', (LOOP.left + LOOP.right) / 2, LOOP.bottom + 24);
    ctx.textAlign = 'left';
  };

  // ---- thorax: rib cage + lungs + animated diaphragm (the ventilation pump) ----
  const drawThorax = (ctx: CanvasRenderingContext2D) => {
    const cx = 210, topY = 74;
    const inflate = breathPhaseRef.current < 0.5 ? breathPhaseRef.current * 2 : (1 - breathPhaseRef.current) * 2;
    const infl = inflate * (tidalVolume / 500);
    const lungH = 118 + infl * 20;
    const lungTop = topY + 24;
    const lungBot = lungTop + lungH;

    // trachea + bronchi
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, topY - 4);
    ctx.lineTo(cx, lungTop + 20);
    ctx.moveTo(cx, lungTop + 20); ctx.lineTo(cx - 26, lungTop + 40);
    ctx.moveTo(cx, lungTop + 20); ctx.lineTo(cx + 26, lungTop + 40);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // two lungs
    [-1, 1].forEach(side => {
      const lx = cx + side * (34 + infl * 3);
      ctx.beginPath();
      ctx.moveTo(cx + side * 8, lungTop + 12);
      ctx.quadraticCurveTo(lx + side * (54 + infl * 6), lungTop + 6, lx + side * (48 + infl * 4), (lungTop + lungBot) / 2);
      ctx.quadraticCurveTo(lx + side * (40 + infl * 4), lungBot, cx + side * 12, lungBot - 6);
      ctx.quadraticCurveTo(cx + side * 6, (lungTop + lungBot) / 2, cx + side * 8, lungTop + 12);
      const lg = ctx.createLinearGradient(0, lungTop, 0, lungBot);
      lg.addColorStop(0, '#fecdd3'); lg.addColorStop(1, '#fb7185');
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // rib cage (a few arcs over the lungs)
    ctx.strokeStyle = 'rgba(148,163,184,0.65)';
    ctx.lineWidth = 3;
    const ribShift = infl * 6; // ribs lift on inspiration
    for (let i = 0; i < 5; i++) {
      const ry = lungTop + 14 + i * (lungH - 20) / 5 - ribShift;
      ctx.beginPath();
      ctx.moveTo(cx - 92, ry + 8);
      ctx.quadraticCurveTo(cx, ry - 14 - ribShift, cx + 92, ry + 8);
      ctx.stroke();
    }

    // diaphragm — flat on inspiration, domed up on expiration
    const dphBase = lungBot + 14;
    const dome = -30 * (1 - inflate); // domes UP when relaxed (expiration)
    ctx.strokeStyle = '#9333ea';
    ctx.fillStyle = 'rgba(147,51,234,0.10)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 100, dphBase);
    ctx.quadraticCurveTo(cx, dphBase + dome, cx + 100, dphBase);
    ctx.stroke();
    ctx.lineTo(cx + 100, dphBase + 26);
    ctx.lineTo(cx - 100, dphBase + 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7e22ce';
    ctx.font = '700 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Diaphragm', cx, dphBase + 42);

    // airflow arrow at the trachea
    const inspiring = breathPhaseRef.current < 0.5;
    ctx.strokeStyle = inspiring ? '#0ea5e9' : '#f97316';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 3;
    const ay0 = topY - 30, ay1 = topY - 2;
    ctx.beginPath();
    ctx.moveTo(cx + 26, inspiring ? ay0 : ay1);
    ctx.lineTo(cx + 26, inspiring ? ay1 : ay0);
    ctx.stroke();
    const ahY = inspiring ? ay1 : ay0, adir = inspiring ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx + 26, ahY);
    ctx.lineTo(cx + 21, ahY - adir * 7);
    ctx.lineTo(cx + 31, ahY - adir * 7);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 10px Inter';
    ctx.fillText(inspiring ? 'air in' : 'air out', cx + 54, topY - 14);
    ctx.textAlign = 'left';
  };

  // ---- alveolar cluster (grape-like acinus) at the left exchange site ----
  const drawAlveolarCluster = (ctx: CanvasRenderingContext2D) => {
    const inflate = breathPhaseRef.current < 0.5 ? breathPhaseRef.current * 2 : (1 - breathPhaseRef.current) * 2;
    const grow = 1 + inflate * 0.12 * (tidalVolume / 500);
    // duct from the lungs down to the cluster
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(210, 250);
    ctx.lineTo(ALV.x, ALV.y - 66);
    ctx.stroke();
    // sacs
    const sacs = [[0, -54], [-42, -20], [40, -22], [-30, 34], [34, 34], [0, 66]];
    sacs.forEach(([dx, dy]) => {
      const sx = ALV.x + dx, sy = ALV.y + dy;
      const r = 30 * grow;
      const gg = ctx.createRadialGradient(sx - 8, sy - 8, 4, sx, sy, r);
      gg.addColorStop(0, '#fff7ed');
      gg.addColorStop(1, '#fcd9b6');
      ctx.fillStyle = gg;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    // label + values
    ctx.textAlign = 'center';
    ctx.fillStyle = '#92400e';
    ctx.font = '700 15px Inter';
    ctx.fillText('Alveoli', ALV.x, ALV.y + 108);
    ctx.fillStyle = '#475569';
    ctx.font = '600 11px Inter';
    ctx.fillText(`PO₂ ${alveolarPO2} mmHg · Hb sat ${alveolarSat.toFixed(0)}%`, ALV.x, ALV.y + 126);
    // thin respiratory membrane hint between sacs and capillary
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(LOOP.left - 26, LOOP.top - 6);
    ctx.lineTo(LOOP.left - 26, LOOP.bottom + 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = 'left';
  };

  // ---- body-tissue cells at the right exchange site ----
  const drawTissueCells = (ctx: CanvasRenderingContext2D) => {
    const cells = [[0, -46], [-40, -6], [42, -8], [-10, 40], [40, 40]];
    cells.forEach(([dx, dy]) => {
      const sx = TIS.x + dx, sy = TIS.y + dy;
      const gg = ctx.createRadialGradient(sx - 8, sy - 8, 4, sx, sy, 34);
      gg.addColorStop(0, '#fbcfe8');
      gg.addColorStop(1, '#f472b6');
      ctx.fillStyle = gg;
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 32, 27, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // nucleus
      ctx.fillStyle = 'rgba(131,24,67,0.55)';
      ctx.beginPath();
      ctx.arc(sx + 4, sy - 2, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#831843';
    ctx.font = '700 15px Inter';
    ctx.fillText('Body tissue cells', TIS.x, TIS.y + 104);
    ctx.fillStyle = '#475569';
    ctx.font = '600 11px Inter';
    ctx.fillText(`PO₂ ${tissuePO2} · pCO₂ ${ACT_META[activity].tissuePCO2} · delivered ${delivery.toFixed(0)}%`, TIS.x, TIS.y + 122);
    ctx.textAlign = 'left';
  };

  // ---- red blood cells flowing round the loop, colour = oxygenation ----
  const drawRBCs = (ctx: CanvasRenderingContext2D) => {
    for (const rbc of rbcRef.current) {
      const p = loopPoint(rbc.t);
      const p2 = loopPoint(rbc.t + 0.004);
      const ang = Math.atan2(p2.y - p.y, p2.x - p.x);
      const oxy = oxyAt(rbc.t);
      const r = Math.round(127 + (239 - 127) * oxy);
      const g = Math.round(29 + (68 - 29) * oxy);
      const b = Math.round(29 + (68 - 29) * oxy);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      // biconcave disc
      const bg = ctx.createRadialGradient(-2, -2, 1, 0, 0, 11);
      bg.addColorStop(0, `rgb(${Math.min(255, r + 40)}, ${g + 30}, ${b + 30})`);
      bg.addColorStop(1, `rgb(${r}, ${g}, ${b})`);
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // central dimple
      ctx.fillStyle = `rgba(${Math.round(r * 0.6)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.6)}, 0.6)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  // ---- O₂ / CO₂ diffusion particles + labelled arrows at both sites ----
  const drawDiffusion = (ctx: CanvasRenderingContext2D) => {
    // arrows: alveolus (O₂ in ←→ CO₂ out) and tissue (O₂ out ←→ CO₂ in)
    diffusionArrow(ctx, ALV.x + 46, ALV.y - 26, LOOP.left - 30, ALV.y - 26, '#0284c7', 'O₂ in');
    diffusionArrow(ctx, LOOP.left - 30, ALV.y + 30, ALV.x + 46, ALV.y + 30, '#c2410c', 'CO₂ out');
    diffusionArrow(ctx, LOOP.right + 30, TIS.y - 26, TIS.x - 46, TIS.y - 26, '#0284c7', 'O₂ to cells');
    diffusionArrow(ctx, TIS.x - 46, TIS.y + 30, LOOP.right + 30, TIS.y + 30, '#c2410c', 'CO₂ from cells');

    for (const p of particlesRef.current) {
      const a = Math.max(0, 1 - p.age / 2.2);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      if (p.kind === 'o2') { ctx.fillStyle = `rgba(2,132,199,${a})`; ctx.shadowColor = '#0284c7'; }
      else { ctx.fillStyle = `rgba(217,119,6,${a})`; ctx.shadowColor = '#d97706'; }
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(255,255,255,${a * 0.9})`;
      ctx.font = '700 6px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(p.kind === 'o2' ? 'O₂' : 'CO₂', p.x, p.y + 2);
      ctx.textAlign = 'left';
    }
  };

  const diffusionArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, label: string) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const dir = Math.sign(x2 - x1) || 1;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - dir * 8, y2 - 4);
    ctx.lineTo(x2 - dir * 8, y2 + 4);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, y1 - 6);
    ctx.textAlign = 'left';
  };

  const drawBicarbonateInset = (ctx: CanvasRenderingContext2D) => {
    const x = 470, y = 560, w = 340, h = 118;
    ctx.fillStyle = 'rgba(255,247,237,0.96)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    (ctx as any).roundRect ? (ctx.beginPath(), (ctx as any).roundRect(x, y, w, h, 12), ctx.fill(), ctx.stroke())
                           : (ctx.fillRect(x, y, w, h), ctx.strokeRect(x, y, w, h));
    ctx.fillStyle = '#9a3412';
    ctx.font = '700 13px Inter';
    ctx.fillText('How CO₂ travels in blood', x + 14, y + 22);
    // three proportion bars
    const rows: [string, number, string][] = [
      ['bicarbonate (HCO₃⁻)', 70, '#0ea5e9'],
      ['carbamino-Hb', 23, '#8b5cf6'],
      ['dissolved in plasma', 5, '#94a3b8'],
    ];
    rows.forEach((r, i) => {
      const ry = y + 38 + i * 20;
      ctx.fillStyle = '#475569';
      ctx.font = '600 11px Inter';
      ctx.fillText(`${r[1]}%  ${r[0]}`, x + 130, ry + 9);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(x + 14, ry, 108, 12);
      ctx.fillStyle = r[2];
      ctx.fillRect(x + 14, ry, 108 * (r[1] / 100), 12);
    });
    ctx.fillStyle = '#92400e';
    ctx.font = '600 10px Inter';
    ctx.fillText('CO₂ + H₂O ⇌ H₂CO₃ ⇌ HCO₃⁻ + H⁺   (carbonic anhydrase in RBC)', x + 14, y + h - 8);
  };

  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Oxygen Dissociation Curve</div>
          <div className="text-xs font-semibold text-slate-500">% Hb saturation vs PO₂ (mmHg)</div>
          <svg viewBox="0 0 280 180" className="mt-2 w-full">
            {/* axes */}
            <line x1="40" y1="160" x2="270" y2="160" stroke="#475569" strokeWidth="1" />
            <line x1="40" y1="160" x2="40" y2="10" stroke="#475569" strokeWidth="1" />
            {/* tick labels */}
            {[20, 40, 60, 80, 100].map(p => (
              <text key={p} x={40 + p * 2.2} y="172" fontSize="9" textAnchor="middle" fill="#64748b">{p}</text>
            ))}
            <text x="155" y="175" fontSize="10" textAnchor="middle" fill="#475569">PO₂ (mmHg)</text>
            {/* base curve */}
            <path
              d={Array.from({ length: 51 }, (_, i) => {
                const po2 = i * 2;
                const sat = sigmoid(po2, 0);
                const x = 40 + po2 * 2.2;
                const y = 160 - sat * 1.5;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none" stroke="#0891b2" strokeWidth="2"
            />
            {/* shifted curve */}
            {shiftAmount > 0 && (
              <path
                d={Array.from({ length: 51 }, (_, i) => {
                  const po2 = i * 2;
                  const sat = sigmoid(po2, shiftAmount);
                  const x = 40 + po2 * 2.2;
                  const y = 160 - sat * 1.5;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3"
              />
            )}
            {/* cursors */}
            <circle cx={40 + alveolarPO2 * 2.2} cy={160 - alveolarSat * 1.5} r="5" fill="#0891b2" />
            <text x={40 + alveolarPO2 * 2.2} y={160 - alveolarSat * 1.5 - 8} fontSize="9" textAnchor="middle" fill="#0891b2" fontWeight="700">Alveolus</text>
            <circle cx={40 + tissuePO2 * 2.2} cy={160 - tissueSat * 1.5} r="5" fill="#dc2626" />
            <text x={40 + tissuePO2 * 2.2} y={160 - tissueSat * 1.5 + 14} fontSize="9" textAnchor="middle" fill="#dc2626" fontWeight="700">Tissue</text>
          </svg>
          {shiftAmount > 0 && (
            <p className="text-[11px] text-slate-500 mt-1">Dashed = right-shifted by high pCO₂ / H⁺ / T at tissues — more O₂ unloads.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Tidal Volume</div>
          <div className="text-xs font-semibold text-slate-500">NCERT: TV ≈ 500 mL</div>
          <div className="mt-2 h-4 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-200" style={{ width: `${Math.min(100, tidalVolume / 1500 * 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-[11px] text-slate-600 font-mono">
            <span>0</span>
            <span className="font-bold">{tidalVolume} mL</span>
            <span>1500</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="text-xs font-bold text-slate-700">Delivery to tissues</div>
          <div className="font-mono text-2xl font-extrabold text-emerald-600 mt-1">{delivery.toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500">NCERT: 100 mL oxygenated blood delivers ~5 mL O₂</div>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-sky-200 bg-sky-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-sky-900">Five Steps of Respiration</div>
          <div className="text-xs font-semibold text-sky-700 mt-0.5">NCERT Ch 14 · §14.1</div>
          <ol className="mt-2 text-sm leading-snug text-sky-950 list-decimal pl-5 space-y-0.5">
            <li>Pulmonary ventilation (inspiration / expiration)</li>
            <li>O₂ / CO₂ exchange at alveoli</li>
            <li>Gas transport by blood</li>
            <li>O₂ / CO₂ exchange at tissues</li>
            <li>Cellular utilisation of O₂</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <Cell label="Altitude" value={ALT_META[altitude].label} />
            <Cell label="Atmospheric PO₂" value={`${alveolarPO2} mmHg`} />
            <Cell label="Alveolar Hb sat" value={`${alveolarSat.toFixed(0)} %`} />
            <Cell label="Tissue Hb sat" value={`${tissueSat.toFixed(0)} %`} />
            <Cell label="Activity" value={ACT_META[activity].label} />
            <Cell label="Breaths counted" value={breathCount} />
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
        <Wind size={18} className="text-sky-600" />
        <h3 className="text-sm font-bold text-slate-800">Pulmonary Ventilation Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Tidal volume</span>
            <span className="font-mono text-slate-700">{tidalVolume} mL</span>
          </label>
          <input type="range" min={200} max={1500} step={50} value={tidalVolume} onChange={e => setTidalVolume(parseInt(e.target.value))} className="w-full mt-1 accent-amber-600" />
        </div>
        <div>
          <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
            <span>Breath rate</span>
            <span className="font-mono text-slate-700">{breathRate} /min</span>
          </label>
          <input type="range" min={4} max={30} step={1} value={breathRate} onChange={e => setBreathRate(parseInt(e.target.value))} className="w-full mt-1 accent-sky-600" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1"><Mountain size={11} /> Altitude</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(Object.keys(ALT_META) as Altitude[]).map(a => (
              <button key={a} onClick={() => setAltitude(a)} className={`px-2.5 py-1.5 text-xs font-bold rounded-md ${altitude === a ? 'bg-white text-sky-700 shadow' : 'text-slate-600 hover:text-slate-800'}`}>
                {ALT_META[a].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1"><Activity size={11} /> Tissue activity</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(Object.keys(ACT_META) as Activity_[]).map(a => (
              <button key={a} onClick={() => setActivity(a)} className={`px-3 py-1.5 text-xs font-bold rounded-md ${activity === a ? 'bg-white text-rose-700 shadow' : 'text-slate-600 hover:text-slate-800'}`}>
                {ACT_META[a].label}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <input type="checkbox" checked={showBicarbonate} onChange={e => setShowBicarbonate(e.target.checked)} />
            Show CO₂ transport inset (bicarbonate / carbamino / plasma split)
          </label>
        </div>
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
  <div className="rounded-lg border border-slate-100 bg-sky-50 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-0.5 font-mono text-sm font-extrabold text-sky-700">{value}</div>
  </div>
);

export default PulmonaryVentilationLab;
