import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Apple, Pause, Play, RotateCcw, Scissors, Sprout, Sun } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface PlantHormonesTropismsLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Stage = 'coleoptile' | 'apical' | 'ripening';
type Hormone = 'auxin' | 'gibberellin' | 'cytokinin' | 'ethylene' | 'aba';

interface Fruit { id: number; x: number; y: number; ripeness: number; ripe: boolean; emitting: boolean }
interface EthMol { id: number; x: number; y: number; r: number; alpha: number }
interface AuxinMol { id: number; x: number; y: number; alpha: number }

const HORMONE_META: Record<Hormone, { label: string; color: string; light: string; effect: string }> = {
  auxin:       { label: 'Auxin (IAA)',   color: '#0891b2', light: '#cffafe', effect: 'Apical dominance, phototropism, rooting, parthenocarpy' },
  gibberellin: { label: 'Gibberellin',   color: '#7c3aed', light: '#ede9fe', effect: 'Stem elongation, bolting, grape stalk growth' },
  cytokinin:   { label: 'Cytokinin',     color: '#16a34a', light: '#dcfce7', effect: 'Cell division, lateral shoots, delay leaf senescence' },
  ethylene:    { label: 'Ethylene (C₂H₄)', color: '#d97706', light: '#fef3c7', effect: 'Fruit ripening, abscission, climacteric rise' },
  aba:         { label: 'Abscisic Acid', color: '#dc2626', light: '#fee2e2', effect: 'Stress response, abscission, dormancy' },
};

const PlantHormonesTropismsLab: React.FC<PlantHormonesTropismsLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const ethMolsRef = useRef<EthMol[]>([]);
  const auxinMolsRef = useRef<AuxinMol[]>([]);
  const fruitsRef = useRef<Fruit[]>([
    { id: 1, x: 540, y: 480, ripeness: 0, ripe: false, emitting: false },
    { id: 2, x: 620, y: 470, ripeness: 0, ripe: false, emitting: false },
    { id: 3, x: 700, y: 480, ripeness: 0, ripe: false, emitting: false },
    { id: 4, x: 460, y: 490, ripeness: 0, ripe: false, emitting: false },
    { id: 5, x: 780, y: 490, ripeness: 0, ripe: false, emitting: false },
  ]);
  const idCounterRef = useRef<number>(0);

  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState<Stage>('coleoptile');
  const [selectedHormone, setSelectedHormone] = useState<Hormone>('auxin');
  const [sunAngle, setSunAngle] = useState(0); // -1 = left, 1 = right
  const [hormoneDose, setHormoneDose] = useState(50);
  const [decapitated, setDecapitated] = useState(false);
  const [bagSealed, setBagSealed] = useState(false);
  const [coleoptileBend, setColeoptileBend] = useState(0);

  const handleReset = useCallback(() => {
    ethMolsRef.current = [];
    auxinMolsRef.current = [];
    fruitsRef.current = fruitsRef.current.map(f => ({ ...f, ripeness: 0, ripe: false, emitting: false }));
    setSunAngle(0);
    setHormoneDose(50);
    setDecapitated(false);
    setBagSealed(false);
    setColeoptileBend(0);
  }, []);

  // clear transient particles when the demonstration stage changes
  useEffect(() => {
    ethMolsRef.current = [];
    auxinMolsRef.current = [];
  }, [stage]);

  // animation loop
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
  }, [paused, stage, selectedHormone, sunAngle, hormoneDose, decapitated, bagSealed]);

  const step = (dt: number) => {
    if (stage === 'coleoptile') {
      // bend toward sun smoothly
      const targetBend = sunAngle * 35;
      setColeoptileBend(b => b + (targetBend - b) * dt * 1.5);
      // spawn auxin molecules on shaded side
      if (Math.random() < 0.6) {
        const cx = 640 + sunAngle * -40;
        auxinMolsRef.current.push({
          id: ++idCounterRef.current,
          x: cx + (Math.random() - 0.5) * 30,
          y: 280 + Math.random() * 200,
          alpha: 1,
        });
      }
      auxinMolsRef.current = auxinMolsRef.current
        .map(a => ({ ...a, alpha: a.alpha - dt * 0.6 }))
        .filter(a => a.alpha > 0);
    } else if (stage === 'apical') {
      // auxin streams DOWN the stem from an intact apex when it dominates
      const auxinHigh = !decapitated && selectedHormone === 'auxin' && hormoneDose > 30;
      if (auxinHigh && Math.random() < 0.7) {
        auxinMolsRef.current.push({
          id: ++idCounterRef.current,
          x: 640,
          y: 214 + Math.random() * 8,
          alpha: 1,
        });
      }
      auxinMolsRef.current = auxinMolsRef.current
        .map(a => ({ ...a, y: a.y + 90 * dt, alpha: a.y > 540 ? a.alpha - dt * 1.2 : a.alpha }))
        .filter(a => a.alpha > 0 && a.y < 600);
    } else if (stage === 'ripening') {
      // emit ethylene from emitting fruits
      for (const f of fruitsRef.current) {
        if (f.emitting && Math.random() < 0.4) {
          ethMolsRef.current.push({
            id: ++idCounterRef.current,
            x: f.x,
            y: f.y,
            r: 0,
            alpha: 1,
          });
        }
        if (f.ripe && !f.emitting) {
          f.emitting = true;
        }
      }
      // ethylene molecules expand (visual gas clouds)
      ethMolsRef.current = ethMolsRef.current
        .map(e => ({ ...e, r: e.r + 80 * dt, alpha: e.alpha - dt * 0.3 }))
        .filter(e => e.alpha > 0);
      // ripen neighbours by ethylene diffusion — the closer to an emitting
      // fruit, the faster it ripens (sealed bag concentrates the gas).
      const emitters = fruitsRef.current.filter(f => f.emitting);
      if (emitters.length) {
        const reach = bagSealed ? 620 : 300;      // gas spreads further when trapped
        const rate = bagSealed ? 0.55 : 0.32;     // and ripens faster
        for (const f of fruitsRef.current) {
          if (f.ripeness >= 1) continue;
          let nearest = Infinity;
          for (const e of emitters) {
            if (e === f) continue;
            nearest = Math.min(nearest, Math.hypot(f.x - e.x, f.y - e.y));
          }
          if (nearest < reach) {
            const proximity = 1 - nearest / reach; // 0 far → 1 close
            f.ripeness = Math.min(1, f.ripeness + dt * rate * (0.35 + proximity));
            if (f.ripeness >= 1) { f.ripe = true; f.emitting = true; }
          }
        }
      }
    }
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    if (stage === 'coleoptile') drawColeoptile(ctx);
    else if (stage === 'apical') drawApical(ctx);
    else drawRipening(ctx);
  };

  // ---------- shared curve helpers (organic tapered stems) ----------
  const quadPt = (t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) => {
    const mt = 1 - t;
    return { x: mt * mt * x0 + 2 * mt * t * x1 + t * t * x2, y: mt * mt * y0 + 2 * mt * t * y1 + t * t * y2 };
  };
  const quadTan = (t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) => {
    const mt = 1 - t;
    return { x: 2 * mt * (x1 - x0) + 2 * t * (x2 - x1), y: 2 * mt * (y1 - y0) + 2 * t * (y2 - y1) };
  };

  // A realistic tapered, veined leaf on a short petiole.
  const drawLeaf = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, size = 1, hue = '#22c55e') => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dir > 0 ? -0.5 : 0.5 + Math.PI);
    const L = 30 * size, Wd = 13 * size;
    const g = ctx.createLinearGradient(0, -Wd, 0, Wd);
    g.addColorStop(0, '#4ade80');
    g.addColorStop(1, hue);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(L * 0.5, -Wd, L, 0);
    ctx.quadraticCurveTo(L * 0.5, Wd, 0, 0);
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1;
    ctx.stroke();
    // midrib + veins
    ctx.strokeStyle = 'rgba(21,128,61,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(L - 2, 0);
    for (let i = 1; i <= 3; i++) {
      const px = (L / 4) * i;
      ctx.moveTo(px, 0); ctx.lineTo(px - 6, -Wd * 0.5 * (1 - i / 5));
      ctx.moveTo(px, 0); ctx.lineTo(px - 6, Wd * 0.5 * (1 - i / 5));
    }
    ctx.stroke();
    ctx.restore();
  };

  const drawColeoptile = (ctx: CanvasRenderingContext2D) => {
    // sky wash → white
    const sky = ctx.createLinearGradient(0, 0, 0, 600);
    sky.addColorStop(0, '#eff6ff');
    sky.addColorStop(1, '#ffffff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 600);

    // ---- sun with rays + light cone ----
    const sunX = 640 + sunAngle * 470;
    const sunY = 120;
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.strokeStyle = 'rgba(251,191,36,0.55)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(46, 0);
      ctx.lineTo(64, 0);
      ctx.stroke();
    }
    ctx.restore();
    const sg = ctx.createRadialGradient(sunX - 8, sunY - 8, 4, sunX, sunY, 42);
    sg.addColorStop(0, '#fffbeb');
    sg.addColorStop(0.6, '#fde047');
    sg.addColorStop(1, '#f59e0b');
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 30;
    ctx.fill();
    ctx.shadowBlur = 0;

    // soft directional light cone from sun toward the seedling
    const coneGrad = ctx.createLinearGradient(sunX, sunY, 640, 560);
    coneGrad.addColorStop(0, 'rgba(253,224,71,0.35)');
    coneGrad.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(sunX - 34, sunY + 20);
    ctx.lineTo(560, 590);
    ctx.lineTo(720, 590);
    ctx.lineTo(sunX + 34, sunY + 20);
    ctx.closePath();
    ctx.fill();

    // ---- soil ----
    const soilY = 600;
    const soil = ctx.createLinearGradient(0, soilY, 0, H);
    soil.addColorStop(0, '#a9743f');
    soil.addColorStop(1, '#6f4522');
    ctx.fillStyle = soil;
    ctx.fillRect(0, soilY, W, H - soilY);
    ctx.fillStyle = '#c68a4e';
    ctx.fillRect(0, soilY, W, 5);
    ctx.fillStyle = 'rgba(60,36,16,0.35)';
    for (let i = 0; i < 90; i++) {
      const sx = (i * 137) % W;
      const sy = soilY + 12 + ((i * 53) % (H - soilY - 16));
      ctx.beginPath();
      ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- coleoptile: organic tapered sheath bending toward light ----
    const bx = 640, by = 608;
    const tipX = 640 + coleoptileBend, tipY = 268;
    const cx = 640 + coleoptileBend * 0.55, cy = 440;
    const litRight = sunAngle >= 0;
    const N = 26;
    const leftPts: { x: number; y: number }[] = [];
    const rightPts: { x: number; y: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = quadPt(t, bx, by, cx, cy, tipX, tipY);
      const tan = quadTan(t, bx, by, cx, cy, tipX, tipY);
      const len = Math.hypot(tan.x, tan.y) || 1;
      const nx = -tan.y / len, ny = tan.x / len;
      const half = (30 - 15 * t) / 2;
      leftPts.push({ x: p.x + nx * half, y: p.y + ny * half });
      rightPts.push({ x: p.x - nx * half, y: p.y - ny * half });
    }
    // body path
    ctx.beginPath();
    ctx.moveTo(leftPts[0].x, leftPts[0].y);
    for (let i = 1; i <= N; i++) ctx.lineTo(leftPts[i].x, leftPts[i].y);
    for (let i = N; i >= 0; i--) ctx.lineTo(rightPts[i].x, rightPts[i].y);
    ctx.closePath();
    const minX = Math.min(bx, tipX) - 22, maxX = Math.max(bx, tipX) + 22;
    const bodyGrad = ctx.createLinearGradient(minX, 0, maxX, 0);
    if (litRight) {
      bodyGrad.addColorStop(0, '#166534');
      bodyGrad.addColorStop(0.5, '#22c55e');
      bodyGrad.addColorStop(1, '#86efac');
    } else {
      bodyGrad.addColorStop(0, '#86efac');
      bodyGrad.addColorStop(0.5, '#22c55e');
      bodyGrad.addColorStop(1, '#166534');
    }
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // cell striations across the sheath (denser on lit side, elongated on shaded)
    ctx.strokeStyle = 'rgba(20,83,45,0.30)';
    ctx.lineWidth = 1;
    for (let i = 2; i < N; i += 2) {
      ctx.beginPath();
      ctx.moveTo(leftPts[i].x, leftPts[i].y);
      ctx.lineTo(rightPts[i].x, rightPts[i].y);
      ctx.stroke();
    }
    // highlight elongated cells on the shaded side
    const shadedPts = litRight ? leftPts : rightPts;
    ctx.fillStyle = 'rgba(6,95,70,0.35)';
    for (let i = 4; i < N - 2; i += 3) {
      const a = shadedPts[i], b2 = shadedPts[i + 2];
      ctx.beginPath();
      ctx.ellipse((a.x + b2.x) / 2, (a.y + b2.y) / 2, 4, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // rounded coleoptile tip cap
    ctx.beginPath();
    ctx.ellipse(tipX, tipY, 11, 14, coleoptileBend * 0.004, 0, Math.PI * 2);
    ctx.fillStyle = '#15803d';
    ctx.fill();

    // ---- auxin (glowing cyan) accumulating on the shaded side ----
    for (const a of auxinMolsRef.current) {
      const rg = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 6);
      rg.addColorStop(0, `rgba(103,232,249,${a.alpha})`);
      rg.addColorStop(1, `rgba(8,145,178,0)`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(8,145,178,${a.alpha})`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- annotations ----
    // "light" arrow from sun toward tip
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 16px Inter';
    ctx.fillText(`Bend: ${Math.round(Math.abs(coleoptileBend) / 35 * 30)}° toward light`, 30, 34);
    // shaded-side callout
    const calloutX = litRight ? tipX - 120 : tipX + 40;
    ctx.fillStyle = '#0e7490';
    ctx.font = '700 12px Inter';
    ctx.fillText('↑ more auxin here', calloutX, 360);
    ctx.fillStyle = '#065f46';
    ctx.font = '600 11px Inter';
    ctx.fillText('shaded cells elongate', calloutX, 378);

    ctx.fillStyle = '#0e7490';
    ctx.font = '600 13px Inter';
    ctx.fillText('Auxin (IAA) made at the tip migrates down the shaded side → those cells elongate → stem bends toward light.', 300, 60);
    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px Inter';
    ctx.fillText("Darwin (1880): the tip is the source of the 'transmittable influence' (NCERT Fig 13.10).", 300, 78);
  };

  const drawApical = (ctx: CanvasRenderingContext2D) => {
    // ground + terracotta pot
    const soilY = 600;
    const ground = ctx.createLinearGradient(0, soilY, 0, H);
    ground.addColorStop(0, '#f1f5f9');
    ground.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = ground;
    ctx.fillRect(0, soilY, W, H - soilY);
    const baseX = 640;
    // pot
    const potTop = 596, potBot = 690, potHalfTop = 92, potHalfBot = 66;
    const potGrad = ctx.createLinearGradient(baseX - potHalfTop, 0, baseX + potHalfTop, 0);
    potGrad.addColorStop(0, '#b45309');
    potGrad.addColorStop(0.5, '#ea9a52');
    potGrad.addColorStop(1, '#9a3412');
    ctx.fillStyle = potGrad;
    ctx.beginPath();
    ctx.moveTo(baseX - potHalfTop, potTop);
    ctx.lineTo(baseX + potHalfTop, potTop);
    ctx.lineTo(baseX + potHalfBot, potBot);
    ctx.lineTo(baseX - potHalfBot, potBot);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(baseX - potHalfTop - 4, potTop - 12, potHalfTop * 2 + 8, 14);
    // soil in pot
    ctx.fillStyle = '#5b3a1a';
    ctx.beginPath();
    ctx.ellipse(baseX, potTop - 4, potHalfTop - 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- main stem (tapered, slight natural sway) ----
    const baseY = potTop - 6;
    const apexY = decapitated ? 348 : 210;
    const swayC = baseX + 10;
    const N = 20;
    const lp: { x: number; y: number }[] = [];
    const rp: { x: number; y: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = quadPt(t, baseX, baseY, swayC, (baseY + apexY) / 2, baseX, apexY);
      const tan = quadTan(t, baseX, baseY, swayC, (baseY + apexY) / 2, baseX, apexY);
      const len = Math.hypot(tan.x, tan.y) || 1;
      const nx = -tan.y / len, ny = tan.x / len;
      const half = (18 - 9 * t) / 2;
      lp.push({ x: p.x + nx * half, y: p.y + ny * half });
      rp.push({ x: p.x - nx * half, y: p.y - ny * half });
    }
    ctx.beginPath();
    ctx.moveTo(lp[0].x, lp[0].y);
    for (let i = 1; i <= N; i++) ctx.lineTo(lp[i].x, lp[i].y);
    for (let i = N; i >= 0; i--) ctx.lineTo(rp[i].x, rp[i].y);
    ctx.closePath();
    const stemGrad = ctx.createLinearGradient(baseX - 12, 0, baseX + 12, 0);
    stemGrad.addColorStop(0, '#15803d');
    stemGrad.addColorStop(0.5, '#22c55e');
    stemGrad.addColorStop(1, '#166534');
    ctx.fillStyle = stemGrad;
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1;
    ctx.stroke();

    // determine lateral bud activity (NCERT: auxin suppresses, cytokinin/decapitation release)
    const auxinHigh = !decapitated && selectedHormone === 'auxin' && hormoneDose > 30;
    const cytokininActive = selectedHormone === 'cytokinin' && hormoneDose > 30;
    const lateralsBloom = decapitated || cytokininActive || (selectedHormone !== 'auxin' && !auxinHigh);

    // auxin streaming down from an intact apex when it dominates
    if (auxinHigh) {
      for (const a of auxinMolsRef.current) {
        ctx.fillStyle = `rgba(8,145,178,${a.alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(baseX + (a.id % 2 ? 3 : -3), a.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ---- apical bud OR cut surface ----
    if (decapitated) {
      ctx.fillStyle = '#a16207';
      ctx.beginPath();
      ctx.ellipse(baseX, apexY, 8, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(baseX - 16, apexY - 10);
      ctx.lineTo(baseX + 16, apexY - 22);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.font = '700 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('✂ decapitated', baseX, apexY - 30);
      ctx.textAlign = 'left';
    } else {
      // teardrop bud with young leaves
      const budActive = auxinHigh;
      const budGrad = ctx.createRadialGradient(baseX - 4, apexY - 6, 2, baseX, apexY, 20);
      budGrad.addColorStop(0, budActive ? '#67e8f9' : '#86efac');
      budGrad.addColorStop(1, budActive ? '#0891b2' : '#16a34a');
      ctx.fillStyle = budGrad;
      ctx.beginPath();
      ctx.moveTo(baseX, apexY - 26);
      ctx.quadraticCurveTo(baseX + 15, apexY - 6, baseX, apexY + 12);
      ctx.quadraticCurveTo(baseX - 15, apexY - 6, baseX, apexY - 26);
      ctx.fill();
      drawLeaf(ctx, baseX - 6, apexY - 4, -1, 0.55);
      drawLeaf(ctx, baseX + 6, apexY - 4, 1, 0.55);
      if (budActive) {
        ctx.fillStyle = '#0e7490';
        ctx.font = '700 10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('high auxin', baseX, apexY - 34);
        ctx.textAlign = 'left';
      }
    }

    // ---- lateral shoots at nodes ----
    const heights = [300, 400, 500];
    heights.forEach((ly, idx) => {
      const bloom = lateralsBloom && (cytokininActive || decapitated || idx < 2);
      const side = (s: -1 | 1) => {
        const dir = s;
        // node bump
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(baseX + dir * 5, ly, 4, 0, Math.PI * 2);
        ctx.fill();
        if (bloom) {
          // grown branch (tapered) with leaf cluster
          const ex = baseX + dir * 92, ey = ly - 34;
          const bl0 = { x: baseX + dir * 6, y: ly };
          const blc = { x: baseX + dir * 55, y: ly - 8 };
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(bl0.x, bl0.y);
          ctx.quadraticCurveTo(blc.x, blc.y, ex, ey);
          ctx.stroke();
          ctx.lineCap = 'butt';
          drawLeaf(ctx, ex, ey, dir, 0.95);
          drawLeaf(ctx, ex - dir * 22, ey + 10, dir, 0.75);
          drawLeaf(ctx, ex - dir * 10, ey - 14, dir, 0.7);
        } else {
          // dormant bud (small, dim)
          ctx.fillStyle = '#86efac';
          ctx.beginPath();
          ctx.ellipse(baseX + dir * 12, ly - 2, 7, 4.5, dir * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#4d7c0f';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      };
      side(-1); side(1);
    });

    // ---- status banner ----
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 16px Inter';
    if (decapitated) {
      ctx.fillText('Apical bud removed → lateral buds bloom (apical dominance lifted)', 30, 34);
    } else if (cytokininActive) {
      ctx.fillText('Cytokinin antagonises auxin → laterals bloom despite the intact tip', 30, 34);
    } else if (auxinHigh) {
      ctx.fillText('High auxin from the apical bud → lateral buds stay dormant', 30, 34);
    } else {
      ctx.fillText('Adjust the hormone dose or decapitate to change apical dominance', 30, 34);
    }
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#64748b';
    ctx.fillText('NCERT §13.4.3.1 — decapitation is widely applied in tea plantations and hedge-making.', 30, 52);
  };

  const drawRipening = (ctx: CanvasRenderingContext2D) => {
    // wooden table wash
    const table = ctx.createLinearGradient(0, 470, 0, H);
    table.addColorStop(0, '#fef9f3');
    table.addColorStop(1, '#f5e9db');
    ctx.fillStyle = table;
    ctx.fillRect(0, 470, W, H - 470);

    // ---- glass bowl (back rim behind fruit, front rim over) ----
    const bcx = 640, bcy = 512;
    ctx.fillStyle = 'rgba(148,163,184,0.18)';
    ctx.beginPath();
    ctx.ellipse(bcx, bcy, 300, 46, 0, Math.PI, 2 * Math.PI);
    ctx.fill();

    // ethylene gas clouds (soft radial puffs) — drawn behind fruit
    for (const e of ethMolsRef.current) {
      const rg = ctx.createRadialGradient(e.x, e.y, e.r * 0.2, e.x, e.y, Math.max(1, e.r));
      rg.addColorStop(0, `rgba(132,204,22,${e.alpha * 0.16})`);
      rg.addColorStop(0.7, `rgba(163,230,53,${e.alpha * 0.10})`);
      rg.addColorStop(1, 'rgba(163,230,53,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(e.x, e.y, Math.max(1, e.r), 0, Math.PI * 2);
      ctx.fill();
    }

    // fruits (sorted so back ones draw first)
    [...fruitsRef.current].sort((a, b) => a.y - b.y).forEach(f => drawFruit(ctx, f));

    // front bowl wall (glassy, semi-transparent over fruit bases)
    const bowlGrad = ctx.createLinearGradient(bcx, bcy - 20, bcx, bcy + 90);
    bowlGrad.addColorStop(0, 'rgba(191,219,254,0.28)');
    bowlGrad.addColorStop(1, 'rgba(148,163,184,0.42)');
    ctx.fillStyle = bowlGrad;
    ctx.beginPath();
    ctx.ellipse(bcx, bcy, 300, 46, 0, 0, Math.PI);
    ctx.lineTo(bcx - 232, bcy);
    ctx.ellipse(bcx, bcy + 8, 232, 90, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,116,139,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(bcx, bcy, 300, 46, 0, 0, Math.PI * 2);
    ctx.stroke();
    // rim highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(bcx, bcy, 300, 46, 0, Math.PI * 1.05, Math.PI * 1.55);
    ctx.stroke();

    // ---- sealed bag overlay ----
    if (bagSealed) {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
      roundRect(ctx, 330, 350, 620, 240, 34);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      // reflective streak
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(400, 366);
      ctx.lineTo(460, 574);
      ctx.stroke();
      ctx.fillStyle = '#0c4a6e';
      ctx.font = '700 13px Inter';
      ctx.fillText('Sealed — ethylene trapped, ripening accelerated', 348, 375);
    }

    // ---- ripeness legend (top-right) ----
    const lx = 928, ly = 26, lw = 320, lh = 92;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    roundRect(ctx, lx, ly, lw, lh, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 11px Inter';
    ctx.fillText('Fruit colour = ripeness', lx + 12, ly + 18);
    // gradient bar green → yellow → red
    const barX = lx + 12, barY = ly + 28, barW = lw - 24, barH = 12;
    const rg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    rg.addColorStop(0, 'rgb(74,160,60)');
    rg.addColorStop(0.5, 'rgb(250,204,21)');
    rg.addColorStop(1, 'rgb(220,38,38)');
    ctx.fillStyle = rg;
    roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();
    // stage labels under the bar
    ctx.font = '600 10px Inter';
    ctx.fillStyle = '#166534';
    ctx.fillText('unripe', barX, barY + barH + 14);
    ctx.fillStyle = '#a16207';
    ctx.textAlign = 'center';
    ctx.fillText('ripening', barX + barW / 2, barY + barH + 14);
    ctx.fillStyle = '#991b1b';
    ctx.textAlign = 'right';
    ctx.fillText('ripe', barX + barW, barY + barH + 14);
    ctx.textAlign = 'left';
    // overripe + ethylene keys
    ctx.fillStyle = 'rgb(200,40,40)';
    ctx.beginPath(); ctx.arc(barX + 6, ly + lh - 12, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(92,46,20,0.7)';
    ctx.beginPath(); ctx.arc(barX + 4, ly + lh - 13, 1.6, 0, Math.PI * 2);
    ctx.arc(barX + 8, ly + lh - 10, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.font = '600 10px Inter';
    ctx.fillText('overripe (brown spots)', barX + 16, ly + lh - 8);
    const eKeyX = barX + 176;
    const erg = ctx.createRadialGradient(eKeyX, ly + lh - 12, 0, eKeyX, ly + lh - 12, 7);
    erg.addColorStop(0, 'rgba(132,204,22,0.4)');
    erg.addColorStop(1, 'rgba(163,230,53,0)');
    ctx.fillStyle = erg;
    ctx.beginPath(); ctx.arc(eKeyX, ly + lh - 12, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillText('ethylene gas', eKeyX + 12, ly + lh - 8);

    // ---- banner ----
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 16px Inter';
    ctx.fillText('Ethylene (gaseous PGR) — fruit ripening & the respiratory climacteric', 30, 34);
    ctx.font = '500 12px Inter';
    ctx.fillStyle = '#64748b';
    ctx.fillText('NCERT §13.4.3.4 — click any fruit to ripen it; one ripe fruit spreads ethylene to the rest. Seal the bag to trap the gas.', 30, 52);
  };

  const drawFruit = (ctx: CanvasRenderingContext2D, f: Fruit) => {
    // green → yellow → red interpolation
    let r: number, g: number, b: number;
    if (f.ripeness < 0.5) {
      const t = f.ripeness * 2;
      r = Math.round(74 + (250 - 74) * t);
      g = Math.round(160 + (204 - 160) * t);
      b = Math.round(60 + (21 - 60) * t);
    } else {
      const t = (f.ripeness - 0.5) * 2;
      r = Math.round(250 + (220 - 250) * t);
      g = Math.round(204 + (38 - 204) * t);
      b = Math.round(21 + (38 - 21) * t);
    }
    const base = `rgb(${r}, ${g}, ${b})`;
    const rad = 30;

    // soft contact shadow in bowl
    ctx.fillStyle = 'rgba(51,65,85,0.18)';
    ctx.beginPath();
    ctx.ellipse(f.x, f.y + rad + 4, rad * 0.85, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // apple body with two lobes + shaded gradient
    const bodyGrad = ctx.createRadialGradient(f.x - 9, f.y - 10, 4, f.x, f.y, rad + 6);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.18, base);
    bodyGrad.addColorStop(1, `rgb(${Math.round(r * 0.72)}, ${Math.round(g * 0.72)}, ${Math.round(b * 0.72)})`);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y - rad + 6);
    ctx.bezierCurveTo(f.x - rad * 1.15, f.y - rad, f.x - rad * 1.1, f.y + rad, f.x, f.y + rad * 0.92);
    ctx.bezierCurveTo(f.x + rad * 1.1, f.y + rad, f.x + rad * 1.15, f.y - rad, f.x, f.y - rad + 6);
    ctx.fill();
    // top dimple
    ctx.fillStyle = `rgb(${Math.round(r * 0.6)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.6)})`;
    ctx.beginPath();
    ctx.ellipse(f.x, f.y - rad + 8, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(f.x - 10, f.y - 9, 6, 9, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // brown senescence spots when overripe
    if (f.ripeness > 0.88) {
      ctx.fillStyle = 'rgba(92,46,20,0.6)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(f.x + (i - 1) * 9, f.y + 6 + (i % 2) * 6, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // stem + leaf
    ctx.strokeStyle = '#6b3f1d';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(f.x, f.y - rad + 6);
    ctx.quadraticCurveTo(f.x + 3, f.y - rad - 8, f.x + 7, f.y - rad - 12);
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.save();
    ctx.translate(f.x + 8, f.y - rad - 8);
    ctx.rotate(-0.5);
    const lg = ctx.createLinearGradient(0, -5, 0, 5);
    lg.addColorStop(0, '#4ade80');
    lg.addColorStop(1, '#16a34a');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(9, -7, 18, 0);
    ctx.quadraticCurveTo(9, 7, 0, 0);
    ctx.fill();
    ctx.restore();

    // climacteric heartbeat pulse near an emitting fruit
    if (f.emitting) {
      const beat = 0.5 + Math.sin(performance.now() / 220) * 0.5;
      ctx.strokeStyle = `rgba(132,204,22,${0.25 + beat * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, rad + 6 + beat * 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // click handler for ripening fruits
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stage !== 'ripening') return;
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (const f of fruitsRef.current) {
      if (Math.hypot(f.x - x, f.y - y) < 32) {
        f.ripeness = 1;
        f.ripe = true;
        f.emitting = true;
        break;
      }
    }
  };

  // PANELS
  const graphPanel = (
    <aside className="pointer-events-auto absolute right-[calc(100%+14px)] top-0 bottom-0 z-20 hidden w-[340px] 2xl:block overflow-y-auto pr-1">
      <div className="flex flex-col gap-2.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Discovery Timeline</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">NCERT §13.4.2</div>
          <ul className="mt-3 text-xs space-y-2 leading-snug">
            <li><b className="text-cyan-700">1880 · Darwin</b> — Coleoptile bends toward light. Tip is the source.</li>
            <li><b className="text-violet-700">1926 · Kurosawa</b> — <i>Gibberella fujikuroi</i> filtrate → "bakanae" / gibberellins.</li>
            <li><b className="text-emerald-700">1955 · Miller</b> — Kinetin from autoclaved DNA → cytokinins.</li>
            <li><b className="text-amber-700">1910 · Cousins</b> — Ripe oranges hasten banana ripening → ethylene.</li>
            <li><b className="text-red-700">1960s</b> — Inhibitor-B / abscission II / dormin → all = ABA.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="text-base font-extrabold text-slate-900">Hormone Cheat Sheet</div>
          <div className="mt-2 space-y-1.5">
            {(Object.keys(HORMONE_META) as Hormone[]).map(h => (
              <div key={h} className="rounded-md px-2 py-1.5 text-xs" style={{ background: HORMONE_META[h].light, color: HORMONE_META[h].color }}>
                <div className="font-extrabold">{HORMONE_META[h].label}</div>
                <div className="text-[10.5px] opacity-80 mt-0.5">{HORMONE_META[h].effect}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );

  const valuesPanel = (
    <aside className="pointer-events-auto absolute left-[calc(100%+18px)] top-0 bottom-0 z-20 hidden w-[310px] 2xl:block overflow-y-auto pl-1">
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 shadow-xl backdrop-blur">
          <div className="text-base font-extrabold text-emerald-900">Plant Growth Regulators</div>
          <div className="text-xs font-semibold text-emerald-700 mt-0.5">NCERT Ch 13 · §13.4</div>
          <p className="text-sm leading-snug text-emerald-950 mt-2">
            "Small, simple molecules of diverse chemical composition" — also called plant hormones / phytohormones.
            Two groups: <b>promoters</b> (auxin, GA, cytokinin) and <b>inhibitors</b> (ABA; ethylene fits either but is "largely an inhibitor").
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">Real-time values</div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 animate-pulse">LIVE</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg border border-slate-100 bg-cyan-50 px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Stage</div>
              <div className="mt-0.5 font-mono text-sm font-extrabold text-cyan-700">
                {stage === 'coleoptile' ? 'Darwin Coleoptile' : stage === 'apical' ? 'Apical Dominance' : 'Fruit Ripening'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Selected hormone</div>
              <div className="mt-0.5 font-mono text-sm font-extrabold" style={{ color: HORMONE_META[selectedHormone].color }}>
                {HORMONE_META[selectedHormone].label}
              </div>
            </div>
            {stage === 'ripening' && (
              <div className="rounded-lg border border-slate-100 bg-emerald-50 px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ripe fruits</div>
                <div className="mt-0.5 font-mono text-base font-extrabold text-emerald-700">
                  {fruitsRef.current.filter(f => f.ripeness >= 1).length} / {fruitsRef.current.length}
                </div>
              </div>
            )}
            {stage === 'coleoptile' && (
              <div className="rounded-lg border border-slate-100 bg-amber-50 px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Sun position</div>
                <div className="mt-0.5 font-mono text-sm font-extrabold text-amber-700">
                  {sunAngle < -0.1 ? '◀ Left' : sunAngle > 0.1 ? 'Right ▶' : 'Centre'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" onClick={handleCanvasClick} />
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
        <Sprout size={18} className="text-emerald-600" />
        <h3 className="text-sm font-bold text-slate-800">Plant Hormones & Tropisms Bench</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Stage</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['coleoptile', 'apical', 'ripening'] as Stage[]).map(s => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  stage === s ? 'bg-white text-emerald-700 shadow' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {s === 'coleoptile' ? 'A · Coleoptile' : s === 'apical' ? 'B · Apical' : 'C · Ripening'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Hormone palette</label>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(Object.keys(HORMONE_META) as Hormone[]).map(h => (
              <button
                key={h}
                onClick={() => setSelectedHormone(h)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-colors ${
                  selectedHormone === h ? 'shadow-inner' : 'hover:opacity-80'
                }`}
                style={{
                  background: selectedHormone === h ? HORMONE_META[h].color : HORMONE_META[h].light,
                  color: selectedHormone === h ? '#ffffff' : HORMONE_META[h].color,
                  borderColor: HORMONE_META[h].color,
                }}
              >
                {HORMONE_META[h].label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {stage === 'coleoptile' && (
          <div className="md:col-span-2">
            <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
              <span><Sun size={11} className="inline" /> Sun direction</span>
              <span className="font-mono text-slate-700">{sunAngle < 0 ? `${Math.round(sunAngle * -100)}% Left` : sunAngle > 0 ? `${Math.round(sunAngle * 100)}% Right` : 'Centre'}</span>
            </label>
            <input
              type="range" min={-1} max={1} step={0.05} value={sunAngle}
              onChange={e => setSunAngle(parseFloat(e.target.value))}
              className="w-full mt-1 accent-amber-500"
            />
          </div>
        )}

        {stage === 'apical' && (
          <>
            <div>
              <label className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wide">
                <span>Hormone dose</span>
                <span className="font-mono text-slate-700">{hormoneDose}%</span>
              </label>
              <input
                type="range" min={0} max={100} step={5} value={hormoneDose}
                onChange={e => setHormoneDose(parseInt(e.target.value))}
                className="w-full mt-1 accent-cyan-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Apical bud</label>
              <button
                onClick={() => setDecapitated(d => !d)}
                className={`mt-1.5 w-full px-3 py-2 text-xs font-bold rounded-md border ${
                  decapitated ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Scissors size={12} className="inline mr-1" /> {decapitated ? 'Restore tip' : 'Decapitate'}
              </button>
            </div>
          </>
        )}

        {stage === 'ripening' && (
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Ethylene containment</label>
            <button
              onClick={() => setBagSealed(b => !b)}
              className={`mt-1.5 w-full px-3 py-2 text-xs font-bold rounded-md border ${
                bagSealed ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Apple size={12} className="inline mr-1" /> {bagSealed ? '🛍 Sealed bag — release' : 'Seal in bag'}
            </button>
          </div>
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

export default PlantHormonesTropismsLab;
