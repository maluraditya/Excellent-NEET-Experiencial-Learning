import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import TopicLayoutContainer from '../../TopicLayoutContainer';

interface EndocrineGlandsLabProps { topic: any; onExit: () => void }

const W = 1280;
const H = 760;

type Sex = 'M' | 'F';
type Gland = 'hypothalamus' | 'pituitary' | 'pineal' | 'thyroid' | 'parathyroid' | 'thymus' | 'adrenal' | 'pancreas' | 'testis' | 'ovary' | 'heart' | 'kidney';
type Scenario = 'rest' | 'stress' | 'fed' | 'fasting' | 'cold' | 'puberty';

const BODY_X: Record<Sex, number> = { M: 472, F: 733 };

const GLAND_META: Record<Gland, { label: string; hormones: string[]; targets: string[]; color: string }> = {
  hypothalamus: { label: 'Hypothalamus', hormones: ['GnRH', 'TRH', 'CRH', 'GHRH', 'Somatostatin'], targets: ['Pituitary'], color: '#6d28d9' },
  pituitary: { label: 'Pituitary', hormones: ['GH', 'PRL', 'TSH', 'ACTH', 'LH', 'FSH', 'MSH', 'Oxytocin', 'ADH'], targets: ['Thyroid', 'Adrenal', 'Gonads'], color: '#0284c7' },
  pineal: { label: 'Pineal', hormones: ['Melatonin'], targets: ['Sleep-wake cycle'], color: '#1d4ed8' },
  thyroid: { label: 'Thyroid', hormones: ['T3', 'T4', 'Thyrocalcitonin'], targets: ['All tissues - BMR'], color: '#dc2626' },
  parathyroid: { label: 'Parathyroid', hormones: ['PTH'], targets: ['Bones, kidney - blood Ca2+'], color: '#991b1b' },
  thymus: { label: 'Thymus', hormones: ['Thymosins'], targets: ['T-lymphocytes'], color: '#b45309' },
  adrenal: { label: 'Adrenal glands', hormones: ['Epinephrine', 'Norepinephrine', 'Cortisol', 'Aldosterone'], targets: ['Heart', 'Blood vessels', 'Metabolism'], color: '#ea580c' },
  pancreas: { label: 'Pancreas', hormones: ['Insulin', 'Glucagon'], targets: ['Liver', 'Muscle', 'Blood glucose'], color: '#16a34a' },
  testis: { label: 'Testes', hormones: ['Androgens', 'Testosterone'], targets: ['Male accessory organs'], color: '#0369a1' },
  ovary: { label: 'Ovaries', hormones: ['Estrogen', 'Progesterone'], targets: ['Female accessory organs'], color: '#be185d' },
  heart: { label: 'Heart atria', hormones: ['ANF'], targets: ['Blood pressure'], color: '#9f1239' },
  kidney: { label: 'Kidney JG cells', hormones: ['Erythropoietin'], targets: ['Bone marrow - RBCs'], color: '#92400e' },
};

const GLAND_OFFSET: Record<Gland, { x: number; y: number }> = {
  pineal: { x: 7, y: 102 },
  hypothalamus: { x: -2, y: 118 },
  pituitary: { x: 4, y: 139 },
  thyroid: { x: 0, y: 202 },
  parathyroid: { x: 18, y: 204 },
  thymus: { x: 0, y: 248 },
  heart: { x: -18, y: 282 },
  adrenal: { x: -32, y: 352 },
  kidney: { x: 36, y: 370 },
  pancreas: { x: 12, y: 390 },
  ovary: { x: 0, y: 448 },
  testis: { x: 0, y: 492 },
};

const LABEL_LAYOUT: Record<Gland, { side: 'L' | 'R'; ly: number }> = {
  pineal: { side: 'L', ly: 92 },
  hypothalamus: { side: 'L', ly: 144 },
  pituitary: { side: 'L', ly: 196 },
  thyroid: { side: 'L', ly: 256 },
  heart: { side: 'L', ly: 318 },
  adrenal: { side: 'L', ly: 382 },
  testis: { side: 'L', ly: 500 },
  parathyroid: { side: 'R', ly: 184 },
  thymus: { side: 'R', ly: 244 },
  pancreas: { side: 'R', ly: 310 },
  kidney: { side: 'R', ly: 376 },
  ovary: { side: 'R', ly: 500 },
};

type Pulse = {
  id: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  progress: number;
  color: string;
  label: string;
};

const getGlandPosition = (gland: Gland, sex: Sex) => ({
  x: BODY_X[sex] + GLAND_OFFSET[gland].x,
  y: GLAND_OFFSET[gland].y,
});

const isGlandVisibleForSex = (gland: Gland, sex: Sex) => {
  if (gland === 'testis') return sex === 'M';
  if (gland === 'ovary') return sex === 'F';
  return true;
};

const targetZone = (sex: Sex, gland: Gland) => {
  const sideOffset = sex === 'M' ? -142 : 142;
  const y = gland === 'testis' ? 600 : gland === 'ovary' ? 540 : getGlandPosition(gland, sex).y;
  return { x: BODY_X[sex] + sideOffset, y };
};

const EndocrineGlandsLab: React.FC<EndocrineGlandsLabProps> = ({ topic, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const pulsesRef = useRef<Pulse[]>([]);
  const idRef = useRef(0);
  const scenarioTimerRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [focusGland, setFocusGland] = useState<Gland>('pituitary');
  const [scenario, setScenario] = useState<Scenario>('rest');
  const [sex, setSex] = useState<Sex>('F');
  const [autoFire, setAutoFire] = useState(true);

  const handleReset = useCallback(() => {
    pulsesRef.current = [];
    scenarioTimerRef.current = 0;
  }, []);

  const fireHormone = (from: Gland, to: { x: number; y: number }, color: string, label: string, sourceSex: Sex = sex) => {
    pulsesRef.current.push({
      id: ++idRef.current,
      from: getGlandPosition(from, sourceSex),
      to,
      progress: 0,
      color,
      label,
    });
  };

  const runScenario = useCallback(() => {
    const activeSex = sex;
    const source = (gland: Gland) => getGlandPosition(gland, activeSex);
    const target = (gland: Gland) => targetZone(activeSex, gland);

    if (scenario === 'stress') {
      fireHormone('hypothalamus', source('pituitary'), '#6d28d9', 'CRH', activeSex);
      setTimeout(() => fireHormone('pituitary', source('adrenal'), '#0284c7', 'ACTH', activeSex), 700);
      setTimeout(() => fireHormone('adrenal', target('adrenal'), '#ea580c', 'Cortisol', activeSex), 1450);
      setTimeout(() => fireHormone('adrenal', { x: target('heart').x, y: 292 }, '#dc2626', 'Adrenaline', activeSex), 1650);
    } else if (scenario === 'fed') {
      fireHormone('pancreas', target('pancreas'), '#16a34a', 'Insulin', activeSex);
    } else if (scenario === 'fasting') {
      fireHormone('pancreas', target('pancreas'), '#d97706', 'Glucagon', activeSex);
    } else if (scenario === 'cold') {
      fireHormone('hypothalamus', source('pituitary'), '#6d28d9', 'TRH', activeSex);
      setTimeout(() => fireHormone('pituitary', source('thyroid'), '#0284c7', 'TSH', activeSex), 700);
      setTimeout(() => fireHormone('thyroid', target('thyroid'), '#dc2626', 'T3/T4 heat', activeSex), 1450);
    } else if (scenario === 'puberty') {
      const gonad: Gland = activeSex === 'M' ? 'testis' : 'ovary';
      fireHormone('hypothalamus', source('pituitary'), '#6d28d9', 'GnRH', activeSex);
      setTimeout(() => fireHormone('pituitary', source(gonad), '#0284c7', 'LH/FSH', activeSex), 700);
      setTimeout(() => fireHormone(gonad, target(gonad), GLAND_META[gonad].color, activeSex === 'M' ? 'Testosterone' : 'Estrogen', activeSex), 1450);
    } else {
      const glands: Gland[] = ['pituitary', 'thyroid', 'pancreas'];
      const gland = glands[Math.floor(Math.random() * glands.length)];
      fireHormone(gland, target(gland), GLAND_META[gland].color, GLAND_META[gland].hormones[0], activeSex);
    }
  }, [scenario, sex]);

  useEffect(() => {
    const tick = (now: number) => {
      const dt = Math.min(60, now - (lastRef.current || now));
      lastRef.current = now;
      if (!paused) step(dt / 1000);
      draw();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, focusGland, scenario, sex, autoFire, runScenario]);

  const step = (dt: number) => {
    scenarioTimerRef.current += dt;
    if (autoFire && scenarioTimerRef.current > 4) {
      runScenario();
      scenarioTimerRef.current = 0;
    }
    pulsesRef.current = pulsesRef.current
      .map(pulse => ({ ...pulse, progress: pulse.progress + dt * 0.56 }))
      .filter(pulse => pulse.progress < 1.12);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;

    for (const bodySex of ['M', 'F'] as Sex[]) {
      for (const gland of Object.keys(GLAND_META) as Gland[]) {
        if (!isGlandVisibleForSex(gland, bodySex)) continue;
        const point = getGlandPosition(gland, bodySex);
        if (Math.hypot(point.x - x, point.y - y) < 18) {
          setSex(bodySex);
          setFocusGland(gland);
          fireHormone(gland, targetZone(bodySex, gland), GLAND_META[gland].color, GLAND_META[gland].hormones[0], bodySex);
          return;
        }
      }
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx);
    drawTitle(ctx);
    drawBodyPlate(ctx, 'M');
    drawBodyPlate(ctx, 'F');
    drawSharedAxis(ctx);

    for (const gland of Object.keys(GLAND_META) as Gland[]) {
      drawGlandLabel(ctx, gland);
    }

    drawPulses(ctx);
    drawLegend(ctx);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#f8fbff');
    bg.addColorStop(0.42, '#ffffff');
    bg.addColorStop(1, '#eef7f5');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  };

  const drawTitle = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 26px Inter, Arial, sans-serif';
    ctx.fillText('Human Endocrine System - male and female anatomical map', 34, 42);
    ctx.font = '600 13px Inter, Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('NCERT Class 11: ductless glands release trace chemical messengers into blood for distant target organs.', 34, 65);

    ctx.fillStyle = '#ecfeff';
    roundRect(ctx, 912, 26, 315, 42, 14);
    ctx.fill();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = '#0e7490';
    ctx.font = '800 12px Inter, Arial, sans-serif';
    ctx.fillText('Click any gland marker to emit its hormone signal', 930, 52);
  };

  const drawBodyPlate = (ctx: CanvasRenderingContext2D, bodySex: Sex) => {
    const cx = BODY_X[bodySex];
    const isActive = bodySex === sex;

    ctx.save();
    ctx.shadowColor = isActive ? 'rgba(14, 165, 233, 0.24)' : 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = isActive ? 22 : 12;
    ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.72)';
    roundRect(ctx, cx - 118, 78, 236, 625, 28);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = isActive ? '#38bdf8' : '#cbd5e1';
    ctx.lineWidth = isActive ? 2.2 : 1.2;
    roundRect(ctx, cx - 118, 78, 236, 625, 28);
    ctx.stroke();

    drawAnatomicalBody(ctx, cx, bodySex, isActive);
    drawOrgans(ctx, cx, bodySex, isActive);
    drawMarkersOnBody(ctx, bodySex, isActive);

    ctx.fillStyle = isActive ? '#0e7490' : '#64748b';
    ctx.font = '900 16px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bodySex === 'M' ? 'MALE' : 'FEMALE', cx, 728);
    ctx.font = '600 11px Inter, Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(bodySex === 'M' ? 'Testes shown for gonads' : 'Ovaries shown for gonads', cx, 745);
    ctx.textAlign = 'left';
  };

  const drawAnatomicalBody = (ctx: CanvasRenderingContext2D, cx: number, bodySex: Sex, isActive: boolean) => {
    const isF = bodySex === 'F';
    const shoulderHalf = isF ? 63 : 74;
    const waistHalf = isF ? 38 : 50;
    const hipHalf = isF ? 66 : 54;
    const alpha = isActive ? 1 : 0.64;

    const skin = ctx.createLinearGradient(cx - 95, 0, cx + 95, 0);
    skin.addColorStop(0, `rgba(180, 116, 78, ${alpha})`);
    skin.addColorStop(0.34, `rgba(240, 194, 161, ${alpha})`);
    skin.addColorStop(0.64, `rgba(251, 218, 191, ${alpha})`);
    skin.addColorStop(1, `rgba(178, 111, 72, ${alpha})`);
    ctx.fillStyle = skin;
    ctx.strokeStyle = skin;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.lineWidth = isF ? 28 : 34;
    ctx.beginPath();
    ctx.moveTo(cx - 20, 426);
    ctx.bezierCurveTo(cx - 30, 500, cx - 39, 600, cx - 42, 676);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 20, 426);
    ctx.bezierCurveTo(cx + 30, 500, cx + 39, 600, cx + 42, 676);
    ctx.stroke();

    ctx.lineWidth = isF ? 18 : 22;
    ctx.beginPath();
    ctx.moveTo(cx - shoulderHalf + 10, 212);
    ctx.bezierCurveTo(cx - shoulderHalf - 20, 282, cx - shoulderHalf - 20, 354, cx - shoulderHalf - 5, 431);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + shoulderHalf - 10, 212);
    ctx.bezierCurveTo(cx + shoulderHalf + 20, 282, cx + shoulderHalf + 20, 354, cx + shoulderHalf + 5, 431);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - shoulderHalf, 214);
    ctx.bezierCurveTo(cx - waistHalf - 12, 245, cx - waistHalf - 8, 324, cx - waistHalf, 362);
    ctx.bezierCurveTo(cx - hipHalf, 402, cx - hipHalf, 462, cx - 28, 486);
    ctx.lineTo(cx + 28, 486);
    ctx.bezierCurveTo(cx + hipHalf, 462, cx + hipHalf, 402, cx + waistHalf, 362);
    ctx.bezierCurveTo(cx + waistHalf + 8, 324, cx + waistHalf + 12, 245, cx + shoulderHalf, 214);
    ctx.bezierCurveTo(cx + 38, 196, cx - 38, 196, cx - shoulderHalf, 214);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(cx - 15, 164, 30, 53);
    ctx.beginPath();
    ctx.ellipse(cx, 126, 31, 39, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = isActive ? 0.42 : 0.24;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(cx - 48, 225);
    ctx.bezierCurveTo(cx - 36, 292, cx - 42, 362, cx - 26, 428);
    ctx.bezierCurveTo(cx - 10, 442, cx + 10, 442, cx + 26, 428);
    ctx.bezierCurveTo(cx + 42, 362, cx + 36, 292, cx + 48, 225);
    ctx.bezierCurveTo(cx + 24, 214, cx - 24, 214, cx - 48, 225);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = `rgba(120, 72, 50, ${isActive ? 0.45 : 0.24})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx, 228);
    ctx.bezierCurveTo(cx - 18, 306, cx - 12, 386, cx, 462);
    ctx.bezierCurveTo(cx + 12, 386, cx + 18, 306, cx, 228);
    ctx.stroke();

    ctx.fillStyle = isF ? '#4b2e24' : '#2f2119';
    if (isF) {
      ctx.beginPath();
      ctx.moveTo(cx - 31, 116);
      ctx.bezierCurveTo(cx - 54, 158, cx - 48, 214, cx - 31, 239);
      ctx.bezierCurveTo(cx - 25, 194, cx - 27, 152, cx - 16, 118);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 31, 116);
      ctx.bezierCurveTo(cx + 54, 158, cx + 48, 214, cx + 31, 239);
      ctx.bezierCurveTo(cx + 25, 194, cx + 27, 152, cx + 16, 118);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(cx - 31, 124);
    ctx.bezierCurveTo(cx - 34, 86, cx + 34, 86, cx + 31, 124);
    ctx.bezierCurveTo(cx + 16, 104, cx - 16, 104, cx - 31, 124);
    ctx.fill();

    ctx.fillStyle = '#5b3a2a';
    ctx.beginPath();
    ctx.arc(cx - 10, 138, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + 10, 138, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(91,58,42,0.52)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(cx, 151, 5, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
  };

  const drawOrgans = (ctx: CanvasRenderingContext2D, cx: number, bodySex: Sex, isActive: boolean) => {
    const alpha = isActive ? 1 : 0.6;
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = '#f4a7c4';
    ctx.beginPath();
    ctx.ellipse(cx, 103, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bf6f92';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.arc(cx + i * 8, 101, 4.4, 0.1, Math.PI - 0.15);
      ctx.stroke();
    }

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(cx - 11, 202, 8, 14, 0.28, 0, Math.PI * 2);
    ctx.ellipse(cx + 11, 202, 8, 14, -0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 6, 198, 12, 8);
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(cx + 14, 197, 2.4, 0, Math.PI * 2);
    ctx.arc(cx + 14, 208, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d6a34b';
    ctx.beginPath();
    ctx.moveTo(cx, 236);
    ctx.bezierCurveTo(cx - 23, 245, cx - 19, 273, cx - 5, 278);
    ctx.bezierCurveTo(cx + 4, 263, cx + 3, 247, cx, 236);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, 236);
    ctx.bezierCurveTo(cx + 23, 245, cx + 19, 273, cx + 5, 278);
    ctx.bezierCurveTo(cx - 4, 263, cx - 3, 247, cx, 236);
    ctx.fill();

    ctx.fillStyle = '#b3123c';
    ctx.beginPath();
    ctx.moveTo(cx - 12, 284);
    ctx.bezierCurveTo(cx - 30, 258, cx - 5, 253, cx - 12, 274);
    ctx.bezierCurveTo(cx - 8, 251, cx + 27, 259, cx - 12, 304);
    ctx.bezierCurveTo(cx - 6, 291, cx - 24, 292, cx - 12, 284);
    ctx.fill();

    [-1, 1].forEach(side => {
      const kx = cx + side * 36;
      ctx.fillStyle = '#845536';
      ctx.beginPath();
      ctx.moveTo(kx, 356);
      ctx.bezierCurveTo(kx + side * 17, 359, kx + side * 17, 388, kx, 389);
      ctx.bezierCurveTo(kx - side * 7, 382, kx - side * 7, 362, kx, 356);
      ctx.fill();
      ctx.fillStyle = '#ea8b34';
      ctx.beginPath();
      ctx.moveTo(kx - 9, 350);
      ctx.quadraticCurveTo(kx, 337, kx + 9, 350);
      ctx.quadraticCurveTo(kx, 347, kx - 9, 350);
      ctx.fill();
    });

    ctx.fillStyle = '#e2a15f';
    ctx.beginPath();
    ctx.moveTo(cx - 13, 384);
    ctx.bezierCurveTo(cx + 18, 376, cx + 51, 387, cx + 56, 401);
    ctx.bezierCurveTo(cx + 30, 396, cx + 3, 399, cx - 12, 395);
    ctx.bezierCurveTo(cx - 20, 392, cx - 19, 386, cx - 13, 384);
    ctx.fill();

    if (bodySex === 'F') {
      ctx.fillStyle = '#eaa2b9';
      ctx.beginPath();
      ctx.moveTo(cx, 431);
      ctx.bezierCurveTo(cx + 18, 443, cx + 14, 464, cx, 468);
      ctx.bezierCurveTo(cx - 14, 464, cx - 18, 443, cx, 431);
      ctx.fill();
      ctx.strokeStyle = '#c45f87';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 4, 441);
      ctx.quadraticCurveTo(cx - 20, 435, cx - 31, 447);
      ctx.moveTo(cx + 4, 441);
      ctx.quadraticCurveTo(cx + 20, 435, cx + 31, 447);
      ctx.stroke();
      ctx.fillStyle = '#c45f87';
      ctx.beginPath();
      ctx.ellipse(cx - 31, 448, 7, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 31, 448, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#e8bfa3';
      ctx.beginPath();
      ctx.ellipse(cx, 492, 21, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c98a6a';
      ctx.beginPath();
      ctx.ellipse(cx - 8, 492, 6, 9, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 8, 492, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawMarkersOnBody = (ctx: CanvasRenderingContext2D, bodySex: Sex, isActiveBody: boolean) => {
    for (const gland of Object.keys(GLAND_META) as Gland[]) {
      if (!isGlandVisibleForSex(gland, bodySex)) continue;
      const point = getGlandPosition(gland, bodySex);
      const meta = GLAND_META[gland];
      const focused = focusGland === gland && sex === bodySex;
      ctx.save();
      if (focused) {
        ctx.shadowColor = meta.color;
        ctx.shadowBlur = 16;
      }
      ctx.globalAlpha = isActiveBody || focused ? 1 : 0.56;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, focused ? 12 : 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = meta.color;
      ctx.lineWidth = focused ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle = meta.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, focused ? 4.2 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const drawGlandLabel = (ctx: CanvasRenderingContext2D, gland: Gland) => {
    const meta = GLAND_META[gland];
    const layout = LABEL_LAYOUT[gland];
    const sourceSex: Sex = gland === 'testis' ? 'M' : gland === 'ovary' ? 'F' : sex;
    const point = getGlandPosition(gland, sourceSex);
    const focused = focusGland === gland;
    const chipW = 245;
    const chipH = 44;
    const chipX = layout.side === 'L' ? 34 : 1001;
    const chipY = layout.ly;
    const anchorX = layout.side === 'L' ? chipX + chipW : chipX;
    const anchorY = chipY + chipH / 2;

    ctx.strokeStyle = focused ? meta.color : 'rgba(100, 116, 139, 0.34)';
    ctx.lineWidth = focused ? 2.4 : 1.3;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.bezierCurveTo(
      layout.side === 'L' ? point.x - 70 : point.x + 70,
      point.y,
      layout.side === 'L' ? anchorX + 55 : anchorX - 55,
      anchorY,
      anchorX,
      anchorY
    );
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = focused ? 'rgba(15, 23, 42, 0.14)' : 'rgba(15, 23, 42, 0.06)';
    ctx.shadowBlur = focused ? 14 : 7;
    ctx.fillStyle = focused ? '#ffffff' : 'rgba(248, 250, 252, 0.94)';
    roundRect(ctx, chipX, chipY, chipW, chipH, 12);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = focused ? meta.color : '#dbe4ef';
    ctx.lineWidth = focused ? 2.4 : 1;
    roundRect(ctx, chipX, chipY, chipW, chipH, 12);
    ctx.stroke();

    ctx.fillStyle = meta.color;
    ctx.beginPath();
    ctx.arc(chipX + 18, chipY + 22, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 13px Inter, Arial, sans-serif';
    ctx.fillText(meta.label, chipX + 33, chipY + 18);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 10.5px Inter, Arial, sans-serif';
    ctx.fillText(meta.hormones.slice(0, 3).join(', '), chipX + 33, chipY + 34);
  };

  const drawSharedAxis = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(14, 116, 144, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(BODY_X.M + 92, 136);
    ctx.bezierCurveTo(590, 122, 615, 122, BODY_X.F - 92, 136);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(236, 254, 255, 0.96)';
    roundRect(ctx, 538, 91, 130, 54, 14);
    ctx.fill();
    ctx.strokeStyle = '#67e8f9';
    ctx.stroke();
    ctx.fillStyle = '#155e75';
    ctx.font = '800 11px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Same gland map', 603, 113);
    ctx.font = '600 10px Inter, Arial, sans-serif';
    ctx.fillText('sex differs mainly', 603, 130);
    ctx.fillText('at the gonads', 603, 143);
    ctx.textAlign = 'left';
    ctx.restore();
  };

  const drawPulses = (ctx: CanvasRenderingContext2D) => {
    for (const pulse of pulsesRef.current) {
      const eased = Math.min(1, pulse.progress);
      const x = pulse.from.x + (pulse.to.x - pulse.from.x) * eased;
      const y = pulse.from.y + (pulse.to.y - pulse.from.y) * eased;

      ctx.strokeStyle = `${pulse.color}66`;
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(pulse.from.x, pulse.from.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      ctx.save();
      ctx.shadowColor = pulse.color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = pulse.color;
      ctx.beginPath();
      ctx.arc(x, y, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = pulse.color;
      ctx.font = '800 11px Inter, Arial, sans-serif';
      ctx.fillText(pulse.label, x + 12, y + 4);
    }
  };

  const drawLegend = (ctx: CanvasRenderingContext2D) => {
    const meta = GLAND_META[focusGland];
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    roundRect(ctx, 468, 660, 356, 44, 16);
    ctx.fill();
    ctx.fillStyle = meta.color;
    ctx.beginPath();
    ctx.arc(493, 682, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 12px Inter, Arial, sans-serif';
    ctx.fillText(`Focused: ${meta.label}`, 510, 677);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 10.5px Inter, Arial, sans-serif';
    ctx.fillText(`${meta.hormones.slice(0, 4).join(', ')} -> ${meta.targets.slice(0, 2).join(', ')}`, 510, 694);
    ctx.restore();
  };

  const simulationCombo = (
    <div className="relative h-full w-full overflow-visible rounded-2xl bg-white shadow-inner">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="absolute inset-0 h-full w-full cursor-crosshair"
          onClick={handleCanvasClick}
          aria-label="Interactive anatomical infographic of male and female endocrine glands"
        />
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setPaused(value => !value)}
            className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50"
            aria-label={paused ? 'Play endocrine animation' : 'Pause endocrine animation'}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow hover:bg-slate-50"
            aria-label="Reset endocrine animation"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  const controlsComponent = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow">
      <div className="mb-3 flex items-center gap-2">
        <Activity size={18} className="text-cyan-600" />
        <h3 className="text-sm font-bold text-slate-800">Endocrine Infographic Bench</h3>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-700">
          <Sparkles size={12} />
          anatomy view
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Scenario</label>
          <div className="mt-1.5 inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
            {(['rest', 'stress', 'fed', 'fasting', 'cold', 'puberty'] as Scenario[]).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setScenario(item)}
                className={`rounded-md px-2.5 py-1 text-xs font-bold ${scenario === item ? 'bg-white text-cyan-700 shadow' : 'text-slate-600 hover:bg-white/60'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Active body</label>
          <div className="mt-1.5 inline-flex rounded-lg bg-slate-100 p-1">
            {(['M', 'F'] as const).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setSex(item)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold ${sex === item ? 'bg-white text-cyan-700 shadow' : 'text-slate-600 hover:bg-white/60'}`}
              >
                {item === 'M' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button type="button" onClick={runScenario} className="rounded-md bg-cyan-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-cyan-700">
            Run scenario
          </button>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <input type="checkbox" checked={autoFire} onChange={event => setAutoFire(event.target.checked)} />
            Auto-replay
          </label>
          <span className="text-[11px] font-semibold text-slate-500">
            Click a marker on either body to focus that gland and release its first hormone.
          </span>
        </div>
      </div>
    </div>
  );

  return <TopicLayoutContainer topic={topic} onExit={onExit} SimulationComponent={simulationCombo} ControlsComponent={controlsComponent} />;
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
};

export default EndocrineGlandsLab;
